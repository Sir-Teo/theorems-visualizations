// Finance — Chapter 4: CAPM, factors and anomalies (items 4.7–4.12; 4.1–4.6 are in ch04.js)
//
// Real data (Kenneth R. French's Data Library, CRSP; see ch04.shared.js): 4.7 (25 size/book-to-market portfolios and the factors),
// 4.8 (ten beta-sorted portfolios), 4.10 (momentum factor and ten prior-return portfolios). 4.9, 4.11 and 4.12 are models and
// reconstructions: 4.9 a simulated universe, 4.11 historical reference means (original Mehra–Prescott Table I),
// an explicitly separate lognormal model (Mehra 2003) and Gaussian loss-aversion toy; 4.12 a modern-notation rebuild of
// Sharpe's Figures 8 and 9 (read from the original article; the paper's scatter is itself schematic).
import { clamp, pct, fx, sg, pctTicks, data, monthLabel, idxOf, mean, sdev, solveLin, invert, matVec, dot, ols, excess, ann, fanLabels, fmtBig, frontierConsts, frontierSd, frontierWeights, tangency, covRho, quad, rng, BETA_NAMES } from './ch04.shared.js';
import { PREMIUM_REFERENCE, premiumScenario, prospectValue, prospectHorizon } from './source-audit-factor-premium.js';

export default {
  collection: 'fin',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'The Fama–French three-factor model',
      statement: String.raw`Fama and French (1993) regress monthly excess portfolio returns on the excess market return and two traded long–short returns, **SMB** (small minus big) and **HML** (high minus low book-to-market):
$$\begin{aligned}r_i-r_f&=\alpha_i+b_i(r_M-r_f)\\&\quad+s_i\,\mathrm{SMB}+h_i\,\mathrm{HML}+\varepsilon_i.\end{aligned}$$
The pricing hypothesis is that the population intercepts are zero. A fitted regression with an intercept is descriptive; it does not itself establish that hypothesis.

The factors use six value-weighted size × book-to-market portfolios formed each June. Size is split at the NYSE median; book-to-market at the 30th and 70th NYSE percentiles. SMB averages the three small portfolios minus the three big ones. HML averages the two high-book-to-market portfolios minus the two low ones. These are **returns**, while $b_i,s_i,h_i$ are loadings, rather than the stock's size or book-to-market characteristic.

Scope: an empirical model. The original paper studies stocks **and bonds**, with two further bond factors; this page isolates its three stock factors and 25 size × book-to-market stock portfolios. It does not identify why the factors earn their sample average returns.`,
      idea: String.raw`Portfolios with different SMB and HML loadings share return variation that a market-only regression misses. The heatmaps compare the intercepts left after fitting the market with those left after fitting all three factors. Smaller average absolute alphas can be useful, but in-sample $R^2$ necessarily weakly increases when regressors are added. Neither statistic is a joint pricing test or out-of-sample evidence. The original paper's joint tests also reject its three-factor specification at about the 5% level for the combined stock/bond set, despite its useful fit (section 5.3).`,
      caption: String.raw`**Empirical data**, not simulations: 25 value-weighted French-library portfolios, July 1963–August 2026, pinned to the 202608 CRSP release. Each row is a size quintile, smallest at the top; columns run from low (growth) to high (value) book-to-market. The 25 portfolios use independent NYSE **quintile** breakpoints, distinct from the factors' 2 × 3 construction. Portfolio monthly returns are rounded to 0.01 percentage point in the embedded data.

**Alphas:** the left/right panels fit CAPM/three factors with an intercept. Numbers are **12 × the monthly intercept**, in percentage points per year, without compounding. **Loadings:** the panels show $s_i$ and $h_i$. Both panels share the symmetric color scale reported below; the scale adapts to the selected window and view. The 1963–1991 window uses today's revised data, so it is not an exact reproduction of the original paper's vintage. The later window refits loadings and intercepts on that same window; it does not apply coefficients estimated before 1992.`,
      deps: ['fin-4.6'],
      refs: ['Fama & French (1993), §§2–3 and 5.3', 'French Data Library: factor and 25-portfolio descriptions'],
      tags: ['factor models', 'size', 'value'],
      credit: 'Eugene F. Fama & Kenneth R. French, 1993',
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fama%E2%80%93French_three-factor_model', doi: 'https://doi.org/10.1016/0304-405X(93)90023-5' },
      viz(v) {
        const D = data(), n = D.n, K = 25;
        const per = v.select('period', ['Jul 1963–Dec 1991', 'Jan 1992–Aug 2026', 'Jul 1963–Aug 2026'], 'Jul 1963–Dec 1991');
        const view = v.select('show', ['alphas', 'factor loadings'], 'alphas');
        const mk = (title) => v.stage({ x: [-1.25, 5.1], y: [-0.6, 5.45], equal: true, axes: false, height: 330, weight: 1, minWidth: 270, title });
        const A = mk('CAPM'), B = mk('three-factor model');
        const ex = D.p25.map((p) => excess(p, D.rf));
        const cache = {};
        const regs = (p) => {
          if (cache[p]) return cache[p];
          const [i0, i1] = p === 'Jul 1963–Dec 1991' ? [0, 342] : p === 'Jan 1992–Aug 2026' ? [342, n] : [0, n];
          const c = ex.map((y) => ({ c1: ols(y, [D.mkt], i0, i1), c3: ols(y, [D.mkt, D.smb, D.hml], i0, i1) }));
          return (cache[p] = { c, i0, i1 });
        };
        const cell = (S, i, j, val, t, txt) => {
          S.rect(j, 4 - i, j + 0.96, 5 - i - 0.04, { fill: v.diverge(clamp(t, -1, 1)), fillAlpha: 1, color: 'faint', width: 0.5 });
          S.text(txt, j + 0.48, 4.5 - i, { align: 'center', baseline: 'middle', size: 11.5, color: 'ink', weight: 700 });
        };
        const frame = (S, ttl) => {
          ['small', '2', '3', '4', 'big'].forEach((l, i) => S.text(l, -0.08, 4.5 - i, { align: 'right', baseline: 'middle', size: 11, color: 'muted' }));
          ['low B/M', '2', '3', '4', 'high'].forEach((l, j) => S.text(l, j + 0.48, -0.25, { align: 'center', size: 11, color: 'muted' }));
          S.text('size ↓', -1.2, 5.3, { align: 'left', size: 10.5, color: 'muted' }); S.text(ttl, 5.05, 5.3, { align: 'right', size: 10.5, color: 'muted' });
        };
        let st = null;
        v.render(() => {
          const { c, i0, i1 } = regs(per.value), loads = view.value === 'factor loadings';
          const vals = c.flatMap((q) => loads ? [q.c3.b[2], q.c3.b[3]] : [12 * q.c1.b[0], 12 * q.c3.b[0]]);
          const unit = loads ? 0.25 : 0.02, scale = Math.max(unit, Math.ceil(Math.max(...vals.map(Math.abs)) / unit) * unit);
          let s1 = 0, s3 = 0, r1 = 0, r3 = 0;
          for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
            const k = a * 5 + b, q = c[k];
            const al1 = 12 * q.c1.b[0], al3 = 12 * q.c3.b[0];
            s1 += Math.abs(al1); s3 += Math.abs(al3); r1 += q.c1.r2; r3 += q.c3.r2;
            if (!loads) { cell(A, a, b, al1, al1 / scale, sg(100 * al1, 1)); cell(B, a, b, al3, al3 / scale, sg(100 * al3, 1)); }
            else { const sl = q.c3.b[2], hl = q.c3.b[3]; cell(A, a, b, sl, sl / scale, fx(sl, 2)); cell(B, a, b, hl, hl / scale, fx(hl, 2)); }
          }
          frame(A, loads ? 'SMB loading' : '12 × monthly α, pp'); frame(B, loads ? 'HML loading' : '12 × monthly α, pp');
          A.setTitle(loads ? 'size loading $s_i$ (three-factor regression)' : 'CAPM: 12 × monthly alpha (pp)'); B.setTitle(loads ? 'value loading $h_i$ (three-factor regression)' : 'three factors: 12 × monthly alpha (pp)');
          st = { s1: s1 / K, s3: s3 / K, r1: r1 / K, r3: r3 / K, i0, i1, tl1: 12 * c[0].c1.b[0], tl3: 12 * c[0].c3.b[0], th1: 12 * c[4].c1.b[0], th3: 12 * c[4].c3.b[0], premS: 12 * mean(D.smb, i0, i1), premH: 12 * mean(D.hml, i0, i1), loads, scale };
        });
        v.legend([['blue', 'negative', { area: true }], ['red', 'positive', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `${monthLabel(st.i0)} – ${monthLabel(st.i1 - 1)}: average |12 × monthly alpha| ${fx(100 * st.s1, 2)} pp (CAPM) → ${fx(100 * st.s3, 2)} pp (three factors); average $R^2$ ${fx(st.r1, 2)} → ${fx(st.r3, 2)}\nsmall growth: ${sg(100 * st.tl1, 1)} → ${sg(100 * st.tl3, 1)} pp; small value: ${sg(100 * st.th1, 1)} → ${sg(100 * st.th3, 1)} pp; factor sample means × 12: SMB ${sg(100 * st.premS, 1)} pp, HML ${sg(100 * st.premH, 1)} pp\ncolor range: ±${st.loads ? fx(st.scale, 2) + ' loading units' : fx(100 * st.scale, 1) + ' pp'}; common to both panels, changes with window/view. In-sample summaries; no joint alpha test is performed.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'The security market line is too flat',
      statement: String.raw`In U.S. data, portfolios formed on past beta have average excess returns that rise with beta by much **less** than the CAPM predicts: the fitted line through (beta, average excess return) has a slope below the market premium and a positive intercept, so low-beta portfolios earn a positive alpha and the highest-beta portfolios a negative one. Black, Jensen and Scholes (1972) were the first to report this pattern for 1926–1965; later studies find it in many periods and markets, and it is now called the **low-beta anomaly**. It is not a mathematical result: the size of the effect varies with the sample period, and it is weak or absent in some subperiods.

Scope: U.S. equities in the sample shown; the explanation (borrowing constraints, benchmarking, lottery preferences, or a mismeasured proxy for the market, fin-4.9) is debated.`,
      idea: String.raw`The CAPM (fin-4.2) predicts that the line through the average returns of portfolios sorted on beta has intercept $r_f$ and slope $E[r_M]-r_f$. Sorting stocks into ten portfolios on past beta spreads realised betas from roughly 0.6 to 1.6 and gives a clean test of that line (the method of Black–Jensen–Scholes and Fama–MacBeth). In the data the line is flatter: Black (1972) showed that if investors cannot borrow at the riskless rate, the line is flatter with a higher intercept (the zero-beta CAPM), but the flat slope also appears when the proxy for the market portfolio is not efficient (fin-4.9), so the evidence cannot separate the two.`,
      caption: String.raw`Ten value-weighted portfolios formed each June on estimated beta (French data library, from 1963). **Left**: each decile's realised beta (a regression on the market over your window) against its average excess return. The green line is the CAPM, through the origin with the market premium as slope; the orange line is the least-squares line through the ten points. **Right**: the alpha of each decile with ±2 standard errors. Slide the **window** and compare: in the full sample the high-beta deciles fall below the green line and the low-beta ones above; in other windows the pattern is weaker, and with only a few years the errors swamp everything. The ranking uses each year's past-60-month beta, the plotted beta is the realised one over your window.`,
      deps: ['fin-4.2'],
      refs: ['BKM ch. 13'],
      tags: ['anomalies', 'beta', 'CAPM tests'],
      credit: 'Black, Jensen & Scholes, 1972; Black, 1972',
      scope: String.raw`Beta-sorted U.S. stock portfolios, 1963 onward (the data library's series); the low-beta pattern is time-varying.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Low-volatility_anomaly' },
      viz(v) {
        const D = data(), n = D.n;
        const y0 = v.slider('window starts', 1963, 2020, 1963, { int: true, fmt: (x) => String(x) });
        const len = v.slider('length (years)', 5, 64, 64, { int: true });
        const L = v.stage({ x: [0.4, 1.8], y: [0, 0.16], axes: 'box', gutter: true, height: 340, weight: 1.15, minWidth: 290, xlabel: 'realised beta', ylabel: 'average excess return (a year)', yticks: pctTicks(0, 0.15, 0.05), title: 'beta-sorted portfolios against the CAPM' });
        const R = v.stage({ x: [0.4, 10.6], y: [-0.06, 0.06], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'beta decile (1 = lowest estimated beta)', ylabel: 'alpha (a year)', xticks: BETA_NAMES.map((_, i) => [i + 1, String(i + 1)]), yticks: pctTicks(-0.06, 0.06, 0.03), title: 'alpha by decile' });
        let st = null;
        v.render(() => {
          const i0 = clamp(idxOf(y0.value, 1), 0, n - 60), i1 = Math.min(n, i0 + len.value * 12), prem = 12 * mean(D.mkt, i0, i1);
          const rows = D.beta.map((p, j) => { const y = excess(p, D.rf), r = ols(y, [D.mkt], i0, i1); return { beta: r.b[1], er: 12 * mean(y, i0, i1), a: 12 * r.b[0], se: 12 * r.se[0], t: r.t[0] }; });
          const reg = ols(Float64Array.from(rows.map((r) => r.er)), [Float64Array.from(rows.map((r) => r.beta))]);
          const top = Math.max(0.16, ...rows.map((r) => r.er)) * 1.1, bl = Math.min(0.4, ...rows.map((r) => r.beta) ) - 0.05, bh = Math.max(1.8, ...rows.map((r) => r.beta)) + 0.05;
          L.setView([bl, bh], [Math.min(0, ...rows.map((r) => r.er)) * 1.1, top]);
          L.line(bl, bl * prem, bh, bh * prem, { color: 'green', width: 2.4 });
          L.text('CAPM', bh, bh * prem, { dx: -4, dy: 14, align: 'right', size: 11.5, color: 'green', weight: 700 });
          L.line(bl, reg.b[0] + reg.b[1] * bl, bh, reg.b[0] + reg.b[1] * bh, { color: 'orange', width: 2.2, dash: true });
          rows.forEach((r, j) => { L.dot(r.beta, r.er, { r: 5.5, color: j < 3 ? 'blue' : j > 6 ? 'red' : 'accent' }); L.text(String(j + 1), r.beta, r.er, { dx: -7, dy: -6, align: 'right', size: 10.5, color: 'muted', weight: 700 }); });
          const mx = Math.max(0.06, ...rows.map((r) => Math.abs(r.a) + 2 * r.se)) * 1.1; R.setView([0.4, 10.6], [-mx, mx]);
          rows.forEach((r, j) => { R.rect(j + 1 - 0.32, 0, j + 1 + 0.32, r.a, { fill: r.a >= 0 ? 'blue' : 'red', fillAlpha: 0.65, color: r.a >= 0 ? 'blue' : 'red', width: 1 }); R.line(j + 1, r.a - 2 * r.se, j + 1, r.a + 2 * r.se, { color: 'ink', width: 1.4 }); });
          R.hline(0, { color: 'muted', width: 1 });
          st = { rows, reg, prem, i0, i1 };
        });
        v.legend([['green', 'CAPM line (slope = market premium)'], ['orange', 'fitted line through the ten points', { dash: true }], ['blue', 'low-beta deciles / positive alpha', { dot: true }], ['red', 'high-beta deciles / negative alpha', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { rows, reg, prem } = st;
          return `${monthLabel(st.i0)} – ${monthLabel(st.i1 - 1)}: market premium ${pct(prem, 1)} a year; fitted line: intercept ${pct(reg.b[0], 1)}, slope ${pct(reg.b[1], 1)} per unit of beta (CAPM: intercept 0, slope ${pct(prem, 1)}) — ${reg.b[1] < prem ? '**flatter than the CAPM**' : '**not flatter in this window**'}\nlowest-beta decile: β ${fx(rows[0].beta, 2)}, alpha ${sg(100 * rows[0].a, 1)}% (t = ${fx(rows[0].t, 1)}); highest: β ${fx(rows[9].beta, 2)}, alpha ${sg(100 * rows[9].a, 1)}% (t = ${fx(rows[9].t, 1)})`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Paradox',
      name: 'Roll’s critique',
      statement: String.raw`Let $r_p$ be the return on **any** portfolio $p$ that is mean–variance efficient (for risky assets alone). Then for every asset $i$, exactly,
$$E[r_i]=\lambda_0+\beta_{ip}\bigl(E[r_p]-\lambda_0\bigr),\qquad \beta_{ip}=\frac{\operatorname{Cov}(r_i,r_p)}{\operatorname{Var}(r_p)},$$
where $\lambda_0$ is the expected return of the zero-beta portfolio of $p$. So a perfect linear fit of average returns on betas is a property of mean–variance efficiency of the proxy, not evidence about the CAPM. Conversely, if the proxy is **not** efficient the fit is generally imperfect and may show any slope. Since the true market portfolio contains every asset (human capital, real estate, …) and is not observable, Roll (1977) concludes that the CAPM — whose only testable implication is that the market portfolio is efficient — has not been tested, and that tests using a stock index test the index.

Scope: a statement about tests of a single-period, one-factor theory; it does not say the CAPM is false.`,
      idea: String.raw`Efficiency of $p$ means $p$ solves a minimum-variance problem; its first-order condition, $\mu-\lambda_0\mathbf 1=\gamma\Sigma w_p$ for some $\gamma$, rewrites as $\mu_i-\lambda_0=\beta_{ip}(\mu_p-\lambda_0)$ after dividing by $w_p^\top\Sigma w_p$. The relation is therefore equivalent to efficiency: it holds for every efficient portfolio (whose zero-beta rate $\lambda_0$ then equals $r_f$ only for the tangency portfolio). A researcher who regresses average returns on betas computed against a proxy gets $R^2=1$ if the proxy is efficient and some lower fit otherwise, but cannot know whether the proxy represents the market. Hence the apparent failures of the CAPM (fin-4.8) may be failures of the proxy.`,
      caption: String.raw`A simulated universe of eight assets (invented means, volatilities and correlations; their capitalisation weights are *not* the efficient ones). **Left**: the mean–variance plane with the frontier and the **proxy** portfolio (gold). **Right**: expected return against beta with respect to the proxy; the orange line is the fitted line, the green line the CAPM with the riskless rate. Start with the proxy **efficient** ($t=0$): all eight assets fall on one line ($R^2=1$) — whatever its expected return, but the line passes through $r_f$ only for the tangency portfolio (press the button). Then slide **toward the cap-weighted index** (inefficient): the fit breaks, the slope and intercept change, and "the CAPM fails" would be the verdict although nothing but the proxy changed.`,
      deps: ['fin-4.2'],
      refs: ['BKM ch. 13'],
      tags: ['CAPM tests', 'efficiency', 'proxy'],
      credit: 'Richard Roll, 1977',
      scope: String.raw`A claim about testability: it applies to tests of the CAPM against an observable proxy for the market portfolio.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Roll%27s_critique' },
      viz(v) {
        const MU = [0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.065, 0.11], SD = [0.15, 0.18, 0.20, 0.22, 0.26, 0.30, 0.24, 0.34];
        const CAP = [0.20, 0.18, 0.15, 0.12, 0.10, 0.10, 0.08, 0.07], c = [0.6, 0.65, 0.7, 0.6, 0.7, 0.75, 0.45, 0.65], grp = [0, 0, 1, 1, 2, 2, 0, 2];
        const R = c.map((ci, i) => c.map((cj, j) => (i === j ? 1 : ci * cj + (grp[i] === grp[j] ? 0.25 : 0))));
        const S = covRho(SD, R), F = frontierConsts(MU, S), RF = 0.02;
        const T0 = tangency(MU, S, RF), muT = dot(T0, MU);
        const mS = v.slider('expected return of the efficient portfolio', 0.05, 0.12, 0.08, { step: 0.0005, fmt: (x) => pct(x, 2) });
        const tS = v.slider('towards the cap-weighted index', 0, 1, 0, { step: 0.01, fmt: (x) => fx(x, 2) });
        v.button('efficient proxy = tangency', () => { mS.set(muT); tS.set(0); });
        const Pl = v.stage({ x: [0, 0.45], y: [0, 0.16], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 290, xlabel: 'risk σ', ylabel: 'expected return', xticks: pctTicks(0, 0.4, 0.1), yticks: pctTicks(0, 0.15, 0.05), title: 'the assets, the frontier and the proxy' });
        const Bt = v.stage({ x: [0, 1.7], y: [0, 0.16], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'beta against the proxy', ylabel: 'expected return', yticks: pctTicks(0, 0.15, 0.05), title: 'expected return against beta' });
        let st = null;
        v.render(() => {
          const we = frontierWeights(F, mS.value), t = tS.value, w = we.map((x, i) => (1 - t) * x + t * CAP[i]);
          const Sw = matVec(S, w), vp = dot(w, Sw), mp = dot(w, MU), sp = Math.sqrt(vp), beta = Sw.map((x) => x / vp);
          const m0 = F.b / F.a;
          for (const sgn of [1, -1]) { const pts = []; for (let k = 0; k <= 160; k++) { const m = m0 + sgn * (k / 160) * 0.2; pts.push([frontierSd(F, m), m]); } Pl.path(pts, { color: sgn > 0 ? 'accent' : 'muted', width: sgn > 0 ? 2.4 : 1.2 }); }
          SD.forEach((s, i) => { Pl.dot(s, MU[i], { r: 4, color: 'muted' }); });
          Pl.dot(0, RF, { r: 4.5, color: 'ink' }); Pl.text('$r_f$', 0.01, RF, { dx: 4, dy: 12, align: 'left', size: 11.5, color: 'muted' });
          Pl.line(0, RF, 0.45, RF + ((muT - RF) / Math.sqrt(quad(T0, S))) * 0.45, { color: 'green', width: 1.6, dash: true });
          Pl.dot(sp, mp, { r: 7, color: 'gold' }); Pl.text('proxy', sp, mp, { dx: 9, dy: 12, align: 'left', size: 12, color: 'gold', weight: 700 });
          Pl.dot(Math.sqrt(quad(CAP, S)), dot(CAP, MU), { r: 5, color: 'orange', hollow: true });
          // cross-section
          const reg = ols(Float64Array.from(MU), [Float64Array.from(beta)]);
          Bt.line(0, RF, 1.7, RF + 1.7 * (mp - RF), { color: 'green', width: 2.2 });
          Bt.line(0, reg.b[0], 1.7, reg.b[0] + reg.b[1] * 1.7, { color: 'orange', width: 2.2, dash: true });
          beta.forEach((b, i) => { Bt.dot(b, MU[i], { r: 5, color: 'accent' }); });
          Bt.dot(1, mp, { r: 6, color: 'gold' });
          st = { reg, mp, beta, eff: t < 1e-9 };
        });
        v.legend([['accent', 'frontier / assets', { dot: true }], ['gold', 'proxy for the market', { dot: true }], ['orange', 'hollow ring: the cap-weighted index', { dot: true }], ['green', 'CAPM line with the riskless rate'], ['orange', 'fitted line', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { reg, mp } = st;
          return `proxy ${st.eff ? '**efficient**' : 'inefficient'}: $R^2$ of the cross-section = ${fx(reg.r2, 4)}; fitted intercept ${pct(reg.b[0], 2)} (r_f = ${pct(0.02, 2)}), slope ${pct(reg.b[1], 2)} against the proxy's premium ${pct(mp - 0.02, 2)}\n${st.eff ? 'every asset is on one straight line — the line the CAPM would call "the SML" if the intercept equalled the riskless rate' : 'the same eight assets, with unchanged means and covariances, no longer line up — only the proxy changed'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'The momentum anomaly',
      statement: String.raw`Stocks that have done well over the past 3 to 12 months tend to keep outperforming stocks that have done badly over the following months. A **momentum** strategy buys the winners and sells the losers (for instance, each month: buy the top decile of returns over months $t-12$ to $t-2$ and sell the bottom decile, skipping the most recent month). In U.S. data the long–short return averages several percent a year with a high Sharpe ratio, it is not explained by the market beta or by the three Fama–French factors (fin-4.7), and it suffers rare, severe losses (the "momentum crashes", typically right after market crashes when losers rebound).

Scope: a robust empirical regularity in many markets and periods first documented by Jegadeesh and Titman (1993); its size varies over time and its cause (underreaction, risk, limits to arbitrage) is debated.`,
      idea: String.raw`Given that prices should follow no pattern if markets are efficient, a profitable rule on past prices contradicts the weak form of the efficient-markets hypothesis. Jegadeesh and Titman (1993) showed that buying winners and selling losers over holding periods of 3 to 12 months earned significant profits, not explained by market risk. A decade-sorted table of average returns by past return (right panel) is the cleanest display: returns rise almost monotonically with past performance. The strategy's return distribution has a long left tail: after market declines the past losers have high betas and rebound fast, which produces the crashes (Daniel and Moskowitz, 2016, show this in 1932 and again after 2009).`,
      caption: String.raw`Real data (French data library, 1927 onward): **left**, the growth of one dollar in the value-weighted decile of past winners (green) and past losers (red), and in the momentum factor (winners minus losers, accent) — on a log axis, with the **five worst months** of the momentum factor in your window marked (the three worst are labelled). The factor is a long–short return series, compounded here as if each month were an investment of one dollar; all returns are before trading costs. **Right**: the average return of each of the ten prior-return deciles, annualised. Slide the **window** to see the era-dependence of the effect (it is weaker after the 1990s) and what a single crash does to a long-short record.`,
      deps: ['fin-4.7'],
      refs: ['BKM ch. 11'],
      tags: ['anomalies', 'momentum', 'market efficiency'],
      credit: 'Jegadeesh & Titman, 1993',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Momentum_(finance)' },
      viz(v) {
        const D = data(), N = D.nMom, mom = D.mom, B0 = [1927, 1];
        const y0 = v.slider('window starts', 1927, 2018, 1927, { int: true, fmt: (x) => String(x) });
        const y1 = v.slider('window ends', 1935, 2026, 2026, { int: true, fmt: (x) => String(x) });
        const lg = v.toggle('log axis', true);
        const L = v.stage({ x: [1927, 2027], y: [0.1, 1000], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 300, xlabel: 'year', ylabel: 'growth of one dollar', title: 'winners, losers and the momentum factor' });
        const R = v.stage({ x: [0.4, 10.6], y: [0, 0.25], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'decile of prior return (1 = losers)', ylabel: 'average return (a year)', xticks: Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1)]), yticks: pctTicks(0, 0.25, 0.05), title: 'return by prior-return decile' });
        let st = null;
        v.render(() => {
          const a = idxOf(y0.value, 1, ...B0), b = Math.min(N, Math.max(a + 24, idxOf(y1.value, 12, ...B0) + 1));
          const series = [D.pri[0], D.pri[9], mom], cols = ['red', 'green', 'accent'], paths = [];
          let lo = Infinity, hi = 0;
          series.forEach((s) => { let w = 1; const pts = [[1927 + (a - 0.5) / 12 + 0, 1]]; for (let i = a; i < b; i++) { w *= 1 + s[i]; pts.push([1927 + (i + 0.5) / 12, w]); lo = Math.min(lo, w); hi = Math.max(hi, w); } paths.push(pts); });
          L.setScale({ ylog: lg.value, x: [1927 + a / 12 - 1, 1927 + b / 12 + 1], y: lg.value ? [Math.min(0.5, lo * 0.8), hi * 1.3] : [0, hi * 1.05] });
          paths.forEach((p, i) => L.path(p, { color: cols[i], width: i === 2 ? 2.6 : 1.8 }));
          const idx = []; for (let i = a; i < b; i++) idx.push(i); idx.sort((p, q) => mom[p] - mom[q]);
          const worst = idx.slice(0, 5);
          worst.forEach((i) => { L.dot(1927 + (i + 0.5) / 12, paths[2][i - a + 1][1], { r: 5, color: 'gold' }); });
          fanLabels(L, worst.slice(0, 3).map((i) => ({ x: 1927 + (i + 0.5) / 12, y: paths[2][i - a + 1][1], text: `${monthLabel(i, ...B0)}: ${fx(100 * mom[i], 0)}%`, color: v.color('ink') })), { w: 110, h: 14, dx: 10, dy: 16, leader: v.color('faint'), size: 10.5 });
          const dec = D.pri.map((p) => 12 * mean(p, a, b));
          R.setView([0.4, 10.6], [Math.min(0, ...dec) * 1.1, Math.max(0.12, ...dec) * 1.15]);
          dec.forEach((d, j) => R.rect(j + 1 - 0.34, 0, j + 1 + 0.34, d, { fill: j === 0 ? 'red' : j === 9 ? 'green' : 'accent', fillAlpha: 0.7, color: j === 0 ? 'red' : j === 9 ? 'green' : 'accent', width: 1 }));
          R.hline(0, { color: 'muted', width: 1 });
          const m = mean(mom, a, b), s = sdev(mom, a, b); let sk = 0; for (let i = a; i < b; i++) sk += ((mom[i] - m) / s) ** 3; sk /= b - a;
          st = { a, b, mean: 12 * m, sd: Math.sqrt(12) * s, sk, worst, end: paths.map((p) => p[p.length - 1][1]), dec };
        });
        v.legend([['red', 'past losers (decile 1)'], ['green', 'past winners (decile 10)'], ['accent', 'winners minus losers (momentum factor)'], ['gold', 'five worst months of the factor', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `${monthLabel(st.a, ...B0)} – ${monthLabel(st.b - 1, ...B0)}: momentum factor ${pct(st.mean, 1)} a year with volatility ${pct(st.sd, 1)} (ratio ${fx(st.mean / st.sd, 2)}), skewness ${fx(st.sk, 1)}; \\$1 grows to ${fmtBig(st.end[2])} in the factor, ${fmtBig(st.end[1])} in winners and ${fmtBig(st.end[0])} in losers (before costs; a long–short series compounded as if each month were an investment of \\$1)\nworst month ${monthLabel(st.worst[0], ...B0)} (${fx(100 * mom[st.worst[0]], 1)}%); decile averages run from ${pct(st.dec[0], 1)} (losers) to ${pct(st.dec[9], 1)} (winners)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'The equity premium puzzle',
      statement: String.raw`Mehra and Prescott (1985, Table I) report **arithmetic mean annual real returns** of 6.98% on their S&P composite series and 0.80% on relatively riskless short-term securities over 1889–1978: a difference of 6.18 percentage points. The latter series includes commercial paper before 1920 and is not an observed perfectly riskless real bond. Their original equilibrium calculation uses a two-state Markov consumption process. The plots here use the separate **i.i.d. joint-lognormal illustration** developed in Mehra's 2003 retrospective.

Let $g=\ln(C_{t+1}/C_t)$ and $r_e=\ln R_e$ be jointly normal, and let the representative investor's stochastic discount factor be $m=\beta e^{-\gamma g}$. Applying the normal moment-generating function (prob-2.7.1a) to $E[mR_e]=1$ and $R_f=1/E[m]$ gives
$$\kappa\equiv\ln E[R_e]-\ln R_f,$$
$$\kappa=\gamma\operatorname{Cov}(g,r_e)=\gamma\rho\sigma_g\sigma_e,$$
$$\ln R_f=-\ln\beta+\gamma\mu_g-\tfrac12\gamma^2\sigma_g^2.$$
For a perpetual unlevered claim on i.i.d. consumption, $r_e$ differs from $g$ by a constant, so $\kappa=\gamma\sigma_g^2$. A positive finite claim price additionally requires $q=\beta E[(C_{t+1}/C_t)^{1-\gamma}]<1$. These identities concern **logs of expected gross returns**; 6.18 percentage points is converted to $\ln(1.0698/1.008)$ before fitting $\gamma$.

Scope: a puzzle for a specified model and historical sample. The chosen correlation and stock log-volatility are scenarios; the general jointly normal asset is not a reconstruction of the original pure-exchange equilibrium.`,
      idea: String.raw`Smooth consumption makes its covariance with stock returns small. A large premium then requires substantial risk aversion. The same preferences also price the riskless bond, so fitting the premium alone need not fit the riskless rate. The green band marks $0\le\gamma\le10$, the range used in Mehra–Prescott's original model search, rather than a universal bound on preferences.

Benartzi and Thaler (1995) combine loss aversion with frequent evaluation: aggregating gains over a longer evaluation period can make a risky investment more attractive. Their original simulations bootstrap CRSP stock, bond and bill returns and use cumulative probability weights. The right panel instead shows the explicitly specified Gaussian, ordinary-probability teaching model below. Its crossing is a model output, not their estimated evaluation period.`,
      caption: String.raw`**Left:** log premium $\kappa$ against risk aversion, with your chosen covariance (accent) and an unlevered consumption claim (orange). The dashed target converts your arithmetic premium using the historical 0.80% reference rate. Both fitted $\gamma$ values remain in view. Orange is solid where the perpetual claim has a positive finite price ($q<1$), and dashed where it is only a formal identity; the hollow fit is explicitly classified below. **Middle:** the **simple** riskless rate $R_f-1$; the red dot uses the actual covariance-fitted $\gamma$. Lognormal consumption matches an arithmetic growth mean of 1.8% and the selected growth standard deviation (Mehra 2003's rounded baseline); it uses $\sigma_g^2=\ln[1+(s_C/1.018)^2]$ and $\mu_g=\ln1.018-\sigma_g^2/2$.

**Right:** choose a separate Gaussian gain volatility $s_X$ for $X_h=\pi h+s_X\sqrt h Z$, $Z\sim N(0,1)$, and plot $E[v(X_h)]$, where $v(x)=x^\alpha$ for gains and $-\lambda(-x)^\alpha$ for losses. There is no compounding or probability weighting; this is not a full prospect-theory asset-pricing model. The default $\alpha=0.88$, $\lambda=2.25$ are the value-function parameters used by Benartzi–Thaler (p. 79). A longer evaluation period means looking **less frequently**; it differs from the investor's planning horizon.`,
      deps: ['behav-1.7', 'behav-2.12', 'prob-1.2.5', 'prob-2.7.1a'],
      refs: ['Mehra & Prescott (1985), Table I and §§3–4', 'Mehra (2003), NBER w9525, pp. 23–28', 'Benartzi & Thaler (1995), pp. 79–84'],
      tags: ['equity premium', 'risk aversion', 'behavioral finance'],
      credit: 'Rajnish Mehra & Edward C. Prescott, 1985',
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equity_premium_puzzle', doi: 'https://doi.org/10.1016/0304-3932(85)90061-3' },
      viz(v) {
        const pS = v.slider('target arithmetic premium (percentage points)', 0.02, 0.10, 0.0618, { step: 0.0001, fmt: (x) => `${fx(100 * x, 2)} pp` });
        const sc = v.slider('consumption growth standard deviation $s_C$', 0.015, 0.06, 0.036, { step: 0.0005, fmt: (x) => pct(x, 1) });
        const se = v.slider('stock log-volatility $\\sigma_e$ (scenario)', 0.10, 0.30, 0.20, { step: 0.005, fmt: (x) => pct(x, 0) });
        const rho = v.slider('log-growth / log-return correlation $\\rho$', 0.1, 1, 0.3, { step: 0.01 });
        const beta = v.slider('discount factor $\\beta$', 0.9, 1, 0.99, { step: 0.001 });
        const toySd = v.slider('Gaussian gain volatility $s_X$ (separate toy)', 0.10, 0.30, 0.20, { step: 0.005, fmt: (x) => pct(x, 0) });
        const lam = v.slider('loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const alp = v.slider('curvature $\\alpha$', 0.5, 1, 0.88, { step: 0.01 });
        const P = v.stage({ x: [-2, 65], y: [-0.01, 0.15], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'relative risk aversion $\\gamma$', ylabel: 'log premium $\\kappa$ (decimal)', title: 'joint-lognormal pricing identities' });
        const Rf = v.stage({ x: [-2, 65], y: [-1.08, 0.4], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'relative risk aversion $\\gamma$', ylabel: 'simple riskless rate $R_f-1$', title: 'same preferences, riskless bond' });
        const M = v.stage({ x: [0.035, 14], y: [-0.1, 0.1], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'evaluation period $h$ (years)', ylabel: 'expected value (toy units)', title: 'Gaussian loss-aversion toy' });
        let st = null;
        v.render(() => {
          const m = premiumScenario({ premium: pS.value, consumptionSd: sc.value, stockLogSd: se.value, rho: rho.value, beta: beta.value });
          const top = Math.max(m.target, m.maxGamma * m.covariance, m.maxGamma * m.variance);
          const xrange = [-0.065 * m.maxGamma, 1.065 * m.maxGamma];
          P.setView(xrange, [-0.07 * top, 1.14 * top]);
          P.vband(0, 10, { color: 'green', alpha: 0.1 });
          P.line(0, 0, m.maxGamma, m.maxGamma * m.covariance, { color: 'accent', width: 2.4 });
          P.line(0, 0, m.maxGamma, m.maxGamma * m.variance, { color: 'orange', width: 1.5, dash: true });
          const validLo = Math.max(0, m.claimDomain[0]), validHi = Math.min(m.maxGamma, m.claimDomain[1]);
          if (validHi > validLo) P.line(validLo, validLo * m.variance, validHi, validHi * m.variance, { color: 'orange', width: 2.6 });
          P.hline(m.target, { color: 'green', width: 1.6, dash: true });
          P.dot(m.gamma, m.target, { r: 6, color: 'green' });
          P.dot(m.consumptionGamma, m.target, { r: 5, color: 'orange', hollow: true });
          const rmax = Math.max(0.1, m.riskless(m.peakGamma), m.riskless(0), PREMIUM_REFERENCE.riskless);
          Rf.setView(xrange, [-1 - 0.09 * (rmax + 1), rmax + 0.14 * (rmax + 1)]);
          Rf.path(Array.from({ length: 241 }, (_, k) => { const g = m.maxGamma * k / 240; return [g, m.riskless(g)]; }), { color: 'accent', width: 2.4 });
          Rf.hline(PREMIUM_REFERENCE.riskless, { color: 'green', width: 1.6, dash: true }); Rf.hline(0, { color: 'muted', width: 1 });
          Rf.vband(0, 10, { color: 'green', alpha: 0.1 });
          Rf.dot(m.gamma, m.riskless(m.gamma), { r: 6, color: 'red' });
          const hstar = prospectHorizon(pS.value, toySd.value, alp.value, lam.value);
          const pts = Array.from({ length: 101 }, (_, k) => { const h = 0.05 * 200 ** (k / 100); return [h, prospectValue(h, pS.value, toySd.value, alp.value, lam.value)]; });
          const mag = Math.max(1e-6, ...pts.map((p) => Math.abs(p[1]))) * 1.18;
          M.setView([0.035, 14], [-mag, mag]); M.path(pts, { color: 'accent', width: 2.4 }); M.hline(0, { color: 'muted', width: 1 });
          if (hstar >= 0.05 && hstar <= 10) M.dot(hstar, 0, { r: 6, color: 'green' });
          M.vline(1, { color: 'muted', width: 1, dash: true });
          st = { ...m, hstar };
        });
        v.legend([['accent', 'chosen covariance / simple riskless rate / toy value'], ['orange', 'consumption claim: solid admissible, dashed formal extension'], ['green', 'target / historical 0.80% rate; shaded γ ≤ 10', { dash: true }], ['red', 'riskless rate at covariance-fitted γ']]);
        v.readout(() => {
          if (!st) return '';
          const htext = st.hstar === 0 ? 'positive throughout 0.05–10 years (no loss aversion: λ = 1)' : st.hstar < 0.05 ? `positive throughout 0.05–10 years; crossing below 0.6 months` : st.hstar > 10 ? `negative throughout 0.05–10 years; crossing beyond 120 months (${fx(12 * st.hstar, 1)} months)` : `zero at ${fx(12 * st.hstar, 1)} months; negative at shorter evaluation periods and positive at longer ones`;
          return `target ${fx(100 * pS.value, 2)} pp = log premium ${fx(st.target, 5)}; fitted γ = ${fx(st.gamma, 2)} (chosen covariance), ${fx(st.consumptionGamma, 2)} (formal consumption-claim fit: ${st.claimLogDiscount(st.consumptionGamma) < 0 ? 'positive finite price' : 'inadmissible: q ≥ 1'})\nlog consumption mean ${fx(st.logMean, 5)}, log standard deviation ${pct(st.logSd, 3)}; at γ = 10: log premiums ${fx(10 * st.covariance, 5)} / ${fx(10 * st.variance, 5)}, simple riskless rate ${pct(st.riskless(10), 2)}; at fitted γ: ${pct(st.riskless(st.gamma), 2)} (historical reference 0.80%)\nGaussian toy: ${htext}. Evaluation frequency is separate from planning horizon.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Paper',
      name: 'Capital Asset Prices: A Theory of Market Equilibrium',
      paper: { authors: 'William F. Sharpe', year: 1964, title: 'Capital Asset Prices: A Theory of Market Equilibrium under Conditions of Risk', venue: 'Journal of Finance 19 (3): 425–442', doi: '10.1111/j.1540-6261.1964.tb02865.x' },
      introduces: ['fin-4.1', 'fin-4.2'],
      statement: String.raw`Sharpe's paper builds a positive theory of how risky assets are priced. Investors choose portfolios by expected return and standard deviation (the framework of Markowitz and Tobin) and all can lend and borrow at one pure rate of interest $P$; they have common expectations. Then all investors hold combinations of the same efficient risky combination $g$ and the riskless asset, so efficient portfolios lie on a straight line, the **capital market line**, $\sigma_R=s\,(E_R-P)$ in the paper's axes (risk vertical, expected return horizontal). For each asset $i$ in the efficient combination, the slope $B_{ig}$ of the regression of its return on the return of $g$ is linked to its expected return by the straight line "$PQ$",
$$B_{ig}=-\frac{P}{E_{R_g}-P}+\frac{1}{E_{R_g}-P}\,E_{R_i}\quad\Longleftrightarrow\quad E_{R_i}=P+B_{ig}\,(E_{R_g}-P),$$
so assets that respond more to the combination have higher expected returns. Sharpe calls the part of an asset's risk that is correlated with $g$ **systematic** and the rest **unsystematic**; only the first is rewarded. Prices adjust until demand equals supply, and then the relation holds for every asset held in the efficient combination.

Scope: a single-period theory with homogeneous expectations and one lending/borrowing rate; the paper itself is theoretical and tests nothing on data.`,
      idea: String.raw`Before 1964 the textbook treatment of the market price of risk was an assumed constant: Sharpe notes that the usual account of asset pricing takes a premium for risk for granted without deriving it. Tobin (1958) had shown that with a riskless asset the investor's choice splits into a risky combination and a lending-or-borrowing decision, and Markowitz (1952) had the efficient set (fin-3.15). Sharpe added the equilibrium step: if everybody has the same beliefs, everybody holds the same combination $g$, whose returns then must be tangent to the capital market line, and the tangency condition for each asset in $g$ gives the line $PQ$, the security market line of fin-4.2. Lintner (1965) and Mossin (1966) derived equivalent results independently, which is why the model is often called the Sharpe–Lintner(–Mossin) CAPM. Sharpe received the 1990 Nobel Prize in economics, shared with Markowitz and Miller.`,
      caption: String.raw`A rebuild of Sharpe's argument in modern notation with six invented assets (the paper's own figures are schematic and contain no data). **Left**: his axes — expected return horizontal, risk vertical — with the feasible long-only portfolios (cloud), the pure rate $P$ (drag it along the axis) and the tangent line from $P$, the capital market line, touching the efficient combination $g$. **Middle**: his Figure 8: simulated monthly returns of the chosen asset against $R_g$, whose regression slope is $B_{ig}$. **Right**: his Figure 9: each asset's $B_{ig}$ against its expected return; the assets inside $g$ lie on the line $PQ$ from $(P,0)$. Asset 6 starts with a low expected return and is not held in $g$: its point lies off the line. **Drag an asset's expected return** (circles on the right) and the efficient combination reshuffles — assets that drop out of $g$ leave the line, those that enter join it.`,
      deps: ['fin-3.15', 'fin-3.11'],
      refs: [],
      tags: ['CAPM', 'equilibrium', 'asset pricing'],
      credit: 'William F. Sharpe, 1964 (cf. Lintner, 1965; Mossin, 1966)',
      links: { doi: 'https://doi.org/10.1111/j.1540-6261.1964.tb02865.x', wikipedia: 'https://en.wikipedia.org/wiki/Capital_asset_pricing_model' },
      viz(v) {
        const NAMES = ['1', '2', '3', '4', '5', '6'], K = 6, SD = [0.12, 0.16, 0.20, 0.25, 0.30, 0.22], c = [0.5, 0.6, 0.55, 0.6, 0.65, 0.3];
        const R = c.map((ci, i) => c.map((cj, j) => (i === j ? 1 : ci * cj)));
        const S = covRho(SD, R), E0 = [0.07, 0.09, 0.11, 0.13, 0.15, 0.04], col = ['blue', 'orange', 'purple', 'teal', 'pink', 'accent'];
        const Pr = v.slider('pure rate $P$', 0, 0.06, 0.03, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const sel = v.select('asset in Figure 8', NAMES, '4');
        v.button('new sample', () => { seed += 1; });
        let seed = 1;
        const A = v.stage({ x: [0, 0.2], y: [0, 0.34], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 280, xlabel: 'expected rate of return', ylabel: 'risk σ', xticks: pctTicks(0, 0.2, 0.05), yticks: pctTicks(0, 0.3, 0.1), title: 'the capital market line' });
        const F8 = v.stage({ x: [-0.15, 0.15], y: [-0.3, 0.3], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: 'monthly return on $g$', ylabel: 'monthly return on asset $i$', title: 'his Figure 8: $B_{ig}$ as a regression slope' });
        const F9 = v.stage({ x: [0, 0.2], y: [-0.2, 2.4], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'expected return (drag circles)', ylabel: '$B_{ig}$', xticks: pctTicks(0, 0.2, 0.05), title: 'his Figure 9: the line PQ' });
        const hs = E0.map((e, i) => F9.handle(e, 1, { color: col[i], label: NAMES[i], constrain: 'x' }));
        // long-only tangency: enumerate supports
        function best(mu, rf) {
          let bw = null, bs = -Infinity;
          for (let mask = 1; mask < 1 << K; mask++) {
            const idx = []; for (let i = 0; i < K; i++) if (mask >> i & 1) idx.push(i);
            const Ss = idx.map((i) => idx.map((j) => S[i][j])), z = solveLin(Ss, idx.map((i) => mu[i] - rf)); if (!z) continue;
            const t = z.reduce((a, b) => a + b, 0); if (!(t > 1e-9) || z.some((x) => x / t < -1e-9)) continue;
            const w = new Array(K).fill(0); idx.forEach((i, k) => { w[i] = z[k] / t; });
            const sh = (dot(w, mu) - rf) / Math.sqrt(quad(w, S)); if (sh > bs) { bs = sh; bw = w; }
          }
          return bw;
        }
        const Lch = [];
        { const Lm = []; for (let i = 0; i < K; i++) { Lm.push(new Array(K).fill(0)); for (let j = 0; j <= i; j++) { let s = S[i][j]; for (let k = 0; k < j; k++) s -= Lm[i][k] * Lm[j][k]; Lm[i][j] = i === j ? Math.sqrt(s) : s / Lm[j][j]; } } Lch.push(...Lm); }
        let st = null;
        v.render(() => {
          const mu = hs.map((h) => clamp(h.x, 0.02, 0.19)), rf = Pr.value, w = best(mu, rf);
          if (!w) { A.corner('no efficient combination with positive weights above P', 'tl', { color: 'red', size: 12, weight: 700 }); st = null; return; }
          const Eg = dot(w, mu), sg2 = Math.sqrt(quad(w, S)), Sw = matVec(S, w), slope = (Eg - rf) / sg2;
          const r = rng(5); for (let k = 0; k < 1400; k++) { let s = 0; const x = []; for (let i = 0; i < K; i++) { const e = -Math.log(r() + 1e-12); x.push(e); s += e; } const q = x.map((e) => e / s); A.dot(dot(q, mu), Math.sqrt(quad(q, S)), { r: 1.3, color: 'muted', alpha: 0.35 }); }
          A.line(rf, 0, 0.2, ((0.2 - rf) * 1) / slope, { color: 'green', width: 2.4 });
          A.dot(rf, 0, { r: 5, color: 'ink' }); A.text('$P$', rf, 0, { dx: 0, dy: -12, align: 'center', size: 12, color: 'ink' });
          A.dot(Eg, sg2, { r: 7, color: 'gold' }); A.text('g', Eg, sg2, { dx: 9, dy: -8, align: 'left', size: 13, color: 'gold', weight: 700 });
          mu.forEach((m, i) => { A.dot(m, SD[i], { r: 4.5, color: col[i] }); A.text(NAMES[i], m, SD[i], { dx: 7, dy: -3, align: 'left', size: 11.5, color: col[i], weight: 700 }); });
          // Figure 8: simulate 60 months of asset returns, form R_g and regress R_i on it
          const k = +sel.value - 1, rn = rng(100 + seed), xs = [], ys = [];
          for (let t = 0; t < 60; t++) { const z = Array.from({ length: K }, () => rn.normal()), e = Lch.map((row) => row.reduce((s, a, j) => s + a * z[j], 0)), ret = e.map((x, i) => mu[i] / 12 + x / Math.sqrt(12)); xs.push(dot(w, ret)); ys.push(ret[k]); }
          const fit = ols(Float64Array.from(ys), [Float64Array.from(xs)]);
          F8.dots(xs.map((x, i) => [x, ys[i]]), { r: 3, color: col[k], alpha: 0.8 });
          F8.line(-0.15, fit.b[0] - 0.15 * fit.b[1], 0.15, fit.b[0] + 0.15 * fit.b[1], { color: 'ink', width: 2 });
          F8.text(`$\\hat B$ = ${fx(fit.b[1], 2)}  (model: ${fx(Sw[k] / (sg2 * sg2), 2)})`, 0.145, 0.27, { align: 'right', size: 12, color: 'ink', weight: 700 });
          // Figure 9
          const B = Sw.map((x) => x / (sg2 * sg2)); F9.setView([0, 0.2], [-0.2, Math.max(2.4, ...B) * 1.1]);
          F9.line(rf, 0, 0.2, (0.2 - rf) / (Eg - rf), { color: 'green', width: 2.4 });
          F9.text('P', rf, 0, { dx: 0, dy: 14, align: 'center', size: 12, color: 'green', weight: 700 }); F9.text('Q', 0.2, (0.2 - rf) / (Eg - rf), { dx: -2, dy: -10, align: 'right', size: 12, color: 'green', weight: 700 });
          hs.forEach((h, i) => { h.set(mu[i], B[i]); });
          st = { w, B, mu, Eg, sg2, rf, fit, k, dev: Math.max(...B.map((b, i) => (w[i] > 1e-6 ? Math.abs(b - (mu[i] - rf) / (Eg - rf)) : 0))), out: B.map((b, i) => (b - (mu[i] - rf) / (Eg - rf))) };
        });
        v.legend([['green', 'capital market line / line PQ'], ['gold', 'efficient combination g', { dot: true }], ['muted', 'feasible long-only portfolios', { dot: true }]]);
        v.readout(() => {
          if (!st) return 'lower the pure rate or raise some expected returns';
          const inG = st.w.map((x, i) => (x > 1e-6 ? NAMES[i] : null)).filter(Boolean), outG = st.w.map((x, i) => (x <= 1e-6 ? NAMES[i] : null)).filter(Boolean);
          return `g holds assets ${inG.join(', ')} (weights ${st.w.filter((x) => x > 1e-6).map((x) => Math.round(100 * x) + '%').join(' / ')}), $E_{R_g}$ = ${pct(st.Eg, 2)}, $\\sigma_{R_g}$ = ${pct(st.sg2, 1)}; slope of the capital market line ${fx((st.Eg - st.rf) / st.sg2, 2)}\nfor the assets in g the distance of $B_{ig}$ from the line $PQ$ is at most ${fx(st.dev, 6)} — on the line${outG.length ? `; ${outG.length > 1 ? 'assets' : 'asset'} ${outG.join(', ')} ${outG.length > 1 ? 'are' : 'is'} not held in g, and ${outG.length > 1 ? 'their points' : 'its point'} ${st.out.filter((_, i) => st.w[i] <= 1e-6).map((x) => (x > 0 ? 'lies above' : 'lies below')).join(', ')} the line (the expected return is too low for the $B$)` : ''}\nasset ${NAMES[st.k]} in Figure 8: sample slope ${fx(st.fit.b[1], 2)} from 60 simulated months against the model's $B_{ig}$ = ${fx(st.B[st.k], 2)}`;
        });
      },
    },
  ],
};
