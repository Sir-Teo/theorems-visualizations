// Quantum Information & Computation — Chapter 2: helpers shared by ch02.js (and any parts).
// Complex numbers are pairs [re, im]; an n-qubit state is an array of 2^n pairs (qubit 0 = most significant bit);
// a density matrix is an array of rows of pairs.
export * from './ch01.shared.js';
import { cmul, cadd, cconj, cabs2, cscale, TAU } from './ch01.shared.js';

// ------------------------------------------------------------------ states and matrices on several qubits
export const zeroState = (N) => Array.from({ length: N }, (_, i) => [i === 0 ? 1 : 0, 0]);
export const normalize = (psi) => { const n = Math.sqrt(psi.reduce((s, z) => s + cabs2(z), 0)) || 1; return psi.map((z) => [z[0] / n, z[1] / n]); };
/** Tensor product of two state vectors. */
export const kronV = (a, b) => a.flatMap((x) => b.map((y) => cmul(x, y)));
/** |ψ⟩⟨ψ| for a state vector. */
export const outerV = (psi) => psi.map((a) => psi.map((b) => cmul(a, cconj(b))));
/** Apply a 2×2 matrix U to qubit q of an n-qubit state. */
export function applyOne(psi, U, q, n) {
  const m = 1 << (n - 1 - q), out = psi.map((z) => z.slice());
  for (let i = 0; i < psi.length; i++) {
    if (i & m) continue; const j = i | m, a = psi[i], b = psi[j];
    out[i] = cadd(cmul(U[0][0], a), cmul(U[0][1], b)); out[j] = cadd(cmul(U[1][0], a), cmul(U[1][1], b));
  }
  return out;
}
/** CNOT with control c and target t. */
export function applyCX(psi, c, t, n) {
  const mc = 1 << (n - 1 - c), mt = 1 << (n - 1 - t), out = psi.map((z) => z.slice());
  for (let i = 0; i < psi.length; i++) if ((i & mc) && !(i & mt)) { const j = i | mt; out[i] = psi[j]; out[j] = psi[i]; }
  return out;
}
/** Reduced density matrix of the qubits in `keep` (ascending indices) of an n-qubit density matrix. */
export function ptrace(rho, n, keep) {
  const drop = [...Array(n).keys()].filter((q) => !keep.includes(q)), dk = 1 << keep.length, dd = 1 << drop.length;
  const idx = (kv, dv) => { let i = 0; keep.forEach((q, a) => { if ((kv >> (keep.length - 1 - a)) & 1) i |= 1 << (n - 1 - q); }); drop.forEach((q, a) => { if ((dv >> (drop.length - 1 - a)) & 1) i |= 1 << (n - 1 - q); }); return i; };
  const R = Array.from({ length: dk }, () => Array.from({ length: dk }, () => [0, 0]));
  for (let a = 0; a < dk; a++) for (let b = 0; b < dk; b++) for (let d = 0; d < dd; d++) { const z = rho[idx(a, d)][idx(b, d)]; R[a][b][0] += z[0]; R[a][b][1] += z[1]; }
  return R;
}
/** Partial transpose on the second qubit of a two-qubit density matrix. */
export function ptransposeB(rho) {
  const R = rho.map((r) => r.map((z) => z.slice()));
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) for (let d = 0; d < 2; d++) R[2 * a + c][2 * b + d] = rho[2 * a + d][2 * b + c].slice();
  return R;
}
/** Bloch vector of a 2×2 density matrix. */
export const blochRho = (r) => [2 * r[0][1][0], -2 * r[0][1][1], r[0][0][0] - r[1][1][0]];
export const rhoReal = (A) => A.map((r) => r.map((x) => [x, 0]));
/** Real symmetric/complex Hermitian eigenvalues (ascending). */
export const eigvals = (v, A) => v.M.eigH(A).values;
/** Wootters concurrence of a two-qubit density matrix. */
export function concurrence(v, rho) {
  const YY = [[0, 0, 0, -1], [0, 0, 1, 0], [0, 1, 0, 0], [-1, 0, 0, 0]];
  const conj = rho.map((r) => r.map(cconj));
  const rt = rho.map((_, i) => rho.map((__, j) => { let s = [0, 0]; for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) { const y1 = YY[i][k], y2 = YY[l][j]; if (y1 && y2) s = cadd(s, cscale(conj[k][l], y1 * y2)); } return s; }));
  // λ_i² are the eigenvalues of the Hermitian matrix √ρ ρ̃ √ρ (stable even when ρ has repeated zero eigenvalues)
  const E = v.M.eigH(rho), sq = rho.map((_, i) => rho.map((__, j) => { let z = [0, 0]; for (let k = 0; k < 4; k++) { const w = Math.sqrt(Math.max(0, E.values[k])), a = E.vectors[k]; z = cadd(z, cscale(cmul([a.re[i], a.im[i]], cconj([a.re[j], a.im[j]])), w)); } return z; }));
  const mm = (A, B) => A.map((r, i) => r.map((_, j) => { let z = [0, 0]; for (let k = 0; k < 4; k++) z = cadd(z, cmul(A[i][k], B[k][j])); return z; }));
  const Hm = mm(sq, mm(rt, sq)), lam = v.M.eigH(Hm).values.map((x) => Math.sqrt(Math.max(0, x))).sort((a, b) => b - a);
  return Math.max(0, lam[0] - lam[1] - lam[2] - lam[3]);
}
/** Haar-random pure state of N levels from a seeded generator. */
export const haarState = (r, N) => normalize(Array.from({ length: N }, () => [r.normal(), r.normal()]));
/** Shannon entropy in bits of a probability list. */
export const H2 = (p) => p.reduce((s, x) => (x > 1e-12 ? s - x * Math.log2(x) : s), 0);
/** Entropy of entanglement (bits) of qubit A in a pure two-qubit state. */
export function entEntropy(psi) {
  const rA = ptrace(outerV(psi), 2, [0]), t = (rA[0][0][0] + rA[1][1][0]) / 2, d = Math.hypot(rA[0][0][0] - t, rA[0][1][0], rA[0][1][1]);
  return H2([t + d, t - d]);
}
export const BELL = [
  { name: 'Φ⁺', tex: '\\Phi^+', idx: '00', amps: [1, 0, 0, 1] }, { name: 'Ψ⁺', tex: '\\Psi^+', idx: '01', amps: [0, 1, 1, 0] },
  { name: 'Φ⁻', tex: '\\Phi^-', idx: '10', amps: [1, 0, 0, -1] }, { name: 'Ψ⁻', tex: '\\Psi^-', idx: '11', amps: [0, 1, -1, 0] },
];
export const bellVec = (k) => normalize(BELL[k].amps.map((x) => [x, 0]));
export { TAU };
