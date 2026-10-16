// Understanding Machine Learning — Chapter 3: helpers for noisy labels (a distribution over X × Y), risk tables on a grid,
// and exact ERM over grid-aligned rectangles (re-exports everything of the earlier chapters).
//
// A "world" is a distribution of the papaya square d (ch02.shared.js) together with a regression function
// eta(x, y) = P[label = 1 | x, y]. Risks of rectangles are read from a summed-area table over a G × G grid, so the
// true risk of a rectangle (cells counted by their centres) costs O(1) and every simulation can afford thousands of rounds.
import { clamp, inShape, RECT, NONE } from './ch02.shared.js';
export * from './ch02.shared.js';

export const G3 = 60;
const sig = (z) => 1 / (1 + Math.exp(-z));
/** Signed margin of (x, y) inside the shape t: positive inside, negative outside (rect, disc and L only). */
export function margin(t, x, y) {
  if (t.t === 'rect') return Math.min(x - t.x0, t.x1 - x, y - t.y0, t.y1 - y);
  if (t.t === 'disc') return t.r - Math.hypot(x - t.cx, y - t.cy);
  if (t.t === 'L') return Math.max(margin(t.a, x, y), margin(t.b, x, y));
  return -1;
}
/** Regression function P[y = 1 | x] for a target shape t. mode 'flip': every label flipped with probability nu;
 *  mode 'soft': the label is a logistic function of the margin, with a transition width growing with nu. */
export function makeEta(t, mode, nu) {
  if (mode === 'soft') { const w = 0.004 + 0.2 * nu; return (x, y) => sig(margin(t, x, y) / w); }
  return (x, y) => (inShape(t, x, y) ? 1 - nu : nu);
}
/** Draw m labelled points (labels Bernoulli(eta)). */
export function drawNoisy(d, r, m, eta) {
  const X = new Float64Array(m), Y = new Float64Array(m), L = new Uint8Array(m);
  for (let i = 0; i < m; i++) { const p = d.draw(r); X[i] = p[0]; Y[i] = p[1]; L[i] = r() < eta(p[0], p[1]) ? 1 : 0; }
  return { X, Y, L, m };
}
/** Risk table of the 0–1 loss for (d, eta) on a G × G grid. */
export function riskTable(d, eta, G = G3) {
  const wx = new Float64Array(G), wy = new Float64Array(G);
  for (let i = 0; i < G; i++) { wx[i] = d.cx((i + 1) / G) - d.cx(i / G); wy[i] = d.cy((i + 1) / G) - d.cy(i / G); }
  const E = new Float64Array(G * G), W = new Float64Array(G * G), SAT = new Float64Array((G + 1) * (G + 1));
  let base = 0, bayes = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const e = eta((i + 0.5) / G, (j + 0.5) / G), w = wx[i] * wy[j];
    E[i * G + j] = e; W[i * G + j] = w; base += e * w; bayes += Math.min(e, 1 - e) * w;
  }
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) SAT[(i + 1) * (G + 1) + j + 1] = SAT[i * (G + 1) + j + 1] + SAT[(i + 1) * (G + 1) + j] - SAT[i * (G + 1) + j] + (1 - 2 * E[i * G + j]) * W[i * G + j];
  const rng = (lo, hi) => { const a = clamp(Math.ceil(lo * G - 0.5), 0, G), b = clamp(Math.floor(hi * G - 0.5) + 1, 0, G); return [a, Math.max(a, b)]; };
  const rectRisk = (h) => { const [i0, i1] = rng(h.x0, h.x1), [j0, j1] = rng(h.y0, h.y1); const q = G + 1; return base + SAT[i1 * q + j1] - SAT[i0 * q + j1] - SAT[i1 * q + j0] + SAT[i0 * q + j0]; };
  return {
    G, bayes, base, E, W,
    /** True risk (probability of a wrong label) of a shape. */
    risk(h) {
      if (h.t === 'none') return base;
      if (h.t === 'rect') return rectRisk(h);
      let s = 0; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) s += W[i * G + j] * (inShape(h, (i + 0.5) / G, (j + 0.5) / G) ? 1 - E[i * G + j] : E[i * G + j]);
      return s;
    },
    /** Risk of a predictor given as a boolean cell map f(i, j) (cells of the G grid). */
    riskCells(f) { let s = 0; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) s += W[i * G + j] * (f(i, j) ? 1 - E[i * G + j] : E[i * G + j]); return s; },
  };
}
/** Exact ERM over rectangles whose sides lie on a k × k grid (k² cells; corners at multiples of 1/k); also the empty rule.
 *  Returns {h, mist, all: [{h, mist}] for the whole class if wanted}. Cells of the sample are counted once. */
export function gridCounts(S, k, m = S.m) {
  const P = new Int32Array(k * k), N = new Int32Array(k * k);
  for (let i = 0; i < m; i++) { const a = Math.min(k - 1, Math.floor(S.X[i] * k)), b = Math.min(k - 1, Math.floor(S.Y[i] * k)); (S.L[i] ? P : N)[a * k + b]++; }
  return { P, N, k, m };
}
const satOf = (A, k) => { const q = k + 1, T = new Int32Array(q * q); for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) T[(i + 1) * q + j + 1] = T[i * q + j + 1] + T[(i + 1) * q + j] - T[i * q + j] + A[i * k + j]; return T; };
export function gridErm(C) {
  const k = C.k, q = k + 1, TP = satOf(C.P, k), TN = satOf(C.N, k), totP = TP[k * q + k];
  const box = (T, a, b, c, d) => T[(b + 1) * q + d + 1] - T[a * q + d + 1] - T[(b + 1) * q + c] + T[a * q + c];
  let best = totP, bh = NONE;
  for (let a = 0; a < k; a++) for (let b = a; b < k; b++) for (let c = 0; c < k; c++) for (let d = c; d < k; d++) {
    const mist = totP - box(TP, a, b, c, d) + box(TN, a, b, c, d);
    if (mist < best) { best = mist; bh = RECT(a / k, c / k, (b + 1) / k, (d + 1) / k); }
  }
  return { h: bh, mist: best };
}
/** Best grid rectangle for a risk table (the benchmark min over the class), brute force over the class. */
export function bestGridRect(T, k) {
  let best = T.base, bh = NONE;
  for (let a = 0; a < k; a++) for (let b = a + 1; b <= k; b++) for (let c = 0; c < k; c++) for (let d = c + 1; d <= k; d++) {
    const h = RECT(a / k, c / k, b / k, d / k), r = T.risk(h);
    if (r < best - 1e-12) { best = r; bh = h; }
  }
  return { h: bh, risk: best };
}
/** Bin values into {edges, counts} on [lo, hi] (values outside are clipped into the end bins). */
export function bins(vals, lo, hi, n) {
  const edges = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n), counts = new Array(n).fill(0);
  for (const x of vals) counts[clamp(Math.floor(((x - lo) / (hi - lo)) * n), 0, n - 1)]++;
  return { edges, counts };
}
/** Quantile of an array (0 ≤ q ≤ 1). */
export function quantile(a, q) { const s = Array.from(a).sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; }
/** Colour of a point of the papaya square by its probability of being tasty: pink (0) to green (1). */
export function etaRaster(v, s, eta, key, res = 4) {
  const g = v.rgb('green'), p = v.rgb('pink');
  s.raster((x, y) => { const e = eta(x, y); return [p[0] + (g[0] - p[0]) * e, p[1] + (g[1] - p[1]) * e, p[2] + (g[2] - p[2]) * e, 0.1 + 0.3 * Math.abs(2 * e - 1)]; }, { res, key });
}
