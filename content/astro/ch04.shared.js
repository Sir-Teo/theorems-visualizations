// Astrophysics & Celestial Mechanics — Chapter 4: helpers shared by ch04.js and ch04-b.js
// (re-exports the chapter-3 helpers, which re-export chapter 2's; constants G, C_LIGHT, AU, L_SUN, K_B, YEAR, …)
export * from './ch03.shared.js';
import { C_LIGHT, K_B, L_SUN, AU, TAU } from './ch03.shared.js';

// ── constants (SI) ───────────────────────────────────────────────────────────
// h, k_B, e, m_e, sigma: CODATA 2018 / SI-2019 exact values. R_sun, L_sun, au, pc: IAU 2015 nominal / IAU 2012.
export const H_PL = 6.62607015e-34, EV = 1.602176634e-19, M_E = 9.1093837015e-31, SIGMA = 5.670374419e-8;
export const PC = (648000 / Math.PI) * AU, R_SUN = 6.957e8, T_SUN = 5772; // T_sun: IAU 2015 nominal effective temperature
export const CHI_H = 13.598434; // hydrogen ionization energy, eV

// ── blackbody radiation ──────────────────────────────────────────────────────
/** Planck spectral radiance B_lambda(T), W m^-2 sr^-1 m^-1, lambda in metres. */
export function planckL(lam, T) {
  const x = (H_PL * C_LIGHT) / (lam * K_B * T);
  return x > 700 ? 0 : (2 * H_PL * C_LIGHT * C_LIGHT) / (lam ** 5 * Math.expm1(x));
}
/** Peak wavelength of B_lambda (Wien), metres. */
export const wienPeak = (T) => 2.897771955e-3 / T;

/** Approximate colour of a blackbody of temperature T (K) as an sRGB triple (0-255), with the spectrum folded through
 *  the crude colour matching of M.wavelengthRGB; stretched so the brightest channel is 255. Illustrative, not colorimetry. */
const bbCache = new Map();
export function bbColor(v, T) {
  const key = Math.round(T / 25);
  if (bbCache.has(key)) return bbCache.get(key);
  let r = 0, g = 0, b = 0;
  for (let nm = 380; nm <= 780; nm += 5) {
    const w = planckL(nm * 1e-9, T), c = v.M.wavelengthRGB(nm, 1);
    r += w * c[0]; g += w * c[1]; b += w * c[2];
  }
  const m = Math.max(r, g, b) || 1;
  // desaturate towards white so that a 5800 K Sun looks yellow-white rather than orange
  const out = [r, g, b].map((c) => Math.round(255 * Math.pow(c / m, 0.45)));
  const mx = Math.max(...out), mn = Math.min(...out);
  const lift = 0.35 * (mx - mn);
  const res = out.map((c) => Math.min(255, Math.round(c + lift * (c < mx ? 1 : 0))));
  bbCache.set(key, res);
  return res;
}

// ── toy B and V filters (Gaussian curves; real Johnson–Morgan curves are tabulated) ─────────────────────────────
export const BAND = { B: { c: 440, fwhm: 100 }, V: { c: 550, fwhm: 88 } };
export const bandT = (b, nm) => Math.exp(-0.5 * ((nm - BAND[b].c) / (BAND[b].fwhm / 2.3548)) ** 2);
const bandFlux = (b, T) => { let s = 0; for (let nm = 300; nm <= 800; nm += 2) s += planckL(nm * 1e-9, T) * bandT(b, nm) * 1e-9; return s; };
/** Toy colour index -2.5 log10(F_B/F_V) + zero point. The zero point is set so that the Sun (5772 K) has B-V = 0.65. */
const BV_ZERO = (() => 0.65 + 2.5 * Math.log10(bandFlux('B', T_SUN) / bandFlux('V', T_SUN)))();
export const bvToy = (T) => -2.5 * Math.log10(bandFlux('B', T) / bandFlux('V', T)) + BV_ZERO;
/** Ballesteros (2012) blackbody B-V -> T formula (from memory: verify). */
export const tBallesteros = (bv) => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

// ── hydrogen level populations and ionization ────────────────────────────────
/** Energy of level n of hydrogen above the ground state, eV. */
export const eLevel = (n) => CHI_H * (1 - 1 / (n * n));
/** Boltzmann: N_n / N_1 for hydrogen (statistical weights g_n = 2 n^2). */
export const boltz = (n, T) => (n * n) * Math.exp(-eLevel(n) * EV / (K_B * T));
/** Fraction of neutral hydrogen atoms in level n, with the partition function cut at level nmax. */
export function popFrac(n, T, nmax = 10) { let z = 0; for (let m = 1; m <= nmax; m++) z += boltz(m, T); return boltz(n, T) / z; }
/** Saha ratio N_II / N_I for pure hydrogen at electron pressure Pe (Pa). g_II = 1, g_I = 2 (the 2 from the electron's two spin states cancels it). */
export function sahaRatio(T, Pe, chi = CHI_H, gRatio = 1) {
  const kT = K_B * T;
  return gRatio * Math.pow(TAU * M_E * kT / (H_PL * H_PL), 1.5) * kT / Pe * Math.exp(-chi * EV / kT);
}
/** Ionized fraction of hydrogen N_II / (N_I + N_II). */
export const ionFrac = (T, Pe) => { const R = sahaRatio(T, Pe); return R / (1 + R); };

// ── spectral classes: approximate temperature boundaries (K) ─────────────────
export const CLASSES = [
  { c: 'O', lo: 30000, hi: 50000 }, { c: 'B', lo: 10000, hi: 30000 }, { c: 'A', lo: 7500, hi: 10000 },
  { c: 'F', lo: 6000, hi: 7500 }, { c: 'G', lo: 5200, hi: 6000 }, { c: 'K', lo: 3700, hi: 5200 }, { c: 'M', lo: 2400, hi: 3700 },
];

// ── mass–luminosity: piecewise power-law fit to main-sequence stars (masses and luminosities in solar units) ──
// L = 0.23 M^2.3 (M < 0.43), M^4 (0.43..2), 1.4 M^3.5 (2..55), 32000 M (M > 55)   [Salaris & Cassisi 2005 / Duric 2004]
export function lumOfMass(M) {
  if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
  if (M < 2) return Math.pow(M, 4);
  if (M < 55) return 1.4 * Math.pow(M, 3.5);
  return 32000 * M;
}
/** Local logarithmic slope d log L / d log M of lumOfMass. */
export const mlSlope = (M) => (M < 0.43 ? 2.3 : M < 2 ? 4 : M < 55 ? 3.5 : 1);
