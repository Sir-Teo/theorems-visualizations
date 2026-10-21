import {normalStressState,mohrCoulombState} from './source-audit-failure.js';
// Solid Mechanics & Structures — Chapter 4: Failure, plasticity and fatigue (items 4.1–4.5; 4.6–4.10 are in ch04-b.js)
//
// Everything here is computed from the formulas in the statements. The yield stress Y = 250 MPa, the
// 207 MPa tensile threshold in 4.3 and the soil numbers are chosen illustrations. Steel curve in 4.5: S355 data of chapter 1.
// Credits checked: Tresca 1864 and Huber 1904 / von Mises 1913 / Hencky 1924 (Wikipedia "Yield surface"); Taylor & Quinney 1931
// (Crossref 10.1098/rsta.1932.0009). Items 4.3–4.4 cite directly read engineering model documentation; no historical date or material fit is claimed.

import { num as num0, prin2, rad, deg, vm2, tresca2, tresca3, hexagon, ellipse, rayVM, rayTresca, curveOf, MATS } from './ch04.shared.js';

const num = (x, d = 1) => num0(x, d).replace('-', '−');

export default {
  collection: 'solid',
  chapter: 4,
  title: 'Failure, plasticity and fatigue',
  summary: String.raw`When does a material yield or break under a combined state of stress? Yield criteria answer by reducing the stress tensor to one number — the largest shear stress, or the distortion energy — and comparing it with a tensile test. Brittle materials need different criteria, and repeated loading brings a separate failure mode altogether: fatigue, governed by S–N curves, mean-stress corrections and cumulative damage.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Principle',
      name: 'Tresca (maximum shear stress) criterion',
      statement: String.raw`A ductile metal that yields in a simple tension test at the stress $Y$ is assumed to yield, under any state of stress with principal values $\sigma_1\ge\sigma_2\ge\sigma_3$, when the largest shear stress reaches the value it has in that test:
$$\tau_{\max}=\frac{\sigma_1-\sigma_3}{2}=\frac Y2 .$$
Safe states satisfy $\sigma_1-\sigma_3<Y$. In the plane of the two non-zero principal stresses of a plane-stress state ($\sigma_3=0$) the yield locus is a **hexagon** with corners $(Y,0),(Y,Y),(0,Y),(-Y,0),(-Y,-Y),(0,-Y)$. The criterion does not depend on the mean stress: adding the same hydrostatic stress to all three principal stresses changes nothing.`,
      idea: String.raw`Plastic flow in metals is slip on crystal planes, driven by shear, so the largest shear stress is a natural measure of how close a state is to yielding. The state's largest Mohr circle (3.5) has radius $(\sigma_1-\sigma_3)/2$, and in a tension test the radius is $Y/2$; the criterion demands the same radius. The hexagon appears because $\sigma_1-\sigma_3$ must be computed from the largest and smallest of $\sigma_1,\sigma_2,0$, and which pair that is changes from sector to sector of the plane.`,
      caption: String.raw`Drag the gold point in the $(\sigma_1,\sigma_2)$ plane (the stress component $\sigma_3$ can be set with the slider; $\sigma_3=0$ is plane stress). The shaded region is safe; the black curve is the Tresca locus. On the right the three Mohr circles of the same state: the large one is the circle that decides, and it turns red when it touches the lines $\tau=\pm Y/2$. Move along the diagonal $\sigma_1=\sigma_2$ in the first quadrant: the locus is at $\sigma=Y$, whereas along $\sigma_1=-\sigma_2$ (pure shear) it is reached at $\tau=Y/2$.`,
      deps: ['solid-3.5'],
      refs: ['Gere–Goodno §7.6'],
      tags: ['yield', 'failure'],
      scope: String.raw`For ductile metals, quasi-static loading, no strong dependence on mean stress. Moderately conservative: it never predicts a higher strength than the von Mises criterion (4.2).`,
      credit: 'H. Tresca, 1864',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Yield_surface#Tresca_yield_surface' },
      viz(v) {
        const Y = 250;
        const s3 = v.slider('$\\sigma_3$ (MPa)', -250, 250, 0, { step: 5 });
        const A = v.stage({ x: [-400, 400], y: [-400, 400], equal: true, axes: true, height: 380, title: 'safe region in the (σ₁, σ₂) plane', xlabel: 'σ₁', ylabel: 'σ₂' });
        const B = v.stage({ x: [-330, 330], y: [-190, 190], equal: true, axes: true, height: 380, title: 'Mohr’s three circles', xlabel: 'σ', ylabel: 'τ' });
        const H = A.handle(150, 60, { color: 'gold', r: 8 });
        const sorted = () => [H.x, H.y, s3.value].sort((a, b) => b - a);
        v.legend([['accent', 'safe region', { area: true }], ['ink', 'Tresca locus']]);
        v.render(() => {
          const [a, b, c] = sorted(), tm = (a - c) / 2, yl = tresca3(a, b, c) >= Y - 1e-9;
          const key = 't' + s3.value;
          A.raster((x, y) => (tresca3(x, y, s3.value) < Y ? v.ramp(0.18, 'accent') : null), { key, res: 4 });
          A.axes();
          A.contour((x, y) => tresca3(x, y, s3.value), [Y], { color: 'ink', width: 2.6, res: 160 });
          if (s3.value === 0) A.path(hexagon(Y), { close: true, color: 'ink', width: 1.2, alpha: 0.4 });
          A.arrow(0, 0, H.x, H.y, { color: yl ? 'red' : 'gold', width: 1.6 });
          // Mohr circles
          const pairs = [[a, b], [b, c], [a, c]];
          pairs.forEach(([p, q], i) => {
            const big = i === 2;
            B.circle((p + q) / 2, 0, Math.abs(p - q) / 2, { color: big ? (yl ? 'red' : 'accent') : 'muted', width: big ? 2.6 : 1.4, fill: big ? (yl ? 'red' : 'accent') : undefined, fillAlpha: 0.07 });
          });
          B.hline(Y / 2, { color: 'orange', width: 1.4, dash: [6, 4] }); B.hline(-Y / 2, { color: 'orange', width: 1.4, dash: [6, 4] });
          B.tex(String.raw`\tau=Y/2`, 270, Y / 2 + 14, { size: 12, color: 'orange' });
          [a, b, c].forEach((q, i) => { B.dot(q, 0, { r: 5, color: yl ? 'red' : 'ink' }); B.tex(`\\sigma_${i + 1}`, q, i === 1 ? 18 : -18, { size: 12, color: 'ink' }); });
          B.dot((a + c) / 2, tm, { r: 5, color: 'gold' });
        });
        v.readout(() => {
          const [a, b, c] = sorted(), tm = (a - c) / 2;
          return `Principal stresses $(${num(a, 0)},\\,${num(b, 0)},\\,${num(c, 0)})$ MPa. · $\\tau_{\\max}=(\\sigma_1-\\sigma_3)/2=${num(tm, 1)}$ MPa against $Y/2=${Y / 2}$ → utilisation ${num((100 * tm) / (Y / 2), 0)} % (${tm >= Y / 2 - 1e-9 ? '**yield**' : 'safe'}). · Adding the same stress to all three principal values (hydrostatic shift) leaves $\\tau_{\\max}$ unchanged.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Principle',
      name: 'von Mises (distortion energy) criterion',
      statement: String.raw`Yielding of a ductile metal under a stress tensor $\boldsymbol\sigma$ begins when the von Mises equivalent stress reaches the tensile yield stress $Y$:
$$\sigma_{\rm vM}=\sqrt{3J_2}=\sqrt{\tfrac12\big[(\sigma_1-\sigma_2)^2+(\sigma_2-\sigma_3)^2+(\sigma_3-\sigma_1)^2\big]}=Y .$$
Equivalently the elastic energy of distortion (shape change at constant volume) per unit volume reaches $\dfrac{1+\nu}{3E}Y^2$. In plane stress it is the ellipse $\sigma_1^2-\sigma_1\sigma_2+\sigma_2^2=Y^2$; in pure shear it predicts yield at $\tau=Y/\sqrt3\approx0.577\,Y$. Like Tresca's criterion it ignores the hydrostatic part of the stress.`,
      idea: String.raw`Split the stress into hydrostatic and deviatoric parts (3.6). The hydrostatic part only changes volume, which metals resist elastically at stresses far beyond yield, so only the deviator $\mathbf s$ can matter, and by isotropy it can enter only through its invariants; $J_2=\tfrac12\mathbf s\!:\!\mathbf s$ is the simplest and is proportional to the distortion energy. Calibrating on the tension test ($J_2=Y^2/3$) fixes the constant. The ellipse passes through all six corners of the Tresca hexagon, so the two criteria agree in uniaxial and equibiaxial stress and differ most, by a factor $2/\sqrt3\approx1.155$, in pure shear.`,
      caption: String.raw`Drag the gold point: the readout compares the two criteria for the same stress state. The hexagon (orange) lies inside the ellipse and touches it at the six corners. On the right the distance to each locus along a ray at angle $\alpha$ (loading direction $(\cos\alpha,\sin\alpha)$) is plotted: the curves meet at $0^\circ,45^\circ,90^\circ,\dots$ and are furthest apart for $\alpha=135^\circ$ and $315^\circ$, pure shear. Taylor and Quinney's tension–torsion tests on thin tubes (1931) are usually quoted as favouring the ellipse; no test data are plotted here.`,
      deps: ['solid-3.6'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['yield', 'failure', 'invariants'],
      scope: String.raw`Ductile metals, isotropic, rate-independent loading. Not for soils, concrete or other pressure-dependent materials (4.4).`,
      credit: 'M. T. Huber, 1904; R. von Mises, 1913; H. Hencky, 1924',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Von_Mises_yield_criterion' },
      viz(v) {
        const Y = 250, E = 210000, nu = 0.3;
        const A = v.stage({ x: [-400, 400], y: [-400, 400], equal: true, axes: true, height: 380, title: 'Tresca hexagon inside the von Mises ellipse', xlabel: 'σ₁', ylabel: 'σ₂' });
        const B = v.stage({ x: [0, 360], y: [0, 1.5], axes: 'box', gutter: true, height: 380, xlabel: 'loading direction α (°)', ylabel: 'yield stress along the ray / Y', xticks: [0, 45, 90, 135, 180, 225, 270, 315, 360], title: 'distance to each locus along a ray' });
        const H = A.handle(120, -170, { color: 'gold', r: 8 });
        v.legend([['accent', 'von Mises'], ['orange', 'Tresca']]);
        v.render(() => {
          const e = ellipse(Y), h = hexagon(Y);
          A.poly(e, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2.4 });
          A.path(h, { close: true, color: 'orange', width: 2.4 });
          A.dots(h, { r: 4, color: 'orange' });
          A.arrow(0, 0, H.x, H.y, { color: 'gold', width: 1.6 });
          const al = Math.atan2(H.y, H.x);
          B.fn((d) => rayVM(rad(d)), { color: 'accent', width: 2.6, domain: [0, 360], n: 361 });
          B.fn((d) => rayTresca(rad(d)), { color: 'orange', width: 2.6, domain: [0, 360], n: 361 });
          const d0 = (deg(al) + 360) % 360;
          B.vline(d0, { color: 'muted', width: 1, dash: [4, 4] });
          B.dot(d0, rayVM(al), { r: 6, color: 'accent' }); B.dot(d0, rayTresca(al), { r: 6, color: 'orange' });
        });
        v.readout(() => {
          const a = H.x, b = H.y, vm = vm2(a, b), tr = tresca2(a, b), U = ((1 + nu) / (3 * E)) * vm * vm;
          return `$\\sigma_{\\rm vM}=${num(vm, 1)}$ MPa (${vm >= Y ? '**yielded**' : 'safe'}), Tresca value $\\sigma_1-\\sigma_3=${num(tr, 1)}$ MPa (${tr >= Y ? '**yielded**' : 'safe'}); ratio Tresca/von Mises $=${num(vm > 0 ? tr / vm : 1, 3)}\\in[1,\\,2/\\sqrt3=1.155]$. · Distortion energy $\\tfrac{1+\\nu}{3E}\\sigma_{\\rm vM}^2=${num(U * 1000, 1)}$ kJ/m³ ($E=210$ GPa, $\\nu=0.3$ assumed). · Pure shear yields at $\\tau=${num(Y / Math.sqrt(3), 1)}$ MPa (von Mises) versus $${num(Y / 2, 1)}$ MPa (Tresca).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num:'4.3',kind:'Model',name:'Maximum normal stress criterion for brittle materials',
      statement:String.raw`The tensile branch of the **maximum principal stress (Rankine) criterion** declares a model limit when $\sigma_{\max}=\sigma_t$. A full Rankine criterion also needs a separate compressive strength; only the tensile branch is displayed here. For the chosen surface stress tensor $\begin{pmatrix}\sigma&\tau\\\tau&0\end{pmatrix}$, $\sigma_{\max}=\sigma/2+\sqrt{\sigma^2/4+\tau^2}$. Its direction is $\theta=\tfrac12\operatorname{atan2}(2\tau,\sigma)$ when the stress is nonzero. A line perpendicular to that direction illustrates an opening-plane hypothesis.`,
      idea:String.raw`Principal stresses are the extrema of normal traction over all planes. Comparing the largest tensile value with a chosen tensile threshold gives a simple criterion without crack-size or postfailure mechanics. With $\sigma=S\cos\beta$ and $\tau=S\sin\beta$, solving the criterion for $S$ gives the plotted limiting curve. Its pure-tension and pure-shear endpoints coincide, while mixed loading can reach the threshold at a smaller $S$.`,
      caption:String.raw`Choose the mix of axial tension and surface shear and vary its common scale. The strip illustrates the principal direction and perpendicular candidate plane; red means this model's tensile limit is reached. The middle panel shows the corresponding Mohr circle and tensile threshold. The right panel compares the current scale with the computed threshold for every mix. At zero stress, no principal direction is selected.`,
      deps:['solid-3.2','solid-1.7'],refs:['COMSOL Structural Mechanics Module User’s Guide6.3, Safety Factor Evaluation/Rankine Criterion, p779; full criterion and surrounding failure-index definition read 2026-10-19'],tags:['failure','brittle','principal stress'],verify: false,
      scope:String.raw`A local, isotropic stress criterion used here only for its tensile branch; it does not model flaws, crack propagation, statistical strength, compression failure or a three-dimensional fracture surface. The 207 MPa tensile threshold is chosen for this illustration, not a measured cast-iron fit or an ASTM conformity claim. The source documents a mathematical engineering criterion, not universal agreement with brittle-material tests.`,links:{source:'https://doc.comsol.com/6.3/doc/com.comsol.help.sme/sme_ug_theory.06.049.html'},
      viz(v){
        const strength=207,beta=v.slider('mix angle $\\beta$ (°)',0,90,60,{step:1}),level=v.slider('stress scale $S$ (MPa)',0,260,150,{step:1});
        const A=v.stage({x:[-4.6,4.6],y:[-2.1,2.1],equal:true,axes:false,height:340,title:'surface strip and candidate plane'}),B=v.stage({x:[-300,350],y:[-300,300],equal:true,axes:true,height:340,title:'Mohr circle and tensile limit',xlabel:'σ',ylabel:'τ'}),C=v.stage({x:[-6,96],y:[-12,280],axes:'box',gutter:true,height:340,xlabel:'mix angle β (°)',ylabel:'limiting scale S (MPa)',xticks:[0,15,30,45,60,75,90],title:'chosen tensile criterion'});let info;
        v.legend([['accent','Mohr circle'],['red','chosen tensile threshold'],['orange','limiting scale']]);
        v.render(()=>{
          const p=normalStressState(beta.value,level.value,strength),pad=.06*Math.max(strength,2*p.radius),ymax=Math.max(p.radius,35)*1.13;
          B.setView([Math.min(p.minimum,0)-pad,Math.max(strength,p.maximum)+pad],[-ymax,ymax]);
          A.rect(-3,-.75,3,.75,{color:'ink',width:2,fill:'accent',fillAlpha:p.failed?.04:.12});
          if(p.direction!==null){const u=[Math.cos(p.direction),Math.sin(p.direction)],cr=[-u[1],u[0]],length=.75/Math.abs(cr[1]);A.line(-cr[0]*length,-cr[1]*length,cr[0]*length,cr[1]*length,{color:'red',width:p.failed?4:2,dash:p.failed?false:[6,5]});A.arrow(-.4,-.35,-.4+.9*u[0],-.35+.9*u[1],{color:'green',width:2});A.tex(String.raw`\sigma_{\max}`,-.4+1.15*u[0]-.25,-.35+1.15*u[1]+.12,{size:12,color:'green'});}
          else A.text('zero stress: direction undefined',0,0,{size:11,color:'muted',align:'center'});
          const f=level.value/260*1.1*Math.cos(rad(beta.value)),g=level.value/260*1.2*Math.sin(rad(beta.value));if(f>.04){A.arrow(3,0,3+f+.2,0,{color:'accent',width:3});A.arrow(-3,0,-3-f-.2,0,{color:'accent',width:3});}if(g>.04){A.arrow(3.15,-.6,3.15,-.6+g,{color:'orange',width:3});A.arrow(-3.15,.6,-3.15,.6-g,{color:'orange',width:3});}
          A.text('axial tension',0,1.55,{size:12,color:'accent',align:'center'});A.text('surface shear',0,-1.55,{size:12,color:'orange',align:'center'});
          B.vline(strength,{color:'red',width:2,dash:[6,4]});B.tex(String.raw`\sigma_t`,strength,ymax*.8,{size:12,color:'red',align:'center'});if(p.radius>0)B.circle(p.center,0,p.radius,{color:p.failed?'red':'accent',width:2.4,fill:p.failed?'red':'accent',fillAlpha:.08});
          B.dot(p.sigma,p.tau,{r:5,color:'ink'});B.dot(0,-p.tau,{r:5,color:'ink'});B.line(p.sigma,p.tau,0,-p.tau,{color:'muted',width:1,dash:[3,3]});B.dot(p.maximum,0,{r:6,color:'green'});B.dot(p.minimum,0,{r:5,color:'muted'});
          C.fn(b=>normalStressState(b,1,strength).failureLevel,{color:'orange',width:2.6,domain:[0,90],n:181});C.hline(level.value,{color:'muted',width:1,dash:[4,4]});C.dot(beta.value,level.value,{r:7,color:p.failed?'red':'gold'});info={...p,beta:beta.value,level:level.value};
        });
        v.readout(()=>`σ=${num(info.sigma,2)}, τ=${num(info.tau,2)} MPa; maximum principal stress ${num(info.maximum,3)} MPa, tensile index ${num(info.index,4)} (${info.failed?'model limit reached':'below model limit'}). Limiting scale ${num(info.failureLevel,3)} MPa. ${info.direction===null?'Zero stress has no unique principal direction.':`Principal direction ${num(deg(info.direction),2)}° from the axis; candidate plane perpendicular to it.`}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num:'4.4',kind:'Model',name:'Mohr–Coulomb criterion',
      statement:String.raw`A **Mohr–Coulomb shear envelope** models pressure-dependent strength by $|\tau|\le c+\sigma_n\tan\varphi$, with compression positive. For ordered principal compressions $\sigma_1\ge\sigma_3$, tangency of the largest Mohr circle gives $\sigma_1=\sigma_3N_\varphi+2c\sqrt{N_\varphi}$, where $N_\varphi=(1+\sin\varphi)/(1-\sin\varphi)$. These are model relations for prescribed cohesion and friction angle. For $\varphi=0$, the shear envelope reduces to the pressure-independent Tresca form with $c=Y/2$.`,
      idea:String.raw`The circle has centre $m=(\sigma_1+\sigma_3)/2$ and radius $R=(\sigma_1-\sigma_3)/2$. Its distance to the upper envelope is $c\cos\varphi+m\sin\varphi$. Setting this equal to $R$ yields the principal-stress relation. The tangent coordinates are $(m-R\sin\varphi,R\cos\varphi)$, corresponding to a construction plane $45^\circ+\varphi/2$ from the major principal plane. At zero radius this construction selects no unique plane.`,
      caption:String.raw`Each circle is a **computed limiting state**, not a measured triaxial test. Vary friction, cohesion and the number of chosen confinement cases; the full circles and their visible envelope segments stay in view. Green points mark tangencies. The final case is shown as a specimen with the idealized tangency plane. With zero cohesion and zero friction the states are hydrostatic and the orientation is undefined.`,
      deps:['solid-3.3'],refs:['Itasca Software9.2, Mohr-Coulomb Model, Composite Failure Criterion equations4–8 and complete tension-cutoff/flow-rule discussion; 3DEC Joint Model formulation equations1–2; read 2026-10-19'],tags:['failure','soil mechanics','friction'],verify: false,
      scope:String.raw`Only the idealized compressive shear envelope is shown, with dry-material stresses or appropriately interpreted effective stresses. It ignores intermediate-principal-stress effects, tensile cutoff and postyield flow/dilatancy; real shear-band orientation need not equal the geometric tangency plane. All kPa values are chosen examples. The cited Itasca continuum model uses compression-negative stresses and a tensile cutoff; signs are converted explicitly here and its complete constitutive model is not reproduced. Historical first-publication dates are not asserted.`,links:{source:'https://docs.itascacg.com/itasca920/common/models/mohr/doc/modelmohr.html'},
      viz(v){
        const phi=v.slider('friction angle $\\varphi$ (°)',0,45,30,{step:1}),cc=v.slider('cohesion $c$ (kPa)',0,80,25,{step:1}),count=v.slider('number of model cases',1,5,4,{step:1,int:true});
        const A=v.stage({x:[-120,2000],y:[-1000,1000],equal:true,axes:true,height:380,title:'computed limiting circles (compression positive)',xlabel:'σ (kPa)',ylabel:'τ (kPa)'}),B=v.stage({x:[-3,3],y:[-3.3,3.3],equal:true,axes:false,height:380,title:'last model case'});let info;
        v.legend([['accent','computed circles'],['red','shear envelope'],['green','tangencies']]);
        v.render(()=>{
          const states=[50,100,150,200,250].slice(0,count.value).map(s3=>mohrCoulombState(phi.value,cc.value,s3)),last=states.at(-1),right=last.major*1.1+10,left=-right*.06,ymax=Math.max(...states.map(p=>p.radius),cc.value,10)*1.15,ph=rad(phi.value),slope=Math.tan(ph);
          A.setView([left,right],[-ymax,ymax]);
          const lo=slope?Math.max(left,-cc.value/slope):left,hi=slope?Math.min(right,(ymax-cc.value)/slope):right;
          if(hi>=lo){A.line(lo,cc.value+lo*slope,hi,cc.value+hi*slope,{color:'red',width:2.4});A.line(lo,-cc.value-lo*slope,hi,-cc.value-hi*slope,{color:'red',width:1.2,alpha:.5});}
          for(const p of states){if(p.radius>1e-12)A.circle(p.center,0,p.radius,{color:'accent',width:2,fill:'accent',fillAlpha:.05});A.dot(p.tx,p.ty,{r:4.5,color:'green'});A.dot(p.minor,0,{r:3.5,color:'ink'});A.dot(p.major,0,{r:3.5,color:'ink'});}
          B.rect(-1,-2,1,2,{color:'ink',width:2,fill:'accent',fillAlpha:.08});
          if(last.plane!==null){const dx=Math.cos(last.plane),dy=Math.sin(last.plane),t=Math.min(1/dx,2/dy);B.line(-dx*t,-dy*t,dx*t,dy*t,{color:'red',width:3});B.text(`${num(deg(last.plane),1)}°`,-1.2,1.3,{size:11,color:'red',align:'right'});}else B.text('no unique plane',0,0,{size:12,color:'muted',align:'center'});
          B.arrow(0,2.9,0,2.05,{color:'accent',width:3});B.arrow(0,-2.9,0,-2.05,{color:'accent',width:3});B.arrow(-2.2,0,-1.05,0,{color:'orange',width:2});B.arrow(2.2,0,1.05,0,{color:'orange',width:2});B.tex(`\\sigma_1=${num(last.major,0)}`,1.1,2.9,{size:12,color:'accent',align:'left'});B.tex(`\\sigma_3=${last.minor}`,2.2,-.45,{size:12,color:'orange',align:'right'});
          info={states,last,phi:phi.value,c:cc.value,count:count.value};
        });
        v.readout(()=>`${info.states.map(p=>`σ3=${p.minor} → σ1=${num(p.major,3)} kPa (tangency residual ${Math.abs((info.c+p.center*Math.tan(rad(info.phi)))*Math.cos(rad(info.phi))-p.radius).toExponential(1)} kPa)`).join('; ')}. Nφ=${num(info.last.N,4)}. ${info.last.plane===null?'Zero-radius circles: no unique tangency plane.':`Idealized plane ${num(deg(info.last.plane),2)}° from the major principal plane.`}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Elastic–perfectly plastic material',
      statement: String.raw`The **elastic–perfectly plastic** model replaces a ductile metal's stress–strain curve by two straight pieces: for $|\sigma|<\sigma_y$ the response is linear elastic, $\sigma=E\varepsilon_e$; at $|\sigma|=\sigma_y$ the strain increases at constant stress, $\varepsilon=\varepsilon_e+\varepsilon_p$, with the plastic part $\varepsilon_p$ growing only while $|\sigma|=\sigma_y$. Unloading and reloading follow lines of slope $E$ (so the elastic strain is always $\sigma/E$), and a plastic strain left behind is **permanent**. Stress never exceeds $\sigma_y$ in magnitude. After loading to the strain $\varepsilon_{\max}>\varepsilon_y=\sigma_y/E$ and unloading to zero stress, the bar keeps the permanent set $\varepsilon_p=\varepsilon_{\max}-\varepsilon_y$; on reversal it yields in compression after an elastic stress range of $2\sigma_y$.`,
      idea: String.raw`The model keeps exactly what a design calculation needs from the curve of 1.3: the stiffness $E$ and the yield strength $\sigma_y$, and drops hardening. The key idea is that the *loading* path and the *unloading* path differ: the stress is a function of the history, not of the present strain, since elastic strain recovers along a line parallel to the initial one while plastic strain does not. Hooke's law (1.4) acts on the elastic part only. The model underlies limit analysis (4.10) and the plastic hinge (6.12).`,
      caption: String.raw`Set the peak strain (in units of the yield strain $\varepsilon_y$) and the stress the bar is finally brought to. The blue path is loading, the green one unloading with slope $E$, parallel to the first line. Where the green line meets the strain axis the bar is unloaded, and its permanent set can be read off. Switch on the faint real S355 curve of chapter 1 to see what the idealisation drops (Lüders plateau, hardening, necking). The bar below is drawn with an exaggerated strain scale.`,
      deps: ['solid-1.3'],
      refs: ['Gere–Goodno §2.11', 'Gere–Goodno §2.12'],
      tags: ['plasticity', 'constitutive model'],
      scope: String.raw`Metals with a distinct yield point and little hardening (mild steel at moderate strains); small strains; rate-independent, no Bauschinger effect or hardening. Numbers are the S355 values of chapter 1 ($E=210$ GPa, $\sigma_y=355$ MPa).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Plasticity_(physics)' },
      viz(v) {
        const m = MATS.steel, ey = m.sy / m.E, cv = curveOf('steel');
        const peak = v.slider('peak strain $\\varepsilon_{\\max}/\\varepsilon_y$', 0.2, 6, 3, { step: 0.05 });
        const send = v.slider('final stress $\\sigma/\\sigma_y$', -1, 1, 0, { step: 0.01 });
        const real = v.toggle('show real S355 curve', false);
        const A = v.stage({ x: [-0.3, 6.6], y: [-1.45, 1.45], axes: true, height: 360, title: 'stress against strain', xlabel: 'ε/εy', ylabel: 'σ/σy' });
        const B = v.stage({ x: [-0.5, 10], y: [-2.2, 1.8], equal: true, axes: false, height: 360, title: 'the bar (strain scale exaggerated)' });
        v.legend([['accent', 'loading'], ['green', 'unloading (slope E)'], ['muted', 'real curve', { dash: true }]]);
        const path = () => {
          const pk = peak.value, sp = Math.min(pk, 1), se = Math.min(send.value, sp), ee = pk - (sp - se);
          return { pk, sp, se, ee, pset: pk - sp };
        };
        v.render(() => {
          const { pk, sp, se, ee } = path();
          if (real.value) A.fn((x) => cv.sig(x * ey) / m.sy, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, 6.5], n: 300 });
          A.hline(1, { color: 'faint', width: 1, dash: [4, 4] }); A.hline(-1, { color: 'faint', width: 1, dash: [4, 4] });
          A.path(pk > 1 ? [[0, 0], [1, 1], [pk, 1]] : [[0, 0], [pk, pk]], { color: 'accent', width: 3 });
          A.path([[pk, sp], [ee, se]], { color: 'green', width: 3 });
          A.dot(ee, se, { r: 7, color: 'gold' });
          if (se === 0 && pk > 1) { A.measure(0, -0.18, pk - 1, -0.18, 'permanent set'); }
          A.tex(String.raw`E`, 0.78, 0.22, { size: 13, color: 'accent' });
          // bar
          const L0 = 5, k = 0.15, X = (e) => L0 * (1 + k * e);
          B.rect(0, -0.4, L0, 0.4, { color: 'muted', width: 1.4, dash: [5, 4] });
          B.rect(0, -0.4, X(ee), 0.4, { color: 'ink', width: 2, fill: se >= 0 ? 'accent' : 'orange', fillAlpha: 0.1 + 0.35 * Math.abs(se) });
          B.measure(L0, 0.95, X(ee), 0.95, 'ΔL');
          if (ee - se > 1e-6) B.measure(L0, -1.0, X(ee - se), -1.0, 'permanent part');
          B.text('original length', 0, 0.75, { size: 11, color: 'muted', align: 'left' });
          B.text(`stress ${num(se * m.sy, 0)} MPa`, 0, -1.7, { size: 12, color: 'ink', align: 'left' });
        });
        v.readout(() => {
          const { pk, sp, se, ee } = path(), eps = ee - se;
          return `Peak strain $${num(pk, 2)}\\,\\varepsilon_y=${num(pk * ey * 100, 3)}\\,\\%$ at stress $${num(sp * m.sy, 0)}$ MPa; now $\\sigma=${num(se * m.sy, 0)}$ MPa, $\\varepsilon=${num(ee * ey * 100, 3)}\\,\\%$. · Plastic strain $\\varepsilon-\\sigma/E=${num(eps * ey * 100, 3)}\\,\\%$ (permanent set on full unloading: $${num(Math.max(0, pk - 1) * ey * 100, 3)}\\,\\%$ = $\\varepsilon_{\\max}-\\varepsilon_y$). · Elastic recovery $\\sigma_y/E=${num(ey * 100, 3)}\\,\\%$ ($\\varepsilon_y$ for $E=210$ GPa, $\\sigma_y=355$ MPa).`;
        });
      },
    },
  ],
};
