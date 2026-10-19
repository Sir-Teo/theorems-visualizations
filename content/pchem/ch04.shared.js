// Physical Chemistry — Chapter 4: shared helpers. Re-exports chapter 3's shared file (which re-exports chapter 2's).
export * from './ch03.shared.js';
import { R, RL, cubicRoots } from './ch03.shared.js';

export const ATM = 1.01325;      // bar

/** Two pure substances for the phase-diagram items.  Anchors (T in K, p in bar):
 *  water  triple 273.16 K / 611.657 Pa, critical 647.096 K / 22.064 MPa, normal boiling 373.124 K (ITS-90);
 *  CO2    triple 216.58 K / 5.185 bar, critical 304.13 K / 73.77 bar, sublimation at 1 atm 194.69 K, vapour pressure ~34.85 bar at 273.15 K.
 *  The curves are reconstructions through these anchors (see each item's scope), not tabulated data. */
function vapourFit(Tt, pt, Tc, pc, T3, p3) {
  const x = (T) => 1 - Tc / T, y = (p) => Math.log(p / pc);
  const x1 = x(Tt), y1 = y(pt), x2 = x(T3), y2 = y(p3);
  const det = x1 * x2 * x2 - x2 * x1 * x1;
  const A = (y1 * x2 * x2 - y2 * x1 * x1) / det, B = (x1 * y2 - x2 * y1) / det;
  return (T) => pc * Math.exp(A * x(T) + B * x(T) ** 2);
}
function make(o) {
  const pv = vapourFit(o.Tt, o.pt, o.Tc, o.pc, o.T3, o.p3);
  const dHsub = o.dHsub ?? (R * Math.log(o.pt / ATM) / (1 / o.Tsub - 1 / o.Tt));   // J/mol
  const ps = (T) => o.pt * Math.exp(-dHsub / R * (1 / T - 1 / o.Tt));
  const Tm = (p) => o.Tt + (p - o.pt) / o.slope + (o.curv || 0) * (p - o.pt) ** 2;     // melting temperature at pressure p (bar)
  return { ...o, dHsub, pv, ps, Tm };
}
export const SUBST = {
  water: make({ key: 'water', name: 'water', Tt: 273.16, pt: 0.00611657, Tc: 647.096, pc: 220.64, T3: 373.124, p3: ATM, dHsub: 51.06e3, slope: -135, curv: (251.165 - 273.16 + (2085.66 - .00611657) / 135) / (2085.66 - .00611657) ** 2, pmaxMelt: 2085.66, T: [200, 700], p: [1e-4, 1e4] }),
  co2: make({ key: 'co2', name: 'CO₂', Tt: 216.58, pt: 5.185, Tc: 304.13, pc: 73.77, T3: 273.15, p3: 34.85, Tsub: 194.69, slope: 45.7, pmaxMelt: 4000, T: [150, 400], p: [0.01, 4000] }),
};

/** Phase of a state (T, p in bar): 'solid' | 'liquid' | 'gas' | 'sc' (supercritical fluid). */
export function phaseOf(S, T, p) {
  if (p < S.pt) return p > S.ps(T) ? 'solid' : 'gas';
  if (p > S.pmaxMelt && T < S.Tc) return 'unmodelled';
  if (T < S.Tm(p)) return 'solid';
  if (T >= S.Tc) return p > S.pc ? 'sc' : 'gas';
  if (p >= S.pc) return 'liquid';
  return p > S.pv(T) ? 'liquid' : 'gas';
}

/** Antoine fit for water, 255.9–373 K (Stull 1947, as listed by the NIST Chemistry WebBook): log10 p(bar) = A − B/(T + C). */
export const antoineW = (T) => Math.pow(10, 4.6543 - 1435.264 / (T - 64.848));
/** ISA standard-atmosphere pressure (bar) at altitude h (m), troposphere. */
export const pAlt = (h) => ATM * Math.pow(1 - 2.25577e-5 * h, 5.25588);
/** IAPWS R1-76 surface tension of water (N/m), T in K. */
export const gammaWater = (T) => { const t = 1 - T / 647.096; return 0.2358 * Math.pow(t, 1.256) * (1 - 0.625 * t); };

/** Schematic Kelvin coarsening: Euler steps in r³ conserve liquid volume.
 * Limit each step to the first disappearing drop; the rate has arbitrary units. */
export function ripeningStep(radii, a, dt) {
  const volume = radii.map(r => r ** 3), total = volume.reduce((s, x) => s + x, 0);
  let left = dt;
  for (let iter = 0; left > 1e-14 && iter <= radii.length; iter++) {
    const r = volume.map(Math.cbrt), live = r.map((x, i) => x > 0 ? i : -1).filter(i => i >= 0);
    if (live.length <= 1) break;
    // A remnant below roundoff in the plotted nanometre volumes has no resolved size.
    for (const i of live) if (r[i] < 1e-6) volume[i] = 0;
    const active = live.filter(i => volume[i] > 0);
    if (active.length !== live.length) { const j = volume.indexOf(Math.max(...volume)); volume[j] += total - volume.reduce((s, x) => s + x, 0); continue; }
    const e = r.map(x => x > 0 ? Math.exp(a / x) : 0);
    const saturation = active.reduce((s, i) => s + r[i] * e[i], 0) / active.reduce((s, i) => s + r[i], 0);
    const dv = r.map((x, i) => 450 * x * (saturation - e[i]));
    let h = left, hit = -1;
    for (const i of active) if (dv[i] < 0 && -volume[i] / dv[i] <= h) { h = -volume[i] / dv[i]; hit = i; }
    for (const i of active) volume[i] = Math.max(0, volume[i] + h * dv[i]);
    if (hit >= 0) volume[hit] = 0;
    const j = volume.indexOf(Math.max(...volume)); volume[j] += total - volume.reduce((s, x) => s + x, 0);
    left -= h;
  }
  const r = volume.map(Math.cbrt), live = r.filter(x => x > 0);
  const saturation = live.length ? live.reduce((s, x) => s + x * Math.exp(a / x), 0) / live.reduce((s, x) => s + x, 0) : 1;
  return { r, S: saturation };
}

// ---- reduced van der Waals fluid ---------------------------------------------------------------------------
/** Reduced volumes (ascending) at reduced T, p. */
export const vdwRoots = (Tr, pr) => cubicRoots(3 * pr, -(pr + 8 * Tr), 9, -3).filter((v) => v > 1 / 3);
/** Reduced saturation pressure by Maxwell's equal-area rule (Tr < 1). */
export function vdwPsat(Tr) {
  if (Tr >= 1) return 1;
  const q = (v) => 8 * Tr / (3 * v - 1) - 3 / (v * v);
  let v = 0.34, vmin = 0, vmax = 0;
  while (q(v + 0.0005) < q(v)) v += 0.0005;     // down the liquid branch to the liquid spinodal
  vmin = v;
  while (q(v + 0.0005) > q(v)) v += 0.0005;     // up to the vapour spinodal
  vmax = v;
  let lo = Math.max(1e-6, q(vmin)), hi = q(vmax);
  const area = (p) => { const r = vdwRoots(Tr, p); if (r.length < 3) return NaN; const vl = r[0], vg = r[2]; return 8 * Tr / 3 * Math.log((3 * vg - 1) / (3 * vl - 1)) + 3 * (1 / vg - 1 / vl) - p * (vg - vl); };
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, a = area(m); if (!(a === a)) { hi = m; continue; } if (a > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Stable reduced density 1/v at (Tr, pr), plus whether the state is on the liquid side. */
export function vdwDensity(Tr, pr) {
  const r = vdwRoots(Tr, pr);
  if (r.length === 1) return 1 / r[0];
  return 1 / (pr > vdwPsat(Tr) ? r[0] : r[2]);
}

