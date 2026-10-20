// Aerospace Engineering — Chapter4 partb. Corner relations checked against NACA Report1135;
// heating against Sutton–Graves1971 and NASA TFAWS2012; Whitcomb 1952 read completely.
// Ackeret4.6 retains its existing original-article review and model.
import {DEG,thetaOf,thetaMax,nuPM,NU_MAX,shockExpansionDiamond,ackeretDiamond} from './ch04.shared.js';
import {cornerState} from './source-audit-corner.js';
import {heatingState,NASA_HEATING_EXAMPLE} from './source-audit-heating.js';
import {WHITCOMB_BODIES,bodyRadius,whitcombStation} from './source-audit-whitcomb.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '\u2212');


export default {
  collection: 'aero',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num:'4.5',kind:'Model',name:'Oblique shocks and Prandtl–Meyer expansion',
      statement:String.raw`For steady, two-dimensional inviscid flow of a calorically perfect gas, a supersonic stream turned into a compression corner can support an attached oblique shock. Upstream Mach number $M_1$, turn $\theta>0$ and shock angle $\beta$ obey
$$\tan\theta=\frac{2\cot\beta(M_1^2\sin^2\beta-1)}{M_1^2(\gamma+\cos2\beta)+2}.$$
Below the maximum attached turn there are weak and strong branches. The weak branch may become subsonic near attachment loss; the strong branch requires suitable downstream conditions. If no attached root exists, these equations do not determine the detached shock shape.

For a convex expansion corner, $\theta<0$, the isentropic relation is $\nu(M_2)=\nu(M_1)+|\theta|$, where
$$\begin{aligned}
\nu(M)={}&\sqrt{\frac{\gamma+1}{\gamma-1}}\arctan\sqrt{\frac{\gamma-1}{\gamma+1}(M^2-1)}\\
&-\arctan\sqrt{M^2-1}.
\end{aligned}$$
The limiting value is $\nu_{\max}=\frac\pi2(\sqrt{(\gamma+1)/(\gamma-1)}-1)$; the available turn from $M_1$ is $\nu_{\max}-\nu(M_1)$. Here $\gamma=1.4$.`,
      idea:String.raw`Resolve velocity into components normal and tangent to a straight shock. Mass, normal momentum and energy conservation give the normal-shock jump; tangential velocity stays unchanged. Recombining the components gives the turn and downstream Mach number. A finite shock increases entropy and reduces stagnation pressure. An expansion is instead built from continuous Mach waves; integrating $\mathrm d\nu/\mathrm dM=\sqrt{M^2-1}/[M(1+(\gamma-1)M^2/2)]$ gives the Prandtl–Meyer function and preserves stagnation pressure.

For $\gamma>1$ and $M>1$, the stated derivative of $\nu$ is continuous, so the fundamental theorem of calculus pma-6.21 identifies the expansion turn with the difference of its primitive at the two Mach numbers. Taking the sonic limiting value $\nu(1)=0$ fixes its constant. This integrates the isentropic expansion relation; it does not replace the entropy-producing jump conditions for a compression shock.`,
      caption:String.raw`Change upstream Mach number, signed turn and shock branch. The left panel is a **corner/wave schematic**, with arrows showing flow direction. It does not solve a detached shock or a complete viscous flow field. The compression graph shows both roots and the attached-turn maximum. For expansion, the graph expands to include the computed $M_2$, even when it exceeds 6. Zero turn leaves a uniform stream.`,
      deps:['fluid-9.14','fluid-9.13','aero-1.6', 'pma-6.21'],
      refs:['NACA Report 1135, pp620–626: equations115–147,168,171–174'],
      tags:['shock waves','supersonic','gas dynamics'],
      scope:String.raw`Steady two-dimensional inviscid, calorically perfect gas with $\gamma=1.4$; a sharp corner and a uniform upstream stream. Attached shock relations or a centred expansion without interfering waves. No boundary layers, real-gas chemistry, detached-shock geometry or downstream condition selecting a strong branch are computed.`,
      verify: false,
      links:{source:'https://ntrs.nasa.gov/api/citations/19930091059/downloads/19930091059.pdf'},
      viz(v){
        const Ms=v.slider('upstream Mach number $M_1$',1.1,6,2.5,{step:.05});
        const th=v.slider(String.raw`turn $\theta$ (°; negative = expansion)`,-35,40,12,{step:.5});
        const br=v.select('compression branch',[{value:'weak',label:'weak'},{value:'strong',label:'strong'}],'weak');
        const A=v.stage({x:[-1.2,2.5],y:[-1.75,2.55],equal:true,axes:false,height:340,minWidth:320,title:'corner and wave directions (schematic)'});
        const B=v.stage({x:[-3,93],y:[-2,50],axes:'box',gutter:true,height:340,minWidth:300,xlabel:'shock angle β (°)',ylabel:'turn θ (°)',title:'attached oblique-shock roots'});
        const C=v.stage({x:[.5,6.5],y:[-4,136],axes:'box',gutter:true,height:340,minWidth:300,xlabel:'Mach number M',ylabel:'ν (°)',title:'Prandtl–Meyer expansion'});
        let info;
        v.render(()=>{
          const M1=Ms.value,t=th.value*DEG,res=cornerState(M1,t,br.value),comp=t>0,mu1=Math.asin(1/M1);
          B.el.style.display=comp?'':'none';C.el.style.display=comp?'none':'';
          const wall=[2.2*Math.cos(t),2.2*Math.sin(t)];
          A.poly([[-1.1,0],[0,0],wall,[wall[0],-1.65],[-1.1,-1.65]],{fill:'ink',fillAlpha:.12,stroke:false});
          A.path([[-1.1,0],[0,0],wall],{color:'ink',width:3});
          A.arrow(-1.05,.65,-.35,.65,{color:'accent',width:2.2});
          A.text(`M₁ = ${fx(M1,2)}`,-1.05,.91,{color:'accent',size:12,align:'left'});
          let flowAngle=null;
          if(res.kind==='shock'){
            A.line(0,0,2.25*Math.cos(res.beta),2.25*Math.sin(res.beta),{color:'red',width:3});
            flowAngle=(t+res.beta)/2;
          }else if(res.kind==='fan'){
            const available=NU_MAX-res.nu1,tail=res.vac?-available:Math.asin(1/res.M2)+t;
            for(let i=0;i<=8;i++){
              const phi=mu1+(tail-mu1)*i/8;
              A.line(0,0,2.25*Math.cos(phi),2.25*Math.sin(phi),{color:'blue',width:i===0||i===8?2.4:1.2});
            }
            if(!res.vac)flowAngle=t+.5*Math.asin(1/res.M2);
          }else if(res.kind==='detached')A.text('no attached solution; shape not solved',-.95,2.22,{color:'red',size:11,align:'left'});
          else flowAngle=.3;
          if(flowAngle!==null){const x=1.15*Math.cos(flowAngle),y=1.15*Math.sin(flowAngle);A.arrow(x,y,x+.7*Math.cos(t),y+.7*Math.sin(t),{color:'accent',width:2.2});}
          if(comp){
            for(const M of[1.5,2,3,5])B.fn(b=>thetaOf(b*DEG,M)/DEG,{color:'faint',width:1.2,domain:[Math.asin(1/M)/DEG,90]});
            B.fn(b=>thetaOf(b*DEG,M1)/DEG,{color:'accent',width:2.8,domain:[mu1/DEG,90]});
            const tm=thetaMax(M1);B.hline(th.value,{color:'gold',dash:true});
            B.dot(tm.beta/DEG,tm.theta/DEG,{r:5,color:'orange'});
            if(res.sa){B.dot(res.sa.weak/DEG,th.value,{r:6,color:'green'});B.dot(res.sa.strong/DEG,th.value,{r:6,color:'red'});}
          }else{
            const end=Math.max(6.5,res.kind==='fan'&&!res.vac?res.M2*1.12:6.5);
            C.setView([.5,end],[-4,136]);
            C.fn(M=>nuPM(M)/DEG,{color:'accent',width:2.8,domain:[1,end]});C.hline(NU_MAX/DEG,{color:'muted',dash:true});
            C.dot(M1,nuPM(M1)/DEG,{r:5.5,color:'gold'});
            if(res.kind==='fan'&&!res.vac)C.dot(res.M2,res.nu2/DEG,{r:5.5,color:'green'});
          }
          info={M1,t,branch:br.value,res};
        });
        v.legend([['accent','flow direction / relation'],['red','shock / strong root'],['blue','expansion Mach rays'],['green','weak root / downstream expansion'],['gold','chosen turn / upstream state']]);
        v.readout(()=>{
          const {M1,t,res}=info;
          if(res.kind==='detached')return String.raw`Turn $${fx(t/DEG,1)}^\circ$ exceeds $\theta_{\max}=${fx(res.tm.theta/DEG,3)}^\circ$ at $M_1=${fx(M1,2)}$. No attached root exists; detached-shock geometry is outside this model.`;
          if(res.kind==='shock')return String.raw`Weak $\beta=${fx(res.sa.weak/DEG,3)}^\circ$; strong $\beta=${fx(res.sa.strong/DEG,3)}^\circ$. Selected $M_2=${fx(res.j.M2,4)}$; $p_2/p_1=${fx(res.j.p,4)}$, $\rho_2/\rho_1=${fx(res.j.rho,4)}$, $T_2/T_1=${fx(res.j.T,4)}$, $p_{02}/p_{01}=${fx(res.j.p0,5)}$. Recomputed turn $${fx(res.j.theta/DEG,4)}^\circ$. ${res.j.M2<1?'The selected downstream state is subsonic.':'The selected downstream state is supersonic.'}`;
          if(res.kind==='fan')return res.vac?String.raw`The requested turn exceeds the finite-pressure expansion limit $${fx((NU_MAX-res.nu1)/DEG,3)}^\circ$ from this upstream state.`:String.raw`$\nu_1=${fx(res.nu1/DEG,3)}^\circ$, $\nu_2=${fx(res.nu2/DEG,3)}^\circ$; $M_2=${fx(res.M2,4)}$. $p_2/p_1=${fx(res.p,5)}$, $T_2/T_1=${fx(res.T,5)}$, $p_{02}/p_{01}=1$. Fan tail $\mu_2+\theta=${fx((Math.asin(1/res.M2)+t)/DEG,3)}^\circ$. Available expansion from $M_1$: $${fx((NU_MAX-res.nu1)/DEG,3)}^\circ$.`;
          return 'Zero turn: the stream stays uniform; no shock or expansion is required.';
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Supersonic thin-airfoil theory (Ackeret)',
      statement: String.raw`For a thin airfoil at a small angle of attack in a uniform supersonic stream of Mach number $M_\infty>1$ (and not close to $1$ or to hypersonic speeds), linearised theory gives the pressure coefficient on each surface point of local slope $\theta$ (turned into the stream positive):
$$C_p=\frac{2\theta}{\sqrt{M_\infty^2-1}}.$$
The pressure on each face therefore depends only on that face's own slope, not on the rest of the airfoil. Integrating over a flat plate or a symmetric diamond of half-angle $\varepsilon$ gives
$$c_l=\frac{4\alpha}{\sqrt{M_\infty^2-1}},\qquad c_d=\frac{4(\alpha^2+\varepsilon^2)}{\sqrt{M_\infty^2-1}}.$$
The centre of pressure of the flat plate is at mid-chord.
Lift and wave drag are non-zero even in inviscid flow, and thickness adds wave drag $4\varepsilon^2/\beta$ but no lift.`,
      idea: String.raw`The linearised potential equation $(M_\infty^2-1)\phi_{xx}-\phi_{yy}=0$ is the wave equation: disturbances travel unchanged along the Mach lines $x\mp\beta y=\text{const}$, $\beta=\sqrt{M_\infty^2-1}$. Above the airfoil only the downstream-running family exists, so $\phi=f(x-\beta y)$, and the flow-tangency condition $\phi_y=V_\infty\theta$ gives $u'/V_\infty=-\theta/\beta$ and hence $C_p=-2u'/V_\infty=2\theta/\beta$. The same expression is the first term in the oblique-shock relation (4.5) and in the Prandtl–Meyer expansion for small $\theta$, so the exact shock–expansion method reduces to Ackeret's result at small angles.

The multivariable chain rule pma-9.15 applied to $\phi(x,y)=f(x-\beta y)$ gives $\phi_x=f'$ and $\phi_y=-\beta f'$. For twice differentiable $f$, applying it again gives $\phi_{xx}=f''$ and $\phi_{yy}=\beta^2f''$, verifying the stated linear potential equation when $\beta^2=M_\infty^2-1$. The first derivatives then turn the boundary slope into the pressure coefficient, within the small-disturbance assumptions already stated.`,
      caption: String.raw`Left: the airfoil at incidence with the waves it sends out (red compression, blue expansion). Top right: the pressure coefficient on its four faces from Ackeret's formula (hollow) and from exact shock–expansion theory (solid). Bottom: lift and drag against angle of attack, linear theory (dashed) and exact (solid). Raise the angle of attack or lower the Mach number and Ackeret's curves drift away from the exact ones; at large $\alpha$ the shock detaches, and as $M_\infty\to1$ linear theory breaks down.`,
      deps: ['aero-4.5', 'pma-9.15'],
      refs: ['Anderson ch. 5', 'Ackeret (1925), NACA TM 317, pp. 1, 5–6; https://ntrs.nasa.gov/citations/19930087085'],
      tags: ['supersonic', 'wave drag', 'linear theory'],
      scope: String.raw`Small angles and thin sections, $M_\infty$ well above 1 (roughly $1.2\lesssim M_\infty\lesssim4$); inviscid flow over a flat plate or double-wedge section. The 'exact' comparison is the shock–expansion method: each face is treated as an independent corner, so wave reflections off the opposite shocks are neglected.`,
      credit: 'J. Ackeret, 1925 (original article, 14 February, pp. 72–74; translated as NACA TM 317)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jakob_Ackeret' },
      viz(v) {
        const Ms = v.slider('Mach number $M_\\infty$', 1.15, 5, 2, { step: 0.05 });
        const al = v.slider('angle of attack $\\alpha$ (°)', -10, 10, 3, { step: 0.1 });
        const ep = v.slider('thickness half-angle $\\varepsilon$ (°, 0 = flat plate)', 0, 10, 3, { step: 0.1 });
        const A = v.stage({ x: [-0.6, 2.2], y: [-1.3, 1.3], equal: true, axes: false, height: 330, minWidth: 320, title: 'waves round the section' });
        const B = v.stage({ x: [0.5, 4.5], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'face', ylabel: '$C_p$', title: 'pressure on each face', xticks: [[1, 'upper front'], [2, 'upper rear'], [3, 'lower front'], [4, 'lower rear']] });
        const C = v.stage({ x: [-10, 10], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'angle of attack $\\alpha$ (°)', ylabel: '$c_l$', title: 'lift' });
        const D = v.stage({ x: [-10, 10], y: [0, 0.12], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'angle of attack $\\alpha$ (°)', ylabel: '$c_d$', title: 'wave drag' });
        let info = {};
        v.render(() => {
          const M = Ms.value, a = al.value * DEG, e = ep.value * DEG, b = Math.sqrt(M * M - 1), mu = Math.asin(1 / M);
          const ack = ackeretDiamond(M, a, e), ex = shockExpansionDiamond(M, a, e);
          // airfoil at incidence (flow along +x)
          const ca = Math.cos(-a), sa = Math.sin(-a), rot = ([x, y]) => [(x - 0.5) * ca - y * sa + 0.5, (x - 0.5) * sa + y * ca], te = Math.tan(e) * 0.5;
          const P = [[0, 0], [0.5, te], [1, 0], [0.5, -te]].map(rot);
          A.poly(P, { fill: 'ink', fillAlpha: 0.2, color: 'ink', width: 2 });
          const wave = (p, sgn, col, len = 1.0) => A.line(p[0], p[1], p[0] + len * Math.cos(sgn * mu), p[1] + len * Math.sin(sgn * mu), { color: col, width: 2.2 });
          const upL = ack.up1 > 0 ? 'red' : 'blue', loL = ack.lo1 > 0 ? 'red' : 'blue';
          wave(P[0], 1, upL, 1.4); wave(P[0], -1, loL, 1.4); wave(P[1], 1, 'blue', 1.2); wave(P[3], -1, 'blue', 1.2);
          wave(P[2], 1, ack.up2 < 0 ? 'red' : 'blue', 1.0); wave(P[2], -1, 'red', 1.0);
          A.arrow(-0.55, 0.0, -0.1, 0.0, { color: 'accent', width: 2 }); A.text(`$M_\\infty=${fx(M, 2)}$`, -0.55, 0.14, { color: 'accent', size: 12, align: 'left' });
          A.text(`Mach angle $\\mu=${fx(mu / DEG, 1)}^\\circ$`, 1.1, -1.2, { color: 'muted', size: 11, align: 'left' });
          // bars
          const names = ['up1', 'up2', 'lo1', 'lo2'], ymax = Math.max(0.1, ...names.map((n) => Math.abs(ack[n])), ...(ex ? names.map((n) => Math.abs(ex[n])) : [0])) * 1.2;
          B.setView([0.5, 4.5], [-ymax, ymax]); B.hline(0, { color: 'faint' });
          names.forEach((n, i) => { B.rect(i + 0.6, 0, i + 1.0, ack[n], { color: 'orange', fill: 'orange', fillAlpha: 0.0, width: 2 }); if (ex) B.rect(i + 1.0, 0, i + 1.4, ex[n], { color: 'accent', fill: 'accent', fillAlpha: 0.45, width: 1.4 }); });
          // lift & drag curves
          const as = []; for (let i = 0; i <= 80; i++) as.push(-10 + 20 * i / 80);
          const ys = as.map((x) => shockExpansionDiamond(M, x * DEG, e));
          C.setView([-10, 10], [-Math.max(0.3, 4 * 10 * DEG / b * 1.1), Math.max(0.3, 4 * 10 * DEG / b * 1.1)]);
          D.setView([-10, 10], [0, Math.max(0.05, 4 * (100 * DEG * DEG + e * e) / b * 1.1)]);
          C.path(as.map((x) => [x, 4 * x * DEG / b]), { color: 'orange', width: 2.2, dash: true });
          C.path(as.map((x, i) => (ys[i] ? [x, ys[i].cl] : null)), { color: 'accent', width: 2.8 });
          D.path(as.map((x) => [x, 4 * ((x * DEG) ** 2 + e * e) / b]), { color: 'orange', width: 2.2, dash: true });
          D.path(as.map((x, i) => (ys[i] ? [x, ys[i].cd] : null)), { color: 'accent', width: 2.8 });
          C.dot(al.value, ack.cl, { r: 5, color: 'orange' }); D.dot(al.value, ack.cd, { r: 5, color: 'orange' });
          if (ex) { C.dot(al.value, ex.cl, { r: 6, color: 'gold' }); D.dot(al.value, ex.cd, { r: 6, color: 'gold' }); }
          info = { M, a, e, b, ack, ex };
        });
        v.legend([['orange', 'Ackeret (linear)', { dash: true }], ['accent', 'shock–expansion (exact)']]);
        v.readout(() => {
          const { M, b, ack, ex } = info;
          let s = `$\\beta=\\sqrt{M_\\infty^2-1}=${fx(b, 3)}$. Ackeret: $c_l=${fx(ack.cl, 4)}$, $c_d=${fx(ack.cd, 4)}$, $C_p$ on the faces $${fx(ack.up1, 3)},\\ ${fx(ack.up2, 3)},\\ ${fx(ack.lo1, 3)},\\ ${fx(ack.lo2, 3)}$.\n`;
          s += ex ? `Shock–expansion: $c_l=${fx(ex.cl, 4)}$ (Ackeret differs by $${fx(100 * (ack.cl - ex.cl) / (Math.abs(ex.cl) || 1), 1)}\\%$), $c_d=${fx(ex.cd, 4)}$ ($${fx(100 * (ack.cd - ex.cd) / ex.cd, 1)}\\%$); faces $${fx(ex.up1, 3)},\\ ${fx(ex.up2, 3)},\\ ${fx(ex.lo1, 3)},\\ ${fx(ex.lo2, 3)}$.` : 'At this angle a shock detaches (a face turns the flow by more than $\\theta_{\\max}$): the shock–expansion solution does not exist and the linear theory is meaningless.';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num:'4.7',kind:'Model',name:'Hypersonic aerodynamic heating',
      statement:String.raw`A useful cold-wall approximation for convective heat flux at the stagnation point of an effective spherical nose is
$$\dot q_s=k\sqrt{\rho_\infty/R_n}\,V_\infty^3.$$
For Earth air, the NASA course used here gives $k=1.7415\times10^{-4}$ in SI units: density in kg/m³, radius in m, velocity in m/s and flux in W/m². It assumes a fully catalytic surface. Increasing radius reduces this convective estimate, while increasing velocity has a cubic effect.

If that heat input were balanced only by emission to much colder surroundings, a **radiation-balance reference temperature** would be
$$T_{\rm ref}=\left(\dot q_s/(\varepsilon\sigma)\right)^{1/4}.$$
This separate balance does not update the cold-wall heating correlation for the resulting hot wall. It is not a coupled thermal-protection calculation.`,
      idea:String.raw`The original report defines its coefficient by $\dot q_s=K\sqrt{p_s/R_n}(h_s-h_w)$, where $p_s,h_s$ are stagnation conditions and $h_w$ is wall enthalpy. Holding that coefficient approximately fixed, the high-speed scalings $p_s\propto\rho_\infty V^2$ and $h_s-h_w\propto V^2$ produce $\dot q_s\propto\sqrt{\rho_\infty/R_n}V^3$. Its equilibrium-mixture derivation supplies the transport dependence; the fixed Earth coefficient used here is documented in NASA's later course. Emitted radiation scales with $T^4$, so the separate balance temperature scales as $V^{3/4}\rho^{1/8}R_n^{-1/8}\varepsilon^{-1/4}$.

The Stefan–Boltzmann law climate-1.2 gives blackbody emission $\sigma T^4$. Assuming a fixed grey emissivity $0<\varepsilon\le1$ scales that emission by $\varepsilon$; neglecting incoming radiation from much colder surroundings and balancing the prescribed positive heat input gives the unique positive reference temperature shown here. This uses the radiation law for a separate balance and does not feed the resulting temperature back into the cold-wall convective model.`,
      caption:String.raw`Vary density, effective radius, emissivity and speed. Left: the convective correlation; right: its radiation-balance reference. Both complete curves and the selected points stay in view. The **NASA example** button sets the course's exact inputs and reproduces approximately $13.6$ W/cm² and $1316$ K. The sliders explore the algebra over a wider range; no validity threshold or material approval is inferred from their endpoints.`,
      deps:['aero-1.6', 'climate-1.2'],
      refs:['Sutton and Graves, NASA TR R-376 (1971), analysis/results pp8–21, equation33 and approximations','NASA TFAWS2012 Aerothermodynamics Course, Lecture1 slides14–21,28–29'],
      tags:['hypersonic','heating','re-entry'],
      scope:String.raw`A simplified cold-wall, fully catalytic, laminar stagnation-point convective estimate for Earth air and an effective spherical nose. Radius must represent the relevant velocity gradient, not an arbitrary geometric radius on another shape. No incoming shock-layer radiation, hot-wall feedback, conduction, ablation, transition, rarefaction or non-equilibrium correction is computed. The original report's broad equilibrium-gas study is not a certification of this entire slider range. The radiation balance neglects all other heat paths and time dependence; it gives no material design allowable.`,
      credit:'K. Sutton and R. A. Graves Jr., NASA TR R-376, November 1971',
      verify: false,
      links:{source:'https://tfaws.nasa.gov/TFAWS12/Proceedings/Aerothermodynamics%20Course.pdf',ntrs:'https://ntrs.nasa.gov/citations/19720003329'},
      viz(v){
        const rho=v.slider(String.raw`density $\rho_\infty$ (kg/m³)`,1e-6,.1,3.1459e-4,{log:true,sig:5,fmt:x=>x.toExponential(4)});
        const rn=v.slider('effective nose radius $R_n$ (m)',.01,3,1,{log:true,sig:3});
        const eps=v.slider(String.raw`emissivity $\varepsilon$`,.4,.95,.8,{step:.01});
        const speed=v.slider('speed (km/s)',1,12,3.535,{step:.001,fmt:x=>fx(x,3)});
        v.button('NASA example',()=>{rho.set(NASA_HEATING_EXAMPLE.density);rn.set(1);eps.set(.8);speed.set(3.535);});
        const A=v.stage({x:[.7,12.6],y:[0,1],axes:'box',gutter:true,height:340,xlabel:'speed V (km/s)',ylabel:'convective flux (MW/m²)',title:'Earth-air stagnation-point correlation'});
        const B=v.stage({x:[.7,12.6],y:[0,2000],axes:'box',gutter:true,height:340,xlabel:'speed V (km/s)',ylabel:'reference temperature (K)',title:'cold-wall input balanced by emission'});
        let info;
        v.render(()=>{
          const at=V=>heatingState(rho.value,rn.value,V*1000,eps.value),p=at(speed.value),top=at(12);
          A.setView([.7,12.6],[-.06*top.heatFlux/1e6,top.heatFlux*1.12/1e6]);
          B.setView([.7,12.6],[-.06*top.radiationTemperature,top.radiationTemperature*1.12]);
          A.fn(V=>at(V).heatFlux/1e6,{color:'accent',width:2.8,domain:[1,12],n:160});
          B.fn(V=>at(V).radiationTemperature,{color:'orange',width:2.8,domain:[1,12],n:160});
          A.dot(speed.value,p.heatFlux/1e6,{r:6,color:'gold'});B.dot(speed.value,p.radiationTemperature,{r:6,color:'gold'});
          info=p;
        });
        v.legend([['accent','convective correlation'],['orange','radiation-balance reference'],['gold','chosen speed']]);
        v.readout(()=>{const [mantissa,exponent]=rho.value.toExponential(4).split('e');return String.raw`$\rho=${mantissa}\times10^{${Number(exponent)}}$ kg/m³, $R_n=${fx(rn.value,3)}$ m, $V=${fx(speed.value,3)}$ km/s: $\dot q_s=${fx(info.heatFlux/1e4,3)}$ W/cm² ($${fx(info.heatFlux/1e6,4)}$ MW/m²), $T_{\rm ref}=${fx(info.radiationTemperature,1)}$ K. Emission $\varepsilon\sigma T_{\rm ref}^4=${fx(info.emitted/1e4,3)}$ W/cm² matches this input by construction. This is a cold-wall reference balance, with no material qualification or coupled wall response.`;});
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num:'4.8',kind:'Paper',name:'Drag-Rise Characteristics of Wing-Body Combinations',
      paper:{authors:'Richard T. Whitcomb',year:1952,title:'A Study of the Zero-Lift Drag-Rise Characteristics of Wing-Body Combinations Near the Speed of Sound',venue:'NACA Research Memorandum RM L52H08',url:'https://ntrs.nasa.gov/citations/19930087283'},
      introduces:['aero-4.4'],
      statement:String.raw`Whitcomb compared four thin, low-aspect-ratio wing–body configurations with bodies of revolution constructed to have the same axial distribution of cross-sectional area normal to the stream. The Langley 8-foot tunnel experiments covered $M=0.85$–$1.10$ at zero lift. The report concluded that near-sonic drag rise depends primarily on this total area distribution; the equivalence is approximate, with discrepancies for swept-wing cases.

Indenting a cylindrical body to offset a wing's area reduced the **wing-associated drag-rise increment** by approximately 60% for the unswept and delta cases near sonic speed. For the swept case the report described this increment as eliminated through $M=1.04$. These are not percentages of total aircraft drag, and they do not imply zero drag for the indented configuration.`,
      idea:String.raw`The paper used drag balances, base-pressure measurements, schlieren surveys and tunnel-wall Mach distributions to compare complete configurations with their equivalent bodies. Drag-rise increments were formed by subtracting each configuration's value near $M=0.85$, largely removing skin-friction offsets. The author explicitly discussed discrepancies, boundary-layer displacement and decreasing equivalence as Mach number rose. The key design comparison concerns combined area, so improving wing and body separately need not improve their combination.`,
      caption:String.raw`Choose one of the three cylindrical-body wing cases and move the station. Left: body-only areas $\pi r^2$ computed from the original basic, equivalent and indented-body radii in Tables I–III; radii are linearly interpolated between their reported stations. This is a view of the paper's geometry, **not a reconstruction of total indented wing–body area**. Right: the author's approximate near-sonic wing-increment comparison, normalised to 1 for the original combination. These bars summarise the report's text; they are not digitised drag curves or predictions at arbitrary Mach number.`,
      deps:['aero-4.2'],
      refs:['Whitcomb 1952 NACA RM L52H08: full report read; Methods pp2–5, Discussion pp5–12, Conclusions p13, Tables I–III pp16–19, Figures1–10 pp21–41'],
      tags:['area rule','transonic','history'],
      scope:String.raw`The report's zero-lift thin low-aspect-ratio models near sonic speed. The diagram uses the three cylindrical-body cases, omitting the swept-wing/curved-body geometry. The reported absolute drag-coefficient uncertainty was approximately ±0.0005; measurements near $M=1.05$ were omitted because of wall-reflected disturbances. The interpolated radii and derived body volume are mathematical reconstructions of rounded geometry entries, not measured flow predictions. No general-purpose drag law, exact area-equivalence identity, Korn onset curve, same-volume Sears–Haack optimum, later aircraft redesign or award claim is supplied.`,
      credit:'R. T. Whitcomb, NACA RM L52H08, September 3, 1952',
      verify: false,
      links:{ntrs:'https://ntrs.nasa.gov/citations/19930087283'},
      viz(v){
        const kind=v.select('reported wing case',[{value:'unswept',label:'unswept'},{value:'delta',label:'delta'},{value:'swept',label:'45° swept'}],'unswept');
        const station=v.slider('body station $x$ (in)',22.5,43,27.5,{step:.125,fmt:x=>fx(x,3)});
        const A=v.stage({x:[22,43.5],y:[0,17],axes:'box',gutter:true,height:340,xlabel:'station x (in)',ylabel:'body-only area πr² (in²)',title:'geometry from original Tables I–III'});
        const B=v.stage({x:[-.2,2.2],y:[-.08,1.22],axes:'box',gutter:true,height:340,xlabel:'configuration',ylabel:'wing-associated increment / original',title:'reported near-sonic comparison (approx.)',xticks:[[.5,'original'],[1.5,'indented']]});
        v.legend([['muted','basic cylinder / original reference'],['accent','equivalent body of revolution'],['green','indented body / reported reduction']]);
        let info;
        v.render(()=>{
          const b=WHITCOMB_BODIES[kind.value],p=whitcombStation(kind.value,station.value),area=(points,x)=>Math.PI*bodyRadius(points,x)**2;
          A.fn(()=>p.basicArea,{color:'muted',width:1.8,domain:[22.5,43]});
          A.fn(x=>area(b.equivalent,x),{color:'accent',width:2.6,domain:[22.5,43],n:300});
          A.fn(x=>area(b.indented,x),{color:'green',width:2.6,domain:[22.5,43],n:300});
          A.dots(b.equivalent.map(([x,r])=>[x,Math.PI*r*r]),{r:2.5,color:'accent'});
          A.dots(b.indented.map(([x,r])=>[x,Math.PI*r*r]),{r:2.5,color:'green'});
          A.vline(p.x,{color:'gold',dash:true});A.dot(p.x,p.indentedArea,{r:6,color:'gold'});
          B.rect(.22,0,.78,1,{color:'muted',fill:'muted',fillAlpha:.45});
          B.rect(1.22,0,1.78,p.remaining,{color:'green',fill:'green',fillAlpha:.45});
          if(p.remaining===0)B.dot(1.5,0,{r:5,color:'green',hollow:true});
          B.text('100%',.5,1.08,{color:'muted',size:13,align:'center'});
          B.text(p.remaining?'≈40% remains':'reported eliminated',1.5,p.remaining+.12,{color:'green',size:12,align:'center'});
          B.text(p.remaining?'near sonic speed':'through M = 1.04',1.5,p.remaining+.26,{color:'green',size:11,align:'center'});
          info=p;
        });
        v.readout(()=>String.raw`At $x=${fx(info.x,3)}$ in: equivalent-body radius $${fx(info.equivalentRadius,3)}$ in, indented-body radius $${fx(info.indentedRadius,3)}$ in. Body-only areas: basic $${fx(info.basicArea,3)}$, equivalent $${fx(info.equivalentArea,3)}$, indented $${fx(info.indentedArea,3)}$ in². The linear-radius reconstruction removes approximately $${fx(info.removedBodyVolume,2)}$ in³ of body volume over stations 22.5–43 in. ${info.remaining?'The report describes approximately 60% reduction of the wing-associated drag-rise increment near sonic speed.':'The report describes the swept-wing-associated increment as eliminated through M = 1.04.'} The complete indented wing–body area and a drag curve are not computed here.`);
      },
    },
  ],
};
