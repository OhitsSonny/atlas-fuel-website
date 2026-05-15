import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
const TMP = '/Users/sonnydube/Documents/atlas-fuel-website/temporary screenshots';
const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) { const m = name.match(/^screenshot-(\d+)/); if (m) max = Math.max(max, parseInt(m[1], 10)); }
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 180000 });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('https://atlas-fuel-website-lac.vercel.app/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 2000));
let n = max + 1;
for (const y of [0, 250, 500]) {
  await page.evaluate((sy) => window.scrollTo(0, sy), y);
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${TMP}/screenshot-${n}-vercel-y${y}.png`, fullPage: false });
  console.log(`screenshot-${n}-vercel-y${y}.png`);
  n++;
}
await browser.close();
