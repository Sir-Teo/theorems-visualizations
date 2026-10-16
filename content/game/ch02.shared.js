// Game Theory & Social Choice — Chapter 2: shared helpers (mixed strategies, equilibria of bimatrix games)
// Conventions: player 1 (row, blue) has m actions, player 2 (column, orange) has n; A[i][j] = u1, B[i][j] = u2.
// p = P(row player plays row 0), q = P(column player plays column 0) in the 2 x 2 pictures.

export const C1 = 'blue', C2 = 'orange', EPS = 1e-9;
export const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
export const nm = (x, d = 2) => { const r = Math.round(x * 10 ** d) / 10 ** d; return String(r === 0 ? 0 : r).replace('-', '−'); };
export const idx = (n) => Array.from({ length: n }, (_, k) => k);

/** Split a payoff table U[i][j] = [u1, u2] into the two matrices. */
export const splitU = (U) => ({ A: U.map((r) => r.map((c) => c[0])), B: U.map((r) => r.map((c) => c[1])) });
export const joinU = (A, B) => A.map((r, i) => r.map((a, j) => [a, B[i][j]]));

/** Expected payoffs of the mixed profile (x, y). */
export function expU(A, B, x, y) {
  let u1 = 0, u2 = 0;
  for (let i = 0; i < x.length; i++) for (let j = 0; j < y.length; j++) { const w = x[i] * y[j]; u1 += w * A[i][j]; u2 += w * B[i][j]; }
  return [u1, u2];
}
/** Payoff of each pure row against y, and of each pure column against x. */
export const rowPay = (A, y) => A.map((r) => r.reduce((s, a, j) => s + a * y[j], 0));
export const colPay = (B, x) => B[0].map((_, j) => x.reduce((s, xi, i) => s + xi * B[i][j], 0));
/** Largest gain either player could get by a unilateral deviation (0 at an equilibrium). */
export function regret(A, B, x, y) {
  const [u1, u2] = expU(A, B, x, y);
  return Math.max(Math.max(...rowPay(A, y)) - u1, Math.max(...colPay(B, x)) - u2, 0);
}

/** Solve a small dense linear system by Gaussian elimination with partial pivoting (null if singular). */
export function solveLin(M, b) {
  const n = b.length, a = M.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (Math.abs(a[p][c]) < 1e-11) return null;
    [a[c], a[p]] = [a[p], a[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = a[r][c] / a[c][c]; if (f) for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k]; }
  }
  return a.map((r, i) => r[n] / r[i]);
}
function subsets(n, k) {
  const out = [], cur = [];
  (function rec(s) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); } })(0);
  return out;
}
/** All equilibria of a nondegenerate bimatrix game by support enumeration (equal-size supports). */
export function supportEnum(A, B) {
  const m = A.length, n = A[0].length, out = [], tol = 1e-9;
  for (let k = 1; k <= Math.min(m, n); k++) for (const I of subsets(m, k)) for (const J of subsets(n, k)) {
    // y on J makes the rows in I indifferent: sum_j A[i][j] y_j - v1 = 0, sum y = 1
    const M1 = I.map((i) => [...J.map((j) => A[i][j]), -1]); M1.push([...J.map(() => 1), 0]);
    const s1 = solveLin(M1, [...I.map(() => 0), 1]); if (!s1) continue;
    const M2 = J.map((j) => [...I.map((i) => B[i][j]), -1]); M2.push([...I.map(() => 1), 0]);
    const s2 = solveLin(M2, [...J.map(() => 0), 1]); if (!s2) continue;
    const y = new Array(n).fill(0), x = new Array(m).fill(0);
    J.forEach((j, t) => { y[j] = s1[t]; }); I.forEach((i, t) => { x[i] = s2[t]; });
    if (y.some((t) => t < -tol) || x.some((t) => t < -tol)) continue;
    const ry = rowPay(A, y), cx = colPay(B, x), v1 = s1[k], v2 = s2[k];
    if (ry.some((t) => t > v1 + 1e-7) || cx.some((t) => t > v2 + 1e-7)) continue;
    if (out.some((e) => e.x.every((t, i) => Math.abs(t - x[i]) < 1e-6) && e.y.every((t, j) => Math.abs(t - y[j]) < 1e-6))) continue;
    out.push({ x, y, u1: v1, u2: v2, k });
  }
  return out;
}

/**
 * Lemke-Howson for a bimatrix game, dropping label k in 0..m+n-1 (labels 0..m-1: row actions, m..m+n-1: column actions).
 * Returns {path: [{x, y, enter, leave}], x, y, ok}; path[0] is the artificial equilibrium (0, 0).
 */
export function lemkeHowson(A0, B0, k) {
  const m = A0.length, n = A0[0].length, N = m + n;
  const lo = (M) => Math.min(...M.flat()), a0 = lo(A0), b0 = lo(B0);
  const A = A0.map((r) => r.map((a) => a - a0 + 1)), B = B0.map((r) => r.map((b) => b - b0 + 1));
  // P: B^T x + s = 1 (columns 0..m-1 = x, m.. = slacks); Q: r + A y = 1 (columns 0..m-1 = r, m.. = y)
  const P = { rows: idx(n).map((j) => [...idx(m).map((i) => B[i][j]), ...idx(n).map((t) => (t === j ? 1 : 0)), 1]), basis: idx(n).map((j) => m + j) };
  const Q = { rows: idx(m).map((i) => [...idx(m).map((t) => (t === i ? 1 : 0)), ...idx(n).map((j) => A[i][j]), 1]), basis: idx(m) };
  const value = (T, c) => { const r = T.basis.indexOf(c); return r < 0 ? 0 : T.rows[r][N]; };
  const state = (enter, leave) => ({ x: idx(m).map((i) => value(P, i)), y: idx(n).map((j) => value(Q, m + j)), enter, leave });
  const pivot = (T, c) => {
    let r = -1, best = Infinity;
    T.rows.forEach((row, i) => { if (row[c] > 1e-10) { const t = row[N] / row[c]; if (t < best - 1e-12) { best = t; r = i; } } });
    if (r < 0) return -1;
    const pv = T.rows[r][c]; T.rows[r] = T.rows[r].map((z) => z / pv);
    T.rows.forEach((row, i) => { if (i !== r && Math.abs(row[c]) > 0) { const f = row[c]; for (let t = 0; t <= N; t++) row[t] -= f * T.rows[r][t]; } });
    const leave = T.basis[r]; T.basis[r] = c; return leave;
  };
  const path = [state(null, null)];
  let T = k < m ? P : Q, enter = k, ok = false;
  for (let step = 0; step < 4000; step++) {
    const leave = pivot(T, enter);
    if (leave < 0) break;
    path.push(state(enter, leave));
    if (leave === k) { ok = true; break; }
    enter = leave; T = T === P ? Q : P;
  }
  const last = path[path.length - 1], sx = last.x.reduce((a, b) => a + b, 0), sy = last.y.reduce((a, b) => a + b, 0);
  return { path, ok, x: ok ? last.x.map((t) => t / sx) : null, y: ok ? last.y.map((t) => t / sy) : null, steps: path.length - 1 };
}

/** Deterministic random integer game, entries 0..9 with one decimal (generic: no ties). */
export function randGame(rng, m, n) {
  const mk = () => idx(m).map(() => idx(n).map(() => rng.int(0, 90) / 10));
  return { A: mk(), B: mk() };
}

// ---------- the probability simplex of three actions drawn as a triangle ----------
export const TRI = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
export const triPt = (b) => [b[0] * TRI[0][0] + b[1] * TRI[1][0] + b[2] * TRI[2][0], b[0] * TRI[0][1] + b[1] * TRI[1][1] + b[2] * TRI[2][1]];
export function triBary(x, y) {
  const h = Math.sqrt(3) / 2, c = y / h, b = x - 0.5 * c, a = 1 - b - c;
  return [a, b, c];
}
/** Nearest point of the simplex (clamp negative barycentric coordinates, renormalise). */
export function triClamp(x, y) {
  let b = triBary(x, y);
  if (b.every((t) => t >= 0)) return [x, y];
  // project: iterate removing the most negative coordinate
  for (let it = 0; it < 3; it++) { b = b.map((t) => Math.max(0, t)); const s = b[0] + b[1] + b[2] || 1; b = b.map((t) => t / s); }
  return triPt(b);
}
export function drawTriangle(s, v, o = {}) {
  s.path([TRI[0], TRI[1], TRI[2], TRI[0]], { color: o.color || 'muted', width: 1.4 });
  if (o.labels) o.labels.forEach((t, i) => {
    const [x, y] = TRI[i];
    s.text(t, x, y, { dx: i === 0 ? -20 : i === 1 ? 20 : 0, dy: i === 2 ? -20 : 4, align: i === 0 ? 'right' : i === 1 ? 'left' : 'center', size: 12, weight: 700, color: o.labelColor || 'muted' });
  });
}

// ---------- classic 2 x 2 presets (A, B and names) ----------
export const G2 = {
  pennies: { label: 'Matching Pennies', R: ['Heads', 'Tails'], C: ['Heads', 'Tails'], A: [[1, -1], [-1, 1]], B: [[-1, 1], [1, -1]] },
  chicken: { label: 'Chicken', R: ['Swerve', 'Dare'], C: ['Swerve', 'Dare'], A: [[6, 2], [7, 0]], B: [[6, 7], [2, 0]] },
  bos: { label: 'Bach or Stravinsky', R: ['Bach', 'Strav.'], C: ['Bach', 'Strav.'], A: [[2, 0], [0, 1]], B: [[1, 0], [0, 2]] },
  stag: { label: 'Stag Hunt', R: ['Stag', 'Hare'], C: ['Stag', 'Hare'], A: [[4, 0], [3, 3]], B: [[4, 3], [0, 3]] },
  pd: { label: 'Prisoner’s Dilemma', R: ['C', 'D'], C: ['C', 'D'], A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]] },
};
/** Payoff advantage of the first action: d1(q) for the row player, d2(p) for the column player. */
export const d1 = (A, q) => q * (A[0][0] - A[1][0]) + (1 - q) * (A[0][1] - A[1][1]);
export const d2 = (B, p) => p * (B[0][0] - B[0][1]) + (1 - p) * (B[1][0] - B[1][1]);
/** Interior indifference point of an advantage function (or null): d(t) = a + (b - a) t has a root in (0, 1). */
export function indiff(d) { const a = d(0), b = d(1); if (a * b < 0) return a / (a - b); return null; }
