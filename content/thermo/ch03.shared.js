// Thermodynamics & Statistical Mechanics — Chapter 3: helpers shared by ch03.js and ch03-b.js
//
// Units are SI throughout (J, m³, Pa, K, mol) unless a name says otherwise; pictures convert to L, bar and kJ for display.
// The real-fluid model is the van der Waals equation with handbook constants; every derivative a picture "measures" is
// a centred finite difference of a state function, never a closed-form shortcut.

export { clamp, lerp, R, ramp, pick, tRamp, band, reservoir, device, cylinder, packets, along } from './ch02.shared.js';
import { clamp, R } from './ch02.shared.js';

// CODATA 2018 exact / recommended values
export const KB = 1.380649e-23, NA = 6.02214076e23, HP = 6.62607015e-34, AMU = 1.66053906660e-27, FARADAY = 96485.33212;

/**
 * Van der Waals constants a (L² bar / mol²) and b (L / mol) from the CRC Handbook of Chemistry and Physics (Weast, 53rd
 * ed., 1972), as tabulated on Wikipedia's "Van der Waals constants (data page)"; CO₂'s a = 3.640 is the CRC value.
 * cv = constant molar heat capacity used by the model (classical translation + rotation; for CO₂ the room-temperature
 * value ≈ 3.5 R, which includes some vibration). M in g/mol.
 */
export const GAS = {
  Ar: { name: 'argon', tex: '\\mathrm{Ar}', M: 39.948, cv: 1.5, a: 1.355, b: 0.03201 },
  N2: { name: 'nitrogen', tex: '\\mathrm{N_2}', M: 28.0134, cv: 2.5, a: 1.370, b: 0.0387 },
  CO2: { name: 'carbon dioxide', tex: '\\mathrm{CO_2}', M: 44.0095, cv: 3.5, a: 3.640, b: 0.04267 },
  He: { name: 'helium', tex: '\\mathrm{He}', M: 4.002602, cv: 1.5, a: 0.0346, b: 0.0238 },
  H2: { name: 'hydrogen', tex: '\\mathrm{H_2}', M: 2.01588, cv: 2.5, a: 0.2476, b: 0.02661 },
};

/**
 * Molar van der Waals fluid for gas key (ideal = true sets a = b = 0). All functions take (T in K, v in m³/mol).
 * Entropy: Sackur–Tetrode translational part with the free volume v − b, plus (cv − 3/2 R) ln(T / 298.15 K) for
 * internal motions (so it is absolute for monatomic gases). f = u − Ts, g = f + Pv (= μ per mole), h = u + Pv.
 */
export function vdw(key, ideal = false) {
  const G = GAS[key], a = ideal ? 0 : G.a * 0.1, b = ideal ? 0 : G.b * 1e-3, cv = G.cv * R, m = G.M * AMU;
  const lam3 = (T) => (HP * HP / (2 * Math.PI * m * KB * T)) ** 1.5;
  const P = (T, v) => R * T / (v - b) - a / (v * v);
  const u = (T, v) => cv * T - a / v;
  const s = (T, v) => R * (Math.log((v - b) / NA / lam3(T)) + 2.5) + (cv - 1.5 * R) * Math.log(T / 298.15);
  const f = (T, v) => u(T, v) - T * s(T, v);
  const g = (T, v) => f(T, v) + P(T, v) * v;
  const h = (T, v) => u(T, v) + P(T, v) * v;
  const Tc = a ? 8 * a / (27 * R * b) : 0, Pc = a ? a / (27 * b * b) : 0, vc = 3 * b;
  /** Real roots (ascending, all > b) of P(T, v) = p. */
  const roots = (T, p) => cubicRoots(1, -(b + R * T / p), a / p, -a * b / p).filter((x) => x > b * 1.0000001).sort((x, y) => x - y);
  /** Volume at (T, p): branch 'stable' (lowest g), 'gas' (largest root) or 'liquid' (smallest). */
  const vOf = (T, p, branch = 'stable') => {
    const r = roots(T, p); if (!r.length) return NaN;
    if (r.length === 1 || branch === 'gas') return r[r.length - 1];
    if (branch === 'liquid') return r[0];
    return g(T, r[0]) < g(T, r[r.length - 1]) ? r[0] : r[r.length - 1];
  };
  /** Temperature with u(T, v) = U (per mole). */
  const TofU = (U, v) => (U + a / v) / cv;
  return { key, G, a, b, cv, m, P, u, s, f, g, h, Tc, Pc, vc, roots, vOf, TofU, ideal };
}

/** Real roots of A x³ + B x² + C x + D (A ≠ 0), by the trigonometric / Cardano formulas. */
export function cubicRoots(A, B, C, D) {
  const b = B / A, c = C / A, d = D / A;
  const p = c - b * b / 3, q = 2 * b ** 3 / 27 - b * c / 3 + d, sh = -b / 3;
  const disc = (q / 2) ** 2 + (p / 3) ** 3;
  if (Math.abs(p) < 1e-300) return [Math.cbrt(-q) + sh];
  if (disc > 0) { const sq = Math.sqrt(disc); return [Math.cbrt(-q / 2 + sq) + Math.cbrt(-q / 2 - sq) + sh]; }
  const r = 2 * Math.sqrt(-p / 3), phi = Math.acos(clamp(3 * q / (p * r), -1, 1)) / 3;
  return [0, 1, 2].map((k) => r * Math.cos(phi - 2 * Math.PI * k / 3) + sh);
}

/**
 * (∂A/∂B)_C at the state (T, v), where A, B, C are functions of (T, v): centred finite differences give the three
 * gradients on the (T, v) plane; moving along the level line of C (direction ⊥ ∇C) the ratio dA/dB is the derivative.
 */
export function pdiff(A, B, C, T, v, rel = 1e-4) {
  const hT = T * rel, hv = v * rel;
  const gr = (F) => [(F(T + hT, v) - F(T - hT, v)) / (2 * hT), (F(T, v + hv) - F(T, v - hv)) / (2 * hv)];
  const gA = gr(A), gB = gr(B), gC = gr(C);
  const dT = gC[1], dv = -gC[0];   // tangent to the level line of C
  return (gA[0] * dT + gA[1] * dv) / (gB[0] * dT + gB[1] * dv);
}

/**
 * Entropy S(U, V, n) of n mol of a (van der Waals or ideal) fluid M = vdw(…): U in J, V in m³. NaN where the state is
 * impossible (T ≤ 0 or V ≤ nb).
 */
export function sUVN(Mo, U, V, n) {
  const v = V / n, T = Mo.TofU(U / n, v);
  if (!(T > 0) || !(v > Mo.b)) return NaN;
  return n * Mo.s(T, v);
}

/** Centred finite-difference partial derivatives of a function of several variables: d(F, x, i, h). */
export function dpart(F, x, i, h) { const a = x.slice(), b = x.slice(); a[i] += h; b[i] -= h; return (F(...a) - F(...b)) / (2 * h); }

// ---------- water at 1 atm, 0–100 °C ----------
/** Kell (1975), J. Chem. Eng. Data 20, 97: density (kg/m³) and isothermal compressibility (1/Pa) of air-free water at 1 atm. */
export const kellRho = (t) => (999.83952 + 16.945176 * t - 7.9870401e-3 * t * t - 46.170461e-6 * t ** 3 + 105.56302e-9 * t ** 4 - 280.54253e-12 * t ** 5) / (1 + 16.879850e-3 * t);
export const kellKappa = (t) => 1e-11 * (50.88496 + 0.6163813 * t + 1.459187e-3 * t * t + 20.08438e-6 * t ** 3 - 58.47727e-9 * t ** 4 + 410.4110e-12 * t ** 5) / (1 + 19.67348e-3 * t);
/** Thermal expansion coefficient α = −(1/ρ) dρ/dT from Kell's density, by a centred difference (1/K). */
export const kellAlpha = (t) => -(kellRho(t + 0.01) - kellRho(t - 0.01)) / 0.02 / kellRho(t);
/** Liquid water at 1 atm, IAPWS-95 via the NIST Chemistry WebBook (as in ch02-b): t (°C), c_p, c_v (kJ/(kg K)). */
export const WATER = [[0.01, 4.2194, 4.2170], [10.01, 4.1951, 4.1905], [20.01, 4.1840, 4.1566], [30.01, 4.1798, 4.1172], [40.01, 4.1794, 4.0734], [50.01, 4.1813, 4.0261], [60.01, 4.1850, 3.9764], [70.01, 4.1901, 3.9250], [80.01, 4.1968, 3.8728], [90.01, 4.2052, 3.8203], [99.974, 4.2156, 3.7683]];
export const waterAt = (t, k) => { for (let i = 1; i < WATER.length; i++) if (t <= WATER[i][0]) { const a = WATER[i - 1], b = WATER[i], u = (t - a[0]) / (b[0] - a[0]); return a[k] + (b[k] - a[k]) * u; } return WATER[WATER.length - 1][k]; };

// ---------- drawing ----------
/**
 * The thermodynamic square (Born's mnemonic) centred at (cx, cy) with half-side r in data units of an equal-aspect
 * stage. Corners V T / S P, sides F (top), G (right), H (bottom), U (left); arrows S → T and P → V.
 * o.hot: potential letter to highlight ('U' | 'H' | 'F' | 'G'); o.corners: corner letters to ring.
 */
export function thermoSquare(s, cx, cy, r, o = {}) {
  const C = { V: [cx - r, cy + r], T: [cx + r, cy + r], S: [cx - r, cy - r], P: [cx + r, cy - r] };
  const SIDE = { F: ['V', 'T'], G: ['T', 'P'], H: ['S', 'P'], U: ['V', 'S'] };
  for (const [k, [p, q]] of Object.entries(SIDE)) {
    const hot = o.hot === k;
    s.line(C[p][0], C[p][1], C[q][0], C[q][1], { color: hot ? 'accent' : 'muted', width: hot ? 3.4 : 1.6 });
    const mx = (C[p][0] + C[q][0]) / 2, my = (C[p][1] + C[q][1]) / 2;
    s.circle(mx, my, r * 0.2, { fill: hot ? 'accent' : 'panel', fillAlpha: hot ? 0.95 : 1, color: hot ? 'accent' : 'muted', width: 1.4 });
    s.tex(k, mx, my, { color: hot ? 'panel' : 'ink', size: 15, align: 'center', baseline: 'middle' });
  }
  const sh = 0.22;
  s.arrow(C.S[0] + sh * r, C.S[1] + sh * r, C.T[0] - sh * r, C.T[1] - sh * r, { color: 'faint', width: 1.4, head: 8 });
  s.arrow(C.P[0] - sh * r, C.P[1] + sh * r, C.V[0] + sh * r, C.V[1] - sh * r, { color: 'faint', width: 1.4, head: 8 });
  for (const [k, [x, y]] of Object.entries(C)) {
    const ring = o.corners && o.corners.includes(k);
    const col = (o.cornerColor && o.cornerColor[k]) || (ring ? 'orange' : 'ink');
    s.circle(x, y, r * 0.17, { fill: ring ? col : 'panel', fillAlpha: ring ? 0.25 : 1, color: ring ? col : 'faint', width: ring ? 2.2 : 1 });
    s.tex(k, x, y, { color: col, size: 15, align: 'center', baseline: 'middle' });
  }
  return C;
}

/** Bar from y = base to y = val at x (data units), half-width hw. */
export const bar = (s, x, val, hw, color, o = {}) => s.rect(x - hw, o.base ?? 0, x + hw, val, { fill: color, fillAlpha: o.alpha ?? 0.78, color, width: 1 });
