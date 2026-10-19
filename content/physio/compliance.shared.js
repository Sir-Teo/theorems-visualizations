/** Saturating illustrative vessel law; its finite capacity cannot accommodate arbitrary added volume. */
export const vesselVolume = (m, pressure) => m.Vu - m.C0 * m.pinf * Math.expm1(-pressure / m.pinf);
export function pressureForVolume(m, volume) {
  const fraction = (volume - m.Vu) / (m.C0 * m.pinf);
  if (fraction >= 1) return Infinity;
  return -m.pinf * Math.log1p(-fraction);
}
export const vesselCompliance = (m, pressure) => m.C0 * Math.exp(-pressure / m.pinf);
