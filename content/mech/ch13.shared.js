// Classical Mechanics — Chapter 13: helpers shared by ch13.js and ch13-b.js

export { TAU, DEG, clamp, memo, sci, num, rk4, wrap, pendStep, shoelace, perimeter, makeLoop, drawCyl, piTicks, series, drawPendulum } from './ch12.shared.js';
import { TAU } from './ch12.shared.js';

/** Wrap into [0, 2π). */
export const wrap0 = (x) => x - TAU * Math.floor(x / TAU);

/**
 * Work that is too big for one frame: `step(budgetMs)` does a slice and returns true when finished; the runner keeps
 * asking for redraws (setTimeout → v.invalidate) until it is. Call `job.run()` inside render.
 */
export function progressive(v) {
  let timer = null;
  v.onCleanup(() => clearTimeout(timer));
  return {
    run(step, budget = 30) {
      const done = step(budget);
      if (!done && !timer) timer = setTimeout(() => { timer = null; v.invalidate(); }, 0);
      return done;
    },
  };
}
/** Time in ms (performance.now when available). */
export const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Many tiny squares at once, drawn straight on the stage canvas: xs, ys arrays (data units), n points. */
export function fastDots(v, s, xs, ys, n, color, { alpha = 0.8, size = 1.6 } = {}) {
  const c = s.ctx; c.fillStyle = v.color(color, alpha); const h = size / 2;
  for (let i = 0; i < n; i++) { const X = s.X(xs[i]), Y = s.Y(ys[i]); if (X === X && Y === Y) c.fillRect(X - h, Y - h, size, size); }
}

/** Least-squares slope and intercept of y on x. */
export function fitLine(xs, ys) {
  const n = xs.length; if (n < 2) return { slope: NaN, intercept: NaN };
  let sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { slope, intercept: (sy - slope * sx) / n };
}

// ── Chirikov standard map  p' = p + K sin θ,  θ' = θ + p'  (on the torus [0, 2π)²) ─────────────────────────
/** Iterate n times from (θ, p) without reduction; returns the end point and the trace of the n-step Jacobian. */
export function stdOrbit(K, th, p, n) {
  let a = 1, b = 0, c = 0, d = 1;
  for (let i = 0; i < n; i++) {
    const ck = K * Math.cos(th);
    const na = (1 + ck) * a + c, nb = (1 + ck) * b + d, nc = ck * a + c, nd = ck * b + d; a = na; b = nb; c = nc; d = nd;
    p += K * Math.sin(th); th += p;
  }
  return { th, p, tr: a + d };
}
/**
 * Symmetry condition for an orbit of rotation number m/n that starts on the symmetry line θ = θ0 (0 or π).
 * The map is I₂∘I₁ with involutions I₁(θ, p) = (−θ, p + K sin θ) and I₂(θ, p) = (p − θ, p); an orbit from Fix I₁
 * is n-periodic when T^{n/2} lands on Fix I₁ (n even: sin θ = 0) or T^{(n+1)/2} lands on Fix I₂ (n odd: sin(θ − p/2) = 0).
 */
function symCond(K, th0, p0, n) {
  const k = n % 2 === 0 ? n / 2 : (n + 1) / 2; let th = th0, p = p0;
  for (let i = 0; i < k; i++) { p += K * Math.sin(th); th += p; }
  return n % 2 === 0 ? Math.sin(th) : Math.sin(th - p / 2);
}
/** Find the symmetric m/n orbit on θ = θ0 with p0 in [lo, hi] (scan + bisection); returns {p0, R (Greene residue), err} or null. */
export function symOrbit(K, th0, m, n, lo, hi, N = 160, near = (lo + hi) / 2) {
  let pv = symCond(K, th0, lo, n), px = lo, best = null;
  for (let i = 1; i <= N; i++) {
    const x = lo + ((hi - lo) * i) / N, f = symCond(K, th0, x, n);
    if (f > 0 !== pv > 0) {
      let a = px, b = x, fa = pv;
      for (let j = 0; j < 56; j++) { const mm = (a + b) / 2, fm = symCond(K, th0, mm, n); if (fm > 0 === fa > 0) { a = mm; fa = fm; } else b = mm; }
      const r = (a + b) / 2, o = stdOrbit(K, th0, r, n), err = Math.hypot(o.th - th0 - TAU * m, o.p - r);
      if (err < 1e-6 && (!best || Math.abs(r - near) < Math.abs(best.p0 - near))) best = { p0: r, R: (2 - o.tr) / 4, err, m, n };
    }
    pv = f; px = x;
  }
  return best;
}
/** Continued-fraction approximants m/n of a rotation number (successive symmetric orbits found by continuation). */
export function residueChain(K, th0, list) {
  const out = []; let prev = null, pw = 0;
  for (const [m, n] of list) {
    const g = (TAU * m) / n, w = Math.max(0.01, 2.5 * TAU * Math.abs(m / n - pw)); pw = m / n;
    const o = prev === null ? symOrbit(K, th0, m, n, g - 1.2, g + 1.2, 2400, g) : symOrbit(K, th0, m, n, prev - w, prev + w, 160, prev);
    if (!o) break; out.push(o); prev = o.p0;
  }
  return out;
}
/** Convergents of the golden mean (√5 − 1)/2 and of √2 − 1. */
export const FIB = [[1, 2], [2, 3], [3, 5], [5, 8], [8, 13], [13, 21], [21, 34], [34, 55], [55, 89], [89, 144], [144, 233], [233, 377]];
export const PELL = [[1, 2], [2, 5], [5, 12], [12, 29], [29, 70], [70, 169], [169, 408]];

// ── Hénon–Heiles  H = ½(px² + py²) + ½(x² + y²) + x²y − y³/3 ──────────────────────────────────────────────
export const hhV = (x, y) => 0.5 * (x * x + y * y) + x * x * y - (y * y * y) / 3;
/** Leapfrog (kick–drift–kick) step of Hénon–Heiles, state [x, y, px, py], in place. */
export function hhStep(s, h) {
  s[2] -= 0.5 * h * (s[0] + 2 * s[0] * s[1]); s[3] -= 0.5 * h * (s[1] + s[0] * s[0] - s[1] * s[1]);
  s[0] += h * s[2]; s[1] += h * s[3];
  s[2] -= 0.5 * h * (s[0] + 2 * s[0] * s[1]); s[3] -= 0.5 * h * (s[1] + s[0] * s[0] - s[1] * s[1]);
}
/** Same step for the state and a tangent vector u = [δx, δy, δpx, δpy] (the variational equations, also leapfrog). */
export function hhStepT(s, u, h) {
  const kick = () => {
    const x = s[0], y = s[1];
    s[2] -= 0.5 * h * (x + 2 * x * y); s[3] -= 0.5 * h * (y + x * x - y * y);
    u[2] -= 0.5 * h * ((1 + 2 * y) * u[0] + 2 * x * u[1]); u[3] -= 0.5 * h * (2 * x * u[0] + (1 - 2 * y) * u[1]);
  };
  kick(); s[0] += h * s[2]; s[1] += h * s[3]; u[0] += h * u[2]; u[1] += h * u[3]; kick();
}
export const hhE = (s) => 0.5 * (s[2] * s[2] + s[3] * s[3]) + hhV(s[0], s[1]);
/** State on the section x = 0 with px > 0 at energy E, or null if (y, py) is outside the allowed region. */
export function hhSeed(E, y, py) {
  const k = 2 * E - py * py - 2 * hhV(0, y); return k < 0 ? null : [0, y, Math.sqrt(k), py];
}
/** Run from a section seed, collecting crossings of x = 0 upward (interpolated) until `max` crossings or time T. */
export function hhSection(s0, { h = 0.04, max = 400, T = 4000 } = {}) {
  const s = s0.slice(), ys = [], ps = []; let t = 0;
  while (ys.length < max && t < T) {
    const x0 = s[0], y0 = s[1], py0 = s[3]; hhStep(s, h); t += h;
    if (x0 < 0 && s[0] >= 0) { const f = -x0 / (s[0] - x0); ys.push(y0 + f * (s[1] - y0)); ps.push(py0 + f * (s[3] - py0)); }
  }
  return { ys, ps };
}
/** Finite-time largest Lyapunov exponent from the tangent dynamics (renormalised every 25 steps). */
export function hhFTLE(s0, T = 600, h = 0.04) {
  const s = s0.slice(), u = [0.3, 0.5, 0.2, -0.1]; let S = 0; const n = Math.round(T / h);
  for (let i = 1; i <= n; i++) { hhStepT(s, u, h); if (i % 25 === 0) { const r = Math.hypot(u[0], u[1], u[2], u[3]); S += Math.log(r); u[0] /= r; u[1] /= r; u[2] /= r; u[3] /= r; } }
  return S / (n * h);
}
/** Allowed region of the Hénon–Heiles section at energy E: py² ≤ 2E − y² + 2y³/3. */
export const hhPyMax = (E, y) => { const k = 2 * E - 2 * hhV(0, y); return k > 0 ? Math.sqrt(k) : NaN; };
/** y-range of the section (roots of 2E = y² − 2y³/3 on the bounded branch). */
export function hhYRange(E) {
  const g = (y) => 2 * E - y * y + (2 * y * y * y) / 3;
  const bis = (a, b) => { let fa = g(a); for (let i = 0; i < 60; i++) { const m = (a + b) / 2, fm = g(m); if (fm > 0 === fa > 0) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
  return [bis(-1, 0), bis(0, 1)];
}
