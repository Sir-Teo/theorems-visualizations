// Statistical Inference — Chapter 5: Large-sample theory (items 5.1–5.7; 5.8–5.13 in ch05-b.js)
//
// Large-sample theory is about what happens as n grows, so every picture lets the reader grow n: average
// log-likelihoods settling onto their expectation, histograms of √n(θ̂ − θ) straightening on a Q–Q plot, risk curves
// sharpening into a spike, a cloud of joint estimates shrinking into its information ellipse. The exact limit is
// always drawn beside the simulation, and each item has a choice that leaves the theorem's hypotheses.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, lgammaF, family, sumOver, logSlope, decadeTicks, strip, varN, medianOf,
  Phi, qnorm, dchisq1, pchisq1Upper, fam5, expLL, cauchyMLE, cauchyJ, cauchyS, cauchyLL,
  sigm, logitLL, logitS, logitI, logitMLE, rlaplace, rlogis, rt, qqPoints, ksDist, skew, golden, EC,
} from './ch05.shared.js';

/** Plain-text name of a family's parameter. */
const pname = (F) => ({ '\\mu': 'μ', '\\lambda': 'λ', p: 'p', '\\theta': 'θ' })[F.ptex];

export default {
  collection: 'stat',
  chapter: 5,
  title: 'Large-sample theory: maximum likelihood and M-estimation',
  summary: String.raw`As the sample grows, the average log-likelihood settles onto its expectation, whose peak sits at the truth because Kullback–Leibler divergence is positive, so the MLE is consistent; near the peak the log-likelihood becomes a parabola with curvature $nI(\theta)$, so the MLE is approximately normal with the Cramér–Rao variance, and its curvature at the peak is a standard error. Hodges’ estimator shows that "asymptotically optimal" must be read with care. When the model is wrong the MLE still converges, to the member closest in Kullback–Leibler divergence, and the sandwich variance repairs its standard errors. The same argument covers every M-estimator, the solution of an estimating equation $\sum\psi(X_i-\theta)=0$; choosing a bounded $\psi$ buys a bounded influence function and a high breakdown point, which is Huber’s robust estimator.`,
  items: [
    // ───────────────────────────────────────────────────────────── 5.1
    {
      num: '5.1',
      kind: 'Theorem',
      name: 'Consistency of the MLE',
      credit: 'Wald, 1949 (Fisher, 1922; Cramér, 1946)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with density $f(x\mid\theta_0)$ from a family $\{f(\cdot\mid\theta):\theta\in\Theta\}$, and let $\hat\theta_n$ maximize the average log-likelihood $M_n(\theta)=\frac1n\sum_{i=1}^n\log f(X_i\mid\theta)$ over $\Theta$. Put $M(\theta)=E_{\theta_0}\log f(X\mid\theta)$. Assume
(i) **identifiability**: $\theta\ne\theta_0$ implies $f(\cdot\mid\theta)\ne f(\cdot\mid\theta_0)$;
(ii) $\Theta$ is compact, $\theta\mapsto\log f(x\mid\theta)$ is continuous, and $\sup_\theta|\log f(X\mid\theta)|$ has finite expectation (or, more generally, $\sup_{\theta}|M_n(\theta)-M(\theta)|\to0$ in probability).
Then $\hat\theta_n\to\theta_0$ in probability: the MLE is **consistent**. Without identifiability the maximizers approach the whole set $\{\theta: f(\cdot\mid\theta)=f(\cdot\mid\theta_0)\}$ but need not settle on any one point of it.`,
      idea: String.raw`Two facts do all the work. First, $M(\theta)-M(\theta_0)=-\mathrm{KL}(f_{\theta_0}\,\|\,f_\theta)\le0$ with equality only at $\theta_0$ by Gibbs' inequality (info-2.2) and identifiability, so the expected log-likelihood has a unique, well-separated peak at the truth (compactness and continuity give the separation). Second, $M_n(\theta)\to M(\theta)$ for each $\theta$ by the law of large numbers, and the domination condition upgrades this to uniform convergence. A function uniformly within $\delta$ of $M$ cannot have its maximum where $M$ is more than $2\delta$ below its peak, so the argmax is dragged to $\theta_0$. Uniformity is essential: pointwise convergence alone allows a thin spike of $M_n$ to run off, which is how unbounded likelihoods (stat-3.8) and growing numbers of nuisance parameters (stat-3.9) defeat the theorem.`,
      caption: String.raw`Left: the average log-likelihood $\frac1n\ell_n(\theta)$ of twelve independent growing samples (grey; one in blue) at the chosen $n$, the exact expected log-likelihood $E_{\theta_0}\log f(X\mid\theta)$ (black) whose peak is the truth, and each curve's maximum (gold). Drag the green handle to move the truth. Right: each sample's MLE as $n$ runs from 1 to 2,000 (log scale), entering the green band of width $\pm\varepsilon$ and staying. Slide $n$ and watch the bundle tighten onto the black curve. The **Cauchy** likelihood has several local peaks for small $n$; the model $N(\theta^2,1)$ is not identifiable ($\pm\theta$ give the same law): the black curve has two equal peaks and the samples split between them.`,
      deps: ['info-2.2', 'stat-3.5', 'stat-3.3', 'prob-2.2.14'],
      see: ['stat-3.8', 'stat-3.9', 'stat-5.7'],
      refs: ['Wasserman §9.5', 'Casella–Berger §10.1'],
      tags: ['maximum likelihood', 'consistency', 'Kullback–Leibler'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_likelihood_estimation#Consistency' },
      viz(v) {
        const OPTS = [{ value: 'normal', label: 'normal' }, { value: 'poisson', label: 'Poisson' }, { value: 'expo', label: 'exponential' }, { value: 'cauchy', label: 'Cauchy' }, { value: 'sq', label: '$N(\\theta^2,1)$' }];
        const NMAX = 2000, P = 12, G = 101;
        const CP = []; { let n = 1; while (n < NMAX) { CP.push(n); n = Math.max(n + 1, Math.round(n * 1.17)); } CP.push(NMAX); }
        const idxOf = (n) => { let b = 0; CP.forEach((c, i) => { if (Math.abs(c - n) < Math.abs(CP[b] - n)) b = i; }); return b; };
        let F = fam5('normal'), hT = null, ybot = -3;
        const home = () => { sL.setView([F.lo, F.hi], [-3, 0]); sL.setLabels(`$${F.ptex}$`); sR.setView([1, NMAX], [F.lo, F.hi]); sR.setLabels(undefined, `$\\hat${F.ptex === 'p' ? 'p' : F.ptex}_n$`); hT.set(F.def, ybot); };
        const famS = v.select('model', OPTS, 'normal', { onChange: (k) => { F = fam5(k); home(); } });
        const iS = v.slider('sample size $n$', 0, CP.length - 1, idxOf(40), { int: true, fmt: (i) => commas(CP[Math.round(i)]) });
        const sL = v.stage({ x: [F.lo, F.hi], y: [-3, 0], axes: 'box', gutter: true, height: 360, weight: 1.15, xlabel: '$\\mu$', ylabel: '$\\frac1n\\ell_n(\\theta)$', title: 'average log-likelihoods converge to their expectation' });
        const sR = v.stage({ x: [1, NMAX], y: [F.lo, F.hi], xlog: true, axes: 'box', gutter: true, height: 360, weight: 0.85, minWidth: 240, xlabel: '$n$', ylabel: '$\\hat\\mu_n$', title: 'the maximizer along twelve growing samples' });
        hT = sL.handle(F.def, ybot, { color: 'green', label: '$\\theta_0$', labelPos: 'ne', constrain: (x) => [clamp(x, F.lo + 0.06 * (F.hi - F.lo), F.hi - 0.06 * (F.hi - F.lo)), ybot] });
        const mc = memo();
        const sim = (k, t0) => mc(k + '|' + t0, () => {
          const r = v.rng(hashStr(`cons5|${k}|${t0}`)), grid = new Float64Array(G), h = (F.hi - F.lo) / (G - 1);
          for (let g = 0; g < G; g++) grid[g] = F.lo + g * h;
          const paths = [];
          for (let p = 0; p < P; p++) {
            const acc = new Float64Array(G), curves = [], argm = []; let ci = 0;
            for (let n = 1; n <= NMAX; n++) {
              const x = F.sample(r, t0);
              for (let g = 0; g < G; g++) acc[g] += F.ll(x, grid[g]);
              if (n === CP[ci]) {
                let b = 0; for (let g = 1; g < G; g++) if (acc[g] > acc[b]) b = g;
                let th = grid[b];
                if (b > 0 && b < G - 1) { const den = acc[b - 1] - 2 * acc[b] + acc[b + 1]; if (den < 0) th += clamp((0.5 * (acc[b - 1] - acc[b + 1])) / den, -0.5, 0.5) * h; }
                curves.push(Float64Array.from(acc, (a) => a / n)); argm.push(th); ci++;
              }
            }
            paths.push({ curves, argm });
          }
          return { grid, paths };
        });
        let info = null;
        v.render(() => {
          const t0 = +hT.x.toFixed(3), i = iS.value, n = CP[i], S = sim(famS.value, t0), EL = (t) => expLL(F, t0, t);
          const peak = EL(t0), D = clamp(0.8 * Math.max(peak - EL(F.lo), peak - EL(F.hi)), 0.6, 3);
          const yb = peak - D, yt = peak + 0.35 * D;
          sL.setView([F.lo, F.hi], [yb, yt]);
          ybot = yb + 0.06 * (yt - yb); if (!hT.dragging) hT.set(hT.x, ybot);
          sL.vline(t0, { color: 'green', width: 1.4, dash: [5, 4] });
          if (F.key === 'sq') sL.vline(-t0, { color: 'red', width: 1.2, dash: [5, 4] });
          const gpts = Array.from(S.grid);
          for (let p = P - 1; p >= 0; p--) {
            const c = S.paths[p].curves[i], first = p === 0;
            sL.path(gpts.map((t, g) => [t, c[g]]), { color: first ? 'accent' : 'muted', width: first ? 2.4 : 1.1, alpha: first ? 1 : 0.5 });
          }
          sL.fn(EL, { domain: [F.lo, F.hi], color: 'ink', width: 3, n: 300 });
          for (let p = P - 1; p >= 0; p--) {
            const c = S.paths[p].curves[i]; let b = 0; for (let g = 1; g < G; g++) if (c[g] > c[b]) b = g;
            sL.dot(S.paths[p].argm[i], c[b], { r: p === 0 ? 4.5 : 3.2, color: 'gold' });
          }
          sL.dot(t0, peak, { r: 5, color: 'ink', hollow: true, width: 2 });
          sL.text('peak of the expectation = truth', t0, peak, { color: 'ink', size: 11.5, dy: -14, align: t0 > (F.lo + F.hi) / 2 ? 'right' : 'left', plate: true });
          // right: argmax paths
          const eps = 0.05 * (F.hi - F.lo);
          sR.hband(t0 - eps, t0 + eps, { color: 'green', alpha: 0.13 });
          if (F.key === 'sq') sR.hband(-t0 - eps, -t0 + eps, { color: 'red', alpha: 0.1 });
          sR.hline(t0, { color: 'green', width: 1.6 });
          for (let p = P - 1; p >= 0; p--) sR.path(S.paths[p].argm.map((th, j) => [CP[j], th]), { color: p === 0 ? 'accent' : 'muted', width: p === 0 ? 2.2 : 1, alpha: p === 0 ? 1 : 0.55 });
          sR.vline(n, { color: 'gold', width: 1.6, dash: [4, 3] });
          for (let p = 0; p < P; p++) sR.dot(n, S.paths[p].argm[i], { r: 2.6, color: 'gold' });
          v.legend([['ink', 'expected log-likelihood $E_{\\theta_0}\\log f(X\\mid\\theta)$'], ['accent', 'one sample'], ['muted', 'eleven more'], ['gold', 'their maximizers'], ['green', `truth ± ε (ε = ${v.fix(eps, 2)})`, { area: true }]]);
          // uniform distance between M_n and M on the grid, averaged over the samples
          let sup = 0, inside = 0, flip = 0;
          for (let p = 0; p < P; p++) {
            const c = S.paths[p].curves[i]; let m = 0;
            for (let g = 0; g < G; g++) { const e = EL(S.grid[g]); if (Number.isFinite(e) && Number.isFinite(c[g])) m = Math.max(m, Math.abs(c[g] - e)); }
            sup += m / P; const th = S.paths[p].argm[i];
            if (Math.abs(th - t0) <= eps) inside++; else if (F.key === 'sq' && Math.abs(th + t0) <= eps) flip++;
          }
          info = { n, t0, sup, inside, flip, eps };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, t0, sup, inside, flip, eps } = info, p = pname(F);
          let s = String.raw`${F.name}, true $${F.ptex}_0=${v.fix(t0, 2)}$, $n=${commas(n)}$: average of $\sup_\theta\big|\tfrac1n\ell_n(\theta)-E\log f(X\mid\theta)\big|$ over the twelve samples **${v.fix(sup, 3)}** · maximizers within ε of the truth: **${inside} of 12**`;
          if (F.key === 'sq') s += String.raw` and ${flip} within ε of $-${F.ptex}_0$ · **not identifiable**: $N(\theta^2,1)$ is the same law at $\pm\theta$, so the expected curve has two equal peaks and consistency fails (only $|\hat\theta_n|\to|\theta_0|$)`;
          else s += n >= 500 ? ' · the sup distance shrinks like $1/\\sqrt n$ and every maximizer has been dragged to the peak ✓' : ` · keep raising n: the sup distance shrinks and the maximizers converge to ${p}₀`;
          if (F.key === 'cauchy' && n < 30) s += ' · small Cauchy samples give log-likelihoods with several local maxima';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.2
    {
      num: '5.2',
      kind: 'Theorem',
      name: 'Asymptotic normality of the MLE',
      credit: 'Fisher, 1925; Cramér, 1946',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a regular one-parameter family $f(x\mid\theta)$, $\theta$ in an open interval, with true value $\theta_0$ an interior point. Assume the support does not depend on $\theta$, $\log f(x\mid\theta)$ is three times differentiable in $\theta$ with $|\partial_\theta^3\log f(x\mid\theta)|\le M(x)$ near $\theta_0$ and $E_{\theta_0}M(X)<\infty$, and the Fisher information satisfies $0<I(\theta_0)<\infty$. If $\hat\theta_n$ is a consistent root of the likelihood equation (stat-5.1), then
$$\sqrt n\,(\hat\theta_n-\theta_0)\ \xrightarrow{\ d\ }\ N\!\big(0,\,1/I(\theta_0)\big).$$
So $\hat\theta_n$ is approximately $N(\theta_0,1/(nI(\theta_0)))$: centred on the truth with the Cramér–Rao variance (stat-4.4). The conclusion fails in non-regular models: for Uniform$(0,\theta)$, $n(\theta_0-\hat\theta_n)$ converges to an exponential law and $\sqrt n(\hat\theta_n-\theta_0)\to0$.`,
      idea: String.raw`Expand the score around the truth with the mean value theorem (pma-5.10): $0=\ell_n'(\hat\theta_n)=\ell_n'(\theta_0)+(\hat\theta_n-\theta_0)\,\ell_n''(\tilde\theta_n)$ for some $\tilde\theta_n$ between them, hence
$$\sqrt n(\hat\theta_n-\theta_0)=\frac{n^{-1/2}\,\ell_n'(\theta_0)}{-n^{-1}\ell_n''(\tilde\theta_n)} .$$
The numerator is a normalized sum of i.i.d. scores with mean 0 and variance $I(\theta_0)$ (stat-4.1), so the central limit theorem makes it $N(0,I(\theta_0))$. The denominator tends to $I(\theta_0)$ by the law of large numbers and the information identity (stat-4.3), with consistency and the third-derivative bound controlling the move from $\theta_0$ to $\tilde\theta_n$. Slutsky's theorem (stat-1.14) divides the two: $N(0,I)/I=N(0,1/I)$.`,
      caption: String.raw`Left: the histogram of $\sqrt n(\hat\theta_n-\theta_0)$ over 2,000 samples (gold) against the limit $N(0,1/I(\theta_0))$ (green). Right: the normal Q–Q plot of the standardized values $\sqrt{nI(\theta_0)}\,(\hat\theta_n-\theta_0)$; the limit is the diagonal. Slide $n$ from 5 to 500: the exponential-rate MLE $1/\bar X$ starts visibly skewed (the Q–Q plot bends) and straightens; the Poisson and Bernoulli histograms are lattices that fill in. Choose **uniform**: the support moves with $\theta$, the MLE $X_{(n)}$ converges at rate $1/n$, and the $\sqrt n$-scaled histogram collapses onto a spike at 0 while the red would-be normal stays wide.`,
      deps: ['stat-5.1', 'stat-4.3', 'stat-1.14', 'pma-5.10'],
      see: ['stat-4.7', 'stat-10.11'],
      refs: ['Wasserman §9.7', 'Casella–Berger §10.1'],
      tags: ['maximum likelihood', 'asymptotic normality', 'Fisher information'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_likelihood_estimation#Asymptotic_normality' },
      viz(v) {
        const OPTS = [{ value: 'expo', label: 'exponential' }, { value: 'poisson', label: 'Poisson' }, { value: 'bernoulli', label: 'Bernoulli' }, { value: 'cauchy', label: 'Cauchy' }, { value: 'uniform', label: 'uniform $(0,\\theta)$' }];
        let F = family('expo');
        const famS = v.select('model', OPTS, 'expo', { onChange: (k) => { F = family(k); } });
        const nS = v.slider('sample size $n$', 5, 500, 10, { int: true, log: true });
        const sL = v.stage({ x: [-4, 4], y: [0, 0.5], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: '$\\sqrt n(\\hat\\theta_n-\\theta_0)$', ylabel: 'density', title: 'the sampling distribution of $\\sqrt n(\\hat\\theta_n-\\theta_0)$' });
        const sR = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: 'standard normal quantile', ylabel: '$\\sqrt{nI}\\,(\\hat\\theta_n-\\theta_0)$', title: 'normal Q–Q plot' });
        const buf = new Float64Array(520);
        const mle = (xs) => {
          if (F.key === 'expo') return 1 / mean(xs);
          if (F.key === 'cauchy') return cauchyMLE(xs, buf);
          if (F.key === 'uniform') { let m = 0; for (const x of xs) if (x > m) m = x; return m; }
          return mean(xs);
        };
        const R = repeater(v, {
          key: () => [famS.value, nS.value].join('|'),
          sample: (r) => { const n = nS.value, xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = F.sample(r, F.def); return Math.sqrt(n) * (mle(xs) - F.def); },
          init: 2000, buttons: [2000, 10000], seed: 'stat5.2',
        });
        const mz = memo();
        let info = null;
        v.render(() => {
          const S = R.sync(), Z = S.vals, n = nS.value, t0 = F.def, I = F.I(t0), sd0 = 1 / Math.sqrt(I);
          const lo = -4.2 * sd0, hi = 4.2 * sd0;
          // bins: on a lattice (Poisson, Bernoulli) use whole multiples of the lattice step 1/√n, centred on lattice points
          let B;
          if (F.discrete) {
            const st = 1 / Math.sqrt(n), w = Math.max(1, Math.round((hi - lo) / 46 / st)) * st, off = (-t0 * Math.sqrt(n)) % st;
            const a = Math.floor((lo - off) / w) * w + off - w / 2, nb = Math.ceil((hi - a) / w);
            B = binned(Z, a, a + nb * w, nb);
          } else B = binned(Z, lo, hi, 48);
          const top = Math.max(phi(0) / sd0, Math.min(B.max, 2.6 * phi(0) / sd0)) * 1.12;
          sL.setView([lo, hi], [0, top]);
          if (Z.length) sL.hist(B, { density: true, color: 'gold', fillAlpha: 0.38, width: 1.3 });
          sL.fn((z) => phi(z / sd0) / sd0, { color: F.regular ? 'green' : 'red', width: 2.6, n: 300, dash: F.regular ? undefined : [7, 5] });
          sL.vline(0, { color: 'muted', width: 1, dash: [3, 4] });
          const so = mz(S.id(), () => sortNum(Z));
          const m = moments(Z);
          if (Z.length) sL.vline(m.mean, { color: 'gold', width: 2.2 });
          if (B.max > 2.6 * phi(0) / sd0) sL.text('spike: √n-scaled values pile up at 0', 0, top * 0.93, { color: 'red', size: 12, weight: 700, align: 'left', dx: 8, plate: true });
          // Q–Q plot of the standardized values
          sR.fn((z) => z, { domain: [-3.6, 3.6], color: F.regular ? 'green' : 'red', width: 2.2 });
          sR.dots(qqPoints(so, Math.sqrt(I), 1000), { r: 2, color: 'gold', alpha: 0.8 });
          v.legend([['gold', `$\\sqrt n(\\hat\\theta_n-\\theta_0)$ over ${commas(Z.length)} samples`, { area: true }], [F.regular ? 'green' : 'red', F.regular ? 'limit $N(0,1/I(\\theta_0))$' : 'would-be limit $N(0,1/I)$ (fails)', F.regular ? {} : { dash: true }]]);
          info = { n, I, m, sk: skew(Z), D: so.length ? ksDist(so, (z) => Phi(z / sd0)) : NaN, N: Z.length, sd0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, I, m, sk, D, N, sd0 } = info;
          let s = String.raw`${F.name}, $${F.ptex}_0=${F.def}$, $n=${n}$, ${commas(N)} samples: SD of $\sqrt n(\hat\theta-\theta_0)$ **${v.fix(m.sd, 3)}** vs $1/\sqrt{I(\theta_0)}=${v.fix(sd0, 3)}$ · mean ${v.fix(m.mean, 3)} · skewness ${v.fix(sk, 2)} · Kolmogorov distance to the limit $D=${v.fix(D, 3)}$`;
          if (!F.regular) s += String.raw` · **non-regular**: the support moves with θ, $\hat\theta=X_{(n)}$ is off by about $\theta/n$, so the $\sqrt n$-scaled error tends to 0 instead of to a normal law`;
          else if (F.discrete) s += ' · a lattice distribution, but its outline approaches the normal curve';
          else if (D < 0.03) s += ' · the normal limit fits ✓';
          else s += ' · still visibly non-normal: raise n';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.3
    {
      num: '5.3',
      kind: 'Concept',
      name: 'Asymptotic efficiency and relative efficiency',
      credit: 'Fisher, 1922 (efficiency); Pitman, 1948 (relative efficiency)',
      statement: String.raw`An estimator sequence $T_n$ with $\sqrt n(T_n-\theta)\to N(0,\sigma_T^2(\theta))$ has **asymptotic variance** $\sigma_T^2(\theta)$. In a regular model it is **asymptotically efficient** if $\sigma_T^2(\theta)=1/I(\theta)$, the Cramér–Rao value (stat-4.4); the MLE is asymptotically efficient by stat-5.2. The **asymptotic relative efficiency** of $T$ with respect to $U$ is
$$\mathrm{ARE}(T,U)=\frac{\sigma_U^2(\theta)}{\sigma_T^2(\theta)},$$
the limiting ratio of sample sizes $U$ needs to match the precision of $T$. For location estimation from a symmetric density $f$ with variance $\sigma^2$, the sample mean has $\sigma^2_{\bar X}=\sigma^2$ and the sample median $\sigma^2_{\mathrm{med}}=1/(4f(0)^2)$, so $\mathrm{ARE}(\mathrm{med},\bar X)=4f(0)^2\sigma^2$: $2/\pi\approx0.64$ for normal data, $\pi^2/12\approx0.82$ for logistic, $2$ for Laplace and about $1.62$ for $t_3$.`,
      idea: String.raw`The mean's variance comes from the central limit theorem; the median's from the normal approximation to the order statistic at the half-way point: $P(\mathrm{med}\le\theta+t/\sqrt n)$ is a binomial tail whose success probability is $\tfrac12+f(0)t/\sqrt n$, giving variance $1/(4f(0)^2 n)$. Which wins depends on whether the population puts more of its weight in the centre (high $f(0)$, good for the median) or has light tails (small $\sigma^2$, good for the mean). Neither can beat $1/I$; for the normal the mean reaches it and for the Laplace the median does, because each is the MLE there.`,
      caption: String.raw`Left: $n$ times the simulated variance of the mean (blue) and the median (orange), 2,000 samples at each $n$, against their exact limits (dashed) and the Cramér–Rao floor $1/I$ (green). Right: the 2,000 values of $\sqrt n(T-\theta)$ for each estimator at the chosen $n$, with $\pm1$ SD bars. Switch the population: under normal data the mean is efficient and the median needs about 57% more data; under Laplace or $t_3$ data the order reverses.`,
      deps: ['stat-5.2', 'stat-4.4'],
      see: ['stat-5.13', 'stat-3.2'],
      refs: ['Wasserman §9.8', 'Casella–Berger §10.1'],
      tags: ['efficiency', 'median', 'asymptotics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Efficiency_(statistics)' },
      viz(v) {
        const POPS = {
          normal: { lab: 'normal', s2: 1, f0: phi(0), I: 1, draw: (r) => r.normal() },
          logistic: { lab: 'logistic', s2: (Math.PI ** 2) / 3, f0: 0.25, I: 1 / 3, draw: rlogis },
          laplace: { lab: 'Laplace', s2: 2, f0: 0.5, I: 1, draw: rlaplace },
          t3: { lab: '$t_3$', s2: 3, f0: 2 / (Math.PI * Math.sqrt(3)), I: 2 / 3, draw: (r) => rt(r, 3) },
        };
        const NS = [5, 11, 21, 41, 81, 161, 321], REPS = 2000;
        const popS = v.select('population', Object.entries(POPS).map(([k, p]) => ({ value: k, label: p.lab })), 'normal');
        const iS = v.slider('sample size $n$ (right)', 0, NS.length - 1, 3, { int: true, fmt: (i) => String(NS[Math.round(i)]) });
        const sL = v.stage({ x: [4, 400], y: [0, 2], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '$n$', ylabel: '$n\\cdot\\mathrm{Var}(T_n)$', xticks: [5, 10, 20, 50, 100, 200, 400], title: '$n$ × variance of the mean and the median' });
        const sR = v.stage({ x: [-4, 4], y: [0.3, 2.7], axes: 'box', gutter: { l: 70 }, height: 340, weight: 0.9, minWidth: 240, xlabel: '$\\sqrt n\\,(T_n-\\theta)$', yticks: [[2, 'mean'], [1, 'median']], title: '2,000 estimates at the chosen $n$' });
        const mc = memo();
        const sim = (k) => mc(k, () => {
          const P = POPS[k], r = v.rng(hashStr('are5|' + k)), buf = new Float64Array(400), xs = new Float64Array(400);
          return NS.map((n) => {
            const mn = new Float64Array(REPS), md = new Float64Array(REPS);
            for (let c = 0; c < REPS; c++) { let s = 0; for (let i = 0; i < n; i++) { xs[i] = P.draw(r); s += xs[i]; } mn[c] = Math.sqrt(n) * (s / n); md[c] = Math.sqrt(n) * medianOf(xs, n, buf); }
            return { n, mn, md, vm: varN(mn), vd: varN(md) };
          });
        });
        let info = null;
        v.render(() => {
          const P = POPS[popS.value], D = sim(popS.value), vmed = 1 / (4 * P.f0 * P.f0), j = iS.value;
          const top = Math.max(P.s2, vmed, ...D.map((d) => Math.max(d.vm, d.vd))) * 1.18;
          sL.setView([4, 400], [0, top]);
          sL.hline(1 / P.I, { color: 'green', width: 2, dash: [2, 3] });
          sL.text('Cramér–Rao floor 1/I', 4.6, 1 / P.I, { color: 'green', size: 11.5, align: 'left', dy: 16, plate: true });
          sL.hline(P.s2, { color: EC.mean, width: 1.6, dash: [7, 5] });
          sL.hline(vmed, { color: EC.median, width: 1.6, dash: [7, 5] });
          sL.path(D.map((d) => [d.n, d.vm]), { color: EC.mean, width: 2.4 });
          sL.path(D.map((d) => [d.n, d.vd]), { color: EC.median, width: 2.4 });
          D.forEach((d, i) => { sL.dot(d.n, d.vm, { r: i === j ? 5.5 : 3.5, color: EC.mean }); sL.dot(d.n, d.vd, { r: i === j ? 5.5 : 3.5, color: EC.median }); });
          sL.vline(NS[j], { color: 'gold', width: 1.4, dash: [4, 3] });
          // right: dartboards
          const d = D[j], w = 3.6 * Math.sqrt(Math.max(P.s2, vmed));
          sR.setView([-w, w], [0.3, 2.7]);
          sR.vline(0, { color: 'green', width: 1.8 });
          [[d.mn, 2, EC.mean, 31], [d.md, 1, EC.median, 32]].forEach(([vals, y, col, sd]) => {
            strip(sR, vals, y, 0.3, { color: col, alpha: 0.28, r: 1.6, seed: sd, max: 2000 });
            const m = mean(vals), s = Math.sqrt(varN(vals));
            sR.line(m - s, y - 0.4, m + s, y - 0.4, { color: col, width: 3.2 }); sR.dot(m, y - 0.4, { r: 3.4, color: 'ink' });
          });
          v.legend([[EC.mean, 'sample mean'], [EC.median, 'sample median'], ['muted', 'exact limits σ² and 1/(4f(0)²)', { dash: true }], ['green', 'Cramér–Rao floor 1/I · truth', { dash: [2, 3] }]]);
          info = { P, d, vmed };
        });
        v.readout(() => {
          if (!info) return '';
          const { P, d, vmed } = info, are = (4 * P.f0 * P.f0) * P.s2;
          return String.raw`${P.lab} data, $n=${d.n}$: $n\,\mathrm{Var}$ of the mean **${v.fix(d.vm, 3)}** (limit $\sigma^2=${v.fix(P.s2, 3)}$), of the median **${v.fix(d.vd, 3)}** (limit $1/(4f(0)^2)=${v.fix(vmed, 3)}$) · simulated ratio ${v.fix(d.vm / d.vd, 3)} vs $\mathrm{ARE}(\text{median},\bar X)=${v.fix(are, 3)}$ · floor $1/I=${v.fix(1 / P.I, 3)}$ · ` + (are < 1 ? `**the mean wins**: the median needs ${v.fix(1 / are, 2)}× as many observations` : `**the median wins**: the mean needs ${v.fix(are, 2)}× as many observations`) + (popS.value === 't3' ? ' · ($t_3$ has infinite fourth moment, so the simulated variance of the mean is noisy)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.4
    {
      num: '5.4',
      kind: 'Paradox',
      name: 'Hodges’ superefficient estimator',
      credit: 'J. L. Hodges Jr., 1951 (reported by Le Cam, 1953)',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. $N(\theta,1)$, so the MLE $\bar X_n$ has $n\,E_\theta(\bar X_n-\theta)^2=1=1/I(\theta)$ for every $\theta$. **Hodges' estimator** replaces small values by zero:
$$T_n=\begin{cases}\bar X_n,&|\bar X_n|\ge n^{-1/4},\\ 0,&|\bar X_n|<n^{-1/4}.\end{cases}$$
Then $\sqrt n(T_n-\theta)\to N(0,1)$ for every $\theta\ne0$, but $\sqrt n\,T_n\to0$ when $\theta=0$: its asymptotic variance is $1$ off zero and $0$ at zero, strictly below the Cramér–Rao value at one point. The price is paid nearby: the normalized risk $R_n(\theta)=n\,E_\theta(T_n-\theta)^2$ satisfies $\sup_\theta R_n(\theta)\to\infty$ (already $R_n(n^{-1/4})\approx\tfrac12\sqrt n$, and the supremum is of order $\sqrt n$), so $T_n$ is far worse than $\bar X_n$ uniformly. The paradox: pointwise asymptotic variance can beat $1/I$, so asymptotic efficiency must be defined locally uniformly, which leads to Le Cam's convolution and local asymptotic minimax theorems (superefficiency is possible only on a set of Lebesgue measure zero).`,
      idea: String.raw`At $\theta=0$, $\bar X_n$ has spread $n^{-1/2}$, far smaller than the threshold $n^{-1/4}$, so $T_n=0$ exactly with probability tending to one. At any fixed $\theta\ne0$, $|\bar X_n|$ eventually exceeds the shrinking threshold and $T_n=\bar X_n$. But at $\theta=h n^{-1/4}$ with $h$ near 1 the estimator snaps to 0 about half the time, with error $\theta$, so $nE(T_n-\theta)^2\approx\tfrac12 n\theta^2=\tfrac12\sqrt n$. The bump moves toward 0 and grows as $n$ increases, which is why it is invisible to any fixed-$\theta$ limit and why the regularity of the convergence (uniform over $\theta$ in $n^{-1/2}$-neighbourhoods) is the right notion of efficiency (stat-5.3).`,
      caption: String.raw`Left: the exact normalized risk $n\,E_\theta(T_n-\theta)^2$ of Hodges' estimator (log scale) for $n=10,10^2,\dots,10^5$ (grey) and for the chosen $n$ (red), against the MLE's constant risk 1 (black). The dip at $0$ is the superefficiency; the bumps at $\pm n^{-1/4}$ (orange lines) are the cost. Drag the gold handle: the dot is the risk simulated from 4,000 samples there. Switch the axis to $h=\sqrt n\,\theta$, the scale of local alternatives, and watch the bump march outward and grow. Right: the worst-case risk grows like $\sqrt n$ while the risk at 0 vanishes.`,
      deps: ['stat-5.3'],
      see: ['stat-5.2', 'stat-4.4'],
      refs: ['Casella–Berger §10'],
      tags: ['superefficiency', 'paradox', 'asymptotics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hodges%27_estimator' },
      viz(v) {
        const risk = (n, t) => {
          const c = n ** -0.25, rn = Math.sqrt(n), a = rn * (-c - t), b = rn * (c - t), pin = Phi(b) - Phi(a);
          const e2in = pin - (b * phi(b) - a * phi(a));
          return Math.max(1e-12, 1 - e2in + n * t * t * pin);
        };
        const NREF = [10, 100, 1000, 10000, 100000];
        let theta = 0.12;
        const axS = v.select('horizontal axis', [{ value: 't', label: '$\\theta$' }, { value: 'h', label: '$h=\\sqrt n\\,\\theta$' }], 't');
        const nS = v.slider('sample size $n$', 10, 100000, 1000, { int: true, log: true });
        const sL = v.stage({ x: [-1, 1], y: [1e-3, 400], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1.25, xlabel: '$\\theta$', ylabel: '$n\\,E_\\theta(T_n-\\theta)^2$', title: 'normalized risk: Hodges (red) vs the MLE (black)' });
        const sR = v.stage({ x: [10, 1e5], y: [1e-3, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, weight: 0.75, minWidth: 230, xlabel: '$n$', title: 'worst case and best case' });
        const hX = () => (axS.value === 'h' ? 10 : 1);
        const H = sL.handle(theta, 2.2e-3, { color: 'gold', label: '$\\theta$', labelPos: 'ne', constrain: (x) => [clamp(x, -0.98 * hX(), 0.98 * hX()), 2.2e-3] });
        H.onDrag = (h) => { theta = axS.value === 'h' ? h.x / Math.sqrt(nS.value) : h.x; };
        const ms = memo();
        const simAt = (n, t) => ms(n + '|' + t.toFixed(5), () => {
          const r = v.rng(hashStr(`hodges|${n}|${t.toFixed(5)}`)), c = n ** -0.25; let sh = 0, sm = 0; const M = 4000;
          for (let i = 0; i < M; i++) { const xb = t + r.normal() / Math.sqrt(n), T = Math.abs(xb) >= c ? xb : 0; sh += (T - t) ** 2; sm += (xb - t) ** 2; }
          return { h: (n * sh) / M, m: (n * sm) / M };
        });
        const supRisk = (n) => { const c = n ** -0.25; let best = 0, at = 0; for (let i = 1; i <= 400; i++) { const t = (3 * c * i) / 400, r = risk(n, t); if (r > best) { best = r; at = t; } } return { best, at }; };
        const curveR = memo();
        const rightCurves = () => curveR('x', () => { const out = { sup: [], zero: [] }; for (let e = 1; e <= 5.0001; e += 0.05) { const n = 10 ** e; out.sup.push([n, supRisk(n).best]); out.zero.push([n, risk(n, 0)]); } return out; });
        let info = null;
        v.render(() => {
          const n = nS.value, hm = axS.value === 'h', sc = (m) => (hm ? Math.sqrt(m) : 1), W = hm ? 10 : 1;
          sL.setView([-W, W], [1e-3, 400]); sL.setLabels(hm ? '$h=\\sqrt n\\,\\theta$' : '$\\theta$');
          if (!H.dragging) H.set(clamp(theta * sc(n), -0.98 * W, 0.98 * W), 2.2e-3);
          sL.hline(1, { color: 'ink', width: 2.6 });
          NREF.forEach((m, i) => {
            sL.fn((x) => risk(m, x / sc(m)), { domain: [-W, W], color: 'muted', width: 1.2, alpha: 0.35 + 0.1 * i, n: 900 });
            const c = m ** -0.25, xp = c * sc(m) * 1.02;
            if (xp < W * 0.97) sL.text(m >= 1e4 ? `10${['⁴', '⁵'][Math.round(Math.log10(m)) - 4]}` : String(m), xp, risk(m, c * 1.02), { color: 'muted', size: 10.5, dy: -8, align: 'left' });
          });
          const c = n ** -0.25;
          for (const sgn of [-1, 1]) sL.vline(sgn * c * sc(n), { color: 'orange', width: 1.3, dash: [5, 4] });
          sL.fn((x) => risk(n, x / sc(n)), { domain: [-W, W], color: 'red', width: 2.8, n: 1400 });
          const S = simAt(n, theta);
          sL.vline(theta * sc(n), { color: 'gold', width: 1.2, dash: [3, 4] });
          sL.dot(theta * sc(n), Math.max(1.2e-3, S.h), { r: 5.5, color: 'gold' });
          sL.dot(theta * sc(n), S.m, { r: 4, color: 'ink', hollow: true, width: 2 });
          // right
          const RC = rightCurves(), sp = supRisk(n);
          sR.hline(1, { color: 'ink', width: 2.2 });
          sR.path(RC.sup, { color: 'red', width: 2.6 });
          sR.path(RC.zero, { color: 'green', width: 2.6 });
          sR.fn((m) => 0.5 * Math.sqrt(m), { color: 'red', width: 1.2, dash: [5, 4], alpha: 0.7 });
          sR.vline(n, { color: 'gold', width: 1.4, dash: [4, 3] });
          sR.dot(n, sp.best, { r: 5, color: 'red' }); sR.dot(n, risk(n, 0), { r: 5, color: 'green' });
          sR.text('sup over θ', 30, RC.sup[8][1], { color: 'red', size: 11.5, dy: -12, align: 'left', plate: true });
          sR.text('at θ = 0', 30, risk(30, 0), { color: 'green', size: 11.5, dy: 14, align: 'left', plate: true });
          sR.text('MLE', 1e5, 1, { color: 'ink', size: 11.5, dy: -10, align: 'right', plate: true });
          v.legend([['red', 'Hodges, chosen $n$'], ['muted', '$n=10,\\dots,10^5$'], ['ink', 'MLE $\\bar X_n$: risk 1'], ['orange', 'threshold $\\pm n^{-1/4}$', { dash: true }], ['gold', 'simulated risk at the handle', { dot: true }], ['red', '$R_n(n^{-1/4})\\approx\\tfrac12\\sqrt n$ (right)', { dash: true }]]);
          info = { n, t: theta, S, ex: risk(n, theta), sp, z: risk(n, 0), sl: logSlope(RC.sup.filter(([m]) => m > 1000)) };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, t, S, ex, sp, z, sl } = info;
          return String.raw`$n=${commas(n)}$, threshold $n^{-1/4}=${v.fix(n ** -0.25, 4)}$ · at $\theta=${v.fix(t, 4)}$: Hodges risk **${v.fix(S.h, 3)}** simulated (exact ${v.fix(ex, 3)}), MLE ${v.fix(S.m, 3)} (exact 1) · ` + (ex < 0.95 ? '**superefficient here** · ' : ex > 1.05 ? '**worse than the MLE here** · ' : '') + String.raw`risk at 0: $${v.sci(z, 2)}$ · worst case ${v.fix(sp.best, 1)} at $\theta\approx${v.fix(sp.at, 4)}$ · worst case / $\sqrt n$ = ${v.fix(sp.best / Math.sqrt(n), 3)} (between $\tfrac12$ and 1, local log–log slope ${v.fix(sl, 2)}): the uniform risk blows up`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.5
    {
      num: '5.5',
      kind: 'Method',
      name: 'Observed information and Wald standard errors',
      statement: String.raw`By stat-5.2 the MLE is approximately $N(\theta_0,1/(nI(\theta_0)))$, but $\theta_0$ is unknown. Two consistent estimates of the information are used: the **expected information at the MLE**, $nI(\hat\theta_n)$, and the **observed information** $J_n=-\ell_n''(\hat\theta_n)$, the curvature of the log-likelihood at its peak. Either gives a **Wald standard error** $\widehat{\mathrm{se}}=1/\sqrt{J_n}$ (or $1/\sqrt{nI(\hat\theta_n)}$), the interval $\hat\theta_n\pm1.96\,\widehat{\mathrm{se}}$ with asymptotic coverage 95%, and the Wald statistic $W=(\hat\theta_n-\theta_0)^2J_n$. In canonical exponential families (such as logistic regression) the two coincide. For a null value $\theta_0$ the Wald statistic has two first-order equivalent companions, the **score statistic** $S=\ell_n'(\theta_0)^2/(nI(\theta_0))$ and the **likelihood-ratio statistic** $\Lambda=2\{\ell_n(\hat\theta_n)-\ell_n(\theta_0)\}$; under $H_0$ all three converge to $\chi^2_1$.`,
      idea: String.raw`Near its peak the log-likelihood is a parabola, $\ell_n(\theta)\approx\ell_n(\hat\theta_n)-\tfrac12J_n(\theta-\hat\theta_n)^2$, so the curvature measures how sharply the data discriminate between parameter values; by the law of large numbers and consistency $J_n/n\to I(\theta_0)$ (stat-4.3), and Slutsky (stat-1.14) lets it replace $nI(\theta_0)$. The three statistics read the same parabola in three ways: horizontally (distance from $\hat\theta$ to $\theta_0$, Wald), vertically (drop in height, likelihood ratio) and by the slope at $\theta_0$ (score). On an exact parabola they agree; they differ by how far the true log-likelihood departs from it. Efron and Hinkley (1978) argued that $J_n$ is the better choice because it tracks the precision of the sample actually observed: Cauchy samples that happen to be informative have high $J_n$ and small errors.`,
      caption: String.raw`Left: one sample's log-likelihood $\ell(\theta)-\ell(\hat\theta)$ (blue), its parabola with the observed curvature $J_n$ (green, dashed) and, for the Cauchy, the parabola with the expected information $n/2$ (orange, dotted). Drag the null value $\theta_0$ (gold): the Wald distance (teal), likelihood-ratio drop (purple) and score tangent (pink) are drawn. Right, **standard errors**: each of 1,500 samples as a point (observed SE, error $\hat\theta-\theta$); the green wedge is $\pm1.96$ SE, points outside it (red) are misses. For logistic regression the points lie on a curve because $J_n=nI(\hat\beta)$. For the Cauchy, the expected SE (orange line) ignores the sample, while the observed SE stretches with it. Right, **three tests**: histograms of $W,S,\Lambda$ at $\theta_0$ against $\chi^2_1$ (black); move $\theta_0$ off the truth to see their power.`,
      deps: ['stat-5.2'],
      see: ['stat-6.10', 'stat-6.11', 'stat-8.5'],
      refs: ['Wasserman §9.7'],
      tags: ['standard error', 'information', 'Wald test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Observed_information' },
      viz(v) {
        const MODELS = {
          logistic: { lab: 'logistic slope', p: '\\beta', t: 1 },
          cauchy: { lab: 'Cauchy location', p: '\\theta', t: 0 },
        };
        const modS = v.select('model', [{ value: 'logistic', label: 'logistic regression' }, { value: 'cauchy', label: 'Cauchy location' }], 'logistic', { onChange: () => { home(); } });
        const viewS = v.select('right panel', [{ value: 'se', label: 'standard errors' }, { value: 'tests', label: 'three tests' }], 'se');
        const nS = v.slider('sample size $n$', 10, 300, 40, { int: true, log: true, onChange: () => home() });
        const sL = v.stage({ x: [0, 2], y: [-6, 1], axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: '$\\beta$', ylabel: '$\\ell(\\theta)-\\ell(\\hat\\theta)$', title: 'one sample: log-likelihood, its parabola, and $\\theta_0$' });
        const sR = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 360, weight: 0.9, minWidth: 250, xlabel: 'observed SE $1/\\sqrt{J_n}$', ylabel: '$\\hat\\theta-\\theta$', title: 'error against standard error, 1,500 samples' });
        const tR = titler(sR);
        const dmemo = memo();
        const design = (n) => dmemo(n, () => Float64Array.from({ length: n }, (_, i) => -2 + (4 * i) / (n - 1)));
        const half = () => { const M = MODELS[modS.value], n = nS.value; const I = modS.value === 'cauchy' ? n / 2 : logitI(design(n), M.t); return 4.2 / Math.sqrt(I); };
        const H0 = sL.handle(1.3, -5.4, { color: 'gold', label: '$\\theta_0$', labelPos: 'ne', constrain: (x) => { const M = MODELS[modS.value], w = half(); return [clamp(x, M.t - 0.95 * w, M.t + 0.95 * w), -5.4]; } });
        const home = () => { const M = MODELS[modS.value], w = half(); sL.setView([M.t - w, M.t + w], [-6, 1]); sL.setLabels(`$${M.p}$`); H0.set(M.t + 0.45 * w, -5.4); };
        const REPS = 1500, mc = memo();
        const sim = (k, n) => mc(k + '|' + n, () => {
          const M = MODELS[k], r = v.rng(hashStr(`wald5|${k}|${n}`)), out = [], x = design(n), buf = new Float64Array(n + 2); let sep = 0;
          while (out.length < REPS) {
            if (k === 'logistic') {
              const y = new Uint8Array(n); for (let i = 0; i < n; i++) y[i] = r() < sigm(M.t * x[i]) ? 1 : 0;
              const b = logitMLE(x, y); if (!Number.isFinite(b)) { sep++; if (sep > 20 * REPS) break; continue; }
              const J = logitI(x, b); out.push({ y, th: b, J, Ie: J });
            } else {
              const xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = M.t + Math.tan(Math.PI * (r() - 0.5));
              const th = cauchyMLE(xs, buf), J = cauchyJ(xs, th); if (!(J > 0)) continue;
              out.push({ xs, th, J, Ie: n / 2 });
            }
          }
          return { out, sep, I0: k === 'cauchy' ? n / 2 : logitI(x, M.t) };
        });
        const LL = (k, d, t, n) => (k === 'logistic' ? logitLL(design(n), d.y, t) : cauchyLL(d.xs, t));
        const SC = (k, d, t, n) => (k === 'logistic' ? logitS(design(n), d.y, t) : cauchyS(d.xs, t));
        const I0f = (k, t, n) => (k === 'logistic' ? logitI(design(n), t) : n / 2);
        const tm = memo();
        const tests = (k, n, t0) => tm([k, n, t0.toFixed(4)].join('|'), () => {
          const D = sim(k, n).out, W = new Float64Array(D.length), S = new Float64Array(D.length), L = new Float64Array(D.length), Ii = I0f(k, t0, n);
          D.forEach((d, i) => { W[i] = (d.th - t0) ** 2 * d.J; S[i] = SC(k, d, t0, n) ** 2 / Ii; L[i] = Math.max(0, 2 * (LL(k, d, d.th, n) - LL(k, d, t0, n))); });
          const rate = (a) => a.filter((z) => z > 3.841).length / a.length;
          return { W, S, L, rW: rate(W), rS: rate(S), rL: rate(L) };
        });
        let info = null;
        home();
        v.render(() => {
          const k = modS.value, M = MODELS[k], n = nS.value, D = sim(k, n), d0 = D.out[0], t0 = H0.x, w = half();
          const lhat = LL(k, d0, d0.th, n), xa = M.t - w, xb = M.t + w;
          // left: the log-likelihood and its quadratic approximations
          sL.hline(-1.92, { color: 'faint', width: 1, dash: [3, 3] });
          sL.fn((t) => LL(k, d0, t, n) - lhat, { domain: [xa, xb], color: 'accent', width: 2.8, n: 400 });
          sL.fn((t) => -0.5 * d0.J * (t - d0.th) ** 2, { domain: [xa, xb], color: 'green', width: 2, dash: [7, 5], n: 200 });
          if (Math.abs(d0.Ie / d0.J - 1) > 0.01) sL.fn((t) => -0.5 * d0.Ie * (t - d0.th) ** 2, { domain: [xa, xb], color: 'orange', width: 2, dash: [2, 3], n: 200 });
          sL.vline(M.t, { color: 'green', width: 1.2, alpha: 0.6 });
          sL.dot(d0.th, 0, { r: 4.5, color: 'accent' });
          sL.tex('\\hat\\theta', d0.th, 0, { color: 'accent', dy: -12, size: 14 });
          const l0 = LL(k, d0, t0, n) - lhat, s0 = SC(k, d0, t0, n);
          sL.vline(t0, { color: 'gold', width: 1.2, dash: [3, 4] });
          sL.line(t0, Math.max(l0, -6), t0, 0, { color: 'purple', width: 3.2 });
          sL.line(d0.th, 0.45, t0, 0.45, { color: 'teal', width: 3.2 });
          sL.text('Wald', 0.5 * (d0.th + t0), 0.45, { color: 'teal', size: 11.5, dy: -10, weight: 700 });
          sL.text('LR', t0, Math.max(l0, -5.6) / 2, { color: 'purple', size: 11.5, dx: t0 > d0.th ? 8 : -8, align: t0 > d0.th ? 'left' : 'right', weight: 700, plate: true });
          const ppx = Math.abs(sL.X(1) - sL.X(0)), ppy = Math.abs(sL.Y(1) - sL.Y(0)), dx = 34 / Math.hypot(ppx, s0 * ppy);
          if (l0 > -6) { sL.line(t0 - dx, l0 - s0 * dx, t0 + dx, l0 + s0 * dx, { color: 'pink', width: 3 }); sL.dot(t0, l0, { r: 3.5, color: 'pink' }); }
          sL.text('−1.92: the 95% likelihood cut', xa + 0.02 * (xb - xa), -1.92, { color: 'muted', size: 10.5, dy: 10, align: 'left' });
          // right panel
          const T = tests(k, n, t0);
          if (viewS.value === 'se') {
            tR('error against standard error, 1,500 samples'); sR.setLabels('observed SE $1/\\sqrt{J_n}$', '$\\hat\\theta-\\theta$');
            const se = D.out.map((d) => 1 / Math.sqrt(d.J)), sse = sortNum(se), xm = qSorted(sse, 0.99) * 1.15, ae = sortNum(D.out.map((d) => Math.abs(d.th - M.t))), ym = Math.max(3 / Math.sqrt(D.I0), qSorted(ae, 0.995) * 1.1);
            sR.setView([0, xm], [-ym, ym]);
            sR.poly([[0, 0], [xm, 1.96 * xm], [xm, -1.96 * xm]], { fill: 'green', fillAlpha: 0.1, stroke: false });
            sR.line(0, 0, xm, 1.96 * xm, { color: 'green', width: 1.6 }); sR.line(0, 0, xm, -1.96 * xm, { color: 'green', width: 1.6 });
            sR.vline(1 / Math.sqrt(D.I0), { color: 'orange', width: 1.8, dash: [6, 4] });
            const hit = [], miss = [];
            D.out.forEach((d, i) => { const e = d.th - M.t; (Math.abs(e) <= 1.96 * se[i] ? hit : miss).push([se[i], e]); });
            sR.dots(hit, { r: 1.9, color: 'gold', alpha: 0.55 }); sR.dots(miss, { r: 2.4, color: 'red', alpha: 0.85 });
            sR.setTicks(null, null);
            v.legend([['accent', 'log-likelihood'], ['green', 'parabola with $J_n$ · ±1.96 SE wedge', { dash: true }], ...(k === 'cauchy' ? [['orange', 'expected information $n/2$', { dash: [2, 3] }]] : []), ['gold', 'samples covered'], ['red', 'missed']]);
          } else {
            tR(`the three statistics at $\\theta_0=${v.fix(t0, 2)}$`); sR.setLabels('statistic', 'density');
            sR.setView([0, 10], [0, 0.9]);
            const opt = { density: true, fillAlpha: 0.05, width: 2 };
            sR.hist(binned(T.L, 0, 10, 40), { ...opt, color: 'purple' });
            sR.hist(binned(T.W, 0, 10, 40), { ...opt, color: 'teal' });
            sR.hist(binned(T.S, 0, 10, 40), { ...opt, color: 'pink' });
            sR.fn(dchisq1, { domain: [0.02, 10], color: 'ink', width: 2.4, n: 300 });
            sR.vline(3.841, { color: 'red', width: 1.4, dash: [5, 4] });
            sR.text('5% cut 3.84', 3.9, 0.82, { color: 'red', size: 11, align: 'left' });
            v.legend([['accent', 'log-likelihood'], ['teal', 'Wald $W$'], ['pink', 'score $S$'], ['purple', 'likelihood ratio $\\Lambda$'], ['ink', '$\\chi^2_1$ density']]);
          }
          // conditional coverage (Efron–Hinkley): split by observed information
          const Js = sortNum(D.out.map((d) => d.J)), Jmed = qSorted(Js, 0.5);
          const cov = (useObs, pick) => { let c = 0, m = 0; for (const d of D.out) { if (!pick(d)) continue; m++; const se = 1 / Math.sqrt(useObs ? d.J : d.Ie); if (Math.abs(d.th - M.t) <= 1.96 * se) c++; } return m ? c / m : NaN; };
          info = { k, M, n, D, d0, t0, T, sd: Math.sqrt(varN(D.out.map((d) => d.th))), seo: mean(D.out.map((d) => 1 / Math.sqrt(d.J))), cO: cov(true, () => true), cE: cov(false, () => true), cLoE: cov(false, (d) => d.J < Jmed), cHiE: cov(false, (d) => d.J >= Jmed), cLoO: cov(true, (d) => d.J < Jmed), cHiO: cov(true, (d) => d.J >= Jmed), lw: (d0.th - t0) ** 2 * d0.J, ls: s0 * s0 / I0f(k, t0, n), lr: -2 * l0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, M, n, D, t0, T, sd, seo, cO, cE, cLoE, cHiE, cLoO, cHiO, lw, ls, lr } = info;
          let s = String.raw`this sample at $${M.p}_0=${v.fix(t0, 2)}$: $W=${v.fix(lw, 2)}$, $S=${v.fix(ls, 2)}$, $\Lambda=${v.fix(lr, 2)}$ · `;
          if (viewS.value === 'se') {
            s += String.raw`over ${commas(D.out.length)} samples ($n=${n}$): actual SD of $\hat${M.p}$ **${v.fix(sd, 4)}**, mean observed SE ${v.fix(seo, 4)}, expected SE $1/\sqrt{nI}=${v.fix(1 / Math.sqrt(D.I0), 4)}$ · coverage with $J_n$ **${pct(cO)}**, with $nI(\hat\theta)$ ${pct(cE)}`;
            if (k === 'cauchy') s += ` · split by $J_n$: expected-SE intervals cover ${pct(cLoE)} of the less informative half and ${pct(cHiE)} of the more informative half; observed-SE intervals ${pct(cLoO)} and ${pct(cHiO)} (closer to 95% in both halves)`;
            else s += String.raw` · canonical link: $J_n=nI(\hat\beta)$ exactly, so the two SEs coincide` + (D.sep ? ` · ${D.sep} separated samples (infinite MLE) were skipped` : '');
          } else {
            const at = Math.abs(t0 - M.t) < 0.02 * half0(M, n, D);
            s += String.raw`rejection rates at the $\chi^2_1$ 5% cut over ${commas(D.out.length)} samples: Wald **${pct(T.rW)}**, score **${pct(T.rS)}**, LR **${pct(T.rL)}** · ` + (at ? 'the null is true: all three near 5% ✓' : `the null is false (truth ${M.t}): these are powers`);
          }
          return s;
        });
        function half0(M, n, D) { return 4.2 / Math.sqrt(D.I0); }
      },
    },
    // ───────────────────────────────────────────────────────────── 5.6
    {
      num: '5.6',
      kind: 'Theorem',
      name: 'Multiparameter asymptotics and the delta method',
      statement: String.raw`Let $\theta\in\Theta\subseteq\R^k$ (open) index a regular family with Fisher information matrix $I(\theta)=\operatorname{Cov}_\theta\nabla_\theta\log f(X\mid\theta)=-E_\theta\nabla^2_\theta\log f(X\mid\theta)$, positive definite at the truth (stat-4.6). Under the multivariate analogues of the conditions of stat-5.2, a consistent root of the likelihood equations satisfies
$$\sqrt n\,(\hat\theta_n-\theta)\ \xrightarrow{d}\ N_k\big(0,\,I(\theta)^{-1}\big).$$
If $g:\Theta\to\R$ is differentiable at $\theta$ with $\nabla g(\theta)\ne0$, the **multivariate delta method** gives
$$\sqrt n\,\big(g(\hat\theta_n)-g(\theta)\big)\ \xrightarrow{d}\ N\big(0,\ \nabla g(\theta)^{\top}I(\theta)^{-1}\nabla g(\theta)\big),$$
and $g(\hat\theta_n)$ is the MLE of $g(\theta)$ (stat-3.6), asymptotically efficient. Example: for $N(\mu,\sigma^2)$ in the parameters $(\mu,\sigma)$, $I^{-1}=\operatorname{diag}(\sigma^2,\sigma^2/2)$, and the coefficient of variation $c=\sigma/\mu$ has asymptotic variance $c^4+c^2/2$.`,
      idea: String.raw`The one-parameter proof goes through with vectors: a Taylor expansion of the score vector, the multivariate CLT for the score (covariance $I$), the law of large numbers for the Hessian (mean $-I$), and Slutsky give $\sqrt n(\hat\theta-\theta)\approx I^{-1}\,n^{-1/2}\nabla\ell_n(\theta)\sim N(0,I^{-1}II^{-1})=N(0,I^{-1})$. The delta method (stat-1.15) then linearizes: $g(\hat\theta)-g(\theta)\approx\nabla g^\top(\hat\theta-\theta)$, a linear image of a normal vector. Geometrically, the level sets of $g$ are replaced by parallel hyperplanes through the cloud of estimates; the approximation is good when the cloud is small compared with the curvature of the level sets, and fails when $\nabla g$ blows up, as $\sigma/\mu$ does near $\mu=0$.`,
      caption: String.raw`Left: 1,500 joint MLEs $(\hat\mu,\hat\sigma)$ from normal samples (gold) inside the 1- and 2-SD ellipses of $N(\theta,I^{-1}/n)$ (green). Purple: level lines of the coefficient of variation $\sigma/\mu$ (rays from the origin) at $c$ and $c\pm1,2$ delta-method SDs; dashed: their linearizations, parallel lines. Right: the histogram of $\hat\sigma/\hat\mu$ against the delta-method normal law. Drag the truth (green handle) toward $\mu=0$: the rays fan out across the cloud, the linearization breaks, and the histogram grows a long tail. Raising $n$ shrinks the cloud and restores the approximation.`,
      deps: ['stat-5.2', 'stat-1.15', 'stat-4.6'],
      see: ['stat-3.6'],
      refs: ['Wasserman §9.10'],
      tags: ['delta method', 'multiparameter', 'Fisher information'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Delta_method#Multivariate_delta_method' },
      viz(v) {
        const nS = v.slider('sample size $n$', 5, 300, 25, { int: true, log: true });
        const sL = v.stage({ x: [-0.6, 4], y: [0, 2.6], axes: 'box', gutter: true, height: 370, weight: 1.15, xlabel: '$\\hat\\mu$', ylabel: '$\\hat\\sigma$', title: 'joint MLEs and the information ellipse' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 370, weight: 0.85, minWidth: 240, xlabel: 'coefficient of variation $\\hat\\sigma/\\hat\\mu$', ylabel: 'density', title: 'a derived parameter and its delta-method law' });
        const hT = sL.handle(2, 0.8, { color: 'green', label: '$(\\mu,\\sigma)$', labelPos: 'ne', constrain: (x, y) => [clamp(x, 0.15, 3.6), clamp(y, 0.3, 1.8)] });
        const REPS = 1500, mc = memo();
        const sim = (mu, sg, n) => mc([mu, sg, n].join('|'), () => {
          const r = v.rng(hashStr(`delta5|${mu}|${sg}|${n}`)), out = [];
          for (let c = 0; c < REPS; c++) { let s = 0, q = 0; for (let i = 0; i < n; i++) { const x = mu + sg * r.normal(); s += x; q += x * x; } const m = s / n; out.push([m, Math.sqrt(Math.max(0, q / n - m * m))]); }
          return out;
        });
        let info = null;
        v.render(() => {
          const mu = +hT.x.toFixed(2), sg = +hT.y.toFixed(2), n = nS.value, D = sim(mu, sg, n), c = sg / mu;
          const vm = (sg * sg) / n, vs = (sg * sg) / (2 * n), sdD = Math.sqrt((c ** 4 + (c * c) / 2) / n);
          // level lines of σ/μ: rays σ = c' μ, and their linearizations (parallel to the ray through the truth)
          const g = [-sg / (mu * mu), 1 / mu], gn = Math.hypot(g[0], g[1]);
          for (const kk of [-2, -1, 1, 2]) {
            const ck = c + kk * sdD;
            sL.fn((m) => ck * m, { domain: [0, 4], color: 'purple', width: 1.4, alpha: 0.55 });
            if (ck < 0) sL.fn((m) => ck * m, { domain: [-0.6, 0], color: 'purple', width: 1.4, alpha: 0.55 });
            // linearization: ∇g·(p − p0) = kk·sdD, a line through p0 + t·∇g/|∇g|² · kk·sdD with direction ⟂ ∇g
            const off = (kk * sdD) / (gn * gn), px = mu + g[0] * off, py = sg + g[1] * off, d = [g[1] / gn, -g[0] / gn];
            sL.line(px - 8 * d[0], py - 8 * d[1], px + 8 * d[0], py + 8 * d[1], { color: 'purple', width: 1.2, dash: [5, 4], alpha: 0.7 });
          }
          sL.fn((m) => c * m, { domain: [0, 4], color: 'purple', width: 2.4 });
          sL.dots(D, { r: 1.7, color: 'gold', alpha: 0.45 });
          sL.path(ellipsePts(mu, sg, vm, 0, vs, 1), { color: 'green', width: 2.2 });
          sL.path(ellipsePts(mu, sg, vm, 0, vs, 2), { color: 'green', width: 1.6, dash: [6, 4] });
          sL.dot(0, 0, { r: 3, color: 'ink' });
          // right: histogram of the CV
          const cv = D.map(([m, s]) => s / m), lo = c - 4.5 * sdD, hi = c + 4.5 * sdD, B = binned(cv, lo, hi, 44);
          const pk = phi(0) / sdD;
          sR.setView([lo, hi], [0, Math.max(pk, Math.min(B.max, 2 * pk)) * 1.15]);
          sR.hist(B, { density: true, color: 'gold', fillAlpha: 0.38, width: 1.3 });
          sR.fn((x) => phi((x - c) / sdD) / sdD, { color: 'green', width: 2.6, n: 300 });
          sR.vline(c, { color: 'purple', width: 1.6, dash: [4, 4] });
          const mo = moments(cv), sCV = sortNum(cv);
          const iqrS = (qSorted(sCV, 0.75) - qSorted(sCV, 0.25)) / 1.349;
          v.legend([['gold', '$(\\hat\\mu,\\hat\\sigma)$ and $\\hat\\sigma/\\hat\\mu$', { area: true }], ['green', '$N(\\theta,I^{-1}/n)$ ellipses · delta-method law'], ['purple', 'level lines of $\\sigma/\\mu$ (rays)'], ['purple', 'linearized level lines', { dash: true }]]);
          const r = (() => { let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; for (const [a, b] of D) { sx += a; sy += b; } const mx = sx / D.length, my = sy / D.length; for (const [a, b] of D) { sxx += (a - mx) ** 2; syy += (b - my) ** 2; sxy += (a - mx) * (b - my); } return { vx: sxx / D.length, vy: syy / D.length, r: sxy / Math.sqrt(sxx * syy) }; })();
          info = { mu, sg, n, c, sdD, mo, iqrS, out: B.out, N: D.length, r, vm, vs };
        });
        v.readout(() => {
          if (!info) return '';
          const { mu, sg, n, c, sdD, mo, iqrS, out, N, r, vm, vs } = info;
          return String.raw`$\mu=${v.fix(mu, 2)}$, $\sigma=${v.fix(sg, 2)}$, $n=${n}$: $\mathrm{Var}\,\hat\mu$ ${v.fix(r.vx, 4)} (theory ${v.fix(vm, 4)}), $\mathrm{Var}\,\hat\sigma$ ${v.fix(r.vy, 4)} (theory ${v.fix(vs, 4)}), correlation ${v.fix(r.r, 3)} (theory 0) · $c=\sigma/\mu=${v.fix(c, 3)}$: robust SD of $\hat c$ **${v.fix(iqrS, 4)}**, plain SD ${v.fix(mo.sd, 4)}, delta method $\sqrt{(c^4+c^2/2)/n}=${v.fix(sdD, 4)}$` + (out ? ` · ${pct(out / N)} of the estimates fall outside the window` : '') + (mo.sd > 1.3 * sdD || out / N > 0.01 ? ' · **the linearization fails**: the cloud is not small compared with the curvature of the level sets of σ/μ' : ' · delta method fits ✓');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.7
    {
      num: '5.7',
      kind: 'Theorem',
      name: 'Misspecified MLE converges to the KL projection',
      credit: 'Huber, 1967; White, 1982',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. from a density $g$ that need not belong to the model $\{f(\cdot\mid\theta):\theta\in\Theta\}$. Suppose the **pseudo-true value**
$$\theta^*=\arg\min_{\theta\in\Theta}\mathrm{KL}\big(g\,\|\,f_\theta\big)=\arg\max_{\theta\in\Theta}E_g\log f(X\mid\theta)$$
exists and is unique and well separated, and that $\frac1n\sum\log f(X_i\mid\theta)\to E_g\log f(X\mid\theta)$ uniformly in $\theta$ (as in stat-5.1). Then the MLE computed under the model satisfies $\hat\theta_n\to\theta^*$ in probability: it converges, not to "the truth", which the model cannot express, but to the member of the model closest to the truth in Kullback–Leibler divergence. Example: fitting an exponential model $f(x\mid\lambda)=\lambda e^{-\lambda x}$ to Gamma$(k,1)$ data gives $\hat\lambda_n=1/\bar X_n\to1/k$, since $\mathrm{KL}(g\,\|\,f_\lambda)=\mathrm{const}-\log\lambda+\lambda k$ is minimized at $\lambda=1/E_gX$.`,
      idea: String.raw`The consistency proof of stat-5.1 never used that the data came from the model, except to say where the peak of $E\log f(X\mid\theta)$ is. In general $E_g\log f(X\mid\theta)=-\mathrm{KL}(g\,\|\,f_\theta)-H(g)$, where the entropy $H(g)$ does not depend on $\theta$, so the peak is wherever the KL divergence (info-2.1) is smallest, and the uniform law of large numbers drags the maximizer there. For exponential families the projection matches moments: the fitted model reproduces $E_g T(X)$ for the sufficient statistic $T$, here the mean. This is why maximum likelihood remains meaningful for approximate models, and why its standard errors need repair (stat-5.8).`,
      caption: String.raw`Data from a Gamma$(k,1)$ law (black density, gold histogram of one sample) are fitted with an exponential model. Left: the fitted exponential density (blue) for this sample and the KL projection $f_{\lambda^*}$ (green, dashed): as $n$ grows the fit converges to the green curve, which differs from the truth. Right: the divergence $\mathrm{KL}(g\,\|\,f_\lambda)$ computed by numerical integration (black), its numerical minimizer (green), the moment-matching value $1/k$ (purple), and 400 fitted $\hat\lambda_n$ (gold dots) piling up at the minimizer. Set $k=1$: the model is correct, the minimum divergence is 0 and the projection is the truth.`,
      deps: ['stat-5.1', 'info-2.1'],
      see: ['stat-5.8', 'stat-14.10'],
      refs: ['Wasserman §9.5'],
      tags: ['misspecification', 'Kullback–Leibler', 'maximum likelihood'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasi-maximum_likelihood_estimate' },
      viz(v) {
        const kS = v.slider('true gamma shape $k$', 0.3, 4, 2.5, { log: true, sig: 2 });
        const nS = v.slider('sample size $n$', 10, 5000, 60, { int: true, log: true });
        const sL = v.stage({ x: [0, 10], y: [0, 0.5], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: '$x$', ylabel: 'density', title: 'truth (Gamma), fitted exponential, KL projection' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: '$\\lambda$', ylabel: '$\\mathrm{KL}(g\\,\\|\\,f_\\lambda)$', title: 'the divergence from the model, and the fits' });
        const lgd = (x, k) => (k - 1) * Math.log(x) - x - lgammaF(k);
        // KL(g‖f_λ) = ∫ g (log g − log λ + λx) dx, by Simpson in u = log x (handles the k < 1 singularity at 0)
        const KLnum = (k, lam) => {
          const ua = -40 / k, ub = Math.log(k + 12 * Math.sqrt(k) + 30), N = 2000, h = (ub - ua) / N; let s = 0;
          for (let i = 0; i <= N; i++) { const u = ua + i * h, x = Math.exp(u), lg = lgd(x, k), gx = Math.exp(lg + u); const val = gx * (lg - Math.log(lam) + lam * x); s += val * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2); }
          return (s * h) / 3;
        };
        const mk = memo(), kl = (k) => mk(k, () => { const ls = golden((l) => KLnum(k, l), 1e-3, 20, 70); return { ls, min: KLnum(k, ls) }; });
        const mc = memo();
        const fits = (k, n) => mc(k + '|' + n, () => {
          const r = v.rng(hashStr(`kl5|${k}|${n}`)), G = v.M.dist.gamma(k, 1), lam = [], first = [];
          for (let c = 0; c < 400; c++) { let s = 0; for (let i = 0; i < n; i++) { const x = G.sample(r); s += x; if (c === 0) first.push(x); } lam.push(n / s); }
          return { lam, first };
        });
        const curve = memo();
        let info = null;
        v.render(() => {
          const k = +kS.value.toPrecision(3), n = nS.value, K = kl(k), F = fits(k, n), lh = F.lam[0], ls = K.ls;
          const xmax = k + 4.5 * Math.sqrt(k) + 1.5;
          const gpk = k > 1 ? Math.exp(lgd(k - 1, k)) : Infinity;
          const ytop = Math.min(2, Math.max(Math.min(gpk, 1.6), ls, lh * 0.9)) * 1.15;
          sL.setView([0, xmax], [0, ytop]);
          const B = binned(F.first, 0, xmax, 30);
          sL.hist(B, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          sL.fn((x) => Math.exp(lgd(x, k)), { domain: [1e-4, xmax], color: 'ink', width: 2.6, n: 400 });
          sL.fn((x) => ls * Math.exp(-ls * x), { domain: [0, xmax], color: 'green', width: 2.4, dash: [7, 5], n: 300 });
          sL.fn((x) => lh * Math.exp(-lh * x), { domain: [0, xmax], color: 'accent', width: 2.4, n: 300 });
          // right: KL curve
          const la = ls / 6, lb = ls * 3, top = K.min + 1.1;
          sR.setView([0, lb], [0, top]);
          const C = curve(k, () => { const pts = []; for (let i = 0; i <= 140; i++) { const l = la + ((lb - la) * i) / 140; pts.push([l, KLnum(k, l)]); } return pts; });
          sR.path(C, { color: 'ink', width: 2.6 });
          sR.vline(1 / k, { color: 'purple', width: 1.6, dash: [5, 4] });
          sR.dot(ls, K.min, { r: 5.5, color: 'green' });
          sR.text(`min ${v.fix(K.min, 3)}`, ls, K.min, { color: 'green', size: 11.5, dy: -14, align: 'center', plate: true });
          strip(sR, F.lam, top * 0.9, top * 0.045, { color: 'gold', alpha: 0.5, r: 1.9, seed: 5 });
          sR.dot(lh, top * 0.9, { r: 4.5, color: 'accent' });
          sR.text('400 fits $\\hat\\lambda_n$', qSorted(sortNum(F.lam), 0.995), top * 0.9, { color: 'gold', size: 12, dx: 10, align: 'left', plate: true });
          v.legend([['ink', 'true Gamma$(k,1)$ density · KL curve'], ['gold', 'one sample · 400 fitted $\\hat\\lambda_n$', { area: true }], ['accent', 'fitted exponential $\\hat\\lambda_n$'], ['green', 'KL projection $\\lambda^*$', { dash: true }], ['purple', '$1/k=1/E_gX$', { dash: true }]]);
          const mo = moments(F.lam);
          info = { k, n, ls, min: K.min, mo, lh };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, n, ls, min, mo, lh } = info;
          return String.raw`$k=${v.fix(k, 2)}$, $n=${commas(n)}$: numerical minimizer of the divergence $\lambda^*=${v.fix(ls, 4)}$ vs $1/k=${v.fix(1 / k, 4)}$ · minimum divergence ${v.fix(min, 4)} · this sample's fit $\hat\lambda=${v.fix(lh, 4)}$ · 400 fits: mean **${v.fix(mo.mean, 4)}**, SD ${v.fix(mo.sd, 4)}` + (Math.abs(k - 1) < 0.03 ? ' · **the model is correct**: the projection is the truth and the divergence vanishes' : ' · the fits converge to $\\lambda^*$, the closest exponential, but no exponential is the truth (divergence > 0)');
        });
      },
    },
  ],
};
