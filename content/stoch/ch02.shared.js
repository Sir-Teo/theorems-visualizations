// Helpers shared by the parts of Chapter 2 (hitting times, absorption, random-walk paths).
export * from './ch01.shared.js';

/** Solve A x = b by Gaussian elimination with partial pivoting (null if singular). */
export function solveLin(A, b) {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-13) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i]; }
  return x;
}

/** States (boolean array) from which the target set (boolean array) can be reached. */
export function canReach(P, tgt) {
  const n = P.length, ok = tgt.slice();
  let ch = true;
  while (ch) { ch = false; for (let i = 0; i < n; i++) if (!ok[i]) for (let j = 0; j < n; j++) if (P[i][j] > 1e-12 && ok[j]) { ok[i] = true; ch = true; break; } }
  return ok;
}

/** Minimal nonnegative solution h_i = P_i(hit target): 1 on the target, 0 where it is unreachable, linear system elsewhere. */
export function hitProb(P, tgt) {
  const n = P.length, ok = canReach(P, tgt), idx = [];
  for (let i = 0; i < n; i++) if (ok[i] && !tgt[i]) idx.push(i);
  const h = P.map((_, i) => (tgt[i] ? 1 : 0));
  if (idx.length) {
    const A = idx.map((i, a) => idx.map((j, b) => (a === b ? 1 : 0) - P[i][j]));
    const rhs = idx.map((i) => P[i].reduce((s, p, j) => s + (tgt[j] ? p : 0), 0));
    const x = solveLin(A, rhs);
    if (x) idx.forEach((i, a) => { h[i] = Math.min(1, Math.max(0, x[a])); });
  }
  return h;
}

/** Mean hitting times k_i (Infinity unless the target is hit with probability one) given hitProb h. */
export function meanHit(P, tgt, h) {
  const n = P.length, idx = [];
  for (let i = 0; i < n; i++) if (!tgt[i] && h[i] > 1 - 1e-9) idx.push(i);
  const k = P.map((_, i) => (tgt[i] ? 0 : Infinity));
  if (idx.length) {
    const A = idx.map((i, a) => idx.map((j, b) => (a === b ? 1 : 0) - P[i][j]));
    const x = solveLin(A, idx.map(() => 1));
    if (x) idx.forEach((i, a) => { k[i] = x[a]; });
  }
  return k;
}

/** Simulate N walkers from every state until they hit the target (or cap steps): hit fraction and mean arrival time among those that arrived. */
export function simHits(P, tgt, R, N, cap, nextState, cumRows) {
  const C = cumRows(P), n = P.length, frac = new Array(n).fill(0), mean = new Array(n).fill(NaN);
  for (let s = 0; s < n; s++) {
    if (tgt[s]) { frac[s] = 1; mean[s] = 0; continue; }
    let hit = 0, tot = 0;
    for (let w = 0; w < N; w++) {
      let x = s, t = 0;
      while (t < cap) { x = nextState(C, x, R()); t++; if (tgt[x]) { hit++; tot += t; break; } }
    }
    frac[s] = hit / N; mean[s] = hit ? tot / hit : NaN;
  }
  return { frac, mean };
}

/** Binomial coefficient as a double (exact below 2^53). */
export const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
