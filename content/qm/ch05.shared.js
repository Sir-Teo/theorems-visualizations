// Quantum Mechanics — Chapter 5: helpers shared by ch05.js, ch05-b.js and ch05-c.js.
// Finite-dimensional quantum mechanics done honestly: complex numbers are pairs [re, im], vectors are arrays of
// pairs, matrices are arrays of rows of pairs. Hermitian matrices are diagonalized by a complex Jacobi method
// (exactly orthonormal eigenvectors, also for repeated eigenvalues). ħ = 1 throughout.
// Colours follow the quantum kit's phase wheel (0 blue, π/2 pink, π orange, −π/2 green), as in chapters 2–4.
export { TAU, grid, normalize, normSq, phaseLUT, drawPsi, drawReal, phaseWheel, fz, sub, FAMILY, moments, toMomentum, hermiteFns, deriv, ellipsePts } from './ch04.shared.js';

// ------------------------------------------------------------------ complex scalars
export const C = (re, im = 0) => [re, im];
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cconj = (a) => [a[0], -a[1]];
export const cscale = (a, k) => [a[0] * k, a[1] * k];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const cabs2 = (a) => a[0] * a[0] + a[1] * a[1];
export const carg = (a) => Math.atan2(a[1], a[0]);
export const cis = (t) => [Math.cos(t), Math.sin(t)];
export function cdiv(a, b) { const d = cabs2(b); return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }

// ------------------------------------------------------------------ vectors
/** ⟨a|b⟩ = Σ conj(a_i) b_i. */
export function ip(a, b) { let r = 0, i = 0; for (let k = 0; k < a.length; k++) { r += a[k][0] * b[k][0] + a[k][1] * b[k][1]; i += a[k][0] * b[k][1] - a[k][1] * b[k][0]; } return [r, i]; }
export const vnorm = (a) => Math.sqrt(a.reduce((s, z) => s + cabs2(z), 0));
export function vnormalize(a) { const n = vnorm(a) || 1; return a.map((z) => [z[0] / n, z[1] / n]); }
export const vscale = (a, c) => a.map((z) => cmul(c, z));
export const vadd = (a, b) => a.map((z, i) => cadd(z, b[i]));
export const vsub = (a, b) => a.map((z, i) => csub(z, b[i]));
/** Basis vector e_k of length n. */
export const basis = (n, k) => Array.from({ length: n }, (_, i) => [i === k ? 1 : 0, 0]);

// ------------------------------------------------------------------ matrices
export const mat = (n, m, f) => Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => { const z = f(i, j); return typeof z === 'number' ? [z, 0] : z; }));
export const eye = (n) => mat(n, n, (i, j) => (i === j ? 1 : 0));
export const zerosC = (n, m = n) => mat(n, m, () => 0);
/** Lift a real matrix (numbers) to a complex one. */
export const cplx = (A) => A.map((r) => r.map((x) => (typeof x === 'number' ? [x, 0] : x)));
export function mmul(A, B) {
  const n = A.length, m = B[0].length, K = B.length, R = zerosC(n, m);
  for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) { const a = A[i][k]; if (!a[0] && !a[1]) continue; const Bk = B[k], Ri = R[i]; for (let j = 0; j < m; j++) { Ri[j][0] += a[0] * Bk[j][0] - a[1] * Bk[j][1]; Ri[j][1] += a[0] * Bk[j][1] + a[1] * Bk[j][0]; } }
  return R;
}
export const mvec = (A, x) => A.map((row) => { let r = 0, i = 0; for (let k = 0; k < row.length; k++) { r += row[k][0] * x[k][0] - row[k][1] * x[k][1]; i += row[k][0] * x[k][1] + row[k][1] * x[k][0]; } return [r, i]; });
export const adj = (A) => A[0].map((_, j) => A.map((r) => [r[j][0], -r[j][1]]));
export const madd = (A, B) => A.map((r, i) => r.map((z, j) => cadd(z, B[i][j])));
export const msub = (A, B) => A.map((r, i) => r.map((z, j) => csub(z, B[i][j])));
export const mscale = (A, c) => A.map((r) => r.map((z) => (typeof c === 'number' ? cscale(z, c) : cmul(z, c))));
export const comm = (A, B) => msub(mmul(A, B), mmul(B, A));
export const trace = (A) => A.reduce((s, r, i) => cadd(s, r[i]), [0, 0]);
/** Frobenius norm. */
export const fnorm = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, z) => t + cabs2(z), 0), 0));
/** Largest entry modulus. */
export const maxAbs = (A) => A.reduce((s, r) => Math.max(s, ...r.map(cabs)), 0);
/** |a⟩⟨b|. */
export const outer = (a, b) => a.map((x) => b.map((y) => cmul(x, cconj(y))));
/** ⟨ψ|A|ψ⟩ (complex in general; real for Hermitian A). */
export const expect = (A, psi) => ip(psi, mvec(A, psi));
/** ⟨φ|A|ψ⟩. */
export const melem = (phi, A, psi) => ip(phi, mvec(A, psi));
export const herm = (A) => mscale(madd(A, adj(A)), 0.5);
export const isHermitian = (A, tol = 1e-12) => fnorm(msub(A, adj(A))) <= tol * Math.max(1, fnorm(A));
/** Columns of a matrix as vectors. */
export const cols = (A) => A[0].map((_, j) => A.map((r) => r[j]));
/** Matrix whose columns are the given vectors. */
export const fromCols = (vs) => vs[0].map((_, i) => vs.map((v) => v[i]));

/**
 * Eigen-decomposition of a Hermitian matrix by cyclic complex Jacobi rotations.
 * → {values (ascending), vectors (orthonormal columns as complex vectors), sweeps}. Repeated eigenvalues still get
 * an orthonormal set. The phase of each eigenvector is fixed: its largest component real and positive.
 */
export function heig(A0) {
  const n = A0.length, A = A0.map((r) => r.map((z) => [z[0], z[1]])), V = eye(n);
  for (let i = 0; i < n; i++) A[i][i][1] = 0;
  let sweeps = 0;
  const scale = Math.max(1e-300, fnorm(A));
  for (; sweeps < 60; sweeps++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += cabs2(A[p][q]);
    if (off < 1e-30 * scale * scale) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const r = cabs(A[p][q]); if (r < 1e-300) continue;
      const d = [A[p][q][0] / r, -A[p][q][1] / r]; // e^{−iφ}: makes the (p, q) entry real
      const th = 0.5 * Math.atan2(2 * r, A[q][q][0] - A[p][p][0]), c = Math.cos(th), s = Math.sin(th), dc = cconj(d);
      for (let k = 0; k < n; k++) { // columns: A ← A G,  g_p = c e_p − s d e_q,  g_q = s e_p + c d e_q
        const ap = A[k][p], aq = cmul(A[k][q], d);
        A[k][p] = [c * ap[0] - s * aq[0], c * ap[1] - s * aq[1]]; A[k][q] = [s * ap[0] + c * aq[0], s * ap[1] + c * aq[1]];
        const vp = V[k][p], vq = cmul(V[k][q], d);
        V[k][p] = [c * vp[0] - s * vq[0], c * vp[1] - s * vq[1]]; V[k][q] = [s * vp[0] + c * vq[0], s * vp[1] + c * vq[1]];
      }
      for (let k = 0; k < n; k++) { // rows: A ← G† A
        const ap = A[p][k], aq = cmul(dc, A[q][k]);
        A[p][k] = [c * ap[0] - s * aq[0], c * ap[1] - s * aq[1]]; A[q][k] = [s * ap[0] + c * aq[0], s * ap[1] + c * aq[1]];
      }
      A[p][q] = [0, 0]; A[q][p] = [0, 0]; A[p][p][1] = 0; A[q][q][1] = 0;
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[a][a][0] - A[b][b][0]);
  const vectors = idx.map((j) => {
    const v = V.map((r) => r[j]); let m = 0; for (let i = 1; i < n; i++) if (cabs(v[i]) > cabs(v[m]) + 1e-12) m = i;
    const ph = cscale(cconj(v[m]), 1 / (cabs(v[m]) || 1)); return v.map((z) => cmul(z, ph));
  });
  return { values: idx.map((j) => A[j][j][0]), vectors, sweeps };
}
/** f(H) = Σ f(λ) |v⟩⟨v| for Hermitian H; f returns a complex pair or a number. */
export function funcH(H, f, E = heig(H)) {
  const n = H.length, R = zerosC(n);
  E.values.forEach((l, k) => { const fl = f(l), z = typeof fl === 'number' ? [fl, 0] : fl, v = E.vectors[k]; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const w = cmul(z, cmul(v[i], cconj(v[j]))); R[i][j][0] += w[0]; R[i][j][1] += w[1]; } });
  return R;
}
/** U(t) = e^{−iHt} for Hermitian H (pass E = heig(H) to reuse the decomposition). */
export const propagator = (H, t, E) => funcH(H, (l) => cis(-l * t), E);
/** e^{A} for any complex matrix, through the real 2n×2n embedding [[Re, −Im], [Im, Re]] and M.expm. */
export function expmC(M, A) {
  const n = A.length, R = M.zeros(2 * n, 2 * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { R[i][j] = A[i][j][0]; R[i + n][j + n] = A[i][j][0]; R[i][j + n] = -A[i][j][1]; R[i + n][j] = A[i][j][1]; }
  const E = M.expm(R);
  return mat(n, n, (i, j) => [E[i][j], E[i + n][j]]);
}

// ------------------------------------------------------------------ random states and observables
/** Haar-random unit vector in ℂⁿ. */
export function randState(r, n) { return vnormalize(Array.from({ length: n }, () => [r.normal(), r.normal()])); }
/** Random Hermitian matrix (GUE-like) with entries of size ~ scale. */
export function randHerm(r, n, scale = 1) { const G = mat(n, n, () => [r.normal() * scale, r.normal() * scale]); return herm(G); }
/** Random unitary: the eigenvectors of a random Hermitian matrix. */
export function randUnitary(r, n) { return fromCols(heig(randHerm(r, n)).vectors); }

// ------------------------------------------------------------------ spin
export const SX = cplx([[0, 1], [1, 0]]);
export const SY = [[[0, 0], [0, -1]], [[0, 1], [0, 0]]];
export const SZ = cplx([[1, 0], [0, -1]]);
/** Spin-s matrices (ħ = 1) in the basis m = s, s − 1, …, −s: {Sx, Sy, Sz, Sp, Sm, dim}. */
export function spinOps(s) {
  const d = Math.round(2 * s + 1), m = (i) => s - i;
  const Sp = mat(d, d, (i, j) => (i === j - 1 ? Math.sqrt(s * (s + 1) - m(j) * (m(j) + 1)) : 0));
  const Sm = adj(Sp), Sz = mat(d, d, (i, j) => (i === j ? m(i) : 0));
  return { Sx: mscale(madd(Sp, Sm), 0.5), Sy: mscale(msub(Sp, Sm), [0, -0.5]), Sz, Sp, Sm, dim: d };
}
/** n·S for a unit vector n = [x, y, z]. */
export const spinAlong = (S, n) => madd(madd(mscale(S.Sx, n[0]), mscale(S.Sy, n[1])), mscale(S.Sz, n[2]));
/** Bloch vector of a qubit state [α, β]: ⟨σ⟩ / ⟨ψ|ψ⟩. */
export function blochOf(psi) { const [a, b] = psi, n = cabs2(a) + cabs2(b) || 1, w = cmul(cconj(a), b); return [(2 * w[0]) / n, (2 * w[1]) / n, (cabs2(a) - cabs2(b)) / n]; }
/** Qubit state cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ for a unit vector n. */
export function stateOf(n) { const z = Math.max(-1, Math.min(1, n[2] / (Math.hypot(...n) || 1))), th = Math.acos(z), ph = Math.atan2(n[1], n[0]); return [[Math.cos(th / 2), 0], cscale(cis(ph), Math.sin(th / 2))]; }
/** Spin-s coherent state pointing along n: e^{−iφSz} e^{−iθSy} |m = s⟩. */
export function spinCoherent(S, n) {
  const z = Math.max(-1, Math.min(1, n[2] / (Math.hypot(...n) || 1))), th = Math.acos(z), ph = Math.atan2(n[1], n[0]);
  const U = mmul(propagator(S.Sz, ph), propagator(S.Sy, th));
  return mvec(U, basis(S.dim, 0));
}
/** Rotation matrix about the unit axis n by angle a (Rodrigues), applied to a 3-vector p. */
export function rotate3(p, n, a) {
  const c = Math.cos(a), s = Math.sin(a), d = n[0] * p[0] + n[1] * p[1] + n[2] * p[2];
  const x = [n[1] * p[2] - n[2] * p[1], n[2] * p[0] - n[0] * p[2], n[0] * p[1] - n[1] * p[0]];
  return [0, 1, 2].map((i) => p[i] * c + x[i] * s + n[i] * d * (1 - c));
}

// ------------------------------------------------------------------ oscillator matrices (ħ = m = ω = 1)
/** Truncated x = (a + a†)/√2 on Fock states 0 … N−1 (real symmetric numbers). */
export function oscX(N) { const X = Array.from({ length: N }, () => new Array(N).fill(0)); for (let n = 1; n < N; n++) X[n - 1][n] = X[n][n - 1] = Math.sqrt(n / 2); return X; }
/** Truncated p = i(a† − a)/√2 as a complex matrix. */
export function oscP(N) { return mat(N, N, (i, j) => (i === j + 1 ? [0, Math.sqrt(i / 2)] : j === i + 1 ? [0, -Math.sqrt(j / 2)] : 0)); }

// ------------------------------------------------------------------ sampling
/** Index drawn from a discrete distribution (probabilities summing to ~1). */
export function sampleIdx(r, probs) { let u = r() * probs.reduce((a, b) => a + b, 0); for (let k = 0; k < probs.length; k++) { u -= probs[k]; if (u <= 0) return k; } return probs.length - 1; }

// ------------------------------------------------------------------ TeX
const num = (v, x, d) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d).replace('−', '-');
/** TeX for a complex number (drops a zero part). */
export function texC(v, z, d = 2) {
  const re = Math.abs(z[0]) < 0.5 * 10 ** -d ? 0 : z[0], im = Math.abs(z[1]) < 0.5 * 10 ** -d ? 0 : z[1];
  if (!im) return re ? num(v, re, d) : '0';
  const I = `${Math.abs(im - 1) < 1e-12 ? '' : Math.abs(im + 1) < 1e-12 ? '-' : num(v, im, d)}i`;
  if (!re) return I;
  return `${num(v, re, d)}${im < 0 ? '-' : '+'}${Math.abs(Math.abs(im) - 1) < 1e-12 ? '' : num(v, Math.abs(im), d)}i`;
}
/** TeX pmatrix of a complex matrix (or a column vector given as a list of pairs). */
export function texMat(v, A, d = 2) {
  const rows = Array.isArray(A[0][0]) ? A : A.map((z) => [z]);
  return `\\begin{pmatrix}${rows.map((r) => r.map((z) => texC(v, z, d)).join('&')).join('\\\\')}\\end{pmatrix}`;
}

// ------------------------------------------------------------------ drawing
/**
 * A complex matrix as a grid of tiles in the data rectangle rect = [x0, y0, x1, y1] of stage s: each entry is a disc
 * whose area is ∝ |a_ij| (relative to `max`) coloured by arg a_ij on the phase wheel; optional text per entry.
 * o: {max, text: (z, i, j) => string | null, hi: (i, j) => colour | null, tile, size, rowLabels, colLabels, alpha, minR}
 */
export function cells(v, s, A, rect, o = {}) {
  const Q = v.quantum(), n = A.length, m = A[0].length, [x0, y0, x1, y1] = rect, cw = (x1 - x0) / m, ch = (y1 - y0) / n;
  const max = o.max ?? Math.max(1e-12, maxAbs(A)), px = Math.min(Math.abs(cw * s.sx), Math.abs(ch * s.sy));
  const size = o.size ?? Math.max(8, Math.min(13, px * 0.26));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const X0 = x0 + j * cw, Y1 = y1 - i * ch, z = A[i][j], a = cabs(z), hi = o.hi ? o.hi(i, j) : null;
    s.rect(X0 + 0.04 * cw, Y1 - 0.96 * ch, X0 + 0.96 * cw, Y1 - 0.04 * ch, { fill: hi || o.tile || 'grid', fillAlpha: hi ? 0.22 : 0.16, color: hi || 'grid', width: hi ? 1.6 : 0.8, radius: 3 });
    const R = 0.46 * px * Math.sqrt(Math.min(1, a / max));
    if (R > (o.minR ?? 0.6)) {
      const c = s.ctx; c.save(); c.globalAlpha = o.alpha ?? 0.85; c.beginPath(); c.arc(s.X(X0 + cw / 2), s.Y(Y1 - ch / 2), R, 0, 2 * Math.PI); c.fillStyle = Q.phaseColor(carg(z)); c.fill(); c.restore();
    }
    const t = o.text ? o.text(z, i, j) : null;
    if (t) s.text(t, X0 + cw / 2, Y1 - ch / 2, { size, align: 'center', baseline: 'middle', color: 'ink' });
  }
  if (o.rowLabels) o.rowLabels.forEach((t, i) => t && s.text(t, x0, y1 - (i + 0.5) * ch, { size: 11, align: 'right', baseline: 'middle', color: 'muted', dx: -5 }));
  if (o.colLabels) o.colLabels.forEach((t, j) => t && s.text(t, x0 + (j + 0.5) * cw, y1, { size: 11, align: 'center', baseline: 'bottom', color: 'muted', dy: -4 }));
}
/** A small phasor dial: circle of radius R centred at (cx, cy) on an equal-aspect stage and the arrow to z·R/scale. */
export function dial(v, s, cx, cy, R, z, o = {}) {
  const Q = v.quantum(), k = R / (o.scale ?? 1), col = o.color || Q.phaseColor(carg(z));
  s.circle(cx, cy, R, { color: 'faint', width: 1, fill: o.fill || false, fillAlpha: 0.05 });
  s.line(cx - R * 1.08, cy, cx + R * 1.08, cy, { color: 'faint', width: 0.8 });
  s.line(cx, cy - R * 1.08, cx, cy + R * 1.08, { color: 'faint', width: 0.8 });
  if (cabs(z) * k > 1e-3 * R) s.arrow(cx, cy, cx + z[0] * k, cy + z[1] * k, { color: col, width: o.width ?? 2.6, head: o.head ?? 9 });
  if (o.label) s.text(o.label, cx, cy - R * 1.12, { size: o.labelSize ?? 12, align: 'center', baseline: 'top', color: o.labelColor || 'muted' });
}
/** Bloch-sphere frame on a v.scene3 scene: silhouette, the three great circles and the six poles. Call between begin and flush. */
export function blochFrame(sc, o = {}) {
  const TAUL = 2 * Math.PI, n = 72, circ = (f) => Array.from({ length: n + 1 }, (_, k) => f((TAUL * k) / n));
  sc.path(circ((a) => [Math.cos(a), Math.sin(a), 0]), { color: 'faint', width: 1.1, alpha: 0.9 });
  sc.path(circ((a) => [Math.cos(a), 0, Math.sin(a)]), { color: 'faint', width: 1.1, alpha: 0.9 });
  sc.path(circ((a) => [0, Math.cos(a), Math.sin(a)]), { color: 'faint', width: 1.1, alpha: 0.9 });
  if (o.labels !== false) {
    const L = 1.3, lab = o.poleLabels || [['|0\\rangle', [0, 0, L]], ['|1\\rangle', [0, 0, -L]], ['|{+}\\rangle', [L, 0, 0]], ['|{-}\\rangle', [-L, 0, 0]], ['|{+i}\\rangle', [0, L, 0]]];
    for (const [t, p] of lab) sc.tex(t, p, { color: 'muted', size: 12.5 });
  }
}
/** Projected outline circle of the unit sphere (for a scene3 with orthographic view). */
export function sphereOutline(s, sc, o = {}) { s.circle(0, 0, 1, { color: 'muted', width: 1.2, alpha: 0.6, fill: 'accent', fillAlpha: o.fillAlpha ?? 0.04 }); }
/** Stacked labelled bar chart helper: draw bars of probs at x = 0 … n−1 with labels. */
export function probBars(v, s, probs, o = {}) {
  const Q = v.quantum(), w = o.width ?? 0.62;
  probs.forEach((p, k) => {
    const x = (o.x ? o.x(k) : k), col = o.color ? (typeof o.color === 'function' ? o.color(k) : o.color) : Q.phaseColor(0);
    if (p > 1e-9) s.rect(x - w / 2, 0, x + w / 2, p, { fill: col, fillAlpha: o.alpha ?? 0.55, color: col, width: 1.2 });
  });
}
