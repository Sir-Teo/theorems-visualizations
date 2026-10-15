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
  ],
};
