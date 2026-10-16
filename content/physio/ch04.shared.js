// Human Physiology — Chapter 4: helpers shared by the items of "Circulation: pressure, flow and resistance"
// (Poiseuille arithmetic, a Windkessel integrator, the Womersley solution with a complex Bessel function, blood-viscosity formulas)
export * from './ch03.shared.js';
import { clamp } from './ch03.shared.js';

export const PA_PER_MMHG = 133.322;
export const RHO_BLOOD = 1060; // kg/m3
export const MU_BLOOD = 3.5e-3; // Pa·s, the usual "bulk" value for whole blood at high shear

/** Hagen–Poiseuille volumetric flow (SI): r, L in m, mu in Pa·s, dP in Pa → m³/s. */
export const poiseuilleQ = (r, L, mu, dP) => (Math.PI * r ** 4 * dP) / (8 * mu * L);

// ------------------------------------------------------------------ Windkessel (two- and three-element)
/**
 * Periodic steady state of the Windkessel driven by a half-sine ejection.
 *   C dPw/dt = Q(t) − (Pw − Pv)/R ,   P_in = Pw + Zc·Q(t)      (Zc = 0 gives the two-element model)
 * Units: mmHg, mL, s, so R in mmHg·s/mL and C in mL/mmHg. Ejection lasts Ts = 0.35 T; the stroke volume is SV.
 * Returns samples of t, Q, P (aortic root pressure), Pw and summary numbers. Integrated with RK4 (dt ≈ 2 ms).
 */
export function windkessel({ R = 1.05, C = 1.5, Zc = 0, HR = 75, SV = 70, Pv = 0, tsFrac = 0.35, beats = 14 } = {}) {
  const T = 60 / HR, Ts = tsFrac * T, Qpk = (SV * Math.PI) / (2 * Ts);
  const Q = (t) => { const u = ((t % T) + T) % T; return u < Ts ? Qpk * Math.sin((Math.PI * u) / Ts) : 0; };
  const f = (t, p) => (Q(t) - (p - Pv) / R) / C;
  const n = Math.max(1, Math.round(T / 0.002)), h = T / n;
  let p = Pv + 60, t = 0;
  const ts = [], qs = [], ps = [], pw = [];
  for (let b = 0; b < beats; b++) {
    const last = b === beats - 1;
    for (let k = 0; k <= n; k++) {
      if (last) { const q = Q(t); ts.push(k * h); qs.push(q); pw.push(p); ps.push(p + Zc * q); }
      if (k === n) break;
      const k1 = f(t, p), k2 = f(t + h / 2, p + (h / 2) * k1), k3 = f(t + h / 2, p + (h / 2) * k2), k4 = f(t + h, p + h * k3);
      p += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); t += h;
    }
  }
  let Ps = -1e9, Pd = 1e9, Pm = 0;
  for (let i = 0; i < ps.length; i++) { Ps = Math.max(Ps, ps[i]); Pd = Math.min(Pd, ps[i]); Pm += ps[i] / ps.length; }
  return { T, Ts, t: ts, Q: qs, P: ps, Pw: pw, Ps, Pd, Pm, PP: Ps - Pd, Qmean: (SV * HR) / 60, Qf: Q };
}

// ------------------------------------------------------------------ Womersley flow in a rigid tube
/** J0(z) for z = α·i^{3/2}·s, i.e. Σ w^k/(k!)² with w = i α² s²/4 (complex, returned as [re, im]). */
export function j0Womersley(alpha, s) {
  const a = (alpha * s) ** 2 / 4; // w = i·a
  let tr = 1, ti = 0, sr = 1, si = 0;
  for (let k = 1; k < 200; k++) {
    // term *= w / k²  with w = i a
    const nr = (-ti * a) / (k * k), ni = (tr * a) / (k * k);
    tr = nr; ti = ni; sr += tr; si += ti;
    if (Math.hypot(tr, ti) < 1e-14 * Math.hypot(sr, si)) break;
  }
  return [sr, si];
}
/**
 * Womersley profile: axial velocity at radius fraction s and phase φ (ωt), for a pressure gradient −∂p/∂z = G cos(ωt),
 * in units of the Poiseuille amplitude G R²/(4μ).  u = Re[ (−4 i /α²)(1 − J0(αi^{3/2}s)/J0(αi^{3/2})) e^{iφ} ].
 */
export function womersleyU(alpha, s, phi) {
  if (alpha < 1e-6) return (1 - s * s) * Math.cos(phi);
  const [ar, ai] = j0Womersley(alpha, s), [br, bi] = j0Womersley(alpha, 1);
  const d = br * br + bi * bi, qr = (ar * br + ai * bi) / d, qi = (ai * br - ar * bi) / d; // J0(s)/J0(1)
  const fr = 1 - qr, fi = -qi, k = 4 / (alpha * alpha); // (−4i/α²)(fr + i fi) = k(fi − i fr)
  const cr = k * fi, ci = -k * fr;
  return cr * Math.cos(phi) - ci * Math.sin(phi);
}
/** Complex amplitude of the centre-line velocity relative to the Poiseuille peak: [re, im] (so |.| is the gain and −arg the lag). */
export function womersleyCentre(alpha) {
  if (alpha < 1e-6) return [1, 0];
  const [br, bi] = j0Womersley(alpha, 1), d = br * br + bi * bi, qr = br / d, qi = -bi / d; // 1/J0(1)
  const fr = 1 - qr, fi = -qi, k = 4 / (alpha * alpha);
  return [k * fi, -k * fr];
}

// ------------------------------------------------------------------ blood viscosity in narrow tubes
/** Pries et al. 1992 in-vitro fit (as reproduced by Secomb & Pries, 2013): relative apparent viscosity, D in µm, discharge haematocrit HD. */
export function priesRel(D, HD = 0.45) {
  const m45 = 220 * Math.exp(-1.3 * D) + 3.2 - 2.44 * Math.exp(-0.06 * D ** 0.645);
  const g = 1 / (1 + 1e-11 * D ** 12);
  const C = (0.8 + Math.exp(-0.075 * D)) * (-1 + g) + g;
  return 1 + (m45 - 1) * (((1 - HD) ** C - 1) / ((1 - 0.45) ** C - 1));
}
/** Two-layer (core + cell-free plasma sleeve) model: relative apparent viscosity for tube radius R, sleeve δ, core relative viscosity ηc. */
export const twoLayerRel = (R, delta, etaC) => 1 / (1 - (1 - 1 / etaC) * (1 - delta / R) ** 4);

/** Cheap deterministic hash noise in [−1, 1]. */
export const hnoise = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; };
