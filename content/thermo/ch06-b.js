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

/** Advance a charge (x, y, vx, vy) on its exact cyclotron arc (rate Om) for time tau inside a disc of radius R, reflecting specularly at the wall at the exact hitting time (found by bisection). */
function arcStep(p, tau, Om, R) {
  const arc = (t) => { const c = Math.cos(Om * t), s = Math.sin(Om * t); return { x: p.x + (p.vx * s - p.vy * (1 - c)) / Om, y: p.y + (p.vy * s + p.vx * (1 - c)) / Om, vx: p.vx * c - p.vy * s, vy: p.vx * s + p.vy * c }; };
  for (let g = 0; g < 4 && tau > 1e-12; g++) {
    const q = arc(tau);
    if (q.x * q.x + q.y * q.y <= R * R) { p.x = q.x; p.y = q.y; p.vx = q.vx; p.vy = q.vy; return; }
    let lo = 0, hi = tau;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, w = arc(m); if (w.x * w.x + w.y * w.y > R * R) hi = m; else lo = m; }
    const w = arc(lo), rr = Math.hypot(w.x, w.y), ux = w.x / rr, uy = w.y / rr, vn = w.vx * ux + w.vy * uy;
    p.x = w.x; p.y = w.y; p.vx = w.vx; p.vy = w.vy;
    if (vn > 0) { p.vx -= 2 * vn * ux; p.vy -= 2 * vn * uy; }
    tau -= lo; if (lo < 1e-12) tau -= 1e-9;
  }
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
        const D = [['Li', 24.86], ['Be', 16.443], ['B', 11.087], ['Cg', 8.517], ['Cd', 6.115], ['Na', 28.23], ['Mg', 24.869], ['Al', 24.2], ['Si', 19.789], ['K', 29.6], ['Ca', 25.929], ['Ti', 25.06], ['Cr', 23.35], ['Fe', 25.1], ['Ni', 26.07], ['Cu', 24.44], ['Zn', 25.39], ['Ag', 25.35], ['Sn', 27.112], ['W', 24.27], ['Pt', 25.86], ['Au', 25.418], ['Pb', 26.65]];
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
          sa.corner('dashed line: $3R=24.94$ J/(mol K)', 'tl', { color: 'muted' });
          sb.fn((t) => cEin(TE / t), { color: 'accent', width: 2.6, n: 200, domain: [2, 1500] });
          sb.hline(1, { color: 'ink', dash: true });
          sb.dot(298.15, Cp / R3, { r: 6, color: 'red' }); sb.vline(T, { color: 'faint', dash: true }); sb.dot(T, cEin(TE / T), { r: 5.5, color: 'gold' });
          sb.text('measured, 298 K', 298.15, Cp / R3, { dx: 10, dy: 12, size: 11, color: 'red' });
          st = { Cp, TE, c: cEin(TE / T), T, name: ({ Cg: 'graphite', Cd: 'diamond' }[D[k][0]] || D[k][0]), within: D.filter((d) => Math.abs(d[1] / R3 - 1) <= 0.12).length };
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
      caption: String.raw`Choose the gas and **move the temperature**. The blue curve is $C_V/k$ computed from the partition functions of translation (exactly $\frac32$), rotation and vibration; the right-hand panel stacks the three contributions at the chosen $T$. Gold dots are $C_P/R-1$ from the NIST–JANAF tables (equilibrium ideal gas, 1 bar). For H$_2$ compare the **equilibrium** mixture of ortho and para with the metastable **normal** 3:1 mixture: the rotational step differs between 50 and 200 K (the overshoot near 50 K in the equilibrium curve comes from para–ortho conversion).`,
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
    // ------------------------------------------------------------------ 6.16
    {
      num: '6.16', kind: 'Model', name: 'Classical ideal gas in the canonical ensemble',
      statement: String.raw`For $N$ indistinguishable non-interacting atoms of mass $m$ in a volume $V$ at temperature $T$,
$$Z=\frac{Z_1^N}{N!},\qquad Z_1=\frac{V}{\lambda^3},\qquad\lambda=\frac{h}{\sqrt{2\pi mkT}}.$$
Then $F=-kT\ln Z=-NkT\bigl[\ln\frac{V}{N\lambda^3}+1\bigr]$, whence $P=-\partial F/\partial V=NkT/V$, $U=\frac32NkT$ and the **Sackur–Tetrode** entropy $S=Nk\bigl[\ln\frac{V}{N\lambda^3}+\frac52\bigr]$. Valid when $n\lambda^3\ll1$.`,
      idea: String.raw`Independent atoms give a product of single-atom sums (6.8); the single-atom sum is the phase-space integral $\int d^3x\,d^3p\,e^{-p^2/2mkT}/h^3=V/\lambda^3$ (a Gaussian integral). The $1/N!$ corrects for the indistinguishability of identical atoms, which is what restores extensivity of $S$ (Gibbs paradox, 5.12); with Stirling's formula $\ln N!\approx N\ln N-N$ it produces $V/N$ inside the logarithm. The constant $h$ is the only trace of quantum mechanics.`,
      caption: String.raw`**Pick a gas and the conditions.** Left: the Sackur–Tetrode entropy per atom against $T$ at the chosen pressure; the gold dot is the standard molar entropy at $298.15$ K, $1$ bar, from the NIST WebBook (red). Middle: $F/NkT=\ln n\lambda^3-1$ against $\ln n\lambda^3$; the shaded region $n\lambda^3\gtrsim1$ is where the classical formula fails. Right: the pieces of $\ln Z$ for $N$ atoms.`,
      deps: ['thermo-6.8', 'thermo-5.12'], refs: ['Schroeder §6.7'], tags: ['ideal gas', 'partition function', 'Sackur–Tetrode'],
      credit: 'Sackur, 1911; Tetrode, 1912; Gibbs, 1902', verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sackur%E2%80%93Tetrode_equation' },
      scope: String.raw`Monatomic gas with no internal structure (noble gases) and $n\lambda^3\ll1$; the standard entropies are the CODATA key values quoted in the NIST WebBook.`,
      viz(v) {
        const NOB = { He: { m: 4.002602, S: 126.153 }, Ne: { m: 20.1797, S: 146.328 }, Ar: { m: 39.948, S: 154.846 }, Kr: { m: 83.798, S: 164.085 }, Xe: { m: 131.293, S: 169.685 } };
        const gas = v.select('gas', Object.keys(NOB), 'Ar');
        const Ts = v.slider('temperature $T$ (K)', 5, 2000, 298.15, { log: true, sig: 3 });
        const Pp = v.slider('pressure $P$ (bar)', 1e-3, 1e3, 1, { log: true, sig: 2 });
        const lam = (m, T) => HP / Math.sqrt(2 * Math.PI * m * AMU * KB * T);
        const sST = (m, T, P) => Math.log(KB * T / (P * lam(m, T) ** 3)) + 2.5;
        const sa = v.stage({ x: [5, 2000], xlog: true, y: [0, 25], axes: 'box', gutter: true, height: 290, xlabel: '$T$ (K)', ylabel: '$S/Nk$', title: 'Sackur–Tetrode entropy', weight: 1.1 });
        const sb = v.stage({ x: [-18, 3], y: [-20, 2], axes: 'box', gutter: true, height: 290, xlabel: '$\\ln n\\lambda^3$', ylabel: '$F/NkT$', title: 'free energy per atom', weight: 1 });
        const sc = v.stage({ x: [0, 4], y: [-10, 10], axes: 'box', gutter: true, height: 290, weight: 0.8, minWidth: 190, ylabel: 'units of $N$', title: '$\\ln Z$ for $N=10^3$ atoms', xticks: [[0.5, 'ln Z₁ᴺ'], [1.5, '−ln N!'], [2.5, 'ln Z']] });
        let st = null;
        v.render(() => {
          const g = NOB[gas.value], T = Ts.value, P = Pp.value * 1e5, m = g.m;
          sa.fn((t) => sST(m, t, P), { color: 'accent', width: 2.4, n: 160, domain: [5, 2000] });
          sa.setView([5, 2000], [-2, 25]);
          sa.fn((t) => sST(m, t, 1e5), { color: 'muted', width: 1.4, dash: true, n: 160 });
          const Smol = g.S / Rg; sa.dot(298.15, Smol, { r: 6, color: 'red' });
          sa.dot(T, sST(m, T, P), { r: 6, color: 'gold' }); sa.vline(T, { color: 'faint', dash: true });
          const x0 = -18, x1 = 3;
          sb.fn((x) => x - 1, { color: 'accent', width: 2.4, domain: [x0, x1] });
          sb.rect(0, -20, 3, 2, { fill: 'red', fillAlpha: 0.12, stroke: false });
          sb.text('quantum:  $n\\lambda^3\\gtrsim1$', 2.9, 1.2, { size: 11, color: 'red', align: 'right' });
          const n = P / (KB * T), nl3 = Math.log(n * lam(m, T) ** 3);
          sb.dot(clamp(nl3, x0, x1), clamp(nl3 - 1, -20, 2), { r: 6, color: 'gold' });
          const Nn = 1e3, V = Nn / n, lnZ1N = Nn * Math.log(V / lam(m, T) ** 3), lnNf = lnFac(Nn);
          const vals = [lnZ1N / Nn, -lnNf / Nn, (lnZ1N - lnNf) / Nn], cols = ['accent', 'orange', 'green'];
          const mx = Math.max(...vals.map(Math.abs), 1) * 1.2;
          sc.setView([0, 4], [-mx, mx]);
          vals.forEach((x, i) => sc.rect(i + 0.15, 0, i + 0.85, x, { fill: cols[i], fillAlpha: 0.65, color: cols[i], width: 1 }));
          // derived quantities by differentiating ln Z numerically
          const lnZ = (VV, TT) => Nn * Math.log(VV / lam(m, TT) ** 3) - lnFac(Nn);
          const hv = V * 1e-4, ht = T * 1e-4;
          const Pn = KB * T * (lnZ(V + hv, T) - lnZ(V - hv, T)) / (2 * hv);
          const Un = KB * T * T * (lnZ(V, T + ht) - lnZ(V, T - ht)) / (2 * ht);
          st = { nl3, S: sST(m, T, P), Smol, Sstd: sST(m, 298.15, 1e5) * Rg, Sref: g.S, Pn, P, Un, U32: 1.5 * Nn * KB * T, lam: lam(m, T) };
        });
        v.legend([['accent', '$S/Nk$ at chosen $P$'], ['muted', 'at 1 bar', { dash: true }], ['red', 'NIST $S^\\circ$ (298.15 K, 1 bar)', { dot: true }]]);
        v.readout(() => st && `$\\lambda=${fix(st.lam * 1e12, 2)}$ pm, $n\\lambda^3=${v.sci(Math.exp(st.nl3), 2)}$ · $S/Nk=${fix(st.S, 3)}$ · Sackur–Tetrode $S^\\circ(298.15\\,\\mathrm K,1\\,\\mathrm{bar})=${fix(st.Sstd, 2)}$ J/(mol K) vs NIST ${fix(st.Sref, 3)}\nfrom $\\ln Z$: $P=kT\\,\\partial_V\\ln Z=${v.sci(st.Pn, 5)}$ Pa vs $nkT=${v.sci(st.P, 5)}$ Pa · $U=-\\partial_\\beta\\ln Z=${fix(st.Un / st.U32, 6)}\\times\\frac32NkT$`);
      },
    },
    // ------------------------------------------------------------------ 6.17
    {
      num: '6.17', kind: 'Theorem', name: 'Equivalence of ensembles',
      statement: String.raw`For a large system with short-range interactions the microcanonical ensemble (fixed $U$) and the canonical ensemble (fixed $T$) give the same thermodynamics: if $U=\langle E\rangle_T$ then the entropy per particle and the temperature computed either way agree up to corrections of order $1/N$, and the canonical energy distribution has relative width $\sim1/\sqrt N$. For small systems or near phase transitions, the two can differ.`,
      idea: String.raw`The canonical probability of energy $E$ is $\Omega(E)e^{-\beta E}/Z$, the product of a rapidly rising and a rapidly falling function, whose peak has width $\sqrt{kT^2C_V}$ (6.4), a relative width $N^{-1/2}$. Since the sharp peak sits where $\partial S/\partial U=1/T$ (5.4, 5.8), the canonical $\ln Z=\max_E[S/k-\beta E]$ up to $O(\ln N)$ terms: $F$ is the Legendre transform of $S$, and energy fluctuations do not matter for extensive quantities. Equivalence is an asymptotic statement; ensembles fail to be equivalent exactly when $S(U)$ is not concave.`,
      caption: String.raw`The system is $N$ quantum oscillators (an Einstein solid) with $q$ quanta, mean $u=q/N$ quanta per oscillator. Left: the **canonical** energy distribution (bars) against the **microcanonical** delta spike at fixed $q$ (green); **change $N$** to see the bars squeeze onto the spike. Right: the relative disagreement between the microcanonical temperature $\partial S/\partial U$ and the canonical $T$ at the same $U$, against $N$: it falls as $1/N$.`,
      deps: ['thermo-6.4', 'thermo-5.4'], refs: ['Kardar §4.6'], tags: ['ensembles', 'thermodynamic limit'],
      credit: 'Gibbs, 1902', verify: true,
      scope: String.raw`For systems with short-range interactions and a concave entropy; long-range interactions (gravitating systems) and first-order transitions in finite systems can break equivalence.`,
      viz(v) {
        const Ns = v.slider('oscillators $N$', 1, 1000, 20, { int: true, log: true });
        const us = v.slider('quanta per oscillator $u=q/N$', 0.2, 4, 1.5, { step: 0.05 });
        const sa = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'energy $q$ (quanta)', ylabel: 'probability', title: 'canonical vs microcanonical energy', weight: 1.2 });
        const sb = v.stage({ x: [1, 1000], xlog: true, y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, height: 290, xlabel: '$N$', ylabel: '$|T_{\\rm micro}-T_{\\rm can}|/T$', title: 'temperatures at equal energy', weight: 1 });
        const Tmic = (N, q) => 1 / Math.log((q + N - 1) / q);   // exact: Ω(q)/Ω(q−1) = (q+N−1)/q
        let st = null;
        v.render(() => {
          const N = Ns.value, u = us.value, q = Math.max(1, Math.round(u * N)), uq = q / N;
          const x = uq / (1 + uq), Tc = 1 / Math.log(1 + 1 / uq);
          const lnP = (k) => lnEin(N, k) + k * Math.log(x) + N * Math.log(1 - x);
          const sd = Math.sqrt(N * x / (1 - x) ** 2), lo = Math.max(0, Math.floor(q - 4.5 * sd)), hi = Math.ceil(q + 4.5 * sd);
          const ks = []; for (let k = lo; k <= hi; k++) ks.push(k);
          const P = ks.map((k) => Math.exp(lnP(k)));
          sa.setView([lo - 0.5, hi + 0.5], [0, Math.max(...P) * 1.25]);
          ks.forEach((k, i) => sa.rect(k - 0.4, 0, k + 0.4, P[i], { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1 }));
          sa.vline(q, { color: 'green', width: 2.4 });
          sa.text('microcanonical: $q$ fixed', q, Math.max(...P) * 1.18, { size: 11, color: 'green', dx: 8 });
          const df = (n) => { const qq = Math.max(1, Math.round(u * n)), uu = qq / n; return Math.abs(Tmic(n, qq) - 1 / Math.log(1 + 1 / uu)) / (1 / Math.log(1 + 1 / uu)); };
          const pts = []; for (let n = 1; n <= 1000; n = Math.ceil(n * 1.25 + 0.01)) pts.push([n, Math.max(df(n), 1.1e-4)]);
          sb.path(pts, { color: 'accent', width: 1.8 }); sb.dots(pts, { r: 3, color: 'accent' });
          sb.fn((n) => 0.5 / n, { color: 'orange', dash: true, width: 1.6 });
          const d = df(N); sb.dot(N, Math.max(d, 1.1e-4), { r: 6, color: 'gold' });
          const smic = lnEin(N, q) / N, scan = (1 + uq) * Math.log(1 + uq) - uq * Math.log(uq);
          st = { q, Tc, Tm: Tmic(N, q), d, sd, rel: sd / q, smic, scan, N };
        });
        v.legend([['accent', 'canonical $P(q)$ / computed difference'], ['green', 'microcanonical'], ['orange', '$1/2N$ (guide)', { dash: true }]]);
        v.readout(() => st && `$N=${st.N}$, $q=${st.q}$ · $kT_{\\rm micro}=${fix(st.Tm, 4)}\\,\\varepsilon$ vs $kT_{\\rm can}=${fix(st.Tc, 4)}\\,\\varepsilon$ (relative difference ${fix(100 * st.d, 2)} %) · entropy per oscillator $s_{\\rm micro}=${fix(st.smic, 4)}$ vs Legendre transform of $\\ln Z$: ${fix(st.scan, 4)} · canonical energy width ${fix(100 * st.rel, 1)} % of $q$`);
      },
    },
    // ------------------------------------------------------------------ 6.18
    {
      num: '6.18', kind: 'Theorem', name: 'Bohr–van Leeuwen theorem',
      statement: String.raw`In classical statistical mechanics the thermal equilibrium magnetization of any system of charges in an external magnetic field is zero at every temperature: $Z(\mathbf B)=Z(0)$, hence $\mathbf M=kT\,\partial_{\mathbf B}\ln Z/V=0$. There is no classical diamagnetism, paramagnetism or ferromagnetism; magnetism is a quantum effect.`,
      idea: String.raw`With the Hamiltonian $H=\sum(\mathbf p_i-q\mathbf A(\mathbf r_i))^2/2m+V(\mathbf r)$ the field enters only through the vector potential, and in the classical phase-space integral $Z=\int d^3r\,d^3p\,e^{-\beta H}$ one may shift each momentum, $\mathbf p\to\mathbf p+q\mathbf A(\mathbf r)$, at fixed $\mathbf r$. The shift is a change of variables with unit Jacobian (the Lorentz force does no work, em-7.3, and the canonical momentum of mech-6.14 only reparametrizes phase space), so $Z$ does not depend on $B$. Physically, the diamagnetic moment of closed cyclotron orbits is exactly cancelled by the opposite moment of orbits that skip along the boundary.`,
      caption: String.raw`**Classical charged particles bounce in a circular box** under a perpendicular field $B$ (units $m=q=kT=1$). Blue particles execute complete orbits inside the box and are diamagnetic; orange particles touch the wall and their skipping orbits go the other way. The right panel shows the running time average of the magnetic moment per particle for each class and the total. **Change $B$**: the two parts become large (about $\mp kT/B$ per particle for the full orbits) but their sum stays at zero within the noise.`,
      deps: ['thermo-6.2', 'em-7.3', 'mech-6.14'], refs: ['Tong ch. 3'], tags: ['magnetism', 'classical limit'],
      credit: 'Bohr, 1911; van Leeuwen, 1919',
      links: { doi: 'https://doi.org/10.1051/jphysrad:01921002012036100' },
      scope: String.raw`Classical mechanics of charges with velocity-independent forces; quantum spin and Landau diamagnetism are outside it. Van Leeuwen's paper: *Problèmes de la théorie électronique du magnétisme*, J. Phys. Radium 2, 361 (1921) (her 1919 Leiden thesis).`,
      viz(v) {
        const NP = 220, R0 = 1;
        const Bs = v.slider('field $B$', 0.4, 6, 2, { step: 0.1, onChange: () => S.reset() });
        const S = v.sim(() => {
          const r = v.rng(31), P = [];
          for (let i = 0; i < NP; i++) { const rr = Math.sqrt(r()) * R0, a = 2 * Math.PI * r(); P.push({ x: rr * Math.cos(a), y: rr * Math.sin(a), vx: r.normal(), vy: r.normal() }); }
          return { P, sb: 0, ss: 0, n: 0, hist: [], tt: 0 };
        }, (s, dt) => {
          const Om = -Bs.value;
          let mb = 0, ms = 0;
          for (const p of s.P) {
            arcStep(p, dt, Om, R0);
            const cx = p.x - p.vy / Om, cy = p.y + p.vx / Om, rc = Math.hypot(p.vx, p.vy) / Math.abs(Om);
            p.bulk = Math.hypot(cx, cy) + rc < R0;
            const mu = 0.5 * (p.x * p.vy - p.y * p.vx);
            if (p.bulk) mb += mu; else ms += mu;
          }
          s.sb += mb / NP; s.ss += ms / NP; s.n++; s.tt += dt;
          if (s.n % 25 === 0) s.hist.push([s.tt, s.sb / s.n, s.ss / s.n, (s.sb + s.ss) / s.n]);
        }, { dt: 0.01, maxSteps: 3000 });
        const sa = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 240, title: 'particles in a magnetic field' });
        const sb = v.stage({ x: [0, 20], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 300, xlabel: 'time', ylabel: 'time-averaged moment per particle, $\\times B/kT$', title: 'magnetic moment', weight: 1.2 });
        let info = null;
        v.animate((t) => {
          const s = S.advance(t * 6) || S.state;
          sa.circle(0, 0, R0, { color: 'ink', width: 2.4 });
          s.P.forEach((p) => sa.dot(p.x, p.y, { r: 2.6, color: p.bulk ? 'accent' : 'orange', alpha: 0.8, ring: false }));
          const p0 = s.P.find((p) => p.bulk) || s.P[0], Om = -Bs.value, cx = p0.x - p0.vy / Om, cy = p0.y + p0.vx / Om, rc = Math.hypot(p0.vx, p0.vy) / Math.abs(Om);
          sa.circle(cx, cy, rc, { color: 'accent', width: 1, dash: true });
          const T = Math.max(20, Math.ceil(s.tt / 20) * 20), B = Bs.value;
          sb.setView([0, T], [-1.5, 1.5]);
          sb.hline(0, { color: 'faint' });
          const ser = (k, c) => sb.path(s.hist.map((h) => [h[0], h[k] * B]), { color: c, width: k === 3 ? 2.8 : 1.8 });
          ser(1, 'accent'); ser(2, 'orange'); ser(3, 'green');
          const last = s.hist[s.hist.length - 1] || [0, 0, 0, 0];
          info = { nb: s.P.filter((p) => p.bulk).length, b: last[1] * B, k: last[2] * B, t: last[3] * B, tt: s.tt };
        }, { still: 6 });
        v.legend([['accent', 'complete orbits (diamagnetic)'], ['orange', 'skipping orbits at the wall'], ['green', 'total']]);
        v.readout(() => info && `$B=${fix(Bs.value, 1)}$, ${info.nb} of ${NP} particles on complete orbits · averages so far, in units of $kT/B$ per particle: complete orbits **${fix(info.b, 3)}**, skipping orbits **${fix(info.k, 3)}**, **total ${fix(info.t, 3)}** (theorem: 0; noise $\\sim1/\\sqrt{NP\\,t}$)`);
      },
    },
    // ------------------------------------------------------------------ 6.19
    {
      num: '6.19', kind: 'Definition', name: 'Thermal density operator',
      statement: String.raw`A quantum system with Hamiltonian $H$ in equilibrium with a bath at temperature $T$ is described by the **thermal density operator**
$$\hat\rho=\frac{e^{-\beta\hat H}}{Z},\qquad Z=\operatorname{tr}e^{-\beta\hat H},$$
so that $\langle A\rangle=\operatorname{tr}(\hat\rho A)$. It is diagonal in the energy basis with the Boltzmann populations. It is a mixed state with purity $\operatorname{tr}\hat\rho^2<1$ and von Neumann entropy $S=-k\operatorname{tr}\hat\rho\ln\hat\rho$ equal to the Gibbs entropy of those populations.`,
      idea: String.raw`In the eigenbasis of $H$ the operator is $\operatorname{diag}(e^{-\beta E_n})/Z$, exactly the Boltzmann law (6.1) now read as a statement about a quantum state: the ensemble is a classical mixture of energy eigenstates, not a superposition. Its coherences vanish in the energy basis but do not vanish in other bases (for a spin in a field they are the transverse components of the Bloch vector). As $T\to0$ it tends to the pure ground state and as $T\to\infty$ to the maximally mixed state $\hat 1/d$.`,
      caption: String.raw`A spin-$\frac12$ with $H=\frac\Delta2\,\hat{\mathbf n}\cdot\boldsymbol\sigma$. **Drag the orange handle** to turn the field direction $\hat{\mathbf n}$ (in the $x$–$z$ plane of the Bloch sphere) and move $kT$. The thermal state is the Bloch vector $\mathbf r=-\tanh(\Delta/2kT)\,\hat{\mathbf n}$: it points at the ground state and shrinks toward the centre (the fully mixed state) as the temperature rises. Right: its length, the purity and the entropy against $kT$; the readout checks the exponential against a direct diagonalization.`,
      deps: ['thermo-6.2', 'qm-14.3'], refs: ['Kardar §6.5'], tags: ['density matrix', 'quantum statistics'],
      credit: 'von Neumann, 1927; Landau, 1927', verify: true,
      viz(v) {
        const kT = v.slider('$kT/\\Delta$', 0.05, 5, 0.5, { log: true, sig: 2 });
        const sa = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 310, weight: 1, title: 'Bloch disc ($x$–$z$ plane)' });
        const h = sa.handle(0.6, 0.8, { color: 'orange', r: 7, constrain: (x, y) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; } });
        const sb = v.stage({ x: [0.05, 5], xlog: true, y: [0, 1.05], axes: 'box', gutter: true, height: 310, xlabel: '$kT/\\Delta$', ylabel: '', title: 'length, purity, entropy', weight: 1.1 });
        let st = null;
        v.render(() => {
          const T = kT.value, nx = h.x, nz = h.y, r = Math.tanh(1 / (2 * T));
          sa.circle(0, 0, 1, { color: 'ink', width: 2 });
          sa.line(-1, 0, 1, 0, { color: 'faint' }); sa.line(0, -1, 0, 1, { color: 'faint' });
          sa.text('$|{\\uparrow}\\rangle$', 0, 1.18, { size: 12, color: 'muted', align: 'center' }); sa.text('$|{\\downarrow}\\rangle$', 0, -1.2, { size: 12, color: 'muted', align: 'center' });
          sa.arrow(0, 0, nx, nz, { color: 'orange', width: 2, head: 8 });
          sa.arrow(0, 0, -r * nx, -r * nz, { color: 'gold', width: 3.2, head: 9 });
          sa.dot(0, 0, { r: 3.5, color: 'muted' });
          sa.text('field $\\hat n$', nx * 1.12, nz * 1.12, { size: 11, color: 'orange', align: nx > 0 ? 'left' : 'right' });
          const Sf = (t) => { const p = (1 + Math.tanh(1 / (2 * t))) / 2, q = 1 - p; return (-(p * Math.log(p)) - (q > 0 ? q * Math.log(q) : 0)) / Math.LN2; };
          sb.fn((t) => Math.tanh(1 / (2 * t)), { color: 'gold', width: 2.4, n: 160 });
          sb.fn((t) => (1 + Math.tanh(1 / (2 * t)) ** 2) / 2, { color: 'accent', width: 2.2, n: 160 });
          sb.fn(Sf, { color: 'purple', width: 2.2, n: 160 });
          sb.vline(T, { color: 'faint', dash: true });
          // direct diagonalization of H = (Δ/2)(n·σ) with Δ = 1 in the (z, x) real basis
          const Hm = [[0.5 * nz, 0.5 * nx], [0.5 * nx, -0.5 * nz]];
          const e = v.M.eigSym(Hm), b = 1 / T, w = e.values.map((E) => Math.exp(-b * E)), Z = w[0] + w[1];
          const rho = [[0, 0], [0, 0]];
          e.vecs.forEach((u, k) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) rho[i][j] += (w[k] / Z) * u[i] * u[j]; });
          const cf = [[0.5 * (1 - r * nz), -0.5 * r * nx], [-0.5 * r * nx, 0.5 * (1 + r * nz)]];
          const err = Math.max(...[0, 1].flatMap((i) => [0, 1].map((j) => Math.abs(rho[i][j] - cf[i][j]))));
          st = { r, rho: cf, err, pur: (1 + r * r) / 2, S: Sf(T), Z };
        });
        v.legend([['orange', 'field direction $\\hat n$'], ['gold', 'Bloch vector (length $|\\mathbf r|$)'], ['accent', 'purity $\\operatorname{tr}\\hat\\rho^2$'], ['purple', '$S/(k\\ln2)$']]);
        v.readout(() => st && `$\\hat\\rho=\\begin{pmatrix}${fix(st.rho[0][0], 3)}&${fix(st.rho[0][1], 3)}\\\\${fix(st.rho[1][0], 3)}&${fix(st.rho[1][1], 3)}\\end{pmatrix}$ in the $\\sigma_z$ basis · $|\\mathbf r|=\\tanh\\frac{\\Delta}{2kT}=${fix(st.r, 3)}$ · purity ${fix(st.pur, 3)} · $S/k=${fix(st.S * Math.LN2, 3)}$ · matches $e^{-\\beta H}/Z$ from diagonalization to ${v.sci(st.err + 1e-17, 1)}`);
      },
    },
    // ------------------------------------------------------------------ 6.20
    {
      num: '6.20', kind: 'Method', name: 'Adiabatic demagnetization',
      statement: String.raw`To cool a paramagnetic salt, magnetize it **isothermally** in a strong field $B_i$ (heat flows to the bath, the spin entropy falls), then isolate it and reduce the field **adiabatically** to $B_f$. For an ideal paramagnet $S$ depends only on $B/T$, so constant $S$ means $T_f=T_i\,B_f/B_i$. In a real salt the moments feel an internal field $b$ from their neighbours, $S=S(\sqrt{B^2+b^2}/T)$, and the temperature cannot fall below $T_i\,b/B_i$. Giauque and MacDougall reached about $0.25$ K this way in 1933, and with nuclear spins microkelvin temperatures have been reached.`,
      idea: String.raw`The entropy of $N$ spin-$\frac12$ moments in a field is $S/Nk=\ln(2\cosh x)-x\tanh x$ with $x=\mu B/kT$ (6.10, 6.6): a decreasing function of $x$ ($\ln2$ at $x=0$, $0$ at $x\to\infty$). A strong field at $T_i$ orders the spins and the entropy flows out as heat. Removing the field while thermally isolated keeps the spin entropy constant: the spins remain as ordered as they were, which at a weaker field means a lower temperature. It works because the lattice entropy is negligible at low $T$ (third law, 3.17), so the spin entropy is nearly all the entropy there is; the internal field sets how far the third law lets you go.`,
      caption: String.raw`**Choose the starting temperature $T_i$, the field $B_i$, the final field $B_f$ and the internal field $b$** (illustrative, mT scale; no particular salt is claimed). The curves are the spin-entropy-versus-temperature at the three fields. Orange: the isothermal magnetization at $T_i$; green: the adiabatic step at constant entropy over to the $B_f$ curve. The right panel shows $T_f$ against $B_f$: linear for $b=0$ (dashed), flattening at a floor set by $b$.`,
      deps: ['thermo-6.10', 'thermo-3.17'], refs: ['Schroeder §4.4'], tags: ['cooling', 'paramagnet', 'entropy'],
      credit: 'Debye, 1926; Giauque, 1927; Giauque & MacDougall, 1933',
      links: { doi: 'https://doi.org/10.1021/ja01407a003' },
      scope: String.raw`Ideal spin-$\frac12$ moments ($g=2$) with a single internal field $b$ and no lattice heat capacity or heat leak; the numbers are a model. Debye (Ann. Phys. 386, 1154 (1926)) and Giauque (J. Am. Chem. Soc. 49, 1864 (1927)) proposed the method; the 1933 experiment on gadolinium sulfate octahydrate reported 0.25 K.`,
      viz(v) {
        const muK = v.M.CONST.muB / v.M.CONST.kB;                       // K per tesla for a g = 2 moment of 1 μB
        const Ti = v.slider('initial temperature $T_i$ (K)', 0.3, 4, 1.2, { step: 0.05 });
        const Bi = v.slider('initial field $B_i$ (T)', 0.5, 10, 5, { step: 0.1 });
        const Bf = v.slider('final field $B_f$ (T)', 0, 10, 0, { step: 0.05 });
        const bs = v.slider('internal field $b$ (T)', 0.001, 0.1, 0.01, { log: true, sig: 2 });
        const Sf = (B, T) => { const x = muK * Math.sqrt(B * B + bs.value ** 2) / T; return x > 30 ? Math.exp(-2 * x) * (1 + 2 * x) : Math.log(2 * Math.cosh(x)) - x * Math.tanh(x); };
        const sa = v.stage({ x: [0.002, 5], xlog: true, y: [0, 0.75], axes: 'box', gutter: true, height: 310, xlabel: '$T$ (K)', ylabel: '$S/Nk$', title: 'spin entropy', weight: 1.2 });
        const sb = v.stage({ x: [0, 10], y: [0.001, 5], ylog: true, axes: 'box', gutter: true, height: 310, xlabel: 'final field $B_f$ (T)', ylabel: '$T_f$ (K)', title: 'final temperature', weight: 1 });
        let st = null;
        v.render(() => {
          const T0 = Ti.value, B0 = Bi.value, B1 = Math.min(Bf.value, B0);
          const S0 = Sf(0, T0), S1 = Sf(B0, T0);
          const Tf = (B) => bis((T) => Sf(B, T) - S1, 1e-5, 20);
          sa.fn((t) => Sf(0, t), { color: 'muted', width: 1.8, n: 240 });
          sa.fn((t) => Sf(B0, t), { color: 'accent', width: 2.4, n: 240 });
          if (B1 > 0) sa.fn((t) => Sf(B1, t), { color: 'purple', width: 2, n: 240 });
          const T1 = Tf(B1);
          sa.arrow(T0, S0, T0, S1, { color: 'orange', width: 3, head: 9 });
          sa.arrow(T0, S1, Math.max(T1, 0.0021), S1, { color: 'green', width: 3, head: 9 });
          sa.dot(T0, S0, { r: 5, color: 'muted' }); sa.dot(T0, S1, { r: 5.5, color: 'gold' }); sa.dot(Math.max(T1, 0.0021), S1, { r: 6, color: 'green' });
          sa.text('magnetize, isothermal', T0 * 1.08, (S0 + S1) / 2, { size: 11, color: 'orange' });
          sa.text('demagnetize, adiabatic', Math.sqrt(T0 * Math.max(T1, 0.0021)), S1, { size: 11, color: 'green', dy: -10, align: 'center' });
          sb.fn((B) => Tf(Math.min(B, B0)), { color: 'accent', width: 2.4, n: 100, domain: [0, B0] });
          sb.fn((B) => Math.max(T0 * B / B0, 0.0011), { color: 'ink', dash: true, width: 1.5, domain: [0, B0] });
          sb.dot(B1, Math.max(T1, 0.0011), { r: 6, color: 'green' });
          st = { T1, ideal: T0 * B1 / B0, S0, S1, floor: T0 * bs.value / B0, B1, B0, x0: muK * B0 / T0 };
        });
        v.legend([['muted', '$B=0$ (internal field only)'], ['accent', '$B=B_i$'], ['purple', '$B=B_f$'], ['ink', 'ideal $T_i B_f/B_i$', { dash: true }]]);
        const tf = (T) => (T < 0.01 ? fix(T * 1000, 2) + ' mK' : fix(T, 3) + ' K');
        v.readout(() => st && `$\\mu B_i/kT_i=${fix(st.x0, 2)}$: spin entropy ${fix(st.S0, 3)} → ${fix(st.S1, 4)} $Nk$ on magnetizing · after reducing the field to ${fix(st.B1, 2)} T: **$T_f$ = ${tf(st.T1)}** · ideal ($b=0$) $T_iB_f/B_i$ = ${tf(st.ideal)} · floor at $B_f=0$: ${fix(st.floor * 1000, 2)} mK`);
      },
    },
  ],
};
