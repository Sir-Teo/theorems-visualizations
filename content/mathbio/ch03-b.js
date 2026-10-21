// Mathematical Biology — Chapter 3 (part b): items 3.7–3.12
import { rk4sys, eig2x2 } from './ch03.shared.js';

import { perturbation, response, risk, feed, brusselatorAmplitude, brusselatorTrajectories } from './mathbio-source-audit-predator.js';

const PI = Math.PI;

export default {
  collection: 'mathbio',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Structural instability of the Lotka–Volterra centre',
      credit: String.raw`Local perturbation calculation; structural stability in the usual planar-flow sense`,
      statement: String.raw`The Lotka–Volterra centre is **structurally unstable**: arbitrarily small smooth perturbations can replace its surrounding closed orbits by spiralling trajectories. For prey crowding, $\dot x=x(1-y-\varepsilon x)$, $\dot y=y(x-1)$, the equilibrium is $(1,1-\varepsilon)$ and $(\operatorname{tr}J,\det J)=(-\varepsilon,1-\varepsilon)$. For predator saturation, $\dot x=x(1-y/(1+\varepsilon x))$, $\dot y=y(x/(1+\varepsilon x)-1)$, the equilibrium is $(1/(1-\varepsilon),1/(1-\varepsilon))$ and the trace is $+\varepsilon$ with the same determinant. On the displayed range $0<\varepsilon\le0.4$, the discriminant $\varepsilon^2-4(1-\varepsilon)<0$: these are stable and unstable spirals respectively.`,
      idea: String.raw`At zero perturbation the first integral in 3.4 gives a family of periodic orbits. With a nonzero trace the interior equilibrium is hyperbolic and its nearby orbits spiral; no homeomorphism of local phase portraits can turn those orbits into closed ones. Exhibiting these arbitrarily small changes is enough to establish failure of structural stability. It does **not** mean every small perturbation destroys the centre: changes that preserve a Lotka–Volterra form still have an integral.`,
      scope: String.raw`Local conclusion near the coexistence equilibrium; the displayed parameters are $0\le\varepsilon\le0.4$. Nonhyperbolicity alone does not determine nonlinear stability. Persistence of an isolated periodic orbit requires hyperbolicity, not merely isolation. No global attractor or extinction claim is made for the saturation model.`,
      caption: String.raw`Choose a perturbation and vary its size. The finite phase window shows inward or outward spiralling near coexistence; trajectories can leave this window. Click inside it to add a trajectory, or clear all trajectories. At $\varepsilon=0$ the unperturbed closed orbits return.`,
      deps: ['mathbio-3.4', 'mathbio-3.2', 'ode-6.6'],
      tags: ['structural stability', 'centre'],
      refs: ['Kuznetsov, Elements of Applied Bifurcation Theory, second edition, §2.5 pp. 69–72; Teschl, §7.1 pp. 209–213; direct Jacobian calculation for the two displayed perturbations'],
      verify: false,
      viz(v) {
        const kind = v.select('perturbation', [{ value: 'crowd', label: 'prey crowding $-\\varepsilon x^2$' }, { value: 'sat', label: 'predator saturation' }], 'crowd');
        const eps = v.slider('size $\\varepsilon$', 0, 0.4, 0.08, { step: 0.005 });
        const s = v.stage({ x: [0, 4], y: [0, 4], height: 400, axes: 'box', gutter: true, xlabel: 'prey x', ylabel: 'predators y', title: 'phase plane (click to add trajectories)' });
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => (kind.value === 'crowd' ? [x * (1 - y - p.e * x), y * (x - 1)] : [x * (1 - y / (1 + p.e * x)), y * (x / (1 + p.e * x) - 1)]),
          params: { e: eps }, key: () => kind.value, field: 'none', nullclines: false, seeds: [[1.7, 1], [2.4, 1.2], [0.5, 0.5]], tMax: 400, trajColor: 'cycle',
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => pp.draw());
        pp.legend();
        v.readout(() => {
          const e = eps.value, info=perturbation(kind.value,e), tr=info.trace, det=info.det;
          return `interior equilibrium $${kind.value === 'crowd' ? `(1,\\,${v.fix(1 - e, 3)})` : `(${v.fix(1 / (1 - e), 3)},\\,${v.fix(1 / (1 - e), 3)})`}$: trace $${v.fix(tr, 3)}$, determinant $${v.fix(det, 3)}$ → ${e === 0 ? '**centre** (closed orbits)' : tr < 0 ? '**stable spiral**' : '**unstable spiral**'}; real part of the eigenvalues $${v.fix(tr / 2, 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Model',
      name: 'Holling functional responses (types I–III)',
      credit: String.raw`Holling, 1959: disc equation (type II); I and III below are explicitly chosen comparison models`,
      statement: String.raw`For dimensionless prey density $N$, compare $f_I=\min(aN,1/h)$, $f_{II}=aN/(1+ahN)$ and the chosen sigmoid $f_{III}=aN^2/(1+ahN^2)$. Here $f$ is intake per predator per time, $h$ is handling time, and $a$ sets encounter intensity. Type II is Holling’s disc equation. If density has physical units, $a$ has different units in the quadratic type III model. The limiting intake is $1/h$. The per-prey risk $f/N$ decreases for II and peaks at $N=1/\sqrt{ah}$ for III.`,
      idea: String.raw`Holling’s time budget is $n=aNT_s$, $T=T_s+hn$, giving $n/T=aN/(1+ahN)$. The 1959 paper derives this equation and tests its assumptions using human subjects searching for sandpaper discs. It also observes sigmoid responses but does not derive the particular quadratic formula used here; replacing the encounter intensity by $aN^2$ is our illustrative model, rather than an identified mechanism for every sigmoid response.`,
      scope: String.raw`Fixed prey density and constant parameters; the simulation replenishes prey implicitly. A curve fit alone does not verify a behavioral mechanism. For II/III, random exponential searches alternate with fixed handling and only completed meals are counted; their long-run rates are the curves. The I points instead use a capped Poisson count, a separate illustrative construction. All observations use a fixed 120-unit window, so finite-window bias and noise are expected.`,
      caption: String.raw`Left: chosen intake formula, faint comparison curves, and generated observations (not experimental data). Right: risk per prey, including its limit at zero density. Resample changes the seeded random searches. The type I count is capped at $\lfloor120/h\rfloor$; II/III count completed search-and-handling cycles.`,
      deps: ['mathbio-3.3'],
      tags: ['functional response', 'handling time'],
      refs: ['Holling (1959), Some Characteristics of Simple Types of Predation and Parasitism, pp. 385–391, equations (1)–(10); remaining formulas derived directly here'],
      links: { doi: 'https://doi.org/10.4039/ent91385-7' },
      verify: false,
      viz(v) {
        const typ = v.select('type', [{ value: 'I', label: 'I' }, { value: 'II', label: 'II' }, { value: 'III', label: 'III' }], 'II');
        const a = v.slider('encounter coefficient $a$', 0.2, 2, 0.8, { step: 0.01 });
        const h = v.slider('handling time $h$', 0.1, 1, 0.5, { step: 0.01 });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const NM = 10;
        const A = v.stage({ x: [0, NM], y: [0, 3], height: 340, axes: 'box', gutter: true, minWidth: 280, xlabel: 'prey density N', ylabel: 'prey eaten per predator per time', title: 'functional response' });
        const B = v.stage({ x: [0, NM], y: [0, 1], height: 340, axes: 'box', gutter: true, minWidth: 260, xlabel: 'prey density N', ylabel: 'f(N)/N', title: 'risk per prey' });
        v.legend([['accent', 'selected type'], ['gold', 'simulated predator', { dot: true }], ['muted', 'ceiling $1/h$', { dash: true }]]);
        const F=response;
        v.render(() => {
          const aa = a.value, hh = h.value, t = typ.value;
          const ymax = Math.max(1.2 / hh, 0.5);
          A.setView([0, NM], [-0.06*ymax, ymax]);
          A.hline(1 / hh, { color: 'muted', dash: true });
          for (const o of ['I', 'II', 'III']) if (o !== t) A.fn((N) => F(o, N, aa, hh), { color: 'muted', width: 1.4, alpha: 0.5, domain: [0, NM] });
          A.fn((N) => F(t, N, aa, hh), { color: 'accent', width: 3, domain: [0, NM] });
          const r = v.rng(seed);
          const dens = [0.5, 1, 1.5, 2, 3, 4.5, 6, 8, 9.6];
          dens.forEach((N) => A.dot(N, feed(t, N, aa, hh, 120, r), { r: 5, color: 'gold' }));
          const top=t==='III'?Math.sqrt(aa/hh)/2:aa;
          B.setView([0, NM], [0, Math.max(top * 1.15, 0.05)]);
          B.fn((N) => risk(t,N,aa,hh), { color: 'accent', width: 3, domain: [0, NM] });
          if (t === 'III') { const Nm = Math.sqrt(1 / (aa * hh)); B.vline(Nm, { color: 'orange', dash: true }); B.tex('N=1/\\sqrt{ah}', Nm, top * 1.07, { color: 'orange', align: 'center' }); }
        });
        v.readout(() => { const aa = a.value, hh = h.value; return `ceiling $1/h=${v.fix(1 / hh, 2)}$ prey per unit time; half-saturation (type II) at $N=1/(ah)=${v.fix(1 / (aa * hh), 2)}$; type III risk per prey peaks at $N=1/\\sqrt{ah}=${v.fix(1 / Math.sqrt(aa * hh), 2)}$`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Rosenzweig–MacArthur predator–prey model',
      credit: 'Rosenzweig & MacArthur, 1963',
      statement: String.raw`Combine logistic prey growth with a type II functional response (3.8). In scaled form
$$\dot x=x\Bigl(1-\frac xK\Bigr)-\frac{xy}{1+x},\qquad \dot y=y\Bigl(\frac{x}{1+x}-m\Bigr),$$
with $m<1$. The predator nullcline is the vertical line $x=x^*=m/(1-m)$; the prey nullcline is the hump $y=(1-x/K)(1+x)$ with maximum at $x=(K-1)/2$. The interior equilibrium $(x^*,y^*)$, $y^*=(1-x^*/K)(1+x^*)$, exists for $0<x^*<K$ and is **stable if the predator nullcline cuts the prey hump on its descending side** ($x^*>(K-1)/2$) and **unstable if it cuts on the rising side** ($x^*<(K-1)/2$); in the unstable case solutions approach a limit cycle.`,
      idea: String.raw`The Jacobian at the interior equilibrium has determinant $>0$ and its trace has the sign of the slope of the prey nullcline at $x^*$, which is the derivative of the hump: positive to the left of the maximum, negative to the right. So the equilibrium changes stability exactly where the predator line passes through the peak of the hump, a Hopf bifurcation (3.12). The cycle that appears is trapped by the positive quadrant's boundary and the Poincaré–Bendixson theorem (3.11) supplies its existence. Rosenzweig and MacArthur (1963) presented this graphically, with nullclines drawn in the density plane.`,
      scope: String.raw`Scaled with the attack rate and half-saturation constant set to 1 and conversion efficiency absorbed in $m$; real systems add predator density dependence, refuges, delays and stochasticity.`,
      caption: String.raw`Drag the predator nullcline (the vertical purple line, set by $x^*$) across the hump: when it sits to the right of the peak (dashed green) the equilibrium is a stable spiral and trajectories converge; to the left, a limit cycle appears. Raise $K$ to move the peak to the right and flip a stable system into cycling (3.13).`,
      deps: ['mathbio-3.8', 'mathbio-1.4'],
      tags: ['predator–prey', 'limit cycle'],
      refs: ['Murray I ch. 3'],
      links: { doi: 'https://doi.org/10.1086/282272' },
      viz(v) {
        const K = v.slider('carrying capacity $K$', 2, 12, 6, { step: 0.1 });
        const xs = v.slider('predator nullcline $x^*$', 0.2, 5, 1.2, { step: 0.01 });
        const s = v.stage({ x: [0, 6.5], y: [0, 4], height: 400, axes: 'box', gutter: true, xlabel: 'prey x', ylabel: 'predators y', title: 'phase plane' });
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => [x * (1 - x / p.K) - x * y / (1 + x), y * (x / (1 + x) - p.xs / (1 + p.xs))], params: { K, xs },
          field: 'none', tMax: 600, trajColor: 'accent', seeds: [[0.8, 0.5], [3.5, 2.5]],
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => {
          const k = K.value, top = (k + 1) ** 2 / (4 * k);
          s.setView([0, k * 1.04], [0, Math.max(top * 2.3, 1)]);
          pp.draw();
          s.vline((k - 1) / 2, { color: 'green', dash: true, alpha: 0.9 });
          s.tex('x=\\tfrac{K-1}{2}', (k - 1) / 2, top * 2.2, { color: 'green', align: 'left', dx: 5 });
        });
        pp.legend([['green', 'peak of the prey hump', { dash: true }]]);
        v.readout(() => { const k = K.value, x = xs.value, peak = (k - 1) / 2; return x >= k ? `$x^*\\ge K$: no interior equilibrium, predators die out` : `$x^*=${v.fix(x, 2)}$ vs hump peak $(K-1)/2=${v.fix(peak, 2)}$ → equilibrium **${x > peak ? 'stable (to the right of the peak)' : x < peak ? 'unstable, limit cycle (left of the peak)' : 'at the Hopf point'}**\n${pp.describe({ max: 3 })}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Limit cycles',
      statement: String.raw`A **limit cycle** is an isolated closed orbit of a planar autonomous system: no other closed orbit lies in a neighbourhood of it. It is **stable** if nearby trajectories converge to it as $t\to\infty$, unstable if they leave, and the amplitude and period are fixed by the system, not by the initial condition. Linear systems and conservative systems such as Lotka–Volterra have families of closed orbits but never limit cycles. A convenient test is the Poincaré return map $P$ on a section crossing the cycle: closed orbits correspond to fixed points $P(r^*)=r^*$ and the cycle is stable when $|P'(r^*)|<1$.`,
      idea: String.raw`In a conservative system an orbit that returns remembers its starting level, so $P(r)=r$ for every $r$: a whole interval of fixed points. A limit cycle is a *transversal*, isolated fixed point of $P$, so the return map has a derivative at the fixed point (the Floquet multiplier), and attraction is exactly $|P'|<1$. Van der Pol's oscillator $\ddot x-\mu(1-x^2)\dot x+x=0$, introduced for triode circuits, is the standard example; its cycle exists for every $\mu>0$ and becomes a relaxation oscillation for large $\mu$.`,
      scope: String.raw`Two-dimensional flows. In higher dimensions attracting closed orbits are also called limit cycles, but the picture of the return map is then multi-dimensional.`,
      caption: String.raw`Left: Van der Pol's oscillator with trajectories from inside and outside; all wind onto the same closed curve (green, found by the kit). Right: the return map $P$ to the section $\{y=0,\ x>0\}$ with the diagonal; the cobweb from your start $x_0$ converges to the fixed point, the cycle. Raise $\mu$ and the cycle turns from an ellipse into a relaxation oscillation.`,
      deps: ['mathbio-3.1', 'ode-7.1'],
      tags: ['limit cycle', 'return map'],
      refs: ['Edelstein-Keshet ch. 8'],
      links: { doi: 'https://doi.org/10.1080/14786442608564127' },
      viz(v) {
        const mu = v.slider('van der Pol parameter $\\mu$', 0.2, 3, 1, { step: 0.01 });
        const x0 = v.slider('start $x_0$ on the section', 0.1, 4, 0.6, { step: 0.01 });
        const A = v.stage({ x: [-4.5, 4.5], y: [-6, 6], height: 380, axes: 'box', gutter: true, minWidth: 280, xlabel: 'x', ylabel: 'y = x′', title: 'phase plane' });
        const B = v.stage({ x: [0, 4.5], y: [0, 4.5], equal: true, height: 380, axes: 'box', gutter: true, minWidth: 280, xlabel: 'x on the section', ylabel: 'next return P(x)', title: 'Poincaré return map' });
        const pp = v.phasePlane(A, { f: (x, y, t, p) => [y, p.mu * (1 - x * x) * y - x], params: { mu }, field: 'none', nullclines: false, seeds: [[0.1, 0], [3.8, 4], [-3, -5]], tMax: 400, trajColor: 'accent', method: 'rk45' });
        function P(m, x) {
          const F = (t, s) => [s[1], m * (1 - s[0] * s[0]) * s[1] - s[0]];
          const dt = 0.01; let s = [x, 0], prev = s;
          for (let i = 0; i < 20000; i++) {
            const k1 = F(0, s), k2 = F(0, [s[0] + dt / 2 * k1[0], s[1] + dt / 2 * k1[1]]), k3 = F(0, [s[0] + dt / 2 * k2[0], s[1] + dt / 2 * k2[1]]), k4 = F(0, [s[0] + dt * k3[0], s[1] + dt * k3[1]]);
            prev = s; s = [s[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
            if (i > 20 && prev[1] > 0 && s[1] <= 0 && s[0] > 0) { const q = prev[1] / (prev[1] - s[1]); return prev[0] + q * (s[0] - prev[0]); }
          }
          return NaN;
        }
        let ckey = '', curve = [], fix = NaN, mult = NaN;
        function prep() {
          const m = mu.value; if (String(m) === ckey) return; ckey = String(m);
          curve = []; for (let x = 0.1; x <= 4.5001; x += 0.1) curve.push([x, P(m, x)]);
          let x = 1; for (let i = 0; i < 12; i++) x = P(m, x);
          fix = x; mult = (P(m, x + 1e-3) - P(m, x - 1e-3)) / 2e-3;
        }
        v.legend([['accent', 'trajectories'], ['gold', 'orbit from $x_0$'], ['orange', 'return map $P$'], ['muted', 'diagonal', { dash: true }]]);
        v.render(() => {
          prep();
          pp.draw();
          const sol = rk4sys((t, s) => [s[1], mu.value * (1 - s[0] * s[0]) * s[1] - s[0]], [x0.value, 0], 40, 4000);
          A.path(sol.ys, { color: 'gold', width: 1.8 });
          A.dot(x0.value, 0, { r: 5, color: 'gold' });
          B.line(0, 0, 4.5, 4.5, { color: 'muted', dash: true });
          B.path(curve.filter((c) => isFinite(c[1])), { color: 'orange', width: 3 });
          const pts = [[x0.value, 0]]; let x = x0.value;
          for (let i = 0; i < 7; i++) { const y = P(mu.value, x); if (!isFinite(y)) break; pts.push([x, y], [y, y]); x = y; }
          B.path(pts, { color: 'gold', width: 1.6 });
          if (isFinite(fix)) B.dot(fix, fix, { r: 6, color: 'green', label: 'cycle', labelPos: 'se' });
        });
        v.readout(() => { prep(); return `fixed point of the return map: $x^*=${v.fix(fix, 4)}$ (the cycle crosses the section there), multiplier $P'(x^*)=${v.fix(mult, 4)}$ → ${Math.abs(mult) < 1 ? '**stable** limit cycle ($|P\'|<1$)' : 'unstable'}; for small $\\mu$ the amplitude tends to $2$`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Poincaré–Bendixson theorem',
      credit: 'Poincaré (1880s); Bendixson, 1901',
      statement: String.raw`Let $\dot{\mathbf x}=\mathbf F(\mathbf x)$ be a $C^1$ planar system and let $R$ be a closed bounded region with finitely many equilibria such that a trajectory enters $R$ and never leaves. Then the $\omega$-limit set of that trajectory is an equilibrium, a periodic orbit, or a closed loop made of equilibria and the trajectories joining them. In particular, **if $R$ is positively invariant and contains no equilibrium, it contains a periodic orbit.** An annulus whose inner boundary has the flow pointing outward and whose outer boundary has it pointing inward, and which contains no equilibrium, is the standard such region.`,
      idea: String.raw`In the plane a bounded trajectory cannot wander: a closed curve (Jordan curve theorem) separates the plane, and a trajectory can cross a transversal section only monotonically. So the successive crossings of a section are ordered along it, bounded and hence convergent, and the limit of the trajectory is a closed orbit unless an equilibrium gets in the way. The theorem fails in dimension three, where the Lorenz attractor lives (ode-11); this is why planar models like (3.9) cannot be chaotic.`,
      scope: String.raw`Planar autonomous systems only (or systems on a cylinder or sphere); the equilibria must be finite in number. It proves existence of a cycle, not uniqueness or stability.`,
      caption: String.raw`The system is $\dot x=x(1-r^2)-y(1+bx)$, $\dot y=y(1-r^2)+x(1+bx)+cy$ with $r^2=x^2+y^2$. Choose the radii of the annulus (shaded): arrows on the two boundary circles are green where they point into the region and red where they leave. When the verdict turns green (inward on both rims, no equilibrium inside), every trajectory started inside winds onto a cycle. Push the inner radius to $0$ and the origin, an unstable equilibrium, spoils the argument.`,
      deps: ['mathbio-3.10', 'ode-7.2'],
      tags: ['trapping region', 'existence of cycles'],
      refs: ['Edelstein-Keshet ch. 8', 'Murray I ch. 3'],
      links: { doi: 'https://doi.org/10.1007/bf02403068' },
      viz(v) {
        const r1 = v.slider('inner radius $r_1$', 0, 1.5, 0.5, { step: 0.01 });
        const r2 = v.slider('outer radius $r_2$', 0.6, 2.8, 1.9, { step: 0.01 });
        const b = v.slider('$b$', 0, 1, 0.4, { step: 0.01 });
        const c = v.slider('$c$', 0, 1, 0.4, { step: 0.01 });
        const s = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, height: 420, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: 'trapping annulus' });
        const F = (x, y, bb, cc) => { const rr = x * x + y * y; return [x * (1 - rr) - y * (1 + bb * x), y * (1 - rr) + x * (1 + bb * x) + cc * y]; };
        const pp = v.phasePlane(s, { f: (x, y, t, p) => F(x, y, p.b, p.c), params: { b, c }, field: 'none', nullclines: false, seeds: [[0.3, 0.1], [2.2, 1.4], [-1.2, -1.8], [0.7, -0.4]], tMax: 80, trajColor: 'accent' });
        let verdict = {};
        function analyse() {
          const rin = r1.value, rout = r2.value, bb = b.value, cc = c.value;
          let inMin = Infinity, outMax = -Infinity, speedMin = Infinity;
          for (let i = 0; i < 360; i++) {
            const th = i * PI / 180, ct = Math.cos(th), st = Math.sin(th);
            const fi = F(rin * ct, rin * st, bb, cc), fo = F(rout * ct, rout * st, bb, cc);
            inMin = Math.min(inMin, rin > 0 ? fi[0] * ct + fi[1] * st : -1); outMax = Math.max(outMax, fo[0] * ct + fo[1] * st);
          }
          for (let rr = Math.max(rin, 0); rr <= rout; rr += (rout - Math.max(rin, 0)) / 40 || 1) for (let i = 0; i < 90; i++) { const th = i * PI / 45, f = F(rr * Math.cos(th), rr * Math.sin(th), bb, cc); speedMin = Math.min(speedMin, Math.hypot(f[0], f[1])); }
          verdict = { inMin, outMax, speedMin, ok: inMin > 0 && outMax < 0 && speedMin > 1e-3 && rin < rout };
        }
        v.render(() => {
          analyse();
          pp.draw();
          const rin = r1.value, rout = r2.value, ring = (r) => Array.from({ length: 121 }, (_, i) => [r * Math.cos(i * PI / 60), r * Math.sin(i * PI / 60)]);
          s.rings(rin > 0 ? [ring(rout), ring(rin)] : [ring(rout)], { evenodd: true, fill: verdict.ok ? 'green' : 'red', fillAlpha: 0.12, stroke: false });
          for (const [r, sgn] of [[rin, 1], [rout, -1]]) {
            if (r <= 0) continue;
            for (let i = 0; i < 16; i++) {
              const th = i * PI / 8, ct = Math.cos(th), st = Math.sin(th), f = F(r * ct, r * st, b.value, c.value);
              const rad = (f[0] * ct + f[1] * st) * sgn > 0; const L = 0.34, len = Math.hypot(f[0], f[1]) || 1;
              s.arrow(r * ct, r * st, r * ct + L * f[0] / len, r * st + L * f[1] / len, { color: rad ? 'green' : 'red', width: 2 });
            }
            s.path(ring(r), { color: 'muted', width: 1, dash: true });
          }
        });
        pp.legend();
        v.readout(() => { analyse(); const d = verdict; return `inner rim: smallest outward component $${rIn(d.inMin)}$ (needs $>0$); outer rim: largest outward component $${v.fix(d.outMax, 3)}$ (needs $<0$); smallest speed in the annulus $${v.fix(d.speedMin, 3)}$ (needs $>0$: no equilibrium)\n${d.ok ? '**Hypotheses hold: the annulus is trapping and contains a periodic orbit.**' : '**Hypotheses fail: the theorem gives no conclusion for this region.**'}`; function rIn(x) { return x === -1 ? '\\text{(origin inside)}' : v.fix(x, 3); } });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Hopf bifurcation: birth of a limit cycle',
      credit: String.raw`Andronov–Hopf bifurcation; modern author proof: Kuznetsov, §3.4–3.5`,
      statement: String.raw`Let $\dot{\mathbf x}=\mathbf F(\mathbf x,\mu)$ be a smooth planar family with an equilibrium $\mathbf x^*(\mu)$ whose Jacobian has a complex pair $\lambda(\mu)=\sigma(\mu)\pm i\omega(\mu)$ with $\sigma(\mu_0)=0$, $\omega(\mu_0)>0$ and $\sigma'(\mu_0)\ne0$ (so the pair crosses the imaginary axis with non-zero speed). Then, provided a non-degeneracy condition on the cubic terms (the first Lyapunov coefficient $\ell_1\ne0$) holds, a branch of periodic orbits bifurcates from the equilibrium at $\mu_0$ with period near $2\pi/\omega(\mu_0)$. If $\ell_1<0$ the bifurcation is **supercritical**: a stable cycle exists on the side where the equilibrium has become unstable, and its amplitude grows like $\sqrt{|\mu-\mu_0|}$.`,
      idea: String.raw`Near the critical point a smooth change of variables gives $\dot z=(\sigma+i\omega)z+c z|z|^2+\text{higher-order terms}$. The sign of $\operatorname{Re}c$ determines the radial cubic: a negative coefficient yields a stable cycle on the $\sigma>0$ side. The imaginary cubic term changes frequency; a constant angular speed is not generally exact. For the displayed Brusselator ($a=1$), $\operatorname{tr}J=b-2$, $\det J=1$. At $b=2$, write $u=x-1$, $v=-(x+y-3)$: $\dot u=-v-2uv-u^3-u^2v$, $\dot v=u$. The planar cubic radial coefficient is $-3/8$, so the Hopf bifurcation is supercritical, and the leading half-range of $x$ is $\sqrt{4(b-2)/3}$.`,
      scope: String.raw`Local theorem with a simple imaginary pair, nonzero crossing speed and nonzero first Lyapunov coefficient. For the subcritical case an unstable small cycle lies on the stable-equilibrium side; the local theorem says nothing about a distant attractor or a jump destination. Numerical trajectories and finite-window amplitude estimates illustrate the Brusselator, but are not a proof of a global cycle branch.`,
      caption: String.raw`Slide $b$ through $2$. The phase plane shows trajectories over $0\le t\le300$ from two fixed initial states; the middle panel gives exact eigenvalues. Right: numerical half-ranges over $t=800$–$880$ at $b=2.05,2.10,\ldots,3.20$ (dots), and the **local leading asymptotic** $\sqrt{4(b-2)/3}$ shown only to $b=2.2$ (dashed), without fitting a coefficient to distant cycles. The gold guide marks the current parameter, not a zero amplitude measurement.`,
      deps: ['mathbio-3.2', 'mathbio-3.10', 'ode-8.13'],
      tags: ['Hopf bifurcation', 'oscillation'],
      refs: ['Kuznetsov, Elements of Applied Bifurcation Theory, second edition, §§3.4–3.5 and Theorems 3.3–3.4; Edelstein-Keshet, ch. 7 problem 20 (Brusselator equations); direct planar cubic calculation'],
      verify: false,
      viz(v) {
        const a = 1, bc = 1 + a * a;
        const b = v.slider('parameter $b$', 1.4, 3.2, 1.8, { step: 0.01 });
        const P = v.stage({ x: [0, 4.5], y: [0, 4.5], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'x', ylabel: 'y', title: 'phase plane' });
        const E = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, axes: true, minWidth: 240, title: 'eigenvalues of the Jacobian' });
        const A = v.stage({ x: [1.35, 3.25], y: [-0.12, 2.2], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'b', ylabel: 'cycle amplitude of x', title: 'amplitude against b' });
        let phaseKey=null,phase=null;
        let amps = null;
        function amplitudes() {
          if (amps) return amps; amps = [];
          for (let j=1;j<=24;j++) { const bb=2+j*.05; amps.push([bb,brusselatorAmplitude(bb).amplitude]); }
          return amps;
        }
        v.render(() => {
          const bb = b.value, tr = bb - 1 - a * a, dets = a * a;
          if(phaseKey!==bb){phase=brusselatorTrajectories(bb);phaseKey=bb;}
          P.setView([-0.08,Math.max(4.5,phase.bounds[0]*1.06)],[-0.08,Math.max(4.5,phase.bounds[1]*1.06)]);
          phase.paths.forEach((path,i)=>P.path(path,{color:i?'muted':'accent',width:i?1.3:2.2,alpha:i?.6:1}));
          P.dot(a, bb / a, { r: 5, color: tr < 0 ? 'green' : 'red' });
          const ev = eig2x2(bb - 1, a * a, -bb, -a * a);
          E.vline(0, { color: 'muted', dash: true });
          E.dot(0, 1, { r: 3, color: 'faint' }); E.dot(0, -1, { r: 3, color: 'faint' });
          ev.forEach((z) => E.dot(z.re, z.im, { r: 7, color: z.re < 0 ? 'green' : 'red' }));
          const am = amplitudes();
          A.vline(bc, { color: 'orange', dash: true });
          A.fn((x) => Math.sqrt(4*(x-bc)/3), { color: 'muted', dash: true, width: 2, domain: [bc, 2.2] });
          am.forEach((q) => A.dot(q[0], q[1], { r: 4, color: 'accent' }));
          A.vline(bb, { color: 'gold', width: 1.5 });
          void dets;
        });
        v.readout(() => { const bb = b.value, tr = bb - 1 - a * a, ev = eig2x2(bb - 1, a * a, -bb, -a * a); return `$b=${v.fix(bb, 2)}$, $b_c=${v.fix(bc, 2)}$: equilibrium $(1,\\,${v.fix(bb, 2)})$, $\\operatorname{tr}J=${v.fix(tr, 2)}$, $\\lambda=${v.fix(ev[0].re, 3)}\\pm ${v.fix(Math.abs(ev[0].im), 3)}i$ → ${tr < 0 ? 'stable spiral' : tr > 0 ? 'unstable focus (finite simulated branch shown separately)' : 'Hopf point'}`; });
      },
    },
  ],
};
