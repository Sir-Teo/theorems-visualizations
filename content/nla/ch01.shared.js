// Numerical Linear Algebra — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// Small dense linear algebra on lists of rows, a 2×2 "edit the matrix by dragging its columns" widget,
// ellipse/unit-ball drawing, number formatting, and the greyscale test images used by the compression items.

export const TAU = 2 * Math.PI;

// ---------- number formatting ----------
/** Number for TeX: d decimals, trailing zeros trimmed, never "-0". */
export function nm(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const t = Number(x.toFixed(d));
  return t === 0 ? '0' : String(t);
}
/** Same with a typographic minus, for canvas text. */
export const nmc = (x, d = 2) => nm(x, d).replace('-', '−');
export const matT = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => nm(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
export const vecT = (u, d = 2) => `\\begin{pmatrix}${u.map((x) => nm(x, d)).join(' \\\\ ')}\\end{pmatrix}`;
/** Scientific notation as TeX; "0" when below the floor (rounding noise). */
export function sciT(x) {
  if (!isFinite(x)) return '\\infty';
  if (Math.abs(x) < 1e-300) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  return `${m.toFixed(1)}\\times10^{${e}}`;
}

// ---------- vectors and matrices (lists of rows) ----------
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const scl = (a, k) => a.map((x) => x * k);
export const len = (a) => Math.hypot(...a);
export const unit = (a) => scl(a, 1 / (len(a) || 1));
export const mv = (A, x) => A.map((r) => dot(r, x));
export const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
export const tp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
export const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
export const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
export const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
export const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
export const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
export const col = (A, j) => A.map((r) => r[j]);
export const rot = (t) => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
export const perp = (u) => [-u[1], u[0]];
export const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
/** Induced norms of a matrix: 1 (max column sum), ∞ (max row sum). */
export const norm1 = (A) => Math.max(...A[0].map((_, j) => A.reduce((s, r) => s + Math.abs(r[j]), 0)));
export const normInf = (A) => Math.max(...A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)));
/** A matrix of rank at most k from the first k triplets of a thin SVD {U, S, V}. */
export function truncate(svd, k) {
  const m = svd.U.length, n = svd.V.length;
  const B = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let t = 0; t < k; t++) {
    const s = svd.S[t];
    for (let i = 0; i < m; i++) { const a = svd.U[i][t] * s; if (a) for (let j = 0; j < n; j++) B[i][j] += a * svd.V[j][t]; }
  }
  return B;
}
/** Haar-ish random orthogonal matrix (QR of a Gaussian matrix, signs fixed). */
export function randOrth(M, r, n) {
  const G = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()));
  const { Q, R } = M.qr(G);
  return Q.map((row) => row.map((x, j) => x * (R[j][j] < 0 ? -1 : 1)));
}
/** Random n×k matrix with orthonormal columns. */
export function randFrame(M, r, n, k) {
  const Q = randOrth(M, r, n);
  return Q.map((row) => row.slice(0, k));
}

// ---------- 2×2 geometry ----------
/** Eigen-data of the symmetric matrix [[a, b], [b, d]]: eigenvalues l[0] ≥ l[1], unit eigenvector u for l[0]. */
function sym2(a, b, d) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), t = 0.5 * Math.atan2(2 * b, a - d);
  return { l: [m + r, m - r], u: [Math.cos(t), Math.sin(t)] };
}
/** SVD of a real 2×2 matrix: A = s₁ f₁ e₁ᵀ + s₂ f₂ e₂ᵀ with e₂ = perp(e₁) (so (e₁,e₂) is a rotated frame); f₂ = ±perp(f₁) when s₂ = 0. */
export function svd22(A) {
  const [[a, b], [c, d]] = A, det = a * d - b * c;
  const E = sym2(a * a + c * c, a * b + c * d, b * b + d * d);
  const s1 = Math.sqrt(Math.max(0, E.l[0])), s2 = s1 > 1e-12 ? Math.abs(det) / s1 : 0;
  const e1 = E.u, e2 = perp(e1);
  const f1 = s1 > 1e-12 ? unit(mv(A, e1)) : [1, 0];
  const f2 = s2 > 1e-9 * Math.max(1, s1) ? unit(mv(A, e2)) : perp(f1);
  return { s: [s1, s2], e: [e1, e2], f: [f1, f2], det };
}
/** Image of the circle of radius r under a 2×2 matrix, as a closed polyline. */
export const ellPts = (A, r = 1, n = 160) => Array.from({ length: n + 1 }, (_, k) => mv(A, [r * Math.cos((TAU * k) / n), r * Math.sin((TAU * k) / n)]));
/** The ℓ^p unit sphere {|x|^p + |y|^p = 1} as a closed polyline (any p > 0, p = Infinity allowed). */
export function spherePts(p, n = 241) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = (TAU * k) / n, c = Math.cos(t), s = Math.sin(t);
    const nr = p === Infinity ? Math.max(Math.abs(c), Math.abs(s)) : (Math.abs(c) ** p + Math.abs(s) ** p) ** (1 / p);
    pts.push([c / nr, s / nr]);
  }
  return pts;
}
/** ℓ^p norm of a vector (p = Infinity allowed; p < 1 gives the quasi-norm). */
export function pnorm(x, p) {
  if (p === Infinity) return Math.max(...x.map(Math.abs));
  if (p === 1) return x.reduce((s, t) => s + Math.abs(t), 0);
  if (p === 2) return Math.hypot(...x);
  return x.reduce((s, t) => s + Math.abs(t) ** p, 0) ** (1 / p);
}

/** Draggable images of e₁ and e₂ — the columns of a 2×2 matrix — snapped to a grid. */
export function colHandles(S, A0, o = {}) {
  const g = o.grid ?? 0.1;
  const snap = (x, y) => [Math.round(x / g) * g, Math.round(y / g) * g];
  const h1 = S.handle(A0[0][0], A0[1][0], { color: o.c1 ?? 'teal', label: o.l1 ?? 'a₁', constrain: o.k1 ?? snap });
  const h2 = S.handle(A0[0][1], A0[1][1], { color: o.c2 ?? 'pink', label: o.l2 ?? 'a₂', constrain: o.k2 ?? snap });
  return { h1, h2, get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
}

/** A matrix drawn as a tile of shaded cells (blue > 0, red < 0) with its entries; (x0, y0) is the bottom-left corner. */
export function drawTile(S, B, x0, y0, w, h = w, { frame = 'muted', d = 2, fillAt = null } = {}) {
  const m = B.length, n = B[0].length, cw = w / n, ch = h / m, mx = Math.max(1e-9, maxAbs(B));
  const size = Math.max(8, Math.min(14, Math.abs(S.X(Math.min(cw, ch)) - S.X(0)) * 0.27));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const b = Math.abs(B[i][j]) < 1e-9 ? 0 : B[i][j], x = x0 + j * cw, y = y0 + h - (i + 1) * ch;
    if (b) S.rect(x, y, x + cw, y + ch, { fill: b > 0 ? 'blue' : 'red', fillAlpha: 0.07 + (0.3 * Math.abs(b)) / mx, stroke: false });
    S.text(nmc(b, d), x + cw / 2, y + ch / 2, { size, align: 'center', baseline: 'middle', color: b ? 'ink' : 'faint' });
  }
  S.rect(x0, y0, x0 + w, y0 + h, { color: frame, width: frame === 'muted' ? 1.1 : 2.4 });
}

// ---------- greyscale test images (built in code) ----------
export const IMG_N = 64;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/**
 * A 64×64 greyscale picture (values in [0, 1], rows top to bottom). kind: 'scene' (sky, sun, hills, a house, a tree),
 * 'stripes' (diagonal stripes plus a ring: a slowly decaying spectrum), 'noise' (i.i.d. noise: a flat spectrum).
 */
export function makeImage(M, kind) {
  const N = IMG_N, I = Array.from({ length: N }, () => new Array(N).fill(0));
  if (kind === 'noise') {
    const r = M.rng(11);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) I[i][j] = r();
    return I;
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = j / (N - 1), y = i / (N - 1); // y downward
    let g;
    if (kind === 'stripes') {
      g = 0.5 + 0.35 * Math.sin(2 * Math.PI * 5 * (x + 0.6 * y));
      const rr = Math.hypot(x - 0.62, y - 0.4);
      g = g * (1 - 0.8 * smoothstep(0.3, 0.27, rr) * smoothstep(0.17, 0.2, rr)) + 0.8 * smoothstep(0.3, 0.27, rr) * smoothstep(0.17, 0.2, rr);
      I[i][j] = clamp01(g);
      continue;
    }
    // scene: sky gradient
    g = 0.78 - 0.32 * y;
    // sun
    const sd = Math.hypot(x - 0.78, y - 0.2);
    g += 0.2 * smoothstep(0.14, 0.07, sd);
    // far hills and near hills
    const h1 = 0.55 + 0.07 * Math.sin(2 * Math.PI * (1.3 * x + 0.1)) + 0.03 * Math.sin(2 * Math.PI * 4 * x);
    const h2 = 0.72 + 0.05 * Math.sin(2 * Math.PI * (0.9 * x + 0.55));
    if (y > h1) g = 0.42 + 0.1 * Math.sin(2 * Math.PI * 9 * x) * 0.3;
    if (y > h2) g = 0.25 + 0.06 * Math.sin(2 * Math.PI * 14 * x + 6 * y);
    // house: box + roof + door + window
    if (x > 0.14 && x < 0.44 && y > 0.5 && y < 0.72) g = 0.9;
    if (y > 0.36 + (0.5 - 0.36) * Math.abs((x - 0.29) / 0.19) && y < 0.5 && Math.abs(x - 0.29) < 0.19) g = 0.12;
    if (x > 0.26 && x < 0.32 && y > 0.6 && y < 0.72) g = 0.18;
    if (x > 0.18 && x < 0.23 && y > 0.54 && y < 0.6) g = 0.35;
    // tree: trunk and round crown
    if (x > 0.645 && x < 0.675 && y > 0.58 && y < 0.78) g = 0.15;
    if (Math.hypot(x - 0.66, y - 0.5) < 0.12) g = 0.2 + 0.1 * Math.sin(2 * Math.PI * 12 * (x + y));
    I[i][j] = clamp01(g);
  }
  return I;
}
/** Bilinear lookup in an image (matrix of rows) at fractional pixel coordinates; used for crisp-edged nearest sampling in rasters. */
export const pixelAt = (I, u, v) => {
  const n = I.length, m = I[0].length;
  const i = Math.max(0, Math.min(n - 1, Math.floor(v * n))), j = Math.max(0, Math.min(m - 1, Math.floor(u * m)));
  return I[i][j];
};
/** Grey value in [0,1] as an [r, g, b] triple. */
export const grey = (g) => { const t = Math.round(255 * clamp01(g)); return [t, t, t]; };

/** Points of a small arc at the origin from direction u to direction w (the short way), radius r. */
export function arcPts(u, w, r) {
  const a0 = Math.atan2(u[1], u[0]);
  let d = Math.atan2(w[1], w[0]) - a0;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return Array.from({ length: 21 }, (_, k) => [r * Math.cos(a0 + (d * k) / 20), r * Math.sin(a0 + (d * k) / 20)]);
}
/** Angle in degrees between two plane vectors. */
export const angDeg = (u, w) => (Math.acos(Math.max(-1, Math.min(1, dot(u, w) / (len(u) * len(w) || 1)))) * 180) / Math.PI;
