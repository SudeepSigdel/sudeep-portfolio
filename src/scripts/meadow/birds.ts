import { BufferAttribute, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial } from 'three';
import type { IUniform, Scene } from 'three';
import { birdFrag, birdVert } from './shaders';

const MAX = 6;
// A flock crosses the view on a diagonal, coming nearer or drifting away, so the camera sees both wings spread (a V),
// not just the thin edge of a bird flying square across the view.
// Altitude that keeps a flight at one screen height as it nears or recedes: screen y depends on height / depth, so height
// grows with depth. The band chosen (about 21 degrees above the eye) is the sky above the headline and below the nav bar,
// so a dark bird never crosses the dark type.
const EYE = 1.7;
const ALTITUDE = (z: number, elevation: number) => EYE + Math.tan(elevation) * (8 - z);
const EDGE = (z: number) => 0.84 * (8 - z) + 14; // half-width of the view at depth z, with a margin so flocks enter and leave off-screen

// x runs along the wing (-1 left tip .. 1 right tip), z along the chord (+ is forward). A smooth strip: the wing is
// broad at the shoulder, sweeps back and tapers to a pointed tip, with a small notch where it meets the body.
const SEG = 8;
const wing: number[] = [];
const INDEX: number[] = [];
for (let i = -SEG; i <= SEG; i++) {
  const x = i / SEG;
  const a = Math.abs(x);
  const lead = 0.2 - 0.34 * a * a - 0.08 * a; // leading edge sweeps back
  const chord = 0.06 + 0.5 * Math.pow(1 - a, 1.2) * (1 - 0.25 * Math.exp(-a * a * 40)); // tapers to the tip
  wing.push(x, 0, lead, x, 0, lead - chord);
}
for (let i = 0; i < SEG * 2; i++) {
  const k = i * 2;
  INDEX.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
}
const VERTS = new Float32Array(wing);

const between = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Now and then a small flock crosses the sky, then nothing for a long while. Time only advances while the meadow is
 * animating, so the gaps are felt gaps: nobody is waiting through a minute they could not see.
 */
export function createBirds(scene: Scene, uniforms: Record<string, IUniform>) {
  const geo = new InstancedBufferGeometry();
  geo.setAttribute('position', new BufferAttribute(VERTS, 3));
  geo.setIndex(INDEX);
  const start = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3);
  const bird = new Float32Array(MAX * 4); // all zero: wingspan 0, nothing drawn
  const aStart = new InstancedBufferAttribute(start, 3);
  const aVel = new InstancedBufferAttribute(vel, 3);
  const aBird = new InstancedBufferAttribute(bird, 4);
  geo.setAttribute('iStart', aStart);
  geo.setAttribute('iVel', aVel);
  geo.setAttribute('iBird', aBird);
  geo.instanceCount = 0;

  const mesh = new Mesh(geo, new ShaderMaterial({ vertexShader: birdVert, fragmentShader: birdFrag, uniforms, side: DoubleSide }));
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);

  let clock = 0;
  let nextAt = between(14, 26); // the first flock comes soon enough to be noticed; after that, long gaps
  let endsAt = 0;
  let flying = false;

  function spawn(time: number, forceDir?: 1 | -1) {
    const dir = forceDir ?? (Math.random() < 0.5 ? 1 : -1);
    const roll = Math.random();
    const count = roll < 0.35 ? 1 : roll < 0.55 ? 2 : roll < 0.75 ? 3 : roll < 0.9 ? 4 : 5;
    const far = -between(150, 190);
    const near = -between(58, 80);
    const [z0, z1] = Math.random() < 0.5 ? [far, near] : [near, far];
    const elevation = (between(20.8, 22.8) * Math.PI) / 180;
    const y = ALTITUDE(z0, elevation);
    const x0 = -dir * EDGE(z0);
    const path = [dir * EDGE(z1) - x0, ALTITUDE(z1, elevation) - y, z1 - z0];
    const length = Math.hypot(path[0], path[1], path[2]);
    const speed = between(8, 12);
    const duration = length / speed;
    const unit = path.map((p) => p / length);
    for (let i = 0; i < MAX; i++) {
      if (i >= count) {
        bird[i * 4 + 1] = 0;
        continue;
      }
      // followers trail the leader, spread a little in height and depth
      const back = i * between(3, 5); // followers trail the leader along the path
      start.set([x0 - unit[0] * back + between(-1.5, 1.5), y - unit[1] * back + between(-0.8, 0.8) + i * 0.3, z0 - unit[2] * back], i * 3);
      vel.set([(path[0] / duration) * between(0.97, 1.03), path[1] / duration, path[2] / duration], i * 3);
      bird.set([time, between(3.0, 4.2), Math.random(), between(2.2, 3.4)], i * 4);
    }
    aStart.needsUpdate = aVel.needsUpdate = aBird.needsUpdate = true;
    geo.instanceCount = count;
    mesh.visible = true;
    flying = true;
    endsAt = time + duration + 6;
    if (import.meta.env.DEV) console.debug('[meadow] flock ' + JSON.stringify({ count, dir, from: Math.round(z0), to: Math.round(z1), seconds: Math.round(duration) }));
  }

  return {
    /** Call once per animated frame. `canSpawn` is false at night, when a dark silhouette would not be seen. */
    update(dt: number, time: number, canSpawn: boolean) {
      clock += dt;
      if (flying && time > endsAt) {
        flying = false;
        mesh.visible = false;
        nextAt = clock + between(55, 130);
      }
      if (!flying && canSpawn && clock >= nextAt) spawn(time);
    },
    /** Dev only: where the leader is now (before undulation), and whether anything is drawn. */
    probe(time: number) {
      const age = time - bird[0];
      return { visible: mesh.visible, instances: geo.instanceCount, span: bird[1], age: +age.toFixed(1), x: +(start[0] + vel[0] * age).toFixed(1), y: +(start[1] + vel[1] * age).toFixed(1), z: +(start[2] + vel[2] * age).toFixed(1) };
    },
    /** Dev only: bring a flock in right now. */
    spawnNow(time: number, dir?: 1 | -1) {
      if (!flying) spawn(time, dir);
    },
  };
}
