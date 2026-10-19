// Human Physiology — Chapter 3: helpers shared by the items of "The heart as a pump"
// (a lumped left-heart model: atrium + time-varying-elastance ventricle + valves + Windkessel arterial load, loop metrics,
//  a schematic ECG/vector heart, and a 2-D excitable-tissue solver built on the Mitchell–Schaeffer cell of chapter 2)
export * from './ch02.shared.js';
import { clamp, MS } from './ch02.shared.js';

export const MMHG_ML_TO_J = 1.33322e-4; // 1 mmHg·mL = 133.322 Pa × 1e-6 m³

// ------------------------------------------------------------------ left heart: atrium + ventricle + arterial load
// Pressures in mmHg, volumes in mL, flows in mL/s, time in s. A teaching model, not a patient fit.
//  Ventricle:  P = e(t)·Ees·(V − V0) + (1 − e(t))·A·(exp(B (V − V0)) − 1)       e(t) = normalised double-Hill activation
//  Atrium:     P = Ea(t)(Va − V0a), Ea rising during atrial systole; filled from a venous pressure Pv through Rv
//  Valves:     ideal diodes with a small resistance (mitral Rm, aortic Rav)
//  Arterial load: two-element Windkessel (compliance C, resistance R) behind the aortic valve.
export const HEART = {
  HR: 75, Ees: 2.8, V0: 10, A: 0.3, B: 0.033, // ventricle
  Pv: 10, Rv: 0.03, Rm: 0.02, Rav: 0.015, Va0: 5, EaMin: 0.22, EaMax: 0.55, // atrium, valves
  R: 1.25, C: 1.4, // arterial resistance (mmHg·s/mL) and compliance (mL/mmHg)
  tAtr: 0.07, tVent: 0.1, // atrial and ventricular activation (s after the P wave starts)
};
/** Normalised double-Hill activation (Stergiopulos-type shape), peak 1 at about 1.9 τ1... rescaled numerically. */
const _norm = (() => { let m = 0; for (let k = 1; k < 4000; k++) { const t = k / 4000, a = (t / 0.269) ** 1.9, b = (t / 0.452) ** 21.9; m = Math.max(m, (a / (1 + a)) / (1 + b)); } return m; })();
export function activation(tau, Tmax) { // tau: seconds since onset
  if (tau <= 0) return 0;
  const x = tau / Tmax, a = (x / 0.269) ** 1.9, b = (x / 0.452) ** 21.9;
  return (a / (1 + a) / (1 + b)) / _norm;
}
const _cache = new Map();
/**
 * Simulate the loaded heart to a periodic state and return the last beat.
 * Returns {t, Pv (ventricle), Pa (aorta), Pat (atrium), V, Va, Q (aortic flow), Qm, e, T, ... , EDV, ESV, SV, EF, CO, Pmax, tMVC, tAVO, tAVC, tMVO, loop: [[V,P]…]}.
 */
export function heartBeat(over = {}) {
  const P = { ...HEART, ...over };
  const key = JSON.stringify(P);
  if (_cache.has(key)) return _cache.get(key);
  const T = 60 / P.HR, Tmax = 0.3 + 0.45 * T, dt = 0.001, N = Math.round(T / dt);
  const Ea = (t) => { const x = t - 0 ; const u = x / P.tAtr; return P.EaMin + (P.EaMax - P.EaMin) * (x >= 0 && x < 2 * P.tAtr ? Math.sin((Math.PI * x) / (2 * P.tAtr)) ** 2 : 0) + 0 * u; };
  const e = (t) => activation(t - P.tVent, Tmax);
  const Pven = (V, t) => { const ee = e(t); const d = V - P.V0; return ee * P.Ees * d + (1 - ee) * P.A * (Math.exp(P.B * d) - 1); };
  // states: V (ventricle), Va (atrium), Vart (arterial volume above unstressed, mL)
  const rhs = (y, t) => {
    const [V, Va, Va2] = y, tt = ((t % T) + T) % T;
    const Plv = Pven(V, tt), Pat = Ea(tt) * (Va - P.Va0), Part = Va2 / P.C;
    const Qm = Math.max(0, (Pat - Plv) / P.Rm), Qav = Math.max(0, (Plv - Part) / P.Rav), Qv = (P.Pv - Pat) / P.Rv;
    return [Qm - Qav, Qv - Qm, Qav - Part / P.R];
  };
  let y = [110, 35, 85 * P.C];
  const step = (y, t) => { // RK4
    const k1 = rhs(y, t), y2 = y.map((v, i) => v + 0.5 * dt * k1[i]), k2 = rhs(y2, t + dt / 2), y3 = y.map((v, i) => v + 0.5 * dt * k2[i]),
      k3 = rhs(y3, t + dt / 2), y4 = y.map((v, i) => v + dt * k3[i]), k4 = rhs(y4, t + dt);
    return y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  for (let b = 0; b < 12; b++) for (let k = 0; k < N; k++) y = step(y, k * dt);
  const R = { t: [], P: [], Pa: [], Pat: [], V: [], Va: [], Q: [], Qm: [], e: [], Ea: [], T, HR: P.HR, par: P };
  for (let k = 0; k <= N; k++) {
    const t = k * dt, [V, Va, Va2] = y, ee = e(t), Plv = Pven(V, t), Pat = Ea(t) * (Va - P.Va0), Part = Va2 / P.C;
    const Qm = Math.max(0, (Pat - Plv) / P.Rm), Qav = Math.max(0, (Plv - Part) / P.Rav);
    R.t.push(t); R.P.push(Plv); R.Pa.push(Part); R.Pat.push(Pat); R.V.push(V); R.Va.push(Va); R.Q.push(Qav); R.Qm.push(Qm); R.e.push(ee); R.Ea.push(Ea(t));
    if (k < N) y = step(y, t);
  }
  // events
  const n = R.t.length, ev = {};
  const cross = (arr, rising, from = 0) => { for (let i = Math.max(1, from); i < n; i++) if (rising ? arr[i - 1] <= 1e-6 && arr[i] > 1e-6 : arr[i - 1] > 1e-6 && arr[i] <= 1e-6) return i; return -1; };
  // aortic valve open/close: Q crosses zero; mitral close: after atrial contraction Qm falls to 0 when ventricle starts; mitral open: Qm > 0 again
  ev.iAVO = cross(R.Q, true); ev.iAVC = ev.iAVO >= 0 ? cross(R.Q, false, ev.iAVO) : -1;
  // mitral closes: last time Qm>0 before AVO ; opens: first Qm>0 after AVC
  let iMVC = -1; for (let i = 0; i < (ev.iAVO >= 0 ? ev.iAVO : n); i++) if (R.Qm[i] > 1e-6) iMVC = i; ev.iMVC = iMVC + 1;
  ev.iMVO = -1; for (let i = ev.iAVC; i < n; i++) if (R.Qm[i] > 1e-6) { ev.iMVO = i; break; }
  R.ev = ev;
  const at = (i) => (i >= 0 ? R.t[i] : null);
  R.tMVC = at(ev.iMVC); R.tAVO = at(ev.iAVO); R.tAVC = at(ev.iAVC); R.tMVO = at(ev.iMVO);
  R.EDV = ev.iMVC >= 0 ? R.V[ev.iMVC] : Math.max(...R.V);
  R.ESV = ev.iAVC >= 0 ? R.V[ev.iAVC] : Math.min(...R.V);
  R.SV = R.EDV - R.ESV; R.EF = R.EDV > 0 ? R.SV / R.EDV : 0; R.CO = (R.SV * P.HR) / 1000; // L/min
  R.Pmax = Math.max(...R.P); R.PaMax = Math.max(...R.Pa); R.PaMin = Math.min(...R.Pa); R.EDP = ev.iMVC >= 0 ? R.P[ev.iMVC] : 0;
  R.Pes = ev.iAVC >= 0 ? R.P[ev.iAVC] : 0;
  R.loop = R.t.map((_, i) => [R.V[i], R.P[i]]);
  // Signed ∫P dV is negative for this counter-clockwise ventricular loop.
  // Work delivered to blood is −∫P dV, in mmHg·mL.
  let A = 0; R.ejectionWork = 0; R.fillingWork = 0;
  for (let i = 0; i < n - 1; i++) {
    const dV = R.V[i + 1] - R.V[i], dW = dV * (R.P[i + 1] + R.P[i]) / 2;
    A += dW;
    if (dV < 0) R.ejectionWork -= dW; else R.fillingWork += dW;
  }
  R.work = -A;
  // pre-beat check for periodicity
  R.drift = Math.abs(R.V[n - 1] - R.V[0]);
  if (_cache.size > 400) _cache.clear();
  _cache.set(key, R);
  return R;
}
/** Linear interpolation of a sampled beat at time t (wrapping). */
export function beatAt(R, arr, t) {
  const n = R.t.length - 1, u = (((t % R.T) + R.T) % R.T) / R.T * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
  return arr[i] + f * (arr[i + 1] - arr[i]);
}
/** Index in the sample arrays of time t. */
export const beatIdx = (R, t) => Math.min(R.t.length - 1, Math.round((((t % R.T) + R.T) % R.T) / R.T * (R.t.length - 1)));

// ------------------------------------------------------------------ schematic ECG pieces: Gaussian waves tied to the model's timing
export const gauss = (t, mu, sd) => Math.exp(-0.5 * ((t - mu) / sd) ** 2);

// ------------------------------------------------------------------ 2-D excitable tissue: Mitchell–Schaeffer cell with diffusion
/**
 * Square sheet n×n, no-flux boundaries and holes (mask: 1 = tissue). v: voltage 0…1, h: gate. Units: ms; space in cells of size dx (cm).
 * D in cm²/ms (anisotropy ignored). Returns an object with step(nSteps), arrays v, h, mask.
 */
export function makeSheet(n, mask, o = {}) {
  const P = { ...MS, tclose: o.tclose ?? MS.tclose, topen: o.topen ?? MS.topen, tout: o.tout ?? MS.tout };
  const D = o.D ?? 0.0004, dx = o.dx ?? 0.04, dt = o.dt ?? 0.1;
  const v = new Float32Array(n * n), h = new Float32Array(n * n).fill(1), w = new Float32Array(n * n);
  const k = (D * dt) / (dx * dx);
  const S = {
    n, mask, v, h, P, D, dx, dt, t: 0,
    step(m) {
      for (let s = 0; s < m; s++) {
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          const c = j * n + i; if (!mask[c]) { w[c] = 0; continue; }
          const vc = v[c];
          const vl = i > 0 && mask[c - 1] ? v[c - 1] : vc, vr = i < n - 1 && mask[c + 1] ? v[c + 1] : vc;
          const vd = j > 0 && mask[c - n] ? v[c - n] : vc, vu = j < n - 1 && mask[c + n] ? v[c + n] : vc;
          const lap = vl + vr + vd + vu - 4 * vc, hc = h[c];
          const J = (hc * vc * vc * (1 - vc)) / P.tin - vc / P.tout;
          w[c] = vc + dt * J + k * lap;
          h[c] = hc + dt * (vc < P.vgate ? (1 - hc) / P.topen : -hc / P.tclose);
        }
        for (let c = 0; c < n * n; c++) if (mask[c]) v[c] = w[c];
        S.t += dt;
      }
    },
    /** Depolarise cells where f(i, j) is true (sets v to 0.9). */
    stim(f) { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const c = j * n + i; if (mask[c] && f(i, j)) v[c] = Math.max(v[c], 0.9); } },
    /** Make cells refractory where f(i, j) is true. */
    refractory(f) { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const c = j * n + i; if (mask[c] && f(i, j)) { h[c] = 0; v[c] = 0; } } },
    reset() { v.fill(0); h.fill(1); S.t = 0; },
  };
  return S;
}
/** Conduction velocity (cm/ms → m/s) and action potential duration (ms, v > 0.13 → recovery) of the cell in a 1-D cable. */
const _cab = new Map();
export function cableProps(tclose, topen = MS.topen) {
  const key = tclose + '|' + topen; if (_cab.has(key)) return _cab.get(key);
  const n = 200, mask = new Uint8Array(n * 3).fill(0);
  const S = makeSheet(n, new Uint8Array(n * n).fill(0), {}); // placeholder to reuse params
  // 1-D cable via a 1×n strip embedded in an n×n array would be wasteful; do a direct cable.
  const dx = 0.04, dt = 0.1, D = 0.0004, k = (D * dt) / (dx * dx), P = { ...MS, tclose, topen };
  const v = new Float32Array(n), h = new Float32Array(n).fill(1), w = new Float32Array(n);
  for (let i = 0; i < 4; i++) v[i] = 0.9;
  let tA = null, tB = null, apd = null; const iA = 60, iB = 140; let up = null, down = null;
  for (let s = 0; s < 6000; s++) {
    for (let i = 0; i < n; i++) {
      const vc = v[i], vl = i > 0 ? v[i - 1] : vc, vr = i < n - 1 ? v[i + 1] : vc;
      w[i] = vc + dt * ((h[i] * vc * vc * (1 - vc)) / P.tin - vc / P.tout) + k * (vl + vr - 2 * vc);
      h[i] += dt * (vc < P.vgate ? (1 - h[i]) / P.topen : -h[i] / P.tclose);
    }
    for (let i = 0; i < n; i++) v[i] = w[i];
    const t = s * dt;
    if (tA === null && v[iA] > 0.5) tA = t; if (tB === null && v[iB] > 0.5) tB = t;
    if (tA !== null && up === null) up = t; if (up !== null && down === null && v[iA] < 0.5 && t > up + 5) down = t;
  }
  const cv = tA !== null && tB !== null ? ((iB - iA) * dx) / (tB - tA) : 0; // cm/ms
  const out = { cv: cv * 10, apd: down !== null ? down - up : null }; // m/s
  _cab.set(key, out); return out;
}

// ------------------------------------------------------------------ phases of the beat, schematic ECG and sounds
/** The five mechanical phases of the beat sampled by heartBeat (the beat starts with atrial systole). */
export function phases(R) {
  const T = R.T, a = R.tMVC, b = R.tAVO, c = R.tAVC, d = R.tMVO;
  return [
    { key: 'A', name: 'atrial systole', t0: 0, t1: a, color: 'green' },
    { key: 'IC', name: 'isovolumic contraction', t0: a, t1: b, color: 'orange' },
    { key: 'E', name: 'ejection', t0: b, t1: c, color: 'red' },
    { key: 'IR', name: 'isovolumic relaxation', t0: c, t1: d, color: 'purple' },
    { key: 'F', name: 'ventricular filling', t0: d, t1: T, color: 'accent' },
  ];
}
/** Index ranges [i0, i1] of the loop for a phase (phase 'F' is the whole of filling incl. the atrial kick on the other side of the wrap). */
export function phaseLoop(R, ph) {
  const n = R.t.length, ix = (t) => Math.min(n - 1, Math.round((t / R.T) * (n - 1)));
  return R.loop.slice(ix(ph.t0), ix(ph.t1) + 1);
}
/** Schematic body-surface ECG (mV, lead II-like): P at the atrial start, QRS just before ventricular contraction, T near the end of ejection. */
export function ecgAt(R, t) {
  const tV = R.par.tVent, tT = (R.tAVC ?? tV + 0.3) - 0.07, tt = ((t % R.T) + R.T) % R.T;
  return 0.12 * gauss(tt, 0.045, 0.02) - 0.1 * gauss(tt, tV - 0.03, 0.006) + 1.0 * gauss(tt, tV - 0.012, 0.008) - 0.22 * gauss(tt, tV + 0.008, 0.008) + 0.28 * gauss(tt, tT, 0.04);
}
/** Schematic first and second heart sounds: damped bursts when the mitral (S1) and aortic (S2) valves close. */
export function soundAt(R, t) {
  const tt = ((t % R.T) + R.T) % R.T, burst = (t0, f, a) => { const x = tt - t0; return x >= 0 ? a * Math.sin(2 * Math.PI * f * x) * Math.exp(-x / 0.02) : 0; };
  return burst(R.tMVC ?? 0.09, 55, 1) + burst(R.tAVC ?? 0.36, 80, 0.7);
}

// ------------------------------------------------------------------ drawing helpers for the pressure–volume plane
/** Draw the loop of a beat; colourful: segments by phase (colour:'phase'), or a single colour. Returns nothing. */
export function drawLoop(s, R, st = {}) {
  if (st.color && st.color !== 'phase') { s.path(R.loop, { color: st.color, width: st.width ?? 2.2, alpha: st.alpha, dash: st.dash, close: true }); return; }
  for (const ph of phases(R)) {
    if (ph.key === 'A') continue;
    s.path(phaseLoop(R, ph), { color: ph.color, width: st.width ?? 2.8, alpha: st.alpha });
  }
  s.path(phaseLoop(R, phases(R)[0]), { color: phases(R)[4].color, width: st.width ?? 2.8, alpha: st.alpha }); // the atrial kick continues the filling segment
}
/** The four valve events of the beat as [V, P, label-number]. */
export function cornerPoints(R) {
  const e = R.ev;
  return [[R.V[e.iMVC], R.P[e.iMVC], '1'], [R.V[e.iAVO], R.P[e.iAVO], '2'], [R.V[e.iAVC], R.P[e.iAVC], '3'], [R.V[e.iMVO], R.P[e.iMVO], '4']];
}
