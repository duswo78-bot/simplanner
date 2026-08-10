import fs from 'fs';

const API_KEY = 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';

async function testApi() {
  try {
    const infoRes = await fetch(`http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getProductInfoSvc?ServiceKey=${API_KEY}`);
    const infoXml = await infoRes.text();
    fs.writeFileSync('test_info.xml', infoXml);

    const entpRes = await fetch(`http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getEntpInfoSvc?ServiceKey=${API_KEY}`);
    const entpXml = await entpRes.text();
    fs.writeFileSync('test_entp.xml', entpXml);

    const priceRes = await fetch(`http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getProductPriceInfoSvc?ServiceKey=${API_KEY}&goodInspectDay=20240531`);
    const priceXml = await priceRes.text();
    fs.writeFileSync('test_price.xml', priceXml);
    console.log('Done saving XMLs.');
  } catch (error) {
    console.error('Error fetching API', error);
  }
}

testApi();
