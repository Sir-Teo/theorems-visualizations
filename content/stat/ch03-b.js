// Statistical Inference — Chapter 3: Point estimation (items 3.8–3.14; 3.1–3.7 in ch03.js)
//
// Where maximum likelihood misbehaves (unbounded likelihoods, growing nuisance parameters, jumps) and how it is
// computed (Newton, Fisher scoring, EM). Helpers in ch03.shared.js.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, binned, viewPad, axisLabels, legender, titler, repeater,
  ellipsePts, lbinorm, lse, LOG2PI,
} from './ch03.shared.js';

/** Log-density of N(m, s²) at x. */
const lnorm = (x, m, s) => -0.5 * LOG2PI - Math.log(s) - ((x - m) * (x - m)) / (2 * s * s);
/** Plain-text scientific notation with superscript exponents: −1.2682 × 10⁻¹. */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function fmtE(x) {
  if (x === 0 || !isFinite(x)) return String(x);
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  return `${m.toFixed(4).replace('-', '−')} × 10${String(e).replace('-', '⁻').replace(/\d/g, (d) => SUP[d])}`;
}
/** Log-spaced grid of integer sample sizes 1 … 10⁴, twelve per decade. */
const NGRID = (() => { const a = []; for (let k = 0; k <= 48; k++) { const m = Math.round(Math.pow(10, k / 12)); if (!a.length || m > a[a.length - 1]) a.push(m); } return a; })();

export default {
  collection: 'stat',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Unbounded likelihood in Gaussian mixtures',
      statement: String.raw`In the two-component normal mixture
$$f(x\mid\theta)=\pi\,\phi_{\sigma_1}(x-\mu_1)+(1-\pi)\,\phi_{\sigma_2}(x-\mu_2),\qquad \phi_\sigma(z)=\frac{e^{-z^2/2\sigma^2}}{\sigma\sqrt{2\pi}},\quad 0<\pi<1,$$
the log-likelihood of every sample $x_1,\dots,x_n$ is unbounded above. Put $\mu_1=x_k$ for any one observation and let $\sigma_1\to0$ with the other parameters fixed: then
$$\ell(\theta)\ \ge\ \log\frac{\pi}{\sigma_1\sqrt{2\pi}}+\sum_{i\ne k}\log\big((1-\pi)\,\phi_{\sigma_2}(x_i-\mu_2)\big)\ \longrightarrow\ \infty.$$
So no global MLE exists. The useful estimate is an interior local maximum, found by EM from reasonable starting values, or the maximum under a constraint such as $\sigma_j\ge c>0$ or $\sigma_1/\sigma_2\ge c$ (Hathaway, 1985), or a penalized or Bayesian fit. The same happens in any location–scale mixture, and in a single normal model only if $n=1$.`,
      idea: String.raw`A component that collapses onto one observation explains that point perfectly: its density there, $1/(\sigma_1\sqrt{2\pi})$, grows without bound. The other component keeps every remaining observation's density bounded below, so they cost only a fixed amount, and the total goes to infinity. A single normal has no such escape: shrinking its σ makes the density of every other point vanish. The theory of maximum likelihood (stat-3.5, and consistency in stat-5.1) presumes a bounded likelihood on a suitably compact parameter set; a floor on the variances restores this and gives a consistent constrained maximum, and in the unconstrained problem a consistent root of the likelihood equation still exists (Kiefer, 1978). EM (stat-3.11) can fall into these spikes when a component's variance drifts toward zero.`,
      caption: String.raw`Top: 30 data points, the mixture density (black) and its two weighted components. The gold handle is the centre $\mu_1$ of the blue component; with snapping on it sits exactly on a data point. Shrink $\sigma_1$ with the slider: the blue component becomes a spike on that one point while the orange one widens to cover the rest. Bottom: the log-likelihood against $\sigma_1$ (log scale), maximized over the other parameters, climbs past the sensible fit (green line) and on without bound, by $\ln10\approx2.3$ per decade; smaller bumps are spurious local maxima where the component covers a few close points, and the dashed curve keeps the other parameters frozen. Turn snapping off and nudge $\mu_1$ off the point: the curve levels off instead. Switch on a floor for $\sigma$: the hatched region is forbidden and the best allowed fit (green dot) is the sensible local maximum.`,
      deps: ['stat-3.5'],
      see: ['stat-3.11', 'stat-5.1'],
      refs: ['Wasserman §9.13'],
      tags: ['maximum likelihood', 'mixtures', 'failure'],
      viz(v) {
        const SMIN = 1e-8, SMAX = 3;
        const sigS = v.slider('$\\sigma_1$', SMIN, SMAX, 0.6, { log: true });
        const snapT = v.toggle('snap $\\mu_1$ onto a data point', true);
        const floorT = v.toggle('impose a floor on $\\sigma$', false);
        const flS = v.slider('floor $\\sigma_{\\min}$', 0.02, 0.8, 0.15, { log: true });
        let seed = 0; v.button('New data', () => { seed++; });
        const sT = v.stage({ x: [-4.5, 4.5], y: [-0.14, 0.62], axes: 'box', height: 240, full: true, title: 'data and the mixture at the current $\\sigma_1$ (other parameters re-fitted)' });
        const sB = v.stage({ x: [SMIN, SMAX], y: [-80, -40], xlog: true, axes: 'box', height: 280, full: true, title: 'profile log-likelihood $\\max_{\\pi,\\mu_2,\\sigma_2}\\ell$ against $\\sigma_1$, with $\\mu_1$ fixed' });
        const hm = sT.handle(-1.4, -0.08, { color: 'gold', label: '$\\mu_1$', labelPos: 'e', constrain: (x) => [clamp(x, -4.3, 4.3), -0.08] });
        const md = memo(), mp = memo();
        const llOf = (xs, m1, s1, p, m2, s2) => { let t = 0; for (const x of xs) t += lse(Math.log(p) + lnorm(x, m1, s1), Math.log(1 - p) + lnorm(x, m2, s2)); return t; };
        // EM over (π, μ2, σ2) with component 1 held at (m1, s1); floor 0.05 on σ2
        const inner = (xs, m1, s1, st, iters) => {
          let [p, m2, s2] = st;
          for (let it = 0; it < iters; it++) {
            let w = 0, a = 0, q = 0; const ws = xs.map((x) => { const l1 = Math.log(p) + lnorm(x, m1, s1), l2 = Math.log(1 - p) + lnorm(x, m2, s2); return Math.exp(l1 - lse(l1, l2)); });
            xs.forEach((x, i) => { w += ws[i]; a += (1 - ws[i]) * x; });
            m2 = a / (xs.length - w); xs.forEach((x, i) => { q += (1 - ws[i]) * (x - m2) ** 2; });
            s2 = Math.max(0.05, Math.sqrt(q / (xs.length - w))); p = clamp(w / xs.length, 1e-6, 1 - 1e-6);
          }
          return [p, m2, s2];
        };
        const data = (sd) => md(sd, () => {
          const r = v.rng(hashStr('unb|' + sd)), xs = [];
          for (let i = 0; i < 13; i++) xs.push(-1.5 + 0.55 * r.normal());
          for (let i = 0; i < 17; i++) xs.push(1.2 + 0.8 * r.normal());
          xs.sort((a, b) => a - b);
          // the sensible fit: full EM with a mild floor, from a symmetric start
          let p = 0.5, m1 = -1, m2 = 1, s1 = 1, s2 = 1;
          for (let it = 0; it < 400; it++) {
            let w = 0, a1 = 0, a2 = 0, q1 = 0, q2 = 0;
            const ws = xs.map((x) => { const l1 = Math.log(p) + lnorm(x, m1, s1), l2 = Math.log(1 - p) + lnorm(x, m2, s2); return Math.exp(l1 - lse(l1, l2)); });
            xs.forEach((x, i) => { w += ws[i]; a1 += ws[i] * x; a2 += (1 - ws[i]) * x; });
            m1 = a1 / w; m2 = a2 / (xs.length - w);
            xs.forEach((x, i) => { q1 += ws[i] * (x - m1) ** 2; q2 += (1 - ws[i]) * (x - m2) ** 2; });
            s1 = Math.max(0.05, Math.sqrt(q1 / w)); s2 = Math.max(0.05, Math.sqrt(q2 / (xs.length - w))); p = w / xs.length;
          }
          return { xs, p, m1, m2, s1, s2, l: llOf(xs, m1, s1, p, m2, s2) };
        });
        // profile over a log grid of σ1: start from the sensible fit at its own σ1 and follow the branch both ways
        const profile = (D, m1) => mp(seed + '|' + m1.toFixed(4), () => {
          const K = 260, G = new Array(K + 1), sg = (i) => SMIN * Math.pow(SMAX / SMIN, i / K);
          const i0 = clamp(Math.round((K * Math.log(D.s1 / SMIN)) / Math.log(SMAX / SMIN)), 0, K);
          const n = D.xs.length, mx = mean(D.xs), sx = Math.sqrt(D.xs.reduce((a, x) => a + (x - mx) ** 2, 0) / n);
          // at each σ1 keep the best of three EM runs: warm start from the neighbour, the sensible fit, and "component 2 takes everything"
          const best = (i, warm) => {
            let bst = null, bl = -Infinity;
            for (const [st0, it] of [[warm, 40], [[D.p, D.m2, D.s2], 60], [[1.5 / n, mx, sx], 60]]) { const st = inner(D.xs, m1, sg(i), st0, it), l = llOf(D.xs, m1, sg(i), ...st); if (l > bl) { bl = l; bst = st; } }
            return { s: sg(i), l: bl, st: bst };
          };
          G[i0] = best(i0, [D.p, D.m2, D.s2]);
          for (let i = i0 - 1; i >= 0; i--) G[i] = best(i, G[i + 1].st);
          for (let i = i0 + 1; i <= K; i++) G[i] = best(i, G[i - 1].st);
          return G;
        });
        let dkey = null, info = null;
        v.render(() => {
          const D = data(seed), xs = D.xs;
          if (dkey !== seed) {
            // start on the most isolated point of the first cluster, so that the spike is a single point
            dkey = seed; let b = xs[0], gb = -1;
            xs.forEach((x, i) => { if (Math.abs(x - D.m1) > 1.2 * D.s1) return; const g = Math.min(i ? x - xs[i - 1] : 9, i < xs.length - 1 ? xs[i + 1] - x : 9); if (g > gb) { gb = g; b = x; } });
            hm.x = b;
          }
          if (snapT.value && !hm.dragging) { let b = xs[0]; for (const x of xs) if (Math.abs(x - hm.x) < Math.abs(b - hm.x)) b = x; hm.x = b; }
          const mu1 = hm.x, s1 = sigS.value, fl = floorT.value ? flS.value : 0;
          flS.el.hidden = !floorT.value;
          const G = profile(D, mu1);
          // the exact profile at the slider's σ1, warm-started from the nearest grid point
          let near = G[0]; for (const g of G) if (Math.abs(Math.log(g.s / s1)) < Math.abs(Math.log(near.s / s1))) near = g;
          const st = inner(xs, mu1, s1, near.st, 120), lNow = llOf(xs, mu1, s1, ...st);
          const slice = (s) => llOf(xs, mu1, s, D.p, D.m2, D.s2);
          // bottom: ℓ against σ1 on a log axis
          const yv = G.map((g) => g.l).concat([D.l]), yHi = Math.max(...yv) + 4, yLo = Math.max(Math.min(...yv) - 3, yHi - 75);
          sB.setView([SMIN, SMAX], [yLo, yHi]);
          if (fl > 0) sB.rect(SMIN, yLo, fl, yHi, { fill: 'red', fillAlpha: 0.07, hatch: 'red', hatchAlpha: 0.25, stroke: false });
          sB.hline(D.l, { color: 'green', width: 1.6, dash: [6, 4] });
          sB.text('sensible fit (EM)', 2.6, D.l, { color: 'green', size: 12, weight: 700, align: 'right', dy: -11, plate: true });
          sB.clip(() => {
            sB.fn(slice, { domain: [SMIN, SMAX], color: 'muted', width: 1.4, dash: [5, 4], n: 300 });
            sB.path(G.map((g) => [g.s, g.l]), { color: 'accent', width: 2.8 });
          });
          sB.vline(s1, { color: 'gold', width: 1.2, dash: [3, 3] }); sB.dot(s1, lNow, { r: 6, color: 'gold' });
          let cBest = null;
          if (fl > 0) { cBest = G.filter((g) => g.s >= fl).reduce((a, b) => (b.l > a.l ? b : a)); sB.dot(cBest.s, cBest.l, { r: 6.5, color: 'green' }); }
          sB.text('σ₁', 2.9, yLo, { color: 'muted', size: 15, math: true, align: 'right', dy: -30 });
          // top: data and densities with the re-fitted second component
          viewPad(sT, [-4.5, 4.5], [-0.12, 0.62], { left: 36 });
          const [p, m2, s2] = st, c1 = (x) => p * Math.exp(lnorm(x, mu1, s1)), c2 = (x) => (1 - p) * Math.exp(lnorm(x, m2, s2));
          sT.clip(() => {
            sT.fn(c2, { domain: [-4.5, 4.5], color: 'orange', width: 1.8, n: 400, fill: 'orange', fillAlpha: 0.12 });
            const xsF = []; for (let i = 0; i <= 900; i++) xsF.push(-4.5 + i * 0.01);
            if (s1 < 0.02) xsF.push(mu1 - 3 * s1, mu1 - s1, mu1, mu1 + s1, mu1 + 3 * s1);
            xsF.sort((a, b) => a - b);
            sT.path(xsF.map((x) => [x, c1(x)]), { color: 'accent', width: 2 });
            sT.path(xsF.map((x) => [x, c1(x) + c2(x)]), { color: 'ink', width: 2.4 });
          }, [-4.5, 4.5], [0, 0.62]);
          const peak = p / (s1 * Math.sqrt(2 * Math.PI));
          if (peak > 0.6) { sT.arrow(mu1, 0.47, mu1, 0.61, { color: 'accent', width: 2, head: 8 }); sT.tex(`\\text{peak }${v.sci(peak, 2)}`, mu1, 0.53, { color: 'accent', size: 13, align: mu1 > 2.5 ? 'right' : 'left', dx: mu1 > 2.5 ? -10 : 10, plate: true }); }
          for (const x of xs) sT.dot(x, 0, { r: 3.6, color: Math.abs(x - mu1) < 1e-12 ? 'accent' : 'ink' });
          axisLabels(sT, 'x', null);
          v.legend([['ink', 'data · mixture density'], ['accent', 'component 1 (centre $\\mu_1$, width $\\sigma_1$) · profile log-likelihood'], ['orange', 'component 2 (re-fitted)'], ['muted', 'other parameters frozen at the sensible fit', { dash: true }], ['green', 'sensible local maximum'], ['gold', 'current $\\sigma_1$', { dot: true }]]);
          const onPt = xs.some((x) => Math.abs(x - mu1) < 1e-12);
          info = { s1, lNow, onPt, own: Math.log(p / (s1 * Math.sqrt(2 * Math.PI))), cBest, fl, D, p, m2, s2, top: G[0].l };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          let s = String.raw`$\sigma_1=${v.sci(I.s1, 2)}$: best $\ell=${v.fix(I.lNow, 2)}$ (with $\pi=${v.fix(I.p, 3)}$, $\mu_2=${v.fix(I.m2, 2)}$, $\sigma_2=${v.fix(I.s2, 2)}$) against $\ell=${v.fix(I.D.l, 2)}$ at the sensible fit`;
          if (I.onPt) s += String.raw` · the point under $\mu_1$ alone contributes $\approx\log\frac{\pi}{\sigma_1\sqrt{2\pi}}=${v.fix(I.own, 2)}$, rising by $\ln10=2.30$ per decade of $\sigma_1$; at $\sigma_1=10^{-8}$, $\ell=${v.fix(I.top, 2)}$` + (I.lNow > I.D.l ? ' — **the spike beats the sensible fit: the likelihood is unbounded and there is no MLE**' : ', and it keeps rising as $\\sigma_1\\to0$: **unbounded**');
          else s += ' · $\\mu_1$ is off every data point: as $\\sigma_1\\to0$ the component explains nothing and $\\ell$ levels off';
          if (I.cBest) s += String.raw` · with $\sigma\ge${v.fix(I.fl, 2)}$ the best allowed value is $\ell=${v.fix(I.cBest.l, 2)}$ at $\sigma_1=${v.fix(I.cBest.s, 3)}$`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Paradox',
      name: 'Neyman–Scott problem',
      credit: 'Neyman & Scott, 1948',
      statement: String.raw`Let $X_{ij}\sim N(\mu_i,\sigma^2)$ independently, for groups $i=1,\dots,k$ and replicates $j=1,\dots,m$ (classically $m=2$): every group has its own mean, and all share one variance. The MLE is $\hat\mu_i=\bar X_i$ and
$$\hat\sigma^2=\frac1{km}\sum_{i=1}^k\sum_{j=1}^m(X_{ij}-\bar X_i)^2\ \xrightarrow{\ P\ }\ \frac{m-1}{m}\,\sigma^2\qquad(k\to\infty,\ m\text{ fixed}).$$
For pairs it converges to $\sigma^2/2$: the MLE is **inconsistent**, however much data arrive, because the number of nuisance parameters $\mu_i$ grows with the sample. The corrected $\frac m{m-1}\hat\sigma^2$, which maximizes the likelihood of the within-group differences (a marginal likelihood free of the $\mu_i$), is consistent; and with $k$ fixed and $m\to\infty$ the MLE is consistent again.`,
      idea: String.raw`Each group mean is estimated from only $m$ observations, and deviations from a group's own mean are shorter than deviations from its true mean: $E\sum_j(X_{ij}-\bar X_i)^2=(m-1)\sigma^2$, one degree of freedom lost per group (stat-1.3). The MLE divides the $k(m-1)$ degrees of freedom that remain by $km$, and the law of large numbers over groups makes the ratio converge, to the wrong value. The usual consistency theorem (stat-5.1) assumes a fixed, finite-dimensional parameter; here the dimension $k+1$ grows with the sample, so the average log-likelihood does not converge uniformly to a limit maximized at the truth. Conditioning on, or integrating out, the statistics $\bar X_i$ that are sufficient for the nuisance parameters leaves a likelihood for $\sigma^2$ alone, whose maximizer is consistent.`,
      caption: String.raw`Left: the first 14 groups of a simulated data set, with the true means $\mu_i$ (green) and the fitted means $\bar X_i$ (blue). The blue segments, deviations from the fitted means, are systematically shorter than the dashed green deviations from the true means; the readout gives the ratio of the two sums of squares, close to $(m-1)/m$. Right: 30 paths of $\hat\sigma^2$ as the number of groups $k$ grows to 10,000 (log scale). They converge, tightly, to $\frac{m-1}m\sigma^2$ (red), never to $\sigma^2$ (green). Raise the replicates $m$ to shrink the gap, or switch on the corrected estimator.`,
      deps: ['stat-3.5', 'stat-3.3'],
      see: ['stat-5.1', 'stat-1.3'],
      refs: ['Casella–Berger §10.1'],
      tags: ['maximum likelihood', 'consistency', 'nuisance parameters'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Incidental_parameter_problem' },
      viz(v) {
        const P = 30, KMAX = 10000;
        const mS = v.slider('replicates per group $m$', 2, 8, 2, { int: true });
        const sS = v.slider('true $\\sigma^2$', 0.25, 4, 1, { log: true });
        const corrT = v.toggle('corrected estimator $\\frac{m}{m-1}\\hat\\sigma^2$', false);
        let seed = 0; v.button('New data', () => { seed++; });
        const sL = v.stage({ x: [0.3, 14.7], y: [-1, 1], axes: 'box', height: 350, weight: 0.95, xticks: [], title: 'the first 14 groups' });
        const sR = v.stage({ x: [0.7, 1.6e4], y: [0, 2], xlog: true, axes: 'box', height: 350, weight: 1.15, title: '$\\hat\\sigma^2$ as the number of groups $k$ grows' });
        const tR = titler(sR);
        const mc = memo();
        // within-group sums of squares with σ = 1 (the means drop out), accumulated along the k-grid
        const sim = (m, sd) => mc(m + '|' + sd, () => {
          const r = v.rng(hashStr(`ns|${m}|${sd}`)), out = [], e = new Float64Array(m);
          for (let p = 0; p < P; p++) {
            const row = new Float64Array(NGRID.length); let ss = 0, i = 0;
            NGRID.forEach((k, j) => { while (i < k) { let s = 0; for (let t = 0; t < m; t++) { e[t] = r.normal(); s += e[t]; } const mb = s / m; for (let t = 0; t < m; t++) ss += (e[t] - mb) ** 2; i++; } row[j] = ss / (k * m); });
            out.push(row);
          }
          return out;
        });
        let info = null;
        v.render(() => {
          const m = mS.value, s2 = sS.value, sd = Math.sqrt(s2), corr = corrT.value, f = corr ? m / (m - 1) : 1;
          // left: 14 groups
          const r = v.rng(hashStr(`nsg|${m}|${seed}`)), groups = [];
          for (let i = 0; i < 14; i++) { const mu = r.uniform(-2.6, 2.6) * Math.max(1, sd); const xs = []; for (let t = 0; t < m; t++) xs.push(mu + sd * r.normal()); groups.push({ mu, xs, xb: mean(xs) }); }
          const yr = 2.6 * Math.max(1, sd) + 3.2 * sd;
          viewPad(sL, [0.3, 14.7], [-yr, yr], { left: 34, noX: true });
          let ssFit = 0, ssTrue = 0;
          groups.forEach((g, i) => {
            const x = i + 1, w = 0.34;
            g.xs.forEach((y, t) => {
              const dx = m === 1 ? 0 : -0.22 + (0.44 * t) / (m - 1);
              sL.line(x + dx + 0.05, y, x + dx + 0.05, g.mu, { color: 'green', width: 1.3, dash: [3, 3] });
              sL.line(x + dx - 0.04, y, x + dx - 0.04, g.xb, { color: 'accent', width: 2.2 });
              sL.dot(x + dx, y, { r: 3.4, color: 'gold' });
              ssFit += (y - g.xb) ** 2; ssTrue += (y - g.mu) ** 2;
            });
            sL.line(x - w, g.mu, x + w, g.mu, { color: 'green', width: 2.4 });
            sL.line(x - w, g.xb, x + w, g.xb, { color: 'accent', width: 2.4 });
          });
          axisLabels(sL, null, 'x_{ij}');
          sL.text('groups i = 1 … 14', 14.6, -yr, { color: 'muted', size: 11.5, align: 'right', dy: -10 });
          // right: paths against k
          const D = sim(m, seed), top = s2 * (corr ? 1.9 : 1.6);
          sR.setView([0.7, 1.6e4], [-0.07 * top, top]);
          sR.hline(s2, { color: 'green', width: 2.2 });
          sR.hline(((m - 1) / m) * s2, { color: 'red', width: 2.2, dash: [7, 4] });
          sR.clip(() => { for (const row of D) sR.path(NGRID.map((k, j) => [k, s2 * f * row[j]]), { color: 'accent', alpha: 0.4, width: 1.2 }); });
          sR.text('σ² (the truth)', 1.3e4, s2, { color: 'green', size: 12, weight: 700, align: 'right', dy: -11, plate: true });
          sR.text(`(m − 1)/m · σ² = ${v.fix(((m - 1) / m) * s2, 3)}`, 1.3e4, ((m - 1) / m) * s2, { color: 'red', size: 12, weight: 700, align: 'right', dy: 13, plate: true });
          sR.text('k', 1.45e4, 0, { color: 'muted', size: 15, math: true, align: 'right', dy: -30 });
          tR(corr ? 'corrected $\\frac{m}{m-1}\\hat\\sigma^2$ as the number of groups $k$ grows' : 'the MLE $\\hat\\sigma^2$ as the number of groups $k$ grows');
          v.legend([['gold', 'observations', { dot: true }], ['green', 'true means $\\mu_i$ · deviations from them · $\\sigma^2$'], ['accent', 'fitted means $\\bar X_i$ · deviations · estimate paths'], ['red', 'limit of the MLE', { dash: true }]]);
          const last = moments(D.map((row) => s2 * f * row[NGRID.length - 1]));
          info = { m, s2, corr, ratio: ssFit / ssTrue, last };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, lim = ((I.m - 1) / I.m) * I.s2;
          return String.raw`left panel: $\sum(x_{ij}-\bar x_i)^2\big/\sum(x_{ij}-\mu_i)^2=${v.fix(I.ratio, 3)}$ (expected $\approx(m-1)/m=${v.fix((I.m - 1) / I.m, 3)}$) · at $k=10{,}000$ groups (${commas(10000 * I.m)} observations) the ${I.corr ? 'corrected estimator' : 'MLE'} is ${v.fix(I.last.mean, 4)} ± ${v.fix(I.last.sd, 4)} across 30 paths, against $\sigma^2=${v.fix(I.s2, 3)}$` + (I.corr ? ' — **consistent**: the correction restores the lost degree of freedom per group' : ` and $\\tfrac{m-1}{m}\\sigma^2=${v.fix(lim, 4)}$ — **inconsistent**: the estimate is sure of itself and ${pct(1 - (I.m - 1) / I.m, 0)} too small`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Algorithm',
      name: 'Newton–Raphson and Fisher scoring',
      statement: String.raw`To maximize a smooth log-likelihood $\ell(\theta)$, **Newton–Raphson** iterates
$$\theta_{t+1}=\theta_t-\big[\nabla^2\ell(\theta_t)\big]^{-1}\nabla\ell(\theta_t),$$
jumping to the stationary point of the second-order Taylor model of $\ell$ at $\theta_t$; **Fisher scoring** replaces the observed Hessian by minus the expected (Fisher) information, $\theta_{t+1}=\theta_t+I_n(\theta_t)^{-1}\nabla\ell(\theta_t)$.

If $\nabla^2\ell$ is Lipschitz and negative definite at a maximum $\hat\theta$, Newton converges quadratically from close enough starts: $\|\theta_{t+1}-\hat\theta\|\le C\|\theta_t-\hat\theta\|^2$, so the number of correct digits roughly doubles each step. Scoring converges linearly in general, but $I_n$ is positive definite, so its direction is always uphill, and it is much more stable from poor starts. Newton can converge to a minimum or a saddle point, or diverge, when started where $\ell$ is not concave. In canonical exponential families the observed and expected information coincide and the two methods are the same (iteratively reweighted least squares for generalized linear models).`,
      idea: String.raw`Newton solves the likelihood equation $\nabla\ell=0$ by linearizing the score: the quadratic Taylor model (pma-5.15) is exact to second order, so the error after a step is quadratic in the error before. But its curvature is the observed one, which far from the peak can have the wrong sign (the heavy Cauchy tails make $\ell$ convex there), and then the step heads to a minimum, out of the parameter space or off to infinity. Fisher scoring uses the expected curvature $I_n(\theta)$ (stat-4.2), always positive definite, so every short enough step goes uphill; since that curvature is only right on average, near the optimum the error shrinks by a constant factor per step instead of squaring. Practice combines them: start from moment estimates (stat-3.4), take scoring or damped steps while far away, finish with Newton.`,
      caption: String.raw`Location–scale mode: contours of the Cauchy log-likelihood of eight points in $(\mu,\sigma)$, with the MLE in green. Drag the gold start: Newton's path (orange) and Fisher scoring's path (blue) step toward the peak, and the right panel plots their distance from the MLE on a log scale. Near the peak Newton's error squares at each step (the orange curve plunges) while scoring's falls by a roughly constant factor. Drag the start out of the central region and Newton is thrown out of the parameter space ($\sigma<0$) or to infinity, while scoring still arrives. Location mode: the log-likelihood in $\mu$ with the tangent parabola each method maximizes at the current iterate; from a start between 3 and 7 Newton converges to the local minimum.`,
      deps: ['stat-3.5', 'pma-5.15'],
      see: ['opt-8.1', 'num-2.13', 'stat-4.2'],
      refs: ['Wasserman §9.13', 'Casella–Berger §7.2'],
      tags: ['maximum likelihood', 'optimization', 'Newton’s method'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Scoring_algorithm' },
      viz(v) {
        const XS = [-1.9, -0.7, 0.1, 0.4, 1.1, 1.8, 7.9, 8.6], n = XS.length;
        const modeS = v.select('likelihood', [{ value: '2d', label: 'location and scale $(\\mu,\\sigma)$' }, { value: '1d', label: 'location $\\mu$ ($\\sigma=1$)' }], '2d');
        const methS = v.select('show', [{ value: 'both', label: 'both' }, { value: 'newton', label: 'Newton' }, { value: 'score', label: 'Fisher scoring' }], 'both');
        const kS = v.slider('iterations shown', 0, 15, 6, { int: true });
        const sL = v.stage({ x: [-2.5, 9.5], y: [0, 5], axes: 'box', height: 370, weight: 1.35 });
        const sR = v.stage({ x: [0, 15], y: [1e-14, 100], ylog: true, axes: 'box', height: 370, weight: 0.75, minWidth: 230, title: 'distance from the MLE' });
        const tL = titler(sL), lg = legender(v);
        // 1-D: Cauchy location with σ = 1
        const l1 = (m) => { let s = 0; for (const x of XS) s -= Math.log(1 + (x - m) ** 2); return s; };
        const g1 = (m) => { let s = 0; for (const x of XS) { const d = x - m; s += (2 * d) / (1 + d * d); } return s; };
        const h1 = (m) => { let s = 0; for (const x of XS) { const d = x - m, q = 1 + d * d; s += (2 * (d * d - 1)) / (q * q); } return s; };
        // 2-D: Cauchy location–scale, expected information n/(2σ²)·I
        const l2 = (m, s) => { if (!(s > 0)) return -Infinity; let t = 0; for (const x of XS) t += Math.log(s) - Math.log(s * s + (x - m) ** 2); return t; };
        const gh2 = (m, s) => {
          let gm = 0, gs = 0, hmm = 0, hms = 0, hss = 0;
          for (const x of XS) { const d = x - m, q = s * s + d * d; gm += (2 * d) / q; gs += 1 / s - (2 * s) / q; hmm += (2 * (d * d - s * s)) / (q * q); hms += (-4 * d * s) / (q * q); hss += -1 / (s * s) - (2 * (d * d - s * s)) / (q * q); }
          return { gm, gs, hmm, hms, hss };
        };
        const step = {
          '1d': { newton: ([m]) => [m - g1(m) / h1(m)], score: ([m]) => [m + g1(m) / (n / 2)] },
          '2d': {
            newton: ([m, s]) => { const g = gh2(m, s), det = g.hmm * g.hss - g.hms * g.hms; return [m - (g.hss * g.gm - g.hms * g.gs) / det, s - (g.hmm * g.gs - g.hms * g.gm) / det]; },
            score: ([m, s]) => { const g = gh2(m, s), c = (2 * s * s) / n; return [m + c * g.gm, s + c * g.gs]; },
          },
        };
        // the MLEs (polished by Newton from the grid maximum)
        let mh1 = 0.4; for (let i = 0; i < 40; i++) mh1 -= g1(mh1) / h1(mh1);
        let th2 = [0.45, 1.26]; for (let i = 0; i < 40; i++) th2 = step['2d'].newton(th2);
        const stat1 = []; { let pv = g1(-2.5); for (let i = 1; i <= 2400; i++) { const m = -2.5 + i * 0.005, c = g1(m); if ((c > 0) !== (pv > 0)) { let a = m - 0.005, b = m; for (let k = 0; k < 50; k++) { const z = 0.5 * (a + b); if ((g1(z) > 0) === (g1(a) > 0)) a = z; else b = z; } stat1.push([0.5 * (a + b), h1(0.5 * (a + b)) < 0]); } pv = c; } }
        const H2 = sL.handle(1.7, 0.6, { color: 'gold', label: 'start', labelPos: 'ne', constrain: (x, y) => [clamp(x, -2.4, 9.4), clamp(y, 0.06, 4.9)] });
        const H1 = sL.handle(1.3, l1(1.3), { color: 'gold', label: 'start', labelPos: 'n', constrain: (x) => { const m = clamp(x, -2.4, 9.4); return [m, l1(m)]; } });
        let info = null;
        const run = (mode, meth, start) => {
          const pts = [start], f = step[mode][meth]; let fail = null;
          for (let k = 0; k < 15; k++) {
            const p = f(pts[pts.length - 1]);
            if (!p.every(isFinite)) { fail = 'singular step'; break; }
            if (mode === '2d' && !(p[1] > 0)) { pts.push(p); fail = `σ = ${v.fix(p[1], 2)} < 0 after step ${k + 1}: out of the parameter space`; break; }
            if (Math.abs(p[0]) > 1e3) { pts.push(p); fail = `|μ| > 1000 after step ${k + 1}: diverging`; break; }
            pts.push(p);
          }
          return { pts, fail };
        };
        v.render(() => {
          const mode = modeS.value, K = kS.value, meths = methS.value === 'both' ? ['newton', 'score'] : [methS.value];
          H1.visible = mode === '1d'; H2.visible = mode === '2d';
          const COL = { newton: 'orange', score: 'accent' };
          const runs = {}, start = mode === '1d' ? [H1.x] : [H2.x, H2.y], hat = mode === '1d' ? [mh1] : th2;
          for (const me of ['newton', 'score']) runs[me] = run(mode, me, start);
          const dist = (p) => (mode === '1d' ? Math.abs(p[0] - hat[0]) : Math.hypot(p[0] - hat[0], p[1] - hat[1]));
          if (mode === '2d') {
            tL('Cauchy log-likelihood $\\ell(\\mu,\\sigma)$ of 8 points');
            viewPad(sL, [-2.5, 9.5], [0, 5], { left: 30 });
            const lm = l2(th2[0], th2[1]);
            sL.heat((m, s) => 0.62 * Math.max(0, Math.min(1, (l2(m, s) - lm + 40) / 40)), { range: [0, 1], cmap: 'theme', res: 3, key: 'nr2d' });
            sL.axes();
            sL.contour((m, s) => l2(m, s), [0.5, 2, 4.5, 8, 12.5, 18, 24.5, 32].map((c) => lm - c), { color: 'ink', alpha: 0.35, width: 1, res: 110 });
            for (const x of XS) sL.line(x, 0, x, 0.12, { color: 'ink', width: 2 });
            sL.dot(th2[0], th2[1], { r: 6.5, color: 'green' });
            axisLabels(sL, '\\mu', '\\sigma');
          } else {
            tL('Cauchy log-likelihood $\\ell(\\mu)$ of 8 points, $\\sigma=1$');
            viewPad(sL, [-2.5, 9.5], [-34, -10], { left: 34 });
            sL.fn(l1, { domain: [-2.5, 9.5], color: 'ink', width: 2.6, n: 500 });
            for (const x of XS) sL.line(x, -34, x, -33.2, { color: 'ink', width: 2 });
            for (const [m, isMax] of stat1) if (Math.abs(m - mh1) > 1e-6) sL.dot(m, l1(m), { r: 5, hollow: true, color: isMax ? 'muted' : 'red', width: 2 });
            sL.dot(mh1, l1(mh1), { r: 6.5, color: 'green' });
            axisLabels(sL, '\\mu', null);
          }
          sL.clip(() => {
            for (const me of meths) {
              const R = runs[me], P = R.pts.slice(0, K + 1), xy = (p) => (mode === '1d' ? [p[0], l1(p[0])] : p);
              for (let i = 1; i < P.length; i++) { const a = xy(P[i - 1]), b = xy(P[i]); sL.arrow(a[0], a[1], b[0], b[1], { color: COL[me], width: 2, head: 7 }); }
              P.forEach((p, i) => { if (i) { const q = xy(p); sL.dot(q[0], q[1], { r: 3.6, color: COL[me] }); } });
              if (mode === '1d' && K < R.pts.length) {
                // the quadratic model this method maximizes at the current iterate
                const m0 = P[P.length - 1][0], g = g1(m0), h = me === 'newton' ? h1(m0) : -n / 2, l0 = l1(m0), w = 2.8;
                sL.fn((m) => l0 + g * (m - m0) + 0.5 * h * (m - m0) ** 2, { domain: [m0 - w, m0 + w], color: COL[me], width: 1.6, dash: [6, 4] });
              }
            }
          });
          // right: errors on a log scale
          viewPad(sR, [0, Math.max(5, K)], [1e-14, 100], { left: 40, noY: true });
          sR.hline(1e-12, { color: 'faint', width: 1, dash: [3, 3] });
          const digits = {};
          for (const me of meths) {
            const R = runs[me], P = R.pts.slice(0, K + 1).map((p, i) => [i, Math.max(1e-14, dist(p))]);
            sR.path(P, { color: COL[me], width: 2.2 }); sR.dots(P, { r: 3.4, color: COL[me] });
            if (R.fail && R.pts.length - 1 <= K) { const L = P[P.length - 1]; sR.text('✕', L[0], Math.min(L[1], 60), { color: 'red', size: 16, weight: 700, align: 'center' }); }
            digits[me] = P.map((q) => (q[1] <= 1e-14 ? '15+' : v.fix(Math.max(0, -Math.log10(q[1])), 1)));
          }
          axisLabels(sR, 't', null);
          lg([['orange', 'Newton–Raphson'], ['accent', 'Fisher scoring'], ['green', 'MLE'], ['gold', 'start (drag)', { dot: true }]].concat(mode === '1d' ? [['red', 'local minimum', { dot: true }], ['muted', 'other local maximum', { dot: true }]] : []));
          info = { mode, K, meths, runs, digits, hat, dist };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, NAME = { newton: 'Newton', score: 'scoring' };
          const parts = I.meths.map((me) => {
            const R = I.runs[me], end = R.pts[Math.min(I.K, R.pts.length - 1)], d = I.dist(end);
            let st = R.fail && R.pts.length - 1 <= I.K ? `**failed**: ${R.fail}` : d < 1e-8 ? '**converged to the MLE**' : '';
            if (!st && I.mode === '1d') { const near = stat1.find(([m]) => Math.abs(m - end[0]) < 1e-6); if (near && !near[1]) st = '**converged to the local minimum** (the likelihood equation has three roots)'; else if (near && Math.abs(near[0] - I.hat[0]) > 1e-6) st = '**converged to the other local maximum**'; }
            return `${NAME[me]}: correct digits ${I.digits[me].join(' → ')}${st ? ' — ' + st : ''}`;
          });
          return parts.join(' · ') + String.raw` · MLE ${I.mode === '1d' ? `$\\hat\\mu=${v.fix(I.hat[0], 6)}$` : `$(\\hat\\mu,\\hat\\sigma)=(${v.fix(I.hat[0], 5)},\\ ${v.fix(I.hat[1], 5)})$`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Algorithm',
      name: 'EM algorithm',
      credit: 'Dempster, Laird & Rubin, 1977',
      statement: String.raw`Suppose the observed data $x$ are part of complete data $(x,z)$, with $z$ missing or latent, and the complete-data likelihood $f(x,z\mid\theta)$ is easy to maximize while the observed-data likelihood $L(\theta)=\int f(x,z\mid\theta)\,dz$ is not. From a starting value $\theta_0$, the **EM algorithm** alternates

(E) $Q(\theta\mid\theta_t)=E_{\theta_t}\big[\log f(x,Z\mid\theta)\bigm| x\big]$, the expected complete-data log-likelihood under the conditional law of the missing data given the observed data at the current parameter (stat-2.1);
(M) $\theta_{t+1}=\arg\max_\theta Q(\theta\mid\theta_t)$.

For a mixture of $K$ normals $z_i$ is the label of the component that produced $x_i$. The E-step computes **responsibilities** $r_{ik}=\pi_kN(x_i;\mu_k,\Sigma_k)\big/\sum_j\pi_jN(x_i;\mu_j,\Sigma_j)$, and the M-step sets $\pi_k=\frac1n\sum_ir_{ik}$, $\mu_k$ to the $r_{\cdot k}$-weighted mean and $\Sigma_k$ to the weighted covariance. The observed log-likelihood never decreases (stat-3.12); under regularity conditions the iterates converge to a stationary point, often a local maximum that depends on the start, at a linear rate set by the fraction of missing information.`,
      idea: String.raw`If the labels were known, the MLE would be a set of per-group proportions, means and covariances. EM replaces each unknown label by its conditional distribution given the data and the current fit, which turns the complete-data log-likelihood into a weighted one (the E-step), and maximizes that in closed form (the M-step): soft clustering, of which k-means is the hard-assignment, equal-variance limit. Each round maximizes a lower bound on the log-likelihood that touches it at the current fit, which is why the likelihood climbs (stat-3.12). The price is speed: when the components overlap much information is missing and convergence is slow, and the limit may be a local maximum, a saddle, or a degenerate spike (stat-3.8).`,
      caption: String.raw`Step through or play EM on 200 points from two overlapping clusters. E-steps recolour every point by its responsibility (blue for component 1, orange for component 2, blends in between); M-steps move each component's mean and its 1- and 2-SD ellipses to the weighted mean and covariance. The right panel records the observed log-likelihood after every M-step: it never goes down. Drag the two starting means and replay, or push the clusters together with the separation slider: the components untangle slowly. Put both starts at the same place and EM is stuck: identical components are a stationary point.`,
      deps: ['stat-3.5', 'stat-2.1'],
      see: ['info-7.8', 'stat-3.8', 'stat-3.14'],
      refs: ['Casella–Berger §7.2', 'Wasserman §9.13'],
      tags: ['EM algorithm', 'mixtures', 'latent variables'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Expectation%E2%80%93maximization_algorithm' },
      viz(v) {
        const N = 200, NA = 80;
        let S = null, seed = 0;
        const sepS = v.slider('separation of the clusters', 0.4, 3, 1.5, { step: 0.05, onChange: () => S && S.reset() });
        v.button('New data', () => { seed++; S.reset(); });
        const sL = v.stage({ x: [-4.2, 4.2], y: [-3.3, 3.3], equal: true, axes: 'box', height: 390, weight: 1.3, title: 'data coloured by responsibility' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 390, weight: 0.8, minWidth: 230, title: 'observed log-likelihood' });
        const hA = sL.handle(-3.1, 2.5, { color: 'accent', r: 6, label: 'start 1', labelPos: 'n', onDrag: () => S.reset() });
        const hB = sL.handle(-2.2, 2.5, { color: 'orange', r: 6, label: 'start 2', labelPos: 'n', onDrag: () => S.reset() });
        const md = memo();
        const data = () => md(sepS.value + '|' + seed, () => {
          const r = v.rng(hashStr('em2|' + seed)), s = sepS.value, pts = [];
          const CA = [-0.9 * s, 0.35 * s], CB = [0.9 * s, -0.35 * s];
          for (let i = 0; i < N; i++) {
            const a = i < NA, u = r.normal(), w = r.normal();
            // Cholesky factors of [[0.55, 0.3], [0.3, 0.6]] and [[0.8, −0.25], [−0.25, 0.45]]
            if (a) pts.push([CA[0] + 0.7416 * u, CA[1] + 0.4045 * u + 0.6640 * w]);
            else pts.push([CB[0] + 0.8944 * u, CB[1] - 0.2795 * u + 0.6118 * w]);
          }
          return pts;
        });
        const loglik = (X, th) => { let t = 0; for (const p of X) t += lse(Math.log(th.pi[0]) + lbinorm(p[0], p[1], th.mu[0], th.S[0]), Math.log(th.pi[1]) + lbinorm(p[0], p[1], th.mu[1], th.S[1])); return t; };
        const estep = (X, th) => X.map((p) => { const a = Math.log(th.pi[0]) + lbinorm(p[0], p[1], th.mu[0], th.S[0]), b = Math.log(th.pi[1]) + lbinorm(p[0], p[1], th.mu[1], th.S[1]); return Math.exp(a - lse(a, b)); });
        const mstep = (X, r) => {
          const out = { pi: [], mu: [], S: [] };
          for (const k of [0, 1]) {
            let w = 0, sx = 0, sy = 0; X.forEach((p, i) => { const q = k ? 1 - r[i] : r[i]; w += q; sx += q * p[0]; sy += q * p[1]; });
            const mx = sx / w, my = sy / w; let a = 0, b = 0, c = 0;
            X.forEach((p, i) => { const q = k ? 1 - r[i] : r[i], dx = p[0] - mx, dy = p[1] - my; a += q * dx * dx; b += q * dx * dy; c += q * dy * dy; });
            out.pi.push(w / X.length); out.mu.push([mx, my]); out.S.push([a / w + 1e-4, b / w, c / w + 1e-4]);
          }
          return out;
        };
        const frames = () => {
          const X = data(), out = [];
          let th = { pi: [0.5, 0.5], mu: [[hA.x, hA.y], [hB.x, hB.y]], S: [[1, 0, 1], [1, 0, 1]] };
          const lls = [loglik(X, th)];
          out.push({ th, r: null, lls: lls.slice(), t: 0, line: 1, note: String.raw`Start: equal weights, unit covariances, means at the two handles. $\ell(\theta_0)=${v.fix(lls[0], 2)}$.` });
          for (let t = 1; t <= 60; t++) {
            const r = estep(X, th);
            out.push({ th, r, lls: lls.slice(), t, line: 3, note: String.raw`Iteration ${t}, E-step: each point gets its responsibility $r_{i1}$ under the current fit (colour); the components have not moved.` });
            const nt = mstep(X, r), l = loglik(X, nt), dl = l - lls[lls.length - 1]; lls.push(l); th = nt;
            out.push({ th, r, lls: lls.slice(), t, line: [4, 5], note: String.raw`Iteration ${t}, M-step: $\pi=(${v.fix(th.pi[0], 2)},\ ${v.fix(th.pi[1], 2)})$, means moved to the weighted averages; $\ell$ rose by ${v.sci(Math.max(dl, 0), 2)} to ${v.fix(l, 3)}.` });
            if (t > 2 && dl < 1e-6) { out[out.length - 1].line = 6; out[out.length - 1].note += ' Converged.'; break; }
          }
          return out;
        };
        S = v.steps({ frames, codePos: 'below', speed: 2.2, autoplay: true, still: 13, transition: 0.4, codeTitle: 'EM for a two-component normal mixture', code: ['initialise $\\pi_k,\\ \\mu_k,\\ \\Sigma_k$', 'repeat', '  E-step: $r_{ik}\\leftarrow\\pi_kN(x_i;\\mu_k,\\Sigma_k)\\,/\\,\\sum_j\\pi_jN(x_i;\\mu_j,\\Sigma_j)$', '  M-step: $N_k\\leftarrow\\sum_ir_{ik}$,  $\\pi_k\\leftarrow N_k/n$,  $\\mu_k\\leftarrow\\sum_ir_{ik}x_i/N_k$', '          $\\Sigma_k\\leftarrow\\sum_ir_{ik}(x_i-\\mu_k)(x_i-\\mu_k)^{\\mathsf T}/N_k$', 'until $\\ell$ stops increasing'] });
        let info = null;
        v.render(() => {
          const X = data(), f = S.frame, p = S.prev, tw = S.tween;
          if (!f.th) return;
          const P = p.th ? p : f, lerp = (a, b) => a + (b - a) * tw;
          const mu = [0, 1].map((k) => [lerp(P.th.mu[k][0], f.th.mu[k][0]), lerp(P.th.mu[k][1], f.th.mu[k][1])]);
          const Sg = [0, 1].map((k) => [0, 1, 2].map((j) => lerp(P.th.S[k][j], f.th.S[k][j])));
          viewPad(sL, [-4.2, 4.2], [-3.3, 3.3], { left: 30 });
          // points in 11 colour buckets
          const buckets = Array.from({ length: 11 }, () => []);
          X.forEach((q, i) => {
            if (!f.r) { buckets[10].push(q); return; }
            const r0 = P.r ? P.r[i] : f.r[i], r1 = lerp(r0, f.r[i]); buckets[Math.round((1 - r1) * 9)].push(q);
          });
          if (!f.r) sL.dots(buckets[10], { r: 3, color: 'muted', alpha: 0.7 });
          else for (let b = 0; b < 10; b++) if (buckets[b].length) sL.dots(buckets[b], { r: 3.1, color: v.mix('accent', 'orange', b / 9), alpha: 0.85 });
          [0, 1].forEach((k) => {
            const col = k ? 'orange' : 'accent';
            sL.path(ellipsePts(mu[k][0], mu[k][1], Sg[k][0], Sg[k][1], Sg[k][2], 1), { color: col, width: 2.4 });
            sL.path(ellipsePts(mu[k][0], mu[k][1], Sg[k][0], Sg[k][1], Sg[k][2], 2), { color: col, width: 1.4, dash: [6, 4] });
            sL.dot(mu[k][0], mu[k][1], { r: 5, color: col });
          });
          axisLabels(sL, 'x_1', 'x_2');
          // right: the log-likelihood trace
          const all = S.frames[S.frames.length - 1].lls, ls = f.lls, T = Math.max(4, all.length - 1);
          const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(1, 0.08 * (hi - lo));
          viewPad(sR, [0, T], [lo - pad, hi + pad], { left: 46 });
          sR.path(all.map((l, t) => [t, l]), { color: 'faint', width: 1.2, dash: [3, 3] });
          sR.path(ls.map((l, t) => [t, l]), { color: 'accent', width: 2.4 });
          sR.dots(ls.map((l, t) => [t, l]), { r: 3.2, color: 'accent' });
          sR.dot(ls.length - 1, ls[ls.length - 1], { r: 6, color: 'gold' });
          axisLabels(sR, '\\text{iteration}', null);
          v.legend([['accent', 'component 1 · responsibility for it · $\\ell$ after each M-step'], ['orange', 'component 2'], ['muted', 'not yet assigned', { dot: true }]]);
          let minInc = Infinity; for (let t = 1; t < ls.length; t++) minInc = Math.min(minInc, ls[t] - ls[t - 1]);
          info = { f, ls, minInc, total: all.length - 1 };
        });
        v.readout(() => {
          if (!info) return '';
          const { f, ls, minInc, total } = info, l = ls[ls.length - 1];
          let s = String.raw`after ${ls.length - 1} of ${total} M-steps: $\ell=${v.fix(l, 3)}$`;
          if (ls.length > 1) s += String.raw`, smallest increase so far ${minInc >= 0 ? v.sci(minInc, 2) : '**negative**'} — ` + (minInc >= -1e-9 ? '**the log-likelihood never decreased**' : 'a decrease (should not happen)');
          s += String.raw` · $\hat\pi=(${v.fix(f.th.pi[0], 3)},\ ${v.fix(f.th.pi[1], 3)})$ (truth $0.4,\ 0.6$), $\hat\mu_1=(${v.fix(f.th.mu[0][0], 2)},\ ${v.fix(f.th.mu[0][1], 2)})$, $\hat\mu_2=(${v.fix(f.th.mu[1][0], 2)},\ ${v.fix(f.th.mu[1][1], 2)})$`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'EM never decreases the likelihood',
      credit: 'Dempster, Laird & Rubin, 1977',
      statement: String.raw`Let $\theta_{t+1}$ be obtained from $\theta_t$ by an EM step (stat-3.11). Then
$$\ell(\theta_{t+1})\ \ge\ \ell(\theta_t).$$
More precisely, for every $\theta$,
$$\ell(\theta)\ \ge\ B_t(\theta)=\ell(\theta_t)+Q(\theta\mid\theta_t)-Q(\theta_t\mid\theta_t),$$
with equality at $\theta=\theta_t$, and the gap $\ell(\theta)-B_t(\theta)$ equals the Kullback–Leibler divergence $D\big(p(z\mid x,\theta_t)\,\big\|\,p(z\mid x,\theta)\big)\ge0$. The inequality is strict unless $Q(\theta_{t+1}\mid\theta_t)=Q(\theta_t\mid\theta_t)$. The same holds for a *generalized* EM step, which merely increases $Q$. Monotonicity does not give convergence to the global maximum: bounded monotone likelihood values converge, but the iterates may approach a local maximum or a saddle point.`,
      idea: String.raw`Write $L(\theta)=\int f(x,z\mid\theta)\,dz=E_{\theta_t}\big[f(x,Z\mid\theta)/p(Z\mid x,\theta_t)\bigm|x\big]$ and apply Jensen's inequality (rca-3.3) to the concave logarithm: $\ell(\theta)\ge E_{\theta_t}[\log f(x,Z\mid\theta)\mid x]-E_{\theta_t}[\log p(Z\mid x,\theta_t)\mid x]$, which is exactly $B_t(\theta)$, with equality when the ratio is constant in $z$, as it is at $\theta=\theta_t$; the deficit is a KL divergence, non-negative by Gibbs' inequality (info-2.2). The M-step maximizes $B_t$, so $\ell(\theta_{t+1})\ge B_t(\theta_{t+1})\ge B_t(\theta_t)=\ell(\theta_t)$. EM is thus a minorize–maximize scheme; and because $B_t$ is only a local surrogate, it climbs whichever hill it starts on.`,
      caption: String.raw`The model is the mixture $0.3\,N(\mu_1,1)+0.7\,N(\mu_2,1)$ for 80 points, so the log-likelihood is a surface over $(\mu_1,\mu_2)$ (left), with a global maximum G and a lower local maximum L across the diagonal. At the current iterate (gold) the Jensen bound $B_t$ is a quadratic: its contour through the iterate (purple ellipse) lies inside the likelihood's contour and touches it there, and its top is the next iterate (green). Right: both functions along the step direction. The bound (purple) touches the likelihood (blue) at the gold point and peaks at the green one; the hatched gap is the KL divergence. Step through: every iteration climbs. Choose the poor start, or drag the start across the diagonal, and EM climbs just as faithfully to the local maximum L.`,
      deps: ['stat-3.11', 'rca-3.3'],
      see: ['info-2.2'],
      refs: ['Casella–Berger §7.2', 'Wasserman §9.13'],
      tags: ['EM algorithm', 'Jensen’s inequality', 'monotonicity'],
      viz(v) {
        const PI = 0.3, NOBS = 80;
        const X = (() => { const r = v.rng(hashStr('emb|3.12')), a = []; for (let i = 0; i < NOBS; i++) a.push(r() < PI ? r.normal() : 3 + r.normal()); return a; })();
        const ll = (a, b) => { let t = 0; for (const x of X) t += lse(Math.log(PI) + lnorm(x, a, 1), Math.log(1 - PI) + lnorm(x, b, 1)); return t; };
        const resp = (a, b) => X.map((x) => { const p = Math.log(PI) + lnorm(x, a, 1), q = Math.log(1 - PI) + lnorm(x, b, 1); return Math.exp(p - lse(p, q)); });
        const xlogx = (w) => (w > 0 ? w * Math.log(w) : 0);
        const bound = (w, a, b) => { let t = 0; X.forEach((x, i) => { t += w[i] * (Math.log(PI) + lnorm(x, a, 1)) + (1 - w[i]) * (Math.log(1 - PI) + lnorm(x, b, 1)) - xlogx(w[i]) - xlogx(1 - w[i]); }); return t; };
        const emStep = (a, b) => { const w = resp(a, b); let s1 = 0, s2 = 0, n1 = 0; X.forEach((x, i) => { s1 += w[i] * x; s2 += (1 - w[i]) * x; n1 += w[i]; }); return { w, next: [s1 / n1, s2 / (NOBS - n1)], A: [n1, NOBS - n1] }; };
        // the two maxima, by running EM to convergence from either side of the diagonal
        const conv = (a, b) => { for (let i = 0; i < 2000; i++) [a, b] = emStep(a, b).next; return [a, b]; };
        const Gm = conv(-1, 4), Lm = conv(4, -1), lG = ll(Gm[0], Gm[1]), lL = ll(Lm[0], Lm[1]);
        const STARTS = { good: [-1.6, 1.3], poor: [1.4, -1.6] };
        let S = null;
        const startS = v.select('start', [{ value: 'good', label: 'good start' }, { value: 'poor', label: 'poor start' }], 'good', { onChange: (val) => { h0.set(...STARTS[val]); S.reset(); } });
        const sL = v.stage({ x: [-2.5, 5.5], y: [-2.5, 5.5], equal: true, axes: 'box', height: 390, weight: 1.15, title: 'log-likelihood $\\ell(\\mu_1,\\mu_2)$ and the bound $B_t$' });
        const sR = v.stage({ x: [-1, 2], y: [0, 1], axes: 'box', height: 390, weight: 0.85, minWidth: 240, title: 'along the step: $\\ell$ (blue) and $B_t$ (purple)' });
        const h0 = sL.handle(-1.6, 1.3, { color: 'gold', label: '$\\theta_0$', labelPos: 'sw', constrain: (x, y) => [clamp(x, -2.3, 5.3), clamp(y, -2.3, 5.3)], onDrag: () => S.reset() });
        const frames = () => {
          const out = []; let a = h0.x, b = h0.y, u = [1, 0];
          for (let t = 0; t <= 40; t++) {
            const st = emStep(a, b), d = [st.next[0] - a, st.next[1] - b], L = Math.hypot(d[0], d[1]);
            if (L > 1e-9) u = [d[0] / L, d[1] / L];
            const l0 = ll(a, b), l1 = ll(st.next[0], st.next[1]), b1 = bound(st.w, st.next[0], st.next[1]);
            out.push({ t, th: [a, b], next: st.next, w: st.w, A: st.A, u, len: L, l0, l1, b1, note: String.raw`$t=${t}$: $\ell(\theta_t)=${v.fix(l0, 3)}\ \le\ B_t(\theta_{t+1})=${v.fix(b1, 3)}\ \le\ \ell(\theta_{t+1})=${v.fix(l1, 3)}$` });
            if (L < 1e-6 && t > 1) break;
            [a, b] = st.next;
          }
          return out;
        };
        S = v.steps({ frames, still: 1, speed: 1.2 });
        const lmax = lG;
        let info = null;
        v.render(() => {
          const f = S.frame; if (!f.th) return;
          viewPad(sL, [-2.5, 5.5], [-2.5, 5.5], { left: 30 });
          sL.heat((a, b) => Math.max(0, Math.min(1, (ll(a, b) - lmax + 180) / 180)), { range: [0, 1], cmap: 'theme', res: 3, key: 'emb' });
          sL.contour(ll, [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144].map((c) => lmax - c), { color: 'ink', alpha: 0.32, width: 1, res: 110 });
          sL.line(-2.5, -2.5, 5.5, 5.5, { color: 'muted', width: 1, dash: [4, 4] });
          sL.dot(Gm[0], Gm[1], { r: 5.5, color: 'ink' }); sL.text('G', Gm[0], Gm[1], { size: 13, weight: 700, dx: 9, dy: -9, plate: true });
          sL.dot(Lm[0], Lm[1], { r: 5.5, color: 'ink' }); sL.text('L', Lm[0], Lm[1], { size: 13, weight: 700, dx: 9, dy: -9, plate: true });
          // the bound's contour through θ_t: an axis-aligned ellipse centred at θ_{t+1}
          const Dlt = Math.max(0, f.b1 - f.l0), ax = Math.sqrt((2 * Dlt) / f.A[0]), ay = Math.sqrt((2 * Dlt) / f.A[1]);
          if (Dlt > 1e-9) sL.curve((s) => [f.next[0] + ax * Math.cos(s), f.next[1] + ay * Math.sin(s)], 0, 2 * Math.PI, { color: 'purple', width: 2.4, n: 120 });
          sL.contour(ll, [f.l0], { color: 'accent', width: 2, res: 140 });
          const path = S.frames.slice(0, S.i + 1).map((q) => q.th);
          sL.path(path, { color: 'gold', width: 1.6 }); sL.dots(path, { r: 2.6, color: 'gold' });
          if (f.len > 1e-4) sL.arrow(f.th[0], f.th[1], f.next[0], f.next[1], { color: 'green', width: 2.2, head: 8 });
          sL.dot(f.th[0], f.th[1], { r: 6, color: 'gold' }); sL.dot(f.next[0], f.next[1], { r: 5, color: 'green' });
          axisLabels(sL, '\\mu_1', '\\mu_2');
          // right: the slice through θ_t in the step direction
          const len = f.len, a0 = -Math.max(0.6, 0.8 * len), a1 = len + Math.max(0.6, 0.8 * len);
          const P = (s) => [f.th[0] + s * f.u[0], f.th[1] + s * f.u[1]];
          const Lf = (s) => { const q = P(s); return ll(q[0], q[1]); }, Bf = (s) => { const q = P(s); return bound(f.w, q[0], q[1]); };
          let yHi = -Infinity; for (let i = 0; i <= 80; i++) yHi = Math.max(yHi, Lf(a0 + ((a1 - a0) * i) / 80));
          const rise = Math.max(f.l1 - f.l0, 0.02 * Math.abs(f.l0) * 0.01, 0.05);
          const yLo = f.l0 - 1.6 * rise - 0.3, yTop = yHi + 0.25 * (yHi - yLo);
          viewPad(sR, [a0, a1], [yLo, yTop], { left: 46 });
          sR.clip(() => {
            sR.between(Lf, Bf, a0, a1, { fill: 'purple', fillAlpha: 0.08, hatch: 'purple', hatchAlpha: 0.35 });
            sR.fn(Bf, { domain: [a0, a1], color: 'purple', width: 2.4, n: 200 });
            sR.fn(Lf, { domain: [a0, a1], color: 'accent', width: 2.8, n: 200 });
          });
          sR.dot(0, f.l0, { r: 6, color: 'gold' });
          if (len > 1e-6) { sR.dot(len, f.b1, { r: 5.5, color: 'green' }); sR.dot(len, f.l1, { r: 5, color: 'accent' }); sR.line(len, f.b1, len, f.l1, { color: 'ink', width: 1.2, dash: [2, 2] }); }
          sR.text('KL gap', a1, Lf(a1 * 0.92), { color: 'purple', size: 12, weight: 700, align: 'right', dx: -6, dy: 14, plate: true });
          axisLabels(sR, 's', null);
          v.legend([['accent', 'log-likelihood $\\ell$ · its contour through $\\theta_t$'], ['purple', 'Jensen bound $B_t$ (touches at $\\theta_t$)'], ['gold', 'iterates $\\theta_t$', { dot: true }], ['green', 'next iterate $\\theta_{t+1}=\\arg\\max B_t$']]);
          const end = S.frames[S.frames.length - 1].th, toG = Math.hypot(end[0] - Gm[0], end[1] - Gm[1]) < Math.hypot(end[0] - Lm[0], end[1] - Lm[1]);
          info = { f, toG, n: S.frames.length };
        });
        v.readout(() => {
          if (!info) return '';
          const { f, toG, n } = info;
          return String.raw`$t=${f.t}$: $B_t(\theta_t)=\ell(\theta_t)=${v.fix(f.l0, 4)}$ (touching) $\le B_t(\theta_{t+1})=${v.fix(f.b1, 4)}$ (M-step) $\le\ell(\theta_{t+1})=${v.fix(f.l1, 4)}$ (KL gap ${v.fix(f.l1 - f.b1, 4)} $\ge0$) · this run reaches ` + (toG ? `**G**, the global maximum, $\\ell=${v.fix(lG, 3)}$` : `**L**, a local maximum with $\\ell=${v.fix(lL, 3)}$, below G's ${v.fix(lG, 3)}: monotone, but not global`) + ` (after ${n - 1} steps)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Proposition',
      name: 'MLE of a uniform endpoint is the sample maximum',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. Uniform$(0,\theta)$, $\theta>0$. The likelihood is
$$L(\theta)=\theta^{-n}\,\mathbf 1\{\theta\ge X_{(n)}\},\qquad X_{(n)}=\max_iX_i,$$
zero to the left of the largest observation and strictly decreasing to its right, so the MLE is $\hat\theta=X_{(n)}$, a jump, not a root of $L'=0$ (the likelihood equation has no solution). Since $X_{(n)}/\theta$ has density $nu^{n-1}$ on $(0,1)$,
$$E\hat\theta=\frac n{n+1}\theta,\qquad \operatorname{bias}=-\frac{\theta}{n+1},\qquad \operatorname{Var}\hat\theta=\frac{n\theta^2}{(n+1)^2(n+2)},$$
and $\frac{n+1}nX_{(n)}$ is unbiased. The error is of order $1/n$, not $1/\sqrt n$: $n(\theta-\hat\theta)\to\theta\cdot\mathrm{Exp}(1)$ in distribution.`,
      idea: String.raw`Each observation contributes the factor $\theta^{-1}\mathbf 1\{x_i\le\theta\}$: any $\theta$ below a data point makes that point impossible, and above them all a larger $\theta$ spreads the same probability more thinly. So the maximum sits on the edge of the allowed region, where the support of the model touches the data, and the usual calculus does not apply; neither do the regularity conditions behind Cramér–Rao and asymptotic normality, which is how the $1/n$ rate escapes them (stat-4.7). The sample maximum always undershoots $\theta$, which is the bias; the distribution of order statistics (stat-1.12) gives it exactly, and the German tank problem (stat-4.11) is the discrete version.`,
      caption: String.raw`Left: the data (gold, drag any point) under the likelihood $L(t)=t^{-n}\mathbf 1\{t\ge x_{(n)}\}$, relative to its maximum. Drag the blue marker: the shaded band is the support $(0,t)$ of the model, and any point outside it turns red because it would be impossible, which is why the likelihood is 0 left of the largest point; to the right it decays like $t^{-n}$. The maximum is the jump. Right: repeated samples of size $n$ from $\theta=1$ give the sampling distribution of $X_{(n)}$ (gold) with its exact density $nx^{n-1}$, centred below $\theta$ by $1/(n+1)$, and of the corrected $\frac{n+1}nX_{(n)}$ (blue), centred on $\theta$.`,
      deps: ['stat-3.5', 'stat-1.12'],
      see: ['stat-4.7', 'stat-4.11'],
      refs: ['Casella–Berger §7.2'],
      tags: ['maximum likelihood', 'order statistics', 'non-regular models'],
      viz(v) {
        const NMAX = 20, TH = 1;
        const nS = v.slider('sample size $n$', 2, NMAX, 6, { int: true });
        const sL = v.stage({ x: [0, 1.6], y: [-0.16, 1.12], axes: 'box', height: 340, weight: 1.15, title: 'the likelihood of $U(0,t)$ for the data' });
        const sH = v.stage({ x: [0, 1.4], y: [0, 1], axes: 'box', height: 340, weight: 1, title: 'sampling distribution, $\\theta=1$' });
        const tH = titler(sH);
        const pts = []; for (let i = 0; i < NMAX; i++) pts.push(sL.handle(0.5, -0.08, { color: 'gold', r: 6, constrain: (x) => [clamp(x, 0.01, 1.55), -0.08] }));
        let Lrel = () => 0;
        const mk = sL.handle(1.25, 0.5, { color: 'accent', label: 't', labelPos: 'ne', constrain: (x) => { const t = clamp(x, 0.02, 1.58); return [t, Lrel(t)]; } });
        const R = repeater(v, {
          key: () => String(nS.value),
          sample: (r) => { let m = 0; for (let i = 0; i < nS.value; i++) m = Math.max(m, TH * r()); return m; },
          init: 4000, buttons: [100, 10000],
        });
        let nkey = null, info = null;
        v.render(() => {
          const n = nS.value;
          if (nkey !== n) { nkey = n; const r = v.rng(hashStr('unif|' + n)); pts.forEach((h, i) => { h.x = TH * r(); h.visible = i < n; }); }
          const xs = pts.slice(0, n).map((h) => h.x), xm = Math.max(...xs);
          Lrel = (t) => (t < xm ? 0 : Math.pow(xm / t, n));
          mk.y = Lrel(mk.x);
          const t = mk.x;
          viewPad(sL, [0, 1.6], [-0.16, 1.12], { left: 36, noY: true });
          sL.vband(0, t, { color: 'accent', alpha: 0.09 });
          sL.vline(TH, { color: 'green', width: 1.4, dash: [5, 4] });
          sL.text('θ', TH, 1.1, { color: 'green', size: 15, math: true, dx: 6, baseline: 'top' });
          sL.hline(0, { color: 'faint', width: 1 });
          sL.line(0, 0, xm, 0, { color: 'accent', width: 3 });
          sL.fn((u) => Math.pow(xm / u, n), { domain: [xm, 1.6], color: 'accent', width: 3, n: 300 });
          sL.line(xm, 0, xm, 1, { color: 'accent', width: 1.2, dash: [3, 3] });
          sL.dot(xm, 0, { r: 4.5, hollow: true, color: 'accent', width: 2 }); sL.dot(xm, 1, { r: 5.5, color: 'green' });
          sL.tex('\\hat\\theta=x_{(n)}', xm, 1, { color: 'green', size: 14, align: 'right', dx: -8, dy: -2, baseline: 'bottom' });
          for (const h of pts.slice(0, n)) if (h.x > t) sL.dot(h.x, -0.08, { r: 9, hollow: true, color: 'red', width: 2.2 });
          axisLabels(sL, 'x,\\ t', null, { xdy: -26 });
          // right: repeated maxima
          const S = R.sync(), V = S.vals, NN = V.length, a = (n + 1) / n;
          const Bm = binned(V, 0, 1.4, 70), Bc = binned(V, 0, 1.4, 70, (x) => a * x);
          const peak = Math.max(n, Bm.max, Bc.max) * 1.12;
          viewPad(sH, [0, 1.4], [0, peak], { left: 36 });
          sH.hist(Bm, { density: true, color: 'gold', fillAlpha: 0.35, width: 1.4 });
          sH.hist(Bc, { density: true, color: 'accent', fillAlpha: 0.12, width: 1.6 });
          sH.fn((x) => (x <= TH ? n * Math.pow(x / TH, n - 1) / TH : 0), { domain: [0, 1.4], color: 'ink', width: 2, n: 400 });
          sH.fn((y) => { const x = y / a; return x <= TH ? (n * Math.pow(x / TH, n - 1)) / (TH * a) : 0; }, { domain: [0, 1.4], color: 'ink', width: 1.4, dash: [5, 4], n: 400 });
          const mM = mean(V), mC = a * mM;
          sH.vline(TH, { color: 'green', width: 2 }); sH.vline(mM, { color: 'gold', width: 1.8, dash: [5, 4] }); sH.vline(mC, { color: 'accent', width: 1.8, dash: [5, 4] });
          sH.arrow(TH, peak * 0.9, mM, peak * 0.9, { color: 'red', width: 2.2, head: 7 });
          sH.text('bias', (TH + mM) / 2, peak * 0.9, { color: 'red', size: 12, weight: 700, align: 'center', dy: -11, plate: true });
          axisLabels(sH, '\\hat\\theta', null);
          tH(`${commas(NN)} samples of size ${n} from $U(0,1)$`);
          v.legend([['gold', 'data · $X_{(n)}$ over repeated samples', { area: true }], ['accent', 'likelihood · corrected $\\frac{n+1}{n}X_{(n)}$'], ['ink', 'exact densities'], ['green', 'MLE · true $\\theta$'], ['red', 'impossible under $t$ · bias', { dot: true }]]);
          info = { n, xm, t, L: Lrel(t), NN, mM, mC, sd: Math.sqrt(moments(V).var) };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info, n = I.n;
          return String.raw`largest point $x_{(n)}=${v.fix(I.xm, 4)}$ = the MLE · at $t=${v.fix(I.t, 3)}$: $L(t)/L(x_{(n)})=${v.fix(I.L, 4)}$` + (I.t < I.xm ? ' (a data point lies beyond $t$: impossible)' : '') + String.raw` · ${commas(I.NN)} repeated samples: mean of $X_{(n)}$ ${v.fix(I.mM, 4)} (exact $\frac n{n+1}=${v.fix(n / (n + 1), 4)}$), bias ${v.fix(I.mM - 1, 4)} (exact $-\frac1{n+1}=${v.fix(-1 / (n + 1), 4)}$), SD ${v.fix(I.sd, 4)} (exact ${v.fix(Math.sqrt(n / ((n + 1) ** 2 * (n + 2))), 4)}) · corrected mean ${v.fix(I.mC, 4)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'Maximum likelihood from incomplete data via the EM algorithm',
      paper: { authors: 'A. P. Dempster, N. M. Laird and D. B. Rubin', year: 1977, title: 'Maximum Likelihood from Incomplete Data via the EM Algorithm', venue: 'Journal of the Royal Statistical Society B 39 (1): 1–22', doi: '10.1111/j.2517-6161.1977.tb01600.x' },
      introduces: ['stat-3.11', 'stat-3.12'],
      credit: 'Dempster, Laird & Rubin, 1977',
      statement: String.raw`Dempster, Laird and Rubin gathered many special-purpose algorithms under one name and one theory. Observed data $y$ are a function of complete data $x$ with density $f(x\mid\phi)$; the **E-step** computes $Q(\phi'\mid\phi^{(p)})=E\big[\log f(x\mid\phi')\bigm|y,\phi^{(p)}\big]$ and the **M-step** maximizes it over $\phi'$. They proved that each iteration does not decrease the observed likelihood (their Theorem 1, from Jensen's inequality), showed that near a limit the convergence is linear with rate equal to the largest fraction of missing information, and that for exponential families the E-step reduces to computing the expected complete-data sufficient statistics. Their examples covered missing values in multivariate normal data, grouped, censored and truncated data, finite mixtures, variance components, hyperparameter estimation, iteratively reweighted least squares and factor analysis.

The opening example is Rao's genetic linkage data: 197 animals in four classes with counts $(125,18,20,34)$ and probabilities $\big(\tfrac12+\tfrac\theta4,\ \tfrac{1-\theta}4,\ \tfrac{1-\theta}4,\ \tfrac\theta4\big)$. Splitting the first class into its $\tfrac12$ and $\tfrac\theta4$ parts makes the problem binomial; EM from $\theta=0.5$ converges to $\theta^*=0.6268214980$ with ratio 0.1328 between successive errors. Scope: the general convergence argument had a gap, repaired by Wu (1983); EM converges to stationary points, not necessarily to global maxima.`,
      idea: String.raw`Before 1977 the idea had appeared many times in special cases: McKendrick's epidemic counts (1926), Hartley's counted data (1958), the Baum–Welch algorithm for hidden Markov models (1970), Orchard and Woodbury's missing-information principle (1972), Sundberg's exponential families (1974). There was no common name and no general proof. The paper supplied both, the E- and M-steps of the EM algorithm (stat-3.11) and its monotonicity (stat-3.12), and named the price: convergence is linear, and slow when much information is missing, as in overlapping mixtures (stat-3.8). It became one of the most cited papers in statistics, the engine of latent-variable modelling from mixtures and hidden Markov models to factor analysis and imputation, and the template for later minorize–maximize and variational methods.`,
      caption: String.raw`Rao's linkage data as in the paper. Step through. E-step: the 125 animals of the first class are split in the ratio $\tfrac12:\tfrac\theta4$ into an expected count from the $\tfrac12$ part (grey) and from the $\tfrac\theta4$ part (gold). M-step: with that split the data are binomial, and $\theta$ becomes (gold count + 34)/(gold count + 34 + 18 + 20). Middle: the observed log-likelihood (blue) with the bound $B_p$ that the M-step maximizes (purple), touching it at the current $\theta$. Bottom: the iterates laid out like the paper's Table 1, with $\theta^{(p)}$, its distance from $\theta^*$, and the ratio of successive distances, which settles at 0.1328. Move the starting value; the ratio does not care.`,
      deps: ['stat-3.5', 'stat-1.17'],
      see: ['stat-3.11', 'stat-3.12'],
      refs: [],
      tags: ['history', 'EM algorithm', 'missing data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Expectation%E2%80%93maximization_algorithm' },
      viz(v) {
        const Y = [125, 18, 20, 34], NT = 197;
        // the exact maximum: ℓ'(θ) = 0 ⇔ −197θ² + 15θ + 68 = 0
        const TSTAR = (-15 - Math.sqrt(15 * 15 + 4 * 197 * 68)) / (2 * -197);
        const ll = (t) => Y[0] * Math.log(2 + t) + (Y[1] + Y[2]) * Math.log(1 - t) + Y[3] * Math.log(t) - NT * Math.log(4);
        const split = (t) => (Y[0] * (t / 4)) / (0.5 + t / 4);
        const mstep = (x2) => (x2 + Y[3]) / (x2 + Y[3] + Y[1] + Y[2]);
        // B_p(θ) = ℓ(θ_p) + Q(θ | θ_p) − Q(θ_p | θ_p), with Q(θ | θ_p) = (x₂ + 34) log θ + 38 log(1 − θ) + const
        const Bf = (tp, t) => { const x2 = split(tp), q = (u) => (x2 + Y[3]) * Math.log(u) + (Y[1] + Y[2]) * Math.log(1 - u); return ll(tp) + q(t) - q(tp); };
        // fraction of missing information at θ*: 1 − I_obs / I_complete
        const Iobs = Y[0] / (2 + TSTAR) ** 2 + (Y[1] + Y[2]) / (1 - TSTAR) ** 2 + Y[3] / TSTAR ** 2;
        const Icom = (split(TSTAR) + Y[3]) / TSTAR ** 2 + (Y[1] + Y[2]) / (1 - TSTAR) ** 2, FMI = 1 - Iobs / Icom;
        let S = null;
        const t0S = v.slider('starting value $\\theta^{(0)}$', 0.05, 0.95, 0.5, { step: 0.01, onChange: () => S && S.reset() });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 300, weight: 0.9, xticks: [], title: 'the four classes (counts)' });
        const sQ = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 300, weight: 1.1, title: 'observed log-likelihood and the bound $B_p$' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: 'iterates, as in Table 1 of the paper' });
        const frames = () => {
          const out = []; let t = t0S.value; const th = [t];
          out.push({ p: 0, th: th.slice(), x2: null, phase: 'start', note: String.raw`Start at $\theta^{(0)}=${v.fix(t, 4)}$.` });
          for (let p = 0; p < 10; p++) {
            const x2 = split(t);
            out.push({ p, th: th.slice(), x2, phase: 'E', note: String.raw`E-step: of the 125 in class 1, expect $125\cdot\frac{\theta/4}{1/2+\theta/4}=${v.fix(x2, 3)}$ from the $\theta/4$ part and ${v.fix(125 - x2, 3)} from the $\frac12$ part.` });
            t = mstep(x2); th.push(t);
            out.push({ p: p + 1, th: th.slice(), x2, phase: 'M', note: String.raw`M-step: $\theta^{(${p + 1})}=\frac{${v.fix(x2, 3)}+34}{${v.fix(x2, 3)}+34+18+20}=${v.fix(t, 9)}$.` });
          }
          return out;
        };
        S = v.steps({ frames, still: 6, speed: 1.4 });
        let info = null;
        v.render(() => {
          const f = S.frame; if (!f.th) return;
          const tc = f.th[f.th.length - 1], tPrev = f.phase === 'M' ? f.th[f.th.length - 2] : tc;
          // counts, with the first class split during E- and M-steps
          viewPad(sC, [0.4, 4.6], [0, 140], { left: 36, bottom: 42 });
          const fitP = [0.5 + tc / 4, (1 - tc) / 4, (1 - tc) / 4, tc / 4];
          Y.forEach((c, i) => {
            const x = i + 1;
            if (i === 0 && f.x2 != null) {
              sC.rect(x - 0.32, 0, x + 0.32, c - f.x2, { fill: 'muted', fillAlpha: 0.45, stroke: false });
              sC.rect(x - 0.32, c - f.x2, x + 0.32, c, { fill: 'gold', fillAlpha: 0.75, stroke: false });
              sC.text(v.fix(c - f.x2, 1), x, (c - f.x2) / 2, { align: 'center', size: 11.5, weight: 700 });
              sC.text(v.fix(f.x2, 1), x + 0.36, c - f.x2 / 2, { align: 'left', size: 11.5, weight: 700, color: 'gold', plate: true });
            } else sC.rect(x - 0.32, 0, x + 0.32, c, { fill: i === 3 ? 'gold' : 'accent', fillAlpha: i === 3 ? 0.75 : 0.45, stroke: false });
            sC.line(x - 0.4, NT * fitP[i], x + 0.4, NT * fitP[i], { color: 'ink', width: 2 });
            sC.text(String(c), x, c, { align: 'center', dy: -10, size: 12, weight: 700 });
          });
          ['\\tfrac12+\\tfrac\\theta4', '\\tfrac{1-\\theta}4', '\\tfrac{1-\\theta}4', '\\tfrac\\theta4'].forEach((s, i) => sC.tex(s, i + 1, 0, { dy: 6, baseline: 'top', size: 13, color: 'muted' }));
          // log-likelihood and the bound
          const lo = 0.3, hi = 0.9, lmax = ll(TSTAR), lmin = Math.min(ll(lo), ll(hi));
          viewPad(sQ, [lo, hi], [lmin - 1, lmax + 0.12 * (lmax - lmin)], { left: 48 });
          sQ.fn(ll, { domain: [lo, hi], color: 'accent', width: 2.8, n: 300 });
          sQ.clip(() => sQ.fn((t) => Bf(tPrev, t), { domain: [lo, hi], color: 'purple', width: 2.2, dash: [6, 4], n: 300 }));
          sQ.vline(TSTAR, { color: 'green', width: 1.2, dash: [4, 4] });
          f.th.forEach((t, i) => { if (t >= lo && t <= hi) sQ.dot(t, ll(t), { r: i === f.th.length - 1 ? 6 : 3.5, color: i === f.th.length - 1 ? 'gold' : 'ink' }); });
          if (tPrev >= lo && tPrev <= hi) sQ.dot(tPrev, ll(tPrev), { r: 5, hollow: true, color: 'purple', width: 2 });
          axisLabels(sQ, '\\theta', null);
          // the table
          const rows = f.th.slice(0, 9), y0 = 0.86, dy = 0.088, cols = [0.08, 0.34, 0.62, 0.9];
          ['p', 'θ⁽ᵖ⁾', 'θ⁽ᵖ⁾ − θ*', '(θ⁽ᵖ⁺¹⁾ − θ*) / (θ⁽ᵖ⁾ − θ*)'].forEach((h, j) => sT.text(h, cols[j], 0.97, { align: 'right', size: 12.5, weight: 700, color: 'muted', baseline: 'top' }));
          sT.line(0.02, 0.9, 0.98, 0.9, { color: 'faint', width: 1 });
          rows.forEach((t, p) => {
            const y = y0 - p * dy, cur = p === f.th.length - 1, col = cur ? 'gold' : 'ink';
            if (cur) sT.rect(0.02, y - dy / 2, 0.98, y + dy / 2, { fill: 'gold', fillAlpha: 0.12, stroke: false, radius: 4 });
            sT.text(String(p), cols[0], y, { align: 'right', size: 12.5, color: col });
            sT.text(t.toFixed(9), cols[1], y, { align: 'right', size: 12.5, color: col, weight: cur ? 700 : 500 });
            sT.text(fmtE(t - TSTAR), cols[2], y, { align: 'right', size: 12.5, color: col });
            if (p + 1 < f.th.length) sT.text(((f.th[p + 1] - TSTAR) / (t - TSTAR)).toFixed(4), cols[3], y, { align: 'right', size: 12.5, color: col });
          });
          v.legend([['accent', 'counts · observed log-likelihood'], ['gold', 'the $\\theta/4$ part (expected in class 1)', { area: true }], ['ink', 'fitted counts $197\\,p_i(\\theta)$'], ['purple', 'bound $B_p$ maximized by the M-step', { dash: true }], ['green', '$\\theta^*$', { dash: true }]]);
          const r = f.th.length > 2 ? (f.th[f.th.length - 1] - TSTAR) / (f.th[f.th.length - 2] - TSTAR) : null;
          info = { tc, r, p: f.th.length - 1 };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return String.raw`$\theta^{(${I.p})}=${v.fix(I.tc, 9)}$ · exact maximum $\theta^*=${v.fix(TSTAR, 10)}$ (root of $-197\theta^2+15\theta+68=0$), paper: **0.6268214980** · ratio of successive errors ` + (I.r != null ? `**${v.fix(I.r, 4)}**` : '—') + String.raw` (paper: **0.1328**), which equals the fraction of missing information $1-I_{\rm obs}/I_{\rm complete}=${v.fix(FMI, 4)}$ at $\theta^*$, as the paper's rate theorem predicts`;
        });
      },
    },
  ],
};
