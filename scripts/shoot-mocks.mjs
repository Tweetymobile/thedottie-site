// shoot-mocks.mjs — hero + one scrolled section, phone and desktop, per direction.
//   node scripts/serve.mjs 8080 &  then  node scripts/shoot-mocks.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = 'http://127.0.0.1:8080/mocks/';
const out = new URL('../shots/directions/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function run(dir, section) {
  for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${base}${dir}.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}${dir}-hero-${name}.png` });
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'start' }), section);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}${dir}-section-${name}.png` });
    await ctx.close();
  }
}
await run('a', '.dawn');
await run('b', '.honest');
await browser.close();
console.log('done');
