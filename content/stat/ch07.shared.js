// Statistical Inference — Chapter 7: helpers shared by ch07.js and ch07-b.js (plain named exports).
//
// Everything from chapter 6 is re-exported (the normal and t machinery, the repeated-sampling engine, the chapter
// colours). New here: the multiple-testing procedures (uncorrected, Bonferroni, Holm, Benjamini–Hochberg) acting on a
// vector of p-values, and a generator of "screens" of m z-tests with m1 real effects and an optional common factor
// that makes the test statistics equicorrelated.
export * from './ch06.shared.js';
import { Q, qnorm } from './ch06.shared.js';

/** Colours for the multiple-testing pictures: nulls blue, real effects purple, false discoveries red, true discoveries green, misses orange. */
export const PC = { nul: 'accent', real: 'purple', fd: 'red', td: 'green', miss: 'orange', sim: 'gold' };

/** Indices that sort the p-values ascending. */
export function orderOf(p) { const o = Array.from({ length: p.length }, (_, i) => i); o.sort((a, b) => p[a] - p[b]); return o; }

/**
 * The four procedures at level alpha. `o` is the ascending order. bonf and unc reject every p at most alpha/m (resp. alpha);
 * holm and bh reject the first k of the order, k returned here.
 */
export function procs(p, alpha, o = orderOf(p)) {
  const m = p.length;
  let bonf = 0, unc = 0, holm = 0, bh = 0;
  for (let i = 0; i < m; i++) { if (p[i] <= alpha / m) bonf++; if (p[i] <= alpha) unc++; }
  for (let j = 0; j < m; j++) { if (p[o[j]] <= alpha / (m - j)) holm = j + 1; else break; }
  for (let i = m; i >= 1; i--) if (p[o[i - 1]] <= (i * alpha) / m) { bh = i; break; }
  return { o, bonf, unc, holm, bh };
}
/** Number of true nulls (index ≥ m1) among the k smallest p-values. */
export function falseFirst(o, k, m1) { let v = 0; for (let j = 0; j < k; j++) if (o[j] >= m1) v++; return v; }
/** Number of true nulls with p ≤ t. */
export function falseBelow(p, t, m1) { let v = 0; for (let i = m1; i < p.length; i++) if (p[i] <= t) v++; return v; }

/** Fill z with m equicorrelated N(0,1) statistics (common factor), the first m1 shifted by mu. */
export function genZ(r, z, m1, mu, rho) {
  const a = Math.sqrt(rho), b = Math.sqrt(1 - rho), W = rho > 0 ? r.normal() : 0;
  for (let i = 0; i < z.length; i++) z[i] = a * W + b * r.normal() + (i < m1 ? mu : 0);
  return z;
}
/** p-value of a z statistic: two-sided (2) or upper one-sided (1). */
export const pZ = (z, sided) => (sided === 2 ? 2 * Q(Math.abs(z)) : Q(z));

/**
 * reps screens of m tests with m1 real effects of size mu and equicorrelation rho; returns per-procedure V (false
 * rejections) and R (rejections) for each screen.
 */
export function runScreens(r, { m, m1, mu, rho = 0, reps, alpha, sided = 1 }) {
  const out = {}; for (const k of ['unc', 'bonf', 'holm', 'bh']) out[k] = { V: new Int32Array(reps), R: new Int32Array(reps) };
  const z = new Float64Array(m), p = new Float64Array(m);
  for (let t = 0; t < reps; t++) {
    genZ(r, z, m1, mu, rho);
    for (let i = 0; i < m; i++) p[i] = pZ(z[i], sided);
    const c = procs(p, alpha);
    out.unc.R[t] = c.unc; out.unc.V[t] = falseBelow(p, alpha, m1);
    out.bonf.R[t] = c.bonf; out.bonf.V[t] = falseBelow(p, alpha / m, m1);
    out.holm.R[t] = c.holm; out.holm.V[t] = falseFirst(c.o, c.holm, m1);
    out.bh.R[t] = c.bh; out.bh.V[t] = falseFirst(c.o, c.bh, m1);
  }
  return out;
}
/** FWER = P(V ≥ 1), FDR = E[V / max(R, 1)], mean rejections, and the false discovery proportions. */
export function summary(P) {
  const n = P.V.length; let fw = 0, fd = 0, R = 0, V = 0, zero = 0; const fdp = new Float64Array(n);
  for (let i = 0; i < n; i++) { const f = P.V[i] / Math.max(P.R[i], 1); fdp[i] = f; fd += f; if (P.V[i] > 0) fw++; R += P.R[i]; V += P.V[i]; if (P.V[i] === 0) zero++; }
  return { fwer: fw / n, fdr: fd / n, R: R / n, V: V / n, fdp, pzero: zero / n };
}
/** Smallest-first quantile of an array copy. */
export function quant(a, q) { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; }

/** Power of the two-sided z test at level a when the statistic is N(delta, 1). */
export const powZ2 = (delta, a) => { const c = qnorm(1 - a / 2); return Q(c - delta) + Q(c + delta); };
/** The delta ≥ 0 giving two-sided power `pw` at level a (bisection). */
export function deltaForPower(pw, a) { let lo = 0, hi = 12; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (powZ2(mid, a) < pw) lo = mid; else hi = mid; } return (lo + hi) / 2; }
