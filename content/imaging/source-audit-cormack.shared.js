// Original1963 circular specimen; all lengths cm, attenuation cm^-1.
export const CORMACK1963_AUDIT = Object.freeze({ radius: 10, alloyRadius: 5, coreRadius: .565, coreMu: .150, alloyMu: .161, woodMu: .0340 });
const C = CORMACK1963_AUDIT;
const layers = [[C.woodMu, C.radius], [C.alloyMu - C.woodMu, C.alloyRadius], [C.coreMu - C.alloyMu, C.coreRadius]];
export function cormackMuAudit(r) { return r < C.coreRadius ? C.coreMu : r < C.alloyRadius ? C.alloyMu : r < C.radius ? C.woodMu : 0; }
export function cormackProjectionAudit(s) { return layers.reduce((z, [mu, R]) => z + 2 * mu * Math.sqrt(Math.max(0, R * R - s * s)), 0); }
export function cormackExactJAudit(r) { return layers.reduce((z, [mu, R]) => z + mu * Math.max(0, R - r), 0); }
export function cormackBeamAudit(s, width, panels = 120) {
  if (width === 0) return cormackProjectionAudit(s);
  const cuts = [-width / 2, width / 2];
  for (const [, radius] of layers) for (const sign of [-1, 1]) {
    const u = sign * radius - s; if (u > cuts[0] && u < cuts[1]) cuts.push(u);
  }
  cuts.sort((a, b) => a - b); let transmission = 0;
  for (let j = 1; j < cuts.length; j++) {
    const lo = cuts[j - 1], span = cuts[j] - lo, h = Math.PI / panels; let sum = 0;
    // Sin-squared map regularizes square-root chord endpoints at every material interface.
    for (let k = 1; k < panels; k++) {
      const t = k * h, u = lo + span * (1 - Math.cos(t)) / 2;
      sum += (k % 2 ? 4 : 2) * Math.exp(-cormackProjectionAudit(s + u)) * span * Math.sin(t) / 2;
    }
    transmission += sum * h / 3;
  }
  return -Math.log(transmission / width);
}
export function cormackJAudit(r, offsets, data) {
  if (r <= 0) return data[0] / 2;
  if (r >= C.radius) return 0;
  let total = 0;
  // Integrate each linear data segment exactly after s=r/cos(theta).
  for (let k = 1; k < offsets.length; k++) {
    const lo = Math.max(r, offsets[k - 1]), hi = Math.min(C.radius, offsets[k]); if (hi <= lo) continue;
    const b = (data[k] - data[k - 1]) / (offsets[k] - offsets[k - 1]), a = data[k - 1] - b * offsets[k - 1];
    total += a * (Math.acos(r / hi) - Math.acos(r / lo)) + b * r * Math.log((hi + Math.sqrt(hi * hi - r * r)) / (lo + Math.sqrt(lo * lo - r * r)));
  }
  return total / Math.PI;
}
