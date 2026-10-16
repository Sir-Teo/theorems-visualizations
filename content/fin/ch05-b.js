// Finance — Chapter 5 (part 2): items 5.6–5.10.
//
// Sources and honesty notes (checked Oct 2026): Shiller, AER 71(3):421–436 (1981); LeRoy & Porter, Econometrica 49(3):555–574 (1981);
// Shleifer & Vishny, J. Finance 52(1):35–55 (1997); De Long, Shleifer, Summers & Waldmann, JPE 98(4):703–738 (1990); Rosenthal & Young, JFE 26(1):123–141 (1990);
// Froot & Dabora, JFE 53(2):189–216 (1999); Mandelbrot, J. Business 36(4):394–419 (1963); Engle, Econometrica 50(4):987–1007 (1982); Bollerslev, J. Econometrics 31(3):307–327 (1986);
// Kirman, QJ Economics 108(1):137–156 (1993); Temin & Voth, AER 94(5):1654–1668 (2004).
// Real data: Shiller's annual series and the daily market in ch05.shared.js; monthly industry returns (French library) via ch04.shared.js. Simulations are labelled.
import { clamp, pct, fx, sg, data, daily, shiller, shillerDetrended, exPost, meanOf, sdOf, acf, normPdf, normCdf, kurtosis, simGarch, rng, monthLabel } from './ch05.shared.js';

export default {
  collection: 'fin',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Phenomenon',
      name: 'Excess volatility (Shiller)',
      statement: String.raw`If a stock price is the expected present value of the dividends that follow, $p_t=\mathrm E_t[p_t^*]$ with the **ex-post rational price**
$$p_t^*=\sum_{k\ge 0}\frac{d_{t+k}}{(1+r)^{k+1}},$$
then $p_t^*=p_t+u_t$ where the forecast error $u_t$ is uncorrelated with $p_t$, so
$$\operatorname{var}(p_t^*)=\operatorname{var}(p_t)+\operatorname{var}(u_t)\ \ge\ \operatorname{var}(p_t).$$
**The observation:** in U.S. data the real S&P price index varies far more than the (detrended) $p^*$ built from the dividends that actually followed, whatever discount rate in a plausible range is used: $\operatorname{sd}(p)>\operatorname{sd}(p^*)$, violating the bound. Prices seem to move too much to be justified by news about dividends.

Scope: a statement about a constant discount rate and stationary (detrended) series; whether the violation measures irrationality, time-varying discount rates or small-sample and non-stationarity problems is still debated (see fin-5.15).`,
      idea: String.raw`The bound is a variance decomposition: a forecast cannot be more variable than the quantity it forecasts, because forecast and error are orthogonal. $p^*$ is smooth because dividends are smooth and a discounted sum of many of them averages out their fluctuations; the price is not. The calculation needs a terminal value for $p^*$ at the end of the sample and detrending to make both series stationary (a long-run growth trend is divided out); the conclusion survives different choices. Shiller read the gap as evidence that prices respond to something other than dividend news (fads, changing risk premia); later work (fin-5.15) examines how robust the test is.`,
      caption: String.raw`**Left**: the real S&P composite index (blue, detrended) and the ex-post rational price $p^*$ (green, the discounted dividends that actually followed) for 1871–2022; the price swings through crashes and booms while $p^*$ is a smooth curve. Drag the **discount rate** and choose the **terminal value**: $p^*$ moves up and down but never becomes as variable as the price. **Right**: the standard deviation of $p^*$ against the discount rate, with the price's own standard deviation as the line it should stay above. (Real data: Shiller's annual series; discount rates are after removing the growth trend.)`,
      deps: ['fin-5.1', 'fin-1.11'],
      refs: ['BKM ch. 12'],
      tags: ['excess volatility', 'present value', 'variance bounds'],
      credit: 'Shiller, 1981; LeRoy & Porter, 1981',
      scope: String.raw`Annual U.S. data, constant discount rate, stationarity after removing an exponential trend; the conclusion is contested for non-stationary dividends and with time-varying discount rates.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Excess_volatility' },
      viz(v) {
        const sh = shiller();
        const rate = v.slider('discount rate $r$ (detrended)', 0.02, 0.12, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const term = v.select('terminal value of $p^*$', [{ value: 'mean', label: 'mean of the price' }, { value: 'last', label: 'last price' }], 'mean');
        const end = v.select('sample', [{ value: '1979', label: '1871–1979' }, { value: '2022', label: '1871–2022' }], '2022');
        const A = v.stage({ x: [1871, 2023], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1.5, minWidth: 320, xlabel: 'year', ylabel: 'real price, detrended', title: 'the price and the discounted dividends that followed' });
        const B = v.stage({ x: [0.02, 0.12], y: [0, 120], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'discount rate r', ylabel: 'standard deviation', xticks: [[0.02, '2%'], [0.04, '4%'], [0.06, '6%'], [0.08, '8%'], [0.1, '10%'], [0.12, '12%']], title: 'sd(p*) against the bound sd(p)' });
        let ratio = 0, sdp = 0, sds = 0, req = null;
        const calc = (S, r) => { const mp = meanOf(S.p), ps = exPost(S.d, r, term.value === 'mean' ? mp : S.p[S.T - 1]); return { ps, sd: sdOf(ps) }; };
        v.render(() => {
          const S = shillerDetrended(end.value === '1979' ? 109 : 152), mp = meanOf(S.p);
          const { ps, sd } = calc(S, rate.value); sdp = sdOf(S.p); sds = sd; ratio = sds / sdp;
          const hi = Math.max(...S.p, ...ps) * 1.08; A.setView([1871, S.year[S.T - 1] + 1], [0, hi]);
          A.path(S.year.map((y, i) => [y, S.p[i]]), { color: 'accent', width: 2.2 });
          A.path(S.year.map((y, i) => [y, ps[i]]), { color: 'green', width: 2.6 });
          A.text('real S&P price p', S.year[S.T - 1] - 28, S.p[S.T - 1], { dx: 0, dy: -14, size: 11.5, color: 'accent', weight: 700, align: 'center' });
          A.text('p* (ex-post rational)', 1930, ps[59] * 0.7, { size: 11.5, color: 'green', weight: 700 });
          const xs = [], ys = []; for (let r = 0.02; r <= 0.1201; r += 0.0025) { xs.push(r); ys.push(calc(S, r).sd); }
          B.setView([0.02, 0.12], [0, Math.max(sdp, ...ys) * 1.15]);
          B.path(xs.map((x, i) => [x, ys[i]]), { color: 'green', width: 2.6 });
          B.hline(sdp, { color: 'accent', width: 2.2 }); B.text('sd(p): the price', 0.12, sdp, { dx: -6, dy: -9, align: 'right', size: 11.5, color: 'accent', weight: 700 });
          B.text('sd(p*)', 0.1, ys[ys.length - 4], { dy: 16, size: 11.5, color: 'green', weight: 700 });
          B.dot(rate.value, sds, { r: 7, color: 'gold' });
          req = null; for (let i = 0; i < xs.length; i++) if (ys[i] >= sdp) { req = xs[i]; break; }
          B.vband(0.04, 0.08, { color: 'orange', alpha: 0.08 }); B.text('plausible range', 0.06, sdp * 0.08, { size: 10.5, color: 'orange', align: 'center' });
        });
        v.readout(() => `With $r=${pct(rate.value, 2)}$: **sd(p) = ${v.fix(sdp, 1)}**, **sd(p\\*) = ${v.fix(sds, 1)}**, ratio ${v.fix(ratio, 2)}; the rational-price bound needs sd(p) ≤ sd(p\\*)${ratio < 1 ? ', which fails: the price is ' + v.fix(1 / ratio, 1) + ' times as variable as it may be' : ''}.\n${req ? `Only a discount rate of about ${pct(req, 1)} or lower would make $p^*$ as variable as $p$ here, below the average dividend yield (${pct(meanOf(shillerDetrended(152).d) / meanOf(shillerDetrended(152).p), 1)}) plus growth that investors earned.` : 'No discount rate in the plotted range makes $p^*$ as variable as the price.'}\nDetrending by the fitted real growth of the price (${pct(shillerDetrended(end.value === '1979' ? 109 : 152).g, 2)} a year).`);
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Concept',
      name: 'Limits to arbitrage',
      statement: String.raw`Arbitrage is supposed to push a mispriced asset back to its fundamental value (fin-1.13). But a real arbitrageur has **limited capital**, borrows at the margin, and answers to investors who judge her by recent performance. If the mispricing $m_t$ can widen before it closes (**noise-trader risk**), a levered position can lose money in the short run, be forced to liquidate at the worst moment, and never collect the profit. Then a mispricing can persist and even grow, although it is certain to disappear eventually.

In a standard setup, with capital $K=1$, leverage $\Lambda$ (position $\Lambda K$) and an initial mispricing $m_0$ that mean-reverts, $dm=-\kappa m\,dt+\sigma\,dW$, the position has equity $E_t=1+\Lambda(m_0-m_t)$ and is closed out when $E_t\le\rho\Lambda$ (maintenance margin $\rho$). The probability of forced liquidation rises with $\Lambda$ and $\sigma$ although the *expected* terminal gain is positive.

Scope: stylised model of the argument (Shleifer–Vishny; De Long et al.). The twin-shares example (Royal Dutch and Shell, fixed 60:40 claim on joint cash flows) is the classical case in which the fundamental ratio is known.`,
      idea: String.raw`The no-arbitrage argument of fin-1.13 assumes arbitrage is riskless and costless. When the position must be held for some time, the trader bears the risk of the spread moving against her, and because her capital is finite she must liquidate when losses exceed her margin, even if the expected profit is large. Rational arbitrageurs therefore take smaller positions than would close the gap, and the mispricing can survive: "markets can stay irrational longer than you can stay solvent". This also qualifies the efficient-market argument of fin-5.1, which relied on arbitrage eliminating predictable profits.`,
      caption: String.raw`A stylised twin-shares spread $m_t$ starts at a gap you set; an arbitrageur goes long the cheap and short the dear share with the leverage you choose. **Left**: the gap, with the level at which she is liquidated. **Middle**: her equity. **Right**: over 400 simulated paths, the share liquidated and her average outcome as functions of leverage: moderate leverage collects the convergence profit, high leverage is wiped out before it comes. Raise **noise-trader risk** $\sigma$ or lower the **reversion speed** and the safe leverage shrinks. (Model; not the actual Royal Dutch/Shell data.)`,
      deps: ['fin-5.1', 'fin-1.13'],
      refs: ['BKM ch. 12'],
      tags: ['arbitrage', 'noise traders', 'leverage'],
      credit: 'De Long, Shleifer, Summers & Waldmann, 1990; Shleifer & Vishny, 1997',
      scope: String.raw`Describes arbitrage by levered, performance-judged intermediaries; for unconstrained, long-horizon investors the standard no-arbitrage logic applies.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Limits_to_arbitrage' },
      viz(v) {
        const m0 = v.slider('initial gap $m_0$ (%)', 1, 12, 5, { step: 0.25 });
        const lev = v.slider('leverage $\\Lambda$', 1, 30, 10, { step: 0.5 });
        const sig = v.slider('noise-trader risk $\\sigma$ (% per day)', 0.1, 1.2, 0.6, { step: 0.05 });
        const kap = v.slider('reversion speed $\\kappa$ (per day)', 0.002, 0.05, 0.01, { log: true, sig: 2 });
        const rho = v.slider('maintenance margin $\\rho$ (% of position)', 0, 20, 5, { step: 0.5 });
        let seed = 4; v.button('New path', () => { seed++; });
        const T = 250;
        const A = v.stage({ x: [0, T], y: [-2, 16], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'trading day', ylabel: 'price gap m (%)', title: 'the mispricing' });
        const B = v.stage({ x: [0, T], y: [0, 4], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'trading day', ylabel: 'equity (capital = 1)', title: 'the arbitrageur’s equity' });
        const C = v.stage({ x: [1, 30], y: [0, 100], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'leverage Λ', ylabel: '% of paths', title: '400 paths: who survives?' });
        // simulate an OU path (daily steps, in percent)
        const path = (R, m, k, s) => { const out = [m]; for (let t = 1; t <= T; t++) { m = m - k * m + s * R.normal(); out.push(m); } return out; };
        let stat = { liq: 0 };
        v.render(() => {
          const k = kap.value, s = sig.value, L = lev.value, r0 = rho.value / 100;
          const R = rng(seed * 4099 + 13), mp = path(R, m0.value, k, s);
          const thr = m0.value + (1 - r0 * L) / L * 100; // gap (in %) at which equity hits the maintenance margin: 1 + L(m0 - m)/100 = r0 L
          let liqAt = -1; const eq = []; for (let t = 0; t <= T; t++) { const e = 1 + L * (m0.value - mp[t]) / 100; eq.push(e); if (liqAt < 0 && e <= r0 * L) { liqAt = t; break; } }
          A.setView([0, T], [Math.min(-2, ...mp) - 0.5, Math.max(16, thr + 1, ...mp) + 0.5]);
          A.hline(0, { color: 'green', dash: true }); A.text('fundamental ratio (gap 0)', T, 0, { dx: -4, dy: -9, align: 'right', size: 10.5, color: 'green' });
          A.hline(thr, { color: 'red', dash: true }); A.text('liquidation level', 2, thr, { dx: 4, dy: -9, align: 'left', size: 10.5, color: 'red', weight: 700 });
          const upto = liqAt < 0 ? T : liqAt;
          A.path(mp.map((y, t) => [t, y]), { color: liqAt >= 0 ? 'muted' : 'accent', width: 1.6 });
          A.path(mp.slice(0, upto + 1).map((y, t) => [t, y]), { color: 'accent', width: 2.4 });
          if (liqAt >= 0) { A.dot(liqAt, mp[liqAt], { r: 7, color: 'red' }); A.text('forced out', liqAt, mp[liqAt], { dx: -8, dy: -12, align: 'right', size: 11.5, color: 'red', weight: 700 }); }
          const ymax = Math.max(4, ...eq) + 0.2; B.setView([0, T], [0, ymax]);
          B.hline(1, { color: 'faint', dash: true }); B.hline(r0 * L, { color: 'red', dash: true });
          B.path(eq.map((y, t) => [t, y]), { color: liqAt >= 0 ? 'red' : 'green', width: 2.6 });
          if (liqAt >= 0) B.dot(liqAt, eq[liqAt], { r: 7, color: 'red' }); else B.dot(T, eq[T], { r: 6, color: 'green' });
          // Monte-Carlo over leverage
          const M = 400, R2 = rng(777), mx = [], fin = [];
          for (let i = 0; i < M; i++) { const p = path(R2, m0.value, k, s); mx.push(Math.max(...p)); fin.push(p[T]); }
          const liqP = [], mean = []; const Ls = []; for (let l = 1; l <= 30; l += 0.5) Ls.push(l);
          for (const l of Ls) { let nl = 0, sm = 0; const th = m0.value + (1 - r0 * l) / l * 100; for (let i = 0; i < M; i++) { if (mx[i] >= th) { nl++; sm += r0 * l; } else sm += 1 + l * (m0.value - fin[i]) / 100; } liqP.push(100 * nl / M); mean.push(sm / M); }
          C.path(Ls.map((l, i) => [l, liqP[i]]), { color: 'red', width: 2.4 });
          C.path(Ls.map((l, i) => [l, clamp(50 * mean[i], 0, 100)]), { color: 'green', width: 2.4 });
          C.text('liquidated before day 250', 30, liqP[liqP.length - 1], { dx: -4, dy: 14, align: 'right', size: 11, color: 'red', weight: 700 });
          C.text('average final equity (50 = 1.0)', 1, clamp(50 * mean[0], 0, 100), { dx: 4, dy: -10, align: 'left', size: 11, color: 'green', weight: 700 });
          C.vline(L, { color: 'gold', width: 2 });
          let nl = 0, sm = 0; const th = m0.value + (1 - r0 * L) / L * 100; for (let i = 0; i < M; i++) { if (mx[i] >= th) { nl++; sm += r0 * L; } else sm += 1 + L * (m0.value - fin[i]) / 100; }
          stat = { liq: nl / M, mean: sm / M, liqAt, thr, eqEnd: eq[eq.length - 1] };
        });
        v.readout(() => `This path: ${stat.liqAt >= 0 ? `liquidated on day **${stat.liqAt}** when the gap reached ${v.fix(stat.thr, 1)}% (it started at ${v.fix(m0.value, 1)}%); the gap later closes, but she is no longer in the trade.` : `still in the trade at day ${T}, equity **${v.fix(stat.eqEnd, 2)}**.`}\nAt leverage ${v.fix(lev.value, 1)}: **${v.fix(100 * stat.liq, 0)}%** of 400 paths are liquidated; average final equity ${v.fix(stat.mean, 2)}. Fundamental value is certain to be recovered, yet the leveraged arbitrageur often does not survive to see it.`);
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Phenomenon',
      name: 'Fat tails and volatility clustering',
      statement: String.raw`Daily returns of the U.S. market are **not** normal. Compared with a normal distribution of the same mean and standard deviation, the empirical distribution of daily returns (a) has **fat tails**: extreme moves of four or more standard deviations occur dozens of times more often than the normal predicts, kurtosis $\mathrm E[(r-\mu)^4]/\sigma^4\gg 3$; and (b) shows **volatility clustering**: returns themselves are almost uncorrelated, but their sizes are strongly positively autocorrelated, $\operatorname{corr}(|r_t|,|r_{t+k}|)>0$ for many lags $k$, so calm and stormy periods alternate. Fat tails weaken with aggregation: weekly and monthly returns look closer to normal.

Scope: the 15 897 trading days 1963–2026 of the value-weighted U.S. market; the pattern is shared by most liquid assets and is much stronger than the normal / i.i.d. random walk of fin-5.2 permits.`,
      idea: String.raw`If the daily returns were i.i.d. normal, the number of days beyond $4\sigma$ in 63 years would be about one; the fact that there are about a hundred means that the distribution mixes many different volatilities: on stormy days $\sigma_t$ is several times larger than on calm days, and the mixture of normals with different variances has fat tails. Clustering shows that $\sigma_t$ itself is persistent, which is what the GARCH family (fin-5.9) models. Mandelbrot (1963) noticed the fat tails and Engle (1982) formalised the time-varying variance. The central limit theorem pulls sums of many days toward the normal, which is why monthly returns are closer to it.`,
      caption: String.raw`**Left**: the histogram of standardised daily returns on a **log** vertical axis (the normal curve is a parabola there); real data are the dots. Choose the **aggregation** (daily, weekly, monthly) and the **period**: the tails thin out with aggregation. **Middle**: $|r_t|$ over time, in units of its average; storms (1987, 2008, 2020) are visible. **Right**: autocorrelation of returns (grey, near zero) and of absolute returns (blue bars, positive for dozens of lags). (Real data: French library, daily market.)`,
      deps: ['fin-5.2'],
      refs: ['Hull ch. 20', 'Hull ch. 23'],
      tags: ['fat tails', 'volatility clustering', 'kurtosis'],
      credit: 'Mandelbrot, 1963; Fama, 1965; Engle, 1982',
      scope: String.raw`Holds for the U.S. equity market and most liquid financial series at daily frequency; weaker at monthly or longer horizons.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Volatility_clustering' },
      viz(v) {
        const D = daily(), r = D.r, n = D.n;
        const agg = v.select('aggregation', [{ value: 1, label: 'daily' }, { value: 5, label: 'weekly' }, { value: 21, label: 'monthly' }], 1);
        const per = v.select('period', [{ value: 'all', label: '1963–2026' }, { value: 'a', label: '1963–1989' }, { value: 'b', label: '1990–2026' }], 'all');
        const A = v.stage({ x: [-9, 9], y: [3e-6, 1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 280, xlabel: 'standardised return z', ylabel: 'density (log scale)', title: 'the distribution of returns' });
        const B = v.stage({ x: [1963, 2027], y: [0, 10], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'year', ylabel: '|r| / average |r|', title: 'the size of daily moves' });
        const Cc = v.stage({ x: [0, 41], y: [-0.1, 0.4], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'lag k (days)', ylabel: 'autocorrelation', title: 'of returns and of |returns|' });
        const absr = Float64Array.from(r, Math.abs), mabs = meanOf(absr);
        const acAbs = [], acR = []; for (let k = 1; k <= 40; k++) { acAbs.push(acf(absr, k)); acR.push(acf(r, k)); }
        let st = {};
        v.render(() => {
          const i0 = per.value === 'b' ? D.yearStart[27] : 0, i1 = per.value === 'a' ? D.yearStart[27] : n, m = agg.value;
          const xs = []; for (let i = i0; i + m <= i1; i += m) { let s = 0; for (let j = 0; j < m; j++) s += r[i + j]; xs.push(s); }
          const mu = meanOf(xs), sd = sdOf(xs), z = xs.map((x) => (x - mu) / sd);
          const nb = 61, lo = -9, hi = 9, w = (hi - lo) / nb, cnt = new Array(nb).fill(0); for (const q of z) { const b = Math.floor((q - lo) / w); if (b >= 0 && b < nb) cnt[b]++; }
          A.fn((x) => normPdf(x), { domain: [-9, 9], color: 'green', width: 2.2, n: 300 });
          A.dots(cnt.map((c, b) => c > 0 ? [lo + (b + 0.5) * w, c / (z.length * w)] : null).filter(Boolean), { r: 3.6, color: 'accent' });
          A.text('normal', 3.1, 0.004, { size: 11.5, color: 'green', weight: 700 }); A.text('real returns', -8.8, 3e-4, { size: 11.5, color: 'accent', weight: 700 });
          const k4 = kurtosis(xs); let big = 0; for (const q of z) if (Math.abs(q) > 4) big++; const ex = z.length * 2 * (1 - normCdf(4));
          st = { k4, big, ex, n: z.length, worst: Math.min(...z) };
          // |r| over time
          const pts = []; for (let i = 0; i < n; i += 2) pts.push([1963.5 + i * (63.17 / n), Math.min(10, absr[i] / mabs)]);
          B.path(pts, { color: 'accent', width: 0.8, alpha: 0.8 }); B.hline(1, { color: 'faint', dash: true });
          [[1987.8, '1987'], [2008.8, '2008'], [2020.2, '2020']].forEach(([x, t]) => B.text(t, x, 9.4, { size: 11, color: 'red', align: 'center', weight: 700 }));
          Cc.hline(0, { color: 'faint' }); Cc.bars(acAbs, { x0: 1, dx: 1, color: 'accent' });
          Cc.dots(acR.map((a, i) => [i + 1, a]), { r: 3.4, color: 'muted' });
          Cc.hline(1.96 / Math.sqrt(n), { color: 'red', dash: true, width: 1 }); Cc.hline(-1.96 / Math.sqrt(n), { color: 'red', dash: true, width: 1 });
          Cc.text('|r|', 22, 0.2, { size: 12, color: 'accent', weight: 700 }); Cc.text('r', 22, 0.03, { size: 12, color: 'muted', weight: 700 });
        });
        v.readout(() => `${agg.value === 1 ? 'Daily' : agg.value === 5 ? 'Weekly' : 'Monthly'} returns, ${st.n} observations: kurtosis **${v.fix(st.k4, 1)}** (normal: 3). Beyond ±4σ: **${st.big}** observations against ${v.fix(st.ex, 2)} expected under the normal; worst move ${v.fix(st.worst, 1)}σ.\nDaily autocorrelation, full sample: returns at lag 1 ${fx(acR[0], 3)}; absolute returns ${fx(acAbs[0], 2)} at lag 1, ${fx(acAbs[9], 2)} at lag 10, ${fx(acAbs[39], 2)} at lag 40 (the dashed band ±${v.fix(1.96 / Math.sqrt(n), 3)} is the 95% limit for no correlation).`);
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Model',
      name: 'GARCH(1,1) volatility',
      statement: String.raw`In the **GARCH(1,1)** model the return is $r_t=\sigma_t z_t$ with $z_t$ i.i.d. (mean 0, variance 1) and a conditional variance that updates with the last shock and its own past,
$$\sigma_t^2=\omega+\alpha\,r_{t-1}^2+\beta\,\sigma_{t-1}^2 ,\qquad \omega>0,\ \alpha,\beta\ge 0 .$$
If $\alpha+\beta<1$ the process is covariance-stationary with long-run variance $\bar\sigma^2=\omega/(1-\alpha-\beta)$ and the shocks to variance decay geometrically with persistence $\alpha+\beta$ (half-life $\ln\tfrac12/\ln(\alpha+\beta)$). The returns are **uncorrelated** but $r_t^2$ and $|r_t|$ are autocorrelated (clustering), and even with normal $z_t$ the unconditional distribution has fat tails; for normal $z_t$ its kurtosis is $3\,\dfrac{1-(\alpha+\beta)^2}{1-(\alpha+\beta)^2-2\alpha^2}$ whenever the denominator is positive.

Scope: a parametric model of the conditional variance, fitted by maximum likelihood; the fit to U.S. equity data has $\alpha\approx0.1$ and $\beta\approx0.9$ with $\alpha+\beta$ close to 1.`,
      idea: String.raw`After a large shock $r_{t-1}^2$ is large, so $\sigma_t^2$ jumps up; because $\beta$ is close to 1 the elevated variance decays slowly, producing a cluster of large moves. A mixture of normals with a persistent random variance gives fat tails; the tail weight rises with $\alpha$ and with the persistence $\alpha+\beta$. Rewriting $\sigma^2_t$ as an exponentially weighted moving average of past $r^2$ shows why the model is a smoother, parametric version of the rolling-window volatility estimators of practice (Engle 1982 for ARCH; Bollerslev 1986 for the generalisation). Estimating $(\omega,\alpha,\beta)$ by maximum likelihood $\sum_t\big[\ln\sigma_t^2+r_t^2/\sigma_t^2\big]$ uses the one-step-ahead variance forecasts.`,
      caption: String.raw`**Top**: a simulated return path (grey) and its conditional $\pm2\sigma_t$ band (blue): volatility clusters when $\alpha$ and $\beta$ are large. **Middle**: the histogram of its standardised returns on a log scale against the normal. **Bottom**: autocorrelation of $|r_t|$ in the simulation (bars) and in the real market series (dots). Set $\alpha=\beta=0$ to recover the i.i.d. benchmark; press **Fit to the real market** to estimate $(\alpha,\beta)$ by maximum likelihood on the 15 897 real daily returns; choose **Student-t** shocks for even heavier tails. (Simulation plus a real-data fit.)`,
      deps: ['fin-5.8'],
      refs: ['Hull ch. 23'],
      tags: ['GARCH', 'volatility', 'maximum likelihood'],
      credit: 'Engle, 1982; Bollerslev, 1986',
      scope: String.raw`A model of conditional variance in a single return series; extensions (asymmetry, long memory) are needed for leverage effects and very persistent volatility.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Autoregressive_conditional_heteroskedasticity' },
      viz(v) {
        const D = daily(), r = D.r, n = D.n;
        const al = v.slider('$\\alpha$ (reaction to the last shock)', 0, 0.3, 0.08, { step: 0.005 });
        const be = v.slider('$\\beta$ (memory of past variance)', 0, 0.995, 0.9, { step: 0.005 });
        const vol = v.slider('long-run volatility (% a year)', 5, 40, 16, { step: 0.5 });
        const dist = v.select('shocks $z_t$', [{ value: 0, label: 'normal' }, { value: 5, label: 'Student-t (5)' }], 0);
        let seed = 5; v.button('New path', () => { seed++; });
        let fit = null;
        const NS = 3000;
        v.button('Fit to the real market', () => {
          const rm = meanOf(r), e = Float64Array.from(r, (x) => x - rm), vr = meanOf(Float64Array.from(e, (x) => x * x));
          const nll = ([a, b]) => { if (a < 1e-4 || b < 0 || a + b > 0.9995) return 1e12; const om = vr * (1 - a - b); let s2 = vr, ll = 0; for (let t = 0; t < n; t++) { ll += Math.log(s2) + e[t] * e[t] / s2; s2 = om + a * e[t] * e[t] + b * s2; } return ll; };
          const res = v.M.nelderMead(nll, [0.08, 0.9], { step: 0.03, tol: 1e-9, maxIt: 120 });
          fit = { a: res.x[0], b: res.x[1] }; al.set(res.x[0]); be.set(res.x[1]); vol.set(Math.sqrt(vr * 252) * 100);
        });
        const A = v.stage({ x: [0, NS], y: [-6, 6], axes: 'box', gutter: true, height: 260, weight: 1.5, minWidth: 320, xlabel: 'day', ylabel: 'return (%)', title: 'simulated returns and the ±2σ band' });
        const B = v.stage({ x: [-8, 8], y: [3e-6, 1], ylog: true, axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 250, xlabel: 'standardised return', ylabel: 'density (log)', title: 'fat tails from clustering' });
        const Cc = v.stage({ x: [0, 41], y: [-0.05, 0.4], axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 250, xlabel: 'lag (days)', ylabel: 'autocorrelation of |r|', title: 'clustering: model and data' });
        const absr = Float64Array.from(r, Math.abs); const acReal = []; for (let k = 1; k <= 40; k++) acReal.push(acf(absr, k));
        let st = {};
        v.render(() => {
          const a = al.value, b = Math.min(be.value, 0.9995 - a), dv = vol.value / 100 / Math.sqrt(252), ps = a + b;
          const om = dv * dv * Math.max(1e-4, 1 - ps);
          const S = simGarch(NS, om, a, b, seed * 31, dist.value), rr = Array.from(S.r, (x) => x * 100), sg2 = Array.from(S.s2, (x) => Math.sqrt(x) * 100);
          const ym = Math.max(4, Math.min(30, ...[0].map(() => Math.max(...rr.map(Math.abs)) * 1.05))); A.setView([0, NS], [-ym, ym]);
          const pts = rr.filter((_, i) => i % 1 === 0).map((x, i) => [i, x]);
          A.path(sg2.map((x, i) => [i, 2 * x]), { color: 'accent', width: 1.4 }); A.path(sg2.map((x, i) => [i, -2 * x]), { color: 'accent', width: 1.4 });
          A.path(pts, { color: 'muted', width: 0.8 });
          const mu = meanOf(S.r), sd = sdOf(S.r), z = Array.from(S.r, (x) => (x - mu) / sd); const nb = 49, lo = -8, hi = 8, w = (hi - lo) / nb, cnt = new Array(nb).fill(0);
          for (const q of z) { const k = Math.floor((q - lo) / w); if (k >= 0 && k < nb) cnt[k]++; }
          B.fn((x) => normPdf(x), { domain: [-8, 8], color: 'green', width: 2.2, n: 240 });
          B.dots(cnt.map((c, k) => c > 0 ? [lo + (k + 0.5) * w, c / (z.length * w)] : null).filter(Boolean), { r: 3.6, color: 'accent' });
          const ab = Float64Array.from(S.r, Math.abs); const acs = []; for (let k = 1; k <= 40; k++) acs.push(acf(ab, k));
          Cc.hline(0, { color: 'faint' }); Cc.bars(acs, { x0: 1, dx: 1, color: 'accent' }); Cc.dots(acReal.map((x, i) => [i + 1, x]), { r: 3.4, color: 'red' });
          Cc.text('real market', 24, 0.28, { size: 11.5, color: 'red', weight: 700 }); Cc.text('model', 24, 0.19, { size: 11.5, color: 'accent', weight: 700 });
          const den = 1 - ps * ps - 2 * a * a;
          st = { ps, kt: kurtosis(S.r), kth: den > 0 && dist.value === 0 ? 3 * (1 - ps * ps) / den : null, half: ps > 0 && ps < 1 ? Math.log(0.5) / Math.log(ps) : Infinity, ac1: acs[0] };
        });
        v.readout(() => `$\\alpha+\\beta=${v.fix(st.ps, 3)}$, half-life of a variance shock **${isFinite(st.half) ? v.fix(st.half, 0) + ' days' : '∞'}**; simulated kurtosis **${v.fix(st.kt, 1)}**${st.kth ? ` (formula for normal shocks: ${v.fix(st.kth, 1)})` : ''}, lag-1 autocorrelation of $|r|$ ${fx(st.ac1, 2)}; real market: kurtosis ${v.fix(kurtosis(r), 1)}, lag-1 ${fx(acReal[0], 2)}.${fit ? `\nMaximum-likelihood fit to the 15 897 real days: $\\hat\\alpha=${v.fix(fit.a, 3)}$, $\\hat\\beta=${v.fix(fit.b, 3)}$, persistence ${v.fix(fit.a + fit.b, 3)}.` : '\nPress “Fit to the real market” for the maximum-likelihood estimate.'}`);
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Phenomenon',
      name: 'Speculative bubbles: tulips, South Sea, dot-com',
      statement: String.raw`A **speculative bubble** is a rapid, large rise in an asset's price that cannot be explained by changes in fundamentals and ends in a sharp collapse. Famous episodes: the Dutch **tulip mania** (1636–37, contract prices for bulbs collapsing in February 1637), the **South Sea bubble** (1720, the company's shares rising roughly eightfold within months and falling back to near their starting level), and the **dot-com bubble** (U.S. technology stocks, boom in 1995–2000, bust 2000–2002). Rescaled to their peaks, the price histories share a shape: accelerating run-up, peak, and a collapse that is faster than the climb.

Contested points: how large the fundamental component was (the tulip case in particular is debated) and whether the price at the top was irrational or reflected hard-to-measure fundamentals, e.g. in the South Sea case, the ex-ante prospects of the company's debt conversion scheme.

Scope: qualitative regularities from a handful of historical episodes; the dot-com series below is real data, the historical anchors are approximate and the herding panel is a model.`,
      idea: String.raw`Excess volatility (fin-5.6) says prices move more than dividends justify; bubbles are the extreme case. Several mechanisms are proposed: positive feedback (investors buy because prices are rising), herding and information cascades (observing others' choices outweighs one's own signal), limits to arbitrage (fin-5.7: the skeptic is wiped out before the collapse), and rational bubbles (fin-5.11). The herding panel shows the simplest version: when agents copy each other, the share of optimists drifts to extremes for long periods, and the price, which depends on it, runs away from the fundamental value and falls back when the herd turns.`,
      caption: String.raw`**Left**: price histories rescaled to 100 at their peak and aligned on the peak month. Real data: the U.S. high-technology and telecom industry portfolios and the whole market around the 2000 peak (monthly, French library); the red dots are approximate South Sea anchors (about 128 in January 1720, a peak a little above 1000 in mid-1720, about 150 by late September), drawn only as markers. **Right**: a herding model of 100 agents each either optimistic or pessimistic; the price is $100\,e^{1.2(x-1/2)}$ with $x$ the share of optimists, and the fundamental value stays at 100. Switch from **independent** to **herding** and lower the **independent-thinking rate** $\varepsilon$: long boom-and-bust episodes appear without any news. (Stylised model.)`,
      deps: ['fin-5.6', 'soc-5.4'],
      refs: ['BKM ch. 12'],
      tags: ['bubbles', 'herding', 'history'],
      credit: 'Kindleberger; Temin & Voth, 2004; Kirman, 1993 (the herding model)',
      scope: String.raw`Historical episodes are one-off; the herding model is an illustration of a mechanism, not a calibrated description of any of them.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Economic_bubble' },
      viz(v) {
        const d = data();
        const mode = v.select('traders', [{ value: 'ind', label: 'independent' }, { value: 'herd', label: 'herding' }], 'herd');
        const eps = v.slider('independent-thinking rate $\\varepsilon$', 0.0005, 0.05, 0.004, { log: true, sig: 2 });
        let seed = 9; v.button('New history', () => { seed++; });
        const A = v.stage({ x: [-60, 36], y: [0, 112], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 300, xlabel: 'months from the peak', ylabel: 'price (peak = 100)', title: 'the dot-com boom and bust (real) and 1720 (anchors)' });
        const B = v.stage({ x: [0, 400], y: [60, 220], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 280, xlabel: 'day', ylabel: 'price (fundamental value = 100)', title: 'herding model' });
        // real series: cumulative total return of HiTec, Telcm and the market, 1993-01 … 2005-12; align on the HiTec peak
        const i0 = (1993 - 1963) * 12 - 6, i1 = (2006 - 1963) * 12 - 6;
        const idx = (series) => { const o = [100]; for (let i = i0; i < i1; i++) o.push(o[o.length - 1] * (1 + series[i])); return o; };
        const hi = idx(d.ind[4]), te = idx(d.ind[5]), mk = idx(Float64Array.from(d.mkt, (x, i) => x + d.rf[i]));
        let pk = 0; for (let i = 0; i < hi.length; i++) if (hi[i] > hi[pk]) pk = i;
        const peakLabel = monthLabel(i0 + pk - 1);
        let st = {};
        v.render(() => {
          const ser = (a, c) => a.map((x, i) => [i - pk, 100 * x / a[pk]]).filter(([t]) => t >= -60 && t <= 36);
          A.hline(100, { color: 'faint', dash: true }); A.vline(0, { color: 'faint', dash: true });
          A.path(ser(hi), { color: 'accent', width: 2.6 }); A.path(ser(te), { color: 'purple', width: 2 }); A.path(ser(mk), { color: 'muted', width: 2 });
          A.text('high-tech (US)', -24, 35, { size: 11.5, color: 'accent', weight: 700 }); A.text('telecom', -14, 72, { size: 11.5, color: 'purple', weight: 700 }); A.text('whole market', 12, 65, { size: 11.5, color: 'muted', weight: 700 });
          A.dots([[-6, 12.8], [3, 15]], { r: 6, color: 'red' }); A.text('South Sea (anchors)', -6, 12.8, { dx: 8, dy: -12, size: 11, color: 'red', weight: 700 });
          A.corner(`peak: ${peakLabel}`, 'tr', { color: 'muted' });
          // herding model
          const N = 100, T = 400, R = rng(seed * 1237); let k = 50; const xs = [];
          for (let t = 0; t < T; t++) {
            for (let u = 0; u < N; u++) {
              const opt = R() < k / N;
              let nw;
              if (mode.value === 'ind') nw = R() < 0.5; else if (R() < eps.value) nw = R() < 0.5; else nw = R() < (k - (opt ? 1 : 0)) / (N - 1);
              k += (nw ? 1 : 0) - (opt ? 1 : 0);
            }
            xs.push(k / N);
          }
          const pr = xs.map((x) => 100 * Math.exp(1.2 * (x - 0.5)));
          B.hline(100, { color: 'green', dash: true, width: 2 }); B.text('fundamental value', T, 100, { dx: -4, dy: 12, align: 'right', size: 11, color: 'green', weight: 700 });
          B.path(pr.map((y, t) => [t, y]), { color: 'accent', width: 2 });
          let above = 0, mx = 0, mn = 1e9; for (const y of pr) { if (y > 130) above++; mx = Math.max(mx, y); mn = Math.min(mn, y); }
          B.hline(130, { color: 'red', dash: true, width: 1 }); B.text('bubble: > 130', 2, 130, { dx: 4, dy: -9, size: 10.5, color: 'red' });
          st = { above: above / T, mx, mn };
        });
        v.readout(() => `Real data: from its peak (${peakLabel}) the high-tech portfolio fell **${v.fix(100 - 100 * hi[Math.min(hi.length - 1, pk + 30)] / hi[pk], 0)}%** in 30 months, after rising **${v.fix(100 * hi[pk] / hi[Math.max(0, pk - 60)] - 100, 0)}%** in the five years before (total returns, dividends reinvested).\nHerding model: price ranged from ${v.fix(st.mn, 0)} to ${v.fix(st.mx, 0)} around a fixed fundamental value of 100; it was above 130 on **${pct(st.above, 0)}** of days. With independent traders the price barely leaves the 95–105 range.`);
      },
    },
  ],
};
