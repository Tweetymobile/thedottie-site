// shoot.mjs — screenshots at phone and desktop widths, plus a log of every
// request the page makes (there must be none outside the local server).
//   node scripts/serve.mjs 8080 &  then  node scripts/shoot.mjs [path]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const page_ = process.argv[2] || '/';
const base = 'http://127.0.0.1:8080';
const out = new URL('../shots/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
// The ring twinkles, so Playwright's actionability wait never settles: dispatch clicks directly.
const tap = (page, sel) => page.locator(sel).first().dispatchEvent('click');
const requests = new Set();
const consoleErrors = [];

async function shot(name, { width, height, reduced = false, scheme = 'light', actions }) {
  const ctx = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 2,
    reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: scheme,
  });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.add(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await page.goto(base + page_, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  if (actions) await actions(page);
  await page.screenshot({ path: `${out}${name}.png`, fullPage: true });
  await ctx.close();
}

await shot('phone-390', { width: 390, height: 844 });
await shot('desktop-1440', { width: 1440, height: 900 });
await shot('desktop-1440-dark', { width: 1440, height: 900, scheme: 'dark' });
await shot('phone-390-reduced', { width: 390, height: 844, reduced: true });
await shot('demo-after-logging', { width: 1440, height: 900, actions: async (page) => {
  await tap(page, '[data-act="open-log"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}demo-log-sheet.png` });
  await tap(page, '[data-act="section-symptoms"]');
  await tap(page, '[data-chip="Cramps"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}demo-log-symptoms.png` });
  await tap(page, '[data-act="section-main"]');
  await tap(page, '[data-flow="Light"]');
  await tap(page, '[data-act="done"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}demo-today-after-logging.png` });
  await tap(page, '[data-tab="insights"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}demo-insights-overview.png` });
  await tap(page, '[data-itab="trends"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}demo-insights-trends.png` });
  await tap(page, '[data-itab="symptoms"]');
  await page.waitForTimeout(400);
} });
await shot('demo-calendar', { width: 1440, height: 900, actions: async (page) => {
  await tap(page, '[data-tab="calendar"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}demo-calendar-only.png` });
  await tap(page, '[data-act="key"]');
  await page.waitForTimeout(400);
} });

await browser.close();
const outside = [...requests].filter((u) => !u.startsWith(base));
console.log('requests:', requests.size, 'outside the local server:', outside.length, outside);
console.log('console errors:', consoleErrors.length, consoleErrors);
