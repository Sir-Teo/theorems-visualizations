// Energy Systems — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js. Re-exports the chapter-3 helpers (which re-export chapter 2's and 1's).
//
// MODELS AND CONSTANTS (checked October 2026 unless marked otherwise)
//   Sun: IAU 2015 Resolution B3 nominal values (exact conversion constants, not measurements): effective temperature 5772 K, radius 6.957e8 m,
//     total solar irradiance 1361 W/m2 at 1 au (1.495978707e11 m). sigma*T^4*(R/d)^2 with these values gives 1361.0 W/m2, so a blackbody Sun at 5772 K
//     reproduces the nominal solar constant by construction. Kopp & Lean (2011) measured 1360.8 +/- 0.5 W/m2 at the 2008 minimum (SORCE/TIM).
//   Detailed balance (Shockley & Queisser 1961): current of a band [E1, E2) is q[A - Em (exp(qV/kT) - 1)], A = absorbed photon flux, Em = emitted photon
//     flux of a blackbody at the cell temperature. Series-connected tandems (Henry 1980, J. Appl. Phys. 51: 4494; De Vos 1980, J. Phys. D 13: 839)
//     share one current; the model here has no photon recycling between the junctions and no non-radiative loss.
//   Single-diode cell: J = Jph - J0 (exp((V + J Rs)/(n kT/q)) - 1) - (V + J Rs)/Rsh with illustrative parameters (they are NOT measurements of a real device).
export * from './ch03.shared.js';

export const KB = 8.617333262e-5, HPL = 4.135667696e-15, CLIGHT = 2.99792458e8, QE = 1.602176634e-19, SIGMA = 5.670374419e-8;
export const T_SUN = 5772, R_SUN = 6.957e8, AU = 1.495978707e11;
export const FW = (R_SUN / AU) ** 2;                 // (R/d)^2: flux dilution factor, 2.1627e-5
export const S0 = SIGMA * T_SUN ** 4 * FW;            // 1361.0 W/m2
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
  return PREF * simpson((E) => (E * E) / Math.expm1(E / kT), E1, hi, 400);
}
/** Blackbody energy flux (eV per m2 per s, hemispherical) between E1 and E2. */
export function engy(E1, E2, T) {
  const kT = KB * T, hi = Math.min(E2, E1 + 40 * kT + 0.5);
  if (!(hi > E1)) return 0;
  return PREF * simpson((E) => (E * E * E) / Math.expm1(E / kT), E1, hi, 400);
}

/** One detailed-balance junction absorbing [E1, E2) of a blackbody sun diluted by FW*conc and emitting into that band at temperature Tc from `faces` faces. */
export function junction(E1, E2, o) {
  const A = FW * o.conc * phot(E1, E2, T_SUN), Em = o.faces * phot(E1, E2, o.Tc), vt = KB * o.Tc;
  return { A, Em, vt, E1, E2, Voc: Em > 0 && A > 0 ? vt * Math.log(1 + A / Em) : 0 };
}
/** Maximum power (W/m2) of one junction run alone, and the voltage there. */
export function junctionMax(j) {
  let best = 0, bv = 0;
  for (let i = 1; i < 300; i++) { const V = (j.Voc * i) / 300, p = QE * V * (j.A - j.Em * Math.expm1(V / j.vt)); if (p > best) { best = p; bv = V; } }
  return { P: best, V: bv };
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
  let best = 0, bj = 0;
  for (let i = 1; i < 400; i++) {
    const jj = (jmax * i) / 400; let V = 0;
    for (const c of js) V += c.vt * Math.log(1 + (c.A - jj) / c.Em);
    const p = QE * jj * V; if (p > best) { best = p; bj = jj; }
  }
  const parts = js.map((c) => { const V = c.vt * Math.log(1 + (c.A - bj) / c.Em); return { P: QE * bj * V, V, A: c.A }; });
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

/** Green's (1982) empirical fill factor of an ideal diode cell from the normalised open-circuit voltage voc = Voc/(n kT/q). */
export const ffGreen = (voc) => (voc - Math.log(voc + 0.72)) / (voc + 1);
