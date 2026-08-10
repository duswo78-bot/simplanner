import fs from 'fs';

const API_KEY = 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';

async function testApi() {
  try {
    const urls = [
      `http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService/getProductInfoSvc.do?ServiceKey=${API_KEY}`,
      `http://openapi.price.go.kr/openapi/service/ProductPriceInfoService/getProductInfoSvc?ServiceKey=${API_KEY}`,
      `http://openapi.price.go.kr/openapi/service/priceinfo/getProductInfoSvc?ServiceKey=${API_KEY}`
    ];
    
    for (let i = 0; i < urls.length; i++) {
      console.log(`Trying URL ${i}: ${urls[i]}`);
      const res = await fetch(urls[i]);
      const text = await res.text();
      fs.writeFileSync(`test_url_${i}.xml`, text);
    }
    console.log('Done.');
  } catch (error) {
    console.error('Error fetching API', error);
  }
}

testApi();
