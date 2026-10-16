// Pharmacology — Chapter 4: helpers shared by the items of ch04.js
// (single-dose curves with first-order or zero-order input, multiple-dose superposition, steady-state profiles)
export * from './ch03.shared.js';
import { bateman, rk4 } from './ch03.shared.js';

/**
 * Concentration at time t after ONE dose D into volume V (elimination rate k), per unit bioavailability.
 * ka = Infinity: intravenous bolus. Finite ka: first-order absorption (Bateman function).
 * T > 0: the dose is delivered at a constant rate D/T over [0, T] (zero-order input, an infusion or a patch).
 */
export function cSingle(t, D, V, k, ka = Infinity, T = 0) {
  if (t < 0) return 0;
  if (T > 0) {
    const R = D / T, c = (R / (V * k)) * (1 - Math.exp(-k * Math.min(t, T)));
    return t <= T ? c : c * Math.exp(-k * (t - T));
  }
  if (!isFinite(ka)) return (D / V) * Math.exp(-k * t);
  return bateman(1, D, V, ka, k, t);
}
/** Superposition: sum of single-dose curves for doses at the given times (array of numbers, or [{t, D}]). */
export function cMulti(t, doses, V, k, ka = Infinity, T = 0, D = 1) {
  let s = 0;
  for (const d of doses) {
    const td = typeof d === 'number' ? d : d.t, Dd = typeof d === 'number' ? D : d.D;
    if (td <= t) s += cSingle(t - td, Dd, V, k, ka, T);
  }
  return s;
}
/** Number of previous doses needed before the sum has converged to the steady state (relative error ~1e-9). */
export function nPrev(k, tau, ka = Infinity) {
  const kk = isFinite(ka) ? Math.min(k, ka) : k;
  return Math.min(6000, Math.ceil(21 / (kk * tau)) + 2);
}
/** Steady-state concentration at time t (0 <= t < tau after a dose) for repeated dosing every tau. */
export function cSS(t, tau, D, V, k, ka = Infinity, T = 0) {
  if (!isFinite(ka) && !(T > 0)) { const r = Math.exp(-k * tau); return ((D / V) * Math.exp(-k * t)) / (1 - r); }
  let s = 0; const N = nPrev(k, tau, ka);
  for (let n = 0; n <= N; n++) s += cSingle(t + n * tau, D, V, k, ka, T);
  return s;
}
/** Simpson mean of f over [a, b] with n (even) panels. */
export function meanOver(f, a, b, n = 400) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3 / (b - a);
}
/** Max and min of f over [a, b] sampled on n points (max/min are the sampled extremes). */
export function extrema(f, a, b, n = 400) {
  let hi = -Infinity, lo = Infinity, th = a, tl = a;
  for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n, y = f(t); if (y > hi) { hi = y; th = t; } if (y < lo) { lo = y; tl = t; } }
  return { hi, lo, th, tl };
}
/** Independent check: integrate the gut/central ODEs (dA_g = -ka A_g, dA = ka A_g - k A) by RK4 across dose jumps; returns C(tEnd). */
export function odeDoses(V, k, ka, times, D, tEnd) {
  const evs = times.filter((t) => t <= tEnd).sort((a, b) => a - b);
  let y = [0, 0], t0 = 0;
  const step = (t1) => {
    const n = Math.max(8, Math.ceil((t1 - t0) / 0.05)), h = (t1 - t0) / n;
    const kg = isFinite(ka) ? ka : 0; // IV: the dose enters the central compartment directly
    const F = ([g, a]) => [-kg * g, kg * g - k * a];
    for (let i = 0; i < n; i++) y = rk4(F, y, 0, h);
    t0 = t1;
  };
  for (const te of evs) { if (te > t0) step(te); if (isFinite(ka)) y[0] += D; else y[1] += D; }
  if (tEnd > t0) step(tEnd);
  return y[1] / V;
}
/** Smallest index set helper: percentage string. */
export const pct = (x, d = 0) => `${(100 * x).toFixed(d)}\\%`;
