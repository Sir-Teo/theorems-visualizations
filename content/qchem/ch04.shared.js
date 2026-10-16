// Quantum Chemistry — Chapter 4: helpers shared by ch04.js and ch04-b.js (re-exports the chapter-3 helpers, and through them chapter 2's).
// Conventions: atomic units (hartree, bohr) for atoms; ħ = m = 1 for the box and oscillator models unless an item says otherwise.
export * from './ch03.shared.js';
export { grid, interp, numerov, countNodes, hermiteFns, boxPsi, big, fz, sub, FAMILY } from './ch01.shared.js';

export const A0_ANG = 0.529177210903;     // Å per bohr (CODATA 2018)
export const KB_MEV = 0.08617333262;      // meV per kelvin (CODATA 2018)

/** Dipole matrix element ⟨m|x|n⟩ for the box eigenfunctions √2 sin(nπx) on [0,1]. */
export function boxX(m, n) {
  if (m === n) return 0.5;
  if ((m + n) % 2 === 0) return 0;
  return (-8 * m * n) / (Math.PI ** 2 * (m * m - n * n) ** 2);
}
/** Midpoint-rule matrix ⟨m|f|n⟩ of a function f on [0,1] between box eigenfunctions, m,n = 1..N. */
export function boxMatrix(f, N, nq = 1200) {
  const A = Array.from({ length: N }, () => new Float64Array(N)), s = Array.from({ length: N + 1 }, () => new Float64Array(nq));
  const fx = new Float64Array(nq);
  for (let q = 0; q < nq; q++) { const x = (q + 0.5) / nq; fx[q] = f(x); for (let n = 1; n <= N; n++) s[n][q] = Math.SQRT2 * Math.sin(n * Math.PI * x); }
  for (let m = 1; m <= N; m++) for (let n = m; n <= N; n++) { let t = 0; for (let q = 0; q < nq; q++) t += s[m][q] * fx[q] * s[n][q]; A[m - 1][n - 1] = A[n - 1][m - 1] = t / nq; }
  return A.map((r) => Array.from(r));
}
/** Golden-section minimum of a unimodal f on [a, b]. */
export function goldenMin(f, a, b, tol = 1e-9) {
  const g = (Math.sqrt(5) - 1) / 2; let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
  while (b - a > tol * Math.max(1, Math.abs(a) + Math.abs(b))) { if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); } }
  return (a + b) / 2;
}
