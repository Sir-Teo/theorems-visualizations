// Networks & Collective Behavior — Chapter 4, part b: power laws and preferential attachment (items 4.7–4.11)
//
// Sources checked (Oct 2026): Clauset, Shalizi & Newman, SIAM Review 51 (4): 661–703 (2009), doi 10.1137/070710111 (Crossref);
// Price, J. Am. Soc. Inf. Sci. 27 (5): 292–306 (1976), doi 10.1002/asi.4630270505 (Crossref); Broido & Clauset, Nature
// Communications 10: 1017 (2019): 928 data sets from the Index of Complex Networks, 3,662 graphs; shares Not scale-free 49%,
// super-weak 46%, weakest 29%, weak 19%, strong 10%, strongest 4%; the lognormal fits at least as well as the power law for
// 88% of networks (text of the paper on PubMed Central). The rate-equation recursion in 4.10 is derived on the page and is
// checked against the exact result P(k) = 2m(m+1)/(k(k+1)(k+2)) at a = 0. All networks drawn here are simulations (models).
import {
  rng32, mkGraph, gnpSkip, baMix, rateEq, hillDisc, logBin, nonlinearPA, powerSample, lognormalSample, lsq,
  plBestXminCont, plFitCont, lnFitCont, lnLogLik, plPointwiseCont, vuong, normCdf, analyseDegrees, degreeSequence, configModel,
  hurwitz, lesmis, deg as degOf,
} from './ch04.shared.js';

import { attachmentRng, finiteAttachmentShift, growAttachmentMixture, growNonlinearTree, attachmentCounts, attachmentSurvival, attachmentStationary, approximateAttachmentTail, attachmentLogView } from './source-audit-attachment.js';

const SIGN = (x) => (x < 0 ? '−' : '');

export default {
  collection: 'soc',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Power-law (heavy-tailed) distributions',
      statement: String.raw`A positive random variable $X$ has a **power-law tail** with exponent $\alpha>1$ above $x_{\min}$ if
$$P(X>x)=\Big(\frac{x}{x_{\min}}\Big)^{-(\alpha-1)},\qquad x\ge x_{\min},$$
equivalently the density is $p(x)=\frac{\alpha-1}{x_{\min}}(x/x_{\min})^{-\alpha}$. Its signatures:

(a) **Straight line on log–log axes**: $\ln P(X>x)$ is linear in $\ln x$ with slope $-(\alpha-1)$ (the histogram has slope $-\alpha$).

(b) **Scale-free**: $P(X>2x)/P(X>x)=2^{-(\alpha-1)}$ whatever $x$ is: there is no typical size.

(c) **Moments**: $E[X^m]$ is finite only if $m<\alpha-1$. The mean is infinite for $\alpha\le2$, the variance for $\alpha\le3$ (most networks and cities have $2<\alpha<3$, so sample averages converge slowly and are dominated by the few largest values).

(d) **Concentration**: a small number of observations carry a large share of the total (the "80/20" rule is a power law with $\alpha\approx2.16$).`,
      idea: String.raw`Under an exponential or Gaussian tail the probability of exceeding $x$ falls faster than any power, so a sample is described by its mean and spread. With a power-law tail, $P(X>x)$ falls only polynomially, so an observation a thousand times larger than the median is merely rare, not impossible. The running mean of a sample then keeps jumping each time a new giant arrives, and for $\alpha\le2$ it never settles, because the expectation $\int x\,p(x)\,dx$ diverges. Drawing $X=x_{\min}(1-U)^{-1/(\alpha-1)}$ from a uniform $U$ (inverse-transform sampling) shows the whole family from one random stream.`,
      caption: String.raw`**Left**: the empirical survival function (CCDF) of $n$ samples on log–log axes, with the exact line (slope $1-\alpha$). **Right**: running means of three independent streams of $10^5$ draws against the sample size: the dashed line is the true mean $\frac{\alpha-1}{\alpha-2}x_{\min}$ (finite only for $\alpha>2$). Slide $\alpha$ below 3 and 2 and watch the average stop converging; the samples are coupled, so the same random numbers are reused as $\alpha$ moves.`,
      scope: String.raw`Pure power laws are idealisations: real data follow the law only above some $x_{\min}$ and usually with a cutoff. Whether data are power-law at all is a statistical question (4.8, 4.11).`,
      deps: ['soc-2.3'],
      refs: ['E&K §18.2', 'Newman ch. 10'],
      tags: ['power laws', 'heavy tails'],
      credit: 'Pareto, 1896 (wealth); Zipf, 1949 (words, cities)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Power_law' },
      verify: true,
      viz(v) {
        const aS = v.slider('exponent $\\alpha$', 1.3, 4.5, 2.5, { step: 0.05 });
        const nS = v.slider('sample size $n$', 100, 100000, 3000, { log: true, sig: 2, int: true });
        const U = (() => { const R = rng32(17); return Array.from({ length: 100000 }, () => R()); })();
        const streams = [0, 1, 2].map((i) => { const R = rng32(100 + i); return Array.from({ length: 100000 }, () => R()); });
        const CC = v.stage({ x: [1, 1e5], y: [1e-5, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'size $x$', ylabel: '$P(X>x)$', title: 'survival function, log–log', minWidth: 300, weight: 1.1 });
        const RM = v.stage({ x: [1, 1e5], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'sample size', ylabel: 'running mean', title: 'does the average settle?', minWidth: 300, weight: 1.1 });
        let sortedCache = { n: 0, u: null };
        let st = null;
        v.render(() => {
          const a = aS.value, n = Math.round(nS.value), e = -1 / (a - 1);
          if (sortedCache.n !== n) sortedCache = { n, u: U.slice(0, n).sort((p, q) => p - q) };
          const xs = sortedCache.u.map((u) => Math.pow(1 - u, e)).reverse();   // descending: rank r has P(X ≥ x) = r/n
          CC.setView([1, Math.max(20, xs[0] * 2)], [0.3 / n, 1.3]);
          CC.fn((x) => Math.pow(x, 1 - a), { color: 'ink', width: 1.6, dash: [6, 4], domain: [1, Math.max(20, xs[0] * 2)] });
          const pts = [], step = Math.max(1, Math.floor(n / 250));
          for (let r = 1; r <= n; r += (r < 30 ? 1 : Math.ceil(r * 0.04))) pts.push([xs[r - 1], r / n]);
          CC.dots(pts, { r: 2.8, color: 'accent' });
          const mean = a > 2 ? (a - 1) / (a - 2) : Infinity;
          const cols = ['accent', 'orange', 'teal'], rm = [];
          streams.forEach((u, i) => {
            let s = 0; const line = [];
            for (let k = 1; k <= 100000; k++) { s += Math.pow(1 - u[k - 1], e); if (k < 20 || k % Math.max(1, Math.floor(k / 40)) === 0 || k === 100000) line.push([k, s / k]); }
            RM.path(line, { color: cols[i], width: 1.8 }); rm.push(s / 100000);
          });
          const ymax = isFinite(mean) ? Math.max(3 * mean, 4) : 40; RM.setView([1, 1e5], [0, Math.min(ymax, 60)]);
          if (isFinite(mean) && mean < 60) RM.hline(mean, { color: 'ink', width: 1.6, dash: [6, 4] });
          const tot = xs.reduce((p, q) => p + q, 0), top = xs.slice(0, Math.max(1, Math.round(0.01 * n))).reduce((p, q) => p + q, 0);
          st = { a, n, mean, rm, top: top / tot, xmax: xs[0], ratio: Math.pow(2, 1 - a) };
        });
        v.legend([['accent', 'sample survival function', { dot: true }], ['ink', 'exact $x^{1-\\alpha}$', { dash: true }], ['accent', 'stream 1'], ['orange', 'stream 2'], ['teal', 'stream 3']]);
        v.readout(() => {
          if (!st) return '';
          const { a, n, mean, rm, top, xmax, ratio } = st;
          return String.raw`$\alpha=${v.fix(a, 2)}$, $n=${n}$ · largest value ${v.fix(xmax, 0)} · $P(X>2x)/P(X>x)=2^{1-\alpha}=${v.fix(ratio, 3)}$ at every $x$ · top 1% of the sample holds **${v.fix(100 * top, 0)}%** of the total
true mean: ${isFinite(mean) ? String.raw`$\frac{\alpha-1}{\alpha-2}=${v.fix(mean, 2)}$` : '**infinite** ($\\alpha\\le2$)'}; variance: ${a > 3 ? 'finite' : '**infinite** ($\\alpha\\le3$)'} · means after $10^5$ draws: ${rm.map((x) => v.fix(x, 1)).join(', ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Method',
      name: 'Fitting power laws honestly (Clauset–Shalizi–Newman)',
      statement: String.raw`Given data $x_1,\dots,x_n$, the recommended recipe (Clauset, Shalizi and Newman, 2009) is:

(a) For each candidate $x_{\min}$ estimate $\alpha$ by **maximum likelihood** on the $n_{\rm tail}$ observations $x_i\ge x_{\min}$; for continuous data
$$\hat\alpha=1+n_{\rm tail}\Big[\sum_{i}\ln\frac{x_i}{x_{\min}}\Big]^{-1},\qquad \text{standard error }\ \frac{\hat\alpha-1}{\sqrt{n_{\rm tail}}}.$$
(b) Choose the $x_{\min}$ whose fitted model has the smallest Kolmogorov–Smirnov distance to the empirical tail.
(c) Test the fit by simulation (a goodness-of-fit $p$-value) and **compare with alternatives** (lognormal, exponential, stretched exponential) by a likelihood-ratio test: a normalised log-likelihood ratio $z$ with a $p$-value (Vuong's test).

Do **not** estimate $\alpha$ by a least-squares line through a log–log histogram: the estimate is biased, its error bars are wrong, and a straight-looking plot does not show that the data are a power law, since a lognormal is also nearly straight over a wide range.`,
      idea: String.raw`The log–log regression treats noisy low-count bins as equally reliable as the large-count bins and bins the data in a way that distorts the slope. Maximum likelihood uses every observation with its proper weight (the sufficient statistic is $\sum\ln x_i$), is consistent, and comes with a standard error. Choosing $x_{\min}$ by minimal KS distance balances bias (too low: includes non-power-law body) against variance (too high: too few points). Finally, goodness of fit alone cannot prove a power law, only fail to reject it; the likelihood-ratio test asks whether a rival model explains the *same* data better.`,
      caption: String.raw`Choose the source of the data and press **Resample**. **Left**: the log-binned histogram with the least-squares line (red) and the maximum-likelihood fit (green). **Right**: the survival function above $x_{\min}$ with the fitted power law (green) and the fitted lognormal (orange). Try a *lognormal* source and press Resample a few times: the line fit gives a slope and a respectable $R^2$ that differ from the maximum-likelihood exponent, a power-law "tail" is found anyway, and the likelihood-ratio test is often unable to tell the lognormal from it (the usual outcome at modest $n$); with true power-law data the test does not reject the power law and the lognormal is not better.`,
      scope: String.raw`Continuous version, with $x_{\min}$ chosen by KS distance over at most 60 candidates and fits by Nelder–Mead for the lognormal. The goodness-of-fit bootstrap of the paper is omitted here (it needs thousands of synthetic data sets); integer data (degrees) need the discrete likelihood, as used in 4.11. The data are simulated, not real.`,
      deps: ['soc-4.7', 'stat-3.5'],
      refs: ['Newman ch. 10'],
      tags: ['power laws', 'statistics', 'maximum likelihood'],
      credit: 'Clauset, Shalizi & Newman, 2009 (SIAM Review 51: 661–703)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Power_law#Estimating_the_exponent_from_empirical_data', doi: 'https://doi.org/10.1137/070710111' },
      viz(v) {
        const src = v.select('data come from', [{ value: 'pl', label: 'a power law, α = 2.5' }, { value: 'ln', label: 'a lognormal' }, { value: 'ex', label: 'an exponential' }], 'ln');
        const nS = v.slider('sample size $n$', 500, 20000, 5000, { step: 500, int: true });
        let seed = 3; v.button('Resample', () => { seed++; });
        const HS = v.stage({ x: [1, 1e4], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'size $x$', ylabel: 'density', title: 'log-binned histogram', minWidth: 300, weight: 1.1 });
        const CS = v.stage({ x: [1, 1e4], y: [1e-3, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'size $x$', ylabel: '$P(X\\ge x)$ within the tail', title: 'tail and fits', minWidth: 300, weight: 1.1 });
        let key = '', S = null;
        const compute = () => {
          const k = `${src.value}|${nS.value}|${seed}`; if (k === key) return S; key = k;
          const R = rng32(seed * 31 + 7), n = nS.value; let xs;
          if (src.value === 'pl') xs = powerSample(2.5, 1, n, R);
          else if (src.value === 'ln') xs = lognormalSample(2.2, 1.45, n, R);
          else { xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = 1 - 6 * Math.log(1 - R()); }
          const sorted = Array.from(xs).sort((a, b) => a - b), fit = plBestXminCont(sorted);
          // least-squares line through the log-binned histogram (all occupied bins)
          const lo = sorted[0], hi = sorted[n - 1], nb = 24, edges = Array.from({ length: nb + 1 }, (_, i) => lo * Math.pow(hi / lo, i / nb));
          const cnt = new Array(nb).fill(0); for (const x of sorted) { let b = Math.min(nb - 1, Math.floor(Math.log(x / lo) / Math.log(hi / lo) * nb)); cnt[b]++; }
          const bins = cnt.map((c, i) => ({ x: Math.sqrt(edges[i] * edges[i + 1]), d: c / n / (edges[i + 1] - edges[i]), c })).filter((b) => b.c > 0);
          const ls = lsq(bins.map((b) => Math.log(b.x)), bins.map((b) => Math.log(b.d)));
          const ln = lnFitCont(v.M, sorted, fit.xmin);
          const cmp = vuong(plPointwiseCont(sorted, fit.xmin, fit.alpha), lnLogLik(sorted, fit.xmin, ln.mu, ln.sigma));
          return (S = { sorted, fit, bins, ls, ln, cmp, n });
        };
        let st = null;
        v.render(() => {
          const { sorted, fit, bins, ls, ln, cmp, n } = compute(), { xmin, alpha, n: nt } = fit;
          HS.setView([1, Math.max(1e2, sorted[n - 1] * 1.5)], [Math.min(...bins.map((b) => b.d)) / 3, Math.max(...bins.map((b) => b.d)) * 3]);
          HS.dots(bins.map((b) => [b.x, b.d]), { r: 3.6, color: 'accent' });
          HS.fn((x) => Math.exp(ls.intercept + ls.slope * Math.log(x)), { color: 'red', width: 2, domain: [bins[0].x, bins[bins.length - 1].x] });
          const c0 = nt / n * (alpha - 1) / xmin;   // fitted density in the tail, scaled to all-data density
          HS.fn((x) => c0 * Math.pow(x / xmin, -alpha), { color: 'green', width: 2.4, domain: [xmin, sorted[n - 1]] });
          HS.vline(xmin, { color: 'muted', width: 1, dash: [4, 4] });
          const tail = sorted.filter((x) => x >= xmin), m = tail.length, pts = [];
          for (let i = 0; i < m; i += Math.max(1, Math.floor(m / 200))) pts.push([tail[i], (m - i) / m]);
          CS.setView([xmin, Math.max(xmin * 5, tail[m - 1] * 1.5)], [Math.min(0.5 / m, 1e-2), 1.2]);
          CS.dots(pts, { r: 2.6, color: 'accent' });
          CS.fn((x) => Math.pow(x / xmin, 1 - alpha), { color: 'green', width: 2.4, domain: [xmin, tail[m - 1]] });
          const z0 = 1 - normCdf((Math.log(xmin) - ln.mu) / ln.sigma);
          CS.fn((x) => (1 - normCdf((Math.log(x) - ln.mu) / ln.sigma)) / z0, { color: 'orange', width: 2.4, domain: [xmin, tail[m - 1]] });
          st = { fit, ls, ln, cmp, n, nt: m };
        });
        v.legend([['accent', 'data', { dot: true }], ['red', 'least-squares line on the histogram'], ['green', 'maximum-likelihood power law'], ['orange', 'maximum-likelihood lognormal']]);
        v.readout(() => {
          if (!st) return '';
          const { fit, ls, ln, cmp, nt } = st, fav = cmp.p < 0.1 ? (cmp.R > 0 ? 'the power law is significantly better' : '**the lognormal is significantly better**') : 'the test cannot decide between them';
          return String.raw`Line fit: slope **${v.fix(-ls.slope, 2)}** → $\alpha=${v.fix(-ls.slope, 2)}$ with $R^2=${v.fix(ls.r2, 3)}$ · maximum likelihood: $\hat\alpha=$ **${v.fix(fit.alpha, 2)}** ± ${v.fix(fit.se, 2)}, $x_{\min}=${v.fix(fit.xmin, 1)}$ (${nt} points in the tail), KS distance ${v.fix(fit.D, 3)}
Lognormal fit on the same tail: $\mu=${v.fix(ln.mu, 2)}$, $\sigma=${v.fix(ln.sigma, 2)}$ · log-likelihood ratio (power law − lognormal) $R=${v.fix(cmp.R, 1)}$, $z=${v.fix(cmp.z, 2)}$, $p=${v.fix(cmp.p, 3)}$: ${fav}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Preferential attachment and nonlinear kernels',
      statement: String.raw`In this growing-tree model, start with two vertices joined by one edge. Each new vertex adds one edge to an earlier vertex $i$, chosen with probability $\Pi_i=k_i^\gamma/\sum_j k_j^\gamma$, using degrees before the new edge. The graph remains a tree: at $N$ vertices it has $N-1$ edges and degree sum $2(N-1)$. Linear attachment, $\gamma=1$, favors vertices that already have many links. In the large-network stationary limit its degree probabilities are $P(k)=4/[k(k+1)(k+2)]$ and $P(K\ge k)=2/[k(k+1)]$, not exact finite-sample frequencies.`,
      idea: String.raw`For this homogeneous kernel family, Krapivsky, Redner and Leyvraz derive a geometric degree law at $\gamma=0$, stretched-exponential asymptotic tails for $0<\gamma<1$, the exponent-3 law at $\gamma=1$, and a dominant hub for $\gamma>1$ in the growing-network limit. Near 1 the finite distributions can be hard to distinguish. More general **asymptotically linear** kernels can have different power-law exponents, so exact proportionality to $k$ is not universally necessary. The continuum age equation $\mathrm dk/\mathrm dt\approx k/(2t)$ gives $k_i(t)\approx(t/t_i)^{1/2}$ for a new degree-1 vertex; it is an approximation, not a rule that the oldest vertex must win every realization.`,
      caption: String.raw`An authored seeded simulation, not observed social-network data. Left: the complete empirical degree survival function for the chosen kernel, the same-size linear-kernel realization, and the limiting linear formula evaluated over the displayed degree range. Right: actual degrees of the first 40 vertices; the first two are equally old seed vertices. Change the kernel or network size and use **New tree** to inspect another realization. A finite plot or a large hub does not certify an asymptotic tail law.`,
      scope: String.raw`One undirected edge per newcomer; no parallel edges, deletion, fitness or explicit aging. The initial edge and endpoint timing are declared simulation conventions. The displayed nonlinear results concern the homogeneous family $k^\gamma$ and its large-network analysis, not all possible growth mechanisms or real networks. The reference degree law is stationary and infinite-size, while every plotted frequency is computed from the actual finite tree.`,
      deps: ['soc-4.7'],
      refs: ['Barabási & Albert, Emergence of Scaling in Random Networks (Science 1999), model and continuum argument, p. 511', 'Krapivsky, Redner & Leyvraz, Connectivity of Growing Random Networks, arXiv:cond-mat/0005139v2 (2000), Eqs. 1–8 and 13–17'],
      credit: 'Model and analysis: Barabási & Albert, 1999; Krapivsky, Redner & Leyvraz, 2000; finite simulation conventions stated here',
      links: { original: 'https://barabasi.com/media/Emergence-Barabasi-1999_gN74Tws.pdf', analysis: 'https://arxiv.org/abs/cond-mat/0005139v2' },
      tags: ['preferential attachment', 'growth', 'networks'],
      verify: false,
      viz(v) {
        const gamma = v.slider('kernel exponent $\\gamma$', 0, 2, 1, { step: .05 });
        const size = v.select('vertices', [{ value: 1000, label: '1,000' }, { value: 5000, label: '5,000' }, { value: 20000, label: '20,000' }], 20000);
        let seed = 17, cache = new Map();
        const run = (g, n) => { const key = `${seed}|${g}|${n}`; if (!cache.has(key)) { if (cache.size >= 8) cache.delete(cache.keys().next().value); cache.set(key, growNonlinearTree(n, g, attachmentRng(seed))); } return cache.get(key); };
        v.button('New tree', () => { seed = (seed + 1) % 1000000; cache.clear(); });
        v.shareState('tree seed', { get: () => seed, validate: x => Number.isInteger(x) && x >= 0 && x < 1000000, set: x => { seed = x; cache.clear(); } });
        const DS = v.stage({ x: [.7, 100], y: [.0001, 1.5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'degree k', ylabel: 'P(K ≥ k)', title: 'Finite survival and a limiting reference', minWidth: 300, weight: 1.1 });
        const AS = v.stage({ x: [0, 41], y: [-1, 100], axes: 'box', gutter: true, height: 340, xlabel: 'vertex index (two seeds first)', ylabel: 'degree', title: 'Degrees of the first 40 vertices', minWidth: 280, weight: 1 });
        let st;
        v.render(() => {
          const n = +size.value, g = gamma.value, graph = run(g, n), linear = run(1, n), S = attachmentSurvival(graph.degrees), L = attachmentSurvival(linear.degrees);
          const K = Math.max(S.at(-1)[0], L.at(-1)[0]), theory = Array.from({ length: K }, (_, i) => [i + 1, 2 / ((i + 1) * (i + 2))]);
          const ymin = Math.min(1 / n, theory.at(-1)[1]);
          DS.setView(attachmentLogView(1, K), attachmentLogView(ymin, 1));
          DS.path(L, { color: 'ink', width: 1.6, dash: [6, 4] }); DS.path(theory, { color: 'green', width: 1.5, dash: [2, 3] }); DS.dots(S, { color: 'accent', r: 3 });
          const first = Array.from(graph.degrees.slice(0, 40)); let maximum = 0, winner = 0, degreeSum = 0;
          graph.degrees.forEach((k, i) => { degreeSum += k; if (k > maximum) { maximum = k; winner = i; } });
          AS.setView([0, 41], [-Math.max(...first) * .04, Math.max(...first) * 1.15]);
          first.forEach((k, i) => AS.rect(i + .65, 0, i + 1.35, k, { fill: i === winner ? 'gold' : 'accent', fillAlpha: .7, stroke: false }));
          st = { g, n, seed, graph, linear, S, L, theory, first, maximum, winner, degreeSum };
        });
        v.legend([['accent', 'chosen finite tree', { dot: true }], ['ink', 'finite linear tree', { dash: true }], ['green', 'limiting linear survival', { dash: true }]]);
        v.readout(() => {
          const { g, n, seed, graph, maximum, winner, degreeSum } = st;
          return String.raw`$\gamma=${v.fix(g, 2)}$, realization seed ${seed}: **${n.toLocaleString('en-US')} vertices**, ${graph.edges.toLocaleString('en-US')} edges; degree sum **${degreeSum.toLocaleString('en-US')} = 2(N-1)**. Largest degree **${maximum}**, vertex index ${winner + 1}: ${v.fix(100 * maximum / (n - 1), 2)}% of other vertices are its neighbors, and ${v.fix(100 * maximum / degreeSum, 2)}% of edge ends belong to it. This is one finite realization; its largest hub need not be the oldest vertex. The green line is an infinite-size stationary reference, not an exact sample fit or a statistical power-law verdict.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Preferential attachment gives degree exponent 3',
      statement: String.raw`For the stationary rate equation of affine attachment $k+a$, with integer $m\ge1$, $a>-m$ and integer $k\ge m$, put $\beta=m/(2m+a)$. Its probability law obeys $P(m)=[1+\beta(m+a)]^{-1}$ and
$$P(k)=P(k-1)\frac{\beta(k-1+a)}{1+\beta(k+a)}\quad(k>m).$$
Its tail exponent is $\eta=3+a/m$. In particular, when $a=0$,
$$P(k)=\frac{2m(m+1)}{k(k+1)(k+2)}\sim 2m(m+1)k^{-3}.$$
The coefficient is $2m(m+1)$ for fixed $m$; $2m^2$ is the different continuum approximation. These are stationary large-network laws, not exact degree counts at a finite growth step.`,
      idea: String.raw`The rate balance is $P(k)+\beta(k+a)P(k)-\beta(k-1+a)P(k-1)=\mathbf1_{k=m}$. The ratio of successive probabilities is $1-(3+a/m)/k+O(k^{-2})$, giving the exponent. In the finite simulation below, the seed is a clique of $m+1$ vertices. With $N$ old vertices its degree sum is $D_N=2mN-m(m+1)$. Each newcomer makes $m$ independent endpoint choices with replacement, all using this pre-arrival graph; degrees update after all choices. A target is uniform with probability $p$, otherwise degree-weighted. For $p<1$ this is exactly affine with $a_N=pD_N/[(1-p)N]$, tending to $a_\infty=2mp/(1-p)$. The limiting stationary equation therefore has exponent $3+a_\infty/m$; the finite process is not exactly one constant-shift process. For $p=1$ targets are purely uniform: the separate stationary law is geometric, $P(k)=(m+1)^{-1}[m/(m+1)]^{k-m}$.`,
      caption: String.raw`Blue dots are the actual finite degree frequencies $n_k/N$, without binning or discarded vertices. Green is the limiting stationary recurrence evaluated at every displayed integer degree. The dashed line is only a reference slope with the predicted exponent, anchored to the recurrence at a declared degree; it is not a fitted curve or an asserted asymptotic amplitude. At $p=1$ that power-law guide is absent and the green law is geometric. **New network** changes the seeded realization. Adjust the diagnostic threshold to inspect small or empty tails. Parallel edges are retained and counted, so a vertex's degree counts incidences rather than distinct neighbors.`,
      scope: String.raw`The theorem concerns the declared stationary rate equation. Finite simulation: a clique seed, $m$ frozen-probability draws with replacement per newcomer, then all updates; no self-loops after the seed and parallel links allowed. Dorogovtsev–Mendes–Samukhin's actual v1 preprint uses directed incoming degree $q$ and attractiveness $A^{(0)}+q$. The stationary correspondence is $q=k-m$, $A^{(0)}=m+a_\infty$, hence their $2+A^{(0)}/m=3+a_\infty/m$; our seed differs and its finite correction is displayed. The half-integer tail estimate is Clauset–Shalizi–Newman Eq. 3.7's approximation, not the exact discrete zeta MLE or a goodness-of-fit test. A finite sample and this diagnostic do not prove a power law or guarantee that estimated exponents move monotonically toward the limiting value.`,
      deps: ['soc-4.9'],
      refs: ['Dorogovtsev, Mendes & Samukhin, Structure of Growing Networks: Exact Solution of the Barabási–Albert’s Model, arXiv:cond-mat/0004434v1 (2000), Eqs. 1–13', 'Clauset, Shalizi & Newman, Power-law distributions in empirical data (2009 author version), §3.1, Eqs. 3.3–3.7'],
      credit: 'Stationary analysis: Dorogovtsev, Mendes & Samukhin, actual 2000 v1 preprint; finite mixture and seed conventions stated here',
      links: { source: 'https://arxiv.org/abs/cond-mat/0004434v1', estimator: 'https://snap.stanford.edu/class/cs224w-readings/clauset09powerlaw.pdf' },
      tags: ['preferential attachment', 'power laws', 'rate equation'],
      verify: false,
      viz(v) {
        const mS = v.slider('links per newcomer $m$', 1, 6, 3, { int: true });
        const pS = v.slider('uniform-target probability $p$', 0, 1, 0, { step: .05 });
        const kS = v.slider('diagnostic threshold $k_{\\min}$', 6, 2000, 12, { int: true, log: true });
        const size = v.select('network size', [{ value: 1000, label: '1,000' }, { value: 10000, label: '10,000' }, { value: 100000, label: '100,000' }], 10000);
        let seed = 23, cache = new Map();
        const run = (n, m, p) => { const key = `${seed}|${n}|${m}|${p}`; if (!cache.has(key)) { if (cache.size >= 6) cache.delete(cache.keys().next().value); cache.set(key, growAttachmentMixture(n, m, p, attachmentRng(seed))); } return cache.get(key); };
        v.button('New network', () => { seed = (seed + 1) % 1000000; cache.clear(); });
        v.shareState('mixture seed', { get: () => seed, validate: x => Number.isInteger(x) && x >= 0 && x < 1000000, set: x => { seed = x; cache.clear(); } });
        const DS = v.stage({ x: [.7, 100], y: [.00001, 1], xlog: true, ylog: true, axes: 'box', gutter: true, full: true, height: 360, xlabel: 'degree k (incidences)', ylabel: 'probability P(k)', title: 'Finite frequencies and a stationary law' });
        let st;
        v.render(() => {
          const n = +size.value, m = mS.value, p = pS.value, graph = run(n, m, p), counts = attachmentCounts(graph.degrees), maximum = counts.at(-1)[0], theory = attachmentStationary(m, p, maximum);
          const points = counts.map(([k, count]) => [k, count / n]), curve = Array.from({ length: maximum - m + 1 }, (_, i) => [m + i, theory.P[m + i]]), anchor = Math.min(maximum, 2 * m);
          const guideFloor = Math.min(1 / n, curve.at(-1)[1]) / 10, logSpan = p < 1 ? Math.max(0, Math.min(Math.log(maximum / anchor), (Math.log(theory.P[anchor]) - Math.log(guideFloor)) / theory.gamma)) : 0;
          const guide = logSpan > 1e-12 ? Array.from({ length: 101 }, (_, i) => { const logRatio = logSpan * i / 100; return [anchor * Math.exp(logRatio), Math.exp(Math.log(theory.P[anchor]) - theory.gamma * logRatio)]; }) : [];
          const ymin = Math.min(1 / n, curve.at(-1)[1], guide.length ? guide.at(-1)[1] : 1);
          DS.setView(attachmentLogView(m, maximum), attachmentLogView(ymin, 1));
          DS.path(curve, { color: 'green', width: 2.2 }); if (guide.length > 1) DS.path(guide, { color: 'ink', width: 1.5, dash: [6, 4] }); DS.dots(points, { color: 'accent', r: 3.5 });
          const shift = finiteAttachmentShift(n, m, p), tail = approximateAttachmentTail(graph.degrees, kS.value);
          let degreeSum = 0; graph.degrees.forEach(k => degreeSum += k);
          st = { n, m, p, seed, graph, counts, points, curve, guide, anchor, maximum, theory, shift, tail, degreeSum };
        });
        v.legend([['accent', 'finite degree frequencies', { dot: true }], ['green', 'limiting stationary law'], ['ink', 'exponent guide (p < 1 only)', { dash: true }]]);
        v.readout(() => {
          const { n, m, p, seed, graph, maximum, theory, shift, tail, anchor, guide, degreeSum } = st;
          const law = p === 1 ? '**Pure uniform endpoint**: a geometric stationary law, with no finite affine shift or power-law exponent.' : String.raw`Next-arrival finite shift $a_N=${v.fix(shift.a, 4)}$; limiting $a_\infty=${v.fix(theory.a, 4)}$, $\eta=${v.fix(theory.gamma, 4)}$. ${guide.length ? `Slope guide: k=${anchor} to ${v.fix(guide.at(-1)[0], 2)}.` : 'The slope guide has no resolvable span here.'}`;
          const diagnostic = tail.n ? String.raw`Half-integer approximation at or above $k_{\min}=${tail.kmin}$: **${v.fix(tail.estimate, 3)}**, ${tail.n} observations${tail.sufficient ? '' : ' (below the authored 50-observation support warning)'}.` : String.raw`No observations at or above $k_{\min}=${tail.kmin}$: the tail estimate is **undefined**, not zero.`;
          return String.raw`$N=${n.toLocaleString('en-US')}$, $m=${m}$, $p=${v.fix(p, 2)}$, seed ${seed}: **${graph.edges.toLocaleString('en-US')} edges**, degree sum **${degreeSum.toLocaleString('en-US')}**, ${graph.repeated.toLocaleString('en-US')} extra parallel edges; largest degree ${maximum}. ${law} Limiting probability beyond displayed $k=${maximum}$: $${v.sci(theory.tail, 2)}$. ${diagnostic} The threshold is reader-selected. Degrees in one growing graph are dependent; no independent-sample confidence calibration or power-law fit verdict is asserted.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Hypothesis',
      name: 'Are real networks scale-free? (debated)',
      statement: String.raw`**Hypothesis.** Most real-world networks — social, biological, technological — have degree distributions that follow a power law $P(k)\sim k^{-\gamma}$ with $2<\gamma<3$ ("scale-free").

The hypothesis was widely taken for granted after Barabási and Albert (1999) on the strength of straight-looking log–log plots. When Broido and Clauset (2019) tested a large corpus of network data sets (928 data sets, 3,662 graphs from the Index of Complex Networks) with the statistical methods of 4.8, they found that only about **4%** met their strongest criterion for scale-freeness and about **49%** none of their criteria, and that a lognormal fitted at least as well as the power law for 88% of the networks (social networks were at best weakly scale-free). Others (for example Barabási and co-authors) have objected that the criteria are too strict. The hypothesis in its strong form is **contested**; heavy tails are common, strict power laws less so.`,
      idea: String.raw`A power law is one particular heavy-tailed family, and over the few decades of degree that real networks span it is hard to tell from a lognormal or a power law with exponential cutoff. The test is therefore comparative: fit each family by maximum likelihood to the tail above a data-chosen $k_{\min}$ (4.8) and ask by a likelihood-ratio test which one the data prefer. The answer depends on the strictness of "scale-free" (exponent in $(2,3)$? at least 50 vertices in the tail? the power law not beaten by any rival?) and on whether networks are analysed whole or by projection, which is what the debate is about.`,
      caption: String.raw`A hands-on version of the test on model networks (the real corpus is not reproduced here): pick a network family and size; the page fits a discrete power law, a lognormal and a geometric tail above the KS-optimal $k_{\min}$ and reports the Vuong test of the power law against each. Bars on the right: the shares reported for the real corpus by Broido and Clauset. The Les Misérables network is a real (tiny) data set. Preferential attachment typically passes with $\gamma$ near 3; Erdős–Rényi and lognormal-degree graphs do not.`,
      scope: String.raw`This is a simplified version of the published pipeline: no goodness-of-fit bootstrap, discrete-data approximations as in 4.8, one fit per degree sequence rather than per layer or component. The shares quoted are the paper's corpus-wide figures (categories overlap in the paper's nested definitions: "strongest" implies "strong", and so on). The verdict labels below are illustrative.`,
      deps: ['soc-4.8', 'soc-4.10'],
      refs: ['Newman ch. 10'],
      tags: ['power laws', 'scale-free', 'statistics'],
      credit: 'Broido & Clauset, 2019 (Nature Communications 10: 1017)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Scale-free_network', doi: 'https://doi.org/10.1038/s41467-019-08746-5' },
      verify: true,
      viz(v) {
        const fam = v.select('network', [
          { value: 'ba', label: 'preferential attachment' }, { value: 'er', label: 'Erdős–Rényi' }, { value: 'pl', label: 'configuration, power-law degrees' },
          { value: 'ln', label: 'configuration, lognormal degrees' }, { value: 'lm', label: 'Les Misérables (real, 77)' },
        ], 'ba');
        const nS = v.slider('vertices $n$', 1000, 20000, 10000, { step: 1000, int: true });
        const CS = v.stage({ x: [1, 1e3], y: [1e-5, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'degree $k$', ylabel: '$P(\\mathrm{degree}\\ge k)$', title: 'degrees and fits', minWidth: 300, weight: 1.3 });
        const BS = v.stage({ x: [0, 7], y: [0, 55], axes: 'box', gutter: true, height: 340, xticks: [[0.5, 'not'], [1.5, 'super'], [2.5, 'weakest'], [3.5, 'weak'], [4.5, 'strong'], [5.5, 'top']], xlabel: 'category (super = super-weak, top = strongest)', ylabel: 'share of networks (%)', title: '928 real data sets', minWidth: 280, weight: 1 });
        const cache = {};
        const build = () => {
          const key = `${fam.value}|${nS.value}`; if (cache[key]) return cache[key];
          const R = rng32(77), n = nS.value; let deg;
          if (fam.value === 'ba') deg = baMix(n, 3, 0, R).deg;
          else if (fam.value === 'er') deg = degOf(gnpSkip(n, 10 / (n - 1), R));
          else if (fam.value === 'pl') deg = degOf(configModel(degreeSequence('power', n, 2, R), R).g);
          else if (fam.value === 'ln') { const d = new Int32Array(n); let s = 0; for (let i = 0; i < n; i++) { d[i] = Math.max(1, Math.round(Math.exp(1.0 + 1.0 * Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R())))); s += d[i]; } if (s % 2) d[0]++; deg = degOf(configModel(d, R).g); }
          else deg = degOf(lesmis());
          const A = analyseDegrees(v.M, deg);
          return (cache[key] = { deg, A });
        };
        let st = null;
        v.render(() => {
          const { deg, A } = build(); nS.el.hidden = fam.value === 'lm';
          const n = deg.length, c = new Map(); for (const k of deg) if (k > 0) c.set(k, (c.get(k) || 0) + 1);
          const ks = [...c.keys()].sort((a, b) => a - b); let acc = n; const pts = ks.map((k) => { const p = [k, acc / n]; acc -= c.get(k); return p; });
          CS.setView([1, Math.max(20, ks[ks.length - 1] * 1.4)], [Math.min(0.3 / n, 0.01), 1.3]);
          CS.dots(pts, { r: 3.2, color: 'accent' });
          if (A) {
            const { kmin, alpha, alt, tail } = A, m = tail.length, Z = hurwitz(alpha, kmin);
            const tailShare = m / n, kmx = ks[ks.length - 1];
            const survPL = (k) => tailShare * hurwitz(alpha, k) / Z;
            CS.fn((k) => survPL(Math.round(k)), { color: 'green', width: 2.4, domain: [kmin, kmx] });
            const zq = 1 - normCdf((Math.log(kmin - 0.5) - alt.mu) / alt.sigma);
            CS.fn((k) => tailShare * (1 - normCdf((Math.log(k - 0.5) - alt.mu) / alt.sigma)) / zq, { color: 'orange', width: 2.4, domain: [kmin, kmx] });
            CS.vline(kmin, { color: 'muted', width: 1, dash: [4, 4] });
          }
          [49, 46, 29, 19, 10, 4].forEach((s, i) => { BS.rect(i + 0.15, 0, i + 0.85, s, { fill: i === 0 ? 'red' : 'accent', fillAlpha: 0.65, stroke: false }); BS.text(`${s}%`, i + 0.5, s, { dy: -10, size: 11.5, weight: 700, color: 'ink' }); });
          st = { A, n, fam: fam.value };
        });
        v.legend([['accent', 'degree survival function', { dot: true }], ['green', 'power law above $k_{\\min}$'], ['orange', 'lognormal above $k_{\\min}$']]);
        v.readout(() => {
          if (!st) return '';
          const { A, n } = st;
          if (!A) return 'Too few vertices of high degree for a tail fit.';
          const { kmin, alpha, tail, vsLn, vsEx, D } = A;
          const word = (t, nm) => (t.p < 0.1 ? (t.R > 0 ? `power law beats ${nm}` : `${nm} beats the power law`) : `no decision against ${nm}`);
          let verdict;
          if (tail.length < 50) verdict = 'too few points in the tail to say anything';
          else if ((vsLn.p < 0.1 && vsLn.R < 0) || (vsEx.p < 0.1 && vsEx.R < 0)) verdict = '**not scale-free**: a rival family fits the tail significantly better';
          else if (alpha > 2 && alpha < 3) verdict = '**consistent with scale-free**: exponent in (2, 3) and not beaten by the rivals';
          else verdict = '**power law not rejected, but** the exponent is outside (2, 3)';
          return String.raw`$n=${n}$ · tail $k\ge${kmin}$ holds ${tail.length} vertices, $\hat\gamma=${v.fix(alpha, 2)}$, KS distance ${v.fix(D, 3)} · vs lognormal: $z=${v.fix(vsLn.z, 2)}$, $p=${v.fix(vsLn.p, 3)}$ (${word(vsLn, 'the lognormal')}) · vs geometric tail: $z=${v.fix(vsEx.z, 2)}$ (${word(vsEx, 'the exponential')})
Illustrative verdict: ${verdict}`;
        });
      },
    },
  ],
};
