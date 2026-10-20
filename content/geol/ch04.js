// Geology & Geophysics — Chapter 4: Heat flow, the cooling lithosphere and mantle convection (part a: 4.1–4.5)
//
// Sources checked / provenance (Oct 2026):
//   4.1–4.2: complete relevant DOE1992 rectangular/composite conduction pp6–11,
//        Davies–Davies2010 estimation/results/uncertainty and Table7, and Sass–Jaeger–Munroe1976
//        primary heat-flow/production discussion and full geotherm treatment pp51–67 read.
//        Lithologies, conductivities, synthetic province and 35km datum are chosen examples.
//        See docs/verification/geol-continental-followup.md for scope, hashes and checks.
//   4.3–4.5: complete relevant primary derivations read in Parsons & Sclater1977 pp804–809,
//        Eqs21–23 pp819–820 and Appendix1 pp823–824; Stein & Stein1992 pp123–126,
//        including the printed GDH1 depth/heat formulas. Models and chosen age-area distribution
//        are distinguished from published reference fits and raw observations. Full evidence,
//        hashes and numerical references are in docs/verification/geol-cooling-followup.md.

import { MYR, KAPPA, halfSpaceQ, halfSpaceSubs } from './ch04.shared.js';

import * as HC from './cooling-audit.shared.js';
import * as CT from './continental-audit.shared.js';

const T0C = 10; // mean surface temperature used in the continental pictures (°C)

export default {
  collection: 'geol',
  chapter: 4,
  title: 'Heat flow, the cooling lithosphere and mantle convection',
  summary: String.raw`Davies and Davies (2010) estimate Earth’s surface heat loss at 47 ± 2 terawatts. On the continents radiogenic heat shapes the geotherm; in the oceans, the lithosphere is a thermal boundary layer that thickens as it cools, so ocean depth grows as the square root of age and heat flow falls as its inverse. Underneath, the mantle convects at a Rayleigh number in the millions, with plumes rising from the deep and melting by decompression feeding volcanoes.`,
  items: [
    // ───────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Law',
      name: 'Fourier’s law and the conductive geotherm',
      statement: String.raw`Heat conducted through a solid flows down the temperature gradient and is proportional to it: $\mathbf q=-k\nabla T$, with $k$ the thermal conductivity (W m$^{-1}$ K$^{-1}$). In steady state, with no heat sources, let $z$ increase downward and $q$ denote the upward flux magnitude. In a one-dimensional column $q$ is constant, so $dT/dz=q/k(z)$: the temperature rises linearly in each layer, steeply in poor conductors and gently in good ones. Measuring $dT/dz$ in a borehole and $k$ on the core gives the surface heat flow $q=k\,dT/dz$.`,
      idea: String.raw`The model assumes a local isotropic conductivity and ideal thermal contact. Combined with energy conservation, $\nabla\cdot\mathbf q=0$ in steady state without sources, it forces $q$ to be constant down a one-dimensional column, so a change of rock type changes the gradient but never the flux. With ideal thermal contact, temperature is continuous at an interface, while its derivative changes inversely with conductivity. Thermal resistance adds as $\sum h_i/k_i$; the constant upward heat flux is distinct from the layer-dependent gradient. Integrating $T_z=q/k_i$ across each constant-conductivity layer by the fundamental theorem (pma 6.21) gives $\Delta T_i=qh_i/k_i$. Adding the continuous temperature drops gives the stated sum of thermal resistances.`,
      caption: String.raw`Drag the **probe** up and down the borehole (left panel) and change the surface heat flow $q$. The middle panel shows the gradient $dT/dz$ in each layer, the right panel the flux $k\,dT/dz$: the gradient jumps at each contact while the flux stays a single value. Switch to the uniform column and the temperature becomes one straight line. Rock names and conductivities are chosen examples, not measurements from a real borehole.`,
      deps: ['thermo-7.3', 'pma-6.21'],
      refs: ['DOE-HDBK-1012/2-92 pp6–11; Davies–Davies2010 §§2.4,3,4 and Table7'],
      tags: ['heat flow', 'conduction', 'geotherm'],
      credit: 'Fourier conduction law; DOE1992 technical treatment and Davies–Davies2010 global estimate',
      scope: String.raw`Holds for conduction in a stationary solid, steady state and no internal sources or advection (fluid flow in the rock, which is common in the top kilometres, breaks it). Davies and Davies (2010) estimate 47 ± 2 TW globally and quote continental/ocean means of approximately 71/105 mW/m² (Table 7). This is a model-assisted area-weighted estimate, with hydrothermal and sparse-coverage corrections, not a uniform local flux or a new current assessment.`,
      links: { doi: 'https://doi.org/10.5194/se-1-5-2010' },
      verify: false,
      viz(v) {
        const LAY = CT.layers;
        const ZMAX = LAY.reduce((a, l) => a + l.h, 0);
        const q = v.slider('surface heat flow $q$ (mW/m²)', 20, 120, 65, { step: 1 });
        const mode = v.select('column', [{ value: 'lay', label: 'four rock types' }, { value: 'uni', label: 'uniform, $k=2.9$' }], 'lay');
        const kAt = z => CT.layerK(z,layers());
        const layers = () => (mode.value === 'uni' ? [{ name: 'uniform rock', k: 2.9, h: ZMAX, col: 'accent' }] : LAY);
        const Tz = z => CT.layerTemperature(z,q.value,layers(),T0C);
        const yt = [[0, '0'], [-1, '1'], [-2, '2'], [-3, '3']];
        const S1 = v.stage({ x: [0, 170], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'temperature $T$ (°C)', ylabel: 'depth (km)', yticks: yt, height: 340, weight: 1.2, minWidth: 240 });
        const S2 = v.stage({ x: [0, 40], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'gradient $dT/dz$ (°C/km)', yticks: yt, height: 340, weight: 0.9, minWidth: 200 });
        const S3 = v.stage({ x: [0, 130], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'flux $k\\,dT/dz$ (mW/m²)', yticks: yt, height: 340, weight: 0.9, minWidth: 200 });
        const probe = S1.handle(10, -1.6, { color: 'gold', constrain: 'y', label: 'probe', labelPos: 'ne' });
        let info = {};
        v.render(() => {
          S2.setView([0,q.value/Math.min(...layers().map(l=>l.k))*1.15],[-ZMAX,0]);
          let a = 0;
          for (const S of [S1, S2, S3]) {
            a = 0;
            for (const l of layers()) { S.hband(-(a + l.h), -a, { color: l.col, alpha: 0.12 }); a += l.h; }
          }
          a = 0;
          for (const l of layers()) { S1.text(`${l.name}, ${l.k} W/m/K`, 165, -(a + l.h / 2), { align: 'right', size: 11, color: l.col }); a += l.h; }
          S1.curve((z) => [Tz(z), -z], 0, ZMAX, { n: 200, color: 'accent', width: 2.4 });
          // gradient and flux step plots
          a = 0; const gp = [], fp = [];
          for (const l of layers()) { const g = q.value / l.k; gp.push([g, -a], [g, -(a + l.h)], null); fp.push([q.value, -a], [q.value, -(a + l.h)], null); a += l.h; }
          S2.path(gp, { color: 'orange', width: 2.4 });
          S3.vline(q.value, { color: 'green', width: 2.4 });
          const z = Math.min(Math.max(-probe.y, 0.02), ZMAX - 0.02), k = kAt(z), g = q.value / k;
          probe.set(10, -z);
          S1.hline(-z, { color: 'gold', dash: true, alpha: 0.8 });
          S1.dot(Tz(z), -z, { r: 5, color: 'gold' });
          S2.dot(g, -z, { r: 5, color: 'gold' }); S3.dot(q.value, -z, { r: 5, color: 'gold' });
          info = { z, k, g, T: Tz(z) };
        });
        v.legend([['accent', 'temperature'], ['orange', 'gradient'], ['green', 'heat flux (constant)'], ['gold', 'probe']]);
        v.readout(() => `Probe at $z=${v.fix(info.z, 2)}$ km: $k=${v.fix(info.k, 1)}$ W/m/K, $T=${v.fix(info.T, 0)}$ °C, $dT/dz=${v.fix(info.g, 1)}$ °C/km, so $k\\,dT/dz=${v.fix(info.k * info.g, 1)}$ mW/m² $=q$ at every depth.`);
      },
    },

    // ───────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Radiogenic heating and the continental geotherm',
      statement: String.raw`Let depth $z$ increase downward in a steady, constant-conductivity column, with upward heat flux $q=kT_z$ and chosen volumetric production $A(z)$. Conservation gives $q_z=-A$ and $kT_{zz}=-A$. A uniform source layer $A_0$ of thickness $h$, with upward flux $q_m$ below it, gives
$$q_0=q_m+A_0h,\qquad T(z)=T_0+\frac{q_0z}{k}-\frac{A_0z^2}{2k}\quad(0\le z\le h).$$
An infinite exponential profile $A=A_0e^{-z/h}$ with limiting deep flux $q_m$ has the same surface law but a different geotherm. An affine relation across sites follows if $h$ and $q_m$ are shared; it is not universal for every geological province.`,
      idea:String.raw`Integrating $q_z=-A$ gives $q(z)=q_m+\int_z^\infty A(s)ds$. Integrating once more yields the temperature. For the exponential profile,
$$\begin{aligned}T(z)&=T_0+\frac{q_mz}{k}\\&\quad+\frac{A_0h^2}{k}(1-e^{-z/h}).\end{aligned}$$
The same surface slope $h$ can describe a uniform layer thickness or an exponential scale depth; surface fits alone do not distinguish these vertical shapes. Sass, Jaeger and Munroe's Australian primary study shows both province differences and sampling limitations, including a region with no simple heat-flow/production relation. The fundamental theorem (pma 6.21) converts the flux derivative into the source integral on each finite depth interval, then converts $T_z=q/k$ into the temperature increment. For the exponential source the convergent deep limit supplies $q_m$; it is a boundary condition, not another fitted source term.`,
      caption:String.raw`Fit the line to 14 synthetic points using the two sliders or press Least-squares line. Drag the gold handle to select surface production. The left panel compares the selected source-bearing model with the source-free line at the same surface flux. The red production profile has its own axis in the right panel. The 35 km line is a chosen reference depth. The exponential source extends below it, so the actual flux there need not equal the limiting deep flux. This constant-property calculation does not assess melting.`,
      deps: ['geol-4.1', 'geol-2.1', 'pma-6.21'],
      refs: ['Sass, Jaeger & Munroe (1976) USGS OF76-250 pp51–67, Fig7'],
      tags: ['heat production', 'geotherm', 'continents'],
      credit: 'Primary model/discussion: Sass, Jaeger and Munroe, USGS OF76-250 (1976)',
      scope:String.raw`Two prescribed one-dimensional source profiles, fixed surface temperature and constant conductivity. Synthetic points use a chosen line plus noise, not digitized field data. A reduced flux contains heat supplied below the modelled source population; it is not uniquely identified as mantle heat. Source-layer scale and conductivity do not determine a rock solidus.`,
      links:{url:'https://pubs.usgs.gov/of/1976/0250/report.pdf'},
      verify: false,
      viz(v) {
        const K = 2.5, MOHO = 35;
        const rng = v.rng(42);
        const pts = []; for (let i = 0; i < 14; i++) { const A = 0.4 + 5.2 * rng(); pts.push([A, 30 + 10 * A + 4 * rng.normal()]); }
        const model = v.select('production profile', [{ value: 'uni', label: 'uniform layer' }, { value: 'exp', label: 'exponential' }], 'uni');
        const qm = v.slider('limiting deep flux $q_m$ (mW/m²)', 10, 60, 30, { step: 0.5 });
        const hh = v.slider('thickness $h$ (km)', 4, 20, 10, { step: 0.5 });
        const fit=CT.fitLine(pts);
        v.button('Least-squares line',()=>{hh.set(fit.slope);qm.set(fit.intercept);});
        const L = v.stage({ x: [0, 1400], y: [-60, 0], axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'depth (km)', yticks: [[0, '0'], [-10, '10'], [-20, '20'], [-30, '30'], [-40, '40'], [-50, '50'], [-60, '60']], height: 380, weight: 1, minWidth: 240 });
        const R = v.stage({ x: [0, 6], y: [0, 130], axes: 'box', gutter: true, xlabel: 'surface heat production $A_0$ (µW/m³)', ylabel: 'surface heat flow $q_0$ (mW/m²)', height: 380, weight: 1.1, minWidth: 260 });
        const D=v.stage({x:[0,6.6],y:[-60,0],axes:'box',gutter:true,xlabel:'heat production (µW/m³)',ylabel:'depth (km)',yticks:[[0,'0'],[-10,'10'],[-20,'20'],[-30,'30'],[-40,'40'],[-50,'50'],[-60,'60']],height:380,weight:.7,minWidth:190});
        const hand = R.handle(2.5, 55, { color: 'gold', label: '$A_0$', constrain: (x) => { const X = Math.min(Math.max(x, 0.1), 6); return [X, qm.value + hh.value * X]; } });
        let info = {};
        v.render(() => {
          const A0 = Math.min(Math.max(hand.x, 0.1), 6), h = hh.value, q0 = qm.value + h * A0;
          hand.set(A0, q0);
          const opts={qm:qm.value,A0,h,model:model.value,k:K,T0:T0C},Tm_=z=>CT.productionTemperature(z,opts),noSource=z=>T0C+q0*z/K,maximum=Math.max(Tm_(60),noSource(60))*1.08;
          L.setView([0,maximum],[-60,0]);R.setView([0,6.4],[-3,Math.max(qm.value+6*h,...pts.map(p=>p[1]))*1.12]);hand.labelPos=A0>4.5?'nw':'ne';
          L.hline(-MOHO, { color: 'muted', dash: true });
          L.text('chosen 35 km datum', maximum*.97, -MOHO + 2, { align: 'right', size: 11, color: 'muted' });
          L.curve((z) => [T0C + (q0 * z) / K, -z], 0, 60, { color: 'muted', dash: true, width: 1.4 });
          L.curve((z) => [Tm_(z), -z], 0, 60, { n: 200, color: 'accent', width: 2.4 });
          L.dot(Tm_(MOHO), -MOHO, { r: 5, color: 'orange' });
          // Production has its own physical horizontal axis.
          const prof = z => CT.productionAt(z,opts);
          if(model.value==='uni')D.path([[A0,0],[A0,-h],[0,-h],[0,-60]],{color:'red',width:1.8});else D.curve(z=>[prof(z),-z],0,60,{n:240,color:'red',width:1.8});
          R.line(0, qm.value, 6, qm.value + 6 * h, { color: 'accent', width: 2.2 });
          R.hline(qm.value, { color: 'muted', dash: true });
          R.dots(pts.map((p) => [p[0], p[1]]), { r: 4.5, color: 'ink' });
          const rms = Math.sqrt(pts.reduce((a, p) => a + (p[1] - qm.value - h * p[0]) ** 2, 0) / pts.length);
          info={q0,A0,h,qm:qm.value,profile:model.value,T35:Tm_(MOHO),q35:CT.productionFlux(MOHO,opts),rms,fit,pts,maximum};
        });
        v.legend([['accent', 'geotherm'], ['muted', 'no-source geotherm', { dash: true }], ['red', 'heat production (separate axis)'], ['ink', 'synthetic province data', { dot: true }]]);
        v.readout(()=>`Surface $q_0=q_m+hA_0=${v.fix(info.q0,1)}$ mW/m² at $A_0=${v.fix(info.A0,2)}$ µW/m³. At the chosen 35 km datum: $T=${v.fix(info.T35,0)}$ °C and upward flux $${v.fix(info.q35,2)}$ mW/m².\nSynthetic-point rms ${v.fix(info.rms,3)} mW/m²; unconstrained least-squares rms ${v.fix(info.fit.rms,3)}. The deep limit is ${v.fix(info.qm,2)} mW/m²; no solidus criterion is supplied.`);
      },
    },

    // ───────────────────────────────────────── 4.3
    {
      num:'4.3',kind:'Model',name:'Half-space cooling of the oceanic lithosphere',
      statement:String.raw`In a one-dimensional half-space $z>0$, initially at $T_m$, hold the surface at $T_0$. For constant thermal diffusivity $\kappa$ and $t>0$,
$$T=T_0+(T_m-T_0)\operatorname{erf}\!\left(\frac{z}{2\sqrt{\kappa t}}\right).$$
Isotherms scale with $\sqrt{\kappa t}$. The depth where $(T-T_0)/(T_m-T_0)=0.9$ is $z_{90}=2\operatorname{erf}^{-1}(0.9)\sqrt{\kappa t}\simeq2.32617\sqrt{\kappa t}$; it is a chosen thermal definition of lithospheric thickness.`,
      idea:String.raw`Substitute the similarity variable $\eta=z/(2\sqrt{\kappa t})$ into $T_t=\kappa T_{zz}$. The resulting ODE integrates to the error function, satisfying the cold surface and initially hot interior. Identifying age with distance divided by plate speed additionally assumes negligible horizontal conduction. The mathematical half-space has no basal heat source or finite limiting thickness; comparison with old sea floor motivates a finite plate model. A universal 70–80 Myr validity boundary does not follow from this PDE. For $t>0$, the chain rule (pma 5.5) gives $T_t\propto-\eta F'(\eta)/(2t)$ and $\kappa T_{zz}\propto F''(\eta)/(4t)$. Thus the similarity profile obeys $F''+2\eta F'=0$; the boundary values select the error-function solution.`,
      caption:String.raw`The heat map shows the chosen one-dimensional model, including its idealized initial boundary jump. Drag the age probe between 1 and 100 Myr. The green line is the 90% isotherm. The spreading-rate slider changes distance corresponding to age, while leaving an age-labelled temperature field unchanged. In similarity mode all four profiles use a positive normalized temperature axis.`,
      deps: ['geol-4.1','pde-3.8', 'pma-5.5'],refs:['Parsons–Sclater (1977), pp804–809 and full Appendix1 pp823–824; Stein–Stein (1992) pp123–126'],
      tags:['lithosphere','cooling','erf'],credit:'Half-space/plate derivations in Parsons and Sclater, JGR82(1977),803–827',
      scope:String.raw`Constant-property diffusion model, $T_0=0$°C and chosen $\kappa=10^{-6}$m²/s; mantle temperature and spreading rate are model inputs. It omits horizontal conduction, hydrothermal transport, crustal heat production, latent heat and variable properties. Near-ridge/old-age physical applicability is distinct from the PDE solution.`,
      links:{doi:'https://doi.org/10.1029/JB082i005p00803'},verify:false,
      viz(v){
        const Tm=v.slider('mantle temperature $T_m$ (°C)',1200,1450,1300,{step:5}),rate=v.slider('half-spreading rate (mm/yr)',5,60,30,{step:1}),view=v.select('right panel',[{value:'prof',label:'profile at probe age'},{value:'col',label:'similarity collapse'}],'prof');
        const yt=[[0,'0'],[-50,'50'],[-100,'100'],[-150,'150']],A=v.stage({x:[0,105],y:[-150,0],axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'depth (km)',yticks:yt,height:340,weight:1.5,minWidth:300,title:'chosen half-space cooling model'}),B=v.stage({x:[0,1500],y:[-150,0],axes:'box',gutter:true,xlabel:'temperature (°C)',ylabel:'depth (km)',yticks:yt,height:340,weight:.9,minWidth:240}),probe=A.handle(60,-8,{color:'gold',constrain:(x)=>[Math.min(Math.max(x,1),100),-8],label:'age',labelPos:'ne'});
        let info={};v.render(()=>{const tm=Tm.value,t=Math.min(Math.max(probe.x,1),100),T=(z,t)=>HC.halfTemperature(z*1000,t,{Tm:tm}),zL=HC.Z90*Math.sqrt(KAPPA*t*MYR)/1000;probe.set(t,-8);probe.labelPos=t>85?'nw':'ne';
          A.heat((x,y)=>T(-y,x)/tm,{range:[0,1],cmap:'magma',res:3,key:`half-${tm}`});A.contour((x,y)=>T(-y,x),[200,600,1000],{color:'ink',width:.8,alpha:.45});A.curve(x=>[x,-HC.Z90*Math.sqrt(KAPPA*x*MYR)/1000],0,100,{color:'green',width:2});A.vline(t,{color:'gold',dash:true});
          if(view.value==='prof'){B.setView([0,tm*1.06],[-150,0]);B.setLabels('temperature (°C)','depth (km)');B.setTicks(null,yt);B.curve(z=>[T(z,t),-z],0,150,{n:240,color:'accent',width:2.4});const g=tm/Math.sqrt(Math.PI*KAPPA*t*MYR)*1000;B.line(0,0,tm,-tm/g,{color:'orange',dash:true,width:1.5});B.hline(-zL,{color:'green',dash:true});B.vline(tm,{color:'muted',dash:true});}
          else{B.setView([0,3.1],[0,1.05]);B.setLabels('$z/(2\\sqrt{\\kappa t})$','$(T-T_0)/(T_m-T_0)$');B.setTicks(null,null);const cols=['accent','teal','orange','purple'];[5,20,50,100].forEach((age,j)=>B.curve(e=>[e,T(2*e*Math.sqrt(KAPPA*age*MYR)/1000,age)/tm],0,3,{n:160,color:cols[j],width:1.8,dash:j?[4,3]:undefined}));}
          info={t,zL,dist:rate.value*t,q:HC.halfHeat(t,{Tm:tm})*1000,temperature:T(zL,t),tm};
        });
        v.legend([['green','90% isotherm'],['accent','temperature profile'],['orange','surface tangent',{dash:true}],['ink','200/600/1000°C contours']]);
        v.readout(()=>`Age $${v.fix(info.t,1)}$Myr, distance $${v.fix(info.dist,0)}$ km at this rate; $z_{90}=${v.fix(info.zL,2)}$ km with $T/T_m=${v.fix(info.temperature/info.tm,6)}$.\nModel heat flow $${v.fix(info.q,1)}$ mW/m² with chosen $k=3.138$W/m/K and $\\kappa=10^{-6}$m²/s.`);
      },
    },
    // ───────────────────────────────────────── 4.4
    {
      num:'4.4',kind:'Proposition',name:'Ocean depth grows as √age',
      statement:String.raw`In the half-space model, linear thermal expansion and water-loaded isostasy give subsidence below the selected ridge datum
$$w(t)=\frac{\rho_m\alpha}{\rho_m-\rho_w}\int_0^\infty(T_m-T)\,dz=\frac{2\rho_m\alpha(T_m-T_0)}{\rho_m-\rho_w}\sqrt{\frac{\kappa t}{\pi}}.$$
Parsons–Sclater (1977) give the empirical young-age approximation $d=2500+350\sqrt t$ metres for $0<t<70$Myr, and the older asymptote $6400-3200e^{-t/62.8}$ for $t>20$ Myr. Their ranges overlap: these are not one exact law spliced at an unexplained age.`,
      idea:String.raw`To first order in thermal expansion, the cold column's excess mass per area is $\rho_m\alpha\int(T_m-T)dz$. Replacing mantle by seawater balances it with $(\rho_m-\rho_w)w$. The error-function deficit integrates to $2(T_m-T_0)\sqrt{\kappa t/\pi}$. This proves the model's square-root dependence; the numerical coefficient depends on its inputs. Published depth–age approximations describe reference datasets and do not establish the same depth for every oceanic location. After scaling depth to $\eta$, integration by parts (pma 6.22) on a finite interval gives the area of $1-\operatorname{erf}\eta$ from its Gaussian derivative. The boundary term $\eta(1-\operatorname{erf}\eta)$ tends to zero at infinity, leaving $1/\sqrt\pi$ and hence the stated thermal-deficit integral.`,
      caption:String.raw`The gold curve uses your chosen expansion coefficient and temperature contrast with a 2500 m ridge datum. Orange shows both Parsons–Sclater asymptotes on their published domains; teal shows the piecewise GDH1 approximation, with its own 2600 m datum. The right panel deliberately displays only the upper 150 km density excess. Its numerical finite-window integral, analytic missing tail and infinite-column subsidence are reported separately. Switching to a square-root age axis preserves the selected physical age. `,
      deps: ['geol-4.3','vcalc-8.8', 'pma-6.22'],refs:['Parsons–Sclater (1977) Eqs7–11,21–22; Stein–Stein (1992) pp124–126'],tags:['bathymetry','isostasy','subsidence'],credit:'Published reference approximations: Parsons–Sclater (1977) and Stein–Stein (1992)',verify:false,
      scope:String.raw`First-order constant-property thermal/isostatic model, with chosen densities 3300 and 1000 kg/m³ and diffusivity 10⁻⁶ m²/s; no sediment loading or crustal buoyancy. The GDH1 formula changes asymptote at 20 Myr with a small approximation mismatch; it is not raw sounding data. Curves beyond the source's sampled ages are model continuations.`,links:{doi:'https://doi.org/10.1038/359123a0'},
      viz(v){
        const alpha=v.slider('thermal expansion $\\alpha$ (10⁻⁵/K)',2,4,3,{step:.05}),Tm=v.slider('$T_m-T_0$ (K)',1100,1500,1300,{step:10});let chosen=40;
        const ax=v.select('age axis',[{value:'age',label:'age'},{value:'sqrt',label:'√age'}],'age',{onChange:()=>{probe.set(ax.value==='sqrt'?Math.sqrt(chosen):chosen,0);}});
        const S=v.stage({x:[0,180],y:[-7,-2.2],axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'depth (km)',height:340,weight:1.4,minWidth:300}),D=v.stage({x:[0,220],y:[-150,0],axes:'box',gutter:true,xlabel:'density excess (kg/m³)',ylabel:'depth (km)',yticks:[[0,'0'],[-50,'50'],[-100,'100'],[-150,'150']],height:340,weight:.8,minWidth:220}),probe=S.handle(40,-4,{color:'gold',constrain:'x',label:'age',labelPos:'ne'});
        let info={};v.render(()=>{const opts={Tm:Tm.value,alpha:alpha.value*1e-5},sq=ax.value==='sqrt',X=t=>sq?Math.sqrt(t):t,model=t=>-(2500+HC.halfSubs(t,opts))/1000,young=Array.from({length:71},(_,j)=>[X(j),-HC.psYoungDepth(j)/1000]),old=Array.from({length:161},(_,j)=>[X(j+20),-HC.psOldDepth(j+20)/1000]),gdh=Array.from({length:181},(_,j)=>[X(j),-HC.gdhDepth(j)/1000]),gold=Array.from({length:181},(_,j)=>[X(j),model(j)]),lo=Math.min(...gold.map(p=>p[1]),...old.map(p=>p[1]),...gdh.map(p=>p[1]))-.25;
          chosen=Math.min(Math.max(sq?probe.x**2:probe.x,1),180);S.setView(sq?[0,Math.sqrt(180)+.7]:[0,190],[lo,-2.15]);S.setLabels(sq?'$\\sqrt{\\mathrm{age}}$ (Myr$^{1/2}$)':'age (Myr)','depth (km)');S.setTicks(null,null);probe.set(X(chosen),model(chosen));probe.labelPos=chosen>110?'nw':'ne';S.path(young,{color:'orange',width:1.8});S.path(old,{color:'orange',width:1.6,dash:[4,3]});S.path(gdh,{color:'teal',width:1.8,dash:[2,3]});S.path(gold,{color:'gold',width:2.6});
          const maximum=3300*opts.alpha*opts.Tm,dr=z=>maximum*HC.erfc(z*1000/(2*Math.sqrt(KAPPA*chosen*MYR)));D.setView([0,maximum*1.1],[-150,0]);D.curve(z=>[dr(z),-z],0,150,{n:250,color:'accent',width:2.2});D.path([[0,0],...Array.from({length:301},(_,j)=>[dr(j/2),-j/2]),[0,-150]],{close:true,fill:'accent',fillAlpha:.2,color:'accent',width:.5});const finite=v.M.integrate(dr,0,150,600)*1000/2300,analyticFinite=HC.finiteSubs(150000,chosen,opts),full=HC.halfSubs(chosen,opts);
          info={t:chosen,finite,analyticFinite,full,tail:full-analyticFinite,maximum,lo,sq};
        });
        v.legend([['gold','chosen half-space model'],['orange','PS77 young/old asymptotes'],['teal','GDH1 piecewise approximation',{dash:true}]]);
        v.readout(()=>`At $${v.fix(info.t,1)}$Myr: numerical upper 150 km subsidence $${v.fix(info.finite,2)}$ m; analytic finite-window value $${v.fix(info.analyticFinite,2)}$ m.\nMissing deeper tail $${v.fix(info.tail,2)}$ m; full-column model $${v.fix(info.full,2)}$ m below its 2500 m ridge datum. The GDH1 reference uses 2600 m.`);
      },
    },
    // ───────────────────────────────────────── 4.5
    {
      num:'4.5',kind:'Proposition',name:'Oceanic heat flow falls as 1/√age',
      statement:String.raw`Differentiating the half-space temperature at its surface gives the upward conductive heat flow
$$q(t)=\frac{k(T_m-T_0)}{\sqrt{\pi\kappa t}},\qquad t>0.$$
It diverges at the idealized ridge but is integrable over a finite age-area distribution. Parsons–Sclater (1977) report $q=11.3/\sqrt t$μcal cm⁻²s⁻¹, or $472.792/\sqrt t$ mW/m² for $0<t<120$ Myr. The distinct GDH1 approximation is $510/\sqrt t$ through 55 Myr and $48+96e^{-0.0278t}$ above 55 Myr.`,
      idea:String.raw`The derivative of $\operatorname{erf}(z/(2\sqrt{\kappa t}))$ at $z=0$ is $1/\sqrt{\pi\kappa t}$. Multiplying by the conductivity gives the model law. A young-crust conductive-probe deficit relative to a thermal reference is consistent with hydrothermal heat transport; it does not by itself measure a unique water flux or universal sealing age. For $t=u^2$, the transformed heat-loss integrand has a finite **nonzero** value at $u=0$, which must be retained in numerical quadrature. The upper-limit derivative theorem (pma 6.20) applied to the defining Gaussian integral gives the error function's derivative used here. For integrated heat loss, substitute $t=u^2$ on a positive age interval (pma 6.19), then take its lower limit to zero: $t^{-1/2}dt=2du$. This explains the finite nonzero endpoint in the transformed integral.`,
      caption:String.raw`Left: selected model curves on 1–200 Myr, plus source approximations on their stated ranges; the red curve uses an explicitly chosen conductive fraction. Right: exact integrated heat loss in each 10 Myr bin of a synthetic triangular age-area distribution. Complete bins include the integrable young-age singularity. The difference is the toy's assigned nonconductive heat component, not a measured global hydrothermal estimate. Change the sealing parameter and ridge fraction or drag the age probe.`,
      deps: ['geol-4.3', 'pma-6.20', 'pma-6.19'],refs:['Parsons–Sclater (1977) Eqs10,23 and p820 range; Stein–Stein (1992) pp125–126 GDH1 formulas/data limitations'],tags:['heat flow','hydrothermal','sea floor'],credit:'Thermal reference models: Parsons–Sclater (1977) and Stein–Stein (1992)',verify:false,
      scope:String.raw`Chosen area 3.1×10¹⁴ m² and oldest age 180 Myr define the triangular distribution, not a retrieved seafloor dataset. The quadratic conductive fraction is synthetic. Thermal parameters are constant; old-age half-space curves are deliberate model extrapolations. The 55 Myr GDH1 splice has a small approximation mismatch.`,links:{doi:'https://doi.org/10.1038/359123a0'},
      viz(v){
        const dT=v.slider('$T_m-T_0$ (K)',1100,1500,1350,{step:10}),kk=v.slider('conductivity $k$ (W/m/K)',2.5,4,3.3,{step:.05}),ts=v.slider('model sealing age (Myr)',20,90,60,{step:1}),f0=v.slider('model ridge conductive fraction',0,.6,.2,{step:.02});
        const H=v.stage({x:[.9,210],y:[1,800],xlog:true,ylog:true,axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'heat flow (mW/m²)',height:340,weight:1.2,minWidth:280}),G=v.stage({x:[-2,182],y:[0,12],axes:'box',gutter:true,xlabel:'age bin (Myr)',ylabel:'integrated bin heat loss (TW)',height:340,weight:1,minWidth:260}),probe=H.handle(8,150,{color:'gold',label:'age',labelPos:'ne',constrain:'x'});
        let info={};v.render(()=>{const opts={Tm:dT.value,k:kk.value},q=t=>HC.halfHeat(t,opts)*1000,frac=t=>HC.conductedFraction(t,ts.value,f0.value),tt=Array.from({length:201},(_,j)=>Math.exp(j*Math.log(200)/200)),blue=tt.map(t=>[t,q(t)]),red=tt.map(t=>[t,q(t)*frac(t)]),ps=tt.filter(t=>t<=120).map(t=>[t,HC.psHeat(t)]),gdh=tt.map(t=>[t,HC.gdhHeat(t)]),ys=[...blue,...red,...ps,...gdh].map(p=>p[1]);H.setView([.9,210],[Math.min(...ys)*.75,Math.max(...ys)*1.15]);H.path(blue,{color:'accent',width:2.4});H.path(red,{color:'red',width:2.2});H.path(ps,{color:'orange',width:1.4,dash:[5,3]});H.path(gdh,{color:'teal',width:1.4,dash:[2,3]});H.vline(ts.value,{color:'muted',dash:true,alpha:.6});const t=Math.min(Math.max(probe.x,1),180);probe.set(t,q(t)*frac(t));probe.labelPos=t>70?'nw':'ne';
          const bins=HC.heatBins(opts,ts.value,f0.value),top=Math.max(...bins.map(b=>b.law))*1.12;G.setView([-2,182],[-.03*top,top]);for(const b of bins){G.rect(b.lo+.3,0,b.hi-.3,b.law,{fill:'accent',fillAlpha:.22,color:'accent',width:1});G.rect(b.lo+1.7,0,b.hi-1.7,b.conducted,{fill:'red',fillAlpha:.36,color:'red',width:1});}G.vline(t,{color:'gold',dash:true});
          const total=bins.reduce((a,b)=>a+b.law,0),conducted=bins.reduce((a,b)=>a+b.conducted,0);info={t,q:q(t),qc:q(t)*frac(t),total,conducted,bins,top,fraction:frac(t),c:HC.heatCoefficient(opts)};
        });
        v.legend([['accent','chosen conductive law / complete bins'],['orange','PS77 approximation'],['teal','GDH1 approximation'],['red','chosen conductive fraction / bin component']]);
        v.readout(()=>`At $${v.fix(info.t,1)}$Myr: law $${v.fix(info.q,1)}$, toy conductive component $${v.fix(info.qc,1)}$ mW/m².\nSum of all 18 bins: $${v.fix(info.total,3)}$ TW; toy conductive component $${v.fix(info.conducted,3)}$ TW; assigned remainder $${v.fix(info.total-info.conducted,3)}$ TW. These are chosen-model totals.`);
      },
    },
  ],
};
