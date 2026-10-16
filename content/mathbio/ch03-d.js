// Mathematical Biology — Chapter 3 (part d): items 3.19–3.23
import { rk4sys, crossings, runMean, lvField, lvV, cycleMean, lvOrbitPeriod } from './ch03.shared.js';

const PI = Math.PI;

export default {
  collection: 'mathbio',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.19
    {
      num: '3.19',
      kind: 'Model',
      name: 'The chemostat',
      credit: 'Monod, 1950; Novick & Szilard, 1950',
      statement: String.raw`A **chemostat** is a culture vessel of constant volume fed with fresh medium containing nutrient at concentration $S_0$ at rate $D$ (per volume), with the same volume of culture removed. With nutrient $S$, bacterial density $x$, growth rate $\mu(S)=\mu_m S/(K+S)$ (Monod) and yield $1$,
$$\dot S=D(S_0-S)-\mu(S)\,x,\qquad \dot x=\bigl(\mu(S)-D\bigr)x .$$
The washout state $(S_0,0)$ always exists. A second equilibrium with the culture alive, $S^*=\lambda=\dfrac{DK}{\mu_m-D}$, $x^*=S_0-\lambda$, exists iff $D<\mu_m$ and $\lambda<S_0$; it is then globally attracting for $x(0)>0$ and the washout state is a saddle. If $D\ge\mu_m$ or $\lambda\ge S_0$ the culture is washed out.`,
      idea: String.raw`The break-even concentration $\lambda$ is where growth exactly balances dilution, $\mu(\lambda)=D$. Below it the culture shrinks, above it grows, so the nutrient is drawn down to $\lambda$ and then the biomass absorbs the rest: $S+x\to S_0$ since $(S+x)^{\boldsymbol\cdot}=D(S_0-S-x)$, which reduces the problem to a one-dimensional dynamics on the line $S+x=S_0$. Linearizing at the interior equilibrium gives a stable node. The device keeps a culture at a controllable steady state, which is why it is used for physiology and as a model of lakes and guts.`,
      scope: String.raw`Well-mixed vessel, one limiting nutrient, constant yield and no cell death (wall growth and maintenance costs change the quantitative picture). Parameters here are $\mu_m=1$, $K=0.5$, yield $1$.`,
      caption: String.raw`The vessel (left) fills with bacteria as the simulated time advances (playing); the middle plot shows $S(t)$ and $x(t)$, the right plot the $(S,x)$ phase plane with nullclines. Raise the dilution rate $D$: the steady culture shrinks until $D=\mu_m$ or $\lambda\ge S_0$, and the bacteria wash out.`,
      deps: ['mathbio-3.1', 'mathbio-1.5'],
      tags: ['chemostat', 'Monod', 'washout'],
      refs: ['Edelstein-Keshet ch. 4'],
      links: { doi: 'https://doi.org/10.1126/science.112.2920.715' },
      verify: true,
      viz(v) {
        const D = v.slider('dilution rate $D$', 0.05, 1.2, 0.4, { step: 0.01 });
        const S0 = v.slider('feed concentration $S_0$', 0.2, 6, 3, { step: 0.05 });
        const TT = 40, mu = (S) => S / (0.5 + S);
        const Vs = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: false, minWidth: 230, weight: 0.8, title: 'culture vessel' });
        const Ts = v.stage({ x: [0, TT], y: [0, 6.2], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'time', ylabel: 'concentration', title: 'nutrient and bacteria' });
        const Ps = v.stage({ x: [0, 6.2], y: [0, 6.2], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'nutrient S', ylabel: 'bacteria x', title: 'phase plane' });
        const pp = v.phasePlane(Ps, { f: (S, x, t, p) => [p.D * (p.S0 - S) - mu(S) * x, (mu(S) - p.D) * x], params: { D, S0 }, field: 'none', seeds: [[3, 0.2], [0.6, 4]], tMax: 80, trajColor: 'accent' });
        v.legend([['teal', 'nutrient $S$'], ['orange', 'bacteria $x$']]);
        const r = v.rng(11), cells = Array.from({ length: 220 }, () => [r(), r(), r() * 6.28]);
        let key = '', sol = null;
        function run() {
          const k = [D.value, S0.value].join(); if (k === key) return; key = k;
          sol = rk4sys((t, s) => [D.value * (S0.value - s[0]) - mu(s[0]) * s[1], (mu(s[0]) - D.value) * s[1]], [S0.value, 0.2], TT, 1600, 0);
        }
        v.animate((t) => {
          run();
          const tt = (t % 20) / 20 * TT, i = Math.min(sol.ts.length - 1, Math.round(tt / TT * (sol.ts.length - 1))), [S, x] = sol.ys[i];
          Vs.rect(0.25, 0.1, 0.75, 0.72, { fill: 'teal', fillAlpha: 0.08 + 0.4 * Math.min(1, S / S0.value), color: 'ink', width: 2.5 });
          const n = Math.round(220 * Math.min(1, x / Math.max(S0.value, 1)));
          for (let j = 0; j < n; j++) { const c = cells[j]; Vs.dot(0.27 + 0.46 * (c[0] + 0.012 * Math.sin(t * 2 + c[2])), 0.12 + 0.58 * (c[1] + 0.012 * Math.cos(t * 2.3 + c[2])), { r: 2.6, color: 'orange' }); }
          Vs.arrow(0.03, 0.86, 0.36, 0.86, { color: 'teal', width: 3 }); Vs.arrow(0.36, 0.86, 0.36, 0.74, { color: 'teal', width: 3 });
          Vs.tex('\\text{feed } S_0=' + v.fix(S0.value, 2) + ',\\ \\text{rate } D', 0.03, 0.93, { size: 13, color: 'teal', align: 'left' });
          Vs.arrow(0.64, 0.12, 0.64, 0.02, { color: 'muted', width: 3 }); Vs.arrow(0.64, 0.02, 0.97, 0.02, { color: 'muted', width: 3 });
          Vs.tex('\\text{outflow } D', 0.97, 0.085, { size: 12, color: 'muted', align: 'right' });
          Ts.path(sol.ts.map((q, j) => [q, sol.ys[j][0]]), { color: 'teal', width: 2.4 });
          Ts.path(sol.ts.map((q, j) => [q, sol.ys[j][1]]), { color: 'orange', width: 2.4 });
          Ts.vline(tt, { color: 'gold', width: 1.6 });
          pp.draw();
          Ps.dot(S, x, { r: 6, color: 'gold' });
        }, { period: 20, still: 10 });
        pp.legend([['teal', 'nutrient $S(t)$'], ['orange', 'bacteria $x(t)$']]);
        v.readout(() => { const d = D.value, s0 = S0.value, lam = d < 1 ? d * 0.5 / (1 - d) : Infinity; const alive = d < 1 && lam < s0; return `break-even $\\lambda=DK/(\\mu_m-D)=${isFinite(lam) ? v.fix(lam, 3) : '\\infty'}$ vs feed $S_0=${v.fix(s0, 2)}$ → ${alive ? `**culture survives**: $S^*=${v.fix(lam, 3)}$, $x^*=${v.fix(s0 - lam, 3)}$` : '**washout**: $x\\to0$, $S\\to S_0$'}\n${pp.describe({ max: 3 })}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Competitive exclusion in the chemostat: the R* rule',
      credit: 'Hsu, Hubbell & Waltman, 1977; Tilman, 1977–82 (R* formulation)',
      statement: String.raw`Let $n$ strains with Monod growth $\mu_i(S)=\mu_{m,i}S/(K_i+S)$ compete for one nutrient in a chemostat with dilution rate $D$:
$$\dot S=D(S_0-S)-\sum_i\mu_i(S)\,x_i,\qquad \dot x_i=\bigl(\mu_i(S)-D\bigr)x_i .$$
Define the break-even concentration $R_i^*=\dfrac{DK_i}{\mu_{m,i}-D}$ (if $\mu_{m,i}>D$; $\infty$ otherwise). If the $R_i^*$ are distinct, the smallest one is $R_1^*<S_0$ and $x_1(0)>0$, then $x_j(t)\to0$ for all $j\ne1$ while $S\to R_1^*$ and $x_1\to S_0-R_1^*$: the strain that can hold the nutrient at the lowest level wins, whatever the initial densities.`,
      idea: String.raw`While strain 1 is present, once $S$ approaches $R_1^*$ every competitor with $R_j^*>R_1^*$ has $\mu_j(S)<D$ and decays, since $\mu_j$ is increasing. The proof (Hsu–Hubbell–Waltman) uses a Lyapunov argument showing $S$ is eventually driven to $R^*_1$, because strain 1 grows whenever $S>R_1^*$ and declines whenever $S<R_1^*$. The winner depends on $D$: because the curves $\mu_i$ may cross, the ranking of the $R_i^*$ changes with the dilution rate, so no strain is best everywhere.`,
      scope: String.raw`One limiting resource, constant environment (no oscillating $D$ or $S_0$), same yield for all strains, no inhibition or cross-feeding. With more limiting resources than strains coexistence becomes possible; so does it with temporal fluctuation (the 'paradox of the plankton' remains debated). Hansen and Hubbell (1980) tested the prediction with *Escherichia coli* strains; here only the model is shown.`,
      caption: String.raw`Four strains with different Monod curves (left; horizontal line at the dilution rate $D$, dots at their break-even points $R_i^*$). Right: the simulated densities on a log axis: all but one decay. Drag $D$: at $D=0.3$ strain 4 (smallest $R^*$) wins; around $D=0.45$ the ranking flips and strain 2 wins. The readout compares the simulated survivor with the strain of minimum $R^*$.`,
      deps: ['mathbio-3.19', 'mathbio-3.17'],
      tags: ['R*', 'resource competition'],
      refs: ['Edelstein-Keshet ch. 4'],
      links: { doi: 'https://doi.org/10.1137/0132030' },
      verify: true,
      viz(v) {
        const D = v.slider('dilution rate $D$', 0.1, 0.8, 0.3, { step: 0.005 });
        const S0 = v.slider('feed $S_0$', 1, 5, 3, { step: 0.05 });
        const ST = [['strain 1', 1.0, 1.2, 'accent'], ['strain 2', 0.7, 0.3, 'orange'], ['strain 3', 0.9, 0.6, 'purple'], ['strain 4', 0.5, 0.1, 'teal']];
        const TT = 700;
        const A = v.stage({ x: [0, 3], y: [0, 1.05], height: 340, axes: 'box', gutter: true, minWidth: 260, xlabel: 'nutrient S', ylabel: 'growth rate μ(S)', title: 'Monod curves and break-even points' });
        const B = v.stage({ x: [0, TT], y: [1e-8, 20], ylog: true, height: 340, axes: 'box', gutter: true, minWidth: 300, weight: 1.2, xlabel: 'time', ylabel: 'density (log scale)', title: 'competition for one nutrient' });
        v.legend(ST.map((s) => [s[3], s[0]]));
        const Rstar = (s, d) => (s[1] > d ? d * s[2] / (s[1] - d) : Infinity);
        let key = '', sol = null;
        function run() {
          const k = [D.value, S0.value].join(); if (k === key) return; key = k;
          const d = D.value, s0 = S0.value;
          sol = rk4sys((t, y) => { let dS = d * (s0 - y[0]); const out = [0]; for (let i = 0; i < 4; i++) { const m = ST[i][1] * y[0] / (ST[i][2] + y[0]); dS -= m * y[i + 1]; out.push((m - d) * y[i + 1]); } out[0] = dS; return out; }, [s0, 0.1, 0.1, 0.1, 0.1], TT, 7000, 1e-12);
        }
        v.render(() => {
          run();
          const d = D.value;
          A.hline(d, { color: 'ink', dash: true });
          ST.forEach((s, i) => {
            A.fn((S) => s[1] * S / (s[2] + S), { color: s[3], width: 2.4, domain: [0, 3] });
            const R = Rstar(s, d); if (R < 3) { A.dot(R, d, { r: 6, color: s[3] }); A.vline(R, { color: s[3], dash: true, alpha: 0.45 }); }
          });
          ST.forEach((s, i) => B.path(sol.ts.map((t, j) => [t, Math.max(sol.ys[j][i + 1], 1e-12)]), { color: s[3], width: 2.2 }));
          B.path(sol.ts.map((t, j) => [t, Math.max(sol.ys[j][0], 1e-12)]), { color: 'muted', width: 1.6, dash: true });
        });
        v.readout(() => {
          run(); const d = D.value, last = sol.ys[sol.ys.length - 1];
          const Rs = ST.map((s) => Rstar(s, d)), win = Rs.indexOf(Math.min(...Rs)), sim = last.slice(1).indexOf(Math.max(...last.slice(1)));
          return `$R^*_i$ = ${Rs.map((R) => (isFinite(R) ? v.fix(R, 3) : '∞')).join(', ')} → predicted winner **${isFinite(Rs[win]) && Rs[win] < S0.value ? ST[win][0] : 'none (washout)'}**; simulated survivor **${last[sim + 1] > 1e-3 ? ST[sim][0] : 'none'}** with $S(T)=${v.fix(last[0], 3)}$ (dashed grey curve = nutrient; it settles at $R^*$ of the winner)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.21
    {
      num: '3.21',
      kind: 'Model',
      name: 'Generalized Lotka–Volterra systems and the community matrix',
      credit: 'May, 1972',
      statement: String.raw`The generalized Lotka–Volterra system for $n$ species is $\dot x_i=x_i\bigl(r_i+\sum_ja_{ij}x_j\bigr)$. At an interior equilibrium $\mathbf x^*$ ($r_i+\sum_ja_{ij}x_j^*=0$) the Jacobian is the **community matrix** $M=\operatorname{diag}(\mathbf x^*)\,A$, and the equilibrium is locally stable iff every eigenvalue of $M$ has negative real part. May (1972) considered random $A$: diagonal entries $-1$ (self-regulation), each off-diagonal entry non-zero with probability $C$ (connectance) and then drawn with mean $0$ and variance $\sigma^2$. For large $n$ the eigenvalues fill a disc of radius $\sigma\sqrt{nC}$ centred at $-1$, so a random community is almost surely stable if $\sigma\sqrt{nC}<1$ and almost surely unstable if $\sigma\sqrt{nC}>1$.`,
      idea: String.raw`A random matrix with independent entries of variance $s^2$ has eigenvalues spread uniformly over a disc of radius $s\sqrt n$ (the circular law); shifting by the diagonal $-1$ places the disc at $-1$ and stability requires the disc to lie in the left half-plane. Hence more species ($n$), more interactions ($C$) or stronger ones ($\sigma$) make a community *less* stable: complexity breeds instability, contrary to the ecological intuition of the time. Real communities are not random (they have structure, hierarchy and interaction types), which is why the result generated a long debate about diversity and stability.`,
      scope: String.raw`Local stability of an assumed equilibrium with independent random entries and no correlations between $a_{ij}$ and $a_{ji}$ (predator–prey pairs would give them opposite signs, which changes the spectrum); the disc law is an asymptotic statement and the disc is only approximate at small $n$. Here the equilibrium is $\mathbf x^*=\mathbf 1$ by choosing $\mathbf r=-A\mathbf 1$.`,
      caption: String.raw`Left: the interaction matrix $A$ as a heat map (diagonal $-1$). Middle: its eigenvalues (dots) inside May's disc of radius $\sigma\sqrt{nC}$ about $-1$; the community is stable when all dots are left of the dashed imaginary axis. Right: the community after a random kick of $15\%$ to every density: stable communities return to 1, unstable ones drift away (extinctions end at $0$). Slide $n$, $\sigma$ or $C$ through the boundary $\sigma\sqrt{nC}=1$ and press *Resample*.`,
      deps: ['mathbio-3.15', 'mathbio-3.2'],
      tags: ['community matrix', 'complexity', 'stability'],
      refs: ['Murray I ch. 3'],
      links: { doi: 'https://doi.org/10.1038/238413a0' },
      viz(v) {
        const n = v.slider('number of species $n$', 4, 60, 20, { int: true });
        const sg = v.slider('interaction strength $\\sigma$', 0.02, 0.6, 0.2, { step: 0.005 });
        const C = v.slider('connectance $C$', 0.1, 1, 0.5, { step: 0.01 });
        let seed = 5; v.button('Resample', () => { seed++; pool = null; });
        const H = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: false, minWidth: 230, title: 'interaction matrix A' });
        const E = v.stage({ x: [-3, 1.6], y: [-2.4, 2.4], equal: true, height: 320, axes: true, minWidth: 250, title: 'eigenvalues of the community matrix' });
        const T = v.stage({ x: [0, 40], y: [0, 3], height: 320, axes: 'box', gutter: true, minWidth: 250, xlabel: 'time', ylabel: 'densities $x_i$', title: 'recovery after a 15% kick' });
        let pool = null, key = '', A = null, ev = null, ser = null;
        function ensure() {
          if (!pool) { const r = v.rng(seed); pool = { Z: Array.from({ length: 60 }, () => Array.from({ length: 60 }, () => r.normal())), U: Array.from({ length: 60 }, () => Array.from({ length: 60 }, () => r())), xi: Array.from({ length: 60 }, () => r.normal()) }; key = ''; }
          const k = [n.value, sg.value, C.value, seed].join(); if (k === key) return; key = k;
          const N = n.value;
          A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? -1 : pool.U[i][j] < C.value ? sg.value * pool.Z[i][j] : 0)));
          ev = v.M.eig(A).values;
          const x0 = pool.xi.slice(0, N).map((z) => Math.max(0.05, 1 + 0.15 * z));
          ser = rk4sys((t, x) => x.map((xi, i) => { let s = 0; for (let j = 0; j < N; j++) s += A[i][j] * (x[j] - 1); return xi * s; }), x0, 40, 800, 0);
        }
        v.render(() => {
          ensure();
          const N = n.value;
          H.raster((x, y) => { if (x < 0 || x >= 1 || y < 0 || y >= 1) return null; const j = Math.floor(x * N), i = Math.floor((1 - y) * N); const a = A[i][j]; const c = v.diverge(Math.max(-1, Math.min(1, a / (i === j ? 1 : 3 * sg.value + 1e-9))), 'blue', 'red'); return [c[0], c[1], c[2], 1]; }, { res: 2, key });
          E.vline(0, { color: 'red', dash: true, width: 1.5 });
          const R = sg.value * Math.sqrt(N * C.value);
          E.circle(-1, 0, R, { color: 'accent', fill: 'accent', fillAlpha: 0.08, dash: true });
          ev.forEach((z) => E.dot(z.re, z.im, { r: 4, color: z.re < 0 ? 'green' : 'red' }));
          T.hline(1, { color: 'muted', dash: true });
          for (let i = 0; i < N; i++) T.path(ser.ts.map((t, k) => [t, Math.min(3, ser.ys[k][i])]), { color: 'accent', width: 1.1, alpha: 0.6 });
        });
        v.readout(() => { ensure(); const mx = Math.max(...ev.map((z) => z.re)), R = sg.value * Math.sqrt(n.value * C.value); return `May's disc radius $\\sigma\\sqrt{nC}=${v.fix(R, 3)}$ (stable if below 1); actual spectral abscissa $\\max\\operatorname{Re}\\lambda=${v.fix(mx, 3)}$ → **${mx < 0 ? 'locally stable' : 'unstable'}** for this random draw`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.22
    {
      num: '3.22',
      kind: 'Paper',
      name: 'Analytical Note on Certain Rhythmic Relations',
      paper: { authors: 'Alfred J. Lotka', year: 1920, title: 'Analytical Note on Certain Rhythmic Relations in Organic Systems', venue: 'Proceedings of the National Academy of Sciences 6 (7): 410–415', doi: '10.1073/pnas.6.7.410' },
      introduces: ['mathbio-3.3'],
      credit: 'Alfred J. Lotka, 1920',
      statement: String.raw`Lotka (1920) showed that two interacting populations, one of which feeds on the other, can maintain an undamped periodic variation of their densities without any external periodic driving. His example was a system of a plant and a herbivorous animal; in modern notation, and with the form of the equations as the author of this entry reconstructs it from secondary descriptions, plants $P$ grow at a rate proportional to $P$ and are eaten at a rate proportional to $PH$, while herbivores $H$ increase in proportion to $PH$ and die at a rate proportional to $H$. Around the coexistence equilibrium small disturbances neither grow nor decay but oscillate with period $T\approx2\pi/\sqrt{ac}$, where $a$ is the plants' growth rate and $c$ the herbivores' death rate.`,
      idea: String.raw`Before the paper, rhythmic variation in nature was generally attributed to periodic external causes (seasons, weather). Lotka, who had earlier analysed oscillations in a hypothetical autocatalytic chemical reaction (1910), now applied the same differential-equation reasoning to living systems: linearizing the coupled growth equations about an equilibrium gives a pair of imaginary roots, i.e. a sustained rhythm, so the interaction alone can generate cycles. Volterra reached the same system independently in 1926 (3.23) and the system is now named after both authors (3.3); Lotka's book *Elements of Physical Biology* (1925) developed it further.`,
      scope: String.raw`Reconstruction. The exact form of the equations in the paper and its notation have not been checked against the text here (hence the verify flag); the figure is a modern illustration of the system and its period, not a copy of a figure from the paper. The undamped-rhythm result is for the small-oscillation (linearized) analysis; the period in fact lengthens with amplitude (see the right-hand plot).`,
      caption: String.raw`Plants (horizontal) and herbivores (vertical) in scaled units. Click on the phase plane to start orbits; each one is a closed loop, and the kit reports its period. The right plot shows the period against how far the orbit lies from the equilibrium (measured by $V-V_{\min}$, see 3.4): as the orbit shrinks the period tends to Lotka's $2\pi/\sqrt{ac}$ (dashed), for larger orbits it is longer.`,
      deps: ['mathbio-1.2', 'pchem-7.4'],
      tags: ['Lotka', 'oscillations'],
      refs: [],
      links: { doi: 'https://doi.org/10.1073/pnas.6.7.410' },
      verify: true,
      viz(v) {
        const a = v.slider('plant growth $a$', 0.4, 2, 1, { step: 0.01 });
        const c = v.slider('herbivore death $c$', 0.4, 2, 1, { step: 0.01 });
        const P = v.stage({ x: [0, 4], y: [0, 4], height: 360, axes: 'box', gutter: true, minWidth: 280, xlabel: 'plants P', ylabel: 'herbivores H', title: 'phase plane' });
        const B = v.stage({ x: [0, 3], y: [0, 14], height: 360, axes: 'box', gutter: true, minWidth: 280, xlabel: 'distance from equilibrium, $V-V_{\\min}$', ylabel: 'period', title: 'period of the rhythm' });
        const pp = v.phasePlane(P, { f: (x, y, t, p) => [x * (p.a - y), y * (x - p.c)], params: { a, c }, field: 'none', nullclines: false, seeds: [[c.value + 0.5, a.value], [c.value + 1.8, a.value], [c.value + 0.15, a.value]], tMax: 120, trajColor: 'cycle', maxTraj: 8 });
        v.button('Clear orbits', () => pp.clear());
        let key = '', curve = [];
        function prep() {
          const k = [a.value, c.value].join(); if (k === key) return; key = k;
          curve = []; const g = c.value, al = a.value, Vm = lvV(al, g, g, al);
          for (let i = 1; i <= 24; i++) { const s = g * i * 0.12; const T = lvOrbitPeriod(al, g, s, 120, 0.02); const V = lvV(al, g, g + s, al) - Vm; if (isFinite(T) && V < 3) curve.push([V, T]); }
        }
        v.legend([['accent', 'period of orbits'], ['muted', '$2\\pi/\\sqrt{ac}$', { dash: true }]]);
        v.render(() => {
          prep(); pp.draw();
          const T0 = 2 * PI / Math.sqrt(a.value * c.value);
          B.setView([0, Math.max(0.5, ...curve.map((q) => q[0])) * 1.15], [0, Math.max(T0 * 1.6, ...curve.map((q) => q[1])) * 1.1]);
          B.hline(T0, { color: 'muted', dash: true });
          B.path(curve, { color: 'accent', width: 2.6 });
          pp.trajectories.forEach((tr) => { const f = tr.fwd; if (f && f.stop === 'closed orbit' && isFinite(f.period)) { const V = lvV(a.value, c.value, tr.x0, tr.y0) - lvV(a.value, c.value, c.value, a.value); B.dot(V, f.period, { r: 6, color: 'gold' }); } });
          P.dot(c.value, a.value, { r: 4, color: 'green' });
        });
        v.readout(() => { prep(); const T0 = 2 * PI / Math.sqrt(a.value * c.value), last = pp.trajectories.length ? pp.trajectories[pp.trajectories.length - 1].fwd : null; return `small-oscillation period $2\\pi/\\sqrt{ac}=${v.fix(T0, 3)}$; equilibrium $(P,H)=(${v.fix(c.value, 2)},${v.fix(a.value, 2)})$${last && last.period ? `; latest orbit: period $${v.fix(last.period, 3)}$ (${v.fix(last.period / T0, 3)} of the linear value)` : ''}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.23
    {
      num: '3.23',
      kind: 'Paper',
      name: 'Fluctuations in the Abundance of a Species',
      paper: { authors: 'Vito Volterra', year: 1926, title: 'Fluctuations in the Abundance of a Species considered Mathematically', venue: 'Nature 118 (2972): 558–560', doi: '10.1038/118558a0' },
      introduces: ['mathbio-3.3', 'mathbio-3.4', 'mathbio-3.5', 'mathbio-3.6'],
      credit: 'Vito Volterra, 1926',
      statement: String.raw`Volterra (1926) formulated the predator–prey system now called Lotka–Volterra (3.3) and derived from it three laws: (1) the **law of the periodic cycle**: the numbers of prey and predators fluctuate periodically, with a period fixed by the initial conditions and the parameters; (2) the **law of conservation of averages**: the time averages over a cycle are constant, equal to the equilibrium values, whatever the initial conditions (3.5); (3) the **law of disturbance of averages**: if both species are destroyed uniformly in proportion to their numbers, the average of the prey increases and the average of the predators decreases (3.6). The note was prompted by Umberto D’Ancona’s analysis of Adriatic fish catches during and after the First World War.`,
      idea: String.raw`Volterra, a mathematical physicist, was asked by the marine biologist Umberto D’Ancona, according to the usual account, why the proportion of predatory fish in the catches rose when fishing was reduced in 1914–18. He modelled the encounters between species by the mass-action rate used in chemical kinetics and, unaware of Lotka's earlier work, found the cyclic solutions and the invariants that give the laws. The 1926 note in *Nature* is a short announcement of results developed in a longer Italian memoir the same year (Accademia dei Lincei, as usually cited); it introduced mathematical ecology as a deductive discipline, inviting experiment (Gause 1934).`,
      scope: String.raw`The laws are theorems about the Lotka–Volterra equations, not empirical laws; later data on the observed catch percentages are not reproduced here and the figures below are model output. The date and reading of D’Ancona's Adriatic observations are as given in the secondary literature and have not been checked against the original tables.`,
      caption: String.raw`Drag the gold start point; the left panel shows the orbit. Choose a law on the right. **Law 1**: the period of orbits through $(\gamma+s,\alpha)$ grows with the distance $s$ from equilibrium (dashed: small-cycle limit). **Law 2**: the running average of each species settles on its equilibrium value, which is not the midpoint of the swing $\tfrac12(\max+\min)$. **Law 3**: turn on equal harvesting $E$ and the average prey rises while the average predator falls.`,
      deps: ['mathbio-3.1', 'mathbio-1.4'],
      tags: ['Volterra', 'three laws'],
      refs: [],
      links: { doi: 'https://doi.org/10.1038/118558a0' },
      verify: true,
      viz(v) {
        const law = v.select('law', [{ value: '1', label: '1. periodic cycle' }, { value: '2', label: '2. averages conserved' }, { value: '3', label: '3. averages disturbed' }], '2');
        const al = v.slider('$\\alpha$ (prey growth)', 0.5, 1.5, 1, { step: 0.01 });
        const ga = v.slider('$\\gamma$ (predator death)', 0.5, 1.5, 1, { step: 0.01 });
        const E = v.slider('harvest effort $E$ (law 3)', 0, 0.45, 0.25, { step: 0.01 });
        const TT = 80;
        const O = v.stage({ x: [0, 5], y: [0, 5], height: 360, axes: 'box', gutter: true, minWidth: 270, xlabel: 'prey x', ylabel: 'predators y', title: 'orbit' });
        const R1 = v.stage({ x: [0, 4], y: [0, 14], height: 360, axes: 'box', gutter: true, minWidth: 270, xlabel: 'start offset $s$ (prey above equilibrium)', ylabel: 'period', title: 'law 1: the period' });
        const R2 = v.stage({ x: [0, TT], y: [0, 3], height: 360, axes: 'box', gutter: true, minWidth: 270, xlabel: 'time', ylabel: 'running average', title: 'law 2: running averages' });
        const R3 = v.stage({ x: [0, 0.45], y: [0, 1.6], height: 360, axes: 'box', gutter: true, minWidth: 270, xlabel: 'harvest effort E', ylabel: 'cycle average', title: 'law 3: averages against effort' });
        const h = O.handle(2.4, 1, { color: 'gold', r: 8, label: 'start', labelPos: 'ne', constrain: { x: [0.1, 4.9], y: [0.1, 4.9] } });
        let key = '', sol = null, mx = null, my = null, cmx = null, cmy = null, T1 = [], sol3 = null, c3 = {};
        function run() {
          const k = [al.value, ga.value, h.x, h.y, E.value].join(); if (k === key) return; key = k;
          const a = al.value, g = ga.value;
          sol = rk4sys(lvField(a, g), [h.x, h.y], TT, 6400, 1e-9);
          const xs = sol.ys.map((p) => p[0]), ys = sol.ys.map((p) => p[1]);
          mx = runMean(sol.ts, xs); my = runMean(sol.ts, ys);
          cmx = cycleMean(sol.ts, xs, xs, g); cmy = cycleMean(sol.ts, ys, xs, g);
          cmx = cmx || { mean: NaN }; cmy = cmy || { mean: NaN };
          T1 = []; for (let i = 1; i <= 24; i++) { const s = i * 0.16; const T = lvOrbitPeriod(a, g, s, 160, 0.02); if (isFinite(T)) T1.push([s, T]); }
          const e = E.value;
          sol3 = rk4sys(lvField(a - e, g + e), [h.x, h.y], 200, 12000, 1e-9);
          const x3 = sol3.ys.map((p) => p[0]), y3 = sol3.ys.map((p) => p[1]);
          c3 = { x: cycleMean(sol3.ts, x3, x3, g + e), y: cycleMean(sol3.ts, y3, x3, g + e) };
        }
        v.render(() => {
          run();
          const a = al.value, g = ga.value, e = E.value, l = law.value;
          [R1, R2, R3].forEach((s, i) => { s.el.style.display = String(i + 1) === l ? '' : 'none'; });
          O.path(sol.ys, { color: 'accent', width: 2.2 });
          O.dot(g, a, { r: 5, color: 'green' });
          if (l === '3') { O.path(sol3.ys.slice(0, 2500), { color: 'orange', width: 1.8 }); O.dot(g + e, a - e, { r: 5, color: 'orange' }); }
          if (l === '1') { const s = h.x - g; T1.length && R1.path(T1, { color: 'accent', width: 2.6 }); R1.hline(2 * PI / Math.sqrt(a * g), { color: 'muted', dash: true }); R1.dot(Math.min(s, 4), lvOrbitPeriod(a, g, Math.max(s, 0.01), 160, 0.02) || 0, { r: 6, color: 'gold' }); }
          if (l === '2') {
            R2.path(mx.filter((_, i) => i > 15), { color: 'accent', width: 2.2 }); R2.path(my.filter((_, i) => i > 15), { color: 'orange', width: 2.2 });
            R2.hline(g, { color: 'accent', dash: true, alpha: 0.6 }); R2.hline(a, { color: 'orange', dash: true, alpha: 0.6 });
            const xs = sol.ys.map((p) => p[0]), ys = sol.ys.map((p) => p[1]);
            R2.hline((Math.max(...xs) + Math.min(...xs)) / 2, { color: 'accent', dash: [2, 5], alpha: 0.8 }); R2.hline((Math.max(...ys) + Math.min(...ys)) / 2, { color: 'orange', dash: [2, 5], alpha: 0.8 });
            R2.setView([0, TT], [0, Math.max(a, g, 1.2) * 2]);
          }
          if (l === '3') {
            R3.fn((x) => g + x, { color: 'accent', width: 2, domain: [0, 0.45] }); R3.fn((x) => a - x, { color: 'orange', width: 2, domain: [0, 0.45] });
            if (c3.x) R3.dot(e, c3.x.mean, { r: 6, color: 'accent' }); if (c3.y) R3.dot(e, c3.y.mean, { r: 6, color: 'orange' });
          }
        });
        v.legend([['accent', 'prey'], ['orange', 'predators / harvested orbit (law 3)']]);
        v.readout(() => {
          run(); const a = al.value, g = ga.value, e = E.value, l = law.value;
          if (l === '1') { const s = h.x - g; return `period of the orbit through $(\\gamma+s,\\alpha)$ with $s=${v.fix(s, 2)}$: $${v.fix(lvOrbitPeriod(a, g, Math.max(s, 0.01), 160, 0.02), 3)}$ vs small-cycle $2\\pi/\\sqrt{\\alpha\\gamma}=${v.fix(2 * PI / Math.sqrt(a * g), 3)}$`; }
          if (l === '2') return `whole-cycle averages of the plotted orbit: prey $${v.fix(cmx.mean, 4)}$ (equilibrium $\\gamma=${v.fix(g, 4)}$), predators $${v.fix(cmy.mean, 4)}$ ($\\alpha=${v.fix(a, 4)}$)`;
          return `with effort $E=${v.fix(e, 2)}$: measured averages (prey, predators) $(${c3.x ? v.fix(c3.x.mean, 3) : '—'},${c3.y ? v.fix(c3.y.mean, 3) : '—'})$ against predicted $(\\gamma+E,\\alpha-E)=(${v.fix(g + e, 3)},${v.fix(a - e, 3)})$; unharvested $(${v.fix(g, 3)},${v.fix(a, 3)})$ → prey average ${e > 0 ? 'rises' : 'unchanged'}, predator average ${e > 0 ? 'falls' : 'unchanged'}`;
        });
      },
    },
  ],
};
