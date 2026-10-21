// Explicit parameters of the atlas's illustrative, quasi-static transistor models.
import { mos, mosRegion, bisectDec } from './ch04.shared.js';
export function mosSmallSignal(vg, vd, vt, k, lam = 0) {
  const ov = vg - vt, region = mosRegion(vg, vd, vt);
  if (ov <= 0) return { region, gm: 0, gds: 0, ro: Infinity };
  const a = 1 + lam * vd;
  const gm = region === 'triode' ? k * vd * a : k * ov * a;
  const gds = region === 'triode' ? k * ((ov - vd) * a + lam * (ov * vd - vd * vd / 2)) : lam * k * ov * ov / 2;
  return { region, gm, gds, ro: gds > 0 ? 1 / gds : Infinity };
}
export function mosSwitchPoint(vg, R, V = 5, vt = 1, k = .002, lam = .02) {
  const Ron = vg > vt ? 1 / (k * (vg - vt)) : Infinity;
  const sw = Number.isFinite(Ron) ? { vo: V * Ron / (R + Ron), i: V / (R + Ron), Ron } : { vo: V, i: 0, Ron };
  const vo = bisectDec(x => (V - x) / R - mos(vg, x, vt, k, lam), 0, V);
  return { sw, transistor: { vo, i: (V - vo) / R } };
}
// Smooth output-knee illustration, NOT the Ebers–Moll junction-bias model.
export const bjtCurrent = (ib, vce, beta, VA = 80, Vs = .12) => beta * ib * (1 + vce / VA) * (-Math.expm1(-vce / Vs));
export function bjtPoint(ibMicro, beta, R, V = 10) {
  const vce = bisectDec(x => (V - x) / R - bjtCurrent(ibMicro * 1e-6, x, beta), 0, V);
  return { vce, i: (V - vce) / R };
}
