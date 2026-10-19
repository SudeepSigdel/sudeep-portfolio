import { DataTexture, LinearFilter, RGBAFormat, RepeatWrapping, UnsignedByteType } from 'three';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise: `cells` lattice cells across the texture, wrapping seamlessly. */
function periodic(size: number, cells: number, rand: () => number) {
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  const out = new Float32Array(size * size);
  const at = (x: number, y: number) => lattice[(y % cells) * cells + (x % cells)];
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cells;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    const sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const sx = tx * tx * (3 - 2 * tx);
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      out[y * size + x] = a + (b - a) * sy;
    }
  }
  return out;
}

/**
 * One 256² RGBA texture that drives everything organic: R = broad gust fronts, G = golden/green patches,
 * B = fine streaks. Sampled in the vertex shader (wind) and fragment shaders (ground, clouds), which is far
 * cheaper than evaluating noise per blade vertex.
 */
export function createNoiseTexture(size = 256): DataTexture {
  const rand = mulberry32(20260813);
  const channel = (cells: number[], weights: number[]) => {
    const layers = cells.map((c) => periodic(size, c, rand));
    return (i: number) => layers.reduce((s, l, n) => s + l[i] * weights[n], 0);
  };
  const r = channel([8, 16, 32], [0.55, 0.3, 0.15]);
  const g = channel([4, 8, 16], [0.55, 0.3, 0.15]);
  const b = channel([16, 32, 64], [0.5, 0.3, 0.2]);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = Math.round(r(i) * 255);
    data[i * 4 + 1] = Math.round(g(i) * 255);
    data[i * 4 + 2] = Math.round(b(i) * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
