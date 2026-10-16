// Computational Neuroscience — Chapter 3: helpers shared by ch03.js and its part files
// (re-exports the chapter-2 helpers; adds a generic RK4 integrator, spike counting for planar models, the FitzHugh–Nagumo
//  equations, the Morris–Lecar model with its two textbook parameter sets, and the Ca²⁺-activated K⁺ bursting extension)
export * from './ch02.shared.js';

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
