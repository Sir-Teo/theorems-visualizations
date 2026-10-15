// Statistical Inference — Chapter 3: Point estimation (items 3.1–3.7; 3.8–3.14 in ch03-b.js)
//
// Every estimator is judged by its sampling distribution, so every picture here is built from repeated samples drawn
// from a population the reader controls, seeded by the settings (helpers in ch03.shared.js).
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, medianOf, binned, viewPad, axisLabels,
  legender, titler, repeater, ellipsePts, gammaMLE, gammaLL, trigamma,
} from './ch03.shared.js';

/** Student t with 3 degrees of freedom (variance 3). */
const t3 = (r) => { const z = r.normal(); let c = 0; for (let k = 0; k < 3; k++) { const u = r.normal(); c += u * u; } return z / Math.sqrt(c / 3); };
/** Poisson by multiplication of uniforms (small means). */
const rpois = (r, lam) => { const L = Math.exp(-lam); let k = 0, t = r(); while (t > L) { k++; t *= r(); } return k; };
/** Standard normal CDF from erfc. */
const PhiN = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Nice tick values for a log-scale axis drawn in log units: [[log t, label], …] inside [lo, hi] (natural logs). */
function logTicks(lo, hi) {
  const out = [];
  for (let e = -3; e <= 3; e++) for (const m of [1, 2, 5]) { const t = m * 10 ** e, u = Math.log(t); if (u >= lo && u <= hi) out.push([u, String(Number(t.toPrecision(2)))]); }
  return out;
}

export default {
  collection: 'stat',
  chapter: 3,
  title: 'Point estimation',
  summary: String.raw`An estimator is judged by how far it tends to land from the truth: its mean squared error splits into squared bias plus variance, two quantities that pull against each other, and consistency asks that the error vanish as the sample grows. The method of moments and maximum likelihood are the two general recipes. Maximum likelihood is invariant under reparametrization, reduces in exponential families to matching the mean of the sufficient statistic, and comes with computational tools: Newton's method and Fisher scoring, and the EM algorithm, whose every step provably climbs the likelihood. The chapter also collects the places where the recipes misbehave: likelihoods that are unbounded, nuisance parameters that grow with the sample (Neyman–Scott), and likelihoods with a jump instead of a smooth peak.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Estimator, bias and mean squared error',
      statement: String.raw`Let the data $X=(X_1,\dots,X_n)$ have a law $P_\theta$ that depends on an unknown parameter $\theta\in\Theta\subseteq\R^k$. An **estimator** of $\theta$ is a statistic $\hat\theta=T(X)$: a function of the data alone, which may not involve $\theta$; its value on the observed data is the **estimate**. Judged under repeated sampling from $P_\theta$:

- the **bias** is $\operatorname{bias}_\theta(\hat\theta)=E_\theta\hat\theta-\theta$, and $\hat\theta$ is **unbiased** if the bias is $0$ for every $\theta$;
- the **variance** is $E_\theta\|\hat\theta-E_\theta\hat\theta\|^2$ (the trace of the covariance matrix), and its square root, the SD of the sampling distribution, is the **standard error**;
- the **mean squared error** is $\operatorname{MSE}_\theta(\hat\theta)=E_\theta\|\hat\theta-\theta\|^2$, the average squared distance from the target.

All three are functions of $\theta$. An estimator is better than another at $\theta$ if its MSE there is smaller, and dominates it if its MSE is never larger and is smaller somewhere.`,
      idea: String.raw`An estimator is a recipe, and what is judged is the recipe, not one estimate: the sampling distribution of $\hat\theta$ (stat-1.2) under repeated draws from $P_\theta$. Bias says where that distribution is centred relative to the target, the variance how widely it scatters, and the MSE how far it lands on average, which combines the two (stat-3.2). Because the MSE depends on the unknown $\theta$, there is usually no estimator that is best everywhere: the constant estimator $\hat\theta\equiv\theta_0$ has MSE $0$ at $\theta_0$ and is useless elsewhere. Comparisons therefore need a restriction (unbiasedness, stat-4.8) or a summary of the whole risk function (its maximum, or its average under a prior).`,
      caption: String.raw`Each gold dart is the estimate from one simulated sample of $n$ points scattered around the true centre $\theta$ (the green bullseye: drag it). The red arrow from $\theta$ to the centre of the cloud is the bias; the orange ellipse (two standard deviations) is the spread. Switch the estimator: $X_1$ is unbiased but scattered, $\tfrac12\bar X$ is tight but aimed between $\theta$ and the origin; drag $\theta$ to the origin and its bias disappears. On the right each bar stacks the squared bias (red) on the variance (orange); the black mark is the MSE measured directly (±2 SE) and the green tick its exact value. With heavy tails the median overtakes the mean; with 10% outliers every estimator but $\tfrac12\bar X$ is pulled off target.`,
      deps: ['stat-1.2'],
      see: ['stat-4.8'],
      refs: ['Casella–Berger §7.3', 'Wasserman §6.3'],
      tags: ['estimation', 'bias', 'mean squared error'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bias_of_an_estimator' },
      viz(v) {
        const EST = [
          { key: 'mean', tex: '\\bar X', name: 'sample mean' },
          { key: 'med', tex: '\\mathrm{med}', name: 'coordinatewise median' },
          { key: 'first', tex: 'X_1', name: 'first observation' },
          { key: 'shrink', tex: '\\tfrac12\\bar X', name: 'mean shrunk halfway to the origin' },
        ];
        const OUT = 2.5;
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 't3', label: 'heavy tails ($t_3$)' }, { value: 'cont', label: '10% outliers' }], 'normal');
        const estS = v.select('darts of', EST.map((e) => ({ value: e.key, label: `$${e.tex}$` })), 'mean');
        const nS = v.slider('sample size $n$', 2, 40, 8, { int: true });
        const sB = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 370, weight: 1.1, title: 'one dart per repeated sample' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 370, weight: 0.9, xticks: [], title: 'MSE = squared bias + variance' });
        const th = sB.handle(1.3, 0.9, { color: 'green', label: '$\\theta$', labelPos: 'ne', constrain: (x, y) => [clamp(x, -2.4, 2.4), clamp(y, -2.4, 2.4)] });
        // per-point noise around θ: mean 0 and variance 1 per coordinate, except the outliers, which sit at +OUT in both coordinates
        const noise = (r, pop) => {
          if (pop === 't3') return [t3(r) / Math.sqrt(3), t3(r) / Math.sqrt(3)];
          const z = [r.normal(), r.normal()]; if (pop === 'cont' && r() < 0.1) { z[0] += OUT; z[1] += OUT; } return z;
        };
        const buf = new Float64Array(64);
        const R = repeater(v, {
          key: () => popS.value + '|' + nS.value,
          sample: (r) => { const n = nS.value, xs = new Float64Array(n), ys = new Float64Array(n); for (let i = 0; i < n; i++) { const z = noise(r, popS.value); xs[i] = z[0]; ys[i] = z[1]; } return [xs, ys]; },
          stat: ([xs, ys]) => { const n = xs.length; return [mean(xs), mean(ys), medianOf(xs, n, buf), medianOf(ys, n, buf), xs[0], ys[0]]; },
          init: 500, buttons: [500, 5000], clear: false,
        });
        // exact MSE where it is known (all but the median): per-coordinate bias bx and variance vx of one noisy point
        const exactMSE = (k, pop, n, t) => {
          const vx = pop === 'cont' ? 1 + 0.09 * OUT * OUT : 1, bx = pop === 'cont' ? 0.1 * OUT : 0;
          if (k === 0) return 2 * (bx * bx + vx / n);
          if (k === 2) return 2 * (bx * bx + vx);
          if (k === 3) return 0.25 * ((bx - t[0]) ** 2 + (bx - t[1]) ** 2) + (0.5 * vx) / n;
          return null;
        };
        let info = null;
        v.render(() => {
          const S = R.sync(), V = S.vals, N = V.length, t = [th.x, th.y], pop = popS.value, n = nS.value, sel = EST.findIndex((e) => e.key === estS.value);
          const err = (p, k) => (k === 0 ? [p[0], p[1]] : k === 1 ? [p[2], p[3]] : k === 2 ? [p[4], p[5]] : [(p[0] - t[0]) / 2, (p[1] - t[1]) / 2]);
          const st = EST.map((_, k) => {
            let ex = 0, ey = 0, q = 0, q2 = 0;
            for (const p of V) { const [a, b] = err(p, k); ex += a; ey += b; const s = a * a + b * b; q += s; q2 += s * s; }
            ex /= N; ey /= N; q /= N; q2 /= N;
            let cxx = 0, cxy = 0, cyy = 0; for (const p of V) { const [a, b] = err(p, k); cxx += (a - ex) ** 2; cxy += (a - ex) * (b - ey); cyy += (b - ey) ** 2; }
            cxx /= N; cxy /= N; cyy /= N;
            return { bx: ex, by: ey, b2: ex * ex + ey * ey, var: cxx + cyy, mse: q, se: Math.sqrt(Math.max(0, q2 - q * q) / N), cov: [cxx, cxy, cyy], exact: exactMSE(k, pop, n, t) };
          });
          // the board
          for (let k = 5; k >= 1; k--) sB.circle(t[0], t[1], 0.5 * k, { fill: 'faint', fillAlpha: 0.07, color: 'faint', width: 1 });
          sB.line(t[0] - 2.7, t[1], t[0] + 2.7, t[1], { color: 'faint', width: 1 }); sB.line(t[0], t[1] - 2.7, t[0], t[1] + 2.7, { color: 'faint', width: 1 });
          sB.line(-0.13, 0, 0.13, 0, { color: 'muted', width: 1.6 }); sB.line(0, -0.13, 0, 0.13, { color: 'muted', width: 1.6 });
          sB.text('origin', 0.1, -0.1, { color: 'muted', size: 11, baseline: 'top' });
          const s = st[sel], darts = [];
          for (let i = Math.max(0, N - 2500); i < N; i++) { const e = err(V[i], sel); darts.push([t[0] + e[0], t[1] + e[1]]); }
          sB.dots(darts, { r: 2.1, color: 'gold', alpha: 0.5 });
          const c = [t[0] + s.bx, t[1] + s.by];
          sB.path(ellipsePts(c[0], c[1], s.cov[0], s.cov[1], s.cov[2], 2), { color: 'orange', width: 2.4 });
          if (Math.sqrt(s.b2) > 0.04) {
            sB.arrow(t[0], t[1], c[0], c[1], { color: 'red', width: 2.6 });
            sB.text('bias', (t[0] + c[0]) / 2, (t[1] + c[1]) / 2, { color: 'red', size: 12.5, weight: 700, dx: 8, dy: -8, plate: true });
          }
          sB.dot(c[0], c[1], { r: 4.5, color: 'red' });
          // the bars
          const others = st.filter((_, k) => k !== 2).flatMap((q) => [q.mse + 2 * q.se, q.exact ?? 0]);
          let yTop = Math.max(0.04, ...others) * 1.3;
          if (st[2].mse + 2 * st[2].se < yTop * 1.4) yTop = Math.max(yTop, (st[2].mse + 2 * st[2].se) * 1.12);
          viewPad(sR, [0.45, 4.55], [0, yTop], { left: 42, bottom: 36 });
          const cap = yTop * 0.9;
          st.forEach((q, k) => {
            const x = k + 1, w = 0.3, broken = q.b2 + q.var > cap;
            if (k === sel) sR.rect(x - 0.45, 0, x + 0.45, yTop * 0.99, { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.2, radius: 6 });
            const t1 = Math.min(q.b2, cap), t2 = Math.min(q.b2 + q.var, cap);
            sR.rect(x - w, 0, x + w, t1, { fill: 'red', fillAlpha: 0.75, stroke: false });
            sR.rect(x - w, t1, x + w, t2, { fill: 'orange', fillAlpha: 0.6, stroke: false });
            if (broken) {
              sR.line(x - w - 0.04, cap * 0.86, x + w + 0.04, cap * 0.9, { color: 'panel', width: 5 });
              sR.text(v.fix(q.mse, 2), x, cap, { align: 'center', dy: -10, size: 12, weight: 700 });
            } else {
              sR.line(x, Math.max(0, q.mse - 2 * q.se), x, q.mse + 2 * q.se, { color: 'ink', width: 1.4 });
              sR.line(x - w - 0.07, q.mse, x + w + 0.07, q.mse, { color: 'ink', width: 2.2 });
              if (q.exact != null) sR.line(x + w + 0.02, q.exact, x + w + 0.16, q.exact, { color: 'green', width: 3.2 });
            }
            sR.tex(EST[k].tex, x, 0, { dy: 6, baseline: 'top', size: 15, color: k === sel ? 'accent' : 'ink' });
          });
          let best = 0; st.forEach((q, k) => { if (q.mse < st[best].mse) best = k; });
          info = { st, sel, N, n, best };
        });
        v.legend([['gold', 'one estimate (dart)', { dot: true }], ['red', 'bias · squared bias', { area: true }], ['orange', 'spread (2 SD) · variance', { area: true }], ['ink', 'measured MSE ± 2 SE'], ['green', 'exact MSE']]);
        v.readout(() => {
          if (!info) return '';
          const { st, sel, N, n, best } = info, s = st[sel];
          return String.raw`**${EST[sel].name}** $${EST[sel].tex}$ over ${commas(N)} samples of size ${n}: bias $=(${v.fix(s.bx, 3)},\ ${v.fix(s.by, 3)})$, $\|\mathrm{bias}\|^2=${v.fix(s.b2, 4)}$ · variance $=${v.fix(s.var, 4)}$ · MSE $=${v.fix(s.mse, 4)}\pm${v.fix(2 * s.se, 4)}$` + (s.exact != null ? ` (exact ${v.fix(s.exact, 4)})` : ' (no closed form for the median)') + ` · lowest MSE at this $\\theta$: **$${EST[best].tex}$**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Bias–variance decomposition of the MSE',
      statement: String.raw`For any estimator $\hat\theta$ of a real parameter $\theta$ with $E_\theta\hat\theta^2<\infty$,
$$\operatorname{MSE}_\theta(\hat\theta)=E_\theta(\hat\theta-\theta)^2=\big(E_\theta\hat\theta-\theta\big)^2+\operatorname{Var}_\theta\hat\theta=\operatorname{bias}^2+\text{variance}$$
(for a vector parameter, with $\|\cdot\|^2$ and the trace of the covariance matrix). In particular the MSE of an unbiased estimator is its variance, and a biased estimator beats an unbiased one whenever it saves more variance than it adds squared bias.

Examples. For i.i.d. data with mean $\mu$ and variance $\sigma^2$, $c\bar X$ has $\operatorname{MSE}=(1-c)^2\mu^2+c^2\sigma^2/n$, smallest at $c^*=\mu^2/(\mu^2+\sigma^2/n)<1$. For estimating $\sigma^2$ by $cS^2$, $\operatorname{MSE}=(1-c)^2\sigma^4+c^2\operatorname{Var}S^2$ with $\operatorname{Var}S^2=\sigma^4\big(\tfrac2{n-1}+\tfrac{\kappa}{n}\big)$ ($\kappa$ the excess kurtosis); for normal data the best multiple divides $\sum(X_i-\bar X)^2$ by $n+1$, not by $n-1$ (unbiased) or $n$ (maximum likelihood).`,
      idea: String.raw`Write the error as $\hat\theta-\theta=(\hat\theta-E\hat\theta)+(E\hat\theta-\theta)$: a fluctuation with mean zero plus a constant. Squaring and taking expectations, the cross term is $2(E\hat\theta-\theta)\,E(\hat\theta-E\hat\theta)=0$. This is Pythagoras in $L^2$: the constants and the centred variables are orthogonal, the bias being the component of the error along the constants. Shrinking by a factor $c$ multiplies the variance by $c^2$ and adds a bias proportional to $1-c$; just below $c=1$ the variance falls at first order while the squared bias grows only at second order, so a little shrinkage always helps. How much is best depends on the unknown parameter ($\mu/\sigma$, or the kurtosis), which is why the oracle $c^*$ cannot be used as it stands, and why shrinkage reappears in James–Stein estimation.`,
      caption: String.raw`Left: the sampling distribution of $c\bar X$ (or $cS^2$) from 4,000 simulated samples, with the exact density where it is known (black). Green marks the target, red the centre $E\hat\theta$ (the bias is the gap), orange $\pm1$ SD. Right: exact squared bias (red), variance (orange) and MSE (black) as functions of $c$, with the simulated MSE dashed. Slide $c$ below 1: the variance drops faster than the squared bias rises, and the best factor $c^*$ (green) beats the unbiased $c=1$. Set $\mu=0$ and the best estimator is the constant 0; raise $\mu$ or $n$ and $c^*\to1$. For the variance, change the population: $c^*$ moves with the kurtosis.`,
      deps: ['stat-3.1'],
      see: ['stat-1.3'],
      refs: ['Wasserman §6.3', 'Casella–Berger §7.3'],
      tags: ['estimation', 'bias', 'variance', 'shrinkage'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mean_squared_error' },
      viz(v) {
        const M = v.M;
        const modeS = v.select('estimate', [{ value: 'mean', label: 'the mean by $c\\,\\bar X$' }, { value: 'var', label: 'the variance by $c\\,S^2$' }], 'mean');
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'unif', label: 'uniform' }, { value: 'expo', label: 'skewed' }], 'normal');
        const nS = v.slider('sample size $n$', 2, 40, 5, { int: true });
        const muS = v.slider('true mean $\\mu$ (with $\\sigma=1$)', 0, 2, 0.5, { step: 0.05 });
        const cS = v.slider('shrinkage factor $c$', 0, 1.5, 0.7, { step: 0.01 });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1 });
        const sR = v.stage({ x: [0, 1.5], y: [0, 1], axes: 'box', height: 330, weight: 1, title: 'risk as a function of $c$' });
        const tL = titler(sL), lg = legender(v);
        const KAPPA = { normal: 0, unif: -1.2, expo: 6 };
        const Z = { normal: (r) => r.normal(), unif: (r) => Math.sqrt(12) * (r() - 0.5), expo: (r) => -Math.log(1 - r()) - 1 };
        const R = repeater(v, {
          key: () => [modeS.value, popS.value, nS.value, modeS.value === 'mean' ? muS.value : ''].join('|'),
          sample: (r) => {
            const n = nS.value, z = Z[popS.value], mu = modeS.value === 'mean' ? muS.value : 0, xs = new Float64Array(n); let s = 0;
            for (let i = 0; i < n; i++) { xs[i] = mu + z(r); s += xs[i]; }
            const m = s / n; if (modeS.value === 'mean') return m;
            let q = 0; for (let i = 0; i < n; i++) q += (xs[i] - m) ** 2; return q / (n - 1);
          },
          init: 4000, buttons: [100, 10000],
        });
        let info = null;
        v.render(() => {
          const S = R.sync(), T = S.vals, N = T.length, mode = modeS.value, n = nS.value, c = cS.value, pop = popS.value;
          muS.el.hidden = mode !== 'mean';
          const th = mode === 'mean' ? muS.value : 1, VT = mode === 'mean' ? 1 / n : 2 / (n - 1) + KAPPA[pop] / n;
          const b2 = (k) => (k * th - th) ** 2, vr = (k) => k * k * VT, mse = (k) => b2(k) + vr(k);
          const cStar = (th * th) / (th * th + VT);
          let m = 0; for (const x of T) m += x; m /= N; let vN = 0, dm = 0; for (const x of T) { vN += (x - m) ** 2; dm += (c * x - th) ** 2; } vN /= N; dm /= N;
          const simMSE = (k) => (k * m - th) ** 2 + k * k * vN;
          // left: the sampling distribution of c·T
          const so = sortNum(T), qlo = qSorted(so, 0.002), qhi = qSorted(so, 0.998);
          const lo = Math.min(0, qlo, 1.5 * qlo), hi = Math.max(1.5 * qhi, 1.25 * th, 0.5);
          const B = binned(T, lo, hi, 64, (x) => c * x), B1 = binned(T, lo, hi, 64);
          let exact = null;
          if (c > 0.02) {
            if (pop === 'normal' && mode === 'mean') exact = (y) => (phi((y - c * th) / (c / Math.sqrt(n))) * Math.sqrt(n)) / c;
            else if (pop === 'normal') { const X2 = M.dist.chi2(n - 1); exact = (y) => ((n - 1) / c) * X2.pdf(((n - 1) * y) / c); }
            else if (pop === 'expo' && mode === 'mean') { const G = M.dist.gamma(n, 1 / n); exact = (y) => G.pdf(y / c - th + 1) / c; }
          }
          let peak = B.max; if (exact) for (let i = 0; i <= 300; i++) { const y = exact(lo + ((hi - lo) * i) / 300); if (isFinite(y)) peak = Math.max(peak, y); }
          const yTop = Math.min(peak, 3.2 * Math.max(B1.max, 1e-9)) * 1.3;
          viewPad(sL, [lo, hi], [0, yTop], { left: 36 });
          sL.clip(() => {
            sL.hist(B, { density: true, color: 'gold', fillAlpha: 0.32, width: 1.6 });
            if (exact) sL.fn(exact, { domain: [lo, hi], color: 'ink', width: 2, n: 300 });
          });
          const Ehat = c * m, sd = c * Math.sqrt(vN);
          sL.vline(th, { color: 'green', width: 2.2 }); sL.vline(Ehat, { color: 'red', width: 1.8, dash: [5, 4] });
          const ya = yTop * 0.88, yb = yTop * 0.76;
          if (Math.abs(Ehat - th) > (hi - lo) * 0.012) sL.arrow(th, ya, Ehat, ya, { color: 'red', width: 2.4, head: 8 });
          sL.text('bias', (th + Ehat) / 2, ya, { color: 'red', size: 12, weight: 700, align: 'center', dy: -11, plate: true });
          if (sd > (hi - lo) * 0.01) sL.arrow(Ehat - sd, yb, Ehat + sd, yb, { color: 'orange', width: 2.2, both: true, head: 7 });
          sL.text('±1 SD', Ehat + sd, yb, { color: 'orange', size: 12, weight: 700, dx: 6, align: 'left', plate: true });
          tL(mode === 'mean' ? `${commas(N)} values of $c\\,\\bar X$ ($n=${n}$, target $\\mu=${v.fix(th, 2)}$)` : `${commas(N)} values of $c\\,S^2$ ($n=${n}$, target $\\sigma^2=1$)`);
          axisLabels(sL, mode === 'mean' ? 'c\\,\\bar X' : 'c\\,S^2', null);
          // right: the risk curves
          const yR = Math.max(1e-4, Math.min(1.2 * Math.max(mse(0), mse(1.5)), 3 * mse(1)));
          viewPad(sR, [0, 1.5], [0, yR], { left: 44 });
          sR.clip(() => {
            sR.fn(b2, { domain: [0, 1.5], color: 'red', width: 2.2 });
            sR.fn(vr, { domain: [0, 1.5], color: 'orange', width: 2.2 });
            sR.fn(simMSE, { domain: [0, 1.5], color: 'accent', width: 2, dash: [6, 4] });
            sR.fn(mse, { domain: [0, 1.5], color: 'ink', width: 3 });
          });
          sR.hline(mse(1), { color: 'muted', width: 1.2, dash: [3, 4] });
          sR.text('unbiased ($c=1$)', 1.49, mse(1), { color: 'muted', size: 11.5, align: 'right', dy: 11 });
          if (mode === 'var') { const cm = (n - 1) / n; sR.vline(cm, { color: 'purple', width: 1.4, dash: [4, 4] }); sR.text('MLE', cm, yR * 0.97, { color: 'purple', size: 11.5, weight: 700, align: 'right', dx: -4, baseline: 'top' }); }
          sR.vline(c, { color: 'gold', width: 1.6 });
          for (const [f, col] of [[b2, 'red'], [vr, 'orange'], [mse, 'ink']]) if (f(c) <= yR) sR.dot(c, f(c), { r: 4.5, color: col });
          sR.dot(cStar, mse(cStar), { r: 6.5, color: 'green' });
          sR.text(`c* = ${cStar.toFixed(3)}`, cStar, mse(cStar), { color: 'green', size: 12, weight: 700, dy: 15, align: cStar < 0.2 ? 'left' : 'center', plate: true });
          axisLabels(sR, 'c', null);
          lg([['gold', 'simulated $\\hat\\theta$', { area: true }], ['ink', 'exact density · exact MSE'], ['accent', 'simulated MSE', { dash: true }], ['red', 'bias · squared bias'], ['orange', 'SD · variance'], ['green', 'target · best $c^*$']]);
          info = { mode, n, c, th, b2s: (c * m - th) ** 2, vs: c * c * vN, dm, b2: b2(c), vr: vr(c), cStar, mStar: mse(cStar), m1: mse(1), N, VT };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, gain = 1 - I.mStar / I.m1;
          let s = String.raw`at $c=${v.fix(I.c, 2)}$: squared bias ${v.fix(I.b2s, 4)} + variance ${v.fix(I.vs, 4)} = **${v.fix(I.b2s + I.vs, 4)}**, and the directly averaged squared error is ${v.fix(I.dm, 4)} (exact ${v.fix(I.b2 + I.vr, 4)}) · best $c^*=${v.fix(I.cStar, 3)}$ has MSE ${v.fix(I.mStar, 4)} against ${v.fix(I.m1, 4)} for the unbiased $c=1$ — **${pct(gain, 1)} lower**`;
          if (I.mode === 'var') { const d = (k) => (I.n - 1) / k; s += String.raw` · divisor of $\sum(X_i-\bar X)^2$: $${v.fix(d(I.c), 2)}$ now; the best is $${v.fix(d(I.cStar), 2)}$` + (Math.abs(I.VT - 2 / (I.n - 1)) < 1e-12 ? ` $=n+1$ for normal data` : ''); }
          else if (I.th === 0) s += ' · with $\\mu=0$ the constant estimator 0 is perfect, so $c^*=0$';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Consistency',
      statement: String.raw`A sequence of estimators $\hat\theta_n=T_n(X_1,\dots,X_n)$ is **consistent** for $\theta$ if $\hat\theta_n\to\theta$ in probability under $P_\theta$, for every $\theta$:
$$P_\theta\big(|\hat\theta_n-\theta|>\varepsilon\big)\longrightarrow0\qquad\text{for every }\varepsilon>0,$$
and **strongly consistent** if $\hat\theta_n\to\theta$ almost surely. A sufficient condition is $\operatorname{MSE}_\theta(\hat\theta_n)\to0$, i.e. bias $\to0$ and variance $\to0$. Consistency allows bias at every finite $n$ and needs no moments.

Examples: $\bar X_n$ is consistent for $\mu$ whenever $E|X|<\infty$; the sample median is consistent for the population median when that is unique, but not for the mean of a skewed law; $X_1$ alone is never consistent for a non-degenerate law; for Cauchy data $\bar X_n$ has the same Cauchy law for every $n$, so it is not consistent.`,
      idea: String.raw`Consistency asks that the sampling distribution of $\hat\theta_n$ pile up at $\theta$ as $n$ grows. By Chebyshev's inequality $P(|\hat\theta_n-\theta|>\varepsilon)\le\operatorname{MSE}/\varepsilon^2$, so MSE $\to0$ is enough, and stat-3.2 splits that into bias $\to0$ and variance $\to0$. The weak law of large numbers (prob-2.2.14) and the continuity of $g$ in $g(\bar X_n)$ produce most examples, including the MLE in regular models (stat-5.1). An estimator fails when it stops using new data ($X_1$), when it estimates a different functional (the median of a skewed law is not its mean), or when averaging does not concentrate (the Cauchy mean).`,
      caption: String.raw`Left: 40 sample paths of the estimator as $n$ runs from 1 to 10,000 (log scale), with the sampling distribution of 240 repetitions drawn as a violin at $n=10$, 100, 1,000 and 10,000, and the ε-band around $\theta=1$ in green. Right: the fraction of repetitions outside the band, which must go to 0. The mean and the shrunk mean $\tfrac{n}{n+10}\bar X_n$ (biased at every $n$, still consistent) funnel in; $X_1$ never improves. With skewed data the median converges confidently to the wrong number (red line: the population median); with Cauchy data the mean never settles.`,
      deps: ['stat-3.1'],
      see: ['prob-2.2.14', 'prob-2.4.1', 'stat-5.1'],
      refs: ['Wasserman §6.3', 'Casella–Berger §10.1'],
      tags: ['estimation', 'consistency', 'large samples'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consistent_estimator' },
      viz(v) {
        const M = v.M, TH = 1, NMAX = 10000, REPS = 240, SHOWN = 40;
        const NS = []; for (let k = 0; k <= 48; k++) { const m = Math.round(Math.pow(10, k / 12)); if (!NS.length || m > NS[NS.length - 1]) NS.push(m); }
        const VI = [10, 100, 1000, 10000].map((m) => NS.indexOf(m));
        const popS = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'expo', label: 'skewed' }, { value: 'cauchy', label: 'Cauchy' }], 'normal');
        const estS = v.select('estimator', [{ value: 'mean', label: '$\\bar X_n$' }, { value: 'med', label: 'median' }, { value: 'first', label: '$X_1$' }, { value: 'shr', label: '$\\tfrac{n}{n+10}\\bar X_n$' }], 'mean');
        const epsS = v.slider('$\\varepsilon$', 0.02, 0.5, 0.1, { step: 0.01 });
        let seed = 0; v.button('New paths', () => { seed++; });
        const sL = v.stage({ x: [0.7, 1.6e4], y: [TH - 2.2, TH + 2.2], xlog: true, axes: 'box', height: 360, weight: 1.4, title: 'estimates as the sample grows' });
        const sR = v.stage({ x: [0.7, 1.6e4], y: [-0.03, 1.05], xlog: true, axes: 'box', height: 360, weight: 0.8, minWidth: 230, title: '$P(|\\hat\\theta_n-\\theta|>\\varepsilon)$' });
        const draw = { normal: (r) => r.normal(), expo: (r) => -Math.log(1 - r()) - 1, cauchy: (r) => Math.tan(Math.PI * (r() - 0.5)) };
        const mc = memo();
        const sim = (pop, est, sd) => mc([pop, est, sd].join('|'), () => {
          const r = v.rng(hashStr(`cons|${pop}|${sd}`)), xs = new Float64Array(NMAX), buf = new Float64Array(NMAX), out = [];
          for (let k = 0; k < REPS; k++) {
            for (let i = 0; i < NMAX; i++) xs[i] = TH + draw[pop](r);
            const row = new Float64Array(NS.length);
            if (est === 'med') NS.forEach((m, j) => { row[j] = medianOf(xs, m, buf); });
            else if (est === 'first') row.fill(xs[0]);
            else { let s = 0, i = 0; NS.forEach((m, j) => { while (i < m) s += xs[i++]; row[j] = est === 'shr' ? s / (m + 10) : s / m; }); }
            out.push(row);
          }
          return out;
        });
        // where each estimator actually converges (null = nowhere)
        const limitOf = (pop, est) => (est === 'first' ? null : pop === 'cauchy' ? (est === 'med' ? TH : null) : est === 'med' && pop === 'expo' ? TH + Math.log(2) - 1 : TH);
        // exact miss probabilities where they are easy
        const exactMiss = (pop, est, n, e) => {
          if (pop === 'normal' && est === 'mean') return 2 * (1 - PhiN(M, e * Math.sqrt(n)));
          if (pop === 'normal' && est === 'shr') { const a = n / (n + 10), s = a / Math.sqrt(n); return PhiN(M, (TH - e - a * TH) / s) + 1 - PhiN(M, (TH + e - a * TH) / s); }
          if (pop === 'normal' && est === 'first') return 2 * (1 - PhiN(M, e));
          if (pop === 'cauchy' && (est === 'mean' || est === 'first')) return 1 - (2 / Math.PI) * Math.atan(e);
          if (pop === 'expo' && est === 'first') return 1 - (Math.exp(-(1 - e)) - Math.exp(-(1 + e)));
          return null;
        };
        let info = null;
        v.render(() => {
          const pop = popS.value, est = estS.value, eps = epsS.value, D = sim(pop, est, seed), lim = limitOf(pop, est);
          sL.hband(TH - eps, TH + eps, { color: 'green', alpha: 0.16, edges: true });
          sL.clip(() => {
            for (let k = 0; k < SHOWN; k++) sL.path(NS.map((m, j) => [m, D[k][j]]), { color: 'accent', alpha: 0.32, width: 1.1 });
            // violins: the sampling distribution at four sample sizes
            // kernel density of the 240 values (bandwidth from the robust spread, never below 2 px), drawn as a violin in decades
            const y0 = TH - 2.2, py = 4.4 / sL.height;
            for (const j of VI) {
              const vals = sortNum(D.map((row) => row[j])), iqr = qSorted(vals, 0.75) - qSorted(vals, 0.25);
              const bwd = Math.max(2 * py, 0.9 * Math.min(Math.sqrt(moments(vals).var) || iqr, iqr / 1.34 || 1) * Math.pow(REPS, -0.2));
              const lo = Math.max(y0, qSorted(vals, 0.005) - 3 * bwd), hi = Math.min(y0 + 4.4, qSorted(vals, 0.995) + 3 * bwd), K = 90, dens = [];
              for (let q = 0; q <= K; q++) { const y = lo + ((hi - lo) * q) / K; let d = 0; for (const x of vals) { const z = (y - x) / bwd; if (z * z < 30) d += Math.exp(-0.5 * z * z); } dens.push([y, d]); }
              const mx = Math.max(1e-12, ...dens.map((p) => p[1])), m = NS[j], right = [], left = [];
              for (const [y, d] of dens) { const w = (0.3 * d) / mx; right.push([m * 10 ** w, y]); left.unshift([m * 10 ** -w, y]); }
              sL.poly([...right, ...left], { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1.4 });
            }
            if (lim != null && Math.abs(lim - TH) > 1e-9) sL.hline(lim, { color: 'red', width: 2, dash: [7, 4] });
          });
          sL.hline(TH, { color: 'green', width: 1.4 });
          sL.text('θ ± ε', 1.25, TH + eps, { color: 'green', size: 12, weight: 700, dy: -11, plate: true });
          if (lim != null && Math.abs(lim - TH) > 1e-9) sL.text('the population median', 1.2e4, lim, { color: 'red', size: 12, weight: 700, align: 'right', dy: 11, plate: true });
          sL.text('n', 1.45e4, TH - 2.2, { color: 'muted', size: 15, math: true, align: 'right', dy: -30 });
          // right: miss probabilities
          const miss = NS.map((m, j) => { let c = 0; for (const row of D) if (Math.abs(row[j] - TH) > eps) c++; return c / REPS; });
          const ex = NS.map((m) => exactMiss(pop, est, m, eps));
          if (ex[0] != null) sR.path(NS.map((m, j) => [m, ex[j]]), { color: 'ink', width: 2.2 });
          sR.path(NS.map((m, j) => [m, miss[j]]), { color: 'accent', width: 1.6, alpha: 0.7 });
          sR.dots(NS.map((m, j) => [m, miss[j]]), { r: 2.8, color: 'accent' });
          sR.text('n', 1.45e4, 0, { color: 'muted', size: 15, math: true, align: 'right', dy: -30 });
          v.legend([['accent', 'sample paths · simulated miss rate'], ['orange', 'sampling distribution (240 repetitions)', { area: true }], ['green', 'θ ± ε'], ['ink', 'exact miss probability']]);
          info = { pop, est, eps, miss, last: miss[NS.length - 1], m10: miss[VI[0]], m100: miss[VI[1]], m1000: miss[VI[2]], exLast: ex[NS.length - 1], lim };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, se = Math.sqrt(Math.max(I.last * (1 - I.last), 1 / REPS) / REPS);
          const ok = I.lim != null && Math.abs(I.lim - TH) < 1e-9;
          const why = I.est === 'first' ? '$X_1$ ignores every later observation' : I.lim == null ? 'the Cauchy mean has the same Cauchy law for every $n$' : !ok ? 'the median of a skewed law is not its mean: consistent for the median, not for $\\theta$' : I.est === 'shr' ? 'biased at every $n$, but the bias $-10\\theta/(n+10)$ and the variance both vanish' : 'bias and variance both vanish';
          return String.raw`share of the 240 repetitions outside $\theta\pm${v.fix(I.eps, 2)}$: ${pct(I.m10, 0)} at $n=10$, ${pct(I.m100, 0)} at 100, ${pct(I.m1000, 0)} at 1,000, **${pct(I.last, 1)}** ± ${pct(2 * se, 1)} at 10,000` + (I.exLast != null ? ` (exact ${pct(I.exLast, 2)})` : '') + ` — ` + (ok ? `**consistent**: ${why}` : `**not consistent**: ${why}`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Method',
      name: 'Method of moments',
      credit: 'Karl Pearson, 1894',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a model with $k$ parameters $\theta=(\theta_1,\dots,\theta_k)$ and population moments $\mu_j(\theta)=E_\theta X^j$. The **method of moments** estimator $\tilde\theta$ solves the $k$ equations
$$\mu_j(\tilde\theta)=m_j=\frac1n\sum_{i=1}^nX_i^j,\qquad j=1,\dots,k,$$
equating population moments to sample moments (central moments, or other expectations $E_\theta g_j(X)$, may be used instead). If $\theta\mapsto(\mu_1,\dots,\mu_k)$ is one-to-one with a continuous inverse near the truth, $\tilde\theta$ is consistent, and when it is differentiable, asymptotically normal by the delta method.

Example: for the gamma model with shape $\alpha$ and rate $\beta$, mean $\alpha/\beta$ and variance $\alpha/\beta^2$ give
$$\tilde\alpha=\bar X^2/\hat\sigma^2,\qquad\tilde\beta=\bar X/\hat\sigma^2,\qquad \hat\sigma^2=\tfrac1n\textstyle\sum(X_i-\bar X)^2.$$`,
      idea: String.raw`Sample moments converge to population moments (law of large numbers; their means and variances are those of stat-1.3), so inverting the moment map gives estimators that converge to $\theta$ by continuity, and the delta method (stat-1.15) gives their asymptotic variance. The recipe is explicit and needs no optimisation, but it ignores the shape of the density. For the gamma, the sufficient statistic is $(\sum X_i,\sum\log X_i)$ (stat-2.4); the second moment is not a function of it, so the moment estimator throws information away, and its large-sample efficiency for the shape is $1/\{2(\alpha+1)(\alpha\psi'(\alpha)-1)\}$, close to 1 only when the gamma is close to normal. Moment estimates make good starting values for likelihood iterations (stat-3.10).`,
      caption: String.raw`Left: a gamma sample (histogram) and the model at the gold handle. Right: the parameter plane, both axes on log scales. Every point on the orange line reproduces the sample mean, every point on the purple line the sample variance; the method-of-moments estimate is where they cross. Drag the handle there and the gold model matches the first two moments (readout). The blue dot is the maximum-likelihood estimate, inside contours where the log-likelihood is 0.5, 2 and 4.5 below its peak. Turn on the repeated fits: 1,000 moment estimates (orange) and 1,000 maximum-likelihood estimates (blue) around the truth (green ring). For small shapes (very skewed data) the orange cloud is visibly wider.`,
      deps: ['stat-1.3', 'stat-1.15'],
      see: ['stat-3.5', 'stat-2.17'],
      refs: ['Casella–Berger §7.2', 'Wasserman §9.2'],
      tags: ['estimation', 'method of moments', 'gamma'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_moments_(statistics)' },
      viz(v) {
        const M = v.M;
        let H = null;
        const home = () => { if (H) H.set(Math.log(aS.value) + 0.9, -0.85); };
        const aS = v.slider('true shape $\\alpha$ (rate $\\beta=1$)', 0.3, 10, 1.2, { log: true, onChange: home });
        const nS = v.slider('sample size $n$', 10, 500, 40, { int: true, log: true });
        const repT = v.toggle('repeat the fit 1,000 times', false);
        let seed = 0; v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 340, weight: 1, title: 'the sample and the gamma model at the handle' });
        const sP = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', height: 340, weight: 1, title: 'parameter plane (log scales)' });
        H = sP.handle(Math.log(1.2) + 0.9, -0.85, { color: 'gold' });
        const md = memo(), mr = memo();
        const data = (a, n, sd) => md([a, n, sd].join('|'), () => {
          const r = v.rng(hashStr(`mom|${a}|${n}|${sd}`)), G = M.dist.gamma(a, 1), xs = []; let sx = 0, slog = 0;
          for (let i = 0; i < n; i++) { const x = Math.max(1e-300, G.sample(r)); xs.push(x); sx += x; slog += Math.log(x); }
          const xbar = sx / n; let m2 = 0; for (const x of xs) m2 += (x - xbar) ** 2; m2 /= n;
          return { xs, n, sx, slog, xbar, m2, mom: [xbar * xbar / m2, xbar / m2], mle: gammaMLE(xbar, slog / n) };
        });
        const reps = (a, n) => mr([a, n].join('|'), () => {
          const r = v.rng(hashStr(`momrep|${a}|${n}`)), G = M.dist.gamma(a, 1), mom = [], mle = [];
          for (let k = 0; k < 1000; k++) {
            let sx = 0, slog = 0, sq = 0; for (let i = 0; i < n; i++) { const x = Math.max(1e-300, G.sample(r)); sx += x; sq += x * x; slog += Math.log(x); }
            const xb = sx / n, m2 = Math.max(1e-300, sq / n - xb * xb), f = gammaMLE(xb, slog / n);
            mom.push([Math.log(xb * xb / m2), Math.log(xb / m2)]); mle.push([Math.log(f.alpha), Math.log(f.beta)]);
          }
          return { mom, mle };
        });
        let info = null;
        v.render(() => {
          const a0 = aS.value, n = nS.value, D = data(a0, n, seed);
          const ha = Math.exp(H.x), hb = Math.exp(H.y), ll = (a, b) => gammaLL(a, b, n, D.sx, D.slog), lmax = ll(D.mle.alpha, D.mle.beta);
          // left: histogram and model curves
          const so = sortNum(D.xs), top = qSorted(so, 0.995) * 1.1;
          const B = binned(D.xs, 0, top, clamp(Math.round(2 * Math.sqrt(n)), 8, 40));
          const curves = [[ha, hb, 'gold', 3, null], [D.mom[0], D.mom[1], 'orange', 2, [7, 4]], [D.mle.alpha, D.mle.beta, 'accent', 2.2, null], [a0, 1, 'green', 1.6, [3, 4]]];
          let pk = B.max; for (const [a, b] of curves) { const G = M.dist.gamma(a, 1 / b); for (let i = 1; i <= 200; i++) { const y = G.pdf((top * i) / 200); if (isFinite(y)) pk = Math.max(pk, Math.min(y, 2.6 * B.max)); } }
          viewPad(sL, [0, top], [0, pk * 1.15], { left: 36 });
          sL.hist(B, { density: true, color: 'muted', fillAlpha: 0.22, width: 1.3 });
          sL.clip(() => { for (const [a, b, col, w, dash] of curves.slice().reverse()) { const G = M.dist.gamma(a, 1 / b); sL.fn((x) => G.pdf(x), { domain: [top / 400, top], color: col, width: w, dash: dash || undefined, n: 300 }); } });
          axisLabels(sL, 'x', null);
          // right: the parameter plane in log units
          const lx = [Math.log(a0) - 1.9, Math.log(a0) + 1.9], ly = [-1.9, 1.9];
          viewPad(sP, lx, ly, { left: 34 });
          sP.setTicks(logTicks(sP.bounds.x[0], sP.bounds.x[1]), logTicks(sP.bounds.y[0], sP.bounds.y[1]));
          sP.contour((u, w) => ll(Math.exp(u), Math.exp(w)), [lmax - 4.5, lmax - 2, lmax - 0.5], { color: 'accent', alpha: 0.55, width: 1.3, res: 90 });
          if (repT.value) { const Rp = reps(a0, n); sP.dots(Rp.mom, { r: 1.7, color: 'orange', alpha: 0.32 }); sP.dots(Rp.mle, { r: 1.7, color: 'accent', alpha: 0.32 }); }
          sP.fn((u) => u - Math.log(D.xbar), { color: 'orange', width: 2.4 });
          sP.fn((u) => 0.5 * (u - Math.log(D.m2)), { color: 'purple', width: 2.4 });
          // label each line where it is comfortably inside the window
          const yTopL = ly[1] - 0.35, uM = Math.min(lx[1] - 0.2, yTopL + Math.log(D.xbar)), uV = Math.min(lx[1] - 0.2, 2 * yTopL + Math.log(D.m2));
          sP.text('mean matches', uM, uM - Math.log(D.xbar), { color: 'orange', size: 11.5, weight: 700, align: 'right', dx: -6, dy: -4, plate: true });
          sP.text('variance matches', uV, 0.5 * (uV - Math.log(D.m2)), { color: 'purple', size: 11.5, weight: 700, align: 'right', dx: -4, dy: 14, plate: true });
          sP.dot(Math.log(a0), 0, { r: 7, hollow: true, color: 'green', width: 2.4 });
          sP.dot(Math.log(D.mom[0]), Math.log(D.mom[1]), { r: 5.5, color: 'orange' });
          sP.dot(Math.log(D.mle.alpha), Math.log(D.mle.beta), { r: 5.5, color: 'accent' });
          axisLabels(sP, '\\text{shape }\\alpha', '\\text{rate }\\beta');
          v.legend([['gold', 'model at the handle'], ['orange', 'method of moments · mean-matching line'], ['purple', 'variance-matching line'], ['accent', 'maximum likelihood'], ['green', 'truth', { dash: true }]]);
          let effS = null; if (repT.value) { const Rp = reps(a0, n), vm = moments(Rp.mom, (p) => Math.exp(p[0])), vl = moments(Rp.mle, (p) => Math.exp(p[0])); effS = vl.var / vm.var; }
          info = { ha, hb, D, a0, n, dll: ll(ha, hb) - lmax, effS, effT: 1 / (2 * (a0 + 1) * (a0 * trigamma(a0) - 1)) };
        });
        v.readout(() => {
          if (!info) return '';
          const { ha, hb, D, dll, effS, effT } = info, mm = ha / hb, vv = ha / (hb * hb);
          const okM = Math.abs(mm / D.xbar - 1) < 0.01, okV = Math.abs(vv / D.m2 - 1) < 0.02;
          let s = String.raw`handle $(\alpha,\beta)=(${v.fix(ha, 3)},\ ${v.fix(hb, 3)})$: model mean $\alpha/\beta=${v.fix(mm, 3)}$ vs $\bar x=${v.fix(D.xbar, 3)}$` + (okM ? ' ✓' : '') + `, model variance $\\alpha/\\beta^2=${v.fix(vv, 3)}$ vs $\\hat\\sigma^2=${v.fix(D.m2, 3)}$` + (okV ? ' ✓' : '') + ` · moments: $(${v.fix(D.mom[0], 3)},\\ ${v.fix(D.mom[1], 3)})$, maximum likelihood: $(${v.fix(D.mle.alpha, 3)},\\ ${v.fix(D.mle.beta, 3)})$ · log-likelihood at the handle: ${v.fix(-dll, 2)} below the peak`;
          if (okM && okV) s += ' — **both moments matched: this is the method-of-moments fit**';
          if (effS != null) s += String.raw` · over 1,000 repeated fits, $\operatorname{Var}\hat\alpha_{\rm ML}/\operatorname{Var}\tilde\alpha_{\rm MM}=$ **${v.fix(effS, 3)}** (large-sample efficiency ${v.fix(effT, 3)})`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Method',
      name: 'Maximum likelihood estimation',
      credit: 'Fisher, 1912 and 1922',
      statement: String.raw`Given data $x$ with likelihood $L(\theta)=f(x\mid\theta)$, $\theta\in\Theta$ (stat-2.11), a **maximum likelihood estimate** is a value $\hat\theta(x)\in\Theta$ with
$$L(\hat\theta)=\sup_{\theta\in\Theta}L(\theta),$$
and the **maximum likelihood estimator (MLE)** is the statistic $\hat\theta(X)$. For i.i.d. data one maximizes the log-likelihood $\ell(\theta)=\sum_{i=1}^n\log f(x_i\mid\theta)$. If $\ell$ is differentiable and the maximum is interior, $\hat\theta$ solves the **likelihood equation** $\ell'(\theta)=0$ with $\ell''(\hat\theta)\le0$; but a root may be a local maximum or a minimum, the maximum may sit on the boundary or at a jump (stat-3.13), there may be several maxima, or the supremum may not be attained (stat-3.8).

Examples: $N(\theta,1)$ gives $\hat\theta=\bar x$; Exponential with rate $\theta$ gives $\hat\theta=1/\bar x$; for the Cauchy location model there is no closed form and the likelihood equation can have many roots.`,
      idea: String.raw`The parameter that makes the observed data most probable is a natural guess, and there is a reason it works: under $P_{\theta_0}$, $\frac1n\ell(\theta)\to E_{\theta_0}\log f(X\mid\theta)$, which by Gibbs' inequality (info-2.2) is largest at $\theta=\theta_0$, so the maximizer of the empirical criterion is drawn to the truth (stat-5.1). The likelihood depends on the data only through a sufficient statistic (stat-2.3), so the MLE does too; it is invariant under reparametrization (stat-3.6) and, in regular models, asymptotically efficient (stat-5.3). Taking logarithms turns the product of densities into a sum, which is what makes the calculus tractable.`,
      caption: String.raw`Top: the data (drag any gold point) and the density $f(x\mid\theta)$ for the $\theta$ on the blue marker; the orange stems are the factors $f(x_i\mid\theta)$ whose product is the likelihood. Bottom: the log-likelihood $\ell(\theta)=\sum\log f(x_i\mid\theta)$ and its tangent at the marker. Drag the marker uphill: at the top the tangent is flat (score 0) and the marker sits on the closed-form MLE (green). In the Cauchy model drag one point far out: the log-likelihood grows a second peak, and the likelihood equation has several roots.`,
      deps: ['stat-2.11'],
      see: ['stat-5.1', 'stat-2.17'],
      refs: ['Casella–Berger §7.2', 'Wasserman §9.3'],
      tags: ['estimation', 'maximum likelihood'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_likelihood_estimation' },
      viz(v) {
        const NMAX = 14;
        const MOD = {
          normal: { tex: 'N(\\theta,1)', xr: [-4.5, 4.5], yr: [0, 0.5], tr: [-3, 3], cx: [-4.3, 4.3], pdf: (x, t) => phi(x - t), draw: (r) => 0.6 + r.normal(), mle: (xs) => mean(xs), form: '\\bar x', t0: -0.9 },
          expo: { tex: '\\mathrm{Exp}(\\theta)', xr: [-0.3, 6], yr: [0, 2.2], tr: [0.08, 3.5], cx: [0.03, 5.8], pdf: (x, t) => (x < 0 ? 0 : t * Math.exp(-t * x)), draw: (r) => -Math.log(1 - r()) / 0.8, mle: (xs) => 1 / mean(xs), form: '1/\\bar x', t0: 2.7 },
          cauchy: { tex: '\\mathrm{Cauchy}(\\theta,1)', xr: [-7, 7], yr: [0, 0.36], tr: [-5, 5], cx: [-6.8, 6.8], pdf: (x, t) => 1 / (Math.PI * (1 + (x - t) ** 2)), draw: (r) => 0.4 + Math.tan(Math.PI * (r() - 0.5)), mle: null, form: null, t0: -3.5 },
        };
        const modS = v.select('model', [{ value: 'normal', label: 'normal mean' }, { value: 'expo', label: 'exponential rate' }, { value: 'cauchy', label: 'Cauchy location' }], 'normal');
        const nS = v.slider('sample size $n$', 3, NMAX, 8, { int: true });
        let seed = 0; v.button('New sample', () => { seed++; });
        const sT = v.stage({ x: [-4.5, 4.5], y: [0, 0.5], axes: 'box', height: 220, full: true, title: 'data and the density at the marker' });
        const sB = v.stage({ x: [-3, 3], y: [-30, 0], axes: 'box', height: 250, full: true, title: 'log-likelihood $\\ell(\\theta)=\\sum_i\\log f(x_i\\mid\\theta)$' });
        const pts = []; for (let i = 0; i < NMAX; i++) pts.push(sT.handle(0, 0, { color: 'gold', r: 6, constrain: (x) => [clamp(x, MOD[modS.value].cx[0], MOD[modS.value].cx[1]), 0] }));
        let ll = () => 0;
        const mk = sB.handle(-1.8, 0, { color: 'accent', constrain: (x) => { const T = MOD[modS.value].tr; const t = clamp(x, T[0], T[1]); return [t, ll(t)]; } });
        let key = null, info = null;
        v.render(() => {
          const mod = MOD[modS.value], n = nS.value, k = [modS.value, n, seed].join('|');
          if (k !== key) {
            const r = v.rng(hashStr('mle|' + k));
            pts.forEach((h, i) => { const x = clamp(mod.draw(r), mod.cx[0] + 0.2, mod.cx[1] - 0.2); h.x = x; h.y = 0; h.visible = i < n; });
            if (!key || key.split('|')[0] !== modS.value) mk.x = mod.t0;
            key = k;
          }
          const xs = pts.slice(0, n).map((h) => h.x);
          ll = (t) => { let s = 0; for (const x of xs) s += Math.log(Math.max(1e-300, mod.pdf(x, t))); return s; };
          // maximize on a grid, then polish by golden section; count roots of the likelihood equation
          const T = mod.tr, G = 1200; let bi = 0, bv = -Infinity; const g = [];
          for (let i = 0; i <= G; i++) { const t = T[0] + ((T[1] - T[0]) * i) / G, y = ll(t); g.push(y); if (y > bv) { bv = y; bi = i; } }
          let lo = T[0] + ((T[1] - T[0]) * Math.max(0, bi - 1)) / G, hi = T[0] + ((T[1] - T[0]) * Math.min(G, bi + 1)) / G;
          for (let it = 0; it < 60; it++) { const a = hi - 0.618 * (hi - lo), b = lo + 0.618 * (hi - lo); if (ll(a) > ll(b)) hi = b; else lo = a; }
          const tNum = 0.5 * (lo + hi), tHat = mod.mle ? mod.mle(xs) : tNum;
          let roots = 0, maxima = []; for (let i = 1; i < G; i++) { const d1 = g[i] - g[i - 1], d2 = g[i + 1] - g[i]; if ((d1 > 0) !== (d2 > 0)) { roots++; if (d1 > 0) maxima.push(T[0] + ((T[1] - T[0]) * i) / G); } }
          const lHat = ll(tHat), lMax = Math.max(...g, lHat), lMin = Math.max(Math.min(...g), lMax - 40);
          mk.y = ll(mk.x);
          // top panel
          viewPad(sT, mod.xr, mod.yr, { left: 38 });
          const th = mk.x;
          sT.clip(() => {
            sT.fn((x) => mod.pdf(x, tHat), { domain: mod.xr, color: 'green', width: 1.6, dash: [5, 4], n: 300 });
            sT.fn((x) => mod.pdf(x, th), { domain: mod.xr, color: 'accent', width: 2.6, n: 300 });
            for (const x of xs) { const y = mod.pdf(x, th); sT.line(x, 0, x, y, { color: 'orange', width: 2.4 }); sT.dot(x, y, { r: 3.2, color: 'orange' }); }
          });
          axisLabels(sT, 'x', null);
          // bottom panel
          viewPad(sB, T, [lMin, lMax + 0.12 * (lMax - lMin)], { left: 44 });
          sB.clip(() => {
            sB.fn(ll, { domain: T, color: 'ink', width: 2.6, n: 500 });
            const d = (ll(th + 1e-4) - ll(th - 1e-4)) / 2e-4, w = 0.12 * (T[1] - T[0]);
            sB.line(th - w, mk.y - d * w, th + w, mk.y + d * w, { color: 'accent', width: 2, dash: [6, 4] });
          });
          if (!mod.mle) for (const t of maxima) if (Math.abs(t - tNum) > 0.05) sB.dot(t, ll(t), { r: 5, hollow: true, color: 'orange', width: 2 });
          sB.vline(tHat, { color: 'green', width: 1.2, dash: [4, 4] });
          sB.dot(tHat, lHat, { r: 5.5, color: 'green' });
          axisLabels(sB, '\\theta', null);
          v.legend([['gold', 'data (drag)', { dot: true }], ['accent', 'density and tangent at the marker'], ['orange', 'factors $f(x_i\\mid\\theta)$'], ['green', 'maximum likelihood', { dash: true }]]);
          const score = (ll(th + 1e-5) - ll(th - 1e-5)) / 2e-5;
          let logL = mk.y;
          info = { th, logL, score, tHat, lHat, mod, roots, maxima, n };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, gap = I.lHat - I.logL, found = gap < 0.01;
          let s = String.raw`marker $\theta=${v.fix(I.th, 3)}$: $L(\theta)=\prod f(x_i\mid\theta)=${v.sci(Math.exp(I.logL), 3)}$, $\ell(\theta)=${v.fix(I.logL, 3)}$, score $\ell'(\theta)=${v.fix(I.score, 3)}$ · `;
          s += I.mod.form ? String.raw`closed form $\hat\theta=${I.mod.form}=${v.fix(I.tHat, 3)}$` : String.raw`no closed form: numerical maximum $\hat\theta=${v.fix(I.tHat, 3)}$; the likelihood equation has **${I.roots} root${I.roots === 1 ? '' : 's'}** in view (${I.maxima.length} local maxim${I.maxima.length === 1 ? 'um' : 'a'})`;
          s += String.raw`, $\ell(\hat\theta)=${v.fix(I.lHat, 3)}$ — ` + (found ? '**at the top: the tangent is flat and the marker is the MLE**' : `your marker is ${v.fix(gap, 3)} below the top`);
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Invariance of the MLE',
      credit: 'Fisher, 1922; Zehna, 1966',
      statement: String.raw`Let $\hat\theta$ be a maximum likelihood estimate of $\theta$ and let $g$ be any function on $\Theta$. Define the **induced likelihood** of $\tau=g(\theta)$ by
$$L^*(\tau)=\sup\{L(\theta):\ g(\theta)=\tau\}.$$
Then $g(\hat\theta)$ maximizes $L^*$: the MLE of $g(\theta)$ is $g(\hat\theta)$. When $g$ is one-to-one, $L^*(\tau)=L(g^{-1}(\tau))$ is the same function with its argument relabelled. Examples: the MLE of the log-odds is $\log\{\hat p/(1-\hat p)\}$, that of $\sigma$ is $\sqrt{\hat\sigma^2}$.

Unbiasedness is not preserved ($E\,g(\hat\theta)\ne g(E\hat\theta)$ unless $g$ is affine), nor are a posterior mode or mean: a density acquires the Jacobian $|d\theta/d\tau|$ under a change of variable, while a likelihood does not.`,
      idea: String.raw`Two inequalities suffice. For every $\tau$, $L^*(\tau)\le\sup_\theta L(\theta)=L(\hat\theta)$; and $L^*(g(\hat\theta))\ge L(\hat\theta)$ because $\hat\theta$ itself is one of the $\theta$ with $g(\theta)=g(\hat\theta)$. So $g(\hat\theta)$ attains the largest value $L^*$ can take. The likelihood is a function on the parameter space, not a density over it, so relabelling the points cannot move its maximum. A posterior density does transform with the Jacobian, so its mode moves, and by Jensen's inequality (rca-3.3) its mean moves too unless $g$ is affine.`,
      caption: String.raw`The black curve is the reparametrization $\tau=g(p)$ of a binomial success probability. Under the $p$-axis stands the likelihood $L(p)\propto p^x(1-p)^{n-x}$ (blue); beside the $\tau$-axis, turned sideways, the induced likelihood $L^*(\tau)$ (blue). Drag the gold point along the $p$-axis: its image has exactly the same likelihood height in both strips. The green guide from $\hat p=x/n$ up to the curve and across lands on the peak of $L^*$. Turn on the posterior for a uniform prior on $p$: in $p$ it has the shape of the likelihood, but in $\tau$ the Jacobian bends it, so its mode (purple dot) no longer sits at $g(\hat p)$. The last option is not one-to-one, and $L^*$ takes the larger of the two branches.`,
      deps: ['stat-3.5'],
      see: ['rca-3.3'],
      refs: ['Casella–Berger §7.2', 'Wasserman §9.6'],
      tags: ['maximum likelihood', 'invariance', 'reparametrization'],
      viz(v) {
        const G = {
          logit: { g: (p) => Math.log(p / (1 - p)), tr: [-4.6, 4.6], br: (t) => [1 / (1 + Math.exp(-t))], jac: (t) => { const p = 1 / (1 + Math.exp(-t)); return [p * (1 - p)]; }, tex: '\\tau=\\log\\tfrac{p}{1-p}', ticks: [-4, -2, 0, 2, 4] },
          sq: { g: (p) => p * p, tr: [0, 1], br: (t) => (t >= 0 ? [Math.sqrt(t)] : []), jac: (t) => [0.5 / Math.sqrt(Math.max(t, 1e-12))], tex: '\\tau=p^2', ticks: [0, 0.25, 0.5, 0.75, 1] },
          dev: { g: (p) => (p - 0.5) ** 2, tr: [0, 0.25], br: (t) => (t >= 0 ? [0.5 - Math.sqrt(t), 0.5 + Math.sqrt(t)] : []), jac: (t) => { const j = 0.5 / Math.sqrt(Math.max(t, 1e-12)); return [j, j]; }, tex: '\\tau=(p-\\tfrac12)^2', ticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25] },
        };
        const gS = v.select('reparametrization', [{ value: 'logit', label: 'log-odds' }, { value: 'sq', label: '$p^2$' }, { value: 'dev', label: '$(p-\\tfrac12)^2$, not one-to-one' }], 'logit');
        const xS = v.slider('successes $x$', 0, 40, 9, { int: true });
        const fS = v.slider('failures $n-x$', 0, 40, 3, { int: true });
        const postT = v.toggle('posterior (uniform prior on $p$)', false);
        const s = v.stage({ x: [-0.42, 1.03], y: [0, 1], axes: false, height: 440, full: true });
        const hp = s.handle(0.4, 0, { color: 'gold', constrain: (x) => [clamp(x, 0.004, 0.996), Y0] });
        let Y0 = 0, info = null;
        v.render(() => {
          const T = G[gS.value], x = xS.value, f = fS.value, n = x + f, [t0, t1] = T.tr, sp = t1 - t0;
          Y0 = t0; hp.y = t0;
          const yS0 = t0 - 0.46 * sp, yS1 = t0 - 0.13 * sp, xS0 = -0.41, xS1 = -0.12; // strips: bottom for L(p), left for L*(τ)
          s.setView([-0.42, 1.03], [yS0 - 0.02 * sp, t1 + 0.04 * sp]);
          const pHat = n ? x / n : 0.5;
          const logL = (p) => (p <= 0 || p >= 1 ? (p <= 0 ? (x ? -Infinity : f * Math.log1p(-Math.max(p, 0))) : (f ? -Infinity : x * Math.log(Math.min(p, 1)))) : x * Math.log(p) + f * Math.log1p(-p));
          const lmax = logL(clamp(pHat, 1e-12, 1 - 1e-12)), Lr = (p) => Math.exp(logL(p) - lmax);
          const Ls = (t) => { let m = 0; for (const p of T.br(t)) if (p > 0 && p < 1) m = Math.max(m, Lr(p)); return m; };
          // frames and ticks
          s.rect(0, t0, 1, t1, { color: 'faint', width: 1 });
          s.line(0, yS0, 1, yS0, { color: 'muted', width: 1.2 }); s.line(xS0, t0, xS0, t1, { color: 'muted', width: 1.2 });
          for (const p of [0, 0.25, 0.5, 0.75, 1]) { s.line(p, t0, p, t0 - 0.015 * sp, { color: 'muted' }); s.text(String(p), p, t0 - 0.02 * sp, { color: 'muted', size: 11, align: 'center', baseline: 'top' }); }
          for (const t of T.ticks) { s.line(0, t, -0.012, t, { color: 'muted' }); s.text(v.fmt(t, 2), -0.018, t, { color: 'muted', size: 11, align: 'right' }); }
          s.tex('p', 1.01, t0 - 0.03 * sp, { color: 'muted', size: 15, align: 'left', baseline: 'top' });
          s.tex(T.tex, 0.03, t1 - 0.02 * sp, { color: 'ink', size: 15, align: 'left', baseline: 'top' });
          s.text('L(p)', 1.0, yS1, { color: 'accent', size: 12, weight: 700, align: 'right', baseline: 'top' });
          s.tex('L^*(\\tau)', xS0 + 0.01, t1, { color: 'accent', size: 14, align: 'left', baseline: 'top' });
          // the curve τ = g(p)
          s.clip(() => s.fn(T.g, { domain: [0.002, 0.998], color: 'ink', width: 2.6, n: 400 }), [0, 1], [t0, t1]);
          // likelihood strips
          const hS = yS1 - yS0, wS = xS1 - xS0;
          s.fn((p) => yS0 + hS * Lr(p), { domain: [0, 1], color: 'accent', width: 2.4, n: 400, fill: 'accent', fillAlpha: 0.12, base: yS0 });
          const tg = []; for (let i = 0; i <= 500; i++) { const t = t0 + (sp * i) / 500; tg.push([xS0 + wS * Ls(t), t]); }
          s.path([[xS0, t0], ...tg, [xS0, t1]], { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.12 });
          // posterior (uniform prior): in p the Beta(x+1, f+1) density, in τ that density times the Jacobian
          let post = null;
          if (postT.value) {
            const lb = (p) => (p > 0 && p < 1 ? Math.exp(logL(p) - lmax) : 0);
            const Z = v.M.integrate(lb, 0, 1, 2000), fp = (p) => lb(p) / Z;
            const ft = (t) => { const b = T.br(t), j = T.jac(t); let d = 0; b.forEach((p, i) => { if (p > 0 && p < 1) d += fp(p) * j[i]; }); return d; };
            let mx = 0, tMode = t0; const fg = []; for (let i = 1; i < 800; i++) { const t = t0 + (sp * i) / 800, d = ft(t); fg.push([t, d]); if (d > mx) { mx = d; tMode = t; } }
            const pMax = Math.max(...Array.from({ length: 401 }, (_, i) => fp(i / 400)));
            s.fn((p) => yS0 + hS * fp(p) / pMax, { domain: [0.001, 0.999], color: 'purple', width: 2, dash: [6, 4], n: 300 });
            s.path(fg.map(([t, d]) => [xS0 + wS * Math.min(1.05, d / mx), t]), { color: 'purple', width: 2, dash: [6, 4] });
            s.dot(xS0 + wS, tMode, { r: 5, color: 'purple' });
            const Eg = v.M.integrate((p) => fp(p) * T.g(clamp(p, 1e-9, 1 - 1e-9)), 1e-9, 1 - 1e-9, 4000), Ep = (x + 1) / (n + 2);
            post = { tMode, Eg, gEp: T.g(Ep), Ep };
          }
          // the maximum, mapped
          const tHat = T.g(clamp(pHat, 1e-12, 1 - 1e-12)), inView = tHat >= t0 - 1e-9 && tHat <= t1 + 1e-9;
          s.line(pHat, yS1, pHat, inView ? tHat : t0, { color: 'green', width: 1.6, dash: [6, 4] });
          if (inView) { s.line(pHat, tHat, xS1, tHat, { color: 'green', width: 1.6, dash: [6, 4] }); s.dot(xS0 + wS, tHat, { r: 5.5, color: 'green' }); s.dot(pHat, tHat, { r: 4, color: 'green' }); }
          s.dot(pHat, yS1, { r: 5.5, color: 'green' });
          // the dragged point and its image
          const p = hp.x, tp = T.g(p), Lp = Lr(p), tIn = tp >= t0 && tp <= t1;
          s.line(p, t0, p, tIn ? tp : t1, { color: 'gold', width: 1.4, dash: [2, 3] });
          if (tIn) { s.line(p, tp, xS0 + wS * Lp, tp, { color: 'gold', width: 1.4, dash: [2, 3] }); s.dot(xS0 + wS * Lp, tp, { r: 5, color: 'gold' }); s.dot(p, tp, { r: 3.5, color: 'gold' }); }
          s.line(p, t0, p, yS0 + hS * Lp, { color: 'gold', width: 1.4, dash: [2, 3] });
          s.dot(p, yS0 + hS * Lp, { r: 5, color: 'gold' });
          // direct numerical maximum of L*
          let tb = t0, lb2 = -1; for (let i = 0; i <= 4000; i++) { const t = t0 + (sp * i) / 4000, l = Ls(t); if (l > lb2) { lb2 = l; tb = t; } }
          { let a = Math.max(t0, tb - sp / 4000), b = Math.min(t1, tb + sp / 4000); for (let it = 0; it < 60; it++) { const u = b - 0.618 * (b - a), w = a + 0.618 * (b - a); if (Ls(u) > Ls(w)) b = w; else a = u; } if (Ls(0.5 * (a + b)) >= lb2) tb = 0.5 * (a + b); }
          v.legend([['ink', 'the map $\\tau=g(p)$'], ['accent', 'likelihood $L(p)$ and induced $L^*(\\tau)$', { area: true }], ['green', 'MLE and its image'], ['gold', 'a point and its image']].concat(postT.value ? [['purple', 'posterior density (uniform prior on $p$)', { dash: true }]] : []));
          info = { p, tp, Lp, Ls: tIn ? Ls(tp) : NaN, pHat, tHat, tb, post, n, x, f, key: gS.value };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          let s = String.raw`$\hat p=${I.x}/${I.n}=${v.fix(I.pHat, 4)}$, so $g(\hat p)=${isFinite(I.tHat) ? v.fix(I.tHat, 4) : (I.tHat > 0 ? '+\\infty' : '-\\infty')}$; maximizing $L^*$ directly (fine grid, then golden section) gives $\tau=${v.fix(I.tb, 4)}$` + (isFinite(I.tHat) ? '' : ' (the edge of the window: the log-odds MLE does not exist when $x=0$ or $x=n$)');
          s += String.raw` · at the gold point $L(p)/L(\hat p)=${v.fix(I.Lp, 4)}$ and $L^*(g(p))/L^*_{\max}=${isFinite(I.Ls) ? v.fix(I.Ls, 4) : '—'}$`;
          if (I.key === 'dev') s += ' (the larger branch)';
          if (I.post) s += String.raw` · posterior: mode in $\tau$ at ${v.fix(I.post.tMode, 3)} vs $g(\text{mode in }p)=${v.fix(I.tHat, 3)}$; mean $E[g(p)]=${v.fix(I.post.Eg, 3)}$ vs $g(E[p])=${v.fix(I.post.gEp, 3)}$ — **the posterior summaries are not invariant**, the MLE is`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Proposition',
      name: 'Exponential-family MLE matches the sufficient statistic',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a one-parameter exponential family in canonical form, $f(x\mid\eta)=h(x)\exp\{\eta T(x)-A(\eta)\}$, with $\eta$ in the open natural parameter space (stat-1.17). The log-likelihood
$$\ell(\eta)=\eta\sum_{i=1}^nT(x_i)-nA(\eta)+\text{const}$$
is strictly concave, since $A''(\eta)=\operatorname{Var}_\eta T>0$, and the MLE, when it exists, is the unique solution of
$$A'(\hat\eta)=E_{\hat\eta}T(X)=\bar T=\frac1n\sum_{i=1}^nT(x_i):$$
the fitted model reproduces the observed average of the sufficient statistic. It exists if and only if $\bar T$ lies in the range of $A'$, the interior of the convex hull of the support of $T$. The same holds in $k$ parameters, with gradients. Examples: Bernoulli, $\hat p=\bar x$; Poisson, $\hat\lambda=\bar x$; exponential, $\hat\lambda=1/\bar x$. If every Bernoulli or Poisson observation is 0, no MLE exists.`,
      idea: String.raw`Differentiate: $\ell'(\eta)=n\{\bar T-A'(\eta)\}$, and $A'(\eta)=E_\eta T$ because differentiating $e^{A(\eta)}=\int h\,e^{\eta T}$ under the integral sign brings down $T$; once more gives $A''=\operatorname{Var}_\eta T$ (the identities behind stat-1.17 and stat-2.4). As $A''>0$, $A'$ is strictly increasing: it crosses the level $\bar T$ at most once, and $\ell$ is concave, so the crossing is the global maximum. The MLE therefore depends on the data only through the sufficient statistic $\bar T$ and coincides with the method of moments (stat-3.4) applied to $T$. When $\bar T$ is on the boundary of the possible means (all zeros), $A'$ approaches it only as $\eta\to-\infty$: the likelihood rises for ever and no maximum is attained.`,
      caption: String.raw`Right: the mean function $A'(\eta)=E_\eta T$ (blue, increasing) and the observed average $\bar T$ of the sufficient statistic (green line). Drag the gold point along the curve to the crossing. Left: the log-likelihood per observation, $\eta\bar T-A(\eta)$, with its tangent at the same $\eta$; the slope is $\bar T-A'(\eta)$, which is the red gap on the right, and it vanishes exactly at the crossing. Draw new samples or change $n$ and the family. Choose the all-zero sample for the Bernoulli or Poisson model and the crossing disappears: the likelihood climbs for ever and there is no MLE.`,
      deps: ['stat-3.5', 'stat-2.4'],
      see: ['stat-1.17', 'stat-3.4'],
      refs: ['Casella–Berger §7.2'],
      tags: ['maximum likelihood', 'exponential family', 'sufficiency'],
      viz(v) {
        const FAM = {
          bern: { A: (e) => Math.log1p(Math.exp(e)), A1: (e) => 1 / (1 + Math.exp(-e)), inv: (t) => Math.log(t / (1 - t)), er: [-5, 5], yr: [0, 1], draw: (r) => (r() < 0.7 ? 1 : 0), par: (e) => `p=${v.fix(1 / (1 + Math.exp(-e)), 4)}`, closed: (t) => `\\hat p=\\bar x=${v.fix(t, 4)}`, T: 'x', canon: '\\eta=\\log\\frac p{1-p}', degen: true },
          pois: { A: Math.exp, A1: Math.exp, inv: Math.log, er: [-3, 2.2], yr: [0, 8], draw: (r) => rpois(r, 2.4), par: (e) => `\\lambda=${v.fix(Math.exp(e), 4)}`, closed: (t) => `\\hat\\lambda=\\bar x=${v.fix(t, 4)}`, T: 'x', canon: '\\eta=\\log\\lambda', degen: true },
          expo: { A: (e) => -Math.log(-e), A1: (e) => -1 / e, inv: (t) => -1 / t, er: [-4, -0.15], yr: [0, 6.5], draw: (r) => -Math.log(1 - r()) / 1.5, par: (e) => `\\lambda=${v.fix(-e, 4)}`, closed: (t) => `\\hat\\lambda=1/\\bar x=${v.fix(1 / t, 4)}`, T: 'x', canon: '\\eta=-\\lambda', degen: false },
          normal: { A: (e) => (e * e) / 2, A1: (e) => e, inv: (t) => t, er: [-3, 3], yr: [-3, 3], draw: (r) => 0.8 + r.normal(), par: (e) => `\\mu=${v.fix(e, 4)}`, closed: (t) => `\\hat\\mu=\\bar x=${v.fix(t, 4)}`, T: 'x', canon: '\\eta=\\mu', degen: false },
        };
        const famS = v.select('family', [{ value: 'bern', label: 'Bernoulli' }, { value: 'pois', label: 'Poisson' }, { value: 'expo', label: 'exponential' }, { value: 'normal', label: 'normal ($\\sigma=1$)' }], 'pois');
        const nS = v.slider('sample size $n$', 1, 60, 12, { int: true });
        const zeroT = v.toggle('all-zero sample', false);
        let seed = 0; v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1, title: 'log-likelihood per observation $\\eta\\bar T-A(\\eta)$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1, title: "mean function $A'(\\eta)=E_\\eta T$" });
        let F = FAM.pois;
        const hd = sR.handle(-2, 0, { color: 'gold', constrain: (x) => { const e = clamp(x, F.er[0], F.er[1]); return [e, clamp(F.A1(e), F.yr[0], F.yr[1])]; } });
        let fkey = null, info = null;
        v.render(() => {
          F = FAM[famS.value]; const n = nS.value;
          zeroT.el.hidden = !F.degen;
          if (fkey !== famS.value) { fkey = famS.value; hd.x = F.er[0] + 0.22 * (F.er[1] - F.er[0]); }
          const r = v.rng(hashStr(`ef|${famS.value}|${n}|${seed}`)); let s = 0; for (let i = 0; i < n; i++) s += F.draw(r);
          const degen = F.degen && zeroT.value, Tb = degen ? 0 : s / n;
          const ok = Tb > F.yr[0] + 1e-12 && (famS.value !== 'bern' || Tb < 1 - 1e-12) || famS.value === 'normal';
          const etaHat = ok ? F.inv(Tb) : null, eta = hd.x; hd.y = clamp(F.A1(eta), F.yr[0], F.yr[1]);
          const lbar = (e) => e * Tb - F.A(e);
          // left: the concave log-likelihood with the tangent at η
          const E = F.er, g = []; for (let i = 0; i <= 300; i++) { const e = E[0] + ((E[1] - E[0]) * i) / 300; g.push(lbar(e)); }
          const top = Math.max(...g, etaHat != null ? lbar(etaHat) : -Infinity), bot = Math.max(Math.min(...g), top - 11);
          viewPad(sL, E, [bot, top + 0.15 * (top - bot)], { left: 40 });
          sL.clip(() => {
            sL.fn(lbar, { domain: E, color: 'ink', width: 2.6, n: 400 });
            const sl = Tb - F.A1(eta), w = 0.16 * (E[1] - E[0]);
            sL.line(eta - w, lbar(eta) - sl * w, eta + w, lbar(eta) + sl * w, { color: 'accent', width: 2.2 });
          });
          sL.dot(eta, lbar(eta), { r: 5, color: 'gold' });
          if (etaHat != null && etaHat >= E[0] && etaHat <= E[1]) { sL.vline(etaHat, { color: 'green', width: 1.2, dash: [4, 4] }); sL.dot(etaHat, lbar(etaHat), { r: 5.5, color: 'green' }); }
          if (!ok) sL.text('keeps rising as η → −∞', E[0] + 0.03 * (E[1] - E[0]), top, { color: 'red', size: 12, weight: 700, align: 'left', dy: 10, plate: true });
          axisLabels(sL, '\\eta', null);
          // right: A'(η) against the level T̄
          viewPad(sR, E, F.yr, { left: 34 });
          sR.clip(() => sR.fn(F.A1, { domain: E, color: 'accent', width: 3, n: 400 }));
          sR.hline(Tb, { color: 'green', width: 2.2 });
          sR.text(`T̄ = ${v.fix(Tb, 3)}`, E[1], Tb, { color: 'green', size: 12, weight: 700, align: 'right', dx: -9, dy: Tb > F.yr[0] + 0.85 * (F.yr[1] - F.yr[0]) ? 12 : -11, plate: true });
          sR.line(eta, F.A1(eta), eta, Tb, { color: 'red', width: 3 });
          if (etaHat != null && etaHat >= E[0] && etaHat <= E[1]) { sR.vline(etaHat, { color: 'green', width: 1.2, dash: [4, 4] }); sR.dot(etaHat, Tb, { r: 6, color: 'green' }); sR.tex('\\hat\\eta', etaHat, F.yr[0], { color: 'green', size: 15, align: 'left', baseline: 'bottom', dx: 5, dy: -4 }); }
          axisLabels(sR, '\\eta', null);
          v.legend([['accent', "tangent · $A'(\\eta)$"], ['green', 'observed $\\bar T$ · MLE'], ['red', "gap $\\bar T-A'(\\eta)$ = score / $n$"], ['gold', 'your $\\eta$', { dot: true }]]);
          const A2 = (e) => (F.A1(e + 1e-5) - F.A1(e - 1e-5)) / 2e-5;
          info = { eta, Tb, n, ok, etaHat, A1: F.A1(eta), A2hat: etaHat != null ? A2(etaHat) : NaN, F, fam: famS.value };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, F = I.F;
          let s = String.raw`$\eta=${v.fix(I.eta, 3)}$: $A'(\eta)=E_\eta T=${v.fix(I.A1, 4)}$ against $\bar T=${v.fix(I.Tb, 4)}$; score $\ell'(\eta)=n(\bar T-A'(\eta))=${v.fix(I.n * (I.Tb - I.A1), 3)}$ · `;
          if (!I.ok) return s + String.raw`**no MLE**: $\bar T=0$ lies on the boundary of the possible means $(0,${I.fam === 'bern' ? '1' : '\\infty'})$, $A'(\eta)>0$ for every $\eta$, so the score is negative everywhere and the likelihood increases for ever as $\eta\to-\infty$`;
          return s + String.raw`MLE $\hat\eta=(A')^{-1}(\bar T)=${v.fix(I.etaHat, 4)}$, i.e. ${'$' + F.par(I.etaHat) + '$'} (closed form $${F.closed(I.Tb)}$) · fitted mean $E_{\hat\eta}T=${v.fix(F.A1(I.etaHat), 6)}=\bar T$ · curvature $nA''(\hat\eta)=n\operatorname{Var}_{\hat\eta}T=${v.fix(I.n * I.A2hat, 3)}$` + (Math.abs(I.eta - I.etaHat) < 0.02 * (F.er[1] - F.er[0]) ? ' — **you are at the crossing**' : '');
        });
      },
    },
  ],
};
