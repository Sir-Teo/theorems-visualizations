// Shared helpers for Special & General Relativity — Chapter 2 (units c = 1; events are (t, x), drawn with x across and t up).

export const gam = (b) => 1 / Math.sqrt(1 - b * b);
/** (t, x) in the lab frame → (t′, x′) in the frame moving at +b. */
export const toMoving = (b, t, x) => { const g = gam(b); return [g * (t - b * x), g * (x - b * t)]; };
/** (t′, x′) in the frame moving at +b → (t, x) in the lab frame. */
export const fromMoving = (b, tp, xp) => { const g = gam(b); return [g * (tp + b * xp), g * (xp + b * tp)]; };
/** Plot position of an event (t, x). */
export const P = (t, x) => [x, t];
export const atanh = (x) => 0.5 * Math.log((1 + x) / (1 - x));
export const addV = (u, w) => (u + w) / (1 + u * w);

/** The two light lines through the origin, drawn across the stage window. */
export function lightLines(s, R = 12, st = {}) {
  s.line(-R, -R, R, R, { color: 'gold', width: 1.2, alpha: 0.55, dash: [4, 4], ...st });
  s.line(-R, R, R, -R, { color: 'gold', width: 1.2, alpha: 0.55, dash: [4, 4], ...st });
}
/** Grid of a frame with map (t′, x′) ↦ (t, x): lines x′ = k (colour cx) and t′ = k (colour ct). */
export function frameGrid(s, map, { n = 6, R = 12, cx = 'accent', ct = 'orange', alpha = 0.35, labels = false } = {}) {
  s.clip(() => {
    for (let k = -n; k <= n; k++) {
      const a = k === 0 ? 0.9 : alpha, w = k === 0 ? 1.8 : 1;
      s.path([-R, R].map((tp) => P(...map(tp, k))), { color: cx, width: w, alpha: a });
      s.path([-R, R].map((xp) => P(...map(k, xp))), { color: ct, width: w, alpha: a });
    }
  });
}

// ---- 4×4 matrices (rows), metric (+,−,−,−) with c = 1: coordinates ordered (t, x, y, z) ----
export const ETA = [[1, 0, 0, 0], [0, -1, 0, 0], [0, 0, -1, 0], [0, 0, 0, -1]];
export const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export const mv = (A, x) => A.map((r) => r.reduce((s, a, k) => s + a * x[k], 0));
export const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
export const I4 = () => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
/** Pure boost with velocity vector (bx, by, bz). */
export function boost4(bx, by = 0, bz = 0) {
  const b2 = bx * bx + by * by + bz * bz;
  if (b2 < 1e-18) return I4();
  const g = 1 / Math.sqrt(1 - b2), n = [bx, by, bz], L = I4();
  L[0][0] = g;
  for (let i = 0; i < 3; i++) {
    L[0][i + 1] = L[i + 1][0] = g * n[i];
    for (let j = 0; j < 3; j++) L[i + 1][j + 1] = (i === j ? 1 : 0) + ((g - 1) * n[i] * n[j]) / b2;
  }
  return L;
}
/** Rotation by angle a about axis 'x' | 'y' | 'z' (spatial block of a 4×4). */
export function rot4(axis, a) {
  const c = Math.cos(a), s = Math.sin(a), R = I4();
  const [i, j] = axis === 'z' ? [1, 2] : axis === 'x' ? [2, 3] : [3, 1];
  R[i][i] = c; R[i][j] = -s; R[j][i] = s; R[j][j] = c;
  return R;
}
/** Maximum entry of |ΛᵀηΛ − η|. */
export function lorentzDefect(L) {
  const M = mm(tr(L), mm(ETA, L));
  let m = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) m = Math.max(m, Math.abs(M[i][j] - ETA[i][j]));
  return m;
}
export const det4 = (A) => {
  const m = A.map((r) => r.slice()); let d = 1;
  for (let c = 0; c < 4; c++) {
    let p = c; for (let r = c + 1; r < 4; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-14) return 0;
    if (p !== c) { [m[p], m[c]] = [m[c], m[p]]; d = -d; }
    d *= m[c][c];
    for (let r = c + 1; r < 4; r++) { const f = m[r][c] / m[c][c]; for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k]; }
  }
  return d;
};
/** TeX pmatrix of a matrix of numbers. */
export const pmatrix = (A, fix, d = 3) => String.raw`\begin{pmatrix}${A.map((r) => r.map((x) => fix(Math.abs(x) < 5e-10 ? 0 : x, d)).join(' & ')).join(String.raw` \\ `)}\end{pmatrix}`;
