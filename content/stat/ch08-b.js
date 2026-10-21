// Statistical Inference — Chapter 8 (part b): items 8.9–8.15 — likelihood-ratio intervals, the fragile variance interval,
// simultaneous bands, prediction intervals, relevant subsets, Fieller's ratio problem, and Neyman's 1937 paper. Same visual
// language as part a: exact computations beside simulated samples in gold; covering intervals green, misses red.
import {
  clamp, commas, pct, hashStr, memo, mean, legender, titler, mulberry, Phi, qnorm, Q, qt, tUp, dt, tag, mcse, pfmt,
  binned, area, dbinom, qchi, chiUp, dchi, chiCdf,
  CC, zOf, qbeta, waldBin, wilsonBin, cpBin, binIntervals, binCover, meanSd, tCrit, POP8,
} from './ch08.shared.js';

import { rangeSubsetCoverage, binomialBelt, normalBelt } from './inference-sources.audit.js';

function bar(s, lo, hi, y, truth, o = {}) {
  const ok = lo <= truth && truth <= hi;
  s.line(lo, y, hi, y, { color: ok ? CC.cover : CC.miss, width: o.width ?? (ok ? 2 : 2.6), alpha: o.alpha ?? (ok ? 0.85 : 1) });
  if (o.mid !== undefined) s.dot(o.mid, y, { r: 2.2, color: ok ? CC.cover : CC.miss });
  return ok;
}
const logit = (p) => Math.log(p / (1 - p));
const expit = (t) => 1 / (1 + Math.exp(-t));

export default {
  collection: 'stat',
  chapter: 8,
  items: [
    // ───────────────────────────────────────────────────────────── 8.9
    {
      num: '8.9',
      kind: 'Method',
      name: 'Likelihood-ratio intervals',
      credit: 'S. S. Wilks, 1938 (the limit law that calibrates the cut)',
      statement: String.raw`Let $\ell(\theta)$ be the log-likelihood and $\hat\theta$ its maximiser. The **likelihood-ratio (profile-likelihood) interval** is
$$\Big\{\theta:\ 2\big[\ell(\hat\theta)-\ell(\theta)\big]\le\chi^2_{1,\,1-\alpha}\Big\}=\Big\{\theta:\ \ell(\theta)\ge\ell(\hat\theta)-\tfrac12\chi^2_{1,1-\alpha}\Big\},$$
the set of parameter values that the likelihood-ratio test of $H_0:\theta=\theta_0$ does not reject. By Wilks' theorem (stat-6.10) its coverage tends to $1-\alpha$ as $n\to\infty$. It is generally asymmetric, it never leaves the parameter space, and it is **invariant under reparametrisation**: the interval for $g(\theta)$ ($g$ monotone) is the image of the interval for $\theta$. The Wald interval is not: the Wald interval for $\theta$ and the transformed Wald interval for $\log\theta$ or $\mathrm{logit}\,\theta$ disagree.`,
      idea: String.raw`Inverting the likelihood-ratio test (8.4) cuts the log-likelihood curve with a horizontal line $\tfrac12\chi^2_{1,1-\alpha}\approx1.92$ below its peak. The test statistic $2[\ell(\hat\theta)-\ell(\theta_0)]$ is a function of the likelihood value only, and the likelihood of a function of $\theta$ is the same function re-labelled, so the cut selects the same points however they are named. The Wald interval uses only the curvature at the peak, so its answer depends on which scale the parabola is fitted on; it agrees with the likelihood-ratio interval when the log-likelihood really is quadratic in the chosen parameter.`,
      caption: String.raw`Binomial likelihood with $x$ successes in $n$ trials. Left: the log-likelihood as a function of $p$ (blue) with the cut $1.92$ below the peak: the green bar is the likelihood-ratio interval. The orange dashed parabola is the Wald approximation on the $p$ scale. Right: the same likelihood against $\psi=\mathrm{logit}\,p$, which is nearly a parabola: the likelihood-ratio interval (green) is the same set, now measured on the $\psi$ axis, while the Wald interval for $\psi$ (purple), mapped back to $p$, is a different interval from the Wald interval for $p$ (orange). Try $x=1$ or $x=n-1$.`,
      deps: ['stat-8.4', 'stat-6.10'],
      refs: ['Casella–Berger §10.4'],
      tags: ['likelihood ratio', 'profile likelihood', 'invariance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_function#Likelihood_ratio_and_relative_likelihood' },
      viz(v) {
        const nS = v.slider('sample size $n$', 4, 100, 15, { int: true, log: true });
        const xS = v.slider('successes $x$ (1 … $n-1$)', 1, 99, 3, { int: true });
        const sL = v.stage({ x: [0, 1], y: [-5, 0.4], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'proportion $p$', ylabel: 'log-likelihood $-$ max', title: 'on the $p$ scale' });
        const sR = v.stage({ x: [-6, 4], y: [-5, 0.4], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: '$\\psi=\\mathrm{logit}\\,p$', ylabel: 'log-likelihood $-$ max', title: 'on the logit scale' });
        const leg = legender(v);
        const cut = 0.5 * 3.841459;
        const z = 1.959964;
        let st = null;
        v.render(() => {
          const n = nS.value, x = clamp(xS.value, 1, n - 1), ph = x / n, psh = logit(ph);
          const L = (p) => (p <= 0 || p >= 1 ? -Infinity : x * Math.log(p) + (n - x) * Math.log(1 - p)), Lm = L(ph), rel = (p) => L(p) - Lm;
          const root = (a) => { let lo = a, hi = ph; if (a > ph) { lo = ph; hi = a; } for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); const inside = rel(m) > -cut; if (a < ph) { if (inside) hi = m; else lo = m; } else { if (inside) lo = m; else hi = m; } } return 0.5 * (lo + hi); };
          const lr = [root(1e-12), root(1 - 1e-12)];
          const wp = waldBin(x, n, z), sePs = 1 / Math.sqrt(n * ph * (1 - ph)), wl = [expit(psh - z * sePs), expit(psh + z * sePs)];
          // left
          sL.fn(rel, { domain: [0.003, 0.997], color: CC.wilson, width: 2.4, n: 400 });
          sL.fn((p) => -0.5 * ((p - ph) / Math.sqrt((ph * (1 - ph)) / n)) ** 2, { domain: [0, 1], color: CC.wald, width: 1.8, dash: [5, 4], n: 200 });
          sL.hline(-cut, { color: 'muted', width: 1.2, dash: [3, 4] });
          sL.line(lr[0], -4.7, lr[1], -4.7, { color: CC.cover, width: 6 });
          sL.line(Math.max(0, wp[0]), -4.3, Math.min(1, wp[1]), -4.3, { color: CC.wald, width: 5 });
          sL.line(wl[0], -3.9, wl[1], -3.9, { color: CC.exact, width: 5 });
          sL.dot(ph, 0, { r: 4.5, color: CC.sim });
          // right
          const relPsi = (t) => rel(expit(t));
          sR.fn(relPsi, { domain: [-6, 4], color: CC.wilson, width: 2.4, n: 400 });
          sR.fn((t) => -0.5 * ((t - psh) * sePsInv(n, ph)) ** 2, { domain: [-6, 4], color: CC.exact, width: 1.8, dash: [5, 4], n: 200 });
          sR.hline(-cut, { color: 'muted', width: 1.2, dash: [3, 4] });
          sR.line(logit(lr[0]), -4.7, logit(lr[1]), -4.7, { color: CC.cover, width: 6 });
          sR.line(psh - z * sePs, -3.9, psh + z * sePs, -3.9, { color: CC.exact, width: 5 });
          sR.line(logit(Math.max(1e-6, wp[0])), -4.3, logit(Math.min(1 - 1e-6, wp[1])), -4.3, { color: CC.wald, width: 5 });
          sR.dot(psh, 0, { r: 4.5, color: CC.sim });
          leg([[CC.wilson, 'log-likelihood'], [CC.cover, 'likelihood-ratio interval'], [CC.wald, 'Wald for $p$', { dash: true }], [CC.exact, 'Wald for logit $p$', { dash: true }], ['muted', 'cut $\\tfrac12\\chi^2_{1,0.95}$', { dash: true }]]);
          st = { n, x, lr, wp, wl, ph };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, x, lr, wp, wl } = st, f = (a) => `[${v.fix(a[0], 3)}, ${v.fix(a[1], 3)}]`;
          return `$x=${x}$, $n=${n}$ (cut = ${v.fix(0.5 * 3.841459, 3)} below the peak). On the $p$ scale: likelihood-ratio **${f(lr)}** · Wald for $p$ ${f(wp)} · Wald for logit $p$ mapped back ${f(wl)}.\nOn the logit scale the likelihood-ratio interval is [${v.fix(logit(lr[0]), 3)}, ${v.fix(logit(lr[1]), 3)}] $=\\mathrm{logit}$ of its $p$-endpoints exactly (invariance), but the Wald intervals on the two scales differ.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.10
    {
      num: '8.10',
      kind: 'Phenomenon',
      name: 'Non-robustness of the normal-theory variance interval',
      credit: 'G. E. P. Box, 1953 (sensitivity of variance tests to non-normality)',
      statement: String.raw`For a normal sample the pivot $(n-1)S^2/\sigma^2\sim\chi^2_{n-1}$ (8.2) gives the exact $1-\alpha$ interval
$$\Big[\frac{(n-1)S^2}{\chi^2_{n-1,\,1-\alpha/2}},\ \frac{(n-1)S^2}{\chi^2_{n-1,\,\alpha/2}}\Big]$$
for $\sigma^2$. If the data are i.i.d. with mean $\mu$, variance $\sigma^2$ and kurtosis $\kappa=E(X-\mu)^4/\sigma^4<\infty$ but **not normal**, then $\sqrt n\,(S^2-\sigma^2)/\sigma^2\Rightarrow N(0,\kappa-1)$, whereas the interval is built as if the limit variance were $2$. Its coverage therefore tends not to $1-\alpha$ but to
$$2\Phi\!\Big(z_{1-\alpha/2}\sqrt{\tfrac{2}{\kappa-1}}\Big)-1,$$
which is $0.95$ only for $\kappa=3$. For $t_5$ data ($\kappa=9$) the limit is $0.67$ at nominal $95\%$, for the Laplace law ($\kappa=6$) $0.80$, for the uniform ($\kappa=1.8$) it is $0.998$. Increasing $n$ does not repair the interval.`,
      idea: String.raw`The $\chi^2$ pivot rests on a fact special to the normal law: $S^2$ has variance $2\sigma^4/(n-1)$ exactly because the fourth moment is $3\sigma^4$ (stat-1.9, stat-1.8). In general $\mathrm{Var}(S^2)\approx\sigma^4(\kappa-1)/n$, so heavy tails inflate the true spread of $S^2$ relative to what the $\chi^2$ quantiles assume, and the interval is too short; light tails do the opposite. Unlike the $t$-interval for a mean, which is protected by the central limit theorem, the variance interval's validity depends on a feature (the kurtosis) that no amount of data washes out.`,
      caption: String.raw`Choose the population (unit variance, so the target is $\sigma^2=1$). Left: simulated coverage of the nominal 95% $\chi^2$ interval against $n$ (gold, 1,500 samples per point) and the limiting value from the kurtosis formula (dashed): the coverage drifts toward it (slowly when the tails are heavy) instead of rising to 95%. Right: the histogram of the pivot $(n-1)S^2/\sigma^2$ at the chosen $n$ against its $\chi^2_{n-1}$ density; the cut points $\chi^2_{n-1,0.025}$ and $\chi^2_{n-1,0.975}$ trap 95% only if the histogram matches the curve. Normal: it does. $t_5$: it is far wider.`,
      deps: ['stat-8.2', 'stat-1.9'],
      refs: ['Casella–Berger §9.2'],
      tags: ['variance interval', 'robustness', 'kurtosis'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Variance#Distribution_of_the_sample_variance' },
      viz(v) {
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'unif', label: 'uniform' }, { value: 'laplace', label: 'Laplace' }, { value: 't5', label: '$t_5$' }], 'normal');
        const nS = v.slider('sample size $n$', 5, 1000, 30, { int: true, log: true });
        const sL = v.stage({ x: [5, 1000], y: [0.5, 1], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'sample size $n$', ylabel: 'coverage of nominal 95%', title: 'coverage does not converge to 95%' });
        const sR = v.stage({ x: [0, 100], y: [0, 0.1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: '$(n-1)S^2/\\sigma^2$', ylabel: 'density', title: 'the pivot at this $n$' });
        const leg = legender(v);
        const NG = [5, 10, 20, 40, 80, 150, 300, 600, 1000], NR = 1500, z = 1.959964;
        const mc = memo(), mc2 = memo();
        const piv = (r, P, n) => { let s = 0, q = 0; const x = new Float64Array(n); for (let i = 0; i < n; i++) { x[i] = P.draw(r); s += x[i]; } const m = s / n; for (let i = 0; i < n; i++) q += (x[i] - m) ** 2; return q; };
        const grid = (pop) => mc(pop, () => NG.map((n) => { const r = v.rng(hashStr(`8.10|${pop}|${n}`)), P = POP8[pop], lo = qchi(n - 1, 0.025), hi = qchi(n - 1, 0.975); let c = 0; for (let t = 0; t < NR; t++) { const q = piv(r, P, n); if (q >= lo && q <= hi) c++; } return [n, c / NR]; }));
        const sample = (pop, n) => mc2(pop + '|' + n, () => { const r = v.rng(hashStr(`8.10s|${pop}|${n}`)), P = POP8[pop], a = []; for (let t = 0; t < NR; t++) a.push(piv(r, P, n)); return a; });
        let st = null;
        v.render(() => {
          const pop = popS.value, n = nS.value, P = POP8[pop], G = grid(pop), lim = 2 * Phi(z * Math.sqrt(2 / (P.kurt - 1))) - 1, df = n - 1;
          sL.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.hline(lim, { color: CC.wald, width: 1.6, dash: [4, 4] });
          sL.path(G, { color: CC.sim, width: 1.4, alpha: 0.7 }); sL.dots(G, { r: 4.5, color: CC.sim });
          sL.vline(n, { color: 'faint', width: 1.4 });
          const lo = qchi(df, 0.025), hi = qchi(df, 0.975), T = sample(pop, n);
          const sd = Math.sqrt(2 * df), wd = 5 * sd * Math.max(1, Math.sqrt((P.kurt - 1) / 2)), xmax = Math.max(hi * 1.5, df + wd), xl = Math.max(0, df - wd);
          const B = binned(T, xl, xmax, 70), f0 = dchi(df, Math.max(df - 1, 0.1));
          sR.setView([xl, xmax], [0, Math.min(Math.max(B.max, f0) * 1.2, 0.6)]);
          area(sR, (x) => dchi(df, x), xl, lo, 'red', 0.3); area(sR, (x) => dchi(df, x), hi, xmax, 'red', 0.3);
          sR.hist(B, { density: true, color: CC.sim, fillAlpha: 0.3, width: 1.2 });
          sR.fn((x) => dchi(df, x), { domain: [Math.max(0.01, xl), xmax], color: 'ink', width: 2.4, n: 400 });
          sR.vline(lo, { color: 'red', width: 1.3, dash: [5, 4] }); sR.vline(hi, { color: 'red', width: 1.3, dash: [5, 4] });
          leg([[CC.sim, 'simulated coverage / pivot', { dot: true }], [CC.wald, 'limiting coverage $2\\Phi(z\\sqrt{2/(\\kappa-1)})-1$', { dash: true }], ['muted', 'nominal', { dash: true }], ['ink', '$\\chi^2_{n-1}$ density'], ['red', 'cut tails', { area: true }]]);
          const cov = T.filter((q) => q >= lo && q <= hi).length / T.length;
          st = { pop, n, lim, kurt: P.kurt, cov, last: G[G.length - 1][1] };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, lim, kurt, cov, last } = st;
          return `Kurtosis $\\kappa=${v.fix(kurt, 1)}$: limiting coverage $2\\Phi(1.96\\sqrt{2/(\\kappa-1)})-1=$ **${v.fix(lim, 3)}**. At $n=${n}$ the simulated coverage is ${v.fix(cov, 3)} (± ${v.fix(2 * mcse(Math.min(cov, 0.95), 1500), 3)}); at $n=1000$ it is ${v.fix(last, 3)}.\nNormal data give 0.95 at every $n$; any other shape keeps its own plateau.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.11
    {
      num: '8.11',
      kind: 'Method',
      name: 'Simultaneous confidence bands',
      credit: 'A. Dvoretzky, J. Kiefer & J. Wolfowitz, 1956; P. Massart, 1990 (constant)',
      statement: String.raw`A **$1-\alpha$ confidence band** for a function $F$ is a pair of random functions $\ell\le u$ with $P\big(\ell(x)\le F(x)\le u(x)\ \text{for all }x\big)\ge1-\alpha$: the coverage is **simultaneous**, over the whole curve at once. Intervals that are $1-\alpha$ at each fixed $x$ (**pointwise**) do not give this: the probability that all of them cover decreases with the number of points examined. For the distribution function, the DKW inequality (stat-1.6), $P\big(\sup_x|\hat F_n(x)-F(x)|>\varepsilon\big)\le2e^{-2n\varepsilon^2}$, gives the band
$$\hat F_n(x)\pm\varepsilon_n,\qquad \varepsilon_n=\sqrt{\tfrac1{2n}\ln\tfrac2\alpha},$$
of constant width, valid for every continuous $F$ and every $n$. The guarantee holds for every $n$ (with Massart's sharp constant $2$ in front of the exponential), and at conventional levels the band is nearly exact.`,
      idea: String.raw`A pointwise interval is a statement about one value $x$; a band is a statement about the entire graph, and the sup-norm distance $D_n=\sup_x|\hat F_n(x)-F(x)|$ is the single random variable that controls it. Bounding the tail of $D_n$ (stat-1.6, via the Kolmogorov–Smirnov argument and Massart's tight constant) gives a band with a guaranteed level. Pointwise intervals each fail with probability about $\alpha$, but different intervals fail on different samples, so with hundreds of effectively independent places to look the chance that all are right is small.`,
      caption: String.raw`Left: one sample of $n$ standard normal observations, its empirical distribution function (blue steps), the true $\Phi$ (black), the DKW band (green) and pointwise 95% Wilson intervals (orange). Right: the share of 1,000 repeated samples in which each kind of band fails to contain $\Phi$ *somewhere* on a 400-point grid, against the allowed $\alpha$. Pointwise intervals cover each $x$ about 95% of the time yet the whole curve in only a fraction of the samples; the DKW band keeps its promise. Press **New samples** to redraw.`,
      deps: ['stat-1.6', 'stat-8.1'],
      refs: ['Wasserman §7.1'],
      tags: ['confidence band', 'DKW inequality', 'empirical distribution'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dvoretzky%E2%80%93Kiefer%E2%80%93Wolfowitz_inequality' },
      viz(v) {
        const nS = v.slider('sample size $n$', 10, 500, 50, { int: true, log: true });
        const lvS = v.select('level', [{ value: '0.9', label: '90%' }, { value: '0.95', label: '95%' }, { value: '0.99', label: '99%' }], '0.95');
        const sL = v.stage({ x: [-3.2, 3.2], y: [-0.02, 1.02], axes: 'box', gutter: true, height: 360, weight: 1.2, xlabel: '$x$', ylabel: 'distribution function', title: 'one sample: band and pointwise intervals' });
        const sR = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 0.8, minWidth: 250, ylabel: 'share of samples that fail', title: '1,000 repeated samples', xticks: [[1, 'pointwise'], [2, 'DKW band']] });
        const leg = legender(v);
        let seed = 0;
        v.button('New samples', () => { seed++; });
        const mc = memo(), mc2 = memo();
        const NGRID = 400;
        const sims = (n, lv, sd) => mc2(`${n}|${lv}|${sd}`, () => {
          const r = v.rng(hashStr(`8.11|${n}|${lv}|${sd}`)), z = zOf(lv), eps = Math.sqrt(Math.log(2 / (1 - lv)) / (2 * n));
          let pw = 0, dk = 0; const U = new Float64Array(n);
          for (let t = 0; t < 1000; t++) {
            for (let i = 0; i < n; i++) U[i] = r(); U.sort();
            let D = 0; for (let i = 0; i < n; i++) D = Math.max(D, (i + 1) / n - U[i], U[i] - i / n);
            if (D > eps) dk++;
            let j = 0, miss = false;
            for (let g = 1; g < NGRID && !miss; g++) { const u = g / NGRID; while (j < n && U[j] <= u) j++; const [lo, hi] = wilsonBin(j, n, z); if (u < lo || u > hi) miss = true; }
            if (miss) pw++;
          }
          return { pw: pw / 1000, dk: dk / 1000, eps };
        });
        const sample = (n, sd) => mc(`${n}|${sd}`, () => { const r = v.rng(hashStr(`8.11s|${n}|${sd}`)), a = []; for (let i = 0; i < n; i++) a.push(r.normal()); return a.sort((x, y) => x - y); });
        let st = null;
        v.render(() => {
          const n = nS.value, lv = +lvS.value, a = 1 - lv, z = zOf(lv), X = sample(n, seed), S = sims(n, lv, seed), eps = S.eps;
          // ECDF steps
          const steps = []; steps.push([-3.2, 0]); for (let i = 0; i < n; i++) { const F0 = i / n, F1 = (i + 1) / n; steps.push([X[i], F0], [X[i], F1]); } steps.push([3.2, 1]);
          const Fh = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (X[m] <= x) lo = m + 1; else hi = m; } return lo / n; };
          const xs = []; for (let i = 0; i <= 160; i++) xs.push(-3.2 + (6.4 * i) / 160);
          const up = xs.map((x) => [x, Math.min(1, Fh(x) + eps)]), dn = xs.map((x) => [x, Math.max(0, Fh(x) - eps)]);
          sL.poly([...up, ...dn.slice().reverse()], { fill: CC.cover, fillAlpha: 0.18, stroke: false });
          sL.path(up, { color: CC.cover, width: 1.6 }); sL.path(dn, { color: CC.cover, width: 1.6 });
          const pu = xs.map((x) => [x, wilsonBin(Fh(x) * n, n, z)[1]]), pl = xs.map((x) => [x, wilsonBin(Fh(x) * n, n, z)[0]]);
          sL.path(pu, { color: CC.wald, width: 1.4, dash: [4, 3] }); sL.path(pl, { color: CC.wald, width: 1.4, dash: [4, 3] });
          sL.fn((x) => Phi(x), { domain: [-3.2, 3.2], color: 'ink', width: 2.2, n: 200 });
          sL.path(steps, { color: CC.wilson, width: 1.6 });
          // right bars
          sR.hline(a, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.text(`allowed α = ${v.fix(a, 2)}`, 0.05, a, { color: 'muted', size: 11, align: 'left', dy: -9 });
          sR.rect(0.6, 0, 1.4, S.pw, { fill: CC.wald, fillAlpha: 0.5, color: CC.wald, width: 1.4 });
          sR.rect(1.6, 0, 2.4, S.dk, { fill: CC.cover, fillAlpha: 0.5, color: CC.cover, width: 1.4 });
          sR.text(pct(S.pw, 0), 1, S.pw, { color: 'ink', size: 13, weight: 700, dy: -10 }); sR.text(pct(S.dk, 1), 2, S.dk, { color: 'ink', size: 13, weight: 700, dy: -10 });
          leg([[CC.cover, 'DKW band $\\hat F_n\\pm\\varepsilon_n$'], [CC.wald, 'pointwise Wilson intervals', { dash: true }], [CC.wilson, 'empirical d.f.'], ['ink', 'true $\\Phi$']]);
          st = { n, lv, eps, S };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, lv, eps, S } = st;
          return `$n=${n}$, $\\varepsilon_n=\\sqrt{\\ln(2/\\alpha)/(2n)}=${v.fix(eps, 3)}$. Over 1,000 samples, the pointwise ${pct(lv, 0)} intervals miss $\\Phi$ somewhere in **${pct(S.pw, 0)}** of them (each one is right at ${pct(lv, 0)} of the points); the DKW band fails in **${pct(S.dk, 1)}** (allowed at most ${pct(1 - lv, 0)}; the inequality is nearly tight at these levels).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.12
    {
      num: '8.12',
      kind: 'Concept',
      name: 'Prediction intervals',
      statement: String.raw`A **$1-\alpha$ prediction interval** for a future observation $X_{n+1}$, based on $X_1,\dots,X_n$, is a random interval $P(X_1,\dots,X_n)$ with $P\big(X_{n+1}\in P(X_1,\dots,X_n)\big)\ge1-\alpha$, the probability taken over both the sample and the new observation. For i.i.d. $N(\mu,\sigma^2)$ data, $X_{n+1}-\bar X\sim N\big(0,\sigma^2(1+\tfrac1n)\big)$ is independent of $S$, so
$$\bar X\pm t_{n-1,1-\alpha/2}\,S\sqrt{1+\tfrac1n}$$
is an exact prediction interval, compared with the confidence interval $\bar X\pm t_{n-1,1-\alpha/2}S/\sqrt n$ for the mean $\mu$. As $n\to\infty$ the confidence interval shrinks to a point but the prediction interval tends to $\mu\pm z_{1-\alpha/2}\sigma$: estimating the mean precisely does not remove the randomness of a single new value. The confidence interval for the mean is robust to non-normality for large $n$; the prediction interval inherits the shape of the population and is not.`,
      idea: String.raw`The error of prediction has two independent parts: the uncertainty in the estimate ($\bar X-\mu$, variance $\sigma^2/n$, shrinking) and the noise in the new observation ($X_{n+1}-\mu$, variance $\sigma^2$, fixed). Their sum has variance $\sigma^2(1+1/n)$ and, with $\sigma$ estimated by $S$, the ratio is a pivot with a $t_{n-1}$ law (8.2, 8.3). The central limit theorem acts on $\bar X$ but not on the single new draw, so the normal-theory prediction interval has coverage that depends on the true shape.`,
      caption: String.raw`Left: one sample (dots on the line), the confidence interval for $\mu$ (blue bar, short) and the prediction interval for the next observation (teal bar, long), the true mean (dark line), and 20 fresh observations (gold ticks); about 95% of them land in the teal bar. Right: the expected widths against $n$ for unit variance: the blue width falls like $1/\sqrt n$, the teal one levels off at $2\times1.96$. Pick a non-normal population and read the simulated coverage of both intervals in the readout.`,
      deps: ['stat-8.3'],
      refs: ['Casella–Berger §11.3'],
      tags: ['prediction interval', 'confidence interval', 'forecasting'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prediction_interval' },
      viz(v) {
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'unif', label: 'uniform' }, { value: 'expo', label: 'exponential' }], 'normal');
        const nS = v.slider('sample size $n$', 3, 400, 10, { int: true, log: true });
        let seed = 0;
        v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [-4, 6], y: [0, 4], axes: false, height: 300, weight: 1.15, title: 'one sample, its two intervals, and 20 new observations' });
        const sR = v.stage({ x: [3, 400], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 300, weight: 0.85, minWidth: 260, xlabel: 'sample size $n$', ylabel: 'interval width ($\\sigma=1$)', title: 'widths versus $n$' });
        const leg = legender(v);
        const mc = memo();
        const cover = (pop, n) => mc(pop + '|' + n, () => {
          const r = v.rng(hashStr(`8.12c|${pop}|${n}`)), P = POP8[pop], tc = tCrit(n - 1, 0.95), xs = new Float64Array(n); let ci = 0, pi = 0; const R = 6000;
          for (let t = 0; t < R; t++) { for (let i = 0; i < n; i++) xs[i] = P.draw(r); const [m, s] = meanSd(xs), xn = P.draw(r); if (Math.abs(m) <= (tc * s) / Math.sqrt(n)) ci++; if (Math.abs(xn - m) <= tc * s * Math.sqrt(1 + 1 / n)) pi++; }
          return { ci: ci / R, pi: pi / R };
        });
        let st = null;
        v.render(() => {
          const pop = popS.value, n = nS.value, P = POP8[pop], tc = tCrit(n - 1, 0.95), r = v.rng(hashStr(`8.12|${pop}|${n}|${seed}`));
          const xs = Array.from({ length: n }, () => P.draw(r)), [m, s] = meanSd(xs), hc = (tc * s) / Math.sqrt(n), hp = tc * s * Math.sqrt(1 + 1 / n);
          sL.vline(0, { color: CC.truth, width: 1.6 });
          sL.dots(xs.slice(0, 200).map((x, i) => [x, 0.25 + 0.5 * ((i * 0.6180339887) % 1)]), { r: 2.6, color: 'muted', alpha: 0.7 });
          sL.line(m - hp, 2.4, m + hp, 2.4, { color: CC.pi, width: 8 }); sL.line(m - hc, 1.5, m + hc, 1.5, { color: CC.ci, width: 8 });
          sL.tex('\\text{prediction interval}', m + hp + 0.25, 2.4, { color: 'ink', size: 12, align: 'left' });
          sL.tex('\\text{confidence interval for }\\mu', m + hc + 0.25, 1.5, { color: 'ink', size: 12, align: 'left' });
          let inN = 0; const fresh = []; for (let k = 0; k < 20; k++) { const x = P.draw(r); fresh.push(x); if (Math.abs(x - m) <= hp) inN++; }
          fresh.forEach((x) => sL.line(x, 3.2, x, 3.75, { color: Math.abs(x - m) <= hp ? CC.sim : CC.miss, width: 2.4 }));
          sL.text('20 new observations', -3.9, 3.45, { color: 'muted', size: 11, align: 'left' });
          const wc = [], wp = []; for (let k = 0; k <= 60; k++) { const nn = 3 * (400 / 3) ** (k / 60), t = qt(0.975, Math.max(1, nn - 1)); wc.push([nn, (2 * t) / Math.sqrt(nn)]); wp.push([nn, 2 * t * Math.sqrt(1 + 1 / nn)]); }
          sR.hline(2 * 1.96, { color: 'muted', width: 1.2, dash: [4, 4] });
          sR.path(wc, { color: CC.ci, width: 2.4 }); sR.path(wp, { color: CC.pi, width: 2.4 });
          sR.vline(n, { color: 'faint', width: 1.4 });
          leg([[CC.pi, 'prediction interval'], [CC.ci, 'confidence interval for $\\mu$'], [CC.sim, 'new observation inside', { dot: true }], [CC.miss, 'outside', { dot: true }]]);
          st = { n, inN, cov: cover(pop, n), tc };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, inN, cov } = st;
          return `$n=${n}$: this sample's prediction interval holds ${inN} of the 20 new observations. Simulated coverage over 6,000 samples (the new observation is also random): prediction interval **${v.fix(cov.pi, 3)}**, confidence interval for $\\mu$ **${v.fix(cov.ci, 3)}** (nominal 0.95 both).\nThe interval for $\\mu$ keeps its level for large $n$ whatever the population; the prediction interval does not.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.13
    {
      num: '8.13',
      kind: 'Paradox',
      name: 'Relevant subsets: intervals known to be right',
      credit: 'Relevant-subset criterion: R. J. Buehler, 1959; uniform illustration derived here',
      statement: String.raw`Let $X_1,X_2$ be i.i.d. $\mathrm{Uniform}(\theta-\tfrac12,\theta+\tfrac12)$ and $C=[\min X_i,\max X_i]$. Then $P_\theta(\theta\in C)=\tfrac12$ for every $\theta$, so $C$ is a 50% confidence interval. But the sample range $D=\max X_i-\min X_i$ is ancillary (its law does not involve $\theta$, stat-2.12), and conditionally on $D$ the coverage is
$$P_\theta(\theta\in C\mid D)=\begin{cases}D/(1-D)&D<\tfrac12,\\ 1&D\ge\tfrac12.\end{cases}$$
A pair of draws more than $\tfrac12$ apart *certainly* brackets $\theta$, while two draws very close together bracket it with probability near $0$. The **relevant subset** $\{D\ge\tfrac12\}$ (probability $\tfrac14$) has conditional coverage $1$, far from the nominal $\tfrac12$. The unconditional 50% coefficient alone does not report these conditional coverages.`,
      idea: String.raw`For the range $D=d$, the sample midpoint is uniform on an interval of length $1-d$ centred at $\theta$. The event that the two observations bracket $\theta$ restricts it to length $d$, capped at $1-d$, giving the displayed conditional coverage. The range density is $2(1-d)$; integrating gives $1/2$ overall, and the subset $D\ge1/2$ has probability $1/4$ and coverage 1. Buehler (1959), §2.2, calls a subset relevant when its conditional coverage differs from nominal by a fixed positive margin for every parameter value. The example establishes that unconditional coverage alone need not describe coverage after observing an ancillary; it does not prescribe a unique conditional inferential rule.`,
      caption: String.raw`Left: 60 pairs of draws (each bar is one interval $[\min,\max]$; true $\theta=0$), sorted by their distance $D$: intervals with $D\ge1/2$ cover (green); smaller $D$ lowers conditional coverage (misses are red). Right: the coverage as a function of $D$: exact curve (purple) and the simulated share in each bin (gold; initially 20,000 pairs, with more available by button). The dashed line at 0.5 is the confidence coefficient; the slider moves a cut $d_0$ and the readout gives the coverage of the subsets $D<d_0$ and $D\ge d_0$, exactly and by simulation.`,
      deps: ['stat-8.1', 'stat-2.12'],
      refs: ['Buehler (1959), Some Validity Criteria for Statistical Inferences, §2.2 pp. 846–847; uniform calculation derived explicitly'],
      tags: ['relevant subset', 'ancillary', 'conditionality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ancillary_statistic' },
      viz(v) {
        const dS = v.slider('cut $d_0$ on the distance $D$', 0.02, 0.95, 0.5, { step: 0.01 });
        let seed = 0, key = null, cnt = null, cov = null, N = 0, rr = null;
        v.button('New 60', () => { seed++; });
        const NB = 100;
        const run = (m) => { for (let i = 0; i < m; i++) { const a = rr(), b = rr(), lo = Math.min(a, b) - 0.5, hi = Math.max(a, b) - 0.5, D = hi - lo, k = Math.min(NB - 1, Math.floor(D * NB)); cnt[k]++; if (lo <= 0 && hi >= 0) cov[k]++; N++; } };
        v.button('Draw 20,000 more', () => { sync(); run(20000); });
        const sync = () => { if (key === null) { key = 1; cnt = new Float64Array(NB); cov = new Float64Array(NB); N = 0; rr = v.rng(hashStr('8.13')); run(20000); } };
        const sL = v.stage({ x: [-1, 1], y: [0, 61], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'interval $[\\min,\\max]$ (true $\\theta=0$)', ylabel: 'pair, sorted by $D$', title: '60 pairs of draws' });
        const sR = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'distance $D$ between the two draws', ylabel: 'coverage given $D$', title: 'coverage conditional on $D$' });
        const leg = legender(v);
        const ex = (D) => (D >= 0.5 ? 1 : D / (1 - D));
        const exTail = rangeSubsetCoverage;
        let st = null;
        v.render(() => {
          sync();
          const d0 = dS.value, r = v.rng(hashStr('8.13p|' + seed)), P = [];
          for (let i = 0; i < 60; i++) { const a = r() - 0.5, b = r() - 0.5; P.push([Math.min(a, b), Math.max(a, b)]); }
          P.sort((p, q) => q[1] - q[0] - (p[1] - p[0]));
          let hit = 0;
          P.forEach((p, i) => { if (bar(sL, p[0], p[1], 60 - i, 0, { mid: (p[0] + p[1]) / 2 })) hit++; });
          sL.vline(0, { color: CC.truth, width: 1.6 });
          let nb = 0; P.forEach((p) => { if (p[1] - p[0] >= d0) nb++; });
          sL.hline(61 - nb - 0.5, { color: 'muted', width: 1.2, dash: [4, 4] });
          // right
          const bins = [], BW = 20; for (let g = 0; g < BW; g++) { let c = 0, k = 0; for (let j = g * (NB / BW); j < (g + 1) * (NB / BW); j++) { c += cov[j]; k += cnt[j]; } bins.push(k ? c / k : 0); sR.rect(g / BW + 0.004, 0, (g + 1) / BW - 0.004, bins[g], { fill: CC.sim, fillAlpha: 0.45, color: CC.sim, width: 1 }); }
          sR.fn(ex, { domain: [0, 1], color: CC.exact, width: 2.6, n: 400 });
          sR.hline(0.5, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.vline(d0, { color: CC.miss, width: 1.6 });
          leg([[CC.exact, 'exact $P(\\theta\\in C\\mid D)$'], [CC.sim, 'simulated share per bin', { area: true }], ['muted', 'confidence coefficient ½', { dash: true }], [CC.miss, 'cut $d_0$']]);
          let h1 = 0, n1 = 0, h0 = 0, n0 = 0; const kcut = Math.round(d0 * NB); for (let j = 0; j < NB; j++) { if (j >= kcut) { h1 += cov[j]; n1 += cnt[j]; } else { h0 += cov[j]; n0 += cnt[j]; } }
          let tc = 0; for (let j = 0; j < NB; j++) tc += cov[j];
          st = { d0, hit, T: exTail(Math.round(d0 * NB) / NB), sim1: n1 ? h1 / n1 : NaN, sim0: n0 ? h0 / n0 : NaN, n1, n0, tot: tc / N };
        });
        v.readout(() => {
          if (!st) return '';
          const { d0, hit, T, sim1, sim0, n1, n0, tot } = st;
          return `This batch of 60: ${hit} intervals cover $\\theta$. Over ${commas(N)} simulated pairs the overall coverage is **${v.fix(tot, 3)}** (exact 0.5).\nPairs with $D\\ge${v.fix(d0, 2)}$ (probability ${v.fix(T.pa, 3)}): exact coverage **${v.fix(T.hi, 3)}**, simulated ${v.fix(sim1, 3)}. Pairs with $D<${v.fix(d0, 2)}$: exact **${v.fix(T.lo, 3)}**, simulated ${v.fix(sim0, 3)}. Their probability-weighted average is ½. Conditional Monte Carlo 2SE: ${v.fix(2*Math.sqrt(T.hi*(1-T.hi)/n1),3)} and ${v.fix(2*Math.sqrt(T.lo*(1-T.lo)/n0),3)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.14
    {
      num: '8.14',
      kind: 'Paradox',
      name: 'Fieller’s problem: unbounded sets for a ratio',
      credit: 'E. C. Fieller, 1954 (the exact set; earlier work 1940–44)',
      statement: String.raw`Let $a\sim N(\mu_1,\sigma_1^2)$ and $b\sim N(\mu_2,\sigma_2^2)$ be independent with $\sigma_1,\sigma_2$ known, and let $\rho=\mu_1/\mu_2$. For each hypothesised $\rho_0$, $a-\rho_0b\sim N\big(0,\sigma_1^2+\rho_0^2\sigma_2^2\big)$ when $\rho=\rho_0$, so the test that accepts when $(a-\rho_0b)^2\le z^2(\sigma_1^2+\rho_0^2\sigma_2^2)$ has size exactly $\alpha$, and by duality (8.4) the **Fieller set**
$$\Big\{\rho_0:\ (a-\rho_0b)^2\le z_{1-\alpha/2}^2\big(\sigma_1^2+\rho_0^2\sigma_2^2\big)\Big\}$$
has coverage exactly $1-\alpha$ for every $\rho$. It is the set where a quadratic in $\rho_0$, with leading coefficient $b^2-z^2\sigma_2^2$, is $\le0$: a bounded interval when $|b|>z\sigma_2$ (the denominator is significantly nonzero), the **complement of an interval** (two rays through $\pm\infty$) when $|b|<z\sigma_2$, and the **whole line** when additionally the quadratic never reaches zero. The delta-method interval $\hat\rho\pm z\,\widehat{\mathrm{se}}$, $\hat\rho=a/b$, $\widehat{\mathrm{se}}^2=(\sigma_1^2+\hat\rho^2\sigma_2^2)/b^2$, is always a bounded interval and its coverage collapses when $\mu_2/\sigma_2$ is small.`,
      idea: String.raw`If the data cannot rule out $\mu_2=0$, then the ratio $\mu_1/\mu_2$ could be arbitrarily large of either sign, and an honest $1-\alpha$ confidence set has to say so: an infinite set is the correct answer, not a failure. The delta method linearises $a/b$ around the observed $b$ and presumes $b$ is far from zero relative to its noise; when it is not, the interval is a short finite range that nearly always excludes the true ratio. The example is the standard counterexample to the idea that a confidence interval must be a bounded interval.`,
      caption: String.raw`Left: the Fieller statistic $g(\rho_0)=(a-\rho_0b)^2/(\sigma_1^2+\rho_0^2\sigma_2^2)$ against $\rho_0$ (with $\sigma_1=\sigma_2=1$); the Fieller set is where $g\le z^2$ (green; rays and the whole line run off the panel). The orange bar is the delta-method interval. Slide $b$ toward 0: the green set changes from an interval to the complement of an interval and then to the whole line. Right: simulated coverage of both intervals against the true signal-to-noise $\mu_2/\sigma_2$ (with $\mu_1=1$): Fieller is exactly 95% everywhere; the delta interval collapses for small $\mu_2$.`,
      deps: ['stat-8.4'],
      refs: ['Casella–Berger §9'],
      tags: ['Fieller', 'ratio', 'delta method'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fieller%27s_theorem' },
      viz(v) {
        const aS = v.slider('observed numerator $a$', 0, 4, 2, { step: 0.05 });
        const bS = v.slider('observed denominator $b$', -0.2, 5, 3, { step: 0.05 });
        const sL = v.stage({ x: [-8, 8], y: [0, 12], axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: 'hypothesised ratio $\\rho_0$', ylabel: '$g(\\rho_0)$', title: 'inverting the exact test' });
        const sR = v.stage({ x: [0.3, 8], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 360, weight: 0.9, minWidth: 250, xlabel: 'true signal-to-noise $\\mu_2/\\sigma_2$', ylabel: 'coverage', title: 'simulated coverage ($\\mu_1=1$)' });
        const leg = legender(v);
        const z = 1.959964, z2 = z * z;
        const SN = [0.3, 0.4, 0.5, 0.7, 1, 1.4, 2, 3, 4, 6, 8];
        const mc = memo();
        const covs = () => mc('c', () => SN.map((snr) => {
          const r = v.rng(hashStr('8.14|' + snr)), rho0 = 1 / snr, R = 4000; let f = 0, d = 0;
          for (let t = 0; t < R; t++) { const a = 1 + r.normal(), b = snr + r.normal(); if ((a - rho0 * b) ** 2 <= z2 * (1 + rho0 * rho0)) f++; const rh = a / b, se = Math.sqrt((1 + rh * rh) / (b * b)); if (Math.abs(rh - rho0) <= z * se) d++; }
          return [snr, f / R, d / R];
        }));
        const fieller = (a, b) => {
          const A = b * b - z2, B = -2 * a * b, C = a * a - z2, disc = B * B - 4 * A * C;
          if (A > 0) return disc < 0 ? { type: 'empty' } : { type: 'interval', lo: (-B - Math.sqrt(disc)) / (2 * A), hi: (-B + Math.sqrt(disc)) / (2 * A) };
          if (A === 0) return { type: 'line' };
          return disc < 0 ? { type: 'line' } : { type: 'complement', lo: (-B + Math.sqrt(disc)) / (2 * A), hi: (-B - Math.sqrt(disc)) / (2 * A) };
        };
        let st = null;
        v.render(() => {
          const a = aS.value, b = bS.value, F = fieller(a, b), g = (r) => (a - r * b) ** 2 / (1 + r * r);
          sL.fn((r) => Math.min(g(r), 40), { domain: [-8, 8], color: CC.wilson, width: 2.4, n: 500 });
          sL.hline(z2, { color: 'red', width: 1.4, dash: [5, 4] });
          const y0 = 0.5;
          if (F.type === 'interval') sL.line(F.lo, y0, F.hi, y0, { color: CC.cover, width: 7 });
          else if (F.type === 'complement') { sL.arrow(F.lo, y0, -8, y0, { color: CC.cover, width: 5 }); sL.arrow(F.hi, y0, 8, y0, { color: CC.cover, width: 5 }); }
          else if (F.type === 'line') sL.arrow(-7.9, y0, 8, y0, { color: CC.cover, width: 5, both: true });
          if (F.type === 'interval' || F.type === 'complement') { sL.vline(F.lo, { color: CC.cover, width: 1, dash: [3, 4] }); sL.vline(F.hi, { color: CC.cover, width: 1, dash: [3, 4] }); }
          const rh = a / (Math.abs(b) < 1e-9 ? 1e-9 : b), se = Math.sqrt((1 + rh * rh) / (b * b + 1e-12)), dl = [rh - z * se, rh + z * se];
          if (Math.abs(b) > 1e-6) sL.line(Math.max(-8, dl[0]), 1.5, Math.min(8, dl[1]), 1.5, { color: CC.wald, width: 7 });
          sL.dot(clamp(rh, -8, 8), 0, { r: 5, color: CC.sim });
          const C = covs();
          sR.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.path(C.map((c) => [c[0], c[1]]), { color: CC.cover, width: 2.4 }); sR.dots(C.map((c) => [c[0], c[1]]), { r: 3.5, color: CC.cover });
          sR.path(C.map((c) => [c[0], c[2]]), { color: CC.wald, width: 2.4 }); sR.dots(C.map((c) => [c[0], c[2]]), { r: 3.5, color: CC.wald });
          if (b > 0.3) sR.vline(clamp(b, 0.3, 8), { color: 'faint', width: 1.2, dash: [3, 4] });
          leg([[CC.cover, 'Fieller set'], [CC.wald, 'delta-method interval'], [CC.wilson, '$g(\\rho_0)$'], ['red', '$z^2$', { dash: true }], [CC.sim, 'estimate $a/b$', { dot: true }]]);
          st = { a, b, F, dl, rh };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, F, dl, rh } = st, f = (x) => v.fix(x, 2);
          const desc = F.type === 'interval' ? `bounded interval $[${f(F.lo)},\\,${f(F.hi)}]$` : F.type === 'complement' ? `**complement of an interval**: $(-\\infty,${f(F.lo)}]\\cup[${f(F.hi)},\\infty)$` : F.type === 'line' ? '**the whole real line**' : 'empty';
          return `$a=${f(a)}$, $b=${f(b)}$, $|b|/\\sigma_2$ vs $z=1.96$: ${Math.abs(b) > z ? 'denominator significant' : '**denominator not significant**'}. Fieller set: ${desc}.\nDelta-method interval: ${Math.abs(b) > 1e-6 ? `[${f(dl[0])}, ${f(dl[1])}] around $\\hat\\rho=${f(rh)}$` : 'undefined'} — always bounded, but its coverage is the orange curve on the right.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.15
    {
      num: '8.15',
      kind: 'Paper',
      name: 'Outline of a theory of statistical estimation',
      paper: { authors: 'J. Neyman', year: 1937, title: 'Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability', venue: 'Philosophical Transactions of the Royal Society of London A 236 (767): 333–380', doi: '10.1098/rsta.1937.0005' },
      introduces: ['stat-8.1', 'stat-8.4'],
      credit: 'J. Neyman, 1937',
      statement: String.raw`Neyman's 1937 memoir constructs confidence limits using the sampling distribution, with parameters treated as fixed unknown constants. In modern one-parameter notation, fix $0<c<1$ and choose measurable acceptance sets $A(\theta)$ with $P_\theta\{X\in A(\theta)\}\ge c$, then invert them:
$$C(x)=\{\theta:x\in A(\theta)\},\qquad P_\theta\{\theta\in C(X)\}\ge c.$$
The events are identical, so the confidence coefficient describes repeated use of the procedure, not a posterior probability for a fixed realized interval. The general inversion can produce a set rather than an interval; the models shown here do give intervals. Neyman discusses geometric acceptance regions and shortest systems in the original paper. Our binomial and normal pictures are modern examples, not reproductions of his numerical tables.`,
      idea: String.raw`The original memoir's equation (20), pp. 348–349, defines the coverage requirement; pp. 350–353, Propositions I–III and equation (25), identify membership in an acceptance region with coverage by the inverted interval. Thus the guarantee follows by evaluating the same event under the true fixed parameter. This page uses a lower-bound version for conservative discrete sampling. The binomial tiles directly invert equal-tailed Clopper–Pearson intervals; the normal model is an unrestricted mean $\theta\in\mathbb R$ with known $\sigma=1$, $n=100$.`,
      caption: String.raw`Binomial: each tile occupies the parameter interval accepted at the integer count on its row; its vertical thickness is only visual padding. No interpolated count or parameter grid defines the test. Normal: the shaded band is $20(\theta\pm z_{(1+c)/2}/10)$ on the observation scale, and interval endpoints may extend outside $[0,1]$. Axes expand to include every displayed interval; all intervals are reported with their actual endpoints. Drag the true parameter, change the observed count/mean or coefficient, or draw another 100 samples. The readout compares coverage with the model's actual probability (binomial at least nominal, normal nominal), with its sampling uncertainty.`,
      deps: ['stat-8.2', 'stat-6.4'],
      refs: ['Neyman (1937), equation (20) pp. 348–349; Propositions I–III/equation (25) pp. 350–353; §III pp. 370ff'],
      tags: ['confidence belt', 'history', 'interval estimation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confidence_interval#History' },
      viz(v) {
        const mS = v.select('model', [{ value: 'bin', label: 'binomial, $n=20$' }, { value: 'norm', label: 'normal mean, $\\sigma=1$, $n=100$' }], 'bin');
        const lvS = v.slider('confidence coefficient', 0.8, 0.99, 0.95, { step: 0.01 });
        const xS = v.slider('observed $x$ (binomial count; normal: mean $=x/20$)', 0, 20, 6, { int: true });
        const NB = 20, NN = 100;
        let seed = 1;
        v.button('New 100', () => { seed++; });
        const sL = v.stage({ x: [0, 1], y: [-0.5, 20.5], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'parameter $\\theta$', ylabel: 'observation $x$', title: 'confidence belt' });
        const th0 = sL.handle(0.35, 20.2, { color: CC.sim, label: 'true θ', constrain: (x) => [clamp(x, 0.05, 0.95), 20.2] });
        const sR = v.stage({ x: [0, 1], y: [0, 101], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'confidence interval for $\\theta$', ylabel: 'sample', title: '100 repeated samples' });
        const leg = legender(v);
        const modelCache=memo();
        const model=(m,lv)=>modelCache(`${m}|${lv}`,()=>m==='bin'?binomialBelt(NB,lv):normalBelt(lv,NN));
        let st = null;
        v.render(() => {
          const m = mS.value, lv = lvS.value, x = xS.value, M = model(m, lv), th = th0.x, G = v.rgb('accent');
          const ci=M.ci(x), r=v.rng(hashStr(`8.15|${m}|${th}|${seed}`)), samples=[];
          for(let i=1;i<=100;i++){const xx=M.draw(r,th);samples.push({xx,ci:M.ci(xx)});}
          const xmin=m==='bin'?0:Math.min(-.3,ci[0],...samples.map(s=>s.ci[0]))-.05;
          const xmax=m==='bin'?1:Math.max(1.3,ci[1],...samples.map(s=>s.ci[1]))+.05;
          const ymin=m==='bin'?-.5:20*(xmin-M.half),ymax=m==='bin'?20.5:20*(xmax+M.half);
          sL.setView([xmin,xmax],[ymin,ymax]);sR.setView([xmin,xmax],[0,101]);
          if(m==='bin') {
            for(let k=0;k<=NB;k++)sL.rect(M.intervals[k][0],k-.42,M.intervals[k][1],k+.42,{fill:'accent',fillAlpha:.22,color:CC.wilson,width:.8});
          } else {
            sL.raster((t,y)=>{const[lo,hi]=M.belt(t);return y>=lo&&y<=hi?[G[0],G[1],G[2],70]:null;},{res:3,key:`${m}|${lv}|${xmin}|${xmax}|${ymin}|${ymax}|${v.color('accent')}`});
            const lo=[],hi=[];for(let i=0;i<=200;i++){const t=xmin+(xmax-xmin)*i/200,b=M.belt(t);lo.push([t,b[0]]);hi.push([t,b[1]]);}
            sL.path(lo,{color:CC.wilson,width:1.8});sL.path(hi,{color:CC.wilson,width:1.8});
          }
          sL.hline(x,{color:CC.sim,width:1.4});sL.line(ci[0],x,ci[1],x,{color:CC.cover,width:6});
          sL.vline(th,{color:CC.sim,width:1.2,dash:[4,4]});
          const[bl,bh]=M.belt(th);if(m==='bin'){for(let k=bl;k<=bh;k++)sL.dot(th,k,{r:3,color:CC.sim});}else sL.line(th,bl,th,bh,{color:CC.sim,width:4,alpha:.9});
          let hit=0;sR.vline(th,{color:CC.truth,width:1.6});samples.forEach((s,i)=>{if(bar(sR,s.ci[0],s.ci[1],i+1,th,{mid:m==='bin'?s.xx/NB:s.xx/20}))hit++;});
          leg([['accent','acceptance tiles / continuous belt',{area:true}],[CC.cover,'interval / covers'],[CC.miss,'misses'],[CC.sim,'observation and true parameter']]);
          st = { m, x, ci, th, hit, lv, bl, bh, actualCoverage:M.coverage(th) };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, x, ci, th, hit, lv, bl, bh, actualCoverage } = st, f = (a) => v.fix(a, 3);
          return `${m === 'bin' ? `$x=${x}$ of 20` : `sample mean $\\bar x=${v.fix(x / 20, 2)}$`}: confidence interval **[${f(ci[0])}, ${f(ci[1])}]** at coefficient ${v.fix(lv, 2)}. At the true $\\theta=${f(th)}$ the belt accepts ${m === 'bin' ? `counts $${v.fix(bl, 0)},\\dots,${v.fix(bh, 0)}$` : `sample means in $[${v.fix(bl / 20, 3)},\\,${v.fix(bh / 20, 3)}]$`}.\nIn this set of 100 repeated samples **${hit}** intervals cover $\\theta$ (model probability ${v.fix(actualCoverage,4)}, expected ${v.fix(100*actualCoverage,1)} of 100; Monte Carlo 2SE ${v.fix(2*Math.sqrt(actualCoverage*(1-actualCoverage)/100),3)}).`;
        });
      },
    },
  ],
};

function sePsInv(n, ph) { return Math.sqrt(n * ph * (1 - ph)); }
