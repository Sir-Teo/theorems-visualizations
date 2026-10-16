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
      name: 'Preferential attachment (Price, Barabási–Albert)',
      statement: String.raw`**Growth with preferential attachment** builds a network one vertex at a time. Each newcomer brings $m$ links, and each link goes to an existing vertex $i$ with probability proportional to its current degree $k_i$ (the "rich get richer", "cumulative advantage", or "Matthew effect").

The idea has an old pedigree: Yule (1925) for species and genera, Simon (1955) for word frequencies and city sizes, de Solla Price (1965, 1976) for citations to papers, Barabási and Albert (1999) for the Web and other networks. It produces a **heavy-tailed degree distribution** with hubs, and the oldest vertices are the biggest.

Attachment probability must be **linear** in degree for a power law: with probability $\propto k^{\gamma}$ for $\gamma<1$ the tail is a stretched exponential, and for $\gamma>1$ a single hub ends up linked to almost everyone.`,
      idea: String.raw`Two ingredients, both necessary: *growth* (older vertices have had more time to collect links) and *preference* (a vertex with many links is more likely to gain another). Writing $k_i(t)$ for the degree, linear preference gives $\mathrm d k/\mathrm dt=k/2t$ per link, so $k_i(t)\propto (t/t_i)^{1/2}$: degree is a power of age. Nonlinear attachment $\propto k^\gamma$ changes the feedback: if $\gamma<1$ the advantage saturates; if $\gamma>1$ it compounds, and the first vertex to get ahead keeps its lead (a "gel" phase).`,
      caption: String.raw`A model: a tree ($m=1$) grows to 20 000 vertices with attachment $\propto k^{\gamma}$. **Left**: the degree survival function on log–log axes against the linear case $\gamma=1$ (dashed). **Right**: the degrees of the first 40 vertices in order of arrival: with $\gamma=1$ old vertices are big but not enormous; for $\gamma>1$ the very first ones swallow the network. Slide $\gamma$ from 0 to 2.`,
      scope: String.raw`The exponent-3 tail is for the linear model with $m$ links per newcomer and unlimited growth; real citation, web and collaboration networks add ageing, fitness, deletion and other effects (and 4.11 discusses how often the power law is really supported).`,
      deps: ['soc-4.7', 'stoch-12.10'],
      refs: ['E&K §18.3', 'Newman ch. 13'],
      tags: ['preferential attachment', 'growth', 'networks'],
      credit: 'Yule, 1925; Simon, 1955; de Solla Price, 1965 and 1976; Barabási & Albert, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Preferential_attachment' },
      verify: true,
      viz(v) {
        const gS = v.slider('kernel exponent $\\gamma$', 0, 2, 1, { step: 0.05 });
        const n = 20000;
        const DS = v.stage({ x: [1, 2e4], y: [1 / n / 1.5, 1.2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'degree $k$', ylabel: '$P(\\mathrm{degree}\\ge k)$', title: 'survival function of the degree', minWidth: 300, weight: 1.1 });
        const AS = v.stage({ x: [0, 41], y: [0, 100], axes: 'box', gutter: true, height: 340, xlabel: 'order of arrival', ylabel: 'degree', title: 'the first 40 vertices', minWidth: 280, weight: 1 });
        const cache = {};
        const run = (g) => { const key = g.toFixed(2); return (cache[key] ??= nonlinearPA(n, g, rng32(5 + Math.round(g * 20)))); };
        const surv = (deg) => { const c = new Map(); for (const k of deg) c.set(k, (c.get(k) || 0) + 1); const ks = [...c.keys()].sort((a, b) => a - b); let acc = deg.length; return ks.map((k) => { const p = [k, acc / deg.length]; acc -= c.get(k); return p; }); };
        let st = null;
        v.render(() => {
          const g = gS.value, d = run(g), d1 = run(1), S = surv(d), S1 = surv(d1);
          DS.path(S1, { color: 'ink', width: 1.6, dash: [6, 4] });
          DS.dots(S, { r: 3, color: 'accent' });
          DS.fn((k) => 2 / (k * (k + 1)), { color: 'green', width: 1.2, dash: [2, 3], domain: [1, 2e4] });
          let mx = 0, imax = 0; for (let i = 0; i < n; i++) if (d[i] > mx) { mx = d[i]; imax = i; }
          const first = Array.from(d.slice(0, 40));
          AS.setView([0, 41], [0, Math.max(10, ...first) * 1.15]);
          first.forEach((k, i) => AS.rect(i + 0.6, 0, i + 1.4, k, { fill: i === imax ? 'gold' : 'accent', fillAlpha: 0.7, stroke: false }));
          // fitted slope of the tail on log–log axes from the survival function between degree 4 and the 1/200 quantile
          const t = S.filter(([k, p]) => k >= 4 && p * n >= 10); const ls = t.length > 4 ? (() => { const xs = t.map((p) => Math.log(p[0])), ys = t.map((p) => Math.log(p[1])); const m1 = xs.reduce((a, b) => a + b) / xs.length, m2 = ys.reduce((a, b) => a + b) / ys.length; let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - m1) * (ys[i] - m2); sxx += (x - m1) ** 2; }); return sxy / sxx; })() : NaN;
          st = { g, mx, imax, share: mx / (2 * (n - 1)), slope: ls };
        });
        v.legend([['accent', 'chosen kernel', { dot: true }], ['ink', 'linear kernel $\\gamma=1$', { dash: true }], ['green', 'exact linear law, $P(\\ge k)=2/(k(k+1))$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { g, mx, imax, share, slope } = st;
          return String.raw`$\gamma=${v.fix(g, 2)}$ · largest degree **${mx}** held by vertex number ${imax + 1} of ${n.toLocaleString('en-US')} · it touches **${v.fix(100 * share, 1)}%** of all edge ends · tail slope of the survival function (degrees ≥ 4) ${isFinite(slope) ? v.fix(slope, 2) : '—'} (linear model: $-2$, i.e. exponent 3)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Preferential attachment gives degree exponent 3',
      statement: String.raw`In the growth model where each newcomer adds $m$ links and attaches to vertex $i$ with probability proportional to $k_i+a$ (here $a>-m$ is an "initial attractiveness"; $a=0$ is pure degree-proportional attachment), the stationary degree distribution of the rate equation is
$$P(m)=\frac1{1+\beta(m+a)},\qquad P(k)=P(k-1)\,\frac{\beta\,(k-1+a)}{1+\beta\,(k+a)}\quad(k>m),\qquad \beta=\frac{m}{2m+a},$$
whose tail is the power law
$$P(k)\sim k^{-\gamma},\qquad \gamma=3+\frac am .$$
For $a=0$: $P(k)=\dfrac{2m(m+1)}{k(k+1)(k+2)}\sim 2m^2k^{-3}$, **exponent exactly 3, independent of $m$**. Mixing in uniform attachment (probability $p$ for a uniformly random target) is the same as $a=2mp/(1-p)$, giving $\gamma=3+2p/(1-p)$, larger than 3: random attachment thins the hubs.`,
      idea: String.raw`Let $N_k(t)$ be the number of vertices of degree $k$ at time $t$. A degree-$k$ vertex gains a link in one step with probability $m(k+a)/\big((2m+a)t\big)$, since the total weight is $\sum_i(k_i+a)=(2m+a)t$. Balancing the flow into and out of the class $k$ at stationarity, $N_k=t\,P(k)$ gives $P(k)=\beta[(k-1+a)P(k-1)-(k+a)P(k)]$, which is the recursion above (the class $k=m$ is only fed by newcomers). The ratio $P(k)/P(k-1)\approx1-(2+a/m+\dots)/k$ makes $P(k)$ decay like $k^{-(3+a/m)}$. This is the argument that Dorogovtsev–Mendes–Samukhin and Krapivsky–Redner–Leyvraz gave in 2000; Bollobás, Riordan, Spencer and Tusnády proved the exact law rigorously for a precise version of the model.`,
      caption: String.raw`Networks of $10^3$, $10^4$, $10^5$ vertices are grown with the chosen $m$ and a fraction $p$ of uniformly random attachments. Dots: the simulated degree distribution (log-binned). Green curve: the recursion above, with no fitted parameter. Dashed: the asymptotic power law $k^{-\gamma}$. The tail exponent estimate (maximum likelihood on the discrete tail) tends to the prediction as the network grows; raise $p$ and the tail steepens.`,
      scope: String.raw`Rate-equation (mean-field) result for the model with *independent* choices of the $m$ targets; the simulation chooses $m$ distinct targets, a small difference for $m\ge2$. The exponent 3 is a property of this model; real networks measured with exponents between 2 and 3 need extra mechanisms.`,
      deps: ['soc-4.9'],
      refs: ['E&K §18.7', 'Newman ch. 13'],
      tags: ['preferential attachment', 'power laws', 'rate equation'],
      credit: 'Barabási & Albert, 1999 (simulation, continuum argument); Dorogovtsev–Mendes–Samukhin and Krapivsky–Redner–Leyvraz, 2000 (rate equation); Bollobás et al., 2001 (proof)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model' },
      verify: true,
      viz(v) {
        const mS = v.slider('links per newcomer $m$', 1, 6, 3, { int: true, step: 1 });
        const pS = v.slider('share of random attachments $p$', 0, 0.8, 0, { step: 0.05 });
        const nS = v.select('network size', [{ value: 3, label: '$10^3$' }, { value: 4, label: '$10^4$' }, { value: 5, label: '$10^5$' }], 5);
        const DS = v.stage({ x: [1, 2000], y: [1e-9, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'degree $k$', ylabel: '$P(k)$', title: 'degree distribution', minWidth: 320, weight: 1.4 });
        const cache = {};
        const grow = (m, p, e) => { const key = `${m}|${p.toFixed(2)}|${e}`; return (cache[key] ??= baMix(Math.pow(10, e), m, p, rng32(m * 100 + e * 7 + Math.round(p * 100))).deg); };
        let st = null;
        v.render(() => {
          const m = mS.value, p = pS.value, e = +nS.value, deg = grow(m, p, e), a = p >= 1 ? 1e9 : 2 * m * p / (1 - p), gam = 3 + a / m, N = deg.length;
          const kmaxR = 2000, P = rateEq(m, a, kmaxR);
          DS.fn((k) => Math.pow(k, -gam) * (P[Math.min(kmaxR, Math.max(m, Math.round(300)))] * Math.pow(300, gam)), { color: 'ink', width: 1.4, dash: [6, 4], domain: [Math.max(m, 5), kmaxR] });
          DS.path(Array.from({ length: kmaxR - m + 1 }, (_, i) => [m + i, P[m + i]]), { color: 'green', width: 2.2 });
          const pts = logBin(deg, m, 1.35); DS.dots(pts, { r: 4, color: 'accent' });
          const kmin = Math.max(10, Math.round(4 * (m + a))), fit = hillDisc(deg, kmin);
          const kmax = Math.max(...deg);
          st = { m, p, a, gam, fit, kmin, N, kmax };
        });
        v.legend([['accent', 'simulation (log-binned)', { dot: true }], ['green', 'rate equation, no free parameter'], ['ink', '$k^{-\\gamma}$ asymptote', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, p, a, gam, fit, kmin, N, kmax } = st;
          return String.raw`$m=${m}$, $p=${v.fix(p, 2)}$ → $a=\frac{2mp}{1-p}=${v.fix(a, 2)}$, predicted exponent $\gamma=3+a/m=$ **${v.fix(gam, 2)}** · maximum-likelihood tail estimate for $k\ge${kmin}$ (${fit.n} vertices): **${v.fix(fit.gamma, 2)}** · $N=${N.toLocaleString('en-US')}$ vertices, largest degree ${kmax} (theory: about $m\sqrt N=${Math.round(m * Math.sqrt(N))}$ for $p=0$)`;
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
