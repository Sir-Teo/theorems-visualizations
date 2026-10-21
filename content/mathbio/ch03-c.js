// Mathematical Biology — Chapter 3 (part c): items 3.13–3.18
import { rk4sys, envelope, rmField, rmEq } from './ch03.shared.js';

import { PREDATOR_MODELS, predatorDiagnostics } from './mathbio-source-audit-kolmogorov.js';
import { gaussian, overlapKernel, competitionInfo, competitionRun } from './mathbio-source-audit-competition.js';

export default {
  collection: 'mathbio',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paradox',
      name: 'Paradox of enrichment',
      credit: 'Rosenzweig, 1971',
      statement: String.raw`In the Rosenzweig–MacArthur model (3.9) with a fixed predator nullcline $x=x^*$, raising the prey's carrying capacity $K$ (enriching the environment) moves the peak $(K-1)/2$ of the prey nullcline to the right. For $K<2x^*+1$ the coexistence equilibrium is stable; beyond that value a Hopf bifurcation (3.12) destabilizes it and the system settles on a limit cycle whose amplitude grows with $K$. The minimum densities along the cycle fall towards zero, so an enriched system can be driven to extinction of one or both species by any small disturbance.`,
      idea: String.raw`More food for the prey raises their equilibrium density only up to the level $x^*$ that the predators demand; the surplus goes into the amplitude of the oscillation. By the graphical criterion of 3.9 the equilibrium is stable only while the predator line cuts the hump on the falling side, and enrichment drags the peak past it. On the cycle the prey are first abundant, then eaten almost to nothing; in a finite population the troughs mean extinction. The paradox is that a change that looks beneficial destabilizes the system; it does not occur with a type I response, or if prey have refuges or the predator response is not saturating.`,
      scope: String.raw`A prediction of the Rosenzweig–MacArthur model (and of similar models with saturating response and without refuges or predator interference); observed enrichment responses in real communities vary, and the paradox has been debated and tested in the laboratory and in the field.`,
      caption: String.raw`Slide $K$ across the Hopf value $2x^*+1=2.6$ (here $x^*=0.8$). Left: prey and predator densities on a **logarithmic** scale; once cycling starts the troughs plunge. Right: the range (minimum to maximum) of the prey density on the attractor for each $K$. The *individuals* slider converts density to a head count: when a trough contains less than one individual, a real population would have gone extinct.`,
      deps: ['mathbio-3.9', 'mathbio-3.12'],
      tags: ['enrichment', 'Hopf', 'extinction'],
      refs: ['Murray I ch. 3'],
      links: { doi: 'https://doi.org/10.1126/science.171.3969.385' },
      viz(v) {
        const xs = 0.8;
        const K = v.slider('prey carrying capacity $K$', 1.5, 12, 5, { step: 0.05 });
        const om = v.slider('individuals per unit density', 10, 100000, 1000, { log: true, sig: 2 });
        const TT = 300;
        const A = v.stage({ x: [0, TT], y: [1e-6, 30], ylog: true, height: 340, axes: 'box', gutter: true, minWidth: 300, weight: 1.2, xlabel: 'time', ylabel: 'density (log scale)', title: 'populations' });
        const B = v.stage({ x: [1.5, 12], y: [1e-6, 30], ylog: true, height: 340, axes: 'box', gutter: true, minWidth: 280, xlabel: 'K', ylabel: 'prey range on the attractor', title: 'range of prey density against K' });
        v.legend([['accent', 'prey'], ['orange', 'predators'], ['green', 'Hopf value $K=2x^*+1$', { dash: true }]]);
        let key = '', sol = null, env = null, band = null;
        function ensureEnv() {
          if (env) return;
          env = [];
          for (let k = 1.5; k <= 12.001; k += 0.25) { const e = envelope(rmField(k, xs), [Math.min(k / 2, 3), 0.5], 700, 200, 0.05, 0, 1e-12); env.push([k, e[0], e[1]]); }
        }
        function run() {
          const k = K.value; if (String(k) === key) return; key = String(k);
          sol = rk4sys(rmField(k, xs), [Math.min(k / 2, 3), 0.5], TT, 6000, 1e-12);
          const e = envelope(rmField(k, xs), [Math.min(k / 2, 3), 0.5], 700, 200, 0.05, 0, 1e-12); band = e;
        }
        v.render(() => {
          run(); ensureEnv();
          const k = K.value, eq = rmEq(k, xs);
          A.hline(xs, { color: 'accent', dash: true, alpha: 0.5 });
          A.path(sol.ts.map((t, i) => [t, Math.max(sol.ys[i][0], 1e-9)]), { color: 'accent', width: 2.2 });
          A.path(sol.ts.map((t, i) => [t, Math.max(sol.ys[i][1], 1e-9)]), { color: 'orange', width: 2.2 });
          A.hline(eq[1] > 0 ? eq[1] : 1, { color: 'orange', dash: true, alpha: 0.4 });
          A.hline(1 / om.value, { color: 'red', width: 1.5, dash: true });
          A.text('one individual', TT * 0.98, 1.4 / om.value, { color: 'red', size: 11, align: 'right' });
          B.vline(2 * xs + 1, { color: 'green', dash: true });
          B.hline(1 / om.value, { color: 'red', width: 1.5, dash: true });
          for (const [kk, lo, hi] of env) B.line(kk, Math.max(lo, 1e-9), kk, Math.max(hi, 1e-9), { color: 'accent', width: 5, alpha: 0.55 });
          B.vline(k, { color: 'gold', width: 2 });
        });
        v.readout(() => { run(); const min = band[0], max = band[1], k = K.value; return `$K=${v.fix(k, 2)}$: ${k < 2 * xs + 1 ? 'equilibrium **stable**' : 'equilibrium **unstable**, cycling'}; prey on the attractor between $${v.sci(Math.max(min, 1e-12), 2)}$ and $${v.fix(max, 3)}$; trough ≈ ${v.fmt(min * om.value, 2)} individuals${min * om.value < 1 ? ' — **extinct in a finite population**' : ''}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Kolmogorov predator–prey systems: hypotheses and diagnostics',
      credit: String.raw`Modern planar limit-set theorem; the original Kolmogorov (1936) statement remains unverified`,
      statement: String.raw`For a $C^1$ planar system $\dot N=NF(N,P)$, $\dot P=PG(N,P)$, a **nonempty compact** forward limit set that contains **no equilibrium** is a regular periodic orbit (Poincaré–Bendixson). This conditional conclusion requires independently establishing those global properties. Ecological sign conditions, invasion thresholds and nullcline geometry can guide such an argument, but a finite grid cannot certify it. In particular, if equilibria are present in the limit set, connections between equilibria are another possibility; a universal “stable equilibrium or stable cycle” dichotomy does not follow just from the sampled checklist below.`,
      idea: String.raw`The planar proof uses an ordered sequence of crossings of a transverse arc: a compact limit set without a fixed point must close into a periodic orbit. To apply it to an ecological model one must also control escape to infinity and approach to the boundary, and exclude equilibria from the actual limit set. The direction of local feedback alone does not do this. Edelstein-Keshet’s geometric discussion includes an unstable coexistence equilibrium and a trapping construction, whose full geometric conditions are not certified by the displayed sample of ecological diagnostics.`,
      scope: String.raw`The exact original 1936 Kolmogorov theorem and its historical attribution are still pending verification. The supported theorem above is Teschl’s precise Poincaré–Bendixson statement. Below, derivatives are evaluated analytically on a specified $30\times30$ grid; root and invasion tests are analytic for these selected models. Passes apply only to those diagnostics. A phase portrait over finite time and a finite viewport is not proof of boundedness, persistence, attraction or uniqueness of cycles.`,
      caption: String.raw`Choose a model and predator death rate. The derivative comparisons are **sampled diagnostics**, with the sampled ranges displayed. A missing finite root is reported explicitly: for type III, $F(0,P)=1$ for every $P$, so there is no finite $K$ with $F(0,K)=0$; type II at $m=0.9$ requires $B=9>L=6$, so predators cannot invade prey at carrying capacity. Such examples show why the individual diagnostics must be assessed separately. Click to add a finite-window trajectory, or clear the paths.`,
      deps: ['mathbio-3.9', 'mathbio-3.11'],
      tags: ['Kolmogorov', 'predator–prey'],
      refs: ['Teschl §7.3, Lemma 7.13 and Theorem 7.16, pp. 222–224, complete proofs; Edelstein-Keshet, Mathematical Models in Biology §8.7 pp. 347–352, geometric discussion (not verification of original 1936 inequalities)'],
      verify: true,
      viz(v) {
        const MOD=PREDATOR_MODELS;
        const sel = v.select('model', [{ value: 'I', label: 'I' }, { value: 'II', label: 'II' }, { value: 'III', label: 'III' }, { value: 'coop', label: 'cooperating predators' }, { value: 'allee', label: 'Allee prey' }], 'II');
        const m = v.slider('predator death rate $m$', 0.1, 0.9, 0.3, { step: 0.01 });
        const s = v.stage({ x: [0, 6.2], y: [0, 3.5], height: 380, axes: 'box', gutter: true, weight: 1.2, minWidth: 300, xlabel: 'prey N', ylabel: 'predators P', title: 'phase plane' });
        const pp = v.phasePlane(s, {
          f: (N, P, t, p) => { const M = MOD[sel.value]; return [N * M.F(N, P), P * M.G(N, P, p.m)]; }, params: { m }, key: () => sel.value,
          field: 'none', seeds: [[1, 0.3], [4, 1.8]], tMax: 500, trajColor: 'accent',
        });
        v.button('Clear trajectories', () => pp.clear());
        let checks = [];
        function test(){const Q=predatorDiagnostics(sel.value,m.value);checks=[
          [Q.a1<0,String.raw`sampled $F_P<0$: max ${v.fix(Q.a1,4)}`],
          [Q.a2<=0,String.raw`sampled $NF_N+PF_P\le0$: max ${v.fix(Q.a2,4)}`],
          [Q.b1<=0,String.raw`sampled $G_P\le0$: max ${v.fix(Q.b1,4)}`],
          [Q.b2>0,String.raw`sampled $NG_N+PG_P>0$: min ${v.fix(Q.b2,4)}`],
          [Q.F00>0,`analytic $F(0,0)=${v.fix(Q.F00,2)}>0$`],
          [Q.K!==null,`analytic finite root $F(0,K)=0$: ${Q.K===null?'none':Q.K}`],
          [true,`analytic carrying-axis root $L=${Q.L}$`],
          [Q.B<Q.L,`analytic invasion threshold $B=${v.fix(Q.B,4)}<L=${Q.L}$`],
        ];}
        v.render(() => { test(); pp.draw(); });
        pp.legend();
        v.readout(()=>{test();const Q=predatorDiagnostics(sel.value,m.value);return `${checks.map(c=>`${c[0]?'✓':'✗'} ${c[1]}`).join('\n')}\nGrid: $N=6i/30$, $P=${Q.Pmax}j/30$, $i,j=1,\\ldots,30$.\n**${checks.filter(c=>c[0]).length}/8 diagnostics pass; this does not establish the global theorem’s hypotheses.**`;} );
      },
    },
    // ───────────────────────────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Model',
      name: 'Lotka–Volterra competition equations',
      credit: 'Lotka, 1925; Volterra, 1926',
      statement: String.raw`Two species that limit one another's growth are modelled by
$$\dot N_1=r_1N_1\Bigl(1-\frac{N_1+\alpha_{12}N_2}{K_1}\Bigr),\qquad \dot N_2=r_2N_2\Bigl(1-\frac{N_2+\alpha_{21}N_1}{K_2}\Bigr).$$
Here $K_i$ is the carrying capacity of species $i$ alone and $\alpha_{12}$ (resp. $\alpha_{21}$) converts individuals of species 2 (1) into the equivalent number of species 1 (2) in their effect on growth. The nullclines are straight lines $N_1+\alpha_{12}N_2=K_1$ and $N_2+\alpha_{21}N_1=K_2$, and there are up to four equilibria: $(0,0)$, $(K_1,0)$, $(0,K_2)$ and the coexistence point where the lines cross.`,
      idea: String.raw`Each equation is a logistic equation (1.4) in which the crowding term counts both species. Because the nullclines are straight lines, the possible geometric arrangements are few, and which end up on top determines the outcome (3.16). The effect of species 2 on species 1 is a *competition* coefficient, not a physical overlap; with $\alpha_{ij}=1$ individuals are interchangeable.`,
      scope: String.raw`Species with linear crowding effects, no age structure, no explicit resource dynamics and no spatial structure. $r_i$ do not affect the equilibria but they do affect the speed of approach.`,
      caption: String.raw`Set the competition coefficients and the second capacity $K_2$ (with $K_1=1$). The orange line is $\dot N_1=0$ and the purple one $\dot N_2=0$, with their axis intercepts marked $K_1$, $K_1/\alpha_{12}$, $K_2$, $K_2/\alpha_{21}$; trajectories start from a grid of points (click to add more) and show where the community goes.`,
      deps: ['mathbio-3.1', 'mathbio-1.4', 'ode-6.9'],
      tags: ['competition', 'Lotka–Volterra'],
      refs: ['Murray I ch. 3', 'Edelstein-Keshet ch. 6'],
      viz(v) {
        const a12 = v.slider('$\\alpha_{12}$', 0, 2, 0.6, { step: 0.01 });
        const a21 = v.slider('$\\alpha_{21}$', 0, 2, 0.7, { step: 0.01 });
        const K2 = v.slider('$K_2$ (with $K_1=1$)', 0.5, 2, 1.1, { step: 0.01 });
        const s = v.stage({ x: [0, 2.2], y: [0, 2.2], height: 400, axes: 'box', gutter: true, xlabel: 'species 1,  $N_1$', ylabel: 'species 2,  $N_2$', title: 'competition phase plane' });
        const seeds = []; for (let i = 1; i <= 4; i++) for (let j = 1; j <= 4; j++) seeds.push([i * 0.5, j * 0.5]);
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => [x * (1 - x - p.a12 * y), 1.2 * y * (1 - y / p.K2 - p.a21 * x / p.K2)], params: { a12, a21, K2 },
          field: 'none', seeds, maxTraj: 40, tMax: 80, trajColor: 'accent', both: false,
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => {
          pp.draw();
          const k2 = K2.value;
          s.dot(1, 0, { r: 4, color: 'orange' }); s.dot(a12.value > 0 ? 1 / a12.value : 99, 0, { r: 4, color: 'orange' });
          s.dot(0, k2, { r: 4, color: 'purple' }); s.dot(0, a21.value > 0 ? k2 / a21.value : 99, { r: 4, color: 'purple' });
          s.tex('K_1', 1, 0, { color: 'orange', dy: -26, align: 'center' });
          if (a12.value > 0.46) s.tex('K_1/\\alpha_{12}', 1 / a12.value, 0, { color: 'orange', dy: -26, align: 'center' });
          s.tex('K_2', 0, k2, { color: 'purple', dx: 22 });
          if (a21.value > 0.5 * k2) s.tex('K_2/\\alpha_{21}', 0, k2 / a21.value, { color: 'purple', dx: 40 });
        });
        pp.legend();
        v.readout(() => `$\\dot N_1=0$: $N_1+${v.fix(a12.value, 2)}N_2=1$; $\\dot N_2=0$: $N_2+${v.fix(a21.value, 2)}N_1=${v.fix(K2.value, 2)}$\n${pp.describe({ max: 4 })}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.16
    {
      num: '3.16',
      kind: 'Theorem',
      name: 'Four outcomes of two-species competition',
      statement: String.raw`In the competition model (3.15) put $u=N_1/K_1$, $v=N_2/K_2$, $\alpha=\alpha_{12}K_2/K_1$, $\beta=\alpha_{21}K_1/K_2$. Species 2 can invade a population of species 1 at $K_1$ iff $\beta<1$, and species 1 can invade species 2 at $K_2$ iff $\alpha<1$. Then, for $\alpha,\beta\ne1$ and every initial condition with $u,v>0$ (except a separatrix in the last case):
(i) $\alpha<1,\ \beta<1$: the coexistence equilibrium is a globally **stable** node;
(ii) $\alpha<1<\beta$: species 1 wins, $(u,v)\to(1,0)$;
(iii) $\beta<1<\alpha$: species 2 wins, $(u,v)\to(0,1)$;
(iv) $\alpha>1,\ \beta>1$: the coexistence point is a saddle; whichever species has the head start wins (**founder control**, a bistable system).`,
      idea: String.raw`The nullclines are two lines; their relative positions on the axes decide which of the four phase portraits occurs. At the coexistence point the Jacobian has determinant proportional to $1-\alpha\beta$ and trace $<0$ when it is positive; with $\alpha,\beta<1$ both are right, with $\alpha,\beta>1$ the determinant is negative and it is a saddle. Monotonicity of the flow (the system is competitive: each species lowers the other's growth) excludes cycles, so trajectories converge to equilibria; hence the outcomes are exactly the stable equilibria listed.`,
      scope: String.raw`Lotka–Volterra competition with no further interaction terms. Boundary cases $\alpha=1$ or $\beta=1$ have a line of equilibria or degenerate nodes.`,
      caption: String.raw`Drag the gold point in the $(\alpha,\beta)$ map; its colour region says which of the four outcomes holds, and the right panel shows the phase portrait for that choice (click for trajectories). Changing the relative growth rate $\rho$ changes how trajectories curve but never the region or the outcome.`,
      deps: ['mathbio-3.15', 'mathbio-3.2'],
      tags: ['competition', 'bistability'],
      refs: ['Murray I ch. 3'],
      viz(v) {
        const rho = v.slider('relative growth rate $\\rho=r_2/r_1$', 0.3, 3, 1, { step: 0.01 });
        const M = v.stage({ x: [0, 2], y: [0, 2], equal: true, height: 380, axes: 'box', gutter: true, minWidth: 280, xlabel: 'α  (effect of 2 on 1, scaled)', ylabel: 'β  (effect of 1 on 2, scaled)', title: 'coefficient map' });
        const P = v.stage({ x: [0, 1.6], y: [0, 1.6], equal: true, height: 380, axes: 'box', gutter: true, minWidth: 280, xlabel: 'u = $N_1/K_1$', ylabel: 'v = $N_2/K_2$', title: 'phase portrait at the chosen point' });
        const h = M.handle(0.6, 0.5, { color: 'gold', r: 8, constrain: { x: [0.02, 1.98], y: [0.02, 1.98] }, label: '(α, β)', labelPos: 'ne' });
        const seeds = []; for (let i = 1; i <= 5; i++) for (let j = 1; j <= 5; j++) seeds.push([i * 0.3, j * 0.3]);
        const pp = v.phasePlane(P, { f: (u, w, t, p) => [u * (1 - u - p.al * w), p.rho * w * (1 - w - p.be * u)], params: { al: () => h.x, be: () => h.y, rho }, field: 'none', seeds, maxTraj: 40, tMax: 100, trajColor: 'accent', both: false });
        const outcome = (a, b) => (a < 1 && b < 1 ? ['coexistence', 'green'] : a < 1 ? ['species 1 wins', 'accent'] : b < 1 ? ['species 2 wins', 'orange'] : ['founder control (bistable)', 'red']);
        v.render(() => {
          M.raster((a, b) => { const c = v.rgb(outcome(a, b)[1]); return [c[0], c[1], c[2], 0.28]; }, { res: 4, key: 'regions' });
          M.line(1, 0, 1, 2, { color: 'ink', width: 1.5 }); M.line(0, 1, 2, 1, { color: 'ink', width: 1.5 });
          M.text('coexistence', 0.5, 0.2, { color: 'green', size: 13, align: 'center' });
          M.text('2 wins', 1.5, 0.2, { color: 'orange', size: 13, align: 'center' });
          M.text('1 wins', 0.5, 1.8, { color: 'accent', size: 13, align: 'center' });
          M.text('founder control', 1.5, 1.8, { color: 'red', size: 13, align: 'center' });
          pp.draw();
        });
        pp.legend();
        v.readout(() => { const [a, b] = [h.x, h.y]; return `$\\alpha=${v.fix(a, 2)},\\ \\beta=${v.fix(b, 2)}$ → **${outcome(a, b)[0]}**; $\\alpha\\beta=${v.fix(a * b, 2)}$ ($<1$ with both below 1: stable coexistence)\n${pp.describe({ max: 4 })}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.17
    {
      num: '3.17',
      kind: 'Principle',
      name: 'Competitive exclusion principle (Gause)',
      credit: String.raw`Hardin (1960) discussion; explicit competition-model calculation below`,
      statement: String.raw`Competitive exclusion is a model-dependent statement, with identical-fitness exceptions. In the displayed Lotka–Volterra competition model $\dot N_1=N_1(1-N_1-\alpha N_2)$, $\dot N_2=N_2[1-(N_2+\alpha N_1)/\kappa]$, positive coexistence is asymptotically stable exactly when $\alpha<\min(\kappa,1/\kappa)$. Here $0<\alpha\le1$, $K_1=1$, $K_2=\kappa$. At identical overlap $\alpha=1$ with $\kappa\ne1$, the species with larger capacity excludes the other asymptotically. At $\alpha=\kappa=1$ there is instead a line of equilibria $N_1+N_2=1$, so both species can persist neutrally.`,
      idea: String.raw`At coexistence, solving the two nullclines gives $N_1^*=(1-\alpha\kappa)/(1-\alpha^2)$ and $N_2^*=(\kappa-\alpha)/(1-\alpha^2)$. Positivity and a positive Jacobian determinant require the stated inequalities; its trace is then negative. For $\alpha=\kappa=1$, both species have the same per-capita growth, so $N_1/N_2$ is constant and their sum follows a logistic equation. Exact ecological identity therefore does not by itself imply exclusion in this deterministic model. At $\alpha=1$, $\log N_1-\kappa\log N_2$ changes at the constant rate $1-\kappa$; together with bounded densities this forces exclusion of the lower-capacity species when $\kappa\ne1$.`,
      scope: String.raw`This is a chosen symmetric competition model, not a universal resource-count theorem. Nonlinear, fluctuating, spatial or degenerate systems require their own hypotheses. Hardin’s 1960 discussion distinguishes theory, identity assumptions and the limits of empirical tests; no dates of first discovery or naming, fitted cultural data or literal finite-time extinction are claimed. The Gaussian mapping to a competition coefficient is an illustrative modeling assumption.`,
      caption: String.raw`Left: normalized Gaussian resource-use curves. The green shading is their **product kernel divided by the self-overlap integral**; its full real-line area is $\alpha=e^{-d^2/4}$, not the area under the minimum of the curves. The finite drawing window omits tiny tails. Middle: a 60-unit model run from $(0.12,0.15)$. Right: the strict coexistence wedge. At coincident niches and equal capacities coexistence is neutral; finite final densities are not a verdict that exclusion has finished.`,
      deps: ['mathbio-3.16'],
      tags: ['Gause', 'niche'],
      refs: ['Hardin (1960), Science 131, pp. 1292–1295, especially identity assumption and naming discussion; explicit nullcline/Jacobian and Gaussian-integral calculations'],
      links: { doi: 'https://doi.org/10.1126/science.131.3409.1292' },
      verify: false,
      viz(v) {
        const d = v.slider('niche separation $d/\\sigma$', 0, 4, 1.2, { step: 0.01 });
        const kap = v.slider('capacity ratio $\\kappa=K_2/K_1$', 0.6, 1.6, 1.1, { step: 0.01 });
        const A = v.stage({ x: [-4, 8], y: [0, 0.65], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'resource axis (e.g. prey size)', ylabel: 'schematic curves / kernel', title: 'niches and normalized product' });
        const B = v.stage({ x: [0, 60], y: [0, 1.7], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'time', ylabel: 'density', title: 'competition run from small densities' });
        const C = v.stage({ x: [-0.04, 1.04], y: [0.54, 1.66], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'overlap α', ylabel: 'κ = K₂/K₁', title: 'coexistence wedge' });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['green', 'overlap', { area: true }]]);
        const g = gaussian;
        let key = '', sol = null;
        v.render(() => {
          const dd = d.value, k = kap.value, al = Math.exp(-dd * dd / 4);
          A.between((x) => overlapKernel(x,dd), () => 0, -4, 8, { fill: 'green', fillAlpha: 0.35 });
          A.fn((x) => g(x, 0), { color: 'accent', width: 2.5 }); A.fn((x) => g(x, dd), { color: 'orange', width: 2.5 });
          const kk=[al,k].join();if(kk!==key){key=kk;sol=competitionRun(al,k);}
          B.path(sol.ts.map((t, i) => [t, sol.ys[i][0]]), { color: 'accent', width: 2.4 }); B.path(sol.ts.map((t, i) => [t, sol.ys[i][1]]), { color: 'orange', width: 2.4 });
          B.hline(1, { color: 'accent', dash: true, alpha: 0.4 }); B.hline(k, { color: 'orange', dash: true, alpha: 0.4 });
          C.between((a) => Math.max(a, 0.6), (a) => Math.min(1 / Math.max(a, 1e-6), 1.6), 0, 1, { fill: 'green', fillAlpha: 0.3 });
          C.fn((a) => a, { color: 'green', width: 2, domain: [0.6, 1] }); C.fn((a) => 1 / Math.max(a, 1e-6), { color: 'green', width: 2, domain: [0.625, 1] });
          C.dot(al, k, { r: 7, color: 'gold' });
        });
        v.readout(()=>{const Q=competitionInfo(d.value,kap.value),names={coexistence:'stable positive coexistence',neutral:'neutral line of equilibria (both can persist)',boundary:'nonhyperbolic boundary: positive coexistence disappears',species1:'species 1 excludes species 2 asymptotically',species2:'species 2 excludes species 1 asymptotically'};return `normalized product overlap $\\alpha=${v.fix(Q.alpha,4)}$; strict threshold $${v.fix(Q.limit,4)}$ → **${names[Q.type]}**. Densities at finite $t=60$: $(${sol.ys.at(-1).map(x=>v.fix(x,4)).join(', ')})$.`;});
      },
    },
    // ───────────────────────────────────────────────────────────── 3.18
    {
      num: '3.18',
      kind: 'Model',
      name: 'Mutualism models',
      credit: 'Goh, 1979; Vandermeer & Boucher, 1978',
      statement: String.raw`Two species that benefit one another can be modelled by flipping the sign of the interaction in the competition equations (3.15): with $u=N_1/K_1$, $v=N_2/K_2$,
$$\dot u=u(1-u+\alpha v),\qquad \dot v=v(1-v+\beta u),\qquad \alpha,\beta>0.$$
If $\alpha\beta<1$ (weak mutualism) the coexistence equilibrium $\bigl(\tfrac{1+\alpha}{1-\alpha\beta},\tfrac{1+\beta}{1-\alpha\beta}\bigr)$ is globally stable in the positive quadrant, above the solo capacities $(1,1)$. If $\alpha\beta\ge1$ (strong mutualism) there is no interior equilibrium and every solution with $u,v>0$ grows without bound, in finite time. Saturating the benefit, e.g. $\alpha v/(1+v)$ in place of $\alpha v$, restores a bounded outcome.`,
      idea: String.raw`The interior equilibrium comes from the linear system $u=1+\alpha v$, $v=1+\beta u$ with solution $(1+\alpha)/(1-\alpha\beta)$ etc., positive only if $\alpha\beta<1$. Each species raises the other's carrying capacity, which raises the first species' benefit again: a positive feedback loop of gain $\alpha\beta$, which converges when the gain is below one and runs away when above. The unbounded growth is a defect of the model (unlimited benefits), not of nature, which is why mutualism models usually include saturation.`,
      scope: String.raw`Obligate mutualism (species cannot survive alone, $r<0$) and facultative variants have different equilibria and thresholds; this is the facultative case with saturating self-limitation. Whether benefits saturate depends on the system.`,
      caption: String.raw`Raise $\alpha$ and $\beta$: while $\alpha\beta<1$ the point $(u^*,v^*)$ attracts everything; at $\alpha\beta\ge1$ trajectories run off to infinity, and the simulation below (time series from $(0.5,0.5)$) shows the blow-up time. Switch to *saturating benefit* to see the runaway tamed: the coexistence equilibrium then exists for every $\alpha,\beta$.`,
      deps: ['mathbio-3.15'],
      tags: ['mutualism', 'positive feedback'],
      refs: ['Murray I ch. 3'],
      links: { doi: 'https://doi.org/10.1086/283384' },
      viz(v) {
        const form = v.select('benefit', [{ value: 'lin', label: 'linear' }, { value: 'sat', label: 'saturating' }], 'lin');
        const al = v.slider('$\\alpha$ (2 helps 1)', 0, 2.5, 0.6, { step: 0.01 });
        const be = v.slider('$\\beta$ (1 helps 2)', 0, 2.5, 0.8, { step: 0.01 });
        const P = v.stage({ x: [0, 6], y: [0, 6], equal: true, height: 360, axes: 'box', gutter: true, minWidth: 280, xlabel: 'u', ylabel: 'v', title: 'phase plane' });
        const T = v.stage({ x: [0, 12], y: [0, 8], height: 360, axes: 'box', gutter: true, minWidth: 260, xlabel: 'time', ylabel: 'density', title: 'run from (0.5, 0.5)' });
        const fld = (u, w, a, b) => (form.value === 'lin' ? [u * (1 - u + a * w), w * (1 - w + b * u)] : [u * (1 - u + a * w / (1 + w)), w * (1 - w + b * u / (1 + u))]);
        const pp = v.phasePlane(P, { f: (u, w, t, p) => fld(u, w, p.al, p.be), params: { al, be }, key: () => form.value, field: 'none', seeds: [[0.3, 0.2], [2, 5], [5, 1], [4, 4]], tMax: 40, trajColor: 'accent', maxTraj: 14 });
        v.button('Clear trajectories', () => pp.clear());
        let blow = null, key = '', ser = null;
        function run() {
          const k = [al.value, be.value, form.value].join(); if (k === key) return; key = k;
          let u = 0.5, w = 0.5, t = 0; const dt = 0.002; ser = [[0, u, w]]; blow = null;
          for (let i = 0; i < 12000; i++) {
            const k1 = fld(u, w, al.value, be.value), k2 = fld(u + dt / 2 * k1[0], w + dt / 2 * k1[1], al.value, be.value), k3 = fld(u + dt / 2 * k2[0], w + dt / 2 * k2[1], al.value, be.value), k4 = fld(u + dt * k3[0], w + dt * k3[1], al.value, be.value);
            u += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); w += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t += dt;
            if (i % 20 === 0) ser.push([t, u, w]);
            if (u > 1e3 || w > 1e3) { blow = t; break; }
          }
        }
        v.render(() => {
          run(); pp.draw();
          const a = al.value, b = be.value, lin = form.value === 'lin';
          if (lin && a * b < 1) { const d = 1 - a * b; P.dot((1 + a) / d, (1 + b) / d, { r: 5, color: 'green' }); }
          const top = ser.reduce((m, q) => Math.max(m, Math.min(q[1], 1e3), Math.min(q[2], 1e3)), 1);
          T.setView([0, Math.max(12, (ser[ser.length - 1][0]))], [0, Math.min(Math.max(top * 1.1, 2), 12)]);
          T.path(ser.map((q) => [q[0], q[1]]), { color: 'accent', width: 2.4 }); T.path(ser.map((q) => [q[0], q[2]]), { color: 'orange', width: 2.4 });
          if (blow != null) T.vline(blow, { color: 'red', dash: true });
        });
        pp.legend([['accent', 'time series: u (species 1)'], ['orange', 'time series: v (species 2)']]);
        v.readout(() => { run(); const a = al.value, b = be.value, g = a * b; if (form.value === 'sat') return `saturating benefit: always bounded; $\\alpha\\beta=${v.fix(g, 2)}$\n${pp.describe({ max: 4 })}`; return `$\\alpha\\beta=${v.fix(g, 2)}$ → ${g < 1 ? `weak mutualism: equilibrium $(${v.fix((1 + a) / (1 - g), 3)},\\,${v.fix((1 + b) / (1 - g), 3)})$, above the solo capacities $(1,1)$` : `**strong mutualism**: unbounded growth${blow != null ? `, density exceeds $10^3$ at $t=${v.fix(blow, 2)}$` : ''}`}\n${pp.describe({ max: 4 })}`; });
      },
    },
  ],
};
