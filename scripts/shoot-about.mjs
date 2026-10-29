// shoot-about.mjs — the about section at phone and desktop widths in every theme,
// light and dark, as individual shots and two contact sheets; plus the footer
// and a check that the footer's About link lands on the section.
//   node scripts/serve.mjs 8080 &  then  node scripts/shoot-about.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = 'http://127.0.0.1:8080';
const out = new URL('../shots/site/about/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const themes = ['clay', 'lagoon', 'orchid', 'midnight'], schemes = ['light', 'dark'];
const shots = { phone: [], desktop: [] };

for (const [label, width, height] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
  for (const theme of themes) for (const scheme of schemes) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.locator(`.vibe[data-theme="${theme}"]`).dispatchEvent('click');
    await page.locator(`.chip[data-scheme="${scheme}"]`).dispatchEvent('click');
    await page.evaluate(() => document.getElementById('about').scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(600);
    const file = `${out}about-${label}-${theme}-${scheme}.png`;
    await page.locator('#about').screenshot({ path: file });
    shots[label].push({ file, theme, scheme });
    if (theme === 'clay' && scheme === 'light') {
      // the footer with its About link, and the link's target
      await page.evaluate(() => document.querySelector('.foot').scrollIntoView({ block: 'end', behavior: 'instant' }));
      await page.waitForTimeout(300);
      await page.locator('.foot').screenshot({ path: `${out}footer-${label}.png` });
      await page.locator('.foot a[href="#about"]').dispatchEvent('click');
      await page.waitForTimeout(800);
      const ok = await page.evaluate(() => { const r = document.getElementById('about').getBoundingClientRect(); return location.hash === '#about' && r.top >= -2 && r.top < window.innerHeight / 2; });
      console.log(`${label}: footer About link lands on the section: ${ok}`);
    }
    await ctx.close();
  }
}

// contact sheets: one page of <img>s, screenshotted
for (const label of ['phone', 'desktop']) {
  const cols = label === 'phone' ? 4 : 2;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#F4F1EA;font:14px Helvetica,Arial,sans-serif;color:#37342B;padding:24px}
    h1{font-size:20px;margin:0 0 16px}.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px}
    figure{margin:0}img{display:block;width:100%;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.12)}figcaption{margin:6px 0 0;color:#8A8271}
  </style><h1>About section · ${label} · every theme, light and dark</h1><div class="g">${shots[label].map((s) => `<figure><img src="file://${s.file}"><figcaption>${s.theme} · ${s.scheme}</figcaption></figure>`).join('')}</div>`;
  const file = `${out}sheet-${label}.html`; writeFileSync(file, html);
  const ctx = await browser.newContext({ viewport: { width: label === 'phone' ? 1700 : 1900, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}sheet-${label}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log('wrote', Object.values(shots).flat().length, 'section shots, two footers and two sheets into shots/site/about/');
