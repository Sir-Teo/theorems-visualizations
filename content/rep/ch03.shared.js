// Representation Theory — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports, no runtime needed).
// Everything of chapters 1 and 2 is re-exported.
//
// Conventions added here:
//  * A group record G gets conjugacy classes: G.cls[g] = class index, G.classes[i] = {els, size, rep, cent} (cent = |centraliser|).
//  * A character table is {rows: [{name, tex, d, vals: [complex per class]}], G}. Complex numbers are pairs [re, im].
//  * The tables are *data* (the classical tables); every use checks them (orthonormality, column orthogonality) before drawing.
export * from './ch02.shared.js';
import { TAU, nm, dihedral, cyclic } from './ch02.shared.js';

// ---------------------------------------------------------------- complex numbers
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cconj = (a) => [a[0], -a[1]];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const csc = (a, k) => [a[0] * k, a[1] * k];
export const cexp = (t) => [Math.cos(t), Math.sin(t)];
export const CZ = [0, 0];
export const cis0 = (a, tol = 1e-9) => Math.hypot(a[0], a[1]) < tol;
/** Complex number as TeX (recognises 0, integers, ω = e^{2πi/3} and its conjugate, otherwise decimals). */
export function ctex(z, d = 2) {
  const [a, b] = z;
  if (Math.abs(b) < 1e-9) return nm(a, d);
  if (Math.abs(a + 0.5) < 1e-9 && Math.abs(Math.abs(b) - Math.sqrt(3) / 2) < 1e-9) return b > 0 ? '\\omega' : '\\bar\\omega';
  const im = Math.abs(Math.abs(b) - 1) < 1e-9 ? 'i' : `${nm(Math.abs(b), d)}i`;
  if (Math.abs(a) < 1e-9) return `${b < 0 ? '-' : ''}${im}`;
  return `${nm(a, d)}${b < 0 ? '-' : '+'}${im}`;
}
/** Complex number as plain canvas text. */
export function ctext(z, d = 2) {
  const [a, b] = z, f = (x) => nm(x, d).replace('-', '−');
  if (Math.abs(b) < 1e-9) return f(a);
  if (Math.abs(a + 0.5) < 1e-9 && Math.abs(Math.abs(b) - Math.sqrt(3) / 2) < 1e-9) return b > 0 ? 'ω' : 'ω̄';
  const im = Math.abs(Math.abs(b) - 1) < 1e-9 ? 'i' : `${f(Math.abs(b))}i`;
  if (Math.abs(a) < 1e-9) return `${b < 0 ? '−' : ''}${im}`;
  return `${f(a)}${b < 0 ? '−' : '+'}${im}`;
}

// ---------------------------------------------------------------- complex matrices (lists of rows of [re, im])
export const cm = (A) => A.map((r) => r.map((x) => (Array.isArray(x) ? x : [x, 0])));
export const cI = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [+(i === j), 0]));
export const cmm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => cadd(s, cmul(x, B[k][j])), CZ)));
export const ckron = (A, B) => {
  const out = [];
  for (let i = 0; i < A.length; i++) for (let k = 0; k < B.length; k++) out.push(A[i].flatMap((a) => B[k].map((b) => cmul(a, b))));
  return out;
};
export const ctr = (A) => A.reduce((s, r, i) => cadd(s, r[i]), CZ);
export const cadd2 = (A, B) => A.map((r, i) => r.map((x, j) => cadd(x, B[i][j])));
export const cscale = (A, z) => A.map((r) => r.map((x) => cmul(x, z)));
export const cdsum = (A, B) => {
  const n = A.length, m = B.length, out = Array.from({ length: n + m }, () => Array.from({ length: n + m }, () => [0, 0]));
  A.forEach((r, i) => r.forEach((x, j) => { out[i][j] = x; })); B.forEach((r, i) => r.forEach((x, j) => { out[n + i][n + j] = x; }));
  return out;
};
/** Determinant of a complex matrix by elimination with partial pivoting. */
export function cdet(A) {
  const n = A.length, M = A.map((r) => r.map((x) => [...x]));
  let det = [1, 0];
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (cabs(M[r][c]) > cabs(M[p][c])) p = r;
    if (cabs(M[p][c]) < 1e-14) return [0, 0];
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; det = csc(det, -1); }
    det = cmul(det, M[c][c]);
    const piv = M[c][c], den = piv[0] * piv[0] + piv[1] * piv[1];
    for (let r = c + 1; r < n; r++) {
      const f = cmul(M[r][c], [piv[0] / den, -piv[1] / den]);
      for (let j = c; j < n; j++) M[r][j] = csub(M[r][j], cmul(f, M[c][j]));
    }
  }
  return det;
}
/** The swap operator v⊗w ↦ w⊗v on ℂ^d ⊗ ℂ^d. */
export function swapMat(d) {
  const n = d * d, S = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) S[j * d + i][i * d + j] = 1;
  return S;
}

// ---------------------------------------------------------------- permutation groups
const comp = (p, q) => q.map((x) => p[x]); // (p∘q)[k] = p[q[k]]
/** Cycle type of a permutation, e.g. [3, 1, 1] (sorted decreasingly). */
export function cycleType(p) {
  const seen = Array(p.length).fill(false), out = [];
  for (let i = 0; i < p.length; i++) if (!seen[i]) { let k = i, c = 0; while (!seen[k]) { seen[k] = true; k = p[k]; c++; } out.push(c); }
  return out.sort((a, b) => b - a);
}
/** TeX of a permutation in cycle notation, 1-based, e.g. (1\,2)(3\,4). */
export function cycTex(p) {
  const seen = Array(p.length).fill(false);
  let s = '';
  for (let i = 0; i < p.length; i++) if (!seen[i]) {
    const cyc = []; let k = i; while (!seen[k]) { seen[k] = true; cyc.push(k + 1); k = p[k]; }
    if (cyc.length > 1) s += `(${cyc.join('\\,')})`;
  }
  return s || 'e';
}
/** Attach conjugacy classes (class index per element, class lists, centraliser sizes). */
export function addClasses(G) {
  const n = G.n, cls = Array(n).fill(-1), list = [];
  for (let g = 0; g < n; g++) if (cls[g] < 0) {
    const set = new Set();
    for (let h = 0; h < n; h++) set.add(G.mul[G.mul[h][g]][G.inv[h]]);
    const els = [...set].sort((a, b) => a - b);
    els.forEach((x) => { cls[x] = list.length; });
    list.push({ els, size: els.length, rep: els[0], cent: n / els.length });
  }
  G.cls = cls; G.classes = list;
  return G;
}
/** Reorder the classes so that class i contains element reps[i] (throws when the representatives do not match). */
export function orderClasses(G, reps) {
  if (reps.length !== G.classes.length) throw new Error(`${G.name}: ${G.classes.length} classes but ${reps.length} representatives`);
  const order = reps.map((r) => G.cls[r]);
  if (new Set(order).size !== order.length) throw new Error(`${G.name}: representatives are not in distinct classes`);
  const list = order.map((i, k) => ({ ...G.classes[i], rep: reps[k] }));
  list.forEach((c, i) => c.els.forEach((x) => { G.cls[x] = i; }));
  G.classes = list;
  return G;
}
/** Group generated by permutations of {0..k−1} (identity is element 0). */
export function permGroup(gens, name, tex) {
  const k = gens[0].length, id = [...Array(k).keys()], key = (p) => p.join(',');
  const els = [id], idx = new Map([[key(id), 0]]);
  for (let i = 0; i < els.length; i++) for (const g of gens) {
    const q = comp(g, els[i]), kq = key(q);
    if (!idx.has(kq)) { idx.set(kq, els.length); els.push(q); }
  }
  const mul = els.map((p) => els.map((q) => idx.get(key(comp(p, q)))));
  const G = { n: els.length, name, tex: tex || name, perms: els, mul, e: 0, L: els.map(cycTex), idx, key };
  G.inv = els.map((_, g) => mul[g].findIndex((x) => x === 0));
  return addClasses(G);
}
export const symGroup = (n) => permGroup([[1, 0, ...Array.from({ length: n - 2 }, (_, i) => i + 2)], [...Array.from({ length: n - 1 }, (_, i) => i + 1), 0]], `S${n}`, `S_${n}`);
export const altGroup = (n) => permGroup(Array.from({ length: n - 2 }, (_, k) => { const p = [...Array(n).keys()]; p[0] = 1; p[1] = k + 2; p[k + 2] = 0; return p; }), `A${n}`, `A_${n}`);
/** The element of a permutation group holding the given permutation (array). */
export const elOf = (G, p) => G.idx.get(G.key(p));
/** The quaternion group Q₈ (elements 1, −1, i, −i, j, −j, k, −k). */
export function quaternion() {
  const U = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]]; // table of units 1,i,j,k up to sign
  const SG = [[1, 1, 1, 1], [1, -1, 1, -1], [1, -1, -1, 1], [1, 1, -1, -1]]; // sign of unit_a·unit_b
  const L = ['1', '-1', 'i', '-i', 'j', '-j', 'k', '-k'], u = (g) => g >> 1, s = (g) => (g & 1 ? -1 : 1);
  const m2 = (a, b) => { const sg = s(a) * s(b) * SG[u(a)][u(b)]; return 2 * U[u(a)][u(b)] + (sg < 0 ? 1 : 0); };
  const mul = Array.from({ length: 8 }, (_, a) => Array.from({ length: 8 }, (_, b) => m2(a, b)));
  const G = { n: 8, name: 'Q8', tex: 'Q_8', mul, e: 0, L };
  G.inv = mul.map((r) => r.findIndex((x) => x === 0));
  return addClasses(G);
}

// ---------------------------------------------------------------- character tables
const OM = [-0.5, Math.sqrt(3) / 2], OMB = [-0.5, -Math.sqrt(3) / 2];
const R = (...xs) => xs.map((x) => [x, 0]);
const PHI = (1 + Math.sqrt(5)) / 2;
const row = (name, tex, d, vals) => ({ name, tex, d, vals });

function cyclicTable(n) {
  const G = cyclic(n); addClasses(G); orderClasses(G, [...Array(n).keys()]);
  const rows = Array.from({ length: n }, (_, k) => row(`psi${k}`, `\\psi_{${k}}`, 1, Array.from({ length: n }, (_, a) => cexp((TAU * k * a) / n))));
  return { G, rows, key: `Z${n}` };
}
function dihedralTable(m) {
  const G = dihedral(m); addClasses(G);
  const odd = m % 2 === 1, nr = odd ? (m - 1) / 2 : m / 2;
  const reps = [...Array.from({ length: nr + 1 }, (_, a) => a), m]; if (!odd) reps.push(m + 1);
  orderClasses(G, reps);
  const rows = [];
  const lin = (name, tex, er, es) => row(name, tex, 1, G.classes.map((c) => { const g = c.rep; return [g < m ? er ** g : es * er ** (g - m), 0]; }));
  rows.push(lin('A1', 'A_1', 1, 1), lin('A2', 'A_2', 1, -1));
  if (!odd) rows.push(lin('B1', 'B_1', -1, 1), lin('B2', 'B_2', -1, -1));
  const top = odd ? (m - 1) / 2 : m / 2 - 1;
  for (let k = 1; k <= top; k++) rows.push(row(`E${k}`, top === 1 ? 'E' : `E_${k}`, 2, G.classes.map((c) => [c.rep < m ? 2 * Math.cos((TAU * k * c.rep) / m) : 0, 0])));
  if (m === 3) { rows[0].tex = '\\mathbf 1'; rows[1].tex = '\\varepsilon'; rows[2].tex = 'V'; }
  return { G, rows, key: `D${m}` };
}
function q8Table() {
  const G = quaternion(); orderClasses(G, [0, 1, 2, 4, 6]);
  const rows = [row('1', '\\mathbf 1', 1, R(1, 1, 1, 1, 1)), row('ai', '\\chi_i', 1, R(1, 1, 1, -1, -1)), row('aj', '\\chi_j', 1, R(1, 1, -1, 1, -1)), row('ak', '\\chi_k', 1, R(1, 1, -1, -1, 1)), row('2', '\\chi_2', 2, R(2, -2, 0, 0, 0))];
  return { G, rows, key: 'Q8' };
}
function a4Table() {
  const G = altGroup(4);
  orderClasses(G, [0, elOf(G, [1, 0, 3, 2]), elOf(G, [1, 2, 0, 3]), elOf(G, [2, 0, 1, 3])]);
  const rows = [row('1', '\\mathbf 1', 1, [[1, 0], [1, 0], [1, 0], [1, 0]]), row('w', '\\chi_\\omega', 1, [[1, 0], [1, 0], OM, OMB]), row('wb', '\\chi_{\\bar\\omega}', 1, [[1, 0], [1, 0], OMB, OM]), row('3', '\\chi_3', 3, R(3, -1, 0, 0))];
  return { G, rows, key: 'A4' };
}
function s4Table() {
  const G = symGroup(4);
  orderClasses(G, [0, elOf(G, [1, 0, 2, 3]), elOf(G, [1, 0, 3, 2]), elOf(G, [1, 2, 0, 3]), elOf(G, [1, 2, 3, 0])]);
  const rows = [row('1', '\\mathbf 1', 1, R(1, 1, 1, 1, 1)), row('e', '\\varepsilon', 1, R(1, -1, 1, 1, -1)), row('2', '\\chi_2', 2, R(2, 0, 2, -1, 0)), row('3', '\\chi_3', 3, R(3, 1, -1, 0, -1)), row("3'", "\\chi_3'", 3, R(3, -1, -1, 0, 1))];
  return { G, rows, key: 'S4' };
}
function a5Table() {
  const G = altGroup(5);
  orderClasses(G, [0, elOf(G, [1, 0, 3, 2, 4]), elOf(G, [1, 2, 0, 3, 4]), elOf(G, [1, 2, 3, 4, 0]), elOf(G, [2, 3, 4, 0, 1])]);
  const rows = [row('1', '\\mathbf 1', 1, R(1, 1, 1, 1, 1)), row('3', '\\chi_3', 3, R(3, -1, 0, PHI, 1 - PHI)), row("3'", "\\chi_3'", 3, R(3, -1, 0, 1 - PHI, PHI)), row('4', '\\chi_4', 4, R(4, 0, 1, -1, -1)), row('5', '\\chi_5', 5, R(5, 1, -1, 0, 0))];
  return { G, rows, key: 'A5' };
}
function s5Table() {
  const G = symGroup(5);
  orderClasses(G, [0, elOf(G, [1, 0, 2, 3, 4]), elOf(G, [1, 0, 3, 2, 4]), elOf(G, [1, 2, 0, 3, 4]), elOf(G, [1, 2, 0, 4, 3]), elOf(G, [1, 2, 3, 0, 4]), elOf(G, [1, 2, 3, 4, 0])]);
  const rows = [row('1', '\\mathbf 1', 1, R(1, 1, 1, 1, 1, 1, 1)), row('e', '\\varepsilon', 1, R(1, -1, 1, 1, -1, -1, 1)), row('4', '\\chi_4', 4, R(4, 2, 0, 1, -1, 0, -1)), row("4'", "\\chi_4'", 4, R(4, -2, 0, 1, 1, 0, -1)), row('5', '\\chi_5', 5, R(5, 1, 1, -1, 1, -1, 0)), row("5'", "\\chi_5'", 5, R(5, -1, 1, -1, -1, 1, 0)), row('6', '\\chi_6', 6, R(6, 0, -2, 0, 0, 0, 1))];
  return { G, rows, key: 'S5' };
}
const BUILDERS = { Z3: () => cyclicTable(3), Z4: () => cyclicTable(4), Z5: () => cyclicTable(5), S3: () => dihedralTable(3), D4: () => dihedralTable(4), D5: () => dihedralTable(5), D6: () => dihedralTable(6), Q8: q8Table, A4: a4Table, S4: s4Table, A5: a5Table, S5: s5Table };
const CACHE = {};
/** The group, its classes (in table order) and its classical character table. Cached. */
export function tableOf(key) {
  if (!CACHE[key]) {
    const T = BUILDERS[key]();
    T.G.classes.forEach((c) => { c.tex = ''; });
    T.names = T.G.classes.map((c) => classTex(T.G, c));
    CACHE[key] = T;
  }
  return CACHE[key];
}
/** TeX label for a class (order and size are shown elsewhere): the label of its representative. */
function classTex(G, c) { return G.L[c.rep]; }

// ---------------------------------------------------------------- inner products and checks
/** ⟨f, h⟩ = (1/|G|) Σ_g f(g) conj(h(g)) for class functions given as one complex value per class. */
export function ip(G, f, h) {
  let s = CZ;
  G.classes.forEach((c, i) => { s = cadd(s, csc(cmul(f[i], cconj(h[i])), c.size)); });
  return csc(s, 1 / G.n);
}
/** Gram matrix of the rows of a table (complex entries). */
export const gramRows = (G, rows) => rows.map((a) => rows.map((b) => ip(G, a.vals, b.vals)));
/** Largest deviation of the table's row Gram matrix from the identity. */
export function tableDefect(G, rows) {
  let m = 0;
  gramRows(G, rows).forEach((r, i) => r.forEach((z, j) => { m = Math.max(m, cabs(csub(z, [+(i === j), 0]))); }));
  return m;
}
/** Σ over the rows of χ(C_i) conj(χ(C_j)) (the (i, j) entry of the column Gram matrix). */
export const colDot = (rows, i, j) => rows.reduce((s, r) => cadd(s, cmul(r.vals[i], cconj(r.vals[j]))), CZ);
/** Class function g ↦ g² as a map on class indices. */
export const sqClass = (G) => G.classes.map((c) => G.cls[G.mul[c.rep][c.rep]]);
/** Class function g ↦ g⁻¹ as a map on class indices. */
export const invClass = (G) => G.classes.map((c) => G.cls[G.inv[c.rep]]);
/** Decompose a class function into the rows of a table: multiplicities ⟨χ, χ_i⟩ (complex, real part is returned rounded when within 1e-9). */
export const multiplicities = (G, rows, f) => rows.map((r) => ip(G, f, r.vals));
/** The character of a permutation action given as a list of permutations (one per element of G): fixed-point count per class. */
export const fixedChar = (G, perms) => G.classes.map((c) => [perms[c.rep].reduce((s, x, k) => s + (x === k ? 1 : 0), 0), 0]);

// ---------------------------------------------------------------- irreducible representations (matrices)
/** Standard representation of a permutation group on the sum-zero subspace (orthonormal Helmert basis); complex matrices. */
export function stdMats(G) {
  const k = G.perms[0].length, B = [];
  for (let j = 1; j < k; j++) { const v = Array(k).fill(0); for (let i = 0; i < j; i++) v[i] = 1; v[j] = -j; const l = Math.hypot(...v); B.push(v.map((x) => x / l)); }
  return G.perms.map((p) => cm(B.map((bi) => B.map((bj) => { const Pb = Array(k).fill(0); bj.forEach((x, t) => { Pb[p[t]] += x; }); return bi.reduce((s, x, t) => s + x * Pb[t], 0); }))));
}
/** The irreducible matrix representations (complex matrices per element) of the groups used for group determinants and matrix coefficients. */
export function irrepMats(key) {
  const { G, rows } = tableOf(key);
  const out = rows.filter((r) => r.d === 1).map((r) => ({ name: r.name, tex: r.tex, d: 1, mats: G.cls.map((ci) => [[r.vals[ci]]]) }));
  const two = (name, tex, mats) => out.push({ name, tex, d: 2, mats });
  if (key[0] === 'D' || key === 'S3') {
    const m = G.m;
    rows.filter((r) => r.d === 2).forEach((r, k0) => {
      const th = (TAU * (k0 + 1)) / m;
      two(r.name, r.tex, G.perms.map((_, g) => {
        const a = g < m ? g : g - m, c = Math.cos(th * a), s = Math.sin(th * a);
        return cm(g < m ? [[c, -s], [s, c]] : [[c, -s], [-s, -c]]);
      }));
    });
  } else if (key === 'Q8') {
    const I = [0, 1], O = [0, 0], one = [1, 0], mone = [-1, 0], iu = [0, 1], miu = [0, -1];
    void I; void O;
    const U = { 0: [[one, O], [O, one]], 2: [[iu, O], [O, miu]], 4: [[O, one], [mone, O]], 6: [[O, iu], [iu, O]] };
    two(rows[4].name, rows[4].tex, G.L.map((_, g) => (g & 1 ? cscale(U[g - 1], [-1, 0]) : U[g])));
  } else if (key === 'A4') {
    out.push({ name: '3', tex: '\\chi_3', d: 3, mats: stdMats(G) });
  }
  return out;
}

// ---------------------------------------------------------------- the rotation group of the cube as S4
/** The 24 rotations of the cube (3×3 matrices), as permutations of its 4 body diagonals, plus object sets. */
export function cubeData() {
  const mats = [];
  const perms3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const parity = (p) => { let s = 1; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (p[i] > p[j]) s = -s; return s; };
  for (const p of perms3) for (const sg of [[1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]]) {
    if (parity(p) * sg[0] * sg[1] * sg[2] !== 1) continue;
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let j = 0; j < 3; j++) A[p[j]][j] = sg[j]; // e_j ↦ sg_j e_{p_j}
    mats.push(A);
  }
  const diag = [[1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1]];
  const app = (A, x) => A.map((r) => r.reduce((s, a, k) => s + a * x[k], 0));
  const same = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  const findLine = (x) => diag.findIndex((d) => same(d, x) || same(d.map((t) => -t), x));
  const perm = mats.map((A) => diag.map((d) => findLine(app(A, d))));
  const G = permGroup([[1, 0, 2, 3], [1, 2, 3, 0]], 'S4', 'S_4');
  const rot = Array(G.n);
  mats.forEach((A, i) => { rot[elOf(G, perm[i])] = A; });
  const sets = {
    diag: { name: 'the 4 body diagonals', pts: diag.map((d) => d), key: (x) => findLine(x) },
    faces: { name: 'the 6 faces', pts: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] },
    verts: { name: 'the 8 vertices', pts: [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c) => [a, b, c]))) },
    edges: { name: 'the 12 edges', pts: [] },
  };
  for (const a of [-1, 1]) for (const b of [-1, 1]) { sets.edges.pts.push([a, b, 0], [a, 0, b], [0, a, b]); }
  const uniq = []; sets.edges.pts.forEach((p) => { if (!uniq.some((q) => same(q, p))) uniq.push(p); }); sets.edges.pts = uniq;
  return { G, rot, sets, app, same };
}
/** Permutation of a point set induced by a rotation matrix. */
export function actOn(cube, A, pts) {
  return pts.map((p) => { const q = cube.app(A, p); return pts.findIndex((r) => cube.same(r, q)); });
}

// ---------------------------------------------------------------- orbit counting
/** Number of orbits of the group acting on a set, by brute force (union–find over the given permutations). */
export function orbitCount(perms, size) {
  const par = [...Array(size).keys()], find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (const p of perms) for (let x = 0; x < size; x++) { const a = find(x), b = find(p[x]); if (a !== b) par[a] = b; }
  const roots = new Map();
  for (let x = 0; x < size; x++) { const r = find(x); if (!roots.has(r)) roots.set(r, []); roots.get(r).push(x); }
  return [...roots.values()];
}
