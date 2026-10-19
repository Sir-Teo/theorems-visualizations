// Fluid Dynamics — Chapter 4 shared helpers (plain named exports): complex arithmetic and a formula parser, flow elements,
// an evenly spaced streamline tracer, Joukowski bodies with force integrals, and Theodorsen's conformal map.
export * from './ch03.shared.js';
import { TAU } from './ch03.shared.js';

// ------------------------------------------------------------------ complex numbers as [re, im]
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cconj = (a) => [a[0], -a[1]];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const carg = (a) => Math.atan2(a[1], a[0]);
export const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
export const clog = (a) => [Math.log(cabs(a)), carg(a)];
export const cpolar = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
export const csqrt = (a) => { const r = Math.sqrt(cabs(a)), t = carg(a) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
export const cpow = (a, p) => { if (a[0] === 0 && a[1] === 0) return [0, 0]; const l = clog(a); return cexp([l[0] * p[0] - l[1] * p[1], l[0] * p[1] + l[1] * p[0]]); };
export const csin = (a) => [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])];
export const ccos = (a) => [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])];
export const csinh = (a) => [Math.sinh(a[0]) * Math.cos(a[1]), Math.cosh(a[0]) * Math.sin(a[1])];
export const ccosh = (a) => [Math.cosh(a[0]) * Math.cos(a[1]), Math.sinh(a[0]) * Math.sin(a[1])];
const CF = { exp: cexp, log: clog, ln: clog, sqrt: csqrt, sin: csin, cos: ccos, sinh: csinh, cosh: ccosh,
  tan: (a) => cdiv(csin(a), ccos(a)), tanh: (a) => cdiv(csinh(a), ccosh(a)), conj: cconj };

/** Compile a formula in z (complex arithmetic: + - * / ^, i, pi, e, exp log sqrt sin cos tan sinh cosh tanh) → {f: z=[re,im] ↦ [re,im], error}. */
export function compileComplex(src) {
  const s = String(src ?? '').replace(/\*\*/g, '^').replace(/[−–]/g, '-').replace(/·|×/g, '*'); let i = 0;
  const err = (m) => { throw new Error(`${m} at position ${i + 1}`); };
  const peek = () => { while (i < s.length && /\s/.test(s[i])) i++; return s[i]; };
  const startsAtom = () => { const c = peek(); return c != null && /[0-9.(a-zA-Zπ]/.test(c); };
  const atom = () => {
    const c = peek();
    if (c === '(') { i++; const e = expr(); if (peek() !== ')') err('missing )'); i++; return e; }
    if (c != null && /[0-9.]/.test(c)) { const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) err('bad number'); i += m[0].length; const v = [+m[0], 0]; return () => v; }
    const m = /^([a-zA-Zπ][a-zA-Z0-9_]*)/.exec(s.slice(i)); if (!m) err(c == null ? 'unexpected end' : `unexpected "${c}"`);
    let name = m[1];
    if (!(name in CF) && !['z', 'i', 'pi', 'π', 'e'].includes(name)) {
      const pre = ['z', 'i', 'pi', 'e', ...Object.keys(CF)].filter((v) => name.startsWith(v)).sort((a, b) => b.length - a.length)[0];
      if (!pre) err(`unknown name "${name}"`); name = pre;
    }
    i += name.length;
    if (name in CF) {
      const fn = CF[name];
      if (peek() === '(') { i++; const a = expr(); if (peek() !== ')') err('missing )'); i++; return (z) => fn(a(z)); }
      const a = power(); return (z) => fn(a(z));
    }
    if (name === 'z') return (z) => z;
    if (name === 'i') return () => [0, 1];
    if (name === 'e') return () => [Math.E, 0];
    return () => [Math.PI, 0];
  };
  const power = () => { const b = atom(); if (peek() === '^') { i++; const ex = unary(); return (z) => cpow(b(z), ex(z)); } return b; };
  const unary = () => { const c = peek(); if (c === '-') { i++; const a = unary(); return (z) => { const w = a(z); return [-w[0], -w[1]]; }; } if (c === '+') { i++; return unary(); } return power(); };
  const term = () => {
    let a = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') { i++; const b = unary(); const l = a; a = c === '*' ? (z) => cmul(l(z), b(z)) : (z) => cdiv(l(z), b(z)); }
      else if (startsAtom()) { const b = power(); const l = a; a = (z) => cmul(l(z), b(z)); }
      else return a;
    }
  };
  const expr = () => { let a = term(); for (;;) { const c = peek(); if (c === '+' || c === '-') { i++; const b = term(); const l = a; a = c === '+' ? (z) => cadd(l(z), b(z)) : (z) => csub(l(z), b(z)); } else return a; } };
  try {
    if (!s.trim()) err('empty formula');
    const e = expr(); if (peek() != null) err(`unexpected "${peek()}"`);
    e([0.37, 0.21]);
    return { f: e, error: null };
  } catch (x) { return { f: null, error: x.message }; }
}

// ------------------------------------------------------------------ elementary flows
/** Complex velocity u - iv = dW/dz of one element at z = x + iy. Elements:
 *  {t:'uni', k: U, th: angle of the stream}, {t:'src', x, y, k: m (volume flux)}, {t:'vtx', x, y, k: G (counter-clockwise)}, {t:'dbl', x, y, k: mu, th: axis angle}. */
export function elemW1(e, x, y) {
  if (e.t === 'uni') return [e.k * Math.cos(e.th || 0), -e.k * Math.sin(e.th || 0)];
  const dx = x - e.x, dy = y - e.y, r2 = dx * dx + dy * dy + 1e-18;
  if (e.t === 'src') return [(e.k / TAU) * dx / r2, -(e.k / TAU) * dy / r2];                    // m/(2 pi (z-z0)) = m conj(dz)/ (2 pi r^2)
  if (e.t === 'vtx') return [-(e.k / TAU) * dy / r2, -(e.k / TAU) * dx / r2];                    // -i G/(2 pi (z-z0))
  if (e.t === 'dbl') { const q = cdiv([1, 0], [dx * dx - dy * dy, 2 * dx * dy]); const c = cmul([-e.k, 0], cmul(cpolar(1, e.th || 0), q)); return c; }
  return [0, 0];
}
/** Velocity [u, v] at (x, y) of a list of elements; returns null within `core` of a singular element. */
export function elemVel(E, x, y, core = 0.04) {
  let u = 0, w = 0;
  for (const e of E) {
    if (e.t !== 'uni' && Math.hypot(x - e.x, y - e.y) < core) return null;
    const c = elemW1(e, x, y); u += c[0]; w -= c[1];
  }
  return [u, w];
}
/** Stream function of a list of elements (single-valued parts only for vortex and doublet; sources return k*theta/(2 pi) with the cut along -x). */
export function elemPsi(E, x, y) {
  let p = 0;
  for (const e of E) {
    if (e.t === 'uni') { p += e.k * (y * Math.cos(e.th || 0) - x * Math.sin(e.th || 0)); continue; }
    const dx = x - e.x, dy = y - e.y, r = Math.hypot(dx, dy) + 1e-12;
    if (e.t === 'src') p += (e.k / TAU) * Math.atan2(dy, dx);
    else if (e.t === 'vtx') p -= (e.k / TAU) * Math.log(r);
    else if (e.t === 'dbl') { const a = Math.atan2(dy, dx) - (e.th || 0); p -= (e.k * Math.sin(a)) / r; }
  }
  return p;
}

// ------------------------------------------------------------------ evenly spaced streamlines (after Jobard & Lefer, 1997)
/**
 * Streamlines of vel(x, y) → [u, v] | null (null: blocked or singular) in the window [x0, x1, y0, y1], evenly spaced by `sep`.
 * Returns an array of polylines [[x, y], …], each oriented along the flow.
 */
export function streamlines(vel, win, { sep = 0.25, step = sep / 5, maxPts = 1500, seeds = [] } = {}) {
  const [x0, x1, y0, y1] = win, dtest = 0.55 * sep, inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const grid = new Map(), key = (i, j) => i * 100003 + j;
  const cell = (x, y) => [Math.floor((x - x0) / sep), Math.floor((y - y0) / sep)];
  const add = (x, y) => { const [i, j] = cell(x, y), k = key(i, j); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(x, y); };
  const near = (x, y, d, own, skip) => {
    const [ci, cj] = cell(x, y), d2 = d * d;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const a = grid.get(key(i, j)); if (!a) continue;
      for (let m = 0; m < a.length; m += 2) { const dx = a[m] - x, dy = a[m + 1] - y; if (dx * dx + dy * dy < d2) return true; }
    }
    if (own) for (let m = 0; m < own.length - skip; m++) { const dx = own[m][0] - x, dy = own[m][1] - y; if (dx * dx + dy * dy < d2) return true; }
    return false;
  };
  const dir = (x, y, sg) => { const q = vel(x, y); if (!q) return null; const n = Math.hypot(q[0], q[1]); if (n < 1e-9) return null; return [sg * q[0] / n, sg * q[1] / n]; };
  const trace = (sx, sy, sg) => {
    const pts = []; let x = sx, y = sy; const skip = Math.ceil((1.2 * dtest) / step) + 2;
    for (let n = 0; n < maxPts; n++) {
      const d1 = dir(x, y, sg); if (!d1) break;
      const mx = x + 0.5 * step * d1[0], my = y + 0.5 * step * d1[1], d2 = dir(mx, my, sg); if (!d2) break;
      x += step * d2[0]; y += step * d2[1];
      if (!inside(x, y)) break;
      if (near(x, y, dtest, pts, skip)) break;
      pts.push([x, y]);
    }
    return pts;
  };
  const lines = [], queue = [];
  const tryLine = (sx, sy) => {
    if (!inside(sx, sy) || !vel(sx, sy) || near(sx, sy, sep, null, 0)) return;
    const f = trace(sx, sy, 1), b = trace(sx, sy, -1);
    const L = b.reverse().concat([[sx, sy]], f);
    if (L.length < 4) return;
    for (const p of L) add(p[0], p[1]);
    lines.push(L); queue.push(L);
  };
  for (const s of seeds) tryLine(s[0], s[1]);
  tryLine((x0 + x1) / 2, (y0 + y1) / 2 + 0.013);
  const every = Math.max(1, Math.round(sep / step));
  while (queue.length) {
    const L = queue.shift();
    for (let m = 0; m < L.length; m += every) {
      const p = L[m], q = L[Math.min(L.length - 1, m + 1)], r = L[Math.max(0, m - 1)];
      let tx = q[0] - r[0], ty = q[1] - r[1]; const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
      tryLine(p[0] - ty * sep, p[1] + tx * sep); tryLine(p[0] + ty * sep, p[1] - tx * sep);
    }
  }
  for (let y = y0 + sep / 2; y < y1; y += sep) for (let x = x0 + sep / 2; x < x1; x += sep) { tryLine(x, y); while (queue.length) { const L = queue.shift(); for (let m = 0; m < L.length; m += every) { const p = L[m], q = L[Math.min(L.length - 1, m + 1)], r = L[Math.max(0, m - 1)]; let tx = q[0] - r[0], ty = q[1] - r[1]; const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n; tryLine(p[0] - ty * sep, p[1] + tx * sep); tryLine(p[0] + ty * sep, p[1] - tx * sep); } } }
  return lines;
}
/** Draw streamlines on stage s with a small arrowhead in the middle of each. */
export function drawLines(s, lines, { color = 'accent', width = 1.3, alpha = 1, arrows = true, minLen = 6 } = {}) {
  const px = Math.abs(s.X(1) - s.X(0)) || 1, L = 7 / px;
  for (const l of lines) {
    s.path(l, { color, width, alpha });
    if (arrows && l.length > minLen) { const m = l.length >> 1, p = l[m], q = l[Math.min(l.length - 1, m + 1)], r = l[m - 1], n = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1; const ux = (q[0] - r[0]) / n, uy = (q[1] - r[1]) / n; s.arrow(p[0] - ux * L * 0.5, p[1] - uy * L * 0.5, p[0] + ux * L * 0.5, p[1] + uy * L * 0.5, { color, width: width + 0.2, alpha, head: 6 }); }
  }
}

// ------------------------------------------------------------------ Joukowski-type smooth bodies  z = zeta + c^2/zeta
/**
 * A body made by mapping the circle |zeta - zeta0| = R (R > max |zeta0 -+ c|, so the circle encloses both critical points) with z = zeta + c^2/zeta,
 * in a uniform stream U at angle of attack alpha with clockwise circulation G (aerodynamic sign). Density 1, p_inf = 0.
 */
export function joukBody({ zeta0 = [0, 0], c = 1, round = 0.2, U = 1, alpha = 0, G = 0, R: Rin = 0 }) {
  const R = Rin || Math.max(Math.hypot(zeta0[0] - c, zeta0[1]), Math.hypot(zeta0[0] + c, zeta0[1])) * (1 + round);
  const zOf = (zt) => cadd(zt, cdiv([c * c, 0], zt));
  const dz = (zt) => csub([1, 0], cdiv([c * c, 0], cmul(zt, zt)));
  const Wz = (zt) => { // dW/dzeta, zt absolute
    const p = csub(zt, zeta0);
    return cadd(cmul([U, 0], csub(cpolar(1, -alpha), cdiv(cpolar(R * R, alpha), cmul(p, p)))), cdiv([0, G / TAU], p));
  };
  const vel = (zt) => cconj(cdiv(Wz(zt), dz(zt)));            // [u, v]
  const surf = (n) => Array.from({ length: n }, (_, k) => cadd(zeta0, cpolar(R, (TAU * k) / n)));
  const P = { zeta0, c, R, U, alpha, G, zOf, dz, Wz, vel, surf };
  /** Pressure force (per unit density) by integrating p over the body: returns {Fx, Fy, cp[]}. */
  P.pressureForce = (n = 1440) => {
    let Fx = 0, Fy = 0; const cp = [];
    for (let k = 0; k < n; k++) {
      const th = TAU * (k + 0.5) / n, zt = cadd(zeta0, cpolar(R, th)), q = vel(zt);
      // Integrate the analytic boundary differential, avoiding polygon-chord bias.
      const d = cmul(dz(zt), cpolar(R * TAU / n, th + Math.PI / 2));
      const p = 0.5 * (U * U - (q[0] * q[0] + q[1] * q[1])), dx = d[0], dy = d[1];
      Fx += -p * dy; Fy += p * dx;
      cp.push(1 - (q[0] * q[0] + q[1] * q[1]) / (U * U));
    }
    return { Fx, Fy, cp };
  };
  /** Blasius: F_x - i F_y = (i rho/2) closed-contour integral of (dW/dz)^2 dz, taken on the image of the circle |zeta - zeta0| = rc >= R. */
  P.blasius = (rc, n = 1440) => {
    let s = [0, 0];
    for (let k = 0; k < n; k++) {
      const ph = (TAU * k) / n, zt = cadd(zeta0, cpolar(rc, ph)), w = Wz(zt), t = cdiv(cmul(w, w), dz(zt)), dzt = cpolar(rc * TAU / n, ph + Math.PI / 2);
      s = cadd(s, cmul(t, dzt));
    }
    const F = cmul([0, 0.5], s); return { Fx: F[0], Fy: -F[1], contour: Array.from({ length: 181 }, (_, k) => zOf(cadd(zeta0, cpolar(rc, (TAU * k) / 180)))) };
  };
  /** Velocity [u, v] at the physical point (x, y), or null inside the body. */
  P.at = (x, y) => {
    const z = [x, y], q = csqrt(csub(cmul(z, z), [4 * c * c, 0]));
    const a = [(x + q[0]) / 2, (y + q[1]) / 2], b = [(x - q[0]) / 2, (y - q[1]) / 2];
    const da = Math.hypot(a[0] - zeta0[0], a[1] - zeta0[1]), db = Math.hypot(b[0] - zeta0[0], b[1] - zeta0[1]);
    const zt = da >= db ? a : b;
    if (Math.max(da, db) <= R * 1.003) return null;
    return vel(zt);
  };
  return P;
}

// ------------------------------------------------------------------ Theodorsen's iteration: exterior conformal map of a star-shaped body onto |zeta| > 1
/** Hilbert-type conjugate of samples f_j at phi_j = 2 pi j / N:  cos k phi -> sin k phi, sin k phi -> -cos k phi. */
function conjugate(f) {
  const N = f.length, out = new Array(N).fill(0);
  for (let k = 1; k < N / 2; k++) {
    let a = 0, b = 0;
    for (let j = 0; j < N; j++) { const t = (TAU * j * k) / N; a += f[j] * Math.cos(t); b += f[j] * Math.sin(t); }
    a *= 2 / N; b *= 2 / N;
    for (let j = 0; j < N; j++) { const t = (TAU * j * k) / N; out[j] += a * Math.sin(t) - b * Math.cos(t); }
  }
  return out;
}
/**
 * Map the exterior of the body r = Rf(theta) (a positive 2 pi-periodic function) onto |zeta| > 1 with z(zeta) = zeta exp(sum_k c_k zeta^-k) (z ~ c_0 zeta at infinity).
 * Returns {zOf(zeta) (needs |zeta| >= 1), dzOf, err (max boundary mismatch, relative), it, ok}.
 */
export function theodorsen(Rf, N = 96, K = 40) {
  const phi = Array.from({ length: N }, (_, j) => (TAU * j) / N);
  let th = phi.slice(), it = 0, change = 1;
  for (; it < 120 && change > 1e-10; it++) {
    const u = th.map((t) => Math.log(Rf(t))), H = conjugate(u);
    const nt = phi.map((p, j) => p - H[j]); change = 0;
    for (let j = 0; j < N; j++) { const d = nt[j] - th[j]; change = Math.max(change, Math.abs(d)); th[j] += 0.75 * d; }
  }
  const g = th.map((t, j) => [Math.log(Rf(t)), t - phi[j]]);
  const c = [];
  for (let k = 0; k <= K; k++) { let re = 0, im = 0; for (let j = 0; j < N; j++) { const t = (TAU * j * k) / N; re += g[j][0] * Math.cos(t) - g[j][1] * Math.sin(t); im += g[j][0] * Math.sin(t) + g[j][1] * Math.cos(t); } c.push([re / N, im / N]); }
  const gOf = (zt) => { const iz = cdiv([1, 0], zt); let s = [0, 0], p = [1, 0]; for (let k = 0; k <= K; k++) { s = cadd(s, cmul(c[k], p)); p = cmul(p, iz); } return s; };
  const dgOf = (zt) => { const iz = cdiv([1, 0], zt); let s = [0, 0], p = iz; for (let k = 1; k <= K; k++) { s = csub(s, cmul([k, 0], cmul(c[k], p))); p = cmul(p, iz); } return s; }; // zeta g'(zeta)
  const zOf = (zt) => cmul(zt, cexp(gOf(zt)));
  const dzOf = (zt) => cmul(cexp(gOf(zt)), cadd([1, 0], dgOf(zt)));
  let err = 0;
  for (let j = 0; j < 4 * N; j++) { const z = zOf(cpolar(1, (TAU * (j + 0.37)) / (4 * N))), r = cabs(z), R = Rf(carg(z)); err = Math.max(err, Math.abs(r - R) / R); }
  return { zOf, dzOf, err, it, ok: change < 1e-6 && err < 0.02, c0: c[0][0] };
}
