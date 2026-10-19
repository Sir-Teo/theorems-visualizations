// Computational Neuroscience — Chapter 1: The neuron as an electrical circuit (part a: 1.1–1.4)
import { VT, ION_COL, ION_Z, NEURON, nernst, ghkI, clamp, idxAt, trace, bilayer } from './ch01.shared.js';

// ---------- helpers for this file ----------
const bisect = (f, a, b, n = 60) => { let fa = f(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
/** Peak of n passive responses to 1 ms pulses spaced dt apart, each alone peaking at a (exact superposition). */
function pulseTrain(tau, dt, n, a, tEnd, h = 0.05) {
  const RI = a / (1 - Math.exp(-1 / tau)), one = (s) => (s <= 0 ? 0 : s < 1 ? RI * (1 - Math.exp(-s / tau)) : a * Math.exp(-(s - 1) / tau));
  const ts = [], u = [], parts = Array.from({ length: n }, () => []);
  for (let t = 0; t <= tEnd + 1e-9; t += h) { ts.push(t); let s = 0; for (let k = 0; k < n; k++) { const x = one(t - 2 - k * dt); parts[k].push(x); s += x; } u.push(s); }
  return { ts, u, parts };
}

export default {
  collection: 'neuro',
  chapter: 1,
  title: 'The neuron as an electrical circuit',
  summary: String.raw`A patch of neuronal membrane is a capacitor in parallel with conductances, each in series with a battery set by an ion's reversal potential. A passive membrane integrates its input with a time constant $\tau_m = r_mc_m$. The conductance-based membrane equation adds the driving force of each ion and makes the resting potential a conductance-weighted average of reversal potentials. The voltage clamp, a feedback amplifier, made these conductances measurable. Single ion channels turn out to be stochastic two-state gates whose averages obey first-order kinetics, the gating variables that the Hodgkin–Huxley model of the next chapter is built from.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'The membrane as an RC circuit',
      statement: String.raw`A lipid bilayer about 4 nm thick separates two conducting salt solutions, so a patch of membrane is a **capacitor**, with specific capacitance $c_m \approx 1\ \mu\mathrm{F/cm^2}$ in almost all cells. Its ion channels form a **resistor** in parallel, with specific resistance $r_m$ (in $\Omega\,\mathrm{cm^2}$), in series with a battery at the resting potential $E_L$ (physio-1.9). For a cell of membrane area $A$, $C = c_mA$, $R_{\text{in}} = r_m/A$, and an injected current $I_e$ obeys
$$C\,\frac{dV}{dt} = -\frac{V - E_L}{R_{\text{in}}} + I_e .$$
A current step therefore charges the membrane exponentially toward $E_L + I_eR_{\text{in}}$ with time constant $\tau_m = R_{\text{in}}C = r_mc_m$, which is independent of the cell's size.`,
      idea: String.raw`Charge conservation at the membrane node: the injected current either charges the capacitor ($C\,dV/dt$) or leaks through the channels ($(V-E_L)/R$). This is the RC circuit of electromagnetism (em-6.12, circ-5.5), with the membrane playing both parts. Both $C$ and $1/R$ scale with area, so their product $\tau_m$ is a property of the membrane alone. The readout repeats the classic measurement. The steady deflection gives $R_{\text{in}} = \Delta V/I_e$ and the exponential gives $\tau_m$, so $C = \tau_m/R_{\text{in}}$, and dividing by the cell's area recovers $c_m$. Gentet, Stuart and Clements (2000) measured $0.9\ \mu\mathrm{F/cm^2}$ in rodent neurons this way. Human cortical pyramidal cells appear to have about half that (Eyal et al. 2016).`,
      caption: String.raw`The schematic is simulated by the circuit kit (trapezoidal integration). Wire colour shows voltage, and the gold dots move with the current. Early in the step the current pours into the capacitor, and later it all flows through the membrane resistance. Right: the recorded voltage with 0.25 mV of recording noise, the fitted exponential (dashed) and the extracted $\tau_m$, $R_{\text{in}}$ and $c_m$. Change the cell's size: $C$ and $R_{\text{in}}$ change but $\tau_m$ does not. Pick another membrane and the fit recovers its specific capacitance.`,
      scope: String.raw`An isopotential (point) cell with passive membrane; extended dendrites add slower components (cable, neuro-4.1), and voltage-gated channels make $R$ depend on $V$.`,
      deps: ['physio-1.9', 'circ-2.1', 'sig-2.9'],
      see: ['circ-5.5', 'em-3.8', 'neuro-4.1'],
      refs: ['Dayan–Abbott ch. 5', 'Gerstner §1.3', 'Gentet, Stuart & Clements, Biophys. J. 79 (2000)'],
      tags: ['membrane', 'circuit'],
      viz(v) {
        const mem = v.select('membrane', [{ value: 0.9, label: 'rodent neuron' }, { value: 0.5, label: 'human L2/3' }, { value: 1.0, label: 'squid axon' }], 0.9);
        const dS = v.slider('cell diameter $d$', 8, 60, 20, { step: 1, fmt: (x) => `${x} µm` });
        const rmS = v.slider('specific resistance $r_m$', 5, 100, 20, { log: true, fmt: (x) => `${v.fix(x, 0)} kΩ·cm²` });
        const IS = v.slider('current step $I_e$', 2, 50, 10, { step: 1, fmt: (x) => `${x} pA` });
        const sc = v.stage({ x: [-1.6, 7.6], y: [-0.9, 3.9], equal: true, axes: false, height: 280, weight: 1 });
        const sp = v.stage({ x: [0, 100], y: [-72, -50], height: 280, axes: 'box', xlabel: 't (ms)', ylabel: 'V (mV)', weight: 1.2 });
        const C = v.circuit(sc, [
          { type: 'I', id: 'Ie', value: 0, at: [0, 0, 0, 3], label: '' },
          { type: 'W', at: [0, 3, 5.6, 3] },
          { type: 'C', id: 'Cm', value: 1e-11, at: [2.7, 3, 2.7, 0] },
          { type: 'R', id: 'Rm', value: 1e9, at: [5.6, 3, 5.6, 1.5] },
          { type: 'V', id: 'EL', value: -0.07, at: [5.6, 1.5, 5.6, 0] },
          { type: 'W', at: [5.6, 0, 0, 0] }, { type: 'GND', at: [1.35, 0] },
          { type: 'label', at: [2.7, 3], text: '$V_m$', dx: 8, dy: -8 },
        ]);
        let key = '', run = null;
        const compute = () => {
          const cm = +mem.value, d = dS.value * 1e-4, A = Math.PI * d * d, Cf = cm * 1e-6 * A, R = (rmS.value * 1e3) / A, I = IS.value * 1e-12, tau = R * Cf;
          C.set('Cm', Cf); C.set('Rm', R);
          const t0 = tau / 2, t1 = 6.5 * tau, tEnd = 10 * tau;
          C.part('Ie').wave = (t) => (t >= t0 && t < t1 ? I : 0);
          const tr = C.transient(tEnd, tau / 120, { uic: false });
          const node = C.net.termNode.get('Cm').a, ser = tr.series(node), r = v.rng(31);
          const noisy = ser.map(([t, x]) => [t * 1e3, x * 1e3 + 0.25 * r.normal()]);
          // the classic measurement: R_in from the plateau, τ from a log-linear fit of the rise
          const mean = (a, b) => { let s = 0, n = 0; for (const [t, x] of noisy) if (t >= a && t < b) { s += x; n++; } return s / n; };
          const Vr = mean(0, t0 * 1e3 * 0.95), Vs = mean(t1 * 1e3 - 2 * tau * 1e3, t1 * 1e3 - 0.02 * tau * 1e3), dV = Vs - Vr;
          const xs = [], ys = [];
          for (const [t, x] of noisy) { const s = t - t0 * 1e3, gap = Vs - x; if (s > 0.1 * tau * 1e3 && s < 2.5 * tau * 1e3 && gap > 0.12 * dV) { xs.push(s); ys.push(Math.log(gap / dV)); } }
          const fit = v.M.linreg(xs, ys), tauFit = -1 / fit.slope, Rin = (dV * 1e-3) / I, Cfit = (tauFit * 1e-3) / Rin;
          run = { tr, node, noisy, tau: tau * 1e3, t0: t0 * 1e3, t1: t1 * 1e3, tEnd: tEnd * 1e3, Vr, Vs, dV, tauFit, Rin, Cfit, cmFit: (Cfit / A) * 1e6, A, Cf, R, cm, Iamp: I };
        };
        const get = () => { const k = `${mem.value}|${dS.value}|${rmS.value}|${IS.value}`; if (k !== key) { key = k; compute(); } return run; };
        v.animate((t) => {
          const R = get(), time = ((t % 7) / 6) * R.tEnd, tc = Math.min(time, R.tEnd);
          C.draw({ result: R.tr.at(tc * 1e-3), t, imax: R.Iamp, vmax: 0.1 });
          const top = R.Vr + R.dV * 1.25 + 1;
          sp.setView([0, R.tEnd], [R.Vr - 2.5, top]);
          sp.vband(R.t0, R.t1, { color: 'gold', alpha: 0.07 });
          sp.text('current on', (R.t0 + R.t1) / 2, top, { size: 10.5, color: 'muted', align: 'center', baseline: 'top', dy: 3 });
          sp.path(R.noisy, { color: 'gold', width: 1 });
          sp.fn((x) => (x < R.t0 ? R.Vr : x < R.t1 ? R.Vs - R.dV * Math.exp(-(x - R.t0) / R.tauFit) : NaN), { color: 'ink', dash: [6, 4], width: 1.6 });
          const ser = R.tr.series(R.node), j = Math.min(ser.length - 1, Math.round((tc / R.tEnd) * (ser.length - 1)));
          sp.path(ser.slice(0, j + 1).map(([a, b]) => [a * 1e3, b * 1e3]), { color: 'accent', width: 2.2 });
          sp.dot(ser[j][0] * 1e3, ser[j][1] * 1e3, { r: 4.5, color: 'accent' });
          const x63 = R.t0 + R.tauFit, y63 = R.Vr + R.dV * (1 - Math.exp(-1));
          sp.line(R.t0, y63, x63, y63, { color: 'muted', dash: [2, 3], width: 1 }); sp.line(x63, R.Vr - 2.5, x63, y63, { color: 'muted', dash: [2, 3], width: 1 });
          sp.text('τ', x63, R.Vr - 2.4, { size: 12, color: 'ink', align: 'center', baseline: 'bottom', dx: 7, weight: 700 });
          sp.measure(R.t1 - 0.3 * R.tau, R.Vr, R.t1 - 0.3 * R.tau, R.Vs, '');
          sp.text('ΔV', R.t1 - 0.3 * R.tau, (R.Vr + R.Vs) / 2, { size: 11.5, color: 'ink', align: 'right', dx: -6, weight: 700 });
        }, { period: 7, still: 6.3 });
        v.legend([['gold', 'recorded (with noise)'], ['accent', 'simulated circuit'], ['ink', 'fitted exponential', { dash: true }]]);
        v.readout(() => {
          const R = get();
          return `fit: $\\Delta V = ${v.fix(R.dV, 2)}$ mV so $R_{in} = \\Delta V/I_e = ${v.fix(R.Rin / 1e9, 3)}$ GΩ; $\\tau_m = ${v.fix(R.tauFit, 2)}$ ms (true $r_mc_m = ${v.fix(R.tau, 2)}$ ms) · $C = \\tau_m/R_{in} = ${v.fix(R.Cfit * 1e12, 2)}$ pF over $A = \\pi d^2 = ${v.fix(R.A * 1e8, 0)}\\ \\mu\\mathrm{m^2}$ gives $c_m = ${v.fix(R.cmFit, 3)}\\ \\mu\\mathrm{F/cm^2}$ (this membrane: ${R.cm})`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'Passive membrane and the membrane time constant',
      statement: String.raw`With only a leak conductance, the membrane potential obeys the linear equation
$$\tau_m\frac{dV}{dt} = -(V - E_L) + R_m I_e(t),\qquad \tau_m = r_mc_m,$$
whose solution is the input filtered by an exponential kernel: $V(t) = E_L + \frac{R_m}{\tau_m}\int_{-\infty}^t e^{-(t-s)/\tau_m}I_e(s)\,ds$. Responses to separate inputs therefore **add** (superposition). A brief input produces a jump that decays as $e^{-t/\tau_m}$. Inputs that arrive within about one time constant of each other **summate temporally**, and inputs further apart act independently. Typical neurons have $\tau_m \approx 10$–$30$ ms.`,
      idea: String.raw`The equation is first-order and linear, so it has an exponential impulse response (ode-1.5), and the response to any input is the convolution with it. For $n$ identical brief pulses $\Delta t$ apart the peak is $a\,(1 + q + \dots + q^{n-1}) = a\frac{1-q^n}{1-q}$ with $q = e^{-\Delta t/\tau_m}$. That tends to $na$ (perfect integration) when $\Delta t \ll \tau_m$ and to $a$ (no summation) when $\Delta t \gg \tau_m$. A long time constant makes a neuron an integrator, and a short one makes it a coincidence detector. Adding a threshold to this passive membrane gives the integrate-and-fire neuron (neuro-5.1).`,
      caption: String.raw`A train of 1 ms current pulses, each of which alone would depolarize the cell by $a$. Faint dashed curves are the individual responses and the bold curve is their sum, computed exactly by superposition. Shorten the interval below $\tau_m$ and the responses pile up until they cross a firing threshold at $-55$ mV. Lengthen it and each decays before the next arrives. Right: peak depolarization in units of $a$ against $\Delta t/\tau_m$ on a log axis, with the geometric-series formula, the limits $n$ and $1$, and the current setting.`,
      scope: String.raw`A passive, isopotential membrane: no voltage-gated conductances (which make summation nonlinear) and current inputs (conductance inputs add shunting, neuro-1.4).`,
      deps: ['neuro-1.1', 'ode-1.5'],
      see: ['neuro-5.1', 'neuro-4.9', 'circ-5.10'],
      refs: ['Gerstner §1.3'],
      tags: ['membrane', 'integration'],
      viz(v) {
        const tauS = v.slider('membrane time constant $\\tau_m$', 2, 50, 15, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} ms` });
        const dtS = v.slider('interval $\\Delta t$', 1, 60, 3, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} ms` });
        const nS = v.slider('pulses $n$', 1, 6, 4, { int: true });
        const aS = v.slider('single response $a$', 1, 10, 5, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} mV` });
        const EL = -70, TH = -55;
        const sv = v.stage({ x: [0, 100], y: [-72, -40], height: 300, axes: 'box', xlabel: 't (ms)', ylabel: 'V (mV)', weight: 1.3 });
        const sr = v.stage({ x: [0.02, 5], y: [0, 6.5], xlog: true, height: 300, axes: 'box', xlabel: 'Δt / τm', ylabel: 'peak / a', weight: 1 });
        const get = () => { const tau = tauS.value, dt = dtS.value, n = nS.value, a = aS.value, tEnd = Math.max(60, 2 + (n - 1) * dt + 5 * tau); return { tau, dt, n, a, tEnd, ...pulseTrain(tau, dt, n, a, tEnd) }; };
        let R = null;
        v.render(() => {
          R = get();
          const peak = Math.max(...R.u), top = Math.max(-40, EL + peak + 3);
          sv.setView([0, R.tEnd], [EL - 2, top]);
          sv.hline(TH, { color: 'red', dash: [5, 4], width: 1.3 }); sv.text('threshold −55 mV', R.tEnd * 0.99, TH, { size: 10.5, color: 'red', align: 'right', baseline: 'bottom', dy: -2 });
          sv.hline(EL, { color: 'faint', width: 1 });
          for (let k = 0; k < R.n; k++) { sv.vband(2 + k * R.dt, 3 + k * R.dt, { color: 'gold', alpha: 0.25 }); trace(sv, R.ts, R.parts[k].map((x) => EL + x), { color: 'muted', dash: [3, 3], width: 1.2 }); }
          trace(sv, R.ts, R.u.map((x) => EL + x), { color: 'accent', width: 2.6 });
          const ip = R.u.indexOf(peak); sv.dot(R.ts[ip], EL + peak, { r: 4.5, color: EL + peak >= TH ? 'red' : 'accent' });
          if (EL + peak >= TH) sv.text('threshold crossed: an integrate-and-fire cell would spike', R.ts[ip], EL + peak, { size: 11, color: 'red', align: R.ts[ip] > R.tEnd * 0.5 ? 'right' : 'left', baseline: 'bottom', dx: R.ts[ip] > R.tEnd * 0.5 ? -6 : 6, dy: -4, weight: 600 });
          sv.measure(R.tEnd * 0.8, EL, R.tEnd * 0.8, EL + R.a, ''); sv.text('a', R.tEnd * 0.8, EL + R.a / 2, { size: 12, color: 'ink', align: 'right', dx: -5, weight: 700 });
          // summation curve
          sr.setView([0.02, 5], [0, R.n + 0.6]);
          sr.hline(R.n, { color: 'green', dash: [4, 4], width: 1.2 }); sr.text(`n = ${R.n}: perfect integration`, 0.025, R.n, { size: 10.5, color: 'green', align: 'left', baseline: 'bottom', dy: -2 });
          sr.hline(1, { color: 'muted', dash: [4, 4], width: 1.2 }); sr.text('no summation', 4.8, 1, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          sr.fn((x) => { const q = Math.exp(-x); return Math.abs(1 - q) < 1e-12 ? R.n : (1 - q ** R.n) / (1 - q); }, { color: 'accent', width: 2.2 });
          sr.vline(1, { color: 'faint', dash: [2, 3] });
          sr.dot(R.dt / R.tau, peak / R.a, { r: 5.5, color: EL + peak >= TH ? 'red' : 'accent' });
        });
        v.legend([['accent', 'summed response'], ['muted', 'single responses', { dash: true }], ['gold', 'current pulses', { area: true }], ['red', 'firing threshold', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const peak = Math.max(...R.u), q = Math.exp(-R.dt / R.tau);
          return `$\\Delta t/\\tau_m = ${v.fix(R.dt / R.tau, 3)}$ · simulated peak ${v.fix(peak, 2)} mV $= ${v.fix(peak / R.a, 3)}\\,a$; geometric series $\\frac{1-q^n}{1-q} = ${v.fix((1 - q ** R.n) / (1 - q), 3)}$ with $q = e^{-\\Delta t/\\tau_m} = ${v.fix(q, 3)}$ · each response falls to $1/e$ in $\\tau_m = ${v.fix(R.tau, 1)}$ ms · peak $${v.fix(EL + peak, 1)}$ mV ${EL + peak >= TH ? '≥' : '<'} threshold`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Reversal potential and driving force',
      statement: String.raw`The current through open channels of one type is zero at a particular membrane potential, the **reversal potential** $E_{\text{rev}}$, and changes sign there: outward (positive by convention) above it and inward below. For a channel selective for one ion, $E_{\text{rev}}$ is that ion's Nernst potential (physio-1.8). Near $E_{\text{rev}}$ the current is approximately
$$I = g\,(V - E_{\text{rev}}),$$
the conductance times the **driving force** $V - E_{\text{rev}}$. A channel permeable to several ions reverses at a GHK-weighted potential between their Nernst potentials. For the nicotinic acetylcholine receptor, which passes Na⁺ and K⁺ about equally, that is near 0 mV. Measuring where the current reverses, and how $E_{\text{rev}}$ shifts as concentrations change, identifies which ions a channel passes.`,
      idea: String.raw`At $E_{\text{rev}}$ the electrical force on the permeant ions exactly balances their concentration gradient, so the net flux vanishes. Away from it the net flux grows with the imbalance. The linear (ohmic) law $I = g(V-E)$ is the first-order expansion. The GHK current equation (physio-1.9) gives the exact constant-field curve, which bends because the ions on the two sides are present in very different numbers. Calcium, with about $10^{-4}$ mM inside and 2 mM outside, passes almost purely inward current. A tenfold change in external concentration moves $E$ by $61.5/z$ mV at body temperature, the test that Hodgkin and Katz used to show that the action potential is carried by Na⁺.`,
      caption: String.raw`Drag the holding voltage along the axis of the current–voltage plot, or pick another channel. Left: the channel in the membrane. The ions flow outward or inward through the pore, at a rate proportional to the current, and stop at the reversal potential. Right: the GHK current of one open channel (bold) and an ohmic channel $g(V-E)$ carrying the same current at $-65$ mV (dashed). Both cross zero at the same voltage, except for the mixed cation channel, where the ohmic average of $E_{Na}$ and $E_K$ misses the true reversal potential. The calcium channel shows how far from ohmic a channel can be: with almost no Ca²⁺ inside it passes inward current only. Change the external concentration: the reversal potential follows Nernst.`,
      scope: String.raw`Single open channels with fixed concentrations; in a whole cell, currents of other channels shift the voltage at which the *total* current reverses (neuro-1.4).`,
      deps: ['physio-1.8', 'circ-1.4'],
      see: ['physio-1.9', 'pchem-8.6', 'neuro-1.4'],
      refs: ['Gerstner §2.1'],
      tags: ['ion channels', 'driving force'],
      viz(v) {
        const CH = { K: { name: 'K⁺ channel', ions: ['K'], g: 20 }, Na: { name: 'Na⁺ channel', ions: ['Na'], g: 15 }, Cl: { name: 'Cl⁻ channel', ions: ['Cl'], g: 10 }, Ca: { name: 'Ca²⁺ channel', ions: ['Ca'], g: 5 }, cat: { name: 'cation channel (AChR)', ions: ['Na', 'K'], g: 30 } };
        const ch = v.select('channel', [{ value: 'K', label: 'K⁺' }, { value: 'Na', label: 'Na⁺' }, { value: 'Cl', label: 'Cl⁻' }, { value: 'Ca', label: 'Ca²⁺' }, { value: 'cat', label: 'Na⁺/K⁺ (AChR)' }], 'K');
        const ext = v.slider('external concentration ×', 0.1, 10, 1, { log: true, sig: 2, fmt: (x) => `× ${v.fix(x, 2)}` });
        const sm = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, axes: false, height: 300, weight: 0.8 });
        const si = v.stage({ x: [-120, 140], y: [-4, 4], height: 300, axes: true, xlabel: 'V (mV)', ylabel: 'I (pA)', weight: 1.25 });
        const hv = si.handle(-30, 0, { color: 'gold', label: 'V', constrain: (x) => [clamp(x, -118, 138), 0] });
        const conc = (ion) => ({ i: NEURON[ion].i, o: NEURON[ion].o * ext.value });
        const model = () => {
          const c = CH[ch.value], ghk = (V) => c.ions.reduce((s, ion) => { const q = conc(ion); return s + ghkI(ION_Z[ion], q.i, q.o, V); }, 0);
          const Erev = c.ions.length === 1 ? nernst(ION_Z[c.ions[0]], conc(c.ions[0]).o, conc(c.ions[0]).i) : bisect(ghk, -100, 100);
          const E1 = c.ions.map((ion) => nernst(ION_Z[ion], conc(ion).o, conc(ion).i));
          const Eohm = E1.reduce((a, b) => a + b, 0) / E1.length, gS = c.g / 1000, lin = (V) => gS * (V - Eohm);
          // scale the GHK curve so that it carries the same current as the linear channel at the resting potential −65 mV
          // (if that current is tiny, match the slopes at the reversal potential instead)
          const slope = (ghk(Erev + 0.01) - ghk(Erev - 0.01)) / 0.02;
          const k = Math.abs(lin(-65)) > gS * 3 && Math.abs(ghk(-65)) > 1e-12 ? lin(-65) / ghk(-65) : gS / slope;
          return { c, I: (V) => k * ghk(V), lin, Erev, Eohm, E1 };
        };
        const pool = (() => { const r = v.rng(2), a = []; for (let i = 0; i < 220; i++) a.push([r(), r()]); return a; })();
        let M = null;
        v.animate((t) => {
          M = model();
          const V = hv.x, I = M.I(V);
          // I–V plot
          let ymax = 0.5; for (let x = -120; x <= 140; x += 10) ymax = Math.max(ymax, Math.abs(M.I(x)), Math.abs(M.lin(x)));
          si.setView([-120, 140], [-ymax * 1.08, ymax * 1.08]);
          si.fn(M.lin, { color: 'ink', dash: [6, 4], width: 1.4 });
          si.fn(M.I, { color: ION_COL[M.c.ions.length > 1 ? 'cat' : M.c.ions[0]], width: 2.6 });
          si.dot(M.Erev, 0, { r: 5, color: 'green' });
          si.text(`reversal ${v.fix(M.Erev, 1)} mV`, M.Erev, ymax * 0.12, { size: 11, color: 'green', align: M.Erev > 60 ? 'right' : 'left', baseline: 'bottom', dx: M.Erev > 60 ? -4 : 4, weight: 700 });
          if (M.c.ions.length > 1) { si.dot(M.Eohm, 0, { r: 4, color: 'ink', hollow: true }); si.text('ohmic average', M.Eohm, -ymax * 0.1, { size: 10, color: 'muted', align: 'right', baseline: 'top', dx: -3 }); }
          si.line(V, 0, V, I, { color: 'gold', width: 2 });
          si.dot(V, I, { r: 5, color: 'gold' });
          // channel picture: membrane across, outside on top
          const col = ION_COL[M.c.ions.length > 1 ? 'cat' : M.c.ions[0]];
          sm.rect(-3, 0.45, 3, 2.4, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          sm.rect(-3, -2.4, 3, -0.45, { fill: 'gold', fillAlpha: 0.05, stroke: false });
          bilayer(sm, -3, 3, -0.45, 0.45, { spacing: 9, gaps: [[-0.5, 0.5]] });
          sm.poly([[-0.5, -0.6], [-0.18, -0.6], [-0.18, 0.6], [-0.5, 0.6]], { fill: 'teal', fillAlpha: 0.6, color: 'teal', width: 1.2 });
          sm.poly([[0.5, -0.6], [0.18, -0.6], [0.18, 0.6], [0.5, 0.6]], { fill: 'teal', fillAlpha: 0.6, color: 'teal', width: 1.2 });
          // concentration clouds: dots ∝ log-ish concentration of the main ion on each side
          const main = M.c.ions[0], q = conc(main), dens = (c) => Math.round(clamp(9 * Math.log10(1 + c * 3), 0, 110));
          sm.dots(pool.slice(0, dens(q.o)).map(([a, b]) => [-2.3 + 4.6 * a, 0.7 + 1.45 * b]), { r: 2.2, color: col, alpha: 0.7 });
          sm.dots(pool.slice(110, 110 + dens(q.i)).map(([a, b]) => [-2.3 + 4.6 * a, -0.7 - 1.45 * b]), { r: 2.2, color: col, alpha: 0.7 });
          // ions streaming through the pore: direction by the sign of the ion flux (current / z)
          const zMain = M.c.ions.length > 1 ? 1 : ION_Z[main], flux = I / zMain, sp = clamp(Math.abs(flux) / Math.max(0.3, ymax), 0, 1);
          if (sp > 0.01) {
            const dir = flux > 0 ? 1 : -1, n = 5;
            for (let k = 0; k < n; k++) { const u = (((t * (0.4 + 1.6 * sp)) + k / n) % 1), y = dir * (-1.1 + 2.2 * u); sm.circle(0, y, 0.08, { fill: col, fillAlpha: 0.95, color: col }); }
            sm.arrow(0.75, -0.5 * dir, 0.75, 0.5 * dir, { color: col, width: 2.5, head: 8 });
          } else sm.text('no net flux', 0.75, 0, { size: 11, color: 'green', align: 'left', baseline: 'middle', weight: 700 });
          sm.text('outside', -2.3, 2.15, { size: 10.5, color: 'muted', align: 'left', baseline: 'top' });
          sm.text('inside', -2.3, -2.15, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          sm.text(`${I >= 0 ? 'outward' : 'inward'} current ${v.fix(Math.abs(I), 2)} pA`, 2.3, -2.15, { size: 11, color: Math.abs(I) < 0.02 ? 'green' : 'ink', align: 'right', baseline: 'bottom', weight: 600 });
          sm.text(`V − E = ${v.fix(V - M.Erev, 0)} mV`, 2.3, 2.15, { size: 11, color: 'ink', align: 'right', baseline: 'top', weight: 600 });
        }, { period: 1e9, still: 3 });
        v.legend([['purple', 'GHK current of one open channel'], ['ink', 'linear $g(V - E)$', { dash: true }], ['green', 'reversal potential', { dot: true }], ['gold', 'holding voltage (drag)', { dot: true }]]);
        v.readout(() => {
          if (!M) return '';
          const V = hv.x, I = M.I(V), z = M.c.ions.length === 1 ? ION_Z[M.c.ions[0]] : 1;
          const tenfold = M.c.ions.length === 1 ? ` · a tenfold rise in external concentration moves it by ${v.fix((VT(37) * Math.log(10)) / z, 1)} mV` : ` · Nernst: $E_{Na} = ${v.fix(M.E1[0], 1)}$, $E_K = ${v.fix(M.E1[1], 1)}$ mV; GHK reversal ${v.fix(M.Erev, 1)} mV vs their average ${v.fix(M.Eohm, 1)} mV`;
          return `${M.c.name}: $E_{\\text{rev}} = ${v.fix(M.Erev, 1)}$ mV · at $V = ${v.fix(V, 1)}$ mV the driving force is ${v.fix(V - M.Erev, 1)} mV and the current ${v.fix(I, 3)} pA (linear estimate ${v.fix(M.lin(V), 3)} pA)${tenfold}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Model',
      name: 'Conductance-based membrane equation',
      statement: String.raw`A membrane with several conductances $g_i$, each in series with its ion's reversal potential $E_i$, obeys
$$c_m\frac{dV}{dt} = -\sum_i g_i\,(V - E_i) + \frac{I_e}{A}.$$
With the conductances held fixed this is linear. $V$ relaxes exponentially, with the **effective time constant** $\tau = c_m/\sum_i g_i$, to the steady state
$$V_\infty = \frac{\sum_i g_iE_i + I_e/A}{\sum_i g_i},$$
the conductance-weighted average of the reversal potentials. Raising a conductance pulls $V$ toward that ion's $E_i$ and, at the same time, lowers the input resistance $1/\sum g_i$ and speeds up the membrane. An inhibitory conductance whose $E_i$ equals the resting potential changes $V$ not at all, but it divides the effect of other inputs: **shunting inhibition**.`,
      idea: String.raw`Each channel population is a battery $E_i$ (its Nernst or reversal potential, neuro-1.3) behind a resistor $1/g_i$. All of them and the capacitor sit in parallel, and Kirchhoff's current law at the membrane node gives the equation (neuro-1.1, neuro-1.2). At steady state the currents cancel, $\sum g_i(V_\infty - E_i) = 0$. This is the same balance as the GHK equation (physio-1.9), linearized: conductances replace permeabilities. In mechanical terms $V_\infty$ is the centre of mass of weights $g_i$ placed at positions $E_i$. Voltage-gated channels make the $g_i$ functions of $V$ and $t$, which is all that the Hodgkin–Huxley model adds (neuro-2.3).`,
      caption: String.raw`Left: the equivalent circuit, solved by the circuit kit, with four conductance branches in parallel with $c_m$. Wire colour is voltage. Even at rest the dots circulate: K⁺ current flows out while Na⁺ current flows in, the steady leak that the pump of physio-1.7 must balance. Right: the balance picture. Each conductance is a weight at its reversal potential, and the fulcrum sits at the centre of mass $V_\infty$. Below: after each change, the kit's transient relaxes from the old $V_\infty$ to the new one with $\tau = c_m/\sum g$. Turn up $g_{syn}$ (reversal 0 mV, excitatory). Turn up $g_{Cl}$ and the voltage barely moves, but $\tau$ and the input resistance shrink.`,
      scope: String.raw`Point neuron with fixed (or slowly varying) conductances; ohmic currents (the GHK curvature of neuro-1.3 is neglected).`,
      deps: ['neuro-1.2', 'neuro-1.3', 'circ-3.12'],
      see: ['physio-1.9', 'physio-1.11', 'neuro-2.3', 'neuro-5.1'],
      refs: ['Dayan–Abbott ch. 5'],
      tags: ['membrane', 'conductance'],
      viz(v) {
        const E = { K: nernst(1, NEURON.K.o, NEURON.K.i), Na: nernst(1, NEURON.Na.o, NEURON.Na.i), Cl: nernst(-1, NEURON.Cl.o, NEURON.Cl.i), syn: 0 };
        const gs = {
          K: v.slider('$g_K$', 0.01, 2, 0.2, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 3)} mS/cm²` }),
          Na: v.slider('$g_{Na}$', 0.001, 2, 0.04, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 3)} mS/cm²` }),
          Cl: v.slider('$g_{Cl}$', 0.001, 2, 0.1, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 3)} mS/cm²` }),
          syn: v.slider('$g_{syn}$ (excitatory, 0 mV)', 0, 1, 0.3, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} mS/cm²` }),
        };
        const sc = v.stage({ x: [-0.8, 9.6], y: [-0.9, 3.8], equal: true, axes: false, height: 250, weight: 1.15 });
        const sb = v.stage({ x: [-110, 90], y: [-1.6, 1.8], height: 250, axes: false, weight: 1 });
        const st = v.stage({ x: [0, 30], y: [-90, -40], height: 170, axes: 'box', xlabel: 't after the last change (ms)', ylabel: 'V (mV)', full: true });
        // kit units: 1 "V" = 1 mV, 1 "Ω" = 1 kΩ·cm², 1 "F" = 1 µF/cm², so 1 "s" = 1 ms
        const X = { K: 2.4, Na: 4.4, Cl: 6.4, syn: 8.4 };
        const parts = [{ type: 'C', id: 'Cm', value: 1, at: [0.5, 3, 0.5, 0], ic: -70 }, { type: 'W', at: [0.5, 3, 8.4, 3] }, { type: 'W', at: [0.5, 0, 8.4, 0] }, { type: 'GND', at: [1.45, 0] }];
        for (const k of ['K', 'Na', 'Cl', 'syn']) parts.push({ type: 'R', id: 'R' + k, value: 1, at: [X[k], 3, X[k], 1.6] }, { type: 'V', id: 'E' + k, value: E[k], at: [X[k], 1.6, X[k], 0] });
        const C = v.circuit(sc, { parts, labels: false });
        const G = () => ({ K: gs.K.value, Na: gs.Na.value, Cl: gs.Cl.value, syn: gs.syn.value });
        const vinf = (g) => { let n = 0, d = 0; for (const k in g) { n += g[k] * E[k]; d += g[k]; } return n / d; };
        let key = '', state = { Vold: null, t0: 0, tr: null, tau: 1, Vnew: -70 };
        const update = (tNow) => {
          const g = G(), k = Object.values(g).join('|');
          if (k === key) return;
          const old = key ? vinf(Object.fromEntries(key.split('|').map((x, i) => [['K', 'Na', 'Cl', 'syn'][i], +x]))) : vinf({ ...g, syn: 0 });
          key = k;
          for (const kk in g) C.set('R' + kk, g[kk] > 0 ? 1 / g[kk] : 1e9);
          const sum = Object.values(g).reduce((a, b) => a + b, 0), tau = 1 / sum;
          C.part('Cm').ic = old;
          state = { Vold: old, t0: tNow, tau, Vnew: vinf(g), tr: C.transient(Math.max(5, 7 * tau), tau / 60) };
        };
        v.animate((t) => {
          update(t);
          const g = G(), dc = C.dc(), node = C.net.termNode.get('Cm').a, tt = Math.min(((t - state.t0) / 4) * Math.max(5, 7 * state.tau), state.tr.t[state.tr.t.length - 1]);
          const snap = state.tr.at(Math.max(0, tt));
          C.draw({ result: snap, t, vmax: 90, imax: 25 });
          for (const k of ['K', 'Na', 'Cl', 'syn']) {
            const lab = { K: 'g_K', Na: 'g_{Na}', Cl: 'g_{Cl}', syn: 'g_{syn}' }[k], el = { K: 'E_K', Na: 'E_{Na}', Cl: 'E_{Cl}', syn: 'E_{syn}' }[k];
            sc.tex(lab, X[k] + 0.25, 2.3, { size: 13, color: k === 'syn' ? 'pink' : ION_COL[k], align: 'left' });
            sc.tex(`${el}`, X[k] + 0.55, 1.0, { size: 12, color: 'muted', align: 'left' });
            sc.text(`${v.fix(E[k], 0)} mV`, X[k] + 0.55, 0.55, { size: 10, color: 'muted', align: 'left' });
          }
          sc.tex('c_m', 0.85, 1.5, { size: 13, color: 'ink', align: 'left' });
          sc.tex('V_m', 1.45, 3.45, { size: 14, color: 'ink', align: 'center' });
          sc.text(`${v.fix(snap.V(node), 1)} mV`, 2.0, 3.45, { size: 11, color: 'ink', align: 'left', baseline: 'middle', weight: 600 });
          // balance beam: weights g_i at E_i, fulcrum at the centre of mass
          const V8 = dc.V(node), maxg = Math.max(...Object.values(g), 0.05);
          sb.line(-100, 0.2, 80, 0.2, { color: 'ink', width: 3 });
          for (let x = -100; x <= 80; x += 20) { sb.line(x, 0.12, x, 0.28, { color: 'ink', width: 1 }); sb.text(`${x}`, x, -0.05, { size: 9.5, color: 'muted', align: 'center', baseline: 'top' }); }
          sb.text('mV', 88, 0.35, { size: 9.5, color: 'muted', align: 'right', baseline: 'bottom' });
          sb.poly([[V8, 0.12], [V8 - 4, -0.5], [V8 + 4, -0.5]], { fill: 'accent', fillAlpha: 0.8, color: 'accent' });
          sb.text(`V∞ = ${v.fix(V8, 1)} mV`, V8, -0.6, { size: 11.5, color: 'accent', align: V8 < -60 ? 'left' : 'center', baseline: 'top', dx: V8 < -60 ? 6 : 0, weight: 700 });
          for (const k of Object.keys(g)) {
            if (g[k] <= 0) continue;
            const rpx = 5 + 17 * Math.sqrt(g[k] / maxg), col = k === 'syn' ? 'pink' : ION_COL[k], below = k === 'Cl', y = below ? -0.75 : 0.95;
            sb.line(E[k], 0.2, E[k], y, { color: col, width: 1.5 });
            sb.dot(E[k], y, { r: rpx, color: col });
            sb.tex({ K: 'g_K', Na: 'g_{Na}', Cl: 'g_{Cl}', syn: 'g_{syn}' }[k], E[k], below ? -1.25 : 1.45, { size: 12, color: col, align: 'center', baseline: 'middle' });
          }
          // the transient
          const ser = state.tr.series(node);
          st.setView([0, Math.max(5, 7 * state.tau)], [Math.min(state.Vold, state.Vnew) - 4, Math.max(state.Vold, state.Vnew) + 4]);
          st.hline(state.Vnew, { color: 'green', dash: [5, 4], width: 1.2 });
          st.path(ser.map(([a, b]) => [a, b]), { color: 'accent', width: 1.2, alpha: 0.3 });
          st.path(ser.filter(([a]) => a <= tt).map(([a, b]) => [a, b]), { color: 'accent', width: 2.4 });
          st.vline(Math.min(state.tau, 1e3), { color: 'muted', dash: [2, 3] });
          st.text('τ', state.tau, Math.min(state.Vold, state.Vnew) - 3.5, { size: 12, color: 'ink', align: 'left', dx: 4, baseline: 'bottom', weight: 700 });
        }, { period: 1e9, still: 6 });
        v.legend([[ION_COL.K, 'K⁺'], [ION_COL.Na, 'Na⁺'], [ION_COL.Cl, 'Cl⁻'], ['pink', 'synaptic (0 mV)'], ['accent', '$V_m$ relaxing'], ['green', 'new $V_\\infty$', { dash: true }]]);
        v.readout(() => {
          const g = G(), dc = C.dc(), node = C.net.termNode.get('Cm').a, sum = Object.values(g).reduce((a, b) => a + b, 0);
          const ser = state.tr ? state.tr.series(node) : [], tgt = state.Vold + (state.Vnew - state.Vold) * (1 - Math.exp(-1));
          let t63 = NaN; for (let i = 1; i < ser.length; i++) { const a = ser[i - 1][1] - tgt, b = ser[i][1] - tgt; if (a === 0 || a * b < 0) { t63 = ser[i - 1][0] + (ser[i][0] - ser[i - 1][0]) * (a / (a - b)); break; } }
          return `kit DC solution $V_\\infty = ${v.fix(dc.V(node), 2)}$ mV; formula $\\sum g_iE_i/\\sum g_i = ${v.fix(vinf(g), 2)}$ mV · $\\sum g = ${v.fix(sum, 3)}$ mS/cm², input resistance $1/\\sum g = ${v.fix(1 / sum, 2)}$ kΩ·cm², $\\tau = c_m/\\sum g = ${v.fix(1 / sum, 2)}$ ms (transient reaches 63 % at ${isFinite(t63) && Math.abs(state.Vnew - state.Vold) > 0.05 ? v.fix(t63, 2) : '—'} ms) · K⁺ current ${v.fix(g.K * (dc.V(node) - E.K), 2)}, Na⁺ ${v.fix(g.Na * (dc.V(node) - E.Na), 2)} µA/cm²`;
        });
      },
    },
  ],
};
