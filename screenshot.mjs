import puppeteer from 'puppeteer';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const TMP = path.join(ROOT, 'temporary screenshots');

const targetUrl = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

await fs.mkdir(TMP, { recursive: true });

const existing = await fs.readdir(TMP);
let max = 0;
for (const name of existing) {
  const m = name.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, parseInt(m[1], 10));
}
const n = max + 1;
const fileName = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = path.join(TMP, fileName);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  protocolTimeout: 180000,
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

// Scroll through the page so IntersectionObserver + lazy-load images trigger
await page.evaluate(async () => {
  await new Promise((resolve) => {
    const step = 300;
    let y = 0;
    const tick = () => {
      window.scrollTo(0, y);
      y += step;
      if (y > document.body.scrollHeight) {
        window.scrollTo(0, 0);
        setTimeout(resolve, 500);
      } else {
        setTimeout(tick, 120);
      }
    };
    tick();
  });
});

// Wait for every <img> to have completed loading (lazy ones triggered by the scroll above)
await page.evaluate(async () => {
  const imgs = Array.from(document.images);
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((res) => {
        img.addEventListener('load', () => res(), { once: true });
        img.addEventListener('error', () => res(), { once: true });
      });
    })
  );
});

await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
