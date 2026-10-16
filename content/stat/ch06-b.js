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
      caption: String.raw`Left: one data set's log-likelihood $\ell(\theta)-\ell(\hat\theta)$ (blue) with the null value $\theta_0$ (gold handle): the **score** test uses the pink tangent at $\theta_0$, the **Wald** test the teal parabola with the curvature at the peak, the **likelihood-ratio** test the purple drop. Right: the three statistics as functions of $\theta_0$, with the $\chi^2_1$ 5% cutoff; where each curve is below the cutoff is that test's 95% confidence interval (bars at the top). For the normal mean all three curves are one. Choose the exponential rate or a binomial with few successes: the curves separate, and Wald's interval is the odd one out.`,
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
        const modS = v.select('model', Object.entries(MOD).map(([value, m]) => ({ value, label: m.lab })), 'bin', { onChange: () => { uS.set(uS.value); home(); } });
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
          sR.text('95% intervals ↑', a + 0.02 * (b - a), 8.45, { color: 'muted', size: 10.5, align: 'left' });
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
(stat-1.10), rejecting when $|T|>t_{n-1,1-\alpha/2}$ (or one tail for a one-sided alternative). The paired $t$-test is this test applied to differences. **Two-sample.** For independent samples of sizes $n_1,n_2$ from $N(\mu_1,\sigma^2)$ and $N(\mu_2,\sigma^2)$ with a **common** variance, $T=(\bar X_1-\bar X_2)/\big(S_p\sqrt{1/n_1+1/n_2}\big)\sim t_{n_1+n_2-2}$, with $S_p^2$ the pooled variance. Both are exact for normal data, and by the central limit theorem and Slutsky (stat-1.14) asymptotically valid for any finite-variance population; for small samples from skewed populations the two tail probabilities can be badly off, one too large and the other too small.`,
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
    // ───────────────────────────────────────────────────────────── 6.16
    {
      num: '6.16',
      kind: 'Method',
      name: 'Fisher’s exact test',
      credit: 'R. A. Fisher, 1935',
      statement: String.raw`For a $2\times2$ table with cells $a,b$ (first row) and $c,d$ (second row), condition on both margins. Under the null hypothesis of independence (or of equal proportions in the two rows), the top-left count $A$ then has the **hypergeometric** distribution
$$P(A=a)=\frac{\binom{a+b}{a}\binom{c+d}{c}}{\binom{n}{a+c}},\qquad n=a+b+c+d,$$
free of every unknown parameter (stat-2.12). **Fisher's exact test** computes the $p$-value from this distribution: one-sided, $P(A\ge a_{\text{obs}})$; two-sided, the total probability of tables no more probable than the observed one. Its size never exceeds $\alpha$ for any sample size, at the price of being conservative because the distribution is discrete. Example (the lady tasting tea): of 8 cups, 4 have milk poured first; a taster who must name 4 cups as milk-first and has no ability gets all 4 right with probability $1/\binom84=1/70\approx0.014$.`,
      idea: String.raw`Conditioning on the margins removes the nuisance parameters (the overall proportions), exactly as a sufficient statistic would (stat-2.11): given the margins, every arrangement of the individuals is equally likely under the null, and counting arrangements gives the hypergeometric law. Fisher designed the tea experiment so that randomization alone justifies the test: the cups are assigned at random, so the only probability needed is the one created by the experimenter.`,
      caption: String.raw`**Tea tasting**: $2m$ cups, $m$ with milk poured first (purple ring, shown when the truth is revealed). Click cups to choose which $m$ you think are milk-first (gold). Right: the hypergeometric distribution of the number of correct milk-first calls by a guesser with no ability, with the $p$-value shaded. A perfect score with 8 cups earns $p=1/70$; with 6 cups the best possible $p$ is $1/20$, so no result could be significant at 1%. **2×2 table**: click (shift-click) cells to edit a table; the exact two-sided $p$-value is compared with the $\chi^2$ approximation, which is poor when counts are small.`,
      deps: ['stat-6.15', 'stat-2.12'],
      see: ['stat-2.11'],
      refs: ['Wasserman §15.1'],
      tags: ['exact test', 'hypergeometric', 'lady tasting tea'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fisher%27s_exact_test' },
      viz(v) {
        const modeS = v.select('view', [{ value: 'tea', label: 'tea tasting' }, { value: 'tab', label: '2×2 table' }], 'tea');
        const mS = v.slider('milk-first cups $m$ (of $2m$)', 2, 8, 4, { int: true, onChange: () => pour() });
        const revS = v.toggle('reveal the truth', true);
        const bNew = v.button('Pour new cups', () => { seed++; pour(); });
        const bRnd = v.button('Random guesser', () => { const r = v.rng(hashStr('guess' + seed + '|' + Date.now())); const idx = Array.from({ length: 2 * mS.value }, (_, i) => i); for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; } guess = new Set(idx.slice(0, mS.value)); });
        const sL = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 320, weight: 1, title: 'the cups (click to choose milk-first)' });
        const sR = v.stage({ x: [-0.5, 4.5], y: [0, 0.6], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'correct milk-first calls', ylabel: 'probability', title: 'null distribution (no ability)' });
        const tL = titler(sL), tR = titler(sR);
        let seed = 3, truth = new Set(), guess = new Set();
        const pour = () => { const m = mS.value, r = v.rng(hashStr('tea|' + seed + '|' + m)), idx = Array.from({ length: 2 * m }, (_, i) => i); for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; } truth = new Set(idx.slice(0, m)); guess = new Set(truth); };
        pour();
        let tab = [[3, 1], [1, 3]];
        const T = v.table(sL, { rows: 2, cols: 2, rowLabels: ['milk first', 'tea first'], colLabels: ['called milk', 'called tea'], maxCell: 80, size: 20 });
        const cupPos = (i) => { const m = mS.value, row = i < m ? 0 : 1, col = i % m; return [(col + 0.5) / m, row ? 0.3 : 0.7]; };
        sL.onClick((x, y, mod) => {
          if (modeS.value === 'tab') { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) tab[c.i][c.j] = Math.max(0, tab[c.i][c.j] + (mod.shift ? -1 : 1)); return; }
          const m = mS.value; let best = -1, bd = 1e9; for (let i = 0; i < 2 * m; i++) { const [cx, cy] = cupPos(i), d = Math.hypot(x - cx, (y - cy) * 0.6); if (d < bd) { bd = d; best = i; } }
          if (bd < 0.6 / m + 0.05) { if (guess.has(best)) guess.delete(best); else guess.add(best); }
        });
        const fisher2 = (t) => {
          const [[a, b], [c, d]] = t, r1 = a + b, c1 = a + c, n = a + b + c + d, lo = Math.max(0, c1 - (n - r1)), hi = Math.min(r1, c1);
          const P = []; for (let k = lo; k <= hi; k++) P.push([k, dhyper(k, n, r1, c1)]);
          const pobs = dhyper(a, n, r1, c1); let two = 0, up = 0; for (const [k, p] of P) { if (p <= pobs * (1 + 1e-7)) two += p; if (k >= a) up += p; }
          const E = [[(r1 * c1) / n, (r1 * (n - c1)) / n], [((n - r1) * c1) / n, ((n - r1) * (n - c1)) / n]];
          let x2 = 0; t.forEach((row, i) => row.forEach((o, j) => { if (E[i][j] > 0) x2 += (o - E[i][j]) ** 2 / E[i][j]; }));
          return { P, lo, hi, two, up, x2, pchi: chiUp(1, x2), E, n, a };
        };
        let st = null;
        v.render(() => {
          const tea = modeS.value === 'tea', m = mS.value;
          mS.el.hidden = !tea; revS.el.hidden = !tea; bNew.hidden = !tea; bRnd.hidden = !tea;
          if (tea) {
            tL('the cups (click to choose milk-first)');
            const rc = Math.min(0.38 / m, 0.075), rev = revS.value;
            let k = 0; for (const i of guess) if (truth.has(i)) k++;
            for (let i = 0; i < 2 * m; i++) {
              const [cx, cy] = cupPos(i), g = guess.has(i), t = truth.has(i);
              sL.circle(cx, cy, rc, { fill: g ? TC.sim : 'panel', fillAlpha: g ? 0.85 : 1, color: rev ? (t ? TC.h1 : TC.h0) : 'muted', width: rev ? 4 : 1.5 });
              sL.rect(cx + rc * 0.95, cy - rc * 0.35, cx + rc * 1.35, cy + rc * 0.35, { color: rev ? (t ? TC.h1 : TC.h0) : 'muted', width: 2, fill: false, radius: 4 });
              if (rev && g) sL.text(t ? '✓' : '✗', cx, cy, { color: t ? 'green' : 'red', size: 16, weight: 700, baseline: 'middle' });
            }
            sL.text(`${guess.size} of ${m} chosen`, 0.5, 0.06, { color: guess.size === m ? 'muted' : 'red', size: 12, weight: 600 });
            const N = 2 * m, P = Array.from({ length: m + 1 }, (_, j) => dhyper(j, N, m, m)), ok = guess.size === m;
            sR.setView([-0.5, m + 0.5], [0, Math.max(...P) * 1.2]); sR.setTicks(Array.from({ length: m + 1 }, (_, j) => j), null);
            tR(`null distribution: ${N} cups, ${m} milk-first`); sR.setLabels('correct milk-first calls');
            let pv = 0; for (let j = 0; j <= m; j++) { const tail = ok && rev && j >= k; if (tail) pv += P[j]; sR.rect(j - 0.36, 0, j + 0.36, P[j], { fill: tail ? TC.alpha : TC.h0, fillAlpha: tail ? 0.7 : 0.35, color: tail ? TC.alpha : TC.h0, width: 1 }); sR.text(`${Math.round(P[j] * Math.exp(lchoose(N, m)))}/${Math.round(Math.exp(lchoose(N, m)))}`, j, P[j], { size: 10.5, color: 'muted', dy: -8 }); }
            if (ok && rev) sR.vline(k - 0.5, { color: TC.alpha, width: 1.4, dash: [4, 3] });
            v.legend([[TC.sim, 'called milk-first', { area: true }], ...(rev ? [[TC.h1, 'truly milk-first'], [TC.h0, 'truly tea-first']] : []), [TC.alpha, 'p-value: P(at least this many correct)', { area: true }]]);
            st = { tea, m, k, ok, rev, pv, best: P[m] };
          } else {
            tL('a 2×2 table (click +1, shift-click −1)');
            const F = fisher2(tab);
            T.draw({ value: (i, j) => tab[i][j], sub: (i, j) => `E ${v.fix(F.E[i][j], 1)}`, subColor: (i, j) => (F.E[i][j] < 5 ? 'red' : 'muted'), fill: (i, j) => (i === 0 && j === 0 ? [TC.sim, 0.35] : null) });
            const pm = Math.max(...F.P.map((q) => q[1]));
            sR.setView([F.lo - 0.6, F.hi + 0.6], [0, pm * 1.2]); sR.setTicks(F.P.length <= 16 ? F.P.map((q) => q[0]) : null, null);
            tR('hypergeometric law of the top-left cell'); sR.setLabels('top-left count $a$ (margins fixed)');
            const pobs = dhyper(F.a, F.n, tab[0][0] + tab[0][1], tab[0][0] + tab[1][0]);
            for (const [k, p] of F.P) { const inT = p <= pobs * (1 + 1e-7); sR.rect(k - 0.36, 0, k + 0.36, p, { fill: inT ? TC.alpha : TC.h0, fillAlpha: inT ? 0.65 : 0.35, color: k === F.a ? 'ink' : inT ? TC.alpha : TC.h0, width: k === F.a ? 2.4 : 1 }); }
            v.legend([[TC.alpha, 'tables no more probable than the observed one (two-sided p)', { area: true }], [TC.h0, 'other tables', { area: true }]]);
            st = { tea, F };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.tea) {
            const { m, k, ok, rev, pv, best } = st;
            if (!ok) return `choose exactly ${m} cups as milk-first (now ${guess.size})`;
            if (!rev) return `${m} cups chosen · reveal the truth to score them · a perfect score would have probability 1/${commas(Math.round(1 / best))} = ${v.fix(best, 4)} for a guesser`;
            return String.raw`${k} of ${m} milk-first cups identified · exact $p=P(K\ge${k})=${v.fix(pv, 4)}$` + (k === m ? ` = 1/${commas(Math.round(1 / best))}` : '') + (pv <= 0.05 ? ' · significant at 5%' : ' · not significant at 5%') + (best > 0.01 ? ` · with ${2 * m} cups even a perfect score has p = ${v.fix(best, 3)}: the experiment cannot reach 1%` : '');
          }
          const { F } = st;
          return String.raw`$n=${F.n}$ · Fisher exact $p$: two-sided **${v.fix(F.two, 4)}**, one-sided $P(A\ge${F.a})=${v.fix(F.up, 4)}$ · Pearson $X^2=${v.fix(F.x2, 3)}$, $\chi^2_1$ $p$-value ${v.fix(F.pchi, 4)}` + (Math.min(...F.E.flat()) < 5 ? ` · expected counts below 5: the χ² approximation is unreliable (here it is ${F.pchi < F.two ? 'anti-conservative' : 'conservative'})` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.17
    {
      num: '6.17',
      kind: 'Method',
      name: 'Power analysis and sample size',
      statement: String.raw`Before collecting data, choose the level $\alpha$, the smallest effect worth detecting and the power $1-\beta$ wanted against it; then find the smallest sample size whose power function (stat-6.3) reaches $1-\beta$ there. For a one-sided $z$-test of a normal mean with known $\sigma$ and standardized effect $d=(\mu_1-\mu_0)/\sigma$,
$$n=\Big(\frac{z_\alpha+z_\beta}{d}\Big)^2;$$
for the two-sided two-sample $t$-test with $n$ per group the power is a noncentral-$t$ probability with noncentrality $d\sqrt{n/2}$ and $2n-2$ degrees of freedom, and $n\approx2(z_{\alpha/2}+z_\beta)^2/d^2$ (so $d=0.5$, $\alpha=0.05$, 80% power needs about 64 per group). An underpowered study is wasteful twice: it usually misses real effects, and the effects it does declare significant are disproportionately false positives or exaggerated.`,
      idea: String.raw`Power depends on the effect only through the noncentrality $d\sqrt{n/2}$, the expected value of the test statistic, so halving the effect quadruples the required $n$. The base-rate consequence is Bayes' rule with frequencies: among many tested hypotheses of which a fraction $\pi$ are real, significant results come from true effects at rate $\pi(1-\beta)$ and from true nulls at rate $(1-\pi)\alpha$, so the fraction of significant results that are false is $(1-\pi)\alpha/\{(1-\pi)\alpha+\pi(1-\beta)\}$, which is large when power or $\pi$ is low.`,
      caption: String.raw`Left: the exact power of the two-sided two-sample $t$-test against $n$ per group (blue; the normal approximation dashed), the target (green line) and the solved $n$. Middle: $p$-values from 1,000 simulated studies at that $n$ (each simulated through its sufficient statistics, the mean difference and the pooled variance) when the effect is real (gold, piling up near 0; the share left of $\alpha$ is the realized power) and from 1,000 null studies (blue outline, flat). Bottom: a literature of 1,000 tested hypotheses of which a fraction $\pi$ are real effects, each studied with this design, split by significance: green real effects found, red false positives, orange real effects missed. Lower the target power or $\pi$ and watch the red share of the significant block grow.`,
      deps: ['stat-6.3'],
      see: ['stat-7.3', 'stat-6.13'],
      refs: ['Casella–Berger §8.3'],
      tags: ['power', 'sample size', 'base rate'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sample_size_determination' },
      viz(v) {
        const dS = v.slider('effect size $d$', 0.1, 1.5, 0.5, { step: 0.05 });
        const aS = v.select('$\\alpha$', [{ value: 0.01, label: '0.01' }, { value: 0.05, label: '0.05' }, { value: 0.1, label: '0.10' }], 0.05);
        const pS = v.slider('target power', 0.2, 0.99, 0.8, { step: 0.01 });
        const piS = v.slider('share of real effects $\\pi$ (bottom)', 0.02, 0.9, 0.1, { step: 0.01 });
        const sL = v.stage({ x: [2, 2000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1.05, xlabel: '$n$ per group', ylabel: 'power', title: 'power of the two-sample $t$-test' });
        const sP = v.stage({ x: [0, 1], y: [0, 5], axes: 'box', gutter: true, height: 300, weight: 0.95, minWidth: 240, xlabel: '$p$-value', ylabel: 'density', title: '$p$-values of 1,000 studies at the solved $n$' });
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: '1,000 tested hypotheses, split by the test result' });
        const I = v.icons(sI, { n: 1000, order: 'group', shape: 'square' });
        const power = (n, d, a) => { const nu = 2 * n - 2, c = qt(1 - a / 2, nu), del = d * Math.sqrt(n / 2); return nctUp(c, nu, del) + nctUp(c, nu, -del); };
        const zpow = (n, d, a) => { const z = zq(a / 2), m = d * Math.sqrt(n / 2); return Q(z - m) + Q(z + m); };
        const mc = memo(), ms = memo();
        const solve = (d, a, tgt) => mc([d, a, tgt].join('|'), () => { let lo = 2, hi = 2; while (power(hi, d, a) < tgt && hi < 20000) hi *= 2; if (hi >= 20000) return 20000; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (power(m, d, a) >= tgt) hi = m; else lo = m; } return power(lo, d, a) >= tgt ? lo : hi; });
        const curve = (d, a) => ms(d + '|' + a, () => Array.from({ length: 90 }, (_, i) => { const n = 2 * Math.pow(1000, i / 89); return [n, power(Math.max(2, n), d, a)]; }));
        const msim = memo();
        const sims = (n, d) => msim(n + '|' + d, () => {
          // each study through its sufficient statistics: x̄₁ − x̄₂ ~ N(effect, 2/n), (2n − 2)S²_p ~ χ²_{2n−2}, independent
          const r = v.rng(hashStr(`t6.17|${n}|${d}`)), nu = 2 * n - 2, C2 = v.M.dist.chi2(nu);
          const one = (eff) => { const diff = eff + Math.sqrt(2 / n) * r.normal(), sp2 = C2.sample(r) / nu, t = diff / Math.sqrt(sp2 * 2 / n); return 2 * tUp(Math.abs(t), nu); };
          const p1 = [], p0 = []; for (let k = 0; k < 1000; k++) { p1.push(one(d)); p0.push(one(0)); } return { p1, p0, m: n };
        });
        let st = null;
        v.render(() => {
          const d = dS.value, a = +aS.value, tgt = pS.value, n = solve(d, a, tgt), pw = power(n, d, a), C = curve(d, a);
          sL.hline(tgt, { color: 'green', width: 1.4, dash: [5, 4] });
          sL.fn((x) => zpow(x, d, a), { domain: [2, 2000], color: TC.h0, width: 1.4, dash: [5, 4], n: 200 });
          sL.path(C, { color: TC.h0, width: 2.8 });
          if (n <= 2000) { sL.vline(n, { color: TC.sim, width: 1.4, dash: [3, 3] }); sL.dot(n, pw, { r: 5, color: TC.sim }); tag(sL, `n = ${n} per group`, n, 0.08, { align: n > 300 ? 'right' : 'left', dx: n > 300 ? -6 : 6, size: 11 }); }
          sL.hline(a, { color: TC.alpha, width: 1, dash: [2, 3] });
          // p-values
          const S = sims(n, d), B1 = binned(S.p1, 0, 1, 25), B0 = binned(S.p0, 0, 1, 25), top = Math.min(25, Math.max(3, B1.max * 1.1));
          sP.setView([0, 1], [0, top]);
          sP.vband(0, a, { color: TC.alpha, alpha: 0.12 });
          sP.hist(B1, { density: true, color: TC.sim, fillAlpha: 0.4, width: 1.2 });
          sP.hist(B0, { density: true, color: TC.h0, fillAlpha: 0.05, width: 1.6 });
          const rp = S.p1.filter((p) => p < a).length / 1000, r0 = S.p0.filter((p) => p < a).length / 1000;
          tag(sP, `${pct(rp, 1)} of real-effect studies have p < ${a}`, 0.98, top * 0.9, { align: 'right', size: 11 });
          // literature of 1000 hypotheses
          const pi = piS.value, R = Math.round(1000 * pi), TP = Math.round(R * pw), FN = R - TP, FP = Math.round((1000 - R) * a);
          I.set({ groups: [{ n: TP, color: 'green', label: 'real effect, significant' }, { n: FN, color: 'orange', label: 'real effect, missed' }, { n: FP, color: 'red', label: 'no effect, significant (false positive)' }], rest: { color: 'muted', alpha: 0.3, label: 'no effect, not significant' }, block: (i) => (i < TP || (i >= R && i < R + FP) ? 0 : 1), blockLabels: (b, c) => (b === 0 ? `p < ${a}: ${c}` : `p ≥ ${a}: ${c}`) });
          I.draw();
          v.legend([[TC.h0, 'exact power (noncentral t)'], [TC.h0, 'normal approximation', { dash: true }], [TC.sim, 'p-values, real effect', { area: true }], [TC.h0, 'p-values, no effect', { area: true }], ['green', 'real, significant', { area: true }], ['red', 'false positive', { area: true }], ['orange', 'real, missed', { area: true }]]);
          st = { d, a, tgt, n, pw, rp, r0, TP, FP, FN, R, m: S.m, approx: 2 * ((zq(a / 2) + qnorm(tgt)) / d) ** 2 };
        });
        v.readout(() => {
          if (!st) return '';
          const { d, a, tgt, n, pw, rp, r0, TP, FP, R, m, approx } = st;
          return String.raw`$d=${d}$, $\alpha=${a}$, target ${pct(tgt, 0)}: **$n=${commas(n)}$ per group** (exact power ${pct(pw, 1)}; the normal formula $2(z_{\alpha/2}+z_\beta)^2/d^2$ gives ${v.fix(approx, 1)}) · 1,000 simulated studies${m < n ? ` (capped at ${m} per group)` : ''}: realized power **${pct(rp, 1)}** ± ${pct(2 * mcse(pw, 1000), 1)}, null rejection rate ${pct(r0, 1)} · literature with $\pi=${v.fix(R / 1000, 2)}$: ${TP + FP} significant results, of which **${FP} (${pct(FP / Math.max(1, TP + FP), 0)}) are false positives**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.18
    {
      num: '6.18',
      kind: 'Definition',
      name: 'Unbiased tests and UMP unbiased tests',
      statement: String.raw`A test with power function $\beta(\theta)$ is **unbiased** at level $\alpha$ if
$$\beta(\theta)\le\alpha\ \text{ for }\theta\in\Theta_0\qquad\text{and}\qquad\beta(\theta)\ge\alpha\ \text{ for }\theta\in\Theta_1:$$
it is never less likely to reject when $H_0$ is false than when it is true. A **uniformly most powerful unbiased (UMPU)** test is unbiased and has power at least that of every other unbiased level-$\alpha$ test at every $\theta\in\Theta_1$. For a two-sided alternative in a one-parameter exponential family no UMP test exists (stat-6.8), but a UMPU test does: it rejects in both tails of the sufficient statistic, with the tail areas chosen so that the power function has a minimum at $\theta_0$ (its derivative vanishes there). For a normal mean this is the equal-tailed $z$-test; for a normal variance (a $\chi^2$ statistic) the UMPU test does **not** have equal tails.`,
      idea: String.raw`Restricting to unbiased tests rules out the one-sided tests that bought their power on one side by giving up the other, and within the restricted class a best test reappears. Any unbiased test's power function has a minimum at $\theta_0$, so for a smooth power function $\beta'(\theta_0)=0$; for two-tail rejection regions $\{T<a\}\cup\{T>b\}$ of size $\alpha$ this one equation fixes the split. With a symmetric null distribution the split is even; with the skewed $\chi^2$ distribution of $(n-1)S^2/\sigma_0^2$ it is the condition $a\,f(a)=b\,f(b)$, which puts more of $\alpha$ in the lower tail.`,
      caption: String.raw`Two-sided tests that put a share $\lambda$ of $\alpha=5\%$ in the lower tail and $1-\lambda$ in the upper. Left: the power function of the chosen split (gold) with the other splits faint; red shading marks alternatives where the power falls **below** $\alpha$, i.e. where the test is biased. Right: the smallest power over all parameter values for each split $\lambda$; it equals $\alpha$ (unbiased) at a single split. For the **normal mean** that split is $\lambda=\tfrac12$. Switch to the **normal variance**: the equal-tailed test is biased (it dips below 5% for variances a little below $\sigma_0^2$), and the unbiased split sits elsewhere. Press the button to jump to it.`,
      deps: ['stat-6.8'],
      refs: ['Casella–Berger §8.3'],
      tags: ['unbiased test', 'two-sided test', 'power'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unbiased_test' },
      viz(v) {
        const A = 0.05;
        const modS = v.select('parameter', [{ value: 'mean', label: 'normal mean ($z$)' }, { value: 'var', label: 'normal variance ($\\chi^2$)' }], 'mean');
        const lS = v.slider('share of α in the lower tail $\\lambda$', 0, 1, 0.25, { step: 0.005 });
        const nS = v.slider('sample size $n$ (variance test)', 3, 40, 8, { int: true });
        v.button('Jump to the unbiased split', () => lS.set(lamStar()));
        const sL = v.stage({ x: [-4, 4], y: [0, 0.3], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: '$\\sqrt n(\\mu-\\mu_0)/\\sigma$', ylabel: 'power', title: 'power functions of two-sided tests of size 5%' });
        const sR = v.stage({ x: [0, 1], y: [0, 0.06], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: '$\\lambda$', ylabel: '$\\min_\\theta\\beta(\\theta)$', title: 'is the test unbiased?' });
        const pw = (lam, x) => {
          if (modS.value === 'mean') { const aL = lam * A, aR = (1 - lam) * A; return (aL > 0 ? Phi(-zq(aL) - x) : 0) + (aR > 0 ? Q(zq(aR) - x) : 0); }
          const df = nS.value - 1, [a, b] = cuts(df, lam);
          return chiCdf(df, a / x) + (Number.isFinite(b) ? chiUp(df, b / x) : 0);
        };
        const CUT = new Map();
        function cuts(df, lam) { const k = df + '|' + lam.toFixed(4); if (!CUT.has(k)) { if (CUT.size > 4000) CUT.clear(); CUT.set(k, [lam > 0 ? qchi(df, lam * A) : 0, lam < 1 ? qchi(df, 1 - (1 - lam) * A) : Infinity]); } return CUT.get(k); }
        const lamStar = () => {
          if (modS.value === 'mean') return 0.5;
          const df = nS.value - 1, g = (lam) => { const a = qchi(df, lam * A), b = qchi(df, 1 - (1 - lam) * A); return a * dchi(df, a) - b * dchi(df, b); };
          let lo = 0.001, hi = 0.999; const glo = g(lo); for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (Math.sign(g(m)) === Math.sign(glo)) lo = m; else hi = m; } return 0.5 * (lo + hi);
        };
        const mc = memo();
        const grid = () => (modS.value === 'mean' ? Array.from({ length: 241 }, (_, i) => -4 + i / 30) : Array.from({ length: 241 }, (_, i) => Math.pow(16, i / 240 - 0.5)));
        const minCurve = () => mc(modS.value + '|' + nS.value, () => { const G = grid(); return Array.from({ length: 101 }, (_, i) => { const lam = i / 100; let m = 1; for (const x of G) m = Math.min(m, pw(lam, x)); return [lam, m]; }); });
        let st = null;
        v.render(() => {
          const mean = modS.value === 'mean', lam = lS.value, ls = lamStar();
          nS.el.hidden = mean;
          if (mean) { sL.setScale({ xlog: false, x: [-4, 4], y: [0, 0.6] }); sL.setLabels('$\\sqrt n(\\mu-\\mu_0)/\\sigma$'); }
          else { sL.setScale({ xlog: true, x: [0.25, 4], y: [0, 0.6] }); sL.setLabels('$\\sigma^2/\\sigma_0^2$'); }
          const G = grid(), x0 = mean ? 0 : 1, xa = G[0], xb = G[G.length - 1];
          // zoom on the interesting band
          let ymax = 0; for (const x of G) ymax = Math.max(ymax, Math.min(0.35, pw(lam, x)));
          const top = mean ? 0.35 : 0.35;
          sL.setView([xa, xb], [0, top]);
          sL.hline(A, { color: TC.alpha, width: 1.2, dash: [5, 4] });
          sL.vline(x0, { color: 'muted', width: 1, dash: [3, 3] });
          for (const l of [0, 0.25, 0.5, 0.75, 1]) sL.fn((x) => pw(l, x), { domain: [xa, xb], color: 'muted', width: 1.2, alpha: 0.5, n: 240 });
          // shade where power < α
          const below = G.map((x) => [x, pw(lam, x)]);
          for (let i = 1; i < below.length; i++) { const [x1, y1] = below[i - 1], [x2, y2] = below[i]; if (y1 < A - 1e-6 && y2 < A - 1e-6 && Math.abs(x1 - x0) > 1e-9) sL.poly([[x1, y1], [x2, y2], [x2, A], [x1, A]], { fill: 'red', fillAlpha: 0.45, stroke: false }); }
          sL.fn((x) => pw(lam, x), { domain: [xa, xb], color: TC.sim, width: 3, n: 400 });
          let mn = 1, xm = x0; for (const [x, y] of below) if (y < mn) { mn = y; xm = x; }
          if (mn < A - 1e-4) { sL.dot(xm, mn, { r: 4.5, color: 'red' }); tag(sL, `power ${v.fix(mn, 4)} < α: biased`, xm, mn, { color: 'red', align: 'center', dy: 16, size: 11 }); }
          tag(sL, 'α = 0.05', xb, A, { color: TC.alpha, align: 'right', dx: -4, dy: -10, size: 10.5 });
          // right: min power against λ
          const MC = minCurve();
          sR.setView([0, 1], [0, 0.06]);
          sR.hline(A, { color: 'green', width: 1.2, dash: [5, 4] });
          sR.path(MC, { color: TC.h0, width: 2.6 });
          sR.vline(ls, { color: 'green', width: 1.4 });
          sR.dot(ls, A, { r: 5, color: 'green' });
          sR.dot(lam, Math.max(0, Math.min(...G.map((x) => pw(lam, x)))), { r: 5.5, color: TC.sim });
          tag(sR, `unbiased: λ* = ${v.fix(ls, 3)}`, ls, A, { color: 'green', align: ls > 0.5 ? 'right' : 'left', dx: ls > 0.5 ? -8 : 8, dy: -12, size: 11 });
          v.legend([[TC.sim, `power, λ = ${v.fix(lam, 3)}`], ['muted', 'λ = 0, ¼, ½, ¾, 1'], ['red', 'power below α (biased)', { area: true }], [TC.h0, 'smallest power over θ']]);
          st = { mean, lam, ls, mn, xm };
        });
        v.readout(() => {
          if (!st) return '';
          const { mean, lam, ls, mn, xm } = st;
          const where = mean ? `at $\\sqrt n(\\mu-\\mu_0)/\\sigma=${v.fix(xm, 2)}$` : `at $\\sigma^2/\\sigma_0^2=${v.fix(xm, 3)}$`;
          let s = `lower tail ${pct(lam * A, 2)}, upper tail ${pct((1 - lam) * A, 2)} · smallest power ${v.fix(mn, 4)} ${where} · ` + (mn >= A - 1e-4 ? '**unbiased** ✓ (power ≥ α everywhere)' : '**biased**: some alternatives are rejected less often than the null itself');
          s += mean ? ' · for the symmetric z statistic the unbiased (UMPU) test is the equal-tailed one, λ* = ½' : String.raw` · UMPU split for $n=${nS.value}$: $\lambda^*=${v.fix(ls, 3)}$ (solves $a f(a)=b f(b)$ for $\chi^2_{${nS.value - 1}}$), not ½`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.19
    {
      num: '6.19',
      kind: 'Method',
      name: 'Welch’s t-test (Behrens–Fisher problem)',
      credit: 'B. L. Welch, 1947; F. E. Satterthwaite, 1946',
      statement: String.raw`The **Behrens–Fisher problem**: test $H_0:\mu_1=\mu_2$ from independent normal samples of sizes $n_1,n_2$ with **unequal, unknown** variances $\sigma_1^2,\sigma_2^2$. No exact similar test with a simple form is known. **Welch's test** uses
$$T_W=\frac{\bar X_1-\bar X_2}{\sqrt{S_1^2/n_1+S_2^2/n_2}},\qquad \hat\nu=\frac{(S_1^2/n_1+S_2^2/n_2)^2}{\frac{(S_1^2/n_1)^2}{n_1-1}+\frac{(S_2^2/n_2)^2}{n_2-1}},$$
referring $T_W$ to $t_{\hat\nu}$ (Satterthwaite's approximation, matching the first two moments of the variance estimate to a scaled $\chi^2$). Its size stays close to $\alpha$ across variance ratios and sample sizes. The pooled Student test (stat-6.13) is exact only when $\sigma_1=\sigma_2$; with unequal $n$ its size is far above $\alpha$ when the **smaller** group has the larger variance and far below when the larger group does.`,
      idea: String.raw`The pooled variance weights each sample's variance by its degrees of freedom, but the variance of $\bar X_1-\bar X_2$ is $\sigma_1^2/n_1+\sigma_2^2/n_2$, which weights them by $1/n$. When the small group is the noisy one, pooling dilutes its variance with the quiet large group, the standard error is too small and the test rejects too often; reversed, it is too large and the test is conservative. Welch estimates the right variance directly; the only approximation left is the shape of its distribution, which Satterthwaite's degrees of freedom handle well.`,
      caption: String.raw`Left: realized size of the nominal 5% pooled $t$-test (red) and of Welch's test (green) against the standard deviation of group 1 (group 2 has SD 1), each point from 3,000 simulated pairs of normal samples with equal means (bars ±2 Monte Carlo SE). Set $n_1<n_2$: the pooled test rejects far too often when group 1 (the small one) is the noisier and almost never when it is the quieter; at $\sigma_1=1$ both are exact. Drag the gold handle: right, the two statistics' histograms at that SD against the $t_{n_1+n_2-2}$ density.`,
      deps: ['stat-6.13'],
      refs: ['Casella–Berger §8'],
      tags: ['Welch test', 'unequal variances', 't-test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Welch%27s_t-test' },
      viz(v) {
        const n1S = v.slider('$n_1$', 3, 60, 8, { int: true });
        const n2S = v.slider('$n_2$', 3, 60, 32, { int: true });
        const sL = v.stage({ x: [0.25, 4], y: [0, 0.3], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'SD of group 1, $\\sigma_1$ ($\\sigma_2=1$)', ylabel: 'realized size', title: 'size of nominal 5% tests, equal means' });
        const sR = v.stage({ x: [-6, 6], y: [0, 0.45], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: '$t$', ylabel: 'density', title: 'the two statistics at the gold $\\sigma_1$' });
        const hS = sL.handle(2.5, 0.27, { color: TC.sim, label: '$\\sigma_1$', labelPos: 'e', constrain: (x) => [clamp(x, 0.26, 3.9), 0.27] });
        const SDs = Array.from({ length: 13 }, (_, i) => 0.25 * Math.pow(16, i / 12)), R = 3000;
        const runAt = (r, n1, n2, s1, keep) => {
          const cP = qt(0.975, n1 + n2 - 2);
          let kp = 0, kw = 0; const TP = keep ? [] : null, TW = keep ? [] : null; const a = new Float64Array(n1), b = new Float64Array(n2);
          for (let k = 0; k < R; k++) {
            for (let i = 0; i < n1; i++) a[i] = s1 * r.normal(); for (let i = 0; i < n2; i++) b[i] = r.normal();
            const t = twoSample(a, b);
            if (Math.abs(t.tP) > cP) kp++;
            if (2 * tUp(Math.abs(t.tW), t.nuW) < 0.05) kw++;
            if (keep) { TP.push(t.tP); TW.push(t.tW); }
          }
          return { p: kp / R, w: kw / R, TP, TW };
        };
        const mc = memo(), mh = memo();
        const curves = (n1, n2) => mc(n1 + '|' + n2, () => { const r = v.rng(hashStr(`t6.19|${n1}|${n2}`)); return SDs.map((s) => runAt(r, n1, n2, s, false)); });
        const at = (n1, n2, s) => mh([n1, n2, s.toFixed(3)].join('|'), () => runAt(v.rng(hashStr(`t6.19h|${n1}|${n2}|${s.toFixed(3)}`)), n1, n2, s, true));
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = n2S.value, C = curves(n1, n2), s1 = +hS.x.toFixed(3);
          const top = Math.max(0.12, ...C.map((c) => c.p)) * 1.15;
          sL.setView([0.25, 4], [0, top]); hS.set(hS.x, top * 0.9);
          sL.hband(0, 0.05, { color: 'green', alpha: 0.06 });
          sL.hline(0.05, { color: 'green', width: 1.2, dash: [5, 4] });
          sL.vline(1, { color: 'muted', width: 1, dash: [3, 3] });
          const e = (p) => 2 * mcse(p, R);
          sL.path(SDs.map((s, i) => [s, C[i].p]), { color: TC.alpha, width: 2.4 });
          sL.path(SDs.map((s, i) => [s, C[i].w]), { color: 'green', width: 2.4 });
          SDs.forEach((s, i) => { for (const [p, c] of [[C[i].p, TC.alpha], [C[i].w, 'green']]) { sL.line(s, Math.max(0, p - e(p)), s, p + e(p), { color: c, width: 1.6 }); sL.dot(s, p, { r: 3.2, color: c }); } });
          sL.vline(s1, { color: TC.sim, width: 1.2, dash: [3, 3] });
          // right panel
          const H = at(n1, n2, s1), df = n1 + n2 - 2, c = qt(0.975, df);
          const BP = binned(H.TP, -6, 6, 60), BW = binned(H.TW, -6, 6, 60), ytop = Math.max(dt(0, df), BP.max, BW.max) * 1.12;
          sR.setView([-6, 6], [0, ytop]);
          area(sR, (x) => dt(x, df), -6, -c, TC.alpha, 0.2); area(sR, (x) => dt(x, df), c, 6, TC.alpha, 0.2);
          sR.hist(BP, { density: true, color: TC.alpha, fillAlpha: 0.08, width: 1.6 });
          sR.hist(BW, { density: true, color: 'green', fillAlpha: 0.08, width: 1.6 });
          sR.fn((x) => dt(x, df), { domain: [-6, 6], color: 'ink', width: 2.2, n: 300 });
          v.legend([[TC.alpha, 'pooled Student t'], ['green', 'Welch t'], ['ink', `$t_{${df}}$ density`], ['green', 'nominal 5%', { dash: true }]]);
          const nuBar = (() => { const q1 = s1 * s1 / n1, q2 = 1 / n2; return (q1 + q2) ** 2 / (q1 * q1 / (n1 - 1) + q2 * q2 / (n2 - 1)); })();
          st = { n1, n2, s1, H, nuBar, C };
        });
        v.readout(() => {
          if (!st) return '';
          const { n1, n2, s1, H, nuBar, C } = st, worst = C.reduce((m, c, i) => (Math.abs(c.p - 0.05) > Math.abs(m[0] - 0.05) ? [c.p, SDs[i]] : m), [0.05, 1]), wW = Math.max(...C.map((c) => Math.abs(c.w - 0.05)));
          return String.raw`$n_1=${n1}$, $n_2=${n2}$, $\sigma_1=${v.fix(s1, 2)}$: realized size pooled **${pct(H.p, 1)}**, Welch **${pct(H.w, 1)}** (± ${pct(2 * mcse(0.05, R), 1)}) · Welch's degrees of freedom here ≈ ${v.fix(nuBar, 1)} (pooled uses ${n1 + n2 - 2}) · across the curve the pooled size ranges up to ${pct(worst[0], 1)} at $\sigma_1=${v.fix(worst[1], 2)}$, while Welch stays within ${pct(wW, 1)} of 5%` + (n1 === n2 ? ' · with equal group sizes pooling is nearly harmless' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.20
    {
      num: '6.20',
      kind: 'Paper',
      name: 'On the criterion that a given system of deviations…',
      paper: { authors: 'Karl Pearson', year: 1900, title: 'On the criterion that a given system of deviations from the probable in the case of a correlated system of variables is such that it can be reasonably supposed to have arisen from random sampling', venue: 'The London, Edinburgh, and Dublin Philosophical Magazine and Journal of Science (5) 50 (302): 157–175', doi: '10.1080/14786440009463897' },
      introduces: ['stat-6.14'],
      credit: 'Karl Pearson, 1900',
      statement: String.raw`Pearson asked when a set of observed frequencies $m'_1,\dots,m'_{n'}$ in $n'$ groups can "reasonably be supposed" to be a random sample from a theory giving frequencies $m_1,\dots,m_{n'}$. Treating the $n'-1$ free deviations $e=m'-m$ as approximately multivariate normal, he showed that the exponent of their joint density is
$$\chi^2=\sum_{j=1}^{n'}\frac{(m'_j-m_j)^2}{m_j},$$
and that $P$, the probability of a system of deviations as improbable as or more improbable than the observed one, is the upper tail of what we now call the $\chi^2$ distribution with $n'-1$ degrees of freedom; he tabulated $P$ for $n'=3,\dots,20$ (with Alice Lee's help). Eight illustrations follow, among them:

(I) W. F. R. Weldon's 26,306 casts of twelve dice, counting dice showing 5 or 6: against $p=\tfrac13$, $\chi^2=43.87$ and $P=0.000016$ ("odds of 62,499 to 1 against");

(II) the same data against $p=0.3377$, the observed proportion: $\chi^2=17.78$, $P=0.1227$;

(III) runs of one colour in 4,274 sets at Monte Carlo roulette, July 1892: $\chi^2=172.43$, $P\approx14.5/10^{30}$;

(VII) Merriman's 1,000 shots at a target, counted in 11 belts, against the normal curve: $\chi^2=45.81$, $P=0.00000155$.

Scope: the derivation is a large-sample approximation (expected counts not too small). Pearson used $n'-1$ degrees of freedom even when the theoretical frequencies had been fitted to the same data; Fisher (1922–24) showed that each fitted constant removes one more degree of freedom.`,
      idea: String.raw`Before 1900, fits of curves to data were judged by eye; Airy's textbook, which Pearson singles out, smoothed observations three times and then declared the normal law verified. Pearson's criterion gave the first general, quantitative test of goodness of fit, and with it the modern pattern of a test: a statistic, its distribution under the hypothesis, and a tail probability. It introduced the $\chi^2$ statistic and distribution into statistics (stat-6.14, stat-1.8), and used it at once against the reigning belief that errors are normal: of his normal fits, Merriman's target data fail badly and Pearson's own line-bisecting errors pass. The one flaw, the degrees of freedom when parameters are estimated, was fixed by Fisher and led to a long dispute between the two men.`,
      caption: String.raw`Pearson's own tables, read from the scan of the 1900 *Philosophical Magazine*. Left: observed frequencies (gold) against theoretical ones (blue outline); right: each group's contribution $(m'-m)^2/m$ to $\chi^2$ (purple where more were observed than expected, blue where fewer). For **Weldon's dice** slide $p$, the chance that one die shows 5 or 6: at $p=\tfrac13$ the fives and sixes are over-represented in every group above 4 (Illustration I); at the observed $p=0.3377$ the fit is acceptable (Illustration II); the readout tracks $\chi^2(p)$ and its minimum. Switch the counts to **simulated fair dice** to see what 26,306 honest casts give. **Roulette** and **Merriman's shots** show the other two verdicts, each compared with today's computation.`,
      deps: ['stat-1.8', 'stat-1.19'],
      refs: [],
      tags: ['chi-squared test', 'goodness of fit', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pearson%27s_chi-squared_test', scan: 'https://archive.org/details/londonedinburg5501900lond' },
      viz(v) {
        // Pearson (1900), pp. 167–173, as printed
        const DICE = [185, 1149, 3265, 5475, 6114, 5194, 3067, 1331, 403, 105, 14, 4, 0];
        const DICE_T1 = [203, 1217, 3345, 5576, 6273, 5018, 2927, 1254, 392, 87, 13, 1, 0];
        const DICE_T2 = [187, 1146, 3215, 5465, 6269, 5115, 3043, 1330, 424, 96, 15, 1, 0];
        const ROU = [2462, 945, 333, 220, 135, 81, 43, 30, 12, 7, 5, 1, 0], ROU_T = [2137, 1068, 534, 267, 134, 67, 33, 17, 8, 4, 2, 1, 0];
        const MER = [1, 4, 10, 89, 190, 212, 204, 193, 79, 16, 2], MER_T = [1, 6, 27, 67, 162, 242, 240, 157, 70, 26, 2];
        const NC = 26306, PH = 106602 / (12 * NC);
        const illS = v.select('illustration', [{ value: 'dice', label: 'I–II: Weldon’s dice' }, { value: 'rou', label: 'III: Monte Carlo roulette' }, { value: 'mer', label: 'VII: Merriman’s shots' }], 'dice');
        const pS = v.slider('dice: chance of a 5 or 6, $p$', 0.32, 0.35, 1 / 3, { step: 0.0001, fmt: (x) => x.toFixed(4) });
        const bI = v.button('p = 1/3 (Illustration I)', () => pS.set(1 / 3));
        const bII = v.button('p = 0.3377 (Illustration II)', () => pS.set(PH));
        const srcS = v.select('dice counts', [{ value: 'weldon', label: 'Weldon’s 26,306 casts' }, { value: 'fair', label: 'simulated fair dice' }], 'weldon');
        let seed = 1;
        const bRe = v.button('Throw again', () => { seed++; });
        const sL = v.stage({ x: [-0.5, 12.5], y: [0, 7000], axes: 'box', gutter: { l: 52 }, height: 340, weight: 1.1, xlabel: 'dice showing 5 or 6 (of 12)', ylabel: 'frequency', title: 'observed and theoretical frequencies' });
        const sR = v.stage({ x: [-0.5, 12.5], y: [0, 10], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: 'group', ylabel: '$(m\'-m)^2/m$', title: 'contributions to $\\chi^2$' });
        const tL = titler(sL);
        const mc = memo();
        const fair = (s) => mc(s, () => { const r = v.rng(hashStr('weldon|' + s)), O = new Array(13).fill(0); for (let c = 0; c < NC; c++) { let k = 0; for (let d = 0; d < 12; d++) if (r() < 1 / 3) k++; O[k]++; } return O; });
        const binE = (p) => DICE.map((_, k) => NC * dbinom(k, 12, p));
        let st = null;
        v.render(() => {
          const ill = illS.value, dice = ill === 'dice';
          pS.el.hidden = !dice; bI.hidden = !dice; bII.hidden = !dice; srcS.el.hidden = !dice; bRe.hidden = !dice || srcS.value !== 'fair';
          let O, E, printed = null, xl, labs;
          if (dice) {
            const p = pS.value; O = srcS.value === 'fair' ? fair(seed) : DICE; E = binE(p);
            if (srcS.value === 'weldon') { if (Math.abs(p - 1 / 3) < 5e-5) printed = DICE_T1; else if (Math.abs(p - PH) < 5e-5) printed = DICE_T2; }
            xl = 'dice showing 5 or 6 (of 12)'; tL(srcS.value === 'fair' ? `26,306 casts of twelve fair dice (throw ${seed})` : 'Weldon’s dice: 26,306 casts of twelve');
          } else if (ill === 'rou') { O = ROU; E = ROU.map((_, k) => (k < 12 ? 4274 / 2 ** (k + 1) : 4274 / 2 ** 12)); printed = ROU_T; xl = 'length of run of one colour (13 = over 12)'; tL('4,274 runs at Monte Carlo roulette, July 1892'); }
          else { O = MER; E = MER_T; printed = MER_T; xl = 'belt on the target'; tL('Merriman’s 1,000 shots, by belt'); }
          const G = O.length, x0 = ill === 'dice' ? 0 : 1;
          labs = O.map((_, k) => k + x0);
          const ym = Math.max(...O, ...E) * 1.12;
          sL.setView([x0 - 0.6, x0 + G - 0.4], [0, ym]); sL.setLabels(xl); sR.setView([x0 - 0.6, x0 + G - 0.4], [0, 1]);
          for (let k = 0; k < G; k++) {
            const x = labs[k];
            sL.rect(x - 0.32, 0, x + 0.32, O[k], { fill: TC.sim, fillAlpha: 0.65, color: TC.sim, width: 1 });
            sL.rect(x - 0.4, 0, x + 0.4, E[k], { color: TC.h0, width: 2, fill: false });
            if (printed) sL.line(x - 0.42, printed[k], x + 0.42, printed[k], { color: TC.h1, width: 1.6, dash: [3, 2] });
          }
          if (ill === 'rou') sL.text('Pearson’s theory: half the runs of each length ends there', x0 + G - 0.5, ym * 0.93, { color: 'muted', size: 11, align: 'right' });
          // contributions
          const C = O.map((o, k) => (E[k] > 0 ? (o - E[k]) ** 2 / E[k] : 0)), X = C.reduce((a, b) => a + b, 0), cm = Math.max(...C) * 1.15 || 1;
          sR.setView([x0 - 0.6, x0 + G - 0.4], [0, cm]);
          C.forEach((c, k) => sR.rect(labs[k] - 0.35, 0, labs[k] + 0.35, c, { fill: O[k] > E[k] ? TC.h1 : TC.h0, fillAlpha: 0.6, color: O[k] > E[k] ? TC.h1 : TC.h0, width: 1 }));
          sR.corner(`χ² = ${v.fix(X, 2)}`, 'tr', { weight: 700 });
          v.legend([[TC.sim, 'observed (Pearson’s table)', { area: true }], [TC.h0, 'theory, computed exactly'], ...(printed ? [[TC.h1, 'theory as Pearson printed it', { dash: true }]] : []), [TC.h1, 'more observed than expected', { area: true }], [TC.h0, 'fewer observed', { area: true }]]);
          st = { ill, X, G, O, E, printed, p: dice ? pS.value : null, src: srcS.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { ill, X, G, O, printed, p, src } = st, df = G - 1, xp = printed ? chi2(O, printed) : null;
          if (ill === 'dice') {
            const chiAt = (q) => chi2(O, binE(q)), pmin = golden(chiAt, 0.32, 0.35), xmin = chiAt(pmin);
            let s = String.raw`$p=${p.toFixed(4)}$: $\chi^2=${v.fix(X, 2)}$ on ${df} degrees of freedom, $P=${pfmt(chiUp(df, X))}$ · minimum $\chi^2=${v.fix(xmin, 2)}$ at $p=${pmin.toFixed(4)}$ (then 11 d.f., $P=${pfmt(chiUp(11, xmin))}$)`;
            if (src === 'fair') return s + ' · honest dice: χ² is typically near its 12 degrees of freedom';
            if (Math.abs(p - 1 / 3) < 5e-5) s += String.raw` · **Illustration I**: Pearson printed $\chi^2=43.87241$, $P=0.000016$; recomputed from his printed (rounded) theory ${v.fix(xp, 3)}, $P(\chi^2_{12}>43.87)=${pfmt(chiUp(12, 43.87241))}$ ✓`;
            else if (Math.abs(p - PH) < 5e-5) s += String.raw` · **Illustration II**: Pearson printed $\chi^2=17.7757$, $P=0.1227$ ($P(\chi^2_{12}>17.78)=${pfmt(chiUp(12, 17.7757))}$ ✓); summing his own table again gives ${v.fix(xp, 2)}, because two of his entries slip (155² taken as 25,025 in group 4, and 1/15 written 0.667 in group 10); with Fisher's 11 degrees of freedom for the fitted $p$, $P=${pfmt(chiUp(11, xp))}$`;
            return s;
          }
          if (ill === 'rou') return String.raw`exact theory ($4274/2^k$): $\chi^2=${v.fix(X, 2)}$ · from Pearson's rounded theory ${v.fix(xp, 2)} · Pearson printed $\chi^2=172.43$ and "about $14.5/10^{30}$" · today $P(\chi^2_{12}>172.43)=${pfmt(chiUp(12, 172.43))}$: the same verdict, that "little chance had to do with" July 1892's runs (his series evaluation of the tail was about 10 times larger)`;
          return String.raw`$\chi^2=${v.fix(X, 3)}$ on ${df} degrees of freedom: Pearson printed 45.811 and $P=0.00000155$; today $P(\chi^2_{10}>45.81)=${pfmt(chiUp(10, 45.811))}$ ✓ · if the normal curve's mean and spread were fitted to these shots, Fisher's rule gives 8 degrees of freedom and $P=${pfmt(chiUp(8, 45.811))}$: "such a distribution … could only be expected to occur … some 15 or 16 times in 10,000,000 trials"`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.21
    {
      num: '6.21',
      kind: 'Paper',
      name: 'The most efficient tests of statistical hypotheses',
      paper: { authors: 'J. Neyman and E. S. Pearson', year: 1933, title: 'On the Problem of the Most Efficient Tests of Statistical Hypotheses', venue: 'Philosophical Transactions of the Royal Society of London A 231: 289–337', doi: '10.1098/rsta.1933.0009' },
      introduces: ['stat-6.4', 'stat-6.3'],
      credit: 'Jerzy Neyman & Egon S. Pearson, 1933',
      statement: String.raw`Neyman and Pearson framed a test as the choice of a **critical region** $w$ in the sample space, rejecting the hypothesis $H_0$ when the sample point falls in $w$. Two errors are possible: rejecting $H_0$ when true, with probability $\varepsilon=P_0(w)$, and accepting it when an alternative $H_1$ is true. Among regions with the same $P_0(w)=\varepsilon$ the **best critical region** maximizes $P_1(w)$, the **power** with respect to $H_1$. For simple $H_0$ and $H_1$ with densities $p_0,p_1$ they proved that the best region is $\{p_1\ge k\,p_0\}$ (the Neyman–Pearson lemma, stat-6.4), and they studied when one region is best against a whole class of alternatives (a **uniformly most powerful** test), working out examples for normal samples, including hypotheses that specify both the mean and the standard deviation, where the best region is bounded by a sphere in the sample space.`,
      idea: String.raw`Fisher's significance tests (and Pearson's own $\chi^2$, stat-6.20) chose a statistic by intuition and reported a tail probability. Neyman and Pearson asked what makes one test better than another and answered that it is the alternative: a test is judged by its probability of detecting departures that matter, at a fixed risk of false rejection. Their 1928 papers proposed the likelihood ratio as a general principle; the 1933 paper proved its optimality for simple hypotheses and introduced the vocabulary still in use: type I and type II errors, size, power (stat-6.2, stat-6.3), best and uniformly most powerful regions. Fisher rejected the decision-theoretic reading, and the two schools have coexisted ever since.`,
      caption: String.raw`A recreation (the paper has no data): $n$ normal observations summarized by their mean $\bar x$ and standard deviation $s$ (divisor $n$), which are sufficient. $H_0$: mean 0, SD 1 (blue contours); $H_1$: the mean and SD at the purple handle (contours in purple), so the hypotheses can differ in both. The shaded region is the chosen family's critical region of size $\alpha$; the green curve is the boundary of the likelihood-ratio region of the same size, a circle in this plane when the SDs differ. Right: power against size for five families of regions, each computed exactly on a fine grid. The likelihood-ratio curve is never beaten; move $H_1$ to an alternative with a larger SD and watch the regions based on $\bar x$ alone fall far below it.`,
      deps: ['stat-6.1', 'stat-6.2', 'stat-2.11'],
      see: ['stat-6.4', 'stat-6.5'],
      refs: [],
      tags: ['Neyman–Pearson', 'power', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neyman%E2%80%93Pearson_lemma' },
      viz(v) {
        const famS = v.select('critical region', [{ value: 'lr', label: 'likelihood ratio' }, { value: 'xb', label: '$\\bar x$ only' }, { value: 's', label: '$s$ only' }, { value: 't', label: 'Student $t$' }, { value: 'ab', label: 'two-sided $|\\bar x|$' }], 'xb');
        const nS = v.slider('sample size $n$', 3, 30, 10, { int: true });
        const aS = v.slider('size $\\alpha$', 0.01, 0.3, 0.05, { step: 0.005 });
        const XR = [-1.5, 1.5], SR = [0, 2.4];
        const sL = v.stage({ x: XR, y: SR, axes: 'box', gutter: true, height: 370, weight: 1.05, xlabel: '$\\bar x$', ylabel: '$s$', title: 'the sample space of $(\\bar x,s)$ and a critical region' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 370, weight: 0.95, minWidth: 250, xlabel: 'size $P_0(w)$', ylabel: 'power $P_1(w)$', title: 'power against size, five families' });
        const h1 = sL.handle(0.45, 1.5, { color: TC.h1, label: '$H_1$', labelPos: 'ne', constrain: (x, y) => [clamp(x, -1.3, 1.3), clamp(y, 0.45, 2.2)] });
        const GX = 120, GS = 100, ex = [-Infinity], es = [0];
        for (let i = 1; i < GX; i++) ex.push(XR[0] + ((XR[1] - XR[0]) * i) / GX); ex.push(Infinity);
        for (let j = 1; j < GS; j++) es.push(SR[0] + ((SR[1] - SR[0]) * j) / GS); es.push(Infinity);
        const cx = (i) => (i === 0 ? XR[0] : i === GX - 1 ? XR[1] : 0.5 * (ex[i] + ex[i + 1])), cs = (j) => (j === GS - 1 ? SR[1] : 0.5 * (es[j] + es[j + 1]));
        // log density of (x̄, s) under N(μ, σ²): x̄ ~ N(μ, σ²/n), n s²/σ² ~ χ²_{n−1}, independent
        const ld = (x, s, mu, sg, n) => -0.5 * n * ((x - mu) / sg) ** 2 + Math.log(Math.sqrt(n) / sg) + Math.log(Math.max(1e-300, dchi(n - 1, (n * s * s) / (sg * sg)) * (2 * n * s) / (sg * sg)));
        const stat = (fam, x, s, mu1, sg1, n) => {
          if (fam === 'lr') return ld(x, s, mu1, sg1, n) - ld(x, s, 0, 1, n);
          if (fam === 'xb') return mu1 >= 0 ? x : -x;
          if (fam === 's') return sg1 >= 1 ? s : -s;
          if (fam === 't') return (mu1 >= 0 ? x : -x) / Math.max(s, 1e-9);
          return Math.abs(x);
        };
        const FAMS = ['lr', 'xb', 's', 't', 'ab'], COL = { lr: 'green', xb: TC.h0, s: 'orange', t: 'teal', ab: 'pink' }, NAME = { lr: 'likelihood ratio', xb: 'x̄ only', s: 's only', t: 'Student t', ab: 'two-sided |x̄|' };
        const mc = memo();
        const compute = (mu1, sg1, n) => mc([mu1.toFixed(3), sg1.toFixed(3), n].join('|'), () => {
          const mass = (mu, sg) => { const mx = [], ms = []; for (let i = 0; i < GX; i++) mx.push(Phi(((ex[i + 1] - mu) * Math.sqrt(n)) / sg) - Phi(((ex[i] - mu) * Math.sqrt(n)) / sg)); for (let j = 0; j < GS; j++) ms.push(chiCdf(n - 1, (n * es[j + 1] ** 2) / (sg * sg)) - chiCdf(n - 1, (n * es[j] ** 2) / (sg * sg))); return { mx, ms }; };
          const M0 = mass(0, 1), M1 = mass(mu1, sg1), out = {};
          for (const f of FAMS) {
            const cells = [];
            for (let i = 0; i < GX; i++) for (let j = 0; j < GS; j++) cells.push([stat(f, cx(i), cs(j), mu1, sg1, n), M0.mx[i] * M0.ms[j], M1.mx[i] * M1.ms[j]]);
            cells.sort((a, b) => b[0] - a[0]);
            const roc = [[0, 0, Infinity]]; let a = 0, b = 0; for (const c of cells) { a += c[1]; b += c[2]; roc.push([a, b, c[0]]); }
            out[f] = roc;
          }
          return out;
        });
        const at = (roc, al) => { let lo = 0, hi = roc.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (roc[m][0] < al) lo = m; else hi = m; } const f = (al - roc[lo][0]) / Math.max(1e-15, roc[hi][0] - roc[lo][0]); return { pow: roc[lo][1] + f * (roc[hi][1] - roc[lo][1]), thr: roc[hi][2] }; };
        let st = null;
        v.render(() => {
          const n = nS.value, al = aS.value, mu1 = h1.x, sg1 = h1.y, fam = famS.value, R = compute(+mu1.toFixed(3), +sg1.toFixed(3), n);
          const A = at(R[fam], al), L = at(R.lr, al);
          sL.raster((x, y) => (y > 0 && stat(fam, x, y, mu1, sg1, n) >= A.thr ? [...v.rgb(COL[fam]).slice(0, 3), 70] : null), { key: [fam, n, al, mu1.toFixed(3), sg1.toFixed(3)].join('|'), res: 2 });
          const m0 = ld(0, Math.sqrt((n - 1) / n), 0, 1, n), m1 = ld(mu1, sg1 * Math.sqrt((n - 1) / n), mu1, sg1, n);
          sL.contour((x, y) => (y > 0.005 ? ld(x, y, 0, 1, n) : -50), [m0 - 1, m0 - 3], { color: TC.h0, width: 1.4, alpha: 0.8 });
          sL.contour((x, y) => (y > 0.005 ? ld(x, y, mu1, sg1, n) : -50), [m1 - 1, m1 - 3], { color: TC.h1, width: 1.4, alpha: 0.8 });
          sL.contour((x, y) => (y > 0.005 ? stat('lr', x, y, mu1, sg1, n) : -50), [L.thr], { color: 'green', width: 2.6 });
          sL.dot(0, 1, { r: 4.5, color: TC.h0, label: '$H_0$', labelPos: 'sw' });
          // ROC curves
          sR.fn((x) => x, { domain: [0, 1], color: 'faint', width: 1, dash: [4, 4] });
          const pw = {};
          for (const f of ['ab', 's', 't', 'xb', 'lr']) { const pts = R[f].filter((_, k) => k % 40 === 0 || k === R[f].length - 1).map((p) => [p[0], p[1]]); sR.path(pts, { color: COL[f], width: f === 'lr' ? 3.2 : f === fam ? 2.6 : 1.6, alpha: f === 'lr' || f === fam ? 1 : 0.7 }); pw[f] = at(R[f], al).pow; sR.dot(al, pw[f], { r: f === fam || f === 'lr' ? 5 : 3, color: COL[f] }); }
          sR.vline(al, { color: TC.alpha, width: 1, dash: [3, 3] });
          v.legend([[COL[fam], `critical region: ${NAME[fam]}`, { area: true }], ['green', 'boundary of the likelihood-ratio region'], [TC.h0, '$H_0$ contours'], [TC.h1, '$H_1$ contours'], ...FAMS.map((f) => [COL[f], `${NAME[f]} (power ${v.fix(pw[f], 3)})`])]);
          st = { n, al, mu1, sg1, pw, fam };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, al, mu1, sg1, pw, fam } = st, best = Math.max(...FAMS.map((f) => pw[f]));
          return String.raw`$n=${n}$, $H_1$: mean ${v.fix(mu1, 2)}, SD ${v.fix(sg1, 2)}; all regions of size $\alpha=${al}$ · power: likelihood ratio **${v.fix(pw.lr, 4)}**, ${FAMS.filter((f) => f !== 'lr').map((f) => `${NAME[f]} ${v.fix(pw[f], 4)}`).join(', ')} · ` + (pw.lr >= best - 2e-3 ? `no family beats the likelihood ratio ✓ (your ${NAME[fam]} region loses ${v.fix(pw.lr - pw[fam], 4)})` : 'grid error: a family beats the likelihood ratio');
        });
      },
    },
  ],
};
