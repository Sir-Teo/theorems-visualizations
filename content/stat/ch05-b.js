// Statistical Inference — Chapter 5 (part b): items 5.8–5.13 — the sandwich variance, M-estimators and their
// asymptotics, influence functions, breakdown points, and Huber's robust location estimator.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  strip, varN, medianOf, Phi, qnorm, psiHuber, psiBi, psiOf, huberLoc, trimMean, mixVars, mixComps, huberK, mixInfo,
  rmix, dmix, EC,
} from './ch05.shared.js';

/** Median of an array (copied). */
const med = (a) => { const s = Float64Array.from(a).sort(), n = s.length; return n % 2 ? s[(n - 1) >> 1] : 0.5 * (s[n / 2 - 1] + s[n / 2]); };
/** Roots of a function on [a, b] from sign changes on a grid, refined by bisection; dir = +1 for downward crossings. */
function roots(f, a, b, N = 1200) {
  const out = []; let x0 = a, f0 = f(a);
  for (let i = 1; i <= N; i++) {
    const x1 = a + ((b - a) * i) / N, f1 = f(x1);
    if ((f0 > 0 && f1 < 0) || (f0 < 0 && f1 > 0)) {
      let lo = x0, hi = x1, flo = f0;
      for (let j = 0; j < 50; j++) { const m = 0.5 * (lo + hi), fm = f(m); if ((fm > 0) === (flo > 0) && fm !== 0) { lo = m; flo = fm; } else hi = m; }
      out.push({ x: 0.5 * (lo + hi), down: f0 > 0 });
    }
    x0 = x1; f0 = f1;
  }
  return out;
}

export default {
  collection: 'stat',
  chapter: 5,
  items: [
    // ───────────────────────────────────────────────────────────── 5.8
    {
      num: '5.8',
      kind: 'Theorem',
      name: 'Sandwich (Huber–White) variance',
      credit: 'Huber, 1967; White, 1980–1982',
      statement: String.raw`In the setting of stat-5.7 (data from $g$, model $f(\cdot\mid\theta)$, pseudo-true value $\theta^*$ in the interior), assume smoothness as in stat-5.2 and define, for one observation,
$$A=-E_g\,\partial^2_\theta\log f(X\mid\theta^*),\qquad B=E_g\big[s(X,\theta^*)^2\big]=\operatorname{Var}_g s(X,\theta^*),$$
with $A>0$. Then
$$\sqrt n\,(\hat\theta_n-\theta^*)\ \xrightarrow{d}\ N\big(0,\ A^{-1}BA^{-1}\big),$$
the **sandwich** variance (matrices $A^{-1}BA^{-1}$ in several dimensions). It is estimated consistently by plugging in empirical averages: $\hat A=-\frac1n\sum\partial^2_\theta\log f(X_i\mid\hat\theta)$, $\hat B=\frac1n\sum s(X_i,\hat\theta)^2$. When the model is correct, $A=B=I(\theta)$ by the information identity (stat-4.3) and the sandwich reduces to $1/I$; when it is wrong, the model-based $\widehat{\mathrm{se}}=1/\sqrt{n\hat A}$ is inconsistent, and Wald intervals built from it (stat-5.5) do not have their nominal coverage. Example: exponential model, Gamma$(k,1)$ data: $A=k^2$, $B=\operatorname{Var}X=k$, so the true variance $1/k^3$ differs from the model's $1/k^2$ by the factor $1/k$.`,
      idea: String.raw`The proof of stat-5.2 goes through word for word with $\theta^*$ in place of $\theta_0$: the average score at $\theta^*$ has mean zero (because $\theta^*$ maximizes $E_g\log f$) and variance $B/n$ by the CLT, the average curvature tends to $A$, and the Taylor expansion with Slutsky gives $\sqrt n(\hat\theta-\theta^*)\approx A^{-1}\,n^{-1/2}\sum s(X_i,\theta^*)$. The only step that used the truth of the model was the information identity $A=B$; dropping it leaves the bread $A^{-1}$ on both sides of the meat $B$. The estimator $\hat B$ measures the score's variability directly from the data instead of trusting the model's prediction of it, which is the idea behind heteroscedasticity-robust standard errors (stat-12.15).`,
      caption: String.raw`An exponential model is fitted to Gamma$(k,1)$ data and 95% Wald intervals for $\lambda^*=1/k$ are built two ways. Left: 40 repeats, model-based intervals (orange, left of each pair) and sandwich intervals (blue, right), red when they miss the green line $\lambda^*$. Right: coverage across $k$: the exact large-sample coverage $2\Phi(1.96\sqrt k)-1$ of the model-based interval (orange) and 95% for the sandwich (blue), with the coverage simulated from 1,000 repeats at the chosen $k$ (dots). For $k<1$ the data are more variable than the model believes and the model-based intervals undercover badly; at $k=1$ the model is right and the two agree; for $k>1$ the model-based intervals are needlessly wide.`,
      deps: ['stat-5.7', 'stat-5.5'],
      see: ['stat-12.15', 'stat-5.10'],
      refs: ['Casella–Berger §10.2'],
      tags: ['misspecification', 'sandwich', 'standard error'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heteroskedasticity-consistent_standard_errors' },
      viz(v) {
        const kS = v.slider('true gamma shape $k$', 0.25, 4, 0.5, { log: true, sig: 2 });
        const nS = v.slider('sample size $n$', 20, 1000, 100, { int: true, log: true });
        const sL = v.stage({ x: [0, 41], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 1.2, xlabel: 'repeat', ylabel: '$\\lambda$', title: '95% intervals for $\\lambda^*$: model-based (orange) and sandwich (blue)' });
        const sR = v.stage({ x: [0.25, 4], y: [0.5, 1.01], xlog: true, axes: 'box', gutter: true, height: 350, weight: 0.8, minWidth: 240, xlabel: 'gamma shape $k$', ylabel: 'coverage', xticks: [0.25, 0.5, 1, 2, 4], title: 'coverage of the two intervals' });
        const REPS = 1000, mc = memo();
        const sim = (k, n) => mc(k + '|' + n, () => {
          const r = v.rng(hashStr(`sand5|${k}|${n}`)), G = v.M.dist.gamma(k, 1), out = [];
          for (let c = 0; c < REPS; c++) {
            let s = 0, q = 0; for (let i = 0; i < n; i++) { const x = G.sample(r); s += x; q += x * x; }
            const xb = s / n, s2 = Math.max(0, q / n - xb * xb), l = 1 / xb;
            out.push({ l, seM: l / Math.sqrt(n), seS: (l * l * Math.sqrt(s2)) / Math.sqrt(n) });
          }
          return out;
        });
        let info = null;
        v.render(() => {
          const k = +kS.value.toPrecision(3), n = nS.value, D = sim(k, n), ls = 1 / k;
          const sdS = Math.sqrt(1 / (k ** 3 * n)), sdM = Math.sqrt(1 / (k * k * n)), w = 4.8 * Math.max(sdS, sdM);
          sL.setView([0, 41], [ls - w, ls + w]);
          sL.hline(ls, { color: 'green', width: 2 });
          let mM = 0, mS = 0;
          for (let i = 0; i < 40; i++) {
            const d = D[i], x = i + 1;
            const okM = Math.abs(d.l - ls) <= 1.96 * d.seM, okS = Math.abs(d.l - ls) <= 1.96 * d.seS;
            sL.line(x - 0.2, d.l - 1.96 * d.seM, x - 0.2, d.l + 1.96 * d.seM, { color: okM ? 'orange' : 'red', width: okM ? 2.4 : 3 });
            sL.line(x + 0.2, d.l - 1.96 * d.seS, x + 0.2, d.l + 1.96 * d.seS, { color: okS ? 'accent' : 'red', width: okS ? 2.4 : 3 });
            sL.dot(x, d.l, { r: 2.2, color: 'ink' });
            if (!okM) mM++; if (!okS) mS++;
          }
          sL.text('λ* = 1/k', 40.6, ls, { color: 'green', size: 11.5, align: 'right', dy: -10, plate: true });
          // right: coverage curves
          sR.hline(0.95, { color: 'muted', width: 1, dash: [3, 3] });
          sR.fn((kk) => 2 * Phi(1.96 * Math.sqrt(kk)) - 1, { color: 'orange', width: 2.6, n: 200 });
          sR.fn(() => 0.95, { color: 'accent', width: 2.6 });
          sR.vline(1, { color: 'green', width: 1.2, dash: [4, 4] });
          sR.text('model correct', 1, 0.53, { color: 'green', size: 11, dx: 6, align: 'left' });
          sR.vline(k, { color: 'gold', width: 1.4, dash: [4, 3] });
          const cM = D.filter((d) => Math.abs(d.l - ls) <= 1.96 * d.seM).length / REPS, cS = D.filter((d) => Math.abs(d.l - ls) <= 1.96 * d.seS).length / REPS;
          sR.dot(k, cM, { r: 5.5, color: 'orange' }); sR.dot(k, cS, { r: 5.5, color: 'accent' });
          v.legend([['orange', 'model-based $\\hat\\lambda\\pm1.96\\,\\hat\\lambda/\\sqrt n$'], ['accent', 'sandwich $\\hat\\lambda\\pm1.96\\sqrt{\\hat B/\\hat A^2 n}$'], ['red', 'misses'], ['green', '$\\lambda^*=1/k$']]);
          info = { k, n, cM, cS, mM, mS, ratio: Math.sqrt(k), ex: 2 * Phi(1.96 * Math.sqrt(k)) - 1, seM: mean(D.map((d) => d.seM)), seS: mean(D.map((d) => d.seS)), sd: Math.sqrt(varN(D.map((d) => d.l))) };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, n, cM, cS, mM, mS, ex, seM, seS, sd } = info;
          return String.raw`$k=${v.fix(k, 2)}$, $n=${n}$, ${commas(REPS)} repeats: actual SD of $\hat\lambda$ **${v.fix(sd, 4)}**, mean model SE ${v.fix(seM, 4)}, mean sandwich SE ${v.fix(seS, 4)} · coverage: model-based **${pct(cM)}** (large-sample value ${pct(ex)}), sandwich **${pct(cS)}** · misses among the 40 shown: ${mM} vs ${mS}` + (Math.abs(k - 1) < 0.04 ? ' · the model is correct, so $A=B$ and the two intervals agree' : k < 1 ? ' · the model understates the variance by the factor $k$: its intervals are too short' : ' · the model overstates the variance: its intervals are too long');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.9
    {
      num: '5.9',
      kind: 'Method',
      name: 'M-estimators and estimating equations',
      credit: 'Huber, 1964',
      statement: String.raw`An **M-estimator** of a location parameter is a solution $\hat\theta_n$ of the **estimating equation**
$$\Psi_n(\theta)=\frac1n\sum_{i=1}^n\psi(X_i-\theta)=0,$$
equivalently (when $\psi=\rho'$) a minimizer of $\sum\rho(X_i-\theta)$. The function $\psi$ is chosen by the statistician; the estimand is the value $\theta(F)$ solving $E_F\,\psi(X-\theta)=0$. Examples:
- $\psi(u)=u$ ($\rho=u^2/2$): the sample mean;
- $\psi(u)=\operatorname{sgn}(u)$ ($\rho=|u|$): the sample median;
- $\psi(u)=-\frac{d}{du}\log f(u)$: the MLE in the location family $f(x-\theta)$;
- Huber's $\psi_k(u)=\max(-k,\min(k,u))$: quadratic $\rho$ in the middle, linear in the tails;
- Tukey's biweight $\psi_c(u)=u(1-u^2/c^2)^2$ for $|u|<c$, $0$ beyond: **redescending**, so far outliers get no weight at all.
If $\psi$ is non-decreasing, $\Psi_n$ is non-increasing in $\theta$ and the root is unique (up to an interval of roots); redescending $\psi$ can give several roots. The same idea, with $\psi(x,\theta)$ any function of data and parameter, covers MLEs (the score), moment estimators and generalized estimating equations.`,
      idea: String.raw`Every estimator that is a zero of an average is controlled by the same two quantities: how strongly each observation pushes ($\psi$ at its residual) and how the sum responds to moving $\theta$ (the slope of $\Psi_n$). The mean lets each point push in proportion to its distance, so one far point can drag the root anywhere; the median lets each point push with force $\pm1$ whatever its distance; Huber's $\psi$ is the mean for residuals below $k$ and the median beyond; the biweight stops listening altogether. The law of large numbers makes $\Psi_n(\theta)\to E\psi(X-\theta)$, which is how consistency for $\theta(F)$ follows (as in stat-5.1, stat-3.5).`,
      caption: String.raw`Left: the estimating function $\Psi_n(\theta)=\frac1n\sum\psi(x_i-\theta)$ (blue) for the ten data points (gold handles, drag them along the bottom); its zero (green) is the estimate. The mean (blue tick) and median (orange tick) of the data are marked for reference. Right: the chosen $\psi$ with each residual $x_i-\hat\theta$ marked; points on the flat parts (red) are being clipped. Drag the rightmost point far out: the mean's root follows it without limit, the median's not at all, Huber's moves a bounded amount, and the biweight forgets it entirely. With the biweight, put a few points far away together to create several roots (hollow green = local maxima of $\sum\rho$).`,
      deps: ['stat-3.5'],
      see: ['stat-5.10', 'stat-5.11'],
      refs: ['Casella–Berger §10.2'],
      tags: ['M-estimation', 'robustness', 'estimating equation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/M-estimator' },
      viz(v) {
        const PS = [{ value: 'mean', label: 'mean $\\psi(u)=u$' }, { value: 'median', label: 'median $\\operatorname{sgn}u$' }, { value: 'huber', label: 'Huber' }, { value: 'bi', label: 'biweight' }];
        const X0 = [-1.9, -1.2, -0.65, -0.15, 0.35, 0.85, 1.35, 1.9, 2.5, 4.6];
        const DEF = { huber: 1.345, bi: 4.685 };
        const psS = v.select('ψ', PS, 'huber', { onChange: (k) => { cS.el.hidden = k === 'mean' || k === 'median'; if (DEF[k]) cS.set(DEF[k]); } });
        const cS = v.slider('tuning $k$ or $c$', 0.3, 7, 1.345, { step: 0.005 });
        let yrow = -1;
        const sM = v.stage({ x: [-4, 8], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 340, weight: 1.25, xlabel: '$\\theta$', ylabel: '$\\Psi_n(\\theta)$', title: 'the estimating equation $\\frac1n\\sum\\psi(x_i-\\theta)=0$' });
        const sP = v.stage({ x: [-6, 6], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 340, weight: 0.75, minWidth: 220, xlabel: 'residual $u=x_i-\\hat\\theta$', ylabel: '$\\psi(u)$', title: 'the ψ-function and the residuals' });
        const H = X0.map((x) => sM.handle(x, yrow, { color: 'gold', r: 6, constrain: (xx) => [clamp(xx, -3.9, 7.9), yrow] }));
        v.button('Reset data', () => { H.forEach((h, i) => h.set(X0[i], yrow)); });
        const estOf = (xs, kind, c, psi) => {
          if (kind === 'mean') return [{ x: mean(xs), down: true }];
          if (kind === 'median') return [{ x: med(xs), down: true }];
          if (kind === 'huber') return [{ x: huberLoc(Float64Array.from(xs), c, new Float64Array(xs.length)), down: true }];
          return roots((t) => sumPsi(xs, psi, t), -6, 10, 1600);
        };
        const sumPsi = (xs, psi, t) => { let s = 0; for (const x of xs) s += psi(x - t); return s / xs.length; };
        let info = null;
        v.render(() => {
          const kind = psS.value, c = cS.value, psi = psiOf(kind, c), xs = H.map((h) => h.x);
          const ymax = kind === 'mean' ? 5 : kind === 'median' ? 1.25 : kind === 'huber' ? 1.25 * c : 0.36 * c;
          sM.setView([-4, 8], [-ymax, ymax]); sP.setView([-6, 6], [-ymax, ymax]);
          yrow = -0.82 * ymax;
          H.forEach((h) => { if (!h.dragging) h.set(h.x, yrow); });
          sM.hline(0, { color: 'ink', width: 1.2 });
          sM.fn((t) => sumPsi(xs, psi, t), { domain: [-4, 8], color: 'accent', width: 2.8, n: 900 });
          const R = estOf(xs, kind, c, psi);
          const pick = R.length ? R.filter((r) => r.down).reduce((a, b) => (Math.abs(b.x - med(xs)) < Math.abs(a.x - med(xs)) ? b : a), R.find((r) => r.down) || R[0]) : null;
          for (const r of R) { sM.dot(r.x, 0, { r: r === pick ? 7 : 5, color: 'green', hollow: !r.down, width: 2.4 }); }
          if (pick) { sM.vline(pick.x, { color: 'green', width: 1.4, dash: [4, 4] }); sM.tex('\\hat\\theta', pick.x, 0, { color: 'green', dy: -16, size: 15 }); }
          const mu = mean(xs), md = med(xs), tk = 0.07 * ymax;
          sM.line(mu, yrow + 2.2 * tk, mu, yrow + 4.2 * tk, { color: EC.mean, width: 3 });
          sM.line(md, yrow + 2.2 * tk, md, yrow + 4.2 * tk, { color: EC.median, width: 3 });
          const mr = mu >= md;
          sM.text('mean', mu, yrow + 3.2 * tk, { color: EC.mean, size: 10.5, dx: mr ? 6 : -6, align: mr ? 'left' : 'right' });
          sM.text('median', md, yrow + 3.2 * tk, { color: EC.median, size: 10.5, dx: mr ? -6 : 6, align: mr ? 'right' : 'left' });
          // right: ψ and the residuals
          sP.hline(0, { color: 'faint', width: 1 });
          sP.fn(psi, { domain: [-6, 6], color: 'accent', width: 2.6, n: 800 });
          if (pick) {
            const pts = xs.map((x) => x - pick.x);
            for (const u of pts) {
              const clipped = kind === 'median' ? false : kind === 'huber' ? Math.abs(u) > c : kind === 'bi' ? Math.abs(u) >= c * 0.999 : false;
              sP.dot(clamp(u, -5.9, 5.9), psi(u), { r: 4.5, color: clipped ? 'red' : 'gold' });
            }
          }
          if (kind === 'huber' || kind === 'bi') for (const sg of [-1, 1]) sP.vline(sg * c, { color: 'orange', width: 1.2, dash: [4, 4] });
          v.legend([['accent', '$\\Psi_n(\\theta)$ · $\\psi(u)$'], ['green', 'root = estimate'], ['gold', 'data / residuals'], ['red', 'clipped or ignored residuals'], ['orange', '$\\pm k$ or $\\pm c$', { dash: true }]]);
          const R0 = estOf(X0, kind, c, psi), p0 = R0.length ? R0.reduce((a, b) => (Math.abs(b.x - med(X0)) < Math.abs(a.x - med(X0)) ? b : a)) : null;
          info = { kind, c, R, pick, mu, md, moved: pick && p0 ? pick.x - p0.x : NaN, nclip: pick ? xs.filter((x) => (kind === 'huber' ? Math.abs(x - pick.x) > c : kind === 'bi' ? Math.abs(x - pick.x) >= c : false)).length : 0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { kind, c, R, pick, mu, md, moved, nclip } = info;
          const name = { mean: 'mean', median: 'median', huber: `Huber (k = ${v.fix(c, 2)})`, bi: `biweight (c = ${v.fix(c, 2)})` }[kind];
          let s = `${name}: estimate **${pick ? v.fix(pick.x, 3) : '—'}** · data mean ${v.fix(mu, 3)}, median ${v.fix(md, 3)} · moved ${v.fix(moved, 3)} from the estimate on the original data`;
          if (kind === 'huber') s += ` · ${nclip} residual${nclip === 1 ? '' : 's'} beyond ±k, each pushing with force k only`;
          if (kind === 'bi') s += ` · ${nclip} point${nclip === 1 ? '' : 's'} beyond ±c ignored · ${R.filter((r) => r.down).length} local minimum${R.filter((r) => r.down).length === 1 ? '' : 's'} of $\\sum\\rho$` + (R.length > 1 ? ' (**several roots**: redescending ψ; the one nearest the median is used)' : '');
          if (kind === 'mean') s += ' · every point pulls in proportion to its distance';
          if (kind === 'median') s += ' · every point pulls with force ±1, whatever its distance';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.10
    {
      num: '5.10',
      kind: 'Theorem',
      name: 'Asymptotic normality of M-estimators',
      credit: 'Huber, 1964 and 1967',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from $F$, and let $\hat\theta_n$ be a consistent root of $\sum\psi(X_i-\theta)=0$ for the value $\theta_0$ with $E_F\psi(X-\theta_0)=0$. Suppose $\lambda(\theta)=E_F\psi(X-\theta)$ is differentiable at $\theta_0$ with $\lambda'(\theta_0)\ne0$ (for smooth $\psi$, $-\lambda'(\theta_0)=E_F\psi'(X-\theta_0)$) and $E_F\psi(X-\theta_0)^2<\infty$, with mild regularity ($\psi$ monotone, or Lipschitz). Then
$$\sqrt n\,(\hat\theta_n-\theta_0)\ \xrightarrow{d}\ N\!\left(0,\ \frac{E_F\,\psi(X-\theta_0)^2}{\big(E_F\,\psi'(X-\theta_0)\big)^2}\right),$$
a sandwich $A^{-1}BA^{-1}$ (stat-5.8) with bread $A=E\psi'$ and meat $B=E\psi^2$. For Huber's $\psi_k$ and symmetric $F$: $E\psi_k'=P(|X|<k)$ and $E\psi_k^2=E[X^2;|X|<k]+k^2P(|X|\ge k)$. Taking $\psi=-(\log f)'$ for the true $f$ gives $A=B=I$, the MLE's $1/I$.`,
      idea: String.raw`Linearize the estimating equation: $0=\Psi_n(\hat\theta)\approx\Psi_n(\theta_0)+\lambda'(\theta_0)(\hat\theta-\theta_0)$, so $\sqrt n(\hat\theta-\theta_0)\approx-\sqrt n\,\Psi_n(\theta_0)/\lambda'(\theta_0)$. The numerator is a normalized average of i.i.d. terms with mean 0 and variance $E\psi^2$, hence normal by the CLT; Slutsky (stat-1.14) handles the denominator. For a non-smooth $\psi$ (median, Huber) the derivative of $\psi$ is replaced by the derivative of its expectation $\lambda$, which is smooth because averaging over $F$ smooths the kinks; this is why the median's variance involves the density $f(0)$. Bounded $\psi$ keeps $E\psi^2$ finite even when $F$ has no variance.`,
      caption: String.raw`Data from a contaminated normal $(1-\varepsilon)N(0,1)+\varepsilon N(0,5^2)$, location estimated by Huber's $\psi_k$ with known scale 1. Left: $\sqrt n\,\hat\theta_n$ over 2,000 repeats (gold) against the sandwich law $N(0,E\psi_k^2/(E\psi_k')^2)$ (green), and the $N(0,1)$ of the MLE under clean data (grey, dashed). Right: the exact asymptotic variance as a function of $k$ for the current $\varepsilon$ (black), from the median ($k\to0$, orange) to the mean ($k\to\infty$, blue), with the simulated $n\,\mathrm{Var}$ (gold dot). Slide $\varepsilon$ up: the mean's variance explodes, the curve's minimum moves left, and the histogram still matches the sandwich value.`,
      deps: ['stat-5.9', 'stat-5.8'],
      see: ['stat-5.13'],
      refs: ['Casella–Berger §10.2'],
      tags: ['M-estimation', 'asymptotic normality', 'sandwich'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/M-estimator#Asymptotic_distribution' },
      viz(v) {
        const TAU = 5;
        const kS = v.slider('Huber $k$', 0.1, 3, 1.345, { step: 0.005 });
        const eS = v.slider('contamination $\\varepsilon$', 0, 0.3, 0.1, { step: 0.005 });
        const nS = v.slider('sample size $n$', 10, 400, 50, { int: true, log: true });
        const sL = v.stage({ x: [-5, 5], y: [0, 0.45], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '$\\sqrt n\\,(\\hat\\theta_n-\\theta_0)$', ylabel: 'density', title: 'Huber estimates against the sandwich normal law' });
        const sR = v.stage({ x: [0, 3.5], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: 'tuning constant $k$', ylabel: 'asymptotic variance', title: 'the sandwich $E\\psi_k^2/(E\\psi_k\')^2$ across $k$' });
        const buf = new Float64Array(410);
        const R = repeater(v, {
          key: () => [kS.value.toFixed(3), eS.value.toFixed(3), nS.value].join('|'),
          sample: (r) => { const n = nS.value, xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = rmix(r, eS.value, TAU); return Math.sqrt(n) * huberLoc(xs, kS.value, buf); },
          init: 2000, buttons: [2000, 10000], seed: 'stat5.10',
        });
        let info = null;
        v.render(() => {
          const S = R.sync(), Z = S.vals, k = kS.value, eps = eS.value, comps = mixComps(eps, TAU), MV = mixVars(comps, k), V = MV.huber, sd = Math.sqrt(V);
          const W = 4.4 * Math.max(1, sd), B = binned(Z, -W, W, 46);
          sL.setView([-W, W], [0, Math.max(phi(0), phi(0) / sd, B.max) * 1.15]);
          sL.hist(B, { density: true, color: 'gold', fillAlpha: 0.38, width: 1.3 });
          sL.fn((z) => phi(z), { color: 'muted', width: 1.8, dash: [6, 4], n: 300 });
          sL.fn((z) => phi(z / sd) / sd, { color: 'green', width: 2.6, n: 300 });
          // right: V(k)
          const pts = []; let best = { k: 0, v: Infinity };
          for (let i = 0; i <= 160; i++) { const kk = 0.02 + (3.48 * i) / 160, vv = mixVars(comps, kk).huber; pts.push([kk, vv]); if (vv < best.v) best = { k: kk, v: vv }; }
          const top = Math.max(MV.median, Math.min(MV.mean, 4.5), 1.2) * 1.18;
          sR.setView([0, 3.5], [0, top]);
          sR.hline(MV.mean, { color: EC.mean, width: 1.8, dash: [6, 4] });
          sR.hline(MV.median, { color: EC.median, width: 1.8, dash: [6, 4] });
          sR.text(MV.mean > top ? `mean: ${v.fix(MV.mean, 2)} (off the top)` : 'mean (k → ∞)', 3.45, Math.min(MV.mean, top), { color: EC.mean, size: 11, align: 'right', dy: MV.mean > top ? 12 : -9, plate: true });
          sR.text('median (k → 0)', 0.1, MV.median, { color: EC.median, size: 11, align: 'left', dy: -9, plate: true });
          sR.path(pts, { color: 'ink', width: 2.6 });
          sR.dot(best.k, best.v, { r: 4, color: 'green', hollow: true, width: 2 });
          sR.vline(k, { color: 'gold', width: 1.3, dash: [4, 3] });
          const mo = moments(Z);
          sR.dot(k, mo.var, { r: 6, color: 'gold' }); sR.dot(k, V, { r: 3, color: 'ink' });
          v.legend([['gold', '$\\sqrt n\\,\\hat\\theta_n$ (histogram) · simulated $n\\,\\mathrm{Var}$', { area: true }], ['green', 'sandwich normal law'], ['muted', '$N(0,1)$: MLE, clean data', { dash: true }], ['ink', 'exact asymptotic variance in $k$'], [EC.mean, 'mean'], [EC.median, 'median']]);
          info = { k, eps, n: nS.value, V, MV, mo, N: Z.length, best };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, eps, n, V, MV, mo, N, best } = info;
          return String.raw`$k=${v.fix(k, 3)}$, $\varepsilon=${v.fix(eps, 3)}$, $n=${n}$: $E\psi_k^2=${v.fix(MV.Ep2, 4)}$, $E\psi_k'=P(|X|<k)=${v.fix(MV.Epd, 4)}$, sandwich **${v.fix(V, 4)}** · simulated $n\,\mathrm{Var}$ over ${commas(N)} repeats **${v.fix(mo.var, 4)}**, mean ${v.fix(mo.mean, 3)} · mean's variance ${v.fix(MV.mean, 3)}, median's ${v.fix(MV.median, 3)} · best $k$ here ≈ ${v.fix(best.k, 2)} (variance ${v.fix(best.v, 3)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.11
    {
      num: '5.11',
      kind: 'Definition',
      name: 'Influence function',
      credit: 'Hampel, 1968 and 1974',
      statement: String.raw`Let $T$ be a statistical functional (stat-1.7), so that an estimator is $T(F_n)$. The **influence function** of $T$ at $F$ is the effect of an infinitesimal point mass at $x$:
$$\mathrm{IF}(x;T,F)=\lim_{t\downarrow0}\frac{T\big((1-t)F+t\,\delta_x\big)-T(F)}{t}.$$
Its finite-sample version, the **sensitivity curve** $\mathrm{SC}_n(x)=(n+1)\{T(x_1,\dots,x_n,x)-T(x_1,\dots,x_n)\}$, records how far one added point at $x$ moves the estimate, per unit of mass $1/(n+1)$. For an M-estimator with $E_F\psi(X-\theta)=0$,
$$\mathrm{IF}(x;T,F)=\frac{\psi(x-T(F))}{E_F\psi'(X-T(F))},$$
so the influence function is proportional to $\psi$. At $F=N(0,1)$: the mean has $\mathrm{IF}=x$ (unbounded); the median $\operatorname{sgn}(x)/(2\phi(0))=\pm1.2533\operatorname{sgn}x$; Huber's estimator $\psi_k(x)/(2\Phi(k)-1)$. The **gross-error sensitivity** $\gamma^*=\sup_x|\mathrm{IF}(x)|$ is finite exactly when one bad observation can do only bounded harm, and $E_F\,\mathrm{IF}(X)^2$ is the asymptotic variance (stat-5.10).`,
      idea: String.raw`The influence function is the derivative of the functional in the direction of a point mass, so $T(F_n)-T(F)\approx\frac1n\sum\mathrm{IF}(X_i)$: an estimator is, to first order, an average of the influences of its observations. This one linearization explains both asymptotic normality (the CLT for that average) and robustness (whether any single term can be large). For an M-estimator, perturbing $F$ by $t\delta_x$ adds $t\,\psi(x-\theta)$ to the estimating equation, and the slope $E\psi'$ converts that push into a shift of the root.`,
      caption: String.raw`Left: a sample of 30 standard normal points (gold) and one added point (red handle); the arrows show how far the added point moves the mean (blue), median (orange) and Huber estimate (purple), magnified 30 times. Right: the sensitivity curves $\mathrm{SC}_{30}(x)$ of the three estimators as the added point sweeps across (solid), and the theoretical influence functions at $N(0,1)$ (dashed). Drag the red point outward: the mean keeps moving in proportion, while the median and Huber estimates stop: bounded influence. Change $k$ to see Huber's influence function interpolate between the median's step ($k\to0$) and the mean's line ($k\to\infty$).`,
      deps: ['stat-5.9', 'stat-1.7'],
      see: ['stat-5.12', 'stat-5.10'],
      refs: ['Casella–Berger §10.2'],
      tags: ['robustness', 'influence function', 'M-estimation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robust_statistics#Influence_function_and_sensitivity_curve' },
      viz(v) {
        const kS = v.slider('Huber $k$', 0.2, 3, 1.345, { step: 0.005 });
        let seed = 1; v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [-8, 8], y: [-0.8, 1], axes: 'box', gutter: true, height: 300, weight: 0.9, xlabel: '$x$', yticks: [], title: '30 points plus one you control' });
        const sR = v.stage({ x: [-8, 8], y: [-4, 4], axes: 'box', gutter: true, height: 300, weight: 1.1, xlabel: 'position $x$ of the added point', ylabel: 'shift × (n+1)', title: 'sensitivity curves (solid) and influence functions (dashed)' });
        const H = sL.handle(3, -0.62, { color: 'red', r: 8, label: '$x$', labelPos: 'e', constrain: (x) => [clamp(x, -7.9, 7.9), -0.62] });
        const ms = memo();
        const base = () => ms(seed, () => { const r = v.rng(hashStr('if5|' + seed)), xs = []; for (let i = 0; i < 30; i++) xs.push(r.normal()); return xs; });
        const ests = (xs, k) => ({ mean: mean(xs), median: med(xs), huber: huberLoc(Float64Array.from(xs), k, new Float64Array(xs.length)) });
        const mc = memo();
        const curves = (k) => mc(seed + '|' + k, () => {
          const xs = base(), T0 = ests(xs, k), out = { mean: [], median: [], huber: [] };
          for (let i = 0; i <= 320; i++) { const x = -8 + (16 * i) / 320, T = ests(xs.concat([x]), k); for (const key of ['mean', 'median', 'huber']) out[key].push([x, 31 * (T[key] - T0[key])]); }
          return { T0, out };
        });
        let info = null;
        v.render(() => {
          const k = kS.value, xs = base(), C = curves(k), x = H.x, T = ests(xs.concat([x]), k);
          const r = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
          sL.dots(xs.map((u, i) => [u, -0.32 + (r(i) - 0.5) * 0.3]), { r: 4, color: 'gold', alpha: 0.85 });
          sL.hline(-0.62, { color: 'faint', width: 1 });
          const lab = [['mean', EC.mean, 'mean'], ['median', EC.median, 'median'], ['huber', EC.huber, 'Huber']];
          // magnified shifts: each estimator's move from its value on the 30 points, ×30
          const Z = 30;
          sL.vline(0, { color: 'faint', width: 1 });
          sL.text(`shift of each estimate × ${Z}`, -7.8, 0.97, { color: 'muted', size: 11, align: 'left', baseline: 'top' });
          lab.forEach(([key, col, name], j) => {
            const y = 0.68 - 0.2 * j, d = Z * (T[key] - C.T0[key]), dd = clamp(d, -7.6, 7.6);
            sL.line(-7.8, y, 7.8, y, { color: 'faint', width: 0.8 });
            if (Math.abs(dd) > 0.05) sL.arrow(0, y, dd, y, { color: col, width: 3 }); else sL.dot(0, y, { r: 4, color: col });
            sL.text(name, 0, y, { color: col, size: 11, dx: d >= 0 ? -6 : 6, align: d >= 0 ? 'right' : 'left', plate: true });
            if (Math.abs(d) > 7.6) sL.text('off scale', dd, y, { color: col, size: 10.5, dy: -10, align: d > 0 ? 'right' : 'left' });
          });
          // right
          const IF = { mean: (u) => u, median: (u) => Math.sign(u) / (2 * phi(0)), huber: (u) => psiHuber(u, k) / (2 * Phi(k) - 1) };
          sR.hline(0, { color: 'faint', width: 1 });
          for (const [key, col] of lab) {
            sR.fn(IF[key], { domain: [-8, 8], color: col, width: 1.6, dash: [6, 4], n: 641 });
            sR.path(C.out[key], { color: col, width: 2.6 });
          }
          sR.vline(x, { color: 'red', width: 1.3, dash: [3, 3] });
          for (const [key, col] of lab) sR.dot(x, clamp(31 * (T[key] - C.T0[key]), -3.95, 3.95), { r: 5, color: col });
          v.legend([[EC.mean, 'mean'], [EC.median, 'median'], [EC.huber, `Huber, k = ${v.fix(k, 2)}`], ['muted', 'theoretical IF at $N(0,1)$', { dash: true }], ['red', 'added point']]);
          info = { k, x, T, T0: C.T0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, x, T, T0 } = info, g = k / (2 * Phi(k) - 1);
          const sh = (key) => v.fix(T[key] - T0[key], 4);
          return String.raw`added point at $x=${v.fix(x, 2)}$: shifts mean ${sh('mean')}, median ${sh('median')}, Huber ${sh('huber')} · gross-error sensitivity $\sup|\mathrm{IF}|$: mean $\infty$, median $1/(2\phi(0))=${v.fix(1 / (2 * phi(0)), 4)}$, Huber $k/(2\Phi(k)-1)=${v.fix(g, 4)}$` + (Math.abs(x) > 4 ? ' · far out: only the mean is still moving' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.12
    {
      num: '5.12',
      kind: 'Definition',
      name: 'Breakdown point',
      credit: 'Hodges, 1967; Hampel, 1971; Donoho & Huber, 1983',
      statement: String.raw`The (finite-sample, replacement) **breakdown point** of an estimator $T$ at a sample $x_1,\dots,x_n$ is the smallest fraction of observations that, replaced by arbitrary values, can carry the estimate arbitrarily far:
$$\varepsilon^*_n(T;x)=\min\Big\{\frac mn:\ \sup_{x'}\ |T(x')-T(x)|=\infty\Big\},$$
the supremum over all samples $x'$ that agree with $x$ except in $m$ places. Its limit $\varepsilon^*$ as $n\to\infty$ is the asymptotic breakdown point. The mean has $\varepsilon^*_n=1/n$, so $\varepsilon^*=0$; the $\alpha$-trimmed mean, which discards the $\lfloor\alpha n\rfloor$ smallest and largest points, has $\varepsilon^*=\alpha$; the median has $\varepsilon^*=\tfrac12$, the largest possible for an equivariant location estimator; Huber's M-estimator with a known (or high-breakdown) scale also has $\varepsilon^*=\tfrac12$.`,
      idea: String.raw`The influence function (stat-5.11) is a local, infinitesimal measure of robustness; the breakdown point is a global one: how much contamination an estimator survives before it can be made meaningless. For an average-type estimator, one replaced value that goes to infinity takes the average with it. A trimmed mean ignores the $g=\lfloor\alpha n\rfloor$ most extreme points on each side, so the adversary needs $g+1$ of them. The median of $n$ points is pinned between clean observations until half the sample is corrupt. Beyond half no equivariant estimator can tell the "good" part of the sample from the "bad" part.`,
      caption: String.raw`Twenty standard normal points; $m$ of them are replaced by wild values near $+M$ (red arrow). Left: the clean points (gold), the replaced originals (hollow) and the five estimates. Right: $|T|$ (log scale) as $m$ runs from 0 to 20, with the theoretical breakdown counts (dashed). Slide $m$: the mean jumps to about $mM/n$ at once, the 10% and 25% trimmed means hold until 3 and 6 points are corrupt, and the median and Huber's estimate hold until half the sample is gone. Raise $M$: everything that has broken down moves with it, everything that has not stays put.`,
      deps: ['stat-5.11'],
      see: ['stat-5.13'],
      refs: ['Casella–Berger §10.2'],
      tags: ['robustness', 'breakdown point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robust_statistics#Breakdown_point' },
      viz(v) {
        const N = 20;
        const mS = v.slider('corrupted points $m$', 0, N, 3, { int: true });
        const MS = v.slider('outlier size $M$', 10, 10000, 100, { log: true, sig: 2 });
        const sL = v.stage({ x: [-3.5, 3.5], y: [0, 6], axes: 'box', gutter: { l: 70 }, height: 340, weight: 0.95, xlabel: '$x$', yticks: [[5, 'mean'], [4, 'trim 10%'], [3, 'trim 25%'], [2, 'median'], [1, 'Huber']], title: 'the sample and five estimates' });
        const sR = v.stage({ x: [0, N], y: [1e-3, 2e4], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'corrupted points $m$ (of 20)', ylabel: '$|T|$', title: 'distance of each estimate from 0' });
        const r = v.rng(hashStr('break5')), X = [], order = [];
        for (let i = 0; i < N; i++) X.push(r.normal());
        const idx = Array.from({ length: N }, (_, i) => i); r.shuffle(idx); order.push(...idx);
        const spread = Array.from({ length: N }, (_, i) => 1 + 0.15 * (i / N));
        const sample = (m, M) => { const y = X.slice(); for (let j = 0; j < m; j++) y[order[j]] = M * spread[j]; return y; };
        const EST = [
          { key: 'mean', col: EC.mean, row: 5, f: (y) => mean(y), bd: 1 },
          { key: 'trim10', col: EC.trim, row: 4, f: (y) => trimMean(y, 0.1), bd: 3 },
          { key: 'trim25', col: EC.trim2, row: 3, f: (y) => trimMean(y, 0.25), bd: 6 },
          { key: 'median', col: EC.median, row: 2, f: (y) => med(y), bd: 10 },
          { key: 'huber', col: EC.huber, row: 1, f: (y) => huberLoc(Float64Array.from(y), 1.345, new Float64Array(N)), bd: 10 },
        ];
        const mc = memo();
        const curves = (M) => mc(M, () => EST.map((e) => { const pts = []; for (let m = 0; m <= N; m++) pts.push([m, Math.max(1.2e-3, Math.abs(e.f(sample(m, M))))]); return pts; }));
        let info = null;
        v.render(() => {
          const m = mS.value, M = +MS.value.toPrecision(2), y = sample(m, M), C = curves(M);
          // left: the sample on a fixed window; wild points shown by an arrow
          const cor = new Set(order.slice(0, m));
          X.forEach((x, i) => { if (cor.has(i)) sL.dot(x, 0.35, { r: 4, color: 'red', hollow: true, width: 1.6, alpha: 0.7 }); else sL.dot(x, 0.35, { r: 4.2, color: 'gold' }); });
          if (m) { sL.arrow(2.2, 0.35, 3.45, 0.35, { color: 'red', width: 2.4 }); sL.text(`${m} at ≈ ${commas(M)}`, 3.4, 0.35, { color: 'red', size: 11.5, dy: -12, align: 'right', weight: 700 }); }
          const T = EST.map((e) => e.f(y));
          EST.forEach((e, j) => {
            sL.hline(e.row, { color: 'faint', width: 1 });
            const t = T[j];
            if (Math.abs(t) <= 3.3) { sL.dot(t, e.row, { r: 6, color: e.col }); }
            else { sL.arrow(2.6, e.row, 3.45, e.row, { color: e.col, width: 3 }); sL.text(`${v.fmt(t, 3)}: broken`, 2.5, e.row, { color: e.col, size: 11, align: 'right', weight: 700, plate: true }); }
          });
          sL.vline(0, { color: 'green', width: 1.2, dash: [4, 4] });
          // right
          sR.setView([0, N], [1e-3, 2.5 * M]);
          EST.forEach((e, j) => {
            sR.vline(e.bd + (j === 4 ? 0.12 : 0), { color: e.col, width: 1.2, dash: [4, 4], alpha: 0.8 });
            sR.path(C[j].map(([mm, t], i) => [mm + (j - 2) * 0.06, t]), { color: e.col, width: 2.4 });
            sR.dot(m + (j - 2) * 0.06, C[j][m][1], { r: 4.5, color: e.col });
          });
          sR.hline(M, { color: 'red', width: 1, dash: [2, 3] });
          sR.text('M', 0.3, M, { color: 'red', size: 11, dy: -9, align: 'left' });
          sR.vline(m, { color: 'gold', width: 1.4, dash: [3, 3] });
          v.legend(EST.map((e) => [e.col, { mean: 'mean (1/n)', trim10: '10% trimmed (3/20)', trim25: '25% trimmed (6/20)', median: 'median (10/20)', huber: 'Huber (10/20)' }[e.key]]).concat([['muted', 'theoretical breakdown', { dash: true }]]));
          info = { m, M, T, broken: EST.filter((e, j) => Math.abs(T[j]) > 3.3).map((e) => e.key) };
        });
        v.readout(() => {
          if (!info) return '';
          const { m, M, T, broken } = info;
          const nm = { mean: 'mean', trim10: '10% trimmed', trim25: '25% trimmed', median: 'median', huber: 'Huber' };
          return `$m=${m}$ of 20 replaced by values near ${commas(M)} (fraction ${v.fix(m / 20, 2)}): ` + EST.map((e, j) => `${nm[e.key]} **${v.fmt(T[j], 3)}**`).join(', ') + ' · ' + (broken.length ? `broken down: ${broken.map((b) => nm[b]).join(', ')}` : 'nothing has broken down yet') + (m >= 10 ? ' · at half the sample even the median goes: 1/2 is the ceiling' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.13
    {
      num: '5.13',
      kind: 'Method',
      name: 'Huber’s robust location estimator',
      credit: 'Peter J. Huber, 1964',
      statement: String.raw`**Huber's estimator** of location is the M-estimator (stat-5.9) with $\psi_k(u)=\max(-k,\min(k,u))$, applied to standardized residuals $(X_i-\theta)/\hat s$ for a robust scale $\hat s$ (e.g. the normalized median absolute deviation; here the scale is known, $s=1$). Its asymptotic variance is $E\psi_k^2/(E\psi_k')^2$ (stat-5.10), its influence function is bounded by $k/E\psi_k'$ (stat-5.11) and its breakdown point is $\tfrac12$ (stat-5.12). At the normal model the choice $k=1.345$ gives 95% asymptotic efficiency. **Huber's minimax theorem** (1964): over the $\varepsilon$-contamination neighbourhood $\{(1-\varepsilon)\Phi+\varepsilon H: H\text{ symmetric}\}$, the estimator with $k=k(\varepsilon)$ solving
$$\frac{2\phi(k)}{k}-2\{1-\Phi(k)\}=\frac{\varepsilon}{1-\varepsilon}$$
minimizes the maximal asymptotic variance; it is the MLE for the least favourable distribution, normal in the middle with exponential tails.`,
      idea: String.raw`The mean is optimal at the normal and catastrophic under contamination; the median is safe but wastes 36% of the information at the normal (stat-5.3). Huber's $\psi$ behaves like the mean for small residuals, where the normal model is trusted, and like the median for large ones, where it is not. The tuning constant $k$ trades efficiency at the model for protection away from it: the efficiency loss at $\varepsilon=0$ is small for moderate $k$, while the gain under contamination is large. The minimax $k$ balances the two exactly for a given contamination level, and the least favourable distribution explains why: against an adversary who may put mass $\varepsilon$ anywhere, the hardest case has exponential tails, for which the MLE has exactly the clipped score $\psi_k$.`,
      caption: String.raw`Data: $(1-\varepsilon)N(0,1)+\varepsilon N(0,\tau^2)$. Left: the asymptotic efficiency of the mean (blue), median (orange) and Huber's estimator (purple) relative to the best possible, $1/I$ of the contaminated density (computed by numerical integration), as $\varepsilon$ runs from 0 to 0.4; dots are simulated from 1,500 samples of size 100 at the chosen $\varepsilon$. Right: those estimates, $\sqrt n\,\hat\theta$, as dartboards. At $\varepsilon=0$ Huber gives up 5% to the mean; already at a few percent contamination it wins clearly, and the mean collapses. Press the button to set Huber's minimax $k$ for the current $\varepsilon$; raise $\tau$ to make the outliers wilder.`,
      deps: ['stat-5.10', 'stat-5.12'],
      see: ['stat-5.3', 'stat-5.11'],
      refs: ['Casella–Berger §10.2'],
      tags: ['robustness', 'M-estimation', 'efficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Huber_loss' },
      viz(v) {
        const eS = v.slider('contamination $\\varepsilon$', 0, 0.4, 0.05, { step: 0.005 });
        const tS = v.slider('outlier scale $\\tau$', 2, 20, 5, { log: true, sig: 2 });
        const kS = v.slider('Huber $k$', 0.1, 3, 1.345, { step: 0.005 });
        v.button('Minimax k for this ε', () => { const k = huberK(eS.value); kS.set(clamp(Number.isFinite(k) ? k : 3, 0.1, 3)); });
        const sL = v.stage({ x: [0, 0.4], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'contamination $\\varepsilon$', ylabel: 'efficiency $\\frac{1/I}{\\text{asympt. var}}$', title: 'efficiency under contamination' });
        const sR = v.stage({ x: [-4, 4], y: [0.3, 3.7], axes: 'box', gutter: { l: 70 }, height: 340, weight: 0.9, minWidth: 240, xlabel: '$\\sqrt n\\,\\hat\\theta$', yticks: [[3, 'mean'], [2, 'median'], [1, 'Huber']], title: '1,500 estimates at the chosen ε ($n=100$)' });
        const mI = memo(), mc = memo(), NN = 100, REPS = 1500;
        const effCurves = (tau, k) => mI(tau + '|' + k, () => {
          const out = { mean: [], median: [], huber: [] };
          for (let i = 0; i <= 80; i++) { const e = (0.4 * i) / 80, I = mixInfo(e, tau), V = mixVars(mixComps(e, tau), k); out.mean.push([e, 1 / I / V.mean]); out.median.push([e, 1 / I / V.median]); out.huber.push([e, 1 / I / V.huber]); }
          return out;
        });
        const sim = (eps, tau, k) => mc([eps, tau, k].join('|'), () => {
          const r = v.rng(hashStr(`huber5|${eps}|${tau}`)), xs = new Float64Array(NN), buf = new Float64Array(NN), out = { mean: [], median: [], huber: [] };
          for (let c = 0; c < REPS; c++) { for (let i = 0; i < NN; i++) xs[i] = rmix(r, eps, tau); const rn = Math.sqrt(NN); out.mean.push(rn * mean(xs)); out.median.push(rn * medianOf(xs, NN, buf)); out.huber.push(rn * huberLoc(xs, k, buf)); }
          return out;
        });
        let info = null;
        v.render(() => {
          const eps = +eS.value.toFixed(3), tau = +tS.value.toPrecision(2), k = +kS.value.toFixed(3), C = effCurves(tau, k), S = sim(eps, tau, k);
          const I = mixInfo(eps, tau), V = mixVars(mixComps(eps, tau), k);
          sL.hline(1, { color: 'green', width: 1.2, dash: [3, 3] });
          const L = [['mean', EC.mean], ['median', EC.median], ['huber', EC.huber]];
          for (const [key, col] of L) sL.path(C[key], { color: col, width: 2.6 });
          sL.vline(eps, { color: 'gold', width: 1.3, dash: [4, 3] });
          const simEff = {};
          for (const [key, col] of L) { simEff[key] = 1 / I / varN(S[key]); sL.dot(eps, Math.min(1.04, simEff[key]), { r: 5.5, color: col }); sL.dot(eps, 1 / I / V[key], { r: 2.5, color: 'ink' }); }
          const kmm = huberK(eps);
          // right: dartboards
          const w = 3.4 * Math.sqrt(Math.max(V.median, Math.min(V.mean, 6)));
          sR.setView([-w, w], [0.3, 3.7]);
          sR.vline(0, { color: 'green', width: 1.6 });
          L.forEach(([key, col], j) => {
            const y = 3 - j, vals = S[key];
            strip(sR, vals, y, 0.3, { color: col, alpha: 0.3, r: 1.7, seed: 51 + j, max: 1500 });
            const m = mean(vals), sd = Math.sqrt(varN(vals));
            sR.line(Math.max(-w, m - sd), y - 0.4, Math.min(w, m + sd), y - 0.4, { color: col, width: 3.2 }); sR.dot(m, y - 0.4, { r: 3.4, color: 'ink' });
          });
          v.legend([[EC.mean, 'mean'], [EC.median, 'median'], [EC.huber, `Huber, k = ${v.fix(k, 3)}`], ['green', 'efficiency 1 (the MLE of the true mixture)', { dash: true }], ['ink', 'exact value at the chosen ε', { dot: true }]]);
          info = { eps, tau, k, I, V, simEff, kmm };
        });
        v.readout(() => {
          if (!info) return '';
          const { eps, tau, k, I, V, simEff, kmm } = info, e = (key) => 1 / I / V[key];
          return String.raw`$\varepsilon=${v.fix(eps, 3)}$, $\tau=${v.fix(tau, 1)}$: best possible variance $1/I=${v.fix(1 / I, 4)}$ · efficiency (exact / simulated): mean ${pct(e('mean'))} / ${pct(simEff.mean)}, median ${pct(e('median'))} / ${pct(simEff.median)}, **Huber ${pct(e('huber'))}** / ${pct(simEff.huber)} · Huber's minimax $k$ for this $\varepsilon$: ${Number.isFinite(kmm) ? v.fix(kmm, 3) : '$\\infty$ (no contamination: use the mean)'}` + (eps === 0 ? ` · at the normal model $k=1.345$ gives 95% efficiency` : '');
        });
      },
    },
  ],
};
