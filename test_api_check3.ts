import { XMLParser } from 'fast-xml-parser';

const API_KEY_RAW = 'be/RM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F/c9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw==';
const API_KEY = encodeURIComponent(API_KEY_RAW);

async function testApi() {
  const parser = new XMLParser({ ignoreAttributes: false });
  
  // serviceKey (소문자 s) 로 테스트!
  const url = `http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getProductInfoSvc.do?serviceKey=${API_KEY}`;
  console.log("Fetching with lowercase serviceKey...");
  
  const res = await fetch(url);
  const text = await res.text();
  console.log("Response (first 500 chars):\n" + text.substring(0, 500));
  
  if (text.includes('<?xml')) {
    const obj = parser.parse(text);
    const code = obj?.response?.resultCode;
    const msg = obj?.response?.resultMsg;
    console.log(`\nCode: ${code}, Msg: ${msg}`);
    
    const items = obj?.response?.body?.items?.item;
    if (items) {
      const list = Array.isArray(items) ? items : [items];
      console.log(`\n🎉 SUCCESS! Got ${list.length} items!`);
      console.log("First item:", JSON.stringify(list[0], null, 2));
    }
  }
}

testApi();
