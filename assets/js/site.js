/* site.js — page behaviour for thedottie.app. No storage of any kind, no
   requests, nothing leaves the page. Every per-element style travels as
   data-s and is applied through the CSSOM, because the CSP forbids inline
   style attributes. */
(function () {
  'use strict';
  var D = window.DOTTIE_DATA;

  // One line to swap when the App Store listing is live. Leave empty until then.
  var APP_STORE_URL = '';

  document.querySelectorAll('.js-appstore').forEach(function (el) {
    if (!APP_STORE_URL) return;
    var a = document.createElement('a');
    a.className = el.className.replace('js-appstore', '').trim();
    a.href = APP_STORE_URL; a.rel = 'noopener';
    a.textContent = 'Download on the App Store';
    el.replaceWith(a);
  });

  // ---- the note of the day: one of Dottie's own, chosen by the real date ----
  var today = new Date();
  var note = window.noteOfTheDay ? window.noteOfTheDay(today) : '';
  document.querySelectorAll('.js-note').forEach(function (el) { el.textContent = note; });
  document.querySelectorAll('.js-today').forEach(function (el) { el.textContent = window.todayLabel(today); });

  // ---- the hero ring and the stage ring ------------------------------------
  var heroRing = document.getElementById('hero-ring');
  if (heroRing) window.drawHeroRing(heroRing, { scale: 3.0 });
  var stageRing = document.getElementById('stage-ring');
  if (stageRing) window.drawHeroRing(stageRing, { scale: 2.6, band: [0.935, 7 / 31] });

  // ---- the stage: calendar and chart layers --------------------------------
  function applyDataStyles(root) {
    root.querySelectorAll('[data-s]').forEach(function (el) { el.style.cssText = el.getAttribute('data-s'); });
  }
  function calendarSvg() {
    // November 2026, the month the expected window falls in (data.js)
    var y = 2026, m = 10, first = new Date(y, m, 1).getDay(), n = 30;
    var cell = 600 / 7, parts = [];
    parts.push('<text class="cal-head" x="16" y="52">November 2026</text>');
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d, i) { parts.push('<text class="cal-dow" x="' + (cell * i + cell / 2).toFixed(1) + '" y="88">' + d + '</text>'); });
    var ws = D.windowStart, we = D.windowEnd, start = D.lastPeriodStart;
    for (var i = 1; i <= n; i++) {
      var d = new Date(y, m, i), col = (first + i - 1) % 7, row = Math.floor((first + i - 1) / 7);
      var cx = cell * col + cell / 2, cy = 125 + row * 84, cls = 'cal-day';
      var day = Math.round((d - start) / 86400000) + 1, ov = D.avgCycle - 14;
      if (d >= ws && d <= we) cls += ' expected';
      else if (d < ws) cls += day < ov - 1 ? ' follicular' : day <= ov + 1 ? ' ovulatory' : ' luteal';
      parts.push('<circle class="' + cls + '" cx="' + cx.toFixed(1) + '" cy="' + cy + '" r="34"/>');
      parts.push('<text class="cal-num" x="' + cx.toFixed(1) + '" y="' + (cy + 4) + '">' + i + '</text>');
    }
    return '<svg viewBox="0 0 600 600" aria-hidden="true">' + parts.join('') + '</svg>';
  }
  function chartSvg() {
    var cl = D.cycleLengths, pl = D.periodLengths, lo = 24, hi = 38;
    var x = function (i) { return 60 + i * 480 / (cl.length - 1); };
    var y = function (v) { return 110 + (hi - v) / (hi - lo) * 180; };
    var parts = ['<text class="ch-title" x="40" y="60">Cycle length</text><text class="ch-sub" x="150" y="60">· days between periods</text>'];
    parts.push('<rect class="ch-band" x="40" y="' + y(38) + '" width="520" height="' + (y(24) - y(38)) + '"/>');
    parts.push('<text class="ch-label" x="22" y="' + (y(38) + 4) + '">38</text><text class="ch-label" x="22" y="' + (y(24) + 4) + '">24</text>');
    parts.push('<path class="ch-line" d="' + cl.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ') + '"/>');
    cl.forEach(function (v, i) { parts.push('<circle class="ch-dot" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="6"/>'); });
    parts.push('<text class="ch-title" x="40" y="370">Period length</text><text class="ch-sub" x="160" y="370">· how many days it lasted</text>');
    pl.forEach(function (v, i) { parts.push('<rect class="ch-bar" x="' + (x(i) - 22).toFixed(1) + '" y="' + (540 - v * 26) + '" width="44" height="' + (v * 26) + '" rx="10"/>'); parts.push('<text class="ch-label" x="' + x(i).toFixed(1) + '" y="566">' + (i + 1) + '</text>'); });
    parts.push('<text class="ch-sub" x="40" y="596">Aggregated by cycle · ' + cl.length + ' cycles</text>');
    return '<svg viewBox="0 0 600 600" aria-hidden="true">' + parts.join('') + '</svg>';
  }
  var calEl = document.getElementById('stage-calendar'), chartEl = document.getElementById('stage-chart');
  if (calEl && D) calEl.innerHTML = calendarSvg();
  if (chartEl && D) chartEl.innerHTML = chartSvg();

  var stage = document.getElementById('stage');
  var steps = document.querySelectorAll('.step[data-goto]');
  if (stage && steps.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) stage.setAttribute('data-step', e.target.getAttribute('data-goto')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }

  // ---- every stage: the small ring glyphs ------------------------------------
  document.querySelectorAll('.glyph[data-g]').forEach(function (g) {
    var frac = parseFloat(g.getAttribute('data-g')), R = 24, cx = 30, cy = 30;
    var inner;
    if (frac >= 1) inner = '<circle cx="30" cy="30" r="24" class="full"/>';
    else {
      var a1 = -90 + frac * 360, r = function (d) { return d * Math.PI / 180; };
      inner = '<path class="arc" d="M' + cx + ' ' + (cy - R) + ' A' + R + ' ' + R + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' + (cx + R * Math.cos(r(a1))).toFixed(1) + ' ' + (cy + R * Math.sin(r(a1))).toFixed(1) + '"/>';
    }
    g.innerHTML = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="24" class="t"/>' + inner + '</svg>';
  });

  // ---- the phone ---------------------------------------------------------------
  var phoneStage = document.getElementById('phone-stage'), phone = document.getElementById('phone');
  function fit() {
    if (!phoneStage || !phone) return;
    var s = Math.min(1, phoneStage.clientWidth / 430);
    phone.style.setProperty('--scale', String(s));
  }
  fit(); window.addEventListener('resize', fit);
  var reset = document.getElementById('reset');
  if (reset) reset.addEventListener('click', function () { if (window.DottiePhone) window.DottiePhone.reset(); });

  // ---- make it yours: the theme and appearance pick (page + phone, nothing stored) ----
  var html = document.documentElement;
  var VIBE = { clay: ['196,121,91', '217,168,92', 'rgba(120,105,80,0.12)'], lagoon: ['224,138,109', '120,180,160', 'rgba(70,110,100,0.12)'], orchid: ['168,104,176', '220,160,200', 'rgba(130,90,140,0.12)'], midnight: ['232,160,168', '255,220,190', 'rgba(255,255,255,0.10)'] };
  document.querySelectorAll('.vibe__ring[data-vibe]').forEach(function (el) {
    var v = VIBE[el.getAttribute('data-vibe')], rand = mulberry32(1337), out = '';
    for (var i = 0; i < 120; i++) {
      var u = rand(), t = Math.pow(u, 0.6), ang = -Math.PI / 2 + t * Math.PI * 1.1;
      var rr = 38 + (rand() - 0.5) * 7, rad = 0.5 + rand() * 1.4, op = 0.3 + 0.65 * t; rand(); var alt = rand() < 0.2; rand(); rand(); rand();
      out += '<circle class="mini-mote" cx="' + (43 + rr * Math.cos(ang)).toFixed(1) + '" cy="' + (43 + rr * Math.sin(ang)).toFixed(1) + '" r="' + rad.toFixed(2) + '" data-s="fill:rgb(' + (alt ? v[1] : v[0]) + ');opacity:' + op.toFixed(2) + '"/>';
    }
    el.innerHTML = '<svg viewBox="0 0 86 86" aria-hidden="true"><circle cx="43" cy="43" r="38" fill="none" data-s="stroke:' + v[2] + ';stroke-width:1.2"/>' + out + '</svg>';
    applyDataStyles(el);
  });
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  document.querySelectorAll('.vibe[data-theme]').forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-theme');
      if (name === 'clay') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', name);
      document.querySelectorAll('.vibe[data-theme]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      if (window.DottiePhone) window.DottiePhone.rerender();
    });
  });
  document.querySelectorAll('.chip[data-scheme]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = b.getAttribute('data-scheme');
      if (s === 'auto') html.removeAttribute('data-scheme'); else html.setAttribute('data-scheme', s);
      document.querySelectorAll('.chip[data-scheme]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    });
  });

  // ---- privacy you can test --------------------------------------------------------
  var air = document.getElementById('airplane'), airStatus = document.getElementById('air-status'), airNote = document.getElementById('air-note');
  if (air) air.addEventListener('change', function () {
    airStatus.innerHTML = air.checked ? '<span aria-label="Airplane mode on">✈</span>' : '<span class="mini__signal">●●●●</span>';
    airNote.textContent = air.checked ? 'Still cycle day 15, still Nov 12–18, still every note and every chart. There is no network code in Dottie to miss the network.' : 'Flip it. Nothing changes, because there is no network code in Dottie to miss the network. No account, no sync, no analytics, no crash reports.';
  });

  var pin = document.getElementById('pin'), pinResult = document.getElementById('pin-result'), pinCal = document.getElementById('pin-cal'), pinWhich = document.getElementById('pin-which');
  function miniCal(periodStart, periodLen, avg) {
    var first = new Date(2026, 9, 1).getDay(), out = '';
    for (var b = 0; b < first; b++) out += '<span></span>';
    for (var i = 1; i <= 31; i++) {
      var day = i - periodStart + 1, cls = '';
      if (day >= 1 && day <= periodLen) cls = 'p';
      else if (day > periodLen && day < avg - 15) cls = 'f';
      else if (day >= avg - 15 && day <= avg - 13) cls = 'o';
      else if (day > avg - 13 && day <= avg) cls = 'l';
      out += '<span class="' + cls + '">' + i + '</span>';
    }
    return out;
  }
  function typePin(kind) {
    if (!pin) return;
    var dots = pin.querySelectorAll('.pin__dots i');
    dots.forEach(function (d) { d.classList.remove('on'); });
    pinResult.hidden = true; pin.hidden = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var k = 0;
    function next() {
      if (k < 4) { dots[k].classList.add('on'); k++; if (reduce) next(); else setTimeout(next, 140); return; }
      setTimeout(function () {
        pin.hidden = true; pinResult.hidden = false;
        if (kind === 'real') { pinCal.innerHTML = miniCal(14, 5, 31); pinWhich.textContent = 'Her calendar: the period she logged on Oct 14 to 18.'; }
        else { pinCal.innerHTML = miniCal(5, 4, 29); pinWhich.textContent = 'The decoy: a believable history that is not hers. Same screen, same speed, no tell.'; }
      }, reduce ? 0 : 220);
    }
    next();
  }
  document.querySelectorAll('[data-pin]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-pin');
      if (kind === 'reset') { pinResult.hidden = true; pin.hidden = false; pin.querySelectorAll('.pin__dots i').forEach(function (d) { d.classList.remove('on'); }); return; }
      typePin(kind);
    });
  });

  var del = document.getElementById('del');
  document.querySelectorAll('[data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = b.getAttribute('data-del');
      del.setAttribute('data-state', a === 'ask' ? 'ask' : a === 'confirm' ? 'gone' : 'row');
    });
  });
})();
