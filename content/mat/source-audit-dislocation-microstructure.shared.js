// Classical lattice geometry and isolated isotropic partials; no material calibration.
export const twinSpacing = 1 / Math.sqrt(3);
export const projectedRowPeriod = Math.sqrt(6) / 4;
export const twinLayerShift = 1 / Math.sqrt(6);
export const wrapRow = x => x - projectedRowPeriod * Math.round(x / projectedRowPeriod);
export const rowPhase = m => wrapRow(m / Math.sqrt(6));
export const twinRowPhase = (m, lower, fraction) => rowPhase(m) + fraction * twinLayerShift * (m - lower);
export const mirrorRowError = (m, lower, fraction) => Math.abs(wrapRow(twinRowPhase(m, lower, fraction) - rowPhase(2 * lower - m)));
export function rowSites(m, phase, xmin, xmax) {
  const out = [];
  for (let k = Math.ceil((xmin - phase) / projectedRowPeriod); k <= Math.floor((xmax - phase) / projectedRowPeriod); k++) out.push([phase + k * projectedRowPeriod, m * twinSpacing]);
  return out;
}
export const hcpSignedShear = g => (g * g - 3) / (Math.sqrt(3) * g);
export function partialBalance(GGPa, aNm, gammaMJ, kind, nu = .34) {
  if (!(GGPa > 0 && aNm > 0 && gammaMJ > 0 && nu > -1 && nu < .5) || !['edge', 'screw'].includes(kind)) throw new RangeError('invalid isolated-partial parameters');
  const bp = aNm / Math.sqrt(6), factor = kind === 'edge' ? (2 + nu) / (1 - nu) : (2 - 3 * nu) / (1 - nu);
  const coefficient = GGPa * 1e9 * (bp * 1e-9) ** 2 * factor / (8 * Math.PI); // force*distance per unit line length, J/m
  const gamma = gammaMJ * 1e-3, equilibrium = coefficient / gamma * 1e9;
  return { bp, gamma, coefficient, equilibrium, ratio: dNm => equilibrium / dNm, energy: dNm => -coefficient * Math.log(dNm) + gamma * dNm * 1e-9 };
}
// Registry diagram, not atom positions or a resolved partial core. The final
// region differs by a full lattice translation and has the same ABC letters.
export function stackingRegistry(fault = false) {
  const letters = Array.from({ length: 6 }, (_, n) => 'ABC'[(n + (fault && n >= 3 ? 1 : 0)) % 3]);
  const hcp = [];
  for (let n = 1; n < 5; n++) if (letters[n - 1] === letters[n + 1]) hcp.push(n);
  return { letters, hcp };
}
