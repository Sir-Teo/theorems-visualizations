// Computational Neuroscience — Chapter 1: helpers shared by ch01.js and ch01-b.js
// (thermal voltage, Nernst and GHK currents, ion colours, Hodgkin–Huxley rate functions in the modern convention,
//  a fixed-step clock, and small drawing helpers)

export const VT = (Tc = 37) => (1000 * 8.314462618 * (Tc + 273.15)) / 96485.33212;
export const ION_COL = { Na: 'orange', K: 'purple', Cl: 'green', Ca: 'teal', cat: 'pink' };
export const ION_Z = { Na: 1, K: 1, Cl: -1, Ca: 2 };
/** Typical mammalian neuron (mM), Purves et al., Neuroscience, Table 2.1 (Na⁺ᵢ 12 and Cl⁻ᵢ 4 chosen within its ranges). */
export const NEURON = { K: { i: 140, o: 5 }, Na: { i: 12, o: 145 }, Cl: { i: 4, o: 110 }, Ca: { i: 1e-4, o: 2 } };
export const nernst = (z, co, ci, Tc = 37) => (VT(Tc) / z) * Math.log(co / ci);
/** GHK current factor  z²·u·(cᵢ − cₒe^{−u})/(1 − e^{−u})·V_T  with u = zV/V_T (outward positive; units of P·mM·mV). */
export function ghkI(z, ci, co, V, Tc = 37) {
  const vt = VT(Tc), u = (z * V) / vt;
  if (Math.abs(u) < 1e-6) return z * vt * (ci - co + (u / 2) * (ci + co));
  const e = Math.exp(-u);
  return z * vt * ((u * (ci - co * e)) / (1 - e));
}
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------------------------------------------------------------- Hodgkin–Huxley (squid axon, 6.3 °C), V in mV with rest at −65 mV
// Rates in ms⁻¹ (Dayan & Abbott §5.6; Hodgkin & Huxley 1952 shifted by −65 mV).
const vtrap = (x, y) => (Math.abs(x / y) < 1e-6 ? y * (1 - x / y / 2) : x / (Math.exp(x / y) - 1));
export const HH = {
  C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387,
  an: (V) => 0.01 * vtrap(-(V + 55), 10), bn: (V) => 0.125 * Math.exp(-(V + 65) / 80),
  am: (V) => 0.1 * vtrap(-(V + 40), 10), bm: (V) => 4 * Math.exp(-(V + 65) / 18),
  ah: (V) => 0.07 * Math.exp(-(V + 65) / 20), bh: (V) => 1 / (1 + Math.exp(-(V + 35) / 10)),
};
/** Rates [α, β] of gate g ∈ {n, m, h} at V. */
export const gateRates = (g, V) => [HH['a' + g](V), HH['b' + g](V)];
export const gateInf = (g, V) => { const [a, b] = gateRates(g, V); return a / (a + b); };
export const gateTau = (g, V) => { const [a, b] = gateRates(g, V); return 1 / (a + b); };

// ---------------------------------------------------------------- numerics and drawing
export function idxAt(ts, t) {
  let lo = 0, hi = ts.length - 1;
  if (t <= ts[0]) return 0; if (t >= ts[hi]) return hi;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  return lo;
}
export function trace(s, ts, ys, st = {}) {
  const pts = new Array(ts.length);
  for (let i = 0; i < ts.length; i++) pts[i] = isFinite(ys[i]) ? [ts[i], ys[i]] : null;
  s.path(pts, st);
}
/** A lipid bilayer across a rectangle (horizontal membrane unless vertical: true); gaps along the run are left open. */
export function bilayer(s, x0, x1, y0, y1, st = {}) {
  const vert = !!st.vertical, col = st.color || 'muted', gaps = st.gaps || [];
  const inGap = (u) => gaps.some(([a, b]) => u > a && u < b);
  const pxPer = vert ? Math.abs(s.Y(y0) - s.Y(y1)) / Math.abs(y1 - y0) : Math.abs(s.X(x1) - s.X(x0)) / Math.abs(x1 - x0);
  const step = (st.spacing ?? 9) / pxPer, heads = [];
  s.rect(x0, y0, x1, y1, { fill: 'gold', fillAlpha: st.fillAlpha ?? 0.1, stroke: false });
  if (vert) {
    const w = x1 - x0;
    for (let y = y0 + step / 2; y < y1; y += step) { if (inGap(y)) continue; heads.push([x0 + w * 0.12, y], [x1 - w * 0.12, y]); s.line(x0 + w * 0.12, y, x0 + w * 0.46, y, { color: col, width: 1, alpha: 0.6 }); s.line(x1 - w * 0.12, y, x1 - w * 0.54, y, { color: col, width: 1, alpha: 0.6 }); }
  } else {
    const h = y1 - y0;
    for (let x = x0 + step / 2; x < x1; x += step) { if (inGap(x)) continue; heads.push([x, y0 + h * 0.12], [x, y1 - h * 0.12]); s.line(x, y0 + h * 0.12, x, y0 + h * 0.46, { color: col, width: 1, alpha: 0.6 }); s.line(x, y1 - h * 0.12, x, y1 - h * 0.54, { color: col, width: 1, alpha: 0.6 }); }
  }
  s.dots(heads, { r: st.r ?? 2.6, color: col, alpha: 0.85 });
}
