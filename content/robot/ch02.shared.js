// Robotics — Chapter 2: helpers shared by ch02.js (plain functions; 3×3 / 4×4 matrices are arrays of rows)

export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ── vectors ──────────────────────────────────────────────────────────────────
export const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vsc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const unit3 = (a) => { const n = norm3(a); return n < 1e-12 ? [0, 0, 1] : vsc(a, 1 / n); };

// ── 3×3 matrices ─────────────────────────────────────────────────────────────
export const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const mt = (A) => [0, 1, 2].map((i) => [A[0][i], A[1][i], A[2][i]]);
export const mv = (A, p) => [dot3(A[0], p), dot3(A[1], p), dot3(A[2], p)];
export const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
export const msc = (A, k) => A.map((r) => r.map((x) => x * k));
export const mcol = (A, j) => [A[0][j], A[1][j], A[2][j]];
export const det3 = (A) => dot3(A[0], cross3(A[1], A[2]));
/** Frobenius norm. */
export const fro = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, x) => t + x * x, 0), 0));
/** How far R is from being a rotation: ‖RᵀR − I‖. */
export const orthErr = (R) => fro(madd(mm(mt(R), R), msc(I3(), -1)));

/** The skew-symmetric matrix [w] with [w]p = w × p. */
export const skew = (w) => [[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]];
export const unskew = (S) => [S[2][1], S[0][2], S[1][0]];

export const Rx = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
export const Ry = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
export const Rz = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
/** Z–Y–X Euler angles (yaw ψ, pitch θ, roll φ): R = Rz(ψ) Ry(θ) Rx(φ). */
export const eulerZYX = (psi, th, ph) => mm(Rz(psi), mm(Ry(th), Rx(ph)));
export function eulerFromR(R) {
  const th = -Math.asin(clamp(R[2][0], -1, 1));
  return Math.abs(Math.cos(th)) < 1e-9 ? [Math.atan2(-R[0][1], R[1][1]), th, 0] : [Math.atan2(R[1][0], R[0][0]), th, Math.atan2(R[2][1], R[2][2])];
}
/** Rodrigues' formula: rotation by angle th about the UNIT axis w:  I + sin θ [w] + (1 − cos θ) [w]². */
export function rodrigues(w, th) {
  const K = skew(w), K2 = mm(K, K);
  return madd(madd(I3(), msc(K, Math.sin(th))), msc(K2, 1 - Math.cos(th)));
}
/** exp([r]) for the rotation vector r = θ·axis. */
export function rotFromVec(r) {
  const th = norm3(r);
  return th < 1e-12 ? I3() : rodrigues(vsc(r, 1 / th), th);
}
/** Matrix logarithm of a rotation: the rotation vector r = θ·axis, θ ∈ [0, π]. */
export function logRot(R) {
  const c = clamp((R[0][0] + R[1][1] + R[2][2] - 1) / 2, -1, 1), th = Math.acos(c);
  if (th < 1e-9) return [0, 0, 0];
  if (Math.PI - th < 1e-5) {
    // θ = π: R = 2 w wᵀ − I, so w wᵀ = (R + I)/2; read the axis off the largest diagonal entry
    const d = [0, 1, 2].map((i) => (R[i][i] + 1) / 2), k = d.indexOf(Math.max(...d));
    const w = [0, 1, 2].map((i) => (i === k ? Math.sqrt(Math.max(d[k], 0)) : (R[i][k] + R[k][i]) / 4 / Math.sqrt(Math.max(d[k], 1e-12))));
    return vsc(unit3(w), Math.PI);
  }
  const w = vsc(unskew(madd(R, msc(mt(R), -1))), 1 / (2 * Math.sin(th)));
  return vsc(unit3(w), th);
}
/** Rotation angle of R in [0, π]. */
export const rotAngle = (R) => Math.acos(clamp((R[0][0] + R[1][1] + R[2][2] - 1) / 2, -1, 1));

// ── quaternions [w, x, y, z] ─────────────────────────────────────────────────
export const qMul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
export const qDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
export const qNorm = (a) => Math.hypot(a[0], a[1], a[2], a[3]);
export function qFromAxisAngle(w, th) { const s = Math.sin(th / 2); return [Math.cos(th / 2), w[0] * s, w[1] * s, w[2] * s]; }
export function qToR([w, x, y, z]) {
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
}
export function qFromR(R) {
  const r = logRot(R), th = norm3(r), w = unit3(r);
  return th < 1e-12 ? [1, 0, 0, 0] : qFromAxisAngle(w, th);
}
/** Spherical linear interpolation along the great circle; shortest = false allows the long way round. */
export function qSlerp(a, b, t, shortest = true) {
  let d = qDot(a, b); let bb = b;
  if (shortest && d < 0) { bb = b.map((x) => -x); d = -d; }
  d = clamp(d, -1, 1);
  const om = Math.acos(d);
  if (om < 1e-9) return a.slice();
  const s = Math.sin(om), A = Math.sin((1 - t) * om) / s, B = Math.sin(t * om) / s;
  return a.map((x, i) => A * x + B * bb[i]);
}

// ── homogeneous transforms (4×4) ─────────────────────────────────────────────
export const mkT = (R, p) => [[R[0][0], R[0][1], R[0][2], p[0]], [R[1][0], R[1][1], R[1][2], p[1]], [R[2][0], R[2][1], R[2][2], p[2]], [0, 0, 0, 1]];
export const Rof = (T) => [[T[0][0], T[0][1], T[0][2]], [T[1][0], T[1][1], T[1][2]], [T[2][0], T[2][1], T[2][2]]];
export const pof = (T) => [T[0][3], T[1][3], T[2][3]];
export const Tmul = (A, B) => A.map((r) => [0, 1, 2, 3].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j] + r[3] * B[3][j]));
export const Tinv = (T) => { const Rt = mt(Rof(T)); return mkT(Rt, vsc(mv(Rt, pof(T)), -1)); };
export const Tapply = (T, p) => vadd(mv(Rof(T), p), pof(T));
export const Ttrans = (p) => mkT(I3(), p);
export const Trot = (R) => mkT(R, [0, 0, 0]);
export const I4 = () => mkT(I3(), [0, 0, 0]);
export const fro4 = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, x) => t + x * x, 0), 0));

/** The 6×6 adjoint of T = (R, p) acting on twists (ω, v): [[R, 0], [[p]R, R]]. */
export function adjoint(T) {
  const R = Rof(T), pR = mm(skew(pof(T)), R), A = Array.from({ length: 6 }, () => new Array(6).fill(0));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { A[i][j] = R[i][j]; A[i + 3][j + 3] = R[i][j]; A[i + 3][j] = pR[i][j]; }
  return A;
}
export const mv6 = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
export const tr6 = (A) => A[0].map((_, j) => A.map((r) => r[j]));

/** exp of the twist ξ = (ω, v) (unit time): a rigid motion, closed form. */
export function twistExp(xi) {
  const w = xi.slice(0, 3), v = xi.slice(3), th = norm3(w);
  if (th < 1e-9) return mkT(I3(), v);
  const K = skew(w), K2 = mm(K, K), R = rodrigues(vsc(w, 1 / th), th);
  const G = madd(madd(I3(), msc(K, (1 - Math.cos(th)) / (th * th))), msc(K2, (th - Math.sin(th)) / (th ** 3)));
  return mkT(R, mv(G, v));
}
/** Velocity of the body-fixed point currently at x, for the twist (ω, v) in the same frame (v = velocity of the point at the origin). */
export const twistAt = (V, x) => vadd(V.slice(3), cross3(V.slice(0, 3), x));

// ── drawing on a scene3 ──────────────────────────────────────────────────────
export const AXC = ['red', 'green', 'accent'];
const CORN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
/** A box with half-sizes h at pose (R, p): the six faces are tinted by the body axis they are normal to. */
export function drawBody(sc, R, p, h, st = {}) {
  const loc = (q) => vadd(mv(R, q), p), a = st.alpha ?? 0.24, col = st.color;
  for (let ax = 0; ax < 3; ax++) for (const s of [1, -1]) {
    const b = (ax + 1) % 3, c = (ax + 2) % 3;
    const pts = CORN.map(([u, w]) => { const q = [0, 0, 0]; q[ax] = s * h[ax]; q[b] = u * h[b]; q[c] = w * h[c]; return loc(q); });
    sc.poly(pts, { fill: col || AXC[ax], fillAlpha: s > 0 ? a : a * 0.55, color: col || AXC[ax], width: st.width ?? 1.1, alpha: st.edgeAlpha ?? 0.7 });
  }
}
/** Three coordinate arrows at pose (R, p). */
export function drawFrame(sc, R, p, L = 0.8, st = {}) {
  for (let i = 0; i < 3; i++) sc.arrow(p, vadd(p, vsc(mcol(R, i), L)), { color: st.color || AXC[i], width: st.width ?? 2.4, head: st.head ?? 9, alpha: st.alpha, top: st.top });
}
/** Axis labels at the tips of a frame. */
export function frameLabels(sc, R, p, L, names, st = {}) {
  for (let i = 0; i < 3; i++) sc.tex(names[i], vadd(p, vsc(mcol(R, i), L * 1.18)), { color: st.color || AXC[i], size: st.size ?? 13 });
}
/** Three faint great circles of a sphere of radius r (a ball to drag handles in). */
export function drawBall(sc, r, st = {}) {
  const n = 64;
  for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
    const pts = [];
    for (let k = 0; k <= n; k++) { const t = (TAU * k) / n, q = [0, 0, 0]; q[i] = r * Math.cos(t); q[j] = r * Math.sin(t); pts.push(q); }
    sc.path(pts, { color: st.color || 'faint', width: 1, alpha: st.alpha ?? 0.8, top: false });
  }
}
/** Circle (as a polyline) of radius r about the axis through c with unit direction w, passing through the point p. */
export function circleAbout(p, w, c0 = [0, 0, 0], n = 48) {
  const rel = vsub(p, c0), cen = vadd(c0, vsc(w, dot3(rel, w))), a = vsub(p, cen), b = cross3(w, a), pts = [];
  for (let k = 0; k <= n; k++) { const t = (TAU * k) / n; pts.push(vadd(cen, vadd(vsc(a, Math.cos(t)), vsc(b, Math.sin(t))))); }
  return pts;
}
/** Snap function keeping a handle inside the ball of radius r. */
export const inBall = (r) => (p) => { const n = norm3(p); return n > r ? vsc(p, r / n) : p; };
export const onSphere = (r) => (p) => vsc(unit3(p), r);

// ── formatting (TeX) ─────────────────────────────────────────────────────────
export const fx = (x, d = 2) => { const s = x.toFixed(d); return /^-0\.?0*$/.test(s) ? s.slice(1) : s; };
export const bmat = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => fx(x, d)).join('&')).join('\\\\')}\\end{bmatrix}`;
export const bvec = (a, d = 2) => `\\begin{bmatrix}${a.map((x) => fx(x, d)).join('\\\\')}\\end{bmatrix}`;

/** Ticks at multiples of π/2 inside [a, b]. */
export function piTicks(a, b, step = 0.5) {
  const lab = (k) => { const n = k * step; if (Math.abs(n) < 1e-9) return '0'; const s = n < 0 ? '−' : ''; const m = Math.abs(n); return s + (m === 1 ? 'π' : Number.isInteger(m) ? `${m}π` : m === 0.5 ? 'π/2' : `${m}π`); };
  const out = []; for (let k = Math.ceil(a / (Math.PI * step) - 1e-9); k * Math.PI * step <= b + 1e-9; k++) out.push([k * Math.PI * step, lab(k)]);
  return out;
}
