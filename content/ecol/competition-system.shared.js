import { solveDense } from './ch04.shared.js';
export const overlap = (kind, distance) => {
  const d = Math.abs(distance);
  return kind === 'g' ? Math.exp(-d * d / 4) : kind === 'l' ? (1 + d) * Math.exp(-d) : Math.max(0, 1 - d / 2);
};
/** Prepare a finite overlap matrix once for many carrying-capacity draws.
 * Very ill-conditioned systems are unresolved, rather than classified as extinction.
 * The reciprocal-condition cutoff is an explicit floating-point display policy.
 */
export function competitionSystem(kind, n, spacing) {
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => overlap(kind, (i - j) * spacing)));
  const columns = Array.from({ length: n }, (_, j) => solveDense(M, Array.from({ length: n }, (_, i) => +(i === j))));
  const norm = Math.max(...M.map(row => row.reduce((s, x) => s + Math.abs(x), 0)));
  const inverseNorm = columns.some(c => !c) ? Infinity : Math.max(...Array.from({ length: n }, (_, i) => columns.reduce((s, col) => s + Math.abs(col[i]), 0)));
  const rcond = 1 / (norm * inverseNorm);
  return { M, rcond, solve(K) {
    if (!(rcond >= 1e-10)) return { status: 'unresolved', x: null };
    const x = Array.from({ length: n }, (_, i) => columns.reduce((s, col, j) => s + col[i] * K[j], 0));
    const residual = Math.max(...M.map((row, i) => Math.abs(row.reduce((s, a, j) => s + a * x[j], 0) - K[i])));
    if (!x.every(Number.isFinite) || residual > 1e-8 * Math.max(1, ...K.map(Math.abs))) return { status: 'unresolved', x: null };
    return { status: x.every(v => v > 0) ? 'feasible' : 'infeasible', x };
  } };
}
