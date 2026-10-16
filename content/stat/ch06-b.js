// Statistical Inference — Chapter 6 (part b): items 6.11–6.21 — Wald and score tests, the classical t, chi-squared and
// exact tests, power analysis, unbiased tests, Welch's test, and the two founding papers (Pearson 1900, Neyman &
// Pearson 1933). Same visual language as part a: exact areas and sums beside simulated data sets (gold), the null in
// blue, the alternative in purple, type I error in red, and a setting that breaks each method's assumptions.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, sortNum, binned, legender, titler, repeater, lfact, mulberry,
  Phi, qnorm, dchisq1, lchoose, dbinom, rpois, golden,
  TC, Q, chiUp, chiCdf, dchi, qchi, dt, tUp, qt, nctUp, dhyper, binUp, POPS, twoSample, area, tag, mcse, pfmt,
} from './ch06.shared.js';

const zq = (a) => qnorm(1 - a);
/** Pearson's statistic Σ (O − E)²/E over cells with E > 0. */
const chi2 = (O, E) => O.reduce((s, o, i) => s + (E[i] > 0 ? (o - E[i]) ** 2 / E[i] : 0), 0);

export default {
  collection: 'stat',
  chapter: 6,
  items: [
    // ───────────────────────────────────────────────────────────── 6.11
    {
      num: '6.11',
      kind: 'Method',
      name: 'Wald test',
      credit: 'A. Wald, 1943',
      statement: String.raw`Let $\hat\theta$ be an asymptotically normal estimator of a real parameter with estimated standard error $\widehat{\mathrm{se}}$ (stat-5.5). The size-$\alpha$ **Wald test** of $H_0:\theta=\theta_0$ against $\theta\ne\theta_0$ rejects when
$$|W|>z_{\alpha/2},\qquad W=\frac{\hat\theta-\theta_0}{\widehat{\mathrm{se}}},$$
and its size tends to $\alpha$ as $n\to\infty$ whenever $W\to N(0,1)$ under $H_0$. For a Bernoulli proportion, $W=(\hat p-p_0)/\sqrt{\hat p(1-\hat p)/n}$. The guarantee is only asymptotic: for fixed $n$ the realized size can be far from $\alpha$, notably when $p_0$ is near 0 or 1, where $\hat p$ is often $0$ and the estimated standard error collapses to $0$ (then $|W|=\infty$ and the test rejects whatever $p_0$ is).`,
      idea: String.raw`The Wald test inverts the familiar interval $\hat\theta\pm z_{\alpha/2}\widehat{\mathrm{se}}$: it measures the distance from $\hat\theta$ to $\theta_0$ in units of a standard error estimated **at the estimate**, not at the null. That is convenient (one fit serves every $\theta_0$) but fragile: when the standard error depends strongly on the parameter, as $\sqrt{p(1-p)/n}$ does near 0, an unlucky small $\hat p$ makes the interval too short. The score test (stat-6.12) uses the standard error at $\theta_0$ instead and behaves far better.`,
      caption: String.raw`Left: the **exact** realized size of the nominal 5% Wald test for a Bernoulli $p_0$ (red), computed by summing binomial probabilities of every outcome it rejects, across $p_0$ on a log scale, beside the score test (green); drag the gold handle to a $p_0$ and slide $n$. Right: the binomial distribution of the number of successes at that $p_0$, with the outcomes the Wald test rejects in red; the bar at $x=0$, where the standard error is $0$, is usually the culprit. The gold dot on the left is the rejection rate in 4,000 simulated samples.`,
      deps: ['stat-5.5'],
      see: ['stat-6.12', 'stat-8.7'],
      refs: ['Wasserman §10.1'],
      tags: ['Wald test', 'binomial', 'coverage'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wald_test' },
      viz(v) {
        const nS = v.slider('sample size $n$', 10, 1000, 50, { int: true, log: true });
        const sL = v.stage({ x: [0.002, 0.5], y: [0, 0.4], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: '$p_0$', ylabel: 'realized size', title: 'exact size of the nominal 5% tests' });
        const sR = v.stage({ x: [-0.5, 10.5], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: 'number of successes $x$', ylabel: 'probability', title: 'outcomes rejected by the Wald test' });
        const hP = sL.handle(0.01, 0.35, { color: TC.sim, label: '$p_0$', labelPos: 'e', constrain: (x) => [clamp(x, 0.0025, 0.48), 0.35] });
        const z = 1.959964;
        const rejW = (x, n, p0) => { const ph = x / n, se = Math.sqrt((ph * (1 - ph)) / n); return se === 0 ? true : Math.abs(ph - p0) / se > z; };
        const rejS = (x, n, p0) => Math.abs(x / n - p0) / Math.sqrt((p0 * (1 - p0)) / n) > z;
        const size = (rej, n, p0) => { let s = 0; const m = Math.min(n, Math.ceil(n * p0 + 12 * Math.sqrt(n * p0 + 1) + 12)); for (let x = 0; x <= m; x++) if (rej(x, n, p0)) s += dbinom(x, n, p0); if (m < n && rej(m + 1, n, p0)) s += binUp(m + 1, n, p0); return s; };
        const mc = memo(), ms = memo();
        const curves = (n) => mc(n, () => { const P = Array.from({ length: 360 }, (_, i) => 0.002 * Math.pow(250, i / 359)); return { P, W: P.map((p) => size(rejW, n, p)), S: P.map((p) => size(rejS, n, p)) }; });
        const sim = (n, p0) => ms(n + '|' + p0.toFixed(5), () => { const r = v.rng(hashStr(`t6.11|${n}|${p0.toFixed(5)}`)); let k = 0; const R = 4000; for (let i = 0; i < R; i++) { let x = 0; for (let j = 0; j < n; j++) if (r() < p0) x++; if (rejW(x, n, p0)) k++; } return k / R; });
        let st = null;
        v.render(() => {
          const n = nS.value, C = curves(n), p0 = hP.x;
          const top = Math.min(1, Math.max(0.25, ...C.W) * 1.08);
          sL.setView([0.002, 0.5], [0, top]); hP.set(p0, top * 0.9);
          sL.hband(0, 0.05, { color: 'green', alpha: 0.08 });
          sL.hline(0.05, { color: 'green', width: 1.2, dash: [5, 4] });
          sL.path(C.P.map((p, i) => [p, C.S[i]]), { color: 'green', width: 2 });
          sL.path(C.P.map((p, i) => [p, C.W[i]]), { color: TC.alpha, width: 2 });
          const sw = size(rejW, n, p0), ss = size(rejS, n, p0), sm = sim(n, p0);
          sL.vline(p0, { color: TC.sim, width: 1.2, dash: [3, 3] });
          sL.dot(p0, sw, { r: 4.5, color: TC.alpha }); sL.dot(p0, sm, { r: 3, color: TC.sim });
          sL.text('nominal 5%', 0.0022, 0.05, { color: 'green', size: 11, align: 'left', dy: -9 });
          // right: pmf at p0
          const xm = Math.max(8, Math.min(n, Math.ceil(n * p0 + 4 * Math.sqrt(n * p0 * (1 - p0)) + 3)));
          let pm = 0; for (let x = 0; x <= xm; x++) pm = Math.max(pm, dbinom(x, n, p0));
          sR.setView([-0.6, xm + 0.6], [0, pm * 1.18]);
          for (let x = 0; x <= xm; x++) { const p = dbinom(x, n, p0), rw = rejW(x, n, p0), rs = rejS(x, n, p0); sR.rect(x - 0.38, 0, x + 0.38, p, { fill: rw ? TC.alpha : TC.h0, fillAlpha: rw ? 0.7 : 0.35, color: rs ? 'green' : rw ? TC.alpha : TC.h0, width: rs ? 2.2 : 1 }); }
          const p00 = dbinom(0, n, p0);
          if (rejW(0, n, p0) && p00 > 0.02) tag(sR, `x = 0: SE = 0, Wald rejects (P = ${v.fix(p00, 3)})`, 0.2, Math.min(p00, pm) * 1.06, { color: TC.alpha, align: 'left', size: 11 });
          v.legend([[TC.alpha, 'Wald test (outcomes it rejects)'], ['green', 'score test (rejected outcomes outlined)'], [TC.sim, 'simulated Wald rejection rate', { dot: true }]]);
          st = { n, p0, sw, ss, sm, p00 };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, p0, sw, ss, sm, p00 } = st;
          return String.raw`$n=${n}$, $p_0=${v.fix(p0, 4)}$: realized size of the Wald test **${v.fix(sw, 4)}** (simulated ${v.fix(sm, 3)} ± ${v.fix(2 * mcse(sw, 4000), 3)}), score test ${v.fix(ss, 4)}, nominal 0.05 · $P(X=0)=(1-p_0)^n=${v.fix(p00, 4)}$, and every such sample has $\widehat{\mathrm{se}}=0$` + (sw > 0.1 ? ' · **far above the nominal level**: the asymptotics have not arrived' : sw < 0.03 ? ' · conservative here' : ' · close to nominal');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.12
    {
      num: '6.12',
      kind: 'Method',
      name: 'Score (Rao) test',
      credit: 'C. R. Rao, 1948',
      statement: String.raw`For $H_0:\theta=\theta_0$ with log-likelihood $\ell_n$ and Fisher information $I$, the **score statistic** is
$$S=\frac{\ell_n'(\theta_0)^2}{nI(\theta_0)},$$
and the score test rejects when $S>\chi^2_{1,1-\alpha}$. It needs only the null value: no maximization. Under $H_0$, $\ell_n'(\theta_0)/\sqrt{nI(\theta_0)}\to N(0,1)$ by the central limit theorem (stat-4.3), so $S\to\chi^2_1$. The score, Wald $W=(\hat\theta-\theta_0)^2\,nI(\hat\theta)$ and likelihood-ratio $\Lambda=2\{\ell_n(\hat\theta)-\ell_n(\theta_0)\}$ statistics are asymptotically equivalent under $H_0$ and nearby alternatives, and they coincide exactly when $\ell_n$ is a parabola (a normal mean with known variance). For a binomial proportion the score test is $|\hat p-p_0|/\sqrt{p_0(1-p_0)/n}>z_{\alpha/2}$; inverting it gives the Wilson interval (stat-8.7).`,
      idea: String.raw`The three tests read the same curve in three directions. The **score** looks at the slope of the log-likelihood at $\theta_0$: if the null were true the slope would be near 0, with variance $nI(\theta_0)$. The **Wald** test looks horizontally, at the distance from $\hat\theta$ to $\theta_0$ scaled by the curvature at the peak. The **likelihood-ratio** test looks vertically, at the drop between them. On a parabola slope, distance and drop determine one another; on a skewed log-likelihood they disagree, and the score and LR tests, which respect the curvature near $\theta_0$, usually hold their size better than Wald.`,
      caption: String.raw`Left: one data set's log-likelihood $\ell(\theta)-\ell(\hat\theta)$ (blue) with the null value $\theta_0$ (gold handle): the **score** test uses the pink tangent at $\theta_0$, the **Wald** test the teal parabola with the curvature at the peak, the **likelihood-ratio** test the purple drop. Right: the three statistics as functions of $\theta_0$, with the $\chi^2_1$ 5% cutoff; where each curve is below the cutoff is that test's 95% confidence interval (bars at the bottom). For the normal mean all three curves are one. Choose the exponential rate or a binomial with few successes: the curves separate, and Wald's interval is the odd one out.`,
      deps: ['stat-4.3', 'stat-6.10', 'stat-6.11'],
      see: ['stat-5.5', 'stat-8.7'],
      refs: ['Casella–Berger §10.3'],
      tags: ['score test', 'Wald test', 'likelihood ratio test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Score_test' },
      viz(v) {
        const MOD = {
          normal: { lab: 'normal mean', p: '\\mu', r: [-1, 1], def: 0.3 },
          pois: { lab: 'Poisson mean', p: '\\lambda', r: [0.1, 4], def: 0.6 },
          expo: { lab: 'exponential rate', p: '\\theta', r: [0.25, 4], def: 0.7 },
          bin: { lab: 'binomial', p: 'p', r: [0.02, 0.98], def: 0.1 },
        };
        const modS = v.select('model', Object.entries(MOD).map(([value, m]) => ({ value, label: m.lab })), 'bin', { onChange: () => home() });
        const nS = v.slider('sample size $n$', 5, 200, 20, { int: true, log: true, onChange: () => home() });
        const uS = v.slider('observed data: estimate $\\hat\\theta$', 0, 1, 0.1, { step: 0.001, fmt: (u) => v.fix(est(u), 3), onChange: () => home() });
        const sL = v.stage({ x: [0, 1], y: [-4, 0.8], axes: 'box', gutter: true, height: 350, weight: 1.05, xlabel: '$\\theta$', ylabel: '$\\ell(\\theta)-\\ell(\\hat\\theta)$', title: 'one log-likelihood, three readings' });
        const sR = v.stage({ x: [0, 1], y: [0, 10], axes: 'box', gutter: true, height: 350, weight: 0.95, minWidth: 250, xlabel: '$\\theta_0$', ylabel: 'statistic', title: 'the three statistics against $\\theta_0$' });
        const tR = titler(sR);
        function M() { return MOD[modS.value]; }
        // the estimate on its natural lattice (counts for binomial and Poisson)
        function est(u) { const m = M(), n = nS.value, t = m.r[0] + u * (m.r[1] - m.r[0]); if (modS.value === 'bin') return clamp(Math.round(t * n), 0, n) / n; if (modS.value === 'pois') return Math.round(t * n) / n; return t; }
        uS.set((MOD.bin.def - MOD.bin.r[0]) / (MOD.bin.r[1] - MOD.bin.r[0]));
        const hT = sL.handle(0.3, -3.5, { color: TC.sim, label: '$\\theta_0$', labelPos: 'ne', constrain: (x) => [clamp(x, win()[0] + 1e-3, win()[1] - 1e-3), -3.5] });
        const se0 = (k, n, th) => (k === 'normal' ? 1 / Math.sqrt(n) : k === 'pois' ? Math.sqrt(Math.max(th, 0.2) / n) : k === 'expo' ? th / Math.sqrt(n) : Math.sqrt(Math.max(th * (1 - th), 0.02) / n));
        const win = () => { const k = modS.value, m = M(), n = nS.value, th = est(uS.value), w = 4.5 * se0(k, n, th); let a = th - w, b = th + w; if (k !== 'normal') a = Math.max(a, k === 'bin' ? 0.001 : 0.002); if (k === 'bin') b = Math.min(b, 0.999); return [a, b]; };
        const home = () => { const [a, b] = win(); sL.setView([a, b], [-4, 0.8]); sR.setView([a, b], [0, 10]); sL.setLabels(`$${M().p}$`); sR.setLabels(`$${M().p}_0$`); hT.set(a + 0.72 * (b - a), -3.5); };
        // log-likelihood, score, information per model (data: n and the estimate θ̂)
        const ll = (k, n, th, t) => { if (k === 'normal') return -0.5 * n * (th - t) ** 2; if (k === 'pois') return n * ((th > 0 ? th * Math.log(t) : 0) - t); if (k === 'expo') return n * (Math.log(t) - t / th); const x = th * n; return (x > 0 ? x * Math.log(t) : 0) + (n - x > 0 ? (n - x) * Math.log(1 - t) : 0); };
        const sc = (k, n, th, t) => (k === 'normal' ? n * (th - t) : k === 'pois' ? n * (th / t - 1) : k === 'expo' ? n * (1 / t - 1 / th) : n * (th / t - (1 - th) / (1 - t)));
        const inf = (k, t) => (k === 'normal' ? 1 : k === 'pois' ? 1 / t : k === 'expo' ? 1 / (t * t) : 1 / (t * (1 - t)));
        const stats = (k, n, th, t) => ({ W: inf(k, th) > 0 && Number.isFinite(inf(k, th)) ? (th - t) ** 2 * n * inf(k, th) : Infinity, S: sc(k, n, th, t) ** 2 / (n * inf(k, t)), L: 2 * (ll(k, n, th, th) - ll(k, n, th, t)) });
        let st = null;
        home();
        v.render(() => {
          const k = modS.value, n = nS.value, th = est(uS.value), [a, b] = win(), t0 = hT.x;
          sL.setView([a, b], [-4, 0.8]); sR.setView([a, b], [0, 10]);
          const l0 = ll(k, n, th, th), f = (t) => ll(k, n, th, t) - l0, J = n * inf(k, th);
          sL.hline(-1.92, { color: TC.alpha, width: 1, dash: [4, 4] });
          if (Number.isFinite(J)) sL.fn((t) => -0.5 * J * (t - th) ** 2, { domain: [a, b], color: 'teal', width: 2, dash: [7, 5], n: 200 });
          sL.fn(f, { domain: [a, b], color: TC.h0, width: 2.8, n: 400 });
          sL.dot(th, 0, { r: 4.5, color: TC.h0 }); sL.tex('\\hat\\theta', th, 0, { color: TC.h0, size: 14, dy: -12 });
          const d0 = f(t0), s0 = sc(k, n, th, t0);
          sL.vline(t0, { color: TC.sim, width: 1.2, dash: [3, 3] });
          sL.line(t0, Math.max(d0, -4), t0, 0, { color: TC.h1, width: 4 });
          sL.line(th, 0.4, t0, 0.4, { color: 'teal', width: 3.2 });
          if (Math.abs(sL.X(t0) - sL.X(th)) > 34) sL.text('Wald', 0.5 * (th + t0), 0.4, { color: 'teal', size: 11.5, dy: -10, weight: 700 });
          const ppx = Math.abs(sL.X(1) - sL.X(0)), ppy = Math.abs(sL.Y(1) - sL.Y(0)), dx = 40 / Math.hypot(ppx, s0 * ppy);
          if (d0 > -4) { sL.line(t0 - dx, d0 - s0 * dx, t0 + dx, d0 + s0 * dx, { color: 'pink', width: 3.2 }); sL.dot(t0, d0, { r: 4, color: 'pink' }); tag(sL, 'score: slope', t0, d0, { color: 'pink', align: t0 > th ? 'left' : 'right', dx: t0 > th ? 12 : -12, dy: 16, size: 11 }); }
          if (d0 > -3.6) tag(sL, 'LR: drop', t0, Math.max(d0, -3.6) / 2, { color: TC.h1, align: t0 > th ? 'right' : 'left', dx: t0 > th ? -10 : 10, size: 11 });
          // right: statistics as functions of θ0, and their 95% sets
          tR(`the three statistics against $${M().p}_0$`);
          const G = 300, xs = Array.from({ length: G }, (_, i) => a + ((i + 0.5) / G) * (b - a)), SS = xs.map((t) => stats(k, n, th, t));
          sR.hband(0, 3.841, { color: 'green', alpha: 0.06 });
          sR.hline(3.841, { color: TC.alpha, width: 1.2, dash: [5, 4] });
          const clipY = (y) => Math.min(y, 10.5);
          sR.path(xs.map((t, i) => [t, clipY(SS[i].L)]), { color: TC.h1, width: 2.6 });
          sR.path(xs.map((t, i) => [t, clipY(SS[i].W)]), { color: 'teal', width: 2.6, dash: k === 'normal' ? [8, 6] : undefined });
          sR.path(xs.map((t, i) => [t, clipY(SS[i].S)]), { color: 'pink', width: 2.6, dash: k === 'normal' ? [2, 6] : undefined });
          const ivs = {};
          [['L', TC.h1, 8.9], ['W', 'teal', 9.35], ['S', 'pink', 9.8]].forEach(([key, c, y]) => {
            let lo = null, hi = null; xs.forEach((t, i) => { if (SS[i][key] <= 3.841) { if (lo == null) lo = t; hi = t; } });
            ivs[key] = [lo, hi];
            if (lo != null) sR.rect(lo, y - 0.17, hi, y + 0.17, { fill: c, fillAlpha: 0.75, stroke: false });
          });
          sR.vline(t0, { color: TC.sim, width: 1.2, dash: [3, 3] });
          sR.text('95% intervals', a + 0.02 * (b - a), 9.35, { color: 'muted', size: 10.5, align: 'left' });
          v.legend([[TC.h0, 'log-likelihood'], ['pink', 'score $S$'], ['teal', 'Wald $W$'], [TC.h1, 'likelihood ratio $\\Lambda$'], [TC.alpha, '$\\chi^2_1$ 5% cutoff 3.84', { dash: true }]]);
          st = { k, n, th, t0, now: stats(k, n, th, t0), ivs };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, n, th, t0, now, ivs } = st, f = (x) => (Number.isFinite(x) ? v.fix(x, 3) : '∞'), iv = (p) => (p[0] == null ? '—' : `[${v.fix(p[0], 3)}, ${v.fix(p[1], 3)}]`);
          const data = k === 'bin' ? `x = ${Math.round(th * n)} of n = ${n}` : k === 'pois' ? `total ${Math.round(th * n)} in n = ${n}` : `n = ${n}, estimate ${v.fix(th, 3)}`;
          return `${data} · at θ₀ = ${v.fix(t0, 3)}: score **${f(now.S)}**, Wald **${f(now.W)}**, LR **${f(now.L)}** · 95% intervals: score ${iv(ivs.S)}, Wald ${iv(ivs.W)}, LR ${iv(ivs.L)}` + (k === 'normal' ? ' · a parabola: all three are the same statistic ✓' : th === 0 || th === 1 ? ' · the Wald interval has collapsed to a point (zero standard error)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.13
    {
      num: '6.13',
      kind: 'Method',
      name: 'Student’s t-tests',
      credit: 'W. S. Gosset (“Student”), 1908; R. A. Fisher, 1925',
      statement: String.raw`**One-sample.** For $X_1,\dots,X_n$ i.i.d. $N(\mu,\sigma^2)$ with $\sigma$ unknown, test $H_0:\mu=\mu_0$ with
$$T=\frac{\bar X-\mu_0}{S/\sqrt n}\sim t_{n-1}\ \text{under }H_0$$
(stat-1.10), rejecting when $|T|>t_{n-1,1-\alpha/2}$ (or one tail for a one-sided alternative). The paired $t$-test is this test applied to differences. **Two-sample.** For independent samples of sizes $n_1,n_2$ from $N(\mu_1,\sigma^2)$ and $N(\mu_2,\sigma^2)$ with a **common** variance, $T=(\bar X_1-\bar X_2)/\big(S_p\sqrt{1/n_1+1/n_2}\big)\sim t_{n_1+n_2-2}$, with $S_p^2$ the pooled variance. Both are exact for normal data, and by the central limit theorem and Slutsky (stat-1.14) asymptotically valid for any finite-variance population; for small samples from skewed populations the two tail probabilities can be badly off even when their sum is close to $\alpha$.`,
      idea: String.raw`Replacing $\sigma$ by $S$ adds uncertainty, and Student's distribution accounts for it exactly: for normal data $\bar X$ and $S^2$ are independent with $(n-1)S^2/\sigma^2\sim\chi^2_{n-1}$ (stat-1.8), and the ratio of a normal to the square root of an independent scaled chi-squared is $t$. For skewed data $\bar X$ and $S$ are correlated (a high sample mean comes with a large sample variance when the right tail is long), so $T$ itself is skewed: the left tail is too heavy, the right tail too light.`,
      caption: String.raw`Simulated $t$ statistics from 10,000 data sets (gold histogram) against the $t$ density (black), with the two 2.5% tails shaded; right, the two-sided $p$-values of the same data sets, which are uniform when the test is valid. With **normal** data both tails reject 2.5%. Choose an **exponential** or **lognormal** population at $n=10$: the histogram is skewed, the left tail rejects far too often and the right tail far too rarely, and the $p$-values are no longer flat. Raise the effect above 0: the $p$-values pile up near 0 and the rejection rate becomes the power (compared with the exact normal-theory power).`,
      deps: ['stat-1.10', 'stat-6.2'],
      see: ['stat-1.20', 'stat-6.19'],
      refs: ['Casella–Berger §8.2', 'Wasserman §10.10'],
      tags: ['t-test', 'robustness', 'p-value'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Student%27s_t-test' },
      viz(v) {
        const testS = v.select('test', [{ value: 'one', label: 'one-sample' }, { value: 'two', label: 'two-sample (equal n)' }], 'one');
        const popS = v.select('population', Object.entries(POPS).filter(([k]) => k !== 'unif').map(([value, p]) => ({ value, label: p.label.split(' (')[0] })), 'normal');
        const nS = v.slider('$n$ (per group)', 3, 200, 10, { int: true, log: true });
        const dS = v.slider('true effect (in SDs)', 0, 1.5, 0, { step: 0.05 });
        const sL = v.stage({ x: [-5, 5], y: [0, 0.45], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: '$t$', ylabel: 'density', title: 'simulated $t$ statistics' });
        const sR = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 240, xlabel: 'two-sided $p$-value', ylabel: 'density', title: '$p$-values of the same data sets' });
        const R = repeater(v, {
          key: () => [testS.value, popS.value, nS.value, dS.value].join('|'),
          sample: (r) => {
            const n = nS.value, P = POPS[popS.value], d = dS.value;
            if (testS.value === 'one') { let s = 0, q = 0; const xs = new Float64Array(n); for (let i = 0; i < n; i++) { xs[i] = d + P.draw(r); s += xs[i]; } const m = s / n; for (const x of xs) q += (x - m) ** 2; return m / Math.sqrt(q / (n - 1) / n); }
            const a = Array.from({ length: n }, () => d + P.draw(r)), b = Array.from({ length: n }, () => P.draw(r));
            return twoSample(a, b).tP;
          },
          init: 10000, buttons: [10000], seed: 'stat6.13',
        });
        let st = null;
        v.render(() => {
          const S = R.sync(), T = S.vals, N = T.length, n = nS.value, df = testS.value === 'one' ? n - 1 : 2 * n - 2, c = qt(0.975, df);
          const B = binned(T, -5, 5, 60), top = Math.max(dt(0, df) * 1.25, Math.min(B.max * 1.1, 0.9));
          sL.setView([-5, 5], [0, top]);
          area(sL, (x) => dt(x, df), -5, -c, TC.alpha, 0.35); area(sL, (x) => dt(x, df), c, 5, TC.alpha, 0.35);
          if (N) sL.hist(B, { density: true, color: TC.sim, fillAlpha: 0.3, width: 1.2 });
          sL.fn((x) => dt(x, df), { domain: [-5, 5], color: 'ink', width: 2.4, n: 300 });
          let lo = 0, hi = 0; for (const t of T) { if (t < -c) lo++; else if (t > c) hi++; }
          tag(sL, `${pct(lo / N)} below −${v.fix(c, 2)}`, -4.9, top * 0.9, { color: TC.alpha, align: 'left', size: 11 });
          tag(sL, `${pct(hi / N)} above ${v.fix(c, 2)}`, 4.9, top * 0.9, { color: TC.alpha, align: 'right', size: 11 });
          const P = T.map((t) => 2 * tUp(Math.abs(t), df)), PB = binned(P, 0, 1, 20), ptop = Math.min(8, Math.max(2, PB.max * 1.1));
          sR.setView([0, 1], [0, ptop]);
          sR.vband(0, 0.05, { color: TC.alpha, alpha: 0.12 });
          sR.hline(1, { color: 'green', width: 2 });
          if (N) sR.hist(PB, { density: true, color: TC.sim, fillAlpha: 0.35, width: 1.2 });
          if (PB.max > ptop) tag(sR, `↑ ${pct(PB.counts[0] / N, 0)} below 0.05`, 0.06, ptop * 0.9, { align: 'left', size: 11 });
          const d = dS.value, delta = testS.value === 'one' ? d * Math.sqrt(n) : d * Math.sqrt(n / 2);
          const exactPow = d > 0 ? nctUp(c, df, delta) + nctUp(c, df, -delta) : 0.05;
          v.legend([[TC.sim, `simulated, ${commas(N)} data sets`, { area: true }], ['ink', `$t_{${df}}$ density`], [TC.alpha, '2.5% tails', { area: true }], ['green', 'uniform']]);
          st = { N, lo, hi, df, c, d, exactPow, pop: popS.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { N, lo, hi, df, d, exactPow, pop } = st, tot = (lo + hi) / N, e = 2 * mcse(0.025, N);
          if (d === 0) return String.raw`null true, ${POPS[pop].label.replace(/\$/g, '')}, $t_{${df}}$ reference: left tail **${pct(lo / N, 2)}**, right tail **${pct(hi / N, 2)}** (each should be 2.5% ± ${pct(e, 2)}), two-sided size **${pct(tot, 2)}**` + (Math.abs(lo / N - 0.025) < 1.5 * e + 0.003 && Math.abs(hi / N - 0.025) < 1.5 * e + 0.003 ? ' ✓' : ' · **the tails are unbalanced**: skewness of the data makes $T$ skewed');
          return String.raw`effect ${d} SD: rejection rate (power) **${pct(tot, 1)}** vs exact normal-theory power ${pct(exactPow, 1)} (noncentral $t$) · ${pct(lo / N, 2)} of rejections are in the wrong (left) tail`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.14
    {
      num: '6.14',
      kind: 'Method',
      name: 'Pearson’s chi-squared goodness-of-fit test',
      credit: 'K. Pearson, 1900',
      statement: String.raw`Let $N$ observations fall into $k$ cells with counts $O_1,\dots,O_k$, multinomial with probabilities $p_1,\dots,p_k$. To test $H_0:p=p^{(0)}$ compute the expected counts $E_j=Np^{(0)}_j$ and
$$X^2=\sum_{j=1}^k\frac{(O_j-E_j)^2}{E_j}.$$
Under $H_0$, $X^2\to\chi^2_{k-1}$ as $N\to\infty$, so the test rejects when $X^2>\chi^2_{k-1,1-\alpha}$. If $H_0$ specifies $p$ only up to $m$ parameters estimated from the same counts (by maximum likelihood on the grouped data), the limit is $\chi^2_{k-1-m}$ (Fisher, 1924). The usual rule of thumb asks for all $E_j\ge5$; with small expected counts the null distribution of $X^2$ is lumpy and its tail can differ noticeably from $\chi^2_{k-1}$.`,
      idea: String.raw`Each standardized deviation $(O_j-E_j)/\sqrt{E_j}$ is approximately normal by the central limit theorem, but the deviations are tied together by $\sum_j(O_j-E_j)=0$, so the vector lives in a $(k-1)$-dimensional subspace. Its covariance there is the identity, so the squared length is $\chi^2_{k-1}$. Equivalently, $X^2$ is the quadratic (score-type) approximation to the likelihood-ratio statistic $G^2=2\sum O_j\log(O_j/E_j)$, and Wilks' theorem (stat-6.10) gives the same limit.`,
      caption: String.raw`Left: one experiment of $N$ rolls; observed counts (gold) against expected counts (blue outline), each cell labelled with its contribution $(O-E)^2/E$. Right: the statistic $X^2$ over thousands of repeated experiments against the $\chi^2_5$ density, with the 5% cutoff 11.07. Load the die and the histogram slides right (power). With a fair die the fit is excellent for $N=60$ and up; drop $N$ to 6 or 12 (expected counts 1 or 2) and the histogram becomes a comb of spikes; choose **uneven cells**, where one cell expects only 2% of the rolls, and the tail is distorted even at moderate $N$.`,
      deps: ['stat-1.8', 'stat-6.10'],
      see: ['stat-6.20', 'stat-6.15'],
      refs: ['Wasserman §10.4'],
      tags: ['chi-squared test', 'goodness of fit', 'categorical data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pearson%27s_chi-squared_test' },
      viz(v) {
        const CELLS = { fair: [1, 1, 1, 1, 1, 1].map((x) => x / 6), uneven: [0.3, 0.25, 0.2, 0.15, 0.08, 0.02] };
        const cellS = v.select('null probabilities', [{ value: 'fair', label: 'fair die' }, { value: 'uneven', label: 'uneven cells (one at 2%)' }], 'fair');
        const NS = v.slider('rolls per experiment $N$', 6, 600, 60, { int: true, log: true });
        const wS = v.slider('loading toward the last face', 0, 1, 0, { step: 0.02 });
        const truth = () => { const p0 = CELLS[cellS.value], q = p0.map((p, j) => (j === 5 ? p * (1 + 3 * wS.value) : p)), s = q.reduce((a, b) => a + b, 0); return q.map((x) => x / s); };
        const sL = v.stage({ x: [0.4, 6.6], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: 'face', ylabel: 'count', xticks: [1, 2, 3, 4, 5, 6], title: 'one experiment: observed and expected counts' });
        const sR = v.stage({ x: [0, 25], y: [0, 0.2], axes: 'box', gutter: true, height: 330, weight: 1.05, xlabel: '$X^2$', ylabel: 'density', title: '$X^2$ over repeated experiments' });
        const roll = (r, N, q) => { const O = [0, 0, 0, 0, 0, 0], cq = []; let s = 0; for (const x of q) cq.push((s += x)); for (let i = 0; i < N; i++) { const u = r(); let j = 0; while (j < 5 && u > cq[j]) j++; O[j]++; } return O; };
        const R = repeater(v, { key: () => [cellS.value, NS.value, wS.value].join('|'), sample: (r) => roll(r, NS.value, truth()), init: 5000, buttons: [1, 5000], seed: 'stat6.14' });
        let st = null;
        v.render(() => {
          const S = R.sync(), N = NS.value, p0 = CELLS[cellS.value], E = p0.map((p) => N * p), sims = S.vals, O = S.last || [0, 0, 0, 0, 0, 0];
          const X = sims.map((o) => chi2(o, E)), x0 = chi2(O, E), M = sims.length;
          const ymax = Math.max(...O, ...E) * 1.25;
          sL.setView([0.4, 6.6], [0, ymax]);
          for (let j = 0; j < 6; j++) {
            sL.rect(j + 1 - 0.32, 0, j + 1 + 0.32, O[j], { fill: TC.sim, fillAlpha: 0.6, color: TC.sim, width: 1 });
            sL.rect(j + 1 - 0.38, 0, j + 1 + 0.38, E[j], { color: TC.h0, width: 2, fill: false });
            const cj = E[j] > 0 ? (O[j] - E[j]) ** 2 / E[j] : 0;
            sL.text(v.fix(cj, 2), j + 1, Math.max(O[j], E[j]), { color: E[j] < 5 ? TC.alpha : 'ink', size: 11, dy: -9 });
          }
          sL.corner(`X² = ${v.fix(x0, 2)}`, 'tr', { color: x0 > 11.07 ? TC.alpha : 'ink', weight: 700 });
          const xmax = Math.max(25, qchi(5, 0.999)), B = binned(X, 0, xmax, 60), top = Math.max(0.2, Math.min(B.max * 1.1, 0.6));
          sR.setView([0, xmax], [0, top]);
          area(sR, (x) => dchi(5, x), 11.07, xmax, TC.alpha, 0.25);
          if (M) sR.hist(B, { density: true, color: TC.sim, fillAlpha: 0.35, width: 1.1 });
          sR.fn((x) => dchi(5, x), { domain: [0.01, xmax], color: 'ink', width: 2.4, n: 300 });
          sR.vline(11.07, { color: TC.alpha, width: 1.4, dash: [5, 4] });
          sR.vline(Math.min(x0, xmax), { color: TC.h1, width: 2 });
          const rej = X.filter((x) => x > 11.0705).length / Math.max(1, M), minE = Math.min(...E);
          v.legend([[TC.sim, 'observed counts', { area: true }], [TC.h0, 'expected counts'], [TC.sim, `$X^2$, ${commas(M)} experiments`, { area: true }], ['ink', '$\\chi^2_5$ density'], [TC.h1, 'this experiment']]);
          st = { N, x0, rej, M, minE, w: wS.value, p: chiUp(5, x0) };
        });
        v.readout(() => {
          if (!st) return '';
          const { N, x0, rej, M, minE, w, p } = st;
          let s = String.raw`this experiment: $X^2=${v.fix(x0, 2)}$, $p=${pfmt(p)}$ (from $\chi^2_5$) · over ${commas(M)} experiments the 5% test rejects **${pct(rej, 2)}**`;
          if (w === 0) s += ` (nominal 5% ± ${pct(2 * mcse(0.05, M), 2)})` + (minE < 5 ? ` · smallest expected count ${v.fix(minE, 2)} < 5: the χ² approximation is unreliable` : ' ✓');
          else s += ' = the power against this loaded die';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.15
    {
      num: '6.15',
      kind: 'Method',
      name: 'Chi-squared test of independence',
      statement: String.raw`A sample of $N$ individuals is cross-classified by two factors into an $r\times c$ table of counts $O_{ij}$. Under $H_0$: the factors are independent ($p_{ij}=p_{i\cdot}p_{\cdot j}$), the estimated expected counts are $E_{ij}=O_{i\cdot}O_{\cdot j}/N$ (row total × column total / grand total), and
$$X^2=\sum_{i,j}\frac{(O_{ij}-E_{ij})^2}{E_{ij}}\ \xrightarrow{\ d\ }\ \chi^2_{(r-1)(c-1)}.$$
The degrees of freedom are $rc-1$ cells minus $(r-1)+(c-1)$ estimated margins (stat-6.14). The **Pearson residuals** $(O_{ij}-E_{ij})/\sqrt{E_{ij}}$ show which cells drive a rejection. A **permutation test** gives an exact reference without the large-sample approximation: shuffle one factor's labels among individuals (keeping both margins) and recompute $X^2$.`,
      idea: String.raw`Independence pins the table down to its margins, so the expected table is the outer product of the row and column proportions; $X^2$ measures how far the observed table is from that rank-one table. Shuffling the column labels breaks any association while keeping the margins fixed, which is exactly the null hypothesis, so the shuffled statistics are draws from its conditional null distribution; the same conditioning gives Fisher's exact test for $2\times2$ tables (stat-6.16).`,
      caption: String.raw`The table of observed counts, each cell coloured by its Pearson residual (red: more than independence predicts, blue: fewer) with the expected count in the corner. **Click** a cell to add one individual, **shift-click** to remove one. Right: $X^2$ for 2,000 tables with the eye-colour labels shuffled (gold) against the $\chi^2$ density, with the observed value. Snee's hair-and-eye-colour data reject independence overwhelmingly (blond hair with blue eyes, black and brown hair with brown eyes). Choose the **small table**: expected counts below 5 make the $\chi^2$ $p$-value and the permutation $p$-value disagree.`,
      deps: ['stat-6.14', 'stat-2.1'],
      see: ['stat-6.16'],
      refs: ['Wasserman §15.2'],
      tags: ['contingency table', 'chi-squared test', 'permutation test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pearson%27s_chi-squared_test#Testing_for_statistical_independence' },
      viz(v) {
        const PRE = {
          snee: { lab: 'hair × eye colour (Snee 1974)', rows: ['black', 'brown', 'red', 'blond'], cols: ['brown', 'blue', 'hazel', 'green'], corner: 'hair \\ eye', O: [[68, 20, 15, 5], [119, 84, 54, 29], [26, 17, 14, 14], [7, 94, 10, 16]] },
          small: { lab: 'small table', rows: ['treated', 'control'], cols: ['improved', 'same', 'worse'], corner: '', O: [[6, 2, 1], [2, 3, 5]] },
        };
        let cur = 'snee', O = PRE.snee.O.map((r) => r.slice());
        const preS = v.select('data', Object.entries(PRE).map(([value, p]) => ({ value, label: p.lab })), 'snee', { onChange: (k) => { cur = k; O = PRE[k].O.map((r) => r.slice()); T = mkT(); } });
        v.button('Reset counts', () => { O = PRE[cur].O.map((r) => r.slice()); });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.05, title: 'observed counts, coloured by Pearson residual' });
        const sR = v.stage({ x: [0, 40], y: [0, 0.2], axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: '$X^2$', ylabel: 'density', title: 'permutation reference (labels shuffled)' });
        const mkT = () => { const P = PRE[cur]; return v.table(sT, { rows: P.rows.length, cols: P.cols.length, rowLabels: P.rows, colLabels: P.cols, cornerLabel: P.corner, maxCell: 70, size: 16, subSize: 10 }); };
        let T = mkT();
        sT.onClick((x, y, mod) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) O[c.i][c.j] = Math.max(0, O[c.i][c.j] + (mod.shift ? -1 : 1)); });
        const expected = (O) => { const r = O.map((row) => row.reduce((a, b) => a + b, 0)), c = O[0].map((_, j) => O.reduce((a, row) => a + row[j], 0)), N = r.reduce((a, b) => a + b, 0); return { E: O.map((row, i) => row.map((_, j) => (N ? (r[i] * c[j]) / N : 0))), r, c, N }; };
        const X2 = (O, E) => { let s = 0; O.forEach((row, i) => row.forEach((o, j) => { if (E[i][j] > 0) s += (o - E[i][j]) ** 2 / E[i][j]; })); return s; };
        const mc = memo();
        const perm = (key, O) => mc(key, () => {
          const { E, r, c } = expected(O), rowLab = [], colLab = [];
          r.forEach((n, i) => { for (let k = 0; k < n; k++) rowLab.push(i); }); c.forEach((n, j) => { for (let k = 0; k < n; k++) colLab.push(j); });
          const rng = v.rng(hashStr('t6.15|' + key)), out = new Float64Array(2000), R = O.length, C = O[0].length;
          for (let m = 0; m < 2000; m++) {
            for (let k = colLab.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)), t = colLab[k]; colLab[k] = colLab[j]; colLab[j] = t; }
            const tab = Array.from({ length: R }, () => new Array(C).fill(0)); for (let k = 0; k < rowLab.length; k++) tab[rowLab[k]][colLab[k]]++;
            out[m] = X2(tab, E);
          }
          return out;
        });
        let st = null;
        v.render(() => {
          const { E, N } = expected(O), x0 = X2(O, E), R = O.length, C = O[0].length, df = (R - 1) * (C - 1);
          const res = O.map((row, i) => row.map((o, j) => (E[i][j] > 0 ? (o - E[i][j]) / Math.sqrt(E[i][j]) : 0)));
          T.draw({ value: (i, j) => O[i][j], fill: (i, j) => v.diverge(clamp(res[i][j] / 6, -1, 1), 'blue', 'red'), sub: (i, j) => `E ${v.fix(E[i][j], 1)}`, subColor: (i, j) => (E[i][j] < 5 ? 'red' : 'muted') });
          const P = N > 1 ? perm(JSON.stringify(O), O) : new Float64Array(0);
          const pmax = P.length ? Math.max(...P) : 10, xmax = Math.max(qchi(df, 0.999) * 1.15, Math.min(pmax * 1.05, 4 * df + 30));
          const B = binned(P, 0, xmax, 50), top = Math.max(dchi(df, Math.max(df - 2, 0.3)) * 1.25, Math.min(B.max * 1.1, 1));
          sR.setView([0, xmax], [0, top]);
          if (P.length) sR.hist(B, { density: true, color: TC.sim, fillAlpha: 0.35, width: 1.1 });
          sR.fn((x) => dchi(df, x), { domain: [0.01, xmax], color: 'ink', width: 2.2, n: 300 });
          if (x0 <= xmax) { sR.vline(x0, { color: TC.h1, width: 2.4 }); tag(sR, `observed ${v.fix(x0, 2)}`, x0, top * 0.9, { color: TC.h1, align: x0 > xmax * 0.6 ? 'right' : 'left', dx: x0 > xmax * 0.6 ? -6 : 6, size: 11 }); }
          else { sR.arrow(xmax * 0.72, top * 0.8, xmax * 0.99, top * 0.8, { color: TC.h1, width: 2.4 }); tag(sR, `observed ${v.fix(x0, 1)} is far off the scale`, xmax * 0.7, top * 0.8, { color: TC.h1, align: 'right', size: 11 }); }
          let ge = 0; for (const p of P) if (p >= x0 - 1e-9) ge++;
          v.legend([['red', 'more than expected', { area: true }], ['blue', 'fewer than expected', { area: true }], [TC.sim, 'shuffled tables', { area: true }], ['ink', `$\\chi^2_{${df}}$ density`]]);
          st = { x0, df, N, pchi: chiUp(df, x0), pperm: (ge + 1) / (P.length + 1), ge, minE: Math.min(...E.flat()), res, R, C };
        });
        v.readout(() => {
          if (!st) return '';
          const { x0, df, N, pchi, pperm, ge, minE, res } = st;
          let big = [0, 0, 0]; res.forEach((row, i) => row.forEach((z, j) => { if (Math.abs(z) > Math.abs(big[0])) big = [z, i, j]; }));
          const P = PRE[cur];
          return String.raw`$N=${N}$: $X^2=${v.fix(x0, 2)}$ on $(r-1)(c-1)=${df}$ degrees of freedom · $\chi^2$ $p$-value ${pfmt(pchi)} · permutation $p$-value ${ge === 0 ? '< 1/2001' : pfmt(pperm)} (${ge} of 2,000 shuffles at least as large) · largest residual ${v.fix(big[0], 2)} at (${P.rows[big[1]]}, ${P.cols[big[2]]})` + (minE < 5 ? ` · smallest expected count ${v.fix(minE, 2)} < 5: trust the permutation reference` : '');
        });
      },
    },
  ],
};
