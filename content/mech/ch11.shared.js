// Classical Mechanics — Chapter 11: helpers shared by ch11.js and ch11-b.js

// ── numerics ──────────────────────────────────────────────────────────────────
export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** One classical RK4 step of y' = f(t, y) for an array state. */
export function rk4(f, t, y, h) {
  const n = y.length, k1 = f(t, y), y2 = new Array(n), y3 = new Array(n), y4 = new Array(n), out = new Array(n);
  for (let i = 0; i < n; i++) y2[i] = y[i] + (h / 2) * k1[i];
  const k2 = f(t + h / 2, y2); for (let i = 0; i < n; i++) y3[i] = y[i] + (h / 2) * k2[i];
  const k3 = f(t + h / 2, y3); for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
  const k4 = f(t + h, y4); for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}. stop(t, y) may end the run early. */
export function rk4rec(f, y0, T, n, every = 1, stop = null) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every, stopped: false };
  for (let k = 1; k <= n; k++) {
    y = rk4(f, (k - 1) * h, y, h);
    if (k % every === 0) { out.t.push(k * h); out.y.push(y); }
    if (stop && stop(k * h, y)) { out.stopped = true; if (k % every) { out.t.push(k * h); out.y.push(y); } break; }
  }
  return out;
}
/**
 * Velocity Verlet for the linear system M x'' = −K x (M, K symmetric; M given by its inverse Mi).
 * Records every `every` steps → {t, x: [[…]], v: [[…]], dt}.
 */
export function verletLin(Mi, K, x0, v0, dt, n, every = 1) {
  const N = x0.length, acc = (x) => { const f = K.map((r) => -r.reduce((s, k, j) => s + k * x[j], 0)); return Mi.map((r) => r.reduce((s, m, j) => s + m * f[j], 0)); };
  let x = x0.slice(), v = v0.slice(), a = acc(x);
  const out = { t: [0], x: [x.slice()], v: [v.slice()], dt: dt * every };
  for (let k = 1; k <= n; k++) {
    for (let i = 0; i < N; i++) x[i] += dt * v[i] + 0.5 * dt * dt * a[i];
    const a2 = acc(x);
    for (let i = 0; i < N; i++) v[i] += 0.5 * dt * (a[i] + a2[i]);
    a = a2;
    if (k % every === 0) { out.t.push(k * dt); out.x.push(x.slice()); out.v.push(v.slice()); }
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
/** Times at which a sampled signal crosses zero upward (linear interpolation). */
export function upCrossings(ts, xs) {
  const out = [];
  for (let i = 1; i < xs.length; i++) if (xs[i - 1] < 0 && xs[i] >= 0) out.push(ts[i - 1] + ((-xs[i - 1]) / (xs[i] - xs[i - 1])) * (ts[i] - ts[i - 1]));
  return out;
}
/** Mean spacing of a list of crossing times (NaN if fewer than two). */
export const meanGap = (c) => (c.length > 1 ? (c[c.length - 1] - c[0]) / (c.length - 1) : NaN);

// ── linear algebra: the generalized symmetric eigenproblem ────────────────────
export const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
export const dotv = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
/** xᵀ A y */
export const qf = (A, x, y = x) => dotv(x, mv(A, y));
/** Cholesky factor L (lower triangular, A = L Lᵀ) of a symmetric positive definite matrix; null if A is not positive definite. */
export function chol(A) {
  const n = A.length, L = A.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (!(s > 0)) return null; L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
  }
  return L;
}
/** Solve L y = b (L lower triangular). */
export function fwd(L, b) { const n = b.length, y = new Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; } return y; }
/** Solve Lᵀ x = y (L lower triangular). */
export function bwd(L, y) { const n = y.length, x = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; } return x; }
/**
 * Generalized eigenproblem K a = λ M a (K symmetric, M symmetric positive definite), by Cholesky M = L Lᵀ and the
 * symmetric eigenproblem of C = L⁻¹ K L⁻ᵀ (v.M.eigSym). → {w2: λ ascending, A: eigenvectors normalised so aᵢᵀ M aⱼ = δᵢⱼ,
 * largest component positive, L, C}.
 */
export function genEig(M, K, Mlib) {
  const n = K.length, L = chol(M);
  const Y = K.map((_, j) => fwd(L, K.map((r) => r[j]))); // Y[j] = L⁻¹ (column j of K)
  const C = Array.from({ length: n }, (_, j) => fwd(L, Y.map((r) => r[j]))); // C = L⁻¹ (L⁻¹ K)ᵀ, symmetric
  const E = Mlib.eigSym(C), ord = E.values.map((_, i) => i).reverse();
  const w2 = ord.map((i) => E.values[i]);
  const A = ord.map((i) => {
    const a = bwd(L, E.vecs[i]); let j = 0; for (let k = 1; k < n; k++) if (Math.abs(a[k]) > Math.abs(a[j]) + 1e-12) j = k;
    return a[j] < 0 ? a.map((x) => -x) : a;
  });
  return { w2, A, L, C, U: ord.map((i) => E.vecs[i]) };
}
/** Normal coordinates q = Aᵀ M x of a configuration x (A from genEig). */
export const toModes = (G, M, x) => G.A.map((a) => qf(M, a, x));
/** Configuration x = Σ q_k a_k from normal coordinates. */
export const fromModes = (G, q) => G.A[0].map((_, i) => G.A.reduce((s, a, k) => s + q[k] * a[i], 0));
/** Fixed-ends chain of n masses (masses ms) and n + 1 springs (ks): {M, K}. */
export function chainMK(ms, ks) {
  const n = ms.length, M = ms.map((m, i) => ms.map((_, j) => (i === j ? m : 0))), K = ms.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) { K[i][i] = ks[i] + ks[i + 1]; if (i + 1 < n) { K[i][i + 1] = -ks[i + 1]; K[i + 1][i] = -ks[i + 1]; } }
  return { M, K };
}

// ── drawing ───────────────────────────────────────────────────────────────────
/** Mode colours used across the chapter (mode 1, mode 2, …). */
export const MODE_COLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
/** Zig-zag spring polyline from (x0, y0) to (x1, y1): n coils of half-width w, straight leads (fraction `lead` of the length). */
export function springPts(x0, y0, x1, y1, n = 8, w = 0.06, lead = 0.12) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = lead * L;
  const pts = [[x0, y0], [x0 + ux * a, y0 + uy * a]];
  for (let i = 1; i < 2 * n; i++) { const s = a + ((L - 2 * a) * i) / (2 * n), o = (i % 2 ? 1 : -1) * w; pts.push([x0 + ux * s + nx * o, y0 + uy * s + ny * o]); }
  pts.push([x1 - ux * a, y1 - uy * a], [x1, y1]);
  return pts;
}
/** A spring drawn between two points; colour by tension sign when `ext` (extension) is given. */
export function spring(s, x0, y0, x1, y1, st = {}) {
  s.path(springPts(x0, y0, x1, y1, st.n ?? 8, st.w ?? 0.06, st.lead ?? 0.12), { color: st.color || 'muted', width: st.width ?? 1.6, alpha: st.alpha });
}
/** A wall: segment (x0,y0)–(x1,y1) with hatching on one side (side = ±1), drawn in pixels. */
export function hatch(v, s, x0, y0, x1, y1, side = 1, gap = 7, len = 7) {
  const c = s.ctx, X0 = s.X(x0), Y0 = s.Y(y0), X1 = s.X(x1), Y1 = s.Y(y1), L = Math.hypot(X1 - X0, Y1 - Y0);
  if (L < 1) return;
  const ux = (X1 - X0) / L, uy = (Y1 - Y0) / L, nx = -uy * side, ny = ux * side;
  c.save(); c.strokeStyle = v.color('muted', 0.75); c.lineWidth = 1.1; c.beginPath();
  for (let d = gap / 2; d < L; d += gap) { const px = X0 + ux * d, py = Y0 + uy * d; c.moveTo(px, py); c.lineTo(px + (nx - ux) * len * 0.7, py + (ny - uy) * len * 0.7); }
  c.stroke(); c.restore();
  s.line(x0, y0, x1, y1, { color: 'muted', width: 2 });
}
/** A cart (rounded box with two wheels) centred at (x, y) on a track at y − h/2. */
export function cart(s, x, y, w, h, color, label = null, st = {}) {
  s.rect(x - w / 2, y - h / 2 + h * 0.18, x + w / 2, y + h / 2, { radius: 5, fill: color, fillAlpha: st.fillAlpha ?? 0.28, color, width: st.width ?? 1.8, dash: st.dash, alpha: st.alpha });
  if (st.wheels !== false) for (const f of [-0.28, 0.28]) s.circle(x + f * w, y - h / 2 + h * 0.12, h * 0.12, { fill: 'ink', fillAlpha: st.alpha ?? 0.75, color: 'ink', width: 1, alpha: st.alpha });
  if (label) s.tex(label, x, y + h * 0.08, { color, size: st.size ?? 13 });
}
/** Polyline of (xs[k], ys[k]) for k ≤ upto. */
export function series(s, xs, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, xs.length - 1); k++) pts.push([xs[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
/** Ellipse {x : xᵀ A x = c} (A symmetric positive definite 2×2) as a closed point list, optionally mapped by the 2×2 matrix T. */
export function ellipsePts(A, c, T = null, n = 120) {
  const [[a, b], [, d]] = A, tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  if (!(l2 > 0) || !(c > 0)) return [];
  const th = Math.abs(b) > 1e-14 ? Math.atan2(l1 - a, b) : a >= d ? 0 : Math.PI / 2, r1 = Math.sqrt(c / l1), r2 = Math.sqrt(c / l2), ct = Math.cos(th), st = Math.sin(th);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = (TAU * i) / n, p = r1 * Math.cos(u), q = r2 * Math.sin(u), x = ct * p - st * q, y = st * p + ct * q;
    pts.push(T ? [T[0][0] * x + T[0][1] * y, T[1][0] * x + T[1][1] * y] : [x, y]);
  }
  return pts;
}
