// build-icons.mjs — Dottie app-icon drafts: the Today screen's stardust ring as
// the whole icon. Every colour here is a real token from the app's
// src/theme/themes.ts (Clay / Lagoon / Orchid / Midnight). Dots are placed
// deterministically (seeded), so the SVGs are reproducible from this file.
//
//   node brand/build-icons.mjs
//
// Writes brand/icon-<option>-{light,dark,tinted}.svg (1024 masters, no mask:
// iOS applies the squircle itself) and brand/preview/*.png contact sheets with
// the squircle applied, at 1024, home-screen (60pt), 40pt and 29pt sizes.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'preview');
mkdirSync(out, { recursive: true });

// ---- real theme tokens (themes.ts) ----------------------------------------
const T = {
  clayLight: { bg: ['#F7F2E7', '#F2E9D6', '#EDDCBB'], dust: '#C4795B', dust2: '#D9A85C', window: 'rgba(196,121,91,0.30)', band: 'rgba(196,121,91,0.55)', track: 'rgba(120,105,80,0.16)' },
  clayDark: { bg: ['#2A2620', '#221F19', '#1A1712'], dust: '#C4795B', dust2: '#D9A85C', window: 'rgba(196,121,91,0.34)', band: 'rgba(196,121,91,0.55)', track: 'rgba(255,255,255,0.12)' },
  midnight: { bg: ['#221C2E', '#1B1826', '#141220'], dust: '#E8A0A8', dust2: '#FFDCBE', window: 'rgba(232,160,168,0.34)', band: 'rgba(232,160,168,0.55)', track: 'rgba(255,255,255,0.12)' },
  orchidLight: { bg: ['#F6F0F7', '#EFE3F1', '#E4D3EA'], dust: '#A868B0', dust2: '#DCA0C8', window: 'rgba(168,104,176,0.30)', band: 'rgba(168,104,176,0.55)', track: 'rgba(130,90,140,0.16)' },
  orchidDark: { bg: ['#282232', '#201B29', '#181420'], dust: '#A868B0', dust2: '#DCA0C8', window: 'rgba(168,104,176,0.34)', band: 'rgba(168,104,176,0.55)', track: 'rgba(255,255,255,0.12)' },
  lagoonLight: { bg: ['#EDF4F0', '#DEEDE7', '#CBE3DE'], dust: '#E08A6D', dust2: '#78B4A0', window: 'rgba(224,138,109,0.32)', band: 'rgba(224,138,109,0.55)', track: 'rgba(70,110,100,0.16)' },
  lagoonDark: { bg: ['#1A2624', '#15201E', '#101917'], dust: '#E08A6D', dust2: '#78B4A0', window: 'rgba(224,138,109,0.34)', band: 'rgba(224,138,109,0.55)', track: 'rgba(255,255,255,0.12)' },
};

// ---- the four options -----------------------------------------------------
// sweep: degrees of cycle the dust covers, clockwise from the top.
// band: [startDeg, lengthDeg], 0 = top (12 o'clock), clockwise. The band is her
// expected period: at the top it sits where the cycle begins again; "ahead"
// places it just past the leading edge, where the dust is heading.
export const OPTIONS = [
  { id: 'A', name: 'Clay cream', dots: 11, sweep: 270, band: [-34, 48], light: T.clayLight, dark: T.clayDark, seed: 7 },
  { id: 'B', name: 'Midnight', dots: 9, sweep: 280, band: [-34, 48], light: T.midnight, dark: T.midnight, seed: 19 },
  { id: 'C', name: 'Clay dusk', dots: 13, sweep: 225, band: [238, 60], light: T.clayDark, dark: T.clayDark, seed: 3 },
  { id: 'D', name: 'Orchid', dots: 7, sweep: 250, band: [262, 58], light: T.orchidLight, dark: T.orchidDark, seed: 5 },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const S = 1024, CX = 512, CY = 512, R = 336;
const rad = (d) => ((d - 90) * Math.PI) / 180; // 0 = top, clockwise
const pt = (deg, r = R) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];

function arcPath(start, len, r = R) {
  const [x0, y0] = pt(start, r);
  const [x1, y1] = pt(start + len, r);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${len > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/** Deterministic dots along the sweep: sparse and small near the start, bold
 *  at the leading edge, with a little radial scatter like the real ring. */
function dots(opt) {
  const rand = mulberry32(opt.seed);
  const n = opt.dots;
  const list = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; // 0 at the start of the sweep, 1 at the leading edge
    const eased = Math.pow(t, 0.75);
    const jitter = (rand() - 0.5) * (opt.sweep / n) * 0.4;
    const deg = eased * opt.sweep + jitter;
    const rr = R + (rand() - 0.5) * 48;
    const size = 28 + 38 * Math.pow(t, 1.4);
    const op = 0.55 + 0.45 * t;
    const alt = i % 4 === 2; // every so often, the secondary dust colour
    const [x, y] = pt(deg, rr);
    list.push({ x, y, r: size, op, alt, lead: i === n - 1 });
  }
  return list;
}

function glyph(opt, tokens, { tinted = false } = {}) {
  const d = dots(opt);
  const dustA = tinted ? '#FFFFFF' : tokens.dust;
  const dustB = tinted ? '#DADADA' : tokens.dust2;
  const band = tinted ? 'rgba(255,255,255,0.42)' : tokens.band;
  const track = tinted ? 'rgba(255,255,255,0.14)' : tokens.track;
  return [
    `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${track}" stroke-width="14"/>`,
    `<path d="${arcPath(opt.band[0], opt.band[1])}" fill="none" stroke="${band}" stroke-width="56" stroke-linecap="round"/>`,
    ...d.map((p) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${p.alt ? dustB : dustA}" opacity="${p.op.toFixed(2)}"/>` +
      (p.lead ? `<circle cx="${(p.x - p.r * 0.3).toFixed(1)}" cy="${(p.y - p.r * 0.3).toFixed(1)}" r="${(p.r * 0.24).toFixed(1)}" fill="#FFFFFF" opacity="0.85"/>` : ''),
    ),
  ].join('\n    ');
}

function master(opt, variant) {
  const tokens = variant === 'dark' ? opt.dark : opt.light;
  const tinted = variant === 'tinted';
  const [b1, b2, b3] = tinted ? ['#000000', '#000000', '#000000'] : tokens.bg;
  const id = `g${opt.id}${variant}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <!-- Dottie app icon, option ${opt.id} (${opt.name}), ${variant}. The stardust ring from Today, nothing else. -->
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="0.55" stop-color="${b2}"/><stop offset="1" stop-color="${b3}"/></linearGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#${id})"/>
  <g>
    ${glyph(opt, tokens, { tinted })}
  </g>
</svg>`;
}

// ---- preview sheets ---------------------------------------------------------
// Apple's icon mask, approximated as a superellipse (continuous corners).
function squircle(size) {
  const n = 5, a = size / 2, pts = [];
  for (let i = 0; i <= 180; i++) {
    const th = (i / 180) * Math.PI * 2;
    const c = Math.cos(th), s = Math.sin(th);
    const x = a + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = a + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

function placed(svgInner, x, y, size, clipId) {
  return `<g transform="translate(${x} ${y})"><clipPath id="${clipId}"><path d="${squircle(size)}"/></clipPath><g clip-path="url(#${clipId})"><svg width="${size}" height="${size}" viewBox="0 0 ${S} ${S}">${svgInner}</svg></g></g>`;
}

function inner(opt, variant) {
  return master(opt, variant).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

// A tint preview: iOS multiplies the grayscale glyph by the chosen tint over a
// dark gradient. Simulated here with a blue tint so the mapping is visible.
function tintedPreview(opt) {
  const base = inner(opt, 'tinted').replace(/#FFFFFF/g, '#9AB6FF').replace(/#DADADA/g, '#7F9AE0').replace(/rgba\(255,255,255,/g, 'rgba(154,182,255,');
  return base.replace(/<rect width="1024" height="1024" fill="url\(#[^)]+\)"\/>/, '<rect width="1024" height="1024" fill="#1C1C1E"/>');
}

const PT = 2; // the sheet is rendered at 2x, so 60pt = 120px
function sheet(opt) {
  const W = 1700, H = 1180;
  const cols = [
    { label: 'Light', v: inner(opt, 'light'), homeBg: '#DED8CC' },
    { label: 'Dark', v: inner(opt, 'dark'), homeBg: '#2B2B2F' },
    { label: 'Tinted source (grayscale)', v: inner(opt, 'tinted'), homeBg: '#2B2B2F' },
    { label: 'Tinted on iOS (blue, simulated)', v: tintedPreview(opt), homeBg: '#2B2B2F' },
  ];
  let k = 0;
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="#F4F1EA"/>`);
  parts.push(`<text x="60" y="78" font-family="-apple-system, Helvetica, Arial" font-size="40" font-weight="700" fill="#37342B">Option ${opt.id}: ${opt.name}</text>`);
  parts.push(`<text x="60" y="122" font-family="-apple-system, Helvetica, Arial" font-size="24" fill="#8A8271">${opt.dots} dots · band ${opt.band[0] < 0 || opt.band[0] < 60 ? 'at the top' : 'ahead of the leading edge'} · ring from the Today screen, nothing else</text>`);
  cols.forEach((c, i) => {
    const x = 60 + i * 405;
    parts.push(`<text x="${x}" y="178" font-family="-apple-system, Helvetica, Arial" font-size="22" fill="#37342B">${c.label}</text>`);
    parts.push(placed(c.v, x, 196, 360, `c${opt.id}${k++}`));
    parts.push(`<text x="${x}" y="590" font-family="-apple-system, Helvetica, Arial" font-size="18" fill="#8A8271">1024 px master (shown at 360)</text>`);
    // a home-screen strip: 60pt, 40pt, 29pt at 2x on a wallpaper-like ground
    parts.push(`<rect x="${x}" y="620" width="360" height="300" rx="28" fill="${c.homeBg}"/>`);
    const sizes = [[60, 'Home screen 60pt'], [40, 'Spotlight 40pt'], [29, 'Settings 29pt']];
    let sx = x + 28;
    sizes.forEach(([ptSize, label]) => {
      const px = ptSize * PT;
      parts.push(placed(c.v, sx, 650, px, `c${opt.id}${k++}`));
      parts.push(`<text x="${sx}" y="${650 + px + 28}" font-family="-apple-system, Helvetica, Arial" font-size="15" fill="${c.homeBg === '#DED8CC' ? '#37342B' : '#E6E1D6'}">${label.split(' ').slice(-1)[0]}</text>`);
      sx += px + 36;
    });
    parts.push(`<text x="${x + 28}" y="890" font-family="-apple-system, Helvetica, Arial" font-size="16" fill="${c.homeBg === '#DED8CC' ? '#37342B' : '#E6E1D6'}">Home screen · Spotlight · Settings (2x)</text>`);
  });
  // 1x row: the honest tiny sizes at native pixel scale for a 3x phone would be 87/120/180 px; show the 29pt at exactly 29 and 40 at 40 too
  parts.push(`<text x="60" y="980" font-family="-apple-system, Helvetica, Arial" font-size="22" fill="#37342B">At 1x (29 and 40 points as pixels), light and dark:</text>`);
  let sx = 60;
  [['light', '#DED8CC'], ['dark', '#2B2B2F']].forEach(([v, bg]) => {
    parts.push(`<rect x="${sx}" y="1000" width="260" height="120" rx="20" fill="${bg}"/>`);
    parts.push(placed(inner(opt, v), sx + 24, 1028, 29, `c${opt.id}${k++}`));
    parts.push(placed(inner(opt, v), sx + 80, 1022, 40, `c${opt.id}${k++}`));
    parts.push(placed(inner(opt, v), sx + 150, 1012, 60, `c${opt.id}${k++}`));
    sx += 300;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('\n')}</svg>`;
}

function overview() {
  const W = 1700, H = 560;
  const parts = [`<rect width="${W}" height="${H}" fill="#F4F1EA"/>`];
  parts.push(`<text x="60" y="78" font-family="-apple-system, Helvetica, Arial" font-size="40" font-weight="700" fill="#37342B">Dottie icon options, side by side</text>`);
  let k = 0;
  OPTIONS.forEach((opt, i) => {
    const x = 60 + i * 405;
    parts.push(`<text x="${x}" y="140" font-family="-apple-system, Helvetica, Arial" font-size="24" fill="#37342B">${opt.id} · ${opt.name} · ${opt.dots} dots</text>`);
    parts.push(placed(inner(opt, 'light'), x, 160, 240, `o${k++}`));
    parts.push(`<rect x="${x}" y="420" width="360" height="110" rx="20" fill="#DED8CC"/>`);
    parts.push(placed(inner(opt, 'light'), x + 24, 445, 60, `o${k++}`));
    parts.push(placed(inner(opt, 'light'), x + 110, 455, 40, `o${k++}`));
    parts.push(placed(inner(opt, 'light'), x + 176, 460, 29, `o${k++}`));
    parts.push(placed(inner(opt, 'dark'), x + 240, 445, 60, `o${k++}`));
    parts.push(placed(inner(opt, 'dark'), x + 316, 460, 29, `o${k++}`));
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('\n')}</svg>`;
}

function png(svg, file, scale = 1) {
  const r = new Resvg(svg, { fitTo: { mode: 'zoom', value: scale } });
  writeFileSync(file, r.render().asPng());
}

for (const opt of OPTIONS) {
  for (const v of ['light', 'dark', 'tinted']) {
    writeFileSync(join(here, `icon-${opt.id}-${v}.svg`), master(opt, v));
  }
  png(sheet(opt), join(out, `option-${opt.id}.png`));
}
png(overview(), join(out, 'overview.png'));
console.log('wrote', OPTIONS.length * 3, 'SVG masters and', OPTIONS.length + 1, 'preview sheets');
