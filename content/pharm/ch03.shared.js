// Pharmacology — Chapter 3: helpers shared by the items of ch03.js
// (mammillary compartment models solved through a symmetric eigenproblem, context-sensitive half-time, drug presets)
export * from './ch02.shared.js';

// ---------------------------------------------------------------- symmetric eigenproblem (Jacobi, small n)
/** Eigen-decomposition of a small symmetric matrix by cyclic Jacobi rotations. Returns {values, vectors} (vectors[j] = j-th unit eigenvector). */
export function jacobiSym(A0) {
  const n = A0.length, A = A0.map((r) => r.slice()), U = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const kp = A[k][p], kq = A[k][q]; A[k][p] = c * kp - s * kq; A[k][q] = s * kp + c * kq; }
      for (let k = 0; k < n; k++) { const pk = A[p][k], qk = A[q][k]; A[p][k] = c * pk - s * qk; A[q][k] = s * pk + c * qk; }
      for (let k = 0; k < n; k++) { const kp = U[k][p], kq = U[k][q]; U[k][p] = c * kp - s * kq; U[k][q] = s * kp + c * kq; }
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[a][a] - A[b][b]);
  return { values: idx.map((i) => A[i][i]), vectors: idx.map((i) => U.map((r) => r[i])) };
}

// ---------------------------------------------------------------- mammillary models
/**
 * Mammillary model: central compartment (volume V1, elimination clearance CL) exchanging with peripheral compartments
 * (V2, Q2), optionally (V3, Q3). Clearances in L/min, volumes in L, so rates are per minute.
 * Because the exchange is reversible, the clearance matrix is symmetric, and with x_i = sqrt(V_i)·C_i the system is
 * x' = M x with M = V^{-1/2} Qm V^{-1/2} symmetric: the real spectral theorem gives real rates and orthonormal modes.
 * Returns {n, V, lam (positive rates, ascending: slowest first), U (U[j] = unit eigenvector j of M), w (weights = U[j][0]^2, sum 1), ...}.
 */
export function mamm(P) {
  const V = [P.V1], Qx = [];
  if (P.V2 > 0 && P.Q2 > 0) { V.push(P.V2); Qx.push(P.Q2); }
  if (P.V3 > 0 && P.Q3 > 0) { V.push(P.V3); Qx.push(P.Q3); }
  const n = V.length, Qm = Array.from({ length: n }, () => new Array(n).fill(0));
  Qm[0][0] = -(P.CL + Qx.reduce((a, b) => a + b, 0));
  for (let i = 1; i < n; i++) { Qm[0][i] = Qm[i][0] = Qx[i - 1]; Qm[i][i] = -Qx[i - 1]; }
  const M = Qm.map((r, i) => r.map((q, j) => q / Math.sqrt(V[i] * V[j])));
  const e = jacobiSym(M);
  // eigenvalues are negative; the slowest decay is the largest (closest to 0)
  const lam = [], U = [];
  const ord = e.values.map((x, i) => [-x, i]).sort((a, b) => a[0] - b[0]);
  for (const [l, i] of ord) { lam.push(l); U.push(e.vectors[i]); }
  return { n, V, Q: Qx, CL: P.CL, lam, U, w: U.map((u) => u[0] * u[0]), V1: P.V1, Vss: V.reduce((a, b) => a + b, 0), M };
}
/** Central concentration after an IV bolus D: (D/V1) Σ w_j e^{−λ_j t}. */
export function cBolus(m, D, t) {
  if (t < 0) return 0;
  let s = 0; for (let j = 0; j < m.n; j++) s += m.w[j] * Math.exp(-m.lam[j] * t);
  return (D / m.V1) * s;
}
/** Concentration vector at time t from the initial concentration vector C0 (no input): C(t) = V^{-1/2} U e^{−Λt} Uᵀ V^{1/2} C0. */
export function cDecay(m, C0, t) {
  const n = m.n, x0 = C0.map((c, i) => Math.sqrt(m.V[i]) * c), out = new Array(n).fill(0);
  for (let j = 0; j < m.n; j++) {
    let a = 0; for (let i = 0; i < n; i++) a += m.U[j][i] * x0[i];
    const f = a * Math.exp(-m.lam[j] * t);
    for (let i = 0; i < n; i++) out[i] += m.U[j][i] * f;
  }
  return out.map((x, i) => x / Math.sqrt(m.V[i]));
}
/** AUC of a bolus (should equal D/CL): (D/V1) Σ w_j/λ_j. */
export const aucBolus = (m, D) => (D / m.V1) * m.lam.reduce((s, l, j) => s + m.w[j] / l, 0);
/** First t in (0, tMax] with f(t) ≤ target (f decreasing in practice): geometric scan then bisection; NaN if none. */
export function firstBelow(f, target, tMax) {
  let lo = 0, hi = NaN, t = tMax / 4096;
  for (; t <= tMax * 1.0001; t *= 1.25) { if (f(t) <= target) { hi = t; break; } lo = t; }
  if (!isFinite(hi)) return NaN;
  for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi); if (f(mid) <= target) hi = mid; else lo = mid; }
  return 0.5 * (lo + hi);
}
/** Context-sensitive half-time (min) after an infusion of duration T (min) that has held the central concentration constant. */
export function cshtHold(m, T, tMax = 3000) {
  const C0 = [1]; for (let i = 1; i < m.n; i++) C0.push(1 - Math.exp(-(m.Q[i - 1] * T) / m.V[i]));
  return firstBelow((t) => cDecay(m, C0, t)[0], 0.5, tMax);
}
/** Same, for an infusion at constant rate (any rate: the halving is relative to the concentration at the stop). */
export function cshtRate(m, T, tMax = 3000) {
  const c = (t) => { let s = 0; for (let j = 0; j < m.n; j++) s += (m.w[j] / m.lam[j]) * (Math.exp(-m.lam[j] * t) - Math.exp(-m.lam[j] * (t + T))); return s; };
  return firstBelow(c, c(0) / 2, tMax);
}
/** Central concentration during/after an infusion that holds C = 1 for T then stops (t from the start). */
export function cHoldTrace(m, T, t) {
  if (t <= T) return 1;
  const C0 = [1]; for (let i = 1; i < m.n; i++) C0.push(1 - Math.exp(-(m.Q[i - 1] * T) / m.V[i]));
  return cDecay(m, C0, t - T)[0];
}
/** Terminal half-life (min) of a mammillary model. */
export const tTerminal = (m) => Math.LN2 / m.lam[0];

// ---------------------------------------------------------------- illustrative parameter sets (rounded, NOT published fits)
/**
 * Rounded, illustrative three-compartment sets in the spirit of published anaesthetic-drug models: the volumes and
 * clearances were chosen only to give realistic orders of magnitude (fentanyl V1 = 13 L and Vss = 360 L are round values
 * quoted in teaching notes; propofol is built from rounded rate constants by fromRates). They are not the parameter sets of any paper.
 */
export const ANAES = {
  fentanyl:   { name: 'fentanyl',   label: 'fentanyl',   V1: 13,  V2: 50, V3: 300, CL: 0.6,  Q2: 2.5, Q3: 0.7, color: 'accent' },
  alfentanil: { name: 'alfentanil', label: 'alfentanil', V1: 6,   V2: 8,  V3: 14,  CL: 0.3,  Q2: 1.2, Q3: 0.4, color: 'orange' },
  sufentanil: { name: 'sufentanil', label: 'sufentanil', V1: 14,  V2: 60, V3: 270, CL: 0.8,  Q2: 1.6, Q3: 0.6, color: 'purple' },
  propofol:   { name: 'propofol',   label: 'propofol',   ...fromRates(16, 0.119, 0.112, 0.055, 0.0419, 0.0033), color: 'green' },
  midazolam:  { name: 'midazolam',  label: 'midazolam',  V1: 12,  V2: 25, V3: 40,  CL: 0.4,  Q2: 1.0, Q3: 0.35, color: 'teal' },
  thiopental: { name: 'thiopental', label: 'thiopental', V1: 6,   V2: 22, V3: 130, CL: 0.2,  Q2: 1.0, Q3: 0.3, color: 'red' },
};
/** Volumes and clearances from rate constants (per min): V1, k10, k12, k21, k13, k31. */
export function fromRates(V1, k10, k12, k21, k13, k31) {
  const P = { V1, CL: k10 * V1, Q2: k12 * V1, V2: (k12 * V1) / k21 };
  if (k13) { P.Q3 = k13 * V1; P.V3 = (k13 * V1) / k31; }
  return P;
}
