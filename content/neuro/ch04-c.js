// Computational Neuroscience — Chapter 4 (part c): 4.8 myelination and saltatory conduction, 4.9 dendritic filtering, 4.10 active dendrites
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked: Huxley & Stämpfli 1949, J. Physiol. 108: 315–339 (10.1113/jphysiol.1949.sp004335); Tasaki 1939, Am. J. Physiol. 127: 211–227
//   (10.1152/ajplegacy.1939.127.2.211); Rushton 1951, J. Physiol. 115: 101–122 (10.1113/jphysiol.1951.sp004655); Hursh 1939, Am. J. Physiol. 127: 131–139
//   (10.1152/ajplegacy.1939.127.1.131); Rall 1967, J. Neurophysiol. 30: 1138–1168 (10.1152/jn.1967.30.5.1138); Schiller, Major, Koester & Schiller 2000,
//   Nature 404: 285–289 (10.1038/35005094); Polsky, Mel & Schiller 2004, Nat. Neurosci. 7: 621–627 (10.1038/nn1253); Stuart & Sakmann 1994, Nature 367: 69–72
//   (10.1038/367069a0); Larkum, Zhu & Sakmann 1999, Nature 398: 338–341 (10.1038/18686).
// -4.8 now cites the complete Gerstner author treatment §3.3.2/Eq3.42 for the nodal circuit.
//   Unread original-experiment/priority and empirical6m/s-per-µm claims have been removed.
//   Its chosen simulation is explicitly separate from an ideal dimensional-similarity argument:
//   fixed1µm nodes, integer sheath layers and finite observation can violate exact slope1.
//   All nodal ionic densities, including leak, are scaled30× with a fixed stated leak reversal.
// - 4.10: the neuron is a model on this page (passive soma, ten thin branches, squid-HH Na⁺/K⁺ kinetics at 30 °C for the dendritic channels, an AMPA-like
//   alpha conductance and an NMDA-like two-exponential conductance with the Jahr–Stevens magnesium block); its parameters were tuned to show the effect and do not
//   fit any recording. The soma does not spike, so somatic depolarisations of tens of mV are only a measure of the dendritic drive.
import { HH, buildTree, treeSim, lambdaUm } from './ch04.shared.js';
import { uniformAxonAudit, positiveLogFit } from './source-audit-conduction.shared.js';
import { myelinAudit } from './source-audit-myelin.shared.js';

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
      statement: String.raw`Myelin reduces the capacitance and leak of internodal membrane; active nodes regenerate voltage between the insulated segments. This is **saltatory conduction**. In an ideal family with nodal capacitance/ionic conductance and inter-node axial conductance all proportional to fibre diameter $D$, and node spacing proportional to $D$, corresponding node voltages follow the same time course, giving speed $\theta\propto D$. This conditional scaling differs from the unmyelinated continuous-cable $\sqrt d$ law. Finite nodal resistance, discrete sheath layers, membrane properties and propagation failure can break the ideal similarity; thinning or removing insulation does not universally abolish conduction.`,
      idea: String.raw`The nodal circuit has $C_n\dot V_n=G_a(V_{n-1}-2V_n+V_{n+1})-I_{{\rm ion},n}$ (Gerstner et al. §3.3.2, Eq.3.42). If all coefficients scale by the same factor $D$, dividing by that factor leaves the dynamics in node index unchanged; with spacing $L\propto D$, spatial velocity then scales as $D$. In the displayed layered approximation, effective internodal capacitance/leak equal the inner membrane values divided by the chosen layer count. For fixed g-ratio and $L/D$, taking layer count proportional to $D$ gives internodal area $\propto D^2$ and effective capacitance $\propto D$. Fixed-length nodes add axial resistance proportional to $D^{-2}$, whereas internodal resistance scales as $D^{-1}$, so exact similarity requires that nodal axial resistance be negligible, as well as ignoring integer rounding.`,
      caption: String.raw`Left: a chosen twelve-node fibre, with actual compartment-centre voltages and gold nodal markers. Vary nominal outer diameter $D$, inner/outer g-ratio, internode $L/D$, insulation and numerical resolution. Inner axon diameter remains $gD$ even when insulation is removed. Right: seven independently simulated myelinated-model speeds, with gaps where arrival is unresolved by 12 ms; the gold point is the selected diameter. Grey is an ideal unmyelinated $\sqrt D$ reference calibrated by one 476 µm HH cable computation at 18.5 °C, compared at the same nominal outer diameter $D$ rather than inner $gD$. Its seven reference values are a formula, not seven additional cable runs. Reported log slopes describe the resolved finite sample, not a theorem or experimental calibration.`,
      scope: String.raw`Illustrative nodal/internodal circuit, not a fit to vertebrate fibres:12 nodes of length 1 µm, internodes $L=(L/D)D$, inner diameter$gD$, Ra 35.4 Ω cm, squid-HH kinetics at 18.5 °C. Each node has Cm 1 µF/cm² and all ionic densities 30× HH (Na 3600/K 1080/leak 9 mS/cm²); all leak reversals are fixed at −54.387 mV, with ENa 50/EK −77 mV. Each internode has no Na/K conductance; its capacitance 1 µF/cm² and leak 0.3 mS/cm² are divided by N=max(1,round[(D−gD)/(2×.0085µm)]). “Thin” divides N by10 with rounding/minimum1; “absent” uses1, leaving nodal densities unchanged. This planar series-layer approximation omits periaxonal space and cylindrical-layer radius corrections. A 4000 µA/cm² pulse acts only on the first node for 0.3 ms. Two numerical pairs use 3 internodal compartments/dt 0.0025 ms or 6/dt 0.001 ms; voltage backward-Euler, gates exponential-Euler. Speed uses interpolated upward 0 mV crossings at nodes 4 and 10. Missing arrivals are finite-protocol censoring, not proof of biophysical failure.`,
      deps: ['neuro-4.7'],
      see: ['neuro-4.7', 'neuro-2.3'],
      refs: ['Gerstner et al., Neuronal Dynamics §3.3.2, Eq.3.42 (nodal circuit); chosen simulation specified here'],
      tags: ['axon', 'myelin', 'conduction velocity'],
      credit: 'Nodal-circuit presentation: Gerstner et al., 2014, §3.3.2',
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Saltatory_conduction' },
      viz(v) {
        const Dsl=v.slider('nominal outer diameter $D$',.5,20,4,{log:true,fmt:x=>`${v.fmt(x,4)} µm`}),gsl=v.slider('g-ratio',.4,.85,.65,{step:.01}),rsl=v.slider('internode $L/D$',20,300,100,{step:5,int:true}),sh=v.select('insulation',[{value:'full',label:'chosen full layers'},{value:'thin',label:'layers ÷10'},{value:'none',label:'one membrane'}],'full'),res=v.select('resolution',[{value:'coarse',label:'3 internodal / .0025ms'},{value:'fine',label:'6 internodal / .001ms'}],'fine'),sA=v.stage({x:[0,1],y:[-85,60],axes:'box',gutter:true,xlabel:'compartment centre (mm)',ylabel:'V (mV)',height:300,weight:1.25}),sB=v.stage({x:[.45,26],y:[.1,200],xlog:true,ylog:true,axes:'box',gutter:true,xlabel:'nominal outer diameter D (µm)',ylabel:'speed θ (m/s)',height:300,weight:1});
        const DS=[.5,1,2,4,8,16,24],runs=new Map(),sweeps=new Map(),movies=new Map(),opt=()=>({g:gsl.value,ratio:rsl.value,sheath:sh.value,...(res.value==='fine'?{mInt:6,dt:.001}:{mInt:3,dt:.0025})}),key=()=>`${gsl.value}|${rsl.value}|${sh.value}|${res.value}`,run=D=>{const k=`${D}|${key()}`;if(!runs.has(k))runs.set(k,myelinAudit(D,opt()));return runs.get(k);},sweep=()=>{const k=key();if(!sweeps.has(k))sweeps.set(k,DS.map(D=>[D,run(D).speed]));return sweeps.get(k);};
        let base=null;const unref=D=>{if(base===null)base=uniformAxonAudit(476,{T:18.5,dx:50,dt:.01}).speed;return base*Math.sqrt(D/476);},movie=D=>{const k=`${D}|${key()}`;if(!movies.has(k)){const r0=run(D),tEnd=r0.arrivals[1]===null?12:Math.min(12,r0.arrivals[1]*1.3+.1),r=myelinAudit(D,{...opt(),tEnd,frames:Math.max(1,Math.round(tEnd/opt().dt/120))});let lo=-85,hi=55;for(const F of r.sim.frames)for(const V of F){lo=Math.min(lo,V);hi=Math.max(hi,V);}movies.set(k,{...r,speed:r0.speed,arrivals:r0.arrivals,lo:lo-2,hi:hi+2});}return movies.get(k);};let st=null;
        v.animate(t=>{const D=Dsl.value,R=movie(D),M=R.M,S=sweep(),U=DS.map(d=>[d,unref(d)]),fit=positiveLogFit(S),fi=clamp(Math.round(t/6*(R.sim.frames.length-1)),0,R.sim.frames.length-1),F=R.sim.frames[fi];sA.setView([0,M.len/1000],[R.lo,R.hi]);sA.path(Array.from(F,(V,i)=>[M.xs[i]/1000,V]),{color:'accent',width:2});sA.dots(M.nodeIdx.map(i=>[M.xs[i]/1000,F[i]]),{r:4,color:'gold'});sA.text(`t=${v.fix(R.sim.ft[fi],4)}ms`,.02*M.len/1000,R.hi-8,{size:12,color:'muted',align:'left'});
          const values=[...S.filter(p=>p[1]!==null).map(p=>p[1]),...U.map(p=>p[1]),unref(D),...(R.speed===null?[]:[R.speed])];sB.setView([.45,26],[Math.min(...values)*.7,Math.max(...values)*1.35]);sB.path(S.map(p=>p[1]===null?null:p),{color:'green',width:2});sB.dots(S.filter(p=>p[1]!==null),{r:5,color:'green'});sB.path(U,{color:'muted',width:2});sB.dots(U,{r:3,color:'muted'});if(R.speed!==null)sB.dot(D,R.speed,{r:8,color:'gold'});else sB.vline(D,{color:'red',dash:true});st={D,R,fit,S,fi,u:unref(D)};
        },{period:6,still:3.6});v.legend([['accent','chosen model voltage'],['gold','nodes / selected D',{dot:true}],['green','resolved myelin-model runs'],['muted','ideal unmyelinated √D reference']]);
        v.readout(()=>{if(!st)return'';const{D,R,fit,S,fi,u}=st,M=R.M,f=x=>x===null?'unresolved':v.fix(x,6)+'ms';return`Nominal D=${v.fix(D,4)}µm; inner gD=${v.fix(M.d,4)}µm; L=${v.fix(M.L,4)}µm; ${M.nb} chosen series layer(s). ${M.mInt} internodal compartments; dt=${R.dt}ms.`+'\n'+`Nodes4/10 arrivals ${R.arrivals.map(f).join(', ')}; speed ${R.speed===null?'unresolved by 12 ms':v.fix(R.speed,5)+'m/s'}. ${S.filter(p=>p[1]!==null).length}/7 sweep speeds resolved; log slope ${fit?v.fix(fit.slope,6):'unavailable (<3 positive resolved points)'}. No universal slope 1/failure conclusion follows.`+'\n'+`Ideal unmyelinated √D reference=${v.fix(u,5)}m/s, from one 476 µm finite-cable calibration (${v.fix(base,5)}m/s), not an independently simulated point. Nodal leak also 30× with fixed EL=−54.387mV; first-node pulse only. Movie t=${v.fix(R.sim.ft[fi],4)}ms.`;});
      }
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
