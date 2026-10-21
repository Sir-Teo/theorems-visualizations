// Physical Chemistry — Chapter 4 (part 2): supercritical fluids, surfaces and curvature
import { R, RL } from './ch04.shared.js';
import { coexistencePressure as psat, routeProfile, kelvinLength, ripeningInitial, ripeningStep } from './pchem-source-audit-coexistence.shared.js';
import { waterTension as gammaWater, frameModel, sphereVolume, spherePressure, exchangeSpheres, capillaryModel } from './pchem-source-audit-surfaces.shared.js';

const LIQ = {       // 20 °C: surface tension (N/m), density (kg/m3); values rounded, see item scope
  soap: { name: 'soap solution', g: 0.025 },
  water: { name: 'water', g: 0.0728 },
  ethanol: { name: 'ethanol', g: 0.0224 },
  mercury: { name: 'mercury', g: 0.485 },
};

export default {
  collection: 'pchem',
  chapter: 4,
  items: [
    {
      num: '4.7', kind: 'Phenomenon', name: 'Supercritical fluids and continuity of states',
      statement: String.raw`The ordinary fluid liquid-vapour coexistence curve ends at a critical point. Within a single-fluid description, liquid-like and gas-like states can be connected around that endpoint without a first-order liquid-vapour transition. The conventional supercritical region has $T>T_c$ and $p>p_c$; density and transport properties depend on the state and are not universally “liquid-like” or “gas-like”. Solid phases and other transitions are outside this fluid-only picture.`,
      idea: String.raw`The reduced van der Waals equation is $p_r=8T_r/(3v_r-1)-3/v_r^2$. Below $T_r=1$, candidate liquid and vapour roots have different molar Gibbs energies; their equality is Maxwell’s equal-area condition. Above the critical temperature there is one physical positive-volume root. Arovas §7.2.1, Eqs. 7.11–7.18, derives the free energy, common tangent and equal-area construction, so the selected branch follows a free-energy minimum rather than an arbitrary root (pchem-1.13, pchem-1.14, pchem-1.15).`,
      caption: String.raw`Drag the waypoint or select the preset routes. Density follows the globally stable fluid branch of the reduced van der Waals model. A 500-step sample separates resolved liquid-to-vapour branch changes; it does not use a fixed density-jump threshold. The progress slider moves along this numerical route, not physical time. The preset path around the critical point is continuous; the direct preset crosses coexistence.`,
      deps: ['pchem-1.15', 'pchem-4.1'],
      refs: ['Atkins 4A'],
      tags: ['critical point', 'supercritical', 'continuity of states'],
      credit: 'Fluid critical-point continuity; full modern van der Waals derivation in Arovas',
      scope: String.raw`Fluid-only mean-field model; it does not include solid phases or reproduce real-fluid critical exponents. Source: Arovas §7.2.1, full free-energy/Maxwell derivation. Stable roots are bracketed on the monotone outer branches and compared by Gibbs energy; the coexistence pressure solves equal area. A numerical branch tie represents either coexisting phase, not a computed mixture density. The route has 500 samples: “no crossing resolved” is not a mathematical guarantee for every draggable route. Dimensional CO₂ conversion uses the selected NIST critical values 304.18 K, 73.80 bar and molar mass 44.0095 g/mol; $v_c=3RT_c/(8p_c)$ is the model volume. Its $Z_c=3/8$ is not the real-fluid compressibility. Original historical priority dates are not asserted.`,
      verify: false,
      viz(v) {
        const A = [0.85, 0.7], B = [1.2, 0.7];
        const s = v.stage({ x: [0.75, 1.3], y: [0.2, 2.2], axes: 'box', gutter: true, xlabel: '$T/T_c$', ylabel: '$p/p_c$', height: 340, weight: 1.2, minWidth: 300, title: 'route in the p–T plane' });
        const sd = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, xlabel: 'progress along the route', ylabel: '$\\rho/\\rho_c$', height: 340, weight: 1, minWidth: 280, title: 'density along the route' });
        const W = s.handle(1.02, 1.7, { color: 'purple', r: 8, constrain: { x: [0.78, 1.28], y: [0.25, 2.15] } });
        v.button('route around the critical point', () => W.set(1.02, 1.7));
        v.button('route straight across', () => W.set(1.02, 0.7));
        const u = v.slider('position on route', 0, 1, 0.5, { step: 0.001 });
        const N = 500;
        let prof = [], pts = [], jumps = 0;
        v.render(() => {
          const result=routeProfile([W.x,W.y],N),crossings=new Set(result.crossings);
          pts=result.pts;prof=result.states.map((q,i)=>[i/N,q.rho]);jumps=crossings.size;
          const coex = []; for (let T = 0.75; T < 0.9995; T += 0.005) coex.push([T, psat(T)]); coex.push([1, 1]);
          s.path(coex, { color: 'ink', width: 2.5 });
          s.hline(1, { color: 'muted', dash: true }); s.vline(1, { color: 'muted', dash: true });
          s.dot(1, 1, { r: 5, color: 'red', label: 'critical point', labelPos: 'se' });
          s.text('liquid', 0.8, 1.2, { color: 'teal', size: 14 }); s.text('gas', 1.2, 0.4, { color: 'orange', size: 14 }); s.text('supercritical', 1.15, 1.9, { color: 'purple', size: 13 });
          s.path([A, [W.x, W.y], B], { color: 'purple', width: 2, dash: true });
          s.dot(A[0], A[1], { r: 5, color: 'teal', label: 'A', labelPos: 'nw' }); s.dot(B[0], B[1], { r: 5, color: 'orange', label: 'B', labelPos: 'ne' });
          const segs = []; let cur = [];
          prof.forEach((q, i) => { if (crossings.has(i)) { segs.push(cur); cur = []; } cur.push(q); }); segs.push(cur);
          for (const sg of segs) sd.path(sg, { color: 'purple', width: 2.5 });
          const k = Math.round(u.value * N);
          s.dot(pts[k][0], pts[k][1], { r: 6, color: 'gold' });
          sd.dot(prof[k][0], prof[k][1], { r: 6, color: 'gold' });
          sd.hline(1, { color: 'muted', dash: true });
          if (jumps) sd.corner('sampled liquid–vapour branch change', 'tr', { color: 'red', plate: true });
          else sd.corner('no crossing resolved on sampled route', 'tr', { color: 'green', plate: true });
        });
        v.legend([['purple', 'route / density along it'], ['ink', 'vaporization curve (Maxwell)']]);
        v.readout(() => {
          const k=Math.round(u.value*N),[T,p]=pts[k],d=prof[k][1],Tc=304.18,pc=73.80,vc=3*RL*Tc/(8*pc);
          return `sampled state: $T/T_c=${v.fix(T,3)}$, $p/p_c=${v.fix(p,3)}$, $\\rho/\\rho_c=${v.fix(d,3)}$; chosen CO₂ conversion: ${v.fix(T*Tc,1)} K, ${v.fix(p*pc,2)} bar, model density ${v.fix(44.0095*d/vc,1)} g/L\n${jumps} liquid–vapour branch changes resolved among ${N} path intervals. This is sampled numerical evidence; a small density difference is not automatically discarded. Model critical density ${v.fix(44.0095/vc,1)} g/L, $Z_c=3/8$.`;

        });
      },
    },
    {
      num: '4.9', kind: 'Definition', name: 'Surface tension',
      statement: String.raw`For an isotropic fluid interface at fixed temperature and bulk conditions, reversible area creation costs $\mathrm{d}w=\gamma\,\mathrm{d}A$. Surface tension has units N/m = J/m² and is also the tangential force per unit length. With two identical faces of a film and a sliding bar of length $\ell$, constant $\gamma$ gives $F=2\gamma\ell$ and $W=2\gamma\ell\,\Delta x$. Constant composition or a large equilibrated reservoir is needed to keep $\gamma$ fixed; surfactant redistribution can change it.`,
      idea: String.raw`Creating an interface changes free energy; displacement of the bar creates area $2\ell\,\mathrm{d}x$, so reversible work $F\,\mathrm{d}x=\gamma(2\ell\,\mathrm{d}x)$ gives the force. Bush §§2.3 and 2.6 gives the energy/force definitions and two-interface factor; DeVoe §5.7 treats additional non-expansion work in thermodynamic potentials (pchem-3.10). The rubber comparison is a chosen Hooke-law model: $F(x)=F_0(x-x_0)/(4\,\mathrm{cm})$, hence work is the triangular force integral, not the film’s constant-force work.`,
      caption: String.raw`Drag the sliding bar and change its length. The constant-tension film has constant force; the illustrative Hooke-law sheet has a growing force. The shaded force integral and the readout follow the selected model. Water uses the IAPWS temperature correlation; other liquids use chosen representative tensions for comparison. The frame is schematic and does not simulate film stability or surfactant dynamics.`,
      deps: ['pchem-3.10'],
      refs: ['Atkins Focus 14'],
      tags: ['surface tension', 'Gibbs energy', 'interface'],
      credit: 'Surface free-energy/force description; modern derivation in Bush and DeVoe',
      scope: String.raw`Quasistatic, homogeneous isotropic fluid surfaces with fixed surface tension at each selected temperature. Water: IAPWS R1-76(2014), full interpolating formula and Table 1 (20 °C gives about 72.74 mN/m); its liquid-vapour correlation also permits the tiny extrapolation from the triple point to 0 °C. Soap25, ethanol22.4 and mercury485 mN/m are chosen illustrative constants, not newly validated measurements. A free-standing long-lived film needs additional stability physics; selecting a pure-liquid value changes the force law only. No original historical naming-priority claim is retained. Source force/area derivation: Bush §§2.3, 2.6.`,
      verify: false,
      viz(v) {
        const liq = v.select('liquid', [{ value: 'soap', label: 'soap solution' }, { value: 'water', label: 'water' }, { value: 'ethanol', label: 'ethanol' }, { value: 'mercury', label: 'mercury' }], 'soap');
        const T = v.slider('water temperature', 0, 100, 20, { step: 1, fmt: (x) => `${x} °C` });
        const lt = v.slider('bar length $\\ell$', 3, 12, 7, { step: 0.5, fmt: (x) => `${x} cm` });
        const rub = v.toggle('rubber sheet instead of film', false);
        const s = v.stage({ x: [0, 19], y: [-2, 12], equal: true, axes: false, height: 330, weight: 1.3, minWidth: 300, title: 'film on a wire frame' });
        const sf = v.stage({ x: [3, 14.5], y: [0, 1], axes: 'box', gutter: true, xlabel: 'bar position $x$ / cm', ylabel: '$F$ / mN', height: 330, weight: 1, minWidth: 260, title: 'force on the bar' });
        const bar = s.handle(7, 5, { color: 'ink', r: 9, constrain: { x: [3, 14.5], y: [5, 5] } });
        const x0 = 3;
        const gam = () => (liq.value === 'water' ? gammaWater(T.value + 273.15) : LIQ[liq.value].g);
        v.render(() => {
          T.el.hidden = liq.value !== 'water';
          const g = gam(), l = lt.value, F0 = 2 * g * l * 1e-2 * 1e3;   // mN
          const top = 5 + l / 2, bot = 5 - l / 2, x = bar.x;
          s.rect(1, bot, x, top, { fill: rub.value ? 'orange' : 'accent', fillAlpha: rub.value ? 0.3 : 0.2, stroke: false, hatch: rub.value });
          s.path([[x + 0.6, top], [1, top], [1, bot], [x + 0.6, bot]], { color: 'ink', width: 3 });
          s.segment([x, bot], [x, top], { color: 'ink', width: 6 });
          const F = rub.value ? F0 * (x - x0) / 4 : F0;   // rubber matched to the film at x = 7
          const Fmax = F0 * 3;
          s.arrow(x, 5, x + Math.min(F / Fmax, 1) * 3.2 + 0.05, 5, { color: 'red', width: 2.5 });
          s.text(`F = ${F.toFixed(2)} mN`, x + 0.5, top + 0.5, { color: 'red', size: 12 });
          s.dot(0.9, 5 + l / 2 + 0.4, { r: 0 });
          sf.setView([3, 14.5], [0, Math.max(1, F0 * 3.2)]);
          sf.hline(F0, { color: 'accent', width: 2.5 });
          sf.fn((xx) => F0 * (xx - x0) / 4, { color: 'orange', width: 2, dash: true });
          sf.between(() => 0, (xx) => (rub.value ? F0 * (xx - x0) / 4 : F0), x0, x, { fill: rub.value ? 'orange' : 'accent', fillAlpha: 0.25 });
          sf.dot(x, F, { r: 6, color: 'red' });
        });
        v.legend([['accent', 'liquid film: F = 2γℓ'], ['orange', 'elastic sheet (for comparison)', { dash: true }]]);
        v.readout(() => {
          const g=gam(),a=frameModel(g,lt.value,bar.x,rub.value),dx=bar.x-x0;
          return `$\\gamma=${v.fix(g*1000,2)}$ mN/m (${LIQ[liq.value].name}${liq.value==='water'?` at ${T.value} °C`:', chosen comparison value'}); ${rub.value?'Hooke-law sheet':'two-face constant-tension film'}\nselected force $F=${v.fix(a.F*1000,3)}$ mN at extension ${v.fix(dx,2)} cm; selected work $\\int F\\,\\mathrm{d}x=${v.sci(a.W,4)}$ J${rub.value?' (triangular force integral)':`; new area ${v.fix(a.area*1e4,2)} cm², so $\\gamma\\Delta A=${v.sci(a.W,4)}$ J`}.`;

        });
      },
    },
    {
      num: '4.11', kind: 'Law', name: 'Young–Laplace pressure',
      statement: String.raw`Across a curved liquid–gas interface the pressure is higher on the concave side. For a spherical surface of radius $r$,
$$\Delta p=\frac{2\gamma}{r}$$
(a liquid drop or a gas bubble in a liquid); a soap bubble has two surfaces and $\Delta p=4\gamma/r$. For a general surface $\Delta p=\gamma(1/R_1+1/R_2)$ with principal radii $R_1,R_2$. Smaller bubbles therefore have higher internal pressure.`,
      idea: String.raw`For one spherical interface, $A=4\pi r^2$ and $V=4\pi r^3/3$, so $\Delta p\,\mathrm{d}V=\gamma\,\mathrm{d}A$ gives $2\gamma/r$. A thin soap film has two interfaces, giving approximately $4\gamma/r$ when their radii and tensions are equal (pchem-4.9). Bush §2.6 derives both and §5.1 gives the general normal-stress balance. Connected equal-tension spheres transfer fluid from higher to lower pressure; equal spheres have zero flow in the symmetric model and are unstable to unequal-radius perturbations.`,
      caption: String.raw`Play the schematic pressure-driven transfer between two connected spheres. Select a two-face soap film or a one-interface liquid-drop analogue. Fluid moves from smaller to larger at fixed tension. Radius, tension and interface changes restart the simulation at the chosen initial radii. At the explicit 0.6 cm radius cutoff the model stops; it does not calculate a spherical cap on a tube mouth.`,
      deps: ['pchem-4.9'],
      refs: ['Atkins Focus 14'],
      tags: ['Laplace pressure', 'bubble', 'curvature'],
      credit: 'Young–Laplace balance; full modern derivation in Bush',
      scope: String.raw`Uniform constant tension, quasistatic spherical interfaces, negligible gravity and low excess pressures relative to atmosphere. The soap-film transfer treats total gas volume as conserved only to leading order in $\Delta p/p_{\mathrm{atm}}$; it is not an exact compressible-gas mass balance. One-interface mode is a connected-liquid-sphere analogue. Chosen mobility 0.3 cm³/(Pa s), 0.6 cm cutoff and time scale are illustrative. The actual flow rate uses the selected tension and interface factor. Primary force/energy proof: Bush §2.6, printed 9–10; general signed-curvature balance §5.1, printed 14–16. Original Young/Laplace publication priority is not asserted.`,
      verify: false,
      viz(v) {
        const reset=()=>{S.reset();v.restart();};
        const mode=v.select('interface',[{value:4,label:'soap film (4γ/r)'},{value:2,label:'connected liquid spheres (2γ/r)'}],4,{onChange:reset});
        const g=v.slider('$\\gamma$',10,75,25,{step:1,fmt:x=>`${x} mN/m`,onChange:reset});
        const ra=v.slider('left initial radius',.8,3,1.3,{step:.05,fmt:x=>`${x.toFixed(2)} cm`,onChange:reset});
        const rb=v.slider('right initial radius',.8,3,2.1,{step:.05,fmt:x=>`${x.toFixed(2)} cm`,onChange:reset});
        const S=v.sim(()=>({a:ra.value,b:rb.value,Vt:sphereVolume(ra.value)+sphereVolume(rb.value),done:false}),(st,dt)=>exchangeSpheres(st,dt,g.value*.001,+mode.value/2),{dt:.02});
        const s = v.stage({ x: [-7.5, 7.5], y: [-3.5, 3.5], equal: true, axes: false, height: 320, weight: 1.5, minWidth: 320, title: 'two bubbles on one tube' });
        const sb = v.stage({ x: [0.4, 2.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 240, ylabel: '$\\Delta p$ / Pa', xticks: [[1, 'left'], [2, 'right']], title: 'excess pressure' });
        let st = { a: 1, b: 1 };
        v.animate((t) => {
          S.advance(t);
          st = S.state;
          const a = st.a, b = st.b, k = +mode.value, gm = g.value * 1e-3;
          const pa = k * gm / (a * 1e-2), pb = k * gm / (b * 1e-2);
          const xa = -1.5 - a, xb = 1.5 + b, lim=1.8+2*Math.max(a,b);
          s.setView([-lim,lim],[-Math.max(a,b)-1,Math.max(a,b)+1]);
          s.rect(-1.6, -0.18, 1.6, 0.18, { fill: 'muted', fillAlpha: 0.4, color: 'muted' });
          s.circle(xa, 0, a, { color: 'blue', width: 2.5, fill: 'blue', fillAlpha: 0.12 });
          s.circle(xb, 0, b, { color: 'orange', width: 2.5, fill: 'orange', fillAlpha: 0.12 });
          const dir = pa - pb;
          if (Math.abs(dir) > 0.02 && !st.done) s.arrow(dir > 0 ? -0.9 : 0.9, 0.6, dir > 0 ? 0.9 : -0.9, 0.6, { color: 'green', width: 3 });
          s.text(`${a.toFixed(2)} cm`, xa, a + 0.4, { align: 'center', color: 'blue' }); s.text(`${b.toFixed(2)} cm`, xb, b + 0.4, { align: 'center', color: 'orange' });
          if (st.done) s.corner('stopped at the 0.6 cm model cutoff', 'bl', { plate: true });
          sb.setView([0.4, 2.6], [0, Math.max(pa, pb) * 1.2]);
          sb.bars([pa, pb], { x0: 1, dx: 1, color: (val, i) => ['blue', 'orange'][i] });
        }, { period: 14, still: 6, autoplay: false });
        v.onCleanup(() => {});
        v.readout(() => {
          const k = +mode.value, gm = g.value * 1e-3, pa = k * gm / (st.a * 1e-2), pb = k * gm / (st.b * 1e-2);
          return `$\\Delta p_{\\text{left}}=${k}\\gamma/r=${v.fix(pa, 2)}$ Pa, $\\Delta p_{\\text{right}}=${v.fix(pb, 2)}$ Pa → ${st.done?'model stopped at cutoff; pressure imbalance remains':`fluid flows ${pa > pb ? 'left → right (small into large)' : pa < pb ? 'right → left (small into large)' : 'nowhere (equal radii, unstable balance)'}`}\nthe pressure difference is only ${v.fix(Math.abs(pa - pb), 2)} Pa, about $${v.sci(Math.abs(pa - pb) / 101325, 2)}$ of an atmosphere`;
        });
      },
    },
    {
      num: '4.12', kind: 'Law', name: 'Kelvin equation',
      statement: String.raw`For a spherical drop of incompressible pure liquid in equilibrium with ideal vapour, neglecting the small change of vapour pressure in the liquid’s pressure correction,
$$\ln(p/p^*)\approx\frac{2\gamma V_m}{rRT}.$$
Here $p^*$ is the planar-interface reference at the same temperature. Signed curvature reverses the term for a concave liquid meniscus under the corresponding mechanical conditions. This is not a universal formula for the total pressure of an arbitrary air bubble. The higher equilibrium vapour pressure of smaller drops can drive coarsening in a common vapour, under suitable mass-transfer conditions.`,
      idea: String.raw`Laplace pressure changes the liquid chemical potential by approximately $V_m\Delta p$; equating liquid and vapour chemical potentials gives $RT\ln(p/p^*)\approx V_m(2\gamma/r)$ (pchem-4.11, pchem-3.12). DeVoe §12.8.1, Eqs. 12.8.1–12.8.3, derives this pressure/fugacity relation; combined with the sphere energy proof in Bush §2.6 it supplies the displayed approximation. For water at 20 °C the chosen constant molar volume gives a Kelvin length near 1.08 nm. The separate coarsening panel is a regularized illustrative mean-field model, not a quantitative prediction of real aerosol growth.`,
      caption: String.raw`Left: change temperature, curvature sign and radius (2–1000 nm); the marker stays on the selected equilibrium curve. Right: convex drops exchange liquid through a common vapour in a conservative numerical model. The right panel always represents convex drops, independently of the left curvature selector. Temperature changes restart the numerical experiment. Tiny-drop kinetics below 2 nm are explicitly regularized; colours use the current model growth direction.`,
      deps: ['pchem-4.11', 'pchem-4.4'],
      refs: ['Atkins Focus 14'],
      tags: ['Kelvin equation', 'vapour pressure', 'Ostwald ripening'],
      credit: 'Kelvin curvature relation; pressure/fugacity derivation in DeVoe',
      scope: String.raw`Ideal vapour, constant incompressible liquid molar volume 18.05 cm³/mol, IAPWS tension at the selected temperature, and continuum isotropic curvature. Near molecular radii the macroscopic formula need not be accurate; 2 nm is a display/regularization cutoff, not a validated accuracy threshold. At fixed external gas pressure the omitted vapour-pressure correction is avoided by comparing partial fugacities; for pure vapour it is negligible only when the liquid-volume pressure correction is small. Source derivations: DeVoe §12.8.1 and Bush §2.6. The coarsening law uses chosen diffusivity-scale factor150, saturation $S=\sum r_i e^{a/\max(r_i,2)}/\sum r_i$, and a nonnegative-volume conservative step; it preserves total liquid volume even at disappearance. It omits explicit vapour storage and latent-heat transport; its time/radii are illustrative. Original Kelvin publication dates are not asserted.`,
      verify: false,
      viz(v) {
        const reset=()=>{S.reset();v.restart();};
        const Tk=v.slider('temperature',0,100,20,{step:1,fmt:x=>`${x} °C`,onChange:reset});
        const shape=v.select('surface',[{value:1,label:'convex drop'},{value:-1,label:'concave liquid meniscus'}],1);
        const aOf=()=>kelvinLength(Tk.value+273.15);
        const s=v.stage({x:[2,1000],y:[.45,2],xlog:true,ylog:true,axes:'box',gutter:true,xlabel:'radius $r$ / nm',ylabel:'$p/p^*$',height:340,weight:1.2,minWidth:300,title:'macroscopic Kelvin approximation'});
        const s2=v.stage({x:[.4,12.6],y:[0,30],axes:'box',gutter:true,xlabel:'convex drops in shared vapour',ylabel:'radius / nm',height:340,weight:1,minWidth:280,title:'regularized volume-conserving coarsening'});
        const ratio=r=>Math.exp(+shape.value*aOf()/r);
        const h=s.handle(10,ratio(10),{color:'accent',r:8,constrain:x=>{const r=Math.max(2,Math.min(1000,x));return[r,ratio(r)];}});
        const N0=12;
        const S=v.sim(()=>{const rng=v.rng(21),r=Array.from({length:N0},()=>Math.max(3,Math.min(18,9+4*rng.normal())));return ripeningInitial(r,aOf());},(st,dt)=>ripeningStep(st,dt,aOf()),{dt:.01});
        let live = N0;
        v.animate((t) => {
          S.advance(t);
          const st=S.state,a=aOf(),rstar=a/Math.log(st.S),maxRadius=Math.cbrt(st.total);
          s.hline(1,{color:'muted',dash:true});s.fn(r=>Math.exp(a/r),{domain:[2,1000],color:'accent',width:2.2,alpha:shape.value>0?1:.35});s.fn(r=>Math.exp(-a/r),{domain:[2,1000],color:'purple',width:2.2,alpha:shape.value>0?.35:1});
          s.corner(`Kelvin length ${a.toFixed(3)} nm`,'tr',{color:'muted',plate:true});h.set(h.x,ratio(h.x));
          live=st.r.filter(r=>r>0).length;
          s2.setView([.4,12.6],[0,Math.max(24,maxRadius*1.15,rstar*1.1)]);
          s2.bars(st.r,{x0:1,dx:1,color:r=>r>0&&st.S>Math.exp(a/Math.max(r,2))?'green':'red'});
          if(Number.isFinite(rstar))s2.hline(rstar,{color:'ink',dash:true});
          s2.corner(`S=${st.S.toFixed(4)}; unregularized r*=${rstar.toFixed(2)} nm`,'tr',{plate:true});
        }, { period: 20, still: 12, autoplay: true });
        v.legend([['accent', 'convex drop'], ['purple', 'concave surface'], ['green', 'drop grows'], ['red', 'drop shrinks']]);
        v.readout(() => {
          const a=aOf(),r=h.x,g=gammaWater(Tk.value+273.15),st=S.state,volume=st.r.reduce((sum,x)=>sum+x**3,0),error=(volume-st.total)/st.total;
          return `water model at ${Tk.value} °C: $\\gamma=${v.fix(g*1000,2)}$ mN/m, Kelvin length ${v.fix(a,3)} nm; selected ${+shape.value>0?'convex drop':'concave liquid meniscus'} at $r=${v.fix(r,3)}$ nm gives $p/p^*=${v.fix(ratio(r),5)}$.\nright panel always convex: ${live} drops; conserved $\\sum r_i^3=${v.fix(st.total,2)}$ nm³, relative numerical volume error ${v.sci(error,2)}; sub2nm kinetics regularized, time scale illustrative.`;

        });
      },
    },
    {
      num: '4.13', kind: 'Phenomenon', name: 'Capillary rise',
      statement: String.raw`A liquid in a narrow vertical tube of radius $r$ dipped into a wide pool rises (or is depressed) to a height
$$h=\frac{2\gamma\cos\theta}{\rho g\,r}$$
above (below) the pool level, where $\theta$ is the contact angle of the liquid on the tube wall: a wetting liquid ($\theta<90^\circ$) rises, a non-wetting one such as mercury on glass ($\theta>90^\circ$) is depressed. The height is inversely proportional to the radius (Jurin's law) and is valid when $r$ is much smaller than the capillary length $\sqrt{\gamma/\rho g}$.`,
      idea: String.raw`For a narrow tube, balancing the vertical surface force $2\pi r\gamma\cos\theta$ with the column weight $\rho g\pi r^2h$ gives Jurin’s law. Bush chapter 8, Eq. 8.1, also derives it by energy minimization and the small-Bond-number pressure balance (pchem-4.11). The sign distinguishes rise and depression. The optional zero-angle estimate subtracts $r/3$, the volume-equivalent height difference of a spherical hemispherical meniscus; it is a small-radius geometric estimate, not a wide-tube correction or an exact solution of the gravity-curvature equation.`,
      caption: String.raw`Choose a representative liquid, radius and contact angle. The vertical tube view uses centimetres on both axes; a very narrow tube may be subpixel wide, and wall strokes are drawn for visibility. The signed-height plot preserves depression and zero height at 90°. A solid curve marks $r<0.3\ell_c$; dashed continuation outside that chosen small-radius threshold is a formal extrapolation, with no claimed physical height prediction.`,
      deps: ['pchem-4.11'],
      refs: ['Atkins Focus 14'],
      tags: ['capillarity', 'Jurin’s law', 'wetting'],
      credit: 'Jurin law; full energy, force and pressure derivations in Bush',
      scope: String.raw`Continuum static homogeneous wetting, cylindrical tube, broad reservoir, negligible air density and small radius relative to capillary length. Inputs are chosen illustrative rounded constants: water72.74 mN/m and998 kg/m³, ethanol22.4 and789, mercury485 and13546; contact-angle presets are illustrative and depend on preparation. Water’s tension agrees with the IAPWS20 °C row. Bush chapter 8 gives the complete leading-order derivation; his assumptions include small meniscus size relative to height as well as small Bond number. The 0.3 threshold is a display convention, not a proven accuracy bound. The optional $-r/3$ estimate applies only at exactly zero contact angle. Original priority dates and Rayleigh attribution are not asserted.`,
      verify: false,
      viz(v) {
        const D = { water: [0.07274, 998, 0], ethanol: [0.0224, 789, 0], mercury: [0.485, 13546, 140] };
        const th = v.slider('contact angle $\\theta$', 0, 160, 0, { step: 1, fmt: (x) => `${x}°` });
        const liq = v.select('liquid', [{ value: 'water', label: 'water' }, { value: 'ethanol', label: 'ethanol' }, { value: 'mercury', label: 'mercury' }], 'water', { onChange: () => th.set(D[liq.value][2]) });
        const rr = v.slider('tube radius $r$', 0.03, 10, 0.5, { log: true, sig: 2, fmt: (x) => `${x.toPrecision(2)} mm` });
        const corr = v.toggle('geometric $-r/3$ estimate (θ = 0)', false);
        const g0 = 9.80665;
        const model=r=>{const[g,rho]=D[liq.value];return capillaryModel(g,rho,th.value,r,corr.value);},hOf=r=>model(r).h;
        const s = v.stage({ x: [-6, 6], y: [-4, 20], equal: true, axes: false, height: 400, weight: 1, minWidth: 280, title: 'tube in a pool (cm; wall strokes schematic)' });
        const s2 = v.stage({ x: [0.03, 10], y: [-1000, 1000], xlog: true, axes: 'box', gutter: true, xlabel: 'tube radius $r$ / mm', ylabel: 'signed height $h$ / mm', height: 400, weight: 1.1, minWidth: 300, title: 'Jurin’s law' });
        v.render(() => {
          const r=rr.value,a=model(r),rc=r*.1,h=a.h/10,lc=a.lc;
          const low=Math.min(-2,h-rc-1),high=Math.max(4,h+rc+2),span=high-low,wide=Math.max(3,span*.55);
          s.setView([-wide/2,wide/2],[low,high]);
          s.rect(-wide/2,low,wide/2,0,{fill:LQ(liq.value),fillAlpha:.3,stroke:false});s.hline(0,{color:LQ(liq.value)});
          const wt=rc,wall=.015;
          s.rect(-wt-wall,low,-wt,high-.25,{fill:'ink',fillAlpha:.5,stroke:false});s.rect(wt,low,wt+wall,high-.25,{fill:'ink',fillAlpha:.5,stroke:false});
          s.rect(-wt,low,wt,h,{fill:LQ(liq.value),fillAlpha:.3,stroke:false});s.rect(-wt,h,wt,high-.25,{fill:'panel',stroke:false});
          const c=Math.cos(th.value*Math.PI/180),rad=Math.abs(c)<1e-12?null:wt/Math.abs(c);
          s.curve(t=>{const x=(-1+2*t)*wt;return[x,rad===null?h:h+Math.sign(c)*(rad-Math.sqrt(Math.max(rad*rad-x*x,0)))];},0,1,{color:LQ(liq.value),width:2.5});
          const ax=Math.min(wide*.35,wt+wide*.12);s.arrow(ax,0,ax,h,{color:'red',width:2,both:true});s.corner(`h=${a.h.toFixed(2)} mm`,'br',{color:'red',plate:true});
          const samples=[.03,.1,.3,1,3,10,r].map(x=>hOf(x)),ym=Math.max(1,...samples.map(Math.abs))*1.15;
          s2.setView([.03,10],[-ym,ym]);s2.hline(0,{color:'muted'});
          const cut=.3*lc;
          if(cut>.03)s2.fn(hOf,{domain:[.03,Math.min(10,cut)],color:'accent',width:2.2});
          if(cut<10)s2.fn(hOf,{domain:[Math.max(.03,cut),10],color:'accent',width:1.5,dash:true,alpha:.6});
          s2.dot(r,a.h,{r:7,color:'accent'});s2.vline(lc,{color:'red',dash:true});
          s2.text(`capillary length ${lc.toFixed(2)} mm`,lc*.9,.75*ym,{color:'red',size:10,align:'right'});
          if(!a.narrow)s.corner('wide-tube extrapolation: height not predicted','tl',{color:'orange',plate:true});
        });
        v.readout(() => {
          const a=model(rr.value);
          return `chosen ${liq.value}: $r=${v.fix(rr.value,3)}$ mm, $\\theta=${th.value}°$; ${a.narrow?'narrow-tube estimate':'formal wide-tube extrapolation only'} $h=${v.fix(a.h,3)}$ mm (${a.h>0?'rise':a.h<0?'depression':'zero'})${corr.value&&th.value===0?' including geometric −r/3 estimate':''}\n$r/\\ell_c=${v.fix(a.ratio,3)}$; ${a.narrow?'small-radius illustration; no accuracy bound asserted':'small-radius assumptions fail; no physical height prediction'}. Wall thickness is schematic; fluid radius is not artificially enlarged.`;

        });
      },
    },
  ],
};

function LQ(k) { return k === 'mercury' ? 'muted' : k === 'ethanol' ? 'purple' : 'blue'; }
