// Electromagnetism — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
// Re-exports the Chapter 3 helpers (which re-export Chapter 2's: pot, fld, KV, heatPot, levels, hess3, eig2 …).
// Units as before: cm, nC, volts, V/cm. A charge is {x, y, z?, q}.
export * from './ch03.shared.js';
import { KV, legendre } from './ch03.shared.js';

/** Multipole moments of charges cl about the origin: net charge Q, dipole p = Σ q r, and the traceless quadrupole tensor Θ_ij = Σ q (3 x_i x_j − r² δ_ij). */
export function moments(cl, ox = 0, oy = 0, oz = 0) {
  let Q = 0; const p = [0, 0, 0], T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const c of cl) {
    const r = [c.x - ox, c.y - oy, (c.z || 0) - oz], r2 = r[0] * r[0] + r[1] * r[1] + r[2] * r[2];
    Q += c.q;
    for (let i = 0; i < 3; i++) { p[i] += c.q * r[i]; for (let j = 0; j < 3; j++) T[i][j] += c.q * (3 * r[i] * r[j] - (i === j ? r2 : 0)); }
  }
  return { Q, p, T };
}
/** Potential (V) at (x, y, z) of the multipole expansion of cl about the origin, truncated after order L (exact Legendre series, valid for r beyond every charge). */
export function multV(cl, L, x, y, z = 0) {
  const r = Math.sqrt(x * x + y * y + z * z); let s = 0;
  for (const c of cl) {
    const a = Math.sqrt(c.x * c.x + c.y * c.y + (c.z || 0) ** 2);
    if (a < 1e-12) { s += c.q / r; continue; }
    const P = legendre(L, (c.x * x + c.y * y + (c.z || 0) * z) / (a * r));
    for (let l = 0; l <= L; l++) s += (c.q * Math.pow(a, l) * P[l]) / Math.pow(r, l + 1);
  }
  return KV * s;
}
/** Associated Legendre function P_l^m(x) without the Condon–Shortley phase. */
export function Plm(l, m, x) {
  let pmm = 1;
  if (m > 0) { const s = Math.sqrt(Math.max(0, 1 - x * x)); let f = 1; for (let i = 1; i <= m; i++) { pmm *= f * s; f += 2; } }
  if (l === m) return pmm;
  let p1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return p1;
  let pl = 0;
  for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = pl; }
  return pl;
}
const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
/** Real orthonormal spherical harmonic Y_{l,m} (m = −l…l; m < 0 is the sin mφ partner) at the direction of the vector (x, y, z). */
export function realY(l, m, x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z) || 1, ct = z / r, ph = Math.atan2(y, x), am = Math.abs(m);
  const N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (fact(l - am) / fact(l + am)));
  if (m === 0) return N * Plm(l, 0, ct);
  return Math.SQRT2 * N * Plm(l, am, ct) * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph));
}
/** Spherical-harmonic moments q_lm = Σ q r'^l Y_lm(n') of charges cl about the origin. */
export function qlm(cl, l, m) {
  let s = 0;
  for (const c of cl) { const r = Math.sqrt(c.x * c.x + c.y * c.y + (c.z || 0) ** 2); s += c.q * (l === 0 ? 1 : Math.pow(r, l)) * realY(l, m, c.x, c.y, c.z || 0); }
  return s;
}
/** Rotate a point about the z axis by a, then about the y axis by b (radians). */
export function rot3(p, a, b) {
  const x1 = p[0] * Math.cos(a) - p[1] * Math.sin(a), y1 = p[0] * Math.sin(a) + p[1] * Math.cos(a), z1 = p[2];
  return [x1 * Math.cos(b) + z1 * Math.sin(b), y1, -x1 * Math.sin(b) + z1 * Math.cos(b)];
}
/** Symmetric 3×3 eigen-decomposition by Jacobi sweeps: {values, vectors} (vectors[i] is the eigenvector of values[i]), sorted by descending value. */
export function eig3(A) {
  const a = A.map((r) => r.slice()), V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) off += a[i][j] * a[i][j];
    if (off < 1e-24) break;
    for (let p = 0; p < 2; p++) for (let q = p + 1; q < 3; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < 3; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
  return { values: idx.map((i) => a[i][i]), vectors: idx.map((i) => [V[0][i], V[1][i], V[2][i]]) };
}
/** Signed colour for a charge q, as the chapter-2 convention (red positive, blue negative). Re-exported for convenience. */
export const fmtQ = (q) => (q > 0 ? '+' : q < 0 ? '−' : '') + String(+Math.abs(q).toFixed(2));
