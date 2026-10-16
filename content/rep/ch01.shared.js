// Representation Theory — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports, no runtime needed).
//
// House conventions for the whole collection:
//  * A finite group is stored by its multiplication table: {n, L (TeX labels), mul[g][h] = index of gh, inv[g], e: 0}.
//  * The dihedral groups D_m (D_3 = S_3) are built as symmetries of a regular m-gon whose vertices 0, 1, …, m−1 run
//    clockwise from the top (m odd) or top-left (m even). Elements 0..m−1 are the rotations r^a (vertex k ↦ k+a);
//    elements m..2m−1 are the reflections s r^a (vertex k ↦ −(k+a)), s fixing vertex 0. Product gh means "h first, then g".
//  * A representation is {dim, mats: [one matrix per group element], tex, name}; matrices are lists of rows.
//  * G acts on functions by (g·f)(x) = f(g⁻¹x), on arrays by ρ(g) X σ(g)ᵀ (tensor products), on V* by ρ(g⁻¹)ᵀ.

export const TAU = 2 * Math.PI;
export const EC = ['blue', 'orange', 'green', 'purple', 'red', 'teal', 'gold', 'pink'];
/** Palette colour for element k of a group of order n (cycles through eight names). */
export const ecol = (k) => EC[k % 8];

// ---------------------------------------------------------------- numbers and text
/** Number for TeX: d decimals, trailing zeros trimmed, never "-0". */
export function nm(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const t = Number(x.toFixed(d));
  return t === 0 ? '0' : String(t);
}
/** The same for canvas text (real minus sign). */
export const nmc = (x, d = 2) => nm(x, d).replace('-', '−');
export const matT = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => nm(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** Matrix as TeX with the entries nicely recognised (0, ±1, ±½, ±√3/2 …) when they are, else decimals. */
export function matN(A, d = 2) {
  const f = (x) => {
    const t = [[0, '0'], [1, '1'], [-1, '-1'], [0.5, '\\tfrac12'], [-0.5, '-\\tfrac12'], [Math.sqrt(3) / 2, '\\tfrac{\\sqrt3}{2}'], [-Math.sqrt(3) / 2, '-\\tfrac{\\sqrt3}{2}']];
    for (const [val, s] of t) if (Math.abs(x - val) < 1e-9) return s;
    return nm(x, d);
  };
  return `\\begin{pmatrix}${A.map((r) => r.map(f).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
}

// ---------------------------------------------------------------- real matrices (lists of rows)
export const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
export const mv = (A, x) => A.map((r) => r.reduce((s, a, k) => s + a * x[k], 0));
export const tp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
export const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
export const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
export const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
export const msc = (A, k) => A.map((r) => r.map((x) => x * k));
export const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
export const trace = (A) => A.reduce((s, r, i) => s + r[i], 0);
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const len = (a) => Math.hypot(...a);
export const unit = (a) => { const l = len(a) || 1; return a.map((x) => x / l); };
export const vsc = (a, k) => a.map((x) => x * k);
export const vadd = (a, b) => a.map((x, i) => x + b[i]);
export const vsub = (a, b) => a.map((x, i) => x - b[i]);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const kron = (A, B) => {
  const out = [];
  for (let i = 0; i < A.length; i++) for (let k = 0; k < B.length; k++) out.push(A[i].flatMap((a) => B[k].map((b) => a * b)));
  return out;
};
/** Inverse by Gauss–Jordan with partial pivoting (null when singular). */
export function inv(A) {
  const n = A.length, M = A.map((r, i) => [...r, ...eye(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r) => r.slice(n));
}
export const rot2 = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
export const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
/** Row-major vectorisation of a matrix. */
export const vec = (A) => A.flat();
export const unvec = (x, m, n) => Array.from({ length: m }, (_, i) => x.slice(i * n, (i + 1) * n));

// ---------------------------------------------------------------- the polygon and the dihedral groups
/** Vertices of a regular m-gon (radius 1), clockwise from the top (m odd) or top-left (m even). */
export function polygon(m) {
  const a0 = m % 2 ? Math.PI / 2 : Math.PI / 2 + Math.PI / m;
  return Array.from({ length: m }, (_, k) => [Math.cos(a0 - (TAU * k) / m), Math.sin(a0 - (TAU * k) / m)]);
}
/** The linear map sending vertex k to vertex perm[k] (determined by two independent vertices). */
export function permMatrix(P, perm) {
  const [a, b] = [P[0], P[1]], [c, d] = [P[perm[0]], P[perm[1]]], det = a[0] * b[1] - a[1] * b[0];
  const i2 = [[b[1] / det, -b[0] / det], [-a[1] / det, a[0] / det]];
  return [[c[0] * i2[0][0] + d[0] * i2[1][0], c[0] * i2[0][1] + d[0] * i2[1][1]], [c[1] * i2[0][0] + d[1] * i2[1][0], c[1] * i2[0][1] + d[1] * i2[1][1]]];
}
/** Permutation matrix of a permutation p of {0..n−1}: e_k ↦ e_{p[k]}. */
export function permMat(p) {
  const n = p.length, A = Array.from({ length: n }, () => Array(n).fill(0));
  p.forEach((pk, k) => { A[pk][k] = 1; });
  return A;
}
/** The dihedral group D_m (m ≥ 3; D_3 = S_3) with its vertex permutations and 2×2 matrices. */
export function dihedral(m) {
  const mod = (x) => ((x % m) + m) % m, ks = [...Array(m).keys()];
  const perms = [...ks.map((a) => ks.map((k) => mod(k + a))), ...ks.map((a) => ks.map((k) => mod(-(k + a))))];
  const key = (p) => p.join(','), idx = new Map(perms.map((p, i) => [key(p), i]));
  const comp = (p, q) => q.map((x) => p[x]); // (p∘q)[k] = p[q[k]]
  const mul = perms.map((p) => perms.map((q) => idx.get(key(comp(p, q)))));
  const L = [...ks.map((a) => (a === 0 ? 'e' : a === 1 ? 'r' : `r^{${a}}`)), ...ks.map((a) => (a === 0 ? 's' : a === 1 ? 'sr' : `sr^{${a}}`))];
  const G = { m, n: 2 * m, name: `D${m}`, tex: m === 3 ? 'S_3' : `D_{${m}}`, perms, mul, L, e: 0, pos: polygon(m), isRef: (g) => g >= m };
  G.inv = perms.map((_, g) => mul[g].findIndex((x) => x === 0));
  G.mat = perms.map((p) => permMatrix(G.pos, p));
  return G;
}
/** The cyclic group Z/n as a group record (element a = generator^a). */
export function cyclic(n) {
  const mul = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => (a + b) % n));
  return { n, name: `Z${n}`, tex: `\\mathbb Z/${n}`, mul, L: Array.from({ length: n }, (_, a) => (a === 0 ? 'e' : a === 1 ? 'g' : `g^{${a}}`)), e: 0, inv: Array.from({ length: n }, (_, a) => (n - a) % n) };
}

// ---------------------------------------------------------------- representations and their verification
/**
 * Check ρ(gh) = ρ(g)ρ(h) on every pair, and ρ(e) = I. Returns {err[g][h], max, bad (count), pairs, idErr}.
 * `mats` is indexed by group element; `tol` decides which pairs count as failures.
 */
export function homCheck(G, mats, tol = 1e-9) {
  const n = G.n, err = Array.from({ length: n }, () => Array(n).fill(0));
  let max = 0, bad = 0;
  for (let g = 0; g < n; g++) for (let h = 0; h < n; h++) {
    const e = fro(msub(mats[G.mul[g][h]], mm(mats[g], mats[h])));
    err[g][h] = e; if (e > max) max = e; if (e > tol) bad++;
  }
  const idErr = fro(msub(mats[G.e], eye(mats[0].length)));
  return { err, max, bad, pairs: n * n, idErr };
}
/** Dual representation ρ*(g) = ρ(g⁻¹)ᵀ. */
export const dualMats = (G, mats) => mats.map((_, g) => tp(mats[G.inv[g]]));
/** Tensor product with the Kronecker product, and the Hom(V,W) = V*⊗W matrices σ(g)⊗ρ(g⁻¹)ᵀ. */
export const tensorMats = (A, B) => A.map((a, g) => kron(a, B[g]));

/** The representations of S_3 = D_3 used throughout the chapter (matrices in an orthonormal basis). */
export function s3reps(G = dihedral(3)) {
  const sign = G.perms.map((_, g) => (G.isRef(g) ? -1 : 1));
  return {
    triv: { dim: 1, name: 'trivial', tex: '\\mathbf 1', mats: G.perms.map(() => [[1]]) },
    sign: { dim: 1, name: 'sign', tex: '\\varepsilon', mats: sign.map((s) => [[s]]) },
    std: { dim: 2, name: 'standard', tex: 'V_{\\mathrm{std}}', mats: G.mat },
    perm: { dim: 3, name: 'permutation', tex: 'P', mats: G.perms.map(permMat) },
  };
}

// ---------------------------------------------------------------- drawing helpers
/** An asymmetric letter "F" (centred near the origin, size ≈ 1) that shows orientation under a matrix. */
export const F_SHAPE = [[-0.3, -0.6], [-0.12, -0.6], [-0.12, -0.14], [0.14, -0.14], [0.14, 0.02], [-0.12, 0.02], [-0.12, 0.3], [0.3, 0.3], [0.3, 0.5], [-0.3, 0.5]];
/**
 * Draw the polygon `pos` and the letter F moved by the 2×2 matrix M: vertices labelled by `names`,
 * colour `col` (fill alpha `a`), dashed when `dash`.
 */
export function drawMoved(s, M, pos, o = {}) {
  const col = o.col || 'accent', c = o.c || [0, 0], R = o.R || 1;
  const T = (p) => { const q = mv(M, p); return [c[0] + R * q[0], c[1] + R * q[1]]; };
  const pts = pos.map(T);
  s.poly(pts, { color: col, width: o.width ?? 2.2, fill: o.fill === false ? false : col, fillAlpha: o.a ?? 0.1, dash: o.dash || false });
  if (o.F !== false) s.poly(F_SHAPE.map((p) => T(vsc(p, o.fs ?? 0.62))), { color: col, width: 1.6, fill: col, fillAlpha: o.fa ?? 0.28, dash: o.dash || false });
  if (o.names) pts.forEach(([x, y], k) => {
    const d = Math.hypot(x - c[0], y - c[1]) || 1;
    s.text(o.names[k], x + ((x - c[0]) / d) * 0.2 * R, y + ((y - c[1]) / d) * 0.2 * R, { align: 'center', baseline: 'middle', size: o.size || 14, weight: 700, color: col, math: true });
  });
  return pts;
}
/** Colour of an error: green when it is zero (within tol), red otherwise. */
export const okCol = (e, tol = 1e-9) => (e <= tol ? 'green' : 'red');
/** The maximum over a matrix of numbers. */
export const maxOf = (A) => Math.max(...A.flat());
