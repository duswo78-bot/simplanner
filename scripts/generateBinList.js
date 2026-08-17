import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = 'https://raw.githubusercontent.com/venelinkochev/bin-list-data/master/bin-list-data.csv';
const OUTPUT_PATH = path.join(__dirname, '../src/apps/Finance/data/kr_bins.json');

console.log('Downloading global BIN data...');

https.get(CSV_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to get data. Status Code: ${res.statusCode}`);
    return;
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Download complete. Parsing CSV...');
    
    const lines = data.split('\n');
    const krBins = {};
    let krCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 9) continue;
      
      const bin = parts[0].trim();
      const issuer = parts[4].trim();
      const isoCode2 = parts[7].trim();
      
      const cleanIsoCode2 = isoCode2.replace(/"/g, '');
      const cleanIssuer = issuer.replace(/"/g, '');
      const cleanBin = bin.replace(/"/g, '');

      if (cleanIsoCode2 === 'KR') {
        krBins[cleanBin] = cleanIssuer;
        krCount++;
      }
    }

    const standardizedBins = {};
    for (const [bin, rawIssuer] of Object.entries(krBins)) {
      let issuer = rawIssuer.toUpperCase();
      let standardName = '알 수 없음';
      
      if (issuer.includes('KOOKMIN') || issuer.includes('KB')) standardName = 'KB국민카드';
      else if (issuer.includes('SHINHAN')) standardName = '신한카드';
      else if (issuer.includes('SAMSUNG')) standardName = '삼성카드';
      else if (issuer.includes('HYUNDAI')) standardName = '현대카드';
      else if (issuer.includes('LOTTE')) standardName = '롯데카드';
      else if (issuer.includes('HANA') || issuer.includes('KEB')) standardName = '하나카드';
      else if (issuer.includes('WOORI')) standardName = '우리카드';
      else if (issuer.includes('NONGHYUP') || issuer.includes('NH')) standardName = 'NH농협카드';
      else if (issuer.includes('BC')) standardName = 'BC카드';
      else if (issuer.includes('KAKAOBANK') || issuer.includes('KAKAO')) standardName = '카카오뱅크';
      else if (issuer.includes('TOSS')) standardName = '토스뱅크';
      else if (issuer.includes('K-BANK') || issuer.includes('KBANK')) standardName = '케이뱅크';
      else if (issuer.includes('INDUSTRIAL BANK') || issuer.includes('IBK')) standardName = 'IBK기업은행';
      else if (issuer.includes('CITI')) standardName = '씨티카드';
      else if (issuer.includes('SC')) standardName = 'SC제일은행';
      else if (issuer.includes('SUHYUP')) standardName = '수협은행';
      else standardName = rawIssuer; 
      
      standardizedBins[bin] = standardName;
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(standardizedBins, null, 2), 'utf-8');
    console.log(`Successfully extracted ${krCount} KR BINs and saved to kr_bins.json!`);
  });
}).on('error', (err) => {
  console.error('Error downloading CSV:', err.message);
});
