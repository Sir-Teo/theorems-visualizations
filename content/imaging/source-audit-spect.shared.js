import { exitLen, ellAt } from './ch04.shared.js';
// Exact constant-cell source integral, including attenuation within the emitting
// cell; h is the ray step and mu is attenuation per box-length unit.
export const spectCellAudit = (activity, mu, h) => activity * (mu === 0 ? h : -Math.expm1(-mu * h) / mu);
export function spectSinoAudit(act, mu, W, sc, muBox) {
  const out = new Float64Array(sc.nA * sc.nd), tmax = Math.SQRT2, ns = 2 * W, h = 2 * tmax / ns;
  for (let k = 0; k < sc.nA; k++) for (let j = 0; j < sc.nd; j++) {
    const c = sc.cs[k], sn = sc.sn[k], s = sc.sOf(j); let att = 1, acc = 0;
    for (let i = ns - 1; i >= 0; i--) {
      const t = -tmax + (i + .5) * h, x = s * c - t * sn, y = s * sn + t * c, px = Math.floor((x + 1) * W / 2), py = Math.floor((1 - y) * W / 2);
      if (px < 0 || px >= W || py < 0 || py >= W) continue;
      const id = py * W + px, localMu = muBox * mu[id];
      acc += att * spectCellAudit(act[id], localMu, h); att *= Math.exp(-localMu * h);
    }
    out[k * sc.nd + j] = acc;
  }
  return out;
}
export function changFactorAudit(E, W, nA, muBox) {
  const out = new Float64Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const x = -1 + (i + .5) * 2 / W, y = 1 - (j + .5) * 2 / W; let sum = 0;
    if (!ellAt([E], x, y)) { out[j * W + i] = 1; continue; }
    for (let k = 0; k < nA; k++) { const th = 2 * Math.PI * k / nA; sum += Math.exp(-muBox * exitLen(E, x, y, -Math.sin(th), Math.cos(th))); }
    out[j * W + i] = nA / sum;
  }
  return out;
}
export const conjugateCorrectionAudit = (p1, p2, mu, chord) => chord > 0 ? Math.sqrt(Math.max(0, p1) * Math.max(0, p2)) * Math.exp(mu * chord / 2) : 0;
