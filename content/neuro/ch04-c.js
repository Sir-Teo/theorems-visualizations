// Computational Neuroscience — Chapter 4 (part c): 4.8 myelination and saltatory conduction, 4.9 dendritic filtering, 4.10 active dendrites
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked: Huxley & Stämpfli 1949, J. Physiol. 108: 315–339 (10.1113/jphysiol.1949.sp004335); Tasaki 1939, Am. J. Physiol. 127: 211–227
//   (10.1152/ajplegacy.1939.127.2.211); Rushton 1951, J. Physiol. 115: 101–122 (10.1113/jphysiol.1951.sp004655); Hursh 1939, Am. J. Physiol. 127: 131–139
//   (10.1152/ajplegacy.1939.127.1.131); Rall 1967, J. Neurophysiol. 30: 1138–1168 (10.1152/jn.1967.30.5.1138); Schiller, Major, Koester & Schiller 2000,
//   Nature 404: 285–289 (10.1038/35005094); Polsky, Mel & Schiller 2004, Nat. Neurosci. 7: 621–627 (10.1038/nn1253); Stuart & Sakmann 1994, Nature 367: 69–72
//   (10.1038/367069a0); Larkum, Zhu & Sakmann 1999, Nature 398: 338–341 (10.1038/18686).
// - The rule of thumb "about 6 m/s per µm of fibre diameter" for mammalian myelinated fibres is Hursh's (1939) empirical result as commonly quoted; it was not re-read
//   in the paper and is used only as a comparison (flagged verify). The model's own value (about 4 m/s per µm at 18.5 °C) is computed here.
// - Model assumptions made on these pages, not data: node length 1 µm, internode length 100 × fibre diameter (adjustable), g-ratio 0.65, one membrane bilayer
//   per 8.5 nm of sheath thickness (so a 10 µm fibre has about 200 membranes in series), nodal channel densities 30 × the squid values (a node is tiny and in
//   vertebrates carries a very high density of Na⁺ channels), squid-axon Hodgkin–Huxley kinetics.
// - 4.10: the neuron is a model on this page (passive soma, ten thin branches, squid-HH Na⁺/K⁺ kinetics at 30 °C for the dendritic channels, an AMPA-like
//   alpha conductance and an NMDA-like two-exponential conductance with the Jahr–Stevens magnesium block); its parameters were tuned to show the effect and do not
//   fit any recording. The soma does not spike, so somatic depolarisations of tens of mV are only a measure of the dendritic drive.
import { HH, buildTree, buildMyelinated, myelinatedSpeed, unmyelinatedSpeed, treeSim, lambdaUm } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const RM = 20000;

/** Peak, latency of the peak after onset, 10–90 % rise time and half-width of a somatic EPSP given samples (t, V−rest). */
function epsp(t, y, t0) {
  let k = 0; for (let i = 1; i < y.length; i++) if (y[i] > y[k]) k = i;
  const amp = y[k];
  const cross = (lev, from, to, up) => { for (let i = from; i !== to; i += up ? 1 : -1) { const a = y[i], b = y[i + (up ? 1 : -1)]; if ((a - lev) * (b - lev) <= 0 && a !== b) return t[i] + ((lev - a) / (b - a)) * (t[i + (up ? 1 : -1)] - t[i]); } return NaN; };
  const t10 = cross(0.1 * amp, 0, k, true), t90 = cross(0.9 * amp, 0, k, true);
  const th1 = cross(0.5 * amp, 0, k, true), th2 = cross(0.5 * amp, k, y.length - 1, true);
  return { amp, delay: t[k] - t0, rise: t90 - t10, width: th2 - th1 };
}

export default {
  collection: 'neuro',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Myelination and saltatory conduction',
      statement: String.raw`In myelinated axons the axon is wrapped in a sheath of many membrane layers, interrupted every $L\approx100$ fibre diameters by short bare **nodes of Ranvier** that carry almost all the voltage-gated Na$^+$ channels. The sheath cuts the capacitance and the leak of the internodal membrane by roughly the number of layers, so current entering at one active node charges the next node with little loss, and the impulse **jumps** from node to node (saltatory conduction). Because the electrical length of an internode, $L/\lambda$, is set by geometry, the whole structure scales with the fibre diameter and the conduction velocity grows in proportion to the diameter, $\theta\propto D$ (about 4 m/s per µm in the model below at 18.5 °C; roughly 6 m/s per µm is the empirical figure quoted for mammalian fibres at body temperature), whereas an unmyelinated axon only gives $\theta\propto\sqrt d$ (item 4.7). Removing the sheath, or making internodes too long, stops conduction.`,
      idea: String.raw`An unmyelinated axon must charge its entire membrane capacitance, along its whole length, at every point of the impulse; myelin removes that capacitance (and the leak) except at the nodes, so the time for a node to charge its neighbour is set by the small nodal capacitance plus the little internodal capacitance and by the axial resistance, which falls as $1/D^2$ while internodal length grows as $D$. Rushton (1951) showed that this makes the speed proportional to the fibre diameter and found that the best ratio of axon to fibre diameter is around 0.6. Early evidence for jumping impulses came from Tasaki (1939, frog) and from Huxley and Stämpfli (1949), who measured longitudinal currents at nodes of single fibres.`,
      caption: String.raw`Left: an impulse running along a chain of twelve nodes (gold dots) separated by internodes (compartment voltages drawn between them); the animation is slowed to a fixed duration. Change the fibre diameter $D$, the g-ratio (axon diameter / fibre diameter, which fixes how many membranes the sheath has) and the internode ratio $L/D$, or thin or remove the sheath. Right: speed against diameter on log–log axes, myelinated (green, computed for the current settings at seven diameters) against unmyelinated (grey, same total diameter); the myelinated curve has slope 1, the unmyelinated slope $\tfrac12$. The speed is measured between nodes 4 and 10 from the 0 mV crossing times.`,
      scope: String.raw`Model fibre with squid-type Hodgkin–Huxley channels at 18.5 °C, nodal channel density 30× the squid value, internodes of passive membrane whose capacitance and leak are divided by the number of bilayers, an assumed 8.5 nm per bilayer, node length 1 µm. The absolute speeds, the diameter at which myelin begins to win, and the safety factor are properties of this model, not measurements; the ratios (slope 1 against ½, failure when internodes are too long or the sheath thin) are the robust part.`,
      deps: ['neuro-4.7'],
      see: ['neuro-4.7', 'neuro-2.3'],
      refs: ['Gerstner §3.3'],
      tags: ['axon', 'myelin', 'conduction velocity'],
      credit: 'Tasaki, 1939; Huxley & Stämpfli, 1949; W. A. H. Rushton, 1951 (theory of fibre size)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Saltatory_conduction' },
      viz(v) {
        const Dsl = v.slider('fibre diameter $D$', 0.5, 20, 4, { log: true, fmt: (x) => `${v.fmt(x, 3)} µm` });
        const gsl = v.slider('g-ratio', 0.4, 0.85, 0.65, { step: 0.01 });
        const rsl = v.slider('internode $L/D$', 20, 300, 100, { step: 5, int: true });
        const sh = v.select('sheath', [{ value: 'full', label: 'intact' }, { value: 'thin', label: 'thin (÷10)' }, { value: 'none', label: 'absent' }], 'full');
        const sA = v.stage({ x: [0, 1], y: [-85, 60], axes: 'box', gutter: true, xlabel: 'position along the axon (mm)', ylabel: '$V$ (mV)', height: 300, weight: 1.25 });
        const sB = v.stage({ x: [0.45, 25], y: [0.4, 150], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'fibre diameter $D$ (µm)', ylabel: 'speed $\\theta$ (m/s)', height: 300, weight: 1 });
        const DS = [0.5, 1, 2, 4, 8, 16, 24];
        const unm = {}, mye = {}, movies = {};
        const opts = (D) => {
          const base = { g: gsl.value, ratio: rsl.value };
          if (sh.value === 'none') return { ...base, nbOverride: 1 };
          if (sh.value === 'thin') return { ...base, nbOverride: Math.max(1, Math.round(buildMyelinated(D, base).nb / 10)) };
          return base;
        };
        const unmSpeed = (d) => (unm[d] ??= unmyelinatedSpeed(d, { T: 18.5 }).speed);
        const myeKey = () => `${gsl.value}|${rsl.value}|${sh.value}`;
        const myeSweep = () => (mye[myeKey()] ??= DS.map((D) => [D, myelinatedSpeed(D, opts(D)).speed]));
        const movie = (D) => {
          const key = `${D.toFixed(2)}|${myeKey()}`; if (movies[key]) return movies[key];
          const o = opts(D), r0 = myelinatedSpeed(D, o), M = r0.M, len = r0.xs[r0.xs.length - 1];
          const ok = isFinite(r0.speed), tEnd = ok ? Math.min(8, 1.5 * (len * 1e-6) / r0.speed * 1e3) : 1.5;
          const per = Math.max(1, Math.round(tEnd / 0.005 / 110)), r = myelinatedSpeed(D, { ...o, frames: per, tEnd });
          return (movies[key] = { speed: r0.speed, xs: r0.xs, nodeIdx: r0.nodeIdx, frames: r.sim.frames, ft: r.sim.ft, nb: M.nb, L: M.L, len, ok });
        };
        let st = null;
        v.animate((t) => {
          const D = Dsl.value, M = movie(D), S = myeSweep();
          sA.setView([0, M.len / 1000], [-85, 60]);
          const fi = clamp(Math.round((t / 6) * (M.frames.length - 1)), 0, M.frames.length - 1), F = M.frames[fi];
          sA.path(Array.from(F, (V, i) => [M.xs[i] / 1000, V]), { color: 'accent', width: 2 });
          sA.dots(M.nodeIdx.map((i) => [M.xs[i] / 1000, F[i]]), { r: 4, color: 'gold' });
          sA.text(`t = ${v.fix(M.ft[fi], 3)} ms`, 0.02 * (M.len / 1000), 50, { size: 12, color: 'muted', align: 'left' });
          sB.path(S.filter((p) => isFinite(p[1])), { color: 'green', width: 2 });
          sB.dots(S.filter((p) => isFinite(p[1])), { r: 5, color: 'green' });
          const U = DS.map((d) => [d, unmSpeed(d)]);
          sB.path(U, { color: 'muted', width: 2 }); sB.dots(U, { r: 4, color: 'muted' });
          if (M.ok) sB.dot(D, M.speed, { r: 8, color: 'gold' }); else sB.vline(D, { color: 'red', dash: true });
          // fitted slopes
          const sl = (P) => { const q = P.filter((p) => isFinite(p[1])); if (q.length < 3) return NaN; const lx = q.map((p) => Math.log(p[0])), ly = q.map((p) => Math.log(p[1])), n = q.length, mx = lx.reduce((a, b) => a + b) / n, my = ly.reduce((a, b) => a + b) / n; let a = 0, b = 0; for (let i = 0; i < n; i++) { a += (lx[i] - mx) * (ly[i] - my); b += (lx[i] - mx) ** 2; } return a / b; };
          st = { D, speed: M.speed, ok: M.ok, nb: M.nb, L: M.L, slM: sl(S), slU: sl(U), u: unmSpeed(D) };
        }, { period: 6, still: 2.4 });
        v.legend([['accent', 'voltage along the fibre'], ['gold', 'nodes of Ranvier; current $D$', { dot: true }], ['green', 'myelinated'], ['muted', 'unmyelinated of the same diameter']]);
        v.readout(() => {
          if (!st) return '';
          const head = st.ok ? String.raw`$D=${v.fmt(st.D, 3)}$ µm: impulse speed $\theta=${v.fix(st.speed, 2)}$ m/s ($${v.fix(st.speed / st.D, 2)}$ m/s per µm), internodes $L=${v.fmt(st.L, 3)}$ µm, sheath of $${st.nb}$ membrane layer${st.nb === 1 ? '' : 's'}; an unmyelinated axon of diameter $D$ runs at $${v.fix(st.u, 2)}$ m/s (ratio $${v.fix(st.speed / st.u, 1)}$)` : String.raw`$D=${v.fmt(st.D, 3)}$ µm with $${st.nb}$ membrane layer${st.nb === 1 ? '' : 's'} in the sheath and internodes $L=${v.fmt(st.L, 3)}$ µm: **conduction fails** — the impulse dies out before reaching node 10`;
          return head + '\n' + String.raw`log–log slope of speed against diameter over the seven diameters: myelinated ${isFinite(st.slM) ? '$' + v.fix(st.slM, 2) + '$' : 'n/a (no conduction)'} (theory 1), unmyelinated $${v.fix(st.slU, 2)}$ (theory 0.5)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Dendritic filtering of synaptic potentials',
      statement: String.raw`A synaptic current injected into a passive dendrite spreads towards the soma as a voltage transient that is low-pass filtered by the cable: the farther the synapse from the soma, the **smaller** the peak somatic potential, the **later** it peaks and the **slower** its rise and **longer** its duration (width). In the infinite-cable picture the somatic voltage is a convolution of the synaptic current with the Green's function (neuro-4.4), whose amplitude falls as $e^{-X}$ with $X$ the electrical distance, whose peak delay grows from $0$ at $X=0$ to $T^*(X)=\tfrac14(\sqrt{1+4X^2}-1)\tau_m$ (about $X\tau_m/2$ for large $X$), and whose width grows with $X$. The local depolarisation at the synapse, on the other hand, is larger for distal sites because the input resistance there is higher.`,
      idea: String.raw`Each point of the cable is a leaky integrator coupled to its neighbours, so a brief current at distance $X$ reaches the soma only after diffusing there (item 4.4); on the way part of the charge leaks out and the rest arrives spread over time. The low-pass cutoff of the path from distance $X$ falls roughly as $1/(1+X^2)$, so high frequencies are removed more strongly the farther away the input. Rall (1967) used exactly this to argue that the shapes of somatic EPSPs (rise time, half-width) carry information on where on the dendrite the synapse was, and that a distal and a proximal synapse of the same strength have very different somatic effects.`,
      caption: String.raw`A soma (20 µm) with one 1 mm dendrite (diameter slider; sealed end) receives an alpha-function synaptic conductance of peak $g$ (slider; reversal 0 mV) at distance $x$ from the soma. Left: somatic EPSPs for five synapse positions from the soma ($x=0$) to the tip, and for your own position (gold; drag the gold handle in the right panel). Right: amplitude, peak delay, 10–90 % rise time or half-width of the somatic EPSP as a function of position. Make the dendrite thinner (shorter $\lambda$) and every effect grows.`,
      scope: String.raw`Passive dendrite ($R_m=20\,\mathrm{k\Omega\,cm^2}$, $R_a=100\,\Omega$ cm, $C_m=1\,\mu$F/cm²), single synapse, no voltage-gated channels (active dendrites in item 4.10), conductance (not current) synapse so that local saturation reduces distal amplitudes slightly. Amplitudes depend on $g$; the trends in delay, rise time and width do not.`,
      deps: ['neuro-4.4'],
      see: ['neuro-4.10', 'neuro-5.6'],
      refs: ['Dayan–Abbott ch. 6'],
      tags: ['dendrites', 'synaptic integration'],
      credit: 'W. Rall, 1967 (J. Neurophysiol. 30: 1138–1168)',
      viz(v) {
        const dsl = v.slider('dendrite diameter', 0.5, 4, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} µm` });
        const gs = v.slider('peak conductance $g$', 0.05, 2, 0.5, { log: true, fmt: (x) => `${v.fmt(x, 2)} nS` });
        const ts = v.slider('synaptic $\\tau$', 0.3, 5, 1, { log: true, fmt: (x) => `${v.fmt(x, 2)} ms` });
        const metric = v.select('plot', [{ value: 'amp', label: 'amplitude' }, { value: 'delay', label: 'peak delay' }, { value: 'rise', label: '10–90 % rise' }, { value: 'width', label: 'half-width' }], 'amp');
        const L = 1000, X5 = [0, 0.25, 0.5, 0.75, 1];
        const sT = v.stage({ x: [0, 40], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time (ms)', ylabel: 'somatic EPSP (mV)', height: 300, weight: 1.1 });
        const sM = v.stage({ x: [0, L], y: [0, 1], axes: 'box', gutter: true, xlabel: 'synapse distance from the soma (µm)', ylabel: '', height: 300, weight: 1 });
        const hx = sM.handle(600, 0.5, { color: 'gold', r: 7, constrain: 'x', label: 'yours' });
        let tr = null, trKey = '';
        const cache = {};
        const sim = (x) => {
          const d = dsl.value, key = `${d}|${gs.value}|${ts.value}|${x}`;
          if (cache[key]) return cache[key];
          if (trKey !== String(d)) { tr = buildTree([{ parent: -1, len: 20, dia: 20, soma: true }, { parent: 0, len: L, dia: d }], { dxMax: 20, Ra: 100 }); trKey = String(d); }
          const node = x <= 0 ? 0 : tr.first[1] + clamp(Math.floor(x / 20), 0, 49);
          const r = treeSim(tr, { dt: 0.05, tEnd: 40, cm: 1, gL: 1000 / RM, EL: -65, V0: -65, syn: [{ node, gmax: gs.value * 1e-3, t0: 2, tau: ts.value, E: 0 }], rec: [0, node], every: 2 });
          const y = r.V[0].map((q) => q + 65), loc = r.V[1].map((q) => q + 65);
          return (cache[key] = { t: r.t, y, loc, m: epsp(r.t, y, 2) });
        };
        const curve = {};
        const sweep = () => {
          const key = `${dsl.value}|${gs.value}|${ts.value}`; if (curve[key]) return curve[key];
          const out = []; for (let x = 0; x <= L; x += 50) out.push([x, sim(x).m]);
          return (curve[key] = out);
        };
        const cols = ['accent', 'teal', 'green', 'orange', 'red'];
        const names = { amp: 'amplitude (mV)', delay: 'peak delay (ms)', rise: '10–90 % rise time (ms)', width: 'half-width (ms)' };
        let st = null;
        v.render(() => {
          const sw = sweep(), mt = metric.value, lam = lambdaUm(dsl.value, RM, 100);
          const pts = sw.map(([x, m]) => [x, m[mt]]), top = Math.max(...pts.map((p) => p[1]), 1e-6) * 1.15;
          sM.setView([0, L], [0, top]); sM.setLabels(undefined, names[mt]);
          sM.path(pts, { color: 'ink', width: 2.2 });
          const hxx = clamp(hx.x, 0, L), mh = sim(Math.round(hxx / 20) * 20).m;
          hx.set(hxx, mh[mt]);
          let ymax = 0;
          X5.forEach((f, i) => { const r = sim(f * L); ymax = Math.max(ymax, ...r.y); });
          const mine = sim(Math.round(hxx / 20) * 20); ymax = Math.max(ymax, ...mine.y);
          sT.setView([0, 40], [0, ymax * 1.12]);
          X5.forEach((f, i) => { const r = sim(f * L); sT.path(r.t.map((t, k) => [t, r.y[k]]), { color: cols[i], width: 2 }); sM.dot(f * L, sw.find((p) => p[0] === f * L)[1][mt], { r: 5, color: cols[i] }); });
          sT.path(mine.t.map((t, k) => [t, mine.y[k]]), { color: 'gold', width: 2.6 });
          sT.path(mine.t.map((t, k) => [t, mine.loc[k]]), { color: 'gold', width: 1.4, dash: [4, 4] });
          st = { lam, m0: sim(0).m, m1: mh, x: hxx, mt };
        });
        v.legend([['accent', 'at the soma'], ['teal', '250 µm'], ['green', '500 µm'], ['orange', '750 µm'], ['red', '1000 µm (tip)'], ['gold', 'your synapse (dashed: local EPSP)']]);
        v.readout(() => {
          if (!st) return '';
          const f = (m) => String.raw`$${v.fix(m.amp, 2)}$ mV, delay $${v.fix(m.delay, 2)}$ ms, rise $${v.fix(m.rise, 2)}$ ms, half-width $${v.fix(m.width, 1)}$ ms`;
          return String.raw`$\lambda=${v.fmt(st.lam, 3)}$ µm (dendrite length $=${v.fix(1000 / st.lam, 2)}\,\lambda$) · synapse on the soma: ${f(st.m0)}` + '\n' + String.raw`synapse at $x=${v.fmt(st.x, 3)}$ µm: somatic EPSP ${f(st.m1)}`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Active dendrites and dendritic spikes',
      statement: String.raw`Dendrites of many neurons carry voltage-gated channels (Na$^+$, Ca$^{2+}$ and NMDA receptors, whose conductance is relieved of its Mg$^{2+}$ block by depolarisation). When enough excitatory synapses on the same thin branch are active together, the local depolarisation switches these conductances on regeneratively and the branch produces a **dendritic spike** (a sodium spike, a calcium spike or a long NMDA plateau). The somatic response to inputs on one branch is then a sigmoid, **supralinear** function of the number of coactive synapses, whereas the same number of synapses spread over different branches adds more or less linearly until the cell as a whole is depolarised enough to unblock NMDA receptors everywhere, which takes more synapses. Thin branches therefore act as semi-independent nonlinear subunits, and a neuron resembles a two-layer network rather than a single threshold unit.`,
      idea: String.raw`Positive feedback needs a local input resistance high enough for the synaptic current to depolarise the branch past the activation threshold of the voltage-gated conductance; a thin branch has $R_{\rm in}\propto d^{-3/2}$ (neuro-4.3) of several hundred megaohms, so a handful of synapses suffices, while the same synapses on different branches each see only their small share. For NMDA receptors the feedback is that depolarisation unblocks them, which admits more current, which depolarises more; the plateau lasts tens of milliseconds. Schiller et al. (2000) found NMDA spikes in thin basal dendrites of cortical pyramidal cells and Polsky et al. (2004) showed the sigmoidal summation of clustered inputs; Larkum et al. (1999) found calcium spikes in distal apical dendrites and Stuart and Sakmann (1994) showed that Na$^+$ action potentials also propagate back into the dendrites.`,
      caption: String.raw`A model cell: a passive soma and ten thin dendrites (1 µm, 250 µm long). $N$ synapses (AMPA-like with, optionally, NMDA-like receptors) are activated at $t=5$ ms either **clustered** on one branch (blue; the outline of the cell shows where) or **dispersed**, one per branch and then a second round (orange). Top right: somatic peak depolarisation against $N$ with the straight line “N times a single synapse”; below it the voltage traces for your $N$. Turn NMDA receptors off and both curves lose their supralinear steps; the dendritic Na$^+$ density sharpens the thresholds (too much makes any branch spike propagate and recruit the whole cell). The soma is passive (no spikes), so large values only measure dendritic drive.`,
      scope: String.raw`Illustrative model with parameters tuned to show the effect (not fitted to any recording): squid-axon Na$^+$/K$^+$ kinetics at 30 °C on the distal 170 µm of each branch, AMPA conductance 0.3 nS and NMDA conductance 2.2 nS per synapse, $R_m=20\,\mathrm{k\Omega\,cm^2}$. Real clusters, receptor mixes, inhibition and calcium channels change the numbers; the qualitative contrast between clustered and dispersed input is what experiments report.`,
      deps: ['neuro-4.6', 'neuro-2.3'],
      see: ['neuro-4.9', 'neuro-5.7'],
      refs: ['Gerstner §3.2'],
      tags: ['dendrites', 'nonlinear integration', 'NMDA'],
      credit: 'Stuart & Sakmann, 1994; Larkum, Zhu & Sakmann, 1999; Schiller et al., 2000; Polsky, Mel & Schiller, 2004',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dendritic_spike' },
      viz(v) {
        const NS = v.slider('active synapses $N$', 1, 20, 6, { int: true });
        const nm = v.toggle('NMDA receptors', true);
        const na = v.slider('dendritic Na⁺ density', 0, 0.08, 0.02, { step: 0.005, fmt: (x) => `${v.fix(x, 3)}× HH` });
        const NB = 10;
        const segs = [{ parent: -1, len: 20, dia: 20, soma: true }]; for (let j = 0; j < NB; j++) segs.push({ parent: 0, len: 250, dia: 1 });
        const tr = buildTree(segs, { dxMax: 12.5, Ra: 100 });
        const site = (br, pos) => tr.first[1 + br] + Math.min(19, Math.floor(pos / 12.5));
        const nodesFor = (N, mode) => Array.from({ length: N }, (_, k) => (mode === 'clus' ? site(0, 170 + (k - N / 2) * 6) : site(k % NB, k < NB ? 170 : 100)));
        const sS = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 260, weight: 0.8, minWidth: 230, title: 'cell sketch (not to scale)' });
        const sI = v.stage({ x: [0, 20], y: [0, 40], axes: 'box', gutter: true, xlabel: 'number of active synapses $N$', ylabel: 'somatic peak (mV above rest)', height: 260, weight: 1.2 });
        const sT = v.stage({ x: [0, 100], y: [-5, 40], axes: 'box', gutter: true, xlabel: 'time (ms)', ylabel: 'V − rest (mV)', height: 220, full: true });
        const gL = new Float64Array(tr.n).fill(1000 / RM);
        const runs = {};
        const run = (N, mode, withN, fac) => {
          const key = `${N}|${mode}|${withN}|${fac}`; if (runs[key]) return runs[key];
          const gNa = new Float64Array(tr.n), gK = new Float64Array(tr.n);
          if (fac > 0) for (let i = 1; i < tr.n; i++) if (tr.pos[i] >= 80) { gNa[i] = HH.gNa * fac; gK[i] = HH.gK * fac * 0.15; }
          const nodes = nodesFor(N, mode), syn = [];
          for (const n of nodes) { syn.push({ node: n, gmax: 0.0003, t0: 5, tau: 1.5, E: 0 }); if (withN) syn.push({ node: n, gmax: 0.0022, t0: 5, tauR: 2, tauD: 40, nmda: true, E: 0 }); }
          const r = treeSim(tr, { dt: 0.1, tEnd: 100, cm: 1, gL, gNa, gK, T: 30, V0: -65, syn, rec: [0, nodes[0]] });
          const soma = r.V[0].map((x) => x + 65), loc = r.V[1].map((x) => x + 65);
          return (runs[key] = { t: r.t, soma, loc, peak: Math.max(...soma), lpeak: Math.max(...loc) });
        };
        const Ns = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 17, 20];
        let st = null;
        v.render(() => {
          const N = NS.value, wn = nm.value, fac = na.value;
          const A = run(N, 'clus', wn, fac), B = run(N, 'disp', wn, fac);
          const c = Ns.map((n) => [n, run(n, 'clus', wn, fac).peak]), d = Ns.map((n) => [n, run(n, 'disp', wn, fac).peak]);
          const top = Math.max(...c.map((p) => p[1]), ...d.map((p) => p[1])) * 1.1 + 1;
          sI.setView([0, 20.5], [0, top]);
          const one = c[0][1];
          sI.line(0, 0, 20, 20 * one, { color: 'muted', dash: [5, 4], width: 1.4 });
          sI.path(c, { color: 'accent', width: 2.2 }); sI.dots(c, { r: 3.5, color: 'accent' });
          sI.path(d, { color: 'orange', width: 2.2 }); sI.dots(d, { r: 3.5, color: 'orange' });
          sI.vline(N, { color: 'faint', dash: true });
          sT.setView([0, 100], [-3, Math.max(10, Math.max(A.peak, B.peak, A.lpeak) * 1.1)]);
          sT.path(A.t.map((t, k) => [t, A.soma[k]]), { color: 'accent', width: 2.4 });
          sT.path(B.t.map((t, k) => [t, B.soma[k]]), { color: 'orange', width: 2.4 });
          sT.path(A.t.map((t, k) => [t, A.loc[k]]), { color: 'accent', width: 1.4, dash: [4, 4] });
          // sketch
          const ang = (j) => (2 * Math.PI * j) / NB, R0 = 0.16, R1 = 0.9;
          for (let j = 0; j < NB; j++) sS.line(R0 * Math.cos(ang(j)), R0 * Math.sin(ang(j)), R1 * Math.cos(ang(j)), R1 * Math.sin(ang(j)), { color: 'muted', width: j === 0 ? 2.4 : 1.4 });
          sS.circle(0, 0, 0.12, { fill: 'ink', fillAlpha: 0.5, color: 'ink' });
          const pos = (br, p) => { const r = R0 + (R1 - R0) * (p / 250); return [r * Math.cos(ang(br)), r * Math.sin(ang(br))]; };
          nodesFor(N, 'disp').forEach((n) => { const br = tr.seg[n] - 1, p = tr.pos[n], q = pos(br, p), o = br === 0 ? 0.06 : 0; sS.dot(q[0] + o * Math.cos(ang(br) + 1.57), q[1] + o * Math.sin(ang(br) + 1.57), { r: 4.5, color: 'orange' }); });
          nodesFor(N, 'clus').forEach((n) => { const q = pos(0, tr.pos[n]); sS.dot(q[0] + 0.05 * Math.cos(ang(0) - 1.57), q[1] + 0.05 * Math.sin(ang(0) - 1.57), { r: 4.5, color: 'accent' }); });
          st = { N, one, A, B, lin: N * one };
        });
        v.legend([['accent', 'clustered on one branch (dashed: local voltage)'], ['orange', 'dispersed over the branches'], ['muted', '$N\\times$ one synapse', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$N=${st.N}$: somatic peak clustered $${v.fix(st.A.peak, 1)}$ mV (local $${v.fix(st.A.lpeak, 1)}$ mV), dispersed $${v.fix(st.B.peak, 1)}$ mV; $N\times$ single synapse $=${v.fix(st.lin, 1)}$ mV` + '\n' +
            String.raw`ratio to linear sum: clustered $${v.fix(st.A.peak / st.lin, 2)}$, dispersed $${v.fix(st.B.peak / st.lin, 2)}$ (1 means linear; above 1, supralinear)`;
        });
      },
    },
  ],
};
