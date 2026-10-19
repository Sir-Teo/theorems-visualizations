// Computational Neuroscience — Chapter 2: The Hodgkin–Huxley model (part b: 2.6–2.9)
//
// Source follow-up: complete author Connor–Stevens code, Goldwyn et al. channel-chain model sections,
// Gerstner phase-plane sections, independent DOP853 references and light/dark checks are recorded in
// docs/verification/neuro-source-review.md. All numbers in the panels are computed, not digitized data.
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
      statement: String.raw`If the Hodgkin–Huxley membrane is held hyperpolarized by an injected current for long enough and the current is then switched off, the membrane may fire a spike with no depolarizing stimulus at all: this is **post-inhibitory rebound** (in the older literature, **anode break excitation**, because the break of an anodal, hyperpolarizing current excites). The effect needs a hyperpolarization that is both strong enough and long enough (a boundary in the plane of duration and amplitude). Two slow changes during the hyperpolarization prepare it: sodium channels recover from inactivation ($h$ rises) and potassium channels deactivate ($n$ falls). In this model both matter, and $n$ matters more: if $n$ is held at its resting value (during the pulse only, or for the whole run), the rebound region shrinks to the strongest, longest pulses or disappears altogether, whereas holding $h$ at its resting value only raises the critical current by about 10–20 %.`,
      idea: String.raw`At rest about 40 % of the sodium channels are inactivated ($h_\infty(-65\text{ mV})\approx 0.6$) and about a third of the potassium gates are open ($n_\infty\approx 0.32$). Hyperpolarization raises $h_\infty$ toward 1 and lowers $n_\infty$ (neuro-2.1, neuro-2.2), with time constants of several milliseconds, so after a few milliseconds more sodium channels are available and fewer potassium channels are open. When the current is released, $V$ climbs back toward rest through the voltage range where $m$ is already opening, while $h$ and $n$ are still in their altered state and relax only slowly (neuro-1.7): the net current is inward for a moment and the regenerative loop of neuro-2.3 fires a spike. Textbooks name both changes (de-inactivation of Na⁺ and deactivation of K⁺). The computation on this page asks how much each is worth, and the answer depends on what "frozen" means, so three definitions are offered. Values below are for the 20 × 16 grid of the map, counting the cells with a rebound spike (full model: 186 of 320; critical current at 40 ms: 2.8 µA/cm²). (a) Frozen at the resting value for the whole run: $h$ frozen gives 182 cells (critical current 3.0), $n$ frozen gives 0, both frozen give 0. (b) Frozen at the resting value only during the pulse and free afterwards: $h$ frozen gives 169 cells (3.3), $n$ frozen gives 42 cells, all at the strongest pulses (critical current 6.3), both frozen give 0. So with $n$ unable to deactivate, $h$ alone can still produce a rebound, but only for strong, long pulses; with $h$ unable to de-inactivate, $n$ alone produces nearly the whole map. In this model the potassium deactivation dominates and the sodium de-inactivation is a smaller, supporting contribution. (c) Frozen at the value reached at the end of the pulse, so that it cannot relax during the rebound: rebound occurs in more cells (205 for $h$, 297 for $n$, 302 for both), because a gate held at its hyperpolarized value keeps the membrane more excitable; this definition tests whether the post-release relaxation is needed (it is not) and not whether the change during the pulse is, and with both gates frozen the membrane has no restoring slow variable at all, so it is not a fair test of the mechanism. The mechanism is in agreement with the usual account (Hodgkin and Huxley's model is credited with explaining anode break; course notes list both $h$ de-inactivation and $n$ deactivation), but the ranking of the two gates is a computed result for this model at 6.3 °C, not a statement taken from the literature.`,
      caption: String.raw`Drag the handle in the map to choose the duration and strength of a hyperpolarizing current applied at $t=2$ ms. Top: $V(t)$ and the gates; $h$ climbs during the hyperpolarization and $n$ falls. Map below: every point is a separate simulation (green: a rebound spike occurs, grey: none). Choose a gate to freeze and a definition of "frozen": (a) at its resting value for the whole run; (b) at its resting value during the pulse only, free afterwards; (c) at the value it has when the current is switched off, for the rest of the run. In (a) and (b), freezing $n$ removes most or all of the green region while freezing $h$ shrinks it only slightly; freezing both removes it entirely. In (c) nothing is lost (the map gets larger), which shows that the relaxation of the gates after release is not what makes the spike, but their displacement during the pulse.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane at 6.3 °C, with currents applied from rest. Many real neurons show much stronger rebound because of additional currents (T-type calcium, $I_h$), which this four-variable model does not contain.`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.2', 'neuro-2.4'],
      refs: ['Gerstner §2.3'],
      tags: ['rebound', 'inactivation'],
      credit: 'Model of A. L. Hodgkin and A. F. Huxley, 1952',
      viz(v) {
        const frz = v.select('which slow variable is frozen', [{ value: '', label: 'none (full model)' }, { value: 'h', label: '$h$ frozen' }, { value: 'n', label: '$n$ frozen' }, { value: 'hn', label: 'both $h$ and $n$ frozen' }], '');
        const how = v.select('what "frozen" means', [{ value: 'rest', label: '(a) at the resting value, whole run' }, { value: 'pulse', label: '(b) at the resting value during the pulse only' }, { value: 'release', label: '(c) at the end-of-pulse value, after release' }], 'rest');
        const DUR = [1, 40], AMP = [0, 8], t0 = 2;
        const sA = v.stage({ x: [0, 70], y: [-100, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 230, weight: 1.1, minWidth: 320 });
        const sG = v.stage({ x: [0, 70], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gates', height: 230, weight: 1.1, minWidth: 320 });
        const sM = v.stage({ x: DUR, y: [-8.2, 0.2], axes: 'box', gutter: true, xlabel: 'hyperpolarization duration (ms)', ylabel: 'current (µA/cm²)', height: 430, weight: 1, minWidth: 300 });
        const params = (fz) => ({ ...HH, freeze: fz });
        // Frozen gates: (a) held at rest for the whole run; (b) held at rest until the current is switched off, free afterwards;
        // (c) free during the pulse, held at the value reached at the switch-off for the rest of the run. Two RK4 segments split at t0 + d.
        const response = (d, a, fz, rec, mode) => {
          const ts = t0 + d, f = (t) => (t >= t0 && t < ts ? -a : 0), T = 6.3;
          if (!fz || mode === 'rest') { const o = { T, tEnd: ts + 40, dt: 0.04, p: params(fz) }; return rec ? hhSim(f, { ...o, every: 2 }) : hhRun(f, o); }
          const dt1 = ts / Math.ceil(ts / 0.04), p1 = params(mode === 'pulse' ? fz : ''), p2 = params(mode === 'pulse' ? '' : fz);
          if (!rec) {
            const r1 = hhRun(f, { T, tEnd: ts, dt: dt1, p: p1 }), r2 = hhRun(() => 0, { T, tEnd: 40, dt: 0.04, y0: r1.y, p: p2 });
            return { spikes: [...r1.spikes, ...r2.spikes.map((x) => x + ts)] };
          }
          const r1 = hhSim(f, { T, tEnd: ts, dt: dt1, every: 2, p: p1 }), r2 = hhSim(() => 0, { T, tEnd: 40, dt: 0.04, every: 2, y0: r1.y, p: p2 });
          const o = {}; for (const k of Object.keys(r1)) if (Array.isArray(r1[k]) && k !== 'y') o[k] = r1[k].concat(r2[k].slice(1).map((x, i) => (k === 't' ? x + ts : x)));
          return o;
        };
        const maps = {};
        const grid = () => {
          const fz = frz.value, key = fz + '|' + how.value; if (maps[key]) return maps[key];
          const nx = 20, ny = 16, cells = [];
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const d = DUR[0] + ((DUR[1] - DUR[0]) * (i + 0.5)) / nx, a = ((j + 0.5) * AMP[1]) / ny;
            const r = response(d, a, fz, false, how.value); cells.push({ d, a, spike: r.spikes.length > 0 });
          }
          return (maps[key] = { cells, nx, ny });
        };
        const h = sM.handle(20, -4, { color: 'gold', r: 8, constrain: (x, y) => [clamp(x, 1, 40), clamp(y, -8, -0.2)] });
        v.render(() => {
          const G = grid(), d = h.x, a = -h.y, fz = frz.value;
          const wx = (DUR[1] - DUR[0]) / G.nx, wy = AMP[1] / G.ny;
          for (const c of G.cells) sM.rect(c.d - wx / 2, -(c.a + wy / 2), c.d + wx / 2, -(c.a - wy / 2), { fill: c.spike ? 'green' : 'muted', fillAlpha: c.spike ? 0.6 : 0.16, stroke: false });
          sM.text('no spike', 30, -0.9, { size: 11, color: 'muted', align: 'left' }); sM.text('rebound spike', 24, -6.5, { size: 11, color: 'ink', align: 'left' });
          const o = response(d, a, fz, true, how.value), sp = spikeTimes(o.t, o.V, 0);
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
      statement: String.raw`Held under a constant injected current $I$ the Hodgkin–Huxley model fires periodically once $I$ exceeds a critical value. Its firing rate does not start at zero: on a slow upward ramp the rate jumps from zero to a non-zero minimum at the critical current, and on a ramp back down the neuron keeps firing to a lower current than the one where it started, so that the $f$–$I$ curve has a **bistable** window in which both rest and repetitive firing are stable at the classical low-temperature parameters; other temperatures must be checked separately. At large current the spikes shrink and firing stops altogether (depolarization block). Hodgkin (1948) distinguished axons whose repetitive response can be arbitrarily slow (class 1) from those that start at a minimum frequency (class 2); the Hodgkin–Huxley model is of the second kind (type II).`,
      idea: String.raw`The gates $h$ and $n$ respond slowly (neuro-2.3), so rest is stable for a range of currents, while a stable large-amplitude cycle can coexist with an unstable small cycle that shrinks into rest at a subcritical Hopf bifurcation. The rate on that cycle is set by the time $n$ and $h$ need to recover after each spike (neuro-2.5), which is about 17 ms at 6.3 °C, hence a minimum rate near 58 Hz in this model. At the other end of the window the rest state itself loses stability, giving the abrupt jump on the upward ramp. The transition type is analysed in neuro-3.4 (Hopf, type II) and contrasted with neuro-3.5 (saddle-node on an invariant circle, type I).`,
      caption: String.raw`Left: the firing rate (inverse of the last interspike interval) against constant current, computed by slowly ramping the current up from rest (blue), down from the spiking state (orange), and for a sudden step from rest (green circles); drag the handle along the axis to choose $I$. Right: the voltage at that current, starting from rest or from the spiking state: in the bistable window the same current gives silence or spiking depending on the history. (A sudden step from rest, as in the right-hand trace, already kicks the state over the unstable cycle and fires from about 6.5 µA/cm²; only a slow ramp keeps the membrane silent up to about 10.) Choose the 0–150 range to see depolarization block. At 18.5 °C the gating rates alone are multiplied by $3^{(18.5-6.3)/10}=3.8202$. The voltage equation is not multiplied, so the firing curve is recomputed and neither its shape nor firing frequency is obtained by a uniform time rescaling.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane under constant current. The numbers (onset near 58 Hz; on a slow current ramp the bistable window runs from about 7 up to about 10 µA/cm² at 6.3 °C, while a sudden step from rest already fires from about 6.5) are those of this model at the stated temperature and settle times (300 ms per current), not measurements; in a real axon, sustained firing at these currents is also limited by ion accumulation.`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.8', 'neuro-3.4'],
      refs: ['Gerstner §4.4'],
      tags: ['f–I curve', 'bistability'],
      credit: 'Classification of repetitive responses by A. L. Hodgkin, 1948 (J. Physiol. 107: 165–181); model of Hodgkin and Huxley, 1952',
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
            String.raw`lowest sustained rate on the way down: $${v.fix(S.fmin ?? 0, 1)}$ Hz at $I \approx ${v.fix(S.dLo ?? 0, 2)}$ · the upward ramp starts firing at $I \approx ${v.fix(S.uJump ?? 0, 2)}$ µA/cm²: history-dependent interval between these grid onsets (steps 0.25 below 12, 2 through 40, 10 above)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Model',
      name: 'Connor–Stevens A-current and type I firing',
      statement: String.raw`Adding a fast, transient potassium **A-current** $I_A = \bar g_A\, a^3 b\,(V-E_A)$, with its own activation $a$ and a slow inactivation $b$, to the sodium and delayed-rectifier currents of the Hodgkin–Huxley kind gives the **Connor–Stevens model**. For appropriate kinetics and a sufficiently strong A-current, this model family supports continuous, zero-frequency onset (**type I**) and long first-spike latency. Low-A-current members can instead have nonzero onset (**type II**). This is a parameter-dependent bifurcation change, not a consequence of adding any positive A-current; the finite grid below illustrates the rate and latency contrast without resolving arbitrarily small onset frequencies.`,
      idea: String.raw`After each spike the A-current is activated by the voltage and, because $b$ inactivates slowly, it adds an extra outward current that delays the next spike as the membrane climbs toward threshold. In the type I regime of this model family, the delay can be arbitrarily long and onset occurs through a saddle-node on an invariant circle rather than a Hopf bifurcation (neuro-3.5, neuro-3.4). Barreiro, Thilo & Shea-Brown (2012), Fig. 2 and their bifurcation-analysis section, explicitly compare type II members near $g_A=0$ and type I members near $g_A=60$ in their parameter family. The author-code variant below keeps $g_K$ fixed and re-tunes the leak reversal when $g_A$ changes, so those published numerical thresholds are not transferred to this panel.`,
      caption: String.raw`Choose the A-conductance. Left: firing rate against current step for your $\bar g_A$ (blue) and for $\bar g_A=0$ (red): the points show the computed rates, with zero used when fewer than two spikes are detected in the run; connecting lines do not locate the bifurcation. Top right: latency to the first spike against current, on log axes; a strong A-current can produce a much longer latency near threshold; the readout gives values for the selected current. Drag the handle to pick the current. Bottom: the voltage trace (blue; red for $\bar g_A=0$) and the A-current conductance $\bar g_A a^3 b$ along the blue trace.`,
      scope: String.raw`Single-compartment teaching variant checked against Ermentrout’s complete author-hosted cs.ode implementation: $g_K=20$, $g_A=47.7$, $E_A=-75$, $E_L=-17$ at the reference conductance, gate-rate factor 3.8, and an extra factor 2 in the n time constant. Its initial state is equilibrated here, unlike the author file’s approximate initial condition and pulse. The A activation exponent 1/3 replaces the code’s rounded 0.3333. This is not claimed to reproduce the original 1971/1977 fitted tables or Barreiro et al.’s separate parameter family. Voltages are in the convention of that parameter set (rest near −68 mV). The leak reversal is re-tuned so that rest stays fixed when $\bar g_A$ is varied, and the rates come from 600 ms runs, so rates below roughly 2 Hz read as zero.`,
      deps: ['neuro-2.3', 'neuro-2.7'],
      see: ['neuro-3.5', 'neuro-3.4', 'neuro-1.5'],
      refs: ['Ermentrout, author-hosted cs.ode (complete equations and parameters)', 'Barreiro, Thilo & Shea-Brown (2012), Neuron model and Characterizing the dynamics of spike generation sections; Fig. 2'],
      tags: ['A-current', 'type I'],
      credit: 'J. A. Connor and C. F. Stevens, 1971 (J. Physiol. 213: 1–53); J. A. Connor, D. Walter and R. McKown, 1977',
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
      statement: String.raw`A membrane has a finite number $N$ of ion channels, each opening and closing at random, so, under voltage clamp, the open-channel fraction has fluctuations of order $1/\sqrt N$ (the coefficient depends on its opening probability). In a freely evolving membrane, the resulting voltage feedback can amplify small channel fluctuations into spikes. For a large patch this noise is negligible and the deterministic model is the limit $N\to\infty$ of the stochastic one. For a small patch (a thin axon, a dendritic spine, a small area of soma) the fluctuations are large enough to trigger **spontaneous spikes** from a subthreshold or zero input, to miss responses to input that would reach threshold, and to **jitter** the spike time in response to a repeated identical stimulus.`,
      idea: String.raw`Each channel is a continuous-time Markov chain (neuro-1.6, stoch-10.2). A potassium channel with four independent $n$-gates has five lumped states (number of open gates, with rates $(4-k)\alpha_n$ up and $k\beta_n$ down), a sodium channel has eight (three $m$-gates and one $h$-gate), conditionally on a voltage trajectory, channels have independent transition noise; their common voltage couples them in a freely evolving patch. Under voltage clamp, the fraction of open **channels** has variance $p_{\rm open}(1-p_{\rm open})/N$, with $p_{K}=n_\infty^4$ and $p_{Na}=m_\infty^3h_\infty$. In the large-population continuous-time limit the macroscopic fractions follow Hodgkin–Huxley (law of large numbers and central limit theorem). Threshold is a steep function of the state (neuro-2.4), so a random fluctuation of a few channels is enough to start a spike when the patch is small; this was shown in simulations of small membrane patches by Chow and White (1996), and its consequences for spike-timing reliability by Schneidman, Freedman and Segev (1998) and reviewed by White, Rubinstein and Kay (2000).`,
      caption: String.raw`The patch area sets the channel numbers ($60$ Na⁺ and $18$ K⁺ channels per µm², 20 pS each, which reproduces $\bar g_{Na}=120$ and $\bar g_K=36$ mS/cm²). The constant input is below the sustained-firing range, so the deterministic model (dashed) settles to rest; a sudden step at the larger settings can produce transient spikes. Top left: one stochastic run. Bottom left: spike rasters of six runs and of the deterministic model. Right: the distribution of the first-spike latency after a fixed suprathreshold 1 ms pulse over 40 repeated trials, with the deterministic latency marked. Shrink the patch and watch spikes appear from nothing and compare the latency distribution; enlarging the patch reduces fluctuations toward the deterministic picture. Forty trials give a noisy empirical histogram, not a monotonic-width theorem. Latencies near zero are spontaneous spikes that happen to fall just after the pulse starts; trials without a spike after the pulse are counted as missed. Press "new runs" for fresh random numbers.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley kinetics at 6.3 °C with independent channels of 20 pS and densities 60 (Na⁺) and 18 (K⁺) per µm², a parameter set common in stochastic-HH studies; Goldwyn et al. (arXiv:1009.4172v1), Table I and §IV.A.1, give these densities and maximal conductances, compatible with 20 pS per channel, and the five/eight-state chains. This implementation uses exact frozen-voltage channel transition probabilities, sampled by binomial inversion and multinomial redistribution at 0.01 ms; voltage is advanced by forward Euler. It includes multiple gate transitions per step, but voltage/channel coupling remains a finite-step approximation, unlike event-driven Gillespie. The paper uses a different 60 mV-above-rest spike criterion and long-run ISI experiments; our 0 mV crossing and 40 short pulse trials are explicitly separate protocols.`,
      deps: ['neuro-2.3', 'neuro-1.6', 'stoch-10.2'],
      see: ['neuro-2.4', 'stoch-1.4'],
      refs: ['Goldwyn, Imennov, Famulare & Shea-Brown, arXiv:1009.4172v1, §§II.A–B, III.A.1, IV.A.1 and Tables I–II'],
      tags: ['channel noise', 'stochastic'],
      credit: 'Chow and White, 1996; Schneidman, Freedman and Segev, 1998',
      viz(v) {
        const As = v.slider('patch area', 1, 300, 6, { log: true, fmt: (x) => `${v.fix(x, x < 10 ? 1 : 0)} µm²` });
        const Is = v.slider('constant current $I$', 0, 6, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} µA/cm²` });
        let seed = 1; v.button('new runs', () => { seed++; });
        const sV = v.stage({ x: [0, 200], y: [-90, 55], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 200, weight: 1.3, minWidth: 340 });
        const sR = v.stage({ x: [0, 200], y: [0.3, 7.7], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'run', height: 200, weight: 1.3, minWidth: 340, yticks: [[1, 'det.'], [2, '1'], [3, '2'], [4, '3'], [5, '4'], [6, '5'], [7, '6']] });
        const sH = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, xlabel: 'first-spike latency after pulse onset (ms)', ylabel: 'fraction of trials', height: 420, weight: 1, minWidth: 280 });
        const NR = 6, NT = 40, PUL = pulse(2, 1, 9);
        let key = '', C = null;
        const get = () => {
          const k = `${As.value}|${Is.value}|${seed}`; if (k === key) return C; key = k;
          const A = As.value, NNa = Math.round(60 * A), NK = Math.round(18 * A), I = Is.value;
          const det = hhSim(() => I, { tEnd: 200, dt: 0.05, every: 4 });
          const runs = Array.from({ length: NR }, (_, r) => hhStochastic(() => I, { NNa, NK, tEnd: 200, dt: 0.01, every: 20, rng: v.rng(seed * 1000 + r) }));
          const lats = []; let miss = 0;
          for (let t = 0; t < NT; t++) { const o = hhStochastic(PUL, { NNa, NK, tEnd: 12, dt: 0.01, every: 20, rng: v.rng(seed * 7919 + 100 + t) }); const s = o.spikes.find((x) => x > 2); if (s) lats.push(s - 2); else miss++; }
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
          const bins = 25, w = 10 / bins, cnt = new Array(bins).fill(0);
          for (const l of D.lats) { const b = Math.min(bins - 1, Math.floor(l / w)); if (l >= 0 && l <= 10 && b >= 0 && b < bins) cnt[b]++; }
          const fr = cnt.map((c) => c / NT), fm = Math.max(0.2, ...fr);
          sH.setView([0, 10], [0, fm * 1.2]);
          sH.bars(fr, { x0: w / 2, dx: w, color: 'accent' });
          if (D.dl) sH.vline(D.dl, { color: 'ink', dash: [5, 4], width: 1.6 });
          sH.text('deterministic', D.dl || 3, fm * 1.12, { size: 10.5, color: 'ink', align: 'left', dx: 5 });
        });
        v.legend([['accent', 'stochastic channels'], ['ink', 'deterministic Hodgkin–Huxley', { dash: true }]]);
        v.readout(() => {
          const D = get(), sp = D.runs.reduce((a, r) => a + r.spikes.length, 0), m = D.lats.length ? D.lats.reduce((a, b) => a + b, 0) / D.lats.length : NaN;
          const sd = D.lats.length > 1 ? Math.sqrt(D.lats.reduce((a, b) => a + (b - m) ** 2, 0) / (D.lats.length - 1)) : NaN;
          return String.raw`patch of $${v.fix(D.A, D.A < 10 ? 1 : 0)}$ µm²: $N_{Na} = ${D.NNa}$, $N_K = ${D.NK}$ channels · channel-count scaling factor $1/\sqrt{N_{Na}} = ${v.fix(100 / Math.sqrt(D.NNa), 1)}\,\%$` + '\n' +
            String.raw`at $I = ${v.fix(D.I, 1)}$ µA/cm² deterministic run: ${spikeTimes(D.det.t, D.det.V, 0).length} transient/sustained crossings in this window; the six stochastic runs fired ${sp} spikes in 200 ms (${v.fix(sp / (NR * 0.2), 1)} spikes/s per patch) · pulse response: latency $${isFinite(m) ? v.fix(m, 2) : '—'} \pm ${isFinite(sd) ? v.fix(sd, 2) : '—'}$ ms over ${D.lats.length} spiking trials (deterministic $${v.fix(D.dl ?? NaN, 2)}$ ms), ${D.miss} of ${NT} trials missed`;
        });
      },
    },
  ],
};
