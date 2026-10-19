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
  // chroma stretch about the mean so that the (physically pale) star colours stay distinguishable on a panel
  const out = [r, g, b].map((c) => Math.pow(c / m, 0.5));
  const mean = (out[0] + out[1] + out[2]) / 3;
  const res = out.map((c) => Math.max(0, Math.min(255, Math.round(255 * (mean + 2.6 * (c - mean))))));
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
/** Ballesteros (2012), eq.(14), arXiv:1201.1809v2 p.4; full relevant derivation inspected. */
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

// ── Empirical main-sequence mass–luminosity fit: Eker et al.(2018), §3.1, Table4 p.18.
// log10(L/Lsun)=a log10(M/Msun)+b. Independent fitted branches are not forced continuous.
export const MLR = [
  [.179,.45,2.028,-.976], [.45,.72,4.572,-.102], [.72,1.05,5.743,-.007],
  [1.05,2.4,4.329,.010], [2.4,7,3.967,.093], [7,31,2.865,1.105],
];
const mlBranch = M => M>=.179 && M<=31 ? MLR.find(r=>M<=r[1]) : null;
export function lumOfMass(M) { const row=mlBranch(M); return row ? 10**(row[2]*Math.log10(M)+row[3]) : NaN; }
/** Local logarithmic slope inside a fitted mass branch, undefined outside the calibrated range. */
export const mlSlope = M => mlBranch(M)?.[2] ?? NaN;

/** Homogeneous LTE slab formal solution: Tatum ch5 eq5.7.2 plus attenuated background. */
export const slabIntensity = (background,source,tau) => background*Math.exp(-tau)+source*(-Math.expm1(-tau));
/** Neutral/excited absorber population proxy, not an equivalent-width calculation. */
export const balmerAbsorber = (T,Pe) => popFrac(2,T,10)/(1+sahaRatio(T,Pe));
