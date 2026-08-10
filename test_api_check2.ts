import { XMLParser } from 'fast-xml-parser';

const API_KEY = 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';

async function testApi() {
  const parser = new XMLParser({ ignoreAttributes: false });
  try {
    const url = `http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getProductInfoSvc.do?ServiceKey=${API_KEY}`;
    console.log("Fetching: " + url);
    const res = await fetch(url);
    const xml = await res.text();
    console.log("Raw XML starts with: " + xml.substring(0, 100));
    
    const obj = parser.parse(xml);
    const code = obj?.response?.resultCode || obj?.response?.header?.resultCode;
    const msg = obj?.response?.resultMsg || obj?.response?.header?.resultMsg;
    console.log(`Result Code: ${code}, Msg: ${msg}`);
  } catch (error) {
    console.error('Error fetching API', error);
  }
}

testApi();
