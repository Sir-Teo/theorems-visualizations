// Physical Chemistry — Chapter 4 (part 2): supercritical fluids, surfaces and curvature
import { R, vdwPsat, vdwDensity, VDW, gammaWater } from './ch04.shared.js';

const memo = new Map();
const psat = (Tr) => { const k = Math.round(Tr * 2000); if (!memo.has(k)) memo.set(k, vdwPsat(k / 2000)); return memo.get(k); };
const dens = (Tr, pr) => {
  if (Tr >= 1) return vdwDensity(Tr, pr);
  return vdwDensity(Tr, pr);
};

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
      statement: String.raw`Above the critical temperature $T_c$ no pressure condenses a gas, and above the critical pressure $p_c$ heating a liquid never boils it. The liquid and gas phases are therefore not separated by an unbroken line: a path from liquid to vapour that goes around the critical point changes the density continuously, with no phase boundary crossed, whereas a path that crosses the vaporization curve shows a finite jump in density. The region $T>T_c$, $p>p_c$ is the supercritical fluid, with gas-like diffusivity and liquid-like density.`,
      idea: String.raw`In the van der Waals picture (pchem-1.13) the isotherm below $T_c$ has three volume roots between the spinodals, and Maxwell's construction (pchem-1.14) picks the saturation pressure at which liquid and vapour coexist; as $T\to T_c$ the liquid and vapour roots approach each other and merge at the critical point (pchem-1.15), so above it there is always just one root and $\rho(T,p)$ is smooth. Only a path that crosses the coexistence curve switches between the two roots.`,
      caption: String.raw`The waypoint (drag the purple dot) bends the route from the liquid state (left) to the gas state (right) in the reduced $(T/T_c,\;p/p_c)$ plane of a van der Waals fluid; the bottom panel shows the density along the route. Send the route above the critical point and the density slides smoothly; send it straight across the coexistence curve and it jumps. Move the slider to ride along the route; the readout converts to CO$_2$ units.`,
      deps: ['pchem-1.15', 'pchem-4.1'],
      refs: ['Atkins 4A'],
      tags: ['critical point', 'supercritical', 'continuity of states'],
      credit: 'Cagniard de la Tour, 1822 (disappearance of the meniscus); Andrews, 1869 (continuity of the liquid and gaseous states)',
      scope: String.raw`Computed with the van der Waals equation in reduced variables, with saturation pressure from Maxwell's equal-area rule; this model is only semi-quantitative (it gives $Z_c=3/8$, whereas real fluids have $Z_c\approx0.27$). The CO$_2$ conversion uses $T_c=304.13$ K, $p_c=73.77$ bar and the vdW critical volume $3b$, so the densities are model values: the vdW critical density is about 342 kg/m$^3$, below the measured $\approx 468$ kg/m$^3$.`,
      verify: true,
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
        const route = () => {
          const P = [A, [W.x, W.y], B], L = [0, Math.hypot(W.x - A[0], (W.y - A[1]) * 0.4), 0];
          L[2] = L[1] + Math.hypot(B[0] - W.x, (B[1] - W.y) * 0.4);
          return (t) => { const d = t * L[2]; const k = d < L[1] ? 0 : 1; const f = k === 0 ? d / L[1] : (d - L[1]) / (L[2] - L[1]); return [P[k][0] + f * (P[k + 1][0] - P[k][0]), P[k][1] + f * (P[k + 1][1] - P[k][1])]; };
        };
        v.render(() => {
          const r = route();
          pts = []; prof = []; jumps = 0;
          for (let i = 0; i <= N; i++) { const [T, p] = r(i / N); const d = dens(T, p); pts.push([T, p]); prof.push([i / N, d]); if (i && Math.abs(d - prof[i - 1][1]) > 0.3) jumps++; }
          const coex = []; for (let T = 0.75; T < 0.9995; T += 0.005) coex.push([T, psat(T)]); coex.push([1, 1]);
          s.path(coex, { color: 'ink', width: 2.5 });
          s.hline(1, { color: 'muted', dash: true }); s.vline(1, { color: 'muted', dash: true });
          s.dot(1, 1, { r: 5, color: 'red', label: 'critical point', labelPos: 'se' });
          s.text('liquid', 0.8, 1.2, { color: 'teal', size: 14 }); s.text('gas', 1.2, 0.4, { color: 'orange', size: 14 }); s.text('supercritical', 1.15, 1.9, { color: 'purple', size: 13 });
          s.path([A, [W.x, W.y], B], { color: 'purple', width: 2, dash: true });
          s.dot(A[0], A[1], { r: 5, color: 'teal', label: 'A', labelPos: 'nw' }); s.dot(B[0], B[1], { r: 5, color: 'orange', label: 'B', labelPos: 'ne' });
          const segs = []; let cur = [];
          prof.forEach((q, i) => { if (i && Math.abs(q[1] - prof[i - 1][1]) > 0.3) { segs.push(cur); cur = []; } cur.push(q); }); segs.push(cur);
          for (const sg of segs) sd.path(sg, { color: 'purple', width: 2.5 });
          const k = Math.round(u.value * N);
          s.dot(pts[k][0], pts[k][1], { r: 6, color: 'gold' });
          sd.dot(prof[k][0], prof[k][1], { r: 6, color: 'gold' });
          sd.hline(1, { color: 'muted', dash: true });
          if (jumps) sd.corner('density jumps: phase boundary crossed', 'tr', { color: 'red', plate: true });
          else sd.corner('smooth: no boundary crossed', 'tr', { color: 'green', plate: true });
        });
        v.legend([['purple', 'route / density along it'], ['ink', 'vaporization curve (Maxwell)']]);
        v.readout(() => {
          const k = Math.round(u.value * N), [T, p] = pts[k], d = prof[k][1], g = VDW.CO2, vc = 3 * g.b;
          return `at this point: $T/T_c=${v.fix(T, 3)}$, $p/p_c=${v.fix(p, 3)}$, $\\rho/\\rho_c=${v.fix(d, 3)}$ — for CO$_2$: ${v.fix(T * g.Tc, 1)} K, ${v.fix(p * g.pc, 1)} bar, vdW density ≈ ${v.fix(44.01 / (vc / d), 0)} g/L\nthe route ${jumps ? 'crosses the vaporization curve (density jump of about ' + v.fix(Math.max(...prof.slice(1).map((q, i) => Math.abs(q[1] - prof[i][1]))), 2) + ' ρ_c)' : 'stays on one side: liquid and gas are connected continuously'}`;
        });
      },
    },
    {
      num: '4.9', kind: 'Definition', name: 'Surface tension',
      statement: String.raw`The surface tension $\gamma$ of a liquid is the reversible work needed to create unit area of its surface at constant $T$, $p$ and amount: $\gamma=(\partial G/\partial A)_{T,p,n}$, so $\mathrm{d}w=\gamma\,\mathrm{d}A$. It is equivalently a force per unit length acting along the surface, in N/m $=$ J/m$^2$. For a liquid film stretched on a frame with a sliding bar of length $\ell$, the pulling force is $F=2\gamma\ell$ (two faces), independent of how far the bar has moved, unlike an elastic sheet whose force grows with stretching.`,
      idea: String.raw`Molecules in the surface layer have fewer neighbours than those in the bulk, so bringing molecules up to the surface costs Gibbs energy (pchem-3.10) in proportion to the area, which defines $\gamma$. Because the surface's energy per area does not depend on how much surface there already is, the force on the bar is constant: the film flows to refill the new area from the bulk. Since $\gamma$ falls to zero at the critical point, where liquid and gas become identical, it decreases with temperature.`,
      caption: String.raw`Drag the sliding bar to stretch the film. The force stays constant at $2\gamma\ell$ and the work equals $\gamma\,\Delta A$ over both faces; flip to the rubber sheet to see a force that grows with stretch. Pick a liquid and (for water) a temperature to change $\gamma$; the lower panel plots force against position, with the work shaded.`,
      deps: ['pchem-3.10'],
      refs: ['Atkins Focus 14'],
      tags: ['surface tension', 'Gibbs energy', 'interface'],
      credit: 'Concept and name: T. Young, 1805; thermodynamics of surfaces: Gibbs, 1870s',
      scope: String.raw`Values at 20 °C, rounded: water $72.8$ mN/m (temperature dependence from the IAPWS release R1-76 correlation, $\gamma=235.8\,\text{mN/m}\,(1-T/T_c)^{1.256}[1-0.625(1-T/T_c)]$), ethanol $22.4$ mN/m, mercury $\approx485$ mN/m. A soap-film solution is taken as $25$ mN/m (typical, varies with composition); the film's surfactant effects and ageing are ignored. Pure water cannot hold a film; the picture is for a generic film.`,
      verify: true,
      viz(v) {
        const liq = v.select('liquid', [{ value: 'soap', label: 'soap solution' }, { value: 'water', label: 'water' }, { value: 'ethanol', label: 'ethanol' }, { value: 'mercury', label: 'mercury' }], 'soap');
        const T = v.slider('water temperature', 0, 100, 20, { step: 1, fmt: (x) => `${x} °C` });
        const lt = v.slider('bar length $\\ell$', 3, 12, 7, { step: 0.5, fmt: (x) => `${x} cm` });
        const rub = v.toggle('rubber sheet instead of film', false);
        const s = v.stage({ x: [0, 16], y: [0, 10], equal: true, axes: false, height: 330, weight: 1.3, minWidth: 300, title: 'film on a wire frame' });
        const sf = v.stage({ x: [3, 14], y: [0, 1], axes: 'box', gutter: true, xlabel: 'bar position $x$ / cm', ylabel: '$F$ / mN', height: 330, weight: 1, minWidth: 260, title: 'force on the bar' });
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
          sf.setView([3, 14], [0, Math.max(1, F0 * 3.2)]);
          sf.hline(F0, { color: 'accent', width: 2.5 });
          sf.fn((xx) => F0 * (xx - x0) / 4, { color: 'orange', width: 2, dash: true });
          sf.between(() => 0, (xx) => (rub.value ? F0 * (xx - x0) / 4 : F0), x0, x, { fill: rub.value ? 'orange' : 'accent', fillAlpha: 0.25 });
          sf.dot(x, F, { r: 6, color: 'red' });
        });
        v.legend([['accent', 'liquid film: F = 2γℓ'], ['orange', 'elastic sheet (for comparison)', { dash: true }]]);
        v.readout(() => {
          const g = gam(), l = lt.value * 1e-2, x = bar.x, dA = 2 * l * (x - x0) * 1e-2, W = g * dA;
          const F = 2 * g * l;
          return `$\\gamma=${v.fix(g * 1000, 2)}$ mN/m (${LIQ[liq.value].name}${liq.value === 'water' ? ` at ${T.value} °C` : ' at 20 °C'}); $F=2\\gamma\\ell=${v.fix(F * 1000, 2)}$ mN\nstretched by ${v.fix(x - x0, 1)} cm: new surface area $\\Delta A=2\\ell\\Delta x=${v.fix(dA * 1e4, 1)}$ cm², work $W=F\\Delta x=${v.sci(F * (x - x0) * 1e-2, 3)}$ J $=\\gamma\\Delta A=${v.sci(W, 3)}$ J${rub.value ? '\\nthe rubber sheet\\u2019s force instead grows with the stretch' : ''}`;
        });
      },
    },
    {
      num: '4.11', kind: 'Law', name: 'Young–Laplace pressure',
      statement: String.raw`Across a curved liquid–gas interface the pressure is higher on the concave side. For a spherical surface of radius $r$,
$$\Delta p=\frac{2\gamma}{r}$$
(a liquid drop or a gas bubble in a liquid); a soap bubble has two surfaces and $\Delta p=4\gamma/r$. For a general surface $\Delta p=\gamma(1/R_1+1/R_2)$ with principal radii $R_1,R_2$. Smaller bubbles therefore have higher internal pressure.`,
      idea: String.raw`Mechanical balance of a small bubble: pushing out the surface by $\mathrm{d}r$ costs surface work $\gamma\,\mathrm{d}A=\gamma\,8\pi r\,\mathrm{d}r$ (two faces) and is paid for by $\Delta p\,\mathrm{d}V=\Delta p\,4\pi r^2\mathrm{d}r$; equating gives $\Delta p=2\gamma/r$ per face (pchem-4.9). Two bubbles joined by a tube share one gas: the smaller one has the higher pressure, so gas flows from it into the larger, which grows until the small one has shrunk to the tube mouth.`,
      caption: String.raw`Two soap bubbles sit on the ends of a tube. Press play: gas flows from the small high-pressure bubble into the large one, the opposite of what most people expect, until the small bubble is a cap on its tube end. The bars compare $4\gamma/r$. Change the radii to see equal bubbles balance only precariously; switch to a one-surface drop to see the factor 2.`,
      deps: ['pchem-4.9'],
      refs: ['Atkins Focus 14'],
      tags: ['Laplace pressure', 'bubble', 'curvature'],
      credit: 'Young, 1805; Laplace, 1806',
      scope: String.raw`Spherical, static interfaces with $\gamma$ constant. The excess pressures (tens of pascals) are tiny compared with atmospheric pressure, so the model treats the total gas volume as conserved; the flow rate is proportional to $\Delta p$ with an arbitrary rate constant, so the time axis is schematic. $\gamma=25$ mN/m is used for soap solution.`,
      verify: true,
      viz(v) {
        const mode = v.select('interface', [{ value: 4, label: 'soap bubble (4γ/r)' }, { value: 2, label: 'drop / bubble in liquid (2γ/r)' }], 4);
        const g = v.slider('$\\gamma$', 10, 75, 25, { step: 1, fmt: (x) => `${x} mN/m` });
        const ra = v.slider('left bubble radius', 0.8, 3, 1.3, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const rb = v.slider('right bubble radius', 0.8, 3, 2.1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const RT = 0.6, V = (r) => 4 / 3 * Math.PI * r ** 3;
        const S = v.sim(() => ({ a: ra.value, b: rb.value, Vt: V(ra.value) + V(rb.value), done: false }), (st, dt) => {
          if (st.done) return;
          const dp = (1 / st.a - 1 / st.b);                     // proportional to the pressure difference (left minus right)
          const rate = -dp * 3;                                  // dV_a/dt  (cm^3 per schematic second)
          let Va = V(st.a) + rate * dt;
          const lo = V(RT), hi = st.Vt - V(RT);
          if (Va <= lo) { Va = lo; st.done = true; } else if (Va >= hi) { Va = hi; st.done = true; }
          st.a = Math.cbrt(Va * 3 / (4 * Math.PI)); st.b = Math.cbrt((st.Vt - Va) * 3 / (4 * Math.PI));
        }, { dt: 0.02 });
        const s = v.stage({ x: [-7.5, 7.5], y: [-3.5, 3.5], equal: true, axes: false, height: 320, weight: 1.5, minWidth: 320, title: 'two bubbles on one tube' });
        const sb = v.stage({ x: [0.4, 2.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 240, ylabel: '$\\Delta p$ / Pa', xticks: [[1, 'left'], [2, 'right']], title: 'excess pressure' });
        let st = { a: 1, b: 1 };
        v.animate((t) => {
          S.advance(t);
          st = S.state;
          const a = st.a, b = st.b, k = +mode.value, gm = g.value * 1e-3;
          const pa = k * gm / (a * 1e-2), pb = k * gm / (b * 1e-2);
          const xa = -1.5 - a, xb = 1.5 + b;
          s.rect(-1.6, -0.18, 1.6, 0.18, { fill: 'muted', fillAlpha: 0.4, color: 'muted' });
          s.circle(xa, 0, a, { color: 'blue', width: 2.5, fill: 'blue', fillAlpha: 0.12 });
          s.circle(xb, 0, b, { color: 'orange', width: 2.5, fill: 'orange', fillAlpha: 0.12 });
          const dir = pa - pb;
          if (Math.abs(dir) > 0.02 && !st.done) s.arrow(dir > 0 ? -0.9 : 0.9, 0.6, dir > 0 ? 0.9 : -0.9, 0.6, { color: 'green', width: 3 });
          s.text(`${a.toFixed(2)} cm`, xa, a + 0.4, { align: 'center', color: 'blue' }); s.text(`${b.toFixed(2)} cm`, xb, b + 0.4, { align: 'center', color: 'orange' });
          if (st.done) s.corner('stopped: small bubble is a cap on the tube end', 'bl', { plate: true });
          sb.setView([0.4, 2.6], [0, Math.max(pa, pb) * 1.2]);
          sb.bars([pa, pb], { x0: 1, dx: 1, color: (val, i) => ['blue', 'orange'][i] });
        }, { period: 14, still: 6, autoplay: false });
        v.onCleanup(() => {});
        v.readout(() => {
          const k = +mode.value, gm = g.value * 1e-3, pa = k * gm / (st.a * 1e-2), pb = k * gm / (st.b * 1e-2);
          return `$\\Delta p_{\\text{left}}=${k}\\gamma/r=${v.fix(pa, 2)}$ Pa, $\\Delta p_{\\text{right}}=${v.fix(pb, 2)}$ Pa → gas flows ${pa > pb ? 'left → right (small into large)' : pa < pb ? 'right → left (small into large)' : 'nowhere (equal radii, unstable balance)'}\nthe pressure difference is only ${v.fix(Math.abs(pa - pb), 2)} Pa, about $${v.sci(Math.abs(pa - pb) / 101325, 2)}$ of an atmosphere`;
        });
      },
    },
    {
      num: '4.12', kind: 'Law', name: 'Kelvin equation',
      statement: String.raw`The vapour pressure $p$ over a spherical liquid drop of radius $r$ exceeds that over a flat surface $p^*$:
$$\ln\frac{p}{p^*}=\frac{2\gamma V_m}{rRT},$$
with $V_m$ the molar volume of the liquid. For a concave surface (liquid in a pore, a bubble in the liquid) the sign of the exponent reverses and the vapour pressure is lowered. Small drops evaporate while larger ones in the same vapour grow (Ostwald ripening), and a vapour can be supersaturated without condensing for lack of drops large enough to survive.`,
      idea: String.raw`Raising the pressure of a liquid by the Laplace excess $2\gamma/r$ (pchem-4.11) raises its chemical potential by $V_m\,\Delta p$ (pchem-3.12); the vapour in equilibrium with it must have the same chemical potential, and for a perfect-gas vapour $\mu$ changes by $RT\ln(p/p^*)$ (pchem-4.4), so the two expressions are equated. For water at 20 °C the length scale $2\gamma V_m/RT\approx1.08$ nm, so the effect is a 10% rise at $r=10$ nm and a factor of nearly 3 at 1 nm.`,
      caption: String.raw`Left: $p/p^*$ against drop radius on logarithmic axes; drag the point along the curve (convex drop) and flip to the concave pore. Right: a small ensemble of drops sharing the same vapour (animated): the vapour saturation settles at an intermediate value, drops larger than the critical radius $r^*$ (dashed line) grow, smaller ones shrink and vanish.`,
      deps: ['pchem-4.11', 'pchem-4.4'],
      refs: ['Atkins Focus 14'],
      tags: ['Kelvin equation', 'vapour pressure', 'Ostwald ripening'],
      credit: 'W. Thomson (Lord Kelvin), 1870–71',
      scope: String.raw`Perfect-gas vapour, incompressible liquid, constant $\gamma$ (taken from the IAPWS water correlation at the chosen temperature), spherical interface, radii larger than a few molecular diameters (below about 2 nm the macroscopic $\gamma$ is doubtful). $V_m=18.05$ cm$^3$/mol is fixed. The ripening panel uses the mean-field rule $\mathrm{d}r_i/\mathrm{d}t\propto(S-e^{a/r_i})/r_i$ with $S$ fixed by conservation of total liquid volume; its time scale and starting radii are illustrative.`,
      verify: true,
      viz(v) {
        const Tk = v.slider('temperature', 0, 100, 20, { step: 1, fmt: (x) => `${x} °C` });
        const shape = v.select('surface', [{ value: 1, label: 'convex drop' }, { value: -1, label: 'concave (pore, bubble)' }], 1);
        const Vm = 18.05e-6;
        const aOf = () => 2 * gammaWater(Tk.value + 273.15) * Vm / (R * (Tk.value + 273.15)) * 1e9;     // nm
        const s = v.stage({ x: [1, 1000], y: [0.3, 6], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'radius $r$ / nm', ylabel: '$p/p^*$', height: 340, weight: 1.2, minWidth: 300, title: 'vapour pressure over a curved surface' });
        const s2 = v.stage({ x: [0.4, 12.6], y: [0, 24], axes: 'box', gutter: true, xlabel: 'drops (in a common vapour)', ylabel: 'radius / nm', height: 340, weight: 1, minWidth: 280, title: 'Ostwald ripening' });
        const ratio = (r) => Math.exp(+shape.value * aOf() / r);
        const h = s.handle(10, 1.1, { color: 'accent', r: 8, constrain: (x) => { const xx = Math.min(1000, Math.max(1.2, x)); return [xx, Math.max(0.3, Math.min(6, ratio(xx)))]; } });
        const N0 = 12;
        let aNow = aOf();
        const S = v.sim(() => { const rng = v.rng(21); return { r: Array.from({ length: N0 }, () => Math.max(3, Math.min(18, 9 + 4 * rng.normal()))), S: 1 }; }, (st, dt) => {
          const a = aNow, live = st.r.map((r, i) => (r > 0 ? i : -1)).filter((i) => i >= 0);
          let num = 0, den = 0;
          for (const i of live) { num += st.r[i] * Math.exp(a / st.r[i]); den += st.r[i]; }
          st.S = num / den;
          for (const i of live) { const r = st.r[i]; st.r[i] = r + 150 * dt * (st.S - Math.exp(a / r)) / r; if (st.r[i] < 0.8) st.r[i] = 0; }
        }, { dt: 0.01 });
        let live = N0;
        v.animate((t) => {
          aNow = aOf();
          S.advance(t);
          const st = S.state, a = aNow;
          s.hline(1, { color: 'muted', dash: true });
          s.fn((r) => Math.exp(a / r), { domain: [1.2, 1000], color: 'accent', width: 2.2, alpha: shape.value > 0 ? 1 : 0.35 });
          s.fn((r) => Math.exp(-a / r), { domain: [1.2, 1000], color: 'purple', width: 2.2, alpha: shape.value > 0 ? 0.35 : 1 });
          s.vline(a, { color: 'faint', dash: true });
          s.text(`2γVₘ/RT = ${a.toFixed(2)} nm`, a * 1.15, 4.4, { size: 11, color: 'muted' });
          const x = h.x; h.set(x, ratio(x));
          live = st.r.filter((r) => r > 0).length;
          const rs = st.r.map((r, i) => [i + 1, r]);
          s2.bars(rs.map((q) => q[1]), { x0: 1, dx: 1, color: (val) => (val >= a / Math.log(st.S) ? 'green' : 'red') });
          const rstar = a / Math.log(st.S);
          if (isFinite(rstar)) s2.hline(rstar, { color: 'ink', dash: true });
          s2.corner(`vapour: $p/p^*=${st.S.toFixed(3)}$,  $r^*=${isFinite(rstar) ? rstar.toFixed(1) : '∞'}$ nm`, 'tr', { plate: true });
        }, { period: 20, still: 12, autoplay: true });
        v.legend([['accent', 'convex drop'], ['purple', 'concave surface'], ['green', 'drop grows'], ['red', 'drop shrinks']]);
        v.readout(() => {
          const a = aOf(), r = h.x, g = gammaWater(Tk.value + 273.15);
          return `water at ${Tk.value} °C: $\\gamma=${v.fix(g * 1000, 1)}$ mN/m, $2\\gamma V_m/RT=${v.fix(a, 2)}$ nm → at $r=${v.fix(r, 1)}$ nm: $p/p^*=${v.fix(ratio(r), 4)}$\nthe supersaturation a drop of this size needs to survive: ${v.fix((ratio(r) - 1) * 100, 1)}% (relative humidity ${v.fix(ratio(r) * 100, 0)}%) · ${live} drops left in the ripening panel`;
        });
      },
    },
    {
      num: '4.13', kind: 'Phenomenon', name: 'Capillary rise',
      statement: String.raw`A liquid in a narrow vertical tube of radius $r$ dipped into a wide pool rises (or is depressed) to a height
$$h=\frac{2\gamma\cos\theta}{\rho g\,r}$$
above (below) the pool level, where $\theta$ is the contact angle of the liquid on the tube wall: a wetting liquid ($\theta<90^\circ$) rises, a non-wetting one such as mercury on glass ($\theta>90^\circ$) is depressed. The height is inversely proportional to the radius (Jurin's law) and is valid when $r$ is much smaller than the capillary length $\sqrt{\gamma/\rho g}$.`,
      idea: String.raw`The meniscus is a spherical cap of radius $R=r/\cos\theta$, so the Laplace pressure of pchem-4.11 makes the pressure just under it lower than atmospheric by $2\gamma/R=2\gamma\cos\theta/r$. Hydrostatic balance in the liquid then requires a column of height $h$ with $\rho g h=2\gamma\cos\theta/r$. For wide tubes the meniscus is not spherical and the formula fails; a first correction subtracts $r/3$ from $h$ (a wetting liquid, $\theta=0$).`,
      caption: String.raw`Dip a tube of adjustable radius (slider) into the pool (drawn to scale); choose the liquid (this sets the contact angle) or drag the contact angle yourself. The column height follows $1/r$, shown on the log–log plot where the straight line marks the capillary length. Mercury (large angle) is pushed down instead; with a very wide tube the rise disappears.`,
      deps: ['pchem-4.11'],
      refs: ['Atkins Focus 14'],
      tags: ['capillarity', 'Jurin’s law', 'wetting'],
      credit: 'J. Jurin, 1718–19; explained by Young, 1805, and Laplace, 1806',
      scope: String.raw`Static, spherical meniscus, tube much narrower than the capillary length. Liquid data at 20 °C (rounded): water $\gamma=72.8$ mN/m, $\rho=998$ kg/m$^3$, $\theta\approx0^\circ$ on clean glass; ethanol $22.4$ mN/m, $789$ kg/m$^3$, $\theta\approx0^\circ$; mercury $\approx485$ mN/m, $13\,546$ kg/m$^3$, $\theta\approx140^\circ$ on glass (contact angles vary a great deal with surface preparation). The $-r/3$ correction applies to $\theta=0$ only and is shown as an option.`,
      verify: true,
      viz(v) {
        const D = { water: [0.0728, 998, 0], ethanol: [0.0224, 789, 0], mercury: [0.485, 13546, 140] };
        const th = v.slider('contact angle $\\theta$', 0, 160, 0, { step: 1, fmt: (x) => `${x}°` });
        const liq = v.select('liquid', [{ value: 'water', label: 'water' }, { value: 'ethanol', label: 'ethanol' }, { value: 'mercury', label: 'mercury' }], 'water', { onChange: () => th.set(D[liq.value][2]) });
        const rr = v.slider('tube radius $r$', 0.03, 10, 0.5, { log: true, sig: 2, fmt: (x) => `${x.toPrecision(2)} mm` });
        const corr = v.toggle('subtract Rayleigh’s $r/3$ (θ = 0)', false);
        const g0 = 9.80665;
        const hOf = (r) => { const [g, rho] = D[liq.value]; let h = 2 * g * Math.cos(th.value * Math.PI / 180) / (rho * g0 * r * 1e-3) * 1e3; if (corr.value && th.value === 0) h -= r / 3; return h; };     // mm
        const s = v.stage({ x: [-6, 6], y: [-4, 20], equal: true, axes: false, height: 400, weight: 1, minWidth: 280, title: 'tube in a pool (to scale, cm)' });
        const s2 = v.stage({ x: [0.03, 10], y: [0.1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'tube radius $r$ / mm', ylabel: '|$h$| / mm', height: 400, weight: 1.1, minWidth: 300, title: 'Jurin’s law' });
        v.render(() => {
          const [g, rho] = D[liq.value];
          const r = rr.value;
          const rc = r * 0.1, h = hOf(r) / 10;                 // cm
          const lc = Math.sqrt(g / (rho * g0)) * 1e3;           // mm
          const top = Math.max(4, Math.abs(h) * 1.3 + 2);
          s.setView([-top * 0.5, top * 0.5], [-top * 0.2, top]);
          s.rect(-6 * top, -top * 0.2, 6 * top, 0, { fill: LQ(liq.value), fillAlpha: 0.3, stroke: false });
          s.hline(0, { color: LQ(liq.value) });
          const wt = Math.max(rc, 0.02);
          s.rect(-wt - 0.02, -top * 0.15, -wt, top * 0.9, { fill: 'ink', fillAlpha: 0.5, stroke: false });
          s.rect(wt, -top * 0.15, wt + 0.02, top * 0.9, { fill: 'ink', fillAlpha: 0.5, stroke: false });
          const c = Math.cos(th.value * Math.PI / 180), R = wt / Math.max(Math.abs(c), 1e-3);
          const men = (x) => h + Math.sign(c || 1) * (R - Math.sqrt(Math.max(R * R - x * x, 0)));
          const hh = h;
          s.rect(-wt, Math.min(0, hh), wt, Math.max(0, hh), { fill: LQ(liq.value), fillAlpha: 0.3, stroke: false });
          s.curve((t) => [(-1 + 2 * t) * wt, Math.min(men((-1 + 2 * t) * wt), 1e6)], 0, 1, { color: LQ(liq.value), width: 2.5 });
          s.arrow(wt * 0 + wt + top * 0.1 + 0.2, 0, wt + top * 0.1 + 0.2, hh, { color: 'red', width: 2, both: true });
          s.text(`h = ${(hh * 10).toFixed(hh * 10 < 10 ? 2 : 1)} mm`, wt + top * 0.1 + 0.4, hh / 2, { color: 'red', size: 13 });
          s2.fn((x) => Math.max(0.1, Math.abs(hOf0(x))), { color: 'accent', width: 2.2 });
          function hOf0(x) { return hOf(x); }
          s2.dot(r, Math.max(0.1, Math.abs(h * 10)), { r: 7, color: 'accent' });
          s2.vline(lc, { color: 'red', dash: true });
          s2.text(`capillary length ${lc.toFixed(1)} mm`, lc * 0.9, 400, { color: 'red', size: 11, align: 'right' });
        });
        v.readout(() => {
          const [g, rho] = D[liq.value], r = rr.value, h = hOf(r), lc = Math.sqrt(g / (rho * g0)) * 1e3;
          return `$h=2\\gamma\\cos\\theta/(\\rho g r)=${v.fix(h, Math.abs(h) < 10 ? 2 : 1)}$ mm (${h >= 0 ? 'rise' : 'depression'}) for ${liq.value}, $r=${v.fix(r, 2)}$ mm, $\\theta=${th.value}°$\n$r/\\ell_c=${v.fix(r / lc, 2)}$: ${r / lc < 0.3 ? 'narrow-tube regime, Jurin’s law applies' : 'tube too wide for Jurin’s law (meniscus not spherical)'}`;
        });
      },
    },
  ],
};

function LQ(k) { return k === 'mercury' ? 'muted' : k === 'ethanol' ? 'purple' : 'blue'; }
