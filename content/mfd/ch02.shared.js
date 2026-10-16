// Manifolds & Riemannian Geometry — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const wrap = (t) => ((t % TAU) + TAU) % TAU;
export const minus = (s) => String(s).replace(/-/g, '−');

// ---- 3-vectors
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const sc3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const nrm3 = (a) => { const r = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / r, a[1] / r, a[2] / r]; };

/** Point of the unit sphere from longitude and latitude, and the east / north unit vectors there. */
export const sph = (lon, lat) => [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
export const eastAt = (lon) => [-Math.sin(lon), Math.cos(lon), 0];
export const northAt = (lon, lat) => [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];

/** Stereographic charts of S²: N projects from the north pole, S from the south pole (as in chapter 1). */
export const stN = ([x, y, z]) => [x / (1 - z), y / (1 - z)];
export const stS = ([x, y, z]) => [x / (1 + z), y / (1 + z)];
export const stNinv = ([u, w]) => { const r2 = u * u + w * w; return [2 * u / (r2 + 1), 2 * w / (r2 + 1), (r2 - 1) / (r2 + 1)]; };
export const stSinv = ([u, w]) => { const r2 = u * u + w * w; return [2 * u / (r2 + 1), 2 * w / (r2 + 1), (1 - r2) / (r2 + 1)]; };

/** Smooth bump ingredient e^{-1/t}. */
export const gexp = (t) => (t > 0 ? Math.exp(-1 / t) : 0);

// ---- 2x2 matrices (rows) and numerical Jacobians
export const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const mul22 = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
export const mulv = (A, x) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
export const inv22 = (A) => { const d = det2(A); return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
/** Jacobian matrix of F: R² -> R² at (x, y) by central differences. */
export function jac(F, x, y, h = 1e-6) {
  const a = F(x + h, y), b = F(x - h, y), c = F(x, y + h), d = F(x, y - h);
  return [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
}
/** TeX for a 2x2 matrix with numbers to `d` decimals. */
export function pmat(A, d = 2) {
  const f = (x) => minus((Math.abs(x) < 5 * Math.pow(10, -d - 1) ? 0 : x).toFixed(d));
  return `\\begin{pmatrix}${f(A[0][0])}&${f(A[0][1])}\\\\${f(A[1][0])}&${f(A[1][1])}\\end{pmatrix}`;
}
export const pvec = (x, d = 2) => `\\begin{pmatrix}${minus(x[0].toFixed(d))}\\\\${minus(x[1].toFixed(d))}\\end{pmatrix}`;

/** Maps R² -> R² used to show differentials and the chain rule. `dom` is the box of the picture. */
export const MAPS = {
  swirl: { label: 'swirl', dom: [-2, 2], F: (x, y) => { const a = 1.1 * Math.exp(-(x * x + y * y) / 2.2); const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; } },
  sine: { label: 'sine wobble', dom: [-2, 2], F: (x, y) => [x + 0.4 * Math.sin(2 * y), y + 0.4 * Math.sin(2 * x)] },
  polar: { label: 'polar → plane', dom: [-2, 2], F: (x, y) => [(x + 2.2) * 0.6 * Math.cos(y * 0.9 + 0.8), (x + 2.2) * 0.6 * Math.sin(y * 0.9 + 0.8)] },
  square: { label: '$z\\mapsto z^2/2$', dom: [-2, 2], F: (x, y) => [(x * x - y * y) / 2, x * y] },
  fold: { label: 'fold $(x,y^2)$', dom: [-2, 2], F: (x, y) => [x, y * y - 1] },
};

/** Image of the coordinate grid [x0,x1]×[y0,y1] (nl lines each way) under F, drawn on stage s. */
export function gridImage(s, F, [x0, x1], [y0, y1], nl, o = {}) {
  const N = 64;
  for (let i = 0; i <= nl; i++) {
    const x = x0 + ((x1 - x0) * i) / nl, pts = [];
    for (let j = 0; j <= N; j++) pts.push(F(x, y0 + ((y1 - y0) * j) / N));
    s.path(pts, { color: o.cx || 'muted', width: o.width || 1, alpha: o.alpha ?? 0.55 });
  }
  for (let i = 0; i <= nl; i++) {
    const y = y0 + ((y1 - y0) * i) / nl, pts = [];
    for (let j = 0; j <= N; j++) pts.push(F(x0 + ((x1 - x0) * j) / N, y));
    s.path(pts, { color: o.cy || 'muted', width: o.width || 1, alpha: o.alpha ?? 0.55 });
  }
}
/** Square window (equal aspect) around the image of a box under F, padded by 8 percent. */
export function imageView(F, [x0, x1], [y0, y1]) {
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
    const q = F(x0 + ((x1 - x0) * i) / 24, y0 + ((y1 - y0) * j) / 24);
    if (!Number.isFinite(q[0]) || !Number.isFinite(q[1])) continue;
    a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]);
  }
  const m = Math.max(b - a, d - c) * 0.58 + 0.2, cx = (a + b) / 2, cy = (c + d) / 2;
  return { x: [cx - m, cx + m], y: [cy - m, cy + m] };
}
