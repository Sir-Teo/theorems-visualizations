// Quantum Information — Chapter 1: helpers shared by ch01.js and ch01-b.js.
// Complex numbers are pairs [re, im]; a qubit state is [α, β]; a 2×2 matrix is an array of rows of pairs.
// Generic helpers copied (not imported) from the qm collection's chapter 5, plus qubit-specific ones:
// gate matrices, the SU(2) → SO(3) map, axis–angle extraction, the Z–Y–Z decomposition, Bloch-sphere drawing.
export const TAU = 2 * Math.PI, R2 = Math.SQRT1_2;

// ------------------------------------------------------------------ complex scalars
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cconj = (a) => [a[0], -a[1]];
export const cscale = (a, k) => [a[0] * k, a[1] * k];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const cabs2 = (a) => a[0] * a[0] + a[1] * a[1];
export const carg = (a) => Math.atan2(a[1], a[0]);
export const cis = (t) => [Math.cos(t), Math.sin(t)];
export const polar = (r, t) => [r * Math.cos(t), r * Math.sin(t)];

// ------------------------------------------------------------------ vectors and matrices
/** ⟨a|b⟩ = Σ conj(a_i) b_i. */
export function ip(a, b) { let r = 0, i = 0; for (let k = 0; k < a.length; k++) { r += a[k][0] * b[k][0] + a[k][1] * b[k][1]; i += a[k][0] * b[k][1] - a[k][1] * b[k][0]; } return [r, i]; }
export const mvec = (A, x) => A.map((row) => { let r = 0, i = 0; for (let k = 0; k < row.length; k++) { r += row[k][0] * x[k][0] - row[k][1] * x[k][1]; i += row[k][0] * x[k][1] + row[k][1] * x[k][0]; } return [r, i]; });
export function mmul(A, B) {
  const n = A.length, m = B[0].length, K = B.length, R = Array.from({ length: n }, () => Array.from({ length: m }, () => [0, 0]));
  for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) { const a = A[i][k]; for (let j = 0; j < m; j++) { R[i][j][0] += a[0] * B[k][j][0] - a[1] * B[k][j][1]; R[i][j][1] += a[0] * B[k][j][1] + a[1] * B[k][j][0]; } }
  return R;
}
export const adj = (A) => A[0].map((_, j) => A.map((r) => [r[j][0], -r[j][1]]));
export const madd = (A, B) => A.map((r, i) => r.map((z, j) => cadd(z, B[i][j])));
export const msub = (A, B) => A.map((r, i) => r.map((z, j) => csub(z, B[i][j])));
export const mscale = (A, c) => A.map((r) => r.map((z) => (typeof c === 'number' ? cscale(z, c) : cmul(z, c))));
export const trace = (A) => A.reduce((s, r, i) => cadd(s, r[i]), [0, 0]);
export const fnorm = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, z) => t + cabs2(z), 0), 0));
export const cplx = (A) => A.map((r) => r.map((x) => (typeof x === 'number' ? [x, 0] : x)));
export const eye2 = () => cplx([[1, 0], [0, 1]]);
export const det2 = (U) => csub(cmul(U[0][0], U[1][1]), cmul(U[0][1], U[1][0]));
export const unitaryError = (U) => fnorm(msub(mmul(adj(U), U), eye2()));

// ------------------------------------------------------------------ Pauli matrices, gates, rotations
export const SX = cplx([[0, 1], [1, 0]]);
export const SY = [[[0, 0], [0, -1]], [[0, 1], [0, 0]]];
export const SZ = cplx([[1, 0], [0, -1]]);
export const PAULI = [SX, SY, SZ];
/** n·σ for a 3-vector n. */
export const sigmaDot = (n) => madd(madd(mscale(SX, n[0]), mscale(SY, n[1])), mscale(SZ, n[2]));
/** The qubit gates of the chapter as 2×2 matrices. */
export const GATE = {
  I: () => eye2(), X: () => SX, Y: () => SY, Z: () => SZ,
  H: () => cplx([[R2, R2], [R2, -R2]]),
  S: () => [[[1, 0], [0, 0]], [[0, 0], [0, 1]]],
  T: () => [[[1, 0], [0, 0]], [[0, 0], [R2, R2]]],
  Sdg: () => [[[1, 0], [0, 0]], [[0, 0], [0, -1]]],
  Tdg: () => [[[1, 0], [0, 0]], [[0, 0], [R2, -R2]]],
};
/** R_n(θ) = exp(−iθ n·σ/2) = cos(θ/2) I − i sin(θ/2) n·σ, for a unit vector n. */
export function rn(n, th) { const L = Math.hypot(...n) || 1, u = n.map((x) => x / L); return madd(mscale(eye2(), Math.cos(th / 2)), mscale(sigmaDot(u), [0, -Math.sin(th / 2)])); }
/** Rodrigues: rotate the 3-vector p about the unit axis n by angle a (right-handed). */
export function rotate3(p, n, a) {
  const c = Math.cos(a), s = Math.sin(a), d = n[0] * p[0] + n[1] * p[1] + n[2] * p[2];
  const x = [n[1] * p[2] - n[2] * p[1], n[2] * p[0] - n[0] * p[2], n[0] * p[1] - n[1] * p[0]];
  return [0, 1, 2].map((i) => p[i] * c + x[i] * s + n[i] * d * (1 - c));
}
export const norm3 = (p) => Math.hypot(p[0], p[1], p[2]);
export const unit3 = (p) => { const L = norm3(p) || 1; return p.map((x) => x / L); };
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/** Bloch vector of a qubit state [α, β] (normalizes). */
export function blochOf(psi) { const [a, b] = psi, n = cabs2(a) + cabs2(b) || 1, w = cmul(cconj(a), b); return [(2 * w[0]) / n, (2 * w[1]) / n, (cabs2(a) - cabs2(b)) / n]; }
/** The state cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ whose Bloch vector points along n. */
export function stateOf(n) { const z = Math.max(-1, Math.min(1, n[2] / (Math.hypot(...n) || 1))), th = Math.acos(z), ph = Math.atan2(n[1], n[0]); return [[Math.cos(th / 2), 0], cscale(cis(ph), Math.sin(th / 2))]; }
/** Density matrix ½(I + r·σ) of a (possibly mixed) Bloch vector. */
export const rhoOf = (r) => mscale(madd(eye2(), sigmaDot(r)), 0.5);
/** The SO(3) matrix of a unitary: R_ij = ½ tr(σ_i U σ_j U†). */
export function so3(U) {
  const Ud = adj(U), R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let j = 0; j < 3; j++) { const M = mmul(U, mmul(PAULI[j], Ud)); for (let i = 0; i < 3; i++) R[i][j] = 0.5 * trace(mmul(PAULI[i], M))[0]; }
  return R;
}
export const mat3vec = (R, p) => R.map((row) => row[0] * p[0] + row[1] * p[1] + row[2] * p[2]);
/** Axis and angle of the rotation a unitary performs: {axis (unit), angle ∈ [0, π], phase γ with U = e^{iγ} R_axis(angle)}. */
export function axisAngle(U) {
  const d = det2(U), g = carg(d) / 2, V0 = mscale(U, cis(-g)); // V0 ∈ SU(2)
  let V = V0, gam = g;
  const c0 = trace(V0)[0] / 2; if (c0 < 0) { V = mscale(V0, -1); gam = g + Math.PI; }
  const c = trace(V)[0] / 2, vec = PAULI.map((P) => -trace(mmul(P, V))[1] / 2), s = norm3(vec);
  const angle = 2 * Math.atan2(s, c);
  return { axis: s > 1e-9 ? vec.map((x) => x / s) : [0, 0, 1], angle, phase: gam, identity: s < 1e-9 };
}
/** U = e^{iα} R_z(β) R_y(γ) R_z(δ): the Euler angles of a single-qubit unitary (Nielsen–Chuang Thm 4.1). */
export function zyz(U) {
  const al = carg(det2(U)) / 2, V = mscale(U, cis(-al)), a0 = cabs(V[0][0]), a1 = cabs(V[1][0]);
  const gamma = 2 * Math.atan2(a1, a0);
  const s = a0 > 1e-9 ? -carg(V[0][0]) : 0, d = a1 > 1e-9 ? carg(V[1][0]) : 0; // (β+δ)/2 and (β−δ)/2
  return { alpha: al, beta: s + d, gamma, delta: s - d };
}
export const rz = (t) => rn([0, 0, 1], t);
export const ry = (t) => rn([0, 1, 0], t);
export const rzyz = (e) => mscale(mmul(rz(e.beta), mmul(ry(e.gamma), rz(e.delta))), cis(e.alpha));
/** Haar-random single-qubit unitary from a seeded generator r (normal()). */
export function randU(r) {
  const q = [r.normal(), r.normal(), r.normal(), r.normal()], L = Math.hypot(...q), [a, b, c, d] = q.map((x) => x / L);
  const V = [[[a, b], [c, d]], [[-c, d], [a, -b]]]; // unit quaternion → SU(2)
  return mscale(V, cis(r() * TAU));
}

// ------------------------------------------------------------------ text
const num = (v, x, d) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
/** TeX for a complex number (drops a zero part). */
export function texC(v, z, d = 2) {
  const re = Math.abs(z[0]) < 0.5 * 10 ** -d ? 0 : z[0], im = Math.abs(z[1]) < 0.5 * 10 ** -d ? 0 : z[1];
  if (!im) return re ? num(v, re, d) : '0';
  const I = `${Math.abs(im - 1) < 1e-12 ? '' : Math.abs(im + 1) < 1e-12 ? '-' : num(v, im, d)}i`;
  if (!re) return I;
  return `${num(v, re, d)}${im < 0 ? '-' : '+'}${Math.abs(Math.abs(im) - 1) < 1e-12 ? '' : num(v, Math.abs(im), d)}i`;
}
/** Plain-text complex number for canvas labels. */
export function txtC(v, z, d = 2) {
  const re = Math.abs(z[0]) < 0.5 * 10 ** -d ? 0 : z[0], im = Math.abs(z[1]) < 0.5 * 10 ** -d ? 0 : z[1];
  if (!im) return v.fix(re, d); if (!re) return `${v.fix(im, d)}i`;
  return `${v.fix(re, d)}${im < 0 ? '−' : '+'}${v.fix(Math.abs(im), d)}i`;
}
export function texMat(v, A, d = 2) {
  const rows = Array.isArray(A[0][0]) ? A : A.map((z) => [z]);
  return `\\begin{pmatrix}${rows.map((r) => r.map((z) => texC(v, typeof z === 'number' ? [z, 0] : z, d)).join('&')).join('\\\\')}\\end{pmatrix}`;
}
export const texVec3 = (v, p, d = 3) => `(${p.map((x) => v.fix(Math.abs(x) < 5e-4 ? 0 : x, d)).join(',\\,')})`;
/** Angle in radians as a short TeX multiple of π when it is one (π/2, 3π/4 …), else a decimal. */
export function texAngle(v, t) {
  const k = t / (Math.PI / 12);
  if (Math.abs(k - Math.round(k)) < 1e-6) {
    const n = Math.round(k); if (n === 0) return '0';
    const g = (a, b) => (b ? g(b, a % b) : a), gg = g(Math.abs(n), 12), num_ = n / gg, den = 12 / gg;
    return `${num_ < 0 ? '-' : ''}${Math.abs(num_) === 1 ? '' : Math.abs(num_)}\\pi${den === 1 ? '' : `/${den}`}`;
  }
  return v.fix(t, 3);
}

// ------------------------------------------------------------------ drawing
/** Tiles for a complex matrix: disc area ∝ |entry|, colour = phase, entry text on top. */
export function cells(v, s, A, rect, o = {}) {
  const Q = v.quantum(), n = A.length, m = A[0].length, [x0, y0, x1, y1] = rect, cw = (x1 - x0) / m, ch = (y1 - y0) / n;
  const px = Math.min(Math.abs(cw * s.sx), Math.abs(ch * s.sy)), size = o.size ?? Math.max(8, Math.min(12.5, px * 0.2));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const X0 = x0 + j * cw, Y1 = y1 - i * ch, z = A[i][j], a = cabs(z);
    s.rect(X0 + 0.04 * cw, Y1 - 0.96 * ch, X0 + 0.96 * cw, Y1 - 0.04 * ch, { fill: 'grid', fillAlpha: 0.16, color: 'grid', width: 0.8, radius: 3 });
    const R = 0.46 * px * Math.sqrt(Math.min(1, a));
    if (R > 0.6) { const c = s.ctx; c.save(); c.globalAlpha = 0.8; c.beginPath(); c.arc(s.X(X0 + cw / 2), s.Y(Y1 - ch / 2), R, 0, TAU); c.fillStyle = Q.phaseColor(carg(z)); c.fill(); c.restore(); }
    const t = o.text ? o.text(z, i, j) : null;
    if (t) s.text(t, X0 + cw / 2, Y1 - ch / 2, { size, align: 'center', baseline: 'middle', color: 'ink' });
  }
}
/** Tiles for a real matrix: fill blue (+) / red (−) by value, entry text on top. */
export function tilesR(v, s, A, rect, o = {}) {
  const n = A.length, m = A[0].length, [x0, y0, x1, y1] = rect, cw = (x1 - x0) / m, ch = (y1 - y0) / n;
  const px = Math.min(Math.abs(cw * s.sx), Math.abs(ch * s.sy)), size = o.size ?? Math.max(8, Math.min(12.5, px * 0.2));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const X0 = x0 + j * cw, Y1 = y1 - i * ch, val = A[i][j], a = Math.min(1, Math.abs(val));
    s.rect(X0 + 0.04 * cw, Y1 - 0.96 * ch, X0 + 0.96 * cw, Y1 - 0.04 * ch, { fill: val >= 0 ? 'blue' : 'red', fillAlpha: 0.08 + 0.5 * a, color: 'grid', width: 0.8, radius: 3 });
    s.text(v.fix(Math.abs(val) < 5e-4 ? 0 : val, 3), X0 + cw / 2, Y1 - ch / 2, { size, align: 'center', baseline: 'middle', color: 'ink' });
  }
}
/** A small phasor dial: circle of radius R at (cx, cy) on an equal-aspect stage and the arrow to z·R. */
export function dial(v, s, cx, cy, R, z, o = {}) {
  const Q = v.quantum(), k = R / (o.scale ?? 1), col = o.color || Q.phaseColor(carg(z));
  s.circle(cx, cy, R, { color: 'faint', width: 1, fill: 'accent', fillAlpha: 0.04 });
  s.line(cx - R * 1.08, cy, cx + R * 1.08, cy, { color: 'faint', width: 0.8 });
  s.line(cx, cy - R * 1.08, cx, cy + R * 1.08, { color: 'faint', width: 0.8 });
  if (cabs(z) * k > 1e-3 * R) s.arrow(cx, cy, cx + z[0] * k, cy + z[1] * k, { color: col, width: o.width ?? 2.8, head: o.head ?? 9 });
  if (o.label) s.tex(o.label, cx, cy + R * 1.12, { size: o.labelSize ?? 14, align: 'center', baseline: 'bottom', color: o.labelColor || 'muted' });
}
/** Bloch-sphere frame on a v.scene3 scene: three great circles and the pole labels. Call between begin and flush. */
export function blochFrame(sc, o = {}) {
  const n = 72, circ = (f) => Array.from({ length: n + 1 }, (_, k) => f((TAU * k) / n));
  sc.path(circ((a) => [Math.cos(a), Math.sin(a), 0]), { color: 'faint', width: 1.1, alpha: 0.9 });
  sc.path(circ((a) => [Math.cos(a), 0, Math.sin(a)]), { color: 'faint', width: 1.1, alpha: 0.9 });
  sc.path(circ((a) => [0, Math.cos(a), Math.sin(a)]), { color: 'faint', width: 1.1, alpha: 0.9 });
  if (o.labels !== false) {
    const L = 1.28, lab = [['|0\\rangle', [0, 0, L]], ['|1\\rangle', [0, 0, -L]], ['|{+}\\rangle', [L, 0, 0]], ['|{-}\\rangle', [-L, 0, 0]], ['|{+i}\\rangle', [0, L, 0]], ['|{-i}\\rangle', [0, -L, 0]]];
    for (const [t, p] of lab) sc.tex(t, p, { color: 'muted', size: 12 });
  }
}
export function sphereOutline(s) { s.circle(0, 0, 1, { color: 'muted', width: 1.2, alpha: 0.6, fill: 'accent', fillAlpha: 0.04 }); }
/** A Stage + scene3 for a Bloch sphere. */
export function blochStage(v, o = {}) {
  const S = v.stage({ x: [-1.62, 1.62], y: [-1.5, 1.5], equal: true, axes: false, height: 340, ...o });
  const sc = v.scene3(S, { axes: false, yaw: o.yaw ?? -0.55, pitch: o.pitch ?? 0.3, lim: 1.5, hint: false });
  return { S, sc };
}
/** Labelled state arrow on the sphere. */
export function stateArrow(S, sc, p, label, color, o = {}) {
  sc.arrow([0, 0, 0], p, { color, width: o.width ?? 2.8, head: 10 });
  if (o.dot !== false) sc.dot(p, { color, r: o.r ?? 4.5 });
  if (label) { const q = sc.P(p.map((x) => x * (1.16 + (o.pad || 0)))); S.tex(label, q[0], q[1], { color, size: o.size ?? 14, align: 'center' }); }
}
/** A great-circle arc from p about the axis n by angle a, as a polyline. */
export function arcPts(p, n, a, k = 40) { return Array.from({ length: k + 1 }, (_, i) => rotate3(p, n, (a * i) / k)); }
/** Draggable point on the Bloch sphere: the handle is projected back onto the unit sphere. */
export function sphereHandle(sc, p0, o = {}) { return sc.handle(unit3(p0), { snap: (p) => unit3(p), r: 6.5, ...o }); }

/**
 * Grouped probability bars on a stage with data x in [0, nGroups*gw): groups = [{label, probs: [..], freq?: [..], names: [..], colors: [..]}].
 * Theory = pale bar with outline, measured = narrow solid bar.
 */
export function drawGroups(v, s, groups, o = {}) {
  const nb = Math.max(...groups.map((g) => g.probs.length)), gw = nb + 1, w = 0.78;
  groups.forEach((g, gi) => {
    const x0 = gi * gw;
    g.probs.forEach((p, k) => {
      const col = g.colors ? g.colors[k] : 'accent', xc = x0 + k + 0.5;
      s.rect(xc - w / 2, 0, xc + w / 2, p, { fill: col, fillAlpha: 0.22, color: col, width: 1.5 });
      if (g.freq) { s.rect(xc - w * 0.22, 0, xc + w * 0.22, g.freq[k], { fill: 'gold', fillAlpha: 0.85, color: 'gold', width: 1 }); }
      s.text(g.names ? g.names[k] : String(k), xc, 0, { size: 12, align: 'center', baseline: 'top', dy: 5, color: 'muted', math: true });
      const top = Math.max(p, g.freq ? g.freq[k] : 0);
      s.text(v.fix(p, 3).replace(/^0\./, '.').replace(/^1\.000$/, '1'), xc, top, { size: 11, align: 'center', baseline: 'bottom', dy: -3, color: 'ink' });
    });
    if (g.label) s.text(g.label, x0 + g.probs.length / 2, 1.0, { size: 11.5, align: 'center', baseline: 'bottom', dy: -2, color: g.labelColor || 'muted' });
  });
}
