// Physical Chemistry — Chapter 2: The first law and thermochemistry (part b: 2.6–2.10)
import { R } from './ch02.shared.js';

// ---- model heat capacities (in units of R) -------------------------------------------------------------
const vibCv = (th, T) => { const x = th / T; if (x > 60) return 0; const e = Math.exp(-x); return x * x * e / ((1 - e) * (1 - e)); };
const rotCvLinear = (th, T) => {                // exact sum over J of (2J+1) e^{-θJ(J+1)/T}; classical limit when T ≫ θ
  if (T / th > 150) return 1;
  const Jm = Math.min(500, Math.ceil(8 * Math.sqrt(T / th)) + 12);
  let Z = 0, E = 0, E2 = 0;
  for (let J = 0; J <= Jm; J++) { const e = th * J * (J + 1), w = (2 * J + 1) * Math.exp(-e / T); Z += w; E += w * e; E2 += w * e * e; }
  E /= Z; E2 /= Z; return (E2 - E * E) / (T * T);
};
const MOLS = {
  He: { name: 'He', tex: '\\mathrm{He}', rot: 'none', vib: [], real: 1.50, nm: 'helium' },
  H2: { name: 'H₂', tex: '\\mathrm{H_2}', rot: 87.6, vib: [6332], real: 2.47, nm: 'hydrogen' },
  N2: { name: 'N₂', tex: '\\mathrm{N_2}', rot: 2.88, vib: [3374], real: 2.50, nm: 'nitrogen' },
  CO2: { name: 'CO₂', tex: '\\mathrm{CO_2}', rot: 0.561, vib: [960, 960, 1997, 3380], real: 3.46, nm: 'carbon dioxide' },
  H2O: { name: 'H₂O', tex: '\\mathrm{H_2O}', rot: 'nonlinear', vib: [2295, 5262, 5404], real: 3.04, nm: 'water vapour' },
};
const parts = (m, T) => ({
  tr: 1.5,
  rot: m.rot === 'none' ? 0 : m.rot === 'nonlinear' ? 1.5 : rotCvLinear(m.rot, T),
  vib: m.vib.reduce((s, th) => s + vibCv(th, T), 0),
});
const classical = (m) => 1.5 + (m.rot === 'none' ? 0 : m.rot === 'nonlinear' ? 1.5 : 1) + m.vib.length;

// ---- bomb calorimeter simulation --------------------------------------------------------------------------
const CCAL = 10.20, TJ = 25.0, T_START = 24.0, T_IGN = 10, T_END = 30, TAU = 0.4, STIR = 0.0015;   // kJ/K, °C, °C, min, min, min, K/min
function bomb(Q, kl, seed) {
  const dt = 0.01, n = Math.round(T_END / dt), rng = seed ? seed : null;
  const ts = [], Ts = [];
  let T = T_START;
  for (let i = 0; i <= n; i++) {
    const t = i * dt;
    ts.push(t); Ts.push(T + (rng ? 0.0012 * rng.normal() : 0));
    const rate = t >= T_IGN ? Q / TAU * Math.exp(-(t - T_IGN) / TAU) : 0;
    T += dt * (rate / CCAL - kl * (T - TJ) + STIR);
  }
  return { ts, Ts };
}
function fitLine(ts, Ts, a, b) { const xs = [], ys = []; ts.forEach((t, i) => { if (t >= a && t <= b) { xs.push(t); ys.push(Ts[i]); } }); const n = xs.length; const mx = xs.reduce((s, x) => s + x) / n, my = ys.reduce((s, y) => s + y) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const m = sxy / sxx; return { m, c: my - m * mx }; }
function analyse(sim) {
  const f = fitLine(sim.ts, sim.Ts, 1, T_IGN - 0.5), a = fitLine(sim.ts, sim.Ts, T_IGN + 7, T_END - 0.5);
  const fore = (t) => f.m * t + f.c, aft = (t) => a.m * t + a.c;
  const dt = sim.ts[1] - sim.ts[0], i0 = Math.round(T_IGN / dt), i1 = Math.round((T_IGN + 6) / dt);
  // equal-area time: ∫(T − fore) over [ign, t*] = ∫(aft − T) over [t*, ign+6]
  let best = T_IGN, bd = Infinity;
  for (let k = i0; k <= i1; k++) {
    let A1 = 0, A2 = 0;
    for (let i = i0; i < k; i++) A1 += (sim.Ts[i] - fore(sim.ts[i])) * dt;
    for (let i = k; i < i1; i++) A2 += (aft(sim.ts[i]) - sim.Ts[i]) * dt;
    if (Math.abs(A1 - A2) < bd) { bd = Math.abs(A1 - A2); best = sim.ts[k]; }
  }
  return { fore, aft, tEq: best, f, a };
}
const SAMPLES = {
  benz: { name: 'benzoic acid', M: 122.12, u: 26.43, dn: -0.5, tex: '\\mathrm{C_6H_5COOH}' },
  naph: { name: 'naphthalene', M: 128.17, u: 40.21, dn: -2, tex: '\\mathrm{C_{10}H_8}' },
  sucr: { name: 'sucrose', M: 342.30, u: 16.48, dn: 0, tex: '\\mathrm{C_{12}H_{22}O_{11}}' },
  gluc: { name: 'glucose', M: 180.16, u: 15.56, dn: 0, tex: '\\mathrm{C_6H_{12}O_6}' },
};

// ---- formation enthalpies for 2.10 ------------------------------------------------------------------------------
const F = {
  CH4: [-74.81, 'CH_4(g)'], O2: [0, 'O_2(g)'], CO2: [-393.51, 'CO_2(g)'], H2O: [-285.83, 'H_2O(l)'], EtOH: [-277.69, 'C_2H_5OH(l)'],
  N2: [0, 'N_2(g)'], NO: [90.25, 'NO(g)'], H2: [0, 'H_2(g)'], NH3: [-46.11, 'NH_3(g)'], CaCO3: [-1206.9, 'CaCO_3(s)'], CaO: [-635.09, 'CaO(s)'],
  Al: [0, 'Al(s)'], Fe2O3: [-824.2, 'Fe_2O_3(s)'], Al2O3: [-1675.7, 'Al_2O_3(s)'], Fe: [0, 'Fe(s)'], C6H6: [49.0, 'C_6H_6(l)'],
};
const RXNS = {
  CH4: { name: 'burn methane', R: [[1, 'CH4'], [2, 'O2']], P: [[1, 'CO2'], [2, 'H2O']] },
  EtOH: { name: 'burn ethanol', R: [[1, 'EtOH'], [3, 'O2']], P: [[2, 'CO2'], [3, 'H2O']] },
  C6H6: { name: 'burn benzene', R: [[1, 'C6H6'], [15, 'O2']], P: [[12, 'CO2'], [6, 'H2O']] },
  NO: { name: 'make nitric oxide', R: [[1, 'N2'], [1, 'O2']], P: [[2, 'NO']] },
  NH3: { name: 'Haber synthesis', R: [[1, 'N2'], [3, 'H2']], P: [[2, 'NH3']] },
  CaCO3: { name: 'lime burning', R: [[1, 'CaCO3']], P: [[1, 'CaO'], [1, 'CO2']] },
  therm: { name: 'thermite', R: [[1, 'Fe2O3'], [2, 'Al']], P: [[1, 'Al2O3'], [2, 'Fe']] },
};

export default {
  collection: 'pchem',
  chapter: 2,
  items: [
    {
      num: '2.6', kind: 'Theorem', name: 'Equipartition and gas heat capacities',
      statement: String.raw`In classical statistical mechanics, a molecule in thermal equilibrium at temperature $T$ carries, on average, $\tfrac12 k_BT$ of energy for every quadratic term in its energy (every quadratic kinetic or potential contribution). The molar constant-volume heat capacity of a gas is therefore $C_{V,m} = \tfrac12 R\, f$, where $f$ counts the quadratic terms: 3 for translation, 2 for rotation of a linear molecule (3 if non-linear), and 2 for each vibrational mode (one kinetic, one potential). The theorem is exact only when $k_BT$ is large compared with the spacing of the corresponding quantum levels; a degree of freedom with level spacing $\gg k_BT$ is *frozen out* and contributes nothing.`,
      idea: String.raw`The Boltzmann factor weights each state by $e^{-E/k_BT}$; for an energy $E = \tfrac12 a x^2$ the Gaussian integral gives $\langle E\rangle = \tfrac12 k_BT$ regardless of $a$ (pchem-2.5 turns energy per mole into $C_V$; pchem-1.6 supplies the kinetic model of translational energy; thermo-6.12 is the general statement). For quantized motion the mean energy is a sum over levels instead, and a sum over widely spaced levels is dominated by the ground state until $k_BT$ is comparable to the spacing. Rotational spacings are a few kelvin for heavy molecules, so rotation is classical at room temperature, while vibrational spacings are thousands of kelvin, which is why the vibrational contribution is still switching on at 300 K for CO₂ and not yet for N₂.`,
      caption: String.raw`Choose a molecule and slide the temperature. Left: $C_V/R$ against $T$ (log axis); the dashed line is the equipartition ceiling and the staircase is a rigid-rotor / harmonic-oscillator model with spectroscopic characteristic temperatures. The dots mark $C_V$ at 298 K derived from tabulated $C_p$. Right: how much each kind of motion contributes at the chosen $T$ compared with the equipartition count.`,
      deps: ['pchem-2.5', 'pchem-1.6', 'thermo-6.12'],
      refs: ['M–S ch. 19'],
      tags: ['equipartition', 'heat capacity', 'quantum'],
      credit: 'Waterston, 1845; Maxwell, 1860; Boltzmann, 1868',
      scope: String.raw`Ideal gases at low density. Rotational and vibrational contributions are modelled by an exact rigid-rotor sum and harmonic oscillators; the rotor sum ignores nuclear-spin statistics, which is not accurate for H₂ below about 200 K, and the characteristic temperatures are rounded values from memory of spectroscopic tables.`,
      viz(v) {
        const sel = v.select('molecule', Object.keys(MOLS).map((k) => ({ value: k, label: `$${MOLS[k].tex}$` })), 'N2');
        const Ts = v.slider('temperature $T$', 10, 5000, 300, { log: true, fmt: (x) => `${x.toFixed(0)} K` });
        const sc = v.stage({ x: [10, 5000], y: [0, 7], xlog: true, axes: 'box', gutter: true, xlabel: 'T / K', ylabel: 'C_V,m / R', height: 350, title: 'heat capacity against temperature' });
        const sb = v.stage({ x: [0, 3], y: [0, 7], axes: 'box', gutter: true, ylabel: 'C_V,m / R', height: 350, title: 'what is switched on at this T', xticks: [[0.9, 'equipartition'], [2.1, 'model']] });
        v.render(() => {
          const m = MOLS[sel.value], T = Ts.value, cl = classical(m);
          const f = (key) => (x) => key === 'tot' ? (() => { const p = parts(m, x); return p.tr + p.rot + p.vib; })() : parts(m, x)[key];
          sc.hline(cl, { color: 'muted', dash: true, width: 1.5 });
          sc.hline(1.5, { color: 'teal', width: 1.2, alpha: 0.7 });
          sc.fn(f('rot'), { color: 'orange', width: 2, domain: [10, 5000], n: 200 });
          sc.fn(f('vib'), { color: 'red', width: 2, domain: [10, 5000], n: 200 });
          sc.fn(f('tot'), { color: 'ink', width: 3, domain: [10, 5000], n: 200 });
          sc.vline(T, { color: 'gold', width: 2 });
          const p = parts(m, T);
          sc.dot(T, p.tr + p.rot + p.vib, { r: 6, color: 'gold' });
          sc.dot(298.15, m.real, { r: 5, color: 'green', hollow: true });
          sc.text('measured at 298 K', 298.15, m.real, { size: 11, color: 'green', dy: 16 });
          sc.text('equipartition ceiling', 12, cl, { size: 11, color: 'muted', align: 'left', dy: -9 });
          // stacked bars
          const stack = (x0, vals) => { let y = 0; [['teal', vals.tr], ['orange', vals.rot], ['red', vals.vib]].forEach(([c, h]) => { if (h > 1e-4) sb.rect(x0 - 0.4, y, x0 + 0.4, y + h, { fill: c, fillAlpha: 0.7, color: c }); y += h; }); };
          const rotCl = m.rot === 'none' ? 0 : m.rot === 'nonlinear' ? 1.5 : 1;
          stack(0.9, { tr: 1.5, rot: rotCl, vib: m.vib.length });
          stack(2.1, p);
          sb.hline(cl, { color: 'muted', dash: true });
          sb.text(v.fix(cl, 2), 0.9, cl, { dy: -10, size: 13 }); sb.text(v.fix(p.tr + p.rot + p.vib, 2), 2.1, p.tr + p.rot + p.vib, { dy: -10, size: 13 });
        });
        v.legend([['teal', 'translation', { area: true }], ['orange', 'rotation', { area: true }], ['red', 'vibration', { area: true }], ['ink', 'total, quantum model'], ['green', 'measured $C_V$', { dot: true }]]);
        v.readout(() => {
          const m = MOLS[sel.value], T = Ts.value, p = parts(m, T), tot = p.tr + p.rot + p.vib;
          const nrot = m.rot === 'none' ? 0 : m.rot === 'nonlinear' ? 3 : 2;
          return `$${m.tex}$: quadratic terms $3_\\text{trans} + ${nrot}_\\text{rot} + ${2 * m.vib.length}_\\text{vib}$ give $C_V = \\tfrac12 f R = ${v.fix(classical(m), 2)}\\,R$. At $T = ${v.fix(T, 0)}$ K the model gives $${v.fix(tot, 3)}\\,R$ (translation $${v.fix(p.tr, 2)}$, rotation $${v.fix(p.rot, 2)}$, vibration $${v.fix(p.vib, 2)}$); equipartition overshoots by $${v.fix(classical(m) - tot, 2)}\\,R$.`;
        });
      },
    },
    {
      num: '2.7', kind: 'Theorem', name: 'Reversible adiabatic expansion: pVᵞ = const',
      statement: String.raw`For a perfect gas with constant heat capacities that is expanded or compressed reversibly and adiabatically ($q = 0$),
$$ pV^{\gamma} = \text{constant},\qquad TV^{\gamma-1} = \text{constant},\qquad \gamma = \frac{C_p}{C_V}=\frac{C_V+R}{C_V}.$$
Since $\gamma>1$ the adiabat is steeper than the isotherm through the same point: an adiabatic compression by a factor $r$ raises the temperature by $r^{\gamma-1}$ and does work $w = \Delta U = nC_V\Delta T$.`,
      idea: String.raw`With $q = 0$ the first law gives $\mathrm dU = đw$, i.e. $C_V\,\mathrm dT = -p\,\mathrm dV = -(nRT/V)\mathrm dV$ for a perfect gas. Separating variables, $\mathrm d\ln T = -(R/C_V)\,\mathrm d\ln V$, and since $R/C_V = \gamma - 1$ (pchem-2.5) this integrates to $TV^{\gamma-1}=$ const; eliminating $T$ with $pV = nRT$ gives $pV^\gamma =$ const. Reversibility (pchem-2.2) is needed so that $p_\text{ex} = p$ throughout. Because the gas cannot exchange heat, all the work goes into $U$, so compression heats and expansion cools; on the isotherm the bath would absorb that energy.`,
      caption: String.raw`One mole of air at 1 bar and 300 K, on log–log axes where an isotherm has slope $-1$ and an adiabat slope $-\gamma$. Drag the end-state handle along the adiabat (or the compression-ratio slider), or press **Diesel**: at a compression ratio of 16 the temperature climbs to about 900 K, far past the assumed ignition threshold. Change $\gamma$ to see monatomic, diatomic and polyatomic gases. The readout checks the closed form against a numerical integration of $C_V\,\mathrm dT = -p\,\mathrm dV$.`,
      deps: ['pchem-2.5', 'pchem-2.2'],
      refs: ['Atkins 2E', 'M–S ch. 19'],
      tags: ['adiabatic', 'perfect gas'],
      credit: 'Poisson, 1823 (adiabatic law); Rudolf Diesel, 1893 (compression ignition)',
      scope: String.raw`Perfect gas, $C_V$ independent of temperature, reversible and adiabatic; real compressions lose heat to the walls and need more work, and over large temperature ranges $\gamma$ drifts (see 2.6).`,
      viz(v) {
        const T1 = 300, V1 = R * T1 / 1e5 * 1000, p1 = 1;   // L, bar
        const gam = v.select('gas', [{ value: 5 / 3, label: 'monatomic, $\\gamma=\\tfrac53$' }, { value: 7 / 5, label: 'diatomic, $\\gamma=\\tfrac75$' }, { value: 4 / 3, label: 'polyatomic, $\\gamma=\\tfrac43$' }], 7 / 5);
        const rr = v.slider('compression ratio $r = V_1/V_2$', 1, 25, 16, { step: 0.1 });
        const ign = v.slider('assumed ignition temperature', 500, 1100, 800, { step: 10, fmt: (x) => `${x.toFixed(0)} K` });
        v.button('Diesel', () => { gam.set(7 / 5); rr.set(16); ign.set(800); });
        const sp = v.stage({ x: [0.8, 40], y: [0.6, 160], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'V / L', ylabel: 'p / bar', height: 350, title: 'pV diagram on log–log axes' });
        const st = v.stage({ x: [1, 25], y: [200, 1400], axes: 'box', gutter: true, xlabel: 'compression ratio r', ylabel: 'T / K', height: 350, title: 'temperature at the end of the stroke' });
        const h = sp.handle(V1 / 16, p1 * 16 ** 1.4, { color: 'accent', r: 8, label: 'end', constrain: (x) => { const X = Math.min(V1, Math.max(V1 / 25, x)); return [X, p1 * (V1 / X) ** gam.value]; } });
        h.onDrag = () => rr.set(Math.min(25, Math.max(1, V1 / h.x)));
        let chk = {};
        v.render(() => {
          const g = gam.value, r = rr.value, V2 = V1 / r, p2 = p1 * r ** g, T2 = T1 * r ** (g - 1), Cv = R / (g - 1);
          h.set(V2, p2);
          sp.fn((V) => p1 * V1 / V, { color: 'ink', width: 1.8, dash: [6, 4], domain: [0.8, 40] });
          sp.fn((V) => p1 * (V1 / V) ** g, { color: 'accent', width: 2.6, domain: [V1 / 25, V1 * 1.2] });
          sp.dot(V1, p1, { r: 6, color: 'ink', label: '1', labelPos: 'ne' });
          sp.tex('T = \\text{const}', 14, p1 * V1 / 14, { color: 'ink', size: 12, dy: -14 });
          sp.tex('pV^\\gamma = \\text{const}', 3, p1 * (V1 / 3) ** g * 0.55, { color: 'accent', size: 12 });
          // numerical check: integrate C_V dT = −(RT/V) dV from V1 to V2 (RK4 on ln T against ln V)
          const Tnum = v.M.rk4((V, y) => -(R / Cv) * y / V, V1, T1, V2, 200).pop()[1];
          const wAd = Cv * (T2 - T1), wIso = R * T1 * Math.log(r);
          chk = { r, g, T2, Tnum, p2, wAd, wIso, V2 };
          // T against r
          const cols = ign.value;
          st.setView([1, 25], [200, Math.max(1400, T1 * 25 ** (g - 1) * 1.1)]);
          st.hline(T1, { color: 'ink', width: 1.6, dash: true });
          st.fn((x) => T1 * x ** (g - 1), { color: 'accent', width: 2.6, domain: [1, 25] });
          st.hline(cols, { color: 'red', width: 1.6 });
          st.text('assumed ignition threshold', 1.3, cols, { size: 11, color: 'red', align: 'left', dy: -9 });
          const rIgn = (cols / T1) ** (1 / (g - 1));
          if (rIgn <= 25) { st.vline(rIgn, { color: 'red', dash: true, width: 1 }); st.text(`r = ${v.fix(rIgn, 1)}`, rIgn, 260, { size: 11, color: 'red', dx: 4, align: 'left' }); }
          st.dot(r, T2, { r: 7, color: T2 >= cols ? 'red' : 'gold' });
        });
        v.legend([['ink', 'isotherm', { dash: true }], ['accent', 'reversible adiabat'], ['red', 'ignition threshold']]);
        v.readout(() => `Compression by $r = ${v.fix(chk.r, 1)}$ from 1 bar, 300 K: $p_2 = ${v.fix(chk.p2, 1)}$ bar, $T_2 = T_1 r^{\\gamma-1} = ${v.fix(chk.T2, 0)}$ K (numerical integration of $C_V\\mathrm dT = -p\\,\\mathrm dV$: $${v.fix(chk.Tnum, 0)}$ K). Work needed $= nC_V\\Delta T = ${v.fix(chk.wAd / 1000, 2)}$ kJ, against $${v.fix(chk.wIso / 1000, 2)}$ kJ for the isothermal compression to the same volume. ${chk.T2 >= ign.value ? '**Above the ignition threshold: the fuel would ignite.**' : 'Below the ignition threshold.'}`);
      },
    },
    {
      num: '2.8', kind: 'Method', name: 'Calorimetry',
      statement: String.raw`A calorimeter measures the heat of a process by the temperature change it causes in a body of known heat capacity. In a bomb calorimeter (constant volume) the heat released is $q_V = \Delta U = -C_\text{cal}\,\Delta T$; the calibration constant $C_\text{cal}$ is found by burning a standard (benzoic acid, whose energy of combustion is known) in the same apparatus. Heat exchanged with the surroundings during the experiment is corrected for by extrapolating the temperature drift before and after combustion to the moment at which the two shaded areas between curve and drift lines are equal. The reaction enthalpy follows from $\Delta H = \Delta U + \Delta n_g RT$, where $\Delta n_g$ is the change in moles of gas.`,
      idea: String.raw`Because the bomb is rigid no expansion work is done, so by the first law (2.1) the heat is exactly the change of the state function $U$. Real calorimeters are not adiabatic: the vessel gains heat from the stirrer and exchanges it with the jacket by Newton cooling, so the temperature keeps drifting before and after the burn. Extrapolating both drifts to the time where the areas are equal reproduces the rise an ideal adiabatic calorimeter would have shown (the Regnault–Pfaundler / Dickinson construction). The correction from $\Delta U$ to $\Delta H$ uses $H = U + pV$ and the perfect gas law (thermo-1.14, 2.5).`,
      caption: String.raw`A simulated run (with a little thermometer noise): the sample ignites at 10 min. Drag the vertical line to choose where to measure the rise; the corrected $\Delta T$ is the gap between the two extrapolated drift lines (dashed) at that time. Press **Equal areas** to place it where the green and orange shaded areas balance. Increase the heat-leak slider and watch a naive reading (final minus initial temperature) go wrong while the corrected value does not. Pick a different sample to compare $\Delta_cU$ and $\Delta_cH$.`,
      deps: ['pchem-2.4', 'pchem-2.5'],
      refs: ['Atkins Focus 2'],
      tags: ['calorimetry', 'internal energy'],
      scope: String.raw`Illustrative simulation: heat capacity of the calorimeter 10.20 kJ/K, jacket at 25.00 °C, release time constant 0.4 min; the energies of combustion per gram of the four samples are rounded literature values quoted from memory.`,
      viz(v) {
        const sel = v.select('sample', Object.keys(SAMPLES).map((k) => ({ value: k, label: SAMPLES[k].name })), 'sucr');
        const mass = v.slider('mass of sample', 0.3, 2, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} g` });
        const leak = v.slider('heat-leak coefficient', 0, 0.08, 0.03, { step: 0.002, fmt: (x) => `${x.toFixed(3)} /min` });
        const s = v.stage({ x: [0, T_END], y: [23.5, 28], axes: 'box', gutter: true, xlabel: 'time / min', ylabel: 'T / °C', height: 360, title: 'temperature record' });
        const sb = v.stage({ x: [0, 4], y: [-20, 0], axes: 'box', gutter: true, ylabel: 'kJ/mol', height: 360, title: 'from the temperature rise to the energy of combustion',
          xticks: [[0.8, 'Δ_cU measured'], [1.8, 'Δ_cU tabulated'], [3.0, 'Δ_cH']] });
        const hnd = s.handle(T_IGN + 2.5, 25, { color: 'gold', r: 8, constrain: (x) => [Math.min(T_IGN + 5, Math.max(T_IGN, x)), 25.5] });
        v.button('Equal areas', () => { hnd.x = info.tEq; });
        let info = {}, key = '';
        let sim, an, calib, cal, simB;
        v.render(() => {
          const sm = SAMPLES[sel.value], m = mass.value, kl = leak.value;
          const k2 = `${sel.value}|${m}|${kl}`;
          if (k2 !== key) {
            key = k2;
            sim = bomb(m * sm.u, kl, v.rng(3)); an = analyse(sim);
            simB = bomb(1.0 * SAMPLES.benz.u, kl, v.rng(5)); const aB = analyse(simB);
            const dTB = aB.aft(aB.tEq) - aB.fore(aB.tEq);
            cal = SAMPLES.benz.u / dTB;   // kJ/K
          }
          const ts = sim.ts, Ts = sim.Ts;
          const lo = Math.min(...Ts) - 0.2, hi = Math.max(...Ts) + 0.3;
          s.setView([0, T_END], [lo, hi]);
          const tS = hnd.x;
          hnd.y = lo + 0.12 * (hi - lo); hnd.set(tS, lo + 0.12 * (hi - lo));
          const i0 = Math.round(T_IGN / 0.01), i1 = Math.round((T_IGN + 6) / 0.01), iS = Math.round(tS / 0.01);
          const pre = [], post = [];
          for (let i = i0; i <= iS; i += 2) pre.push([ts[i], Ts[i]]);
          for (let i = iS; i <= i1; i += 2) post.push([ts[i], Ts[i]]);
          s.poly([...pre, [ts[iS], an.fore(ts[iS])], [ts[i0], an.fore(ts[i0])]], { fill: 'orange', fillAlpha: 0.35, stroke: false });
          const back = []; for (let i = i1; i >= iS; i -= 2) back.push([ts[i], an.aft(ts[i])]);
          s.poly([...post, ...back], { fill: 'green', fillAlpha: 0.35, stroke: false });
          s.path(ts.filter((_, i) => i % 3 === 0).map((t, i) => [t, Ts[i * 3]]), { color: 'accent', width: 2 });
          s.line(0, an.fore(0), T_IGN + 5, an.fore(T_IGN + 5), { color: 'orange', dash: true, width: 1.6 });
          s.line(T_IGN, an.aft(T_IGN), T_END, an.aft(T_END), { color: 'green', dash: true, width: 1.6 });
          s.vline(tS, { color: 'gold', width: 2 });
          s.vline(T_IGN, { color: 'muted', dash: true, width: 1 }); s.text('ignition', T_IGN, hi, { dx: 4, dy: 12, size: 11, align: 'left', color: 'muted' });
          const dT = an.aft(tS) - an.fore(tS), naive = Ts[Ts.length - 1] - Ts[0];
          s.line(tS + 0.5, an.fore(tS), tS + 0.5, an.aft(tS), { color: 'ink', width: 2 });
          s.text(`ΔT = ${v.fix(dT, 3)} K`, tS + 0.7, (an.fore(tS) + an.aft(tS)) / 2, { align: 'left', size: 12 });
          const Qtrue = m * sm.u, dTtrue = Qtrue / CCAL;
          const dcU = sel.value === 'benz' ? -cal * dT / m * SAMPLES.benz.M : -cal * dT / m * sm.M;
          const dcUlit = -sm.u * sm.M, dcH = dcU + sm.dn * 8.314462618e-3 * 298.15;
          info = { dT, dTtrue, naive, cal, dcU, dcUlit, dcH, sm, tEq: an.tEq, Qtrue };
          const mm = Math.max(Math.abs(dcU), Math.abs(dcUlit)) * 1.15;
          sb.setView([0, 4], [-mm, 0.05 * mm]);
          sb.hline(0, { color: 'muted' });
          [[0.8, dcU, 'accent'], [1.8, dcUlit, 'green'], [3.0, dcH, 'purple']].forEach(([x, val, c]) => { sb.rect(x - 0.4, 0, x + 0.4, val, { fill: c, fillAlpha: 0.65, color: c }); sb.text(v.fix(val, 0), x, val, { dy: 12, size: 12 }); });
        });
        v.legend([['accent', 'temperature record'], ['orange', 'fore-period drift and area', { area: true }], ['green', 'after-period drift and area', { area: true }]]);
        v.readout(() => {
          const i = info;
          return `Corrected rise $\\Delta T = ${v.fix(i.dT, 3)}$ K (true adiabatic rise $Q/C = ${v.fix(i.dTtrue, 3)}$ K; naive end minus start $= ${v.fix(i.naive, 3)}$ K; equal areas at $t = ${v.fix(i.tEq, 2)}$ min). Calibration from 1.000 g of benzoic acid in this run: $C_\\text{cal} = ${v.fix(i.cal, 3)}$ kJ/K (true 10.200).\n${i.sm.name}: $\\Delta_cU = -C_\\text{cal}\\Delta T\\,M/m = ${v.fix(i.dcU, 0)}$ kJ/mol (tabulated $${v.fix(i.dcUlit, 0)}$); $\\Delta_cH = \\Delta_cU + \\Delta n_g RT = ${v.fix(i.dcH, 1)}$ kJ/mol with $\\Delta n_g = ${i.sm.dn}$.`;
        });
      },
    },
    {
      num: '2.9', kind: 'Law', name: 'Hess’s law',
      statement: String.raw`The standard enthalpy of an overall reaction is the sum of the standard enthalpies of the individual steps into which it can be divided, whether or not those steps can actually be carried out:
$$\Delta_rH^\circ(\text{overall}) = \sum_i \Delta_rH_i^\circ .$$
Equivalently the enthalpy change between two states is the same along every route, and around any closed cycle of reactions the enthalpy changes add to zero.`,
      idea: String.raw`Enthalpy is a state function (pchem-2.3, thermo-1.14), so $\Delta H$ depends only on the initial and final states and not on the intermediate states chosen. That allows heats that cannot be measured directly (graphite to carbon monoxide, the hydrogenation of a double bond) to be assembled from heats that can, usually combustion enthalpies, by adding and subtracting balanced reactions as if they were algebraic equations. Were the law false, going round a cycle would create or destroy energy and contradict the first law (2.1).`,
      caption: String.raw`Each rung is a set of species at its enthalpy. Click rungs to walk from the start (green ring) to the goal (red ring) along any connected steps, up or down; the running sum of step enthalpies is compared with the direct difference of heights. Try the other routes, then return to the start: the sum is zero. Then use the *cheat* slider to make one step's tabulated value inconsistent and walk the loop: you gain energy for free, which is what the first law forbids.`,
      deps: ['pchem-2.3', 'thermo-1.14'],
      refs: ['Atkins Focus 2', 'M–S ch. 19'],
      tags: ['Hess', 'enthalpy cycle'],
      credit: 'Germain Hess, 1840',
      scope: String.raw`Standard conditions (reactants and products all in the stated standard states, same temperature). Enthalpies are 298 K values in kJ/mol quoted from memory of standard tables.`,
      viz(v) {
        const EX = {
          co2: { name: 'graphite → CO₂ via CO', start: 'a', goal: 'c', y: [-460, 70],
            nodes: { a: { x: 1, h: 0, t: '\\mathrm{C(gr)+O_2}' }, b: { x: 3, h: -110.53, t: '\\mathrm{CO+\\tfrac12O_2}' }, c: { x: 2, h: -393.51, t: '\\mathrm{CO_2}' } },
            edges: [['a', 'b'], ['b', 'c'], ['a', 'c']], direct: 2 },
          ethene: { name: 'hydrogenation of ethene (from combustion data)', start: 'n2', goal: 'n1', y: [-100, 1800],
            nodes: { n2: { x: 1, h: 1411.2 + 285.83, t: '\\mathrm{C_2H_4+H_2+3\\tfrac12O_2}' }, n3: { x: 3, h: 285.83, t: '\\mathrm{2CO_2+2H_2O(l)+H_2+\\tfrac12O_2}' }, n1: { x: 2, h: 1560.7, t: '\\mathrm{C_2H_6+3\\tfrac12O_2}' }, n0: { x: 2.5, h: 0, t: '\\mathrm{2CO_2+3H_2O(l)}' } },
            edges: [['n2', 'n3'], ['n3', 'n0'], ['n1', 'n0'], ['n2', 'n1']], direct: 3 },
          dia: { name: 'graphite → diamond', start: 'g', goal: 'd', y: [-460, 60],
            nodes: { g: { x: 1, h: 0, t: '\\mathrm{C(gr)+O_2}' }, d: { x: 3, h: 1.895, t: '\\mathrm{C(diamond)+O_2}' }, c: { x: 2, h: -393.51, t: '\\mathrm{CO_2}' } },
            edges: [['g', 'c'], ['d', 'c'], ['g', 'd']], direct: 2 },
        };
        const ex = v.select('reaction', Object.keys(EX).map((k) => ({ value: k, label: EX[k].name })), 'co2');
        const cheat = v.slider('cheat: error in the tabulated value of the last step', 0, 100, 0, { step: 1, fmt: (x) => `${x.toFixed(0)} kJ/mol` });
        v.button('Reset route', () => { route = [EX[ex.value].start]; });
        const s = v.stage({ x: [0.2, 3.8], y: [-460, 70], axes: false, height: 400, full: true, title: 'enthalpy ladder (heights to scale, kJ/mol)' });
        let route = [EX.co2.start], cur = 'co2';
        const E = () => EX[ex.value];
        const edgeDH = (e, a, b) => { const N = E().nodes; let d = N[b].h - N[a].h; if (e === E().edges.length - 1 && E().direct === E().edges.length - 1) { /* direct edge */ } if (e === E().direct) d += (a === E().edges[e][0] ? 1 : -1) * cheat.value; return d; };
        s.onClick((x, y) => {
          const N = E().nodes, tip = route[route.length - 1];
          let best = null, bd = 60;
          for (const k in N) { const d = Math.hypot(s.X(N[k].x) - s.X(x), s.Y(N[k].h) - s.Y(y)); if (d < bd) { bd = d; best = k; } }
          if (best && best !== tip && E().edges.some((e) => (e[0] === tip && e[1] === best) || (e[1] === tip && e[0] === best))) route.push(best);
        });
        let info = {};
        v.render(() => {
          if (cur !== ex.value) { cur = ex.value; route = [E().start]; }
          const X = E(), N = X.nodes;
          s.setView([0.2, 3.8], X.y);
          const used = new Set(); let sum = 0; const steps = [];
          for (let i = 1; i < route.length; i++) {
            const a = route[i - 1], b = route[i], ei = X.edges.findIndex((e) => (e[0] === a && e[1] === b) || (e[1] === a && e[0] === b));
            used.add(ei); const d = edgeDH(ei, a, b); sum += d; steps.push([a, b, d]);
          }
          X.edges.forEach((e, ei) => {
            const [a, b] = e, A = N[a], B = N[b], on = used.has(ei), isDirect = ei === X.direct;
            s.arrow(A.x, A.h, B.x, B.h, { color: on ? 'accent' : isDirect ? 'purple' : 'faint', width: on ? 3.2 : 1.8, head: 9 });
            const d = B.h - A.h + (isDirect ? cheat.value : 0);
            s.text(`${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`, (A.x + B.x) / 2, (A.h + B.h) / 2, { size: 12, color: on ? 'accent' : 'muted', dx: ei % 2 ? 24 : -24, plate: true });
          });
          for (const k in N) {
            const n = N[k], tip = route[route.length - 1] === k;
            s.dot(n.x, n.h, { r: tip ? 9 : 6, color: k === X.goal ? 'red' : k === X.start ? 'green' : 'ink', hollow: k === X.goal || k === X.start });
            s.tex(n.t, n.x, n.h, { dy: -16, size: 12.5, align: 'center' });
          }
          const direct = N[X.goal].h - N[X.start].h;
          info = { sum, direct, atGoal: route[route.length - 1] === X.goal, atStart: route.length > 1 && route[route.length - 1] === X.start, n: steps.length, steps };
        });
        v.readout(() => {
          const { sum, direct, atGoal, atStart, n } = info;
          const s = n ? `Route so far (${n} step${n > 1 ? 's' : ''}): $\\sum \\Delta H = ${v.fix(sum, 1)}$ kJ/mol.` : 'Click a rung joined to the green ring to start a route.';
          if (atGoal) return `${s} At the goal. Direct difference of heights: $\\Delta_rH^\\circ = ${v.fix(direct, 1)}$ kJ/mol. ${Math.abs(sum - direct) < 0.05 ? 'The two agree: the route does not matter.' : `**They differ by ${v.fix(sum - direct, 1)} kJ/mol: an inconsistent table.**`}`;
          if (atStart) return `${s} Back at the start: ${Math.abs(sum) < 0.05 ? 'a closed cycle sums to zero.' : `**the loop gained ${v.fix(sum, 1)} kJ/mol of energy from nowhere, which the first law forbids.**`}`;
          return s;
        });
      },
    },
    {
      num: '2.10', kind: 'Definition', name: 'Standard enthalpies of formation',
      statement: String.raw`The standard enthalpy of formation $\Delta_fH^\circ$ of a substance is the standard reaction enthalpy for forming one mole of it from its elements, each in its most stable form (reference state) at the stated temperature and 1 bar; for an element in its reference state it is zero by definition. Any reaction enthalpy follows from the table:
$$\Delta_rH^\circ = \sum_\text{products}\nu\,\Delta_fH^\circ - \sum_\text{reactants}\nu\,\Delta_fH^\circ .$$`,
      idea: String.raw`Choosing the elements as a common zero for enthalpy is Hess's law (2.9) in its most economical form: any reaction can be routed reactants → elements → products, and the first leg is the reverse of the formation reactions of the reactants while the second is the formation of the products. A table with one number per compound thus replaces a table with one number per reaction. The scale is only a convention (one may shift all $\Delta_fH^\circ$ of one element's compounds together), but differences, which are all that matter, are independent of it.`,
      caption: String.raw`Pick a reaction. The left column stacks the formation enthalpies of the reactants (each multiplied by its coefficient) measured from the element baseline, the right column those of the products; the arrow between the two net levels is $\Delta_rH^\circ$. Doubling all coefficients doubles every bar and the result: enthalpy is extensive. Note how burning ethanol or methane is highly exothermic because the products sit far below the reactants, and how elements (zero) contribute nothing.`,
      deps: ['pchem-2.9'],
      refs: ['Atkins Focus 2', 'M–S ch. 19'],
      tags: ['formation enthalpy', 'thermochemistry'],
      scope: String.raw`Values at 298.15 K and 1 bar (standard states: gases ideal, pure liquids and solids); the table entries are quoted from memory of the standard NBS/CODATA-type tables, to the precision shown.`,
      viz(v) {
        const sel = v.select('reaction', Object.keys(RXNS).map((k) => ({ value: k, label: RXNS[k].name })), 'CH4');
        const dbl = v.toggle('double all coefficients', false);
        const s = v.stage({ x: [0, 6], y: [-1000, 200], axes: false, height: 420, full: true, title: 'formation enthalpies relative to the elements (kJ/mol)' });
        const pal = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        let net = {};
        v.render(() => {
          const rx = RXNS[sel.value], k = dbl.value ? 2 : 1;
          const col = (items, x0) => { let up = 0, dn = 0; const segs = []; items.forEach(([nu, key], i) => { const val = nu * k * F[key][0], c = pal[i % pal.length]; if (val < 0) { segs.push([dn, dn + val, key, nu * k, c, val]); dn += val; } else if (val > 0) { segs.push([up, up + val, key, nu * k, c, val]); up += val; } else segs.push([0, 0, key, nu * k, c, 0]); }); return { segs, tot: up + dn, up, dn }; };
          const Rc = col(rx.R, 1.5), Pc = col(rx.P, 4.5);
          const hi = Math.max(Rc.up, Pc.up, 0), lo = Math.min(Rc.dn, Pc.dn, 0), pad = (hi - lo) * 0.14 + 20;
          s.setView([0, 6], [lo - pad, hi + pad]);
          s.hline(0, { color: 'ink', width: 2 });
          s.text('elements in their standard states: Δ_fH° = 0', 0.1, 0, { align: 'left', size: 12, dy: -10, color: 'muted' });
          [[Rc, 1.5, 'reactants'], [Pc, 4.5, 'products']].forEach(([c, x0, nm]) => {
            c.segs.forEach(([a, b, key, nu, colr, val]) => {
              if (a === b) { s.text(`${nu} ${F[key][1].replace(/[_{}]/g, '')} (0)`, x0, 0, { size: 11, color: 'muted', dy: 12 }); return; }
              s.rect(x0 - 0.7, a, x0 + 0.7, b, { fill: colr, fillAlpha: 0.55, color: colr });
              s.tex(`${nu}\\,\\mathrm{${F[key][1]}}\\ \\ ${val < 0 ? '−' : '+'}${Math.abs(val).toFixed(1)}`, x0, (a + b) / 2, { size: 12 });
            });
            s.tex(nm, x0, hi + pad * 0.55, { size: 14 });
            s.line(x0 - 0.9, c.tot, x0 + 0.9, c.tot, { color: 'ink', width: 2.4 });
            s.text(`Σ = ${c.tot.toFixed(1)}`, x0 + 0.95, c.tot, { align: 'left', size: 12 });
          });
          s.line(1.5 + 0.9, Rc.tot, 4.5 - 0.9, Rc.tot, { color: 'faint', dash: true });
          s.arrow(3, Rc.tot, 3, Pc.tot, { color: 'red', width: 3, head: 11 });
          s.tex(`\\Delta_rH^\\circ = ${(Pc.tot - Rc.tot).toFixed(1)}`, 3, (Rc.tot + Pc.tot) / 2, { size: 13, color: 'red', dx: 8, align: 'left', plate: true });
          net = { dH: Pc.tot - Rc.tot, rt: Rc.tot, pt: Pc.tot };
        });
        v.readout(() => `$\\Delta_rH^\\circ = \\sum\\nu\\Delta_fH^\\circ(\\text{products}) - \\sum\\nu\\Delta_fH^\\circ(\\text{reactants}) = (${v.fix(net.pt, 1)}) - (${v.fix(net.rt, 1)}) = ${v.fix(net.dH, 1)}$ kJ per mole of reaction as written: ${net.dH < 0 ? 'exothermic' : 'endothermic'}.`);
      },
    },
  ],
};
