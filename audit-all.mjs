import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
const TMP = '/Users/sonnydube/Documents/atlas-fuel-website/temporary screenshots';
const BASE = 'https://atlas-fuel-website-lac.vercel.app';
const pages = [
  ['/', 'home'],
  ['/about.html', 'about'],
  ['/what-we-do.html', 'wwd'],
  ['/what-we-do/mining-and-civil.html', 'mining'],
  ['/what-we-do/marine-bunkering.html', 'marine'],
  ['/what-we-do/onsite-diesel.html', 'onsite'],
  ['/what-we-do/fuel-stations.html', 'fstations'],
  ['/our-people.html', 'people'],
  ['/sustainability.html', 'sus'],
  ['/atlas-performance.html', 'perf'],
  ['/careers.html', 'careers'],
  ['/news.html', 'news'],
  ['/contact.html', 'contact'],
  ['/store-locator.html', 'locator'],
];

const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) { const m = name.match(/^screenshot-(\d+)/); if (m) max = Math.max(max, parseInt(m[1], 10)); }

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 180000 });
let n = max + 1;
for (const [path, label] of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`${resp.status()} ${path}`);
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: `${TMP}/screenshot-${n}-audit-${label}.png`, fullPage: false });
    n++;
  } catch (e) {
    console.log(`ERR ${path}: ${e.message}`);
  }
  await page.close();
}
await browser.close();
