import { makeConvection, CONV_L, markerTrack } from './geol-source-audit-convection.js';
import CONVECTION_REFS from './geol-source-audit-convection-data.js';
import { MELT, solidus, decompression } from './geol-source-audit-melting.js';
// Geology & Geophysics — Chapter 4: Heat flow, the cooling lithosphere and mantle convection (part b: 4.6–4.10)
//
// Sources checked / provenance (Oct 2026):
//   4.6: complete relevant Parsons & Sclater1977 derivation pp804–809 and Appendix1
//        pp823–824, plus Stein & Stein1992 pp123–126 reference approximations, read directly.
//        Early image/theta and late sine sums are independently checked. The fixed basal
//        temperature and freely chosen plate parameters do not claim an observed thickness.
//        See docs/verification/geol-cooling-followup.md for primary scope and evidence.
//   4.7–4.9: Rayleigh1916 stress-free derivation, Ferrick/Korenaga2023 primary scaling treatment,
//           Morgan1971 full letter transcription and Griffiths/Campbell1990 experimental/model sections.
//           Dedicated corrected solver/reference-state recipe with explicit finite numerical criteria.
//           See docs/verification/geol-source-audit-convection-followup.md.
//   4.10: full Hirschmann2000 publisher derivation/uncertainty read; abstract/Table2/body coefficients conflict.
//         Uses the explicitly identified abstract version and a chosen linear melt closure; see scoped melting audit.


import { MYR, KAPPA, plateT, plateQ, plateSubs, halfSpaceQ, halfSpaceSubs } from './ch04.shared.js';

import * as HC from './cooling-audit.shared.js';

// Audited own-model reference states; exact mesh/time and stationarity diagnostics are retained.
const NU_TABLE = CONVECTION_REFS.map(q=>[q.Ra,q.Nu]);
const W_TABLE = CONVECTION_REFS.map(q=>[q.Ra,q.w]);
const H_MANTLE = 2.89e6; // m
const RA_OF_ETA = (eta) => (4000 * 10 * 3e-5 * 3000 * H_MANTLE ** 3) / (KAPPA * eta);

/** Least-squares line in log–log of points [[x, y]…] → {slope, c (so that y = c x^slope)}. */
function logFit(pts) {
  const n = pts.length, lx = pts.map((p) => Math.log(p[0])), ly = pts.map((p) => Math.log(p[1]));
  const mx = lx.reduce((a, b) => a + b, 0) / n, my = ly.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (lx[i] - mx) * (ly[i] - my); sxx += (lx[i] - mx) ** 2; }
  const slope = sxy / sxx; return { slope, c: Math.exp(my - slope * mx) };
}
const STILL = () => typeof window !== 'undefined' && window.__vizStill;

export default {
  collection: 'geol',
  chapter: 4,
  items: [
    // ───────────────────────────────────────── 4.6
    {
      num:'4.6',kind:'Model',name:'The plate model',
      statement:String.raw`A one-dimensional plate of fixed thickness $a$ has fixed temperatures $T_0$ at its top and $T_m$ at its base, and initially $T_m$ in its interior. For $0<z<a$ and $t>0$,
$$T=T_0+(T_m-T_0)\left[\frac za+\sum_{n=1}^{\infty}\frac{2}{n\pi}\sin\frac{n\pi z}{a}\,e^{-n^2\pi^2\kappa t/a^2}\right].$$
At late times the temperature tends to the linear profile, surface heat flow to $k(T_m-T_0)/a$, and isostatic subsidence to $\rho_m\alpha(T_m-T_0)a/[2(\rho_m-\rho_w)]$. The first-mode decay time is $a^2/(\pi^2\kappa)$, about 32.1 Myr for the chosen 100 km plate and diffusivity 10⁻⁶ m²/s.`,
      idea:String.raw`Subtract the steady linear profile and expand the initial temperature deficit in Dirichlet sine modes. Each mode decays at its Laplacian eigenvalue. At early times the half-space solution is the leading approximation, with exponentially small basal-image corrections; the base is not mathematically absent at every positive time. At late times the first nonzero mode dominates. A constant-temperature base specifies a thermal boundary condition, not the physical mechanism maintaining it or a directly observed plate thickness.`,
      caption:String.raw`Change plate thickness and temperature contrast, and drag the 1–150 Myr probe. The gold model curves are compared with the half-space and the published depth approximations. The early-time temperature and flux calculations use rapidly convergent image/theta forms instead of a a slowly convergent truncation; later times use adaptive sine sums. Zero-age subsidence and the initially hot interior are exact limits. Model parameters are freely chosen, independently of the published reference fits.`,
      deps:['geol-4.4'],refs:['Parsons–Sclater (1977) pp804–809,Eqs8–17, full Appendix1 pp823–824; Stein–Stein (1992) pp124–126'],tags:['lithosphere','plate model','flattening'],credit:'Plate/half-space derivations and reference fits: Parsons–Sclater (1977); Stein–Stein (1992)',verify:false,
      scope:String.raw`Constant-property conduction, fixed basal temperature and first-order thermal isostasy; chosen conductivity 3.138 W/m/K, diffusivity 10⁻⁶ m²/s, densities 3300/1000 kg/m³ and expansion 3×10⁻⁵/K. No latent heat, hydrothermal transport or resolved mantle convection. PS77 young/old asymptotes overlap 20–70 Myr; GDH1 is a piecewise approximation, not raw data.`,links:{doi:'https://doi.org/10.1029/JB082i005p00803'},
      viz(v){
        const a=v.slider('plate thickness $a$ (km)',50,160,100,{step:1}),dT=v.slider('$T_m-T_0$ (K)',1200,1450,1300,{step:10});
        const A=v.stage({x:[0,155],y:[-168,0],axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'depth (km)',yticks:[[0,'0'],[-50,'50'],[-100,'100'],[-150,'150']],height:330,weight:1.1,minWidth:260,title:'plate temperature: initial jump at zero age'}),B=v.stage({x:[0,184],y:[-8,-2.15],axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'sea-floor depth (km)',height:330,minWidth:240}),C=v.stage({x:[.9,210],y:[20,700],xlog:true,ylog:true,axes:'box',gutter:true,xlabel:'age (Myr)',ylabel:'heat flow (mW/m²)',height:330,minWidth:240}),probe=A.handle(60,-8,{color:'gold',constrain:x=>[Math.min(Math.max(x,1),150),-8],label:'age',labelPos:'ne'});
        let info={};v.render(()=>{const am=a.value*1000,opts={Tm:dT.value},t=Math.min(Math.max(probe.x,1),150);probe.set(t,-8);probe.labelPos=t>120?'nw':'ne';const T=(z,age)=>HC.plateTemperature(z,age,am,opts);A.heat((x,y)=>T(-y*1000,x)/dT.value,{range:[0,1],cmap:'magma',res:3,key:`plate-${am}-${dT.value}`});A.hline(-a.value,{color:'ink',dash:[2,3],width:1.6});A.contour((x,y)=>T(-y*1000,x),[200,600,1000],{color:'ink',width:.8,alpha:.5});A.vline(t,{color:'gold',dash:true});
          const ts=Array.from({length:181},(_,j)=>j),hs=ts.map(x=>[x,-(2500+HC.halfSubs(x,opts))/1000]),plate=ts.map(x=>[x,-(2500+HC.plateSubsidence(x,am,opts))/1000]),young=ts.filter(x=>x<=70).map(x=>[x,-HC.psYoungDepth(x)/1000]),old=ts.filter(x=>x>=20).map(x=>[x,-HC.psOldDepth(x)/1000]),gdh=ts.map(x=>[x,-HC.gdhDepth(x)/1000]),lo=Math.min(...[...hs,...plate,...old,...gdh].map(p=>p[1]))-.25;B.setView([0,184],[lo,-2.15]);B.path(hs,{color:'accent',width:1.6,dash:[5,3]});B.path(plate,{color:'gold',width:2.6});B.path(young,{color:'orange',width:1.2});B.path(old,{color:'orange',width:1.2,dash:[4,3]});B.path(gdh,{color:'teal',width:1.2,dash:[2,3]});B.vline(t,{color:'gold',dash:true,alpha:.5});
          const ages=Array.from({length:161},(_,j)=>Math.exp(j*Math.log(200)/160)),qh=ages.map(x=>[x,HC.halfHeat(x,opts)*1000]),qp=ages.map(x=>[x,HC.plateHeat(x,am,opts)*1000]),values=[...qh,...qp].map(p=>p[1]);C.setView([.9,210],[Math.min(...values)*.85,Math.max(...values)*1.15]);C.path(qh,{color:'accent',width:1.6,dash:[5,3]});C.path(qp,{color:'gold',width:2.6});C.vline(t,{color:'gold',dash:true,alpha:.5});
          info={t,a:a.value,dT:dT.value,tau:am*am/(Math.PI*Math.PI*KAPPA*MYR),wInf:3300*3e-5*dT.value*am/(2*2300),qInf:3.138*dT.value/am*1000,w:HC.plateSubsidence(t,am,opts),wh:HC.halfSubs(t,opts),q:HC.plateHeat(t,am,opts)*1000,qh:HC.halfHeat(t,opts)*1000,lo,temperature:T(a.value*500,t)};
        });
        v.legend([['accent','half-space',{dash:true}],['gold','chosen plate'],['orange','PS77 overlapping asymptotes'],['teal','GDH1 approximation',{dash:true}]]);
        v.readout(()=>`Plate $a=${info.a}$km: first-mode time $${v.fix(info.tau,2)}$ Myr; model limits: depth $2500+${v.fix(info.wInf,1)}$ m and heat flow $${v.fix(info.qInf,2)}$ mW/m².\nAt $${v.fix(info.t,1)}$Myr: subsidence $${v.fix(info.w,2)}$ m (half-space $${v.fix(info.wh,2)}$m), heat flow $${v.fix(info.q,2)}$ mW/m² (half-space $${v.fix(info.qh,2)}$).`);
      },
    },
    // ───────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Mantle convection and the Rayleigh number',
      statement: String.raw`For a constant-viscosity Boussinesq layer with fixed hot and cold temperatures at its bottom and top,
$$\mathrm{Ra}=\frac{\rho g\alpha\,\Delta T\,h^3}{\kappa\eta}$$
measures buoyancy relative to viscous and thermal diffusion. The conductive state becomes linearly unstable when Ra exceeds a boundary-condition-dependent threshold. For two impermeable, stress-free horizontal boundaries and an unrestricted horizontal wavelength, the threshold is $27\pi^4/4\simeq657.51$, attained at horizontal wavelength $2\sqrt2h$. This planar onset calculation is a model criterion, not a proof that real mantle dynamics obey this constant-property layer.`,
      idea: String.raw`At infinite Prandtl number, nondimensional Stokes flow balances buoyancy instantly and temperature obeys an advection–diffusion equation. A perturbation with horizontal wave number $k$ and vertical mode $\sin(\pi z)$ has linear growth rate $\sigma=\mathrm{Ra}\,k^2/(k^2+\pi^2)^2-(k^2+\pi^2)$. Setting $\sigma=0$ and minimizing over $k$ gives $k=\pi/\sqrt2$ and the stated threshold. The ratio of thermal-diffusion time to the buoyant-rise time gives the same dimensionless Ra.`,
      caption: String.raw`A finite-time, two-dimensional, infinite-Prandtl calculation with fixed top/bottom temperatures, free-slip impermeable walls and insulating sidewalls. Change viscosity and restart. The readout distinguishes the Rayleigh number from chosen mantle-scale constants from the capped model value. The temperature field and horizontal mean show transient conduction/convection; a short run with little excess heat flux does not prove stability or extinction of motion. The plotted box admits the critical wavelength.`,
      deps: ['fluid-10.8', 'geol-4.1'],
      refs: ['Rayleigh (1916), pp. 537–539 equations 34–46, stress-free viscous onset derivation', 'https://zenodo.org/records/1508106', 'Ferrick & Korenaga (2023), §2 equations 1–3, infinite-Prandtl Boussinesq model', 'https://arxiv.org/abs/2304.07660'],
      tags: ['convection', 'Rayleigh number', 'mantle'],
      credit: 'Rayleigh, 1916 (stress-free linear onset)',
      scope: String.raw`Chosen scaling constants: density4000kg/m³, gravity10m/s², expansion3×10⁻⁵/K, contrast3000K, depth2890km, diffusivity10⁻⁶m²/s. They are round illustration inputs, not an empirical mantle parameter estimate. Model Ra has an upper cap10⁵, with no lower clamp. Earth has strongly varying rheology, compressibility, internal heating, phase transitions and mobile surface plates; it cannot be identified with a universal stagnant lid. Numerical flow is a truncated spectral Stokes solve with finite-difference temperature evolution, not the exact continuum equations.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mantle_convection' },
      verify: false,
      viz(v) {
        const eta = v.slider('log₁₀ viscosity η (Pa s)',20,27,24.48,{step:.01});
        const A = v.stage({ x: [0, CONV_L], y: [0, 1], height: 300, equal: true, axes: false, weight: 1.7, minWidth: 320, title: 'Temperature (hot = light) and streamlines' });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'mean temperature $\\bar T$', ylabel: 'height $z/h$', height: 300, weight: 0.7, minWidth: 200 });
        let S = null, simRa = 0, timer = null, tEnd = 0.4, done = false, info = {};
        const clampRa = (r) => Math.min(r, 1e5);
        const fresh = () => {
          const ra = clampRa(RA_OF_ETA(10**eta.value)); simRa = ra;
          S = makeConvection({ nx: ra > 3e4 ? 96 : 80, nz: ra > 3e4 ? 34 : 28, Ra: ra });
          tEnd = ra >= 5e4 ? 0.12 : ra > 1e4 ? 0.25 : 0.45; done = false;
          if (STILL()) { S.advance(tEnd); done = true; }
        };
        const tick = () => {
          timer = null;
          if (!S || done) return;
          done = S.advance(tEnd, 12);
          v.invalidate();
          if (!done) timer = setTimeout(tick, 0);
        };
        const kick = () => { if (!timer && !done) timer = setTimeout(tick, 0); };
        fresh();
        v.button('Restart', () => { fresh(); kick(); });
        v.onCleanup(() => { if (timer) clearTimeout(timer); timer = null; done = true; });
        v.render(() => {
          const want = clampRa(RA_OF_ETA(10**eta.value));
          if (want !== simRa) { fresh(); }
          kick();
          S.wrms();
          A.heat((x, y) => S.at(x, y), { range: [0, 1], cmap: 'magma', res: 4, key: `c${S.steps}_${simRa}` });
          const ps = []; let pm = 0; for (let k = 0; k < S.P.length; k++) pm = Math.max(pm, Math.abs(S.P[k]));
          if (pm > 1e-3) { for (let i = -5; i <= 5; i++) if (i) ps.push((i / 5.5) * pm); A.contour((x, y) => S.psiAt(x, y), ps, { color: 'ink', width: 0.9, alpha: 0.5, res: 100 }); }
          const prof = []; for (let j = 0; j < S.nz; j++) { let m = 0; for (let i = 0; i < S.nx; i++) m += S.T[j * S.nx + i]; prof.push([m / S.nx, (j + 0.5) * S.dz]); }
          P.path([[1, 0], [0, 1]], { color: 'muted', dash: true, width: 1.4 });
          P.path([[1, 0], ...prof, [0, 1]], { color: 'accent', width: 2.4 });
          const nu = S.nu().mean;
          info = { Ra: RA_OF_ETA(10**eta.value), simRa, nu, w: S.wrms(), t: S.time, done, steps: S.steps };
        });
        v.legend([['accent', 'horizontal mean $\\bar T(z)$'], ['muted', 'conductive profile', { dash: true }], ['ink', 'streamlines']]);
        v.readout(() => {
          return `Chosen viscosity $${v.sci(10**eta.value,2)}$ Pa s. Mantle-scale Ra: $${v.sci(info.Ra,2)}$; simulated $\\mathrm{Ra}=${v.sci(info.simRa,2)}$${info.Ra>1e5?' (upper cap)':''}. Stress-free continuum threshold $657.51$. Current $\\mathrm{Nu}=${v.fix(info.nu,3)}$, rms vertical speed $${v.fix(info.w,3)}\\,\\kappa/h$. Finite model time $${v.fix(info.t,3)}\\,h^2/\\kappa$${info.done?' (end of chosen run)':' (running…)'}; these diagnostics do not certify a steady state.`;
        });
      },
    },

    // ───────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Boundary-layer scaling: Nu ∝ Ra^(1/3)',
      statement: String.raw`A marginal thermal-boundary-layer argument for vigorous, isoviscous convection heated from below gives the conditional scaling
$$\mathrm{Nu}\propto\mathrm{Ra}^{1/3},\qquad q=\frac{k\Delta T}{h}\mathrm{Nu}.$$
For fixed material properties and temperature contrast, this makes the **dimensional heat flux** approximately independent of depth $h$, while Nu itself grows with $h$. With fixed cell aspect ratio and an advection–diffusion boundary-layer balance, a characteristic speed scales as $(\kappa/h)\mathrm{Ra}^{2/3}$. These are regime-dependent scaling arguments, not universal equalities for arbitrary mantle rheology, heating or flow geometry.`,
      idea: String.raw`If a boundary layer with temperature drop comparable to $\Delta T$ stays near a fixed local Rayleigh number, its dimensional thickness satisfies $\delta\propto(\kappa\eta/(\rho g\alpha\Delta T))^{1/3}$. The conductive flux across that layer gives Nu proportional to $h/\delta$. For horizontal travel length proportional to $h$, balancing $u/h$ with $\kappa/\delta^2$ gives the conditional speed exponent. Factors relating stability thickness and heat-flux thickness set prefactors and need calibration; neither exponent nor prefactor is a measured constant of Earth.`,
      caption: String.raw`Blue points are deterministic reference states from this page's own audited solver, with mesh, time, top/bottom flux and numerical stopping diagnostics recorded in the source audit. They are model outputs, not experiments. Green lines are chosen exponent guides; change the heat-flux coefficient. “Run now” adds a finite-time simulation at the requested Ra; it need not match a reference state or have equilibrated. Right uses rms vertical velocity, rather than claiming a measured surface plate speed. The readout reports fitted slopes over the selected resolved range, without extrapolating them into an Earth forecast.`,
      deps: ['geol-4.7'],
      refs: ['Ferrick & Korenaga (2023), §2 and §3.1 equations 8–11; §3.2 discusses stability vs heat-flux boundary-layer definitions and calibration', 'https://arxiv.org/abs/2304.07660'],
      tags: ['convection', 'scaling', 'Nusselt number'],
      scope: String.raw`Conditional high-Ra, constant-property, bottom-heated boundary-layer model. Internal heating, variable viscosity and cell geometry can alter the relation. The bounded numerical states do not establish an asymptotic exponent. A numerical stationarity tolerance is reported in the evidence table; a finite-time live point is not labelled steady. The rms vertical-speed comparison assumes a fixed geometric relation to characteristic velocity and has no plate-kinematic prediction.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rayleigh%E2%80%93B%C3%A9nard_convection' },
      verify: false,
      viz(v) {
        const live = v.slider('live run: Ra', 1e3, 1e5, 3e4, { log: true, sig: 2 });
        const C = v.slider('line $C$ in $\\mathrm{Nu}=C\\,\\mathrm{Ra}^{1/3}$', 0.1, 0.4, 0.215, { step: 0.001 });
        const live_pts = []; let timer = null, running = false, prog = '';
        const N = v.stage({ x: [500, 2e5], y: [1, 20], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'Rayleigh number Ra', ylabel: 'Nusselt number Nu', height: 340, weight: 1.1, minWidth: 280 });
        const W = v.stage({ x: [500, 2e5], y: [3, 300], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'Rayleigh number Ra', ylabel: 'rms vertical speed ($\\kappa/h$)', height: 340, weight: 1.1, minWidth: 280 });
        const run = () => {
          if (running) return; running = true;
          const ra = live.value, nz = ra > 3e4 ? 36 : 28, S = makeConvection({ nx: Math.round(nz * 2.828), nz, Ra: ra });
          const tEnd = ra >= 5e4 ? 0.1 : 0.4, step = () => {
            const ok = S.advance(tEnd, 12); prog = `${Math.round((100 * S.time) / tEnd)}%`; v.invalidate();
            if (ok) { running = false; prog = ''; live_pts.push({ Ra: ra, Nu: S.nu().mean, w: S.wrms(),time:S.time,top:S.nu().top,bottom:S.nu().bottom }); v.invalidate(); } else timer = setTimeout(step, 0);
          };
          step();
        };
        v.button('Run now', run);
        v.button('Clear live points', () => { live_pts.length = 0; });
        v.onCleanup(() => { if (timer) clearTimeout(timer); running = false; });
        const fitHi = logFit(NU_TABLE.filter((p) => p[0] >= 1e4)), fitW = logFit(W_TABLE.filter((p) => p[0] >= 1e4));
        let info = {};
        v.render(() => {
          const xs = [500, 2e5],nuValues=[...NU_TABLE.map(q=>q[1]),...live_pts.map(q=>q.Nu),C.value*Math.cbrt(xs[0]),C.value*Math.cbrt(xs[1])],w0=W_TABLE.find(q=>q[0]===1e4)[1],wValues=[...W_TABLE.map(q=>q[1]),...live_pts.map(q=>q.w),w0*(xs[0]/1e4)**(2/3),w0*(xs[1]/1e4)**(2/3)];
          N.setView([450,2.2e5],[Math.min(...nuValues)*.8,Math.max(...nuValues)*1.2]);W.setView([450,2.2e5],[Math.min(...wValues)*.8,Math.max(...wValues)*1.2]);
          N.line(xs[0], C.value * Math.cbrt(xs[0]), xs[1], C.value * Math.cbrt(xs[1]), { color: 'green', width: 2 });
          N.path(NU_TABLE.map((p) => [p[0], p[1]]), { color: 'accent', width: 1, alpha: 0.5 });
          N.dots(NU_TABLE.map((p) => [p[0], p[1]]), { r: 5.5, color: 'accent' });
          N.dots(live_pts.map((p) => [p.Ra, p.Nu]), { r: 6, color: 'gold' });
          W.line(xs[0], w0 * (xs[0] / 1e4) ** (2 / 3), xs[1], w0 * (xs[1] / 1e4) ** (2 / 3), { color: 'green', width: 2 });
          W.dots(W_TABLE.map((p) => [p[0], p[1]]), { r: 5.5, color: 'accent' });
          W.dots(live_pts.map((p) => [p.Ra, p.w]), { r: 6, color: 'gold' });
          if (prog) N.corner(`running… ${prog}`, 'tl');
          info = { sl: fitHi.slope, sw: fitW.slope,live_pts:live_pts.slice(),running,prog };
        });
        v.legend([['accent', 'solver (table)', { dot: true }], ['gold', 'live run', { dot: true }], ['green', 'slope 1/3 (left), 2/3 (right)']]);
        v.readout(()=>`Reference-state log–log slopes over $\\mathrm{Ra}\\ge10^4$: Nu exponent $${v.fix(info.sl,3)}$ and rms vertical-speed exponent $${v.fix(info.sw,3)}$. These are finite-range numerical fits. ${info.live_pts.length?`Latest live state: $t=${v.fix(info.live_pts.at(-1).time,3)}$, top/bottom Nu $${v.fix(info.live_pts.at(-1).top,3)}/${v.fix(info.live_pts.at(-1).bottom,3)}$.`:'No live point yet.'} ${info.running?'Calculation running…':''}`);
      },
    },

    // ───────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Mantle plumes',
      statement: String.raw`Narrow upwellings of hot rock, mantle plumes, are proposed to rise from a hot thermal boundary layer deep in the mantle. A starting plume has a large buoyant head that spreads beneath the lithosphere and a feeding conduit (the tail). In an idealized fixed-source hypothesis, plate motion over the source leaves an age-progressive track. Morgan (1971) proposed that a plume tail under a moving plate leaves a chain of volcanoes of progressively greater age, and the arrival of a head has been linked to flood basalts.`,
      idea: String.raw`A hot layer of low density under a colder, denser one is unstable once the local Rayleigh number of the layer exceeds its critical value (4.7). A blob that detaches rises, and fluid is fed to it from behind through a conduit, so a head forms; Griffiths and Campbell’s thermal-plume experiments show entrainment and thermal mixing into the head; compositional differences are stirred into layers rather than molecularly homogenized; the near-vertical feeder can remain comparatively less contaminated before shear deflects it. When the head reaches the cold lid it flattens; continued heat supply can contribute to melting beneath a moving plate. The eruption markers below are a separate prescribed kinematic construction, not output from a melt or plate-force calculation.`,
      caption: String.raw`A chosen hot basal blob rises in a two-dimensional constant-viscosity box, with positive first-order upwind temperature transport. This differs from the laboratory paper's three-dimensional, low-viscosity injected plume. Near-top warming is declared when temperature in either of the upper two cell rows near the centre first exceeds 0.25; it is a mesh-dependent detection threshold, not an exact arrival or eruption calculation. After detection, hypothetical markers are created at equally spaced times at a fixed horizontal source and carried right at a prescribed speed. Their ages and positions follow that construction. Restart or choose Ra and the speed ratio.`,
      deps: ['geol-4.7'],
      refs: ['Morgan (1971), Nature230 pp.42–43, complete original-letter transcription', 'https://www.mantleplumes.org/Morgan1971.html', 'Griffiths & Campbell (1990), complete §§1–3 pp.66–72 and conclusions pp.76–77', 'https://www.mantleplumes.org/WebDocuments/Griffiths1990.pdf'],
      tags: ['plumes', 'hotspots', 'convection'],
      credit: 'Morgan, 1971 (deep-source hypothesis); Griffiths & Campbell, 1990 (thermal-plume experiments)',
      scope: String.raw`A hypothesis that explains many features (age-progressive volcanic chains, large igneous provinces) but whose seismic imaging and depth of origin remain debated. The 2-D constant-viscosity model contains no melt, composition, 3-D entrainment, moving upper boundary or eruptive physics. Its fixed source and marker spacing are chosen, not evidence for exact hotspot fixity or a measured age progression.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mantle_plume' },
      verify: false,
      viz(v) {
        const ra = v.select('Rayleigh number', [{ value: 1e4, label: '$10^4$' }, { value: 3e4, label: '$3\\times10^4$' }, { value: 1e5, label: '$10^5$' }], 1e5);
        const vp = v.slider('prescribed marker speed ÷ detected mean rise speed', 0.02, 0.6, 0.25, { step: 0.01 });
        const A = v.stage({ x: [0, CONV_L], y: [0, 1], height: 320, equal: true, axes: false, weight: 1.6, minWidth: 320, title: 'Temperature; hypothetical markers moving right' });
        const B = v.stage({ x: [0, CONV_L], y: [0, 1], axes: 'box', gutter: true, xlabel: 'horizontal position x/h', ylabel: 'marker age ($h^2/\\kappa$)', height: 320, weight: 0.8, minWidth: 220, title: 'Prescribed marker age against distance' });
        let S = null, timer = null, done = false, arrive = null, info = {};
        const arrived = () => {
          let m = 0;
          for (const j of [S.nz - 1, S.nz - 2]) for (let i = 0; i < S.nx; i++) { const x = (i + 0.5) * S.dx; if (Math.abs(x - CONV_L / 2) < 0.4) m = Math.max(m, S.T[j * S.nx + i]); }
          return m > 0.25;
        };
        const fresh = () => {
          const R = Number(ra.value), nz = R > 3e4 ? 36 : 28;
          S = makeConvection({ nx: Math.round(nz * 2.828), nz, Ra: R,monotone:true }); S.initPlume({ bump: 1, w: 0.12, layer: 0.06 }); arrive = null; done = false;
          if (STILL()) { while (arrive == null && S.time < 0.2) { S.step(0.002); if (arrived()) arrive = S.time; } if (arrive != null) S.advance(arrive * 2); done = true; }
        };
        const tick = () => {
          timer = null; if (!S || done) return;
          const t0 = performance.now();
          while (performance.now() - t0 < 12) {
            S.step(0.002);
            if (arrive == null && arrived()) arrive = S.time;
            if (S.time > 0.3 || (arrive != null && S.time > arrive * 2.2)) { done = true; break; }
          }
          v.invalidate(); if (!done) timer = setTimeout(tick, 0);
        };
        const kick = () => { if (!timer && !done) timer = setTimeout(tick, 0); };
        fresh();
        let lastRa = ra.value;
        v.button('Restart', () => { fresh(); kick(); });
        v.onCleanup(() => { if (timer) clearTimeout(timer); timer = null; done = true; });
        v.render(() => {
          if (ra.value !== lastRa) { lastRa = ra.value; fresh(); }
          kick();
          A.heat((x, y) => S.at(x, y), { range: [0, 1], cmap: 'magma', res: 4, key: `p${S.steps}_${ra.value}` });
          // volcano track on a plate moving to the right over the fixed plume axis (box centre)
          const trk=markerTrack(arrive,S.time,vp.value);
          if(arrive!=null){
            trk.forEach((p, n) => A.dot(p[0], 0.94, { r: 6, color: n === 0 ? 'red' : 'orange' }));
            A.text('markers →', 0.08, 0.93, { size: 11, color: 'ink', align: 'left', plate: true });
          }
          A.vline(CONV_L / 2, { color: 'faint', dash: true, alpha: 0.4 });
          B.setView([0, CONV_L], [-Math.max(S.time*.06,1e-4), Math.max(S.time * 1.1, 1e-3)]);
          B.setTicks(null, null);
          if (trk.length) { B.path(trk, { color: 'muted', width: 1.4 }); B.dots(trk, { r: 5, color: 'orange' }); B.dot(trk[0][0], trk[0][1], { r: 6, color: 'red' }); }
          let wid = 0; { const j = Math.floor(0.4 * S.nz); for (let i = 0; i < S.nx; i++) if (S.T[j * S.nx + i] > 0.4) wid += S.dx; }
          let wh = 0; { const j = S.nz - 3; for (let i = 0; i < S.nx; i++) if (S.T[j * S.nx + i] > 0.25) wh += S.dx; }
          info = { arrive, wid, wh, t: S.time, trk: trk.length, points:trk,speedRatio:vp.value,done };
        });
        v.legend([['orange', 'hypothetical markers (older to right)', { dot: true }], ['red', 'first marker', { dot: true }]]);
        v.readout(() => {
          const head=info.arrive==null?'near-top warming has not crossed the chosen threshold':`near-top threshold first crossed at $t=${v.fix(info.arrive,4)}$ (detection-based rise scale $${v.fix(1/info.arrive,0)}\\,\\kappa/h$)`;
          return `Finite model time $${v.fix(info.t,4)}\\,h^2/\\kappa$: ${head}. ${info.trk} prescribed age markers. Hot-region widths: $T>0.25$ in row ${S.nz-3} near the top, ${v.fix(info.wh,2)}h; $T>0.4$ near 40% height, ${v.fix(info.wid,2)}h. Different thresholds do not define a measured head/tail ratio.`;
        });
      },
    },

    // ───────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Decompression melting',
      statement: String.raw`Rising solid mantle follows an approximately adiabatic path, while the nominally dry peridotite solidus drops faster as pressure falls. Thus sufficiently hot material can cross the solidus and begin to melt during decompression, even without external heating. Melting consumes latent heat and changes both temperature and composition. The amount produced depends on source composition, volatiles, the pressure path and melt extraction; a solidus relation alone does not predict melt fraction or crustal thickness.`,
      idea: String.raw`The chosen illustration uses a solid adiabat $T_a=T_p+\Gamma P$, a polynomial solidus $T_s(P)$ and two constant temperature scales $L/c_p$ and $\Delta T_m$. Its assumed balance is $T_a-T_s=(L/c_p+\Delta T_m)F$, giving $T=T_a-(L/c_p)F$ and positive productivity per pressure drop $-dF/dP=(T_s'(P)-\Gamma)/(L/c_p+\Delta T_m)$. This is an illustrative linear melting closure, not a full isentropic petrological model. A lid deeper than the first crossing can stop the rise before any melting starts.`,
      caption: String.raw`Change potential temperature and the depth where ascent stops. The red solidus is the polynomial version explicitly printed in Hirschmann (2000)'s abstract: $T_s=1120.661+132.899P-5.104P^2$ (°C, GPa). The dashed red curve is a chosen 700 K offset, not a measured liquidus. Dashed blue: unmelted reference adiabat; solid blue: allowed melting interval; orange: chosen melt fraction up to the lid. Gold marks an actual onset along this path. Shading marks depths excluded by the lid. The entire onset/path is visible, including hot cases deeper than 4 GPa.`,
      deps: ['geol-4.7', 'pchem-4.3'],
      refs: ['Hirschmann (2000), abstract and complete §§3–4,6.4–7: polynomial provenance, uncertainty and composition effects', 'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2000GC000070'],
      tags: ['melting', 'solidus', 'adiabat'],
      credit: 'Solidus polynomial version in Hirschmann (2000) abstract; chosen illustrative melting closure',
      scope: String.raw`The abstract, Table 2 and paragraph 39 of the publisher's current full text print conflicting coefficients; this picture identifies exactly the abstract version it uses, rather than silently reconciling the recommended fit. Nominally dry peridotite experiments have compositional and interlaboratory uncertainty. Chosen constants: $\Gamma=15$ K/GPa, $L/c_p=500$ K, $\Delta T_m=700$ K, mantle/crust densities 3300/2900 kg/m³, $g=9.8$ m/s². The displayed equivalent melt column $\int F\,dP/(\rho_c g)$ is the inventory implied by these chosen assumptions, not observed oceanic crust, and does not simulate fractional extraction, active focusing or freezing.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Decompression_melting' },
      verify: true,
      viz(v) {
        const Tp = v.slider('potential temperature $T_p$ (°C)', 1200, 1650, 1350, { step: 5 });
        const lid = v.slider('lithospheric lid thickness (km)', 0, 100, 0, { step: 1 });
        const L=v.stage({x:[1000,2500],y:[-6.5,.2],axes:'box',gutter:true,xlabel:'temperature (°C)',ylabel:'pressure P (GPa; depth increases downward)',height:360,weight:1.2,minWidth:280});
        const R=v.stage({x:[-1,50],y:[-200,5],axes:'box',gutter:true,xlabel:'melt fraction F (%)',ylabel:'depth (km)',height:360,weight:.8,minWidth:220});
        let info = {};
        v.render(() => {
          const tp=Tp.value,Q=decompression(tp,lid.value),{P0,Pl,F}=Q,deep=Math.max(4.2,P0,Pl)*1.07;
          L.setView([Math.min(1000,tp-80),solidus(deep)+MELT.interval+80],[-deep,.2]);
          R.setView([-1,Math.max(30,100*Q.Fmax*1.12)],[-deep*Q.kmPerGPa,6]);
          const ticks=Array.from({length:Math.floor(deep)+1},(_,i)=>[-i,String(i)]);L.setTicks(null,ticks);
          L.curve(P=>[solidus(P),-P],0,deep,{n:160,color:'red',width:2.4});
          L.curve(P=>[solidus(P)+MELT.interval,-P],0,deep,{n:160,color:'red',width:1.2,dash:[3,3],alpha:.7});
          L.line(tp,0,tp+MELT.G*deep,-deep,{color:'accent',dash:true,width:1.6});
          if(!Q.nomelt){L.curve(P=>[Q.path(P),-P],Pl,P0,{n:100,color:'accent',width:2.6});L.dot(tp+MELT.G*P0,-P0,{r:5,color:'gold'});}
          const end=Q.nomelt?Pl:P0,pg=Array.from({length:160},(_,i)=>Pl+(end-Pl)*i/159);
          R.path(pg.map(P=>[100*F(P),-P*Q.kmPerGPa]),{color:'orange',width:2.4});
          if(Q.nomelt)R.corner('No melt along allowed ascent','tl');
          if(Pl>0){L.hband(-Pl,0,{color:'muted',alpha:.12});R.hband(-lid.value,0,{color:'muted',alpha:.25});}
          L.dot(tp,.0,{r:4,color:'accent',label:'$T_p$',labelPos:'n'});
          info=Q;
        });
        v.legend([['red', 'abstract polynomial version'], ['red', 'chosen solidus + 700 K', { dash: true }], ['accent', 'rising mantle path'], ['gold', 'melting begins', { dot: true }]]);
        v.readout(()=>info.nomelt?`Ascent stops at ${lid.value} km before reaching potential onset pressure $P_0=${v.fix(info.P0,3)}$ GPa (${v.fix(info.depth,1)} km): no melting along the allowed path.`:`Model onset $P_0=${v.fix(info.P0,3)}$ GPa (${v.fix(info.depth,1)} km); chosen melt fraction at the lid $${v.fix(100*info.Fmax,2)}\%$. Equivalent melt-column inventory $${v.fix(info.column,2)}$ km, not an observed crustal thickness.`);
      },
    },
  ],
};
