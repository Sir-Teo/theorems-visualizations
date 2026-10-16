// Climate Science — Chapter 2 shared helpers: a small, honest band radiative-transfer column.
// Everything is plain JS (no `v`): wavenumber ν in cm⁻¹, fluxes in W m⁻², pressures in hPa.
//
// The spectroscopy is SYNTHETIC but physically structured: a CO₂ 15 µm band with exponentially decaying wings
// (the property that makes forcing logarithmic), H₂O rotation and 6.3 µm bands, an H₂O self-continuum that keeps
// the 8–12 µm window nearly (not perfectly) clear, and the O₃ 9.6 µm band. Amplitudes are tuned so a clear-sky
// column gives OLR ≈ 240 W m⁻², a greenhouse effect ≈ 150 W m⁻², and ≈ 3–4 W m⁻² per CO₂ doubling.

export const SIG = 5.670374e-8, CP = 1004, G0 = 9.81, RD = 287, PS = 1000;
export const C2 = 1.438777; // hc/k, cm K
const NU0 = 10, NU1 = 2000, DNU = 5;
export const NU = []; for (let n = NU0; n <= NU1; n += DNU) NU.push(n);
export const NN = NU.length;

/** πB_ν(T): blackbody flux per cm⁻¹, W m⁻² (cm⁻¹)⁻¹. */
export function planckNu(nu, T) { const x = (C2 * nu) / T; return x > 600 ? 0 : (3.741771e-8 * nu ** 3) / Math.expm1(x); }
/** Brightness temperature of a flux per cm⁻¹ (inverse of planckNu). */
export function brightT(nu, F) { return F <= 0 ? 0 : (C2 * nu) / Math.log1p((3.741771e-8 * nu ** 3) / F); }
/** Saturation vapour pressure (Pa), Magnus form. */
export function esat(T) { return 611.2 * Math.exp((17.67 * (T - 273.15)) / (T - 29.65)); }

// ── absorption coefficients, m² per kg of absorber (before pressure scaling) ─────────────────────────────────────
// CO₂: strong Q-branch core at 667 cm⁻¹ plus broad exponential wings, plus weak hot bands near 960/1060.
// Mass path of 400 ppm over the whole atmosphere is ~ 6 kg m⁻², so k ~ 1e3–1e5 m²/kg in the core.
const PAR = { co2A: 150, co2W: 14, co2B: 0.05, co2C: 120, co2A1: 3000, co2W1: 4, hot: 0.005, rotA: 730, rotW: 74, vibA: 30, vibW: 52, floor: 0.1, contA: 1.07e-3, contW: 167, o3A: 3500 };
const K_CO2 = [], K_H2O = [], K_CONT = [], K_O3 = [];
export function buildSpec(P = PAR) {
  K_CO2.length = K_H2O.length = K_CONT.length = K_O3.length = 0;
  for (const n of NU) {
    const d = Math.abs(n - 667);
    K_CO2.push((P.co2A * Math.exp(-d / P.co2W) + P.co2B * Math.exp(-d / 40)) * Math.exp(-((d / P.co2C) ** 2)) + P.co2A1 * Math.exp(-d / P.co2W1) + P.hot * (Math.exp(-Math.abs(n - 960) / 20) + 0.75 * Math.exp(-Math.abs(n - 1060) / 20)));
    K_H2O.push(P.rotA * Math.exp(-n / P.rotW) + P.vibA * Math.exp(-Math.abs(n - 1600) / P.vibW) + P.floor);
    K_CONT.push(P.contA * Math.exp(-n / P.contW));
    K_O3.push(P.o3A * Math.exp(-(((n - 1042) / 28) ** 2)));
  }
}
buildSpec();
export { PAR };
export const SPEC = { K_CO2, K_H2O, K_CONT, K_O3 };

/** Pressure grid: N layers equally spaced in ln p from `PS` down to `ptop` hPa. Returns edges (bottom → top) and mid-layer arrays. */
export function makeGrid(N = 40, ptop = 2) {
  const e = [], r = Math.log(PS / ptop);
  for (let j = 0; j <= N; j++) e.push(PS * Math.exp((-r * j) / N));
  const pm = [], dp = [];
  for (let i = 0; i < N; i++) { pm.push(Math.sqrt(e[i] * e[i + 1])); dp.push(e[i] - e[i + 1]); }
  return { N, e, pm, dp };
}
export const GRID = makeGrid(42, 0.5);

/** Pressure (hPa) → height (km) in the standard-atmosphere-like scale used for labels (H = 7.5 km below, tuned to 6.5 K/km). */
export function zOfP(p) { return 7.2 * Math.log(PS / p); }

/** Relative humidity of the Manabe–Wetherald profile (fraction) at pressure p. */
export function rhManabe(p, rhs = 0.77) { return Math.max(0, (rhs * (p / PS - 0.02)) / 0.98); }
/** Specific humidity (kg/kg) for a temperature profile at fixed relative humidity, with a stratospheric floor. */
export function humidity(T, grid = GRID, o = {}) {
  const { rh = 1, floor = 4e-6 } = o;
  return grid.pm.map((p, i) => Math.max(floor, (0.622 * rh * rhManabe(p, o.rhs ?? 0.77) * esat(T[i])) / (p * 100 - 0.378 * rh * rhManabe(p, o.rhs ?? 0.77) * esat(T[i]))));
}

/**
 * Gas amounts for a column. `T`: layer temperatures; options: co2 (ppm), q (kg/kg per layer, default fixed-RH),
 * o3 (kg/kg per layer or null), pb (pressure-broadening exponent, default 0.7), h2o (scale on vapour, 1).
 * Returns an object of per-layer, per-ν optical depths `tau[i][n]`.
 */
export function opticalDepths(T, o = {}, grid = GRID) {
  const { N, pm, dp } = grid, co2 = (o.co2 ?? 400) * 1e-6 * 1.5188, pb = o.pb ?? 0.7, hs = o.h2o ?? 1;
  const q = o.q || humidity(T, grid), o3 = o.o3, cs = o.cont ?? 1;
  const tau = [];
  for (let i = 0; i < N; i++) {
    const m = (dp[i] * 100) / G0, pf = (pm[i] / PS) ** pb, row = new Float64Array(NN);
    const mc = co2 * m, mw = hs * q[i] * m, ev = ((q[i] * pm[i] * 100) / 0.622) * hs, mo = o3 ? o3[i] * m : 0;
    const pfw = (pm[i] / PS) ** (pb * 0.9);
    for (let n = 0; n < NN; n++) row[n] = K_CO2[n] * pf * mc + K_H2O[n] * pfw * mw + K_CONT[n] * cs * ev * mw * (pm[i] / PS) ** 0.2 + K_O3[n] * pf * mo;
    tau.push(row);
  }
  return tau;
}

const DIFF = 1.66;
/**
 * Longwave flux profiles on the layer interfaces (index 0 = surface, N = top of atmosphere).
 * `Ts`: surface temperature (surface is a blackbody, emissivity `eps`). Returns {up, down, olr, olrSpec, dnSfc, ...}.
 * `spec: true` also returns the outgoing spectrum olrSpec[n] (W m⁻² per cm⁻¹).
 */
export function longwave(T, Ts, tau, o = {}, grid = GRID) {
  const { N } = grid, eps = o.eps ?? 1;
  const up = new Float64Array(N + 1), down = new Float64Array(N + 1);
  const Iu = new Float64Array(NN), Id = new Float64Array(NN), Ed = new Float64Array(NN);
  const Bl = [], tr = [];
  for (let i = 0; i < N; i++) { const b = new Float64Array(NN), t = new Float64Array(NN); for (let n = 0; n < NN; n++) { b[n] = planckNu(NU[n], T[i]); t[n] = Math.exp(-DIFF * tau[i][n]); } Bl.push(b); tr.push(t); }
  for (let n = 0; n < NN; n++) Iu[n] = planckNu(NU[n], Ts) * eps;
  let sum = 0; for (let n = 0; n < NN; n++) sum += Iu[n] * DNU; up[0] = sum;
  const olrSpec = o.spec ? new Float64Array(NN) : null;
  for (let i = 0; i < N; i++) {
    sum = 0;
    for (let n = 0; n < NN; n++) { Iu[n] = Iu[n] * tr[i][n] + Bl[i][n] * (1 - tr[i][n]); sum += Iu[n] * DNU; }
    up[i + 1] = sum;
  }
  if (olrSpec) for (let n = 0; n < NN; n++) olrSpec[n] = Iu[n];
  down[N] = 0;
  const dnSpec = o.spec ? new Float64Array(NN) : null;
  for (let i = N - 1; i >= 0; i--) {
    sum = 0;
    for (let n = 0; n < NN; n++) { Id[n] = Id[n] * tr[i][n] + Bl[i][n] * (1 - tr[i][n]); sum += Id[n] * DNU; }
    down[i] = sum;
  }
  if (dnSpec) for (let n = 0; n < NN; n++) dnSpec[n] = Id[n];
  return { up, down, olr: up[N], dnSfc: down[0], olrSpec, dnSpec };
}

/** Emission level of each wavenumber seen from space: the pressure (hPa) where the slant optical depth from the top reaches 1. */
export function emissionLevels(tau, grid = GRID) {
  const { N, e, pm } = grid, out = new Float64Array(NN);
  for (let n = 0; n < NN; n++) {
    let acc = 0, p = PS;
    for (let i = N - 1; i >= 0; i--) { const d = DIFF * tau[i][n]; if (acc + d >= 1) { const f = (1 - acc) / d; p = e[i + 1] + (e[i] - e[i + 1]) * (1 - f); acc = 2; break; } acc += d; }
    out[n] = acc >= 2 ? p : PS;
  }
  return out;
}

/** Observed-like temperature profile: 6.5 K/km (in the pressure form used here) below an isothermal 216.7 K. */
export function standardT(Ts = 288, gamma = 6.5, Tmin = 216.65, grid = GRID) {
  const k = (RD * gamma * 1e-3) / G0;
  return grid.pm.map((p) => Math.max(Tmin, Ts * (p / PS) ** k));
}
export const KAPPA_ADIABAT = (gamma) => (RD * gamma * 1e-3) / G0;

/**
 * Radiative–convective column. Marches the layer temperatures with the net longwave heating (plus an optional
 * shortwave heating profile `sw[i]`, W m⁻² per layer) until balance, adjusting any layer pair steeper than the
 * critical lapse rate (Manabe & Strickler 1964, energy-conserving). The surface receives `ssw` W m⁻² of sunlight.
 * Returns the state {T, Ts, olr, ...}. `state` may be passed to warm-start.
 */
export function rce(o = {}, state = null, grid = GRID) {
  const st = rceStart(o, state, grid);
  rceSteps(st, o, o.iters ?? 1500, grid);
  return rceFinish(st, o, grid);
}
/** Initial state of a radiative–convective integration (warm start from a previous state when given). */
export function rceStart(o = {}, state = null, grid = GRID) {
  const T = state ? Array.from(state.T) : standardT(o.Ts0 ?? 288, o.gamma ?? 6.5, 200, grid);
  return { T, Ts: state ? state.Ts : (o.Ts0 ?? 288), steps: 0, resid: 1e9 };
}
/**
 * Advance the column `n` pseudo-time steps. Each layer takes a diagonally-implicit step, dT = gain / (C/dt + S): C is
 * its heat capacity (floored for the thin top layers), S the slope of its own emission (so a step never overshoots),
 * and the surface and convection are handled as in Manabe & Strickler (1964).
 */
export function rceSteps(st, o, n, grid = GRID) {
  const { N, dp } = grid, kk = KAPPA_ADIABAT(o.gamma ?? 6.5), asr = o.asr ?? 240, sw = o.sw || null;
  const swAtm = sw ? sw.reduce((a, b) => a + b, 0) : 0, Ssfc = asr - swAtm;
  const dt = (o.dt ?? 3) * 86400, C = dp.map((d) => (CP * Math.max(d, 10) * 100) / G0), Cs = o.Cs ?? 4e6;
  const T = st.T, dB = new Float64Array(NN);
  for (let it = 0; it < n; it++) {
    const q = o.fixedQ ? o.fixedQ : humidity(T, grid, { rhs: o.rhs });
    const tau = opticalDepths(T, { ...o, q }, grid), L = longwave(T, st.Ts, tau, o, grid);
    let maxd = 0;
    const Ce = new Array(N);
    for (let i = 0; i < N; i++) {
      const gain = L.up[i] - L.down[i] - (L.up[i + 1] - L.down[i + 1]) + (sw ? sw[i] : 0);
      let S = 0; for (let k = 0; k < NN; k++) S += 2 * (1 - Math.exp(-DIFF * tau[i][k])) * (planckNu(NU[k], T[i] + 0.5) - planckNu(NU[k], T[i] - 0.5)) * DNU;
      Ce[i] = C[i] + S * dt; // effective (pseudo) capacity: the step cannot overshoot, and convection conserves C̃·T
      const d = (gain * dt) / Ce[i]; T[i] += d; maxd = Math.max(maxd, Math.abs(d));
    }
    const Cse = Cs + 4 * SIG * st.Ts ** 3 * 0.6 * dt, ds = ((Ssfc - (L.up[0] - L.down[0])) * dt) / Cse; st.Ts += ds; maxd = Math.max(maxd, Math.abs(ds));
    if (st.Ts > T[0]) { const m = (st.Ts * Cse + T[0] * Ce[0]) / (Cse + Ce[0]); st.Ts = m; T[0] = m; }
    convect(T, Ce, kk, grid);
    st.steps++; st.resid = L.olr - asr; st.maxd = maxd;
  }
  return st;
}
/** Final diagnostics (spectra included) of a column state. */
export function rceFinish(st, o = {}, grid = GRID) {
  const q = o.fixedQ ? o.fixedQ : humidity(st.T, grid, { rhs: o.rhs }), tau = opticalDepths(st.T, { ...o, q }, grid);
  const L = longwave(st.T, st.Ts, tau, { ...o, spec: true }, grid);
  return { T: Array.from(st.T), Ts: st.Ts, q, tau, L, olr: L.olr, asr: o.asr ?? 240, steps: st.steps, resid: L.olr - (o.asr ?? 240) };
}

/** Energy-conserving convective adjustment of a column (layers weights w, critical ratio exponent kk). */
export function convect(T, w, kk, grid = GRID) {
  const { N, pm } = grid;
  for (let sweep = 0; sweep < 40; sweep++) {
    let changed = false;
    for (let i = 0; i < N - 1; i++) {
      const r = (pm[i + 1] / pm[i]) ** kk; // T_{i+1} must be ≥ T_i · r
      if (T[i + 1] < T[i] * r - 1e-9) {
        // set T_{i+1} = r T_i with w_i T_i + w_{i+1} T_{i+1} conserved
        const Tn = (w[i] * T[i] + w[i + 1] * T[i + 1]) / (w[i] + w[i + 1] * r);
        T[i] = Tn; T[i + 1] = r * Tn; changed = true;
      }
    }
    if (!changed) break;
  }
}

/** Heights (km) of the layer mid-points of a temperature profile, by hydrostatic integration z = ∫ R T / g d ln p. */
export function heights(T, grid = GRID) {
  const { N, e, pm } = grid, z = []; let acc = 0;
  for (let i = 0; i < N; i++) { const half = (RD * T[i] / G0) * Math.log(e[i] / pm[i]) * 1e-3; z.push(acc + half); acc += (RD * T[i] / G0) * Math.log(e[i] / e[i + 1]) * 1e-3; }
  return z;
}
/** Height (km) of a pressure level p (hPa) for a profile T (interpolating in ln p). */
export function zAtP(T, p, grid = GRID) {
  const z = heights(T, grid), { pm } = grid;
  if (p >= pm[0]) return z[0] * Math.log(PS / p) / Math.log(PS / pm[0]);
  for (let i = 0; i < pm.length - 1; i++) if (p <= pm[i] && p >= pm[i + 1]) { const f = Math.log(pm[i] / p) / Math.log(pm[i] / pm[i + 1]); return z[i] + f * (z[i + 1] - z[i]); }
  return z[z.length - 1];
}
/** Ozone mass mixing ratio (kg/kg) of a stratospheric layer peaking near 10 hPa, scaled to `du` Dobson units. */
export function ozoneProfile(du = 300, grid = GRID) {
  const { N, pm, dp } = grid, raw = pm.map((p) => Math.exp(-0.5 * ((Math.log(p / 12)) / 1.15) ** 2));
  let col = 0; for (let i = 0; i < N; i++) col += (raw[i] * dp[i] * 100) / G0; // kg/m² for unit scale
  const target = du * 2.1415e-5; // 1 DU = 2.14e-5 kg of O₃ per m²
  return raw.map((r) => (r * target) / col);
}
/**
 * Shortwave (UV and visible) heating by ozone in W m⁻² per layer. `uv` = total solar flux in the absorbing bands
 * (default 11 W m⁻²); the Hartley/Huggins absorption has k ≈ `kUV` m²/kg so that 300 DU is optically thick.
 */
export function ozoneHeating(o3, grid = GRID, uv = 11, kUV = 6e3) {
  const { N, dp } = grid, out = new Array(N).fill(0); let tauAbove = 0;
  for (let i = N - 1; i >= 0; i--) { const d = kUV * o3[i] * (dp[i] * 100) / G0; out[i] = uv * (Math.exp(-tauAbove) - Math.exp(-tauAbove - d)); tauAbove += d; }
  return out;
}

/**
 * Grey atmosphere (one infrared band, optical depth τ(p) = τ∞ (p/p_s)² from the top down) in radiative equilibrium,
 * optionally with convective adjustment to `gamma` K/km. Same numerical scheme as `rce`, with σT⁴ in place of spectra.
 * Returns {T (layers), Ts, olr, z (km)} for `grid`.
 */
export function greyColumn(tauInf, o = {}, grid = GRID) {
  const { N, e, dp, pm } = grid, asr = o.asr ?? 240, kk = KAPPA_ADIABAT(o.gamma ?? 6.5), conv = o.convect !== false;
  const dtau = [], tr = []; for (let i = 0; i < N; i++) { dtau.push(tauInf * ((e[i] / PS) ** 2 - (e[i + 1] / PS) ** 2)); tr.push(Math.exp(-DIFF * dtau[i])); }
  const T = standardT(o.Ts0 ?? 288, 6.5, 200, grid); let Ts = o.Ts0 ?? 288;
  const dt = 3 * 86400, C = dp.map((d) => (CP * Math.max(d, 10) * 100) / G0), Cs = 4e6;
  const up = new Float64Array(N + 1), dn = new Float64Array(N + 1), Ce = new Array(N);
  for (let it = 0; it < (o.iters ?? 1500); it++) {
    up[0] = SIG * Ts ** 4; for (let i = 0; i < N; i++) up[i + 1] = up[i] * tr[i] + SIG * T[i] ** 4 * (1 - tr[i]);
    dn[N] = 0; for (let i = N - 1; i >= 0; i--) dn[i] = dn[i + 1] * tr[i] + SIG * T[i] ** 4 * (1 - tr[i]);
    for (let i = 0; i < N; i++) {
      const gain = up[i] - dn[i] - (up[i + 1] - dn[i + 1]), S = 8 * SIG * T[i] ** 3 * (1 - tr[i]);
      Ce[i] = C[i] + S * dt; T[i] += (gain * dt) / Ce[i];
    }
    const Cse = Cs + 4 * SIG * Ts ** 3 * dt; Ts += ((asr - (up[0] - dn[0])) * dt) / Cse;
    if (conv) { if (Ts > T[0]) { const m = (Ts * Cse + T[0] * Ce[0]) / (Cse + Ce[0]); Ts = m; T[0] = m; } convect(T, Ce, kk, grid); }
  }
  return { T, Ts, olr: up[N], z: heights(T, grid) };
}
