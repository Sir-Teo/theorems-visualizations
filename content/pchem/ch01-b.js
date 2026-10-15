// Physical Chemistry — Chapter 1 (part b): real gases — compression factor, virial expansion, van der Waals,
// the critical point and corresponding states.

// ---------- gas data ----------
// Critical constants (K, bar, cm³/mol), acentric factor ω, van der Waals a (bar·L²/mol²) and b (L/mol) (CRC Handbook),
// Lennard-Jones σ (Å) and ε/k (K) fitted to second virial coefficients, measured Boyle temperatures (K).
const R = 0.0831446;   // L·bar/(mol·K)
const GAS = {
  He: { name: 'He', tex: '\\mathrm{He}', col: 'teal', Tc: 5.19, pc: 2.27, Vc: 57.4, w: -0.39, a: 0.0346, b: 0.0238, sig: 2.556, eps: 10.22, TB: 22.6 },
  H2: { name: 'H₂', tex: '\\mathrm{H_2}', col: 'pink', Tc: 33.19, pc: 13.13, Vc: 64.1, w: -0.216, a: 0.2452, b: 0.02651, sig: 2.928, eps: 37.0, TB: 110 },
  N2: { name: 'N₂', tex: '\\mathrm{N_2}', col: 'blue', Tc: 126.2, pc: 33.98, Vc: 90.1, w: 0.0377, a: 1.370, b: 0.0387, sig: 3.698, eps: 95.05, TB: 327.2 },
  Ar: { name: 'Ar', tex: '\\mathrm{Ar}', col: 'green', Tc: 150.86, pc: 48.98, Vc: 74.6, w: -0.002, a: 1.355, b: 0.03201, sig: 3.405, eps: 119.8, TB: 411.5 },
  CH4: { name: 'CH₄', tex: '\\mathrm{CH_4}', col: 'orange', Tc: 190.56, pc: 45.99, Vc: 98.6, w: 0.011, a: 2.303, b: 0.04310, sig: 3.817, eps: 148.2, TB: 510 },
  Xe: { name: 'Xe', tex: '\\mathrm{Xe}', col: 'purple', Tc: 289.73, pc: 58.42, Vc: 118.0, w: 0.008, a: 4.250, b: 0.05105, sig: 4.055, eps: 229, TB: 768 },
  CO2: { name: 'CO₂', tex: '\\mathrm{CO_2}', col: 'red', Tc: 304.13, pc: 73.77, Vc: 94.0, w: 0.225, a: 3.658, b: 0.04286, sig: 4.486, eps: 189, TB: 714.8 },
  NH3: { name: 'NH₃', tex: '\\mathrm{NH_3}', col: 'gold', Tc: 405.4, pc: 113.53, Vc: 72.5, w: 0.257, a: 4.225, b: 0.0371 },
  H2O: { name: 'H₂O', tex: '\\mathrm{H_2O}', col: 'gray', Tc: 647.1, pc: 220.64, Vc: 55.9, w: 0.344, a: 5.537, b: 0.03049 },
};
// Second virial coefficients B (cm³/mol) at 100, 273, 373 and 600 K (Atkins, Table 1C.3)
const BDATA = { Ar: [[100, -187.0], [273, -21.7], [373, -4.2], [600, 11.9]], CO2: [[273, -149.7], [373, -72.2], [600, -12.4]], N2: [[100, -160.0], [273, -10.5], [373, 6.2], [600, 21.7]], Xe: [[273, -153.7], [373, -81.7], [600, -19.6]], He: [[100, 11.4], [273, 12.0], [373, 11.3], [600, 10.4]] };
// Nitrogen at 0 °C: compression factor measured by Amagat (pressures in atm)
const N2_AMAGAT = [[100, 0.9846], [200, 1.0365], [400, 1.2557], [600, 1.5317], [800, 1.8115], [1000, 2.07]];

// ---------- cubic equations of state ----------
/** Real roots of x³ + a2 x² + a1 x + a0, ascending. */
function cubicRoots(a2, a1, a0) {
  const q = (3 * a1 - a2 * a2) / 9, r = (9 * a2 * a1 - 27 * a0 - 2 * a2 * a2 * a2) / 54, D = q * q * q + r * r;
  if (D > 0) { const s = Math.cbrt(r + Math.sqrt(D)), t = Math.cbrt(r - Math.sqrt(D)); return [s + t - a2 / 3]; }
  const th = Math.acos(Math.max(-1, Math.min(1, r / Math.sqrt(-q * q * q)))), m = 2 * Math.sqrt(-q);
  return [0, 1, 2].map((k) => m * Math.cos((th + 2 * Math.PI * k) / 3) - a2 / 3).sort((x, y) => x - y);
}
/** p = RT/(V − b) − a/(V² + u·bV + w·b²): van der Waals (u = w = 0) or Peng–Robinson (u = 2, w = −1, a = a(T)). */
function eos(g, T, model) {
  if (model === 'vdw') return { a: g.a, b: g.b, u: 0, w: 0 };
  const k = 0.37464 + 1.54226 * g.w - 0.26992 * g.w * g.w, al = (1 + k * (1 - Math.sqrt(T / g.Tc))) ** 2;
  return { a: 0.45724 * R * R * g.Tc * g.Tc / g.pc * al, b: 0.07780 * R * g.Tc / g.pc, u: 2, w: -1 };
}
const pOf = (E, T, V) => R * T / (V - E.b) - E.a / (V * V + E.u * E.b * V + E.w * E.b * E.b);
/** ln of the fugacity coefficient for root Z (decides which root is the stable phase). */
function lnPhi(Z, A, B, u, w) {
  if (u === 0) return Z - 1 - Math.log(Z - B) - A / Z;
  const s = Math.sqrt(u * u - 4 * w);
  return Z - 1 - Math.log(Z - B) - A / (B * s) * Math.log((2 * Z + B * (u + s)) / (2 * Z + B * (u - s)));
}
/** Stable compression factor at (T, p): the root of the cubic with the lowest Gibbs energy. Returns {Z, V, E, liquid}. */
function zStable(g, T, p, model) {
  const E = eos(g, T, model), A = E.a * p / (R * R * T * T), B = E.b * p / (R * T), u = E.u, w = E.w;
  const zs = cubicRoots(-(1 + B - u * B), A + w * B * B - u * B - u * B * B, -(A * B + w * B * B + w * B * B * B)).filter((z) => z > B);
  let Z = zs[zs.length - 1];
  if (zs.length > 1 && lnPhi(zs[0], A, B, u, w) < lnPhi(Z, A, B, u, w)) Z = zs[0];
  const V = Z * R * T / p, Vc = model === 'vdw' ? 3 * g.b : 0.3074 * R * g.Tc / g.pc;
  return { Z, V, E, liquid: T < g.Tc && V < Vc };
}
/** Measured vapour pressure of CO₂ (bar) below its critical point (Span & Wagner, 1996, ancillary equation). */
function co2Psat(T) {
  const Tc = 304.1282, t = 1 - T / Tc; if (t <= 0) return null;
  return 73.773 * Math.exp((Tc / T) * (-7.0602087 * t + 1.9391218 * t ** 1.5 - 1.6463597 * t * t - 3.2995634 * t ** 4));
}
// ---------- the van der Waals equation in reduced variables ----------
const pVdw = (Tr, Vr) => 8 * Tr / (3 * Vr - 1) - 3 / (Vr * Vr);
/** Maxwell's equal-area construction for the reduced van der Waals isotherm Tr < 1: coexistence pressure and volumes. */
function maxwell(Tr) {
  if (Tr >= 1) return null;
  const roots = (p) => cubicRoots(-(p + 8 * Tr) / (3 * p), 3 / p, -1 / p).filter((x) => x > 1 / 3);
  const area = (p) => { const r = roots(p); if (r.length < 3) return null; const l = r[0], g = r[r.length - 1]; return { a: (8 * Tr / 3) * Math.log((3 * g - 1) / (3 * l - 1)) + 3 / g - 3 / l - p * (g - l), l, g }; };
  // spinodal pressures bound the search
  let lo = 1e-9, hi = 1;
  const sp = []; for (let V = 0.34; V < 40; V *= 1.002) { const T = (3 * V - 1) ** 2 / (4 * V ** 3); if (Math.abs(T - Tr) < 0.004 * Tr) sp.push((3 * V - 2) / V ** 3); }
  if (sp.length) { lo = Math.max(1e-9, Math.min(...sp)); hi = Math.max(...sp); }
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2, A = area(m); if (!A) { if (m < 0.5) lo = m; else hi = m; continue; } if (A.a > 0) lo = m; else hi = m; }
  const A = area((lo + hi) / 2);
  return A ? { p: (lo + hi) / 2, Vl: A.l, Vg: A.g } : null;
}
/** Spinodal of the reduced van der Waals fluid (dp/dV = 0), parametrised by volume. */
const spinodal = (Vr) => [(3 * Vr - 1) ** 2 / (4 * Vr ** 3), (3 * Vr - 2) / Vr ** 3];
// ---------- Lennard-Jones second virial coefficient ----------
/** B₂(T*) in units of σ³ per molecule: −2π ∫ (e^{−u/kT} − 1) r² dr for u = 4ε[(σ/r)¹² − (σ/r)⁶] (Simpson, plus core and tail). */
function B2LJ(Ts) {
  const f = (r) => { const i6 = 1 / (r * r * r * r * r * r), u = 4 * (i6 * i6 - i6); return (Math.exp(-u / Ts) - 1) * r * r; };
  const a = 0.5, b = 12, n = 1600, h = (b - a) / n;
  let s = f(a) + f(b);
  for (let k = 1; k < n; k++) s += (k % 2 ? 4 : 2) * f(a + k * h);
  const I = -(a ** 3) / 3 + s * h / 3 + 4 / (3 * Ts * b ** 3);
  return -2 * Math.PI * I;
}
const B2cm3 = (g, T) => B2LJ(T / g.eps) * g.sig ** 3 * 0.602214076;   // cm³/mol
/** Boyle temperature of the Lennard-Jones gas, T*_B ≈ 3.418 (bisection on B₂ = 0). */
function boyleTs() { let lo = 2, hi = 6; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (B2LJ(m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }

export default {
  collection: 'pchem',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Definition', name: 'Compression factor Z',
      statement: String.raw`The **compression factor** (or compressibility factor) of a gas is the ratio of its molar volume to that of a perfect gas at the same pressure and temperature:
$$Z = \frac{V_m}{V_m^{\circ}} = \frac{pV_m}{RT}.$$
For a perfect gas $Z = 1$ in every state. For real gases $Z \to 1$ as $p \to 0$; $Z < 1$ means the gas is more compressible than a perfect gas (attractions dominate), $Z > 1$ that it is harder to compress (repulsions — the molecules' own volume — dominate). At high pressure $Z > 1$ for every gas; at moderate pressure and low temperature $Z < 1$ for all but the lightest gases, and below its critical temperature a gas condenses, where $Z$ drops abruptly to the small value of a liquid.`,
      idea: String.raw`$Z$ measures, at a glance, how far a real gas is from the perfect-gas law (1.4). A molecular picture explains its shape: at intermediate distances molecules attract one another, which pulls them together and lowers the pressure they exert for a given volume ($Z < 1$); at short distances they repel, so in a dense gas part of the volume is unavailable and the pressure is higher ($Z > 1$). Which effect wins depends on how dense the gas is and how hot it is relative to the depth of the attractive well — which is why helium and hydrogen at room temperature show $Z > 1$ from the start while carbon dioxide dips far below 1 and liquefies.`,
      caption: String.raw`$Z$ against pressure for five gases, computed from an equation of state: the van der Waals equation with each gas's measured $a$ and $b$, or the more accurate Peng–Robinson equation. At 0 °C the open circles are measured values for nitrogen. Drag the probe along the pressure axis; the bars on the right split each gas's departure from 1 into a repulsive part (molecular volume, up) and an attractive part (down). Change the temperature: cool carbon dioxide below 304 K and its curve breaks where it liquefies; heat everything and the dips flatten out.`,
      deps: ['pchem-1.4'],
      refs: ['Atkins 1C', 'M–S ch. 16'],
      tags: ['real gases', 'equation of state'],
      credit: 'Andrews, 1869; Amagat, 1893 (measurements)',
      viz(v) {
        const NAMES = ['He', 'H2', 'N2', 'CH4', 'CO2'], PMAX = 1000;
        const Tsl = v.slider('temperature', 200, 800, 273, { step: 1, fmt: (x) => `${x.toFixed(0)} K (${Math.round(x - 273.15) || 0} °C)` });
        const model = v.select('equation of state', [{ value: 'vdw', label: 'van der Waals ($a$, $b$)' }, { value: 'pr', label: 'Peng–Robinson' }], 'vdw');
        const s = v.stage({ x: [0, PMAX], y: [0, 2.6], height: 380, axes: 'box', weight: 1.55, xlabel: 'p (bar)', title: 'compression factor $Z = pV_m/RT$' });
        const sb = v.stage({ x: [0, 5], y: [-1.38, 1.68], height: 380, axes: false, weight: 0.8, minWidth: 220 });
        const probe = s.handle(150, 2.3, { color: 'ink', r: 7, constrain: (x) => [Math.max(5, Math.min(PMAX, x)), 2.3] });
        let rows = null;
        v.render(() => {
          const T = Tsl.value, M = model.value;
          s.rect(0, 1, PMAX, 2.6, { fill: 'red', fillAlpha: 0.04, stroke: false });
          s.rect(0, 0, PMAX, 1, { fill: 'blue', fillAlpha: 0.04, stroke: false });
          s.text('Z > 1: repulsions win, harder to compress', 75, 2.48, { size: 11, color: 'red', align: 'left', alpha: 0.85 });
          s.text('Z < 1: attractions win, easier to compress', PMAX * 0.985, 0.32, { size: 11, color: 'blue', align: 'right', alpha: 0.85 });
          s.hline(1, { color: 'ink', width: 1.5, dash: [6, 4] });
          s.text('perfect gas, Z = 1', PMAX * 0.985, 1, { size: 11, color: 'ink', dy: -9, align: 'right' });
          const labels = [];
          for (const nm of NAMES) {
            const g = GAS[nm], pts = []; let prev = null, jump = null;
            for (let k = 1; k <= 400; k++) {
              const p = PMAX * k / 400, r = zStable(g, T, p, M);
              if (prev && Math.abs(prev.Z - r.Z) > 0.12) { pts.push(null); jump = [PMAX * (k - 1) / 400, prev.Z, r.Z]; }
              pts.push([p, r.Z]); prev = r;
            }
            s.path(pts, { color: g.col, width: 2.4 });
            if (jump) {
              s.line(jump[0], jump[1], jump[0], jump[2], { color: g.col, width: 1.6, dash: [4, 3] });
              const real = nm === 'CO2' ? co2Psat(T) : null;
              s.text(`liquefies at ${jump[0].toFixed(0)} bar` + (real ? ` (real CO₂: ${real.toFixed(1)} bar)` : ''), jump[0], (jump[1] + jump[2]) / 2, { size: 10.5, color: g.col, dx: 6, align: 'left' });
            }
            labels.push([g, Math.min(2.5, zStable(g, T, PMAX, M).Z)]);
          }
          labels.sort((a2, b2) => b2[1] - a2[1]);
          for (let k = 1; k < labels.length; k++) labels[k][1] = Math.min(labels[k][1], labels[k - 1][1] - 0.1);
          labels.forEach(([g, y]) => s.text(g.name, PMAX, y, { size: 12, color: g.col, weight: 600, dx: -4, dy: -9, align: 'right' }));
          if (Math.abs(T - 273.15) < 2) N2_AMAGAT.forEach(([pa, z]) => s.dot(pa * 1.01325, z, { r: 5, hollow: true, color: 'blue' }));
          s.vline(probe.x, { color: 'ink', width: 1, alpha: 0.6 });
          // decomposition at the probe pressure: Z = V/(V − b) − attraction term
          rows = NAMES.map((nm) => { const g = GAS[nm], r = zStable(g, T, probe.x, M), E = r.E, V = r.V, rep = V / (V - E.b) - 1, att = E.a * V / (R * T * (V * V + E.u * E.b * V + E.w * E.b * E.b)); return { g, Z: r.Z, rep, att, liquid: r.liquid }; });
          sb.line(0.2, 0, 4.9, 0, { color: 'ink', width: 1.2 });
          sb.text('Z − 1', 0.05, 1.6, { size: 11, color: 'muted', align: 'left' });
          rows.forEach((q, k) => {
            const x = 0.55 + k * 0.92;
            const up = Math.min(1.5, q.rep), dn = Math.min(1.1, q.att);
            sb.rect(x - 0.3, 0, x - 0.02, up, { fill: 'red', fillAlpha: 0.55, stroke: false });
            sb.rect(x + 0.02, 0, x + 0.3, -dn, { fill: 'blue', fillAlpha: 0.55, stroke: false });
            if (q.rep > 1.5) sb.text('▲', x - 0.16, 1.5, { size: 10, color: 'red', align: 'center', dy: -7 });
            if (q.att > 1.1) sb.text('▼', x + 0.16, -1.1, { size: 10, color: 'blue', align: 'center', dy: 7 });
            sb.line(x - 0.36, Math.max(-1.1, Math.min(1.5, q.Z - 1)), x + 0.36, Math.max(-1.1, Math.min(1.5, q.Z - 1)), { color: q.g.col, width: 4 });
            sb.text(q.g.name, x, -1.28, { size: 11.5, color: q.g.col, align: 'center', weight: 600 });
          });
          sb.text(`at ${probe.x.toFixed(0)} bar`, 4.95, 1.6, { size: 11, color: 'ink', align: 'right' });
        });
        v.legend([['red', 'repulsive part $V/(V-b) - 1$', { area: true }], ['blue', 'attractive part', { area: true }], ['ink', 'bar: net $Z - 1$'], ['blue', 'N₂ measured at 0 °C (Amagat)', { dot: true }]]);
        v.readout(() => {
          if (!rows) return '';
          const T = Tsl.value, list = rows.map((q) => `${q.g.name} ${v.fix(q.Z, 3)}${q.liquid ? ' (liquid)' : ''}`).join(', ');
          const nz = zStable(GAS.N2, 273.15, 101.325, model.value).Z;
          return `At ${v.fix(probe.x, 0)} bar and ${v.fix(T, 0)} K: $Z$ = ${list}. ` + (Math.abs(T - 273.15) < 2 ? `Check against data: N₂ at 0 °C and 100 atm, measured $Z = 0.985$, this equation $${v.fix(nz, 3)}$.` : `A perfect gas would have $Z = 1$ throughout.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12', kind: 'Model', name: 'Virial equation and the Boyle temperature',
      statement: String.raw`The **virial equation of state** expands the compression factor in powers of the molar density (or of the pressure):
$$Z = \frac{pV_m}{RT} = 1 + \frac{B(T)}{V_m} + \frac{C(T)}{V_m^2} + \cdots = 1 + B'(T)\,p + C'(T)\,p^2 + \cdots, \qquad B' = \frac{B}{RT}.$$
The **virial coefficients** $B, C, \dots$ depend on temperature and on the gas, and statistical mechanics ties each to the intermolecular potential $u(r)$; the second one is
$$B(T) = -2\pi N_A\int_0^\infty \big(e^{-u(r)/k_BT} - 1\big)\,r^2\,dr .$$
$B$ is negative at low temperature and positive at high temperature. At the **Boyle temperature** $T_B$, where $B(T_B) = 0$, the initial slope $dZ/dp$ vanishes and the gas obeys $pV = nRT$ closely over a range of pressures. For a Lennard-Jones gas $T_B = 3.42\,\varepsilon/k_B$.`,
      idea: String.raw`The expansion is a Taylor series of $Z$ about the perfect-gas limit $1/V_m = 0$; its first correction counts pairs of molecules close enough to interact. The integrand $e^{-u/kT} - 1$ (Mayer's function) is $-1$ inside the repulsive core, which excludes volume and makes $B$ positive, and positive in the attractive well, where molecules linger, which makes $B$ negative. At low temperature the well wins; at high temperature molecules cross it too fast to care and the core wins. The balance point is the Boyle temperature, where the gas's $Z$–$p$ curve leaves 1 horizontally (1.11).`,
      caption: String.raw`Left: the Lennard-Jones potential of the chosen gas and the integrand $(e^{-u/kT} - 1)\,r^2$ of $B$ — the red area (repulsive core) pushes $B$ up, the blue area (attractive well) pulls it down. Middle: $B(T)$ computed by integrating, against measured values (circles); it crosses zero at the computed Boyle temperature (green) close to the measured one (tick). Right: $Z = 1 + Bp/RT$ at three temperatures — at $T_B$ the line is flat. Slide the temperature through $T_B$ and watch the blue area shrink below the red one. Helium and hydrogen miss: quantum effects.`,
      deps: ['pchem-1.11'],
      refs: ['Atkins 1C', 'M–S ch. 16', 'Atkins Table 1C.3 (B data)'],
      tags: ['real gases', 'virial expansion'],
      credit: 'Kamerlingh Onnes, 1901',
      scope: String.raw`The series converges at low and moderate densities; truncated after $B$ it is good to about 1% while $|B|/V_m \lesssim 0.05$ (tens of bar for permanent gases at room temperature). It does not describe condensation, where the expansion diverges.`,
      viz(v) {
        const NAMES = ['N2', 'Ar', 'CH4', 'Xe', 'CO2', 'He'], TBs = boyleTs();
        const gs = v.select('gas', NAMES.map((n) => ({ value: n, label: `$${GAS[n].tex}$` })), 'N2');
        const Tsl = v.slider('temperature', 30, 1500, 300, { log: true, step: 0.001, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [0.6, 3], y: [-1.5, 3], height: 330, axes: 'box', xlabel: 'r/σ', title: 'integrand of $B$: $(e^{-u/kT}-1)\\,r^2$ (solid), $u/kT$ (dashed)' });
        const s2 = v.stage({ x: [30, 3000], xlog: true, y: [-200, 60], height: 330, axes: 'box', title: '$B(T)$ in cm³/mol against $T$ (K)' });
        const s3 = v.stage({ x: [0, 100], y: [0.8, 1.1], height: 330, axes: 'box', xlabel: 'p (bar)', title: '$Z \\approx 1 + Bp/RT$' });
        let st = null;
        v.render(() => {
          const g = GAS[gs.value], T = Tsl.value, Ts = T / g.eps;
          const u = (r) => 4 * (r ** -12 - r ** -6) / Ts, f = (r) => (Math.exp(-u(r)) - 1) * r * r;
          // areas of the integrand: core (f < 0) and well (f > 0), in units of σ³
          let core = 0, well = 0; const n = 4000, h = (12 - 0.6) / n;
          for (let k = 0; k < n; k++) { const val = f(0.6 + (k + 0.5) * h) * h; if (val < 0) core += val; else well += val; }
          core += -(0.6 ** 3) / 3; well += 4 / (3 * Ts * 12 ** 3);
          const B = B2cm3(g, T), TB = TBs * g.eps;
          st = { g, T, B, TB, core, well };
          // left: potential and Mayer integrand
          const ymin = -1.5, ymax = 3;
          s1.setView([0.6, 3], [ymin, ymax]);
          s1.hline(0, { color: 'ink', width: 1 });
          s1.clip(() => {
            s1.fn((r) => Math.min(0, f(r)), { color: 'red', width: 0, fill: 'red', fillAlpha: 0.35, domain: [0.6, 3] });
            s1.fn((r) => Math.max(0, f(r)), { color: 'blue', width: 0, fill: 'blue', fillAlpha: 0.35, domain: [0.6, 3] });
            s1.fn(f, { color: 'ink', width: 2 });
            s1.fn(u, { color: 'muted', width: 1.6, dash: [5, 4], domain: [0.9, 3] });
          });
          s1.text('u/kT', 2.5, u(2.5), { size: 11, color: 'muted', dy: -10 });
          s1.text('core: B > 0', 0.64, -1.05, { size: 11, color: 'red', align: 'left' });
          s1.text('well: B < 0', 1.35, Math.min(2.7, 0.5 + Math.max(0, f(1.2))), { size: 11, color: 'blue', align: 'left' });
          // middle: B(T)
          const Bmin = Math.min(-200, B2cm3(g, 30 * Math.max(1, g.eps / 40)) * 0), lo = Math.max(-400, Math.min(-150, B2cm3(g, Math.max(30, 0.8 * g.eps)) * 1.1)), hi = Math.max(40, B2cm3(g, 3000) * 1.4);
          s2.setView([30, 3000], [lo, hi]);
          s2.hline(0, { color: 'ink', width: 1 });
          s2.fn((TT) => B2cm3(g, TT), { color: g.col, width: 2.4, domain: [Math.max(30, 0.6 * g.eps), 3000] });
          (BDATA[gs.value] || []).forEach(([TT, Bv]) => s2.dot(TT, Bv, { r: 5, hollow: true, color: 'ink' }));
          if (TB > 30) { s2.vline(TB, { color: 'green', width: 1.6, dash: [5, 4] }); s2.text(`T_B = ${TB.toFixed(0)} K`, TB, lo + 0.1 * (hi - lo), { size: 11, color: 'green', dx: 5, align: 'left' }); }
          if (g.TB) { s2.line(g.TB, -0.04 * (hi - lo), g.TB, 0.04 * (hi - lo), { color: 'ink', width: 2.5 }); s2.text('measured T_B', g.TB, -0.05 * (hi - lo), { size: 10, color: 'ink', align: 'left', dx: 5, dy: 6 }); }
          s2.vline(T, { color: 'gold', width: 1.2 });
          s2.dot(T, B, { r: 6, color: 'gold' });
          // right: Z from the truncated virial series at three temperatures
          const Zl = (TT, p) => 1 + B2cm3(g, TT) * 1e-3 * p / (R * TT);
          const temps = [[T, 'gold', 'T'], [TB, 'green', 'T_B'], [Math.max(T, TB) * 2, 'muted', '2·max']];
          let zlo = 0.97, zhi = 1.03;
          for (const [TT] of temps) for (const p of [0, 100]) { const z = Zl(TT, p); zlo = Math.min(zlo, z); zhi = Math.max(zhi, z); }
          const pad = 0.08 * (zhi - zlo); s3.setView([0, 100], [Math.max(0, zlo - pad), zhi + pad]);
          s3.hline(1, { color: 'ink', width: 1.2, dash: [6, 4] });
          for (const [TT, col, lab] of temps) { s3.fn((p) => Zl(TT, p), { color: col, width: col === 'gold' ? 2.6 : 1.8 }); s3.text(lab === '2·max' ? `${TT.toFixed(0)} K` : lab === 'T_B' ? `T_B ${TT.toFixed(0)} K` : `${TT.toFixed(0)} K`, 98, Zl(TT, 98), { size: 10.5, color: col, align: 'right', dy: -9 }); }
        });
        v.legend([['red', 'core: Mayer function < 0', { area: true }], ['blue', 'well: Mayer function > 0', { area: true }], ['ink', 'measured B (circles)', { dot: true }], ['green', 'computed Boyle temperature', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { g, T, B, TB, core, well } = st, slope = B * 1e-3 / (R * T);
          return `${g.name} at ${v.fix(T, 0)} K ($T/T_B = ${v.fix(T / TB, 2)}$), integrating out to $12\\sigma$: core area $${v.fix(-core, 3)}\\sigma^3$, well area $${v.fix(well, 3)}\\sigma^3$, so $B = -2\\pi N_A\\sigma^3(\\text{well} - \\text{core}) = ${v.fix(B, 1)}$ cm³/mol and the initial slope $dZ/dp = B/RT = ${v.sci(slope, 2)}$ bar⁻¹. Computed Boyle temperature ${v.fix(TB, 0)} K (= 3.418 ε/k), measured ${g.TB} K${g.name === 'He' || g.name === 'H₂' ? ' — the classical calculation fails for helium, a quantum gas' : ''}.`;
        });
      },
    },
  ],
};
