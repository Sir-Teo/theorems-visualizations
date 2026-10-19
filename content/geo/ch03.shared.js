// Atmosphere & Ocean Dynamics — Chapter 3: helpers shared by ch03.js and ch03-b.js
//
// SI units unless a name says otherwise.  Everything a picture "measures" is computed numerically here.
//
// Sources and what was checked (2026-10):
//  - Ω = 7.2921e-5 s⁻¹ (one turn per sidereal day, 86 164 s), mean Earth radius 6.371e6 m: standard values (as in chapter 2).
//  - Holland (1980) parametric hurricane profile p(r) = p_c + (p_n − p_c) exp(−A/r^B), A = R_m^B:
//    G. J. Holland, Mon. Wea. Rev. 108 (8), 1212–1218, doi:10.1175/1520-0493(1980)108<1212:AAMOTW>2.0.CO;2 (bibliographic data confirmed online).
//  - Dissipative-heating potential intensity: Bister & Emanuel (1998), Meteorol. Atmos. Phys. 65:233–240,
//    §3.1 eq. (21), p. 235. The denominator To replaces the earlier Ts when dissipation heats the atmosphere.
//    The complete author PDF was read; this fixed-outflow-temperature evaluation is not PCMIN.
//  - Saffir–Simpson thresholds: NOAA National Hurricane Center (category 1: 64–82 kt … category 5: ≥ 137 kt), converted to m/s.
export * from './ch01.shared.js';
import { clamp, esat, Lv, EPS } from './ch01.shared.js';

export const OMEGA = 7.2921e-5, A_E = 6.371e6, RAD = Math.PI / 180, TAU = 2 * Math.PI;
export const RGAS = 287.05; // J/(kg K), dry air
export const fcor = (latDeg) => 2 * OMEGA * Math.sin(latDeg * RAD);
export const betaOf = (latDeg) => 2 * OMEGA * Math.cos(latDeg * RAD) / A_E;
export const sgn = (v, x, d = 1) => (x < 0 ? '−' : '') + v.fix(Math.abs(x), d);
export const log10 = (x) => Math.log(x) / Math.LN10;

// ---------------------------------------------------------------------------------------------------------------
// 3.1 / 3.2 / 3.6: a two-centre pressure map, coordinates in km, pressure in hPa
/** centres: [{x, y, a (hPa, negative for a low), s (km)}]; background 1000 hPa. */
export function pAt(centres, x, y) {
  let p = 1000;
  for (const c of centres) p += c.a * Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (2 * c.s * c.s));
  return p;
}
/** gradient of p in Pa per metre */
export function gradP(centres, x, y) {
  let gx = 0, gy = 0;
  for (const c of centres) {
    const e = c.a * Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (2 * c.s * c.s)) / (c.s * c.s);
    gx += -(x - c.x) * e; gy += -(y - c.y) * e; // hPa per km²·km → hPa/km
  }
  return [gx * 100 / 1000, gy * 100 / 1000]; // hPa/km → Pa/m
}
/** Laplacian of p in Pa/m² */
export function lapP(centres, x, y) {
  let s = 0;
  for (const c of centres) {
    const r2 = (x - c.x) ** 2 + (y - c.y) ** 2, e = c.a * Math.exp(-r2 / (2 * c.s * c.s));
    s += e * (r2 / c.s ** 4 - 2 / (c.s * c.s));
  }
  return s * 100 / 1e6; // hPa/km² → Pa/m²
}
/** geostrophic wind (m/s) from a Pa/m gradient: u = −p_y/(ρ f), v = p_x/(ρ f) */
export const geoWind = (g, f, rho = 1.2) => [-g[1] / (rho * f), g[0] / (rho * f)];

// ---------------------------------------------------------------------------------------------------------------
// 3.3: gradient wind  V²/r + fV = G,  G = (1/ρ) dp/dr, V > 0 anticlockwise (cyclonic in the north).
/** Both roots {reg, anom} (null when G < −f² r / 4) for signed f, r in m, G in m/s². */
export function gradientRoots(f, r, G) {
  const D = f * f * r * r / 4 + r * G;
  if (D < 0) return null;
  return { reg: -f * r / 2 + Math.sqrt(D) * Math.sign(f || 1), anom: -f * r / 2 - Math.sqrt(D) * Math.sign(f || 1) };
}

// ---------------------------------------------------------------------------------------------------------------
// 3.4 / 3.5: temperature field T(y, z or p) and geostrophic wind by honest hydrostatic integration.
/** Reference temperature profile (K) at pressure p (hPa): a simple troposphere (6.5 K/km) with an isothermal stratosphere. */
export const TBAR = (p) => Math.max(216.65, 288.15 * Math.pow(p / 1013.25, 0.19026));

// ---------------------------------------------------------------------------------------------------------------
// 3.7: 1-D linear rotating shallow water, staggered (Arakawa C) grid, forward–backward in time.
//   u_t = f v − g η_x,  v_t = −f u,  η_t = −H u_x ;   initial η = ±η0/2 (a step in x), at rest.
//   Returns {x (km), frames: [{t, eta[], v[], u[]}], Ld (m), c, f, W (m), dt}.
export function adjustSim({ f, H, eta0 = 1, g = 9.80665, nx = 600, nframes = 160, Wfac = 6 }) {
  const c = Math.sqrt(g * H), feff = Math.max(Math.abs(f), 0.05 * 1.031e-4);
  const Ld = c / feff, W = f === 0 ? 3.0e6 : Wfac * Ld, dx = 2 * W / nx;
  const T = f === 0 ? 4 * W / c : 16 / feff, dt = 0.45 * dx / c, nsteps = Math.ceil(T / dt);
  const eta = new Float64Array(nx), v = new Float64Array(nx), u = new Float64Array(nx + 1);
  const xs = new Float64Array(nx);
  for (let i = 0; i < nx; i++) { xs[i] = -W + (i + 0.5) * dx; eta[i] = 0.5 * eta0 * Math.tanh(xs[i] / (1.5 * dx)); }
  const frames = [], every = Math.max(1, Math.floor(nsteps / nframes));
  const snap = (t) => frames.push({ t, eta: Float64Array.from(eta), v: Float64Array.from(v), u: Float64Array.from(u) });
  snap(0);
  for (let n = 1; n <= nsteps; n++) {
    for (let i = 1; i < nx; i++) u[i] += dt * (f * 0.5 * (v[i - 1] + v[i]) - g * (eta[i] - eta[i - 1]) / dx);
    u[0] = -(c / H) * (eta[0] + eta0 / 2); u[nx] = (c / H) * (eta[nx - 1] - eta0 / 2); // Flather radiation condition about the far-field state ±η0/2
    for (let i = 0; i < nx; i++) eta[i] -= dt * H * (u[i + 1] - u[i]) / dx;
    for (let i = 0; i < nx; i++) v[i] -= dt * f * 0.5 * (u[i] + u[i + 1]);
    if (n % every === 0) snap(n * dt);
  }
  return { xs, frames, Ld, c, f, W, dt, dx, nx, eta0, H, g, T };
}
/** analytic final (balanced) state η(x) of the step problem: (η0/2) sgn x (1 − e^{−|x|/Ld}); flat (0) without rotation. */
export const etaFinal = (x, Ld, eta0, rot) => rot ? 0.5 * eta0 * Math.sign(x) * (1 - Math.exp(-Math.abs(x) / Ld)) : 0;

// ---------------------------------------------------------------------------------------------------------------
// 3.8: linear shallow-water waves on the β-plane, wave (k, 0): the cubic  ω³ − ω (f² + c²K²) − β c² k = 0  (full)
//      versus the quasi-geostrophic Rossby wave  ω = −β k / (K² + 1/Ld²).
/** the three real roots of ω³ − aω − b = 0 (a > 0): sorted ascending */
export function cubicRoots(a, b) {
  // trigonometric solution of ω³ + pω + q = 0 with p = −a, q = −b
  const p = -a, q = -b;
  const r = 2 * Math.sqrt(a / 3), arg = clamp(3 * q / (p * r) , -1, 1);
  const th = Math.acos(arg) / 3;
  return [0, 1, 2].map((k) => r * Math.cos(th - TAU * k / 3)).sort((x, y) => x - y);
}

// ---------------------------------------------------------------------------------------------------------------
// 3.9: tropical cyclone: Holland profile, gradient wind, potential intensity.
export const RHO_TC = 1.15;
/** saturation specific humidity at T (K), p (Pa) */
const qsat = (T, p) => { const e = esat(T); return EPS * e / (p - (1 - EPS) * e); };
/** Simplified Emanuel potential intensity (m/s): V² = (Ck/Cd) (Ts − To)/To (k0* − k).
 *  k = cp T + Lv q for near-surface air at SST−1 K, relative humidity 80%, p = 1010 hPa; k0* the saturated enthalpy at the SST. */
export function potentialIntensity(sstC, To = 203, CkCd = 1, rh = 0.8) {
  const Ts = sstC + 273.15, p = 101000, Ta = Ts - 1, cp = 1005;
  const k0 = cp * Ts + Lv(Ts) * qsat(Ts, p);
  const ea = rh * esat(Ta), q = EPS * ea / (p - (1 - EPS) * ea), k = cp * Ta + Lv(Ta) * q;
  const dk = Math.max(0, k0 - k), eff = (Ts - To) / To;
  return { V: Math.sqrt(Math.max(0, CkCd * eff * dk)), dk, eff, k0, k };
}
/** Holland pressure (Pa) at radius r (m) */
export const hollandP = (r, pc, pn, Rm, B) => pc + (pn - pc) * Math.exp(-Math.pow(Rm / Math.max(r, 1), B));
/** gradient wind (m/s, positive anticlockwise = cyclonic in the north) of the Holland profile at radius r (m) */
export function hollandV(r, pc, pn, Rm, B, f, rho = RHO_TC) {
  const x = Math.pow(Rm / Math.max(r, 1), B);
  const dpdr = (pn - pc) * Math.exp(-x) * B * x / Math.max(r, 1);
  const G = dpdr / rho, D = f * f * r * r / 4 + r * G;
  return -Math.abs(f) * r / 2 + Math.sqrt(Math.max(D, 0)); // f > 0 for the northern hemisphere; speed is the magnitude
}
/** Continuous maximum of this radial wind profile; the radius parameter is not the exact peak when f!=0. */
export function hollandMaximum(pc, pn, Rm, B, f) {
  let lo = .03 * Rm, hi = 4 * Rm;
  const ratio = (Math.sqrt(5) - 1) / 2;
  let x = hi - ratio * (hi - lo), y = lo + ratio * (hi - lo);
  let vx = hollandV(x, pc, pn, Rm, B, f), vy = hollandV(y, pc, pn, Rm, B, f);
  for (let k = 0; k < 70; k++) {
    if (vx > vy) { hi = y; y = x; vy = vx; x = hi - ratio * (hi - lo); vx = hollandV(x, pc, pn, Rm, B, f); }
    else { lo = x; x = y; vx = vy; y = lo + ratio * (hi - lo); vy = hollandV(y, pc, pn, Rm, B, f); }
  }
  const radius = (lo + hi) / 2;
  return { radius, speed: hollandV(radius, pc, pn, Rm, B, f) };
}
/** Central pressure deficit (Pa) matching the actual continuous gradient-wind peak. */
export function deficitForVmax(Vmax, Rm, B, f) {
  let lo = 0, hi = 8e4;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2, peak = hollandMaximum(1e5 - mid, 1e5, Rm, B, f).speed;
    (peak < Vmax ? lo = mid : hi = mid);
  }
  return (lo + hi) / 2;
}
export const SAFFIR = [[32.9, 'tropical storm or weaker'], [42.7, 'category 1'], [49.4, 'category 2'], [58.1, 'category 3'], [70.5, 'category 4'], [Infinity, 'category 5']];
export const saffirName = (V) => (V < 32.9 ? 'below hurricane strength' : V < 42.7 ? 'category 1' : V < 49.4 ? 'category 2' : V < 58.1 ? 'category 3' : V < 70.5 ? 'category 4' : 'category 5');
