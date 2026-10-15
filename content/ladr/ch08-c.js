// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 8: Operators on Complex Vector Spaces
// Part 3 (8.29–8.46): the Cayley–Hamilton theorem and the minimal polynomial, multiplicities on the diagonal of a
// triangular matrix, block diagonal matrices, square roots of invertible operators, Jordan bases and Jordan form.
// Parts 1–2 (8.1–8.28) are ch08.js and ch08-b.js; part 4 (the trace, 8.47–8.57) is ch08-d.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const EC = ['blue', 'orange', 'purple', 'teal', 'pink'];
const TAU = 2 * Math.PI;
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** Canvas text for a small or large positive size: 3.2, 0.04, 4·10⁻¹⁵. */
function sciTxt(x) {
  if (x === 0) return '0';
  if (x >= 0.01 && x < 1e4) return pn(x, x < 1 ? 3 : 2);
  const e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  return `${m.toFixed(1).replace(/\.0$/, '')}·10${String(e).split('').map((c) => SUPS[c]).join('')}`;
}
/** TeX for a complex number given as [re, im]. */
function ctn(z, d = 2) {
  const e = 0.5 * 10 ** -d, a = Math.abs(z[0]) < e ? 0 : z[0], b = Math.abs(z[1]) < e ? 0 : z[1];
  if (b === 0) return tn(a, d);
  const bs = tn(Math.abs(b), d) === '1' ? '' : tn(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bs}i`;
  return `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bs}i`;
}
/** Compact canvas text for a complex number (real minus signs, no spaces). */
const cpn = (z, d = 2) => ctn(z, d).replace(/ /g, '').replace(/-/g, '−');
/** TeX for a matrix of complex entries. */
const cmtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((z) => ctn(z, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** TeX for a real matrix. */
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

// ---------- real vectors and matrices ----------
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const shift = (A, t) => A.map((r, i) => r.map((x, j) => (i === j ? x - t : x)));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const clone = (A) => A.map((r) => r.slice());
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors already in the span are dropped. */
function orth(vs, tol = 1e-8) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) w = subv(w, scl(e, dot(w, e)));
    const l = len(w); if (l > tol * Math.max(1, len(x))) B.push(scl(w, 1 / l));
  }
  return B;
}
/** Rotation of R³ by angle t about the axis u (Rodrigues). */
function rot3(u, t) {
  const [x, y, z] = unit(u), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
// Unimodular changes of basis (det 1, so the inverse is an integer matrix as well): P = L·U.
const P4 = mm([[1, 0, 0, 0], [1, 1, 0, 0], [0, -1, 1, 0], [1, 0, 1, 1]], [[1, 1, 0, 1], [0, 1, 1, 0], [0, 0, 1, -1], [0, 0, 0, 1]]);
/** A random unimodular n×n integer matrix (small entries) from a seeded generator. */
function unimodular(r, n) {
  const L = eye(n), U = eye(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i > j) L[i][j] = r.int(-1, 1);
    if (i < j) U[i][j] = r.int(-1, 1);
  }
  return mm(L, U);
}
/** Integer inverse of a unimodular matrix (rounded runtime inverse). */
const intInv = (M, P) => M.inverse(P).map((r) => r.map((x) => Math.round(x)));

// ---------- complex numbers as [re, im] ----------
const C1 = [1, 0];
const toC = (x) => (Array.isArray(x) ? x : x && x.re !== undefined ? [x.re, x.im] : [x, 0]);
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cconj = (a) => [a[0], -a[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscl = (a, k) => [a[0] * k, a[1] * k];
const csqrt = (a) => { const r = Math.sqrt(cabs(a)), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
const cnear = (a, b, t = 1e-9) => cabs(csub(a, b)) <= t;

// ---------- complex matrices (arrays of rows of [re, im]) ----------
const cM = (A) => A.map((r) => r.map(toC));
const cEye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? [1, 0] : [0, 0])));
const cMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => cadd(s, cmul(x, B[k][j])), [0, 0])));
const cMV = (A, x) => A.map((r) => r.reduce((s, a, j) => cadd(s, cmul(a, x[j])), [0, 0]));
const cAddM = (A, B) => A.map((r, i) => r.map((z, j) => cadd(z, B[i][j])));
const cSubM = (A, B) => A.map((r, i) => r.map((z, j) => csub(z, B[i][j])));
const cSclM = (A, k) => A.map((r) => r.map((z) => cmul(z, toC(k))));
const cShift = (A, lam) => A.map((r, i) => r.map((z, j) => (i === j ? csub(z, lam) : z)));
const cH = (A) => A[0].map((_, j) => A.map((r) => cconj(r[j])));
const cMax = (A) => Math.max(0, ...A.flat().map(cabs));
const cPow = (A, k) => { let P = cEye(A.length); for (let i = 0; i < k; i++) P = cMul(P, A); return P; };
const cCols = (vs) => vs[0].map((_, i) => vs.map((c) => c[i]));
const cdot = (a, b) => a.reduce((s, z, i) => cadd(s, cmul(cconj(z), b[i])), [0, 0]); // a^H b
const cnorm = (a) => Math.sqrt(a.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
/** Gram–Schmidt (twice) on complex vectors; vectors already in the span are dropped. */
function cGS(vs, tol = 1e-9) {
  const B = [];
  for (const x of vs) {
    let w = x.map((z) => z.slice());
    for (let p = 0; p < 2; p++) for (const e of B) { const c = cdot(e, w); w = w.map((z, i) => csub(z, cmul(c, e[i]))); }
    const l = cnorm(w); if (l > tol * Math.max(1, cnorm(x))) B.push(w.map((z) => cscl(z, 1 / l)));
  }
  return B;
}
/** Row reduction with partial pivoting, entries below rtol·max|entry| treated as 0: {R, piv}. */
function cRref(A, rtol = 1e-8, atol = 0) {
  const m = A.length, n = A[0].length, R = A.map((r) => r.map((z) => z.slice())), piv = [];
  const t = Math.max(atol, rtol * Math.max(1e-300, cMax(A)));
  for (let col = 0, row = 0; col < n && row < m; col++) {
    let p = row; for (let i = row + 1; i < m; i++) if (cabs(R[i][col]) > cabs(R[p][col])) p = i;
    if (cabs(R[p][col]) <= t) { for (let i = row; i < m; i++) R[i][col] = [0, 0]; continue; }
    [R[row], R[p]] = [R[p], R[row]];
    const inv = cdiv(C1, R[row][col]); R[row] = R[row].map((z) => cmul(z, inv));
    for (let i = 0; i < m; i++) if (i !== row) { const f = R[i][col]; if (f[0] || f[1]) R[i] = R[i].map((z, j) => csub(z, cmul(f, R[row][j]))); }
    piv.push(col); row++;
  }
  return { R, piv };
}
const cRank = (A, rtol, atol = 0) => (cMax(A) <= atol ? 0 : cRref(A, rtol, atol).piv.length);
/** Orthonormal basis of the null space of a complex matrix. */
function cNull(A, rtol) {
  const n = A[0].length;
  if (cMax(A) === 0) return cEye(n);
  const { R, piv } = cRref(A, rtol), free = [];
  for (let j = 0; j < n; j++) if (!piv.includes(j)) free.push(j);
  return cGS(free.map((f) => { const x = Array.from({ length: n }, () => [0, 0]); x[f] = [1, 0]; piv.forEach((pc, r) => { x[pc] = cscl(R[r][f], -1); }); return x; }));
}
/** Inverse of a complex matrix, column by column with the runtime's solveC; null if singular. */
function cInv(M, A) {
  const n = A.length, cols = [];
  for (let j = 0; j < n; j++) { const x = M.solveC(A, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))); if (!x) return null; cols.push(x.map(toC)); }
  return cCols(cols);
}

// ---------- exact multiplicities for integer matrices (rational polynomials in BigInt) ----------
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d); return g > 1n ? [n / g, d / g] : [n, d]; };
const qsub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const ptrim = (p) => { const a = p.slice(); while (a.length > 1 && a[a.length - 1][0] === 0n) a.pop(); return a; };
const pder = (p) => (p.length < 2 ? [Q(0n)] : p.slice(1).map((c, k) => qmul(c, Q(BigInt(k + 1)))));
function pdm(a, b) {
  a = ptrim(a); b = ptrim(b); const db = b.length - 1, r = a.slice();
  if (a.length - 1 < db) return { q: [Q(0n)], r: a };
  const q = Array(a.length - db).fill(Q(0n));
  for (let k = a.length - 1 - db; k >= 0; k--) { const f = qdiv(r[k + db], b[db]); q[k] = f; for (let j = 0; j <= db; j++) r[k + j] = qsub(r[k + j], qmul(f, b[j])); }
  return { q: ptrim(q), r: ptrim(r.slice(0, Math.max(1, db))) };
}
const pzero = (p) => ptrim(p).every((c) => c[0] === 0n);
function pgcd(a, b) { a = ptrim(a); b = ptrim(b); while (!pzero(b)) { const r = pdm(a, b).r; a = b; b = r; } const lc = a[a.length - 1]; return a.map((c) => qdiv(c, lc)); }
/**
 * Eigenvalues with exact multiplicities of a real matrix with integer entries. The characteristic polynomial
 * (runtime charPoly, exact for small integers) is split into layers whose zeros are the eigenvalues of each
 * multiplicity (repeated gcd with the derivative, in exact rational arithmetic); every layer has simple zeros,
 * which polyRoots finds accurately. → {cp, eig: [{lam: [re, im], m}]} sorted by real, then imaginary part.
 */
function spectrumInt(M, A) {
  const c = M.charPoly(A).map((x) => Math.round(x)), p = c.map((x) => Q(BigInt(x)));
  const g = [p];
  while (ptrim(g[g.length - 1]).length > 1) { const h = g[g.length - 1]; g.push(pgcd(h, pder(h))); }
  const s = []; for (let k = 1; k < g.length; k++) s.push(pdm(g[k - 1], g[k]).q);
  const out = [];
  s.forEach((sk, k) => {
    const layer = k + 1 < s.length ? pdm(sk, s[k + 1]).q : sk, coef = ptrim(layer).map((q) => Number(q[0]) / Number(q[1]));
    if (coef.length < 2) return;
    for (const z of M.polyRoots(coef)) {
      let w = [z.re, z.im];
      for (let it = 0; it < 3; it++) { // Newton polish on the layer (its zeros are simple)
        let f = [0, 0], fp = [0, 0];
        for (let j = coef.length - 1; j >= 0; j--) { fp = cadd(cmul(fp, w), f); f = cadd(cmul(f, w), [coef[j], 0]); }
        if (cabs(fp) > 1e-300) w = csub(w, cdiv(f, fp));
      }
      const sc = 1 + cabs(w);
      if (Math.abs(w[1]) < 1e-10 * sc) w[1] = 0;
      for (const i of [0, 1]) if (Math.abs(w[i] - Math.round(w[i])) < 1e-9 * sc) w[i] = Math.round(w[i]);
      out.push({ lam: w, m: k + 1 });
    }
  });
  return { cp: c, eig: out.sort((a, b) => a.lam[0] - b.lam[0] || a.lam[1] - b.lam[1]) };
}
/** Group numerically computed eigenvalues (runtime Cx) into clusters: [{lam, m}]. */
function clusterEig(vals, rtol = 1e-3) {
  const pts = vals.map(toC), sc = 1 + Math.max(0, ...pts.map(cabs)), out = [];
  for (const z of pts) {
    const hit = out.find((q) => cabs(csub(cscl(q.sum, 1 / q.m), z)) < rtol * sc);
    if (hit) { hit.sum = cadd(hit.sum, z); hit.m++; } else out.push({ sum: z.slice(), m: 1 });
  }
  return out.map((q) => ({ lam: cscl(q.sum, 1 / q.m), m: q.m })).sort((a, b) => a.lam[0] - b.lam[0] || a.lam[1] - b.lam[1]);
}
/**
 * Jordan chains of a nilpotent complex matrix N, by the induction in the proof of 8.45: take u of maximal height m;
 * the chain u, Nu, …, N^{m−1}u spans U; with φ = ⟨·, N^{m−1}u⟩ the subspace W = {v : φ(N^k v) = 0 for k < m} is
 * invariant and V = U ⊕ W; recurse on N|_W (in an orthonormal basis of W). Returns chains [u, Nu, …, N^{m−1}u].
 */
function nilChains(N) {
  const d = N.length; if (!d) return [];
  const sc = Math.max(1, cMax(N)), P = [cEye(d)];
  let m = 1;
  for (; m <= d; m++) { P.push(cMul(N, P[m - 1])); if (cMax(P[m]) <= 1e-7 * sc ** m) break; }
  m = Math.min(m, d);
  const T = P[m - 1]; let j = 0, best = -1;
  for (let k = 0; k < d; k++) { const nk = Math.hypot(...T.map((r) => cabs(r[k]))); if (nk > best) { best = nk; j = k; } }
  const chain = [Array.from({ length: d }, (_, i) => (i === j ? [1, 0] : [0, 0]))];
  for (let k = 1; k < m; k++) chain.push(cMV(N, chain[k - 1]));
  if (m === d) return [chain];
  const w = chain[m - 1], S = P.slice(0, m).map((Pk) => Pk[0].map((_, c) => Pk.reduce((s, r, i) => cadd(s, cmul(cconj(w[i]), r[c])), [0, 0])));
  const Wb = cNull(S, 1e-9);
  if (!Wb.length) return [chain];
  const Qm = cCols(Wb), NW = cMul(cH(Qm), cMul(N, Qm));
  return [chain, ...nilChains(NW).map((ch) => ch.map((x) => cMV(Qm, x)))];
}
/**
 * Jordan data of an integer matrix A: for each eigenvalue its multiplicity m, the ranks of (A − λI)^k, the block
 * sizes and the exponent k in the minimal polynomial; the blocks with their chains; P (a Jordan basis as columns),
 * J, and the check ‖P⁻¹AP − J‖.
 */
function jordanInt(M, A) {
  const n = A.length, { eig, cp } = spectrumInt(M, A), Ac = cM(A), blocks = [], basis = [];
  eig.forEach((e, ei) => {
    const N = cShift(Ac, e.lam), ranks = [n];
    let Pk = cEye(n);
    for (let k = 1; k <= e.m; k++) { Pk = cMul(Pk, N); ranks.push(cRank(Pk, 1e-9)); }
    const G = cNull(Pk, 1e-9), sizes = [];
    if (G.length === e.m) {
      const Qm = cCols(G), NG = cMul(cH(Qm), cMul(N, Qm));
      const ch = nilChains(NG).map((c) => c.map((x) => cMV(Qm, x))).sort((a, b) => b.length - a.length);
      for (const c of ch) { sizes.push(c.length); blocks.push({ lam: e.lam, size: c.length, start: basis.length, ei, chain: c }); basis.push(...c.slice().reverse()); }
    }
    e.ranks = ranks; e.sizes = sizes;
    e.k = ranks.findIndex((r) => r === n - e.m); // exponent of (z − λ) in the minimal polynomial
  });
  const ok = basis.length === n;
  const J = cEye(n).map((r) => r.map(() => [0, 0]));
  for (const b of blocks) for (let i = 0; i < b.size; i++) { J[b.start + i][b.start + i] = b.lam.slice(); if (i) J[b.start + i - 1][b.start + i] = [1, 0]; }
  let err = NaN, P = null;
  if (ok) { P = cCols(basis); const Pi = cInv(M, P); if (Pi) err = cMax(cSubM(cMul(Pi, cMul(Ac, P)), J)); }
  return { eig, cp, blocks, J, P, ok, err };
}
/** Characteristic polynomial of a complex matrix (Faddeev–LeVerrier), ascending coefficients [c₀, …, cₙ = 1]. */
function cCharPoly(A) {
  const n = A.length, c = Array(n + 1).fill(null); c[n] = [1, 0];
  let Mk = A.map((r) => r.map(() => [0, 0]));
  for (let k = 1; k <= n; k++) {
    Mk = cMul(A, Mk); for (let i = 0; i < n; i++) Mk[i][i] = cadd(Mk[i][i], c[n - k + 1]);
    const AM = cMul(A, Mk); let t = [0, 0]; for (let i = 0; i < n; i++) t = cadd(t, AM[i][i]);
    c[n - k] = cscl(t, -1 / k);
  }
  return c;
}
/** Value of the k-th derivative of the polynomial with complex ascending coefficients c at z. */
function cpolyDer(c, k, z) {
  let f = [0, 0];
  for (let j = c.length - 1; j >= k; j--) { let fac = 1; for (let i = 0; i < k; i++) fac *= j - i; f = cadd(cmul(f, z), cscl(toC(c[j]), fac)); }
  return f;
}
/**
 * Sharpen clustered eigenvalues: a root of multiplicity m of q is a simple root of q^{(m−1)}, so Newton's method on
 * that derivative, started at the cluster mean, converges to it quickly even though the m computed roots scatter.
 */
function polishClusters(cl, c) {
  return cl.map((e) => {
    let z = e.lam.slice();
    for (let it = 0; it < 6; it++) { const f = cpolyDer(c, e.m - 1, z), fp = cpolyDer(c, e.m, z); if (cabs(fp) < 1e-300) break; const dz = cdiv(f, fp); z = csub(z, dz); if (cabs(dz) < 1e-15 * (1 + cabs(z))) break; }
    if (cabs(csub(z, e.lam)) > 1e-3 * (1 + cabs(e.lam))) z = e.lam.slice();
    for (const i of [0, 1]) if (Math.abs(z[i] - Math.round(z[i])) < 1e-10 * (1 + cabs(z))) z[i] = Math.round(z[i]);
    return { lam: z, m: e.m };
  });
}
/** Polynomial with complex ascending coefficients as TeX in the variable v. */
function cpolyTeX(c, v = 'z', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const z = toC(c[k]), e = 0.5 * 10 ** -d;
    if (Math.abs(z[0]) < e && Math.abs(z[1]) < e) continue;
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    let coef, neg = false;
    if (Math.abs(z[1]) < e) { neg = z[0] < 0; const a = tn(Math.abs(z[0]), d); coef = a === '1' && mon ? '' : a; }
    else if (Math.abs(z[0]) < e) { neg = z[1] < 0; const b = tn(Math.abs(z[1]), d); coef = `${b === '1' ? '' : b}i`; }
    else coef = `(${ctn(z, d)})`;
    s += s ? ` ${neg ? '-' : '+'} ${coef}${mon}` : `${neg ? '-' : ''}${coef}${mon}`;
  }
  return s || '0';
}
/** TeX for ∏ (z − λ)^{e[key]} from a list [{lam, …}] (λ = 0 written as a power of z). */
function factTeX(eig, key = 'm', v = 'z', d = 2) {
  const parts = eig.filter((e) => e[key] > 0).map((e) => {
    const l = e.lam, z0 = cabs(l) < 0.5 * 10 ** -d;
    let base;
    if (z0) base = v;
    else if (Math.abs(l[1]) < 0.5 * 10 ** -d) base = `${v} ${l[0] < 0 ? '+' : '-'} ${tn(Math.abs(l[0]), d)}`;
    else if (Math.abs(l[0]) < 0.5 * 10 ** -d) base = `${v} ${l[1] < 0 ? '+' : '-'} ${ctn([0, Math.abs(l[1])], d)}`;
    else base = `${v} - (${ctn(l, d)})`;
    const b = z0 ? base : `(${base})`;
    return e[key] > 1 ? `${b}^{${e[key]}}` : b;
  });
  return parts.join('') || '1';
}

// ---------- drawing and editing ----------
/**
 * Make the cells of table T on stage s editable: click the upper / lower half of a cell for ±1 step, or drag it
 * up / down. o.bump(i, j, k) applies k steps; o.ok(i, j) says which cells may change.
 */
function editable(s, T, o) {
  let d = null;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.hit(x, y);
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), done: 0, moved: false } : null;
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; const k = Math.round(dy / 14); if (k !== d.done) { o.bump(d.i, d.j, k - d.done); d.done = k; } }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); o.bump(d.i, d.j, y > (r[1] + r[3]) / 2 ? 1 : -1); }
      d = null;
    }
  });
}
/** Title above (or below) a drawn table. */
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 15 : g.Y0 - g.lh - 14, { color, size });
}
/** Outline of the diagonal blocks (sizes) of a table, coloured per block. */
function blockBoxes(T, sizes, colors, st = {}) {
  let s0 = 0;
  sizes.forEach((sz, k) => { T.box(s0, s0, s0 + sz - 1, s0 + sz - 1, { color: colors[k % colors.length], width: st.width ?? 2.6, dash: st.dash }); s0 += sz; });
}

export default {
  collection: 'ladr',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.29
    {
      num: '8.29',
      kind: 'Theorem',
      name: 'Cayley–Hamilton theorem',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$, $T \in \mathcal L(V)$, and $q$ is the characteristic polynomial of $T$. Then
$$q(T) = 0.$$
In matrix form: if $A$ is an $n$-by-$n$ complex matrix with eigenvalues $\lambda_1, \dots, \lambda_n$ (each repeated as often as its multiplicity), then $(A - \lambda_1 I)(A - \lambda_2 I) \cdots (A - \lambda_n I)$ is the zero matrix.`,
      idea: String.raw`Write $q(z) = (z - \lambda_1)^{d_1} \cdots (z - \lambda_m)^{d_m}$ with $d_k = \dim G(\lambda_k, T)$ (8.26). On $G(\lambda_k, T)$ the operator $T - \lambda_k I$ is nilpotent, so its $d_k$-th power is $0$ there (8.16). The factors of $q(T)$ are polynomials in $T$ and commute, so for a vector in $G(\lambda_k, T)$ the factor $(T - \lambda_k I)^{d_k}$ can be applied first, and it already gives $0$. Every vector of $V$ is a sum of vectors in the generalized eigenspaces (8.22), hence $q(T)v = 0$ for all $v$. No determinant is involved — and nothing like "substitute $T$ for $z$ in $\det(zI - T)$".`,
      caption: String.raw`Edit the complex matrix $A$ on the right (click the top or bottom half of an entry, or drag it; *clicks change* chooses real or imaginary parts), or pick a preset. Left: the eigenvalues of $A$ (blue rings, with multiplicity) and the roots $r_1, r_2, r_3$ of a monic cubic $p$, which you drag — they snap onto eigenvalues. Below, $p(A)$ is built as the product $(A - r_1I)(A - r_2I)(A - r_3I)$; each matrix is drawn as a $3 \times 3$ grid of its complex entries (an arrow: direction = argument, length grows with the modulus; a green dot = exactly $0$). With $p = q$ every factor drops the rank by one and all nine entries of $q(A)$ vanish. Drag a root off its eigenvalue and they come back. *Expanded sum* evaluates $A^3 + c_2A^2 + c_1A + c_0I$ instead: the same $0$, but now as a last-moment cancellation.`,
      deps: ['ladr-8.16', 'ladr-8.22', 'ladr-8.26'],
      tags: ['characteristic polynomial'],
      credit: 'Cayley, 1858 (stated); Frobenius, 1878 (general proof)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cayley%E2%80%93Hamilton_theorem' },
      viz(v) {
        const M = v.M;
        const PRE = {
          ax: [[6, 3, 4], [0, 6, 2], [0, 0, 7]],
          cx: [[[0, 2], 1, 0], [1, [1, 1], [0, -1]], [2, 0, -1]],
          rep: [[3, 0, 0], [0, 3, 0], [2, -1, 1]],
          nil: [[0, 1, 2], [0, 0, 3], [0, 0, 0]],
        };
        let A = cM(PRE.ax), follow = true, cl = [], view = 0, st = null;
        v.select('', [{ value: 'ax', label: 'eigenvalues 6, 6, 7' }, { value: 'cx', label: 'complex entries' }, { value: 'rep', label: 'diagonalizable, 3 repeated' }, { value: 'nil', label: 'nilpotent' }], 'ax', { onChange: (k) => { A = cM(PRE[k]); follow = true; } });
        const mode = v.select('evaluate $p(A)$ as', [{ value: 'f', label: 'product of factors' }, { value: 'e', label: 'expanded sum' }], 'f');
        const part = v.select('clicks change', [{ value: 're', label: 'real parts' }, { value: 'im', label: 'imaginary parts' }], 're');
        v.button('roots on the eigenvalues ($p = q$)', () => { follow = true; });
        const S = v.stage({ x: [-9, 9], y: [-7, 7], equal: true, height: 320, weight: 1.15, minWidth: 280, title: 'eigenvalues of $A$ (rings) and roots of $p$ (drag)' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 250 });
        const Tl = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 215, full: true });
        const TT = v.table(E, { rows: 3, cols: 3, region: [0.03, 0.2, 0.97, 0.88], maxCell: 66, size: 15 });
        editable(E, TT, { bump: (i, j, k) => { const p = part.value === 'im' ? 1 : 0; A[i][j] = A[i][j].slice(); A[i][j][p] = M.clamp(A[i][j][p] + k, -9, 9); } });
        const snapTo = (x, y) => {
          let best = null, bd = 16;
          for (const e of cl) { const d = Math.hypot(S.X(e.lam[0]) - S.X(x), S.Y(e.lam[1]) - S.Y(y)); if (d < bd) { bd = d; best = e; } }
          return best ? [best.lam[0], best.lam[1]] : [x, y];
        };
        const R = [0, 1, 2].map((k) => S.handle(0, 0, { color: 'gold', label: `r${sub(k + 1)}`, labelPos: ['ne', 'se', 'nw'][k], constrain: snapTo, onDrag: () => { follow = false; } }));
        v.render(() => {
          const qc = cCharPoly(A);
          cl = polishClusters(clusterEig(M.eigC(A, { vectors: false }).values), qc);
          // a window around the eigenvalues (it changes only when they move far)
          const ctr = cscl(cl.reduce((s, e) => cadd(s, cscl(e.lam, e.m)), [0, 0]), 1 / 3), spread = Math.max(...cl.map((e) => cabs(csub(e.lam, ctr))));
          const Rv = [2.5, 4, 6, 8, 10, 14, 20, 30].find((r) => r >= 1.7 * spread) ?? 30, c0 = [Math.round(ctr[0]), Math.round(ctr[1])], key = `${Rv}|${c0}`;
          if (key !== view) { view = key; S.setView([c0[0] - Rv, c0[0] + Rv], [c0[1] - 0.78 * Rv, c0[1] + 0.78 * Rv]); }
          if (follow) { let k = 0; for (const e of cl) for (let j = 0; j < e.m && k < 3; j++, k++) { R[k].x = e.lam[0]; R[k].y = e.lam[1]; } }
          const roots = R.map((h) => [h.x, h.y]);
          const used = cl.map(() => 0); let match = true;
          for (const r of roots) { const i = cl.findIndex((e) => cnear(e.lam, r, 1e-9 * (1 + cabs(r)))); if (i < 0) { match = false; break; } used[i]++; }
          match = match && cl.every((e, i) => used[i] === e.m);
          // the complex plane
          const on = roots.map((r) => cl.findIndex((e) => cnear(e.lam, r, 1e-9 * (1 + cabs(r)))));
          cl.forEach((e, i) => {
            S.dot(e.lam[0], e.lam[1], { r: 12, hollow: true, color: 'accent', width: 2.6 });
            S.text(`${cpn(e.lam, 2)}${e.m > 1 ? ` (×${e.m})` : ''}`, e.lam[0], e.lam[1], { dy: 26, align: 'center', color: 'accent', size: 12.5, weight: 600 });
            const names = on.map((k, j) => (k === i ? `r${sub(j + 1)}` : null)).filter(Boolean);
            if (names.length) S.text(names.join(' '), e.lam[0], e.lam[1], { dy: -25, align: 'center', color: 'gold', size: 13, weight: 700, math: true });
          });
          R.forEach((h, j) => { h.label = on[j] < 0 ? `r${sub(j + 1)}` : undefined; });
          roots.forEach((r, j) => { if (on[j] >= 0) return; const near = cl.reduce((b, e) => (cabs(csub(e.lam, r)) < cabs(csub(b.lam, r)) ? e : b), cl[0]); S.line(r[0], r[1], near.lam[0], near.lam[1], { color: 'red', dash: [4, 4], width: 1.3 }); });
          S.corner(match ? 'p = q (roots = eigenvalues with multiplicity)' : 'p ≠ q', 'tl', { color: match ? 'green' : 'red', weight: 700 });
          // the editor
          TT.draw({ value: (i, j) => cpn(A[i][j], 0), fill: (i, j) => (i === j ? ['gold', 0.16] : null) });
          ttl(E, TT, 'A', 'ink', false, 17);
          E.texPx(part.value === 'im' ? '\\text{clicks change imaginary parts}' : '\\text{clicks change real parts}', E.width / 2, E.height - 22, { color: 'muted', size: 13 });
          // p(A): factored products or partial sums
          const sc = Math.max(1, cMax(A)) ** 3, zt = 1e-9 * sc;
          let tiles, titles, links;
          if (mode.value === 'f') {
            tiles = [cEye(3)]; for (const r of roots) tiles.push(cMul(tiles[tiles.length - 1], cShift(A, r)));
            titles = ['I', 'A - r_1 I', '(A - r_1 I)(A - r_2 I)', match ? 'q(A)' : 'p(A)'];
            links = ['\\times(A - r_1 I)', '\\times(A - r_2 I)', '\\times(A - r_3 I)'];
          } else {
            const c = M.polyFromRoots(roots.map((r) => v.cx(r[0], r[1]))).map(toC), A2 = cMul(A, A), A3 = cMul(A2, A);
            const t1 = cAddM(A3, cSclM(A2, c[2])), t2 = cAddM(t1, cSclM(A, c[1])), t3 = cAddM(t2, cSclM(cEye(3), c[0]));
            tiles = [cEye(3), A3, t1, t2, t3].slice(1);
            titles = ['A^3', 'A^3 + c_2A^2', 'A^3 + c_2A^2 + c_1A', match ? 'q(A)' : 'p(A)'];
            links = ['+\\,c_2A^2', '+\\,c_1A', '+\\,c_0I'];
          }
          const W = Tl.width, L = Math.max(70, Math.min(124, (W - 5 * 84) / 4)), gap = (W - 4 * L) / 5, Y0 = 50, cs = L / 3;
          const rmax = Math.max(1e-300, ...tiles.map(cMax));
          const D = (X, Y) => [Tl.invX(X), Tl.invY(Y)];
          tiles.forEach((Tm, k) => {
            const X0 = gap + k * (L + gap), last = k === 3, rk = cRank(Tm, 1e-9, zt), mx = cMax(Tm);
            Tl.texPx(titles[k], X0 + L / 2, Y0 - 20, { size: 13.5, color: last ? (mx < zt ? 'green' : 'red') : 'ink' });
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
              const cx0 = X0 + (j + 0.5) * cs, cy0 = Y0 + (i + 0.5) * cs, z = Tm[i][j], r = cabs(z);
              Tl.rect(...D(X0 + j * cs, Y0 + (i + 1) * cs), ...D(X0 + (j + 1) * cs, Y0 + i * cs), { color: 'faint', width: 1, fill: last ? (mx < zt ? 'green' : 'red') : 'muted', fillAlpha: last ? 0.06 : 0.03 });
              if (r < zt) { Tl.dot(...D(cx0, cy0), { r: 3.2, color: 'green' }); continue; }
              const Lr = Math.max(8, (cs / 2 - 5) * Math.sqrt(Math.min(1, r / rmax))), th = Math.atan2(z[1], z[0]);
              Tl.arrow(...D(cx0, cy0), ...D(cx0 + Lr * Math.cos(th), cy0 - Lr * Math.sin(th)), { color: last ? 'red' : 'accent', width: 2, head: 6 });
            }
            Tl.textPx(`rank ${rk}`, X0 + L / 2, Y0 + L + 15, { align: 'center', color: last && mx < zt ? 'green' : 'muted', size: 12, weight: 600 });
            Tl.textPx(`max |entry| ${sciTxt(mx)}`, X0 + L / 2, Y0 + L + 32, { align: 'center', color: last ? (mx < zt ? 'green' : 'red') : 'muted', size: 11.5 });
            if (k < 3) {
              const xa = X0 + L + 8, xb = X0 + L + gap - 8, ya = Y0 + L / 2;
              Tl.arrow(...D(xa, ya), ...D(xb, ya), { color: 'muted', width: 1.6, head: 7 });
              Tl.texPx(links[k], (xa + xb) / 2, ya - 15, { size: 11.5, color: 'muted' });
            }
          });
          st = { match, zero: cMax(tiles[3]) < zt, mx: cMax(tiles[3]), roots, q: qc, cl };
        });
        v.legend([['accent', 'eigenvalue of $A$', { dot: true }], ['gold', 'root of $p$ (drag)', { dot: true }], ['green', 'entry exactly $0$', { dot: true }], ['red', 'nonzero entry of $p(A)$']]);
        v.readout(() => {
          if (!st) return '';
          const fq = factTeX(st.cl), eq = cpolyTeX(st.q, 'z', 2), q = `q(z) = ${fq}${fq === eq ? '' : ` = ${eq}`}`;
          const p = st.match ? '' : ` Your $p(z) = ${st.roots.map((r) => (cabs(r) < 5e-3 ? 'z' : `(z - ${/[+-]/.test(ctn(r, 2).slice(1)) ? `(${ctn(r, 2)})` : ctn(r, 2)})`)).join('')}$.`;
          if (st.match) return `Characteristic polynomial $${q}$. With $p = q$ every entry of $q(A)$ is $0$ (${st.mx === 0 ? 'exactly' : `largest $|\\text{entry}| = ${v.sci(st.mx, 1)}$, rounding only`}): **Cayley–Hamilton**.`;
          if (st.zero) return `$${q}$.${p} Here $p \\ne q$, yet $p(A) = 0$: $p$ is still a multiple of the minimal polynomial (5.29, 8.30) — the extra root is not needed on a diagonalizable piece.`;
          return `$${q}$.${p} Since $p \\ne q$, **$p(A) \\ne 0$**: largest $|\\text{entry}| = ${tn(st.mx, 2)}$. Put each root back on an eigenvalue, as often as its multiplicity.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.30
    {
      num: '8.30',
      kind: 'Corollary',
      name: 'Characteristic polynomial is a multiple of minimal',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then the characteristic polynomial of $T$ is a polynomial multiple of the minimal polynomial of $T$. Equivalently: for every eigenvalue $\lambda$, the exponent of $z - \lambda$ in the minimal polynomial is at most the multiplicity of $\lambda$.`,
      idea: String.raw`By Cayley–Hamilton (8.29) the characteristic polynomial $q$ satisfies $q(T) = 0$, and every polynomial that annihilates $T$ is a multiple of the minimal polynomial (5.29). Both polynomials have the eigenvalues of $T$ as their zeros (5.27, 8.28), so the minimal polynomial is $\prod (z - \lambda)^{k_\lambda}$ with $1 \le k_\lambda \le d_\lambda$, where $d_\lambda$ is the multiplicity; $k_\lambda$ is the least $k$ with $(T - \lambda I)^k = 0$ on $G(\lambda, T)$. In particular, if the minimal polynomial has degree $\dim V$ (the generic case), the two polynomials are equal.`,
      caption: String.raw`Edit the matrix (click the top or bottom half of an entry, or drag it) or pick a preset; with the switch on it stays upper triangular, so its eigenvalues are its diagonal. Right: one column per eigenvalue $\lambda$, one square per factor $z - \lambda$ of the characteristic polynomial $q$ — $d_\lambda$ squares — of which the solid ones form the minimal polynomial ($k_\lambda$ of them, computed from $\operatorname{rank}(A - \lambda I)^k$). The solid part is always inside the column. Click in a column to choose the exponent of $z - \lambda$ in your own polynomial $p$ (gold bar): $p(A) = 0$ exactly when every gold bar reaches the solid part — that is, when $p$ is a multiple of the minimal polynomial; $q$ (gold bars at the top) always is.`,
      deps: ['ladr-8.29', 'ladr-5.29', 'ladr-8.26'],
      verify: true,
      tags: ['characteristic polynomial', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = {
          a: [[2, 1, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 5]],
          b: [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 5]],
          c: [[2, 1, 3, 0], [0, 2, 1, 0], [0, 0, 2, 1], [0, 0, 0, 5]],
          d: [[1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 3, 1], [0, 0, 0, 3]],
          e: [[1, 2, 0, 1], [0, -1, 3, 0], [0, 0, 2, 1], [0, 0, 0, 4]],
        };
        let A = clone(PRE.a), ex = null, st = null;
        v.select('', [{ value: 'a', label: '2, 2, 2, 5 (one link)' }, { value: 'b', label: 'diagonal' }, { value: 'c', label: 'one long chain' }, { value: 'd', label: '1, 1, 3, 3' }, { value: 'e', label: 'distinct' }], 'a', { onChange: (k) => { A = clone(PRE[k]); ex = null; } });
        const lock = v.toggle('keep it upper triangular', true, { onChange: (b) => { if (b) for (let i = 0; i < 4; i++) for (let j = 0; j < i; j++) A[i][j] = 0; ex = null; } });
        v.button('$p = q$', () => { ex = null; });
        v.button('$p$ = minimal polynomial', () => { ex = 'min'; });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.85, minWidth: 250 });
        const B = v.stage({ x: [0, 4], y: [-1.75, 5.3], axes: false, height: 340, weight: 1.15, minWidth: 300 });
        const TT = v.table(S, { rows: 4, cols: 4, region: [0.03, 0.16, 0.97, 0.88], maxCell: 58, size: 15 });
        editable(S, TT, { ok: (i, j) => !lock.value || i <= j, bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); ex = null; } });
        const colAt = (x, m) => { const w = 4 / m, i = Math.floor(x / w); return i >= 0 && i < m ? i : -1; };
        B.onClick((x, y) => {
          if (!st) return;
          const i = colAt(x, st.eig.length); if (i < 0) return;
          const e = st.eig[i], cur = st.ex.slice();
          cur[i] = M.clamp(y < 0 ? 0 : Math.floor(y) + 1, 0, e.m + 1);
          ex = cur;
        });
        v.render(() => {
          const J = jordanInt(M, A), eig = J.eig, m = eig.length, n = 4, Ac = cM(A);
          const exps = ex === null ? eig.map((e) => e.m) : ex === 'min' ? eig.map((e) => e.k) : ex.length === m ? ex : eig.map((e) => e.m);
          // p(A) for the chosen exponents, and the minimality check of the minimal polynomial
          const evalExp = (es) => es.reduce((P, k, i) => cMul(P, cPow(cShift(Ac, eig[i].lam), k)), cEye(n));
          const sc = Math.max(1, maxAbs(A)) ** 5, pA = evalExp(exps), pz = cMax(pA) < 1e-8 * sc;
          const lower = eig.map((e, i) => cMax(evalExp(eig.map((f, j) => (j === i ? f.k - 1 : f.k)))));
          // the editor
          TT.draw({ value: (i, j) => A[i][j], textColor: (i, j) => (lock.value && i > j ? 'faint' : 'ink'), fill: (i, j) => (i === j ? ['gold', 0.16] : lock.value && i > j ? ['faint', 0.25] : null) });
          ttl(S, TT, 'A', 'ink', false, 17);
          S.texPx(`q(z) = ${factTeX(eig)}`, S.width / 2, S.height - 26, { size: 14, color: 'ink' });
          // the factor columns
          const w = 4 / m, sq = Math.min(0.62 * w, 0.95);
          eig.forEach((e, i) => {
            const cxm = (i + 0.5) * w, col = EC[i % EC.length], x0 = cxm - sq / 2, x1 = cxm + sq / 2;
            for (let j = 0; j < Math.max(e.m, exps[i]); j++) {
              const inQ = j < e.m, inMin = j < e.k;
              if (inQ) B.rect(x0, j + 0.06, x1, j + 0.94, { color: col, width: 1.6, fill: col, fillAlpha: inMin ? 0.55 : 0.08, dash: inMin ? false : [5, 4] });
              else B.rect(x0, j + 0.06, x1, j + 0.94, { color: 'gold', width: 1.3, dash: [3, 3], fill: 'gold', fillAlpha: 0.06 });
              if (sq * B.width / 4.5 > 52) B.tex(cabs(e.lam) < 5e-3 ? 'z' : Math.abs(e.lam[1]) < 5e-3 ? `z ${e.lam[0] < 0 ? '+' : '-'} ${tn(Math.abs(e.lam[0]))}` : `z - \\lambda`, cxm, j + 0.5, { size: 12.5, color: inMin && inQ ? 'ink' : 'muted' });
            }
            const ey = exps[i], ok = ey >= e.k, u = 4 / B.width;
            B.line(x0 - 6 * u, ey, x1 + 6 * u, ey, { color: ok ? 'gold' : 'red', width: 4 });
            B.dot(x1 + 17 * u, ey, { r: 9, color: ok ? 'gold' : 'red' });
            B.text(String(ey), x1 + 17 * u, ey, { color: 'panel', size: 11.5, weight: 700, align: 'center', halo: false });
            B.tex(`\\lambda = ${ctn(e.lam, 2)}`, cxm, -0.55, { color: col, size: 14 });
            B.tex(`k = ${e.k} \\le d = ${e.m}`, cxm, -1.25, { color: 'muted', size: 12.5 });
          });
          B.corner(pz ? 'p(A) = 0' : 'p(A) ≠ 0', 'tr', { color: pz ? 'green' : 'red', weight: 700, size: 13 });
          B.corner('solid: minimal polynomial · all: characteristic', 'tl', { color: 'muted', size: 11.5 });
          st = { eig, ex: exps, pz, pmax: cMax(pA), lower, sc };
        });
        v.legend([['blue', 'factor of the minimal polynomial', { area: true }], ['blue', 'extra factor of $q$ only', { dash: true }], ['gold', 'exponent in your $p$ (click a column)']]);
        v.readout(() => {
          if (!st) return '';
          const { eig } = st, pmin = factTeX(eig, 'k'), q = factTeX(eig, 'm');
          const quo = eig.map((e) => ({ lam: e.lam, r: e.m - e.k })), qq = factTeX(quo, 'r');
          const minimal = st.lower.every((x) => x > 1e-8 * st.sc);
          const pT = factTeX(eig.map((e, i) => ({ lam: e.lam, e: st.ex[i] })), 'e');
          return `Minimal polynomial $${pmin}$ (lowering any exponent leaves a nonzero matrix${minimal ? '' : ' — check failed'}); characteristic polynomial $q = ${q} = ${qq === '1' ? 'p_{\\min}' : `p_{\\min}\\cdot ${qq}`}$. Your $p = ${pT}$: ${st.pz ? `$p(A) = 0$ — every exponent is at least the minimal one, so $p$ is a multiple of $p_{\\min}$.` : `**$p(A) \\ne 0$** (largest entry $${tn(st.pmax, 2)}$): some exponent is below the minimal one.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.31
    {
      num: '8.31',
      kind: 'Theorem',
      name: 'Multiplicity equals number of times on the diagonal',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$, $T \in \mathcal L(V)$, and $v_1, \dots, v_n$ is a basis of $V$ for which $\mathcal M\big(T, (v_1, \dots, v_n)\big)$ is upper triangular. Then every eigenvalue $\lambda$ of $T$ appears on the diagonal of this matrix exactly as many times as its multiplicity $\dim G(\lambda, T)$.`,
      idea: String.raw`Let the diagonal be $\lambda_1, \dots, \lambda_n$. If $d$ of them are $0$, the vectors $Tv_k$ with $\lambda_k \ne 0$ are linearly independent (each is $\lambda_k v_k$ plus earlier $v_j$'s; use the linear dependence lemma 2.19), so $\dim \operatorname{range} T \ge n - d$ and $\dim \operatorname{null} T \le d$ by 3.21. The matrix of $T^n$ is triangular with diagonal $\lambda_k^n$, which has the same zeros, so $\dim G(0, T) = \dim \operatorname{null} T^n \le d$. Replacing $T$ by $T - \lambda I$: the multiplicity of each $\lambda$ is at most the number of times it sits on the diagonal. Summed over $\lambda$, both sides equal $n$ (8.25), so every inequality is an equality.`,
      caption: String.raw`One operator $T$ on $\mathbf C^4$ (its standard matrix is the disguised one in the readout), shown in three different bases. The first two are *flag bases*: each $\operatorname{span}(v_1, \dots, v_k)$ is invariant, built one vector at a time with a prescribed diagonal value; the matrices are upper triangular, with different diagonal orders and different entries above the diagonal. Under each matrix: how often each eigenvalue occurs on its diagonal, against its multiplicity $\dim G(\lambda, T)$ (computed from ranks). Press *new flags* for other orders. The third basis is a flag too — until you switch it to an arbitrary basis: the matrix is no longer triangular and its diagonal says nothing about the eigenvalues.`,
      deps: ['ladr-8.23', 'ladr-2.19', 'ladr-3.21', 'ladr-8.25'],
      tags: ['generalized eigenvectors', 'triangular'],
      viz(v) {
        const M = v.M;
        const PRE = {
          a: [[2, 1, 0, 0], [0, 2, 1, 0], [0, 0, 2, 0], [0, 0, 0, -1]],
          b: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 3, 0], [0, 0, 0, 3]],
          c: [[0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 4, 1], [0, 0, 0, 4]],
        };
        const Pi4 = intInv(M, P4);
        let seed = 3, T0 = PRE.a;
        v.select('$T$ has eigenvalues', [{ value: 'a', label: '2, 2, 2, −1' }, { value: 'b', label: '1, 1, 3, 3 (diagonalizable)' }, { value: 'c', label: '0, 0, 4, 4' }], 'a', { onChange: (k) => { T0 = PRE[k]; } });
        v.button('new flags', () => { seed++; });
        const arb = v.toggle('third basis arbitrary (not a flag)', false);
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const TB = [0, 1, 2].map((k) => v.table(S, { rows: 4, cols: 4, region: [k / 3 + 0.015, 0.25, (k + 1) / 3 - 0.015, 0.86], maxCell: 50, size: 13 }));
        let st = null;
        /** A flag basis whose triangular matrix has the diagonal `order`: v_k solves (T − λ_k I)v_k ∈ span(v_1, …, v_{k−1}). */
        const flag = (A, order, r) => {
          const n = A.length, vs = [], tol = 1e-8 * (1 + maxAbs(A));
          let Bo = [];
          for (let k = 0; k < n; k++) {
            const Pp = eye(n).map((row, i) => row.map((x, j) => x - Bo.reduce((s, b) => s + b[i] * b[j], 0)));
            const Nul = M.nullspace(mm(Pp, shift(A, order[k])), tol);
            const cand = orth(Nul.map((x) => subv(x, Bo.reduce((s, b) => add(s, scl(b, dot(x, b))), x.map(() => 0)))));
            if (!cand.length) return null;
            let w = cand.reduce((s, c) => add(s, scl(c, r.normal())), Array(n).fill(0));
            w = unit(subv(w, Bo.reduce((s, b) => add(s, scl(b, dot(w, b))), Array(n).fill(0))));
            vs.push(add(scl(w, r.uniform(0.7, 1.4) * (r() < 0.5 ? -1 : 1)), vs.reduce((s, x) => add(s, scl(x, r.uniform(-0.6, 0.6))), Array(n).fill(0))));
            Bo = orth([...Bo, w]);
          }
          return vs;
        };
        /** All distinct orderings of a multiset. */
        const perms = (a) => {
          if (a.length <= 1) return [a.slice()];
          const out = [], seen = new Set();
          a.forEach((x, i) => { if (seen.has(x)) return; seen.add(x); for (const p of perms([...a.slice(0, i), ...a.slice(i + 1)])) out.push([x, ...p]); });
          return out;
        };
        v.render(() => {
          const A = mm(mm(P4, T0), Pi4), n = 4, r = v.rng(seed);
          const { eig } = spectrumInt(M, A), vals = eig.map((e) => e.lam[0]);
          const mult = vals.map((l) => n - M.rank(M.matPow(shift(A, l), n), 1e-7 * (1 + maxAbs(A)) ** n));
          const multiset = eig.flatMap((e) => Array(e.m).fill(e.lam[0]));
          const orders = r.shuffle(perms(multiset)), cards = [];
          for (let k = 0; k < 3; k++) {
            const ord = orders[k % orders.length];
            let Bv = k === 2 && arb.value ? Array.from({ length: n }, () => Array.from({ length: n }, () => r.uniform(-1.2, 1.2))) : flag(A, ord, r);
            if (!Bv) Bv = eye(n);
            const Bm = fromCols(Bv), Mt = M.solve(Bm, mm(A, Bm));
            const tri = Mt.every((row, i) => row.every((x, j) => j >= i || Math.abs(x) < 1e-8));
            const diag = Mt.map((row, i) => row[i]);
            const counts = vals.map((l) => diag.filter((x) => Math.abs(x - l) < 1e-6).length);
            cards.push({ Mt, tri, diag, counts, flag: !(k === 2 && arb.value) });
          }
          cards.forEach((c, k) => {
            const T = TB[k], ci = (x) => vals.findIndex((l) => Math.abs(x - l) < 1e-6);
            T.draw({
              value: (i, j) => c.Mt[i][j], format: (x) => pn(x, 1),
              textColor: (i, j) => (i > j ? (Math.abs(c.Mt[i][j]) < 1e-8 ? 'faint' : 'red') : 'ink'),
              fill: (i, j) => (i === j ? (ci(c.Mt[i][i]) >= 0 ? [EC[ci(c.Mt[i][i]) % EC.length], 0.3] : ['red', 0.22]) : i > j && Math.abs(c.Mt[i][j]) >= 1e-8 ? ['red', 0.14] : null),
            });
            const g = T.geo, Xc = g.X0 + 2 * g.cw;
            S.texPx(c.flag ? `\\text{flag basis } ${k + 1}` : '\\text{arbitrary basis}', Xc, g.Y0 - 34, { size: 14, color: c.flag ? 'ink' : 'red' });
            S.textPx(c.tri ? 'upper triangular' : 'not upper triangular', Xc, g.Y0 - 13, { align: 'center', size: 11.5, color: c.tri ? 'green' : 'red', weight: 600 });
            const ok = c.counts.every((x, i) => x === mult[i]);
            vals.forEach((l, i) => S.texPx(`${tn(l)}\\!: ${c.counts[i]}\\times`, Xc + (i - (vals.length - 1) / 2) * 64, g.Y0 + 4 * g.ch + 20, { size: 13.5, color: c.counts[i] === mult[i] ? EC[i % EC.length] : 'red' }));
            S.textPx(ok ? 'counts = multiplicities' : 'counts ≠ multiplicities', Xc, g.Y0 + 4 * g.ch + 42, { align: 'center', size: 11.5, color: ok ? 'green' : 'red', weight: 600 });
          });
          S.texPx(`\\text{multiplicities (ranks of } (T - \\lambda I)^4\\text{):}\\ \\ ${vals.map((l, i) => `\\dim G(${tn(l)}, T) = ${mult[i]}`).join(',\\ \\ ')}`, S.width / 2, S.height - 24, { size: 14, color: 'muted' });
          st = { A, vals, mult, cards };
        });
        v.legend([['blue', 'diagonal entry = an eigenvalue', { area: true }], ['red', 'nonzero entry below the diagonal / diagonal entry not an eigenvalue', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const m = st.vals.map((l, i) => `\\dim G(${tn(l)}, T) = ${st.mult[i]}`).join(',\\ ');
          const bad = st.cards.find((c) => !c.flag);
          return `The operator: $${mtex(st.A, 0)}$ on $\\mathbf C^4$. Multiplicities (from ranks of $(T - \\lambda I)^4$): $${m}$. ${bad ? `The arbitrary basis gives diagonal $(${bad.diag.map((x) => tn(x, 2)).join(', ')})$ — not upper triangular, so the theorem says nothing, and indeed the counts fail.` : 'Every flag basis puts each eigenvalue on the diagonal exactly multiplicity-many times, in whatever order.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.35
    {
      num: '8.35',
      kind: 'Definition',
      name: 'Block diagonal matrix',
      statement: String.raw`A **block diagonal matrix** is a square matrix of the form
$$\begin{pmatrix} A_1 & & 0 \\ & \ddots & \\ 0 & & A_m \end{pmatrix},$$
where $A_1, \dots, A_m$ are square matrices (possibly of different sizes) lying along the diagonal, and every entry outside these blocks equals $0$. If every $A_k$ is $1$-by-$1$, this is a diagonal matrix.`,
      idea: String.raw`Let the blocks have sizes $n_1, \dots, n_m$ and split the basis into consecutive groups of these sizes. Column $j$ of the matrix lists the coordinates of the image of the $j$th basis vector (5.35), and the zeros say that this image uses only basis vectors from the same group. So each span $V_k$ of a group is invariant, the operator acts on $V_k$ through $A_k$, and $V = V_1 \oplus \cdots \oplus V_m$. Sums, products and polynomials are computed block by block, e.g. $p(A) = \operatorname{diag}(p(A_1), \dots, p(A_m))$. Conversely, a basis made of bases of invariant subspaces $V_1, \dots, V_m$ with $V = V_1 \oplus \cdots \oplus V_m$ gives a block diagonal matrix — the way 8.37 and Jordan form (8.46) use it.`,
      caption: String.raw`Choose the block sizes (*1 + 2 + 2* is Axler's example 8.36). Left: the $5$-by-$5$ matrix keeps only the entries inside its coloured diagonal blocks; everything else is $0$. Middle: drag the bars of $x$, or click a column label $e_j$ to take $x = e_j$. Right: each bar of $Ax$ is cut into the pieces $A_{i,j}x_j$, coloured by the block of $j$. Every bar shows only the colour of its own block: each block's coordinate subspace is mapped into itself. Switch on the stray entry and a foreign colour (outlined in red) leaks into a bar — that subspace is no longer invariant and the matrix is no longer block diagonal.`,
      deps: ['ladr-5.35'],
      tags: ['matrices'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_matrix#Block_diagonal_matrices' },
      viz(v) {
        const M = v.M, n = 5;
        const PARTS = { a: [1, 2, 2], b: [2, 3], c: [1, 1, 3], d: [5], e: [1, 1, 1, 1, 1] };
        const r = v.rng(11), BASE = Array.from({ length: n }, () => Array.from({ length: n }, () => r.pick([-3, -2, -1, 1, 2, 3])));
        const AX = [[4, 0, 0, 0, 0], [0, 2, -3, 0, 0], [0, 0, 2, 0, 0], [0, 0, 0, 1, 7], [0, 0, 0, 0, 1]];
        const part = v.select('block sizes', [{ value: 'a', label: '1 + 2 + 2' }, { value: 'b', label: '2 + 3' }, { value: 'c', label: '1 + 1 + 3' }, { value: 'd', label: '5' }, { value: 'e', label: '1 + 1 + 1 + 1 + 1' }], 'a');
        const leak = v.toggle('a stray entry outside the blocks', false);
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.05, minWidth: 260 });
        const X = v.stage({ x: [-0.7, 4.7], y: [-2.6, 2.6], height: 330, weight: 0.75, minWidth: 190, axes: false, title: '$x$ (drag the bars)' });
        const Y = v.stage({ x: [-0.7, 4.7], y: [-10, 10], height: 330, weight: 1, minWidth: 230, axes: false, title: '$Ax$, cut into the pieces $A_{i,j}x_j$' });
        const T = v.table(S, { rows: n, cols: n, region: [0.02, 0.04, 0.98, 0.92], maxCell: 52, size: 14, colLabels: (k) => `$e_${k + 1}$`, rowLabels: (k) => `$e_${k + 1}$` });
        let x = [1.2, -0.8, 1, 0.6, -1.4], drag = -1, view = 0, st = null;
        S.onClick((px, py) => { const c = T.hit(px, py); if (c && c.i === -1 && c.j >= 0) x = x.map((_, k) => (k === c.j ? 1.5 : 0)); });
        X.onDrag((px, py, ph) => {
          if (ph === 'start') drag = Math.round(px);
          if (drag >= 0 && drag < n) x[drag] = M.clamp(Math.round(py * 10) / 10, -2.4, 2.4);
          if (ph === 'end') drag = -1;
        });
        v.render(() => {
          const sizes = PARTS[part.value], blk = sizes.flatMap((s, k) => Array(s).fill(k));
          const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (blk[i] !== blk[j] ? 0 : part.value === 'a' ? AX[i][j] : BASE[i][j])));
          let stray = null;
          if (leak.value) for (const [i, j] of [[4, 0], [3, 0], [2, 0], [4, 1], [0, 4]]) if (blk[i] !== blk[j]) { stray = [i, j]; A[i][j] = 2; break; }
          // the matrix
          T.draw({
            value: (i, j) => A[i][j],
            textColor: (i, j) => (blk[i] === blk[j] ? 'ink' : A[i][j] ? 'red' : 'faint'),
            fill: (i, j) => (blk[i] === blk[j] ? [EC[blk[i]], 0.17] : A[i][j] ? ['red', 0.3] : null),
            colLabelColor: (j) => EC[blk[j]], rowLabelColor: (i) => EC[blk[i]],
          });
          blockBoxes(T, sizes, EC);
          // x
          X.hline(0, { color: 'muted', width: 1 });
          x.forEach((xi, k) => {
            X.rect(k - 0.3, 0, k + 0.3, xi, { fill: EC[blk[k]], fillAlpha: 0.55, color: EC[blk[k]], width: 1.5 });
            X.line(k - 0.2, xi, k + 0.2, xi, { color: 'ink', width: 2.5 });
            X.tex(`x_{${k + 1}}`, k, xi >= 0 ? -0.3 : 0.3, { size: 13, color: EC[blk[k]] });
          });
          // Ax, cut into contributions
          const Ax = mv(A, x);
          let big = 1;
          for (let i = 0; i < n; i++) { let up = 0, dn = 0; for (let j = 0; j < n; j++) { const c = A[i][j] * x[j]; if (c > 0) up += c; else dn += c; } big = Math.max(big, up, -dn); }
          const Rv = [2, 4, 6, 10, 15, 20, 30, 40].find((t) => t >= 1.2 * big) ?? 40;
          if (Rv !== view) { view = Rv; Y.setView([-0.7, 4.7], [-Rv, Rv]); }
          Y.hline(0, { color: 'muted', width: 1 });
          let foreign = false;
          for (let i = 0; i < n; i++) {
            let up = 0, dn = 0;
            for (let j = 0; j < n; j++) {
              const c = A[i][j] * x[j]; if (Math.abs(c) < 1e-12) continue;
              const y0 = c > 0 ? up : dn, y1 = y0 + c, bad = blk[j] !== blk[i];
              if (bad) foreign = true;
              Y.rect(i - 0.3, y0, i + 0.3, y1, { fill: EC[blk[j]], fillAlpha: 0.55, color: bad ? 'red' : EC[blk[j]], width: bad ? 2.6 : 1 });
              if (c > 0) up = y1; else dn = y1;
            }
            Y.line(i - 0.38, Ax[i], i + 0.38, Ax[i], { color: 'ink', width: 2.5 });
            Y.tex(`(Ax)_{${i + 1}}`, i, Ax[i] >= 0 ? -0.08 * Rv : 0.08 * Rv, { size: 12, color: EC[blk[i]] });
          }
          Y.corner(foreign ? 'a foreign colour: not invariant' : 'each bar keeps its own colour', 'tl', { color: foreign ? 'red' : 'green', weight: 700, size: 12 });
          st = { sizes, stray, A, foreign };
        });
        v.legend(['blue', 'orange', 'purple', 'teal', 'pink'].map((c, k) => [c, `block $A_${k + 1}$ / its coordinates`, { area: true }]).slice(0, 3).concat([['red', 'entry outside the blocks']]));
        v.readout(() => {
          if (!st) return '';
          const { sizes, stray } = st;
          const names = sizes.map((s, k) => `A_${k + 1}`).join(', ');
          const base = `Blocks of sizes $${sizes.join(', ')}$: $A = \\operatorname{diag}(${names})$${sizes.every((s) => s === 1) ? ' — a diagonal matrix' : ''}.`;
          if (leak.value && !stray) return `${base} A single block fills the whole matrix, so there is no entry outside it to switch on.`;
          if (stray) return `${base.replace('$A = ', '$A \\ne ')} — the entry $A_{${stray[0] + 1},${stray[1] + 1}} = 2$ lies outside the blocks: $Ae_${stray[1] + 1}$ gets a component along $e_${stray[0] + 1}$, which belongs to another block, so $\\operatorname{span}$ of the block containing $e_${stray[1] + 1}$ is no longer invariant.`;
          return `${base} Each span of a group of basis vectors is invariant, and $A$ acts on it by its own block: $Ax$ is computed block by block.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.37
    {
      num: '8.37',
      kind: 'Theorem',
      name: 'Block diagonal matrix with upper-triangular blocks',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Let $\lambda_1, \dots, \lambda_m$ be the distinct eigenvalues of $T$, with multiplicities $d_1, \dots, d_m$. Then there is a basis of $V$ with respect to which $T$ has a block diagonal matrix $\operatorname{diag}(A_1, \dots, A_m)$, where each $A_k$ is a $d_k$-by-$d_k$ upper-triangular matrix with every diagonal entry equal to $\lambda_k$:
$$A_k = \begin{pmatrix} \lambda_k & & * \\ & \ddots & \\ 0 & & \lambda_k \end{pmatrix}.$$`,
      idea: String.raw`By the generalized eigenspace decomposition (8.22), $V = G(\lambda_1, T) \oplus \cdots \oplus G(\lambda_m, T)$, each summand is invariant, and $N_k = (T - \lambda_k I)|_{G(\lambda_k, T)}$ is nilpotent. A nilpotent operator is strictly upper triangular in a suitable basis (8.18) — e.g. one adapted to $\operatorname{null} N_k \subset \operatorname{null} N_k^2 \subset \cdots$, since $N_k$ maps each of these into the previous one. In that basis $T|_{G(\lambda_k, T)} = \lambda_k I + N_k$ has the form $A_k$, and its size is $\dim G(\lambda_k, T) = d_k$ (8.23). Putting the bases together gives a basis of $V$ (8.22) in which the matrix of $T$ is block diagonal (8.35).`,
      caption: String.raw`The four gold points are the diagonal entries of a hidden upper-triangular matrix $T_0$, i.e. the eigenvalues of $T = PT_0P^{-1}$, whose standard matrix (left) shows no structure at all. Drag them along the line; points that land on the same value merge into one eigenvalue of higher multiplicity. Right: the matrix of $T$ in a basis of generalized eigenvectors. Each block has the size of a multiplicity ($\dim G(\lambda, T)$, computed from ranks); in the adapted basis every block is upper triangular with its eigenvalue on the diagonal. *Any basis of each $G(\lambda)$* keeps the blocks but fills them in below the diagonal (orange); *one vector mixes two $G$'s* destroys the block structure (red).`,
      deps: ['ladr-8.22', 'ladr-8.18', 'ladr-8.35', 'ladr-8.23'],
      tags: ['generalized eigenvectors', 'triangular'],
      viz(v) {
        const M = v.M, n = 4, Pi4 = intInv(M, P4);
        const U = [[0, 1, -1, 2], [0, 0, 1, 1], [0, 0, 0, 1], [0, 0, 0, 0]];
        const BC = ['blue', 'purple', 'teal', 'pink'];
        const MIX = [[1, 0.4, -0.3, 0.25], [-0.35, 1, 0.3, -0.2], [0.3, -0.25, 1, 0.35], [0.2, 0.3, -0.35, 1]];
        const L = v.stage({ x: [-3.4, 3.4], y: [-0.62, 0.78], axes: false, height: 128, full: true, title: 'eigenvalues of $T$ (drag the gold points; equal values merge)' });
        const H = [1, 1, -1.5, 2].map((x0) => L.handle(x0, 0, { color: 'gold', constrain: (x) => [M.clamp(Math.round(x * 2) / 2, -3, 3), 0] }));
        const mode = v.select('right-hand basis', [{ value: 'g', label: 'any basis of each $G(\\lambda, T)$' }, { value: 'a', label: 'adapted (8.37)' }, { value: 'x', label: 'one vector mixes two $G$’s' }], 'a');
        const SA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 260 });
        const SB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 260 });
        const TA = v.table(SA, { rows: n, cols: n, region: [0.04, 0.12, 0.96, 0.86], maxCell: 60, size: 13.5 });
        const TB = v.table(SB, { rows: n, cols: n, region: [0.04, 0.12, 0.96, 0.86], maxCell: 60, size: 13.5 });
        let st = null;
        v.render(() => {
          const lam = H.map((h) => h.x), T0 = U.map((r, i) => r.map((x, j) => (i === j ? lam[i] : x)));
          const A = mm(mm(P4, T0), Pi4), sc = 1 + maxAbs(A);
          const vals = [...new Set(lam)].sort((a, b) => a - b), cnt = vals.map((l) => lam.filter((x) => x === l).length);
          // a basis of each G(λ, T) adapted to null N ⊂ null N² ⊂ ⋯ (orthonormalized in this order)
          const G = vals.map((l) => {
            const N = shift(A, l), nested = []; let Pk = eye(n);
            for (let k = 1; k <= n; k++) { Pk = mm(Pk, N); nested.push(...M.nullspace(Pk, 1e-8 * sc ** k)); }
            return orth(nested, 1e-7);
          });
          const dimG = G.map((b) => b.length), ok = dimG.every((d, i) => d === cnt[i]);
          let cols = [];
          if (mode.value === 'g') G.forEach((b) => b.forEach((_, j) => cols.push(b.reduce((s, x, i) => add(s, scl(x, MIX[i][j])), Array(n).fill(0)))));
          else G.forEach((b) => cols.push(...b));
          if (mode.value === 'x' && G.length > 1) cols[0] = add(cols[0], cols[n - 1]);
          const okB = ok && cols.length === n, Bm = okB ? fromCols(cols) : eye(n), Mt = M.solve(Bm, mm(A, Bm));
          const bi = cnt.flatMap((c, k) => Array(c).fill(k)), z = (x) => Math.abs(x) < 1e-8 * sc;
          let offB = 0, below = 0;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (bi[i] !== bi[j]) offB = Math.max(offB, Math.abs(Mt[i][j])); else if (i > j) below = Math.max(below, Math.abs(Mt[i][j])); }
          // the number line
          L.line(-3.2, 0, 3.2, 0, { color: 'muted', width: 1.5 });
          for (let t = -3; t <= 3; t += 0.5) { const big = Number.isInteger(t); L.line(t, big ? -0.07 : -0.04, t, big ? 0.07 : 0.04, { color: 'muted', width: 1 }); if (big) L.text(pn(t, 0), t, -0.22, { align: 'center', size: 11.5, color: 'muted' }); }
          vals.forEach((l, k) => {
            const who = lam.map((x, i) => (x === l ? `λ${sub(i + 1)}` : null)).filter(Boolean).join(' = ');
            L.text(who + (cnt[k] > 1 ? `   (×${cnt[k]})` : ''), l, 0.36, { align: 'center', size: 12.5, color: BC[k % EC.length], weight: 700 });
          });
          H.forEach((h) => { h.color = BC[vals.indexOf(h.x) % EC.length]; });
          // the two matrices
          const fillB = (i, j) => {
            const x = Mt[i][j];
            if (bi[i] !== bi[j]) return z(x) ? null : ['red', 0.3];
            if (i > j) return z(x) ? [BC[bi[i] % EC.length], 0.06] : ['orange', 0.32];
            return i === j ? [BC[bi[i] % EC.length], 0.34] : [BC[bi[i] % EC.length], 0.12];
          };
          TA.draw({ value: (i, j) => A[i][j], format: (x) => pn(x, 1), fill: (i, j) => ['muted', Math.min(0.32, 0.05 + 0.03 * Math.abs(A[i][j]))] });
          ttl(SA, TA, 'T \\text{ in the standard basis}', 'ink', false, 14.5);
          TB.draw({ value: (i, j) => Mt[i][j], format: (x) => (z(x) ? '0' : pn(x, 1)), textColor: (i, j) => (z(Mt[i][j]) ? 'faint' : 'ink'), fill: fillB });
          let s0 = 0; cnt.forEach((c, k) => { TB.box(s0, s0, s0 + c - 1, s0 + c - 1, { color: BC[k % EC.length], width: 2.6 }); s0 += c; });
          const lab = { a: 'T \\text{ in an adapted basis}', g: 'T \\text{ in a basis of each } G(\\lambda, T)', x: '\\text{a basis mixing two } G(\\lambda, T)' }[mode.value];
          ttl(SB, TB, lab, mode.value === 'x' && G.length > 1 ? 'red' : 'ink', false, 14.5);
          const verdict = offB > 1e-6 ? 'not block diagonal' : below > 1e-6 ? 'block diagonal, blocks not triangular' : 'block diagonal, triangular blocks';
          SB.textPx(verdict, SB.width / 2, SB.height - 18, { align: 'center', size: 12.5, weight: 700, color: offB > 1e-6 ? 'red' : below > 1e-6 ? 'orange' : 'green' });
          SA.textPx('no visible structure', SA.width / 2, SA.height - 18, { align: 'center', size: 12.5, color: 'muted' });
          st = { vals, cnt, dimG, ok, offB, below };
        });
        v.legend([['blue', 'block of an eigenvalue (size = multiplicity)', { area: true }], ['orange', 'nonzero below the diagonal of a block', { area: true }], ['red', 'nonzero outside the blocks', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ev = st.vals.map((l, k) => `${tn(l)}${st.cnt[k] > 1 ? `\\ (\\times ${st.cnt[k]})` : ''}`).join(',\\ ');
          return `Eigenvalues $${ev}$; computed $\\dim G(\\lambda, T) = ${st.dimG.join(', ')}$ ${st.ok ? '— the multiplicities' : '(numerical trouble)'}. Blocks of sizes $${st.cnt.join(', ')}$; largest entry outside the blocks $${v.sci(st.offB, 1)}$, largest entry below a block's diagonal $${v.sci(st.below, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.39
    {
      num: '8.39',
      kind: 'Lemma',
      name: 'Identity plus nilpotent has a square root',
      statement: String.raw`Suppose $N \in \mathcal L(V)$ is nilpotent. Then $I + N$ has a square root: there is $R \in \mathcal L(V)$ with $R^2 = I + N$. (This holds for $\mathbf F = \mathbf R$ as well as $\mathbf F = \mathbf C$.)`,
      idea: String.raw`Imitate the Taylor series $\sqrt{1 + x} = 1 + \tfrac12 x - \tfrac18 x^2 + \tfrac1{16} x^3 - \cdots$. If $N^m = 0$, put $R = I + a_1 N + \cdots + a_{m-1}N^{m-1}$; then $R^2 = I + 2a_1 N + (2a_2 + a_1^2)N^2 + \cdots$, and one solves successively $2a_1 = 1$, $2a_2 + a_1^2 = 0$, …, making every coefficient after the first two vanish. All powers $N^k$ with $k \ge m$ are $0$, so the infinite series becomes a finite sum and no convergence question arises — the coefficients are just the binomial coefficients $\binom{1/2}{k}$.`,
      caption: String.raw`$N$ is a strictly upper-triangular $3$-by-$3$ matrix (its size set by the slider). Left: the unit cube (grey), its image under $I + N$ (a shear, green outline), under $R_m$ (orange edges) and under $R_m^2$ (gold), where $R_m = \sum_{k<m}\binom{1/2}{k}N^k$ is the series cut after $m$ terms; drag the background to rotate. When $N^3 = 0$, three terms already give $R_3^2 = I + N$ exactly and the gold box sits in the green one; with $N^2 = 0$ two terms suffice. Right: the defect $\|R_m^2 - (I + N)\|$ for each $m$ on a log scale — it drops to exactly $0$. Make $N$ not nilpotent: the defect only decays geometrically (or blows up once the spectral radius exceeds $1$) and never reaches $0$.`,
      deps: ['ladr-8.14'],
      tags: ['nilpotent', 'square roots'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2, 2], y: [-1.75, 2.15], equal: true, axes: false, height: 370, weight: 1.15, minWidth: 300 });
        const G = v.stage({ x: [-0.1, 7.6], y: [1e-19, 1e3], ylog: true, axes: 'box', height: 370, minWidth: 260, title: 'defect $\\|R_m^2 - (I + N)\\|$ for $m = 1, \\dots, 7$ terms', xticks: [1, 2, 3, 4, 5, 6, 7] });
        const sc = v.scene3(S, { yaw: -0.8, pitch: 0.33, axis: 1.35, lim: 2 });
        const kind = v.select('$N$', [{ value: 'n3', label: '$N^3 = 0 \\ne N^2$' }, { value: 'n2', label: '$N^2 = 0$' }, { value: 'bad', label: 'not nilpotent' }], 'n3');
        const sz = v.slider('size of $N$', 0.2, 1.6, 0.9, { step: 0.05 });
        const mt = v.slider('terms $m$', 1, 7, 3, { int: true });
        const AK = [1]; for (let k = 1; k < 8; k++) AK.push((AK[k - 1] * (0.5 - (k - 1))) / k);
        const AKT = ['I', '\\tfrac12 N', '\\tfrac18 N^2', '\\tfrac1{16} N^3', '\\tfrac5{128} N^4', '\\tfrac7{256} N^5', '\\tfrac{21}{1024} N^6'];
        const V = []; for (const a of [-0.5, 0.5]) for (const b of [-0.5, 0.5]) for (const c of [-0.5, 0.5]) V.push([a, b, c]);
        const F = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
        let st = null;
        v.render(() => {
          const s = sz.value, k = kind.value;
          const N = k === 'n2' ? [[0, s, 0.6 * s], [0, 0, 0], [0, 0, 0]] : k === 'n3' ? [[0, s, 0.6 * s], [0, 0, s], [0, 0, 0]] : [[0, s, 0.6 * s], [0, 0, s], [0.8 * s, 0, 0]];
          const I3 = eye(3), IN = I3.map((r, i) => r.map((x, j) => x + N[i][j]));
          const Rm = (m) => { let R = I3.map((r) => r.map(() => 0)), P = I3; for (let j = 0; j < m; j++) { R = R.map((r, i) => r.map((x, c) => x + AK[j] * P[i][c])); P = mm(P, N); } return R; };
          const defs = [1, 2, 3, 4, 5, 6, 7].map((m) => { const R = Rm(m), D = mm(R, R); return Math.hypot(...D.flat().map((x, i) => x - IN.flat()[i])); });
          const m = mt.value, R = Rm(m), R2 = mm(R, R);
          // cubes
          sc.begin();
          for (const f of F) sc.poly(f.map((i) => V[i]), { fill: 'muted', fillAlpha: 0.03, color: 'muted', alpha: 0.35, width: 1 });
          for (const f of F) sc.poly(f.map((i) => mv(IN, V[i])), { fill: 'green', fillAlpha: 0.05, color: 'green', alpha: 0.9, width: 2.2 });
          for (const f of F) sc.poly(f.map((i) => mv(R2, V[i])), { fill: 'gold', fillAlpha: 0.2, color: 'gold', alpha: 0.8, width: 1.4 });
          for (const [a, b] of E) sc.line(mv(R, V[a]), mv(R, V[b]), { color: 'orange', width: 1.3, dash: [4, 3], alpha: 0.8 });
          sc.flush();
          const d = defs[m - 1], exact = d < 1e-13 * (1 + s);
          S.corner(exact ? `R${sub(m)}² = I + N exactly` : `R${sub(m)}² ≠ I + N`, 'tl', { color: exact ? 'green' : 'red', weight: 700 });
          // defects
          G.hline(1e-15, { color: 'faint', dash: [4, 4], width: 1 });
          G.text('rounding level', 7.5, 3e-15, { align: 'right', size: 10.5, color: 'muted' });
          defs.forEach((x, i) => {
            const top = Math.max(x, 1e-18), col = i + 1 === m ? 'gold' : x < 1e-13 ? 'green' : k === 'bad' && x > defs[0] ? 'red' : 'accent';
            G.rect(i + 1 - 0.3, 1e-18, i + 1 + 0.3, top, { fill: col, fillAlpha: i + 1 === m ? 0.75 : 0.4, color: col, width: 1.2 });
            if (x < 1e-17) { G.rect(i + 1 - 0.3, 1e-18, i + 1 + 0.3, 6e-18, { fill: i + 1 === m ? 'gold' : 'green', fillAlpha: 0.8, stroke: false }); G.text('0', i + 1, 1e-17, { dy: -6, align: 'center', size: 12, color: i + 1 === m ? 'gold' : 'green', weight: 700 }); }
          });
          const rho = Math.max(...M.eig(N, { vectors: false }).values.map((z) => z.abs()));
          st = { m, d, exact, rho, k, defs };
        });
        v.legend([['muted', 'unit cube', { area: true }], ['green', '$(I+N)$(cube)'], ['orange', '$R_m$(cube)', { dash: true }], ['gold', '$R_m^2$(cube)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, d, exact, rho, k } = st, Rt = AKT.slice(0, m).map((t, j) => (j === 0 ? t : `${AK[j] < 0 ? '-' : '+'} ${t}`)).join(' ');
          const head = `$R_${m} = ${Rt}$, $\\ \\|R_${m}^2 - (I + N)\\| = ${d === 0 ? '0' : v.sci(d, 1)}$.`;
          if (k === 'bad') return `${head} $N$ is **not nilpotent** (spectral radius $\\rho = ${tn(rho, 2)}$): no power of $N$ vanishes, so the series never stops; ${rho < 1 ? 'it converges, but every finite sum misses' : 'with $\\rho > 1$ it even diverges'}.`;
          const idx = k === 'n3' ? 3 : 2;
          return `${head} Here $N^{${idx}} = 0$, so all terms from $N^{${idx}}$ on vanish: ${m >= idx ? `**$R_${m}$ is an exact square root of $I + N$** (the extra terms are $0$).` : `with fewer than ${idx} terms the square is still off.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.41
    {
      num: '8.41',
      kind: 'Theorem',
      name: 'Over C, invertible operators have square roots',
      statement: String.raw`Suppose $V$ is a complex vector space and $T \in \mathcal L(V)$ is invertible. Then $T$ has a square root: there is $R \in \mathcal L(V)$ with $R^2 = T$.`,
      idea: String.raw`On each generalized eigenspace, $T|_{G(\lambda_k, T)} = \lambda_k I + N_k$ with $N_k$ nilpotent (8.22). Invertibility means $\lambda_k \ne 0$, so $T|_{G(\lambda_k, T)} = \lambda_k(I + N_k/\lambda_k)$; the second factor has a square root by 8.39, and $\lambda_k$ has a complex square root. Their product $R_k$ squares to $T|_{G(\lambda_k, T)}$. Writing $v = u_1 + \cdots + u_m$ with $u_k \in G(\lambda_k, T)$ (8.22) and setting $Rv = R_1u_1 + \cdots + R_mu_m$ glues the pieces into one operator with $R^2 = T$. Over $\mathbf R$ this fails (multiplication by $-1$ on $\mathbf R$), and for non-invertible $T$ it can fail (a Jordan block at $0$ has no square root).`,
      caption: String.raw`$T = PJP^{-1}$ on $\mathbf C^3$, where $J$ has a $2$-by-$2$ Jordan block with eigenvalue $\lambda_1$ and a $1$-by-$1$ block $\lambda_2$; drag both in $\mathbb C$. The two square roots of each eigenvalue are the small rings; click one to choose it. $R$ is built as in the proof — from $G(\lambda_k, T)$ (computed as $\operatorname{null}(T - \lambda_k I)^3$) and the finite binomial series — and the readout checks $R^2 = T$. Right: the size $\|R\|$ as $\lambda_1$ slides toward $0$ along its ray. It grows like $|\lambda_1|^{-1/2}$, because the series divides by $\lambda_1$; at $\lambda_1 = 0$ (it snaps there) $T$ is not invertible and no square root exists. Move $\lambda_2$ to $0$ instead: still not invertible, yet a square root exists — the hypothesis is sufficient, not necessary.`,
      deps: ['ladr-8.22', 'ladr-8.39'],
      tags: ['square roots'],
      viz(v) {
        const M = v.M;
        const P = cM([[1, 1, 0], [0, 1, 1], [1, 0, 1]]), Pi = cInv(M, P);
        const S = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 350, weight: 1.15, minWidth: 290, title: 'eigenvalues of $T$ and their square roots (click to choose)' });
        const G = v.stage({ x: [1e-3, 10], y: [0.1, 1e3], xlog: true, ylog: true, axes: 'box', height: 350, minWidth: 260, title: '$\\|R\\|$ against $|\\lambda_1|$, as $\\lambda_1 \\to 0$ along its ray' });
        const sg = [1, 1];
        let h1 = null, h2 = null, st = null;
        const snapL = (other) => (x, y) => {
          if (Math.hypot(S.X(x) - S.X(0), S.Y(y) - S.Y(0)) < 12) return [0, 0];
          const o = other(); if (o && Math.hypot(S.X(x) - S.X(o.x), S.Y(y) - S.Y(o.y)) < 12) return [o.x, o.y];
          return [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
        };
        h1 = S.handle(1.5, 1.1, { color: 'blue', label: '$\\lambda_1$', constrain: snapL(() => h2) });
        h2 = S.handle(-1.3, -0.9, { color: 'purple', label: '$\\lambda_2$', constrain: snapL(() => h1) });
        S.onClick((x, y) => { if (!st) return; for (const c of st.cands) if (Math.hypot(S.X(c.z[0]) - S.X(x), S.Y(c.z[1]) - S.Y(y)) < 13) sg[c.k] = c.s; });
        /** The square root of the proof: on each G(λ, T), √λ·(I + N/λ)^{1/2} by the finite binomial series; then glued. */
        const build = (l1, l2) => {
          const J = [[l1, [1, 0], [0, 0]], [[0, 0], l1, [0, 0]], [[0, 0], [0, 0], l2]], T = cMul(cMul(P, J), Pi);
          const ev = cnear(l1, l2, 1e-12) ? [{ lam: l1, s: sg[0] }] : [{ lam: l1, s: sg[0] }, { lam: l2, s: sg[1] }];
          const Gs = [], Rs = [];
          for (const e of ev) {
            const N = cShift(T, e.lam), Gb = cNull(cPow(N, 3), 1e-9), d = Gb.length; if (!d) return { T, fail: true };
            const Qm = cCols(Gb), Nk = cMul(cH(Qm), cMul(N, Qm));
            if (cabs(e.lam) < 1e-12) { if (cMax(Nk) > 1e-9) return { T, fail: true }; Rs.push(Nk.map((r) => r.map(() => [0, 0]))); Gs.push(...Gb); continue; }
            const X = cSclM(Nk, cdiv(C1, e.lam)); let term = cEye(d), Rk = Nk.map((r) => r.map(() => [0, 0])), a = 1;
            for (let j = 0; j < d; j++) { Rk = cAddM(Rk, cSclM(term, [a, 0])); term = cMul(term, X); a *= (0.5 - j) / (j + 1); }
            Rs.push(cSclM(Rk, cscl(csqrt(e.lam), e.s))); Gs.push(...Gb);
          }
          if (Gs.length !== 3) return { T, fail: true };
          const Bm = cCols(Gs), Bi = cInv(M, Bm); if (!Bi) return { T, fail: true };
          const D = cEye(3).map((r) => r.map(() => [0, 0])); let o = 0;
          for (const Rk of Rs) { Rk.forEach((row, i) => row.forEach((z, j) => { D[o + i][o + j] = z; })); o += Rk.length; }
          const R = cMul(Bm, cMul(D, Bi));
          return { T, R, err: cMax(cSubM(cMul(R, R), T)), norm: Math.sqrt(R.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0)) };
        };
        v.render(() => {
          const l1 = [h1.x, h1.y], l2 = [h2.x, h2.y], merged = cnear(l1, l2, 1e-12), cur = build(l1, l2);
          // the plane: eigenvalues, square-root candidates
          S.circle(0, 0, 0.06, { color: 'muted', width: 1 });
          const ev = merged ? [{ lam: l1, k: 0, col: 'blue' }] : [{ lam: l1, k: 0, col: 'blue' }, { lam: l2, k: 1, col: 'purple' }];
          const cands = [];
          ev.forEach((e) => {
            if (cabs(e.lam) < 1e-12) return;
            const r0 = csqrt(e.lam);
            for (const s of [1, -1]) {
              const z = cscl(r0, s), on = sg[e.k] === s;
              cands.push({ k: e.k, s, z });
              if (on) S.line(e.lam[0], e.lam[1], z[0], z[1], { color: e.col, dash: [3, 4], width: 1.2, alpha: 0.6 });
              S.dot(z[0], z[1], { r: on ? 7 : 6, color: e.col, hollow: !on, width: 2 });
              S.text(`${s > 0 ? '+' : '−'}√λ${sub(e.k + 1)}`, z[0], z[1], { dy: -15, align: 'center', size: 11.5, color: e.col, weight: on ? 700 : 400 });
            }
          });
          if (merged) S.text('λ₁ = λ₂: one generalized eigenspace, all of C³', l1[0], l1[1], { dy: 26, align: 'center', size: 11.5, color: 'muted' });
          S.corner(cur.fail ? 'λ₁ = 0: no square root exists' : `R² = T  (max error ${sciTxt(cur.err)})`, 'tl', { color: cur.fail ? 'red' : 'green', weight: 700 });
          // the growth of ‖R‖ as λ₁ → 0 along its ray
          const th = cabs(l1) > 1e-12 ? Math.atan2(l1[1], l1[0]) : 0, pts = [];
          for (let i = 0; i <= 80; i++) { const r = 10 ** (-3 + (4 * i) / 80), b = build([r * Math.cos(th), r * Math.sin(th)], l2); pts.push(b.fail || cnear([r * Math.cos(th), r * Math.sin(th)], l2, 1e-9) ? null : [r, b.norm]); }
          const ok = pts.filter(Boolean);
          if (ok.length) { const [r0, n0] = ok[0]; G.fn((r) => n0 * Math.sqrt(r0 / r), { color: 'faint', dash: [5, 4], width: 1.3 }); G.text('∝ |λ₁|^(−1/2)', 2e-3, n0 * Math.sqrt(r0 / 2e-3) * 1.9, { size: 11, color: 'muted' }); }
          G.path(pts, { color: 'blue', width: 2.4 });
          if (cur.fail) G.vline(1e-3, { color: 'red', width: 3 });
          else G.dot(Math.max(1e-3, cabs(l1)), cur.norm, { r: 6, color: 'gold' });
          st = { cands, cur, l1, l2, merged, z2: cabs(l2) < 1e-12 };
        });
        v.legend([['blue', '$\\lambda_1$ (2-by-2 block) and its square roots', { dot: true }], ['purple', '$\\lambda_2$ and its square roots', { dot: true }], ['gold', 'current $\\|R\\|$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { cur, l1, l2, merged } = st;
          if (cur.fail) return `$\\lambda_1 = 0$: **$T$ is not invertible**, and its Jordan block $\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}$ at $0$ has no square root at all (a $2$-by-$2$ square root would be nilpotent, so its square would be $0$). The construction must divide by $\\lambda_1$, and $\\|R\\| \\to \\infty$ as $\\lambda_1 \\to 0$.`;
          const roots = merged ? `\\sqrt{\\lambda_1} = ${ctn(cscl(csqrt(l1), sg[0]), 2)}` : `\\sqrt{\\lambda_1} = ${ctn(cscl(csqrt(l1), sg[0]), 2)},\\ \\sqrt{\\lambda_2} = ${st.z2 ? '0' : ctn(cscl(csqrt(l2), sg[1]), 2)}`;
          const count = merged ? 2 : st.z2 ? 2 : 4;
          return `$\\lambda_1 = ${ctn(l1, 2)}$, $\\lambda_2 = ${ctn(l2, 2)}$; chosen $${roots}$. Glued square root: $\\|R^2 - T\\| = ${v.sci(cur.err, 1)}$, $\\|R\\| = ${tn(cur.norm, 2)}$. Sign choices give ${count} square roots of this kind.${st.z2 ? ' Here $\\lambda_2 = 0$ sits in a $1$-by-$1$ block: $T$ is **not invertible, yet $R^2 = T$** with $\\sqrt 0 = 0$ — invertibility is sufficient, not necessary.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.44
    {
      num: '8.44',
      kind: 'Definition',
      name: 'Jordan basis',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. A basis of $V$ is a **Jordan basis** for $T$ if, with respect to it, $T$ has a block diagonal matrix $\operatorname{diag}(A_1, \dots, A_p)$ in which each block has the form
$$A_k = \begin{pmatrix} \lambda_k & 1 & & 0 \\ & \ddots & \ddots & \\ & & \ddots & 1 \\ 0 & & & \lambda_k \end{pmatrix}$$
— $\lambda_k$ on the diagonal, $1$ on the line just above it, $0$ elsewhere. The $\lambda_k$ (eigenvalues of $T$) need not be distinct, and a block may be the $1$-by-$1$ matrix $(\lambda_k)$.`,
      idea: String.raw`Read a block column by column. If its basis vectors are $w_1, \dots, w_s$, the columns say $Tw_1 = \lambda w_1$ and $Tw_j = \lambda w_j + w_{j-1}$, i.e. $(T - \lambda I)w_j = w_{j-1}$. So the block is a *chain*: $w_s \mapsto w_{s-1} \mapsto \cdots \mapsto w_1 \mapsto 0$ under $T - \lambda I$, which is $v, (T - \lambda I)v, \dots, (T - \lambda I)^{s-1}v$ listed backwards, with $v = w_s$. The superdiagonal $1$s record the steps of the chain, $w_1$ is an eigenvector, and every vector of a Jordan basis is a generalized eigenvector.`,
      caption: String.raw`$T = \lambda I + N$ on $\mathbf R^3$, where $N$ shifts one orthonormal frame down a chain. Drag $v$ (drag the background to rotate): the chain $v \to (T - \lambda I)v \to (T - \lambda I)^2v \to 0$ is drawn, ending on the green line of eigenvectors. Listed backwards it is a basis, and the matrix of $T$ in it (right) is the Jordan block — $\lambda$ on the diagonal, $1$s above — wherever $v$ is, and whatever $\lambda$ (slider). Push $v$ into the red plane $\operatorname{null}(T - \lambda I)^2$ (it snaps) and the chain is too short to be a basis. Flip the order of the list and the $1$s move below the diagonal: still a basis, but not a Jordan basis.`,
      deps: ['ladr-8.35', 'ladr-8.8'],
      tags: ['jordan form'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jordan_normal_form' },
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.9], equal: true, axes: false, height: 380, weight: 1.2, minWidth: 300 });
        const RS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 250 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.36, axis: 1.45, lim: 1.5 });
        const lam = v.slider('$\\lambda$', -1, 2, 0.5, { step: 0.1 });
        const rev = v.toggle('list the chain the other way round', false);
        const Qr = rot3([1, 0.6, 0.3], 0.35), q = [0, 1, 2].map((k) => Qr.map((r) => r[k]));
        const N = [0, 1, 2].map((i) => [0, 1, 2].map((j) => 0.9 * (q[1][i] * q[2][j] + q[0][i] * q[1][j])));
        const hv = sc.handle(add(add(scl(q[0], 0.35), scl(q[1], 0.3)), scl(q[2], 1.05)), { color: 'gold', label: 'v', snap: (p) => { const c = dot(p, q[2]); return Math.abs(c) < 0.09 ? subv(p, scl(q[2], c)) : p; } });
        const TB = v.table(RS, { rows: 3, cols: 3, region: [0.06, 0.3, 0.94, 0.86], maxCell: 66, size: 16 });
        let st = null;
        v.render(() => {
          const l = lam.value, T = N.map((r, i) => r.map((x, j) => x + (i === j ? l : 0)));
          const w0 = hv.p, w1 = mv(N, w0), w2 = mv(N, w1), w3 = mv(N, w2);
          const list = rev.value ? [w0, w1, w2] : [w2, w1, w0], Bm = fromCols(list), det = M.det(Bm), dep = Math.abs(det) < 1e-4;
          const Mt = dep ? null : M.solve(Bm, mm(T, Bm));
          sc.begin();
          sc.disc(q[0], q[1], 1.25, { fill: 'red', color: 'red', fillAlpha: 0.04, alpha: 0.25, grid: true });
          sc.line(scl(q[0], -1.7), scl(q[0], 1.7), { color: 'green', width: 3, alpha: 0.55 }, 12);
          const Z = [0, 0, 0];
          if (len(w2) > 1e-6) { sc.arrow(w0, w1, { color: 'muted', width: 1.4, dash: [4, 4], head: 7 }); sc.arrow(w1, w2, { color: 'muted', width: 1.4, dash: [4, 4], head: 7 }); sc.arrow(w2, scl(w2, 0.12), { color: 'muted', width: 1.4, dash: [4, 4], head: 7 }); }
          else if (len(w1) > 1e-6) { sc.arrow(w0, w1, { color: 'muted', width: 1.4, dash: [4, 4], head: 7 }); sc.arrow(w1, scl(w1, 0.12), { color: 'muted', width: 1.4, dash: [4, 4], head: 7 }); }
          sc.arrow(Z, w0, { color: 'gold', width: 3 });
          if (len(w1) > 1e-6) { sc.arrow(Z, w1, { color: 'orange', width: 3 }); sc.tex('(T - \\lambda I)v', w1, { color: 'orange', size: 13, dx: 36, dy: -12 }); }
          if (len(w2) > 1e-6) { sc.arrow(Z, w2, { color: 'green', width: 3.2 }); sc.tex('(T - \\lambda I)^2v', w2, { color: 'green', size: 13, dx: 10, dy: 18 }); }
          sc.dot(Z, { r: 4, color: 'ink' });
          sc.flush();
          S.corner(dep ? 'v ∈ null (T − λI)²: the chain is too short' : 'the chain is a basis of R³', 'tl', { color: dep ? 'red' : 'green', weight: 700 });
          // the matrix of T in the listed basis
          const one = (x) => Math.abs(x - 1) < 1e-6, zr = (x) => Math.abs(x) < 1e-6;
          TB.draw({
            value: (i, j) => (Mt ? Mt[i][j] : null), format: (x) => (x == null ? '' : pn(x, 2)),
            fill: (i, j) => { if (!Mt) return ['red', 0.08]; const x = Mt[i][j]; if (i === j) return ['gold', 0.3]; if (j === i + 1 && one(x)) return ['accent', 0.25]; if (i === j + 1 && one(x)) return ['red', 0.25]; return zr(x) ? null : ['red', 0.3]; },
            textColor: (i, j) => (Mt && zr(Mt[i][j]) && i !== j ? 'faint' : 'ink'),
          });
          const lab = rev.value ? '\\big(v,\\ (T-\\lambda I)v,\\ (T-\\lambda I)^2 v\\big)' : '\\big((T-\\lambda I)^2 v,\\ (T-\\lambda I)v,\\ v\\big)';
          ttl(RS, TB, `\\mathcal M\\big(T, ${lab}\\big)`, 'ink', false, 13.5);
          const jordan = Mt && !rev.value;
          RS.textPx(dep ? 'not a basis' : jordan ? 'a Jordan block: Jordan basis' : '1s below the diagonal: not a Jordan basis', RS.width / 2, RS.height - 40, { align: 'center', size: 12.5, weight: 700, color: dep ? 'red' : jordan ? 'green' : 'red' });
          st = { dep, jordan, w3: len(w3), w2: len(w2), l };
        });
        v.legend([['gold', '$v$'], ['orange', '$(T - \\lambda I)v$'], ['green', '$(T - \\lambda I)^2v$ and the eigenvector line'], ['red', '$\\operatorname{null}(T - \\lambda I)^2$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.dep) return `$(T - \\lambda I)^2 v = ${st.w2 < 1e-9 ? '0' : tn(st.w2, 3)}$: $v$ lies in $\\operatorname{null}(T - \\lambda I)^2$, the chain has fewer than three nonzero vectors, and they cannot form a basis of $\\mathbf R^3$.`;
          return `$(T - \\lambda I)^3 v = 0$ always (length $${v.sci(st.w3, 1)}$), and $(T - \\lambda I)^2 v \\ne 0$, so the three chain vectors are independent. ${st.jordan ? `In the order $(T-\\lambda I)^2v, (T-\\lambda I)v, v$ each column says $T w_j = \\lambda w_j + w_{j-1}$: the matrix is the Jordan block with $\\lambda = ${tn(st.l, 1)}$.` : 'Listed the other way round, the same vectors give the transpose of the Jordan block: $1$s below the diagonal, so this order is not a Jordan basis.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.45
    {
      num: '8.45',
      kind: 'Theorem',
      name: 'Every nilpotent operator has a Jordan basis',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is nilpotent. Then there is a basis of $V$ that is a Jordan basis for $T$; all its blocks have $0$ on the diagonal. (This holds over $\mathbf R$ as well as $\mathbf C$.)`,
      idea: String.raw`Induction on $\dim V$. Let $m$ be least with $T^m = 0$ and pick $u$ with $T^{m-1}u \ne 0$; then $u, Tu, \dots, T^{m-1}u$ is linearly independent and spans an invariant $U$. Choose $\varphi \in V'$ with $\varphi(T^{m-1}u) \ne 0$ and let $W = \{v : \varphi(T^kv) = 0 \text{ for } k = 0, \dots, m-1\}$, invariant because $T^m = 0$. A nonzero $v = \sum c_k T^k u$ in $U$ fails the test for $k = m - 1 - j$, $j$ the first index with $c_j \ne 0$, so $U \cap W = \{0\}$ (1.46); and $W$ is the null space of a map into $\mathbf F^m$, so $\dim W \ge \dim V - m$ (3.21). Hence $V = U \oplus W$, the induction hypothesis gives a Jordan basis of $W$, and the chain of $u$ listed backwards supplies one more block.`,
      caption: String.raw`Step through the proof for a nilpotent $5$-by-$5$ matrix $T$ (a hidden Jordan structure, disguised by an integer change of basis — try *new disguise*). Left: the staircase $\dim \operatorname{null} T^k$ and, beside it, the chains found so far as columns of dots ($u$ on top, an eigenvector at the bottom, arrows = $T$). Each bar is built from the squares of the chains, $\min(k, \text{length})$ squares per chain, so the staircase determines the chain lengths. Right: the matrix of $T$ in the current basis — the chains, then a basis of the remaining $W$: at each step a Jordan block (coloured like its chain) splits off, and the rest (gold) is $T|_W$. Switch on *not nilpotent*: the staircase stops below $5$, the chains cover only $G(0, T)$, and an invertible piece (red) is left over that no chain can reach.`,
      deps: ['ladr-8.44', 'ladr-8.14', 'ladr-3.110', 'ladr-1.46', 'ladr-3.21'],
      tags: ['jordan form', 'nilpotent'],
      viz(v) {
        const M = v.M, n = 5;
        const CC = ['blue', 'purple', 'teal', 'pink', 'green'];
        const PARTS = { a: [3, 2], b: [2, 2, 1], c: [4, 1], d: [3, 1, 1], e: [5] };
        let key = 'a', seed = 4, steps = null;
        const reset = () => steps && steps.reset(null, { at: 1 });
        v.select('chain lengths', [{ value: 'a', label: '3 + 2' }, { value: 'b', label: '2 + 2 + 1' }, { value: 'c', label: '4 + 1' }, { value: 'd', label: '3 + 1 + 1' }, { value: 'e', label: '5' }], 'a', { onChange: (k) => { key = k; reset(); } });
        const bump = v.toggle('not nilpotent (change one entry)', false, { onChange: reset });
        v.button('new disguise', () => { seed++; reset(); });
        const SA = v.stage({ x: [0, 12], y: [-1.5, 6.2], axes: false, height: 330, weight: 1.15, minWidth: 300 });
        const SB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 250 });
        const TB = v.table(SB, { rows: n, cols: n, region: [0.03, 0.06, 0.97, 0.86], maxCell: 54, size: 12.5 });
        let A = null;
        const build = () => {
          const J = eye(n).map((r) => r.map(() => 0)); let s0 = 0;
          for (const p of PARTS[key]) { for (let i = 0; i < p - 1; i++) J[s0 + i][s0 + i + 1] = 1; s0 += p; }
          if (bump.value) J[0][0] = 1;
          const P = unimodular(v.rng(seed), n), Pi = intInv(M, P);
          A = mm(mm(P, J), Pi);
          const sc = 1 + maxAbs(A), pw = [eye(n)];
          for (let k = 1; k <= n; k++) pw.push(mm(pw[k - 1], A));
          const dims = pw.map((Pk, k) => (k === 0 ? 0 : n - M.rank(Pk, 1e-8 * sc ** k)));
          const G0 = M.nullspace(pw[n], 1e-8 * sc ** n);
          const Rg = G0.length < n ? orth(tr(pw[n]), 1e-6).slice(0, n - G0.length) : [];
          let W = orth(G0);
          const chains = [], heights = [];
          const snap = (note, line, extra = {}) => {
            const basis = [...chains.flatMap((c) => c.slice().reverse()), ...W, ...Rg], Bm = fromCols(basis);
            return { chains: chains.map((c) => c.slice()), heights: heights.slice(), Wdim: W.length, Rdim: Rg.length, Mt: M.solve(Bm, mm(A, Bm)), note, line, dims, ...extra };
          };
          const fr = [snap(bump.value
            ? `$T$ is **not** nilpotent: $\\dim\\operatorname{null}T^k$ stops at $${dims[n]} < 5$. The chain argument can only run inside $G(0, T) = \\operatorname{null} T^5$.`
            : `The matrix of $T$ in the standard basis: no visible structure. The staircase $\\dim\\operatorname{null}T^k = ${dims.slice(1).join(', ')}$ reaches $5$ at $k = ${dims.indexOf(n)}$, so $T^{${dims.indexOf(n)}} = 0$.`, 1)];
          let guard = 0;
          while (W.length && guard++ < n) {
            const Qm = fromCols(W), NW = mm(tr(Qm), mm(A, Qm)), d = W.length, s1 = 1 + maxAbs(NW);
            const pws = [eye(d)]; for (let k = 1; k <= d; k++) pws.push(mm(NW, pws[k - 1]));
            let m = pws.findIndex((Pk, k) => k > 0 && maxAbs(Pk) <= 1e-7 * s1 ** k); if (m < 0) m = d;
            let j = 0, best = -1; for (let c = 0; c < d; c++) { const nc = len(pws[m - 1].map((r) => r[c])); if (nc > best) { best = nc; j = c; } }
            const chain = [W[j]]; for (let k = 1; k < m; k++) chain.push(mv(A, chain[k - 1]));
            let Wn = [];
            if (m < d) {
              const Sm = []; let row = chain[m - 1].slice(); const At = tr(A);
              for (let k = 0; k < m; k++) { Sm.push(W.map((b) => dot(row, b))); row = mv(At, row); }
              Wn = orth(M.nullspace(Sm).map((y) => y.reduce((s, c, i) => add(s, scl(W[i], c)), Array(n).fill(0))));
            }
            chains.push(chain); heights.push(m); W = Wn;
            const k = chains.length;
            const Tm = m === 2 ? 'T' : m === 1 ? '' : `T^{${m - 1}}`;
            fr.push(snap(m < d
              ? `Chain ${k}: on the remaining space (dimension ${d}) the height is $m = ${m}$. Pick $u$ with $${Tm}u \\ne 0$; with $\\varphi = \\langle\\cdot, ${Tm}u\\rangle$ the space $W = \\{v : \\varphi(T^kv) = 0,\\ k < ${m}\\}$ has dimension $${d - m}$, is invariant, and complements the chain: the matrix splits.`
              : `Chain ${k}: the height $m = ${m}$ equals the dimension of the remaining space, so the single chain ${m === 1 ? '$u$' : m === 2 ? '$u, Tu$' : `$u, \\dots, T^{${m - 1}}u$`} fills it ($W = \\{0\\}$).`, m < d ? [2, 3, 4] : 2));
          }
          const sizes = heights.slice(), Jn = eye(n).map((r) => r.map(() => 0)); let o = 0;
          for (const s of sizes) { for (let i = 0; i < s - 1; i++) Jn[o + i][o + i + 1] = 1; o += s; }
          const last = fr[fr.length - 1], err = bump.value ? NaN : Math.max(...last.Mt.flatMap((r, i) => r.map((x, jj) => Math.abs(x - Jn[i][jj]))));
          fr.push(snap(bump.value
            ? `The chains cover $G(0, T)$ (dimension ${dims[n]}); on the invariant complement $\\operatorname{range}T^5$ the operator is invertible (red block, eigenvalue $1$) and no $T$-chain ends there: **without nilpotency there is no Jordan basis of $0$-chains**.`
            : `Done: each chain listed backwards, $T^{m-1}u, \\dots, Tu, u$, gives a Jordan basis. The matrix is block diagonal with nilpotent Jordan blocks of sizes $${sizes.join(', ')}$ ($\\max|\\text{entry} - J| = ${v.sci(err, 1)}$).`, 5, { done: true }));
          return fr;
        };
        steps = v.steps({
          frames: build,
          code: ['$m \\leftarrow$ least power with $T^m = 0$ on the current space', 'pick $u$ with $T^{m-1}u \\ne 0$;  chain $u, Tu, \\dots, T^{m-1}u$', '$\\varphi \\leftarrow \\langle\\cdot, T^{m-1}u\\rangle$,  $W \\leftarrow \\{v : \\varphi(T^kv) = 0,\\ k < m\\}$', '$V = U \\oplus W$, $W$ invariant  ▷ the matrix splits', 'repeat inside $W$; list each chain backwards'],
          codeTitle: 'the induction in the proof', codePos: 'below', start: 1, still: 2,
        });
        v.render(() => {
          const f = steps.frame; if (!f || !f.dims) return;
          const { chains, heights, dims } = f, k0 = chains.length;
          // staircase dim null T^k, built from the chain squares
          SA.text('dim null Tᵏ', 3.1, 6.0, { align: 'center', size: 12.5, color: 'muted', weight: 600 });
          for (let y = 0; y <= n; y++) { SA.line(0.45, y, 5.85, y, { color: 'grid', width: 1 }); SA.text(String(y), 0.3, y, { align: 'right', size: 11, color: 'muted' }); }
          SA.hline(n, { color: 'muted', dash: [5, 4], width: 1 });
          for (let k = 1; k <= n; k++) {
            const x0 = 0.6 + (k - 1) * 1.05, x1 = x0 + 0.8; let y = 0;
            heights.forEach((h, i) => { const c = Math.min(k, h); for (let t = 0; t < c; t++) { SA.rect(x0, y + 0.05, x1, y + 0.95, { fill: CC[i % EC.length], fillAlpha: 0.55, color: CC[i % EC.length], width: 1 }); y++; } });
            for (; y < dims[k]; y++) SA.rect(x0, y + 0.05, x1, y + 0.95, { color: 'muted', width: 1, dash: [3, 3], fill: 'muted', fillAlpha: 0.05 });
            SA.text(`k=${k}`, (x0 + x1) / 2, -0.45, { align: 'center', size: 11, color: 'muted' });
          }
          if (dims[n] < n) SA.text('never reaches dim V = 5', 3.1, 5.45, { align: 'center', size: 11.5, color: 'red', weight: 700 });
          // the chains as columns of dots (top: u, bottom: an eigenvector)
          SA.text('chains', 9.1, 6.0, { align: 'center', size: 12.5, color: 'muted', weight: 600 });
          SA.line(6.4, -0.75, 11.8, -0.75, { color: 'faint', width: 1 });
          SA.text('0', 6.25, -0.75, { align: 'right', size: 12, color: 'muted', math: true });
          chains.forEach((c, i) => {
            const x = 7 + i * 1.25, h = heights[i], col = CC[i % EC.length];
            for (let t = 0; t < h; t++) {
              const y = h - 0.5 - t;
              SA.arrow(x, y - 0.12, x, (t === h - 1 ? -0.75 : y - 1) + 0.14, { color: col, width: 1.6, head: 7, alpha: 0.75 });
              SA.dot(x, y, { r: 7, color: col });
            }
            SA.tex(`u_{${i + 1}}`, x + 0.42, h - 0.5, { size: 13, color: col });
          });
          if (f.Rdim) { SA.rect(10.9, 0.05, 11.6, f.Rdim - 0.05, { color: 'red', fill: 'red', fillAlpha: 0.12, width: 1.5, dash: [4, 3] }); SA.text('invertible', 11.25, f.Rdim + 0.35, { align: 'center', size: 11, color: 'red', weight: 600 }); }
          // the matrix of T in the current basis
          const blk = []; heights.forEach((h, i) => { for (let t = 0; t < h; t++) blk.push(i); });
          for (let t = 0; t < f.Wdim; t++) blk.push('W'); for (let t = 0; t < f.Rdim; t++) blk.push('R');
          const zr = (x) => Math.abs(x) < 1e-8 * (1 + maxAbs(A));
          TB.draw({
            value: (i, j) => f.Mt[i][j], format: (x) => (zr(x) ? '0' : pn(x, 1)),
            textColor: (i, j) => (zr(f.Mt[i][j]) ? 'faint' : 'ink'),
            fill: (i, j) => (blk[i] !== blk[j] ? (zr(f.Mt[i][j]) ? null : ['red', 0.25]) : blk[i] === 'W' ? ['gold', 0.18] : blk[i] === 'R' ? ['red', 0.2] : [CC[blk[i] % EC.length], zr(f.Mt[i][j]) ? 0.08 : 0.4]),
          });
          let o = 0;
          heights.forEach((h, i) => { TB.box(o, o, o + h - 1, o + h - 1, { color: CC[i % EC.length], width: 2.6 }); o += h; });
          if (f.Wdim) TB.box(o, o, o + f.Wdim - 1, o + f.Wdim - 1, { color: 'gold', width: 2.2, dash: true });
          if (f.Rdim) TB.box(n - f.Rdim, n - f.Rdim, n - 1, n - 1, { color: 'red', width: 2.2, dash: true });
          ttl(SB, TB, k0 === 0 ? '\\text{matrix of } T \\text{ (standard basis)}' : '\\text{matrix of } T: \\text{ chains, then } W', 'ink', false, 14);
        });
        v.legend([['blue', 'chain 1 (squares, dots, block)', { area: true }], ['purple', 'chain 2', { area: true }], ['gold', 'the rest, $T|_W$', { area: true }], ['muted', 'not yet explained', { dash: true }]]);
        v.readout(() => {
          const f = steps.frame; if (!f || !f.dims) return '';
          const d = f.dims, inc = d.slice(1).map((x, k) => x - d[k]);
          return `Staircase $\\dim\\operatorname{null}T^k = ${d.slice(1).join(', ')}$; its increments $${inc.join(', ')}$ count the chains of length $\\ge 1, 2, \\dots$ (the rows of the dot diagram). Chains found so far: lengths $${f.heights.join(', ') || '\\text{none}'}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.46
    {
      num: '8.46',
      kind: 'Theorem',
      name: 'Jordan form',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then there is a basis of $V$ that is a Jordan basis for $T$: in it, the matrix of $T$ is block diagonal with Jordan blocks $\begin{pmatrix} \lambda & 1 & & \\ & \ddots & \ddots & \\ & & \ddots & 1 \\ & & & \lambda\end{pmatrix}$. The number of blocks of size at least $k$ for the eigenvalue $\lambda$ is $\dim\operatorname{null}(T - \lambda I)^k - \dim\operatorname{null}(T - \lambda I)^{k-1}$, so the Jordan form is unique up to the order of the blocks.`,
      idea: String.raw`By the generalized eigenspace decomposition (8.22), $V = G(\lambda_1, T) \oplus \cdots \oplus G(\lambda_m, T)$ with each $(T - \lambda_k I)|_{G(\lambda_k, T)}$ nilpotent. By 8.45 each $G(\lambda_k, T)$ has a basis that is a Jordan basis for this nilpotent operator, i.e. a union of chains of $T - \lambda_k I$; in it $T|_{G(\lambda_k,T)} = \lambda_k I + (\text{nilpotent Jordan form})$ consists of Jordan blocks with $\lambda_k$ on the diagonal. Putting the bases together gives a Jordan basis of $V$. Because $T - \lambda I$ shifts each $\lambda$-chain down by one and kills its bottom, the dimensions of $\operatorname{null}(T - \lambda I)^k$ record how many chains have length $\ge k$ (Camille Jordan, 1870).`,
      caption: String.raw`Edit $A$ (click the top or bottom half of an entry, or drag it). With the entries below the diagonal locked at $0$, its eigenvalues are the diagonal entries, so you can make them coincide and then link or unlink them with the entries above; free them (or pick *complex* or *disguised*) for a full matrix. Right: the Jordan form $J = P^{-1}AP$, computed — exact multiplicities, ranks of $(A - \lambda I)^k$, chains built as in the proof of 8.45 — with $\|P^{-1}AP - J\|$ in the readout; *show* $P$ displays the Jordan basis itself. Below: each block as a chain of generalized eigenvectors, $T - \lambda I$ moving each one step left. The slider applies the nilpotent part $k$ times: every chain shifts, its end falls into $0$, and once $k$ reaches the longest chain everything has collapsed.`,
      deps: ['ladr-8.22', 'ladr-8.45', 'ladr-8.44'],
      tags: ['jordan form'],
      credit: 'Camille Jordan, 1870',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jordan_normal_form' },
      viz(v) {
        const M = v.M, n = 4;
        const PRE = {
          one: [[3, 1, 0, 0], [0, 3, 1, 0], [0, 0, 3, 0], [0, 0, 0, -1]],
          two: [[2, 1, 0, 0], [0, 2, 0, 0], [0, 0, 2, 1], [0, 0, 0, 2]],
          nil: [[0, 1, 2, 0], [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 0]],
          cx: [[0, -1, 1, 0], [1, 0, 0, 1], [0, 0, 0, -1], [0, 0, 1, 0]],
          dis: mm(mm(P4, [[1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -2]]), intInv(M, P4)),
        };
        let A = clone(PRE.one), st = null;
        v.select('', [{ value: 'one', label: 'one long chain' }, { value: 'two', label: 'two chains, one λ' }, { value: 'nil', label: 'nilpotent' }, { value: 'cx', label: 'complex' }, { value: 'dis', label: 'disguised' }], 'one', {
          onChange: (k) => { A = clone(PRE[k]); if (!A.every((r, i) => r.every((x, j) => j >= i || x === 0))) lock.set('free'); },
        });
        const lock = v.select('entries below the diagonal', [{ value: 'lock', label: 'locked at 0 (triangular)' }, { value: 'free', label: 'free' }], 'lock', { onChange: (c) => { if (c === 'lock') for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) A[i][j] = 0; } });
        const locked = () => lock.value === 'lock';
        const show = v.select('right panel', [{ value: 'J', label: 'Jordan form $J$' }, { value: 'P', label: 'Jordan basis $P$' }], 'J');
        const kk = v.slider('apply the nilpotent part $k$ times', 0, 4, 0, { int: true });
        const SE = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 250 });
        const SJ = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 250 });
        const SC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210, full: true });
        const TE = v.table(SE, { rows: n, cols: n, region: [0.03, 0.1, 0.97, 0.86], maxCell: 58, size: 15 });
        const TJ = v.table(SJ, { rows: n, cols: n, region: [0.03, 0.1, 0.97, 0.86], maxCell: 58, size: 13 });
        editable(SE, TE, { ok: (i, j) => !locked() || i <= j, bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        v.render(() => {
          const D = jordanInt(M, A), k = kk.value, { blocks } = D;
          const col = (b) => EC[b.ei % EC.length];
          // editor
          TE.draw({ value: (i, j) => A[i][j], textColor: (i, j) => (locked() && i > j ? 'faint' : 'ink'), fill: (i, j) => (i === j ? ['gold', 0.16] : locked() && i > j ? ['faint', 0.25] : null) });
          ttl(SE, TE, 'A', 'ink', false, 17);
          // Jordan form (or N^k), or the basis P
          const bOf = []; blocks.forEach((b, bi) => { for (let t = 0; t < b.size; t++) bOf.push(bi); });
          if (show.value === 'J' || !D.P) {
            const val = (i, j) => {
              if (!D.ok || bOf[i] !== bOf[j]) return null;
              const b = blocks[bOf[i]], p = i - b.start, q = j - b.start;
              if (k === 0) return i === j ? b.lam : q === p + 1 ? [1, 0] : null;
              return q === p + k ? [1, 0] : null;
            };
            TJ.draw({
              value: (i, j) => { const z = val(i, j); return z ? cpn(z, 2) : D.ok ? '0' : ''; },
              textColor: (i, j) => (val(i, j) ? 'ink' : 'faint'),
              fill: (i, j) => { const z = val(i, j); if (!z) return null; const b = blocks[bOf[i]]; return i === j && k === 0 ? [col(b), 0.35] : ['accent', 0.22]; },
            });
            ttl(SJ, TJ, k === 0 ? 'J = P^{-1}AP' : `N^{${k}} \\ (N = J - \\text{diagonal})`, 'ink', false, 15);
          } else {
            TJ.draw({ value: (i, j) => cpn(D.P[i][j], 2), fill: (i, j) => [col(blocks[bOf[j]]), 0.14] });
            ttl(SJ, TJ, 'P: \\text{ columns } v_1, \\dots, v_4', 'ink', false, 15);
          }
          if (D.ok) blocks.forEach((b) => TJ.box(b.start, b.start, b.start + b.size - 1, b.start + b.size - 1, { color: col(b), width: 2.6 }));
          // chains: T − λI moves each basis vector one step left; v_{start+1} → 0
          const W = SC.width, H = SC.height, rows = blocks.length, rowH = Math.min(62, (H - 50) / Math.max(1, rows)), top = 26 + (H - 50 - rows * rowH) / 2;
          const D2 = (X, Y) => [SC.invX(X), SC.invY(Y)];
          const X0 = 210, dx = Math.min(110, (W - X0 - 60) / 4);
          SC.textPx('T − λI moves every vector one step to the left', W - 12, 14, { align: 'right', size: 11.5, color: 'muted' });
          blocks.forEach((b, r) => {
            const Y = top + (r + 0.5) * rowH, c = col(b);
            SC.texPx(`\\lambda = ${ctn(b.lam, 2)}:\\ \\text{block of size } ${b.size}`, 14, Y, { align: 'left', size: 13, color: c });
            SC.texPx('0', X0 - 4, Y, { size: 15, color: 'muted' });
            for (let p = 1; p <= b.size; p++) {
              const Xp = X0 + p * dx;
              SC.arrow(...D2(Xp - 13, Y), ...D2(X0 + (p - 1) * dx + (p === 1 ? 10 : 13), Y), { color: c, width: 1.6, head: 7, alpha: 0.6 });
              SC.dot(...D2(Xp, Y), { r: 10, color: c, hollow: true, width: 2 });
              SC.texPx(`v_${b.start + p}`, Xp, Y - 20, { size: 12, color: c });
              if (rows <= 3) SC.textPx(p === 1 ? 'eigenvector' : `height ${p}`, Xp, Y + 20, { align: 'center', size: 10.5, color: 'muted' });
              const tgt = p - k;
              if (k > 0) {
                if (tgt >= 1) SC.dot(...D2(X0 + tgt * dx, Y), { r: 6, color: 'gold' });
                else SC.dot(...D2(X0 + 14 + 9 * (p - 1), Y + 11), { r: 4, color: 'red' });
              } else SC.dot(...D2(Xp, Y), { r: 6, color: c });
            }
          });
          const alive = blocks.reduce((s, b) => s + Math.max(0, b.size - k), 0);
          if (k > 0) SC.textPx(`after ${k} step${k > 1 ? 's' : ''}: ${alive} of 4 vectors survive (rank Nᵏ = ${alive})`, W - 12, H - 14, { align: 'right', size: 12, color: alive ? 'gold' : 'green', weight: 700 });
          st = { D, k, alive };
        });
        v.legend([['gold', 'image under $N^k$', { dot: true }], ['red', 'fallen into $0$', { dot: true }], ['accent', 'superdiagonal $1$s of $J$ (or of $N^k$)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { D } = st;
          if (!D.ok) return 'Numerical trouble computing the chains for this matrix.';
          const ev = D.eig.map((e) => `${ctn(e.lam, 2)}\\ (\\text{mult. } ${e.m};\\ \\text{blocks } ${e.sizes.join('{+}')})`).join(',\\quad ');
          const mp = factTeX(D.eig, 'k');
          return `Eigenvalues $${ev}$. Minimal polynomial $${mp}$ (the exponents are the longest chains); $\\max|P^{-1}AP - J| = ${v.sci(D.err, 1)}$.${st.k > 0 ? ` $N^{${st.k}}$ has rank ${st.alive}${st.alive ? '' : ': the nilpotent part has collapsed'}.` : ''}`;
        });
      },
    },
  ],
};
