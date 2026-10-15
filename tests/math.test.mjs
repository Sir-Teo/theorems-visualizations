// Numerical unit tests for assets/js/viz/math.js (no DOM: importing it in Node is itself a test).
//   node tests/math.test.mjs        (or: npm test)
import * as M from '../assets/js/viz/math.js';

let passed = 0, failed = 0; const fails = [];
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; fails.push(name); console.log(`✗ ${name}\n    ${String(e.message || e).split('\n').join('\n    ')}`); }
}
function ok(cond, msg = 'assertion failed') { if (!cond) throw new Error(msg); }
function close(a, b, tol = 1e-12, msg = '') {
  const err = Math.abs(a - b), scale = Math.max(1, Math.abs(b));
  if (!(err <= tol * scale) && !(a === b)) throw new Error(`${msg} expected ${b}, got ${a} (err ${err.toExponential(2)}, tol ${tol})`);
}
const eq = (a, b, msg = '') => { const A = JSON.stringify(a, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)), B = JSON.stringify(b, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)); if (A !== B) throw new Error(`${msg} expected ${B}, got ${A}`); };
const maxDiff = (A, B) => { let m = 0; const a = A.flat ? A.flat(Infinity) : A, b = B.flat ? B.flat(Infinity) : B; ok(a.length === b.length, `shape mismatch ${a.length} vs ${b.length}`); for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
const matClose = (A, B, tol = 1e-10, msg = '') => { const d = maxDiff(A, B); if (!(d <= tol)) throw new Error(`${msg} matrices differ by ${d.toExponential(2)} (tol ${tol})`); };
const R = M.rng(12345);
const randMat = (m, n, r = R) => Array.from({ length: m }, () => Array.from({ length: n }, () => r.uniform(-1, 1)));
const diag = (v) => v.map((x, i) => v.map((_, j) => (i === j ? x : 0)));
const T = M.transpose, mul = M.matMul;

// ------------------------------------------------------------ FFT
test('fft matches naive DFT (powers of two)', () => {
  for (const n of [1, 2, 4, 8, 64, 256]) {
    const re = Array.from({ length: n }, () => R.uniform(-1, 1)), im = Array.from({ length: n }, () => R.uniform(-1, 1));
    const ref = M.dft(re, im), a = re.slice(), b = im.slice(); M.fft(a, b);
    ok(maxDiff(a, ref.re) < 1e-11 * n && maxDiff(b, ref.im) < 1e-11 * n, `n=${n}`);
  }
});
test('fft is an exact DFT for non-power-of-two lengths (Bluestein)', () => {
  for (const n of [3, 5, 7, 12, 100, 243, 1000]) {
    const re = Array.from({ length: n }, () => R.uniform(-1, 1)), im = Array.from({ length: n }, () => R.uniform(-1, 1));
    const ref = M.dft(re, im), a = re.slice(), b = im.slice(); M.fft(a, b);
    ok(maxDiff(a, ref.re) < 1e-10 * n && maxDiff(b, ref.im) < 1e-10 * n, `n=${n}: ${maxDiff(a, ref.re)}`);
  }
});
test('ifft inverts fft; typed arrays work in place', () => {
  for (const n of [16, 30]) {
    const re = Float64Array.from({ length: n }, () => R.uniform(-1, 1)), im = new Float64Array(n), r0 = re.slice();
    M.fft(re, im); M.ifft(re, im);
    ok(maxDiff(Array.from(re), Array.from(r0)) < 1e-13 && maxDiff(Array.from(im), new Array(n).fill(0)) < 1e-13, `n=${n}`);
  }
  const d = M.dft([1, 2, 3], null), back = M.dft(d.re, d.im, true);
  ok(maxDiff(back.re, [1, 2, 3]) < 1e-13, 'dft inverse');
});
test('fftReal of a cosine; Parseval; spectrum amplitude', () => {
  const N = 64, x = M.range(N).map((n) => Math.cos(M.TAU * 5 * n / N));
  const { re, im } = M.fftReal(x);
  close(re[5], N / 2, 1e-12); close(re[N - 5], N / 2, 1e-12); close(Math.hypot(re[6], im[6]), 0, 1e-12);
  const e1 = M.sum(x, (v) => v * v), e2 = M.sum(re, (v, k) => v * v + im[k] * im[k]) / N; close(e1, e2, 1e-12, 'Parseval');
  const sp = M.spectrum(M.range(100).map((n) => 3 * Math.cos(M.TAU * 7 * n / 100 + 0.4) + 1), 1000);
  close(sp.amp[7], 3, 1e-12); close(sp.amp[0], 1, 1e-12); close(sp.freq[7], 70, 1e-12); close(sp.phase[7], 0.4, 1e-12);
  ok(Array.isArray(re) && re.length === N, 'fftReal returns plain arrays');
});
test('fft2 matches the 2D DFT; ifft2 inverts', () => {
  const Rn = 4, C = 6, re = randMat(Rn, C), im = randMat(Rn, C);
  const ref = (k, l) => { let sr = 0, si = 0; for (let a = 0; a < Rn; a++) for (let b = 0; b < C; b++) { const t = -M.TAU * (k * a / Rn + l * b / C); sr += re[a][b] * Math.cos(t) - im[a][b] * Math.sin(t); si += re[a][b] * Math.sin(t) + im[a][b] * Math.cos(t); } return [sr, si]; };
  const A = re.map((r) => r.slice()), B = im.map((r) => r.slice()); M.fft2(A, B);
  for (let k = 0; k < Rn; k++) for (let l = 0; l < C; l++) { const [sr, si] = ref(k, l); close(A[k][l], sr, 1e-12); close(B[k][l], si, 1e-12); }
  M.ifft2(A, B); matClose(A, re, 1e-13); matClose(B, im, 1e-13);
});
test('fftShift / ifftShift', () => {
  eq(M.fftShift([0, 1, 2, 3, 4]), [3, 4, 0, 1, 2]); eq(M.fftShift([0, 1, -2, -1]), [-2, -1, 0, 1]);
  eq(M.ifftShift(M.fftShift([0, 1, 2, 3, 4])), [0, 1, 2, 3, 4]);
  eq(M.fftShift([[1, 2], [3, 4]]), [[4, 3], [2, 1]]);
  eq(M.zeroPad([1, 2, 3]), [1, 2, 3, 0]); eq(M.nextPow2(17), 32);
  let threw = false; try { M.fft([1, 2], [0]); } catch { threw = true; } ok(threw, 'length mismatch throws');
});

// ------------------------------------------------------------ linear algebra
test('zeros, trace, outer, kron, matPow', () => {
  eq(M.zeros(2, 3), [[0, 0, 0], [0, 0, 0]]); eq(M.trace([[1, 2], [3, 4]]), 5); eq(M.outer([1, 2], [3, 4, 5]), [[3, 4, 5], [6, 8, 10]]);
  eq(M.kron([[1, 2], [3, 4]], [[0, 1], [1, 0]]), [[0, 1, 0, 2], [1, 0, 2, 0], [0, 3, 0, 4], [3, 0, 4, 0]]);
  eq(M.matPow([[1, 1], [1, 0]], 10), [[89, 55], [55, 34]]); eq(M.matPow([[2, 0], [0, 3]], 0), [[1, 0], [0, 1]]);
  matClose(M.matPow([[2, 1], [1, 1]], -3), M.matPow(M.inverse([[2, 1], [1, 1]]), 3), 1e-12);
  ok(M.matPow([[1, 2], [2, 4]], -1) === null, 'singular negative power → null');
});
test('lu: P·A = L·U, determinant, luSolve (vector and matrix rhs)', () => {
  for (const n of [1, 3, 6]) {
    const A = randMat(n, n), F = M.lu(A);
    matClose(mul(F.P, A), mul(F.L, F.U), 1e-13, `n=${n}`);
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) ok(F.U[i][j] === 0 && Math.abs(F.L[i][j]) <= 1, 'triangular, |L| ≤ 1');
    close(F.sign * F.U.reduce((p, r, i) => p * r[i], 1), M.det(A), 1e-12, 'det');
    const x = Array.from({ length: n }, () => R.uniform(-2, 2)), b = M.matVec(A, x);
    ok(maxDiff(M.luSolve(F, b), x) < 1e-10, 'luSolve');
    const X = randMat(n, 2); matClose(M.luSolve(A, mul(A, X)), X, 1e-10, 'matrix rhs');
  }
  const S = M.lu([[1, 2], [2, 4]]); ok(S.singular && M.luSolve(S, [1, 1]) === null, 'singular');
});
test('qr (Householder): orthogonal Q, triangular R ≥ 0 on the diagonal, thin form', () => {
  for (const [m, n] of [[3, 3], [5, 3], [3, 5], [6, 6]]) {
    const A = randMat(m, n), { Q, R: Rm } = M.qr(A);
    matClose(mul(Q, Rm), A, 1e-13, `QR=A ${m}x${n}`); matClose(mul(T(Q), Q), M.identity(m), 1e-13, 'QᵀQ=I');
    for (let i = 0; i < m; i++) for (let j = 0; j < Math.min(i, n); j++) ok(Rm[i][j] === 0, 'upper triangular');
    for (let i = 0; i < Math.min(m, n); i++) ok(Rm[i][i] >= 0, 'R_ii ≥ 0');
    const th = M.qr(A, { thin: true }), k = Math.min(m, n);
    ok(th.Q.length === m && th.Q[0].length === k && th.R.length === k, 'thin shape'); matClose(mul(th.Q, th.R), A, 1e-13, 'thin');
  }
  // matches Gram–Schmidt on a full-rank matrix
  const A = [[1, 1], [1, 0], [0, 1]], gs = M.gramSchmidt(T(A)), { Q } = M.qr(A, { thin: true });
  matClose(T(Q), gs, 1e-13, 'Q = Gram–Schmidt');
});
test('eigSym (Jacobi): known spectrum, A V = V Λ, orthonormal, descending', () => {
  const A = [[2, 1, 0], [1, 2, 1], [0, 1, 2]], { values, vectors, vecs } = M.eigSym(A);
  close(values[0], 2 + Math.SQRT2, 1e-14); close(values[1], 2, 1e-14); close(values[2], 2 - Math.SQRT2, 1e-14);
  matClose(mul(A, vectors), mul(vectors, diag(values)), 1e-13, 'AV=VΛ'); matClose(mul(T(vectors), vectors), M.identity(3), 1e-13, 'VᵀV=I');
  matClose(vecs[0], [0.5, Math.SQRT1_2, 0.5], 1e-13, 'top eigenvector');
  const B = randMat(8, 8), S = B.map((r, i) => r.map((x, j) => x + B[j][i])), e = M.eigSym(S);
  matClose(mul(S, e.vectors), mul(e.vectors, diag(e.values)), 1e-12, 'random 8x8');
  for (let i = 1; i < 8; i++) ok(e.values[i - 1] >= e.values[i], 'sorted');
  close(M.sum(e.values), M.trace(S), 1e-12, 'trace');
  const e2 = M.eigSym2([[3, 1], [1, 3]]), e3 = M.eigSym([[3, 1], [1, 3]]); close(e3.values[0], e2.values[0]); close(e3.values[1], e2.values[1]);
});
test('eig (general): rotation, companion, random matrix residuals, complex eigenvectors', () => {
  const r = M.eig([[0, -1], [1, 0]]);
  close(r.values[0].re, 0, 1e-14); close(r.values[0].im, 1, 1e-14); close(r.values[1].im, -1, 1e-14);
  ok(r.vectors[0] === null && r.cvectors[0], 'complex eigenvector present');
  const comp = [[6, -11, 6], [1, 0, 0], [0, 1, 0]], c = M.eig(comp); // (x−1)(x−2)(x−3)
  [3, 2, 1].forEach((v, i) => { close(c.values[i].re, v, 1e-12); close(c.values[i].im, 0, 0); });
  for (let i = 0; i < 3; i++) ok(maxDiff(M.matVec(comp, c.vectors[i]), M.vscale(c.vectors[i], c.values[i].re)) < 1e-11, 'real residual');
  for (const n of [4, 7, 10]) {
    const A = randMat(n, n), { values, vectors, cvectors } = M.eig(A);
    close(M.sum(values, (z) => z.re), M.trace(A), 1e-11, 'Σλ = tr');
    let pr = new M.Cx(1, 0); for (const z of values) pr = pr.mul(z); close(pr.re, M.det(A), 1e-10, 'Πλ = det'); close(pr.im, 0, 1e-10);
    for (let i = 1; i < n; i++) ok(values[i - 1].abs() >= values[i].abs() - 1e-12, 'sorted by modulus');
    values.forEach((z, i) => {
      const v = cvectors[i]; // (A − λ)(x + iy) = 0
      const Ax = M.matVec(A, v.re), Ay = M.matVec(A, v.im);
      const resR = Ax.map((a, k) => a - (z.re * v.re[k] - z.im * v.im[k])), resI = Ay.map((a, k) => a - (z.re * v.im[k] + z.im * v.re[k]));
      ok(M.norm(resR.concat(resI)) < 1e-9, `eigvec residual n=${n} i=${i}: ${M.norm(resR.concat(resI))}`);
      close(Math.hypot(...v.re, ...v.im), 1, 1e-12, 'unit');
      if (z.im === 0) ok(vectors[i] !== null, 'real eigenvalue has real vector');
    });
  }
  const J = M.eig([[1, 1], [0, 1]]); matClose(J.vectors[0], [1, 0], 1e-12); matClose(J.vectors[1], [1, 0], 1e-12, 'defective: same vector');
  const I3 = M.eig(M.identity(3)); matClose(mul(T(T(I3.vectors)), T(I3.vectors)), M.identity(3), 1e-12, 'repeated eigenvalue: independent vectors');
  const bad = M.eig([[1, 1e6], [1e-6, 1]]); close(bad.values[0].re, 2, 1e-9); close(bad.values[1].re, 0, 1e-9); // needs balancing
  const ev = M.eig2([[1, 2], [3, 4]]), eg = M.eig([[1, 2], [3, 4]]); close(eg.values[0].re, ev[0][0], 1e-13); close(eg.values[1].re, ev[1][0], 1e-13);
});
test('svd (one-sided Jacobi): reconstruction, orthonormality, rank deficiency, wide matrices', () => {
  for (const [m, n] of [[5, 3], [3, 5], [6, 6], [1, 4], [4, 1]]) {
    const A = randMat(m, n), { U, S, V } = M.svd(A), k = Math.min(m, n);
    ok(U.length === m && U[0].length === k && V.length === n && V[0].length === k && S.length === k, 'shapes');
    matClose(mul(mul(U, diag(S)), T(V)), A, 1e-13, `A = U S Vᵀ (${m}x${n})`);
    matClose(mul(T(U), U), M.identity(k), 1e-13, 'UᵀU'); matClose(mul(T(V), V), M.identity(k), 1e-13, 'VᵀV');
    for (let i = 1; i < k; i++) ok(S[i - 1] >= S[i] && S[i] >= 0, 'descending');
  }
  const D = M.svd([[3, 0], [0, -4]]); close(D.S[0], 4); close(D.S[1], 3);
  const B = mul(randMat(5, 2), randMat(2, 4)), s = M.svd(B); // rank 2
  ok(s.S[2] < 1e-14 && s.S[3] < 1e-14, 'two zero singular values'); matClose(mul(T(s.U), s.U), M.identity(4), 1e-12, 'U completed orthonormally');
  matClose(mul(mul(s.U, diag(s.S)), T(s.V)), B, 1e-13);
  const s2 = M.svd2([[2, 1], [0, 1]]), sv = M.svd([[2, 1], [0, 1]]).S; close(sv[0], s2[0], 1e-12); close(sv[1], s2[1], 1e-12);
  const Z = M.svd([[0, 0], [0, 0]]); eq(Z.S, [0, 0]); matClose(mul(T(Z.U), Z.U), M.identity(2), 1e-14, 'zero matrix');
});
test('pinv, lstsq, rank, nullspace, rref', () => {
  const A = randMat(6, 3), P = M.pinv(A); matClose(mul(mul(A, P), A), A, 1e-12, 'A A⁺ A = A');
  const xs = [0, 1, 2, 3, 4], ys = [1.1, 2.9, 5.2, 6.8, 9.1], L = M.linreg(xs, ys);
  const coef = M.lstsq(xs.map((x) => [1, x]), ys); close(coef[0], L.intercept, 1e-12); close(coef[1], L.slope, 1e-12);
  const Rk = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  eq(M.rank(Rk), 2); eq(M.rank(M.identity(4)), 4); eq(M.rank([[0, 0], [0, 0]]), 0);
  const ns = M.nullspace(Rk); ok(ns.length === 1, 'nullity 1'); matClose(ns[0], [-1, 2, -1].map((x) => x / Math.sqrt(6)), 1e-12);
  const ns2 = M.nullspace([[1, 1, 0, 0], [0, 0, 1, 1]]); ok(ns2.length === 2, 'wide: nullity 2');
  for (const v of ns2) ok(M.norm(M.matVec([[1, 1, 0, 0], [0, 0, 1, 1]], v)) < 1e-14, 'A v = 0');
  ok(M.nullspace(M.identity(3)).length === 0, 'trivial');
  const { R: Rr, pivots } = M.rref(Rk); matClose(Rr, [[1, 0, -1], [0, 1, 2], [0, 0, 0]], 1e-14); eq(pivots, [0, 1]);
  const r2 = M.rref([[0, 2, 4, 2], [1, 1, 1, 1], [2, 4, 6, 4]]); eq(r2.pivots, [0, 1]); matClose(r2.R, [[1, 0, -1, 0], [0, 1, 2, 1], [0, 0, 0, 0]], 1e-14);
  ok(Object.is(r2.R[2][0], 0), 'exact zeros');
});
test('expm: rotation generator, nilpotent, diagonal, stiff (Moler–Van Loan) example', () => {
  const th = 1.234; matClose(M.expm([[0, -th], [th, 0]]), [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]], 1e-14, 'rotation');
  matClose(M.expm([[0, 1], [0, 0]]), [[1, 1], [0, 1]], 1e-15); matClose(M.expm(M.zeros(3)), M.identity(3), 0);
  matClose(M.expm(diag([1, -2, 3])), diag([Math.E, Math.exp(-2), Math.exp(3)]), 1e-13);
  const V = [[1, 3], [2, 4]], Vi = [[-2, 1.5], [1, -0.5]], ref = mul(mul(V, diag([Math.exp(-1), Math.exp(-17)])), Vi);
  matClose(M.expm([[-49, 24], [-64, 31]]), ref, 1e-12, 'Moler example');
  const big = M.expm([[0, -50], [50, 0]]); matClose(big, [[Math.cos(50), -Math.sin(50)], [Math.sin(50), Math.cos(50)]], 1e-12, 'large norm');
});
test('charPoly (Faddeev–LeVerrier)', () => {
  eq(M.charPoly([[2, 1], [1, 2]]), [3, -4, 1]);
  const A = randMat(5, 5), c = M.charPoly(A); close(c[4], -M.trace(A), 1e-12); close(c[0], -M.det(A), 1e-12); close(c[5], 1);
  for (const z of M.eig(A).values) { const p = c.reduceRight((acc, ci) => acc.mul(z).add(ci), new M.Cx(0, 0)); ok(p.abs() < 1e-10, 'p(λ) = 0'); }
});
test('existing helpers unchanged', () => {
  close(M.det([[1, 2], [3, 4]]), -2); matClose(M.inverse([[2, 0], [0, 4]]), [[0.5, 0], [0, 0.25]], 0); matClose(M.solve([[2, 0], [0, 4]], [2, 4]), [1, 1], 0);
  close(M.dist([0, 0], [3, 4]), 5); close(M.gamma(5), 24, 1e-12); close(M.poisson(0.5, 0), 3, 1e-12);
});

// ------------------------------------------------------------ special functions & distributions
test('erf / erfc / lgamma', () => {
  close(M.erf(0.5), 0.5204998778130465, 2e-15); close(M.erf(1), 0.8427007929497149, 2e-15); close(M.erf(-2), -0.9953222650189527, 2e-15);
  close(M.erfc(3), 2.209049699858544e-05, 1e-13); close(M.erfc(10) / 2.088487583762545e-45, 1, 1e-12); close(M.erfc(-1), 1.8427007929497148, 1e-15);
  close(M.erf(1e-10), 1e-10 * 2 / Math.sqrt(Math.PI), 1e-15); eq(M.erf(0), 0);
  close(M.lgamma(0.5), Math.log(Math.sqrt(Math.PI)), 1e-15); close(M.lgamma(10), Math.log(362880), 1e-15);
  close(M.lgamma(4.5), Math.log(11.631728396567448), 1e-14); close(M.lgamma(-0.5), Math.log(2 * Math.sqrt(Math.PI)), 1e-14);
  close(M.lgamma(200), 857.9336698258574, 1e-14); close(M.lbeta(2, 3), Math.log(1 / 12), 1e-14);
});
test('incomplete gamma P/Q and incomplete beta', () => {
  for (const x of [0.1, 1, 5]) close(M.gammaP(1, x), 1 - Math.exp(-x), 1e-14);
  for (const x of [0.01, 0.7, 3]) close(M.gammaP(0.5, x), M.erf(Math.sqrt(x)), 1e-14);
  close(M.gammaP(3, 2), 1 - 5 * Math.exp(-2), 1e-14);
  let q = 0; for (let k = 0; k < 10; k++) q += Math.exp(-20 + k * Math.log(20) - M.lgamma(k + 1)); close(M.gammaQ(10, 20), q, 1e-12);
  close(M.gammaP(7.3, 4.1) + M.gammaQ(7.3, 4.1), 1, 1e-15); eq(M.gammaP(2, 0), 0); eq(M.gammaQ(2, Infinity), 0);
  let pq = 0; for (let k = 0; k < 500; k++) pq += Math.exp(-520 + k * Math.log(520) - M.lgamma(k + 1)); close(M.gammaP(500, 520), 1 - pq, 1e-11, 'large a vs Poisson sum');
  for (const x of [0.2, 0.9]) { close(M.betaI(1, 1, x), x, 1e-14); close(M.betaI(2.5, 1, x), x ** 2.5, 1e-14); close(M.betaI(1, 3, x), 1 - (1 - x) ** 3, 1e-14); }
  close(M.betaI(2, 3, 0.3), 0.3483, 1e-13); close(M.betaI(7, 7, 0.5), 0.5, 1e-14); eq(M.betaI(2, 2, 0), 0); eq(M.betaI(2, 2, 1), 1);
});
test('normal distribution', () => {
  const N = M.dist.normal(0, 1);
  close(N.quantile(0.975), 1.959963984540054, 1e-14); close(N.quantile(0.5), 0, 0); close(N.quantile(1e-10), -6.361340902404056, 1e-13);
  close(N.cdf(-1.96), 0.024997895148220435, 1e-14); close(N.pdf(0), 1 / Math.sqrt(2 * Math.PI), 1e-15); close(N.cdf(-10) / 7.619853024160527e-24, 1, 1e-12);
  for (const p of [1e-8, 0.001, 0.2, 0.5, 0.77, 0.999]) close(N.cdf(N.quantile(p)), p, 1e-14 / Math.min(1, p * 1e3));
  const G = M.dist.normal(10, 2); close(G.quantile(0.975), 10 + 2 * 1.959963984540054, 1e-14); eq(G.mean, 10); eq(G.variance, 4); eq(G.stdev, 2);
  close(M.integrate(G.pdf, -10, 30, 4000), 1, 1e-10);
  const xs = G.sample(M.rng(7), 20000); close(M.mean(xs), 10, 4 * 2 / Math.sqrt(20000)); close(M.stdev(xs), 2, 0.05);
  ok(typeof G.sample(M.rng(1)) === 'number', 'single draw'); const sp = N.span(0.025); close(sp[1], 1.959963984540054, 1e-14);
});
test('binomial distribution', () => {
  const B = M.dist.binomial(10, 0.3);
  close(B.pmf(3), 0.266827932, 1e-9); close(B.cdf(3), 0.6496107184, 1e-9); eq(B.quantile(0.5), 3); eq(B.quantile(0.6496107183), 3); eq(B.quantile(0.6496107185), 4);
  close(M.sum(M.range(11), (k) => B.pmf(k)), 1, 1e-14); eq(B.pmf(2.5), 0); eq(B.cdf(-1), 0); eq(B.cdf(10), 1); close(B.mean, 3, 1e-15); close(B.variance, 2.1, 1e-15);
  const xs = B.sample(M.rng(3), 20000); close(M.mean(xs), 3, 4 * Math.sqrt(2.1 / 20000));
  const Bb = M.dist.binomial(1000, 0.4), ys = Bb.sample(M.rng(4), 3000); close(M.mean(ys), 400, 4 * Math.sqrt(240 / 3000));
  close(Bb.cdf(400), M.sum(M.range(401), (k) => Bb.pmf(k)), 1e-12);
  ok(Number.isInteger(ys[0]), 'integer draws');
});
test('poisson distribution', () => {
  const P = M.dist.poisson(4);
  close(P.pmf(2), 8 * Math.exp(-4), 1e-14); close(P.cdf(2), 13 * Math.exp(-4), 1e-14); eq(P.quantile(0.5), 4); eq(P.quantile(0), 0);
  close(M.sum(M.range(60), (k) => P.pmf(k)), 1, 1e-14);
  close(M.mean(P.sample(M.rng(5), 20000)), 4, 4 * Math.sqrt(4 / 20000));
  const Pb = M.dist.poisson(250); close(M.mean(Pb.sample(M.rng(6), 4000)), 250, 4 * Math.sqrt(250 / 4000)); close(Pb.cdf(250), M.sum(M.range(251), (k) => Pb.pmf(k)), 1e-11);
});
test('exponential, uniform, geometric', () => {
  const E = M.dist.exponential(2); close(E.cdf(1), 1 - Math.exp(-2), 1e-15); close(E.quantile(0.5), Math.LN2 / 2, 1e-15); eq(E.mean, 0.5); eq(E.pdf(-1), 0);
  close(M.mean(E.sample(M.rng(8), 20000)), 0.5, 4 * 0.5 / Math.sqrt(20000));
  const U = M.dist.uniform(2, 5); eq(U.mean, 3.5); close(U.variance, 0.75); close(U.quantile(0.25), 2.75); eq(U.cdf(6), 1); close(U.pdf(3), 1 / 3);
  ok(U.sample(M.rng(1), 1000).every((x) => x >= 2 && x < 5), 'uniform range');
  const Gm = M.dist.geometric(0.25); close(Gm.pmf(1), 0.25); close(Gm.cdf(3), 0.578125, 1e-15); eq(Gm.quantile(0.578125), 3); eq(Gm.quantile(0.5781), 3); eq(Gm.quantile(0.5782), 4);
  eq(Gm.mean, 4); close(Gm.variance, 12); close(M.mean(Gm.sample(M.rng(9), 20000)), 4, 4 * Math.sqrt(12 / 20000)); ok(Gm.sample(M.rng(2), 500).every((k) => k >= 1), 'k ≥ 1');
});
test('gamma, beta, chi², Student t', () => {
  const G = M.dist.gamma(3, 2); close(G.cdf(4), 1 - 5 * Math.exp(-2), 1e-14); eq(G.mean, 6); eq(G.variance, 12);
  for (const p of [0.01, 0.3, 0.9, 0.999]) close(G.cdf(G.quantile(p)), p, 1e-12);
  close(M.integrate(G.pdf, 0, 80, 4000), 1, 1e-9); const gs = G.sample(M.rng(10), 20000); close(M.mean(gs), 6, 4 * Math.sqrt(12 / 20000)); close(M.variance(gs), 12, 0.6);
  const Gs = M.dist.gamma(0.4, 1); close(M.mean(Gs.sample(M.rng(11), 20000)), 0.4, 4 * Math.sqrt(0.4 / 20000)); close(Gs.cdf(Gs.quantile(0.3)), 0.3, 1e-12);
  const B = M.dist.beta(2, 3); close(B.cdf(0.3), 0.3483, 1e-13); close(B.mean, 0.4); close(B.variance, 0.04); close(B.cdf(B.quantile(0.42)), 0.42, 1e-13);
  close(M.integrate(B.pdf, 0, 1, 2000), 1, 1e-12); close(M.mean(B.sample(M.rng(12), 20000)), 0.4, 4 * 0.2 / Math.sqrt(20000));
  close(M.dist.chi2(3).quantile(0.95), 7.814727903251178, 1e-12); close(M.dist.chi2(1).quantile(0.95), 3.841458820694124, 1e-12);
  close(M.dist.chi2(10).cdf(10), 0.5595067149347875, 1e-12); eq(M.dist.chi2(4).mean, 4); eq(M.dist.chi2(4).variance, 8);
  const t5 = M.dist.studentT(5); close(t5.quantile(0.975), 2.570581835636314, 1e-12); close(t5.cdf(0), 0.5, 1e-15); close(t5.quantile(0.025), -2.570581835636314, 1e-12);
  close(M.dist.studentT(1).cdf(1), 0.75, 1e-14); close(M.dist.studentT(30).quantile(0.975), 2.042272456301238, 1e-12);
  close(t5.variance, 5 / 3); ok(isNaN(M.dist.studentT(1).mean), 'Cauchy mean undefined'); close(M.integrate(t5.pdf, -200, 200, 20000), 1, 1e-5);
  close(M.mean(M.dist.studentT(8).sample(M.rng(13), 20000)), 0, 4 * Math.sqrt(8 / 6 / 20000));
});
test('histogram, quantile, median, variance, stdev, cumsum, linreg', () => {
  const H = M.histogram(M.range(10), { bins: 5, range: [0, 10] }); eq(H.counts, [2, 2, 2, 2, 2]); eq(H.edges, [0, 2, 4, 6, 8, 10]); eq(H.centers, [1, 3, 5, 7, 9]);
  const H2 = M.histogram([0, 1, 1, 2, 10, 11], { bins: 2, range: [0, 10] }); eq(H2.counts, [4, 1], 'right edge included, outside ignored'); eq(H2.total, 5);
  const xs = M.dist.normal(0, 1).sample(M.rng(21), 5000), A = M.histogram(xs);
  close(M.sum(A.density, (d, i) => d * (A.edges[i + 1] - A.edges[i])), 1, 1e-12); ok(A.counts.length >= 13 && A.counts.length <= 200, 'auto bins');
  eq(M.sum(A.counts), 5000); const E = M.histogram([0.5, 1.5, 1.7, 3], { bins: [0, 1, 2, 4] }); eq(E.counts, [1, 2, 1]);
  close(M.quantile([1, 2, 3, 4], 0.5), 2.5); eq(M.quantile([1, 2, 3, 4], [0, 1]), [1, 4]); close(M.quantile([10, 20, 30, 40, 50], 0.3), 22); eq(M.median([3, 1, 2]), 2);
  close(M.variance([2, 4, 4, 4, 5, 5, 7, 9], 0), 4); close(M.variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7, 1e-15); close(M.stdev([2, 4, 4, 4, 5, 5, 7, 9], 0), 2);
  close(M.variance([1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]), 30, 1e-9, 'Welford stability'); eq(M.cumsum([1, 2, 3, 4]), [1, 3, 6, 10]);
  const L = M.linreg([0, 1, 2, 3], [1, 3, 5, 7]); close(L.slope, 2); close(L.intercept, 1); close(L.r, 1); close(L.predict(10), 21);
  const L2 = M.linreg([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]); close(L2.slope, 0.6); close(L2.intercept, 2.2); close(L2.r2, 0.6, 1e-12); close(L2.seSlope, 0.282842712474619, 1e-12);
});

// ------------------------------------------------------------ ODE integrators
const energy = (x, v) => 0.5 * (x * x + v * v);
test('verlet / leapfrog conserve harmonic-oscillator energy (no drift); explicit Euler drifts', () => {
  for (const integ of [M.verlet, M.leapfrog]) {
    const { t, x, v } = integ((x) => -x, 1, 0, 0.05, 10000);
    ok(t.length === 10001 && Math.abs(t[10000] - 500) < 1e-9, 'time grid');
    let maxErr = 0, early = 0, late = 0;
    for (let i = 0; i <= 10000; i++) { const d = Math.abs(energy(x[i], v[i]) - 0.5); maxErr = Math.max(maxErr, d); if (i < 1000) early = Math.max(early, d); if (i > 9000) late = Math.max(late, d); }
    ok(maxErr < 4e-4, `energy error ${maxErr}`); ok(late < 1.05 * early, `no secular drift ${early} → ${late}`);
  }
  const se = M.symplecticEuler((x) => -x, 1, 0, 0.05, 10000); let m = 0; for (let i = 0; i <= 10000; i++) m = Math.max(m, Math.abs(energy(se.x[i], se.v[i]) - 0.5)); ok(m < 0.03, `symplectic Euler bounded ${m}`);
  const eu = M.euler((t, y) => [y[1], -y[0]], 0, [1, 0], 500, 10000), yl = eu.y[10000]; ok(energy(yl[0], yl[1]) > 1, 'explicit Euler gains energy');
});
test('verlet is second order; vector form conserves Kepler energy and angular momentum', () => {
  const err = (dt) => { const n = Math.round(1 / dt), r = M.verlet((x) => -x, 1, 0, dt, n); return Math.abs(r.x[n] - Math.cos(1)); };
  const ratio = err(0.01) / err(0.005); ok(ratio > 3.8 && ratio < 4.2, `order ratio ${ratio}`);
  const acc = ([x, y]) => { const r3 = Math.hypot(x, y) ** 3; return [-x / r3, -y / r3]; };
  const k = M.verlet(acc, [1, 0], [0, 1.2], 0.002, 20000);
  const E = (i) => 0.5 * M.dot(k.v[i], k.v[i]) - 1 / M.norm(k.x[i]), Lz = (i) => k.x[i][0] * k.v[i][1] - k.x[i][1] * k.v[i][0];
  close(E(20000), E(0), 1e-5, 'Kepler energy'); close(Lz(20000), Lz(0), 1e-10, 'angular momentum');
  ok(Array.isArray(k.x[5]) && k.x[5] !== k.x[6], 'copies of state');
});
test('rk45 (Dormand–Prince): accuracy, systems, backwards, ends exactly at t1', () => {
  const r = M.rk45((t, y) => y, 0, 1, 1, { tol: 1e-10 }); close(r.y[r.y.length - 1], Math.E, 1e-8); eq(r.t[r.t.length - 1], 1); ok(r.ok, 'ok');
  const h = M.rk45((t, [x, v]) => [v, -x], 0, [1, 0], 2 * Math.PI, { tol: 1e-9 }), end = h.y[h.y.length - 1];
  close(end[0], 1, 1e-7); close(end[1], 0, 1e-7); ok(h.t.length < 400, `step count ${h.t.length}`);
  const b = M.rk45((t, y) => -2 * t * y, 2, Math.exp(-4), 0, { tol: 1e-10 }); close(b.y[b.y.length - 1], 1, 1e-8, 'backwards'); eq(b.t[b.t.length - 1], 0);
  const lo = M.rk45((t, y) => Math.cos(t), 0, 0, 10, { tol: 1e-4, hmax: 0.1 }); ok(lo.t.every((t, i) => !i || t - lo.t[i - 1] <= 0.1 + 1e-12), 'hmax respected');
  close(lo.y[lo.y.length - 1], Math.sin(10), 1e-3);
});
test('implicitEuler handles a stiff problem; first order; with and without Jacobian', () => {
  const F = (t, y) => -1000 * (y - Math.cos(t)), exact = (t) => { // y(0) = 0
    const a = 1000, c = a / (a * a + 1); return c * (a * Math.cos(t) + Math.sin(t)) - c * a * Math.exp(-a * t); };
  const r = M.implicitEuler(F, 0, 0, 1, 50); ok(Math.abs(r.y[50] - exact(1)) < 2e-3, `stiff: ${r.y[50]} vs ${exact(1)}`);
  const rj = M.implicitEuler(F, (t, y) => -1000, 0, 0, 1, 50); close(rj.y[50], r.y[50], 1e-9, 'analytic J agrees');
  const ex = M.euler((t, y) => [F(t, y[0])], 0, [0], 1, 50); ok(!(Math.abs(ex.y[50][0]) < 1e3), 'explicit Euler blows up at this step');
  const e1 = Math.abs(M.implicitEuler((t, y) => -y, 0, 1, 1, 100).y[100] - Math.exp(-1)), e2 = Math.abs(M.implicitEuler((t, y) => -y, 0, 1, 1, 200).y[200] - Math.exp(-1));
  close(e1 / e2, 2, 0.02, 'first order');
  const A = [[-1, 0], [1, -1000]], sys = M.implicitEuler((t, y) => M.matVec(A, y), null, 0, [1, 0], 1, 400), ref = M.matVec(M.expm(A), [1, 0]);
  ok(maxDiff(sys.y[400], ref) < 2e-3, 'stiff linear system');
  const vdp = M.implicitEuler((t, [x, v]) => [v, 1000 * (1 - x * x) * v - x], 0, [2, 0], 3000, 3000); // h = 1 on stiff Van der Pol
  ok(vdp.y.every(([x]) => Math.abs(x) <= 2.001), 'Newton failure → step halving keeps the relaxation oscillation bounded');
  const ref8 = M.rk45((t, [x, v]) => [v, 1000 * (1 - x * x) * v - x], 0, [2, 0], 800, { tol: 1e-8, maxSteps: 2e6 }).y.at(-1)[0];
  close(M.implicitEuler((t, [x, v]) => [v, 1000 * (1 - x * x) * v - x], 0, [2, 0], 800, 8000).y.at(-1)[0], ref8, 2e-3, 'stiff Van der Pol vs rk45');
});
test('gillespie: exponential decay mean, step-path format, birth–death stationary mean', () => {
  const r = M.rng(99); let s = 0; const runs = 300;
  for (let k = 0; k < runs; k++) { const g = M.gillespie((x) => [x], [-1], 100, 1, r); s += g.x[g.x.length - 1]; ok(g.t[g.t.length - 1] === 1, 'ends at tMax'); }
  close(s / runs, 100 * Math.exp(-1), 4 * Math.sqrt(100 * Math.exp(-1) * (1 - Math.exp(-1)) / runs));
  const bd = M.gillespie([(x) => 10, (x) => 0.5 * x[0]], [[1], [-1]], [0], 2000, M.rng(5));
  let area = 0; for (let i = 0; i + 1 < bd.t.length; i++) area += bd.x[i][0] * (bd.t[i + 1] - bd.t[i]);
  close(area / 2000, 20, 0.08, 'time-average ≈ λ/μ'); ok(bd.reactions.length === bd.t.length - 2, 'reactions per event');
  for (let i = 1; i < bd.t.length; i++) ok(bd.t[i] >= bd.t[i - 1], 'monotone time');
  const ext = M.gillespie((x) => [x], [-1], 3, 1e9, M.rng(1)); eq(ext.x[ext.x.length - 1], 0, 'absorbed');
});

// ------------------------------------------------------------ constants & units
test('CONST (CODATA 2018) relations and si()', () => {
  const C = M.CONST; eq(C.c, 299792458); eq(C.g0, 9.80665); eq(C.h, 6.62607015e-34);
  close(C.hbar, C.h / (2 * Math.PI), 1e-9); close(C.R, C.NA * C.kB, 1e-9); close(C.F, C.NA * C.e, 1e-9);
  close(C.sigma, 2 * Math.PI ** 5 * C.kB ** 4 / (15 * C.h ** 3 * C.c ** 2), 1e-9); close(C.eps0 * C.mu0 * C.c ** 2, 1, 1e-9);
  close(C.ke, 1 / (4 * Math.PI * C.eps0), 1e-9); close(C.ly, C.c * C.yr, 1e-15); close(C.alpha, C.e ** 2 / (4 * Math.PI * C.eps0 * C.hbar * C.c), 1e-9);
  close(C.a0, C.hbar / (C.me * C.c * C.alpha), 1e-9); close(C.G * C.Msun, 1.3271244e20, 1e-5); close(C.G * C.Mearth, 3.986004e14, 1e-5); close(C.Ry, C.alpha ** 2 * C.me * C.c / (2 * C.h), 1e-9);
  ok(Object.isFrozen(C) && Object.keys(M.CONST_UNITS).every((k) => k in C) && Object.keys(C).every((k) => k in M.CONST_UNITS), 'units documented');
  eq(M.si(0.00234, 'A'), '2.34 mA'); eq(M.si(-1500, 'W'), '−1.50 kW'); eq(M.si(0, 'V'), '0 V'); eq(M.si(999.96, 'W'), '1.00 kW');
  eq(M.si(1e-7, 'm'), '100 nm'); eq(M.si(4.7e-6, 'F', 2), '4.7 µF'); eq(M.si(123), '123'); eq(M.si(12345), '12.3 k'); eq(M.si(6.02214076e23, 'mol⁻¹'), '602 Zmol⁻¹');
  eq(M.si(0.000999999, 's'), '1.00 ms'); eq(M.si(Infinity, 'Ω'), '∞ Ω'); eq(M.si(1, 'g'), '1.00 g');
  eq(M.si(1e-40, 'm'), '1.00×10⁻⁴⁰ m'); eq(M.si(-5e35, 'J'), '−5.00×10³⁵ J'); eq(M.si(1e30, 'W'), '1.00 QW'); eq(M.pow10Text(-12), '10⁻¹²'); eq(M.si(NaN), 'NaN');
});

// ------------------------------------------------------------ number theory
test('gcd, lcm, egcd, modinv, modpow (Number and BigInt)', () => {
  eq(M.gcd(48, 18), 6); eq(M.gcd(-4, 6), 2); eq(M.gcd(0, 5), 5); eq(M.gcd(0, 0), 0); eq(M.gcd(2n ** 64n, 6), 2n); eq(M.lcm(4, 6), 12); eq(M.lcm(4n, 6n), 12n);
  for (const [a, b] of [[240, 46], [-7, 3], [17, 0], [0, 9], [123456789, 987654321]]) { const { g, x, y } = M.egcd(a, b); eq(a * x + b * y, g); eq(g, M.gcd(a, b)); }
  const E = M.egcd(2n ** 89n - 1n, 2n ** 61n - 1n); eq((2n ** 89n - 1n) * E.x + (2n ** 61n - 1n) * E.y, 1n);
  eq(M.modinv(3, 11), 4); eq(M.modinv(2, 4), null); eq(M.modinv(-3, 11), 7); eq(M.modinv(10n, 1000000007n) * 10n % 1000000007n, 1n);
  eq(M.modpow(4, 13, 497), 445); eq(M.modpow(2, 1e9 + 6, 1e9 + 7), 1); eq(M.modpow(3, 0, 7), 1); eq(M.modpow(5, 3, 1), 0);
  eq(M.modpow(2n, 10n ** 18n, 1000000007n), BigInt(M.modpow(2, Number(10n ** 18n % 1000000006n), 1e9 + 7)), 'Fermat reduction');
  eq(M.modpow(3, -1, 11), 4); eq(M.modpow(-2, 3, 5), 2); eq(typeof M.modpow(7, 5, 2 ** 40), 'number');
  eq(M.modpow(7, 5, 2 ** 40), Number(7n ** 5n % 2n ** 40n)); eq(M.modpow(123456789, 987654321, 2 ** 52 - 1), Number(M.modpow(123456789n, 987654321n, 2n ** 52n - 1n)));
});
test('isPrime: deterministic Miller–Rabin, Carmichael numbers and strong pseudoprimes', () => {
  const ps = M.sieve(10000); eq(ps.length, 1229);
  const set = new Set(ps); for (let n = -3; n <= 10000; n++) if (M.isPrime(n) !== set.has(n)) throw new Error(`isPrime(${n})`);
  for (const c of [561, 1105, 1729, 2465, 2821, 6601, 8911, 10585, 15841, 29341, 41041, 62745, 63973, 75361, 101101, 825265, 321197185, 9746347772161]) ok(!M.isPrime(c), `Carmichael ${c}`);
  for (const c of [2047, 1373653, 25326001, 3215031751, 2152302898747, 3474749660383, 341550071728321]) ok(!M.isPrime(c), `strong pseudoprime ${c}`);
  ok(!M.isPrime(3825123056546413051n), 'spsp to bases 2..23'); ok(!M.isPrime(318665857834031151167461n), 'spsp to bases 2..37 (needs base 41)');
  for (const p of [2147483647, 1e9 + 7, 1e9 + 9, 999999999989, 2 ** 53 - 111]) ok(M.isPrime(p), `prime ${p}`);
  ok(M.isPrime(2n ** 61n - 1n) && M.isPrime(18446744073709551557n) && M.isPrime(2n ** 89n - 1n), 'BigInt primes');
  ok(!M.isPrime(2n ** 64n + 1n) && !M.isPrime(2.5) && !M.isPrime(1) && !M.isPrime(0n), 'composites / non-integers');
  eq(M.sieve(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]); eq(M.sieve(1e6).length, 78498); eq(M.sieve(1), []);
});
test('factor (trial division + Pollard–Brent), primeFactors, totient', () => {
  eq(M.factor(360), [[2, 3], [3, 2], [5, 1]]); eq(M.factor(600851475143), [[71, 1], [839, 1], [1471, 1], [6857, 1]]); eq(M.factor(1), []); eq(M.factor(0), []);
  eq(M.factor(4294967297), [[641, 1], [6700417, 1]]); eq(M.factor(97), [[97, 1]]); eq(M.factor(-12), [[2, 2], [3, 1]]);
  eq(M.factor(1000003 * 1000003), [[1000003, 2]]); eq(M.factor(2 ** 53 - 111), [[2 ** 53 - 111, 1]]);
  const p = 99999989n, q = 99999971n; eq(M.factor(p * q * 7n), [[7n, 1], [q, 1], [p, 1]]);
  eq(M.factor((2n ** 61n - 1n) * (2n ** 31n - 1n) ** 2n), [[2n ** 31n - 1n, 2], [2n ** 61n - 1n, 1]]);
  eq(M.factor(2n ** 64n + 1n), [[274177n, 1], [67280421310721n, 1]]);
  const big = 1000000007n * 998244353n * 1000000009n; eq(M.factor(big).map(([f]) => f), [998244353n, 1000000007n, 1000000009n]);
  eq(M.primeFactors(360), [2, 2, 2, 3, 3, 5]); eq(M.totient(36), 12); eq(M.totient(97), 96); eq(M.totient(1), 1); eq(M.totient(10n ** 12n), 400000000000n);
  for (let n = 1; n <= 300; n++) { let c = 0; for (let k = 1; k <= n; k++) if (M.gcd(k, n) === 1) c++; if (M.totient(n) !== c) throw new Error(`φ(${n})`); }
});
test('contFrac & convergents', () => {
  eq(M.contFrac(Math.PI).slice(0, 5), [3, 7, 15, 1, 292]); eq(M.contFrac([415, 93]), [4, 2, 6, 7]); eq(M.contFrac(0.5), [0, 2]); eq(M.contFrac(-0.75), [-1, 4]);
  eq(M.contFrac(Math.SQRT2).slice(0, 12), [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]); eq(M.contFrac(3), [3]); eq(M.contFrac(Math.E).slice(0, 10), [2, 1, 2, 1, 1, 4, 1, 1, 6, 1]);
  const cv = M.convergents(Math.PI, 4); eq(cv, [[3, 1], [22, 7], [333, 106], [355, 113]]);
  const last = M.convergents(Math.PI).pop(); eq(last[0] / last[1], Math.PI, 'final convergent reproduces x');
  const phi = (1 + Math.sqrt(5)) / 2, cf = M.contFrac(phi); ok(cf.every((a) => a === 1), 'golden ratio all ones'); eq(M.convergents([1, 1, 1, 1, 1, 1]).map(([p]) => p), [1, 2, 3, 5, 8, 13]);
  eq(M.contFrac([1n, 3n]), [0, 3]);
});

// ------------------------------------------------------------ music
test('music: MIDI ↔ frequency, cents, Plomp–Levelt (Sethares), note names', () => {
  eq(M.midiToFreq(69), 440); close(M.midiToFreq(60), 261.6255653005986, 1e-14); close(M.midiToFreq(69, 432), 432); close(M.freqToMidi(880), 81, 1e-14);
  close(M.freqToMidi(M.midiToFreq(37.3)), 37.3, 1e-13); close(M.centsBetween(440, 880), 1200, 1e-12); close(M.centsBetween(200, 300), 701.9550008653874, 1e-12);
  eq(M.plompLevelt(500, 500), 0); close(M.plompLevelt(400, 430), M.plompLevelt(430, 400), 1e-15);
  let best = 0, bestD = 0; for (let d = 0; d <= 200; d += 0.01) { const v = M.plompLevelt(500, 500 + d); if (v > best) { best = v; bestD = d; } }
  close(best, 1, 1e-6, 'peak normalised to 1'); close(bestD, 0.2203 / (0.24 / (0.0207 * 500 + 18.96)), 0.01, 'peak location');
  ok(M.plompLevelt(500, 1000) < 0.01, 'octave of pure tones ≈ consonant'); close(M.plompLevelt(500, 520, 0.5, 1), 0.5 * M.plompLevelt(500, 520), 1e-15, 'min amplitude');
  const tone = (f) => M.range(6).map((k) => [f * (k + 1), 0.88 ** k]), D = (r) => M.dissonance(tone(261.63), tone(261.63 * r));
  ok(D(2) < D(1.414) && D(1.5) < D(1.414) && D(1.06) > D(1.25), 'octave/fifth < tritone < semitone'); close(M.dissonance([[440, 1]]), 0);
  eq(M.noteName(60), 'C4'); eq(M.noteName(69), 'A4'); eq(M.noteName(61), 'C♯4'); eq(M.noteName(61, { flats: true }), 'D♭4'); eq(M.noteName(21), 'A0');
  eq(M.noteName(70.4, { ascii: true }), 'A#4'); eq(M.noteName(59, { octave: false }), 'B'); eq(M.noteName(12), 'C0'); eq(M.noteName(11), 'B-1');
});

// ------------------------------------------------------------ polynomial roots
test('polyRoots & polyFromRoots', () => {
  const rs = M.polyRoots([2, -3, 1]).map((z) => z.re).sort((a, b) => a - b); close(rs[0], 1, 1e-10); close(rs[1], 2, 1e-10);
  const quart = M.polyRoots([1, 0, 0, 0, 1]); for (const z of quart) { close(z.abs(), 1, 1e-10); close(z.pow ? 1 : 1, 1); }
  for (const z of quart) { const w = z.mul(z).mul(z).mul(z); close(w.re, -1, 1e-9); close(w.im, 0, 1e-9); }
  const roots = [new M.Cx(1, 2), new M.Cx(-0.5, 0.3), new M.Cx(2, 0)], c = M.polyFromRoots(roots), back = M.polyRoots(c);
  for (const r of roots) ok(back.some((z) => z.sub(r).abs() < 1e-8), 'round trip');
  eq(M.polyFromRoots([1, 2, 3]).map((z) => z.re), [-6, 11, -6, 1]);
  const warm = M.polyRoots(c, { start: back }); for (let i = 0; i < 3; i++) ok(warm[i].sub(back[i]).abs() < 1e-8, 'warm start keeps order');
  eq(M.polyRoots([5]), []); eq(M.polyRoots([1, 1, 0, 0]).length, 1, 'trailing zero coefficients dropped');
});

// ------------------------------------------------------------ complex eigenproblems
test('eigC & solveC', () => {
  const C = (a, b) => new M.Cx(a, b);
  const x = M.solveC([[C(1, 1), 2], [0, C(0, 1)]], [C(3, 1), C(0, 2)]); // y = 2, x = (3+i-4)/(1+i)
  close(x[1].re, 2, 1e-12); close(x[1].im, 0, 1e-12); const x0 = C(-1, 1).div(C(1, 1)); close(x[0].re, x0.re, 1e-12); close(x[0].im, x0.im, 1e-12);
  ok(M.solveC([[1, 2], [2, 4]], [1, 1]) === null, 'singular → null');
  const A = [[C(2, 1), 1, 0], [0, C(-1, 0.5), C(0, 2)], [0, 0, 3]]; // upper triangular: eigenvalues on the diagonal
  const { values, vectors } = M.eigC(A);
  for (const d of [C(2, 1), C(-1, 0.5), C(3, 0)]) ok(values.some((z) => z.sub(d).abs() < 1e-8), `eigenvalue ${d}`);
  values.forEach((lam, k) => { // A v = λ v
    const v = vectors[k].re.map((r, i) => C(r, vectors[k].im[i]));
    for (let i = 0; i < 3; i++) { const Av = A[i].reduce((s, a, j) => s.add(M.Cx.of(a).mul(v[j])), C(0, 0)); ok(Av.sub(lam.mul(v[i])).abs() < 1e-6, 'Av = λv'); }
  });
  const R = M.eigC([[0, -1], [1, 0]]).values; ok(R.some((z) => z.sub(C(0, 1)).abs() < 1e-9) && R.some((z) => z.sub(C(0, -1)).abs() < 1e-9), 'rotation ±i');
});

test('more distributions: cauchy, lognormal, F, mixture, kolmogorov', () => {
  const C = M.dist.cauchy(1, 2); close(C.cdf(1), 0.5, 1e-12); close(C.quantile(0.75), 3, 1e-12); close(C.pdf(1), 1 / (2 * Math.PI), 1e-12);
  const L = M.dist.lognormal(0.3, 0.5); close(L.cdf(Math.exp(0.3)), 0.5, 1e-9); close(L.quantile(L.cdf(2.2)), 2.2, 1e-6); close(M.integrate(L.pdf, 1e-9, 60, 4000), 1, 1e-4);
  const F = M.dist.F(5, 12); close(F.cdf(F.quantile(0.9)), 0.9, 1e-7); close(F.quantile(0.95), 3.105875, 1e-4); close(M.integrate(F.pdf, 1e-9, 200, 20000), 1, 1e-3);
  const X = M.dist.mixture([[M.dist.normal(-2, 1), 1], [M.dist.normal(3, 0.5), 3]]); close(X.mean, 0.25 * -2 + 0.75 * 3, 1e-12); close(X.cdf(X.quantile(0.3)), 0.3, 1e-7);
  const rng = M.rng(7); const xs = X.sample(rng, 20000); close(xs.reduce((s, x) => s + x, 0) / xs.length, X.mean, 0.05);
  const K = M.dist.kolmogorov(); close(K.cdf(1.3581), 0.95, 1e-3); close(K.cdf(0.5), 0.0360, 1e-3); close(K.quantile(0.99), 1.6276, 1e-3);
});

test('schrodinger1D, crankNicolson1D, wavelengthRGB', () => {
  // particle in a box of width π (ħ = m = 1): E_n = n²/2
  const S = M.schrodinger1D(() => 0, [0, Math.PI], { n: 600, k: 4 });
  S.E.forEach((E, i) => close(E, (i + 1) ** 2 / 2, 2e-4 * (i + 1) ** 2));
  const dx = S.x[1] - S.x[0]; close(S.psi[0].reduce((s, p) => s + p * p, 0) * dx, 1, 1e-6);
  // harmonic oscillator V = x²/2 on a wide box: E_n = n + 1/2
  const H = M.schrodinger1D((x) => x * x / 2, [-10, 10], { n: 800, k: 3 }); H.E.forEach((E, i) => close(E, i + 0.5, 1e-3));
  // Crank–Nicolson conserves the norm and keeps a stationary state stationary up to phase
  const N = 400, X = Float64Array.from({ length: N }, (_, i) => -10 + (i + 1) * 20 / (N + 1)), h = X[1] - X[0], V = X.map((x) => x * x / 2);
  const re = Float64Array.from(X, (x) => Math.exp(-x * x / 2) / Math.PI ** 0.25), im = new Float64Array(N);
  const n0 = re.reduce((s, r) => s + r * r, 0) * h; for (let k = 0; k < 200; k++) M.crankNicolson1D(re, im, V, h, 0.01);
  const n1 = re.reduce((s, r, i) => s + r * r + im[i] * im[i], 0) * h; close(n1, n0, 1e-9);
  close(Math.atan2(im[N / 2], re[N / 2]), -0.5 * 2, 2e-3); // phase −E t with E = ½, t = 2
  eq(M.wavelengthRGB(300), [0, 0, 0]); ok(M.wavelengthRGB(530)[1] === 255 && M.wavelengthRGB(530)[2] === 0, 'green'); ok(M.wavelengthRGB(650)[0] > 200, 'red');
});

console.log(`\n${passed} passed, ${failed} failed${failed ? ': ' + fails.join('; ') : ''}`);
process.exit(failed ? 1 : 0);
