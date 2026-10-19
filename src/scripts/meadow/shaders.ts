// All colours are authored directly in sRGB (ColorManagement is disabled in index.ts), so what is written here is what is shown.

/** Wind field shared by blades, ground and clouds: two layers of scrolling noise travelling along uWindDir. */
const wind = /* glsl */ `
uniform sampler2D uNoise;
uniform vec2 uWindDir;
uniform float uTime;

float gustAt(vec2 p) {
  float a = texture2D(uNoise, p * 0.011 - uWindDir * uTime * 0.034).r;
  float b = texture2D(uNoise, p * 0.037 - uWindDir * uTime * 0.082 + 0.37).b;
  return smoothstep(0.32, 0.68, a * 0.65 + b * 0.35);
}

/** Soft shadows of the clouds drifting over the field (1 = sunlit, lower = in shadow). */
float cloudShade(vec2 p) {
  float a = texture2D(uNoise, p * 0.0042 - uWindDir * uTime * 0.006 + 0.5).r;
  float b = texture2D(uNoise, p * 0.011 - uWindDir * uTime * 0.012).b;
  return mix(0.55, 1.0, smoothstep(0.42, 0.62, a * 0.6 + b * 0.4));
}
`;

/** Exponential-squared haze, warmed toward the sun when looking into it. */
const fog = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNight;     // 0 = day/dusk, 1 = moonlit night

// Gentle filmic finish: soft highlight shoulder and a touch of contrast (no saturation boost: saturation comes from the palettes)
vec3 grade(vec3 c) {
  vec3 t = c / (1.0 + max(c - 0.8, 0.0) * 0.7);
  float l = dot(t, vec3(0.299, 0.587, 0.114));
  t = clamp(mix(vec3(l), t, 1.0), 0.0, 1.0);
  return mix(t, t * t * (3.0 - 2.0 * t), 0.22);
}

vec3 applyFog(vec3 col, vec3 worldPos) {
  vec3 d = worldPos - cameraPosition;
  float dist = length(d);
  float f = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
  float sunAmt = pow(max(dot(d / dist, uSunDir), 0.0), 6.0);
  return grade(mix(col, mix(uFogColor, uSunColor, sunAmt * 0.4), f));
}
`;

export const grassVert = /* glsl */ `
attribute vec3 iOffset;   // blade base, world space
attribute vec4 iParams;   // height, width, yaw, random
uniform vec4 uCursor;     // x, z, radius, strength
uniform float uWind;
uniform vec3 uGrassTint;
uniform vec3 uSkyZenith;
${wind}
${fog}

varying vec3 vColor;

void main() {
  float t = position.y;                 // 0 at the root, 1 at the tip
  float side = position.x;              // -0.5 .. 0.5 across the blade
  float h = iParams.x;
  float rnd = iParams.w;
  float c = cos(iParams.z);
  float s = sin(iParams.z);
  vec3 right = vec3(c, 0.0, -s);
  vec3 fwd = vec3(s, 0.0, c);
  float tt = t * t;

  // body: tapers to a point, arcs over under its own weight (a different amount for every blade)
  vec3 p = right * side * iParams.y * pow(max(1.0 - t, 0.0), 0.7);
  float arc = (0.12 + 0.5 * rnd) * h;
  p += fwd * arc * tt;
  p.y = h * t;

  // wind: a broad gust front, a rolling swell and a quick flutter. Bend grows with height squared, so the root stays put.
  vec2 wpos = iOffset.xz;
  float gust = gustAt(wpos);
  float swell = 0.5 + 0.5 * sin(dot(wpos, uWindDir) * 0.45 - uTime * 1.7 + rnd * 2.0);
  float flutter = sin(uTime * 5.0 + rnd * 40.0 + wpos.x * 2.1);
  vec2 full = uWindDir * (0.1 + 0.62 * gust + 0.2 * swell) * uWind * h * 0.58;
  full += vec2(-uWindDir.y, uWindDir.x) * flutter * 0.035 * (0.4 + gust) * h;

  // cursor: grass leans away from the pointer, softly
  vec2 away = wpos - uCursor.xy;
  float dist = length(away);
  full += (away / max(dist, 0.001)) * smoothstep(uCursor.z, 0.0, dist) * uCursor.w * h * 0.5;

  p.xz += full * tt;
  p.y -= length(full) * tt * t * 0.45;  // a bent blade is shorter, not stretched
  vec3 world = iOffset + p;

  // surface normal follows the bend (so gusts change the shading), and the blade is folded along its midrib
  vec3 V = normalize(cameraPosition - world);
  vec3 T = vec3(2.0 * t * (fwd.x * arc + full.x), h, 2.0 * t * (fwd.z * arc + full.y));
  vec3 n = normalize(cross(right, T));
  if (dot(n, V) < 0.0) n = -n;
  n = normalize(n + right * side * 1.1);

  // albedo: dark root, golden-green body, sunlit tip; broad patches of gold, per-blade tone, a few dry stems
  float patches = texture2D(uNoise, wpos * 0.0045).g;
  float gold = clamp(patches * 1.6 - 0.5 + (rnd - 0.5) * 0.45, 0.0, 1.0);
  // palette: root #353D25 deep grass shadow; body olive #777A3C -> amber #B88A32 / straw #C9A747; tips olive-lit -> warm highlight #D9BD69
  vec3 root = vec3(0.208, 0.239, 0.145);
  vec3 amber = mix(vec3(0.722, 0.541, 0.196), vec3(0.788, 0.655, 0.278), fract(rnd * 5.31));
  vec3 mid = mix(vec3(0.467, 0.478, 0.235), amber, gold);
  vec3 tip = mix(vec3(0.66, 0.65, 0.33), vec3(0.851, 0.741, 0.412), gold);
  vec3 albedo = mix(root, mid, smoothstep(0.0, 0.5, t));
  albedo = mix(albedo, tip, smoothstep(0.4, 1.0, t));
  albedo *= 0.84 + 0.32 * fract(rnd * 13.7);
  albedo = mix(albedo, vec3(0.55, 0.42, 0.21), step(0.88, rnd) * smoothstep(0.45, 1.0, t) * 0.75);
  // by moonlight the same blades lose their gold: desaturated and cooled toward blue-green
  albedo = mix(albedo, vec3(dot(albedo, vec3(0.299, 0.587, 0.114))) * vec3(0.8, 0.94, 0.96) + vec3(0.0, 0.012, 0.02), uNight * 0.75);

  // light: sky and soil bounce, wrapped sun on the blade face, sun shining through toward the camera, a waxy sheen
  vec3 L = uSunDir;
  float shade = cloudShade(wpos);
  float ndl = dot(n, L);
  float diff = max(ndl, 0.0) * 0.7 + 0.3 * (0.5 + 0.5 * ndl);
  vec3 hemi = mix(vec3(0.14, 0.17, 0.10) * (1.0 - 0.5 * uNight), uSkyZenith * 0.45 + uFogColor * 0.55, 0.5 + 0.5 * n.y);  // earthy bounce below, hazy sky above
  float through = pow(max(dot(-V, L), 0.0), 2.5) * (0.3 + 0.7 * t);
  float sheen = pow(max(dot(n, normalize(L + V)), 0.0), 24.0) * (0.25 + 0.75 * t);
  float ao = mix(0.38, 1.0, pow(t, 0.65)) * (0.82 + 0.3 * texture2D(uNoise, wpos * 0.02).b);

  float sunK = mix(1.0, 0.95, uNight);   // the moon is a weaker key light than the sun
  vec3 lit = albedo * (hemi * 0.95 + uSunColor * diff * shade * 0.75 * sunK)
           + albedo * uSunColor * through * shade * 0.85 * sunK
           + uSunColor * sheen * shade * 0.16 * sunK;
  lit *= ao * uGrassTint;
  lit *= 1.0 + 0.1 * gust * t;

  vColor = applyFog(lit, world);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const grassFrag = /* glsl */ `
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

export const terrainVert = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vWorld = position;
  vNormal = normal;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}
`;

export const terrainFrag = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
uniform vec3 uGrassTint;
${wind}
${fog}

void main() {
  vec2 p = vWorld.xz;
  float d = length(vWorld - cameraPosition);

  // the far canopy: patches of gold and green, moving gusts, fine streaks
  float gold = clamp(texture2D(uNoise, p * 0.0045).g * 1.6 - 0.5, 0.0, 1.0);
  vec3 coat = mix(vec3(0.52, 0.53, 0.27), vec3(0.78, 0.62, 0.27), gold);
  coat = mix(coat, vec3(dot(coat, vec3(0.299, 0.587, 0.114))) * vec3(0.8, 0.94, 0.96) + vec3(0.0, 0.012, 0.02), uNight * 0.75);
  coat *= 0.86 + 0.32 * gustAt(p);
  coat *= 0.92 + 0.16 * texture2D(uNoise, p * vec2(0.09, 0.05)).b;

  // under the near grass the ground is dark soil
  vec3 col = mix(vec3(0.15, 0.145, 0.1), coat, smoothstep(5.0, 40.0, d));

  float diff = 0.45 + 0.55 * max(dot(normalize(vNormal), uSunDir), -0.2) + 0.1;
  col *= diff * uGrassTint * cloudShade(p);
  col = mix(col, vec3(0.42, 0.49, 0.38), smoothstep(60.0, 360.0, d) * 0.88);  // distant sage #777D68: ridges go grey-green before the haze takes them
  col *= mix(1.0, 0.7, uNight);
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
}
`;

export const rangeVert = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vWorld = position;
  vNormal = normal;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}
`;

/** The Himalaya: forest below the treeline, rock and strata above it, snow that settles on the gentler ground and
 *  slides off the steep faces, light from the sun's side, and a haze that thickens with distance and pools in the valleys. */
export const rangeFrag = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
${wind}
${fog}

void main() {
  vec3 N = normalize(vNormal);
  float y = vWorld.y;
  vec3 V = cameraPosition - vWorld;
  float d = length(V);

  float broad = texture2D(uNoise, vWorld.xz * 0.0014 + vec2(0.3, 0.1)).g;
  float strata = texture2D(uNoise, vec2(vWorld.x * 0.004 + vWorld.z * 0.0025, y * 0.014)).b;
  float grain = texture2D(uNoise, vWorld.xz * 0.011 + vec2(y * 0.003, 0.2)).b;
  float upness = N.y;

  // vegetation: pine in the folds, moss and olive on the open slopes, thinning out at the treeline
  float treeLine = 75.0 + (broad - 0.5) * 60.0;
  float forest = (1.0 - smoothstep(treeLine - 35.0, treeLine + 25.0, y)) * smoothstep(0.5, 0.78, upness + (grain - 0.5) * 0.2);
  vec3 pine = vec3(0.07, 0.19, 0.16);
  vec3 moss = vec3(0.24, 0.37, 0.24);
  vec3 veg = mix(pine, moss, smoothstep(0.35, 0.7, grain) * 0.8 + smoothstep(0.7, 0.9, upness) * 0.3);

  // rock: warm grey with darker strata bands and a rusty stain
  vec3 rock = mix(vec3(0.27, 0.28, 0.32), vec3(0.46, 0.45, 0.46), smoothstep(0.3, 0.75, strata)) * (0.82 + 0.3 * grain);
  vec3 alpine = mix(rock, vec3(0.34, 0.4, 0.28), smoothstep(treeLine + 60.0, treeLine, y) * 0.7);   // tundra grass below the bare rock
  vec3 albedo = mix(alpine, veg, forest);

  // snow: above a ragged line, on ground that is not too steep; steep faces stay bare rock streaked with it
  float snowLine = 85.0 + (broad - 0.5) * 80.0 + (strata - 0.5) * 36.0;
  float hold = smoothstep(0.08, 0.34, upness + (grain - 0.5) * 0.2 + (broad - 0.5) * 0.1);
  float sn = smoothstep(snowLine, snowLine + 45.0, y) * hold;
  sn = max(sn, smoothstep(snowLine + 20.0, snowLine + 100.0, y) * smoothstep(0.15, 0.4, upness) * 0.6);   // couloirs and ice high up
  vec3 snowCol = vec3(0.95, 0.96, 0.97);
  albedo = mix(albedo, snowCol, sn);

  // light: warm sun on the faces turned toward it, cool sky in the shade
  float ndl = dot(N, uSunDir);
  float diff = smoothstep(-0.3, 0.8, ndl);
  vec3 sky = mix(vec3(0.3, 0.38, 0.5), uFogColor * 0.8, 0.45);
  vec3 lit = albedo * (sky * (0.55 + 0.35 * N.y) + mix(vec3(0.0), uSunColor, diff) * 0.62);
  lit *= 0.85 + 0.25 * smoothstep(0.0, 1.0, grain);
  lit *= 1.0 + 0.3 * sn;
  // a thin rim of warm light along the crests, where the surface turns away from the camera
  float rim = pow(1.0 - clamp(abs(dot(N, normalize(V))), 0.0, 1.0), 3.0) * smoothstep(0.0, 0.5, ndl + 0.3);
  lit += uSunColor * rim * 0.12 * (0.4 + sn);
  lit = mix(lit, lit * vec3(0.3, 0.36, 0.52) + snowCol * sn * vec3(0.08, 0.11, 0.2), uNight * 0.85);   // moonlit: cold and dim, snow still the brightest thing

  // atmosphere: cooler, paler and bluer with distance, thinner on the high ground, pooled in the valleys
  float f = 1.0 - exp(-pow(d * 0.0008, 1.4));
  f *= mix(1.0, 0.62, smoothstep(40.0, 260.0, y));
  f = clamp(f + (1.0 - smoothstep(0.0, 70.0, y)) * 0.16, 0.0, 0.9);
  vec3 farCol = mix(uFogColor, vec3(0.55, 0.66, 0.8) * (1.0 - uNight * 0.85) + uFogColor * uNight * 0.85, 0.9 * smoothstep(700.0, 1500.0, d));
  vec3 col = mix(lit, farCol, f);
  col = mix(col, uFogColor, (1.0 - smoothstep(0.0, 60.0, y)) * 0.5);   // the foot melts into the haze above the meadow
  gl_FragColor = vec4(grade(col), 1.0);
}
`;

export const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 clip = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = clip.xyww;              // pinned to the far plane
}
`;

export const skyFrag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uSkyZenith;
uniform float uSpace;     // 0 = the meadow's sky, 1 = deep space (the story)
${wind}
${fog}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  float s = max(dot(dir, uSunDir), 0.0);

  // gradient: haze at the horizon (identical to the fog, so ridges dissolve into it) up to the zenith
  vec3 col = mix(uFogColor, uSkyZenith, pow(smoothstep(0.0, 0.62, h), 0.8));
  // the sun's broad glow by day; a tight halo and a faint wash around the moon at night
  col += uSunColor * mix(pow(s, 5.0) * 0.1 + pow(s, 40.0) * 0.3, pow(s, 70.0) * 0.1 + pow(s, 500.0) * 0.32, uNight);

  // clouds: stretched toward the horizon, lit warmly on the sun side
  vec2 uv = dir.xz / (max(h, 0.0) + 0.16);
  float n = texture2D(uNoise, uv * 0.07 + vec2(uTime * 0.0016, 0.0)).r * 0.6
          + texture2D(uNoise, uv * 0.19 + vec2(uTime * 0.0032, 0.31)).b * 0.4;
  float cover = smoothstep(0.5, 0.72, n) * smoothstep(0.015, 0.2, h);
  vec3 lit = mix(uFogColor * 0.92, mix(vec3(0.98, 0.94, 0.84), vec3(0.36, 0.44, 0.6), uNight), 0.55 + 0.45 * pow(s, 2.0));
  vec3 shade = mix(uSkyZenith, uFogColor, 0.35) * 0.95;
  float body = smoothstep(0.5, 0.8, n);
  cover *= 1.0 - uSpace;
  col = mix(col, mix(lit, shade, body * 0.55), cover * 0.82);
  // the story: the sky drains to a deep blue-black, darkest overhead, with the faintest glow left near the horizon
  col = mix(col, vec3(0.004, 0.007, 0.02) + vec3(0.008, 0.012, 0.03) * (1.0 - smoothstep(0.0, 0.7, h)), uSpace);

  // stars: two jittered grids on the sky sphere, drifting at different rates for a little depth, twinkling,
  // hidden by cloud and by the haze at the horizon. In space there are more of them and they are brighter.
  float dark = max(uNight, uSpace);
  if (dark > 0.01 && h > 0.0) {
    // slow drift: the whole sky turns about the vertical, a little faster for the near layer
    float turn = uTime * 0.0016 * uSpace;
    vec3 sd = vec3(dir.x * cos(turn) - dir.z * sin(turn), dir.y, dir.x * sin(turn) + dir.z * cos(turn));
    float az = atan(sd.z, sd.x);
    float starSum = 0.0;
    for (int k = 0; k < 2; k++) {
      float scale = k == 0 ? 200.0 : 85.0;
      float limit = k == 0 ? mix(0.99, 0.972, uSpace) : mix(0.997, 0.99, uSpace);
      // near the zenith azimuth bunches up and stars smear into dashes, so overhead the sky is projected flat instead
      vec2 sp = vec2(az + (k == 0 ? 0.0 : uTime * 0.0018 * uSpace), sd.y) * scale;
      vec2 flat2 = sd.xz / max(sd.y, 0.2) * scale * 0.78;
      sp = mix(sp, flat2, step(0.7, sd.y)) + float(k) * 40.0;
      vec2 cell = floor(sp);
      vec2 jit = vec2(hash21(cell + 17.0), hash21(cell + 31.0)) - 0.5;
      float r = hash21(cell);
      float size = k == 0 ? 0.2 : 0.3;
      float star = step(limit, r) * smoothstep(size, 0.0, length(fract(sp) - 0.5 - jit * 0.6)) * (0.4 + 0.6 * hash21(cell + 5.0));
      star *= 0.78 + 0.22 * sin(uTime * 1.7 + r * 60.0);
      starSum += star * (k == 0 ? 1.0 : 1.4);
    }
    vec3 tint = mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.93, 0.82), step(0.5, hash21(floor(vec2(az, dir.y) * 60.0))));
    col += tint * starSum * smoothstep(0.04, 0.4, h) * (1.0 - cover) * dark;
  }

  col = mix(col, grade(col), 0.5);
  // the sun, or the moon: a crisp, antialiased limb; irregular dark maria and fine cratering in disc coordinates;
  // a hint of limb darkening; neutral warm white, never blue. Drawn after grading so it stays bright, and thin cloud dims it.
  // Measured on the image plane, not the sky sphere: a perspective camera stretches a sphere-circle into an egg off-axis.
  vec3 dv = mat3(viewMatrix) * dir;
  vec3 mv = mat3(viewMatrix) * uSunDir;
  float R = mix(0.0374, 0.026, uNight);
  vec2 mp = vec2(0.0);
  float limb = 0.0;
  if (dv.z < -0.01 && mv.z < -0.01) {
    vec2 off = dv.xy / -dv.z - mv.xy / -mv.z;
    float d = length(off);
    float fw = fwidth(d);
    limb = smoothstep(R + fw, R - fw, d);
    mp = off / R;                                                       // -1..1 across the disc
  }
  float maria = smoothstep(0.46, 0.62, texture2D(uNoise, mp * 0.1 + vec2(0.31, 0.62)).g * 0.65 + texture2D(uNoise, mp * 0.23 + 0.5).r * 0.35);
  float craters = texture2D(uNoise, mp * 0.34 + vec2(0.17, 0.4)).b;
  float tone = (1.0 - 0.3 * maria) * (0.94 + 0.2 * craters) * mix(0.82, 1.0, sqrt(max(1.0 - dot(mp, mp), 0.0)));
  vec3 disc = mix(vec3(1.0, 0.93, 0.78), vec3(1.0, 0.97, 0.9) * tone, uNight);
  col = mix(col, disc, limb * (1.0 - cover * 0.85) * (1.0 - uSpace));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;  // dither: no banding in the gradient
  gl_FragColor = vec4(col, 1.0);
}
`;

/** A bird: eight vertices (two wings and a body) flapped in the shader. Wing tips lag the roots, and now and then it glides. */
export const birdVert = /* glsl */ `
attribute vec3 iStart;    // where this bird entered the sky
attribute vec3 iVel;      // metres per second
attribute vec4 iBird;     // spawn time, wingspan (0 = unused), seed, flaps per second
${wind}
${fog}

varying vec3 vColor;

void main() {
  float age = uTime - iBird.x;
  float seed = iBird.z;
  float a = abs(position.x);              // 0 at the body, 1 at a wing tip

  // path: a straight crossing with a lazy undulation in height and a slow drift in depth
  float p1 = age * 0.55 + seed * 6.28;
  float p2 = age * 0.21 + seed * 3.0;
  float p3 = age * 0.17 + seed * 5.0;
  vec3 c = iStart + iVel * age;
  // wingspan grows partway with distance, so far flocks stay readable instead of shrinking to specks
  float span = iBird.y * pow(max(8.0 - c.z, 20.0) / 110.0, 0.6);
  c.y += sin(p1) * 1.4 + sin(p2) * 2.2;
  c.z += sin(p3) * 6.0;
  vec3 vel = iVel + vec3(0.0, cos(p1) * 0.77 + cos(p2) * 0.46, cos(p3) * 1.02);
  vec3 fwd = normalize(vel);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  // Banked toward the viewer, as a soaring bird is: seen exactly side-on a wing is a hair-thin line, banked it shows its shape
  vec3 toCam = normalize(cameraPosition - c);
  vec3 side = normalize(toCam - fwd * dot(toCam, fwd));
  float bank = 0.5 + 0.2 * sin(age * 0.4 + seed * 7.0);
  up = normalize(up * cos(bank) + side * sin(bank));
  right = normalize(cross(fwd, up));

  // wings: the beat travels out along the wing, so tips lag the roots; glides come and go
  float flapping = smoothstep(-0.3, 0.5, sin(age * 0.7 + seed * 9.0));
  float flap = sin(uTime * iBird.w * 6.2832 + seed * 6.2832 - a * 1.3) * (0.15 + 0.85 * flapping);
  vec3 local;
  local.x = position.x * span * 0.5;
  local.y = (flap * 0.55 * a * (0.4 + 0.6 * a) + 0.1 * a) * span * 0.5;                      // beat plus a slight upward dihedral
  local.z = position.z * 1.3 * span * 0.5;  // sweep and taper are in the geometry
  vec3 world = c + right * local.x + up * local.y + fwd * local.z;

  // a dark silhouette, softened a little toward the haze colour so it sits in the air rather than on the glass
  vColor = applyFog(mix(vec3(0.11, 0.1, 0.09), uFogColor, 0.12), world);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const birdFrag = /* glsl */ `
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;
