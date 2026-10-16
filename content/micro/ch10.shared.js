// Microeconomics — Chapter 10: helpers shared by ch10.js, ch10-b.js, ch10-c.js and ch10-d.js (plain named exports).
// Re-exports the Chapter 9 helpers (which re-export Chapter 8's: clamp, GUIDE, bisect, argmax, plateText, sample, …).
// House style of the market-power pictures: demand `accent`, marginal revenue `purple`, marginal cost `orange`, average cost `teal`,
// profit and consumer surplus `green`, deadweight loss and failures `red`, tested/moving points `gold`, price lines `ink`.
// Everything is computed from the demand and cost functions (optima by search, equilibria by root finding), never read off a formula
// that the picture is supposed to confirm; closed forms appear only as a comparison in the readouts.
export * from './ch09.shared.js';


/** Linear inverse demand P(Q) = a − bQ with its marginal revenue a − 2bQ and the price elasticity at Q. */
export function lin(a, b) {
  return { a, b, P: (q) => a - b * q, MR: (q) => a - 2 * b * q, D: (p) => Math.max(0, (a - p) / b), dP: () => -b, eps: (q) => -(a - b * q) / (b * q) };
}
/** Constant-elasticity inverse demand P(Q) = A Q^(−1/e), e > 0 (|elasticity| = e everywhere). */
export function iso(A, e) {
  return { A, e, P: (q) => A * q ** (-1 / e), MR: (q) => A * q ** (-1 / e) * (1 - 1 / e), D: (p) => (p / A) ** -e, dP: (q) => (-A / e) * q ** (-1 / e - 1), eps: () => -e };
}
/** Standard monopoly stage: quantity on x, price on y, box axes with a gutter. */
export function mstage(v, o = {}) {
  return v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, xlabel: 'quantity $Q$', ylabel: 'price $P$', height: 360, ...o });
}
/** Label on a plate at a data point. */
export function tag(s, str, x, y, col = 'ink', st = {}) { s.text(str, x, y, { plate: true, size: 11.5, weight: 700, color: col, ...st }); }
/** Shoelace area of a polygon. */
export function polyArea(pts) { let A = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; A += x1 * y2 - x2 * y1; } return Math.abs(A) / 2; }
/** Numerical integral (Simpson) of f on [a, b]. */
export function integ(f, a, b, n = 200) {
  if (n % 2) n++;
  const h = (b - a) / n; let t = f(a) + f(b);
  for (let i = 1; i < n; i++) t += f(a + i * h) * (i % 2 ? 4 : 2);
  return (t * h) / 3;
}
/** Smallest-gap fixed grid of values lo..hi. */
export const grid = (lo, hi, n) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
/** Run an animation of a value from 0 to 1 over `ms` by requestAnimationFrame; jumps to 1 under --still. Returns stop(). */
export function tween(v, ms, cb, done) {
  if (typeof window !== 'undefined' && window.__vizStill) { cb(1); done && done(); return () => {}; }
  let raf = 0, t0 = null, dead = false;
  const step = (t) => { if (dead) return; if (t0 === null) t0 = t; const u = Math.min(1, (t - t0) / ms); cb(u); v.invalidate(); if (u < 1) raf = requestAnimationFrame(step); else done && done(); };
  raf = requestAnimationFrame(step);
  const stop = () => { dead = true; cancelAnimationFrame(raf); };
  v.onCleanup(stop);
  return stop;
}
