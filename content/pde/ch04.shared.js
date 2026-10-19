// Partial Differential Equations — Chapter 4 shared helpers (separation of variables and Fourier series). Plain named
// exports, imported by ch04.js, ch04-b.js and ch04-c.js. Re-exports the chapter-3 helpers (makeHeat, sineCoeffs, spline, ...).
export * from './ch03.shared.js';

/** Solutions of X'' = -lam X with X(0) = 0, X'(0) = 1 (S) and X(0) = 1, X'(0) = 0 (C), valid for lam of either sign. */
export function CS(lam, x) {
  if (Math.abs(lam) < 1e-5) { const z = lam * x * x; return [1 - z / 2 + z * z / 24 - z * z * z / 720, x * (1 - z / 6 + z * z / 120 - z * z * z / 5040)]; }
  if (lam > 0) { const m = Math.sqrt(lam); return [Math.cos(m * x), Math.sin(m * x) / m]; }
  if (lam < 0) { const k = Math.sqrt(-lam); return [Math.cosh(k * x), Math.sinh(k * x) / k]; }
  return [1, x];
}

/**
 * Eigenpairs of -X'' = lam X on [0, 1] with a Dirichlet ('D', X = 0), Neumann ('N', X' = 0) or Robin ('R') condition at each end:
 * left  X'(0) = h0 X(0),  right  X'(1) + h1 X(1) = 0  (h > 0 is heat loss; h < 0 heat gain, which can create lam <= 0).
 * Returns the lowest K modes [{lam, X(x), dX(x), kind}] sorted by lam, each normalised to unit L2 norm. Roots are found by
 * scanning the boundary residual in mu = sqrt(lam) (and kappa = sqrt(-lam) for negative lam) on a fine grid and bisecting.
 */
export function eigModes(left, right, h0 = 0, h1 = 0, K = 8) {
  const ab = { D: [0, 1], N: [1, 0], R: [1, h0] }[left];
  const XX = (lam) => (x) => { const [C, S] = CS(lam, x); return ab[0] * C + ab[1] * S; };
  const dXX = (lam) => (x) => { const [C, S] = CS(lam, x); return -lam * ab[0] * S + ab[1] * C; };
  const g = (lam) => {
    const X = XX(lam)(1), dX = dXX(lam)(1);
    return right === 'D' ? X : right === 'N' ? dX : dX + h1 * X;
  };
  const lams = [];
  const bis = (f, a, b) => { let fa = f(a); for (let i = 0; i < 100; i++) { const m = 0.5 * (a + b), fm = f(m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return 0.5 * (a + b); };
  const zero = Math.abs(g(0)) < 2e-14 * Math.max(1, Math.abs(h0), Math.abs(h1), Math.abs(h0 * h1));
  if (zero) lams.push(0);
  // negative eigenvalue(s)
  const gk = (k) => g(-k * k);
  const start = zero ? 1e-5 : 0;
  let prev = gk(start);
  for (let k = start + 0.01; k < 30; k += 0.01) {
    const cur = gk(k);
    if (prev === 0 || (prev < 0) !== (cur < 0)) { const r = bis(gk, k - 0.01, k); if (r > 0) lams.push(-r * r); }
    prev = cur;
  }
  const gm = (m) => g(m * m);
  const mMax = (K + 3) * Math.PI, dm = 0.004;
  prev = gm(start);
  for (let m = start + dm; m < mMax; m += dm) {
    const cur = gm(m);
    if ((prev < 0) !== (cur < 0)) { const r = bis(gm, m - dm, m); if (r > 0) lams.push(r * r); }
    prev = cur;
  }
  lams.sort((p, q) => p - q);
  const out = [];
  for (const lam of lams.slice(0, K)) {
    const X0 = XX(lam), dX0 = dXX(lam);
    let s = 0; const n = 400; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n; s += X0(x) ** 2; } const nrm = Math.sqrt(s / n);
    out.push({ lam, X: (x) => X0(x) / nrm, dX: (x) => dX0(x) / nrm, kind: lam > 1e-9 ? 'osc' : lam < -1e-9 ? 'growing' : 'zero' });
  }
  return out;
}

/** Real Fourier coefficients on [-pi, pi]: f ~ a0/2 + sum a_n cos nx + b_n sin nx, n = 1..N (midpoint rule with nq cells). */
export function trigCoef(f, N, nq = 4096) {
  const a = new Float64Array(N + 1), b = new Float64Array(N + 1), h = (2 * Math.PI) / nq, fv = new Float64Array(nq);
  for (let j = 0; j < nq; j++) fv[j] = f(-Math.PI + (j + 0.5) * h);
  for (let n = 0; n <= N; n++) {
    let sc = 0, ss = 0;
    for (let j = 0; j < nq; j++) { const x = -Math.PI + (j + 0.5) * h; sc += fv[j] * Math.cos(n * x); ss += fv[j] * Math.sin(n * x); }
    a[n] = (sc * h) / Math.PI; b[n] = (ss * h) / Math.PI;
  }
  return { a, b };
}

/** Partial sum S_N(x) of a trigonometric series from trigCoef. */
export function trigSum(c, N, x) {
  let s = c.a[0] / 2;
  for (let n = 1; n <= N; n++) s += c.a[n] * Math.cos(n * x) + c.b[n] * Math.sin(n * x);
  return s;
}

/** The 2pi-periodic Bernoulli function B_k(x/2pi) (k = 1..4), the k-fold integral of a sawtooth: jump (k = 1), kink (2), C^1 (3), C^2 (4). */
export function bernoulliPeriodic(k) {
  return (x) => {
    const t = (((x / (2 * Math.PI)) % 1) + 1) % 1;
    if (k === 1) return t - 0.5;
    if (k === 2) return t * t - t + 1 / 6;
    if (k === 3) return t * t * t - 1.5 * t * t + 0.5 * t;
    return t ** 4 - 2 * t ** 3 + t * t - 1 / 30;
  };
}
