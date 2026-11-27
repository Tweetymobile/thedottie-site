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

  // ---- the hero ring and the stage ring: Today's ring on the demo's cycle day 15 ----
  var RING = window.DottieRing, P = window.DottiePhone;
  var ringNow = D ? { prog: 15 / D.avgExact, band: [D.avgCycle / D.avgExact, D.periodLen / D.avgExact] } : null;
  var heroRing = document.getElementById('hero-ring');
  if (heroRing && RING && ringNow) RING.draw(heroRing, { prog: ringNow.prog, band: ringNow.band, gather: true });
  var stageRing = document.getElementById('stage-ring');
  if (stageRing && RING && ringNow) RING.draw(stageRing, ringNow);

  // ---- the calendar and the chart, for the stage and for each step on small screens ----
  function calendarSvg() {
    // November 2026, drawn by the demo's own day rules (phone.js), in the app's Midnight colours
    var y = 2026, m = 10, first = new Date(y, m, 1).getDay(), n = 30;
    var cell = 600 / 7, parts = [];
    parts.push('<text class="cal-head" x="16" y="52">November 2026</text>');
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d, i) { parts.push('<text class="cal-dow" x="' + (cell * i + cell / 2).toFixed(1) + '" y="88">' + d + '</text>'); });
    for (var i = 1; i <= n; i++) {
      var col = (first + i - 1) % 7, row = Math.floor((first + i - 1) / 7);
      var cx = cell * col + cell / 2, cy = 125 + row * 76;
      var o = P.dayInfo(new Date(y, m, i)), cls = 'cal-day' + (o.phase ? ' ' + o.phase : '') + (o.dash ? ' dash' : '');
      parts.push('<circle class="' + cls + '" cx="' + cx.toFixed(1) + '" cy="' + cy + '" r="32"/>');
      parts.push('<text class="cal-num' + (o.phase ? ' ' + o.phase : '') + '" x="' + cx.toFixed(1) + '" y="' + (cy + 5) + '">' + i + '</text>');
    }
    return '<svg viewBox="0 0 600 600" aria-hidden="true">' + parts.join('') + '</svg>';
  }
  function chartSvg() {
    var cl = D.cycleLengths, pl = D.periodLengths.slice(0, cl.length), lo = 24, hi = 38;
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var x = function (i) { return 70 + i * 470 / (cl.length - 1); };
    var y = function (v) { return 110 + (hi - v) / (hi - lo) * 180; };
    var parts = ['<text class="ch-title" x="40" y="60">Cycle length</text><text class="ch-sub" x="150" y="60">· days between periods</text>'];
    [38, 31, 24].forEach(function (v) { parts.push('<line class="ch-grid" x1="46" x2="580" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ch-label" x="26" y="' + (y(v) + 4) + '">' + v + '</text>'); });
    parts.push('<path class="ch-line" d="' + cl.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ') + '"/>');
    cl.forEach(function (v, i) { parts.push('<circle class="ch-dot" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === cl.length - 1 ? 8 : 6) + '"/><text class="ch-num" x="' + x(i).toFixed(1) + '" y="' + (y(v) - 14).toFixed(1) + '">' + v + '</text>'); });
    parts.push('<text class="ch-title" x="40" y="370">Period length</text><text class="ch-sub" x="160" y="370">· days it lasted</text>');
    pl.forEach(function (v, i) { parts.push('<rect class="ch-bar" x="' + (x(i) - 22).toFixed(1) + '" y="' + (540 - v * 24) + '" width="44" height="' + (v * 24) + '" rx="10"/><text class="ch-num" x="' + x(i).toFixed(1) + '" y="' + (540 - v * 24 - 8) + '">' + v + '</text>'); });
    [0, 2, 3, 5].forEach(function (i) { parts.push('<text class="ch-label" x="' + x(i).toFixed(1) + '" y="566">' + MON[D.starts[i].getMonth()] + ' ' + D.starts[i].getDate() + '</text>'); });
    return '<svg viewBox="0 0 600 600" aria-hidden="true">' + parts.join('') + '</svg>';
  }
  if (D && P) {
    ['stage-calendar', 'step-calendar'].forEach(function (id) { var el = document.getElementById(id); if (el) el.innerHTML = calendarSvg(); });
    ['stage-chart', 'step-chart'].forEach(function (id) { var el = document.getElementById(id); if (el) el.innerHTML = chartSvg(); });
  }

  var stage = document.getElementById('stage');
  var steps = document.querySelectorAll('.step[data-goto]');
  if (stage && steps.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) stage.setAttribute('data-step', e.target.getAttribute('data-goto')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }

  // ---- every stage, and for parents: the small rings ---------------------------
  document.querySelectorAll('.mini-ring').forEach(function (el) { if (window.drawMiniRing) window.drawMiniRing(el); });

  // ---- every stage: on small screens the chips show one card at a time ----------
  var stageGrid = document.getElementById('stage-grid'), stageChips = document.querySelectorAll('.stage-pick [data-stage]');
  stageChips.forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-stage');
      stageGrid.setAttribute('data-pick', name);
      stageChips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    });
  });
  // a link straight to one card ("For parents" points back to First Cycles) picks it
  function pickFromHash() {
    var m = /^#stage-(\w+)$/.exec(location.hash);
    if (m && stageGrid) stageChips.forEach(function (o) { if (o.getAttribute('data-stage') === m[1]) o.click(); });
  }
  window.addEventListener('hashchange', pickFromHash); pickFromHash();

  // ---- what private means here: count what this page loaded, in the browser ------
  // Read from the browser's own resource timing, computed here, stored nowhere.
  var counter = document.getElementById('req-counter');
  function countLoads() {
    if (!counter || !window.performance || !performance.getEntriesByType) return;
    var entries = performance.getEntriesByType('resource');
    var here = location.origin, off = 0;
    entries.forEach(function (e) { try { if (new URL(e.name, location.href).origin !== here) off++; } catch (x) {} });
    var total = entries.length + 1; // plus this page
    counter.innerHTML = 'Your browser can confirm it: this page loaded <b>' + total + ' files</b>, counted by the browser itself just now. From anywhere other than this site: <b>' + off + '</b>.';
  }
  if (document.readyState === 'complete') setTimeout(countLoads, 300); else window.addEventListener('load', function () { setTimeout(countLoads, 300); });

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
    phoneStage.style.setProperty('--scale', String(s));
  }
  fit(); window.addEventListener('resize', fit);
  var reset = document.getElementById('reset');
  if (reset) reset.addEventListener('click', function () { if (window.DottiePhone) window.DottiePhone.reset(); });

  // ---- make it yours: the theme and appearance pick (page + phone, nothing stored) ----
  var html = document.documentElement;
  var themeButtons = document.querySelectorAll('.vibe[data-theme], .theme-dot[data-theme]');
  themeButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-theme');
      if (name === 'clay') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', name);
      themeButtons.forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-theme') === name)); });
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
    airNote.textContent = air.checked ? 'Still cycle day 15, still Nov 12–16, still every note and every chart. Your records never use the network.' : 'Flip it. Everything you track carries on, because your records never use the network. No account, no sync, no analytics, no crash reports. Only Plus needs a connection, to check its prices and to buy or restore it, and that goes through the App Store.';
  });

  var del = document.getElementById('del');
  document.querySelectorAll('[data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = b.getAttribute('data-del');
      del.setAttribute('data-state', a === 'ask' ? 'ask' : a === 'confirm' ? 'gone' : 'row');
    });
  });
})();
