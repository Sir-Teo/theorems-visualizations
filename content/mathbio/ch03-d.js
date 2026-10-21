// Mathematical Biology — Chapter 3 (part d): items 3.19–3.23
import { rk4sys, crossings, runMean, lvField, lvV, cycleMean, lvOrbitPeriod } from './ch03.shared.js';

import { lotkaRun, periodFamily, orbitEnergy, averagesSeries } from './mathbio-source-audit-lotka.js';

import { STRAINS, breakEven, chemostatPrediction, chemostatRun } from './mathbio-source-audit-competition.js';

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
      credit: String.raw`Single-strain Monod model; source analysis: Hsu, Hubbell & Waltman, 1977, n=1`,
      statement: String.raw`A **chemostat** is a culture vessel of constant volume fed with fresh medium containing nutrient at concentration $S_0$ at rate $D$ (per volume), with the same volume of culture removed. With nutrient $S$, bacterial density $x$, growth rate $\mu(S)=\mu_m S/(K+S)$ (Monod) and yield $1$,
$$\dot S=D(S_0-S)-\mu(S)\,x,\qquad \dot x=\bigl(\mu(S)-D\bigr)x .$$
The washout state $(S_0,0)$ always exists. A second equilibrium with the culture alive, $S^*=\lambda=\dfrac{DK}{\mu_m-D}$, $x^*=S_0-\lambda$, exists iff $D<\mu_m$ and $\lambda<S_0$; it is then globally attracting for $x(0)>0$ and the washout state is a saddle. If $D\ge\mu_m$ or $\lambda\ge S_0$ the culture is washed out.`,
      idea: String.raw`Growth balances dilution at $\lambda=DK/(\mu_m-D)$. The exact mass balance $S(t)+x(t)=S_0+[S(0)+x(0)-S_0]e^{-Dt}$ confines the dynamics, while the positive interior state has eigenvalues $-D$ and $-\mu^{\prime}(\lambda)x^*$. Hsu–Hubbell–Waltman’s global theorem applies with one strain. The washout threshold is $D=\mu(S_0)$, which is generally below $\mu_m$; at equality the equilibrium is nonhyperbolic and washout need not be exponential.`,
      scope: String.raw`$D>0$, $S_0>0$, positive biomass and nonnegative nutrient; well-mixed vessel, constant unit yield, one limiting nutrient, no maintenance or cell death beyond dilution. The chosen parameters are $\mu_m=1$, $K=0.5$. Cell dots are schematic concentration marks, not individual bacterial counts or an empirical culture. No exact device-history priority is asserted here.`,
      caption: String.raw`Move the observation-time slider to inspect the 40-unit trajectory in the vessel and both plots. Vary dilution and feed: the alive steady state exists only when $D<\mu(S_0)$. Its asymptotic identity does not mean a finite run has already equilibrated. All paths use the mass-conserving model without population floors; the gold marker is the selected time.`,
      deps: ['mathbio-3.1', 'mathbio-1.5'],
      tags: ['chemostat', 'Monod', 'washout'],
      refs: ['Hsu, Hubbell & Waltman (1977), §2 model (2.1), Lemma 3.1 and Theorems 3.3–3.4, proofs §4; direct n=1 mass balance and eigenvalue calculation'],
      links: { doi: 'https://doi.org/10.1137/0132030' },
      verify: false,
      viz(v) {
        const D = v.slider('dilution rate $D$', 0.05, 1.2, 0.4, { step: 0.01 });
        const S0 = v.slider('feed concentration $S_0$', 0.2, 6, 3, { step: 0.05 });
        const time=v.slider('observation time',0,40,20,{step:.1});
        const TT = 40, mu = (S) => S / (0.5 + S);
        const Vs = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: false, minWidth: 230, weight: 0.8, title: 'culture vessel' });
        const Ts = v.stage({ x: [0, TT], y: [0, 6.2], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'time', ylabel: 'concentration', title: 'nutrient and bacteria' });
        const Ps = v.stage({ x: [-0.25, 6.5], y: [-0.25, 6.5], height: 340, axes: 'box', gutter: true, minWidth: 250, xlabel: 'nutrient S', ylabel: 'bacteria x', title: 'phase plane' });

        v.legend([['teal', 'nutrient $S$'], ['orange', 'bacteria $x$']]);
        const r = v.rng(11), cells = Array.from({ length: 220 }, () => [r(), r(), r() * 6.28]);
        let key = '', sol = null;
        function run() {
          const k = [D.value, S0.value].join(); if (k === key) return; key = k;
          sol=chemostatRun(D.value,S0.value,[['culture',1,.5,'orange']],TT,.025);
        }
        v.render(() => {
          run();
          const tt=time.value,t=tt/2, i = Math.min(sol.ts.length - 1, Math.round(tt / TT * (sol.ts.length - 1))), [S, x] = sol.ys[i];
          Vs.rect(0.25, 0.1, 0.75, 0.72, { fill: 'teal', fillAlpha: 0.08 + 0.4 * Math.min(1, S / S0.value), color: 'ink', width: 2.5 });
          const n = Math.round(220 * Math.min(1, x / Math.max(S0.value, 1)));
          for (let j = 0; j < n; j++) { const c = cells[j]; Vs.dot(0.27 + 0.46 * (c[0] + 0.012 * Math.sin(t * 2 + c[2])), 0.12 + 0.58 * (c[1] + 0.012 * Math.cos(t * 2.3 + c[2])), { r: 2.6, color: 'orange' }); }
          Vs.arrow(0.03, 0.86, 0.36, 0.86, { color: 'teal', width: 3 }); Vs.arrow(0.36, 0.86, 0.36, 0.74, { color: 'teal', width: 3 });
          Vs.tex('\\text{feed } S_0=' + v.fix(S0.value, 2) + ',\\ \\text{rate } D', 0.03, 0.93, { size: 13, color: 'teal', align: 'left' });
          Vs.arrow(0.64, 0.12, 0.64, 0.02, { color: 'muted', width: 3 }); Vs.arrow(0.64, 0.02, 0.97, 0.02, { color: 'muted', width: 3 });
          Vs.tex('\\text{outflow } D', 0.97, 0.085, { size: 12, color: 'muted', align: 'right' });
          const top=Math.max(...sol.ys.flat())*1.08;Ts.setView([0,TT],[0,top]);
          Ts.path(sol.ts.map((q, j) => [q, sol.ys[j][0]]), { color: 'teal', width: 2.4 });
          Ts.path(sol.ts.map((q, j) => [q, sol.ys[j][1]]), { color: 'orange', width: 2.4 });
          Ts.vline(tt, { color: 'gold', width: 1.6 });
          Ps.path(sol.ys,{color:'accent',width:1.8});
          const lam=D.value<1?.5*D.value/(1-D.value):Infinity,alive=lam<S0.value;Ps.dot(alive?lam:S0.value,alive?S0.value-lam:0,{r:4,color:'green'});
          Ps.dot(S, x, { r: 6, color: 'gold' });
        });
        v.legend([['teal','nutrient S(t)'],['orange','biomass x(t)'],['accent','nutrient–biomass trajectory'],['green','asymptotic equilibrium',{dot:true}],['gold','selected time',{dot:true}]]);
        v.readout(() => { const d = D.value, s0 = S0.value, lam = d < 1 ? d * 0.5 / (1 - d) : Infinity; const alive = d < 1 && lam < s0; return `break-even $\\lambda=DK/(\\mu_m-D)=${isFinite(lam) ? v.fix(lam, 3) : '\\infty'}$ vs feed $S_0=${v.fix(s0, 2)}$ → ${alive ? `**culture survives**: $S^*=${v.fix(lam, 3)}$, $x^*=${v.fix(s0 - lam, 3)}$` : '**washout**: $x\\to0$, $S\\to S_0$'}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Competitive exclusion in the chemostat: the R* rule',
      credit: String.raw`Hsu, Hubbell & Waltman, 1977, Theorem 3.3 (constant-yield Monod competition)`,
      statement: String.raw`Let $n$ strains with Monod growth $\mu_i(S)=\mu_{m,i}S/(K_i+S)$ compete for one nutrient in a chemostat with dilution rate $D$:
$$\dot S=D(S_0-S)-\sum_i\mu_i(S)\,x_i,\qquad \dot x_i=\bigl(\mu_i(S)-D\bigr)x_i .$$
Define the break-even concentration $R_i^*=\dfrac{DK_i}{\mu_{m,i}-D}$ (if $\mu_{m,i}>D$; $\infty$ otherwise). If $R_1^*<R_j^*$ for every $j>1$ and $R_1^*<S_0$ and $x_1(0)>0$, then $x_j(t)\to0$ for all $j\ne1$ while $S\to R_1^*$ and $x_1\to S_0-R_1^*$: the strain that can hold the nutrient at the lowest level wins, whatever the initial densities.`,
      idea: String.raw`The theorem is global: knowing the sign of another strain’s growth **after** assuming $S\to R_1^*$ is not by itself a proof of that convergence. The original §4 first establishes positivity and boundedness by an exact total nutrient-plus-yield-adjusted-biomass balance, then uses comparison estimates to exclude higher-break-even strains, and finally identifies the limit set and stable surviving equilibrium. With unit yields the mass balance is $S+\sum_i x_i=S_0+[S(0)+\sum_i x_i(0)-S_0]e^{-Dt}$.`,
      scope: String.raw`One limiting nutrient; positive constant yields and common positive dilution; positive initial abundance of the uniquely best strain; Monod growth, no toxins or cross-feeding and a constant feed. A **unique minimum** is essential to this conclusion; other higher break-even values need not all be distinct. At tied minima the single-winner theorem is not applicable. The controls include exact ties at $D=0.4,0.5,0.8$. No unexamined experimental fit or numerical proof of the infinite-time theorem is claimed.`,
      caption: String.raw`Left: chosen Monod curves and **all finite** break-even points (axes expand); the horizontal guide is $D$. Right: complete positive concentrations through $T=700$ on a logarithmic axis, without an imposed extinction floor. The readout separates the theorem’s prediction from the largest finite-time biomass, and identifies ties or washout. A constant environment is chosen anew for each run; moving the slider does not simulate a time-varying dilution experiment.`,
      deps: ['mathbio-3.19', 'mathbio-3.17'],
      tags: ['R*', 'resource competition'],
      refs: ['Hsu, Hubbell & Waltman (1977), model (2.1), hypothesis (Hn), Theorems 3.2–3.5 pp. 368–370 and full proofs §4 pp. 370–380; discussion pp. 381–382'],
      links: { doi: 'https://doi.org/10.1137/0132030' },
      verify: false,
      viz(v) {
        const D = v.slider('dilution rate $D$', 0.1, 0.8, 0.3, { step: 0.005 });
        const S0 = v.slider('feed $S_0$', 1, 5, 3, { step: 0.05 });
        const ST=STRAINS;
        const TT = 700;
        const A = v.stage({ x: [0, 3], y: [0, 1.05], height: 340, axes: 'box', gutter: true, minWidth: 260, xlabel: 'nutrient S', ylabel: 'growth rate μ(S)', title: 'Monod curves and break-even points' });
        const B = v.stage({ x: [0, TT], y: [1e-8, 20], ylog: true, height: 340, axes: 'box', gutter: true, minWidth: 300, weight: 1.2, xlabel: 'time', ylabel: 'density (log scale)', title: 'competition for one nutrient' });
        v.legend(ST.map((s) => [s[3], s[0]]));
        const Rstar=breakEven;
        let key = '', sol = null;
        function run() {
          const k = [D.value, S0.value].join(); if (k === key) return; key = k;
          const d = D.value, s0 = S0.value;
          sol=chemostatRun(d,s0);
        }
        v.render(() => {
          run();
          const d=D.value,Q=chemostatPrediction(d,S0.value),finite=Q.R.filter(Number.isFinite),xmax=Math.max(3,...finite)*1.08;
          A.setView([-.04*xmax,xmax],[0,1.08]);A.hline(d,{color:'ink',dash:true});
          ST.forEach((s,i)=>{A.fn(S=>s[1]*S/(s[2]+S),{color:s[3],width:2.2,domain:[0,xmax]});const R=Rstar(s,d);if(Number.isFinite(R)){A.dot(R,d,{r:6,color:s[3]});A.vline(R,{color:s[3],dash:true,alpha:.4});}});
          const all=sol.ys.flat(),ymin=Math.min(...all)*.5,ymax=Math.max(...all)*1.15;B.setView([0,TT],[ymin,ymax]);
          ST.forEach((s,i)=>B.path(sol.ts.map((t,j)=>[t,sol.ys[j][i+1]]),{color:s[3],width:2.2}));B.path(sol.ts.map((t,j)=>[t,sol.ys[j][0]]),{color:'muted',width:1.6,dash:true});
        });
        v.readout(()=>{run();const Q=chemostatPrediction(D.value,S0.value),last=sol.ys.at(-1),imax=last.slice(1).indexOf(Math.max(...last.slice(1))),prediction=Q.winners.length===1?`${ST[Q.winners[0]][0]} is the unique asymptotic survivor`:Q.winners.length>1?`tied minima (${Q.winners.map(i=>ST[i][0]).join(', ')}): single-winner theorem not applicable`:'all wash out asymptotically';return `$R_i^*$: ${Q.R.map(r=>Number.isFinite(r)?v.fmt(r,4):'unattainable').join(', ')} → **${prediction}**. Largest biomass at finite $T=700$: ${ST[imax][0]} ($${last[imax+1].toExponential(3)}$); nutrient $S(T)=${v.fix(last[0],5)}$.${Q.boundary?' Feed equals the minimum break-even value: washout boundary.':''}`;});
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
      statement: String.raw`Lotka’s 1920 paper studies a plant population $X_1$ and a herbivore population $X_2$. Its equations (8) and (10) are $\dot X_1=X_1(A_1-B_1X_2)$ and $\dot X_2=X_2(A_2X_1-B_2)$. With positive **constant** coefficients, coexistence is $(B_2/A_2,A_1/B_1)$, the linear eigenvalues are $\pm i\sqrt{A_1B_2}$, and the small-oscillation period is $2\pi/\sqrt{A_1B_2}$. In the displayed scaling $B_1=A_2=1$, write $a=A_1$ and $c=B_2$. The nonlinear closed orbits also follow from the conserved quantity in 3.4, not from imaginary eigenvalues alone.`,
      idea: String.raw`The paper connects an organism’s growth and consumption balances to differential equations (pp. 411–412), shifts to coexistence and derives imaginary characteristic roots (p. 413), then discusses persistent oscillations and positive populations (pp. 414–415). This is an autonomous model: no externally imposed periodic forcing is needed for the constant-coefficient cycles. The plant–herbivore example is explicitly in the original, rather than a reconstruction from later accounts.`,
      scope: String.raw`The original allows population-dependent coefficients in its broader discussion; that alone does not guarantee the constant-coefficient first integral or a nonlinear centre. The modern visualization restricts to constant positive coefficients and verifies periodicity by that integral. The period curve is a computed family of orbits, not a figure or dataset copied from the paper. The finite phase viewport may truncate large clicked orbits.`,
      caption: String.raw`Click the finite phase window to add positive plant–herbivore initial states; clear them with the button. The right curve gives numerically measured periods for starts $(c+s,a)$, indexed by the conserved excess $V-V_{\min}$. Its dashed guide is the analytic small-cycle limit $2\pi/\sqrt{ac}$. Gold dots, when a complete clicked orbit is detected, use that orbit’s own energy and period; axes expand to include them.`,
      deps: ['mathbio-1.2', 'pchem-7.4'],
      tags: ['Lotka', 'oscillations'],
      refs: ['Lotka (1920), pp. 411–415, equations (8), (10), (12), (25)–(29); Teschl §7.1, first-integral proof'],
      links: { doi: 'https://doi.org/10.1073/pnas.6.7.410' },
      verify: false,
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
          curve = periodFamily(a.value,c.value);
        }
        v.legend([['accent', 'period of orbits'], ['muted', '$2\\pi/\\sqrt{ac}$', { dash: true }]]);
        v.render(() => {
          prep(); pp.draw();
          const T0 = 2 * PI / Math.sqrt(a.value * c.value);
          const measured=pp.trajectories.flatMap(tr=>tr.fwd?.stop==='closed orbit'&&Number.isFinite(tr.fwd.period)?[[orbitEnergy(a.value,c.value,tr.x0,tr.y0),tr.fwd.period]]:[]);
          const points=[...curve,...measured];
          const xmax=Math.max(.5,...points.map(q=>q[0]))*1.15;B.setView([-.04*xmax,xmax], [0,Math.max(T0*1.6,...points.map(q=>q[1]))*1.12]);
          B.hline(T0, { color: 'muted', dash: true });
          B.path(curve, { color: 'accent', width: 2.6 });
          measured.forEach(q=>B.dot(...q,{r:6,color:'gold'}));
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
      statement: String.raw`Volterra’s 1926 Nature note states three laws for the two-species predator–prey association: periodic fluctuations depending on coefficients and initial abundances; cycle averages fixed by the coefficients; and a shift of those averages toward more prey and fewer predators under proportional removal of both species. The note illustrates these laws with two phase diagrams and connects the third law to D’Ancona’s Adriatic fishery observations. Here the explicitly specified constant-coefficient model is $\dot x=x(\alpha-E-y)$, $\dot y=y(x-\gamma-E)$, with $0\le E<\alpha$. Its cycle averages are $(\gamma+E,\alpha-E)$.`,
      idea: String.raw`The three laws and their diagrams occur on pp. 558–559. The small-cycle formula on p. 559, expressed using doubling and halving times, is equivalent to $2\pi/\sqrt{\alpha\gamma}$. For the modern equations, the conserved positive-quadrant level sets establish periodicity, and integrating $d\log x/dt=\alpha-E-y$, $d\log y/dt=x-\gamma-E$ over a period establishes the averages. The note then discusses more species, conservative versus dissipative associations and further investigations (p. 560); those extensions are outside this figure.`,
      scope: String.raw`The original p. 559 reports D’Ancona’s fishery comparison and credits it as the motivation. Its underlying fishery tables have not been audited here, so this is an attributed historical report, not a fresh empirical validation or a fit to catches. We make no claim about priority or whether Volterra knew Lotka’s work. All displayed paths are modern model output. Equal harvesting is an illustration of proportional removal, valid below $E=\alpha$.`,
      caption: String.raw`Drag the gold initial state and choose a law. 1: the curve is a computed family of period versus conserved excess; its gold dot represents the actual dragged orbit if a complete period is observed. 2: finite-time running means approach the exact cycle averages; dotted lines show the different midpoint of the sampled swing. 3: compare unharvested and harvested orbits and their measured whole-cycle means. No complete-cycle estimate is reported when the finite observation window contains none. All plotted curves set their own full extents.`,
      deps: ['mathbio-3.1', 'mathbio-1.4'],
      tags: ['Volterra', 'three laws'],
      refs: ['Volterra (1926), Nature 118, pp. 558–560, laws I–III and figures 1–2; direct first-integral and logarithmic-average proof for the displayed scaling'],
      links: { doi: 'https://doi.org/10.1038/118558a0' },
      verify: false,
      viz(v) {
        const law=v.select('law',[{value:'1',label:'1. periodic cycle'},{value:'2',label:'2. averages conserved'},{value:'3',label:'3. averages disturbed'}],'2');
        const al=v.slider('$\\alpha$ (prey growth)',.5,1.5,1,{step:.01}),ga=v.slider('$\\gamma$ (predator death)',.5,1.5,1,{step:.01}),E=v.slider('harvest effort $E$ (law 3)',0,.45,.25,{step:.01});
        const O=v.stage({x:[0,6],y:[0,6],height:360,axes:'box',gutter:true,minWidth:270,xlabel:'prey x',ylabel:'predators y',title:'complete simulated orbit'});
        const R=v.stage({x:[0,80],y:[0,3],height:360,axes:'box',gutter:true,minWidth:270,title:'selected law'});
        const h=O.handle(2.4,1,{color:'gold',r:8,label:'start',constrain:{x:[.1,4.9],y:[.1,4.9]}});
        let key='',info=null,familyKey='',family=[];
        function run(){const a=al.value,g=ga.value,e=E.value,k=[a,g,e,h.x,h.y].join();if(k===key)return;key=k;const base=lotkaRun(a,g,[h.x,h.y]),harvested=lotkaRun(a-e,g+e,[h.x,h.y],200),means=averagesSeries(base);if(familyKey!==[a,g].join()){family=periodFamily(a,g);familyKey=[a,g].join();}info={a,g,e,base,harvested,means,family,energy:orbitEnergy(a,g,h.x,h.y)};}
        v.legend([['accent','prey / unharvested orbit'],['orange','predators / harvested orbit'],['gold','chosen orbit', {dot:true}]]);
        v.render(()=>{run();const {a,g,e,base,harvested,means,family,energy}=info,l=law.value,all=l==='3'?[base,harvested]:[base];
          const xmax=Math.max(5.2,...all.map(Q=>Q.max[0]*1.07)),ymax=Math.max(5.2,...all.map(Q=>Q.max[1]*1.07));O.setView([-.04*xmax,xmax],[-.04*ymax,ymax]);
          O.path(base.ys,{color:'accent',width:2});O.dot(g,a,{r:5,color:'green'});if(l==='3'){O.path(harvested.ys,{color:'orange',width:1.5});O.dot(g+e,a-e,{r:5,color:'orange'});}
          if(l==='1'){R.setLabels('conserved excess V−Vmin','period');const point=base.period?[energy,base.period]:null,allP=point?[...family,point]:family;const xmax=Math.max(.5,...allP.map(q=>q[0]))*1.15;R.setView([-.04*xmax,xmax],[0,Math.max(2*PI/Math.sqrt(a*g),...allP.map(q=>q[1]))*1.12]);R.path(family,{color:'accent',width:2});R.hline(2*PI/Math.sqrt(a*g),{color:'muted',dash:true});if(point)R.dot(...point,{r:6,color:'gold'});}
          if(l==='2'){R.setLabels('time','running average');const mid=[0,1].map(j=>(base.max[j]+Math.min(...base.ys.map(p=>p[j])))/2);R.setView([0,80],[0,Math.max(...means.flat().map(p=>p[1]),...mid,a,g)*1.08]);means.forEach((p,j)=>R.path(p,{color:j?'orange':'accent',width:2}));[g,a].forEach((x,j)=>{R.hline(x,{color:j?'orange':'accent',dash:true});R.hline(mid[j],{color:j?'orange':'accent',dash:[2,5]});});}
          if(l==='3'){R.setLabels('harvest effort E','cycle average');R.setView([-.025,.475],[0,Math.max(g+.45,a)*1.12]);R.fn(x=>g+x,{color:'accent',domain:[0,.45]});R.fn(x=>a-x,{color:'orange',domain:[0,.45]});if(harvested.means)harvested.means.forEach((m,j)=>R.dot(e,m,{r:6,color:j?'orange':'accent'}));}
        });
        v.readout(()=>{run();const {a,g,e,base,harvested,energy}=info,show=q=>q.means?q.means.map(x=>v.fix(x,4)).join(', '):'no complete cycle in the observation window';if(law.value==='1')return `conserved excess $V-V_{\\min}=${v.fix(energy,3)}$; chosen-orbit period: ${base.stationary?'stationary equilibrium (no oscillation)':base.period?v.fix(base.period,4):'not observed within 80 time units'}; small-cycle limit $${v.fix(2*PI/Math.sqrt(a*g),4)}$`;if(law.value==='2')return `whole-cycle averages: ${show(base)}; exact $(\\gamma,\\alpha)=(${v.fix(g,3)},${v.fix(a,3)})$. Running means use $0\\le t\\le80$, not necessarily a whole number of periods.`;return `harvested whole-cycle averages: ${show(harvested)}; exact $(\\gamma+E,\\alpha-E)=(${v.fix(g+e,3)},${v.fix(a-e,3)})$; unharvested $(${v.fix(g,3)},${v.fix(a,3)})$.`});
      },
    },
  ],
};
