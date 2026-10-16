// Quantum Information & Computation — Chapter 3: helpers shared by ch03.js (and any parts).
// Real density matrices of up to four qubits are plain arrays of rows of numbers (qubit 0 = most significant bit);
// every state used in this chapter (Bell states, Werner states, their mixtures and dephasings) is real.
export * from './ch02.shared.js';

// ------------------------------------------------------------------ real matrices and two-qubit states
export const rzeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));
export const rmul = (A, B) => { const n = A.length, R = rzeros(n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i][k]; if (a) for (let j = 0; j < n; j++) R[i][j] += a * B[k][j]; } return R; };
export const rkron = (A, B) => { const n = A.length, m = B.length, R = rzeros(n * m); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < m; k++) for (let l = 0; l < m; l++) R[i * m + k][j * m + l] = A[i][j] * B[k][l]; return R; };
export const rtrace = (A) => A.reduce((s, r, i) => s + r[i], 0);
export const rscale = (A, c) => A.map((r) => r.map((x) => x * c));
export const radd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
export const rid = (n) => A_id(n);
const A_id = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
export const router = (u) => u.map((a) => u.map((b) => a * b));
/** The Bell vectors Φ+, Ψ+, Φ−, Ψ− as real 4-vectors (same order as BELL). */
export const BELLR = [[1, 0, 0, 1], [0, 1, 1, 0], [1, 0, 0, -1], [0, 1, -1, 0]].map((a) => a.map((x) => x * Math.SQRT1_2));
/** Werner state w|Φ+⟩⟨Φ+| + (1−w) I/4 (w = visibility); its fidelity with Φ+ is (1+3w)/4. */
export const wernerR = (w) => radd(rscale(router(BELLR[0]), w), rscale(rid(4), (1 - w) / 4));
export const fidOfW = (w) => (1 + 3 * w) / 4;
export const wOfFid = (F) => (4 * F - 1) / 3;
/** ⟨β_k|ρ|β_k⟩ for a two-qubit real ρ. */
export const bellFidR = (rho, k) => { const b = BELLR[k]; let s = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += b[i] * rho[i][j] * b[j]; return s; };
/** Correlation matrix T_ij = tr(ρ σ_i⊗σ_j) of a REAL two-qubit state (entries with exactly one σ_y vanish by symmetry). */
export function corrT(rho) {
  const X = [[0, 1], [1, 0]], Z = [[1, 0], [0, -1]], Yr = [[0, 0, 0, -1], [0, 0, 1, 0], [0, 1, 0, 0], [-1, 0, 0, 0]];
  const tr2 = (M) => { let s = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += rho[i][j] * M[j][i]; return s; };
  const P = { x: X, z: Z }, T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const [a, ia] of [['x', 0], ['z', 2]]) for (const [b, ib] of [['x', 0], ['z', 2]]) T[ia][ib] = tr2(rkron(P[a], P[b]));
  T[1][1] = tr2(Yr);
  return T;
}
/** Horodecki: the largest CHSH value over all settings is 2·sqrt(sum of the two largest eigenvalues of TᵀT). */
export function chshMax(v, rho) {
  const T = corrT(rho), TT = [0, 1, 2].map((i) => [0, 1, 2].map((j) => T[0][i] * T[0][j] + T[1][i] * T[1][j] + T[2][i] * T[2][j]));
  const ev = v.M.eigSym(TT).values.slice().sort((a, b) => b - a);
  return 2 * Math.sqrt(Math.max(0, ev[0] + ev[1]));
}
/** Dephase qubit q (0 or 1) of a two-qubit state in the Z or X basis: ½(ρ + Pρ P). */
export function dephaseR(rho, q, basis) {
  const P = basis === 'Z' ? [[1, 0], [0, -1]] : [[0, 1], [1, 0]], U = q === 0 ? rkron(P, rid(2)) : rkron(rid(2), P);
  return rscale(radd(rho, rmul(U, rmul(rho, U))), 0.5);
}
/** Joint outcome probabilities P(s,t) for measuring cos a Z + sin a X on qubit 0 and cos b Z + sin b X on qubit 1 of a real ρ. */
export function jointProbs(rho, a, b) {
  const e = (t, s) => (s === 0 ? [Math.cos(t / 2), Math.sin(t / 2)] : [-Math.sin(t / 2), Math.cos(t / 2)]);
  const out = [];
  for (let s = 0; s < 2; s++) for (let t = 0; t < 2; t++) {
    const ea = e(a, s), eb = e(b, t), u = [ea[0] * eb[0], ea[0] * eb[1], ea[1] * eb[0], ea[1] * eb[1]]; let p = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) p += u[i] * rho[i][j] * u[j];
    out.push(Math.max(0, p));
  }
  return out; // order: (+,+), (+,−), (−,+), (−,−)
}

// ------------------------------------------------------------------ entanglement swapping (A B C D with a Bell measurement on B, C)
/** State of A and D after the Bell measurement on (B, C) gives outcome k, for pairs (A,B) and (C,D) in Werner states w1, w2. Returns {p, rho}. */
export function swapOutcome(w1, w2, k) {
  const R = rkron(wernerR(w1), wernerR(w2)), b = BELLR[k], out = rzeros(4); let p = 0;
  // index = a·8 + b·4 + c·2 + d
  for (let a = 0; a < 2; a++) for (let d = 0; d < 2; d++) for (let a2 = 0; a2 < 2; a2++) for (let d2 = 0; d2 < 2; d2++) {
    let s = 0;
    for (let bc = 0; bc < 4; bc++) for (let bc2 = 0; bc2 < 4; bc2++) {
      const w = b[bc] * b[bc2]; if (!w) continue;
      s += w * R[a * 8 + bc * 2 + d][a2 * 8 + bc2 * 2 + d2];
    }
    out[2 * a + d][2 * a2 + d2] = s;
  }
  p = rtrace(out);
  return { p, rho: rscale(out, 1 / (p || 1)) };
}

// ------------------------------------------------------------------ one round of the BBPSSW purification protocol
/** Two Werner pairs with fidelity F (qubits A1 B1 A2 B2 = pair 1 then pair 2), bilateral CNOT (A1→A2, B1→B2), then measure A2 and B2 in Z and keep equal results.
 *  Returns {p: success probability, F: fidelity of the kept pair with Φ+ BEFORE re-twirling}, computed on the 16×16 density matrix. */
export function bilateralRound(F) {
  const w = wOfFid(F), R = rkron(wernerR(w), wernerR(w)), N = 16;
  // basis index bits: A1 B1 A2 B2 (A1 most significant)
  const perm = (i) => { const a1 = (i >> 3) & 1, b1 = (i >> 2) & 1, a2 = (i >> 1) & 1, b2 = i & 1; return (a1 << 3) | (b1 << 2) | ((a2 ^ a1) << 1) | (b2 ^ b1); };
  const Rp = rzeros(N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) Rp[perm(i)][perm(j)] = R[i][j];
  const out = rzeros(4);
  for (const m of [0, 3]) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out[i][j] += Rp[(i << 2) | m][(j << 2) | m];
  const p = rtrace(out); return { p, F: bellFidR(rscale(out, 1 / p), 0), rho: rscale(out, 1 / p) };
}
/** The closed form of the same map for Werner input (Bennett et al. 1996): F' and success probability. */
export function bbpsswFormula(F) {
  const g = (1 - F) / 3, den = F * F + 2 * F * g + 5 * g * g;
  return { p: den, F: (F * F + g * g) / den };
}
