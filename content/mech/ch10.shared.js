// Classical Mechanics — Chapter 10: helpers shared by ch10.js, ch10-b.js and ch10-c.js

// ── numerics ──────────────────────────────────────────────────────────────────
export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** One classical RK4 step of y' = f(t, y) for an array state. */
export function rk4(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((c, i) => c + (h / 2) * k1[i]), k2 = f(t + h / 2, y2);
  const y3 = y.map((c, i) => c + (h / 2) * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = f(t + h, y4);
  return y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}; post(y) may renormalise the state. */
export function rk4rec(f, y0, T, n, every = 1, post = null) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every };
  for (let k = 1; k <= n; k++) {
    y = rk4(f, (k - 1) * h, y, h); if (post) y = post(y);
    if (k % every === 0) { out.t.push(k * h); out.y.push(y); }
  }
  return out;
}
/** Index of the record at time t (records equally spaced by dt). */
export const idxAt = (R, t) => Math.max(0, Math.min(R.t.length - 1, Math.round(t / R.dt)));
/** Range [lo, hi] of several arrays, padded, with a minimum span. */
export function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** TeX for a number that may be tiny (use inside $…$). */
export const sci = (v, x, d = 2) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, d));
/** Fixed decimals, or TeX scientific notation when that would print as zero (use inside $…$). */
export const num = (v, x, d = 4) => (Math.abs(x) < 1e-30 ? '0' : Math.abs(x) >= 0.5 * 10 ** -d ? v.fix(x, d) : v.sci(x, 2));
/** Polyline of (xs[k], ys[k]) for k ≤ upto. */
export function series(s, xs, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, xs.length - 1); k++) pts.push([xs[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
/** Complete elliptic integral of the first kind K(m), m = k² (arithmetic–geometric mean). */
export function ellK(m) {
  if (m >= 1) return Infinity;
  let a = 1, b = Math.sqrt(1 - m);
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15 * a; i++) { const c = (a + b) / 2; b = Math.sqrt(a * b); a = c; }
  return Math.PI / (2 * a);
}

// ── vectors in ℝ³ ─────────────────────────────────────────────────────────────
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
/** a + k b */
export const madd = (a, b, k) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const nrm = (a) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a) => { const n = nrm(a); return n > 1e-300 ? scl(a, 1 / n) : [0, 0, 1]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Angle between two vectors (radians), robust near 0 and π. */
export const angle = (a, b) => Math.atan2(nrm(crs(a, b)), dot(a, b));
/** A unit vector perpendicular to n. */
export function perp(n) { const a = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0]; return unit(crs(n, a)); }

// ── 3×3 matrices (arrays of rows) ─────────────────────────────────────────────
export const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const mv = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1] + A[0][2] * p[2], A[1][0] * p[0] + A[1][1] * p[1] + A[1][2] * p[2], A[2][0] * p[0] + A[2][1] * p[1] + A[2][2] * p[2]];
export const mT = (A) => [[A[0][0], A[1][0], A[2][0]], [A[0][1], A[1][1], A[2][1]], [A[0][2], A[1][2], A[2][2]]];
export const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
export const col = (A, j) => [A[0][j], A[1][j], A[2][j]];
export const fromCols = (a, b, c) => [[a[0], b[0], c[0]], [a[1], b[1], c[1]], [a[2], b[2], c[2]]];
export const det3 = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
/** Frobenius norm of A − B. */
export const fro = (A, B) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += (A[i][j] - B[i][j]) ** 2; return Math.sqrt(s); };
/** Rotation by angle th about the unit vector n (Rodrigues). */
export function rotAxis(n, th) {
  const [x, y, z] = n, c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
export const Rx = (a) => rotAxis([1, 0, 0], a);
export const Ry = (a) => rotAxis([0, 1, 0], a);
export const Rz = (a) => rotAxis([0, 0, 1], a);
/** Axis n and angle θ ∈ [0, π] of a rotation matrix (robust near θ = 0 and θ = π). */
export function axisAngle(R) {
  const tr = R[0][0] + R[1][1] + R[2][2], c = clamp((tr - 1) / 2, -1, 1);
  const w = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]], s = nrm(w) / 2;
  const th = Math.atan2(s, c);
  if (s > 1e-6) return { n: scl(w, 1 / (2 * s)), th };
  if (c > 0) return { n: [0, 0, 1], th: 0 };
  // θ ≈ π: R ≈ 2nnᵀ − I, take the largest diagonal entry of (R + I)/2
  const B = R.map((r, i) => r.map((x, j) => (x + (i === j ? 1 : 0)) / 2));
  const k = [0, 1, 2].reduce((a, b) => (B[b][b] > B[a][a] ? b : a), 0);
  let n = unit(B[k]); if (dot(n, w) < 0) n = scl(n, -1);
  return { n, th };
}
/** Re-orthonormalise a nearly orthogonal matrix (Gram–Schmidt on the columns). */
export function orthoCols(R) { const a = unit(col(R, 0)), b = unit(madd(col(R, 1), a, -dot(a, col(R, 1)))); return fromCols(a, b, crs(a, b)); }

// ── unit quaternions q = [w, x, y, z] (w + xi + yj + zk) ─────────────────────
export const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
export const qconj = (q) => [q[0], -q[1], -q[2], -q[3]];
export const qnormalize = (q) => { const n = Math.hypot(q[0], q[1], q[2], q[3]); return q.map((c) => c / n); };
/** cos(θ/2) + sin(θ/2) n for a unit axis n. */
export const qaxis = (n, th) => { const s = Math.sin(th / 2); return [Math.cos(th / 2), s * n[0], s * n[1], s * n[2]]; };
/** Rotation matrix of a unit quaternion. */
export function qmat(q) {
  const [w, x, y, z] = q;
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
}
/** q v q̄ for a vector v. */
export const qrot = (q, v) => { const r = qmul(qmul(q, [0, v[0], v[1], v[2]]), qconj(q)); return [r[1], r[2], r[3]]; };

// ── rigid-body equations of motion ────────────────────────────────────────────
/**
 * Free (or torqued) rigid body in its principal frame: state y = [q0, q1, q2, q3, ω1, ω2, ω3] with q the body→space
 * quaternion and ω the body-frame angular velocity; Euler's equations Iω̇ = (Iω)×ω + τ_body(t, y).
 */
export function eulerRHS(Id, torque = null) {
  return (t, y) => {
    const q = [y[0], y[1], y[2], y[3]], w = [y[4], y[5], y[6]], L = [Id[0] * w[0], Id[1] * w[1], Id[2] * w[2]];
    const g = crs(L, w); const tq = torque ? torque(t, y) : null; if (tq) { g[0] += tq[0]; g[1] += tq[1]; g[2] += tq[2]; }
    const dq = qmul(q, [0, w[0], w[1], w[2]]);
    return [dq[0] / 2, dq[1] / 2, dq[2] / 2, dq[3] / 2, g[0] / Id[0], g[1] / Id[1], g[2] / Id[2]];
  };
}
/** Normalise the quaternion part of an Euler state. */
export const eulerPost = (y) => { const q = qnormalize(y.slice(0, 4)); return [q[0], q[1], q[2], q[3], y[4], y[5], y[6]]; };
/**
 * Heavy symmetric top about a fixed tip, without Euler angles: state y = [n, u, L] (9 numbers), n = unit symmetry
 * axis, u = a unit body vector ⟂ n (to show the spin), L = space-frame angular momentum about the tip.
 * ṅ = (L × n)/I₁, L̇ = mgl ẑ × n − fr (L·n) n (tip friction acting on the spin only), ω = L/I₁ + (1/I₃ − 1/I₁)(L·n) n.
 */
export function topRHS(I1, I3, mgl, fr = 0) {
  return (t, y) => {
    const n = [y[0], y[1], y[2]], u = [y[3], y[4], y[5]], L = [y[6], y[7], y[8]], L3 = dot(L, n);
    const w = madd(scl(L, 1 / I1), n, (1 / I3 - 1 / I1) * L3);
    const dn = crs(w, n), du = crs(w, u), dL = [-mgl * n[1] - fr * L3 * n[0], mgl * n[0] - fr * L3 * n[1], -fr * L3 * n[2]];
    return [dn[0], dn[1], dn[2], du[0], du[1], du[2], dL[0], dL[1], dL[2]];
  };
}
/** Renormalise n and u (keeping u ⟂ n) in a top state. */
export const topPost = (y) => {
  const n = unit([y[0], y[1], y[2]]), u = unit(madd([y[3], y[4], y[5]], n, -dot(n, [y[3], y[4], y[5]])));
  return [n[0], n[1], n[2], u[0], u[1], u[2], y[6], y[7], y[8]];
};
/** Energy of the heavy symmetric top state. */
export const topEnergy = (I1, I3, mgl, y) => { const n = [y[0], y[1], y[2]], L = [y[6], y[7], y[8]], L3 = dot(L, n); return dot(L, L) / (2 * I1) + L3 * L3 * (1 / (2 * I3) - 1 / (2 * I1)) + mgl * n[2]; };

// ── drawing on a scene3 ───────────────────────────────────────────────────────
/** The 8 corners of a box with half-extents h, in the order (±x, ±y, ±z) with x slowest. */
export function boxCorners(h) { const c = []; for (const a of [-1, 1]) for (const b of [-1, 1]) for (const d of [-1, 1]) c.push([a * h[0], b * h[1], d * h[2]]); return c; }
/** Faces as corner indices, with the body axis each face is normal to. */
export const BOX_FACES = [[[0, 1, 3, 2], 0], [[4, 5, 7, 6], 0], [[0, 1, 5, 4], 1], [[2, 3, 7, 6], 1], [[0, 2, 6, 4], 2], [[1, 3, 7, 5], 2]];
/** Colours of the faces normal to the body axes 1, 2, 3 (also used for the principal axes). */
export const AXC = ['teal', 'gold', 'pink'];
/**
 * A box with half-extents h, orientation R and centre c. o: {colors (per axis), fillAlpha, ghost (outline only),
 * color (edges), width, alpha, dash, mark (draw a marker on the +z face)}.
 */
export function drawBox(sc, R, h, o = {}) {
  const c0 = o.center || [0, 0, 0], C = boxCorners(h).map((p) => add(c0, mv(R, p))), cols = o.colors || AXC;
  for (const [f, ax] of BOX_FACES) {
    const pts = f.map((j) => C[j]);
    if (o.ghost) sc.path(pts, { color: o.color || 'muted', width: o.width ?? 1, alpha: o.alpha ?? 0.6, dash: o.dash, close: true });
    else sc.poly(pts, { fill: cols[ax], fillAlpha: o.fillAlpha ?? 0.3, color: o.color || cols[ax], width: o.width ?? 1.2, alpha: o.alpha ?? 0.85 });
  }
  return C;
}
/** Points of a planar marker shaped like the letter F on the +z face of a box (body coordinates). */
export function letterF(h) {
  const z = h[2] * 1.001, sx = h[0] * 0.55, sy = h[1] * 0.6;
  return [[[-0.5 * sx, -sy, z], [-0.5 * sx, sy, z], [0.6 * sx, sy, z]], [[-0.5 * sx, 0, z], [0.3 * sx, 0, z]]];
}
/** Circle of radius r about centre c in the plane spanned by orthonormal a, b. */
export function circlePts(c, a, b, r, n = 64, t0 = 0, t1 = TAU) {
  const pts = []; for (let k = 0; k <= n; k++) { const t = t0 + ((t1 - t0) * k) / n; pts.push([c[0] + r * (Math.cos(t) * a[0] + Math.sin(t) * b[0]), c[1] + r * (Math.cos(t) * a[1] + Math.sin(t) * b[1]), c[2] + r * (Math.cos(t) * a[2] + Math.sin(t) * b[2])]); }
  return pts;
}
/** Wireframe of the ellipsoid {c + R diag(ax) s : |s| = 1} (latitude and longitude lines). */
export function ellipsoidWire(sc, R, ax, st = {}, c = [0, 0, 0]) {
  const P = (u, w) => add(c, mv(R, [ax[0] * Math.cos(w) * Math.cos(u), ax[1] * Math.cos(w) * Math.sin(u), ax[2] * Math.sin(w)]));
  const nl = st.lat ?? 7, nm = st.lon ?? 12, line = { color: st.color || 'muted', width: st.width ?? 0.9, alpha: st.alpha ?? 0.45 };
  for (let i = 1; i < nl; i++) { const w = -Math.PI / 2 + (Math.PI * i) / nl, pts = []; for (let k = 0; k <= 48; k++) pts.push(P((TAU * k) / 48, w)); sc.path(pts, line); }
  for (let j = 0; j < nm; j++) { const u = (TAU * j) / nm, pts = []; for (let k = 0; k <= 24; k++) pts.push(P(u, -Math.PI / 2 + (Math.PI * k) / 24)); sc.path(pts, line); }
}
/** Unit-vector direction of the viewer in a scene3 (points toward the eye). */
export const eyeDir = (sc) => [-Math.sin(sc.yaw) * Math.cos(sc.pitch), -Math.cos(sc.yaw) * Math.cos(sc.pitch), Math.sin(sc.pitch)];
/** A solid tube (cylinder of radius r) from p to q, drawn as shaded strips facing the viewer. */
export function tube(sc, p, q, r, st = {}) {
  const ax = unit(sub(q, p)), a = perp(ax), b = crs(ax, a), n = st.n ?? 14, e = eyeDir(sc);
  for (let k = 0; k < n; k++) {
    const t0 = (TAU * k) / n, t1 = (TAU * (k + 1)) / n, tm = (t0 + t1) / 2;
    const nm = add(scl(a, Math.cos(tm)), scl(b, Math.sin(tm)));
    if (dot(nm, e) < -0.05 && !st.all) continue;
    const u0 = add(scl(a, r * Math.cos(t0)), scl(b, r * Math.sin(t0))), u1 = add(scl(a, r * Math.cos(t1)), scl(b, r * Math.sin(t1)));
    const lit = 0.18 + 0.32 * Math.max(0, dot(nm, e));
    sc.poly([add(p, u0), add(p, u1), add(q, u1), add(q, u0)], { fill: st.color || 'accent', fillAlpha: (st.fillAlpha ?? 1) * lit, edge: false, bias: st.bias });
  }
  for (const c of [p, q]) sc.path(circlePts(c, a, b, r, 24), { color: st.color || 'accent', width: st.width ?? 1, alpha: st.alpha ?? 0.8 });
}
