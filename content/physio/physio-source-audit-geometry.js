// Audited ideal-tube/branching/static-volume models; SI unless a name says otherwise.
export function tubeFlow(r, L, mu, dP, density = 1060) {
  const umax = dP * r * r / (4 * mu * L), Q = Math.PI * r * r * umax / 2;
  return { Q, umax, mean: umax / 2, tau: dP * r / (2 * L), resistance: dP / Q,
    Re: density * (umax / 2) * (2 * r) / mu };
}
export function murrayRadius(Q, m, mu = .0035) {
  return Math.cbrt(4 * Q * Math.sqrt(mu / m) / Math.PI);
}
export function murrayCost(r, Q, m, mu = .0035) {
  const pump = 8 * mu * Q * Q / (Math.PI * r ** 4), volume = m * Math.PI * r * r;
  return { pump, volume, total: pump + volume };
}
export const COMPLIANCE_MODELS = Object.freeze([
  Object.freeze({ Vu: 500, C0: 2.2, pinf: 250 }),
  Object.freeze({ Vu: 2800, C0: 110, pinf: 25 }),
]);
export const vesselVolume = (m, P) => m.Vu - m.C0 * m.pinf * Math.expm1(-P / m.pinf);
export const vesselCompliance = (m, P) => m.C0 * Math.exp(-P / m.pinf);
export function addedVolumePressure(m, P, dV) {
  const headroom = m.C0 * m.pinf * Math.exp(-P / m.pinf);
  // The saturating constitutive model has no finite solution at/above its capacity.
  return dV < headroom ? -m.pinf * Math.log1p(-dV / headroom) : null;
}
// Area column of Keener/Sneyd author manuscript control.pdf, Table 11.1 p.484.
// Its separate velocity column is NOT used: recompute all velocities at one Q.
export const VESSEL_AREAS_CM2 = Object.freeze([2.5, 20, 40, 2500, 250, 80, 8]);
export function classFlow(litresPerMinute, recruitment, lengthCm) {
  const Q = litresPerMinute * 1000 / 60;
  const area = VESSEL_AREAS_CM2.map((a, i) => i === 3 ? a * recruitment : a);
  const velocity = area.map(a => Q / a);
  return { Q, area, velocity, transit: lengthCm / velocity[3] };
}
