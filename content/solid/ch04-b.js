// Solid Mechanics & Structures — Chapter 4, part b (items 4.6–4.10): residual stress, fatigue (S–N, Miner, Goodman), plastic collapse
//
// Fatigue forms reviewed against the COMSOL Fatigue Module 6.3 authored implementation documentation.
// All fatigue strengths and simulated scatter here are chosen illustrations, not fitted alloy data.
// Limit theorems are reviewed against the authored Bower derivations (4.10).

import {collapseStatic,collapseMechanism} from './source-audit-collapse.js';

import { num as num0, rad, SN, cyc, curveOf } from './ch04.shared.js';
import {fatigueSlope,fatigueStress,fatigueLife,fatigueBatch,minerBlocks,meanStressBoundary,meanStressState} from './source-audit-fatigue.js';

const num = (x, d = 1) => num0(x, d).replace('-', '−');
void curveOf;

export default {
  collection: 'solid',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Residual stresses after plastic loading',
      statement: String.raw`Let a structure in which different parts are forced to deform together (a statically indeterminate set of bars, a beam, a plate with a hole) be loaded so that some parts yield and others stay elastic, and then be completely unloaded. Unloading is elastic and linear (4.5), so the stresses after unloading are the stresses at the peak load **minus** the purely elastic response to the same load. They do not vanish: the **residual stresses** form a self-equilibrated field (zero resultant force and moment), and they are opposite in sign to the plastic strains that caused them: the parts that yielded in tension are left in compression, the elastic parts in tension.`,
      idea: String.raw`Compatibility (1.10) forces all bars to share one strain, and equilibrium fixes the total force. Beyond first yield the bars that yielded carry the constant force $\sigma_yA$ and the elastic ones carry the rest. On unloading every bar recovers along a line of slope $E$ (4.5) by the *same* strain, so the stress drop is the same in all bars of equal stiffness, but they started from different stresses; the differences remain. As long as no bar yields again in reverse, residual $=$ peak $-$ elastic solution, and the sum of the forces is still zero.`,
      caption: String.raw`Three bars of equal area and stiffness connect two rigid plates; the two outer bars yield at $250$ MPa and the centre bar (a stronger alloy) at $450$ MPa. Pull to a peak strain (in units of the outer bars' yield strain) and then reduce the load with the second slider: at $0\%$ load the bars are left with locked-in stresses although nothing pulls on them (blue tension, red compression). The plot shows each bar's path in the $\sigma$–$\varepsilon$ plane. Pull to less than $\varepsilon_y$ and nothing is left over; pull far enough and the centre bar yields too and the residual stresses change again.`,
      deps: ['solid-4.5', 'solid-1.10'],
      refs: ['Gere–Goodno §2.12'],
      tags: ['plasticity', 'residual stress'],
      scope: String.raw`Rate-independent elastic–perfectly plastic bars with a common Young's modulus, small strains, no reverse yielding unless the plot shows it. The syllabus sketch (three bars of unequal length) is replaced by three equal-length bars of different strength: the mechanism (an elastic part forced to carry the unloading of a plastically deformed part) is the same.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Residual_stress' },
      viz(v) {
        const E = 200000, Ar = 200, ys = [250, 450, 250], ey = 250 / E, cols = ['orange', 'accent', 'orange'];
        const pk = v.slider('peak strain $\\varepsilon_{\\max}/\\varepsilon_y$', 0, 3.5, 2.2, { step: 0.05 });
        const lam = v.slider('load as % of the peak load', 0, 100, 0, { step: 1 });
        const A = v.stage({ x: [-3.2, 3.2], y: [-1.1, 5.2], equal: true, axes: false, height: 380, title: 'three bars between rigid plates' });
        const B = v.stage({ x: [-0.4, 4], y: [-520, 520], axes: 'box', gutter: true, height: 380, xlabel: 'ε/εy', ylabel: 'σ (MPa)', title: 'σ–ε path of each bar' });
        v.legend([['orange', 'outer bars (σy = 250 MPa)'], ['accent', 'centre bar (σy = 450 MPa)']]);
        const F = (sg) => (sg[0] + sg[1] + sg[2]) * Ar / 1000; // kN
        const upd = (sg, de) => sg.map((s, i) => Math.max(-ys[i], Math.min(ys[i], s + E * de)));
        function run(p, l) {
          let sg = [0, 0, 0], e = 0; const h = [[[0, 0]], [[0, 0]], [[0, 0]]], de = 0.01 * ey, push = () => sg.forEach((s, i) => h[i].push([e / ey, s]));
          while (e < p * ey - 1e-12) { const st = Math.min(de, p * ey - e); sg = upd(sg, st); e += st; push(); }
          const Fp = F(sg), tg = (l / 100) * Fp, sgp = sg.slice(); let g = 0;
          while (F(sg) > tg + 1e-9 && g++ < 3000) {
            const s2 = upd(sg, -de), F1 = F(sg), F2 = F(s2);
            if (F2 <= tg) { const t = (F1 - tg) / (F1 - F2); sg = sg.map((s, i) => s + t * (s2[i] - s)); e -= t * de; push(); break; }
            sg = s2; e -= de; push();
          }
          return { sg, e, h, Fp, sgp };
        }
        let R = run(pk.value, lam.value);
        v.render(() => {
          R = run(pk.value, lam.value);
          const { sg, e, h } = R, top = 4 + 0.3 * (e / ey);
          A.rect(-2.6, 4, 2.6, 4.45 + 0.3 * (e / ey), { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.35 });
          A.rect(-2.6, -0.45, 2.6, 0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.35 });
          const xs = [-1.6, 0, 1.6];
          sg.forEach((s, i) => {
            const t = Math.min(1, Math.abs(s) / ys[i]);
            A.rect(xs[i] - 0.4, 0, xs[i] + 0.4, top, { color: Math.abs(s) >= ys[i] - 1e-6 ? 'ink' : 'muted', width: Math.abs(s) >= ys[i] - 1e-6 ? 3 : 1.2, fill: s >= 0 ? 'accent' : 'red', fillAlpha: 0.08 + 0.5 * t });
            A.text(`${num(s, 0)} MPa`, xs[i], -0.85, { size: 12, color: s >= 0 ? 'accent' : 'red', align: 'center' });
            A.text(i === 1 ? 'strong bar' : 'bar', xs[i], 2, { size: 11, color: 'ink', align: 'center' });
          });
          const P = F(sg), pl = lam.value / 100;
          if (P > 1) { A.arrow(0, top + 0.5, 0, top + 0.5 + Math.min(0.9, P / 150), { color: 'gold', width: 4 }); }
          A.text(`load ${num(P, 1)} kN`, 0, top + 1.8, { size: 12, color: 'ink', align: 'center' });
          void pl;
          B.hline(0, { color: 'faint', width: 1 });
          [0, 1].forEach((i) => B.path(h[i], { color: cols[i], width: 2.6 }));
          [0, 1].forEach((i) => B.dot(e / ey, sg[i], { r: 6, color: cols[i] }));
          B.vline(Math.max(0, e / ey), { color: 'muted', width: 1, dash: [4, 4] });
        });
        v.readout(() => {
          const { sg, sgp, e } = R, P = F(sg), p = pk.value;
          const elastic = p <= 1.8, mean = (2 * 250 + 250 * p) / 3;
          const th = elastic && p >= 1 && lam.value === 0 ? ` · Theory (centre still elastic at the peak): outer $=250-\\tfrac13(500+250\\,\\varepsilon_{\\max}/\\varepsilon_y)=${num(250 - mean, 1)}$, centre $=${num(250 * p - mean, 1)}$ MPa.` : '';
          return `Stresses (outer, centre, outer): $(${num(sg[0], 1)},\\,${num(sg[1], 1)},\\,${num(sg[2], 1)})$ MPa at peak $(${num(sgp[0], 0)},\\,${num(sgp[1], 0)},\\,${num(sgp[2], 0)})$; strain $${num(e / ey, 2)}\\,\\varepsilon_y$. · Equilibrium: load $\\sum A\\sigma_i=${num(P, 3)}$ kN${lam.value === 0 ? ' — the bars carry no external load, yet the stresses above are not zero, and sum to zero' : ''}.${th}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Fatigue: S–N curves and the endurance limit',
      statement: String.raw`An S–N curve relates constant stress amplitude $S=(\sigma_{\max}-\sigma_{\min})/2$ to cycles to fatigue failure. In the high-cycle regime, a Basquin model is $S=\sigma_f'(2N)^b$, with $b<0$: $N$ counts full cycles, while $2N$ counts reversals. A straight segment on log–log axes can be joined to a horizontal endurance plateau. Other idealisations keep decreasing. These are models for specified loading and material conditions, rather than a guarantee that any metal below a particular amplitude lasts forever.`,
      idea: String.raw`On a power-law segment, reducing the amplitude multiplies the predicted life. The slope and an anchor determine that multiplier. A plateau instead assigns no finite fatigue life below its threshold within the idealised model. In an actual test, surviving to a stopping time is a **run-out**: an observation censored at that time, not a measured failure life or proof of unlimited life. Stresses above the top of the supplied high-cycle curve need another model; this picture leaves that life undefined.`,
      caption: String.raw`Choose a material-like parameter set and a stress amplitude. The dots are ten **artificial specimens**, with a chosen normal scatter of $0.25$ decades in log life; Resample changes the seeded draw. Hollow dots and arrows denote tests stopped at $10^7$ cycles for the steel-like set or $10^9$ for the aluminium-like set, including late simulated lives for either set. Above the curve's top stress there is no life estimate or simulated batch. The right panel shows the fully reversed cycle, $\sigma=S\sin(2\pi t)$.`,
      deps: ['solid-1.3'],
      refs: ['COMSOL Fatigue Module 6.3, Stress Life Models; Cycle Cutoff', 'NIST/SEMATECH e-Handbook §8.1.3.1, Type I right censoring'],
      tags: ['fatigue', 'S-N curve'],
      scope: String.raw`Uniaxial, fully reversed loading ($R=-1$); chosen smooth-specimen models, not measurements or a fit to a named alloy. Both curves pass through $(10^3,0.9S_u)$ and $(N_k,S_e)$. The steel-like set uses $S_u=490$ MPa, $S_e=245$ MPa, $N_k=10^6$ and a plateau. The aluminium-like set uses $S_u=310$ MPa, $S_e=93$ MPa, $N_k=5\times10^8$ and a continuing power law. The stress-life construction does not evaluate plastic deformation; a chosen curve value is not evidence of elastic behaviour at that stress. The scatter is chosen for demonstration and does not quantify reliability.`,
      verify: false,
      links: { source: 'https://doc.comsol.com/6.3/doc/com.comsol.help.fatigue/fatigue_ug_sme.4.20.html', wikipedia: 'https://en.wikipedia.org/wiki/S-N_curve' },
      viz(v) {
        const mat = v.select('chosen parameter set', [{value:'steel',label:'steel-like'}, {value:'al',label:'aluminium-like'}], 'steel');
        const Sa = v.slider('stress amplitude $S$ (MPa)',80,440,300,{step:1});
        let seed=7, info;
        v.button('Resample',()=>{seed++;});
        const A=v.stage({x:[500,2e9],y:[0,480],xlog:true,axes:'box',gutter:true,height:380,xlabel:'cycles N',ylabel:'stress amplitude S (MPa)',title:'chosen S–N model and artificial specimens'});
        const B=v.stage({x:[0,4],y:[-480,480],axes:'box',gutter:true,height:380,xlabel:'time (cycles)',ylabel:'σ (MPa)',title:'fully reversed loading',xticks:[0,1,2,3,4]});
        v.legend([['accent','chosen S–N curve'],['gold','simulated failure',{dot:true}],['muted','run-out at test stop',{dot:true}]]);
        const batch=()=>{const m=SN[mat.value],r=v.rng(seed*1000+Math.round(Sa.value));return fatigueBatch(m,Sa.value,Array.from({length:10},()=>r.normal()),m.limit?1e7:1e9);};
        v.render(()=>{
          const m=SN[mat.value],S=Sa.value,t=batch();
          const minimum=Math.min(500,...t.specimens.map(o=>o.N*.7));
          A.setView([minimum,2e9],[0,480]);
          A.fn(N=>fatigueStress(m,N),{color:'accent',width:3,domain:[1e3,1e9],n:400});
          if(m.limit){A.hline(m.Se,{color:'muted',width:1,dash:[5,4]});A.text(`chosen plateau ${m.Se} MPa`,8e8,m.Se+14,{size:12,color:'muted',align:'right'});}
          else {A.dot(m.Nk,m.Se,{r:4,color:'muted',hollow:true});A.text('chosen anchor at 5·10⁸ cycles',4e8,m.Se-28,{size:12,color:'muted',align:'right'});}
          A.hline(S,{color:'gold',width:1.2,dash:[4,4]});
          t.specimens.forEach(o=>{A.dot(o.N,S,{r:5.5,color:o.censored?'muted':'gold',hollow:o.censored});if(o.censored)A.arrow(o.N*1.08,S,o.N*1.45,S,{color:'muted',width:1.4,head:6});});
          if(t.kind==='outside')A.text('above supplied curve: life undefined',2e4,450,{size:12,color:'red',align:'left'});
          B.fn(x=>S*Math.sin(2*Math.PI*x),{color:'gold',width:2.4,domain:[0,4],n:240});
          info={material:mat.value,amplitude:S,...t};
        });
        v.readout(()=>{
          const m=SN[mat.value],t=batch(),failed=t.specimens.filter(o=>!o.censored),run=t.specimens.length-failed.length;
          const life=t.kind==='outside'?`**life undefined** above the supplied top stress $0.9S_u=${num(.9*m.Su,0)}$ MPa`:t.kind==='plateau'?`no finite fatigue failure assigned by the chosen plateau ($S_e=${m.Se}$ MPa)`:`chosen median life $N=${cyc(t.N)}$ cycles`;
          return `$S=${Sa.value}$ MPa: ${life}. ${t.specimens.length?`Artificial batch: ${failed.length} simulated failures, ${run} run-outs; stop $N=${cyc(t.stop)}$ cycles. `:''}A run-out records survival only to the stopping time. Power-law slope $b=${num(fatigueSlope(m),4)}$; neither the parameters nor the scatter are test data.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Law',
      name: 'Miner’s rule for cumulative damage',
      statement: String.raw`For cycle bins containing $n_i$ cycles at amplitudes with constant-amplitude lives $N_i$, the linear Palmgren–Miner model assigns
$$D=\sum_i n_i/N_i.$$
Its fatigue threshold is $D=1$. Reordering **the same cycles** leaves this sum unchanged. A bin assigned unlimited life by an idealised endurance plateau contributes zero; a bin outside the supplied S–N range has undefined damage rather than an invented life estimate.`,
      idea: String.raw`Each cycle at amplitude $S_i$ contributes the fixed increment $1/N_i$. Adding these increments gives the same final sum after any permutation. The trajectory against elapsed cycles can change because the increment differs between amplitudes, and the first crossing of $D=1$ can occur at a different time. That does not make the final sum sequence-dependent. The rule omits experimentally observed history effects; it is an accounting model, not a crack-growth simulation.`,
      caption: String.raw`The two amplitudes are called A and B, so they can cross or be equal. Share $f$ allocates the planned damage to A; total usage $q$ fixes cycle counts $n_A=qfN_A$ and $n_B=q(1-f)N_B$. **Both orders use these identical counts.** Left: the two accumulated-damage histories. Right: the same contributions stacked in each order. The complete planned history is shown even past the model threshold; a dot marks its first crossing when reached. Set $q<1$, $q=1$, or $q>1$ to compare cases.`,
      deps: ['solid-4.7'],
      refs: ['COMSOL Fatigue Module 6.3, Cumulative Damage Model, equation (3-3)'],
      tags: ['fatigue','damage'],
      scope: String.raw`Two fully reversed, constant-amplitude blocks on the finite-life branch of the chosen steel-like S–N model in 4.7. Fractional cycle counts make the accounting continuous. This demonstration uses no nonlinear history law and gives no empirical uncertainty bound. The simple sum does not represent mean-stress changes, overload interactions, or crack evolution.`,
      verify: false,
      links: {source:'https://doc.comsol.com/6.3/doc/com.comsol.help.fatigue/fatigue_ug_sme.4.25.html',wikipedia:'https://en.wikipedia.org/wiki/Fatigue_(material)#Miner%27s_rule'},
      viz(v) {
        const Sa=v.slider('block A amplitude $S_A$ (MPa)',260,440,380,{step:1});
        const Sb=v.slider('block B amplitude $S_B$ (MPa)',260,440,290,{step:1});
        const share=v.slider('share $f$ allocated to A',0,1,.5,{step:.01});
        const usage=v.slider('total planned usage $q$',0,1.8,1,{step:.01});
        const A=v.stage({x:[0,1e6],y:[-.06,1.95],axes:'box',gutter:true,height:380,xlabel:'elapsed cycles n',ylabel:'accumulated Miner damage D',title:'the same cycle blocks in two orders'});
        const B=v.stage({x:[-.35,2.35],y:[-.06,1.95],axes:'box',gutter:true,height:380,xlabel:'order',ylabel:'damage contribution',title:'identical final sum',xticks:[[.5,'A → B'],[1.5,'B → A']]});
        v.legend([['red','block A'],['accent','block B'],['muted','threshold D = 1',{dash:true}]]);
        let info;
        v.render(()=>{
          const NA=fatigueLife(SN.steel,Sa.value).N,NB=fatigueLife(SN.steel,Sb.value).N,q=minerBlocks(NA,NB,share.value,usage.value);
          A.setView([0,Math.max(1,q.ab.total)*1.08],[-.06,1.95]);
          const tick=n=>n>=1e5?`${num(n/1e5,1)}×10⁵`:n>=1e3?`${num(n/1e3,1)}k`:num(n,1);
          A.setTicks(q.ab.total>0?[0,.25,.5,.75,1].map(f=>[f*q.ab.total,tick(f*q.ab.total)]):[[0,'0']]);
          A.hline(1,{color:'muted',width:1.2,dash:[5,4]});B.hline(1,{color:'muted',width:1.2,dash:[5,4]});
          [q.ab,q.ba].forEach((seq,i)=>{
            seq.blocks.forEach((block,j)=>{
              const color=block.key==='A'?'red':'accent';
              A.line(...seq.points[j],...seq.points[j+1],{color,width:i?1.7:3.5,dash:i?[5,4]:undefined});
              B.rect(.16+i,block.before,.84+i,block.before+block.increment,{color,width:1.2,fill:color,fillAlpha:.45});
            });
            if(seq.crossing!==null)A.dot(seq.crossing,1,{r:i?4.5:7,color:i?'accent':'red',hollow:!!i});
            B.text(`D = ${num(seq.damage,2)}`,.5+i,seq.damage+.055,{size:12,color:'ink',align:'center'});
          });
          A.text('solid A → B; dashed B → A',Math.max(1,q.ab.total)*.97,1.85,{size:12,color:'muted',align:'right'});
          info={amplitudeA:Sa.value,amplitudeB:Sb.value,share:share.value,usage:usage.value,NA,NB,...q};
        });
        v.readout(()=>{
          const {NA,NB,nA,nB,ab,ba}=info,fmt=n=>n===null?'not reached':`$n=${cyc(n)}$ cycles`;
          return `$N_A=${cyc(NA)}$, $N_B=${cyc(NB)}$; **the same blocks in both orders:** $n_A=${cyc(nA)}$, $n_B=${cyc(nB)}$ cycles. Final usage: A→B $D=${num(ab.damage,3)}$, B→A $D=${num(ba.damage,3)}$; planned duration $${cyc(ab.total)}$ cycles. First $D=1$ crossing: A→B ${fmt(ab.crossing)}; B→A ${fmt(ba.crossing)}. ${usage.value>1?'The remaining planned cycles are an accounting extension beyond the model threshold.':'Reordering changes the path, while the final sum stays equal.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Law',
      name: 'Goodman relation for mean stress',
      statement: String.raw`For a uniaxial stress cycle, $\sigma_m=(\sigma_{\max}+\sigma_{\min})/2$ and $\sigma_a=(\sigma_{\max}-\sigma_{\min})/2\ge0$. At a specified fatigue life, a Goodman interaction joins the fully reversed strength $S_e$ to the ultimate tensile strength $S_u$:
$$\sigma_a/S_e+\sigma_m/S_u=1\qquad(\sigma_m\ge0).$$
Gerber uses $\sigma_a/S_e+(\sigma_m/S_u)^2=1$; Soderberg replaces $S_u$ by $S_y$. Along a proportional load ray, the safety factor $n$ is the positive multiplier taking $(\sigma_m,\sigma_a)$ to the selected boundary. A separate, symmetric uniaxial yield check is $|\sigma_m|+\sigma_a\le S_y$.`,
      idea: String.raw`The interactions specify different shapes for the allowable alternating strength as tensile mean stress increases. Substituting $(n\sigma_m,n\sigma_a)$ into a boundary gives its ray multiplier; Gerber requires solving a quadratic, not the reciprocal of its unscaled interaction value. Here compressive mean stress receives **no fatigue benefit**: all three curves use the flat level $S_e$ for $\sigma_m\le0$. This is a chosen extension. Yielding can still occur at the compressive end of such a cycle.`,
      caption: String.raw`Drag the operating point in the mean–amplitude plane. Green means it satisfies the **chosen Goodman and symmetric yield conditions**; red means it exceeds at least one. This is not a verified safe design. The red boundary includes tensile and compressive yielding. Toggles add the Gerber and Soderberg comparisons. The right panel expands to contain the complete stress cycle, with both yield limits. All material-like strengths are chosen values from 4.7; the aluminium-like $S_e$ is a finite-life reference at $5\times10^8$ cycles.`,
      deps: ['solid-4.7'],
      refs: ['COMSOL Fatigue Module 6.3, Mean Stress Correction'],
      tags: ['fatigue','mean stress'],
      scope: String.raw`Chosen uniaxial high-cycle interaction models, proportional scaling of mean and amplitude, equal tensile/compressive yield strengths, and no benefit from negative mean stress. No alloy-specific fit, scatter allowance, measured accuracy ranking, multiaxial fatigue criterion, or historical priority claim is supplied. At zero load the ray factors are unbounded.`,
      verify: false,
      links: {source:'https://doc.comsol.com/6.3/doc/com.comsol.help.fatigue/fatigue_ug_sme.4.28.html',wikipedia:'https://en.wikipedia.org/wiki/Goodman_relation'},
      viz(v) {
        const mat=v.select('chosen parameter set',[{value:'steel',label:'steel-like'},{value:'al',label:'aluminium-like'}],'steel');
        const showG=v.toggle('Gerber parabola',true),showS=v.toggle('Soderberg line',false);
        const A=v.stage({x:[-230,590],y:[-20,330],axes:'box',gutter:true,height:380,xlabel:'mean stress σm (MPa)',ylabel:'alternating stress σa (MPa)',title:'chosen mean-stress interactions'});
        const B=v.stage({x:[0,3],y:[-520,520],axes:'box',gutter:true,height:380,xlabel:'time (cycles)',ylabel:'σ (MPa)',title:'the complete stress cycle',xticks:[0,1,2,3]});
        const H=A.handle(180,90,{color:'gold',r:8,constrain:(x,y)=>[Math.max(-200,Math.min(560,x)),Math.max(0,Math.min(300,y))]});
        v.button('Zero load',()=>H.set(0,0));
        v.legend([['accent','Goodman'],['purple','Gerber'],['teal','Soderberg'],['red','symmetric yield |σ| = Sy']]);
        let info;
        v.render(()=>{
          const m=SN[mat.value],sm=H.x,sa=H.y,p=meanStressState(m,sm,sa);
          A.fn(x=>meanStressBoundary(m,x),{color:'accent',width:3,domain:[-200,m.Su],n:160,fill:true,base:0});
          if(showG.value)A.fn(x=>meanStressBoundary(m,x,'gerber'),{color:'purple',width:2.2,domain:[-200,m.Su],n:160});
          if(showS.value)A.fn(x=>meanStressBoundary(m,x,'soderberg'),{color:'teal',width:2.2,domain:[-200,m.Sy],n:160});
          // Clip the two finite yield segments to the displayed amplitude window.
          const left=Math.max(-200,-m.Sy),negRight=Math.min(0,300-m.Sy),posLeft=Math.max(0,m.Sy-300);
          if(left<=negRight)A.line(left,m.Sy+left,negRight,m.Sy+negRight,{color:'red',width:2.2});
          A.line(posLeft,m.Sy-posLeft,m.Sy,0,{color:'red',width:2.2});
          if(sm!==0||sa!==0){const ray=Math.min(sm>0?560/sm:sm<0?-200/sm:Infinity,sa>0?300/sa:Infinity);A.line(0,0,sm*ray,sa*ray,{color:'muted',width:1.2,dash:[4,4]});}
          H.color=p.admitted?'green':'red';
          A.text(`S_e = ${m.Se}`,-190,m.Se+14,{size:12,color:'muted',align:'left'});
          A.text('Su',m.Su,14,{size:12,color:'muted',align:'center'});
          const pad=Math.max(25,.08*(p.maximum-p.minimum));
          B.setView([0,3],[Math.min(-m.Sy-25,p.minimum-pad),Math.max(m.Sy+25,p.maximum+pad)]);
          B.fn(x=>sm+sa*Math.sin(2*Math.PI*x),{color:'gold',width:2.4,domain:[0,3],n:240});
          B.hline(sm,{color:'muted',width:1,dash:[4,4]});B.hline(0,{color:'faint',width:1});
          B.hline(m.Sy,{color:'red',width:1,dash:[5,4]});B.hline(-m.Sy,{color:'red',width:1,dash:[5,4]});
          info={material:mat.value,...p};
        });
        v.readout(()=>{
          const p=info,f=x=>Number.isFinite(x)?num(x,2):'\\infty';
          return String.raw`$\sigma_m=${num(p.mean,0)}$, $\sigma_a=${num(p.amplitude,0)}$ MPa; $\sigma_{\max}=${num(p.maximum,0)}$, $\sigma_{\min}=${num(p.minimum,0)}$ MPa. Ray multipliers: Goodman $n=${f(p.goodman)}$, Gerber $n=${f(p.gerber)}$, Soderberg $n=${f(p.soderberg)}$, symmetric yield $n_y=${f(p.yieldFactor)}$. **${p.admitted?'Within':'Outside'} the chosen Goodman and yield bounds.** Negative mean receives no fatigue benefit in this illustration. Factors describe these models, not measured reliability.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Plastic collapse: lower- and upper-bound theorems',
      statement: String.raw`Consider a small-displacement, perfectly plastic structure with a convex yield set and an **associated flow rule** (maximum plastic dissipation), under proportional loading $\lambda\mathbf P_0$, with true collapse load factor $\lambda_c$ (the load at which it deforms without limit). Then:
(a) **Lower bound (static theorem).** If there is a stress field (or bending-moment distribution) that is in equilibrium with $\lambda\mathbf P_0$ and violates the yield condition nowhere, then $\lambda\le\lambda_c$: this is a lower estimate of the ideal collapse factor.
(b) **Upper bound (kinematic theorem).** For any kinematically admissible velocity mechanism with positive reference-load work $W_0$, its full plastic dissipation $D$ gives $\lambda_U=D/W_0\ge\lambda_c$. Every dissipating region or hinge must be included; this is an upper estimate of ideal collapse capacity.
(c) When one admissible field and one mechanism give the same $\lambda$, that is the collapse load. The result is stated for small displacements and a convex yield condition; the example drawn is a beam fixed at both ends with a point load at mid-span, with plastic moment $M_p$.`,
      idea: String.raw`Associated flow places the plastic strain-rate vector in the outward normal cone of the convex yield set. The supporting-hyperplane inequality (opt-2.8) then gives $(\sigma^*-\widehat\sigma):\dot\varepsilon^p\ge0$ for every stress $\widehat\sigma$ at or below yield and the actual yielding stress $\sigma^*$. Integrating this maximum-dissipation inequality and using equilibrium/virtual work supplies the two bounds. Convexity alone would not specify that flow rule.

For the displayed beam, a linear moment diagram obeys $M_C+(m_A+m_B)/2=PL/4$, with hogging end magnitudes $m_A,m_B$. Keeping all three moments within $\pm M_p$ gives a static lower certificate. A unit-deflection triangular mechanism with a hinge at $x$ dissipates $2M_p(1/x+1/(L-x))$; divide by the deflection at the actual midspan load. The result is $4M_p/\min(x,L-x)$. At $m_A=m_B=M_p$ and $x=L/2$, both certificates give $8M_p/L$.`,
      caption: String.raw`**Left (lower bound):** choose the end moments $m_A,m_B$ (hogging) with the sliders; the moment diagram stays inside the plastic band $\pm M_p$ and the largest load it can carry in equilibrium is shown. **Middle (upper bound):** drag the gold hinge horizontally along the span; the beam rotates about the end hinges and the hinge you placed, and the work balance gives a load that is never below the collapse load. **Last panel:** the bounds on one line: the lower one climbs as you raise the end moments to $M_p$, the upper one falls as the middle hinge moves to mid-span, and both meet at $8M_p/L$.`,
      deps: ['solid-4.5', 'solid-1.10', 'solid-2.4', 'opt-2.8'],
      refs: ['A. F. Bower, Applied Mechanics of Solids, §§6.3.1–6.3.3 and6.3.5: dissipation and complete upper/lower-bound derivations; read2026-10-19', 'Supporting-hyperplane argument applied here to a convex yield set; beam certificates derived independently'],
      tags: ['plasticity', 'limit analysis'],
      verify: false,
      scope: String.raw`Rigid- or elastic–perfectly plastic response with a convex yield set, associated flow/maximum dissipation, proportional loading, positive reference-load work, fixed support conditions and small displacements. No strain softening, buckling, fracture or geometric instability. The beam has constant symmetric moment capacity $|M|\le M_p$, with axial/shear failure excluded. Finite deflections in the picture only display an infinitesimal mechanism shape; work uses its velocity slopes. Chosen $M_p=100$ kN·m and $L=6$ m are teaching inputs.`,
      links: {source:'https://solidmechanics.org/Text/Chapter6_3/Chapter6_3.php'},
      viz(v) {
        const Mp = 100, L = 6, Pc = (8 * Mp) / L; // kN·m, m, kN
        const mA = v.slider('end moment $m_A$ (kN·m, hogging)', -100, 100, 0, { step: 1 });
        const mB = v.slider('end moment $m_B$ (kN·m, hogging)', -100, 100, 0, { step: 1 });
        const A = v.stage({ x: [-.5, L+.5], y: [-135, 135], axes: 'box', gutter: true, height: 340, xlabel: 'x (m)', ylabel: 'M (kN·m, sagging +)', title: 'a safe moment diagram (lower bound)' });
        const B = v.stage({ x: [-0.4, L + 0.4], y: [-1.5, 2.4], equal: true, axes: false, height: 340, title: 'a collapse mechanism (upper bound)' });
        const C = v.stage({ x: [0, 2.2 * Pc], y: [0, 1], axes: 'box', gutter: true, height: 190, xlabel: 'load P (kN)', title: 'the bounds on the collapse load', full: true });
        const Hh = B.handle(L / 4, -.9, { color: 'gold', r: 8, constrain: { x: [0.4, L - 0.4], y: [-.9, -.9] } });
        v.legend([['green', 'lower bound'], ['red', 'upper bound'], ['ink', 'collapse load 8Mp/L']]);
        const lower=()=>collapseStatic(Mp,L,mA.value,mB.value).load;
        const upper=x=>{const u=collapseMechanism(Mp,L,x);return{...u,P:u.load};};
        v.button('match both bounds',()=>{mA.set(Mp);mB.set(Mp);Hh.set(L/2,-.9);});
        v.render(() => {
          const x = Hh.x, u = upper(x), Pl = lower();
          // moment diagram for the load Pl
          const M0 = -mA.value, M1 = Pl * L / 4 - (mA.value + mB.value) / 2, M2 = -mB.value; // end, centre (sagging), end
          A.rect(0, -Mp, L, Mp, { color: 'orange', width: 1.2, fill: 'orange', fillAlpha: 0.07 });
          A.hline(Mp, { color: 'orange', width: 1.4, dash: [5, 4] }); A.hline(-Mp, { color: 'orange', width: 1.4, dash: [5, 4] });
          A.text('+Mp', 0.05, Mp + 14, { size: 12, color: 'orange', align: 'left' }); A.text('−Mp', 0.05, -Mp - 14, { size: 12, color: 'orange', align: 'left' });
          A.poly([[0, 0], [0, M0], [L / 2, M1], [L, M2], [L, 0]], { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2.6 });
          A.dots([[0, M0], [L / 2, M1], [L, M2]], { r: 5, color: 'green' });
          A.text(`P = ${num(Pl, 1)} kN`, L / 2, 118, { size: 12, color: 'green', align: 'center' });
          // mechanism
          const s = -0.9, xh = x, defl = (t) => (t <= xh ? (t / xh) * s : ((L - t) / (L - xh)) * s);
          B.line(0, 0, L, 0, { color: 'faint', width: 1.2, dash: [4, 4] });
          B.path([[0, 0], [xh, s], [L, 0]], { color: 'red', width: 4 });
          B.dot(0, 0, { r: 7, color: 'red' }); B.dot(L, 0, { r: 7, color: 'red' }); B.dot(xh, s, { r: 7, color: 'red' });
          B.text('hinge', 0.15, -0.35, { size: 11, color: 'red', align: 'left' }); B.text('hinge', L - 0.15, -0.35, { size: 11, color: 'red', align: 'right' });
          B.arrow(L / 2, defl(L / 2) + 1.2, L / 2, defl(L / 2) + 0.12, { color: 'ink', width: 3 });
          B.dot(L / 2, defl(L / 2), { r: 4, color: 'ink' }); B.text(`P = ${num(u.P, 1)} kN`, L / 2 + 0.2, defl(L / 2) + 1.2, { size: 12, color: 'red', align: 'left' });
          B.rect(-0.1, -1.1, 0.0, 1.0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.4 }); B.rect(L, -1.1, L + 0.1, 1.0, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.4 });
          // bounds
          const meet=Math.abs(u.P-Pl)<1e-6*Pc;C.setView([-.08*u.P,(meet?1.3:1.12)*u.P],[0,1]);
          C.rect(Pl, 0.35, u.P, 0.65, { color: 'orange', width: 1, fill: 'orange', fillAlpha: 0.2 });
          C.line(Pc, 0.2, Pc, 0.8, { color: 'ink', width: 2 });
          C.dot(Pl,0.5,{r:meet?9:8,color:'green',hollow:meet,width:2});C.dot(u.P,0.5,{r:meet?5:8,color:'red'});
          if(meet)C.text('lower = upper',Pc,.9,{size:12,color:'ink',align:'center'});
          else{C.text('lower',Pl,.9,{size:12,color:'green',align:'left'});C.text('upper',u.P,.9,{size:12,color:'red',align:'right'});}
          C.text('8Mp/L', Pc, 0.08, { size: 12, color: 'ink', align: 'center' });
        });
        v.readout(() => {
          const Pl = lower(), u = upper(Hh.x), gap = u.P - Pl;
          return `$M_p=${Mp}$ kN·m, $L=${L}$ m. · Lower bound: $P=\\tfrac4L\\big(M_p+\\tfrac{m_A+m_B}2\\big)=${num(Pl, 1)}$ kN. · Upper bound (hinge at $x=${num(Hh.x, 2)}$ m): internal work $M_p(\\theta_A+\\theta_x+\\theta_B)=${num(Mp * 2 * (u.tA + u.tB), 1)}$ per unit deflection, load-point deflection ${num(u.dL, 3)} → $P=${num(u.P, 1)}$ kN (equals $4M_p/\\min(x,L-x)$). · Collapse load $8M_p/L=${num(Pc, 1)}$ kN lies between: ${num(Pl, 1)} ≤ ${num(Pc, 1)} ≤ ${num(u.P, 1)}; gap ${num(gap, 1)} kN${gap < 0.01 * Pc ? ' — the bounds have met' : ''}.`;
        });
      },
    },
  ],
};
void rad;
