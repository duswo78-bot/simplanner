/**
 * 카드고릴라 API에서 key_benefit 상세를 수집해 청크 JSON으로 저장
 *
 *   node scripts/scrapeCardBenefits.js
 *   node scripts/scrapeCardBenefits.js --resume
 *   node scripts/scrapeCardBenefits.js --concurrency 12
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/apps/Finance/data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const BENEFITS_DIR = path.join(DATA_DIR, 'benefits');
const PROGRESS_FILE = path.join(DATA_DIR, 'benefits.scrape-progress.json');
const INDEX_FILE = path.join(BENEFITS_DIR, 'index.json');
const CHUNK_SIZE = 100;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://www.card-gorilla.com',
  Referer: 'https://www.card-gorilla.com/',
};

function parseArgs(argv) {
  const args = { concurrency: 12, resume: false, delayMs: 30, maxDetail: 1500 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--resume') args.resume = true;
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--delay') args.delayMs = Number(argv[++i]);
    else if (a === '--max-detail') args.maxDetail = Number(argv[++i]);
  }
  return args;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&middot;/gi, '·')
    .replace(/&times;/gi, '×')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function chunkKey(sourceId) {
  return String(Math.floor(sourceId / CHUNK_SIZE));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function compactCard(api, maxDetail) {
  const sections = (api.key_benefit || [])
    .map((s) => {
      const summary = String(s.comment || '').trim();
      let detail = stripHtml(s.info || '');
      if (detail.length > maxDetail) {
        detail = `${detail.slice(0, maxDetail).trim()}…`;
      }
      // 요약과 상세가 거의 같으면 상세 생략
      if (detail && summary && detail.replace(/\s+/g, '') === summary.replace(/\s+/g, '')) {
        detail = '';
      }
      return {
        title: String(s.title || '').trim() || '혜택',
        summary,
        detail,
      };
    })
    .filter((s) => s.summary || s.detail);

  const topTags = (api.top_benefit || [])
    .map((t) => (Array.isArray(t.tags) ? t.tags.filter(Boolean).join(' ') : ''))
    .filter(Boolean);

  return {
    sourceId: api.idx,
    name: api.name || '',
    company: api.corp?.name || '',
    annualFeeText: api.annual_fee_basic || '',
    preMonthMoney: Number(api.pre_month_money) || 0,
    topTags,
    sections,
  };
}

async function fetchCard(id) {
  const url = `https://api.card-gorilla.com/v1/cards/${id}`;
  const res = await axios.get(url, {
    headers: HEADERS,
    timeout: 20000,
    validateStatus: () => true,
  });
  if (res.status !== 200 || !res.data || typeof res.data !== 'object') {
    return null;
  }
  if (!res.data.idx && !res.data.name) return null;
  return res.data;
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  async function runner() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => runner()));
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function loadChunkMap() {
  /** @type {Map<string, Record<string, object>>} */
  const map = new Map();
  if (!fs.existsSync(BENEFITS_DIR)) return map;
  for (const file of fs.readdirSync(BENEFITS_DIR)) {
    if (!/^\d+\.json$/.test(file)) continue;
    const key = file.replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(BENEFITS_DIR, file), 'utf8'));
      map.set(key, data);
    } catch {
      map.set(key, {});
    }
  }
  return map;
}

function saveChunkMap(chunkMap, meta) {
  if (!fs.existsSync(BENEFITS_DIR)) fs.mkdirSync(BENEFITS_DIR, { recursive: true });

  let total = 0;
  const chunks = [];
  for (const [key, data] of [...chunkMap.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const count = Object.keys(data).length;
    if (count === 0) continue;
    total += count;
    chunks.push(key);
    fs.writeFileSync(path.join(BENEFITS_DIR, `${key}.json`), JSON.stringify(data), 'utf8');
  }

  fs.writeFileSync(
    INDEX_FILE,
    JSON.stringify(
      {
        chunkSize: CHUNK_SIZE,
        chunks,
        total,
        updatedAt: new Date().toISOString(),
        ...meta,
      },
      null,
      2
    ),
    'utf8'
  );
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(CARDS_FILE)) {
    console.error('cards.json not found. Run scrape:cards first.');
    process.exit(1);
  }

  const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
  const ids = [
    ...new Set(
      cards
        .map((c) => c.sourceId)
        .filter((id) => typeof id === 'number' && id > 0)
    ),
  ].sort((a, b) => a - b);

  const done = new Set();
  if (args.resume) {
    const prev = loadProgress();
    if (prev?.doneIds) prev.doneIds.forEach((id) => done.add(id));
    // 기존 청크도 반영
    const existing = loadChunkMap();
    for (const data of existing.values()) {
      for (const id of Object.keys(data)) done.add(Number(id));
    }
    console.log(`Resume: already have ${done.size} benefits`);
  }

  const pending = ids.filter((id) => !done.has(id));
  console.log(`Benefits scrape: total ids=${ids.length}, pending=${pending.length}, concurrency=${args.concurrency}`);

  const chunkMap = loadChunkMap();
  let ok = 0;
  let miss = 0;
  let err = 0;
  const t0 = Date.now();
  const BATCH = 50;

  for (let offset = 0; offset < pending.length; offset += BATCH) {
    const batch = pending.slice(offset, offset + BATCH);
    await runPool(batch, args.concurrency, async (id) => {
      try {
        if (args.delayMs > 0) await sleep(args.delayMs);
        const api = await fetchCard(id);
        if (!api) {
          miss++;
          done.add(id);
          return;
        }
        const compact = compactCard(api, args.maxDetail);
        if (!compact.sections.length && !compact.topTags.length) {
          miss++;
          done.add(id);
          return;
        }
        const key = chunkKey(id);
        if (!chunkMap.has(key)) chunkMap.set(key, {});
        chunkMap.get(key)[String(id)] = compact;
        ok++;
        done.add(id);
      } catch {
        // retry once
        try {
          await sleep(250);
          const api = await fetchCard(id);
          if (api) {
            const compact = compactCard(api, args.maxDetail);
            const key = chunkKey(id);
            if (!chunkMap.has(key)) chunkMap.set(key, {});
            chunkMap.get(key)[String(id)] = compact;
            ok++;
            done.add(id);
            return;
          }
          miss++;
          done.add(id);
        } catch {
          err++;
        }
      }
    });

    saveChunkMap(chunkMap, { ok, miss, err });
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify(
        {
          doneIds: [...done],
          ok,
          miss,
          err,
          pendingLeft: pending.length - offset - batch.length,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf8'
    );

    const pct = (((offset + batch.length) / Math.max(pending.length, 1)) * 100).toFixed(1);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
      `[${pct}%] batch+${batch.length} ok=${ok} miss=${miss} err=${err} chunks=${chunkMap.size} ${elapsed}s`
    );
  }

  saveChunkMap(chunkMap, { ok, miss, err, done: true });
  console.log('--- Done ---');
  console.log(`Saved benefits under ${BENEFITS_DIR}`);
  console.log(`ok=${ok} miss=${miss} err=${err} elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
