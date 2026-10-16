// Finance — Chapter 3: Risk, return and mean–variance portfolios (items 3.1–3.7; 3.8–3.14 are in ch03-b.js, 3.15 in ch03-papers.js)
//
// Sources and honesty notes (verified Oct 2026 against Crossref / publisher pages): Evans & Archer, J. Finance 23(5):761–767 (1968);
// Sharpe, Management Science 9(2):277–293 (1963); Merton, J. Financial and Quantitative Analysis 7(4):1851–1872 (1972);
// Markowitz, J. Finance 7(1):77–91 (1952).
// Pictures marked "real" use the monthly returns of the ten industry portfolios, the market and the T-bill rate from Kenneth R. French's
// Data Library (CRSP), 1963-07 … 2026-08, via ch04.shared.js. Other pictures use stated model parameters (the numbers are illustrative
// and are labelled so in each caption).
import { clamp, pct, fx, sg, pctTicks, data, marketTotal, mean, sdev, ols, excess, quad, frontierConsts, frontierSd, frontierWeights, minVarLong, longFrontier, universe, rng, idxOf, IND_NAMES, IND_LONG } from './ch03.shared.js';

const ptk = (lo, hi, step) => pctTicks(Math.ceil(lo / step - 1e-9) * step, hi, step);
const sq = (x) => x * x;

export default {
  collection: 'fin',
  chapter: 3,
  title: 'Risk, return and mean–variance portfolios',
  summary: String.raw`Returns are random, and averaging them arithmetically or geometrically gives different answers. Combining imperfectly correlated assets lowers risk without lowering expected return, which is the whole case for diversification. Markowitz turned this into an optimization: the efficient frontier of portfolios with least variance for each mean. Adding a risk-free asset makes every investor hold the same risky portfolio, mixed with lending or borrowing.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Arithmetic versus geometric mean returns',
      statement: String.raw`For period returns $r_1,\dots,r_n$ (each $>-1$) the **arithmetic mean** is $\bar r_A=\frac1n\sum r_t$, the average return in one period, and the **geometric mean** is $\bar r_G=\bigl(\prod(1+r_t)\bigr)^{1/n}-1$, the constant return per period that would produce the same terminal wealth. Always $\bar r_G\le\bar r_A$, with equality only if all returns are equal, and to second order
$$\bar r_G\;\approx\;\bar r_A-\tfrac12\sigma^2,$$
where $\sigma^2$ is the variance of the returns. A gain of $a$ followed by a loss of $a$ has arithmetic mean $0$ but multiplies wealth by $1-a^2<1$.

Scope: the approximation is accurate for small $\sigma$ and mild skewness; the inequality itself is exact.`,
      idea: String.raw`Terminal wealth is $\prod(1+r_t)=\exp\sum\ln(1+r_t)$, so the geometric mean is the exponential of the average of $\ln(1+r_t)$. Because $\ln$ is concave, the average of the logs is below the log of the average (the arithmetic–geometric mean inequality, rca-3.3a), which is the inequality. Expanding $\ln(1+r)\approx r-r^2/2$ (Taylor, pma-5.15) gives the correction $\tfrac12\sigma^2$: the more the returns scatter, the further the geometric mean falls below the arithmetic one. Compounding makes losses weigh more than equal-sized gains, since a loss of $a$ must be followed by a gain of $a/(1-a)$ to break even.`,
      caption: String.raw`**Left**: the real calendar-year returns, 1964–2025, of the US market or of one of ten industry portfolios (Kenneth French's data). The orange line is the arithmetic mean, the green line the geometric mean. Pick a series, then drag **volatility scale** $c$: it shrinks (or magnifies) every year's deviation from the average, keeping the arithmetic mean fixed; at $c=0$ all years are equal and the two means coincide. **Right**: the toy of a gain $a$ then a loss $a$ — wealth falls although the arithmetic mean is $0$.`,
      deps: ['fin-1.1', 'rca-3.3a', 'pma-5.15'],
      refs: ['BKM ch. 5'],
      tags: ['returns', 'compounding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geometric_mean#Application_to_rates_of_return' },
      viz(v) {
        const D = data(), tot = marketTotal();
        const names = ['market', ...IND_NAMES];
        const src = v.select('series', names.map((n, i) => ({ value: String(i), label: n })), '0');
        const scale = v.slider('volatility scale $c$', 0, 1.5, 1, { step: 0.01 });
        const a = v.slider('toy: gain then loss of', 0, 0.95, 0.5, { step: 0.01, fmt: (x) => pct(x, 0) });
        const A = v.stage({ x: [1963, 2027], y: [-0.6, 0.8], axes: 'box', gutter: true, height: 330, weight: 1.5, minWidth: 300, xlabel: 'calendar year', ylabel: 'return in the year', title: 'real annual returns, 1964–2025' });
        const B = v.stage({ x: [0, 8.4], y: [0, 1.15], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'rounds (a gain, then a loss of the same size)', ylabel: 'wealth', title: 'a toy: up $a$, then down $a$' });
        let st = null;
        v.render(() => {
          const k = +src.value, s = k === 0 ? tot : D.ind[k - 1], raw = [];
          for (let y = 1964; y <= 2025; y++) { let w = 1; const i0 = idxOf(y, 1); for (let i = i0; i < i0 + 12; i++) w *= 1 + s[i]; raw.push(w - 1); }
          const m0 = mean(raw), vals = raw.map((x) => Math.max(-0.99, m0 + scale.value * (x - m0)));
          const n = vals.length, am = mean(vals), sd = sdev(vals), gm = Math.exp(vals.reduce((t, x) => t + Math.log(1 + x), 0) / n) - 1;
          const lo = Math.min(-0.2, ...vals) - 0.05, hi = Math.max(0.2, ...vals) + 0.05, step = hi - lo > 1.1 ? 0.2 : 0.1;
          A.setView([1963, 2027], [lo, hi]); A.setTicks(null, ptk(lo, hi, step));
          A.bars(vals, { x0: 1964, dx: 1, color: (x) => (x < 0 ? 'red' : 'accent') });
          A.hline(am, { color: 'orange', width: 2.2 }); A.hline(gm, { color: 'green', width: 2.2 });
          A.text('arithmetic ' + pct(am, 1), 2026.5, am, { align: 'right', dy: -9, size: 11.5, color: 'orange', weight: 700, plate: true });
          A.text('geometric ' + pct(gm, 1), 2026.5, gm, { align: 'right', dy: 13, size: 11.5, color: 'green', weight: 700, plate: true });
          const g = 1 - sq(a.value), pts = []; for (let r = 0; r <= 8; r++) pts.push([r, Math.pow(g, r)]);
          B.hline(1, { color: 'orange', dash: [6, 4], width: 1.6 });
          B.text('what a 0% average would suggest', 8.3, 1, { align: 'right', dy: -9, size: 11, color: 'orange', weight: 600 });
          B.path(pts, { color: 'green', width: 2.6 }); B.dots(pts, { r: 3.5, color: 'green' });
          B.text('after 8 rounds: ' + fx(100 * pts[8][1], 0) + '% of the start', 8.3, pts[8][1], { align: 'right', dy: -24, size: 11.5, color: 'green', weight: 700 });
          st = { am, gm, sd, n, appr: am - sd * sd / 2, g };
        });
        v.legend([['accent', 'year with a gain'], ['red', 'year with a loss'], ['orange', 'arithmetic mean'], ['green', 'geometric mean']]);
        v.readout(() => `arithmetic mean ${pct(st.am, 2)}, geometric mean ${pct(st.gm, 2)} (gap ${fx(100 * (st.am - st.gm), 2)} points) · $\\sigma=${fx(100 * st.sd, 1)}\\%$, so $\\bar r_A-\\sigma^2/2=${pct(st.appr, 2)}$ · toy: $+a,-a$ has arithmetic mean $0$ but multiplies wealth by $1-a^2=${fx(st.g, 3)}$ per round`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Phenomenon',
      name: 'Volatility drag: growth ≈ mean − σ²/2',
      statement: String.raw`Let wealth follow $dW/W=\mu\,dt+\sigma\,dB$ (geometric Brownian motion). Then $\ln W_T$ is normal with mean $(\mu-\sigma^2/2)T$ and variance $\sigma^2T$, so
$$\mathbb E[W_T]=W_0e^{\mu T},\qquad \operatorname{median}(W_T)=W_0e^{(\mu-\sigma^2/2)T},$$
and the typical path grows at the rate $g=\mu-\tfrac12\sigma^2$ — **volatility drag** — which is negative once $\sigma>\sqrt{2\mu}$, although the expected wealth always grows at $\mu$. With fixed $\mu$, more volatility therefore lowers the growth of a typical investor's wealth while leaving the mean untouched.

Scope: continuous rebalancing-free buy and hold of one risky asset with constant $\mu,\sigma$ (a model; real returns have fat tails and changing volatility).`,
      idea: String.raw`Itô's formula applied to $\ln W$ (the stochastic version of the Taylor expansion used in fin-3.1) gives $d\ln W=(\mu-\sigma^2/2)dt+\sigma\,dB$, so $\ln W_T$ is Gaussian. The median of $W_T$ is the exponential of the median of $\ln W_T$, i.e. $e^{(\mu-\sigma^2/2)T}$, whereas the mean of a lognormal variable carries the extra factor $e^{\sigma^2T/2}$, which restores exactly $e^{\mu T}$. The mean is therefore dominated by a few extremely lucky paths, while the median describes what most investors get. In growth terms this is the gap between the arithmetic and geometric mean returns.`,
      caption: String.raw`**Left**: 300 simulated wealth paths (a sample of 40 drawn) on a log scale; the green line is the median-growth curve $e^{(\mu-\sigma^2/2)t}$, the orange line the mean growth $e^{\mu t}$, the gold line the *sample* median of the 300 paths. Raise **volatility** and watch the green line bend down while the orange one stays put (the sample mean of the paths follows it only roughly: it rests on a few lucky paths). **Right**: growth rate $g=\mu-\sigma^2/2$ against $\sigma$; it crosses zero at $\sigma=\sqrt{2\mu}$. Simulation parameters are illustrative.`,
      deps: ['fin-3.1', 'pma-5.15'],
      refs: ['Luenberger: Models of Asset Dynamics'],
      tags: ['volatility drag', 'geometric Brownian motion'],
      scope: String.raw`Exact for geometric Brownian motion with constant $\mu,\sigma$; real assets deviate (fat tails, volatility clustering), and with frequent rebalancing the drag applies to the portfolio's own volatility.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geometric_Brownian_motion' },
      viz(v) {
        const mu = v.slider('expected return $\\mu$', 0, 0.15, 0.08, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const sg_ = v.slider('volatility $\\sigma$', 0, 0.8, 0.3, { step: 0.005, fmt: (x) => pct(x, 1) });
        const T = v.slider('horizon $T$ (years)', 1, 40, 20, { step: 1, int: true });
        const NP = 300, NS = 160, Z = [], r = rng(11);
        for (let p = 0; p < NP; p++) { const row = new Float64Array(NS); for (let i = 0; i < NS; i++) row[i] = r.normal(); Z.push(row); }
        const P = v.stage({ x: [0, 20], y: [0.01, 1e4], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.5, minWidth: 300, xlabel: 'years', ylabel: 'wealth (start = 1)', title: 'simulated wealth paths (log scale)' });
        const G = v.stage({ x: [0, 0.8], y: [-0.3, 0.16], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'volatility σ', ylabel: 'growth rate of the typical path', xticks: ptk(0, 0.8, 0.2), title: 'growth rate against volatility' });
        let st = null;
        v.render(() => {
          const m = mu.value, s = sg_.value, steps = 4 * T.value, dt = 0.25, drift = (m - s * s / 2) * dt, vol = s * Math.sqrt(dt);
          const L = new Float64Array(NP * (steps + 1)), med = [], col = new Float64Array(NP);
          let mn = 0, mx = 0;
          for (let p = 0; p < NP; p++) { let x = 0; for (let i = 1; i <= steps; i++) { x += drift + vol * Z[p][i - 1]; L[p * (steps + 1) + i] = x; if (x < mn) mn = x; if (x > mx) mx = x; } }
          for (let i = 0; i <= steps; i++) { for (let p = 0; p < NP; p++) col[p] = L[p * (steps + 1) + i]; const srt = Float64Array.from(col).sort(); med.push([i * dt, Math.exp((srt[NP / 2 - 1] + srt[NP / 2]) / 2)]); }
          const lo = Math.exp(Math.min(mn, 0)) * 0.7, hi = Math.max(Math.exp(mx), Math.exp(m * T.value)) * 1.4;
          P.setView([0, T.value], [lo, hi]);
          for (let p = 0; p < 40; p++) { const pts = []; for (let i = 0; i <= steps; i++) pts.push([i * dt, Math.exp(L[p * (steps + 1) + i])]); P.path(pts, { color: 'muted', width: 1, alpha: 0.35 }); }
          P.fn((t) => Math.exp(m * t), { color: 'orange', width: 2.4, dash: [7, 4], domain: [0, T.value] });
          P.fn((t) => Math.exp((m - s * s / 2) * t), { color: 'green', width: 2.8, domain: [0, T.value] });
          P.path(med, { color: 'gold', width: 2 });
          P.hline(1, { color: 'faint', width: 1 });
          const fin = []; for (let p = 0; p < NP; p++) fin.push(L[p * (steps + 1) + steps]);
          const wmed = med[steps][1], wmean = fin.reduce((t, x) => t + Math.exp(x), 0) / NP;
          G.fn((x) => m - x * x / 2, { color: 'green', width: 2.6 });
          G.hline(0, { color: 'ink', width: 1 });
          G.hline(m, { color: 'orange', dash: [6, 4], width: 1.6 });
          G.text('mean growth $\\mu$', 0.78, m, { align: 'right', dy: -9, size: 11.5, color: 'orange', weight: 700 });
          G.dot(s, m - s * s / 2, { r: 7, color: 'green' });
          G.dot(s, Math.log(wmed) / T.value, { r: 5, color: 'gold' });
          if (m > 0 && Math.sqrt(2 * m) < 0.8) { G.dot(Math.sqrt(2 * m), 0, { r: 5, color: 'red', hollow: true }); G.text('$\\sigma=\\sqrt{2\\mu}$', Math.sqrt(2 * m), 0, { dy: -12, size: 11.5, color: 'red', weight: 700 }); }
          st = { wmed, wmean, th: Math.exp((m - s * s / 2) * T.value), thm: Math.exp(m * T.value), g: m - s * s / 2 };
        });
        v.legend([['orange', 'mean growth $e^{\\mu t}$', { dash: true }], ['green', 'median growth $e^{(\\mu-\\sigma^2/2)t}$'], ['gold', 'sample median of 300 paths'], ['muted', 'sample paths']]);
        v.readout(() => `typical growth rate $\\mu-\\sigma^2/2=${sg(100 * st.g, 2)}\\%$ a year · terminal wealth: sample median ${fx(st.wmed, 2)} vs formula ${fx(st.th, 2)}; sample mean ${fx(st.wmean, 2)} vs $e^{\\mu T}=${fx(st.thm, 2)}$ (the sample mean is noisy: a few paths dominate)`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Portfolio mean, variance and covariance',
      statement: String.raw`A portfolio holds fractions $w_1,\dots,w_n$ of wealth ($\sum w_i=1$) in assets with expected returns $\mu_i$, variances $\sigma_i^2$ and covariances $\sigma_{ij}=\operatorname{Cov}(r_i,r_j)=\rho_{ij}\sigma_i\sigma_j$. Its return $r_p=\sum w_ir_i$ has
$$\mu_p=\sum_i w_i\mu_i=w^{\top}\mu,\qquad \sigma_p^2=\sum_{i,j}w_iw_j\sigma_{ij}=w^{\top}\Sigma\,w .$$
The mean is the weighted average of the means; the standard deviation is **not** the weighted average of the standard deviations: $\sigma_p\le\sum w_i\sigma_i$ when all $w_i\ge0$, with equality only if all correlations are $1$.

Scope: one period, returns with finite second moments; $\Sigma$ is symmetric and positive semidefinite.`,
      idea: String.raw`Expectation is linear, so $\mu_p$ is the weighted mean. For the variance, expand $\bigl(\sum w_i(r_i-\mu_i)\bigr)^2$ and take expectations: every pair $(i,j)$ contributes $w_iw_j\sigma_{ij}$, the diagonal terms being the variances. Since $\sigma_{ij}\le\sigma_i\sigma_j$ (Cauchy–Schwarz), the double sum is at most $(\sum w_i\sigma_i)^2$, which proves the inequality for non-negative weights; every correlation below $1$ makes the off-diagonal terms smaller. These cross terms are what portfolio theory exploits.`,
      caption: String.raw`Three **real** industry portfolios (annualised mean returns and covariances estimated from 1963–2026 monthly data; Kenneth French's data library). **Left**: drag the gold point inside the triangle to choose the weights (a corner is 100% in one asset). **Middle**: the three assets, 500 random portfolios (grey) and yours (gold) in the risk–return plane; the dashed marker shows the *weighted average of the three $\sigma$'s*, which is always at or to the right of the portfolio's own $\sigma$. **Right**: the nine terms $w_iw_j\sigma_{ij}$ (in percent²) of the variance; their sum is $\sigma_p^2$.`,
      deps: ['fin-3.1'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory', 'BKM ch. 7'],
      tags: ['portfolio', 'covariance'],
      credit: 'Harry Markowitz, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory#Risk_and_expected_return' },
      viz(v) {
        const SETS = [[4, 8, 3], [0, 1, 5], [7, 6, 2]];
        const set = v.select('assets', [{ value: '0', label: 'HiTec · Utils · Enrgy' }, { value: '1', label: 'NoDur · Durbl · Telcm' }, { value: '2', label: 'Hlth · Shops · Manuf' }], '0');
        const T = v.stage({ x: [-0.3, 1.3], y: [-0.14, 1.12], equal: true, axes: false, height: 320, weight: 1, minWidth: 230, title: 'weights' });
        const R = v.stage({ x: [0.1, 0.3], y: [0.08, 0.15], axes: 'box', gutter: true, height: 320, weight: 1.15, minWidth: 250, xlabel: 'risk σ (annual)', ylabel: 'mean return', title: 'risk–return plane' });
        const M = v.stage({ x: [-1.2, 3.3], y: [-0.7, 3.6], axes: false, height: 320, weight: 1.15, minWidth: 260, title: 'the terms $w_iw_j\\sigma_{ij}$' });
        const port = T.handle(0.4, 0.35, { color: 'gold', label: 'weights', constrain: (x, y) => { x = Math.max(0, x); y = Math.max(0, y); const s = x + y; return s > 1 ? [x / s, y / s] : [x, y]; } });
        const cloud = []; { const r = rng(5); for (let k = 0; k < 500; k++) { const a = -Math.log(r()), b = -Math.log(r()), c = -Math.log(r()), s = a + b + c; cloud.push([a / s, b / s, c / s]); } }
        let st = null;
        v.render(() => {
          const U = universe(SETS[+set.value]), { mu, S, sd, names } = U, w = [port.x, port.y, 1 - port.x - port.y];
          const cols = ['blue', 'orange', 'purple'];
          T.poly([[0, 0], [1, 0], [0, 1]], { fill: 'faint', fillAlpha: 0.14, color: 'muted', width: 1.4 });
          [[1, 0], [0, 1], [0, 0]].forEach(([x, y], i) => T.text(names[i], x, y, { dx: i === 0 ? 0 : 6, dy: i === 1 ? -10 : 14, align: i === 0 ? 'right' : 'left', size: 11.5, color: cols[i], weight: 700 }));
          const lo = Math.min(...sd), hi = Math.max(...sd), mlo = Math.min(...mu), mhi = Math.max(...mu);
          R.setView([lo * 0.6, hi * 1.3], [mlo - 0.01, mhi + 0.012]);
          const ptsOf = (x) => [Math.sqrt(quad(x, S)), x[0] * mu[0] + x[1] * mu[1] + x[2] * mu[2]];
          for (const x of cloud) { const [a, b] = ptsOf(x); R.dot(a, b, { r: 1.5, color: 'muted', alpha: 0.4 }); }
          sd.forEach((s, i) => { R.dot(s, mu[i], { r: 5.5, color: cols[i] }); R.text(names[i], s, mu[i], { dx: 9, dy: -3, align: 'left', size: 12, color: cols[i], weight: 700 }); });
          const [sp, mp] = ptsOf(w), avg = w[0] * sd[0] + w[1] * sd[1] + w[2] * sd[2];
          R.line(avg, mp, sp, mp, { color: 'orange', dash: [4, 3], width: 1.6 });
          R.dot(avg, mp, { r: 5, color: 'orange', hollow: true });
          R.text('weighted avg. of σ', avg, mp, { align: 'right', dy: 16, size: 10.5, color: 'orange', weight: 600 });
          R.dot(sp, mp, { r: 7.5, color: 'gold' });
          // the nine terms
          const terms = w.map((wi, i) => w.map((wj, j) => 1e4 * wi * wj * S[i][j])), mx = Math.max(...terms.flat().map(Math.abs), 1e-9);
          let tot = 0;
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const t = terms[i][j]; tot += t;
            M.rect(j, 2 - i, j + 1, 3 - i, { fill: t >= 0 ? (i === j ? 'blue' : 'orange') : 'red', fillAlpha: 0.12 + 0.6 * Math.abs(t) / mx, color: 'muted', width: 1 });
            M.text(fx(t, 1), j + 0.5, 2.5 - i, { size: 13, weight: 700, color: 'ink', baseline: 'middle' });
          }
          for (let i = 0; i < 3; i++) { M.text(names[i], -0.1, 2.5 - i, { align: 'right', size: 12, color: cols[i], weight: 700, baseline: 'middle' }); M.text(names[i], i + 0.5, 3.25, { size: 12, color: cols[i], weight: 700 }); }
          M.text('sum of the nine = ' + fx(tot, 1) + '  (σ² in %²)', 1.1, -0.4, { size: 12, weight: 700, color: 'green', align: 'center' });
          st = { w, mp, sp, avg, tot, v2: 1e4 * quad(w, S), names };
        });
        v.legend([['blue', 'a variance term $w_i^2\\sigma_i^2$'], ['orange', 'a covariance term (positive)'], ['red', 'a covariance term (negative)'], ['gold', 'your portfolio', { dot: true }]]);
        v.readout(() => `weights ${st.w.map((x, i) => `${st.names[i]} ${fx(100 * x, 0)}%`).join(' / ')} · mean ${pct(st.mp, 2)} · $\\sigma_p=${pct(st.sp, 2)}$ against the weighted average of the $\\sigma_i$: ${pct(st.avg, 2)} (diversification: ${fx(100 * (st.avg - st.sp), 2)} points) · $\\sum w_iw_j\\sigma_{ij}=${fx(st.tot, 1)}$ and $w^{\\top}\\Sigma w=${fx(st.v2, 1)}$ (%²)`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Diversification: variance falls to the average covariance',
      statement: String.raw`Hold $n$ assets in equal proportions $1/n$. With average variance $\bar\sigma^2$ and average pairwise covariance $\bar c$,
$$\sigma_p^2=\frac1n\,\bar\sigma^2+\Bigl(1-\frac1n\Bigr)\bar c\;\xrightarrow[n\to\infty]{}\;\bar c .$$
The portfolio's variance decreases monotonically (if $\bar\sigma^2>\bar c$), the part due to the assets' own variances vanishes like $1/n$, and what remains is the average covariance: risk that no amount of diversification across these assets removes. For equal variances and a common correlation $\rho$ the floor is $\rho\sigma^2$, i.e. $\sigma_p\to\sqrt\rho\,\sigma$.

Scope: equal weights; the limit is $\bar c$ only if the average covariance stays bounded as assets are added. Correlations common to all of $n$ assets cannot be below $-1/(n-1)$.`,
      idea: String.raw`Write $\sigma_p^2=\sum_{i,j}\frac1{n^2}\sigma_{ij}$ (fin-3.3). The $n$ diagonal terms contribute $n\cdot\frac1{n^2}\bar\sigma^2=\bar\sigma^2/n$ and the $n(n-1)$ off-diagonal terms contribute $\frac{n(n-1)}{n^2}\bar c$. The first term is the average of many independent-looking contributions, which shrinks; the second tends to $\bar c$ because there are about $n^2$ cross terms against only $n$ variances. So spreading wealth removes the risk that is specific to each asset but not the risk the assets share.`,
      caption: String.raw`A *model* with equal volatility and one common correlation (the numbers are illustrative; real stocks have unequal ones). **Left**: the risk $\sigma_p$ of an equally weighted portfolio of $n$ assets against $n$ — formula (curve), and *realised* risk in a simulated sample of 240 periods generated with that correlation (gold dots: 240 independent periods; they scatter around the curve because they are estimated from finite data) — and the floor $\sqrt\rho\,\sigma$ (dashed). **Right**: the variance split into the part from the assets' own variances (blue, $\sigma^2/n$) and from covariances (orange). Slide the **correlation** to $0$ and the floor disappears; raise it and diversification is worth little.`,
      deps: ['fin-3.3'],
      refs: ['BKM ch. 7'],
      tags: ['diversification', 'covariance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diversification_(finance)' },
      viz(v) {
        const sg0 = v.slider('stock volatility $\\sigma$', 0.1, 0.6, 0.3, { step: 0.005, fmt: (x) => pct(x, 1) });
        const rho = v.slider('common correlation $\\rho$', 0, 0.9, 0.3, { step: 0.01 });
        const NMAX = 50, TT = 240, r = rng(21);
        const F = new Float64Array(TT), E = [];
        for (let t = 0; t < TT; t++) F[t] = r.normal();
        for (let i = 0; i < NMAX; i++) { const row = new Float64Array(TT); for (let t = 0; t < TT; t++) row[t] = r.normal(); E.push(row); }
        const A = v.stage({ x: [0, 51], y: [0, 0.4], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 290, xlabel: 'number of assets n', ylabel: 'portfolio risk σ_p', xticks: [1, 10, 20, 30, 40, 50], title: 'risk of the equally weighted portfolio' });
        const B = v.stage({ x: [0, 51], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'number of assets n', ylabel: 'variance relative to one asset', xticks: [1, 10, 20, 30, 40, 50], yticks: pctTicks(0, 1, 0.25), title: 'where the variance comes from' });
        let st = null;
        v.render(() => {
          const s = sg0.value, p = rho.value, sdOf = (n) => s * Math.sqrt(1 / n + (1 - 1 / n) * p);
          A.setView([0, 51], [0, s * 1.08]); A.setTicks(null, ptk(0, s * 1.08, s > 0.35 ? 0.1 : 0.05));
          A.fn((n) => sdOf(Math.max(n, 1)), { domain: [1, 50], color: 'accent', width: 2.6 });
          A.hline(Math.sqrt(p) * s, { color: 'red', dash: [6, 4], width: 1.8 });
          A.text('floor $\\sqrt{\\rho}\\,\\sigma$ = ' + pct(Math.sqrt(p) * s, 1), 50.5, Math.sqrt(p) * s, { align: 'right', dy: 16, size: 11.5, color: 'red', weight: 700 });
          // realised risk: factor model r_i = σ(√ρ F + √(1−ρ) e_i)
          const run = new Float64Array(TT); const real = [];
          for (let n = 1; n <= NMAX; n++) {
            let m = 0, m2 = 0;
            for (let t = 0; t < TT; t++) { run[t] += s * (Math.sqrt(p) * F[t] + Math.sqrt(1 - p) * E[n - 1][t]); const x = run[t] / n; m += x; m2 += x * x; }
            real.push([n, Math.sqrt(Math.max(0, (m2 - m * m / TT) / (TT - 1)) * 1)]);
          }
          A.dots(real, { r: 3, color: 'gold' });
          for (let n = 1; n <= NMAX; n++) {
            const own = (1 / n) / 1, cov = p * (1 - 1 / n); // relative to one asset's variance
            B.rect(n - 0.4, 0, n + 0.4, own, { fill: 'blue', fillAlpha: 0.75, stroke: false });
            B.rect(n - 0.4, own, n + 0.4, own + cov, { fill: 'orange', fillAlpha: 0.75, stroke: false });
          }
          st = { s1: sdOf(1), s10: sdOf(10), s50: sdOf(50), fl: Math.sqrt(p) * s, r10: real[9][1], r50: real[49][1] };
        });
        v.legend([['accent', 'formula'], ['gold', 'simulated sample (240 periods)', { dot: true }], ['red', 'floor', { dash: true }], ['blue', 'own-variance part'], ['orange', 'covariance part']]);
        v.readout(() => `$\\sigma_p$ for $n=1$: ${pct(st.s1, 1)} · $n=10$: ${pct(st.s10, 1)} (sample: ${pct(st.r10, 1)}) · $n=50$: ${pct(st.s50, 1)} (sample: ${pct(st.r50, 1)}) · floor ${pct(st.fl, 1)}: the first ten assets remove ${fx(100 * (st.s1 - st.s10) / Math.max(1e-9, st.s1 - st.fl), 0)}% of the removable risk`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Systematic and idiosyncratic risk',
      statement: String.raw`In the single-index model the excess return of asset $i$ is $r_i=\alpha_i+\beta_iF+\varepsilon_i$, where $F$ is the market factor and the residuals $\varepsilon_i$ are uncorrelated with $F$ and with each other. Its variance splits as
$$\sigma_i^2=\underbrace{\beta_i^2\sigma_F^2}_{\text{systematic}}+\underbrace{\sigma_{\varepsilon_i}^2}_{\text{idiosyncratic}} .$$
For an equally weighted portfolio of $n$ such assets the idiosyncratic part is divided by $n$ and the systematic part is that of the average beta: $\sigma_p^2=\bar\beta^2\sigma_F^2+\bar\sigma_\varepsilon^2/n$. Idiosyncratic risk is diversified away; systematic risk is not, so only the latter can be expected to be rewarded.

Scope: a one-factor description; residual uncorrelation is an assumption, approximately true only if the factor captures the common movement.`,
      idea: String.raw`Regression of $r_i$ on $F$ splits $r_i$ into the fitted part and a residual that is uncorrelated with $F$ (least squares); the variances therefore add (Pythagoras for covariances). If residuals are also mutually uncorrelated, the diversification theorem (fin-3.4) kills their contribution at rate $1/n$ because $\bar c=\bar\beta^2\sigma_F^2$ contains only the factor, so the covariance floor *is* the systematic variance. The argument is Sharpe's single-index model (1963) and underlies the reasoning of CAPM (Chapter 4).`,
      caption: String.raw`**Left**: a *model* stock whose variance is a chosen share systematic (drag **systematic share**); equally weighted portfolios of $n=1,2,4,\dots,128$ such stocks keep the blue part and lose the orange part like $1/n$. **Middle**: the *real* split for the ten industry portfolios and their equal-weighted average, from regressions of monthly excess returns on the market's (1963–2026; Kenneth French's data): bars are variances in %² per year. Each industry is already a diversified portfolio of many firms, so its idiosyncratic part is small. **Right**: the scatter and regression line for the series you select; the vertical spread about the line is the idiosyncratic risk.`,
      deps: ['fin-3.4'],
      refs: ['BKM ch. 7', 'BKM ch. 8'],
      tags: ['systematic risk', 'market model'],
      credit: 'William F. Sharpe (single-index model), 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Idiosyncrasy#Idiosyncratic_risk' },
      viz(v) {
        const D = data(), n = D.n;
        const share = v.slider('systematic share of a stock\'s variance', 0.05, 0.95, 0.4, { step: 0.01, fmt: (x) => pct(x, 0) });
        const pick = v.select('scatter for', [{ value: '10', label: 'EW avg.' }, ...IND_NAMES.map((nm, i) => ({ value: String(i), label: nm }))], '4');
        const L = v.stage({ x: [0.3, 9.1], y: [0, 1.05], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'stocks in the portfolio (n)', ylabel: 'variance relative to one stock', xticks: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i, String(2 ** (i - 1))]), yticks: pctTicks(0, 1, 0.25), title: 'model: equally weighted stocks' });
        const Mi = v.stage({ x: [0.3, 11.7], y: [0, 400], axes: 'box', gutter: true, height: 330, weight: 1.9, minWidth: 340, xlabel: 'industry portfolio', ylabel: 'variance (%² per year)', xticks: [...IND_NAMES.map((nm, i) => [i + 1, nm.slice(0, 3)]), [11, 'EW']], title: 'real: systematic and idiosyncratic variance' });
        const Sc = v.stage({ x: [-25, 20], y: [-25, 25], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'market excess return (% a month)', ylabel: 'industry excess return (% a month)', title: 'regression on the market' });
        const mk = D.mkt, ew = new Float64Array(n);
        for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < 10; k++) s += D.ind[k][i]; ew[i] = s / 10; }
        const series = (k) => (k === 10 ? ew : D.ind[k]);
        const fits = []; for (let k = 0; k <= 10; k++) { const y = excess(series(k), D.rf), f = ols(y, [mk]); fits.push({ y, f, tot: 1e4 * 12 * sq(sdev(y)), sys: 1e4 * 12 * sq(f.b[1]) * sq(sdev(mk)), idio: 1e4 * 12 * sq(f.s) * (f.n - 2) / (f.n - 1) }); }
        v.render(() => {
          const sh = share.value;
          for (let i = 1; i <= 8; i++) {
            const nn = 2 ** (i - 1), idio = (1 - sh) / nn;
            L.rect(i - 0.36, 0, i + 0.36, sh, { fill: 'blue', fillAlpha: 0.75, stroke: false });
            L.rect(i - 0.36, sh, i + 0.36, sh + idio, { fill: 'orange', fillAlpha: 0.8, stroke: false });
            L.text(fx(100 * sh / (sh + idio), 0) + '%', i, sh + idio, { dy: -8, size: 10.5, color: 'ink', weight: 600 });
          }
          L.text('share that is systematic', 9, 1.0, { align: 'right', size: 11, color: 'muted' });
          const top = Math.max(...fits.map((f) => f.sys + f.idio)) * 1.12;
          Mi.setView([0.3, 11.7], [0, top]);
          fits.forEach((f, k) => {
            const x = k + 1;
            Mi.rect(x - 0.36, 0, x + 0.36, f.sys, { fill: 'blue', fillAlpha: 0.75, stroke: false });
            Mi.rect(x - 0.36, f.sys, x + 0.36, f.sys + f.idio, { fill: 'orange', fillAlpha: 0.85, stroke: false });
            Mi.text('R²=' + fx(f.f.r2, 2), x, f.sys + f.idio, { dy: -8, size: 9.5, color: 'ink', weight: 600, plate: true });
          });
          const k = +pick.value === 10 ? 10 : +pick.value, f = fits[k];
          const pts = []; for (let i = 0; i < n; i += 1) pts.push([100 * mk[i], 100 * f.y[i]]);
          Sc.dots(pts, { r: 1.7, color: 'muted', alpha: 0.5 });
          const [a, b] = f.f.b; Sc.line(-25, 100 * a + b * -25, 20, 100 * a + b * 20, { color: 'green', width: 2.4 });
          Sc.text('β = ' + fx(b, 2) + ', R² = ' + fx(f.f.r2, 2), -24, 22, { align: 'left', size: 12, weight: 700, color: 'green', plate: true });
          pick.k = k;
        });
        v.legend([['blue', 'systematic $\\beta^2\\sigma_F^2$'], ['orange', 'idiosyncratic'], ['green', 'regression line']]);
        v.readout(() => { const k = pick.k, f = fits[k]; return `${k === 10 ? 'equal-weighted average of the ten' : IND_LONG[IND_NAMES[k]]}: total variance ${fx(f.tot, 0)} %² = ${fx(f.sys, 0)} systematic + ${fx(f.idio, 0)} idiosyncratic (sum ${fx(f.sys + f.idio, 0)}); beta ${fx(f.f.b[1], 2)} · model: with ${pct(share.value, 0)} systematic, a 64-stock portfolio is ${pct(share.value / (share.value + (1 - share.value) / 64), 0)} systematic`; });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'The two-asset frontier and the role of correlation',
      statement: String.raw`Two assets with means $\mu_A,\mu_B$, standard deviations $\sigma_A,\sigma_B$ and correlation $\rho$. The portfolio with weight $w$ in $A$ (and $1-w$ in $B$) has
$$\mu_p=w\mu_A+(1-w)\mu_B,\qquad \sigma_p^2=w^2\sigma_A^2+(1-w)^2\sigma_B^2+2w(1-w)\rho\sigma_A\sigma_B .$$
In the $(\sigma,\mu)$ plane the portfolios trace a curve through $A$ and $B$: a straight segment if $\rho=1$; for $\rho<1$ the curve bulges to the left, with a minimum-variance portfolio $w^*=\dfrac{\sigma_B^2-\rho\sigma_A\sigma_B}{\sigma_A^2+\sigma_B^2-2\rho\sigma_A\sigma_B}$; and for $\rho=-1$ it is two segments meeting at $\sigma=0$, attained at $w=\sigma_B/(\sigma_A+\sigma_B)$. The lower correlation, the more risk is removed.

Scope: single period; weights within $[0,1]$ unless short selling is allowed (dashed extension).`,
      idea: String.raw`$\mu_p$ is linear in $w$, while $\sigma_p^2$ is a quadratic in $w$ with $w^2$-coefficient $\sigma_A^2+\sigma_B^2-2\rho\sigma_A\sigma_B=\operatorname{Var}(r_A-r_B)\ge0$; setting its derivative to zero gives $w^*$. For $\rho=1$ the variance is the perfect square $(w\sigma_A+(1-w)\sigma_B)^2$, so $\sigma_p$ is linear in $w$ and the curve is a segment (no diversification, fin-3.3); at $\rho=-1$ it is $(w\sigma_A-(1-w)\sigma_B)^2$, which vanishes at a suitable $w$, the perfect hedge. Intermediate $\rho$ interpolates: since $\sigma_p^2$ is quadratic in $\mu_p$, the curve is a branch of a hyperbola in the $(\sigma,\mu)$ plane.`,
      caption: String.raw`The two assets $A$ and $B$ are *illustrative* (not data): drag them in the risk–return plane and slide the **correlation** $\rho$ from $+1$ (the straight segment) to $-1$ (two segments meeting on the return axis). **Right**: $\sigma_p$ against the weight $w$ in $A$ (curve) compared with the straight line of $\rho=1$; the dip below that line is the benefit of diversification, and the gold dot is the minimum-variance weight. Turn on **short selling** to extend the weights beyond $[0,1]$ (dashed).`,
      deps: ['fin-3.3'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory', 'BKM ch. 7'],
      tags: ['frontier', 'correlation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory#Two_risky_assets' },
      viz(v) {
        const rho = v.slider('correlation $\\rho$', -1, 1, 0.2, { step: 0.01 });
        const short = v.toggle('allow short selling', false);
        const L = v.stage({ x: [0, 0.5], y: [0, 0.2], axes: 'box', gutter: true, height: 340, weight: 1.15, minWidth: 280, xlabel: 'risk σ', ylabel: 'expected return', xticks: pctTicks(0, 0.5, 0.1), yticks: pctTicks(0, 0.2, 0.05), title: 'two assets and their mixes' });
        const R = v.stage({ x: [-0.5, 1.5], y: [0, 0.4], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'weight w in A', ylabel: 'portfolio risk σ_p', xticks: pctTicks(-0.5, 1.5, 0.25), yticks: pctTicks(0, 0.4, 0.1), title: 'risk against the mix' });
        const hA = L.handle(0.15, 0.06, { color: 'blue', label: 'A', constrain: { x: [0.03, 0.45], y: [0.01, 0.19] } });
        const hB = L.handle(0.3, 0.12, { color: 'orange', label: 'B', constrain: { x: [0.03, 0.45], y: [0.01, 0.19] } });
        let st = null;
        v.render(() => {
          const sA = hA.x, sB = hB.x, mA = hA.y, mB = hB.y, p = rho.value, ex = short.value;
          const sd = (w) => Math.sqrt(Math.max(0, sq(w * sA) + sq((1 - w) * sB) + 2 * w * (1 - w) * p * sA * sB));
          const mu = (w) => w * mA + (1 - w) * mB;
          const wl = ex ? -0.5 : 0, wh = ex ? 1.5 : 1;
          const den = sA * sA + sB * sB - 2 * p * sA * sB, wStar = den > 1e-12 ? (sB * sB - p * sA * sB) / den : sB > sA ? 1 : 0;
          const ws = clamp(wStar, wl, wh);
          const seg = (a, b, extra) => { const pts = []; for (let k = 0; k <= 100; k++) { const w = a + ((b - a) * k) / 100; pts.push([sd(w), mu(w)]); } L.path(pts, extra); };
          if (ex) { seg(-0.5, 0, { color: 'muted', width: 1.6, dash: [5, 4] }); seg(1, 1.5, { color: 'muted', width: 1.6, dash: [5, 4] }); }
          seg(0, 1, { color: 'accent', width: 3 });
          L.line(sA, mA, sB, mB, { color: 'faint', width: 1.4, dash: [3, 3] });
          L.dot(sd(ws), mu(ws), { r: 6.5, color: 'gold' }); L.text('min. risk', sd(ws), mu(ws), { dx: -9, dy: 22, align: 'right', size: 11.5, color: 'gold', weight: 700, plate: true });
          const line = []; for (let k = 0; k <= 100; k++) { const w = -0.5 + (2 * k) / 100; line.push([w, Math.abs(w * sA + (1 - w) * sB)]); }
          const curve = []; for (let k = 0; k <= 100; k++) { const w = -0.5 + (2 * k) / 100; curve.push([w, sd(w)]); }
          R.path(line, { color: 'muted', width: 1.6, dash: [6, 4] });
          R.path(curve.filter(([w]) => w >= wl - 1e-9 && w <= wh + 1e-9), { color: 'accent', width: 2.8 });
          if (ex) { R.path(curve.filter(([w]) => w <= 0), { color: 'muted', width: 1.6, dash: [5, 4] }); R.path(curve.filter(([w]) => w >= 1), { color: 'muted', width: 1.6, dash: [5, 4] }); }
          R.vline(0, { color: 'faint' }); R.vline(1, { color: 'faint' });
          R.dot(ws, sd(ws), { r: 6.5, color: 'gold' });
          st = { ws, smin: sd(ws), sA, sB, p, wStar };
        });
        v.legend([['accent', 'mixes of A and B'], ['muted', 'the case $\\rho=1$ (straight line)', { dash: true }], ['gold', 'minimum risk', { dot: true }]]);
        v.readout(() => `$\\rho=${fx(st.p, 2)}$ · minimum-risk weight in A: $w^*=${fx(st.wStar, 3)}$ (${st.wStar < 0 || st.wStar > 1 ? 'outside [0,1]: the best long-only mix is a single asset' : 'inside [0,1]'}) · σ at that mix ${pct(st.smin, 2)} against $\\min(\\sigma_A,\\sigma_B)=${pct(Math.min(st.sA, st.sB), 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'The Markowitz efficient frontier',
      statement: String.raw`Given $n$ assets with mean vector $\mu$ and nonsingular covariance matrix $\Sigma$ (not all means equal), the portfolios of least variance for each target mean $m$, with weights summing to one and **short sales allowed**, are
$$w(m)=\lambda(m)\,\Sigma^{-1}\mathbf 1+\gamma(m)\,\Sigma^{-1}\mu,\qquad \sigma^2(m)=\frac{a\,m^2-2b\,m+c}{ac-b^2},$$
with $a=\mathbf 1^{\top}\Sigma^{-1}\mathbf 1,\ b=\mathbf 1^{\top}\Sigma^{-1}\mu,\ c=\mu^{\top}\Sigma^{-1}\mu$ and $\lambda,\gamma$ the Lagrange multipliers (affine in $m$). In the $(\sigma,m)$ plane this is a hyperbola (a parabola in $(\sigma^2,m)$) whose vertex is the global minimum-variance portfolio; its upper half is the **efficient frontier**: no portfolio has higher mean for the same risk. With a no-short-sale constraint the frontier is a piecewise-hyperbolic curve lying to the right.

Scope: single period; means and covariances are taken as known.`,
      idea: String.raw`Minimising $w^{\top}\Sigma w$ subject to $\mathbf 1^{\top}w=1$ and $\mu^{\top}w=m$ is a quadratic problem with linear constraints; the Lagrange-multiplier method (micro-5.4) gives the linear system $\Sigma w=\lambda'\mathbf 1+\gamma'\mu$, solved by the formula above; substituting $w(m)$ in $w^{\top}\Sigma w$ yields the quadratic in $m$. A quadratic in $m$ means a parabola in $(\sigma^2,m)$ and a hyperbola in $(\sigma,m)$ (the explicit derivation for many assets is Merton, 1972). With sign constraints, the optimum has some weights fixed at zero; between changes of that set the solution is again of the above type, so the constrained frontier is made of hyperbola pieces.`,
      caption: String.raw`Five **real** industry portfolios (choose the set; annualised means and covariances estimated from 1963–2026 monthly data, Kenneth French's library). The grey cloud is 2,500 random long-only portfolios: none lies to the left of the green **long-only frontier**. Drag the gold point along the frontier to see the weights of the efficient portfolio of that mean (right). Turn on **short selling** to add the hyperbola of the theorem (blue): a larger family of portfolios, hence a frontier at least as far left; the lower half (dashed) is inefficient.`,
      deps: ['fin-3.6', 'micro-5.4'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory', 'BKM ch. 7'],
      tags: ['frontier', 'optimisation'],
      credit: 'Markowitz, 1952; explicit formulas for many assets: Merton, 1972',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Efficient_frontier' },
      viz(v) {
        const SETS = [[0, 4, 3, 8, 5], [1, 2, 6, 7, 9], [4, 8, 3, 7, 1]];
        const set = v.select('assets', [{ value: '0', label: 'NoDur HiTec Enrgy Utils Telcm' }, { value: '1', label: 'Durbl Manuf Shops Hlth Other' }, { value: '2', label: 'HiTec Utils Enrgy Hlth Durbl' }], '0');
        const short = v.toggle('allow short selling', false);
        const L = v.stage({ x: [0.08, 0.36], y: [0.07, 0.2], axes: 'box', gutter: true, height: 350, weight: 1.4, minWidth: 300, xlabel: 'risk σ (annual)', ylabel: 'mean return', xticks: pctTicks(0.1, 0.35, 0.05), yticks: pctTicks(0.08, 0.2, 0.04), title: 'five assets, their portfolios and the frontier' });
        const W = v.stage({ x: [0.4, 5.6], y: [-0.5, 1.2], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 250, xlabel: 'asset', ylabel: 'weight', yticks: pctTicks(-0.5, 1.2, 0.5), title: 'weights of the efficient portfolio' });
        let cache = null, key = '';
        const target = L.handle(0.16, 0.12, { color: 'gold', label: 'E', constrain: (x, y) => { if (!cache) return [x, y]; const E = clamp(y, cache.eLo, cache.eHi); return [cache.sdAt(E), E]; } });
        v.render(() => {
          const k = set.value;
          if (key !== k) {
            const U = universe(SETS[+k]), r = rng(7 + +k), pts = [];
            for (let q = 0; q < 2500; q++) { const e = U.mu.map(() => -Math.log(r())), s = e.reduce((a, b) => a + b, 0), w = e.map((x) => x / s); pts.push([Math.sqrt(quad(w, U.S)), w.reduce((t, x, i) => t + x * U.mu[i], 0)]); }
            const lf = longFrontier(U.mu, U.S, 80), F = frontierConsts(U.mu, U.S);
            const interp = (E) => { for (let i = 1; i < lf.length; i++) if (E <= lf[i].E) { const t = (E - lf[i - 1].E) / (lf[i].E - lf[i - 1].E || 1); return lf[i - 1].sd + t * (lf[i].sd - lf[i - 1].sd); } return lf[lf.length - 1].sd; };
            cache = { U, pts, lf, F, interp, eLo: lf[0].E, eHi: Math.max(...U.mu), sdAt: null }; key = k;
          }
          const { U, pts, lf, F, interp } = cache, ex = short.value;
          cache.sdAt = (E) => (ex ? frontierSd(F, E) : interp(E));
          cache.eLo = ex ? F.b / F.a : lf[0].E; cache.eHi = ex ? Math.max(...U.mu) + 0.04 : Math.max(...U.mu);
          { const mlo = Math.min(...U.mu), mhi = Math.max(...U.mu), xl = Math.min(...U.sd) * 0.8, xh = Math.max(...U.sd) * (ex ? 1.7 : 1.18), yl = mlo - (ex ? 0.03 : 0.012), yh = mhi + (ex ? 0.045 : 0.012);
            L.setView([xl, xh], [yl, yh]); L.setTicks(ptk(xl, xh, 0.05), ptk(yl, yh, ex ? 0.04 : 0.01)); cache.yl = yl; cache.yh = yh; }
          for (const [a, b] of pts) L.dot(a, b, { r: 1.4, color: 'muted', alpha: 0.35 });
          if (ex) {
            const m0 = F.b / F.a, up = [], dn = [];
            for (let q = 0; q <= 120; q++) { const m = m0 + (q / 120) * (cache.yh - m0), m2 = m0 - (q / 120) * (m0 - cache.yl); up.push([frontierSd(F, m), m]); dn.push([frontierSd(F, m2), m2]); }
            L.path(up, { color: 'accent', width: 2.8 }); L.path(dn, { color: 'accent', width: 1.6, dash: [6, 4] });
          }
          L.path(lf.map((p) => [p.sd, p.E]), { color: 'green', width: 3 });
          U.sd.forEach((s, i) => { L.dot(s, U.mu[i], { r: 5, color: 'ink' }); L.text(U.names[i], s, U.mu[i], { dx: 8, dy: -3, align: 'left', size: 11.5, color: 'ink', weight: 700 }); });
          const E = clamp(target.y, cache.eLo, cache.eHi); target.set(cache.sdAt(E), E);
          const w = ex ? frontierWeights(F, E) : minVarLong(E, U.mu, U.S) || U.mu.map(() => 0);
          W.bars(w, { x0: 1, dx: 1, color: (x) => (x < 0 ? 'red' : 'blue') }); W.hline(0, { color: 'ink', width: 1 });
          W.setTicks(U.names.map((nm, i) => [i + 1, nm]), null);
          // none of the random portfolios should beat the frontier
          let worst = Infinity; for (const [a, b] of pts) worst = Math.min(worst, a - (ex ? (b >= F.b / F.a ? frontierSd(F, b) : frontierSd(F, b)) : (b < lf[0].E ? lf[0].sd : interp(b))));
          cache.st = { E, sd: cache.sdAt(E), w, worst, ex, gmv: ex ? 1 / Math.sqrt(F.a) : lf[0].sd };
        });
        v.legend([['green', 'long-only efficient frontier'], ['accent', 'with short sales (hyperbola)'], ['muted', 'random long-only portfolios'], ['gold', 'selected portfolio', { dot: true }]]);
        v.readout(() => { const s = cache.st; return `mean ${pct(s.E, 2)} at the least risk ${pct(s.sd, 2)}${s.ex ? ' (shorting allowed)' : ' (long only)'} · weights ${s.w.map((x) => fx(100 * x, 0) + '%').join(' / ')} · minimum-variance risk ${pct(s.gmv, 2)} · closest of the 2,500 random portfolios to the frontier: ${fx(100 * s.worst, 2)} points of σ to its right`; });
      },
    },
  ],
};
