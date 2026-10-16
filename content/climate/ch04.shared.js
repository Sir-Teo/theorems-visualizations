// Climate Science — Chapter 4 shared helpers: feedbacks.
// Re-exports the chapter-3 helpers (which re-export chapter 2's column) and adds moist-adiabat warming patterns, a
// cloud layer for the column, a tridiagonal solver and the AR6 feedback numbers that several items quote.
//
// AR6 numbers (IPCC AR6 WG1 Chapter 7, Table 7.10 and §7.4.2, read from the chapter PDF on ipcc.ch, 2026-10), W m⁻² °C⁻¹:
//   Planck −3.22 (very likely −3.4 to −3.0); water vapour + lapse rate +1.30 (1.1 to 1.5); surface albedo +0.35 (0.10 to 0.60);
//   clouds +0.42 (−0.10 to +0.94); biogeophysical and non-CO2 biogeochemical −0.01; net −1.16 (−1.81 to −0.51).
//   Water vapour alone 1.77 ± 0.20 (CMIP5/6, one s.d.), constant-RH lapse rate LR* −0.10 ± 0.07, Clausius–Clapeyron 1.36 ± 0.04.
//   Arctic amplification ranges from a factor two to four in ESM projections of 21st-century warming (§7.4.4).
import { GRID, esat, opticalDepths, longwave, BASE } from './ch03.shared.js';
export * from './ch03.shared.js';

export const AR6 = { planck: -3.22, wvlr: 1.30, albedo: 0.35, cloud: 0.42, other: -0.01, net: -1.16, wv: 1.77, lrStar: -0.10 };
export const LAM0 = 3.22; // AR6 Planck magnitude, W m⁻² K⁻¹

/** Moist-adiabatic temperature (K) at pressures `ps` (hPa, any order) for a 1000 hPa air temperature `Ts`. */
export function moistProfile(Ts, ps) {
  const Lv = 2.5e6, cpd = 1004, Rd = 287, eps = 0.622;
  const slope = (T, p) => { const es = Math.min(esat(T), 0.99 * p * 100), rs = (eps * es) / (p * 100 - es); return (Rd + (Lv * rs) / T) / (cpd + (Lv * Lv * rs * eps) / (Rd * T * T)); };
  const order = ps.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]), out = new Array(ps.length);
  let T = Ts, lp = Math.log(1000);
  for (const [p, i] of order) {
    const target = Math.log(p), n = Math.max(1, Math.ceil(Math.abs(lp - target) / 0.04)), h = (target - lp) / n;
    for (let k = 0; k < n; k++) {
      const f = (t, l) => slope(t, Math.exp(l)) * t; // dT/dlnp
      const k1 = f(T, lp), k2 = f(T + 0.5 * h * k1, lp + h / 2), k3 = f(T + 0.5 * h * k2, lp + h / 2), k4 = f(T + h * k3, lp + h);
      T += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); lp += h;
    }
    out[i] = T;
  }
  return out;
}
/**
 * Warming at each layer of GRID per kelvin of surface warming for a tropical moist adiabat (surface air at `Ts` K), tapered to
 * zero between 130 and 70 hPa (the tropopause). Values above 1 aloft are the lapse-rate effect.
 */
export function tropicalAmp(Ts = 300) {
  const pm = GRID.pm, a = moistProfile(Ts, pm), b = moistProfile(Ts + 1, pm);
  return pm.map((p, i) => { const w = p >= 130 ? 1 : p <= 70 ? 0 : (p - 70) / 60; return w * (b[i] - a[i]); });
}
/** Surface-trapped (inversion-like) warming pattern: ≈1 at the ground, decaying with height (high latitudes in winter). */
export function polarAmp() { return GRID.pm.map((p) => 0.12 + 0.88 * Math.exp(-(1000 - p) / 170)); }

/** Thomas algorithm for a tridiagonal system: a (sub), b (diag), c (super), d (rhs). */
export function tridiag(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

/**
 * Outgoing longwave radiation of the column with a single grey cloud layer. `pc`: cloud-top pressure (hPa), `ec`: cloud emissivity.
 * Returns the all-sky mean OLR for a cloud fraction `c` (clear + cloudy columns weighted), and the clear-sky OLR.
 */
export function cloudOLR(T, Ts, co2, q, pc, ec, c) {
  const tau = opticalDepths(T, { ...BASE, co2, q }, GRID);
  const clear = lwFrom(T, Ts, tau);
  let k = 0; for (let i = 0; i < GRID.N; i++) if (GRID.pm[i] >= pc) k = i;
  const add = -Math.log(Math.max(1e-6, 1 - Math.min(ec, 0.999999))) / 1.66;
  const t2 = tau.map((r, i) => (i === k ? r.map((x) => x + add) : r));
  const cloudy = lwFrom(T, Ts, t2);
  return { clear, cloudy, all: (1 - c) * clear + c * cloudy };
}
function lwFrom(T, Ts, tau) { return longwave(T, Ts, tau, BASE, GRID).olr; }

/** Interpolated lookup of the temperature (K) of a column profile at pressure p (hPa), linear in ln p. */
export function tAtP(T, p) {
  const pm = GRID.pm;
  if (p >= pm[0]) return T[0];
  for (let i = 0; i < pm.length - 1; i++) if (p <= pm[i] && p >= pm[i + 1]) { const f = Math.log(pm[i] / p) / Math.log(pm[i] / pm[i + 1]); return T[i] + f * (T[i + 1] - T[i]); }
  return T[T.length - 1];
}
/** Pressure (hPa) at which profile T has temperature `Tw` (searching the troposphere from the surface up); null if not found. */
export function pAtT(T, Tw) {
  const pm = GRID.pm;
  for (let i = 0; i < pm.length - 1; i++) if ((T[i] - Tw) * (T[i + 1] - Tw) <= 0 && T[i] !== T[i + 1]) { const f = (T[i] - Tw) / (T[i] - T[i + 1]); return Math.exp(Math.log(pm[i]) + f * (Math.log(pm[i + 1]) - Math.log(pm[i]))); }
  return Tw > T[0] ? pm[0] : null;
}
