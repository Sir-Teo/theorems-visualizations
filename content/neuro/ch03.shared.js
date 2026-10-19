// Computational Neuroscience — Chapter 3: helpers shared by ch03.js and its part files
// (re-exports the chapter-2 helpers; adds a generic RK4 integrator, spike counting for planar models, the FitzHugh–Nagumo
//  equations, the Morris–Lecar model with its two textbook parameter sets, and the Ca²⁺-activated K⁺ bursting extension)
export * from './ch02.shared.js';
import { HH, gateInf, phiT } from './ch02.shared.js';

/** One classical RK4 step of y' = F(y) for an array state, returning a new array. */
export function rk4(F, y, dt) {
  const n = y.length, a = F(y), b = F(y.map((x, i) => x + 0.5 * dt * a[i])), c = F(y.map((x, i) => x + 0.5 * dt * b[i])), d = F(y.map((x, i) => x + dt * c[i]));
  const o = new Array(n);
  for (let i = 0; i < n; i++) o[i] = y[i] + (dt / 6) * (a[i] + 2 * b[i] + 2 * c[i] + d[i]);
  return o;
}
/** Upward crossings of level `thr` by component 0 of an orbit sampled every dt. Returns crossing times. */
export function crossings(ys, dt, thr, t0 = 0) {
  const out = [];
  for (let i = 1; i < ys.length; i++) if (ys[i - 1][0] < thr && ys[i][0] >= thr) out.push(t0 + (i - 1 + (thr - ys[i - 1][0]) / (ys[i][0] - ys[i - 1][0])) * dt);
  return out;
}

// ---------------------------------------------------------------- FitzHugh–Nagumo
// v' = v − v³/3 − w + I,  w' = ε (v + a − b w): the dimensionless form used in most textbooks (FitzHugh 1961; Nagumo et al. 1962 built the circuit).
export const FHN = { a: 0.7, b: 0.8, eps: 0.08 };
export const fhnF = (v, w, I, p = FHN) => [v - (v * v * v) / 3 - w + I, p.eps * (v + p.a - p.b * w)];
/** Real equilibrium of FHN (unique when b is small enough; here the cubic v − v³/3 − (v+a)/b + I = 0 is solved by bisection on its monotone branch). */
export function fhnRest(I, p = FHN) {
  const g = (v) => v - (v * v * v) / 3 - (v + p.a) / p.b + I;
  let lo = -4, hi = 4;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
  const v = (lo + hi) / 2; return [v, (v + p.a) / p.b];
}
/** Jacobian data at the equilibrium: trace, determinant, eigenvalues {re, im}. */
export function fhnEig(I, p = FHN) {
  const [v] = fhnRest(I, p), tr = 1 - v * v - p.eps * p.b, det = p.eps * (1 - p.b * (1 - v * v)), disc = tr * tr - 4 * det;
  const l = disc >= 0 ? [{ re: (tr + Math.sqrt(disc)) / 2, im: 0 }, { re: (tr - Math.sqrt(disc)) / 2, im: 0 }] : [{ re: tr / 2, im: Math.sqrt(-disc) / 2 }, { re: tr / 2, im: -Math.sqrt(-disc) / 2 }];
  return { v, tr, det, l };
}
/** Orbit sampled every dt from (v0, w0) (default: the rest state of I). */
export function fhnOrbit(I, T, { dt = 0.05, y0, p = FHN } = {}) {
  let y = y0 || fhnRest(I, p); const ys = [y], N = Math.round(T / dt), F = (s) => fhnF(s[0], s[1], I, p);
  for (let k = 0; k < N; k++) { y = rk4(F, y, dt); ys.push(y); }
  return ys;
}

// ---------------------------------------------------------------- Morris–Lecar
// C V' = I − gL (V−VL) − gCa m∞(V)(V−VCa) − gK w (V−VK),  w' = φ (w∞(V) − w)/τ-form with τ = 1/cosh((V−V3)/(2V4)).
// Two parameter sets of the kind used in textbook treatments (V in mV, t in ms, I in µA/cm², C in µF/cm², g in mS/cm²).
// Values are quoted from memory of those textbooks and have been checked only by the behaviour they produce here.
export const ML0 = { C: 20, gL: 2, gK: 8, gCa: 4, VL: -60, VK: -84, VCa: 120, V1: -1.2, V2: 18 };
export const ML_SETS = {
  hopf: { ...ML0, gCa: 4.4, phi: 0.04, V3: 2, V4: 30 },
  snic: { ...ML0, gCa: 4, phi: 0.067, V3: 12, V4: 17.4 },
};
export const mlMinf = (p, V) => 0.5 * (1 + Math.tanh((V - p.V1) / p.V2));
export const mlWinf = (p, V) => 0.5 * (1 + Math.tanh((V - p.V3) / p.V4));
export const mlTau = (p, V) => 1 / (p.phi * Math.cosh((V - p.V3) / (2 * p.V4)));
export const mlF = (p, V, w, I) => [(I - p.gL * (V - p.VL) - p.gCa * mlMinf(p, V) * (V - p.VCa) - p.gK * w * (V - p.VK)) / p.C, (mlWinf(p, V) - w) / mlTau(p, V)];
/** V-nullcline value of w at V (w such that V' = 0). */
export const mlWnull = (p, V, I) => (I - p.gL * (V - p.VL) - p.gCa * mlMinf(p, V) * (V - p.VCa)) / (p.gK * (V - p.VK));
/** Equilibria of ML at current I: roots of mlWnull − w∞ on [−80, 60], with Jacobian classification. */
export function mlEquilibria(p, I) {
  const g = (V) => mlWnull(p, V, I) - mlWinf(p, V), out = [];
  let a = -80, ga = g(a);
  for (let V = -79.9; V <= 60.0001; V += 0.1) {
    const gb = g(V);
    if (ga * gb <= 0) {
      let lo = V - 0.1, hi = V;
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
      const Vr = (lo + hi) / 2, w = mlWinf(p, Vr), h = 1e-4;
      const f0 = mlF(p, Vr + h, w, I), f1 = mlF(p, Vr - h, w, I), f2 = mlF(p, Vr, w + h, I), f3 = mlF(p, Vr, w - h, I);
      const J = [[(f0[0] - f1[0]) / (2 * h), (f2[0] - f3[0]) / (2 * h)], [(f0[1] - f1[1]) / (2 * h), (f2[1] - f3[1]) / (2 * h)]];
      const tr = J[0][0] + J[1][1], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      out.push({ V: Vr, w, tr, det, type: det < 0 ? 'saddle' : tr < 0 ? 'stable' : 'unstable', osc: tr * tr < 4 * det });
    }
    a = V; ga = gb;
  }
  return out;
}
/** Steady firing frequency (Hz, t in ms) of ML under constant current I; 0 if it settles. Measured over the second half of the run. */
export function mlRate(p, I, { T = 2500, dt = 0.25 } = {}) {
  let y = [-60, mlWinf(p, -60)]; const F = (s) => mlF(p, s[0], s[1], I), N = Math.round(T / dt), tc = [];
  let Vp = y[0];
  for (let k = 0; k < N; k++) { y = rk4(F, y, dt); if (Vp < 0 && y[0] >= 0 && k * dt > T / 3) tc.push(k * dt); Vp = y[0]; }
  return tc.length > 2 ? (1000 * (tc.length - 1)) / (tc[tc.length - 1] - tc[0]) : 0;
}
/** Orbit of ML from rest-ish initial data, sampled every `every·dt` ms: rows [V, w]. */
export function mlOrbit(p, I, T, { dt = 0.25, y0, every = 1 } = {}) {
  let y = y0 || [-60, mlWinf(p, -60)]; const F = (s) => mlF(p, s[0], s[1], I), N = Math.round(T / dt), ys = [y];
  for (let k = 1; k <= N; k++) { y = rk4(F, y, dt); if (k % every === 0) ys.push(y); }
  return ys;
}

// ---------------------------------------------------------------- two-dimensional reduction of Hodgkin–Huxley
/** Least-squares line h ≈ h0 − k n through the (n, h) samples of a full HH run. Returns {h0, k, r2}. */
export function lineHn(n, h) {
  const N = n.length, mn = n.reduce((a, b) => a + b, 0) / N, mh = h.reduce((a, b) => a + b, 0) / N;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < N; i++) { sxx += (n[i] - mn) ** 2; sxy += (n[i] - mn) * (h[i] - mh); syy += (h[i] - mh) ** 2; }
  const sl = sxy / sxx; return { h0: mh - sl * mn, k: -sl, r2: (sxy * sxy) / (sxx * syy) };
}
/** Two-variable HH: m = m∞(V), h = h0 − k n. State [V, n]. */
export function hh2F(y, I, h0, k, phi, p = HH) {
  const [V, n] = y, m = gateInf('m', V), h = h0 - k * n;
  return [(I - p.gNa * m ** 3 * h * (V - p.ENa) - p.gK * n ** 4 * (V - p.EK) - p.gL * (V - p.EL)) / p.C, phi * (HH.an(V) * (1 - n) - HH.bn(V) * n)];
}
/** Integrate the reduced model under Ifn(t); returns {t, V, n}. */
export function hh2Sim(Ifn, h0, k, { T = 6.3, tEnd = 30, dt = 0.02, every = 1 } = {}) {
  const phi = phiT(T), o = { t: [], V: [], n: [] }; let y = [-65, gateInf('n', -65)];
  const N = Math.round(tEnd / dt);
  for (let i = 0; i <= N; i++) {
    const t = i * dt;
    if (i % every === 0) { o.t.push(t); o.V.push(y[0]); o.n.push(y[1]); }
    if (i < N) { const I0 = Ifn(t), I1 = Ifn(t + dt), Im = 0.5 * (I0 + I1);
      const a = hh2F(y, I0, h0, k, phi), b = hh2F([y[0] + 0.5 * dt * a[0], y[1] + 0.5 * dt * a[1]], Im, h0, k, phi), c = hh2F([y[0] + 0.5 * dt * b[0], y[1] + 0.5 * dt * b[1]], Im, h0, k, phi), d = hh2F([y[0] + dt * c[0], y[1] + dt * c[1]], I1, h0, k, phi);
      y = [y[0] + (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), y[1] + (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1])]; }
  }
  return o;
}

// ---------------------------------------------------------------- Ca²⁺-activated K⁺ bursting (Morris–Lecar + slow variable)
// C V' = … − gKCa z/(1+z)(V−VK),  z' = ε(−μ ICa − z): a slow, calcium-like variable that is pumped up by inward Ca²⁺ current and decays.
// A model of this page, built on the Morris–Lecar equations; its numbers were tuned to give clear bursts, they are not fitted to a cell.
export const BURST = { ...ML_SETS.snic, phi: 0.23, gKCa: 0.5, mu: 0.02, eps: 0.001, I: 50 };
export const burstF = (p, V, w, z, I = p.I, zFix) => {
  const zz = zFix ?? z, ica = p.gCa * mlMinf(p, V) * (V - p.VCa);
  return [(I - p.gL * (V - p.VL) - ica - p.gK * w * (V - p.VK) - p.gKCa * (zz / (1 + zz)) * (V - p.VK)) / p.C, (mlWinf(p, V) - w) / mlTau(p, V), p.eps * (-p.mu * ica - z)];
};
export function burstOrbit(p, T, { dt = 0.25, every = 4, I = p.I, y0 } = {}) {
  let y = y0 || [-50, mlWinf(p, -50), 0.1]; const F = (s) => burstF(p, s[0], s[1], s[2], I), o = [y], N = Math.round(T / dt);
  for (let k = 1; k <= N; k++) { y = rk4(F, y, dt); if (k % every === 0) o.push(y); }
  return o;
}

// ---------------------------------------------------------------- Izhikevich simple model
/** Parameter sets of Izhikevich (2003), Fig.2 parameter diagram: a,b,c,d; I=10 for the five displayed cortical examples. RZ drive is an atlas illustration. */
export const IZH = {
  RS: { name: 'regular spiking', a: 0.02, b: 0.2, c: -65, d: 8, I: 10 },
  IB: { name: 'intrinsically bursting', a: 0.02, b: 0.2, c: -55, d: 4, I: 10 },
  CH: { name: 'chattering', a: 0.02, b: 0.2, c: -50, d: 2, I: 10 },
  FS: { name: 'fast spiking', a: 0.1, b: 0.2, c: -65, d: 2, I: 10 },
  LTS: { name: 'low-threshold spiking', a: 0.02, b: 0.25, c: -65, d: 2, I: 10 },
  RZ: { name: 'resonator', a: 0.1, b: 0.26, c: -65, d: 2, I: 0.3 },
};
/** Simulate on the paper’s ms/mV scales using its split-Euler update: two half voltage steps, then one recovery step. I has the model’s input scale, not an independently specified physical current unit. */
export function izhRun(p, Ifn, tEnd, { dt = 0.025 } = {}) {
  let v = -65, u = p.b * v; const o = { t: [], v: [], u: [], spikes: [], resets: [] }, N = Math.round(tEnd / dt);
  for (let i = 0; i <= N; i++) {
    const t = i * dt;
    if (v >= 30) { o.v.push(30); o.u.push(u); o.spikes.push(t); v = p.c; u += p.d; o.resets.push({t,v,u}); } else {o.v.push(v);o.u.push(u);}
    o.t.push(t);
    const I = Ifn(t);
    for (let j = 0; j < 2; j++) v += 0.5 * dt * (0.04 * v * v + 5 * v + 140 - u + I);
    u += dt * p.a * (p.b * v - u);
  }
  return o;
}

// ---------------------------------------------------------------- cached ML f–I curves and onset current
const _curve = new Map();
/** [[I, rate Hz], …] of the named ML set on the grid Is (cached; long runs near onset are costly). */
export function mlCurve(name, Is, opt) {
  const k = name + '|' + Is.join(',') + '|' + (opt?.T ?? '');
  if (!_curve.has(k)) _curve.set(k, Is.map((I) => [I, mlRate(ML_SETS[name], I, opt)]));
  return _curve.get(k);
}
/** First fold maximum of the equilibrium current curve (SNIC set): solve dIeq/dV=0, not a grid-dependent root count. */
export function snicCurrent(p = ML_SETS.snic) {
  const slope = V => {
    const m = mlMinf(p, V), w = mlWinf(p, V);
    const dm = .5 / (p.V2 * Math.cosh((V - p.V1) / p.V2) ** 2), dw = .5 / (p.V4 * Math.cosh((V - p.V3) / p.V4) ** 2);
    return p.gL + p.gCa * (m + (V - p.VCa) * dm) + p.gK * (w + (V - p.VK) * dw);
  };
  for (let hi = -79.5; hi <= 60; hi += .5) {
    if (slope(hi - .5) > 0 && slope(hi) <= 0) {
      let lo = hi - .5;
      for (let j = 0; j < 60; j++) { const m = (lo + hi) / 2; if (slope(m) > 0) lo = m; else hi = m; }
      const V = (lo + hi) / 2;
      return p.gL * (V - p.VL) + p.gCa * mlMinf(p,V) * (V - p.VCa) + p.gK * mlWinf(p,V) * (V - p.VK);
    }
  }
  return NaN;
}
/** Equilibria of the fast subsystem of BURST at frozen z: [{V, stable}]. */
export function burstFastEq(p, z, I = p.I) {
  const g = (V) => { const w = mlWinf(p, V); return burstF(p, V, w, z, I, z)[0]; };
  const out = []; let Va = -80, ga = g(Va);
  for (let V = -79.5; V <= 60; V += 0.5) {
    const gb = g(V);
    if (ga * gb <= 0) {
      let lo = V - 0.5, hi = V; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
      const Vr = (lo + hi) / 2, w = mlWinf(p, Vr), h = 1e-4, F = (V1, w1) => burstF(p, V1, w1, z, I, z);
      const a = F(Vr + h, w), b = F(Vr - h, w), c = F(Vr, w + h), d = F(Vr, w - h);
      const j11 = (a[0] - b[0]) / (2 * h), j12 = (c[0] - d[0]) / (2 * h), j21 = (a[1] - b[1]) / (2 * h), j22 = (c[1] - d[1]) / (2 * h);
      out.push({ V: Vr, stable: j11 + j22 < 0 && j11 * j22 - j12 * j21 > 0 });
    }
    Va = V; ga = gb;
  }
  return out;
}
/** Range of V on the fast subsystem's attracting oscillation at frozen z (null if it settles): {lo, hi, period}. */
export function burstFastCycle(p, z, I = p.I, { T = 900, dt = 0.25 } = {}) {
  let y = [0, mlWinf(p, 0)]; const F = (s) => { const f = burstF(p, s[0], s[1], z, I, z); return [f[0], f[1]]; }, N = Math.round(T / dt);
  let lo = Infinity, hi = -Infinity; const tc = []; let Vp = y[0];
  for (let k = 0; k < N; k++) { y = rk4(F, y, dt); if (k * dt > T / 2) { lo = Math.min(lo, y[0]); hi = Math.max(hi, y[0]); if (Vp < 0 && y[0] >= 0) tc.push(k * dt); } Vp = y[0]; }
  return hi - lo > 8 && tc.length > 1 ? { lo, hi, period: (tc[tc.length - 1] - tc[0]) / (tc.length - 1) } : null;
}
