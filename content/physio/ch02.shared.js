// Human Physiology — Chapter 2: helpers shared by ch02.js and ch02-b.js
// (Hodgkin–Huxley axon, Li–Rinzel calcium oscillator, Huxley cross-bridge solver, Mitchell–Schaeffer
//  ventricular cell, a reduced sinoatrial cell, Hill relations, small numerics and drawing helpers)

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function rk4(f, y, t, h) {
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  const k1 = f(y, t), k2 = f(add(y, k1, h / 2), t + h / 2), k3 = f(add(y, k2, h / 2), t + h / 2), k4 = f(add(y, k3, h), t + h);
  return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Draw a time series (arrays) on a stage, skipping non-finite values. */
export function trace(s, ts, ys, st = {}) {
  const pts = new Array(ts.length);
  for (let i = 0; i < ts.length; i++) pts[i] = isFinite(ys[i]) ? [ts[i], ys[i]] : null;
  s.path(pts, st);
}
/** Index of the last sample with ts[i] ≤ t. */
export function idxAt(ts, t) {
  let lo = 0, hi = ts.length - 1;
  if (t <= ts[0]) return 0; if (t >= ts[hi]) return hi;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  return lo;
}
/** Interpolated value of a sampled series at time t. */
export function at(ts, ys, t) {
  const i = idxAt(ts, t); if (i >= ts.length - 1) return ys[ys.length - 1];
  const f = (t - ts[i]) / (ts[i + 1] - ts[i]); return ys[i] + f * (ys[i + 1] - ys[i]);
}
/** Local maxima above a threshold (returns indices). */
export function peaks(ys, thr) {
  const out = [];
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > thr && ys[i] >= ys[i - 1] && ys[i] > ys[i + 1]) out.push(i);
  return out;
}

// ------------------------------------------------------------------ Hodgkin–Huxley (1952), modern sign convention
// Squid giant axon at 6.3 °C; V is the membrane potential in mV (rest −65 mV), conductances in mS/cm², current in µA/cm².
export const HH = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387, Vrest: -65, T0: 6.3, Q10: 3 };
const vtrap = (x, y) => (Math.abs(x / y) < 1e-6 ? y * (1 - x / y / 2) : x / (1 - Math.exp(-x / y)));
export const hhRates = (V) => ({
  an: 0.01 * vtrap(V + 55, 10), bn: 0.125 * Math.exp(-(V + 65) / 80),
  am: 0.1 * vtrap(V + 40, 10), bm: 4 * Math.exp(-(V + 65) / 18),
  ah: 0.07 * Math.exp(-(V + 65) / 20), bh: 1 / (1 + Math.exp(-(V + 35) / 10)),
});
/** Steady state of the gates at voltage V. */
export function hhRest(V = HH.Vrest) { const r = hhRates(V); return [V, r.an / (r.an + r.bn), r.am / (r.am + r.bm), r.ah / (r.ah + r.bh)]; }
/**
 * Integrate the HH axon. o: {tEnd (ms), dt, Tc (°C), stim: t => µA/cm², gNaScale, gKScale, ENa, EK, y0}.
 * Returns {t, V, m, n, h, gNa, gK, INa, IK, IL}  (currents positive = outward).
 */
export function hhRun(o = {}) {
  const tEnd = o.tEnd ?? 20, dt = o.dt ?? 0.02, Tc = o.Tc ?? HH.T0, stim = o.stim || (() => 0);
  const phi = HH.Q10 ** ((Tc - HH.T0) / 10), sNa = o.gNaScale ?? 1, sK = o.gKScale ?? 1, ENa = o.ENa ?? HH.ENa, EK = o.EK ?? HH.EK;
  const f = (y, t) => {
    const [V, n, m, h] = y, r = hhRates(V);
    const I = HH.gNa * sNa * m ** 3 * h * (V - ENa) + HH.gK * sK * n ** 4 * (V - EK) + HH.gL * (V - HH.EL);
    return [(stim(t) - I) / HH.C, phi * (r.an * (1 - n) - r.bn * n), phi * (r.am * (1 - m) - r.bm * m), phi * (r.ah * (1 - h) - r.bh * h)];
  };
  let y = o.y0 ? o.y0.slice() : hhRest();
  const R = { t: [], V: [], m: [], n: [], h: [], gNa: [], gK: [], INa: [], IK: [], IL: [] };
  const N = Math.round(tEnd / dt);
  for (let k = 0; k <= N; k++) {
    const t = k * dt, [V, n, m, h] = y;
    const gNa = HH.gNa * sNa * m ** 3 * h, gK = HH.gK * sK * n ** 4;
    R.t.push(t); R.V.push(V); R.m.push(m); R.n.push(n); R.h.push(h); R.gNa.push(gNa); R.gK.push(gK);
    R.INa.push(gNa * (V - ENa)); R.IK.push(gK * (V - EK)); R.IL.push(HH.gL * (V - HH.EL));
    if (k < N) y = rk4(f, y, t, dt);
  }
  return R;
}

// ------------------------------------------------------------------ Li–Rinzel calcium oscillator (Keener & Sneyd §7.5; Li & Rinzel 1994)
// c = cytosolic Ca²⁺ (µM), h = IP₃-receptor inactivation, p = IP₃ (µM). Total Ca fixed: c₀ = c + c₁·c_ER.
export const LR = { v1: 6, v2: 0.11, v3: 0.9, k3: 0.1, d1: 0.13, d2: 1.049, d3: 0.9434, d5: 0.08234, a2: 0.2, c0: 2, c1: 0.185 };
export function lrRHS(c, h, p, P = LR) {
  const ce = (P.c0 - c) / P.c1;
  const minf = p / (p + P.d1), ninf = c / (c + P.d5);
  const Q2 = P.d2 * (p + P.d1) / (p + P.d3), hinf = Q2 / (Q2 + c), tau = 1 / (P.a2 * (Q2 + c));
  const Jipr = P.v1 * (minf * ninf * h) ** 3 * (ce - c), Jleak = P.v2 * (ce - c), Jser = P.v3 * c * c / (P.k3 * P.k3 + c * c);
  return { dc: Jipr + Jleak - Jser, dh: (hinf - h) / tau, Jipr, Jleak, Jser, hinf, ninf, minf, Q2 };
}
/** Integrate (c, h) for tEnd seconds. o: {p, c0, h0, dt, tEnd, P}. */
export function lrRun(o) {
  const P = o.P || LR, dt = o.dt ?? 0.01, N = Math.round((o.tEnd ?? 200) / dt);
  const f = (y) => { const r = lrRHS(y[0], y[1], o.p, P); return [r.dc, r.dh]; };
  let y = [o.c0 ?? 0.1, o.h0 ?? 0.8]; const R = { t: [], c: [], h: [] };
  for (let k = 0; k <= N; k++) { R.t.push(k * dt); R.c.push(y[0]); R.h.push(y[1]); if (k < N) y = rk4(f, y, k * dt, dt); }
  return R;
}

// ------------------------------------------------------------------ Mitchell–Schaeffer ventricular cell (2003)
// Dimensionless v ∈ [0, 1] (mapped to −85 … +40 mV for display), times in ms.
export const MS = { tin: 0.3, tout: 6, topen: 120, tclose: 150, vgate: 0.13 };
export const msToMV = (v) => -85 + 125 * v;
/** o: {tEnd, dt, stimTimes: [ms], stimDur, stimAmp, tclose, tout}. Returns {t, v, h, mV, Jin, Jout}. */
export function msRun(o = {}) {
  const P = { ...MS, tclose: o.tclose ?? MS.tclose, tout: o.tout ?? MS.tout };
  const dt = o.dt ?? 0.05, N = Math.round((o.tEnd ?? 600) / dt), st = o.stimTimes || [0], dur = o.stimDur ?? 1, amp = o.stimAmp ?? 0.6;
  let v = 0, h = 1; const R = { t: [], v: [], h: [], mV: [], Jin: [], Jout: [] };
  for (let k = 0; k <= N; k++) {
    const t = k * dt;
    const Jin = (h * v * v * (1 - v)) / P.tin, Jout = -v / P.tout;
    R.t.push(t); R.v.push(v); R.h.push(h); R.mV.push(msToMV(v)); R.Jin.push(Jin); R.Jout.push(Jout);
    let J = Jin + Jout; for (const s of st) if (t >= s && t < s + dur) J += amp;
    const dh = v < P.vgate ? (1 - h) / P.topen : -h / P.tclose;
    v += dt * J; h += dt * dh; v = clamp(v, -0.2, 1.5);
  }
  return R;
}

// ------------------------------------------------------------------ Huxley (1957) cross-bridge model
// Distance x of a myosin head from its rest position, in units of the reach h; attachment rate f, detachment rate g (s⁻¹).
export const HUX = { f1: 43.3, g1: 10, g2: 209 };
export const huxF = (x, P = HUX) => (x > 0 && x <= 1 ? P.f1 * x : 0);
export const huxG = (x, P = HUX) => (x < 0 ? P.g2 : P.g1 * x);
/**
 * Steady-state fraction of attached heads n(x) for shortening speed w (in h/s; the filaments slide so that x decreases at rate w).
 * Integrates −w dn/dx = f(1−n) − g n from x = 1 (n = 0 beyond the reach) down to x = xmin. Returns {x, n, F} where
 * F = ∫ x n dx is the force per unit of (stiffness × bridge density × h²), and the number of attached bridges Σn.
 */
export function huxSolve(w, P = HUX, xmin = -2.5, N = 700) {
  const xs = [], ns = []; const dx = (1 - xmin) / N;
  if (w <= 1e-9) {
    for (let k = 0; k <= N; k++) { const x = xmin + k * dx, f = huxF(x, P), g = huxG(x, P); xs.push(x); ns.push(f + g < 1e-12 ? P.f1 / (P.f1 + P.g1) : f / (f + g)); }
  } else {
    const rhs = (x, n) => -(huxF(x, P) * (1 - n) - huxG(x, P) * n) / w;
    let n = 0; xs[N] = 1; ns[N] = 0;
    for (let k = N - 1; k >= 0; k--) {
      const x = xmin + (k + 1) * dx, hh = -dx;
      const k1 = rhs(x, n), k2 = rhs(x + hh / 2, n + (hh / 2) * k1), k3 = rhs(x + hh / 2, n + (hh / 2) * k2), k4 = rhs(x + hh, n + hh * k3);
      n += (hh / 6) * (k1 + 2 * k2 + 2 * k3 + k4); n = clamp(n, 0, 1);
      xs[k] = xmin + k * dx; ns[k] = n;
    }
  }
  let F = 0, B = 0;
  for (let k = 0; k < N; k++) { F += 0.5 * (xs[k] * ns[k] + xs[k + 1] * ns[k + 1]) * dx; B += 0.5 * (ns[k] + ns[k + 1]) * dx; }
  return { x: xs, n: ns, F, B };
}

// ------------------------------------------------------------------ Hill's relation
/** v(F) from (F + a)(v + b) = (F0 + a) b, with F0 = 1 and a = a/F0, b = a·vmax-scale: v = b (1 − F)/(F + a). */
export const hillV = (F, a, b) => (b * (1 - F)) / (F + a);
export const hillF = (v, a, b) => ((1 + a) * b) / (v + b) - a;
/** Load of maximum power, F0 = 1. */
export const hillFopt = (a) => Math.sqrt(a * (a + 1)) - a;

// ------------------------------------------------------------------ drawing helpers
/** Dots streaming along a polyline (phase in data units of arc length). */
export function flowDots(s, pts, phase, gap, st = {}) {
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const at1 = (u) => {
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (u <= l || i === pts.length - 1) { const f = l ? Math.min(1, u / l) : 0; return [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])]; }
      u -= l;
    }
    return pts[pts.length - 1];
  };
  const out = [];
  for (let u = ((phase % gap) + gap) % gap; u < L - 0.02; u += gap) out.push(at1(u));
  s.dots(out, { r: st.r ?? 2.4, color: st.color || 'gold', alpha: st.alpha });
}
