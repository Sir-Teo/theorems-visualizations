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
      num:'5.7',kind:'Invention',name:'The anchor escapement',verify:true,
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
      num: '5.8',
      kind: 'Invention',
      name: 'The balance spring',
      credit: 'Christiaan Huygens (spiral spring watch, announced in the Journal des Sçavans, February 1675) and Robert Hooke (claimed since 1658–1660s; a spring-regulated watch was shown in 1675); Isaac Thuret made watches for Huygens; the priority dispute was not settled in England',
      verify: true,
      statement: String.raw`A **balance spring** (hairspring) is a fine spiral spring attached to the arbor of a watch's balance wheel. It gives the wheel a restoring torque $-\kappa\theta$ proportional to the angle, so the balance becomes a harmonic oscillator of period $T=2\pi\sqrt{I/\kappa}$ (mech-4.2) set by the wheel's moment of inertia $I$ and the spring's stiffness $\kappa$ and, for a linear spring, independent of the amplitude and of the drive. Before it, a watch balance had only the push of the mainspring (5.5) and ran with the same weakness as the foliot (5.4): its rate followed the force.

What the sources support: Huygens announced a watch regulated by a spiral spring in the *Journal des Sçavans* in February 1675 and had the Royal Society told of it in March. Hooke objected that he had described the idea (and in his Hooke's-law anagram of 1676, the principle of the spring) earlier; he had probably thought of a spring-regulated balance by about 1658 but historians differ on whether he made a watch with a flat spiral. Other claims (Thuret, de Hautefeuille) were also made.

Scope of the picture: the "unsprung balance" is the constant-torque model of 5.4; the sprung balance has torque $-\kappa(\theta+\varepsilon\theta^3)$, where $\varepsilon=0$ is the ideal spring and $\varepsilon>0$ a spring that stiffens at large angles, which is how the departure from isochronism is shown. Real watch balances run at 270°–310° and are regulated for this by the shape of the spring's end curves.`,
      idea: String.raw`With a linear restoring torque the equation of motion $I\ddot\theta=-\kappa\theta$ has the period $2\pi\sqrt{I/\kappa}$ whatever the amplitude, because a larger swing is fast in proportion: a large swing is exactly compensated by a larger torque. So the drive of the mainspring only needs to keep the amplitude up, and does not set the rate. For a stiffening spring ($\varepsilon>0$) the period shortens as the amplitude grows, by $T/T_0\approx1-\tfrac38\varepsilon\theta_0^2$, which is why watches were regulated for isochronism. Without a spring, $T=4\sqrt{2AI/\tau}$ rises with $\sqrt A$ and falls with $\sqrt\tau$.`,
      caption: String.raw`Left: two balance wheels in slow motion, an unsprung one (driven) and one with a spiral spring. Right: period against amplitude. Move the **amplitude** and the **stiffening** $\varepsilon$ of the spring; the unsprung balance's period creeps with $\sqrt A$ while the ideal spring's is a horizontal line. The readout gives the daily rate change for a 10% change in amplitude.`,
      deps: ['tech-5.5', 'mech-4.2', 'tech-5.4'],
      see: ['tech-5.6', 'mech-4.1'],
      refs: ['Usher, “The development of clocks and watches”', 'Cardwell'],
      tags: ['early-modern', 'timekeeping', 'oscillator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Balance_spring' },
      viz(v) {
        const A = v.stage({ x: [-2.5, 2.5], y: [-1.4, 1.5], equal: true, axes: false, height: 300, weight: 1.1, minWidth: 340, title: 'two balances (slow motion, 1/8 speed)' });
        const B = v.stage({ x: [30, 330], y: [0.3, 1.5], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 320, xlabel: 'amplitude (°)', ylabel: 'period / period at 270°', title: 'isochronism' });
        const aS = v.slider('amplitude (°)', 40, 330, 270, { step: 1 });
        const eS = v.slider('spring stiffening $\\varepsilon$', 0, 0.12, 0, { step: 0.002 });
        const T0 = 0.4, I = 1, A270 = 270 * D2R, TAU = (32 * A270 * I) / (T0 * T0); // drive chosen so that both balances beat at 5 Hz at 270°
        const Tsp = (a) => T0 * springPeriodRatio(a * D2R, eS.value) / springPeriodRatio(A270, eS.value);
        const Tun = (a) => bangPeriod(a * D2R, I, TAU);
        const spiral = (cx, cy, rot, ang) => { const pts = []; const n = 90; for (let i = 0; i <= n; i++) { const s = i / n, r = 0.12 + 0.55 * s, ph = 2 * Math.PI * 4.5 * s + rot + ang * (1 - s) ; pts.push([cx + r * Math.cos(ph), cy + r * Math.sin(ph)]); } return pts; };
        v.animate((t) => {
          const a = aS.value * D2R, ts = t / 8; // slow motion
          const thU = bangAngle(ts, a, Tun(aS.value)), thS = a * Math.cos((2 * Math.PI * ts) / Tsp(aS.value));
          for (const [cx, th, spring] of [[-1.3, thU, false], [1.3, thS, true]]) {
            A.circle(cx, 0, 0.95, { color: 'ink', width: 3 });
            for (const k of [0, 1, 2]) { const q = th + (k * 2 * Math.PI) / 3 + 0.5; A.line(cx, 0, cx + 0.95 * Math.cos(q), 0.95 * Math.sin(q), { color: 'muted', width: 2 }); }
            A.dot(cx + 0.95 * Math.cos(th + 0.5), 0.95 * Math.sin(th + 0.5), { r: 5, color: 'gold' });
            A.dot(cx, 0, { r: 4, color: 'ink' });
            if (spring) A.path(spiral(cx, 0, 0, 0 - th * 1.0), { color: 'green', width: 1.6 });
          }
          A.text('balance only', -1.3, -1.3, { size: 11, color: 'muted', align: 'center' }); A.text('with balance spring', 1.3, -1.3, { size: 11, color: 'muted', align: 'center' });
          // plot
          const pu = [], ps = []; for (let x = 30; x <= 330; x += 5) { pu.push([x, Tun(x) / T0]); ps.push([x, Tsp(x) / T0]); }
          B.hline(1, { color: 'muted', width: 1, dash: [3, 4] });
          B.path(pu, { color: 'red', width: 2.2 }); B.path(ps, { color: 'green', width: 2.6 });
          B.dot(aS.value, Tun(aS.value) / T0, { r: 6, color: 'red' }); B.dot(aS.value, Tsp(aS.value) / T0, { r: 6, color: 'green' });
        }, { period: 6, still: 0.7 });
        v.legend([['red', 'unsprung (driven) balance'], ['green', 'sprung balance']]);
        v.readout(() => {
          const a = aS.value, a2 = a * 1.1, du = (Tun(a2) / Tun(a) - 1), ds = (Tsp(a2) / Tsp(a) - 1);
          return `period at ${v.fix(a, 0)}°: unsprung ${v.fix(1000 * Tun(a), 0)} ms, sprung ${v.fix(1000 * Tsp(a), 0)} ms\na 10% larger swing changes the **unsprung** period by ${v.fix(100 * du, 2)}% (loses **${v.fix(1440 * (1 - 1 / (1 + du)), 0)} min/day**) and the **sprung** one by ${v.fix(100 * ds, 3)}% (loses **${v.fix(86400 * (1 - 1 / (1 + ds)), 0)} s/day**); $\\varepsilon=${v.fix(eS.value, 3)}$ ($\\varepsilon=0$ is isochronous)`;
        });
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
