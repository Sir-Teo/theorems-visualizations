// Thermodynamics & Statistical Mechanics — Chapter 5: helpers shared by ch05.js and ch05-b.js
// (the helpers of chapters 1–4 are re-exported; the additions below are counting functions and small utilities)
export * from './ch04.shared.js';
import { clamp } from './ch04.shared.js';

/** ln Γ(x) for x > 0 (Lanczos, g = 7, n = 9): relative error about 1e-15, good enough for ln n! with n up to 1e7. */
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lnGam(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGam(1 - x);
  x -= 1;
  let a = LG[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** ln n! (exact for n < 171 by summation of logs, Lanczos beyond). */
const LF = [0]; for (let i = 1; i < 171; i++) LF.push(LF[i - 1] + Math.log(i));
export const lnFac = (n) => (n < 171 ? LF[Math.round(n)] : lnGam(n + 1));
/** ln of the binomial coefficient C(n, k); −Infinity outside 0 ≤ k ≤ n. */
export const lnBin = (n, k) => (k < 0 || k > n ? -Infinity : lnFac(n) - lnFac(k) - lnFac(n - k));
/** ln of the multiplicity of an Einstein solid of N oscillators with q quanta: C(q + N − 1, q). */
export const lnEin = (N, q) => (q < 0 ? -Infinity : lnBin(q + N - 1, q));
/** Stirling's approximation to ln n!. */
export const lnStirling = (n) => n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
/** Shannon/Gibbs entropy −Σ p ln p of a probability list. */
export const shannon = (p) => p.reduce((s, x) => (x > 0 ? s - x * Math.log(x) : s), 0);
/** TeX for e^{x}: "a\times10^{b}" (x is the natural log of the number; works far beyond double range). */
export function texExp(x, digits = 3) {
  const l10 = x / Math.LN10, b = Math.floor(l10 + 1e-12), m = Math.pow(10, l10 - b);
  if (!isFinite(l10)) return '0';
  if (Math.abs(b) < 4) return String(+Math.exp(x).toPrecision(digits)).replace('-', '\u2212');
  return `${m.toFixed(digits - 1)}\\times10^{${b < 0 ? '-' : ''}${Math.abs(b)}}`;
}
/** Plain-text 10^b form of e^{x} for big exponents: "10^(…)" written with the true minus sign. */
export const log10Of = (x) => x / Math.LN10;
/** Error function (Abramowitz–Stegun 7.1.26 refined by a series for small |x|); good to ~1e-7, used for display only. */
export function erfApprox(x) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
/** log10 of the Gaussian two-sided tail P(|Z| > z), accurate also for huge z (asymptotic series). */
export function log10Tail(z) {
  if (z < 5) { const p = 1 - erfApprox(z / Math.SQRT2); return Math.log10(Math.max(p, 1e-300)); }
  return (-z * z / 2 - Math.log(z * Math.sqrt(Math.PI / 2)) + Math.log(1 - 1 / (z * z) + 3 / z ** 4)) / Math.LN10;
}
/** Format a (possibly huge) positive integer-valued float for plain text with a real minus sign and superscripts. */
export function sup10(l10) {
  const sg = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const b = Math.floor(l10), m = Math.pow(10, l10 - b);
  return `${m.toFixed(1)}×10${String(b).replace(/./g, (c) => sg[c])}`;
}
export { clamp };
