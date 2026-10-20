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
      num: '4.8',
      kind: 'Invention',
      name: 'The heavy plough and the horse collar',
      credit: 'Early medieval northern Europe (heavy plough); horse collar: earliest secure depiction in China, 5th century CE (Dunhuang), and in Europe c. 800–1000. Both the dates and the size of their effects are disputed',
      verify: true,
      statement: String.raw`The **heavy plough** has a vertical **coulter** to cut the sod, a **share** to cut it from below and a **mouldboard** to turn it over, so it opens a deep furrow in wet, heavy soils where the older scratch plough (the ard) only scored the surface. It needs a strong team. The **horse collar** is a padded, stiff ring resting on a horse's shoulders, so that the horse pulls with its chest and shoulders and not against its windpipe.

The historical claim associated with Lynn White Jr. (*Medieval Technology and Social Change*, 1962) is that these inventions, together with the horseshoe, let medieval Europe plough the heavy northern soils and raised agricultural output, and that the collar multiplied a horse's useful pull. How much of this survives is disputed. The idea that the older throat-and-girth harness choked the horse goes back to Lefebvre des Noëttes (1931), and a test attributed to him is quoted as limiting two horses to about 1100 lb against about 1½ tons for one horse in a collar (as cited by Needham). Reconstructions by Spruytte (published 1977 and 1983), working with M. Littauer, found that ancient harnesses, correctly fitted, let a horse pull nearly as much; on that view the collar's real gain was a lower point of attachment, which suited ploughing. The modest effect of the collar is also argued by Weller. I could not check the original measurements, so the two views below are presented as claims, not data.

What the picture does compute is statics. The trace from the harness to the plough's clevis is a straight line; the pull along it has a horizontal part that the soil resists and a vertical part that depends on how high the horse's attachment is above the clevis. The numbers for soil resistance and the pull of an animal are illustrative round figures.`,
      idea: String.raw`The plough needs a horizontal force $D$ to cut and turn a furrow of cross-section $A_f$ (depth times width): $D=k A_f$, with a specific draught $k$ that depends on soil and moisture and is tens of kilonewtons per square metre in field trials of modern mouldboard ploughs. Deeper furrows in heavier soils need more animals.

The trace carries a tension $F$ at an angle $\vartheta$ to the horizontal, so the horizontal part is $F\cos\vartheta=D$ and the vertical part is $F\sin\vartheta=D\tan\vartheta$ (arch-1.2): when the horse's attachment is higher than the clevis it lifts the plough and loads the horse's shoulders downward. A lower attachment reduces both. Whether a team can supply $D$ depends on the pull each animal can keep up over the working day, often put at about a tenth of its weight at walking pace (a rule of thumb from secondary sources), and on how much of that the harness lets the animal use: a factor of 1 in the Spruytte view, much less in Lefebvre's.`,
      caption: String.raw`Left: the side view of a plough team. Drag the **orange attachment** point on the horse (the harness) up and down, and the **gold clevis** on the plough beam: the trace tilts, the pull $F$ grows as $D/\cos\vartheta$, and the vertical part lifting the plough (or pressing down the horse) appears. Right: how many animals a furrow needs as it deepens. Choose the **harness view**: Lefebvre's (a horse in the old harness delivers about a fifth of its pull; set from the quoted test ratio) or Spruytte's (nearly all of it). The horse's speed is taken as 1.5 times an ox's, as secondary sources say, so the area ploughed per day differs too.`,
      deps: ['tech-1.8', 'tech-3.3', 'arch-1.2'],
      see: ['tech-4.9', 'mech-1.15'],
      refs: ['Mokyr ch. 3', 'White, Medieval Technology and Social Change (Oxford: Clarendon, 1962)', 'Spruytte, Early Harness Systems (London: Allen, 1983)', 'Weller, Roman Traction Systems (online), and Needham (1986) as cited by Wikipedia “Horse collar”'],
      tags: ['medieval', 'agriculture', 'disputed'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Horse_collar' },
      viz(v) {
        const A = v.stage({ x: [-0.6, 5.2], y: [-0.2, 2.1], equal: true, axes: false, height: 300, weight: 1.15, minWidth: 340, title: 'line of draught' });
        const B = v.stage({ x: [5, 30], y: [0, 14], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 320, xlabel: 'furrow depth (cm)', ylabel: 'animals needed', title: 'team size' });
        const view = v.select('harness view', [{ value: 'L', label: 'Lefebvre: old harness weak' }, { value: 'S', label: 'Spruytte: nearly equal' }], 'S');
        const kS = v.slider('soil resistance $k$ (kN/m²)', 20, 80, 45, { step: 1 });
        const wF = v.slider('furrow width (cm)', 15, 40, 25, { step: 1 });
        const depth = v.slider('furrow depth (cm)', 5, 30, 18, { step: 1 });
        const ha = A.handle(0.8, 1.35, { color: 'orange', r: 8, label: 'harness', labelPos: 'ne', constrain: { x: [0.8, 0.8], y: [0.8, 1.7] } });
        const hc = A.handle(4.3, 0.55, { color: 'gold', r: 8, label: 'clevis', labelPos: 'ne', constrain: { x: [4.3, 4.3], y: [0.15, 1.2] } });
        const PULL = { horse: 450 * G * 0.1, ox: 600 * G * 0.1 }; // sustained pull, N (illustrative: a tenth of body weight)
        v.render(() => {
          const eff = view.value === 'L' ? 550 / 3000 : 1;
          const D = kS.value * 1000 * (depth.value / 100) * (wF.value / 100);
          const dx = hc.x - ha.x, dy = ha.y - hc.y, th = Math.atan2(dy, dx), F = D / Math.cos(th), Fv = D * Math.tan(th);
          // horse (facing left): body, legs, head
          A.poly([[0.5, 1.15], [0.55, 1.45], [0.9, 1.5], [1.9, 1.4], [2.1, 1.0], [1.9, 0.75], [0.7, 0.8]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 });
          A.poly([[0.55, 1.45], [0.15, 1.65], [0.0, 1.5], [0.2, 1.25], [0.5, 1.2]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 });
          for (const x of [0.65, 0.85, 1.7, 1.9]) A.line(x, 0.8, x, 0, { color: 'muted', width: 2.5 });
          A.line(-0.6, 0, 5.2, 0, { color: 'muted', width: 2.5 });
          // plough
          A.path([[hc.x, hc.y], [4.0, 0.3], [3.7, 0.0]], { color: 'ink', width: 3 });
          A.poly([[3.7, 0], [4.1, 0], [3.95, -0.12]], { fill: 'ink', fillAlpha: 0.6, color: 'ink', width: 1 });
          A.line(4.0, 0.3, 4.9, 1.0, { color: 'ink', width: 3 });
          A.text('plough', 4.6, 1.2, { size: 11, color: 'muted' });
          A.rect(2.6, -0.2, 3.7, 0, { fill: 'orange', fillAlpha: 0.18, stroke: false }); A.text('furrow', 3.15, -0.15, { size: 10, color: 'muted', align: 'center' });
          // trace and components
          A.line(ha.x, ha.y, hc.x, hc.y, { color: 'accent', width: 3 });
          const sc = 1.3 / Math.max(F, 1);
          A.arrow(hc.x, hc.y, hc.x - D * sc, hc.y, { color: 'green', width: 2, head: 7 });
          A.arrow(hc.x - D * sc, hc.y, hc.x - D * sc, hc.y + Fv * sc, { color: 'red', width: 2, head: 7 });
          A.text(`D = ${v.fix(D / 1000, 2)} kN`, hc.x - D * sc / 2, hc.y - 0.12, { size: 10.5, color: 'green', align: 'center', baseline: 'top', plate: true });
          if (Math.abs(Fv) > 30) A.text(`${Fv >= 0 ? 'lift' : 'push'} ${v.fix(Math.abs(Fv) / 1000, 2)} kN`, hc.x - D * sc - 0.08, hc.y + Fv * sc / 2, { size: 10.5, color: 'red', align: 'right', plate: true });
          A.text(`angle ${v.fix(th / D2R, 1)}°`, 2.6, 0.95, { size: 11, color: 'accent', align: 'center', plate: true });
          A._D = D; A._F = F; A._Fv = Fv; A._th = th;
          // team size curve
          const dd = (x) => kS.value * 1000 * (x / 100) * (wF.value / 100);
          B.fn((x) => dd(x) / PULL.ox, { color: 'orange', width: 2.4 });
          B.fn((x) => dd(x) / (PULL.horse * eff), { color: 'green', width: 2.4 });
          B.fn((x) => dd(x) / PULL.horse, { color: 'accent', width: 1.6, dash: [5, 3] });
          B.vline(depth.value, { color: 'gold', width: 1.2, dash: [4, 3] });
          B.text('oxen', 29.5, dd(29) / PULL.ox - 0.3, { size: 11, color: 'orange', align: 'right', baseline: 'top', plate: true });
          B.text(view.value === 'L' ? 'horses, old harness' : 'horses, old harness = collar', 29.5, dd(29) / (PULL.horse * eff) + 0.3, { size: 11, color: 'green', align: 'right', baseline: 'bottom', plate: true });
          if (view.value === 'L') B.text('horses, collar', 29.5, dd(29) / PULL.horse + 0.3, { size: 11, color: 'accent', align: 'right', baseline: 'bottom', plate: true });
          B._eff = eff;
        });
        v.legend([['accent', 'trace'], ['green', 'draught $D$ (soil)'], ['red', 'vertical part'], ['orange', 'oxen team'], ['gold', 'chosen depth', { dash: [4, 3] }]]);
        v.readout(() => {
          const D = A._D, eff = B._eff, nOx = D / PULL.ox, nH = D / (PULL.horse * eff), nHc = D / PULL.horse;
          const area = (spd) => (wF.value / 100) * spd * 6 * 3600 / 10000;
          return `furrow ${v.fix(depth.value, 0)} × ${v.fix(wF.value, 0)} cm needs a draught of **${v.fix(D / 1000, 2)} kN**; the trace is at ${v.fix(A._th / D2R, 1)}°, so the tension is ${v.fix(A._F / 1000, 2)} kN and the vertical part ${v.fix(A._Fv / 1000, 2)} kN\nanimals needed (a tenth of the body weight each: 590 N horse, 590 N ox): oxen **${v.fix(nOx, 1)}**, horses **${v.fix(nH, 1)}** (${v.fix(nHc, 1)} with a collar) · ploughed in six hours: oxen ${v.fix(area(0.67), 2)} ha, horses ${v.fix(area(1), 2)} ha (illustrative speeds 0.67 and 1 m/s)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Invention',
      name: 'The stirrup',
      credit: 'China, 3rd–4th century CE (a single mounting stirrup in a Jin tomb figurine of 302 CE; paired riding stirrups from the 320s–415 CE); spread west through Central Asia from the 6th century',
      verify: true,
      statement: String.raw`A **stirrup** is a footrest hung from the saddle. The earliest datable evidence comes from China: a funerary figurine from a Western Jin tomb near Changsha (302 CE) shows a single stirrup, too short for riding and probably a mounting aid; a double-sided riding stirrup is shown from a tomb near Nanjing (322 CE), and the earliest surviving pair comes from the tomb of Feng Sufu (415 CE). An iron stirrup from Mongolia has a radiocarbon range of 243–405 CE, so the earliest date is not settled. Stirrups reached eastern Europe with Central Asian horsemen, the Avars, around the end of the 6th century, and were adopted widely in the West in the 8th century (an archaeological count finds them in only 13 of 704 eighth-century male graves in Germany).

In 1962 Lynn White Jr. argued that the stirrup made mounted shock combat possible (the rider and horse becoming one body behind the lance) and thereby caused feudalism. Most historians have since rejected that chain of causes: Bullough and Bachrach argued that the stirrup gave little advantage in shock combat and chiefly helped the rider to keep his seat and to mount, and mounted lancers existed long before it.

The picture below is a **model** of one question, what the stirrup could add when a couched lance strikes a target. Its parameters are my assumptions and the conclusion depends on them; it is a way to test the argument, not evidence for either side.`,
      idea: String.raw`When a rider on a galloping horse strikes a target of mass $m_t$ and the lance does not give way, the impulse delivered is the change in momentum of everything that moves with the lance: $J=\mu v$ with the reduced mass $\mu = m_a m_t/(m_a+m_t)$ (a perfectly inelastic blow, mech-2.6). If only the rider's body is behind the lance, $m_a=m_r$; if the rider is locked to the horse, $m_a=m_r+m_h$, which is several times larger.

To use the horse's mass the rider must hold on: the whole force must pass between the rider and the saddle. Without stirrups the rider can transmit a force limited by friction at the seat and grip, $F_\mathrm{max}=\mu_s (m_rg+N_\mathrm{grip})$ (mech-1.15); with stirrups the rider can also brace with the legs. A blow that lasts $\Delta t$ needs a force of about $J/\Delta t$. For a short blow the seat cannot hold, and the stirrup adds only a modest extra force; for a long one (a lance that bends, a charge that drives through) both reach the same full impulse. That is the shape of the modern argument.`,
      caption: String.raw`The curves give the impulse delivered to the target against the duration of the blow, for a rider held by the seat alone (red) and a rider who can also brace in stirrups (green); the dashed ceilings are the rider alone and the rider locked to the horse. The vertical line is the duration you set. Change the **grip**, the **leg bracing** and the **speed**. Make the blow long and the two curves meet; make it short and the horse's mass cannot be used either way. Below, the dated evidence for the stirrup (hollow and dashed where the date is disputed).`,
      deps: ['mech-2.1', 'mech-1.15'],
      see: ['tech-4.8', 'mech-2.6'],
      refs: ['Mokyr ch. 3', 'White, Medieval Technology and Social Change (1962)', 'Bachrach 1970 and Bullough 1970, as cited by Wikipedia “Stirrup”'],
      tags: ['medieval', 'disputed', 'mechanics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stirrup' },
      viz(v) {
        const A = v.stage({ x: [0, 0.3], y: [0, 700], axes: 'box', gutter: true, height: 300, weight: 1.15, minWidth: 340, xlabel: 'duration of the blow (s)', ylabel: 'impulse delivered (N s)', title: 'impulse against blow duration' });
        const B = yearStage(v, [150, 820], { height: 190, full: true, title: 'dated evidence' });
        const speed = v.slider('closing speed (m/s)', 3, 12, 7, { step: 0.5 });
        const grip = v.slider('grip force (N)', 0, 1500, 300, { step: 10 });
        const brace = v.slider('leg bracing in stirrups (× body weight)', 0, 2, 1, { step: 0.05 });
        const dt = v.slider('duration of the blow (s)', 0.01, 0.3, 0.05, { step: 0.005 });
        const mr = 80, mh = 450, mt = 80, mus = 0.5;
        const red = (a) => (a * mt) / (a + mt);
        const Jr = () => red(mr) * speed.value, Jf = () => red(mr + mh) * speed.value;
        const Fns = () => mus * (mr * G + grip.value), Fs = () => Fns() + brace.value * mr * G;
        const Jat = (F, t) => Jr() + Math.min(Jf() - Jr(), F * t);
        v.render(() => {
          A.setView([0, 0.3], [0, Jf() * 1.15]);
          A.hline(Jf(), { color: 'muted', width: 1.2, dash: [6, 4] }); A.text('rider and horse as one body', 0.295, Jf(), { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          A.hline(Jr(), { color: 'muted', width: 1.2, dash: [6, 4] }); A.text('rider alone', 0.295, Jr(), { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          A.fn((t) => Jat(Fns(), t), { color: 'red', width: 2.6, n: 200 });
          A.fn((t) => Jat(Fs(), t), { color: 'green', width: 2.6, n: 200 });
          A.vline(dt.value, { color: 'gold', width: 1.4, dash: [4, 3] });
          A.dot(dt.value, Jat(Fns(), dt.value), { r: 5, color: 'red' }); A.dot(dt.value, Jat(Fs(), dt.value), { r: 5, color: 'green' });
          drawYears(v, B, [
            { t: 302, label: 'Changsha figurine (302)', contested: true },
            { t: 322, label: 'Nanjing (322)' },
            { t: [243, 405], label: 'Mongolian stirrup (14C)', contested: true },
            { t: 415, label: 'Feng Sufu pair (415)' },
            { t: [575, 628], label: 'Strategikon?', contested: true },
            { t: 600, label: 'Eastern Mediterranean (c. 600)', color: 'green' },
            { t: [700, 800], label: 'Western Europe (8th c.)', color: 'green' },
          ], { lanes: 5, ticks: [200, 300, 400, 500, 600, 700, 800] });
        });
        v.legend([['red', 'seat and grip only'], ['green', 'with stirrups'], ['gold', 'chosen duration', { dash: [4, 3] }]]);
        v.readout(() => {
          const t = dt.value, Jn = Jat(Fns(), t), Js = Jat(Fs(), t), req = (Jf() - Jr()) / t;
          return `masses: rider ${mr} kg, horse ${mh} kg, target ${mt} kg, perfectly inelastic blow (assumptions) → rider alone ${v.fix(Jr(), 0)} N s, locked to the horse ${v.fix(Jf(), 0)} N s\nfor a blow of ${v.fix(1000 * t, 0)} ms: seat holds ${v.fix(Fns(), 0)} N, stirrups ${v.fix(Fs(), 0)} N, whereas the extra impulse needs about ${v.fix(req, 0)} N → delivered **${v.fix(Jn, 0)} N s** without, **${v.fix(Js, 0)} N s** with stirrups (+${v.fix(100 * (Js - Jn) / Jn, 0)}%)`;
        });
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
