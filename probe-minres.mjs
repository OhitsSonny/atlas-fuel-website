import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 180000 });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

// Track which JS / CSS files load
const scripts = [];
const stylesheets = [];
page.on('response', (res) => {
  const u = res.url();
  if (u.endsWith('.js') || u.includes('.js?')) scripts.push(u);
  if (u.endsWith('.css') || u.includes('.css?')) stylesheets.push(u);
});

await page.goto('https://www.mineralresources.com.au/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));

console.log('=== Scripts loaded (first 12) ===');
console.log(scripts.slice(0, 12).join('\n'));

// At various scroll positions, capture the transforms of every element that has one
const positions = [0, 100, 250, 400, 600, 900, 1300];
for (const y of positions) {
  await page.evaluate((sy) => window.scrollTo(0, sy), y);
  await new Promise((r) => setTimeout(r, 350));
  const data = await page.evaluate(() => {
    const result = { transformed: [], stickyOrFixed: [], parallax: [] };
    // Find every element with a non-identity transform
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cs = getComputedStyle(el);
      const t = cs.transform;
      const pos = cs.position;
      if ((t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') ||
          pos === 'sticky' || pos === 'fixed') {
        const r = el.getBoundingClientRect();
        const cls = (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 80);
        const info = { tag: el.tagName.toLowerCase(), cls, position: pos, transform: t.slice(0, 80), top: Math.round(r.top), h: Math.round(r.height) };
        if (pos === 'sticky' || pos === 'fixed') result.stickyOrFixed.push(info);
        if (t && t.startsWith('matrix') && !t.includes('1, 0, 0, 1, 0, 0')) result.transformed.push(info);
      }
    }
    return result;
  });
  console.log(`\n--- scrollY=${y} ---`);
  console.log(`Fixed/sticky elements: ${data.stickyOrFixed.length}`);
  data.stickyOrFixed.slice(0, 6).forEach((x) => console.log(`  ${x.position}.${x.tag}.${x.cls.slice(0,40)} top=${x.top} h=${x.h} transform=${x.transform}`));
  console.log(`Transformed elements: ${data.transformed.length}`);
  data.transformed.slice(0, 6).forEach((x) => console.log(`  ${x.tag}.${x.cls.slice(0,40)} top=${x.top} transform=${x.transform}`));
}

// Check for any GSAP / Lenis / Locomotive / smoothscroll references
const libs = await page.evaluate(() => ({
  hasGsap: !!window.gsap,
  hasLenis: !!window.Lenis,
  hasLocomotive: !!window.LocomotiveScroll,
  hasScrollTrigger: !!window.ScrollTrigger,
  hasFramer: !!window.Framer,
  documentBodyDataAttrs: Array.from(document.body.attributes).filter(a => a.name.startsWith('data-')).map(a => `${a.name}=${a.value.slice(0,40)}`),
  htmlClass: document.documentElement.className.slice(0, 80),
}));
console.log('\n=== Libraries / data attrs ===');
console.log(JSON.stringify(libs, null, 2));

await browser.close();
