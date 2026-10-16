// Fluid Dynamics — Chapter 2: Hydrostatics, Euler and Bernoulli
import { G0, RHO_W, P_ATM, clamp, polyArea, polyCentroid, clipBelow, rotate, bisect, cumTrapz, simpson, dip, tableAt, utube } from './ch02.shared.js';

const TAU = 2 * Math.PI;

export default {
  collection: 'fluid',
  chapter: 2,
  title: 'Hydrostatics, Euler and Bernoulli',
  summary: String.raw`At rest, a fluid’s pressure is isotropic and increases with depth just enough to hold up the fluid above it, which is the root of Archimedes’ principle and of the stability of ships. In motion and without viscosity, Newton’s second law for a fluid parcel is Euler’s equation. Along streamlines of a steady flow it integrates to Bernoulli’s theorem, which accounts for draining tanks, Venturi meters and Pitot tubes, while a momentum balance over a control volume gives the forces of jets on plates and vanes, and a famous puzzle about sprinklers run in reverse.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Law',
      name: 'Pascal’s law: pressure is isotropic',
      statement: String.raw`In a fluid at rest (or moving as a rigid body), the force per unit area exerted across a small surface element through a point is normal to the element, compressive, and has the same magnitude $p(\mathbf x)$ whatever the orientation of the element. Pressure is therefore a scalar field. The statement relies on the fluid being unable to carry shear stress when there is no relative motion; in a viscous flow $p$ is defined as the mean normal stress instead.`,
      idea: String.raw`Cut a small wedge out of the fluid. The surface forces on its faces scale like $\ell$ (per unit width) while the weight, a body force, scales like $\ell^2$, so as the wedge shrinks the weight drops out of the balance. Resolving the surface forces horizontally and vertically then forces $p_1=p_3$ and $p_2=p_3$, whatever the angle of the sloping face. If the pressures differed, the wedge would feel a net force of order $\ell$ on a mass of order $\ell^2$, and accelerate without bound as it shrinks, which the fluid at rest does not do.`,
      caption: String.raw`A wedge of water at rest, 2 m below the surface (left), with the pressure pushing on each face, and the tip-to-tail polygon of the four forces (right, drawn in units of $p\ell$). With the default sliders the polygon closes with a small purple step, the weight. Shrink $\ell$: the step vanishes and the three pressures agree, for every angle. Switch on an anisotropy and the polygon refuses to close: the red gap is a net force on a tiny mass.`,
      deps: ['fluid-1.1'],
      refs: ['Kundu §1.7'],
      credit: 'Blaise Pascal, 1650s',
      tags: ['pressure', 'hydrostatics'],
      viz(v) {
        const H = 2, RG = RHO_W * G0;
        const th = v.slider('face angle $\\theta$ (°)', 10, 80, 40, { step: 1 });
        const ell = v.slider('wedge size $\\ell$ (m)', 0.001, 2, 1, { log: true, sig: 2 });
        const an = v.slider('anisotropy $a$: $p_1\\to(1+a)p_1$', -0.3, 0.3, 0, { step: 0.01 });
        const w = v.stage({ x: [-1.6, 1.9], y: [-1.1, 1.5], equal: true, axes: false, height: 300, title: 'wedge of water at rest, pressure on each face' });
        const f = v.stage({ x: [-1.3, 1.3], y: [-1.3, 0.8], equal: true, axes: false, height: 300, title: 'force polygon in units of $p\\ell$' });
        let info = {};
        v.render(() => {
          const t = (th.value * Math.PI) / 180, L = ell.value, dz = L * Math.sin(t), dx = L * Math.cos(t);
          const pg = (z) => RG * (H - z);
          const p1 = (1 + an.value) * pg(dz / 2), p2 = pg(0), p3 = pg(dz / 2);
          const F1 = [p1 * dz, 0], F3 = [-p3 * dz, -p3 * dx], F2 = [0, p2 * dx], W = [0, -RG * 0.5 * dx * dz];
          const net = [F1[0] + F2[0] + F3[0] + W[0], F1[1] + F2[1] + F3[1] + W[1]];
          const nrm = p3 * L, mass = RHO_W * 0.5 * dx * dz;
          // wedge (normalised to hypotenuse 1), right angle at the bottom left
          const cx = Math.cos(t), sz = Math.sin(t), ox = -0.5 * cx, oy = -0.5 * sz;
          const A = [ox, oy], B = [ox + cx, oy], C = [ox, oy + sz];
          w.poly([A, B, C], { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          const pref = RG * H, len = (p) => 0.62 * (p / pref);
          const nx = Math.sin(t), ny = Math.cos(t);
          const mid = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
          w.arrow(A[0] - len(p1), (A[1] + C[1]) / 2, A[0], (A[1] + C[1]) / 2, { color: 'accent', width: 3, head: 9 });
          w.arrow((A[0] + B[0]) / 2, A[1] - len(p2), (A[0] + B[0]) / 2, A[1], { color: 'accent', width: 3, head: 9 });
          w.arrow(mid[0] + nx * len(p3), mid[1] + ny * len(p3), mid[0], mid[1], { color: 'accent', width: 3, head: 9 });
          w.tex('p_1', A[0] - len(p1) - 0.1, (A[1] + C[1]) / 2, { align: 'right' });
          w.tex('p_2', (A[0] + B[0]) / 2 + 0.12, A[1] - len(p2) - 0.05, { align: 'left' });
          w.tex('p_3', mid[0] + nx * len(p3) + 0.05, mid[1] + ny * len(p3) + 0.1, { align: 'left' });
          w.text('$\\theta$', B[0] - 0.22, B[1] + 0.05, { size: 13, color: 'muted' });
          w.arrow(-1.5, -0.55, -1.5, -0.95, { color: 'purple', width: 2.5, head: 7 });
          w.text('weight $\\propto\\ell^2$', -1.4, -0.75, { size: 11, color: 'purple', align: 'left' });
          // force polygon
          const s = 1 / nrm, P0 = [0, 0], P1 = [F1[0] * s, 0], P2 = [P1[0] + F3[0] * s, P1[1] + F3[1] * s];
          const P3 = [P2[0] + F2[0] * s, P2[1] + F2[1] * s], P4 = [P3[0] + W[0] * s, P3[1] + W[1] * s];
          const sh = [-0.2, 0.25];
          const q = (p) => [p[0] + sh[0], p[1] + sh[1]];
          f.arrow(...q(P0), ...q(P1), { color: 'accent', width: 3, head: 8 });
          f.arrow(...q(P1), ...q(P2), { color: 'accent', width: 3, head: 8 });
          f.arrow(...q(P2), ...q(P3), { color: 'accent', width: 3, head: 8 });
          f.arrow(...q(P3), ...q(P4), { color: 'purple', width: 3, head: 8 });
          f.tex('p_1\\,\\mathrm{d}z', (q(P0)[0] + q(P1)[0]) / 2, q(P0)[1] + 0.1, { size: 12 });
          f.tex('p_3\\,\\ell', (q(P1)[0] + q(P2)[0]) / 2 + 0.25, (q(P1)[1] + q(P2)[1]) / 2, { size: 12 });
          f.tex('p_2\\,\\mathrm{d}x', q(P2)[0] - 0.08, (q(P2)[1] + q(P3)[1]) / 2, { size: 12, align: 'right' });
          if (Math.hypot(net[0], net[1]) * s > 0.004) f.arrow(...q(P4), ...q(P0), { color: 'red', width: 3, head: 8 });
          info = { p1, p2, p3, net, acc: Math.hypot(...net) / mass, L };
        });
        v.legend([['accent', 'pressure forces'], ['purple', 'weight'], ['red', 'unbalanced force']]);
        v.readout(() => {
          const { p1, p2, p3, net, acc } = info, k = (x) => v.fix(x / 1000, 3);
          return `$p_1=${k(p1)}$, $p_2=${k(p2)}$, $p_3=${k(p3)}$ kPa (gauge) · spread $(p_{\\max}-p_{\\min})/p_3=${v.fix((100 * (Math.max(p1, p2, p3) - Math.min(p1, p2, p3))) / p3, 3)}\\%$\nnet force on the wedge $${v.fix(Math.hypot(...net), 3)}$ N/m, acceleration $${v.sci(acc, 2)}$ m/s² → **${acc < 1e-6 ? 'in equilibrium' : 'not in equilibrium: the pressures must have been isotropic'}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Law',
      name: 'Hydrostatic equilibrium',
      statement: String.raw`A fluid of density $\rho$ at rest in a uniform gravitational field $\mathbf g=-g\hat{\mathbf z}$ satisfies $\nabla p=\rho\mathbf g$, i.e. $\dfrac{dp}{dz}=-\rho g$ with $p$ constant on horizontal planes. For a liquid of constant density, $p(h)=p_0+\rho g h$ at depth $h$ below a free surface carrying pressure $p_0$; in a stack of layers the pressures add, so the graph of $p$ against depth is piecewise linear with slope $\rho_i g$ in layer $i$ and the heavier liquid must lie below.`,
      idea: String.raw`Take a thin horizontal slab of area $S$ and thickness $\delta z$. It is at rest, so the pressure on its lower face minus the pressure on its upper face carries its weight: $S\,[p(z)-p(z+\delta z)]=\rho g S\,\delta z$. Dividing by $S\,\delta z$ gives $p'(z)=-\rho g$. Isotropy (2.1) is what lets one number $p$ describe the push on the slab's faces, and sideways forces cancel because $p$ depends on $z$ alone.`,
      caption: String.raw`Drag the gauge up and down the tank. The reading grows linearly with depth, with a slope that is exactly $\rho g$ for the liquid it sits in (the dashed tangent). Pick a liquid or a stratified pair, change $g$, or evacuate the lid, and the slope and intercept change as the formula says.`,
      deps: ['fluid-2.1', 'mech-1.17'],
      refs: ['Kundu §1.7'],
      tags: ['hydrostatics', 'pressure'],
      scope: String.raw`Static fluid, uniform $g$, $\rho$ constant within each layer (for a gas $\rho$ varies with $p$; use $dp/dz=-\rho g$ with an equation of state).`,
      viz(v) {
        const D = 5;
        const LQ = {
          water: { label: 'water', L: [[1000, 5, 'accent']] },
          sea: { label: 'seawater', L: [[1025, 5, 'teal']] },
          oil: { label: 'oil', L: [[800, 5, 'orange']] },
          hg: { label: 'mercury', L: [[13546, 5, 'muted']] },
          ow: { label: 'oil on water', L: [[800, 2, 'orange'], [1000, 3, 'accent']] },
          wm: { label: 'water on mercury', L: [[1000, 4.4, 'accent'], [13546, 0.6, 'muted']] },
        };
        const sel = v.select('liquid', Object.entries(LQ).map(([k, o]) => ({ value: k, label: o.label })), 'water');
        const gs = v.slider('gravity $g$ (m/s²)', 1.6, 24.8, G0, { step: 0.05 });
        const lid = v.toggle('top open to the atmosphere', true);
        const tank = v.stage({ x: [-0.4, 4.4], y: [-D - 0.3, 0.6], axes: false, height: 340, title: 'tank with a gauge' });
        const plot = v.stage({ x: [0, D], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'depth h (m)', ylabel: 'p (kPa)', title: 'absolute pressure against depth' });
        const gh = tank.handle(2, -2, { color: 'gold', r: 9, label: 'gauge', labelPos: 'e', constrain: 'y' });
        const pAt = (d, L, g, p0) => { let p = p0, top = 0; for (const [rho, th] of L) { p += rho * g * clamp(d - top, 0, th); top += th; } return p; };
        let info = {};
        v.render(() => {
          const L = LQ[sel.value].L, g = gs.value, p0 = lid.value ? P_ATM : 0;
          gh.set(2, clamp(gh.y, -D + 0.05, -0.05));
          const d = -gh.y;
          let top = 0;
          for (const [rho, th, col] of L) {
            tank.rect(0, -top - th, 4, -top, { fill: col, fillAlpha: 0.3, color: col, width: 1 });
            tank.text(`${v.fix(rho, 0)} kg/m³`, 0.1, -top - th + 0.25, { size: 11, color: 'ink', align: 'left' });
            top += th;
          }
          tank.path([[0, 0.3], [0, -D], [4, -D], [4, 0.3]], { color: 'ink', width: 3 });
          if (!lid.value) tank.rect(0, 0, 4, 0.12, { fill: 'ink', fillAlpha: 0.5, color: 'ink' });
          tank.text(lid.value ? '$p_0=101.3$ kPa' : '$p_0=0$ (lid, vacuum above)', 0.1, 0.4, { size: 12, color: 'muted', align: 'left' });
          // slab check next to the gauge
          const dl = 0.25, ptop = pAt(d - dl, L, g, p0), pbot = pAt(d + dl, L, g, p0), pmax = pAt(D, L, g, p0);
          tank.rect(2.6, -d - dl, 3.4, -d + dl, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.5 });
          const al = (p) => 0.8 * (p / pmax) + 0.15;
          tank.arrow(3, -d + dl + al(ptop), 3, -d + dl, { color: 'red', width: 2.5, head: 7 });
          tank.arrow(3, -d - dl - al(pbot), 3, -d - dl, { color: 'green', width: 2.5, head: 7 });
          tank.text('slab', 3.55, -d, { size: 11, color: 'muted', align: 'left' });
          // plot
          plot.setView([0, D], [0, 1.08 * pmax / 1000]);
          const pts = []; for (let i = 0; i <= 100; i++) { const x = (D * i) / 100; pts.push([x, pAt(x, L, g, p0) / 1000]); }
          plot.path(pts, { color: 'accent', width: 2.6 });
          const pd = pAt(d, L, g, p0), eps = 1e-4;
          const slope = (pAt(d + eps, L, g, p0) - pAt(d - eps, L, g, p0)) / (2 * eps);
          plot.line(d - 1, (pd - slope) / 1000, d + 1, (pd + slope) / 1000, { color: 'orange', dash: true, width: 1.8 });
          plot.dot(d, pd / 1000, { r: 7, color: 'gold' });
          plot.hline(p0 / 1000, { color: 'faint', dash: true });
          let rhoLocal = 0; top = 0; for (const [rho, th] of L) { if (d >= top && d <= top + th) rhoLocal = rho; top += th; }
          info = { d, pd, p0, slope, rhoLocal, g, pbot, ptop, dl };
        });
        v.legend([['accent', '$p(h)$'], ['orange', 'tangent: slope $\\rho g$', { dash: true }], ['gold', 'gauge']]);
        v.readout(() => {
          const { d, pd, p0, slope, rhoLocal, g, pbot, ptop, dl } = info;
          return `depth $h=${v.fix(d, 2)}$ m: $p=${v.fix(pd / 1000, 2)}$ kPa $=p_0+${v.fix((pd - p0) / 1000, 2)}$ kPa gauge · slope $dp/dh=${v.fix(slope, 0)}$ Pa/m vs $\\rho g=${v.fix(rhoLocal * g, 0)}$ Pa/m\nslab of thickness $${v.fix(2 * dl, 2)}$ m: pressure difference $${v.fix(pbot - ptop, 1)}$ Pa = weight per area $\\rho g\\,\\delta z=${v.fix(rhoLocal * g * 2 * dl, 1)}$ Pa`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Paradox',
      name: 'Hydrostatic paradox',
      statement: String.raw`The force that a liquid exerts on the flat base of a vessel is $F=\rho g h A$, where $h$ is the depth and $A$ the base area, and is independent of the shape of the vessel: wide-topped, straight-sided and narrow-topped vessels of equal base and depth press equally on their bases, although they hold very different weights of liquid. The apparent paradox disappears once the vertical force of the sloping walls on the liquid is included: $F_{\rm base}+F_{\rm wall,\,z}=W$.`,
      idea: String.raw`By hydrostatic equilibrium (2.2) the base pressure is $\rho g h$ whatever lies above, and pressure is the same at all points of the base, so the base force is $\rho g h A$. The liquid itself is in equilibrium, so base force, weight and the vertical force of the walls must balance. For a wall sloping outward ($r'>0$) the wall pushes up on the liquid and the vessel weighs more than the base feels; for a wall sloping inward the wall holds some of the liquid up from above and pushes down.`,
      caption: String.raw`Four vessels with the same base and depth. Change the depth or how strongly the walls flare. The base force (blue) is the same in all four and equals the weight only in the straight vessel. The green bars are the vertical wall forces on the liquid, computed by integrating pressure over the curved wall, and they make up the difference exactly.`,
      deps: ['fluid-2.2'],
      refs: ['Kundu §1.7'],
      credit: 'Simon Stevin, 1586; Blaise Pascal, 1650s',
      tags: ['hydrostatics', 'paradox'],
      viz(v) {
        const R0 = 5; // cm
        const hs = v.slider('depth $h$ (cm)', 5, 30, 20, { step: 0.5 });
        const fs = v.slider('flare', 0, 1, 0.8, { step: 0.02 });
        const names = ['straight', 'widening', 'narrowing', 'bulging'];
        const prof = [(z, h, f) => R0, (z, h, f) => R0 * (1 + f * z / h), (z, h, f) => R0 * (1 - 0.6 * f * z / h), (z, h, f) => R0 * (1 + f * Math.sin(Math.PI * z / h))];
        const s = v.stage({ x: [0, 104], y: [-21, 38], equal: true, axes: false, height: 300, full: true, title: 'four vessels, one base area, one depth' });
        const bars = v.stage({ x: [0.4, 4.6], y: [-1, 1], axes: 'box', gutter: true, height: 250, ylabel: 'force (N)', xticks: names.map((n, i) => [i + 1, n]), title: 'vertical forces on the liquid' });
        let info = [];
        v.render(() => {
          const h = hs.value, f = fs.value, h0 = h / 100;
          info = prof.map((r, i) => {
            const rm = (zm) => r(zm * 100, h, f) / 100;
            const dr = (zm) => (rm(zm + 1e-6) - rm(zm - 1e-6)) / 2e-6;
            const Wt = RHO_W * G0 * simpson((zm) => Math.PI * rm(zm) ** 2, 0, h0, 400);
            const Fb = RHO_W * G0 * h0 * Math.PI * (R0 / 100) ** 2;
            const Fw = simpson((zm) => RHO_W * G0 * (h0 - zm) * 2 * Math.PI * rm(zm) * dr(zm), 0, h0, 400);
            return { W: Wt, Fb, Fw, name: names[i] };
          });
          const fmax = Math.max(...info.map((o) => Math.max(o.W, o.Fb))), asc = 14 / fmax;
          info.forEach((o, i) => {
            const cx = 13 + 26 * i, pts = [];
            for (let k = 0; k <= 40; k++) pts.push([cx + prof[i]((h * k) / 40, h, f), (h * k) / 40]);
            for (let k = 40; k >= 0; k--) pts.push([cx - prof[i]((h * k) / 40, h, f), (h * k) / 40]);
            s.poly(pts, { fill: 'accent', fillAlpha: 0.22, color: 'ink', width: 2.2 });
            s.arrow(cx - 1.6, -0.3, cx - 1.6, -0.3 - o.Fb * asc, { color: 'accent', width: 3, head: 7 });
            s.arrow(cx + 1.6, -0.3, cx + 1.6, -0.3 - o.W * asc, { color: 'purple', width: 3, head: 7 });
            s.text(names[i], cx, h + 3.5, { size: 12, color: 'muted', align: 'center' });
          });
          s.hline(h, { color: 'accent', dash: true, alpha: 0.6 });
          s.text('base force', 4, -19.5, { size: 11, color: 'accent', align: 'left' });
          s.text('weight', 30, -19.5, { size: 11, color: 'purple', align: 'left' });
          const top = Math.max(...info.map((o) => Math.max(o.W, o.Fb, o.Fw))), bot = Math.min(0, ...info.map((o) => o.Fw));
          bars.setView([0.4, 4.6], [bot * 1.25 - 0.05 * top, top * 1.18]);
          bars.hline(0, { color: 'ink', width: 1 });
          info.forEach((o, i) => {
            const bar = (dx, val, col) => bars.rect(i + 1 + dx - 0.12, 0, i + 1 + dx + 0.12, val, { fill: col, fillAlpha: 0.6, color: col, width: 1.2 });
            bar(-0.28, o.Fb, 'accent'); bar(0, o.Fw, 'green'); bar(0.28, o.W, 'purple');
          });
        });
        v.legend([['accent', 'force on the base $\\rho g h A$'], ['green', 'vertical wall force on the liquid'], ['purple', 'weight of the liquid']]);
        v.readout(() => `base forces: ${info.map((o) => v.fix(o.Fb, 2)).join(', ')} N (all equal)\nweights: ${info.map((o) => v.fix(o.W, 2)).join(', ')} N · check $F_{\\rm base}+F_{\\rm wall}-W$: ${info.map((o) => v.sci(o.Fb + o.Fw - o.W, 1)).map((x) => '$' + x + '$').join(', ')} N`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Principle',
      name: 'Static stability of a stratified fluid',
      statement: String.raw`A stratified fluid at rest is statically stable if a parcel displaced vertically and carried adiabatically meets surroundings that push it back. For an ideal gas atmosphere with temperature profile $T_e(z)$ this holds when the environmental lapse rate $\Gamma=-dT_e/dz$ is smaller than the dry adiabatic rate $\Gamma_d=g/c_p\approx9.8$ K/km. A displacement $\zeta$ then obeys $\ddot\zeta=-N^2\zeta$ with $N^2=\dfrac{g}{T}(\Gamma_d-\Gamma)$; for $\Gamma>\Gamma_d$, $N^2<0$ and the displacement grows exponentially.`,
      idea: String.raw`A parcel lifted by $\zeta$ keeps the ambient pressure, expands and cools at the adiabatic rate, so its temperature is $T_e(z_0)-\Gamma_d\zeta$ while the air around it has $T_e(z_0)-\Gamma\zeta$. Its buoyant acceleration is $g(T_p-T_e)/T_e=-g(\Gamma_d-\Gamma)\zeta/T$ by Archimedes’ principle (the parcel feels the pressure gradient of the surroundings, which is hydrostatic by 2.2), a linear restoring force when $\Gamma<\Gamma_d$. The lapse rate of dry air follows from hydrostatic balance combined with the adiabatic gas law.`,
      caption: String.raw`The environmental temperature (blue, left) falls with height at rate $\Gamma$. Drag the handle to displace a parcel; it then rises or sinks adiabatically (red line), and the trace on the right shows $\zeta(t)$ from a numerical integration of its buoyancy, compared with the linear prediction (dashed). Slide $\Gamma$ through $\Gamma_d$: oscillation at the buoyancy frequency becomes runaway.`,
      deps: ['fluid-2.2', 'thermo-1.18'],
      refs: ['Kundu §1.10'],
      tags: ['stability', 'stratification', 'buoyancy'],
      scope: String.raw`Dry air treated as an ideal gas, small displacements for the analytic frequency (the plotted trajectory is nonlinear), no mixing with the surroundings, no condensation (moist air has a smaller adiabatic rate).`,
      viz(v) {
        const g = G0, cp = 1004, Gd = (g / cp) * 1000, T0 = 288, z0 = 1000;
        const Gs = v.slider('environmental lapse rate $\\Gamma$ (K/km)', -6, 16, 4, { step: 0.1 });
        const prof = v.stage({ x: [256, 296], y: [0, 2], axes: 'box', gutter: true, height: 320, xlabel: 'T (K)', ylabel: 'z (km)', title: 'temperature against height' });
        const ts = v.stage({ x: [0, 1], y: [-800, 800], axes: 'box', gutter: true, height: 320, xlabel: 't (s)', ylabel: 'ζ (m)', title: 'displacement of the parcel' });
        const Te = (zm) => T0 - (Gs.value * zm) / 1000;
        const h = prof.handle(Te(1250), 1.25, { color: 'gold', r: 9, label: 'displace', labelPos: 'e', constrain: (x, y) => { const yy = clamp(y, 0.4, 1.7); return [Te(yy * 1000), yy]; } });
        let cache = { key: '', tr: [], Tmax: 100 };
        const traj = () => {
          const key = Gs.value + '|' + h.y.toFixed(4);
          if (cache.key === key) return cache;
          const G = Gs.value, zi = h.y * 1000;
          const N2 = (g / T0) * ((Gd - G) / 1000);
          const Tmax = N2 > 1e-6 ? Math.min(3600, (3 * TAU) / Math.sqrt(N2)) : N2 < -1e-6 ? Math.min(3600, 6 / Math.sqrt(-N2)) : 3600;
          const acc = (z) => { const Tp = Te(z0) - (Gd * (z - z0)) / 1000, Tev = Te(z); return (g * (Tp - Tev)) / Tev; };
          const tr = [[zi - z0, 0]]; let z = zi, w = 0; const dt = 1;
          for (let t = 0; t < Tmax; t += dt) {
            const k1z = w, k1w = acc(z), k2z = w + 0.5 * dt * k1w, k2w = acc(z + 0.5 * dt * k1z), k3z = w + 0.5 * dt * k2w, k3w = acc(z + 0.5 * dt * k2z), k4z = w + dt * k3w, k4w = acc(z + dt * k3z);
            z += (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z); w += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
            if (Math.abs(z - z0) > 1000) { z = z0 + Math.sign(z - z0) * 1000; w = 0; }
            tr.push([z - z0, w]);
          }
          let tc = null; for (let i = 1; i < tr.length; i++) if (tr[0][0] * tr[i][0] <= 0) { tc = i - 1 + tr[i - 1][0] / (tr[i - 1][0] - tr[i][0]); break; }
          cache = { key, tr, Tmax, N2, tc, d0: zi - z0 }; return cache;
        };
        let info = {};
        v.animate((t) => {
          const c = traj(), sec = (t / 40) * c.Tmax, i = Math.min(c.tr.length - 1, Math.round(sec)), zeta = c.tr[i][0], z = z0 + zeta;
          prof.setView([256, 296], [0, 2]);
          prof.line(Te(0), 0, Te(2000), 2, { color: 'accent', width: 3 });
          prof.line(Te(z0) - (Gd * (0 - z0)) / 1000, 0, Te(z0) - (Gd * (2000 - z0)) / 1000, 2, { color: 'red', width: 2, dash: true });
          prof.hline(1, { color: 'faint', dash: true });
          const Tp = Te(z0) - (Gd * zeta) / 1000, Tev = Te(z);
          prof.dot(Tp, z / 1000, { r: 8, color: 'red' });
          prof.dot(Tev, z / 1000, { r: 4, color: 'accent' });
          const ab = (g * (Tp - Tev)) / Tev;
          prof.arrow(Tp, z / 1000, Tp, z / 1000 + clamp(ab * 6, -0.45, 0.45), { color: 'green', width: 3, head: 8 });
          ts.setView([0, c.Tmax], [-1000, 1000]);
          const pts = c.tr.map((p, k) => [k, p[0]]);
          ts.path(pts, { color: 'red', width: 2.4 });
          const lin = []; for (let k = 0; k <= 120; k++) { const tt = (c.Tmax * k) / 120; lin.push([tt, clamp(c.N2 > 0 ? c.d0 * Math.cos(Math.sqrt(c.N2) * tt) : c.d0 * Math.cosh(Math.sqrt(-c.N2) * tt), -1000, 1000)]); }
          ts.path(lin, { color: 'ink', width: 1.4, dash: true, alpha: 0.7 });
          ts.vline(sec, { color: 'gold', width: 1.8 });
          ts.hline(0, { color: 'faint' });
          info = { c, zeta, N2: c.N2, ab };
        }, { period: 40, still: 18 });
        v.legend([['accent', 'environment'], ['red', 'parcel (adiabat)'], ['green', 'buoyancy acceleration'], ['ink', 'linear theory', { dash: true }]]);
        v.readout(() => {
          const { c } = info, N2 = c.N2, G = Gs.value;
          if (N2 > 1e-7) return `$\\Gamma=${v.fix(G, 1)}<\\Gamma_d=${v.fix(Gd, 2)}$ K/km: $N^2=${v.sci(N2, 2)}$ s⁻² → stable, period $2\\pi/N=${v.fix(TAU / Math.sqrt(N2), 0)}$ s; simulated period (4× first zero crossing) $${c.tc == null ? '—' : v.fix(4 * c.tc, 0)}$ s`;
          return `$\\Gamma=${v.fix(G, 1)}\\ge\\Gamma_d=${v.fix(Gd, 2)}$ K/km: $N^2=-${v.sci(Math.abs(N2), 2)}$ s⁻² → **${N2 < -1e-7 ? 'unstable: the displacement grows like $e^{\\sqrt{-N^2}\\,t}$' : 'neutral'}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Law',
      name: 'Archimedes’ principle',
      statement: String.raw`A body immersed, wholly or partly, in a fluid at rest is acted on by a net force from the fluid pressure that is directed upward, has magnitude equal to the weight of the fluid it displaces, $B=\rho_f g V_{\rm disp}$, and acts through the centroid of the displaced volume (the centre of buoyancy). A body floats in equilibrium when this equals its own weight, which for a floating body means that it displaces its own weight of fluid.`,
      idea: String.raw`Imagine the body replaced by fluid of the same shape. That fluid was at rest, so the pressure over its surface must exactly hold up its weight, and the pressure field does not know what lies behind the surface. Hence the pressure force on the body is the weight of the displaced fluid. In formulas, $-\oint p\,\mathbf n\,dS=-\int\nabla p\,dV=-\int\rho_f\mathbf g\,dV$ by the divergence theorem and hydrostatic balance (2.2).`,
      caption: String.raw`The buoyant force is computed here only by adding up $-p\,\mathbf n\,\mathrm ds$ over the wetted edges of the body (the blue arrows), without using the principle. Pick a shape and a density and let it float, or switch that off and drag the body up and down: the green force (and the right-hand plot) agrees with the displaced area, and the body comes to rest where it equals the red weight.`,
      deps: ['fluid-2.2', 'pma-10.51'],
      refs: ['Kundu §1.7'],
      credit: 'Archimedes of Syracuse, c. 250 BC',
      tags: ['buoyancy', 'hydrostatics'],
      viz(v) {
        const DEP = 2.2, W2 = 2.2;
        const SH = {
          ellipse: () => { const P = []; for (let i = 0; i < 96; i++) { const a = (TAU * i) / 96; P.push([1.1 * Math.cos(a), 0.7 * Math.sin(a)]); } return P; },
          block: () => [[-1, -0.6], [1, -0.6], [1, 0.6], [-1, 0.6]],
          wedge: () => [[-1.2, -0.7], [1.2, -0.7], [0, 0.9]],
          cross: () => [[-0.3, -1], [0.3, -1], [0.3, -0.3], [1, -0.3], [1, 0.3], [0.3, 0.3], [0.3, 1], [-0.3, 1], [-0.3, 0.3], [-1, 0.3], [-1, -0.3], [-0.3, -0.3]],
        };
        const shape = v.select('shape', [{ value: 'ellipse', label: 'ellipse' }, { value: 'block', label: 'block' }, { value: 'wedge', label: 'wedge' }, { value: 'cross', label: 'cross' }], 'ellipse');
        const rel = v.slider('density ratio $\\rho_{\\rm body}/\\rho_{\\rm fluid}$', 0.1, 2.5, 0.6, { step: 0.02 });
        const size = v.slider('size', 0.5, 1.1, 0.9, { step: 0.02 });
        const free = v.toggle('let go (float freely)', true);
        const s = v.stage({ x: [-W2 - 0.3, W2 + 0.3], y: [-DEP - 0.2, 1.3], equal: true, axes: false, height: 380, title: 'a body in a tank (per unit width)' });
        const plot = v.stage({ x: [-DEP - 1.2, 1.5], y: [-2, 2], axes: 'box', gutter: true, height: 380, xlabel: 'height of the body’s centre', ylabel: 'net force / ρ_f g (m²)', title: 'net vertical force while the body is moved' });
        const h = s.handle(0, -0.4, { color: 'gold', r: 8, constrain: 'y' });
        const place = (P0, sz, yc) => P0.map((p) => [p[0] * sz, p[1] * sz + yc]);
        const buoy = (P) => {
          let Fy = 0; const segs = [];
          for (let i = 0; i < P.length; i++) {
            let p = P[i], q = P[(i + 1) % P.length];
            if (p[1] > 0 && q[1] > 0) continue;
            if (p[1] > 0) p = [p[0] + ((0 - p[1]) / (q[1] - p[1])) * (q[0] - p[0]), 0];
            else if (q[1] > 0) q = [p[0] + ((0 - p[1]) / (q[1] - p[1])) * (q[0] - p[0]), 0];
            const dx = q[0] - p[0], pm = -(p[1] + q[1]) / 2;
            Fy += pm * dx; segs.push([p, q, pm]);
          }
          return { Fy, segs };
        };
        let info = {};
        v.render(() => {
          const P0 = SH[shape.value](), sz = size.value, A = polyArea(P0) * sz * sz, Wt = rel.value * A;
          const ys = P0.map((p) => p[1] * sz), lo = Math.min(...ys), hi = Math.max(...ys);
          const net = (yc) => buoy(place(P0, sz, yc)).Fy - Wt;
          const yl = -DEP - lo, yh = -lo + 0.1 + hi;
          let yeq;
          if (net(yl) <= 0) yeq = yl; else yeq = bisect(net, yl, Math.max(yh, yl + 0.5));
          if (free.value) h.set(0, yeq); else h.set(0, clamp(h.y, yl, yh + 1));
          const yc = h.y, P = place(P0, sz, yc), { Fy, segs } = buoy(P);
          s.rect(-W2, -DEP, W2, 0, { fill: 'accent', fillAlpha: 0.14, stroke: false });
          s.path([[-W2, 1.2], [-W2, -DEP], [W2, -DEP], [W2, 1.2]], { color: 'ink', width: 3 });
          s.hline(0, { color: 'accent', width: 1.4 });
          const sub = clipBelow(P, 0);
          s.poly(P, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 2.2 });
          if (sub.length > 2) s.poly(sub, { fill: 'accent', fillAlpha: 0.2, color: 'green', width: 1.6, dash: true });
          // pressure arrows
          const step = Math.max(1, Math.round(segs.length / 16));
          segs.forEach(([p, q, pm], i) => {
            if (i % step) return;
            const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); if (L < 1e-6 || pm < 0.02) return;
            const nx = dy / L, ny = -dx / L, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, len = 0.55 * (pm / DEP);
            s.arrow(mx + nx * len, my + ny * len, mx, my, { color: 'accent', width: 2, head: 6, alpha: 0.85 });
          });
          const cb = polyCentroid(sub), cg = polyCentroid(P);
          if (cb) s.arrow(cb[0] + 0.12, cb[1] - 0.05, cb[0] + 0.12, cb[1] - 0.05 + Fy * 0.75, { color: 'green', width: 4, head: 9 });
          s.arrow(cg[0] - 0.12, cg[1], cg[0] - 0.12, cg[1] - Wt * 0.75, { color: 'red', width: 4, head: 9 });
          // plot
          const pts = []; for (let i = 0; i <= 90; i++) { const y = -DEP - 1.2 + (i / 90) * (1.5 + DEP + 1.2) - 0; pts.push([y, net(y)]); }
          const m = Math.max(0.6, Wt * 1.4, A * 1.1);
          plot.setView([-DEP - 1.2, 1.5], [-m, m]);
          plot.hline(0, { color: 'faint' });
          plot.path(pts.filter((p) => p[0] >= yl - 1e-9), { color: 'green', width: 2.6 });
          plot.vline(yeq, { color: 'faint', dash: true });
          plot.dot(yc, Fy - Wt, { r: 7, color: 'gold' });
          plot.dot(yeq, 0, { r: 5, color: 'red', hollow: true });
          const disp = Math.abs(polyArea(sub));
          info = { Fy, disp, Wt, A, yc, yeq };
        });
        v.legend([['accent', 'pressure on the wetted surface'], ['green', 'buoyant force'], ['red', 'weight']]);
        v.readout(() => {
          const { Fy, disp, Wt, A } = info;
          return `buoyant force from integrating pressure: $${v.fix(Fy, 4)}\\,\\rho_f g$ · displaced area $${v.fix(disp, 4)}$ m² (difference $${v.sci(Math.abs(Fy - disp), 1)}$)\nweight $=${v.fix(Wt, 4)}\\,\\rho_f g$ (body area $${v.fix(A, 3)}$ m²) → net $${v.fix(Fy - Wt, 4)}$ · ${Fy - Wt > 0.002 ? 'rises' : Fy - Wt < -0.002 ? 'sinks' : 'in equilibrium'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Stability of floating bodies: the metacentre',
      statement: String.raw`A body floating in equilibrium is stable against small rotations exactly when its metacentre $M$ lies above its centre of mass $G$, i.e. the metacentric height $\overline{GM}=\overline{BM}-\overline{BG}$ is positive. Here $B$ is the centre of buoyancy and $\overline{BM}=I/V$, where $I$ is the second moment of the waterplane area about its axis of tilt and $V$ the displaced volume. After a small tilt $\varphi$ the weight at $G$ and the buoyancy at $B$ form a couple with arm $\overline{GZ}\approx\overline{GM}\sin\varphi$, which restores the body if $\overline{GM}>0$ and overturns it if $\overline{GM}<0$.`,
      idea: String.raw`When the body tilts, the immersed wedge on one side is exchanged for the emerged wedge on the other, and the centre of buoyancy $B$ moves sideways by $\overline{BM}\,\varphi$ with $\overline{BM}=I/V$ (the first moment of the exchanged wedges). The vertical through the new $B$ meets the body’s axis in $M$, to first order independent of $\varphi$. Torque balance about $G$ (the rotation analysis of 2.5, with equilibrium stability read off from the sign of the restoring torque) then gives a restoring couple $W\,\overline{GM}\,\varphi$.`,
      caption: String.raw`A box of unit height floating on its side-to-side axis (per unit length). Tilt it with the slider, or release it with the toggle and watch it roll. $B$ (green) is the centroid of the immersed part, $G$ (red) the centre of mass, $M$ (gold) the metacentre. The curve on the right is the full righting arm $\overline{GZ}(\varphi)$ from the exact immersed shape; its slope at the origin is $\overline{GM}$. Raise the centre of mass until $G$ passes $M$ and the upright box capsizes.`,
      deps: ['fluid-2.5', 'mech-3.12'],
      refs: ['Kundu §1.7'],
      tags: ['stability', 'buoyancy', 'ships'],
      scope: String.raw`Two-dimensional rectangular section of density below that of the fluid, static heel angles; the rolling animation uses damped rigid rotation with no added mass or wave forces.`,
      viz(v) {
        const gr = G0;
        const ws = v.slider('width / height of the box', 0.4, 3, 1.6, { step: 0.05, onChange: () => S.reset() });
        const ds = v.slider('draft fraction $d=\\rho_{\\rm box}/\\rho_f$', 0.15, 0.85, 0.5, { step: 0.01, onChange: () => S.reset() });
        const ks = v.slider('centre of mass above the centre (box heights)', -0.45, 0.45, 0, { step: 0.01, onChange: () => S.reset() });
        const ph = v.slider('tilt $\\varphi$ (°)', -180, 180, 18, { step: 1, onChange: () => S.reset() });
        const roll = v.toggle('release and let it roll', false, { onChange: () => S.reset() });
        const s = v.stage({ x: [-2.9, 2.9], y: [-1.9, 1.9], equal: true, axes: false, height: 340, title: 'the floating box' });
        const gz = v.stage({ x: [-180, 180], y: [-1, 1], axes: 'box', gutter: true, height: 340, xlabel: 'tilt φ (degrees)', ylabel: 'righting arm GZ (box heights)', title: 'righting arm against tilt', xticks: [-180, -90, 0, 90, 180] });
        const state = (phi, w, d, kg) => {
          const P0 = [[-w / 2, -0.5], [w / 2, -0.5], [w / 2, 0.5], [-w / 2, 0.5]], place = (yc) => P0.map((p) => { const q = rotate(p, phi); return [q[0], q[1] + yc]; });
          const R = Math.hypot(w, 1) / 2, yc = bisect((y) => polyArea(clipBelow(place(y), 0)) - d * w, -R - 0.01, R + 0.01);
          const sub = clipBelow(place(yc), 0), B = polyCentroid(sub) || [0, yc], Gc = rotate([0, kg], phi);
          const G = [Gc[0], Gc[1] + yc];
          return { P: place(yc), sub, B, G, yc, GZ: G[0] - B[0] };
        };
        let tab = { key: '', ys: [] };
        const table = () => {
          const key = [ws.value, ds.value, ks.value].join('|');
          if (tab.key !== key) { const ys = []; for (let a = -180; a <= 180; a += 2) ys.push(state((a * Math.PI) / 180, ws.value, ds.value, ks.value).GZ); tab = { key, ys }; }
          return tab.ys;
        };
        const S = v.sim(() => ({ phi: (ph.value * Math.PI) / 180, om: 0 }), (st, dt) => {
          const ys = table(), I = (ws.value ** 2 + 1) / 12 + ks.value ** 2, deg = (st.phi * 180) / Math.PI;
          const acc = -(gr * tableAt(ys, -180, 180, ((deg + 180 + 3600) % 360) - 180)) / I - 0.7 * st.om;
          st.om += acc * dt; st.phi += st.om * dt;
        }, { dt: 0.01 });
        let info = {};
        v.animate((t) => {
          const w = ws.value, d = ds.value, kg = ks.value, ys = table();
          const phi = roll.value ? S.advance(t).phi ?? S.state.phi : (ph.value * Math.PI) / 180;
          const st = state(phi, w, d, kg);
          s.rect(-2.9, -1.9, 2.9, 0, { fill: 'accent', fillAlpha: 0.14, stroke: false });
          s.hline(0, { color: 'accent', width: 1.4 });
          s.poly(st.sub, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1, dash: true });
          s.poly(st.P, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 2.6 });
          const B0 = -0.5 + d / 2, BM = (w * w) / (12 * d), M = rotate([0, B0 + BM], phi);
          s.arrow(st.B[0], st.B[1], st.B[0], st.B[1] + 0.95, { color: 'green', width: 3.5, head: 8 });
          s.arrow(st.G[0], st.G[1], st.G[0], st.G[1] - 0.95, { color: 'red', width: 3.5, head: 8 });
          s.dot(st.B[0], st.B[1], { r: 6, color: 'green', label: 'B', labelPos: 'se' });
          s.dot(st.G[0], st.G[1], { r: 6, color: 'red', label: 'G', labelPos: 'w' });
          const my = M[1] + st.yc;
          if (my < 1.8 && my > -1.8) { s.dot(M[0], my, { r: 6, color: 'gold', label: 'M', labelPos: 'e' }); }
          s.line(st.B[0], st.G[1], st.G[0], st.G[1], { color: 'ink', width: 2, dash: true });
          const BG = kg - B0, GM = BM - BG;
          const curve = ys.map((y, i) => [-180 + 2 * i, y]);
          const m = Math.max(0.15, ...ys.map(Math.abs)) * 1.2;
          gz.setView([-180, 180], [-m, m]);
          gz.hline(0, { color: 'faint' });
          gz.fn((a) => GM * Math.sin((a * Math.PI) / 180), { domain: [-180, 180], color: 'gold', width: 1.4, dash: true, n: 180 });
          gz.path(curve, { color: 'accent', width: 2.6 });
          const dg = (phi * 180) / Math.PI, wrapped = ((dg + 180 + 3600) % 360) - 180;
          gz.dot(wrapped, st.GZ, { r: 7, color: 'orange' });
          gz.vline(wrapped, { color: 'faint', dash: true });
          // slope of the exact curve at the origin
          const e = 0.004, slope = (state(e, w, d, kg).GZ - state(-e, w, d, kg).GZ) / (2 * e);
          info = { GM, BM, BG, slope, GZ: st.GZ, wrapped };
        }, { period: 12, still: 3 });
        v.legend([['accent', 'exact $\\overline{GZ}(\\varphi)$'], ['gold', '$\\overline{GM}\\sin\\varphi$', { dash: true }], ['green', 'buoyancy at $B$'], ['red', 'weight at $G$']]);
        v.readout(() => {
          const { GM, BM, BG, slope, GZ, wrapped } = info;
          return `$\\overline{BM}=w^2/12d=${v.fix(BM, 3)}$, $\\overline{BG}=${v.fix(BG, 3)}$ → $\\overline{GM}=${v.fix(GM, 3)}$ (slope of the exact curve at $0$: $${v.fix(slope, 3)}$)\n${GM > 0 ? '**stable upright**: $M$ above $G$' : '**unstable upright**: $G$ above $M$, it capsizes to a new equilibrium'} · at $\\varphi=${v.fix(wrapped, 0)}^\\circ$ the couple is $${v.fix(GZ, 3)}$ ${GZ * wrapped < 0 ? '(overturning)' : '(restoring)'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Law',
      name: 'Surface tension and the Young–Laplace law',
      statement: String.raw`An interface with surface tension $\gamma$ (energy per unit area, equivalently force per unit length) supports a pressure jump equal to $\gamma$ times the sum of its principal curvatures, $\Delta p=\gamma\,(1/R_1+1/R_2)$, the higher pressure on the concave side. For a spherical drop of liquid or a bubble in liquid, $\Delta p=2\gamma/R$; for a soap bubble, with two films, $\Delta p=4\gamma/R$. Smaller spheres therefore have higher internal pressure.`,
      idea: String.raw`Balance the forces on one half of a sphere: the pressure difference pushes on the cross-section $\pi R^2$, and the surface tension pulls along the rim of length $2\pi R$ (twice, for two films). That gives $\Delta p\,\pi R^2=2\pi R\gamma$. The same result follows from virtual work: inflating the sphere by $dR$ against pressure costs $\Delta p\,dV$ and creates area $dA$, so $\Delta p=\gamma\,dA/dV=2\gamma/R$. It rests on pressure being a scalar jump across the interface (2.1).`,
      caption: String.raw`Two bubbles, one tube, a valve. Set the radii and the surface tension, and open the valve when the animation reaches 1 s. The small bubble has the higher pressure, so it empties into the large one and keeps shrinking until only a cap at the tube mouth remains. The log-log plot shows $\Delta p\propto1/R$, with the two bubbles as moving points.`,
      deps: ['fluid-2.1'],
      refs: ['Kundu §1.6'],
      credit: 'Young, 1805; Laplace, 1806',
      tags: ['surface tension', 'capillarity'],
      scope: String.raw`Static interfaces, spherical caps (or small drops where gravity is negligible); the dynamics here is a schematic volume transfer driven by $\Delta p$, not a model of the viscous flow in the tube.`,
      viz(v) {
        const RMIN = 1.5;
        const gam = v.slider('surface tension $\\gamma$ (mN/m)', 20, 73, 25, { step: 1, onChange: () => S.reset() });
        const kind = v.select('interface', [{ value: '4', label: 'soap bubble (two films)' }, { value: '2', label: 'drop, or bubble in liquid (one interface)' }], '4', { onChange: () => S.reset() });
        const r1 = v.slider('left radius (mm)', 4, 25, 9, { step: 0.5, onChange: () => S.reset() });
        const r2 = v.slider('right radius (mm)', 4, 25, 17, { step: 0.5, onChange: () => S.reset() });
        const s = v.stage({ x: [-62, 62], y: [-30, 30], equal: true, axes: false, height: 280, title: 'two bubbles joined by a tube' });
        const pl = v.stage({ x: [1, 30], y: [1, 300], xlog: true, ylog: true, axes: 'box', gutter: true, height: 280, xlabel: 'radius R (mm)', ylabel: 'pressure jump Δp (Pa)', title: 'Δp = cγ / R' });
        const vol = (R) => (4 / 3) * Math.PI * R ** 3, rad = (V) => Math.cbrt((3 * V) / (4 * Math.PI));
        const S = v.sim(() => ({ V1: vol(r1.value), V2: vol(r2.value), open: false }), (st, dt, t) => {
          if (t < 1) return;
          st.open = true;
          const c = +kind.value, g = gam.value, p1 = (c * g) / rad(st.V1), p2 = (c * g) / rad(st.V2);
          if (rad(st.V1) <= RMIN && p1 > p2) return;
          if (rad(st.V2) <= RMIN && p2 > p1) return;
          const dV = -60 * (p1 - p2) * dt;
          st.V1 += dV; st.V2 -= dV;
          if (rad(st.V1) < RMIN) { st.V2 += st.V1 - vol(RMIN); st.V1 = vol(RMIN); }
          if (rad(st.V2) < RMIN) { st.V1 += st.V2 - vol(RMIN); st.V2 = vol(RMIN); }
        }, { dt: 0.01, maxSteps: 6000 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), R1 = rad(st.V1), R2 = rad(st.V2), c = +kind.value, g = gam.value;
          const cl = -30, cr = 30;
          s.circle(cl, 0, R1, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 3 });
          s.circle(cr, 0, R2, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 3 });
          s.line(cl + R1, 0, cr - R2, 0, { color: 'ink', width: 5 });
          const vx = (cl + R1 + cr - R2) / 2;
          s.rect(vx - 1.2, -3, vx + 1.2, 3, { fill: st.open ? 'green' : 'red', fillAlpha: 0.7, color: st.open ? 'green' : 'red', radius: 2 });
          s.text(st.open ? 'valve open' : 'valve closed', vx, 8, { size: 12, color: st.open ? 'green' : 'red', align: 'center' });
          const p1 = (c * g) / R1, p2 = (c * g) / R2;
          if (st.open && Math.abs(p1 - p2) > 0.01) { const dir = p1 > p2 ? 1 : -1; s.arrow(vx - 7 * dir, 14, vx + 7 * dir, 14, { color: 'gold', width: 3.5, head: 9 }); }
          s.text(`Δp = ${v.fix(p1, 1)} Pa`, cl, -R1 - 4, { size: 12, color: 'accent', align: 'center' });
          s.text(`Δp = ${v.fix(p2, 1)} Pa`, cr, -R2 - 4, { size: 12, color: 'orange', align: 'center' });
          pl.fn((R) => (c * g) / R, { domain: [1, 30], color: 'ink', width: 1.6, n: 100 });
          pl.dot(R1, p1, { r: 8, color: 'accent' }); pl.dot(R2, p2, { r: 8, color: 'orange' });
          const E = (V) => (c / 2) * (g / 1000) * 4 * Math.PI * (rad(V) / 1000) ** 2, dv = 1e-3; // surface energy in J; V in mm^3
          const dEdV = (V) => (E(V * (1 + dv)) - E(V * (1 - dv))) / (V * 2 * dv * 1e-9);
          info = { R1, R2, p1, p2, open: st.open, dE1: dEdV(st.V1), dE2: dEdV(st.V2) };
        }, { period: 14, still: 12 });
        v.legend([['accent', 'left bubble'], ['orange', 'right bubble']]);
        v.readout(() => {
          const { R1, R2, p1, p2, dE1 } = info, c = +kind.value;
          return `left: $\\Delta p=${c}\\gamma/R=${v.fix(p1, 2)}$ Pa, rim force balance $\\Delta p\\,\\pi R^2=${v.fix(p1 * Math.PI * (R1 / 1000) ** 2 * 1e6, 3)}\\ \\mu$N $=${c}\\gamma\\cdot2\\pi R/2$ · virtual work $\\gamma\\,dA/dV=${v.fix(dE1, 2)}$ Pa\nright: $\\Delta p=${v.fix(p2, 2)}$ Pa · ${p1 > p2 ? 'the smaller bubble (higher pressure) empties into the larger one' : 'pressures equal'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Law',
      name: 'Euler’s equations of inviscid flow',
      statement: String.raw`For an inviscid fluid of density $\rho$ acted on by pressure and a body force per unit mass $\mathbf g$, Newton’s second law for a fluid parcel reads
$$\frac{D\mathbf u}{Dt}=\frac{\partial\mathbf u}{\partial t}+(\mathbf u\cdot\nabla)\mathbf u=-\frac1\rho\nabla p+\mathbf g,$$
supplemented by mass conservation ($\nabla\cdot\mathbf u=0$ for constant $\rho$) and the condition $\mathbf u\cdot\mathbf n=0$ at solid walls. The acceleration of a parcel is the material derivative of its velocity; the only surface force is the pressure gradient.`,
      idea: String.raw`A small parcel of volume $\delta V$ has mass $\rho\,\delta V$ and acceleration $D\mathbf u/Dt$ (1.3). The pressure force on it is $-\oint p\,\mathbf n\,dS=-\nabla p\,\delta V$ by the divergence theorem, and because pressure is isotropic (2.1) nothing else acts on its surface once viscosity is dropped. Adding gravity and dividing by $\rho\,\delta V$ gives the equation. It is Newton’s law per unit mass, with the unusual feature that the acceleration contains the convective term $(\mathbf u\cdot\nabla)\mathbf u$ even in a steady flow.`,
      caption: String.raw`Water flows through a channel whose throat you can narrow (drag the handle). The pressure comes from the integrated Euler equation, not from the motion, and a parcel is tracked through the flow by solving $\dot x=u(x,t)$. The blue arrow is $-\nabla p/\rho$ at the parcel and the orange arrow is its measured acceleration $Du/Dt$ (a finite difference of its own velocity); they agree at every instant. Turn on unsteadiness ($\epsilon>0$) and $\partial_t u$ joins $u\,\partial_xu$ in both.`,
      deps: ['fluid-1.3', 'fluid-1.5', 'fluid-2.1', 'mech-1.6'],
      refs: ['Kundu §4.4', 'Acheson ch. 1'],
      credit: 'Leonhard Euler, 1750s',
      tags: ['Euler equation', 'momentum'],
      scope: String.raw`Inviscid fluid, constant density here (the equation holds for compressible flow with an equation of state); the quasi-one-dimensional channel used in the picture is a slowly varying one.`,
      viz(v) {
        const X0 = -4, X1 = 5, OMG = 1.5, T = 9, NS = 2000;
        const eps = v.slider('unsteadiness $\\epsilon$ (inflow $\\propto 1+\\epsilon\\sin\\omega t$)', 0, 0.8, 0, { step: 0.02 });
        const hd = v.stage({ x: [-4.4, 5.4], y: [-1.6, 1.6], equal: true, axes: false, height: 250, full: true, title: 'channel flow: pressure (colour), parcel and its two accelerations' });
        const ts = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', gutter: true, height: 230, xlabel: 'time', ylabel: 'acceleration', title: 'acceleration of the parcel along its path' });
        const hh = hd.handle(0, 0.45, { color: 'gold', r: 8, label: 'throat', labelPos: 'n', constrain: (x, y) => [0, clamp(y, 0.2, 1.0)] });
        const hw = (x, ht) => dip(x, 1, ht, 0, 1.1);
        let cache = { key: '' };
        const build = () => {
          const ht = hh.y, e = eps.value, key = ht.toFixed(4) + '|' + e;
          if (cache.key === key) return cache;
          const xs = [], inv = [];
          for (let i = 0; i <= NS; i++) { const x = X0 + ((X1 - X0) * i) / NS; xs.push(x); inv.push(1 / hw(x, ht)); }
          const I = cumTrapz(xs, inv), Itab = (x) => tableAt(I, X0, X1, x);
          const Q = (t) => 2 * (1 + e * Math.sin(OMG * t)), Qd = (t) => 2 * e * OMG * Math.cos(OMG * t);
          const u = (x, t) => Q(t) / (2 * hw(x, ht));
          const pr = (x, t) => -0.5 * (u(x, t) ** 2 - u(X0, t) ** 2) - 0.5 * Qd(t) * Itab(x);
          // parcel from x = -4 at t = 0
          const dt = 0.005, nst = Math.round(T / dt), X = [X0], U = [u(X0, 0)];
          let x = X0;
          for (let i = 0; i < nst; i++) {
            const t = i * dt, k1 = u(x, t), k2 = u(x + 0.5 * dt * k1, t + dt / 2), k3 = u(x + 0.5 * dt * k2, t + dt / 2), k4 = u(x + dt * k3, t + dt);
            x += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            X.push(x); U.push(u(x, (i + 1) * dt));
          }
          const sk = 4, N = Math.floor(nst / sk) - 1, T_ = [], am = [], ap = [], xp = [];
          for (let j = 1; j < N; j++) {
            const i = j * sk, t = i * dt;
            T_.push(t); xp.push(X[i]);
            am.push((U[i + sk] - U[i - sk]) / (2 * sk * dt));
            ap.push(-(pr(X[i] + 0.01, t) - pr(X[i] - 0.01, t)) / 0.02);
          }
          let md = 0; for (let j = 0; j < am.length; j++) md = Math.max(md, Math.abs(am[j] - ap[j]));
          cache = { key, ht, T_, am, ap, xp, md, pr, u };
          return cache;
        };
        let info = {};
        v.animate((t) => {
          const c = build(), ht = c.ht;
          const wall = [], wall2 = [];
          for (let i = 0; i <= 120; i++) { const x = X0 + ((X1 - X0) * i) / 120; wall.push([x, hw(x, ht)]); wall2.push([x, -hw(x, ht)]); }
          const pv = [];
          for (let i = 0; i <= 40; i++) { const x = X0 + ((X1 - X0) * i) / 40; pv.push(c.pr(x, t)); }
          const pl = Math.min(...pv, -3), ph = Math.max(...pv, 1.5);
          hd.raster((x, y) => {
            if (x < X0 || x > X1 || Math.abs(y) > hw(x, ht)) return null;
            const q = clamp((c.pr(x, t) - pl) / (ph - pl), 0, 1);
            return v.ramp(q, 'accent', 'panel');
          }, { res: 3, key: c.key + '|' + t.toFixed(2) });
          hd.path(wall, { color: 'ink', width: 3 }); hd.path(wall2, { color: 'ink', width: 3 });
          for (const f of [-0.6, -0.3, 0.3, 0.6]) hd.path(wall.map(([x, y]) => [x, f * y]), { color: 'ink', alpha: 0.25, width: 1 });
          const j = Math.min(c.T_.length - 1, Math.max(0, Math.round(t / (0.02))) - 1), jj = Math.max(0, j), px = c.xp[jj];
          const sc = 0.35;
          hd.arrow(px, 0.12, px + clamp(c.ap[jj] * sc, -1.6, 1.6), 0.12, { color: 'accent', width: 3.5, head: 9 });
          hd.arrow(px, -0.12, px + clamp(c.am[jj] * sc, -1.6, 1.6), -0.12, { color: 'orange', width: 3.5, head: 9 });
          hd.dot(px, 0, { r: 7, color: 'gold' });
          const lo = Math.min(...c.am, ...c.ap), hi = Math.max(...c.am, ...c.ap);
          ts.setView([0, T], [lo - 0.2 * (hi - lo) - 0.05, hi + 0.2 * (hi - lo) + 0.05]);
          ts.hline(0, { color: 'faint' });
          ts.path(c.T_.map((tt, k) => [tt, c.ap[k]]), { color: 'accent', width: 4 });
          ts.path(c.T_.map((tt, k) => [tt, c.am[k]]), { color: 'orange', width: 1.8 });
          ts.vline(t, { color: 'gold', width: 1.8 });
          info = { ap: c.ap[jj], am: c.am[jj], md: c.md, px, u: c.u(px, t), t };
        }, { period: T, still: 3.4 });
        v.legend([['accent', '$-\\nabla p/\\rho$ from the pressure field'], ['orange', '$Du/Dt$ from the parcel’s own velocity'], ['gold', 'parcel']]);
        v.readout(() => `$t=${v.fix(info.t, 2)}$: parcel at $x=${v.fix(info.px, 2)}$ with $u=${v.fix(info.u, 2)}$ · $-\\partial_xp/\\rho=${v.fix(info.ap, 3)}$, $Du/Dt=${v.fix(info.am, 3)}$\nlargest disagreement over the whole run: $${v.sci(info.md, 2)}$ (units of $U^2/L$, $\\rho=1$)`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Bernoulli’s theorem',
      statement: String.raw`For a steady flow of an inviscid fluid of constant density in a uniform gravitational field, the quantity
$$H=\frac p{\rho g}+\frac{|\mathbf u|^2}{2g}+z$$
is constant along each streamline: pressure head, velocity head and elevation head trade off against each other. Where a streamline passes through a narrowing the speed rises and the pressure falls. (If the flow is also irrotational, $H$ has the same value on all streamlines.)`,
      idea: String.raw`Take the dot product of Euler’s equation (2.8) with $\mathbf u$. For a steady flow $\mathbf u\cdot D\mathbf u/Dt=\mathbf u\cdot\nabla(\tfrac12|\mathbf u|^2)$, the gravity term is $-\mathbf u\cdot\nabla(gz)$ and the pressure term is $-\mathbf u\cdot\nabla p/\rho$. So $\mathbf u\cdot\nabla\big(\tfrac12|\mathbf u|^2+p/\rho+gz\big)=0$: the bracket does not change along a streamline. It is the work–energy theorem for a parcel, and continuity (1.5) is what ties the speed to the width of the pipe.`,
      caption: String.raw`Water flows left to right. The coloured bands are the heads: the blue line is the height the water would rise to in a piezometer (the sum $p/\rho g+z$), and the orange band between it and the dashed green line is the velocity head $u^2/2g$. The dashed line, total head, is flat: drag the throat handle, change the speed, the inlet pressure or tilt the pipe, and it stays flat. Add wall friction and it slopes down, because Bernoulli’s theorem needs the flow to be inviscid; make the throat too narrow and the pressure drops below the vapour pressure of water.`,
      deps: ['fluid-2.8'],
      refs: ['Kundu §4.9', 'Acheson ch. 1'],
      credit: 'Daniel Bernoulli, Hydrodynamica, 1738',
      tags: ['Bernoulli', 'energy'],
      scope: String.raw`Steady, inviscid, constant density (so low-speed gas flows too, up to roughly Mach 0.3), along one streamline. Not valid across a pump or turbine, nor with significant friction or heat transfer.`,
      viz(v) {
        const g = G0, r0 = 0.15, K = 20, pV = 2340;
        const us = v.slider('inlet speed $u_1$ (m/s)', 0.3, 3, 1.5, { step: 0.05 });
        const hs = v.slider('inlet pressure head $p_1/\\rho g$ (m)', 0, 12, 6, { step: 0.1 });
        const rs = v.slider('pipe rises by (m)', -4, 4, 0, { step: 0.1 });
        const fs = v.slider('wall friction factor $f$', 0, 0.08, 0, { step: 0.002 });
        const s = v.stage({ x: [0, 10], y: [-11, 18], axes: 'box', gutter: true, height: 400, full: true, xlabel: 'distance along the pipe (m)', ylabel: 'height (m of water)', title: 'a pipe with a throat; radius drawn ×20' });
        const hd = s.handle(5, 0.1 * K, { color: 'gold', r: 8, label: 'throat', labelPos: 'n', constrain: (x, y) => [5, clamp(y, 0.04 * K, 0.14 * K)] });
        const ST = [0.6, 2, 3.4, 4.3, 5, 5.7, 7, 9.4];
        let info = {};
        v.render(() => {
          const rt = hd.y / K, u1 = us.value, hin = hs.value, rise = rs.value, f = fs.value;
          const r = (x) => dip(x, r0, rt, 5, 1.3), z = (x) => (rise * x) / 10, u = (x) => u1 * (r0 / r(x)) ** 2;
          const NX = 200, xs = [], loss = [];
          for (let i = 0; i <= NX; i++) { const x = (10 * i) / NX; xs.push(x); loss.push((f * u(x) ** 2) / (2 * g * 2 * r(x))); }
          const hf = cumTrapz(xs, loss), H0 = hin + (u1 * u1) / (2 * g);
          const hfAt = (x) => tableAt(hf, 0, 10, x);
          const Ht = (x) => H0 - hfAt(x), hgl = (x) => Ht(x) - u(x) ** 2 / (2 * g);
          s.setView([0, 10], [Math.min(...xs.map((x) => Math.min(hgl(x), z(x) - r(x) * K))) - 1.5, H0 + 2 + Math.max(0, rise)]);
          const top = [], bot = [];
          for (const x of xs) { top.push([x, z(x) + r(x) * K]); bot.push([x, z(x) - r(x) * K]); }
          s.poly([...top, ...bot.slice().reverse()], { fill: 'muted', fillAlpha: 0.18, color: 'ink', width: 2.4 });
          for (const fr of [-0.7, -0.35, 0, 0.35, 0.7]) s.path(xs.map((x) => [x, z(x) + fr * r(x) * K]), { color: 'accent', alpha: 0.5, width: 1.3 });
          s.between((x) => hgl(x), (x) => Ht(x), 0, 10, { fill: 'orange', fillAlpha: 0.25 });
          s.path(xs.map((x) => [x, hgl(x)]), { color: 'accent', width: 2.4 });
          s.path(xs.map((x) => [x, Ht(x)]), { color: 'green', width: 2.4, dash: true });
          const cav = Math.min(...xs.map((x) => hgl(x) - z(x))) < -(P_ATM - pV) / (RHO_W * g);
          for (const x of ST) {
            const c0 = z(x) + r(x) * K, c1 = hgl(x);
            s.rect(x - 0.07, Math.min(c0, c1), x + 0.07, Math.max(c0, c1), { fill: 'accent', fillAlpha: 0.65, color: 'accent', width: 1 });
            s.dot(x, c1, { r: 3.5, color: 'accent' });
          }
          if (cav) s.text('cavitation: p < vapour pressure', 5, 14.5, { size: 14, color: 'red' });
          const Hs = ST.map((x) => hgl(x) + u(x) ** 2 / (2 * g)), pm = ST.map((x) => hgl(x) - z(x));
          info = { Hs, pm, cav, uth: u(5), pth: (hgl(5) - z(5)) * RHO_W * g, H0 };
        });
        v.legend([['accent', 'piezometric head $p/\\rho g+z$'], ['orange', 'velocity head $u^2/2g$', { area: true }], ['green', 'total head $H$', { dash: true }]]);
        v.readout(() => {
          const { Hs, pm, cav, uth, pth } = info, lo = Math.min(...Hs), hi = Math.max(...Hs);
          return `speed at the throat $${v.fix(uth, 2)}$ m/s, gauge pressure there $${v.fix(pth / 1000, 1)}$ kPa${cav ? ' (**below the vapour pressure: the water boils**)' : ''}\n$H$ at the eight stations: from $${v.fix(lo, 4)}$ to $${v.fix(hi, 4)}$ m (spread $${v.sci(hi - lo + 1e-12, 2)}$)${hi - lo < 1e-6 ? ' — constant, as the theorem says' : ' — not constant: friction removes head along the pipe'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Law',
      name: 'Torricelli’s law',
      statement: String.raw`Water leaves a small hole at depth $d$ below the free surface of a large open tank as a jet with speed $v=\sqrt{2gd}$, the speed of a body that has fallen freely through the height $d$. If the hole has area $a$ the jet contracts to $C_ca$ (with $C_c\approx0.6$ for a sharp-edged orifice), so the discharge is $Q=C_ca\sqrt{2gd}$, and a jet emerging horizontally at height $y$ above the floor lands at distance $2\sqrt{d\,y}$. A tank of cross-section $A$ drains down to the hole in time $\dfrac{A}{C_ca}\sqrt{\dfrac{2d_0}{g}}$.`,
      idea: String.raw`Apply Bernoulli (2.9) along a streamline from the free surface, where the pressure is atmospheric and the speed $\approx0$ because $A\gg a$, to the jet, which is also at atmospheric pressure: $\tfrac12v^2=g\,d$. The jet then moves ballistically, giving the landing distance, and the rate of fall of the surface is $dh/dt=-Q/A$, which integrates to a falling square root: $\sqrt{h-y}$ decreases linearly in time. The result is the energy equation of 2.9 with a quasi-steady approximation.`,
      caption: String.raw`Drag the hole up and down the wall of the tank. The jet follows the parabola of a projectile launched with $\sqrt{2gd}$; the lower left plot shows its range against hole height for the present water level, largest at half depth. Watch the tank drain: the level (right plot) follows the exact parabola $h(t)=y_0+(\sqrt{H-y_0}-t/\tau)^2$ and the measured emptying time agrees with the formula. Time runs faster than reality in the animation.`,
      deps: ['fluid-2.9'],
      refs: ['Kundu §4.9'],
      credit: 'Evangelista Torricelli, 1643',
      tags: ['Torricelli', 'jets'],
      scope: String.raw`Large tank ($A\gg a$), small hole, negligible viscosity and surface tension; the draining is treated as quasi-steady so that Bernoulli’s theorem applies at each instant.`,
      viz(v) {
        const H = 1, WT = 0.5;
        const ar = v.slider('tank area / hole area $A/a$', 20, 400, 100, { log: true, sig: 2 });
        const cc = v.slider('contraction coefficient $C_c$', 0.5, 1, 0.62, { step: 0.01 });
        const s = v.stage({ x: [-0.15, 1.75], y: [-0.12, 1.12], equal: true, axes: false, height: 320, full: true, title: 'a draining tank' });
        const pr = v.stage({ x: [0, 1], y: [0, 1.1], axes: 'box', gutter: true, height: 230, xlabel: 'hole height y (m)', ylabel: 'landing distance (m)', title: 'range of the jet for the present level' });
        const pt = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 230, xlabel: 'time (s)', ylabel: 'water level h (m)', title: 'draining' });
        const hole = s.handle(WT, 0.35, { color: 'gold', r: 8, label: 'hole', labelPos: 'n', constrain: (x, y) => [WT, clamp(y, 0.05, 0.9)] });
        let cache = { key: '' };
        const build = () => {
          const y0 = hole.y, A = ar.value, C = cc.value, key = [y0, A, C].join('|');
          if (cache.key === key) return cache;
          const k = (C / A) * Math.sqrt(2 * G0);
          const tau = Math.sqrt(2 / G0) * A / C;                 // h - y0 = (sqrt(H-y0) - t/tau)^2 with tau = (A/(C a)) sqrt(2/g)
          const Tform = tau * Math.sqrt(H - y0);
          const n = 400, dt = (1.1 * Tform) / n, hs = [H]; let h = H, tEmpty = null;
          const F = (hh) => -k * Math.sqrt(Math.max(0, hh - y0));
          for (let i = 0; i < n; i++) {
            const k1 = F(h), k2 = F(h + 0.5 * dt * k1), k3 = F(h + 0.5 * dt * k2), k4 = F(h + dt * k3);
            h += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); hs.push(h);
            if (tEmpty == null && h - y0 < 1e-4) tEmpty = (i + 1) * dt;
          }
          cache = { key, y0, A, C, Tform, hs, dt, tau, tEmpty, k };
          return cache;
        };
        let info = {};
        v.animate((t) => {
          const c = build(), tp = (t / 18) * (1.1 * c.Tform), idx = Math.min(c.hs.length - 1, Math.round(tp / c.dt)), h = c.hs[idx], y0 = c.y0;
          s.rect(0, 0, WT, h, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 });
          s.path([[0, 1.05], [0, 0], [WT, 0], [WT, 1.05]], { color: 'ink', width: 3 });
          s.rect(-0.15, -0.06, 1.75, 0, { fill: 'muted', fillAlpha: 0.5, color: 'muted' });
          s.rect(WT - 0.015, y0 - 0.012, WT + 0.015, y0 + 0.012, { fill: 'panel', color: 'ink', width: 1 });
          const d = h - y0;
          let Rn = 0, Rf = 0;
          if (d > 1e-3) {
            const vj = Math.sqrt(2 * G0 * d), Tfl = Math.sqrt((2 * y0) / G0);
            s.curve((tt) => [WT + vj * tt, y0 - 0.5 * G0 * tt * tt], 0, Tfl, { color: 'accent', width: 3.5, n: 60 });
            s.arrow(WT + 0.02, y0, WT + 0.02 + 0.015 * vj, y0, { color: 'orange', width: 2.5, head: 7 });
            // numerical landing point
            let x = WT, y = y0, w = 0; const dt = 1e-4; while (y > 0) { x += vj * dt; w += G0 * dt; y -= w * dt; }
            Rn = x - WT; Rf = 2 * Math.sqrt(d * y0);
            s.dot(x, 0, { r: 6, color: 'green' });
          }
          s.hline(h, { color: 'accent', dash: true, alpha: 0.6 }); s.vline(WT + 0.0, { color: 'faint', alpha: 0 });
          s.measure(0.12, y0, 0.12, h, `d = ${v.fix(d, 2)} m`);
          pr.setView([0, h], [0, Math.max(0.2, h * 1.08)]);
          pr.fn((y) => 2 * Math.sqrt(Math.max(0, (h - y) * y)), { domain: [0, h], color: 'accent', width: 2.4, n: 120 });
          pr.vline(h / 2, { color: 'faint', dash: true });
          pr.dot(y0, d > 0 ? 2 * Math.sqrt(d * y0) : 0, { r: 7, color: 'gold' });
          pt.setView([0, 1.1 * c.Tform], [0, 1.05]);
          pt.hline(y0, { color: 'faint', dash: true });
          pt.path(c.hs.map((hh, i) => [i * c.dt, hh]), { color: 'accent', width: 2.6 });
          pt.fn((tt) => y0 + Math.max(0, Math.sqrt(H - y0) - tt / c.tau) ** 2, { domain: [0, 1.1 * c.Tform], color: 'green', width: 1.6, dash: true, n: 100 });
          pt.vline(tp, { color: 'gold', width: 1.8 });
          info = { d, Rn, Rf, c, tp, h };
        }, { period: 18, still: 4 });
        v.legend([['accent', 'jet / computed level'], ['green', 'closed-form level', { dash: true }], ['gold', 'now']]);
        v.readout(() => {
          const { d, Rn, Rf, c, tp, h } = info;
          return `water level $h=${v.fix(h, 3)}$ m (animation time $${v.fix(tp, 1)}$ s) · jet speed $\\sqrt{2gd}=${v.fix(Math.sqrt(2 * G0 * Math.max(d, 0)), 3)}$ m/s · landing distance: integrated $${v.fix(Rn, 4)}$ m vs $2\\sqrt{dy}=${v.fix(Rf, 4)}$ m\nemptying time to the hole: simulated $${c.tEmpty == null ? '—' : v.fix(c.tEmpty, 1)}$ s vs $\\dfrac{A}{C_ca}\\sqrt{2(H-y)/g}=${v.fix(c.Tform, 1)}$ s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Venturi meter and Pitot tube',
      statement: String.raw`Bernoulli’s theorem turns pressures into speeds. In a Venturi meter, a pipe of area $A_1$ narrows to a throat of area $A_2$ and the pressure drop $\Delta p=p_1-p_2$ gives the flow speed, $U_1=\sqrt{\dfrac{2\Delta p}{\rho\,[(A_1/A_2)^2-1]}}$. A Pitot tube meets the stream head-on: the fluid in front of its nose is brought to rest, so the stagnation pressure exceeds the static pressure by $p_0-p=\tfrac12\rho U^2$, giving $U=\sqrt{2(p_0-p)/\rho}$. Both inversions assume incompressible flow, accurate for gases only below about Mach 0.3.`,
      idea: String.raw`Along a streamline into the nose of the Pitot tube the speed falls from $U$ to $0$, and Bernoulli’s theorem (2.9) says the pressure rises by $\tfrac12\rho U^2$. In the Venturi, continuity gives the throat speed $U_2=U_1A_1/A_2$ and Bernoulli gives the pressure drop $\tfrac12\rho(U_2^2-U_1^2)$. Neither uses viscosity or any empirical constant, which is why both are standard instruments; the pressures are read by a liquid manometer, whose level difference is $\Delta p/[(\rho_m-\rho)g]$ by hydrostatics (2.2).`,
      caption: String.raw`Set the speed and the area ratio. Left: the U-tube between the wide section and the throat of a Venturi meter. Right: the U-tube between the nose and the side ports of a Pitot tube. Each reading is inverted through Bernoulli’s formula to give the speed. In water the answer is exact; in air, push the speed up and the true compressible pressure rises above $\tfrac12\rho U^2$, so the incompressible inversion reads too high. The Venturi in air eventually chokes (sonic throat).`,
      deps: ['fluid-2.9'],
      refs: ['Kundu §4.9'],
      credit: 'G. B. Venturi, 1797; H. Pitot, 1732',
      tags: ['Venturi', 'Pitot', 'flow measurement'],
      scope: String.raw`Incompressible, frictionless flow for the formulas shown. The air readings below use isentropic compressible flow, to show where the incompressible inversion fails.`,
      viz(v) {
        const GAM = 1.4, RGAS = 287.05, CP = 1004.5, T1 = 288.15, P1 = P_ATM;
        const fl = v.select('fluid', [{ value: 'water', label: 'water (mercury manometer)' }, { value: 'air', label: 'air (water manometer)' }], 'water');
        const uw = v.slider('speed $U$ (m/s)', 2, 6, 4, { step: 0.05 });
        const ua = v.slider('speed $U$ (m/s)', 30, 120, 80, { step: 1 });
        const ar = v.slider('area ratio $A_1/A_2$', 1.5, 4, 2, { step: 0.05 });
        const venturi = v.stage({ x: [0, 12], y: [-9, 4], equal: true, axes: false, height: 330, title: 'Venturi meter' });
        const pitot = v.stage({ x: [0, 12], y: [-9, 4], equal: true, axes: false, height: 330, title: 'Pitot tube' });
        const props = () => (fl.value === 'water' ? { rho: 1000, rm: 13546, mname: 'mercury', sym: 'Hg', mc: 'muted' } : { rho: P1 / (RGAS * T1), rm: 1000, mname: 'water', sym: 'H₂O', mc: 'accent' });
        // compressible isentropic Venturi: returns {dp, choked}
        const ventAir = (U1, AR) => {
          const rho1 = P1 / (RGAS * T1), T0 = T1 + (U1 * U1) / (2 * CP), m = rho1 * U1 * AR, Us = Math.sqrt(((2 * GAM) / (GAM + 1)) * RGAS * T0);
          const flux = (U2) => { const T2 = T0 - (U2 * U2) / (2 * CP); return rho1 * (T2 / T1) ** 2.5 * U2; };
          if (flux(Us) < m) return { dp: P1 * (1 - ((T0 - (Us * Us) / (2 * CP)) / T1) ** 3.5), choked: true };
          const U2 = bisect((u) => flux(u) - m, U1, Us), T2 = T0 - (U2 * U2) / (2 * CP);
          return { dp: P1 * (1 - (T2 / T1) ** 3.5), choked: false, U2 };
        };
        const pitotAir = (U) => { const M = U / Math.sqrt(GAM * RGAS * T1); return { dp: P1 * ((1 + 0.2 * M * M) ** 3.5 - 1), M }; };
        const readings = (U, AR) => {
          const p = props();
          if (fl.value === 'water') return { V: { dp: 0.5 * p.rho * U * U * (AR * AR - 1) }, P: { dp: 0.5 * p.rho * U * U, M: 0 }, p };
          return { V: ventAir(U, AR), P: pitotAir(U), p };
        };
        let info = {};
        v.render(() => {
          uw.el.hidden = fl.value !== 'water'; ua.el.hidden = fl.value !== 'air';
          const AR = ar.value, U = fl.value === 'water' ? uw.value : ua.value, Umax = fl.value === 'water' ? 6 : 120;
          const R = readings(U, AR), Rm = readings(Umax, AR), p = R.p, k = 1 / ((p.rm - p.rho) * G0);
          const R1 = 1.2, R2 = R1 / Math.sqrt(AR), yc = 1.5, r = (x) => dip(x, R1, R2, 6, 1.4);
          const xs = []; for (let i = 0; i <= 120; i++) xs.push((12 * i) / 120);
          const top = xs.map((x) => [x, yc + r(x)]), bot = xs.map((x) => [x, yc - r(x)]);
          venturi.poly([...top, ...bot.slice().reverse()], { fill: fl.value === 'water' ? 'accent' : 'faint', fillAlpha: 0.22, color: 'ink', width: 2.4 });
          for (const f of [-0.6, -0.2, 0.2, 0.6]) venturi.path(xs.map((x) => [x, yc + f * r(x)]), { color: 'accent', alpha: 0.5, width: 1.2 });
          const cap = 2.6, dd = (dp) => Math.min(cap, (dp / Rm.V.dp) * 2.4);
          const xl = 2, xr = 6, yb = -8, ymid = -4.2;
          venturi.line(xr, yc - R2, xr, yc - R1 - 0.1, { color: 'ink', width: 2 });
          const dV = dd(R.V.dp);
          const lv = utube(venturi, xl, xr, yb, yc - R1 - 0.1, ymid, dV, { fluid: p.mc });
          venturi.tex('p_1', xl - 0.9, yc - R1 - 0.5, { size: 13 }); venturi.tex('p_2', xr + 0.9, yc - R1 - 0.5, { size: 13 });
          venturi.text(`$U_1=${v.fix(U, 1)}$ m/s`, 0.2, yc + R1 + 0.5, { size: 12, color: 'accent', align: 'left' });
          venturi.text(`$U_2=${v.fix(U * AR, 1)}$`, 6, yc + R1 + 0.5, { size: 12, color: 'accent', align: 'center' });
          venturi.arrow(0.3, yc, 1.6, yc, { color: 'accent', width: 3, head: 8 });
          venturi.text(`Δh = ${v.fix(R.V.dp * k * 1000, 1)} mm ${p.sym}`, 4, -6.2, { size: 12, color: 'ink', align: 'center', plate: true });
          // pitot
          const py = 1.8;
          const dPit = Math.min(cap, (R.P.dp / Rm.P.dp) * 2.4);
          for (const h of [-2.4, -1.5, -0.9, 0.9, 1.5, 2.4]) {
            const sg = Math.sign(h), pts = [];
            for (let i = 0; i <= 100; i++) { const x = (12 * i) / 100, E = x < 3 ? Math.exp(-(((x - 3) / 1.3) ** 2)) : 1; pts.push([x, py + sg * Math.sqrt(h * h + 0.3 * E)]); }
            pitot.path(pts, { color: 'accent', alpha: 0.5, width: 1.3 });
          }
          pitot.poly([[3, py - 0.28], [10.5, py - 0.28], [10.5, py + 0.28], [3.35, py + 0.28], [3, py + 0.1], [3, py - 0.1]], { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 2 });
          pitot.dot(3, py, { r: 4, color: 'red' });
          pitot.text('stagnation point', 0.2, py - 0.05, { size: 11, color: 'red', align: 'left', plate: true });
          pitot.dot(7, py + 0.28, { r: 3.5, color: 'green' }); pitot.dot(8.2, py + 0.28, { r: 3.5, color: 'green' });
          pitot.text('static ports', 7.6, py + 0.9, { size: 11, color: 'green', plate: true, align: 'center' });
          pitot.arrow(0.3, py + 3.3, 1.6, py + 3.3, { color: 'accent', width: 3, head: 8 });
          pitot.text(`$U=${v.fix(U, 1)}$ m/s`, 0.2, py + 3.0 + 0.7, { size: 12, color: 'accent', align: 'left' });
          pitot.line(5, py, 5, py - 0.28, { color: 'ink', width: 1 });
          pitot.line(5, py - 0.28, 5, -1.0, { color: 'ink', width: 2 });
          pitot.line(9, py - 0.28, 9, -1.0, { color: 'ink', width: 2 });
          const lp = utube(pitot, 5, 9, yb, -1.0, ymid, dPit, { fluid: p.mc });
          pitot.tex('p_0', 3.9, -0.4, { size: 13 }); pitot.tex('p', 9.9, -0.4, { size: 13 });
          pitot.text(`Δh = ${v.fix(R.P.dp * k * 1000, 1)} mm ${p.sym}`, 7, -6.2, { size: 12, color: 'ink', align: 'center', plate: true });
          // inference
          const UvInf = R.V.choked ? NaN : Math.sqrt((2 * R.V.dp) / (p.rho * (AR * AR - 1))), UpInf = Math.sqrt((2 * R.P.dp) / p.rho);
          info = { U, UvInf, UpInf, dpV: R.V.dp, dpP: R.P.dp, M: R.P.M, choked: R.V.choked, AR };
        });
        v.readout(() => {
          const { U, UvInf, UpInf, dpV, dpP, M, choked } = info, e = (x) => v.fix((100 * (x - U)) / U, 2);
          return `Venturi: $\\Delta p=${v.fix(dpV, 1)}$ Pa → $U_1=${choked ? '\\text{choked}' : v.fix(UvInf, 3)}$ m/s${choked ? ' (throat reaches Mach 1)' : ' (error $' + e(UvInf) + '\\%$)'}\nPitot: $p_0-p=${v.fix(dpP, 1)}$ Pa → $U=${v.fix(UpInf, 3)}$ m/s (error $${e(UpInf)}\\%$; true $U=${v.fix(U, 3)}$, $\\mathrm{Ma}=${v.fix(M, 3)}$)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Momentum theorem for a control volume',
      statement: String.raw`For a fixed control volume $\mathcal V$ with surface $\mathcal S$ through which fluid flows, the net force on the fluid inside equals the rate at which momentum leaves minus the rate at which it enters,
$$\mathbf F=\oint_{\mathcal S}\rho\,\mathbf u\,(\mathbf u\cdot\mathbf n)\,dS+\frac{d}{dt}\int_{\mathcal V}\rho\mathbf u\,dV .$$
For a steady flow only the flux term remains, and the force on a solid body in the stream is minus the force on the fluid when the other surface forces (here atmospheric pressure, uniform) cancel. The answer does not depend on where the control surface is drawn.`,
      idea: String.raw`Newton’s second law applies to a lump of matter, and the Reynolds transport theorem (1.8) rewrites the rate of change of its momentum for a fixed region: the change of the contents plus the net flux through the surface. A steady jet carries a fixed amount of momentum per second through any cut across it, so any closed surface that contains the same solid and cuts the same jets gives the same net flux, without ever needing to know the pressure distribution on the solid.`,
      caption: String.raw`A jet strikes a flat plate set at angle $\alpha$ to the jet (the water splits along the plate, as in an inviscid flow) or a curved vane that turns it through $\theta$. Drag the two corners of the dashed control surface wherever you like: the blue arrows are the momentum entering, the orange ones the momentum leaving, and the force on the solid (green) obtained from them does not change. Drag a corner so that the box no longer contains the solid, and the net force drops to zero: the balance is then for a different body of fluid, one that only has jets passing through it.`,
      deps: ['fluid-2.8', 'fluid-1.8'],
      refs: ['Kundu §4.4'],
      tags: ['control volume', 'momentum', 'jets'],
      scope: String.raw`Steady jets in air at uniform atmospheric pressure, negligible friction and gravity; the split of the flow along an inclined plate follows from momentum conservation along the plate with no tangential force.`,
      viz(v) {
        const mode = v.select('target', [{ value: 'plate', label: 'flat plate at angle $\\alpha$' }, { value: 'vane', label: 'curved vane turning $\\theta$' }], 'plate');
        const al = v.slider('plate angle $\\alpha$ (°)', 15, 90, 60, { step: 1 });
        const tu = v.slider('turning angle $\\theta$ (°)', 0, 180, 120, { step: 1 });
        const vs = v.slider('jet speed $V$ (m/s)', 5, 30, 15, { step: 0.5 });
        const ds = v.slider('jet diameter (mm)', 10, 50, 25, { step: 1 });
        const s = v.stage({ x: [-7, 7], y: [-5, 5], equal: true, axes: false, height: 380, full: true, title: 'jet, solid and control surface (drag the corners)' });
        const clampB = (x, y) => [clamp(x, -6.6, 6.6), clamp(y, -4.6, 4.6)];
        const c1 = s.handle(-3.2, -2.6, { color: 'orange', r: 8, constrain: clampB });
        const c2 = s.handle(3.2, 3.3, { color: 'orange', r: 8, constrain: clampB });
        const clipSeg = (P, Q, xa, xb, ya, yb) => {
          let t0 = 0, t1 = 1; const dx = Q[0] - P[0], dy = Q[1] - P[1];
          for (const [p, q] of [[-dx, P[0] - xa], [dx, xb - P[0]], [-dy, P[1] - ya], [dy, yb - P[1]]]) {
            if (Math.abs(p) < 1e-12) { if (q < 0) return null; } else { const t = q / p; if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; } }
          }
          return t0 <= t1 ? [t0, t1] : null;
        };
        let info = {};
        v.render(() => {
          const V = vs.value, dm = ds.value / 1000, Q = (V * Math.PI * dm * dm) / 4, rQV = RHO_W * Q * V;
          al.el.hidden = mode.value !== 'plate'; tu.el.hidden = mode.value !== 'vane';
          const xa = Math.min(c1.x, c2.x), xb = Math.max(c1.x, c2.x), ya = Math.min(c1.y, c2.y), yb = Math.max(c1.y, c2.y);
          const jets = [{ P: [-30, 0], Q: [0, 0], f: 1, d: [1, 0], inn: true }];
          let solid, ref;
          if (mode.value === 'plate') {
            const a = (al.value * Math.PI) / 180, d1 = [Math.cos(a), Math.sin(a)], f1 = (1 + Math.cos(a)) / 2;
            jets.push({ P: [0, 0], Q: [30 * d1[0], 30 * d1[1]], f: f1, d: d1 }, { P: [0, 0], Q: [-30 * d1[0], -30 * d1[1]], f: 1 - f1, d: [-d1[0], -d1[1]] });
            solid = [[-1.8 * d1[0], -1.8 * d1[1]], [1.8 * d1[0], 1.8 * d1[1]]];
            ref = [rQV * Math.sin(a) * Math.sin(a), -rQV * Math.sin(a) * Math.cos(a)];
          } else {
            const th = (tu.value * Math.PI) / 180, Rv = 1.6, E = [Rv * Math.sin(th), Rv * (1 - Math.cos(th))], d1 = [Math.cos(th), Math.sin(th)];
            jets.push({ P: E, Q: [E[0] + 30 * d1[0], E[1] + 30 * d1[1]], f: 1, d: d1 });
            solid = []; for (let i = 0; i <= 30; i++) { const a = -Math.PI / 2 + (th * i) / 30; solid.push([Rv * Math.cos(a), Rv + Rv * Math.sin(a)]); }
            ref = [rQV * (1 - Math.cos(th)), -rQV * Math.sin(th)];
          }
          const inside = (p) => p[0] > xa && p[0] < xb && p[1] > ya && p[1] < yb;
          const nin = solid.filter(inside).length, contains = nin === solid.length, cuts = nin > 0 && !contains;
          let infl = [0, 0], outf = [0, 0];
          const marks = [];
          const wpx = 0.17 * ds.value / 2;
          s.rect(xa, ya, xb, yb, { fill: 'orange', fillAlpha: 0.06, color: 'orange', width: 2, dash: true });
          for (const j of jets) {
            const m = [rQV * j.f * j.d[0], rQV * j.f * j.d[1]], seg = clipSeg(j.P, j.Q, xa, xb, ya, yb);
            const x1 = Math.min(j.Q[0], 7.5), L = Math.hypot(j.Q[0] - j.P[0], j.Q[1] - j.P[1]), tt = Math.min(1, 12 / L);
            s.line(j.P[0], j.P[1], j.P[0] + tt * (j.Q[0] - j.P[0]), j.P[1] + tt * (j.Q[1] - j.P[1]), { color: 'accent', width: Math.max(1.5, wpx * j.f * 2), alpha: 0.6 });
            if (!seg) continue;
            if (seg[0] > 1e-9) { infl[0] += m[0]; infl[1] += m[1]; marks.push([j.P[0] + seg[0] * (j.Q[0] - j.P[0]), j.P[1] + seg[0] * (j.Q[1] - j.P[1]), j.d, j.f, 'blue']); }
            if (seg[1] < 1 - 1e-9) { outf[0] += m[0]; outf[1] += m[1]; marks.push([j.P[0] + seg[1] * (j.Q[0] - j.P[0]), j.P[1] + seg[1] * (j.Q[1] - j.P[1]), j.d, j.f, 'orange']); }
          }
          if (mode.value === 'plate') s.line(solid[0][0], solid[0][1], solid[1][0], solid[1][1], { color: 'ink', width: 7 });
          else s.path(solid, { color: 'ink', width: 7 });
          for (const [x, y, d, f, col] of marks) {
            const L = 1.9 * f;
            if (col === 'blue') s.arrow(x - d[0] * L * 0.0 - 0, y, x + d[0] * L, y + d[1] * L, { color: 'blue', width: 4, head: 9 });
            else s.arrow(x, y, x + d[0] * L, y + d[1] * L, { color: 'orange', width: 4, head: 9 });
          }
          const F = [infl[0] - outf[0], infl[1] - outf[1]], sc = 2.6 / rQV;
          s.arrow(0, 0, F[0] * sc, F[1] * sc, { color: 'green', width: 5, head: 11 });
          s.text('force on the solid', F[0] * sc + 0.15, F[1] * sc - 0.3, { size: 12, color: 'green', align: 'left', plate: true });
          info = { F, ref, contains, cuts, rQV, infl, outf };
        });
        v.legend([['blue', 'momentum flux in'], ['orange', 'momentum flux out'], ['green', 'force on the solid']]);
        v.readout(() => {
          const { F, ref, contains, cuts, rQV } = info, fx = (x) => v.fix(x, 1);
          return `$\\rho QV=${fx(rQV)}$ N · from the control surface: $\\mathbf F=(${fx(F[0])},\\ ${fx(F[1])})$ N · closed form: $(${fx(ref[0])},\\ ${fx(ref[1])})$ N (difference $${v.sci(Math.hypot(F[0] - ref[0], F[1] - ref[1]) + 1e-12, 1)}$)\n${contains ? '**the surface encloses the solid**: same answer for every box' : cuts ? '**the surface cuts through the solid**: the balance leaves out the part of the solid outside' : '**the surface does not enclose the solid**: momentum flows straight through, net force on nothing is zero'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Paradox',
      name: 'Feynman’s reverse sprinkler',
      statement: String.raw`A lawn sprinkler with nozzles at the tips of bent arms spins when water is pumped out of them, because the jets carry away angular momentum. The question is what a sprinkler submerged in water does when the pump is reversed and water is sucked in through the same nozzles. A naive argument says it should spin the other way; an angular-momentum balance over a control volume says the torque is $\dot m\,(r_{\rm out}\times u_{\rm out}-r_{\rm in}\times u_{\rm in})$ with opposite sign, so everything depends on the angular momentum that the incoming water carries. Water drawn in from all directions (a sink flow) carries no net angular momentum about the axis, so the steady torque from the fluid vanishes and the sprinkler stays almost still.`,
      idea: String.raw`Take a control volume around the whole rotor and apply the momentum theorem (2.12) to angular momentum. Forward: water enters at the axis with zero angular momentum and leaves at the tips with tangential speed $v-\Omega L$ opposite to the rotation, so the rotor feels the torque $\dot mL(v-\Omega L)$. Reverse with sink-like inflow: water enters with zero tangential velocity and leaves at the axis with zero, so no torque arises from the flow while the rotor spins steadily, and only bearing friction acts. The naive mirror image would need the incoming water to arrive as a jet aimed into each nozzle; that jet would push the arm the same way as the outgoing jet does, not the opposite way.`,
      caption: String.raw`Top view of a two-armed sprinkler, spinning up from rest. In the *pumped out* mode, water leaves the nozzle tips as jets and the rotor accelerates to a steady speed set by the jet torque against bearing friction. In *sucked in* mode, the water converges on each nozzle from all directions; slide $\kappa$ from $0$ (sink flow, the case that is realised) to $1$ (a fictional jet aimed into the nozzle) to see what the naive mirror argument would predict, a torque in the same direction as the forward one. The right-hand plot is $\Omega(t)$.`,
      deps: ['fluid-2.12', 'mech-2.9'],
      refs: ['Kundu §4.4'],
      credit: 'Popularised by R. P. Feynman (Surely You’re Joking, Mr. Feynman!, 1985)',
      tags: ['angular momentum', 'sprinkler', 'paradox'],
      scope: String.raw`Idealised: steady flow rate $\dot m$, rigid rotor of moment of inertia $I$ (water inside the arms included), viscous bearing friction $c\,\Omega$. The torque model for the reverse case with $\kappa>0$ is a thought experiment; reported experiments find only a very small motion.`,
      viz(v) {
        const L = 1, VR = 2, I = 1.2;
        const mode = v.select('flow', [{ value: 'out', label: 'pumped out (forward)' }, { value: 'in', label: 'sucked in (reverse)' }], 'out');
        const ka = v.slider('inflow aimed into the nozzle $\\kappa$ (0 = sink flow)', 0, 1, 0, { step: 0.02 });
        const mdot = v.slider('flow rate $\\dot m$', 0.4, 2, 1, { step: 0.05 });
        const cf = v.slider('bearing friction $c$', 0.2, 2, 0.5, { step: 0.05 });
        const s = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 400, title: 'top view of the rotor (arms of length 1)' });
        const ot = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'time', ylabel: 'angular speed Ω', title: 'spin-up' });
        const law = () => {
          const q = mdot.value, c = cf.value;
          if (mode.value === 'out') { const k = c + q * L * L; return { Oinf: (q * L * VR) / k, tau: I / k }; }
          return { Oinf: (ka.value * q * L * VR) / c, tau: I / c };
        };
        const Om = (t) => { const { Oinf, tau } = law(); return Oinf * (1 - Math.exp(-t / tau)); };
        const Th = (t) => { const { Oinf, tau } = law(); return Oinf * (t - tau * (1 - Math.exp(-t / tau))); };
        let info = {};
        v.animate((t) => {
          ka.el.hidden = mode.value !== 'in';
          const { Oinf, tau } = law(), th = Th(t), q = mdot.value, fwd = mode.value === 'out';
          const ang = (k, tt) => Th(tt) + k * Math.PI;
          for (let k = 0; k < 2; k++) {
            const a = ang(k, t), e = [Math.sin(a), -Math.cos(a)], tip = [L * Math.cos(a), L * Math.sin(a)], op = [tip[0] + 0.28 * e[0], tip[1] + 0.28 * e[1]];
            s.path([[0, 0], tip, op], { color: 'ink', width: 7 });
            s.path([[0, 0], tip, op], { color: 'accent', width: 3, alpha: 0.7 });
            // droplets inside the arm
            for (let n = 0; n < 6; n++) { const f = ((n / 6 + (fwd ? 1 : -1) * t * 0.5) % 1 + 1) % 1; s.dot(f * tip[0], f * tip[1], { r: 3, color: 'gold' }); }
            if (fwd) {
              for (let n = 0; n < 16; n++) {
                const age = n * 0.09, te = t - age; if (te < 0) continue;
                const ae = ang(k, te), ee = [Math.sin(ae), -Math.cos(ae)], tp = [L * Math.cos(ae), L * Math.sin(ae)], sp = VR - Om(te) * L, opn = [tp[0] + 0.28 * ee[0], tp[1] + 0.28 * ee[1]];
                s.dot(opn[0] + sp * ee[0] * age * 0.55, opn[1] + sp * ee[1] * age * 0.55, { r: 3.2 - n * 0.12, color: 'accent' });
              }
            } else {
              for (let n = 0; n < 11; n++) {
                const bet = ((n - 5) / 5) * 1.35, w0 = rotate(e, bet), kk = ka.value, wx = (1 - kk) * w0[0] + kk * e[0], wy = (1 - kk) * w0[1] + kk * e[1], nn = Math.hypot(wx, wy);
                for (const off of [0, 0.5]) {
                  const f = (((n * 0.37 + off + t * 0.35) % 1) + 1) % 1, d = 0.95 * (1 - f);
                  s.dot(op[0] + (wx / nn) * d, op[1] + (wy / nn) * d, { r: 2.6, color: 'accent', alpha: 0.35 + 0.65 * f });
                }
              }
            }
          }
          s.dot(0, 0, { r: 7, color: 'ink' });
          if (fwd) s.text('jets carry angular momentum away', 0, -1.95, { size: 12, color: 'accent', align: 'center' });
          else s.text(ka.value < 0.02 ? 'inflow from all sides: no angular momentum' : `jet-like inflow, $\\kappa=${v.fix(ka.value, 2)}$`, 0, -1.95, { size: 12, color: 'accent', align: 'center' });
          const Tmax = 10, om = Om(t), top = Math.max(0.25, Oinf * 1.2);
          ot.setView([0, Tmax], [0, top]);
          ot.path(Array.from({ length: 101 }, (_, i) => [(Tmax * i) / 100, Om((Tmax * i) / 100)]), { color: 'accent', width: 2.6 });
          ot.hline(Oinf, { color: 'green', dash: true });
          ot.dot(t, om, { r: 6, color: 'gold' });
          const tauJet = fwd ? q * L * (VR - om * L) : ka.value * q * L * VR;
          info = { om, Oinf, tauJet, fric: cf.value * om, fwd, th, q };
        }, { period: 10, still: 7 });
        v.legend([['accent', 'water'], ['gold', 'water inside the arms'], ['green', 'terminal speed', { dash: true }]]);
        v.readout(() => {
          const { om, Oinf, tauJet, fric, fwd, q } = info;
          return fwd
            ? `angular momentum leaves at the tips at rate $\\dot m L(v-\\Omega L)=${v.fix(tauJet, 3)}$ (and enters at the axis with none) → torque on the rotor $${v.fix(tauJet, 3)}$, friction $${v.fix(fric, 3)}$ · $\\Omega=${v.fix(om, 3)}\\to${v.fix(Oinf, 3)}$`
            : `angular momentum enters at the tips at rate $\\kappa\\dot mLv=${v.fix(tauJet, 3)}$ and leaves at the axis with none → torque on the rotor $${v.fix(tauJet, 3)}$, friction $${v.fix(fric, 3)}$ · $\\Omega=${v.fix(om, 3)}\\to${v.fix(Oinf, 3)}$${tauJet < 1e-9 ? ' — **no torque: the sprinkler stays at rest**' : ''}`;
        });
      },
    },
  ],
};
