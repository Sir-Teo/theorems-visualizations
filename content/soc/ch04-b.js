import {tailSeedValid,tailModel,SCALE_FREE_CATEGORIES} from './source-audit-tails.js';
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
      num:'4.7',kind:'Definition',name:'Power-law (heavy-tailed) distributions',
      statement:String.raw`A pure continuous Pareto law with lower cutoff $x_{\min}>0$ and density exponent $\alpha>1$ has
$$p(x)=\frac{\alpha-1}{x_{\min}}(x/x_{\min})^{-\alpha}$$
for $x\ge x_{\min}$, with
$$\Pr(X\ge x)=(x/x_{\min})^{1-\alpha}.$$
Its survival curve is straight on logarithmic axes with slope $1-\alpha$. The ratio $\Pr(X\ge cx)/\Pr(X\ge x)=c^{1-\alpha}$ is independent of $x\ge x_{\min}$ for $c\ge1$; the cutoff and a finite median still exist.

For $m\ge0$, the moment is finite exactly when $m<\alpha-1$, then
$$E[X^m]=x_{\min}^m\frac{\alpha-1}{\alpha-1-m}.$$
The mean is finite for $\alpha>2$; the second moment and variance are finite for $\alpha>3$. Infinite variance does **not** prevent the sample mean of iid draws from converging when $2<\alpha\le3$.`,
      idea:String.raw`Normalize by integrating $x^{-\alpha}$ from the positive cutoff to infinity. Integrating the tail gives the survival exponent $\alpha-1$; multiplying the density by $x^m$ gives the moment threshold. Solving the survival equation gives inverse sampling $X=x_{\min}(1-U)^{-1/(\alpha-1)}$ for an ideal uniform $U$.

For iid draws with $\alpha>2$, the finite-mean strong law (prob-2.4.1) gives convergence of the running mean despite infinite variance when $\alpha\le3$. For $1<\alpha\le2$, nonnegative draws have infinite mean and the infinite-mean strong law (prob-2.4.5) gives divergence to infinity almost surely. Neither result supplies a finite-sample convergence certificate from a few plotted traces.`,
      caption:String.raw`Here $x_{\min}=1$. Left: every distinct observed value in one finite sample, with its exact empirical share at or above that value, against the ideal survival curve. Right: every running mean in three deterministic pseudorandom streams, with the ideal finite mean dashed when it exists. Both value axes use logarithmic scales and include every displayed sample/trace value. Vary the exponent continuously; the same uniforms are reused at a fixed size and seed. Resample changes the seed.`,
      scope:String.raw`An explicitly authored finite diagnostic at n=100, 1000 or 10000, using paired 32-bit generator outputs to form 53-bit uniforms and binary64 arithmetic. These finite streams do not have an unbounded continuum of outcomes and are not proofs of iid asymptotic behavior. Real data may have a non-power-law body or an upper cutoff; discrete degrees require a discrete law and normalization. A visually straight finite plot is not a fit verdict. No historical priority, universal empirical exponent range or 80/20 claim is asserted.`,
      deps:['soc-2.3','prob-2.4.1','prob-2.4.5'],see:['soc-4.8','soc-4.11'],refs:['Clauset, Shalizi & Newman, arXiv:0706.1062v2 (2009), §2, Eqs. 2.1–2.7; moment integral derived here'],tags:['power laws','heavy tails'],credit:'Technical definitions: Clauset, Shalizi & Newman, 2009; finite diagnostics authored here.',links:{source:'https://snap.stanford.edu/class/cs224w-readings/clauset09powerlaw.pdf'},verify:true,
      viz(v){
        let seed=17,cache=null,info;v.shareState('Pareto sample seed',{get:()=>seed,validate:tailSeedValid,set:x=>{seed=x;cache=null;}});
        const alpha=v.slider('density exponent alpha',1.3,4.5,2.5,{step:'any',fmt:x=>x.toPrecision(6)}),size=v.select('draws per stream',[100,1000,10000].map(value=>({value,label:String(value)})),1000);v.button('Resample',()=>{seed=(seed+1)>>>0;cache=null;});
        const A=v.stage({x:[.8,100],y:[.0001,1.4],xlog:true,ylog:true,axes:'box',gutter:true,height:340,minWidth:260,xlabel:'sample value x',ylabel:'share at or above x',title:'complete finite empirical survival'}),B=v.stage({x:[.7,14000],y:[.8,10],xlog:true,ylog:true,axes:'box',gutter:true,height:340,minWidth:260,xlabel:'draw count',ylabel:'running mean',title:'complete running-mean traces'});
        v.render(()=>{const key=`${alpha.value}|${size.value}|${seed}`;if(!cache||cache.key!==key)cache={key,data:tailModel(alpha.value,size.value,seed)};const a=cache.data;info=a;A.setView([Math.exp(-.08*Math.max(1,Math.log(a.max))),Math.exp(1.08*Math.max(1,Math.log(a.max)))],[.5/a.n,1.4]);A.fn(x=>x**(1-a.alpha),{color:'ink',width:1.5,dash:[5,4],domain:[1,Math.min(a.max,(a.n/.8)**(1/(a.alpha-1)))]});A.dots(a.survival,{r:1.8,ring:false,color:'accent'});B.setView([.7,a.n*1.4],[Math.exp(-.08*Math.max(1,Math.log(a.meanHigh))),Math.exp(1.08*Math.max(1,Math.log(a.meanHigh)))]);a.traces.forEach((t,j)=>B.path(t,{color:['accent','orange','teal'][j],width:1.5}));if(a.mean!==null)B.line(1,a.mean,a.n,a.mean,{color:'ink',width:1.5,dash:[5,4]});});
        v.legend([['accent','empirical survival / trace 1'],['orange','trace 2'],['teal','trace 3'],['ink','ideal survival / finite mean',{dash:true}]]);
        v.readout(()=>{const a=info,fmt=x=>`$${v.sci(x,5)}$`;return `Seed ${seed}; alpha=${a.alpha.toPrecision(12)}; ${a.n} draws per stream. Ideal mean ${a.mean===null?'infinite':fmt(a.mean)}; ${a.second===null?'no finite second moment':'finite second moment'}. ${a.variance===null?'No finite variance.':`Variance ${fmt(a.variance)}.`} Median ${fmt(a.median)}. Largest value in the survival sample ${fmt(a.max)}. Final finite trace means ${a.traces.map(t=>fmt(t.at(-1)[1])).join(', ')}. ${a.mean===null?'The ideal iid averages diverge to infinity.':'The ideal iid averages converge to the finite mean, including the infinite-variance regime.'} Finite seeded traces do not certify either asymptotic conclusion.`;});
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
      scope: String.raw`Continuous version, with $x_{\min}$ chosen by KS distance over at most 60 candidates and fits by Nelder–Mead for the lognormal. The goodness-of-fit bootstrap of the paper is omitted here (it needs thousands of synthetic data sets); integer data (degrees) need a discrete likelihood, as required for the published network study discussed in 4.11. The data are simulated, not real.`,
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
      num:'4.11',kind:'Hypothesis',name:'Are real networks scale-free? (debated)',
      statement:String.raw`Whether a measured network is “scale free” depends on the distributional claim and the evidence required. A broad or visually straight degree tail does not itself establish a pure power law, and a fitted power law need not be preferred to alternative distributions.

Broido and Clauset's published 2019 study applies a specified fitting, goodness-of-fit and model-comparison procedure to 928 network data sets. Its final analysis contains 3,662 associated simple graphs after its transformations and exclusions. Reported data-set shares are 49% Not Scale Free, 46% Super-Weak, 29% Weakest, 19% Weak, 10% Strong and 4% Strongest.

These categories **overlap**. Weakest, Weak, Strong and Strongest form a nested chain. Super-Weak overlaps that chain and contains Strong and Strongest; it does not contain every Weak or Weakest case. Not Scale Free is the complement of the union of Super-Weak and Weakest. The six percentages are not parts of one partition.`,
      idea:String.raw`The published procedure fits each simple graph's upper degree tail above a selected threshold, tests the power-law goodness of fit, and compares fitted alternatives on that same tail. Results are then aggregated across the simple graphs associated with each original network data set. A favorable comparison with alternatives and an adequate absolute fit answer different questions.

Definitions also differ across the literature. Voitalov and colleagues explicitly allow regularly varying tails that deviate from a pure power law, and use consistent tail-index estimators. That broader asymptotic definition and this corpus's pure-tail testing categories should not be treated as identical questions. The percentages shown here belong to Broido and Clauset's published corpus and evaluation scheme.`,
      caption:String.raw`Select a category to read its published requirements. Gold marks that category; blue also marks categories that its requirements imply. Bars show the six rounded percentages reported for the original data sets, with overlap retained. This widget neither refits a new graph nor runs a goodness-of-fit bootstrap.`,
      scope:String.raw`Published main-paper criteria and corpus summaries are transcribed, without reproducing raw data, graph transformations, fitting code, supplementary robustness analyses or a new statistical verdict. These 928 data sets are not asserted to be a representative probability sample of all possible networks. The earlier arXiv draft has different corpus counts and shares; it is not the source of these published numbers. The alternative regular-variation viewpoint is taken from Voitalov et al.'s actual abstract and definition, without claiming an independent audit of their full estimators or data.`,
      deps:['soc-4.7'],see:['soc-4.8','soc-4.10'],refs:['Broido & Clauset, Nature Communications 10:1017 (2019), Results definitions, Fig. 2 and Fig. 4; Methods preprocessing','Voitalov et al., arXiv:1811.02071v2 (2019), abstract and power-law definition'],tags:['power laws','scale-free','statistics'],credit:'Anna D. Broido & Aaron Clauset, 2019; alternative regular-variation definition: Voitalov, van der Hoorn, van der Hofstad & Krioukov, 2019.',links:{source:'https://doi.org/10.1038/s41467-019-08746-5',published:'https://d-nb.info/1181669375/34',alternative:'https://arxiv.org/abs/1811.02071v2'},verify:true,
      viz(v){
        const category=v.select('evidence category',SCALE_FREE_CATEGORIES.map(x=>({value:x.id,label:x.name})),'strongest');
        const A=v.stage({x:[-42,67],y:[-.65,6.65],axes:false,full:true,height:390,minWidth:240,title:'published percentages of data sets; overlapping categories'});
        v.render(()=>{const selected=SCALE_FREE_CATEGORIES.find(x=>x.id===category.value);A.line(0,-.35,0,5.4,{color:'faint',width:1});A.text('reported share (%)',20,6.05,{align:'center',baseline:'middle',size:11,color:'muted'});SCALE_FREE_CATEGORIES.forEach((x,j)=>{const y=5-j,col=x.id===selected.id?'gold':selected.implies.includes(x.id)?'accent':'muted';A.text(x.name,-2,y,{align:'right',baseline:'middle',size:11,color:col});A.rect(0,y-.23,x.percent,y+.23,{fill:col,fillAlpha:.65,stroke:false});A.text(`${x.percent}%`,x.percent+2,y,{align:'left',baseline:'middle',size:11,color:col,weight:600});});});
        v.legend([['gold','selected category'],['accent','logically implied category'],['muted','other reported category']]);
        v.readout(()=>{const x=SCALE_FREE_CATEGORIES.find(x=>x.id===category.value);return `${x.name}: ${x.percent}% reported. ${x.definition} Implied categories: ${x.implies.map(id=>SCALE_FREE_CATEGORIES.find(y=>y.id===id).name).join(', ')}. Percentages are rounded published shares of overlapping sets; adding them does not count distinct networks. No new fit or hypothesis-test result is computed.`;});
      },
    },

  ],
};
