// Probability: Theory and Examples (Durrett) — Chapter 2: helpers shared by ch02.js, ch02-b.js, … (plain named exports).
//
// Pictures that recur through the chapter: seeded samplers for the laws Durrett uses as running examples
// (exponential, Pareto, Cauchy, St. Petersburg, geometric), log-spaced sampling of running averages, numerical
// convolution on a grid, histograms drawn against exact densities, and set systems on a four-point space
// (Hasse diagram of the 16 subsets) for the π–λ material.

export const clampN = (x, a, b) => Math.min(b, Math.max(a, x));

/** Status text pinned to a corner of the data area (inside the gutter, unlike s.corner which uses the canvas corner). */
export function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}

/** Composite Simpson rule. */
export function simpson(f, a, b, n = 400) {
  if (a === b) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

export const PHI = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
/** Standard normal distribution function (via erfc from the runtime's math library). */
export const PhiN = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);

// ------------------------------------------------------------------ samplers (r = v.rng(seed))
export const sampleExp = (r, rate = 1) => -Math.log(1 - r()) / rate;
/** Pareto on [1, ∞): P(X > x) = x^(−α). */
export const samplePareto = (r, alpha) => (1 - r()) ** (-1 / alpha);
export const sampleCauchy = (r) => Math.tan(Math.PI * (r() - 0.5));
/** St. Petersburg payoff: P(X = 2^j) = 2^(−j), j ≥ 1. */
export const sampleStPete = (r) => { let j = 1; while (r() < 0.5) j++; return 2 ** j; };
/** Geometric number of trials up to and including the first success. */
export function sampleGeom(r, p) {
  if (p >= 1) return 1;
  return Math.max(1, Math.ceil(Math.log(1 - r()) / Math.log(1 - p)));
}

// ------------------------------------------------------------------ sequences and grids
/** About k log-spaced integers from n0 to n1 (inclusive, increasing, distinct). */
export function logInts(n0, n1, k = 60) {
  const out = []; const a = Math.log(n0), b = Math.log(n1);
  for (let i = 0; i < k; i++) { const n = Math.round(Math.exp(a + ((b - a) * i) / (k - 1))); if (!out.length || n > out[out.length - 1]) out.push(n); }
  return out;
}
/** Running means of xs recorded at log-spaced indices: [[n, mean_n], …]. */
export function runningMeans(xs, scale = (n) => n) {
  const out = []; let s = 0, next = 1;
  for (let i = 0; i < xs.length; i++) {
    s += xs[i];
    if (i + 1 >= next || i === xs.length - 1) { out.push([i + 1, s / scale(i + 1)]); next = Math.max(next + 1, Math.ceil(next * 1.04)); }
  }
  return out;
}
/** Discrete convolution of two densities sampled on grids with the same step dx starting at a0, b0: returns {x0, ys}. */
export function convolveGrid(a, b, dx, a0 = 0, b0 = 0) {
  const n = a.length + b.length - 1, ys = new Float64Array(n);
  for (let i = 0; i < a.length; i++) { const ai = a[i]; if (!ai) continue; for (let j = 0; j < b.length; j++) ys[i + j] += ai * b[j] * dx; }
  return { x0: a0 + b0, ys };
}
/** Histogram densities of xs on fixed edges (values outside are dropped but still count in the total). */
export function densityOn(xs, edges) {
  const n = edges.length - 1, c = new Float64Array(n), lo = edges[0], hi = edges[n], w = (hi - lo) / n;
  for (const x of xs) { const k = Math.floor((x - lo) / w); if (k >= 0 && k < n) c[k]++; }
  return { edges, counts: Array.from(c), density: Array.from(c, (k) => k / (xs.length * w)) };
}
export const linEdges = (lo, hi, n) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);

/** Fraction of xs with |x − c| > eps. */
export const fracOut = (xs, c, eps) => { let k = 0; for (const x of xs) if (Math.abs(x - c) > eps) k++; return k / xs.length; };

// ------------------------------------------------------------------ set systems on Ω = {1,…,n} (subsets as bitmasks)
export const popcount = (m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
/** '{1,3}' style label (∅ and Ω special-cased). */
export function setName(m, n = 4, omega = true) {
  if (m === 0) return '∅';
  if (omega && m === (1 << n) - 1) return 'Ω';
  const el = []; for (let i = 0; i < n; i++) if (m & (1 << i)) el.push(i + 1);
  return el.join('');
}
/** Hasse diagram positions of the subsets of an n-set in a box [0,1]×[0,1] (rank = size, bottom to top). */
export function hasseLayout(n = 4) {
  const N = 1 << n, byRank = Array.from({ length: n + 1 }, () => []);
  for (let m = 0; m < N; m++) byRank[popcount(m)].push(m);
  const pos = new Array(N);
  byRank.forEach((row, k) => row.forEach((m, i) => { pos[m] = [(i + 0.5) / row.length, k / n]; }));
  const edges = [];
  for (let m = 0; m < N; m++) for (let i = 0; i < n; i++) if (!(m & (1 << i))) edges.push([m, m | (1 << i)]);
  return { pos, edges, N };
}
/** Is the collection (Set of masks) closed under intersection? Returns null or a violating pair. */
export function piViolation(C) {
  const a = [...C];
  for (const x of a) for (const y of a) if (!C.has(x & y)) return [x, y];
  return null;
}
/** λ-system violations on a finite Ω (increasing unions are automatic): Ω ∉ C, or A ⊂ B in C with B − A ∉ C. */
export function lambdaViolation(C, full) {
  if (!C.has(full)) return { omega: true };
  const a = [...C];
  for (const A of a) for (const B of a) if ((A & B) === A && !C.has(B & ~A)) return { A, B };
  return null;
}
/** One round of λ-operations: add Ω and every proper difference B − A (A ⊂ B, both present). */
export function lambdaRound(C, full) {
  const out = new Set(C); out.add(full);
  const a = [...C];
  for (const A of a) for (const B of a) if ((A & B) === A) out.add(B & ~A);
  return out;
}
/** Full λ-closure, recording each round. */
export function lambdaRounds(C, full) {
  const rounds = [new Set(C)];
  for (let k = 0; k < 20; k++) { const nx = lambdaRound(rounds[rounds.length - 1], full); if (nx.size === rounds[rounds.length - 1].size) break; rounds.push(nx); }
  return rounds;
}
/** σ-field generated by a collection on Ω = {1..n}: unions of the atoms of the generated partition. */
export function sigmaGen(C, n) {
  const full = (1 << n) - 1, sig = new Map();
  for (let w = 0; w < n; w++) { let key = 0, j = 0; for (const A of C) { if (A & (1 << w)) key |= 1 << j; j++; } sig.set(key, (sig.get(key) || 0) | (1 << w)); }
  const atoms = [...sig.values()], out = new Set();
  for (let s = 0; s < 1 << atoms.length; s++) { let m = 0; atoms.forEach((a, i) => { if (s & (1 << i)) m |= a; }); out.add(m & full); }
  return out;
}
