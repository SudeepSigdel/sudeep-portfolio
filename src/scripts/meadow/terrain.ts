import { BufferAttribute, BufferGeometry } from 'three';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Ground height at world (x, z). The camera looks down -z: a gentle meadow, then ridges stacking into the haze. */
export function terrainHeight(x: number, z: number): number {
  const d = Math.max(-z, 0);
  let h = 0.45 * Math.sin(x * 0.031 + z * 0.017) + 0.3 * Math.sin(x * 0.067 - z * 0.041 + 1.9) + 0.16 * Math.sin(x * 0.15 + z * 0.11 + 0.4);
  h += smooth(20, 220, d) * (5 + 3 * Math.sin(x * 0.013 + 0.8) + 1.6 * Math.sin(x * 0.034 + 2.1));
  h += smooth(200, 420, d) * (14 + 12 * Math.sin(x * 0.0072 + 2.6) + 6 * Math.sin(x * 0.021 + 0.2));
  h += smooth(380, 720, d) * (26 + 22 * Math.sin(x * 0.0045 + 4.1) + 9 * Math.sin(x * 0.013 + 1.0));
  return h;
}

/** A trapezoid grid that is dense near the camera and stretches toward the horizon, so it always fills the frustum. */
export function buildTerrain(rows = 190, cols = 150): BufferGeometry {
  const pos = new Float32Array((rows + 1) * (cols + 1) * 3);
  let k = 0;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const z = 12 - 760 * Math.pow(t, 1.8);
    const half = 45 + (12 - z) * 1.15;
    for (let c = 0; c <= cols; c++) {
      const x = (c / cols * 2 - 1) * half;
      pos[k++] = x;
      pos[k++] = terrainHeight(x, z);
      pos[k++] = z;
    }
  }
  const idx = new Uint32Array(rows * cols * 6);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + 1;
      const d = a + cols + 1;
      const e = d + 1;
      // counter-clockwise seen from above, so normals point up
      idx.set([a, b, d, b, e, d], i);
      i += 6;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}
