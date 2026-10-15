// Human Physiology — Chapter 1: helpers shared by ch01.js and ch01-b.js
// (physical constants, Nernst/GHK, ion colours and concentrations, a pump–leak cell model,
//  block-diagram drawing, membrane drawing, a fixed-step clock and small numerics)

// ---------------------------------------------------------------- constants and ions
export const R_GAS = 8.314462618, FARADAY = 96485.33212;
/** Thermal voltage RT/F in mV at temperature Tc (°C). 26.73 mV at 37 °C. */
export const VT = (Tc = 37) => (1000 * R_GAS * (Tc + 273.15)) / FARADAY;
/** Ion colours used throughout the physiology and neuroscience chapters. */
export const ION_COL = { Na: 'orange', K: 'purple', Cl: 'green', Ca: 'teal', A: 'muted' };
export const ION_TEX = { Na: '\\mathrm{Na^+}', K: '\\mathrm{K^+}', Cl: '\\mathrm{Cl^-}', Ca: '\\mathrm{Ca^{2+}}' };
export const ION_Z = { Na: 1, K: 1, Cl: -1, Ca: 2 };
/**
 * Typical mammalian neuron (mM): Purves et al., Neuroscience, Table 2.1 (K⁺ 140 in / 5 out, Na⁺ 5–15 in / 145 out,
 * Cl⁻ 4–30 in / 110 out, Ca²⁺ 0.0001 in / 1–2 out); we take Na⁺ᵢ = 12, Cl⁻ᵢ = 4 (Hille's mammalian muscle values).
 */
export const NEURON = { K: { i: 140, o: 5 }, Na: { i: 12, o: 145 }, Cl: { i: 4, o: 110 }, Ca: { i: 1e-4, o: 2 } };
/** Squid giant axon in seawater (mM), as used by Hodgkin & Katz 1949: axoplasm K 345, Na 72, Cl 61 (Steinbach); seawater K 10, Na 465, Cl 587 (their Table 7). */
export const SQUID = { K: { i: 345, o: 10 }, Na: { i: 72, o: 465 }, Cl: { i: 61, o: 587 }, Ca: { i: 1e-4, o: 10 } };
/** Hodgkin & Katz (1949): P_K : P_Na : P_Cl = 1 : 0.04 : 0.45 at rest and 1 : 20 : 0.45 at the peak of the spike. */
export const HK_REST = { K: 1, Na: 0.04, Cl: 0.45 }, HK_PEAK = { K: 1, Na: 20, Cl: 0.45 };

/** Nernst potential (mV) of an ion with valence z. */
export const nernst = (z, co, ci, Tc = 37) => (VT(Tc) / z) * Math.log(co / ci);
/** GHK voltage equation (mV) for monovalent K, Na, Cl; P = {K, Na, Cl}, conc = {K: {i, o}, …}. */
export function ghkV(P, conc, Tc = 37) {
  const num = P.K * conc.K.o + P.Na * conc.Na.o + P.Cl * conc.Cl.i;
  const den = P.K * conc.K.i + P.Na * conc.Na.i + P.Cl * conc.Cl.o;
  return VT(Tc) * Math.log(num / den);
}
/** Outward GHK flux factor  u (cᵢ − cₒ e^{−u}) / (1 − e^{−u}),  u = zV/V_T  (→ cᵢ − cₒ as u → 0). Multiply by P. */
export function ghkFlux(z, ci, co, V, Tc = 37) {
  const u = (z * V) / VT(Tc);
  if (Math.abs(u) < 1e-6) return ci - co + (u / 2) * (ci + co);
  const e = Math.exp(-u);
  return (u * (ci - co * e)) / (1 - e);
}
/** Outward GHK current density factor z·flux (so that Σ P·z·flux = 0 at the GHK voltage). */
export const ghkCurrent = (z, ci, co, V, Tc = 37) => z * ghkFlux(z, ci, co, V, Tc);

// ---------------------------------------------------------------- small numerics
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function bisect(f, a, b, n = 60) {
  let fa = f(a);
  for (let i = 0; i < n; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}
/** One RK4 step for an array state (returns a new array). */
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
/**
 * Fixed-step simulation driven by the animation clock: sim.to(T) advances in steps of dt up to clock time T,
 * restarting from reset() when the clock went back (restart button, period wrap) — so the state depends only on T.
 */
export function clocked(dt, reset, step) {
  const S = {
    t: 0, state: null,
    to(T) {
      if (S.state === null || T < S.t - 1e-9) { S.state = reset(); S.t = 0; }
      let guard = 0;
      while (S.t + dt <= T + 1e-9 && guard++ < 400000) { step(S.state, S.t, dt); S.t += dt; }
      return S.state;
    },
    restart() { S.state = null; },
  };
  return S;
}

// ---------------------------------------------------------------- drawing helpers (data units)
/** A labelled box centred at (x, y); st: {color, fill, fillAlpha, active, sub (above), note (below), size, radius, labelColor}. */
export function box(s, x, y, w, h, label, st = {}) {
  const col = st.color || 'ink';
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: 'panel', fillAlpha: 1, stroke: false, radius: st.radius ?? 8 });
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: st.fill || col, fillAlpha: st.fillAlpha ?? (st.active ? 0.2 : 0.06), color: col, width: st.active ? 2.4 : 1.5, radius: st.radius ?? 8 });
  if (label) {
    if (st.math === false) s.text(label, x, y, { size: st.size || 12, color: st.labelColor || 'ink', align: 'center', baseline: 'middle', weight: 600 });
    else s.tex(label, x, y, { size: st.size || 14, color: st.labelColor || 'ink' });
  }
  if (st.sub) s.text(st.sub, x, y + h / 2, { size: 10.5, color: st.subColor || 'muted', align: 'center', baseline: 'bottom', dy: -3 });
  if (st.note) s.text(st.note, x + (st.noteDx || 0), y - h / 2, { size: 11, color: st.noteColor || 'ink', align: 'center', baseline: 'top', dy: 4, weight: 600 });
}
/** Summing junction with signs placed at {w, n, s, e}. */
export function sumJ(s, x, y, r, signs = {}) {
  s.circle(x, y, r, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 1.6 });
  const k = r * 0.7071;
  s.line(x - k, y - k, x + k, y + k, { color: 'faint', width: 1 }); s.line(x - k, y + k, x + k, y - k, { color: 'faint', width: 1 });
  const off = { w: [-1.5, 0.9], s: [0.9, -1.5], n: [0.9, 1.5], e: [1.5, 0.9] };
  for (const [d, sg] of Object.entries(signs)) { const [dx, dy] = off[d]; s.text(sg, x + dx * r, y + dy * r, { size: 14, weight: 700, color: sg === '−' ? 'red' : 'ink', align: 'center', baseline: 'middle' }); }
}
/** Wire along a polyline with an arrowhead at the end. */
export function wire(s, pts, st = {}) {
  const col = st.color || 'muted', w = st.width ?? 1.7;
  if (pts.length > 2) s.path(pts.slice(0, -1), { color: col, width: w, dash: st.dash, alpha: st.alpha });
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  if (st.arrow === false) s.line(a[0], a[1], b[0], b[1], { color: col, width: w, dash: st.dash, alpha: st.alpha });
  else s.arrow(a[0], a[1], b[0], b[1], { color: col, width: w, head: st.head ?? 8, dash: st.dash, alpha: st.alpha });
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function polyAt(pts, u) {
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (u <= l || i === pts.length - 1) { const f = l ? Math.min(1, u / l) : 0; return [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])]; }
    u -= l;
  }
  return pts[pts.length - 1];
}
/** Dots streaming along a polyline (phase in data units of arc length). */
export function flowDots(s, pts, phase, gap, st = {}) {
  const L = polyLen(pts), out = [];
  for (let u = ((phase % gap) + gap) % gap; u < L - 0.05; u += gap) out.push(polyAt(pts, u));
  s.dots(out, { r: st.r ?? 2.4, color: st.color || 'gold', alpha: st.alpha });
}
/**
 * A lipid bilayer drawn across a rectangle. vertical = true: the membrane runs up the page between x0 and x1;
 * otherwise it runs across between y0 and y1. Heads are dots, tails short lines. gaps: [[a, b], …] along the run.
 */
export function bilayer(s, x0, x1, y0, y1, st = {}) {
  const vert = st.vertical !== false, col = st.color || 'muted', gaps = st.gaps || [];
  const inGap = (u) => gaps.some(([a, b]) => u > a && u < b);
  const pxPer = vert ? Math.abs(s.Y(y0) - s.Y(y1)) / Math.abs(y1 - y0) : Math.abs(s.X(x1) - s.X(x0)) / Math.abs(x1 - x0);
  const step = (st.spacing ?? 9) / pxPer, heads = [];
  s.rect(x0, y0, x1, y1, { fill: st.fill || 'gold', fillAlpha: st.fillAlpha ?? 0.1, stroke: false });
  if (vert) {
    const w = x1 - x0;
    for (let y = y0 + step / 2; y < y1; y += step) {
      if (inGap(y)) continue;
      heads.push([x0 + w * 0.12, y], [x1 - w * 0.12, y]);
      s.line(x0 + w * 0.12, y, x0 + w * 0.46, y, { color: col, width: 1, alpha: 0.6 });
      s.line(x1 - w * 0.12, y, x1 - w * 0.54, y, { color: col, width: 1, alpha: 0.6 });
    }
  } else {
    const h = y1 - y0;
    for (let x = x0 + step / 2; x < x1; x += step) {
      if (inGap(x)) continue;
      heads.push([x, y0 + h * 0.12], [x, y1 - h * 0.12]);
      s.line(x, y0 + h * 0.12, x, y0 + h * 0.46, { color: col, width: 1, alpha: 0.6 });
      s.line(x, y1 - h * 0.12, x, y1 - h * 0.54, { color: col, width: 1, alpha: 0.6 });
    }
  }
  s.dots(heads, { r: st.r ?? 2.6, color: col, alpha: 0.85 });
}

// ---------------------------------------------------------------- the pump–leak cell (Keener & Sneyd §2.6.3; Tosteson & Hoffman 1960)
// Amounts N (mM of reference volume) of Na, K, Cl; impermeant intracellular anion X (z = −1); relative volume w.
// Outward passive fluxes are GHK: J_i = P_i·u(cᵢ − cₒe^{−u})/(1 − e^{−u}); the pump moves 3 Na out and 2 K in at rate
// p = p_max·(Naᵢ/(Naᵢ + K_p))³. V is fixed at each instant by zero net current, Σ z_i J_i + p = 0 (the cell stays
// electroneutral), and water follows so fast that the cell is always isosmotic: w = (N_Na + N_K + N_Cl + X)/osmₒ.
export const PL = (() => {
  const T = 37, out = { Na: 145, K: 5, Cl: 110 }, osmE = 304; // plus 40 mM impermeant anions and ~4 mM glucose outside
  const Vss = -70, Na = 12, K = 140, Cl = out.Cl * Math.exp(Vss / VT(T)); // chloride is passively distributed at rest
  const X = Na + K - Cl; // electroneutrality
  const PK = 0.2; // min⁻¹ (sets the time scale: potassium leaks out at ~3 mM/min when the pump stops)
  const jK = ghkFlux(1, K, out.K, Vss, T), jNa = ghkFlux(1, Na, out.Na, Vss, T);
  const pss = (PK * jK) / 2, PNa = (3 * pss) / -jNa, Kp = 10, pmax = pss / (Na / (Na + Kp)) ** 3;
  return { T, out, osmE, Vss, Na, K, Cl, X, PK, PNa, PCl: 0.45 * PK, Kp, pmax, pss };
})();
/** Zero-current voltage of the pump–leak cell (mV). */
export function plVoltage(c, P, pump) {
  const f = (V) => P.K * ghkFlux(1, c.K, PL.out.K, V, PL.T) + P.Na * ghkFlux(1, c.Na, PL.out.Na, V, PL.T) - P.Cl * ghkFlux(-1, c.Cl, PL.out.Cl, V, PL.T) + pump;
  return bisect(f, -160, 120, 50);
}
/**
 * Integrate the pump–leak cell. opts: {tEnd (min), dt, pumpOn: t => 0…1, leak (× P_Na), fixedVolume, y0}.
 * Returns {t, Na, K, Cl, V, w, pump} arrays.
 */
export function pumpLeak(o = {}) {
  const tEnd = o.tEnd ?? 60, dt = o.dt ?? 0.05, leak = o.leak ?? 1, pumpOn = o.pumpOn || (() => 1);
  const P = { K: PL.PK, Na: PL.PNa * leak, Cl: PL.PCl };
  const conc = (y) => { const w = o.fixedVolume ? 1 : (y[0] + y[1] + y[2] + PL.X) / PL.osmE; return { Na: y[0] / w, K: y[1] / w, Cl: y[2] / w, w }; };
  const rate = (c, t) => pumpOn(t) * PL.pmax * (c.Na / (c.Na + PL.Kp)) ** 3;
  const f = (y, t) => {
    const c = conc(y), p = rate(c, t), V = plVoltage(c, P, p);
    return [-P.Na * ghkFlux(1, c.Na, PL.out.Na, V, PL.T) - 3 * p, -P.K * ghkFlux(1, c.K, PL.out.K, V, PL.T) + 2 * p, -P.Cl * ghkFlux(-1, c.Cl, PL.out.Cl, V, PL.T)];
  };
  let y = o.y0 ? o.y0.slice() : [PL.Na, PL.K, PL.Cl];
  const res = { t: [], Na: [], K: [], Cl: [], V: [], w: [], pump: [] };
  const n = Math.round(tEnd / dt);
  for (let k = 0; k <= n; k++) {
    const t = k * dt, c = conc(y), p = rate(c, t);
    res.t.push(t); res.Na.push(c.Na); res.K.push(c.K); res.Cl.push(c.Cl); res.w.push(c.w); res.pump.push(p); res.V.push(plVoltage(c, P, p));
    if (k < n) y = rk4(f, y, t, dt);
  }
  return res;
}
