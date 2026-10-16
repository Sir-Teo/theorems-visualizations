// Abstract Algebra (Judson) — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// A finite group (or a structure that fails to be one) is stored as its Cayley table: {n, L (TeX labels), T (n×n
// table of indices), e (identity index or null), inv (inverse indices or null), sym (operation symbol), tex (name)}.
// Every property shown in the chapter — identities, inverses, associativity, Latin squares, subgroups, orders — is
// computed from that table. Dihedral groups also carry vertex permutations and 2×2 matrices for the rigid motions.

export const EC = ['blue', 'orange', 'green', 'purple', 'red', 'teal', 'gold', 'pink'];
/** A theme-aware colour for element k of n (palette names, blended when n > 8). */
export function elColor(v, k, n) {
  if (n <= 8) return EC[k % 8];
  const t = (k / n) * 8, i = Math.floor(t);
  return v.mix(v.color(EC[i % 8]), v.color(EC[(i + 1) % 8]), t - i);
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export { gcd };

/** Fill in identity, inverses and commutativity from the table. */
export function finish(G) {
  const { n, T } = G;
  G.e = null;
  for (let a = 0; a < n && G.e == null; a++) { let ok = true; for (let x = 0; x < n && ok; x++) if (T[a][x] !== x || T[x][a] !== x) ok = false; if (ok) G.e = a; }
  G.inv = G.e == null ? null : Array.from({ length: n }, (_, a) => { for (let b = 0; b < n; b++) if (T[a][b] === G.e && T[b][a] === G.e) return b; return -1; });
  G.abelian = T.every((row, a) => row.every((x, b) => x === T[b][a]));
  G.mul = (a, b) => G.T[a][b];
  return G;
}
export function cyclic(n) {
  return finish({ key: `Z${n}`, tex: `\\mathbb Z_{${n}}`, n, sym: '+', add: true, L: Array.from({ length: n }, (_, k) => String(k)), vals: [...Array(n).keys()], T: Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => (a + b) % n)) });
}
/** (ℤ_n, ·): a monoid, never a group for n > 1 (0 has no inverse). */
export function zmul(n) {
  return finish({ key: `Zm${n}`, tex: `(\\mathbb Z_{${n}}, \\cdot)`, n, sym: '\\cdot', L: Array.from({ length: n }, (_, k) => String(k)), vals: [...Array(n).keys()], T: Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => (a * b) % n)) });
}
export function units(n) {
  const els = [...Array(n).keys()].filter((k) => k && gcd(k, n) === 1); if (n === 1) els.push(0);
  const idx = new Map(els.map((x, i) => [x, i]));
  return finish({ key: `U${n}`, tex: `U(${n})`, n: els.length, sym: '\\cdot', vals: els, L: els.map(String), T: els.map((a) => els.map((b) => idx.get((a * b) % n))) });
}
export function klein() {
  const P = [[0, 0], [0, 1], [1, 0], [1, 1]];
  return finish({ key: 'V', tex: '\\mathbb Z_2\\times\\mathbb Z_2', n: 4, sym: '+', add: true, L: P.map(([a, b]) => `(${a},${b})`), short: ['e', 'a', 'b', 'c'], T: P.map((p) => P.map((q) => P.findIndex((r) => r[0] === (p[0] + q[0]) % 2 && r[1] === (p[1] + q[1]) % 2))) });
}
/** Unit quaternions ±1, ±i, ±j, ±k (order: 1, −1, i, −i, j, −j, k, −k). */
export function quaternion() {
  const U = [[[1, 0], [1, 1], [1, 2], [1, 3]], [[1, 1], [-1, 0], [1, 3], [-1, 2]], [[1, 2], [-1, 3], [-1, 0], [1, 1]], [[1, 3], [1, 2], [-1, 1], [-1, 0]]]; // unit products [sign, unit]
  const els = [[1, 0], [-1, 0], [1, 1], [-1, 1], [1, 2], [-1, 2], [1, 3], [-1, 3]];
  const find = (s, u) => els.findIndex((x) => x[0] === s && x[1] === u);
  const L = ['1', '-1', 'i', '-i', 'j', '-j', 'k', '-k'];
  return finish({ key: 'Q8', tex: 'Q_8', n: 8, sym: '\\cdot', L, els, T: els.map(([s1, u1]) => els.map(([s2, u2]) => { const [s, u] = U[u1][u2]; return find(s * s1 * s2, u); })) });
}
/**
 * Dihedral group D_m as rigid motions of a regular m-gon with vertices A, B, C, … in clockwise order (vertex 0 on top for
 * m = 3, top-left for m = 4). Element = permutation of vertex positions; perm[k] = where the vertex at position k goes.
 * For m = 3 Judson's names id, ρ₁, ρ₂, μ₁, μ₂, μ₃ are used (ρ₁ = clockwise 120°, μᵢ fixes the i-th vertex);
 * for m ≥ 4: rotations rᵏ (r = clockwise 360°/m) and reflections s rᵏ (s fixes vertex A).
 */
export function dihedral(m) {
  const rot = (a) => Array.from({ length: m }, (_, k) => (k + a) % m), comp = (p, q) => q.map((x) => p[x]); // (p∘q)[k] = p[q[k]]
  const ref0 = Array.from({ length: m }, (_, k) => (m - k) % m);
  let perms = [...Array(m).keys()].map(rot), L;
  if (m === 3) { perms = perms.concat([ref0, [2, 1, 0], [1, 0, 2]]); L = ['\\mathrm{id}', '\\rho_1', '\\rho_2', '\\mu_1', '\\mu_2', '\\mu_3']; }
  else { perms = perms.concat([...Array(m).keys()].map((a) => comp(ref0, rot(a)))); L = [...Array(m).keys()].map((a) => (a === 0 ? 'e' : a === 1 ? 'r' : `r^{${a}}`)).concat([...Array(m).keys()].map((a) => (a === 0 ? 's' : a === 1 ? 'sr' : `sr^{${a}}`))); }
  const key = (p) => p.join(','), idx = new Map(perms.map((p, i) => [key(p), i]));
  const G = finish({ key: `D${m}`, tex: `D_{${m}}`, n: 2 * m, m, sym: '\\circ', L, perms, T: perms.map((p) => perms.map((q) => idx.get(key(comp(p, q))))) });
  G.pos = polygon(m); G.mat = perms.map((p) => permMatrix(G.pos, p));
  return G;
}
/** Vertices of a regular m-gon (radius 1), clockwise from the top (m odd) or top-left (m even). */
export function polygon(m) {
  const a0 = m % 2 ? Math.PI / 2 : Math.PI / 2 + Math.PI / m;
  return Array.from({ length: m }, (_, k) => [Math.cos(a0 - (2 * Math.PI * k) / m), Math.sin(a0 - (2 * Math.PI * k) / m)]);
}
/** The linear map sending vertex k to vertex perm[k] (determined by two independent vertices). */
export function permMatrix(P, perm) {
  const [a, b] = [P[0], P[1]], [c, d] = [P[perm[0]], P[perm[1]]], det = a[0] * b[1] - a[1] * b[0];
  const inv = [[b[1] / det, -b[0] / det], [-a[1] / det, a[0] / det]];
  return [[c[0] * inv[0][0] + d[0] * inv[1][0], c[0] * inv[0][1] + d[0] * inv[1][1]], [c[1] * inv[0][0] + d[1] * inv[1][0], c[1] * inv[0][1] + d[1] * inv[1][1]]];
}
export const mm = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
export const mv = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
export const I2 = [[1, 0], [0, 1]];
/** The rigid motion M (orthogonal 2×2) performed a fraction t ∈ [0,1] of the way: a partial rotation, or a flip about the axis seen in 3D. */
export function partial(M, t) {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  if (det > 0) { let th = Math.atan2(M[1][0], M[0][0]); if (Math.abs(th + Math.PI) < 1e-6) th = Math.PI; const c = Math.cos(th * t), s = Math.sin(th * t); return [[c, -s], [s, c]]; }
  const phi = Math.atan2(M[1][0], M[0][0]) / 2, u = [Math.cos(phi), Math.sin(phi)], k = Math.cos(Math.PI * t);
  return [[u[0] * u[0] + k * (1 - u[0] * u[0]), u[0] * u[1] * (1 - k)], [u[0] * u[1] * (1 - k), u[1] * u[1] + k * (1 - u[1] * u[1])]];
}
/** Axis of a reflection matrix as a unit vector (null for rotations). */
export function axisOf(M) { const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]; if (det > 0) return null; const phi = Math.atan2(M[1][0], M[0][0]) / 2; return [Math.cos(phi), Math.sin(phi)]; }
/**
 * Draw the labelled cardboard polygon moved by the matrix M about the centre c with radius R: front face tinted accent,
 * back face (after an odd number of flips) tinted orange; vertex labels stay upright.
 */
export function drawFigure(v, s, M, P, o = {}) {
  const c = o.c || [0, 0], R = o.R || 1, det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const pts = P.map((p) => { const q = mv(M, p); return [c[0] + R * q[0], c[1] + R * q[1]]; });
  if (o.outline !== false) s.poly(P.map((p) => [c[0] + R * p[0], c[1] + R * p[1]]), { color: 'muted', width: 1.4, dash: [5, 4], fill: false });
  const face = det >= 0 ? (o.front || 'accent') : (o.back || 'orange');
  s.poly(pts, { fill: face, fillAlpha: 0.12 + 0.2 * Math.min(1, Math.abs(det)), color: face, width: 2.2 });
  // a small asymmetric mark near vertex 0 shows orientation (front / back of the card)
  const m0 = mv(M, [P[0][0] * 0.55 + P[1][0] * 0.12, P[0][1] * 0.55 + P[1][1] * 0.12]);
  s.dot(c[0] + R * m0[0], c[1] + R * m0[1], { r: 4, color: face });
  const names = o.names || 'ABCDEFGH';
  pts.forEach(([x, y], k) => {
    const d = Math.hypot(x - c[0], y - c[1]) || 1, ox = (x - c[0]) / d, oy = (y - c[1]) / d;
    s.dot(x, y, { r: 4.5, color: o.vcol ? o.vcol[k] : 'ink' });
    s.text(names[k], x + ox * (o.lab ?? 0.24) * R, y + oy * (o.lab ?? 0.24) * R, { align: 'center', size: o.size || 15, weight: 700, math: true, color: o.vcol ? o.vcol[k] : 'ink' });
  });
  return pts;
}
/** Two-row notation of a vertex permutation, e.g. (A B C / B C A). */
export function permTex(perm, names = 'ABCDEFGH') { return `\\begin{pmatrix}${perm.map((_, k) => names[k]).join('&')}\\\\ ${perm.map((x) => names[x]).join('&')}\\end{pmatrix}`; }

// ------------------------------------------------------------------ properties computed from the table
/** First associativity failure [a, b, c] with (ab)c ≠ a(bc), or null. */
export function assocFail(G) { const T = G.T; for (let a = 0; a < G.n; a++) for (let b = 0; b < G.n; b++) for (let c = 0; c < G.n; c++) if (T[T[a][b]][c] !== T[a][T[b][c]]) return [a, b, c]; return null; }
/** Rows / columns that are not permutations: [{kind: 'row'|'col', k, dup: value, at: [j1, j2]}]. */
export function latinFails(G) {
  const out = [], T = G.T;
  for (let k = 0; k < G.n; k++) {
    for (const kind of ['row', 'col']) {
      const seen = new Map();
      for (let j = 0; j < G.n; j++) { const x = kind === 'row' ? T[k][j] : T[j][k]; if (seen.has(x)) { out.push({ kind, k, dup: x, at: [seen.get(x), j] }); break; } seen.set(x, j); }
    }
  }
  return out;
}
export function orderOf(G, a) { if (G.e == null) return null; let x = a, k = 1; while (x !== G.e && k <= G.n) { x = G.T[x][a]; k++; } return k > G.n ? null : k; }
export function power(G, a, k) { if (k < 0) return power(G, G.inv[a], -k); let x = G.e; for (let i = 0; i < k; i++) x = G.T[x][a]; return x; }
/** Closure of a set of elements under the operation (the subgroup they generate, in a finite group). */
export function generated(G, gens) {
  const S = new Set([G.e, ...gens]); let grew = true;
  while (grew) { grew = false; for (const a of [...S]) for (const b of [...S]) { const c = G.T[a][b]; if (!S.has(c)) { S.add(c); grew = true; } } }
  return [...S].sort((a, b) => a - b);
}
/** Every subgroup of a small group (each is generated by at most two elements for the groups used here). */
export function allSubgroups(G) {
  const seen = new Map();
  for (let a = 0; a < G.n; a++) for (let b = a; b < G.n; b++) { const H = generated(G, [a, b]); seen.set(H.join(','), H); }
  seen.set(String(G.e), [G.e]);
  return [...seen.values()].sort((A, B) => A.length - B.length || A.join(',').localeCompare(B.join(',')));
}
/** Covering pairs [i, j] (subs[i] ⊂ subs[j] with nothing strictly between) of the subgroup lattice. */
export function covers(subs) {
  const inc = (A, B) => A.length < B.length && A.every((x) => B.includes(x)), out = [];
  subs.forEach((A, i) => subs.forEach((B, j) => { if (inc(A, B) && !subs.some((C) => inc(A, C) && inc(C, B))) out.push([i, j]); }));
  return out;
}
/** The three conditions of the subgroup test for a subset H (array or Set of indices), with witnesses. */
export function subgroupTest(G, H) {
  const S = H instanceof Set ? H : new Set(H), arr = [...S].sort((a, b) => a - b);
  const hasE = S.has(G.e); let close = null, inv = null;
  for (const a of arr) { for (const b of arr) if (!S.has(G.T[a][b])) { close = [a, b]; break; } if (close) break; }
  for (const a of arr) if (!S.has(G.inv[a])) { inv = a; break; }
  return { hasE, close, inv, ok: hasE && !close && inv == null && arr.length > 0, arr };
}
/** Positions for drawing a subgroup lattice in [x0,x1]×[y0,y1]: rows by order (bottom = trivial subgroup). */
export function latticeLayout(subs, [x0, x1], [y0, y1]) {
  const orders = [...new Set(subs.map((H) => H.length))].sort((a, b) => a - b), pos = [];
  orders.forEach((o, r) => {
    const row = subs.map((H, i) => [H, i]).filter(([H]) => H.length === o), y = orders.length === 1 ? (y0 + y1) / 2 : y0 + ((y1 - y0) * r) / (orders.length - 1);
    row.forEach(([, i], k) => { pos[i] = [row.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (k + 0.5)) / row.length, y]; });
  });
  return pos;
}
/** Set of elements as TeX roster. */
export const roster = (G, H) => `\\{${[...H].sort((a, b) => a - b).map((i) => G.L[i]).join(', ')}\\}`;
/** Product a·b written with the group's own notation. */
export const prodTex = (G, a, b) => (G.add ? `${G.L[a]} + ${G.L[b]}` : G.sym === '\\circ' ? `${G.L[a]}${G.L[b]}` : `${G.L[a]}\\cdot ${G.L[b]}`);
/** Group menu: key → constructor. */
export const MENU = {
  Z4: () => cyclic(4), Z5: () => cyclic(5), Z6: () => cyclic(6), Z8: () => cyclic(8), Z12: () => cyclic(12),
  U8: () => units(8), U10: () => units(10), U12: () => units(12), U15: () => units(15),
  V: () => klein(), D3: () => dihedral(3), D4: () => dihedral(4), Q8: () => quaternion(),
};
/** Draw a Cayley table with element colours; extra overrides go to T.draw. */
export function drawCayley(v, T, G, o = {}) {
  const lab = (i) => `$${G.L[i]}$`;
  T.draw({
    rows: G.n, cols: G.n, rowLabels: (i) => lab(i), colLabels: (j) => lab(j), cornerLabel: `$${G.sym === '+' ? '+' : G.sym}$`,
    value: (i, j) => (o.hide && o.hide(i, j) ? null : lab(G.T[i][j])),
    fill: (i, j) => (o.fill ? o.fill(i, j) : null) ?? (o.hide && o.hide(i, j) ? null : [elColor(v, G.T[i][j], G.n), o.alpha ?? 0.22]),
    ...o.draw,
  });
}
