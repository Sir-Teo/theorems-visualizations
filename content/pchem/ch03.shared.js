// Physical Chemistry — Chapter 3: shared helpers. Re-exports the (fact-checked) thermochemical table of chapter 2.
export * from './ch02.shared.js';
import { R, CP } from './ch02.shared.js';

/** Gas constant in L·bar/(K·mol). */
export const RL = 0.0831446261815324;

/** Critical constants (K, bar) of a few gases (standard tables); van der Waals a (L² bar/mol²) and b (L/mol) follow from them. */
const CRIT = { Ar: [150.86, 48.98], N2: [126.2, 33.98], CO2: [304.13, 73.77], CH4: [190.56, 45.99], H2: [33.19, 13.13] };
export const VDW = Object.fromEntries(Object.entries(CRIT).map(([k, [Tc, pc]]) => [k, { Tc, pc, a: 27 * RL * RL * Tc * Tc / (64 * pc), b: RL * Tc / (8 * pc) }]));

/** Real roots of c3 x³ + c2 x² + c1 x + c0, ascending. */
export function cubicRoots(c3, c2, c1, c0) {
  const a = c2 / c3, b = c1 / c3, c = c0 / c3;
  const p = b - a * a / 3, q = 2 * a * a * a / 27 - a * b / 3 + c, sh = -a / 3;
  const disc = q * q / 4 + p * p * p / 27;
  let r;
  if (disc > 1e-14) { const s = Math.sqrt(disc); r = [Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s) + sh]; }
  else if (p === 0) r = [sh];
  else { const m = 2 * Math.sqrt(-p / 3), th = Math.acos(Math.max(-1, Math.min(1, 3 * q / (p * m)))) / 3; r = [0, 1, 2].map((k) => m * Math.cos(th - 2 * Math.PI * k / 3) + sh); }
  return r.sort((x, y) => x - y);
}
/** van der Waals pressure (bar) for T (K), molar volume V (L/mol). */
export const vdwP = (g, T, V) => RL * T / (V - g.b) - g.a / (V * V);
/** Molar volumes (L/mol) with pressure p (bar) at T: all real roots > b. */
export const vdwV = (g, T, p) => cubicRoots(p, -(p * g.b + RL * T), g.a, -g.a * g.b).filter((x) => x > g.b);

/** Debye heat capacity C_V / R as a function of T/θ. */
export function debyeCv(t) {
  if (t <= 0) return 0;
  const x = 1 / t;
  if (t < 0.02) return (4 * Math.PI ** 4 / 5) * t ** 3 * 3;
  const n = 400, h = x / n;
  const f = (u) => (u < 1e-8 ? u * u : u ** 4 * Math.exp(u) / ((Math.exp(u) - 1) ** 2));
  let s = f(0) + f(x);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h);
  return 3 * s * h * t ** 3;
}
/** Entropy from Debye heat capacity, S/R, ∫0^T Cv/T dT, with a cached cumulative table per θ. */
const debyeCache = new Map();
export function debyeS(theta, T) {
  let tab = debyeCache.get(theta);
  if (!tab) {
    const Tmax = 320, n = 3200, dT = Tmax / n, S = [0];
    let prev = 0;
    for (let i = 1; i <= n; i++) {
      const T0 = (i - 0.5) * dT;
      prev += debyeCv(T0 / theta) / T0 * dT;
      S.push(prev);
    }
    tab = { S, dT };
    debyeCache.set(theta, tab);
  }
  const x = T / tab.dT, i = Math.min(tab.S.length - 2, Math.floor(x));
  return (tab.S[i] + (tab.S[i + 1] - tab.S[i]) * (x - i)) * R;
}

/** NIST/CODATA standard molar entropies of gases at 298.15 K, J/(K·mol) (NIST Chemistry WebBook, Cox et al. 1984). */
export const S298 = { N2: 191.609, H2: 130.680, NH3: 192.77, CO: 197.660, CO2: 213.785, H2O: 188.835, O2: 205.152 };

/** ∫ Cp/T dT from T1 to T2 (J/(K·mol)) for the a + bT + c/T² form. */
export const intCpT = (sp, T1, T2) => { const [a, b, c] = CP[sp]; return a * Math.log(T2 / T1) + b * (T2 - T1) - c / 2 * (1 / (T2 * T2) - 1 / (T1 * T1)); };
