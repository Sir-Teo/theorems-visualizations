export function planarSpectrum(l1, l2, theta) {
  const tr = l1 * l1 + 2 * l2 * l2 + 2 * l1 * l2 * Math.cos(theta);
  const w = l1 * l2 * Math.abs(Math.sin(theta));
  const largest = Math.sqrt(tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - w * w)));
  return [largest, largest > 0 ? w / largest : 0];
}

// Analytic stationary points, with positive link ratio. At the isotropic ratio the formulas coincide.
export function bestPlanarAngle(ratio, measure) {
  if (measure === 'w') return Math.PI / 2;
  if (measure === 'smin') return Math.acos(-Math.min(ratio, 1 / (2 * ratio)));
  return Math.acos(-2 * ratio / (1 + 2 * ratio * ratio));
}
