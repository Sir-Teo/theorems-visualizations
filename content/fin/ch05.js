// Finance — Chapter 5: Efficient markets, volatility and bubbles (items 5.1–5.5; 5.6–5.10 are in ch05-b.js, 5.11–5.15 in ch05-c.js)
//
// Sources and honesty notes (checked Oct 2026): Fama, J. Finance 25(2):383–417 (1970); Samuelson, Industrial Management Review 6(2):41–49 (1965);
// Grossman & Stiglitz, AER 70(3):393–408 (1980); Ball & Brown, J. Accounting Research 6(2):159–178 (1968); Fama, Fisher, Jensen & Roll, Int. Econ. Rev. 10(1):1–21 (1969);
// Patell & Wolfson, J. Financial Economics 13(2):223–252 (1984) (abstract: trading-rule profits on Broad Tape earnings and dividend releases dissipate within 5–10 minutes);
// Jensen, J. Finance 23(2):389–416 (1968); Carhart, J. Finance 52(1):57–82 (1997); Fama & French, J. Finance 65(5):1915–1947 (2010).
// Real data: the daily market series (Kenneth R. French's Data Library) in ch05.shared.js. Everything labelled "stylised" or "model" is a simulation, not data.
import { clamp, pct, fx, sg, daily, acf, normCdf, normPdf, pricePath, rng } from './ch05.shared.js';

const YR = (i) => 1963.5 + i * (63.17 / 15897);

export default {
  collection: 'fin',
  chapter: 5,
  title: 'Efficient markets, volatility and bubbles',
  summary: String.raw`If prices already reflect available information, price changes should be unpredictable and active managers should not beat the market after costs — the efficient-market hypothesis. Much evidence supports a weak version, but prices are more volatile than fundamentals warrant, arbitrage is limited, and returns have fat tails and clustered volatility. History and laboratory experiments both show bubbles forming even when fundamental values are known.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Hypothesis',
      name: 'The efficient-market hypothesis',
      statement: String.raw`A market is **efficient with respect to an information set** $\Phi_t$ if prices "fully reflect" $\Phi_t$: no strategy that uses only $\Phi_t$ earns an expected return above what its risk warrants, after costs. Under a specified equilibrium expected-return model $m_t$, the testable restriction is $\mathrm E[r_{t+1}\mid\Phi_t]=m_t$. The model-adjusted surprise
$$Z_{t+1}=r_{t+1}-m_t$$
then forms a **fair game**, $\mathrm E[Z_{t+1}\mid\Phi_t]=0$. Subtracting the true conditional mean alone always gives a zero conditional mean and is not an efficiency test. Three nested sets give three forms. **Weak:** $\Phi_t$ is the history of past prices and volumes (so technical analysis cannot pay). **Semi-strong:** all public information (filings, news, forecasts). **Strong:** all information, including what insiders know. Each form implies the one before it.

Scope: the weak-form pictures use a value-weighted index, whose daily returns are not exactly tradable (stale prices). The hypothesis is untestable on its own, because "warrants" needs a model of expected return (the *joint-hypothesis problem*): an apparent profit may mean inefficiency or a wrong model of risk.`,
      idea: String.raw`If a rule using $\Phi_t$ could earn an expected excess return, traders would pile into it, and their buying and selling would move today's price until the profit vanished; competition among informed traders therefore pushes the price to its information-consistent value (the present value of fin-1.5 computed with *all* $\Phi_t$). The restriction concerns model-adjusted surprises; raw returns and risk premia can vary predictably with $\Phi_t$. Testing means choosing $\Phi_t$, a risk model and a rule, and asking whether the rule's profit, net of trading costs, differs from zero; each form is tested by a different kind of evidence (return autocorrelation, event studies, insider and fund performance).`,
      caption: String.raw`**Left**: the three nested information sets; choose a form. **Weak** (real data): a rule that goes long or short the whole U.S. market according to the sign of yesterday's return, on 15 897 actual trading days 1963–2026. Look at the **sample**: in 1963–1989 the rule earns large paper profits (daily index returns were then positively autocorrelated, with nonsynchronous trading a possible source of index autocorrelation, rather than a causal explanation established by this plot), in 1990–2026 it loses money, before and after the **trading cost**. **Semi-strong / strong** (model): news about a firm arrives at time 0. Move **your entry time**: after the announcement you only have public information, before it you need inside information (strong form). Raise the **share already in the price** or shorten the **adjustment time** and the profit disappears. (News panel: stylised model, not data.)`,
      deps: ['fin-1.5', 'stat-2.1'],
      refs: ['BKM ch. 11'],
      tags: ['market efficiency', 'information', 'fair game'],
      credit: 'Fama, 1970 (building on Samuelson, 1965, and Fama, 1965)',
      scope: String.raw`A hypothesis about prices, not a law: it is stated relative to an information set, a cost structure and a model of risk, and each form can fail separately.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Efficient-market_hypothesis' },
      viz(v) {
        const D = daily(), r = D.r, n = D.n;
        const form = v.select('information set', [{ value: 'weak', label: 'weak' }, { value: 'semi', label: 'semi-strong' }, { value: 'strong', label: 'strong' }], 'weak');
        const samp = v.select('sample', [{ value: 'b', label: '1990–2026' }, { value: 'a', label: '1963–1989' }, { value: 'all', label: '1963–2026' }], 'b');
        const cost = v.slider('trading cost (bp per unit traded)', 0, 10, 2, { step: 0.25 });
        const leak = v.slider('share of the news already in the price', 0, 1, 0.2, { step: 0.01, fmt: (x) => pct(x, 0) });
        const tau = v.slider('adjustment time after the announcement (min)', 0.2, 60, 5, { log: true, sig: 2 });
        const ent = v.slider('your entry time (minutes from announcement)', -30, 30, 2, { step: 0.5 });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 0.9, minWidth: 250, title: 'nested information sets' });
        const W = v.stage({ x: [1963, 2027], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'year', ylabel: 'log₁₀ of $1 invested', title: 'weak form: a rule on yesterday’s sign (real daily data)' });
        const E = v.stage({ x: [-30, 30], y: [-0.1, 1.15], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'minutes from the announcement', ylabel: 'price, as a share of the full news effect', title: 'the price around an announcement (model)' });
        const isWeak = () => form.value === 'weak';
        let cache = null, ck = '';
        // gross and net daily returns of the rule “sign of yesterday’s return”
        const rule = () => {
          const key = samp.value + '|' + cost.value; if (ck === key) return cache;
          const i0 = samp.value === 'b' ? D.yearStart[27] : 2, i1 = samp.value === 'a' ? D.yearStart[27] : n;
          const g = [], nt = [], bh = []; let pos = Math.sign(r[i0 - 2]) || 1;
          for (let i = i0; i < i1; i++) { const s = Math.sign(r[i - 1]) || 1, u = Math.abs(s - pos); pos = s; const x = s * r[i]; g.push(x); nt.push(x - cost.value * 1e-4 * u); bh.push(r[i]); }
          ck = key; cache = { g, nt, bh, i0 }; return cache;
        };
        const path = (x, i0) => { const o = []; let w = 0; for (let k = 0; k < x.length; k++) { w += Math.log10(1 + x[k]); if (k % 8 === 0 || k === x.length - 1) o.push([YR(i0 + k), w]); } return o; };
        const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
        const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
        const car = (t) => { const L = leak.value; if (t < 0) return L * (t + 30) / 30; return L + (1 - L) * (1 - Math.exp(-t / tau.value)); };
        let prof = 0, eff = 0;
        v.render(() => {
          const weak = isWeak();
          samp.el.hidden = cost.el.hidden = !weak; leak.el.hidden = tau.el.hidden = ent.el.hidden = weak;
          W.el.style.display = weak ? '' : 'none'; E.el.style.display = weak ? 'none' : '';
          // circles
          const cols = ['red', 'orange', 'green'], names = ['strong', 'semi', 'weak'], rs = [1.15, 0.8, 0.42];
          const sel = form.value === 'strong' ? 0 : form.value === 'semi' ? 1 : 2;
          for (let k = 0; k < 3; k++) { const on = k >= sel; C.circle(0, 0, rs[k], { fill: on ? cols[k] : 'grid', fillAlpha: on ? 0.28 : 0.1, color: on ? cols[k] : 'faint', width: k === sel ? 3 : 1.5 }); }
          C.text('past prices', 0, 0.06, { size: 11.5, color: 'ink', weight: 700 }); C.text('and volumes', 0, -0.12, { size: 11.5, color: 'ink', weight: 700 });
          C.text('public information', 0, 0.62, { size: 11.5, color: 'ink', weight: 700 }); C.text('(filings, news, forecasts)', 0, 0.5, { size: 10, color: 'muted' });
          C.text('all information', 0, 1.05, { size: 11.5, color: 'ink', weight: 700 }); C.text('(including insiders’)', 0, 0.93, { size: 10, color: 'muted' });
          C.corner({ weak: 'weak form: prices already reflect past prices', semi: 'semi-strong: … and all public information', strong: 'strong: … and private information' }[form.value], 'bl', { color: cols[sel], weight: 700, size: 12 });
          if (weak) {
            const R = rule(), a = path(R.bh, R.i0), b = path(R.g, R.i0), c = path(R.nt, R.i0);
            const lo = Math.min(0, ...[a, b, c].map((p) => Math.min(...p.map((q) => q[1])))), hi = Math.max(...[a, b, c].map((p) => Math.max(...p.map((q) => q[1])))) + 0.1;
            W.setView([a[0][0] - 0.5, a[a.length - 1][0] + 0.5], [lo, hi]);
            W.path(a, { color: 'muted', width: 2 }); W.path(b, { color: 'green', width: 2 }); W.path(c, { color: 'red', width: 2.4 });
            W.text('buy and hold', a[a.length - 1][0], a[a.length - 1][1], { dx: -6, dy: -9, align: 'right', size: 11, color: 'muted', weight: 700 });
            W.text('rule, before costs', b[b.length - 1][0], b[b.length - 1][1], { dx: -6, dy: -9, align: 'right', size: 11, color: 'green', weight: 700 });
            W.text('rule, after costs', c[c.length - 1][0], c[c.length - 1][1], { dx: -6, dy: 12, align: 'right', size: 11, color: 'red', weight: 700 });
            eff = { g: mean(R.g) * 252, nt: mean(R.nt) * 252, tg: mean(R.g) / (sd(R.g) / Math.sqrt(R.g.length)), tn: mean(R.nt) / (sd(R.nt) / Math.sqrt(R.nt.length)), bh: mean(R.bh) * 252, ac: acf(Float64Array.from(R.bh), 1) };
          } else {
            const e0 = form.value === 'semi' ? Math.max(0, ent.value) : ent.value;
            if (form.value === 'semi' && ent.value < 0) ent.set(0);
            const pts = []; for (let t = -30; t <= 30; t += 0.25) pts.push([t, car(t)]);
            E.vline(0, { color: 'faint', dash: true }); E.hline(1, { color: 'faint', dash: true });
            E.text('announcement', 0, 1.1, { size: 11, color: 'muted', align: 'center' });
            E.vband(-30, 0, { color: 'red', alpha: 0.05 }); E.vband(0, 30, { color: 'green', alpha: 0.05 });
            E.text('inside information needed', -15, 0.97, { size: 11, color: 'red', align: 'center' }); E.text('public information', 15, 0.5, { size: 11, color: 'green', align: 'center' });
            E.path(pts, { color: 'accent', width: 2.6 });
            const pe = car(e0); prof = 1 - pe;
            E.rect(e0, pe, 30, 1, { fill: 'gold', fillAlpha: 0.3, stroke: false });
            E.dot(e0, pe, { r: 7, color: 'gold' }); E.text('you buy here', e0, pe, { dx: 8, dy: 16, align: e0 > 15 ? 'right' : 'left', size: 11.5, color: 'gold', weight: 700 });
          }
        });
        v.readout(() => (isWeak()
          ? `Daily rule “long after an up-day, short after a down-day” (market only, cash earns nothing): **${sg(100 * eff.g, 1)}%** a year before costs ($t=${v.fix(eff.tg, 1)}$), **${sg(100 * eff.nt, 1)}%** after ${v.fix(cost.value, 2)} bp per unit traded ($t=${v.fix(eff.tn, 1)}$); buy-and-hold ${sg(100 * eff.bh, 1)}% a year. Daily lag-1 autocorrelation in this sample: ${fx(eff.ac, 3)}. Raw paper returns of this rule do not by themselves establish risk-adjusted abnormal profit; nonsynchronous trading may also affect implementability.`
          : `Profit available to someone who buys at ${v.fix(clamp(ent.value, form.value === 'semi' ? 0 : -30, 30), 1)} min: **${pct(prof, 0)}** of the full news effect.\n${form.value === 'semi' ? 'Public information only: efficiency (semi-strong) means this is about 0 for any entry time you can actually achieve, i.e. a very short adjustment time.' : 'With inside information you can buy before the announcement: strong-form efficiency would require the price to have moved already (share in the price near 100%).'}`));
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
      deps: ['fin-5.1', 'stoch-13.2', 'prob-2.2.1', 'prob-3.4.1'],
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
      num: '5.4',
      kind: 'Phenomenon',
      name: 'Prices react to news within minutes',
      statement: String.raw`In **event studies**, the abnormal return of a stock around a public announcement is measured against what the market model predicts, $AR_t=r_t-(\alpha+\beta r_{M,t})$, and cumulated to $CAR$. For earnings announcements, stock splits and similar news the pattern is: the price moves in the direction of the surprise, **most of the adjustment happens at or just before the announcement**, and after it the cumulative abnormal return is nearly flat, with no further profit for someone who trades on the announcement once it is public. Intraday studies find that simple trading rules on earnings and dividend releases lose their profit within **five to ten minutes** of the release.

Scope: the average over many events; individual announcements can overshoot. Post-announcement drift after earnings surprises (a slow part of the adjustment, documented later) is a well-known qualification, shown here with the "slow market" button.`,
      idea: String.raw`Many professional traders watch the same releases and compete to trade on them; whoever is fastest earns the move and, by trading, pushes the price to its new value. The arithmetic of an event study makes this visible: averaging abnormal returns of many firms with similar surprises cancels the firm-specific noise ($\propto 1/\sqrt N$) and leaves the common signal, while the market model strips out market movements (fin-4.3). The semi-strong form of fin-5.1 is exactly the claim that the post-announcement part of the curve is flat.`,
      caption: String.raw`**Left**: the average cumulative abnormal return of 300 firms in each of five **earnings-surprise** groups, days $-20$ to $+20$. The efficient market jumps on day 0 and then stays; choose a **slow** market (part of the move arrives gradually in the next 20 days, a post-announcement drift) or a **leaky** one (part of it before the news). **Right**: zoom into the first minutes after the release; move the **adjustment time** and the **delay** with which you can trade, and read off the profit you can still capture. (Stylised simulation based on the cited pattern, not the original data.)`,
      deps: ['fin-5.1'],
      refs: ['BKM ch. 11'],
      tags: ['event study', 'news', 'semi-strong form'],
      credit: 'Ball & Brown, 1968; Fama, Fisher, Jensen & Roll, 1969; Patell & Wolfson, 1984',
      scope: String.raw`Average behaviour for liquid U.S. stocks; the five-to-ten minute figure refers to the 1980s intraday data of Patell and Wolfson, and today's adjustment is faster.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Event_study' },
      viz(v) {
        const mkt = v.select('market', [{ value: 'eff', label: 'efficient' }, { value: 'slow', label: 'slow (drift)' }, { value: 'leak', label: 'leaky' }], 'eff');
        const size = v.slider('typical surprise effect (%)', 1, 6, 3, { step: 0.25 });
        const tau = v.slider('adjustment time (min)', 0.5, 40, 5, { log: true, sig: 2 });
        const delay = v.slider('your trading delay (min)', 0, 40, 10, { step: 0.5 });
        let seed = 3; v.button('Resample firms', () => { seed++; });
        const A = v.stage({ x: [-20, 20], y: [-5, 5], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'trading days from the announcement', ylabel: 'cumulative abnormal return (%)', title: 'earnings surprise groups (stylised)' });
        const B = v.stage({ x: [-5, 40], y: [-0.05, 1.1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'minutes after the release', ylabel: 'share of the move', title: 'the first minutes' });
        const GROUPS = [-1, -0.4, 0, 0.4, 1], COL = ['red', 'orange', 'muted', 'teal', 'green'], N = 300;
        const share = (d) => (d < 0 ? 0 : mkt.value === 'slow' ? 0.6 + 0.4 * Math.min(1, d / 20) : 1); // by day offset d (>= 0 -> jump day)
        let prof = 0;
        v.render(() => {
          const R = rng(seed * 977);
          for (let g = 0; g < 5; g++) {
            const J = GROUPS[g] * size.value; let car = 0; const pts = [];
            for (let d = -20; d <= 20; d++) {
              let mu = 0;
              if (d === 0) mu = J * (mkt.value === 'slow' ? 0.6 : mkt.value === 'leak' ? 0.65 : 1);
              if (mkt.value === 'slow' && d > 0) mu = J * 0.4 / 20;
              if (mkt.value === 'leak' && d >= -10 && d < 0) mu = J * 0.35 / 10;
              let e = 0; for (let k = 0; k < N; k++) e += 1.5 * R.normal(); e /= N;
              car += mu + e; pts.push([d, car]);
            }
            // shift so that CAR at −20 starts at about zero (already: starts with day −20)
            A.path(pts, { color: COL[g], width: 2.2 });
            A.text(['most negative', '', '', '', 'most positive'][g], 20, pts[40][1], { dx: -4, dy: g === 0 ? 12 : -10, align: 'right', size: 10.5, color: COL[g], weight: 700 });
          }
          A.vline(0, { color: 'faint', dash: true }); A.hline(0, { color: 'faint' });
          const f = (t) => (t < 0 ? 0 : 1 - Math.exp(-t / tau.value));
          const ts = []; for (let t = -5; t <= 40; t += 0.25) ts.push([t, f(t)]);
          B.path(ts, { color: 'accent', width: 2.6 }); B.vline(0, { color: 'faint', dash: true }); B.hline(1, { color: 'faint', dash: true });
          const pe = f(delay.value); prof = 1 - pe;
          B.rect(delay.value, pe, 40, 1, { fill: 'gold', fillAlpha: 0.3, stroke: false });
          B.dot(delay.value, pe, { r: 7, color: 'gold' }); B.text('you trade here', delay.value, pe, { dx: 8, dy: 16, size: 11.5, color: 'gold', weight: 700, align: delay.value > 25 ? 'right' : 'left' });
          B.dot(Math.log(10) * tau.value, 0.9, { r: 4, color: 'green' }); B.text('90% done', Math.log(10) * tau.value, 0.9, { dx: 10, dy: -12, size: 11, color: 'green', align: 'left' });
          B.tex('1-e^{-t/\\tau}', 28, f(28) - 0.12, { size: 13, color: 'accent' });
        });
        v.readout(() => `Right panel: with an adjustment time of ${v.fix(tau.value, 1)} min, 90% of the move is done after ${v.fix(Math.log(10) * tau.value, 1)} min; a trader who gets in after ${v.fix(delay.value, 1)} min captures only **${pct(prof, 0)}** of it${prof < 0.05 ? ' (practically nothing: this is what the semi-strong form says)' : ''}.\nLeft: the most negative and most positive groups have total effects of ${sg(-size.value, 1)}% and ${sg(size.value, 1)}% by construction; in the efficient market the paths are flat after day 0, in the slow market they keep drifting for 20 days, in the leaky one part of the move comes before.`);
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Phenomenon',
      name: 'Active funds versus the index',
      statement: String.raw`For the **dollar-weighted total of all active investors in the same market**, gross performance equals the market return, so higher costs reduce that aggregate’s net return relative to passive investment (Sharpe’s arithmetic). This identity need not hold for a selected mutual-fund sample or its equal-weighted average. In the model below, the share beating the index falls with the horizon when mean net alpha is negative, rises when it is positive, and stays at one half when it is zero. Writing a fund's true annual alpha as $\alpha_i\sim N(\mu_g-f,\ s_\alpha^2)$ (gross mean $\mu_g$, fee $f$, skill dispersion $s_\alpha$) and its measured alpha over $H$ years as $\hat\alpha_i=\alpha_i+e_i$ with $e_i\sim N(0,\sigma_{te}^2/H)$ (tracking error $\sigma_{te}$), the share of funds that **beat** the index over $H$ years is
$$\Phi\!\left(\frac{\mu_g-f}{\sqrt{s_\alpha^2+\sigma_{te}^2/H}}\right).$$
With no skill ($s_\alpha=0$) a fund's rank in one period is unrelated to its rank in the next. Large empirical studies find little persistence and little evidence of skill after costs among U.S. equity funds, apart from a persistent tail of poor performers.

Scope: a statistical model of the claim, not the data. Reference points: S&P's SPIVA scorecard reports 65.24% of all large-cap U.S. funds underperforming the S&P 500 in calendar 2024 and 89.50% over the 15 years ending in 2024 (Report 1a).`,
      idea: String.raw`Gross of costs, active management is a zero-sum game: the dollar-weighted return of all active investors equals the market's (Sharpe's arithmetic of active management), so higher costs lower that aggregate’s net return. Active mutual funds are only a subset of these investors and can trade against other active investors. Over a short horizon, luck dominates ($\sigma_{te}/\sqrt H$ is large), so a no-skill fund beats the index about half the time before fees; over long horizons measurement noise averages out and the distribution of true net alpha decides. Persistence tests ask whether past winners win again; if differences between funds are mostly luck (large $\sigma_{te}$ relative to $s_\alpha$), the answer is no. Fama and French (2010) find that the cross-section of fund returns is consistent with little or no skill net of costs beyond what luck produces; Carhart (1997) found that apparent persistence was mostly explained by momentum and expenses.`,
      caption: String.raw`**Left**: the model's share of funds that *underperform* against the horizon, with the 1-year and 15-year All Large-Cap reference points from the original SPIVA U.S. Year-End 2024 scorecard, Report 1a. Raise **gross mean alpha** above the **fee** and the curve slopes the other way. **Right**: 500 simulated funds, alpha in one five-year period against the next; the correlation shows how little luck predicts. Raise **skill dispersion** until winners repeat. (Simulation of a statistical model.)`,
      deps: ['fin-5.1', 'fin-4.4', 'prob-3.3.13'],
      refs: ['BKM ch. 11'],
      tags: ['mutual funds', 'alpha', 'luck versus skill'],
      credit: 'Sharpe, 1991; Jensen, 1968; Carhart, 1997; Fama & French, 2010',
      scope: String.raw`The model is a stylised description of U.S. large-cap equity funds against a broad benchmark; reference points are reported percentages that include survivorship adjustments and category definitions by S&P.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Active_management' },
      viz(v) {
        const fee = v.slider('fee $f$ (% a year)', 0, 2, 1, { step: 0.05 });
        const gross = v.slider('gross mean alpha $\\mu_g$ (% a year)', -1, 1, 0, { step: 0.05 });
        const skill = v.slider('skill dispersion $s_\\alpha$ (% a year)', 0, 3, 0.5, { step: 0.05 });
        const te = v.slider('tracking error $\\sigma_{te}$ (% a year)', 1, 8, 3, { step: 0.25 });
        const Hs = v.slider('horizon in the scatter $H$ (years)', 1, 15, 5, { int: true });
        let seed = 11; v.button('Resample funds', () => { seed++; });
        const A = v.stage({ x: [0, 16], y: [0, 100], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 280, xlabel: 'horizon H (years)', ylabel: 'funds underperforming the index (%)', xticks: [1, 3, 5, 10, 15], title: 'share of funds that lag the index' });
        const B = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'alpha, period 1 (% a year)', ylabel: 'alpha, period 2 (% a year)', title: '500 funds, two consecutive periods' });
        let cor = 0, top = 0;
        const under = (H) => 100 * (1 - normCdf((gross.value - fee.value) / Math.sqrt(skill.value ** 2 + te.value ** 2 / H)));
        v.render(() => {
          const pts = []; for (let H = 0.5; H <= 16; H += 0.25) pts.push([H, under(H)]);
          A.hline(50, { color: 'faint', dash: true });
          A.path(pts, { color: 'accent', width: 2.6 });
          A.dots([[1, 65.24], [15, 89.5]], { r: 6, color: 'red', hollow: true });
          A.text('SPIVA 2024: 65.24%', 1, 65.24, { dx: 10, dy: -12, size: 11, color: 'red', align: 'left', weight: 700 });
          A.text('SPIVA 15 yr: 89.50%', 15, 89.5, { dx: -10, dy: 14, size: 11, color: 'red', align: 'right', weight: 700 });
          A.dot(Hs.value, under(Hs.value), { r: 5.5, color: 'gold' });
          // scatter
          const R = rng(seed * 313), N = 500, H = Hs.value, x = [], y = [];
          for (let i = 0; i < N; i++) { const a = gross.value - fee.value + skill.value * R.normal(); x.push(a + te.value / Math.sqrt(H) * R.normal()); y.push(a + te.value / Math.sqrt(H) * R.normal()); }
          const mx = x.reduce((s, q) => s + q) / N, my = y.reduce((s, q) => s + q) / N; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < N; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
          cor = sxy / Math.sqrt(sxx * syy);
          const ys = [...y].sort((a, b) => a - b), med = ys[N >> 1], xs = [...x].sort((a, b) => a - b), q3 = xs[Math.floor(0.75 * N)];
          let nt = 0, up = 0; for (let i = 0; i < N; i++) if (x[i] >= q3) { nt++; if (y[i] > med) up++; } top = up / nt;
          const span = Math.max(8, ...x.map(Math.abs), ...y.map(Math.abs)) * 1.05; B.setView([-span, span], [-span, span]);
          B.hline(0, { color: 'faint' }); B.vline(0, { color: 'faint' });
          B.dots(x.map((a, i) => [a, y[i]]), { r: 2.4, color: 'accent', alpha: 0.5 });
          const sl = sxy / sxx; B.line(-span, my + sl * (-span - mx), span, my + sl * (span - mx), { color: 'orange', width: 2.2 });
        });
        v.readout(() => `Model: **${v.fix(under(1), 0)}%** of funds lag the index over 1 year, **${v.fix(under(5), 0)}%** over 5, **${v.fix(under(15), 0)}%** over 15; no-skill, no-fee funds would sit at 50%.\nScatter (H = ${Hs.value} yr): correlation of period-1 and period-2 alpha **${fx(cor, 2)}**; of the funds in the top quarter in period 1, **${pct(top, 0)}** beat the median in period 2 (50% = pure luck).`);
      },
    },
  ],
};
