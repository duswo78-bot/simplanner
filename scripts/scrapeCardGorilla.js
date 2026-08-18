/**
 * 카드고릴라 상세 페이지(1~N)를 순회해 cards.json 생성
 *
 * Usage:
 *   node scripts/scrapeCardGorilla.js
 *   node scripts/scrapeCardGorilla.js --start 1 --end 3000 --concurrency 8
 *   node scripts/scrapeCardGorilla.js --resume
 *
 * 중단 후 이어서: progress 파일 기준으로 --resume
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/apps/Finance/data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'cards.scrape-progress.json');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

function parseArgs(argv) {
  const args = {
    start: 1,
    end: 3000,
    concurrency: 8,
    resume: false,
    delayMs: 50,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--resume') args.resume = true;
    else if (a === '--start') args.start = Number(argv[++i]);
    else if (a === '--end') args.end = Number(argv[++i]);
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--delay') args.delayMs = Number(argv[++i]);
  }
  return args;
}

function parseFee(product) {
  const offers = product.offers;
  if (!offers) return 0;

  const toNum = (v) => {
    if (v == null) return null;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const high = toNum(offers.highPrice);
  if (high != null) return high;
  const low = toNum(offers.lowPrice);
  if (low != null) return low;
  const price = toNum(offers.price);
  if (price != null) return price;

  const desc = String(offers.description || '');
  const fees = [...desc.matchAll(/\[([\d,]+|없음)\]/g)]
    .map((m) => m[1])
    .filter((n) => n !== '없음')
    .map((n) => Number(n.replace(/,/g, '')))
    .filter((n) => Number.isFinite(n));
  return fees.length ? Math.max(...fees) : 0;
}

function parseCardHtml(html, id) {
  const $ = cheerio.load(html);
  const ldRaw = $('script[type="application/ld+json"]').first().html();
  if (!ldRaw) return null;

  let data;
  try {
    data = JSON.parse(ldRaw);
  } catch {
    return null;
  }

  const graph = Array.isArray(data['@graph'])
    ? data['@graph']
    : data['@type'] === 'Product'
      ? [data]
      : [];
  const product = graph.find((x) => x && x['@type'] === 'Product');
  if (!product?.name) return null;

  const rawName = String(product.name)
    .replace(/\s*\|\s*카드고릴라\s*$/u, '')
    .trim();
  if (!rawName || rawName === '카드고릴라') return null;

  // 혜택: description 콤마 분리 + 페이지 내 혜택 리스트 보강
  let benefits = String(product.description || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 본문에 더 긴 혜택 텍스트가 있으면 사용
  const bodyBenefits = [];
  $('li, p, span, div').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    // 너무 긴/짧은 텍스트는 스킵
  });
  // 본문 전체 파싱은 노이즈가 커서 JSON-LD description 우선 유지
  void bodyBenefits;

  if (benefits.length === 0) {
    benefits = ['혜택 정보 없음'];
  }

  // 전월실적 힌트 (설명/오퍼에서 "N만원 이상")
  let targetPerformance = 300000;
  const feeBlob = `${product.description || ''} ${product.offers?.description || ''}`;
  const perfMatch = feeBlob.match(/전월\s*실적[^\d]*(\d+)\s*만\s*원/u)
    || feeBlob.match(/(\d+)\s*만\s*원\s*이상/u);
  if (perfMatch) {
    targetPerformance = Number(perfMatch[1]) * 10000;
  }

  return {
    id: `cg-${id}`,
    company: product.brand?.name || '기타',
    name: rawName,
    annualFee: parseFee(product),
    targetPerformance,
    currentPerformance: 0,
    benefits: benefits.slice(0, 8),
    image: product.image || '',
    paymentDate: 14,
    expectedPayment: 0,
    // 메타 (앱 타입 외 필드 — 검색/필터에 유용)
    category: product.category || '',
    sourceId: id,
    source: 'card-gorilla',
  };
}

async function fetchCard(id) {
  const url = `https://www.card-gorilla.com/card/detail/${id}`;
  const res = await axios.get(url, {
    headers: HEADERS,
    timeout: 20000,
    validateStatus: () => true,
    maxRedirects: 5,
  });
  if (res.status !== 200 || typeof res.data !== 'string') {
    return null;
  }
  return parseCardHtml(res.data, id);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveAll(cards, progress) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // cards.json 은 앱 스키마 필드 위주로 정렬
  const sorted = [...cards].sort((a, b) => (a.sourceId || 0) - (b.sourceId || 0));
  fs.writeFileSync(DATA_FILE, JSON.stringify(sorted, null, 2), 'utf8');
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  const results = new Array(items.length);
  async function runner() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => runner()));
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  let start = args.start;
  let end = args.end;
  /** @type {Map<number, object>} */
  const byId = new Map();
  let lastDone = start - 1;

  if (args.resume) {
    const prev = loadProgress();
    if (prev) {
      start = (prev.nextId ?? prev.lastDone + 1) || start;
      end = prev.end ?? end;
      if (Array.isArray(prev.cards)) {
        for (const c of prev.cards) {
          if (c?.sourceId) byId.set(c.sourceId, c);
        }
      }
      // 기존 cards.json 도 병합
      if (fs.existsSync(DATA_FILE)) {
        try {
          const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          for (const c of existing) {
            if (c?.sourceId && !byId.has(c.sourceId)) byId.set(c.sourceId, c);
          }
        } catch { /* ignore */ }
      }
      lastDone = start - 1;
      console.log(`Resume from id ${start} (already ${byId.size} cards)`);
    }
  }

  const ids = [];
  for (let id = start; id <= end; id++) ids.push(id);

  console.log(`Scraping card-gorilla detail ${start}..${end} (concurrency=${args.concurrency})`);
  console.log(`Output: ${DATA_FILE}`);

  let ok = 0;
  let miss = 0;
  let err = 0;
  let processed = 0;
  const t0 = Date.now();

  // 배치 단위로 저장 (매 50개)
  const BATCH = 50;

  for (let offset = 0; offset < ids.length; offset += BATCH) {
    const batch = ids.slice(offset, offset + BATCH);
    await runPool(batch, args.concurrency, async (id) => {
      try {
        if (args.delayMs > 0) await sleep(args.delayMs);
        const card = await fetchCard(id);
        if (card) {
          byId.set(id, card);
          ok++;
        } else {
          miss++;
        }
      } catch (e) {
        err++;
        // 1회 재시도
        try {
          await sleep(300);
          const card = await fetchCard(id);
          if (card) {
            byId.set(id, card);
            ok++;
            err--;
          } else {
            miss++;
            err--;
          }
        } catch {
          // keep err
        }
      }
      processed++;
    });

    lastDone = batch[batch.length - 1];
    const cards = [...byId.values()];
    saveAll(cards, {
      lastDone,
      nextId: lastDone + 1,
      start: args.start,
      end,
      ok,
      miss,
      err,
      total: cards.length,
      updatedAt: new Date().toISOString(),
      cards, // resume용 전체 (파일이 커질 수 있음)
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const pct = (((lastDone - args.start + 1) / (end - args.start + 1)) * 100).toFixed(1);
    console.log(
      `[${pct}%] id<=${lastDone} cards=${cards.length} ok=${ok} miss=${miss} err=${err} ${elapsed}s`
    );
  }

  // 최종: progress 에서 대용량 cards 제거한 요약만
  const finalCards = [...byId.values()].sort((a, b) => a.sourceId - b.sourceId);
  fs.writeFileSync(DATA_FILE, JSON.stringify(finalCards, null, 2), 'utf8');
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify(
      {
        lastDone: end,
        nextId: end + 1,
        start: args.start,
        end,
        ok,
        miss,
        err,
        total: finalCards.length,
        updatedAt: new Date().toISOString(),
        done: true,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('--- Done ---');
  console.log(`Saved ${finalCards.length} cards → ${DATA_FILE}`);
  console.log(`ok=${ok} miss=${miss} err=${err} elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
