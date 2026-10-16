// Thermodynamics & Statistical Mechanics — Chapter 4: Phases, mixtures and chemical equilibrium
import { clamp, lerp, R, GAS, vdw, interp, bisect, W, psatW, tsatW, pmeltIh, pmeltW, psublW, ICE_TRIPLES, satW, WSAT, vdwP, vdwG, vdwRoots, vdwSpinodal, vdwCoex, PHASE, CRIT, CSAT, CO2ISO, ANTOINE, pAnt, tAnt, STEAM1, WATER, waterAt, bar } from './ch04.shared.js';

// ---------- helpers for this file ----------
const MPA = 1e6, BAR = 1e5;
/** Ice III and ice V melting pressures (Pa), IAPWS R14-08 Eqs. (2), (3). */
const pIII = (T) => 208.566e6 * (1 - 0.299948 * (1 - (T / 251.165) ** 60));
const pV = (T) => 350.1e6 * (1 - 1.18721 * (1 - (T / 256.164) ** 8));
/** Phase of water at (T, P) from the IAPWS coexistence curves: 'solid' | 'liquid' | 'gas' | 'fluid' (supercritical). */
function waterPhase(T, P) {
  if (T < W.Tt) {
    if (P < psublW(T)) return 'gas';
    if (T >= 251.165) { const lo = pmeltIh(T), hi = T <= 256.164 ? pIII(T) : pV(T); return P > lo && P < hi ? 'liquid' : 'solid'; }
    return 'solid';
  }
  const hi = T <= 273.31 ? pV(T) : pmeltW(T);
  if (P > hi) return 'solid';
  if (T < W.Tc) return P < psatW(T) ? 'gas' : 'liquid';
  return P >= W.Pc ? 'fluid' : 'gas';
}
const PHNAME = { solid: 'ice', liquid: 'liquid water', gas: 'water vapour', fluid: 'supercritical fluid' };
/** RGBA tint of a palette colour over the panel (for region rasters). */
const tint = (v, name, a) => { const P = v.rgb('panel'), C = v.rgb(name); return [0, 1, 2].map((k) => P[k] + (C[k] - P[k]) * a).concat(255); };
/**
 * The water P–T phase diagram on a log-P stage: tinted regions, IAPWS coexistence curves, triple and critical points.
 * o = {T0, T1, ices (mark ice triple points), labels, alpha}.
 */
function drawWaterPT(v, s, o = {}) {
  const T0 = o.T0 ?? 190, T1 = o.T1 ?? 720, a = o.alpha ?? 0.2;
  const col = { solid: tint(v, PHASE.solid, a), liquid: tint(v, PHASE.liquid, a), gas: tint(v, PHASE.gas, a), fluid: tint(v, PHASE.fluid, a * 0.8) };
  s.raster((T, P) => col[waterPhase(T, P)], { res: 3, key: 'wpt' + v.color('panel') + a });
  const ln = { width: 2.2 };
  s.curve((u) => { const T = lerp(Math.max(T0, 150), W.Tt, u); return [T, psublW(T)]; }, 0, 1, { ...ln, color: PHASE.solid, n: 120 });
  s.curve((u) => { const T = lerp(W.Tt, W.Tc, u); return [T, psatW(T)]; }, 0, 1, { ...ln, color: PHASE.gas, n: 200 });
  s.curve((u) => { const T = lerp(W.Tt, 251.165, u); return [T, pmeltIh(T)]; }, 0, 1, { ...ln, color: PHASE.liquid, n: 120 });
  s.curve((u) => { const T = lerp(251.165, 256.164, u); return [T, pIII(T)]; }, 0, 1, { ...ln, color: PHASE.liquid, n: 40 });
  s.curve((u) => { const T = lerp(256.164, 273.31, u); return [T, pV(T)]; }, 0, 1, { ...ln, color: PHASE.liquid, n: 40 });
  s.curve((u) => { const T = lerp(273.31, Math.min(T1, 715), u); return [T, pmeltW(T)]; }, 0, 1, { ...ln, color: PHASE.liquid, n: 200 });
  if (o.ices !== false) for (const [nm, T, P] of ICE_TRIPLES) if (P < 3e9) s.dot(T, P, { r: 3.2, color: 'ink', hollow: true });
  s.dot(W.Tt, W.Pt, { r: 5, color: 'red' });
  s.dot(W.Tc, W.Pc, { r: 5, color: 'red' });
  if (o.labels !== false) {
    s.text('triple point', W.Tt, W.Pt, { dx: 8, dy: 12, size: 11, color: 'red', align: 'left', plate: true });
    s.text('critical point', W.Tc, W.Pc, { dx: -8, dy: 13, size: 11, color: 'red', align: 'right', plate: true });
    s.text('ice', 225, 1e6, { size: 13, weight: 700, color: PHASE.solid, align: 'center' });
    s.text('liquid', 420, 5e7, { size: 13, weight: 700, color: PHASE.liquid, align: 'center' });
    s.text('vapour', 520, 30, { size: 13, weight: 700, color: PHASE.gas, align: 'center' });
    s.text('fluid', (W.Tc + T1) / 2, 3e8, { size: 11.5, weight: 650, color: PHASE.fluid, align: 'center' });
  }
}
const PT_TICKS = [[1, '1 Pa'], [100, '100 Pa'], [1e4, '10 kPa'], [1e6, '1 MPa'], [1e8, '100 MPa']];

/** Isotherm data of CO₂ at T: [v (L/mol), P (bar), phase]. */
const co2Iso = (T) => CO2ISO[T].map(([p, rho, ph]) => [1 / rho, p * 10, ph]);

/** Water heating curve at pressure P (Pa) for 1 kg from t0 to t1 (°C): breakpoints [Q (kJ), t (°C), stage]. */
function heatingCurve(P, t0 = -30, t1 = 150) {
  const Tb = tsatW(P) - 273.15, Tm = 0.0;   // melting point shift with pressure is < 0.01 K here
  const pts = [];
  let Q = 0;
  // ice: cp taken constant at its 0 °C value
  for (let t = t0; t < Tm; t += 1) { pts.push([Q, t, 'ice']); Q += W.cpIce / 1e3 * Math.min(1, Tm - t); }
  pts.push([Q, Tm, 'ice']);
  const melt0 = Q; Q += W.Lf / 1e3; pts.push([Q, Tm, 'melt']);
  const melt1 = Q;
  // liquid: tabulated cp (IAPWS-95 via WebBook)
  for (let t = Tm; t < Tb; t += 1) { const dt = Math.min(1, Tb - t); Q += waterAt(t + dt / 2, 1) * dt; pts.push([Q, t + dt, 'liquid']); }
  const boil0 = Q, L = satW(Tb + 273.15).L / 1e3; Q += L; pts.push([Q, Tb, 'boil']);
  const boil1 = Q;
  // steam: WebBook enthalpies at 1 atm; cp ≈ 2.0 kJ/(kg K) at other pressures
  for (let t = Tb; t < t1; t += 2) {
    const dt = Math.min(2, t1 - t);
    const cp = Math.abs(P - 101325) < 500 ? interp(STEAM1, 0, 2, t + dt / 2 + 273.15) : 2.0;
    Q += cp * dt; pts.push([Q, t + dt, 'steam']);
  }
  return { pts, Tb, L, melt0, melt1, boil0, boil1, Qend: Q };
}

export default {
  collection: 'thermo',
  chapter: 4,
  title: 'Phases, mixtures and chemical equilibrium',
  summary: String.raw`The van der Waals equation already contains liquid–gas coexistence and a critical point once Maxwell's equal-area construction replaces its unstable loop, and in reduced units it predicts that different fluids share one phase diagram — which real data confirm only roughly. Phase diagrams are maps of the phase of lowest Gibbs energy; along their coexistence curves latent heat and the volume jump fix the slope through the Clausius–Clapeyron relation, which explains why ice melts under pressure, and the Gibbs phase rule counts how many intensive variables stay free. Metastable states persist until a nucleus larger than a critical size forms; throttling cools a gas below its inversion curve, the route to liquid air. Mixing raises entropy — and raises Gibbs's paradox — while the chemical potential, lowered by $kT\ln x$ in a mixture, governs osmosis, colligative effects and chemical equilibrium, whose temperature dependence follows van 't Hoff and whose response to disturbances follows Le Chatelier. The chapter closes with the Ehrenfest classification and the Rankine cycle. Pictures compute on real data wherever possible: water from IAPWS formulations, other fluids from NIST reference equations of state, reactions from the JANAF tables.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Model', name: 'Van der Waals equation',
      statement: String.raw`The **van der Waals equation of state** for one mole of fluid is
$$P = \frac{RT}{v - b} - \frac{a}{v^2},$$
with two constants per substance: $b$, the volume per mole excluded by the molecules' hard cores (four times their own volume for spheres), and $a > 0$, which measures the mean attraction between molecules and lowers the pressure in proportion to the square of the density. It reduces to the ideal gas law (1.4) when $v \gg b$ and $a/v \ll RT$. Above the temperature $T_c = 8a/27Rb$ every isotherm decreases monotonically; below it each isotherm has a **loop** — a stretch with $(\partial P/\partial v)_T > 0$, i.e. negative isothermal compressibility $\kappa_T = -\tfrac1v(\partial v/\partial P)_T$, where the homogeneous fluid is mechanically unstable.`,
      idea: String.raw`Start from the ideal gas and make two corrections. Molecules are not points, so each one moves in the free volume $v - b$, raising the pressure to $RT/(v - b)$. Molecules attract, and a molecule about to hit the wall is pulled back by its neighbours: the momentum delivered drops by an amount proportional to the number of colliding molecules times the number pulling, $\propto n^2$, giving $-a/v^2$. The same equation follows from mean-field statistical mechanics (a hard-core free volume plus a uniform attractive background). Multiplying out gives a cubic in $v$: below $T_c$ some pressures have three solutions, and the middle one lies on the unstable loop. Real fluids do not follow the loop — they split into liquid and vapour (4.3), and the loop marks where they must.`,
      caption: String.raw`Left: the van der Waals isotherm of 1 mol (thick) at the temperature you pick, with **measured CO₂ isotherms** at the same temperature (dots: Span–Wagner reference equation via NIST) and the ideal-gas isotherm (dashed). The stretch where $\partial P/\partial v > 0$ is drawn red and shaded. **Drag the state point** along the isotherm; the right panel splits its pressure into the ideal-gas value, the push of the excluded volume and the pull of the attraction. Start from CO₂'s handbook constants, then slide $a$ and $b$: with $a \to 0$ the loop disappears whatever $T$, with $b \to 0$ the attraction makes the pressure plunge without bound.`,
      deps: ['thermo-1.4'],
      see: ['pchem-1.13', 'thermo-3.15'],
      refs: ['Schroeder §5.3', 'Tong ch. 5'],
      tags: ['equation of state', 'real gases'],
      credit: 'J. D. van der Waals, 1873 (thesis, Leiden)',
      scope: String.raw`A qualitative model: it gets the existence of a critical point and the shape of isotherms right, but predicts $Z_c = 3/8$ (real fluids: 0.23–0.30) and mean-field critical exponents. Quantitatively useful only for moderately dense gases well away from the critical point.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Van_der_Waals_equation' },
      viz(v) {
        const temps = ['270', '285', '300', '304.1282', '315', '330'];
        const Tsel = v.select('temperature (with CO₂ data)', temps.map((t) => ({ value: t, label: `${(+t).toFixed(t.includes('.') ? 2 : 0)} K` })), '285');
        const aS = v.slider('$a$ (L² bar/mol²)', 0, 6, GAS.CO2.a, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const bS = v.slider('$b$ (L/mol)', 0.005, 0.08, GAS.CO2.b, { step: 0.0005, fmt: (x) => v.fix(x, 4) });
        const sp = v.stage({ x: [0.035, 1.2], y: [-20, 140], xlog: true, height: 360, axes: 'box', gutter: true, xlabel: 'molar volume v (L/mol)', ylabel: 'P (bar)', weight: 1.5, title: 'isotherm: van der Waals against measured CO₂' });
        const sb = v.stage({ x: [-0.6, 3.6], y: [-100, 300], height: 360, axes: 'box', gutter: true, ylabel: 'bar', weight: 0.8, minWidth: 220, title: 'pressure at the state point', xticks: [[0, 'RT/v'], [1, 'core'], [2, '−a/v²'], [3, 'P']] });
        const Rb = 0.0831446;   // L bar / (mol K)
        const Pv = (T, vv) => Rb * T / (vv - bS.value) - aS.value / (vv * vv);
        const h = sp.handle(0.3, 0, { color: 'gold', label: 'state', constrain: (x) => { const xx = clamp(x, bS.value * 1.25, 1.15); return [xx, Pv(+Tsel.value, xx)]; } });
        h.set(0.3, Pv(285, 0.3));
        let st = null;
        v.render(() => {
          const T = +Tsel.value, a = aS.value, b = bS.value;
          const Tc = a > 0 ? 8 * a / (27 * Rb * b) : 0;
          // faint family at the other data temperatures
          for (const t of temps) if (t !== Tsel.value) sp.fn((x) => (x > b * 1.05 ? Pv(+t, x) : NaN), { color: 'faint', width: 1, domain: [0.035, 1.2] });
          sp.hline(0, { color: 'muted', width: 1 });
          sp.fn((x) => Rb * T / x, { color: 'muted', width: 1.4, dash: [6, 4] });
          // the isotherm, red where dP/dv > 0
          const xs = []; for (let i = 0; i <= 400; i++) xs.push(0.035 * (1.2 / 0.035) ** (i / 400));
          let run = [], unst = false, red = [];
          const flush = () => { if (run.length > 1) sp.path(run, { color: unst ? 'red' : 'accent', width: unst ? 3 : 2.8 }); };
          for (const x of xs) {
            if (x <= b * 1.03) continue;
            const p = Pv(T, x), dp = (Pv(T, x * 1.0005) - Pv(T, x / 1.0005));
            const u = dp > 0;
            if (u !== unst && run.length) { const last = run[run.length - 1]; flush(); run = [last]; }
            unst = u; run.push([x, p]); if (u) red.push(x);
          }
          flush();
          if (red.length) sp.vband(red[0], red[red.length - 1], { color: 'red', alpha: 0.08 });
          // measured CO2
          const dat = co2Iso(Tsel.value);
          sp.dots(dat.map(([vv, p]) => [vv, p]), { r: 3.2, color: 'gold' });
          const sat = dat.filter((d, i) => i > 0 && dat[i - 1][2] !== d[2] && d[2] === 'l');
          if (sat.length) { const vl = sat[0][0], ps = sat[0][1], vg = dat.find((d, i) => dat[i + 1] && dat[i + 1][2] === 'l')[0]; sp.line(vl, ps, vg, ps, { color: 'gold', width: 2, dash: [5, 3] }); sp.text('measured plateau: liquid + vapour', Math.sqrt(vl * vg), ps, { dy: 14, size: 11, color: 'ink', align: 'center', plate: true }); }
          if (b <= 0.08) sp.vline(b, { color: 'muted', dash: [2, 3] });
          // state point
          const vv = h.x, P = Pv(T, vv);
          if (!h.dragging) h.set(vv, P);
          const ideal = Rb * T / vv, core = Rb * T / (vv - b) - ideal, att = -a / (vv * vv);
          const ys = [0, ideal, ideal + core, ideal + core + att, P], ylo = Math.min(...ys), yhi = Math.max(...ys), pad = 0.12 * (yhi - ylo || 1);
          sb.setView([-0.6, 3.6], [ylo - pad, yhi + pad]);
          sb.hline(0, { color: 'muted', width: 1 });
          bar(sb, 0, ideal, 0.32, 'muted');
          bar(sb, 1, ideal + core, 0.32, 'orange', { base: ideal });
          bar(sb, 2, ideal + core + att, 0.32, 'blue', { base: ideal + core });
          bar(sb, 3, P, 0.32, 'accent');
          sb.line(0.32, ideal, 0.68, ideal, { color: 'faint', dash: [3, 3] }); sb.line(1.32, ideal + core, 1.68, ideal + core, { color: 'faint', dash: [3, 3] });
          [[0, ideal, ideal / 2], [1, core, ideal + core / 2], [2, att, ideal + core + att / 2], [3, P, P / 2]].forEach(([i, val, y]) => sb.text(v.fix(val, 1), i, y, { align: 'center', size: 11, plate: true }));
          const dPdv = (Pv(T, vv * 1.0001) - Pv(T, vv / 1.0001)) / (vv * 2e-4);
          // nearest measured point on the same branch
          let best = null; for (const d of dat) if (!best || Math.abs(Math.log(d[0] / vv)) < Math.abs(Math.log(best[0] / vv))) best = d;
          st = { T, Tc, vv, P, kappa: -1 / (vv * dPdv), best, red: red.length ? [red[0], red[red.length - 1]] : null, a, b };
        });
        v.legend([['accent', 'van der Waals'], ['red', 'unstable: $\\partial P/\\partial v > 0$'], ['gold', 'CO₂ measured (NIST)', { dot: true }], ['muted', 'ideal gas $RT/v$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, Tc, vv, P, kappa, best, red, a, b } = st;
          const close = best && Math.abs(Math.log(best[0] / vv)) < 0.05 ? ` · measured CO₂ near this volume: ${v.fix(best[1], 1)} bar (${best[2] === 'l' ? 'liquid' : best[2] === 's' ? 'supercritical' : 'vapour'})` : '';
          return `$T$ = ${v.fix(T, 2)} K, $T_c = 8a/27Rb$ = **${v.fix(Tc, 1)} K** (CO₂ measured: 304.13 K) · state $v$ = ${v.fix(vv, 3)} L/mol, $P$ = ${v.fix(P, 1)} bar${close}\n$\\kappa_T = -\\frac1v\\left(\\frac{\\partial v}{\\partial P}\\right)_T$ = ${isFinite(kappa) ? (kappa > 0 ? v.fix(kappa * 1e3, 2) + '×10⁻³ /bar' : '**' + v.fix(kappa * 1e3, 2) + '×10⁻³ /bar < 0 — unstable**') : '∞'} · ${red ? `loop between v = ${v.fix(red[0], 3)} and ${v.fix(red[1], 3)} L/mol: $T < T_c$` : (T >= Tc ? 'no loop: $T \\ge T_c$, the isotherm falls monotonically' : 'no loop in this window')} · $a$ = ${v.fix(a, 2)}, $b$ = ${v.fix(b, 4)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Phenomenon', name: 'Critical point and corresponding states',
      statement: String.raw`Every fluid has a **critical point** $(T_c, P_c, v_c)$ at which the liquid and vapour coexisting below it become identical: the latent heat and the density difference vanish, and the critical isotherm has a horizontal inflection, $(\partial P/\partial v)_T = (\partial^2 P/\partial v^2)_T = 0$. The **law of corresponding states** asserts that in reduced variables $T_r = T/T_c$, $P_r = P/P_c$, $v_r = v/v_c$ all fluids obey one and the same equation of state. For the van der Waals model this is exact: $P_r = 8T_r/(3v_r - 1) - 3/v_r^2$, with no substance-dependent constant left. For real fluids it holds well for simple, nearly spherical molecules (Ar, Kr, Xe, N₂, O₂, CH₄) and less well for elongated or polar ones. Near the critical point the coexistence curve closes as $\rho_l - \rho_v \propto (T_c - T)^\beta$ with the universal exponent $\beta \approx 0.326$ for all fluids, not the van der Waals value $1/2$.`,
      idea: String.raw`If intermolecular forces have one shape $u(r) = \varepsilon\,\phi(r/\sigma)$ with only an energy scale $\varepsilon$ and a length scale $\sigma$ differing between substances, then dimensional analysis of the partition function makes $P\sigma^3/\varepsilon$ a universal function of $kT/\varepsilon$ and $\rho\sigma^3$; the critical constants are fixed multiples of $\varepsilon/k$, $\varepsilon/\sigma^3$ and $\sigma^3$, so reducing by them removes every material constant. Any two-parameter equation of state, van der Waals included (4.1), inherits the property. Departures measure how far molecules are from that ideal (the acentric factor $\omega$). Very close to $T_c$ density fluctuations of every size dominate and mean-field theories fail; the measured exponent $\beta \approx 1/3$ is the same for all fluids and for the 3D Ising model — universality.`,
      caption: String.raw`Saturated-liquid and vapour densities (or vapour pressures) of six fluids in reduced units, from NIST reference equations of state. **Switch the view**, and **drag the temperature line**. On the left the six fluids nearly fall on one curve — Guggenheim's 1945 empirical fit (dashed) — and the van der Waals prediction (purple) is visibly too narrow. On the right the log–log plot of $(\rho_l - \rho_v)/\rho_c$ against $1 - T/T_c$ shows the data closing with slope ≈ 1/3, the van der Waals curve with slope 1/2. In the vapour-pressure view, carbon dioxide drifts off the common line: its acentric factor, computed live from the data, is ten times the others'.`,
      deps: ['thermo-4.1'],
      see: ['pchem-1.15', 'thermo-4.3'],
      refs: ['Kardar §5.7', 'Tong ch. 5'],
      tags: ['critical point', 'universality'],
      credit: 'Van der Waals, 1880 (corresponding states); Guggenheim, 1945 (test on simple fluids)',
      scope: String.raw`Two-parameter corresponding states holds to a few per cent for simple fluids; three-parameter versions (Pitzer's acentric factor, 1955) extend it to non-spherical molecules. It fails for quantum fluids (He, H₂) and strongly polar or hydrogen-bonded ones (water, ammonia).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theorem_of_corresponding_states' },
      viz(v) {
        const view = v.select('view', [{ value: 'rho', label: 'coexisting densities' }, { value: 'p', label: 'vapour pressure' }], 'rho');
        const gases = ['Ar', 'N2', 'O2', 'CH4', 'Xe', 'CO2'], gcol = { Ar: 'blue', N2: 'green', O2: 'teal', CH4: 'orange', Xe: 'pink', CO2: 'red' };
        const sa = v.stage({ x: [0, 3], y: [0.55, 1.03], height: 360, axes: 'box', gutter: true, xlabel: 'ρ/ρc', ylabel: 'T/Tc', weight: 1.3, title: 'reduced coexistence curve' });
        const sb = v.stage({ x: [0.002, 0.5], y: [0.1, 4], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, xlabel: '1 − T/Tc', ylabel: '(ρl − ρv)/ρc', weight: 1, title: 'how the curve closes (log–log)' });
        const hT = sa.handle(2.75, 0.8, { color: 'gold', constrain: (x, y) => (view.value === 'rho' ? [2.75, clamp(y, 0.57, 0.995)] : [clamp(x, 1.005, 1.75), -4.6]) });
        const gug = (t, s) => 1 + 0.75 * (1 - t) + s * 1.75 * (1 - t) ** (1 / 3);
        let st = null;
        v.render(() => {
          const rho = view.value === 'rho';
          if (rho) {
            sa.setView([0, 3], [0.55, 1.03]); sa.setLabels('ρ/ρc', 'T/Tc'); sa.setTitle('reduced coexistence curve');
            sb.setScale({ xlog: true, ylog: true, x: [0.002, 0.5], y: [0.1, 4] }); sb.setLabels('1 − T/Tc', '(ρl − ρv)/ρc'); sb.setTitle('how the curve closes (log–log)');
            if (hT.y < 0) hT.set(2.75, 0.8);
          } else {
            sa.setView([1, 1.8], [-5, 0.1]); sa.setLabels('Tc/T', 'ln(P/Pc)'); sa.setTitle('reduced vapour pressure');
            sb.setScale({ xlog: false, ylog: false, x: [-0.6, 5.6], y: [-0.4, 0.3] }); sb.setLabels(null, 'ω'); sb.setTitle('acentric factor from the data');
            sb.setTicks([], null);
            if (hT.y > 0) hT.set(1 / 0.7, -4.6);
          }
          if (rho) sb.setTicks(null, null);
          const Tr = rho ? hT.y : 1 / hT.x;
          // van der Waals
          const vdwPts = [], vdwPv = [];
          for (let i = 0; i <= 120; i++) { const t = 0.55 + (0.9999 - 0.55) * i / 120, c = vdwCoex(t); if (c) { vdwPts.push([t, 1 / c.vl, 1 / c.vg]); vdwPv.push([1 / t, Math.log(c.p)]); } }
          const fits = {};
          if (rho) {
            sa.curve((t) => [gug(t, 1), t], 0.55, 0.9999, { color: 'ink', dash: [6, 4], width: 1.6, n: 200 });
            sa.curve((t) => [gug(t, -1), t], 0.55, 0.9999, { color: 'ink', dash: [6, 4], width: 1.6, n: 200 });
            sa.path(vdwPts.map((p) => [p[1], p[0]]).concat(vdwPts.slice().reverse().map((p) => [p[2], p[0]])), { color: 'purple', width: 2.2 });
            for (const g of gases) { const rows = CSAT[g]; sa.dots(rows.map((r) => [r[2], r[0]]), { r: 2.6, color: gcol[g] }); sa.dots(rows.map((r) => [r[3], r[0]]), { r: 2.6, color: gcol[g] }); }
            sa.hline(Tr, { color: 'gold', width: 1.2, dash: [4, 3] });
            sa.dot(1, 1, { r: 5, color: 'red' }); sa.text('critical point', 1, 1, { dy: -10, size: 11, color: 'red', align: 'center' });
            // log-log
            sb.fn((x) => 3.5 * x ** (1 / 3), { color: 'ink', dash: [6, 4], width: 1.4 });
            sb.path(vdwPts.map((p) => [1 - p[0], p[1] - p[2]]), { color: 'purple', width: 2.2 });
            for (const g of gases) {
              const pts = CSAT[g].map((r) => [1 - r[0], r[2] - r[3]]).filter((p) => p[0] > 0);
              sb.dots(pts, { r: 2.6, color: gcol[g] });
              const near = pts.filter((p) => p[0] <= 0.021);
              if (near.length >= 3) { const X = near.map((p) => Math.log(p[0])), Y = near.map((p) => Math.log(p[1])); fits[g] = v.M.linreg(X, Y).slope; }
            }
            const vn = vdwPts.filter((p) => 1 - p[0] < 0.01).map((p) => [Math.log(1 - p[0]), Math.log(p[1] - p[2])]);
            fits.vdw = vn.length > 2 ? v.M.linreg(vn.map((p) => p[0]), vn.map((p) => p[1])).slope : NaN;
            sb.text('slope 1/3', 0.01, 3.5 * 0.01 ** (1 / 3), { dy: -12, size: 11, color: 'ink', plate: true });
            sb.text('van der Waals: slope 1/2', 0.006, 0.35, { size: 11, color: 'purple', plate: true, align: 'left' });
            sb.vline(1 - Tr, { color: 'gold', width: 1.2, dash: [4, 3] });
          } else {
            sa.path(vdwPv, { color: 'purple', width: 2.2 });
            for (const g of gases) sa.dots(CSAT[g].map((r) => [1 / r[0], Math.log(r[1])]), { r: 2.6, color: gcol[g] });
            sa.vline(1 / Tr, { color: 'gold', width: 1.2, dash: [4, 3] });
            sa.vline(1 / 0.7, { color: 'faint', width: 1, dash: [2, 3] });
            sa.text('T/Tc = 0.7', 1 / 0.7, -4.6, { dx: 4, size: 10.5, color: 'muted', align: 'left' });
            gases.forEach((g, i) => {
              const C = CSAT[g], ext = C[0][0] > 0.7;
              // below CO2's triple point (T/Tc = 0.712) extend ln P linearly in 1/T from the first two points
              const pr = ext ? Math.exp(Math.log(C[0][1]) + (Math.log(C[1][1]) - Math.log(C[0][1])) * (1 / 0.7 - 1 / C[0][0]) / (1 / C[1][0] - 1 / C[0][0])) : interp(C, 0, 1, 0.7), om = -Math.log10(pr) - 1;
              fits[g] = om;
              if (isFinite(om)) { bar(sb, i, om, 0.32, gcol[g]); sb.text(v.fix(om, 3), i, Math.max(om, 0), { dy: -9, size: 10.5, align: 'center' }); }
              sb.text(g.replace('2', '₂').replace('4', '₄'), i, -0.36, { size: 11.5, weight: 650, align: 'center', color: gcol[g] });
            });
            const pv = vdwCoex(0.7); fits.vdw = -Math.log10(pv.p) - 1;
            sb.hline(fits.vdw, { color: 'purple', dash: [5, 3], width: 1.6 });
            sb.text('van der Waals', 5.4, fits.vdw, { dy: -8, size: 10.5, color: 'purple', align: 'right' });
          }
          // spread among simple fluids at Tr
          const simple = ['Ar', 'N2', 'O2', 'CH4', 'Xe'].filter((g) => CSAT[g][0][0] <= Tr);
          const rl = simple.map((g) => interp(CSAT[g], 0, 2, Tr)), c = vdwCoex(Tr);
          st = { rho, Tr, rl, gug: gug(Tr, 1), vdwl: c ? 1 / c.vl : NaN, fits };
        });
        v.legend(gases.map((g) => [gcol[g], CRIT[g].name, { dot: true }]).concat([['purple', 'van der Waals'], ['ink', 'Guggenheim 1945', { dash: true }]]));
        v.readout(() => {
          if (!st) return '';
          const { rho, Tr, rl, gug: gg, vdwl, fits } = st;
          const zc = ['Ar', 'N2', 'CH4', 'CO2'].map((g) => `${g.replace('2', '₂').replace('4', '₄')} ${v.fix(CRIT[g].Pc * 1e6 / (CRIT[g].rc * 1e3 * R * CRIT[g].Tc), 3)}`).join(', ');
          if (rho) {
            const mn = Math.min(...rl), mx = Math.max(...rl);
            const b = ['Ar', 'N2', 'CH4', 'Xe', 'CO2'].map((g) => `${g.replace('2', '₂').replace('4', '₄')} ${v.fix(fits[g], 3)}`).join(', ');
            return `at $T/T_c$ = ${v.fix(Tr, 3)}: liquid $\\rho_l/\\rho_c$ of the five simple fluids spans ${v.fix(mn, 3)}–${v.fix(mx, 3)} (spread ${v.fix(100 * (mx - mn) / mn, 1)} %); Guggenheim ${v.fix(gg, 3)}; van der Waals **${v.fix(vdwl, 3)}**\neffective exponent $\\beta$ fitted over $1 - T/T_c \\le 0.02$: ${b} — van der Waals ${v.fix(fits.vdw, 3)} · critical compressibility $Z_c = P_c/\\rho_cRT_c$: ${zc}; van der Waals 3/8 = 0.375`;
          }
          const o = ['Ar', 'N2', 'O2', 'CH4', 'Xe', 'CO2'].map((g) => `${g.replace('2', '₂').replace('4', '₄')} ${isFinite(fits[g]) ? v.fix(fits[g], 4) : '—'}`).join(', ');
          return `acentric factor $\\omega = -\\log_{10}(P/P_c)|_{T/T_c = 0.7} - 1$ from the data: ${o} (NIST lists Ar −0.0022, N₂ 0.0372, O₂ 0.0222, CH₄ 0.0114, Xe 0.0036, CO₂ 0.2239; CO₂'s value needs a short extrapolation below its triple point at $T/T_c$ = 0.712); van der Waals ${v.fix(fits.vdw, 3)}\nsimple fluids share one curve ($\\omega \\approx 0$); the elongated CO₂ molecule does not — a third parameter is needed`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Method', name: 'Maxwell’s equal-area construction',
      statement: String.raw`Below $T_c$ a van der Waals isotherm $P(v)$ has a loop. The physical isotherm replaces the loop by a horizontal segment at the **coexistence pressure** $P^*$ between the liquid volume $v_l$ and the vapour volume $v_g$, where $P^*$ is fixed by the condition that the two areas enclosed between the loop and the line be equal:
$$\int_{v_l}^{v_g} \big(P(v) - P^*\big)\,dv = 0.$$
This is equivalent to equality of the molar Gibbs energies (chemical potentials) of the two phases, $g(v_l) = g(v_g)$, at equal $T$ and $P$. Along the segment the system is a mixture of liquid and vapour in proportions given by the lever rule.`,
      idea: String.raw`Along an isotherm $dg = v\,dP$, so integrating along the loop from the liquid to the vapour root at pressure $p$ gives $g_g - g_l = \int v\,dP = p(v_g - v_l) - \int_{v_l}^{v_g} P\,dv$, which is exactly (lower area) − (upper area). The two phases can coexist only where their Gibbs energies agree (3.10, minimum Gibbs energy at fixed $T$ and $P$), so the areas must cancel. Plotted against $P$, $g$ traces a "swallowtail": the stable branch is the lower envelope, and its two lowest sheets cross at $P^*$ with a kink — a first-order transition. The parts of the loop between the coexistence volumes and the spinodal points are metastable (4.9); the middle part, with $\partial P/\partial v > 0$, is unstable (3.15).`,
      caption: String.raw`Left: a reduced van der Waals isotherm. **Drag the horizontal line** (gold handle) up and down: the shaded areas between it and the loop — orange where the loop is above, blue where below — change in opposite directions. Right: the molar Gibbs energy along the same isotherm against pressure, a swallowtail whose lower envelope is the stable state. The readout shows $g_g - g_l$ at your pressure equals (blue area) − (orange area); both vanish at the same pressure, where the two lowest branches cross (green). Lower the temperature to widen the loop; at $T = T_c$ the swallowtail shrinks to a point. The readout also compares the van der Waals coexistence pressure with argon's measured one at the same $T/T_c$.`,
      deps: ['thermo-4.1', 'thermo-3.10'],
      see: ['pchem-1.15', 'thermo-3.15'],
      refs: ['Tong ch. 5'],
      tags: ['phase coexistence', 'Gibbs energy'],
      credit: 'J. C. Maxwell, 1875 (Nature 11, 357)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maxwell_construction' },
      viz(v) {
        const Ts = v.slider('$T/T_c$', 0.8, 0.995, 0.9, { step: 0.001, fmt: (x) => v.fix(x, 3) });
        const sp = v.stage({ x: [0.45, 4], y: [0, 1.2], height: 360, axes: 'box', gutter: true, xlabel: 'v/vc', ylabel: 'P/Pc', weight: 1.2, title: 'the loop and a trial pressure' });
        const sg = v.stage({ x: [0.2, 1.1], y: [-1, 1], height: 360, axes: 'box', gutter: true, xlabel: 'P/Pc', ylabel: 'g (reduced)', weight: 1, title: 'Gibbs energy along the isotherm' });
        const hp = sp.handle(3.8, 0.7, { color: 'gold', label: 'P', constrain: (x, y) => { const sp0 = vdwSpinodal(Ts.value); const lo = sp0 ? Math.max(0.005, vdwP(Ts.value, sp0[0])) : 0.2, hi = sp0 ? vdwP(Ts.value, sp0[1]) : 1; return [3.8, clamp(y, lo + 1e-4, hi - 1e-4)]; } });
        v.button('Jump to equal areas', () => { const c = vdwCoex(Ts.value); if (c) hp.set(3.8, c.p); });
        let st = null;
        v.render(() => {
          const T = Ts.value, spn = vdwSpinodal(T), c = vdwCoex(T);
          const pLo = Math.max(0.005, vdwP(T, spn[0])), pHi = vdwP(T, spn[1]);
          if (hp.y < pLo || hp.y > pHi) hp.set(3.8, clamp(hp.y, pLo + 1e-4, pHi - 1e-4));
          const p = hp.y, r = vdwRoots(T, p);
          sp.setView([0.45, 4], [0, Math.max(1.15, 1.1)]);
          if (r.length === 3) {
            sp.between((x) => vdwP(T, x), () => p, r[1], r[2], { fill: 'orange', fillAlpha: 0.35 });
            sp.between(() => p, (x) => vdwP(T, x), r[0], r[1], { fill: 'blue', fillAlpha: 0.3 });
          }
          sp.fn((x) => vdwP(T, x), { color: 'ink', width: 2.4, domain: [0.4, 4.2] });
          sp.fn((x) => vdwP(T, x), { color: 'red', width: 3, domain: [spn[0], spn[1]] });
          sp.hline(p, { color: 'gold', width: 2 });
          if (c) { sp.line(c.vl, c.p, c.vg, c.p, { color: 'green', width: 1.6, dash: [5, 4] }); sp.dot(c.vl, c.p, { r: 3.5, color: 'green' }); sp.dot(c.vg, c.p, { r: 3.5, color: 'green' }); }
          for (const x of r) sp.dot(x, p, { r: 3.2, color: 'gold' });
          sp.dot(1, 1, { r: 4, color: 'red', hollow: true }); sp.text('critical point', 1, 1, { dx: 8, size: 10.5, color: 'red', align: 'left' });
          // areas
          const A = (x0, x1) => (8 * T / 3) * Math.log((3 * x1 - 1) / (3 * x0 - 1)) + 3 * (1 / x1 - 1 / x0) - p * (x1 - x0);
          const below = r.length === 3 ? -A(r[0], r[1]) : 0, above = r.length === 3 ? A(r[1], r[2]) : 0;
          if (r.length === 3) {
            sp.text(v.fix(above, 4), (r[1] + r[2]) / 2, p + 0.04, { size: 11.5, color: 'orange', weight: 700, align: 'center', plate: true });
            sp.text(v.fix(below, 4), (r[0] + r[1]) / 2, p - 0.06, { size: 11.5, color: 'blue', weight: 700, align: 'center', plate: true });
          }
          // swallowtail
          const pts = []; for (let i = 0; i <= 600; i++) { const x = 0.38 * (4.5 / 0.38) ** (i / 600); if (x > 0.345) { const P = vdwP(T, x); if (P > 0.15 && P < 1.15) pts.push([P, vdwG(T, x), x]); } }
          const gref = c ? vdwG(T, c.vl) : 0;
          const G = pts.map(([P, g, x]) => [P, g - gref, x]);
          const x0 = Math.max(0.15, pLo - 0.1), x1 = Math.min(1.12, pHi + 0.1);
          const gs = G.filter((q) => q[0] >= x0 && q[0] <= x1).map((q) => q[1]); const glo = Math.min(...gs), ghi = Math.max(...gs), gp = 0.08 * (ghi - glo);
          sg.setView([x0, x1], [glo - gp, ghi + gp]);
          const brL = G.filter((q) => q[2] < spn[0]), brM = G.filter((q) => q[2] >= spn[0] && q[2] <= spn[1]), brG = G.filter((q) => q[2] > spn[1]);
          sg.path(brL.map((q) => [q[0], q[1]]), { color: PHASE.liquid, width: 2.6 });
          sg.path(brG.map((q) => [q[0], q[1]]), { color: PHASE.gas, width: 2.6 });
          sg.path(brM.map((q) => [q[0], q[1]]), { color: 'red', width: 2, dash: [5, 3] });
          sg.vline(p, { color: 'gold', width: 1.5 });
          let gl = NaN, gg = NaN;
          if (r.length === 3) { gl = vdwG(T, r[0]) - gref; gg = vdwG(T, r[2]) - gref; sg.dot(p, gl, { r: 4.5, color: PHASE.liquid }); sg.dot(p, gg, { r: 4.5, color: PHASE.gas }); sg.dot(p, vdwG(T, r[1]) - gref, { r: 3.5, color: 'red' }); }
          if (c) { sg.dot(c.p, 0, { r: 5.5, color: 'green' }); sg.text('branches cross: coexistence', c.p, 0, { dx: 8, dy: 14, size: 11, color: 'green', align: 'left', plate: true }); }
          { const q = brG.filter((q) => q[0] >= x0 && q[0] <= x1); if (q.length) sg.text('vapour', q[Math.floor(q.length * 0.15)][0], q[Math.floor(q.length * 0.15)][1], { dx: 8, size: 11, color: PHASE.gas, align: 'left' }); }
          sg.text('liquid', brL.length ? brL[Math.floor(brL.length * 0.8)][0] : 0, brL.length ? brL[Math.floor(brL.length * 0.8)][1] : 0, { dx: -6, dy: -10, size: 11, color: PHASE.liquid, align: 'left' });
          const ar = interp(CSAT.Ar, 0, 1, T);
          st = { T, p, above, below, gl, gg, c, ar };
        });
        v.legend([['orange', 'area where loop is above the line', { area: true }], ['blue', 'area where loop is below', { area: true }], [PHASE.liquid, 'liquid branch'], [PHASE.gas, 'vapour branch'], ['red', 'unstable branch', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, p, above, below, gl, gg, c, ar } = st;
          return `trial $P/P_c$ = ${v.fix(p, 4)}: areas ${v.fix(above, 4)} (above) and ${v.fix(below, 4)} (below), difference blue − orange = **${v.fix(below - above, 4)}** · $g_g - g_l$ at this pressure = **${v.fix(gg - gl, 4)}** (same number: $dg = v\\,dP$)\nequal areas at $P^*/P_c$ = ${v.fix(c.p, 4)}, liquid $v_l/v_c$ = ${v.fix(c.vl, 3)}, vapour $v_g/v_c$ = ${v.fix(c.vg, 3)} · argon measured at $T/T_c$ = ${v.fix(T, 3)}: $P/P_c$ = ${v.fix(ar, 4)} — the van der Waals pressure is ${v.fix(100 * (c.p / ar - 1), 0)} % ${c.p > ar ? 'high' : 'low'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Definition', name: 'Phase diagrams and coexistence curves',
      statement: String.raw`A **phase** is a homogeneous region of matter with uniform intensive properties (ice, liquid water, vapour). The **phase diagram** of a one-component substance is the map of the $(T, P)$ plane showing which phase has the lowest molar Gibbs energy $g(T, P) = \mu(T, P)$ — the one present at equilibrium (3.10). Regions are separated by **coexistence curves** on which two phases have equal chemical potential, $\mu_\alpha(T, P) = \mu_\beta(T, P)$, and can coexist in any proportion. Three curves can meet at a **triple point**, where three phases coexist (for water: 273.16 K, 611.657 Pa), and the liquid–vapour curve ends at the **critical point** (647.096 K, 22.064 MPa), beyond which liquid and vapour are not distinct phases.`,
      idea: String.raw`Each phase has its own smooth surface $\mu(T, P)$ with slopes $\partial\mu/\partial T = -s$ and $\partial\mu/\partial P = v$ (3.6). At fixed pressure, the phase with the larger entropy has the more steeply falling $\mu(T)$, so heating takes the system from solid to liquid to gas, each transition happening where two lines cross. Raising the pressure lifts every $\mu$ by $v\,\Delta P$, most for the phase of largest volume, which shifts the crossings: that is the coexistence curve. A liquid–vapour curve can end because both phases are the same fluid continuously deformed; a solid–liquid curve cannot end, because crystal symmetry cannot appear gradually.`,
      caption: String.raw`The phase diagram of water with the coexistence curves of the IAPWS formulations, pressure on a log scale from 0.1 Pa to 3 GPa (small rings: triple points of liquid with the high-pressure ices III, V, VI, VII). **Drag the state point.** The right panel plots each phase's Gibbs energy relative to the liquid, $\mu - \mu_{\text{liquid}}$, against temperature at the state's pressure, computed from a simple model built from data at the triple point (heat capacities, latent heats, densities; ideal vapour). The lowest line is the stable phase; its crossings predict the melting and boiling temperatures, compared in the readout with the real curves (tick marks).`,
      deps: ['thermo-3.10'],
      see: ['pchem-4.2', 'thermo-4.8'],
      refs: ['Schroeder §5.3'],
      tags: ['phase diagram', 'phase coexistence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phase_diagram' },
      viz(v) {
        const s = v.stage({ x: [190, 720], y: [0.1, 3e9], ylog: true, height: 380, axes: 'box', gutter: { l: 64 }, xlabel: 'T (K)', ylabel: 'P', yticks: PT_TICKS.concat([[1e9, '1 GPa']]), weight: 1.25, title: 'water: IAPWS coexistence curves' });
        const sm = v.stage({ x: [190, 720], y: [-400, 400], height: 380, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'μ − μ_liquid (kJ/kg)', weight: 1, title: 'Gibbs energies at the chosen pressure' });
        const h = s.handle(300, 101325, { color: 'gold', label: 'state', constrain: { x: [195, 715], y: [0.15, 2.8e9] } });
        // simple model, per kg, all phases equal at the triple point
        const Tt = W.Tt, Pt = W.Pt, Rw = R / W.M, cpl = 4219, cpv = 1884, vl = 1 / 999.8, vi = 1 / W.rhoIce, Lft = 333444, sv0 = WSAT[0][7] * 1e3;
        // cumulative ∫ s_l dT on the saturation table above Tt
        const cum = [[Tt, 0]]; { let acc = 0; for (let i = 1; i < WSAT.length; i++) { const a = WSAT[i - 1], b = WSAT[i]; acc += (a[4] + b[4]) / 2 * 1e3 * (b[0] - a[0]); cum.push([b[0], acc]); } }
        const Isl = (T) => (T >= Tt ? (T <= 647 ? interp(cum, 0, 1, T) : interp(cum, 0, 1, 647) + WSAT[WSAT.length - 1][4] * 1e3 * (T - 647)) : cpl * (T * Math.log(T / Tt) - (T - Tt)));
        const muL = (T, P) => -Isl(T) + vl * (P - Pt);
        const muI = (T, P) => -((-Lft / Tt) * (T - Tt) + W.cpIce / Tt * (T - Tt) ** 2 / 2) + vi * (P - Pt);
        const muG = (T, P) => -(sv0 * (T - Tt) + cpv * (T * Math.log(T / Tt) - (T - Tt))) + Rw * T * Math.log(P / Pt);
        let st = null;
        v.render(() => {
          drawWaterPT(v, s);
          s.hline(h.y, { color: 'gold', width: 1, dash: [4, 4] });
          const P = h.y, T = h.x, ph = waterPhase(T, P);
          // μ panel
          const d = (f) => (T_) => (f(T_, P) - muL(T_, P)) / 1e3;
          sm.hline(0, { color: PHASE.liquid, width: 2.6 });
          sm.fn(d(muI), { color: PHASE.solid, width: 2.6, domain: [190, 720] });
          sm.fn(d(muG), { color: PHASE.gas, width: 2.6, domain: [190, 720] });
          // lower envelope shading
          sm.fn((T_) => Math.min(0, d(muI)(T_), d(muG)(T_)), { color: 'gold', width: 9, alpha: 0.35, domain: [190, 720] });
          sm.vline(T, { color: 'gold', width: 1.2 });
          // predicted crossings
          const cross = (f) => { const g = (T_) => f(T_, P) - muL(T_, P); const out = []; let prev = g(190); for (let T_ = 191; T_ <= 720; T_ += 1) { const c = g(T_); if (c * prev < 0) out.push(bisect(g, T_ - 1, T_, 40)); prev = c; } return out; };
          const tm = cross(muI), tb = cross(muG), tsub = (() => { const g = (T_) => muI(T_, P) - muG(T_, P); let prev = g(150); for (let T_ = 151; T_ <= 400; T_ += 1) { const c = g(T_); if (c * prev < 0) return bisect(g, T_ - 1, T_, 40); prev = c; } return NaN; })();
          // real transition temperatures at this P
          const realB = P < W.Pc && P > Pt ? tsatW(P) : NaN;
          const realM = P > Pt && P < 208.566e6 ? bisect((T_) => pmeltIh(T_) - P, 251.165, 273.16) : NaN;
          const realS = P < Pt ? bisect((T_) => psublW(T_) - P, 120, 273.16) : NaN;
          for (const [tt, col] of [[realB, PHASE.gas], [realM, PHASE.solid], [realS, PHASE.solid]]) if (isFinite(tt)) { sm.line(tt, -400, tt, -340, { color: col, width: 3 }); }
          for (const tt of tm) sm.dot(tt, 0, { r: 4, color: PHASE.solid });
          for (const tt of tb) sm.dot(tt, 0, { r: 4, color: PHASE.gas });
          const at = (f, y) => { const g = (T_) => f(T_) - y; for (let T_ = 192; T_ < 718; T_ += 2) if (g(T_) * g(T_ + 2) <= 0) return bisect(g, T_, T_ + 2, 30); return NaN; };
          { const ti = at(d(muI), 250); if (isFinite(ti)) sm.text('ice', ti, 250, { dx: -8, size: 11.5, color: PHASE.solid, weight: 650, align: 'right' }); }
          { const tg = at(d(muG), -250); if (isFinite(tg)) sm.text('vapour', tg, -250, { dx: 8, size: 11.5, color: PHASE.gas, weight: 650, align: 'left' }); }
          sm.text('liquid', 460, 0, { dy: -9, size: 11.5, color: PHASE.liquid, weight: 650, align: 'center' });
          const mus = { solid: muI(T, P), liquid: muL(T, P), gas: muG(T, P) };
          st = { T, P, ph, mus, tm, tb, tsub, realB, realM, realS };
        });
        v.legend([[PHASE.solid, 'ice'], [PHASE.liquid, 'liquid'], [PHASE.gas, 'vapour'], [PHASE.fluid, 'supercritical fluid', { area: true }], ['red', 'triple & critical points', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, P, ph, mus, tm, tb, tsub, realB, realM, realS } = st;
          const Pt = P >= 1e6 ? `${v.fix(P / 1e6, 3)} MPa` : P >= 1e3 ? `${v.fix(P / 1e3, 3)} kPa` : `${v.fix(P, 3)} Pa`;
          const mn = Math.min(mus.solid, mus.liquid, mus.gas);
          const model = ph === 'fluid' ? 'supercritical: liquid and vapour are one phase' : `model's lowest μ: **${Object.keys(mus).find((k) => mus[k] === mn) === 'solid' ? 'ice' : Object.keys(mus).find((k) => mus[k] === mn)}**`;
          const pr = (a, b, name) => (a !== undefined && isFinite(a) ? `${name} model ${v.fix(a, 1)} K / IAPWS ${isFinite(b) ? v.fix(b, 2) + ' K' : '—'}` : null);
          const parts = [pr(tm[0], realM, 'melting'), pr(tb[0], realB, 'boiling'), isFinite(realS) ? pr(tsub, realS, 'sublimation') : null].filter(Boolean).join(' · ');
          return `state ${v.fix(T, 1)} K, ${Pt}: **${PHNAME[ph]}** (IAPWS curves) · ${model}${P > 2.1e8 ? ' (the model knows only ice Ih)' : ''}${P > W.Pc ? ' · above $P_c$: the vapour crossing is a model artefact' : ''}\n${parts || 'no transition in this window'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Phenomenon', name: 'Latent heat',
      statement: String.raw`At a first-order phase transition a substance absorbs heat at **constant temperature** (and pressure) while it changes phase. The heat per unit mass, the **latent heat** $L$, equals the jump in enthalpy between the phases, $L = h_\beta - h_\alpha = T\,(s_\beta - s_\alpha)$, and is the same whether the transition is driven by heating or (in reverse) released on cooling. For water at 1 atm the latent heat of fusion is 333.4 kJ/kg at 0 °C and the latent heat of vaporization 2256 kJ/kg at 100 °C — enough to warm the same water from 0 to 100 °C five times over.`,
      idea: String.raw`At fixed pressure the heat added equals the change in enthalpy (1.14). While two phases coexist, the temperature is pinned to the coexistence value (4.4), so heat cannot raise $T$; instead it converts one phase into the other, and the enthalpy grows linearly with the converted fraction. Because the transition happens reversibly at a single temperature, $\Delta s = L/T$ (2.9). The size of $L$ measures the bonds broken: melting loosens the hydrogen-bond network only partly, boiling separates molecules completely, so $L_v \approx 7L_f$; water's entropy of vaporization, 109 J/(mol K), exceeds Trouton's typical 85–88 because liquid water is unusually ordered.`,
      caption: String.raw`1 kg of ice from −30 °C is heated at a steady rate (press play; the beaker shows the phases). The temperature rises while one phase is heated, then **stalls on two plateaus** whose lengths are the latent heats, measured from the curve in the readout and compared with IAPWS values. Heat capacities: ice from IAPWS R10-06, liquid and steam from IAPWS-95 (NIST). **Change the pressure**: on Everest's summit water boils near 71 °C and the boiling plateau is longer; in a pressure cooker it boils at 120 °C with a shorter one. The heater power only converts heat into time.`,
      deps: ['thermo-4.4', 'thermo-2.9'],
      see: ['thermo-1.14', 'thermo-4.6'],
      refs: ['Schroeder §5.3'],
      tags: ['latent heat', 'phase transitions'],
      credit: 'Joseph Black, 1761–1762',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Latent_heat' },
      viz(v) {
        const pres = v.select('pressure', [{ value: '101325', label: '1 atm' }, { value: '33700', label: 'Everest summit (≈ 34 kPa)' }, { value: '198500', label: 'pressure cooker (≈ 2 bar)' }], '101325');
        const pw = v.slider('heater power', 0.5, 5, 2, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' kW' });
        const sc = v.stage({ x: [0, 3300], y: [-35, 160], height: 350, axes: 'box', gutter: true, xlabel: 'heat added Q (kJ)', ylabel: 't (°C)', weight: 1.45, title: 'heating 1 kg of ice at a steady rate' });
        const sb = v.stage({ x: [0, 10], y: [0, 12], equal: true, height: 350, axes: false, weight: 0.55, minWidth: 190, title: 'the beaker' });
        const COL = { ice: PHASE.solid, melt: 'purple', liquid: PHASE.liquid, boil: 'red', steam: PHASE.gas };
        let st = null;
        v.animate((t) => {
          const P = +pres.value, H = heatingCurve(P);
          const Q = H.Qend * clamp(t / 10, 0, 1);
          sc.setView([0, H.Qend * 1.02], [-35, 160]);
          sc.path(H.pts.map((p) => [p[0], p[1]]), { color: 'faint', width: 1.6 });
          // traversed part, coloured by stage
          let run = [], stg = H.pts[0][2];
          const flush = () => run.length > 1 && sc.path(run, { color: COL[stg], width: 3.2 });
          for (let i = 0; i < H.pts.length; i++) {
            const p = H.pts[i]; if (p[0] > Q) break;
            if (p[2] !== stg) { const last = run[run.length - 1]; flush(); run = [last]; stg = p[2]; }
            run.push([p[0], p[1]]);
          }
          const tNow = interp(H.pts, 0, 1, Q), stage = Q <= H.melt0 ? 'ice' : Q < H.melt1 ? 'melt' : Q <= H.boil0 ? 'liquid' : Q < H.boil1 ? 'boil' : 'steam';
          if (run.length) { run.push([Q, tNow]); stg = stage === 'ice' ? 'ice' : stg; flush(); }
          sc.dot(Q, tNow, { r: 5.5, color: 'gold' });
          // plateau brackets
          sc.measure(H.melt0, 12, H.melt1, 12, `fusion ${v.fix(H.melt1 - H.melt0, 1)} kJ`, { math: false, color: 'purple', size: 11.5 });
          sc.measure(H.boil0, H.Tb - 16, H.boil1, H.Tb - 16, `vaporization ${v.fix(H.boil1 - H.boil0, 0)} kJ`, { math: false, color: 'red', size: 11.5 });
          sc.hline(H.Tb, { color: 'red', width: 1, dash: [3, 4] });
          sc.text(`boils at ${v.fix(H.Tb, 1)} °C`, H.Qend * 0.02, H.Tb, { dy: -9, size: 11, color: 'red', align: 'left', plate: true });
          // beaker
          const fIce = stage === 'ice' ? 1 : stage === 'melt' ? 1 - (Q - H.melt0) / (H.melt1 - H.melt0) : 0;
          const fVap = stage === 'boil' ? (Q - H.boil0) / (H.boil1 - H.boil0) : stage === 'steam' ? 1 : 0;
          const x0 = 1.5, x1 = 8.5, y0 = 1, top = 9.5;
          const liqH = 4.5 * (1 - fIce) * (1 - fVap);
          if (liqH > 0.02) sb.rect(x0, y0, x1, y0 + liqH, { fill: PHASE.liquid, fillAlpha: 0.45, stroke: false });
          // ice cubes
          const nC = Math.round(9 * fIce);
          for (let k = 0; k < nC; k++) { const cx = x0 + 0.6 + (k % 3) * 2.2, cy = y0 + 0.3 + Math.floor(k / 3) * 1.8; sb.rect(cx, cy, cx + 1.7, cy + 1.5, { fill: PHASE.solid, fillAlpha: 0.55, color: PHASE.solid, width: 1.2, radius: 3 }); }
          // bubbles and steam
          if (stage === 'boil' || stage === 'steam') {
            const R = v.rng(3);
            for (let k = 0; k < 26; k++) { const bx = x0 + 0.4 + R() * (x1 - x0 - 0.8), by = y0 + ((R() * 8 + t * 2.2 * (0.6 + R())) % 8) + 0.4; if (stage === 'steam' || by > y0 + liqH) sb.dot(bx, Math.min(by, top - 0.3), { r: 2.6, color: PHASE.gas, alpha: 0.7 }); else sb.dot(bx, by, { r: 2, color: 'panel', alpha: 0.9 }); }
          }
          sb.line(x0, y0, x0, top, { color: 'ink', width: 2.2 }); sb.line(x1, y0, x1, top, { color: 'ink', width: 2.2 }); sb.line(x0, y0, x1, y0, { color: 'ink', width: 2.2 });
          sb.rect(x0 - 0.6, y0 - 0.9, x1 + 0.6, y0 - 0.15, { fill: 'red', fillAlpha: 0.25 + 0.4 * (pw.value / 5), color: 'red', width: 1, radius: 3 });
          sb.text(`${v.fix(tNow, 1)} °C`, 5, 11, { size: 15, weight: 700, align: 'center', color: COL[stage] });
          sb.text({ ice: 'warming ice', melt: 'melting at 0 °C', liquid: 'warming water', boil: 'boiling', steam: 'warming steam' }[stage], 5, 10.1, { size: 11.5, align: 'center', color: 'ink' });
          // measure plateaus from the curve itself: stretches where the temperature does not change
          const flats = []; let f0 = null;
          for (let i = 1; i < H.pts.length; i++) { const flat = Math.abs(H.pts[i][1] - H.pts[i - 1][1]) < 1e-9 && H.pts[i][0] > H.pts[i - 1][0]; if (flat && f0 === null) f0 = H.pts[i - 1][0]; if (!flat && f0 !== null) { flats.push([f0, H.pts[i - 1][0], H.pts[i - 1][1]]); f0 = null; } }
          st = { Q, tNow, stage, H, flats, P };
        }, { period: 12, still: 7 });
        v.legend([[PHASE.solid, 'ice'], ['purple', 'melting plateau'], [PHASE.liquid, 'water'], ['red', 'boiling plateau'], [PHASE.gas, 'steam']]);
        v.readout(() => {
          if (!st) return '';
          const { Q, tNow, stage, H, flats, P } = st;
          const Lf = flats[0] ? flats[0][1] - flats[0][0] : NaN, Lv = flats[1] ? flats[1][1] - flats[1][0] : NaN, Tb = H.Tb + 273.15;
          return `$Q$ = ${v.fix(Q, 0)} kJ after ${v.fix(Q / pw.value / 60, 1)} min at ${v.fix(pw.value, 1)} kW · $t$ = ${v.fix(tNow, 2)} °C · plateaus measured on the curve: **${v.fix(Lf, 1)} kJ** at 0 °C (IAPWS $L_f$ = 333.4 kJ/kg) and **${v.fix(Lv, 0)} kJ** at ${v.fix(H.Tb, 2)} °C (IAPWS-95 $L_v$ there: ${v.fix(H.L, 1)} kJ/kg)\n$L_v/L_f$ = ${v.fix(Lv / Lf, 2)} · entropy of vaporization $L_vM/T_b$ = ${v.fix(Lv * 1e3 * W.M / Tb, 1)} J/(mol K) (Trouton's rule for ordinary liquids: 85–88) · warming the liquid 0 → ${v.fix(H.Tb, 0)} °C took ${v.fix(H.boil0 - H.melt1, 0)} kJ`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Theorem', name: 'Clausius–Clapeyron relation',
      statement: String.raw`Along a coexistence curve $P(T)$ between phases $\alpha$ and $\beta$ of a pure substance,
$$\frac{dP}{dT} = \frac{s_\beta - s_\alpha}{v_\beta - v_\alpha} = \frac{L}{T\,\Delta v},$$
where $L$ is the latent heat and $\Delta v$ the volume change of the transition (both per mole or both per kilogram). For liquid–vapour equilibrium far below the critical point, neglecting the liquid volume and treating the vapour as ideal ($\Delta v \approx RT/P$) gives the **Clausius–Clapeyron equation** $\dfrac{d\ln P}{dT} \approx \dfrac{L}{RT^2}$, which integrates (for constant $L$) to $\ln(P/P_0) = -\dfrac{L}{R}\left(\dfrac1T - \dfrac1{T_0}\right)$.`,
      idea: String.raw`On the curve $\mu_\alpha(T, P) = \mu_\beta(T, P)$ (4.4). Moving along it, $d\mu_\alpha = d\mu_\beta$, and by the Gibbs–Duhem relation (3.6) $d\mu = -s\,dT + v\,dP$ for each phase; subtracting gives $-\Delta s\,dT + \Delta v\,dP = 0$, and $\Delta s = L/T$ (4.5). The exact form is an identity among measurable quantities — any reliable data set must satisfy it. The approximate form fails as the critical point is approached: $L \to 0$ and $\Delta v \to 0$ together, the vapour stops being ideal and the liquid volume stops being negligible.`,
      caption: String.raw`Dots: the vapour pressure of water (IAPWS-95, NIST WebBook). **Drag the starting point** along the curve. From it, the exact relation $dP/dT = L/T\Delta v$ is integrated using only tabulated $L$ and $\Delta v$ (green); the approximate equation with ideal vapour and $L$ frozen at its starting value (orange) is integrated too. The right panel shows each curve's error against the data: the exact integral stays within a small fraction of a per cent all the way to the critical point; the approximation is good near the start and drifts by tens of per cent as $L$ shrinks. The readout checks the slope at the starting point both ways.`,
      deps: ['thermo-4.5', 'thermo-3.6'],
      see: ['pchem-4.4', 'thermo-4.7'],
      refs: ['Schroeder §5.3', 'Tong ch. 5'],
      tags: ['phase coexistence', 'vapour pressure'],
      credit: 'É. Clapeyron, 1834; R. Clausius, 1850',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clausius%E2%80%93Clapeyron_relation' },
      viz(v) {
        const approx = v.toggle('also integrate the approximate form (ideal vapour, constant L)', true);
        const sp = v.stage({ x: [273.16, 647.1], y: [400, 3e7], ylog: true, height: 350, axes: 'box', gutter: { l: 56 }, xlabel: 'T (K)', ylabel: 'P (Pa)', weight: 1.2, title: 'vapour pressure of water' });
        const se = v.stage({ x: [273.16, 647.1], y: [-40, 40], height: 350, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'error (%)', weight: 1, title: 'integrated curve against the data' });
        const h = sp.handle(373.15, psatW(373.15), { color: 'gold', label: 'start', constrain: (x) => { const T = clamp(x, 278, 640); return [T, psatW(T)]; } });
        const Rw = R / W.M;
        let st = null;
        v.render(() => {
          const T0 = h.x, P0 = psatW(T0), s0 = satW(T0);
          const exact = (T) => { const s = satW(T); return s.L / (T * s.dv); };          // dP/dT
          const integ = (f, dir) => { const out = [[T0, P0]]; let T = T0, P = P0; const hs = 0.5 * dir; while ((dir > 0 ? T < 646.5 : T > 273.4)) { const k1 = f(T, P), k2 = f(T + hs / 2, P + hs / 2 * k1), k3 = f(T + hs / 2, P + hs / 2 * k2), k4 = f(T + hs, P + hs * k3); P += hs / 6 * (k1 + 2 * k2 + 2 * k3 + k4); T += hs; out.push([T, P]); } return out; };
          const ex = [...integ((T) => exact(T), -1).reverse(), ...integ((T) => exact(T), 1).slice(1)];
          const ap = [...integ((T, P) => s0.L * P / (Rw * T * T), -1).reverse(), ...integ((T, P) => s0.L * P / (Rw * T * T), 1).slice(1)];
          sp.dots(WSAT.filter((r, i) => i % 2 === 0).map((r) => [r[0], r[1] * MPA]), { r: 3, color: 'ink', alpha: 0.75 });
          sp.path(ex, { color: 'green', width: 2.6 });
          if (approx.value) sp.path(ap, { color: 'orange', width: 2.2, dash: [7, 4] });
          sp.dot(W.Tc, W.Pc, { r: 5, color: 'red' }); sp.text('critical point', W.Tc, W.Pc, { dx: -10, dy: 12, size: 11, color: 'red', align: 'right' });
          sp.dot(W.Tt, W.Pt, { r: 5, color: 'red' }); sp.text('triple point', W.Tt, W.Pt, { dx: 8, dy: 4, size: 11, color: 'red', align: 'left' });
          // errors at the table temperatures
          const err = (path) => WSAT.map((r) => { const P = interp(path, 0, 1, r[0]); return [r[0], 100 * (P / (r[1] * MPA) - 1)]; });
          const eEx = err(ex), eAp = err(ap);
          se.hline(0, { color: 'muted', width: 1 });
          se.path(eEx, { color: 'green', width: 2.6 }); se.dots(eEx.filter((_, i) => i % 3 === 0), { r: 2.6, color: 'green' });
          if (approx.value) se.path(eAp, { color: 'orange', width: 2.2, dash: [7, 4] });
          se.vline(T0, { color: 'gold', width: 1.2 });
          const errAt = (path, T) => 100 * (interp(path, 0, 1, T) / psatW(T) - 1);
          const slopeData = (psatW(T0 + 0.01) - psatW(T0 - 0.01)) / 0.02;
          const mxEx = Math.max(...eEx.filter((e) => e[0] < 645).map((e) => Math.abs(e[1])));
          st = { T0, P0, s0, slopeData, slopeCC: exact(T0), slopeApprox: s0.L * P0 / (Rw * T0 * T0), e0: errAt(ex, 273.4), a0: errAt(ap, 273.4), e300: errAt(ex, 573.15), a300: errAt(ap, 573.15), mxEx, aTc: eAp[eAp.length - 1][1] };
        });
        v.legend([['ink', 'IAPWS-95 data', { dot: true }], ['green', 'exact: $dP/dT = L/T\\Delta v$'], ['orange', 'ideal vapour, constant $L$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T0, P0, s0, slopeData, slopeCC, slopeApprox, e0, a0, e300, a300, mxEx, aTc } = st;
          return `start ${v.fix(T0, 1)} K, ${v.fix(P0 / 1e3, 2)} kPa: $L$ = ${v.fix(s0.L / 1e3, 1)} kJ/kg, $\\Delta v$ = ${v.fix(s0.dv, 4)} m³/kg · slope of the data **${v.fix(slopeData, 2)} Pa/K**, $L/T\\Delta v$ = **${v.fix(slopeCC, 2)} Pa/K** (ratio ${v.fix(slopeCC / slopeData, 4)}), ideal-vapour estimate $LP/R_wT^2$ = ${v.fix(slopeApprox, 2)} Pa/K\nerror of the integrated curves near 0 °C: exact ${v.fix(e0, 3)} %${approx.value ? `, approximate ${v.fix(a0, 1)} %` : ''}; at 300 °C: exact ${v.fix(e300, 3)} %${approx.value ? `, approximate ${v.fix(a300, 1)} %` : ''} · largest error of the exact integral below 645 K: ${v.fix(mxEx, 3)} %${approx.value ? ` · approximation at the critical end: ${v.fix(aTc, 0)} %` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Phenomenon', name: 'Water’s backward-sloping melting curve',
      statement: String.raw`Ice Ih is about 9 % less dense than liquid water (916.7 against 999.8 kg/m³ at 0 °C), so melting *decreases* the volume, $\Delta v < 0$, while it absorbs latent heat, $L > 0$. By the Clapeyron relation (4.6) the melting curve therefore has negative slope: near 0 °C, $dP/dT = L/(T\Delta v) \approx -13.5$ MPa/K, so raising the pressure lowers the melting point by about 0.0074 K per bar. Melting ice at −1 °C takes about 13 MPa (roughly 130 atm); the melting curve of ice Ih continues down to the triple point with ice III at −22 °C and 209 MPa. Most substances, whose solid is denser than the liquid, have forward-sloping melting curves.`,
      idea: String.raw`The hydrogen-bonded tetrahedral network of ice Ih is open; melting partly collapses it, so liquid water packs more densely. Squeezing favours the denser phase — the liquid — because raising $P$ raises each phase's chemical potential by $v\,\Delta P$, more for ice. Hence at higher pressure ice must be colder to stay solid. The pressure needed is large: a 70 kg skater on a flat blade exerts only a few MPa, lowering the melting point by a few hundredths of a kelvin, so pressure melting cannot explain the slipperiness of ice at −10 °C (frictional heating and a premelted surface layer do).`,
      caption: String.raw`The melting curve of ice Ih from IAPWS R14-08 (teal) and the straight Clapeyron line through the normal melting point (gold, slope $L/T\Delta v$ computed from IAPWS densities and latent heat). **Drag the state point** to see which phase is stable. Set a **skater's mass and blade contact**: the horizontal line is the pressure under the blade, and its crossing with the melting curve is the melting temperature there. Flip **"ice denser than water"** — a hypothetical with the volume change reversed — and the Clapeyron line tilts the other way, as for almost every other substance.`,
      deps: ['thermo-4.6'],
      see: ['thermo-4.4'],
      refs: ['Schroeder §5.3'],
      tags: ['phase coexistence', 'water'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ice_skating#Physics' },
      viz(v) {
        const mass = v.slider('skater mass', 30, 120, 70, { step: 1, fmt: (x) => x + ' kg' });
        const contact = v.select('blade contact', [{ value: '30x3', label: 'flat blade 30 cm × 3 mm' }, { value: '30x0.5', label: 'edge 30 cm × 0.5 mm' }, { value: '3x0.5', label: 'rocked edge 3 cm × 0.5 mm' }], '30x3');
        const flip = v.toggle('hypothetical: ice denser than water', false);
        const sp = v.stage({ x: [-25, 2], y: [0, 230], height: 360, axes: 'box', gutter: true, xlabel: 't (°C)', ylabel: 'P (MPa)', weight: 1.4, title: 'melting curve of ice Ih' });
        const sv = v.stage({ x: [-0.7, 1.7], y: [0.9, 1.12], height: 360, axes: 'box', gutter: true, ylabel: 'specific volume (cm³/g)', weight: 0.6, minWidth: 190, title: 'why it tilts', xticks: [[0, 'ice'], [1, 'water']] });
        const h = sp.handle(-8, 60, { color: 'gold', label: 'state', constrain: { x: [-24.5, 1.5], y: [2, 225] } });
        const vI = 1 / W.rhoIce, vL = 1 / W.rhoLiq, Tm = W.Tm;
        const ice = tint(v, PHASE.solid, 0.18), liq = tint(v, PHASE.liquid, 0.18);
        let st = null;
        v.render(() => {
          const dv = flip.value ? -(vI - vL) : vL - vI, slope = W.Lf / (Tm * dv) / MPA;   // MPa/K
          sp.raster((t, P) => { const T = t + 273.15; if (T < 251.165) return ice; return P * MPA < pmeltIh(T) ? ice : liq; }, { res: 3, key: 'm7' + v.color('panel') });
          sp.curve((u) => { const T = lerp(251.165, 273.16, u); return [T - 273.15, pmeltIh(T) / MPA]; }, 0, 1, { color: PHASE.liquid, width: 3, n: 120 });
          sp.fn((t) => 0.101325 + slope * (t - (Tm - 273.15)), { color: flip.value ? 'red' : 'gold', width: 2, dash: [7, 4] });
          sp.dot(251.165 - 273.15, 208.566, { r: 4.5, color: 'ink', hollow: true }); sp.text('ice III begins', 251.165 - 273.15, 208.566, { dx: 12, dy: 2, size: 11, color: 'ink', align: 'left', plate: true });
          sp.text('ice Ih', -20, 40, { size: 14, weight: 700, color: PHASE.solid });
          sp.text('liquid water', -4, 170, { size: 14, weight: 700, color: PHASE.liquid });
          // skater
          const [Lc, wc] = contact.value.split('x').map(Number), A = Lc * 1e-2 * wc * 1e-3, Psk = mass.value * 9.81 / A / MPA;
          const tSk = bisect((T) => pmeltIh(T) - (Psk * MPA + 101325), 251.2, 273.16) - 273.15;
          sp.hline(Psk, { color: 'purple', width: 1.8 });
          sp.text(`skater: ${v.fix(Psk, 2)} MPa`, -24.5, Psk, { dy: -9, size: 11, color: 'purple', align: 'left', plate: true });
          if (Psk < 230) sp.dot(tSk, Psk, { r: 4.5, color: 'purple' });
          // state
          const T = h.x + 273.15, P = h.y * MPA, phase = T < 251.165 || P < pmeltIh(T) ? 'ice Ih' : 'liquid';
          // volumes panel
          const vi = flip.value ? vL - (vI - vL) : vI;
          bar(sv, 0, vi * 1e3, 0.3, PHASE.solid, { base: 0.9 }); bar(sv, 1, vL * 1e3, 0.3, PHASE.liquid, { base: 0.9 });
          sv.text(v.fix(vi * 1e3, 4), 0, vi * 1e3, { dy: -9, size: 11, align: 'center' }); sv.text(v.fix(vL * 1e3, 4), 1, vL * 1e3, { dy: -9, size: 11, align: 'center' });
          sv.arrow(0.35, vi * 1e3, 0.65, vL * 1e3, { color: dv < 0 ? 'green' : 'red', width: 2, head: 8 });
          sv.text(`Δv ${dv < 0 ? '< 0' : '> 0'}`, 0.5, (vi + vL) / 2 * 1e3, { dx: 6, dy: -6, size: 11.5, weight: 650, color: dv < 0 ? 'green' : 'red', align: 'left' });
          const p1 = pmeltIh(272.15) / MPA, p200 = bisect((T_) => pmeltIh(T_) - 200e6, 251.2, 273.16) - 273.15;
          st = { slope, slope0: W.Lf / (Tm * (vL - vI)) / MPA, Psk, tSk, phase, T, P, p1, p200 };
        });
        v.legend([[PHASE.liquid, 'IAPWS melting curve'], ['gold', 'Clapeyron line $L/T\\Delta v$', { dash: true }], ['purple', 'pressure under the blade']]);
        v.readout(() => {
          if (!st) return '';
          const { slope, Psk, tSk, phase, T, P, p1, p200 } = st;
          return `Clapeyron slope at 0 °C: $L/T\\Delta v$ = **${v.fix(slope, 2)} MPa/K** (${v.fix(slope * 10, 1)} bar/K)${flip.value ? ' — hypothetical sign' : ''} · IAPWS: ice at −1 °C melts at ${v.fix(p1, 2)} MPa = ${v.fix(p1 * 1e6 / 101325, 0)} atm; at 200 MPa the melting point is ${v.fix(p200, 2)} °C (the straight line predicts ${v.fix(-200 / Math.abs(st.slope0), 2)} °C)\nskater ${mass.value} kg: ${v.fix(Psk, 2)} MPa under the blade → melting point ${v.fix(tSk, 3)} °C (rink ice is kept several degrees below 0 °C) · state ${v.fix(T - 273.15, 1)} °C, ${v.fix(P / MPA, 1)} MPa: **${phase}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Theorem', name: 'Gibbs phase rule',
      statement: String.raw`In a system of $C$ chemical components distributed among $P$ coexisting phases in equilibrium (no chemical reactions among the components), the number of intensive variables that can be varied independently without changing the number of phases is
$$F = C - P + 2.$$
For a pure substance ($C = 1$) single-phase states fill regions of the $(T, P)$ plane ($F = 2$), two-phase coexistence occupies curves ($F = 1$) and three phases meet only at isolated triple points ($F = 0$); four phases of one component cannot coexist. For a binary mixture at fixed pressure the count drops by one: two coexisting phases leave only $F' = 1$, so temperature alone fixes both phase compositions.`,
      idea: String.raw`Count unknowns and equations. Each phase is described by $T$, $P$ and $C - 1$ independent mole fractions; temperature and pressure are common to all phases in equilibrium (3.4), leaving $2 + P(C - 1)$ unknowns. Equilibrium for transfer of each component between each pair of phases demands equal chemical potentials, $\mu_i^{(1)} = \mu_i^{(2)} = \dots = \mu_i^{(P)}$: $C(P - 1)$ equations. The difference is $F = C - P + 2$. The Gibbs–Duhem relation (3.6) is what makes $T$, $P$ and the compositions a complete set: the chemical potentials of each phase are functions of them.`,
      caption: String.raw`**Pick a system.** For water, drag the state point over the IAPWS phase diagram: it **snaps** onto coexistence curves and triple points, and the counting panel shows the unknowns (squares) and equilibrium conditions (crossed) that leave $F$ free variables — 2 in a region, 1 on a curve, 0 at a triple point. For benzene + toluene, the temperature–composition diagram at the pressure you set follows from Raoult's law with NIST vapour pressures; inside the two-phase lens the tie line joins the liquid (bubble line) and vapour (dew line) compositions, and the lever rule gives how much of each phase is present.`,
      deps: ['thermo-3.6', 'thermo-4.4'],
      see: ['pchem-6.1', 'thermo-4.12'],
      refs: ['Callen ch. 9'],
      tags: ['phase rule', 'phase diagram'],
      credit: 'J. W. Gibbs, 1875–1878',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phase_rule' },
      viz(v) {
        const sys = v.select('system', [{ value: 'w', label: 'water (C = 1)' }, { value: 'bt', label: 'benzene + toluene (C = 2)' }], 'w', { onChange: () => { if (sys.value === 'w') h.set(330, 3e4); else h.set(0.4, 368); } });
        const Pb = v.slider('pressure (binary)', 0.5, 1.5, 1.01325, { step: 0.005, fmt: (x) => v.fix(x, 3) + ' bar' });
        const s = v.stage({ x: [190, 700], y: [0.1, 3e9], ylog: true, height: 380, axes: 'box', gutter: { l: 64 }, xlabel: 'T (K)', ylabel: 'P', yticks: PT_TICKS.concat([[1e9, '1 GPa']]), weight: 1.25, title: 'phase diagram' });
        const sc = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: false, weight: 0.85, minWidth: 230, title: 'counting: unknowns − conditions' });
        const A = ANTOINE.benzene, B = ANTOINE.toluene;
        // binary helpers at pressure P (Pa)
        const xBub = (T, P) => (P - pAnt(B, T)) / (pAnt(A, T) - pAnt(B, T));
        const yDew = (T, P) => xBub(T, P) * pAnt(A, T) / P;
        const tBub = (x, P) => bisect((T) => x * pAnt(A, T) + (1 - x) * pAnt(B, T) - P, 300, 420);
        const tDew = (y, P) => bisect((T) => y * P / pAnt(A, T) + (1 - y) * P / pAnt(B, T) - 1, 300, 420);
        let snapInfo = { n: 1, what: '' };
        const snapW = (x, y) => {
          const X = s.X(x), Y = s.Y(y), near = (T, P, r) => Math.hypot(s.X(T) - X, s.Y(P) - Y) < r;
          const tps = [['triple point ice Ih – liquid – vapour', W.Tt, W.Pt], ...ICE_TRIPLES.filter((q) => q[2] < 3e9).map(([n, T, P]) => [`triple point ${n.replace('–', ' – ')} ice – liquid`, T, P])];
          for (const [n, T, P] of tps) if (near(T, P, 14)) { snapInfo = { n: 3, what: n }; return [T, P]; }
          const cand = [];
          if (x > W.Tt && x < W.Tc) cand.push(['liquid – vapour curve', x, psatW(x)]);
          if (x < W.Tt && x > 190) cand.push(['sublimation curve (ice – vapour)', x, psublW(x)]);
          if (y > W.Pt && y < 208.566e6) { const T = bisect((T_) => pmeltIh(T_) - y, 251.165, 273.16); cand.push(['melting curve (ice Ih – liquid)', T, y]); }
          if (x > 273.31 && x < 700 && pmeltW(x) < 3e9) cand.push(['melting curve (high-pressure ice – liquid)', x, pmeltW(x)]);
          let best = null, bd = 11;
          for (const c of cand) { const d = Math.hypot(s.X(c[1]) - X, s.Y(c[2]) - Y); if (d < bd) { bd = d; best = c; } }
          if (best) { snapInfo = { n: 2, what: best[0] }; return [best[1], best[2]]; }
          snapInfo = { n: 1, what: PHNAME[waterPhase(x, y)] };
          return [x, y];
        };
        const h = s.handle(330, 3e4, { color: 'gold', label: 'state', constrain: (x, y) => (sys.value === 'w' ? snapW(clamp(x, 195, 695), clamp(y, 0.15, 2.8e9)) : [clamp(x, 0.002, 0.998), clamp(y, 341, 397)]) });
        let st = null;
        v.render(() => {
          const water = sys.value === 'w';
          Pb.el.hidden = water;
          let C = 1, Pn = 1, info = '', lever = null;
          if (water) {
            s.setScale({ xlog: false, ylog: true, x: [190, 700], y: [0.1, 3e9] }); s.setLabels('T (K)', 'P'); s.setTicks(null, PT_TICKS.concat([[1e9, '1 GPa']])); s.setTitle('water: one component');
            if (h.x < 2) h.set(330, 3e4);
            snapW(h.x, h.y);
            drawWaterPT(v, s, { labels: true });
            Pn = snapInfo.n; info = snapInfo.what;
            if (Pn === 2) s.dot(h.x, h.y, { r: 9, color: 'green', hollow: true });
            if (Pn === 3) s.dot(h.x, h.y, { r: 12, color: 'green', hollow: true });
          } else {
            C = 2;
            const P = Pb.value * BAR;
            const TA = tAnt(A, P), TB = tAnt(B, P);
            s.setScale({ xlog: false, ylog: false, x: [0, 1], y: [341, 397] }); s.setLabels('mole fraction of benzene', 'T (K)'); s.setTicks(null, null); s.setTitle(`benzene + toluene at ${v.fix(Pb.value, 3)} bar (Raoult's law)`);
            if (h.x > 2) h.set(0.4, 368);
            const liq = tint(v, PHASE.liquid, 0.2), gas = tint(v, PHASE.gas, 0.2), two = tint(v, 'gold', 0.16);
            s.raster((x, T) => { if (T < TA) return liq; if (T > TB) return gas; const xb = xBub(T, P), yd = yDew(T, P); return x < xb && x > yd ? two : x >= xb ? liq : gas; }, { res: 3, key: 'bt' + Pb.value + v.color('panel') });
            s.curve((x) => [x, tBub(x, P)], 0, 1, { color: PHASE.liquid, width: 2.6, n: 80 });
            s.curve((y) => [y, tDew(y, P)], 0, 1, { color: PHASE.gas, width: 2.6, n: 80 });
            s.text('liquid', 0.82, TA - 5 + (TB - TA) * 0.0, { size: 13, weight: 700, color: PHASE.liquid, align: 'center' });
            s.text('vapour', 0.2, TB + 4, { size: 13, weight: 700, color: PHASE.gas, align: 'center' });
            s.text('bubble line', 0.62, tBub(0.62, P), { dx: 6, dy: 12, size: 11, color: PHASE.liquid, align: 'left', plate: true });
            s.text('dew line', 0.4, tDew(0.4, P), { dx: 6, dy: -10, size: 11, color: PHASE.gas, align: 'left', plate: true });
            s.dot(1, TA, { r: 4, color: 'ink' }); s.dot(0, TB, { r: 4, color: 'ink' });
            s.text(`benzene boils ${v.fix(TA, 1)} K`, 1, TA, { dx: -8, dy: 12, size: 10.5, align: 'right', color: 'ink' });
            s.text(`toluene ${v.fix(TB, 1)} K`, 0, TB, { dx: 8, dy: -10, size: 10.5, align: 'left', color: 'ink' });
            const z = h.x, T = h.y;
            if (T > TA && T < TB) {
              const xb = xBub(T, P), yd = yDew(T, P);
              if (z > yd && z < xb) {
                Pn = 2;
                s.line(yd, T, xb, T, { color: 'green', width: 2.6 });
                s.dot(yd, T, { r: 5, color: PHASE.gas }); s.dot(xb, T, { r: 5, color: PHASE.liquid });
                const fl = (z - yd) / (xb - yd);
                lever = { xb, yd, fl };
                s.text(`liquid x = ${v.fix(xb, 3)}`, xb, T, { dx: 8, dy: 12, size: 11, color: PHASE.liquid, align: 'left', plate: true });
                s.text(`vapour y = ${v.fix(yd, 3)}`, yd, T, { dx: -8, dy: -11, size: 11, color: PHASE.gas, align: 'right', plate: true });
                info = 'liquid + vapour (tie line)';
              } else info = z >= xb ? 'liquid' : 'vapour';
            } else info = T <= TA ? 'liquid' : 'vapour';
          }
          // counting panel
          const unk = 2 + Pn * (C - 1), eq = C * (Pn - 1), F = C - Pn + 2;
          const box = (x, y, lab, col, crossed) => { sc.rect(x, y, x + 1.25, y + 1.0, { fill: col, fillAlpha: 0.22, color: col, width: 1.4, radius: 4 }); sc.text(lab, x + 0.62, y + 0.5, { size: 11.5, align: 'center', color: 'ink', weight: 650 }); if (crossed) { sc.line(x + 0.1, y + 0.1, x + 1.15, y + 0.9, { color: 'red', width: 2 }); } };
          sc.text(`C = ${C} component${C > 1 ? 's' : ''}, P = ${Pn} phase${Pn > 1 ? 's' : ''}`, 5, 9.4, { size: 13, weight: 700, align: 'center' });
          sc.text('unknowns: T, P and C − 1 mole fractions per phase', 0.2, 8.4, { size: 11, color: 'muted', align: 'left' });
          const labs = ['T', 'P']; for (let p = 1; p <= Pn; p++) for (let c = 1; c < C; c++) labs.push(`x${p}`);
          labs.forEach((l, i) => box(0.3 + (i % 6) * 1.55, 6.9 - Math.floor(i / 6) * 1.25, l, i >= unk - eq ? 'muted' : 'green', i >= unk - eq));
          sc.text('conditions: μᵢ equal in every phase', 0.2, 5.0, { size: 11, color: 'muted', align: 'left' });
          for (let i = 0; i < eq; i++) box(0.3 + (i % 6) * 1.55, 3.5 - Math.floor(i / 6) * 1.25, `μ${C > 1 ? (i % C) + 1 : ''}`, 'red', false);
          if (!eq) sc.text('none (one phase)', 0.4, 4.0, { size: 11.5, color: 'muted', align: 'left' });
          sc.text(`F = C − P + 2 = ${unk} − ${eq} = ${F}`, 5, 1.1, { size: 15, weight: 700, align: 'center', color: F > 0 ? 'green' : 'red' });
          st = { water, C, Pn, F, info, lever };
        });
        v.readout(() => {
          if (!st) return '';
          const { water, C, Pn, F, info, lever } = st;
          const meaning = water ? (F === 2 ? 'both T and P can be changed freely: a region' : F === 1 ? 'choosing T fixes P: a curve' : 'T and P both fixed: an isolated point') : (Pn === 2 ? 'at fixed pressure F − 1 = 1: temperature alone fixes both compositions (the ends of the tie line)' : 'at fixed pressure F − 1 = 2: temperature and composition are both free');
          const lv = lever ? ` · lever rule: liquid fraction $(z - y)/(x - y)$ = **${v.fix(lever.fl, 3)}**, vapour ${v.fix(1 - lever.fl, 3)}` : '';
          return `**${info}** · $F = C - P + 2$ = ${C} − ${Pn} + 2 = **${F}**: ${meaning}${lv}${water ? '' : `\nRaoult's law $p_i = x_i\\,p_i^*(T)$ with Antoine vapour pressures (NIST): the mixture is nearly ideal, so the lens is accurate to a few tenths of a kelvin`}`;
        });
      },
    },
  ],
};
