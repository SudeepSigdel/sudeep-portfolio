#!/usr/bin/env node
// Generates the soft cloud and fog sprites used for ambient motion (src/assets/ambient/*.webp).
// Deterministic (hand-placed shapes, no randomness). Uses `sharp`, already a dependency of the site.
//
//   node scripts/assets/ambient.mjs

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/ambient');
await mkdir(out, { recursive: true });

/** circles: [cx, cy, r]; base: [cx, cy, rx, ry]; two blur passes give a soft core and a softer halo. */
function sprite({ w, h, circles, base, color = '#ffffff', halo = 34, core = 12 }) {
  const shapes = (c) =>
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('') +
    `<ellipse cx="${base[0]}" cy="${base[1]}" rx="${base[2]}" ry="${base[3]}" fill="${c}"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<filter id="h" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${halo}"/></filter>
<filter id="c" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${core}"/></filter>
</defs>
<g filter="url(#h)" opacity="0.85">${shapes(color)}</g>
<g filter="url(#c)" opacity="0.55">${shapes(color)}</g>
</svg>`);
}

const sprites = {
  'cloud-a': sprite({
    w: 1800, h: 520,
    circles: [[300, 360, 140], [480, 300, 180], [700, 260, 220], [930, 290, 190], [1130, 330, 160], [1350, 370, 125], [1560, 400, 95]],
    base: [900, 425, 800, 80],
  }),
  'cloud-b': sprite({
    w: 1300, h: 420,
    circles: [[250, 290, 105], [420, 245, 145], [620, 235, 165], [820, 265, 135], [1000, 305, 95]],
    base: [640, 345, 560, 62],
  }),
  'cloud-c': sprite({
    w: 900, h: 260,
    circles: [[200, 160, 70], [340, 130, 95], [500, 135, 90], [650, 165, 65]],
    base: [430, 195, 340, 40],
    halo: 26, core: 9,
  }),
  // wide, very soft mist for the closing section
  fog: sprite({
    w: 2200, h: 700,
    circles: [[420, 380, 190], [800, 330, 250], [1250, 360, 230], [1700, 340, 210]],
    base: [1100, 440, 1000, 110],
    color: '#e6efec', halo: 70, core: 34,
  }),
};

for (const [name, svg] of Object.entries(sprites)) {
  const info = await sharp(svg).webp({ quality: 82, alphaQuality: 90 }).toFile(resolve(out, `${name}.webp`));
  console.log(name, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)} KB`);
}
