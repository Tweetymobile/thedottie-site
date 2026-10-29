// test-phone-safari.mjs — drive the demo phone in the real Safari on this Mac
// through safaridriver (W3C WebDriver over HTTP; no extra packages). Safari
// must have "Allow remote automation" on (Safari > Settings > Developer).
//   node scripts/test-phone-safari.mjs [https://thedottie.app] [window width]
import { spawn } from 'node:child_process';

const base = (process.argv[2] || 'https://thedottie.app').replace(/\/$/, '');
const width = Number(process.argv[3] || 1440), height = 900;
const port = 4455;
const driver = spawn('safaridriver', ['-p', String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const api = async (method, path, body) => {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json(); if (j.value && j.value.error) throw new Error(j.value.error + ': ' + j.value.message); return j.value;
};
let sid;
try {
  sid = (await api('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'safari' } } })).sessionId;
} catch (e) { console.log('Safari session failed:', e.message); driver.kill(); process.exit(2); }
const S = (p, b) => api('POST', `/session/${sid}${p}`, b);
const js = (script, ...args) => S('/execute/sync', { script, args });
const find = (sel) => S('/element', { using: 'css selector', value: sel }).then((v) => Object.values(v)[0]);
// Clicks are raw pointer actions at the control's centre (what a mouse does). safaridriver's
// element click refuses controls inside the phone's nested scroller ("element not interactable")
// even though they are visible, topmost and clickable, so it is not used.
const click = async (sel) => { try {
  const r = await js('var el=document.querySelector(arguments[0]); if(!el) return null; if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded(false); else el.scrollIntoView({block:"nearest"}); var b=el.getBoundingClientRect(); var t=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2); return [Math.round(b.left+b.width/2), Math.round(b.top+b.height/2), el.contains(t)]', sel);
  if (!r) return 'MISSING'; if (!r[2]) return 'COVERED';
  await S('/actions', { actions: [{ type: 'pointer', id: 'm', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x: r[0], y: r[1], origin: 'viewport' }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }] });
  await sleep(350); return 'ok';
} catch (e) { return 'FAIL ' + e.message.split('\n')[0]; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = () => js('var s=window.DottiePhone.state(); return "tab="+s.tab+" itab="+s.itab+" range="+s.trange+" sheet="+s.sheet+" symptoms="+s.symptoms.join("/")+" logged="+s.logged');
const hit = (sel) => js('var el=document.querySelector(arguments[0]); if(!el) return "none"; var r=el.getBoundingClientRect(); var t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return "rect="+Math.round(r.left)+","+Math.round(r.top)+" "+Math.round(r.width)+"x"+Math.round(r.height)+" topmost="+(t?t.tagName.toLowerCase()+"."+(t.className&&t.className.baseVal!==undefined?t.className.baseVal:t.className||""):"null")+" inside="+el.contains(t)', sel);

console.log('=== real Safari', (await js('return navigator.userAgent')).match(/Version\/[\d.]+ Safari/)?.[0], '| window', width + 'x' + height);
await S('/window/rect', { width, height });
await S('/url', { url: base + '/' });
await sleep(2500);
console.log('page errors so far:', await js('return (window.__errs||[]).length'));
await js('window.__errs=[]; window.addEventListener("error", function(e){ window.__errs.push(String(e.message)); });');
await js('document.querySelector(".tabbar").scrollIntoView({block:"center"})'); await sleep(400);
for (const t of ['today', 'calendar', 'insights']) console.log('tab bar hit test (' + t + '):', await hit('.tabbar [data-tab="' + t + '"]'));
console.log('scale:', await js('return getComputedStyle(document.getElementById("phone-stage")).getPropertyValue("--scale")'));
console.log('click Calendar tab:', await click('.tabbar [data-tab="calendar"]'), '→', await state());
// wheel scrolling over the phone with a real WebDriver wheel action (trackpad/mouse wheel path)
const wheel = async () => {
  const r = await js('var b=document.querySelector(".screen .scroll").getBoundingClientRect(); return [Math.round(b.left+b.width/2), Math.round(b.top+b.height/2)]');
  const y0 = await js('return window.scrollY');
  try { await S('/actions', { actions: [{ type: 'wheel', id: 'wheel1', actions: [{ type: 'scroll', x: r[0], y: r[1], deltaX: 0, deltaY: 300, origin: 'viewport', duration: 200 }] }] }); await sleep(600); }
  catch (e) { return 'wheel action unsupported: ' + e.message.split('\n')[0]; }
  return 'inner scrollTop ' + (await js('return document.querySelector(".screen .scroll").scrollTop')) + ' | page scrolled by ' + ((await js('return window.scrollY')) - y0);
};
console.log('wheel inside calendar:', await wheel());
console.log('Key sheet:', await click('[data-act="key"]'), '→', await state(), '| visible:', await js('var t=document.querySelector(".sheet__title"); return !!t && t.getBoundingClientRect().height>0'));
console.log('close sheet (click the scrim above the panel):', await (async () => { try { await js('document.getElementById("phone").scrollIntoView({block:"center"})'); await sleep(300); const r = await js('var b=document.querySelector(".sheet__scrim").getBoundingClientRect(); return [Math.round(b.left+b.width/2), Math.round(Math.max(b.top,0)+24)]'); await S('/actions', { actions: [{ type: 'pointer', id: 'm', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x: r[0], y: r[1], origin: 'viewport' }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }] }); await sleep(350); return 'ok'; } catch (e) { return 'FAIL ' + e.message; } })(), '→', await state());
console.log('reopen key and close with Escape:', await click('[data-act="key"]'), await (async () => { try { await js('document.querySelector(".sheet__scrim").focus()'); await S('/actions', { actions: [{ type: 'key', id: 'k', actions: [{ type: 'keyDown', value: '\uE00C' }, { type: 'keyUp', value: '\uE00C' }] }] }); await sleep(300); return 'ok'; } catch (e) { return 'FAIL ' + e.message; } })(), '→', await state());
console.log('Insights tab:', await click('.tabbar [data-tab="insights"]'), '→', await state());
for (const t of ['trends', 'symptoms', 'history', 'overview']) console.log(' itab ' + t + ':', await click('.itabs [data-itab="' + t + '"]'), '→', await state());
console.log(' Trends:', await click('.itabs [data-itab="trends"]'), 'range 6:', await click('[data-range="6"]'), 'range 12:', await click('[data-range="12"]'), '→', await state());
console.log(' wheel inside trends:', await wheel());
console.log(' Overview:', await click('.itabs [data-itab="overview"]'), 'See all:', await click('[data-itab="symptoms"].textlink'), '→', await state());
console.log('Today tab:', await click('.tabbar [data-tab="today"]'), 'open log:', await click('[data-act="open-log"]'), 'Symptoms:', await click('[data-act="section-symptoms"]'), 'Cramps:', await click('[data-chip="Cramps"]'), 'Back:', await click('[data-act="section-main"]'), 'Done:', await click('[data-act="done"]'), '→', await state());
console.log('Insights again:', await click('.tabbar [data-tab="insights"]'), 'Symptoms:', await click('.itabs [data-itab="symptoms"]'), '| Cramps shown as today:', await js('return document.querySelectorAll(".symrow--new").length'));
console.log('errors during the run:', await js('return window.__errs'));
await api('DELETE', `/session/${sid}`);
driver.kill();
