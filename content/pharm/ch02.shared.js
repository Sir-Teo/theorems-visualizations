// Pharmacology — Chapter 2: helpers shared by the items of ch02.js
export * from './ch01.shared.js';

export const LN2 = Math.LN2;
/** Half-life (h) from clearance (L/h) and volume (L): t½ = ln2 · V / CL. */
export const halfLife = (CL, V) => (LN2 * V) / CL;

/**
 * Integrate dA/dt = R_i − k·A with RK4 through constant-input segments.
 * segs = [[tEnd_1, R_1], [tEnd_2, R_2], …] (the last tEnd is the end of the run), n = RK4 steps per segment.
 * Returns {t, A} sampled on a uniform grid within each segment.
 */
export function integrateSegs(k, segs, A0, n = 400) {
  const t = [], A = [];
  let y = [A0], t0 = 0;
  for (const [t1, R] of segs) {
    if (t1 <= t0) continue;
    const h = (t1 - t0) / n;
    for (let i = 0; i < n; i++) {
      t.push(t0 + i * h); A.push(y[0]);
      const f = (yy) => [R - k * yy[0]];
      const k1 = f(y), k2 = f([y[0] + (h / 2) * k1[0]]), k3 = f([y[0] + (h / 2) * k2[0]]), k4 = f([y[0] + h * k3[0]]);
      y = [y[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])];
    }
    t0 = t1;
  }
  t.push(t0); A.push(y[0]);
  return { t, A };
}
/** First time the sampled curve (ts, ys) reaches `level` going up (interpolated), or NaN. */
export function crossUp(ts, ys, level) {
  for (let i = 1; i < ts.length; i++) if (ys[i - 1] < level && ys[i] >= level) return ts[i - 1] + ((level - ys[i - 1]) / (ys[i] - ys[i - 1])) * (ts[i] - ts[i - 1]);
  return NaN;
}
/** First time the sampled curve falls to `level` (interpolated, linear in log y), or NaN. */
export function crossDown(ts, ys, level) {
  for (let i = 1; i < ts.length; i++) if (ys[i - 1] > level && ys[i] <= level) {
    const f = Math.log(ys[i - 1] / level) / Math.log(ys[i - 1] / ys[i]);
    return ts[i - 1] + f * (ts[i] - ts[i - 1]);
  }
  return NaN;
}
