import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const TMP = path.join(ROOT, 'temporary screenshots');
await fs.mkdir(TMP, { recursive: true });

const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) {
  const m = name.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, parseInt(m[1], 10));
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 180000 });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('https://www.mineralresources.com.au/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 2000));

const scrolls = [0, 250, 500, 800, 1200, 1800];
let n = max + 1;
for (const y of scrolls) {
  await page.evaluate((sy) => window.scrollTo(0, sy), y);
  await new Promise((r) => setTimeout(r, 700));
  const out = path.join(TMP, `screenshot-${n}-minres-y${y}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(out);
  n++;
}

// Also extract computed styles of hero + section elements
const inspect = await page.evaluate(() => {
  const results = {};
  const hero = document.querySelector('section, header, [class*=hero], [class*=Hero]');
  if (hero) {
    const cs = getComputedStyle(hero);
    results.heroPosition = cs.position;
    results.heroTransform = cs.transform;
    results.heroZ = cs.zIndex;
  }
  // Sections
  const sections = Array.from(document.querySelectorAll('section')).slice(0, 5);
  results.sections = sections.map((s) => {
    const cs = getComputedStyle(s);
    return { tag: s.tagName, cls: s.className.slice(0, 50), position: cs.position, transform: cs.transform.slice(0, 60), z: cs.zIndex };
  });
  return results;
});
console.log('---INSPECT---');
console.log(JSON.stringify(inspect, null, 2));

await browser.close();
