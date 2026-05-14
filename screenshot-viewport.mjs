import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const TMP = path.join(ROOT, 'temporary screenshots');

const targetUrl = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'viewport';
const width = parseInt(process.argv[4] || '1440', 10);
const height = parseInt(process.argv[5] || '900', 10);

await fs.mkdir(TMP, { recursive: true });

const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) {
  const m = name.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, parseInt(m[1], 10));
}
const n = max + 1;
const fileName = `screenshot-${n}-${label}.png`;
const outPath = path.join(TMP, fileName);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(outPath);
