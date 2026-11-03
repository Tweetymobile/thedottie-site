// shoot-redesign.mjs — the review set for the stages/safety redesign: full pages
// at phone (390) and desktop (1440) width in Clay light, Lagoon dark and
// Midnight, plus viewport stills of each new section.
//   node scripts/serve.mjs 8080 &  then  node scripts/shoot-redesign.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = 'http://127.0.0.1:8080';
const out = new URL('../shots/redesign/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const requests = new Set(); const errors = [];
async function open(width, height, scheme, theme) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.add(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  if (theme && theme !== 'clay') { await page.locator(`.vibe[data-theme="${theme}"]`).dispatchEvent('click'); }
  await page.waitForTimeout(1800);
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(50); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
  return { ctx, page };
}
const sets = [['clay', 'light'], ['lagoon', 'dark'], ['midnight', 'light']];
for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
  for (const [theme, scheme] of sets) {
    const { ctx, page } = await open(width, height, scheme, theme);
    await page.screenshot({ path: `${out}${name}-${theme}-${scheme}-full.png`, fullPage: true });
    for (const id of ['stages', 'parents', 'safety', 'private']) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}${name}-${theme}-${scheme}-${id}.png` });
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}${name}-${theme}-${scheme}-footer.png` });
    await ctx.close();
  }
}
for (const path of ['/privacy/', '/support/']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('request', (r) => requests.add(r.url()));
  await page.goto(base + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}${path.replace(/\//g, '')}-desktop-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
const outside = [...requests].filter((u) => !u.startsWith(base));
console.log('requests:', requests.size, 'outside:', outside.length, outside, 'errors:', errors.length, errors);
