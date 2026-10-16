// Population Genetics & Evolution — Chapter 2: Genetic drift
import { clamp, memo, binom, binomPmf, gammaDraw, wfNext, wfPath, wfAbsorb, sup, lsq, freqBars } from './ch02.shared.js';

const PCOL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];

export default {
  collection: 'popgen',
  chapter: 2,
  title: 'Genetic drift',
  summary: String.raw`In a finite population each generation is a random sample of the last, so allele frequencies wander even without selection. The Wright–Fisher and Moran models make this precise: frequencies are martingales, heterozygosity decays at rate $1/2N$, and every neutral allele is eventually lost or fixed, with fixation probability equal to its frequency. Effective population size translates real populations — with unequal sexes, fluctuating size, or lopsided families — into the ideal model, and Kimura’s diffusion approximation turns drift into a partial differential equation whose solution can be written down.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Wright–Fisher model',
      statement: String.raw`Take a diploid population of constant size $N$ with non-overlapping generations, random mating, and no selection, mutation or migration. Equivalently, regard each generation as a pool of $2N$ gene copies. Let $X_t$ be the number of copies of allele $A$ in generation $t$ and $p_t = X_t/2N$ its frequency. The next generation is formed by drawing $2N$ copies independently, with replacement, from the current pool:
$$X_{t+1}\mid X_t = k \;\sim\; \mathrm{Binomial}\!\left(2N,\ \tfrac{k}{2N}\right).$$
So $\mathbb E[p_{t+1}\mid p_t]=p_t$ and $\operatorname{Var}(p_{t+1}\mid p_t)=p_t(1-p_t)/2N$. The states $0$ and $2N$ are absorbing: once an allele is lost or fixed, it stays so, and with probability one every run is absorbed.`,
      idea: String.raw`Each of the $2N$ copies in the next generation picks its parent copy uniformly and independently, so the number of descendants of the $A$ copies is a binomial count. That single sampling step is the whole model: no force pushes $p$ in any direction (the conditional mean is $p_t$), but the sampling noise has variance $p(1-p)/2N$ and, because it vanishes only at $0$ and $1$, it keeps shaking $p$ until the chain falls into one of those two absorbing states. The noise is large exactly when $N$ is small.`,
      caption: String.raw`Twenty replicate populations start at the same frequency (coloured paths; a dot marks the generation each is lost or fixed). Drag $N$ down and the paths become jagged and hit the walls sooner; drag it up and they creep. The right panel uses 300 further runs to show the share of populations lost (orange), fixed (blue) and still polymorphic (unshaded) as time passes. **New run** reseeds.`,
      deps: ['popgen-1.1', 'popgen-1.4'],
      refs: ['Ewens ch. 3', 'Gillespie'],
      credit: 'R. A. Fisher, 1930; Sewall Wright, 1931',
      scope: String.raw`Ideal population: constant size, random mating, equal offspring variance (Poisson-like), no selection, mutation or migration. Real populations are mapped onto it through the effective size (2.6).`,
      tags: ['drift', 'Wright–Fisher'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Genetic_drift#Wright%E2%80%93Fisher_model' },
      viz(v) {
        const nS = v.slider('population size $N$', 3, 500, 20, { int: true, log: true });
        const pS = v.slider('initial frequency $p_0$', 0.05, 0.95, 0.5, { step: 0.05 });
        const tS = v.slider('generations shown', 20, 2000, 150, { int: true, log: true });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const L = v.stage({ x: [0, 150], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'generation', ylabel: 'frequency of A', title: 'Twenty populations drifting' });
        const Rg = v.stage({ x: [0, 150], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'generation', ylabel: 'share of 300 populations', title: 'Lost, fixed, still polymorphic', minWidth: 300 });
        const sim = memo(), stat = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, T = tS.value, p0 = pS.value, k0 = Math.round(p0 * n);
          const paths = sim(`${N}|${k0}|${T}|${seed}`, () => { const r = v.rng(seed * 101 + N); return Array.from({ length: 20 }, () => wfPath(r, n, k0, T)); });
          L.setView([0, T], [0, 1]);
          L.hline(k0 / n, { color: 'muted', dash: true, alpha: 0.6 });
          let lost = 0, fixed = 0;
          paths.forEach((P, j) => {
            const pts = Array.from(P, (k, t) => [t, k / n]), c = PCOL[j % PCOL.length];
            L.path(pts, { color: c, width: 1.5, alpha: 0.85 });
            const end = P[T];
            if (end === 0 || end === n) { let ta = T; while (ta > 0 && (P[ta - 1] === end)) ta--; L.dot(ta, end / n, { r: 3, color: c }); if (end) fixed++; else lost++; }
          });
          const st = stat(`${N}|${k0}|${T}|${seed}`, () => {
            const r = v.rng(seed * 977 + N * 7), R = 300, fl = new Float64Array(T + 1), ff = new Float64Array(T + 1);
            for (let i = 0; i < R; i++) {
              let k = k0, t = 0;
              while (t <= T) {
                if (k === 0) { for (; t <= T; t++) fl[t]++; break; }
                if (k === n) { for (; t <= T; t++) ff[t]++; break; }
                t++; k = t <= T ? binom(r, n, k / n) : k;
              }
            }
            return { fl: fl.map((x) => x / R), ff: ff.map((x) => x / R) };
          });
          Rg.setView([0, T], [0, 1]);
          const at = (arr) => (t) => arr[clamp(Math.round(t), 0, T)];
          const fl = at(st.fl), ff = at(st.ff);
          Rg.fn((t) => 1 - ff(t), { domain: [0, T], n: Math.min(T + 1, 600), fill: true, base: 1, color: 'blue', fillAlpha: 0.3, width: 1 });
          Rg.fn((t) => fl(t), { domain: [0, T], n: Math.min(T + 1, 600), fill: true, base: 0, color: 'orange', fillAlpha: 0.3, width: 1 });
          Rg.fn((t) => 1 - ff(t) , { domain: [0, T], n: Math.min(T + 1, 600), color: 'blue', width: 1.5 });
          Rg.fn((t) => fl(t), { domain: [0, T], n: Math.min(T + 1, 600), color: 'orange', width: 1.5 });
          Rg.text('polymorphic', T * 0.5, 0.5 * (fl(T * 0.5) + 1 - ff(T * 0.5)), { align: 'center', color: 'muted', size: 12 });
          info = { N, n, T, p0: k0 / n, lost, fixed, fl: st.fl[T], ff: st.ff[T] };
        });
        v.legend([['accent', 'one population'], ['orange', 'A lost', { area: true }], ['blue', 'A fixed', { area: true }]]);
        v.readout(() => `$N=${info.N}$, so each generation draws $2N=${info.n}$ gene copies; at $p=${v.fix(info.p0, 2)}$ the one-step standard deviation is $\\sqrt{p(1-p)/2N}=${v.fix(Math.sqrt(info.p0 * (1 - info.p0) / info.n), 3)}$.\nAfter ${info.T} generations: of the 20 paths ${info.lost} lost and ${info.fixed} fixed; of 300 runs ${v.fix(100 * info.fl, 0)}% lost, ${v.fix(100 * info.ff, 0)}% fixed. (Eventually $A$ fixes in a fraction $p_0=${v.fix(info.p0, 2)}$ of populations — 2.4.)`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Allele frequency is a martingale under drift',
      statement: String.raw`In the neutral Wright–Fisher model, the allele-frequency process $(p_t)_{t\ge0}$ is a martingale with respect to the history of the population: $\mathbb E[p_{t+1}\mid p_0,\dots,p_t]=p_t$. Consequently $\mathbb E[p_t]=p_0$ for every $t$, and since $p_t\in[0,1]$ is bounded, $p_t$ converges almost surely, to a limit $p_\infty\in\{0,1\}$ with $\mathbb E[p_\infty]=p_0$.`,
      idea: String.raw`The conditional law of $2Np_{t+1}$ given the past is $\mathrm{Binomial}(2N,p_t)$, whose mean is $2Np_t$. That is the martingale property. A bounded martingale converges almost surely (martingale convergence theorem); the limit cannot be interior because the conditional variance $p(1-p)/2N$ stays positive there, so it is $0$ or $1$, and bounded convergence gives $\mathbb E[p_\infty]=p_0$. Drift has no direction, only spread — which is why selection (2.4, chapter 4) is needed to move the mean.`,
      caption: String.raw`Three thousand Wright–Fisher runs. Left: a few runs (thin) scatter, but the mean over all runs (thick) stays on the dashed starting frequency inside its $\pm2$ standard-error band. Right: the distribution of $p$ at generation $t$ flattens and piles up on the walls, yet its mean (gold) does not move. Switch on **selection** to break the martingale: the mean drifts away from $p_0$.`,
      deps: ['popgen-2.1', 'prob-4.2.11'],
      refs: ['Ewens ch. 3'],
      scope: String.raw`Neutral, ideal Wright–Fisher population. Selection, mutation or migration add a drift term to $\mathbb E[p_{t+1}\mid p_t]$ and destroy the martingale property.`,
      tags: ['drift', 'martingale'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Martingale_(probability_theory)' },
      viz(v) {
        const nS = v.slider('population size $N$', 5, 100, 20, { int: true });
        const pS = v.slider('initial frequency $p_0$', 0.1, 0.9, 0.3, { step: 0.05 });
        const tS = v.slider('generation $t$ (right panel)', 0, 300, 60, { int: true });
        const mode = v.select('force', [{ value: 'neutral', label: 'neutral drift' }, { value: 'sel', label: 'selection $s=0.02$' }], 'neutral');
        const TMAX = 300, M = 3000;
        const L = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'frequency of A', title: 'Paths, and the mean of all runs' });
        const Rg = v.stage({ x: [-0.1, 1.1], y: [0, 0.2], axes: 'box', gutter: true, height: 330, xlabel: 'frequency of A at generation t', ylabel: 'share of runs', title: 'Distribution of $p_t$', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, p0 = pS.value, k0 = Math.round(p0 * n), s = mode.value === 'sel' ? 0.02 : 0;
          const D = sim(`${N}|${k0}|${s}`, () => {
            const r = v.rng(4242 + N), ks = new Uint16Array(M * (TMAX + 1)), mean = new Float64Array(TMAX + 1), se = new Float64Array(TMAX + 1);
            const sum = new Float64Array(TMAX + 1), sq = new Float64Array(TMAX + 1);
            for (let i = 0; i < M; i++) {
              let k = k0; ks[i * (TMAX + 1)] = k;
              for (let t = 1; t <= TMAX; t++) { if (k > 0 && k < n) k = wfNext(r, n, k, s); ks[i * (TMAX + 1) + t] = k; }
            }
            for (let t = 0; t <= TMAX; t++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const x = ks[i * (TMAX + 1) + t] / n; a += x; b += x * x; } mean[t] = a / M; se[t] = Math.sqrt(Math.max(0, b / M - mean[t] ** 2) / M); }
            return { ks, mean, se };
          });
          const T = tS.value;
          L.hline(p0, { color: 'green', dash: true, width: 2 });
          for (let i = 0; i < 25; i++) L.path(Array.from({ length: TMAX + 1 }, (_, t) => [t, D.ks[i * (TMAX + 1) + t] / n]), { color: 'muted', width: 1, alpha: 0.35 });
          const lo = (t) => D.mean[clamp(Math.round(t), 0, TMAX)] - 2 * D.se[clamp(Math.round(t), 0, TMAX)], hi = (t) => D.mean[clamp(Math.round(t), 0, TMAX)] + 2 * D.se[clamp(Math.round(t), 0, TMAX)];
          L.between(lo, hi, 0, TMAX, { fill: 'accent', fillAlpha: 0.35 });
          L.fn((t) => D.mean[clamp(Math.round(t), 0, TMAX)], { domain: [0, TMAX], n: 301, color: 'accent', width: 3 });
          L.vline(T, { color: 'gold', width: 1.5 });
          const col = new Uint16Array(M); for (let i = 0; i < M; i++) col[i] = D.ks[i * (TMAX + 1) + T];
          const fb = freqBars(Rg, col, n, { color: 'accent' });
          Rg.setView([-0.1, 1.1], [0, Math.max(0.1, fb.ymax * 1.15)]);
          Rg.vline(p0, { color: 'green', dash: true, width: 2 });
          Rg.vline(fb.mean, { color: 'gold', width: 2.5 });
          info = { T, mean: D.mean[T], se: D.se[T], p0: k0 / n, end: D.mean[TMAX], sT: D.se[TMAX], fl: fb.lost, ff: fb.fixed };
        });
        v.legend([['accent', 'mean of 3000 runs ±2 SE', { area: true }], ['green', '$p_0$', { dash: true }], ['gold', 'mean at generation $t$'], ['muted', 'single runs']]);
        v.readout(() => `$\\mathbb E[p_{${info.T}}]\\approx ${v.fix(info.mean, 3)}\\pm${v.fix(2 * info.se, 3)}$ versus $p_0=${v.fix(info.p0, 3)}$ — ${Math.abs(info.mean - info.p0) <= 2.5 * Math.max(info.se, 1e-9) ? 'consistent with a martingale' : '**the mean has moved: not a martingale**'}.\nAt generation $t=${info.T}$: ${v.fix(100 * info.fl, 1)}% of runs lost, ${v.fix(100 * info.ff, 1)}% fixed, the rest in between.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Heterozygosity decays as (1 − 1/2N)ᵗ',
      statement: String.raw`In the neutral Wright–Fisher model with $N$ diploid individuals, let $H_t = 2p_t(1-p_t)$ be the heterozygosity expected under random mating. Then
$$\mathbb E[H_{t+1}\mid p_t]=\Bigl(1-\frac1{2N}\Bigr)H_t,\qquad\text{so}\qquad \mathbb E[H_t]=H_0\Bigl(1-\frac1{2N}\Bigr)^{t}\approx H_0\,e^{-t/2N}.$$
Equivalently, the probability that two gene copies drawn in generation $t$ are identical by descent obeys $F_{t+1}=\tfrac1{2N}+\bigl(1-\tfrac1{2N}\bigr)F_t$.`,
      idea: String.raw`Write $\mathbb E[p_{t+1}(1-p_{t+1})]=\mathbb E[p_{t+1}]-\mathbb E[p_{t+1}^2]$. The binomial second moment is $\mathbb E[p_{t+1}^2\mid p_t]=p_t^2+p_t(1-p_t)/2N$, so the conditional expectation of $p(1-p)$ is $p_t(1-p_t)(1-1/2N)$: each generation a fraction $1/2N$ of the remaining variation is lost, because two newly drawn copies have probability $1/2N$ of descending from the same parent copy. Iterating gives the geometric decay; the Hardy–Weinberg heterozygosity (1.10) is the quantity being eroded.`,
      caption: String.raw`The average of $H_t/H_0$ over 1500 runs (dots) lies on the theoretical curve (green) in both panels; a few single runs (thin) wander and die to zero. On the logarithmic panel the decay is a straight line with slope $\ln(1-1/2N)$ (the fitted line is drawn in gold). Drag $N$: the half-life is about $1.39N$ generations.`,
      deps: ['popgen-2.1', 'popgen-1.10'],
      refs: ['Ewens ch. 3', 'Gillespie'],
      credit: 'Sewall Wright, 1931',
      scope: String.raw`Neutral ideal Wright–Fisher population. The statement is about the expectation over replicate populations; any single population’s heterozygosity is erratic and ends at exactly $0$.`,
      tags: ['drift', 'heterozygosity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Genetic_drift' },
      viz(v) {
        const nS = v.slider('population size $N$', 5, 200, 25, { int: true });
        const pS = v.slider('initial frequency $p_0$', 0.1, 0.5, 0.5, { step: 0.05 });
        const tS = v.slider('generations', 20, 600, 150, { int: true, log: true });
        const L = v.stage({ x: [0, 150], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'H(t) / H(0)', title: 'Linear scale' });
        const Rg = v.stage({ x: [0, 150], y: [1e-3, 1.5], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'H(t) / H(0), log scale', title: 'Logarithmic scale', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, T = tS.value, k0 = Math.round(pS.value * n), p0 = k0 / n, H0 = 2 * p0 * (1 - p0), R = 1500;
          const D = sim(`${N}|${k0}|${T}`, () => {
            const r = v.rng(31 + N), mean = new Float64Array(T + 1), keep = [];
            for (let i = 0; i < R; i++) {
              let k = k0; const h = i < 12 ? new Float64Array(T + 1) : null;
              for (let t = 0; t <= T; t++) { const p = k / n; mean[t] += 2 * p * (1 - p); if (h) h[t] = 2 * p * (1 - p); if (t < T && k > 0 && k < n) k = binom(r, n, p); }
              if (h) keep.push(h);
            }
            return { mean: mean.map((x) => x / R / H0), keep };
          });
          const th = (t) => Math.pow(1 - 1 / n, t);
          // fit ln(mean) over the window where the mean stays above 2% of its start
          const ts = [], ys = [];
          for (let t = 0; t <= T; t++) if (D.mean[t] > 0.02) { ts.push(t); ys.push(Math.log(D.mean[t])); }
          const fit = ts.length > 3 ? lsq(ts, ys) : { slope: NaN, intercept: 0 };
          for (const [S, log] of [[L, false], [Rg, true]]) {
            S.setView([0, T], log ? [1e-3, 1.5] : [0, 1.05]);
            D.keep.forEach((h) => S.path(Array.from(h, (x, t) => [t, Math.max(x / H0, 1e-9)]).filter((q) => !log || q[1] > 1e-9 * 2), { color: 'muted', width: 1, alpha: 0.3 }));
            S.fn(th, { domain: [0, T], n: 300, color: 'green', width: 3 });
            const dots = []; const step = Math.max(1, Math.floor(T / 60));
            for (let t = 0; t <= T; t += step) if (D.mean[t] > (log ? 1e-3 : -1)) dots.push([t, D.mean[t]]);
            S.dots(dots, { r: 3, color: 'accent' });
          }
          if (ts.length > 3) Rg.fn((t) => Math.exp(fit.intercept + fit.slope * t), { domain: [0, ts[ts.length - 1]], n: 60, color: 'gold', width: 2, dash: true });
          info = { N, n, fit, pred: Math.log(1 - 1 / n), half: Math.log(2) / -Math.log(1 - 1 / n) };
        });
        v.legend([['green', '$(1-1/2N)^t$'], ['accent', 'mean of 1500 runs', { dot: true }], ['muted', 'single runs'], ['gold', 'fitted line', { dash: true }]]);
        v.readout(() => `Fitted slope of $\\ln \\bar H_t$: $${v.fix(info.fit.slope, 5)}$ per generation; theory $\\ln(1-1/2N)=${v.fix(info.pred, 5)}$.\nHalf-life $\\ln 2/(-\\ln(1-1/2N))=${v.fix(info.half, 1)}$ generations $\\approx 1.39N=${v.fix(1.386 * info.N, 1)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Neutral fixation probability equals initial frequency',
      statement: String.raw`In the neutral Wright–Fisher model with $2N$ gene copies, an allele present in $k$ copies is eventually fixed with probability exactly $k/2N=p_0$ and lost with probability $1-p_0$. In particular a new mutant ($k=1$) fixes with probability $1/2N$, and in a population of constant size the neutral substitution rate is therefore (number of new mutants per generation) $\times\,1/2N$.`,
      idea: String.raw`By 2.2 the process $p_t$ is a bounded martingale, and absorption happens almost surely, so optional stopping applies at the absorption time $\tau$: $p_0=\mathbb E[p_\tau]=1\cdot\Pr(\text{fix})+0\cdot\Pr(\text{loss})$. The same argument is Gambler’s ruin for a fair game, the cleanest sanity check. Another way to see it: looking forward far enough, all present copies descend from one copy now, and each of the $2N$ copies is equally likely to be that ancestor; the allele fixes if the ancestor carried it.`,
      caption: String.raw`Left: start $2N$-copy populations at ten different frequencies, run each to absorption, and plot the fraction that fixed (dots, with 95% error bars) against the starting frequency; they land on the diagonal. Right: for the chosen $p_0$, the running fixation fraction wanders inside the $\pm2\sigma$ funnel around $p_0$ and settles. Turn on **selection** to leave the hypothesis: the points bend away from the diagonal toward the diffusion curve $\dfrac{1-e^{-4Nsp}}{1-e^{-4Ns}}$.`,
      deps: ['popgen-2.2', 'prob-4.4.1', 'stoch-2.4'],
      refs: ['Ewens §4.3'],
      credit: 'R. A. Fisher, 1930; Sewall Wright, 1931 (diffusion form by Kimura, 1962)',
      scope: String.raw`Neutral alleles. With selection of strength $s$ the fixation probability is $\approx(1-e^{-4Nsp_0})/(1-e^{-4Ns})$ (diffusion approximation, valid for small $s$).`,
      tags: ['drift', 'fixation', 'optional stopping'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fixation_(population_genetics)' },
      viz(v) {
        const nS = v.slider('population size $N$', 5, 40, 10, { int: true });
        const pS = v.slider('initial frequency $p_0$ (right panel)', 0.05, 0.95, 0.3, { step: 0.05 });
        const RS = v.slider('runs per point', 100, 1500, 400, { int: true, step: 50 });
        const sS = v.slider('selection $s$ on $A$', -0.05, 0.1, 0, { step: 0.005 });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, equal: false, xlabel: 'initial frequency p₀', ylabel: 'fraction of runs that fixed', title: 'Fixation probability' });
        const Rg = v.stage({ x: [0, 1500], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'number of runs', ylabel: 'fraction fixed so far', title: 'Convergence to $p_0$', minWidth: 300 });
        const simA = memo(), simB = memo();
        const PTS = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, R = RS.value, s = sS.value, p0 = Math.round(pS.value * n) / n;
          const A = simA(`${N}|${R}|${s}`, () => {
            const r = v.rng(500 + N);
            return PTS.map((p) => { const k0 = Math.round(p * n); let f = 0; for (let i = 0; i < R; i++) if (wfAbsorb(r, n, k0, s).fixed) f++; return { p: k0 / n, f: f / R }; });
          });
          const B = simB(`${N}|${R}|${s}|${p0}`, () => {
            const r = v.rng(900 + N), k0 = Math.round(p0 * n), run = new Float64Array(R); let f = 0;
            for (let i = 0; i < R; i++) { if (wfAbsorb(r, n, k0, s).fixed) f++; run[i] = f / (i + 1); }
            return run;
          });
          L.line(0, 0, 1, 1, { color: 'green', width: 2, dash: true });
          if (s) L.fn((p) => (1 - Math.exp(-4 * N * s * p)) / (1 - Math.exp(-4 * N * s)), { domain: [0, 1], n: 100, color: 'red', width: 2 });
          A.forEach((a) => {
            const se = 1.96 * Math.sqrt(Math.max(a.f * (1 - a.f), 0.25 / R) / R);
            L.line(a.p, Math.max(0, a.f - se), a.p, Math.min(1, a.f + se), { color: 'accent', width: 1.5, alpha: 0.7 });
            L.dot(a.p, a.f, { r: 4.5, color: 'accent' });
          });
          Rg.setView([0, R], [0, 1]);
          Rg.fn((x) => clamp(p0 + 2 * Math.sqrt(p0 * (1 - p0) / Math.max(x, 1)), 0, 1), { domain: [1, R], n: 200, color: 'green', width: 1.5, alpha: 0.6 });
          Rg.fn((x) => clamp(p0 - 2 * Math.sqrt(p0 * (1 - p0) / Math.max(x, 1)), 0, 1), { domain: [1, R], n: 200, color: 'green', width: 1.5, alpha: 0.6 });
          Rg.hline(p0, { color: 'green', dash: true, width: 2 });
          Rg.path(Array.from(B, (f, i) => [i + 1, f]), { color: 'accent', width: 1.8 });
          const dev = A.reduce((m, a) => Math.max(m, Math.abs(a.f - a.p)), 0);
          const pred = s ? (1 - Math.exp(-4 * N * s * p0)) / (1 - Math.exp(-4 * N * s)) : p0;
          info = { N, n, R, p0, final: B[R - 1], dev, pred, s, newcomer: 1 / n };
        });
        v.legend([['green', 'fixation probability $=p_0$', { dash: true }], ['accent', 'simulation', { dot: true }], ['red', 'diffusion with selection']]);
        v.readout(() => `Largest gap from the diagonal over the ten points: ${v.fix(info.dev, 3)} (binomial noise at ${info.R} runs is about $\\pm${v.fix(1.96 * 0.5 / Math.sqrt(info.R), 3)}$).\nFor $p_0=${v.fix(info.p0, 2)}$: ${v.fix(info.final, 3)} of ${info.R} runs fixed; prediction ${v.fix(info.pred, 3)}${info.s ? ' (with selection, diffusion formula)' : ''}. A single new neutral mutant fixes with probability $1/2N=${v.fix(info.newcomer, 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Model',
      name: 'Moran model',
      statement: String.raw`A population has $n$ haploid individuals (equivalently $n$ gene copies), $k$ of them of type $A$. At each step one individual, chosen uniformly, reproduces and its offspring replaces another individual chosen uniformly (possibly itself). Then $k\mapsto k+1$ with probability $p(1-p)$, $k\mapsto k-1$ with probability $p(1-p)$, and $k$ is unchanged otherwise, where $p=k/n$. This is a birth–death chain absorbed at $0$ and $n$. Measured in units of $n/2$ steps, it has the same mean and variance per unit time, $0$ and $p(1-p)/n$, as the Wright–Fisher model with $n$ gene copies, and (in the limit of large $n$) the same absorption-time distribution.`,
      idea: String.raw`One Moran step changes $k$ by at most one, so the process is a random walk with local variance $2p(1-p)/n^2$ per step in frequency. A Wright–Fisher generation changes $p$ with variance $p(1-p)/n$. Equating the two, one Wright–Fisher generation corresponds to $n/2$ Moran steps. The Moran chain is a time-reversible birth–death chain, which makes exact calculation easy (absorption probabilities and times), while the Wright–Fisher chain is more natural biologically; the diffusion limit of both is the same.`,
      caption: String.raw`Left: a few Wright–Fisher paths (blue) and Moran paths (purple, stepwise) from the same starting frequency, with Moran time divided by $n/2$ so both run on a generation axis. Right: the distributions of absorption times from 500 runs of each model; the means (vertical lines) agree with the diffusion value $-2n[p\ln p+(1-p)\ln(1-p)]$. **New run** reseeds.`,
      deps: ['popgen-2.1'],
      refs: ['Ewens ch. 3', 'Ewens §9.3.2'],
      credit: 'P. A. P. Moran, 1958',
      scope: String.raw`Neutral, constant size, no mutation. The Moran model allows overlapping generations; its time scale (steps per generation) is a convention.`,
      tags: ['drift', 'Moran', 'birth–death chain'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Moran_process' },
      viz(v) {
        const nS = v.slider('gene copies $n$', 10, 100, 40, { int: true });
        const pS = v.slider('initial frequency $p_0$', 0.1, 0.9, 0.5, { step: 0.05 });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const L = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time in Wright–Fisher generations (Moran steps ÷ n/2)', ylabel: 'frequency of A', title: 'Paths of both models' });
        const Rg = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time to absorption (generations)', ylabel: 'density', title: 'Absorption time', minWidth: 300 });
        const sim = memo();
        function moranRun(r, n, k0) {
          let k = k0, steps = 0; const pts = [[0, k / n]];
          while (k > 0 && k < n) {
            const q = (2 * k * (n - k)) / (n * n);
            steps += Math.max(1, Math.ceil(Math.log(1 - r()) / Math.log(1 - q)));
            const x = (2 * steps) / n; pts.push([x, k / n]);
            k += r() < 0.5 ? 1 : -1; pts.push([x, k / n]);
          }
          return { pts, time: (2 * steps) / n };
        }
        let info = {};
        v.render(() => {
          const n = nS.value, k0 = Math.round(pS.value * n), p0 = k0 / n;
          const D = sim(`${n}|${k0}|${seed}`, () => {
            const r = v.rng(seed * 13 + n), wf = [], mo = [];
            for (let i = 0; i < 500; i++) { wf.push(wfAbsorb(r, n, k0).t); mo.push(moranRun(r, n, k0).time); }
            const wp = Array.from({ length: 5 }, () => wfPath(r, n, k0, 400)), mp = Array.from({ length: 5 }, () => moranRun(r, n, k0));
            const q = (a) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(0.97 * b.length)]; };
            return { wf, mo, wp, mp, tmax: Math.max(q(wf), q(mo)) };
          });
          const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
          const th = -2 * n * (p0 * Math.log(p0) + (1 - p0) * Math.log(1 - p0));
          const tm = Math.ceil(D.tmax / 10) * 10 + 10;
          L.setView([0, tm], [0, 1]);
          D.wp.forEach((P) => { let tEnd = 400; const pts = []; for (let t = 0; t <= 400; t++) { pts.push([t, P[t] / n]); if (P[t] === 0 || P[t] === n) { break; } } L.path(pts, { color: 'blue', width: 1.5, alpha: 0.8 }); });
          D.mp.forEach((m) => L.path(m.pts, { color: 'purple', width: 1.5, alpha: 0.8 }));
          const bins = 24;
          let dm = 0;
          for (const a of [D.wf, D.mo]) { const h = v.M.histogram(a, { bins, range: [0, tm] }); const w = tm / bins; h.counts.forEach((c) => { dm = Math.max(dm, c / a.length / w); }); }
          Rg.setView([0, tm], [0, dm * 1.15]);
          Rg.hist(D.wf, { bins, range: [0, tm], density: true, color: 'blue', fillAlpha: 0.25 });
          Rg.hist(D.mo, { bins, range: [0, tm], density: true, color: 'purple', fillAlpha: 0.2 });
          const mw = mean(D.wf), mm = mean(D.mo);
          Rg.vline(mw, { color: 'blue', width: 2 }); Rg.vline(mm, { color: 'purple', width: 2, dash: true });
          Rg.vline(th, { color: 'green', width: 1.5, dash: true });
          info = { n, p0, mw, mm, th };
        });
        v.legend([['blue', 'Wright–Fisher'], ['purple', 'Moran'], ['green', 'diffusion mean', { dash: true }]]);
        v.readout(() => `Mean absorption time from $p_0=${v.fix(info.p0, 2)}$: Wright–Fisher ${v.fix(info.mw, 1)}, Moran ${v.fix(info.mm, 1)} generations; diffusion formula $-2n[p\\ln p+(1-p)\\ln(1-p)]=${v.fix(info.th, 1)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'Effective population size',
      statement: String.raw`The **effective population size** $N_e$ of a real population is the size of the ideal Wright–Fisher population that shows the same rate of drift. The usual yardstick is the decay of expected heterozygosity: if $\mathbb E[H_{t+1}]\approx(1-\lambda)\mathbb E[H_t]$ then $N_e=1/(2\lambda)$ (inbreeding effective size). For a population of $N$ diploids of constant size whose members leave offspring with variance $V_k$ (mean $2$ per individual), $N_e\approx(4N-2)/(V_k+2)$, which equals $N$ when $V_k=2$ (Poisson reproduction) and falls below $N$ when some individuals are far more productive than others.`,
      idea: String.raw`Drift is sampling noise, and the amount of sampling noise per generation is set by how unevenly parents contribute to the next generation: two gene copies are identical by descent with probability $1/2N_e$ in the previous generation, and that probability is the mean squared share of the parents’ contributions. The more variable the family sizes, the larger that probability, so the smaller the size of the ideal population with the same noise. $N_e$ is defined by the observable (here the $H_t$ decay of 2.3), not by a head-count.`,
      caption: String.raw`A population of $N$ diploids (here $2N$ gene copies) in which each copy’s expected number of offspring is random with variance controlled by the slider. Left: mean $H_t/H_0$ over 200 runs (dots) decays faster than the ideal population of $N$ (grey) and agrees with the ideal population of size $N_e$ (green) read off from the fitted slope. Right: family-size distribution of one generation (bars) against the Poisson case (dots); its variance is the one that sets $N_e\approx N/V$.`,
      deps: ['popgen-2.3'],
      refs: ['Ewens §3.7'],
      credit: 'Sewall Wright, 1931 (effective number); Kimura & Crow, 1963',
      scope: String.raw`Constant census size, discrete generations, offspring variance equal across generations; the inbreeding and variance effective sizes then coincide. Other definitions (eigenvalue, coalescent) agree only under further conditions.`,
      tags: ['effective size', 'drift'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Effective_population_size' },
      viz(v) {
        const nS = v.slider('census size $N$ (diploids)', 10, 50, 40, { int: true });
        const VS = v.slider('variance of offspring number (per gene copy)', 1, 6, 3, { step: 0.25 });
        const tS = v.slider('generations', 20, 150, 60, { int: true });
        let seed = 1; v.button('New runs', () => { seed++; });
        const L = v.stage({ x: [0, 60], y: [1e-3, 1.5], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'mean H(t) / H(0)', title: 'Decay of heterozygosity' });
        const Rg = v.stage({ x: [-0.5, 10.5], y: [0, 0.5], axes: 'box', gutter: true, height: 330, xlabel: 'offspring of one gene copy', ylabel: 'share of copies', title: 'Family sizes in one generation', minWidth: 280 });
        const sim = memo();
        let info = {};
        function runEff(N, V, T, sd) {
          const n = 2 * N, c = V - 1, r = v.rng(sd), R = 200, mean = new Float64Array(T + 1), cum = new Float64Array(n);
          const fam = new Float64Array(12);
          for (let i = 0; i < R; i++) {
            let typ = new Uint8Array(n); for (let j = 0; j < n / 2; j++) typ[j] = 1;
            for (let t = 0; t <= T; t++) {
              let a = 0; for (let j = 0; j < n; j++) a += typ[j]; const p = a / n; mean[t] += 2 * p * (1 - p);
              if (t === T || a === 0 || a === n) continue;
              let tot = 0;
              for (let j = 0; j < n; j++) { tot += c > 0.001 ? gammaDraw(r, 1 / c) * c : 1; cum[j] = tot; }
              const nt = new Uint8Array(n), kids = i === 0 && t < 5 ? new Int32Array(n) : null;
              for (let j = 0; j < n; j++) {
                const u = r() * tot; let lo = 0, hi = n - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < u) lo = mid + 1; else hi = mid; }
                nt[j] = typ[lo];
                if (kids) kids[lo]++;
              }
              if (kids) for (let j = 0; j < n; j++) fam[Math.min(11, kids[j])]++;
              typ = nt;
            }
          }
          return { mean: mean.map((x) => x / R / 0.5), fam };
        }
        v.render(() => {
          const N = nS.value, n = 2 * N, V = VS.value, T = tS.value;
          const D = sim(`${N}|${V}|${T}|${seed}`, () => runEff(N, V, T, seed * 7 + N));
          L.setView([0, T], [1e-3, 1.5]);
          const ideal = (t) => Math.pow(1 - 1 / n, t);
          L.fn(ideal, { domain: [0, T], n: 120, color: 'muted', width: 2, dash: true });
          const ts = [], ys = [];
          for (let t = 0; t <= T; t++) if (D.mean[t] > 0.03) { ts.push(t); ys.push(Math.log(D.mean[t])); }
          const fit = ts.length > 3 ? lsq(ts, ys) : { slope: -1 / n, intercept: 0 };
          const lam = 1 - Math.exp(fit.slope), Ne = 1 / (2 * lam);
          L.fn((t) => Math.pow(1 - lam, t), { domain: [0, T], n: 120, color: 'green', width: 2.5 });
          const dots = []; const step = Math.max(1, Math.floor(T / 50)); for (let t = 0; t <= T; t += step) if (D.mean[t] > 1e-3) dots.push([t, D.mean[t]]);
          L.dots(dots, { r: 3, color: 'accent' });
          // family sizes (first five generations of run 0), against Poisson(1)
          const tot = D.fam.reduce((a, b) => a + b, 0) || 1; let m1 = 0, m2 = 0; D.fam.forEach((f, k) => { m1 += (k * f) / tot; m2 += (k * k * f) / tot; });
          const vk = m2 - m1 * m1;
          Rg.setView([-0.5, 10.5], [0, Math.max(0.45, Math.max(...D.fam) / tot * 1.1)]);
          D.fam.forEach((f, k) => { if (f) Rg.rect(k - 0.35, 0, k + 0.35, f / tot, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 }); });
          for (let k = 0; k <= 10; k++) Rg.dot(k, Math.exp(-1) / [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][k], { r: 3.5, color: 'ink' });
          info = { N, V, Ne, vk, pred: N / V, lam };
        });
        v.legend([['accent', 'simulated population', { dot: true }], ['green', 'ideal population of size $N_e$'], ['muted', 'ideal population of size $N$', { dash: true }], ['ink', 'Poisson(1)', { dot: true }]]);
        v.readout(() => `Measured $N_e=1/(2\\lambda)=${v.fix(info.Ne, 1)}$ (from the fitted decay rate $\\lambda=${v.fix(info.lam, 4)}$) against the census $N=${info.N}$.\nSampled family-size variance $V=${v.fix(info.vk, 2)}$ (slider ${v.fix(info.V, 2)}); the rule of thumb $N_e\\approx N/V=${v.fix(info.pred, 1)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Fluctuating size: Nₑ is the harmonic mean',
      statement: String.raw`If the population size varies from generation to generation, $N_1,\dots,N_T$, then the expected heterozygosity decays as
$$\frac{\mathbb E[H_T]}{H_0}=\prod_{t=1}^{T}\Bigl(1-\frac1{2N_t}\Bigr)\;\approx\;\exp\Bigl(-\sum_t\frac1{2N_t}\Bigr),$$
so over $T$ generations the effective size is (approximately) the **harmonic mean** $N_e=T\big/\sum_{t}N_t^{-1}$, which is never larger than the arithmetic mean and is dominated by the smallest sizes.`,
      idea: String.raw`Each generation multiplies the heterozygosity by $1-1/2N_t$ (2.3), so the factors multiply and the loss rates $1/2N_t$ add. The loss rate of a size-$N$ generation is inversely proportional to $N$, so a single generation of size $10$ among generations of size $10^4$ costs as much diversity as $10^3$ big generations. Defining $N_e$ as the constant size with the same total loss, $T/N_e=\sum 1/N_t$, is the harmonic mean; its comparison with the arithmetic mean is the AM–HM inequality (a consequence of the AM–GM inequality).`,
      caption: String.raw`Draw a population-size history (top-left) with a bottleneck: choose its size and length, or switch to cycling or growing populations. The bar chart marks the arithmetic mean (red) and harmonic mean (green). Right: 400 simulated populations following the history lose heterozygosity as the green curve ($N_e=$ harmonic mean), not the red one.`,
      deps: ['popgen-2.6', 'rca-3.3a'],
      refs: ['Ewens §3.7'],
      credit: 'Sewall Wright, 1938',
      scope: String.raw`Neutral, discrete generations, random mating in each generation, sizes not correlated with allele frequency. For long histories the geometric-product formula is exact for the expected heterozygosity; the harmonic-mean $N_e$ is its single-number summary.`,
      tags: ['effective size', 'bottleneck', 'harmonic mean'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Effective_population_size#Variations_in_population_size' },
      viz(v) {
        const pat = v.select('history', [{ value: 'bottle', label: 'one bottleneck' }, { value: 'cycle', label: 'boom–bust cycles' }, { value: 'grow', label: 'exponential growth' }], 'bottle');
        const nb = v.slider('typical size $N$', 50, 2000, 500, { int: true, log: true });
        const nm = v.slider('bottleneck size $N_{\\min}$', 2, 200, 10, { int: true, log: true });
        const du = v.slider('bottleneck length (generations)', 1, 20, 5, { int: true });
        const T = 60;
        const L = v.stage({ x: [-0.5, T + 0.5], y: [1, 3000], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'population size N(t)', title: 'Size history' });
        const Rg = v.stage({ x: [0, T], y: [1e-2, 1.3], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'H(t) / H(0), log scale', title: 'Heterozygosity lost', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const big = nb.value, mn = Math.min(nm.value, big), d = du.value, k = pat.value;
          du.el.hidden = k !== 'bottle'; nm.el.hidden = k === 'grow';
          const N = Array.from({ length: T }, (_, t) => {
            if (k === 'bottle') return t >= 20 && t < 20 + d ? mn : big;
            if (k === 'cycle') return Math.round(Math.exp(Math.log(mn) + (Math.log(big) - Math.log(mn)) * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 12))));
            return Math.round(Math.exp(Math.log(Math.max(mn, 2)) + ((Math.log(big) - Math.log(Math.max(mn, 2))) * t) / (T - 1)));
          });
          const am = N.reduce((a, b) => a + b, 0) / T, hm = T / N.reduce((a, b) => a + 1 / b, 0);
          N.forEach((x, t) => L.rect(t + 1 - 0.4, 1, t + 1 + 0.4, x, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 }));
          L.hline(am, { color: 'red', width: 2, dash: true }); L.hline(hm, { color: 'green', width: 2.5 });
          const D = sim(N.join(','), () => {
            const r = v.rng(77), R = 400, mean = new Float64Array(T + 1);
            for (let i = 0; i < R; i++) {
              let n = 2 * N[0], kk = Math.round(n / 2);
              for (let t = 0; t <= T; t++) { const p = kk / n; mean[t] += 2 * p * (1 - p); if (t < T) { const n2 = 2 * N[t]; const f = kk / n; kk = binom(r, n2, f); n = n2; } }
            }
            return mean.map((x) => x / R / 0.5);
          });
          const exact = (t) => { let a = 1; for (let i = 0; i < Math.floor(t); i++) a *= 1 - 1 / (2 * N[i]); return a; };
          Rg.setView([0, T], [Math.max(1e-3, Math.min(Math.exp(-T / (2 * hm)), D[T] || 1) * 0.6), 1.15]);
          Rg.fn((t) => Math.exp(-t / (2 * hm)), { domain: [0, T], n: 100, color: 'green', width: 3 });
          Rg.fn((t) => Math.exp(-t / (2 * am)), { domain: [0, T], n: 100, color: 'red', width: 2, dash: true });
          Rg.path(Array.from({ length: T + 1 }, (_, t) => [t, Math.max(D[t], 1e-6)]), { color: 'accent', width: 2 });
          Rg.dots(Array.from({ length: Math.floor(T / 3) + 1 }, (_, i) => [i * 3, Math.max(D[i * 3], 1e-6)]), { r: 3, color: 'accent' });
          info = { am, hm, ex: exact(T), simT: D[T], thH: Math.exp(-T / (2 * hm)), thA: Math.exp(-T / (2 * am)) };
        });
        v.legend([['accent', 'simulated heterozygosity'], ['green', 'harmonic mean $N_e$'], ['red', 'arithmetic mean', { dash: true }]]);
        v.readout(() => `Arithmetic mean $${v.fix(info.am, 0)}$, harmonic mean $N_e=${v.fix(info.hm, 1)}$.\nAfter ${60} generations $H/H_0$: exact product ${v.fix(info.ex, 3)}, simulation ${v.fix(info.simT, 3)}, harmonic-mean prediction ${v.fix(info.thH, 3)}, arithmetic-mean prediction ${v.fix(info.thA, 3)}.`);
      },
    },
  ],
};
