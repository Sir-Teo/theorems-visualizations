// Weinmann, Hruska & O'Connor (2009), Methods: Eqs.1-6 and near-field section.
// Geometry-only approximation; no detector efficiency or scatter simulation.
export function collimatorAudit(d, length, septum, distance, attenuationPerMM, intrinsic = 3.5) {
  const effective = length - 2 / attenuationPerMM;
  const openArea = Math.sqrt(3) * d * d / 2;
  const unitArea = Math.sqrt(3) * (d + septum) ** 2 / 2;
  const efficiency = openArea * openArea / (4 * Math.PI * effective * effective * unitArea);
  const resolution = d * (effective + distance) / effective;
  const minimumDistance = length / 2 + length * septum / d;
  const path = septum * length / (2 * d + septum);
  return {
    effective, efficiency, resolution, system: Math.hypot(resolution, intrinsic), minimumDistance,
    manyHole: distance >= minimumDistance, septalTransmission: Math.exp(-attenuationPerMM * path),
    logSlope: 2 + 2 * septum / (d + septum),
    // Exact solution of exp(-mu * t*L/(2d+t)) <= .05; not a count correction.
    minimumSeptum: attenuationPerMM * length > -Math.log(.05)
      ? 2 * d * -Math.log(.05) / (attenuationPerMM * length + Math.log(.05)) : Infinity,
    doubledEfficiencyRatio: 16 * (d + septum) ** 2 / (2 * d + septum) ** 2,
  };
}
