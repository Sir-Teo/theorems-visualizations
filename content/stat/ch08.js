// Statistical Inference — Chapter 8: Confidence intervals (items 8.1–8.8; 8.9–8.15 in ch08-b.js)
//
// Part a defines what a confidence interval promises (a coverage probability of the procedure, not of one interval),
// the two universal recipes (pivots and inverted tests), the normal-theory intervals, and then the binomial proportion,
// where the textbook Wald interval behaves erratically and the Wilson and Clopper–Pearson intervals repair it. Every
// coverage claim is shown twice: an exact computation (a binomial or gamma sum) and simulated samples in gold.
// Colours: intervals that contain the truth are green, misses red, the true value is ink, the Wald family orange.
import {
  clamp, commas, pct, hashStr, memo, mean, legender, titler, mulberry, Phi, qnorm, Q, qt, tUp, dt, ibeta, tag, mcse, pfmt,
  binned, area, dbinom, POPS, qchi, chiUp, dchi, gammaPQ,
  CC, zOf, qbeta, waldBin, wilsonBin, cpBin, binIntervals, binCover, binLength, coverCurve, meanSd, tCrit,
} from './ch08.shared.js';

// A bar for one interval at height y; green when it contains `truth`, red otherwise.
function bar(s, lo, hi, y, truth, o = {}) {
  const ok = lo <= truth && truth <= hi;
  s.line(lo, y, hi, y, { color: ok ? CC.cover : CC.miss, width: o.width ?? (ok ? 2 : 2.6), alpha: o.alpha ?? (ok ? 0.85 : 1) });
  if (o.mid !== undefined) s.dot(o.mid, y, { r: 2.2, color: ok ? CC.cover : CC.miss });
  return ok;
}

const gammaCdf = (n, x) => gammaPQ(n, x)[0];

export default {
  collection: 'stat',
  chapter: 8,
  title: 'Confidence intervals',
  summary: String.raw`A confidence interval is a procedure that captures the true parameter in a stated fraction of repetitions: a property of the procedure, not of any single interval. Pivots and the inversion of tests are the two universal recipes. The binomial proportion shows how badly the textbook Wald interval can behave and why the Wilson and exact intervals exist, the variance interval shows how fragile normal theory can be, and Fieller’s ratio problem and relevant subsets mark the limits of the frequentist guarantee.`,
  items: [
    // ───────────────────────────────────────────────────────────── 8.1
    {
      num: '8.1',
      kind: 'Definition',
      name: 'Confidence set and coverage probability',
      credit: 'J. Neyman, 1937',
      statement: String.raw`Let $X\sim P_\theta$ with $\theta\in\Theta$ unknown and let $C(X)\subseteq\Theta$ be a set computed from the data (an interval when $\Theta\subseteq\R$). The **coverage probability** of $C$ at $\theta$ is $P_\theta\big(\theta\in C(X)\big)$, the probability, over repeated samples drawn from the model with that $\theta$, that the random set contains the parameter. $C$ is a **$1-\alpha$ confidence set** when its **confidence coefficient**
$$\inf_{\theta\in\Theta}P_\theta\big(\theta\in C(X)\big)\ \ge\ 1-\alpha .$$
The guarantee concerns the procedure $x\mapsto C(x)$ before the data are seen. After the data are in, the realised interval $C(x)$ either contains the true $\theta$ or it does not; "$95\%$" is not the probability that this interval contains $\theta$.`,
      idea: String.raw`The parameter is a fixed number and the interval is the random object, so the probability in the definition is taken over the sampling distribution of $X$ (stat-1.2), with $\theta$ held fixed. Requiring the infimum over $\Theta$ rather than coverage at one $\theta$ is what makes the claim usable when $\theta$ is unknown: the statistician does not know which $\theta$ generated the data, so the procedure must work for all of them. The picture is the frequency interpretation made literal: draw many samples, build the interval each time, count the share that catch the truth.`,
      caption: String.raw`Left: 100 samples of size $n$ from $N(0,1)$, each giving a $t$-interval for the mean (the true mean 0 is the dark line). Intervals that miss 0 are red. Right: the running proportion of covering intervals over many repetitions (log scale for the number of repetitions) settles on the nominal level. Press **Draw 10,000** to accumulate, **New 100** for a fresh batch of 100, and change $n$ or the level: individual batches fluctuate (about $\sqrt{0.95\cdot0.05/100}\approx2\%$) but the long-run share does not.`,
      deps: ['stat-1.2'],
      refs: ['Casella–Berger §9.1', 'Wasserman §6.3'],
      tags: ['confidence interval', 'coverage', 'frequentist'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confidence_interval' },
      viz(v) {
        const nS = v.slider('sample size $n$', 3, 60, 10, { int: true });
        const lvS = v.select('confidence level', [{ value: '0.8', label: '80%' }, { value: '0.9', label: '90%' }, { value: '0.95', label: '95%' }, { value: '0.99', label: '99%' }], '0.95');
        const sL = v.stage({ x: [-1.7, 1.7], y: [0, 101], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'interval for the mean $\\mu$ (true $\\mu=0$)', ylabel: 'sample number', title: 'one batch of 100 intervals' });
        const sR = v.stage({ x: [1, 100000], y: [0.6, 1], xlog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'number of repetitions', ylabel: 'share that cover', title: 'long-run coverage' });
        const leg = legender(v);
        let batch = 0, key = null, tot = 0, cov = 0, trace = [], ck = 1, rr = null;
        const xs = new Float64Array(60);
        const one = (r, n, c) => { for (let i = 0; i < n; i++) xs[i] = r.normal(); let m = 0; for (let i = 0; i < n; i++) m += xs[i]; m /= n; let q = 0; for (let i = 0; i < n; i++) q += (xs[i] - m) ** 2; return [m, c * Math.sqrt(q / (n - 1)) / Math.sqrt(n)]; };
        const run = (m) => {
          const n = nS.value, c = tCrit(n - 1, +lvS.value);
          for (let i = 0; i < m; i++) { const [mu, h] = one(rr, n, c); tot++; if (Math.abs(mu) <= h) cov++; if (tot >= ck) { trace.push([tot, cov / tot]); ck = Math.max(ck + 1, Math.ceil(ck * 1.12)); } }
        };
        const sync = () => { const k = nS.value + '|' + lvS.value; if (k !== key) { key = k; tot = 0; cov = 0; trace = []; ck = 1; rr = v.rng(hashStr('8.1|' + k)); run(1000); } };
        v.button('New 100', () => { batch++; });
        v.button('Draw 1,000', () => { sync(); run(1000); });
        v.button('Draw 10,000', () => { sync(); run(10000); });
        let st = null;
        v.render(() => {
          sync();
          const n = nS.value, lv = +lvS.value, c = tCrit(n - 1, lv), r = v.rng(hashStr(`8.1b|${n}|${batch}`));
          let hit = 0;
          sL.vline(0, { color: CC.truth, width: 1.6 });
          for (let i = 1; i <= 100; i++) { const [m, h] = one(r, n, c); if (bar(sL, m - h, m + h, i, 0, { mid: m })) hit++; }
          sR.hline(lv, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.text(`nominal ${pct(lv, 0)}`, 1.5, lv, { color: 'muted', size: 11, align: 'left', dy: -9 });
          if (trace.length) sR.path(trace, { color: CC.sim, width: 2.2 });
          const last = trace.length ? trace[trace.length - 1] : [1, 0];
          sR.dot(last[0], last[1], { r: 4.5, color: CC.sim });
          leg([[CC.cover, 'interval covers 0'], [CC.miss, 'interval misses 0'], [CC.sim, 'running coverage', { dot: true }]]);
          st = { hit, n, lv, tot, cov };
        });
        v.readout(() => {
          if (!st) return '';
          const { hit, n, lv, tot, cov } = st;
          return `This batch: **${hit} of 100** intervals cover $\\mu=0$ (${100 - hit} red). Over ${commas(tot)} repetitions: ${commas(cov)} cover, a share of **${v.fix(cov / tot, 4)}** against the nominal ${v.fix(lv, 2)} (Monte Carlo error $\\pm$ ${v.fix(2 * mcse(lv, tot), 4)}).\nThe ${pct(lv, 0)} describes the *procedure* with $n=${n}$; any one red or green bar either contains $0$ or not.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.2
    {
      num: '8.2',
      kind: 'Method',
      name: 'Pivotal quantities',
      statement: String.raw`A **pivotal quantity** (pivot) is a function $Q(X,\theta)$ of the data and the parameter whose distribution does not depend on $\theta$ (or on any other unknown parameter). If $a,b$ satisfy $P(a\le Q(X,\theta)\le b)=1-\alpha$ for every $\theta$, then
$$C(X)=\{\theta:\ a\le Q(X,\theta)\le b\}$$
is a $1-\alpha$ confidence set, with coverage exactly $1-\alpha$ at every $\theta$. For a normal sample $X_1,\dots,X_n\sim N(\mu,\sigma^2)$, the quantity $T=(\bar X-\mu)/(S/\sqrt n)$ is a pivot for $\mu$ with the Student law $t_{n-1}$ (stat-1.10), and $(n-1)S^2/\sigma^2\sim\chi^2_{n-1}$ is a pivot for $\sigma^2$, whereas $\bar X-\mu$ alone is not a pivot when $\sigma$ is unknown.`,
      idea: String.raw`The distribution of the pivot is known and free of unknowns, so its quantiles $a,b$ can be tabulated once and for all. Because the pivot is a monotone function of $\theta$ for each fixed $x$, the event "$a\le Q\le b$" can be solved for $\theta$ to give an interval; the coverage of that interval is the probability of the pivot event, $1-\alpha$, by construction. For the normal mean the independence of $\bar X$ and $S$ (stat-1.9) is what makes $T$'s law free of $\sigma$.`,
      caption: String.raw`Three populations with different means $\mu\in\{-3,0.5,4\}$ (blue, orange, purple), each simulated 3,000 times at the chosen $n$ and $\sigma$. Left: the histograms of $\bar X$ sit in different places, so $\bar X$ is not a pivot. Right: the histograms of $T=(\bar X-\mu)/(S/\sqrt n)$ lie on top of one another and follow the $t_{n-1}$ density (black), whatever $\mu$ and $\sigma$. The quantile lines $\pm t^*$ are the cut points whose inversion gives the interval. Change $\sigma$: the left histograms widen, the right ones do not move.`,
      deps: ['stat-8.1'],
      refs: ['Casella–Berger §9.2'],
      tags: ['pivot', 'Student t', 'confidence interval'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pivotal_quantity' },
      viz(v) {
        const nS = v.slider('sample size $n$', 3, 40, 8, { int: true });
        const sgS = v.slider('true $\\sigma$', 0.5, 3, 1, { step: 0.05 });
        const MU = [-3, 0.5, 4], COL = ['accent', 'orange', 'purple'], NR = 3000;
        const sL = v.stage({ x: [-9, 11], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$\\bar X$', ylabel: 'density', title: 'not a pivot: the law of $\\bar X$ moves with $\\mu$' });
        const sR = v.stage({ x: [-5, 5], y: [0, 0.45], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: '$T=(\\bar X-\\mu)/(S/\\sqrt n)$', ylabel: 'density', title: 'a pivot: the law of $T$ is the same' });
        const leg = legender(v);
        const mc = memo();
        const sims = (n, sg) => mc(n + '|' + sg, () => {
          const r = v.rng(hashStr(`8.2|${n}|${sg}`)), xs = new Float64Array(n), out = [];
          for (const mu of MU) { const xb = [], ts = []; for (let t = 0; t < NR; t++) { for (let i = 0; i < n; i++) xs[i] = mu + sg * r.normal(); const [m, s] = meanSd(xs); xb.push(m); ts.push((m - mu) / (s / Math.sqrt(n))); } out.push({ xb, ts }); }
          return out;
        });
        let st = null;
        v.render(() => {
          const n = nS.value, sg = sgS.value, S = sims(n, sg), df = n - 1, c = tCrit(df, 0.95);
          const Bs = S.map((o) => binned(o.xb, -9, 11, 80)), top = Math.max(...Bs.map((b) => b.max)) * 1.15;
          sL.setView([-9, 11], [0, top]);
          Bs.forEach((b, k) => sL.hist(b, { density: true, color: COL[k], fillAlpha: 0.28, width: 1.2 }));
          MU.forEach((mu, k) => sL.vline(mu, { color: COL[k], width: 1.4, dash: [4, 4] }));
          const Ts = S.map((o) => binned(o.ts, -5, 5, 60)), top2 = Math.min(0.9, Math.max(dt(0, df) * 1.25, ...Ts.map((b) => b.max * 1.05)));
          sR.setView([-5, 5], [0, top2]);
          area(sR, (x) => dt(x, df), -5, -c, 'red', 0.3); area(sR, (x) => dt(x, df), c, 5, 'red', 0.3);
          Ts.forEach((b, k) => sR.hist(b, { density: true, color: COL[k], fillAlpha: 0.2, width: 1.2 }));
          sR.fn((x) => dt(x, df), { domain: [-5, 5], color: 'ink', width: 2.4, n: 300 });
          sR.vline(c, { color: 'red', width: 1.4, dash: [5, 4] }); sR.vline(-c, { color: 'red', width: 1.4, dash: [5, 4] });
          leg([[COL[0], '$\\mu=-3$', { area: true }], [COL[1], '$\\mu=0.5$', { area: true }], [COL[2], '$\\mu=4$', { area: true }], ['ink', '$t_{n-1}$ density'], ['red', '$\\pm t^*$: 2.5% in each tail', { area: true }]]);
          st = { c, n, cov: S.map((o) => o.ts.filter((t) => Math.abs(t) <= c).length / NR), sd: S.map((o) => Math.sqrt(o.xb.reduce((a, x) => a + (x - mean(o.xb)) ** 2, 0) / NR)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { c, n, cov, sd } = st;
          return `$t^*=t_{${n - 1},\\,0.975}=${v.fix(c, 3)}$ · share of the 3,000 values of $T$ inside $\\pm t^*$: ${cov.map((x) => v.fix(x, 3)).join(', ')} (all ≈ 0.95, whatever $\\mu$) · SD of $\\bar X$ is about ${v.fix(sd[0], 2)} in each group, centred at three different places.\nInverting $-t^*\\le(\\bar X-\\mu)/(S/\\sqrt n)\\le t^*$ for $\\mu$ gives $\\bar X\\pm t^*S/\\sqrt n$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.3
    {
      num: '8.3',
      kind: 'Method',
      name: 'z- and t-intervals for a mean',
      credit: 'W. S. Gosset (“Student”), 1908 (the t distribution)',
      statement: String.raw`For $X_1,\dots,X_n\sim N(\mu,\sigma^2)$ i.i.d.: if $\sigma$ is known, $\bar X\pm z_{1-\alpha/2}\,\sigma/\sqrt n$ is an exact $1-\alpha$ interval for $\mu$. If $\sigma$ is unknown, the **$t$-interval** $\bar X\pm t_{n-1,1-\alpha/2}\,S/\sqrt n$ is exact, while the **plug-in $z$-interval** $\bar X\pm z_{1-\alpha/2}\,S/\sqrt n$ has coverage $P(|T_{n-1}|\le z_{1-\alpha/2})<1-\alpha$, which is only $88\%$ for a nominal $95\%$ when $n=5$. For non-normal data with finite variance both intervals have coverage tending to $1-\alpha$ as $n\to\infty$ (central limit theorem and Slutsky's theorem), but at a given $n$ the coverage can be well below nominal for skewed populations.`,
      idea: String.raw`The $t$ interval inverts the pivot of 8.2: its coverage is exact because $T\sim t_{n-1}$. Replacing the $t$ quantile by the normal one ignores the extra variability from estimating $\sigma$ by $S$; the $t$ law has heavier tails, so $\pm1.96$ cuts off more than 5% of it when $n$ is small. When the data are skewed, $\bar X$ and $S$ are no longer independent and $T$ is itself skewed (stat-1.9 fails), so even the $t$ interval undercovers at small $n$ and its error shrinks only like $1/\sqrt n$.`,
      caption: String.raw`Left: exact coverage of the plug-in $z$-interval against $n$ for normal data (orange curve; the $t$-interval is the flat line at 95%), with simulated coverage of both intervals for the population you choose (dots, 3,000 samples per $n$). Right: simulated values of the studentised mean $T=(\bar X-\mu)/(S/\sqrt n)$ at the chosen $n$, with the $t_{n-1}$ density, the $N(0,1)$ density and the cut points $\pm1.96$ (orange) and $\pm t^*$ (blue). Switch to the skewed populations and watch the histogram lean away from both curves.`,
      deps: ['stat-8.2', 'stat-1.10'],
      refs: ['Casella–Berger §9.2'],
      tags: ['t-interval', 'Student t', 'robustness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Student%27s_t-distribution#Confidence_intervals' },
      viz(v) {
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'expo', label: 'exponential' }, { value: 'lognormal', label: 'lognormal (very skewed)' }], 'normal');
        const nS = v.slider('sample size $n$', 2, 60, 5, { int: true });
        const sL = v.stage({ x: [2, 60], y: [0.7, 1], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'sample size $n$', ylabel: 'coverage', title: 'coverage of nominal 95% intervals' });
        const sR = v.stage({ x: [-5, 5], y: [0, 0.45], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'studentised mean $T$', ylabel: 'density', title: 'law of $T$ at this $n$' });
        const leg = legender(v);
        const NG = [2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 60], NR = 3000;
        const Tstat = (r, P, n) => { let s = 0, q = 0; const x = new Float64Array(n); for (let i = 0; i < n; i++) { x[i] = P.draw(r); s += x[i]; } const m = s / n; for (let i = 0; i < n; i++) q += (x[i] - m) ** 2; return m / Math.sqrt(q / (n - 1) / n); };
        const mc = memo(), mc2 = memo();
        const grid = (pop) => mc(pop, () => NG.map((n) => { const r = v.rng(hashStr(`8.3|${pop}|${n}`)), P = POPS[pop], c = tCrit(n - 1, 0.95); let cz = 0, ct = 0; for (let t = 0; t < NR; t++) { const T = Math.abs(Tstat(r, P, n)); if (T <= 1.96) cz++; if (T <= c) ct++; } return [n, cz / NR, ct / NR]; }));
        const sample = (pop, n) => mc2(pop + '|' + n, () => { const r = v.rng(hashStr(`8.3s|${pop}|${n}`)), P = POPS[pop], a = []; for (let t = 0; t < 6000; t++) a.push(Tstat(r, P, n)); return a; });
        const exactZ = (n) => 1 - 2 * tUp(1.96, n - 1);
        let st = null;
        v.render(() => {
          const pop = popS.value, n = nS.value, G = grid(pop), c = tCrit(n - 1, 0.95), T = sample(pop, n);
          const ex = []; for (let k = 0; k <= 100; k++) { const nn = Math.round(2 * 30 ** (k / 100)); ex.push([nn, exactZ(nn)]); }
          sL.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.path(ex, { color: CC.wald, width: 2.2 });
          sL.dots(G.map((g) => [g[0], g[1]]), { r: 4, color: CC.wald });
          sL.dots(G.map((g) => [g[0], g[2]]), { r: 4, color: CC.wilson });
          sL.path(G.map((g) => [g[0], g[2]]), { color: CC.wilson, width: 1.2, alpha: 0.6 });
          sL.vline(n, { color: 'faint', width: 1.4 });
          const B = binned(T, -5, 5, 60), top = Math.min(0.9, Math.max(0.42, B.max * 1.08));
          sR.setView([-5, 5], [0, top]);
          sR.hist(B, { density: true, color: CC.sim, fillAlpha: 0.3, width: 1.2 });
          sR.fn((x) => dt(x, n - 1), { domain: [-5, 5], color: 'ink', width: 2.4, n: 300 });
          sR.fn((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), { domain: [-5, 5], color: 'muted', width: 1.6, dash: [5, 4], n: 200 });
          sR.vline(1.96, { color: CC.wald, width: 1.6 }); sR.vline(-1.96, { color: CC.wald, width: 1.6 });
          sR.vline(c, { color: CC.wilson, width: 1.6, dash: [5, 4] }); sR.vline(-c, { color: CC.wilson, width: 1.6, dash: [5, 4] });
          leg([[CC.wald, 'plug-in $z$ (±1.96)'], [CC.wilson, '$t$-interval (±$t^*$)'], ['ink', '$t_{n-1}$ density'], ['muted', '$N(0,1)$', { dash: true }], [CC.sim, 'simulated $T$', { area: true }]]);
          const cz = T.filter((t) => Math.abs(t) <= 1.96).length / T.length, ct = T.filter((t) => Math.abs(t) <= c).length / T.length;
          st = { n, c, cz, ct, ez: exactZ(n), pop };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, c, cz, ct, ez } = st;
          return `$n=${n}$: $t^*=${v.fix(c, 3)}$ against $z=1.960$. Simulated coverage of the plug-in $z$-interval **${v.fix(cz, 3)}**, of the $t$-interval **${v.fix(ct, 3)}** (6,000 samples, ± ${v.fix(2 * mcse(0.95, 6000), 3)}). For normal data the exact values are ${v.fix(ez, 3)} and 0.950.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.4
    {
      num: '8.4',
      kind: 'Theorem',
      name: 'Duality of tests and confidence sets',
      credit: 'J. Neyman, 1937',
      statement: String.raw`For each $\theta_0\in\Theta$ let $A(\theta_0)$ be the acceptance region of a test of $H_0:\theta=\theta_0$ with level $\alpha$, that is $P_{\theta_0}\big(X\in A(\theta_0)\big)\ge1-\alpha$. Then
$$C(x)=\{\theta_0:\ x\in A(\theta_0)\}$$
is a $1-\alpha$ confidence set for $\theta$. Conversely, if $C(X)$ is a $1-\alpha$ confidence set, then $A(\theta_0)=\{x:\theta_0\in C(x)\}$ is the acceptance region of a level-$\alpha$ test of $H_0:\theta=\theta_0$. The two statements are the same set, $\{(x,\theta):x\in A(\theta)\}=\{(x,\theta):\theta\in C(x)\}\subseteq\mathcal X\times\Theta$, read in the two directions. Inverting a family of tests with good power gives intervals with a small probability of covering false values.`,
      idea: String.raw`Coverage at $\theta_0$ is exactly the probability under $\theta_0$ of the event $\theta_0\in C(X)$, and this event is $X\in A(\theta_0)$ by the definition of $C$; so the type I error of the test is one minus the coverage. The proof is a re-reading of a single set in the product space $\mathcal X\times\Theta$, cut vertically (fix $\theta$: acceptance region) or horizontally (fix $x$: confidence set). Different tests give different intervals from the same data: inverting the exact equal-tailed test gives Clopper–Pearson (8.8), the score test gives Wilson (8.7), and the Wald test gives the Wald interval (8.5).`,
      caption: String.raw`Binomial model, $X\sim\mathrm{Bin}(15,\theta)$. Each column of the shaded picture is the acceptance region $A(\theta)$ of the test chosen (blue = accepted values of $x$). Move the observed count $x$ (slider): the green segment on the row $x$ is the confidence set, the $\theta$ whose columns are shaded at height $x$. Drag the handle along the $\theta$ axis: the green dots show $A(\theta_0)$, and the readout checks that "$x\in A(\theta_0)$" and "$\theta_0\in C(x)$" agree.`,
      deps: ['stat-8.1', 'stat-6.2'],
      refs: ['Casella–Berger §9.2'],
      tags: ['duality', 'confidence interval', 'hypothesis test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confidence_interval#Relation_to_hypothesis_testing' },
      viz(v) {
        const NB = 15;
        const tS = v.select('test being inverted', [{ value: 'exact', label: 'exact (equal tails)' }, { value: 'score', label: 'score' }, { value: 'wald', label: 'Wald' }], 'exact');
        const lvS = v.slider('level $1-\\alpha$', 0.8, 0.99, 0.95, { step: 0.01 });
        const xS = v.slider('observed count $x$', 0, NB, 4, { int: true });
        const s = v.stage({ x: [0, 1], y: [-0.5, NB + 0.5], axes: 'box', gutter: true, height: 420, full: true, xlabel: 'hypothesised $\\theta_0$', ylabel: 'count $x$', title: 'acceptance regions (columns) and the confidence set (row)', yticks: Array.from({ length: NB + 1 }, (_, i) => i) });
        const h = s.handle(0.35, NB + 0.05, { color: CC.sim, label: '$\\theta_0$', constrain: (x) => [clamp(x, 0.01, 0.99), NB + 0.05] });
        const leg = legender(v);
        // acceptance of count x for hypothesised th under the chosen test
        const acc = (test, lv, x, th) => {
          const a = 1 - lv;
          if (test === 'exact') { let lo = 0, hi = 0; for (let j = 0; j <= x; j++) lo += dbinom(j, NB, th); for (let j = x; j <= NB; j++) hi += dbinom(j, NB, th); return lo > a / 2 && hi > a / 2; }
          const p = x / NB, z = zOf(lv);
          if (test === 'score') return Math.abs(p - th) <= z * Math.sqrt((th * (1 - th)) / NB);
          return Math.abs(p - th) <= z * Math.sqrt((p * (1 - p)) / NB) && p > 0 && p < 1;
        };
        const setOf = (test, lv, x) => { let lo = null, hi = null; for (let i = 1; i < 1000; i++) { const th = i / 1000; if (acc(test, lv, x, th)) { if (lo === null) lo = th; hi = th; } } return lo === null ? null : [lo, hi]; };
        let st = null;
        v.render(() => {
          const test = tS.value, lv = lvS.value, x = xS.value, G = v.rgb('accent');
          s.raster((th, y) => { const k = Math.round(y); if (th <= 0 || th >= 1 || k < 0 || k > NB) return null; return acc(test, lv, k, th) ? [G[0], G[1], G[2], 90] : null; }, { res: 3, key: `${test}|${lv}|${v.color('accent')}` });
          for (let k = 0; k <= NB; k++) s.hline(k, { color: 'grid', width: 0.6, alpha: 0.5 });
          const C = setOf(test, lv, x);
          s.hline(x, { color: CC.sim, width: 1.2, alpha: 0.9 });
          if (C) { s.line(C[0], x, C[1], x, { color: CC.cover, width: 5 }); s.vline(C[0], { color: CC.cover, width: 1, dash: [3, 4], alpha: 0.7 }); s.vline(C[1], { color: CC.cover, width: 1, dash: [3, 4], alpha: 0.7 }); }
          s.vline(h.x, { color: CC.sim, width: 1.4, dash: [4, 4] });
          const A = []; for (let k = 0; k <= NB; k++) if (acc(test, lv, k, h.x)) { A.push(k); s.dot(h.x, k, { r: 4, color: CC.cover }); }
          leg([['accent', 'accepted: $x\\in A(\\theta)$', { area: true }], [CC.cover, 'confidence set $C(x)$'], [CC.sim, 'observed $x$ and $\\theta_0$']]);
          const inC = C ? h.x >= C[0] && h.x <= C[1] : false;
          st = { test, x, C, A, th: h.x, a: acc(test, lv, x, h.x), inC };
        });
        v.readout(() => {
          if (!st) return '';
          const { x, C, A, th, a, inC } = st;
          const cs = C ? `[${v.fix(C[0], 3)},\\ ${v.fix(C[1], 3)}]` : '\\emptyset';
          return `Observed $x=${x}$: confidence set $C(x)\\approx${cs}$ (reading row $x$). At $\\theta_0=${v.fix(th, 3)}$ the test accepts $x\\in\\{${A.length ? A[0] + (A.length > 1 ? '\\dots' + A[A.length - 1] : '') : ''}\\}$.\n"$x\\in A(\\theta_0)$": **${a ? 'yes' : 'no'}** · "$\\theta_0\\in C(x)$": **${inC ? 'yes' : 'no'}** — ${a === inC ? 'the two always agree (it is one set read two ways).' : 'differs only because the grid for $C$ is 0.001 wide.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.5
    {
      num: '8.5',
      kind: 'Method',
      name: 'Wald interval',
      credit: 'A. Wald, 1943 (the Wald test, whose inversion this is)',
      statement: String.raw`Let $\hat\theta$ be asymptotically normal with $(\hat\theta-\theta)/\widehat{\mathrm{se}}\Rightarrow N(0,1)$, as the maximum likelihood estimator is under regularity (stat-5.5), with $\widehat{\mathrm{se}}=1/\sqrt{nI(\hat\theta)}$ or the observed-information version. The **Wald interval** is
$$\hat\theta\pm z_{1-\alpha/2}\,\widehat{\mathrm{se}},$$
with asymptotic coverage $1-\alpha$. It is symmetric about $\hat\theta$ and its endpoints can leave the parameter space. The coverage at a finite $n$ depends on the parametrisation: the Wald interval for $\log\theta$, transformed back, is a different interval with a different coverage, and the approximation is poor when the likelihood is skewed. Example: for $X_i$ exponential with mean $\theta$, $\hat\theta=\bar X$, $\widehat{\mathrm{se}}=\bar X/\sqrt n$, and the exact coverage at $\theta=1$ is $P\big(n/(1+c)\le S\le n/(1-c)\big)$ with $c=z/\sqrt n$ and $S\sim\mathrm{Gamma}(n,1)$ (the upper limit is $\infty$ when $c\ge1$).`,
      idea: String.raw`The interval is the inversion of the Wald test, which treats the log-likelihood as the parabola $\ell(\hat\theta)-\tfrac12(\theta-\hat\theta)^2/\widehat{\mathrm{se}}^2$ matching its curvature at the peak. For small $n$ the real log-likelihood is lopsided, the standard error is estimated from the same sample as $\hat\theta$ (so it is large exactly when $\hat\theta$ is), and the normal limit has not kicked in. For an exponential mean the likelihood has a long right tail and the symmetric interval misses on the right too often. A parametrisation in which the likelihood is closer to a parabola helps: the interval for $\log\theta$ has better, though still imperfect, coverage; the likelihood-ratio interval (8.9) removes the parametrisation dependence altogether.`,
      caption: String.raw`Exponential data with true mean $\theta=1$ and $n$ observations. Left: log-likelihood of one sample (blue) and the parabola the Wald interval uses (orange, dashed): the likelihood is lopsided, the parabola is not. Middle: exact coverage of the Wald interval for $\theta$ (orange) and for $\log\theta$ (blue), computed from the gamma law of $\sum X_i$, against $n$: both approach 95% from below, slowly. Right: 30 simulated intervals of the chosen kind. Slide $n$ and compare the exact coverage with the simulated share.`,
      deps: ['stat-8.1', 'stat-5.5'],
      refs: ['Wasserman §9.7'],
      tags: ['Wald interval', 'maximum likelihood', 'coverage'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wald_test' },
      viz(v) {
        const nS = v.slider('sample size $n$', 3, 300, 10, { int: true, log: true });
        const scS = v.select('interval', [{ value: 'lam', label: 'Wald for $\\theta$' }, { value: 'log', label: 'Wald for $\\log\\theta$' }], 'lam');
        const sA = v.stage({ x: [0.2, 3], y: [-6, 0.4], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'mean $\\theta$', ylabel: 'log-likelihood $-$ max', title: 'one sample: the likelihood and its parabola' });
        const sB = v.stage({ x: [3, 300], y: [0.8, 1], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: '$n$', ylabel: 'exact coverage', title: 'coverage of the nominal 95% interval' });
        const sC = v.stage({ x: [0, 4], y: [0, 31], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'interval for $\\theta$ (true 1)', ylabel: 'sample', title: '30 simulated intervals' });
        const leg = legender(v);
        const z = 1.959964;
        const covLam = (n) => { const c = z / Math.sqrt(n); return (c >= 1 ? 1 : gammaCdf(n, n / (1 - c))) - gammaCdf(n, n / (1 + c)); };
        const covLog = (n) => { const c = z / Math.sqrt(n); return gammaCdf(n, n * Math.exp(c)) - gammaCdf(n, n * Math.exp(-c)); };
        const mc = memo();
        const samples = (n) => mc('' + n, () => { const r = v.rng(hashStr('8.5|' + n)), out = []; for (let i = 0; i < 2030; i++) { let S = 0; for (let k = 0; k < n; k++) S -= Math.log(1 - r()); out.push(S); } return out; });
        const ival = (sc, S, n, c) => { const t = S / n; return sc === 'lam' ? [t * (1 - c), t * (1 + c)] : [t * Math.exp(-c), t * Math.exp(c)]; };
        let st = null;
        v.render(() => {
          const n = nS.value, sc = scS.value, Ss = samples(n), c = z / Math.sqrt(n);
          const S0 = Ss[0], th = S0 / n, ll = (t) => -n * Math.log(t) - S0 / t - (-n * Math.log(th) - n);
          sA.fn(ll, { domain: [0.2, 3], color: CC.wilson, width: 2.4, n: 300 });
          sA.fn((t) => -0.5 * ((t - th) / (th / Math.sqrt(n))) ** 2, { domain: [0.2, 3], color: CC.wald, width: 2, dash: [5, 4], n: 200 });
          sA.hline(-0.5 * z * z, { color: 'muted', width: 1.2, dash: [3, 4] });
          sA.vline(1, { color: CC.truth, width: 1.4 });
          sA.dot(th, 0, { r: 4.5, color: CC.sim });
          const pa = [], pb = []; for (let k = 0; k <= 80; k++) { const nn = 3 * 100 ** (k / 80); pa.push([nn, covLam(nn)]); pb.push([nn, covLog(nn)]); }
          sB.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sB.path(pa, { color: CC.wald, width: 2.4 }); sB.path(pb, { color: CC.wilson, width: 2.4 });
          sB.vline(n, { color: 'faint', width: 1.4 });
          sC.vline(1, { color: CC.truth, width: 1.6 });
          let hit = 0;
          for (let i = 0; i < 30; i++) { const [lo, hi] = ival(sc, Ss[i], n, c); if (bar(sC, lo, hi, i + 1, 1, { mid: Ss[i] / n })) hit++; }
          let big = 0; for (let i = 0; i < Ss.length; i++) { const [lo, hi] = ival(sc, Ss[i], n, c); if (lo <= 1 && 1 <= hi) big++; }
          leg([[CC.wilson, 'log-likelihood'], [CC.wald, 'Wald parabola', { dash: true }], [CC.wald, 'Wald for $\\theta$'], [CC.wilson, 'Wald for $\\log\\theta$'], [CC.cover, 'covers'], [CC.miss, 'misses']]);
          st = { n, hit, sim: big / Ss.length, a: covLam(n), b: covLog(n), sc };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, hit, sim, a, b, sc } = st;
          return `$n=${n}$: exact coverage of the Wald interval for $\\theta$ is **${v.fix(a, 4)}**, for $\\log\\theta$ **${v.fix(b, 4)}** (nominal 0.95). The ${sc === 'lam' ? 'θ' : 'log θ'} version in 2,030 simulated samples: ${v.fix(sim, 3)} (± ${v.fix(2 * mcse(0.95, 2030), 3)}); ${hit} of the 30 drawn cover.\nThe likelihood in the first panel is skewed to the right while the Wald parabola is symmetric: the quadratic approximation is the source of the shortfall.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.6
    {
      num: '8.6',
      kind: 'Phenomenon',
      name: 'Erratic coverage of the Wald binomial interval',
      credit: 'L. D. Brown, T. T. Cai & A. DasGupta, 2001 (systematic study)',
      statement: String.raw`For $X\sim\mathrm{Bin}(n,p)$ and $\hat p=X/n$, the Wald interval $\hat p\pm z_{1-\alpha/2}\sqrt{\hat p(1-\hat p)/n}$ has exact coverage $c_n(p)=\sum_{x:\ p\in I(x)}\binom nx p^x(1-p)^{n-x}$, a function of $p$ that is **not** close to $1-\alpha$ uniformly in $p$. It tends to $0$ as $p\to0$ or $1$ for fixed $n$ (when $\hat p=0$ the interval is the single point $0$), it dips well below nominal for $p$ near $0$ or $1$ even at $n=100$, it oscillates in $p$ because $X$ is discrete, and at a fixed $p$ it oscillates in $n$ instead of increasing steadily. The coverage is correct only on average, in the limit $n\to\infty$ for each fixed $p\in(0,1)$, and never uniformly in $p$.`,
      idea: String.raw`The normal approximation to the binomial has error of order $1/\sqrt{n\,p(1-p)}$, which is small only when both $np$ and $n(1-p)$ are large; the Wald interval additionally plugs in $\hat p$ for the unknown standard error, so a sample with $\hat p$ near $0$ gets a tiny interval. The jaggedness comes from the lattice: as $p$ moves, the sample counts $x$ whose intervals just contain $p$ enter and leave one at a time, and each carries a discrete lump of probability. The 2001 study by Brown, Cai and DasGupta is the standard reference; the dips are the reason the Wilson and Clopper–Pearson intervals (8.7, 8.8) exist.`,
      caption: String.raw`Left: the exact coverage of the nominal 95% Wald interval as a function of the true $p$, computed by summing binomial probabilities over 1,200 values of $p$ (orange), with the nominal level dashed. Right: the exact coverage at the fixed $p$ you choose, as a function of $n$: it zigzags and can be far below 95% for many $n$. Use the zoom toggle to see the region near 95%.`,
      deps: ['stat-8.5'],
      refs: ['Wasserman §9.7'],
      tags: ['Wald interval', 'binomial', 'coverage'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Normal_approximation_interval_or_Wald_interval' },
      viz(v) {
        const nS = v.slider('sample size $n$', 5, 300, 50, { int: true, log: true });
        const pS = v.slider('fixed $p$ for the right panel', 0.02, 0.5, 0.1, { step: 0.005 });
        const zS = v.toggle('zoom to 0.85–1', false);
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'true proportion $p$', ylabel: 'exact coverage', title: 'coverage of the Wald interval versus $p$' });
        const sR = v.stage({ x: [5, 200], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 260, xlabel: 'sample size $n$', ylabel: 'exact coverage', title: 'at fixed $p$, versus $n$' });
        const leg = legender(v);
        const mc = memo(), mc2 = memo();
        const curve = (n) => mc('' + n, () => coverCurve('wald', n, 0.95, 1200));
        const along = (p) => mc2('' + p, () => { const out = []; for (let n = 5; n <= 200; n++) out.push([n, binCover('wald', n, 0.95, p)]); return out; });
        let st = null;
        v.render(() => {
          const n = nS.value, p0 = pS.value, zoom = zS.value, C = curve(n), D = along(p0), lo = zoom ? 0.85 : 0;
          sL.setView([0, 1], [lo, 1]); sR.setView([5, 200], [lo, 1]);
          sL.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] }); sR.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.path(C, { color: CC.wald, width: 1.8 });
          sL.vline(p0, { color: 'faint', width: 1.2, dash: [3, 4] });
          const cp = binCover('wald', n, 0.95, p0);
          sL.dot(p0, cp, { r: 5, color: CC.sim });
          sR.path(D, { color: CC.wald, width: 1.8 });
          sR.vline(n, { color: 'faint', width: 1.2 }); sR.dot(n, cp, { r: 5, color: CC.sim });
          leg([[CC.wald, 'exact coverage of the Wald interval'], ['muted', 'nominal 0.95', { dash: true }], [CC.sim, 'current $(n,p)$', { dot: true }]]);
          let mn = 1, avg = 0, k = 0, bad = 0; for (const [p, c] of C) { if (p >= 0.05 && p <= 0.95) { mn = Math.min(mn, c); avg += c; k++; if (c < 0.93) bad++; } }
          st = { n, p0, cp, mn, avg: avg / k, bad: bad / k };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, p0, cp, mn, avg, bad } = st;
          return `$n=${n}$: over $p\\in[0.05,0.95]$ the coverage averages **${v.fix(avg, 3)}** but falls as low as **${v.fix(mn, 3)}**; it is below 0.93 for ${pct(bad, 0)} of those $p$. At $p=${v.fix(p0, 3)}$ it is **${v.fix(cp, 3)}** (the gold dot, in both panels).\nFor $p$ near 0 (e.g. $p=0.01$, $n=${n}$): ${v.fix(binCover('wald', n, 0.95, 0.01), 3)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.7
    {
      num: '8.7',
      kind: 'Method',
      name: 'Wilson score interval',
      credit: 'E. B. Wilson, 1927',
      statement: String.raw`For $X\sim\mathrm{Bin}(n,p)$ the **Wilson interval** is the set of $p$ that the score test does not reject:
$$\Big\{p:\ \frac{|\hat p-p|}{\sqrt{p(1-p)/n}}\le z\Big\}=\frac{\hat p+\frac{z^2}{2n}\ \pm\ z\sqrt{\frac{\hat p(1-\hat p)}{n}+\frac{z^2}{4n^2}}}{1+z^2/n},\qquad z=z_{1-\alpha/2}.$$
Solving the quadratic inequality gives the closed form. The centre is pulled from $\hat p$ toward $\frac12$, the interval always lies in $[0,1]$, is never empty or a single point (even for $\hat p\in\{0,1\}$), and its coverage hugs $1-\alpha$ far better than the Wald interval's, including for small $n$ and $p$ near the ends; it is still not exactly $1-\alpha$ everywhere because $X$ is discrete.`,
      idea: String.raw`This is the duality of 8.4 with the score test (stat-6.12): the standard error is evaluated at the hypothesised $p$, not at $\hat p$, so the pivot $(\hat p-p)/\sqrt{p(1-p)/n}$ has a variance that is actually 1 under the hypothesis being tested. Inverting it requires solving a quadratic in $p$, and its roots are the Wilson endpoints. The Wald interval inverts the same statistic with the denominator evaluated at the *estimate*, which is exactly what makes it collapse when $\hat p$ is near the boundary.`,
      caption: String.raw`Right: for the observed count $x$ (slider), the score statistic $|\hat p-p|/\sqrt{p(1-p)/n}$ as a function of the hypothesised $p$ (blue); the Wilson interval is where it lies under the line $z=1.96$ (green), compared with the Wald interval (orange bar). Left: exact coverage curves of Wilson (blue) and Wald (faint orange) for this $n$: Wilson stays near 95% (it oscillates, mostly within a few percent) where Wald plunges near 0 and 1.`,
      deps: ['stat-8.4', 'stat-6.12'],
      refs: ['Casella–Berger §10.4'],
      tags: ['Wilson interval', 'score test', 'binomial'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval' },
      viz(v) {
        const nS = v.slider('sample size $n$', 5, 200, 20, { int: true, log: true });
        const xS = v.slider('observed count $x$', 0, 200, 3, { int: true });
        const sL = v.stage({ x: [0, 1], y: [0.7, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'true proportion $p$', ylabel: 'exact coverage', title: 'exact coverage: Wilson versus Wald' });
        const sR = v.stage({ x: [0, 1], y: [0, 5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'hypothesised $p$', ylabel: 'score statistic', title: 'inverting the score test' });
        const leg = legender(v);
        const mc = memo();
        const curves = (n) => mc('' + n, () => [coverCurve('wald', n, 0.95, 800), coverCurve('wilson', n, 0.95, 800)]);
        const z = 1.959964;
        let st = null;
        v.render(() => {
          const n = nS.value, x = Math.min(xS.value, n), ph = x / n, [Cw, Cs] = curves(n);
          sL.hline(0.95, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.path(Cw, { color: CC.wald, width: 1.4, alpha: 0.6 });
          sL.path(Cs, { color: CC.wilson, width: 2.4 });
          const g = (p) => (p <= 0 || p >= 1 ? Infinity : Math.abs(ph - p) / Math.sqrt((p * (1 - p)) / n));
          const W = wilsonBin(x, n, z), Wa = waldBin(x, n, z);
          sR.fn((p) => Math.min(g(p), 9), { domain: [0.002, 0.998], color: CC.wilson, width: 2.4, n: 500 });
          sR.hline(z, { color: 'red', width: 1.4, dash: [5, 4] });
          sR.text('z = 1.96', 0.99, z, { color: 'red', size: 11, align: 'right', dy: -9 });
          sR.line(W[0], 0.25, W[1], 0.25, { color: CC.cover, width: 6 });
          sR.vline(W[0], { color: CC.cover, width: 1, dash: [3, 4] }); sR.vline(W[1], { color: CC.cover, width: 1, dash: [3, 4] });
          sR.line(Math.max(0, Wa[0]), 0.75, Math.min(1, Wa[1]), 0.75, { color: CC.wald, width: 6 });
          sR.dot(ph, 0, { r: 5, color: CC.sim });
          sR.tex('\\text{Wilson}', Math.min(0.88, W[1] + 0.03), 0.25, { color: 'ink', size: 12, align: 'left' });
          sR.tex('\\text{Wald}', Math.min(0.88, Math.min(1, Wa[1]) + 0.03), 0.75, { color: 'ink', size: 12, align: 'left' });
          // numeric check of the inversion: smallest and largest p on a fine grid with g <= z
          let lo = null, hi = null; for (let i = 1; i < 20000; i++) { const p = i / 20000; if (g(p) <= z) { if (lo === null) lo = p; hi = p; } }
          const mm = (C) => { let m = 1, a = 0, k = 0; for (const [p, c] of C) if (p >= 0.02 && p <= 0.98) { m = Math.min(m, c); a += c; k++; } return [m, a / k]; };
          leg([[CC.wilson, 'Wilson coverage / score statistic'], [CC.wald, 'Wald'], [CC.cover, 'Wilson interval'], ['muted', 'nominal', { dash: true }]]);
          st = { n, x, W, Wa, lo, hi, mw: mm(Cw), ms: mm(Cs) };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, x, W, Wa, lo, hi, mw, ms } = st;
          return `$x=${x}$, $n=${n}$: Wilson interval **[${v.fix(W[0], 3)}, ${v.fix(W[1], 3)}]** from the closed form; scanning the score statistic on a 1/20,000 grid gives [${v.fix(lo ?? NaN, 3)}, ${v.fix(hi ?? NaN, 3)}] (the same set). Wald: [${v.fix(Wa[0], 3)}, ${v.fix(Wa[1], 3)}].\nOver $p\\in[0.02,0.98]$: Wilson coverage min ${v.fix(ms[0], 3)}, mean ${v.fix(ms[1], 3)}; Wald min ${v.fix(mw[0], 3)}, mean ${v.fix(mw[1], 3)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.8
    {
      num: '8.8',
      kind: 'Method',
      name: 'Clopper–Pearson exact interval',
      credit: 'C. J. Clopper & E. S. Pearson, 1934',
      statement: String.raw`For $X\sim\mathrm{Bin}(n,p)$ and observed $x$, the **Clopper–Pearson interval** $[p_L(x),p_U(x)]$ is obtained by inverting two one-sided exact tests: $p_L$ solves $P_{p_L}(X\ge x)=\alpha/2$ and $p_U$ solves $P_{p_U}(X\le x)=\alpha/2$ (with $p_L=0$ for $x=0$ and $p_U=1$ for $x=n$). Equivalently $p_L$ is the $\alpha/2$-quantile of $\mathrm{Beta}(x,\,n-x+1)$ and $p_U$ the $(1-\alpha/2)$-quantile of $\mathrm{Beta}(x+1,\,n-x)$. Its coverage is at least $1-\alpha$ for **every** $p\in(0,1)$ and every $n$; because $X$ is discrete the coverage is typically strictly larger, so the interval is conservative and longer than needed.`,
      idea: String.raw`By the duality of 8.4, each endpoint comes from an exact test: the acceptance region of the equal-tailed test of $p_0$ has size at most $\alpha$ at every $p_0$, so the inverted set has coverage at least $1-\alpha$ with no approximation at all. The binomial upper tail $P_p(X\ge x)$ is an increasing function of $p$, so the equation has a unique root, and the identity between binomial tails and the incomplete beta function turns the root into a beta quantile. The price of the guarantee is lattice conservatism: the nominal size is rarely attained, so the exact coverage runs well above $1-\alpha$.`,
      caption: String.raw`Right: for the observed $x$, the two tail probabilities $P_p(X\ge x)$ (rising) and $P_p(X\le x)$ (falling) as functions of the hypothesised $p$; their crossings with the level $\alpha/2$ are the interval endpoints. Left: exact coverage of Clopper–Pearson (purple) and Wilson (blue): the exact curve never dips below the nominal level but sits well above it. Drag the $p$ slider to compare the expected lengths at a given true $p$.`,
      deps: ['stat-8.4'],
      refs: ['Casella–Berger §9.2'],
      tags: ['Clopper–Pearson', 'exact interval', 'binomial'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Clopper%E2%80%93Pearson_interval' },
      viz(v) {
        const nS = v.slider('sample size $n$', 5, 100, 20, { int: true, log: true });
        const xS = v.slider('observed count $x$', 0, 100, 4, { int: true });
        const lvS = v.select('level', [{ value: '0.9', label: '90%' }, { value: '0.95', label: '95%' }, { value: '0.99', label: '99%' }], '0.95');
        const pS = v.slider('true $p$ (for lengths)', 0.02, 0.98, 0.2, { step: 0.01 });
        const sL = v.stage({ x: [0, 1], y: [0.8, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'true proportion $p$', ylabel: 'exact coverage', title: 'exact coverage: Clopper–Pearson versus Wilson' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'hypothesised $p$', ylabel: 'tail probability', title: 'two one-sided exact tests' });
        const leg = legender(v);
        const mc = memo();
        const curves = (n, lv) => mc(n + '|' + lv, () => [coverCurve('cp', n, lv, 800), coverCurve('wilson', n, lv, 800)]);
        let st = null;
        v.render(() => {
          const n = nS.value, x = Math.min(xS.value, n), lv = +lvS.value, a = 1 - lv, p0 = pS.value, [Cc, Cw] = curves(n, lv);
          sL.setView([0, 1], [Math.min(0.8, lv - 0.1), 1]);
          sL.hline(lv, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.path(Cw, { color: CC.wilson, width: 1.6, alpha: 0.8 }); sL.path(Cc, { color: CC.exact, width: 2.4 });
          sL.vline(p0, { color: 'faint', width: 1.2, dash: [3, 4] });
          const upX = (p) => { let s = 0; for (let j = x; j <= n; j++) s += dbinom(j, n, p); return s; };
          const loX = (p) => { let s = 0; for (let j = 0; j <= x; j++) s += dbinom(j, n, p); return s; };
          sR.fn(upX, { domain: [0.0005, 0.9995], color: CC.cover, width: 2.4, n: 400 });
          sR.fn(loX, { domain: [0.0005, 0.9995], color: CC.miss, width: 2.4, n: 400 });
          sR.hline(a / 2, { color: 'muted', width: 1.3, dash: [5, 4] });
          const I = cpBin(x, n, lv);
          sR.vline(I[0], { color: CC.exact, width: 1.6 }); sR.vline(I[1], { color: CC.exact, width: 1.6 });
          sR.dot(I[0], a / 2, { r: 5, color: CC.exact }); sR.dot(I[1], a / 2, { r: 5, color: CC.exact });
          sR.line(I[0], 0.04, I[1], 0.04, { color: CC.exact, width: 6 });
          leg([[CC.cover, '$P_p(X\\ge x)$'], [CC.miss, '$P_p(X\\le x)$'], [CC.exact, 'Clopper–Pearson'], [CC.wilson, 'Wilson']]);
          const lc = binLength('cp', n, lv, p0), lw = binLength('wilson', n, lv, p0);
          let m = 1, avc = 0, avw = 0, k = 0; for (let i = 0; i < Cc.length; i++) { const p = Cc[i][0]; if (p >= 0.02 && p <= 0.98) { m = Math.min(m, Cc[i][1]); avc += Cc[i][1]; avw += Cw[i][1]; k++; } }
          st = { n, x, lv, I, lc, lw, m, avc: avc / k, avw: avw / k, W: wilsonBin(x, n, zOf(lv)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, x, lv, I, lc, lw, m, avc, avw, W } = st;
          return `$x=${x}$, $n=${n}$: Clopper–Pearson **[${v.fix(I[0], 3)}, ${v.fix(I[1], 3)}]** (length ${v.fix(I[1] - I[0], 3)}); Wilson [${v.fix(W[0], 3)}, ${v.fix(W[1], 3)}] (length ${v.fix(W[1] - W[0], 3)}).\nCoverage over $p\\in[0.02,0.98]$: Clopper–Pearson min **${v.fix(m, 3)}** (nominal ${v.fix(lv, 2)}), mean ${v.fix(avc, 3)}; Wilson mean ${v.fix(avw, 3)}. Expected length at the chosen $p$: Clopper–Pearson ${v.fix(lc, 3)}, Wilson ${v.fix(lw, 3)}.`;
        });
      },
    },
  ],
};
