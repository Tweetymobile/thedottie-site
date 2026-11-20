/* ring.js — the stardust ring, drawn the way the app draws it now.
   A port of the app's stardustLooks.ts, look B "sparkle": about 2.2 times the old
   dust (up to 792 specks), finer (radius 0.35 to 1.1 on the app's 208-point ring),
   no white shine, and a four-point glint on the largest specks in the speck's own
   colour. Same seed (2026), same scatter, same brightness curve, so a ring here
   has the same specks in the same places as the ring in the app.
   Everything is drawn on the app's own 208-point grid and scaled by the SVG.
   Colours come from CSS (--ring-dust, --ring-dust2, --ring-track, --ring-window),
   so each ring follows its section's theme. Also: the note of the day. */
(function () {
  'use strict';
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // The app's numbers (stardustLooks.ts STARDUST, ringParticles.ts).
  var LOOK = { density: 2.2, rMin: 0.35, rSpan: 0.75, scatter: 16, twinkleMin: 0.7, speed: 1.5 };
  var REF_DENSITY = 360, REST_OP = 0.42, SIZE = 208, C = 104, R = 92, TAU = Math.PI * 2;

  /* The dust for a sweep (`prog` of the cycle) or the resting circle.
     `thin` draws a share of the specks and `grow` enlarges them, for the small
     rings, where the app's own sizes would be too fine to see. */
  function dust(prog, resting, opts) {
    opts = opts || {};
    var thin = opts.thin || 1, grow = opts.grow || 1;
    prog = Math.max(0, Math.min(1, prog || 0));
    if (!resting && prog <= 0) return [];
    var sweep = resting ? 1 : prog;
    var full = Math.round(REF_DENSITY * LOOK.density);
    var count = resting ? full : Math.min(full, Math.max(40, Math.round(full * prog)));
    var rand = mulberry32(2026), out = [];
    for (var i = 0; i < count; i++) {
      var u = rand();
      var t = resting ? u : Math.pow(u, 0.6);
      var angle = -Math.PI / 2 + t * sweep * TAU;
      var rr = R + (rand() - 0.5) * LOOK.scatter;
      var rad = LOOK.rMin + rand() * LOOK.rSpan;
      var op = resting ? REST_OP + rand() * 0.15 : Math.min(1, 0.4 + 0.6 * t + rand() * 0.1);
      var alt = rand() < 0.2;
      var phase = rand();
      var speed = (0.6 + rand() * 1.4) * LOOK.speed;
      var twinkle = LOOK.twinkleMin + rand() * (1 - LOOK.twinkleMin);
      if (thin < 1 && (i % Math.round(1 / thin)) !== 0) continue;
      out.push({ x: C + rr * Math.cos(angle), y: C + rr * Math.sin(angle), r: rad * grow, op: op, alt: alt, phase: phase, speed: speed, twinkle: twinkle, star: rad > LOOK.rMin + LOOK.rSpan * 0.8, t: t, appearAt: resting ? phase * 0.7 : t * 0.7 });
    }
    return out;
  }

  /* One speck as SVG. A star is the speck plus two crossed strokes, arms 3.2 times
     its radius, as in the app. Per-speck values travel as data-s (the CSP forbids
     inline styles) and are applied through the CSSOM by apply(). */
  function speckSvg(p, drift, arms) {
    var dur = (1.2 / p.speed).toFixed(2), n = Math.max(2, 2 * Math.round(5 / (1.2 / p.speed)));
    var s = '--o:' + p.op.toFixed(2) + ';--a:' + p.appearAt.toFixed(3) + ';--lo:' + (1 - 0.7 * p.twinkle).toFixed(2) + ';--dur:' + dur + 's;--n:' + n + ';--ph:' + (p.phase * 1.2).toFixed(2) + 's';
    if (drift) s += ';--dx:' + ((drift() - 0.5) * 300).toFixed(0) + 'px;--dy:' + ((drift() - 0.5) * 240).toFixed(0) + 'px';
    var cls = 'speck' + (p.alt ? ' alt' : '');
    if (!p.star) return '<circle class="' + cls + '" cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="' + p.r.toFixed(2) + '" data-s="' + s + '"/>';
    var arm = p.r * (arms || 3.2);
    return '<g class="' + cls + ' star" data-s="' + s + '"><circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="' + p.r.toFixed(2) + '"/><path d="M' + (p.x - arm).toFixed(2) + ' ' + p.y.toFixed(2) + 'H' + (p.x + arm).toFixed(2) + 'M' + p.x.toFixed(2) + ' ' + (p.y - arm).toFixed(2) + 'V' + (p.y + arm).toFixed(2) + '"/></g>';
  }
  /* The band is her predicted period days: `len` of the circle, clockwise from
     `start` (both as fractions of a cycle; 1 is the top again). */
  function bandSvg(start, len, cls) {
    if (start == null || len == null) return '';
    var wDeg = Math.max(3, Math.min(359, len * 360));
    var turn = start - Math.floor(start);
    var a0 = -90 + turn * 360, a1 = a0 + wDeg, rad = function (d) { return d * Math.PI / 180; };
    return '<path class="band' + (cls ? ' ' + cls : '') + '" d="M' + (C + R * Math.cos(rad(a0))).toFixed(2) + ' ' + (C + R * Math.sin(rad(a0))).toFixed(2) + ' A' + R + ' ' + R + ' 0 ' + (wDeg > 180 ? 1 : 0) + ' 1 ' + (C + R * Math.cos(rad(a1))).toFixed(2) + ' ' + (C + R * Math.sin(rad(a1))).toFixed(2) + '"/>';
  }
  /* A whole ring as an SVG string.
     o.prog, o.resting, o.band [start, len], o.bandClass, o.thin, o.grow,
     o.gather (the specks drift in from the sky, for the hero). */
  function ringSvg(o) {
    o = o || {};
    var parts = dust(o.prog, !!o.resting, { thin: o.thin, grow: o.grow });
    var drift = o.gather ? mulberry32(9) : null;
    var specks = parts.map(function (p) { return speckSvg(p, drift, o.grow ? 2.3 : 3.2); }).join(''); // the small rings carry shorter glints, so the dust still reads as dust
    return '<svg class="ringsvg' + (o.gather ? ' ringsvg--gather' : '') + (o.grow ? ' ringsvg--small' : '') + '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '" aria-hidden="true">' +
      '<circle class="track" cx="' + C + '" cy="' + C + '" r="' + R + '"/>' + (o.band ? bandSvg(o.band[0], o.band[1], o.bandClass) : '') +
      '<g class="dust">' + specks + '</g></svg>';
  }
  function apply(root) {
    root.querySelectorAll('[data-s]').forEach(function (el) { el.style.cssText = el.getAttribute('data-s'); });
  }
  function draw(host, o) { host.innerHTML = ringSvg(o); apply(host); }

  window.DottieRing = { svg: ringSvg, draw: draw, apply: apply, dust: dust };

  /* The small rings in the stage tiles, the parents section and the theme previews.
     data-p: how far round the cycle is (0 = the track alone); data-resting: a full,
     even, softer circle (the app's ring when it has no progress to show);
     data-band: "start,length"; data-band-outline: a dashed outline, the fertile
     window's style; data-size="tiny" for the theme previews. */
  window.drawMiniRing = function (host) {
    var b = host.getAttribute('data-band'), tiny = host.getAttribute('data-size') === 'tiny';
    draw(host, {
      prog: parseFloat(host.getAttribute('data-p') || '0'), resting: host.hasAttribute('data-resting'),
      band: b ? b.split(',').map(parseFloat) : null, bandClass: host.hasAttribute('data-band-outline') ? 'band--outline' : '',
      thin: tiny ? 0.25 : 0.5, grow: tiny ? 2.4 : 1.6,
    });
  };

  window.noteOfTheDay = function (date) {
    var pool = window.DOTTIE_NOTES || [];
    if (!pool.length) return '';
    var d = date || new Date();
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return pool[hashSeed('warmthNote:firstRun:' + key) % pool.length];
  };
  window.todayLabel = function (date) {
    var d = date || new Date();
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate();
  };
})();
