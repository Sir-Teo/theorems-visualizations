// Smooth manifolds — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const wrap = (t) => ((t % TAU) + TAU) % TAU; // angle into [0, 2π)
export const minus = (s) => String(s).replace('-', '−');

/** The classical smooth function g(t) = e^{-1/t} for t > 0, 0 otherwise. */
export const g = (t) => (t > 0 ? Math.exp(-1 / t) : 0);
/** Smooth step: 0 for t <= 0, 1 for t >= 1. */
export const step = (t) => { const a = g(t), b = g(1 - t); return a / (a + b || 1); };

/** Stereographic projections of the unit sphere S² from the north pole N=(0,0,1) and south pole S=(0,0,-1). */
export const stN = ([x, y, z]) => [x / (1 - z), y / (1 - z)];
export const stS = ([x, y, z]) => [x / (1 + z), y / (1 + z)];
export const stNinv = ([u, w]) => { const r2 = u * u + w * w; return [2 * u / (r2 + 1), 2 * w / (r2 + 1), (r2 - 1) / (r2 + 1)]; };
export const stSinv = ([u, w]) => { const r2 = u * u + w * w; return [2 * u / (r2 + 1), 2 * w / (r2 + 1), (1 - r2) / (r2 + 1)]; };

/** Torus of revolution with big radius R and tube radius r; (a, b) are the two angles. */
export const torusPt = (a, b, R = 1, r = 0.42) => [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)];

/** Central difference derivative. */
export const dfd = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

/** Polynomial q_n with f^{(n)}(x) = q_n(1/x) e^{-1/x} for f(x) = e^{-1/x} (x > 0); coefficients ascending in s = 1/x. */
export function bumpPolys(N) {
  const Q = [[1]];
  for (let n = 0; n < N; n++) {
    const q = Q[n], d = q.map((c, i) => c * i).slice(1); // q'
    const r = new Array(q.length + 2).fill(0); // s²(q − q')
    q.forEach((c, i) => { r[i + 2] += c; });
    d.forEach((c, i) => { r[i + 2] -= c; });
    Q.push(r);
  }
  return Q;
}
/** |f^{(n)}(x)| for f = e^{-1/x}, computed in logs so it never underflows spuriously. */
export function bumpDeriv(Q, n, x) {
  if (x <= 0) return 0;
  const s = 1 / x; let p = 0;
  for (let i = Q[n].length - 1; i >= 0; i--) p = p * s + Q[n][i];
  return p * Math.exp(-s);
}

/** Smallest singular value and singular vectors of a 2x2 matrix [[a,b],[c,d]]. */
export function svd22(a, b, c, d) {
  // A^T A eigen decomposition
  const p = a * a + c * c, q = a * b + c * d, r = b * b + d * d;
  const tr = p + r, det = p * r - q * q, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
  const th = 0.5 * Math.atan2(2 * q, p - r); // major axis angle
  const v1 = [Math.cos(th), Math.sin(th)], v2 = [-Math.sin(th), Math.cos(th)];
  const s1 = Math.sqrt(l1), s2 = Math.sqrt(l2);
  const mul = (v) => [a * v[0] + b * v[1], c * v[0] + d * v[1]];
  const u2raw = mul(v2), n2 = Math.hypot(...u2raw);
  const u2 = n2 > 1e-12 ? [u2raw[0] / n2, u2raw[1] / n2] : (() => { const u1 = mul(v1), n1 = Math.hypot(...u1) || 1; return [-u1[1] / n1, u1[0] / n1]; })();
  return { s1, s2, v1, v2, u2 };
}
