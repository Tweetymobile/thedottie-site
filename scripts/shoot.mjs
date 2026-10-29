// shoot.mjs — full-page screenshots at phone and desktop widths, reduced
// motion, and a log of every request each page makes (none may leave the
// local server).  node scripts/serve.mjs 8080 &  then  node scripts/shoot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = 'http://127.0.0.1:8080';
const out = new URL('../shots/site/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const requests = new Set(); const consoleErrors = [];

async function shot(path, name, { width, height, reduced = false, scheme = 'light', full = true, actions }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.add(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  if (actions) await actions(page);
  // sticky stages settle per scroll position; for the full-page shot, walk down so observers fire
  if (full) { for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); } await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300); }
  await page.screenshot({ path: `${out}${name}.png`, fullPage: full });
  await ctx.close();
}
const tap = (page, sel) => page.locator(sel).first().dispatchEvent('click');

await shot('/', 'home-phone-390', { width: 390, height: 844 });
await shot('/', 'home-desktop-1440', { width: 1440, height: 900 });
await shot('/', 'home-phone-390-reduced', { width: 390, height: 844, reduced: true });
await shot('/', 'home-desktop-1440-dark', { width: 1440, height: 900, scheme: 'dark' });
await shot('/', 'home-desktop-1440-orchid-dark', { width: 1440, height: 900, scheme: 'dark', actions: async (p) => { await tap(p, '.vibe[data-theme="orchid"]'); await p.waitForTimeout(300); } });
await shot('/privacy/', 'privacy-phone-390', { width: 390, height: 844 });
await shot('/privacy/', 'privacy-desktop-1440', { width: 1440, height: 900 });
await shot('/support/', 'support-phone-390', { width: 390, height: 844 });
await shot('/support/', 'support-desktop-1440', { width: 1440, height: 900 });
// a few viewport stills of the stage and the demos
await shot('/', 'hero-desktop', { width: 1440, height: 900, full: false });
await shot('/', 'stage-calendar-desktop', { width: 1440, height: 900, full: false, actions: async (p) => { await p.evaluate(() => document.querySelectorAll('.step')[1].scrollIntoView({ block: 'center' })); await p.waitForTimeout(2200); } });
await shot('/', 'demos-desktop', { width: 1440, height: 900, full: false, actions: async (p) => {
  await p.evaluate(() => document.getElementById('private').scrollIntoView({ block: 'start' }));
  await p.locator('#airplane').dispatchEvent('click'); await p.evaluate(() => { const a = document.getElementById('airplane'); a.checked = true; a.dispatchEvent(new Event('change')); });
  await tap(p, '[data-pin="decoy"]'); await tap(p, '[data-del="ask"]'); await p.waitForTimeout(1200);
} });

// a top-to-bottom tour: one viewport still per section, both widths
const sections = ['top', 'cycle', 'honest', 'explore', 'stages', 'yours', 'private', 'doctor', 'about', 'download'];
for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.add(r.url()));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  let i = 0;
  for (const id of sections) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}tour-${name}-${String(i++).padStart(2, '0')}-${id}.png` });
    if (id === 'cycle') {
      for (const [k, step] of [[1, 'calendar'], [2, 'chart']]) {
        await page.evaluate((k) => document.querySelectorAll('.step')[k].scrollIntoView({ block: window.innerWidth < 960 ? 'end' : 'center', behavior: 'instant' }), k);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}tour-${name}-${String(i++).padStart(2, '0')}-cycle-${step}.png` });
      }
    }
  }
  await ctx.close();
}
await browser.close();
const outside = [...requests].filter((u) => !u.startsWith(base));
console.log('requests:', requests.size, 'outside the local server:', outside.length, outside);
console.log('console errors:', consoleErrors.length, consoleErrors);
