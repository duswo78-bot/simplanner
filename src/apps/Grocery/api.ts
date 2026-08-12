import { XMLParser } from 'fast-xml-parser';

// 디코딩된 원본 키 사용 (fetch 시 encodeURIComponent로 직접 인코딩)
const API_KEY_RAW = 'be/RM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F/c9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw==';
const API_KEY = encodeURIComponent(API_KEY_RAW);

export interface ApiPriceInfo {
  price: number;
  inspectDay?: string;
  storeName?: string;
  manufacturer?: string;
}

function getMostRecentFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); 
  let daysToSubtract = 0;
  
  if (dayOfWeek === 5) {
    daysToSubtract = 7;
  } else if (dayOfWeek < 5) {
    daysToSubtract = dayOfWeek + 2;
  } else {
    daysToSubtract = 1;
  }
  
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - daysToSubtract);
  
  const yyyy = lastFriday.getFullYear();
  const mm = String(lastFriday.getMonth() + 1).padStart(2, '0');
  const dd = String(lastFriday.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function fetchGroceryPrices(): Promise<Map<string, ApiPriceInfo>> {
  const parser = new XMLParser({ ignoreAttributes: false });
  const nameToInfoMap = new Map<string, ApiPriceInfo>();

  try {
    // 1. Get Store Info (entpId -> entpName)
    const entpRes = await fetch(`/openapi/openApiImpl/ProductPriceInfoService/getEntpInfoSvc.do?ServiceKey=${API_KEY}`);
    const entpXml = await entpRes.text();
    const entpObj = parser.parse(entpXml);
    
    const entpItems = entpObj?.response?.body?.items?.item || [];
    const entpList = Array.isArray(entpItems) ? entpItems : [entpItems];
    
    const idToStoreMap = new Map<string, string>();
    for (const item of entpList) {
      if (item.entpId && item.entpName) {
        idToStoreMap.set(String(item.entpId), item.entpName);
      }
    }

    // 2. Get Product Info (goodId -> goodName, goodEntpId)
    const infoRes = await fetch(`/openapi/openApiImpl/ProductPriceInfoService/getProductInfoSvc.do?ServiceKey=${API_KEY}`);
    const infoXml = await infoRes.text();
    const infoObj = parser.parse(infoXml);
    
    const infoItems = infoObj?.response?.body?.items?.item || [];
    const infoList = Array.isArray(infoItems) ? infoItems : [infoItems];
    
    const idToNameMap = new Map<string, string>();
    for (const item of infoList) {
      if (item.goodId && item.goodName) {
        idToNameMap.set(String(item.goodId), item.goodName);
      }
    }

    // 3. Get Price Info
    const inspectDay = getMostRecentFriday();
    const priceRes = await fetch(`/openapi/openApiImpl/ProductPriceInfoService/getProductPriceInfoSvc.do?ServiceKey=${API_KEY}&goodInspectDay=${inspectDay}`);
    const priceXml = await priceRes.text();
    const priceObj = parser.parse(priceXml);
    
    const priceItems = priceObj?.response?.body?.items?.item || [];
    const priceList = Array.isArray(priceItems) ? priceItems : [priceItems];

    for (const item of priceList) {
      if (item.goodId && item.goodPrice) {
        const goodName = idToNameMap.get(String(item.goodId));
        if (goodName) {
          const storeName = idToStoreMap.get(String(item.entpId));
          const formattedInspectDay = item.goodInspectDay ? 
            `${String(item.goodInspectDay).slice(0,4)}-${String(item.goodInspectDay).slice(4,6)}-${String(item.goodInspectDay).slice(6,8)}` 
            : undefined;

          nameToInfoMap.set(goodName, {
            price: parseInt(item.goodPrice, 10),
            inspectDay: formattedInspectDay,
            storeName: storeName,
          });
        }
      }
    }
    
    console.log(`Fetched ${nameToInfoMap.size} prices with details from API`);
  } catch (error) {
    console.error('Failed to fetch API prices', error);
  }

  return nameToInfoMap;
}
