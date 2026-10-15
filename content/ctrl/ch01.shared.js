// Control Theory — Chapter 1: helpers shared by ch01.js and ch01-b.js
// (complex arithmetic, polynomials and transfer functions, exact and simulated responses,
//  block-diagram drawing, the Watt-governor model, and a fixed-step clock for live simulations)

// ---------------------------------------------------------------- complex numbers as [re, im]
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const carg = (a) => Math.atan2(a[1], a[0]);
export const cexp = (a) => { const r = Math.exp(a[0]); return [r * Math.cos(a[1]), r * Math.sin(a[1])]; };

// ---------------------------------------------------------------- polynomials (ascending: [a0, a1, …] = a0 + a1 s + …)
export function ptrim(p) { const q = p.slice(); while (q.length > 1 && Math.abs(q[q.length - 1]) < 1e-13) q.pop(); return q; }
export function padd(p, q) { const n = Math.max(p.length, q.length), r = new Array(n).fill(0); for (let i = 0; i < n; i++) r[i] = (p[i] || 0) + (q[i] || 0); return ptrim(r); }
export function pmul(p, q) { const r = new Array(p.length + q.length - 1).fill(0); for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) r[i + j] += p[i] * q[j]; return ptrim(r); }
export const pscale = (p, k) => p.map((x) => x * k);
export function pval(p, x) { let y = 0; for (let i = p.length - 1; i >= 0; i--) y = y * x + p[i]; return y; }
/** p(z) for complex z = [re, im]. */
export function pvalC(p, z) { let re = 0, im = 0; for (let i = p.length - 1; i >= 0; i--) { const r2 = re * z[0] - im * z[1] + p[i]; im = re * z[1] + im * z[0]; re = r2; } return [re, im]; }
/** Product of (s − r) over real roots and (s² − 2 Re r s + |r|²) over complex pairs given once (im > 0). */
export function pfromRoots(roots) {
  let p = [1];
  for (const r of roots) p = Array.isArray(r) && Math.abs(r[1]) > 1e-12 ? pmul(p, [r[0] * r[0] + r[1] * r[1], -2 * r[0], 1]) : pmul(p, [-(Array.isArray(r) ? r[0] : r), 1]);
  return p;
}
/** TeX of a polynomial in descending powers, coefficients to `d` significant figures. */
export function ptex(p, v = 's', d = 3) {
  const q = ptrim(p), terms = [];
  const num = (x) => { const a = Math.abs(x); if (a >= 1e4 || (a < 1e-3 && a > 0)) return a.toExponential(1).replace(/e\+?(-?)(\d+)/, '\\times10^{$1$2}'); const s = +a.toPrecision(d); return String(s); };
  for (let i = q.length - 1; i >= 0; i--) {
    const c = q[i]; if (Math.abs(c) < 1e-12 && q.length > 1) continue;
    const mag = Math.abs(c), pw = i === 0 ? '' : i === 1 ? v : `${v}^{${i}}`;
    const coef = i > 0 && Math.abs(mag - 1) < 1e-12 ? '' : num(c);
    terms.push([c < 0 ? '-' : '+', coef + pw]);
  }
  if (!terms.length) return '0';
  return terms.map(([sg, t], k) => (k === 0 ? (sg === '-' ? '-' : '') : sg) + t).join('');
}

// ---------------------------------------------------------------- transfer functions {num, den}
export const tf = (num, den) => ({ num: ptrim(num), den: ptrim(den) });
export const tfmul = (a, b) => tf(pmul(a.num, b.num), pmul(a.den, b.den));
/** G/(1 + G H): negative feedback around G through H. */
export const tfFeedback = (G, H = tf([1], [1])) => tf(pmul(G.num, H.den), padd(pmul(G.den, H.den), pmul(G.num, H.num)));
/** Value at s = [re, im]. */
export const tfAtS = (sys, s) => cdiv(pvalC(sys.num, s), pvalC(sys.den, s));
/** Frequency response at s = iω. */
export const tfAt = (sys, w) => tfAtS(sys, [0, w]);
export const tfTeX = (sys, v = 's') => (sys.den.length === 1 && Math.abs(sys.den[0] - 1) < 1e-12 ? ptex(sys.num, v) : `\\dfrac{${ptex(sys.num, v)}}{${ptex(sys.den, v)}}`);
export function logspace(w0, w1, n) { const a = Math.log10(w0), b = Math.log10(w1); return Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1))); }

// ---------------------------------------------------------------- state space (controllable canonical form)
/**
 * Realise a proper transfer function: x' = A x + B u, y = C x + D u with A the companion matrix of the monic
 * denominator, B = e_n. Returns {n, a (monic denominator, ascending, without the leading 1), C, D}.
 */
export function realize(sys) {
  const den = ptrim(sys.den), n = den.length - 1, lead = den[n];
  const a = den.slice(0, n).map((x) => x / lead), num = ptrim(sys.num).map((x) => x / lead);
  if (num.length > n + 1) throw new Error('improper transfer function');
  const D = num.length === n + 1 ? num[n] : 0;
  const C = Array.from({ length: n }, (_, i) => (num[i] || 0) - D * a[i]);
  return { n, a, C, D };
}
export const ssOut = (b, x, u) => { let y = b.D * u; for (let i = 0; i < b.n; i++) y += b.C[i] * x[i]; return y; };
/** dx for the companion realisation (writes into out). */
export function ssDer(b, x, u, out) {
  const n = b.n; if (!n) return out;
  let last = u; for (let i = 0; i < n; i++) last -= b.a[i] * x[i];
  for (let i = 0; i < n - 1; i++) out[i] = x[i + 1];
  out[n - 1] = last; return out;
}
export function ssMatrices(b) {
  const n = b.n, A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i < n - 1 ? (j === i + 1 ? 1 : 0) : -b.a[j])));
  const B = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1 : 0));
  return { A, B };
}
/**
 * Exact unit-step response on t = 0, h, …, T (h = T/N) by zero-order-hold discretisation:
 * [Φ Γ; 0 1] = exp([A B; 0 0] h). M = v.M (for expm).
 */
export function stepExact(M, sys, T, N) {
  const b = realize(sys), n = b.n, h = T / N, t = [], y = [];
  if (!n) { for (let k = 0; k <= N; k++) { t.push(k * h); y.push(b.D); } return { t, y }; }
  const { A, B } = ssMatrices(b);
  const Aug = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i < n ? (j < n ? A[i][j] * h : B[i] * h) : 0)));
  const E = M.expm(Aug);
  let x = new Array(n).fill(0);
  for (let k = 0; k <= N; k++) {
    t.push(k * h); y.push(ssOut(b, x, 1));
    const nx = new Array(n).fill(0);
    for (let i = 0; i < n; i++) { let s = E[i][n]; for (let j = 0; j < n; j++) s += E[i][j] * x[j]; nx[i] = s; }
    x = nx;
  }
  return { t, y };
}

/**
 * Simulate the standard negative-feedback loop by RK4 on the joined state vector:
 *   e = r − (H y + n),  u = C e,  v = u + d,  y = P v + dOut.
 * C, P, H are proper transfer functions and the loop must have no algebraic loop (P strictly proper suffices).
 * Inputs r, d, n, dOut are functions of time. Returns every signal on t = k·dt, k = 0 … round(T/dt).
 */
export function simLoop({ C, P, H = tf([1], [1]) }, { T, dt, r = () => 1, d = () => 0, n = () => 0, dOut = () => 0 }) {
  const bc = realize(C), bp = realize(P), bh = realize(H);
  if (bp.D !== 0 && bc.D !== 0 && bh.D !== 0) throw new Error('algebraic loop');
  const nc = bc.n, np = bp.n, nh = bh.n, N = nc + np + nh;
  const xc = (X) => X.slice(0, nc), xp = (X) => X.slice(nc, nc + np), xh = (X) => X.slice(nc + np);
  const sig = (X, t) => {
    // P strictly proper: y from its state; else solve the scalar loop equation (not needed here)
    const y = ssOut(bp, xp(X), 0) + dOut(t);
    const ym = ssOut(bh, xh(X), y) + n(t), e = r(t) - ym, u = ssOut(bc, xc(X), e), vv = u + d(t);
    return { y, ym, e, u, v: vv };
  };
  const der = (X, t) => {
    const s = sig(X, t), out = new Array(N).fill(0);
    const dc = ssDer(bc, xc(X), s.e, new Array(nc).fill(0)), dp = ssDer(bp, xp(X), s.v, new Array(np).fill(0)), dh = ssDer(bh, xh(X), s.y, new Array(nh).fill(0));
    for (let i = 0; i < nc; i++) out[i] = dc[i];
    for (let i = 0; i < np; i++) out[nc + i] = dp[i];
    for (let i = 0; i < nh; i++) out[nc + np + i] = dh[i];
    return out;
  };
  const K = Math.round(T / dt), res = { t: [], r: [], e: [], u: [], v: [], y: [], ym: [], d: [], n: [] };
  let X = new Array(N).fill(0);
  const add = (a, b, k) => a.map((x, i) => x + k * b[i]);
  for (let k = 0; k <= K; k++) {
    const t = k * dt, s = sig(X, t);
    res.t.push(t); res.r.push(r(t)); res.e.push(s.e); res.u.push(s.u); res.v.push(s.v); res.y.push(s.y); res.ym.push(s.ym); res.d.push(d(t)); res.n.push(n(t));
    if (k === K) break;
    const k1 = der(X, t), k2 = der(add(X, k1, dt / 2), t + dt / 2), k3 = der(add(X, k2, dt / 2), t + dt / 2), k4 = der(add(X, k3, dt), t + dt);
    X = X.map((x, i) => x + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  return res;
}

/** Amplitude and phase of the best-fitting sinusoid A cos(ωt + φ) + c to samples (ts, ys) by least squares. */
export function fitSine(ts, ys, w) {
  let Scc = 0, Sss = 0, Scs = 0, Sc = 0, Ss = 0, S1 = 0, Syc = 0, Sys = 0, Sy = 0;
  for (let i = 0; i < ts.length; i++) {
    const c = Math.cos(w * ts[i]), s = Math.sin(w * ts[i]), y = ys[i];
    Scc += c * c; Sss += s * s; Scs += c * s; Sc += c; Ss += s; S1 += 1; Syc += y * c; Sys += y * s; Sy += y;
  }
  // normal equations for y ≈ a cos + b sin + m
  const A = [[Scc, Scs, Sc], [Scs, Sss, Ss], [Sc, Ss, S1]], B = [Syc, Sys, Sy];
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3(A), col = (k) => A.map((row, i) => row.map((x, j) => (j === k ? B[i] : x)));
  const a = det3(col(0)) / D, b = det3(col(1)) / D, m = det3(col(2)) / D;
  return { amp: Math.hypot(a, b), phase: Math.atan2(-b, a), mean: m };
}

// ---------------------------------------------------------------- block diagrams (data units on an `equal` stage)
function rrectPts(x0, y0, x1, y1, r) {
  const pts = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); arc(x1 - r, y0 + r, 1.5 * Math.PI);
  return pts;
}
/** A block centred at (x, y), w × h, with a TeX label; st: {color, active, fill, fillAlpha, sub (caption above), size, dim}. */
export function bdBlock(s, x, y, w, h, label, st = {}) {
  const col = st.color || 'ink', a = st.dim ? 0.35 : 1;
  s.poly(rrectPts(x - w / 2, y - h / 2, x + w / 2, y + h / 2, Math.min(w, h) * 0.16), { fill: 'panel', fillAlpha: 1, stroke: false });
  s.poly(rrectPts(x - w / 2, y - h / 2, x + w / 2, y + h / 2, Math.min(w, h) * 0.16),
    { fill: st.fill || col, fillAlpha: st.fillAlpha ?? (st.active ? 0.2 : 0.07), color: col, width: st.active ? 2.6 : 1.6, alpha: a });
  if (label) s.tex(label, x, y, { size: st.size || 16, color: st.labelColor || 'ink', alpha: a });
  if (st.sub) s.text(st.sub, x, y + h / 2, { size: 10.5, color: st.subColor || 'muted', align: 'center', baseline: 'bottom', dy: -3, alpha: a });
}
/** Summing junction; signs = {w: '+', s: '−', n: …, e: …} placed beside the inputs. */
export function bdSum(s, x, y, r, signs = {}, st = {}) {
  const col = st.color || 'ink';
  s.circle(x, y, r, { fill: 'panel', fillAlpha: 1, color: col, width: st.active ? 2.6 : 1.6 });
  const k = r * 0.7071; s.line(x - k, y - k, x + k, y + k, { color: 'faint', width: 1 }); s.line(x - k, y + k, x + k, y - k, { color: 'faint', width: 1 });
  const off = { w: [-1.35, 1.05], s: [1.05, -1.35], n: [1.05, 1.35], e: [1.35, 1.05] };
  for (const [dir, sg] of Object.entries(signs)) { const [dx, dy] = off[dir]; s.text(sg, x + dx * r, y + dy * r, { size: 14, weight: 700, color: sg === '−' ? 'red' : 'ink', align: 'center' }); }
}
/** Wire along a polyline, with an arrowhead at the end (st.arrow = false for none). */
export function bdWire(s, pts, st = {}) {
  const col = st.color || 'muted', w = st.width ?? 1.7;
  if (pts.length > 2) s.path(pts.slice(0, -1), { color: col, width: w, dash: st.dash, alpha: st.alpha });
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  if (st.arrow === false) s.line(a[0], a[1], b[0], b[1], { color: col, width: w, dash: st.dash, alpha: st.alpha });
  else s.arrow(a[0], a[1], b[0], b[1], { color: col, width: w, head: st.head ?? 8, dash: st.dash, alpha: st.alpha });
}
/** Length of a polyline and the point at arc length u along it. */
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
export function polyAt(pts, u) {
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (u <= l || i === pts.length - 1) { const f = l ? Math.min(1, u / l) : 0; return [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])]; }
    u -= l;
  }
  return pts[pts.length - 1];
}
/** Small dots streaming along a wire (phase in data units of arc length). */
export function flowDots(s, pts, phase, gap, st = {}) {
  const L = polyLen(pts), out = [];
  for (let u = ((phase % gap) + gap) % gap; u < L - 0.05; u += gap) out.push(polyAt(pts, u));
  s.dots(out, { r: st.r ?? 2.4, color: st.color || 'gold', alpha: st.alpha });
}

// ---------------------------------------------------------------- the Watt governor (dimensionless units: g/l = 1, gear ratio 1)
// State x = [ω engine speed, φ arm angle from the vertical, φ'].
//   φ'' = ω² sin φ cos φ − sin φ − β φ'                 (centrifugal lift, gravity, governor friction β)
//   J ω' = Ts·u(φ) − TL − c ω                          (steam torque through the valve, load torque, engine friction)
//   u(φ) = clamp(u0 − K (cos φ0 − cos φ), 0, 1)         (the sleeve rises by 1 − cos φ and closes the valve, gain K)
export const GOV = { phi0: (40 * Math.PI) / 180, phiMin: (12 * Math.PI) / 180, phiMax: (72 * Math.PI) / 180, J: 4, c: 0.05, Ts: 1, u0: 0.5 };
GOV.w0 = 1 / Math.sqrt(Math.cos(GOV.phi0));
/** Design load: the torque the engine carries at the design speed with the valve half open. */
GOV.TL0 = GOV.Ts * GOV.u0 - GOV.c * GOV.w0;
export const govValve = (p, phi) => Math.min(1, Math.max(0, GOV.u0 - p.K * (Math.cos(GOV.phi0) - Math.cos(phi))));
/** One RK4 step of length h (in place), with mechanical stops on the arm angle. */
export function govStep(p, x, h, TL) {
  const f = (y) => {
    const [w, phi, dphi] = y;
    return [(GOV.Ts * govValve(p, phi) - TL - GOV.c * w) / GOV.J, dphi, w * w * Math.sin(phi) * Math.cos(phi) - Math.sin(phi) - p.beta * dphi];
  };
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  const k1 = f(x), k2 = f(add(x, k1, h / 2)), k3 = f(add(x, k2, h / 2)), k4 = f(add(x, k3, h));
  for (let i = 0; i < 3; i++) x[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  if (x[1] < GOV.phiMin) { x[1] = GOV.phiMin; if (x[2] < 0) x[2] = 0; }
  if (x[1] > GOV.phiMax) { x[1] = GOV.phiMax; if (x[2] > 0) x[2] = 0; }
  if (x[0] < 0) x[0] = 0;
  return x;
}
/** Steady state for load TL: the arm angle where the valve's torque balances load + friction at ω = 1/√cos φ. */
export function govEquilibrium(p, TL) {
  const g = (phi) => GOV.Ts * govValve(p, phi) - TL - GOV.c / Math.sqrt(Math.cos(phi));
  let lo = GOV.phiMin, hi = GOV.phiMax;
  if (g(lo) < 0) return { phi: lo, w: 1 / Math.sqrt(Math.cos(lo)), stop: 'low' };
  if (g(hi) > 0) return { phi: hi, w: 1 / Math.sqrt(Math.cos(hi)), stop: 'high' };
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; }
  const phi = (lo + hi) / 2;
  return { phi, w: 1 / Math.sqrt(Math.cos(phi)) };
}
/**
 * Linearisation about the steady state for load TL: the characteristic cubic a3 s³ + a2 s² + a1 s + a0 of
 * (J s + c)(s² + β s + κ) + a G = 0, with κ = sin²φ/cos φ, a = 2ω sin φ cos φ, G = K Ts sin φ (valve slope).
 */
export function govCubic(p, TL = GOV.TL0) {
  const { phi, w } = govEquilibrium(p, TL);
  const kap = (Math.sin(phi) ** 2) / Math.cos(phi), a = 2 * w * Math.sin(phi) * Math.cos(phi);
  const u = GOV.u0 - p.K * (Math.cos(GOV.phi0) - Math.cos(phi)), G = u > 0 && u < 1 ? p.K * GOV.Ts * Math.sin(phi) : 0;
  const { J, c } = GOV, beta = p.beta;
  const coef = [c * kap + a * G, J * kap + c * beta, J * beta + c, J];
  return { coef, kap, a, G, phi, w, middle: coef[2] * coef[1], outer: coef[3] * coef[0] };
}
/** Real roots and complex pairs of a real cubic (ascending coefficients), by the trigonometric / Cardano formulas. */
export function cubicRoots(c) {
  const [d, cc, b, a] = c, B = b / a, Cc = cc / a, Dd = d / a;
  const p = Cc - (B * B) / 3, q = (2 * B ** 3) / 27 - (B * Cc) / 3 + Dd, sh = -B / 3, disc = (q * q) / 4 + (p ** 3) / 27;
  if (disc > 1e-15) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(disc)), v = Math.cbrt(-q / 2 - Math.sqrt(disc));
    return [[u + v + sh, 0], [-(u + v) / 2 + sh, (Math.sqrt(3) / 2) * (u - v)], [-(u + v) / 2 + sh, -(Math.sqrt(3) / 2) * (u - v)]];
  }
  if (Math.abs(p) < 1e-14) return [[sh, 0], [sh, 0], [sh, 0]];
  const r = 2 * Math.sqrt(-p / 3), th = Math.acos(Math.max(-1, Math.min(1, (3 * q) / (p * r)))) / 3;
  return [0, 1, 2].map((k) => [r * Math.cos(th - (2 * Math.PI * k) / 3) + sh, 0]);
}

// ---------------------------------------------------------------- fixed-step simulation driven by the animation clock
/**
 * sim.to(T) advances the state in steps of dt up to the clock time T (restarting from reset() when the clock went
 * back, e.g. after the restart button or a period wrap). The state therefore depends only on T and on the controls,
 * so a still frame (checker still mode) is reproducible.
 */
export function clocked(dt, reset, step) {
  const S = {
    t: 0, state: null, dt,
    to(T) {
      if (S.state === null || T < S.t - 1e-9) { S.state = reset(); S.t = 0; }
      let guard = 0;
      while (S.t + dt <= T + 1e-9 && guard++ < 200000) { step(S.state, S.t, dt); S.t += dt; }
      return S.state;
    },
    restart() { S.state = null; },
  };
  return S;
}

/** Draw a time series (arrays) on a stage, skipping non-finite values. */
export function trace(s, ts, ys, st = {}) {
  const pts = new Array(ts.length);
  for (let i = 0; i < ts.length; i++) pts[i] = isFinite(ys[i]) ? [ts[i], ys[i]] : null;
  s.path(pts, st);
}

// ---------------------------------------------------------------- a car on a road (SI units)
// m dv/dt = Fmax·u − kd (v + w)|v + w| − m g Cr − m g sin θ   (throttle u ∈ [−1, 1], negative = braking; headwind w)
export const CAR = { m0: 1500, Fmax: 4500, kd: 0.42, Cr: 0.01, g: 9.81, vr: 25 };
export const sinGrade = (gr) => gr / Math.sqrt(1 + gr * gr);
export function carAccel(v, u, grade, m, wind = 0, Fmax = CAR.Fmax) {
  const va = v + wind;
  return (Fmax * u - CAR.kd * va * Math.abs(va) - m * CAR.g * CAR.Cr - m * CAR.g * sinGrade(grade)) / m;
}
/** Throttle that holds speed vr on a flat road with no wind for mass m. */
export const carTrim = (vr = CAR.vr, m = CAR.m0, Fmax = CAR.Fmax) => (CAR.kd * vr * vr + m * CAR.g * CAR.Cr) / Fmax;
/** Side view of a car whose wheels touch (x, y), tilted by angle ang (rad); st: {color, alpha, scale, label}. */
export function drawCar(s, x, y, ang, st = {}) {
  const k = st.scale ?? 1, ca = Math.cos(ang), sa = Math.sin(ang), col = st.color || 'accent', al = st.alpha ?? 1;
  const P = (px, py) => [x + k * (px * ca - py * sa), y + k * (px * sa + py * ca)];
  const body = [[-2.25, 0.32], [2.25, 0.32], [2.3, 0.85], [1.35, 1.0], [0.75, 1.5], [-1.05, 1.5], [-1.65, 1.0], [-2.3, 0.92]].map(([a, b]) => P(a, b));
  const win = [[0.62, 1.05], [0.45, 1.38], [-0.95, 1.38], [-1.35, 1.05]].map(([a, b]) => P(a, b));
  s.poly(body, { fill: col, fillAlpha: 0.85 * al, color: col, width: 1.4, alpha: al });
  s.poly(win, { fill: 'panel', fillAlpha: 0.75 * al, stroke: false });
  for (const wx of [-1.4, 1.4]) { const c = P(wx, 0.36); s.circle(c[0], c[1], 0.36 * k, { fill: 'ink', fillAlpha: al, color: 'panel', width: 1.2, alpha: al }); }
}
