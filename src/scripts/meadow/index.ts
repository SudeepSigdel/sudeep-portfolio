import {
  BufferAttribute,
  Color,
  ColorManagement,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';
import { createBirds } from './birds';
import { meadowBridge } from './bridge';
import { createNoiseTexture } from './noise';
import { grassFrag, grassVert, skyFrag, skyVert, terrainFrag, terrainVert } from './shaders';
import { buildTerrain, terrainHeight } from './terrain';

export type MeadowOptions = {
  canvas: HTMLCanvasElement;
  /** Elements that show the scene. Rendering pauses when none of them is on screen. */
  views: Element[];
  /** The element whose arrival turns the light to dusk. */
  dusk: Element | null;
  onReady: () => void;
  onFail: (reason: string) => void;
};

type Tier = { zNear: number; zFar: number; count: number; height: [number, number]; width: [number, number]; segments: number; bias: number };

// Three density tiers, one draw call each. Blades thin out and widen with distance; the ground shader carries the rest.
const TIERS: Tier[] = [
  { zNear: 5, zFar: -14, count: 100000, height: [0.55, 1.35], width: [0.016, 0.03], segments: 5, bias: 1.0 },
  { zNear: -14, zFar: -60, count: 100000, height: [0.6, 1.2], width: [0.05, 0.09], segments: 3, bias: 1.15 },
  { zNear: -60, zFar: -170, count: 42000, height: [0.8, 1.6], width: [0.22, 0.34], segments: 2, bias: 1.25 },
];

const TAN_HALF_FOV = Math.tan((50 / 2) * (Math.PI / 180));

// Late afternoon: low amber sun, pale blue-grey sky easing into ivory and a hint of peach at the horizon (authored as raw sRGB).
const HERO = { sun: new Vector3(0.42, 0.2, -0.88), zenith: new Color(0.56, 0.65, 0.71), haze: new Color(0.88, 0.77, 0.63), sunColor: new Color(1.0, 0.78, 0.46), tint: new Color(1.0, 1.0, 1.0), fog: 0.0026 };
const DUSK = { sun: new Vector3(0.36, 0.09, -0.93), zenith: new Color(0.26, 0.31, 0.38), haze: new Color(0.88, 0.58, 0.38), sunColor: new Color(1.0, 0.58, 0.28), tint: new Color(0.97, 0.87, 0.79), fog: 0.0032 };

// Night: a cool moon high and to the right, a deep navy sky, a dark blue-green haze. Moonlight is dim, so tint and light stay low.
const NIGHT = {
  moon: new Vector3(0.4, 0.32, -0.86),
  moonLow: new Vector3(0.34, 0.2, -0.92),
  zenith: new Color(0.025, 0.045, 0.11),
  haze: new Color(0.15, 0.2, 0.28),
  moonColor: new Color(0.72, 0.82, 0.98),
  tint: new Color(1.0, 1.12, 1.18),
  fog: 0.003,
};

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

export function startMeadow(opts: MeadowOptions) {
  const { canvas, views, dusk } = opts;
  ColorManagement.enabled = false;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowPower =
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760 || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 2;

  // Probe for WebGL2 ourselves so a device without it falls back quietly instead of logging from inside three.js.
  // MSAA stays on even for low-power devices: it is cheap on tile-based mobile GPUs and thin blades shimmer without it.
  const gl = canvas.getContext('webgl2', { antialias: (navigator.hardwareConcurrency ?? 8) > 2, alpha: false, stencil: false });
  if (!gl) {
    opts.onFail('WebGL2 context unavailable');
    return;
  }
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, context: gl });
  } catch (e) {
    opts.onFail(`renderer creation failed: ${e}`);
    return;
  }
  let failed = false;
  const fail = (reason: string) => {
    if (failed) return;
    failed = true;
    running = false;
    cancelAnimationFrame(raf);
    opts.onFail(reason);
  };
  renderer.debug.onShaderError = (gl, program, vs, fs) => {
    fail(`shader error: ${gl.getShaderInfoLog(vs) || gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program)}`);
  };
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    fail('WebGL context lost');
  });

  // ---- quality ---------------------------------------------------------------------------------------------
  let dprCap = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 1.6);
  let density = lowPower ? 0.3 : 1;
  let degradeSteps = 0;

  // ---- scene -----------------------------------------------------------------------------------------------
  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 2600);
  const noise = createNoiseTexture();

  const shared = {
    uNoise: { value: noise },
    uTime: { value: 0 },
    uWindDir: { value: new Vector2(0.82, -0.57) },
    uWind: { value: 1 },
    uSunDir: { value: HERO.sun.clone().normalize() },
    uSunColor: { value: HERO.sunColor.clone() },
    uFogColor: { value: HERO.haze.clone() },
    uFogDensity: { value: HERO.fog },
    uSkyZenith: { value: HERO.zenith.clone() },
    uGrassTint: { value: HERO.tint.clone() },
    uCursor: { value: new Vector4(0, 0, 3, 0) },
    uNight: { value: 0 },
    uSpace: { value: 0 },
  };

  const sky = new Mesh(
    new SphereGeometry(1, 32, 16),
    new ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: shared, side: DoubleSide, depthTest: false, depthWrite: false }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);

  const terrain = new Mesh(buildTerrain(), new ShaderMaterial({ vertexShader: terrainVert, fragmentShader: terrainFrag, uniforms: shared }));
  terrain.frustumCulled = false;
  scene.add(terrain);

  const birds = createBirds(scene, shared);

  const grassMaterial = new ShaderMaterial({ vertexShader: grassVert, fragmentShader: grassFrag, uniforms: shared, side: DoubleSide });
  const grass: { mesh: Mesh<InstancedBufferGeometry>; total: number }[] = [];

  /** Blade strip: `segments` pairs of vertices plus a single tip vertex. x spans -0.5..0.5, y runs 0..1 up the blade. */
  function bladeGeometry(segments: number) {
    const verts: number[] = [];
    for (let r = 0; r < segments; r++) verts.push(-0.5, r / segments, 0, 0.5, r / segments, 0);
    verts.push(0, 1, 0);
    const index: number[] = [];
    for (let r = 0; r < segments - 1; r++) {
      const a = r * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const top = (segments - 1) * 2;
    index.push(top, top + 1, top + 2);
    const g = new InstancedBufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3));
    g.setIndex(index);
    return g;
  }

  let builtAspect = 0;
  function buildGrass(aspect: number) {
    for (const t of grass) {
      scene.remove(t.mesh);
      t.mesh.geometry.dispose();
    }
    grass.length = 0;
    builtAspect = aspect;
    const tanH = TAN_HALF_FOV * Math.max(aspect, 0.5);
    const widthScale = Math.min(Math.max(aspect / 1.78, 0.4), 1.4);
    for (const tier of TIERS) {
      const count = Math.round(tier.count * density * widthScale);
      const offsets = new Float32Array(count * 3);
      const params = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        const u = Math.pow(Math.random(), tier.bias);
        const z = tier.zNear + (tier.zFar - tier.zNear) * u;
        const half = (8 - z) * tanH + 2.5;
        const x = (Math.random() * 2 - 1) * half;
        offsets.set([x, terrainHeight(x, z) - 0.02, z], i * 3);
        const grow = Math.pow(Math.random(), 1.6); // mostly mid-height, a few tall stems
        params.set(
          [
            tier.height[0] + (tier.height[1] - tier.height[0]) * grow,
            tier.width[0] + (tier.width[1] - tier.width[0]) * Math.random(),
            Math.random() * Math.PI * 2,
            Math.random(),
          ],
          i * 4,
        );
      }
      const geo = bladeGeometry(tier.segments);
      geo.setAttribute('iOffset', new InstancedBufferAttribute(offsets, 3));
      geo.setAttribute('iParams', new InstancedBufferAttribute(params, 4));
      geo.instanceCount = count;
      const mesh = new Mesh(geo, grassMaterial);
      mesh.frustumCulled = false;
      scene.add(mesh);
      grass.push({ mesh, total: count });
    }
  }

  // ---- sizing ----------------------------------------------------------------------------------------------
  let resizeTimer = 0;
  function resize() {
    const w = Math.max(canvas.clientWidth, 1);
    const h = Math.max(canvas.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (camera.aspect > builtAspect * 1.1) buildGrass(camera.aspect);
    dirty = true;
  }
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }).observe(canvas);

  // ---- scroll, mood, pointer -------------------------------------------------------------------------------
  let scrollP = 0; // hero progress, 0..1
  let duskTarget = 0;
  let duskNow = 0;
  let nightTarget = document.documentElement.dataset.theme === 'night' ? 1 : 0;
  let nightNow = nightTarget;
  const readScroll = () => {
    scrollP = clamp01(window.scrollY / Math.max(window.innerHeight, 1));
    if (dusk) duskTarget = ease(clamp01(1 - dusk.getBoundingClientRect().top / Math.max(window.innerHeight, 1)));
    dirty = true;
  };
  window.addEventListener('scroll', readScroll, { passive: true });

  // the page theme drives the scene: watch the attribute the nav toggle flips
  new MutationObserver(() => {
    nightTarget = document.documentElement.dataset.theme === 'night' ? 1 : 0;
    dirty = true;
    if (!running && visible) requestAnimationFrame(renderStill);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const pointer = new Vector2(0, 0);
  let pointerSeen = -1e9;
  const ray = new Raycaster();
  const groundPlane = new Plane(new Vector3(0, 1, 0), -0.3);
  const hit = new Vector3();
  const cursor = { x: 0, z: 0, strength: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      pointerSeen = performance.now();
    },
    { passive: true },
  );

  // ---- the story: the camera lifts off the meadow into a starfield, and comes back ----------------------------------
  const SPACE_IN = 3.6; // seconds
  const SPACE_OUT = 2.8;
  let spaceStamp = performance.now();
  let spaceTarget = 0;
  let spaceNow = 0;
  let forced = false; // the story is open: render even when the hero is scrolled out of view
  let spaceWaiters: { to: number; done: () => void }[] = [];
  const setGroundVisible = (v: boolean) => scene.children.forEach((c) => c !== sky && (c.visible = v));
  function settleWaiters() {
    spaceWaiters = spaceWaiters.filter((w) => {
      const reached = Math.abs(spaceNow - w.to) < 0.001;
      if (reached) w.done();
      return !reached;
    });
  }

  // ---- per-frame state -------------------------------------------------------------------------------------
  const lerpColor = (out: Color, a: Color, b: Color, m: number) => out.copy(a).lerp(b, m);
  const sun = new Vector3();
  const nightMoon = new Vector3();
  const camPos = new Vector3();
  const look = new Vector3();

  function update(time: number, dt: number, animated: boolean) {
    duskNow = animated ? duskNow + (duskTarget - duskNow) * Math.min(dt * 2.2, 1) : duskTarget;
    nightNow = animated ? nightNow + (nightTarget - nightNow) * Math.min(dt * 2.2, 1) : nightTarget;
    if (Math.abs(nightTarget - nightNow) < 0.002) nightNow = nightTarget;
    // story progress moves at a steady rate and is eased where it is used
    const stamp = performance.now();
    const sdt = Math.min((stamp - spaceStamp) / 1000, 0.5); // real elapsed time, so a slow frame does not stretch the move
    spaceStamp = stamp;
    if (animated) {
      const step = sdt / (spaceTarget > spaceNow ? SPACE_IN : SPACE_OUT);
      spaceNow = spaceTarget > spaceNow ? Math.min(spaceNow + step, spaceTarget) : Math.max(spaceNow - step, spaceTarget);
    } else spaceNow = spaceTarget;
    const S = ease(spaceNow);
    shared.uSpace.value = S;
    const m = duskNow;
    const n = nightNow;

    shared.uTime.value = time;
    // lulls and swells in the overall wind, slow enough to read as weather
    shared.uWind.value = animated ? 0.82 + 0.18 * Math.sin(time * 0.17) + 0.08 * Math.sin(time * 0.43 + 1.3) : 0.9;
    sun.copy(HERO.sun).lerp(DUSK.sun, m).normalize();
    shared.uSunDir.value.copy(sun);
    lerpColor(shared.uSunColor.value, HERO.sunColor, DUSK.sunColor, m);
    lerpColor(shared.uFogColor.value, HERO.haze, DUSK.haze, m);
    lerpColor(shared.uSkyZenith.value, HERO.zenith, DUSK.zenith, m);
    lerpColor(shared.uGrassTint.value, HERO.tint, DUSK.tint, m);
    shared.uFogDensity.value = HERO.fog + (DUSK.fog - HERO.fog) * m;

    // blend toward night last, so day, dusk and night all cross-fade
    shared.uNight.value = n;
    if (n > 0) {
      sun.lerp(nightMoon.copy(NIGHT.moon).lerp(NIGHT.moonLow, m).normalize(), n).normalize();
      shared.uSunDir.value.copy(sun);
      shared.uSunColor.value.lerp(NIGHT.moonColor, n);
      shared.uFogColor.value.lerp(NIGHT.haze, n);
      shared.uSkyZenith.value.lerp(NIGHT.zenith, n);
      shared.uGrassTint.value.lerp(NIGHT.tint, n);
      shared.uFogDensity.value += (NIGHT.fog - shared.uFogDensity.value) * n;
    }

    // camera: a slow dolly down into the grass as the hero scrolls away, low and close for the dusk
    const sway = animated ? Math.sin(time * 0.11) * 0.14 : 0;
    camPos.set(sway, 0, 8 + (4 - 8) * scrollP);
    camPos.z += (6 - camPos.z) * m;
    camPos.y = terrainHeight(camPos.x, camPos.z) + (1.7 - 0.35 * scrollP) * (1 - m) + 0.95 * m;
    camera.position.copy(camPos);
    // aim a little above the eye line: the horizon sits below centre and the sky gets the larger share of the frame
    look.set(sway * 0.4, camPos.y + (1.4 - 0.6 * scrollP) * (1 - m) + 2.2 * m + S * 95, camPos.z - 38);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    // cursor pushes the grass only while the pointer is fine, recent and below the horizon
    const idle = performance.now() - pointerSeen;
    let target = 0;
    let radius = 3;
    if (animated && pointerQuery.matches && idle < 3000) {
      ray.setFromCamera(pointer, camera);
      if (ray.ray.intersectPlane(groundPlane, hit) && hit.z < camPos.z - 1.5 && hit.z > -70) {
        const k = 1 - 0.5 * ease(clamp01((idle - 400) / 2600));
        target = k;
        radius = Math.min(Math.max((camPos.z - hit.z) * 0.14, 1.3), 6);
        cursor.x += (hit.x - cursor.x) * Math.min(dt * 6, 1);
        cursor.z += (hit.z - cursor.z) * Math.min(dt * 6, 1);
      }
    }
    cursor.strength += (target - cursor.strength) * Math.min(dt * 3, 1);
    shared.uCursor.value.set(cursor.x, cursor.z, radius, cursor.strength);
  }

  // once space has fully covered the view the ground is out of frame: stop drawing it, and bring it back before the way down
  function afterUpdate() {
    const covered = spaceNow >= 0.999;
    if (covered === scene.children.some((c) => c !== sky && c.visible)) setGroundVisible(!covered);
    settleWaiters();
  }

  // ---- loop ------------------------------------------------------------------------------------------------
  let running = false;
  let raf = 0;
  let dirty = true;
  let last = performance.now();
  let frames = 0;
  let slow = 0;
  let readyFired = false;
  const t0 = performance.now();
  const STILL = 31; // the time a reduced-motion visitor sees: any fixed moment of the wind

  function degrade() {
    degradeSteps++;
    dprCap = Math.max(0.75, dprCap - 0.35);
    density *= 0.65;
    for (const t of grass) {
      t.total = Math.round(t.total * 0.65);
      t.mesh.geometry.instanceCount = t.total;
    }
    resize();
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const time = STILL + (now - t0) / 1000;
    update(time, dt, true);
    afterUpdate();
    if (spaceNow < 0.999) birds.update(dt, time, nightNow < 0.5);
    renderer.render(scene, camera);
    afterFrame(dt);
  }

  function afterFrame(dt: number) {
    frames++;
    if (!readyFired && frames >= 2) {
      readyFired = true;
      opts.onReady();
    }
    // adaptive quality: after warm-up, if the average frame is slow, shed pixels and blades (at most 4 times)
    if (frames > 40 && degradeSteps < 4 && dt < 0.2) {
      slow += dt;
      if (frames % 60 === 0) {
        if (slow / 60 > 0.028) degrade();
        slow = 0;
      }
    }
  }

  function renderStill() {
    if (!dirty || failed) return;
    dirty = false;
    update(STILL, 0.016, false);
    afterUpdate();
    renderer.render(scene, camera);
    afterFrame(0);
  }

  let visible = true;
  function sync() {
    if (failed) return;
    const animate = (visible || forced) && !document.hidden && !motionQuery.matches;
    if (animate && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!animate && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
    if (!animate && (visible || forced)) {
      dirty = true;
      requestAnimationFrame(renderStill);
    }
  }
  const seen = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
    visible = seen.size > 0;
    sync();
  });
  views.forEach((v) => io.observe(v));
  document.addEventListener('visibilitychange', sync);
  motionQuery.addEventListener('change', sync);
  // reduced motion: no loop, but a scroll still repaints the single frame
  window.addEventListener('scroll', () => {
    if (!running && visible) requestAnimationFrame(renderStill);
  }, { passive: true });

  meadowBridge.api = {
    setSpace(on, opts) {
      if (failed) return Promise.resolve();
      spaceTarget = on ? 1 : 0;
      if (on) {
        forced = true;
      }
      const instant = opts?.instant || motionQuery.matches;
      if (instant) spaceNow = spaceTarget;
      dirty = true;
      sync();
      if (!running) requestAnimationFrame(renderStill);
      return new Promise<void>((resolve) => {
        const done = () => {
          if (!on) {
            forced = false;
            sync();
          }
          resolve();
        };
        if (Math.abs(spaceNow - spaceTarget) < 0.001) {
          if (!running) requestAnimationFrame(() => (afterUpdate(), done()));
          else done();
        } else spaceWaiters.push({ to: spaceTarget, done });
      });
    },
  };

  // Dev only (stripped from production builds): `__meadow.birds(1 | -1)` brings a flock in at once, flying right or left, to see them without waiting.
  let spawnedAt = 0;
  if (import.meta.env.DEV) (window as unknown as { __meadow: object }).__meadow = {
      birds: (dir?: 1 | -1) => {
        spawnedAt = shared.uTime.value;
        birds.spawnNow(spawnedAt, dir);
      },
      // pause the loop, then draw the flock at a chosen moment of its flight
      seek: (age: number) => {
        running = false;
        cancelAnimationFrame(raf);
        shared.uTime.value = spawnedAt + age;
        renderer.render(scene, camera);
      },
      probe: () => {
        const p = birds.probe(shared.uTime.value);
        const v = new Vector3(p.x, p.y, p.z).project(camera);
        return JSON.stringify({ ...p, screen: [Math.round(((v.x + 1) / 2) * canvas.clientWidth), Math.round(((1 - v.y) / 2) * canvas.clientHeight)] });
      },
    };

  // ---- go --------------------------------------------------------------------------------------------------
  resize();
  readScroll();
  duskNow = duskTarget;
  (async () => {
    try {
      update(STILL, 0.016, false);
      await renderer.compileAsync(scene, camera);
    } catch {
      /* the first render compiles synchronously instead */
    }
    if (failed) return;
    visible = true;
    sync();
  })();
}
