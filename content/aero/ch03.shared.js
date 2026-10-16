// Aerospace Engineering — Chapter 3 (Wings and drag): helpers shared by ch03.js.
// Everything of chapters 1 and 2 (atmosphere, NACA sections, panel method, NACA 0012 data of Critzos et al. 1955) is re-exported.
export * from './ch02.shared.js';
import { DEG } from './ch02.shared.js';

// ── Glauert's Fourier solution of Prandtl's lifting-line equation ──────────────────────────────────────────────────────
// Span b = 1, y = -cos(theta)/2. Gamma = 2 b V sum A_n sin(n theta) (n odd), alpha_geo(theta) = sum A_n sin(n theta) [4 b/(a0 c) + n / sin(theta)].
// CL = pi AR A1, CDi = pi AR sum n A_n^2, e = A1^2 / sum n A_n^2.
/** chord(eta)/b of an unswept wing with taper ratio lam (tip/root chord), eta = 2y/b in [-1, 1]; lam = 'ellipse' gives the elliptic planform. */
export function chordOf(AR, lam) {
  if (lam === 'ellipse') return (eta) => (4 / (Math.PI * AR)) * Math.sqrt(Math.max(0, 1 - eta * eta));
  const cr = 2 / (AR * (1 + lam));
  return (eta) => cr * (1 - (1 - lam) * Math.abs(eta));
}
/**
 * Solve the lifting-line equation for a symmetric wing. opts: AR, lam (taper or 'ellipse'), a0 (section slope, 1/rad; default 2 pi),
 * alpha (rad, root incidence from the zero-lift line), twist (rad, added linearly to |eta|: negative = washout), N (odd harmonics).
 * Returns { A, CL, CDi, e, G(theta) = Gamma/(V b) }.
 */
export function glauert({ AR, lam = 1, a0 = 2 * Math.PI, alpha = 0.1, twist = 0, N = 14 }) {
  const c = chordOf(AR, lam), M = [], rhs = [];
  for (let i = 1; i <= N; i++) {
    const th = i * Math.PI / (2 * N + 0), eta = -Math.cos(th), ci = Math.max(c(eta), 1e-6), row = [];
    for (let k = 0; k < N; k++) { const n = 2 * k + 1; row.push(Math.sin(n * th) * (4 / (a0 * ci) + n / Math.sin(th))); }
    M.push(row); rhs.push(alpha + twist * Math.abs(eta));
  }
  const A = gauss(M, rhs);
  let s = 0; A.forEach((a, k) => { s += (2 * k + 1) * a * a; });
  const CL = Math.PI * AR * A[0], CDi = Math.PI * AR * s;
  return { A, CL, CDi, e: A[0] * A[0] / s, G: (th) => 2 * A.reduce((q, a, k) => q + a * Math.sin((2 * k + 1) * th), 0) };
}
/** Gaussian elimination with partial pivoting; A is n x n (array of rows), b a vector. */
export function gauss(A0, b0) {
  const n = b0.length, A = A0.map((r) => r.slice()), b = b0.slice();
  for (let k = 0; k < n; k++) {
    let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
    if (p !== k) { [A[p], A[k]] = [A[k], A[p]]; [b[p], b[k]] = [b[k], b[p]]; }
    const d = A[k][k] || 1e-300;
    for (let i = k + 1; i < n; i++) { const f = A[i][k] / d; if (!f) continue; for (let j = k; j < n; j++) A[i][j] -= f * A[k][j]; b[i] -= f * b[k]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / (A[i][i] || 1e-300); }
  return x;
}

// ── A vortex sheet of horseshoe panels (Gamma constant per panel, trailing vortices at the panel edges) ───────────────────
/** Panel edges (spanwise, b = 1) with cosine spacing: M panels from y = -1/2 to 1/2. */
export const cosEdges = (M) => Array.from({ length: M + 1 }, (_, k) => -Math.cos(Math.PI * k / M) / 2);
/**
 * Downwash (positive down, V = 1) at lateral positions ys, at the height of the wing, from the semi-infinite trailing vortices of panels with strengths Gam,
 * plus (if h > 0) the opposite-signed images of the same vortices a distance 2h below (ground plane); far = true gives the Trefftz-plane value (twice the
 * value at the wing). eps is a small core size.
 */
export function sheetDownwash(edges, Gam, ys, { h = 0, far = false, eps = 1e-4 } = {}) {
  const M = Gam.length, G = new Array(M + 1);
  for (let k = 0; k <= M; k++) G[k] = (k > 0 ? Gam[k - 1] : 0) - (k < M ? Gam[k] : 0);
  const f = (far ? 1 : 0.5) / (2 * Math.PI), out = new Float64Array(ys.length);
  for (let i = 0; i < ys.length; i++) {
    let w = 0;
    for (let k = 0; k <= M; k++) {
      const d = edges[k] - ys[i];
      w += G[k] * d / (d * d + eps * eps);
      if (h > 0) w -= G[k] * d / (d * d + 4 * h * h);
    }
    out[i] = f * w;
  }
  return out;
}
/**
 * Numerical lifting line (horseshoe sheet, Weissinger-style) for an untwisted rectangular or tapered wing of aspect ratio AR at a given geometric
 * incidence alpha (rad) with the ground plane a height h (in spans) below the wing; h = 0 means free air. Section slope a0 = 2 pi.
 * Returns { CL, CDi, Gam, edges, w, mid }.
 */
export function weissinger({ AR, lam = 1, alpha = 0.1, h = 0, a0 = 2 * Math.PI, M = 40 }) {
  const edges = cosEdges(M), mid = [], dy = [], c = chordOf(AR, lam), S = 1 / AR;
  for (let j = 0; j < M; j++) { mid.push((edges[j] + edges[j + 1]) / 2); dy.push(edges[j + 1] - edges[j]); }
  // w_i = sum_j K_ij Gam_j : build K by unit vectors
  const K = Array.from({ length: M }, () => new Array(M).fill(0));
  for (let j = 0; j < M; j++) {
    const g = new Array(M).fill(0); g[j] = 1;
    const w = sheetDownwash(edges, g, mid, { h });
    for (let i = 0; i < M; i++) K[i][j] = w[i];
  }
  const A = Array.from({ length: M }, (_, i) => { const ci = a0 * c(2 * mid[i]) / 2; return K[i].map((q, j) => ci * q + (i === j ? 1 : 0)); });
  const rhs = mid.map((y) => a0 * c(2 * y) / 2 * alpha);
  const Gam = gauss(A, rhs), w = sheetDownwash(edges, Gam, mid, { h });
  let L = 0, D = 0; for (let j = 0; j < M; j++) { L += Gam[j] * dy[j]; D += Gam[j] * w[j] * dy[j]; }
  return { CL: 2 * L / S, CDi: 2 * D / S, Gam, edges, w, mid };
}

// ── Vortex-lattice method (Falkner-type horseshoe lattice on a flat, swept, tapered wing) ─────────────────────────────
function segV(P, A, B, out) { // velocity at P of a unit vortex filament A -> B (Biot-Savart), added into out
  const r1x = P[0] - A[0], r1y = P[1] - A[1], r1z = P[2] - A[2], r2x = P[0] - B[0], r2y = P[1] - B[1], r2z = P[2] - B[2];
  const cx = r1y * r2z - r1z * r2y, cy = r1z * r2x - r1x * r2z, cz = r1x * r2y - r1y * r2x, c2 = cx * cx + cy * cy + cz * cz;
  const n1 = Math.hypot(r1x, r1y, r1z), n2 = Math.hypot(r2x, r2y, r2z);
  if (c2 < 1e-14 || n1 < 1e-7 || n2 < 1e-7) return;
  const r0x = B[0] - A[0], r0y = B[1] - A[1], r0z = B[2] - A[2];
  const dd = (r0x * (r1x / n1 - r2x / n2) + r0y * (r1y / n1 - r2y / n2) + r0z * (r1z / n1 - r2z / n2)) / (4 * Math.PI * c2);
  out[0] += cx * dd; out[1] += cy * dd; out[2] += cz * dd;
}
/**
 * Flat-plate vortex-lattice solution (b = 1). opts: AR, lam (taper), sweep (leading-edge sweep, deg), alpha (rad), twist (rad, linear in |eta|, added to alpha),
 * nx chordwise and ny spanwise panels (cosine spacing in span). Horseshoe vortices: bound segment on the panel quarter chord, control point at the
 * three-quarter chord, trailing legs straight back to x = infinity. Returns planform data, circulations, CL (Kutta-Joukowski on the bound segments),
 * CDi (Trefftz plane) and the spanwise loading.
 */
export function vlm({ AR, lam = 1, sweep = 0, alpha = 0.1, twist = 0, nx = 4, ny = 20 }) {
  const cr = 2 / (AR * (1 + lam)), tanL = Math.tan(sweep * DEG), S = 1 / AR;
  const chord = (y) => cr * (1 - (1 - lam) * Math.abs(2 * y)), xle = (y) => Math.abs(y) * tanL;
  const edges = cosEdges(ny), N = nx * ny, L = 1e4;
  const pan = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const ya = edges[j], yb = edges[j + 1], ym = (ya + yb) / 2;
    const q = (y, f) => [xle(y) + f * chord(y), y, 0];
    pan.push({ i, j, A: q(ya, (i + 0.25) / nx), B: q(yb, (i + 0.25) / nx), cp: q(ym, (i + 0.75) / nx), ym, dy: yb - ya,
      corners: [q(ya, i / nx), q(yb, i / nx), q(yb, (i + 1) / nx), q(ya, (i + 1) / nx)] });
  }
  const A = Array.from({ length: N }, () => new Array(N).fill(0)), out = [0, 0, 0];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const P = pan[c]; out[0] = out[1] = out[2] = 0;
    segV(pan[r].cp, [P.A[0] + L, P.A[1], 0], P.A, out); segV(pan[r].cp, P.A, P.B, out); segV(pan[r].cp, P.B, [P.B[0] + L, P.B[1], 0], out);
    A[r][c] = out[2];
  }
  const rhs = pan.map((p) => -(alpha + twist * Math.abs(2 * p.ym)));
  const Gam = gauss(A, rhs);
  const Gs = new Array(ny).fill(0); pan.forEach((p, k) => { Gs[p.j] += Gam[k]; });
  const mid = [], dy = []; for (let j = 0; j < ny; j++) { mid.push((edges[j] + edges[j + 1]) / 2); dy.push(edges[j + 1] - edges[j]); }
  let Lf = 0; Gs.forEach((g, j) => { Lf += g * dy[j]; });
  const wT = sheetDownwash(edges, Gs, mid, { far: true });
  let D = 0; Gs.forEach((g, j) => { D += 0.5 * g * wT[j] * dy[j]; });
  const CL = 2 * Lf / S, CDi = 2 * D / S;
  return { pan, Gam, Gs, mid, dy, edges, chord, xle, cr, CL, CDi, e: CL * CL / (Math.PI * AR * CDi), S };
}

// ── Loading of arbitrary shape: induced drag at fixed lift ─────────────────────────────────────────────────────────────
/**
 * For a symmetric spanwise circulation G(eta) >= 0, eta = 2y/b in [-1, 1], vanishing at the tips: Fourier coefficients a_n = A_n/A_1 (n odd, up to nmax),
 * the span-efficiency e = A1^2 / sum n A_n^2 (exact for any such loading, since the lift is proportional to A1), and an independent
 * evaluation by summing a horseshoe-sheet of Mp panels (D = sum Gamma w dy, L = sum Gamma dy, e = (2 L^2 / pi) / D for V = rho = b = 1).
 */
export function loadingAnalysis(G, nmax = 41, Mp = 160) {
  const K = 400, an = [];
  const th = (k) => (k + 0.5) * Math.PI / K, g = Array.from({ length: K }, (_, k) => G(-Math.cos(th(k))));
  for (let n = 1; n <= nmax; n += 2) { let s = 0; for (let k = 0; k < K; k++) s += g[k] * Math.sin(n * th(k)); an.push(2 * s / K); }
  const A1 = an[0] || 1e-12; let sum = 0; an.forEach((a, k) => { sum += (2 * k + 1) * a * a; });
  const eFour = A1 * A1 / sum;
  const edges = cosEdges(Mp), mid = [], dy = [], Gam = [];
  for (let j = 0; j < Mp; j++) { mid.push((edges[j] + edges[j + 1]) / 2); dy.push(edges[j + 1] - edges[j]); Gam.push(G(2 * mid[j])); }
  const w = sheetDownwash(edges, Gam, mid, { eps: 1e-9 });
  let L = 0, D = 0; for (let j = 0; j < Mp; j++) { L += Gam[j] * dy[j]; D += Gam[j] * w[j] * dy[j]; }
  return { an: an.map((a) => a / A1), A1, eFour, eSheet: (2 * L * L / Math.PI) / D, L };
}
