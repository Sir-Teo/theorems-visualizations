// Energy Systems — Chapter 4: Solar energy, items 4.5–4.8 (Shockley–Queisser limit, multijunction cells, maximum power point tracking, temperature)
// Reviewed 2026-10-18: source passages, corrections, test commands and remaining
// tandem-literature blocker are recorded in docs/verification/energy-ch04.md.
// All cell, atmospheric-notch, cloud and reverse-bias parameters are illustrative.

import { clamp, KB, S0, QE, FW, T_SUN, SIGMA, phot, engy, junction, junctionMax, stack, pin, cell, ivCurve } from './ch04.shared.js';

const Tc0 = 300;
/** Detailed-balance single junction at gap Eg: efficiency and loss shares of the incident power. */
function sqPoint(Eg, o) {
  const Pin = pin(o.conc), j = junction(Eg, Infinity, o), mp = junctionMax(j);
  const absE = (FW * o.conc * engy(Eg, Infinity, T_SUN) * QE) / Pin;      // fraction of incident power in photons above the gap
  const usable = (Eg * QE * j.A) / Pin;                                    // each absorbed photon keeps only Eg
  const eta = mp.P / Pin;
  return { eta, below: 1 - absE, therm: absE - usable, volt: usable - eta, Voc: j.Voc, Vmp: mp.V, j };
}

export default {
  collection: 'energy',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Shockley–Queisser limit',
      statement: String.raw`Consider a single p–n junction with band gap $E_g$ at temperature $T_c$, lit by a blackbody Sun of temperature $T_s$ filling a small solid angle, and assume (i) every photon above $E_g$ creates exactly one electron–hole pair and lower-energy photons are not absorbed, (ii) the only recombination is the unavoidable radiative one, in equilibrium with a blackbody at $T_c$, and (iii) carriers are collected at the band edges. When $E_g-qV\gg kT_c$, the current is approximately
$$J(V)=q\big[\dot N_s(E_g)-\dot N_c(E_g)\,(e^{qV/kT_c}-1)\big],$$
with $\dot N$ the blackbody photon fluxes above $E_g$, and the efficiency $\eta(E_g)=\max_V JV/P_{in}$ has a single maximum of about **30–34 %** at $E_g\approx1.1$–$1.4$ eV. No single-junction cell satisfying these assumptions can exceed the computed limit for the same spectrum and emission geometry. The visualization uses generalized Planck emission, proportional to $[\exp((E-qV)/kT_c)-1]^{-1}$, to remain valid near the gap at high concentration; it keeps $qV_{oc}<E_g$.

Scope: one junction, one pair per photon, no concentration (the limit rises under concentration), no spectral conversion. The exact figure depends on the spectrum and emission geometry. This picture recomputes a 5772 K blackbody case, not a tabulated terrestrial-spectrum limit.`,
      idea: String.raw`Three losses are unavoidable. Photons below $E_g$ are not absorbed (the Sun's spectrum, energy-4.1, has a long tail); photons above $E_g$ lose the excess to heat within picoseconds, so each pair is worth only $E_g$; and a cell that absorbs light must by detailed balance (thermo-9.10) also emit it, which gives the dark current its $e^{qV/kT}$ growth (energy-4.3) and keeps $V_{oc}$ below $E_g/q$. A small gap collects many photons but at low voltage; a large gap gives high voltage but few photons, so the product peaks in between. Shockley and Queisser derived exactly this in 1961 (energy-4.12). The limit is a statement about thermodynamics and photon statistics, not about any material, which is what makes it the yardstick for every new absorber.`,
      caption: String.raw`**Left**: where the incident sunlight goes as a function of the band gap: red, photons below the gap; orange, the excess above it lost to heat; purple, the radiative and maximum-power losses; green, electrical output. The green area's upper edge is the Shockley–Queisser efficiency. Drag the **band gap** to read the budget. **Right**: the current–voltage curve of that ideal cell, its maximum-power rectangle, and the gap $E_g/q$ that $V_{oc}$ cannot reach. Raise the **concentration** or cool the cell and the limit rises; let the cell emit from both faces and it falls.`,
      deps: ['energy-4.1', 'energy-4.3', 'cm-4.1'],
      refs: ['Shockley & Queisser (1961), §§2–5, Eqs. (2.2), (3.16)–(3.18), (5.2), DOI 10.1063/1.1736034', 'Markvart (2022), §6, Eqs. (12)–(13), DOI 10.1002/wene.430 (generalized emission)'],
      tags: ['photovoltaics', 'thermodynamics', 'efficiency'],
      scope: String.raw`Single junction, blackbody Sun (5772 K) in this picture; front emission only by default, no nonradiative recombination; the terrestrial AM1.5G spectrum is not calculated here.`,
      credit: 'William Shockley & Hans-Joachim Queisser, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley%E2%80%93Queisser_limit' },
      viz(v) {
        const Eg = v.slider('band gap $E_g$ (eV)', 0.4, 3, 1.34, { step: 0.01 });
        const lc = v.slider('concentration', 0, Math.log10(46200), 0, { step: 0.01, fmt: (x) => `${Math.round(10 ** x).toLocaleString('en-US')}×` });
        const Tc = v.slider('cell temperature (K)', 250, 400, 300, { step: 1 });
        const faces = v.select('cell emits from', [{ value: '1', label: 'front only' }, { value: '2', label: 'both faces' }], '1');
        const L = v.stage({ x: [0.4, 3], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.25, minWidth: 290, xlabel: 'band gap $E_g$ (eV)', ylabel: 'share of incident sunlight', title: 'where the sunlight goes', yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        const R = v.stage({ x: [0, 1.5], y: [0, 60], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: 'current density (mA/cm²)', title: 'the ideal cell at this gap' });
        let key = '', tab = null, st = null;
        v.render(() => {
          const o = { conc: 10 ** lc.value, Tc: Tc.value, faces: Number(faces.value) };
          const k = `${o.conc}|${o.Tc}|${o.faces}`;
          if (k !== key) { key = k; tab = []; for (let e = 0.4; e <= 3.0001; e += 0.025) tab.push([e, sqPoint(e, o)]); }
          const lay = (f) => tab.map(([e, p]) => [e, f(p)]);
          const c1 = lay((p) => p.eta), c2 = lay((p) => p.eta + p.volt), c3 = lay((p) => p.eta + p.volt + p.therm);
          const band = (top, bot, col, a) => { const pts = top.concat(bot.slice().reverse()); L.poly(pts, { fill: col, fillAlpha: a, stroke: false }); };
          band(c3.concat([[3, 1]]).slice(0, -1).map(([e, y]) => [e, 1]), c3, 'red', 0.4);
          band(c3, c2, 'orange', 0.45); band(c2, c1, 'purple', 0.4);
          band(c1, c1.map(([e]) => [e, 0]), 'green', 0.6);
          L.path(c1, { color: 'green', width: 2.6 });
          let bi = 0; tab.forEach(([, p], i) => { if (p.eta > tab[bi][1].eta) bi = i; });
          const best = tab[bi];
          L.dot(best[0], best[1].eta, { r: 5, color: 'green', hollow: true });
          L.vline(Eg.value, { color: 'gold', width: 1.6 });
          const p = sqPoint(Eg.value, o);
          L.dot(Eg.value, p.eta, { r: 7, color: 'gold' });
          // I–V at this gap
          const j = p.j, Jsc = QE * j.A * 0.1;
          const unitScale = Jsc > 1000 ? 1000 : 1;
          R.setLabels('voltage V (V)', unitScale === 1000 ? 'current density (A/cm²)' : 'current density (mA/cm²)');
          R.setView([0, Math.max(0.6, Eg.value * 1.05)], [0, Jsc * 1.2 / unitScale]);
          const pts = []; for (let i = 0; i <= 200; i++) { const V = (Math.min(j.Voc * 1.02, Eg.value * (1 - 1e-10)) * i) / 200; pts.push([V, QE * j.current(V) * 0.1 / unitScale]); }
          const Jm = QE * j.current(p.Vmp) * 0.1 / unitScale;
          R.rect(0, 0, p.Vmp, Jm, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.6 });
          R.rect(0, 0, j.Voc, Jsc / unitScale, { fill: false, color: 'muted', dash: [5, 4], width: 1.2 });
          R.path(pts, { color: 'accent', width: 3 });
          R.vline(Eg.value, { color: 'gold', width: 1.4, dash: [5, 4] });
          R.text('$E_g/q$', Eg.value, Jsc * 1.08 / unitScale, { dx: -5, align: 'right', size: 12, color: 'gold', weight: 700 });
          R.dot(p.Vmp, Jm, { r: 6, color: 'green' });
          st = { p, best, o, Jsc };
        });
        v.legend([['red', 'below the gap: not absorbed', { area: true }], ['orange', 'excess above the gap: heat', { area: true }], ['purple', 'radiative and maximum-power losses', { area: true }], ['green', 'electrical output', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, best, o } = st;
          const std = o.conc === 1 && o.Tc === 300 && o.faces === 1;
          return `$E_g=${v.fix(Eg.value, 2)}$ eV: efficiency **${v.fix(100 * p.eta, 1)}%** = 100% − ${v.fix(100 * p.below, 1)}% (below gap) − ${v.fix(100 * p.therm, 1)}% (heat) − ${v.fix(100 * p.volt, 1)}% (radiative/maximum-power loss) · $V_{oc}=${v.fix(p.Voc, 3)}$ V = ${v.fix((100 * p.Voc) / Eg.value, 0)}% of $E_g/q$ · maximum of this curve ${v.fix(100 * best[1].eta, 1)}% at ${v.fix(best[0], 2)} eV` +
            (std ? `\nComputed blackbody-Sun model (5772 K, front emission). A terrestrial AM1.5G calculation requires the measured reference spectrum and is not drawn here.` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'Multijunction cells',
      statement: String.raw`A **multijunction** (tandem) cell stacks junctions of decreasing band gap $E_{g1}>E_{g2}>\dots$ so that each absorbs the part of the spectrum it can use best: the top cell takes photons above $E_{g1}$ and is transparent to the rest, the next takes those between $E_{g2}$ and $E_{g1}$, and so on. Each photon then loses less to heat and the low-energy photons are no longer wasted. In the detailed-balance model the limit rises with the number $N$ of junctions: with the blackbody Sun used here, to larger values for optimized two- and three-junction stacks at one Sun, with further gains under concentration. The bars report this implementation's computed optima, rather than values transcribed from Henry or De Vos; their exact published models remain to be checked.

Scope: ideal junctions with radiative recombination only; in a series-connected (two-terminal) stack the junctions must carry the **same current**, so the band gaps have to be chosen to match photon currents; in a four-terminal stack each junction works at its own power point. The numbers depend on the spectrum.`,
      idea: String.raw`A single junction pays two spectral penalties — the sub-gap photons it ignores and the above-gap energy it throws away (energy-4.5). A stack splits the spectrum into slices, and within each slice the gap is closer to the photon energy, so the thermalisation loss shrinks as the spectral slices narrow. Series connection requires current matching: in series, the same current flows through every junction, so the smallest photon current in the stack limits the rest. The optimum gaps therefore balance currents rather than maximising each junction on its own. This picture of a spectrum-splitting stack, here a reconstruction with a blackbody Sun, is the principle behind the III–V triple-junction cells used on satellites and in concentrators.`,
      caption: String.raw`Choose the number of junctions and drag the **gap handles** along the photon-energy axis (the axis of the figure is the Sun's spectrum). Each junction's colour band is the slice it absorbs; the darker area allocates its actual electrical output across those photons, including recombination and series-current mismatch. Press **optimise** to search for the best gaps. The bars on the right compare the best $N=1,2,3$ stacks for the chosen connection and concentration. **Model values:** blackbody Sun, no photon recycling.`,
      deps: ['energy-4.5'],
      refs: ['Henry (1980), J. Appl. Phys. 51: 4494–4500, DOI 10.1063/1.328272 (full model comparison pending)', 'De Vos (1980), J. Phys. D 13: 839–846, DOI 10.1088/0022-3727/13/5/018 (full text pending)', 'Markvart (2022), §6, Eqs. (12)–(13), generalized emission'],
      tags: ['photovoltaics', 'tandem', 'efficiency'],
      scope: String.raw`Detailed-balance model, blackbody Sun, ideal junctions; real stacks have lattice-matching, tunnel-junction and non-radiative losses.`,
      credit: 'C. H. Henry, 1980; A. De Vos, 1980',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multi-junction_solar_cell' },
      verify: true,
      viz(v) {
        const M = v.M;
        const N = v.select('junctions', [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }], '2');
        const conn = v.select('connection', [{ value: 'series', label: 'in series (2-terminal)' }, { value: 'indep', label: 'independent (4-terminal)' }], 'series');
        const lc = v.slider('concentration', 0, Math.log10(46200), 0, { step: 0.01, fmt: (x) => `${Math.round(10 ** x).toLocaleString('en-US')}×` });
        const S = v.stage({ x: [0.3, 4.2], y: [0, 1.12], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'photon energy (eV)', ylabel: 'solar power per eV (relative)', title: 'the spectrum, sliced by the junctions' });
        const B = v.stage({ x: [0.4, 3.6], y: [0, 0.7], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 240, xlabel: 'number of junctions', ylabel: 'efficiency', title: 'best stack of each size', xticks: [[1, '1'], [2, '2'], [3, '3']], yticks: [[0, '0'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%'], [0.4, '40%'], [0.5, '50%'], [0.6, '60%'], [0.7, '70%']] });
        const hs = [S.handle(1.8, 0.03, { color: 'blue', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } }), S.handle(1.3, 0.03, { color: 'green', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } }), S.handle(0.9, 0.03, { color: 'orange', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } })];
        const opt = {}; let st = null;
        const O = () => ({ conc: 10 ** lc.value, Tc: Tc0, faces: 1 });
        const gaps = () => hs.slice(0, Number(N.value)).map((h) => h.x).sort((a, b) => b - a);
        const best = (n) => {
          const k = `${n}|${conn.value}|${lc.value}`; if (opt[k]) return opt[k];
          const o = O(), starts = { 1: [1.35], 2: [1.75, 1.1], 3: [1.95, 1.45, 0.95] }[n];
          const f = (g) => (g.some((x) => x < 0.3 || x > 4) ? 1 : -stack(g, o, conn.value).eta);
          const r = M.nelderMead(f, starts, { step: 0.15, tol: 1e-7, maxIt: 250 });
          return (opt[k] = { gaps: [...r.x].sort((a, b) => b - a), eta: -r.fx });
        };
        v.button('optimise the gaps', () => { const b = best(Number(N.value)); b.gaps.forEach((g, i) => hs[i].set(g, 0.03)); });
        v.render(() => {
          const n = Number(N.value), o = O();
          hs.forEach((h, i) => { h.visible = i < n; });
          const g = gaps(), res = stack(g, o, conn.value);
          const kT = KB * T_SUN, f = (x) => (x ** 3 / Math.expm1(x / kT)) / ((2.82144 * kT) ** 3 / Math.expm1(2.82144));
          const cols = ['blue', 'green', 'orange'];
          S.between(f, () => 0, 0.3, g[n - 1], { fill: 'red', fillAlpha: 0.3 });
          g.forEach((E, i) => {
            const hiE = i === 0 ? 4.2 : g[i - 1];
            // Allocate each junction's actual output over absorbed photons: include radiative current loss and series mismatch.
            const V = res.parts[i].A > 0 ? res.parts[i].P / (QE * res.parts[i].A) : 0;
            S.between(f, () => 0, E, hiE, { fill: cols[i], fillAlpha: 0.25 });
            S.between((x) => (f(x) * V) / x, () => 0, E, hiE, { fill: cols[i], fillAlpha: 0.6 });
            S.vline(E, { color: cols[i], width: 1.6 });
          });
          S.fn(f, { color: 'ink', width: 1.8, domain: [0.3, 4.2], n: 300 });
          for (let i = 0; i < n; i++) hs[i].set(hs[i].x, 0.03);
          const bars = [1, 2, 3].map((m) => best(m).eta);
          B.setView([0.4, 3.6], [0, Math.max(0.4, Math.max(...bars, res.eta) * 1.2)]);
          B.bars(bars, { x0: 1, dx: 1, color: (val, i) => (i + 1 === n ? 'green' : 'accent') });
          bars.forEach((b, i) => B.text(`${v.fix(100 * b, 1)}%`, i + 1, b, { dy: -8, align: 'center', size: 12, weight: 700, color: 'ink' }));
          B.hline(res.eta, { color: 'gold', width: 2, dash: [6, 4] });
          st = { res, g, o, bars, n };
        });
        v.legend([['red', 'below the lowest gap: lost', { area: true }], ['blue', 'top junction', { area: true }], ['green', 'middle junction', { area: true }], ['orange', 'bottom junction', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { res, g, bars, n } = st;
          const single = stack([1.34], { ...st.o }, conn.value).eta;
          return `Gaps ${g.map((x) => v.fix(x, 2)).join(', ')} eV: efficiency **${v.fix(100 * res.eta, 1)}%** (${n === 1 ? 'single junction' : `${v.fix(100 * (res.eta - bars[0]), 1)} points relative to the best single junction ${v.fix(100 * bars[0], 1)}%`}) · junction voltages ${res.parts.map((p) => v.fix(p.V, 2) + ' V').join(', ')}` +
            (conn.value === 'series' && n > 1 ? ` · photon currents ${res.parts.map((p) => v.fix(p.A * QE * 0.1, 1)).join(', ')} mA/cm² available, ${v.fix(res.j * QE * 0.1, 1)} mA/cm² shared` : '') + `\nBest stacks (model): ${bars.map((b, i) => `${i + 1} junction${i ? 's' : ''} ${v.fix(100 * b, 1)}%`).join(' · ')}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Method',
      name: 'Maximum power point tracking',
      statement: String.raw`The maximum power point $(V_{mp},J_{mp})$ of a cell or module (energy-4.4) moves with irradiance and temperature, so a fixed load wastes power. A **maximum power point tracker** adjusts the operating voltage to stay at the peak. In **perturb and observe**, at nonzero changes, every control period the voltage is stepped by $\pm\Delta V$ and the power measured: if the power rose, the next step has the same sign, otherwise the sign reverses (at an exact tie this example continues its previous direction),
$$V_{k+1}=V_k+\operatorname{sgn}\!\big[(V_k-V_{k-1})(P_k-P_{k-1})\big]\,\Delta V.$$
Because $P(V)$ is single-peaked, the controller climbs to the peak and then oscillates around it with amplitude of order $\Delta V$.

Scope: uniform illumination, so one peak; the step size trades tracking speed against steady-state ripple, and rapid irradiance changes can mislead the algorithm.`,
      idea: String.raw`The power curve of a cell rises, peaks, and falls (energy-4.4), so the sign of the slope $dP/dV$ tells which way the maximum lies, and a perturbation tests that sign without knowing the cell model. The controller is a discrete gradient ascent: it needs only a voltage actuator (in practice the duty cycle of a DC–DC converter) and a power measurement. At the peak $dP/dV=0$, so it hunts back and forth across it; a larger $\Delta V$ follows moving peaks faster but wastes more power in the ripple, though since $P$ is flat at the top the loss is quadratic in the offset. A weakness is that a sudden brightening during a step can raise $P$ for the wrong reason and send the controller the wrong way for one step.`,
      caption: String.raw`The cell is lit by an invented cloud sequence (shaded strip, top). **Left** (top) the green dashed curve is the power available at the true maximum power point and the blue curve what the controller delivers; **right**, the power–voltage curve at this instant with the controller's recent positions (gold trail) hunting around the peak (green ring). Change the **step size** to see slow tracking after a cloud edge (small step) versus ripple (large step), or switch to a **fixed voltage** to see what tracking is worth. Press play or drag the time.`,
      deps: ['energy-4.4'],
      refs: ['Texas Instruments, C2000 Solar Library (2014), §4.1, pp. 12–13, MPPT_PNO flowchart'],
      tags: ['photovoltaics', 'control', 'optimisation'],
      scope: String.raw`Single peak (uniform illumination); the cloud history and cell parameters are illustrative.`,
      viz(v) {
        const dv = v.slider('step size $\\Delta V$ (mV)', 1, 60, 10, { step: 1 });
        const mode = v.select('controller', [{ value: 'po', label: 'perturb & observe' }, { value: 'fixed', label: 'fixed 0.50 V' }], 'po');
        const DUR = 20, DT = 0.1, N = Math.round(DUR / DT);
        const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
        const gOf = (t) => 1 - 0.72 * Math.min(ss((t - 4) / 0.6), 1 - ss((t - 9.2) / 0.6)) - 0.35 * Math.max(0, Math.sin((2 * Math.PI * (t - 13)) / 1.6)) * (t > 13 && t < 17 ? 1 : 0);
        const mk = (g) => cell({ suns: g, T: 298.15, j0ref: 1e-12, n: 1, rs: 0.8, rsh: 2000 });
        const A = v.stage({ x: [0, DUR], y: [0, 28], axes: 'box', gutter: true, height: 300, weight: 1.35, minWidth: 300, xlabel: 'time (s)', ylabel: 'power (mW/cm²)', title: 'power delivered' });
        const B = v.stage({ x: [0, 0.7], y: [0, 28], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: 'power (mW/cm²)', title: 'the power curve now' });
        let key = '', sim = null;
        const run = () => {
          const k = `${dv.value}|${mode.value}`; if (k === key) return; key = k;
          const dV = dv.value / 1000, Vs = [], Ps = [], Pm = [], Vm = [];
          let V = 0.42, dir = 1, Pprev = -1;
          for (let i = 0; i <= N; i++) {
            const t = i * DT, c = mk(gOf(t)), m = c.pmax();
            Pm.push(m.P); Vm.push(m.V);
            if (mode.value === 'fixed') V = 0.5;
            const P = Math.max(0, V * c.J(V)); Vs.push(V); Ps.push(P);
            if (mode.value === 'po') { if (i > 0 && P < Pprev) dir = -dir; Pprev = P; V = clamp(V + dir * dV, 0.05, 0.69); }
          }
          sim = { Vs, Ps, Pm, Vm };
        };
        let st = null;
        v.animate((t) => {
          run();
          const tt = clamp(t, 0, DUR), k = Math.min(N, Math.round(tt / DT));
          A.hband(0, 28, { color: 'muted', alpha: 0 });
          for (let i = 0; i < N; i++) A.rect(i * DT, 0, (i + 1) * DT, 2.2 * gOf(i * DT), { fill: 'gold', fillAlpha: 0.25, stroke: false });
          A.text('irradiance (shaded strip, max 1 sun)', 0.3, 2.9, { size: 11, color: 'muted', align: 'left', plate: true });
          A.path(sim.Pm.map((p, i) => [i * DT, p]), { color: 'green', width: 2, dash: [6, 4] });
          A.path(sim.Ps.slice(0, k + 1).map((p, i) => [i * DT, p]), { color: 'accent', width: 2.6 });
          A.vline(tt, { color: 'faint', width: 1 });
          A.dot(tt, sim.Ps[k], { r: 6, color: 'gold' });
          const c = mk(gOf(k * DT));
          B.setView([0, 0.7], [0, Math.max(6, Math.ceil((sim.Pm[k] * 1.25) / 2) * 2)]);
          B.path(ivCurve(c, 0, c.voc(), 120).map(([V, J]) => [V, V * J]), { color: 'accent', width: 2.6 });
          for (let i = Math.max(0, k - 12); i < k; i++) B.dot(sim.Vs[i], sim.Ps[i], { r: 3.5, color: 'gold', alpha: 0.4 + 0.5 * ((i - (k - 12)) / 12) });
          B.dot(sim.Vm[k], sim.Pm[k], { r: 8, color: 'green', hollow: true });
          B.dot(sim.Vs[k], sim.Ps[k], { r: 7, color: 'gold' });
          let e = 0, em = 0, eN = 0, emN = 0; for (let i = 0; i <= k; i++) { e += sim.Ps[i]; em += sim.Pm[i]; } for (let i = 0; i <= N; i++) { eN += sim.Ps[i]; emN += sim.Pm[i]; }
          st = { g: gOf(tt), V: sim.Vs[k], Vm: sim.Vm[k], P: sim.Ps[k], Pm: sim.Pm[k], eff: e / em, effAll: eN / emN, tt };
        }, { period: DUR, still: 7 });
        v.legend([['green', 'available at the true maximum', { dash: true }], ['accent', 'delivered by the controller']]);
        v.readout(() => {
          if (!st) return '';
          return `t = ${v.fix(st.tt, 1)} s, sampled light ${v.fix(st.g, 2)} sun: operating ${v.fix(st.V, 3)} V (true peak at ${v.fix(st.Vm, 3)} V) delivers ${v.fix(st.P, 2)} of ${v.fix(st.Pm, 2)} mW/cm² · sampled tracking efficiency so far **${v.fix(100 * st.eff, 1)}%**, over the whole 20 s ${v.fix(100 * st.effAll, 1)}%`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Hot panels produce less',
      statement: String.raw`The output of a silicon solar cell falls as it warms. The photocurrent rises very slightly with temperature (the gap narrows), but in an ideal-diode approximation with $n=1$ and constant gap the dark saturation current grows as $J_0\propto T^{3}e^{-E_g/kT}$, so the open-circuit voltage
$$V_{oc}=\frac{kT}{q}\ln\!\Big(\frac{J_{ph}}{J_0}\Big)\quad\Rightarrow\quad \frac{dV_{oc}}{dT}\approx-\frac{E_g/q-V_{oc}}{T}-\frac{3k}{q}\approx-2\ \text{mV/K}$$
for a silicon cell, i.e. about $-0.3$ to $-0.4\%$ per kelvin of the voltage. The maximum power therefore falls by a few tenths of a per cent per kelvin; on a sunny day a roof panel at 60–70 °C produces noticeably less than its 25 °C rating.

Scope: crystalline silicon with the ideal-diode relation; the exact coefficient depends on cell technology and quality (the displayed coefficients are computed for the illustrative cell, not a commercial-module specification).`,
      idea: String.raw`Warm cells have more thermally excited carriers, so the junction leaks more in the dark: $J_0$ grows exponentially with temperature (the intrinsic carrier density squared of cm-4.2 and the diode law of energy-4.3). The light current barely changes, so the point where the diode current cancels it moves to a lower voltage. Differentiating the log gives the slope $-(E_g/q-V_{oc})/T$: the further $V_{oc}$ sits below the gap voltage, the faster it falls, in this fixed-gap approximation. In a real installation the cell temperature rises above ambient by an amount proportional to the sunlight absorbed and not converted to electricity (nominal operating cell temperature), so warming reduces output relative to the same irradiance at the reference temperature.`,
      caption: String.raw`Set the **ambient temperature** and the **sunshine**: the cell temperature follows (about 31 K above ambient at one sun, from an illustrative nominal-temperature parameter of 45 °C). The left panel overlays the I–V curve at 25 °C (dashed) with the hot one; the right panel plots the maximum power against cell temperature, with its tangent giving the temperature coefficient. Compare the computed coefficients in the readout with the quoted figures. **Illustrative model**, silicon-like parameters.`,
      deps: ['energy-4.3', 'cm-4.2'],
      refs: ['PVEducation, Effect of Temperature, I0 and Voc sections', 'Sandia PVPMC, NOCT Cell Temperature (full model and its omitted corrections)'],
      tags: ['photovoltaics', 'temperature', 'performance'],
      scope: String.raw`Ideal-diode silicon-like cell, one-sun-scaled photocurrent; the simple linear heating law is illustrative and omits the wind, mounting and efficiency corrections in the SAM NOCT model.`,
      viz(v) {
        const Ta = v.slider('ambient temperature (°C)', -10, 45, 30, { step: 1 });
        const G = v.slider('sunshine (suns)', 0.2, 1.2, 1, { step: 0.01 });
        const S = v.stage({ x: [0, 0.8], y: [0, 55], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 290, xlabel: 'voltage V (V)', ylabel: 'current density (mA/cm²)', title: 'I–V curve at 25 °C and hot' });
        const P = v.stage({ x: [-10, 95], y: [0.7, 1.15], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'cell temperature (°C)', ylabel: 'maximum power relative to 25 °C', title: 'power against temperature', yticks: [[0.7, '70%'], [0.8, '80%'], [0.9, '90%'], [1, '100%'], [1.1, '110%']] });
        const mk = (Tc, g) => cell({ suns: g, T: Tc + 273.15, j0ref: 1e-12, n: 1, rs: 0.6, rsh: 3000, alpha: 0.0005 });
        let st = null;
        v.render(() => {
          const g = G.value, Tcell = Ta.value + ((45 - 20) / 0.8) * g, c = mk(Tcell, g), c0 = mk(25, g);
          S.setView([0, 0.8], [0, Math.max(10, Math.ceil((c0.jsc() * 1.1) / 5) * 5)]);
          S.path(ivCurve(c0, 0, c0.voc(), 140), { color: 'muted', width: 2, dash: [6, 4] });
          S.path(ivCurve(c, 0, c.voc(), 140), { color: 'red', width: 3 });
          const m0 = c0.pmax(), m = c.pmax();
          S.rect(0, 0, m0.V, m0.J, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1.2, dash: [4, 4] });
          S.rect(0, 0, m.V, m.J, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.6 });
          S.dot(c.voc(), 0, { r: 6, color: 'red' }); S.dot(c0.voc(), 0, { r: 6, color: 'muted', hollow: true });
          const rel = (T) => mk(T, g).pmax().P / m0.P;
          P.hline(1, { color: 'faint', width: 1, dash: [4, 4] });
          P.fn(rel, { domain: [-10, 95], color: 'accent', width: 3, n: 40 });
          P.vline(25, { color: 'faint', width: 1, dash: [4, 4] });
          P.dot(Tcell, rel(Tcell), { r: 8, color: 'red' });
          const h = 2, dVoc = (mk(Tcell + h, g).voc() - mk(Tcell - h, g).voc()) / (2 * h), dP = (rel(Tcell + h) - rel(Tcell - h)) / (2 * h);
          const T0 = Tcell; P.line(T0 - 12, rel(T0) - dP * 12, T0 + 12, rel(T0) + dP * 12, { color: 'orange', width: 1.8 });
          st = { Tcell, m, m0, dVoc, dP, voc: c.voc(), voc0: c0.voc() };
        });
        v.legend([['muted', '25 °C', { dash: true }], ['red', 'at the cell temperature']]);
        v.readout(() => {
          if (!st) return '';
          const { Tcell, m, m0, dVoc, dP, voc, voc0 } = st;
          return `Cell temperature ${v.fix(Tcell, 0)} °C: $V_{oc}=${v.fix(voc, 3)}$ V (${v.fix(1000 * (voc - voc0), 0)} mV from 25 °C) · slope $dV_{oc}/dT=${v.fix(1000 * dVoc, 2)}$ mV/K (${v.fix((100 * dVoc) / voc, 2)}%/K) · maximum power ${v.fix(m.P, 2)} mW/cm² = **${v.fix((100 * m.P) / m0.P, 1)}%** of its 25 °C value, local power coefficient ${v.fix(100 * dP * m0.P / m.P, 2)}%/K`;
        });
      },
    },
  ],
};
