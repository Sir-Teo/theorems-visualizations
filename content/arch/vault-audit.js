// Authored square-bay geometry and conditional VERTICAL load accounting.
// These are not a solved three-dimensional masonry force network.
import { archFromLine } from './ch03.shared.js';
export const VAULT = Object.freeze({ R: 3, gamma: 22, ribWidth: .3, blocks: 24, tolerance: 1e-8 });
const root = u => Math.sqrt(Math.max(0, 1 - u * u));
const F = u => u * Math.asin(u) + root(u) - 1;
const J = u => ((2 * u * u - 1) * Math.asin(u) + u * root(u)) / 4;
export function vaultHeight(x, y, R = VAULT.R, kind = 'groin') {
  if (![x, y, R].every(Number.isFinite) || R <= 0 || Math.abs(x) > R + 1e-12 || Math.abs(y) > R + 1e-12 || !['barrel', 'groin'].includes(kind)) throw new Error('Point outside the square vault bay.');
  const h = s => Math.sqrt(Math.max(0, R * R - s * s));
  return kind === 'barrel' ? h(y) : Math.max(h(x), h(y));
}
export function vaultAccounting(t = .3, R = VAULT.R, gamma = VAULT.gamma) {
  if (![t, R, gamma].every(x => Number.isFinite(x) && x > 0)) throw new Error('Positive finite areal-load parameters required.');
  const w = gamma * t, barrelArea = 2 * Math.PI * R * R, groinArea = 4 * (Math.PI - 2) * R * R;
  return { barrelArea, groinArea, Wbarrel: w * barrelArea, Wgroin: w * groinArea,
    corner: w * groinArea / 4, wall: w * barrelArea / (4 * R),
    // Three-hinged plane-arch candidates under vertical loads only.
    Hdiagonal: Math.SQRT2 * w * R * R * (3 * Math.PI / 4 - 2),
    Hbarrel: w * R * (Math.PI / 2 - 1) };
}
export function vaultWebLoads(t, R = VAULT.R, gamma = VAULT.gamma, N = VAULT.blocks) {
  if (!Number.isFinite(t) || t < 0 || !Number.isFinite(R) || R <= 0 || !Number.isFinite(gamma) || gamma <= 0 || !Number.isInteger(N) || N < 2 || N % 2) throw new Error('Even positive bin inventory and finite nonnegative web load required.');
  const positive = Array.from({ length: N / 2 }, (_, i) => {
    const u0 = 2 * i / N, u1 = 2 * (i + 1) / N, mass = F(u1) - F(u0), moment = J(u1) - J(u0);
    return { P: 2 * gamma * t * R * R * mass, x: Math.SQRT2 * R * moment / mass, s0: R * u0, s1: R * u1 };
  });
  return [...positive.slice().reverse().map(l => ({ ...l, x: -l.x, s0: -l.s1, s1: -l.s0 })), ...positive].map((l, k) => ({ ...l, k }));
}
export function vaultRib({ web = true, webThickness = .15, ribDepth = .7 } = {}) {
  if (typeof web !== 'boolean' || !Number.isFinite(webThickness) || webThickness < .08 || webThickness > .5 || !Number.isFinite(ribDepth) || ribDepth < .1 || ribDepth > 1) throw new Error('Rib controls outside their displayed domain.');
  const { R, gamma, ribWidth, blocks: N, tolerance } = VAULT;
  const pts = Array.from({ length: N + 1 }, (_, i) => { const s = -R + 2 * R * i / N; return [Math.SQRT2 * s, Math.sqrt(Math.max(0, R * R - s * s))]; });
  const g = archFromLine(pts, ribDepth, gamma * ribWidth), loads = vaultWebLoads(web ? webThickness : 0);
  const all = g.blocks.map((b, k) => ({ P: b.W + loads[k].P, x: (b.W * b.cx + loads[k].P * loads[k].x) / (b.W + loads[k].P), k }));
  const total = all.reduce((s, l) => s + l.P, 0), V = total / 2, a = Math.SQRT2 * R;
  const H = (a * V - all.slice(0, N / 2).reduce((s, l) => s - l.P * l.x, 0)) / R;
  const joints = g.joints.map((j, i) => {
    const before = all.slice(0, i), moment = p => (g.c0[0] - p[0]) * V - (g.c0[1] - p[1]) * H - before.reduce((s, l) => s + l.P * (l.x - p[0]), 0);
    const ma = moment(j.a), mb = moment(j.b), fraction = ma / (ma - mb), force = [H, V - before.reduce((s, l) => s + l.P, 0)];
    const point = j.a.map((x, k) => x + fraction * (j.b[k] - x)), compression = force[0] * j.tau[0] + force[1] * j.tau[1];
    return { i, fraction, point, force, compression, residual: moment(point), inside: fraction >= -tolerance && fraction <= 1 + tolerance && compression > tolerance };
  });
  const excess = Math.max(0, ...joints.map(j => Math.max(-j.fraction, j.fraction - 1))) * ribDepth;
  return { g, pts, loads, joints, H, V, total, Wweb: loads.reduce((s, l) => s + l.P, 0), Wrib: g.W,
    contained: joints.every(j => j.inside), excess, residual: Math.max(...joints.map(j => Math.abs(j.residual))), tolerance };
}
export const validVaultCamera = d => !!d && typeof d === 'object' && Number.isFinite(d.yaw) && Math.abs(d.yaw) <= Math.PI && Number.isFinite(d.pitch) && Math.abs(d.pitch) <= 1.45;
export const canonicalVaultYaw = yaw => Math.abs(yaw) <= Math.PI ? yaw : Math.atan2(Math.sin(yaw), Math.cos(yaw));
