// Macroeconomics — Chapter 3 (part b): convergence, growth accounting and the growth puzzles (items 3.8–3.13)
import { clamp, pc, fx, ols, olsMulti, sgn, rkPath, at, rows, GA_PWT, XS_PWT, IT_US, NAMES, growthAccounting } from './ch03.shared.js';

const GA = rows(GA_PWT, 7); // country, year, rgdpna, rnna, emp, hc, labsh
const XS = rows(XS_PWT.flat(), 10); // code, name, y60, y19, s, n, hc60, hc19, oecd, irr
const IT = rows(IT_US, 3); // year, IT investment % of GDP, BLS TFP index

export default {
  collection: 'macro',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Theorem', name: 'Speed of convergence',
      statement: String.raw`In the Solow model with Cobb–Douglas technology, population growth $n$, labour-augmenting progress $g$ and depreciation $\delta$, let $\hat k$ be capital per effective worker with steady state $\hat k^*$. Near the steady state the gap closes exponentially:
$$\hat k(t) - \hat k^* \approx \big(\hat k(0) - \hat k^*\big)\,e^{-\lambda t},\qquad \lambda = (1-\alpha)(n+g+\delta).$$
The same rate applies to output per effective worker. For $\alpha = 1/3$ and $n+g+\delta$ of about $6$–$7\%$ the model implies about $4$–$5\%$ a year, a half-life of 15 years or less.

Empirically, regressions across regions and countries typically find a rate of about $2\%$ a year (half-life about 35 years); matching it in the model would require a capital share far above one third.

Scope: a statement about the *linearization* — for large gaps the exact path is faster at first, as the figure shows.`,
      idea: String.raw`Write $\dot{\hat k} = g(\hat k) = s\hat k^{\alpha} - (n+g+\delta)\hat k$. At the steady state $g(\hat k^*)=0$, and by Taylor's theorem with the first-order term (pma-5.15) $g(\hat k)\approx g'(\hat k^*)(\hat k-\hat k^*)$ with $g'(\hat k^*) = \alpha(n+g+\delta) - (n+g+\delta) = -(1-\alpha)(n+g+\delta)$, using $s\hat k^{*\alpha-1} = n+g+\delta$. A linear equation $\dot x=-\lambda x$ has the solution $e^{-\lambda t}$: this is the stability of macro-3.3 turned into a number.`,
      caption: String.raw`**Left:** the law of motion $\dot{\hat k}$ with its tangent at the steady state (slope $-\lambda$); drag the **gold handle** to choose the starting gap. **Right:** the fraction of the initial gap still open, on a log axis, so exponential decay is a straight line: exact path (blue), linear approximation (green), and the empirical 2% a year (red dashed). Change $\alpha$ to see what it takes for the model to be as slow as the data.`,
      deps: ['macro-3.3', 'pma-5.15'], refs: ['Romer ch. 1'], tags: ['growth', 'convergence'],
      scope: String.raw`Linearization of the Cobb–Douglas Solow model; the empirical 2% is a summary of regressions (e.g. Barro and Sala-i-Martin 1992 for U.S. states and regions), not a constant of nature.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow%E2%80%93Swan_model' },
      viz(v) {
        const aS = v.slider('capital share $\\alpha$', 0.15, 0.9, 0.33, { step: 0.01 });
        const nS = v.slider('population growth $n$', 0, 0.03, 0.01, { step: 0.001 });
        const gS = v.slider('technology growth $g$', 0, 0.04, 0.02, { step: 0.001 });
        const dS = v.slider('depreciation $\\delta$', 0.01, 0.1, 0.04, { step: 0.001 });
        const L = v.stage({ x: [0, 10], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'capital per effective worker', ylabel: 'growth of capital per effective worker', title: 'law of motion and its tangent' });
        const R = v.stage({ x: [0, 100], y: [1e-3, 1.5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'years', ylabel: 'share of the initial gap still open', title: 'closing the gap' });
        const h = L.handle(0.3, 0, { color: 'gold', label: 'k̂₀', constrain: (x) => [Math.max(0.02, x), 0] });
        const M_deriv = (f, x) => (f(x + 1e-5 * x) - f(x - 1e-5 * x)) / (2e-5 * x);
        let st = null;
        v.render(() => {
          const a = aS.value, nn = nS.value + gS.value + dS.value, lam = (1 - a) * nn, s = 0.2;
          const ks = (s / nn) ** (1 / (1 - a)), g = (k) => s * k ** a - nn * k, kmax = 2.4 * ks;
          L.setView([0, kmax], [-0.6 * g(0.3 * ks) * 1.5, g(0.3 * ks) * 1.5]);
          L.hline(0, { color: 'ink' });
          L.fn(g, { color: 'accent', width: 2.8, domain: [0.005, kmax], n: 300 });
          L.line(0, lam * ks, kmax, lam * ks - lam * kmax, { color: 'green', width: 1.8, dash: [6, 4] });
          L.dot(ks, 0, { r: 6, color: 'gold' });
          L.text('tangent: slope −λ', ks, -0.2 * g(0.3 * ks), { dx: 10, align: 'left', color: 'green', weight: 700, size: 12 });
          const k0 = clamp(h.x, 0.02, kmax); h.set(k0, 0);
          // gap measured in output per effective worker y = k^a
          const T = 100, path = rkPath(g, k0, T, 0.25), ys = ks ** a, gap0 = k0 ** a - ys;
          const gapAt = (t) => Math.max(1e-6, Math.abs((at(path, t) ** a - ys) / gap0));
          R.fn((t) => Math.exp(-0.02 * t), { color: 'red', width: 2, dash: [6, 4], domain: [0, T] });
          R.fn((t) => Math.exp(-lam * t), { color: 'green', width: 2.2, domain: [0, T] });
          R.fn(gapAt, { color: 'accent', width: 2.8, domain: [0, T], n: 300 });
          R.hline(0.5, { color: 'faint', dash: [3, 3] });
          R.text('exact', 40, gapAt(40), { dy: -10, color: 'accent', weight: 700 });
          const lnum = -M_deriv(g, ks);
          st = { lam, lnum, half: Math.log(2) / lam, aNeed: 1 - 0.02 / nn, nn, exact: path.find((p) => Math.abs((p[1] ** a - ys) / gap0) <= 0.5)?.[0] };
        });
        v.legend([['accent', 'exact path'], ['green', 'linearization e^(−λt)'], ['red', '2% a year (empirical)', { dash: true }]]);
        v.readout(() => st && `$\\lambda = (1-\\alpha)(n+g+\\delta) = ${fx(1 - aS.value, 2)}\\times${fx(st.nn, 3)} = ${pc(st.lam, 2)}$ a year (numerical $-g'(\\hat k^*)$ = ${pc(st.lnum, 2)}); half-life ${fx(st.half, 1)} years${st.exact ? `, exact path ${fx(st.exact, 1)} years` : ''}. To be as slow as the roughly 2% found in the data the model needs $\\alpha = 1 - 0.02/(n+g+\\delta) = ${fx(st.aNeed, 2)}$, far above the capital share of about one third.`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Method', name: 'Growth accounting and the Solow residual',
      statement: String.raw`Take an aggregate production function $Y = A\,F(K, L)$ with constant returns to scale and competitive factor payments, so that the elasticity of output with respect to capital is capital's income share $\alpha$ and with respect to labour $1-\alpha$. Differentiating logarithms in time gives the exact decomposition
$$\frac{\dot Y}{Y} = \alpha\,\frac{\dot K}{K} + (1-\alpha)\,\frac{\dot L}{L} + \frac{\dot A}{A},$$
and the **Solow residual** $\dot A/A$ is whatever output growth is not explained by measured growth in inputs, weighted by their income shares. Splitting labour into employment and a human-capital index gives one more term.

Scope: a measurement identity, not a causal theory: the residual is "total factor productivity" only if inputs are correctly measured, factors are paid their marginal products and returns to scale are constant; it also absorbs measurement error.`,
      idea: String.raw`With Cobb–Douglas technology (macro-2.1) the logarithm of output is a weighted sum of the logarithms of inputs plus $\ln A$; differentiating in time gives the displayed sum, and the weights can be read off national accounts as the shares of income paid to capital and labour. For U.S. private non-farm output per hour over 1909–1949, Solow (1957, p. 316) attributed roughly seven eighths of the increase to the shift in the production function. This historical calculation used his particular input and utilization measures; the modern chart below is a separate illustration. Applied to several countries, the residual explains very different fractions of growth.`,
      caption: String.raw`Pick a **country**. Each bar is an interval of annual log growth in real GDP (PWT 10.0; the final interval is nine years), split into the contribution of capital $\alpha\,g_K$ (orange), employment (blue), human capital per worker (teal) and the residual (gold); the black dot is total output growth. Choose whether the capital share is PWT's measured $1 - $ labour share or a fixed $1/3$.`,
      deps: ['macro-2.1'], refs: ['Solow (1957), Technical Change and the Aggregate Production Function, pp. 312–316; https://economicstrategy.org/wp-content/uploads/2013/10/Solow1957.pdf', 'Feenstra, Inklaar & Timmer (2015); PWT 10.0, CC BY 4.0; https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt100'], tags: ['growth', 'measurement'],
      credit: 'Robert Solow, 1957',
      scope: String.raw`Finite-interval log decomposition with endpoint-average factor shares, a Törnqvist-style approximation to continuous growth accounting. Labour input is employment times PWT's human-capital index; hours and utilization are not controlled. The residual absorbs omitted inputs and measurement error. Full-period rates weight intervals by years.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow_residual' },
      viz(v) {
        const cs = Object.keys(NAMES);
        const sel = v.select('country', cs.map((c) => ({ value: c, label: NAMES[c] })), 'USA');
        const wt = v.select('capital share', [{ value: 'pwt', label: '1 − labour share (PWT)' }, { value: 'third', label: 'fixed 1/3' }], 'pwt');
        const S = v.stage({ x: [0, 6], y: [-0.02, 0.1], axes: 'box', gutter: true, height: 360, full: true, xlabel: 'period', ylabel: 'growth of real GDP per year (0.02 = 2%)', xticks: [[0.5, '1960–70'], [1.5, '1970–80'], [2.5, '1980–90'], [3.5, '1990–2000'], [4.5, '2000–10'], [5.5, '2010–19']], title: 'where growth came from' });
        let st = null;
        v.render(() => {
          const c = sel.value, R = GA.filter((r) => r[0] === c);
          const {out,mean,lo,hi} = growthAccounting(R,wt.value==='third'?1/3:null);
          S.setView([0, 6], [Math.min(-0.01,lo) - 0.005, Math.max(0.05,hi) * 1.08]);
          S.hline(0, { color: 'ink' });
          out.forEach((o, i) => {
            let pos = 0, neg = 0;
            for (const [val, col] of [[o.cap, 'orange'], [o.lab, 'accent'], [o.hc, 'teal'], [o.tfp, 'gold']]) {
              const y0 = val >= 0 ? pos : neg, y1 = y0 + val; if (val >= 0) pos = y1; else neg = y1;
              S.rect(i + 0.18, y0, i + 0.82, y1, { fill: col, fillAlpha: 0.75, color: col });
            }
            S.dot(i + 0.5, o.gY, { r: 6, color: 'ink' });
          });
          st = { out, mean, c };
        });
        v.legend([['orange', 'capital α·g_K'], ['accent', 'employment (1−α)·g_L'], ['teal', 'human capital (1−α)·g_h'], ['gold', 'Solow residual (TFP)'], ['ink', 'GDP growth', { dot: true }]]);
        v.readout(() => st && `${NAMES[st.c]}: mean log GDP growth ${pc(st.mean.gY, 1)} a year over 1960–2019, of which capital accumulation ${pc(st.mean.cap, 1)} and the residual ${pc(st.mean.tfp, 1)} (${st.mean.gY > 0 ? fx((100 * st.mean.tfp) / st.mean.gY, 0) : '—'}% of growth). By decade the residual ranges from ${pc(Math.min(...st.out.map((o) => o.tfp)), 1)} to ${pc(Math.max(...st.out.map((o) => o.tfp)), 1)}. Capital share used: ${st.out.map((o) => fx(o.al, 2)).join(', ')}. The accounting identity holds exactly by construction: the bars sum to the black dot.`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Hypothesis', name: 'Conditional versus absolute convergence',
      statement: String.raw`**Absolute convergence:** poor countries grow faster than rich ones regardless of anything else, so a regression of average growth on initial log income has a negative slope. **Conditional convergence:** each country converges to *its own* steady state, set by its saving rate, population growth and human capital, so growth is negatively related to initial income only *after controlling for these determinants*:
$$\tfrac1T\ln\frac{y_T}{y_0} = a - b\ln y_0 + c_1\ln s + c_2\ln(n+g+\delta) + c_3\ln h + \varepsilon,\qquad b>0 .$$
The Solow model predicts conditional convergence and says nothing about absolute convergence unless countries share the same fundamentals.

Scope: an empirical hypothesis. In samples of broadly similar economies (current OECD members, U.S. states) absolute convergence appears; across all countries it is weak or absent in the data below.`,
      idea: String.raw`In macro-3.8 the growth of a country at $\hat k$ below its own steady state is $\lambda$ times the gap to *that* steady state; if steady states differ, the gap to a common benchmark is a poor predictor. Baumol (1986) found convergence among a group of industrial countries; critics replied that this sample was selected by being rich at the end. Mankiw, Romer and Weil (1992) and Barro and Sala-i-Martin (1992) showed that controlling for saving, population growth and schooling brings out convergence across larger samples at about 2% a year. Here the same regression is run on Penn World Table data from 1960 to 2019, with the controls partialled out by the Frisch–Waugh theorem.`,
      caption: String.raw`Growth 1960–2019 against initial income for 85 countries. Choose the **sample** (all countries or long-standing OECD members) and whether to look at the **raw** relation (absolute convergence) or the relation after removing the effect of saving, population growth and schooling (conditional; each axis is a regression residual, an *added-variable plot* whose slope is the coefficient on initial income). Click a country to label it.`,
      deps: ['macro-3.8'], refs: ['Mankiw ch. 10'], tags: ['growth', 'convergence', 'econometrics'],
      credit: 'Baumol 1986; Barro & Sala-i-Martin 1992; Mankiw, Romer & Weil 1992',
      scope: String.raw`Cross-section regression on 85 countries with data from 1960 and more than one million people in 2019; investment share stands in for the saving rate, years-of-schooling index for human capital; observational, so slopes are associations.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convergence_(economics)' },
      viz(v) {
        const samp = v.select('sample', [{ value: 'all', label: 'all 85 countries' }, { value: 'oecd', label: 'long-standing OECD members' }], 'all');
        const cond = v.select('relation', [{ value: 'raw', label: 'raw (absolute)' }, { value: 'cond', label: 'conditional on s, n, schooling' }], 'raw');
        const S = v.stage({ x: [6, 12], y: [-0.01, 0.06], axes: 'box', gutter: true, height: 380, full: true, xlabel: 'ln income per worker in 1960', ylabel: 'growth of income per worker 1960–2019 (per year)', title: 'growth against initial income' });
        let pick = 'KOR', st = null, pts = [];
        S.onClick((x, y) => { let best = null, bd = 1e9; for (const p of pts) { const dx = S.X(p.x) - S.X(x), dy = S.Y(p.y) - S.Y(y); if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p.r[0]; } } pick = best; });
        v.render(() => {
          const R = XS.filter((r) => samp.value === 'all' || r[8] === 1);
          const x0 = R.map((r) => Math.log(r[2] * 1000)), gr = R.map((r) => (Math.log(r[3]) - Math.log(r[2])) / 59);
          let X = x0, Y = gr, fitMain;
          if (cond.value === 'cond') {
            const C = R.map((r) => [1, Math.log(r[4]), Math.log(r[5] + 0.05), Math.log(r[6])]);
            const ry = olsMulti(C, gr), rx = olsMulti(C, x0);
            X = rx.resid.map((e, i) => e + x0.reduce((p, q) => p + q, 0) / x0.length); Y = ry.resid;
            const full = olsMulti(R.map((r, i) => [1, x0[i], ...C[i].slice(1)]), gr);
            fitMain = { slope: full.b[1], se: full.se[1], t: full.t[1], r2: full.r2, c: full.b.slice(2) };
          } else { const f = ols(x0, gr); fitMain = { slope: f.slope, se: f.se, t: f.t, r2: f.r2 }; }
          const ymean = Y.reduce((p, q) => p + q, 0) / Y.length, xmean = X.reduce((p, q) => p + q, 0) / X.length;
          const lo = Math.min(...Y), hi = Math.max(...Y), pad = 0.1 * (hi - lo);
          S.setView([Math.min(...X) - 0.2, Math.max(...X) + 0.2], [lo - pad, hi + pad]);
          S.hline(cond.value === 'cond' ? 0 : ymean, { color: 'faint', dash: [3, 3] });
          pts = R.map((r, i) => ({ x: X[i], y: Y[i], r }));
          for (const p of pts) S.dot(p.x, p.y, { r: 5, color: p.r[8] ? 'accent' : 'orange', alpha: 0.85 });
          const f2 = ols(X, Y);
          S.path([[Math.min(...X) - 0.2, f2.intercept + f2.slope * (Math.min(...X) - 0.2)], [Math.max(...X) + 0.2, f2.intercept + f2.slope * (Math.max(...X) + 0.2)]], { color: fitMain.slope < 0 ? 'green' : 'red', width: 2.6 });
          const sel = pts.find((p) => p.r[0] === pick);
          if (sel) { S.dot(sel.x, sel.y, { r: 8, color: 'gold' }); S.text(sel.r[1], sel.x, sel.y, { dy: -14, color: 'gold', weight: 700, size: 12 }); }
          const b = fitMain.slope, T = 59, speed = 1 + b * T > 0 ? -Math.log(1 + b * T) / T : null;
          st = { b, se: fitMain.se, t: fitMain.t, n: R.length, speed, r2: fitMain.r2, cond: cond.value === 'cond', sel };
        });
        v.legend([['accent', 'long-standing OECD members', { dot: true }], ['orange', 'other countries', { dot: true }], ['green', 'negative slope: convergence'], ['red', 'positive slope']]);
        v.readout(() => st && `${st.n} countries: slope on initial log income ${fx(st.b, 4)} per year (standard error ${fx(st.se, 4)}, $t = ${fx(st.t, 1)}$)${st.speed != null ? ` → implied convergence rate ${pc(st.speed, 1)} a year` : ' → no convergence'}. ${st.b < 0 && Math.abs(st.t) > 2 ? 'Convergence is statistically visible in this view.' : 'No convergence is visible in this view.'}${st.sel ? ` ${st.sel.r[1]}: income per worker ${fx(st.sel.r[2], 1)} → ${fx(st.sel.r[3], 1)} thousand dollars.` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Paradox', name: 'The Lucas paradox',
      statement: String.raw`If every country had the same Cobb–Douglas technology $y = A k^{\alpha}$ and capital were paid its marginal product $f'(k)=\alpha A k^{\alpha-1}$, then the ratio of returns to capital in a poor and a rich country would be
$$\frac{f'(k_{\text{poor}})}{f'(k_{\text{rich}})} = \Big(\frac{y_{\text{rich}}}{y_{\text{poor}}}\Big)^{\frac{1-\alpha}{\alpha}} .$$
With $\alpha = 0.4$ and a 15-fold gap in income per worker this is about 58. With returns that different, capital should flow massively from rich to poor countries; observed flows are far smaller than this prediction. **The paradox** is the failure of the neoclassical prediction; Lucas examined human-capital differences, knowledge spillovers, monopoly power and political risk as possible explanations.

Scope: the prediction requires identical technology, no frictions and no differences in labour quality.`,
      idea: String.raw`Under diminishing returns (macro-3.3) the marginal product of capital falls with the capital–labour ratio, and with a common Cobb–Douglas technology (macro-2.1) capital per worker is proportional to $y^{1/\alpha}$, so $f' \propto y^{-(1-\alpha)/\alpha}$. Small differences in the exponent matter hugely because income gaps are large: with $\alpha=0.4$ the exponent is $1.5$. Lucas (1990, p. 92) used the approximate U.S.–India income gap reported by Summers and Heston (1988) and concluded that the prediction was wildly at odds with observed flows; the alternative explanations differ in whether the returns really are so different. His own proposal was to measure labour in efficiency units, which shrinks the implied gap.`,
      caption: String.raw`**Left:** the implied ratio of returns to capital against the income gap, for your $\alpha$; drag the handle (the default 15 and $\alpha=0.4$ reproduce Lucas's rounded factor of 58). **Right:** for 85 countries (PWT 10.0; income in 2019), the return implied by the model relative to the U.S. (blue), on a log axis, against income per worker, together with PWT's mean available constructed return in 2000–2019 (green). Switch to **per effective worker** to divide income by the human-capital index and watch the implied gaps shrink. Click a country to label it. The green returns are constructed by the Penn World Table from asset prices and depreciation, not directly observed.`,
      deps: ['macro-3.3'], refs: ['Lucas (1990), Why Doesn’t Capital Flow from Rich to Poor Countries?, AER 80(2), 92–96, especially pp. 92–93; https://www.sfu.ca/~kkasa/lucas90.pdf', 'Feenstra, Inklaar & Timmer (2015); PWT 10.0, CC BY 4.0; https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt100'], tags: ['growth', 'capital flows', 'development'],
      credit: 'Robert Lucas, 1990',
      scope: String.raw`Lucas's p. 92 calculation takes a rough 15-fold income gap and capital share 0.4; 1988 is the year of the cited Summers–Heston publication. The right panel is a separate PWT 10.0 illustration, with 2019 incomes and 2000–2019 return averages, rather than Lucas's original data. Capital-flow data are not shown.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lucas_paradox' },
      viz(v) {
        const aS = v.slider('capital share $\\alpha$', 0.2, 0.7, 0.4, { step: 0.01 });
        const adj = v.select('income per', [{ value: 'w', label: 'worker' }, { value: 'e', label: 'effective worker (÷ human capital)' }], 'w');
        const L = v.stage({ x: [1, 40], y: [1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'income per worker: rich ÷ poor', ylabel: 'return to capital: poor ÷ rich', title: 'the predicted gap in returns' });
        const R = v.stage({ x: [1, 150], y: [0.5, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 280, xlabel: 'income per worker (thousand 2017 USD)', ylabel: 'return relative to the U.S.', title: 'implied and constructed returns across countries' });
        const h = L.handle(15, 58, { color: 'gold', label: 'ratio', constrain: (x) => { const xx = clamp(x, 1, 40); return [xx, xx ** ((1 - aS.value) / aS.value)]; } });
        let pick = 'IND', pts = [], st = null;
        R.onClick((x, y) => { let best = null, bd = 1e9; for (const p of pts) { const dx = R.X(p.x) - R.X(x), dy = R.Y(p.y) - R.Y(y); if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p.r[0]; } } pick = best; });
        v.render(() => {
          const a = aS.value, e = (1 - a) / a, us = XS.find((r) => r[0] === 'USA');
          L.setView([0.9,44],[0.9,Math.max(1000,40**e*1.15)]);
          const val = (r) => (adj.value === 'e' ? r[3] / r[7] : r[3]);
          L.fn((x) => x ** e, { color: 'accent', width: 2.8, domain: [1, 40] });
          L.fn((x) => x, { color: 'faint', dash: [4, 4], width: 1.4, domain: [1, 40] });
          const ratio = clamp(h.x, 1, 40); h.set(ratio, ratio ** e);
          L.hline(1, { color: 'faint' });
          L.text(`exponent (1−α)/α = ${fx(e, 2)}`, 1.3, 400, { color: 'accent', weight: 700, size: 12, align: 'left' });
          pts = XS.map((r) => ({ x: r[3], y: (val(us) / val(r)) ** e, r }));
          const reported = pts.filter(p=>p.r[9]!=null).map(p=>p.r[9]/us[9]);
          const incomes = pts.map(p=>p.x), returns = pts.map(p=>p.y).concat(reported);
          R.setView([Math.min(...incomes)/1.25,Math.max(...incomes)*1.25], [Math.min(...returns)/1.25,Math.max(...returns)*1.25]);
          R.hline(1, { color: 'faint', dash: [4, 4] });
          for (const p of pts) R.dot(p.x, p.y, { r: 4.5, color: 'accent', alpha: 0.8 });
          for (const p of pts) if (p.r[9] != null) R.dot(p.x, p.r[9] / us[9], { r: 4.5, color: 'green', alpha: 0.85 });
          const sel = pts.find((p) => p.r[0] === pick);
          if (sel) { R.dot(sel.x, sel.y, { r: 8, color: 'gold' }); R.text(sel.r[1], sel.x, sel.y, { dy: -14, color: 'gold', weight: 700, size: 12 }); }
          const ind = XS.find((r) => r[0] === 'IND');
          st = { e, ratio, pr: ratio ** e, sel, us, selY: sel ? sel.y : 0, ind, indRatio: val(us) / val(ind), indRet: (val(us) / val(ind)) ** e };
        });
        v.legend([['accent', 'return implied by the model', { dot: true }], ['green', 'PWT 10.0 internal return, mean available 2000–19', { dot: true }], ['faint', 'equal to the U.S.', { dash: true }]]);
        v.readout(() => st && `a ${fx(st.ratio, 1)}-fold income gap implies a ${fx(st.pr, 0)}-fold gap in returns at $\\alpha = ${fx(aS.value, 2)}$. In the 2019 Penn World Table the U.S.-to-India gap in income per ${adj.value === 'e' ? 'effective worker' : 'worker'} is ${fx(st.indRatio, 1)}, implying returns ${fx(st.indRet, 0)} times higher in India${st.sel ? `; ${st.sel.r[1]}: ${fx(st.sel.r[3], 1)} thousand dollars per worker, implied return ${fx(st.selY, 1)} times the U.S.${st.sel.r[9] != null ? `, PWT's constructed return ${fx(st.sel.r[9] / st.us[9], 2)} times the U.S.` : ''}` : ''}. The green series is a separate constructed-return comparison, not a direct test of international investment flows.`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Model', name: 'Harrod–Domar and the knife edge',
      statement: String.raw`Suppose output is produced with **fixed proportions**: $Y = \min\{K/v,\ L\}$, a constant capital–output ratio $v$ and labour (in efficiency units) growing at the **natural rate** $n$. Saving is the fraction $s$ of output, $\dot K = sY - \delta K$. The **warranted growth rate** at which capital is fully used is $s/v - \delta$. Unless
$$\frac{s}{v} - \delta = n$$
exactly, the economy does not grow in balance: if $s/v-\delta > n$ capital grows faster than labour and an ever larger share of it stands idle; if $s/v-\delta < n$ output is limited by capital and the unemployment rate rises without bound. Balanced growth is a *knife edge*.

Scope: the conclusion depends on fixed proportions and on exogenous $s$, $v$ and $n$. Solow's model (macro-3.2) makes $v$ adjust and removes the knife edge.`,
      idea: String.raw`Harrod (1939) and Domar (1946) tied growth to the saving rate and the capital–output ratio: with $v$ fixed, a given saving rate buys capital that supports growth of $s/v$ (less depreciation), which has no reason to equal the growth of the labour force, which depends on demography. Any gap compounds, so the model is unstable. The cure is to allow substitution between capital and labour: with a neoclassical production function the capital–output ratio moves to $s/(n+\delta)$ and the economy returns to full employment. Each of the two "growth rates" in Harrod's analysis, warranted and natural, is a different object; their equality is the miracle that Solow's flexibility makes automatic.`,
      caption: String.raw`**Left (Harrod–Domar):** the share of labour employed (blue) and of capital in use (orange) over 100 years; slide $s$, $v$, $n$ and $\delta$ and watch the economy fall off the knife edge whenever the warranted rate $s/v-\delta$ differs from $n$. **Right (Solow):** capital–output ratio for the *same* $s$, $n$, $\delta$ when production is Cobb–Douglas: it adjusts to $s/(n+\delta)$ and both factors stay fully employed. The sliders start at a mismatch; try to land on the edge.`,
      deps: ['macro-3.2'], refs: ['Romer ch. 1'], tags: ['growth', 'instability'],
      credit: 'Roy Harrod, 1939; Evsey Domar, 1946',
      scope: String.raw`Fixed capital–output ratio, exogenous saving and labour growth, no price adjustment; the right panel uses Cobb–Douglas with $\alpha=0.35$ for contrast.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Harrod%E2%80%93Domar_model' },
      viz(v) {
        const sS = v.slider('saving rate $s$', 0.05, 0.4, 0.2, { step: 0.005 });
        const vS = v.slider('capital–output ratio $v$', 1.5, 6, 3, { step: 0.05 });
        const nS = v.slider('labour growth $n$', 0, 0.05, 0.01, { step: 0.001 });
        const dS = v.slider('depreciation $\\delta$', 0, 0.08, 0.03, { step: 0.001 });
        const L = v.stage({ x: [0, 100], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'years', ylabel: 'fraction in use', title: 'Harrod–Domar: fixed proportions' });
        const R = v.stage({ x: [0, 100], y: [0, 8], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'capital–output ratio K/Y', title: 'Solow: the ratio adjusts' });
        let st = null;
        v.render(() => {
          const s = sS.value, vv = vS.value, n = nS.value, d = dS.value, a = 0.35, dt = 0.25, T = 100;
          // Harrod–Domar
          let K = vv, Lb = 1; const E = [], U = [];
          for (let t = 0; t <= T + 1e-9; t += dt) {
            const Y = Math.min(K / vv, Lb); E.push([t, Y / Lb]); U.push([t, Y / (K / vv)]);
            K += dt * (s * Y - d * K); Lb *= Math.exp(n * dt);
          }
          L.hline(1, { color: 'faint', dash: [4, 4] });
          L.path(E, { color: 'accent', width: 2.8 }); L.path(U, { color: 'orange', width: 2.8 });
          const wr = s / vv - d;
          L.text(`warranted s/v − δ = ${pc(wr, 2)}   natural n = ${pc(n, 2)}`, 50, 0.08, { align: 'center', color: Math.abs(wr - n) < 0.0006 ? 'green' : 'red', weight: 700, size: 12 });
          // Solow with the same s, n, δ: state per effective unit of labour
          let kk = 1; const KY = []; // K/L, with y = kk^a
          for (let t = 0; t <= T + 1e-9; t += dt) { KY.push([t, kk / kk ** a]); kk += dt * (s * kk ** a - (n + d) * kk); }
          R.setView([0, T], [0, Math.max(8, ...KY.map((p) => p[1]))]);
          R.hline(vv, { color: 'orange', width: 2.4 }); R.text('Harrod–Domar v (fixed)', 98, vv, { dy: -10, align: 'right', color: 'orange', weight: 700, size: 12 });
          R.hline(s / (n + d), { color: 'green', dash: [6, 4] });
          R.text('s/(n+δ)', 98, s / (n + d), { dy: -10, align: 'right', color: 'green', weight: 700, size: 12 });
          R.path(KY, { color: 'accent', width: 2.8 });
          st = { wr, n, e: E[E.length - 1][1], u: U[U.length - 1][1], ky: KY[KY.length - 1][1], target: s / (n + d) };
        });
        v.legend([['accent', 'share of labour employed'], ['orange', 'share of capital in use'], ['green', 's/(n+δ)', { dash: true }]]);
        v.readout(() => st && `after 100 years Harrod–Domar leaves ${pc(st.e, 0)} of the labour force employed and ${pc(st.u, 0)} of capital in use: ${Math.abs(st.wr - st.n) < 0.0006 ? 'on the knife edge: both stay fully used' : st.wr > st.n ? 'warranted growth exceeds natural growth, so capital piles up idle' : 'warranted growth is below natural growth, so unemployment grows without limit'}. In the Solow version with the same $s$, $n$ and $\\delta$, $K/Y$ goes to $s/(n+\\delta) = ${fx(st.target, 2)}$ (after 100 years ${fx(st.ky, 2)}); nothing is idle.`);
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13', kind: 'Paradox', name: 'The productivity paradox (Solow)',
      statement: String.raw`In 1987 Robert Solow remarked that "you can see the computer age everywhere but in the productivity statistics". Computing equipment and software investment had been rising rapidly for a decade, yet measured productivity growth had slowed since the early 1970s. The **paradox** is the apparent absence of the gains that a transformative technology should bring. Explanations include mismeasurement of output (quality and variety), the slow diffusion and the *reorganization costs* of a general-purpose technology (as with electric dynamos a century earlier), and the possibility that early gains were simply small. Later data show a pick-up in U.S. productivity growth from the mid-1990s.

Scope: a statement about measured aggregate TFP; it does not say computers have not mattered.`,
      idea: String.raw`In growth accounting (macro-3.9) a new capital good raises output through the capital term at once, but its full effect depends on complementary investments and learning. If the gain from a technology appears with a delay of $L$ years, and adoption itself uses resources and disrupts old routines, the *measured* productivity effect can be negative or flat while investment is booming and large later: this is the argument made by Paul David (1990) from the history of electrification, and by Brynjolfsson (1993) for information technology. The picture on the right is an illustrative model of that mechanism, not an estimate.`,
      caption: String.raw`**Left:** U.S. investment in information-processing equipment and software as a percent of GDP (BEA via FRED) and, below, the growth of total factor productivity in the private nonfarm business sector (BLS via FRED), smoothed over five years; horizontal bars show average growth over four periods. **Right (illustrative model):** a technology adopted along a logistic curve; its effect on measured TFP growth arrives after the **learning lag** and is reduced by the **adoption cost** while the adoption is going on. With no lag and no cost the gains show up when adoption is fastest; with them, much later.`,
      deps: ['macro-3.9'], refs: ['Mankiw ch. 10'], tags: ['growth', 'measurement', 'technology'],
      credit: 'Robert Solow, 1987 (the remark); Paul David, 1990; Erik Brynjolfsson, 1993',
      scope: String.raw`The data are two U.S. aggregates and show a co-movement in time, not causation; the model is a stylized illustration with made-up magnitudes.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Productivity_paradox' },
      viz(v) {
        const lag = v.slider('learning lag (years)', 0, 25, 15, { step: 0.5 });
        const cost = v.slider('adoption cost (share of adoption speed)', 0, 1.5, 0.8, { step: 0.05 });
        const A = v.stage({ x: [1948, 2025], y: [0, 5], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'year', ylabel: 'percent of GDP', title: 'IT investment' });
        const B = v.stage({ x: [1948, 2025], y: [-1, 5], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'year', ylabel: 'TFP growth, percent per year', title: 'measured TFP growth' });
        const C = v.stage({ x: [0, 60], y: [-1, 2], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'years since the technology appears', ylabel: 'effect on measured growth (points)', title: 'model: a general-purpose technology' });
        const per = [[1948, 1973], [1973, 1995], [1995, 2005], [2005, 2025]];
        const idx = (y) => IT.find((r) => r[0] === y)[2];
        const cagr = ([a, b]) => Math.pow(idx(b) / idx(a), 1 / (b - a)) - 1;
        const gr = IT.slice(1).map((r, i) => [r[0], 100 * Math.log(r[2] / IT[i][2])]);
        const sm = gr.map(([y], i) => { const w = gr.filter((q) => Math.abs(q[0] - y) <= 2); return [y, w.reduce((p, q) => p + q[1], 0) / w.length]; });
        let st = null;
        v.render(() => {
          A.path(IT.map((r) => [r[0], r[1]]), { color: 'purple', width: 2.8 });
          A.text('equipment and software', 1950, 4.6, { align: 'left', color: 'purple', size: 11.5 });
          B.hline(0, { color: 'ink' });
          for (const r of gr) B.rect(r[0] - 0.4, 0, r[0] + 0.4, r[1], { fill: 'faint', fillAlpha: 0.35, stroke: false });
          B.path(sm, { color: 'accent', width: 2.8 });
          const cols = ['blue', 'red', 'green', 'orange'];
          per.forEach((p, i) => { B.line(p[0], 100 * cagr(p), p[1], 100 * cagr(p), { color: cols[i], width: 4 }); B.text(`${fx(100 * cagr(p), 1)}`, (p[0] + p[1]) / 2, 100 * cagr(p), { dy: -10, color: cols[i], weight: 700, size: 12 }); });
          // model: logistic adoption S(t) with midpoint 20 and width 6
          const Sp = (t) => { const z = Math.exp(-(t - 20) / 5); return z / (5 * (1 + z) ** 2); }; // derivative of logistic adoption
          const eff = (t) => 1.6 * 5 * Sp(t - lag.value) - cost.value * 1.6 * 5 * Sp(t);
          C.hline(0, { color: 'ink' });
          C.fn((t) => 1.6 * 5 * Sp(t), { color: 'faint', dash: [5, 4], width: 1.8, domain: [0, 60] });
          const area = []; for (let t = 0; t <= 60; t += 0.5) area.push([t, eff(t)]);
          C.fn(eff, { color: 'accent', width: 2.8, domain: [0, 60], n: 300 });
          C.between(eff, () => 0, 0, 60, { fill: 'accent', fillAlpha: 0.12 });
          C.text('adoption speed', 20, 1.6 * 5 * Sp(20), { dx: 10, align: 'left', color: 'muted', size: 11.5 });
          const tmin = area.reduce((m, p) => (p[1] < m[1] ? p : m)), tmax = area.reduce((m, p) => (p[1] > m[1] ? p : m));
          st = { rates: per.map((p) => 100 * cagr(p)), tmin, tmax };
        });
        v.legend([['purple', 'IT investment / GDP'], ['accent', 'TFP growth (5-year mean) / model effect'], ['faint', 'bars: annual TFP growth · dashed: adoption speed']]);
        v.readout(() => st && `average TFP growth: ${st.rates.map((r, i) => `${per[i][0]}–${per[i][1]}: ${fx(r, 1)}%`).join(' · ')}. IT investment rose from ${fx(IT.find((r) => r[0] === 1980)[1], 1)}% of GDP in 1980 to ${fx(IT.find((r) => r[0] === 2000)[1], 1)}% in 2000 and ${fx(IT[IT.length - 1][1], 1)}% in 2025. In the model the measured effect is ${st.tmin[1] < -0.01 ? `negative at worst (${fx(st.tmin[1], 2)}) around year ${fx(st.tmin[0], 0)} and` : ''} largest (${fx(st.tmax[1], 2)} points) around year ${fx(st.tmax[0], 0)}, while adoption is fastest at year 20.`);
      },
    },
  ],
};
