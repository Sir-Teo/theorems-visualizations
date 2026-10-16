// Probability: Theory and Examples (Durrett) — Chapter 5, sections 5.6-5.8: helpers shared by ch05-z.js and ch05-z2.js.
//
// Recurring pictures: small finite chains (rings with chords, cyclic-class chains) drawn on a circle, exact n-step
// laws and total variation, and the AR(1) chain X' = aX + N(0,1) as the running example of a Harris chain (with an
// explicit minorization on an interval A and its discretization to a K x K matrix, split into the kernels v and pbar).

export { clampN } from './ch04-z.shared.js';

/** Standard normal CDF (erf by Taylor series for |z| < 3, Laplace continued fraction for the tails; ~1e-15). */
export function PHI(x) {
  if (x === Infinity) return 1; if (x === -Infinity) return 0;
  const z = Math.abs(x) / Math.SQRT2; let r;
  if (z < 3) { let t = z, sum = z; for (let n = 1; n < 80; n++) { t *= -z * z / n; sum += t / (2 * n + 1); } r = 0.5 * (1 - (2 / Math.sqrt(Math.PI)) * sum); }
  else { let f = 0; for (let k = 60; k >= 1; k--) f = k / 2 / (z + f); r = 0.5 * Math.exp(-z * z) / Math.sqrt(Math.PI) / (z + f); }
  return x >= 0 ? 1 - r : r;
}

export const CLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
export const phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
export const fx = (x, d = 3) => (!isFinite(x) ? '∞' : x.toFixed(d).replace('-', '−'));

// ------------------------------------------------------------------ finite chains
/** Return times of state s: the n <= N with a path of length n from s back to s (adj: list of out-neighbour lists). */
export function retTimes(adj, s, N) {
  const n = adj.length; let cur = new Uint8Array(n); cur[s] = 1; const out = [];
  for (let t = 1; t <= N; t++) {
    const nx = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (cur[i]) for (const j of adj[i]) nx[j] = 1;
    cur = nx; if (cur[s]) out.push(t);
  }
  return out;
}
export const gcdAll = (xs) => xs.reduce((g, x) => gcd(g, x), 0);
/** Ring 0->1->...->L-1->0 with the chord M-1 -> 0 (a second cycle of length M) and optional self-loop at 0. */
export function ringChord(L, M, loop) {
  const adj = Array.from({ length: L }, (_, i) => [(i + 1) % L]);
  if (M < L) adj[M - 1].push(0);
  if (loop) adj[0].push(0);
  return adj;
}
export const circlePos = (n, r = 1, rot = Math.PI / 2) => Array.from({ length: n }, (_, i) => [r * Math.cos(rot - (2 * Math.PI * i) / n), r * Math.sin(rot - (2 * Math.PI * i) / n)]);
/** Draw a directed graph on a stage (data coordinates, equal aspect). */
export function drawGraph(s, pos, adj, { colors = [], rad = 0.12, hl = -1, label = true, edgeColor = 'faint', edgeW = 1.4 } = {}) {
  adj.forEach((nb, i) => nb.forEach((j) => {
    const [x1, y1] = pos[i], [x2, y2] = pos[j];
    if (i === j) { s.circle(x1 + 0.16 * Math.sign(x1 || 1), y1 + 0.16 * Math.sign(y1 || 1), 0.1, { color: edgeColor, width: edgeW }); return; }
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    s.arrow(x1 + ux * rad, y1 + uy * rad, x2 - ux * rad, y2 - uy * rad, { color: edgeColor, width: edgeW, head: 8 });
  }));
  pos.forEach(([x, y], i) => {
    const c = colors[i] || 'accent';
    s.circle(x, y, rad, { fill: c, fillAlpha: i === hl ? 0.85 : 0.3, color: i === hl ? 'ink' : c, width: i === hl ? 2.4 : 1.6 });
    if (label) s.text(String(i), x, y, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
  });
}
/** Chain with cyclic classes: d classes of `per` states (state i has class i mod d), edges only class c -> c+1, plus an optional extra edge. */
export function cyclicChain(d, per, rng, extra = false) {
  const n = d * per, adj = Array.from({ length: n }, () => new Set());
  for (let c = 0; c < d; c++) for (let k = 0; k < per; k++) {
    const i = c + d * k, nc = (c + 1) % d;
    adj[i].add(nc + d * k); adj[i].add(nc + d * ((k + 1) % per));
    if (per > 2 && rng() < 0.5) adj[i].add(nc + d * Math.floor(rng() * per));
  }
  if (extra) { if (d > 2) adj[0].add(2); else adj[0].add(0); }
  const A = adj.map((s) => [...s].sort((a, b) => a - b));
  const P = A.map((nb) => { const row = new Array(n).fill(0); const w = nb.map(() => 0.3 + rng()); const tot = w.reduce((a, b) => a + b, 0); nb.forEach((j, q) => { row[j] = w[q] / tot; }); return row; });
  return { n, adj: A, P, cls: Array.from({ length: n }, (_, i) => i % d) };
}
export const adjOfP = (P) => P.map((row) => row.flatMap((p, j) => (p > 0 ? [j] : [])));
export const vecP = (mu, P) => { const n = mu.length, out = new Array(n).fill(0); for (let i = 0; i < n; i++) if (mu[i]) for (let j = 0; j < n; j++) out[j] += mu[i] * P[i][j]; return out; };
export const matMulS = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
export const tvd = (p, q) => 0.5 * p.reduce((s, x, i) => s + Math.abs(x - q[i]), 0);
/** Stationary distribution of an irreducible finite chain (power iteration on the lazy chain, which is aperiodic). */
export function stationary(P, iters = 4000) {
  const n = P.length; let mu = new Array(n).fill(1 / n);
  for (let t = 0; t < iters; t++) { const nx = vecP(mu, P); mu = mu.map((m, i) => 0.5 * (m + nx[i])); }
  return mu;
}
export function stepFrom(P, i, rng) { const u = rng(); let c = 0; const row = P[i]; for (let j = 0; j < row.length; j++) { c += row[j]; if (u < c) return j; } return row.length - 1; }
/** Shortest-path distance from s (breadth-first) in a graph given by out-neighbour lists. */
export function bfs(adj, s) { const d = new Array(adj.length).fill(-1); d[s] = 0; const q = [s]; for (let h = 0; h < q.length; h++) for (const j of adj[q[h]]) if (d[j] < 0) { d[j] = d[q[h]] + 1; q.push(j); } return d; }
/** Reflecting walk on {0,1,2,...}: 0 -> 1, i -> i+1 w.p. q, i -> i-1 w.p. 1-q. Returns the path of length n. */
export function reflWalk(q, n, rng) { const p = new Int32Array(n + 1); let x = 0; for (let t = 1; t <= n; t++) { x = x === 0 ? 1 : rng() < q ? x + 1 : x - 1; p[t] = x; } return p; }

// ------------------------------------------------------------------ the AR(1) Harris chain X' = aX + N(0,1)
/** Minorization p(x,y) >= eps nu(y) for x in [lo,hi]: nu(y) ∝ min_x phi(y - a x) = phi(max distance from y to the image interval). */
export function minor(a, lo, hi) {
  const u = a * lo, w = a * hi, ymin = Math.min(u, w), ymax = Math.max(u, w);
  const m = (y) => phi(Math.max(Math.abs(y - ymin), Math.abs(y - ymax)));
  const Y0 = -14, Y1 = 14, N = 2800, h = (Y1 - Y0) / N, cdf = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) cdf[i + 1] = cdf[i] + m(Y0 + (i + 0.5) * h) * h;
  const eps = cdf[N];
  const inv = (u01) => { const t = u01 * eps; let l = 0, r = N; while (r - l > 1) { const mid = (l + r) >> 1; if (cdf[mid] <= t) l = mid; else r = mid; } return Y0 + (l + (t - cdf[l]) / (cdf[l + 1] - cdf[l] || 1)) * h; };
  return { eps, nu: (y) => m(y) / eps, sample: (rng) => inv(rng()), lo, hi, a };
}
/** One step of the AR(1) chain with the regeneration coin: returns [y, regenerated?]. */
export function harrisStep(x, mn, rng) {
  const { a, lo, hi, eps } = mn;
  if (x >= lo && x <= hi) {
    if (rng() < eps) return [mn.sample(rng), true];
    for (;;) { const y = a * x + rng.normal(); if (rng() < 1 - (eps * mn.nu(y)) / phi(y - a * x)) return [y, false]; }
  }
  return [a * x + rng.normal(), false];
}
export const stationaryVar = (a) => 1 / (1 - a * a);

// ---- discretisation on K cells over [-L, L] (tails folded into the end cells)
export function gridAR(a, K = 41, L = 5) {
  const h = (2 * L) / K, xs = Array.from({ length: K }, (_, i) => -L + (i + 0.5) * h);
  const P = xs.map((x) => xs.map((_, j) => {
    const lo = j === 0 ? -Infinity : xs[j] - h / 2, hi = j === K - 1 ? Infinity : xs[j] + h / 2;
    return PHI(hi - a * x) - PHI(lo - a * x);
  }));
  return { K, L, h, xs, P };
}
/** Splitting of the discretized chain with regeneration set A = cells with |x| <= c. v: K x (K+1), pbar: (K+1) x K (state K = alpha). */
export function splitGrid(g, c) {
  const { K, xs, P } = g, inA = xs.map((x) => Math.abs(x) <= c);
  const m = new Array(K).fill(0);
  for (let j = 0; j < K; j++) { let mn = Infinity; for (let i = 0; i < K; i++) if (inA[i]) mn = Math.min(mn, P[i][j]); m[j] = isFinite(mn) ? mn : 0; }
  const eps = m.reduce((a, b) => a + b, 0), nu = m.map((x) => (eps > 0 ? x / eps : 0));
  const V = xs.map((_, i) => { const r = new Array(K + 1).fill(0); if (inA[i]) { r[i] = 1 - eps; r[K] = eps; } else r[i] = 1; return r; });
  const Pb = Array.from({ length: K + 1 }, (_, i) => (i === K ? nu.slice() : inA[i] ? P[i].map((p, j) => (p - eps * nu[j]) / (1 - eps)) : P[i].slice()));
  return { eps, nu, inA, V, Pb };
}
/** Law-level helpers: row vector times matrix for non-square matrices. */
export const vecM = (mu, M) => { const out = new Array(M[0].length).fill(0); for (let i = 0; i < mu.length; i++) if (mu[i]) for (let j = 0; j < out.length; j++) out[j] += mu[i] * M[i][j]; return out; };
export const matVecR = (M, f) => M.map((row) => row.reduce((s, a, j) => s + a * f[j], 0));
export function cdfSample(w, rng) { let u = rng() * w.reduce((a, b) => a + b, 0), j = 0; while (j < w.length - 1 && u >= w[j]) { u -= w[j]; j++; } return j; }
/** TV distance between N(m1,v1) and N(m2,v2) by quadrature. */
export function tvNormal(m1, v1, m2, v2) {
  const s1 = Math.sqrt(v1), s2 = Math.sqrt(v2), lo = Math.min(m1 - 9 * s1, m2 - 9 * s2), hi = Math.max(m1 + 9 * s1, m2 + 9 * s2), n = 3000, h = (hi - lo) / n; let t = 0;
  for (let i = 0; i < n; i++) { const x = lo + (i + 0.5) * h; t += Math.abs(phi((x - m1) / s1) / s1 - phi((x - m2) / s2) / s2) * h; }
  return t / 2;
}
