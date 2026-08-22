const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' }).catch(e => console.log('Nav error:', e));
  
  const content = await page.content();
  if (content.includes('Something went wrong')) {
    console.log('Error Boundary triggered!');
  }
  
  await browser.close();
})();
