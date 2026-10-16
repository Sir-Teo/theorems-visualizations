// Mathematical Biology — Chapter 3 (part c): items 3.13–3.18
import { rk4sys, envelope, rmField, rmEq } from './ch03.shared.js';

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
      name: 'Kolmogorov’s theorem for predator–prey systems',
      credit: 'Kolmogorov, 1936',
      statement: String.raw`Consider $\dot N=N\,F(N,P)$, $\dot P=P\,G(N,P)$ for prey $N$ and predators $P$, with smooth per-capita rates satisfying, in the quadrant of interest,
(a) $\partial F/\partial P<0$ and $N\,\partial F/\partial N+P\,\partial F/\partial P\le0$ (prey growth falls with predators and with overall density),
(b) $\partial G/\partial P\le0$ and $N\,\partial G/\partial N+P\,\partial G/\partial P>0$ (predator growth does not rise with predators and rises with prey),
(c) $F(0,0)>0$; there are $K,L>0$ with $F(0,K)=0$, $F(L,0)=0$; and $G(B,0)=0$ for some $0<B<L$.
Then the system has either a **stable equilibrium** or a **stable limit cycle** in the positive quadrant (and, as seen from the phase plane, solutions stay bounded).`,
      idea: String.raw`The sign conditions force the nullclines to be graphs over the right axes, make the prey-free and predator-free axes behave as in an ecologically sensible model, and make a bounded region of the quadrant positively invariant, so every solution is bounded and no solution leaves for the boundary. Poincaré–Bendixson (3.11) then applies: the only possible $\omega$-limit sets in an invariant region are equilibria and cycles. The theorem is a general statement behind the Rosenzweig–MacArthur model; it says that no matter what functional forms are chosen the dichotomy is the same, and that in the planar case chaos is impossible.`,
      scope: String.raw`Statement recalled from textbook accounts (Murray, Freedman); the exact inequalities and the regions on which they must hold differ slightly between sources, so the viz tests them on a finite box and is a numerical check of the hypotheses, not a proof. Systems violating a hypothesis may still behave well, e.g. the Lotka–Volterra system has $\partial G/\partial P=0$ and cycles that are neutral.`,
      caption: String.raw`Pick a model and drag the predator death rate $m$. The checklist tests each hypothesis on a grid over the box $0<N\le L$, $0<P\le K$ (✓ = holds, ✗ = violated). For the first three models everything holds and the phase plane shows the dichotomy: below the Hopf value the equilibrium is stable, above it a cycle. The last two models each break one hypothesis (predator cooperation: $\partial G/\partial P>0$; an Allee effect: $F(0,0)<0$) and the theorem does not apply.`,
      deps: ['mathbio-3.9', 'mathbio-3.11'],
      tags: ['Kolmogorov', 'predator–prey'],
      refs: ['Murray I ch. 3'],
      verify: true,
      viz(v) {
        const MOD = {
          I: { name: 'type I response, logistic prey', F: (N, P) => 1 - N / 6 - P, G: (N, P, m) => N - m, L: 6, K: 1 },
          II: { name: 'type II (Rosenzweig–MacArthur)', F: (N, P) => 1 - N / 6 - P / (1 + N), G: (N, P, m) => N / (1 + N) - m, L: 6, K: 1 },
          III: { name: 'type III response', F: (N, P) => 1 - N / 6 - P * N / (1 + N * N), G: (N, P, m) => N * N / (1 + N * N) - m, L: 6, K: 1.3 },
          coop: { name: 'predators help each other ($G$ rises with $P$)', F: (N, P) => 1 - N / 6 - P / (1 + N), G: (N, P, m) => N / (1 + N) - m + 0.2 * P, L: 6, K: 1 },
          allee: { name: 'prey with an Allee effect', F: (N, P) => (N / 0.6 - 1) * (1 - N / 6) - P / (1 + N), G: (N, P, m) => N / (1 + N) - m, L: 6, K: 1 },
        };
        const sel = v.select('model', [{ value: 'I', label: 'I' }, { value: 'II', label: 'II' }, { value: 'III', label: 'III' }, { value: 'coop', label: 'cooperating predators' }, { value: 'allee', label: 'Allee prey' }], 'II');
        const m = v.slider('predator death rate $m$', 0.1, 0.9, 0.3, { step: 0.01 });
        const s = v.stage({ x: [0, 6.2], y: [0, 3.5], height: 380, axes: 'box', gutter: true, weight: 1.2, minWidth: 300, xlabel: 'prey N', ylabel: 'predators P', title: 'phase plane' });
        const pp = v.phasePlane(s, {
          f: (N, P, t, p) => { const M = MOD[sel.value]; return [N * M.F(N, P), P * M.G(N, P, p.m)]; }, params: { m }, key: () => sel.value,
          field: 'none', seeds: [[1, 0.3], [4, 1.8]], tMax: 500, trajColor: 'accent',
        });
        v.button('Clear trajectories', () => pp.clear());
        let checks = [];
        function test() {
          const M = MOD[sel.value], mm = m.value, h = 1e-5;
          const Fp = (N, P) => (M.F(N, P + h) - M.F(N, P - h)) / (2 * h), Fn = (N, P) => (M.F(N + h, P) - M.F(N - h, P)) / (2 * h);
          const Gp = (N, P) => (M.G(N, P + h, mm) - M.G(N, P - h, mm)) / (2 * h), Gn = (N, P) => (M.G(N + h, P, mm) - M.G(N - h, P, mm)) / (2 * h);
          let a1 = -Infinity, a2 = -Infinity, b1 = -Infinity, b2 = Infinity;
          for (let i = 1; i <= 30; i++) for (let j = 1; j <= 30; j++) {
            const N = M.L * i / 30, P = M.K * j / 30;
            a1 = Math.max(a1, Fp(N, P)); a2 = Math.max(a2, N * Fn(N, P) + P * Fp(N, P));
            b1 = Math.max(b1, Gp(N, P)); b2 = Math.min(b2, N * Gn(N, P) + P * Gp(N, P));
          }
          const F00 = M.F(0, 0);
          const Kr = (() => { let lo = 0, hi = 50; if (M.F(0, hi) > 0) return null; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (M.F(0, mid) > 0) lo = mid; else hi = mid; } return M.F(0, 0) > 0 ? lo : null; })();
          let Lr = null; { let prev = M.F(0.001, 0); for (let N = 0.01; N <= 20; N += 0.01) { const f = M.F(N, 0); if (prev > 0 && f <= 0) { Lr = N; break; } prev = f; } }
          let Br = null; { let prev = M.G(0, 0, mm); for (let N = 0.01; N <= 20; N += 0.01) { const g = M.G(N, 0, mm); if (prev < 0 && g >= 0) { Br = N; break; } prev = g; } }
          checks = [
            [a1 < 0, String.raw`$\partial F/\partial P<0$ (largest value ${v.fix(a1, 3)})`],
            [a2 <= 1e-9, String.raw`$N F_N+P F_P\le0$ (largest ${v.fix(a2, 3)})`],
            [b1 <= 1e-9, String.raw`$\partial G/\partial P\le0$ (largest ${v.fix(b1, 3)})`],
            [b2 > 0, String.raw`$N G_N+P G_P>0$ (smallest ${v.fix(b2, 3)})`],
            [F00 > 0, String.raw`$F(0,0)=${v.fix(F00, 2)}>0$`],
            [Kr != null, String.raw`$F(0,K)=0$: ${Kr != null ? 'K = ' + v.fix(Kr, 2) : 'no root'}`],
            [Lr != null, String.raw`$F(L,0)=0$: ${Lr != null ? 'L = ' + v.fix(Lr, 2) : 'no root'}`],
            [Br != null && Lr != null && Br < Lr, String.raw`$G(B,0)=0$ with $B<L$: ${Br != null ? 'B = ' + v.fix(Br, 2) : 'no root'}`],
          ];
        }
        v.render(() => { test(); pp.draw(); });
        pp.legend();
        v.readout(() => { test(); const all = checks.every((c) => c[0]); return `${checks.map((c) => `${c[0] ? '✓' : '✗'} ${c[1]}`).join('\n')}\n${all ? '**All hypotheses hold**: expect a stable equilibrium or a stable limit cycle.' : '**A hypothesis fails**: the theorem makes no claim.'}\n${pp.describe({ max: 3 })}`; });
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
          M.text('1 wins', 1.5, 0.2, { color: 'accent', size: 13, align: 'center' });
          M.text('2 wins', 0.5, 1.8, { color: 'orange', size: 13, align: 'center' });
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
      credit: 'Gause, 1932–34 (experiments); Hardin, 1960 (the name)',
      statement: String.raw`Two species that compete for the same limiting resource in the same way cannot coexist at constant population sizes: if their niches are identical, the one that makes better use of the resource drives the other to extinction. In the Lotka–Volterra model with equal competition coefficients $\alpha_{12}=\alpha_{21}=\alpha$ (the overlap between the species' resource use) coexistence is stable iff $\alpha<\min(K_2/K_1,\ K_1/K_2)\le1$. So as the overlap tends to $1$ the coexistence region shrinks to nothing, unless $K_1=K_2$ exactly, when it is neutral.`,
      idea: String.raw`From the four outcomes (3.16): coexistence needs both species to limit themselves more than they limit the other, $\alpha<1$ in scaled terms. Identical niches means $\alpha\to1$, and then $\alpha_{12}K_2/K_1<1$ and $\alpha_{21}K_1/K_2<1$ cannot both hold unless $K_1=K_2$. Intuitively, the species with the larger carrying capacity on the shared resource can persist at a resource level where the other cannot. The principle is a model statement (and, with more resources than species, false: see 3.20).`,
      scope: String.raw`Holds for the Lotka–Volterra competition model and for the chemostat with one resource (3.20); more generally, at most as many species can coexist at equilibrium as there are limiting factors. It does not apply with fluctuating environments, spatial structure, or non-equilibrium coexistence. Gause's own experiments used *Paramecium* and yeast cultures; here only the model is shown.`,
      caption: String.raw`Left: two species' resource-use curves (Gaussians of width $\sigma$) with their overlap shaded; the competition coefficient is the overlap fraction $\alpha=e^{-d^2/4\sigma^2}$. Middle: the model run from small densities; Right: the $(\alpha,K_2/K_1)$ plane with the coexistence wedge ($\alpha<\min(\kappa,1/\kappa)$). Slide the separation $d$ to zero and the wedge closes: one species disappears.`,
      deps: ['mathbio-3.16'],
      tags: ['Gause', 'niche'],
      refs: ['Edelstein-Keshet ch. 6'],
      links: { doi: 'https://doi.org/10.1126/science.131.3409.1292' },
      verify: true,
      viz(v) {
        const d = v.slider('niche separation $d/\\sigma$', 0, 4, 1.2, { step: 0.01 });
        const kap = v.slider('capacity ratio $\\kappa=K_2/K_1$', 0.6, 1.6, 1.1, { step: 0.01 });
        const A = v.stage({ x: [-4, 8], y: [0, 0.5], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'resource axis (e.g. prey size)', ylabel: 'use', title: 'niches' });
        const B = v.stage({ x: [0, 60], y: [0, 1.7], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'time', ylabel: 'density', title: 'competition run from small densities' });
        const C = v.stage({ x: [0, 1], y: [0.6, 1.6], height: 300, axes: 'box', gutter: true, minWidth: 260, xlabel: 'overlap α', ylabel: 'κ = K₂/K₁', title: 'coexistence wedge' });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['green', 'overlap', { area: true }]]);
        const g = (x, mu) => Math.exp(-0.5 * (x - mu) ** 2) / Math.sqrt(2 * Math.PI);
        let key = '', sol = null;
        v.render(() => {
          const dd = d.value, k = kap.value, al = Math.exp(-dd * dd / 4);
          A.between((x) => Math.min(g(x, 0), g(x, dd)), () => 0, -4, 8, { fill: 'green', fillAlpha: 0.35 });
          A.fn((x) => g(x, 0), { color: 'accent', width: 2.5 }); A.fn((x) => g(x, dd), { color: 'orange', width: 2.5 });
          const kk = [al, k].join(); if (kk !== key) { key = kk; sol = rk4sys((t, s) => [s[0] * (1 - s[0] - al * s[1] / 1), s[1] * (1 - s[1] / k - al * s[0] / k)], [0.05, 0.05], 60, 1500, 1e-9); }
          B.path(sol.ts.map((t, i) => [t, sol.ys[i][0]]), { color: 'accent', width: 2.4 }); B.path(sol.ts.map((t, i) => [t, sol.ys[i][1]]), { color: 'orange', width: 2.4 });
          B.hline(1, { color: 'accent', dash: true, alpha: 0.4 }); B.hline(k, { color: 'orange', dash: true, alpha: 0.4 });
          C.between((a) => Math.max(a, 0.6), (a) => Math.min(1 / Math.max(a, 1e-6), 1.6), 0, 1, { fill: 'green', fillAlpha: 0.3 });
          C.fn((a) => a, { color: 'green', width: 2, domain: [0.6, 1] }); C.fn((a) => 1 / Math.max(a, 1e-6), { color: 'green', width: 2, domain: [0.625, 1] });
          C.dot(al, k, { r: 7, color: 'gold' });
        });
        v.readout(() => { const dd = d.value, k = kap.value, al = Math.exp(-dd * dd / 4), lim = Math.min(k, 1 / k), co = al < lim; return `overlap $\\alpha=${v.fix(al, 3)}$; coexistence needs $\\alpha<\\min(\\kappa,1/\\kappa)=${v.fix(lim, 3)}$ → **${co ? 'stable coexistence' : k > 1 ? 'species 2 excludes species 1' : k < 1 ? 'species 1 excludes species 2' : 'neutral: identical species'}** (final densities $${sol ? v.fix(sol.ys[sol.ys.length - 1][0], 3) : ''},\\ ${sol ? v.fix(sol.ys[sol.ys.length - 1][1], 3) : ''}$)`; });
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
        pp.legend([['orange', 'time series: v (species 2)']]);
        v.readout(() => { run(); const a = al.value, b = be.value, g = a * b; if (form.value === 'sat') return `saturating benefit: always bounded; $\\alpha\\beta=${v.fix(g, 2)}$\n${pp.describe({ max: 4 })}`; return `$\\alpha\\beta=${v.fix(g, 2)}$ → ${g < 1 ? `weak mutualism: equilibrium $(${v.fix((1 + a) / (1 - g), 3)},\\,${v.fix((1 + b) / (1 - g), 3)})$, above the solo capacities $(1,1)$` : `**strong mutualism**: unbounded growth${blow != null ? `, density exceeds $10^3$ at $t=${v.fix(blow, 2)}$` : ''}`}\n${pp.describe({ max: 4 })}`; });
      },
    },
  ],
};
