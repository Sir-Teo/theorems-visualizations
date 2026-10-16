// Control Theory — Chapter 4: helpers shared by ch04.js and ch04-b.js
// (re-exports the chapter-3 toolbox, which re-exports chapter 2's and chapter 1's; adds step-response metrics and second-order formulas)
export * from './ch03.shared.js';
import { tf } from './ch03.shared.js';

/** Linear interpolation of the first time at which y crosses `level` upward (from index i0), or null. */
function crossUp(t, y, level, i0 = 0) {
  for (let i = Math.max(1, i0); i < t.length; i++) {
    if (y[i - 1] < level && y[i] >= level) return t[i - 1] + ((level - y[i - 1]) / (y[i] - y[i - 1])) * (t[i] - t[i - 1]);
  }
  return null;
}
/**
 * Step-response specifications from samples (t, y) of a response that settles at `final`:
 * rise time (10 % → 90 % of final), peak time, peak overshoot Mp (fraction of final, 0 when none), settling time
 * (the last instant at which |y − final| exceeds tol·|final|; 0 if the response never leaves the band).
 */
export function stepInfo(t, y, final, tol = 0.02) {
  const n = t.length, f = final;
  let ip = 0;
  for (let i = 1; i < n; i++) if (y[i] > y[ip]) ip = i;
  const t10 = crossUp(t, y, 0.1 * f), t90 = crossUp(t, y, 0.9 * f);
  const tr = t10 !== null && t90 !== null ? t90 - t10 : null;
  const Mp = f !== 0 ? Math.max(0, (y[ip] - f) / Math.abs(f)) : 0;
  let ts = 0;
  for (let i = n - 1; i >= 0; i--) if (Math.abs(y[i] - f) > tol * Math.abs(f)) { ts = i === n - 1 ? NaN : t[i + 1]; break; }
  return { tr, tp: Mp > 0 ? t[ip] : null, Mp, ts, ypeak: y[ip] };
}
/** Standard second-order system ωn²/(s² + 2ζωn s + ωn²). */
export const second = (zeta, wn) => tf([wn * wn], [wn * wn, 2 * zeta * wn, 1]);
/** Peak overshoot (fraction) of the standard second-order step response, 0 ≤ ζ < 1. */
export const mpOfZeta = (z) => (z <= 0 ? 1 : z >= 1 ? 0 : Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)));
/** Damping ratio giving overshoot Mp (fraction, 0 < Mp < 1). */
export const zetaOfMp = (m) => { const l = Math.log(m); return -l / Math.sqrt(Math.PI * Math.PI + l * l); };
/** Format seconds or a number or "–" for null. */
export const fx = (x, d = 2) => (x === null || x === undefined || !isFinite(x) ? '–' : String(+x.toFixed(d)).replace('-', '−'));
/**
 * Delay-differential loop for the plant e^{-θ s}/(τ s + 1) (τ = 0: the pure delay) under integral control ki/s (kind 'I')
 * or proportional control k (kind 'P'): unit-step response by a fixed-step scheme with a history buffer.
 * 'I' (τ = 0): u' = ki (r − y), y(t) = u(t − θ).  'P' (τ > 0): τ y' = −y + k (r − y)(t − θ).
 * Returns y at t = 0, dt, … (T/dt steps).
 */
export function ddeStep(kind, gain, theta, tau, T, dt = 0.01) {
  const N = Math.round(T / dt), d = Math.max(1, Math.round(theta / dt)), y = new Float64Array(N + 1), u = new Float64Array(N + 1);
  const a = tau > 0 ? 1 - Math.exp(-dt / tau) : 0;
  for (let n = 0; n < N; n++) {
    if (kind === 'I') {
      const yn = n >= d ? u[n - d] : 0;
      y[n] = yn; u[n + 1] = u[n] + dt * gain * (1 - yn);
    } else {
      const en = n >= d ? 1 - y[n - d] : 0;
      u[n] = en; y[n + 1] = y[n] + a * (gain * en - y[n]);
    }
  }
  if (kind === 'I') y[N] = N >= d ? u[N - d] : 0;
  return y;
}
