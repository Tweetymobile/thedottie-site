// record-phone.mjs — a short recording and stills of the demo phone on an iPhone
// viewport with touch: tabs, scrolling inside the phone, the Calendar key,
// the Insights sub-tabs and ranges, and a symptom logged on Today showing up
// under Insights.  node scripts/record-phone.mjs [https://thedottie.app]
import { chromium, devices } from 'playwright';
import { mkdirSync, renameSync, readdirSync } from 'node:fs';

const base = (process.argv[2] || 'https://thedottie.app').replace(/\/$/, '');
const out = new URL('../shots/site/phone/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], recordVideo: { dir: out, size: { width: 390, height: 844 } } });
const page = await ctx.newPage();
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.getElementById('phone-stage').scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(1200);
const tap = async (sel, ms = 700) => { await page.locator(sel).first().tap(); await page.waitForTimeout(ms); };
const still = (name) => page.screenshot({ path: `${out}${name}.png` });
const cdp = await ctx.newCDPSession(page);
const swipe = async (dy) => { const b = await page.locator('.screen .scroll').boundingBox(); await cdp.send('Input.synthesizeScrollGesture', { x: b.x + b.width / 2, y: b.y + b.height / 2, yDistance: -dy, speed: 600 }); await page.waitForTimeout(700); };

await still('01-today');
await tap('.tabbar [data-tab="calendar"]'); await still('02-calendar');
await swipe(260); await still('03-calendar-scrolled');
await tap('[data-act="key"]'); await still('04-calendar-key');
await page.locator('.sheet__scrim').tap({ position: { x: 20, y: 20 } }); await page.waitForTimeout(500);
await tap('.tabbar [data-tab="insights"]'); await still('05-insights-overview');
await tap('.itabs [data-itab="trends"]'); await tap('[data-range="6"]', 400); await still('06-insights-trends');
await swipe(240); await still('07-insights-trends-scrolled');
await tap('.itabs [data-itab="symptoms"]'); await still('08-insights-symptoms');
await tap('.itabs [data-itab="history"]'); await still('09-insights-history');
await tap('.itabs [data-itab="overview"]'); await swipe(500); await tap('[data-itab="symptoms"].textlink'); await still('10-see-all-symptoms');
await tap('.tabbar [data-tab="today"]'); await tap('[data-act="open-log"]'); await tap('[data-act="section-symptoms"]'); await tap('[data-chip="Cramps"]'); await still('11-log-cramps');
await tap('[data-act="section-main"]'); await tap('[data-act="done"]'); await still('12-today-logged');
await tap('.tabbar [data-tab="insights"]'); await tap('.itabs [data-itab="symptoms"]'); await still('13-insights-cramps-today');
const shown = await page.locator('.symrow--new').count();
await page.waitForTimeout(800);
await ctx.close(); await browser.close();
for (const f of readdirSync(out)) if (f.endsWith('.webm') && f !== 'phone-demo.webm') renameSync(out + f, out + 'phone-demo.webm');
console.log('Cramps rows marked today under Insights:', shown, '| wrote shots/site/phone/phone-demo.webm and 13 stills');
