// Probability: Theory and Examples (Durrett) — Chapter 3: helpers shared by ch03.js, ch03-b.js (plain named exports).
//
// Pictures that recur through §§3.1–3.3: exact binomial / simple-random-walk laws (log-factorials, so n can be large),
// distribution and quantile functions of S_n/√n, a small library of laws with closed-form characteristic functions
// (drawn as curves in the complex plane, sampled with a seeded rng), Pólya's density and a sampler for it.

export { clampN, cornerIn, simpson, PHI, PhiN, sampleCauchy, sampleExp, linEdges, densityOn, logInts, runningMeans } from './ch02.shared.js';
import { PhiN, sampleExp, sampleCauchy } from './ch02.shared.js';

/** Plain number with a real minus sign (0 for tiny values). */
export const fr = (x, d = 3) => (!isFinite(x) ? (x > 0 ? '∞' : x < 0 ? '−∞' : '—') : Math.abs(x) < 0.5 * 10 ** -d ? '0' : x.toFixed(d).replace('-', '−'));
/** Short scientific notation for TeX ($1.2\times10^{-5}$ style without the dollars). */
export function sciT(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return fr(x, Math.max(0, d + 1 - Math.max(0, e + 1)));
  let m = x / 10 ** e, ee = e; if (Math.abs(+m.toFixed(d - 1)) >= 10) { m /= 10; ee++; }
  return `${m.toFixed(d - 1).replace('-', '−')}\\times10^{${ee}}`;
}

// ------------------------------------------------------------------ exact discrete laws
const LF = [0];
/** log(k!) from a growing table (exact sums of logs). */
export function logFact(k) { while (LF.length <= k) LF.push(LF[LF.length - 1] + Math.log(LF.length)); return LF[k]; }
export const logChoose = (n, k) => (k < 0 || k > n ? -Infinity : logFact(n) - logFact(k) - logFact(n - k));
/** Binomial(n, p) probability mass function as a Float64Array of length n + 1. */
export function binomPmf(n, p = 0.5) {
  const out = new Float64Array(n + 1), lp = Math.log(p), lq = Math.log1p(-p);
  for (let k = 0; k <= n; k++) out[k] = Math.exp(logChoose(n, k) + k * lp + (n - k) * lq);
  return out;
}
/** Poisson(λ) masses on k = k0..k1 as {k0, p}. */
export function poissonPmf(lam, k0, k1) {
  const p = new Float64Array(k1 - k0 + 1), ll = Math.log(lam);
  for (let k = k0; k <= k1; k++) p[k - k0] = Math.exp(-lam + k * ll - logFact(k));
  return { k0, p };
}
/** Law of S_n/√n for ±1 fair coin flips: atoms xs[k] = (2k − n)/√n with masses ps[k], and cumulative cs[k]. */
export function walkLaw(n) {
  const ps = binomPmf(n, 0.5), xs = new Float64Array(n + 1), cs = new Float64Array(n + 1); const r = Math.sqrt(n); let c = 0;
  for (let k = 0; k <= n; k++) { xs[k] = (2 * k - n) / r; c += ps[k]; cs[k] = c; }
  return { n, xs, ps, cs };
}
/** Distribution function of a discrete law {xs (sorted), cs (cumulative)} at x. */
export function discCdf(L, x) {
  const { xs, cs } = L; if (x < xs[0]) return 0; if (x >= xs[xs.length - 1]) return 1;
  let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  return cs[lo];
}
/** Quantile sup{y : F(y) < u} of a discrete law. */
export function discQuantile(L, u) {
  const { xs, cs } = L; for (let k = 0; k < xs.length; k++) if (cs[k] >= u - 1e-15) return xs[k];
  return xs[xs.length - 1];
}
/** Kolmogorov distance between a discrete law and a continuous distribution function G (checked at both sides of each atom). */
export function kolmogorovDisc(L, G) {
  let d = 0, prev = 0;
  for (let k = 0; k < L.xs.length; k++) { const g = G(L.xs[k]); d = Math.max(d, Math.abs(prev - g), Math.abs(L.cs[k] - g)); prev = L.cs[k]; }
  return d;
}

// ------------------------------------------------------------------ complex numbers as [re, im]
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cscale = (a, s) => [a[0] * s, a[1] * s];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const cexpi = (th) => [Math.cos(th), Math.sin(th)];
/** "0.31 − 0.42i" (plain text with a real minus sign). */
export const cfmt = (z, d = 3) => `${fr(z[0], d)} ${z[1] < 0 ? '−' : '+'} ${fr(Math.abs(z[1]), d)}i`;

// ------------------------------------------------------------------ laws with closed-form characteristic functions
export const SQ3 = Math.sqrt(3);
/** Pólya's density (1 − cos x)/(πx²), whose characteristic function is the triangle (1 − |t|)⁺. */
export const polyaPdf = (x) => (Math.abs(x) < 1e-3 ? (1 - (x * x) / 12) / (2 * Math.PI) : (1 - Math.cos(x)) / (Math.PI * x * x));
/** Rejection sampler for Pólya's density from the envelope min(1/2π, 2/πx²) (acceptance π/4). */
export function samplePolya(r) {
  for (let i = 0; i < 1000; i++) {
    let x; if (r() < 0.5) x = 4 * r() - 2; else { x = 2 / (1 - r()); if (r() < 0.5) x = -x; }
    const env = Math.abs(x) <= 2 ? 1 / (2 * Math.PI) : 2 / (Math.PI * x * x);
    if (r() * env <= polyaPdf(x)) return x;
  }
  return 0;
}
/** Student t with 3 degrees of freedom: EX² = 3 but E|X|³ = ∞. */
export const t3Pdf = (x) => (6 * SQ3) / (Math.PI * (3 + x * x) ** 2);
export const t3Phi = (t) => (1 + SQ3 * Math.abs(t)) * Math.exp(-SQ3 * Math.abs(t));
export function sampleT3(r) { const z = r.normal(); let c = 0; for (let i = 0; i < 3; i++) { const g = r.normal(); c += g * g; } return z / Math.sqrt(c / 3); }
export const sampleLaplace = (r) => (r() < 0.5 ? -1 : 1) * sampleExp(r);
/** Knuth's Poisson sampler (fine for small λ). */
export function samplePoisson(r, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }

/**
 * A catalogue of laws for the characteristic-function pictures. Each entry: label, phi(t) → [re, im], sample(r),
 * pdf (continuous part, or null), atoms ([[x, p]…] or null), mean, m2 (E X², Infinity when infinite), range for plotting.
 */
export const LAWS = {
  exp: { label: 'exponential', phi: (t) => [1 / (1 + t * t), t / (1 + t * t)], sample: (r) => sampleExp(r), pdf: (x) => (x < 0 ? 0 : Math.exp(-x)), atoms: null, mean: 1, m2: 2, xr: [-1, 6] },
  unif: { label: 'uniform $(0,1)$', phi: (t) => (Math.abs(t) < 1e-6 ? [1, t / 2] : [Math.sin(t) / t, (1 - Math.cos(t)) / t]), sample: (r) => r(), pdf: (x) => (x > 0 && x < 1 ? 1 : 0), atoms: null, mean: 0.5, m2: 1 / 3, xr: [-0.5, 1.5] },
  pois: { label: 'Poisson$(2)$', phi: (t) => { const a = Math.exp(2 * (Math.cos(t) - 1)); return [a * Math.cos(2 * Math.sin(t)), a * Math.sin(2 * Math.sin(t))]; }, sample: (r) => samplePoisson(r, 2), pdf: null, atoms: Array.from({ length: 12 }, (_, k) => [k, Math.exp(-2 + k * Math.log(2) - logFact(k))]), mean: 2, m2: 6, xr: [-1, 9] },
  norm: { label: 'normal$(1,\\,0.6^2)$', phi: (t) => { const a = Math.exp(-0.18 * t * t); return [a * Math.cos(t), a * Math.sin(t)]; }, sample: (r) => 1 + 0.6 * r.normal(), pdf: (x) => Math.exp(-((x - 1) ** 2) / 0.72) / (0.6 * Math.sqrt(2 * Math.PI)), atoms: null, mean: 1, m2: 1.36, xr: [-1.5, 3.5] },
  bern: { label: 'Bernoulli$(0.3)$', phi: (t) => [0.7 + 0.3 * Math.cos(t), 0.3 * Math.sin(t)], sample: (r) => (r() < 0.3 ? 1 : 0), pdf: null, atoms: [[0, 0.7], [1, 0.3]], mean: 0.3, m2: 0.3, xr: [-0.6, 1.6] },
  coin: { label: 'coin $\\pm1$', phi: (t) => [Math.cos(t), 0], sample: (r) => (r() < 0.5 ? -1 : 1), pdf: null, atoms: [[-1, 0.5], [1, 0.5]], mean: 0, m2: 1, xr: [-2, 2] },
  lap: { label: 'Laplace', phi: (t) => [1 / (1 + t * t), 0], sample: sampleLaplace, pdf: (x) => 0.5 * Math.exp(-Math.abs(x)), atoms: null, mean: 0, m2: 2, xr: [-6, 6] },
  t3: { label: 'Student $t_3$', phi: (t) => [t3Phi(t), 0], sample: sampleT3, pdf: t3Pdf, atoms: null, mean: 0, m2: 3, xr: [-6, 6] },
  cauchy: { label: 'Cauchy', phi: (t) => [Math.exp(-Math.abs(t)), 0], sample: sampleCauchy, pdf: (x) => 1 / (Math.PI * (1 + x * x)), atoms: null, mean: NaN, m2: Infinity, xr: [-6, 6] },
  polya: { label: 'Pólya', phi: (t) => [Math.max(0, 1 - Math.abs(t)), 0], sample: samplePolya, pdf: polyaPdf, atoms: null, mean: NaN, m2: Infinity, xr: [-12, 12] },
};
export const lawOpts = (keys) => keys.map((k) => ({ value: k, label: LAWS[k].label }));
/** Empirical characteristic function of samples xs at t. */
export function empPhi(xs, t) { let c = 0, s = 0; for (const x of xs) { c += Math.cos(t * x); s += Math.sin(t * x); } return [c / xs.length, s / xs.length]; }
/** Sine integral Si(z) = ∫₀^z sin(u)/u du: Simpson table (step 0.02) with cubic Hermite interpolation, asymptotic series beyond 400. */
const SI_H = 0.02, SI_N = 20000; let SI = null;
const sinc = (u) => (u === 0 ? 1 : Math.sin(u) / u);
export function Si(z) {
  const sg = z < 0 ? -1 : 1; z = Math.abs(z);
  if (z < 1e-9) return sg * z;
  if (z >= SI_H * SI_N) { const z2 = z * z; return sg * (Math.PI / 2 - (Math.cos(z) / z) * (1 - 2 / z2 + 24 / (z2 * z2)) - (Math.sin(z) / z2) * (1 - 6 / z2)); }
  if (!SI) { SI = new Float64Array(SI_N + 1); for (let i = 1; i <= SI_N; i++) { const a = (i - 1) * SI_H; SI[i] = SI[i - 1] + (SI_H / 6) * (sinc(a) + 4 * sinc(a + SI_H / 2) + sinc(a + SI_H)); } }
  const i = Math.floor(z / SI_H), t = z / SI_H - i, t2 = t * t, t3 = t2 * t;
  const m0 = sinc(i * SI_H) * SI_H, m1 = sinc((i + 1) * SI_H) * SI_H;
  return sg * ((2 * t3 - 3 * t2 + 1) * SI[i] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * SI[i + 1] + (t3 - t2) * m1);
}

/** Ring of pixel radius r around a data point. */
export function ringPx(v, S, x, y, r, color, width = 2, dash = null) {
  const c = S.ctx; c.save(); c.beginPath(); c.arc(S.X(x), S.Y(y), r, 0, 2 * Math.PI);
  c.strokeStyle = v.color(color); c.lineWidth = width; c.setLineDash(dash || []); c.stroke(); c.restore();
}
/** Unit circle and the real/imaginary axes for a complex-plane stage. */
export function unitCircle(S, o = {}) {
  S.circle(0, 0, 1, { color: o.color || 'faint', width: 1.2, dash: o.dash ?? [4, 4] });
  if (o.disc) S.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.05, stroke: false });
}
/** Stems for a list of atoms [[x, p]…], scaled by `scale`, with dots at the tips. */
export function stems(S, atoms, o = {}) {
  const sc = o.scale ?? 1, col = o.color || 'accent';
  for (const [x, p] of atoms) { if (p <= 0) continue; S.line(x, 0, x, p * sc, { color: col, width: o.width ?? 2.2, alpha: o.alpha }); S.dot(x, p * sc, { r: o.r ?? 3.5, color: col, alpha: o.alpha }); }
}
