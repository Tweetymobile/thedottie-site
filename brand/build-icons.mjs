// build-icons.mjs — the Dottie app icon and logo, as original vector art.
//
// The look: deep plum, a thin pink ring, glowing pink and gold stardust gathered
// along the lower and right side (Rob's reference, Oct 28 2026). For the app
// icon: the ring fills about 87% of the square, the particles are fewer, larger
// and brighter so the glow still reads at 40pt and 29pt, and the plum sits a
// touch lighter, toward the Midnight theme (src/theme/themes.ts: #221C2E,
// #1B1826, #141220).
//
//   node brand/build-icons.mjs
//
// Writes, into brand/:
//   icon-dottie.svg            the icon (light appearance, 1024, unmasked)
//   icon-dottie-dark.svg       the iOS dark variant (deeper plum)
//   icon-dottie-tinted.svg     the iOS tinted variant (grayscale on black)
//   logo-dottie.svg            the ring with "Dottie" (Newsreader, outlined) on plum
//   logo-dottie-mark.svg       the same, transparent outside the ring
//   icon/icon-light-1024.png   the finished App Store / asset-catalog PNGs, 1024 x 1024,
//   icon/icon-tinted-1024.png  square and unmasked: light and tinted are 8-bit RGB with no
//                              alpha channel (App Store Connect rejects alpha in the 1024 icon)
//   icon/icon-dark-1024.png    the dark appearance: the same ring on a fully transparent
//                              background (RGBA), so iOS supplies its own dark ground
//                              (Rob, Oct 28 2026)
//   preview/*.png              contact sheets at 1024, 60pt, 40pt and 29pt
// And, into assets/img/ for the website:
//   icon-180.png               apple-touch-icon (opaque, iOS masks it)
//   favicon-32.png             PNG favicon for browsers without SVG favicon support
//
// DECISION (Rob, Oct 28 2026): the app icon is the stardust ring only, no text,
// in this form. Final. The logo files are for marketing use outside the icon.
//
// Everything is placed deterministically from a seed, so the files are
// reproducible from this script alone.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import opentype from 'opentype.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'preview');
const iconOut = join(here, 'icon');
const siteImg = join(here, '..', 'assets', 'img');
mkdirSync(out, { recursive: true });
mkdirSync(iconOut, { recursive: true });

const S = 1024, CX = 512, CY = 512;
const R = 446; // 892 px across = 87% of the square
const TAU = Math.PI * 2;
const rad = (d) => ((d - 90) * Math.PI) / 180; // 0 = top, clockwise
const pt = (deg, r) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const f1 = (n) => n.toFixed(1);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- palettes ---------------------------------------------------------------
const PLUM = {
  bg: ['#2B2142', '#221C2E', '#191427'],   // top → bottom, Midnight's plum, a touch lighter at the top
  glow: '#4A2A5A',                           // the faint warm bloom behind the cluster
  ring: '#D7A9D6', ringSoft: '#B98CC4',
  pink: ['#FF9CBE', '#FFB4CC', '#FF7FAE', '#F6A6C4'],
  gold: ['#FFD9A0', '#FFE9C4', '#F9C97E'],
  cream: '#FFF3EA',
  wordmark: '#F7E9EF',
};
const PLUM_DARK = { ...PLUM, bg: ['#1C1630', '#161224', '#100D1B'], glow: '#3A2048' };
const TINTED = {
  bg: ['#000000', '#000000', '#000000'], glow: '#2A2A2A',
  ring: '#D0D0D0', ringSoft: '#9A9A9A',
  pink: ['#F2F2F2', '#FFFFFF', '#E6E6E6', '#EDEDED'],
  gold: ['#FFFFFF', '#F4F4F4', '#DDDDDD'],
  cream: '#FFFFFF', wordmark: '#FFFFFF',
};

// ---- the stardust -----------------------------------------------------------
// The cluster runs clockwise from about 1 o'clock (20°) round to 8 o'clock (240°),
// densest from 3 to 7 o'clock. Fewer and larger than the reference on purpose.
function particles(seed, { count = 58, big = 5, sparks = 44 } = {}) {
  const rand = mulberry32(seed);
  const list = [];
  // weight: a bump centred on ~140° (about 4:40), wide enough to reach both ends
  const weight = (deg) => Math.exp(-Math.pow((deg - 140) / 70, 2));
  let guard = 0;
  while (list.length < count && guard++ < 5000) {
    const deg = 15 + rand() * 235;
    if (rand() > weight(deg) + 0.08) continue;
    const w = weight(deg);
    const spread = 10 + 38 * w;                      // more scatter where it is dense
    const rr = R + (rand() - 0.5) * 2 * spread;
    const r = 5 + 11 * Math.pow(rand(), 1.6) + 5 * w; // 5–21 px
    const roll = rand();
    const color = roll < 0.62 ? PLUM.pink[Math.floor(rand() * 4)] : roll < 0.86 ? PLUM.gold[Math.floor(rand() * 3)] : PLUM.cream;
    const op = 0.72 + 0.28 * rand();
    const [x, y] = pt(deg, rr);
    list.push({ x, y, r, color, op, deg });
  }
  // a few big, soft bokeh dots low on the ring
  for (let i = 0; i < big; i++) {
    const deg = 70 + rand() * 150;
    const rr = R + (rand() - 0.5) * 60;
    const [x, y] = pt(deg, rr);
    list.push({ x, y, r: 15 + rand() * 10, color: rand() < 0.5 ? PLUM.pink[1] : PLUM.gold[1], op: 0.30 + rand() * 0.18, deg, bokeh: true });
  }
  // tiny bright sparks between the larger dots, so the cluster still sparkles
  guard = 0;
  let n = 0;
  while (n < sparks && guard++ < 5000) {
    const deg = 15 + rand() * 235;
    if (rand() > weight(deg) + 0.05) continue;
    const rr = R + (rand() - 0.5) * 2 * (16 + 40 * weight(deg));
    const [x, y] = pt(deg, rr);
    list.push({ x, y, r: 2.6 + rand() * 2.6, color: rand() < 0.5 ? PLUM.cream : PLUM.pink[1], op: 0.85 + 0.15 * rand(), deg, spark: true });
    n++;
  }
  return list;
}

// Map a plum-palette colour to the active palette (so tinted swaps to greys).
function remap(color, pal) {
  const i = PLUM.pink.indexOf(color); if (i >= 0) return pal.pink[i];
  const j = PLUM.gold.indexOf(color); if (j >= 0) return pal.gold[j];
  if (color === PLUM.cream) return pal.cream;
  return color;
}

function arc(start, len, r) {
  const [x0, y0] = pt(start, r), [x1, y1] = pt(start + len, r);
  return `M ${f1(x0)} ${f1(y0)} A ${r} ${r} 0 ${len > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}

function defs(id, pal) {
  return `<defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.bg[0]}"/><stop offset="0.5" stop-color="${pal.bg[1]}"/><stop offset="1" stop-color="${pal.bg[2]}"/></linearGradient>
    <radialGradient id="${id}-bloom" cx="0.68" cy="0.72" r="0.55"><stop offset="0" stop-color="${pal.glow}" stop-opacity="0.9"/><stop offset="1" stop-color="${pal.glow}" stop-opacity="0"/></radialGradient>
    <filter id="${id}-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="${id}-halo" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${id}-ringglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>`;
}

function ringAndDust(id, pal, seed, { bloom = true } = {}) {
  const ps = particles(seed);
  const parts = [];
  // the faint bloom behind the cluster (a background haze, left out of the transparent
  // dark icon), then the ring's own glow on the bright side
  if (bloom) parts.push(`<rect width="${S}" height="${S}" fill="url(#${id}-bloom)"/>`);
  parts.push(`<path d="${arc(25, 215, R)}" fill="none" stroke="${pal.ring}" stroke-width="30" stroke-linecap="round" opacity="0.28" filter="url(#${id}-soft)"/>`);
  // the thin ring: a main hairline and a second, slightly offset one (the reference's double edge)
  parts.push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${pal.ring}" stroke-width="5" opacity="0.78"/>`);
  parts.push(`<circle cx="${CX - 9}" cy="${CY - 7}" r="${R - 7}" fill="none" stroke="${pal.ringSoft}" stroke-width="3" opacity="0.42"/>`);
  // the bright arc where the dust rides the ring
  parts.push(`<path d="${arc(20, 225, R)}" fill="none" stroke="${pal.pink[1]}" stroke-width="7" stroke-linecap="round" opacity="0.55" filter="url(#${id}-ringglow)"/>`);
  // halos first, then the particles, so every dot glows
  for (const p of ps) {
    const c = remap(p.color, pal);
    if (p.spark) continue;
    parts.push(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r * (p.bokeh ? 1.3 : 2.2))}" fill="${c}" opacity="${(p.op * (p.bokeh ? 0.35 : 0.55)).toFixed(2)}" filter="url(#${id}-halo)"/>`);
  }
  for (const p of ps) {
    const c = remap(p.color, pal);
    parts.push(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r)}" fill="${c}" opacity="${p.op.toFixed(2)}"/>`);
    if (!p.bokeh && p.r > 11) parts.push(`<circle cx="${f1(p.x - p.r * 0.28)}" cy="${f1(p.y - p.r * 0.28)}" r="${f1(p.r * 0.3)}" fill="#FFFFFF" opacity="0.75"/>`);
  }
  return parts.join('\n  ');
}

function icon(variant, { bloom } = {}) {
  const pal = variant === 'dark' ? PLUM_DARK : variant === 'tinted' ? TINTED : PLUM;
  const id = `dottie-${variant}`;
  if (bloom === undefined) bloom = variant !== 'dark';
  // The dark appearance has no background of its own: the ring and its glow sit on
  // transparency, and iOS draws the dark ground behind it.
  const ground = variant === 'dark' ? '' : `<rect width="${S}" height="${S}" fill="url(#${id}-bg)"/>\n  `;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <!-- Dottie app icon (${variant}). The stardust ring from the Today screen as the whole icon. Original vector art; iOS applies the corner mask.${variant === 'dark' ? ' Transparent background on purpose.' : ''} -->
  ${defs(id, pal)}
  ${ground}${ringAndDust(id, pal, 2026, { bloom })}
</svg>`;
}

// ---- the logo: "Dottie" in Newsreader, outlined to paths ----------------------
const font = opentype.loadSync(join(here, 'Newsreader-variable.ttf'));
function wordmarkPath(text, size) {
  const p = font.getPath(text, 0, 0, size, { kerning: true });
  const b = p.getBoundingBox();
  return { d: p.toPathData(2), width: b.x2 - b.x1, x1: b.x1, y1: b.y1, y2: b.y2 };
}

function logo({ transparent = false } = {}) {
  const pal = PLUM, id = transparent ? 'dottie-mark' : 'dottie-logo';
  const wm = wordmarkPath('Dottie', 238);
  // centre optically: the cap height and the descender-less word sit a little above the ring's middle
  const tx = CX - wm.x1 - wm.width / 2;
  const ty = CY + (-(wm.y1 + wm.y2) / 2) + 6;
  const bg = transparent
    ? `<circle cx="${CX}" cy="${CY}" r="${R + 2}" fill="url(#${id}-bg)"/>`
    : `<rect width="${S}" height="${S}" fill="url(#${id}-bg)"/>`;
  const clip = transparent ? `<clipPath id="${id}-clip"><circle cx="${CX}" cy="${CY}" r="${R + 60}"/></clipPath>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <!-- Dottie logo: the stardust ring with the wordmark in Newsreader (SIL OFL), outlined so no font is needed. -->
  ${defs(id, pal)}${clip}
  <g ${transparent ? `clip-path="url(#${id}-clip)"` : ''}>
  ${bg}
  ${ringAndDust(id, pal, 2026)}
  </g>
  <path transform="translate(${f1(tx)} ${f1(ty)})" d="${wm.d}" fill="${pal.wordmark}"/>
</svg>`;
}

// ---- preview sheets -----------------------------------------------------------
function squircle(size) {
  const n = 5, a = size / 2, pts = [];
  for (let i = 0; i <= 180; i++) {
    const th = (i / 180) * TAU, c = Math.cos(th), s = Math.sin(th);
    pts.push(`${(a + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)).toFixed(2)},${(a + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
let clipN = 0;
function placed(svgInner, x, y, size, mask = true) {
  const id = `pc${clipN++}`;
  const clip = mask ? `<clipPath id="${id}"><path d="${squircle(size)}"/></clipPath>` : '';
  return `<g transform="translate(${x} ${y})">${clip}<g ${mask ? `clip-path="url(#${id})"` : ''}><svg width="${size}" height="${size}" viewBox="0 0 ${S} ${S}">${svgInner}</svg></g></g>`;
}
const FONT = 'font-family="Helvetica, Arial, sans-serif"';
function label(x, y, text, size = 22, color = '#37342B') {
  return `<text x="${x}" y="${y}" ${FONT} font-size="${size}" fill="${color}">${text}</text>`;
}

function sheet() {
  const W = 1700, H = 1250;
  const variants = [
    ['Light (the icon)', inner(icon('light')), '#DED8CC'],
    ['Dark appearance', inner(icon('dark')), '#2B2B2F'],
    ['Tinted source (grayscale)', inner(icon('tinted')), '#2B2B2F'],
    ['Tinted on iOS (blue, simulated)', inner(icon('tinted')).replace(/#FFFFFF|#F2F2F2|#E6E6E6|#EDEDED|#F4F4F4|#DDDDDD|#D0D0D0|#9A9A9A/g, (m) => ({ '#FFFFFF': '#B9CCFF', '#F2F2F2': '#A9BFFF', '#E6E6E6': '#97B0F5', '#EDEDED': '#A3B8FA', '#F4F4F4': '#B0C4FF', '#DDDDDD': '#8EA6EE', '#D0D0D0': '#8EA6EE', '#9A9A9A': '#6B82C8' }[m])).replace(/#000000/g, '#1C1C1E'), '#2B2B2F'],
  ];
  const parts = [`<rect width="${W}" height="${H}" fill="#F4F1EA"/>`];
  parts.push(`<text x="60" y="78" ${FONT} font-size="40" font-weight="700" fill="#37342B">Dottie icon: the stardust ring</text>`);
  parts.push(label(60, 122, 'Deep plum, thin pink ring, pink and gold stardust along the lower and right side. Ring at 87% of the square.', 24, '#8A8271'));
  variants.forEach(([name, v, ground], i) => {
    const x = 60 + i * 405;
    parts.push(label(x, 178, name));
    parts.push(placed(v, x, 196, 360));
    parts.push(label(x, 590, '1024 px master, shown at 360', 18, '#8A8271'));
    parts.push(`<rect x="${x}" y="620" width="360" height="330" rx="28" fill="${ground}"/>`);
    const ink = ground === '#DED8CC' ? '#37342B' : '#E6E1D6';
    let sx = x + 28;
    [[60, '60pt'], [40, '40pt'], [29, '29pt']].forEach(([ptSize, t]) => {
      const px = ptSize * 2;
      parts.push(placed(v, sx, 650, px));
      parts.push(label(sx, 650 + px + 28, t, 15, ink));
      sx += px + 36;
    });
    parts.push(label(x + 28, 858, 'At 2x: home screen, Spotlight, Settings', 16, ink));
    // at 1x pixels, the honest tiny sizes
    parts.push(placed(v, x + 28, 884, 60)); parts.push(placed(v, x + 104, 894, 40)); parts.push(placed(v, x + 160, 899, 29));
    parts.push(label(x + 206, 922, 'at 1x', 15, ink));
  });
  // the logo row
  parts.push(label(60, 1010, 'Logo: "Dottie" in Newsreader inside the ring (for the website hero and App Store marketing)', 22));
  parts.push(placed(inner(logo()), 60, 1030, 200, false));
  parts.push(placed(inner(logo({ transparent: true })), 290, 1030, 200, false));
  parts.push(`<rect x="520" y="1030" width="420" height="200" rx="24" fill="#F7F2E7"/>`);
  parts.push(placed(inner(logo({ transparent: true })), 540, 1040, 180, false));
  parts.push(label(740, 1120, 'the mark on Clay cream', 16, '#8A8271'));
  parts.push(label(60, 1245, 'square · ring only (transparent outside) · on the Clay page background', 16, '#8A8271'));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('\n')}</svg>`;
}

function png(svg, file, scale = 1) {
  const r = new Resvg(svg, { fitTo: { mode: 'zoom', value: scale } });
  writeFileSync(file, r.render().asPng());
}

// ---- opaque RGB PNG (no alpha channel) ------------------------------------------
// resvg writes RGBA. App Store Connect refuses a 1024 icon with an alpha channel,
// so the finished icons are re-encoded here as 8-bit RGB: the pixels are
// composited over the artwork's own bottom colour (they are already opaque, this
// only guards the edges) and written with a minimal PNG encoder.
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function pngRGB(svg, file, size, under = '#000000') {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const img = r.render();
  const { width: w, height: h } = img;
  const rgba = img.pixels;
  const ur = parseInt(under.slice(1, 3), 16), ug = parseInt(under.slice(3, 5), 16), ub = parseInt(under.slice(5, 7), 16);
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, o = y * (w * 3 + 1) + 1 + x * 3;
      const a = rgba[i + 3] / 255;
      raw[o] = Math.round(rgba[i] * a + ur * (1 - a));
      raw[o + 1] = Math.round(rgba[i + 1] * a + ug * (1 - a));
      raw[o + 2] = Math.round(rgba[i + 2] * a + ub * (1 - a));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit, RGB
  const out = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(file, out);
}

writeFileSync(join(here, 'icon-dottie.svg'), icon('light'));
writeFileSync(join(here, 'icon-dottie-dark.svg'), icon('dark'));
writeFileSync(join(here, 'icon-dottie-tinted.svg'), icon('tinted'));
writeFileSync(join(here, 'logo-dottie.svg'), logo());
writeFileSync(join(here, 'logo-dottie-mark.svg'), logo({ transparent: true }));
png(sheet(), join(out, 'icon-sheet.png'));
png(icon('light'), join(out, 'icon-1024.png'));
png(logo(), join(out, 'logo-1024.png'));
// the finished icons: 1024 x 1024, RGB, no alpha
pngRGB(icon('light'), join(iconOut, 'icon-light-1024.png'), 1024, PLUM.bg[2]);
png(icon('dark'), join(iconOut, 'icon-dark-1024.png')); // RGBA, transparent background
// a preview of the dark icon the way iOS shows it: over a dark gray ground, corner-masked, at 1024 and small sizes
{
  const v = inner(icon('dark')), W = 1700, H = 1180;
  const parts = [`<rect width="${W}" height="${H}" fill="#2B2B2F"/>`];
  parts.push(`<text x="60" y="78" ${FONT} font-size="36" font-weight="700" fill="#E6E1D6">Dark icon: the ring on a transparent background, shown over dark gray</text>`);
  parts.push(placed(v, 60, 120, 1000));
  parts.push(label(60, 1160, '1024 px master at 1000 (transparent background, iOS corner mask simulated)', 18, '#A9A49A'));
  let sx = 1120;
  [[180, '180'], [120, '120'], [80, '80'], [58, '58']].forEach(([px, t]) => { parts.push(placed(v, sx, 140, px)); parts.push(label(sx, 140 + px + 30, t + ' px', 16, '#A9A49A')); sx += px + 40; });
  sx = 1120; [[60, '60pt'], [40, '40pt'], [29, '29pt']].forEach(([pt, t]) => { const px = pt * 2; parts.push(placed(v, sx, 420, px)); parts.push(label(sx, 420 + px + 30, t + ' at 2x', 16, '#A9A49A')); sx += px + 40; });
  parts.push(`<rect x="1120" y="640" width="520" height="300" rx="28" fill="#1C1C1E"/>`);
  parts.push(label(1140, 672, 'on iOS black (#1C1C1E)', 16, '#A9A49A'));
  parts.push(placed(v, 1140, 690, 180)); parts.push(placed(v, 1340, 690, 120)); parts.push(placed(v, 1480, 690, 80));
  parts.push(`<rect x="1120" y="960" width="520" height="190" rx="28" fill="#F4F1EA"/>`);
  parts.push(label(1140, 992, 'on a light ground (shows the edges are clean)', 16, '#6B665E'));
  parts.push(placed(v, 1140, 1005, 120)); parts.push(placed(v, 1280, 1005, 80)); parts.push(placed(v, 1380, 1005, 58));
  // for comparison: the same file with the old background haze kept (not what ships)
  parts.push(placed(inner(icon('dark', { bloom: true })), 1500, 420, 120));
  parts.push(label(1500, 570, 'haze kept', 16, '#A9A49A')); parts.push(label(1500, 592, '(comparison, not shipped)', 14, '#A9A49A'));
  png(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('\n')}</svg>`, join(out, 'icon-dark-on-gray.png'));
}
pngRGB(icon('tinted'), join(iconOut, 'icon-tinted-1024.png'), 1024, TINTED.bg[2]);
// the website's touch icon and PNG favicon, from the light icon
pngRGB(icon('light'), join(siteImg, 'icon-180.png'), 180, PLUM.bg[2]);
pngRGB(icon('light'), join(siteImg, 'favicon-32.png'), 32, PLUM.bg[2]);
console.log('wrote icon (light, dark, tinted) SVGs, icon/*.png (light + tinted RGB, dark RGBA transparent), logo (square, mark), site icon-180 + favicon-32, and preview sheets');
