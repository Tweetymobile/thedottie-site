// drive the demo phone like a person: real mouse clicks at desktop width, real taps on an iPhone viewport
import { chromium, webkit, devices } from 'playwright';
const base = process.argv[2] || 'https://thedottie.app';
const engine = process.argv[3] === 'webkit' ? webkit : chromium;
console.log('engine:', process.argv[3] === 'webkit' ? 'webkit (Safari)' : 'chromium');
const browser = await engine.launch();
const modes = [
  ['desktop mouse', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, false],
  ['iphone touch', { ...devices['iPhone 13'] }, true],
];
for (const [name, ctxOpts, touch] of modes) {
  console.log('=== ' + name);
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  // Local runs only: WebKit honours upgrade-insecure-requests even for 127.0.0.1 (Chromium
  // exempts loopback), so strip that one directive from the HTML it is served here.
  if (base.startsWith('http://')) await page.route('**/*', async (route) => {
    const res = await route.fetch(); const ct = res.headers()['content-type'] || '';
    if (!ct.includes('text/html')) return route.fulfill({ response: res });
    const body = (await res.text()).replace('; upgrade-insecure-requests', '');
    return route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-length': String(Buffer.byteLength(body)) } });
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('explore').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(800);
  const act = async (sel) => {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) return 'MISSING ' + sel;
    try { if (touch) await loc.tap({ timeout: 4000 }); else await loc.click({ timeout: 4000 }); return 'ok'; }
    catch (e) { return 'FAIL ' + String(e).split('\n')[0]; }
  };
  const state = () => page.evaluate(() => { const s = window.DottiePhone.state(); return `tab=${s.tab} itab=${s.itab} range=${s.trange} sheet=${s.sheet} symptoms=${s.symptoms.join('/')} logged=${s.logged}`; });
  const hit = (sel) => page.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return 'none'; const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const top = document.elementFromPoint(cx, cy); return `rect=${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} topmost=${top ? top.tagName.toLowerCase() + (top.className && typeof top.className === 'string' ? '.' + top.className.split(' ')[0] : '') : 'null'} inside=${el.contains(top)}`; }, sel);
  await page.evaluate(() => document.querySelector('.tabbar').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  for (const t of ['today', 'calendar', 'insights']) console.log('tab bar hit test (' + t + '):', await hit('.tabbar [data-tab="' + t + '"]'));
  console.log('log pill hit test:', await hit('[data-act="open-log"]'));
  console.log('stage box:', await page.evaluate(() => { const r = document.getElementById('phone-stage').getBoundingClientRect(); const p = document.getElementById('phone').getBoundingClientRect(); return `stage ${Math.round(r.width)}x${Math.round(r.height)} phone visual ${Math.round(p.width)}x${Math.round(p.height)} page scrollWidth=${document.documentElement.scrollWidth} innerWidth=${window.innerWidth}`; }));
  console.log('phone scale:', await page.evaluate(() => getComputedStyle(document.getElementById('phone')).getPropertyValue('--scale') + ' zoom=' + getComputedStyle(document.getElementById('phone')).zoom));
  console.log('click Calendar tab:', await act('.tabbar [data-tab="calendar"]'), '→', await state());
  console.log('calendar visible:', await page.locator('.screen .month').first().isVisible().catch(() => false));
  // scroll inside the phone: wheel at desktop, touch drag on iphone
  const scrollTop = () => page.evaluate(() => { const s = document.querySelector('.screen .scroll'); return s ? s.scrollTop : 'no .scroll'; });
  const pageY = () => page.evaluate(() => Math.round(window.scrollY));
  const y0 = await pageY();
  const box = await page.locator('.screen .scroll').boundingBox();
  if (box) {
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    if (touch && engine === chromium) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.synthesizeScrollGesture', { x: cx, y: cy, yDistance: -300, speed: 800 });
    } else if (touch) {
      await page.evaluate(() => { const s = document.querySelector('.screen .scroll'); s.scrollTop = 300; });
    } else { await page.mouse.move(cx, cy); await page.mouse.wheel(0, 300); }
    await page.waitForTimeout(500);
  }
  console.log('scroll inside calendar: scrollTop', await scrollTop(), '| page scrolled by', (await pageY()) - y0);
  console.log('Key sheet:', await act('[data-act="key"]'), '→', await state(), '| visible:', await page.locator('.sheet__title').isVisible().catch(() => false));
  console.log('close sheet (tap the scrim above the panel):', await (async () => { const loc = page.locator('.sheet__scrim'); try { if (touch) await loc.tap({ position: { x: 20, y: 20 }, timeout: 4000 }); else await loc.click({ position: { x: 20, y: 20 }, timeout: 4000 }); return 'ok'; } catch (e) { return 'FAIL ' + String(e).split('\n')[0]; } })(), '→', await state());
  console.log('Insights tab:', await act('.tabbar [data-tab="insights"]'), '→', await state());
  for (const t of ['trends', 'symptoms', 'history', 'overview']) console.log(' itab ' + t + ':', await act('.itabs [data-itab="' + t + '"]'), '→', await state());
  console.log(' Trends:', await act('.itabs [data-itab="trends"]'), 'range 6:', await act('[data-range="6"]'), 'range 12:', await act('[data-range="12"]'), '→', await state());
  console.log(' Overview:', await act('.itabs [data-itab="overview"]'), 'See all:', await act('[data-itab="symptoms"].textlink'), '→', await state());
  console.log('Today tab:', await act('.tabbar [data-tab="today"]'), 'open log:', await act('[data-act="open-log"]'), 'Symptoms:', await act('[data-act="section-symptoms"]'), 'Cramps:', await act('[data-chip="Cramps"]'), 'Back:', await act('[data-act="section-main"]'), 'Done:', await act('[data-act="done"]'), '→', await state());
  console.log('Insights again:', await act('.tabbar [data-tab="insights"]'), 'Symptoms:', await act('.itabs [data-itab="symptoms"]'), '| Cramps shown as today:', await page.locator('.symrow--new').count());
  if (!touch) {
    // keyboard: focus the Calendar tab, Enter selects it and focus stays on it; arrows move; Space selects
    await page.locator('.tabbar [data-tab="today"]').focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
    const after = () => page.evaluate(() => { const a = document.activeElement; return (a && a.getAttribute('data-tab')) || (a && a.tagName.toLowerCase()) || 'none'; });
    console.log('keyboard: ArrowRight+Enter →', await state(), '| focus on', await after());
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space'); await page.waitForTimeout(100);
    console.log('keyboard: ArrowRight+Space →', await state(), '| focus on', await after());
    await page.keyboard.press('Shift+Tab');
    console.log('keyboard: Shift+Tab lands on', await page.evaluate(() => { const a = document.activeElement; return a.getAttribute('data-itab') || a.getAttribute('data-act') || a.className || a.tagName; }));
    await page.keyboard.press('Escape');
    // accessibility names, as a screen reader would announce them
    const names = await page.getByRole('tab').evaluateAll((els) => els.map((b) => `${b.textContent.trim()}${b.getAttribute('aria-selected') === 'true' ? ' (selected)' : ''}`));
    const lists = await page.locator('[role="tablist"]').evaluateAll((els) => els.map((l) => l.getAttribute('aria-label') || '(no label)'));
    console.log('a11y: tablists', lists, '| tabs', names, '| icons hidden:', await page.locator('.tabbar svg[aria-hidden="true"]').count(), 'of', await page.locator('.tabbar svg').count());
  }
  console.log('errors:', errors);
  await ctx.close();
}
await browser.close();
