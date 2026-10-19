// Energy Systems — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js. Re-exports the chapter-3 helpers (which re-export chapter 2's and 1's).
//
// MODELS AND CONSTANTS (checked October 2026 unless marked otherwise)
//   Sun: IAU 2015 Resolution B3 nominal values (exact conversion constants, not measurements): effective temperature 5772 K, radius 6.957e8 m,
//     total solar irradiance 1361 W/m2 at 1 au (1.495978707e11 m). sigma*T^4*(R/d)^2 with these values
//     gives 1361.16 W/m2, consistent with the separately rounded nominal irradiance. Kopp & Lean (2011) measured 1360.8 +/- 0.5 W/m2 at the 2008 minimum (SORCE/TIM).
//   Detailed balance: integrate generalized Planck emission (Markvart 2022, §6, Eqs. 12–13). In the dilute limit this reduces to the
//     Shockley–Queisser exponential approximation; retaining the Bose denominator prevents voltage above the gap at high concentration. Series-connected tandems (Henry 1980, J. Appl. Phys. 51: 4494; De Vos 1980, J. Phys. D 13: 839)
//     share one current; the model here has no photon recycling between the junctions and no non-radiative loss.
//   Single-diode cell: J = Jph - J0 (exp((V + J Rs)/(n kT/q)) - 1) - (V + J Rs)/Rsh with illustrative parameters (they are NOT measurements of a real device).
export * from './ch03.shared.js';

export const KB = 8.617333262e-5, HPL = 4.135667696e-15, CLIGHT = 2.99792458e8, QE = 1.602176634e-19, SIGMA = 5.670374419e-8;
export const T_SUN = 5772, R_SUN = 6.957e8, AU = 1.495978707e11;
export const FW = (R_SUN / AU) ** 2;                 // (R/d)^2: flux dilution factor, 2.1627e-5
export const S0 = SIGMA * T_SUN ** 4 * FW;            // 1361.16 W/m2 (nominal constants are rounded independently)
const PREF = (2 * Math.PI) / (HPL ** 3 * CLIGHT ** 2); // photons m^-2 s^-1 per eV^3

/** Simpson integral of g over [a, b] with n (even) steps. */
export function simpson(g, a, b, n = 200) {
  const h = (b - a) / n; let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
/** Blackbody photon flux (hemispherical, per m2 per s) between photon energies E1 and E2 (eV), temperature T. E2 may be Infinity. */
export function phot(E1, E2, T) {
  const kT = KB * T, hi = Math.min(E2, E1 + 40 * kT + 0.5);
  if (!(hi > E1)) return 0;
  return PREF * simpson((E) => E === 0 ? 0 : (E * E) / Math.expm1(E / kT), E1, hi, 800);
}
/** Blackbody energy flux (eV per m2 per s, hemispherical) between E1 and E2. */
export function engy(E1, E2, T) {
  const kT = KB * T, hi = Math.min(E2, E1 + 40 * kT + 0.5);
  if (!(hi > E1)) return 0;
  return PREF * simpson((E) => E === 0 ? 0 : (E * E * E) / Math.expm1(E / kT), E1, hi, 800);
}

/** Generalized Planck photon flux, with chemical potential mu (eV) below E1.
 * Integrate the geometric Bose series analytically in E; near its endpoint use
 * convergent polylog expansions to retain accuracy without thousands of terms.
 */
export function photMu(E1, E2, T, mu, derivative = false) {
  if (E2 <= E1) return 0;
  const kT = KB * T;
  const tail = (E) => {
    if (!Number.isFinite(E)) return 0;
    const x = (E - mu) / kT;
    if (!(x > 0)) return Infinity;
    const l1 = -Math.log(-Math.expm1(-x));
    let l2, l3;
    if (x < 0.5) {
      l2 = Math.PI ** 2 / 6 + x * (Math.log(x) - 1) - x ** 2 / 4 + x ** 3 / 72 - x ** 5 / 14400 + x ** 7 / 1270080 - x ** 9 / 87091200;
      l3 = 1.2020569031595943 - Math.PI ** 2 * x / 6 + x ** 2 * (0.75 - Math.log(x) / 2) + x ** 3 / 12 - x ** 4 / 288 + x ** 6 / 86400 - x ** 8 / 10160640 + x ** 10 / 870912000;
    } else {
      const y = Math.exp(-x); let ym = y; l2 = 0; l3 = 0;
      for (let m = 1; m < 90; m++) {
        const term = ym / (m * m); l2 += term; l3 += term / m;
        if (term <= 1e-16 * l2) break;
        ym *= y;
      }
    }
    if (derivative) return E * E / Math.expm1(x) + 2 * kT * E * l1 + 2 * kT * kT * l2;
    return kT * E * E * l1 + 2 * kT * kT * E * l2 + 2 * kT ** 3 * l3;
  };
  return PREF * (tail(E1) - tail(E2));
}

/** One radiative junction. Generalized Planck emission keeps V < Eg/q even at
 * full concentration; its dilute (Eg-V >> kT) limit is the SQ exponential law.
 */
export function junction(E1, E2, o) {
  const A = (o.fw ?? FW) * o.conc * phot(E1, E2, o.Ts ?? T_SUN), Em = o.faces * photMu(E1, E2, o.Tc, 0), vt = KB * o.Tc;
  const current = (V) => A - (o.faces * photMu(E1, E2, o.Tc, V) - Em);
  const voltage = (j) => {
    if (!(A > 0)) return 0; // coincident gap handles leave an empty spectral slice
    let lo = 0, hi = E1 * (1 - Number.EPSILON);
    let V = Math.min(hi, vt * Math.log1p(Math.max(0, A - j) / Em));
    for (let i = 0; i < 48; i++) {
      const f = current(V) - j;
      if (Math.abs(f) < 1e-12 * A) return V;
      if (f > 0) lo = V; else hi = V;
      const next = V + f / (o.faces * photMu(E1, E2, o.Tc, V, true));
      V = next > lo && next < hi ? next : (lo + hi) / 2;
    }
    return (lo + hi) / 2;
  };
  return { A, Em, vt, E1, E2, current, voltage, Voc: A > 0 ? voltage(0) : 0 };
}
/** Maximum power (W/m2) of one junction run alone, and the voltage there. */
export function junctionMax(j) {
  let lo = 0, hi = j.Voc;
  for (let i = 0; i < 48; i++) {
    const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3;
    if (a * j.current(a) > b * j.current(b)) hi = b; else lo = a;
  }
  const V = (lo + hi) / 2;
  return { P: QE * V * j.current(V), V };
}
/** Input power (W/m2) at concentration conc. */
export const pin = (conc) => S0 * conc;
/**
 * Efficiency of a stack of junctions with band gaps gaps[0] > gaps[1] > ... (top cell first).
 * mode 'series': one shared current (2-terminal), 'indep': each junction at its own maximum power point (4-terminal).
 * Returns {eta, parts: [{P, V, A}], j}.
 */
export function stack(gaps, o, mode = 'series') {
  const g = [...gaps].sort((a, b) => b - a), js = g.map((E, i) => junction(E, i === 0 ? Infinity : g[i - 1], o));
  const P0 = pin(o.conc);
  if (mode === 'indep') {
    const parts = js.map((j) => junctionMax(j));
    return { eta: parts.reduce((s, p) => s + p.P, 0) / P0, parts: parts.map((p, i) => ({ ...p, A: js[i].A })), js };
  }
  const jmax = Math.min(...js.map((j) => j.A));
  const power = (jj) => QE * jj * js.reduce((s, c) => s + c.voltage(jj), 0);
  let lo = 0, hi = jmax;
  for (let i = 0; i < 40; i++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (power(a) > power(b)) hi = b; else lo = a; }
  const bj = (lo + hi) / 2, best = power(bj);
  const parts = js.map((c) => { const V = c.voltage(bj); return { P: QE * bj * V, V, A: c.A }; });
  return { eta: best / P0, parts, j: bj, js };
}

// ───────────────────────────────────────────────────────────── single-diode cell model (current density in mA/cm2)
/**
 * Build a cell. o: {suns, T (K), j0ref (A/cm2 at 25 C), n, rs (ohm cm2), rsh (ohm cm2, Infinity ok), jsc1 (mA/cm2 at 1 sun), alpha (1/K), eg (eV)}.
 * Returns {jph, j0 (mA/cm2), a = n kT/q, rs, rsh, J(V), voc, pmax(), T, suns}.
 */
export function cell(o) {
  const T = o.T ?? 298.15, Tr = 298.15, eg = o.eg ?? 1.12, n = o.n ?? 1, alpha = o.alpha ?? 0.0005;
  const j0 = (o.j0ref ?? 1e-12) * 1000 * (T / Tr) ** 3 * Math.exp((-eg / (n * KB)) * (1 / T - 1 / Tr)); // mA/cm2
  const jph = (o.suns ?? 1) * (o.jsc1 ?? 40) * (1 + alpha * (T - Tr));
  const a = n * KB * T, rs = o.rs ?? 0, rsh = o.rsh ?? Infinity;
  const ex = (x) => Math.exp(Math.min(x, 80));
  const J = (V) => {
    if (rs === 0 && rsh === Infinity) return jph - j0 * (ex(V / a) - 1);
    let lo = -1e9, hi = jph + 5 + (V < 0 && rsh !== Infinity ? (-1000 * V) / rsh : 0);
    for (let i = 0; i < 90; i++) {
      const m = 0.5 * (lo + hi), Vd = V + (m * rs) / 1000;
      const f = jph - j0 * (ex(Vd / a) - 1) - (rsh === Infinity ? 0 : (1000 * Vd) / rsh) - m;
      if (f > 0) lo = m; else hi = m;
    }
    return 0.5 * (lo + hi);
  };
  let vocv = null, pm = null;
  const voc = () => { if (vocv == null) { let lo = 0, hi = 2; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (J(m) > 0) lo = m; else hi = m; } vocv = 0.5 * (lo + hi); } return vocv; };
  const pmax = () => {
    if (pm) return pm;
    const vo = voc(), phi = 0.6180339887; let lo = 0, hi = vo, c = hi - phi * (hi - lo), d = lo + phi * (hi - lo);
    const P = (V) => V * J(V);
    for (let i = 0; i < 50; i++) { if (P(c) > P(d)) hi = d; else lo = c; c = hi - phi * (hi - lo); d = lo + phi * (hi - lo); }
    const V = 0.5 * (lo + hi); return (pm = { V, J: J(V), P: P(V) });
  };
  return { jph, j0, a, rs, rsh, T, suns: o.suns ?? 1, J, voc, pmax, jsc: () => J(0) };
}

/** Sample the I-V curve of a cell on V in [vmin, vmax]: [[V, J]...]. */
export function ivCurve(c, vmin, vmax, n = 140) { const out = []; for (let i = 0; i <= n; i++) { const V = vmin + ((vmax - vmin) * i) / n; out.push([V, c.J(V)]); } return out; }

/** Green's (1981) empirical ideal-diode fill factor, reproduced in PVEducation, Fill Factor; intended for normalized voc > 10. */
export const ffGreen = (voc) => (voc - Math.log(voc + 0.72)) / (voc + 1);
