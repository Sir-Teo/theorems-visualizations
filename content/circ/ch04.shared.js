// Circuits — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (re-exports chapter 3's, which re-export chapters 2 and 1)
export * from './ch03.shared.js';

/** k_B / e in V/K (exact in the 2019 SI). */
export const KB_Q = 8.617333262e-5;
/** Thermal voltage kT/q in volts. */
export const vT = (T = 300) => KB_Q * T;
/** Shockley diode law i = I_s (exp(v / n V_T) − 1), exponent clamped to avoid overflow. */
export const shock = (v, Is, n = 1, T = 300) => Is * (Math.exp(Math.min(v / (n * vT(T)), 80)) - 1);
/** Voltage that carries current i through a Shockley diode. */
export const shockV = (i, Is, n = 1, T = 300) => n * vT(T) * Math.log(1 + i / Is);
/** Bisection for the root of a decreasing function f on [lo, hi]. */
export function bisectDec(f, lo, hi, it = 90) {
  for (let k = 0; k < it; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Diode in series with a Thévenin source (Vth, R): the operating point (v, i). */
export function loadDiode(Vth, R, Is, n = 1, T = 300) {
  const vd = bisectDec((x) => (Vth - x) / R - shock(x, Is, n, T), -Math.abs(Vth) - 5, Math.abs(Vth) + 5);
  return { v: vd, i: (Vth - vd) / R };
}
/** n-channel MOSFET, square-law model with channel-length modulation λ; vgs, vds ≥ 0 (k in A/V², Vt in V). Continuous at vds = vgs − Vt. */
export function mos(vgs, vds, Vt, k, lam = 0) {
  const vov = vgs - Vt;
  if (vov <= 0 || vds <= 0) return 0;
  return vds < vov ? k * (vov * vds - 0.5 * vds * vds) * (1 + lam * vds) : 0.5 * k * vov * vov * (1 + lam * vds);
}
/** Region name of an n-channel MOSFET. */
export const mosRegion = (vgs, vds, Vt) => (vgs <= Vt ? 'cutoff' : vds < vgs - Vt ? 'triode' : 'saturation');
/** Inverter output for n- and p-channel pair (symmetric thresholds): solves I_n(vin, vo) = I_p(Vdd − vin, Vdd − vo). */
export function cmosOut(vin, Vdd, Vt, kn, kp, lam = 0.03) {
  return bisectDec((vo) => mos(Vdd - vin, Vdd - vo, Vt, kp, lam) - mos(vin, vo, Vt, kn, lam), -1e-9, Vdd + 1e-9, 80);
}
/** Pretty number with SI prefix as plain text, e.g. 2.3e-6 → "2.3 µ". */
export function eng(x, d = 2) {
  if (x === 0) return '0';
  const p = ['f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G'], e = Math.max(-5, Math.min(3, Math.floor(Math.log10(Math.abs(x)) / 3 + 1e-9)));
  const m = x / Math.pow(10, 3 * e);
  return `${Number(m.toPrecision(d)).toString()} ${p[e + 5]}`.trim();
}

/** TeX version of eng with a unit made of letters, e.g. engTex(3.9e4, 3, 'Hz') → "39\,\mathrm{kHz}" (for use inside $…$). */
export function engTex(x, d = 3, unit = '') {
  if (x === 0) return `0\\,\\mathrm{${unit}}`;
  const p = ['f', 'p', 'n', '\\mu', 'm', '', 'k', 'M', 'G'], e = Math.max(-5, Math.min(3, Math.floor(Math.log10(Math.abs(x)) / 3 + 1e-9)));
  const m = Number((x / Math.pow(10, 3 * e)).toPrecision(d)).toString();
  const pre = p[e + 5];
  return pre === '\\mu' ? `${m}\\,\\mu\\mathrm{${unit}}` : `${m}\\,\\mathrm{${pre}${unit}}`;
}
