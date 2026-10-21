// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part d: 4.16–4.20)
import { harveyArithmetic, veinState, VEIN } from './physio-source-audit-harvey.js';
import { passiveFlow, regulatedFlow, myogenicStep } from './physio-source-audit-myogenic.js';
import { cardiacFlow, venousFlow, circulationParameters, circulationEquilibrium } from './physio-source-audit-guyton.js';
import { oncoticPressure, frozenFiltration } from './physio-source-audit-starling.js';
import { stenosisFlow, BERNOULLI_MMHG } from './physio-source-audit-flow.js';
import { clamp, RHO_BLOOD, PA_PER_MMHG } from './ch04.shared.js';

export default {
  collection: 'physio',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Phenomenon',
      name: 'Myogenic autoregulation of blood flow',
      statement: String.raw`Arterial smooth muscle can contract after increased wall stretch and relax after a reduction in tension. This local **myogenic response** can oppose passive pressure distension and help regulate tissue flow. For a fixed-length Poiseuille model, $Q\propto P r^4$, so holding flow constant requires $r\propto P^{-1/4}$; for small changes, $d\ln r=-\tfrac14d\ln P$. Finite constriction/dilation limits restrict compensation. The range and speed of whole-organ autoregulation depend on the tissue and other controls; no universal pressure plateau is assumed here.`,
      idea: String.raw`Bayliss's 1902 paper reports pressure-induced arterial reactions in denervated limbs and excised arteries, and interprets them as myogenic. The displayed curves are a later chosen model, not a reproduction of his volume traces. Passive radius increases with pressure; an active multiplier moves toward $Q_{pass}^{-g/4}$ within chosen bounds. Without those bounds, the steady flow is $Q_{pass}^{1-g}$, making $g$ the reduction in logarithmic flow sensitivity. The measured gain across 80–140 mmHg can differ from the control when a radius limit is active.

For positive pressure and radius, pma-5.5 differentiates the fixed-length law $\ln Q=\ln C+\ln P+4\ln r(P)$. Holding flow fixed therefore requires $d\ln r/d\ln P=-1/4$. Likewise the chosen unbounded steady model $Q=Q_{\rm pass}^{1-g}$ has logarithmic sensitivity $1-g$ to passive flow. Radius limits interrupt this derivative relation, so it does not assert unlimited compensation.`,
      caption: String.raw`The **left** panel compares passive and regulated flow over the complete pressure range; drag the gold **pressure** handle. Change gain and radius reserve to see where compensation reaches a limit. The **right** panel applies a pressure step at 5 seconds: passive radius changes immediately, while the active multiplier follows an exact first-order exponential with time constant $\tau$. The readout distinguishes the initial jump, the value 55 seconds later and the eventual target.`,
      scope: String.raw`Illustrative fixed-length resistance-vessel model with chosen passive distensibility, active radius limits of −30%/+35% times the reserve control, and a first-order response time. Flow and radius are relative to the 100 mmHg state. Its plateau, time constants and ±10% band are mathematical properties of these chosen functions, not measured brain, kidney or human pressure ranges. Bayliss's original evidence concerns local wall reactions; metabolic, neural, endothelial and pulsatile effects are omitted here.`,
      deps: ['physio-4.2','physio-1.2','pma-5.5'],
      see: ['physio-4.3', 'physio-7.12'],
      refs: ['Bayliss (1902), On the local reactions of the arterial wall to changes of internal pressure, J Physiol 28:220–231; pp.220–222 experiments, pp.230–231 interpretation and summary; DOI 10.1113/jphysiol.1902.sp000911; response curves chosen here'],
      tags: ['autoregulation', 'feedback', 'arterioles'],
      credit: 'W. M. Bayliss, 1902',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1902.sp000911' },
      verify: false,
      viz(v) {
        const sG = v.slider('myogenic gain', 0, 1, 0.9, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const sRes = v.slider('reserve of constriction / dilation', 0.2, 1.4, 1, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sTau = v.slider('response time $\\tau$', 2, 30, 8, { step: 1, fmt: (x) => `${x} s` });
        const sStep = v.slider('pressure step at 5 s', 40, 200, 160, { step: 5, fmt: (x) => `100 → ${x} mmHg` });
        const a = v.stage({ x: [20, 220], y: [0, 3.2], height: 300, axes: 'box', gutter: true, xlabel: 'perfusion pressure (mmHg)', ylabel: 'flow Q / Q_set', weight: 1.1 });
        const b = v.stage({ x: [0, 60], y: [0, 3.2], height: 300, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'flow, radius (relative)', weight: 1 });
        const h = a.handle(160, 1, { color: 'gold', label: 'P', constrain: (x) => [clamp(x, 20, 220), 1] });
        const qp=passiveFlow;
        let o=null;
        v.render(()=>{
          const g=sG.value,res=sRes.value,qr=P=>regulatedFlow(P,g,res),P=h.x;
          a.setView([10,230],[-.2,Math.max(qp(220),qr(220))*1.2]);
          a.fn(qp,{color:'muted',width:2,dash:[6,4],domain:[20,220]});a.fn(qr,{color:'accent',width:2.8,domain:[20,220]});a.hline(1,{color:'faint',dash:[3,4]});
          h.set(P,qr(P));a.dot(P,qp(P),{r:5,hollow:true,color:'muted'});a.line(P,qp(P),P,qr(P),{color:'orange',dash:true});
          let lo=null,hi=null;for(let p=20;p<=220;p++)if(Math.abs(qr(p)-1)<=.1){if(lo===null)lo=p;hi=p;}a.hband(.9,1.1,{color:'green',alpha:.08});
          const gm=1-Math.log(qr(140)/qr(80))/Math.log(qp(140)/qp(80)),P1=sStep.value,tau=sTau.value,pts=[],rr=[],pp=[];
          for(let k=0;k<=600;k++){const t=k*.1;if(k===50){pts.push([5,1]);rr.push([5,1]);pp.push([5,1]);}const z=myogenicStep(P1,g,res,tau,t);pts.push([t,z.flow]);rr.push([t,z.radius]);pp.push([t,z.pressure]);}
          b.setView([-2,62],[-.2,Math.max(...pts.map(p=>p[1]),...rr.map(p=>p[1]),...pp.map(p=>p[1]))*1.2]);
          b.path(pp,{color:'faint',width:1.6,dash:[4,4]});b.path(pts,{color:'accent',width:2.8});b.path(rr,{color:'purple',width:2});b.hline(1,{color:'faint',dash:[3,4]});
          o={P,q:qr(P),qpass:qp(P),lo,hi,gm,jump:qp(P1),end:pts.at(-1)[1],target:qr(P1)};
        });
        v.legend([['muted','passive vessels',{dash:true}],['accent','with chosen tone / flow'],['purple','radius (right)'],['faint','pressure (right, ÷100)',{dash:true}]]);
        v.readout(()=>`at ${v.fix(o.P,0)} mmHg: regulated flow ${v.fix(o.q,2)}, passive ${v.fix(o.qpass,2)}; chosen ±10% band ${o.lo}–${o.hi} mmHg (1 mmHg sampling); logarithmic gain over 80–140 mmHg ${v.fix(o.gm,2)}\nafter pressure step: initial flow ${v.fix(o.jump,2)}, at 55 seconds ${v.fix(o.end,2)}, eventual target ${v.fix(o.target,2)} (all relative)`);

      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Model',
      name: 'Guyton’s venous return and the cardiac-output equilibrium',
      statement: String.raw`In Guyton's graphical model, cardiac output and venous return are equal at a steady operating point. Both curves use right-atrial pressure $P_{ra}$ as a common coordinate: the cardiac curve rises with filling, whereas the venous-return curve falls as the downstream pressure rises. A simple forward-flow law is $VR=(P_f-P_{ra})/R_{VR}$ while $P_{ra}$ exceeds a chosen collapse threshold and remains below the filling-pressure intercept $P_f$. Below the collapse threshold, return plateaus; at pressures above $P_f$, this illustration sets forward return to zero. A positive intersection determines pressure and flow together.`,
      idea: String.raw`The 1955 paper combines experimentally obtained cardiac-response and venous-return curves; its Figure 5 equates them graphically. It uses **mean circulatory filling pressure**, the equilibrated pressure of the whole circulation after flow stops. Mean systemic filling pressure concerns the systemic compartment; these terms need not have identical values. Here $P_f$ is a chosen lumped filling-pressure intercept. For the specified positive-flow curves, increasing atrial pressure increases pumping and reduces supply, so a positive intersection is unique. Its stability follows if a small atrial reservoir has $C\,dP_{ra}/dt=VR-CO$ with positive compliance.

On a continuous positive-flow branch define $f(P_{ra})=VR(P_{ra})-CO(P_{ra})$. The intermediate value theorem pma-4.23 guarantees an intersection only when a finite interval brackets opposite signs. The decreasing supply and increasing cardiac response make that intersection unique; with positive reservoir compliance, the sign of $f$ directs pressure back toward it. This argument does not assert a positive-circulation equilibrium for every filling-pressure setting.`,
      caption: String.raw`Change **blood volume**, **sympathetic tone**, **contractility** and **venous resistance** to move the two chosen curves. The green dot is their positive intersection; the grey dot is the baseline model. The whole curves remain visible. At sufficiently low filling pressure the model supplies no positive venous return, so it reports that limit and removes the operating-point dot.`,
      scope: String.raw`Illustrative curves, not a fit to Guyton's dog experiments or a prediction of transfusion, haemorrhage or heart failure. Chosen baseline values are $P_f=7$ mmHg, $R_{VR}=1.4$ mmHg·min/L and a cardiac asymptote 13 L/min; the volume-to-pressure compliance 100 mL/mmHg, sympathetic effects and collapse pressure −2 mmHg are chosen. The collapse threshold does not move with volume in this simplified model, so sufficiently negative $P_f$ falls outside a positive-circulation state. It holds arterial load and heart rate implicit and omits reflex and time-dependent volume redistribution.`,
      deps: ['physio-3.3','physio-4.6','pma-4.23'],
      see: ['physio-8.7'],
      refs: ['Guyton (1955), Determination of cardiac output by equating venous return curves with cardiac response curves, Physiol Rev 35:123–129; pp.124–126 collapse/filling pressure, pp.127–128 and Fig.5 equilibrium; DOI 10.1152/physrev.1955.35.1.123'],
      tags: ['cardiac output', 'venous return', 'Guyton'],
      credit: 'A. C. Guyton, 1955',
      links: { doi: 'https://doi.org/10.1152/physrev.1955.35.1.123' },
      verify: false,
      viz(v) {
        const sV = v.slider('blood volume change', -1500, 1500, 0, { step: 50, fmt: (x) => `${x >= 0 ? '+' : ''}${x} mL` });
        const sS = v.slider('sympathetic tone', 0, 1, 0, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sC = v.slider('cardiac contractility', 0.2, 1.6, 1, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sR = v.slider('resistance to venous return', 0.8, 3, 1.4, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·min/L` });
        const s = v.stage({ x: [-4, 16], y: [0, 15], height: 330, axes: 'box', gutter: true, xlabel: 'right atrial pressure (mmHg)', ylabel: 'cardiac output = venous return (L/min)', weight: 1 });
        const CO = cardiacFlow, VR = venousFlow, solve = circulationEquilibrium;
        let o = null;
        v.render(() => {
          const {pm,c,r}=circulationParameters(sV.value,sS.value,sC.value,sR.value),xmin=Math.min(-4,pm)-2,xmax=Math.max(16,pm)+3;
          const ymax=Math.max(CO(xmax,c),CO(xmax,1),VR(-4,pm,r),VR(-4,7,1.4))*1.3+1;
          s.setView([xmin,xmax],[-1,ymax]);
          s.fn((P)=>CO(P,1),{color:'faint',width:1.6,dash:[5,4],domain:[-4,xmax-1]});s.fn((P)=>VR(P,7,1.4),{color:'faint',width:1.6,dash:[5,4],domain:[-4,xmax-1]});
          s.fn((P)=>CO(P,c),{color:'red',width:2.8,domain:[-4,xmax-1]});s.fn((P)=>VR(P,pm,r),{color:'accent',width:2.8,domain:[-4,xmax-1]});
          s.vline(pm,{color:'accent',alpha:.4,dash:[3,4]});s.text('P_f',pm,.4,{size:11,color:'accent',align:'center'});
          const e=solve(c,pm,r),e0=solve(1,7,1.4);o={e,e0,pm,c,r};
          s.dot(e0.P,e0.Q,{r:5,color:'muted'});
          if(e){s.dot(e.P,e.Q,{r:8,color:'green'});s.text(`${v.fix(e.Q,1)} L/min`,e.P+.4,e.Q+ymax*.04,{size:12,color:'green',align:'left',weight:700});}
          else s.text('no positive forward-flow equilibrium',xmin+(xmax-xmin)*.5,ymax*.5,{size:12,color:'green',align:'center'});
          s.text('cardiac function',xmax-1,CO(xmax-1,c)+ymax*.04,{size:11,color:'red',align:'right'});s.text('venous return',-3.8,VR(-3.8,pm,r)+ymax*.07,{size:11,color:'accent',align:'left'});
        });
        v.legend([['red','cardiac function curve'],['accent','venous return curve'],['faint','baseline model curves',{dash:true}]]);
        v.readout(()=>`${o.e?`positive equilibrium: CO = ${v.fix(o.e.Q,2)} L/min at $P_{ra}$ = ${v.fix(o.e.P,2)} mmHg`:'no positive forward-flow equilibrium: filling pressure is at or below the chosen collapse threshold'}; baseline ${v.fix(o.e0.Q,2)} L/min at ${v.fix(o.e0.P,2)} mmHg\n$P_f$ = ${v.fix(o.pm,1)} mmHg; $R_{VR}$ = ${v.fix(o.r,2)} mmHg·min/L${o.e?`; check $\\max[0,(P_f-\\max(P_{ra},-2))/R_{VR}]$ = ${v.fix(VR(o.e.P,o.pm,o.r),2)} L/min`:''}`);

      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Phenomenon',
      name: 'Bernoulli and the pressure drop across a stenosis',
      statement: String.raw`When blood flows steadily through a narrowing, continuity (physio-4.10) makes the velocity rise from $v_1=Q/A_1$ in the normal vessel to $v_2=Q/A_2$ in the throat, and Bernoulli's theorem for the streamline gives a fall of pressure $\Delta P=\tfrac12\rho\,(v_2^2-v_1^2)$ at the throat. With $\rho=1060$ kg/m³ and velocities in m/s, $\Delta P\approx 4\,(v_2^2-v_1^2)$ mmHg, and when the upstream velocity is small, the **simplified Bernoulli equation** used with Doppler echocardiography is $\Delta P\approx 4v_2^2$. The pressure falls with the *square* of the velocity, so a tight stenosis (a small throat area) produces a large gradient: halving $A_2$ quadruples the throat kinetic-pressure term at fixed flow; the total drop also subtracts the unchanged upstream term. Part of the pressure is recovered where the vessel widens again, and part is lost to turbulence.`,
      idea: String.raw`Bernoulli's theorem (fluid-2.9) says that along a streamline of a steady, inviscid flow the sum of the pressure and kinetic energy per unit volume, $P+\tfrac12\rho v^2$, is conserved. Where the flow speeds up through a narrowing, the pressure must fall by the increase in kinetic energy density; a pressure of 1 mmHg is 133 Pa, so a throat velocity of 1 m/s costs $\tfrac12\cdot1060\cdot1^2/133\approx4$ mmHg. Neglecting viscous and local-acceleration terms is an assumption, not a guarantee for every stenosis. The chosen downstream recovery fraction illustrates how incomplete recovery leaves a residual loss; it is not calculated from jet turbulence. Hatle and colleagues applied the simplified rule to peak jet velocity and discussed beam-angle and proximal-velocity limitations.`,
      caption: String.raw`The vessel with its narrowing is on the **left** (arrow length scales with velocity up to a display cap); the **right** panel plots pressure along it. Drag the **stenosis** from 0 to 90% of the area, raise the **flow** (exercise), and use the **recovery** slider to say how much of the pressure comes back downstream. The readout compares the exact Bernoulli drop with the clinical rule $4v^2$, separating omission of the upstream term from rounding the coefficient to 4.`,
      scope: String.raw`Steady, inviscid, one-dimensional flow with an assumed pressure recovery; real stenoses are pulsatile, the throat can be longer than the "streamline" idealisation, and eccentric lesions and jets add losses. The simplified rule $4v_2^2$ is for the peak velocity in the jet, neglects the proximal velocity (a reasonable approximation only when $v_1\ll v_2$) and has known limits in the clinic; the picture is not for diagnosis.`,
      deps: ['fluid-2.9', 'physio-4.10'],
      see: ['physio-4.14'],
      refs: ['Hatle, Angelsen & Tromsdal (1980), Br Heart J 43:284–292, pp. 284–285 equation (1), pp. 291–292 discussion; DOI 10.1136/hrt.43.3.284'],
      tags: ['Bernoulli', 'stenosis', 'Doppler'],
      credit: 'L. Hatle, B. A. Angelsen and A. Tromsdal, 1980 (cited Doppler study)',
      links: { doi: 'https://doi.org/10.1136/hrt.43.3.284' },
      verify: false,
      viz(v) {
        const sS = v.slider('stenosis (area reduction)', 0, 90, 75, { step: 1, fmt: (x) => `${x}%` });
        const sQ = v.slider('flow $Q$', 50, 500, 250, { step: 10, fmt: (x) => `${x} mL/s` });
        const sRec = v.slider('pressure recovery downstream', 0, 100, 60, { step: 5, fmt: (x) => `${x}%` });
        const g = v.stage({ x: [0, 10], y: [-1.9, 1.9], height: 290, axes: false, weight: 1 });
        const p = v.stage({ x: [0, 10], y: [-40, 100], height: 290, axes: 'box', gutter: true, xlabel: 'position along the vessel', ylabel: 'pressure change (mmHg)', weight: 1 });
        const R1 = 1.2; // cm
        let o = null;
        v.render(() => {
          const model = stenosisFlow(sS.value, sQ.value, sRec.value, R1);
          const { A1, A2 } = model, Q = sQ.value, rec = sRec.value / 100;
          const shape = (x) => (x > 3.5 && x < 6.5 ? Math.cos(((x - 5) / 1.5) * (Math.PI / 2)) ** 2 : 0);
          const Aof = (x) => A1 - (A1 - A2) * shape(x), rof = (x) => Math.sqrt(Aof(x) / Math.PI);
          const vel = (x) => (Q / Aof(x)); // cm/s
          const Pin = (x) => -0.5 * RHO_BLOOD * ((vel(x) / 100) ** 2 - (vel(0) / 100) ** 2) / PA_PER_MMHG; // inviscid
          const Pthr = Pin(5);
          const Pof = (x) => (x <= 5 ? Pin(x) : Pthr + rec * (Pin(x) - Pthr));
          const sc = 1.5 / R1;
          const top = [], bot = []; for (let k = 0; k <= 120; k++) { const x = (k / 120) * 10; top.push([x, rof(x) * sc]); bot.push([x, -rof(x) * sc]); }
          g.poly([...top, ...bot.slice().reverse()], { fill: 'red', fillAlpha: 0.12, stroke: false });
          g.path(top, { color: 'red', width: 3 }); g.path(bot, { color: 'red', width: 3 });
          const vmax = vel(5) / 100;
          for (const x of [0.8, 2.2, 3.6, 4.4, 5, 5.6, 6.4, 7.8, 9.2]) { const L = Math.min(1.6, 0.6 * (vel(x) / 100)); for (const f of [-0.5, 0, 0.5]) { const yy = f * rof(x) * sc; g.arrow(x - L / 2, yy, x + L / 2, yy, { color: vel(x) / 100 > 2 ? 'orange' : 'accent', width: 2, head: 6 }); } }
          g.text(`v₁ = ${v.fix(vel(0) / 100, 2)} m/s`, 0.2, 1.75, { size: 12, color: 'accent', align: 'left', weight: 700 });
          g.text(`v₂ = ${v.fix(vmax, 2)} m/s`, 5, -1.75, { size: 12, color: vmax > 2 ? 'orange' : 'accent', align: 'center', weight: 700 });
          p.setView([0, 10], [Math.min(-12, Pthr * 1.25 - 4), 12]);
          p.fn(Pof, { color: 'accent', width: 2.8, domain: [0, 10] });
          p.fn(Pin, { color: 'faint', width: 1.4, dash: [4, 4], domain: [0, 10] });
          p.hline(0, { color: 'muted', width: 1 }); p.dot(5, Pthr, { r: 6, color: 'orange' });
          o = { ...model, dPex: -Pthr, d4: model.simplified, dFinal: -Pof(10) };
        });
        v.legend([['accent', 'pressure with recovery'], ['faint', 'inviscid (full recovery)', { dash: true }]]);
        v.readout(() => `throat area ${v.fix(o.A2, 2)} cm²; $v_1=${v.fix(o.v1, 2)}$, $v_2=${v.fix(o.v2, 2)}$ m/s → ideal $\\Delta P=${v.fix(o.dPex, 2)}$ mmHg (coefficient ${v.fix(BERNOULLI_MMHG, 4)})\nsimplified $4v_2^2=${v.fix(o.d4, 2)}$ mmHg = exact drop + omitted proximal term $4v_1^2=${v.fix(o.proximalRounded, 2)}$ + coefficient rounding ${v.fix(o.rounding, 2)} mmHg\nresidual loss for the chosen recovery fraction: ${v.fix(o.dFinal, 2)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.19
    {
      num: '4.19',
      kind: 'Paper',
      name: 'Exercitatio Anatomica de Motu Cordis et Sanguinis',
      paper: { authors: 'William Harvey', year: 1628, title: 'Exercitatio Anatomica de Motu Cordis et Sanguinis in Animalibus', venue: 'Frankfurt: William Fitzer', url: 'https://archive.org/details/exercitatioanat00harv' },
      introduces: ['physio-3.6'],
      statement: String.raw`Harvey's 1628 argument compared blood ejected repeatedly with the amount available in the body. In Chapter IX he supposes, for example, one drachm per beat and 1000 beats in half an hour: the total is ten pounds and five ounces in the weight reckoning used by the text. He also reports that a sheep's blood content was no more than four pounds. These are assumptions and observations used to argue for repeated circulation, not a measurement of a universal stroke volume. Chapter XIII describes vein-valve experiments: blood can be pressed toward the heart, reverse pressing is blocked at a valve, and an emptied segment refills from the hand side when the lower finger is lifted.`,
      idea: String.raw`The quantitative reasoning is conservation: a one-way throughput much larger than the available supply cannot be sustained by continual replacement from food. Harvey explicitly leaves the precise quantity expelled per beat for further determination. The vein-valve experiment supports directed return toward the heart; it does not itself reveal the microscopic arterial-to-venous connection. The text read here is Robert Willis's 1847 English translation, reprinted in the 1906 edition digitized by Project Gutenberg. The Latin original and its historical metrology are not independently reconstructed.`,
      caption: String.raw`The **left** plot multiplies chosen drachms per beat by beats per minute and shows when cumulative throughput exceeds the chosen body supply. The **right** converts the same choices using an illustrative 3.7 mL/drachm convention and compares them with a chosen 70 mL,75/min,5 L reference. The lower cartoon follows the four vein-experiment steps; during reverse pressing, the moving finger stops above the closed valve and the segment below remains empty. These parameter explorations and the cartoon are not reconstructions of measured traces.`,
      scope: String.raw`Primary support: Chapters VIII–IX and XIII of Harvey's work in the identified translation. The arithmetic uses 8 drachms/ounce and 12 ounces/pound, the reckoning consistent with the text's 1000 drachms =10 pounds5 ounces. Controls include additional chosen values beyond Harvey's examples; capacity and expelled quantity are independently adjustable. The 3.7 mL/drachm conversion is a modern illustrative convention, not a verified 1628 unit conversion; the blue reference values are chosen comparisons, not observations of "today" or a test of Harvey's accuracy. The vein drawing abstracts the reported directions of filling and valve blockage, not an original plate or a fluid simulation.`,
      deps: [],
      see: ['physio-3.6'],
      refs: ['Harvey (1628), De Motu Cordis, Chapters VIII–IX and XIII; Robert Willis translation (1847), reprinted J.M.Dent1906; Project Gutenberg67065'],
      tags: ['Harvey', 'circulation', 'history'],
      credit: 'William Harvey, 1628',
      links: { source: 'https://www.gutenberg.org/ebooks/67065' },
      verify: false,
      viz(v) {
        const sCap = v.slider('ventricle capacity', 1, 3, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} oz` });
        const sDr = v.slider('blood expelled per beat', 0.25, 4, 1, { step: 0.25, fmt: (x) => `${v.fix(x, 2)} drachm` });
        const sB = v.slider('beats in half an hour', 600, 2500, 1000, { step: 50 });
        const sBody = v.slider('blood in the whole body', 2, 12, 4, { step: 0.5, fmt: (x) => `${x} lb` });
        const step = v.select('vein experiment', [{ value: 1, label: '1 tied arm' }, { value: 2, label: '2 strip to heart' }, { value: 3, label: '3 stroke back' }, { value: 4, label: '4 release' }], 2);
        const sF = v.slider('finger position', 0, 1, 0.6, { step: 0.02, fmt: (x) => v.fix(x, 2) });
        const a = v.stage({ x: [0, 30], y: [0, 14], height: 270, axes: 'box', gutter: true, xlabel: 'minutes', ylabel: 'blood pumped through the heart (lb)', weight: 1.1 });
        const b = v.stage({ x: [0, 4], y: [0.1, 1e6], ylog: true, height: 270, axes: 'box', gutter: true, ylabel: 'mL (log scale)', xticks: [[1, 'per beat'], [2, 'in 30 min'], [3, 'whole body']], weight: 0.9, minWidth: 240 });
        const c = v.stage({ x: [0, 10], y: [0.3, 3.7], height: 240, axes: false, full: true });
        let o = null;
        v.render(() => {
          const perBeat=sDr.value,N=sB.value,body=sBody.value,rate=N/30,arith=harveyArithmetic(perBeat,N,body,sCap.value),tot=arith.totalPounds,tx=arith.crossingMinutes;
          const lbAt=t=>perBeat*rate*t/96,top=Math.max(tot,body)*1.25+1;
          a.setView([-1.5,31.5],[-top*.08,top]);a.fn(lbAt,{color:'red',width:2.8,domain:[0,30]});a.hline(body,{color:'accent',width:2.2});a.text(`chosen body supply (${body} lb)`,29.5,body+top*.05,{size:12,color:'accent',align:'right',weight:700});
          if(tx<30){a.vline(tx,{color:'green',dash:[5,4]});a.dot(tx,body,{r:7,color:'green'});a.text(`crossing at ${v.fix(tx,1)} min`,tx,body-top*.1,{size:11,color:'green',align:'center'});}
          a.text(`${v.fix(tot,1)} lb in 30 min`,29.5,tot-top*.06,{size:12,color:'red',align:'right',weight:700});
          const mlH=arith.perBeatMl,totH=arith.totalMl,bodyH=arith.bodyMl,bars=[[1,mlH,70],[2,totH,70*75*30],[3,bodyH,5000]];
          for(const[x,h,m]of bars){b.rect(x-.38,.1,x-.02,h,{fill:'red',fillAlpha:.35,color:'red'});b.rect(x+.02,.1,x+.38,m,{fill:'accent',fillAlpha:.35,color:'accent'});b.text(v.fix(h,h<10?2:0),x-.2,h*1.5,{size:10,color:'red',align:'center'});b.text(Math.round(m).toLocaleString('en'),x+.2,m*1.5,{size:10,color:'accent',align:'center'});}
          const stp=+step.value,s=sF.value,{lower:a0,upper:b0,valve}=VEIN,state=veinState(stp,s),f=state.f,full=state.filled;
          c.rect(.1,.6,9.9,3.5,{fill:'gold',fillAlpha:.1,stroke:false,radius:14});
          const segs = []; let cur = null; for (let k = 0; k <= 200; k++) { const x = 0.4 + (k / 200) * 9.2, fl = full(x); if (!cur || cur.fl !== fl) { cur = { fl, pts: [] }; segs.push(cur); } cur.pts.push([x, 2]); }
          segs.forEach((sg, i) => { if (i > 0) sg.pts.unshift(segs[i - 1].pts[segs[i - 1].pts.length - 1]); c.path(sg.pts, { color: sg.fl ? 'purple' : 'faint', width: sg.fl ? 14 : 2.5, alpha: sg.fl ? 0.75 : 1 }); });
          { const vx = valve, shut = state.closed, tipY = shut ? 0.02 : 0.2, tipX = shut ? vx + 0.15 : vx + 0.3;
            for (const sgn of [1, -1]) c.line(vx - 0.2, 2 + sgn * 0.17, tipX, 2 + sgn * tipY, { color: 'ink', width: 3 }); }
          c.text('valve', valve, 1.5, { size: 11, color: 'muted', align: 'center' });
          c.text('hand', 0.4, 1.0, { size: 12, color: 'muted', align: 'left' }); c.text('heart →', 9.8, 1.0, { size: 12, color: 'muted', align: 'right' });
          if(stp!==4)c.dot(a0, 2, { r: 8, color: 'orange', hollow: stp === 1 }); c.text(stp===4?'lower finger lifted':'lower finger', a0, 1.45, { size: 11, color: 'orange', align: 'center' });
          if (stp === 2) { c.dot(f, 2, { r: 8, color: 'gold' }); c.arrow(f - 0.9, 2.9, f + 0.1, 2.9, { color: 'gold', width: 2 }); }
          if (stp === 3) { const g2=state.reverseFinger; c.dot(g2, 2, { r: 8, color: 'gold' }); c.arrow(g2 + 0.9, 2.9, g2 - 0.1, 2.9, { color: 'gold', width: 2 }); c.text('valve shuts: nothing comes back', 6.5, 3.35, { size: 12, color: 'red', align: 'center', weight: 700 }); }
          if (stp === 4) c.text('lower finger lifted: the vein fills from the hand side', 5, 3.35, { size: 12, color: 'green', align: 'center', weight: 700 });
          if (stp === 2) c.text('blood is pushed through the valve toward the heart', 5, 3.35, { size: 12, color: 'gold', align: 'center', weight: 700 });
          if (stp === 1) c.text('arm tied: the veins swell', 5, 3.35, { size: 12, color: 'purple', align: 'center', weight: 700 });
          o = { tot, tx, mlH, totH, bodyH, perBeat, arith, stp, s, reverseFinger:state.reverseFinger };
        });
        v.legend([['red','chosen historical-unit arithmetic'],['accent','chosen modern-unit reference']]);
        v.readout(()=>`${v.fix(sCap.value,1)} oz = ${v.fix(sCap.value*8,1)} drachms capacity; chosen ejection ${v.fix(o.perBeat,2)} drachm = ${v.fix(100*o.arith.fraction,1)}% of capacity\n${sB.value} beats → ${v.fix(o.arith.totalDrachms,0)} drachms = ${o.arith.wholePounds} lb + ${v.fix(o.arith.remainingOunces,2)} oz (${v.fix(o.tot,2)} lb); ${o.tot>sBody.value?`exceeds chosen supply by ${v.fix(o.tot/sBody.value,2)}×`:'does not exceed chosen body supply within 30 min'}\nillustrative conversion: ${v.fix(o.mlH,2)} mL/beat and ${v.fix(o.totH/1000,2)} L/30min; blue reference uses 70 mL/beat ×75/min =5.25 L/min`);

      },
    },
    // ------------------------------------------------------------------ 4.20
    {
      num: '4.20',
      kind: 'Paper',
      name: 'Absorption of Fluids from the Connective Tissue Spaces',
      paper: { authors: 'Ernest H. Starling', year: 1896, title: 'On the Absorption of Fluids from the Connective Tissue Spaces', venue: 'Journal of Physiology 19 (4): 312–326', doi: '10.1113/jphysiol.1896.sp000596' },
      introduces: ['physio-4.12'],
      statement: String.raw`In his 1896 paper, Starling investigated whether blood vessels could absorb isotonic fluid from tissue spaces. In paired isolated dog-limb perfusions with defibrinated blood, the blood passing through a limb made oedematous with salt solution became more dilute than blood passing through the control limb. He also measured serum-protein osmotic pressure using membrane osmometers. He argued that a difference in protein osmotic pressure could oppose capillary hydrostatic pressure and account for absorption of salt-rich tissue fluid. The paper explicitly distinguishes this from protein-rich tissue fluid, whose removal he associated mainly with lymphatics.`,
      idea: String.raw`The argument concerns **selective permeability**: salts that readily cross a membrane do not sustain the same osmotic difference as retained proteins. The paper's limb experiments (pp. 314–316) and osmometer experiments (pp. 321–324) were distinct pieces of evidence. The panel below is a later classical flux model inspired by this force balance, not a reconstruction of his apparatus, his measured curves or a modern glycocalyx model. It keeps both compartments' pressures and composition fixed while the reader varies perfusate protein.`,
      caption: String.raw`Choose the model perfusate's **protein concentration**, drag the **capillary-pressure** handle and choose a duration. The left panel plots signed classical filtration: positive is outward, negative is absorption. The right panel multiplies that constant flux by time and by ten 100-g tissue units to give the signed fluid-mass change for a nominal 1-kg limb (using 1 mL ≈ 1 g). The zero-flux pressure is computed from the chosen oncotic relation. The marker and full curves remain visible even when the model predicts a large gain or loss.`,
      scope: String.raw`Frozen-compartment illustration: $J=K_f[(P_c-P_i)-\pi(c)]$, with chosen $K_f=0.01$ mL/min/mmHg per 100 g, $P_i=-3$ mmHg and zero interstitial oncotic pressure. The polynomial $\pi(c)=2.1c+0.16c^2+0.009c^3$ mmHg for $c$ in g/dL is the Landis–Pappenheimer relation as reproduced in Weinstein's 2017 computational kidney model, equation (46); the 1963 original fit was not independently inspected and this is not a new validation of it. The model omits changing tissue/plasma volume, protein redistribution, lymph flow and glycocalyx effects, so long-duration straight lines are mathematical extrapolations. The parameters are not asserted skeletal-muscle measurements.`,
      deps: ['physio-1.4'],
      see: ['physio-4.12', 'physio-4.13'],
      refs: ['Starling (1896), J Physiol 19:312–326, pp. 314–316, 321–325; DOI 10.1113/jphysiol.1896.sp000596', 'Weinstein (2017), A mathematical model of the rat kidney: K+-induced natriuresis, Model Calculations, equation (46); PMCID PMC6148314'],
      tags: ['Starling', 'oncotic pressure', 'history'],
      credit: 'E. H. Starling, 1896',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1896.sp000596' },
      verify: false,
      viz(v) {
        const sC = v.slider('perfusate protein', 0, 10, 7, { step: 0.5, fmt: (x) => `${x} g/dL` });
        const sT = v.slider('duration', 5, 120, 60, { step: 5, fmt: (x) => `${x} min` });
        const KF = 0.01; // mL/min/mmHg per 100 g
        const pi = oncoticPressure;
        const a = v.stage({ x: [-2, 52], y: [-1, 1], height: 320, axes: 'box', gutter: true, xlabel: 'capillary pressure (mmHg)', ylabel: 'net filtration (mL/min per 100 g)', weight: 1.1 });
        const b = v.stage({ x: [-2, 52], y: [-100, 100], height: 320, axes: 'box', gutter: true, xlabel: 'capillary pressure (mmHg)', ylabel: 'weight change of 1 kg limb (g)', weight: 1 });
        const h = a.handle(30, 0, { color: 'gold', label: 'Pc', constrain: (x) => [clamp(x, 0, 50), 0] });
        const PI = -3; // chosen interstitial pressure in mmHg
        let o = null;
        v.render(() => {
          const T = sT.value, Pc = h.x;
          const flux = (P, c) => KF * ((P - PI) - (pi(c) - 0));
          const Pstar = (c) => pi(c) + PI;
          const extrema = [0, 3.5, 7, sC.value].flatMap(c => [0, 50].map(p => 10 * flux(p, c) * T));
          b.setView([-2, 52], [Math.min(-1, ...extrema) * 1.2, Math.max(1, ...extrema) * 1.2]);
          for (const [c, col, nm, labelX] of [[0, 'red', 'salt solution', 2], [3.5, 'orange', '3.5 g/dL', 20], [7, 'green', '7 g/dL model', 36]]) {
            a.fn((P) => flux(P, c), { color: col, width: 1.6, alpha: 0.55, domain: [0, 50] });
            b.fn((P) => 10 * flux(P, c) * T, { color: col, width: 1.6, alpha: 0.55, domain: [0, 50] });
            a.text(nm, labelX, flux(labelX, c) + 0.03, { size: 10, color: col, align: 'left', baseline: 'bottom' });
          }
          const c = sC.value;
          a.fn((P) => flux(P, c), { color: 'accent', width: 3, domain: [0, 50] }); a.hline(0, { color: 'muted', width: 1 });
          b.fn((P) => 10 * flux(P, c) * T, { color: 'accent', width: 3, domain: [0, 50] }); b.hline(0, { color: 'muted', width: 1 });
          h.set(Pc, flux(Pc, c)); if (Pstar(c) >= 0 && Pstar(c) <= 50) a.vline(Pstar(c), { color: 'green', dash: [4, 4] });
          const gain = 10 * flux(Pc, c) * T; b.dot(Pc, gain, { r: 7, color: 'gold' });
          o = { ...frozenFiltration(Pc, c, T), c, Pc, pi: pi(c), Pstar: Pstar(c), f: flux(Pc, c), gain, T };
        });
        v.readout(() => `${v.fix(o.c, 1)} g/dL protein → osmotic pressure ${v.fix(o.pi, 1)} mmHg; no net movement at capillary pressure ≈ ${v.fix(o.Pstar, 1)} mmHg (hydrostatic = oncotic, with the interstitial pressure of −3 mmHg)\nat ${v.fix(o.Pc, 0)} mmHg: ${o.f >= 0 ? 'filtration' : 'absorption'} of ${v.fix(Math.abs(o.f), 3)} mL/min per 100 g → ${o.gain >= 0 ? '+' : '−'}${v.fix(Math.abs(o.gain), 0)} g of limb weight in ${o.T} min`);
      },
    },
  ],
};
