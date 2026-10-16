// Control Theory — Chapter 2: helpers shared by ch02.js and ch02-b.js
// (re-exports the chapter-1 toolbox; adds integrators, matrix printing, root finding, Padé and a few drawing helpers)
export * from './ch01.shared.js';
import { ptrim, tf } from './ch01.shared.js';

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** One RK4 step of x' = f(x, t) for array states. */
export function rk4(f, x, t, h) {
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  const k1 = f(x, t), k2 = f(add(x, k1, h / 2), t + h / 2), k3 = f(add(x, k2, h / 2), t + h / 2), k4 = f(add(x, k3, h), t + h);
  return x.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Integrate on t = 0, h, …, N h. Returns {t: [], x: [[…], …]}. */
export function simulate(f, x0, T, N) {
  const h = T / N, t = [0], X = [x0.slice()]; let x = x0.slice();
  for (let k = 0; k < N; k++) { x = rk4(f, x, k * h, h); t.push((k + 1) * h); X.push(x); }
  return { t, x: X };
}

/** TeX of a number to d significant digits with a true minus sign (plain digits only). */
export function nTeX(x, d = 3) {
  if (Math.abs(x) < 1e-9) return '0';
  const s = String(+x.toPrecision(d));
  return s.includes('e') ? x.toExponential(d - 1).replace(/e\+?(-?)(\d+)/, '\\times10^{$1$2}') : s;
}
/** bmatrix TeX of an array of rows. */
export function matTeX(A, d = 3, kind = 'bmatrix') {
  return `\\begin{${kind}}${A.map((r) => (Array.isArray(r) ? r : [r]).map((x) => nTeX(x, d)).join('&')).join('\\\\')}\\end{${kind}}`;
}
/** Complex number [re, im] as TeX. */
export function cTeX(z, d = 3) {
  const [a, b] = z;
  if (Math.abs(b) < 1e-9) return nTeX(a, d);
  return `${Math.abs(a) < 1e-9 ? '' : nTeX(a, d)}${b < 0 ? '-' : (Math.abs(a) < 1e-9 ? '' : '+')}${nTeX(Math.abs(b), d)}i`;
}
/** Roots of a real polynomial (ascending) as [re, im] pairs. M = v.M. */
export function proots(M, p) {
  const q = ptrim(p); if (q.length < 2) return [];
  return M.polyRoots(q).map((z) => [z.re, z.im]);
}
/** Eigenvalues of a real square matrix as [re, im]. */
export function eigs(M, A) { return M.eig(A).values.map((z) => [z.re, z.im]); }
/** Coefficients (descending powers, whitespace/comma separated) → ascending polynomial array, or null if invalid. */
export function parseCoefs(str) {
  const parts = String(str).trim().split(/[\s,;]+/).filter(Boolean);
  if (!parts.length || parts.length > 6) return null;
  const nums = parts.map(Number);
  if (nums.some((x) => !isFinite(x))) return null;
  return nums.reverse();
}

/** Diagonal Padé approximant [n/n] of e^{−sT} as a transfer function. */
export function pade(n, T) {
  const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
  const c = Array.from({ length: n + 1 }, (_, k) => (fact(2 * n - k) * fact(n)) / (fact(2 * n) * fact(k) * fact(n - k)));
  const num = c.map((ck, k) => (k % 2 ? -1 : 1) * ck * T ** k), den = c.map((ck, k) => ck * T ** k);
  return tf(num, den);
}

/** Sample a function of time into path points. */
export const samples = (f, a, b, n) => Array.from({ length: n + 1 }, (_, i) => { const t = a + ((b - a) * i) / n; return [t, f(t)]; });

/** A simple zig-zag spring from (x0, y0) to (x1, y1) with `coils` turns and amplitude `amp` (data units). */
export function springPts(x0, y0, x1, y1, coils = 7, amp = 0.18) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, pts = [[x0, y0]];
  const lead = Math.min(0.12 * L, 0.3);
  pts.push([x0 + ux * lead, y0 + uy * lead]);
  for (let k = 0; k < coils * 2; k++) {
    const f = lead + ((L - 2 * lead) * (k + 0.5)) / (coils * 2), sg = k % 2 ? -1 : 1;
    pts.push([x0 + ux * f + nx * amp * sg, y0 + uy * f + ny * amp * sg]);
  }
  pts.push([x1 - ux * lead, y1 - uy * lead], [x1, y1]);
  return pts;
}
/** Vertical dashpot between a base at y0 and a mass at y1 (cylinder fixed to the base, rod to the mass). */
export function dashpot(s, x, y0, y1, st = {}) {
  const col = st.color || 'ink', w = st.w ?? 0.22, len = y1 - y0, yc = y0 + 0.55 * len, yp = y0 + 0.3 * len + 0.0;
  s.line(x, y0, x, y0 + 0.1 * len, { color: col, width: 1.8 });
  s.path([[x - w, yc], [x - w, y0 + 0.1 * len], [x + w, y0 + 0.1 * len], [x + w, yc]], { color: col, width: 1.8 });
  s.line(x, y1, x, yp + 0.0, { color: col, width: 1.8 });
  s.line(x - w * 0.75, yp, x + w * 0.75, yp, { color: col, width: 3.2 });
}

/** Exact zero-order-hold discretisation of x' = A x + B u over a step h: x⁺ = Φ x + Γ u. M = v.M. */
export function zoh(M, A, B, h) {
  const n = A.length, Aug = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i < n ? (j < n ? A[i][j] * h : (Array.isArray(B[i]) ? B[i][0] : B[i]) * h) : 0)));
  const E = M.expm(Aug);
  return { Phi: Array.from({ length: n }, (_, i) => E[i].slice(0, n)), Gam: Array.from({ length: n }, (_, i) => E[i][n]) };
}
/** Ackermann's formula for the gain K (row) placing the eigenvalues of A − B K at the real numbers `poles`. */
export function ackermann(M, A, B, poles) {
  const n = A.length, cols = [B.slice()];
  for (let k = 1; k < n; k++) cols.push(M.matVec(A, cols[k - 1]));
  const Qc = Array.from({ length: n }, (_, i) => cols.map((c) => c[i]));
  const last = M.inverse(Qc)[n - 1];
  let P = M.identity(n);
  for (const p of poles) P = M.matMul(P, A.map((r, i) => r.map((x, j) => x - (i === j ? p : 0))));
  return Array.from({ length: n }, (_, j) => last.reduce((s, c, i) => s + c * P[i][j], 0));
}
/** A cross (pole marker) on a stage in data units, sized in pixels. */
export function xMark(s, x, y, st = {}) {
  const d = (st.r ?? 5) / Math.abs(s.X(1) - s.X(0)), e = (st.r ?? 5) / Math.abs(s.Y(1) - s.Y(0));
  s.line(x - d, y - e, x + d, y + e, { color: st.color || 'red', width: st.width ?? 2.4 });
  s.line(x - d, y + e, x + d, y - e, { color: st.color || 'red', width: st.width ?? 2.4 });
}
