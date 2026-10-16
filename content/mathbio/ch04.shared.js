// Mathematical Biology — Chapter 4 shared helpers (plain functions only). Re-exports the chapter-3 helpers.
export * from './ch03.shared.js';

/* Convention used throughout the chapter: age classes x = 1..n, l[x-1] = survivorship to class x (l_1 = 1),
   m[x-1] = fecundity F_x of class x. Leslie matrix: top row F_x, subdiagonal s_x = l_{x+1}/l_x. */

/** Survival-pattern presets: the n-1 class-to-class survival probabilities. */
export const SURV = {
  I: [0.97, 0.96, 0.94, 0.9, 0.82, 0.62, 0.35],
  II: [0.72, 0.72, 0.72, 0.72, 0.72, 0.72, 0.72],
  III: [0.25, 0.55, 0.78, 0.85, 0.85, 0.85, 0.85],
};
/** Fecundity schedule for 8 classes (offspring per individual per step). */
export const FEC = [0, 0, 0.5, 1, 1.2, 1, 0.7, 0.35];

/** Survivorship l_x from class survival probabilities s (length n-1). */
export function survivorship(s) { const l = [1]; for (const p of s) l.push(l[l.length - 1] * p); return l; }

/** Leslie matrix from fecundities F (length n) and survivals s (length n-1). */
export function leslie(F, s) {
  const n = F.length, A = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) A[0][j] = F[j];
  for (let j = 0; j < n - 1; j++) A[j + 1][j] = s[j];
  return A;
}

export const matVec = (A, x) => A.map((row) => row.reduce((a, aij, j) => a + aij * x[j], 0));
export const transposeM = (A) => A[0].map((_, j) => A.map((r) => r[j]));
export const sumv = (x) => x.reduce((a, b) => a + b, 0);
export const dotv = (a, b) => a.reduce((s, ai, i) => s + ai * b[i], 0);

/** Dominant eigenpair of an irreducible nonnegative matrix by power iteration on A + I (so imprimitive matrices converge too).
    Returns {lam, u (right, sum 1), w (left, normalised w[0] = 1)}. */
export function domEig(A, iters = 4000) {
  const n = A.length;
  const run = (B) => {
    let x = new Array(n).fill(1 / n), lam = 1;
    for (let k = 0; k < iters; k++) {
      const y = matVec(B, x).map((yi, i) => yi + x[i]);
      const s = sumv(y); if (!(s > 0)) return { lam: 0, x };
      lam = s / sumv(x); x = y.map((yi) => yi / s);
    }
    return { lam: lam - 1, x };
  };
  const R = run(A), L = run(transposeM(A));
  const u = R.x, w = L.x.map((q) => q / (L.x[0] || 1));
  return { lam: R.lam, u, w };
}

/** Euler–Lotka sum Σ λ^{-x} l_x m_x  (x = 1..n). */
export function elSum(l, m, lam) { let s = 0; for (let i = 0; i < l.length; i++) s += l[i] * m[i] * Math.pow(lam, -(i + 1)); return s; }
/** Root λ* of the Euler–Lotka equation (null if R0 = 0). The sum decreases strictly in λ, so bisection is safe. */
export function elRoot(l, m) {
  const R0 = sumv(l.map((li, i) => li * m[i]));
  if (!(R0 > 0)) return null;
  let lo = 1e-6, hi = Math.max(2, R0 * 2 + 1);
  for (let k = 0; k < 200; k++) { const mid = 0.5 * (lo + hi); if (elSum(l, m, mid) > 1) lo = mid; else hi = mid; }
  return 0.5 * (lo + hi);
}
/** R0 = Σ l_x m_x and generation time T = Σ x l_x m_x / R0 (x = 1..n). */
export function r0T(l, m) {
  let R0 = 0, S = 0;
  for (let i = 0; i < l.length; i++) { R0 += l[i] * m[i]; S += (i + 1) * l[i] * m[i]; }
  return { R0, T: R0 > 0 ? S / R0 : NaN };
}
/** Project n_{t+1} = A n_t; returns the array of states (steps+1 of them). */
export function project(A, n0, steps) { const out = [n0.slice()]; let x = n0.slice(); for (let t = 0; t < steps; t++) { x = matVec(A, x); out.push(x); } return out; }

/** Fisher's reproductive value v_x (v_1 = 1) in closed form: λ^{x-1}/l_x · Σ_{y≥x} λ^{-y} l_y m_y. */
export function fisherV(l, m, lam) {
  const n = l.length, v = new Array(n).fill(0); let tail = 0;
  for (let i = n - 1; i >= 0; i--) { tail += l[i] * m[i] * Math.pow(lam, -(i + 1)); v[i] = Math.pow(lam, i) / l[i] * tail; }
  return v;
}

/** Zero-pattern analysis of a nonnegative square matrix: irreducible? and period (0 if reducible). */
export function nnClass(A, tol = 1e-12) {
  const n = A.length, edge = (i, j) => A[j][i] > tol; // i -> j when mass flows from class i to class j
  const reach = (s, rev) => {
    const seen = new Array(n).fill(false), lvl = new Array(n).fill(-1); seen[s] = true; lvl[s] = 0; const q = [s];
    while (q.length) { const a = q.shift(); for (let b = 0; b < n; b++) if (!seen[b] && (rev ? edge(b, a) : edge(a, b))) { seen[b] = true; lvl[b] = lvl[a] + 1; q.push(b); } }
    return { seen, lvl };
  };
  const f = reach(0, false), r = reach(0, true);
  if (!(f.seen.every(Boolean) && r.seen.every(Boolean))) return { irreducible: false, period: 0 };
  let g = 0; const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (edge(i, j)) g = gcd(g, f.lvl[i] + 1 - f.lvl[j]);
  return { irreducible: true, period: g };
}

/** The seven-stage loggerhead (Caretta caretta) matrix as tabulated in Crouse, Crowder & Caswell 1987 (values copied from a secondary
    transcription; see the item). Stages: hatchlings, small juveniles, large juveniles, subadults, novice breeders, 1st-year remigrants, mature breeders. */
export const TURTLE_STAGES = ['hatchling', 'small juv.', 'large juv.', 'subadult', 'novice br.', '1st-yr rem.', 'mature br.'];
export function turtleMatrix(survScale = [1, 1, 1, 1, 1, 1, 1], fecScale = 1) {
  const A = Array.from({ length: 7 }, () => new Array(7).fill(0));
  const P = [0, 0.737, 0.661, 0.6907, 0, 0, 0.8089]; // stasis
  const G = [0.6747, 0.0486, 0.0147, 0.0518, 0.8091, 0.8091, 0]; // growth to the next stage
  for (let j = 0; j < 7; j++) {
    let k = survScale[j]; const tot = P[j] + G[j]; if (tot * k > 1) k = 1 / tot;
    A[j][j] = P[j] * k; if (j < 6) A[j + 1][j] = G[j] * k;
  }
  A[0][4] = 127 * fecScale; A[0][5] = 4 * fecScale; A[0][6] = 80 * fecScale;
  return A;
}
