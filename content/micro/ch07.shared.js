// Microeconomics — Chapter 7: helpers shared by ch07.js and ch07-b.js (plain named exports).
// House style of the producer diagrams, matching the consumer diagrams of chapters 4–6: labour L on the horizontal axis and
// capital K on the vertical; isoquants in `purple` (as indifference curves), isocost lines in `accent` (as budget lines),
// cost-minimizing bundles in `green`, test bundles in `gold`. Cost curves: total cost `ink`, average cost `accent`, average
// variable cost `teal`, average fixed cost `muted`, marginal cost `orange`; short run dashed or faint, long run solid.
// Generic helpers (clamp, bisect, argmax, trimArrow, …) are copied from ch06.shared.js, since a chapter may import only its
// own shared file. Every technology carries a closed-form cost minimizer, and `cminNum` re-solves the same problem by search
// along the isoquant, so readouts can compare the two instead of trusting the formula.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };
export const LBL = { size: 12, weight: 700 };
/** Show or hide a whole stage (panel). */
export const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };
/** Signed number with a real minus sign, e.g. +1.23 / −0.40. */
export const sgn = (x, d = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;
/** Number with a real minus sign. */
export const fx = (x, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

/** Root of f on [a, b] by bisection; null when f does not change sign. */
export function bisect(f, a, b, it = 60) {
  let fa = f(a); const fb = f(b);
  if (!(isFinite(fa) && isFinite(fb))) return null;
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}
/** Maximise f on [a, b]: scan n + 1 points, then golden-section search on the bracket of the best one. → {x, f} */
export function argmax(f, a, b, n = 48, it = 56) {
  const h = (b - a) / n; let bi = 0, bv = -Infinity;
  for (let i = 0; i <= n; i++) { const w = f(a + i * h); if (w > bv) { bv = w; bi = i; } }
  let lo = a + Math.max(0, bi - 1) * h, hi = a + Math.min(n, bi + 1) * h;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo), fc = f(c), fd = f(d);
  for (let k = 0; k < it; k++) { if (fc < fd) { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = f(d); } else { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = f(c); } }
  const xm = (lo + hi) / 2, fm = f(xm);
  return fm > bv ? { x: xm, f: fm } : { x: a + bi * h, f: bv };
}
export const argmin = (f, a, b, n, it) => { const r = argmax((x) => -f(x), a, b, n, it); return { x: r.x, f: -r.f }; };
/** Central difference. */
export const dif = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
/** Arrow between two points, trimmed in pixels at both ends so it clears the dots. */
export function trimArrow(s, a, b, st, t0 = 9, t1 = 10) {
  const X1 = s.X(a[0]), Y1 = s.Y(a[1]), X2 = s.X(b[0]), Y2 = s.Y(b[1]), L = Math.hypot(X2 - X1, Y2 - Y1);
  if (L < t0 + t1 + 4) return false;
  const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, [x1, y1] = s.inv(X1 + ux * t0, Y1 + uy * t0), [x2, y2] = s.inv(X2 - ux * t1, Y2 - uy * t1);
  s.arrow(x1, y1, x2, y2, st); return true;
}
/** Text label on a plate at a data point. */
export function plateText(s, str, x, y, st = {}) { s.text(str, x, y, { plate: true, size: 11.5, weight: 600, ...st }); }
/** A line through (x0, y0) with slope m, drawn half-length `len` pixels each way (works on unequal axes). */
export function slopeLine(s, x0, y0, m, len, st) {
  const px = s.X(1) - s.X(0), py = s.Y(0) - s.Y(1), dx = 1, dy = m, L = Math.hypot(dx * px, dy * py) || 1, k = len / L;
  s.clip(() => s.line(x0 - k * dx, y0 - k * dy, x0 + k * dx, y0 + k * dy, st));
}

// ------------------------------------------------------------------------------------------------ scale functions
/**
 * Homothetic technologies f(L, K) = H(L^a K^(1−a)) are described by the inverse of H: Z(y) = the amount of the
 * constant-returns input index z = L^a K^(1−a) needed to make y. Long-run cost is then c(w, r, y) = κ(w, r)·Z(y) and the
 * long-run average cost is proportional to Z(y)/y. All families are written Z(y) = ys·ζ(y/ys) with ζ(1) = 1, so the
 * long-run average cost at the efficient scale ys equals κ.
 *   'U'    ζ(t) = α t^(1/3) + (1 − α) t², α = 0.6: increasing returns at small scale (ζ/t falls), decreasing at large scale;
 *   'flat' ζ(t) = t on [1, t2] (constant returns: a flat bottom), increasing returns below 1, decreasing above t2;
 *   'crs'  ζ(t) = t: constant returns everywhere;
 *   'deg'  ζ(t) = t^(1/k): homogeneous of degree k.
 */
export function scaleFn(kind, P = {}) {
  const ys = P.ys ?? 6;
  let z;
  switch (kind) {
    case 'U': { const e1 = P.e1 ?? 1 / 3, e2 = P.e2 ?? 2, al = (e2 - 1) / (e2 - e1); z = (t) => al * t ** e1 + (1 - al) * t ** e2; break; }
    case 'flat': { const A = P.A ?? 1.2, B = P.B ?? 1.5, t2 = P.t2 ?? 1.8;
      z = (t) => (t <= 1 ? t * (1 + A * (t ** (-2 / 3) - 1 + (2 / 3) * (t - 1))) : t <= t2 ? t : t * (1 + B * (t / t2 - 1) ** 2)); break; }
    case 'crs': z = (t) => t; break;
    case 'deg': { const k = P.k ?? 1; z = (t) => t ** (1 / k); break; }
    default: throw new Error('unknown scale function ' + kind);
  }
  const Z = (y) => (y <= 0 ? 0 : ys * z(y / ys));
  const Zinv = (q) => { if (q <= 0) return 0; let hi = ys; while (Z(hi) < q && hi < 1e9) hi *= 2; return bisect((y) => Z(y) - q, 0, hi, 64) ?? hi; };
  const dZ = (y) => { const h = 1e-6 * Math.max(1, y); return y > h ? (Z(y + h) - Z(y - h)) / (2 * h) : (Z(y + h) - Z(y)) / h; };
  return { Z, Zinv, dZ, ys, kind };
}

// ------------------------------------------------------------------------------------------------ technologies
/**
 * Production technologies. Each returns {f(L, K), mp(L, K) → [MP_L, MP_K], kinks (ray angles of kinks), cmin(w, r, y) → {x: [L, K], c},
 * deg (degree of homogeneity, or null), sigma (elasticity of substitution, or null), label}.
 *   'cd'    A L^a K^b
 *   'ces'   A (α L^ρ + (1 − α) K^ρ)^(k/ρ), ρ = (σ − 1)/σ; σ = 1 is Cobb–Douglas, σ → 0 Leontief, σ → ∞ linear
 *   'leon'  A min(L/a, K/b)^k
 *   'lin'   A (a L + b K)^k
 *   'hom'   H(L^a K^(1−a)) with H the inverse of a scale function S = scaleFn(...): variable returns to scale
 */
export function tech(kind, P = {}) {
  switch (kind) {
    case 'cd': { const A = P.A ?? 1, a = P.a ?? 0.5, b = P.b ?? 0.5, k = a + b;
      const f = (L, K) => (L <= 0 || K <= 0 ? 0 : A * L ** a * K ** b);
      return { f, mp: (L, K) => { const y = f(L, K); return [(a * y) / L, (b * y) / K]; }, kinks: [], deg: k, sigma: 1, A, a, b,
        cmin: (w, r, y) => { const z = (y / A) ** (1 / k), L = z * ((a * r) / (b * w)) ** (b / k), K = z * ((b * w) / (a * r)) ** (a / k); return { x: [L, K], c: w * L + r * K }; } }; }
    case 'ces': { const A = P.A ?? 1, al = P.al ?? 0.5, s = P.s ?? 0.5, k = P.k ?? 1;
      if (Math.abs(s - 1) < 2e-3) return { ...tech('cd', { A, a: al * k, b: (1 - al) * k }), sigma: 1 };
      const rho = (s - 1) / s;
      const f = (L, K) => { if (rho < 0 && (L <= 0 || K <= 0)) return 0; const Q = al * Math.max(L, 0) ** rho + (1 - al) * Math.max(K, 0) ** rho; return Q <= 0 ? 0 : A * Q ** (k / rho); };
      return { f, mp: (L, K) => { const y = f(L, K), Q = al * L ** rho + (1 - al) * K ** rho; return [(k * y * al * L ** (rho - 1)) / Q, (k * y * (1 - al) * K ** (rho - 1)) / Q]; }, kinks: [], deg: k, sigma: s, rho,
        cmin: (w, r, y) => { const z = (y / A) ** (1 / k), W = al ** s * w ** (1 - s) + (1 - al) ** s * r ** (1 - s), g = W ** (s / (1 - s)), L = z * al ** s * w ** -s * g, K = z * (1 - al) ** s * r ** -s * g; return { x: [L, K], c: w * L + r * K }; } }; }
    case 'leon': { const A = P.A ?? 1, a = P.a ?? 1, b = P.b ?? 1, k = P.k ?? 1;
      const f = (L, K) => (L <= 0 || K <= 0 ? 0 : A * Math.min(L / a, K / b) ** k);
      return { f, mp: (L, K) => { const m = Math.min(L / a, K / b), d = A * k * m ** (k - 1); return L / a < K / b - 1e-9 ? [d / a, 0] : L / a > K / b + 1e-9 ? [0, d / b] : [NaN, NaN]; }, kinks: [Math.atan2(b, a)], deg: k, sigma: 0,
        cmin: (w, r, y) => { const z = (y / A) ** (1 / k); return { x: [a * z, b * z], c: w * a * z + r * b * z }; } }; }
    case 'lin': { const A = P.A ?? 1, a = P.a ?? 1, b = P.b ?? 1, k = P.k ?? 1;
      const f = (L, K) => A * Math.max(a * L + b * K, 0) ** k;
      return { f, mp: (L, K) => { const d = A * k * Math.max(a * L + b * K, 1e-300) ** (k - 1); return [d * a, d * b]; }, kinks: [], deg: k, sigma: Infinity,
        cmin: (w, r, y) => { const z = (y / A) ** (1 / k), cl = w / a, ck = r / b; const x = Math.abs(cl - ck) < 1e-12 ? [z / (2 * a), z / (2 * b)] : cl < ck ? [z / a, 0] : [0, z / b]; return { x, c: w * x[0] + r * x[1] }; } }; }
    case 'hom': { const S = P.S ?? scaleFn('U'), a = P.a ?? 0.5;
      const core = (L, K) => (L <= 0 || K <= 0 ? 0 : L ** a * K ** (1 - a));
      const f = (L, K) => S.Zinv(core(L, K));
      return { f, S, a, kinks: [], deg: null, sigma: 1,
        mp: (L, K) => { const z = core(L, K), y = S.Zinv(z), d = S.dZ(y); return [(a * z) / L / d, ((1 - a) * z) / K / d]; },
        cmin: (w, r, y) => { const z = S.Z(y), L = z * ((a * r) / ((1 - a) * w)) ** (1 - a), K = z * (((1 - a) * w) / (a * r)) ** a; return { x: [L, K], c: w * L + r * K }; },
        /** labour needed for y with capital fixed at K */
        srL: (y, K) => (S.Z(y) / K ** (1 - a)) ** (1 / a) };
    }
    default: throw new Error('unknown technology ' + kind);
  }
}
/** Numerical marginal products (central differences), for checking the analytic ones. */
export function mpNum(T, L, K, h = 1e-5) { return [(T.f(L + h, K) - T.f(L - h, K)) / (2 * h), (T.f(L, K + h) - T.f(L, K - h)) / (2 * h)]; }

/** Radius at which f = y along the ray of angle th (f increasing along rays); null if not reached within rmax. */
export function rayLevel(f, y, th, rmax, it = 56) {
  const c = Math.cos(th), s = Math.sin(th);
  return bisect((r) => f(r * c, r * s) - y, 1e-12, rmax, it);
}
/** Points of the isoquant f = y, traced ray by ray (kink angles included exactly); null breaks the path. */
export function isoq(T, y, X, Y, n = 200) {
  const R = 6 * Math.hypot(X, Y), ths = [];
  for (let i = 0; i <= n; i++) ths.push((Math.PI / 2) * (i / n));
  for (const k of T.kinks || []) ths.push(k);
  ths.sort((a, b) => a - b);
  const pts = [];
  for (const th of ths) { const r = rayLevel(T.f, y, th, R, 50); pts.push(r == null ? null : [r * Math.cos(th), r * Math.sin(th)]); }
  return pts;
}
/** Draw the isoquant f = y on stage s. */
export function drawIsoq(s, T, y, st = {}) { const X = s.bounds.x[1], Y = s.bounds.y[1]; s.clip(() => s.path(isoq(T, y, X, Y, st.n), st)); return s; }
/** Isocost line w L + r K = C (with optional shaded set below it). */
export function isocost(s, w, r, C, st = {}) {
  s.clip(() => {
    if (st.fill) s.poly([[0, 0], [C / w, 0], [0, C / r]], { fill: st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.08, stroke: false });
    s.line(C / w, 0, 0, C / r, { color: st.color || 'accent', width: st.width ?? 2.4, dash: st.dash, alpha: st.alpha });
  });
}
/**
 * Cost minimization by search along the isoquant (golden section over the ray angle, kink angles and the two axes checked
 * too). Independent of the closed forms in T.cmin. → {x: [L, K], c, th}
 */
export function cminNum(T, w, r, y, R = 2000) {
  const pt = (th) => { const q = rayLevel(T.f, y, th, R, 70); return q == null ? null : [q * Math.cos(th), q * Math.sin(th)]; };
  const cost = (th) => { const q = pt(th); return q ? w * q[0] + r * q[1] : Infinity; };
  const res = argmin(cost, 0, Math.PI / 2, 120, 70);
  let th = res.x, best = res.f;
  for (const k of [...(T.kinks || []), 0, Math.PI / 2]) { const c = cost(k); if (c < best - 1e-12) { best = c; th = k; } }
  const q = pt(th);
  return q ? { x: q, c: w * q[0] + r * q[1], th } : null;
}
/** Elasticity of substitution measured on an isoquant: d ln(K/L) / d ln(TRS) by central differences in the ray angle. */
export function sigmaNum(T, L, K, dth = 2e-3) {
  const y = T.f(L, K), th = Math.atan2(K, L), R = 6 * Math.hypot(L, K) + 10;
  const at = (t) => { const q = rayLevel(T.f, y, t, R, 70); const P = [q * Math.cos(t), q * Math.sin(t)], m = T.mp(P[0], P[1]); return [Math.log(P[1] / P[0]), Math.log(m[0] / m[1])]; };
  const a = at(th - dth), b = at(th + dth);
  return (b[0] - a[0]) / (b[1] - a[1]);
}

// ------------------------------------------------------------------------------------------------ cost curves
/**
 * Short-run and long-run cost curves of a homothetic technology T = tech('hom', …) at input prices w, r, with capital fixed
 * at Kb in the short run. All curves are computed from the technology (the labour requirement), not from a cost formula.
 */
export function costCurves(T, w, r, Kb) {
  const FC = r * Kb;
  const VC = (y) => w * T.srL(y, Kb);
  const TC = (y) => FC + VC(y);
  const MC = (y) => dif(TC, Math.max(y, 2e-5), 1e-5 * Math.max(1, y));
  const LTC = (y) => T.cmin(w, r, y).c;
  const LMC = (y) => dif(LTC, Math.max(y, 2e-5), 1e-5 * Math.max(1, y));
  const out = { FC, VC, TC, MC, LTC, LMC, AVC: (y) => VC(y) / y, AC: (y) => TC(y) / y, AFC: (y) => FC / y, LAC: (y) => LTC(y) / y };
  out.minAVC = (ymax = 40) => argmin(out.AVC, 1e-3, ymax, 200, 70);
  out.minAC = (ymax = 40) => argmin(out.AC, 1e-3, ymax, 200, 70);
  return out;
}
/** Sample a function on [a, b] into a polyline (non-finite values break the line). */
export function sample(f, a, b, n = 160) { const pts = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, y = f(x); pts.push(isFinite(y) ? [x, y] : null); } return pts; }
