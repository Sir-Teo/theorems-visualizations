import { draught, riderCoupling } from './source-audit-loads.js';
import { stampStroke, lockChange } from './source-audit-mechanisms.js';
import { smeatonWind } from './source-audit-power.js';
// History of Technology — Chapter 4: Building, water and power before steam (items 4.7–4.12; 4.1–4.6 are in ch04.js)
import { yearStage, drawYears, G, plate } from './ch04.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- 4.11: flat-plate sail on a boat
/** Force (in units of ½ρA = 1, true wind speed 1) of a thin flat sail with chord direction c in an apparent wind A. */
function sailForce(A, c) {
  const sp = Math.hypot(A[0], A[1]); if (sp < 1e-9) return [0, 0];
  const Ah = [A[0] / sp, A[1] / sp];
  const alpha = Math.acos(clamp(Math.abs(Ah[0] * c[0] + Ah[1] * c[1]), 0, 1));
  let n = [-c[1], c[0]]; if (n[0] * Ah[0] + n[1] * Ah[1] < 0) n = [-n[0], -n[1]];
  let Lh = [-Ah[1], Ah[0]]; if (Lh[0] * n[0] + Lh[1] * n[1] < 0) Lh = [-Lh[0], -Lh[1]];
  const { CL, CD } = plate(alpha);
  return [sp * sp * (CD * Ah[0] + CL * Lh[0]), sp * sp * (CD * Ah[1] + CL * Lh[1])];
}
/** Steady boat speed (true wind 1, blowing toward −y) at heading gamma from dead upwind, with the sail trimmed to the best chord angle in [dmin, 90°] to the boat axis; hull drag = ch v². */
function boatSpeed(gamma, dmin, ch) {
  const b = [Math.sin(gamma), Math.cos(gamma)];
  const fwd = (v) => {
    const A = [-v * b[0], -1 - v * b[1]];
    let best = -1e9, bd = dmin;
    for (let d = dmin; d <= 90.001 * D2R * 1; d += 3 * D2R) for (const sg of [-1, 1]) {
      const cc = Math.cos(sg * d), ss = Math.sin(sg * d);
      const c = [-(b[0] * cc - b[1] * ss), -(b[0] * ss + b[1] * cc)];
      const F = sailForce(A, c), fw = F[0] * b[0] + F[1] * b[1];
      if (fw > best) { best = fw; bd = sg * d; }
    }
    return { fw: best, d: bd };
  };
  const f = (v) => fwd(v).fw - ch * v * v;
  if (f(0) <= 0) return { v: 0, d: fwd(0).d };
  let lo = 0, hi = 4; for (let v = 0.05; v <= 4; v += 0.05) { if (f(v) < 0) { hi = v; break; } lo = v; }
  for (let i = 0; i < 25; i++) { const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
  return { v: lo, d: fwd(lo).d };
}

export default {
  collection: 'tech',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num:'4.7',kind:'Invention',name:'The cam and the trip hammer',verify:false,
      credit:'Cam-driven stamps described in Agricola 1556, Book VIII; isolated guided-stroke comparison authored here',
      statement:String.raw`A cam raises a follower as a shaft turns. Releasing a raised head lets gravity produce an impact. A trip hammer uses a pivoted beam; a stamp instead slides in guides. Agricola's De re metallica, Book VIII, describes iron-shod stamps, tappets and two cams per stamp on a water-driven shaft. The 1912 translation and woodcut show this mechanism.

The illustration studies one ideal **guided vertical stamp stroke**. It does not simulate a pivoted helve, a repeating steady state, the next cam's collision or a specific historical machine. A prescribed lift can require a retaining force at high speed; this constraint is exposed rather than assuming a one-sided cam can pull its follower downward.`,
      idea:String.raw`Let $T=60/(kN)$ for k lugs and shaft speed N in turns/minute, and let the prescribed lift last $t_L=dT$. For $s=t/t_L$, impose
$$y=H(3s^2-2s^3),\qquad0\le s\le1.$$
The head begins and ends the lift at rest, then follows the isolated fall $y=H-g(t-t_L)^2/2$ until impact. Thus $t_f=\sqrt{2H/g}$, $v_{\rm hit}=\sqrt{2gH}$ and impact energy is $mgH$.

During the prescribed lift, guide force is $m(g+\ddot y)$. Its minimum is $m(g-6H/t_L^2)$. A negative value means a retaining constraint would be required; an ordinary upward-only cam cannot enforce that path. The isolated impact time $t_L+t_f$ is compared with the next scheduled lug at T. Equal kN, duty and height give the same trajectory; there is no claimed dependence on how an equal rate is split between lugs and rpm.`,
      caption:String.raw`Vary lug count, rpm, lift duration, height and mass, then inspect the selected time in one complete isolated stroke. The vertical head reaches the actual drawn anvil at zero height. Orange shows only the prescribed lift; green includes the entire subsequent fall and resting state. The red line marks the next scheduled lug, whose action is not applied. The readout separately reports whether impact precedes that deadline and whether the lift needs a retaining force. A nominal energy-per-period value is conditional on both checks.`,
      deps:['tech-4.4','mech-3.1'],see:['tech-2.10','tech-4.6'],refs:['Agricola 1556, De re metallica Book VIII; Hoover/Hoover 1912 pp.280–287, stamp/cam text and woodcut p.284'],tags:['mechanism','prime mover'],
      scope:String.raw`The cubic constrained lift, vertical point mass, fixed g=9.81 m/s², release from rest, perfectly inelastic impact and scheduled-lug deadline are authored assumptions. No unilateral contact solver, cam contour, crushing law, drive inertia, rebound or multi-cycle state is inferred. The diagram's head size and guides are schematic. Current state and event times use the closed-form stroke; finite sample curves also include release, deadline and impact exactly.`,
      links:{source:'https://www.gutenberg.org/files/38015/38015-h/38015-h.htm#BOOK_VIII'},
      viz(v){
        const lugs=v.slider('lugs per shaft turn',1,8,4,{int:true}),rpm=v.slider('shaft speed (turns/min)',2,40,12,{step:'any',decimals:6}),duty=v.slider('prescribed lift / period',.1,.8,.4,{step:'any',decimals:6}),height=v.slider('vertical lift H (m)',.1,1,.4,{step:'any',decimals:6}),mass=v.slider('head mass (kg)',10,100,50,{step:'any',decimals:6}),progress=v.slider('fraction of displayed isolated stroke',0,1,.3,{step:'any',decimals:6}),A=v.stage({x:[-.5,1.5],y:[-.45,2],equal:true,axes:false,height:310,minWidth:260,title:'single guided vertical stamp'}),B=v.stage({x:[-.1,2],y:[-.1,1.2],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'time from lift start (s)',ylabel:'head height above impact (m)',title:'complete isolated motion and next deadline'});let info;
        v.legend([['orange','prescribed constrained lift'],['green','isolated head motion'],['red','next scheduled lug'],['gold','selected time',{dot:true}]]);
        v.render(()=>{const p=stampStroke(lugs.value,rpm.value,duty.value,height.value,mass.value,progress.value),y=.2+p.current.y;A.rect(.2,-.25,.9,.1,{color:'muted',fill:'muted',fillAlpha:.3});A.line(.18,.1,.18,1.8,{color:'muted',width:2});A.line(.92,.1,.92,1.8,{color:'muted',width:2});A.rect(.32,y-.1,.78,y+.1,{color:'accent',fill:'accent',fillAlpha:.4});A.line(.55,y+.1,.55,y+.55,{color:'ink',width:3});A.text('impact surface',.55,-.35,{align:'center',color:'muted',size:10});B.setView([-.05*p.end,1.05*p.end],[-.15*p.height,1.22*p.height]);B.path(p.headCurve,{color:'green',width:2.3});B.path(p.liftCurve,{color:'orange',width:2,dash:[4,3]});B.line(p.T,0,p.T,p.height,{color:'red',width:1.5,dash:[4,3]});B.dot(p.impactTime,0,{color:'red',r:4,ring:false});B.dot(p.time,p.current.y,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `At ${v.fix(p.time,9)} s: ${p.current.phase}, height ${v.fix(p.current.y,9)} m, velocity ${v.fix(p.current.v,9)} m/s. Lift ends ${v.fix(p.liftTime,9)} s; isolated impact ${v.fix(p.impactTime,9)} s; next scheduled lug ${v.fix(p.T,9)} s: ${p.hitBeforeNext?'impact precedes next lug':'next lug would intervene'}.\nMinimum prescribed guide force ${v.fix(p.minGuideForce,9)} N: ${p.oneSided?'nonnegative throughout lift':'a retaining constraint would be required'}. Isolated impact ${v.fix(p.impactSpeed,9)} m/s, ${v.fix(p.energy,9)} J. ${p.cycleCompatible?`Compatible ideal energy per period ${v.fix(p.nominalPower,9)} W; drive losses omitted.`:'A repeated-cycle power is not inferred for this setting.'}`;});
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num:'4.8',kind:'Invention',name:'The heavy plough and the horse collar',verify:true,
      credit:'Harness and implement interaction: F. Inns, FAO field report; force comparison authored here',
      statement:String.raw`A mouldboard plough cuts and turns a strip of soil. Harnesses connect the animal to the implement; fit, load distribution and the angle of pull matter. F. Inns's FAO report describes collar, split-collar and breastband systems for equines, and field trials that varied the pull angle with an adjustable hip strap. It measures draught as the horizontal component of trace tension. It also warns that implement weight, adjustment, soil and work quality affect the comparison.

A collar's historical effect cannot be assigned a universal force multiplier from this geometry. The picture studies an explicitly prescribed horizontal resistance and a chosen per-animal axial capacity. These are comparison inputs, without a medieval field calibration, harness-efficiency claim or daily acreage forecast.`,
      idea:String.raw`For the authored resistance rule, let k be specific resistance in kN/m² and w,d be furrow width and depth in metres: $D=1000kwd$. With trace angle $\theta$,
$$F=D/\cos\theta,\qquad F_y=D\tan\theta.$$
The animal pulls the implement toward its attachment point. Positive $F_y$ lifts the implement and exerts an equal downward reaction on the animal; a lower animal attachment reverses this component. If each animal can supply axial tension C at this same angle and load is shared equally, the continuous demand is F/C and the integer team is its ceiling.

Holding D fixed isolates vector decomposition. In actual tillage D itself can change when the attachment angle changes: Inns's measured examples and effective-vertical-force argument illustrate that interaction. The selected C is an authored axial capacity.`,
      caption:String.raw`Drag either attachment point, or use its registered height control, to tilt the trace. Change the authored soil rule, furrow size and axial capacity. The arrows show the horizontal and vertical components at the clevis. The full depth curve uses the same angle and capacity as the readout, and its scale includes the largest offered depth.`,
      deps:['tech-1.8','tech-3.3','arch-1.2'],see:['tech-4.9'],refs:['F. Inns, Matching tillage implements to draught animal potential, FAO: Fundamentals, field trials and angle-of-pull discussion'],tags:['agriculture','forces'],
      scope:String.raw`Static straight trace, fixed 3.5-m horizontal separation, no friction in the coupling and equal axial load sharing. The resistance coefficient, capacity and dimensions are authored examples. Angle-dependent soil feedback, animal physiology, gait, fitting and harness efficiency are omitted. A force-equivalent team size is conditional on these assumptions.`,
      links:{source:'https://www.fao.org/4/W0613T/w0613T0g.htm'},
      viz(v){const k=v.slider('authored resistance k (kN/m²)',20,80,45,{step:'any',decimals:6}),width=v.slider('furrow width (cm)',15,40,25,{step:'any',decimals:6}),depth=v.slider('furrow depth (cm)',5,30,18,{step:'any',decimals:6}),ah=v.slider('animal attachment height (m)',.8,1.7,1.35,{step:'any',decimals:6}),ch=v.slider('implement attachment height (m)',.15,1.2,.55,{step:'any',decimals:6}),capacity=v.slider('chosen axial capacity per animal (N)',200,1000,600,{step:'any',decimals:6}),A=v.stage({x:[-.3,5.2],y:[-.35,2.05],axes:false,equal:true,height:280,minWidth:260,title:'straight trace and clevis force components'}),B=v.stage({x:[3,32],y:[-1,10],axes:'box',gutter:true,height:300,minWidth:260,xlabel:'furrow depth (cm)',ylabel:'axial force / chosen capacity',title:'full conditional team demand'}),ha=A.handle(.8,1.35,{color:'orange',r:7,constrain:(_x,y)=>[.8,Math.max(.8,Math.min(1.7,y))]}),hc=A.handle(4.3,.55,{color:'gold',r:7,constrain:(_x,y)=>[4.3,Math.max(.15,Math.min(1.2,y))]});for(const[h,x,lo,hi]of[[ha,.8,.8,1.7],[hc,4.3,.15,1.2]]){const set=h.set;h.set=(a,b)=>{if(a!==x||!Number.isFinite(b)||b<lo||b>hi)throw new RangeError('invalid trace attachment');set(a,b);};}ha.onDrag=()=>ah.set(ha.y);hc.onDrag=()=>ch.set(hc.y);v.shareState('trace endpoint agreement',{get:()=>[ah.value,ch.value],validate:s=>Array.isArray(s)&&s.length===2&&s.every(Number.isFinite)&&s[0]>=.8&&s[0]<=1.7&&s[1]>=.15&&s[1]<=1.2,set:s=>{if(s[0]!==ah.value||s[1]!==ch.value||ha.y!==s[0]||hc.y!==s[1])throw new RangeError('invalid trace endpoint agreement');}});let info;
        v.legend([['accent','straight trace'],['orange','animal attachment'],['green','horizontal force'],['red','vertical force'],['gold','selected depth / clevis']]);
        v.render(()=>{const p=draught(k.value,width.value,depth.value,ah.value,ch.value,capacity.value);ha.set(.8,p.animalHeight);hc.set(4.3,p.clevisHeight);A.line(0,0,5,0,{color:'muted',width:1.5});A.rect(.35,.7,1.4,1.55,{color:'muted',fill:'muted',fillAlpha:.15,width:1});A.path([[4.3,p.clevisHeight],[3.9,.2],[3.6,0]],{color:'ink',width:2});A.line(.8,p.animalHeight,4.3,p.clevisHeight,{color:'accent',width:2});const scale=1.2/p.F,x=4.3-p.D*scale,y=p.clevisHeight+p.vertical*scale;A.arrow(4.3,p.clevisHeight,x,p.clevisHeight,{color:'green',width:2,head:7});A.arrow(x,p.clevisHeight,x,y,{color:'red',width:2,head:7});const max=p.depthCurve.at(-1)[1];B.setView([3,32],[-.12*max,1.18*max]);B.path(p.depthCurve,{color:'green',width:2.3});B.dot(p.depth,p.continuous,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Horizontal resistance ${v.fix(p.D,9)} N; angle ${v.fix(p.angle*180/Math.PI,9)}°. Trace tension ${v.fix(p.F,9)} N; vertical component on implement ${v.fix(p.vertical,9)} N.\nChosen capacity ${v.fix(p.capacity,9)} N per animal: continuous demand ${v.fix(p.continuous,9)}, conditional integer team ${p.team}. This comparison holds the prescribed horizontal resistance fixed as the trace angle changes.`;});
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num:'4.9',kind:'Invention',name:'The stirrup',verify:true,
      credit:'Bayarsaikhan and colleagues, Antiquity 2024, Mongolian saddle/stirrup evidence; sequential coupling model authored here',
      statement:String.raw`A stirrup is a foot support suspended from a saddle. Bayarsaikhan and colleagues report a small iron stirrup from Khukh Nuur and a birch frame saddle from Urd Ulaan Uneet in Mongolia. The Khukh Nuur date of 243–405 cal AD comes from associated human bone, with an explicit possible freshwater reservoir effect; it does not directly date the iron. The saddle's horse-hide strap was directly dated to 267–535 cal AD at 95.4% probability. Its bilateral hanging straps suggest paired stirrups, although no stirrups were recovered with that saddle.

The model below isolates how finite coupling between moving masses changes transferred momentum. Its force capacities are authored choices, rather than measurements of stirrups, a reconstruction of combat, or evidence for an historical cause of feudalism.`,
      idea:String.raw`First, a rider of mass $m_r$ moving at speed v captures a stationary target $m_t$ in an instantaneous perfectly inelastic collision. Their joined mass $M=m_r+m_t$ begins at $u_0=m_rv/M$. A horse $m_h$ remains at v. Then a constant internal force F accelerates the joined body and slows the horse until the chosen time or equal speeds, whichever occurs first.
$$I=\min\{Ft,K\},$$
$$K=\frac{v-u_0}{1/m_h+1/M}.$$
The final speeds are $u=u_0+I/M$ and $w=v-I/m_h$. The target's total impulse is
$$J=m_tu=m_tu_0+(m_t/M)I.$$
The factor $m_t/M$ is essential: internal horse-to-rider impulse does not all become target impulse. At equal speeds the result is the combined perfectly inelastic value $m_t(m_r+m_h)v/(m_r+m_h+m_t)$. Momentum is conserved throughout and kinetic energy decreases.`,
      caption:String.raw`Compare a chosen baseline coupling capacity with that capacity plus a chosen extra bracing force. Change speed, both force choices and elapsed coupling time. The complete curves include time zero and show saturation when speeds equalize. The selected points report actual target impulses, both remaining speeds and dissipated energy. This is a sequential three-mass thought experiment, with no claim that a stirrup supplies the selected force.`,
      deps:['mech-2.1','mech-2.6'],see:['tech-4.8'],refs:['Bayarsaikhan et al., The origins of saddles and riding technology in East Asia, Antiquity 98(397),102–118 (2024), pp.109–114; DOI 10.15184/aqy.2023.172'],tags:['riding','mechanics','archaeology'],
      scope:String.raw`Fixed masses: rider 80 kg, horse 450 kg, target 80 kg. One-dimensional instantaneous rider–target capture is followed by bounded constant dissipative coupling; the force switches off at equal speed. No further external impulse, lance compliance, saddle geometry, rider balance or injury model is included. Historical sample dates retain their material and uncertainty qualifications.`,
      links:{source:'https://doi.org/10.15184/aqy.2023.172'},
      viz(v){const speed=v.slider('initial rider / horse speed (m/s)',3,12,7,{step:'any',decimals:6}),seat=v.slider('chosen baseline coupling force (N)',0,1500,550,{step:'any',decimals:6}),brace=v.slider('chosen additional bracing force (N)',0,1600,800,{step:'any',decimals:6}),time=v.slider('time after rider–target capture (s)',0,.3,.05,{step:'any',decimals:6}),A=v.stage({x:[-.02,.32],y:[-10,700],axes:'box',gutter:true,height:320,minWidth:260,xlabel:'elapsed coupling time (s)',ylabel:'target impulse (N s)',title:'momentum transfer after instantaneous capture'}),B=v.stage({x:[-.02,.32],y:[-1,14],axes:'box',gutter:true,height:320,minWidth:260,xlabel:'elapsed coupling time (s)',ylabel:'speed (m/s)',title:'braced case: horse and joined-body speeds'});let info;
        v.legend([['red','baseline target impulse'],['green','with extra chosen force / joined speed'],['purple','horse speed'],['gold','selected time']]);
        v.render(()=>{const p=riderCoupling(speed.value,seat.value,brace.value,time.value);A.setView([-.02,.32],[-.12*p.Jfull,1.18*p.Jfull]);A.path(p.plainCurve,{color:'red',width:2.1});A.path(p.bracedCurve,{color:'green',width:2.1});A.line(0,p.Jfull,.3,p.Jfull,{color:'muted',width:1,dash:[4,3]});A.dot(p.time,p.plain.J,{color:'red',r:4,ring:false});A.dot(p.time,p.braced.J,{color:'green',r:4,ring:false});B.setView([-.02,.32],[-.12*p.speed,1.18*p.speed]);const I=t=>Math.min((p.seat+p.brace)*t,p.K);B.path(p.times.map(t=>[t,p.u0+I(t)/p.M]),{color:'green',width:2.2});B.path(p.times.map(t=>[t,p.speed-I(t)/p.mh]),{color:'purple',width:2.2});B.dot(p.time,p.braced.u,{color:'green',r:4,ring:false});B.dot(p.time,p.braced.w,{color:'purple',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Initial target impulse ${v.fix(p.J0,9)} N s; fully equalized ceiling ${v.fix(p.Jfull,9)} N s. Baseline target impulse ${v.fix(p.plain.J,9)}; braced ${v.fix(p.braced.J,9)} N s.\nBraced internal coupling impulse ${v.fix(p.braced.I,9)} N s; joined speed ${v.fix(p.braced.u,9)}, horse speed ${v.fix(p.braced.w,9)} m/s; total kinetic-energy loss ${v.fix(p.braced.loss,9)} J, including initial capture. Equalization time ${p.braced.equalTime===null?'never with zero force':v.fix(p.braced.equalTime,9)+' s'}.`;});
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num:'4.10',kind:'Invention',name:'The canal pound lock',verify:false,
      credit:'Lock operation described by the Canal & River Trust; ideal level-change and water budget authored here',
      statement:String.raw`A pound lock is a chamber between gated water levels. Paddles admit or discharge water while the main gates are closed; after the chamber and the next reach have equal levels, the relevant gate can open. This mechanism is described in the Canal & River Trust's operational handbook. The handbook also recommends sharing broad locks to save water; a chamber cycle need not correspond to just one boat.

The comparison below begins with a boat already inside and follows one level change. Filling withdraws water from the upper pound into the chamber. Emptying delivers stored chamber water to the lower pound. These are different transfers; water entering the chamber has not already reached the lower pound.`,
      idea:String.raw`Let chamber area be $A=LW$ and lift be H. With fixed external levels, negligible boat displacement and constant effective paddle coefficient $C_d=0.6$, the remaining head difference obeys
$$A\dot h=-C_da\sqrt{2gh}.$$
Its filling/emptying duration is
$$t_f=\frac{2A\sqrt H}{C_da\sqrt{2g}}.$$
At elapsed fraction $\tau$, remaining head is $H(1-\tau)^2$ and transferred volume is $AH\tau(2-\tau)$. During filling, chamber storage increases by the upper withdrawal. During emptying, storage decreases by the lower delivery. An ideal complete fill-and-empty cycle transfers AH between the pounds; actual water demand also depends on preparation, leakage, boat movements, sharing and water-saving works.`,
      caption:String.raw`Choose filling/up or emptying/down, chamber dimensions, lift, paddle area and elapsed fraction. The boat stays within the chamber and follows its water level; it is a marker with no displacement feedback. Green gate markers mean levels match and that gate is ready to open, not that an unequal-level gate has been opened. The second panel shows the complete normalized chamber level and transfer curves. Read upper withdrawal, lower delivery and chamber storage change separately. The timing is an authored ideal-orifice comparison.`,
      deps:['tech-4.3','fluid-2.10'],see:['tech-8.9'],refs:['Canal & River Trust, Boaters’ Handbook: Boating through locks','Canal & River Trust, Boaters’ Handbook full lock transcript, gate levels and sharing; Annual Lockage Report webpage, cycle definition'],tags:['canals','hydraulics'],
      scope:String.raw`Uniform rectangular chamber, fixed large-pool levels, constant effective paddle area and coefficient, quasi-steady flow, no leakage, no culvert inertia and negligible boat displacement are assumed. Only one chamber level change is modelled. The fill/empty water balance is not a per-boat calibration, a flash-lock loss measurement, a gate-load calculation or a prediction for a real lock.`,
      links:{source:'https://canalrivertrust.org.uk/boating/go-boating/a-guide-to-boating/boaters-handbook/boating-through-locks',budget:'https://canalrivertrust.org.uk/our-cause/looking-after-canals-and-rivers/managing-our-water/annual-lockage-report'},
      viz(v){
        const length=v.slider('chamber length (m)',15,60,30,{step:'any',decimals:6}),width=v.slider('chamber width (m)',3,9,6,{step:'any',decimals:6}),lift=v.slider('lift H (m)',1,4,2.5,{step:'any',decimals:6}),paddle=v.slider('effective paddle area (m²)',.1,1.5,.6,{step:'any',decimals:6}),progress=v.slider('elapsed fraction of level change',0,1,.5,{step:'any',decimals:6}),direction=v.select('level change',[{value:'up',label:'filling / up'},{value:'down',label:'emptying / down'}],'up'),A=v.stage({x:[-5,105],y:[-1,5],axes:false,height:310,minWidth:260,title:'boat already inside; gates equalize first'}),B=v.stage({x:[-.06,1.06],y:[-.12,1.12],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'elapsed fraction of ideal duration',ylabel:'fraction of full height / volume',title:'complete level and transfer histories'});let info;
        v.legend([['accent','chamber water / normalized level'],['orange','boat marker'],['green','normalized transfer / gate ready'],['gold','selected elapsed fraction',{dot:true}]]);
        v.render(()=>{const p=lockChange(length.value,width.value,lift.value,paddle.value,progress.value,direction.value),x0=50-p.L/2,x1=50+p.L/2,b=.55*Math.min(p.L*.6,8);A.setView([-5,105],[-1,p.H+1.3]);A.rect(0,-.55,x0,p.H,{fill:'accent',fillAlpha:.22,stroke:false});A.rect(x0,-.55,x1,p.level,{fill:'accent',fillAlpha:.35,stroke:false});A.rect(x1,-.55,100,0,{fill:'accent',fillAlpha:.22,stroke:false});A.line(0,p.H,x0,p.H,{color:'accent',width:2});A.line(x0,p.level,x1,p.level,{color:'accent',width:2});A.line(x1,0,100,0,{color:'accent',width:2});A.line(0,-.55,100,-.55,{color:'muted',width:2});A.line(x0,-.55,x0,p.H+.7,{color:'ink',width:3});A.line(x1,-.55,x1,p.H+.7,{color:'ink',width:3});A.dot(x0,p.H+.85,{color:p.upperReady?'green':'muted',r:4,ring:false});A.dot(x1,p.H+.85,{color:p.lowerReady?'green':'muted',r:4,ring:false});A.poly([[50-b,p.level+.4],[50+b,p.level+.4],[50+b-.8,p.level-.08],[50-b+.8,p.level-.08]],{color:'orange',fill:'orange',fillAlpha:.5,width:1.2});B.path(p.levelCurve,{color:'accent',width:2.5});B.path(p.transferCurve,{color:'green',width:1.6,dash:[4,3]});B.dot(p.progress,p.level/p.H,{color:'accent',r:4,ring:false});B.dot(p.progress,p.transfer/p.volume,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Time ${v.fix(p.time,9)} / ${v.fix(p.duration,9)} s; chamber level ${v.fix(p.level,9)} m; instantaneous flow ${v.fix(p.flow,9)} m³/s.\nSince this level change began: upper withdrawal ${v.fix(p.upperIn,9)} m³, lower delivery ${v.fix(p.lowerOut,9)} m³, storage change ${v.fix(p.storageChange,9)} m³. Ideal full level-change volume ${v.fix(p.volume,9)} m³; this is not a universal per-boat budget. Gate ready: upper ${p.upperReady?'yes':'no'}, lower ${p.lowerReady?'yes':'no'}.`;});
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Invention',
      name: 'Sternpost rudder and lateen sail',
      credit: 'Sternpost rudder: a Han pottery boat model (1st century CE) from Guangzhou, and European depictions c. 1180; lateen sail: Mediterranean, 2nd century CE iconography, excavated rigs from about 400 CE. Transmission between regions is argued, not settled',
      verify: true,
      statement: String.raw`Two steering and driving devices changed how ships were handled. The **sternpost rudder** is a vertical blade hinged on the stern post, on the centreline, turned by a tiller; it replaced the paddle-like **steering oars** hung over the quarters of ancient ships. The **lateen sail** is a triangular (or four-sided) sail on a long yard set obliquely to the mast, so that it lies along the boat, like later fore-and-aft sails, and not across it as a **square sail** does.

Dates, as far as I could confirm from secondary sources. For the rudder: a 61 cm pottery junk from a Han tomb in Guangzhou (1st century CE) shows a stern-mounted rudder, which Needham and others take to precede its European appearance by about a thousand years; Arab sources describe a sternpost rudder by 985 (al-Muqaddasi); the oldest known European depictions of a pintle-and-gudgeon rudder, on carvings at Zedelgem and Winchester, are about 1180. Needham held that it passed from China to the West; the sources I read do not give a detailed counter-argument. For the lateen sail: depictions on a 2nd-century gravestone and a 4th-century mosaic, the excavated Yassi Ada II ship of about 400 CE, and the Kelenderis mosaic (late 5th to early 6th century, which some read as square-rigged); by the 6th century it had largely replaced the square sail in Mediterranean pictures. The old belief that it came from the East has been revised in favour of a Mediterranean origin.

The popular claim that the lateen rig took over because it sails better to windward is itself contested: a study by Whitewright found the two rigs' performance very similar, and attributes the change to cost (fewer parts and less rope). The model below therefore does not assume that the lateen is better; it lets you set how close to the boat's axis each rig can be trimmed, and shows what follows.`,
      idea: String.raw`A sail is a foil. In an apparent wind $A=U-V$ (true wind minus the boat's velocity) a thin sail at angle of attack $\alpha$ gives a lift and a drag (fluid-5.4, aero-1.3). Only the part of the sail force along the boat's heading drives it; the keel is assumed to cancel the sideways part. The boat's speed is where that drive equals hull resistance, which here grows as $v^2$.

How close to the wind a boat can point depends mostly on how near the boat's axis the sail can be set. A square sail hangs from a yard that braces round against the shrouds, and cannot be braced far; a sail on an oblique yard can be sheeted nearer the centreline. Set the two limits the same and the polars coincide, which is the Whitewright point: the rig matters through the trim angle, and hull shape matters as much. Note too that the model has no leeway, no heel, and a sail of invented shape; the numbers are for comparison between rigs, not predictions.`,
      caption: String.raw`Polar diagram: the wind blows from the top; the distance from the centre to the curve is the boat's speed in that direction. Set how close to the boat's axis each rig's sail can be trimmed (**square** and **fore-and-aft**) and the **hull drag**. The marked points are the best speed made good toward the wind. Drag the **heading** slider to see the sail trimmed for that heading. Bottom right: the steering oar on the high side loses blade depth as the boat heels, while a rudder on the centreline does not. Below: the dated evidence for the lateen sail and the sternpost rudder.`,
      deps: ['fluid-5.4', 'aero-1.3'],
      see: ['tech-4.6', 'fluid-4.11'],
      refs: ['Mokyr ch. 3', 'Needham, Science and Civilisation in China 4.3, Johnstone & McGrail (1988), as cited by Wikipedia “Rudder”', 'Whitewright (2009–2012), Casson (1995), as cited by Wikipedia “Lateen”'],
      tags: ['medieval', 'ships', 'transmission disputed'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lateen' },
      viz(v) {
        const A = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 340, weight: 1.2, minWidth: 340, title: 'boat speed by heading (polar)' });
        const R = v.stage({ x: [0, 30], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 280, xlabel: 'heel (°)', ylabel: 'blade depth in water', title: 'steering blade of a heeling boat' });
        const Y = yearStage(v, [-600, 1300], { height: 230, full: true, title: 'dated evidence' });
        const dSq = v.slider('closest trim, square sail (°)', 10, 70, 40, { step: 1 });
        const dLa = v.slider('closest trim, fore-and-aft (°)', 5, 70, 20, { step: 1 });
        const hull = v.slider('hull drag', 0.2, 1.2, 0.5, { step: 0.05 });
        const head = v.slider('heading from the wind (°)', 20, 180, 70, { step: 1 });
        const bOff = v.slider('steering oar offset (m)', 0.5, 2, 1.1, { step: 0.05 });
        let key = '', pol = null;
        const G0 = Array.from({ length: 46 }, (_, i) => (i * 4) * D2R);
        v.render(() => {
          const k = `${dSq.value}|${dLa.value}|${hull.value}`;
          if (k !== key) { key = k; pol = { sq: G0.map((g) => boatSpeed(g, dSq.value * D2R, hull.value)), la: G0.map((g) => boatSpeed(g, dLa.value * D2R, hull.value)) }; }
          const vmax = Math.max(0.6, ...pol.sq.map((p) => p.v), ...pol.la.map((p) => p.v));
          A.setView([-vmax * 1.25, vmax * 1.25], [-vmax * 1.25, vmax * 1.25]);
          for (const r of [0.5, 1, 1.5, 2, 2.5].filter((q) => q < vmax * 1.2)) A.circle(0, 0, r, { color: 'grid', width: 1, fill: false });
          const ring = (arr, col) => { const pts = arr.map((p, i) => [p.v * Math.sin(G0[i]), p.v * Math.cos(G0[i])]); A.path(pts, { color: col, width: 2.6 }); A.path(pts.map(([x, y]) => [-x, y]), { color: col, width: 2.6 }); };
          ring(pol.sq, 'orange'); ring(pol.la, 'green');
          const vmg = (arr, sgn) => { let b = 0, bi = 0; arr.forEach((p, i) => { const q = sgn * p.v * Math.cos(G0[i]); if (q > b) { b = q; bi = i; } }); return { v: b, i: bi }; };
          const uSq = vmg(pol.sq, 1), uLa = vmg(pol.la, 1), dSqd = vmg(pol.sq, -1), dLad = vmg(pol.la, -1);
          A.dot(pol.sq[uSq.i].v * Math.sin(G0[uSq.i]), pol.sq[uSq.i].v * Math.cos(G0[uSq.i]), { r: 5, color: 'orange', hollow: true });
          A.dot(pol.la[uLa.i].v * Math.sin(G0[uLa.i]), pol.la[uLa.i].v * Math.cos(G0[uLa.i]), { r: 5, color: 'green', hollow: true });
          // wind arrow
          A.arrow(0, vmax * 1.2, 0, vmax * 0.95, { color: 'gold', width: 3, head: 9 }); A.text('wind', 0.08 * vmax, vmax * 1.08, { size: 11.5, color: 'gold', align: 'left', baseline: 'middle' });
          // the chosen heading: boat with its sail trimmed for the green rig
          const g = head.value * D2R, bs = boatSpeed(g, dLa.value * D2R, hull.value), b = [Math.sin(g), Math.cos(g)];
          const L0 = vmax * 0.22, c = (sg) => [Math.cos(sg * bs.d) * -b[0] - Math.sin(sg * bs.d) * -b[1], Math.sin(sg * bs.d) * -b[0] + Math.cos(sg * bs.d) * -b[1]];
          const bx = b[0] * bs.v, by = b[1] * bs.v;
          A.arrow(0, 0, bx, by, { color: 'green', width: 2, head: 7 }); A.dot(bx, by, { r: 4, color: 'green' });
          const sgn = bs.d >= 0 ? 1 : -1, cc = (() => { const d = Math.abs(bs.d) * sgn; return [-(b[0] * Math.cos(d) - b[1] * Math.sin(d)), -(b[0] * Math.sin(d) + b[1] * Math.cos(d))]; })();
          A.poly([[bx + b[0] * L0 * 0.6, by + b[1] * L0 * 0.6], [bx - b[0] * L0 * 0.6, by - b[1] * L0 * 0.6], [bx - b[0] * L0 * 0.3 + 0, by - b[1] * L0 * 0.3]], { fill: 'green', fillAlpha: 0.0, stroke: false });
          A.line(bx, by, bx + cc[0] * L0, by + cc[1] * L0, { color: 'green', width: 4 });
          A.line(bx + b[0] * L0 * 0.7, by + b[1] * L0 * 0.7, bx - b[0] * L0 * 0.7, by - b[1] * L0 * 0.7, { color: 'ink', width: 2 });
          A._v = { uSq, uLa, dSqd, dLad, bs, vSq: boatSpeed(g, dSq.value * D2R, hull.value) };
          // steering blade
          const heel = Array.from({ length: 31 }, (_, i) => i);
          R.fn((h) => clamp((0.9 - bOff.value * Math.sin(h * D2R)) / 0.9, 0, 1), { color: 'orange', width: 2.6 });
          R.fn((h) => Math.cos(h * D2R), { color: 'green', width: 2.6 });
          R.text('steering oar on the high side', 29.5, 0.18, { size: 10.5, color: 'orange', align: 'right', plate: true });
          R.text('rudder on the centreline', 29.5, 1.0, { size: 10.5, color: 'green', align: 'right', baseline: 'top', plate: true });
          drawYears(v, Y, [
            { t: [-475, -221], label: 'steering oars, Chinese models', color: 'muted' },
            { t: 150, label: '2nd c.: lateen on a gravestone' },
            { t: 75, label: '1st c.: Han rudder model, Guangzhou', color: 'green' },
            { t: 400, label: 'Yassi Ada II (lateen), c. 400' },
            { t: 500, label: 'Kelenderis mosaic (square or lateen?)', contested: true },
            { t: 625, label: 'Kellia graffito (early 7th c.)' },
            { t: 985, label: 'al-Muqaddasi: Arab rudder (985)', color: 'green' },
            { t: 1050, label: 'Dénia dish: lateen, 11th c.' },
            { t: 1180, label: 'Zedelgem and Winchester carvings (c. 1180)', color: 'green' },
          ], { lanes: 5, ticks: [-500, 0, 500, 1000] });
        });
        v.legend([['orange', 'square rig'], ['green', 'fore-and-aft (lateen) rig'], ['gold', 'wind']]);
        v.readout(() => {
          const w = A._v, f = (x) => v.fix(x, 2);
          return `best speed made good to windward: square **${f(w.uSq.v)}** at ${4 * w.uSq.i}° from the wind, fore-and-aft **${f(w.uLa.v)}** at ${4 * w.uLa.i}° (speeds in units of the true wind speed; hull drag ${f(hull.value)} × speed²) · downwind: ${f(w.dSqd.v)} and ${f(w.dLad.v)}\nat heading ${head.value}°: fore-and-aft boat speed ${f(w.bs.v)}, sail trimmed at ${v.fix(Math.abs(w.bs.d) / D2R, 0)}° to the axis; square-rig speed ${f(w.vSq.v)}. Set both limits equal and the curves coincide.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.12
    {
      num:'4.12',kind:'Paper',name:'The Natural Powers of Water and Wind to Turn Mills',verify:false,
      credit:'John Smeaton, 1759',
      paper:{authors:'John Smeaton',year:1759,title:'An Experimental Enquiry Concerning the Natural Powers of Water and Wind to Turn Mills, and Other Machines, Depending on a Circular Motion',venue:'Philosophical Transactions 51:100–174',doi:'10.1098/rstl.1759.0019'},introduces:['tech-4.5'],
      statement:String.raw`Smeaton's 1759 paper reports water-wheel and windmill-sail experiments on working models, with explicit warnings about scaling to full machines. For wind, he moved the sail axis on a large circular arm against still air, using a hand-pulled cord and pendulum timing. His specimen uses 21-inch-radius sails at a nominal centre speed of 6 ft/s. Table III (p.144) compares 19 sets of sail forms, weather angles and cloth quantities.

A plane sail at 35° of weather—55° to the axis—has printed product 318; tested plane sails at 15° and 18° have 464 and 462. Dutch, enlarged and elliptical-sector sails vary geometry and cloth area as well as position. The largest raw product therefore cannot alone establish the best output per unit cloth. The footnote on p.148 gives six angles tried at full size, 18°, 19°, 18°, 16°, 12½°, 7°, at radial stations 1/6 through 6/6. These are specified stations, not constant-angle bands covering an entire blade.`,
      idea:String.raw`The method seeks the load and rotation giving greatest useful work for the stated setup. Table III's printed Product is retained directly rather than reconstructed from other rounded columns. Dividing by its reported cloth area provides an arithmetic comparison within that table; it is not a modern power coefficient, aerodynamic fit or proof of an optimal universal sail.

The second panel changes angle convention through $\theta_{\rm axis}=90^\circ-\theta_{\rm plane}$. No blade-element solver or assumed interpolation converts the six historical stations into invented measured power curves. The paper's later wind-speed scaling rules are approximate experimental generalizations under like shape and position, not exact laws of every windmill.`,
      caption:String.raw`The left panel shows all 19 printed Table III products, or product divided by printed cloth area. Select a row to inspect its form, tip/greatest weather angles, product and area. The right panel shows the six full-size trial stations from the p.148 footnote; choose weather from the plane of rotation or its complementary angle from the axis. The selected Table III row and this separate footnote are identified independently. Water-wheel data and their denominator caveats are in 4.5.`,
      deps:['tech-4.4','tech-4.6'],see:['tech-4.4','tech-4.6'],refs:['Smeaton 1759, Phil. Trans. 51:100–174; actual pp.138–155, Table III p.144 and footnote p.148'],tags:['industrial','1759','experiment'],
      scope:String.raw`Only Table III's family, tip/greatest angles, printed product and cloth area are replayed. Printed rounding is preserved. No missing load or speed is inferred, and product/cloth area is not Cp. The six-station plot makes no radial interpolation or optimality claim. The source quantities are distinct from an aerodynamic model.`,
      links:{source:'https://www.engr.psu.edu/mtah/projects/pdf/smeaton1759.pdf',doi:'https://doi.org/10.1098/rstl.1759.0019'},
      viz(v){
        const row=v.slider('Table III selected row',1,19,1,{int:true}),basis=v.select('plotted quantity',[{value:'product',label:'printed product'},{value:'area',label:'product per cloth area'}],'product'),convention=v.select('six-station angle convention',[{value:'plane',label:'from rotation plane'},{value:'axis',label:'from axis'}],'plane'),A=v.stage({x:[-.1,20.1],y:[-150,1400],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'Table III set number',ylabel:'printed product',title:'all source sail comparisons'}),B=v.stage({x:[-.08,1.15],y:[-12,100],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'radial station ÷ radius',ylabel:'angle (°)',title:'separate full-size trial stations'});let info;
        A.onClick((x,y)=>{const p=smeatonWind(row.value,basis.value,convention.value);let best=null;for(const pt of p.points){const d=Math.hypot(A.X(pt[0])-A.X(x),A.Y(pt[1])-A.Y(y));if(!best||d<best.d)best={d,row:pt[0]};}if(best&&best.d<=18)row.set(best.row);});
        v.legend([['accent','Table III printed quantities'],['green','p.148 six stations'],['gold','selected Table III row',{dot:true}]]);
        v.render(()=>{const p=smeatonWind(row.value,basis.value,convention.value);A.setView([-.1,20.1],p.y);A.setLabels(undefined,p.basis==='product'?'printed product':'printed product ÷ cloth area');for(const q of p.points)A.dot(...q,{color:'accent',r:4,ring:false});A.dot(...p.selected,{color:'gold',r:7,hollow:true});for(const[x,y]of p.angles){B.line(x,0,x,y,{color:'green',width:2});B.dot(x,y,{color:'green',r:4,ring:false});}info=p;});
        v.readout(()=>{if(!info)return'';const p=info,[family,tip,greatest,product,area]=p.source;return `Table III row ${p.row}, ${family}: tip weather ${tip}°, greatest weather ${greatest}°; printed Product ${product}, cloth area ${area} in². Plotted ${v.fix(p.selected[1],9)} ${p.basis==='area'?'product per in²':'printed product units'}.\nSeparate footnote stations, measured from ${p.convention==='plane'?'rotation plane':'axis'}: ${p.angles.map(q=>q[1]+'°').join(', ')}. No inferred power coefficient.`;});
      },
    },
  ],
};
