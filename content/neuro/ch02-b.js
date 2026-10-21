// Computational Neuroscience — Chapter 2: The Hodgkin–Huxley model (part b: 2.6–2.9)
//
// Facts and how they were checked (Oct 2026):
// - Hodgkin & Huxley model: see ch02.js. That the model reproduces anode-break excitation, refractoriness and threshold is stated by
//   secondary sources (encyclopedia entry on the HH model, lecture notes, Wikipedia "Anode break excitation" citing H&H 1952);
//   all numbers shown on these pages are computed here.
// - Hodgkin (1948), J. Physiol. 107: 165–181 (Crossref-checked title and pages): classification of axons by their repetitive
//   response. The definitions of class 1 (firing frequency can be arbitrarily low) and class 2 (onset at a non-zero minimum
//   frequency) were initially secondary; 2.7 is now audited against complete author gain-function treatments, without original1948 priority.
//   The parameter/claim review of2.8 remains separate.
// - Connor & Stevens (1971): three papers, J. Physiol. 213: 1–19 (doi 10.1113/jphysiol.1971.sp009364), 21–30 (sp009365)
//   and 31–53 (sp009366, "Prediction of repetitive firing behaviour from voltage clamp data on an isolated neurone soma"), all
//   Crossref-checked. The parameter set used here (ḡNa = 120, ḡK = 20, ḡA = 47.7, ḡL = 0.3 mS/cm², E_Na = 55, E_K = −72,
//   E_A = −75, E_L = −17 mV, rate factor 3.8, A-current kinetics with the constants 0.0761, 94.22, 31.84, 1.17, 28.93, 0.3632,
//   1.158, 55.96, 20.12, 53.3, 14.54, 1.24, 2.678, 50, 16.027) was read from the XPP implementation distributed with the Pitt
//   computational-neuroscience course (sites.pitt.edu/~phase/bard/bardware/classes/compneuro/model/cs.ode), a teaching file that
//   is explicitly treated as a teaching variant; no equality to original1971/1977 tables is asserted.
//   The2.8 source audit read the complete author XPP file and full1971 original (whose A-gate exponent/kinetics differ).
//   Its numerical variant retunes leak reversal to preserve the baseline rest; no1977 original-table fit is claimed.
// - Channel noise2.9: full Goldwyn & Shea-Brown2011 author treatment, especially pp3–6,
//   Eqs10–13 and Fig3, now supports the retained classical independent-subunit model.
//   Fixed-voltage binomial statistics are distinct from voltage-feedback simulation;
//   our frozen-voltage multinomial/exponential splitting is not their Gillespie implementation.
import { HH, ION_COL, gateInf, clamp, trace, hhSim, hhRun, spikeTimes, pulse, hhRest, CS, csRun, csSpikes, csA } from './ch02.shared.js';

import { csSimulationAudit, csCurveAudit, csTargetRest } from './source-audit-connor-stevens.shared.js';
import { hhFiringSweeps, hhFiringTrace } from './source-audit-hh-firing.shared.js';
import { channelRun, latencySummary } from './source-audit-channel-noise.shared.js';

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
      statement: String.raw`The standard squid Hodgkin–Huxley membrane can support repetitive firing under constant input, with a frequency–current relation having a nonzero onset rate (type II). Resting and spiking responses can coexist over an input interval, so the observed response depends on initialization and input history. A stable firing orbit near a subcritical Hopf is a **global** branch; the small local Hopf cycle is unstable. The finite numerical protocols below compare history-dependent responses, not certified bifurcation thresholds. At high input, loss of detected spikes can reflect shrinking oscillations as well as eventual depolarized quiescence.`,
      idea: String.raw`Fast sodium activation supplies regenerative depolarization, while sodium inactivation and potassium activation restore the membrane and set recovery between spikes. The full conductance model, rather than a single recovery time, determines its frequency. The local Hopf coefficient controls a small periodic branch; it does not alone establish a stable large-amplitude firing cycle, bistable interval or its minimum frequency. Temperature here multiplies all gate rates by $3^{(T-6.3)/10}$ while leaving capacitance and voltage dynamics otherwise unchanged, so it is not a uniform time rescaling and need not multiply every firing rate by one common factor.`,
      caption: String.raw`Drag the gold handle along the input axis. Blue: sequential ascending constant-current steps; orange: descending from the final ascending state; green: independent starts from rest. Each grid current is held 300 ms, carrying the entire state only for the sequential curves. A rate is the inverse last interval, using events after 100 ms and requiring at least three retained crossings. Unresolved samples are omitted, rather than plotted as zero. The trace uses your exact selected current from time 0, starting either at rest or at the final state of a separate 100 ms I=20 run. Its finite counts and last-quarter voltage range are displayed independently of the nearest grid samples.`,
      scope: String.raw`Chosen space-clamped squid-HH convention: C=1µF/cm²; gNa=120,gK=36,gL=.3mS/cm²; ENa=50,EK=−77,EL=−54.387mV, with the atlas HH voltage-dependent gates and their stated temperature factor. These parameter choices differ from Gerstner’s cortical Table 2.1; its Fig. 2.7C–D explicitly discusses the original squid gain function separately. Grid spacing is .25µA/cm² up to 12, 2 from 14–40 and 10 from 50–150. The first resolved sample depends on step size, hold time, carried rounding perturbations, detector and initialization; it is not an exact rheobase or proof of asymptotic bistability. Upward 0 mV crossings are rearmed only below −20 mV, so undetected subthreshold oscillations are possible. No experimental rates, original 1948 priority or all-temperature onset constants are inferred.`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.8', 'neuro-3.4'],
      refs: ['Gerstner, Kistler, Naud & Paninski, Neuronal Dynamics (2014), complete §2.2.3, Fig. 2.7C–D and gain-function discussion; §4.4.3 local/global Hopf distinction: https://neuronaldynamics.epfl.ch/online/Ch2.S2.html', 'Izhikevich, Dynamical Systems in Neuroscience (2007), complete §6.1.3–6.1.4 printed168–178: https://izhikevich.org/publications/dsn.pdf'],
      tags: ['f–I curve', 'bistability'],
      credit: 'Hodgkin–Huxley conductance framework; retained gain-function and bifurcation explanations follow the cited complete author treatments. Numerical parameters and finite protocols are explicit atlas choices.',
      verify: false,
      viz(v) {
        const Tsel=v.select('temperature',[{value:6.3,label:'6.3 °C'},{value:18.5,label:'18.5 °C'}],6.3),rng=v.select('current range',[{value:15,label:'0–15 µA/cm²'},{value:150,label:'0–150 µA/cm²'}],15),start=v.select('trace starts from',[{value:'rest',label:'rest'},{value:'spiking',label:'I=20 warm state'}],'rest');
        const sA=v.stage({x:[0,15],y:[0,135],axes:'box',gutter:true,xlabel:'constant I (µA/cm²)',ylabel:'finite detected rate (Hz)',height:300,weight:1.1,minWidth:320}),sB=v.stage({x:[0,150],y:[-90,60],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'V (mV)',height:300,weight:1,minWidth:300}),h=sA.handle(8,0,{color:'gold',r:8,constrain:'x'}),cache=new Map();let info=null;
        const sweeps=()=>{const T=Number(Tsel.value);if(!cache.has(T))cache.set(T,hhFiringSweeps(T));return cache.get(T);};
        v.render(()=>{const S=sweeps(),xmax=Number(rng.value),I=clamp(h.x,0,xmax);h.set(I,0);const visible=rows=>rows.filter(q=>q.I<=xmax),all=[S.up,S.down,S.step].flatMap(visible).filter(q=>q.rate!==null),ymax=Math.max(20,...all.map(q=>q.rate))*1.12;sA.setView([-.015*xmax,xmax*1.015],[0,ymax]);
          for(const[rows,color,width]of[[S.down,ION_COL.Na,2.4],[S.up,'accent',2.6]]){sA.path(visible(rows).map(q=>q.rate===null?null:[q.I,q.rate]),{color,width});sA.dots(visible(rows).filter(q=>q.rate!==null).map(q=>[q.I,q.rate]),{r:2.6,color});}sA.dots(visible(S.step).filter(q=>q.rate!==null).map(q=>[q.I,q.rate]),{r:4,color:'green',hollow:true});sA.vline(I,{color:'gold',width:1.2,dash:[4,3]});
          const o=hhFiringTrace(S.T,I,start.value),tail=o.V.filter((_,j)=>o.t[j]>=112.5),range=Math.max(...tail)-Math.min(...tail);sB.setView([0,150],[Math.min(-85,...o.V)-2,Math.max(50,...o.V)+2]);trace(sB,o.t,o.V,{color:'accent',width:2.2});info={S,I,o,range};
        });
        v.legend([['accent','sequential ascent'],[ION_COL.Na,'sequential descent'],['green','independent rest starts',{dot:true}]]);
        v.readout(()=>{if(!info)return'';const{S,I,o,range}=info,nearest=S.up.reduce((a,q)=>Math.abs(q.I-I)<Math.abs(a.I-I)?q:a),at=rows=>rows.find(q=>q.I===nearest.I),show=q=>q.rate===null?'unresolved':v.fix(q.rate,3)+' Hz',first=rows=>{const q=rows.find(q=>q.rate!==null);return q?`I=${q.I}, rate=${v.fix(q.rate,3)}Hz`:'none';};return`Selected exact I=${v.fix(I,3)}µA/cm²: ${o.events.length} detected spikes in 150 ms; after 50 ms retained ${o.rate.count}, rate ${show(o.rate)}; last-quarter voltage range ${v.fix(range,5)}mV.`+'\n'+`Nearest grid I=${nearest.I}: ascending ${show(at(S.up))}, descending ${show(at(S.down))}, independent rest ${show(at(S.step))}.`+'\n'+`First resolved grid samples: ascending ${first(S.up)}; descending ${first(S.down)}. Sequential 300 ms holds; these are finite history comparisons, not exact stability boundaries. Maximum RK4 step ${S.dt}ms.`;});
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Model',
      name: 'Modified Connor–Stevens A-current model',
      statement: String.raw`A six-variable conductance model adds a transient outward A-current $I_A=\bar g_Aa^3b(V-E_A)$ to shifted Hodgkin–Huxley-like sodium and delayed potassium currents. All five gates relax toward their voltage-dependent targets, $\dot x=[x_\infty(V)-x]/\tau_x(V)$. A-current activation can oppose depolarization and delay spikes; the firing regime depends on conductance, kinetic parameters, input and initialization. Adding it does **not** by itself guarantee continuous zero-frequency onset or a SNIC. The displayed variant follows a complete author-hosted teaching implementation, with an explicitly altered leak reversal to keep rest fixed.`,
      idea: String.raw`During subthreshold depolarization, outward A-current can balance part of the applied input and slow the approach to a spike. Activation, inactivation and recovery determine when that opposition is present; their relative time scales matter. Connor and Stevens’ complete 1971 original analyzed a gastropod preparation with empirically tabulated kinetics, a fourth-power A-activation convention and different time constants. It supports the mechanism, not a claim that these teaching parameters reproduce that preparation. The finite curves below cannot establish an unbounded latency, exact onset class or homoclinic/SNIC mechanism.`,
      caption: String.raw`Choose A-conductance and drag input. The curves compare each chosen variant (blue) with gA=0 (red), using independent 620 ms runs from the common resting voltage and a step at 20 ms. Rates require at least three events after 120 ms and use the last interval; first-spike latency is measured only when a crossing occurs before the observation ends. Unresolved points remain gaps. The 400 ms voltage traces use the exact selected current, count events at integration resolution, and plot every 0.1 ms. The purple trace is conductance gA*a³*b, rather than ionic current. Each variant has its own leak reversal; this joint comparison is not a pharmacological channel-block experiment.`,
      scope: String.raw`Chosen single-compartment teaching variant: C=1µF/cm²; gNa=120,gK=20,gL=.3mS/cm²; ENa=55,EK=−72,EA=−75mV, gA chosen in mS/cm². The cited XPP file specifies sodium/potassium voltage shifts −5.3,−12,−4.3mV, rate factor 3.8 and a doubled n-gate time constant, plus the complete A-gate formulas. Here A activation uses the exact cube-root convention instead of the file’s rounded .3333 exponent. For each gA, EL is recomputed so the gate-equilibrium voltage stays at the baseline gA47.7,EL−17 rest. The fitted A-activation target can slightly exceed1 at spike voltages; it is retained without clipping and is not a literal probability throughout this model. The curves are model calculations, not original 1971/1977 table fits or an exact onset classification. Missing events are finite right-censoring; a few measured intervals do not prove a sustained attractor.`,
      deps: ['neuro-2.3', 'neuro-2.7'],
      see: ['neuro-3.5', 'neuro-3.4', 'neuro-1.5'],
      refs: ['G. Bard Ermentrout, author-hosted complete XPP Connor–Stevens teaching model, all constants, shifts, doubled n time constant and six ODEs: https://sites.pitt.edu/~phase/bard/bardware/classes/compneuro/model/cs.ode', 'Connor & Stevens (1971), complete original, J.Physiol.213:31–53, Eqs.(4)–(5)/(9), Table1 and discussion: https://elec548.github.io/Resources/Connor%2C%20Stevens%20-%20Prediction%20of%20repetitive%20firing%20behaviour%20from%20voltage%20clamp%20data%20on%20an%20isolated%20neurone%20soma.%20-%201971.pdf'],
      tags: ['A-current', 'excitability'],
      credit: 'Connor–Stevens conductance framework; this explicitly modified numerical variant follows Ermentrout’s complete author teaching model, rather than claiming an original experimental fit.',
      verify: false,
      viz(v) {
        const gsel=v.select('A-conductance $\\bar g_A$',[0,15,30,47.7].map(g=>({value:g,label:`${g} mS/cm²`})),47.7),IG=Array.from({length:15},(_,j)=>7+.5*j),cache=new Map();
        const sA=v.stage({x:[6.9,14.1],y:[0,120],axes:'box',gutter:true,xlabel:'step I (µA/cm²)',ylabel:'finite rate (Hz)',height:260,weight:1,minWidth:280}),sL=v.stage({x:[6.9,14.1],y:[1,1000],ylog:true,axes:'box',gutter:true,xlabel:'step I (µA/cm²)',ylabel:'first crossing latency (ms)',height:260,weight:1,minWidth:280}),sV=v.stage({x:[0,400],y:[-90,55],axes:'box',gutter:true,xlabel:'t (ms; step at20)',ylabel:'V (mV)',height:200,weight:1.4,minWidth:320}),sI=v.stage({x:[0,400],y:[0,50],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'gA a³b (mS/cm²)',height:200,weight:1,minWidth:280}),h=sA.handle(10,0,{color:'gold',r:8,constrain:'x'});let info=null;
        const curve=g=>{if(!cache.has(g))cache.set(g,csCurveAudit(g,IG));return cache.get(g);};
        v.render(()=>{const g=Number(gsel.value),cg=curve(g),c0=curve(0),I=clamp(h.x,7,14);h.set(I,0);const all=[...cg,...c0],rates=all.filter(q=>q.rate!==null).map(q=>q.rate),latencies=all.filter(q=>q.latency!==null&&q.latency>0).map(q=>q.latency);sA.setView([6.9,14.1],[0,Math.max(20,...rates)*1.12]);sL.setView([6.9,14.1],[Math.min(1,...latencies)*.8,Math.max(100,...latencies)*1.15]);
          for(const[rows,color,width]of[[c0,'red',2.2],[cg,'accent',2.6]]){sA.path(rows.map(q=>q.rate===null?null:[q.I,q.rate]),{color,width});sA.dots(rows.filter(q=>q.rate!==null).map(q=>[q.I,q.rate]),{r:2.5,color});sL.path(rows.map(q=>q.latency===null||q.latency<=0?null:[q.I,q.latency]),{color,width});}sA.vline(I,{color:'gold',dash:[4,3]});sL.vline(I,{color:'gold',dash:[4,3]});
          const o=csSimulationAudit(I,g,{T:400}),o0=csSimulationAudit(I,0,{T:400});sV.setView([0,400],[Math.min(-85,...o.V,...o0.V)-2,Math.max(50,...o.V,...o0.V)+2]);trace(sV,o0.t,o0.V,{color:'red',width:1.4,alpha:.7});trace(sV,o.t,o.V,{color:'accent',width:2.2});sI.setView([0,400],[0,Math.max(5,...o.conductance)*1.15]);trace(sI,o.t,o.conductance,{color:'purple',width:2.2});info={g,I,cg,c0,o,o0};
        });
        v.legend([['accent','chosen joint A/leak variant'],['red','gA=0, retuned leak'],['purple','A-conductance']]);
        v.readout(()=>{if(!info)return'';const{g,I,o,o0,cg,c0}=info,lat=q=>q.latency===null?'unresolved by400ms':v.fix(q.latency,4)+'ms',rate=q=>q.rate===null?'unresolved (<3 events after 120 ms)':v.fix(q.rate,4)+'Hz',min=rows=>{const r=rows.filter(q=>q.rate!==null);return r.length?v.fix(Math.min(...r.map(q=>q.rate)),4)+'Hz':'unresolved';};return`Exact I=${v.fix(I,3)}µA/cm²: chosen gA=${g}, EL=${v.fix(o.EL,5)}mV, latency ${lat(o)}, finite rate ${rate(o)} (${o.events.length} total events).`+'\n'+`gA=0 comparison: EL=${v.fix(o0.EL,5)}mV, latency ${lat(o0)}, rate ${rate(o0)} (${o0.events.length} events). Common rest V=${v.fix(csTargetRest(),6)}mV.`+'\n'+`Minimum resolved 620 ms grid rates: chosen ${min(cg)}, gA0 ${min(c0)}; grid step 0.5, not an asymptotic minimum. RK4 dt=.05ms, plotted every .1 ms; -20mV crossings rearmed below-40mV.`;});
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Channel noise and spontaneous spikes',
      statement: String.raw`A finite population of randomly switching ion channels produces fluctuating membrane conductances. In the classical independent-subunit Hodgkin–Huxley channel model, prescribing the voltage trajectory and starting with independent gates gives an open-channel fraction with mean $p$ and variance $p(1-p)/N$, where $p_{Na}=m^3h$ and $p_K=n^4$. Its absolute standard deviation is of order $N^{-1/2}$; its coefficient of variation is $\sqrt{(1-p)/(Np)}$ when $p>0$. With voltage feedback, channel fluctuations can generate spontaneous spikes and variable spike times. These effects and their frequency depend on the parameters, input and channel count.`,
      idea: String.raw`A K channel has four two-state $n$ subunits: the lumped state $k=0,\ldots,4$ jumps upward at $(4-k)\alpha_n$ and downward at $k\beta_n$. A Na channel has three $m$ subunits and one $h$ subunit, hence eight lumped states. The conducting states have all four subunits open. For a prescribed voltage, independent channel indicators give the binomial mean and variance directly; raising an aggregate noisy gate fraction to its fourth power would instead mix subunits belonging to different channels. In the freely evolving membrane, the shared voltage couples channels and the finite-population expectation does not simply satisfy the nonlinear HH equations. The deterministic equations describe the large-population limit under the usual channel-model assumptions (Goldwyn & Shea-Brown, 2011, pp. 1, 3–5).`,
      caption: String.raw`Left: one 200 ms stochastic trace and six spike rasters at the selected constant current, compared with deterministic HH from the same nominal rest. The deterministic model may have transient spikes; its actual count is reported. Right: 40 separate trials receive a 9 µA/cm² pulse on $[2,3)$ ms, without the constant-current slider. The histogram covers the whole 10 ms post-onset observation window. Its bars are fractions of all 40 trials; trials with no crossing by 12 ms are reported as right-censored. A crossing after pulse onset may be spontaneous, so it is not automatically an evoked response. Change patch size, time step, or “new runs” to compare finite samples; individual samples need not show a monotone change in variability.`,
      scope: String.raw`Classical space-clamped HH at 6.3 °C, chosen densities 60 Na and 18 K channels/µm² (rounded channel counts). With a nominal 20 pS/channel these give 120 and 36 mS/cm²; Goldwyn & Shea-Brown's 100 µm² example has 6000 Na and 1800 K channels (Fig. 1). This is a model illustration, not a fit to small axons or spines. Initial channel states are sampled independently at −65 mV gate equilibrium. Each step samples the exact transition matrix for voltage held fixed during that step, including multiple subunit transitions, using multinomial inversion; an exponential voltage update then holds the new conductances fixed. The coupled simulation has first-order splitting error and seeded pseudorandom draws, and is not a continuous-time Gillespie run. Halving the step gives another approximate sample, not an exact paired trajectory or proof of convergence. Spike events are interpolated upward 0 mV crossings, rearmed below −20 mV.`,
      deps: ['neuro-2.3', 'neuro-1.6'],
      see: ['neuro-2.4', 'stoch-1.4'],
      refs: ['Goldwyn & Shea-Brown (2011), pp. 1–6, Eqs. 10–13, Fig. 3; doi:10.1371/journal.pcbi.1002247'],
      tags: ['channel noise', 'stochastic'],
      credit: 'Classical channel model; presentation: Goldwyn & Shea-Brown, 2011',
      verify: false,
      viz(v) {
        const As=v.slider('patch area',1,300,6,{log:true,fmt:x=>`${v.fix(x,x<10?1:0)} µm²`}),Is=v.slider('constant current $I$',0,6,2,{step:.1,fmt:x=>`${v.fix(x,1)} µA/cm²`}),ds=v.select('splitting step',[{value:.025,label:'0.025 ms'},{value:.0125,label:'0.0125 ms'}],.025);
        let seed=1;v.button('new runs',()=>{seed++;});
        const sV=v.stage({x:[0,200],y:[-90,55],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'V (mV)',height:200,weight:1.3,minWidth:340}),sR=v.stage({x:[0,200],y:[.3,7.7],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'run',height:200,weight:1.3,minWidth:340,yticks:[[1,'det.'],[2,'1'],[3,'2'],[4,'3'],[5,'4'],[6,'5'],[7,'6']]}),sH=v.stage({x:[0,10],y:[0,1],axes:'box',gutter:true,xlabel:'first post-onset crossing latency (ms)',ylabel:'fraction of all 40 trials',height:420,weight:1,minWidth:280});
        const NR=6,NT=40,PUL=pulse(2,1,9);let key='',C=null;
        const get=()=>{const k=`${As.value}|${Is.value}|${ds.value}|${seed}`;if(k===key)return C;key=k;const A=As.value,NNa=Math.round(60*A),NK=Math.round(18*A),I=Is.value,dt=Number(ds.value),det=hhSim(()=>I,{tEnd:200,dt:.01,every:10}),detSpikes=hhRun(()=>I,{tEnd:200,dt:.01}).spikes,runs=Array.from({length:NR},(_,r)=>channelRun(()=>I,{NNa,NK,tEnd:200,dt,every:Math.round(.1/dt),rng:v.rng(seed*1000+r)}));
          const trials=Array.from({length:NT},(_,r)=>channelRun(PUL,{NNa,NK,tEnd:12,dt,every:Math.round(.1/dt),rng:v.rng(seed*7919+100+r)}).spikes),summary=latencySummary(trials),ds0=hhRun(PUL,{tEnd:12,dt:.01}).spikes.find(t=>t>=2&&t<=12),dl=ds0===undefined?null:ds0-2;
          return C={A,NNa,NK,I,dt,det,detSpikes,runs,...summary,dl};};
        v.render(()=>{const D=get(),vals=[...D.det.V,...D.runs[0].V];sV.setView([0,200],[Math.min(-85,...vals)-2,Math.max(50,...vals)+2]);trace(sV,D.det.t,D.det.V,{color:'ink',width:1.4,dash:[5,4]});trace(sV,D.runs[0].t,D.runs[0].V,{color:'accent',width:1.8});sR.hline(1.5,{color:'grid'});D.runs.forEach((r,i)=>sR.dots(r.spikes.map(t=>[t,i+2]),{r:3.2,color:'accent'}));sR.dots(D.detSpikes.map(t=>[t,1]),{r:3.2,color:'ink'});
          const fr=D.counts.map(c=>c/NT),fm=Math.max(.2,...fr);sH.setView([0,10],[0,fm*1.2]);sH.bars(fr,{x0:D.width/2,dx:D.width,color:'accent'});if(D.dl!==null){sH.vline(D.dl,{color:'ink',dash:[5,4],width:1.6});sH.text('det.',D.dl,fm*1.1,{size:10.5,color:'ink',align:'center'});}});
        v.legend([['accent','finite stochastic sample'],['ink','deterministic HH',{dash:true}]]);
        v.readout(()=>{const D=get(),sp=D.runs.reduce((a,r)=>a+r.spikes.length,0),f=x=>x===null?'unavailable':v.fix(x,3)+' ms';return`Area ${v.fix(D.A,3)} µm²: NNa=${D.NNa}, NK=${D.NK}; I=${v.fix(D.I,1)} µA/cm²; splitting dt=${D.dt} ms; sample seed=${seed}.`+'\n'+`Constant-input 200 ms runs: deterministic ${D.detSpikes.length} events; six stochastic runs ${sp} events (${v.fix(sp/(NR*.2),2)} events/s per patch).`+'\n'+`Separate pulse trials: ${D.lats.length}/${NT} post-onset crossings, ${D.censored}/${NT} right-censored at12ms. Histogram accounts for ${D.counts.reduce((a,b)=>a+b,0)} crossing trials over0–10ms; bar mass=${v.fix(D.lats.length/NT,3)}.`+'\n'+`Conditional observed latency mean ${f(D.mean)}, sample SD ${f(D.sd)}; deterministic latency ${f(D.dl)}. Fixed-voltage absolute SD scales as sqrt[p(1−p)/N], not a measured relative percentage for this feedback trace.`;});
      }
    },
  ],
};
