// Physical Chemistry — Chapter 2: The first law and thermochemistry (part c: 2.11–2.14)
import { CP, cpOf, intCp, R } from './ch02.shared.js';

const T0 = 298.15;
// reactions for Kirchhoff: stoichiometric numbers (negative = reactant); ΔrH° at 298 K in kJ/mol
const KR = {
  h2o: { name: 'H₂ + ½ O₂ → H₂O(g)', nu: { H2: -1, O2: -0.5, H2O: 1 }, H: -241.83 },
  co: { name: 'CO + ½ O₂ → CO₂', nu: { CO: -1, O2: -0.5, CO2: 1 }, H: -282.98 },
  ch4: { name: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O(g)', nu: { CH4: -1, O2: -2, CO2: 1, H2O: 2 }, H: -802.36 },
  nh3: { name: 'N₂ + 3 H₂ → 2 NH₃', nu: { N2: -1, H2: -3, NH3: 2 }, H: -92.22 },
};
const dCp = (nu, T) => Object.entries(nu).reduce((s, [sp, n]) => s + n * cpOf(sp, T), 0);
const dHint = (nu, T) => Object.entries(nu).reduce((s, [sp, n]) => s + n * intCp(sp, T0, T), 0) / 1000;   // kJ/mol

// ---- Born–Haber data (kJ/mol) -----------------------------------------------------------------------------
const SALTS = {
  NaCl: { name: 'NaCl', M: 'Na', X: 'Cl', fH: -411.15, sub: 107.3, ie: 495.8, ie2: 0, diss: 121.7, ea: -349.0, r0: 282, n: 8, z: 1, ion: 'Na⁺ + Cl⁻' },
  KCl: { name: 'KCl', M: 'K', X: 'Cl', fH: -436.5, sub: 89.0, ie: 418.8, ie2: 0, diss: 121.7, ea: -349.0, r0: 314, n: 9, z: 1 },
  LiF: { name: 'LiF', M: 'Li', X: 'F', fH: -616.0, sub: 159.4, ie: 520.2, ie2: 0, diss: 79.4, ea: -328.0, r0: 201, n: 6, z: 1 },
  MgO: { name: 'MgO', M: 'Mg', X: 'O', fH: -601.6, sub: 147.1, ie: 2188.4, ie2: 1, diss: 249.2, ea: 657, r0: 210, n: 7, z: 2 },
};
const MAD = 1.7476;   // rock-salt Madelung constant
const bornLande = (s, M) => { const C = M.CONST; return C.NA * s.z * s.z * C.e * C.e / (4 * Math.PI * C.eps0 * s.r0 * 1e-12) * MAD * (1 - 1 / s.n) / 1000; };
// average bond enthalpies (kJ/mol)
const BONDS = {
  ch4: { name: 'burn methane (gas-phase water)', ref: -802.36, break: [[4, 'C–H', 412], [2, 'O=O', 496]], make: [[2, 'C=O', 799], [4, 'O–H', 463]] },
  hcl: { name: 'H₂ + Cl₂ → 2 HCl', ref: -184.62, break: [[1, 'H–H', 436], [1, 'Cl–Cl', 242]], make: [[2, 'H–Cl', 431]] },
  nh3: { name: 'N₂ + 3 H₂ → 2 NH₃', ref: -92.22, break: [[1, 'N≡N', 945], [3, 'H–H', 436]], make: [[6, 'N–H', 391]] },
};

// ---- van der Waals gases (a in L²·bar/mol², b in L/mol) -----------------------------------------------------
const RL = 0.0831446;
const VDW = {
  N2: { name: 'nitrogen (air)', a: 1.370, b: 0.0387, f: 5, T: [140, 900], p: [0, 400], x0: [300, 200] },
  H2: { name: 'hydrogen', a: 0.2476, b: 0.0266, f: 5, T: [40, 330], p: [0, 200], x0: [150, 120] },
  He: { name: 'helium', a: 0.0346, b: 0.0238, f: 3, T: [8, 60], p: [0, 80], x0: [25, 60] },
  CO2: { name: 'carbon dioxide', a: 3.658, b: 0.0429, f: 7, T: [320, 2200], p: [0, 400], x0: [400, 150] },
};
const vdwV = (g, T, p) => { let V = RL * T / p + g.b; for (let i = 0; i < 60; i++) { const f = RL * T / (V - g.b) - g.a / (V * V) - p, df = -RL * T / ((V - g.b) ** 2) + 2 * g.a / (V ** 3); const dV = f / df; V -= dV; if (V <= g.b * 1.0001) V = g.b * 1.0001 + 1e-6; if (Math.abs(dV) < 1e-11) break; } return V; };
const vdwH = (g, T, p) => { const V = vdwV(g, T, p), Cv = (g.f / 2) * RL; return Cv * T - g.a / V + p * V; };   // L·bar per mol
const vdwMu = (g, T, p) => { const h = 1e-3 * T, dVdT = (vdwV(g, T + h, p) - vdwV(g, T - h, p)) / (2 * h); return (T * dVdT - vdwV(g, T, p)) / ((g.f / 2 + 1) * RL); };

export default {
  collection: 'pchem',
  chapter: 2,
  items: [
    {
      num: '2.11', kind: 'Law', name: 'Kirchhoff’s law',
      statement: String.raw`If the reaction enthalpy is known at one temperature, its value at another follows from the difference of the heat capacities of products and reactants:
$$\Delta_rH^\circ(T_2) = \Delta_rH^\circ(T_1) + \int_{T_1}^{T_2}\Delta_rC_p^\circ(T)\,\mathrm dT,\qquad \Delta_rC_p^\circ = \sum_\text{prod}\nu\,C_{p,m}^\circ - \sum_\text{react}\nu\,C_{p,m}^\circ ,$$
which is the statement $\mathrm d\Delta_rH^\circ/\mathrm dT = \Delta_rC_p^\circ$. If $\Delta_rC_p^\circ$ is constant the change is just $\Delta_rC_p^\circ\,\Delta T$.`,
      idea: String.raw`Each of the two enthalpies $H_\text{products}(T)$ and $H_\text{reactants}(T)$ rises with temperature at the rate set by its heat capacity (pchem-2.5), so their difference changes at the rate $\Delta_rC_p$. Equivalently, take the reactants from $T_2$ down to $T_1$, react there and warm the products back up: because $H$ is a state function (Hess's law, 2.9) the detour costs $\Delta_rH(T_1)$ plus the heat for warming products minus the heat for the reactants, which is the integral of $\Delta_rC_p$. The formation values at 298 K (pchem-2.10) supply the starting number.`,
      caption: String.raw`Choose a reaction and drag the temperature. Left: the total heat capacity of the reactants and of the products (as written) against $T$; the shaded area between them from 298 K to $T$ is $\int\Delta_rC_p\,\mathrm dT$ (green where products are higher, red where lower). Right: the reaction enthalpy itself, with the exact curve and the straight-line estimate that treats $\Delta_rC_p$ as constant at its 298 K value. Notice that the enthalpy of combustion hardly moves while the Haber reaction changes substantially.`,
      deps: ['pchem-2.10', 'pchem-2.5'],
      refs: ['Atkins Focus 2', 'M–S ch. 19'],
      tags: ['Kirchhoff', 'heat capacity'],
      credit: 'Gustav Kirchhoff, 1858',
      scope: String.raw`No phase change between $T_1$ and $T_2$ for any species (otherwise add the transition enthalpies). The heat capacities are empirical fits $a + bT + c/T^2$ with coefficients from Atkins' tables (CO₂, H₂, N₂, NH₃, O₂ as in Atkins' Table 2B.1; CO, H₂O and CH₄ as in older editions). They track NIST-JANAF values within a few percent from 298 K to about 1500 K for most species, but the CH₄ fit is only good to about 1000 K (about 10% high at 1500 K, 25% high at 2000 K) and is plotted beyond that for illustration only.`,
      viz(v) {
        const rx = v.select('reaction', Object.keys(KR).map((k) => ({ value: k, label: KR[k].name })), 'nh3');
        const Ts = v.slider('temperature $T$', 298.15, 2000, 1000, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [298, 2000], y: [0, 100], axes: 'box', gutter: true, xlabel: 'T / K', ylabel: '$C_p$ / (J/K) per mole of reaction', height: 350, title: 'heat capacities of reactants and products' });
        const s2 = v.stage({ x: [298, 2000], y: [-300, 0], axes: 'box', gutter: true, xlabel: 'T / K', ylabel: '$\\Delta_rH^\\circ$ / (kJ/mol)', height: 350, title: 'reaction enthalpy against temperature' });
        let info = {};
        v.render(() => {
          const r = KR[rx.value], T = Ts.value;
          const prod = {}, rea = {};
          for (const [sp, n] of Object.entries(r.nu)) (n > 0 ? prod : rea)[sp] = Math.abs(n);
          const sum = (set, t) => Object.entries(set).reduce((a, [sp, n]) => a + n * cpOf(sp, t), 0);
          const ys = [];
          for (let t = 298; t <= 2000; t += 50) ys.push(sum(prod, t), sum(rea, t));
          s1.setView([298, 2000], [Math.max(0, Math.min(...ys) - 10), Math.max(...ys) + 12]);
          const fP = (t) => sum(prod, t), fR = (t) => sum(rea, t);
          s1.between(fR, fP, T0, T, { fill: sum(prod, T) >= sum(rea, T) ? 'green' : 'red', fillAlpha: 0.3 });
          s1.fn(fR, { color: 'accent', width: 2.6, domain: [298, 2000] });
          s1.fn(fP, { color: 'orange', width: 2.6, domain: [298, 2000] });
          s1.vline(T, { color: 'gold', width: 1.6 });
          const H = (t) => r.H + dHint(r.nu, t), dc0 = dCp(r.nu, T0);
          const Hs = []; for (let t = 298; t <= 2000; t += 100) Hs.push(H(t), r.H + dc0 * (t - T0) / 1000);
          const lo = Math.min(...Hs), hi = Math.max(...Hs), pad = Math.max(2, (hi - lo) * 0.25);
          s2.setView([298, 2000], [lo - pad, hi + pad]);
          s2.fn((t) => r.H + dc0 * (t - T0) / 1000, { color: 'muted', width: 1.8, dash: true, domain: [298, 2000] });
          s2.fn(H, { color: 'ink', width: 2.8, domain: [298, 2000] });
          s2.vline(T, { color: 'gold', width: 1.6 });
          s2.dot(T, H(T), { r: 7, color: 'gold' });
          s2.dot(T0, r.H, { r: 5, color: 'ink' });
          const integral = v.M.integrate((t) => dCp(r.nu, t), T0, T, 200) / 1000;
          info = { H: H(T), const: r.H + dc0 * (T - T0) / 1000, dc: dCp(r.nu, T), dc0, integral, T, H0: r.H };
        });
        v.legend([['accent', 'reactants $\\sum\\nu C_p$'], ['orange', 'products $\\sum\\nu C_p$'], ['ink', 'Kirchhoff: exact'], ['muted', 'constant $\\Delta_rC_p$', { dash: true }]]);
        v.readout(() => `$\\Delta_rH^\\circ(298) = ${v.fix(info.H0, 1)}$ kJ/mol; $\\Delta_rC_p$ is ${v.fix(info.dc0, 1)} J/(K·mol) at 298 K and ${v.fix(info.dc, 1)} at ${v.fix(info.T, 0)} K. $\\int\\Delta_rC_p\\mathrm dT = ${v.fix(info.integral, 2)}$ kJ/mol, so $\\Delta_rH^\\circ(${v.fix(info.T, 0)}\\,\\mathrm K) = ${v.fix(info.H, 1)}$ kJ/mol (constant-$\\Delta C_p$ estimate: ${v.fix(info.const, 1)}).`);
      },
    },
    {
      num: '2.12', kind: 'Method', name: 'Born–Haber cycle and bond enthalpies',
      statement: String.raw`A Born–Haber cycle applies Hess's law (2.9) to the formation of an ionic solid from its elements: the enthalpy of formation equals the sum of the enthalpies of atomization of the elements, ionization of the metal, electron gain by the non-metal, and the lattice enthalpy (gaseous ions $\to$ solid), so the only step that cannot be measured directly, the lattice enthalpy, follows from the others. Likewise, the enthalpy of a gas-phase reaction can be estimated as the sum of the average bond enthalpies of the bonds broken minus those of the bonds formed:
$$\Delta_rH \approx \sum \Delta H(\text{bonds broken}) - \sum \Delta H(\text{bonds formed}).$$
The bond-enthalpy estimate is rough (typically within about 10–20 kJ/mol) since the average bond energies are transferred from other molecules.`,
      idea: String.raw`Both methods are applications of the state-function property (pchem-2.9): any convenient route between the same two states has the same $\Delta H$. For the ionic solid the route goes through gaseous atoms and ions whose energies are measured in the gas phase, the lattice enthalpy being the remainder; it can be compared with a purely electrostatic Born–Landé estimate $\propto Mz^2e^2/(4\pi\varepsilon_0 r_0)(1-1/n)$ built from the Madelung constant, which is within a few percent for the alkali halides and shows how well the ionic model works. For molecules the route goes through free atoms, so the bonds broken and formed are tallied separately.`,
      caption: String.raw`Left: choose a salt, then step through the cycle with the slider; each step adds a bar to the staircase. Drag the lattice-enthalpy slider until the last bar lands on the measured $\Delta_fH$ (the dashed line), or press **Close the cycle**; **Born–Landé** puts in the electrostatic estimate and shows what formation enthalpy it would predict. Switch to *bond enthalpies* to tally broken and formed bonds for three gas-phase reactions and compare the estimate with the exact $\Delta_rH$.`,
      deps: ['pchem-2.9'],
      refs: ['Atkins Focus 2'],
      tags: ['Born–Haber', 'lattice enthalpy', 'bond enthalpy'],
      credit: 'Born and Haber, 1919 (cycle); Born and Landé, 1918',
      scope: String.raw`Ionic model with Madelung constant 1.7476 (rock-salt structure); the data for the four salts, the Born exponents and the average bond enthalpies are rounded values quoted from memory of the standard tables.`,
      viz(v) {
        const M = v.M;
        const mode = v.select('method', [{ value: 'bh', label: 'Born–Haber cycle' }, { value: 'bond', label: 'bond enthalpies' }], 'bh');
        const salt = v.select('salt', Object.keys(SALTS).map((k) => ({ value: k, label: k })), 'NaCl');
        const bsel = v.select('reaction', Object.keys(BONDS).map((k) => ({ value: k, label: BONDS[k].name })), 'ch4');
        const shown = v.slider('steps shown', 0, 6, 6, { int: true });
        const U = v.slider('lattice enthalpy', -4500, 0, -300, { step: 1, fmt: (x) => `${x.toFixed(0)} kJ/mol` });
        const bClose = v.button('Close the cycle', () => { U.set(Math.round(SALTS[salt.value].fH - gas(SALTS[salt.value]))); });
        const bBorn = v.button('Born–Landé', () => { U.set(-Math.round(bornLande(SALTS[salt.value], M))); });
        const gas = (S) => S.sub + S.ie + S.diss + S.ea;
        const s = v.stage({ x: [0.4, 7.6], y: [-1000, 1000], axes: 'box', gutter: true, ylabel: 'enthalpy / (kJ/mol)', height: 400, full: true, title: 'the cycle as a staircase' });
        let info = {};
        const stepsOf = () => {
          if (mode.value === 'bond') {
            const B = BONDS[bsel.value], st = [];
            B.break.forEach(([n, nm, e]) => st.push({ lab: `break ${n} ${nm}`, d: n * e, col: 'red' }));
            B.make.forEach(([n, nm, e]) => st.push({ lab: `form ${n} ${nm}`, d: -n * e, col: 'green' }));
            return { st, target: B.ref, title: B.name };
          }
          const S = SALTS[salt.value];
          const ionTxt = S.ie2 ? 'ionize M → M²⁺' : `ionize ${S.M}`, eaTxt = S.ie2 ? 'electrons to ½O₂ → O²⁻' : `electron to ${S.X}`;
          return { st: [{ lab: `atomize ${S.M}`, d: S.sub, col: 'orange' }, { lab: ionTxt, d: S.ie, col: 'red' }, { lab: `atomize ${S.X}`, d: S.diss, col: 'orange' }, { lab: eaTxt, d: S.ea, col: S.ea < 0 ? 'green' : 'red' },
            { lab: 'lattice', d: U.value, col: 'purple', unknown: true }], target: S.fH, title: `formation of ${S.name}` };
        };
        v.render(() => {
          const isBH = mode.value === 'bh';
          salt.el.hidden = !isBH; shown.el.hidden = !isBH; U.el.hidden = !isBH; bClose.hidden = !isBH; bBorn.hidden = !isBH; bsel.el.hidden = isBH;
          const { st, target } = stepsOf();
          const nShow = isBH ? Math.min(shown.value, st.length) : st.length;
          let cum = 0; const bars = st.map((q, i) => { const a = cum; cum += q.d; return { ...q, a, b: cum, i }; });
          const all = [0, target, ...bars.map((b) => b.b), ...bars.map((b) => b.a)];
          const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.15 + 30;
          s.setView([0.4, bars.length + 2.6], [lo - pad, hi + pad]);
          s.setTicks(bars.map((b, i) => [i + 1, b.lab]).concat([[bars.length + 1.6, 'result']]), null);
          s.hline(0, { color: 'muted', width: 1 });
          s.text(isBH ? 'elements in their standard states' : 'reactants (isolated molecules)', 0.45, 0, { size: 11, align: 'left', color: 'muted', dy: 12 });
          bars.slice(0, nShow).forEach((b) => {
            s.rect(b.i + 0.65, b.a, b.i + 1.35, b.b, { fill: b.col, fillAlpha: 0.6, color: b.col });
            s.text(`${b.d >= 0 ? '+' : '−'}${Math.abs(b.d).toFixed(0)}`, b.i + 1, b.b, { dy: b.d >= 0 ? -10 : 12, size: 12 });
            if (b.i + 1 < nShow) s.line(b.i + 1.35, b.b, b.i + 1.65, b.b, { color: 'faint', dash: true });
          });
          const end = nShow ? bars[nShow - 1].b : 0;
          const full = nShow === bars.length;
          s.hline(target, { color: 'ink', width: 1.4, dash: true });
          s.text(isBH ? `measured $\\Delta_fH$ = −${Math.abs(target).toFixed(1)}` : `exact $\\Delta_rH$ from tables = ${target < 0 ? '−' : ''}${Math.abs(target).toFixed(1)}`, 0.45, target, { align: 'left', size: 12, dy: -10 });
          if (full) {
            s.rect(bars.length + 1.25, 0, bars.length + 1.95, end, { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
            s.text(`${end >= 0 ? '+' : '−'}${Math.abs(end).toFixed(0)}`, bars.length + 1.6, end, { dy: end >= 0 ? -10 : 12, size: 12 });
            if (Math.abs(end - target) > 0.5) s.arrow(bars.length + 2.2, end, bars.length + 2.2, target, { color: 'red', width: 2.4, head: 8 });
          }
          info = { end, target, full, bars, isBH };
        });
        v.readout(() => {
          const { end, target, full, bars, isBH } = info;
          if (!isBH) return `Bonds broken: ${bars.filter((b) => b.d > 0).reduce((a, b) => a + b.d, 0).toFixed(0)} kJ/mol; bonds formed: ${(-bars.filter((b) => b.d < 0).reduce((a, b) => a + b.d, 0)).toFixed(0)} kJ/mol. Estimated $\\Delta_rH \\approx ${v.fix(end, 0)}$ kJ/mol against the exact $${v.fix(target, 1)}$ (error ${v.fix(end - target, 0)} kJ/mol).`;
          const S = SALTS[salt.value], need = S.fH - gas(S), est = bornLande(S, M);
          return `${full ? `Sum of the steps with lattice enthalpy $${v.fix(U.value, 0)}$ kJ/mol: $${v.fix(end, 1)}$ kJ/mol against measured $${v.fix(target, 1)}$ (${Math.abs(end - target) < 1 ? 'the cycle closes' : `missing ${v.fix(target - end, 1)}`}).` : 'Reveal all six steps to compare the total with the measured formation enthalpy.'}\nSolving the cycle: $\\Delta_{\\text{latt}}H = \\Delta_fH - (\\text{sum of the gas-phase steps}) = ${v.fix(need, 1)}$ kJ/mol. Born–Landé estimate: $-${v.fix(est, 0)}$ kJ/mol (${v.fix(100 * (est + need) / -need, 1)}% off).`;
        });
      },
    },
    {
      num: '2.13', kind: 'Phenomenon', name: 'Joule–Thomson effect and inversion temperature',
      statement: String.raw`When a real gas is forced through a porous plug or valve from pressure $p_1$ to a lower pressure $p_2$ without heat exchange, the process conserves enthalpy ($H_1 = H_2$) and the temperature changes by
$$\Delta T \approx \mu_\text{JT}\,\Delta p,\qquad \mu_\text{JT} = \Big(\frac{\partial T}{\partial p}\Big)_H = \frac{1}{C_p}\Big[T\Big(\frac{\partial V}{\partial T}\Big)_p - V\Big] .$$
A perfect gas has $\mu_\text{JT} = 0$. A real gas cools on expansion ($\mu_\text{JT}>0$) below its *inversion temperature* and warms above it; for a van der Waals gas the inversion curve satisfies $T = \dfrac{2a}{Rb}\Big(1-\dfrac bV\Big)^2$.`,
      idea: String.raw`Joule and Thomson's experiment keeps $H = U + pV$ constant (the gas does work $p_2V_2 - p_1V_1$ in pushing the plug, so $\Delta U = -\Delta(pV)$; thermo-1.14 and 2.4). For a perfect gas $U$ and $pV$ depend on $T$ alone, so nothing happens. In a real gas, attractions make the expanding gas do work against its own cohesion, so $U$ rises with volume at fixed $T$ and the gas cools, while repulsions (the excluded volume $b$) make $pV$ fall less than the drop in $p$ would suggest and the gas warms; the balance of $a$ and $b$ in the equation of state (pchem-1.13) fixes the sign and the inversion temperature $2a/Rb$ at low pressure. Repeated cooling by throttling, with the cold gas recycled through a counter-current exchanger, liquefies air in the Linde process.`,
      caption: String.raw`The map shows isenthalps of a van der Waals gas in the $(T,p)$ plane and the inversion curve (red). Drag the starting state (gold) and set the exit pressure: the gas follows its isenthalp to the new pressure, cooling when it starts inside the red curve and warming outside. The right panel plots $\mu_\text{JT}$ against $T$ at the starting pressure, crossing zero at the inversion temperature. Try hydrogen at room temperature (above its inversion temperature, so it warms) and helium (which warms unless pre-cooled below about 40 K).`,
      deps: ['pchem-2.4', 'pchem-1.13'],
      refs: ['Atkins 2D', 'M–S ch. 19'],
      tags: ['Joule–Thomson', 'real gas', 'liquefaction'],
      credit: 'Joule and William Thomson, 1852–1862; Linde, 1895',
      scope: String.raw`Van der Waals gas with $C_p$ taken as the perfect-gas value (the real $C_p$ rises at high pressure), so the numbers are semiquantitative: the model overestimates the maximum inversion temperature of nitrogen (about 850 K against the measured 620 K). The constants $a$ and $b$ are rounded values from memory.`,
      viz(v) {
        const gsel = v.select('gas', Object.keys(VDW).map((k) => ({ value: k, label: VDW[k].name })), 'N2');
        const p2s = v.slider('exit pressure $p_2$', 1, 50, 1, { step: 0.5, fmt: (x) => `${x.toFixed(1)} bar` });
        const sm = v.stage({ x: [140, 900], y: [0, 400], axes: 'box', gutter: true, xlabel: 'T / K', ylabel: 'p / bar', height: 380, title: 'isenthalps and the inversion curve' });
        const sj = v.stage({ x: [140, 900], y: [-0.1, 0.5], axes: 'box', gutter: true, xlabel: 'T / K', ylabel: '$\\mu_\\mathrm{JT}$ / (K/bar)', height: 380, title: 'Joule–Thomson coefficient at the starting pressure' });
        let cur = 'N2';
        const h = sm.handle(300, 200, { color: 'gold', r: 8, label: 'start' });
        let info = {};
        v.render(() => {
          const g = VDW[gsel.value];
          if (cur !== gsel.value) { cur = gsel.value; h.set(g.x0[0], g.x0[1]); }
          const [Ta, Tb] = g.T, [pa, pb] = g.p;
          sm.setView([Ta, Tb], [pa, pb]);
          const T1 = Math.min(Tb, Math.max(Ta, h.x)), p1 = Math.max(1, Math.min(pb, h.y));
          if (T1 !== h.x || p1 !== h.y) h.set(T1, p1);
          const H0 = vdwH(g, T1, p1), Cp = (g.f / 2 + 1) * RL;
          const dH = Cp * (Tb - Ta) / 7, lev = []; for (let k = -6; k <= 6; k++) lev.push(H0 + k * dH);
          sm.clip(() => sm.contour((T, p) => vdwH(g, T, Math.max(p, 0.5)), lev, { color: 'muted', width: 1, alpha: 0.6, res: 55 }));
          // inversion curve (parametric in V)
          const inv = []; for (let i = 0; i <= 200; i++) { const V = g.b * (1.12 + (i / 200) ** 2 * 400), T = 2 * g.a * (V - g.b) ** 2 / (RL * g.b * V * V), p = RL * T / (V - g.b) - g.a / (V * V); if (p > 0) inv.push([T, p]); }
          sm.path(inv, { color: 'red', width: 3 });
          sm.tex('\\mu_\\text{JT}<0\\ \\text{(warms)}', Ta + 0.8 * (Tb - Ta), pa + 0.55 * (pb - pa), { size: 13, color: 'red', plate: true });
          sm.tex('\\mu_\\text{JT}>0\\ \\text{(cools)}', Ta + 0.45 * (Tb - Ta), pa + 0.45 * (pb - pa), { size: 13, color: 'green', plate: true });
          // throttle path from p1 down to p2
          const p2 = Math.min(p2s.value, p1);
          const Tof = (p) => { let lo = Math.max(g.b * 0 + 3, Ta * 0.6), hi = Tb * 1.6; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (vdwH(g, m, p) < H0) lo = m; else hi = m; } return (lo + hi) / 2; };
          const path = []; for (let i = 0; i <= 40; i++) { const p = p1 + (p2 - p1) * i / 40; path.push([Tof(p), p]); }
          sm.path(path, { color: 'accent', width: 3 });
          const T2 = path[path.length - 1][0];
          sm.dot(T2, p2, { r: 7, color: 'accent', label: 'exit', labelPos: 'ne' });
          // μ(T) at p1
          const mus = []; for (let i = 0; i <= 120; i++) { const T = Ta + (Tb - Ta) * i / 120; mus.push([T, vdwMu(g, T, p1)]); }
          const mlo = Math.min(...mus.map((q) => q[1]), 0), mhi = Math.max(...mus.map((q) => q[1]), 0.001), pd = (mhi - mlo) * 0.12;
          sj.setView([Ta, Tb], [mlo - pd, mhi + pd]);
          sj.hline(0, { color: 'muted', width: 1.2 });
          sj.path(mus, { color: 'accent', width: 2.6 });
          let Tinv = null; for (let i = 1; i < mus.length; i++) if (mus[i - 1][1] > 0 && mus[i][1] <= 0) { Tinv = mus[i - 1][0] + (mus[i][0] - mus[i - 1][0]) * mus[i - 1][1] / (mus[i - 1][1] - mus[i][1]); }
          if (Tinv) { sj.vline(Tinv, { color: 'red', dash: true }); sj.text(`$T_\\mathrm{inv}$ ≈ ${Tinv.toFixed(0)} K`, Tinv, mlo + 0.1 * (mhi - mlo), { color: 'red', size: 12, dx: 5, align: 'left' }); }
          const mu1 = vdwMu(g, T1, p1);
          sj.dot(T1, mu1, { r: 7, color: 'gold' });
          info = { T1, p1, T2, p2, mu1, Tinv, Tmax: 2 * g.a / (RL * g.b), g };
        });
        v.legend([['red', 'inversion curve'], ['muted', 'isenthalps (constant $H$)'], ['accent', 'throttling path']]);
        v.readout(() => `Start ${v.fix(info.T1, 0)} K, ${v.fix(info.p1, 0)} bar: $\\mu_\\text{JT} = ${v.fix(info.mu1, 3)}$ K/bar. Throttled to ${v.fix(info.p2, 1)} bar at constant $H$ the gas ${info.T2 < info.T1 ? 'cools' : 'warms'} to ${v.fix(info.T2, 1)} K ($\\Delta T = ${v.fix(info.T2 - info.T1, 1)}$ K). Zero-pressure inversion temperature of this van der Waals gas $2a/Rb = ${v.fix(info.Tmax, 0)}$ K${info.Tinv ? `; at the starting pressure $\\mu_\\text{JT}$ changes sign at ${v.fix(info.Tinv, 0)} K` : ''}.`);
      },
    },
    {
      num: '2.14', kind: 'Model', name: 'Adiabatic flame temperature',
      statement: String.raw`The adiabatic flame temperature $T_\text{ad}$ is the temperature reached by the products of a combustion carried out at constant pressure with no heat loss, from reactants entering at $T_\text{in}$. By the first law, in terms of enthalpy,
$$\sum_{\text{products}} n_j\!\int_{T^\circ}^{T_\text{ad}}\! C_{p,j}\,\mathrm dT \;=\; -\Delta_rH^\circ + \sum_{\text{reactants}} n_i\!\int_{T^\circ}^{T_\text{in}}\! C_{p,i}\,\mathrm dT ,$$
so $T_\text{ad}$ is the root of an equation built from the reaction enthalpy at 298 K and the heat capacities (Kirchhoff's law, 2.11). Excess air or inert gas lowers it; preheating or oxygen enrichment raises it.`,
      idea: String.raw`All the energy released at 298 K, $-\Delta_rH^\circ$ per mole of fuel, plus whatever sensible heat the reactants bring, must end up as sensible heat of the products, because nothing leaves as heat or work. The heat the products can hold, $\sum n_j\int C_{p,j}\mathrm dT$, rises monotonically with $T$, so there is a single temperature where it equals the supply. Nitrogen and excess oxygen contribute heat capacity and no energy, so each extra mole of them dilutes the flame. The calculation uses the reaction enthalpy (pchem-2.11 shifts it to any temperature) and heat capacities, here with complete combustion and no dissociation.`,
      caption: String.raw`Burn methane in air with the excess-air factor $\lambda$ (1 is exactly stoichiometric). Right: the enthalpy the products can absorb on the way up (curve) against the energy available (horizontal line); they meet at $T_\text{ad}$. Left: $T_\text{ad}$ against $\lambda$ for the current oxygen fraction and air preheat; enrich the oxidant or preheat the air and the curve lifts. Drag the trial temperature on the right to see the deficit or surplus. The hatched zone is beyond the range where the heat-capacity fits and the neglect of dissociation are trustworthy.`,
      deps: ['pchem-2.11'],
      refs: ['Atkins Focus 2'],
      tags: ['combustion', 'adiabatic flame', 'enthalpy balance'],
      scope: String.raw`Complete combustion of methane to CO₂ and H₂O(g) (lean or stoichiometric mixtures only), constant pressure, no heat loss, ideal gases, no dissociation. Real flames are cooler by a few hundred kelvin at stoichiometry because CO₂ and H₂O dissociate, and the polynomial fits are intended for 298–2000 K (CO₂, H₂O, N₂, O₂ track NIST-JANAF to a few percent there; the CH₄ fit, which matters only for the reactant stream, is poorer above about 1000 K) and are extrapolated beyond.`,
      viz(v) {
        const lam = v.slider('excess-air factor $\\lambda$', 1, 4, 1, { step: 0.01 });
        const xO = v.slider('O₂ in the oxidant', 0.21, 0.5, 0.21, { step: 0.01, fmt: (x) => `${(100 * x).toFixed(0)} %` });
        const Tin = v.slider('preheat of the oxidant', 298.15, 900, 298.15, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const QH = 802.36;   // kJ per mol CH4
        const mix = (l, x) => { const o2 = 2 * l, n2 = o2 * (1 - x) / x; return { react: { O2: o2, N2: n2 }, prod: { CO2: 1, H2O: 2, O2: 2 * (l - 1), N2: n2 } }; };
        const Hp = (m, T) => Object.entries(m.prod).reduce((a, [sp, n]) => a + n * intCp(sp, T0, T), 0) / 1000;
        const Hr = (m, Ti) => Object.entries(m.react).reduce((a, [sp, n]) => a + n * intCp(sp, T0, Ti), 0) / 1000;
        const Tad = (l, x, Ti) => { const m = mix(l, x), Q = QH + Hr(m, Ti); let lo = 300, hi = 9000; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (Hp(m, mid) < Q) lo = mid; else hi = mid; } return (lo + hi) / 2; };
        const sl = v.stage({ x: [0.9, 4], y: [1000, 3200], axes: 'box', gutter: true, xlabel: 'excess-air factor λ', ylabel: '$T_\\mathrm{ad}$ / K', height: 360, title: 'flame temperature against excess air' });
        const sh = v.stage({ x: [298, 3400], y: [0, 1500], axes: 'box', gutter: true, xlabel: 'T / K', ylabel: 'enthalpy per mol CH₄ / kJ', height: 360, title: 'energy balance' });
        let curM = null;
        const hd = sh.handle(2000, 0, { color: 'gold', r: 8, constrain: (x) => { const T = Math.min(3400, Math.max(400, x)); return [T, curM ? Hp(curM, T) : 0]; } });
        let info = {};
        v.render(() => {
          const l = lam.value, x = xO.value, Ti = Tin.value, m = (curM = mix(l, x)), Q = QH + Hr(m, Ti), Ta = Tad(l, x, Ti);
          // left
          const pts = []; for (let k = 0; k <= 60; k++) { const ll = 1 + 3 * k / 60; pts.push([ll, Tad(ll, x, Ti)]); }
          const top = Math.max(...pts.map((p) => p[1])), bot = Math.min(...pts.map((p) => p[1]));
          const ytop = Math.max(2800, top + 150);
          sl.setView([0.9, 4], [Math.max(0, bot - 200), ytop]);
          sl.rect(0.9, 2500, 4, ytop, { fill: 'red', fillAlpha: 0.12, hatch: true, stroke: false });
          sl.text('beyond the fit range / dissociation', 4, 2500 + 40, { align: 'right', size: 11, color: 'red', dx: -6 });
          sl.path(pts, { color: 'accent', width: 3 });
          sl.dot(l, Ta, { r: 8, color: 'gold' });
          // right
          const xs = []; for (let T = 298; T <= 3400; T += 60) xs.push(T);
          const top2 = Math.max(Q * 1.25, Hp(m, 3400) * 1.02);
          sh.setView([298, 3400], [0, top2]);
          sh.rect(2500, 0, 3400, top2, { fill: 'red', fillAlpha: 0.12, hatch: true, stroke: false });
          sh.fn((T) => Hp(m, T), { color: 'ink', width: 3, domain: [298, 3400] });
          sh.hline(Q, { color: 'green', width: 2, dash: true });
          sh.text(`available: ${Q.toFixed(0)} kJ`, 330, Q, { align: 'left', size: 12, color: 'green', dy: -10 });
          sh.vline(Ta, { color: 'accent', width: 1.4, dash: true });
          sh.dot(Ta, Q, { r: 7, color: 'accent' });
          sh.text(`$T_\\mathrm{ad}$ = ${Ta.toFixed(0)} K`, Ta, 0, { dx: -6, dy: -12, align: 'right', size: 12, color: 'accent' });
          const Tt = hd.x, absorbed = Hp(m, Tt);
          hd.set(Tt, absorbed);
          info = { Ta, Q, Tt, absorbed, l, x, nP: m.prod, QH, hr: Hr(m, Ti) };
        });
        v.legend([['ink', 'enthalpy the products can absorb'], ['green', 'energy available', { dash: true }]]);
        v.readout(() => {
          const p = info.nP, N = Object.values(p).reduce((a, b) => a + b, 0);
          return `Products per mole CH₄: CO₂ 1, H₂O 2, N₂ ${v.fix(p.N2, 2)}, O₂ ${v.fix(p.O2, 2)} (${v.fix(N, 2)} mol). Energy available: $-\\Delta_rH^\\circ = ${v.fix(info.QH, 1)}$ kJ${info.hr > 0.05 ? ` + ${v.fix(info.hr, 1)} kJ of preheat` : ''}; $T_\\text{ad} = ${v.fix(info.Ta, 0)}$ K. At the trial $T = ${v.fix(info.Tt, 0)}$ K the products would absorb $${v.fix(info.absorbed, 0)}$ kJ: ${info.absorbed > info.Q ? `${v.fix(info.absorbed - info.Q, 0)} kJ too much, so the flame cannot get that hot` : `${v.fix(info.Q - info.absorbed, 0)} kJ left over, so the flame gets hotter`}.`;
        });
      },
    },
  ],
};
