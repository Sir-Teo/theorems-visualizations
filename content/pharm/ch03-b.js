import {illustrativeAnaesthetics,contextProfile} from './source-audit-context.js';
import {PBPK_ORGANS,PBPK_PARTITIONS,pbpkModel,pbpkTrace} from './source-audit-pbpk.js';
// Pharmacology — Chapter 3: Multi-compartment and physiological models (part b: items 3.7–3.12)
import { firstPassMetrics, firstPassTail } from './source-audit-firstpass.js';
import { recirculation, recirculationPeaks, RECIRCULATION } from './source-audit-recirculation.js';
import { LN2, clamp, logSlope, trapz, trapzLog, rk4, idxAt, memo, sig, box, wire, mamm, cBolus, cDecay, aucBolus, firstBelow, tTerminal, cshtHold, cshtRate, cHoldTrace, ANAES, jacobiSym, bateman } from './ch03.shared.js';

const nice = (x) => (x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100);

export default {
  collection: 'pharm',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Concept',
      name: 'First-pass effect',
      statement: String.raw`An orally absorbed drug may be lost in the gut wall and liver before reaching systemic blood. In this model $F=F_{abs}F_{gut}F_H$, and the well-stirred hepatic survival fraction is $F_H=Q/(Q+f_u\mathrm{CL}_{int})$. With linear **liver-only elimination**, $\mathrm{CL}_H=Qf_u\mathrm{CL}_{int}/(Q+f_u\mathrm{CL}_{int})$, so $\mathrm{AUC}_{po}=FD/\mathrm{CL}_H=F_{abs}F_{gut}D/(f_u\mathrm{CL}_{int})$. This cancellation of flow holds at both low and high extraction under these assumptions.`,
      idea: String.raw`Enzyme capacity affects two terms: first-pass survival and systemic clearance. At low extraction, hepatic survival is already near one, so its fractional change is small; clearance still changes with capacity. Therefore low extraction does **not** make oral AUC insensitive to enzymes in this liver-only model. Dividing capacity by four multiplies oral AUC by four, and multiplying capacity by three divides oral AUC by three, for every flow and extraction setting shown. Additional elimination routes, saturation or changing gut absorption would change this identity.`,
      caption: String.raw`The **left** panel accounts for fractions of the chosen swallowed dose. The **right** compares intravenous and oral concentration profiles for equal doses, with a faint oral baseline when enzyme capacity is changed. The numerical areas use trapezoids plus the exact remaining gut/central exposure after the plotted window. Compare enzyme inhibition and induction at low and high capacity: the oral exposure factor is the same, while bioavailability and clearance change by different amounts.`,
      scope: String.raw`Chosen one-compartment body with dose 100 mg, volume 100 L and absorption rate 1 h$^{-1}$; hepatic blood-flow default 90 L/h is illustrative. Only the liver eliminates drug after systemic entry; $F_{abs}$ and $F_{gut}$ are independent chosen inputs. Flow and clearance use one blood-concentration basis. Instantaneous hepatic extraction, linear metabolism and a fixed unbound fraction are model assumptions, not a claim of in-vivo equivalence between liver models. No numerical values are fitted to a named drug.`,
      deps: ['pharm-3.6', 'pharm-1.6'],
      refs: ['Jusko & Li (2021), AAPS J24:5, In Vivo Pharmacokinetics section: oral dose/AUC and model-dependent intrinsic clearance, equations2/3/8/9; DOI 10.1208/s12248-021-00656-z; cancellation derived here'],
      links: { source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/' },
      tags: ['bioavailability', 'first pass'],
      verify: false,
      viz(v) {
        const D = 100, V = 100, ka = 1.0;
        const fa = v.slider('fraction absorbed $F_{abs}$', 0.2, 1, 0.9, { step: 0.01 });
        const fg = v.slider('gut-wall survival $F_{gut}$', 0.3, 1, 0.9, { step: 0.01 });
        const Q = v.slider('hepatic blood flow $Q$ (L/h)', 40, 160, 90, { step: 5 });
        const X = v.slider('capacity $f_u$CL$_{int}$ (L/h)', 1, 5000, 150, { log: true, sig: 2 });
        const en = v.select('enzymes', [{ value: 'n', label: 'normal' }, { value: 'i', label: 'inhibited (÷4)' }, { value: 'u', label: 'induced (×3)' }], 'n');
        const sF = v.stage({ x: [0, 10], y: [-1, 11.5], axes: false, height: 340, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [0, 24], y: [0, 2], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 340, weight: 1, minWidth: 250 });
        const mult = () => (en.value === 'i' ? 0.25 : en.value === 'u' ? 3 : 1);
        const prof=xv=>firstPassMetrics(fa.value,fg.value,Q.value,xv,D,V);
        let info = null;
        v.render(() => {
          const x = X.value * mult(), P = prof(x), P0 = prof(X.value);
          const tEnd = clamp(nice(8 * Math.LN2 / P.k), 6, 400);
          const ts = Array.from({ length: 1201 }, (_, i) => (i / 1200) * tEnd);
          const civ = ts.map((t) => (D / V) * Math.exp(-P.k * t));
          const cpo = ts.map((t) => bateman(P.F, D, V, ka, P.k, t));
          const aivN = trapz(ts, civ) + civ[civ.length - 1] / P.k, apoN=trapz(ts,cpo)+firstPassTail(P.F,D,V,P.k,ka,tEnd,cpo.at(-1));
          info = { P, P0, x, aivN, apoN, pred: (fa.value * fg.value * D) / x, ratio: apoN / aivN };
          // flow diagram: widths proportional to fractions of the dose
          const H = 4.2, y0 = 4.8, xs = [0.6, 2.9, 5.2, 7.5], Wd = 1.7;
          const levels = [1, fa.value, fa.value * fg.value, P.F];
          const names = ['dose', 'absorbed', 'past gut wall', 'reaches blood'];
          const cols = ['ink', 'muted', 'muted', 'accent'];
          for (let i = 0; i < 4; i++) {
            const h = H * levels[i];
            sF.rect(xs[i], y0, xs[i] + Wd, y0 + h, { fill: cols[i], fillAlpha: i === 3 ? 0.5 : 0.28, color: cols[i], width: 1.5 });
            sF.text(`${v.fix(100 * levels[i], 0)} %`, xs[i] + Wd / 2, y0 + h / 2, { size: 13, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
            sF.text(names[i], xs[i] + Wd / 2, y0 + H + 0.6, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
            if (i < 3) {
              const hn = H * levels[i + 1], lost = h - hn;
              sF.poly([[xs[i] + Wd, y0], [xs[i + 1], y0], [xs[i + 1], y0 + hn], [xs[i] + Wd, y0 + h]], { fill: i === 2 ? 'orange' : 'muted', fillAlpha: 0.12, stroke: false });
              const col = i === 2 ? 'orange' : 'muted', lab = ['not absorbed', 'gut wall', 'liver'][i];
              if (lost > 0.02) sF.rect(xs[i] + Wd + 0.1, y0 - 0.3 - lost, xs[i + 1] - 0.1, y0 - 0.3, { fill: col, fillAlpha: 0.35, color: col, width: 1.2 });
              sF.text(`${v.fix(100 * (levels[i] - levels[i + 1]), 0)} %`, (xs[i] + Wd + xs[i + 1]) / 2, y0 - 0.3 - lost / 2, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
              sF.text(lab, (xs[i] + Wd + xs[i + 1]) / 2, y0 - 0.9 - lost, { size: 10, color: col, align: 'center', baseline: 'middle' });
            }
          }
          sF.text(`$F_H=1-E=${v.fix(P.FH, 2)}$   ($E=${v.fix(P.E, 2)}$)`, 5, 10.5, { size: 12, color: 'orange', align: 'center', baseline: 'middle' });
          sC.setView([-tEnd*.015,tEnd*1.015],[-.05,Math.max(...civ)*1.15]);
          sC.path(ts.map((t, i) => [t, civ[i]]), { color: 'orange', width: 2.2 });
          sC.between((t) => bateman(P.F, D, V, ka, P.k, t), () => 0, 0, tEnd, { fill: 'accent', fillAlpha: 0.16 });
          sC.path(ts.map((t, i) => [t, cpo[i]]), { color: 'accent', width: 2.4 });
          if (en.value !== 'n') sC.path(ts.map((t) => [t, bateman(P0.F, D, V, ka, P0.k, t)]), { color: 'muted', dash: [5, 4], width: 1.6 });
        });
        v.legend([['orange', 'intravenous'], ['accent', 'oral'], ['muted', 'oral, normal enzymes', { dash: true }]]);
        v.readout(() => `$E=${v.fix(info.P.E, 3)}$, $\\mathrm{CL}_H=${v.fix(info.P.cl, 1)}$ L/h. $F=F_{abs}F_{gut}(1-E)=${v.fix(info.P.F,info.P.F<.01?5:3)}$; trapezoid AUC ratio oral/IV $=${v.fix(info.ratio,info.ratio<.01?5:3)}$.\n$\\mathrm{AUC}_{po}=${v.fix(info.apoN,info.apoN<.01?5:2)}$ mg·h/L by trapezoids vs $F_{abs}F_{gut}D/(f_u\\mathrm{CL}_{int})=${v.fix(info.pred,info.pred<.01?5:2)}$ (no $Q$ in it).${en.value !== 'n' ? ` Compared with normal enzymes, oral $F$ changes by $\\times${v.fix(info.P.F / info.P0.F, 2)}$ while hepatic clearance changes by $\\times${v.fix(info.P.cl / info.P0.cl, 2)}$.` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Clearances add',
      statement: String.raw`If a drug is eliminated by several independent first-order pathways that act in parallel on the same blood, say renal, hepatic and other, each removes drug at a rate proportional to the concentration, $\mathrm{CL}_iC$. Then the total clearance is the sum, $\mathrm{CL}=\mathrm{CL}_R+\mathrm{CL}_H+\mathrm{CL}_{other}$, and pathway $i$ carries the fraction $f_i=\mathrm{CL}_i/\mathrm{CL}$ of the dose, whatever the shape of the concentration curve. Hence the exposure is $\mathrm{AUC}=D/\sum_i\mathrm{CL}_i$, and switching off pathway $j$ multiplies the AUC by $\mathrm{CL}/(\mathrm{CL}-\mathrm{CL}_j)=1/(1-f_j)$.`,
      idea: String.raw`The total elimination rate is the sum of the pathway rates, $\sum_i\mathrm{CL}_i\,C=\mathrm{CL}\,C$, so by definition the sum is the clearance (1.4). Integrating each pathway's rate over time, the amount it removes is $\mathrm{CL}_i\int C\,dt=\mathrm{CL}_i\,\mathrm{AUC}$; all pathways share the same AUC, so they split the dose in proportion to their clearances, and since the amounts must sum to the dose, $D=\mathrm{CL}\cdot\mathrm{AUC}$ (1.5). The additivity is the algebraic form of parallel resistors: pathways draw on the same blood concentration, which is not true of organs in series (first-pass, 3.7).`,
      caption: String.raw`The tank is the body; each pipe out of it is a pathway whose thickness is its clearance, labelled with the fraction of the dose it removes. Set the three clearances, then use **blocked pathway** to switch one off (kidney failure, an inhibited enzyme). The right panel integrates the elimination equations of all three pathways by RK4 for the normal and the blocked body: the amounts removed split in the proportions $f_i$, and the AUC ratio, computed from the integrated curves with the trapezoid rule, equals the predicted $1/(1-f_j)$.`,
      scope: String.raw`Pathways must be linear and independent and must act on the same concentration. A pathway that saturates, or that is fed by another (metabolite excreted by the kidney), or organs in series, break the simple sum.`,
      deps: ['pharm-1.4', 'pharm-1.5'],
      refs: ['Rowland–Tozer'],
      tags: ['clearance', 'parallel pathways'],
      viz(v) {
        const D = 400, V = 40;
        const cR = v.slider('renal CL$_R$ (L/h)', 0, 12, 3, { step: 0.1 });
        const cH = v.slider('hepatic CL$_H$ (L/h)', 0.5, 20, 6, { step: 0.1 });
        const cO = v.slider('other CL (L/h)', 0, 6, 1, { step: 0.1 });
        const blk = v.select('blocked pathway', [{ value: 'none', label: 'none' }, { value: 'R', label: 'renal' }, { value: 'H', label: 'hepatic' }, { value: 'O', label: 'other' }], 'R');
        const sT = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 0.9, minWidth: 240 });
        const sC = v.stage({ x: [0, 48], y: [0.02, 12], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1.1, minWidth: 260 });
        const COL = { R: 'accent', H: 'orange', O: 'purple' };
        const run = (cl, tEnd) => {
          const tot = cl.R + cl.H + cl.O, k = tot / V, n = 3000, h = tEnd / n;
          let y = [D, 0, 0, 0]; const t = [], c = [];
          const f = (s) => { const C = s[0] / V; return [-tot * C, cl.R * C, cl.H * C, cl.O * C]; };
          for (let i = 0; i <= n; i++) { t.push(i * h); c.push(y[0] / V); y = rk4(f, y, 0, h); }
          return { t, c, rem: y.slice(1), k, tot, auc: trapz(t, c) + c[c.length - 1] / k };
        };
        let info = null;
        v.render(() => {
          const cl = { R: cR.value, H: cH.value, O: cO.value }, tot = cl.R + cl.H + cl.O;
          const cb = { ...cl }; if (blk.value !== 'none') cb[blk.value] = 0;
          const totB = cb.R + cb.H + cb.O;
          const tEnd = clamp(nice((10 * Math.LN2 * V) / Math.min(tot, totB)), 12, 600);
          const A = run(cl, tEnd), B = run(cb, tEnd);
          const fj = blk.value === 'none' ? 0 : cl[blk.value] / tot;
          info = { A, B, tot, totB, fR: cl.R / tot, fH: cl.H / tot, fO: cl.O / tot, ratio: B.auc / A.auc, pred: 1 / (1 - fj), sumRem: A.rem.reduce((a, b) => a + b, 0), cl, tEnd };
          // tank and pipes
          sT.rect(2.5, 5.6, 7.5, 9.0, { fill: 'accent', fillAlpha: 0.08, color: 'ink', width: 2 });
          sT.text('body, $V=40$ L', 5, 8.2, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
          sT.text(`CL = ${v.fix(tot, 1)} L/h`, 5, 6.7, { size: 12, color: 'muted', align: 'center', baseline: 'middle' });
          [['R', 'renal', 2.5], ['H', 'hepatic', 5], ['O', 'other', 7.5]].forEach(([key, name, xc]) => {
            const c = cl[key], off = blk.value === key, w = 1.2 + 2.4 * c, col = COL[key];
            sT.arrow(xc, 5.6, xc, 2.3, { color: col, width: Math.max(1.2, w), head: 10, alpha: off ? 0.2 : 1, dash: off });
            if (off) sT.text('×', xc, 4.0, { size: 26, color: 'red', align: 'center', baseline: 'middle' });
            sT.text(name, xc, 1.8, { size: 11.5, color: col, align: 'center', baseline: 'middle', weight: 600 });
            sT.text(`${v.fix(c, 1)} L/h · ${v.fix(100 * c / tot, 0)} %`, xc, 1.0, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
          });
          sC.setView([0, tEnd], [(D / V) * 0.002, (D / V) * 1.6]);
          sC.path(A.t.map((t, i) => [t, A.c[i]]), { color: 'accent', width: 2.4 });
          if (blk.value !== 'none') sC.path(B.t.map((t, i) => [t, B.c[i]]), { color: 'red', width: 2.4 });
        });
        v.legend([['accent', 'all pathways open'], ['red', 'blocked pathway']]);
        v.readout(() => `Fractions of the dose removed (RK4 totals ÷ $D$): renal $${v.fix(info.A.rem[0] / D, 3)}$, hepatic $${v.fix(info.A.rem[1] / D, 3)}$, other $${v.fix(info.A.rem[2] / D, 3)}$; predicted $\\mathrm{CL}_i/\\mathrm{CL}$: $${v.fix(info.fR, 3)}$, $${v.fix(info.fH, 3)}$, $${v.fix(info.fO, 3)}$. AUC $=${v.fix(info.A.auc, 2)}$ vs $D/\\mathrm{CL}=${v.fix(D / info.tot, 2)}$ mg·h/L.\n` + (blk.value === 'none' ? 'No pathway blocked.' : `Blocked: AUC $=${v.fix(info.B.auc, 2)}$, ratio $\\times${v.fix(info.ratio, 3)}$ vs predicted $1/(1-f_j)=\\times${v.fix(info.pred, 3)}$.`));
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num:'3.9',kind:'Model',name:'Physiologically based pharmacokinetic (PBPK) models',
      statement:String.raw`A flow-limited **PBPK model** assigns each tissue a volume $V_t$, blood flow $Q_t$ and tissue/blood partition coefficient $K_{p,t}$. With venous concentration $z_t=C_t/K_{p,t}$, tissue mass balance is $V_t\dot C_t=Q_t(C_b-z_t)$; the liver additionally loses $\mathrm{CL}_{int}z_{liver}$ in this chosen model with unbound fraction one. The blood pool receives the matching return flows. All concentrations use a common blood basis, with blood/plasma ratio assumed one. These equations represent model assumptions, not measured organ curves.`,
      idea:String.raw`Define capacities $W=\mathrm{diag}(V_b,V_tK_{p,t})$. Then $W\dot z=Gz$, where exchange conductances are symmetric. The identity $z^TGz=-\sum_tQ_t(z_b-z_t)^2-\mathrm{CL}_{int}z_{liver}^2$ shows decay: with positive flows, capacities and clearance, $W^{-1/2}GW^{-1/2}$ is symmetric and negative definite. Its eigenmodes give exact exponential solutions. A larger tissue capacity relative to flow slows exchange; elimination and redistribution together determine the observed terminal phase.`,
      caption:String.raw`Left: the chosen blood/organ circuit at the exact time marker; colours use venous concentrations, while labels show actual tissue concentrations. Right: blood and four organ concentrations on a log axis, with initially zero tissue values omitted. The **base window** expands to include the marker. Change partition type, flow or liver capacity and compare exact eigenmode half-lives, mass balance and a finite-window tail estimate; that tail need not yet be purely terminal.`,
      scope:String.raw`A simplified parallel-organ topology: no lung, portal circulation, permeability barrier, binding dynamics or other eliminating organ. Every volume, flow and partition coefficient is a chosen teaching value; the named types are illustrative rather than fitted drugs or validated adult physiology. Jusko and Li's authored PBPK analysis supplies the tissue mass-balance relation and its perfusion/mixing assumptions. The 1968 thiopental paper was not reread and no reconstruction of its data or parameter set is claimed.`,
      deps:['pharm-3.1','physio-4.1'],refs:['Jusko & Li (2021), AAPS J 24:5, PBPK section/equation10 and Limitations; DOI10.1208/s12248-021-00656-z, complete analysis read 2026-10-19'],links:{source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/'},tags:['PBPK','organs'],verify: false,
      viz(v){
        const ORG=PBPK_ORGANS,kind=v.select('partition type',[{value:'lip',label:'lipophilic'},{value:'mod',label:'moderate'},{value:'hyd',label:'hydrophilic'}],'lip');
        const co=v.slider('flow scale (base total 6 L/min)',.5,1.5,1,{step:.05}),CI=v.slider('liver capacity (L/min)',.02,5,.5,{log:true,sig:2}),tm=v.slider('time marker (min)',.5,3000,20,{log:true,sig:2,fmt:x=>sig(x,3)});
        const win=v.select('base window',[{value:600,label:'10 h'},{value:3000,label:'50 h'}],600),sB=v.stage({x:[0,10],y:[0,10],axes:false,height:350,weight:.9,minWidth:250}),sC=v.stage({x:[0,3000],y:[.005,30],ylog:true,axes:'box',gutter:true,xlabel:'time (min)',ylabel:'concentration (mg/L, log)',height:350,weight:1.1,minWidth:260});
        const sim=memo();let info;
        v.render(()=>{
          const S=sim(`${kind.value}|${co.value}|${CI.value}`,()=>{const m=pbpkModel(kind.value,co.value,CI.value);return{m,...pbpkTrace(m)};}),m=S.m,{z,el,total}=m.state(tm.value),kp=PBPK_PARTITIONS[kind.value],xEnd=Math.max(Number(win.value),tm.value);
          const end=Math.ceil(xEnd),curves=[0,1,2,3,4].map(j=>S.t.slice(0,end+1).map((t,i)=>[t,S.z[i][j]*(j?kp[j-1]:1)]).filter(([,c])=>c>0)),positive=curves.flat().map(p=>p[1]);
          sC.setView([-xEnd*.015,xEnd*1.015],[Math.min(...positive)*.7,Math.max(...positive)*1.3]);
          const xb=2,yb=5,xo=7.6;
          box(sB,xb,yb,2.6,1.9,'blood',{color:'accent',fillAlpha:.08+.5*clamp(z[0]/20,0,1),sub:`${sig(z[0],3)} mg/L`});
          ORG.forEach((o,i)=>{const yo=9-i*1.9;box(sB,xo,yo,3.4,1.5,o[3],{color:o[4],fillAlpha:.06+.55*clamp(z[i+1]/20,0,1),sub:`${sig(z[i+1]*kp[i],3)} mg/L`,size:11.5});sB.arrow(xb+1.35,yb+(yo-yb)*.25,xo-1.75,yo+.15,{color:o[4],width:.8+3.2*m.Q[i]/3,head:7,alpha:.8});sB.text(`${v.fix(m.Q[i],2)}`,4.8,yb+(yo-yb)*.62+.35,{size:9.5,color:'muted',align:'center',baseline:'middle'});});
          sB.text('flows in L/min',4.8,.4,{size:10,color:'muted',align:'center',baseline:'middle'});
          sC.vline(tm.value,{color:'gold',alpha:.5,width:2});curves.forEach((pts,j)=>sC.path(pts,{color:j?ORG[j-1][4]:'accent',width:j?2:2.6}));
          const slope=Math.log(m.state(2500).z[0]/m.state(3000).z[0])/500;
          info={t:tm.value,balance:(total+el)/100,rates:m.modes.map(x=>x.rate),slope,inputs:[kind.value,co.value,CI.value,tm.value,Number(win.value)],xEnd};
        });
        v.legend([['accent','blood'],['purple','brain'],['orange','liver'],['green','muscle'],['gold','fat']]);
        v.readout(()=>`At ${sig(info.t,4)} min: (body amount + independently integrated elimination)/dose = ${v.fix(info.balance,8)}. Eigenmode half-lives: ${info.rates.slice().reverse().map(x=>sig(LN2/x,3)).join(', ')} min. Longest: ${sig(LN2/info.rates[0],4)} min; finite blood-tail estimate (2500–3000 min): ${sig(LN2/info.slope,4)} min. Visible window ends at ${sig(info.xEnd,4)} min.`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Method',
      name: 'Noncompartmental analysis and mean residence time',
      statement: String.raw`**Noncompartmental analysis** extracts exposure and disposition parameters from concentration–time samples without choosing a compartment model. After an intravenous bolus $D$: $\mathrm{AUC}=\int_0^\infty C\,dt$ (trapezoids plus a tail $C_{last}/\lambda_z$), $\mathrm{AUMC}=\int_0^\infty tC\,dt$ (trapezoids plus the tail $C_{last}t_{last}/\lambda_z+C_{last}/\lambda_z^2$), the **mean residence time** $\mathrm{MRT}=\mathrm{AUMC}/\mathrm{AUC}$, clearance $\mathrm{CL}=D/\mathrm{AUC}$ and the steady-state volume $V_{ss}=\mathrm{CL}\cdot\mathrm{MRT}=D\,\mathrm{AUMC}/\mathrm{AUC}^2$. For linear kinetics these hold for any number of compartments.`,
      idea: String.raw`The first moment of the concentration curve is the average time a molecule spends in the body, weighted by the amount eliminated: the fraction of the dose eliminated in $dt$ is $\mathrm{CL}\,C\,dt/D$, so the mean residence time is $\int t\,\mathrm{CL}\,C\,dt/D=\mathrm{CL}\cdot\mathrm{AUMC}/D=\mathrm{AUMC}/\mathrm{AUC}$ (using $D=\mathrm{CL}\cdot\mathrm{AUC}$, 1.5). The identity $V_{ss}=\mathrm{CL}\cdot\mathrm{MRT}$ then reads as a version of 'volume = flow × time'. Nothing about compartments is used, which is why the method applies to any linear system; its weakness is the unsampled tail, which weighs far more in AUMC (it carries a factor $t$) than in AUC.`,
      caption: String.raw`Choose the hidden truth: one, two or three compartments (the same clearance $\mathrm{CL}=5$ L/h in all). Samples (dots) are taken at ten log-spaced times up to the **last sampling time** and carry lognormal noise. Left: $C(t)$ with the observed AUC shaded and the extrapolated tail hatched; right: $tC(t)$ with AUMC. The red vertical line is the MRT. Shorten the sampling and the tail of AUMC grows far faster than that of AUC, so $V_{ss}=D\,\mathrm{AUMC}/\mathrm{AUC}^2$ is underestimated for a drug with a long terminal phase. The true values come from the exact model.`,
      scope: String.raw`Linear kinetics, elimination from the sampled (central) pool, a single intravenous bolus. The moments use observed data only through the trapezoid rule (linear up, logarithmic down) and a log-linear tail from the last three points; accuracy depends on sampling.`,
      credit: 'Yamaoka, Nakagawa & Uno, 1978 (statistical moments in pharmacokinetics)',
      deps: ['pharm-1.2', 'pharm-1.5'],
      refs: ['Rowland–Tozer'],
      tags: ['NCA', 'moments'],
      viz(v) {
        const D = 100;
        const TRUTH = {
          one: { V1: 35, CL: 5 },
          two: { V1: 12, V2: 40, CL: 5, Q2: 10 },
          three: { V1: 10, V2: 30, V3: 120, CL: 5, Q2: 12, Q3: 3 },
        };
        const sel = v.select('hidden truth', [{ value: 'one', label: 'one compartment' }, { value: 'two', label: 'two' }, { value: 'three', label: 'three' }], 'two');
        const tl = v.slider('last sampling time (h)', 6, 96, 24, { step: 1 });
        const cv = v.slider('assay noise (ln s.d.)', 0.01, 0.3, 0.05, { step: 0.01 });
        let seed = 5;
        v.button('resample', () => { seed++; });
        const sA = v.stage({ x: [0, 48], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 330, weight: 1, minWidth: 250 });
        const sM = v.stage({ x: [0, 48], y: [0, 30], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: '$t\\,C$ (mg·h/L)', height: 330, weight: 1, minWidth: 250 });
        let info = null;
        v.render(() => {
          const m = mamm(TRUTH[sel.value]), L = tl.value, C0 = D / m.V1;
          const f = (t) => cBolus(m, D, t);
          const trueAUC = D / m.CL, trueAUMC = (D / m.V1) * m.lam.reduce((s, l, j) => s + m.w[j] / (l * l), 0), trueMRT = trueAUMC / trueAUC;
          const r = v.rng(seed * 53 + 7);
          const ts = [0, ...Array.from({ length: 10 }, (_, i) => 0.25 * Math.pow(L / 0.25, i / 9))];
          const cs = ts.map((t, i) => (i === 0 ? C0 : f(t) * Math.exp(cv.value * r.normal())));
          const n = ts.length, idx = [n - 3, n - 2, n - 1], lz = logSlope(ts, cs, idx).k;
          const auc0 = trapzLog(ts, cs), tailA = cs[n - 1] / lz;
          const mom = ts.map((t, i) => t * cs[i]);
          // AUMC: linear trapezoid on t·C (log-down is not used for moments)
          const aumc0 = trapz(ts, mom), tailM = (cs[n - 1] * ts[n - 1]) / lz + cs[n - 1] / (lz * lz);
          const AUC = auc0 + tailA, AUMC = aumc0 + tailM, MRT = AUMC / AUC, CLe = D / AUC, Vss = D * AUMC / (AUC * AUC);
          info = { AUC, AUMC, MRT, CLe, Vss, trueAUC, trueMRT, trueVss: m.Vss, tailA: tailA / AUC, tailM: tailM / AUMC, lz, lzTrue: m.lam[0], n };
          const tv = Math.max(L * 1.3, 2.5 * trueMRT, 12), tMax = nice(clamp(tv, 12, 140));
          sA.setView([0, tMax], [0, C0 * 1.12]);
          sM.setView([0, tMax], [0, Math.max(...ts.map((t) => t * f(t)), trueMRT * 1) * 0 + Math.max(...Array.from({ length: 200 }, (_, i) => ((i / 199) * tMax) * f((i / 199) * tMax))) * 1.15]);
          sA.fn(f, { domain: [0, tMax], color: 'green', dash: true, width: 1.5 });
          sA.poly([...ts.map((t, i) => [t, cs[i]]), [ts[n - 1], 0], [0, 0]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          const tail = (t) => cs[n - 1] * Math.exp(-lz * (t - ts[n - 1]));
          sA.fn(tail, { domain: [ts[n - 1], tMax], color: 'orange', width: 2 });
          sA.fn(tail, { domain: [ts[n - 1], tMax], color: 'orange', width: 0, fill: true, fillAlpha: 0.14, hatch: true });
          ts.forEach((t, i) => sA.dot(t, cs[i], { r: 4.5, color: 'gold' }));
          sA.vline(MRT, { color: 'red', width: 2 });
          sA.text('MRT', MRT, C0 * 1.05, { size: 11, color: 'red', align: 'left', baseline: 'top', dx: 5 });
          sM.fn((t) => t * f(t), { domain: [0, tMax], color: 'green', dash: true, width: 1.5 });
          sM.poly([...ts.map((t, i) => [t, mom[i]]), [ts[n - 1], 0], [0, 0]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          sM.fn((t) => t * tail(t), { domain: [ts[n - 1], tMax], color: 'orange', width: 2 });
          sM.fn((t) => t * tail(t), { domain: [ts[n - 1], tMax], color: 'orange', width: 0, fill: true, fillAlpha: 0.14, hatch: true });
          ts.forEach((t, i) => sM.dot(t, mom[i], { r: 4.5, color: 'gold' }));
          sM.vline(MRT, { color: 'red', width: 2 });
        });
        v.legend([['green', 'true curve', { dash: true }], ['accent', 'observed area'], ['orange', 'extrapolated tail'], ['red', 'MRT'], ['gold', 'samples', { dot: true }]]);
        v.readout(() => `AUC $=${v.fix(info.AUC, 1)}$ (true ${v.fix(info.trueAUC, 1)}), of which ${v.fix(100 * info.tailA, 0)} % extrapolated; AUMC tail is ${v.fix(100 * info.tailM, 0)} % of AUMC. MRT $=${v.fix(info.MRT, 1)}$ h (true ${v.fix(info.trueMRT, 1)}).\nCL $=D/\\mathrm{AUC}=${v.fix(info.CLe, 2)}$ L/h (true 5), $V_{ss}=D\\,\\mathrm{AUMC}/\\mathrm{AUC}^2=${v.fix(info.Vss, 1)}$ L (true $${v.fix(info.trueVss, 1)}$ L); $\\lambda_z$ from the last 3 samples $=${v.fix(info.lz, 3)}$ h$^{-1}$ (true $${v.fix(info.lzTrue, 3)}$).`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Phenomenon',
      name: 'Enterohepatic recirculation',
      statement: String.raw`Biliary secretion followed by intestinal reabsorption can return a drug, or its regenerated parent compound, to the circulation. Delayed return can produce secondary concentration peaks and increase total exposure. In a simple linear model where a fraction $f_b$ of each plasma outflow enters bile and a fraction $f_r$ of that bile eventually returns, the total infinite-time exposure is multiplied by $1/(1-f_bf_r)$, provided meals continue, all reabsorbed drug reaches the model's central compartment and $f_bf_r<1$.`,
      idea: String.raw`Each recycled pass contributes the fraction $f_bf_r$ of the preceding pass, giving a convergent geometric series. Meal timing changes the concentration profile but not the infinite-time exposure in this chosen model. The official CELLCEPT label's section 12.3 reports mycophenolic-acid secondary peaks usually 6–12 hours after dosing, and an approximately 40% exposure decrease in a12-volunteer cholestyramine interaction study. These specific label observations illustrate recirculation; they are not the data or parameters of the model below.`,
      caption: String.raw`A chosen oral dose enters a gut compartment at time zero. Compare central concentration with and without recirculation over the complete 72 hours. Orange lines mark complete gallbladder emptying; its amount drops vertically at each meal. Change the biliary fraction, returned fraction and meal schedule. The readout separates exposure already accumulated from the analytically computed future exposure, including drug still in the gut and gallbladder.`,
      scope: String.raw`Illustrative parent-equivalent mass model: dose 100 mg, volume 40 L, total plasma-outflow clearance 6 L/h and absorption rate 1.2 h$^{-1}$ are chosen. Between meals the linear equations are solved exactly; at each meal stored bile is completely emptied, fraction $f_r$ returns to gut and the remainder is lost. Future-AUC calculation assumes meals continue indefinitely. There is no separate conjugate, first-pass loss or partial gallbladder emptying, so this is not a fitted mycophenolate model or a prediction of a sequestrant's clinical effect. CELLCEPT's current official label was read directly for the named empirical example.`,
      deps: ['pharm-2.7', 'pma-3.26'],
      refs: ['CELLCEPT official prescribing information, DailyMed setid37241e87-4af4-4dc3-a1aa-ea6f20d8dc40, section 12.3 Metabolism and Drug Interaction Studies/Cholestyramine; read2026-10-19'],
      links: { source: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=37241e87-4af4-4dc3-a1aa-ea6f20d8dc40' },
      tags: ['biliary excretion', 'reabsorption'],
      verify: false,
      viz(v) {
        const {dose:D,volume:V,clearance:CLt,absorptionRate:ka}=RECIRCULATION,TEND=72;
        const fb = v.slider('biliary share of elimination $f_b$', 0, 0.9, 0.5, { step: 0.05 });
        const fr = v.slider('reabsorbed fraction $f_r$', 0, 1, 0.8, { step: 0.05 });
        const gap = v.slider('time between meals (h)', 4, 10, 6, { step: 0.5 });
        const first = v.slider('first meal at (h)', 2, 8, 4, { step: 0.5 });
        const sP = v.stage({ x: [0, 48], y: [0, 3], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 330, weight: 1.2, minWidth: 260 });
        const sG = v.stage({ x: [0, 48], y: [0, 40], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'amount (mg)', height: 330, weight: 1, minWidth: 250 });
        const sim = memo();
        const run=(fbv,frv)=>recirculation(fbv,frv,gap.value,first.value);
        let info = null;
        v.render(() => {
          const S = sim(`${fb.value}|${fr.value}|${gap.value}|${first.value}`, () => ({ w: run(fb.value, fr.value), wo: run(0, 0) }));
          const peaks=recirculationPeaks(S.w).secondary.map(p=>p.time),c=S.w.c,t=S.w.t;
          const lastMeal = S.w.meals[S.w.meals.length - 1];
          info = { ratio: S.w.totalAuc/S.wo.totalAuc, pred: 1 / (1 - fb.value * fr.value), peaks, meals: S.w.meals.length, tailLeft: S.w.end.GB + S.w.end.G, lastMeal, auc:S.w.auc,tail:S.w.tail,mass:S.w.mass,end:S.w.end };
          sP.setView([-2,TEND+2],[-.1,Math.max(...S.wo.c,...S.w.c)*1.3+.1]);
          S.w.meals.forEach((m) => { if (m <= TEND) sP.vline(m, { color: 'orange', alpha: 0.5, dash: [3, 4] }); });
          sP.path(S.wo.t.map((tt, i) => [tt, S.wo.c[i]]), { color: 'muted', dash: [6, 4], width: 1.8 });
          sP.path(S.w.t.map((tt, i) => [tt, S.w.c[i]]), { color: 'accent', width: 2.6 });
          peaks.filter((p)=>p<TEND).forEach((p) => sP.dot(p, c[idxAt(t, p)], { r: 4.5, color: 'gold' }));
          S.w.meals.forEach((m) => { if (m <= TEND) sG.vline(m, { color: 'orange', alpha: 0.5, dash: [3, 4] }); });
          sG.setView([-2,TEND+2],[-2,Math.max(5,...S.w.gb)*1.2]);
          sG.poly([...S.w.t.map((tt, i) => [tt, S.w.gb[i]]), [TEND, 0], [0, 0]], { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 2 });
        });
        v.legend([['accent', 'with recirculation'], ['muted', 'no recirculation', { dash: true }], ['orange', 'meal (gallbladder empties)', { dash: true }], ['gold', 'secondary peak', { dot: true }]]);
        v.readout(()=>`infinite-time AUC ratio ${v.fix(info.ratio,3)}; geometric prediction $1/(1-f_bf_r)=${v.fix(info.pred,3)}$\nAUC through 72 h ${v.fix(info.auc,2)} + exact future exposure ${v.fix(info.tail,2)} mg·h/L; mass accounted for ${v.fix(info.mass,6)} of 100 mg\n${info.peaks.length} secondary local maxima detected after the first peak within 72 h; gut+bile at 72 h ${v.fix(info.tailLeft,2)} mg`);

      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num:'3.12',kind:'Paper',name:'Context-Sensitive Half-Time in Multicompartment Models',
      paper:{authors:'Michael A. Hughes, Peter S. A. Glass and James R. Jacobs',year:1992,title:'Context-sensitive half-time in multicompartment pharmacokinetic models for intravenous anesthetic drugs',venue:'Anesthesiology 76(3):334–341',doi:'10.1097/00000542-199203000-00003'},introduces:['pharm-3.5'],
      statement:String.raw`The original abstract describes simulations of six intravenous anaesthetic drugs using infusions designed to maintain a constant plasma concentration, for contexts from one minute to eight hours and to steady state. The **context-sensitive half-time** measures a 50% plasma decline after stopping. Reported simulated half-times ranged from 1 to 306 minutes, differing from elimination half-lives of 111–577 minutes. These are central-compartment kinetic results, not measured times to patient recovery.`,
      idea:String.raw`In a linear compartment model, tissue loading at the stop depends on the prior infusion. A concentration-holding input requires a loading bolus and decreasing maintenance rate; a constant-rate input produces another starting state. Subsequent redistribution and elimination determine the time to halve the concentration. The chosen examples below let us test these mathematical differences without inferring clinical recovery or reproducing published parameter estimates.`,
      caption:String.raw`Six **chosen teaching models**, labelled drug-like, illustrate half-time versus infusion duration. They do not reconstruct the paper's curves or parameter tables. Dots mark the selected context. Solid bars compare that half-time with each chosen model's terminal half-life. Switch between concentration-holding and constant-rate infusions to see how the input definition changes the result.`,
      scope:String.raw`The original PubMed abstract was read directly and explicitly confirms a concentration-holding infusion. The full original paper and its parameter tables remain unavailable in this review, so the source-review flag remains open. All six numerical parameter sets are chosen illustrations, not published fits or measured drug comparisons; their ranking and range do not validate the original study. Plasma halving is not an effect-site or waking-time prediction.`,
      credit:'Hughes, Glass & Jacobs, 1992',deps:['pharm-3.1','pharm-2.4'],refs:['Hughes, Glass & Jacobs, Anesthesiology76(3):334–341 (1992), PMID1539843, original abstract read 2026-10-19; full paper/parameter tables unavailable'],tags:['paper','anaesthesia'],verify:true,links:{doi:'https://doi.org/10.1097/00000542-199203000-00003',source:'https://pubmed.ncbi.nlm.nih.gov/1539843/'},
      viz(v){
        const DRUGS=illustrativeAnaesthetics(),Tn=v.slider('infusion duration (min)',1,480,120,{log:true,sig:2}),mode=v.select('infusion',[{value:'hold',label:'holds concentration'},{value:'rate',label:'constant rate'}],'hold');
        const sL=v.stage({x:[.9,530],y:[0,120],xlog:true,axes:'box',gutter:true,xlabel:'infusion duration (min, log)',ylabel:'chosen-model half-time (min)',height:350,weight:1.2,minWidth:270}),sR=v.stage({x:[0,6],y:[.5,2000],ylog:true,axes:'box',gutter:true,xlabel:'chosen model (drug-like)',ylabel:'minutes (log)',height:350,weight:1,minWidth:250,xticks:DRUGS.map((d,i)=>[i+.5,['fent','alf','suf','prop','mid','thio'][i]])});
        const fn=(m,T)=>contextProfile(m,T,mode.value).half,cache=memo();let info;
        v.render(()=>{
          const curves=cache(mode.value,()=>DRUGS.map(d=>Array.from({length:49},(_,i)=>{const T=10**(i/48*Math.log10(480));return[T,fn(d.m,T)];}))),T=Tn.value,here=DRUGS.map(d=>fn(d.m,T)),term=DRUGS.map(d=>contextProfile(d.m,T,mode.value).terminal),all=curves.flat().map(p=>p[1]);
          sL.setView([.9,530],[-Math.max(...all)*.03,Math.max(...all)*1.1]);sR.setView([0,6],[Math.min(1,...here)*.65,Math.max(...term,...here)*1.3]);
          DRUGS.forEach((d,i)=>{sL.path(curves[i],{color:d.color,width:2.4});sL.dot(T,here[i],{r:5,color:d.color});sR.rect(i+.1,1,i+.5,here[i],{fill:d.color,fillAlpha:.55,color:d.color,width:1.5});sR.rect(i+.5,1,i+.9,term[i],{fill:d.color,fillAlpha:.12,color:d.color,width:1.5,hatch:true});});sL.vline(T,{color:'gold',alpha:.5,width:2});
          info={T,mode:mode.value,here,term,range:[Math.min(...all),Math.max(...all)]};
        });
        v.legend(DRUGS.map(d=>[d.color,d.label]));v.readout(()=>`Chosen models at ${sig(info.T,3)} min (${info.mode==='hold'?'concentration-holding':'constant-rate'}): half-time / terminal half-life (min): ${DRUGS.map((d,i)=>`${d.label} ${sig(info.here[i],3)} / ${sig(info.term[i],3)}`).join('; ')}. Across plotted contexts: ${sig(info.range[0],3)}–${sig(info.range[1],3)} min. Published parameter-table reconstruction remains unverified.`);
      },
    },
  ],
};
