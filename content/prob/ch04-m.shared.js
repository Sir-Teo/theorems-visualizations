// Probability: Theory and Examples (Durrett) — Chapter 4, sections 4.3–4.5: helpers shared by ch04-m1.js, ch04-m2.js, ch04-m3.js.
//
// Seeded martingale paths, Galton–Watson offspring laws (probability generating function, extinction probability,
// generation sizes), and a few small drawing helpers.

export { clampN, cornerIn, linEdges, densityOn, logInts, fr, sciT } from './ch03.shared.js';

// ------------------------------------------------------------------ random walks
/** Path S_0..S_n of a ±1 walk that steps +1 with probability p. */
export function walkPath(r, n, p = 0.5) {
  const S = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) S[i] = S[i - 1] + (r() < p ? 1 : -1);
  return S;
}
/** Mean of a Float64Array. */
export const meanOf = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
/** Standard error of the mean. */
export function seOf(a) {
  const m = meanOf(a); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - m) ** 2;
  return Math.sqrt(s / Math.max(1, a.length - 1) / a.length);
}
/** Integers 0..n as a plain array (for x coordinates). */
export const iota = (n) => Array.from({ length: n + 1 }, (_, i) => i);
/** Points [x_i, y_i] with an optional stride (thinning long paths for drawing). */
export function pts(ys, stride = 1, x0 = 0) {
  const out = [];
  for (let i = 0; i < ys.length; i += stride) out.push([x0 + i, ys[i]]);
  if ((ys.length - 1) % stride) out.push([x0 + ys.length - 1, ys[ys.length - 1]]);
  return out;
}

// ------------------------------------------------------------------ offspring laws
const lgam = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
/** Build a law from a probability vector p_0..p_K (renormalised): mean, variance, cumulative table, sampler, generating function. */
export function lawFromPmf(p, label = '') {
  let tot = 0; for (const x of p) tot += x;
  const q = Float64Array.from(p, (x) => x / tot), cum = new Float64Array(q.length);
  let c = 0, mean = 0, m2 = 0;
  for (let k = 0; k < q.length; k++) { c += q[k]; cum[k] = c; mean += k * q[k]; m2 += k * k * q[k]; }
  const sample = (r) => {
    const u = r(); let lo = 0, hi = q.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] >= u) hi = m; else lo = m + 1; }
    return lo;
  };
  const pgf = (s) => { let a = 0; for (let k = q.length - 1; k >= 0; k--) a = a * s + q[k]; return a; };
  return { label, p: q, cum, mean, var: m2 - mean * mean, sample, pgf };
}
/** Offspring laws with prescribed mean m: 'poisson', 'binary' (0 or 2 children, needs m ≤ 2), 'geom' (geometric on 0,1,2,…). */
export function offspringLaw(kind, m) {
  if (kind === 'binary') { const q = Math.min(1, m / 2); return lawFromPmf([1 - q, 0, q], `0 or 2 children`); }
  if (kind === 'geom') {
    const q = m / (1 + m), K = Math.min(400, Math.ceil(40 / -Math.log(Math.max(q, 1e-9))) + 5), p = [];
    for (let k = 0; k <= K; k++) p.push((1 - q) * q ** k);
    return lawFromPmf(p, 'geometric');
  }
  const K = Math.ceil(m + 12 * Math.sqrt(m) + 20), p = [];
  for (let k = 0; k <= K; k++) p.push(Math.exp(-m + k * Math.log(Math.max(m, 1e-300)) - lgam(k)));
  return lawFromPmf(p, 'Poisson');
}
export const LAW_OPTS = [{ value: 'poisson', label: 'Poisson' }, { value: 'binary', label: '0 or 2' }, { value: 'geom', label: 'geometric' }];
/** Smallest fixed point of the generating function in [0, 1] (1 when the mean is ≤ 1). */
export function extinctionProb(law) {
  if (law.mean <= 1 + 1e-12) return 1;
  let s = 0;
  for (let i = 0; i < 4000; i++) { const t = law.pgf(s); if (Math.abs(t - s) < 1e-14) return t; s = t; }
  return s;
}
/** Exact P(Z_k > 0), k = 0..n, from iterating the generating function: 1 − φ^k(0). */
export function survivalSeq(law, n) {
  const out = [1]; let s = 0;
  for (let k = 1; k <= n; k++) { s = law.pgf(s); out.push(1 - s); }
  return out;
}
/** Total offspring of z individuals: exact for z ≤ 400, a rounded normal with the right mean and variance above that. */
export function totalChildren(r, law, z) {
  if (z <= 400) { let s = 0; for (let i = 0; i < z; i++) s += law.sample(r); return s; }
  return Math.max(0, Math.round(z * law.mean + Math.sqrt(z * law.var) * r.normal()));
}
/** Generation sizes Z_0..Z_gens. */
export function gwPath(r, law, z0, gens) {
  const Z = new Float64Array(gens + 1); Z[0] = z0;
  for (let g = 1; g <= gens; g++) Z[g] = Z[g - 1] === 0 ? 0 : totalChildren(r, law, Z[g - 1]);
  return Z;
}
