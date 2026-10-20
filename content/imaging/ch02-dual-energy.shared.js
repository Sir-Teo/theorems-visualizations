// Private numerical domain for the positive two-material attenuation rows in item 2.9.
// Exact singularity is a rank failure, not an arbitrary conditioning cutoff.
export function twoMaterialSystem(a11, a12, a21, a22) {
  if (![a11, a12, a21, a22].every(x => Number.isFinite(x) && x > 0)) throw new RangeError('Positive finite attenuation coefficients required');
  const det = a11 * a22 - a12 * a21;
  return { a11, a12, a21, a22, det, singular: det === 0,
    rowAngleProxy: det === 0 ? null : Math.hypot(a11, a12) * Math.hypot(a21, a22) / Math.abs(det) };
}

export function solveTwoMaterial(system, A1, A2) {
  if (!Number.isFinite(A1) || !Number.isFinite(A2)) throw new RangeError('Finite measured log attenuations required');
  const { a11, a12, a21, a22, det, singular } = system;
  if (singular) {
    // Positive dependent rows have rank one. Equal-energy rows are identical.
    const consistent = a11 === a21 && a12 === a22 ? A1 === A2 : a11 * A2 === a21 * A1 && a12 * A2 === a22 * A1;
    return { status: consistent ? 'nonunique' : 'inconsistent', bone: null, soft: null };
  }
  // Preserve the original offered-domain inverse arithmetic for every nonzero determinant.
  return { status: 'unique', bone: (a22 * A1 - a12 * A2) / det, soft: (-a21 * A1 + a11 * A2) / det };
}
