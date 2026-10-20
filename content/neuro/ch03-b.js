// Computational Neuroscience — Chapter 3 (part b): 3.6 Morris–Lecar, 3.7 quadratic integrate-and-fire and theta neuron,
// 3.8 bursting by fast–slow dissection, 3.9 Izhikevich's simple model.
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked: Morris & Lecar 1981, Biophys. J. 35: 193–213 (10.1016/S0006-3495(81)84782-0); Ermentrout & Kopell 1986, SIAM J. Appl.
//   Math. 46: 233–253 (10.1137/0146017); Rinzel 1987, in Mathematical Topics in Population Biology, Morphogenesis and Neurosciences
//   (Lecture Notes in Biomathematics), pp. 267–281 (10.1007/978-3-642-93360-8_26); Izhikevich 2003, IEEE Trans. Neural Netw. 14: 1569–1572
//   (10.1109/TNN.2003.820440).
// - Izhikevich2003 full original authorPDF read in this source audit (all4pages; Fig2 visually checked):
//   all five displayed presets, including LTS(.02,.25,-65,2), match Fig2/§III. The finite hybrid solver and its
//   integration resolution below are this atlas's explicit numerical choice, not the network Euler code in §IV.
// - The bursting model (Morris–Lecar with a slow calcium-like variable) is built and tuned on this page: its parameters are not from a paper.
import { ION_COL, trace, rk4, ML_SETS, mlF, mlWinf, mlWnull, mlEquilibria, mlCurve, mlOrbit, BURST, burstOrbit, burstFastEq, burstFastCycle, IZH, izhRun } from './ch03.shared.js';
import { burstRecorded, burstFastSlice } from './source-audit-bursting.shared.js';
import { mlEquilibriaAudit, mlRateCurveAudit, clippedMLCurve } from './source-audit-morris-lecar.shared.js';
import { izhHybrid, clippedQuadratic, clippedLinear } from './source-audit-izhikevich.shared.js';

function eqDot(s, x, y, type, label) {
  if (type === 'stable') s.dot(x, y, { r: 6, color: 'green', label, labelPos: 'ne' });
  else if (type === 'saddle') s.dot(x, y, { r: 6, color: 'ink', hollow: true, label, labelPos: 'ne' });
  else s.dot(x, y, { r: 6, color: 'red', hollow: true, label, labelPos: 'ne' });
}
const clampTo = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'neuro',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Morris–Lecar model',
      statement: String.raw`A Morris–Lecar conductance model combines a fast calcium-like current, a delayed potassium current with one activation variable w, and leak: $$C\dot V=I-g_L(V-E_L)-g_{Ca}m_\infty(V)(V-E_{Ca})-g_Kw(V-E_K),\qquad\dot w=\phi\,[w_\infty(V)-w]\cosh[(V-V_3)/(2V_4)].$$ Here $m_\infty=[1+\tanh((V-V_1)/V_2)]/2$ and $w_\infty=[1+\tanh((V-V_3)/V_4)]/2$. Positive capacitance, conductances, activation slopes and rate φ define a phenomenological excitable membrane. Three parameters $V_3,V_4,\phi$, together with the calcium conductance, differ between the two chosen examples. Equilibrium disappearance and loss of stability are distinct mechanisms; finite observed firing rates alone do not identify a bifurcation.`,
      idea: String.raw`Instantaneous inward activation supplies positive feedback, while delayed outward potassium activation restores voltage. This is a model in its own right, not an exact reduction of Hodgkin–Huxley or a parameter fit to a particular cell. At equilibrium $w=w_\infty(V)$, so define $I_\infty(V)=g_L(V-E_L)+g_{Ca}m_\infty(V)(V-E_{Ca})+g_Kw_\infty(V)(V-E_K)$. Its intersections with the chosen input locate equilibria. Stationary points of this curve locate folds; the full two-dimensional Jacobian is needed for stability and Hopf candidates. A fold alone does not prove a global return, nor does a Hopf candidate specify the stable global firing branch.

For the local equilibrium diagnostic, the Jacobian governs a linear perturbation system and ode-3.9 supplies its spectral test. Strictly negative real parts make every solution of that linear system decay; a positive real part gives a growing linear mode. In two dimensions this is equivalent to negative trace and positive determinant for strict linear asymptotic stability. Eigenvalues on the imaginary axis require further information, including Jordan structure for bounded linear motion and nonlinear nondegeneracy for a Hopf theorem. None of these local tests certifies a stable global firing cycle from a finite run.`,
      caption: String.raw`Choose an example and current. The phase portrait starts at V=−60,w=w∞(−60) under constant input for 500 ms; the voltage panel instead begins at the model’s actual zero-input equilibrium and switches input at 50 ms. These are different protocols. The right panel uses 2500 ms runs from the phase initialization, retaining upward zero-voltage crossings only in the last two thirds. A rate requires at least three retained events; unresolved points are omitted rather than drawn at zero. Classified equilibria, actual orbit/trace extents, both numerical rate curves and the current marker update with the controls. Nullclines are clipped to the displayed window.`,
      scope: String.raw`Chosen mathematical examples in mV, ms and µA/cm². Common values: C=20µF/cm²; gL=2,gK=8mS/cm²; EL=−60,EK=−84,ECa=120,V1=−1.2,V2=18mV. Fold example: gCa=4mS/cm²,V3=12mV,V4=17.4mV,φ=.067/ms. Hopf example: gCa=4.4mS/cm²,V3=2mV,V4=30mV,φ=.04/ms. These explicit values are not attributed to an unread original table or a measured barnacle preparation. The source supports the model equations; the atlas computes trajectories and local equilibrium data. Neither finite runs nor omitted rates prove asymptotic quiescence, bistability or an exact global SNIC connection.`,
      deps: ['neuro-3.1', 'ode-3.9'],
      see: ['neuro-3.4', 'neuro-3.5', 'neuro-2.8'],
      refs: ['Gerstner, Kistler, Naud & Paninski, Neuronal Dynamics (2014), complete §4.2.1 Morris–Lecar development, Eqs.(4.6)–(4.10): https://neuronaldynamics.epfl.ch/online/Ch4.S2.html', 'Izhikevich, Dynamical Systems in Neuroscience (2007), §6.1.1–6.1.4: https://izhikevich.org/publications/dsn.pdf'],
      tags: ['calcium', 'type I and II'],
      credit: 'Morris–Lecar conductance framework, following the complete author treatment by Gerstner et al.; parameter choices and numerical comparisons are specified atlas examples.',
      verify: false,
      viz(v) {
        const sel=v.select('parameter set',[{value:'snic',label:'fold example'},{value:'hopf',label:'Hopf example'}],'snic',{onChange:()=>Isl.set(sel.value==='snic'?45:100)});
        const Isl=v.slider('current $I$',0,112,45,{step:.5,fmt:x=>`${x} µA/cm²`});
        const sA=v.stage({x:[-75,60],y:[-.05,1.05],axes:'box',gutter:true,xlabel:'V (mV)',ylabel:'w',height:320,weight:1.1,minWidth:300});
        const sB=v.stage({x:[0,300],y:[-75,50],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'V (mV)',height:320,weight:1,minWidth:260});
        const sC=v.stage({x:[0,112],y:[0,28],axes:'box',gutter:true,xlabel:'I (µA/cm²)',ylabel:'finite crossing rate (Hz)',height:320,weight:1,minWidth:260}),grid=Array.from({length:29},(_,i)=>4*i);
        v.render(()=>{
          const p=ML_SETS[sel.value],I=Isl.value,eq=mlEquilibriaAudit(p,I),orbit=mlOrbit(p,I,500,{dt:.25,every:2}),xlim=[Math.min(-75,...orbit.map(q=>q[0]),...eq.map(q=>q.V))-1,Math.max(60,...orbit.map(q=>q[0]),...eq.map(q=>q.V))+1],ylim=[-.05,1.05];sA.setView(xlim,ylim);
          for(const[fn,color]of[[V=>mlWnull(p,V,I),'orange'],[V=>mlWinf(p,V),'purple']])for(const path of clippedMLCurve(fn,[Math.max(-80,xlim[0]),xlim[1]],ylim))sA.path(path,{color,width:2.2});sA.path(orbit,{color:'accent',width:2});for(const e of eq)eqDot(sA,e.V,e.w,e.type);
          const rest=mlEquilibriaAudit(p,0).find(e=>e.type==='stable');let y=[rest.V,rest.w];const pts=[];for(let k=0;k<=1200;k++){const t=k*.25;if(k%2===0)pts.push([t,y[0]]);if(k<1200)y=rk4(q=>mlF(p,q[0],q[1],t>=50?I:0),y,.25);}sB.setView([0,300],[Math.min(-75,...pts.map(q=>q[1]))-1,Math.max(50,...pts.map(q=>q[1]))+1]);sB.path(pts,{color:'accent',width:2});sB.vline(50,{color:'gold',dash:[4,4],width:1.2});
          const curves=['snic','hopf'].map(name=>({name,rows:mlRateCurveAudit(name,ML_SETS[name],grid)})),rate=mlRateCurveAudit(sel.value,p,[I])[0],all=curves.flatMap(q=>q.rows.filter(r=>r.rate!==null).map(r=>r.rate));sC.setView([-2,114],[0,Math.max(28,...all,...(rate.rate===null?[]:[rate.rate]))*1.08]);for(const{name,rows}of curves)sC.path(rows.map(r=>r.rate===null?null:[r.I,r.rate]),{color:name==='snic'?'teal':'pink',width:name===sel.value?2.8:1.4,alpha:name===sel.value?1:.6});if(rate.rate!==null)sC.dot(I,rate.rate,{r:6,color:'gold'});v._r={eq,rate,rest};
        });
        v.legend([['orange','V-nullcline'],['purple','w-nullcline'],['accent','orbit / V(t)'],['teal','finite rates, fold example'],['pink','finite rates, Hopf example']]);
        v.readout(()=>{const r=v._r;if(!r)return'';return`${sel.value==='snic'?'Fold':'Hopf'} example: ${r.eq.map(e=>`${e.type} at V=${v.fix(e.V,3)} mV (trace ${v.fix(e.tr,5)}, det ${v.fix(e.det,5)})`).join('; ')||'no equilibrium in the displayed search domain'}.`+'\n'+`2500 ms run, retained crossings after 833.33 ms: ${r.rate.count}; ${r.rate.rate===null?'rate unresolved (fewer than three retained events)':v.fix(r.rate.rate,4)+' Hz from finite intervals'}. Step trace starts at actual zero-input rest V=${v.fix(r.rest.V,4)} mV.`;});
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Quadratic integrate-and-fire and the theta neuron',
      statement: String.raw`The quadratic integrate-and-fire (QIF) neuron is the normal form of a type I membrane near its saddle-node: $\dot V = V^2 + I$ in rescaled units, with the rule that when $V$ reaches a peak value $V_p$ it is reset to $-V_p$. Without a cutoff, a solution with $I>0$ is $V(t)=\sqrt I\tan(\sqrt I\,t + c)$ and escapes to infinity in finite time; letting $V_p\to\infty$ the interval between spikes is exactly
$$T=\frac{\pi}{\sqrt{I}}\quad(I>0),$$
and for finite $V_p$ it is $T=\tfrac{2}{\sqrt I}\arctan(V_p/\sqrt I)$. The substitution $V=\tan(\theta/2)$ turns the blow-up into a smooth rotation on a circle, the **theta neuron**:
$$\dot\theta = (1-\cos\theta) + I\,(1+\cos\theta),$$
where a spike is the passage through $\theta=\pi$. For $I<0$ there are two equilibria $V=\pm\sqrt{-I}$ (a stable one and an unstable one, i.e. rest and threshold) at $\cos\theta=(1+I)/(1-I)$; they merge at $I=0$ and vanish.`,
      idea: String.raw`The equation $\dot V=V^2+I$ is the saddle-node normal form (neuro-3.5), and the whole firing curve $f=\sqrt I/\pi$ comes from integrating $\mathrm d V/(V^2+I)$ from $-\infty$ to $\infty$. Compactifying the real line to a circle by $V=\tan(\theta/2)$ (a stereographic-type change of variable) removes the singularity: the point at infinity is $\theta=\pi$, and $\dot\theta$ is a smooth function of $\theta$ that vanishes at two points when $I<0$ and nowhere when $I>0$. Ermentrout and Kopell used this form to analyse bursting and synchrony; its single-variable phase equation is also the standard phase model of a type I neuron's response to input.

The coordinate change uses the chain rule pma-5.5 on each finite-voltage chart. From $V=\tan(\theta/2)$ one gets $\dot\theta=2\dot V/(1+V^2)$. Substituting $\dot V=V^2+I$ and the half-angle identities gives $(1-\cos\theta)+I(1+\cos\theta)$. This last expression extends smoothly to the point theta equals pi, although the original tangent chart does not. The finite-cutoff reset rule and the ideal infinite-cutoff circular flow must still be distinguished.`,
      caption: String.raw`Choose $I$ and a starting voltage and let the clock run. Left: the voltage $V(t)$ with its cutoff and reset; the dotted line is the true solution that blows up. Middle: the same state as an angle $\theta$ on a circle (spike at the left point); for $I<0$ a stable (green) and unstable (red) equilibrium appear. Right: the parabola $\dot V=V^2+I$ with the state sliding on it. The readout compares the simulated interspike interval with $\pi/\sqrt I$ and with the exact finite-cutoff formula.`,
      scope: String.raw`A canonical model near a saddle-node on an invariant circle: it captures the generic type I onset, the spike latency and the $\sqrt I$ rate law, but not spike shape or adaptation. In dimensionless units (time is measured so that the coefficients are 1); the cutoff values $V_p$ are numerical devices.`,
      deps: ['neuro-3.5', 'pma-5.5'],
      see: ['neuro-5.3', 'neuro-3.9'],
      refs: ['Gerstner §5.3'],
      tags: ['normal form', 'type I'],
      credit: 'G. B. Ermentrout and N. Kopell, 1986 (SIAM J. Appl. Math. 46: 233–253)',
      links: { doi: 'https://doi.org/10.1137/0146017' },
      viz(v) {
        const I = v.slider('input $I$', -1, 3, 0.5, { step: 0.05 });
        const V0 = v.slider('start $V(0)$', -4, 4, -2, { step: 0.1 });
        const cut = v.select('cutoff $V_p$', [{ value: 5, label: '5' }, { value: 20, label: '20' }, { value: 100, label: '100' }], 20);
        const TEND = 12, DT = 0.005;
        const sA = v.stage({ x: [0, TEND], y: [-6, 6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'V', height: 300, weight: 1.3, minWidth: 320 });
        const sB = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 240 });
        const sC = v.stage({ x: [-4, 4], y: [-2, 8], axes: true, height: 300, weight: 1, minWidth: 260, xlabel: 'V', ylabel: 'dV/dt' });
        let key = '', S = null;
        const get = () => {
          const k = `${I.value}|${V0.value}|${cut.value}`; if (k === key) return S; key = k;
          const i = I.value, thp = 2 * Math.atan(cut.value), F = (y) => [1 - Math.cos(y[0]) + i * (1 + Math.cos(y[0]))];
          let th = 2 * Math.atan(clampTo(V0.value, -cut.value, cut.value)); const th_ = [th], spikes = [], N = Math.round(TEND / DT);
          for (let n = 1; n <= N; n++) { th = rk4(F, [th], DT)[0]; if (th >= thp) { spikes.push(n * DT); th = -thp; } th_.push(th); }
          // true solution with no cutoff (before the first blow-up)
          const free = []; if (i > 0) { const a = Math.sqrt(i), c0 = Math.atan(V0.value / a), tb = (Math.PI / 2 - c0) / a; for (let t = 0; t < Math.min(tb, TEND); t += 0.02) free.push([t, a * Math.tan(a * t + c0)]); }
          S = { th: th_, spikes, free, thp, i };
          return S;
        };
        v.animate((tt) => {
          const R = get(), t = tt % TEND, n = Math.min(R.th.length - 1, Math.round(t / DT));
          const Vt = R.th.map((th) => Math.tan(th / 2));
          const pts = []; for (let k = 0; k < Vt.length; k += 4) pts.push([k * DT, Vt[k]]);
          sA.hline(cut.value, { color: 'faint', dash: [3, 4], width: 1 }); sA.hline(-cut.value, { color: 'faint', dash: [3, 4], width: 1 });
          sA.path(R.free.filter((q) => Math.abs(q[1]) < 12), { color: 'muted', width: 1.4, dash: [2, 4] });
          // draw with breaks at resets
          let seg = []; const segs = [];
          for (let k = 0; k < pts.length; k++) { if (k && pts[k][1] < pts[k - 1][1] - 1) { segs.push(seg); seg = []; } seg.push(pts[k]); }
          segs.push(seg);
          for (const sg of segs) sA.path(sg, { color: 'accent', width: 1.4, alpha: 0.35 });
          const upto = []; for (let k = 0; k <= n; k += 4) upto.push([k * DT, Vt[k]]);
          let seg2 = []; const segs2 = [];
          for (let k = 0; k < upto.length; k++) { if (k && upto[k][1] < upto[k - 1][1] - 1) { segs2.push(seg2); seg2 = []; } seg2.push(upto[k]); }
          segs2.push(seg2);
          for (const sg of segs2) sA.path(sg, { color: 'accent', width: 2.4 });
          sA.dot(t, clampTo(Vt[n], -5.9, 5.9), { r: 6, color: 'gold' });
          for (const sp of R.spikes) sA.line(sp, 5.2, sp, 6, { color: 'accent', width: 1.5 });
          // circle
          const th = R.th[n];
          sB.curve((a) => [Math.cos(a), Math.sin(a)], -Math.PI, Math.PI, { color: 'muted', width: 2 });
          if (R.i < 0) { const c = (1 + R.i) / (1 - R.i), a = Math.acos(c); sB.dot(Math.cos(a), Math.sin(a), { r: 6, color: 'red', hollow: true, label: 'threshold', labelPos: 'ne' }); sB.dot(Math.cos(a), -Math.sin(a), { r: 6, color: 'green', label: 'rest', labelPos: 'se' }); }
          sB.text('spike (θ = π)', -1.12, 0, { size: 11, color: 'muted', align: 'right' });
          sB.arrow(0, 0, Math.cos(th), Math.sin(th), { color: 'accent', width: 1.6 });
          sB.dot(Math.cos(th), Math.sin(th), { r: 7, color: 'gold' });
          sB.text('θ', 0, 0, { size: 12, color: 'ink', dy: 12, align: 'center', math: true });
          // parabola
          sC.fn((x) => x * x + R.i, { color: 'orange', width: 2.2 });
          sC.hline(0, { color: 'ink', width: 1 });
          if (R.i < 0) { const a = Math.sqrt(-R.i); sC.dot(-a, 0, { r: 6, color: 'green' }); sC.dot(a, 0, { r: 6, color: 'red', hollow: true }); }
          const Vc = clampTo(Vt[n], -3.95, 3.95); sC.dot(Vc, Vc * Vc + R.i, { r: 6, color: 'gold' });
          v._r = R;
        }, { period: TEND, still: 5 });
        v.legend([['accent', '$V(t)$ with cutoff and reset'], ['muted', 'no cutoff (blows up)', { dash: true }], ['orange', '$V^2+I$']]);
        v.readout(() => {
          const R = v._r; if (!R) return '';
          const T = R.spikes.length > 1 ? (R.spikes[R.spikes.length - 1] - R.spikes[0]) / (R.spikes.length - 1) : NaN;
          if (R.i <= 0) return String.raw`$I=${v.fix(R.i, 2)}\le 0$: ${R.i < 0 ? String.raw`equilibria at $V=\pm${v.fix(Math.sqrt(-R.i), 3)}$; started above the unstable one, the voltage escapes and resets; below it, it settles at rest.` : 'the two equilibria have merged at $V=0$ (saddle-node).'} Spikes in this window: ${R.spikes.length}`;
          const a = Math.sqrt(R.i);
          return String.raw`simulated interspike interval $${v.fix(T, 3)}$ · exact for cutoff $V_p=${cut.value}$: $\tfrac{2}{\sqrt I}\arctan(V_p/\sqrt I)=${v.fix((2 / a) * Math.atan(cut.value / a), 3)}$ · infinite cutoff: $\pi/\sqrt I=${v.fix(Math.PI / a, 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Bursting by fast–slow dissection',
      statement: String.raw`Fast–slow bursting alternates groups of spikes with relatively quiet intervals through interacting fast and slow dynamics, $\dot x=F(x,z)$ and $\dot z=\epsilon G(x,z)$. **Dissection** freezes z and analyzes the resulting fast system, then compares its resting/spiking regimes with the evolving full trajectory. Having a small ε or a slow outward current alone does not guarantee bursting: the feedback must carry the trajectory between appropriate regimes, and tonic firing or rest can result instead. Here a chosen Morris–Lecar extension adds $I_{KCa}=g_{KCa}z(V-E_K)/(1+z)$ and $\dot z=\epsilon(-\mu I_{Ca}-z)$. z is a nonnegative scaled calcium-like model variable, not a measured concentration.`,
      idea: String.raw`Inward calcium current can increase the slow variable; its outward potassium conductance then opposes spiking. The leakage term removes z, so its sign of change is determined by the balance −μICa−z, not solely by whether the membrane is resting or spiking. Calcium activation remains nonzero at rest in this model. Frozen-z equilibrium branches and observed spiking extrema help explain the switching geometry. Classifying a cycle termination as a homoclinic bifurcation or proving divergent period requires additional continuation/global analysis; finite launches here do not establish that classification. The underlying dissection framework follows Izhikevich’s complete author treatment, while this specific extension and its constants are atlas choices.`,
      caption: String.raw`Play or restart eight seconds after a fixed 12-second warm-up. Voltage, z and the projected (z,V) trajectory share an actual time marker. The frozen-z diagram covers the full z range reached by the selected run; equilibria are classified by their two-dimensional Jacobian. Blue bounds appear only when one 1500 ms frozen launch has at least three upward crossings after 750 ms and sampled voltage range greater than 8 mV. Gaps remain gaps. Changing input can lead to rest, clustered spikes or tonic activity, and changing ε can alter both timing and regime.`,
      scope: String.raw`Chosen model: the fold-example Morris–Lecar values in neuro-3.6, but φ=.23/ms, gKCa=.5mS/cm², μ=.02 in the chosen z/current units and the selected ε and I. Initial state before warm-up is V=−50,w=w∞(−50),z=.1. Numerical dt=.25ms; every eighth state is plotted, but all upward zero-voltage events are counted at integration resolution. The warm-up is not a proof of a settled attractor. Spike groups use an explicit gap greater than 250 ms; this heuristic can include single spikes and boundary-cut groups and is not a bifurcation classification. Frozen-cycle bounds depend on one initial condition and finite observation; a missing branch does not exclude another attractor or a slower cycle. No biological parameter fit or monotonic spikes-per-burst law is asserted.`,
      deps: ['neuro-3.6'],
      see: ['neuro-3.5', 'neuro-3.9'],
      refs: ['Izhikevich, Dynamical Systems in Neuroscience (2007), complete §9.1.2 printed329–331 and §9.2.1–9.2.2 printed336–339, Eq.(9.1), Figs.9.6 and9.11–9.13: https://izhikevich.org/publications/dsn.pdf'],
      tags: ['bursting', 'fast–slow'],
      credit: 'Fast–slow dissection follows the complete cited author treatment; the displayed calcium-like extension, parameter choices and grouping protocol are specified atlas illustrations.',
      verify: false,
      viz(v) {
        const eps=v.slider('slow rate $\\epsilon$',.0003,.003,.001,{log:true,sig:2,fmt:x=>x.toFixed(4)}),Isl=v.slider('current $I$',44,60,50,{step:.5,fmt:x=>`${x} µA/cm²`}),TEND=8000;
        const sA=v.stage({x:[0,TEND],y:[-60,30],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'V (mV)',height:240,weight:1.3,minWidth:340}),sZ=v.stage({x:[0,TEND],y:[.4,1.1],axes:'box',gutter:true,xlabel:'t (ms)',ylabel:'slow z',height:170,weight:1.3,minWidth:340}),sB=v.stage({x:[.3,1.2],y:[-45,22],axes:'box',gutter:true,xlabel:'frozen slow variable z',ylabel:'V (mV)',height:420,weight:1,minWidth:320});let key='',D=null;
        const get=()=>{const k=JSON.stringify([eps.value,Isl.value]);if(k===key)return D;key=k;const p={...BURST,eps:eps.value,I:Isl.value},R=burstRecorded(p),zs=R.rec.map(q=>q[2]),lo=Math.min(.3,...zs),hi=Math.max(1.2,...zs),pad=.04*(hi-lo),zlim=[Math.max(0,lo-pad),hi+pad],slices=Array.from({length:49},(_,j)=>burstFastSlice(p,zlim[0]+(zlim[1]-zlim[0])*j/48));return D={p,R,zlim,slices};};
        v.animate(tsec=>{const D=get(),{R,slices,zlim}=D,t=(tsec%8)*1000,n=Math.min(R.rec.length-1,Math.round(t/2)),volts=[...R.rec.map(q=>q[0]),...slices.flatMap(q=>q.eq.map(e=>e.V)),...slices.flatMap(q=>q.cycle?[q.cycle.lo,q.cycle.hi]:[])],vlim=[Math.min(-45,...volts)-2,Math.max(22,...volts)+2];sA.setView([0,TEND],vlim);sZ.setView([0,TEND],zlim);sB.setView([Math.max(0,zlim[0]-.02*(zlim[1]-zlim[0])),zlim[1]+.02*(zlim[1]-zlim[0])],vlim);
          for(const[s,component,color]of[[sA,0,'accent'],[sZ,2,'purple']]){s.path(R.rec.map((q,j)=>[R.t[j],q[component]]),{color,width:1.2,alpha:.35});s.path(R.rec.slice(0,n+1).map((q,j)=>[R.t[j],q[component]]),{color,width:2});s.dot(R.t[n],R.rec[n][component],{r:5,color:'gold'});}
          for(const q of slices)for(const e of q.eq)sB.dot(q.z,e.V,{r:2.2,color:e.type==='stable'?'green':e.type==='saddle'?'ink':'red',hollow:e.type!=='stable'});for(const bound of['lo','hi'])sB.path(slices.map(q=>q.cycle?[q.z,q.cycle[bound]]:null),{color:'blue',width:2});sB.path(R.rec.slice(0,n+1).map(q=>[q[2],q[0]]),{color:'gold',width:1.2,alpha:.8});sB.dot(R.rec[n][2],R.rec[n][0],{r:6,color:'gold'});v._r={D,n};
        },{period:8,still:3.4});
        v.legend([['accent','voltage'],['purple','scaled z'],['green','stable frozen equilibrium',{dot:true}],['ink','saddle',{dot:true}],['red','unstable frozen equilibrium',{dot:true}],['blue','observed frozen spiking extrema'],['gold','full projected trajectory',{dot:true}]]);
        v.readout(()=>{const r=v._r;if(!r)return'';const{R,slices}=r.D,interior=R.groups.slice(1,-1),avg=interior.length?interior.reduce((s,g)=>s+g.length,0)/interior.length:null;return`Now t=${v.fix(R.t[r.n],0)}ms, V=${v.fix(R.rec[r.n][0],3)}mV, z=${v.fix(R.rec[r.n][2],4)}. Fixed warm-up 12000 ms; observation 8000 ms: ${R.sp.length} upward crossings in ${R.groups.length} groups under the 250 ms gap rule.`+'\n'+`${interior.length} interior groups; mean spikes/group ${avg===null?'unavailable':v.fix(avg,3)}. Boundary groups are excluded from that mean. z range [${v.fix(Math.min(...R.rec.map(q=>q[2])),4)},${v.fix(Math.max(...R.rec.map(q=>q[2])),4)}]; ${slices.filter(q=>q.cycle).length}/${slices.length} frozen launches pass the displayed finite spiking criterion.`;});
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Izhikevich simple model',
      statement: String.raw`Izhikevich’s two-variable hybrid model is $$\dot v=0.04v^2+5v+140-u+I,\qquad\dot u=a(bv-u),\qquad v=30:\ (v,u)\leftarrow(c,u+d).$$ The paper uses scaled variables, with $v$ on an mV scale and time on an ms scale; $u$ and the input $I$ are model quantities, not independently calibrated ionic currents. Its Fig. 2 gives regular spiking $(.02,.2,-65,8)$, intrinsically bursting $(.02,.2,-55,4)$, chattering $(.02,.2,-50,2)$, fast spiking $(.1,.2,-65,2)$ and low-threshold spiking $(.02,.25,-65,2)$. Those labels describe the source’s chosen parameter/current examples, not every edited setting.`,
      idea: String.raw`The quadratic voltage feedback promotes spike initiation; the threshold event ends the continuous flow, resets voltage to $c$ and increments recovery by exactly $d$. Recovery also changes continuously between spikes, so successive reset values of $u$ do not in general differ by $d$. Parameter $c$ is an absolute reset voltage on the model’s scale, not a ratio to threshold. Fast-spiking examples show little adaptation rather than an exact zero-adaptation theorem. The model summarizes firing patterns without specifying channel kinetics, spike downstroke or a physical capacitance/current calibration.`,
      caption: String.raw`The step switches from 0 to the chosen $I$ at 20 ms. Choose a source preset, edit its parameters or refine the numerical step. The voltage and recovery traces show each threshold/reset pair at the same event time. In the phase plane, continuous trajectories end at the threshold; gold dots are the **actual reset states**$(c,u_{\rm before}+d)$, with no artificial flow across the reset. Grey trajectory portions precede the input step; blue portions follow it. Nullclines use the post-step input and are drawn only where they intersect the displayed phase window. Spike counts before and after the step are separate.`,
      scope: String.raw`Qualitative single-cell hybrid model, with $v(0)=-65$ and $u(0)=bv(0)$ as in the source network initialization. The paper’s Fig. 2 uses input 10 and time resolution 0.1 ms; its §IV network code uses a different split-Euler scheme. Here RK4 flow with bracketed threshold/reset events approximates the continuous equations, and the resolution control permits a finite convergence check. Such checks do not certify all trajectories or make this a quantitatively fitted cortical neuron.`,
      deps: ['neuro-3.7'],
      see: ['neuro-3.8', 'neuro-3.2'],
      refs: ['Izhikevich (2003), Simple Model of Spiking Neurons, complete original authorPDF, §II Eqs.(1)–(3) printed 1569; Fig. 2/§III 1570; scale/limitations and implementation 1571: https://www.izhikevich.org/publications/spikes.pdf'],
      tags: ['phenomenological model', 'firing patterns'],
      credit: 'E. M. Izhikevich, 2003 (IEEE Trans. Neural Netw. 14: 1569–1572)',
      links: { doi: 'https://doi.org/10.1109/TNN.2003.820440' },
      verify: false,
      viz(v) {
        const names=['RS','IB','CH','FS','LTS'];
        const load=()=>{const q=IZH[type.value];a.set(q.a);b.set(q.b);c.set(q.c);d.set(q.d);};
        const type=v.select('source preset',names.map(k=>({value:k,label:k})),'RS',{onChange:load});
        const Ia=v.slider('step input I (model units)',0,25,10,{step:.5});
        const a=v.slider('a',.01,.12,.02,{step:.001}),b=v.slider('b',.15,.3,.2,{step:.005}),c=v.slider('reset c (mV scale)',-70,-45,-65,{step:1}),d=v.slider('recovery jump d',0,10,8,{step:.1});
        const res=v.select('maximum numerical step',[.1,.05,.025].map(x=>({value:x,label:x+' ms'})),.1);
        const sA=v.stage({x:[0,400],y:[-80,35],axes:'box',gutter:true,xlabel:'t (ms scale)',ylabel:'v (mV scale)',height:230,weight:1.3,minWidth:340});
        const sU=v.stage({x:[0,400],y:[-20,15],axes:'box',gutter:true,xlabel:'t (ms scale)',ylabel:'scaled recovery u',height:180,weight:1.3,minWidth:340});
        const sP=v.stage({x:[-80,35],y:[-20,15],axes:'box',gutter:true,xlabel:'v (mV scale)',ylabel:'scaled recovery u',height:410,weight:1,minWidth:300});
        let key='',O=null,info={};
        v.render(()=>{
          const p={a:a.value,b:b.value,c:c.value,d:d.value},I=Ia.value,dt=Number(res.value),k=JSON.stringify([p,I,dt]);if(k!==key){O=izhHybrid(p,I,{dt});key=k;}
          const vs=O.records.map(q=>q.v),us=O.records.map(q=>q.u),vlim=[Math.min(-75,...vs)-4,35],ulow=Math.min(...us),uhi=Math.max(...us),pad=Math.max(2,.12*(uhi-ulow)),ulim=[ulow-pad,uhi+pad];
          sA.setView([0,400],vlim);sU.setView([0,400],ulim);sP.setView(vlim,ulim);
          sA.rect(20,vlim[0],400,vlim[0]+.035*(vlim[1]-vlim[0]),{fill:'gold',fillAlpha:.4,stroke:false});
          sA.path(O.records.map(q=>[q.t,q.v]),{color:'accent',width:1.7});sU.path(O.records.map(q=>[q.t,q.u]),{color:'purple',width:1.8});
          clippedQuadratic(I,vlim,ulim).forEach(P=>sP.path(P,{color:'orange',width:2}));const line=clippedLinear(p.b,vlim,ulim);if(line.length)sP.path(line,{color:'purple',width:2});
          for(const seg of O.segments){const before=seg.filter(q=>q.t<=20),after=seg.filter(q=>q.t>=20);if(before.length>1)sP.path(before.map(q=>[q.v,q.u]),{color:'muted',width:1.2});if(after.length>1)sP.path(after.map(q=>[q.v,q.u]),{color:'accent',width:1.4});}
          O.events.forEach(e=>sP.dot(e.post[0],e.post[1],{r:2.8,color:'gold'}));sP.vline(30,{color:'muted',dash:true,width:1});sP.vline(p.c,{color:'gold',dash:true,width:1});sP.text('reset voltage c',p.c,ulim[1]-.07*(ulim[1]-ulim[0]),{align:'center',color:'gold',size:11});
          const post=O.events.filter(e=>e.t>=20),pre=O.events.length-post.length,isis=post.slice(1).map((e,j)=>e.t-post[j].t),q=IZH[type.value],edited=Object.keys(p).some(k=>p[k]!==q[k]);info={p,I,dt,post,pre,isis,edited,last:O.events.at(-1)};
        });
        v.legend([['accent','post-input continuous flow / voltage'],['muted','pre-input flow'],['gold','actual reset states',{dot:true}],['orange','voltage nullcline at post-step input'],['purple','recovery / recovery nullcline']]);
        v.readout(()=>`${IZH[type.value].name}${info.edited?' (parameters edited; source pattern not guaranteed)':''}: ${info.pre} spikes before 20 ms, ${info.post.length} after 20 ms over the next 380 ms. ${info.isis.length?`Post-input intervals: first ${v.fix(info.isis[0],3)} ms, shortest ${v.fix(Math.min(...info.isis),3)}, last ${v.fix(info.isis.at(-1),3)}.`:'Fewer than two post-input spikes: interval unavailable.'}\nMaximum numerical step ${info.dt} ms; threshold events are localized within that approximation.${info.last?` Last reset: v=${v.fix(info.last.post[0],2)}, u before=${v.fix(info.last.pre[1],4)}, u after=${v.fix(info.last.post[1],4)} (jump d=${v.fix(info.p.d,3)}).`:' No threshold/reset event occurred.'}`);
      },
    },
  ],
};
