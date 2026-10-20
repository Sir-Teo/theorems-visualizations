import{longitude,chronometer}from'./source-audit-longitude.js';
import{balance}from'./source-audit-huygens.js';
import{anchor}from'./source-audit-clockdrives.js';
// History of Technology — Chapter 5: Time and navigation (items 5.7–5.11; 5.1–5.6 are in ch05.js)
import { D2R, clamp, pendulumRatio, lossPerDay, bangPeriod, bangAngle, springPeriodRatio, sunLon, eclDec, dayName, fmtSec } from './ch05.shared.js';

const reflect = (d, nAng) => { const nx = Math.cos(nAng), ny = Math.sin(nAng), k = 2 * (d[0] * nx + d[1] * ny); return [d[0] - k * nx, d[1] - k * ny]; };

export default {
  collection: 'tech',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.7
    {
      num:'5.7',kind:'Invention',name:'The anchor escapement',verify:false,
      credit:'Historical example documented by The Metropolitan Museum of Art; circular-error comparison and rocker schematic authored here',
      statement:String.raw`An anchor escapement alternately locks and releases escape-wheel teeth through two pallets on a rocking anchor coupled to a pendulum. It permits a small pendulum swing. In a recoil anchor the wheel can move slightly backward during part of the cycle; this interaction can itself disturb the oscillator.

The Metropolitan Museum's Knibb longcase clock 1974.28.92, catalogued circa 1680–85, has a weight-driven movement, anchor escapement and long pendulum. Its curatorial study describes the advantage of a small arc together with remaining escapement, friction, temperature and pressure effects, and identifies replacement parts. The object illustrates the mechanism; it does not settle the disputed inventor or certify a universal weekly accuracy.`,
      idea:String.raw`For an ideal simple pendulum released at amplitude θ0, energy conservation gives
Put $m=\sin^2(\theta_0/2)$. Then
$$T/T_0=\frac2\pi K(m),\quad T_0=2\pi\sqrt{L/g},$$
$$K(m)=\int_0^{\pi/2}\frac{du}{\sqrt{1-m\sin^2u}}.$$
A clock calibrated at T0 loses $86400(1-T_0/T)$ seconds per reference day. This is circular error against the small-amplitude calibration, not an actual clock's measured daily error. The exact integral is evaluated by the arithmetic-geometric mean. For small θ0, $T/T_0=1+\theta_0^2/16+\cdots$, so smaller arcs reduce the sensitivity to amplitude. Finite ±10% changes below are computed from the full integral rather than extrapolating this approximation.`,
      caption:String.raw`Select small and large amplitudes to compare exact ideal circular error and the error range from a ±10% amplitude change. The full positive curve is plotted on a logarithmic scale without flooring small values. Phase rocks an enlarged anchor schematic; this drawing does not solve tooth contact, recoil or an exact free-pendulum trajectory.`,
      deps:['tech-5.6','mech-4.4'],see:['tech-5.4'],refs:['Metropolitan Museum of Art, Knibb longcase clock 1974.28.92, actual curatorial movement/condition account and object record'],tags:['timekeeping','escapement'],
      scope:String.raw`Ideal pendulum period and authored amplitude comparison. The schematic rocker has threefold angular enlargement, independent illustrative tooth positions and no contact dynamics. No drive law, escapement-induced rate error, friction compensation or historical accuracy is inferred from the pendulum integral.`,
      links:{source:'https://www.metmuseum.org/art/collection/search/205601'},
      viz(v){const small=v.slider('small swing amplitude (°)',1,12,5,{step:'any',decimals:6}),large=v.slider('large swing amplitude (°)',10,60,40,{step:'any',decimals:6}),phase=v.slider('schematic rocking phase',0,1,.15,{step:'any',decimals:6}),A=v.stage({x:[-1.7,1.7],y:[-1.4,2.7],equal:true,axes:false,height:340,minWidth:260,title:'enlarged rocker schematic; no contact solver'}),B=v.stage({x:[-3,70],y:[.05,7000],ylog:true,axes:'box',gutter:true,height:340,minWidth:260,xlabel:'amplitude (°)',ylabel:'ideal circular error (s/day)',title:'exact period comparison'});let info;
        v.legend([['green','small swing and ±10% range'],['red','large swing and ±10% range'],['orange','full ideal circular-error curve']]);
        v.render(()=>{const p=anchor(small.value,large.value,phase.value);A.circle(0,0,.8,{color:'muted',width:1});for(let i=0;i<30;i++){const a=i*2*Math.PI/30;A.poly([[.8*Math.cos(a),.8*Math.sin(a)],[Math.cos(a-.04),Math.sin(a-.04)],[.8*Math.cos(a-.21),.8*Math.sin(a-.21)]],{fill:'muted',fillAlpha:.25,color:'muted',width:.8});}A.path(p.rocker,{color:'accent',width:4});A.line(...p.pivot,...p.rocker[2],{color:'accent',width:2});A.line(...p.pivot,...p.tip,{color:'ink',width:2});A.dot(...p.pivot,{color:'ink',r:4,ring:false});A.dot(...p.tip,{color:'gold',r:4,ring:false});A.text('rocking angle enlarged 3×',0,-1.22,{align:'center',size:10.5,color:'muted'});B.setView([-3,70],[.05,p.top]);for(const[b,col]of p.bands.map((b,i)=>[b,i?'red':'green']))B.vband(b.left,b.right,{color:col,alpha:.12});B.path(p.curve,{color:'orange',width:2});p.selected.forEach((q,i)=>B.dot(...q,{color:i?'red':'green',r:4,ring:false}));info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return p.selected.map(([a,e],i)=>`${i?'Large':'Small'} amplitude ${v.fix(a,6)}°: ideal circular error ${v.fix(e,9)} s/day; ±10% amplitude range ${v.fix(p.bands[i].low,9)}…${v.fix(p.bands[i].high,9)} s/day.`).join('\n')+`\nThe finite error-range ratio is ${v.fix((p.bands[1].high-p.bands[1].low)/(p.bands[0].high-p.bands[0].low),9)}. Rocker geometry is schematic; these numbers omit escapement disturbances.`;});
      },
    },

    // ------------------------------------------------------------------ 5.8
    {
      num:'5.8',kind:'Invention',name:'The balance spring',verify:false,
      credit:'Historical mechanism documented by The Metropolitan Museum of Art; ideal linear and hardening-spring comparisons authored here',
      statement:String.raw`A balance spring connects a rotating watch balance to a fixed support and supplies restoring torque. In the ideal linear model that torque is−κθ, giving an amplitude-independent period. A real spring's torque can depart from this law.

The Metropolitan Museum's Van Ceulen watch 17.190.1417, catalogued circa 1676–80, has a three-arm balance, hair spring, verge escapement and a seven-turn fusee with chain. The owner's detailed movement and condition account identifies these components. The watch is historical evidence for the mechanism; the ideal laws below are not measurements of this object. No original-inventor or patent dispute is certified here.`,
      idea:String.raw`For unit inertia a linear spring satisfies $\ddot\theta=-\kappa\theta$ and has period $2\pi/\sqrt\kappa$. The authored hardening law is
$$\ddot\theta=-\kappa(\theta+\varepsilon\theta^3).$$
Its conserved energy is $\dot\theta^2/2+\kappa(\theta^2/2+\varepsilon\theta^4/4)$. At release amplitude A in radians, set
$$m=\frac{\varepsilon A^2}{2(1+\varepsilon A^2)}.$$
Then the exact period is
$$T=\frac{4K(m)}{\sqrt{\kappa(1+\varepsilon A^2)}}.$$
The nonlinear trajectory is evaluated from the same energy-conserving elliptic solution; it is not a sine wave assigned a different period. For each ε, choose κ so this nonlinear oscillator has period 0.4 s at 270°. The ideal comparison also has period 0.4 s. This is an explicit reference calibration, not fixed material stiffness as ε changes.`,
      caption:String.raw`Compare an ideal linear spring with the declared hardening spring at the same selected amplitude and elapsed time. Both are released from rest. The graph includes every integer amplitude 30…363°, covering the selected amplitude plus its 10% comparison. Each wheel follows its own exact trajectory. The spiral lines symbolize the connection and do not predict coil shape or stress.`,
      deps:['mech-4.2','mech-4.1'],see:['tech-5.5','tech-5.6'],refs:['Metropolitan Museum of Art, Van Ceulen watch 17.190.1417, actual owner/curatorial movement and condition account; circa 1676–80'],tags:['timekeeping','oscillator','spring'],
      scope:String.raw`Unforced oscillators, unit inertia, ideal linear law and authored positive quartic potential. ε 0…0.12 is a chosen coefficient, not a measured historic spring. κ is recalibrated to the stated 270° reference for each ε. No air drag, escapement impulse, coil contact, temperature or real-watch rate forecast. No unsprung real balance or verge escapement is represented by the linear comparison.`,
      links:{source:'https://www.metmuseum.org/art/collection/search/194011'},
      viz(v){const amplitude=v.slider('release amplitude (°)',40,330,270,{step:'any',decimals:6}),epsilon=v.slider('hardening coefficient ε',0,.12,0,{step:'any',decimals:6}),time=v.slider('elapsed time (s)',0,2,.07,{step:'any',decimals:6}),A=v.stage({x:[-2.6,2.6],y:[-1.5,1.5],equal:true,axes:false,height:320,minWidth:260,title:'exact linear and nonlinear balance trajectories'}),B=v.stage({x:[15,378],y:[.2,2.8],axes:'box',gutter:true,height:320,minWidth:260,xlabel:'release amplitude (°)',ylabel:'period / 0.4 s',title:'same 270° reference calibration'});let info;
        const spiral=(cx,angle)=>Array.from({length:181},(_,j)=>{const s=j/180,r=.12+.55*s,a=9*Math.PI*s+(1-s)*angle;return[cx+r*Math.cos(a),r*Math.sin(a)];});v.legend([['green','ideal linear spring'],['orange','authored hardening spring'],['gold','selected amplitude']]);
        v.render(()=>{const p=balance(amplitude.value,epsilon.value,time.value);for(const[cx,theta,color]of[[-1.3,p.idealAngle,'green'],[1.3,p.angle,'orange']]){A.circle(cx,0,.95,{color,width:2});for(let k=0;k<3;k++){const a=theta+2*Math.PI*k/3;A.line(cx,0,cx+.95*Math.cos(a),.95*Math.sin(a),{color:'muted',width:1.5});}const q=spiral(cx,theta);A.path(q,{color,width:1.3});A.line(cx,0,...q[0],{color,width:1.3});A.dot(cx,0,{color:'ink',r:3,ring:false});A.dot(cx+.95*Math.cos(theta),.95*Math.sin(theta),{color:'gold',r:4,ring:false});A.text(cx<0?'linear':'hardening',cx,-1.25,{align:'center',size:11,color});}const ys=p.curve.map(q=>q[1]),lo=Math.min(.8,...ys)*.85,hi=Math.max(1.1,...ys)*1.15;B.setView([15,378],[lo,hi]);B.line(30,1,363,1,{color:'green',width:2});B.path(p.curve,{color:'orange',width:2});B.dot(p.amplitude,p.period/p.Tref,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `At amplitude ${v.fix(p.amplitude,9)}°: linear period 0.4 s; hardening period ${v.fix(p.period,12)} s. The nonlinear stiffness is κ=${v.fix(p.kappa,9)} for the stated 270° calibration.\nAt ${v.fix(p.time,9)} s: linear angle ${v.fix(p.idealAngle*180/Math.PI,9)}°, hardening angle ${v.fix(p.angle*180/Math.PI,9)}°. Conserved hardening energy ${v.fix(p.energy,9)} relative units.\nA 10% larger release amplitude changes the hardening period to ${v.fix(p.largerPeriod,12)} s, giving ${v.fix(p.rateSeconds,9)} seconds gained per reference day if calibrated at the selected period. The ideal linear period is unchanged. These are authored model values, not measured watch accuracy.`;});
      },
    },

    // ------------------------------------------------------------------ 5.9
    {
      num:'5.9',kind:'Concept',name:'The longitude problem',verify:true,
      credit:'Longitude Act, 1714, actual contemporary print in Cambridge RGO14/1; ideal time-error model authored here',
      statement:String.raw`At local mean noon, comparing local mean solar time with an accurate clock carrying reference-meridian mean time determines longitude: 24 hours correspond to 360°. With east longitude positive, a clock that reads ε seconds too fast makes the inferred longitude ε/240 degrees too far west. This assumes the equation of time and observational errors have been removed; apparent solar noon is not itself mean noon.

The actual Longitude Act offered £10,000 for longitude within one degree of a great circle, £15,000 within two-thirds of that distance and £20,000 within half. Its printed text specifies further assessment and payment conditions, including a nominated voyage from Great Britain to the West Indies. Angular error alone does not establish an award. The Act does not prescribe a six-week voyage.`,
      idea:String.raw`In the authored model a signed constant rate error r in seconds per day accumulates from initial clock error ε0:
$$\varepsilon(d)=\varepsilon_0+rd.$$
The signed longitude offset in degrees is
$$\widehat\lambda-\lambda=-\varepsilon(d)/240.$$
The absolute angular error is $|\varepsilon(d)|/4$ arc-minutes. On a sphere using 60 nautical miles per degree, the corresponding **parallel arc** at latitude φ is $|\varepsilon(d)|\cos\varphi/4$ nautical miles. This is neither a shortest geodesic on an ellipsoid nor an observed navigation error.

The half-degree benchmark is 120 seconds. For an explicitly chosen 42-day illustration starting at zero error, it requires $|r|\le120/42\approx2.857143$ seconds per day. An initial offset can reinforce or cancel drift, so the whole error curve matters.`,
      caption:String.raw`Drag the gold ship or use its coordinate controls. The red point, selected-day marker and complete 90-day error curve all use the same initial error and signed rate. A change of sign produces an exact zero-crossing vertex. The 30′, 40′ and 60′ lines compare the Act's angular thresholds; they do not decide legal eligibility.`,
      deps:['tech-5.6','geog-2.4'],see:['tech-5.10','geog-1.3'],refs:['Longitude Act, 1714, contemporary print pp.355–357; Cambridge Digital Library RGO14/1 fols.11r–12r'],tags:['navigation','time'],
      scope:String.raw`Constant signed clock-rate error, ideal reference and local mean solar times, fixed true coordinates and a declared spherical parallel-distance convention. No equation-of-time estimation, observation noise, real coastline, shortest-route distance or prize adjudication.`,
      links:{source:'https://cudl.lib.cam.ac.uk/view/MS-RGO-00014-00001/21'},
      viz(v){const initial=v.slider('initial clock error (minutes)',-8,8,2,{step:'any',decimals:6}),rate=v.slider('signed clock rate error (s/day)',-20,20,2.8,{step:'any',decimals:6}),day=v.slider('selected day',0,90,42,{step:'any',decimals:6}),lon=v.slider('true longitude (° east)',-78,8,-35,{step:'any',decimals:6}),lat=v.slider('true latitude (° north)',3,62,38,{step:'any',decimals:6}),A=v.stage({x:[-102,32],y:[-6,71],axes:'box',gutter:true,height:340,minWidth:260,xlabel:'longitude (° east)',ylabel:'latitude (° north)',title:'ideal true and inferred coordinates'}),B=v.stage({x:[-7,97],y:[-10,100],axes:'box',gutter:true,height:340,minWidth:260,xlabel:'elapsed days',ylabel:'absolute longitude error (arc-minutes)',title:'same clock model throughout the voyage'}),ship=A.handle(-35,38,{color:'gold',r:7,constrain:{x:[-78,8],y:[3,62]}}),set=ship.set;ship.set=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y)||x< -78||x>8||y<3||y>62)throw new RangeError('invalid ship coordinates');set(x,y);};ship.onDrag=()=>{lon.set(ship.x);lat.set(ship.y);};v.shareState('ship coordinate agreement',{get:()=>[lon.value,lat.value],validate:s=>Array.isArray(s)&&s.length===2&&s.every(Number.isFinite)&&s[0]>=-78&&s[0]<=8&&s[1]>=3&&s[1]<=62,set:s=>{if(s[0]!==lon.value||s[1]!==lat.value||ship.x!==s[0]||ship.y!==s[1])throw new RangeError('invalid ship coordinate agreement');}});let info;
        v.legend([['gold','true ship / selected day'],['red','inferred position'],['accent','absolute clock error'],['green','30′ angular benchmark']]);
        v.render(()=>{const p=longitude(initial.value,rate.value,day.value,lon.value,lat.value);ship.set(p.lon,p.lat);for(let x=-60;x<=0;x+=15)A.line(x,0,x,65,{color:'faint',width:1,dash:[2,4]});A.line(p.lon,p.lat,p.believed,p.lat,{color:'red',width:2,dash:[4,3]});A.dot(p.believed,p.lat,{color:'red',r:5,ring:false});A.dot(0,51,{color:'ink',r:3,ring:false});B.setView([-7,97],[-.14*p.top,p.top]);for(const[y,color]of[[30,'green'],[40,'orange'],[60,'muted']])B.line(0,y,90,y,{color,width:1.4,dash:[5,3]});B.path(p.curve,{color:'accent',width:2.4});B.dot(p.day,p.arc,{color:'gold',r:5,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Day ${v.fix(p.day,9)}: signed clock error ${v.fix(p.error,9)} s. Inferred longitude ${v.fix(p.believed,9)}°, offset ${v.fix(p.delta,9)}°.\nAbsolute error ${v.fix(p.arc,9)} arc-minutes; spherical parallel arc ${v.fix(p.parallel,9)} nautical miles at latitude ${v.fix(p.lat,9)}°. The map is a coordinate diagram; the black point marks Greenwich.\nAngular benchmarks: 30′ = 120 s, 40′ = 160 s, 60′ = 240 s. The Act has additional conditions; this display makes no award decision. The illustrative zero-offset 42-day rate bound is 120/42 s/day.`;});
      },
    },

    // ------------------------------------------------------------------ 5.10
    {
      num:'5.10',kind:'Invention',name:'Harrison’s marine chronometer',verify:true,
      credit:'John Harrison, H4 longitude watch completed 1759; Royal Museums Greenwich ZAA0037. Authored uncalibrated voyage comparison',
      statement:String.raw`Royal Museums Greenwich identifies H4, ZAA0037, as Harrison's longitude watch, completed in 1759 after work began in 1755. Its owner record describes a stable, high-frequency balance. The actual watch and its inscription provide historical context; they do not supply numerical noise or temperature coefficients for this simulation.

The three profiles below are explicitly authored examples: thermal-sensitive, motion-sensitive and low-sensitivity. Their coefficients are not measurements of H4, an ordinary watch or a shipboard pendulum. This item does not independently authenticate a precise Jamaica trial error, a payment chronology or the priority of later makers.`,
      idea:String.raw`For a voyage of D whole days, prescribe the end-of-day temperature change
$$\Delta T_j=Wj/D+1.5\sin(0.9j).$$
Each clock-error increment is $c\Delta T_j+sZ_j+mU_j$, where all Zj and Uj are assumed independent standard normal variables. The first term is systematic; the two random terms represent two declared sources of rate variation. At day d the exact systematic mean is
$$R_d=\frac{Wd(d+1)}{2D},$$
$$S_d=\frac{\sin(0.45d)\sin(0.45(d+1))}{\sin(0.45)},$$
$$\mu_d=c(R_d+1.5S_d),$$
and the random component has RMS $\sqrt{d(s^2+m^2)}$. This is a discrete end-of-day ramp; replacing its sum by WD/2 would give a different model. The five trajectories use a registered pseudorandom seed, rather than estimating a probability from five observations.`,
      caption:String.raw`Choose an authored sensitivity profile, voyage length, final warming, latitude and seed. Both plots retain every daily sample, including negative clock errors. The orange line is the exact systematic mean. New voyages advances the saved seed. The ±120-second band and corresponding parallel arc are angular benchmarks, subject to the Act's additional conditions.`,
      deps:['tech-5.8','tech-5.9'],see:['tech-5.6','tech-5.5'],refs:['Royal Museums Greenwich, H4 ZAA0037 owner record and actual inscription image; Longitude Act contemporary print pp.355–357'],tags:['timekeeping','navigation'],
      scope:String.raw`Authored daily temperature schedule and independent Gaussian increments, illustrated by a specified seeded generator. Profiles (c,s,m) are (1,2,0.5), (0.5,1,25) and (0.02,0.1,0.05), with c in seconds/day/°C and s,m in seconds/day. No measured historical calibration, continuous-temperature integration, correlated weather, instrument observation errors or award adjudication. Distances are spherical parallel arcs using 60 nautical miles per degree.`,
      links:{source:'https://www.rmg.co.uk/collections/objects/rmgc-object-79142'},
      viz(v){const profile=v.select('authored sensitivity profile',[{value:'thermal',label:'thermal-sensitive'},{value:'motion',label:'motion-sensitive'},{value:'low',label:'low-sensitivity'}],'low'),days=v.slider('voyage length (whole days)',10,100,81,{step:1,int:true}),warm=v.slider('final ramp warming (°C)',0,25,15,{step:'any',decimals:6}),lat=v.slider('latitude (° north)',0,65,18,{step:'any',decimals:6}),seed=v.slider('saved voyage seed',1,9999,7,{step:1,int:true}),A=v.stage({x:[-8,108],y:[-150,150],axes:'box',gutter:true,height:340,minWidth:260,xlabel:'elapsed days',ylabel:'clock error (s)',title:'five authored trajectories and exact mean'}),B=v.stage({x:[-8,108],y:[-5,50],axes:'box',gutter:true,height:340,minWidth:260,xlabel:'elapsed days',ylabel:'parallel arc (nautical miles)',title:'same trajectories converted to position error'});let info;v.button('new voyages',()=>seed.set(seed.value===9999?1:seed.value+1));
        v.legend([['accent','first trajectory'],['blue','four further trajectories'],['orange','exact systematic mean'],['green','angular benchmark']]);
        v.render(()=>{const p=chronometer(profile.value,days.value,warm.value,lat.value,seed.value);A.setView([-8,108],[-p.top,p.top]);B.setView([-8,108],[-.14*p.distanceTop,p.distanceTop]);for(const y of[-120,120])A.line(0,y,100,y,{color:'green',width:1.4,dash:[5,3]});A.line(0,0,100,0,{color:'muted',width:1});p.runs.forEach((q,i)=>A.path(q,{color:i?'blue':'accent',width:i?1:2.6,alpha:i?.5:1}));A.path(p.mean,{color:'orange',width:2,dash:[4,3]});B.line(0,30*p.cos,100,30*p.cos,{color:'green',width:1.4,dash:[5,3]});p.distance.forEach((q,i)=>B.path(q,{color:i?'blue':'accent',width:i?1:2.6,alpha:i?.5:1}));info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Authored ${p.profile} profile: c=${p.k.c}, s=${p.k.s}, m=${p.k.m}; saved seed ${p.seed}. Day ${p.days}: exact systematic mean ${v.fix(p.meanEnd,9)} s; random-component RMS ${v.fix(p.rms,9)} s under the declared independent-increment assumptions.\nFirst trajectory ends at ${v.fix(p.ends[0],9)} s = ${v.fix(Math.abs(p.ends[0])/4,9)} arc-minutes; parallel arc ${v.fix(Math.abs(p.ends[0])/4*p.cos,9)} nautical miles at ${v.fix(p.latitude,9)}°. Of these five illustrated endpoints, ${p.within} are within ±120 s. This count is not an estimated historical success rate or a prize decision.\nAll coefficients and temperature inputs are authored and uncalibrated; H4's owner record supplies historical context only.`;});
      },
    },

    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Invention',
      name: 'The octant and sextant',
      credit: 'John Hadley (octant, 1731) and, independently, Thomas Godfrey of Philadelphia (about 1730–31); Isaac Newton described a similar instrument to Halley earlier, but his description was published only after Halley\'s death in 1742; the sextant (a 60° arc) followed in the 1750s',
      verify: true,
      statement: String.raw`The **reflecting octant** (Hadley's quadrant) measures the angle between two objects, usually the Sun and the horizon, with two mirrors: a movable *index mirror* on an arm over an arc, and a fixed half-silvered *horizon glass* through which the horizon is seen directly while the Sun's twice-reflected image is seen in the silvered half. When the index arm is turned until the Sun's image touches the horizon, the angle $h$ between the Sun and the horizon is **twice** the angle $\alpha$ between the two mirrors, so the arc of $45^\circ$ is engraved to $90^\circ$ and the **sextant**, with a $60^\circ$ arc, reads to $120^\circ$. Because both the Sun and the horizon are seen at once, the pitching of the ship does not matter. The latitude then follows from the noon altitude, $\varphi=90^\circ-h+\delta$ for the Sun south of the observer.

What the sources support: Hadley presented the octant to the Royal Society in 1731, and Godfrey, a Philadelphia glazier, reached a similar instrument independently at about the same time; Newton's earlier description is known from papers found among Halley's. The sextant's larger arc allowed the lunar-distance method (the angle between the Moon and a star), which could be used for longitude.

Scope of the picture: the instrument is drawn in plane geometry (all rays in the plane of the arc), without dip of the horizon, refraction, semi-diameter or index error; the Sun's declination is a low-precision formula good to about a degree.`,
      idea: String.raw`A mirror reflecting a ray turns the ray when the mirror turns, by twice the mirror's rotation (the law of reflection, waves-4.5). Two successive reflections therefore turn it through the *difference* of two such doublings: if the mirrors are parallel the final ray is parallel to the incoming one (so Sun and horizon coincide at zero), and if the index mirror is turned by $\alpha$ relative to the horizon glass, the outgoing ray is deviated by $2\alpha$ exactly. The Sun's image is lowered by $2\alpha$ toward the horizon, and the reading is the angle of the arm on the arc, doubled in the engraving. The noon altitude of the Sun is $90^\circ-|\varphi-\delta|$ (geog-2.4), which gives $\varphi$ from the reading and the date.`,
      caption: String.raw`Left: the rays (eye at the origin, horizon glass on the sight line, index mirror above it) for the **mirror angle** $\alpha$ you set; the actual Sun is the gold dashed ray. Right: what the observer sees: the horizon in the left half, and in the right half the Sun's image lowered by $2\alpha$. Turn the **arm** until the image just rests on the horizon, then read the latitude. Choose **octant** or **sextant**: the former cannot reach a Sun higher than 90°.`,
      deps: ['tech-5.2', 'waves-4.5', 'geog-2.4'],
      see: ['tech-5.9', 'tech-5.10'],
      refs: ['Mokyr ch. 4', 'Hadley, John (MacTutor / Oxford DNB)'],
      tags: ['early-modern', 'navigation', 'optics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Octant_(instrument)' },
      viz(v) {
        const A = v.stage({ x: [-0.4, 2.8], y: [-0.5, 2.5], equal: true, axes: false, height: 360, weight: 1.1, minWidth: 340, title: 'the two mirrors (plane of the arc)' });
        const B = v.stage({ x: [-1, 1], y: [-12, 80], axes: 'box', gutter: true, height: 360, weight: 0.8, minWidth: 260, ylabel: 'angle above the horizon (°)', title: 'as seen by the observer' });
        const iS = v.select('instrument', [{ value: '45', label: 'octant (45° arc)' }, { value: '60', label: 'sextant (60° arc)' }], '60');
        const aS = v.slider('mirror angle $\\alpha$ (°)', 0, 60, 10, { step: 0.05 });
        const dS = v.slider('date', 1, 365, 172, { step: 1, fmt: (x) => dayName(x) });
        const lS = v.slider('latitude (°N)', 0, 70, 45, { step: 1 });
        const H = [2.0, 0], PSI = (157.5 * Math.PI) / 180; // horizon glass at (2, 0)
        const sunAlt = () => { const dec = eclDec(sunLon(dS.value)); return 90 - Math.abs(lS.value - dec); };
        v.render(() => {
          const lim = +iS.value, al = Math.min(aS.value, lim), h = sunAlt();
          const d0 = [1, 0], d1 = reflect(d0, PSI), I = [H[0] + 1.6 * d1[0], H[1] + 1.6 * d1[1]], psiI = PSI + al * D2R, d2 = reflect(d1, psiI);
          A.line(0, 0, 3.2, 0, { color: 'blue', width: 1.2, dash: [3, 4] }); A.text('horizon', 2.78, 0.06, { size: 10.5, color: 'blue', align: 'right', baseline: 'bottom' });
          A.dot(0, 0, { r: 5, color: 'ink', label: 'eye', labelPos: 'sw' });
          A.line(0, 0, H[0], H[1], { color: 'accent', width: 1.8 }); A.line(H[0], H[1], I[0], I[1], { color: 'accent', width: 1.8 });
          A.arrow(I[0], I[1], I[0] + 1.2 * d2[0], I[1] + 1.2 * d2[1], { color: 'accent', width: 1.8, head: 8 });
          const sh = h * D2R; A.line(I[0], I[1], I[0] + 1.3 * Math.cos(sh), I[1] + 1.3 * Math.sin(sh), { color: 'gold', width: 1.8, dash: [5, 3] });
          // mirrors
          const mir = (p, ang, len, col) => { const tx = -Math.sin(ang), ty = Math.cos(ang); A.line(p[0] - len * tx, p[1] - len * ty, p[0] + len * tx, p[1] + len * ty, { color: col, width: 5 }); };
          mir(H, PSI, 0.22, 'purple'); mir(I, psiI, 0.22, 'orange');
          A.text('horizon glass', H[0] + 0.12, H[1] - 0.1, { size: 10.5, color: 'purple', align: 'left', baseline: 'top' }); A.text('index mirror', I[0] + 0.25, I[1] + 0.05, { size: 10.5, color: 'orange', align: 'left' });
          A.text(`rays leave at ${Math.round(2 * al * 10) / 10}° above the sight line`, 0.8, 2.4, { size: 11, color: 'accent', align: 'left' });
          // view: horizon line, direct on the left half, Sun's image on the right half
          B.vline(0, { color: 'muted', width: 1.5, dash: [4, 3] });
          B.line(-1, 0, 1, 0, { color: 'blue', width: 2.4 });
          B.rect(-1, -12, 0, 0, { fill: 'blue', fillAlpha: 0.1, stroke: false });
          const img = h - 2 * al;
          B.circle(0.5, img, 0, {});
          B.dot(0.5, img, { r: 11, color: 'gold', label: 'Sun (image)', labelPos: 'w' });
          B.text('direct view', -0.5, 76, { size: 10.5, color: 'muted', align: 'center' }); B.text('mirror view', 0.5, 76, { size: 10.5, color: 'muted', align: 'center' });
        });
        v.legend([['accent', 'ray path (eye → glass → mirror → Sun)'], ['gold', 'the actual Sun direction', { dash: [5, 3] }]]);
        v.readout(() => {
          const lim = +iS.value, al = Math.min(aS.value, lim), h = sunAlt(), dec = eclDec(sunLon(dS.value)), img = h - 2 * al, read = 2 * al;
          const touch = Math.abs(img) < 0.25;
          return `arm reading **${v.fix(read, 1)}°** (mirrors ${v.fix(al, 2)}° apart); the true noon altitude of the Sun here is ${v.fix(h, 1)}° (${v.fix(dec, 1)}° declination): image ${touch ? '**on the horizon**' : (img > 0 ? `${v.fix(img, 1)}° above it` : `${v.fix(-img, 1)}° below it`)}\nlatitude if the image touched the horizon at this reading: $\\varphi=90^\\circ-${v.fix(read, 1)}^\\circ+\\delta=$ **${v.fix(90 - read + dec, 1)}°N** (true ${v.fix(lS.value, 0)}°)${h > 2 * lim ? '; **this instrument cannot reach this Sun altitude**' : ''}`;
        });
      },
    },
  ],
};
