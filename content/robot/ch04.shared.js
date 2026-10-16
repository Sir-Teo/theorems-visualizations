// Robotics — Chapter 4: helpers shared by ch04.js and ch04-b.js (re-exports the chapter-3 toolbox, then adds Jacobian helpers)
export * from './ch03.shared.js';
import { TAU, clamp, vadd, vsub, vsc, cross3, norm3, mm, mt, mcol, Rx, Ry, Rz, mkT, Rof, pof, Tmul, Tinv, Tapply, Ttrans, Trot, I4, twistExp, adjoint, mv6, twistAt, screwRev, poe } from './ch03.shared.js';

export const wrapPi = (q) => q - TAU * Math.floor((q + Math.PI) / TAU);
/** Shift an angle by multiples of 2π so that it lies within π of `prev` (continuous unwrapping). */
export const unwrapTo = (q, prev) => q - TAU * Math.round((q - prev) / TAU);
export const DEGR = Math.PI / 180;

// ── planar arms ──────────────────────────────────────────────────────────────
/** Joint positions of a planar arm (lengths L, relative joint angles q), and the heading. */
export function planarFK(L, q) {
  const pts = [[0, 0]]; let a = 0, x = 0, y = 0;
  for (let i = 0; i < L.length; i++) { a += q[i]; x += L[i] * Math.cos(a); y += L[i] * Math.sin(a); pts.push([x, y]); }
  return { pts, phi: a, tip: [x, y] };
}
/** Tip-position Jacobian (2 × n) of a planar arm: column i = (−(y − y_i), x − x_i) = ẑ × (tip − joint i). */
export function planarJ(L, q) {
  const { pts, tip } = planarFK(L, q), n = L.length;
  const J = [new Array(n).fill(0), new Array(n).fill(0)];
  for (let i = 0; i < n; i++) { J[0][i] = -(tip[1] - pts[i][1]); J[1][i] = tip[0] - pts[i][0]; }
  return J;
}
/** Both closed-form IK branches of the 2R arm, or null when out of reach. */
export function ik2R(l1, l2, x, y) {
  const d2 = x * x + y * y, c2 = (d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (c2 > 1 + 1e-12 || c2 < -1 - 1e-12) return null;
  const c = clamp(c2, -1, 1), out = [];
  for (const s of [1, -1]) { const t2 = s * Math.acos(c); const t1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(t2), l1 + l2 * Math.cos(t2)); out.push([wrapPi(t1), t2]); }
  return out;
}
/** Singular values (descending) and left singular vectors of a 2×2 or 2×n matrix via the symmetric 2×2 matrix J Jᵀ. */
export function svd2xn(J) {
  const n = J[0].length;
  let a = 0, b = 0, d = 0;
  for (let j = 0; j < n; j++) { a += J[0][j] * J[0][j]; b += J[0][j] * J[1][j]; d += J[1][j] * J[1][j]; }
  const tr = a + d, df = a - d, disc = Math.sqrt(df * df / 4 + b * b);
  const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
  const ang = 0.5 * Math.atan2(2 * b, df); // direction of the major axis
  const u1 = [Math.cos(ang), Math.sin(ang)], u2 = [-Math.sin(ang), Math.cos(ang)];
  return { s: [Math.sqrt(l1), Math.sqrt(l2)], u: [u1, u2], ang };
}
/** Points of an ellipse with centre c, semi-axes r1, r2 along unit vectors u1, u2. */
export function ellipsePts(c, u1, u2, r1, r2, n = 64) {
  const o = [];
  for (let k = 0; k <= n; k++) { const t = (TAU * k) / n, a = r1 * Math.cos(t), b = r2 * Math.sin(t); o.push([c[0] + a * u1[0] + b * u2[0], c[1] + a * u1[1] + b * u2[1]]); }
  return o;
}

// ── a spatial four-joint arm (base turn about z, three pitch joints) written as screws ──
export const ARM4 = { H: 0.5, L1: 1.1, L2: 1.0, L3: 0.5 };
export function arm4Screws() {
  const { H, L1, L2 } = ARM4;
  return [screwRev([0, 0, 1], [0, 0, 0]), screwRev([0, -1, 0], [0, 0, H]), screwRev([0, -1, 0], [L1, 0, H]), screwRev([0, -1, 0], [L1 + L2, 0, H])];
}
export const arm4Home = () => Ttrans([ARM4.L1 + ARM4.L2 + ARM4.L3, 0, ARM4.H]);
/** Space Jacobian (6 × n) of the screws S at joint values th: column i = Ad_{e^{[S_1]θ_1}⋯e^{[S_{i−1}]θ_{i−1}}} S_i. */
export function spaceJ(S, th) {
  const cols = []; let T = I4();
  for (let i = 0; i < S.length; i++) { cols.push(mv6(adjoint(T), S[i])); T = Tmul(T, twistExp(S[i].map((x) => x * th[i]))); }
  return cols[0].map((_, r) => cols.map((c) => c[r]));
}
/** Body Jacobian J_b = [Ad_{T⁻¹}] J_s. */
export function bodyJ(Js, T) {
  const A = adjoint(Tinv(T));
  const cols = Js[0].map((_, j) => mv6(A, Js.map((r) => r[j])));
  return cols[0].map((_, r) => cols.map((c) => c[r]));
}
/** Positions of the joint origins, the tool point, and the current unit joint axes of ARM4 at th. */
export function arm4Pose(th) {
  const S = arm4Screws(), M = arm4Home(), { H, L1, L2 } = ARM4;
  const homeO = [[0, 0, 0], [0, 0, H], [L1, 0, H], [L1 + L2, 0, H]];
  const origins = [], axes = []; let T = I4();
  for (let i = 0; i < 4; i++) {
    origins.push(Tapply(T, homeO[i]));
    axes.push(mv6(adjoint(T), S[i]).slice(0, 3));
    T = Tmul(T, twistExp(S[i].map((x) => x * th[i])));
  }
  const Tt = Tmul(T, M);
  return { S, M, origins, axes, T: Tt, tip: pof(Tt) };
}

// ── the six-axis arm with a spherical wrist (as in 3.4), with closed-form inverse kinematics ──
export const ARM6 = { H0: 0.5, LU: 1.1, LF: 1.0, DT: 0.55 };
/** Forward kinematics of the 3.4 arm: returns elbow, wrist centre, tool point and tool rotation. */
export function fk6(q) {
  const { H0, LU, LF, DT } = ARM6;
  const [t1, t2, t3, t4, t5, t6] = q;
  const Rarm = mm(Rz(t1), mm(Ry(-t2), Ry(-t3)));
  const T1 = Tmul(Trot(Rz(t1)), Tmul(Ttrans([0, 0, H0]), Trot(Ry(-t2))));
  const Tel = Tmul(T1, Tmul(Ttrans([LU, 0, 0]), Trot(Ry(-t3))));
  const Wc = pof(Tmul(Tel, Ttrans([LF, 0, 0])));
  const R = mm(Rarm, mm(Rx(t4), mm(Ry(t5), Rx(t6))));
  return { elbow: pof(Tel), shoulder: [0, 0, H0], Wc, tool: vadd(Wc, vsc(mcol(R, 0), DT)), R, Rarm };
}
/** Closed-form IK for tool pose (R, p): elbow-up branch, wrist with θ5 ≥ 0. `prev` (6 angles) keeps the angles continuous. Null when out of reach. */
export function ik6(R, p, prev) {
  const { H0, LU, LF, DT } = ARM6;
  const Wc = vsub(p, vsc(mcol(R, 0), DT));
  let t1 = Math.atan2(Wc[1], Wc[0]);
  const r = Math.hypot(Wc[0], Wc[1]), z = Wc[2] - H0, D2 = r * r + z * z;
  const c3 = (D2 - LU * LU - LF * LF) / (2 * LU * LF);
  if (c3 > 1 || c3 < -1) return null;
  const t3 = -Math.acos(c3);
  const t2 = Math.atan2(z, r) - Math.atan2(LF * Math.sin(t3), LU + LF * Math.cos(t3));
  const Rarm = mm(Rz(t1), Ry(-(t2 + t3))), Rw = mm(mt(Rarm), R);
  const t5 = Math.acos(clamp(Rw[0][0], -1, 1));
  const t4 = Math.atan2(Rw[1][0], -Rw[2][0]), t6 = Math.atan2(Rw[0][1], Rw[0][2]);
  const q = [t1, t2, t3, t4, t5, t6];
  return prev ? q.map((x, i) => unwrapTo(x, prev[i])) : q;
}
/** The full set of joint angles along a task-space path P(s), s in [0,1] (N+1 samples), by continuation of ik6. */
export function pathJoints(R, P, N) {
  const out = []; let prev = null;
  for (let k = 0; k <= N; k++) { const q = ik6(R, P(k / N), prev); if (!q) { out.push(null); continue; } out.push(q); prev = q; }
  return out;
}

export { twistAt, cross3, norm3, mt, TAU, Rof, twistExp, poe, screwRev };
