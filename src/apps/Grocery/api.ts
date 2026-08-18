import { XMLParser } from 'fast-xml-parser';
import type { Category, GroceryItem, RegionOption } from './groceryData';
import { REGION_ALL, FALLBACK_REGIONS } from './groceryData';

const API_KEY =
  import.meta.env.VITE_GROCERY_API_KEY ||
  'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';

const API_BASE = import.meta.env.DEV
  ? '/grocery-api/B551919/ProductPriceInfoService'
  : 'https://apis.data.go.kr/B551919/ProductPriceInfoService';

const PORTAL_BASE = import.meta.env.DEV ? '/price-portal' : 'https://www.price.go.kr';

const PRICE_CONCURRENCY = 6;
const CODE_LIST_CONCURRENCY = 6;
const MAX_STORES_PER_REGION = 8;
const MAX_STORES_NATIONAL = 8;
/** 개별 HTTP 요청 타임아웃 (ms) — 무한 로딩 방지 */
const FETCH_TIMEOUT_MS = 15000;

export interface CatalogResult {
  items: GroceryItem[];
  regions: RegionOption[];
  inspectDay: string | null;
  storeCount: number;
  productCount: number;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function getRecentFridays(count: number): string[] {
  const fridays: string[] = [];
  const cursor = new Date();
  while (fridays.length < count) {
    if (cursor.getDay() === 5) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      fridays.push(`${yyyy}${mm}${dd}`);
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return fridays;
}

function formatDay(raw?: string | number): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw);
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function buildGwUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const parts: string[] = [`serviceKey=${API_KEY}`];
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return `${API_BASE}${path}?${parts.join('&')}`;
}

function padCode(code: string | number | undefined | null, width = 9): string {
  if (code == null || code === '') return '';
  const s = String(code).trim();
  if (/^\d+$/.test(s) && s.length < width) return s.padStart(width, '0');
  return s;
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchXml(url: string): Promise<unknown> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
  }).parse(text);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  );
  return results;
}

function mapCategory(smlcls: string, name: string): Category {
  const n = name.toLowerCase();
  if (/우유|두유|요거트|요구르트|치즈|버터|마가린|계란|달걀|란\b/.test(n)) return '유제품/계란';
  if (/라면|과자|음료|주스|콜라|사이다|커피|차\b|스낵|캔디|초콜릿|아이스크림|맥주|소주|막걸리|에너지|게토|포카리|비타/.test(n)) {
    return '간식/음료';
  }
  if (smlcls.startsWith('030102') || smlcls.startsWith('030104') || smlcls.startsWith('030105')) {
    return '과일/채소';
  }
  if (smlcls.startsWith('030101') || smlcls.startsWith('030103')) return '정육/수산';
  if (smlcls.startsWith('0303') || /세제|샴푸|치약|휴지|티슈|비누|로션|고무장갑|락스|섬유|마스크|면도/.test(n)) {
    return '생필품';
  }
  if (smlcls.startsWith('0302')) return '간식/음료';
  return '기타';
}

function pickIcon(name: string, category: Category): string {
  const n = name.replace(/\s/g, '');
  // Fruits - specific matches first
  if (/바나나/.test(n)) return '🍌';
  if (/딸기/.test(n)) return '🍓';
  if (/수박/.test(n)) return '🍉';
  if (/토마토/.test(n)) return '🍅';
  if (/귤|오렌지/.test(n)) return '🍊';
  if (/포도/.test(n)) return '🍇';
  if (/복숭아|망고/.test(n)) return '🍑';
  if (/체리/.test(n)) return '🍒';
  if (/키위/.test(n)) return '🥝';
  if (/사과|배\b/.test(n)) return '🍎';
  // Vegetables
  if (/양파|마늘|대파|감자|고구마|당근|무\b|배추|시금치|상추|버섯|호박|오이|고추/.test(n)) return '🥬';
  // Meat & Eggs - separate eggs from meat
  if (/계란|달걀/.test(n)) return '🥚';
  if (/닭/.test(n)) return '🍗';
  if (/삼겹|목살|돼지고기|소고기|쇠고기/.test(n)) return '🥩';
  // Seafood
  if (/고등어|갈치|오징어|생선|참치|어묵|맛살/.test(n)) return '🐟';
  // Dairy
  if (/우유|두유|요거트|치즈/.test(n)) return '🥛';
  // Noodles & Rice
  if (/라면|국수|면\b/.test(n)) return '🍜';
  if (/쌀|밥|햇반/.test(n)) return '🍚';
  if (/빵|식빵|베이글/.test(n)) return '🍞';
  // Drinks
  if (/콜라|사이다|음료|주스|커피/.test(n)) return '🥤';
  if (/맥주|소주|막걸리|와인/.test(n)) return '🍺';
  if (/물\b|생수|삼다|아이시스/.test(n)) return '💧';
  // Snacks
  if (/과자|칩|파이|쿠키|캔디|초콜릿/.test(n)) return '🍪';
  // Household
  if (/세제|샴푸|비누|치약|휴지|티슈/.test(n)) return '🧴';
  // Category fallback
  switch (category) {
    case '과일/채소':
      return '🥦';
    case '정육/수산':
      return '🍖';
    case '유제품/계란':
      return '🥚';
    case '간식/음료':
      return '🧃';
    case '생필품':
      return '🧼';
    default:
      return '🛒';
  }
}

function formatUnit(item: {
  goodTotalCnt?: string | number;
  goodTotalDivCode?: string;
  goodBaseCnt?: string | number;
  detailMean?: string;
}): string {
  if (item.detailMean && String(item.detailMean).trim()) return String(item.detailMean).trim();
  const cnt = item.goodTotalCnt != null ? String(item.goodTotalCnt) : '';
  const div = String(item.goodTotalDivCode || '').toUpperCase();
  const unitMap: Record<string, string> = {
    G: 'g',
    KG: 'kg',
    ML: 'ml',
    L: 'L',
    EA: '개',
    DA: '단',
  };
  const u = unitMap[div] || div || '';
  if (cnt && u) return `${cnt}${u}`;
  if (cnt) return cnt;
  return '1개';
}

function productImageUrl(fileRgtnSeq: string | number | undefined): string | undefined {
  if (fileRgtnSeq == null || fileRgtnSeq === '') return undefined;
  return `https://www.price.go.kr/tprice/common/file/file_down.do?fileRgtnSeq=${fileRgtnSeq}`;
}

async function resolveInspectDay(sampleGoodId: string): Promise<string | null> {
  // 최근 6주만 확인 (느린 순차 호출 최소화)
  for (const day of getRecentFridays(6)) {
    try {
      const obj = (await fetchXml(
        buildGwUrl('/getProductPriceInfoSvc', { goodInspectDay: day, goodId: sampleGoodId })
      )) as { response?: { result?: Record<string, unknown> } };
      const items = asArray(
        obj?.response?.result?.['iros.openapi.service.vo.goodPriceVO'] as
          | { goodPrice?: string | number }
          | Array<{ goodPrice?: string | number }>
          | undefined
      );
      if (items.some((x) => x?.goodPrice != null)) return day;
    } catch {
      /* next */
    }
  }
  return null;
}

/** 가격이 있는 상품의 소분류만 이미지 맵 조회 (백그라운드용) */
export async function fetchProductImageMap(
  smlclsCodes: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(smlclsCodes.filter(Boolean)));
  if (unique.length === 0) return map;

  await mapPool(unique, CODE_LIST_CONCURRENCY, async (code) => {
    try {
      const url = `${PORTAL_BASE}/tprice/portal/dailynecessitypriceinfo/priceiteminfo/getGoodCodeList.do?goodSmlclsCode=${encodeURIComponent(code)}`;
      const res = await fetchWithTimeout(url, 10000);
      if (!res.ok) return;
      const text = await res.text();
      if (!text || !text.trim().startsWith('{')) return;
      const data = JSON.parse(text) as {
        json?: Array<{ CODE?: string | number; FILERGTNSEQ?: string | number; fileRgtnSeq?: string | number }>;
      };
      for (const row of data.json || []) {
        const goodId = row.CODE != null ? String(row.CODE) : '';
        const seq = row.FILERGTNSEQ ?? row.fileRgtnSeq;
        if (goodId && seq != null && String(seq) !== '') {
          map.set(goodId, String(seq));
        }
      }
    } catch {
      /* skip failed class — do not block catalog */
    }
  });

  return map;
}

function pickStoresForRegion(
  stores: Array<{
    entpId: string;
    entpName: string;
    entpTypeCode?: string;
    entpAreaCode?: string;
  }>,
  areaCode: string
): typeof stores {
  const targetArea = padCode(areaCode, 9);
  const filtered =
    areaCode === REGION_ALL
      ? stores
      : stores.filter((s) => padCode(s.entpAreaCode, 9) === targetArea);

  const lm = filtered.filter((s) => s.entpTypeCode === 'LM');
  const sm = filtered.filter((s) => s.entpTypeCode === 'SM');
  const rest = filtered.filter((s) => s.entpTypeCode !== 'LM' && s.entpTypeCode !== 'SM');
  const ordered = [...lm, ...sm, ...rest];
  const limit = areaCode === REGION_ALL ? MAX_STORES_NATIONAL : MAX_STORES_PER_REGION;

  if (areaCode === REGION_ALL) {
    const byArea = new Map<string, typeof stores>();
    for (const s of ordered) {
      const key = s.entpAreaCode || 'unknown';
      const list = byArea.get(key) || [];
      if (list.length < 1) {
        list.push(s);
        byArea.set(key, list);
      }
    }
    const spread = Array.from(byArea.values()).flat();
    return (spread.length >= 4 ? spread : ordered).slice(0, limit);
  }

  return ordered.slice(0, limit);
}

type PriceRow = {
  goodId: string;
  price: number;
  entpId: string;
  inspectDay?: string;
  isDiscount: boolean;
  isPlusOne: boolean;
  discountStart?: string;
  discountEnd?: string;
};

type ProductRow = {
  goodId: string;
  goodName: string;
  smlcls: string;
  unit: string;
};

/**
 * 참가격 GW 카탈로그 로드 (가격 우선, 이미지는 별도 로드)
 */
export async function fetchPriceCatalog(areaCode: string = REGION_ALL): Promise<CatalogResult> {
  const empty: CatalogResult = {
    items: [],
    regions: [],
    inspectDay: null,
    storeCount: 0,
    productCount: 0,
  };

  try {
    // 1) 상품·매장·지역 병렬 로드
    const [productObj, storeObj, arObj] = await Promise.all([
      fetchXml(buildGwUrl('/getProductInfoSvc.do')),
      fetchXml(buildGwUrl('/getStoreInfoSvc.do')),
      fetchXml(buildGwUrl('/getStandardInfoSvc.do', { classCode: 'AR' })).catch(() => null),
    ]);

    const productItems = asArray(
      (productObj as { response?: { result?: { item?: unknown } } })?.response?.result?.item as
        | Record<string, string | number | undefined>
        | Array<Record<string, string | number | undefined>>
        | undefined
    );

    const products: ProductRow[] = productItems
      .filter((p) => p?.goodId != null && p?.goodName)
      .map((p) => ({
        goodId: String(p.goodId),
        goodName: String(p.goodName),
        smlcls: padCode(p.goodSmlclsCode, 9),
        unit: formatUnit(p as { goodTotalCnt?: string | number; goodTotalDivCode?: string; detailMean?: string }),
      }));

    if (products.length === 0) return empty;

    const storeItems = asArray(
      (storeObj as { response?: { result?: Record<string, unknown> } })?.response?.result?.[
        'iros.openapi.service.vo.entpInfoVO'
      ] as
        | Record<string, string | number | undefined>
        | Array<Record<string, string | number | undefined>>
        | undefined
    );
    const stores = storeItems
      .filter((s) => s?.entpId != null && s?.entpName)
      .map((s) => ({
        entpId: String(s.entpId),
        entpName: String(s.entpName),
        entpTypeCode: s.entpTypeCode != null ? String(s.entpTypeCode) : undefined,
        entpAreaCode: padCode(s.entpAreaCode, 9) || undefined,
      }));
    const idToStore = new Map(stores.map((s) => [s.entpId, s.entpName]));

    let regions: RegionOption[] = [];
    if (arObj) {
      const arItems = asArray(
        (arObj as { response?: { result?: Record<string, unknown> } })?.response?.result?.[
          'iros.openapi.service.vo.stdInfoVO'
        ] as
          | { code?: string | number; codeName?: string; highCode?: string | number }
          | Array<{ code?: string | number; codeName?: string; highCode?: string | number }>
          | undefined
      );
      regions = arItems
        .filter(
          (r) =>
            padCode(r.highCode, 9) === '020000000' &&
            r.code &&
            r.codeName &&
            !String(r.codeName).includes('(구)')
        )
        .map((r) => ({
          code: padCode(r.code, 9),
          name: String(r.codeName),
        }))
        .filter((r) => r.code)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    // 2) 조사일 (샘플 상품 몇 개 시도)
    let inspectDay: string | null = null;
    for (const sample of products.slice(0, 5)) {
      inspectDay = await resolveInspectDay(sample.goodId);
      if (inspectDay) break;
    }
    if (!inspectDay) {
      return { ...empty, regions, productCount: products.length };
    }

    // 3) 지역 매장 가격
    const sampleStores = pickStoresForRegion(stores, areaCode);
    if (sampleStores.length === 0) {
      return {
        ...empty,
        regions,
        inspectDay: formatDay(inspectDay) || null,
        productCount: products.length,
      };
    }

    const priceByGood = new Map<string, PriceRow>();

    await mapPool(sampleStores, PRICE_CONCURRENCY, async (store) => {
      try {
        const priceObj = (await fetchXml(
          buildGwUrl('/getProductPriceInfoSvc', {
            goodInspectDay: inspectDay!,
            entpId: store.entpId,
          })
        )) as { response?: { result?: Record<string, unknown> } };

        const rows = asArray(
          priceObj?.response?.result?.['iros.openapi.service.vo.goodPriceVO'] as
            | Record<string, string | number | undefined>
            | Array<Record<string, string | number | undefined>>
            | undefined
        );

        for (const row of rows) {
          if (row?.goodId == null || row?.goodPrice == null) continue;
          const price = parseInt(String(row.goodPrice), 10);
          if (Number.isNaN(price) || price <= 0) continue;

          const goodId = String(row.goodId);
          const isDiscount = String(row.goodDcYn || '').toUpperCase() === 'Y';
          const isPlusOne = String(row.plusoneYn || '').toUpperCase() === 'Y';
          const candidate: PriceRow = {
            goodId,
            price,
            entpId: row.entpId != null ? String(row.entpId) : store.entpId,
            inspectDay: row.goodInspectDay != null ? String(row.goodInspectDay) : inspectDay!,
            isDiscount,
            isPlusOne,
            discountStart: row.goodDcStartDay != null ? String(row.goodDcStartDay) : undefined,
            discountEnd: row.goodDcEndDay != null ? String(row.goodDcEndDay) : undefined,
          };

          const prev = priceByGood.get(goodId);
          if (!prev) {
            priceByGood.set(goodId, candidate);
            continue;
          }
          if (
            candidate.price < prev.price ||
            (candidate.price === prev.price &&
              (candidate.isDiscount || candidate.isPlusOne) &&
              !(prev.isDiscount || prev.isPlusOne))
          ) {
            priceByGood.set(goodId, candidate);
          }
        }
      } catch (err) {
        console.warn('store price failed', store.entpId, err);
      }
    });

    // 4) 가격 있는 상품만 즉시 조립 (이미지 없이 — UI 먼저 표시)
    const items: GroceryItem[] = [];
    for (const p of products) {
      const priceInfo = priceByGood.get(p.goodId);
      if (!priceInfo) continue;
      const category = mapCategory(p.smlcls, p.goodName);
      items.push({
        id: `api-${p.goodId}`,
        goodId: p.goodId,
        smlcls: p.smlcls,
        name: p.goodName,
        category,
        unit: p.unit,
        price: priceInfo.price,
        icon: pickIcon(p.goodName, category),
        inspectDay: formatDay(priceInfo.inspectDay),
        storeName: idToStore.get(priceInfo.entpId),
        isDiscount: priceInfo.isDiscount,
        isPlusOne: priceInfo.isPlusOne,
        discountStart: formatDay(priceInfo.discountStart),
        discountEnd: formatDay(priceInfo.discountEnd),
        source: 'api',
        storeCount: sampleStores.length,
      });
    }

    items.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    console.log(
      `Catalog ready: ${items.length} items, stores=${sampleStores.length}, day=${inspectDay}, region=${areaCode}`
    );

    return {
      items,
      regions,
      inspectDay: formatDay(inspectDay) || null,
      storeCount: sampleStores.length,
      productCount: products.length,
    };
  } catch (error) {
    console.error('fetchPriceCatalog failed', error);
    return { ...empty, regions: FALLBACK_REGIONS };
  }
}

/** 카탈로그 표시 후 이미지 URL만 채워 넣기 */
export async function attachProductImages(items: GroceryItem[]): Promise<GroceryItem[]> {
  if (items.length === 0) return items;
  try {
    const smlSet = new Set(
      items.map((i) => i.smlcls).filter((c): c is string => Boolean(c))
    );
    if (smlSet.size === 0) return items;
    const imageMap = await fetchProductImageMap(Array.from(smlSet));
    if (imageMap.size === 0) return items;
    return items.map((item) => {
      if (!item.goodId) return item;
      const seq = imageMap.get(item.goodId);
      const imageUrl = productImageUrl(seq);
      return imageUrl ? { ...item, imageUrl } : item;
    });
  } catch (err) {
    console.warn('attachProductImages failed', err);
    return items;
  }
}

export interface ApiPriceInfo {
  price: number;
  inspectDay?: string;
  storeName?: string;
  manufacturer?: string;
}

