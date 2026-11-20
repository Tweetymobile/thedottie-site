/* phone.js — the interactive recreation of Dottie's three tabs.
   Wording is the app's own wherever the app has a line for it; where it comes
   from is noted beside each piece. The record is made up (data.js). The rules
   are ports of the app's: which phase a day is in (Bull's ovulation rule, as
   src/predictions.ts has it), where the window and the predicted period days
   fall, and how the ring is drawn (ring.js). Nothing here is stored or sent. */
(function () {
  'use strict';
  var D = window.DOTTIE_DATA, RING = window.DottieRing;
  var root = document.getElementById('screen');
  if (!root || !D || !RING) return;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY = 86400000;
  function md(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function mdy(d) { return md(d) + ', ' + d.getFullYear(); }
  function days(a, b) { return Math.round((b - a) / DAY); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return days(a, b) === 0; }
  function iso(d) { return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
  // the app's fmtRange: "Nov 12–16" in one month, "Oct 30 – Nov 3" across two
  function range(a, b) { return a.getMonth() === b.getMonth() ? md(a) + '–' + b.getDate() : md(a) + ' – ' + md(b); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var initial = function () {
    return {
      tab: 'today', itab: 'overview', trange: '12', hrange: 'all', symView: 'freq',
      sheet: null, section: null, day: null, page: null,
      flow: null, pain: null, feelings: [], symptoms: [], more: {},
      logged: false, ended: false, confirm: null, confirmUndo: null,
    };
  };
  var S = initial();

  // ---- the record, and what follows from it ------------------------------------
  function periodToday() { return S.flow != null && S.flow !== 'Spotting'; }      // a period day logged today
  function periodOpen() { return periodToday() && !S.ended; }
  function starts() { return periodToday() ? D.starts.concat([D.today]) : D.starts; }
  function cycleStart() { var s = starts(); return s[s.length - 1]; }
  function cycleDay() { return days(cycleStart(), D.today) + 1; }
  function nextStart() { return addDays(cycleStart(), D.avgCycle); }
  function win() { var n = nextStart(); return [addDays(n, -D.windowDays), addDays(n, D.windowDays)]; }
  // Bull's luteal length by cycle length, and the ovulation cycle day (src/predictions.ts)
  var BULL = [[18.4, 8.0], [23.4, 11.0], [27.6, 12.4], [32.4, 12.9], [39.8, 12.9]];
  function lutealDays(len) {
    if (len <= BULL[0][0]) return BULL[0][1];
    for (var i = 1; i < BULL.length; i++) if (len <= BULL[i][0]) return BULL[i - 1][1] + (BULL[i][1] - BULL[i - 1][1]) * (len - BULL[i - 1][0]) / (BULL[i][0] - BULL[i - 1][0]);
    return BULL[BULL.length - 1][1];
  }
  function ovulationDay(len) { return Math.round(len - lutealDays(len)); }
  function phaseAt(day, len, periodLen) {
    var ov = ovulationDay(len);
    if (day <= periodLen) return 'menstrual';
    if (Math.abs(day - ov) <= 1) return 'ovulatory';
    return day > ov ? 'luteal' : 'follicular';
  }
  // every start the calendar phases from: the real ones, then the projected ones
  function allStarts() {
    var s = starts().slice(), n = nextStart();
    for (var i = 0; i < 4; i++) s.push(addDays(n, i * D.avgCycle));
    return s;
  }
  function periodLenOf(i) { return i < D.periodLengths.length ? D.periodLengths[i] : D.periodLen; } // an open or a projected period is drawn at her usual length
  function phaseOn(date) {
    var s = allStarts();
    for (var i = s.length - 2; i >= 0; i--) {
      if (date < s[i]) continue;
      return phaseAt(days(s[i], date) + 1, days(s[i], s[i + 1]), periodLenOf(i));
    }
    return null;
  }
  function loggedPeriod(date) {
    for (var i = 0; i < D.starts.length; i++) { var n = days(D.starts[i], date); if (n >= 0 && n < D.periodLengths[i]) return true; }
    return periodToday() && same(date, D.today);
  }
  function loggedFlow(date) { // what each made-up period day was logged as
    for (var i = 0; i < D.starts.length; i++) {
      var n = days(D.starts[i], date), len = D.periodLengths[i];
      if (n < 0 || n >= len) continue;
      var heavy = i % 2 === 0 ? 2 : 1;
      return n === 0 ? 'Medium' : n <= heavy ? 'Heavy' : n === 2 ? 'Medium' : 'Light';
    }
    return null;
  }
  var RING_WORD = { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulation', luteal: 'Luteal' }; // the ring says "Ovulation"; lists say "Ovulatory"
  function todayPhase() { return periodToday() ? 'menstrual' : phaseOn(D.today); }
  function symptomDay(date) { return D.symptomDays.indexOf(iso(date)) >= 0 || (same(date, D.today) && S.symptoms.length > 0); }

  // ---- pieces --------------------------------------------------------------------
  var ICON = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg>',
    insights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l5-6 4 3 7-8"/><path d="M16 6h4v4"/></svg>',
    plus: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13" cy="13" r="12"/><path d="M13 8v10M8 13h10" stroke-linecap="round"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle class="knob" cx="9" cy="7" r="2.2"/><circle class="knob" cx="15" cy="17" r="2.2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  var INFO = '<span class="i" aria-hidden="true">i</span>';
  function statusBar() {
    return '<div class="sb" aria-hidden="true"><span>9:41</span><span class="sb__right">' +
      '<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>' +
      '<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0"/><path d="M4.5 7.2a6 6 0 0 1 8 0"/><circle cx="8.5" cy="10.3" r="1.1" fill="currentColor" stroke="none"/></svg>' +
      '<svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor"/><path d="M24.5 4.5v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.4"/></svg></span></div>';
  }
  function tabbar() {
    var t = ['today', 'calendar', 'insights'];
    return '<nav class="tabbar" aria-label="Tabs" role="tablist">' + t.map(function (k) {
      return '<button role="tab" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + ICON[k].replace('<svg ', '<svg aria-hidden="true" ') + cap(k) + '</button>';
    }).join('') + '</nav>';
  }

  // ---- Today (app/(tabs)/index.tsx, src/cycle/model.ts) ------------------------------
  // The receipt's words (src/util/summary.ts): flow, then symptoms, pain, feelings, energy.
  function summary() {
    var seg = [], extra = 0;
    if (S.flow === 'Started') seg.push('Period logged, add details');
    else if (S.flow === 'Spotting') seg.push('spotting');
    else if (S.flow) seg.push(S.flow.toLowerCase() + ' flow');
    if (S.symptoms.length) { seg.push(S.symptoms.slice(0, 3).join(', ').toLowerCase()); extra += Math.max(0, S.symptoms.length - 3); }
    if (S.pain != null) seg.push('pain ' + S.pain + '/10');
    if (S.feelings.length) { seg.push(S.feelings.slice(0, 3).join(', ').toLowerCase()); extra += Math.max(0, S.feelings.length - 3); }
    if (S.more.Energy) seg.push((S.more.Energy === 'OK' ? 'OK' : S.more.Energy.toLowerCase()) + ' energy');
    ['Cervical mucus', 'Stress', 'Exercise'].forEach(function (k) { if (S.more[k]) extra++; });
    if (extra) seg.push('+' + extra + ' more');
    return seg.join(' · ');
  }
  function anythingLogged() { return S.flow != null || S.pain != null || S.feelings.length || S.symptoms.length || Object.keys(S.more).length; }
  function todayPage() {
    var day = cycleDay(), w = win(), on = periodToday();
    var ring = RING.svg({ prog: day / D.avgExact, band: [D.avgCycle / D.avgExact, D.periodLen / D.avgExact] });
    var center, headline, sub;
    if (periodOpen()) {
      center = '<div class="ring__word">Menstrual</div>';                       // during a period the ring's top line is empty
      headline = 'Day 1 of your period'; sub = D.usualPeriod;
    } else {
      center = '<div class="ring__sub">Cycle day ' + day + '</div><div class="ring__word">' + RING_WORD[todayPhase()] + '</div>';
      headline = 'Period likely ' + range(w[0], w[1]);
      sub = 'Based on your last ' + D.cycleLengths.length + ' cycles · your cycles vary by about ' + D.spread + ' days';
    }
    var control;
    if (S.confirm) control = '<div class="confirm"><span>' + esc(S.confirm) + '</span>' + (S.confirmUndo ? '<button type="button" data-act="undo">Undo</button>' : '') + '<button type="button" class="confirm__x" data-act="hide-confirm" aria-label="Hide this note">✕</button></div>';
    else if (periodOpen()) control = '<button type="button" class="textlink" data-act="ended">My period ended →</button>';
    else control = '<button type="button" class="textlink" data-act="started">My period started →</button>';
    var log = S.logged && anythingLogged()
      ? '<button type="button" class="receipt" data-act="open-log"><span class="receipt__text"><small>Today</small>' + esc(summary()) + '</span><span class="receipt__edit">Edit</span></button>'
      : '<button type="button" class="logpill" data-act="open-log">Log how you feel ' + ICON.plus + '</button>';
    return '<div class="page"><div class="scroll">' +
      '<div class="topline"><span>' + md(D.today) + '</span>' + ICON.sliders + '</div>' +
      '<div class="ring-wrap"><button type="button" class="ring" data-act="open-log" aria-label="Today, ' + (periodOpen() ? 'day 1 of your period' : 'cycle day ' + day) + '">' + ring + '<div class="ring__center">' + center + '</div></button></div>' +
      '<h2 class="headline">' + esc(headline) + '</h2><p class="sub">' + esc(sub) + '</p>' +
      '<p class="note-line">' + esc(D.notes[on ? 'menstrual' : 'follicular']) + '</p>' +
      '</div><div class="bottom">' + control + log + '</div></div>';
  }

  // ---- Calendar (src/components/MonthGrid.tsx) -------------------------------------
  function dayInfo(d) {
    var future = days(D.today, d) > 0, w = win();
    var o = { future: future, today: same(d, D.today), period: loggedPeriod(d), phase: null, dash: false, sym: false, spot: false };
    if (!o.period) {
      o.phase = phaseOn(d);
      o.dash = future && d >= w[0] && d <= w[1];                                  // the window her period may start in
      o.spot = o.today && S.flow === 'Spotting';
    }
    o.sym = !future && symptomDay(d);
    return o;
  }
  function dayClass(o) {
    var c = ['day'];
    if (o.period) c.push('day--period');
    else if (o.phase) c.push('day--' + o.phase, o.future ? 'is-future' : 'is-past');
    else if (o.future) c.push('is-ahead');
    if (o.dash) c.push('day--dash');
    if (o.today) c.push('day--today');
    if (o.sym) c.push('day--sym');
    if (o.spot) c.push('day--spot');
    return c.join(' ');
  }
  function dayLabel(d, o) {
    var bits = [LONG[d.getMonth()] + ' ' + d.getDate()];
    if (o.today) bits.push('today');
    if (o.period) bits.push('period logged');
    else if (o.dash) bits.push('in the window your period may start');
    else if (o.phase === 'menstrual') bits.push('a day your period is likely');
    else if (o.phase) bits.push(o.phase + ' phase');
    if (o.sym) bits.push('symptoms logged');
    return bits.join(', ');
  }
  function monthGrid(y, m, locked) {
    var first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate();
    var html = '<h2 class="month">' + LONG[m] + ' ' + y + '</h2><div class="dow" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="grid">';
    for (var b = 0; b < first.getDay(); b++) html += '<span></span>';
    for (var i = 1; i <= n; i++) {
      var d = new Date(y, m, i), o = dayInfo(d);
      html += locked ? '<span class="' + dayClass(o) + '">' + i + '</span>'
        : '<button type="button" class="' + dayClass(o) + '" data-act="day" data-date="' + iso(d) + '" aria-label="' + dayLabel(d, o) + '">' + i + '</button>';
    }
    return html + '</div>';
  }
  function calendarPage() {
    // The free calendar: this month and the next. The month after is the app's dimmed teaser.
    return '<div class="page"><div class="scroll">' + monthGrid(2026, 9) + monthGrid(2026, 10) +
      '<div class="teaser"><div class="teaser__month" aria-hidden="true">' + monthGrid(2026, 11, true) + '</div>' +
      '<div class="teaser__over"><b>See 12 months ahead with Plus</b><span>Plus projects your cycles up to a year ahead. Prediction ranges widen the further ahead you look.</span></div></div></div>' +
      '<button type="button" class="keychip" data-act="key" aria-label="Calendar key"><i></i>Key</button></div>';
  }
  function keySheet() {
    var rows = [
      ['<i class="sw sw--period"></i>', 'Period (logged)'],
      ['<i class="sw sw--cell"><b class="dot dot--solid"></b></i>', 'Bleeding between periods'],
      ['<i class="sw sw--cell"><b class="dot dot--hollow"></b></i>', 'Spotting'],
      ['<i class="sw sw--dash"></i>', 'Expected', 'The window when your period may start.'],
      ['<i class="sw sw--m"></i>', 'Menstrual', 'Days your period is likely.'],
      ['<i class="sw sw--f"></i>', 'Follicular'],
      ['<i class="sw sw--o"></i>', 'Ovulatory'],
      ['<i class="sw sw--l"></i>', 'Luteal'],
      ['<i class="sw sw--cell"><b class="dot dot--diamond"></b></i>', 'Symptoms logged'],
      ['<i class="sw sw--today"></i>', 'Today'],
    ];
    return sheet('<div class="sheet__title">Calendar key</div>' + rows.map(function (r) {
      return '<div class="keyrow">' + r[0] + '<div>' + r[1] + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</div></div>';
    }).join(''));
  }
  // The day sheet (src/components/DayBottomSheet.tsx). Today's is the log sheet itself.
  function dayHead(d) { return '<div class="sheet__date">' + md(d) + '</div><div class="sheet__weekday">' + WEEKDAY[d.getDay()] + '</div>'; }
  function daySheet() {
    var d = fromIso(S.day), o = dayInfo(d), w = win(), body;
    if (o.future) {
      if (o.dash) body = '<p class="sheet__line">This falls in your expected period window (' + range(w[0], w[1]) + '). ' + INFO + '</p><p class="sheet__soft">Predicted from your logs. Based on your last ' + D.cycleLengths.length + ' cycles · they’ve varied by about ' + D.spread + ' days.</p>';
      else body = '<p class="sheet__soft">This day hasn’t happened yet. You can log it when it arrives.</p>' + (o.phase ? '<p class="sheet__soft">You’ll likely be in your ' + o.phase + ' phase.</p>' : '');
      return sheet(dayHead(d) + body + '<button type="button" class="primary" data-act="close">Got it</button>');
    }
    var phase = o.period ? 'menstrual' : o.phase, flow = loggedFlow(d);
    body = (phase ? '<p class="sheet__line">You were in your ' + phase + ' phase.</p>' : '') +
      '<div class="label"><span>Flow ' + INFO + '</span></div><div class="seg seg--5" aria-hidden="true">' + D.flows.map(function (f) { return '<span class="chip' + (f === flow ? ' is-on' : '') + '">' + f + '</span>'; }).join('') + '</div>' +
      '<p class="explainer explainer--tight">In Dottie, this is where you log the day. The demo shows it instead.</p>' +
      '<p class="sheet__soft">Editing past days updates your predictions automatically.</p>';
    return sheet(dayHead(d) + body + '<button type="button" class="primary" data-act="close">Done</button>');
  }

  // ---- Insights (app/(tabs)/insights.tsx) -------------------------------------------
  var PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
  var REACHED = { menstrual: 7, follicular: 7, ovulatory: 6, luteal: 6 };          // the open cycle has reached only its first two phases
  function bucket(p) { return p >= 0.8 ? 'Almost always' : p >= 0.5 ? 'Usually' : p >= 0.2 ? 'Sometimes' : 'Rarely'; }
  function rate(s) { return s.count / REACHED[s.phase]; }
  function symRow(s, tag) {
    return '<div class="symrow"><div class="symrow__top"><span><b>' + esc(s.name) + '</b>' + (tag ? '<small>' + cap(s.phase) + '</small>' : '') + '</span><span>' + s.count + ' of ' + REACHED[s.phase] + '</span></div><div class="bar"><i data-s="width:' + Math.round(100 * rate(s)) + '%"></i></div></div>';
  }
  function overview() {
    var day = cycleDay(), phase = todayPhase();
    var top = 'Cycle day ' + day + ' · ' + cap(phase === 'ovulatory' ? 'ovulation' : phase);
    var ov = ovulationDay(D.avgCycle), seg = [D.periodLen, ov - 1 - D.periodLen - 1, 3, D.avgCycle - ov - 1];
    var pos = Math.min(0.985, (day - 0.5) / D.avgCycle) * 100;
    var blurb = { menstrual: 'Your period. The uterine lining sheds, and cramps and fatigue are common.', follicular: 'Between your period and ovulation. Energy often increases during this phase.', ovulatory: 'Around ovulation. This is the most fertile part of your cycle.', luteal: 'After ovulation and before your next period. This is when PMS symptoms often appear.' }[phase];
    var sorted = D.symptoms.slice().sort(function (a, b) { return rate(b) - rate(a); }).slice(0, 3);
    var cl = D.cycleLengths, lo = Math.min.apply(null, cl), hi = Math.max.apply(null, cl);
    return '<div class="card"><h3>' + esc(top) + '</h3><p class="sub">Last period started ' + md(cycleStart()) + '</p><div class="status"><b>Regular</b>' + INFO + '</div></div>' +
      '<div class="label">Key numbers</div><div class="card"><div class="kv"><div><b>' + D.avgCycle + 'd</b><span>Average cycle</span></div><div><b>' + (hi - lo) + 'd</b><span>Full spread</span></div><div><b>' + D.periodLen + 'd</b><span>Typical period ' + INFO + '</span></div></div>' +
      '<p class="muted">Based on your last ' + D.periodLengths.length + ' completed periods.</p>' +
      '<div class="kv kv--second"><div><b>' + lo + 'd</b><span>Shortest</span></div><div><b>' + hi + 'd</b><span>Longest</span></div><div><b>29–31d</b><span>Most common</span></div></div></div>' +
      '<div class="label">Where you are</div><div class="card"><div class="youare"><span data-s="left:' + pos.toFixed(1) + '%">You are here</span></div>' +
      '<div class="phasebar" aria-hidden="true" data-s="grid-template-columns:' + seg.map(function (n) { return n + 'fr'; }).join(' ') + '"><i class="m"></i><i class="f"></i><i class="o"></i><i class="l"></i></div>' +
      '<div class="legend">' + PHASES.map(function (p, i) { return '<span class="legend__chip legend__chip--' + p.charAt(0) + '">' + cap(p) + ' · ' + seg[i] + 'd</span>'; }).join('') + '</div>' +
      '<p class="muted tight">' + blurb + '</p></div>' +
      '<div class="label">Most consistent symptoms</div><div class="card">' + sorted.map(function (s) { return '<div class="row"><b>' + esc(s.name) + '</b><span>' + s.count + ' of ' + REACHED[s.phase] + ' ' + s.phase + ' cycles</span></div>'; }).join('') +
      '<p class="muted"><button type="button" class="textlink textlink--small" data-itab="symptoms">See all symptoms</button></p></div>' +
      '<div class="card card--door"><div><b>Doctor visit summary</b><p class="sub tight0">A PDF of your history, created on this device.</p></div>' + ICON.arrow + '</div>';
  }
  function chips(attr, list, cur) {
    return '<div class="seg seg-page">' + list.map(function (r) { return '<button type="button" class="chip" ' + attr + '="' + r[0] + '" aria-pressed="' + (cur === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div>';
  }
  var RANGES = [['6', 'Last 6'], ['12', 'Last 12'], ['all', 'All time']];
  function trends() {
    var cl = D.cycleLengths, pl = D.periodLengths.slice(0, cl.length);
    var W = 310, lo = 24, hi = 38;
    var x = function (i) { return 40 + i * (W - 62) / (cl.length - 1); };
    var y = function (v) { return 22 + (hi - v) / (hi - lo) * 78; };
    var line = cl.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var pts = cl.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === cl.length - 1 ? 5 : 3.5) + '" class="c-accent"/><text x="' + x(i).toFixed(1) + '" y="' + (y(v) - 9).toFixed(1) + '" text-anchor="middle" class="c-num">' + v + '</text>'; }).join('');
    var grid = [38, 31, 24].map(function (v) { return '<line class="c-axis" x1="24" x2="' + W + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="c-label" x="2" y="' + (y(v) + 4).toFixed(1) + '">' + v + '</text>'; }).join('');
    var bars = pl.map(function (v, i) { var h = v * 12; return '<rect x="' + (x(i) - 12).toFixed(1) + '" y="' + (86 - h) + '" width="24" height="' + h + '" rx="5" class="c-secondary"/><text x="' + x(i).toFixed(1) + '" y="' + (86 - h - 6) + '" text-anchor="middle" class="c-num">' + v + '</text>'; }).join('');
    var labels = [0, 2, 3, 5].map(function (i) { return '<text x="' + x(i).toFixed(1) + '" y="104" text-anchor="middle" class="c-label">' + md(D.starts[i]) + '</text>'; }).join('');
    return chips('data-range', RANGES, S.trange) +
      '<div class="label">Cycle and period</div><p class="explainer explainer--tight">One column per cycle.</p>' +
      '<div class="card"><p class="sub tight0"><b class="c-ink">Cycle length</b> · days between periods ' + INFO + '</p>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' 112" role="img" aria-label="Cycle length, six cycles: ' + cl.join(', ') + ' days">' + grid + '<path d="' + line + '" fill="none" class="c-line" stroke-width="2.5" stroke-linejoin="round"/>' + pts + '</svg>' +
      '<p class="sub tight12"><b class="c-ink">Period length</b> · days it lasted</p>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' 110" role="img" aria-label="Period length, six cycles: ' + pl.join(', ') + ' days">' + bars + '<line class="c-axis" x1="24" x2="' + W + '" y1="86" y2="86"/>' + labels + '</svg></div>' +
      '<div class="label"><span>Cycle spread ' + INFO + '</span></div><div class="card"><div class="kv"><div><b>' + D.usualVariation + '</b><span>Usual variation</span></div><div><b>' + (Math.max.apply(null, cl) - Math.min.apply(null, cl)) + 'd</b><span>Full spread</span></div><div><b>' + D.periodLen + 'd</b><span>Typical period</span></div></div><p class="muted">How far your cycles usually land from your average. One unusually long or short cycle moves it less than the full spread does.</p></div>';
  }
  function symptoms() {
    var list = D.symptoms;
    var html = chips('data-sym', [['freq', 'By frequency'], ['phase', 'By phase']], S.symView);
    if (S.symView === 'freq') {
      ['Almost always', 'Usually', 'Sometimes', 'Rarely'].forEach(function (g) {
        var rows = list.filter(function (s) { return bucket(rate(s)) === g; }).sort(function (a, b) { return rate(b) - rate(a); });
        if (rows.length) html += '<div class="group"><div class="label"><span>' + g + '</span></div>' + rows.map(function (s) { return symRow(s, true); }).join('') + '</div>';
      });
    } else {
      PHASES.forEach(function (p) {
        var rows = list.filter(function (s) { return s.phase === p; });
        html += '<div class="group"><div class="label"><span>' + p + '</span><span class="label__right">' + REACHED[p] + ' cycles</span></div>' + (rows.length ? rows.map(function (s) { return symRow(s, false); }).join('') : '<p class="muted tight">Nothing logged here yet.</p>') + '</div>';
      });
    }
    return html + '<p class="explainer">Counted over your last 12 cycles. Your current cycle only counts for the phases it has reached so far, which is why some show 11 instead of 12.</p>';
  }
  // History (src/insights/HistoryTab.tsx, src/insights/methodStretches.ts): her current method heads
  // the tab with the cycles that started on it; each earlier method is one row under "Earlier history".
  function cycleRows(from, to) {
    var rows = '';
    for (var i = D.cycleLengths.length - 1; i >= 0; i--) {
      var s = D.starts[i];
      if ((from && s < from) || (to && s >= to)) continue;
      rows += '<button type="button" class="hrow" data-cycle="' + i + '"><span><b>' + md(s) + ' – ' + md(addDays(D.starts[i + 1], -1)) + '</b><small>' + D.cycleLengths[i] + '-day cycle · ' + D.periodLengths[i] + '-day period</small>' + (i === D.cycleLengths.length - 1 ? '<small>Recap</small>' : '') + '</span><i aria-hidden="true">›</i></button>';
    }
    return rows;
  }
  function history() {
    var m = D.method;
    return chips('data-hrange', RANGES, S.hrange) +
      '<p class="method">' + esc(m.now) + ' · since ' + mdy(m.since) + '</p>' +
      '<div class="year">2026</div><div class="hlist">' + cycleRows(m.since, null) + '</div>' +
      '<div class="label">Earlier history</div><div class="hlist"><button type="button" class="hrow hrow--one" data-act="method-page"><span><b>' + esc(m.before) + ' · ' + mdy(D.starts[0]) + ' – ' + mdy(addDays(m.since, -1)) + '</b></span><i aria-hidden="true">›</i></button></div>';
  }
  function methodPage() {
    var m = D.method;
    return '<div class="page"><div class="scroll">' +
      '<div class="navbar"><button type="button" class="textlink textlink--small" data-act="method-back">‹ Insights</button></div>' +
      '<h1 class="h1 h1--page">' + esc(m.before) + '</h1><p class="lede-phone">' + mdy(D.starts[0]) + ' – ' + mdy(addDays(m.since, -1)) + '</p>' +
      '<div class="card"><div class="kv kv--two"><div><b>30d</b><span>Average cycle</span></div><div><b>5d</b><span>Typical period</span></div></div><p class="muted">Based on your last 3 completed periods.</p></div>' +
      '<div class="year">2026</div><div class="hlist">' + cycleRows(null, m.since) + '</div>' +
      '<p class="done-link"><button type="button" class="textlink" data-act="method-back">Done</button></p></div></div>';
  }
  // A cycle's sheet (src/insights/CycleSheetBody.tsx). On the free tier her latest notable cycle
  // carries the locked Recap card; everything else in the sheet is free.
  function cycleSheet() {
    var i = S.cycle, s = D.starts[i], len = D.cycleLengths[i], pl = D.periodLengths[i], rows = '';
    var has = function (name) { return D.inCycle[name].indexOf(i) >= 0; };
    for (var n = 0; n < pl; n++) {
      var syms = [];
      if (n < 2 && has('Cramps')) syms.push('Cramps');
      if (n === 1 && has('Headache')) syms.push('Headache');
      if (n < 2 && has('Fatigue')) syms.push('Fatigue');
      rows += '<div class="drow"><div><span>Day ' + (n + 1) + ' · ' + md(addDays(s, n)) + '</span><span>' + loggedFlow(addDays(s, n)) + '</span></div>' + (syms.length ? '<small>' + syms.join(' · ') + '</small>' : '') + '</div>';
    }
    for (var k = 4; k >= 1; k--) {
      var late = [];
      if (k <= 4 && k >= 3 && has('Bloating')) late.push('Bloating');
      if (k <= 3 && has('Tender breasts')) late.push('Tender breasts');
      if (late.length) rows += '<div class="drow"><div><span>Day ' + (len - k + 1) + ' · ' + md(addDays(s, len - k)) + '</span><span></span></div><small>' + late.join(' · ') + '</small></div>';
    }
    var lock = i === D.cycleLengths.length - 1
      ? '<div class="lock"><div class="lock__head"><b>Cycle recap</b><span class="pluspill">Plus</span></div><p>After each cycle, Plus picks out what was different about it, from your own logs.</p><p class="lock__soft">This is part of Dottie’s paid insights. Your logging and history are free, and so are predictions for the weeks ahead.</p><p class="lock__door">See Dottie Plus →</p></div>' : '';
    return sheet('<div class="sheet__date">Cycle from ' + md(s) + '</div>' + lock + '<p class="sheet__soft">' + len + ' days · period ' + pl + ' days</p><div class="drows">' + rows + '</div><button type="button" class="primary" data-act="close">Done</button>');
  }
  function insightsPage() {
    if (S.page === 'method') return methodPage();
    var tabs = [['overview', 'Overview'], ['trends', 'Trends'], ['symptoms', 'Symptoms'], ['history', 'History']];
    var body = { overview: overview, trends: trends, symptoms: symptoms, history: history }[S.itab]();
    return '<div class="page"><div class="scroll">' +
      '<h1 class="h1">Insights ' + INFO + '</h1><p class="lede-phone">Your patterns are calculated on this device and never uploaded.</p>' +
      '<div class="itabs" role="tablist" aria-label="Insights sections">' + tabs.map(function (t) { return '<button type="button" role="tab" data-itab="' + t[0] + '" aria-selected="' + (S.itab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      body + '</div></div>';
  }

  // ---- the log sheet (src/components/DayBottomSheet.tsx, src/components/daylog/*) -------
  function sheet(inner, pinned) {
    return '<div class="sheet"><button type="button" class="sheet__scrim" data-act="close" aria-label="Close"></button><div class="sheet__panel' + (pinned ? ' sheet__panel--pinned' : '') + '" role="dialog" aria-modal="true"><div class="sheet__grip"></div>' + inner + '</div></div>';
  }
  function chip(attr, val, on, label) { return '<button type="button" class="chip" ' + attr + '="' + esc(val) + '" aria-pressed="' + on + '">' + esc(label || val) + '</button>'; }
  function logSheet() {
    var inner = '<div class="sheet__body">' + dayHead(D.today) + '<p class="sheet__line">You’re in your ' + todayPhase() + ' phase.</p>' +
      '<div class="label"><span>Flow ' + INFO + '</span></div><div class="seg seg--5">' + D.flows.map(function (f) { return chip('data-flow', f, S.flow === f); }).join('') + '</div>' +
      (S.flow ? '<p class="clear"><button type="button" class="textlink textlink--small" data-act="clear-flow">Clear flow</button></p>' : '') +
      (S.confirm && periodOpen() ? '<div class="confirm confirm--sheet"><span>' + esc(S.confirm) + '</span><button type="button" data-act="undo">Undo</button></div>' : '') +
      '<div class="label"><span>Pain</span><small>' + (S.pain != null ? S.pain + '/10' : '0 none · 10 worst') + '</small></div><div class="pain">' + Array.apply(null, Array(11)).map(function (_, i) { return '<button type="button" data-pain="' + i + '" aria-pressed="' + (S.pain === i) + '">' + i + '</button>'; }).join('') + '</div>' +
      '<div class="label"><span>Feelings ' + INFO + '</span></div><div class="chips">' + D.feelings.map(function (f) { return chip('data-feel', f, S.feelings.indexOf(f) >= 0); }).join('') + '</div>' +
      '<div class="chips chips--2 chips--gap"><button type="button" class="chip" data-act="section-symptoms" aria-pressed="' + (S.section === 'symptoms') + '" aria-expanded="' + (S.section === 'symptoms') + '">Symptoms' + (S.symptoms.length ? ' · ' + S.symptoms.length : '') + '</button><button type="button" class="chip" data-act="section-more" aria-pressed="' + (S.section === 'more') + '" aria-expanded="' + (S.section === 'more') + '">More</button></div>';
    if (S.section === 'symptoms') {
      var rest = D.symptomChips.filter(function (c) { return D.frequent.indexOf(c) < 0; });
      var sym = function (c) { return chip('data-chip', c, S.symptoms.indexOf(c) >= 0); };
      inner += '<div class="label"><span>Frequent</span></div><div class="chips">' + D.frequent.map(sym).join('') + '</div>' +
        '<div class="chips chips--1 chips--gap"><span class="chip chip--still">No symptoms</span></div>' +
        '<div class="chips chips--gap">' + rest.map(sym).join('') + '</div>';
    } else if (S.section === 'more') {
      inner += D.more.map(function (g) {
        return '<div class="label"><span>' + g[0] + (g[0] === 'Energy' ? ' ' + INFO : '') + '</span></div><div class="seg seg--' + g[1].length + '">' + g[1].map(function (v) { return chip('data-more', g[0] + '|' + v, S.more[g[0]] === v, v); }).join('') + '</div>';
      }).join('') +
        '<div class="label"><span>Medications</span></div><div class="field"><span>Add a medication</span><b>Add</b></div>' +
        '<div class="label"><span>Note</span></div><div class="field field--note"><span>Some days need a sentence, not a checkbox.</span></div>';
    }
    return sheet(inner + '</div><div class="sheet__foot"><button type="button" class="primary" data-act="done">Done</button></div>', true);
  }

  // ---- render + events ------------------------------------------------------------------
  // Rendering replaces the screen's markup, which would drop keyboard focus to
  // the page. Remember what was focused by its data attribute and focus the
  // same control again; if it is gone (a sheet closed), focus the current tab.
  var FOCUS_KEYS = ['data-tab', 'data-itab', 'data-act', 'data-range', 'data-hrange', 'data-sym', 'data-flow', 'data-pain', 'data-feel', 'data-chip', 'data-more', 'data-cycle'];
  function focusKey(el) {
    if (!el || !root.contains(el)) return null;
    for (var i = 0; i < FOCUS_KEYS.length; i++) if (el.hasAttribute(FOCUS_KEYS[i])) return '[' + FOCUS_KEYS[i] + '="' + el.getAttribute(FOCUS_KEYS[i]) + '"]';
    return null;
  }
  var shown = '', justOpened = null;
  function render() {
    var key = focusKey(document.activeElement);
    var scroller = function () { return root.querySelector('.sheet__body') || root.querySelector('.sheet__panel'); };
    var panel = scroller(), keep = panel && S.sheet ? panel.scrollTop : 0, wasSheet = shown;
    var page = { today: todayPage, calendar: calendarPage, insights: insightsPage }[S.tab]();
    var overlay = S.sheet === 'log' ? logSheet() : S.sheet === 'key' ? keySheet() : S.sheet === 'day' ? daySheet() : S.sheet === 'cycle' ? cycleSheet() : '';
    root.innerHTML = statusBar() + page + tabbar() + overlay;
    shown = S.sheet || '';
    // Inline style attributes are blocked by the page's CSP (style-src 'self'),
    // so per-element values travel as data-s and are applied through the CSSOM.
    RING.apply(root);
    if (shown && shown === wasSheet) { // the same sheet, redrawn after a tap: no second slide-in, and it stays where she scrolled it
      var still = root.querySelector('.sheet__panel'); if (still) still.classList.add('is-still');
      var p = scroller(); if (p) p.scrollTop = keep;
      // a section she has just opened is brought into view, as the app's sheet does
      var opener = justOpened && root.querySelector('[data-act="section-' + justOpened + '"]');
      if (p && opener) p.scrollTop = Math.max(keep, opener.offsetTop - 14);
    }
    justOpened = null;
    if (key) {
      var again = root.querySelector(key) || root.querySelector('.tabbar [data-tab="' + S.tab + '"]');
      if (again) again.focus({ preventScroll: true });
    }
  }
  function hint(text) { var h = document.getElementById('hint'); if (h) h.textContent = text; }
  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function say(text, undo) { S.confirm = text; S.confirmUndo = undo || null; }

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab],[data-act],[data-itab],[data-flow],[data-pain],[data-feel],[data-chip],[data-range],[data-hrange],[data-sym],[data-more],[data-cycle]');
    if (!el) return;
    var ds = el.dataset;
    if (ds.tab) { S.tab = ds.tab; S.sheet = null; S.page = null; }
    else if (ds.itab) { S.tab = 'insights'; S.itab = ds.itab; S.page = null; }
    else if (ds.range) { S.trange = ds.range; }
    else if (ds.hrange) { S.hrange = ds.hrange; }
    else if (ds.sym) { S.symView = ds.sym; }
    else if (ds.cycle) { S.cycle = +ds.cycle; S.sheet = 'cycle'; }
    else if (ds.flow) {
      // Writes are immediate, as in the app. Light flow or heavier logged for today starts a
      // period (never spotting); the pools in src/copy/pools.ts have the words.
      var was = periodOpen();
      var prev = S.flow;
      S.flow = S.flow === ds.flow ? null : ds.flow; S.logged = true; S.ended = false;
      if (!was && periodOpen()) { say('Started your period today. Predictions updated.', { flow: prev }); hint('The ring, the headline and the calendar now describe a period that started today.'); }
      else if (!periodOpen()) say(null);
    }
    else if (ds.pain) { S.pain = S.pain === +ds.pain ? null : +ds.pain; S.logged = true; }
    else if (ds.feel) { toggle(S.feelings, ds.feel); S.logged = true; }
    else if (ds.chip) { toggle(S.symptoms, ds.chip); S.logged = true; }
    else if (ds.more) { var kv = ds.more.split('|'); if (S.more[kv[0]] === kv[1]) delete S.more[kv[0]]; else S.more[kv[0]] = kv[1]; S.logged = true; }
    else if (ds.act) {
      switch (ds.act) {
        case 'open-log': S.sheet = 'log'; S.section = null; break;
        case 'close': S.sheet = null; break;
        case 'key': S.sheet = 'key'; break;
        case 'section-symptoms': S.section = S.section === 'symptoms' ? null : 'symptoms'; justOpened = S.section; break;
        case 'section-more': S.section = S.section === 'more' ? null : 'more'; justOpened = S.section; break;
        case 'clear-flow': S.flow = null; S.ended = false; say(null); break;
        case 'done':
          S.sheet = null;
          hint(S.symptoms.length ? 'Logged. It is on Today now, and today has its mark on the Calendar.' : 'Logged. Open the log again to add a symptom, or look at the Calendar.');
          break;
        case 'started':
          if (S.ended) { S.ended = false; say('Picked back up where you were. Predictions updated.', { ended: true }); }
          else { say('Early is normal because cycles shift. Predictions updated.', { flow: S.flow }); S.flow = 'Started'; S.logged = true; }
          hint('The ring, the headline and the calendar now describe a period that started today.');
          break;
        case 'ended': S.ended = true; say('1 day this time, a bit shorter than usual. Periods vary, and one shorter period on its own is common.', { ended: false }); break;
        case 'undo':
          if (S.confirmUndo) { if ('flow' in S.confirmUndo) S.flow = S.confirmUndo.flow; if ('ended' in S.confirmUndo) S.ended = S.confirmUndo.ended; }
          say(null); break;
        case 'hide-confirm': say(null); break;
        case 'day':
          if (el.getAttribute('data-date') === iso(D.today)) { S.sheet = 'log'; S.section = null; } // today's day sheet is the log itself
          else { S.sheet = 'day'; S.day = el.getAttribute('data-date'); }
          break;
        case 'method-page': S.page = 'method'; break;
        case 'method-back': S.page = null; break;
      }
    }
    render();
  });
  // Mouse-wheel and trackpad scrolling over the phone moves the screen's own
  // scroller directly and never the page. Native nested scrolling is left to the
  // engines for touch; for wheel events, desktop Safari has been seen to scroll
  // nothing at all inside the phone, so the scroll is applied here instead.
  root.addEventListener('wheel', function (e) {
    var s = e.target.closest && e.target.closest('.scroll, .sheet__body, .sheet__panel');
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
    var s = e.target.closest && e.target.closest('.scroll, .sheet__body, .sheet__panel');
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

  window.DottiePhone = { dayInfo: dayInfo, reset: function () { S = initial(); render(); hint('Try: Log how you feel, then Symptoms, then Cramps.'); }, rerender: render, state: function () { return S; } };
  render();
})();
