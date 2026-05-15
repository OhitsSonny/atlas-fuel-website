import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const TMP = path.join(ROOT, 'temporary screenshots');

const targetUrl = process.argv[2] || 'http://localhost:3000';
const scrollY = parseInt(process.argv[3] || '600', 10);
const label = process.argv[4] || 'scrolled';

await fs.mkdir(TMP, { recursive: true });
const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) {
  const m = name.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, parseInt(m[1], 10));
}
const outPath = path.join(TMP, `screenshot-${max + 1}-${label}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate((y) => window.scrollTo(0, y), scrollY);
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(outPath);
