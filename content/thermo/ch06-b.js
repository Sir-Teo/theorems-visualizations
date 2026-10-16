// Thermodynamics & Statistical Mechanics — Chapter 6 (part b): solids and molecules, equipartition, Maxwell, ensembles, magnetism
import { clamp, lerp, KB, NA, HP, AMU, lnEin, lnFac, canon, geomDraw, cEin, gauss, tRamp, pick, hsGas, drawGas, runBudget, simClock } from './ch06.shared.js';

// ---------- helpers for this file ----------
const fix = (x, d = 3) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
const Rg = 8.314462618; // J/(mol K), CODATA 2018
const bis = (f, a, b, n = 80) => { let fa = f(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
/** Debye function: C/3Nk for a Debye solid at T/θ_D = t (T³ law at low t, 1 at high t). */
function debye(t) {
  const up = Math.min(1 / t, 60), n = 240, h = up / n;
  const f = (x) => (x < 1e-5 ? x * x : (x ** 4 * Math.exp(x)) / (Math.exp(x) - 1) ** 2);
  let s = f(0) + f(up);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return 3 * t ** 3 * (s * h) / 3;
}

export default {
  collection: 'thermo',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11', kind: 'Model', name: 'Einstein model of a solid',
      statement: String.raw`Model a solid of $N$ atoms as $3N$ independent quantum oscillators of one frequency $\omega$. With $\theta_E=\hbar\omega/k$ the heat capacity is
$$C_V=3Nk\,\frac{(\theta_E/T)^2e^{\theta_E/T}}{\bigl(e^{\theta_E/T}-1\bigr)^2}.$$
It tends to the classical value $3Nk$ for $T\gg\theta_E$, and falls to zero as $C_V\approx3Nk(\theta_E/T)^2e^{-\theta_E/T}$ for $T\ll\theta_E$. This was the first quantum explanation of why heat capacities fall at low temperature; the observed fall is slower (a $T^3$ law for insulators, Debye, ch. 9), because real solids have a spread of frequencies.`,
      idea: String.raw`Each oscillator has levels $(n+\frac12)\hbar\omega$, so its partition function is a geometric series and $U=\frac{\hbar\omega}{2}\coth\frac{\hbar\omega}{2kT}$ per mode (6.3, qm-4.3). Differentiating gives $C_V$. When $kT\ll\hbar\omega$ an oscillator cannot absorb an energy quantum except by a rare Boltzmann fluctuation, and the cost $e^{-\theta_E/T}$ shuts the mode off: a degree of freedom freezing out. A real crystal also has low-frequency modes (long sound waves) that can still be excited, which is why the true fall is only a power law.`,
      caption: String.raw`**Move the Einstein temperature** or fit it to the room-temperature heat capacity of a stiff element (diamond, graphite, boron, beryllium, silicon; the fit uses the measured $C_P$ at 298 K, within about 1 % of $C_V$ for these). Left: $C_V/3Nk$ against $T$ for the Einstein model (blue) and a Debye curve with $\theta_D=\frac43\theta_E$ (orange dashed, a rough match). Right: the same on log-log axes, where the exponential Einstein fall-off parts company with the $T^3$ power law.`,
      deps: ['thermo-6.3', 'thermo-5.3', 'qm-4.3'], refs: ['Kardar §6.2'], tags: ['solid', 'heat capacity', 'quantization'],
      credit: 'Einstein, 1907',
      links: { doi: 'https://doi.org/10.1002/andp.19063270110' },
      scope: String.raw`A one-frequency caricature: $\theta_E$ is a fitted parameter rather than a measured frequency. It ignores anharmonicity, electrons and the spread of phonon frequencies.`,
      viz(v) {
        const FIT = { diamond: 6.115, graphite: 8.517, boron: 11.087, beryllium: 16.443, silicon: 19.789 };
        const th = v.slider('Einstein temperature $\\theta_E$ (K)', 50, 3000, 800, { log: true, sig: 3 });
        const fit = v.select('fit $\\theta_E$ to $C_P(298\\,\\mathrm K)$ of', [{ value: 'free', label: 'free' }, { value: 'diamond', label: 'diamond' }, { value: 'graphite', label: 'graphite' }, { value: 'boron', label: 'boron' }, { value: 'beryllium', label: 'Be' }, { value: 'silicon', label: 'Si' }], 'free', {
          onChange: (k) => { if (k !== 'free') th.set(clamp(298.15 * bis((y) => cEin(y) - FIT[k] / (3 * Rg), 0.01, 40), 50, 3000)); },
        });
        const kT = v.slider('temperature $T$ (K)', 5, 1500, 298.15, { log: true, sig: 3 });
        const sa = v.stage({ x: [0, 1500], y: [0, 1.1], axes: 'box', gutter: true, height: 290, xlabel: '$T$ (K)', ylabel: '$C_V/3Nk$', title: 'linear axes', weight: 1 });
        const sb = v.stage({ x: [5, 1500], xlog: true, y: [1e-4, 1.5], ylog: true, axes: 'box', gutter: true, height: 290, xlabel: '$T$ (K)', ylabel: '$C_V/3Nk$', title: 'log–log axes', weight: 1 });
        let st = null;
        v.render(() => {
          const TE = th.value, T = kT.value, TD = 4 * TE / 3;
          const fE = (t) => cEin(TE / t), fD = (t) => debye(t / TD);
          sa.fn(fE, { color: 'accent', width: 2.6, n: 160, domain: [1, 1500] }); sa.fn(fD, { color: 'orange', width: 2, dash: true, n: 120, domain: [1, 1500] });
          sa.hline(1, { color: 'faint', dash: true });
          sb.fn(fE, { color: 'accent', width: 2.6, n: 160 }); sb.fn(fD, { color: 'orange', width: 2, dash: true, n: 120 });
          sa.vline(T, { color: 'faint', dash: true }); sa.dot(T, fE(T), { r: 5.5, color: 'gold' }); sb.dot(T, Math.max(fE(T), 1.2e-4), { r: 5.5, color: 'gold' });
          sa.vline(TE, { color: 'green', dash: true, alpha: 0.7 }); sb.vline(TE, { color: 'green', dash: true, alpha: 0.7 });
          st = { TE, T, cE: fE(T), cD: fD(T), TD };
        });
        v.legend([['accent', 'Einstein'], ['orange', 'Debye ($\\theta_D=\\frac43\\theta_E$)', { dash: true }], ['green', '$T=\\theta_E$', { dash: true }]]);
        v.readout(() => st && `$\\theta_E=${fix(st.TE, 0)}$ K: at $T=${fix(st.T, 1)}$ K the Einstein model gives $C_V/3Nk=${fix(st.cE, 4)}$ (molar $C_V=${fix(3 * Rg * st.cE, 2)}$ J/(mol K); classical $3R=${fix(3 * Rg, 2)}$) · Debye comparison curve ${fix(st.cD, 4)} · at $T=\\theta_E$ the model has reached ${fix(100 * cEin(1), 1)} % of $3Nk$`);
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12', kind: 'Theorem', name: 'Equipartition theorem',
      statement: String.raw`For a classical system in the canonical ensemble with Hamiltonian $H$ and any two phase-space coordinates $\xi_i,\xi_j$,
$$\Bigl\langle \xi_i\,\frac{\partial H}{\partial\xi_j}\Bigr\rangle=\delta_{ij}\,kT.$$
In particular every degree of freedom that enters the energy **quadratically**, $E=\frac12a\xi^2$, has mean energy $\frac12kT$: a free particle has $\frac32kT$ of kinetic energy, a harmonic oscillator $kT$ (kinetic plus potential), an $N$-atom ideal gas $\frac f2NkT$ with $f$ quadratic terms. A term $|\xi|^s$ has mean $kT/s$.`,
      idea: String.raw`Integrate by parts in $\xi_j$ over the Boltzmann weight: $\int\xi_i\,\partial_jH\,e^{-\beta H}=-\frac1\beta\int\xi_i\,\partial_je^{-\beta H}=\frac1\beta\delta_{ij}\int e^{-\beta H}$, the boundary terms vanishing because $e^{-\beta H}\to0$ (this uses the Gaussian integral, pma-8.21, in the quadratic case). For $E=\frac12a\xi^2$ one has $\xi\,\partial_\xi E=2E$, hence $\langle E\rangle=\frac12kT$. It is a classical result: it needs the energy levels to be so close compared with $kT$ that sums are integrals; when they are not the mode freezes out (6.14).`,
      caption: String.raw`Five Monte Carlo ensembles of 600 copies each start **cold** ($E=0$) and exchange energy with a bath at $kT=1$ (Metropolis steps; time = sweeps). Each line is the average energy per copy: a free particle $p^2/2$ (→ ½), a classical oscillator $(p^2+x^2)/2$ (→ 1), a quartic well $x^4$ (→ ¼), an ultra-relativistic $|p|$ (→ 1; equipartition is *not* "½ per degree of freedom"), and a **quantum oscillator** whose level spacing $\hbar\omega/kT$ you set: for large spacing its energy above the zero-point stays frozen near zero.`,
      deps: ['thermo-6.1', 'pma-8.21'], refs: ['Schroeder §6.3'], tags: ['equipartition', 'classical limit'],
      credit: 'Waterston, 1840s; Maxwell, 1860; Boltzmann, 1868–1871', verify: true,
      scope: String.raw`Classical statistical mechanics: every quadratic mode has $\frac12kT$ only if its level spacing is $\ll kT$ and the mode is in equilibrium. Fails for stiff modes (freezing out) and for degrees of freedom with a hard cutoff.`,
      viz(v) {
        const Y = v.slider('quantum oscillator: $\\hbar\\omega/kT$', 0.1, 8, 4, { step: 0.1, onChange: () => S.reset() });
        const M = 600, rng = v.rng(17);
        const names = ['free $p^2/2$', 'oscillator', 'quartic $x^4$', 'ultra-rel. $|p|$', 'quantum osc.'];
        const cols = ['accent', 'green', 'orange', 'purple', 'red'];
        const D = [1, 2, 1, 1, 1], st = [2.2, 2.2, 1.3, 3.2, 1];
        const En = [(c) => 0.5 * c[0] * c[0], (c) => 0.5 * (c[0] * c[0] + c[1] * c[1]), (c) => c[0] ** 4, (c) => Math.abs(c[0]), (c) => c[0] * Y.value];
        const S = v.sim(
          () => ({ x: D.map((d) => new Float64Array(M * d)), h: [[], [], [], [], []], xdx: [0, 0, 0, 0], sweeps: 0 }),
          (s) => {
            const tmp = [0, 0], tmp2 = [0, 0];
            for (let k = 0; k < 5; k++) {
              const d = D[k], X = s.x[k]; let sum = 0, xd = 0;
              for (let i = 0; i < M; i++) {
                for (let rep = 0; rep < 2; rep++) {
                  const j = d === 2 ? (rng() < 0.5 ? 0 : 1) : 0;
                  for (let q = 0; q < d; q++) { tmp[q] = X[i * d + q]; tmp2[q] = tmp[q]; }
                  if (k === 4) tmp2[0] = Math.max(0, tmp[0] + (rng() < 0.5 ? 1 : -1)); else tmp2[j] = tmp[j] + st[k] * rng.normal();
                  const dE = En[k](tmp2) - En[k](tmp);
                  if (dE <= 0 || rng() < Math.exp(-dE)) for (let q = 0; q < d; q++) X[i * d + q] = tmp2[q];
                }
                sum += En[k](X.subarray(i * d, i * d + d));
              }
              s.h[k].push(sum / M);
            }
            s.sweeps++;
          }, { dt: 0.05, maxSteps: 4000 });
        const sa = v.stage({ x: [0, 400], y: [0, 1.4], axes: 'box', gutter: true, height: 290, xlabel: 'sweeps (time)', ylabel: '$\\langle E\\rangle/kT$', title: 'energy per copy, started cold', weight: 1.3 });
        const sb = v.stage({ x: [-0.6, 4.6], y: [0, 1.4], axes: 'box', gutter: true, height: 290, ylabel: '$\\langle E\\rangle/kT$', title: 'averaged over the last 100 sweeps', weight: 0.9, xticks: [[0, 'p²/2'], [1, 'osc.'], [2, 'x⁴'], [3, '|p|'], [4, 'quantum']] });
        let info = null;
        v.animate((t) => {
          const s = S.advance(t) || S.state;
          const n = s.h[0].length, tmax = Math.max(100, Math.ceil(n / 100) * 100);
          sa.setView([0, tmax], [0, 1.4]);
          const th = [0.5, 1, 0.25, 1, (y) => y / (Math.exp(y) - 1)];
          const ref = [0.5, 1, 0.25, 1, Y.value / (Math.exp(Y.value) - 1)];
          ref.forEach((r, k) => sa.hline(r, { color: cols[k], dash: true, alpha: 0.45, width: 1 }));
          s.h.forEach((hk, k) => sa.path(hk.map((e, i) => [i + 1, e]), { color: cols[k], width: 1.8 }));
          const avg = s.h.map((hk) => { const w = hk.slice(-100); return w.reduce((a, b) => a + b, 0) / Math.max(1, w.length); });
          avg.forEach((a, k) => { sb.rect(k - 0.35, 0, k + 0.35, a, { fill: cols[k], fillAlpha: 0.6, color: cols[k], width: 1 }); sb.line(k - 0.42, ref[k], k + 0.42, ref[k], { color: 'ink', width: 2 }); });
          info = { avg, ref, n };
        }, { still: 14 });
        v.legend(names.map((nm, k) => [cols[k], nm]).concat([['ink', 'prediction']]));
        v.readout(() => info && `after ${info.n} sweeps: free $p^2/2$ **${fix(info.avg[0], 3)}** (½) · oscillator **${fix(info.avg[1], 3)}** (1) · $x^4$ **${fix(info.avg[2], 3)}** (¼) · $|p|$ **${fix(info.avg[3], 3)}** (1) · quantum, $\\hbar\\omega/kT=${fix(Y.value, 1)}$: **${fix(info.avg[4], 3)}** (exact $y/(e^y-1)=${fix(info.ref[4], 3)}$, classical value 1)\nthe theorem's $\\langle\\xi\\,\\partial H/\\partial\\xi\\rangle=kT$ holds for each classical case: $p\\cdot p=2E$, $x\\cdot4x^3=4E$, $p\\cdot\\mathrm{sgn}\\,p=E$`);
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13', kind: 'Law', name: 'Dulong–Petit law',
      statement: String.raw`At sufficiently high temperature the molar heat capacity of a crystalline solid approaches
$$C_V\approx3R\approx24.9\ \mathrm{J\,mol^{-1}K^{-1}},$$
independent of the element: $3$ quadratic kinetic plus $3$ quadratic potential terms per atom, each contributing $\frac12R$ (equipartition, 6.12). Elements with stiff bonds and light atoms (diamond, boron, beryllium, silicon) fall short of $3R$ at room temperature because their vibrations are partly frozen out (6.11).`,
      idea: String.raw`Treat each atom as a 3D harmonic oscillator about its lattice site: six quadratic energy terms, so $U=3NkT$ and $C_V=3Nk$ by 6.12. The Einstein model (6.11) shows where this fails: the approach to $3Nk$ is complete only when $kT\gg\hbar\omega$, and diamond's high vibrational frequencies put its room-temperature heat capacity at a quarter of $3R$. The measured $C_P$ of metals can slightly exceed $3R$ because $C_P-C_V$ and electronic and anharmonic terms add to the oscillator value.`,
      caption: String.raw`**Bars:** measured molar heat capacity $C_P$ at 25 °C of 23 elements (data below). The dashed line is $3R$; the green bars are within 12 % of it, orange are below, purple above. **Pick a stiff element** and slide the temperature: the Einstein curve with $\theta_E$ fitted to that element's 298 K value shows the approach to $3R$ as it is heated, and why light stiff elements do not follow the law at room temperature.`,
      deps: ['thermo-6.12', 'thermo-6.11'], refs: ['Schroeder §6.3'], tags: ['solids', 'heat capacity'],
      credit: 'Dulong & Petit, 1819',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dulong%E2%80%93Petit_law' },
      scope: String.raw`Data: $C_P$ at 25 °C from the CRC Handbook of Chemistry and Physics (84th ed.), as tabulated on Wikipedia's "Heat capacities of the elements (data page)", fetched Oct 2026; the Einstein curves are a model fitted to one point each, not measurements, and use $C_P\approx C_V$.`,
      viz(v) {
        const D = [['Li', 24.86], ['Be', 16.443], ['B', 11.087], ['C(gr)', 8.517], ['C(di)', 6.115], ['Na', 28.23], ['Mg', 24.869], ['Al', 24.2], ['Si', 19.789], ['K', 29.6], ['Ca', 25.929], ['Ti', 25.06], ['Cr', 23.35], ['Fe', 25.1], ['Ni', 26.07], ['Cu', 24.44], ['Zn', 25.39], ['Ag', 25.35], ['Sn', 27.112], ['W', 24.27], ['Pt', 25.86], ['Au', 25.418], ['Pb', 26.65]];
        const R3 = 3 * Rg;
        const sel = v.select('Einstein curve fitted to', [{ value: 4, label: 'diamond' }, { value: 3, label: 'graphite' }, { value: 2, label: 'boron' }, { value: 1, label: 'beryllium' }, { value: 8, label: 'silicon' }], 4);
        const kT = v.slider('temperature $T$ (K)', 20, 1500, 298.15, { log: true, sig: 3 });
        const sa = v.stage({ x: [-0.8, 22.8], y: [0, 32], axes: 'box', gutter: true, height: 290, ylabel: '$C_P$ (J mol⁻¹ K⁻¹) at 25 °C', title: 'measured heat capacities of the elements', weight: 1.5, xticks: D.map((d, i) => [i, d[0]]) });
        const sb = v.stage({ x: [0, 1500], y: [0, 1.15], axes: 'box', gutter: true, height: 290, xlabel: '$T$ (K)', ylabel: '$C/3R$', title: 'Einstein curve through the chosen point', weight: 1 });
        let st = null;
        v.render(() => {
          const k = +sel.value, Cp = D[k][1], y = bis((yy) => cEin(yy) - Cp / R3, 0.01, 40), TE = 298.15 * y, T = kT.value;
          D.forEach((d, i) => {
            const r = d[1] / R3, c = Math.abs(r - 1) <= 0.12 ? 'green' : r < 1 ? 'orange' : 'purple';
            sa.rect(i - 0.38, 0, i + 0.38, d[1], { fill: c, fillAlpha: i === k ? 0.95 : 0.55, color: i === k ? 'ink' : c, width: i === k ? 2 : 1 });
          });
          sa.hline(R3, { color: 'ink', dash: true, width: 1.6 });
          sa.text('$3R=24.94$', 22.6, R3, { size: 11, color: 'muted', align: 'right', dy: -8 });
          sb.fn((t) => cEin(TE / t), { color: 'accent', width: 2.6, n: 200, domain: [2, 1500] });
          sb.hline(1, { color: 'ink', dash: true });
          sb.dot(298.15, Cp / R3, { r: 6, color: 'red' }); sb.vline(T, { color: 'faint', dash: true }); sb.dot(T, cEin(TE / T), { r: 5.5, color: 'gold' });
          sb.text('measured, 298 K', 298.15, Cp / R3, { dx: 10, dy: 12, size: 11, color: 'red' });
          st = { Cp, TE, c: cEin(TE / T), T, name: D[k][0], within: D.filter((d) => Math.abs(d[1] / R3 - 1) <= 0.12).length };
        });
        v.legend([['green', 'within 12 % of $3R$', { area: true }], ['orange', 'below', { area: true }], ['purple', 'above', { area: true }], ['red', 'data point used for the fit', { dot: true }]]);
        v.readout(() => st && `${st.within} of 23 elements lie within 12 % of $3R$ · ${st.name}: $C_P(298)/3R=${fix(st.Cp / R3, 3)}$ gives $\\theta_E\\approx${fix(st.TE, 0)}$ K · at $T=${fix(st.T, 0)}$ K the fitted model gives $C/3R=${fix(st.c, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 6.14
    {
      num: '6.14', kind: 'Phenomenon', name: 'Freezing out of degrees of freedom',
      statement: String.raw`A degree of freedom with a spacing $\Delta$ between its levels contributes to the heat capacity only when $kT\gtrsim\Delta$. For a diatomic gas the molar $C_V/k$ per molecule therefore climbs in steps, $\frac32\to\frac52\to\frac72$, as translation (always), rotation ($kT\gtrsim\hbar^2/2I$, $\theta_{\rm rot}=87.5$ K for H$_2$, $2.9$ K for N$_2$) and vibration ($kT\gtrsim\hbar\omega$, $\theta_{\rm vib}\approx6300$ K for H$_2$, $3400$ K for N$_2$) are each unfrozen in turn. At room temperature most diatomic gases show $\frac52k$.`,
      idea: String.raw`Equipartition (6.12) counts a mode as $\frac12kT$ only if its energy levels are dense on the scale $kT$. The rotational levels $\theta_{\rm rot}J(J+1)$ and the vibrational levels $\theta_{\rm vib}(v+\frac12)$ are a ladder of spacing $\theta$; for $T\ll\theta$ the Boltzmann factor $e^{-\theta/T}$ (6.1) keeps the molecule in its ground state, and the mode contributes nothing. The curves are computed exactly from the partition function of each mode: a rigid rotor (with nuclear-spin weights for the homonuclear molecules) and an anharmonic oscillator with the tabulated $\omega_e$, $\omega_ex_e$.`,
      caption: String.raw`Choose the gas and **move the temperature**. The blue curve is $C_V/k$ computed from the partition functions of translation (exactly $\frac32$), rotation and vibration; the right-hand panel stacks the three contributions at the chosen $T$. Gold dots are $C_P/R-1$ from the NIST–JANAF tables (equilibrium ideal gas, 1 bar). For H$_2$ compare the **equilibrium** mixture of ortho and para with the metastable **normal** 3:1 mixture: the rotational step differs between 50 and 200 K.`,
      deps: ['thermo-6.12', 'qm-8.14', 'qm-4.3'], refs: ['Tong ch. 2'], tags: ['heat capacity', 'quantization', 'molecules'],
      credit: 'Eucken, 1912', verify: true,
      scope: String.raw`Ideal-gas, rigid-rotor / anharmonic-oscillator model with spectroscopic constants from the NIST Chemistry WebBook (H$_2$: $B_e=60.853$, $\omega_e=4401.213$, $\omega_ex_e=121.336$ cm$^{-1}$; N$_2$: $B_e=1.998241$, $\omega_e=2358.57$, $\omega_ex_e=14.324$ cm$^{-1}$); no rotation–vibration coupling, so small deviations from the tables at high $T$. Heat-capacity data: NIST–JANAF Thermochemical Tables (janaf.nist.gov), fetched Oct 2026.`,
      viz(v) {
        const C2 = 1.438777; // hc/k in cm K
        const GAS = {
          h2e: { B: 60.853, we: 4401.213, wx: 121.336, nu: 'H2eq', label: 'H₂ equilibrium' },
          h2n: { B: 60.853, we: 4401.213, wx: 121.336, nu: 'H2norm', label: 'H₂ normal (3:1)' },
          n2: { B: 1.998241, we: 2358.57, wx: 14.324, nu: 'N2', label: 'N₂' },
        };
        const JAN = {
          h2: [[100, 28.154], [200, 27.447], [298.15, 28.836], [500, 29.26], [1000, 30.205], [1500, 32.298], [2000, 34.28], [3000, 37.087]],
          n2: [[100, 29.104], [200, 29.107], [298.15, 29.124], [500, 29.58], [1000, 32.697], [1500, 34.843], [2000, 35.971], [3000, 37.03]],
        };
        const gas = v.select('gas', Object.entries(GAS).map(([value, q]) => ({ value, label: q.label })), 'h2e');
        const kT = v.slider('temperature $T$ (K)', 10, 4000, 300, { log: true, sig: 3 });
        const cache = new Map();
        const rotLevels = (g, par) => {
          const th = C2 * g.B, out = [];
          for (let J = 0; J < 140; J++) {
            if (par === 'even' && J % 2) continue; if (par === 'odd' && J % 2 === 0) continue;
            const w = (2 * J + 1) * (g.nu === 'H2eq' ? (J % 2 ? 3 : 1) : g.nu === 'N2' ? (J % 2 ? 3 : 6) : 1);
            out.push({ E: th * J * (J + 1), g: w });
          }
          return out;
        };
        const vibLevels = (g) => { const G0 = 0.5 * g.we - 0.25 * g.wx, out = []; for (let n = 0; n < (g.we / (2 * g.wx) > 40 ? 40 : 14); n++) out.push({ E: C2 * ((g.we * (n + 0.5) - g.wx * (n + 0.5) ** 2) - G0), g: 1 }); return out; };
        const parts = (key, T) => {
          const ck = key + '|' + T; if (cache.has(ck)) return cache.get(ck);
          const g = GAS[key], b = 1 / T;
          let rot;
          if (g.nu === 'H2norm') rot = 0.25 * canon(rotLevels(g, 'even'), b).C + 0.75 * canon(rotLevels(g, 'odd'), b).C;
          else rot = canon(rotLevels(g), b).C;
          const vib = canon(vibLevels(g), b).C, out = { tr: 1.5, rot, vib, tot: 1.5 + rot + vib };
          cache.set(ck, out); return out;
        };
        const sa = v.stage({ x: [10, 4000], xlog: true, y: [1.2, 3.8], axes: 'box', gutter: true, height: 300, xlabel: '$T$ (K)', ylabel: '$C_V/k$ per molecule', title: 'heat capacity of a diatomic gas', weight: 1.4 });
        const sb = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, height: 300, weight: 0.5, minWidth: 150, ylabel: '$C_V/k$', title: 'contributions', xticks: [] });
        let st = null;
        v.render(() => {
          const key = gas.value, T = kT.value;
          [1.5, 2.5, 3.5].forEach((y) => { sa.hline(y, { color: 'faint', dash: true }); sa.text(`${y}`, 12, y, { size: 11, color: 'muted', dy: -8 }); });
          sa.fn((t) => parts(key, t).tot, { color: 'accent', width: 2.6, n: 170, domain: [10, 4000] });
          const dat = JAN[key === 'n2' ? 'n2' : 'h2'];
          dat.forEach(([t, cp]) => sa.dot(t, cp / Rg - 1, { r: 4.5, color: 'gold' }));
          const p = parts(key, T);
          sa.vline(T, { color: 'faint', dash: true }); sa.dot(T, p.tot, { r: 6, color: 'accent', hollow: true });
          let y0 = 0;
          [['tr', 'blue'], ['rot', 'orange'], ['vib', 'green']].forEach(([k, c]) => { sb.rect(0.25, y0, 0.75, y0 + p[k], { fill: c, fillAlpha: 0.65, color: c, width: 1 }); y0 += p[k]; });
          st = { T, p, key };
        });
        v.legend([['accent', 'model (partition functions)'], ['gold', 'NIST–JANAF $C_P/R-1$', { dot: true }], ['blue', 'translation', { area: true }], ['orange', 'rotation', { area: true }], ['green', 'vibration', { area: true }]]);
        v.readout(() => st && `$T=${fix(st.T, 0)}$ K: $C_V/k=${fix(st.p.tot, 3)}$ = ${fix(st.p.tr, 3)} (translation) + ${fix(st.p.rot, 3)} (rotation) + ${fix(st.p.vib, 3)} (vibration) · rotational $\\theta=${fix(C2 * GAS[st.key].B, 1)}$ K, vibrational $\\theta=${fix(C2 * GAS[st.key].we, 0)}$ K`);
      },
    },
    // ------------------------------------------------------------------ 6.15
    {
      num: '6.15', kind: 'Model', name: 'Maxwell speed distribution',
      statement: String.raw`In a dilute classical gas of molecules of mass $m$ at temperature $T$, each velocity component is Gaussian and independent, so the speed $v=|\mathbf v|$ has density
$$f(v)=4\pi\Bigl(\frac{m}{2\pi kT}\Bigr)^{3/2}v^2e^{-mv^2/2kT},$$
with most probable speed $v_{\rm mp}=\sqrt{2kT/m}$, mean speed $\bar v=\sqrt{8kT/\pi m}=\tfrac{2}{\sqrt\pi}v_{\rm mp}$ and rms speed $v_{\rm rms}=\sqrt{3kT/m}$.`,
      idea: String.raw`The energy of a molecule is $\frac12mv^2$ plus other terms that do not involve $\mathbf v$, so the Boltzmann factor (6.1) makes $\mathbf v$ Gaussian with variance $kT/m$ in each component (the equipartition value, 6.12). The speed density is that Gaussian integrated over a shell of area $4\pi v^2$: a rising $v^2$ (more phase space) times a falling exponential (Boltzmann factor). Maxwell obtained the same law in 1860 from the demand that the components be independent and the distribution isotropic; collisions are what drive a gas to it.`,
      caption: String.raw`An **exact hard-sphere gas** (400 molecules) starts in an artificial state of your choice (all with the same speed, two speeds, or a beam along $x$). Bars show the speed histogram averaged over the last few time units and the curve is the Maxwell law for the **measured** kinetic energy. Within ten or so collisions per molecule the histogram relaxes onto the Maxwell curve, the component distribution (right) becomes Gaussian, and the three marked speeds fall in the ratio $1:1.128:1.225$.`,
      deps: ['thermo-6.1', 'thermo-6.12'], refs: ['Schroeder §6.4'], tags: ['kinetic theory', 'speed distribution'],
      credit: 'Maxwell, 1860; Boltzmann, 1868',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maxwell%E2%80%93Boltzmann_distribution' },
      scope: String.raw`A classical dilute gas in equilibrium; for $\mathrm N_2$ at 300 K, $v_{\rm mp}\approx422$ m/s, $\bar v\approx476$ m/s and $v_{\rm rms}\approx517$ m/s. Here units are $m=\sigma=k=1$.`,
      viz(v) {
        const N = 400, Lw = 10, X = 16, bins = 28, vmax = 4;
        const start = v.select('initial state', [{ value: 'one', label: 'all one speed' }, { value: 'two', label: 'two speeds' }, { value: 'beam', label: 'beam along $x$' }], 'one', { onChange: () => make() });
        let G, snaps, nextSnap;
        const histOf = (arr) => { const c = new Array(bins).fill(0); for (let i = 0; i < N; i++) { const s = Math.hypot(G.vx[i], G.vy[i], G.vz[i]); const k = Math.floor(s / vmax * bins); if (k < bins) c[k]++; } return c; };
        const comp = () => { const c = new Array(bins).fill(0); for (let i = 0; i < N; i++) for (const u of [G.vx[i], G.vy[i], G.vz[i]]) { const k = Math.floor((u + vmax) / (2 * vmax) * bins); if (k >= 0 && k < bins) c[k]++; } return c; };
        const make = () => {
          clock.kick(0);
          G = hsGas({ species: [{ m: 1, d: 0.8, dof: 0 }], counts: [N], Ly: Lw, Lz: Lw, T: 1, rng: v.rng(5), piston: { X } });
          const r = v.rng(9);
          for (let i = 0; i < N; i++) {
            const sp = start.value === 'two' ? (i % 2 ? 2.0 : 0.7) : 1.5;
            let dx = r.normal(), dy = r.normal(), dz = r.normal(); const nn = Math.hypot(dx, dy, dz);
            if (start.value === 'beam') { dx = r() < 0.5 ? 1 : -1; dy = 0; dz = 0; } else { dx /= nn; dy /= nn; dz /= nn; }
            G.vx[i] = sp * dx; G.vy[i] = sp * dy; G.vz[i] = sp * dz;
          }
          G.repredict(); snaps = []; nextSnap = 0;
        };
        const clock = simClock(3, 0.25, 0);
        make();
        const sc = v.stage({ x: [-1, X + 2], y: [-1, Lw + 1], equal: true, height: 150, axes: false, full: true, title: 'the gas (colour = speed)' });
        const sa = v.stage({ x: [0, vmax], y: [0, 1], axes: 'box', gutter: true, height: 270, xlabel: 'speed $v$', ylabel: 'density $f(v)$', title: 'speed distribution', weight: 1.2 });
        const sb = v.stage({ x: [-vmax, vmax], y: [0, 1], axes: 'box', gutter: true, height: 270, xlabel: 'velocity component $v_x$', ylabel: 'density', title: 'components', weight: 1 });
        let st = null;
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.25, clock.ms(), () => { if (G.t >= nextSnap) { snaps.push(histOf()); if (snaps.length > 10) snaps.shift(); nextSnap = G.t + 0.5; } });
          const rp = tRamp(v);
          drawGas(sc, G, { color: (i) => pick(rp, Math.hypot(G.vx[i], G.vy[i], G.vz[i]) / 3.2), len: X, piston: false, scale: 1 });
          const K = G.stats().K / N, kTm = 2 * K / 3, bw = vmax / bins;
          const avg = new Array(bins).fill(0); snaps.forEach((h) => h.forEach((c, k) => { avg[k] += c / snaps.length; }));
          const dens = avg.map((c) => c / N / bw);
          const fM = (s) => 4 * Math.PI * Math.pow(1 / (2 * Math.PI * kTm), 1.5) * s * s * Math.exp(-s * s / (2 * kTm));
          const top = Math.max(0.8, ...dens, fM(Math.sqrt(2 * kTm))) * 1.15;
          sa.setView([0, vmax], [0, top]);
          dens.forEach((d, k) => sa.rect(k * bw, 0, (k + 1) * bw, d, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 }));
          sa.fn(fM, { color: 'orange', width: 2.4, n: 200 });
          const vmp = Math.sqrt(2 * kTm), vm = Math.sqrt(8 * kTm / Math.PI), vr = Math.sqrt(3 * kTm);
          [[vmp, 'v_mp'], [vm, 'mean'], [vr, 'rms']].forEach(([x, lab], i) => { sa.vline(x, { color: 'green', dash: true, alpha: 0.8 }); sa.text(lab, x, top * (0.95 - 0.07 * i), { size: 11, color: 'green', dx: 4 }); });
          const cc = comp(), cw = 2 * vmax / bins, cs = cc.map((c) => c / (3 * N) / cw);
          sb.setView([-vmax, vmax], [0, Math.max(...cs, gauss(0, 0, Math.sqrt(kTm))) * 1.2]);
          cs.forEach((d, k) => sb.rect(-vmax + k * cw, 0, -vmax + (k + 1) * cw, d, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }));
          sb.fn((x) => gauss(x, 0, Math.sqrt(kTm)), { color: 'orange', width: 2.4, n: 160 });
          let sm = 0; for (let i = 0; i < N; i++) sm += Math.hypot(G.vx[i], G.vy[i], G.vz[i]);
          st = { kT: kTm, mean: sm / N, vm, vmp, vr, col: G.ncol / N, t: G.t };
        }, { still: 8 });
        v.legend([['accent', 'simulation'], ['orange', 'Maxwell law at the measured $kT$'], ['green', 'marked speeds', { dash: true }]]);
        v.readout(() => st && `$t=${fix(st.t, 1)}$, ${fix(st.col, 1)} collisions per molecule · $kT=${fix(st.kT, 3)}$ · mean speed measured **${fix(st.mean, 3)}** vs Maxwell $\\sqrt{8kT/\\pi m}=${fix(st.vm, 3)}$ · $v_{\\rm mp}=${fix(st.vmp, 3)}$, $v_{\\rm rms}=${fix(st.vr, 3)}$`);
      },
    },
