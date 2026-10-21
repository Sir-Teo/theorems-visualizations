// Finance — Chapter 5: Efficient markets, volatility and bubbles (items 5.1–5.5; 5.6–5.10 are in ch05-b.js, 5.11–5.15 in ch05-c.js)
//
// Sources and honesty notes (checked Oct 2026): Fama, J. Finance 25(2):383–417 (1970); Samuelson, Industrial Management Review 6(2):41–49 (1965);
// Grossman & Stiglitz, AER 70(3):393–408 (1980); Ball & Brown, J. Accounting Research 6(2):159–178 (1968); Fama, Fisher, Jensen & Roll, Int. Econ. Rev. 10(1):1–21 (1969);
// Patell & Wolfson, J. Financial Economics 13(2):223–252 (1984) (abstract: trading-rule profits on Broad Tape earnings and dividend releases dissipate within 5–10 minutes);
// Jensen, J. Finance 23(2):389–416 (1968); Carhart, J. Finance 52(1):57–82 (1997); Fama & French, J. Finance 65(5):1915–1947 (2010).
// Real data: the daily market series (Kenneth R. French's Data Library) in ch05.shared.js. Everything labelled "stylised" or "model" is a simulation, not data.
import { clamp, pct, fx, sg, daily, acf, normCdf, normPdf, pricePath, rng } from './ch05.shared.js';

import { dailyCalendar } from './source-audit-daily-calendar.js';
import { signRule, wealthPath, newsLevel } from './source-audit-efficiency.js';
import { SPIVA_2024_LARGE_CAP, eventStudy, eventIntraday, fundLaw, fundScatter } from './source-audit-events-funds.js';

export default {
  collection: 'fin',
  chapter: 5,
  title: 'Efficient markets, volatility and bubbles',
  summary: String.raw`Market efficiency is stated relative to information and a model of required returns: predictable raw returns can still compensate for risk. Tests distinguish that benchmark from abnormal returns, while examining price adjustment, manager performance, volatility and bubbles. Historical data and authored simulations make different kinds of evidence.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Hypothesis',
      name: 'The efficient-market hypothesis',
      statement: String.raw`A market is **efficient with respect to an information set** $\Phi_t$ when prices fully reflect that information. To give this claim testable content in an expected-return model, specify an integrable, $\Phi_t$-measurable equilibrium return benchmark $b_t$ from a model of risk, and test the **joint restriction**
$$\mathrm E[r_{t+1}-b_t\mid\Phi_t]=0.$$
For a bounded $\Phi_t$-measurable position $h_t$, taking out what is known gives $\mathrm E[h_t(r_{t+1}-b_t)\mid\Phi_t]=0$; subtracting nonnegative trading costs cannot create a positive expected abnormal gain. **Weak:** past prices and volumes. **Semi-strong:** all public information. **Strong:** all information, including private information. With the same benchmark and admissible rules, efficiency for a larger information set implies it for a smaller one.

The identity $\mathrm E[r-\mathrm E(r\mid\Phi)\mid\Phi]=0$ holds for every integrable return; it is not by itself a test of efficiency. The economic restriction comes from a separately specified benchmark. Predictable raw returns may be compensation for risk. Independent, identically distributed returns are a stronger assumption.`,
      idea: String.raw`Fama's expected-return formulation makes a benchmark model unavoidable: an apparent abnormal return may reflect information omitted from prices, a wrong model of risk, or a sampling fluctuation. The conditional-expectation rule prob-4.1.14 proves the trading-system implication once the joint restriction is assumed. Competition motivates the hypothesis, but it does not prove that every raw price or return change is unpredictable. Costs, implementable information and the chosen risk model all matter in an empirical test.`,
      caption: String.raw`Choose one of three nested information sets. **Weak** uses 15,897 real daily market-return observations, July 1963–August 2026, with their actual observation dates. The paper rule holds yesterday's sign (zero counts as long); it starts flat, applies a charge to opening, each signal change and closing. This is an approximate signal-change cost model: daily leverage resets and their rebalancing trades are uncharged. The earliest return supplies a lag, so the full sample has 15,896 rule days. Compare gross buy-and-hold with gross and net rule wealth. These are unadjusted hypothetical index returns. **Semi-strong / strong** uses an authored news-level model: public entry starts at time zero; the private-information case permits earlier entry. The remaining normalized news change is not a holding-period return or a risk-adjusted profit.`,
      deps: ['fin-1.5', 'prob-4.1.14'],
      refs: ['Fama (1970), §§I–II, pp.383–388'],
      tags: ['market efficiency', 'information', 'fair game'],
      credit: 'Eugene F. Fama, 1970',
      scope: String.raw`An expected-return formulation of a hypothesis, conditional on a risk model, information and admissible trading rules. The index rule assumes executable index closes, frictionless short exposure before the stated cost, and no cash interest, borrowing fee or risk adjustment. Daily target exposures are reset; the signal-change charge omits turnover needed to rebalance a continuing short position, so it is not an all-in self-financing implementation cost. Historical index closes can be stale; descriptive sample returns cannot establish an implementable profit or prove/reject efficiency. The news panel is a chosen deterministic level response with full eventual adjustment, not event-study data.`,
      verify: false,
      links: { doi: 'https://doi.org/10.1111/j.1540-6261.1970.tb00518.x', source: 'https://people.hec.edu/rosu/wp-content/uploads/sites/43/2023/09/Fama-Efficient-capital-markets-1970.pdf' },
      viz(v) {
        const D = daily(), calendar = dailyCalendar();
        const form = v.select('information set', [{ value: 'weak', label: 'weak' }, { value: 'semi', label: 'semi-strong' }, { value: 'strong', label: 'strong' }], 'weak');
        const samp = v.select('sample', [{ value: 'b', label: '1990–2026' }, { value: 'a', label: '1963–1989' }, { value: 'all', label: '1963–2026' }], 'b');
        const cost = v.slider('charge (bp per signal-unit change, open/close included)', 0, 10, 2, { step: 0.25 });
        const leak = v.slider('pre-announcement news-level share', 0, 1, 0.2, { step: 0.01, fmt: (x) => pct(x, 0) });
        const tau = v.slider('adjustment time (minutes, authored model)', 0.2, 60, 5, { log: true, sig: 2 });
        const ent = v.slider('entry time (minutes from announcement)', -30, 30, 2, { step: 0.5 });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.4], equal: true, axes: false, height: 330, weight: 0.9, minWidth: 250, title: 'nested information sets' });
        const W = v.stage({ x: [1963, 2027], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'actual calendar year', ylabel: 'log₁₀ wealth (initial wealth = 1)', title: 'lagged-sign paper rule (real daily index data)' });
        const E = v.stage({ x: [-34, 34], y: [-0.12, 1.2], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'minutes from announcement', ylabel: 'normalized news level', title: 'authored response, eventual level = 1' });
        let cache, key, st = {};
        const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
        const date = x => String(x).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
        v.render(() => {
          const weak = form.value === 'weak';
          samp.el.hidden = cost.el.hidden = !weak; leak.el.hidden = tau.el.hidden = ent.el.hidden = weak;
          W.el.style.display = weak ? '' : 'none'; E.el.style.display = weak ? 'none' : '';
          const cols = ['red', 'orange', 'green'], rs = [1.15, 0.8, 0.42], sel = form.value === 'strong' ? 0 : form.value === 'semi' ? 1 : 2;
          for (let k = 0; k < 3; k++) { const on = k >= sel; C.circle(0, 0, rs[k], { fill: on ? cols[k] : 'grid', fillAlpha: on ? 0.28 : 0.1, color: on ? cols[k] : 'faint', width: k === sel ? 3 : 1.5 }); }
          C.text('past prices', 0, 0.06, { align: 'center', size: 11, color: 'ink', weight: 700 }); C.text('and volumes', 0, -0.12, { align: 'center', size: 11, color: 'ink', weight: 700 });
          C.text('public information', 0, 0.58, { align: 'center', size: 11, color: 'ink', weight: 700 });
          C.text('all information', 0, 1.02, { align: 'center', size: 11, color: 'ink', weight: 700 });
          C.text(`${form.value === 'semi' ? 'semi-strong' : form.value} form`, 0, -1.3, { align: 'center', color: cols[sel], weight: 700, size: 12 });
          if (weak) {
            const k = `${samp.value}|${cost.value}`;
            if (key !== k) {
              const start = samp.value === 'b' ? D.yearStart[27] : 1, end = samp.value === 'a' ? D.yearStart[27] : D.n;
              const R = signRule(D.r, start, end, cost.value);
              cache = { ...R, paths: [R.hold, R.gross, R.net].map(a => wealthPath(a, start, calendar.years)) }; key = k;
            }
            const a = cache, ys = a.paths.flatMap(p => p.map(q => q[1])), lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), pad = Math.max(0.15, (hi - lo) * 0.1);
            W.setView([a.paths[0][0][0] - 0.5, a.paths[0].at(-1)[0] + 0.5], [lo - pad, hi + pad]);
            a.paths.forEach((p, i) => W.path(p, { color: ['muted', 'green', 'red'][i], width: i === 2 ? 2.4 : 2 }));
            v.legend([['muted', 'buy-and-hold, gross'], ['green', 'sign rule, gross'], ['red', 'sign rule, after signal-change charge']]);
            st = { ...a, grossMean: mean(a.gross), netMean: mean(a.net), holdMean: mean(a.hold), ac: acf(Float64Array.from(a.hold), 1) };
          } else {
            if (form.value === 'semi' && ent.value < 0) ent.set(0);
            const entry = ent.value, level = newsLevel(entry, leak.value, tau.value), at30 = newsLevel(30, leak.value, tau.value);
            E.vline(0, { color: 'faint', dash: true }); E.hline(1, { color: 'faint', dash: true });
            E.path(v.M.linspace(-30, 30, 241).map(t => [t, newsLevel(t, leak.value, tau.value)]), { color: 'accent', width: 2.6 });
            E.dot(entry, level, { r: 6, color: 'gold' });
            v.legend([['accent', 'assumed news level'], ['gold', 'entry level'], ['faint', 'eventual level = 1']]);
            st = { entry, level, at30, remaining: 1 - level, visibleChange: at30 - level };
          }
        });
        v.readout(() => form.value === 'weak'
          ? `${date(calendar.dates[st.start])} through ${date(calendar.dates[st.end - 1])}: ${st.gross.length.toLocaleString('en-US')} rule days, ${st.turnover.toLocaleString('en-US')} signal units charged including opening/closing; daily rebalancing trades are uncharged. Annualized arithmetic daily means (×252): gross rule ${sg(100 * st.grossMean * 252, 2)}%, rule after approximate charge ${sg(100 * st.netMean * 252, 2)}%, gross buy-and-hold ${sg(100 * st.holdMean * 252, 2)}%. These are descriptive, unadjusted sample means, not compound growth rates or significance tests.\nLag-1 autocorrelation of this sample's raw daily index returns: ${fx(st.ac, 3)}. Assumed executable closes and short positions omit financing, borrowing and stale-price effects; no efficiency verdict follows.`
          : `Entry at ${v.fix(st.entry, 1)} min; assumed level ${v.fix(st.level, 4)}. Remaining asymptotic news-level change: ${pct(st.remaining, 2)} of the full effect. Change from entry to +30 min: ${pct(st.visibleChange, 2)} of the full effect. Eventual adjustment can extend beyond the plotted window.\n${form.value === 'semi' ? 'Entry is constrained to public-announcement time or later.' : 'Earlier entry assumes knowledge of the eventual news; it is an assigned private-information scenario.'} These normalized level differences are not returns or evidence about real market efficiency.`);
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Model',
      name: 'Random-walk model of prices (Bachelier)',
      statement: String.raw`In the **random-walk model** the price changes $\Delta P_t=P_t-P_{t-1}$ are independent, identically distributed with mean $\mu$ and variance $\sigma^2$; in **Bachelier's version** they are normal and the price is Brownian motion with drift,
$$P_t=P_0+\mu t+\sigma W_t .$$
Consequences: (i) price changes are uncorrelated, $\operatorname{corr}(\Delta P_t,\Delta P_{t+k})=0$ for $k\ge 1$, so past prices cannot predict future ones (weak-form efficiency, fin-5.1); (ii) the spread of the price after $t$ periods grows like the **square root of time**: $\operatorname{sd}(P_t-P_0)=\sigma\sqrt t$; (iii) $P_t\sim N(P_0+\mu t,\ \sigma^2 t)$.

Scope: a model, not a law. Normal increments allow negative prices; modern versions use log prices (geometric Brownian motion, fin-8.7). Real returns have fat tails and clustered volatility (fin-5.8) and are not exactly independent.`,
      idea: String.raw`Bachelier's argument: the price at $t+s$ is the sum of the price at $t$ and many small independent changes made by buyers and sellers who each have no edge over the market, so by the central limit theorem the total change is normal with variance proportional to the time elapsed. Variances of independent increments add, so the standard deviation grows like $\sqrt t$, and the density $p(x,t)$ obeys the heat equation. Samuelson later derived such unpredictability from competition among informed traders (fin-5.1): if the price were predictable, buying or selling on the prediction would remove it.`,
      caption: String.raw`Four price paths, each a window of the chosen **window length**, are shown unlabelled; two are real windows of the daily U.S. market (random, from 1963–2026) and two are random walks with the same mean and volatility. Try to tell them apart, then press **reveal**. The readout gives their lag-1 autocorrelations; with a window this short they cannot separate the two kinds (windows from the 1960s–80s can show a visible positive value, see fin-5.1). **Right**: the standard deviation of the $k$-day return, measured on all 15 897 real days (blue), against the square-root law $\sigma\sqrt k$ (green).`,
      deps: ['fin-5.1', 'stoch-13.2'],
      refs: ['BKM ch. 11', 'Luenberger: Models of Asset Dynamics'],
      tags: ['random walk', 'Brownian motion', 'weak form'],
      credit: 'Bachelier, 1900; Samuelson, 1965; Fama, 1965',
      scope: String.raw`Holds as an approximation for liquid markets over horizons where predictability is below trading costs; fails in the tails (fin-5.8) and over very long horizons, where mean reversion or momentum appear.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Random_walk_hypothesis' },
      viz(v) {
        const D = daily(), r = D.r, n = D.n;
        const mon = v.slider('window length (months)', 3, 24, 12, { int: true });
        const reveal = v.toggle('reveal', false);
        let seed = 7; v.button('New windows', () => { seed++; });
        const S = [0, 1, 2, 3].map((k) => v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 210, weight: 1, minWidth: 190, xlabel: 'trading day', ylabel: 'price', title: 'ABCD'[k] }));
        const K = v.stage({ x: [1, 300], y: [0.5, 20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 240, weight: 1.6, minWidth: 300, xlabel: 'horizon k (days)', ylabel: 'sd of the k-day return (%)', title: 'the square-root law' });
        // the sd of overlapping k-day sums on the full sample (log returns)
        const lr = Float64Array.from(r, (x) => Math.log(1 + x));
        const ks = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 125, 200, 250];
        const sdk = ks.map((k) => { let s = 0, s2 = 0, c = 0, acc = 0; for (let i = 0; i < k; i++) acc += lr[i]; for (let i = k; i <= n; i++) { s += acc; s2 += acc * acc; c++; if (i < n) acc += lr[i] - lr[i - k]; } const m = s / c; return Math.sqrt(s2 / c - m * m); });
        const sd1 = sdk[0];
        let info = [];
        v.render(() => {
          const L = mon.value * 21, R = rng(seed * 101 + 5), order = [0, 1, 2, 3].sort(() => R() - 0.5);
          info = [];
          for (let k = 0; k < 4; k++) {
            const isReal = order[k] < 2; let path, ac, mu, sg;
            if (isReal) { const i0 = 2 + Math.floor(R() * (n - L - 4)), seg = r.subarray(i0, i0 + L); path = pricePath(r, i0, i0 + L); ac = acf(seg, 1); }
            else { const i0 = 2 + Math.floor(R() * (n - L - 4)), seg = r.subarray(i0, i0 + L); let m = 0; for (const x of seg) m += x; m /= L; let q = 0; for (const x of seg) q += (x - m) ** 2; sg = Math.sqrt(q / (L - 1)); mu = m; const z = new Float64Array(L); path = [100]; for (let t = 0; t < L; t++) { z[t] = mu * 100 + sg * 100 * R.normal(); path.push(path[t] + z[t]); } ac = acf(z, 1); }
            const lo = Math.min(...path), hi = Math.max(...path), pad = (hi - lo) * 0.1 + 1;
            const s = S[k]; s.setView([0, L], [lo - pad, hi + pad]);
            s.hline(100, { color: 'faint', dash: true });
            const col = reveal.value ? (isReal ? 'accent' : 'orange') : 'ink';
            s.path(path.map((y, t) => [t, y]), { color: col, width: 2 });
            s.setTitle(reveal.value ? `${'ABCD'[k]}: ${isReal ? 'real' : 'simulated'}` : 'ABCD'[k]);
            info.push({ isReal, ac });
          }
          K.line(1, sd1 * 100, 300, sd1 * 100 * Math.sqrt(300), { color: 'green', width: 2.4 });
          K.dots(ks.map((k, i) => [k, sdk[i] * 100]), { r: 4.5, color: 'accent' });
          K.text('σ√k', 120, sd1 * 100 * Math.sqrt(120), { dx: 8, dy: 14, size: 12, color: 'green', weight: 700 });
          K.text('real data', 200, sdk[11] * 100, { dx: -6, dy: -12, align: 'right', size: 12, color: 'accent', weight: 700 });
        });
        v.readout(() => `Lag-1 autocorrelation of daily returns in each window: ${info.map((x, k) => `${'ABCD'[k]} ${fx(x.ac, 2)}${reveal.value ? (x.isReal ? ' (real)' : ' (sim.)') : ''}`).join(' · ')}. With $n\\approx${mon.value * 21}$ days the 95% band for zero is $\\pm${v.fix(1.96 / Math.sqrt(mon.value * 21), 2)}$: a simulated window leaves it 1 time in 20, a real one more often if it comes from the 1960s–80s.\nDaily sd (log returns) ${v.fix(sd1 * 100, 2)}%; at $k=250$ the square-root law predicts ${v.fix(sd1 * 100 * Math.sqrt(250), 1)}% and the data show ${v.fix(sdk[12] * 100, 1)}%.`);
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Paradox',
      name: 'The Grossman–Stiglitz paradox',
      statement: String.raw`If prices **fully** reflected all available information, no one could earn a return on gathering it; but then no one would pay to gather it, and prices could not reflect it. In the Grossman–Stiglitz model a fraction $\lambda$ of investors pay a cost $c$ to observe a signal about a risky payoff $\theta$; the rest infer what they can from the price, which is also moved by random "noise" trades of size $\sigma_x$. In equilibrium the gain from being informed equals the cost, $V(\lambda^*)=c$, and the price is **only partly informative**: an equilibrium with costly information is never perfectly efficient, and perfect efficiency (the price revealing the signal) is reached only if information is free or the noise vanishes in a way that makes $\lambda^*\to 0$.

In the standard CARA–normal version (risk aversion $a=1$, prior and signal precision $\tau_\theta=\tau_\varepsilon=1$) the price carries precision $\tau_P=\lambda^2/\sigma_x^2$, an informed investor's certainty-equivalent gain is $V(\lambda)=\tfrac12\ln\frac{\tau_\theta+\tau_\varepsilon+\tau_P}{\tau_\theta+\tau_P}$, and at an interior equilibrium
$$\text{price informativeness}\;=\;\frac{\tau_P}{\tau_\theta+\tau_P}=2-e^{2c}.$$

Scope: one asset, exponential utility, normal payoffs and noise; a stylised model of why markets can be efficient only "enough".`,
      idea: String.raw`Information has value only if the price does not already contain it. The more traders are informed (larger $\lambda$), the more their demand moves the price in the direction of the signal, so the price becomes more informative, $\tau_P$ rises and the informed trader's edge $V(\lambda)$ falls. Equilibrium is where this falling curve crosses the cost line: efficiency is traded off exactly against the reward to producing information. Noise trading is what makes the price an imperfect signal; without noise a single informed trader would make the price fully revealing and the gain would vanish at once, the paradox in its sharp form.`,
      caption: String.raw`**Left**: the value $V(\lambda)$ of being informed falls as more investors are informed; where it meets the **cost** line is the equilibrium share $\lambda^*$. **Right**: how much of the signal the price reveals as $\lambda$ grows. Raise the cost and informativeness falls: prices must stay "inefficient enough" to pay the informed. Shrink the **noise trading**: fewer investors need to be informed to reach the same informativeness, but at an interior equilibrium the informativeness does not depend on the noise at all. (Model output, not data.)`,
      deps: ['fin-5.1'],
      refs: ['BKM ch. 11'],
      tags: ['market efficiency', 'information', 'equilibrium'],
      credit: 'Grossman & Stiglitz, 1980',
      scope: String.raw`Holds in the noisy rational-expectations model described (CARA utility, normal payoffs, one risky asset). The closed form for informativeness uses $\tau_\theta=\tau_\varepsilon=1$, $a=1$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Grossman%E2%80%93Stiglitz_paradox' },
      viz(v) {
        const c = v.slider('cost of information $c$', 0, 0.42, 0.2, { step: 0.005 });
        const sx = v.slider('noise trading $\\sigma_x$', 0.05, 3, 0.5, { log: true, sig: 2 });
        const A = v.stage({ x: [0, 1], y: [0, 0.4], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 270, xlabel: 'share of investors who are informed, λ', ylabel: 'value of being informed V(λ)', title: 'the gain from information' });
        const B = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 270, xlabel: 'share of investors who are informed, λ', ylabel: 'price informativeness', title: 'how much of the signal the price reveals' });
        const tauP = (l) => (l * l) / (sx.value * sx.value), V = (l) => 0.5 * Math.log((2 + tauP(l)) / (1 + tauP(l))), I = (l) => tauP(l) / (1 + tauP(l));
        let lam = 0;
        v.render(() => {
          const V0 = V(0);
          if (c.value >= V0) lam = 0; else { let lo = 0, hi = 1; if (V(1) >= c.value) lam = 1; else { for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (V(m) > c.value) lo = m; else hi = m; } lam = (lo + hi) / 2; } }
          A.fn(V, { domain: [0, 1], color: 'accent', width: 2.6, n: 300 });
          A.hline(c.value, { color: 'red', width: 2 }); A.text('cost c', 0, c.value, { dx: 6, dy: -9, align: 'left', size: 12, color: 'red', weight: 700 });
          A.dot(lam, c.value, { r: 7, color: 'green' }); A.vline(lam, { color: 'green', dash: true });
          A.text(`λ* = ${pct(lam, 1)}`, lam, c.value, { dx: lam > 0.6 ? -10 : 10, dy: -14, align: lam > 0.6 ? 'right' : 'left', size: 12, color: 'green', weight: 700 });
          B.fn(I, { domain: [0, 1], color: 'accent', width: 2.6, n: 300 });
          B.hline(1, { color: 'faint', dash: true }); B.text('fully efficient', 0.02, 1, { dx: 4, dy: -9, size: 11, color: 'muted' });
          B.dot(lam, I(lam), { r: 7, color: 'green' }); B.vline(lam, { color: 'green', dash: true });
          if (lam === 0 && c.value >= V0) A.corner('nobody informs: V(0) < c', 'tr', { color: 'red', weight: 700 });
        });
        v.readout(() => {
          const interior = lam > 0 && lam < 1, closed = 2 - Math.exp(2 * c.value);
          return `Equilibrium: **${pct(lam, 1)}** of investors pay for information; price informativeness **${pct(I(lam), 1)}**${interior ? `, closed form $2-e^{2c}=${v.fix(100 * closed, 1)}\\%$ ✓` : ''}; $\\tau_P=${v.fix(tauP(lam), 2)}$.\nThe price never reaches 100% unless $c=0$: at $c=${v.fix(c.value, 3)}$ there is a ${pct(1 - I(lam), 1)} gap that pays the informed.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4', kind: 'Phenomenon', name: 'Event studies and price adjustment',
      statement: String.raw`An **event study** measures returns around a dated announcement against a specified benchmark. With excess stock and market returns on the same basis, write
$$\begin{gathered}AR_{i,t}=(r_{i,t}-r_{f,t})-b_{i,t},\\ b_{i,t}=\alpha_i+\beta_i(r_{M,t}-r_{f,t}).\end{gathered}$$
The cross-sectional average is $AAR_t=N^{-1}\sum_i AR_{i,t}$; here **CAR** is the arithmetic sum of AAR from a declared baseline, not a compounded investment return. A response before an announcement can reflect earlier information; a later drift can reflect delayed adjustment, later news or a misspecified benchmark. A sample CAR is not itself a trading profit or an efficiency verdict.

Ball and Brown (1968) examined monthly returns for 261 firms and fiscal years 1957–1965. Much of the association with annual income appeared before its announcement. Their pp.173–174 also discuss possible later persistence and transaction costs. Their original **Abnormal Performance Index** compounds residuals; the daily arithmetic-CAR illustration below is an authored extension, not their figure or data.`,
      idea: String.raw`The regression benchmark (fin-4.3) removes a chosen common component; it does not establish that every residual is caused by the announcement. In the illustration, each group's daily mean error has standard deviation $1.5/\sqrt{300}$ percentage points. This is the exact distribution obtained by averaging 300 independent normal errors of daily standard deviation 1.5. The variance argument of prob-2.2.3 explains the $1/\sqrt N$ reduction. It requires uncorrelated errors; a common residual component need not vanish. Independent daily errors then give terminal CAR noise with standard deviation $1.5\sqrt{40/300}$ points over the 40 increments. Real event studies also face benchmark estimation, cross-event dependence, event-date uncertainty and selection into surprise groups.`,
      caption: String.raw`**Daily panel:** five assigned effect groups use jump, drift or early-information schedules. Solid curves are simulated group-average CARs; dashed curves are their exact expected schedules. All start at zero on day −20. The jump model has a flat expected path after day 0, while its noisy sample still moves. Resample the group errors, change the effect size or select another schedule. **Minute panel:** a separate authored level response $1-e^{-t/\tau}$ has adjustable time scale and entry delay. The full 90% time remains visible. The vertical gold segment shows the remaining asymptotic level change, not a holding-period return or executable profit.`,
      scope: String.raw`The five groups, 300-error averaging law, daily noise, response schedules and minute time constants are chosen teaching parameters. Group labels use assigned eventual effects and are not an available trading signal. Drift assigns 60% at day 0 and 40% over days 1–20; early information assigns 35% over days −10 to −1 and 65% at day 0. The daily and minute panels are separate models. No minute-speed estimate, universal absence of earnings drift, current-market speed comparison, causal identification or no-profit conclusion is inferred from them. Benchmark coefficients are treated as known.`,
      deps: ['fin-5.1','fin-4.3','prob-2.2.3','prob-1.2.5'],
      refs: ['Ball & Brown (1968), pp.161–168, Figure 1 p.169, pp.170–177', 'https://dallenwapty.com/coursematerial/investmentv/ballandbrown1968.pdf'],
      tags: ['event study','news','semi-strong form'], credit: 'Ball & Brown, 1968; daily and minute examples derived here', verify: false,
      links: { doi:'https://doi.org/10.2307/2490232',source:'https://dallenwapty.com/coursematerial/investmentv/ballandbrown1968.pdf' },
      viz(v) {
        const mode=v.select('authored daily response',[{value:'jump',label:'jump at announcement'},{value:'drift',label:'60% jump, 40% drift'},{value:'early',label:'35% early information'}],'jump');
        const effect=v.slider('largest assigned effect (percentage points)',1,6,3,{step:.25});
        const tau=v.slider('authored adjustment time (minutes)',.5,40,5,{log:true,sig:2});
        const delay=v.slider('entry delay (minutes)',0,40,10,{step:.5});
        let seed=3;v.button('Resample group errors',()=>{seed++;});
        const A=v.stage({x:[-24,24],y:[-7,7],axes:'box',gutter:true,height:360,weight:1.3,minWidth:290,xlabel:'days from the assigned event',ylabel:'arithmetic CAR (percentage points)',title:'authored daily event study'});
        const B=v.stage({x:[-8,45],y:[-.14,1.18],axes:'box',gutter:true,height:360,minWidth:270,xlabel:'minutes from the assigned event',ylabel:'normalized response level',title:'separate authored minute response'});
        const colors=['red','orange','muted','teal','green'];
        v.legend([['accent','solid: simulated group mean'],['accent','dashed: expected daily schedule',{dash:true}],['gold','entry level / remaining level change'],['green','90% of the minute response']]);
        let info={};
        v.render(()=>{
          const R=v.rng(seed*977),study=eventStudy(mode.value,effect.value,()=>R.normal()),minute=eventIntraday(tau.value,delay.value),values=study.groups.flatMap(g=>[...g.points,...g.expected].map(p=>p[1])),lo=Math.min(0,...values),hi=Math.max(0,...values),pad=Math.max(.5,.15*(hi-lo));
          A.setView([-24,24],[lo-pad,hi+pad]);
          study.groups.forEach((g,i)=>{A.path(g.points,{color:colors[i],width:1.8});A.path(g.expected,{color:colors[i],width:2.4,dash:[5,4]});});
          A.vline(0,{color:'faint',dash:[3,4]});A.hline(0,{color:'faint'});
          B.setView([-5-.08*(minute.end+5),minute.end+.12*(minute.end+5)],[-.14,1.18]);
          B.line(0,1,minute.end,1,{color:'faint',dash:[3,4]});B.path(minute.points,{color:'accent',width:2.6});
          B.line(minute.delay,minute.entry,minute.delay,1,{color:'gold',width:2.2});B.dot(minute.delay,minute.entry,{r:7,color:'gold'});B.dot(minute.t90,.9,{r:5,color:'green'});
          info={study,minute,seed};
        });
        v.readout(()=>{const s=info.study,m=info.minute;return `Assigned extreme effects: ${sg(-s.effect,2)} and ${sg(s.effect,2)} percentage points. Realized day 20 CARs: ${sg(s.groups[0].points.at(-1)[1],5)} and ${sg(s.groups[4].points.at(-1)[1],5)}. Sampling noise means those realized endpoints need not equal the assigned effects. All 41 days per group, including the zero baseline, are retained.\nDaily group-mean error SD ${fx(s.meanSd,6)} points; terminal CAR error SD ${fx(s.terminalSd,6)} points under the imposed independent normal law. A flat expected schedule does not make each sampled path flat.\nMinute model: 90% at ${fx(m.t90,5)} minutes; response at entry ${fx(m.entry,7)}, remaining asymptotic change ${fx(m.remaining,7)} of the normalized effect, and change to the plotted endpoint ${fx(m.visible,7)}. These level changes are not returns or risk-adjusted profits.`;});
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5', kind: 'Phenomenon', name: 'Active funds versus the index',
      statement: String.raw`Sharpe's (1991) arithmetic concerns **all active dollars in the same specified market**: if passive holdings reproduce the market, the remaining active holdings have the same aggregate gross return. Higher active costs then lower aggregate net returns. This identity does not fix the equal-weight return of a mutual-fund subset, its winning fraction or its performance against a different benchmark.

The empirical panel transcribes the **All Large-Cap Funds versus S&P 500** row of SPIVA's year-end 2024 Report 1a: underperformance rates 65.24%, 84.96%, 76.26%, 84.34% and 89.50% at 1, 3, 5, 10 and 15 years. These are absolute-return comparisons, net of fees excluding loads, with the starting opportunity set used for survivorship correction. They are not alpha estimates. In their 1984–2006 benchmark/bootstrap study, Fama and French (2010) find few funds with enough performance to cover costs; their gross-of-expense-ratio tails show both superior and inferior performance. The Gaussian models below do not reproduce that bootstrap.`,
      idea: String.raw`For a chosen fund subset, suppose a fixed annual gross alpha is $\mu_g+sZ_i$, an additive annual fee is $f$, and independent errors across two disjoint $H$-year periods are $\sigma Z_{i,j}/\sqrt H$. All $Z$ variables are independent standard normals (prob-1.2.5). Then
$$\begin{gathered}a_i=\mu_g-f+sZ_i,\\ \widehat\alpha_{i,j}=a_i+\frac{\sigma}{\sqrt H}Z_{i,j}.\end{gathered}$$
Variance addition (prob-2.2.1) gives $V_H=s^2+\sigma^2/H$, so $\Pr(\widehat\alpha<0)=\Phi((f-\mu_g)/\sqrt{V_H})$ and the population correlation between periods is $s^2/V_H$. As $H$ grows, the negative-alpha fraction rises if $\mu_g-f<0$, falls if it is positive, and stays at one half if it is zero. Persistent dispersion can make ranks informative in this model; it is not a standalone empirical identification of managerial skill.`,
      caption: String.raw`**Empirical panel:** five fixed SPIVA observations, all ending December 2024; their horizons have different starting cohorts and the percentages need not be monotone. **Model panel:** the probability of a negative estimated alpha, under the displayed independent Gaussian assumptions. It is separate from raw index underperformance. **Scatter:** all 500 generated pairs of annual alpha estimates from disjoint periods, with their sample least-squares line. Change fees, mean alpha, persistent dispersion, tracking error or horizon; resample to see finite-population variation. Both the population and sample correlations are read out.`,
      scope: String.raw`Model alphas are benchmark-relative annual percentage points, as in fin-4.4; they are arithmetic estimates, not compound fund wealth. A fee is an additive alpha decrement here. The chosen subset need not exhaust the market, so its mean parameter is unconstrained by the all-active-dollar identity. Normal errors allow unbounded alpha estimates; every generated point is retained without coordinate clipping. Independent errors, constant latent alphas and constant noise are imposed assumptions. SPIVA observations are historical descriptive comparisons and do not calibrate the model or forecast later performance. Fama–French gross returns add expense ratios back but still include trading costs.`,
      deps: ['fin-5.1','fin-4.4','prob-1.2.5','prob-2.2.1'],
      refs: ['Sharpe (1991), The Arithmetic of Active Management, complete author reprint', 'Fama & French (2010), introduction, §I, §III setup, §VI and Appendix A', 'SPIVA U.S. Year-End 2024, Report 1a p.10, methodology p.8, glossary pp.40–41'],
      tags: ['mutual funds','alpha','luck versus skill'],credit: 'Sharpe, 1991; Fama & French, 2010; S&P Dow Jones Indices, 2024 scorecard',verify: false,
      links: { source:'https://www.spglobal.com/spdji/en/documents/spiva/spiva-us-year-end-2024.pdf',arithmetic:'https://web.stanford.edu/~wfsharpe/art/active/active.htm',fundStudy:'https://r.jordan.im/download/investing/fama2010.pdf' },
      viz(v) {
        const fee=v.slider('fee (annual alpha points)',0,2,1,{step:.05}),gross=v.slider('mean gross alpha (annual points)',-1,1,0,{step:.05}),skill=v.slider('persistent alpha SD (annual points)',0,3,.5,{step:.05}),te=v.slider('annual tracking-error SD (points)',1,8,3,{step:.25}),H=v.slider('years in each scatter period',1,15,5,{int:true});
        let seed=11;v.button('Resample modeled funds',()=>{seed++;});
        const A=v.stage({x:[-.5,16.5],y:[-8,108],axes:'box',gutter:true,height:350,minWidth:260,xlabel:'historical horizon (years)',ylabel:'funds underperforming S&P 500 (%)',xticks:[1, 3, 5, 10,15],title:'SPIVA 2024: reported absolute returns'});
        const B=v.stage({x:[-.5,16.5],y:[-8,108],axes:'box',gutter:true,height:350,minWidth:260,xlabel:'model horizon H (years)',ylabel:'negative estimated alpha (%)',xticks:[1, 3, 5, 10,15],title:'authored Gaussian alpha probability'});
        const C=v.stage({x:[-8,8],y:[-8,8],equal:true,axes:'box',gutter:true,height:350,minWidth:270,xlabel:'period 1 alpha (%/year)',ylabel:'period 2 alpha (%/year)',title:'all 500 modeled funds: disjoint periods'});
        v.legend([['red','reported SPIVA percentages',{dot:true}],['accent','model probability / generated funds'],['gold','selected model horizon'],['orange','sample regression']]);
        let info={};
        v.render(()=>{
          const parameters={fee:fee.value,gross:gross.value,skill:skill.value,te:te.value,H:H.value},R=v.rng(seed*313),scatter=fundScatter(parameters,()=>R.normal()),curve=Array.from({length:59},(_,i)=>{const h=.5+i/4;return[h,100*fundLaw({...parameters,H:h}).negative];});
          SPIVA_2024_LARGE_CAP.forEach(([h,rate])=>A.dot(h,rate,{r:6,color:'red',hollow:true,width:2}));
          B.line(.5,50,15,50,{color:'faint',dash:[3,4]});B.path(curve,{color:'accent',width:2.6});B.dot(H.value,100*scatter.negative,{r:6,color:'gold'});
          const xs=scatter.points.map(p=>p[0]),ys=scatter.points.map(p=>p[1]),xmin=Math.min(0,...xs),xmax=Math.max(0,...xs),line=scatter.slope===null?[]:[[xmin,scatter.my+scatter.slope*(xmin-scatter.mx)],[xmax,scatter.my+scatter.slope*(xmax-scatter.mx)]],ymin=Math.min(0,...ys,...line.map(p=>p[1])),ymax=Math.max(0,...ys,...line.map(p=>p[1])),px=Math.max(.5,.12*(xmax-xmin)),py=Math.max(.5,.12*(ymax-ymin));
          C.setView([xmin-px,xmax+px],[ymin-py,ymax+py]);C.hline(0,{color:'faint'});C.vline(0,{color:'faint'});C.dots(scatter.points,{r:2.4,color:'accent',alpha:.55});if(line.length)C.path(line,{color:'orange',width:2.3});
          info={parameters,scatter,curve,line,seed};
        });
        v.readout(()=>{const p=info.parameters,s=info.scatter;return `SPIVA 2024 observations (1/3/5/10/15 years): 65.24/84.96/76.26/84.34/89.50% underperforming, with category/cohort definitions held to that report. They are not a monotone horizon law or alpha estimates.\nGaussian model: net mean alpha ${sg(s.mean,4)} points/year; negative-alpha probability ${pct(s.negative,6)} at H=${p.H}. Population correlation ${fx(s.correlation,6)}; sample correlation ${s.sampleCorrelation===null?'undefined for constant samples':fx(s.sampleCorrelation,6)}.\nAll ${s.count} generated pairs retained. Exactly ${s.top.length} first-period top-quartile funds are selected by rank; ${s.above} (${pct(s.repeat,2)}) exceed the second-period sample median. With zero persistent dispersion, independence gives a population repeat probability of 50%; this finite count fluctuates. The model does not establish an implementable investment strategy or identify real fund skill.`;});
      },
    },
  ],
};
