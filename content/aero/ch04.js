import {sectionAudit,criticalMachAudit,localMachAudit,kornAudit,waveDragAudit,KORN_OFFSET_AUDIT,sweepVectorsAudit} from './source-audit-compressibility.js';
// Aerospace Engineering — Chapter 4: Compressibility and high-speed flight (items 4.1-4.4; 4.5-4.8 are in ch04-b.js)
//
// Source audit October19,2026: MIT16.100 lectures36–37 (complete notes),
// Jones NACA TN1033 (original authored analysis), and Mason2006 ch7 relevant sections/equations.
// Historical priority and unsourced auxiliary correction laws are not asserted.
// 4.4 preserves its earlier area-rule audit and formula.

import {
  DEG, cpCrit, pgCorr,
  LBODY, fusIdeal, wingHump, areaCoeffs, dragOfK, sears,
} from './ch04.shared.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '\u2212');

export default {
  collection: 'aero',
  chapter: 4,
  title: 'Compressibility and high-speed flight',
  summary: String.raw`As flight speed approaches the speed of sound, air compresses noticeably: pressure coefficients grow, local supersonic regions appear and shock waves bring a steep rise in drag. Simple corrections handle subsonic compressibility, swept wings and the area rule delay the drag rise, and in supersonic flow oblique shocks and expansion fans replace smooth turning. At hypersonic speeds, heating becomes the dominant design problem.`,
  items: [
    // ── 4.1: linear small-disturbance model and its sonic diagnostic
    {
      num:'4.1',kind:'Model',name:'Prandtl–Glauert compressibility correction',
      statement:String.raw`For a two-dimensional thin section at small incidence, the linear subsonic small-disturbance model gives $C_p=C_{p,0}/\beta$, with $\beta=\sqrt{1-M_\infty^2}$. Integrating the same pressure correction gives $c_l=c_{l,0}/\beta$ and the thin-airfoil slope $2\pi/\beta$ per radian. This is a local approximation requiring small disturbances and wholly subsonic flow. Its divergence as $M_\infty\to1$ signals failure of the approximation.`,
      idea:String.raw`The linear equation is $\beta^2\phi_{xx}+\phi_{yy}=0$. Set $\xi=x$, $\eta=\beta y$ and $\Phi=\beta\phi$. Then $\Phi_{\xi\xi}+\Phi_{\eta\eta}=0$, and the flattened boundary condition $\Phi_\eta(x,0)=V_\infty y'(x)$ is unchanged. Thus $\phi_x=\Phi_\xi/\beta$, and $C_p\simeq-2\phi_x/V_\infty$ gives the correction for the same linearized section. Equating its suction peak to the isentropic sonic pressure coefficient estimates the onset of local sonic flow; it does not solve the flow beyond it.`,
      caption:String.raw`Left: the incompressible panel calculation and its Prandtl–Glauert correction, with full pressure ranges. The sonic threshold is drawn when it lies in that range; its numerical value is always shown. Right: positive suction magnitude and the sonic threshold on a **log pressure axis**, over the full Mach control range. Their intersection estimates critical Mach. Above that crossing, the extrapolated curve is only a diagnostic of the linear model's failure.`,
      scope:String.raw`Steady inviscid two-dimensional linear small-disturbance flow. No universal Mach cutoff guarantees validity: thickness, incidence and local acceleration matter. The rounded NACA sections and full incompressible panel solution are a teaching input, not experimental data or a transonic solver. A negative extrapolated static pressure has no isentropic Mach interpretation. The display uses the inspected MIT derivation; no historical priority claim is made.`,
      deps:['aero-2.2','aero-1.6'],refs:['MIT16.100, lectures36–37, Subsonic Small Disturbance Potential Flow / Critical Mach Number; complete authored notes read 2026-10-19'],links:{source:'https://ocw.mit.edu/courses/16-100-aerodynamics-fall-2005/pages/lecture-notes/'},tags:['compressibility','subsonic','similarity'],verify: false,
      viz(v){
        const M=v.slider('free-stream Mach number $M_\\infty$',.1,.95,.6,{step:.005}),al=v.slider('angle of attack $\\alpha$ (°)',0,8,3,{step:.1}),tc=v.select('thickness',[.06,.09,.12,.18].map(value=>({value,label:`${100*value} %`})),.12);
        const A=v.stage({x:[-.025,1.025],y:[-2,3],axes:'box',gutter:true,height:330,minWidth:300,xlabel:'chord $x/c$',ylabel:'$-C_p$',title:'linear pressure model'}),B=v.stage({x:[.08,.97],y:[.01,100],ylog:true,axes:'box',gutter:true,height:330,minWidth:300,xlabel:'Mach number $M_\\infty$',ylabel:'positive suction magnitude (log)',title:'sonic-onset estimate'});let info;
        v.render(()=>{
          const m=M.value,d=sectionAudit(+tc.value,al.value),beta=Math.sqrt(1-m*m),pg=d.cp.map(c=>c/beta),critical=cpCrit(m),values=[...d.cp,...pg].map(c=>-c),lo=Math.min(-1,...values),hi=Math.max(1,...values),pad=(hi-lo)*.12;
          A.setView([-.025,1.025],[lo-pad,hi+pad]);A.hline(0,{color:'faint'});A.path(d.xs.map((x,i)=>[x,-d.cp[i]]),{color:'muted',width:1.8});A.path(d.xs.map((x,i)=>[x,-pg[i]]),{color:'accent',width:2.6});
          const thresholdVisible=-critical>=lo&&-critical<=hi;
          if(thresholdVisible)A.hline(-critical,{color:'red',dash:true,width:1.6});
          A.text(thresholdVisible?'sonic threshold shown':'sonic threshold above plot',.02,hi+pad*.35,{color:'red',size:11,align:'left'});
          const ms=Array.from({length:181},(_,i)=>.1+.85*i/180),peak=ms.map(x=>[x,-pgCorr(d.minimum,x)]),sonic=ms.map(x=>[x,-cpCrit(x)]),all=[...peak,...sonic].map(p=>p[1]),mc=criticalMachAudit(d.minimum),point=-pgCorr(d.minimum,m);
          B.setView([.08,.97],[Math.min(...all)*.65,Math.max(...all)*1.4]);B.path(peak,{color:'accent',width:2.4});B.path(sonic,{color:'red',width:2});B.dot(mc,-cpCrit(mc),{r:5,color:'ink'});B.vline(m,{color:'gold',dash:true});B.dot(m,point,{r:5,color:'gold'});
          info={m,d,beta,critical,peak:-point,mc,local:localMachAudit(-point,m),thresholdVisible};
        });v.legend([['muted','incompressible pressure'],['accent','Prandtl–Glauert'],['red','sonic threshold'],['gold','selected Mach']]);
        v.readout(()=>`$\\beta=${fx(info.beta,4)}$, $1/\\beta=${fx(1/info.beta,4)}$. Peak $C_{p,0}=${fx(info.d.minimum,4)}$ → $C_p=${fx(info.peak,4)}$; sonic $C_p^*=${fx(info.critical,4)}$. Estimated $M_{cr}=${fx(info.mc,4)}$. ${info.m>=info.mc?'At or beyond estimated sonic onset: extrapolated pressures do not predict an actual supersonic pocket or shock.':'Below estimated sonic onset; the small-disturbance assumption must still hold.'} ${info.local===null?'Extrapolated static pressure is nonpositive: no physical isentropic local Mach.':`Isentropic local-Mach diagnostic: ${fx(info.local,3)}.`} Linear lift $c_{l,0}=${fx(info.d.cl,4)}$ → $c_l=${fx(info.d.cl/info.beta,4)}$.`);
      },
    },
    // ── 4.2: two independently labelled engineering estimates
    {
      num:'4.2',kind:'Phenomenon',name:'Critical Mach number and drag divergence',
      statement:String.raw`The critical Mach number marks the first local sonic point. Higher flight Mach commonly produces supersonic regions, shocks and a rapid drag rise, with viscous effects often important. One drag-divergence convention is $dC_D/dM=0.1$. Mason's engineering estimate combines $M_{dd}=\kappa-t/c-c_l/10$ with $C_{Dw}=20\max(0,M-M_{cr,K})^4$, where $M_{cr,K}=M_{dd}-(0.1/80)^{1/3}$. This correlation and a pressure-based estimate of sonic onset need not agree.`,
      idea:String.raw`Differentiating the chosen fourth-power rise gives $80(M-M_{cr,K})^3$. Setting it to 0.1 yields the displayed offset exactly. Korn's technology factor describes achievable airfoil capability; selecting a higher value here shifts the drag correlation, while leaving the chosen NACA section and its pressure estimate unchanged. Neither calculation locates an actual shock.`,
      caption:String.raw`Left: selected NACA section, with panels coloured orange where a **linear pressure extrapolation** crosses the sonic threshold. No shock position is inferred. Right: the complete Korn/Lock drag curve, its own onset and divergence markers, and the separate pressure-based sonic estimate. Change thickness or incidence, then change technology: only the drag estimate responds to technology.`,
      scope:String.raw`The panel/Prandtl–Glauert calculation is a subsonic diagnostic; its orange markers are not a solved supersonic region. The independent engineering drag correlation uses inspected Mason equations7-3–9 and a chosen base drag0.008. Choosing κ=0.95 does not turn the NACA geometry into a supercritical airfoil. High-Mach extrapolations are displayed for comparison, without experimental or separation predictions.`,
      credit:'Korn/Lock correlation as derived and discussed by W.H. Mason (2006), §7.4.3 and §7.5.2',deps:['aero-4.1'],refs:['Mason, Configuration Aerodynamics, 2006 ch7 §§7.1–2,7.4.3,7.5.2; complete relevant sections and equations read 2026-10-19'],links:{source:'https://archive.aoe.vt.edu/mason/Mason_f/ConfigAeroTransonics.pdf'},tags:['transonic','wave drag','shock'],verify: false,
      viz(v){
        const M=v.slider('Mach number $M_\\infty$',.5,.95,.8,{step:.005}),al=v.slider('angle of attack $\\alpha$ (°)',0,6,2,{step:.1}),tc=v.select('thickness',[.06,.09,.12,.15].map(value=>({value,label:`${100*value} %`})),.12),kap=v.select('correlation technology',[{value:.87,label:'conventional κ=0.87'},{value:.95,label:'supercritical κ=0.95'}],.87);
        const A=v.stage({x:[-.08,1.08],y:[-.3,.3],equal:true,axes:false,height:300,minWidth:300,title:'linear sonic-threshold diagnostic'}),B=v.stage({x:[.3,1.03],y:[0,.1],axes:'box',gutter:true,height:300,minWidth:300,xlabel:'Mach number $M_\\infty$',ylabel:'chosen-model $C_D$',title:'independent drag correlation'});let info;
        v.render(()=>{
          const d=sectionAudit(+tc.value,al.value),m=M.value,a=al.value*DEG,rot=([x,y])=>[(x-.25)*Math.cos(a)+y*Math.sin(a)+.25,-(x-.25)*Math.sin(a)+y*Math.cos(a)],crit=cpCrit(m),indices=d.cp.map((cp,i)=>pgCorr(cp,m)<crit?i:-1).filter(i=>i>=0);
          A.poly(d.points.map(rot),{fill:'ink',fillAlpha:.1,color:'ink',width:1.6});for(const i of indices){const p=rot([d.xs[i],d.ys[i]]);A.dot(...p,{r:3.2,color:'orange'});}A.arrow(.02,.2,.2,.2,{color:'accent',width:2});A.text('linear estimate only',.03,.25,{color:'muted',size:11,align:'left'});
          const cl=Math.max(0,d.cl),mdd=kornAudit(+kap.value,+tc.value,cl),mcrit=mdd-KORN_OFFSET_AUDIT,mcrP=criticalMachAudit(d.minimum),xmin=Math.min(.48,mcrit,mcrP)-.04,xmax=1.04,cd=x=>.008+waveDragAudit(x,mcrit),top=cd(1)*1.17;
          B.setView([xmin,xmax],[-top*.04,top]);B.fn(cd,{domain:[Math.max(.3,xmin+.02),1],color:'accent',width:2.8});
          for(const[x,color,label,frac]of[[mdd,'green','Korn divergence',.94],[mcrit,'purple','Korn onset',.84],[mcrP,'orange','pressure onset',.74]]){B.vline(x,{color,dash:true,width:1.3});B.text(label,xmin+.02,top*frac,{color,size:10.5,align:'left'});}
          B.dot(m,cd(m),{r:5,color:'gold'});info={m,cl,mdd,mcrit,mcrP,cd:cd(m),nsup:indices.length,kappa:+kap.value};
        });v.legend([['accent','Korn/Lock drag'],['orange','pressure diagnostic'],['purple','Korn onset'],['green','Korn divergence']]);
        v.readout(()=>`Pressure sonic estimate ${fx(info.mcrP,4)}; independent Korn onset ${fx(info.mcrit,4)}, divergence ${fx(info.mdd,4)}. Technology κ=${fx(info.kappa)}; actual chosen section's incompressible $c_l=${fx(info.cl,4)}$. At selected Mach ${fx(info.m,3)}, ${info.nsup} panel estimates cross the sonic threshold; no actual shock is located. Model $C_D=${fx(info.cd,5)}$. Analytic drag slope at divergence: ${fx(80*(info.mdd-info.mcrit)**3,5)}.`);
      },
    },
    // ── 4.3: cylindrical-wing normal flow versus the strip correlation
    {
      num:'4.3',kind:'Method',name:'Swept wings delay drag divergence',
      statement:String.raw`For an infinite cylindrical wing in inviscid flow, translation along its span does not change the cross-sectional flow. Leading-edge sweep Λ resolves the free stream into normal and spanwise components with magnitudes $V_\infty\cos\Lambda$ and $V_\infty\sin\Lambda$. This suggests a normal-flow Mach estimate $M_n=M_\infty\cos\Lambda$. A separate swept-strip engineering correlation is
$$M_{dd}=\frac\kappa{\cos\Lambda}-\frac{t/c}{\cos^2\Lambda}-\frac{c_l}{10\cos^3\Lambda}.$$
The two uses of sweep have different geometric meanings and assumptions.`,
      idea:String.raw`Jones's cylindrical-wing analysis uses leading-edge sweep and a normal section. Mason's drag correlation uses half-chord sweep, streamwise thickness and the strip's lift coefficient. Here the same numerical angle is assigned to both for comparison; the drawn tapered wing is schematic, not a strip integration. At fixed thickness and lift, the cosine estimate $M_{dd,0}/\cos\Lambda$ exceeds the correlation by $(t/c)(\sec^2\Lambda-\sec\Lambda)+(c_l/10)(\sec^3\Lambda-\sec\Lambda)$. At high loading, even the correlation's benefit can turn over with increasing sweep.`,
      caption:String.raw`Left: a schematic swept planform with the actual perpendicular and parallel projections of the downward free-stream vector. The two coloured vectors add to the black vector. Middle: compare the cosine estimate with the Korn strip correlation. Right: complete model drag curves. The assigned sweep can produce values outside ordinary transonic use; they remain explicitly extrapolations.`,
      scope:String.raw`The normal-flow argument assumes a cylindrical wing away from ends; it is not exact for the finite tapered planform drawn. Sweep reduces lift slope and introduces structural, stall and viscous tradeoffs not computed here. For the Korn calculation, Λ means half-chord sweep rather than the leading-edge angle used for vector geometry. A real tapered wing needs separate geometry and strip integration; setting both angles numerically equal is a teaching comparison. No aircraft prediction or historical priority claim is made.`,
      credit:'R.T. Jones, NACA TN1033 (March1946, analysis dated June23,1945); Mason2006 §7.5.2 for the separate correlation',deps:['aero-4.2'],refs:['Jones, Wing Plan Forms for High-Speed Flight, NACA TN1033, original authored analysis read 2026-10-19','Mason, Configuration Aerodynamics2006, ch7 §7.5.2 equations7-4–9'],links:{primary:'https://ntrs.nasa.gov/api/citations/19930081951/downloads/19930081951.pdf',correlation:'https://archive.aoe.vt.edu/mason/Mason_f/ConfigAeroTransonics.pdf'},tags:['sweep','transonic','wing design'],verify: false,
      viz(v){
        const sw=v.slider('assigned sweep $\\Lambda$ (°)',0,60,30,{step:1}),tc=v.slider('streamwise thickness $t/c$',.06,.15,.1,{step:.005}),cl=v.slider('strip lift coefficient $c_l$',0,.8,.4,{step:.02}),kap=v.select('correlation technology',[{value:.87,label:'conventional'},{value:.95,label:'supercritical'}],.87);
        const P=v.stage({x:[-.72,.72],y:[-.55,1.12],equal:true,axes:false,height:320,minWidth:260,title:'schematic leading-edge sweep'}),B=v.stage({x:[-3,63],y:[.3,2],axes:'box',gutter:true,height:320,minWidth:270,xlabel:'assigned sweep (°)',ylabel:'$M_{dd}$',title:'two different approximations'}),C=v.stage({x:[.55,1.15],y:[0,.1],axes:'box',gutter:true,height:320,minWidth:270,xlabel:'flight Mach number',ylabel:'chosen-model $C_D$',title:'drag correlation, including extrapolation'});let info;
        v.render(()=>{
          const L=sw.value*DEG,k=+kap.value,t=tc.value,c=cl.value,m0=kornAudit(k,t,c),mdd=kornAudit(k,t,c,L),vectors=sweepVectorsAudit(L),wing=sgn=>[[0,.75],[sgn*.55,.75-.55*Math.tan(L)],[sgn*.55,.63-.55*Math.tan(L)],[0,.47]];
          P.poly([[-.03,1],[.03,1],[.03,.05],[0,-.02],[-.03,.05]],{fill:'ink',fillAlpha:.12,color:'ink'});P.poly(wing(1),{fill:'accent',fillAlpha:.2,color:'accent'});P.poly(wing(-1),{fill:'accent',fillAlpha:.2,color:'accent'});
          const origin=[.3,.75-.3*Math.tan(L)-.05],scale=.38,to=w=>[origin[0]+scale*w[0],origin[1]+scale*w[1]];
          P.arrow(...origin,...to([0,-1]),{color:'ink',width:3});P.arrow(...origin,...to(vectors.across),{color:'green',width:2});if(sw.value>0)P.arrow(...origin,...to(vectors.along),{color:'purple',width:2});P.line(...to(vectors.across),...to([0,-1]),{color:'purple',dash:true});P.line(...to(vectors.along),...to([0,-1]),{color:'green',dash:true});P.text(`assigned angle ${sw.value}°`,0,1.04,{size:11,color:'accent',align:'center'});
          const angles=Array.from({length:241},(_,i)=>i/4),cosine=angles.map(x=>[x,m0/Math.cos(x*DEG)]),korn=angles.map(x=>[x,kornAudit(k,t,c,x*DEG)]),all=[...cosine,...korn].map(p=>p[1]),lo=Math.min(...all),hi=Math.max(...all),pad=(hi-lo+.1)*.15;
          B.setView([-3,63],[lo-pad,hi+pad]);B.path(cosine,{color:'orange',dash:true,width:2});B.path(korn,{color:'accent',width:2.6});B.dot(sw.value,mdd,{r:5,color:'gold'});B.vline(sw.value,{color:'gold',dash:true});
          const drag0=x=>.008+waveDragAudit(x,m0-KORN_OFFSET_AUDIT),drag=x=>.008+waveDragAudit(x,mdd-KORN_OFFSET_AUDIT),top=Math.max(drag0(1.1),drag(1.1)) *1.15;
          C.setView([.53,1.17],[-top*.04,top]);C.fn(drag0,{domain:[.55,1.1],color:'muted',width:2});C.fn(drag,{domain:[.55,1.1],color:'accent',width:2.6});if(m0>=.55&&m0<=1.1)C.vline(m0,{color:'muted',dash:true});if(mdd>=.55&&mdd<=1.1)C.vline(mdd,{color:'accent',dash:true});
          info={m0,mdd,cosine:m0/Math.cos(L),vectors,L,normalMach:mdd*Math.cos(L)};
        });v.legend([['ink','free stream'],['green','normal component'],['purple','spanwise component'],['accent','Korn correlation'],['orange','cosine estimate'],['muted','unswept drag']]);
        v.readout(()=>`Korn $M_{dd,0}=${fx(info.m0,4)}$, assigned-sweep $M_{dd}=${fx(info.mdd,4)}$; cosine estimate ${fx(info.cosine,4)}. Difference ${fx(info.cosine-info.mdd,4)}. Unit free-stream projections: normal (${info.vectors.across.map(x=>fx(x,4)).join(', ')}), spanwise (${info.vectors.along.map(x=>fx(x,4)).join(', ')}); sum (0, −1). Normal-Mach diagnostic at correlated divergence: ${fx(info.normalMach,4)}. Same assigned number, distinct leading-edge/half-chord angles; the plot is not a tapered-wing flow solution.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Principle',
      name: 'The area rule',
      statement: String.raw`At transonic and low supersonic speeds the wave drag of a slender aircraft depends mainly on how its **cross-sectional area $S(x)$** is distributed along its length, and hardly on the detailed shape. A wing–body combination has nearly the same zero-lift wave drag as the body of revolution that has the same $S(x)$. To keep the drag low, make the area distribution smooth, like that of the Sears–Haack body, which has the least wave drag for a given length $l$ and volume $V$:
$$\frac{D_w}{q}=\frac{128\,V^2}{\pi\,l^4}.$$
Since the wing adds area, the fuselage must be narrowed ('indented') where the wing is, so that the total area has no bump.`,
      idea: String.raw`In slender-body theory the far field of the body is that of a line source distribution with strength $S'(x)$, and the wave drag is a quadratic form in $S''(x)$ (von Kármán's integral), which can be written in Fourier form with $S(\theta)=\sum A_n\sin n\theta$ as $D_w/q=(6\pi/l^2)\sum nA_n^2$ in the units used here. A sudden bump in $S$ (a wing sitting on a straight fuselage) puts energy into the higher harmonics, which cost $n$ times as much as the fundamental; removing the bump by pinching the fuselage cancels those harmonics. At Mach 1 the planes of constant $x$ are the planes that matter, which is why the rule is stated for transonic speeds.`,
      caption: String.raw`Top: the aircraft seen from above (radial scale exaggerated) and its area distribution. Slide the **indentation** $k$ from 0 (straight fuselage) to 1 (fuselage area reduced by exactly the wing's area) and the grey bump in $S(x)$ flattens into the ideal curve. Bottom: the wave drag, in units of the Sears–Haack minimum for the same volume, against $k$, from the Fourier formula; the dot is your setting. Make the wing larger or move it, and see the benefit change.`,
      deps: ['aero-4.2'],
      refs: ['Anderson ch. 5'],
      tags: ['area rule', 'wave drag', 'transonic'],
      scope: String.raw`Slender bodies at zero lift in transonic and low supersonic flow (the slender-body limit). The wing's cross-sectional-area hump is a smooth $\sin^2$ model and the aircraft is a schematic, not a particular design; drag is slender-body wave drag only (no friction, no separation, no lift-dependent drag). For a finite Mach number above 1 the relevant cuts are slanted at the Mach angle, which is not modelled.`,
      credit: 'R. T. Whitcomb, NACA Langley, 1952 (NACA RM L52H08); slender-body drag formula: von Kármán, Sears and Haack',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Area_rule' },
      viz(v) {
        const kS = v.slider('indentation $k$', 0, 1, 0.5, { step: 0.01 });
        const awS = v.slider('wing area hump $A_w/A_f$', 0.05, 0.6, 0.3, { step: 0.01 });
        const xwS = v.slider('wing position $x_w/l$', 0.2, 0.6, 0.35, { step: 0.01 });
        const Af = 0.006, ww = 0.4;
        const T = v.stage({ x: [0, 1], y: [-0.4, 0.4], axes: false, height: 220, minWidth: 340, full: true, title: 'top view (radial scale exaggerated)' });
        const S = v.stage({ x: [0, 1], y: [0, Af * 1.35], axes: 'box', gutter: true, height: 240, minWidth: 320, xlabel: 'station $x/l$', ylabel: 'area $S(x)$', title: 'cross-sectional area' });
        const D = v.stage({ x: [0, 1], y: [0.9, 1.6], axes: 'box', gutter: true, height: 240, minWidth: 280, xlabel: 'indentation $k$', ylabel: '$D_w/D_{\\mathrm{SH}}$', title: 'wave drag' });
        let info = {};
        v.render(() => {
          const k = kS.value, Aw = awS.value * Af, xw = xwS.value, co = areaCoeffs(Af, Aw, xw, ww);
          const fus = (x) => Math.max(0, fusIdeal(x, Af) - k * wingHump(x, Aw, xw, ww)), tot = (x) => fus(x) + wingHump(x, Aw, xw, ww);
          // top view: fuselage radius from the fuselage area, exaggerated by 4.5
          const r = (x) => Math.sqrt(fus(x) / Math.PI) * 1.8;
          const up = [], lo = []; for (let i = 0; i <= 120; i++) { const x = i / 120; up.push([x, r(x)]); lo.push([x, -r(x)]); }
          T.poly(up.concat(lo.reverse()), { fill: 'ink', fillAlpha: 0.14, color: 'ink', width: 1.6 });
          const wr = 0.1 + 0.35 * Math.sqrt(Aw / Af); // schematic semi-span
          const wing = (s) => [[xw, s * r(xw)], [xw + ww * 0.55, s * wr * 1.0], [xw + ww * 0.9, s * wr], [xw + ww, s * r(xw + ww)]];
          T.poly(wing(1), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 }); T.poly(wing(-1), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          // area plot
          const V = (() => { let s = 0; for (let i = 0; i < 600; i++) s += tot((i + 0.5) / 600) / 600; return s; })();
          const sh = sears(V, LBODY);
          S.fn(sh.S, { color: 'green', dash: true, width: 2, domain: [0, 1] });
          S.fn(tot, { color: 'accent', width: 2.8, domain: [0, 1], fill: true, base: 0 });
          S.fn((x) => wingHump(x, Aw, xw, ww) * (1 - k) + fusIdeal(x, Af), { color: 'muted', width: 1, domain: [0, 1] });
          // drag against k
          const dsh = (kk) => { let vv = 0; for (let i = 0; i < 300; i++) { const x = (i + 0.5) / 300; vv += (fusIdeal(x, Af) + (1 - kk) * wingHump(x, Aw, xw, ww)) / 300; } return dragOfK(co, kk) / sears(vv, LBODY).dq; };
          const ks = []; for (let i = 0; i <= 40; i++) ks.push(i / 40);
          const vals = ks.map(dsh); D.setView([0, 1], [0.95, Math.max(1.2, Math.max(...vals) * 1.08)]);
          D.hline(1, { color: 'green', dash: true, width: 1.4 }); D.path(ks.map((x, i) => [x, vals[i]]), { color: 'accent', width: 2.8 });
          D.dot(k, dsh(k), { r: 6, color: 'gold' });
          info = { dq: dragOfK(co, k), dq0: dragOfK(co, 0), dq1: dragOfK(co, 1), V, sh: sh.dq, ratio: dsh(k) };
        });
        v.legend([['accent', 'total $S(x)$'], ['green', 'Sears–Haack, same volume', { dash: true }], ['muted', 'fuselage + wing, straight']]);
        v.readout(() => {
          const { dq, dq0, dq1, V, sh, ratio } = info;
          return `Slender-body wave drag $D_w/q=${fx(dq * 1e4, 3)}\\times10^{-4}$ (units of $l^2$); with a straight fuselage ($k=0$) $${fx(dq0 * 1e4, 3)}\\times10^{-4}$, fully indented ($k=1$) $${fx(dq1 * 1e4, 3)}\\times10^{-4}$: a reduction of $${fx(100 * (1 - dq1 / dq0), 1)}\\%$. `
            + `Volume $V=${fx(V * 1e3, 3)}\\times10^{-3}\\,l^3$; Sears–Haack minimum $128V^2/(\\pi l^4)=${fx(sh * 1e4, 3)}\\times10^{-4}$, so you are at ${fx(ratio, 3)} times the minimum${Math.abs(ratio - 1) < 0.005 ? ' (at the minimum: the area distribution is the ideal one)' : ''}.`;
        });
      },
    },
  ],
};
