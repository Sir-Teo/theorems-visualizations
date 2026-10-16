// Psychology & Perception — Chapter 4: Early vision (helpers shared by ch04.js, ch04-b.js and ch04-c.js)
export * from './ch03.shared.js';

/** Grey level g in [0, 1] as an [r, g, b] array in 0–255. */
export const grey = (g) => { const k = Math.round(255 * Math.min(1, Math.max(0, g))); return [k, k, k]; };
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth01 = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const logistic = (x) => 1 / (1 + Math.exp(-x));

/** Gaussian blur of a 1-D array (edge values replicated), sigma in samples. */
export function blur1(a, sigma) {
  const n = a.length; if (sigma < 0.05) return a.slice();
  const R = Math.ceil(3.5 * sigma), k = []; let s = 0;
  for (let i = -R; i <= R; i++) { const w = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(w); s += w; }
  const out = new Array(n);
  for (let i = 0; i < n; i++) { let acc = 0; for (let j = -R; j <= R; j++) acc += k[j + R] * a[Math.min(n - 1, Math.max(0, i + j))]; out[i] = acc / s; }
  return out;
}
/** Difference of Gaussians (centre − ws·surround), both of unit area, so a uniform input gives (1 − ws)·input. */
export function dog1(a, sc, ss, ws) {
  const c = blur1(a, sc), s = blur1(a, ss);
  return c.map((x, i) => x - ws * s[i]);
}
/** Separable Gaussian blur of an n×m image stored row-major in a Float64Array (edge replicated); sigma in pixels. */
export function blur2(img, n, m, sigma) {
  const R = Math.max(1, Math.ceil(3.5 * sigma)), k = new Float64Array(2 * R + 1); let s = 0;
  for (let i = -R; i <= R; i++) { k[i + R] = Math.exp(-(i * i) / (2 * sigma * sigma)); s += k[i + R]; }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  const tmp = new Float64Array(n * m), out = new Float64Array(n * m);
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) { let acc = 0; for (let j = -R; j <= R; j++) acc += k[j + R] * img[y * n + Math.min(n - 1, Math.max(0, x + j))]; tmp[y * n + x] = acc; }
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) { let acc = 0; for (let j = -R; j <= R; j++) acc += k[j + R] * tmp[Math.min(m - 1, Math.max(0, y + j)) * n + x]; out[y * n + x] = acc; }
  return out;
}

/**
 * STYLISED photoreceptor density profiles (per mm², along the temporal retina, eccentricity e in degrees).
 * The anchors are the commonly quoted features of Curcio et al. (1990): peak cone density about 2·10^5 per mm² at the foveal centre
 * falling steeply within a degree; a rod-free zone about 1.25° across; rods rising to a peak of order 1.5·10^5 per mm² at 15–20°
 * and declining toward the far periphery. The curve shapes between these anchors are drawn by hand: it is a model, not the data.
 */
export function coneDensity(e) { e = Math.abs(e); return 4500 + 195000 * Math.exp(-e / 0.42) * (1 + 0.0 * e); }
export function rodDensity(e) {
  e = Math.abs(e); if (e < 0.625) return 0;
  const rise = 1 - Math.exp(-(e - 0.625) / 3.2), fall = e < 18 ? 1 : Math.exp(-(e - 18) / 70);
  return 150000 * rise * fall;
}
/** Blind spot (optic disc) in the visual field of the right eye: centre (deg), half-width and half-height (deg). Rough textbook values. */
export const BLIND = { x: 15.5, y: -1.5, rx: 2.75, ry: 3.75 };
