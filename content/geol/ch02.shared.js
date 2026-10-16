// Geology & Geophysics — Chapter 2: helpers shared by ch02.js and ch02-b.js
//
// Decay constants (per year). Conventional literature values (Jaffey 1971; Steiger & Jäger 1977; Nebel 2011): ²³⁸U 1.55125e-10 and ²³⁵U 9.8485e-10 (Jaffey et al. 1971),
// ⁸⁷Rb 1.393e-11 (the value of Nebel et al. 2011 (Minster et al. 1982 gave 1.402e-11); Steiger & Jäger 1977 had recommended 1.42e-11), ⁴⁰K total 5.543e-10 with electron-capture branch 0.581e-10
// (Steiger & Jäger 1977), ¹⁴C half-life 5730 yr (Libby convention 5568), ¹⁰Be half-life 1.387 Myr.
// ²³⁸U/²³⁵U today = 137.88.

export const LN2 = Math.LN2;
export const LAM = {
  U238: 1.55125e-10,
  U235: 9.8485e-10,
  Rb87: 1.393e-11,
  K40: 5.543e-10,
  K40e: 0.581e-10,
  Sm147: 6.54e-12,
  Th232: 4.9475e-11,
  C14: LN2 / 5730,
  Be10: LN2 / 1.387e6,
};
export const U_RATIO = 137.88;

/** Duration or age in years → text ("4.55 Gyr", "5730 yr"). */
export function fmtYr(y, sig = 3) {
  if (!isFinite(y)) return '∞';
  const a = Math.abs(y);
  const f = (x) => { const s = Number(x.toPrecision(sig)); return s >= 10000 ? s.toLocaleString('en-US').replace(/,/g, ' ') : String(s); };
  if (a < 1) return `${f(y * 365.25)} days`;
  if (a < 1e4) return `${f(y)} yr`;
  if (a < 1e6) return `${f(y / 1e3)} kyr`;
  if (a < 1e9) return `${f(y / 1e6)} Myr`;
  return `${f(y / 1e9)} Gyr`;
}
/** Age in years → text in Ma/Ga for geologic ages. */
export function fmtMa(y, d = 2) {
  const a = Math.abs(y);
  return a >= 1e9 ? `${(y / 1e9).toFixed(d)} Ga` : `${(y / 1e6).toFixed(a >= 1e8 ? 0 : d)} Ma`;
}
/** Age equation for a stable daughter: t = ln(1 + D/P) / λ. */
export const ageOf = (R, lam) => Math.log(1 + R) / lam;
/** Daughter/parent ratio after time t. */
export const ratioAt = (t, lam) => Math.expm1(lam * t);
