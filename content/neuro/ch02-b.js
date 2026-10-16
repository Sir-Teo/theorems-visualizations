// Computational Neuroscience — Chapter 2: The Hodgkin–Huxley model (part b: 2.6–2.9)
//
// Facts and how they were checked (Oct 2026):
// - Hodgkin & Huxley model: see ch02.js. That the model reproduces anode-break excitation, refractoriness and threshold is stated by
//   secondary sources (encyclopedia entry on the HH model, lecture notes, Wikipedia "Anode break excitation" citing H&H 1952);
//   all numbers shown on these pages are computed here.
// - Hodgkin (1948), J. Physiol. 107: 165–181 (Crossref-checked title and pages): classification of axons by their repetitive
//   response. The definitions of class 1 (firing frequency can be arbitrarily low) and class 2 (onset at a non-zero minimum
//   frequency) are as given by several review articles (not read in the original), so 2.7 and 2.8 carry verify: true.
// - Connor & Stevens (1971): three papers, J. Physiol. 213: 1–19 (doi 10.1113/jphysiol.1971.sp009364), 21–30 (sp009365)
//   and 31–53 (sp009366, "Prediction of repetitive firing behaviour from voltage clamp data on an isolated neurone soma"), all
//   Crossref-checked. The parameter set used here (ḡNa = 120, ḡK = 20, ḡA = 47.7, ḡL = 0.3 mS/cm², E_Na = 55, E_K = −72,
//   E_A = −75, E_L = −17 mV, rate factor 3.8, A-current kinetics with the constants 0.0761, 94.22, 31.84, 1.17, 28.93, 0.3632,
//   1.158, 55.96, 20.12, 53.3, 14.54, 1.24, 2.678, 50, 16.027) was read from the XPP implementation distributed with the Pitt
//   computational-neuroscience course (sites.pitt.edu/~phase/bard/bardware/classes/compneuro/model/cs.ode), a teaching file that
//   follows Connor, Walter & McKown (1977); it was not compared with the 1971/1977 tables, hence verify: true.
//   Leak reversal is re-tuned here so that rest stays at −68 mV when ḡA is changed (our assumption, stated on the page).
// - Stochastic channels: Chow & White (1996), Biophys. J. 71: 3013–3021 ("Spontaneous action potentials due to channel
//   fluctuations"); Schneidman, Freedman & Segev (1998), Neural Comput. 10: 1679–1703; White, Rubinstein & Kay (2000),
//   Trends Neurosci. 23: 131–137 (all Crossref-checked). Channel densities 60 Na⁺ and 18 K⁺ channels per µm² with 20 pS each are the
//   standard parameter set of stochastic-HH studies (found in several arXiv/PMC parameter tables; the set reproduces ḡNa = 120 and
//   ḡK = 36 mS/cm²: 60·20 pS/µm² = 120 mS/cm²). Which of these papers used exactly these numbers was not confirmed, hence verify: true.
import { HH, ION_COL, gateInf, clamp, trace, hhSim, hhRun, spikeTimes, pulse, hhRest, CS, csRun, csSpikes, csA, hhStochastic } from './ch02.shared.js';

const GC = { n: ION_COL.K, m: ION_COL.Na, h: 'teal' };

export default {
  collection: 'neuro',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Phenomenon',
      name: 'Post-inhibitory rebound (anode break excitation)',
      statement: String.raw`If the Hodgkin–Huxley membrane is held hyperpolarized by an injected current for long enough and the current is then switched off, the membrane may fire a spike with no depolarizing stimulus at all: this is **post-inhibitory rebound** (in the older literature, **anode break excitation**, because the break of an anodal, hyperpolarizing current excites). The effect needs a hyperpolarization that is both strong enough and long enough (a boundary in the plane of duration and amplitude), and it needs the slow gates to move: in this model it disappears if the potassium gate $n$ is prevented from changing during the hyperpolarization, while freezing the sodium inactivation $h$ alone changes the picture little.`,
      idea: String.raw`At rest about 40 % of the sodium channels are inactivated ($h_\infty(-65\text{ mV})\approx 0.6$) and about a third of the potassium gates are open ($n_\infty\approx 0.32$). Hyperpolarization raises $h_\infty$ toward 1 and lowers $n_\infty$ (neuro-2.1, neuro-2.2), with time constants of several milliseconds, so after a few milliseconds more sodium channels are available and fewer potassium channels are open. When the current is released, $V$ climbs back toward rest through the voltage range where $m$ is already opening, while $h$ and $n$ are still in their altered state and relax only slowly (neuro-1.7): the net current is inward for a moment and the regenerative loop of neuro-2.3 fires a spike. The freezing experiment on this page shows that in the model the lowered potassium conductance is the indispensable part, and de-inactivation of sodium alone is not required, which is more than the textbook phrase \"de-inactivated sodium channels\" suggests. Secondary accounts credit the Hodgkin–Huxley model with explaining this old observation; the picture here is the model's own computation.`,
      caption: String.raw`Drag the handle in the map to choose the duration and strength of a hyperpolarizing current applied at $t=2$ ms. Top: $V(t)$ and the gates; $h$ climbs during the hyperpolarization and $n$ falls. Map below: every point is a separate simulation (green: a rebound spike occurs, grey: none). Now freeze $h$ at its resting value, or freeze $n$ (a model without that slow change). With $h$ frozen the green region changes little (the spike is even larger, since nothing inactivates the sodium channels); with $n$ frozen, or with both frozen, no rebound is left anywhere in this map, which shows which variable does the work in this model.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane at 6.3 °C, with currents applied from rest. Many real neurons show much stronger rebound because of additional currents (T-type calcium, $I_h$), which this four-variable model does not contain.`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.2', 'neuro-2.4'],
      refs: ['Gerstner §2.3'],
      tags: ['rebound', 'inactivation'],
      credit: 'Model of A. L. Hodgkin and A. F. Huxley, 1952',
      viz(v) {
        const frz = v.select('which slow variable is allowed to move', [{ value: '', label: 'both $h$ and $n$ (full model)' }, { value: 'h', label: '$h$ frozen' }, { value: 'n', label: '$n$ frozen' }, { value: 'hn', label: 'both frozen' }], '');
        const DUR = [1, 40], AMP = [0, 8], t0 = 2;
        const sA = v.stage({ x: [0, 70], y: [-100, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 230, weight: 1.1, minWidth: 320 });
        const sG = v.stage({ x: [0, 70], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gates', height: 230, weight: 1.1, minWidth: 320 });
        const sM = v.stage({ x: DUR, y: [-8.2, 0.2], axes: 'box', gutter: true, xlabel: 'hyperpolarization duration (ms)', ylabel: 'current (µA/cm²)', height: 430, weight: 1, minWidth: 300 });
        const params = (fz) => ({ ...HH, freeze: fz });
        const response = (d, a, fz, rec) => {
          const f = (t) => (t >= t0 && t < t0 + d ? -a : 0), o = { T: 6.3, tEnd: d + 40, dt: 0.04, p: params(fz) };
          return rec ? hhSim(f, { ...o, every: 2 }) : hhRun(f, o);
        };
        const maps = {};
        const grid = () => {
          const fz = frz.value; if (maps[fz]) return maps[fz];
          const nx = 20, ny = 16, cells = [];
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const d = DUR[0] + ((DUR[1] - DUR[0]) * (i + 0.5)) / nx, a = ((j + 0.5) * AMP[1]) / ny;
            const r = response(d, a, fz, false); cells.push({ d, a, spike: r.spikes.length > 0 });
          }
          return (maps[fz] = { cells, nx, ny });
        };
        const h = sM.handle(20, -4, { color: 'gold', r: 8, constrain: (x, y) => [clamp(x, 1, 40), clamp(y, -8, -0.2)] });
        v.render(() => {
          const G = grid(), d = h.x, a = -h.y, fz = frz.value;
          const wx = (DUR[1] - DUR[0]) / G.nx, wy = AMP[1] / G.ny;
          for (const c of G.cells) sM.rect(c.d - wx / 2, -(c.a + wy / 2), c.d + wx / 2, -(c.a - wy / 2), { fill: c.spike ? 'green' : 'muted', fillAlpha: c.spike ? 0.6 : 0.16, stroke: false });
          sM.text('no spike', 30, -0.9, { size: 11, color: 'muted', align: 'left' }); sM.text('rebound spike', 24, -6.5, { size: 11, color: 'ink', align: 'left' });
          const o = response(d, a, fz, true), sp = spikeTimes(o.t, o.V, 0);
          trace(sA, o.t, o.V, { color: 'accent', width: 2.4 });
          sA.rect(t0, -100, t0 + d, -95, { fill: 'gold', fillAlpha: 0.7, stroke: false });
          sA.hline(HH.ENa, { color: ION_COL.Na, dash: [3, 4], width: 1 });
          for (const g of ['m', 'h', 'n']) trace(sG, o.t, o[g], { color: GC[g], width: 2 });
          sG.vline(t0 + d, { color: 'gold', width: 1.5 });
          h._res = { o, sp, d, a };
        });
        v.legend([['accent', '$V$'], [GC.m, '$m$'], [GC.h, '$h$'], [GC.n, '$n$'], ['green', 'rebound spike in map']]);
        v.readout(() => {
          const R = h._res || { o: { t: [0], V: [-65], h: [0.6], n: [0.3], m: [0] }, sp: [], d: 20, a: 8 }, k = Math.max(0, Math.round((2 + R.d) / (R.o.t[1] - R.o.t[0])) - 1);
          const kk = Math.min(R.o.t.length - 1, k), Vmin = Math.min(...R.o.V);
          return String.raw`$-${v.fix(R.a, 1)}$ µA/cm² for $${v.fix(R.d, 1)}$ ms: lowest $V = ${v.fix(Vmin, 1)}$ mV · at release $h = ${v.fix(R.o.h[kk], 3)}$ (rest ${v.fix(gateInf('h', -65), 3)}), $n = ${v.fix(R.o.n[kk], 3)}$ (rest ${v.fix(gateInf('n', -65), 3)})` + '\n' +
            (R.sp.length ? String.raw`rebound spike $${v.fix(R.sp[0] - (2 + R.d), 1)}$ ms after the current is switched off, peak ${v.fix(Math.max(...R.o.V), 1)} mV, with no depolarizing stimulus` : 'no spike: the membrane returns to rest');
        });
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Repetitive firing and the Hodgkin–Huxley f–I curve',
      statement: String.raw`Held under a constant injected current $I$ the Hodgkin–Huxley model fires periodically once $I$ exceeds a critical value. Its firing rate does not start at zero: on a slow upward ramp the rate jumps from zero to a non-zero minimum at the critical current, and on a ramp back down the neuron keeps firing to a lower current than the one where it started, so that the $f$–$I$ curve has a **bistable** window in which both rest and repetitive firing are stable. At large current the spikes shrink and firing stops altogether (depolarization block). Hodgkin (1948) distinguished axons whose repetitive response can be arbitrarily slow (class 1) from those that start at a minimum frequency (class 2); the Hodgkin–Huxley model is of the second kind (type II).`,
      idea: String.raw`The gates $h$ and $n$ respond slowly (neuro-2.3), so rest is stable for a range of currents, while a limit cycle born in a subcritical Hopf bifurcation can coexist with it. The rate on that cycle is set by the time $n$ and $h$ need to recover after each spike (neuro-2.5), which is about 17 ms at 6.3 °C, hence a minimum rate near 58 Hz in this model. At the other end of the window the rest state itself loses stability, giving the abrupt jump on the upward ramp. The transition type is analysed in neuro-3.4 (Hopf, type II) and contrasted with neuro-3.5 (saddle-node on an invariant circle, type I).`,
      caption: String.raw`Left: the firing rate (inverse of the last interspike interval) against constant current, computed by slowly ramping the current up from rest (blue), down from the spiking state (orange), and for a sudden step from rest (green circles); drag the handle along the axis to choose $I$. Right: the voltage at that current, starting from rest or from the spiking state: in the bistable window the same current gives silence or spiking depending on the history. Choose the 0–150 range to see depolarization block. At 18.5 °C every rate is about 3.5 times faster, but the shape is the same.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane under constant current. The numbers (onset near 58 Hz; on a slow current ramp the bistable window runs from about 7 up to about 10 µA/cm² at 6.3 °C, while a sudden step from rest already fires from about 6.5) are those of this model at the stated temperature and settle times (300 ms per current), not measurements; in a real axon, sustained firing at these currents is also limited by ion accumulation.`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.8', 'neuro-3.4'],
      refs: ['Gerstner §4.4'],
      tags: ['f–I curve', 'bistability'],
      credit: 'Classification of repetitive responses by A. L. Hodgkin, 1948 (J. Physiol. 107: 165–181); model of Hodgkin and Huxley, 1952',
      verify: true,
      viz(v) {
        const Tsel = v.select('temperature', [{ value: 6.3, label: '6.3 °C' }, { value: 18.5, label: '18.5 °C' }], 6.3);
        const rng = v.select('current range', [{ value: 15, label: '0–15 µA/cm²' }, { value: 150, label: '0–150 µA/cm²' }], 15);
        const start = v.select('trace starts from', [{ value: 'rest', label: 'rest' }, { value: 'spiking', label: 'spiking state' }], 'rest');
        const grid = []; for (let I = 0; I <= 12; I += 0.25) grid.push(I); for (let I = 14; I <= 40; I += 2) grid.push(I); for (let I = 50; I <= 150; I += 10) grid.push(I);
        const sA = v.stage({ x: [0, 15], y: [0, 135], axes: 'box', gutter: true, xlabel: 'constant current I (µA/cm²)', ylabel: 'rate (Hz)', height: 300, weight: 1.1, minWidth: 320 });
        const sB = v.stage({ x: [0, 150], y: [-90, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 300, weight: 1, minWidth: 300 });
        const rate = (r) => { const sp = r.spikes.filter((x) => x > 100); return sp.length > 2 ? 1000 / (sp[sp.length - 1] - sp[sp.length - 2]) : 0; };
        const cache = {};
        const sweeps = () => {
          const T = Tsel.value; if (cache[T]) return cache[T];
          const o = { T, tEnd: 300, dt: T > 10 ? 0.025 : 0.04 };
          const run = (Is, y) => Is.map((I) => { const r = hhRun(() => I, { ...o, y0: y }); y = r.y; return [I, rate(r)]; });
          const spiking = hhRun(() => 20, { T, tEnd: 100, dt: o.dt }).y;
          const up = run(grid, hhRest()), down = run(grid.slice().reverse(), spiking).reverse();
          const step = grid.map((I) => [I, rate(hhRun(() => I, { ...o, y0: hhRest() }))]);
          // bistable window: lowest current that sustains firing on the way down and lowest that fires on the way up
          const dLo = down.find((p) => p[1] > 0)?.[0], uJump = up.find((p) => p[1] > 0)?.[0];
          const fmin = down.find((p) => p[1] > 0)?.[1];
          return (cache[T] = { up, down, step, dLo, uJump, fmin });
        };
        const h = sA.handle(8, 0, { color: 'gold', r: 8, constrain: 'x' });
        v.render(() => {
          const S = sweeps(), xmax = rng.value;
          let ymax = 20; for (const p of S.up.concat(S.down)) if (p[0] <= xmax) ymax = Math.max(ymax, p[1]);
          sA.setView([0, xmax], [0, ymax * 1.12]);
          const vis = (arr) => arr.filter((p) => p[0] <= xmax);
          sA.path(vis(S.down), { color: ION_COL.Na, width: 2.4 });
          sA.dots(vis(S.down), { r: 2.6, color: ION_COL.Na });
          sA.path(vis(S.up), { color: 'accent', width: 2.6 });
          sA.dots(vis(S.step), { r: 4, color: 'green', hollow: true });
          const I = clamp(h.x, 0, xmax); h.set(I, 0);
          sA.vline(I, { color: 'gold', width: 1.2, dash: [4, 3] });
          const y0 = start.value === 'spiking' ? hhRun(() => 20, { T: Tsel.value, tEnd: 100, dt: 0.04 }).y : hhRest();
          const o = hhSim((t) => (t >= 5 ? I : 0), { T: Tsel.value, tEnd: 150, dt: 0.04, every: 2, y0 });
          trace(sB, o.t, o.V, { color: 'accent', width: 2.2 });
          sB.text(`I = ${v.fix(I, 2)}`, 148, 52, { size: 11, color: 'gold', align: 'right' });
          h._S = S; h._I = I; h._o = o;
        });
        v.legend([['accent', 'ramp up from rest'], [ION_COL.Na, 'ramp down from spiking'], ['green', 'step from rest', { dot: true }]]);
        v.readout(() => {
          const S = h._S || sweeps(), I = h._I ?? 8, o = h._o, sp = o ? spikeTimes(o.t, o.V, 0).filter((t) => t > 5) : [];
          const f = (arr) => arr.reduce((a, p) => (Math.abs(p[0] - I) < Math.abs(a[0] - I) ? p : a), arr[0])[1];
          return String.raw`at $I = ${v.fix(I, 2)}$ µA/cm²: ramp up ${v.fix(f(S.up), 1)} Hz · ramp down ${v.fix(f(S.down), 1)} Hz · step from rest ${v.fix(f(S.step), 1)} Hz · this trace: ${sp.length} spikes in 145 ms` + '\n' +
            String.raw`lowest sustained rate on the way down: $${v.fix(S.fmin ?? 0, 1)}$ Hz at $I \approx ${v.fix(S.dLo ?? 0, 2)}$ · the upward ramp starts firing at $I \approx ${v.fix(S.uJump ?? 0, 2)}$ µA/cm²: bistable between them (grid step 0.25)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Model',
      name: 'Connor–Stevens A-current and type I firing',
      statement: String.raw`Adding a fast, transient potassium **A-current** $I_A = \bar g_A\, a^3 b\,(V-E_A)$, with its own activation $a$ and a slow inactivation $b$, to the sodium and delayed-rectifier currents of the Hodgkin–Huxley kind gives the **Connor–Stevens model**. Its $f$–$I$ curve starts continuously from zero frequency at the critical current (**type I**), unlike the Hodgkin–Huxley neuron, and near that current the first spike appears only after a long latency. Removing the A-current ($\bar g_A\to 0$) restores a non-zero minimum frequency (type II).`,
      idea: String.raw`After each spike the A-current is activated by the voltage and, because $b$ inactivates slowly, it adds an extra outward current that delays the next spike as the membrane climbs toward threshold. Near the critical input this delay can be arbitrarily long, so the rate can be arbitrarily low and the transition becomes a saddle-node on an invariant circle rather than a Hopf bifurcation (neuro-3.5, neuro-3.4). Connor and Stevens fitted their current to voltage-clamp records of an isolated gastropod neurone and used it to predict repetitive firing from the clamp data (neuro-1.5), the first such quantitative prediction after Hodgkin and Huxley.`,
      caption: String.raw`Choose the A-conductance. Left: firing rate against current step for your $\bar g_A$ (blue) and for $\bar g_A=0$ (red): the blue curve starts at zero, the red one at a high rate. Top right: latency to the first spike against current, on log axes; with the A-current it grows to more than 100 ms near threshold, while without it the first spike comes after about 3 ms. Drag the handle to pick the current. Bottom: the voltage trace (blue; red for $\bar g_A=0$) and the A-current conductance $\bar g_A a^3 b$ along the blue trace.`,
      scope: String.raw`Single-compartment model with the parameter set quoted on this page (rates multiplied by 3.8, a temperature factor); not checked against the original 1971 tables (verify). Voltages are in the convention of that parameter set (rest near −68 mV). The leak reversal is re-tuned so that rest stays fixed when $\bar g_A$ is varied, and the rates come from 600 ms runs, so rates below roughly 2 Hz read as zero.`,
      deps: ['neuro-2.3', 'neuro-2.7'],
      see: ['neuro-3.5', 'neuro-3.4', 'neuro-1.5'],
      refs: ['Gerstner §2.3', 'Dayan–Abbott ch. 6'],
      tags: ['A-current', 'type I'],
      credit: 'J. A. Connor and C. F. Stevens, 1971 (J. Physiol. 213: 1–53); J. A. Connor, D. Walter and R. McKown, 1977',
      verify: true,
      viz(v) {
        const gsel = v.select('A-conductance $\\bar g_A$', [0, 15, 30, 47.7].map((g) => ({ value: g, label: `${g}` })), 47.7);
        const IG = []; for (let I = 7; I <= 14.01; I += 0.5) IG.push(I);
        const sA = v.stage({ x: [7, 14], y: [0, 120], axes: 'box', gutter: true, xlabel: 'current step I (µA/cm²)', ylabel: 'rate (Hz)', height: 260, weight: 1, minWidth: 280 });
        const sL = v.stage({ x: [7, 14], y: [1, 1000], ylog: true, axes: 'box', gutter: true, xlabel: 'current step I (µA/cm²)', ylabel: 'first-spike latency (ms)', height: 260, weight: 1, minWidth: 280 });
        const sV = v.stage({ x: [0, 400], y: [-90, 50], axes: 'box', gutter: true, xlabel: 't (ms, step at 20)', ylabel: 'V (mV)', height: 200, weight: 1.4, minWidth: 320 });
        const sI = v.stage({ x: [0, 400], y: [0, 50], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gA a³b (mS/cm²)', height: 200, weight: 1, minWidth: 280 });
        const cache = {};
        const curve = (g) => {
          if (cache[g]) return cache[g];
          const pts = IG.map((I) => { const sp = csSpikes(I, g, { tEnd: 620, dt: 0.05 }); const n = sp.length; return { I, f: n >= 2 ? 1000 / (sp[n - 1] - sp[n - 2]) : 0, lat: n ? sp[0] - 20 : NaN, n }; });
          return (cache[g] = pts);
        };
        const h = sA.handle(10, 0, { color: 'gold', r: 8, constrain: 'x' });
        v.render(() => {
          const g = gsel.value, cg = curve(g), c0 = curve(0), I = clamp(h.x, 7, 14); h.set(I, 0);
          let fm = 20; for (const p of cg.concat(c0)) fm = Math.max(fm, p.f);
          sA.setView([7, 14], [0, fm * 1.12]);
          sA.path(c0.map((p) => [p.I, p.f]), { color: 'red', width: 2.2 }); sA.dots(c0.map((p) => [p.I, p.f]), { r: 2.5, color: 'red' });
          sA.path(cg.map((p) => [p.I, p.f]), { color: 'accent', width: 2.6 }); sA.dots(cg.map((p) => [p.I, p.f]), { r: 2.5, color: 'accent' });
          sA.vline(I, { color: 'gold', dash: [4, 3] });
          sL.path(c0.map((p) => (isFinite(p.lat) && p.lat > 0 ? [p.I, p.lat] : null)), { color: 'red', width: 2.2 });
          sL.path(cg.map((p) => (isFinite(p.lat) && p.lat > 0 ? [p.I, p.lat] : null)), { color: 'accent', width: 2.6 });
          sL.vline(I, { color: 'gold', dash: [4, 3] });
          const o = csRun(I, g, { tEnd: 400, t0: 20, dt: 0.05, every: 8 }), o0 = csRun(I, 0, { tEnd: 400, t0: 20, dt: 0.05, every: 8 });
          trace(sV, o0.t, o0.V, { color: 'red', width: 1.4, alpha: 0.7 });
          trace(sV, o.t, o.V, { color: 'accent', width: 2.2 });
          sI.setView([0, 400], [0, Math.max(5, ...o.a) * 1.15]);
          trace(sI, o.t, o.a, { color: 'purple', width: 2.2 });
          h._o = o; h._o0 = o0; h._I = I;
        });
        v.legend([['accent', 'chosen $\\bar g_A$'], ['red', '$\\bar g_A=0$'], ['purple', 'A-current conductance']]);
        const low = (g) => { const a = (cache[g] || []).filter((p) => p.f > 0).map((p) => p.f); return a.length ? v.fix(Math.min(...a), 1) + ' Hz' : 'none'; };
        v.readout(() => {
          const o = h._o, o0 = h._o0, I = h._I ?? 10; if (!o) return '';
          const lat = (r) => (r.spikes.length ? v.fix(r.spikes[0] - 20, 0) + ' ms' : 'no spike');
          const rt = (r) => { const n = r.spikes.length; return n >= 2 ? v.fix(1000 / (r.spikes[n - 1] - r.spikes[n - 2]), 1) + ' Hz' : '0'; };
          return String.raw`at $I=${v.fix(I, 1)}$ µA/cm²: with $\bar g_A = ${gsel.value}$: first spike after ${lat(o)}, rate ${rt(o)} · with $\bar g_A = 0$: first spike after ${lat(o0)}, rate ${rt(o0)}` + '\n' +
            String.raw`lowest nonzero rate on the grid (0.5 µA/cm² steps, 600 ms): ${low(gsel.value)} with the A-current, ${low(0)} without`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Channel noise and spontaneous spikes',
      statement: String.raw`A membrane has a finite number $N$ of ion channels, each opening and closing at random, so the conductances fluctuate around the deterministic Hodgkin–Huxley values with relative size of order $1/\sqrt N$. For a large patch this noise is negligible and the deterministic model is the limit $N\to\infty$ of the stochastic one. For a small patch (a thin axon, a dendritic spine, a small area of soma) the fluctuations are large enough to trigger **spontaneous spikes** from a subthreshold or zero input, to miss responses to input that would reach threshold, and to **jitter** the spike time in response to a repeated identical stimulus.`,
      idea: String.raw`Each channel is a continuous-time Markov chain (neuro-1.6, stoch-10.2). A potassium channel with four independent $n$-gates has five lumped states (number of open gates, with rates $(4-k)\alpha_n$ up and $k\beta_n$ down), a sodium channel has eight (three $m$-gates and one $h$-gate), and the channels are independent. Their mean obeys the Hodgkin–Huxley equations, while the variance of the open fraction is $p(1-p)/N$ for each gate (law of large numbers and central limit theorem). Threshold is a steep function of the state (neuro-2.4), so a random fluctuation of a few channels is enough to start a spike when the patch is small; this was shown in simulations of small membrane patches by Chow and White (1996), and its consequences for spike-timing reliability by Schneidman, Freedman and Segev (1998) and reviewed by White, Rubinstein and Kay (2000).`,
      caption: String.raw`The patch area sets the channel numbers ($60$ Na⁺ and $18$ K⁺ channels per µm², 20 pS each, which reproduces $\bar g_{Na}=120$ and $\bar g_K=36$ mS/cm²). The input current is constant and below the deterministic threshold, so the deterministic model (dashed) stays at rest. Top left: one stochastic run. Bottom left: spike rasters of six runs and of the deterministic model. Right: the distribution of the first-spike latency after a fixed suprathreshold 1 ms pulse over 40 repeated trials, with the deterministic latency marked. Shrink the patch and watch spikes appear from nothing and the latency histogram widen; enlarge it and both collapse onto the deterministic picture. Latencies near zero are spontaneous spikes that happen to fall just after the pulse starts; trials without a spike after the pulse are counted as missed. Press "new runs" for fresh random numbers.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley kinetics at 6.3 °C with independent channels of 20 pS and densities 60 (Na⁺) and 18 (K⁺) per µm², a parameter set common in stochastic-HH studies; the sampler advances the lumped channel states with binomial draws per 0.025 ms step (an approximation of the exact Gillespie scheme, accurate when rate × step is small). Which paper first used these exact numbers was not confirmed here (verify).`,
      deps: ['neuro-2.3', 'neuro-1.6'],
      see: ['neuro-2.4', 'stoch-1.4'],
      refs: ['Gerstner §2.2', 'White, Rubinstein & Kay, Trends Neurosci. 23 (2000)'],
      tags: ['channel noise', 'stochastic'],
      credit: 'Chow and White, 1996; Schneidman, Freedman and Segev, 1998',
      verify: true,
      viz(v) {
        const As = v.slider('patch area', 1, 300, 6, { log: true, fmt: (x) => `${v.fix(x, x < 10 ? 1 : 0)} µm²` });
        const Is = v.slider('constant current $I$', 0, 6, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} µA/cm²` });
        let seed = 1; v.button('new runs', () => { seed++; });
        const sV = v.stage({ x: [0, 200], y: [-90, 55], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 200, weight: 1.3, minWidth: 340 });
        const sR = v.stage({ x: [0, 200], y: [0.3, 7.7], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'run', height: 200, weight: 1.3, minWidth: 340, yticks: [[1, 'det.'], [2, '1'], [3, '2'], [4, '3'], [5, '4'], [6, '5'], [7, '6']] });
        const sH = v.stage({ x: [0, 8], y: [0, 1], axes: 'box', gutter: true, xlabel: 'first-spike latency after pulse onset (ms)', ylabel: 'fraction of trials', height: 420, weight: 1, minWidth: 280 });
        const NR = 6, NT = 40, PUL = pulse(2, 1, 9);
        let key = '', C = null;
        const get = () => {
          const k = `${As.value}|${Is.value}|${seed}`; if (k === key) return C; key = k;
          const A = As.value, NNa = Math.round(60 * A), NK = Math.round(18 * A), I = Is.value;
          const det = hhSim(() => I, { tEnd: 200, dt: 0.05, every: 4 });
          const runs = Array.from({ length: NR }, (_, r) => hhStochastic(() => I, { NNa, NK, tEnd: 200, dt: 0.025, every: 8, rng: v.rng(seed * 1000 + r) }));
          const lats = []; let miss = 0;
          for (let t = 0; t < NT; t++) { const o = hhStochastic(PUL, { NNa, NK, tEnd: 12, dt: 0.025, every: 8, rng: v.rng(seed * 7919 + 100 + t) }); const s = o.spikes.find((x) => x > 2); if (s) lats.push(s - 2); else miss++; }
          const dl = hhRun(PUL, { tEnd: 12, dt: 0.04 }).spikes[0] - 2;
          C = { A, NNa, NK, det, runs, lats, miss, dl, I };
          return C;
        };
        v.render(() => {
          const D = get();
          trace(sV, D.det.t, D.det.V, { color: 'ink', width: 1.4, dash: [5, 4] });
          trace(sV, D.runs[0].t, D.runs[0].V, { color: 'accent', width: 1.8 });
          sR.hline(1.5, { color: 'grid' });
          D.runs.forEach((r, i) => sR.dots(r.spikes.map((t) => [t, i + 2]), { r: 3.2, color: 'accent' }));
          sR.dots(spikeTimes(D.det.t, D.det.V, 0).map((t) => [t, 1]), { r: 3.2, color: 'ink' });
          const bins = 20, w = 8 / bins, cnt = new Array(bins).fill(0);
          for (const l of D.lats) { const b = Math.floor(l / w); if (b >= 0 && b < bins) cnt[b]++; }
          const fr = cnt.map((c) => c / NT), fm = Math.max(0.2, ...fr);
          sH.setView([0, 8], [0, fm * 1.2]);
          sH.bars(fr, { x0: w / 2, dx: w, color: 'accent' });
          if (D.dl) sH.vline(D.dl, { color: 'ink', dash: [5, 4], width: 1.6 });
          sH.text('deterministic', D.dl || 3, fm * 1.12, { size: 10.5, color: 'ink', align: 'left', dx: 5 });
        });
        v.legend([['accent', 'stochastic channels'], ['ink', 'deterministic Hodgkin–Huxley', { dash: true }]]);
        v.readout(() => {
          const D = get(), sp = D.runs.reduce((a, r) => a + r.spikes.length, 0), m = D.lats.length ? D.lats.reduce((a, b) => a + b, 0) / D.lats.length : NaN;
          const sd = D.lats.length > 1 ? Math.sqrt(D.lats.reduce((a, b) => a + (b - m) ** 2, 0) / (D.lats.length - 1)) : NaN;
          return String.raw`patch of $${v.fix(D.A, D.A < 10 ? 1 : 0)}$ µm²: $N_{Na} = ${D.NNa}$, $N_K = ${D.NK}$ channels · relative size of fluctuations $\sim 1/\sqrt{N_{Na}} = ${v.fix(100 / Math.sqrt(D.NNa), 1)}\,\%$` + '\n' +
            String.raw`at $I = ${v.fix(D.I, 1)}$ µA/cm² the deterministic model is silent; the six stochastic runs fired ${sp} spikes in 200 ms (${v.fix(sp / (NR * 0.2), 1)} spikes/s per patch) · pulse response: latency $${isFinite(m) ? v.fix(m, 2) : '—'} \pm ${isFinite(sd) ? v.fix(sd, 2) : '—'}$ ms over ${D.lats.length} spiking trials (deterministic $${v.fix(D.dl ?? NaN, 2)}$ ms), ${D.miss} of ${NT} trials missed`;
        });
      },
    },
  ],
};
