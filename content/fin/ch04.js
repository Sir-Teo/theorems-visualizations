// Finance — Chapter 4: CAPM, factors and anomalies (items 4.1–4.6; 4.7–4.12 are in ch04-b.js)
//
// Sources and honesty notes (verified Oct 2026): Sharpe, J. Finance 19(3):425–442 (1964), doi 10.1111/j.1540-6261.1964.tb02865.x;
// Lintner, Rev. Econ. Stat. 47(1):13–37 (1965); Mossin, Econometrica 34(4):768–783 (1966); Sharpe, Management Science 9(2):277–293 (1963);
// Jensen, J. Finance 23(2):389–416 (1968); Ross, J. Econ. Theory 13(3):341–360 (1976), doi 10.1016/0022-0531(76)90046-6.
// 4.1, 4.2, 4.5 (partly), 4.6 use stylised model universes; 4.3, 4.4, 4.5 use real monthly returns from Kenneth R. French's Data Library.
import { clamp, pct, fx, sg, pctTicks, data, ymOf, monthLabel, idxOf, mean, sdev, solveLin, invert, matVec, dot, ols, excess, ann, fanLabels, frontierConsts, frontierSd, tangency, covRho, quad, rng, IND_LONG } from './ch04.shared.js';

export default {
  collection: 'fin',
  chapter: 4,
  title: 'CAPM, factors and anomalies',
  summary: String.raw`If everyone holds the tangency portfolio, it must be the market portfolio, and every asset’s expected excess return is proportional to its beta with the market — the capital asset pricing model. Arbitrage pricing generalizes this to several factors. Empirically the security market line is too flat and characteristics like size, value and momentum earn returns beta does not explain, and the equity premium itself is puzzlingly large.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'The market portfolio and the capital market line',
      statement: String.raw`Assume a one-period economy in which all investors share the same beliefs (means $\mu$ and covariance $\Sigma$ of the risky assets), care only about mean and variance, and can lend and borrow at one riskless rate $r_f$. By two-fund separation (fin-3.11) each of them holds the **same** risky portfolio $T\propto\Sigma^{-1}(\mu-r_f\mathbf 1)$ — the tangency portfolio — and only the amount $y_i$ put in it differs with wealth and risk aversion. Since every share of every asset must be held by somebody, the sum of the investors' risky holdings is the whole market, so $T$ **is** the market portfolio: its weights are the assets' market-capitalisation shares. The **capital market line** (CML) is the line through $(0,r_f)$ and $(\sigma_M,\mu_M)$,
$$\mu = r_f+\frac{\mu_M-r_f}{\sigma_M}\,\sigma ,$$
and every investor's portfolio lies on it, lenders below $M$ and borrowers above.

Scope: homogeneous beliefs, mean–variance preferences, a single riskless rate for borrowing and lending, no frictions, and net riskless lending equal to zero (the riskless asset is in zero net supply).`,
      idea: String.raw`Two-fund separation says the optimal risky mix does not depend on risk aversion, only on $(\mu,\Sigma,r_f)$. If beliefs are common, every investor computes the same $T$, so aggregate demand for asset $j$ is $T_j$ times aggregate risky wealth. In equilibrium aggregate demand equals the supply, so the supply shares (market-cap weights) equal $T$. The prices adjust until that holds: beliefs about $\mu$ are given, so the *price* of each asset moves until its expected return makes the tangency weights coincide with the capitalisation weights. The market premium is then set by aggregate risk aversion: $\mu_M-r_f=A_M\sigma_M^2$, where $A_M$ is the wealth-weighted harmonic mean of the investors' risk aversions.`,
      caption: String.raw`**Left**: four risky assets, the unconstrained mean–variance frontier, the capital market line from $r_f$ and five investors (gold) on it. **Right**: market-capitalisation shares (supply, blue) against the demand of all investors together (orange). Moving **risk aversion** or $r_f$ moves the premium and the investors along the line but the demand bars stay on the supply bars. Then give asset **C a belief shock**: the tangency portfolio — everybody's portfolio — shifts away from the market portfolio, demand no longer equals supply and the prices of C and its neighbours would have to move. (Stylised universe, not data.)`,
      deps: ['fin-3.11'],
      refs: ['Luenberger: CAPM', 'BKM ch. 9'],
      tags: ['CAPM', 'equilibrium', 'portfolio theory'],
      credit: 'Sharpe, 1964; Lintner, 1965; Mossin, 1966',
      scope: String.raw`Holds under common beliefs, mean–variance preferences and unrestricted riskless borrowing and lending; with different borrowing and lending rates, or heterogeneous beliefs, investors hold different risky portfolios and the CML bends.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Capital_market_line' },
      viz(v) {
        const NAMES = ['A', 'B', 'C', 'D'], SD = [0.14, 0.20, 0.28, 0.36], CAP = [40, 30, 20, 10];
        const R = [[1, 0.5, 0.35, 0.25], [0.5, 1, 0.45, 0.3], [0.35, 0.45, 1, 0.5], [0.25, 0.3, 0.5, 1]];
        const S = covRho(SD, R), wM = CAP.map((c) => c / 100);
        const WEALTH = [30, 25, 20, 15, 10], REL = [1, 2, 3.5, 6, 12];
        const scale = v.slider('risk aversion (all investors)', 0.6, 2.5, 1.2, { step: 0.01 });
        const rfS = v.slider('riskless rate $r_f$', 0, 0.06, 0.02, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const shock = v.slider('belief shock to asset C', -0.04, 0.04, 0, { step: 0.0025, fmt: (x) => sg(100 * x, 2) + ' pts' });
        const L = v.stage({ x: [0, 0.5], y: [0, 0.22], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 300, xlabel: 'risk σ', ylabel: 'expected return', xticks: pctTicks(0, 0.5, 0.1), yticks: pctTicks(0, 0.2, 0.05), title: 'frontier, tangency portfolio and the capital market line' });
        const B = v.stage({ x: [0.4, 4.6], y: [0, 0.55], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'asset', ylabel: 'share of the market', xticks: NAMES.map((n, i) => [i + 1, n]), yticks: pctTicks(0, 0.5, 0.1), title: 'supply (market capitalisation) and demand' });
        let st = null;
        v.render(() => {
          const rf = rfS.value, Am = 1 / WEALTH.reduce((s, w, i) => s + (w / 100) / (scale.value * REL[i]), 0);
          const Sw = matVec(S, wM), varM = dot(wM, Sw), mu = Sw.map((x) => rf + Am * x);
          mu[2] += shock.value;
          const T = tangency(mu, S, rf), F = frontierConsts(mu, S);
          if (!T || !F) { L.corner('no tangency portfolio for these inputs', 'tl', { color: 'red', size: 12, weight: 700 }); st = null; return; }
          const muT = dot(T, mu), sdT = Math.sqrt(quad(T, S)), slope = (muT - rf) / sdT;
          // frontier (both branches)
          const m0 = F.b / F.a;
          for (const sgn of [1, -1]) { const pts = []; for (let k = 0; k <= 160; k++) { const m = m0 + sgn * (k / 160) * 0.3; pts.push([frontierSd(F, m), m]); } L.path(pts, { color: sgn > 0 ? 'accent' : 'muted', width: sgn > 0 ? 2.4 : 1.4 }); }
          L.line(0, rf, 0.5, rf + slope * 0.5, { color: 'green', width: 2.4 });
          L.text('capital market line', 0.5, rf + slope * 0.5, { dx: -4, dy: -10, align: 'right', size: 11.5, color: 'green', weight: 700 });
          SD.forEach((s, i) => { L.dot(s, mu[i], { r: 4.5, color: 'muted' }); L.text(NAMES[i], s, mu[i], { dx: 8, dy: -2, align: 'left', size: 12, color: 'muted', weight: 700 }); });
          L.dot(0, rf, { r: 4.5, color: 'ink' }); L.text('$r_f$', 0, rf, { dx: 8, dy: 14, align: 'left', size: 11.5, color: 'muted' });
          const Mmu = dot(wM, mu), Msd = Math.sqrt(varM);
          L.dot(sdT, muT, { r: 7, color: 'green' }); L.text('tangency T', sdT, muT, { dx: -9, dy: -8, align: 'right', size: 12, color: 'green', weight: 700 });
          if (Math.abs(shock.value) > 1e-9) { L.dot(Msd, Mmu, { r: 6, color: 'red', hollow: true }); L.text('market M', Msd, Mmu, { dx: 9, dy: 14, align: 'left', size: 12, color: 'red', weight: 700 }); }
          const y = REL.map((r) => (muT - rf) / (scale.value * r * sdT * sdT));
          y.forEach((yi, i) => { L.dot(Math.abs(yi) * sdT, rf + yi * (muT - rf), { r: 5, color: 'gold' }); });
          L.text('most risk-averse investor', Math.abs(y[4]) * sdT, rf + y[4] * (muT - rf), { dx: 6, dy: 14, align: 'left', size: 10.5, color: 'muted' });
          L.text('least risk-averse', Math.abs(y[0]) * sdT, rf + y[0] * (muT - rf), { dx: -8, dy: 14, align: 'right', size: 10.5, color: 'muted' });
          // aggregate demand against supply
          const riskyW = WEALTH.reduce((s, w, i) => s + (w / 100) * y[i], 0);
          const dem = T.map((t) => t * riskyW);
          NAMES.forEach((n, i) => {
            B.rect(i + 1 - 0.34, 0, i + 1 - 0.02, wM[i], { fill: 'blue', fillAlpha: 0.75, color: 'blue', width: 1 });
            B.rect(i + 1 + 0.02, 0, i + 1 + 0.34, Math.max(0, dem[i]), { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1 });
          });
          st = { Am, premium: Am * varM, muT, sdT, Msd, gap: Math.max(...T.map((t, i) => Math.abs(dem[i] - wM[i]))), riskyW, y, T };
        });
        v.legend([['accent', 'efficient frontier of the risky assets'], ['green', 'capital market line'], ['gold', 'investors', { dot: true }], ['blue', 'supply (capitalisation share)', { area: true }], ['orange', 'aggregate demand', { area: true }]]);
        v.readout(() => {
          if (!st) return 'choose inputs for which a tangency portfolio exists';
          const w = (a) => a.map((z) => `${Math.round(100 * z)}%`).join(' / ');
          return `market premium $A_M\\sigma_M^2$ = ${pct(st.premium, 2)} (aggregate risk aversion $A_M$ = ${fx(st.Am, 2)}), market σ = ${pct(st.Msd, 1)}; tangency weights ${w(st.T)} against market weights ${w(wM)}\ninvestors put ${st.y.map((y) => fx(y, 2)).join(', ')} of their wealth in the risky portfolio (above 1 = borrowing); the largest gap between demand and supply is ${pct(st.gap, 2)} of the market — ${st.gap < 1e-6 ? '**zero: T is the market portfolio**' : '**not zero: this is not an equilibrium, prices must move**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'CAPM: the security market line',
      statement: String.raw`In the one-period economy of fin-4.1 (common beliefs, mean–variance investors, one riskless rate $r_f$), the market portfolio $M$ is mean–variance efficient, and for **every** asset $i$
$$E[r_i]-r_f=\beta_i\,\bigl(E[r_M]-r_f\bigr),\qquad \beta_i=\frac{\operatorname{Cov}(r_i,r_M)}{\operatorname{Var}(r_M)} .$$
In the $(\beta,E[r])$ plane all assets, and all portfolios, lie on one straight line, the **security market line**, with intercept $r_f$ and slope the market premium. Only the part of risk that is correlated with the market (the beta part) is rewarded; idiosyncratic risk earns nothing, which is why a mispriced asset cannot lie off the line in equilibrium.

Scope: a model result. It holds exactly only at equilibrium prices, under the assumptions of fin-4.1.`,
      idea: String.raw`Mix a small fraction $\varepsilon$ of asset $i$ into the market portfolio. Since $M$ is the tangency portfolio, it must maximise the Sharpe ratio, so the derivative of the Sharpe ratio in the direction of $i$ must vanish at $\varepsilon=0$. That derivative is a combination of $E[r_i]-r_f$ and $\operatorname{Cov}(r_i,r_M)$, and setting it to zero gives $E[r_i]-r_f=\beta_i(E[r_M]-r_f)$. The market-clearing story is the converse: if the price of an asset were off the line, its expected return would be too high or too low for its covariance, the demand of mean–variance investors would exceed or fall short of the supply, and the price would move until it returned.`,
      caption: String.raw`Six assets with random payoffs; each investor demands shares $q=\tfrac1a\,C^{-1}\!\bigl(m-(1+r_f)P\bigr)$ (mean–variance utility, risk aversion $a$, payoff means $m$ and covariance $C$), and the six supplies are one share each. **Drag the blue ring** (starting 3 points too high for asset D; pick another asset, or drag it, to change that) to put one asset's price off its equilibrium level (a different expected return): it leaves the line, and the right panel shows the **excess demand** that this creates for it and, through correlation, for the others. Raise **rounds of trading** and prices move 15% of the way implied by the excess demand each round: the asset returns to the line and every bar goes to zero. (Stylised universe, not data.)`,
      deps: ['fin-4.1'],
      refs: ['Luenberger: CAPM', 'BKM ch. 9'],
      tags: ['CAPM', 'security market line', 'equilibrium'],
      credit: 'Sharpe, 1964; Lintner, 1965; Mossin, 1966',
      scope: String.raw`Exact only when the market portfolio is the tangency portfolio (common beliefs, a riskless asset available to all at one rate, mean–variance demand); empirical tests are the subject of fin-4.8 and fin-4.9.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Capital_asset_pricing_model' },
      viz(v) {
        const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'], N = 6;
        const m = [108, 112, 118, 125, 105, 132], bl = [6, 9, 12, 16, 4, 20], se = [4, 6, 8, 10, 5, 12];
        const C = bl.map((bi, i) => bl.map((bj, j) => bi * bj + (i === j ? se[i] ** 2 : 0)));
        const Ci = invert(C);
        const aS = v.slider('risk aversion $a$', 0.002, 0.012, 0.006, { step: 0.0005 });
        const rfS = v.slider('riskless rate $r_f$', 0, 0.05, 0.02, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const pick = v.select('mispriced asset', NAMES, 'D');
        const tS = v.slider('rounds of trading', 0, 40, 0, { int: true });
        const S = v.stage({ x: [0, 2.2], y: [0, 0.16], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 300, xlabel: 'beta $\\beta_i$', ylabel: 'expected return', yticks: pctTicks(0, 0.15, 0.05), title: 'the security market line' });
        const X = v.stage({ x: [0.4, 6.6], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: 'asset', ylabel: 'excess demand (shares)', xticks: NAMES.map((n, i) => [i + 1, n]), title: 'excess demand at the current prices' });
        const h = S.handle(1, 0.095, { color: 'blue', label: '', constrain: 'y' });
        const Pstar = (a, rf) => { const Cs = C.map((r) => r.reduce((s, x) => s + x, 0)); return m.map((mi, i) => (mi - a * Cs[i]) / (1 + rf)); };
        const stats = (P) => {
          const V = P.reduce((s, p) => s + p, 0), w = P.map((p) => p / V);
          const cr = C.map((row, i) => row.reduce((s, c, j) => s + (w[j] * c) / (P[i] * P[j]), 0));
          const vm = dot(w, cr), er = m.map((mi, i) => mi / P[i] - 1);
          return { beta: cr.map((c) => c / vm), er, erM: dot(w, er), w };
        };
        let st = null, k0 = 3;
        v.render(() => {
          const a = aS.value, rf = rfS.value, k = NAMES.indexOf(pick.value);
          const Ps = Pstar(a, rf), eq = stats(Ps);
          if (k !== k0) { k0 = k; h.set(eq.beta[k], clamp(eq.er[k] + 0.03, 0.005, 0.15)); } // a new asset starts 3 points above its equilibrium return
          h.set(eq.beta[k], clamp(h.y, 0.005, 0.15)); // the handle keeps the equilibrium beta
          const startEr = clamp(h.y, 0.005, 0.15);
          const P0 = Ps.slice(); P0[k] = m[k] / (1 + startEr);
          const f = Math.pow(0.85, tS.value), P = P0.map((p, i) => Ps[i] + (p - Ps[i]) * f);
          const cur = stats(P), prem = cur.erM - rf;
          S.line(0, rf, 2.2, rf + prem * 2.2, { color: 'green', width: 2.2 });
          S.text('security market line', 2.15, rf + prem * 2.15, { dx: -2, dy: -10, align: 'right', size: 11.5, color: 'green', weight: 700 });
          S.dot(0, rf, { r: 4.5, color: 'ink' }); S.text('$r_f$', 0.04, rf, { dx: 4, dy: 12, align: 'left', size: 11.5, color: 'muted' });
          S.dot(1, cur.erM, { r: 6, color: 'gold' }); S.text('market', 1, cur.erM, { dx: 9, dy: 14, align: 'left', size: 11.5, color: 'gold', weight: 700 });
          cur.beta.forEach((b, i) => {
            const alpha = cur.er[i] - rf - b * prem, off = Math.abs(alpha) > 0.0004;
            S.dot(b, cur.er[i], { r: i === k ? 6 : 4.5, color: i === k ? 'blue' : 'accent' });
            S.text(NAMES[i], b, cur.er[i], { dx: 8, dy: -3, align: 'left', size: 12, color: i === k ? 'blue' : 'accent', weight: 700 });
            if (off) S.line(b, rf + b * prem, b, cur.er[i], { color: 'red', width: 1.6 });
          });
          if (tS.value > 0) { S.dot(eq.beta[k], startEr, { r: 6, color: 'blue', hollow: true }); }
          // excess demand at the current prices: q − s with q = (C⁻¹(m − (1+rf)P))/a
          const q = matVec(Ci, m.map((mi, i) => mi - (1 + rf) * P[i])).map((x) => x / a), ex = q.map((x) => x - 1);
          const mx = Math.max(0.5, ...ex.map(Math.abs)); X.setView([0.4, 6.6], [-mx * 1.15, mx * 1.15]);
          ex.forEach((e, i) => X.rect(i + 1 - 0.3, 0, i + 1 + 0.3, e, { fill: e >= 0 ? 'green' : 'red', fillAlpha: 0.7, color: e >= 0 ? 'green' : 'red', width: 1 }));
          X.hline(0, { color: 'muted', width: 1 });
          st = { alpha: cur.er.map((e, i) => e - rf - cur.beta[i] * prem), k, prem, ex, beta: cur.beta, er: cur.er, rf };
        });
        v.legend([['green', 'security market line'], ['blue', 'the mispriced asset', { dot: true }], ['red', 'gap to the line (alpha)'], ['green', 'excess demand > 0 (price rises)', { area: true }], ['red', 'excess demand < 0 (price falls)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const al = st.alpha[st.k], mxa = Math.max(...st.alpha.map(Math.abs));
          return `asset ${NAMES[st.k]}: β = ${fx(st.beta[st.k], 2)}, expected return ${pct(st.er[st.k], 2)}, line predicts ${pct(st.rf + st.beta[st.k] * st.prem, 2)} → alpha ${sg(100 * al, 2)} pts; largest |alpha| of the six = ${fx(100 * mxa, 3)} pts\nmarket premium ${pct(st.prem, 2)}; excess demand for ${NAMES[st.k]} = ${sg(st.ex[st.k], 2)} shares — ${mxa < 1e-4 ? '**every asset is on the line and the market clears**' : al > 0 ? 'a high expected return for its β: buyers outnumber sellers, the price rises and the expected return falls' : 'a low expected return for its β: sellers outnumber buyers, the price falls'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Beta as a regression slope',
      statement: String.raw`The **beta** of an asset (or portfolio) $i$ with respect to the market is $\beta_i=\operatorname{Cov}(r_i,r_M)/\operatorname{Var}(r_M)$, which is the slope in the regression of its excess return on the market's excess return,
$$r_{i,t}-r_{f,t}=\alpha_i+\beta_i\,(r_{M,t}-r_{f,t})+\varepsilon_{i,t},\qquad \operatorname{Cov}(\varepsilon_i,r_M)=0 .$$
The intercept $\alpha_i$ is the average return unexplained by the market (fin-4.4). The variance splits into a **systematic** part $\beta_i^2\sigma_M^2$ and an **idiosyncratic** part $\sigma_{\varepsilon_i}^2$, and the share of the first is the regression's $R^2$.

Scope: this is a definition and a sample estimate: with finitely many months, $\hat\beta$ has a standard error, and beta itself moves over time.`,
      idea: String.raw`A regression line is the best linear predictor of $r_i$ from $r_M$ (least squares, pma-5.15 in spirit), so its slope is the covariance over the variance and the residual is uncorrelated with the market by construction. The market part of the return is what cannot be diversified away (fin-3.5), and in the CAPM (fin-4.2) it is the only part that is priced; the residual averages out across many assets. In practice betas are estimated from a rolling window of past returns, and the estimate depends noticeably on the window.`,
      caption: String.raw`Each dot is a month for one of the ten **industry portfolios** of the French data library (value-weighted, not single stocks) against the market's excess return in the same month. The line is the least-squares fit: its slope is $\hat\beta$, its intercept $\hat\alpha$, and the vertical scatter is the idiosyncratic risk. Choose the **industry**, then slide the **start** and **length** of the window. **Right**: the 60-month rolling beta of the same portfolio over the whole sample with your window shaded — the slope of the line you fit is not a constant of nature.`,
      deps: ['fin-4.2', 'stat-12.3'],
      refs: ['Luenberger: Models and Data', 'BKM ch. 8'],
      tags: ['beta', 'regression', 'risk'],
      credit: 'Sharpe, 1964 (beta); data: Kenneth R. French Data Library / CRSP',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beta_(finance)' },
      viz(v) {
        const D = data(), NM = ['NoDur', 'Durbl', 'Manuf', 'Enrgy', 'HiTec', 'Telcm', 'Shops', 'Hlth', 'Utils', 'Other'], n = D.n;
        const sel = v.select('industry portfolio', NM, 'Utils');
        const y0 = v.slider('window starts', 1963, 2023, 1990, { int: true, fmt: (x) => String(x) });
        const len = v.slider('length (years)', 3, 63, 25, { int: true });
        const X = v.stage({ x: [-0.25, 0.25], y: [-0.3, 0.3], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 290, xlabel: 'market excess return (month)', ylabel: 'portfolio excess return (month)', xticks: pctTicks(-0.2, 0.2, 0.1), yticks: pctTicks(-0.3, 0.3, 0.1), title: 'monthly excess returns' });
        const Rl = v.stage({ x: [1963, 2027], y: [0, 1.6], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'year', ylabel: 'rolling 60-month beta', title: 'is beta constant?' });
        const mk = D.mkt;
        const cacheRoll = {};
        const rolling = (name) => {
          if (cacheRoll[name]) return cacheRoll[name];
          const y = excess(D.ind[NM.indexOf(name)], D.rf), out = [];
          for (let e = 60; e <= n; e++) { const r = ols(y, [mk], e - 60, e); out.push([1963.5 + (e - 0.5) / 12, r.b[1]]); }
          return (cacheRoll[name] = out);
        };
        let st = null;
        v.render(() => {
          const name = sel.value, y = excess(D.ind[NM.indexOf(name)], D.rf);
          const i0 = clamp(idxOf(y0.value, 1), 0, n - 24), i1 = Math.min(n, i0 + len.value * 12), r = ols(y, [mk], i0, i1);
          const pts = []; for (let i = i0; i < i1; i++) pts.push([mk[i], y[i]]);
          X.dots(pts, { r: 2.6, color: 'accent', alpha: 0.55 });
          X.line(-0.25, r.b[0] + r.b[1] * -0.25, 0.25, r.b[0] + r.b[1] * 0.25, { color: 'orange', width: 2.4 });
          X.hline(0, { color: 'muted', width: 1, alpha: 0.5 }); X.vline(0, { color: 'muted', width: 1, alpha: 0.5 });
          X.corner(`slope = β̂ = ${fx(r.b[1], 2)}`, 'tl', { color: 'orange', size: 12.5, weight: 700 });
          const roll = rolling(name);
          Rl.vband(1963.5 + (i0 + 0.5) / 12, 1963.5 + (i1 - 0.5) / 12, { color: 'orange', alpha: 0.15 });
          Rl.hline(1, { color: 'muted', width: 1, dash: true });
          Rl.path(roll, { color: 'accent', width: 2 });
          Rl.dot(1963.5 + (i0 + i1) / 24, r.b[1], { r: 6, color: 'orange' });
          const vm = sdev(mk, i0, i1) ** 2, sys = r.b[1] ** 2 * vm;
          st = { r, name, i0, i1, sys, idio: r.s ** 2, tot: sdev(y, i0, i1) ** 2 };
        });
        v.legend([['accent', 'monthly excess returns', { dot: true }], ['orange', 'least-squares line / your window'], ['accent', 'rolling 60-month beta']]);
        v.readout(() => {
          if (!st) return '';
          const { r } = st;
          return `${st.name} (${IND_LONG[st.name]}), ${monthLabel(st.i0)} – ${monthLabel(st.i1 - 1)}, ${r.n} months: β̂ = ${fx(r.b[1], 2)} ± ${fx(r.se[1], 2)}, α̂ = ${fx(1200 * r.b[0], 1)}% a year (t = ${fx(r.t[0], 1)}), $R^2$ = ${fx(r.r2, 2)}\nvolatility ${pct(Math.sqrt(12 * st.tot), 1)} a year = systematic ${pct(Math.sqrt(12 * st.sys), 1)} (market-driven) combined with idiosyncratic ${pct(Math.sqrt(12 * st.idio), 1)}; the market part explains ${fx(100 * r.r2, 0)}% of the variance`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Jensen’s alpha',
      statement: String.raw`**Jensen's alpha** of a portfolio or fund $i$ is the intercept in the regression of its excess return on the market's,
$$\alpha_i=E[r_i]-r_f-\beta_i\bigl(E[r_M]-r_f\bigr),$$
the vertical distance of the fund above (or below) the security market line. In the CAPM every alpha is zero; a positive alpha is return in excess of what the fund's market risk deserves. An estimate $\hat\alpha$ from $T$ months has standard error of order $\sigma_\varepsilon/\sqrt T$, so it is distinguishable from zero only when its $t$-statistic is large.

Scope: a measure of performance *relative to the one-factor benchmark*; it is only as meaningful as the benchmark (fin-4.9 and fin-4.7 show why the choice matters).`,
      idea: String.raw`Jensen (1968) proposed measuring a fund's performance by the intercept of the regression of its excess return on the market's excess return, and applied it to 115 open-end mutual funds over 1945–1964, finding that on average they did not beat a buy-the-market-and-hold policy, even before management expenses. The statistical lesson is general: an alpha is a small intercept estimated against a large amount of idiosyncratic noise, so luck alone produces a crowd of "significant" alphas when many funds are examined.`,
      caption: String.raw`**Left**: the ten industry portfolios (real data, the window of your choice) against the security market line through the origin with the market's own premium; the vertical gap is each portfolio's $\hat\alpha$, drawn red when it is more than two standard errors from zero (grey whiskers = ±2 s.e.). **Right**: a *simulation*, not fund data: 800 funds with market beta near 1 and tracking error 2–6% a year, run on the market returns of the same window; a share of them truly has the alpha you choose, the rest has zero. The histogram shows their $t$-statistics. Shorten the window and many zero-alpha funds look "significant"; lengthen it and the genuinely skilled stand out.`,
      deps: ['fin-4.3'],
      refs: ['BKM ch. 9'],
      tags: ['alpha', 'performance', 'statistics'],
      credit: 'Michael C. Jensen, 1968',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jensen%27s_alpha' },
      viz(v) {
        const D = data(), NM = ['NoDur', 'Durbl', 'Manuf', 'Enrgy', 'HiTec', 'Telcm', 'Shops', 'Hlth', 'Utils', 'Other'], n = D.n;
        const T = v.slider('months of data', 24, 480, 120, { int: true });
        const endS = v.slider('window ends in', 1975, 2026, 2026, { int: true, fmt: (x) => String(x) });
        const frac = v.slider('share of funds with real skill', 0, 0.4, 0.1, { step: 0.01, fmt: (x) => pct(x, 0) });
        const skill = v.slider('their true alpha (a year)', 0, 0.05, 0.02, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const L = v.stage({ x: [0.4, 1.5], y: [0, 0.14], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 290, xlabel: 'beta', ylabel: 'average excess return (a year)', title: 'ten industry portfolios against the security market line' });
        const H = v.stage({ x: [-6, 6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 't-statistic of $\\hat\\alpha$', ylabel: 'funds', title: 'simulated funds: how many look skilled?' });
        let st = null;
        v.render(() => {
          const i1 = endS.value >= 2026 ? n : Math.min(n, idxOf(endS.value, 12) + 1), i0 = Math.max(0, i1 - T.value), mk = D.mkt;
          const prem = 12 * mean(mk, i0, i1);
          const rows = NM.map((nm, j) => { const r = ols(excess(D.ind[j], D.rf), [mk], i0, i1); return { nm, beta: r.b[1], er: 12 * mean(excess(D.ind[j], D.rf), i0, i1), a: 12 * r.b[0], sea: 12 * r.se[0], t: r.t[0] }; });
          const bmin = Math.min(...rows.map((r) => r.beta)), bmax = Math.max(...rows.map((r) => r.beta));
          const lo = Math.min(0.4, bmin - 0.1), hi = Math.max(1.5, bmax + 0.35);
          const ymax = Math.max(0.12, ...rows.map((r) => r.er)) * 1.25, ymin = Math.min(0, ...rows.map((r) => r.er)) - 0.02;
          L.setView([lo, hi], [ymin, ymax]);
          L.line(lo, lo * prem, hi, hi * prem, { color: 'green', width: 2.2 });
          L.corner('security market line: slope ' + pct(prem, 1), 'tl', { color: 'green', size: 11.5, weight: 700 });
          rows.forEach((r) => {
            const sigf = Math.abs(r.t) > 2, base = r.beta * prem;
            L.line(r.beta, base + r.a - 2 * r.sea, r.beta, base + r.a + 2 * r.sea, { color: 'muted', width: 1.4 });
            L.line(r.beta, base, r.beta, r.er, { color: sigf ? 'red' : 'orange', width: 2.2 });
            L.dot(r.beta, r.er, { r: 5, color: sigf ? 'red' : 'accent' });
          });
          fanLabels(L, rows.map((r) => ({ x: r.beta, y: r.er, text: r.nm, color: v.color('muted') })), { leader: v.color('faint') });
          // simulation of funds on the same market returns
          const rn = rng(11), NF = 800, bins = new Array(48).fill(0); let fp = 0, tp = 0, nSk = 0, nUn = 0, sigPos = 0;
          for (let f = 0; f < NF; f++) {
            const skilled = rn() < frac.value, beta = 0.85 + 0.3 * rn(), te = (0.02 + 0.04 * rn()) / Math.sqrt(12);
            const y = new Float64Array(i1 - i0); for (let i = i0; i < i1; i++) y[i - i0] = beta * mk[i] + (skilled ? skill.value / 12 : 0) + te * rn.normal();
            const r = ols(y, [mk.subarray(i0, i1)], 0, i1 - i0), t = r.t[0];
            const b = Math.floor((clamp(t, -5.999, 5.999) + 6) * 4); bins[b]++;
            if (skilled) { nSk++; if (t > 2) tp++; } else { nUn++; if (t > 2) fp++; }
            if (t > 2) sigPos++;
          }
          const mxb = Math.max(...bins); H.setView([-6, 6], [0, mxb * 1.15]);
          bins.forEach((c, b) => H.rect(-6 + b / 4, 0, -6 + (b + 1) / 4 - 0.02, c, { fill: -6 + b / 4 >= 2 ? 'green' : -6 + (b + 1) / 4 <= -2 ? 'red' : 'accent', fillAlpha: 0.7, color: 'faint', width: 0.5 }));
          H.vline(2, { color: 'green', width: 1.5, dash: true }); H.vline(-2, { color: 'red', width: 1.5, dash: true });
          st = { i0, i1, rows, fp, tp, nSk, nUn, sigPos, prem };
        });
        v.legend([['red', 'α significant at about 5%'], ['orange', 'α not distinguishable from zero'], ['green', 'simulated funds with t > 2', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const k = st.rows.filter((r) => Math.abs(r.t) > 2).length;
          return `${monthLabel(st.i0)} – ${monthLabel(st.i1 - 1)} (${st.i1 - st.i0} months): ${k} of the 10 industry portfolios have |t| > 2; their alphas: ${st.rows.map((r) => `${r.nm} ${sg(r.a * 100, 1)}`).join(', ')} (% a year)\nsimulation: ${st.sigPos} of 800 funds show t > 2, but ${st.fp} of them (${st.sigPos ? fx((100 * st.fp) / st.sigPos, 0) : '0'}%) have no skill at all; only ${st.tp} of ${st.nSk} truly skilled funds are detected (${st.nSk ? fx((100 * st.tp) / st.nSk, 0) : '0'}%)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'The single-index model',
      statement: String.raw`The **single-index model** (Sharpe, 1963) writes each excess return as $r_i=\alpha_i+\beta_i r_M+\varepsilon_i$ with the residuals $\varepsilon_i$ uncorrelated with the index and with one another. It then implies a covariance matrix with a very simple structure,
$$\sigma_{ij}=\beta_i\beta_j\sigma_M^2\ (i\ne j),\qquad \sigma_{ii}=\beta_i^2\sigma_M^2+\sigma_{\varepsilon_i}^2 ,$$
so that $n$ assets need only $2n+1$ estimated numbers ($\beta_i$, $\sigma_{\varepsilon_i}^2$, $\sigma_M^2$) instead of the $n(n+1)/2$ distinct entries of a full covariance matrix (for $n=50$: 101 against 1,275).

Scope: a *model*; the assumption of uncorrelated residuals is false in real data (industries co-move beyond the market), so the model trades some bias for a large reduction in estimation noise.`,
      idea: String.raw`The covariance matrix of $n$ assets estimated from $T$ monthly observations has $n(n+1)/2$ entries each with sampling error, and it is singular if $T\le n$; an optimiser (fin-3.7, fin-3.13) loves to exploit those errors. Forcing the structure $\beta\beta^{\!\top}\sigma_M^2+\operatorname{diag}(\sigma_\varepsilon^2)$ throws away real correlations (the residual correlation within industries, size and value groups) but estimates far fewer numbers, and the trade is often a good one — the same bias–variance trade as in regression. Whether it wins depends on how large $T$ is relative to $n$ and on how well one factor describes the assets.`,
      caption: String.raw`Real data: the 25 portfolios formed on size and book-to-market (value-weighted monthly returns), excess of the T-bill rate. **Left**: each point is one pair of portfolios: its covariance as estimated from the sample (horizontal) against the single-index prediction (vertical); the diagonal means a perfect match. **Right**: the annualised out-of-sample volatility of the *global minimum-variance portfolio* built (a) from the full sample covariance, (b) from the single-index covariance and (c) equal-weighted 1/N, averaged over every 12th month as a start date since 1963; the estimation window is the **months** slider and **the selected window** ends in the year you pick. With a short window relative to the 25 portfolios (30–48 months) the noisy sample covariance loses to the single-index one; with 10–20 years of data the sample covariance wins, because the residual correlations the index model assumes away are real.`,
      deps: ['fin-4.3'],
      refs: ['BKM ch. 8'],
      tags: ['index model', 'covariance', 'estimation'],
      credit: 'William F. Sharpe, 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Single-index_model' },
      viz(v) {
        const D = data(), n = D.n, K = 25, NPer = 60;
        const Tm = v.slider('estimation window (months)', 30, 240, 36, { int: true });
        const ey = v.slider('selected window ends in', 1970, 2020, 2000, { int: true, fmt: (x) => String(x) });
        const ex = D.p25.map((p) => excess(p, D.rf));
        const fit = (i0, i1) => {
          const mk = D.mkt, vm = sdev(mk, i0, i1) ** 2, mm = mean(mk, i0, i1);
          const mu = ex.map((r) => mean(r, i0, i1)), S = [], beta = [], ev = [];
          for (let a = 0; a < K; a++) { S.push(new Array(K).fill(0)); }
          for (let a = 0; a < K; a++) for (let b = a; b < K; b++) { let s = 0; for (let i = i0; i < i1; i++) s += (ex[a][i] - mu[a]) * (ex[b][i] - mu[b]); S[a][b] = S[b][a] = s / (i1 - i0 - 1); }
          for (let a = 0; a < K; a++) { let c = 0; for (let i = i0; i < i1; i++) c += (ex[a][i] - mu[a]) * (mk[i] - mm); const b = c / (i1 - i0 - 1) / vm; beta.push(b); ev.push(Math.max(1e-7, S[a][a] - b * b * vm)); }
          const I = beta.map((bi, a) => beta.map((bj, b) => (a === b ? bi * bi * vm + ev[a] : bi * bj * vm)));
          return { S, I, beta, vm };
        };
        const gmv = (S) => { const z = solveLin(S, new Array(K).fill(1)); if (!z) return null; const t = z.reduce((a, b) => a + b, 0); return z.map((x) => x / t); };
        const realized = (w, i0, i1) => { const r = new Float64Array(i1 - i0); for (let i = i0; i < i1; i++) { let s = 0; for (let a = 0; a < K; a++) s += w[a] * ex[a][i]; r[i - i0] = s; } return Math.sqrt(12) * sdev(r); };
        const Sc = v.stage({ x: [-0.002, 0.014], y: [-0.002, 0.014], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'sample covariance (monthly)', ylabel: 'single-index covariance', title: 'the 300 covariances: sample against index' });
        const Bc = v.stage({ x: [0.4, 3.6], y: [0, 0.3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'method', ylabel: 'out-of-sample volatility of the minimum-variance portfolio', xticks: [[1, 'sample cov.'], [2, 'index model'], [3, 'equal weights']], yticks: pctTicks(0, 0.3, 0.05), title: 'does the simplification help?' });
        let st = null;
        const memo = new Map();
        const roll = (T) => {
          if (memo.has(T)) return memo.get(T);
          const acc = [0, 0, 0], cnt = [0, 0, 0], ew = new Array(K).fill(1 / K);
          for (let e = T; e + NPer <= n; e += 12) {
            const f = fit(e - T, e), w1 = gmv(f.S), w2 = gmv(f.I);
            if (w1) { acc[0] += realized(w1, e, e + NPer); cnt[0]++; }
            if (w2) { acc[1] += realized(w2, e, e + NPer); cnt[1]++; }
            acc[2] += realized(ew, e, e + NPer); cnt[2]++;
          }
          const r = acc.map((a, i) => (cnt[i] ? a / cnt[i] : NaN)); memo.set(T, r); return r;
        };
        v.render(() => {
          const T = Tm.value, e1 = Math.min(n - NPer, idxOf(ey.value, 12) + 1), e0 = Math.max(0, e1 - T);
          const f = fit(e0, e1), pts = [];
          for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) pts.push([f.S[a][b], f.I[a][b]]);
          Sc.line(-0.002, -0.002, 0.014, 0.014, { color: 'muted', width: 1.2, dash: true });
          Sc.dots(pts, { r: 2.6, color: 'accent', alpha: 0.6 });
          const sse = pts.reduce((s, p) => s + (p[0] - p[1]) ** 2, 0), sst = pts.reduce((s, p) => s + p[0] ** 2, 0);
          const avg = roll(T), w1 = gmv(f.S), w2 = gmv(f.I), ew = new Array(K).fill(1 / K);
          const sel = [w1 ? realized(w1, e1, e1 + NPer) : NaN, w2 ? realized(w2, e1, e1 + NPer) : NaN, realized(ew, e1, e1 + NPer)];
          const top = Math.max(0.1, ...avg.filter((x) => x === x), ...sel.filter((x) => x === x)) * 1.15; Bc.setView([0.4, 3.6], [0, top]);
          avg.forEach((a, i) => { if (a === a) Bc.rect(i + 1 - 0.3, 0, i + 1 + 0.3, a, { fill: ['red', 'green', 'muted'][i], fillAlpha: 0.7, color: ['red', 'green', 'muted'][i], width: 1 }); });
          sel.forEach((a, i) => { if (a === a) Bc.dot(i + 1, a, { r: 6, color: 'gold' }); });
          st = { avg, sel, T, e0, e1, nz: 1 - sse / sst, w1 };
        });
        v.legend([['accent', 'one pair of portfolios', { dot: true }], ['red', 'sample-covariance GMV (average)', { area: true }], ['green', 'index-model GMV (average)', { area: true }], ['gold', 'the selected window', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f2 = (x) => (x === x ? pct(x, 1) : 'n/a');
          return `parameters for n = 25: ${25 * 26 / 2} distinct covariances in the full matrix against ${2 * 25 + 1} in the index model (n = 50: 1,275 against 101)\naverage out-of-sample σ of the minimum-variance portfolio (each estimated on ${st.T} months, tested on the next ${NPer}): sample covariance ${f2(st.avg[0])}, single-index ${f2(st.avg[1])}, equal weights ${f2(st.avg[2])}\nthe selected window (${monthLabel(st.e0)} – ${monthLabel(st.e1 - 1)}): ${f2(st.sel[0])}, ${f2(st.sel[1])}, ${f2(st.sel[2])} — the index structure reproduces ${fx(100 * st.nz, 0)}% of the sample covariances' squared size; the rest is the residual correlation the model assumes away`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Arbitrage pricing theory (Ross)',
      statement: String.raw`Suppose returns follow a $K$-factor model, $r_i=E[r_i]+\sum_k b_{ik}F_k+\varepsilon_i$, with $E[F_k]=0$ and residuals $\varepsilon_i$ uncorrelated across assets, in an economy with many assets. If there is no arbitrage (no zero-cost portfolio with no risk and a positive payoff), then the expected returns satisfy, to a small approximation error for all but a few assets,
$$E[r_i]\;\approx\;\lambda_0+\sum_{k=1}^{K}b_{ik}\lambda_k ,$$
with the same $\lambda_0,\lambda_1,\dots,\lambda_K$ (the zero-beta rate and the factor risk premia) for every asset. For well-diversified portfolios, whose residual risk is negligible, the relation holds exactly: expected return is an affine function of the factor loadings. Nothing is said about the market portfolio, investors' preferences or mean–variance efficiency.

Scope: an asymptotic result in the number of assets (Ross, 1976); with few assets the pricing error is bounded in a mean-square sense, not assetwise. The theory does not identify the factors.`,
      idea: String.raw`Take any three well-diversified portfolios with different loadings on two factors and put the plane through their (loading, expected return) points. A fourth portfolio $D$ whose point is off the plane can be replicated, factor risk and all, by a combination of the three (the weights solve three linear equations), and the replicating portfolio costs the same but has a different expected return. Buying the cheaper of $D$ and the replica and selling the other costs nothing, has zero factor exposure, and, once the residual risk has been diversified, a certain profit. This is the law of one price (fin-1.13) in the language of the single-index model (fin-4.5): factor exposures are the only priced risks.`,
      caption: String.raw`Two factors, four well-diversified portfolios. **Left**: drag A, B, C, D in the plane of factor loadings $(b_1,b_2)$. **Middle**: expected return of each against the value the plane through A, B and C assigns; D sits on the diagonal only if its expected return (slider) equals the plane. **Right**: the arbitrage portfolio — long D and short its replica, weights shown — has zero loadings and a profit equal to the gap. The **number of stocks per portfolio** controls the residual risk left in it ($\sigma_\varepsilon=30\%$ a stock in this illustration): with few stocks the "arbitrage" can still lose; with many it is risk-free. (Illustration with invented numbers.)`,
      deps: ['fin-4.5', 'fin-1.13'],
      refs: ['Luenberger: Models and Data', 'BKM ch. 10'],
      tags: ['arbitrage', 'factor models', 'APT'],
      credit: 'Stephen A. Ross, 1976',
      scope: String.raw`An asymptotic no-arbitrage result; approximate for individual assets, exact for well-diversified portfolios in a factor model with uncorrelated residuals.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arbitrage_pricing_theory' },
      viz(v) {
        const PL = ['A', 'B', 'C', 'D'], ED = [0.10, 0.09, 0.11];
        const eS = v.slider('expected return of D', 0.06, 0.14, 0.105, { step: 0.0005, fmt: (x) => pct(x, 2) });
        const nS = v.slider('stocks in each portfolio', 5, 5000, 400, { int: true, log: true, sig: 2 });
        const Lp = v.stage({ x: [0, 1.6], y: [0, 1.6], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'loading on factor 1', ylabel: 'loading on factor 2', title: 'factor loadings' });
        const Ep = v.stage({ x: [0.06, 0.14], y: [0.06, 0.14], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'return implied by the plane', ylabel: 'actual expected return', xticks: pctTicks(0.06, 0.14, 0.02), yticks: pctTicks(0.06, 0.14, 0.02), title: 'pricing by the plane' });
        const Wp = v.stage({ x: [0.4, 4.6], y: [-3, 3], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 220, xlabel: 'portfolio', ylabel: 'weight', xticks: PL.map((p, i) => [i + 1, p]), title: 'the arbitrage portfolio' });
        const start = [[1.2, 0.3], [0.4, 1.1], [0.9, 0.9], [0.8, 0.7]], col = ['blue', 'orange', 'purple', 'gold'];
        const hs = start.map((p, i) => Lp.handle(p[0], p[1], { color: col[i], label: PL[i], constrain: { x: [0.05, 1.55], y: [0.05, 1.55] } }));
        let st = null;
        v.render(() => {
          const b = hs.map((h) => [h.x, h.y]);
          const A3 = [0, 1, 2].map((i) => [1, b[i][0], b[i][1]]), lam = solveLin(A3, ED);
          if (!lam) { Lp.corner('A, B, C are collinear: they do not span a plane', 'tl', { color: 'red', size: 12, weight: 700 }); st = null; return; }
          const fit = lam[0] + lam[1] * b[3][0] + lam[2] * b[3][1];
          // draw the triangle and iso-expected-return lines
          Lp.poly([b[0], b[1], b[2]], { fill: 'faint', fillAlpha: 0.12, color: 'muted', width: 1.2 });
          for (let e = 0.06; e <= 0.1401; e += 0.01) { if (Math.abs(lam[1]) + Math.abs(lam[2]) < 1e-9) break; const pts = []; for (let x = 0; x <= 1.6; x += 0.8) pts.push([x, (e - lam[0] - lam[1] * x) / lam[2]]); Lp.path(pts, { color: 'faint', width: 1, alpha: 0.5 }); }
          Lp.text('lines of equal expected return', 1.58, 0.1, { align: 'right', size: 10.5, color: 'muted' });
          // replica of D by A, B, C: same loadings, weights sum to 1
          const wr = solveLin([[1, 1, 1], [b[0][0], b[1][0], b[2][0]], [b[0][1], b[1][1], b[2][1]]], [1, b[3][0], b[3][1]]);
          const arb = [1, ...wr.map((x) => -x)];
          const gap = eS.value - fit, sign = gap >= 0 ? 1 : -1, w = arb.map((x) => sign * x);
          Ep.line(0.06, 0.06, 0.14, 0.14, { color: 'green', width: 2 });
          [0, 1, 2].forEach((i) => { Ep.dot(ED[i], ED[i], { r: 5, color: col[i] }); Ep.text(PL[i], ED[i], ED[i], { dx: 7, dy: 12, align: 'left', size: 12, color: col[i], weight: 700 }); });
          Ep.dot(fit, clamp(eS.value, 0.06, 0.14), { r: 7, color: 'gold' }); Ep.text('D', fit, clamp(eS.value, 0.06, 0.14), { dx: 9, dy: -2, align: 'left', size: 12.5, color: 'gold', weight: 700 });
          if (Math.abs(gap) > 0.0005) Ep.line(fit, fit, fit, clamp(eS.value, 0.06, 0.14), { color: 'red', width: 2 });
          const mx = Math.max(1.5, ...w.map(Math.abs)) * 1.15; Wp.setView([0.4, 4.6], [-mx, mx]);
          w.forEach((x, i) => Wp.rect(i + 1 - 0.3, 0, i + 1 + 0.3, x, { fill: x >= 0 ? 'green' : 'red', fillAlpha: 0.7, color: x >= 0 ? 'green' : 'red', width: 1 }));
          Wp.hline(0, { color: 'muted', width: 1 });
          const sdRes = (0.30 / Math.sqrt(nS.value)) * Math.sqrt(w.reduce((s, x) => s + x * x, 0)), profit = Math.abs(gap);
          st = { gap, w, sdRes, profit, fit, lam, pLoss: 0.5 * (1 + erf(-profit / (sdRes * Math.SQRT2))) };
        });
        v.legend([['blue', 'A', { dot: true }], ['orange', 'B', { dot: true }], ['purple', 'C', { dot: true }], ['gold', 'D', { dot: true }], ['green', 'weights > 0', { area: true }], ['red', 'weights < 0', { area: true }]]);
        v.readout(() => {
          if (!st) return 'move A, B, C apart';
          return `plane through A, B, C: $E=${fx(100 * st.lam[0], 2)}\\%+${fx(100 * st.lam[1], 2)}\\%\\,b_1+${fx(100 * st.lam[2], 2)}\\%\\,b_2$ → price for D = ${pct(st.fit, 2)} against actual ${pct(eS.value, 2)}; gap ${sg(100 * st.gap, 2)} pts\n${Math.abs(st.gap) < 5e-4 ? '**D is priced by the plane: no arbitrage**' : `arbitrage ${st.gap > 0 ? 'long D, short the replica' : 'short D, long the replica'}: cost 0, factor exposure 0, expected profit ${pct(st.profit, 2)} of each unit of D; residual risk ${pct(st.sdRes, 2)} with ${nS.value} stocks per portfolio, so the chance of a loss is ${fx(100 * st.pLoss, 1)}%`}`;
        });
        function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
      },
    },
  ],
};
