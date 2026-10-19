// Networks & Collective Behavior — Chapter 4: helpers shared by the chapter (plain named exports).
// Re-exports the chapter-3 helpers (which re-export chapter 2's: real networkx datasets, BFS, components, ...).
export * from './ch03.shared.js';
import { mkGraph, rng32 } from './ch03.shared.js';

// ---------- numerics ----------
/** Standard normal CDF (Abramowitz–Stegun 7.1.26 based, |error| < 1.5e-7). */
export function normCdf(x) {
  const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.3275911 * z);
  const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return x >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
}
export const poissonPmf = (k, c) => { let lg = -c + k * Math.log(Math.max(c, 1e-300)); for (let i = 2; i <= k; i++) lg -= Math.log(i); return Math.exp(lg); };
export function gaussDraw(R) { return Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R()); }
/** Least-squares line through (x, y) pairs: {slope, intercept, r2}. */
export function lsq(xs, ys) {
  const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; syy += ys[i] * ys[i]; }
  const den = n * sxx - sx * sx, slope = (n * sxy - sx * sy) / den, icpt = (sy - slope * sx) / n;
  const r = (n * sxy - sx * sy) / Math.sqrt(den * (n * syy - sy * sy));
  return { slope, intercept: icpt, r2: r * r };
}

// ---------- Erdős–Rényi ----------
/** One uniform per vertex pair (i<j), index i*n+j mapped by pairIndex: coupling G(n,p) across p (edge present iff u < p). */
export function pairUniforms(n, seed) { const R = rng32(seed), U = new Float32Array(n * (n - 1) / 2); for (let i = 0; i < U.length; i++) U[i] = R(); return U; }
export function gnpCoupled(n, U, p) {
  const E = []; let idx = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (U[idx++] < p) E.push([i, j]); }
  return mkGraph(n, E);
}
/** G(n, p) by geometric skipping (O(n + m)). */
export function gnpSkip(n, p, R) {
  const E = []; if (p <= 0) return mkGraph(n, E);
  if (p >= 1) { for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) E.push([i, j]); return mkGraph(n, E); }
  const lq = Math.log(1 - p); let v = 1, w = -1;
  while (v < n) { w += 1 + Math.floor(Math.log(1 - R()) / lq); while (w >= v && v < n) { w -= v; v++; } if (v < n) E.push([v, w]); }
  return mkGraph(n, E);
}
/** Grow a random graph on n vertices one uniformly random new edge at a time (a random order of pairs, repeats rejected);
 *  returns the size of the largest and second-largest component after every edge count 0..M. */
export function growthCurve(n, M, seed) {
  const R = rng32(seed), par = new Int32Array(n), sz = new Int32Array(n).fill(1), seen = new Set();
  for (let i = 0; i < n; i++) par[i] = i;
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const big = new Int32Array(M + 1), sec = new Int32Array(M + 1); let b1 = 1, b2 = 1, m = 0;
  if (n === 1) { b2 = 0; }
  big[0] = 1; sec[0] = 1;
  const cnt = new Map(); cnt.set(1, n);
  const dec = (s) => { const c = cnt.get(s) - 1; if (c) cnt.set(s, c); else cnt.delete(s); };
  while (m < M) {
    const a = Math.floor(R() * n), c = Math.floor(R() * n); if (a === c) continue;
    const key = a < c ? a * n + c : c * n + a; if (seen.has(key)) continue; seen.add(key);
    m++;
    let ra = find(a), rc = find(c);
    if (ra !== rc) {
      if (sz[ra] < sz[rc]) { const t = ra; ra = rc; rc = t; }
      dec(sz[ra]); dec(sz[rc]); par[rc] = ra; sz[ra] += sz[rc]; cnt.set(sz[ra], (cnt.get(sz[ra]) || 0) + 1);
      if (sz[ra] > b1) b1 = sz[ra];
      // the second largest changes only when a merge touches the top two, recomputed lazily for small tables
      b2 = secondLargest(cnt, b1);
    }
    big[m] = b1; sec[m] = b2;
  }
  return { big, sec };
}
function secondLargest(cnt, b1) { let b2 = 0; for (const [s, c] of cnt) { if (s === b1) { if (c > 1) b2 = Math.max(b2, s); } else if (s > b2) b2 = s; } return b2; }
/** Solution S > 0 of S = 1 − exp(−c S) (0 when c ≤ 1). */
export function giantTheory(c) {
  if(c<=1)return 0;
  let lo=1-1/c,hi=1;
  for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(-Math.expm1(-c*mid)-mid>0)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}

/** BFS distance histogram from `ns` random sources; counts[d] = number of ordered pairs at distance d. */
export function distHist(g, ns, R) {
  const n = g.n, counts = [], dist = new Int32Array(n), q = new Int32Array(n);
  let tot = 0, pairs = 0;
  for (let t = 0; t < ns; t++) {
    const s = Math.floor(R() * n); dist.fill(-1); dist[s] = 0; let h = 0, e = 0; q[e++] = s;
    while (h < e) { const u = q[h++]; for (const w of g.adj[u]) if (dist[w] < 0) { dist[w] = dist[u] + 1; q[e++] = w; } }
    for (let i = 0; i < e; i++) { const d = dist[q[i]]; if (d > 0) { counts[d] = (counts[d] || 0) + 1; tot += d; pairs++; } }
  }
  for (let d = 0; d < counts.length; d++) counts[d] = counts[d] || 0;
  return { counts, mean: pairs ? tot / pairs : NaN, pairs };
}
/** Fronczak–Fronczak–Hołyst (2004) mean distance of G(N, c/N): (ln N − γ)/ln c + 1/2. */
/** Occupancy approximation, retaining enough hops for all supported populations/degrees. */
export function occupancyDistances(N,c) {
  const last=Math.ceil(Math.log(N)/Math.log(c))+4;
  const reach=d=>d===0?1/N:-Math.expm1(-Math.pow(c,d)/N);
  const probabilities=Array.from({length:last},(_,i)=>reach(i+1)-reach(i));
  return {last,probabilities,mean:probabilities.reduce((sum,p,i)=>sum+(i+1)*p,0)};
}
export const meanDistER = (N, c) => (Math.log(N) - 0.5772156649) / Math.log(c) + 0.5;

// ---------- small-world (Watts–Strogatz) with a coupled family in p ----------
/** Ring lattice (n vertices, k nearest neighbours) with per-edge uniforms u and targets t, so different p values reuse the same proposed choices (rewired graphs need not nest). */
export function wsSkeleton(n, k, seed) {
  const R = rng32(seed), lat = [], u = [], t = [];
  for (let j = 1; j <= k / 2; j++) for (let i = 0; i < n; i++) { lat.push([i, (i + j) % n]); u.push(R()); t.push(Math.floor(R() * n)); }
  return { n, k, lat, u, t, seed };
}
/** mode 'rewire' (Watts–Strogatz): edge e whose u < p moves its far end to t. mode 'add' (Newman–Watts): the lattice is
 *  kept and a shortcut (i, t) is added. Returns {g, moved: [[a,b]] the rewired / added edges}. */
export function wsBuild(sk, p, mode) {
  const { n, lat, u, t } = sk, key = (a, b) => a < b ? a*n+b : b*n+a;
  const has=new Set(lat.map(([a,b])=>key(a,b))),E=[],moved=[];
  for(let e=0;e<lat.length;e++){
    const [a,b]=lat[e];
    if(u[e]>=p){E.push([a,b]);continue;}
    if(mode!=='add')has.delete(key(a,b));
    const valid=[];for(let j=0;j<n;j++)if(j!==a&&!has.has(key(a,j)))valid.push(j);
    if(!valid.length){E.push([a,b]);has.add(key(a,b));continue;}
    let target=t[e];
    if(!valid.includes(target)){const R=rng32((sk.seed||0)^Math.imul(e+1,0x9e3779b1));target=valid[Math.floor(R()*valid.length)];}
    has.add(key(a,target));moved.push([a,target]);if(mode==='add')E.push([a,b]);
  }
  return {g:mkGraph(n,E.concat(moved)),moved,E};
}

/** Characteristic path length (mean over connected ordered pairs) and mean local clustering of a graph. */
export function pathAndClustering(g) {
  const n = g.n, dist = new Int32Array(n), q = new Int32Array(n); let tot = 0, pairs = 0;
  for (let s = 0; s < n; s++) {
    dist.fill(-1); dist[s] = 0; let h = 0, e = 0; q[e++] = s;
    while (h < e) { const u = q[h++]; for (const w of g.adj[u]) if (dist[w] < 0) { dist[w] = dist[u] + 1; tot += dist[w]; pairs++; q[e++] = w; } }
  }
  let C = 0; const mark = new Uint8Array(n);
  for (let v = 0; v < n; v++) {
    const a = g.adj[v], kv = a.length; if (kv < 2) continue;
    for (const w of a) mark[w] = 1;
    let e = 0; for (const w of a) for (const x of g.adj[w]) if (mark[x]) e++;
    for (const w of a) mark[w] = 0;
    C += e / 2 / (kv * (kv - 1) / 2);
  }
  return { L: pairs ? tot / pairs : NaN, C: C / n };
}

// ---------- Kleinberg's lattice ----------
const kcache = new Map();
/** n = L×L torus with Manhattan distance, 4 lattice neighbours and one long-range contact per node drawn with probability
 *  ∝ d^(−q) over all other nodes. Contacts are drawn lazily (once per node) from a seeded generator. */
export function kleinberg(L, q, seed = 5) {
  const n = L * L, wrap = (d) => Math.min(d, L - d), ck = `${L}|${q}`;
  let cdf = kcache.get(ck);
  if (!cdf) {
    cdf = new Float64Array(n); let tot = 0;
    for (let dy = 0; dy < L; dy++) for (let dx = 0; dx < L; dx++) { const d = wrap(dx) + wrap(dy); tot += d === 0 ? 0 : Math.pow(d, -q); cdf[dy * L + dx] = tot; }
    if (kcache.size > 40) kcache.clear(); kcache.set(ck, cdf);
  }
  const tot = cdf[n - 1], R = rng32(seed * 7919 + L), memo = new Int32Array(n).fill(-1);
  const contact = (u) => {
    if (memo[u] >= 0) return memo[u];
    const r = R() * tot; let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; }
    return (memo[u] = ((((u / L) | 0) + ((lo / L) | 0)) % L) * L + ((u % L) + (lo % L)) % L);
  };
  const dist = (a, b) => wrap(Math.abs((a % L) - (b % L))) + wrap(Math.abs(((a / L) | 0) - ((b / L) | 0)));
  return { L, n, contact, dist, cdf, tot };
}
/** Greedy (decentralised) route: always hand the message to the contact nearest the target. Returns the path. */
export function greedyRoute(N, s, t) {
  const L = N.L, path = [s]; let u = s;
  while (u !== t) {
    const x = u % L, y = (u / L) | 0, c = [((x + 1) % L) + y * L, ((x + L - 1) % L) + y * L, x + ((y + 1) % L) * L, x + ((y + L - 1) % L) * L, N.contact(u)];
    let best = u, bd = N.dist(u, t); for (const w of c) { const d = N.dist(w, t); if (d < bd) { bd = d; best = w; } }
    u = best; path.push(u);
  }
  return path;
}
/** Mean delivery time over M random source–target pairs. */
export function meanDelivery(L, q, M = 300, seed = 5) {
  const N = kleinberg(L, q, seed), R = rng32(seed + 100); let s = 0;
  for (let i = 0; i < M; i++) { const a = Math.floor(R() * N.n), b = Math.floor(R() * N.n); s += greedyRoute(N, a, b).length - 1; }
  return s / M;
}
/** Share of long-range contacts whose length (Manhattan) lies in [2^j, 2^(j+1)) for j = 0, 1, ... */
export function linkLengthShares(L, q) {
  const N = kleinberg(L, q), out = [], wrap = (d) => Math.min(d, L - d);
  const bins = Math.ceil(Math.log2(L)) + 1; const w = new Float64Array(bins); let tot = 0;
  for (let dy = 0; dy < L; dy++) for (let dx = 0; dx < L; dx++) { const d = wrap(dx) + wrap(dy); if (!d) continue; const x = Math.pow(d, -q); w[Math.floor(Math.log2(d))] += x; tot += x; }
  for (let j = 0; j < bins; j++) out.push(w[j] / tot);
  return out;
}

// ---------- power laws ----------
export function powerSample(alpha, xmin, n, R) { const out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = xmin * Math.pow(1 - R(), -1 / (alpha - 1)); return out; }
export function lognormalSample(mu, sigma, n, R) { const out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = Math.exp(mu + sigma * gaussDraw(R)); return out; }
/** Continuous power-law MLE above xmin on sorted-or-unsorted data. */
export function plFitCont(xs, xmin) {
  let n = 0, s = 0; for (const x of xs) if (x >= xmin) { n++; s += Math.log(x / xmin); }
  const alpha = 1 + n / s; return { alpha, n, se: (alpha - 1) / Math.sqrt(n), ll: n * Math.log(alpha - 1) - n * Math.log(xmin) - alpha * s };
}
/** Kolmogorov–Smirnov distance between the empirical tail and the fitted continuous power law. */
export function ksPowerCont(sorted, xmin, alpha) {
  let i0 = 0; while (i0 < sorted.length && sorted[i0] < xmin) i0++;
  const n = sorted.length - i0; let D = 0;
  for (let i = 0; i < n; i++) { const F = 1 - Math.pow(sorted[i0 + i] / xmin, 1 - alpha); D = Math.max(D, Math.abs(F - i / n), Math.abs(F - (i + 1) / n)); }
  return D;
}
/** Clauset–Shalizi–Newman: pick xmin among the data values (thinned to ≤ 60 candidates) that minimises the KS distance. */
export function plBestXminCont(sorted, minTail = 30) {
  const cand = []; const n = sorted.length, step = Math.max(1, Math.floor(n / 60));
  for (let i = 0; i < n - minTail; i += step) if (!cand.length || sorted[i] > cand[cand.length - 1]) cand.push(sorted[i]);
  let best = null;
  for (const xm of cand) { const f = plFitCont(sorted, xm), D = ksPowerCont(sorted, xm, f.alpha); if (!best || D < best.D) best = { xmin: xm, D, ...f }; }
  return best;
}
/** Truncated (x ≥ xmin) lognormal log-likelihood per observation and the pointwise values, for parameters (mu, sigma). */
export function lnLogLik(xs, xmin, mu, sigma) {
  if (sigma <= 0.02) return -1e12;
  const lz = Math.log(Math.max(1 - normCdf((Math.log(xmin) - mu) / sigma), 1e-300)), out = [];
  for (const x of xs) if (x >= xmin) { const z = (Math.log(x) - mu) / sigma; out.push(-Math.log(x) - Math.log(sigma) - 0.9189385332 - z * z / 2 - lz); }
  return out;
}
/** Fit a truncated lognormal by maximum likelihood (Nelder–Mead from the log-moments); M = v.M. */
export function lnFitCont(M, xs, xmin) {
  const lg = []; for (const x of xs) if (x >= xmin) lg.push(Math.log(x));
  const m0 = lg.reduce((a, b) => a + b, 0) / lg.length, s0 = Math.sqrt(lg.reduce((a, b) => a + (b - m0) ** 2, 0) / lg.length) || 1;
  const f = ([mu, sg]) => { const p = lnLogLik(xs, xmin, mu, sg); return typeof p === 'number' ? 1e12 : -p.reduce((a, b) => a + b, 0); };
  const r = M.nelderMead(f, [m0, s0], { step: 0.5, tol: 1e-9, maxIt: 400 });
  return { mu: r.x[0], sigma: r.x[1], ll: -r.fx };
}
/** Vuong-type normalised log-likelihood ratio between two pointwise log-likelihood arrays: z and two-sided p. */
export function vuong(a, b) {
  const n = a.length, d = a.map((x, i) => x - b[i]), mean = d.reduce((x, y) => x + y, 0) / n;
  const sd = Math.sqrt(d.reduce((x, y) => x + (y - mean) ** 2, 0) / n) || 1e-12, z = mean * Math.sqrt(n) / sd;
  return { R: mean * n, z, p: 2 * (1 - normCdf(Math.abs(z))) };
}
export function plPointwiseCont(xs, xmin, alpha) { const out = []; for (const x of xs) if (x >= xmin) out.push(Math.log(alpha - 1) - Math.log(xmin) - alpha * Math.log(x / xmin)); return out; }

// ---- discrete (degree) data ----
/** Hurwitz zeta ζ(a, q) = Σ_{k≥0} (q+k)^−a, Euler–Maclaurin tail. */
export function hurwitz(a, q) {
  let s = 0; const N = 24; for (let k = 0; k < N; k++) s += Math.pow(q + k, -a);
  const x = q + N; return s + Math.pow(x, 1 - a) / (a - 1) + 0.5 * Math.pow(x, -a) + a * Math.pow(x, -a - 1) / 12 - a * (a + 1) * (a + 2) * Math.pow(x, -a - 3) / 720;
}
/** Discrete power law above kmin: maximise Σ −α ln k − n ln ζ(α, kmin) by golden-section search on α ∈ (1.05, 6). */
export function plFitDisc(ks, kmin) {
  let n = 0, sl = 0; for (const k of ks) if (k >= kmin) { n++; sl += Math.log(k); }
  const ll = (a) => -a * sl - n * Math.log(hurwitz(a, kmin));
  let lo = 1.05, hi = 6; const g = 0.6180339887;
  for (let i = 0; i < 60; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (ll(c) > ll(d)) hi = d; else lo = c; }
  const alpha = (lo + hi) / 2; return { alpha, n, ll: ll(alpha), sl };
}
export function plPmfDisc(k, kmin, alpha) { return Math.pow(k, -alpha) / hurwitz(alpha, kmin); }
export function ksDisc(sortedTail, pmf) {
  const n = sortedTail.length; let cum = 0, D = 0, prev = sortedTail[0] - 1, ec = 0, i = 0;
  const kmax = sortedTail[n - 1];
  for (let k = sortedTail[0]; k <= kmax; k++) { cum += pmf(k); while (i < n && sortedTail[i] <= k) { i++; ec = i / n; } D = Math.max(D, Math.abs(ec - Math.min(1, cum))); }
  return D;
}
/** Discretised truncated lognormal on k ≥ kmin and the geometric (discrete exponential) tail: pointwise log-likelihoods. */
export function discAlternatives(M, tail, kmin) {
  const lg = tail.map((k) => Math.log(k)), m0 = lg.reduce((a, b) => a + b, 0) / lg.length, s0 = Math.sqrt(lg.reduce((a, b) => a + (b - m0) ** 2, 0) / lg.length) || 1;
  const P = (mu, sg, k) => normCdf((Math.log(k + 0.5) - mu) / sg) - normCdf((Math.log(k - 0.5) - mu) / sg);
  const nll = ([mu, sg]) => { if (sg < 0.05) return 1e12; const z = Math.max(1 - normCdf((Math.log(kmin - 0.5) - mu) / sg), 1e-300); let s = 0; for (const k of tail) s -= Math.log(Math.max(P(mu, sg, k), 1e-300)) - Math.log(z); return s; };
  const r = M.nelderMead(nll, [m0, s0], { step: 0.5, tol: 1e-8, maxIt: 300 });
  const [mu, sg] = r.x, z = Math.max(1 - normCdf((Math.log(kmin - 0.5) - mu) / sg), 1e-300);
  const meanTail = tail.reduce((a, b) => a + b, 0) / tail.length, lam = Math.log(1 + 1 / Math.max(meanTail - kmin, 1e-6));
  return {
    ln: tail.map((k) => Math.log(Math.max(P(mu, sg, k), 1e-300)) - Math.log(z)), mu, sigma: sg,
    ex: tail.map((k) => Math.log(1 - Math.exp(-lam)) - lam * (k - kmin)), lambda: lam,
  };
}
/** Full simplified Broido–Clauset-style analysis of a degree list: {kmin, alpha, n, D, vsLn, vsEx, verdict}. */
export function analyseDegrees(M, deg) {
  const sorted = Array.from(deg).filter((d) => d >= 1).sort((a, b) => a - b), uniq = [...new Set(sorted)];
  let best = null;
  const cands = uniq.filter((k) => sorted.length - sorted.indexOf(k) >= 40).slice(0, 18);
  for (const kmin of cands) {
    const f = plFitDisc(sorted, kmin), tail = sorted.filter((k) => k >= kmin), Z = hurwitz(f.alpha, kmin);
    const D = ksDisc(tail, (k) => Math.pow(k, -f.alpha) / Z);
    if (!best || D < best.D) best = { kmin, D, ...f, tail };
  }
  if (!best) return null;
  const alt = discAlternatives(M, best.tail, best.kmin), Z = hurwitz(best.alpha, best.kmin);
  const pl = best.tail.map((k) => -best.alpha * Math.log(k) - Math.log(Z));
  const vsLn = vuong(pl, alt.ln), vsEx = vuong(pl, alt.ex);
  const { sorted: _s, ...rest } = best; return { ...rest, alt, vsLn, vsEx, sorted };
}

// ---------- preferential attachment ----------
/** Growth with attachment probability ∝ (k + a)(1 − p) mixture: with probability p the target is uniform, otherwise ∝ degree.
 *  Each newcomer brings m links to distinct earlier vertices. Returns degrees and, for chosen vertices, a degree record. */
export function baMix(n, m, p, R, track = []) {
  const deg = new Int32Array(n), ends = new Int32Array(2 * m * n + 4); let ne = 0;
  const rec = track.map(() => []), step = Math.max(1, Math.floor(n / 200));
  for (let i = 0; i <= m; i++) for (let j = 0; j < i; j++) { deg[i]++; deg[j]++; ends[ne++] = i; ends[ne++] = j; }
  for (let v = m + 1; v < n; v++) {
    const ch = []; let guard = 0;
    while (ch.length < m && guard++ < 200) { const t = R() < p ? Math.floor(R() * v) : ends[Math.floor(R() * ne)]; if (!ch.includes(t)) ch.push(t); }
    for (const t of ch) { deg[t]++; deg[v]++; ends[ne++] = t; ends[ne++] = v; }
    if (v % step === 0) track.forEach((i, r) => { if (i < v) rec[r].push([v, deg[i]]); });
  }
  return { deg, rec };
}
/** Stationary degree distribution of the rate equation for attachment ∝ k + a with m links per newcomer:
 *  P(m) = 1/(1 + β(m+a)), P(k) = P(k−1) β(k−1+a)/(1 + β(k+a)), β = m/(2m+a). Returns array indexed by k (0 below m). */
export function rateEq(m, a, kmax) {
  const beta = m / (2 * m + a), P = new Float64Array(kmax + 1); P[m] = 1 / (1 + beta * (m + a));
  for (let k = m + 1; k <= kmax; k++) P[k] = P[k - 1] * beta * (k - 1 + a) / (1 + beta * (k + a));
  return P;
}
/** Discrete tail exponent estimate γ̂ = 1 + n / Σ ln(k/(kmin − 1/2)) (Clauset–Shalizi–Newman eq. 3.7). */
export function hillDisc(deg, kmin) { let n = 0, s = 0; for (const k of deg) if (k >= kmin) { n++; s += Math.log(k / (kmin - 0.5)); } return { gamma: n ? 1 + n / s : null, n }; }
/** Log-binned density from an integer sample: points [k_geometric_mean, P] with bins growing by `ratio`. */
export function logBin(deg, kmin, ratio = 1.5) {
  const cnt = new Map(); let N = 0; for (const k of deg) { if (k >= kmin) { cnt.set(k, (cnt.get(k) || 0) + 1); } N++; }
  const pts = []; let lo = kmin;
  const kmax = Math.max(...cnt.keys());
  while (lo <= kmax) {
    const hi = Math.max(lo + 1, Math.ceil(lo * ratio)); let c = 0; for (let k = lo; k < hi; k++) c += cnt.get(k) || 0;
    if (c > 0) pts.push([Math.sqrt(lo * (hi - 1 + 0.001)) || lo, c / N / (hi - lo)]);
    lo = hi;
  }
  return pts;
}
/** Preferential attachment with a nonlinear kernel: a tree (m = 1); target i chosen with probability ∝ k_i^γ. Fenwick tree. */
export function nonlinearPA(n, gam, R) {
  const deg = new Int32Array(n), tree = new Float64Array(n + 1); let total = 0;
  const add = (i, d) => { total += d; for (i++; i <= n; i += i & -i) tree[i] += d; };
  const pick = (x) => { let pos = 0, step = 1; while (step * 2 <= n) step *= 2; for (; step > 0; step >>= 1) if (pos + step <= n && tree[pos + step] < x) { pos += step; x -= tree[pos]; } return pos; };
  const w = (k) => Math.pow(k, gam);
  deg[0] = 1; deg[1] = 1; add(0, w(1)); add(1, w(1));
  for (let v = 2; v < n; v++) {
    const t = Math.min(v - 1, pick(R() * total));
    add(t, w(deg[t] + 1) - w(deg[t])); deg[t]++; deg[v] = 1; add(v, w(1));
  }
  return deg;
}

// ---------- configuration model ----------
/** Degree sequences of n vertices (even sum): family ∈ poisson | geometric | power | regular | bimodal. */
export function degreeSequence(family, n, c, R) {
  const d = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    if (family === 'poisson') { const L = Math.exp(-c); let k = 0, p = 1; do { k++; p *= R(); } while (p > L); d[i] = k - 1; }
    else if (family === 'geometric') { const r = 1 / (1 + c); d[i] = Math.floor(Math.log(1 - R()) / Math.log(1 - r)); }
    else if (family === 'power') { d[i] = Math.min(Math.floor(c * Math.pow(1 - R(), -1 / 1.5) + R()), 800); }
    else if (family === 'regular') d[i] = Math.round(c);
    else d[i] = R() < 0.8 ? 1 : Math.round(1 + (c - 0.8) / 0.2);
  }
  let s = 0; for (const x of d) s += x; if (s % 2) d[0]++;
  return d;
}
/** Stub matching. Returns the simple graph (loops and repeated pairs dropped) and how many were dropped. */
export function configModel(deg, R) {
  const stubs = []; deg.forEach((k, i) => { for (let j = 0; j < k; j++) stubs.push(i); });
  for (let i = stubs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = stubs[i]; stubs[i] = stubs[j]; stubs[j] = t; }
  const E = []; for (let i = 0; i + 1 < stubs.length; i += 2) E.push([stubs[i], stubs[i + 1]]);
  const g = mkGraph(deg.length, E); return { g, dropped: E.length - g.edges.length, stubEdges: E };
}

// ---------- directed graphs and the bow-tie ----------
/** Directed G(n, p) with out-neighbour lists. */
export function digraphGnp(n, c, R) {
  const out = Array.from({ length: n }, () => []), inn = Array.from({ length: n }, () => []), p = c / (n - 1);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && R() < p) { out[i].push(j); inn[j].push(i); }
  return { n, out, inn };
}
function reach(adj, s, n) { const seen = new Uint8Array(n); seen[s] = 1; const q = [s]; for (let h = 0; h < q.length; h++) for (const w of adj[q[h]]) if (!seen[w]) { seen[w] = 1; q.push(w); } return seen; }
/** Classify every vertex: 'scc' (largest strongly connected component), 'in', 'out', 'tendril' (incl. tubes), 'disc' (outside the
 *  largest weakly connected component). `tube` marks vertices reachable from IN and reaching OUT without touching the core. */
export function bowTie(G) {
  const { n, out, inn } = G;
  // Exact Kosaraju decomposition; a high-degree sample can miss the largest SCC.
  const seen=new Uint8Array(n),order=[];
  for(let start=0;start<n;start++)if(!seen[start]){
    const stack=[[start,0]];seen[start]=1;
    while(stack.length){const top=stack[stack.length-1],v=top[0];if(top[1]<out[v].length){const w=out[v][top[1]++];if(!seen[w]){seen[w]=1;stack.push([w,0]);}}else{order.push(v);stack.pop();}}
  }
  const assigned=new Uint8Array(n);let best=new Uint8Array(n),bsz=0;
  for(let index=order.length-1;index>=0;index--){const start=order[index];if(assigned[start])continue;
    const component=[],stack=[start];assigned[start]=1;
    while(stack.length){const v=stack.pop();component.push(v);for(const w of inn[v])if(!assigned[w]){assigned[w]=1;stack.push(w);}}
    if(component.length>bsz){bsz=component.length;best=new Uint8Array(n);component.forEach(v=>best[v]=1);}
  }
  const type = new Array(n).fill('disc');
  if (bsz <= 1) return { type, counts: { scc: 0, in: 0, out: 0, tendril: 0, tube: 0, disc: n } };
  const src = best.indexOf(1), F = reach(out, src, n), B = reach(inn, src, n);
  const und = Array.from({ length: n }, (_, i) => out[i].concat(inn[i])), W = reach(und, src, n);
  const fromIn = new Uint8Array(n), toOut = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (B[i] && !best[i]) fromIn[i] = 1; // IN
  // reachable from IN (avoiding the core) and reaching OUT (avoiding the core)
  const inSet = []; for (let i = 0; i < n; i++) if (fromIn[i]) inSet.push(i);
  const fwdIn = new Uint8Array(n), q = inSet.slice(); inSet.forEach((i) => (fwdIn[i] = 1));
  for (let h = 0; h < q.length; h++) for (const w of out[q[h]]) if (!fwdIn[w] && !best[w]) { fwdIn[w] = 1; q.push(w); }
  const outSet = []; for (let i = 0; i < n; i++) if (F[i] && !best[i]) outSet.push(i);
  const bwOut = new Uint8Array(n), q2 = outSet.slice(); outSet.forEach((i) => (bwOut[i] = 1));
  for (let h = 0; h < q2.length; h++) for (const w of inn[q2[h]]) if (!bwOut[w] && !best[w]) { bwOut[w] = 1; q2.push(w); }
  const counts = { scc: 0, in: 0, out: 0, tendril: 0, tube: 0, disc: 0 };
  for (let i = 0; i < n; i++) {
    let t;
    if (best[i]) t = 'scc'; else if (B[i]) t = 'in'; else if (F[i]) t = 'out';
    else if (!W[i]) t = 'disc'; else if (fwdIn[i] && bwOut[i]) t = 'tube'; else t = 'tendril';
    type[i] = t; counts[t]++;
  }
  return { type, counts };
}

// ---------- Gibrat ----------
/** N cities start equal; each step multiplies every size by exp(σ z − σ²/2) (zero mean growth); optionally floored at 1 (reflecting barrier). */
export function gibratRun(N, T, sigma, barrier, seed) {
  const R = rng32(seed), x = new Float64Array(N).fill(1), snaps = {};
  for (let t = 1; t <= T; t++) {
    for (let i = 0; i < N; i++) { x[i] *= Math.exp(sigma * gaussDraw(R) - sigma * sigma / 2); if (barrier && x[i] < 1) x[i] = 1; }
    if (t === T || t === 10 || t === 100 || t === 300) snaps[t] = Float64Array.from(x).sort().reverse();
  }
  return snaps[T];
}
