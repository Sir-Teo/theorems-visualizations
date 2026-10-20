// Finance — Chapter 5 (part 2): items 5.6–5.10.
//
// Sources and honesty notes (checked Oct 2026): Shiller, AER 71(3):421–436 (1981); LeRoy & Porter, Econometrica 49(3):555–574 (1981);
// Shleifer & Vishny, J. Finance 52(1):35–55 (1997); De Long, Shleifer, Summers & Waldmann, JPE 98(4):703–738 (1990); Rosenthal & Young, JFE 26(1):123–141 (1990);
// Froot & Dabora, JFE 53(2):189–216 (1999); Mandelbrot, J. Business 36(4):394–419 (1963); Engle, Econometrica 50(4):987–1007 (1982); Bollerslev, J. Econometrics 31(3):307–327 (1986);
// 5.10: Garber (1989), Temin & Voth (2004), and Moran et al. (2021 preprint version, opening §III); copying rule authored. No direct Kirman1993 reading is claimed.
// Real data: Shiller's annual series and the daily market in ch05.shared.js; monthly industry returns (French library) via ch04.shared.js. Simulations are labelled.
import { speculationHistorical, speculationHistory, speculationStationary, monthOrdinal } from './source-audit-speculation.js';
import { arbitrageGap, arbitrageOutcome, arbitrageSample } from './source-audit-arbitrage.js';
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
          A.text('p* (ex-post rational)', 1925, ps[54], { dy: 22, size: 11.5, color: 'green', weight: 700 });
          const xs = [], ys = []; for (let r = 0.02; r <= 0.1201; r += 0.0025) { xs.push(r); ys.push(calc(S, r).sd); }
          B.setView([0.02, 0.12], [0, Math.max(sdp, ...ys) * 1.15]);
          B.path(xs.map((x, i) => [x, ys[i]]), { color: 'green', width: 2.6 });
          B.hline(sdp, { color: 'accent', width: 2.2 }); B.text('sd(p): the price', 0.12, sdp, { dx: -6, dy: -9, align: 'right', size: 11.5, color: 'accent', weight: 700 });
          B.text('sd(p*)', 0.1, ys[ys.length - 4], { dy: 16, size: 11.5, color: 'green', weight: 700 });
          B.dot(rate.value, sds, { r: 7, color: 'gold' });
          req = null; for (let i = 0; i < xs.length; i++) if (ys[i] >= sdp) { req = xs[i]; break; }
          B.vband(0.04, 0.08, { color: 'orange', alpha: 0.08 }); B.text('plausible range', 0.06, sdp * 0.08, { size: 10.5, color: 'orange', align: 'center' });
        });
        v.readout(() => `With $r=${pct(rate.value, 2)}$: $\\mathrm{sd}(p)=${v.fix(sdp, 1)}$, $\\mathrm{sd}(p^*)=${v.fix(sds, 1)}$, ratio ${v.fix(ratio, 2)}; the rational-price bound needs $\\mathrm{sd}(p)\\le\\mathrm{sd}(p^*)$${ratio < 1 ? ', which fails: the price is ' + v.fix(1 / ratio, 1) + ' times as variable as it may be' : ''}.\n${req ? `Only a discount rate of about ${pct(req, 1)} or lower would make $p^*$ as variable as $p$ here, well below the average dividend yield of ${pct(meanOf(shillerDetrended(152).d) / meanOf(shillerDetrended(152).p), 1)}.` : 'No discount rate in the plotted range makes $p^*$ as variable as the price.'}\nDetrending by the fitted real growth of the price (${pct(shillerDetrended(end.value === '1979' ? 109 : 152).g, 2)} a year).`);
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7', kind: 'Concept', name: 'Limits to arbitrage',
      statement: String.raw`A favorable expected return is different from the riskless arbitrage of fin-1.13. A spread can move against a capital-constrained position before it narrows. Shleifer and Vishny's original three-date economy shows how poor performance and withdrawals of outside funds can force arbitrageurs to reduce positions precisely when assets become more underpriced. Their model assumes recovery to fundamental value at date 3; this is a specific assumption, not a property of every mean-reverting process.

The **separate authored daily model** below has a spread in percentage points,
$$m_{t+1}=e^{-\kappa}m_t+\sigma Z_{t+1},$$
with independent standard normal innovations $Z_t$.
Its expected gap tends to zero, but positive noise leaves a nonzero limiting variance: individual paths are not guaranteed to converge to zero. A fixed linear exposure of size $\Lambda$, with initial wealth 1, has marked equity
$$E_t=1+\Lambda(m_0-m_t)/100.$$
The chosen admission rule requires $1>\rho\Lambda$. An admitted position is closed at the first **observed daily** equity at or below $\rho\Lambda$. Its actual observed equity is then held as cash through day 250; a daily overshoot can make it negative.`,
      idea: String.raw`The original agency mechanism concerns investors allocating funds from past performance, rather than knowing an arbitrageur's exact opportunities. The illustration isolates a simpler collateral constraint: it has no outside-fund withdrawals, endogenous market price or optimal position choice, and it does not reproduce the original three-date equilibrium.

For an admitted position the liquidation threshold is
$$m_{\rm exit}=m_0+100/\Lambda-100\rho.$$
This threshold identifies the first sampled crossing; it does not supply the execution price. Without stopping, expected day-250 equity would be
$$1+\Lambda m_0(1-e^{-250\kappa})/100>1.$$
That expected gain is not a sure profit. The actual stopped outcome depends on the entire path. Finite-horizon Gaussian paths and their stopped wealth have finite second moments; prob-2.2.3 explains convergence of independent path averages as the sample grows. Four hundred paths remain a finite estimate with sampling error.`,
      caption: String.raw`**Gap:** one of 400 authored paths. The red guide is the daily liquidation threshold for the chosen admitted position. The spread continues after exit; later narrowing does not pay a closed position.

**Wealth:** the selected position's full equity/cash history. A red dot is its actual daily exit, including any overshoot. If the initial margin is inadmissible, no position opens and wealth stays at 1.

**Exit frequency:** the share of the same 400 paths liquidated by day 250 at each admitted leverage. Shaded leverage values are not admitted, and have no plotted exit statistic.

**Mean terminal wealth:** the stopped sample mean in original wealth units, beside the analytic mean without stopping, over admitted leverages. Negative modeled wealth remains visible. **New paths** refreshes all panels; the boundary button selects an exactly inadmissible initial margin.`,
      deps: ['fin-1.13', 'prob-2.2.3'], see: ['fin-5.1'],
      refs: ['Shleifer & Vishny (1997), introduction and §§I–II, pp.35–47; conclusion p.54'],
      tags: ['arbitrage', 'capital constraints', 'leverage'],
      credit: 'Shleifer & Vishny, 1997; daily spread and margin rule authored here',
      scope: String.raw`Illustrative daily Gaussian spread and fixed linear exposure, not a reconstructed twin-share trade, continuous-time OU liquidation or fund-flow model. There are no financing/transaction costs, limited-liability protection, capital injections or interest on cash. Entry is refused when initial equity does not strictly exceed the chosen maintenance requirement. Daily checks miss intraday crossings; negative equity after a sampled gap is retained rather than capped or reset to the margin. The finite-path comparison is conditional on these assumptions and cannot establish market efficiency or inevitable recovery.`,
      verify: false,
      links: { doi: 'https://doi.org/10.1111/j.1540-6261.1997.tb03807.x', source: 'https://web.stanford.edu/~piazzesi/Reading/ShleiferVishny1997.pdf' },
      viz(v) {
        const m0=v.slider('initial gap (percentage points)',1,12,5,{step:.25});
        const lev=v.slider('fixed exposure $\\Lambda$',1,30,10,{step:.5});
        const sig=v.slider('daily innovation $\\sigma$ (percentage points)',.1,1.2,.6,{step:.05});
        const kap=v.slider('daily reversion parameter $\\kappa$',.002,.05,.01,{log:true,sig:2});
        const rho=v.slider('maintenance margin (% of exposure)',0,20,5,{step:.5});
        let seed=4;v.button('New paths',()=>{seed++;});v.button('Initial admission boundary',()=>{lev.set(10);rho.set(10);});
        const options={axes:'box',gutter:true,height:310,minWidth:260};
        const A=v.stage({...options,x:[-12,262],y:[-5,20],xlabel:'day',ylabel:'spread (percentage points)',title:'one authored gap path'});
        const B=v.stage({...options,x:[-12,262],y:[-1,4],xlabel:'day',ylabel:'equity / cash (initial wealth = 1)',title:'actual marked wealth and exit'});
        const C=v.stage({...options,x:[0,31],y:[-10,110],xlabel:'fixed exposure Λ',ylabel:'liquidated by day 250 (%)',title:'400-path daily liquidation frequency'});
        const D=v.stage({...options,x:[0,31],y:[0,4],xlabel:'fixed exposure Λ',ylabel:'terminal wealth (initial wealth = 1)',title:'stopped sample mean and unstopped expectation'});
        v.legend([['accent','selected gap / open position'],['red','daily liquidation / threshold'],['green','stopped sample mean / cash'],['teal','analytic mean without stopping'],['muted','inadmissible initial margin',{area:true}]]);
        const exposures=Array.from({length:59},(_,j)=>1+j/2),pad=values=>{const lo=Math.min(0,...values),hi=Math.max(1,...values),p=.1*(hi-lo)+.1;return[lo-p,hi+p];};
        let cache,pathKey='',summaryKey='',rows=[],st={};
        v.render(()=>{
          const key=[seed,m0.value,kap.value,sig.value].join('|');
          if(key!==pathKey){const R=rng(seed*4099+13);cache=Array.from({length:400},()=>arbitrageGap(m0.value,kap.value,sig.value,()=>R.normal()));pathKey=key;summaryKey='';}
          const L=lev.value,margin=rho.value/100,selected=arbitrageOutcome(cache[0],L,margin),next=key+'|'+margin;
          if(summaryKey!==next){rows=exposures.map(leverage=>({leverage,...arbitrageSample(cache,leverage,margin),unstopped:1+leverage*m0.value*(-Math.expm1(-250*kap.value))/100}));summaryKey=next;}
          const valid=rows.filter(q=>q.status==='admissible'),chosen=rows.find(q=>q.leverage===L),p=cache[0].path;
          A.setView([-12,262],pad([...p,...(selected.threshold===null?[]:[selected.threshold])]));
          A.hline(0,{color:'green',dash:[4,4]});A.path(p.map((x,t)=>[t,x]),{color:'accent',width:2});
          if(selected.threshold!==null)A.hline(selected.threshold,{color:'red',dash:[4,4]});
          if(selected.exitDay!==null)A.dot(selected.exitDay,p[selected.exitDay],{color:'red',r:6});
          B.setView([-12,262],pad([...selected.equity,margin*L]));B.hline(1,{color:'faint'});B.hline(margin*L,{color:'red',dash:[4,4]});
          B.path(selected.equity.map((x,t)=>[t,x]),{color:selected.status==='liquidated'?'red':selected.status==='inadmissible'?'green':'accent',width:2.5});
          if(selected.exitDay!==null)B.dot(selected.exitDay,selected.wealth,{color:'red',r:6});
          D.setView([0,31],pad(valid.flatMap(q=>[q.mean,q.unstopped])));
          if(margin>0&&1/margin<31){const boundary=1/margin;for(const s of[C,D])s.rect(boundary,s.view.y[0],31,s.view.y[1],{fill:'muted',fillAlpha:.13,stroke:false});}
          C.path(valid.map(q=>[q.leverage,100*q.probability]),{color:'red',width:2.4});
          D.path(valid.map(q=>[q.leverage,q.mean]),{color:'green',width:2.4});D.path(valid.map(q=>[q.leverage,q.unstopped]),{color:'teal',width:1.8,dash:[5,3]});
          for(const s of[C,D])s.vline(L,{color:'gold',width:1.4});
          if(chosen.status==='admissible'){C.dot(L,100*chosen.probability,{color:'gold',r:5});D.dot(L,chosen.mean,{color:'gold',r:5});}
          st={seed,m0:m0.value,kappa:kap.value,sigma:sig.value,leverage:L,margin,selected,rows,chosen,gap:p,unstopped:1+L*m0.value*(-Math.expm1(-250*kap.value))/100};
        });
        v.readout(()=>{
          const q=st.selected,s=st.chosen;
          if(q.status==='inadmissible')return `**No position admitted:** initial wealth 1 does not strictly exceed the maintenance requirement ${v.fix(st.margin*st.leverage,3)}. Selected wealth remains 1; this is not an immediate simulated liquidation. There is no exit-frequency or stopped-mean statistic at this exposure. Curves use only admitted exposures. All 400 spread paths still belong to the chosen model.`;
          const state=q.exitDay===null?`No daily liquidation by day 250; marked final wealth ${v.fix(q.wealth,4)}.`:`Daily liquidation on day **${q.exitDay}**: observed gap ${v.fix(st.gap[q.exitDay],4)} pp, threshold ${v.fix(q.threshold,4)} pp, actual exit wealth **${v.fix(q.wealth,4)}**, held as cash thereafter.`;
          return `${state}\nAmong all 400 matched paths: ${s.liquidated}/400 liquidated (${pct(s.probability,1)}); estimated frequency SE ${v.fix(100*s.probabilitySE,2)} percentage points. Stopped mean wealth ${v.fix(s.mean,4)}, estimated SE ${v.fix(s.se,4)}; individual final wealth ranges from ${v.fix(s.min,4)} to ${v.fix(s.max,4)}. Analytic mean without stopping ${v.fix(st.unstopped,4)}. These finite sample results are neither sure recovery nor an executable arbitrage profit. All four panels resample together.`;
        });
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
        const Cc = v.stage({ x: [0, 41], y: [-0.1, 0.4], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'lag k (days)', ylabel: 'autocorrelation', title: 'autocorrelation of returns (dots) and of |returns| (bars)' });
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
          A.text('normal', 2.2, 0.12, { size: 11.5, color: 'green', weight: 700 }); A.text('real returns', -8.8, 3e-2, { size: 11.5, color: 'accent', weight: 700 });
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
          Cc.text('real market', 30, 0.27, { size: 11.5, color: 'red', weight: 700 }); Cc.text('model', 30, 0.12, { size: 11.5, color: 'accent', weight: 700 });
          const den = 1 - ps * ps - 2 * a * a;
          st = { ps, kt: kurtosis(S.r), kth: den > 0 && dist.value === 0 ? 3 * (1 - ps * ps) / den : null, half: ps > 0 && ps < 1 ? Math.log(0.5) / Math.log(ps) : Infinity, ac1: acs[0] };
        });
        v.readout(() => `$\\alpha+\\beta=${v.fix(st.ps, 3)}$, half-life of a variance shock **${isFinite(st.half) ? v.fix(st.half, 0) + ' days' : '∞'}**; simulated kurtosis **${v.fix(st.kt, 1)}**${st.kth ? ` (formula for normal shocks: ${v.fix(st.kth, 1)})` : ''}, lag-1 autocorrelation of $|r|$ ${fx(st.ac1, 2)}; real market: kurtosis ${v.fix(kurtosis(r), 1)}, lag-1 ${fx(acReal[0], 2)}.${fit ? `\nMaximum-likelihood fit to the 15 897 real days: $\\hat\\alpha=${v.fix(fit.a, 3)}$, $\\hat\\beta=${v.fix(fit.b, 3)}$, persistence ${v.fix(fit.a + fit.b, 3)}.` : '\nPress “Fit to the real market” for the maximum-likelihood estimate.'}`);
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10', kind: 'Phenomenon', name: 'Speculative bubbles: tulips, South Sea, dot-com',
      statement: String.raw`Calling a price episode a **speculative bubble** requires a benchmark for fundamental value, based on cash flows, discounting and information. A large rise and subsequent fall alone does not identify that component, and a bubble need not end in a crash within an observed window (5.11).

Historical cases have different evidence. **Tulips, 1636–37:** Garber (1989) distinguishes rare bulbs, whose high prices could reflect scarcity and reproduction, from the sharp common-bulb speculation around January–February 1637; he stresses incomplete data and disputed fundamentals. **South Sea, 1720:** Temin and Voth (2004) interpret Hoare's Bank as knowingly riding overvaluation and emphasize coordination problems, without claiming one cause explains the whole episode. **Technology stocks around 2000:** the plotted portfolio return indices document a boom and decline; they do not estimate fundamental value or identify why investors traded.`,
      idea: String.raw`The left panel compounds monthly total returns, $W_t=W_{t-1}(1+r_t)$ (fin-1.1), then divides each series by its own value on the **same high-tech peak date**. Thus all three equal 100 at that date; their individual maxima need not coincide. These are value-weighted high-tech and telecom portfolios and the broad U.S. market from the French library, including dividends. They are not the NASDAQ index or a reconstruction of tulip and South Sea quotations.

The right panel is an **authored finite copying chain**, motivated by recruitment as discussed by Moran, Fosset, Kirman and Benzaquen (2021 preprint version, opening §III). It has $N=100$ binary agents and optimistic count $k$. One update selects a random agent: with probability $\varepsilon$ it resets to a fair coin, otherwise it copies a uniformly chosen *other* agent. Hence
$$u_k=\frac{N-k}{N}\left[\frac\varepsilon2+(1-\varepsilon)\frac{k}{N-1}\right],$$
$$d_k=\frac{k}{N}\left[\frac\varepsilon2+(1-\varepsilon)\frac{N-k}{N-1}\right].$$
The remaining probability leaves $k$ unchanged. In **independent** mode every update resets the chosen agent. No private signals, Bayesian learning, trades or fundamental news enter this chain.

Detailed balance (prob-5.5.2a) gives $\pi_{k+1}/\pi_k=u_k/d_{k+1}$. In copying mode the stationary count is beta-binomial with
$$a=\frac{\varepsilon(N-1)}{2(1-\varepsilon)},\qquad E[k/N]=\tfrac12,$$
$$\operatorname{var}(k/N)=\frac{N+2a}{4N(2a+1)}.$$
Independent mode instead has a binomial $(N,\tfrac12)$ count and standard deviation $1/(2\sqrt N)=.05$ for the optimistic fraction. Finite paths started at $k=50$ need not reproduce the stationary distribution. The chosen price map $P(k)=100e^{1.2(k/N-1/2)}$ and reference value 100 are authored assignments, not equilibrium asset valuations.`,
      caption: String.raw`**Left:** month-end total-return observations at equal monthly intervals, with all three portfolios set to 100 in the high-tech portfolio's March 2000 peak month. The full five years before and three years after are shown. Dividends are reinvested; there are no fees or inflation adjustments. The observation window is selected retrospectively.

**Right:** 400 simulation **sweeps**, each containing 100 single-agent updates, starting with half the agents optimistic. Switch the update rule, change $\varepsilon$ in copying mode, or select **New history**. The full possible price range $100e^{-.6}$–$100e^{.6}$ remains visible. The 130 line is an illustrative threshold, not a test for a bubble. Exact stationary summaries and the finite path are reported separately.`,
      deps: ['fin-1.1', 'prob-5.5.2a'], see: ['fin-5.6', 'fin-5.7', 'fin-5.11', 'soc-5.4'],
      refs: ['Garber (1989), §§I,IV,VI–VII', 'Temin & Voth (2004), introduction, §I and conclusions', 'Moran, Fosset, Kirman & Benzaquen (2021 preprint version), opening §III', 'Kenneth R. French Data Library, monthly factors and 10 industry portfolios, CRSP 202608'],
      tags: ['bubbles', 'herding', 'history'],
      credit: 'Historical interpretations: Garber (1989), Temin and Voth (2004); copying rule and price assignment authored here',
      scope: String.raw`The copying/reset rule, price assignment and fixed reference are explicit teaching assumptions. The recruitment motif follows the later primary discussion; the transition probabilities and invariant law are derived for this authored rule. Neither this mechanism nor the portfolio curves establish an information cascade, a historical cause, irrationality or a profitable trading rule. The date window and peak are selected retrospectively.`,
      verify: false,
      links: { source: 'https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html', tulips: 'https://ms.mcmaster.ca/~grasselli/Garber89.pdf', southsea: 'https://people.bu.edu/chamley/565-24/VothTemin-co.pdf', recruitment: 'https://arxiv.org/abs/2009.10563' },
      viz(v) {
        const historical = speculationHistorical(data());
        const mode = v.select('agent update rule', [{ value: 'ind', label: 'independent reset' }, { value: 'herd', label: 'copying + reset' }], 'herd');
        const eps = v.slider('fair-coin reset probability $\\varepsilon$', .0005, .05, .004, { log: true, sig: 2 });
        let seed = 9; v.button('New history', () => { seed++; });
        const A = v.stage({ x: [1995, 2003.4], y: [0, 124], axes: 'box', gutter: true, height: 360, weight: 1.2, minWidth: 300, xlabel: 'return month', ylabel: 'total-return index (March 2000 = 100)', xticks: [[1995, '1995'], [1997, '1997'], [1999, '1999'], [2001, '2001'], [2003, '2003']], title: 'U.S. portfolio total-return growth' });
        const B = v.stage({ x: [-14, 414], y: [45, 195], axes: 'box', gutter: true, height: 360, weight: 1.2, minWidth: 300, xlabel: 'simulation sweep (100 updates)', ylabel: 'authored price assignment', title: 'finite copying-chain history' });
        v.legend([['accent', 'high-tech total return'], ['purple', 'telecom total return'], ['muted', 'broad-market total return'], ['orange', 'authored copying-chain price'], ['green', 'assigned reference 100'], ['red', 'illustrative threshold 130']]);
        let info = {}, cache = { key: '', history: null, stationary: null };
        v.render(() => {
          eps.el.hidden = mode.value === 'ind';
          const next = [seed, eps.value, mode.value].join('|');
          if (cache.key !== next) cache = { key: next, history: speculationHistory(eps.value, mode.value, rng(seed * 1237)), stationary: speculationStationary(eps.value, mode.value) };
          const { history, stationary } = cache, peakX = monthOrdinal(historical.peakYm) / 12;
          A.hline(100, { color: 'faint', dash: true }); A.vline(peakX, { color: 'faint', dash: true });
          historical.series.forEach((s, i) => A.path(s.points, { color: ['accent', 'purple', 'muted'][i], width: i ? 2 : 2.6 }));
          A.dot(peakX, 100, { r: 5, color: 'accent' }); A.text('March 2000', peakX, 100, { align: 'center', dy: -18, size: 11, color: 'accent', weight: 700 });
          B.hline(100, { color: 'green', dash: true, width: 1.6 }); B.hline(130, { color: 'red', dash: true, width: 1.2 });
          B.path(history.prices.map((p, t) => [t, p]), { color: 'orange', width: 2.3 }); B.dot(400, history.prices[400], { r: 5, color: 'orange' });
          info = { historical, mode: mode.value, epsilon: eps.value, seed, history, stationary };
        });
        const chance = x => x < .0001 ? `${(100 * x).toExponential(3)}%` : pct(x, 3);
        v.readout(() => {
          const { history: h, stationary: q, mode: kind, epsilon } = info;
          return `Historical high-tech total-return index: shared peak date **2000-03**; gain over 60 months ${pct(historical.rise60, 3)}; change through **2002-09**, 30 months later, ${pct(historical.change30, 3)}. Each comparison series equals 100 at the shared date.\n\nAuthored history: price range ${v.fix(h.minimum, 3)}–${v.fix(h.maximum, 3)}; above 130 in ${pct(h.above, 2)} of the 400 recorded sweeps. Exact **stationary** optimistic-fraction mean ${v.fix(q.mean, 3)}, standard deviation ${v.fix(Math.sqrt(q.variance), 6)}; stationary probability of price above 130 is ${chance(q.above)}. ${kind === 'ind' ? 'Independent resets do not confine every price to 95–105.' : `Reset probability ${v.fix(epsilon, 6)}; copying can generate persistent extremes with no exogenous information input.`} A finite path is not a stationary-distribution estimate or evidence about a named historical market.`;
        });
      },
    },
  ],
};
