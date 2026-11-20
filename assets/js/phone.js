/* phone.js — the interactive recreation of Dottie's three tabs.
   Wording is the app's own where the app has a line for it (src/copy/framing.ts,
   src/cycle/model.ts, src/cycle/evidence.ts, app/(tabs)/*). Data is fictional
   (data.js). The ring is a port of StardustRing.tsx: same seed, same scatter,
   same band arithmetic. Nothing here is stored or sent anywhere. */
(function () {
  'use strict';
  var D = window.DOTTIE_DATA;
  var root = document.getElementById('screen');
  if (!root || !D) return;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY = 86400000;
  function md(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function days(a, b) { return Math.round((b - a) / DAY); }
  function addDays(d, n) { return new Date(d.getTime() + n * DAY); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var initial = function () {
    return {
      tab: 'today', itab: 'overview', trange: 'all', symView: 'freq',
      sheet: null, section: 'main', day: null,
      flow: null, pain: null, feelings: [], symptoms: [],
      logged: false, periodStarted: false,
    };
  };
  var S = initial();

  // ---- derived ---------------------------------------------------------------
  function cycleStart() { return S.periodStarted ? D.today : D.lastPeriodStart; }
  function cycleDay() { return days(cycleStart(), D.today) + 1; }
  function phaseFor(day) { // by cycle day, average cycle (the calendar's position phase)
    var ov = D.avgCycle - 14;
    if (day <= 5) return 'menstrual';
    if (day < ov - 1) return 'follicular';
    if (day <= ov + 1) return 'ovulatory';
    return 'luteal';
  }
  function phaseWord() {
    var p = phaseFor(cycleDay());
    return { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulation', luteal: 'Luteal' }[p];
  }

  // ---- the stardust ring (StardustRing.tsx, ported) ------------------------------
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ringSvg(progress, windowFrac, bandStart) {
    var size = 208, cx = 104, cy = 104, R = size / 2 - 12, TAU = Math.PI * 2;
    var prog = Math.max(0, Math.min(1, progress));
    var count = Math.min(360, Math.max(40, Math.round(360 * prog)));
    var rand = mulberry32(1337);
    var sweep = prog * TAU;
    var dots = '';
    for (var i = 0; i < count; i++) {
      var u = rand(); var t = Math.pow(u, 0.6);
      var angle = -Math.PI / 2 + t * sweep;
      var rr = R + (rand() - 0.5) * 16;
      var rad = 0.4 + rand() * 1.2;
      var op = Math.min(1, 0.3 + 0.65 * t + rand() * 0.1);
      var alt = rand() < 0.2;
      var phase = rand(); rand(); var tw = 0.4 + rand() * 0.6;
      var x = cx + rr * Math.cos(angle), y = cy + rr * Math.sin(angle);
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rad.toFixed(2) + '" class="twinkle' + (alt ? ' alt' : '') + '" opacity="' + op.toFixed(2) + '" data-s="--d:' + (t * 0.7).toFixed(2) + ';--p:' + phase.toFixed(2) + ';--tw:' + tw.toFixed(2) + '"/>';
      if (rad > 1.35) dots += '<circle cx="' + (x - rad * 0.3).toFixed(1) + '" cy="' + (y - rad * 0.3).toFixed(1) + '" r="' + (rad * 0.35).toFixed(2) + '" class="glint" opacity="0.85"/>';
    }
    var band = '';
    if (windowFrac != null && bandStart != null) {
      var wDeg = Math.max(3, Math.min(359, windowFrac * 360));
      var turn = bandStart - Math.floor(bandStart);
      var a0 = -90 + turn * 360, a1 = a0 + wDeg;
      var r2 = function (d) { return d * Math.PI / 180; };
      var x0 = cx + R * Math.cos(r2(a0)), y0 = cy + R * Math.sin(r2(a0));
      var x1 = cx + R * Math.cos(r2(a1)), y1 = cy + R * Math.sin(r2(a1));
      band = '<path class="band" d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + R + ' ' + R + ' 0 ' + (wDeg > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" fill="none" stroke-width="7" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 208 208" width="208" height="208" aria-hidden="true">' +
      '<circle class="track" cx="104" cy="104" r="' + R + '" fill="none" stroke-width="2"/>' + band +
      '<g class="dust">' + dots + '</g></svg>';
  }

  // ---- pieces --------------------------------------------------------------------
  var ICON = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg>',
    insights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l5-6 4 3 7-8"/><path d="M16 6h4v4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8" stroke-linecap="round"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle class="knob" cx="9" cy="7" r="2.2"/><circle class="knob" cx="15" cy="17" r="2.2"/></svg>',
  };
  function statusBar() {
    return '<div class="sb" aria-hidden="true"><span>9:41</span><span class="sb__right">' +
      '<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>' +
      '<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0"/><path d="M4.5 7.2a6 6 0 0 1 8 0"/><circle cx="8.5" cy="10.3" r="1.1" fill="currentColor" stroke="none"/></svg>' +
      '<svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor"/><path d="M24.5 4.5v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.4"/></svg></span></div>';
  }
  function tabbar() {
    var t = ['today', 'calendar', 'insights'];
    return '<nav class="tabbar" aria-label="Tabs" role="tablist">' + t.map(function (k) {
      return '<button role="tab" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + ICON[k].replace('<svg ', '<svg aria-hidden="true" ') + k.charAt(0).toUpperCase() + k.slice(1) + '</button>';
    }).join('') + '</nav>';
  }

  // ---- Today ---------------------------------------------------------------------
  function todayPage() {
    var day = cycleDay();
    var prog = day / D.avgCycle;
    var startDay = days(cycleStart(), S.periodStarted ? addDays(D.today, D.avgCycle - 2) : D.windowStart) + 1;
    var ring = ringSvg(prog, 7 / D.avgCycle, startDay / D.avgCycle);
    var center, headline, sub, extra = '';
    if (S.periodStarted) {
      center = '<div class="ring__sub">Period</div><div class="ring__word">Day 1</div>';
      headline = 'Day 1 of your period';
      sub = '';
      extra = '<div class="confirm"><span>Got it. Your predictions just updated.</span><button type="button" data-act="undo">Undo</button></div>';
    } else {
      center = '<div class="ring__sub">Cycle day ' + day + '</div><div class="ring__word">' + phaseWord() + '</div>';
      headline = 'Period likely ' + md(D.windowStart) + '–' + D.windowEnd.getDate();
      sub = 'Based on your last ' + D.cycleLengths.length + ' cycles · usually within ' + D.within + ' days';
    }
    var receipt = '';
    if (S.logged) {
      var bits = [].concat(S.flow ? [S.flow] : [], S.symptoms, S.feelings);
      receipt = '<div class="receipt"><span><strong>Today:</strong> ' + esc(bits.join(' · ') || 'nothing yet') + '</span><button type="button" data-act="open-log">Edit</button></div>';
    } else {
      receipt = '<button type="button" class="logpill" data-act="open-log">Log how you feel ' + ICON.plus + '</button>';
    }
    return '<div class="page"><div class="scroll">' +
      '<div class="topline"><span>' + md(D.today) + '</span>' + ICON.sliders + '</div>' +
      '<div class="ring-wrap"><button type="button" class="ring" data-act="ring" aria-label="Today, cycle day ' + day + '">' + ring + '<div class="ring__center">' + center + '</div></button></div>' +
      '<p class="caption">The stardust is your cycle so far · the soft band is your expected period</p>' +
      '<h2 class="headline">' + esc(headline) + '</h2>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') + extra +
      '<p class="note-line">' + esc(D.phaseNote) + '</p>' +
      '</div><div class="bottom">' +
      (S.periodStarted ? '<button type="button" class="textlink" data-act="ended">My period ended →</button>' : '<button type="button" class="textlink" data-act="started">My period started →</button>') +
      receipt + '</div></div>';
  }

  // ---- Calendar ------------------------------------------------------------------
  function dayClass(d) {
    var cls = ['day'];
    var cs = cycleStart();
    var inPeriod = D.loggedPeriods.some(function (p) { return d >= p[0] && d <= p[1]; }) || (S.periodStarted && days(D.today, d) === 0);
    if (inPeriod) cls.push('day--period');
    else {
      var n = days(cs, d) + 1;
      if (n >= 1 && d >= cs) {
        var ws = S.periodStarted ? addDays(cs, D.avgCycle - 2) : D.windowStart;
        var we = addDays(ws, 6);
        if (d >= ws && d <= we) cls.push('day--expected');
        else if (d < ws) cls.push('day--' + phaseFor(n));
      } else if (d < cs) {
        // the previous cycle, from the month before
        var prev = D.loggedPeriods[1][0];
        var m = days(prev, d) + 1;
        if (d >= prev) cls.push('day--' + phaseFor(m));
      }
    }
    if (days(D.today, d) === 0) cls.push('day--today');
    if (!S.periodStarted && d.getTime() === addDays(D.windowStart, -2).getTime()) cls.push('day--sym');
    return cls.join(' ');
  }
  function monthGrid(y, m) {
    var first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate();
    var html = '<h2 class="month">' + LONG[m] + ' ' + y + '</h2><div class="dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="grid">';
    for (var b = 0; b < first.getDay(); b++) html += '<span></span>';
    for (var i = 1; i <= n; i++) {
      var d = new Date(y, m, i);
      html += '<button type="button" class="' + dayClass(d) + '" data-act="day" data-date="' + y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (i < 10 ? '0' : '') + i + '" aria-label="' + LONG[m] + ' ' + i + '">' + i + '</button>';
    }
    return html + '</div>';
  }
  function calendarPage() {
    return '<div class="page"><div class="scroll">' + monthGrid(2026, 9) + monthGrid(2026, 10) +
      '<p class="explainer">Tap any past or today\'s date to log it. Future dates are read-only.</p></div>' +
      '<button type="button" class="keychip" data-act="key"><i></i>Key</button></div>';
  }
  function keySheet() {
    var rows = [
      ['<i class="sw sw--period"></i>', 'Period (logged)'],
      ['<i class="sw sw--ring"></i>', 'Spotting'],
      ['<i class="sw sw--dash"></i>', 'Expected', 'The window when your period may start.'],
      ['<i class="sw sw--f"></i>', 'Follicular'],
      ['<i class="sw sw--o"></i>', 'Ovulatory'],
      ['<i class="sw sw--l"></i>', 'Luteal'],
      ['<i class="sw sw--sym"></i>', 'Symptom usually starts here'],
      ['<i class="sw sw--today"></i>', 'Today'],
    ];
    return sheet('<div class="sheet__title">Calendar key</div>' + rows.map(function (r) {
      return '<div class="keyrow">' + r[0] + '<div>' + r[1] + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</div></div>';
    }).join(''));
  }

  function daySheet() {
    var parts = S.day.split('-'), d = new Date(+parts[0], parts[1] - 1, +parts[2]);
    var cls = dayClass(d), lines = [];
    var future = days(D.today, d) > 0, isToday = days(D.today, d) === 0;
    if (isToday) lines.push('Today · Cycle day ' + cycleDay() + ' · ' + phaseWord());
    if (cls.indexOf('day--period') >= 0) lines.push('Period · logged');
    else if (cls.indexOf('day--expected') >= 0) lines.push('Expected · The window when your period may start.');
    else if (!isToday) { var ph = ['follicular', 'ovulatory', 'luteal', 'menstrual'].filter(function (k) { return cls.indexOf('day--' + k) >= 0; })[0]; if (ph) lines.push(ph.charAt(0).toUpperCase() + ph.slice(1) + ' phase'); }
    if (cls.indexOf('day--sym') >= 0) lines.push('Symptom usually starts here');
    if (!lines.length) lines.push(future ? 'Nothing predicted yet' : 'Nothing logged');
    return sheet('<div class="sheet__title">' + LONG[d.getMonth()] + ' ' + d.getDate() + '</div>' + lines.map(function (l) { return '<div class="row"><b>' + esc(l) + '</b></div>'; }).join('') +
      '<p class="explainer explainer--tight">' + (future ? 'Future dates are read-only.' : 'In Dottie, this is where you log the day. The demo shows it instead.') + '</p>' +
      '<button type="button" class="primary" data-act="close">Close</button>');
  }

  // ---- Insights ------------------------------------------------------------------
  function bucket(count, of) {
    var p = count / of;
    return p >= 0.8 ? 'Almost always' : p >= 0.5 ? 'Usually' : p >= 0.2 ? 'Sometimes' : 'Rarely';
  }
  function allSymptoms() {
    var list = D.symptoms.slice();
    var cycles = D.cycleLengths.length + 1; // the open cycle has reached this phase too
    S.symptoms.forEach(function (name) {
      if (!S.logged) return;
      var phase = phaseFor(cycleDay());
      var same = list.filter(function (s) { return s.name === name && s.phase === phase; })[0];
      if (same) list[list.indexOf(same)] = { name: name, phase: phase, count: same.count + 1, of: same.of + 1, fresh: true };
      else list.push({ name: name, phase: phase, count: 1, of: cycles, fresh: true });
    });
    return list;
  }
  function symRow(s) {
    return '<div class="symrow' + (s.fresh ? ' symrow--new' : '') + '"><div class="symrow__top"><span><b>' + esc(s.name) + '</b><small>' + s.phase.charAt(0).toUpperCase() + s.phase.slice(1) + '</small></span><span>' + s.count + ' of ' + s.of + (s.fresh ? ' · today' : '') + '</span></div><div class="bar"><i data-s="width:' + Math.round(100 * s.count / s.of) + '%"></i></div></div>';
  }
  function overview() {
    var day = cycleDay();
    var top = S.periodStarted ? 'Period · Day 1' : 'Cycle day ' + day + ' · ' + phaseWord();
    var ov = D.avgCycle - 14;
    var pos = Math.min(0.98, (day - 0.5) / D.avgCycle) * 100;
    var blurb = { menstrual: 'Your period. The uterine lining sheds, and cramps and fatigue are common.', follicular: 'Between your period and ovulation. Energy often increases during this phase.', ovulatory: 'Around ovulation. This is the most fertile part of your cycle.', luteal: 'After ovulation and before your next period. This is when PMS symptoms often appear.' }[phaseFor(day)];
    var sorted = allSymptoms().sort(function (a, b) { return b.count / b.of - a.count / a.of; }).slice(0, 3);
    var spread = Math.max.apply(null, D.cycleLengths) - Math.min.apply(null, D.cycleLengths);
    return '<div class="card"><h3>' + esc(top) + '</h3><p class="sub">Last period started ' + md(cycleStart()) + '</p></div>' +
      '<div class="label">Key numbers</div><div class="card"><div class="kv"><div><b>' + D.avgCycle + 'd</b><span>Average cycle</span></div><div><b>' + spread + 'd</b><span>Full spread</span></div><div><b>5d</b><span>Typical period</span></div></div><p class="muted">Based on your last ' + D.cycleLengths.length + ' completed periods.</p></div>' +
      '<div class="label">Where you are</div><div class="card"><div class="phasebar" aria-hidden="true"><i class="m"></i><i class="f"></i><i class="o"></i><i class="l"></i></div><div class="youare"><i data-s="left:' + pos.toFixed(1) + '%"></i></div><p class="muted tight">' + blurb + '</p></div>' +
      '<div class="label">Most consistent symptoms</div><div class="card">' + sorted.map(symRow).join('') + '<p class="muted"><button type="button" class="textlink textlink--small" data-itab="symptoms">See all symptoms →</button></p></div>' +
      '<div class="label">Doctor visit summary</div><div class="card"><p class="sub tight0">A one-page PDF of your history, created on this device.</p></div>';
  }
  function trends() {
    var cl = D.cycleLengths, pl = D.periodLengths;
    var W = 310, H = 120, lo = 24, hi = 38;
    var x = function (i) { return 30 + i * (W - 40) / (cl.length - 1); };
    var y = function (v) { return 10 + (hi - v) / (hi - lo) * (H - 30); };
    var line = cl.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var pts = cl.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4" class="c-accent"/>'; }).join('');
    var bars = pl.map(function (v, i) { var h = v * 14; return '<rect x="' + (x(i) - 14).toFixed(1) + '" y="' + (100 - h) + '" width="28" height="' + h + '" rx="6" class="c-secondary"/>'; }).join('');
    var labels = cl.map(function (v, i) { return '<text x="' + x(i).toFixed(1) + '" y="118" text-anchor="middle" class="c-label">' + (i + 1) + '</text>'; }).join('');
    var spread = Math.max.apply(null, cl) - Math.min.apply(null, cl);
    var ranges = [['6', 'Last 6'], ['12', 'Last 12'], ['all', 'All time']];
    return '<div class="seg seg-page">' + ranges.map(function (r) { return '<button type="button" class="chip" data-range="' + r[0] + '" aria-pressed="' + (S.trange === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div>' +
      '<div class="label">Cycle and period</div><p class="explainer explainer--tight">One column per cycle.</p>' +
      '<div class="card"><p class="sub tight0"><b class="c-ink">Cycle length</b> · days between periods</p>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' 130" aria-label="Cycle length, six cycles, ' + cl.join(', ') + ' days"><rect x="20" y="' + y(38).toFixed(1) + '" width="' + (W - 30) + '" height="' + (y(24) - y(38)).toFixed(1) + '" class="c-typical"/><text class="c-label" x="2" y="' + (y(38) + 4).toFixed(1) + '">38</text><text class="c-label" x="2" y="' + (y(24) + 4).toFixed(1) + '">24</text><path d="' + line + '" fill="none" class="c-line" stroke-width="2.5" stroke-linejoin="round"/>' + pts + '<text class="c-label c-label--s" x="30" y="' + (y(24) - 2).toFixed(1) + '">Typical 24–38</text></svg>' +
      '<p class="sub tight12"><b class="c-ink">Period length</b> · how many days it lasted</p>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' 124" aria-label="Period length, six cycles, ' + pl.join(', ') + ' days">' + bars + labels + '<line class="c-axis" x1="16" x2="' + W + '" y1="100" y2="100"/></svg>' +
      '<p class="muted">' + cl.length + ' cycles</p></div>' +
      '<div class="label">Cycle spread</div><div class="card"><div class="kv"><div><b>±2d</b><span>Usual variation</span></div><div><b>' + spread + 'd</b><span>Full spread</span></div><div><b>5d</b><span>Typical period</span></div></div><p class="muted">How far your cycles usually land from your average. One unusually long or short cycle moves it less than the full spread does.</p></div>';
  }
  function symptoms() {
    var list = allSymptoms();
    var html = '<div class="seg seg-page"><button type="button" class="chip" data-sym="freq" aria-pressed="' + (S.symView === 'freq') + '">By frequency</button><button type="button" class="chip" data-sym="phase" aria-pressed="' + (S.symView === 'phase') + '">By phase</button></div>';
    if (S.symView === 'freq') {
      var groups = ['Almost always', 'Usually', 'Sometimes', 'Rarely'];
      var hint = { 'Almost always': '80%+', 'Usually': '50–79%', 'Sometimes': '20–49%', 'Rarely': 'under 20%' };
      groups.forEach(function (g) {
        var rows = list.filter(function (s) { return bucket(s.count, s.of) === g; }).sort(function (a, b) { return b.count / b.of - a.count / a.of; });
        if (!rows.length) return;
        html += '<div class="group"><div class="label"><span>' + g + '</span><span>' + hint[g] + '</span></div>' + rows.map(symRow).join('') + '</div>';
      });
    } else {
      ['menstrual', 'follicular', 'ovulatory', 'luteal'].forEach(function (p) {
        var rows = list.filter(function (s) { return s.phase === p; });
        if (!rows.length) return;
        html += '<div class="group"><div class="label"><span>' + p + '</span><span>' + (p === 'menstrual' || p === 'follicular' ? D.cycleLengths.length + 1 : D.cycleLengths.length) + ' cycles</span></div>' + rows.map(symRow).join('') + '</div>';
      });
    }
    return html + '<p class="explainer">Over your last ' + D.cycleLengths.length + ' cycles, the same window as your cycle statistics. Each count includes only the cycles that reached that phase.</p>';
  }
  function history() {
    var rows = '', start = D.lastPeriodStart;
    for (var i = D.cycleLengths.length - 1; i >= 0; i--) {
      var len = D.cycleLengths[i];
      var s = addDays(start, -len);
      rows += '<div class="row"><b>' + md(s) + '</b><span>' + len + '-day cycle · ' + D.periodLengths[i] + '-day period</span></div>';
      start = s;
    }
    return '<div class="list"><div class="row"><b>' + md(cycleStart()) + '</b><span>open · day ' + cycleDay() + '</span></div>' + rows + '</div>';
  }
  function insightsPage() {
    var tabs = [['overview', 'Overview'], ['trends', 'Trends'], ['symptoms', 'Symptoms'], ['history', 'History']];
    var body = { overview: overview, trends: trends, symptoms: symptoms, history: history }[S.itab]();
    return '<div class="page"><div class="scroll">' +
      '<h1 class="h1">Insights <span class="i">i</span></h1><p class="lede-phone">Your patterns are calculated on this device and never uploaded.</p>' +
      '<div class="itabs" role="tablist" aria-label="Insights sections">' + tabs.map(function (t) { return '<button type="button" role="tab" data-itab="' + t[0] + '" aria-selected="' + (S.itab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      body + '</div></div>';
  }

  // ---- the log sheet -----------------------------------------------------------------
  function sheet(inner) {
    return '<div class="sheet"><button type="button" class="sheet__scrim" data-act="close" aria-label="Close"></button><div class="sheet__panel" role="dialog" aria-modal="true"><div class="sheet__grip"></div>' + inner + '</div></div>';
  }
  function logSheet() {
    var inner;
    if (S.section === 'symptoms') {
      inner = '<div class="label"><span>Symptoms</span></div><div class="chips chips--2">' + D.symptomChips.map(function (c) {
        return '<button type="button" class="chip" data-chip="' + esc(c) + '" aria-pressed="' + (S.symptoms.indexOf(c) >= 0) + '">' + esc(c) + '</button>';
      }).join('') + '</div><button type="button" class="primary" data-act="section-main">Back</button>';
    } else if (S.section === 'more') {
      inner = '<div class="label"><span>More</span></div>' + ['Cervical mucus', 'Stress', 'Exercise', 'Energy', 'Medications', 'Note'].map(function (l) {
        return '<div class="row"><b>' + l + '</b><span>' + (l === 'Note' ? 'Some days need a sentence, not a checkbox.' : '') + '</span></div>';
      }).join('') + '<button type="button" class="primary" data-act="section-main">Back</button>';
    } else {
      var flows = ['Spotting', 'Light', 'Medium', 'Heavy'];
      inner = '<div class="label"><span>How\'s today?</span></div>' +
        '<div class="label"><span>Flow</span></div><div class="seg">' + flows.map(function (f) { return '<button type="button" class="chip" data-flow="' + f + '" aria-pressed="' + (S.flow === f) + '">' + f + '</button>'; }).join('') + '</div>' +
        '<div class="label"><span>Pain</span><small>0 none · 10 worst</small></div><div class="pain">' + Array.apply(null, Array(11)).map(function (_, i) { return '<button type="button" data-pain="' + i + '" aria-pressed="' + (S.pain === i) + '">' + i + '</button>'; }).join('') + '</div>' +
        '<div class="label"><span>Feelings</span></div><div class="chips">' + D.feelings.map(function (f) { return '<button type="button" class="chip" data-feel="' + f + '" aria-pressed="' + (S.feelings.indexOf(f) >= 0) + '">' + f + '</button>'; }).join('') + '</div>' +
        '<div class="chips chips--2 chips--gap"><button type="button" class="chip" data-act="section-symptoms">Symptoms' + (S.symptoms.length ? ' · ' + S.symptoms.length : '') + '</button><button type="button" class="chip" data-act="section-more">More</button></div>' +
        '<button type="button" class="primary" data-act="done">Done</button>';
    }
    return sheet(inner);
  }

  // ---- render + events ------------------------------------------------------------------
  // Rendering replaces the screen's markup, which would drop keyboard focus to
  // the page. Remember what was focused by its data attribute and focus the
  // same control again; if it is gone (a sheet closed), focus the current tab.
  var FOCUS_KEYS = ['data-tab', 'data-itab', 'data-act', 'data-range', 'data-sym', 'data-flow', 'data-pain', 'data-feel', 'data-chip'];
  function focusKey(el) {
    if (!el || !root.contains(el)) return null;
    for (var i = 0; i < FOCUS_KEYS.length; i++) if (el.hasAttribute(FOCUS_KEYS[i])) return '[' + FOCUS_KEYS[i] + '="' + el.getAttribute(FOCUS_KEYS[i]) + '"]';
    return null;
  }
  function render() {
    var key = focusKey(document.activeElement);
    var page = { today: todayPage, calendar: calendarPage, insights: insightsPage }[S.tab]();
    var overlay = S.sheet === 'log' ? logSheet() : S.sheet === 'key' ? keySheet() : S.sheet === 'day' ? daySheet() : '';
    root.innerHTML = statusBar() + page + tabbar() + overlay;
    // Inline style attributes are blocked by the page's CSP (style-src 'self'),
    // so per-element values travel as data-s and are applied through the CSSOM.
    root.querySelectorAll('[data-s]').forEach(function (el) { el.style.cssText = el.getAttribute('data-s'); });
    if (key) {
      var again = root.querySelector(key) || root.querySelector('.tabbar [data-tab="' + S.tab + '"]');
      if (again) again.focus({ preventScroll: true });
    }
  }
  function hint(text) { var h = document.getElementById('hint'); if (h) h.textContent = text; }
  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab],[data-act],[data-itab],[data-flow],[data-pain],[data-feel],[data-chip],[data-range],[data-sym]');
    if (!el) return;
    var ds = el.dataset;
    if (ds.tab) { S.tab = ds.tab; S.sheet = null; }
    else if (ds.itab) { S.tab = 'insights'; S.itab = ds.itab; }
    else if (ds.range) { S.trange = ds.range; }
    else if (ds.sym) { S.symView = ds.sym; }
    else if (ds.flow) { S.flow = S.flow === ds.flow ? null : ds.flow; }
    else if (ds.pain) { S.pain = S.pain === +ds.pain ? null : +ds.pain; }
    else if (ds.feel) { toggle(S.feelings, ds.feel); }
    else if (ds.chip) { toggle(S.symptoms, ds.chip); }
    else if (ds.act) {
      switch (ds.act) {
        case 'open-log': S.sheet = 'log'; S.section = 'main'; break;
        case 'close': S.sheet = null; break;
        case 'key': S.sheet = 'key'; break;
        case 'section-symptoms': S.section = 'symptoms'; break;
        case 'section-more': S.section = 'more'; break;
        case 'section-main': S.section = 'main'; break;
        case 'done':
          S.sheet = null; S.logged = true;
          if (S.flow && S.flow !== 'Spotting') S.periodStarted = true;
          hint(S.symptoms.length ? 'Now open Insights and look under Symptoms.' : 'Logged. Try Insights, or open the log again and add a symptom.');
          break;
        case 'started': S.periodStarted = true; S.logged = true; if (!S.flow) S.flow = 'Light'; hint('The ring, the headline and the calendar now describe a period that started today.'); break;
        case 'ended': case 'undo': S.periodStarted = false; if (S.flow && S.flow !== 'Spotting') S.flow = null; if (!S.symptoms.length && !S.feelings.length && !S.flow) S.logged = false; break;
        case 'day': S.sheet = 'day'; S.day = el.getAttribute('data-date'); break;
        case 'ring': break;
      }
    }
    render();
  });
  // Mouse-wheel and trackpad scrolling over the phone moves the screen's own
  // scroller directly and never the page. Native nested scrolling is left to the
  // engines for touch; for wheel events, desktop Safari has been seen to scroll
  // nothing at all inside the phone, so the scroll is applied here instead.
  root.addEventListener('wheel', function (e) {
    var s = e.target.closest && e.target.closest('.scroll, .sheet__panel');
    if (!s) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * s.clientHeight : e.deltaY;
    e.preventDefault();
    s.scrollTop += dy;
  }, { passive: false });
  // Mouse drag-to-scroll: on a desktop, pressing on the screen and dragging up or
  // down moves the screen's scroller like a swipe, with a little momentum after
  // release. It counts as a drag only after a few pixels of movement, so ordinary
  // clicks on tabs, buttons and calendar days are untouched; the click that
  // follows a real drag is swallowed. Touch (iPhone) never enters this path.
  var drag = null, momentum = 0, swallowClick = false;
  var DRAG_THRESHOLD = 5, FRICTION = 0.94;
  function stopMomentum() { if (momentum) cancelAnimationFrame(momentum); momentum = 0; }
  function glide(s, v) {
    stopMomentum();
    var step = function () {
      if (Math.abs(v) < 0.4 || !root.contains(s)) { momentum = 0; return; }
      s.scrollTop -= v; v *= FRICTION;
      momentum = requestAnimationFrame(step);
    };
    momentum = requestAnimationFrame(step);
  }
  function onMove(e) {
    if (!drag) return;
    var dy = e.clientY - drag.startY;
    if (!drag.active) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.active = true; root.classList.add('is-dragging');
    }
    drag.s.scrollTop = drag.startTop - dy;
    var now = e.timeStamp || Date.now();
    if (now > drag.lastT) { drag.v = (e.clientY - drag.lastY) / (now - drag.lastT) * 16; drag.lastY = e.clientY; drag.lastT = now; }
    e.preventDefault();
  }
  function onUp(e) {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    if (!drag) return;
    var d = drag; drag = null; root.classList.remove('is-dragging');
    if (d.active) {
      swallowClick = true; setTimeout(function () { swallowClick = false; }, 0);
      var idle = (e.timeStamp || Date.now()) - d.lastT > 80;
      if (!idle && Math.abs(d.v) > 1) glide(d.s, d.v);
    }
  }
  root.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    var s = e.target.closest && e.target.closest('.scroll, .sheet__panel');
    if (!s) return;
    stopMomentum();
    drag = { s: s, startY: e.clientY, startTop: s.scrollTop, lastY: e.clientY, lastT: e.timeStamp || Date.now(), v: 0, active: false };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  });
  root.addEventListener('click', function (e) { if (swallowClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  root.addEventListener('wheel', stopMomentum, { passive: true });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.sheet) { S.sheet = null; render(); return; }
    // Left and right arrows move between the tabs of a tab list; Enter or Space selects.
    var list = e.target.closest && e.target.closest('[role="tablist"]');
    if (!list || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(e.target); if (i < 0) return;
    var next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    tabs[next].focus(); e.preventDefault();
  });

  window.DottiePhone = { reset: function () { S = initial(); render(); hint('Try: Log how you feel, then Symptoms, then Cramps.'); }, rerender: render, state: function () { return S; } };
  render();
})();
