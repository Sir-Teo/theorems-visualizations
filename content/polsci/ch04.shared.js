// Political Science & Social Choice — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
// Chapter 4 works in a policy space: voters are ideal points (on a line, or in the plane with Euclidean preferences,
// i.e. a voter prefers the point closer to her ideal point), and the questions are about majority-preferred moves.
// The profile and drawing helpers of chapters 1-3 are re-exported.
export * from './ch03.shared.js';
import { range, sum } from './ch03.shared.js';

// ================================================================== numerics
/** Error function (Abramowitz-Stegun 7.1.26, |error| < 1.5e-7). */
export function erf(x) {
  const s = Math.sign(x), t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
export const phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
export const median = (a) => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
export const mean = (a) => sum(a) / a.length;
export const pct = (a, d = 0) => `${(100 * a).toFixed(d)}%`;
/** Minimise a convex function of two variables by nested golden-section searches on the box [lo, hi]^2. */
export function minConvex2(f, x0, x1, y0, y1, it = 46) {
  const g = (x) => {
    let a = y0, b = y1;
    for (let k = 0; k < it; k++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (f(x, m1) < f(x, m2)) b = m2; else a = m1; }
    const y = (a + b) / 2; return [f(x, y), y];
  };
  let a = x0, b = x1;
  for (let k = 0; k < it; k++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (g(m1)[0] < g(m2)[0]) b = m2; else a = m1; }
  const x = (a + b) / 2, [val, y] = g(x);
  return { x, y, val };
}

// ================================================================== Euclidean majority voting in the plane
export const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
/** Number of voters (ideal points V) who strictly prefer point a to point b. */
export function votesFor(V, a, b) { let n = 0; for (const p of V) if (dist2(p, a) < dist2(p, b)) n++; return n; }
/** Does a strict majority of the voters prefer a to b? */
export const beats = (V, a, b) => votesFor(V, a, b) > V.length / 2;
/** Is p a Condorcet winner among the points of a list? */
export const centroid = (V) => [mean(V.map((p) => p[0])), mean(V.map((p) => p[1]))];

/**
 * Median lines of an odd electorate in the plane: for every direction the line orthogonal to it that has at most
 * (n-1)/2 ideal points strictly on each side, found exactly through the pairs of ideal points and, in addition,
 * for `nDir` evenly spaced directions. Each line is { nx, ny, b } (points with nx*x + ny*y = b).
 */
export function medianLines(V, nDir = 120) {
  const n = V.length, k = Math.floor(n / 2), out = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = V[j][0] - V[i][0], dy = V[j][1] - V[i][1], len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const nx = -dy / len, ny = dx / len, b = nx * V[i][0] + ny * V[i][1];
    let L = 0, R = 0;
    for (const r of V) { const s = nx * r[0] + ny * r[1] - b; if (s > 1e-9) L++; else if (s < -1e-9) R++; }
    if (L <= k && R <= k) out.push({ nx, ny, b, pair: [i, j] });
  }
  for (let t = 0; t < nDir; t++) {
    const th = (Math.PI * t) / nDir, nx = Math.cos(th), ny = Math.sin(th);
    const pr = V.map((p) => nx * p[0] + ny * p[1]).sort((a, c) => a - c);
    out.push({ nx, ny, b: pr[k] });
  }
  return out;
}
/** The yolk: smallest circle meeting every median line (odd n). Returns { x, y, r, lines }. r = 0 exactly when a Condorcet winner exists. */
export function yolk(V, nDir = 120) {
  const lines = medianLines(V, nDir), xs = V.map((p) => p[0]), ys = V.map((p) => p[1]);
  const f = (cx, cy) => { let m = 0; for (const l of lines) { const d = Math.abs(l.nx * cx + l.ny * cy - l.b); if (d > m) m = d; } return m; };
  const best = minConvex2(f, Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys));
  return { x: best.x, y: best.y, r: best.val, lines };
}

// ================================================================== a finite tournament on a grid of points
/**
 * The majority tournament of a G x G grid of points covering [lo, hi]^2 under Euclidean voters V: B[x] is a bit set
 * of the points y that x beats by a strict majority.
 */
export function tournament(V, lo, hi, G) {
  const N = G * G, W = (N + 31) >>> 5, n = V.length;
  const pts = new Float64Array(2 * N), d = V.map(() => new Float64Array(N));
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const k = i * G + j, x = lo + ((hi - lo) * i) / (G - 1), y = lo + ((hi - lo) * j) / (G - 1);
    pts[2 * k] = x; pts[2 * k + 1] = y;
    V.forEach((p, v) => { d[v][k] = (p[0] - x) ** 2 + (p[1] - y) ** 2; });
  }
  const B = new Uint32Array(N * W);
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
    if (x === y) continue;
    let c = 0; for (let v = 0; v < n; v++) if (d[v][x] < d[v][y]) c++;
    if (c > n / 2) B[x * W + (y >>> 5)] |= 1 << (y & 31);
  }
  return { N, W, G, B, pts, lo, hi, n, has: (x, y) => (B[x * W + (y >>> 5)] >>> (y & 31)) & 1 };
}
/** Covered flags of a tournament: x covers y when x beats y and x beats everything y beats. Returns { covered: Uint8Array, count of uncovered }. */
export function coverage(T) {
  const { N, W, B } = T, covered = new Uint8Array(N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N && !covered[y]; x++) {
      if (x === y || !T.has(x, y)) continue;
      let sub = true;
      for (let w = 0; w < W; w++) if ((B[y * W + w] & ~B[x * W + w]) !== 0) { sub = false; break; }
      if (sub) covered[y] = 1;
    }
  }
  let unc = 0; for (let i = 0; i < N; i++) if (!covered[i]) unc++;
  return { covered, unc };
}
/**
 * Sophisticated outcome of the amendment agenda order[0], order[1], ...: the first two alternatives are voted, the winner
 * meets the third, and so on. Voters look ahead: with b_j the outcome reached when order[j] is the survivor facing the rest
 * of the agenda, the outcome for any survivor w is w played in turn against b_last, ..., b_{j}, where "played" means that a
 * strict majority decides which outcome is kept.
 */
export function sophisticated(T, order) {
  const N = order.length, b = new Array(N);
  const pick = (x, y) => (x === y || T.has(x, y) ? x : y);
  const run = (a, from) => { let w = a; for (let k = N - 1; k >= from; k--) w = pick(w, b[k]); return w; };
  for (let j = N - 1; j >= 1; j--) b[j] = run(order[j], j + 1);
  return run(order[0], 1);
}

// ================================================================== chains of majority-preferred moves (McKelvey)
/**
 * Shortest chain of moves from S to T in which every step is preferred by a strict majority to the point it replaces,
 * searched on a G x G grid over [-R, R]^2 (plus the exact points S and T). Returns { ok, path: [[x, y], ...], nodes (searched) }.
 */
export function chaosPath(V, S, T, o = {}) {
  const G = o.G ?? 56, R = o.R ?? 5.5, n = V.length, M = G * G + 2, X = new Float64Array(M), Y = new Float64Array(M);
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { X[i * G + j] = -R + (2 * R * i) / (G - 1); Y[i * G + j] = -R + (2 * R * j) / (G - 1); }
  X[M - 2] = S[0]; Y[M - 2] = S[1]; X[M - 1] = T[0]; Y[M - 1] = T[1];
  const d = V.map((p) => { const a = new Float64Array(M); for (let k = 0; k < M; k++) a[k] = (p[0] - X[k]) ** 2 + (p[1] - Y[k]) ** 2; return a; });
  const prev = new Int32Array(M).fill(-2), q = [M - 2]; prev[M - 2] = -1;
  let found = false, head = 0;
  while (head < q.length && !found) {
    const x = q[head++];
    for (let y = 0; y < M; y++) {
      if (prev[y] !== -2) continue;
      let c = 0; for (let v = 0; v < n; v++) if (d[v][y] < d[v][x]) c++;
      if (c > n / 2) { prev[y] = x; q.push(y); if (y === M - 1) { found = true; break; } }
    }
  }
  if (!found) return { ok: false, path: [], nodes: q.length };
  const path = []; for (let k = M - 1; k !== -1; k = prev[k]) path.push([X[k], Y[k]]);
  return { ok: true, path: path.reverse(), nodes: q.length };
}

// ================================================================== one-dimensional electorates
/** Policy axis used by the line models: n bins on [0, 10]. */
export const LINE = { lo: 0, hi: 10 };
/** Gaussian mixture density on a grid: comps = [[weight, mean, sd], ...]. Returns Float64Array (unnormalised weights per bin, total 1). */
export function mixGrid(n, comps, extra) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = LINE.lo + ((LINE.hi - LINE.lo) * (i + 0.5)) / n;
    let s = 0; for (const [a, m, sd] of comps) s += a * phi((x - m) / sd) / sd;
    w[i] = s + (extra ? extra[i] : 0);
  }
  const tot = sum(Array.from(w)); for (let i = 0; i < n; i++) w[i] /= tot;
  return w;
}
export const binX = (n, i) => LINE.lo + ((LINE.hi - LINE.lo) * (i + 0.5)) / n;
/** Weighted median position of a binned density. */
export function gridMedian(w) {
  let c = 0; const n = w.length;
  for (let i = 0; i < n; i++) { c += w[i]; if (c >= 0.5) { const prevC = c - w[i]; return binX(n, i) - 0.5 * (LINE.hi - LINE.lo) / n + ((0.5 - prevC) / w[i]) * (LINE.hi - LINE.lo) / n; } }
  return (LINE.lo + LINE.hi) / 2;
}
export const gridMean = (w) => sum(Array.from(w, (p, i) => p * binX(w.length, i)));

/** Cumulative distribution function (linear within bins) of a binned density on [LINE.lo, LINE.hi]. */
export function cdfOf(w) {
  const n = w.length, c = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) c[i + 1] = c[i] + w[i];
  return (x) => { const t = clamp((x - LINE.lo) / (LINE.hi - LINE.lo), 0, 1) * n, i = Math.min(n - 1, Math.floor(t)); return c[i] + (c[i + 1] - c[i]) * (t - i); };
}
/** Votes (as shares of the electorate) of two parties at xa, xb: each voter backs the nearer party unless it is farther than d (then abstains). */
export function votes2(F, xa, xb, d) {
  const lo = LINE.lo, hi = LINE.hi;
  if (Math.abs(xa - xb) < 1e-12) { const v = Math.max(0, F(Math.min(hi, xa + d)) - F(Math.max(lo, xa - d))); return [v / 2, v / 2]; }
  const mid = (xa + xb) / 2;
  let a0, a1, b0, b1;
  if (xa < xb) { a0 = Math.max(lo, xa - d); a1 = Math.min(mid, xa + d); b0 = Math.max(mid, xb - d); b1 = Math.min(hi, xb + d); }
  else { b0 = Math.max(lo, xb - d); b1 = Math.min(mid, xb + d); a0 = Math.max(mid, xa - d); a1 = Math.min(hi, xa + d); }
  return [Math.max(0, F(a1) - F(a0)), Math.max(0, F(b1) - F(b0))];
}
/** Votes of any number of parties at positions P under binned density w with alienation threshold d (ties split). Returns { vt, ab, who }. */
export function tallyBins(P, w, d) {
  const N = w.length, vt = P.map(() => 0), who = new Int8Array(N); let ab = 0;
  for (let i = 0; i < N; i++) {
    const x = binX(N, i); let bd = 1e9, ties = [];
    P.forEach((p, j) => { const dd = Math.abs(x - p); if (dd < bd - 1e-12) { bd = dd; ties = [j]; } else if (Math.abs(dd - bd) <= 1e-12) ties.push(j); });
    if (bd > d) { ab += w[i]; who[i] = -1; continue; }
    ties.forEach((j) => { vt[j] += w[i] / ties.length; }); who[i] = ties[0];
  }
  return { vt, ab, who };
}
/** Inverse of the standard normal distribution function (bisection). */
export function PhiInv(p) { let a = -8, b = 8; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (Phi(m) < p) a = m; else b = m; } return (a + b) / 2; }
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export { range, sum };
