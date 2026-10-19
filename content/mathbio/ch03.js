// Mathematical Biology — Chapter 3: Interacting populations (items 3.1–3.6; 3.7–3.12 in ch03-b.js, 3.13–3.18 in ch03-c.js, 3.19–3.23 in ch03-d.js)
import { rk4sys, crossings, runMean, peakTimes, lvField, lvV, cycleMean, eig2x2 } from './ch03.shared.js';

const PI = Math.PI;

function classifyTD(tr, det) {
  const disc = tr * tr - 4 * det;
  if (det < 0) return 'saddle';
  if (Math.abs(det) < 1e-9) return 'degenerate (zero eigenvalue)';
  if (Math.abs(tr) < 1e-9) return 'centre';
  if (Math.abs(disc) < 1e-9) return tr < 0 ? 'stable degenerate node' : 'unstable degenerate node';
  if (disc > 0) return tr < 0 ? 'stable node' : 'unstable node';
  return tr < 0 ? 'stable spiral' : 'unstable spiral';
}

export default {
  collection: 'mathbio',
  chapter: 3,
  title: 'Interacting populations',
  summary: String.raw`Two coupled equations already capture predation, competition and mutualism, and the phase plane is where they are understood. The Lotka–Volterra predator–prey system has a conserved quantity and neutral cycles — elegant but structurally fragile — while realistic functional responses produce genuine limit cycles via Hopf bifurcations and the paradox of enrichment. Competition models give Gause’s exclusion principle and, in the chemostat, the R* rule; the community matrix sets up the question of large-system stability.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Phase-plane analysis: nullclines and direction fields',
      statement: String.raw`For an autonomous planar system $\dot x=f(x,y)$, $\dot y=g(x,y)$, the **$x$-nullcline** $\{f=0\}$ is where the flow is purely vertical and the **$y$-nullcline** $\{g=0\}$ where it is purely horizontal. Their intersections are exactly the equilibria. Off the nullclines the signs of $(f,g)$ are constant on each region they cut out, so the direction of the flow (north-east, north-west, …) is known there, and a trajectory can only cross the $x$-nullcline vertically and the $y$-nullcline horizontally. Sketching the nullclines and these arrows gives the qualitative flow with no solving.`,
      idea: String.raw`A trajectory is a curve whose tangent is the vector $(f,g)$, so the picture is the direction field. Setting one component to zero singles out the curves where the tangent is axis-parallel, and by continuity $f$ and $g$ keep their sign in each connected region between nullclines. Equilibria need both components to vanish, hence lie on both. Near an equilibrium the local type is then read off from the linearization (3.2).`,
      scope: String.raw`Planar autonomous systems with continuous right-hand sides. In ecology the interesting region is the closed positive quadrant $x,y\ge0$, which is invariant for models of the form $\dot x=xF$, $\dot y=yG$.`,
      caption: String.raw`Choose a model and drag the parameter: the orange curve is the $x$-nullcline, the purple one the $y$-nullcline, and filled/hollow/half-filled markers are their intersections, classified. **Click** anywhere to launch a trajectory and check that it crosses the orange curve vertically and the purple one horizontally. Toggle the arrows to see the field the nullclines organise.`,
      deps: ['mathbio-1.5', 'ode-6.1'],
      tags: ['phase plane', 'nullclines'],
      refs: ['Edelstein-Keshet ch. 5'],
      viz(v) {
        const MOD = {
          lv: { f: (x, y, a) => [x * (1 - y), a * y * (x - 1)], win: [[-0.1, 3.2], [-0.1, 3.2]], par: 'predator rate $a$ in $\\dot y=ay(x-1)$', tex: String.raw`$\dot x=x(1-y),\ \dot y=a\,y(x-1)$` },
          comp: { f: (x, y, a) => [x * (1 - x - a * y), y * (1 - y - 0.7 * x)], win: [[-0.05, 1.7], [-0.05, 1.7]], par: 'competition $a=\\alpha_{12}$', tex: String.raw`$\dot x=x(1-x-ay),\ \dot y=y(1-y-0.7x)$` },
          pred: { f: (x, y, a) => [x * (1 - x / 4) - x * y / (1 + x), y * (x / (1 + x) - 0.4 * a)], win: [[-0.1, 4.3], [-0.1, 3.6]], par: 'predator loss $a$ (death rate $0.4a$)', tex: String.raw`$\dot x=x(1-\tfrac x4)-\tfrac{xy}{1+x},\ \dot y=y(\tfrac x{1+x}-0.4a)$` },
        };
        const sel = v.select('model', [{ value: 'lv', label: 'Lotka–Volterra' }, { value: 'comp', label: 'competition' }, { value: 'pred', label: 'saturating predator' }], 'lv');
        const a = v.slider('parameter $a$', 0.3, 2, 1, { step: 0.01 });
        const arrows = v.toggle('direction field', true);
        const s = v.stage({ x: [-0.1, 3.2], y: [-0.1, 3.2], height: 400, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: 'phase plane' });
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => MOD[sel.value].f(x, y, p.a), params: { a }, key: () => sel.value,
          field: 'arrows', seeds: [], tMax: 120, trajColor: 'accent', labels: true,
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => { const m = MOD[sel.value]; s.setView(m.win[0], m.win[1]); pp.draw({ field: arrows.value ? 'arrows' : 'none' }); });
        pp.legend();
        v.readout(() => `${MOD[sel.value].tex}, with ${MOD[sel.value].par} = ${v.fix(a.value, 2)}\n${pp.describe({ max: 4 })}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Linearization and the trace–determinant classification',
      statement: String.raw`Let $(x^*,y^*)$ be an equilibrium of $\dot{\mathbf x}=\mathbf F(\mathbf x)$ with $C^1$ right-hand side and Jacobian $J$, and put $\tau=\operatorname{tr}J$, $\Delta=\det J$. The eigenvalues are $\lambda=\tfrac12\bigl(\tau\pm\sqrt{\tau^2-4\Delta}\bigr)$. The equilibrium of the linear system is a **saddle** if $\Delta<0$; for $\Delta>0$ it is a **node** if $\tau^2>4\Delta$ and a **spiral** if $\tau^2<4\Delta$, stable if $\tau<0$ and unstable if $\tau>0$; for $\tau=0<\Delta$ it is a **centre**. If $J$ has no eigenvalue on the imaginary axis (hyperbolic), the nonlinear flow near $\mathbf x^*$ is topologically equivalent to the linear one (Hartman–Grobman), in particular $\tau<0<\Delta$ gives asymptotic stability.`,
      idea: String.raw`In the eigenbasis the linear flow is $e^{\lambda_1t},e^{\lambda_2t}$ (or a rotation times $e^{\operatorname{Re}\lambda\,t}$ for a complex pair), and the signs of the real parts decide growth or decay. The product of the eigenvalues is $\Delta$ and their sum is $\tau$, so the sign pattern follows from the characteristic polynomial: $\Delta<0$ forces real eigenvalues of opposite sign; the discriminant $\tau^2-4\Delta$ separates real from complex. The nonlinear statement needs Hartman–Grobman (ode-6.5), which controls the error of dropping the quadratic terms. A centre is the borderline case that linearization cannot settle.`,
      scope: String.raw`Local statement at one equilibrium. It fails at non-hyperbolic points ($\Delta=0$ or $\tau=0$, $\Delta>0$), where the nonlinear terms decide; the Lotka–Volterra centre (3.7) is the standard example.`,
      caption: String.raw`Drag the gold point in the $(\tau,\Delta)$ plane. The middle panel shows the phase portrait of $\dot x=y,\ \dot y=-\Delta x+\tau y$ (click for trajectories) and the right panel the eigenvalues in $\mathbb C$. Cross the parabola $\Delta=\tau^2/4$ and the two real eigenvalues merge and leave the axis; cross $\tau=0$ and the pair crosses the imaginary axis.`,
      deps: ['mathbio-3.1', 'pma-9.17', 'pma-9.36', 'ode-6.3', 'ode-6.5'],
      tags: ['linearization', 'stability'],
      refs: ['Edelstein-Keshet ch. 5'],
      viz(v) {
        const T = v.stage({ x: [-4, 4], y: [-2, 5], height: 330, axes: true, minWidth: 250, xlabel: 'trace τ', ylabel: 'det Δ', title: 'trace–determinant plane', xticks: [-4, -2, 0, 2, 4], yticks: [-2, 0, 2, 4] });
        const P = v.stage({ x: [-3, 3], y: [-3, 3], height: 330, axes: 'box', gutter: true, minWidth: 250, xlabel: 'x', ylabel: 'y', title: 'phase portrait' });
        const E = v.stage({ x: [-3.5, 3.5], y: [-2.5, 2.5], equal: true, height: 330, axes: true, minWidth: 250, title: 'eigenvalues in the plane' });
        const h = T.handle(-1, 2.5, { color: 'gold', r: 8, label: '(τ, Δ)', labelPos: 'ne', constrain: { x: [-4, 4], y: [-2, 5] } });
        const pp = v.phasePlane(P, { f: (x, y, t, p) => [y, -p.det * x + p.tr * y], params: { tr: () => h.x, det: () => h.y }, field: 'stream', nullclines: false, seeds: [[2, 1.5], [-1, -2.2]], tMax: 60, trajColor: 'accent' });
        v.render(() => {
          T.fn((t) => t * t / 4, { color: 'orange', width: 2.2, domain: [-4, 4] });
          T.text('saddle', 0, -1.2, { color: 'red', size: 13, align: 'center' });
          T.text('stable node', -2.6, 0.5, { color: 'muted', size: 11, align: 'center' });
          T.text('unstable node', 2.6, 0.5, { color: 'muted', size: 11, align: 'center' });
          T.text('stable spiral', -2, 3.9, { color: 'muted', size: 12, align: 'center' });
          T.text('unstable spiral', 2, 3.9, { color: 'muted', size: 12, align: 'center' });
          T.text('centre', 0.05, 3.3, { color: 'green', size: 12, align: 'left', dx: 6 });
          T.vline(0, { color: 'green', alpha: 0.4, width: 2 });
          pp.draw();
          const ev = eig2x2(0, 1, -h.y, h.x);
          ev.forEach((z, i) => E.dot(z.re, z.im, { r: 6, color: i ? 'purple' : 'accent', label: 'λ' + (i + 1), labelPos: i ? 'se' : 'ne' }));
        });
        v.readout(() => { const tr = h.x, det = h.y; return `$\\tau=${v.fix(tr, 2)},\\ \\Delta=${v.fix(det, 2)},\\ \\tau^2-4\\Delta=${v.fix(tr * tr - 4 * det, 2)}$ → **${classifyTD(tr, det)}**; $\\lambda_{1,2}=${v.fix(eig2x2(0, 1, -det, tr)[0].re, 3)}${eig2x2(0, 1, -det, tr)[0].im ? '\\pm ' + v.fix(eig2x2(0, 1, -det, tr)[0].im, 3) + 'i' : ',\\ ' + v.fix(eig2x2(0, 1, -det, tr)[1].re, 3)}$`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Lotka–Volterra predator–prey equations',
      credit: 'Lotka 1920/1925; Volterra 1926',
      statement: String.raw`With prey density $x$ and predator density $y$,
$$\dot x=\alpha x-\beta xy,\qquad \dot y=\delta xy-\gamma y,$$
where prey grow exponentially at rate $\alpha$ when alone, predation removes prey at rate $\beta xy$ (mass action), each prey eaten adds a fraction $\delta/\beta$ to the predators, and predators die at rate $\gamma$ without prey. Besides the unstable saddle $(0,0)$ there is the coexistence equilibrium $(\gamma/\delta,\ \alpha/\beta)$ around which solutions in the open quadrant cycle; for small cycles the period is $2\pi/\sqrt{\alpha\gamma}$.`,
      idea: String.raw`Each equation is a per-capita balance (1.1): the prey's per-capita growth falls linearly with predators, the predators' rises linearly with prey. The Jacobian at the interior equilibrium has trace $0$ and determinant $\alpha\gamma>0$, so the eigenvalues are $\pm i\sqrt{\alpha\gamma}$, which gives the small-cycle period; that the full orbits really close up is proved by a conserved quantity (3.4). Predators peak after prey because they can only increase once prey are abundant: the lag is a quarter of the period for small cycles.`,
      scope: String.raw`A caricature: unlimited prey growth, linear functional response, no predator saturation or delays, well-mixed populations. The cycles are neutral and structurally unstable (3.7); the model is a starting point, not a description of the hare–lynx records.`,
      caption: String.raw`Units are scaled so that $\beta=\delta=1$, giving the equilibrium $(\gamma,\alpha)$. Drag the gold start point on the phase plane (right) or change $\alpha,\gamma$: the left plot shows prey (blue) and predators (orange) oscillating out of phase, with the lag of the first predator peak after the prey peak measured as a fraction of the period.`,
      deps: ['mathbio-3.1', 'mathbio-1.2', 'ode-6.8'],
      tags: ['predator–prey', 'Lotka–Volterra'],
      refs: ['Murray I ch. 3', 'Edelstein-Keshet ch. 6'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations' },
      viz(v) {
        const al = v.slider('prey growth $\\alpha$', 0.4, 2, 1, { step: 0.01 });
        const ga = v.slider('predator death $\\gamma$', 0.4, 2, 1, { step: 0.01 });
        const TV = 24;
        const A = v.stage({ x: [0, TV], y: [0, 4], height: 340, axes: 'box', gutter: true, weight: 1.2, minWidth: 300, xlabel: 'time t', ylabel: 'density', title: 'populations against time' });
        const B = v.stage({ x: [0, 4], y: [0, 4], height: 340, axes: 'box', gutter: true, minWidth: 260, xlabel: 'prey x', ylabel: 'predators y', title: 'phase plane' });
        const h = B.handle(1.9, 1, { color: 'gold', r: 8, label: 'start', labelPos: 'ne', constrain: { x: [0.05, 5], y: [0.05, 5] } });
        v.legend([['accent', 'prey $x$'], ['orange', 'predators $y$'], ['green', 'equilibrium', { dot: true }]]);
        let key = '', sol = null, info = {};
        function compute() {
          const k = [al.value, ga.value, h.x, h.y].join();
          if (k === key) return; key = k;
          sol = rk4sys(lvField(al.value, ga.value), [h.x, h.y], TV, 3600, 1e-9);
          const xs = sol.ys.map((p) => p[0]), ys = sol.ys.map((p) => p[1]);
          const px = peakTimes(sol.ts, xs), py = peakTimes(sol.ts, ys);
          const per = px.length > 1 ? (px[px.length - 1] - px[0]) / (px.length - 1) : NaN;
          const lag = px.length && py.length ? (py.find((t) => t > px[0]) - px[0]) : NaN;
          info = { per, lag, xmax: Math.max(...xs), ymax: Math.max(...ys) };
        }
        v.animate((t) => {
          compute();
          const top = Math.max(info.xmax, info.ymax, 2.2) * 1.08;
          A.setView([0, TV], [0, top]); B.setView([0, top], [0, top]);
          A.path(sol.ts.map((tt, i) => [tt, sol.ys[i][0]]), { color: 'accent', width: 2.4 });
          A.path(sol.ts.map((tt, i) => [tt, sol.ys[i][1]]), { color: 'orange', width: 2.4 });
          A.hline(ga.value, { color: 'accent', dash: true, alpha: 0.5 }); A.hline(al.value, { color: 'orange', dash: true, alpha: 0.5 });
          B.path(sol.ys, { color: 'accent', width: 2.2 });
          B.dot(ga.value, al.value, { r: 5, color: 'green' });
          B.line(ga.value, 0, ga.value, top, { color: 'accent', alpha: 0.3 }); B.line(0, al.value, top, al.value, { color: 'orange', alpha: 0.3 });
          const tt = t % TV, i = Math.min(sol.ts.length - 1, Math.round(tt / TV * (sol.ts.length - 1)));
          A.dot(tt, sol.ys[i][0], { r: 5, color: 'gold' }); A.dot(tt, sol.ys[i][1], { r: 5, color: 'gold' });
          B.dot(sol.ys[i][0], sol.ys[i][1], { r: 6, color: 'gold' });
        }, { period: TV, still: 7 });
        v.readout(() => { compute(); return `equilibrium $(\\gamma,\\alpha)=(${v.fix(ga.value, 2)},${v.fix(al.value, 2)})$; measured period $${v.fix(info.per, 2)}$ vs small-cycle $2\\pi/\\sqrt{\\alpha\\gamma}=${v.fix(2 * PI / Math.sqrt(al.value * ga.value), 2)}$; predator peak lags prey peak by $${v.fix(info.lag, 2)}$ = ${v.fix(info.lag / info.per, 2)} of a period (a quarter, 0.25, for small cycles)`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Lotka–Volterra conserved quantity and closed orbits',
      credit: 'Volterra, 1926',
      statement: String.raw`For the Lotka–Volterra system (3.3), the function
$$V(x,y)=\delta x-\gamma\ln x+\beta y-\alpha\ln y$$
is constant along every solution in the open quadrant $x,y>0$. $V$ is strictly convex with a unique minimum at the equilibrium $(\gamma/\delta,\alpha/\beta)$ and $V\to\infty$ at the boundary and at infinity, so each level set $\{V=c\}$ above the minimum is a closed curve around the equilibrium and, since there is no other equilibrium on it, each orbit is periodic.`,
      idea: String.raw`Divide the equations by $x$ and $y$: $\dot x/x=\alpha-\beta y$ and $\dot y/y=\delta x-\gamma$. Multiplying the first by $(\delta x-\gamma)$ and the second by $(\alpha-\beta y)$ and subtracting kills the right-hand side, and the left-hand side is $\frac{d}{dt}\bigl[\delta x-\gamma\ln x+\beta y-\alpha\ln y\bigr]=0$. With canonical coordinates $q=\ln y$, $p=\ln x$, the system has Hamiltonian $H(q,p)=\delta e^p-\gamma p+\beta e^q-\alpha q=V$, since $\dot q=\partial H/\partial p$ and $\dot p=-\partial H/\partial q$. Symplectic Euler preserves the symplectic area in these log coordinates, not $V$ exactly: at sufficiently small step its energy error typically oscillates, while explicit Euler can drift outward.`,
      scope: String.raw`Exact for the pure Lotka–Volterra system only. Any term that is not of this special form (prey crowding, saturation, delays) destroys $V$ and the closed orbits (3.7).`,
      caption: String.raw`Units: $\beta=\delta=1$. Grey contours are level sets of $V$; drag the gold start point and choose how to integrate. The small-step RK4 reference closely follows a contour. *Symplectic Euler in $(\ln x,\ln y)$* generally crosses the exact contour and shows oscillating energy error; it does not conserve $V$ exactly. Explicit *Euler* can spiral outward, while *RK4* also has discretization error. Reduce the step to compare the errors.`,
      deps: ['mathbio-3.3', 'mech-12.3'],
      tags: ['conserved quantity', 'Hamiltonian'],
      refs: ['Murray I ch. 3'],
      viz(v) {
        const al = v.slider('$\\alpha$', 0.5, 1.5, 1, { step: 0.01 });
        const ga = v.slider('$\\gamma$', 0.5, 1.5, 1, { step: 0.01 });
        const meth = v.select('integrator', [{ value: 'exact', label: 'reference (tiny RK4)' }, { value: 'sym', label: 'symplectic Euler' }, { value: 'rk4', label: 'RK4' }, { value: 'euler', label: 'Euler' }], 'euler');
        const hs = v.slider('time step $h$', 0.01, 0.25, 0.08, { step: 0.005 });
        const TT = 60;
        const A = v.stage({ x: [0, 4], y: [0, 4], height: 360, axes: 'box', gutter: true, weight: 1.1, minWidth: 280, xlabel: 'prey x', ylabel: 'predators y', title: 'orbit and level sets of V' });
        const B = v.stage({ x: [0, TT], y: [-0.5, 2], height: 360, axes: 'box', gutter: true, minWidth: 260, xlabel: 'time t', ylabel: '$V-V_0$', title: 'drift of the conserved quantity' });
        const hd = A.handle(1.8, 1, { color: 'gold', r: 8, label: 'start', labelPos: 'ne', constrain: { x: [0.1, 3.9], y: [0.1, 3.9] } });
        v.legend([['accent', 'computed orbit'], ['grid', 'level sets of $V$'], ['green', 'equilibrium', { dot: true }]]);
        let pts = [], dV = [], V0 = 0, key = '';
        function run() {
          const k = [al.value, ga.value, hd.x, hd.y, meth.value, hs.value].join(); if (k === key) return; key = k;
          const a = al.value, g = ga.value, F = lvField(a, g);
          V0 = lvV(a, g, hd.x, hd.y);
          let h = meth.value === 'exact' ? 0.002 : hs.value;
          const N = Math.round(TT / h), stride = Math.max(1, Math.round(N / 1500));
          let x = hd.x, y = hd.y; pts = [[x, y]]; dV = [[0, 0]];
          for (let i = 1; i <= N; i++) {
            if (meth.value === 'euler') { const d = F(0, [x, y]); x += h * d[0]; y += h * d[1]; }
            else if (meth.value === 'sym') { let u = Math.log(x), w = Math.log(y); w += h * (Math.exp(u) - g); u += h * (a - Math.exp(w)); x = Math.exp(u); y = Math.exp(w); }
            else { const k1 = F(0, [x, y]), k2 = F(0, [x + h / 2 * k1[0], y + h / 2 * k1[1]]), k3 = F(0, [x + h / 2 * k2[0], y + h / 2 * k2[1]]), k4 = F(0, [x + h * k3[0], y + h * k3[1]]); x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); }
            if (!(x > 1e-9 && y > 1e-9 && x < 1e3 && y < 1e3)) break;
            if (i % stride === 0) { pts.push([x, y]); dV.push([i * h, lvV(a, g, x, y) - V0]); }
          }
        }
        v.render(() => {
          run();
          const a = al.value, g = ga.value, vmin = lvV(a, g, g, a);
          A.clip(() => A.contour((x, y) => (x > 0 && y > 0 ? lvV(a, g, x, y) : 99), [0.05, 0.15, 0.3, 0.5, 0.8, 1.2, 1.7, 2.3, 3, 4].map((d) => vmin + d), { color: 'grid', width: 1.2, res: 140 }));
          A.path(pts, { color: 'accent', width: 2.2 });
          A.dot(g, a, { r: 5, color: 'green' });
          const errors = dV.map(p => p[1]);
          B.setView([0, TT], [Math.min(-0.01, ...errors) * 1.15, Math.max(0.01, ...errors) * 1.15]);
          B.hline(0, { color: 'green', dash: true });
          B.path(dV, { color: 'accent', width: 2 });
        });
        v.readout(() => { run(); const d = dV.length ? dV[dV.length - 1] : [0, 0]; return `$V_0=${v.fix(V0, 4)}$, and at $t=${v.fix(d[0], 1)}$: $V-V_0=${d[1] > 100 ? '>100' : v.fix(d[1], 5)}$ (${meth.value === 'exact' ? 'small-step RK4 reference; finite discretization error' : meth.value === 'sym' ? 'symplectic step; energy is not exactly conserved' : 'numerical drift'})`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Cycle averages equal the coexistence equilibrium',
      credit: 'Volterra, 1926',
      statement: String.raw`Let $(x(t),y(t))$ be a periodic solution of the Lotka–Volterra system (3.3) with period $T$. Then its time averages over one period equal the coordinates of the equilibrium, whatever the amplitude:
$$\frac1T\int_0^T x\,dt=\frac\gamma\delta,\qquad \frac1T\int_0^T y\,dt=\frac\alpha\beta .$$`,
      idea: String.raw`Integrate $\dot x/x=\alpha-\beta y$ over a period. The left side is $\int_0^T(\ln x)'\,dt=\ln x(T)-\ln x(0)=0$ by periodicity (fundamental theorem of calculus, pma-6.21), so $\int_0^T(\alpha-\beta y)\,dt=0$, that is $\bar y=\alpha/\beta$. The same argument on $\dot y/y=\delta x-\gamma$ gives $\bar x=\gamma/\delta$.`,
      scope: String.raw`Periodic orbits of the pure Lotka–Volterra system, and more generally of any system $\dot x/x=\alpha-\beta y$, $\dot y/y=\delta x-\gamma$ with these linear per-capita rates.`,
      caption: String.raw`Three orbits of different size are shown (the gold one is draggable). Their running time averages $\frac1t\int_0^t x$ and $\frac1t\int_0^t y$ wobble at first but settle on the dashed equilibrium values, however big the swings. The readout averages over whole cycles only, measured between up-crossings of $x=\gamma$.`,
      deps: ['mathbio-3.4', 'pma-6.21'],
      tags: ['time averages', 'Volterra laws'],
      refs: ['Murray I ch. 3'],
      viz(v) {
        const al = v.slider('$\\alpha$', 0.5, 1.5, 1, { step: 0.01 });
        const ga = v.slider('$\\gamma$', 0.5, 1.5, 1, { step: 0.01 });
        const TT = 80;
        const P = v.stage({ x: [0, 6], y: [0, 6], height: 330, axes: 'box', gutter: true, minWidth: 250, xlabel: 'prey x', ylabel: 'predators y', title: 'three orbits' });
        const X = v.stage({ x: [0, TT], y: [0, 3], height: 330, axes: 'box', gutter: true, minWidth: 250, xlabel: 'time t', ylabel: 'average prey', title: 'running average of prey' });
        const Y = v.stage({ x: [0, TT], y: [0, 3], height: 330, axes: 'box', gutter: true, minWidth: 250, xlabel: 'time t', ylabel: 'average predators', title: 'running average of predators' });
        const h = P.handle(2.2, 1, { color: 'gold', r: 8, label: 'drag', labelPos: 'ne', constrain: { x: [0.05, 5.8], y: [0.05, 5.8] } });
        v.legend([['gold', 'orbit A'], ['teal', 'small orbit B'], ['purple', 'large orbit C'], ['muted', 'equilibrium value', { dash: true }]]);
        let key = '', runs = [], cyc = [];
        const cols = ['gold', 'teal', 'purple'];
        function compute() {
          const k = [al.value, ga.value, h.x, h.y].join(); if (k === key) return; key = k;
          const a = al.value, g = ga.value;
          const starts = [[h.x, h.y], [g + 0.25, a], [g * 3.4, a * 0.5 + 0.2]];
          runs = starts.map((s0) => { const sol = rk4sys(lvField(a, g), s0, TT, 6400, 1e-9); const xs = sol.ys.map((p) => p[0]), ys = sol.ys.map((p) => p[1]); return { sol, xs, ys, mx: runMean(sol.ts, xs), my: runMean(sol.ts, ys) }; });
          cyc = runs.map((r) => ({ x: cycleMean(r.sol.ts, r.xs, r.xs, g), y: cycleMean(r.sol.ts, r.ys, r.xs, g) }));
        }
        v.render(() => {
          compute();
          const a = al.value, g = ga.value;
          const top = Math.max(2, ...runs.map((r) => Math.max(...r.xs, ...r.ys))) * 1.05;
          P.setView([0, top], [0, top]);
          runs.forEach((r, i) => P.path(r.sol.ys, { color: cols[i], width: 2 }));
          P.dot(g, a, { r: 5, color: 'green' });
          X.hline(g, { color: 'muted', dash: true }); Y.hline(a, { color: 'muted', dash: true });
          runs.forEach((r, i) => { X.path(r.mx.filter((_, j) => j > 20), { color: cols[i], width: 2 }); Y.path(r.my.filter((_, j) => j > 20), { color: cols[i], width: 2 }); });
          const yt = Math.max(g, a) * 2;
          X.setView([0, TT], [0, yt]); Y.setView([0, TT], [0, yt]);
        });
        v.readout(() => { compute(); const f = (c, k) => (c && c[k] ? v.fix(c[k].mean, 4) : '—'); return `whole-cycle averages (prey, predators): A $(${f(cyc[0], 'x')},${f(cyc[0], 'y')})$, B $(${f(cyc[1], 'x')},${f(cyc[1], 'y')})$, C $(${f(cyc[2], 'x')},${f(cyc[2], 'y')})$; equilibrium $(\\gamma,\\alpha)=(${v.fix(ga.value, 4)},${v.fix(al.value, 4)})$`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Principle',
      name: 'Volterra’s principle',
      credit: 'Volterra, 1926 (prompted by D’Ancona’s Adriatic fish-market statistics)',
      statement: String.raw`Suppose a Lotka–Volterra community is harvested indiscriminately, each species being removed at a rate proportional to its density with the same effort $E$: $\dot x=(\alpha-E)x-\beta xy$, $\dot y=\delta xy-(\gamma+E)y$. Then the cycle averages become $\bar x=(\gamma+E)/\delta$ and $\bar y=(\alpha-E)/\beta$ (for $E<\alpha$). Moderate fishing therefore **raises** the average prey population and **lowers** the average predator population; relaxing it does the opposite, so the predators' share rises when fishing is reduced.`,
      idea: String.raw`Harvesting simply replaces $\alpha$ by $\alpha-E$ and $\gamma$ by $\gamma+E$, and by the averages theorem (3.5) the mean prey is the new $(\gamma+E)/\delta$ and the mean predators the new $(\alpha-E)/\beta$. At coexistence, predator growth must offset its additional mortality, so the average prey density required to sustain predators rises. Meanwhile the reduced net prey growth supports fewer predators. Volterra’s original 1926 note, p. 559, reports D’Ancona’s increase of selachians in Adriatic catches during the war, when fishing nearly ceased, relative to the preceding and following periods.`,
      scope: String.raw`For positive initial populations, positive constant coefficients, and $0\le E<\alpha$, these are exact full-cycle averages (or equilibrium values). The fisheries attribution is checked against Volterra’s own 1926 report; D’Ancona’s underlying catch tables have not been independently audited. Stock density and fish-market catch composition are different quantities; the curves are a mathematical illustration, not a fit to those observations.`,
      caption: String.raw`Effort is high, then **paused** (middle third), then resumed. The top plot is model output with $\beta=\delta=1$, $\alpha=1$, $\gamma=0.6$: the pause changes the reference cycle averages in favour of predators; the finite-time trajectories also oscillate. The lower left shows the predators' share $y/(x+y)$ of the stock, and the right panel compares the cycle averages measured numerically (dots) with $\gamma+E$ and $\alpha-E$ (lines).`,
      deps: ['mathbio-3.5'],
      tags: ['harvesting', 'Volterra'],
      refs: ['Volterra (1926), Nature 118:558–560, Laws II–III and p. 559 fisheries discussion', 'Murray I ch. 3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Umberto_D%27Ancona' },
      viz(v) {
        const Eh = v.slider('fishing effort $E$', 0.1, 0.6, 0.5, { step: 0.01 });
        const El = v.slider('effort during the pause', 0, 0.3, 0.02, { step: 0.01 });
        const al = 1, ga = 0.6, TT = 90;
        const A = v.stage({ x: [0, TT], y: [0, 3], height: 300, axes: 'box', gutter: true, full: true, xlabel: 'time (model units)', ylabel: 'density', title: 'prey and predators under changing effort (model)' });
        const B = v.stage({ x: [0, TT], y: [0, 1], height: 250, axes: 'box', gutter: true, weight: 1.2, minWidth: 280, xlabel: 'time', ylabel: 'predator share', title: 'share of predators in the stock, $y/(x+y)$' });
        const C = v.stage({ x: [0, 0.6], y: [0, 1.4], height: 250, axes: 'box', gutter: true, minWidth: 260, xlabel: 'effort E', ylabel: 'cycle average', title: 'averages against effort' });
        v.legend([['accent', 'prey'], ['orange', 'predators'], ['gold', 'fishing on', { area: true }], ['muted', 'pause', { area: true }]]);
        let sol = null, key = '', meas = {};
        function compute() {
          const k = [Eh.value, El.value].join(); if (k === key) return; key = k;
          const E = (t) => (t < 30 || t >= 60 ? Eh.value : El.value);
          sol = rk4sys((t, s) => { const e = E(t); return [s[0] * (al - e - s[1]), s[1] * (s[0] - ga - e)]; }, [ga + Eh.value + 0.3, al - Eh.value], TT, 9000, 1e-9);
          meas = {};
          for (const [name, e] of [['hi', Eh.value], ['lo', El.value]]) {
            const r = rk4sys((t, s) => [s[0] * (al - e - s[1]), s[1] * (s[0] - ga - e)], [ga + e + 0.25, al - e], 400, 40000, 1e-9);
            const xs = r.ys.map((p) => p[0]), ys = r.ys.map((p) => p[1]);
            meas[name] = { e, x: cycleMean(r.ts, xs, xs, ga + e), y: cycleMean(r.ts, ys, xs, ga + e) };
          }
        }
        v.render(() => {
          compute();
          const top = Math.max(...sol.ys.map((p) => Math.max(p[0], p[1]))) * 1.06;
          A.setView([0, TT], [0, top]);
          A.rect(0, 0, 30, top, { fill: 'gold', fillAlpha: 0.1, stroke: false }); A.rect(60, 0, TT, top, { fill: 'gold', fillAlpha: 0.1, stroke: false });
          A.rect(30, 0, 60, top, { fill: 'muted', fillAlpha: 0.1, stroke: false });
          A.path(sol.ts.map((t, i) => [t, sol.ys[i][0]]), { color: 'accent', width: 2.2 });
          A.path(sol.ts.map((t, i) => [t, sol.ys[i][1]]), { color: 'orange', width: 2.2 });
          B.rect(30, 0, 60, 1, { fill: 'muted', fillAlpha: 0.1, stroke: false });
          B.path(sol.ts.map((t, i) => [t, sol.ys[i][1] / (sol.ys[i][0] + sol.ys[i][1])]), { color: 'orange', width: 2.2 });
          B.hline((al - Eh.value) / (al + ga), { color: 'muted', dash: true }); B.hline((al - El.value) / (al + ga), { color: 'green', dash: true });
          C.fn((e) => ga + e, { color: 'accent', width: 2, domain: [0, 0.6] }); C.fn((e) => al - e, { color: 'orange', width: 2, domain: [0, 0.6] });
          for (const m of [meas.hi, meas.lo]) { if (m.x) C.dot(m.e, m.x.mean, { r: 6, color: 'accent' }); if (m.y) C.dot(m.e, m.y.mean, { r: 6, color: 'orange' }); }
        });
        v.readout(() => { compute(); const f = (m, k) => (m[k] ? v.fix(m[k].mean, 3) : '—'); return `effort $E=${v.fix(Eh.value, 2)}$: averages (prey, predators) $(${f(meas.hi, 'x')},${f(meas.hi, 'y')})$ vs predicted $(${v.fix(ga + Eh.value, 3)},${v.fix(al - Eh.value, 3)})$; paused, $E=${v.fix(El.value, 2)}$: $(${f(meas.lo, 'x')},${f(meas.lo, 'y')})$ vs $(${v.fix(ga + El.value, 3)},${v.fix(al - El.value, 3)})$. Predator share at the averages: ${v.fix((al - Eh.value) / (al + ga), 3)} → ${v.fix((al - El.value) / (al + ga), 3)}`; });
      },
    },
  ],
};
