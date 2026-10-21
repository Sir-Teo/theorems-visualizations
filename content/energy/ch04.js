// Energy Systems — Chapter 4: Solar energy (items 4.1–4.4; 4.5–4.8 in ch04-b.js, 4.9–4.11 in ch04-c.js, 4.12 in ch04-papers.js)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   4.1 Complete original IAU 2015 Resolution B3 and Kopp–Lean2011 read. Nominal conversion values are distinct from measured solar-minimum TSI.
//     source-audit-solar.shared.js computes Planck spectra/fractions and an explicitly chosen attenuation toy; no measured spectral data or fitted atmospheric constants.
//   4.2 NOAA authored solar-position note read in full for local vector geometry. Sinusoidal declination, fixed1au and optical depth0.25 are declared choices.
//     source-audit-solar-geometry.shared.js evaluates all365days at the actual tilt; optimum markers use a disclosed3degree grid.
//   4.3 Single-diode cell with ILLUSTRATIVE silicon-like numbers (Jsc 40 mA/cm2 at 1 sun, J0 about 1e-12 A/cm2); nothing here is a measurement of a device.
//   4.4 Green's empirical ideal fill factor FF0 = (v - ln(v + 0.72))/(v + 1), v = Voc/(n kT/q): M. A. Green, Solid-State Electronics 24 (1981), 788–789;
//     formula and original attribution checked in PVEducation (https://www.pveducation.org/pvcdrom/solar-cell-operation/fill-factor), 2026-10-16.

import { clamp, S0, T_SUN, KB, cell, ivCurve, ffGreen } from './ch04.shared.js';

import {solarSpectrumAudit as specSun,solarPowerAudit,solarFractionAudit,solarTransmissionAudit as airT} from './source-audit-solar.shared.js';
import {SOLAR_RAD_AUDIT as RAD,solarDeclinationAudit as decl,solarPositionAudit as sunPos,solarIncidenceAudit as cosInc,solarDayEnergyAudit as dayEnergy,solarYearEnergyAudit as yearEnergy} from './source-audit-solar-geometry.shared.js';

const MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateLabel = (n) => { let d = Math.round(n), m = 0; while (m < 11 && d > MONTHS[m]) { d -= MONTHS[m]; m++; } return `${d} ${MN[m]}`; };


export default {
  collection: 'energy',
  chapter: 4,
  title: 'Solar energy',
  summary: String.raw`The Sun delivers about a kilowatt per square metre at noon, with a spectrum close to that of a 5800 K blackbody, but the average a panel sees depends on latitude, tilt and weather. Photovoltaic cells convert sunlight with a semiconductor junction; a single band gap can capture at most about a third of the energy — the Shockley–Queisser limit — and practical issues such as temperature, shading and maximum-power tracking set real performance. Concentration and multiple junctions push beyond.`,
  items: [
    // ───────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'The solar spectrum and the solar constant',
      statement: String.raw`A blackbody Sun with nominal IAU temperature $T_\odot^{\rm N}=5772$ K and radius $R_\odot^{\rm N}=6.957\times10^8$ m gives, at one astronomical unit,
$$S_{\rm model}=\sigma T^4(R/d)^2\approx1361.16\ \mathrm{W/m^2}.$$
Planck's wavelength spectrum peaks near 502 nm. In this **blackbody model**, about 71.8% of the power is below 1 µm, 12.2% below 400 nm and 36.6% between 400 and 700 nm. These fractions describe the model, not a measured solar spectrum.

The IAU's nominal irradiance $S_\odot^{\rm N}=1361$ W/m² is a separately defined exact conversion constant; nominal values are not exact measurements of the Sun. Kopp and Lean (2011) reported $1360.8\pm0.5$ W/m² for the **2008 solar minimum**, supported by SORCE/TIM observations and radiometric laboratory comparisons. TSI varies with solar activity; their monthly means changed by roughly 0.12% between recent minima and maxima.`,
      idea: String.raw`Planck's law (qm-1.1) gives the spectrum of an ideal thermal emitter. Its wavelength integral is $\sigma T^4$, and spreading the luminosity over a sphere dilutes the flux by $(R/d)^2$. Separately rounded nominal radius and temperature need not reproduce the independently defined nominal irradiance exactly. Wien's law controls the peak; integrating the spectrum, rather than estimating from its peak, determines the power fractions. A selective-attenuation toy illustrates how a path can remove different wavelengths unequally, without claiming to reconstruct actual air or solar absorption lines.`,
      caption: String.raw`Change the temperature to move the blackbody peak and scale its total area as $T^4$; the grey reference remains at 5772 K. The shaded strip is 400–700 nm. The right curve integrates the **unattenuated blackbody** from zero wavelength to the chosen wavelength. The optional **chosen attenuation** uses positive optical depths: a blue-weighted term and illustrative bands. All band centers, widths and strengths are choices; the transmitted curve is not measured or fitted atmospheric data.`,
      deps: ['qm-1.1'],
      refs: ['IAU 2015 Resolution B3, complete original recommendations, explanation and notes', 'Kopp & Lean, Geophys. Res. Lett.38, L01706 (2011), complete original paper', 'Planck integral and spectral fractions independently derived and numerically checked'],
      tags: ['solar', 'spectrum', 'blackbody'],
      scope: String.raw`An ideal blackbody at fixed nominal solar radius and 1 au, with temperature varied as a model input. The real solar spectral irradiance is not plotted. IAU nominal constants are exact unit conversions chosen near estimates, not exact present-day solar properties; the specific Kopp–Lean value is historical solar-minimum TSI, not a universal fixed measurement. The optional attenuation curve is exp(−AM×τλ), with chosen blue-weighted, broad ultraviolet and band terms; their species labels indicate intended qualitative absorbers, without a line database, calibrated transmission, scattering radiative transfer or diffuse sky contribution. Cumulative fractions always refer to the unattenuated model.`,
      credit: 'IAU 2015 nominal constants; Kopp & Lean 2011 historical solar-minimum measurement',
      links: {nominal:'https://www.iau.org/common/Uploaded%20files/IAUGA2015-Resolution-B3-recommended-nominal-conversion.pdf',measurement:'https://doi.org/10.1029/2010GL045777'},
      verify: false,
      viz(v) {
        const Tsl = v.slider('solar temperature $T$ (K)', 4000, 7500, 5772, { step: 1 });
        const view = v.select('view', [{ value: 'space', label: 'above the atmosphere' }, { value: 'air', label: 'chosen attenuation (illustrative)' }], 'space');
        const AM = v.slider('air mass', 1, 5, 1.5, { step: 0.1 });
        const S = v.stage({ x: [200, 2500], y: [0, 2.4], axes: 'box', gutter: {r:24}, height: 340, weight: 1.5, minWidth: 300, xlabel: 'wavelength (nm)', ylabel: 'spectral irradiance (W m⁻² nm⁻¹)', title: 'sunlight at 1 au' });
        const C = v.stage({ x: [100, 4000], y: [-.05, 1.05], axes: 'box', gutter: {r:24}, height: 340, weight: 1, minWidth: 260, xlabel: 'wavelength (nm)', ylabel: 'fraction of power below λ', title: 'where the power is', yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        let st = null;
        v.render(() => {
          const T = Tsl.value, air = view.value === 'air';
          AM.el.hidden = !air;
          const f = (nm) => specSun(nm, T), g = (nm) => f(nm) * airT(nm, AM.value);
          const peak=f(2.897771955e6/T),top=Math.max(peak,specSun(2.897771955e6/T_SUN,T_SUN))*1.12;
          S.setView([200, 2500], [0, top]);
          S.vband(400, 700, { color: 'muted', alpha: 0.12 });
          S.fn(f, { domain: [200, 2500], color: 'gold', fill: true, fillAlpha: air ? 0.12 : 0.28, width: 2.2, n: 500 });
          S.fn((nm) => specSun(nm, T_SUN), { domain: [200, 2500], color: 'muted', width: 1.2, dash: [5, 4], n: 300 });
          if (air) {
            S.fn(g, { domain: [200, 2500], color: 'accent', fill: true, fillAlpha: 0.35, width: 2, n: 1200 });
            const labels=S.width<500?[[760,0,0,'O₂'],[1380,0,0,'H₂O'],[1870,0,0,'H₂O'],[2010,0,0,'CO₂']]:[[760,0,0,'O₂'],[940,0,0,'H₂O'],[1130,0,0,'H₂O'],[1380,0,0,'H₂O'],[1870,0,0,'H₂O'],[2010,0,0,'CO₂']];
            for (const [c, , , lab] of labels) {
              if (c === 2010) S.text(lab, 2100, top * 0.2, { size: 11, color: 'muted', align: 'left' }); else S.text(lab, c, top * 0.93 - (c > 1000 ? 0.0 : 0), { size: 11, color: 'muted', align: 'center', dy: c === 760 ? 0 : 0 });
            }
            S.text('O₃ edge', 205, top * 0.62, { size: 11, color: 'muted', align: 'left', plate: true });
          }
          S.vline(2897771.955 / T, { color: 'orange', width: 1.2, dash: [3, 3] });
          S.text(`Wien peak ${v.fix(2897771.955 / T, 0)} nm`, 2897771.955 / T, top * 0.2, { dx: 6, align: 'left', size: 11.5, color: 'orange', weight: 600 });
          S.text('visible', 550, top * 0.04, { align: 'center', size: 11, color: 'muted' });
          const cum=nm=>solarFractionAudit(nm,T);
          C.fn(cum, { domain: [100, 4000], color: 'gold', width: 2.4, n: 400 });
          C.vband(400, 700, { color: 'muted', alpha: 0.12 });
          const uv = cum(400), vis = cum(700) - cum(400);
          C.dot(400, uv, { r: 4, color: 'purple' }); C.dot(700, cum(700), { r: 4, color: 'green' });
          C.textPx(`${v.fix(100*uv,1)}% below 400 nm`,C.X(400)+8,C.Y(uv)-14,{align:'left',size:11,color:'purple',weight:600});
          C.textPx(`${v.fix(100*cum(700),1)}% below 700 nm`,C.X(700)+8,C.Y(cum(700))+14,{align:'left',size:11,color:'green',weight:600});
          const total=solarPowerAudit(T);
          let ground = null;
          if (air) { let s2 = 0; const dl = 5; for (let nm = 200; nm < 2500; nm += dl) s2 += g(nm + dl / 2) * dl; let s1 = 0; for (let nm = 200; nm < 2500; nm += dl) s1 += f(nm + dl / 2) * dl; ground = { s2, s1 }; }
          st = { T, total, uv, vis, belowMicron:cum(1000),ground,air };
        });
        v.legend([['gold', 'blackbody Sun at the chosen $T$'], ['muted', '5772 K (nominal)', { dash: true }], ['accent','after chosen attenuation',{area:true}]]);
        v.readout(() => {
          if (!st) return '';
          const { T, total, uv, vis, belowMicron, ground, air } = st;
          return `$T=${v.fix(T, 0)}$ K: $S=\\sigma T^4(R_\\odot/d)^2=$ **${v.fix(total, 0)} W/m²** (Wien peak ${v.fix(2897771.955 / T, 0)} nm) · below 400 nm ${v.fix(100 * uv, 1)}%, visible ${v.fix(100 * vis, 1)}%, beyond 700 nm ${v.fix(100*(1-uv-vis),1)}%; below 1 µm ${v.fix(100*belowMicron,1)}%. These are blackbody-model fractions.` +
            (T === 5772 ? ` · historical 2008 solar-minimum measurement: $1360.8\\pm0.5$ W/m² (Kopp & Lean 2011)` : '') +
            (air && ground ? `\nBetween 200 and 2500 nm the chosen attenuation path (air-mass parameter ${v.fix(AM.value, 1)}) passes ${v.fix(100 * ground.s2 / ground.s1, 0)}% of this model beam's power. The notch parameters are choices, not measured atmospheric data.` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.2
    {
      num:'4.2',kind:'Model',name:'Solar geometry: insolation, latitude and tilt',
      statement:String.raw`Choose a teaching model with declination
$$\delta=23.44^\circ\sin\!\left(\frac{2\pi(n-81)}{365}\right)$$
and hour angle $\omega=15^\circ(t-12\,\mathrm h)$ in **solar time**. The local Sun vector gives
$$\begin{aligned}\sin\alpha&=\sin\varphi\sin\delta\\&\quad+\cos\varphi\cos\delta\cos\omega.\end{aligned}$$
For an equator-facing panel, let $s=1$ at or north of the equator and $s=-1$ south of it, and $q=|\varphi|-\beta$. Its front collects the positive part of
$$\begin{aligned}\cos\theta&=\sin(s\delta)\sin q\\&\quad+\cos\delta\cos q\cos\omega.\end{aligned}$$
The daily energy integrates this projection during daylight. The optional attenuation is the **chosen** plane-parallel toy $I=I_0\exp[-0.25/\sin\alpha]$, with fixed $I_0\approx1361.16$ W/m². It is not a calibrated clear-sky or site-weather prediction.`,
      idea:String.raw`Resolve a unit solar direction into east, north and up components. Its dot product with the local vertical gives $\sin\alpha$; its dot product with the panel normal gives $\cos\theta$. The panel normal is tilted toward the equator, so its north component changes sign across hemispheres. At noon the projection is $\cos(|\varphi|-\beta-s\delta)$: normal incidence requires $\beta=|\varphi|-s\delta$, and this is available only when that tilt lies between 0° and 90° and the Sun is above the horizon. The daily optimum weighs every daylight hour, rather than noon alone. An annual comparison must then average all the daily energies at the same selected tilt.

The dot-product projection identity (vcalc-1.2) converts geometry into intercepted beam power: for unit Sun direction $u$ and unit panel normal $n$, $u\cdot n=\cos\theta$. Multiplication by panel area and beam irradiance gives incident power only on the front when this projection is positive and the Sun is above the horizon. Expanding the same dot product with the vertical gives $\sin\alpha$; integrating the positive panel projection gives daily energy.`,
      caption:String.raw`The polar sky map places the zenith at the centre and the horizon on the outer circle. Grey paths are reference days 81, 172 and 355; orange is the selected day and gold is the Sun at the selected solar hour. The energy curves sample tilts every 3°: blue is the chosen day's total, green the mean of all 365 days. Rings mark the maxima **on that grid**. Gold dots evaluate your actual selected tilt, including its yearly mean. Switching attenuation off leaves the geometric projection at fixed source irradiance.`,
      deps:['energy-4.1', 'vcalc-1.2'],refs:['NOAA Global Monitoring Division, General Solar Position Calculations, complete two-page authored note: local zenith and azimuth geometry','Independent solar-vector dot products and daily/annual energy integrals; explicit sinusoidal-declination and optical-depth choices'],
      links:{geometry:'https://gml.noaa.gov/grad/solcalc/solareqns.PDF'},tags:['solar','geometry','insolation'],verify: false,
      scope:String.raw`An equator-facing fixed plane with 0–90° tilt, a declared sinusoidal declination and fixed 1 au blackbody source. This is not NOAA's full ephemeris: its harmonic declination, equation of time, civil-time conversion and sunrise refraction correction are not implemented. The chosen plane-parallel attenuation neglects curvature, refraction, scattering, diffuse sky, clouds, shading, distance variation and tracking; its near-horizon path length is schematic. The annual mean includes all 365 model days. Displayed optimum rings are a 3° search grid; selected-tilt readouts use that tilt itself. The no-air daily integral is analytic; attenuated days use 160 midpoint samples over the daylight/front-facing interval.`,
      viz(v){
        const lat=v.slider('latitude $\\varphi$ (°)',-60,70,40,{step:1}),day=v.slider('day of year',1,365,172,{step:1,int:true,fmt:x=>dateLabel(x)}),tilt=v.slider('panel tilt $\\beta$ (°)',0,90,40,{step:1}),hour=v.slider('hour (solar time)',0,24,12,{step:.1}),atm=v.toggle('chosen attenuation (off: pure geometry)',true);
        const sky=v.stage({x:[-108,108],y:[-108,108],equal:true,axes:false,height:350,weight:1,minWidth:280,title:'sky map: zenith at the centre'}),E=v.stage({x:[-5,95],y:[-1,12],axes:'box',gutter:{r:24},height:350,weight:1.15,minWidth:280,xlabel:'panel tilt β (°)',ylabel:'kWh m⁻² per day',title:'energy on the panel'});
        let annKey='',ann=null,annAt=new Map(),st=null;
        const path=(phi,n)=>{const pts=[];for(let h=0;h<=24.001;h+=.1){const p=sunPos(phi,n,h);pts.push(p.alt>0?[(90-p.alt)*Math.sin(p.az*RAD),(90-p.alt)*Math.cos(p.az*RAD)]:null);}return pts;};
        v.render(()=>{
          const phi=lat.value,n=day.value,b=tilt.value,A=atm.value;
          for(const r of[30,60,90])sky.circle(0,0,r,{color:'grid',width:r===90?1.6:1});
          for(let a=0;a<360;a+=45)sky.line(0,0,90*Math.sin(a*RAD),90*Math.cos(a*RAD),{color:'grid',width:.8});
          for(const[t,x,y]of[['N',0,99],['E',99,0],['S',0,-99],['W',-99,0]])sky.text(t,x,y,{size:12,weight:700,color:'muted',align:'center',baseline:'middle'});
          sky.text('alt 60°',0,-30,{size:10,color:'muted',dy:9});sky.text('alt 30°',0,-60,{size:10,color:'muted',dy:9});sky.text('horizon',63,-78,{size:10,color:'muted',align:'center'});
          for(const d of[172,81,355])sky.path(path(phi,d),{color:'muted',width:1,alpha:.6});sky.path(path(phi,n),{color:'orange',width:3});
          const sp=sunPos(phi,n,hour.value);if(sp.alt>0)sky.dot((90-sp.alt)*Math.sin(sp.az*RAD),(90-sp.alt)*Math.cos(sp.az*RAD),{r:8,color:'gold'});
          const key=`${phi}|${A}`;
          if(key!==annKey){annKey=key;ann=[];annAt=new Map();for(let bb=0;bb<=90;bb+=3){const e=yearEnergy(phi,bb,A);ann.push([bb,e]);annAt.set(bb,e);}}
          if(!annAt.has(b))annAt.set(b,yearEnergy(phi,b,A));const annNow=annAt.get(b),cur=[];for(let bb=0;bb<=90;bb+=3)cur.push([bb,dayEnergy(phi,n,bb,A)]);
          const eNow=dayEnergy(phi,n,b,A),mx=Math.max(eNow,annNow,...cur.map(p=>p[1]),...ann.map(p=>p[1])),top=Math.max(2,Math.ceil(mx*1.12));E.setView([-5,95],[-.08*top,top]);
          E.vline(Math.abs(phi),{color:'faint',width:1.2,dash:[4,4]});E.text(`|φ| = ${v.fix(Math.abs(phi),0)}°`,Math.abs(phi),0,{dx:5,dy:-8,align:'left',size:11,color:'muted'});
          E.path(cur,{color:'accent',width:2.4});E.path(ann,{color:'green',width:2.4});
          const bc=cur.reduce((a,p)=>p[1]>a[1]?p:a),ba=ann.reduce((a,p)=>p[1]>a[1]?p:a);E.dot(bc[0],bc[1],{r:6,color:'accent',hollow:true});E.dot(ba[0],ba[1],{r:6,color:'green',hollow:true});E.dot(b,eNow,{r:7,color:'gold'});E.dot(b,annNow,{r:4,color:'gold'});
          st={phi,n,b,eNow,bc,ba,annNow,eHor:dayEnergy(phi,n,0,A),c:cosInc(phi,n,hour.value,b),alt:sp.alt,d:decl(n)};
        });
        v.legend([['accent','chosen day'],['green','mean of 365 days'],['gold','actual selected tilt / current Sun'],['orange','selected sun path'],['muted','reference dates']]);
        v.readout(()=>{
          if(!st)return'';const{phi,n,b,eNow,bc,ba,annNow,eHor,c,alt,d}=st,noonAlt=90-Math.abs(phi-d),normal=Math.abs(phi)-(phi<0?-d:d);
          const normalText=noonAlt<=0?'The noon Sun is below the horizon.':normal>=0&&normal<=90?`Noon-normal equator-facing tilt ${v.fix(normal,1)}°.`:`The noon-normal tilt ${v.fix(normal,1)}° lies outside the available 0–90° range.`;
          return `${dateLabel(n)}: declination $\\delta=${v.fix(d,1)}^\\circ$ · noon altitude ${v.fix(noonAlt,1)}° · tilt ${v.fix(b,0)}°: **${v.fix(eNow,2)} kWh/m²** that day (flat: ${v.fix(eHor,2)}). ${bc[1]>1e-10?`Day maximum on the 3° grid: ${v.fix(bc[0],0)}°.`:'There is no beam energy at any tilt that day.'} ${normalText}\nYear maximum on the 3° grid: ${v.fix(ba[0],0)}°; yearly mean at your tilt ${v.fix(annNow,2)} kWh/m² per day, averaging all 365 days.\n`+(alt>0?`At this hour the Sun is ${v.fix(alt,1)}° above the horizon and $\\cos\\theta=${v.fix(c,2)}$${c<=0?'; the panel front receives no beam':''}.`:'The Sun is below the horizon at this hour.');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'The photovoltaic cell: an illuminated diode',
      statement: String.raw`A solar cell is a p–n junction (cm-4.7) whose current is shifted by the photogenerated current $J_{ph}$, proportional to the light intensity. In the single-diode model
$$J(V)=J_{ph}-J_0\Big(e^{\,qV/nkT}-1\Big),$$
(with series and shunt resistances adding $V\to V+JR_s$ and a leak $-(V+JR_s)/R_{sh}$). The **short-circuit current** is $J_{sc}\approx J_{ph}$, and the **open-circuit voltage** is
$$V_{oc}=\frac{nkT}{q}\ln\!\Big(\frac{J_{ph}}{J_0}+1\Big),$$
which grows only logarithmically with illumination (about $60n$ mV per decade at room temperature) while $J_{sc}$ grows linearly.

Scope: one junction with a single exponential dark characteristic; for $V>0$ and $J>0$ the cell delivers power. Real devices add recombination in the depletion region ($n\to2$), resistive losses and non-ideal collection.`,
      idea: String.raw`In the dark the cell is a diode (cm-4.8, circ-4.1): $J_{dark}=-J_0(e^{qV/nkT}-1)$. Light creates electron–hole pairs that the junction field sweeps apart, adding a voltage-independent current $J_{ph}$ in the reverse direction, so the illuminated curve is the dark curve lifted by $J_{ph}$ — the superposition principle for a linear photocurrent. The curve now dips into the fourth quadrant, where $V>0$ and current flows out, and there the diode delivers power. Setting $J=0$ gives $V_{oc}$: the voltage at which the diode's forward current exactly cancels the light current. That the voltage depends only on the logarithm of the light is why cells keep working in dim light, and why $J_0$ (recombination) controls the voltage.`,
      caption: String.raw`The solid curve is the illuminated cell, drawn with current out of the cell positive; the dashed curve is the same diode in the dark. Slide the **light intensity**: the whole curve rises by $J_{ph}$ and $V_{oc}$ creeps up. Change $J_0$ (a worse junction recombines more) or the ideality factor $n$ and see the voltage fall. The right panel shows $V_{oc}$ against light on a log axis: a straight line of slope $nkT\ln10/q$ per decade. “Real” turns on a series and a shunt resistance. **All parameters are illustrative.**`,
      deps: ['circ-4.1', 'cm-4.7'],
      refs: ['Tester ch. 13'],
      tags: ['photovoltaics', 'diode', 'junction'],
      scope: String.raw`Single-diode model, one sun $\approx 100$ mW/cm$^2$; parameters here are silicon-like but illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theory_of_solar_cells' },
      viz(v) {
        const suns = v.slider('light intensity (suns)', 0.01, 10, 1, { log: true, sig: 2 });
        const lj0 = v.slider('$\\log_{10}J_0$ (A/cm²)', -14, -8, -12, { step: 0.1 });
        const nn = v.slider('ideality factor $n$', 1, 2, 1, { step: 0.05 });
        const TC = v.slider('cell temperature (°C)', 0, 80, 25, { step: 1 });
        const real = v.select('parasitics', [{ value: '0', label: 'ideal' }, { value: '1', label: 'real ($R_s$, $R_{sh}$)' }], '0');
        const S = v.stage({ x: [-0.15, 0.85], y: [-14, 50], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'voltage V (V)', ylabel: 'current density out of the cell (mA/cm²)', title: 'current–voltage curve' });
        const R = v.stage({ x: [0.01, 10], xlog: true, y: [0.3, 0.9], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'light intensity (suns)', ylabel: 'open-circuit voltage (V)', title: 'open-circuit voltage against log(light)' });
        let st = null;
        const mk = (s) => cell({ suns: s, T: TC.value + 273.15, j0ref: 10 ** lj0.value, n: nn.value, rs: real.value === '1' ? 1.2 : 0, rsh: real.value === '1' ? 800 : Infinity });
        v.render(() => {
          const c = mk(suns.value), dark = mk(0);
          S.hline(0, { color: 'ink', width: 1 }); S.vline(0, { color: 'ink', width: 1 });
          S.path(ivCurve(dark, -0.15, 0.85, 120).map(([V, J]) => [V, J]), { color: 'muted', width: 2, dash: [6, 4] });
          const cv = ivCurve(c, -0.15, 0.85, 160);
          S.path(cv, { color: 'accent', width: 3 });
          const voc = c.voc(), jsc = c.jsc();
          S.arrow(0.25, dark.J(0.25), 0.25, c.J(0.25), { color: 'orange', width: 1.8 });
          S.text('shift by $J_{ph}$', 0.25, 0.5 * (c.J(0.25) + dark.J(0.25)), { dx: 8, align: 'left', size: 11.5, color: 'orange', plate: true });
          S.dot(0, jsc, { r: 6, color: 'green', label: '$J_{sc}$', labelPos: 'ne' });
          S.dot(voc, 0, { r: 6, color: 'red', label: '$V_{oc}$', labelPos: 'ne' });
          // Voc vs suns
          const vocAt = (s) => mk(s).voc();
          const lo = vocAt(0.01), hi = vocAt(10);
          R.setView([0.01, 10], [Math.max(0, lo - 0.05), hi + 0.06]);
          R.fn((x) => vocAt(x), { domain: [0.01, 10], color: 'red', width: 2.6, n: 40 });
          R.dot(suns.value, voc, { r: 7, color: 'gold' });
          const a = nn.value * KB * (TC.value + 273.15);
          st = { c, voc, jsc, slope: a * Math.LN10, pm: c.pmax() };
        });
        v.legend([['accent', 'illuminated'], ['muted', 'dark', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, voc, jsc, slope, pm } = st;
          const formula = (c.a * Math.log(c.jph / c.j0 + 1));
          return `$J_{sc}=${v.fix(jsc, 1)}$ mA/cm² · $V_{oc}=${v.fix(voc, 3)}$ V (formula $\\tfrac{nkT}{q}\\ln(J_{ph}/J_0+1)=${v.fix(formula, 3)}$ V${c.rs ? ', which ignores the leaks' : ''}) · slope ${v.fix(1000 * slope, 0)} mV per decade of light · maximum power ${v.fix(pm.P, 1)} mW/cm² (efficiency ${v.fix((100 * pm.P) / (100 * suns.value), 1)}% of ${v.fix(100 * suns.value, 0)} mW/cm²)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Maximum power point and fill factor',
      statement: String.raw`A cell connected to a load operates at a point $(V,J)$ on its illuminated characteristic and delivers power density $P=VJ$. The **maximum power point** $(V_{mp},J_{mp})$ maximises $P$, i.e. $d(VJ)/dV=0$, equivalently $dJ/dV=-J/V$ (the slope of the curve equals minus that of the line from the origin). The **fill factor** is the dimensionless squareness of the curve,
$$FF=\frac{V_{mp}J_{mp}}{V_{oc}J_{sc}},\qquad \eta=\frac{V_{oc}J_{sc}FF}{P_{in}}.$$
For an ideal diode $FF$ depends only on $v_{oc}=qV_{oc}/nkT$ and rises toward 1 as $v_{oc}$ grows; series resistance lowers it.

Scope: single-diode cell under constant illumination; $0<FF<1$, and for good silicon cells $FF\approx0.8$.`,
      idea: String.raw`Along the curve the product $VJ$ starts at zero (short circuit), ends at zero (open circuit) and is positive in between, so it has a maximum; where it occurs the load line through the origin is tangent to a level set of $P$. The same extremum problem appears in circ-3.5 for a linear source, where matching the load to the source resistance is optimal; here the source is nonlinear, so the matching load is $R_{mp}=V_{mp}/J_{mp}$ at one particular intensity — and moves when the light changes (energy-4.7). Because the exponential is so steep, the knee of the curve is sharp and the fill factor sits near 0.8 even though $V_{mp}$ is only about 85 % of $V_{oc}$.

Existence and stationarity are separate steps. On the compact operating interval $[0,V_{oc}]$, continuous power attains its maximum by the extreme value theorem (pma-4.16). With positive illumination it is positive at an interior voltage and zero at both endpoints, so the maximum is interior. For a differentiable characteristic the interior-extremum theorem (pma-5.8) then gives $P'=J+VJ'=0$. This necessary equation alone does not establish uniqueness for an arbitrary cell or shaded module.`,
      caption: String.raw`Drag the **gold operating point** along the I–V curve (left): the orange rectangle $V\times J$ is the power delivered, the dashed one is $V_{oc}\times J_{sc}$, and the fill factor is the ratio of the green maximum rectangle to the dashed one. The right panel shows the same power as a curve in $V$. Switch on **series resistance** and the knee rounds off, the fill factor falls and the load that extracts the most power changes. The line from the origin through the point is the load resistance $V/J$.`,
      deps: ['energy-4.3', 'circ-3.5', 'pma-4.16', 'pma-5.8'],
      refs: ['Green (1981), Solar cell fill factors: General graph and empirical expressions, Solid-State Electronics 24:788–789', 'PVEducation, Fill Factor; https://www.pveducation.org/pvcdrom/solar-cell-operation/fill-factor', 'Tester ch. 13'],
      tags: ['photovoltaics', 'fill factor', 'power'],
      scope: String.raw`Single-diode silicon-like cell, one sun, illustrative parameters.`,
      credit: 'Fill-factor expression: M. A. Green, 1981',
      viz(v) {
        const rs = v.select('series resistance $R_s$', [{ value: '0', label: '0' }, { value: '1', label: '1 Ω cm²' }, { value: '3', label: '3 Ω cm²' }, { value: '6', label: '6 Ω cm²' }], '0');
        const suns = v.slider('light intensity (suns)', 0.1, 5, 1, { log: true, sig: 2 });
        const ll = v.toggle('show load lines', true);
        const S = v.stage({ x: [0, 0.8], y: [0, 50], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 290, xlabel: 'voltage V (V)', ylabel: 'current density J (mA/cm²)', title: 'operating point' });
        const P = v.stage({ x: [0, 0.8], y: [0, 28], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: 'power density (mW/cm²)', title: 'power curve' });
        const mk = () => cell({ suns: suns.value, T: 298.15, j0ref: 1e-12, n: 1, rs: Number(rs.value), rsh: 2000 });
        let c = mk();
        const h = S.handle(0.45, 30, { color: 'gold', r: 8, constrain: (x) => { const V = clamp(x, 0.005, c.voc() - 0.002); return [V, c.J(V)]; } });
        let st = null;
        v.render(() => {
          c = mk();
          const voc = c.voc(), jsc = c.jsc(), mp = c.pmax();
          S.setView([0, 0.8], [0, Math.max(10, Math.ceil((jsc * 1.1) / 5) * 5)]);
          P.setView([0, 0.8], [0, Math.max(5, Math.ceil((mp.P * 1.3) / 2) * 2)]);
          const V = clamp(h.x, 0.005, voc - 0.002), J = c.J(V);
          h.set(V, J);
          S.rect(0, 0, voc, jsc, { color: 'muted', stroke: true, fill: false, dash: [5, 4], width: 1.3 });
          S.rect(0, 0, mp.V, mp.J, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.6 });
          S.rect(0, 0, V, J, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 2 });
          S.path(ivCurve(c, 0, voc, 160), { color: 'accent', width: 3 });
          if (ll.value) {
            const tail = (V1, J1, col) => S.line(0, 0, V1 * 1.3, J1 * 1.3, { color: col, width: 1.2, dash: [4, 4] });
            tail(mp.V, mp.J, 'green'); tail(V, J, 'orange');
          }
          S.dot(mp.V, mp.J, { r: 6, color: 'green', hollow: true });
          S.text('$J_{sc}V_{oc}$', voc, jsc, { dx: 6, dy: -2, align: 'left', size: 11, color: 'muted' });
          P.path(ivCurve(c, 0, voc, 160).map(([vv, jj]) => [vv, vv * jj]), { color: 'accent', width: 3 });
          P.hline(voc * jsc, { color: 'muted', width: 1, dash: [5, 4] });
          P.dot(mp.V, mp.P, { r: 6, color: 'green', hollow: true });
          P.dot(V, V * J, { r: 8, color: 'gold' });
          const v0 = voc / c.a;
          st = { V, J, voc, jsc, mp, FF: mp.P / (voc * jsc), Pin: 100 * suns.value, ffG: ffGreen(v0), v0 };
        });
        v.legend([['orange', 'power at your load', { area: true }], ['green', 'maximum power', { area: true }], ['muted', '$V_{oc}\\times J_{sc}$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { V, J, voc, jsc, mp, FF, Pin, ffG, v0 } = st;
          return `Your load: $V=${v.fix(V, 3)}$ V, $J=${v.fix(J, 1)}$ mA/cm², $P=${v.fix(V * J, 2)}$ mW/cm² (${v.fix((100 * V * J) / mp.P, 0)}% of the maximum), $R=V/J=${v.fix((1000 * V) / J, 1)}\\ \\Omega\\,\\text{cm}^2$ · maximum power point $V_{mp}=${v.fix(mp.V, 3)}$ V ($${v.fix((100 * mp.V) / voc, 0)}\\%$ of $V_{oc}$), $P_{mp}=${v.fix(mp.P, 2)}$ → **FF = ${v.fix(FF, 3)}**, efficiency ${v.fix((100 * mp.P) / Pin, 1)}%\nIdeal-diode fill factor from the empirical formula with $v_{oc}=${v.fix(v0, 1)}$: ${v.fix(ffG, 3)} ${rs.value === '0' ? '(the model here has a small shunt leak)' : '— series resistance has lowered it'}.`;
        });
      },
    },
  ],
};
