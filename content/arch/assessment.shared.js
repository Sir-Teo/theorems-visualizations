/** Ring tension for equally spaced radial gore forces, and its continuum approximation. */
export const discreteRingTension = (horizontalForce, gores) => horizontalForce / (2 * Math.sin(Math.PI / gores));
export const continuumRingTension = (horizontalForce, gores) => gores * horizontalForce / (2 * Math.PI);
/** A diametral slice contains two opposite gores. */
export const wholeDomeWeight = (diametralWeight, gores) => diametralWeight * gores / 2;
/** A groin vault has open semicircular edge arches; the lower envelope is a cloister vault. */
export const groinHeight = (R, x, y) => Math.sqrt(Math.max(0, R * R - Math.min(x * x, y * y)));

/** Spherical cap of any positive rise; unlike a height graph, this includes over-hemispherical caps. */
export function capProfile(radius, rise, divisions = 24) {
  const R = (radius * radius + rise * rise) / (2 * rise), angle = 2 * Math.atan(rise / radius);
  return Array.from({ length: divisions + 1 }, (_, i) => {
    const theta = angle * i / divisions;
    return [R * Math.sin(theta), rise - R + R * Math.cos(theta)];
  });
}

/** Static resultant through a rectangular pier, including an explicit additional flyer dead load. */
export function pinnaclePier(H, width, pinnacle, { inner = 3.6, flyerHeight = 10.2, topHeight = 14, slope = 2.8 / 3.6, gamma = 22, flyerDeadLoad = 26 } = {}) {
  const centre = inner + width / 2, outer = inner + width, Wtop = gamma * width * (topHeight - flyerHeight), VB = H * slope + flyerDeadLoad;
  const X = depth => (VB * inner + (pinnacle + Wtop + gamma * width * depth) * centre + H * depth) / (VB + pinnacle + Wtop + gamma * width * depth);
  // The toe-moment inequality is affine in depth: endpoints give its exact maximum.
  const required = depth => (VB * inner + (Wtop + gamma * width * depth) * centre + H * depth - outer * (VB + Wtop + gamma * width * depth)) / (width / 2);
  const need = Math.max(0, required(0), required(flyerHeight));
  return { xc: centre, xo: outer, Wtop, VB, X, need, worst: Math.min(outer - X(0), outer - X(flyerHeight)) };
}
