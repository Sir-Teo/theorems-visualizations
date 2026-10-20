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
      num: '5.9',
      kind: 'Concept',
      name: 'The longitude problem',
      credit: 'Posed by the voyages of the 15th–17th centuries; the Longitude Act of 1714 (Queen Anne) offered up to £20,000 for a method accurate to half a degree at the end of a voyage to the West Indies (lesser prizes for 1° and 2/3°); the clock approach was proposed by Gemma Frisius in 1530, the lunar-distance method by others',
      verify: true,
      statement: String.raw`**Latitude** is easy to find at sea: it follows from the height of the Sun at noon or of the pole star above the horizon. **Longitude** is not: the Earth turns $15^\circ$ every hour, so the difference of longitude between a ship and a home port equals $15^\circ$ per hour of difference between *local time* (from the Sun) and the *home-port time* (from a clock carried on board). Finding longitude at sea is therefore a problem of carrying accurate time. One minute of time is a quarter of a degree, $15'$ of arc, which at the equator is $15$ nautical miles, and $15\cos\varphi$ at latitude $\varphi$.

What the sources support: the Longitude Act of 1714 offered £20,000 for a method that fixed longitude within half a degree (30 arc-minutes) at the end of a transatlantic voyage, £15,000 within two-thirds of a degree and £10,000 within one degree. Half a degree is 2 minutes of time. Other methods (lunar distances, and the eclipses of Jupiter's satellites on land) competed with the clock for a century.

Scope of the picture: the Sun's time is idealised to local mean noon (the equation of time, up to ±16 minutes, is assumed known and removed); the error is the clock's alone.`,
      idea: String.raw`The Sun crosses the meridian of every place at that place's local noon, and the Earth's rotation turns $360^\circ$ in $24$ h, so a time difference $\Delta t$ is a longitude difference $15^\circ\,\Delta t/\mathrm{h}$. If the clock is wrong by $\epsilon$ seconds the longitude is wrong by $\epsilon/240$ degrees, i.e. $\epsilon/4$ arc-minutes, whatever the latitude; the distance on the sea shrinks as $\cos\varphi$ (geog-1.3). The error accumulates: a clock with a daily rate error $r$ is wrong by $r\cdot d$ after $d$ days. For the Act's half degree on a 6-week voyage, $r\le 120\text{ s}/42\text{ d}\approx2.9$ s/day. A pendulum clock (5.6), which a ship's motion upsets, cannot do it.`,
      caption: String.raw`Drag the gold **ship** over the Atlantic. The navigator's clock is slow or fast by the **error** you set (the line from the true position to the red dot). Right: the longitude error against the days of the voyage for the chosen **daily rate error**, with the 1°, 40′ and 30′ prize limits; find the largest rate error that still earns the top prize.`,
      deps: ['tech-5.6', 'geog-2.4'],
      see: ['tech-5.10', 'geog-1.3'],
      refs: ['Mokyr ch. 4', 'Sobel, Longitude (1995)'],
      tags: ['early-modern', 'navigation', 'time'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Longitude_Act' },
      viz(v) {
        const A = v.stage({ x: [-80, 10], y: [0, 65], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 320, xlabel: 'longitude (°; west negative)', ylabel: 'latitude (°N)', title: 'true and believed position' });
        const B = v.stage({ x: [0, 90], y: [0, 90], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 320, xlabel: 'days at sea', ylabel: 'longitude error (arc-minutes)', title: 'error against time at sea' });
        const eS = v.slider('clock error now (min)', -8, 8, 2, { step: 0.05 });
        const rS = v.slider('daily rate error (s/day)', 0, 20, 2.8, { step: 0.1 });
        const ship = A.handle(-35, 38, { color: 'gold', r: 8, label: 'ship', labelPos: 'ne', constrain: { x: [-78, 8], y: [3, 62] } });
        v.render(() => {
          for (let lon = -60; lon <= 0; lon += 15) A.vline(lon, { color: 'faint', width: 1, dash: [2, 4] });
          const dl = 0.25 * eS.value; // degrees per minute of time
          const bx = ship.x - dl, by = ship.y;
          A.line(ship.x, ship.y, bx, by, { color: 'red', width: 2, dash: [4, 3] });
          A.dot(bx, by, { r: 6, color: 'red', label: 'believed', labelPos: 'se' });
          A.dot(-0, 51, { r: 4, color: 'ink', label: 'Greenwich', labelPos: 'nw' });
          // prize limits and the voyage
          for (const [lim, lab, col] of [[60, '1°', 'muted'], [40, '40′', 'orange'], [30, '30′ (£20,000)', 'green']]) { B.hline(lim, { color: col, width: 1.6, dash: [5, 3] }); B.text(lab, 88, lim + 1.5, { size: 10.5, color: col, align: 'right' }); }
          const r = rS.value; B.line(0, 0, 90, (r * 90) / 4, { color: 'accent', width: 2.6 });
          B.dot(42, (r * 42) / 4, { r: 6, color: 'gold', label: '6 weeks', labelPos: 'nw' });
        });
        v.legend([['red', 'believed position', { dot: true }], ['accent', 'longitude error of the clock'], ['green', '30′ prize limit', { dash: [5, 3] }]]);
        v.readout(() => {
          const e = eS.value, lat = ship.y, errArc = Math.abs(e) * 15, nm = errArc * Math.cos(lat * D2R), r = rS.value, endErr = (r * 42) / 4;
          return `clock error **${v.fix(e, 2)} min** = ${v.fix(Math.abs(e) * 0.25, 2)}° of longitude = **${v.fix(nm, 1)} nautical miles** at ${v.fix(lat, 0)}°N (${v.fix(errArc, 1)} nmi at the equator)\nrate ${v.fix(r, 1)} s/day: after 6 weeks the clock is ${fmtSec(r * 42)} out, the position ${v.fix(endErr, 0)}′ of longitude — ${endErr <= 30 ? '**inside** the half-degree prize limit' : endErr <= 40 ? 'inside 40′ only' : endErr <= 60 ? 'inside 1° only' : '**outside every prize**'}; the limit is 120 s in 42 days = 2.9 s/day`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Invention',
      name: 'Harrison’s marine chronometer',
      credit: 'John Harrison, H1 (1735), H2, H3, then the watch-form H4 (completed 1759); H4 was tested on a voyage to Jamaica (1761–62) and to Barbados (1764) and its timekeeping met the terms of the Longitude Act; the Board of Longitude paid Harrison in stages (the full award was long delayed). Reported performance: about 5 seconds slow after 81 days to Jamaica (figure disputed, see the text)',
      verify: true,
      statement: String.raw`A **marine chronometer** is a clock whose rate is so steady against changes of temperature and ship motion that, once its rate is measured in port, the time it carries can be trusted for weeks. Harrison's H4 (1759) was a large pocket-watch in form with a balance spring (5.8), a bimetallic compensation for temperature, a remontoire to keep the force on the escapement constant, and jewelled pallets. To earn the top prize of the Longitude Act (5.9) it had to be right within about 2 minutes of time at the end of a six-week voyage, i.e. to a few seconds a day.

What the sources support: H4 was carried to Jamaica from November 1761, and sources give a loss of about 5 seconds over 81 days (so, at the time of the landfall, an error of about $1\tfrac14'$ of longitude); this figure is reported but not independently verified, and one skeptical historian doubts it. The 1764 voyage to Barbados gave a second trial. Harrison's later watch designs were copied by Larcum Kendall (K1), and the marine chronometers of Arnold and Earnshaw replaced his design from about 1780.

Scope of the picture: the three clock types have **assumed**, round stabilities (the daily random rate error, the temperature coefficient and the effect of ship motion) chosen to illustrate the argument and are not measurements of any named clock; the tropical warming is a straight ramp.`,
      idea: String.raw`A clock rated in port has its mean rate removed, so what remains is the *change* of rate: a random part $\sigma$ per day (the errors add like a random walk, $\sigma\sqrt d$), and a systematic part, the temperature coefficient $c$ in s/day per °C times how far the temperature has moved from where it was rated; the latter adds up linearly in days. An ordinary watch has $c\approx1$ s/day/°C, so a voyage to the tropics ($+15^\circ$C) puts it out by hours. A pendulum is upset by the ship's motion, which adds a random term of many seconds a day. The cure is the compensation (a balance whose effective radius or spring changes with temperature to cancel $c$) and a constant-force escapement (5.8): $c$ falls to a few hundredths of a second per day per °C, and the error after 81 days is of order seconds to ten seconds.`,
      caption: String.raw`Choose a **clock**, the **voyage length** and the **tropical warming**. Left: the clock's error in seconds against the day of the voyage, for five simulated voyages (thin) and the first (bold), against the 2-minute limit. Right: the corresponding position error at Port Royal's latitude (18°N). **New voyages** draws fresh random rate errors; the temperature part never changes.`,
      deps: ['tech-5.8', 'tech-5.9'],
      see: ['tech-5.6', 'tech-5.5'],
      refs: ['Mokyr ch. 4', 'Cardwell', 'Sobel, Longitude (1995)'],
      tags: ['early-modern', 'timekeeping', 'navigation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marine_chronometer' },
      viz(v) {
        const A = v.stage({ x: [0, 100], y: [-100, 400], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 320, xlabel: 'day of the voyage', ylabel: 'clock error (s)', title: 'clock error' });
        const B = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'day of the voyage', ylabel: 'position error at 18°N (nautical miles)', title: 'position error' });
        const kinds = { watch: { name: 'ordinary watch', c: 1.0, s: 2, m: 0.5 }, pend: { name: 'pendulum clock on a ship', c: 0.5, s: 1, m: 25 }, chron: { name: 'compensated chronometer', c: 0.02, s: 0.1, m: 0.05 } };
        const kS = v.select('clock', [{ value: 'watch', label: 'ordinary watch' }, { value: 'pend', label: 'pendulum clock' }, { value: 'chron', label: 'H4-like chronometer' }], 'chron');
        const dS = v.slider('voyage length (days)', 10, 100, 81, { step: 1 });
        const wS = v.slider('tropical warming (°C)', 0, 25, 15, { step: 1 });
        let seed = 7;
        v.button('new voyages', () => { seed += 1; });
        const run = (k, days, warm, sd) => {
          const r = v.rng(sd), out = [0]; let e = 0;
          for (let d = 1; d <= days; d++) { const temp = (warm * d) / days + 1.5 * Math.sin(d * 0.9); e += k.c * temp + k.s * r.normal() + k.m * r.normal(); out.push(e); }
          return out;
        };
        v.render(() => {
          const k = kinds[kS.value], days = dS.value, runs = [];
          for (let i = 0; i < 5; i++) runs.push(run(k, days, wS.value, seed * 13 + i));
          let mx = 150; for (const r of runs) for (const e of r) mx = Math.max(mx, Math.abs(e) * 1.1); mx = Math.min(mx, 20000);
          A.setView([0, 100], [-mx * 0.4, mx]);
          A.hband(-120, 120, { color: 'green', alpha: 0.12 }); A.hline(120, { color: 'green', width: 1.5, dash: [5, 3] }); A.hline(-120, { color: 'green', width: 1.5, dash: [5, 3] }); A.hline(0, { color: 'muted', width: 1 });
          A.text('±2 min (half-degree prize)', 98, 120 + mx * 0.03, { size: 10.5, color: 'green', align: 'right' });
          runs.forEach((r, i) => A.path(r.map((e, d) => [d, e]), { color: i === 0 ? 'accent' : 'blue', width: i === 0 ? 2.8 : 1, alpha: i === 0 ? 1 : 0.45 }));
          A.vline(days, { color: 'gold', width: 1.2, dash: [4, 3] });
          const cosL = Math.cos(18 * D2R), nmax = (mx * 15 / 60) * cosL;
          B.setView([0, 100], [0, Math.max(30, Math.min(nmax, 5000))]);
          const lim = (120 / 4 / 60) * 60 * cosL; // 30′ at 18°N in nautical miles (arc-minutes of longitude × cos φ)
          B.hline(30 * cosL, { color: 'green', width: 1.6, dash: [5, 3] }); B.text('30′ of longitude', 98, 30 * cosL * 1.04, { size: 10.5, color: 'green', align: 'right' });
          runs.forEach((r, i) => B.path(r.map((e, d) => [d, (Math.abs(e) / 4) * cosL]), { color: i === 0 ? 'accent' : 'blue', width: i === 0 ? 2.8 : 1, alpha: i === 0 ? 1 : 0.45 }));
          B.vline(days, { color: 'gold', width: 1.2, dash: [4, 3] });
        });
        v.legend([['accent', 'first simulated voyage'], ['blue', 'four more'], ['green', 'prize limit', { dash: [5, 3] }]]);
        v.readout(() => {
          const k = kinds[kS.value], days = dS.value, ends = []; for (let i = 0; i < 5; i++) { const r = run(k, days, wS.value, seed * 13 + i); ends.push(r[r.length - 1]); }
          const sys = (k.c * wS.value * days) / 2, rnd = Math.sqrt(days * (k.s * k.s + k.m * k.m)), e0 = ends[0], arc = Math.abs(e0) / 4;
          const ok = ends.filter((e) => Math.abs(e) <= 120).length;
          return `${k.name} (assumed: $c=${k.c}$ s/day/°C, random ${v.fix(Math.hypot(k.s, k.m), 2)} s/day): after ${days} days the typical systematic part is ${fmtSec(sys)} (linear in days) and the random part ${fmtSec(rnd)} ($\\propto\\sqrt d$)\nfirst voyage ends **${fmtSec(e0)}** out = ${v.fix(arc, 1)}′ of longitude = ${v.fix(arc * Math.cos(18 * D2R), 1)} nmi at 18°N; **${ok} of 5** voyages inside the 2-minute limit`;
        });
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
