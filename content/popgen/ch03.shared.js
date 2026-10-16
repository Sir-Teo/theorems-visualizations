// Population Genetics & Evolution — Chapter 3 (Mutation and neutral variation): shared helpers (plain named exports).
export * from './ch02.shared.js';
import { binom } from './ch02.shared.js';

/** a_n = 1 + 1/2 + … + 1/(n−1). */
export const harm = (n) => { let s = 0; for (let j = 1; j < n; j++) s += 1 / j; return s; };

/** Infinitely-many-alleles Wright–Fisher generation on n gene copies. `al` is a list of [id, count]; every copy of the new generation
 *  picks a parent copy uniformly (multinomial by conditional binomials), then each copy independently mutates to a brand-new allele with
 *  probability mu. `ids.n` is the counter of allele ids. Returns the new list (zero counts dropped). */
export function iamStep(r, al, n, mu, ids) {
  const out = []; let rem = n, pleft = 1;
  for (let i = 0; i < al.length && rem > 0; i++) {
    const p = al[i][1] / n; let c;
    if (i === al.length - 1 || p >= pleft - 1e-12) c = rem; else c = binom(r, rem, Math.min(1, p / pleft));
    pleft -= p; rem -= c;
    if (c > 0) out.push([al[i][0], c]);
  }
  if (mu > 0) {
    const m = out.length;
    for (let i = 0; i < m; i++) { const k = binom(r, out[i][1], mu); if (k) { out[i][1] -= k; for (let j = 0; j < k; j++) out.push([ids.n++, 1]); } }
  }
  return out.filter((a) => a[1] > 0);
}
/** Homozygosity Σ x_i² of a counts list. */
export function homoz(al, n) { let s = 0; for (const a of al) s += (a[1] / n) ** 2; return s / 1; }

/** Exact expected identity F_t under the infinite-alleles model with n copies and mutation mu per copy per generation (F_0 given). */
export function iamF(n, mu, F0, t) {
  const a = (1 - mu) ** 2, F = new Float64Array(t + 1); F[0] = F0;
  for (let i = 1; i <= t; i++) F[i] = a * (1 / n + (1 - 1 / n) * F[i - 1]);
  return F;
}
/** Stationary identity of that recursion. */
export const iamFstar = (n, mu) => { const a = (1 - mu) ** 2; return (a / n) / (1 - a * (1 - 1 / n)); };

/** One WF generation for an independent neutral/selected site: count k of n copies, haploid-type selection s on the mutant. */
export function siteNext(r, n, k, s) {
  let p = k / n;
  if (s) p = (p * (1 + s)) / (1 + p * s);
  return binom(r, n, p);
}

/** Poisson draw. */
export function pois(r, lam) {
  if (lam <= 0) return 0;
  if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal()));
  const L = Math.exp(-lam); let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}

/** Unsigned Stirling numbers of the first kind |s(n, k)| for k = 0..n. */
export function stirling1(n) {
  let row = [1];
  for (let m = 1; m <= n; m++) { const nx = new Array(m + 1).fill(0); for (let k = 1; k <= m; k++) nx[k] = (row[k - 1] || 0) + (m - 1) * (row[k] || 0); row = nx; }
  return row;
}
/** All partitions of n as multiplicity vectors a[1..n] (a[j] = number of alleles represented j times), largest part first. */
export function partitions(n) {
  const out = [];
  (function rec(rem, maxPart, parts) {
    if (rem === 0) { const a = new Array(n + 1).fill(0); parts.forEach((p) => a[p]++); out.push({ parts: parts.slice(), a }); return; }
    for (let p = Math.min(rem, maxPart); p >= 1; p--) { parts.push(p); rec(rem - p, p, parts); parts.pop(); }
  })(n, n, []);
  return out;
}
/** Ewens sampling probability of the configuration a (a[j] alleles seen j times) in a sample of n genes, parameter theta. */
export function ewensProb(a, n, th) {
  let lg = 0; for (let j = 0; j < n; j++) lg -= Math.log(th + j);
  for (let j = 1; j <= n; j++) if (a[j]) { lg += a[j] * Math.log(th / j); for (let i = 2; i <= a[j]; i++) lg -= Math.log(i); }
  for (let i = 2; i <= n; i++) lg += Math.log(i);
  return Math.exp(lg);
}

/** Exact Wright–Fisher chain with two-way mutation, run for T generations after burn-in: returns Uint16Array of counts k_t (t ≥ 0). */
export function wfMutPath(r, n, k0, u, v, T) {
  const out = new Uint16Array(T + 1); let k = k0; out[0] = k;
  for (let t = 1; t <= T; t++) { const p = (k / n) * (1 - u) + (1 - k / n) * v; k = binom(r, n, p); out[t] = k; }
  return out;
}

/** Exponent text 10ⁿ for tick labels. */
export const pow10 = (e) => '10' + String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

