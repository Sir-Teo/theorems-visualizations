// Climate Science — Chapter 3 shared helpers: forcing, sensitivity and the two-box ocean.
// Re-exports the chapter-2 radiative–convective column (not edited here) and adds a memoised control column, a
// stratospheric-adjustment job, a two-layer energy-balance model and the AR6 numbers that several items quote.
//
// AR6 numbers below were read from the chapter PDF (IPCC AR6 WG1 Chapter 7, ipcc.ch, downloaded 2026-10):
//   Table 7.4: 2×CO2 SARF 3.75, ERF 3.93 ± 0.47 W m⁻² (tropospheric adjustments −0.60 temperature, +0.22 water vapour,
//              +0.45 cloud, +0.11 albedo/land cover; 1750 CO2 = 278 ppm)
//   Table 7.8: ERF 1750–2019 and the AR5 (1750–2011) values;   Table 7.10: feedbacks;   Tables 7.13/7.14: ECS, TCR;
//   Table 7.15: radiative efficiencies, lifetimes and GWPs;   §7.3.4.6: volcanic ERF −20 ± 5 W m⁻² per unit SAOD.
import { GRID, opticalDepths, longwave, humidity, ozoneProfile, ozoneHeating, rceJob, rceAdvance, rceFinishJob, ASR_RCE, CP, G0, planckNu, NU, NN } from './ch02.shared.js';

export * from './ch02.shared.js';

export const still = () => typeof window !== 'undefined' && !!window.__vizStill;
export const fx = (v, x, d = 1) => v.fix(x, d);

export const F2X = 3.93; // AR6 ERF of doubled CO2, W m⁻²
export const O3 = ozoneProfile(300), SW = ozoneHeating(O3);
export const BASE = { asr: ASR_RCE, o3: O3, sw: SW, co2: 280, maxSteps: 1400 };

// ── control column, computed once per page ─────────────────────────────────────────────────────────────────────────
let CTRL = null, CJOB = null, TIMER = null;
const WAIT = [];
function finishControl() {
  const T = Array.from(CJOB.st.T), Ts = CJOB.st.Ts, q = humidity(T, GRID, {});
  const kt = GRID.pm.findIndex((p) => p < 100); // interface index of the 100 hPa level (the "tropopause" of this column)
  CTRL = { T, Ts, q, kt };
  CJOB = null;
  while (WAIT.length) WAIT.shift()(CTRL);
}
/** Run `cb(control)` once the 280 ppm radiative–convective control column exists (synchronously in still mode). */
export function whenControl(cb, progress) {
  if (CTRL) return cb(CTRL);
  WAIT.push(cb);
  if (CJOB) return;
  CJOB = rceJob(BASE);
  if (still()) { rceFinishJob(CJOB); finishControl(); return; }
  const tick = () => { TIMER = null; if (!CJOB) return; if (rceAdvance(CJOB, 16)) finishControl(); else { if (progress) progress(CJOB.st.steps); TIMER = setTimeout(tick, 0); } };
  TIMER = setTimeout(tick, 0);
}

/** Run the column's longwave scheme: returns {up, down, olr, ...} for temperatures T, surface Ts, CO2 (ppm) and specific humidity q. */
export function lw(T, Ts, co2, q, extra = {}) {
  return longwave(T, Ts, opticalDepths(T, { ...BASE, co2, q, ...extra }, GRID), BASE, GRID);
}

/**
 * Stratospheric adjustment: only the layers with `pbot` > p ≥ `ptop` (hPa) are marched to radiative equilibrium (ozone
 * heating fixed, the troposphere and surface held), the "fixed dynamical heating" idea. Sliced so the page stays responsive.
 */
export function adjustJob(ctrl, co2, ptop = 3, pbot = 100, iters = 70) {
  return { ctrl, co2, ptop, pbot, T: Array.from(ctrl.T), it: 0, iters, done: false };
}
export function adjustAdvance(job, ms = 16) {
  const { N, dp, pm } = GRID, { ctrl } = job, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const t0 = now(), dt = 20 * 86400, C = dp.map((d) => (CP * Math.max(d, 10) * 100) / G0);
  while (!job.done && now() - t0 < ms) {
    const T = job.T, tau = opticalDepths(T, { ...BASE, co2: job.co2, q: ctrl.q }, GRID), L = longwave(T, ctrl.Ts, tau, BASE, GRID);
    for (let i = 0; i < N; i++) {
      if (pm[i] > job.pbot || pm[i] < job.ptop) continue;
      const gain = L.up[i] - L.down[i] - (L.up[i + 1] - L.down[i + 1]) + SW[i];
      let S = 0; for (let k = 0; k < NN; k++) S += 2 * (1 - Math.exp(-1.66 * tau[i][k])) * (planckNu(NU[k], T[i] + 0.5) - planckNu(NU[k], T[i] - 0.5)) * 5;
      T[i] += (gain * dt) / (C[i] + S * dt);
    }
    job.it++; if (job.it >= job.iters) job.done = true;
  }
  return job.done;
}

// ── two-layer energy-balance model (mixed layer + deep ocean) ─────────────────────────────────────────────────────
/**
 * C dT/dt = F(t) − λT − γ(T − Td),  Cd dTd/dt = γ(T − Td).   λ > 0 is the net feedback magnitude (W m⁻² K⁻¹), γ the
 * ocean heat-uptake coefficient, C and Cd the heat capacities (W yr m⁻² K⁻¹). Returns arrays on a uniform time grid.
 * The generic values C = 8, γ = 0.7 give a fast time scale C/(λ+γ) of a few years, the kind of value discussed by
 * Held et al. (2010, J. Climate 23: 2418; they quote cF/β̃ = 4 yr); they are illustrative, not AR6's emulator.
 */
export function twoBox(F, lam, o = {}, tEnd = 300, dt = 0.25) {
  const C = o.C ?? 8, Cd = o.Cd ?? 100, gam = o.gam ?? 0.7, n = Math.round(tEnd / dt);
  const t = new Float64Array(n + 1), T = new Float64Array(n + 1), Td = new Float64Array(n + 1), N = new Float64Array(n + 1);
  const f = (tt, a, b) => [(F(tt) - lam * a - gam * (a - b)) / C, (gam * (a - b)) / Cd];
  let a = 0, b = 0;
  for (let i = 0; i <= n; i++) {
    const tt = i * dt; t[i] = tt; T[i] = a; Td[i] = b; N[i] = F(tt) - lam * a;
    const k1 = f(tt, a, b), k2 = f(tt + dt / 2, a + (dt / 2) * k1[0], b + (dt / 2) * k1[1]), k3 = f(tt + dt / 2, a + (dt / 2) * k2[0], b + (dt / 2) * k2[1]), k4 = f(tt + dt, a + dt * k3[0], b + dt * k3[1]);
    a += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); b += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  return { t, T, Td, N, dt };
}
/** Interpolate a twoBox series at time tt. */
export function at(series, arr, tt) { const x = Math.min(arr.length - 1, Math.max(0, tt / series.dt)), i = Math.floor(x), f = x - i; return arr[i] * (1 - f) + arr[Math.min(arr.length - 1, i + 1)] * f; }

// ── Arrhenius (1896) Table VII, area-weighted annual means ────────────────────────────────────────────────────────
// Computed from the 13 latitude bands (70° N–60° N … 50° S–60° S) of Table VII as transcribed in ch03-papers.js (the
// table itself is an image in the scanned paper; the transcription there was made from the scan), weighting each band
// by the cosine of its central latitude and using the annual column. Carbonic acid K = 0.67, 1.5, 2, 2.5, 3 times the
// 1896 amount → change of temperature, °C. Latitudes covered: 70° N to 50° S only.
export const ARR = { K: [0.67, 1.5, 2, 2.5, 3], dT: [-3.18, 3.39, 5.41, 7.05, 8.25] };

// ── gases for the GWP item: AR6 Table 7.15 (lifetime in years, radiative efficiency in W m⁻² ppb⁻¹) ──────────────────
export const MOLAR_AIR = 28.97, M_DRY = 5.1352e18; // g mol⁻¹; kg, dry air (Trenberth & Smith 2005, J. Climate 18: 864)
export const KG_PER_PPB = (M) => (M_DRY / (MOLAR_AIR * 1e-3)) * 1e-9 * M * 1e-3;
// Joos et al. (2013, ACP 13: 2793) multi-model mean CO2 impulse response function: a0 + Σ a_i exp(−t/τ_i)
export const IRF = { a: [0.2173, 0.2240, 0.2824, 0.2763], tau: [Infinity, 394.4, 36.54, 4.304] };
/** ∫₀ᴴ IRF(t) dt (years). */
export function irfInt(H) { let s = IRF.a[0] * H; for (let i = 1; i < 4; i++) s += IRF.a[i] * IRF.tau[i] * (1 - Math.exp(-H / IRF.tau[i])); return s; }
export function irf(t) { let s = IRF.a[0]; for (let i = 1; i < 4; i++) s += IRF.a[i] * Math.exp(-t / IRF.tau[i]); return s; }

// ── probability helpers ───────────────────────────────────────────────────────────────────────────────────────────
export const phi = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
export function Phi(z) { // normal CDF (Abramowitz–Stegun 7.1.26 via erf)
  const s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + s * y);
}
export function PhiInv(p) { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }

/** Run `advance(job, ms)` in time slices until it returns true; `onTick()` after each slice, `onDone()` at the end. Returns a cancel function. Synchronous in still mode. */
export function runJob(advance, job, onTick, onDone) {
  let dead = false, timer = null;
  if (still()) { while (!advance(job, 1000)); onDone(); return () => {}; }
  const tick = () => { timer = null; if (dead) return; const d = advance(job, 14); if (onTick) onTick(); if (d) { onDone(); } else timer = setTimeout(tick, 0); };
  timer = setTimeout(tick, 0);
  return () => { dead = true; if (timer) clearTimeout(timer); };
}
