import { auditedTurtle, STAGES, momentum, characteristicAges } from './mathbio-source-audit-age.js';
// Mathematical Biology — Chapter 4 (part b): items 4.8–4.14
import { SURV, FEC, survivorship, leslie, sumv, dotv, domEig, elRoot, r0T, project, fisherV, turtleMatrix, TURTLE_STAGES } from './ch04.shared.js';

const SURV_OPTS = [{ value: 'I', label: 'Type I (late deaths)' }, { value: 'II', label: 'Type II (constant)' }, { value: 'III', label: 'Type III (early deaths)' }];

export default {
  collection: 'mathbio',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Growth rate from R₀ and generation time: r ≈ ln R₀ / T',
      statement: String.raw`Let $r=\ln\lambda$ be the exact growth rate from the Euler–Lotka equation (4.6) and let $\mu_k=\sum_x x^k\ell_xm_x/R_0$ be the moments of the age at reproduction, so $T=\mu_1$ and $\sigma^2=\mu_2-\mu_1^2$. Then
$$\ln R_0=rT-\tfrac12 r^2\sigma^2+O(r^3),\qquad\text{hence}\qquad r=\frac{\ln R_0}{T}\bigl(1+O(r\sigma^2/T)\bigr).$$
The approximation $r\approx\ln R_0/T$ is accurate when reproduction is concentrated in a window narrow compared with $T$ (small $r\sigma^2/T$), and exact when all reproduction happens at a single age.`,
      idea: String.raw`Divide Euler–Lotka by $R_0$: $\sum_x p_x e^{-rx}=1/R_0$ where $p_x=\ell_xm_x/R_0$ is the distribution of the age of a mother at a birth. The left side is the moment generating function of that distribution at $-r$, equal to $\exp(-rT+\tfrac12r^2\sigma^2-\cdots)$ by the cumulant expansion. Taking logs gives the series; keeping the first term gives $r\approx\ln R_0/T$, and the next term is the variance correction.`,
      scope: String.raw`Valid as an expansion for small $r\sigma^2/T$. It breaks down for fast-growing populations with spread-out reproduction, and for strongly declining ones when $r\sigma^2/T$ is not small.`,
      caption: String.raw`Each blue dot is a randomly generated life table (12 age classes, seeded, so the picture is reproducible; "Resample" draws a new set). Horizontal: the quick estimate $\ln R_0/T$. Vertical: the exact $r$ from Euler–Lotka. The diagonal is perfect agreement. Widen the reproductive window with the slider and the cloud fans out; switching on the variance correction (orange) pulls it back onto the diagonal. These tables are random model inputs, not data.`,
      deps: ['mathbio-4.6'],
      tags: ['growth rate', 'approximation'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const w = v.slider('reproductive window width (sd, classes)', 0.3, 4, 2.2, { step: 0.05 });
        const corr = v.toggle('variance correction', false);
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [-0.6, 0.8], y: [-0.6, 0.8], height: 400, axes: 'box', gutter: true, xlabel: 'ln R₀ / T', ylabel: 'exact r', title: 'estimate against exact r', minWidth: 300 });
        let cache = { key: '' }, pts = [];
        function gen() {
          const key = w.value + '|' + seed; if (cache.key === key) return;
          const r = v.rng(500 + seed), out = [];
          for (let q = 0; q < 220; q++) {
            const n = 12, p = 0.55 + 0.4 * r(), mu = 2 + 5 * r(), B = 0.5 + 3.5 * r();
            const l = [1]; for (let i = 1; i < n; i++) l.push(l[i - 1] * Math.min(0.99, Math.max(0.2, p + 0.06 * (r() - 0.5))));
            const g = l.map((_, i) => Math.exp(-((i + 1 - mu) ** 2) / (2 * w.value * w.value))), G = sumv(g), m = g.map((q2) => (B * q2) / G);
            const { R0, T } = r0T(l, m); if (!(R0 > 0.15) || !(T > 0)) continue;
            const mu2 = sumv(l.map((li, i) => li * m[i] * (i + 1) ** 2)) / R0, s2 = mu2 - T * T;
            const rex = Math.log(elRoot(l, m)), ap = Math.log(R0) / T;
            const disc = T * T - 2 * s2 * Math.log(R0), r2 = s2 > 1e-9 && disc >= 0 ? (T - Math.sqrt(disc)) / s2 : ap;
            out.push({ ap, rex, r2, s2 });
          }
          cache = { key }; pts = out;
        }
        let st = null;
        v.render(() => {
          gen();
          let lo = Math.min(...pts.map((p) => Math.min(p.ap, p.rex, p.r2))), hi = Math.max(...pts.map((p) => Math.max(p.ap, p.rex, p.r2)));
          const pad = 0.05 * (hi - lo); lo -= pad; hi += pad; S.setView([lo, hi], [lo, hi]);
          S.line(lo, lo, hi, hi, { color: 'green', dash: true, width: 1.5 });
          S.dots(pts.map((p) => [p.ap, p.rex]), { r: 3, color: 'accent', alpha: 0.7 });
          if (corr.value) S.dots(pts.map((p) => [p.r2, p.rex]), { r: 3, color: 'orange', alpha: 0.8 });
          const err = (f) => sumv(pts.map((p) => Math.abs(f(p) - p.rex))) / pts.length;
          st = { n: pts.length, e1: err((p) => p.ap), e2: err((p) => p.r2), s: Math.sqrt(sumv(pts.map((p) => p.s2)) / pts.length) };
        });
        v.legend([['accent', 'ln R₀ / T', { dot: true }], ['orange', 'with variance correction', { dot: true }], ['green', 'exact', { dash: true }]]);
        v.readout(() => `${st.n} tables; mean absolute error of $\\ln R_0/T$: $${v.fix(st.e1, 4)}$ per step${corr.value ? `; with correction: $${v.fix(st.e2, 4)}$` : ''}. Typical age-at-reproduction sd $\\sigma\\approx${v.fix(st.s, 2)}$ classes.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Reproductive value',
      credit: 'R. A. Fisher, 1930',
      statement: String.raw`For a primitive Leslie matrix $L$ with dominant eigenvalue $\lambda$, the **reproductive value** of age class $x$ is the $x$-th component $v_x$ of the positive left eigenvector, $\mathbf v^{\mathsf T}L=\lambda\mathbf v^{\mathsf T}$, normalised by $v_1=1$. In terms of the life table,
$$v_x=\frac{\lambda^{\,x-1}}{\ell_x}\sum_{y\ge x}\lambda^{-y}\ell_y m_y ,$$
the present value of the offspring still to come, discounted at the population growth rate and divided by the chance of having reached $x$. It measures the relative contribution of an individual of class $x$ to the far future: if $n_0$ is the initial population, $L^t n_0\sim \lambda^t\,\dfrac{\mathbf v\cdot n_0}{\mathbf v\cdot \mathbf u}\,\mathbf u$.`,
      idea: String.raw`The coefficient of the dominant mode in 4.4 is the projection on the left eigenvector, so $v_x$ is, up to the factor $\mathbf v\cdot\mathbf u$, the eventual total population generated by a single class-$x$ individual relative to a newborn. The closed form follows by solving $\mathbf v^{\mathsf T}L=\lambda\mathbf v^{\mathsf T}$ from the last class down. Reproductive value is not monotone: it is small for newborns (they may die before breeding), peaks around the onset of reproduction, and falls to zero after the last reproductive class.`,
      scope: String.raw`Defined relative to the stable growth rate $\lambda$ of a fixed, density-independent life table. In a stationary population ($\lambda=1$) it reduces to the expected future offspring (residual reproductive value).`,
      caption: String.raw`Left: reproductive value $v_x$ from the closed form (bars) and from the left eigenvector of $L$ (dots) — they agree. Right: introduce a single individual of class $x$ into an empty population, project $t$ steps, divide by $\lambda^t$, and normalise so that a newborn counts $1$ (orange bars); the green dots are $v_x$. Increase the horizon $t$ and the bars converge onto the dots.`,
      deps: ['mathbio-4.3'],
      tags: ['reproductive value', 'left eigenvector'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const type = v.select('survivorship', SURV_OPTS, 'I');
        const Th = v.slider('horizon $t$', 1, 40, 4, { int: true });
        const A = v.stage({ x: [0.3, 8.7], y: [0, 8], height: 320, axes: 'box', gutter: true, xlabel: 'age class x', ylabel: 'vₓ  (v₁ = 1)', title: 'reproductive value', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const B = v.stage({ x: [0.3, 8.7], y: [0, 8], height: 320, axes: 'box', gutter: true, xlabel: 'class of the single introduced individual', ylabel: 'relative long-run size', title: 'eventual population from one individual', minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        let st = null;
        v.render(() => {
          const l = survivorship(SURV[type.value]), lam = elRoot(l, FEC), vv = fisherV(l, FEC, lam), L = leslie(FEC, SURV[type.value]);
          const E = domEig(L), top = Math.max(...vv) * 1.15;
          const y = Array.from({ length: 8 }, (_, x) => { const e = new Array(8).fill(0); e[x] = 1; return sumv(project(L, e, Th.value)[Th.value]) / Math.pow(lam, Th.value); });
          const yn = y.map((q) => q / y[0]);
          const top2 = Math.max(top, Math.max(...yn) * 1.1);
          A.setView([0.3, 8.7], [0, top2]); B.setView([0.3, 8.7], [0, top2]);
          A.bars(vv, { x0: 1, color: 'accent' });
          A.dots(E.w.map((q, i) => [i + 1, q]), { r: 5, color: 'gold' });
          B.bars(yn, { x0: 1, color: 'orange' });
          B.dots(vv.map((q, i) => [i + 1, q]), { r: 5, color: 'green' });
          st = { lam, dev: Math.max(...yn.map((q, i) => Math.abs(q - vv[i]))), peak: vv.indexOf(Math.max(...vv)) + 1, eig: Math.max(...E.w.map((q, i) => Math.abs(q - vv[i]))) };
        });
        v.legend([['accent', 'closed form vₓ'], ['gold', 'left eigenvector', { dot: true }], ['orange', 'projected from one individual'], ['green', 'vₓ', { dot: true }]]);
        v.readout(() => `$\\lambda=${v.fix(st.lam, 4)}$; reproductive value peaks at class ${st.peak}. Closed form vs left eigenvector: max difference $${v.sci(Math.max(st.eig, 1e-16), 2)}$. Projection after $t=${Th.value}$ steps differs from $v_x$ by at most $${v.fix(st.dev, 4)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Sensitivity and elasticity of λ',
      credit: 'Crouse, Crowder & Caswell, 1987 (illustrated model)',
      statement: String.raw`Let $A$ be a primitive nonnegative matrix with dominant eigenvalue $\lambda$, right eigenvector $\mathbf u$ and left eigenvector $\mathbf v$. The **sensitivity** of $\lambda$ to the entry $a_{ij}$ is
$$\frac{\partial\lambda}{\partial a_{ij}}=\frac{v_i\,u_j}{\mathbf v\cdot\mathbf u},$$
and the **elasticity** (proportional sensitivity) is
$$e_{ij}=\frac{a_{ij}}{\lambda}\frac{\partial\lambda}{\partial a_{ij}}=\frac{\partial\ln\lambda}{\partial\ln a_{ij}}\quad(a_{ij}>0),\qquad e_{ij}\ge0,\quad\sum_{i,j}e_{ij}=1 .$$
So a 1% proportional change in $a_{ij}$ changes $\lambda$ by about $e_{ij}$ percent, and the elasticities partition the whole of the growth-rate response among the matrix entries.`,
      idea: String.raw`Differentiate $A\mathbf u=\lambda\mathbf u$ and multiply by $\mathbf v^{\mathsf T}$: the term with $\mathrm d\mathbf u$ cancels because $\mathbf v^{\mathsf T}A=\lambda\mathbf v^{\mathsf T}$, leaving $\mathrm d\lambda\,(\mathbf v\cdot\mathbf u)=\mathbf v^{\mathsf T}(\mathrm dA)\mathbf u$. Taking $\mathrm dA=\mathrm da_{ij}E_{ij}$ gives the sensitivity. Euler's theorem for the degree-one homogeneous function $\lambda(sA)=s\lambda(A)$ gives $\sum a_{ij}\partial\lambda/\partial a_{ij}=\lambda$, which is why the elasticities sum to one. The left eigenvector (reproductive value, 4.9) and right eigenvector (stable distribution) thus decide where management has leverage.`,
      scope: String.raw`The derivative is local. At a zero entry the sensitivity can be positive: adding a previously absent transition can matter. Its elasticity is zero by the algebraic formula, while $\ln a_{ij}$ is undefined there. The baseline is checked directly against Table 4, p. 1416 of Crouse, Crowder & Caswell (1987); it is an historical estimated model, not current turtle data. The right panel scales each stage's existing stasis/growth entries together and caps their sum at 1; it holds their ratio fixed. This chosen perturbation differs from re-deriving transitions from annual survival and stage duration, as in the original paper's Fig. 4.`,
      caption: String.raw`Left: elasticity of every nonzero entry in the original seven-stage matrix (row = destination; column = source). Blank cells have zero elasticity, not necessarily zero sensitivity. Right: finite percentage change in the dominant growth factor after increasing all fecundities or one stage's stasis and growth together. The percentage is a requested increase; probability constraints can reduce the effective increase. These are matrix experiments, not measured management outcomes. In this model changing fecundity and first-stage survival by the same feasible factor gives the same growth factor; later-stage survival often has a larger response. Stage numbers: 1 eggs/hatchlings, 2 small juveniles, 3 large juveniles, 4 subadults, 5 novice breeders, 6 first-year remigrants, 7 mature breeders.`,
      deps: ['mathbio-4.9'],
      tags: ['elasticity', 'sensitivity'],
      refs: ['Crouse, Crowder & Caswell (1987), Table 4 p. 1416; elasticity p. 1417 and Figs. 3–4 p. 1418', 'https://ecology-2023.gklab.org/pdf/Crouse_Ecology_1987.pdf', 'Caswell (2010) §3.1–3.4 pp. 539–541, equations 24–36', 'https://www.demographic-research.org/volumes/vol23/19/23-19.pdf'],
      verify: false,
      viz(v) {
        const pct = v.slider('proportional increase (%)', 1, 30, 10, { int: true });
        const NAMES = ['fecundities', ...STAGES.map((n, i) => 'surv. ' + (i + 1))];
        const H = v.stage({ x: [-0.6, 7], y: [0, 7.6], equal: true, height: 380, axes: false, title: 'elasticity eᵢⱼ (row = to, column = from)', minWidth: 300 });
        const B = v.stage({ x: [0.4, 8.6], y: [0, 5], height: 380, axes: 'box', gutter: true, xlabel: 'what is raised: F = fecundities, 1–7 = survival of stage', ylabel: '% change in λ', title: 'effect on λ of raising one component', minWidth: 300, xticks: [[1, 'F'], [2, '1'], [3, '2'], [4, '3'], [5, '4'], [6, '5'], [7, '6'], [8, '7']] });
        const A0 = auditedTurtle(), E0 = domEig(A0, 6000), lam0 = E0.lam;
        const vu = dotv(E0.w, E0.u);
        const S = A0.map((row, i) => row.map((_, j) => (E0.w[i] * E0.u[j]) / vu)), El = A0.map((row, i) => row.map((a, j) => (a * S[i][j]) / lam0));
        const emax = Math.max(...El.flat());
        let fd = 0;
        for (const [i, j] of [[0, 4], [1, 1], [2, 1], [3, 3], [6, 6]]) { const h = 1e-5, A = A0.map((r) => r.slice()); A[i][j] += h; fd = Math.max(fd, Math.abs((domEig(A, 6000).lam - lam0) / h - S[i][j])); }
        let res = null;
        v.render(() => {
          H.heat((x, y) => { const j = Math.floor(x), i = Math.floor(7 - y); return i >= 0 && i < 7 && j >= 0 && j < 7 && A0[i][j] > 0 ? El[i][j] : -0.15 * emax; }, { range: [-0.15 * emax, emax], cmap: 'theme', res: 4, key: 'turtle-el' });
          for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
            H.rect(j, 6 - i, j + 1, 7 - i, { color: 'grid', stroke: true, fill: false, alpha: 0.5 });
            if (A0[i][j] > 0) H.text(El[i][j].toFixed(3), j + 0.5, 6.5 - i, { align: 'center', baseline: 'middle', size: 11, color: 'ink' });
          }
          for (let k = 0; k < 7; k++) { H.text(String(k + 1), k + 0.5, 7.25, { align: 'center', size: 11, color: 'muted' }); H.text(String(k + 1), -0.3, 6.5 - k, { align: 'center', baseline: 'middle', size: 11, color: 'muted' }); }
          const f = 1 + pct.value / 100, out = [];
          out.push(100 * (domEig(auditedTurtle([1, 1, 1, 1, 1, 1, 1], f), 6000).lam / lam0 - 1));
          for (let k = 0; k < 7; k++) { const sc = [1, 1, 1, 1, 1, 1, 1]; sc[k] = f; out.push(100 * (domEig(auditedTurtle(sc, 1), 6000).lam / lam0 - 1)); }
          const top = Math.max(1, ...out) * 1.2; B.setView([0.4, 8.6], [Math.min(0, ...out) * 1.2, top]);
          B.bars(out, { x0: 1, color: (q, i) => (i === 0 ? 'orange' : 'accent') });
          res = { out, best: out.indexOf(Math.max(...out)) };
        });
        v.legend([['orange', 'fecundities'], ['accent', 'survival of one stage']]);
        v.readout(() => `$\\lambda=${v.fix(lam0, 4)}$ (below 1: this population declines). $\\sum e_{ij}=${v.fix(sumv(El.flat()), 6)}$; sensitivity formula vs finite difference on five entries: max error $${v.sci(Math.max(fd, 1e-16), 2)}$.\nRaising ${pct.value}%: fecundities → ${v.fix(res.out[0], 2)}% in $\\lambda$; best single stage survival: ${res.best === 0 ? 'fecundity' : 'stage ' + res.best} (${v.fix(res.out[res.best], 2)}%).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Stage-structured (Lefkovitch) matrix models',
      credit: 'L. P. Lefkovitch, 1965',
      statement: String.raw`When age is a poor predictor of fate (size, developmental stage, or life-cycle phase matter more), group individuals into $n$ stages and let $a_{ij}\ge0$ be the expected number of stage-$i$ individuals at the next census contributed by one stage-$j$ individual now. Then $\mathbf n(t+1)=A\,\mathbf n(t)$ with
$$A=\begin{pmatrix}P_1&F_2&F_3&\cdots\\ G_1&P_2&0&\\ 0&G_2&P_3&\\ &&\ddots&\ddots\end{pmatrix},$$
where $P_j$ is the probability of staying in stage $j$, $G_j$ of moving on to stage $j+1$ (with $P_j+G_j\le1$), and $F_j$ the fecundity. Such an $A$ is nonnegative, and when irreducible and primitive (4.3) it has a dominant eigenvalue $\lambda$, a stable stage distribution $\mathbf u$ and reproductive values $\mathbf v$, exactly as a Leslie matrix does. Leslie matrices are the special case $P_j=0$.`,
      idea: String.raw`The life-cycle graph, with a node per stage and an arrow for every positive entry, encodes the matrix; paths in the graph are the ways an individual can eventually reproduce, and cycles through the reproducing stage give the Euler–Lotka-type equation $1=\sum_{\text{cycles}}(\text{gain}\cdot\lambda^{-\text{length}})$. Because stasis loops $P_j$ are allowed, an individual can spend several census intervals in one stage, which is why stage models work for organisms whose age is hard to determine, such as trees, corals or turtles.`,
      scope: String.raw`The model assumes that all individuals in a stage are identical and that the next stage is reached with a fixed probability each step, which makes the time spent in a stage geometrically distributed. Real stage durations are often less variable, so very different durations can hide behind the same matrix.`,
      caption: String.raw`A four-stage life cycle (the entries are illustrative, not data). Arrow thickness shows the entry: arcs over the top are fecundities from stages 4 and 3 back to stage 1, the loops below the nodes are stasis, straight arrows are growth. Change the sliders to see the matrix, the dominant eigenvalue $\lambda$, the stable stage distribution (bars) and the reproductive values (gold dots, scaled to the largest). Growth is capped so that $P_j+G_j\le1$.`,
      deps: ['mathbio-4.2'],
      tags: ['stage structure', 'life cycle'],
      refs: ['Edelstein-Keshet ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matrix_population_models' },
      viz(v) {
        const P2 = v.slider('$P_2$ (stay)', 0, 0.95, 0.45, { step: 0.01 }), P3 = v.slider('$P_3$', 0, 0.95, 0.6, { step: 0.01 }), P4 = v.slider('$P_4$', 0, 0.98, 0.8, { step: 0.01 });
        const G1 = v.slider('$G_1$ (advance)', 0, 0.9, 0.35, { step: 0.01 }), G2 = v.slider('$G_2$', 0, 0.9, 0.35, { step: 0.01 }), G3 = v.slider('$G_3$', 0, 0.9, 0.25, { step: 0.01 });
        const F4 = v.slider('$F_4$ (fecundity)', 0, 8, 3, { step: 0.05 }), F3 = v.slider('$F_3$', 0, 4, 0.5, { step: 0.05 });
        const S = v.stage({ x: [0.3, 4.7], y: [-1.2, 2.4], equal: true, height: 340, axes: false, title: 'life-cycle graph', minWidth: 320 });
        const D = v.stage({ x: [0.4, 4.6], y: [0, 1.1], height: 340, axes: 'box', gutter: true, xlabel: 'stage', ylabel: 'share / relative value', title: 'stable stage distribution', minWidth: 260, xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4']] });
        const P1 = 0.3, NAMES = ['small', 'medium', 'large', 'adult'];
        let st = null;
        v.render(() => {
          const g = [Math.min(G1.value, 1 - P1), Math.min(G2.value, 1 - P2.value), Math.min(G3.value, 1 - P3.value)];
          const A = [[P1, 0, F3.value, F4.value], [g[0], P2.value, 0, 0], [0, g[1], P3.value, 0], [0, 0, g[2], P4.value]];
          const E = domEig(A);
          const px = [1, 2, 3, 4], col = 'accent', wd = (q) => 1.5 + 5 * Math.min(1, q);
          // growth arrows
          for (let i = 0; i < 3; i++) { S.arrow(px[i] + 0.2, 0, px[i + 1] - 0.2, 0, { color: 'purple', width: wd(g[i]) }); S.text('G' + (i + 1) + '=' + v.fix(g[i], 2), px[i] + 0.5, 0.2, { align: 'center', size: 11, color: 'muted' }); }
          // stasis loops (below the nodes)
          [P1, P2.value, P3.value, P4.value].forEach((q, i) => { S.curve((t) => [px[i] + 0.17 * Math.sin(t), -0.5 + 0.17 * Math.cos(t)], 0, 2 * Math.PI, { color: 'teal', width: wd(q) }); S.text('P' + (i + 1) + '=' + v.fix(q, 2), px[i] + 0.3, -0.5, { align: 'left', size: 11, color: 'muted', baseline: 'middle' }); });
          // fecundity arcs back to stage 1
          [[4, F4.value, 1.9, 2.5], [3, F3.value, 1.1, 2]].forEach(([from, f, h, lx]) => {
            const pt = (t) => [from - (from - 1) * t, 0.3 + h * 0.8 * Math.sin(Math.PI * t)];
            S.curve(pt, 0, 1, { color: 'orange', width: wd(f / 3) });
            const [x0, y0] = pt(0.96), [x1, y1] = pt(1); S.arrow(x0, y0, x1, y1, { color: 'orange', width: 2 });
            S.text('F' + from + '=' + v.fix(f, 2), lx, 0.3 + h * 0.8 + (from === 4 ? 0.14 : -0.16), { align: 'center', size: 11, color: 'orange' });
          });
          px.forEach((x, i) => { S.dot(x, 0, { r: 20, color: col }); S.text(String(i + 1), x, 0, { align: 'center', baseline: 'middle', size: 14, color: 'panel' }); S.text(NAMES[i], x, -0.95, { align: 'center', size: 11, color: 'muted' }); });
          const w = E.w, wm = Math.max(...w);
          D.bars(E.u, { x0: 1, color: 'accent' });
          D.dots(w.map((q, i) => [i + 1, q / wm]), { r: 6, color: 'gold' });
          st = { A, E, g };
        });
        v.legend([['accent', 'stable stage distribution'], ['gold', 'reproductive value (scaled)', { dot: true }]]);
        v.readout(() => `$A=${String.raw`\begin{pmatrix}` + st.A.map((r) => r.map((x) => v.fix(x, 2)).join('&')).join(String.raw`\\`) + String.raw`\end{pmatrix}`}$\n$\\lambda=${v.fix(st.E.lam, 4)}$ → the population ${st.E.lam > 1.0005 ? 'grows' : st.E.lam < 0.9995 ? 'declines' : 'is stationary'} by ${v.fix(Math.abs(st.E.lam - 1) * 100, 1)}% per step.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Population momentum',
      statement: String.raw`Suppose a fixed replacement-level Leslie matrix $L_1$ has a simple eigenvalue $1$, all other eigenvalues strictly inside the unit circle, and right and left eigenvectors $\mathbf u_1,\mathbf v_1$, with $\sum u_{1x}=1$. For a nonnegative initial population with nonzero reproductive value,
$$N_\infty=\frac{\mathbf v_1\cdot\mathbf n(0)}{\mathbf v_1\cdot\mathbf u_1},\qquad M=\frac{N_\infty}{N(0)}.$$
The **population momentum** $M$ describes the eventual size after replacement fertility is imposed: $M>1$ means further net growth, $M<1$ net decline. Setting $R_0=1$ does not by itself make the population stationary immediately; its age distribution also matters.`,
      idea: String.raw`The asymptotic projection is $L_1^t\mathbf n(0)\to\mathbf u_1(\mathbf v_1\cdot\mathbf n(0))/(\mathbf v_1\cdot\mathbf u_1)$. Summing its components gives the formula. Thus momentum compares the initial population's average reproductive value with that of the new stationary population. A youthful initial distribution can give $M>1$, as in the chosen example; the projection, rather than an unconditional inequality, decides the answer.`,
      scope: String.raw`Closed, one-sex, density-independent population with fixed survival. The ten-class illustration has a primitive reproductive core and transient post-reproductive classes, so its dominant mode still converges. Its age schedules are chosen, not fitted demographic data. Instant proportional replacement of fertility is a model experiment.`,
      caption: String.raw`The population starts in the stable age distribution for the chosen initial $R_0$. At time zero every fecundity is divided by that $R_0$. Left, on a logarithmic population axis: the full replacement trajectory and the full no-change counterfactual, with no clipping. The green line is the asymptotic momentum; the gold point is the selected census, which need not have reached it. Right: individuals in each age class relative to initial total size, before the change and at that census.`,
      deps: ['mathbio-4.4'],
      tags: ['momentum', 'demography'],
      refs: ['Feichtinger & Wrzaczek (2024), §1 equations 2–4 pp. 51–52 (continuous-age momentum); the finite-matrix projection is derived here', 'https://pure.iiasa.ac.at/id/eprint/19383/1/1-s2.0-S0040580923000813-main.pdf', 'Caswell (2010), background B pp. 533 and §3', 'https://www.demographic-research.org/volumes/vol23/19/23-19.pdf'],
      verify: false,
      viz(v) {
        const R0i = v.slider('initial $R_0$', 1, 3, 2, { step: 0.05 });
        const Tm = v.slider('time $t$', 0, 60, 20, { int: true });
        const A = v.stage({ x: [-1.5, 61.5], y: [.8, 3], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'time after replacement', ylabel: 'N(t) / N(0) (log scale)', title: 'total population: both full trajectories', minWidth: 300 });
        const B = v.stage({ x: [0.3, 10.7], y: [0, 0.3], height: 320, axes: 'box', gutter: true, xlabel: 'age class', ylabel: 'individuals / N(0)', title: 'age structure', minWidth: 260, xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
        let st = null;
        v.render(() => {
          const R=momentum(R0i.value), {E0,E1,n0,runs:tr1,N:N1,reference:N0,M:Mom}=R;
          const low=Math.min(...N1,...N0,Mom),high=Math.max(...N1,...N0,Mom),pad=Math.max(.5,Math.log(high/low))*.09;
          A.setView([-1.5,61.5],[low*Math.exp(-pad),high*Math.exp(pad)]);
          A.path(N0.map((q, t) => [t, q]), { color: 'muted', dash: true, width: 1.5 });
          A.path(N1.map((q, t) => [t, q]), { color: 'accent', width: 2.2 });
          A.hline(Mom, { color: 'green', dash: true, width: 1.5 });
          A.hline(1, { color: 'faint', alpha: 0.6 });
          A.dot(Tm.value, N1[Tm.value], { r: 6, color: 'gold' });
          const mx = Math.max(...tr1[Tm.value], ...n0) * 1.15; B.setView([0.3, 10.7], [0, mx]);
          n0.forEach((q, i) => B.rect(i + 0.6, 0, i + 1, q, { fill: 'orange', fillAlpha: 0.45, color: 'orange' }));
          tr1[Tm.value].forEach((q, i) => B.rect(i + 1, 0, i + 1.4, q, { fill: 'accent', fillAlpha: 0.55, color: 'accent' }));
          st = { Mom, lam0: E0.lam, end: N1[60], lam1: E1.lam };
        });
        v.legend([['accent', 'fertility cut to replacement'], ['muted', 'no change', { dash: true }], ['green', 'predicted momentum M', { dash: true }]]);
        v.readout(() => `Initial growth factor $\\lambda_0=${v.fix(st.lam0, 3)}$ per step. After the cut, $\\lambda_1=${v.fix(st.lam1, 4)}$. Predicted momentum $M=${v.fix(st.Mom, 3)}$; simulated $N(60)/N(0)=${v.fix(st.end, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Model',
      name: 'Lotka’s renewal equation',
      credit: 'Lotka, 1907–1939 (building on Sharpe & Lotka 1911)',
      statement: String.raw`In continuous age, let $B(t)$ be the birth rate of females, $\ell(a)$ the survivorship to age $a$ and $m(a)$ the maternity function, and put $\varphi(a)=\ell(a)m(a)$. Births at time $t$ come from those born earlier and still reproducing, plus a forcing term $G(t)$ for the part of reproduction that comes from the initial population:
$$B(t)=G(t)+\int_0^{t}B(t-a)\,\varphi(a)\,da .$$
The real root $r$ of the characteristic equation $\int_0^\infty e^{-ra}\varphi(a)\,da=1$ (the continuous Euler–Lotka equation, 4.6) governs the long run: if $\varphi$ is not supported on a lattice, $B(t)e^{-rt}\to\dfrac{\int_0^\infty G(s)e^{-rs}\,ds}{\int_0^\infty a\,e^{-ra}\varphi(a)\,da}$.`,
      idea: String.raw`Multiplying by $e^{-rt}$ turns the equation into a renewal equation for $b(t)=B(t)e^{-rt}$ whose kernel $e^{-ra}\varphi(a)$ is a probability density, because $r$ solves the characteristic equation. The renewal theorem (fa-9.13; Blackwell's version is stoch-11.3) says that such a process settles to the constant $\int g/\text{mean}$. The other (complex) roots of the characteristic equation give damped oscillations in $b(t)$: these are the "echoes" of the initial birth pulse, which persist longer when reproduction is concentrated at one age.`,
      scope: String.raw`Density-independent, one sex, time-invariant rates. The convergence needs an aperiodic (non-lattice) kernel, as in the Gamma-shaped maternity function used below; it takes the form of a pure undamped oscillation if all reproduction happens at exactly one age.`,
      caption: String.raw`The maternity function $\varphi(a)=R_0\times\mathrm{Gamma}(\text{shape }k,\text{ mean }5)$ density (an illustrative choice) is integrated against the births, with a single pulse of founders at $t\approx0.5$ as forcing. Left: $B(t)$. Right: $B(t)e^{-rt}$, which converges to the constant predicted by the formula (green). A large shape $k$ (reproduction concentrated at age 5) gives long-lasting echoes of the founding pulse; a small $k$ damps them in a generation or two.`,
      deps: ['mathbio-4.6', 'fa-9.13', 'stoch-11.3'],
      tags: ['renewal equation', 'Lotka'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const R0 = v.slider('$R_0$', 0.5, 1.8, 1.6, { step: 0.05 });
        const K = v.slider('shape $k$ of $\\varphi$', 2, 80, 14, { int: true });
        const h = 0.1, NT = 400, J = 180;
        const A = v.stage({ x: [0, 40], y: [0, 5], height: 320, axes: 'box', gutter: true, xlabel: 'time t', ylabel: 'births B(t)', title: 'birth rate', minWidth: 280 });
        const C = v.stage({ x: [0, 40], y: [0, 2], height: 320, axes: 'box', gutter: true, xlabel: 'time t', ylabel: '$B(t)e^{-rt}$', title: 'normalised births', minWidth: 280 });
        let cache = { key: '' };
        function solve() {
          const key = R0.value + '|' + K.value; if (cache.key === key) return cache;
          const gam = v.M.dist.gamma(K.value, 5 / K.value);
          const phi = new Array(J + 1).fill(0); for (let j = 1; j <= J; j++) phi[j] = gam.pdf(j * h);
          const norm = (R0.value) / (h * sumv(phi)); for (let j = 1; j <= J; j++) phi[j] *= norm;
          const G = Array.from({ length: NT + 1 }, (_, i) => Math.exp(-((i * h - 0.5) ** 2) / (2 * 0.09)) / (0.3 * Math.sqrt(2 * Math.PI)));
          const B = new Array(NT + 1).fill(0);
          for (let i = 0; i <= NT; i++) { let s = G[i]; for (let j = 1; j <= Math.min(i, J); j++) s += h * phi[j] * B[i - j]; B[i] = s; }
          let lo = -2, hi = 2; const f = (r) => h * sumv(phi.map((q, j) => q * Math.exp(-r * j * h))) - 1;
          for (let it = 0; it < 80; it++) { const mid = 0.5 * (lo + hi); if (f(mid) > 0) lo = mid; else hi = mid; }
          const r = 0.5 * (lo + hi);
          const mur = sumv(phi.map((q, j) => h * q * j * h * Math.exp(-r * j * h)));
          const binf = (h * sumv(G.map((g, i) => g * Math.exp(-r * i * h)))) / mur;
          const b = B.map((q, i) => q * Math.exp(-r * i * h));
          cache = { key, B, b, r, binf, rcont: null };
          return cache;
        }
        let st = null;
        v.render(() => {
          const S = solve(); const mB = Math.max(...S.B) * 1.1, mb = Math.max(...S.b, S.binf) * 1.15;
          A.setView([0, 40], [0, mB]); C.setView([0, 40], [0, mb]);
          A.path(S.B.map((q, i) => [i * h, q]), { color: 'accent', width: 2 });
          C.path(S.b.map((q, i) => [i * h, q]), { color: 'orange', width: 2 });
          C.hline(S.binf, { color: 'green', dash: true, width: 1.5 });
          st = S;
        });
        v.legend([['accent', 'B(t)'], ['orange', '$B(t)e^{-rt}$'], ['green', 'predicted limit', { dash: true }]]);
        v.readout(() => `Characteristic root $r=${v.fix(st.r, 4)}$ per unit time ($R_0=${v.fix(R0.value, 2)}$, so $r$ is ${st.r > 0 ? 'positive' : st.r < 0 ? 'negative' : 'zero'}). Predicted limit of $B e^{-rt}$: $${v.fix(st.binf, 4)}$; at $t=40$: $${v.fix(st.b[400], 4)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'McKendrick–von Foerster equation',
      statement: String.raw`Let $n(a,t)$ be the density of individuals of age $a$ at time $t$, with age-specific mortality $\mu(a)$ and fertility $\beta(a)$. Then
$$\frac{\partial n}{\partial t}+\frac{\partial n}{\partial a}=-\mu(a)\,n,\qquad n(0,t)=\int_0^\infty\beta(a)\,n(a,t)\,da,\qquad n(a,0)=n_0(a).$$
Along each characteristic $a=t+\text{const}$ the density simply decays: for $a>t$, $n(a,t)=n_0(a-t)\,\ell(a)/\ell(a-t)$, and for $a<t$, $n(a,t)=B(t-a)\ell(a)$ with $B(t)=n(0,t)$ the birth rate, where $\ell(a)=e^{-\int_0^a\mu}$. Substituting the second form into the boundary condition gives Lotka's renewal equation (4.13), and an exponential solution has profile $e^{-ra}\ell(a)$, where $r$ solves $\int\beta(a)\ell(a)e^{-ra}da=1$. This exponential ansatz alone does not prove attraction from arbitrary initial conditions.`,
      idea: String.raw`The left side is the derivative of $n$ along the characteristic lines of slope one, because everyone ages at unit speed; the right side is pure death. The only coupling between ages is the boundary condition at $a=0$, which feeds newborns from all fertile ages. Solving along characteristics reduces the PDE to the renewal equation for $B(t)$, and inserting an exponential birth rate gives the continuous-age Euler–Lotka relation. Convergence requires additional renewal assumptions; a finite computation does not establish them.`,
      scope: String.raw`Linear, density-independent, one sex, with nonnegative time-independent mortality and fertility and integrable initial density. The characteristic formula is interpreted away from the corner $a=t$ (with compatible boundary/initial data for a classical solution). A positive integrable exponential profile is a candidate asymptotic mode, not a conclusion for every possible reproduction kernel. The simulation truncates ages at 12 with outflow there and zero fertility beyond, uses exact survival along grid characteristics and trapezoidal birth integrals, and sets a compatible initial newborn boundary. It is a finite-grid approximation, not an infinite-age exact solution.`,
      caption: String.raw`Chosen mortality $\mu(a)=0.05+0.0005a^3$ and a Gaussian fertility bump around age 5. Choose fertility, initial ages and time. Left: grid density and the equal-total exponential profile. Right: the entire computed solution; colour is the square root of $n(a,t)e^{-rt}$ divided by its maximum over the full grid (range 0–1). Characteristics follow unit-speed aging. Step size is 0.1 in age and time; the growth exponent uses the same trapezoidal birth rule as the evolution. The readout compares it with births over the last five time units.`,
      deps: ['mathbio-4.13'],
      tags: ['age structure', 'PDE'],
      refs: ['Edelstein-Keshet, Mathematical Models in Biology, §10.8 pp. 465–468 equations 66–69', 'https://djvu.online/file/582JuTf6nykBh', 'Feichtinger & Wrzaczek (2024), §2 equation 7 p. 52', 'https://pure.iiasa.ac.at/id/eprint/19383/1/1-s2.0-S0040580923000813-main.pdf', 'Caswell (2010), background A equations A2–A5 p. 533', 'https://www.demographic-research.org/volumes/vol23/19/23-19.pdf'],
      verify: false,
      viz(v) {
        const init = v.select('initial ages', [{ value: 'young', label: 'young bulge' }, { value: 'old', label: 'old bulge' }, { value: 'flat', label: 'uniform' }], 'young');
        const bsl = v.slider('fertility level $b$', 0.3, 2, 1, { step: 0.02 });
        const tm=v.slider('time $t$',0,30,12,{step:.1});
        const P=v.stage({x:[-.25,12.25],y:[0,.5],height:320,axes:'box',gutter:true,xlabel:'age a',ylabel:'density n(a,t)',title:'age profile',minWidth:280});
        const H=v.stage({x:[0,12],y:[0,30],height:320,axes:'box',gutter:true,xlabel:'age a',ylabel:'time t',title:'√(n e⁻ʳᵗ / grid maximum), colour 0–1',minWidth:280});
        let cache={key:''};function solve(){const key=init.value+'|'+bsl.value;if(cache.key!==key)cache={...characteristicAges(bsl.value,init.value),key};return cache;}
        let st = null;
        v.render(()=>{
          const S=solve(),k=Math.min(S.nt,Math.round(tm.value/S.h)),cur=S.snaps[k],tot=S.masses[k];
          P.setView([-.25,12.25],[0,Math.max(...S.snaps[0],...cur,...S.stable.map(q=>q*tot))*1.15]);
          P.path(S.ages.map((a,i)=>[a,cur[i]]),{color:'accent',width:2.2});
          P.path(S.ages.map((a,i)=>[a,S.stable[i]*tot]),{color:'green',dash:true,width:1.5});
          H.heat((a,t)=>{const i=Math.min(S.na,Math.max(0,Math.round(a/S.h))),j=Math.min(S.nt,Math.max(0,Math.round(t/S.h)));return Math.sqrt(S.snaps[j][i]*Math.exp(-S.r*j*S.h)/S.maxScaled);},{range:[0,1],cmap:'theme',res:3,key:S.key});
          for(let c=-10;c<=12;c+=2)H.line(Math.max(0,c),Math.max(0,-c),Math.min(12,c+30),Math.min(30,12-c),{color:'ink',alpha:.25,width:1});
          H.hline(k*S.h,{color:'gold',width:2.5});st={r:S.r,tot,t:k*S.h,growth:Math.log(S.births[S.nt]/S.births[S.nt-50])/5};
        });
        v.legend([['accent', 'n(a,t)'], ['green', '$e^{-ra}\\ell(a)$ (stable profile)', { dash: true }], ['gold', 'current time']]);
        v.readout(() => `$t=${v.fix(st.t, 1)}$, total population $${v.fix(st.tot, 3)}$ (started at 1). Euler–Lotka root $r=${v.fix(st.r, 4)}$; growth rate of births over the last 5 time units of the run: $${v.fix(st.growth, 4)}$.`);
      },
    },
  ],
};
