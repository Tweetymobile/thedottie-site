/* ring.js — the hero ring for the direction mocks. The launch moment's dust
   field (LaunchMoment.tsx: seed 1337, 360 motes, the same scatter and density
   curve, Midnight's dust colors), drawn large. Motes drift in from the sky and
   settle onto the ring in sweep order, 12 o'clock round. Reduced motion shows
   the settled ring. Also: the note of the day, picked the way the app picks
   (hashSeed over the day) from the first-run warmth pool. */
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

  // Draw the ring into `host` (an element); viewBox 600, R 248.
  window.drawHeroRing = function (host, opts) {
    opts = opts || {};
    var S = 600, cx = 300, cy = 300, R = 248, TAU = Math.PI * 2;
    var rand = mulberry32(1337);
    var drift = mulberry32(opts.seed || 9);
    var scale = opts.scale || 3.0; // mote radius multiplier for the hero size
    var out = [];
    for (var i = 0; i < 360; i++) {
      var u = rand(); var t = Math.pow(u, 0.6);
      var angle = -Math.PI / 2 + t * TAU;
      var rr = R + (rand() - 0.5) * 16 * 2.4;
      var rad = (0.4 + rand() * 1.2) * scale;
      var op = Math.min(1, 0.3 + 0.65 * t + rand() * 0.1);
      var alt = rand() < 0.2;
      var x = cx + rr * Math.cos(angle), y = cy + rr * Math.sin(angle);
      // where it drifts in from: somewhere in the sky around the ring
      var dx = (drift() - 0.5) * 900, dy = (drift() - 0.5) * 700;
      out.push('<circle class="mote' + (alt ? ' alt' : '') + (rad > 1.35 * scale ? ' big' : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rad.toFixed(2) + '" data-s="--t:' + t.toFixed(3) + ';--o:' + op.toFixed(2) + ';--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px"/>');
    }
    var band = '';
    if (opts.band) {
      var a0 = -90 + opts.band[0] * 360, w = opts.band[1] * 360;
      var r2 = function (d) { return d * Math.PI / 180; };
      band = '<path class="band" d="M' + (cx + R * Math.cos(r2(a0))).toFixed(1) + ' ' + (cy + R * Math.sin(r2(a0))).toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + R * Math.cos(r2(a0 + w))).toFixed(1) + ' ' + (cy + R * Math.sin(r2(a0 + w))).toFixed(1) + '"/>';
    }
    host.innerHTML = '<svg viewBox="0 0 600 600" aria-hidden="true"><defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<circle class="track" cx="300" cy="300" r="' + R + '"/>' + band +
      '<g class="halo" filter="url(#glow)">' + out.join('') + '</g><g class="dust">' + out.join('') + '</g></svg>';
    host.querySelectorAll('[data-s]').forEach(function (el) { el.style.cssText = el.getAttribute('data-s'); });
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
