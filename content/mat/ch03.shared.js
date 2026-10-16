// Materials Science — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
// Re-exports the chapter-1 helpers (ch02 keeps its helpers local), and adds the dislocation toolbox:
// isotropic-elasticity displacement fields of straight edge and screw dislocations (Volterra construction; Hirth & Lothe,
// Theory of Dislocations), a 2D atom array displaced by them, nearest-neighbour bonds found from the displaced positions,
// and a Burgers-circuit walker that follows the real crystal, not the reference one.
export * from './ch01.shared.js';

/** Edge dislocation, Burgers vector b along +x, line along z, core at the origin; branch cut along the negative x-axis
 *  (the slip plane behind the core). Returns the in-plane displacement [ux, uy] of the point (x, y) (units of b·b0). */
export function edgeU(x, y, b = 1, nu = 0.3) {
  const r2 = x * x + y * y + 1e-9, th = Math.atan2(y, x), k = b / (2 * Math.PI);
  return [k * (th + (x * y) / (2 * (1 - nu) * r2)), -k * (((1 - 2 * nu) / (4 * (1 - nu))) * Math.log(r2) + (x * x - y * y) / (4 * (1 - nu) * r2))];
}
/** Hydrostatic compression (positive = squeezed) of an edge dislocation, up to the factor μb(1+ν)/(3π(1-ν)); core-regularised. */
export function edgeCompress(x, y, rc = 0.7) { return y / (x * x + y * y + rc * rc); }
/** Screw dislocation: out-of-plane displacement u_z = b θ / 2π. */
export const screwUz = (x, y, b = 1) => (b * Math.atan2(y, x)) / (2 * Math.PI);

/**
 * A square-lattice atom array of (2N+1) x (2M+1) sites, lattice constant 1, displaced by the edge-dislocation field with its core at (cx, cy)
 * (use half-integers so the core sits between atoms) and Burgers vector `b` (+1 or -1; 0 = perfect crystal).
 * Returns {atoms: [{i, j, x, y, c}], bonds: [[a, b]], at(i, j)}.
 */
export function edgeCrystal(N, M, cx, cy, b = 1, nu = 0.3) {
  const W = 2 * N + 1, H = 2 * M + 1, atoms = new Array(W * H);
  for (let j = -M; j <= M; j++) for (let i = -N; i <= N; i++) {
    const x0 = i - cx, y0 = j - cy, u = b ? edgeU(x0, y0, b, nu) : [0, 0];
    atoms[(j + M) * W + (i + N)] = { i, j, x: i + u[0], y: j + u[1], c: b ? b * edgeCompress(x0, y0) : 0 };
  }
  const at = (i, j) => (i < -N || i > N || j < -M || j > M ? null : atoms[(j + M) * W + (i + N)]);
  const bonds = [];
  for (const a of atoms) for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
    if (dj < 0 || (dj === 0 && di <= 0)) continue;
    const q = at(a.i + di, a.j + dj);
    if (q && Math.hypot(q.x - a.x, q.y - a.y) < 1.32) bonds.push([a, q]);
  }
  return { atoms, bonds, at, N, M };
}

/** Walk n steps in direction (sx, sy) through the real crystal: always hop to the atom nearest to (current + step). Returns the visited atoms, or null if lost. */
export function walkSteps(cr, start, sx, sy, n) {
  const out = [start]; let cur = start;
  for (let k = 0; k < n; k++) {
    const tx = cur.x + sx, ty = cur.y + sy; let best = null, bd = 0.45;
    for (const a of cr.atoms) { const d = Math.hypot(a.x - tx, a.y - ty); if (d < bd) { bd = d; best = a; } }
    if (!best) return out;
    out.push(best); cur = best;
  }
  return out;
}

/** Lattice vectors of the common cubic and hexagonal families. */
export const permSigns = (h, k, l) => {
  const seen = new Set(), out = [];
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const p of perms) for (let s = 0; s < 8; s++) {
    const a = [h, k, l], w = [a[p[0]], a[p[1]], a[p[2]]].map((x, t) => (s >> t & 1 ? -x : x));
    const key = w.join(',');
    if (!seen.has(key)) { seen.add(key); out.push(w); }
  }
  return out;
};
const sameLine = (u, w) => { const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; return c.every((x) => x === 0); };
/** Distinct planes (up to sign) of a cubic family, e.g. {111}. */
export function planeFamily(h, k, l) { const out = []; for (const p of permSigns(h, k, l)) if (!out.some((q) => sameLine(p, q))) out.push(p); return out; }
/** All slip systems (plane, direction) of the family {hkl}<uvw>: directions of the family lying in the plane, up to sign. */
export function slipSystems(plane, dir) {
  const out = [];
  for (const n of planeFamily(...plane)) { const ds = []; for (const d of permSigns(...dir)) if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] === 0 && !ds.some((q) => sameLine(q, d))) ds.push(d); for (const d of ds) out.push({ n, d }); }
  return out;
}
/** Schmid factor cos φ cos λ for a tensile axis t (unit vector) on a system {n, d}. */
export function schmid(t, n, d) {
  const nn = Math.hypot(...n), dn = Math.hypot(...d);
  return (Math.abs(t[0] * n[0] + t[1] * n[1] + t[2] * n[2]) / nn) * (Math.abs(t[0] * d[0] + t[1] * d[1] + t[2] * d[2]) / dn);
}
export const dir3 = (a, b, c) => { const m = Math.hypot(a, b, c); return [a / m, b / m, c / m]; };
