// Vector Calculus — Chapter 3: helpers shared by ch03.js and ch03-b.js
export * from './ch02.shared.js';
import { hills } from './ch02.shared.js';

// ---------- derivatives of planar fields F(x, y) = [u, v] (4th-order central stencils) ----------
const D = (g, t, h) => (-g(t + 2 * h) + 8 * g(t + h) - 8 * g(t - h) + g(t - 2 * h)) / (12 * h);
/** Divergence u_x + v_y of a planar field at (x, y). */
export const div2 = (F, x, y, h = 0.01) => D((s) => F(s, y)[0], x, h) + D((s) => F(x, s)[1], y, h);
/** Scalar curl v_x - u_y (the z-component of the curl) of a planar field at (x, y). */
export const curl2 = (F, x, y, h = 0.01) => D((s) => F(s, y)[1], x, h) - D((s) => F(x, s)[0], y, h);
/** Laplacian of a scalar function at (x, y) by the 4th-order 5-point-cross stencil. */
export function lap2(f, x, y, h = 0.02) {
  const d2 = (g, t) => (-g(t + 2 * h) + 16 * g(t + h) - 30 * g(t) + 16 * g(t - h) - g(t - 2 * h)) / (12 * h * h);
  return d2((s) => f(s, y), x) + d2((s) => f(x, s), y);
}

// ---------- flow ----------
/** One RK4 step of x' = F(x) for a planar field. */
export function rk4(F, p, dt) {
  const k1 = F(p[0], p[1]), k2 = F(p[0] + 0.5 * dt * k1[0], p[1] + 0.5 * dt * k1[1]);
  const k3 = F(p[0] + 0.5 * dt * k2[0], p[1] + 0.5 * dt * k2[1]), k4 = F(p[0] + dt * k3[0], p[1] + dt * k3[1]);
  return [p[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
}
/** Flow line from p0: n RK4 steps of size dt (forward if dt > 0), stopping when it leaves |x|,|y| <= box or stalls. */
export function flowLine(F, p0, dt, n, box = 3) {
  const P = [p0.slice()];
  let p = p0;
  for (let i = 0; i < n; i++) {
    const q = rk4(F, p, dt);
    if (!isFinite(q[0] + q[1]) || Math.abs(q[0]) > box || Math.abs(q[1]) > box) break;
    P.push(q); p = q;
  }
  return P;
}
/** Polyline of a closed curve sampled as pts, area by the shoelace formula. */
export const shoelace = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; };

// ---------- a library of planar fields (world coordinates, window |x|,|y| <= 1.3) ----------
const sg = (x) => (Math.abs(x) < 1e-9 ? 1e-9 : x);
export const FIELDS = {
  source: { label: 'source', tex: '(x,\\ y)', F: (x, y) => [x, y] },
  sink: { label: 'sink', tex: '(-x,\\ -y)', F: (x, y) => [-x, -y] },
  rot: { label: 'rotation', tex: '(-y,\\ x)', F: (x, y) => [-y, x] },
  saddle: { label: 'saddle flow', tex: '(x,\\ -y)', F: (x, y) => [x, -y] },
  shear: { label: 'shear', tex: '(y,\\ 0)', F: (x, y) => [y, 0] },
  vortex: { label: 'point vortex', tex: '\\dfrac{(-y,\\ x)}{x^2+y^2}', F: (x, y) => { const r2 = sg(x * x + y * y); return [-y / r2, x / r2]; } },
  waves: { label: 'waves', tex: '(\\sin 2x,\\ \\cos 2y)', F: (x, y) => [Math.sin(2 * x), Math.cos(2 * y)] },
  eddies: { label: 'eddies', tex: '(\\sin 2y,\\ \\cos 2x)', F: (x, y) => [Math.sin(2 * y), Math.cos(2 * x)] },
  mix: { label: 'mixed', tex: '(\\sin 2x+0.7\\sin 2y,\\ 0.7\\cos 2x+\\cos 2y)', F: (x, y) => [Math.sin(2 * x) + 0.7 * Math.sin(2 * y), 0.7 * Math.cos(2 * x) + Math.cos(2 * y)] },
  grad: { label: 'gradient of hills', tex: '\\nabla h', F: (x, y) => { const e = 1e-5; return [(hills(x + e, y) - hills(x - e, y)) / (2 * e), (hills(x, y + e) - hills(x, y - e)) / (2 * e)]; } },
};

// ---------- drawing ----------
/**
 * Arrow grid in data units: n x m arrows, each with its tail on the lattice point; length proportional to |F| up to cap
 * (data units), or all of length cap when unit is true.
 */
export function arrowGrid(s, F, [x0, x1], [y0, y1], nx, ny, st = {}) {
  const cap = st.cap ?? (0.8 * Math.min((x1 - x0) / nx, (y1 - y0) / ny)), k = st.scale ?? 1;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = x0 + ((i + 0.5) * (x1 - x0)) / nx, y = y0 + ((j + 0.5) * (y1 - y0)) / ny, f = F(x, y), L = Math.hypot(f[0], f[1]);
    if (!isFinite(L) || L < 1e-9) continue;
    const len = st.unit ? cap : Math.min(cap, k * L), c = st.center ? 0.5 : 0;
    const ux = (f[0] / L) * len, uy = (f[1] / L) * len;
    s.arrow(x - c * ux, y - c * uy, x + (1 - c) * ux, y + (1 - c) * uy, { color: st.colorFn ? st.colorFn(x, y, f) : st.color || 'muted', width: st.width ?? 1.2, alpha: st.alpha ?? 0.8, head: st.head ?? 5 });
  }
}
/** Gaussian bumps: Σ a_k exp(-|p - c_k|^2 / w_k) and its exact gradient. */
export function bumpSum(B) {
  const f = (x, y) => { let s = 0; for (const b of B) s += b.a * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / b.w); return s; };
  const g = (x, y) => { let u = 0, w = 0; for (const b of B) { const e = b.a * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / b.w); u += (-2 * (x - b.x) / b.w) * e; w += (-2 * (y - b.y) / b.w) * e; } return [u, w]; };
  return { f, g };
}
/** Gauss-Legendre nodes and weights on [-1, 1] (n = 8). */
export const GL8 = (() => {
  const x = [0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
  const w = [0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  return { x: [...x.map((t) => -t).reverse(), ...x], w: [...w.slice().reverse(), ...w] };
})();
