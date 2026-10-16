// Optimization — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports, pure functions).
//
// House style: convexity of a function is *tested*, never asserted. A seeded chord test on the graph (random pairs of
// points, is the midpoint below the chord?) is run on whatever function the reader is looking at, so that a
// non-convex variant visibly fails; conjugates, envelopes and subdifferentials are computed by brute force on a grid.
export * from './ch02.shared.js';
import { mulberry, clamp } from './ch02.shared.js';

/** Central-difference derivatives of a function of one variable. */
export const d1 = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
export const d2 = (f, x, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);

/** Gradient and Hessian of f(x, y) by central differences. */
export function grad2(f, x, y, h = 1e-5) {
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}
export function hess2(f, x, y, h = 1e-3) {
  const f0 = f(x, y);
  const a = (f(x + h, y) - 2 * f0 + f(x - h, y)) / (h * h), d = (f(x, y + h) - 2 * f0 + f(x, y - h)) / (h * h);
  const b = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
  return [[a, b], [b, d]];
}
/** Eigenvalues l1 ≤ l2 and unit eigenvectors of a symmetric 2×2 matrix. */
export function eigs2([[a, b], [, d]]) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  let v2 = [1, 0];
  if (r > 1e-14) { const th = 0.5 * Math.atan2(2 * b, a - d); v2 = [Math.cos(th), Math.sin(th)]; }
  return { l1: m - r, l2: m + r, v1: [-v2[1], v2[0]], v2 };
}

/**
 * Chord test of a function of one variable on [a, b]: random pairs (x, y) and weights θ; counts the chords with
 * f(θx + (1-θ)y) > θ f(x) + (1-θ) f(y) + tol and returns the worst excess (≥ 0) with its chord.
 */
export function chordTest1(f, a, b, { n = 1500, seed = 11, tol = 1e-9 } = {}) {
  const r = mulberry(seed);
  let bad = 0, tested = 0, worst = 0, wc = null;
  for (let k = 0; k < n; k++) {
    const x = a + (b - a) * r(), y = a + (b - a) * r(), t = 0.15 + 0.7 * r();
    const fx = f(x), fy = f(y), m = f(t * x + (1 - t) * y);
    if (![fx, fy, m].every(Number.isFinite)) continue;
    tested++;
    const ex = m - (t * fx + (1 - t) * fy);
    if (ex > tol * (1 + Math.abs(m))) { bad++; if (ex > worst) { worst = ex; wc = [x, y, t]; } }
  }
  return { bad, tested, worst, chord: wc };
}

/** Chord test of a function f(x, y) on a box: random segments, midpoint and quarter points below the chord. */
export function chordTest2(f, box, { n = 1500, seed = 5, tol = 1e-9 } = {}) {
  const r = mulberry(seed);
  let bad = 0, tested = 0, worst = 0;
  for (let k = 0; k < n; k++) {
    const p = [box[0] + (box[2] - box[0]) * r(), box[1] + (box[3] - box[1]) * r()];
    const q = [box[0] + (box[2] - box[0]) * r(), box[1] + (box[3] - box[1]) * r()], t = 0.15 + 0.7 * r();
    const fp = f(p[0], p[1]), fq = f(q[0], q[1]), m = f(t * p[0] + (1 - t) * q[0], t * p[1] + (1 - t) * q[1]);
    if (![fp, fq, m].every(Number.isFinite)) continue;
    tested++;
    const ex = m - (t * fp + (1 - t) * fq);
    if (ex > tol * (1 + Math.abs(m))) { bad++; if (ex > worst) worst = ex; }
  }
  return { bad, tested, worst };
}

/** Lower convex envelope of sampled points (xs increasing): values at the sample abscissae (lower hull, interpolated). */
export function envelope(xs, ys) {
  const idx = [];
  for (let i = 0; i < xs.length; i++) {
    if (!Number.isFinite(ys[i])) continue;
    while (idx.length >= 2) {
      const a = idx[idx.length - 2], b = idx[idx.length - 1];
      if ((xs[b] - xs[a]) * (ys[i] - ys[a]) - (ys[b] - ys[a]) * (xs[i] - xs[a]) <= 0) idx.pop(); else break;
    }
    idx.push(i);
  }
  const out = new Array(xs.length).fill(Infinity);
  for (let k = 0; k < idx.length - 1; k++) {
    const a = idx[k], b = idx[k + 1];
    for (let i = a; i <= b; i++) out[i] = ys[a] + ((ys[b] - ys[a]) * (xs[i] - xs[a])) / (xs[b] - xs[a] || 1);
  }
  if (idx.length === 1) out[idx[0]] = ys[idx[0]];
  return out;
}

/**
 * Discrete Legendre–Fenchel transform of the samples (xs, fs): returns {ys, conj} with
 * conj[j] = max_i (ys[j] xs[i] − fs[i]) and arg[j] the maximizing index (an end index means "sup not attained inside").
 */
export function conjugateOnGrid(xs, fs, ys) {
  const conj = new Array(ys.length), arg = new Array(ys.length);
  for (let j = 0; j < ys.length; j++) {
    let best = -Infinity, bi = 0;
    for (let i = 0; i < xs.length; i++) {
      const val = ys[j] * xs[i] - fs[i];
      if (val > best) { best = val; bi = i; }
    }
    conj[j] = best; arg[j] = bi;
  }
  return { conj, arg };
}

export const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/** Piecewise-linear function through knots [[x, y], …] (x increasing), extended flat beyond the ends. */
export function pwl(knots) {
  const K = knots.slice().sort((p, q) => p[0] - q[0]);
  return (x) => {
    if (x <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      if (x <= K[i][0]) { const t = (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0] || 1); return K[i - 1][1] + t * (K[i][1] - K[i - 1][1]); }
    }
    return K[K.length - 1][1];
  };
}

/** Memo with one slot. */
export const memo = () => { let k = null, val; return (key, f) => { if (key !== k) { val = f(); k = key; } return val; }; };
export const rgbA = (v, name, a) => [...v.rgb(name).slice(0, 3), a];

/** Gradient descent with backtracking (Armijo) from (x, y); returns the final point and the path (every 4th step). */
export function descend(f, x, y, { iters = 500, box = null } = {}) {
  const path = [[x, y]];
  let fx = f(x, y);
  for (let k = 0; k < iters; k++) {
    const g = grad2(f, x, y), gn = Math.hypot(g[0], g[1]);
    if (gn < 1e-7) break;
    let t = 1;
    while (t > 1e-12) {
      let nx = x - t * g[0], ny = y - t * g[1];
      if (box) { nx = clamp(nx, box[0], box[2]); ny = clamp(ny, box[1], box[3]); }
      const fn = f(nx, ny);
      if (fn <= fx - 0.3 * t * gn * gn) { x = nx; y = ny; fx = fn; break; }
      t *= 0.5;
    }
    if (t <= 1e-12) break;
    if (k % 4 === 0) path.push([x, y]);
  }
  path.push([x, y]);
  return { x, y, f: fx, path };
}

/** n contour levels spread over the (sampled) range of f on a window, spaced by quantiles so crowded regions get more lines. */
export function levelsOf(f, x0, x1, y0, y1, n = 12) {
  const vals = [];
  for (let j = 0; j <= 24; j++) for (let i = 0; i <= 32; i++) { const z = f(x0 + ((x1 - x0) * i) / 32, y0 + ((y1 - y0) * j) / 24); if (Number.isFinite(z)) vals.push(z); }
  vals.sort((a, b) => a - b);
  if (!vals.length) return [];
  const out = [];
  for (let k = 1; k <= n; k++) out.push(vals[Math.min(vals.length - 1, Math.floor((vals.length * k) / (n + 1)))]);
  return [...new Set(out)];
}
