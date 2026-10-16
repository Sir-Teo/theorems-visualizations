// Electromagnetism — Chapter 3: helpers shared by ch03.js … ch03-d.js (plain named exports).
// Re-exports the Chapter 2 helpers (point-charge potential and field, colours, quiver, heatPot, levels, spline …).
// Units as in Chapter 2: cm, nC, volts, V/cm. Line charges (2D pictures) are in nC/cm.
export * from './ch02.shared.js';
import { KV } from './ch02.shared.js';

/** Dense linear solve A x = b (Gaussian elimination, partial pivoting). A is an array of rows; neither argument is modified. */
export function solveLin(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-300;
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / d; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / (M[r][r] || 1e-300); }
  return x;
}

/** Successive over-relaxation for ∇²V = 0 on an N×M node grid (index j*N+i); cells with fixed[] set are Dirichlet. Row/column 0 and the last must be fixed. */
export function sor(V, fixed, N, M, omega = 1, sweeps = 1) {
  for (let s = 0; s < sweeps; s++) {
    for (let j = 1; j < M - 1; j++) for (let i = 1; i < N - 1; i++) {
      const k = j * N + i; if (fixed[k]) continue;
      V[k] += omega * (0.25 * (V[k - 1] + V[k + 1] + V[k - N] + V[k + N]) - V[k]);
    }
  }
}
/** Largest |average of neighbours − value| over free cells: the relaxation residual. */
export function resid(V, fixed, N, M) {
  let m = 0;
  for (let j = 1; j < M - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!fixed[k]) m = Math.max(m, Math.abs(0.25 * (V[k - 1] + V[k + 1] + V[k - N] + V[k + N]) - V[k])); }
  return m;
}
/** Bilinear sample of a node grid spanning [x0,x1]×[y0,y1]. */
export function samp(V, N, M, x0, x1, y0, y1, x, y) {
  let u = ((x - x0) / (x1 - x0)) * (N - 1), w = ((y - y0) / (y1 - y0)) * (M - 1);
  u = Math.min(N - 1.0001, Math.max(0, u)); w = Math.min(M - 1.0001, Math.max(0, w));
  const i = Math.floor(u), j = Math.floor(w), a = u - i, b = w - j, k = j * N + i;
  return V[k] * (1 - a) * (1 - b) + V[k + 1] * a * (1 - b) + V[k + N] * (1 - a) * b + V[k + N + 1] * a * b;
}
/** Legendre polynomials P_0..P_L at x. */
export function legendre(L, x) {
  const P = [1, x];
  for (let l = 1; l < L; l++) P.push(((2 * l + 1) * x * P[l] - l * P[l - 1]) / (l + 1));
  return P.slice(0, L + 1);
}
/** Trace a field line of F(x,y)→[u,v] from (x,y) in steps of length h, both directions if both; stops outside box [x0,x1]×[y0,y1] or when stop(x,y) is true. */
export function streamline(F, x, y, box, st = {}) {
  const h = st.h || 0.06, n = st.n || 600, dir = st.dir ?? 1, stop = st.stop || (() => false), pts = [[x, y]];
  let px = x, py = y;
  const dirAt = (a, b) => { const f = F(a, b), m = Math.hypot(f[0], f[1]); return m > 0 && isFinite(m) ? [dir * f[0] / m, dir * f[1] / m] : null; };
  for (let k = 0; k < n; k++) {
    const d1 = dirAt(px, py); if (!d1) break;
    const d2 = dirAt(px + 0.5 * h * d1[0], py + 0.5 * h * d1[1]); if (!d2) break;
    px += h * d2[0]; py += h * d2[1];
    if (px < box[0] || px > box[1] || py < box[2] || py > box[3] || stop(px, py)) { pts.push([px, py]); break; }
    pts.push([px, py]);
  }
  return pts;
}
/** Potential (V) of infinite line charges src = [{x,y,q}] (q in nC/cm) at (x,y): V = −2 k λ ln r (zero at r = 1 cm). */
export function potL(src, x, y) { let p = 0; for (const s of src) if (s.q) p -= s.q * Math.log(Math.hypot(x - s.x, y - s.y) + 1e-9); return 2 * KV * p; }
/** Field (V/cm) of infinite line charges in the plane. */
export function fldL(src, x, y) {
  let u = 0, w = 0;
  for (const s of src) { if (!s.q) continue; const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy + 1e-12; u += s.q * dx / r2; w += s.q * dy / r2; }
  return [2 * KV * u, 2 * KV * w];
}
/** Draw a set of field lines of F starting at the seeds, with a small arrowhead mid-way. */
export function drawLines(s, F, seeds, box, st = {}) {
  for (const [x, y] of seeds) for (const dir of st.both ? [1, -1] : [st.dir ?? 1]) {
    const pts = streamline(F, x, y, box, { ...st, dir });
    if (pts.length < 3) continue;
    s.path(pts, { color: st.color || 'accent', width: st.width || 1.3, alpha: st.alpha ?? 0.8 });
    const m = pts[Math.floor(pts.length * 0.45)], m2 = pts[Math.floor(pts.length * 0.45) + 1];
    if (m2 && st.arrows !== false) s.arrow(m[0], m[1], m2[0], m2[1], { color: st.color || 'accent', head: 7, width: 1.3 });
  }
}
/** Staircase-aware tiny helper: points of a circle of radius r about (cx, cy). */
export function circ(cx, cy, r, n = 90) { const o = []; for (let k = 0; k <= n; k++) { const a = (2 * Math.PI * k) / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
