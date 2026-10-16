// History of Technology — Chapter 5 shared helpers (imported by ch05.js and ch05-b.js).
// Re-exports the chapter 4 helpers (dated-evidence strip, water-wheel models, ...) and adds the timekeeping models of this chapter:
// exact pendulum period, the "constant-torque" (verge) oscillator, the nonlinear spring oscillator and small spherical-astronomy formulas.
export * from './ch04.shared.js';

export const D2R = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const DAY = 86400; // seconds

/** Complete elliptic integral of the first kind K(m), parameter m = k^2, by the arithmetic-geometric mean. */
export function ellipK(m) {
  let a = 1, b = Math.sqrt(Math.max(0, 1 - m));
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; }
  return Math.PI / (2 * a);
}
/** T(theta0)/T0 for a simple pendulum released from amplitude theta0 (radians, < pi): (2/pi) K(sin^2(theta0/2)). Exact. */
export const pendulumRatio = (th0) => (2 / Math.PI) * ellipK(Math.sin(th0 / 2) ** 2);
/** Seconds lost per day by a clock whose beat is T = ratio * T0 but which is regulated for T0. (Negative = gains.) */
export const lossPerDay = (ratio) => DAY * (1 - 1 / ratio);

/**
 * "Constant-torque" oscillator, the model used for a verge-and-foliot or an unsprung balance:
 * I theta'' = -tau sgn(theta), amplitude A. Each quarter swing takes sqrt(2 A I / tau); the period is four of them.
 */
export const bangPeriod = (A, I, tau) => 4 * Math.sqrt((2 * A * I) / tau);
/** Angle at time t (period T, amplitude A) of the constant-torque oscillator, piecewise parabolic, starting at theta = A at rest. */
export function bangAngle(t, A, T) {
  const q = T / 4; let s = ((t % T) + T) % T; const k = Math.floor(s / q); s -= k * q; const u = s / q; // u in [0,1) within the quarter
  const acc = u * u, dec = 1 - (1 - u) * (1 - u);
  switch (k) { case 0: return A * (1 - acc); case 1: return -A * dec; case 2: return -A * (1 - acc); default: return A * dec; }
}

/** Period ratio T/T0 of an oscillator with torque -kappa(theta + eps theta^3) and amplitude A (radians), T0 = 2 pi sqrt(I/kappa). Numerical quadrature. */
export function springPeriodRatio(A, eps) {
  const n = 400; let sum = 0; const V = (x) => x * x / 2 + eps * x ** 4 / 4;
  // T = 4 * int_0^A dtheta / sqrt(2 (V(A) - V(theta)) ) ;   substitute theta = A sin(p), p in [0, pi/2]
  for (let i = 0; i < n; i++) {
    const p = ((i + 0.5) / n) * (Math.PI / 2), th = A * Math.sin(p), d = 2 * (V(A) - V(th));
    sum += (A * Math.cos(p)) / Math.sqrt(Math.max(d, 1e-300));
  }
  const T = 4 * sum * (Math.PI / 2 / n);
  return T / (2 * Math.PI);
}

// ---------------------------------------------------------------- small spherical astronomy
export const OBLIQ = 23.44; // degrees, obliquity of the ecliptic
/** Sun's ecliptic longitude (degrees) on day-of-year d (1 = 1 January), low-precision (good to about 1 degree). */
export const sunLon = (d) => ((280.46 + 0.9856 * (d - 1)) % 360 + 360) % 360;
/** Declination (degrees) of the point of the ecliptic at longitude lam (degrees). */
export const eclDec = (lam) => Math.asin(Math.sin(OBLIQ * D2R) * Math.sin(lam * D2R)) / D2R;
/** Right ascension (degrees) of the point of the ecliptic at longitude lam. */
export const eclRA = (lam) => ((Math.atan2(Math.cos(OBLIQ * D2R) * Math.sin(lam * D2R), Math.cos(lam * D2R)) / D2R) + 360) % 360;
/** Altitude (degrees) of an object of declination dec at hour angle H (degrees) seen from latitude lat. */
export function altitude(lat, dec, H) {
  const s = Math.sin(lat * D2R) * Math.sin(dec * D2R) + Math.cos(lat * D2R) * Math.cos(dec * D2R) * Math.cos(H * D2R);
  return Math.asin(clamp(s, -1, 1)) / D2R;
}
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
/** "21 Jun" from a day of year (non-leap). */
export function dayName(d) { d = clamp(Math.round(d), 1, 365); let m = 11; while (CUM[m] >= d) m--; return `${d - CUM[m]} ${MONTHS[m]}`; }
/** Hours as "hh:mm". */
export function hhmm(h) { h = ((h % 24) + 24) % 24; let m = Math.round(h * 60); const hh = Math.floor(m / 60) % 24; m %= 60; return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
/** Format seconds as "3 min 20 s" / "12.3 s". */
export function fmtSec(x) {
  const a = Math.abs(x), sg = x < 0 ? '−' : '';
  if (a < 60) return `${sg}${a.toFixed(a < 10 ? 1 : 0)} s`;
  if (a < 3600) return `${sg}${Math.floor(a / 60)} min ${Math.round(a % 60)} s`;
  return `${sg}${(a / 3600).toFixed(1)} h`;
}
