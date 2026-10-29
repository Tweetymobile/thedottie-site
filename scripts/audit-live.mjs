// audit-live.mjs — visit every page of the live site in headless Chromium and
// log every request the browser makes. Every request must stay on the site's
// own origin; anything else fails the audit. Also checks the plain-HTTP
// redirect and the security headers.  node scripts/audit-live.mjs [https://thedottie.app]
import { chromium } from 'playwright';

const base = (process.argv[2] || 'https://thedottie.app').replace(/\/$/, '');
const origin = new URL(base).origin;
const pages = ['/', '/privacy/', '/support/'];
const browser = await chromium.launch();
let failed = false;

for (const path of pages) {
  for (const [label, opts] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: opts });
    const page = await ctx.newPage();
    const requests = new Set(); const errors = [];
    page.on('request', (r) => requests.add(r.url()));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    if (path === '/') {
      // exercise the interactive bits so lazy paths fire too
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
      for (const sel of ['.vibe[data-theme="orchid"]', '.vibe[data-theme="midnight"]', '[data-pin="decoy"]', '[data-del="ask"]']) {
        const el = page.locator(sel).first(); if (await el.count()) await el.dispatchEvent('click');
      }
      await page.waitForTimeout(800);
    }
    const outside = [...requests].filter((u) => new URL(u).origin !== origin);
    const title = await page.title();
    console.log(`${path} ${label}: HTTP ${res.status()} "${title}" · ${requests.size} requests · ${outside.length} outside ${origin} · ${errors.length} console errors`);
    if (outside.length || errors.length || res.status() !== 200) { failed = true; console.log('  ', { outside, errors }); }
    await ctx.close();
  }
}
await browser.close();

// headers and the plain-HTTP redirect
const h = await fetch(base + '/', { redirect: 'manual' });
const hdr = (n) => h.headers.get(n) ?? '(none)';
console.log('headers:', { server: hdr('server'), 'strict-transport-security': hdr('strict-transport-security'), 'set-cookie': hdr('set-cookie') });
const csp = await (await fetch(base + '/')).text();
console.log('CSP meta present in HTML:', /http-equiv="Content-Security-Policy"/.test(csp));
if (hdr('set-cookie') !== '(none)') { failed = true; console.log('  a cookie was set!'); }
const http = await fetch(base.replace('https://', 'http://') + '/', { redirect: 'manual' });
console.log(`plain http → ${http.status} ${http.headers.get('location') ?? '(no redirect)'}`);
if (!(http.status >= 301 && http.status <= 308 && (http.headers.get('location') || '').startsWith('https://'))) { failed = true; console.log('  plain HTTP does not redirect to HTTPS'); }

console.log(failed ? 'AUDIT FAILED' : 'AUDIT PASSED: nothing left the site');
process.exit(failed ? 1 : 0);
