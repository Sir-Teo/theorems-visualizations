// Finance — Chapter 4: CAPM, factors and anomalies (items 4.7–4.12; 4.1–4.6 are in ch04.js)
//
// Real data (Kenneth R. French's Data Library, CRSP; see ch04.shared.js): 4.7 (25 size/book-to-market portfolios and the factors),
// 4.8 (ten beta-sorted portfolios), 4.10 (momentum factor and ten prior-return portfolios). 4.9, 4.11 and 4.12 are models and
// reconstructions: 4.9 a simulated universe, 4.11 a calibration whose Mehra–Prescott inputs (1889–1978: premium 6.18%, riskless 0.80%,
// consumption growth 1.8% with sd 3.6%) were read from Mehra's 2003 retrospective (NBER w9525), 4.12 a modern-notation rebuild of
// Sharpe's Figures 8 and 9 (read from the original article; the paper's scatter is itself schematic).
import { clamp, pct, fx, sg, pctTicks, data, monthLabel, idxOf, mean, sdev, solveLin, invert, matVec, dot, ols, excess, ann, frontierConsts, frontierSd, frontierWeights, tangency, covRho, quad, rng, BETA_NAMES } from './ch04.shared.js';

export default {
  collection: 'fin',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'The Fama–French three-factor model',
      statement: String.raw`Fama and French (1993) add two return factors to the market: **SMB** ("small minus big", the return on a portfolio of small stocks minus one of big stocks) and **HML** ("high minus low", value stocks with a high book-to-market ratio minus growth stocks with a low one). The model is
$$r_{i}-r_f=\alpha_i+b_i\,(r_M-r_f)+s_i\,\mathrm{SMB}+h_i\,\mathrm{HML}+\varepsilon_i ,$$
and it is said to *explain* the average returns of a set of test portfolios when the intercepts $\alpha_i$ are all close to zero. The factors are built mechanically from six portfolios sorted two ways on size and book-to-market each June, so they are traded long–short returns, not macroeconomic variables.

Scope: an empirical asset-pricing model (a multi-factor relative of the APT, fin-4.6) and not a theorem; its factors are priced characteristics whose economic reason (risk, or mispricing) is disputed. The time period matters.`,
      idea: String.raw`In the CAPM only the market loading should matter, but sorting stocks on size and book-to-market produces a spread of average returns that the market beta does not explain: small value portfolios earn more, and small growth portfolios less, than their betas predict. SMB and HML are returns on portfolios that capture those two dimensions; regressing each of 25 size × value portfolios on the three factors (an APT-style multi-factor regression, fin-4.6) soaks up most of the pattern, because the portfolios differ mainly in their SMB and HML loadings. What remains — the alphas — is much smaller, although some corners (small growth stocks) stay stubbornly negative.`,
      caption: String.raw`The 25 value-weighted portfolios of the French data library, rows from the **smallest** (top) to the **biggest** size quintile, columns from low (growth) to high (value) book-to-market, 1963 onward. **Left**: the CAPM alpha of each portfolio (annual %, monthly regression on the market). **Right**: the alpha once SMB and HML are added. Switch to **factor loadings** to see where the explanatory power comes from: SMB loadings fall with size, HML loadings rise with book-to-market. Choose the **period**: the pattern is stronger before 1992 than after.`,
      deps: ['fin-4.6'],
      refs: ['BKM ch. 10', 'BKM ch. 13'],
      tags: ['factor models', 'size', 'value'],
      credit: 'Eugene F. Fama & Kenneth R. French, 1993',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fama%E2%80%93French_three-factor_model', doi: 'https://doi.org/10.1016/0304-405X(93)90023-5' },
      viz(v) {
        const D = data(), n = D.n, K = 25;
        const per = v.select('period', ['1963–1991', '1992–2026', 'all 1963–2026'], '1963–1991');
        const view = v.select('show', ['alphas', 'factor loadings'], 'alphas');
        const W = 5.6, H = 5.5;
        const mk = (title) => v.stage({ x: [-1.25, 5.1], y: [-0.6, 5.45], equal: true, axes: false, height: 330, weight: 1, minWidth: 270, title });
        const A = mk('CAPM'), B = mk('three-factor model');
        const ex = D.p25.map((p) => excess(p, D.rf));
        const cache = {};
        const regs = (p) => {
          if (cache[p]) return cache[p];
          const [i0, i1] = p === '1963–1991' ? [0, 342] : p === '1992–2026' ? [342, n] : [0, n];
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
          S.text('size ↓', -1.2, 5.3, { align: 'left', size: 10.5, color: 'muted' }); S.text(ttl, 5.05, -0.25, { align: 'right', size: 10.5, color: 'muted' });
        };
        let st = null;
        v.render(() => {
          const { c, i0, i1 } = regs(per.value), loads = view.value === 'factor loadings';
          let s1 = 0, s3 = 0, r1 = 0, r3 = 0;
          for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
            const k = a * 5 + b, q = c[k];
            const al1 = 12 * q.c1.b[0], al3 = 12 * q.c3.b[0];
            s1 += Math.abs(al1); s3 += Math.abs(al3); r1 += q.c1.r2; r3 += q.c3.r2;
            if (!loads) { cell(A, a, b, al1, al1 / 0.06, sg(100 * al1, 1)); cell(B, a, b, al3, al3 / 0.06, sg(100 * al3, 1)); }
            else { const sl = q.c3.b[2], hl = q.c3.b[3]; cell(A, a, b, sl, sl / 1.2, fx(sl, 2)); cell(B, a, b, hl, hl / 1.2, fx(hl, 2)); }
          }
          frame(A, loads ? 'SMB loading' : 'annual alpha, %'); frame(B, loads ? 'HML loading' : 'annual alpha, %');
          A.setTitle(loads ? 'size loading $s_i$ (three-factor regression)' : 'CAPM alphas (annual %)'); B.setTitle(loads ? 'value loading $h_i$ (three-factor regression)' : 'three-factor alphas (annual %)');
          st = { s1: s1 / K, s3: s3 / K, r1: r1 / K, r3: r3 / K, i0, i1, tl1: 12 * c[0].c1.b[0], tl3: 12 * c[0].c3.b[0], th1: 12 * c[4].c1.b[0], th3: 12 * c[4].c3.b[0], premS: 12 * mean(D.smb, i0, i1), premH: 12 * mean(D.hml, i0, i1), loads };
        });
        v.legend([['blue', 'negative', { area: true }], ['red', 'positive', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `${monthLabel(st.i0)} – ${monthLabel(st.i1 - 1)}: average |alpha| ${fx(100 * st.s1, 2)}% (CAPM) → ${fx(100 * st.s3, 2)}% (three factors); average $R^2$ ${fx(st.r1, 2)} → ${fx(st.r3, 2)}\nsmall growth: ${sg(100 * st.tl1, 1)}% → ${sg(100 * st.tl3, 1)}%; small value: ${sg(100 * st.th1, 1)}% → ${sg(100 * st.th3, 1)}% a year; factor premia in this window: SMB ${sg(100 * st.premS, 1)}%, HML ${sg(100 * st.premH, 1)}% a year`;
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
      caption: String.raw`Ten value-weighted portfolios formed each June on estimated beta (French data library, from 1963). **Left**: each decile's realised beta (a regression on the market over your window) against its average excess return. The green line is the CAPM, through the origin with the market premium as slope; the orange line is the least-squares line through the ten points. **Right**: the alpha of each decile with ±2 standard errors. Slide the **window**: in most windows the high-beta deciles fall below the green line and the low-beta ones above, but it is not so in all, and with only a few years the errors swamp everything.`,
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
      caption: String.raw`Real data (French data library, 1927 onward): **left**, the growth of one dollar in the value-weighted decile of past winners (green) and past losers (red), and in the momentum factor (winners minus losers, accent) — on a log axis, with the **five worst months** of the momentum factor in your window marked. **Right**: the average return of each of the ten prior-return deciles, annualised. Slide the **window** to see the era-dependence of the effect (it is weaker after the 1990s) and what a single crash does to a long-short record.`,
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
        const L = v.stage({ x: [1927, 2027], y: [0.1, 1000], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 300, xlabel: 'year', ylabel: 'growth of $1', title: 'winners, losers and the momentum factor' });
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
          worst.forEach((i, k) => { const w = paths[2][i - a + 1][1]; L.dot(1927 + (i + 0.5) / 12, w, { r: 5, color: 'gold' }); L.text(`${monthLabel(i, ...B0)}: ${fx(100 * mom[i], 0)}%`, 1927 + (i + 0.5) / 12, w, { dx: k % 2 ? 8 : -8, dy: k < 2 ? 18 : -10, align: k % 2 ? 'left' : 'right', size: 10, color: 'muted', weight: 600 }); });
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
          return `${monthLabel(st.a, ...B0)} – ${monthLabel(st.b - 1, ...B0)}: momentum factor ${pct(st.mean, 1)} a year with volatility ${pct(st.sd, 1)} (ratio ${fx(st.mean / st.sd, 2)}), skewness ${fx(st.sk, 1)}; $1 grows to ${fx(st.end[2], 2)} in the factor, ${fx(st.end[1], 1)} in winners and ${fx(st.end[0], 2)} in losers\nworst month ${monthLabel(st.worst[0], ...B0)} (${fx(100 * mom[st.worst[0]], 1)}%); decile averages run from ${pct(st.dec[0], 1)} (losers) to ${pct(st.dec[9], 1)} (winners)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'The equity premium puzzle',
      statement: String.raw`Over long samples U.S. stocks have earned much more than short-term bonds: Mehra and Prescott (1985) report for 1889–1978 a real return of 6.98% on the S&P index against 0.80% on a riskless security, a premium of 6.18% a year. In a standard consumption-based model with a representative investor with constant relative risk aversion $\gamma$ and lognormal consumption growth, the (log) equity premium equals $\gamma$ times the covariance of consumption growth with the return on equity,
$$\ln E[R_e]-\ln R_f=\gamma\,\operatorname{Cov}(\Delta c, r_e)\;(\le\gamma\,\sigma_c\sigma_e),$$
and consumption growth is so smooth ($\sigma_c\approx3.6\%$ a year in their sample) that **matching 6% requires a risk aversion $\gamma$ far above the range of about 10 or less that Mehra and Prescott regarded as reasonable**; and then the same model predicts a riskless rate $r_f=-\ln\beta+\gamma\mu_c-\tfrac12\gamma^2\sigma_c^2$ that is much too high. The puzzle is the combination: a high premium, a low riskless rate, and smooth consumption.

Scope: a statement about a particular class of models and sample; different data sets give premia of 4% to 8% (Mehra, 2003), and many resolutions have been proposed (habits, disaster risk, long-run risk, myopic loss aversion).`,
      idea: String.raw`Because $\gamma\,\operatorname{Cov}(\Delta c,r_e)$ is small unless either $\gamma$ is large or consumption is much more correlated with stock returns than it is in annual data, a premium of 6% needs $\gamma$ in the tens. That is not just a number: a $\gamma$ that large would make investors refuse a coin flip between doubling and losing a third of their wealth, and in the same model it would make them want to borrow to push the riskless rate up (the *riskless rate puzzle*). Benartzi and Thaler (1995) propose a behavioural resolution (loss aversion, with its prospect-theory weight on losses relative to gains, combined with frequent evaluation of the portfolio, "myopic loss aversion"; their simulations point to an evaluation period of about a year). The right panel is an independent *stylised* calculation of that idea, not their data or procedure.`,
      caption: String.raw`**Left**: the premium the model delivers as a function of risk aversion, for equity as a claim on consumption ($\gamma\sigma_c^2$, orange) and for equity with the correlation $\rho$ you choose ($\gamma\rho\sigma_c\sigma_e$, accent), against the observed 6.18% (green, Mehra–Prescott 1889–1978); the shaded band is $\gamma<10$. The green dot is the $\gamma$ needed. **Middle**: the riskless rate the same $\gamma$ implies (log-utility discount factor $\beta$ as chosen), against the observed 0.8%. **Right**: *myopic loss aversion*, a stylised calculation: the prospect-theory value of holding stocks rather than bonds for an evaluation period $h$; with the loss-aversion $\lambda$ and curvature $\alpha$ sliders it crosses zero near one year. The values $\alpha=0.88$ and $\lambda=2.25$ are the commonly quoted estimates of Tversky and Kahneman (1992); $\rho$ and the 20% stock volatility are not from the Mehra–Prescott table.`,
      deps: ['behav-1.7', 'behav-2.12'],
      refs: ['BKM ch. 13'],
      tags: ['equity premium', 'risk aversion', 'behavioral finance'],
      credit: 'Rajnish Mehra & Edward C. Prescott, 1985',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equity_premium_puzzle', doi: 'https://doi.org/10.1016/0304-3932(85)90061-3' },
      viz(v) {
        const pS = v.slider('observed premium', 0.02, 0.10, 0.0618, { step: 0.0005, fmt: (x) => pct(x, 2) });
        const sc = v.slider('consumption volatility $\\sigma_c$', 0.015, 0.06, 0.036, { step: 0.0005, fmt: (x) => pct(x, 1) });
        const se = v.slider('stock volatility $\\sigma_e$', 0.10, 0.30, 0.20, { step: 0.005, fmt: (x) => pct(x, 0) });
        const rho = v.slider('correlation $\\rho$ (consumption growth, stock return)', 0.1, 1, 0.3, { step: 0.01 });
        const beta = v.slider('discount factor $\\beta$', 0.9, 1, 0.99, { step: 0.001 });
        const lam = v.slider('loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const alp = v.slider('curvature $\\alpha$', 0.5, 1, 0.88, { step: 0.01 });
        const P = v.stage({ x: [0, 60], y: [0, 0.12], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'relative risk aversion $\\gamma$', ylabel: 'equity premium', yticks: pctTicks(0, 0.12, 0.03), title: 'premium implied by the model' });
        const Rf = v.stage({ x: [0, 60], y: [-0.4, 0.4], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'relative risk aversion $\\gamma$', ylabel: 'riskless rate (log)', yticks: pctTicks(-0.4, 0.4, 0.2), title: 'riskless rate implied by the same $\\gamma$' });
        const M = v.stage({ x: [0.05, 10], y: [-0.1, 0.1], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'evaluation period $h$ (years)', ylabel: 'prospect value of stocks over bonds', title: 'myopic loss aversion (stylised)' });
        const MUC = 0.018;
        const value = (h, pi, s, a, l) => { let t = 0; const N = 600; for (let i = 0; i < N; i++) { const z = -5 + (10 * (i + 0.5)) / N, w = (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * (10 / N), x = pi * h + s * Math.sqrt(h) * z; t += w * (x >= 0 ? Math.pow(x, a) : -l * Math.pow(-x, a)); } return t; };
        let st = null;
        v.render(() => {
          const cov = rho.value * sc.value * se.value, g1 = pS.value / cov, g2 = pS.value / (sc.value * sc.value);
          P.setView([0, 60], [0, Math.max(0.12, pS.value * 1.5)]);
          P.vband(0, 10, { color: 'green', alpha: 0.1 });
          P.text('$\\gamma<10$', 5, Math.max(0.12, pS.value * 1.5) * 0.94, { align: 'center', size: 11.5, color: 'green', weight: 700 });
          P.line(0, 0, 60, 60 * cov, { color: 'accent', width: 2.4 }); P.line(0, 0, 60, 60 * sc.value ** 2, { color: 'orange', width: 2.2 });
          P.hline(pS.value, { color: 'green', width: 1.6, dash: true });
          if (g1 <= 60) { P.dot(g1, pS.value, { r: 6.5, color: 'green' }); P.text(`γ ≈ ${fx(g1, 0)}`, g1, pS.value, { dx: 8, dy: -12, align: 'left', size: 12, color: 'green', weight: 700 }); }
          const rfAt = (g) => -Math.log(beta.value) + g * MUC - 0.5 * g * g * sc.value ** 2;
          Rf.path(Array.from({ length: 121 }, (_, k) => [k * 0.5, rfAt(k * 0.5)]), { color: 'accent', width: 2.4 });
          Rf.hline(0.008, { color: 'green', width: 1.6, dash: true }); Rf.hline(0, { color: 'muted', width: 1 });
          Rf.vband(0, 10, { color: 'green', alpha: 0.1 });
          const gm = Math.min(60, g1); Rf.dot(gm, rfAt(gm), { r: 6, color: 'red' });
          Rf.text(`${fx(100 * rfAt(gm), 0)}% at γ = ${fx(gm, 0)}`, gm, rfAt(gm), { dx: -8, dy: -12, align: 'right', size: 11.5, color: 'red', weight: 700 });
          // myopic loss aversion
          const pts = [], hs = []; for (let k = 0; k <= 80; k++) { const h = Math.pow(10, Math.log10(0.05) + (k / 80) * (Math.log10(10) - Math.log10(0.05))); hs.push(h); pts.push([h, value(h, pS.value, se.value, alp.value, lam.value)]); }
          const yy = pts.map((p) => p[1]), mx = Math.max(...yy.map(Math.abs)) * 1.1; M.setView([0.05, 10], [-mx, mx]);
          M.path(pts, { color: 'accent', width: 2.4 }); M.hline(0, { color: 'muted', width: 1 });
          let hstar = null; for (let k = 1; k < pts.length; k++) if (pts[k - 1][1] < 0 && pts[k][1] >= 0) { let lo = hs[k - 1], hi = hs[k]; for (let q = 0; q < 40; q++) { const mid = Math.sqrt(lo * hi); if (value(mid, pS.value, se.value, alp.value, lam.value) < 0) lo = mid; else hi = mid; } hstar = Math.sqrt(lo * hi); break; }
          if (hstar) { M.dot(hstar, 0, { r: 6.5, color: 'green' }); M.text(`${fx(hstar * 12, 0)} months`, hstar, 0, { dx: 8, dy: 16, align: 'left', size: 12, color: 'green', weight: 700 }); }
          M.vline(1, { color: 'muted', width: 1, dash: true });
          st = { g1, g2, cov, hstar, prem10: 10 * cov, prem10c: 10 * sc.value ** 2, rf10: rfAt(10), rfg: rfAt(Math.min(60, g1)) };
        });
        v.legend([['accent', 'premium with correlation ρ / riskless rate / value of stocks'], ['orange', 'premium if equity were a claim on consumption'], ['green', 'observed values', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `the risk aversion needed is γ = ${fx(st.g1, 0)} for your ρ (and ${fx(st.g2, 0)} if equity were a claim on consumption, where the premium is γσ_c²); at γ = 10 the model gives ${pct(st.prem10, 1)} (${pct(st.prem10c, 1)} for the claim on consumption), against ${pct(pS.value, 2)} observed — Mehra reports 1.4% for γ = 10, β = 0.99 in this class of models\nthe riskless rate at γ = 10 would be ${pct(st.rf10, 0)} a year (observed 0.8%)\nmyopic loss aversion: stocks beat bonds in prospect value only if portfolios are evaluated at least every ${st.hstar ? fx(st.hstar * 12, 0) + ' months' : 'n/a'} — an investor who looks monthly demands a far larger premium than one who looks every few years`;
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
      caption: String.raw`A rebuild of Sharpe's argument in modern notation with six invented assets (the paper's own figures are schematic and contain no data). **Left**: his axes — expected return horizontal, risk vertical — with the feasible long-only portfolios (cloud), the pure rate $P$ (drag it along the axis) and the tangent line from $P$, the capital market line, touching the efficient combination $g$. **Middle**: his Figure 8: simulated monthly returns of the chosen asset against $R_g$, whose regression slope is $B_{ig}$. **Right**: his Figure 9: each asset's $B_{ig}$ against its expected return; the assets inside $g$ lie on the line $PQ$ from $(P,0)$. **Drag an asset's expected return** (circles on the right) and the efficient combination reshuffles — assets that drop out of $g$ leave the line.`,
      deps: ['fin-3.15', 'fin-3.11'],
      refs: [],
      tags: ['CAPM', 'equilibrium', 'asset pricing'],
      credit: 'William F. Sharpe, 1964 (cf. Lintner, 1965; Mossin, 1966)',
      links: { doi: 'https://doi.org/10.1111/j.1540-6261.1964.tb02865.x', wikipedia: 'https://en.wikipedia.org/wiki/Capital_asset_pricing_model' },
      viz(v) {
        const NAMES = ['1', '2', '3', '4', '5', '6'], K = 6, SD = [0.12, 0.16, 0.20, 0.25, 0.30, 0.22], c = [0.5, 0.6, 0.55, 0.6, 0.65, 0.3];
        const R = c.map((ci, i) => c.map((cj, j) => (i === j ? 1 : ci * cj)));
        const S = covRho(SD, R), E0 = [0.07, 0.09, 0.11, 0.13, 0.15, 0.08], col = ['blue', 'orange', 'purple', 'teal', 'pink', 'accent'];
        const Pr = v.slider('pure rate $P$', 0, 0.06, 0.03, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const sel = v.select('asset in Figure 8', NAMES, '4');
        v.button('new sample', () => { seed += 1; });
        let seed = 1;
        const A = v.stage({ x: [0, 0.2], y: [0, 0.34], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 280, xlabel: 'expected rate of return', ylabel: 'risk σ', xticks: pctTicks(0, 0.2, 0.05), yticks: pctTicks(0, 0.3, 0.1), title: 'the capital market line' });
        const F8 = v.stage({ x: [-0.1, 0.1], y: [-0.2, 0.2], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: 'return on the combination $g$', ylabel: 'return on asset $i$ (monthly, annualised scale)', title: 'his Figure 8: $B_{ig}$ as a regression slope' });
        const F9 = v.stage({ x: [0, 0.2], y: [-0.2, 2.4], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'expected return $E_{R_i}$ (drag the circles)', ylabel: '$B_{ig}$', xticks: pctTicks(0, 0.2, 0.05), title: 'his Figure 9: the line PQ' });
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
          for (let t = 0; t < 60; t++) { const z = Array.from({ length: K }, () => rn.normal()), e = Lch.map((row) => row.reduce((s, a, j) => s + a * z[j], 0)), ret = e.map((x, i) => (mu[i] + x) / 12 * 1); xs.push(dot(w, e.map((x, i) => (mu[i] + x) / 12))); ys.push(ret[k]); }
          const fit = ols(Float64Array.from(ys), [Float64Array.from(xs)]);
          F8.dots(xs.map((x, i) => [x, ys[i]]), { r: 3, color: col[k], alpha: 0.8 });
          F8.line(-0.1, fit.b[0] - 0.1 * fit.b[1], 0.1, fit.b[0] + 0.1 * fit.b[1], { color: 'ink', width: 2 });
          F8.text(`$\\hat B$ = ${fx(fit.b[1], 2)}  (model: ${fx(Sw[k] / (sg2 * sg2), 2)})`, 0.095, 0.17, { align: 'right', size: 12, color: 'ink', weight: 700 });
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
          return `g holds assets ${inG.join(', ')} (weights ${st.w.filter((x) => x > 1e-6).map((x) => Math.round(100 * x) + '%').join(' / ')}), $E_{R_g}$ = ${pct(st.Eg, 2)}, $\\sigma_{R_g}$ = ${pct(st.sg2, 1)}; slope of the capital market line ${fx((st.Eg - st.rf) / st.sg2, 2)}\nfor the assets in g the distance of $B_{ig}$ from the line $PQ$ is at most ${fx(st.dev, 6)}$ — on the line${outG.length ? `; assets ${outG.join(', ')} are not held, and their points ${st.out.filter((_, i) => st.w[i] <= 1e-6).map((x) => (x > 0 ? 'lie above' : 'lie below')).join(', ')} the line (their expected return is too low for their $B$)` : ''}\nasset ${NAMES[st.k]} in Figure 8: sample slope ${fx(st.fit.b[1], 2)} from 60 simulated months against the model's $B_{ig}$ = ${fx(st.B[st.k], 2)}`;
        });
      },
    },
  ],
};
