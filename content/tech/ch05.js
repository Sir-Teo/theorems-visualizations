import { waterClock } from './source-audit-water.js';
// History of Technology — Chapter 5: Time and navigation (items 5.1–5.6; 5.7–5.11 are in ch05-b.js)
import { yearStage, drawYears, D2R, clamp, ellipK, pendulumRatio, lossPerDay, bangPeriod, bangAngle, OBLIQ, sunLon, eclDec, eclRA, altitude, dayName, hhmm } from './ch05.shared.js';

// ---------------------------------------------------------------- 5.2 helpers: stereographic plate and rete
const STARS = [ // name, right ascension (hours), declination (degrees); J2000 values rounded to about 0.1°
  ['Sirius', 6.752, -16.72], ['Betelgeuse', 5.919, 7.41], ['Rigel', 5.242, -8.20], ['Aldebaran', 4.599, 16.51], ['Capella', 5.278, 46.00],
  ['Procyon', 7.655, 5.22], ['Pollux', 7.755, 28.03], ['Regulus', 10.140, 11.97], ['Arcturus', 14.261, 19.18], ['Spica', 13.420, -11.16],
  ['Antares', 16.490, -26.43], ['Vega', 18.616, 38.78], ['Altair', 19.846, 8.87], ['Deneb', 20.690, 45.28],
];
/** Stereographic projection from the south celestial pole onto the equatorial plane (equator radius 1): declination dec, hour angle H (degrees). The meridian is "up", west to the right. */
function proj(dec, H) { const r = Math.tan(((90 - dec) / 2) * D2R); return [r * Math.sin(H * D2R), r * Math.cos(H * D2R)]; }
/** Almucantar (circle of equal altitude a) for latitude lat, as a projected polyline (broken where it leaves the plate). */
function almucantar(lat, a) {
  const pts = [], f = lat * D2R, al = a * D2R;
  for (let i = 0; i <= 240; i++) {
    const A = (i / 240) * 2 * Math.PI, sd = Math.sin(f) * Math.sin(al) + Math.cos(f) * Math.cos(al) * Math.cos(A);
    const dec = Math.asin(clamp(sd, -1, 1)) / D2R, H = Math.atan2(-Math.cos(al) * Math.sin(A), Math.sin(al) * Math.cos(f) - Math.cos(al) * Math.sin(f) * Math.cos(A)) / D2R;
    const q = proj(dec, H); pts.push(Math.hypot(q[0], q[1]) < 1.7 ? q : null);
  }
  return pts;
}

// ---------------------------------------------------------------- 5.3 helpers: a centred tilted dipole
/** Bearing (degrees clockwise from true north, in (−180, 180]) from the point (lat, lon) toward the geomagnetic pole (plat, plon): the declination of a centred dipole. */
function dipoleDecl(lat, lon, plat, plon) {
  const f = lat * D2R, f2 = plat * D2R, dl = (plon - lon) * D2R;
  return Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f) * Math.sin(f2) - Math.sin(f) * Math.cos(f2) * Math.cos(dl)) / D2R;
}
/** Damped needle: theta'' = −w0² sin(theta) − 2 zeta w0 theta', released at rest from th0 (radians); returns the angle at time t by RK4 on a cached table. */
function needleTable(w0, zeta, th0, T = 10, dt = 0.01) {
  const n = Math.round(T / dt), out = new Float64Array(n + 1); let th = th0, w = 0; out[0] = th;
  const acc = (x, y) => -w0 * w0 * Math.sin(x) - 2 * zeta * w0 * y;
  for (let i = 1; i <= n; i++) {
    const k1 = [w, acc(th, w)], k2 = [w + dt / 2 * k1[1], acc(th + dt / 2 * k1[0], w + dt / 2 * k1[1])];
    const k3 = [w + dt / 2 * k2[1], acc(th + dt / 2 * k2[0], w + dt / 2 * k2[1])], k4 = [w + dt * k3[1], acc(th + dt * k3[0], w + dt * k3[1])];
    th += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); w += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); out[i] = th;
  }
  return { at: (t) => { const x = clamp(t / dt, 0, n - 1e-9), i = Math.floor(x); return out[i] + (out[i + 1] - out[i]) * (x - i); }, dt, n };
}

// ---------------------------------------------------------------- 5.5 helpers: spring and fusee
const M_EMPTY = 0.4; // linear-spring torque when run down, relative to the full-wound torque (illustrative)
const mLin = (u) => M_EMPTY + (1 - M_EMPTY) * u;           // the ideal spring the fusee is cut for (u = fraction still wound)
const mReal = (u, g) => mLin(u) * (1 + g * Math.sin(Math.PI * u) * 0.6); // an actual spring that departs from the ideal by a bulge of strength g
const fuseeR = (u) => mLin(1) / mLin(u);                   // radius that makes M(u) r(u) constant for the ideal spring; 1 at full wind

export default {
  collection: 'tech',
  chapter: 5,
  title: 'Time and navigation',
  summary: String.raw`Water clocks and sundials kept time imperfectly until the mechanical escapement, around 1300, turned a falling weight into steady ticks. The pendulum, introduced by Huygens in 1656, and the balance spring, around 1675, made clocks and watches accurate, and that precision solved the longitude problem at sea, alongside the compass, astrolabe and sextant. Most of the dates in this chapter are better documented than the invention stories attached to them, and the items say where credit is disputed. The pictures are physical models, stated as such, with the spring, the escapement and the voyage reduced to the few parameters that decide the result.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num:'5.1',kind:'Invention',name:'The water clock (clepsydra)',verify:true,
      statement:String.raw`A water clock indicates elapsed time through controlled water transfer. The Karnak outflow vessel, JE 37525, is catalogued to Amenhotep III by its present museum. Its interior has twelve monthly columns of hour marks. These seasonal hours should not be confused with twelve equal modern hours.

Vitruvius IX.8 describes Ctesibius' water-clock mechanism, including a regulated opening, a rising float and toothed motion transmission. That text is historical evidence for the mechanism it describes, not a derivation of Torricelli's law or proof that the exact constant-head overflow pictured here was his original invention. The two ideal hydraulic comparisons below are authored.`,
      idea:String.raw`Assume quasi-steady ideal outflow through a small fixed hole and a vessel cross-section $A(h)\propto h^{2p}$. Torricelli flow is proportional to $\sqrt h$, so elapsed time is proportional to the integral of $h^{2p-1/2}$. Put $n=2p+1/2$ and final head $h_1=0.15$. For normalized elapsed time $\tau$,
$$h(\tau)=[1-\tau(1-h_1^n)]^{1/n}.$$
The equally spaced level scale reads the fraction $(1-h)/(1-h_1)$. At $p=1/4$, $n=1$ and this equals $\tau$ exactly in the ideal model. A cylinder $p=0$ and cone $p=1$ differ. Every vessel's complete specified run is normalized to 12 equal illustrative hours; this is not the Karnak calibration.

In the separate constant-head comparison, an adequate supply and overflow keep the source head fixed. A **constant-area receiving tank**, not the source's level scale, then rises linearly with time. Changing the profile exponent cannot change that receiver's linear readout.`,
      caption:String.raw`Select elapsed time and vessel-profile exponent. In outflow mode, orange ticks are equally spaced levels and green ticks correspond to equal model times. The gold line marks the actual level. The error plot contains every sampled error and the selected state, using a complete dynamic range. The readout identifies the largest absolute error among 241 equally spaced times rather than asserting an exact global maximum.

Toggle the constant-head comparison to see a supply vessel kept full by overflow and a separate rectangular receiver with a rising gold float. In this mode the receiver level, rather than the full source, indicates elapsed time and the error is zero by the stated assumptions.`,
      deps:['fluid-2.10'],see:['tech-5.4'],refs:['NMEC, Clepsydra, JE 37525, Amenhotep III; Ancient Egyptian Astronomy database WCO 1, identification/interior markings','Vitruvius, De architecturaIX.8.4–7, regulated opening, float and gear transmission; Morgan 1914/Gwilt 1826 translations'],tags:['ancient','timekeeping','fluid'],
      credit:'Karnak outflow vessel, Amenhotep III; Ctesibius mechanism described by Vitruvius IX.8; normalized hydraulic comparisons authored here',
      scope:String.raw`The exponent family, head cutoff, 12-hour normalization, ideal orifice law, supply/overflow and constant-area receiver are authored. Viscosity, hole wear, temperature, leakage, float loading and seasonal-hour calibration are excluded. The illustration is not a dimensional reconstruction or performance test of JE 37525.`,
      links:{source:'https://nmec.gov.eg/collections/temp-name-4/',catalogue:'https://aea.mcmaster.ca/index.php/en/database/water-clocks/wco-1-amenhotep-iii-karnak',text:'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/9*.html'},
      viz(v){
        const exponent=v.slider('authored profile exponent p',0,1,0,{step:'any',decimals:6}),time=v.slider('elapsed model time (h)',0,12,4,{step:'any',decimals:6}),constant=v.toggle('constant-head comparison',false),A=v.stage({x:[-1.7,1.7],y:[-.25,1.3],axes:false,height:330,minWidth:260,title:'outflow vessel or source + receiver'}),B=v.stage({x:[-.6,12.6],y:[-150,150],axes:'box',gutter:true,height:330,minWidth:260,xlabel:'model time (h)',ylabel:'linear-scale error (min)',title:'complete sampled error curve'});let info;
        v.legend([['orange','equal level marks'],['green','equal model times'],['gold','current level / receiver',{dot:true}]]);
        v.render(()=>{const p=waterClock(exponent.value,time.value,constant.value);B.setView([-.6,12.6],p.range);if(p.constant){A.rect(-1.35,.1,-.45,1.08,{color:'ink',width:1.5});A.rect(-1.35,.1,-.45,1,{fill:'accent',fillAlpha:.3,stroke:false});A.path([[-1.6,1.2],[-.9,1.2],[-.9,1.05]],{color:'accent',width:2});A.path([[-.45,1],[-.2,1],[-.2,.8],[.35,.8]],{color:'accent',width:2});A.rect(.35,.1,1.35,1.08,{color:'ink',width:1.5});const y=.1+.8*p.tau;A.rect(.35,.1,1.35,y,{fill:'accent',fillAlpha:.3,stroke:false});A.line(.4,y,1.3,y,{color:'gold',width:2});A.text('source',-.9,-.08,{align:'center',size:11,color:'ink'});A.text('receiver',.85,-.08,{align:'center',size:11,color:'ink'});}else{const R=h=>.5*h**p.p,left=[],right=[],water=[];for(let i=0;i<=80;i++){const h=i/80;left.push([-R(h),h]);right.push([R(h),h]);const z=h*p.head;water.push([R(z),z]);}for(let i=80;i>=0;i--){const z=i/80*p.head;water.push([-R(z),z]);}A.poly(water,{fill:'accent',fillAlpha:.3,stroke:false});A.path(left,{color:'ink',width:2});A.path(right,{color:'ink',width:2});for(const k of p.ticks){A.line(-R(k.equal)-.08,k.equal,-R(k.equal),k.equal,{color:'orange',width:1.4});A.line(R(k.true),k.true,R(k.true)+.08,k.true,{color:'green',width:1.4});if(k.hour%3===0){A.text(String(k.hour),-R(k.equal)-.13,k.equal,{align:'right',baseline:'middle',size:10,color:'orange'});A.text(String(k.hour),R(k.true)+.13,k.true,{align:'left',baseline:'middle',size:10,color:'green'});}}A.line(-.75,p.head,.75,p.head,{color:'gold',width:1.5});A.line(0,0,0,-.16,{color:'accent',width:2});}B.path(p.curve,{color:p.constant?'green':'orange',width:2.2});B.dot(p.hours,p.error,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `${p.constant?'Constant-head receiver':'Outflow level scale'} at ${v.fix(p.hours,9)} h: ${p.constant?'receiver fraction':'source head'} ${v.fix(p.constant?p.tau:p.head,9)}; indicated ${v.fix(p.linearHours,9)} h, signed error ${v.fix(p.error,9)} min. Largest |error| among 241 model times ${v.fix(Math.abs(p.worst[1]),9)} min at ${v.fix(p.worst[0],6)} h. ${p.constant?'An adequate constant-head supply and constant-area receiver are assumed.':`p=${v.fix(p.p,9)}; exact ideal equal-level case p=0.25; first/last-hour drop ratio ${v.fix(p.firstDrop/p.lastDrop,9)}.`}`;});
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Invention',
      name: 'The astrolabe',
      credit: 'Origin disputed: stereographic projection is attributed to Hipparchus (2nd century BCE) and treated by Ptolemy (Planisphaerium); the oldest surviving treatise is by John Philoponus (about 550 CE), the first astrolabes in the Islamic world are credited to al-Fazari (8th century), and the earliest surviving instrument is dated 927–928 CE',
      verify: true,
      statement: String.raw`A **planispheric astrolabe** is a portable analogue computer of the sky. A *plate* made for one latitude carries the stereographic projection of the horizon, the circles of equal altitude (almucantars) and the meridian; over it turns the *rete*, an open-work disc that carries the projected ecliptic circle and pointers for bright stars. Turning the rete to the present hour angle puts the sky on the plate, and one reads off altitudes, rising and setting, and the time of day or night. The back carries a sighting arm (alidade) to measure altitude.

What the sources support: the mathematics of stereographic projection is Greek (Hipparchus is said to have known it, and Ptolemy wrote about it) but there is no convincing evidence that the plane astrolabe itself existed before late antiquity; Philoponus' treatise (about 550 CE) is the oldest that survives, and the oldest surviving instrument is dated 927–928 CE. The popular claims that Hipparchus built one or that Hypatia did are not supported by evidence.

Scope of the picture: projection from the south celestial pole onto the equatorial plane for a northern observer; 14 bright stars at rounded J2000 coordinates (precession is ignored); the Sun's place is a low-precision formula good to about a degree.`,
      idea: String.raw`Stereographic projection (geog-5.2) sends circles on the sphere to circles on the plane, so the horizon and every almucantar are circles that can be drawn with a compass once, for a given latitude, and the ecliptic circle and the star pointers are fixed relative to one another. Only their orientation changes with time, because the sky turns about the pole once a sidereal day. So the rete turns rigidly over a fixed plate, and every altitude is read by position. The projection of the point of declination $\delta$ and hour angle $H$ is $r=\tan\tfrac{90^\circ-\delta}{2}$ at the angle $H$, which puts the tropic of Capricorn on the outer rim (radius $\tan 56.7^\circ\approx1.52$).`,
      caption: String.raw`The plate (latitude, horizon in bold, almucantars every 10°) is fixed and the rete (ecliptic circle, 14 stars, and the Sun on the ecliptic) turns with the **hour**. Pick a **date**: the Sun moves along the ecliptic. Pick a **star**: the gold circle is the almucantar it sits on, so its altitude is read straight off the plate; the readout checks it against the spherical-trigonometry formula.`,
      deps: ['geog-5.2'],
      see: ['geog-2.4', 'tech-5.11'],
      refs: ['Mokyr ch. 3', 'Evans, The History and Practice of Ancient Astronomy', 'Savage-Smith, Islamicate Celestial Globes (as cited by Wikipedia “Astrolabe”)'],
      tags: ['ancient', 'astronomy', 'projection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Astrolabe' },
      viz(v) {
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 460, minWidth: 360, title: 'plate and rete' });
        const latS = v.slider('latitude (°N)', 10, 70, 50, { step: 1 });
        const dateS = v.slider('date', 1, 365, 172, { step: 1, fmt: (x) => dayName(x) });
        const hourS = v.slider('solar time (h)', 0, 24, 15, { step: 0.05, fmt: (x) => hhmm(x) });
        const starS = v.select('star', STARS.map((s, i) => ({ value: String(i), label: s[0] })), '0');
        v.render(() => {
          const lat = latS.value, lam = sunLon(dateS.value), decS = eclDec(lam), raS = eclRA(lam), Hs = (hourS.value - 12) * 15, LST = Hs + raS;
          // fixed plate
          for (const [d, nm] of [[0, 'equator'], [OBLIQ, 'Cancer'], [-OBLIQ, 'Capricorn']]) { const r = Math.tan((90 - d) / 2 * D2R); S.circle(0, 0, r, { color: 'muted', width: d === 0 ? 1.4 : 1, alpha: 0.7, dash: d === 0 ? null : [4, 3] }); }
          S.line(0, -1.62, 0, 1.62, { color: 'faint', width: 1 }); S.line(-1.62, 0, 1.62, 0, { color: 'faint', width: 1 });
          for (let a = 10; a <= 80; a += 10) S.path(almucantar(lat, a), { color: 'blue', width: 1, alpha: 0.45 });
          const star = STARS[+starS.value], sH = LST - star[1] * 15, sAlt = altitude(lat, star[2], sH);
          if (sAlt > 0) S.path(almucantar(lat, sAlt), { color: 'gold', width: 2.2 });
          S.path(almucantar(lat, 0), { color: 'blue', width: 2.8 });
          S.text('horizon', proj(lat - 90 + 3, 0)[0] + 0.05, proj(lat - 90 + 3, 0)[1], { size: 10.5, color: 'blue', align: 'left' });
          S.text('zenith', proj(lat, 0)[0] + 0.07, proj(lat, 0)[1], { size: 10.5, color: 'blue', align: 'left' });
          S.dot(...proj(lat, 0), { r: 3, color: 'blue' });
          S.dot(0, 0, { r: 3.5, color: 'ink' });
          S.text('N pole', 0.08, -0.08, { size: 10, color: 'muted', align: 'left', baseline: 'top' });
          // rete: ecliptic, stars
          const ecl = []; for (let l = 0; l <= 360; l += 3) { ecl.push(proj(eclDec(l), LST - eclRA(l))); }
          S.path(ecl, { color: 'orange', width: 2.4 });
          for (const [lab, l] of [['♈', 0], ['♋', 90], ['♎', 180], ['♑', 270]]) { const q = proj(eclDec(l), LST - eclRA(l)); S.dot(q[0], q[1], { r: 3, color: 'orange' }); }
          STARS.forEach((s, i) => { const q = proj(s[2], LST - s[1] * 15); const on = i === +starS.value; S.dot(q[0], q[1], { r: on ? 6 : 3.5, color: on ? 'gold' : 'purple', label: s[0], labelPos: 'ne' }); });
          const sq = proj(decS, Hs + raS - raS); // the Sun: hour angle Hs
          S.dot(sq[0], sq[1], { r: 8, color: 'gold' }); S.text('Sun', sq[0] + 0.08, sq[1] + 0.1, { size: 11.5, color: 'ink', align: 'left' });
          S.text('rim: tropic of Capricorn', 0, -1.68, { size: 10, color: 'muted', align: 'center' });
        });
        v.legend([['blue', 'plate: horizon and almucantars'], ['orange', 'rete: ecliptic'], ['purple', 'rete: stars', { dot: true }], ['gold', 'selected star and its almucantar']]);
        v.readout(() => {
          const lat = latS.value, lam = sunLon(dateS.value), decS = eclDec(lam), raS = eclRA(lam), Hs = (hourS.value - 12) * 15, LST = Hs + raS;
          const star = STARS[+starS.value], sH = LST - star[1] * 15, sAlt = altitude(lat, star[2], sH), sunAlt = altitude(lat, decS, Hs);
          return `Sun: declination ${v.fix(decS, 1)}°, altitude **${v.fix(sunAlt, 1)}°** ${sunAlt < 0 ? '(below the horizon)' : ''}\n${star[0]} (RA ${v.fix(star[1], 2)} h, dec ${v.fix(star[2], 1)}°): hour angle ${v.fix(((sH % 360) + 360) % 360, 0)}°, altitude **${v.fix(sAlt, 1)}°** ${sAlt < 0 ? '(below the horizon)' : ''} — the gold almucantar passes through it only when it is up`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Invention',
      name: 'The magnetic compass',
      credit: 'Shen Kuo, Dream Pool Essays (1088): magnetised needle and magnetic declination; Zhu Yu, Pingzhou Ketan (written about 1111–1117): use at sea; Alexander Neckam in Europe (about 1187–1190)',
      verify: true,
      statement: String.raw`A **magnetic compass** is a magnetised needle free to turn in a horizontal plane. It settles along the horizontal part of the Earth's magnetic field, which in most places differs from the direction to the geographic pole by the **declination** $D$ (east positive). The restoring torque on a needle of moment $m$ at angle $\theta$ from the field direction is $-mB_h\sin\theta$ (em-7.18), so the needle swings about magnetic north and, with damping, settles.

What the sources support: Chinese texts of the Song period give the first descriptions of a magnetised needle and, in Shen Kuo's *Dream Pool Essays* (1088), of the fact that it does not point exactly to the geographic pole (declination). Shen describes it for geomancy and not for sea use; Zhu Yu's *Pingzhou Ketan* records pilots reading it on cloudy days. In Europe the earliest mentions are those of Alexander Neckam (the 1180s–1190s). The earlier claim of a Han-dynasty "south-pointing spoon" is not supported by evidence of a magnet compass.

Scope of the picture: the declination map is a **model**: a centred dipole whose pole is set at 80° N, 72° W (round numbers). The real field has large departures from a dipole, and the real declination at, say, London differs from this model by several degrees and changes year by year.`,
      idea: String.raw`The torque on a magnetic moment $\mathbf m$ in a field $\mathbf B$ is $\mathbf m\times\mathbf B$ (em-7.18); for a needle confined to the horizontal plane only the horizontal component $B_h$ matters, and $I\ddot\theta=-mB_h\sin\theta-c\dot\theta$. For small angles this is a damped oscillator with $\omega_0=\sqrt{mB_h/I}$ (mech-4.2), so the needle rings at $\omega_0$ and decays at a rate set by the damping: a dry pivot is slow to settle, and a liquid-filled bowl is nearly critically damped. For a dipole field the horizontal field points along the great circle to the magnetic pole, so declination is the bearing from the observer to that pole; the field is horizontal at the magnetic equator and vertical at the poles, where a compass is useless.`,
      caption: String.raw`Drag the gold **place** on the map (model declination in colour) and the needle is drawn at the local bearing of magnetic north. Release the needle at **start angle** $\theta_0$ and choose the damping: the curve shows the swing, and the needle at the left follows it. Move the **magnetic pole** to see how the declination map changes.`,
      deps: ['em-7.18'],
      see: ['mech-4.7', 'tech-5.10'],
      refs: ['Mokyr ch. 3', 'Needham, Science and Civilisation in China 4.1, as cited by Wikipedia “Compass”'],
      tags: ['medieval', 'magnetism', 'navigation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Compass' },
      viz(v) {
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 260, title: 'the needle' });
        const B = v.stage({ x: [0, 10], y: [-100, 100], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280, xlabel: 'time (s)', ylabel: 'angle from magnetic north (°)', title: 'the swing' });
        const M = v.stage({ x: [-180, 180], y: [-80, 80], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'longitude (°)', ylabel: 'latitude (°)', title: 'model declination (centred dipole)' });
        const Y = yearStage(v, [1050, 1250], { height: 130, full: true, title: 'dated evidence' });
        const th0S = v.slider('start angle $\\theta_0$ (°)', 5, 170, 90, { step: 1 });
        const w0S = v.slider('needle strength $\\omega_0$ (rad/s)', 1, 4, 2.2, { step: 0.05 });
        const dampS = v.select('damping', [{ value: '0.06', label: 'dry pivot' }, { value: '0.5', label: 'oil-damped' }, { value: '1', label: 'critical' }], '0.06');
        const plat = v.slider('magnetic pole latitude (°N)', 60, 90, 80, { step: 0.5 });
        const place = M.handle(-5, 50, { color: 'gold', r: 8, label: 'place', labelPos: 'ne', constrain: { x: [-180, 180], y: [-75, 75] } });
        const PLON = -72;
        let tab = null, key = '';
        v.animate((t) => {
          const kk = `${th0S.value}|${w0S.value}|${dampS.value}`;
          if (kk !== key) { key = kk; tab = needleTable(w0S.value, +dampS.value, th0S.value * D2R); }
          const tt = t % 10, th = tab.at(tt) / D2R, D = dipoleDecl(place.y, place.x, plat.value, PLON), bearing = D + th;
          // compass rose
          A.circle(0, 0, 1.25, { color: 'muted', width: 1.5 }); A.circle(0, 0, 1.12, { color: 'faint', width: 1 });
          for (let a = 0; a < 360; a += 15) { const r0 = a % 90 === 0 ? 1.0 : 1.12; A.line(r0 * Math.sin(a * D2R), r0 * Math.cos(a * D2R), 1.25 * Math.sin(a * D2R), 1.25 * Math.cos(a * D2R), { color: 'muted', width: a % 90 === 0 ? 2 : 1 }); }
          A.text('N', 0, 1.38, { size: 13, color: 'ink', align: 'center', weight: 700 }); A.text('E', 1.38, 0, { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); A.text('S', 0, -1.38, { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); A.text('W', -1.38, 0, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          const bx = Math.sin(bearing * D2R), by = Math.cos(bearing * D2R), px = -by * 0.09, py = bx * 0.09;
          A.poly([[bx * 0.95, by * 0.95], [px, py], [-px, -py]], { fill: 'red', fillAlpha: 0.85, color: 'red', width: 1 });
          A.poly([[-bx * 0.95, -by * 0.95], [px, py], [-px, -py]], { fill: 'muted', fillAlpha: 0.7, color: 'muted', width: 1 });
          A.dot(0, 0, { r: 4, color: 'ink' });
          const dm = D * D2R; A.line(0, 0, 0, 1.0, { color: 'accent', width: 1.2, dash: [3, 3] }); A.line(0, 0, 1.0 * Math.sin(dm), 1.0 * Math.cos(dm), { color: 'green', width: 1.8, dash: [5, 3] });
          // swing curve
          const pts = []; for (let i = 0; i <= 400; i++) { const x = i / 40; pts.push([x, tab.at(x) / D2R]); }
          B.hline(0, { color: 'muted', width: 1 }); B.path(pts, { color: 'accent', width: 2.2 }); B.dot(tt, th, { r: 6, color: 'gold' });
          // map
          M.heat((lon, lat) => dipoleDecl(lat, lon, plat.value, PLON), { range: [-120, 120], cmap: 'diverging', res: 4, key: `${plat.value}` });
          M.vline(PLON, { color: 'faint', width: 1, dash: [3, 4] });
          M.dot(PLON, plat.value, { r: 5, hollow: true, color: 'ink', label: 'pole', labelPos: 'ne' });
          M.axes();
          drawYears(v, Y, [{ t: 1088, label: 'Shen Kuo: needle, declination' }, { t: [1111, 1117], label: 'Zhu Yu: pilots read it' }, { t: [1187, 1190], label: 'Neckam in Europe' }], { lanes: 3, ticks: [1100, 1150, 1200] });
        }, { period: 10, still: 1.2 });
        v.legend([['red', 'north end of the needle'], ['accent', 'true north', { dash: [3, 3] }], ['green', 'magnetic north (declination)', { dash: [5, 3] }]]);
        v.readout(() => {
          const D = dipoleDecl(place.y, place.x, plat.value, PLON), zeta = +dampS.value, w0 = w0S.value;
          return `place ${v.fix(place.y, 0)}°, ${v.fix(place.x, 0)}°: model declination **${v.fix(D, 1)}°** (${D >= 0 ? 'east' : 'west'}), so a navigator steering by the needle is off true north by that much\nneedle: small-swing frequency $\\omega_0=${v.fix(w0, 2)}$ rad/s, period ${v.fix(2 * Math.PI / w0, 2)} s${zeta < 1 ? `, ring-down rate $\\zeta\\omega_0=${v.fix(zeta * w0, 2)}$ s$^{-1}$ (amplitude falls by ${v.fix(Math.exp(-zeta * w0 * 2 * Math.PI / (w0 * Math.sqrt(1 - zeta * zeta))), 2)} each swing)` : ', critically damped: no overshoot'}; model, not a measured field`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Invention',
      name: 'Mechanical clock with verge-and-foliot escapement',
      credit: 'Anonymous, probably in northern Italy or England, late 13th century: the earliest tower clocks are recorded from about 1283–1300 (Dunstable, Westminster, Canterbury) and the first clear drawing of an escapement is in the Dondi manuscript (1364); the Salisbury Cathedral clock (about 1386) is an early surviving example whose original escapement is uncertain',
      verify: true,
      statement: String.raw`A **verge-and-foliot clock** is driven by a falling weight that turns a toothed *crown wheel*. A vertical rod (the *verge*) carries two *pallets* at right angles; each tooth in turn pushes a pallet and is then released as the other pallet comes into the wheel. The verge carries a horizontal bar, the *foliot*, with adjustable weights at its ends. The wheel can advance only a tooth at a time, each time the foliot swings, so the falling weight is converted into a regular count of swings: the first mechanical **escapement**.

What the sources support: mechanical clocks without dials, striking the hours, are recorded from the end of the 13th century; the form of their escapement is not given in the early texts, and the verge and foliot is the form known from the 14th century on. The oldest drawings of it are in the Dondi manuscript (1364). The rate of such a clock is not set by a restoring force but by the **drive** and the **inertia** of the foliot.

Scope of the picture: a constant-torque model ($I\ddot\theta=-\tau\,\mathrm{sgn}\,\theta$, no friction, no recoil, instant pallet exchange), in relative units; it shows how the rate depends on the drive and on the weights, not the real wheel geometry.`,
      idea: String.raw`With nothing to pull the foliot back, its motion is set by the drive: the crown wheel's push accelerates the foliot at $\tau/I$ toward the middle of its swing, and the other pallet then pushes the other way and brings it to rest at the far side. A quarter swing through the angle $A$ takes $\sqrt{2AI/\tau}$, so the period is $T=4\sqrt{2AI/\tau}$. Moving the weights outward raises $I=I_0+2mx^2$ and slows the clock, which is how it was regulated. But $T\propto\tau^{-1/2}$: a 10% change in the driving torque (a dirty train, a longer rope) changes the rate by about 5%, an hour a day. This is the defect that a restoring force removes (5.6, 5.8), and why the weight of a verge clock had to be adjusted by hand.`,
      caption: String.raw`Left: the foliot from above (weights gold) over the crown wheel with 13 teeth; right: the swing angle against time. Slide the **weights** outward to slow the clock, and change the **drive**: unlike a pendulum, the clock's rate responds to the driving force. The readout turns this into minutes per day.`,
      deps: ['tech-2.9', 'tech-5.1'],
      see: ['tech-5.6', 'tech-5.8', 'mech-4.2'],
      refs: ['Usher, “Water clocks and mechanical clocks”', 'Cardwell'],
      tags: ['medieval', 'timekeeping', 'mechanism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Verge_escapement' },
      viz(v) {
        const A = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 320, weight: 1, minWidth: 300, title: 'foliot and crown wheel, from above' });
        const B = v.stage({ x: [0, 8], y: [-60, 60], axes: 'box', gutter: true, height: 320, weight: 1.1, minWidth: 320, xlabel: 'time (s)', ylabel: 'foliot angle (°)', title: 'the swing' });
        const xS = v.slider('weight position $x$ (relative)', 0.3, 1.2, 0.8, { step: 0.01 });
        const tauS = v.slider('driving torque (relative)', 1, 6, 3, { step: 0.05 });
        const aS = v.slider('swing $A$ (°)', 20, 60, 45, { step: 1 });
        const I0 = 0.6, mW = 1;
        const NT = 13;
        v.animate((t) => {
          const A0 = aS.value * D2R, I = I0 + 2 * mW * xS.value ** 2, T = bangPeriod(A0, I, tauS.value), th = bangAngle(t, A0, T);
          // wheel: one tooth per full period
          const wheel = -(t / T) * (360 / NT) * D2R;
          A.circle(0, -0.2, 0.9, { color: 'muted', width: 1.2, alpha: 0.6 });
          for (let i = 0; i < NT; i++) { const a = wheel + (i * 2 * Math.PI) / NT; A.poly([[0.8 * Math.cos(a), -0.2 + 0.8 * Math.sin(a)], [1.0 * Math.cos(a + 0.12), -0.2 + 1.0 * Math.sin(a + 0.12)], [0.8 * Math.cos(a + 0.28), -0.2 + 0.8 * Math.sin(a + 0.28)]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1 }); }
          A.text('crown wheel (13 teeth)', 0, -1.38, { size: 10.5, color: 'muted', align: 'center' });
          // foliot bar and weights (top view)
          const c = Math.cos(th), s = Math.sin(th), L = 1.3, xw = xS.value;
          A.line(-L * c, -L * s + 0.5, L * c, L * s + 0.5, { color: 'ink', width: 4.5 });
          for (const sg of [-1, 1]) A.rect(sg * xw * c - 0.09, sg * xw * s + 0.5 - 0.09, sg * xw * c + 0.09, sg * xw * s + 0.5 + 0.09, { fill: 'gold', fillAlpha: 0.8, color: 'orange', width: 1.5 });
          A.dot(0, 0.5, { r: 5, color: 'ink' }); A.text('verge', 0.12, 0.5 - 0.12, { size: 10.5, color: 'muted', align: 'left', baseline: 'top' });
          // swing plot
          const pts = []; for (let i = 0; i <= 400; i++) { const x = (i / 400) * 8; pts.push([x, bangAngle(x, A0, T) / D2R]); }
          B.hline(0, { color: 'muted', width: 1 }); B.path(pts, { color: 'accent', width: 2.2 }); B.vline(t % 8, { color: 'gold', width: 1.2, dash: [4, 3] });
          B.dot(t % 8, th / D2R, { r: 6, color: 'gold' });
        }, { period: 8, still: 0.6 });
        v.readout(() => {
          const A0 = aS.value * D2R, I = I0 + 2 * mW * xS.value ** 2, tau = tauS.value, T = bangPeriod(A0, I, tau);
          const up = (Math.sqrt(1.1) - 1) * 1440, wUp = (Math.sqrt(bangPeriod(A0, I0 + 2 * mW * (xS.value * 1.1) ** 2, tau) / T) - 1);
          return `$T=4\\sqrt{2AI/\\tau}=${v.fix(T, 2)}$ s with $I=${v.fix(I, 2)}$; one beat (a pallet exchange) every ${v.fix(T / 2, 2)} s\n**+10% driving torque makes the clock gain ${v.fix(up, 0)} min per day** ($T\\propto\\tau^{-1/2}$); moving the weights 10% outward slows it by ${v.fix(100 * (bangPeriod(A0, I0 + 2 * mW * (xS.value * 1.1) ** 2, tau) / T - 1), 1)}%. (Model in relative units; real beats are of order a second.)`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Invention',
      name: 'The mainspring and fusee',
      credit: 'The spring-driven clock appears in the early 15th century; the oldest surviving fusee clock is a table clock made for Philip the Good of Burgundy, dated by its decoration to about 1430–1435 (a fusee also appears in a crossbow in a manuscript of 1405 and in drawings of Brunelleschi and Leonardo); the common attribution of the fusee to Jacob Zech of Prague (about 1525) is wrong',
      verify: true,
      statement: String.raw`A **mainspring** is a coiled strip of steel, wound with a key, which stores energy and releases it as a torque on the clock train, so a clock no longer needs a falling weight and can be made small enough for a table or a pocket. But a spring's torque falls as it unwinds. The **fusee** is a cone, grooved for a chain wound from the barrel that holds the spring: when the spring is fully wound the chain pulls on the small end, and as it runs down the chain moves to larger radii. The torque delivered to the train, spring torque times fusee radius, is then nearly constant.

What the sources support: spring-driven clocks are known from the early 15th century; the fusee was already in use by about 1430, in the Burgundian clock; the date comes from the decoration on the clock and not from a document. The fusee is not a clockmaker's invention but turns up first in the windlass of a crossbow.

Scope of the picture: the spring torque is a model (a linear fall from the full-wound value to 40% of it, plus an adjustable departure); real springs are less simple and are fitted with a stop-work so that only the flat middle part of their range is used.`,
      idea: String.raw`If the chain pulls with force $F=M/R_b$ (the spring torque $M$ over the barrel radius $R_b$) and the fusee radius at that point is $r$, the train sees the torque $Fr=(M/R_b)\,r$. For this to be constant, $r$ must vary as $1/M$: the profile is a hyperbola in the spring's run-down, flat where the spring is weak. A fusee cut for one spring is right for that spring only: if the real spring bulges away from the ideal, the delivered torque still varies. And since a verge clock's rate varies as the square root of the torque (5.4), a spring that loses a third of its torque as it runs down would slow a verge clock by about 18%, more than four hours a day, without a fusee.`,
      caption: String.raw`Left: the fusee profile (radius against turns still wound) with the chain's contact point (gold) at the **wind state** you choose. Right: spring torque (orange), fusee radius (grey), and the torque delivered to the clock train (green). Switch the **fusee** off, then on; make the spring depart from the ideal with **departure** and watch the green curve stop being flat.`,
      deps: ['tech-5.4', 'mech-4.1'],
      see: ['tech-5.8', 'mech-4.2'],
      refs: ['Usher, “The development of clocks and watches”', 'Cardwell'],
      tags: ['early-modern', 'timekeeping', 'mechanism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fusee_(horology)' },
      viz(v) {
        const P = v.stage({ x: [-1.3, 1.3], y: [0, 1], axes: false, height: 320, weight: 0.8, minWidth: 260, title: 'the fusee cone and its chain' });
        const Q = v.stage({ x: [0, 1], y: [0, 1.6], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 320, xlabel: 'run-down (0 = fully wound, 1 = run down)', ylabel: 'torque (relative)', title: 'torque against run-down' });
        const uS = v.slider('run-down', 0, 1, 0.3, { step: 0.005 });
        const gS = v.slider('spring departs from the ideal (bulge)', -0.5, 0.5, 0.25, { step: 0.01 });
        const fS = v.toggle('fusee', true);
        v.render(() => {
          const wound = 1 - uS.value; // fraction still wound
          // cone profile: radius against position along the axis (y); full wind at the top (small end)
              const rad = (w) => (fS.value ? 0.32 * fuseeR(w) : 0.32 * fuseeR(0.5));
          const left = [], right = [];
          for (let i = 0; i <= 100; i++) { const w = 1 - i / 100, y = 0.92 - 0.82 * (i / 100); left.push([-rad(w), y]); right.push([rad(w), y]); }
          P.poly([...left, ...right.reverse()], { fill: 'muted', fillAlpha: 0.25, color: 'ink', width: 2 });
          for (let k = 0; k <= 12; k++) { const w = 1 - k / 12, y = 0.92 - 0.82 * (k / 12); P.line(-rad(w), y, rad(w), y, { color: 'muted', width: 1, alpha: 0.6 }); }
          const yNow = 0.92 - 0.82 * (1 - wound), rNow = rad(wound);
          P.line(rNow, yNow, 1.2, yNow, { color: 'orange', width: 2.4 }); P.dot(rNow, yNow, { r: 6, color: 'gold' });
          P.text('chain to the spring barrel', 1.2, yNow + 0.05, { size: 10.5, color: 'muted', align: 'right' });
          P.text(fS.value ? `fusee radius ${v.fix(rNow / 0.32, 2)} (× the small end)` : 'plain drum: constant radius', 0, 0.02, { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom' });
          // torque curves
          const Mc = [], Rc = [], Dc = [];
          for (let i = 0; i <= 100; i++) { const x = i / 100, w = 1 - x, M = mReal(w, gS.value), r = fS.value ? fuseeR(w) : fuseeR(0.5); Mc.push([x, M]); Rc.push([x, r * 0.4]); Dc.push([x, (M * r) / (fS.value ? 1 : fuseeR(0.5))]); }
          Q.path(Mc, { color: 'orange', width: 2.2 }); Q.path(Rc, { color: 'muted', width: 1.8, dash: [5, 3] }); Q.path(Dc, { color: 'green', width: 3 });
          Q.vline(uS.value, { color: 'gold', width: 1.2, dash: [4, 3] });
        });
        v.legend([['orange', 'spring torque'], ['muted', 'fusee radius (scaled by 0.4)', { dash: [5, 3] }], ['green', 'torque delivered to the train']]);
        v.readout(() => {
          const arr = []; for (let i = 0; i <= 100; i++) { const w = 1 - i / 100; arr.push((mReal(w, gS.value) * (fS.value ? fuseeR(w) : fuseeR(0.5))) / (fS.value ? 1 : fuseeR(0.5))); }
          const hi = Math.max(...arr), lo = Math.min(...arr), spread = (hi - lo) / ((hi + lo) / 2), rate = (Math.sqrt(hi / lo) - 1) * 1440;
          return `torque to the train varies by **${v.fix(100 * spread, 0)}%** from fully wound to run down (spring alone: ${v.fix(100 * (1 - M_EMPTY), 0)}% fall)\nfor a verge clock ($T\\propto\\tau^{-1/2}$, 5.4) that is a rate difference of about **${v.fix(rate, 0)} min/day** between the start and the end of a winding; the fusee's profile $r\\propto1/M$ is cut for an ideal linear spring`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Invention',
      name: 'The pendulum clock (Huygens)',
      credit: 'Christiaan Huygens, 1656 (model made in the last days of December 1656), built by Salomon Coster in The Hague; patent granted by the States General on 16 June 1657; Horologium (1658); the cycloidal cheeks and the theory in Horologium Oscillatorium (1673)',
      verify: true,
      statement: String.raw`A **pendulum clock** regulates a clock train with a swinging pendulum instead of a foliot. The pendulum has a natural period set by its length, $T_0=2\pi\sqrt{L/g}$ (mech-4.4), which does not depend on the driving force; the escapement only gives it a small push each swing to make up its losses and passes on the beats to the train. The drive can change by many percent without changing the rate to first order, which is the great advantage over the verge and foliot (5.4).

What the sources support: Huygens made the first pendulum clock at the very end of 1656, patented it in 1657 and published it in 1658. Galileo had proposed a pendulum regulator in his last years and a clock based on it is attributed to his son Vincenzo, but that did not lead to a working clock. The commonly quoted claim that error fell from about 15 minutes to about 15 seconds a day is a loose secondary figure; sources differ on the accuracy of the first clocks.

The weakness the picture shows: a pendulum is isochronous only for small swings. At amplitude $\theta_0$ the period is $T=T_0\cdot\tfrac2\pi K(\sin^2\tfrac{\theta_0}{2})$ (the *circular error*), and Huygens' answer in 1673 was to hang the bob between **cycloidal cheeks**, so that the bob moves on a cycloid, which is exactly isochronous (mech-5.8).`,
      idea: String.raw`The restoring torque $-mgL\sin\theta$ makes the period depend on amplitude as $T/T_0=1+\theta_0^2/16+\dots$, a loss of $86400\,(1-T_0/T)$ s/day. A path where the restoring force along the path is exactly proportional to the arc length gives exact isochronism; Huygens proved that this path is the cycloid (mech-5.8) and that the evolute of a cycloid is an equal cycloid, so the string, wrapping on cheeks of that shape, lets the bob run on the cycloid with a pendulum of length $L=4a$. Because the drive now changes only the amplitude, and the amplitude barely changes the rate, the clock is far steadier than a verge clock; with a small arc (5.7) the circular error is small even without cheeks.`,
      caption: String.raw`Left: the pendulum swings. Switch the **cycloidal cheeks** on and the string wraps on them. Right: seconds lost per day against amplitude, circular (orange) and cycloidal (green). Set the **amplitude**, then change the **drive**: more driving energy gives a larger swing ($E\propto\theta_0^2$), and the readout compares the resulting rate change with the foliot clock's.`,
      deps: ['tech-5.4', 'mech-4.4', 'mech-5.8'],
      see: ['tech-5.7', 'tech-5.8'],
      refs: ['Usher, “The development of clocks and watches”', 'Mokyr ch. 4', 'Huygens, Horologium Oscillatorium (1673)'],
      tags: ['early-modern', 'timekeeping', 'pendulum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pendulum_clock' },
      viz(v) {
        const A = v.stage({ x: [-0.75, 0.75], y: [-1.12, 0.3], equal: true, axes: false, height: 340, weight: 0.9, minWidth: 280, title: 'pendulum (L = 1 m)' });
        const B = v.stage({ x: [0, 60], y: [0, 2400], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 320, xlabel: 'amplitude $\\theta_0$ (°)', ylabel: 'seconds lost per day', title: 'circular error' });
        const aS = v.slider('amplitude $\\theta_0$ (°)', 1, 60, 20, { step: 0.5 });
        const dS = v.slider('change in driving energy (%)', -30, 30, 0, { step: 1 });
        const cS = v.toggle('cycloidal cheeks', false);
        const W0 = Math.PI; // rad/s for L = g/pi² ≈ 0.994 m
        let S = null;
        const th0eff = () => aS.value * Math.sqrt(Math.max(0.05, 1 + dS.value / 100));
        v.animate((t) => {
          const th0 = Math.min(th0eff(), 85) * D2R, cheeks = cS.value;
          let th;
          if (cheeks) th = Math.asin(Math.sin(th0) * Math.sin(W0 * t)); else {
            if (!S || S.th0 !== th0) S = { th0, sim: v.sim(() => ({ th: th0, w: 0 }), (st, dt) => { st.w += -W0 * W0 * Math.sin(st.th) * dt; st.th += st.w * dt; return st; }, { dt: 0.001 }), th0 };
            S.sim.advance(t); th = S.sim.state.th;
          }
          const L = 1; let bx, by;
          const a = L / 4;
          if (cheeks) {
            const u = 2 * th; bx = a * (u + Math.sin(u)); by = -a * (3 + Math.cos(u));
            const cu = []; const cv = []; const um = Math.min(Math.PI, 2 * th0);
            for (let i = -60; i <= 60; i++) { const w = (i / 60) * Math.PI; const px = a * (w + Math.sin(w)), py = -a * (3 + Math.cos(w)), rho = 4 * a * Math.cos(w / 2); const nx = -Math.sin(w) / (2 * Math.cos(w / 2) + 1e-12), ny = (1 + Math.cos(w)) / (2 * Math.cos(w / 2) + 1e-12); if (Math.abs(w) < 3.0) cu.push([px + rho * nx, py + rho * ny]); }
            A.path(cu, { color: 'orange', width: 3 });
            const cx = (() => { const w = u, rho = 4 * a * Math.cos(w / 2), nx = -Math.sin(w) / (2 * Math.cos(w / 2)), ny = (1 + Math.cos(w)) / (2 * Math.cos(w / 2)); return [bx + rho * nx, by + rho * ny]; })();
            A.line(cx[0], cx[1], bx, by, { color: 'ink', width: 1.8 });
            const arc = []; for (let i = 0; i <= 30; i++) { const w = (Math.sign(u) * Math.abs(u) * i) / 30; const rho = 4 * a * Math.cos(w / 2), nx = -Math.sin(w) / (2 * Math.cos(w / 2)), ny = (1 + Math.cos(w)) / (2 * Math.cos(w / 2)); arc.push([a * (w + Math.sin(w)) + rho * nx, -a * (3 + Math.cos(w)) + rho * ny]); }
            A.line(0, 0, cx[0], cx[1], { color: 'ink', width: 1.8 });
          } else { bx = L * Math.sin(th); by = -L * Math.cos(th); A.line(0, 0, bx, by, { color: 'ink', width: 1.8 }); }
          A.circle(bx, by, 0.045, { fill: 'accent', fillAlpha: 0.7, color: 'accent', width: 2 });
          A.dot(0, 0, { r: 4, color: 'ink' });
          A.line(-0.7, 0, 0.7, 0, { color: 'muted', width: 2 });
          A.line(0, 0, 0, -1.05, { color: 'faint', width: 1, dash: [3, 4] });
          // curves
          const circ = [], cyc = []; for (let x = 0.5; x <= 60; x += 0.5) circ.push([x, lossPerDay(pendulumRatio(x * D2R))]);
          B.path(circ, { color: 'orange', width: 2.4 }); B.line(0, 0, 60, 0, { color: 'green', width: 3 });
          const x0 = aS.value, x1 = th0eff();
          B.dot(x1, cheeks ? 0 : lossPerDay(pendulumRatio(x1 * D2R)), { r: 6, color: 'gold' });
        }, { period: 4, still: 0.37 });
        v.legend([['orange', 'circular pendulum'], ['green', 'cycloidal cheeks'], ['gold', 'now', { dot: true }]]);
        v.readout(() => {
          const x0 = aS.value, x1 = th0eff(), cheeks = cS.value;
          const l0 = cheeks ? 0 : lossPerDay(pendulumRatio(x0 * D2R)), l1 = cheeks ? 0 : lossPerDay(pendulumRatio(x1 * D2R));
          return `amplitude ${v.fix(x1, 1)}° (drive ${dS.value >= 0 ? '+' : ''}${v.fix(dS.value, 0)}%): period ratio $T/T_0=${v.fix(cheeks ? 1 : pendulumRatio(x1 * D2R), 5)}$, losing **${v.fix(l1, 1)} s/day**\nthe drive change moves the rate by **${v.fix(l1 - l0, 1)} s/day**; a verge-and-foliot clock with the same drive change would move by about ${v.fix((Math.sqrt(1 + dS.value / 100) - 1) * 86400, 0)} s/day (5.4, model). $T_0=2\\pi\\sqrt{L/g}$ gives $L=0.994$ m for a 2 s period`;
        });
      },
    },
  ],
};
