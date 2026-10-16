// Probability: Theory and Examples (Durrett) — Chapter 5, sections 5.4–5.5: helpers shared by ch05-m.js and ch05-m2.js.
//
// Return probabilities of simple random walks, lattice-walk samplers, small example Markov chains,
// stationary distributions and a node-and-arrow drawing of a chain.

export { clampN, fr, sciT } from './ch03.shared.js';

// ------------------------------------------------------------------ simple random walk on Z^d
const LF = [0];
const lfac = (k) => { while (LF.length <= k) LF.push(LF[LF.length - 1] + Math.log(LF.length)); return LF[k]; };
const u1 = (m) => (m % 2 ? 0 : Math.exp(lfac(m) - 2 * lfac(m / 2) - m * Math.LN2));
const cacheU = new Map();
/** u[m] = P(S_m = 0) for simple random walk on Z^d (d = 1, 2, 3), m = 0..N, exact. */
export function srwU(d, N) {
  const key = `${d}|${N}`;
  if (cacheU.has(key)) return cacheU.get(key);
  const a = new Float64Array(N + 1);
  for (let m = 0; m <= N; m++) a[m] = u1(m);
  let out = a;
  if (d >= 2) { const b = new Float64Array(N + 1); for (let m = 0; m <= N; m++) b[m] = a[m] * a[m]; out = b; }
  if (d === 3) {
    const u2 = out, c = new Float64Array(N + 1);
    for (let n = 0; n <= N; n += 2) {
      let s = 0;
      for (let m = 0; m <= n; m += 2) s += Math.exp(lfac(n) - lfac(m) - lfac(n - m) - n * Math.log(3) + (n - m) * Math.LN2) * a[m] * u2[n - m];
      c[n] = s;
    }
    out = c;
  }
  cacheU.set(key, out);
  return out;
}
/** First-return probabilities f[n] from the renewal equation u = δ + f * u. */
export function renewalF(u) {
  const N = u.length - 1, f = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) { let s = u[n]; for (let k = 1; k < n; k++) s -= f[k] * u[n - k]; f[n] = s; }
  return f;
}

// ------------------------------------------------------------------ lattice walks given as weight lists [dx, dy, dz, p]
export const LATTICE = {
  srw1: { d: 1, label: '$d=1$, symmetric', w: [[1, 0, 0, 0.5], [-1, 0, 0, 0.5]] },
  bias1: { d: 1, label: '$d=1$, drift', w: [[1, 0, 0, 0.6], [-1, 0, 0, 0.4]] },
  srw2: { d: 2, label: '$d=2$, symmetric', w: [[1, 0, 0, 0.25], [-1, 0, 0, 0.25], [0, 1, 0, 0.25], [0, -1, 0, 0.25]] },
  bias2: { d: 2, label: '$d=2$, drift', w: [[1, 0, 0, 0.35], [-1, 0, 0, 0.15], [0, 1, 0, 0.25], [0, -1, 0, 0.25]] },
  srw3: { d: 3, label: '$d=3$, symmetric', w: [[1, 0, 0, 1 / 6], [-1, 0, 0, 1 / 6], [0, 1, 0, 1 / 6], [0, -1, 0, 1 / 6], [0, 0, 1, 1 / 6], [0, 0, -1, 1 / 6]] },
};
export const LATTICE_OPTS = Object.keys(LATTICE).map((k) => ({ value: k, label: LATTICE[k].label }));
/** Characteristic function φ(y) = Σ p e^{i x·y} of a weight list: returns [re, im]. */
export function phiW(w, y1, y2 = 0, y3 = 0) {
  let re = 0, im = 0;
  for (const [a, b, c, p] of w) { const th = a * y1 + b * y2 + c * y3; re += p * Math.cos(th); im += p * Math.sin(th); }
  return [re, im];
}
/** Re 1/(1 − rφ) at y. */
export function reInv(w, r, y1, y2 = 0, y3 = 0) {
  const [a, b] = phiW(w, y1, y2, y3), x = 1 - r * a, y = -r * b;
  return x / (x * x + y * y);
}
/** Cumulative (outside-in) integral of Re 1/(1−rφ) over the shell η<|y|<δ in R^d, using polar quadrature with log-spaced radii.
 *  Returns {rad: ascending radii, tail[i] = ∫_{|y|>rad[i]}, total}. */
export function shellIntegral(w, d, r, { rmin = 1e-6, rmax = 1, nr = 210 } = {}) {
  const dirs = [];
  if (d === 1) dirs.push([1, 0, 0, 2]);
  else if (d === 2) { const K = 48; for (let k = 0; k < K; k++) { const th = ((k + 0.5) * 2 * Math.PI) / K; dirs.push([Math.cos(th), Math.sin(th), 0, (2 * Math.PI) / K]); } }
  else {
    const K = 260, ga = Math.PI * (3 - Math.sqrt(5));
    for (let k = 0; k < K; k++) { const z = 1 - (2 * (k + 0.5)) / K, q = Math.sqrt(1 - z * z); dirs.push([q * Math.cos(ga * k), q * Math.sin(ga * k), z, (4 * Math.PI) / K]); }
  }
  const rad = new Float64Array(nr), shell = new Float64Array(nr), L0 = Math.log(rmin), L1 = Math.log(rmax);
  for (let i = 0; i < nr; i++) {
    const rr = Math.exp(L0 + ((L1 - L0) * (i + 0.5)) / nr), dr = rr * ((L1 - L0) / nr);
    let s = 0;
    for (const [a, b, c, wt] of dirs) s += wt * reInv(w, r, rr * a, rr * b, rr * c);
    rad[i] = rr; shell[i] = s * rr ** (d - 1) * dr;
  }
  const tail = new Float64Array(nr); let acc = 0;
  for (let i = nr - 1; i >= 0; i--) { acc += shell[i]; tail[i] = acc; }
  return { rad, tail, total: acc };
}

// ------------------------------------------------------------------ example Markov chains
const circ = (n, R = 1) => Array.from({ length: n }, (_, i) => [R * Math.cos(Math.PI / 2 - (2 * Math.PI * i) / n), R * Math.sin(Math.PI / 2 - (2 * Math.PI * i) / n)]);
export const CHAINS = {
  gen5: { label: 'generic 5-state', n: 5, pos: circ(5), P: [[.1, .6, .1, .1, .1], [.3, .1, .4, .1, .1], [.1, .1, .1, .6, .1], [.2, .2, .1, .1, .4], [.5, .1, .1, .2, .1]] },
  bd5: { label: 'birth–death on $\\{0..4\\}$', n: 5, pos: circ(5), P: [[.4, .6, 0, 0, 0], [.3, .2, .5, 0, 0], [0, .3, .2, .5, 0], [0, 0, .4, .2, .4], [0, 0, 0, .7, .3]] },
  two: { label: 'transient $\\{0,1\\}$, closed $\\{2,3\\}$, $\\{4\\}$', n: 5, pos: circ(5), P: [[.3, .3, .2, 0, .2], [.4, .1, 0, .3, .2], [0, 0, .3, .7, 0], [0, 0, .6, .4, 0], [0, 0, 0, 0, 1]] },
  per4: { label: 'period-2 chain', n: 4, pos: circ(4), P: [[0, .3, .7, 0], [.6, 0, 0, .4], [.5, 0, 0, .5], [0, .8, .2, 0]] },
  wea3: { label: 'weather 3-state', n: 3, pos: circ(3), P: [[.7, .2, .1], [.3, .4, .3], [.2, .3, .5]] },
};
export const chainOpts = (keys) => keys.map((k) => ({ value: k, label: CHAINS[k].label }));
/** Row-vector times matrix. */
export function muP(mu, P) {
  const n = P.length, out = new Float64Array(n);
  for (let i = 0; i < n; i++) { const m = mu[i]; if (m) for (let j = 0; j < n; j++) out[j] += m * P[i][j]; }
  return out;
}
/** A stationary distribution of a finite chain, by iterating the lazy chain from the uniform law (irreducible: the unique one). */
export function piOf(P, iters = 6000) {
  const n = P.length; let mu = new Float64Array(n).fill(1 / n);
  for (let t = 0; t < iters; t++) { const q = muP(mu, P); for (let i = 0; i < n; i++) mu[i] = 0.5 * (mu[i] + q[i]); }
  return mu;
}
export const cumRows = (P) => P.map((row) => { let c = 0; return Float64Array.from(row, (x) => (c += x)); });
export function step(cum, x, r) { const u = r(), row = cum[x]; let j = 0; while (j < row.length - 1 && row[j] < u) j++; return j; }
/** Path X_0..X_n of the chain. */
export function simPath(cum, x0, n, r) { const X = new Int32Array(n + 1); X[0] = x0; for (let t = 1; t <= n; t++) X[t] = step(cum, X[t - 1], r); return X; }
/** One excursion from x: visit counts to each state at times 1..T (T = first return, cut at cap) and T. */
export function excursion(cum, x, r, cap = 100000) {
  const cnt = new Float64Array(cum.length); let s = x, T = 0;
  do { s = step(cum, s, r); cnt[s]++; T++; } while (s !== x && T < cap);
  return { cnt, T, done: s === x };
}

// ------------------------------------------------------------------ drawing
/** Nodes with arrows between them; width/alpha follow w(i,j) in [0,1]. Returns nothing. */
export function drawChain(v, s, ch, { w, colors, label, nodeR = 15, minLabel = 0.15 } = {}) {
  const n = ch.n, P = ch.P;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    const val = w ? w(i, j) : P[i][j];
    if (!(P[i][j] > 1e-9) && !(val > 1e-9)) continue;
    const [x1, y1] = ch.pos[i], [x2, y2] = ch.pos[j], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const off = 0.07, px = -uy * off, py = ux * off, sh = 0.2;
    s.arrow(x1 + ux * sh + px, y1 + uy * sh + py, x2 - ux * sh + px, y2 - uy * sh + py, { color: 'muted', width: 0.6 + 4.5 * Math.min(1, val), alpha: 0.35 + 0.6 * Math.min(1, val), head: 7 });
    if (P[i][j] >= minLabel) s.text(P[i][j].toFixed(2), (x1 + x2) / 2 + px * 2.6 + ux * (i < j ? -0.06 : 0.06), (y1 + y2) / 2 + py * 2.6 + uy * (i < j ? -0.06 : 0.06), { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = ch.pos[i];
    s.dot(x, y, { r: nodeR, color: colors ? colors[i] : 'accent' });
    s.text(label ? label(i) : String(i), x, y, { size: 12, color: 'panel', align: 'center', baseline: 'middle' });
  }
}
