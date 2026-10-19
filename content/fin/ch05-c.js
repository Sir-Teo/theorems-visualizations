// Finance — Chapter 5 (part 3): items 5.11–5.15 (rational bubbles, laboratory bubbles and the three papers).
//
// Sources and honesty notes (checked Oct 2026): Blanchard, Economics Letters 3(4):387–389 (1979); Blanchard & Watson (1982, NBER w0945); Tirole, Econometrica 53(6):1499–1528 (1985);
// Smith, Suchanek & Williams, Econometrica 56(5):1119–1151 (1988) (15- or 30-period sessions, dividends drawn from a known distribution; 14 of 22 sessions had bubbles; experienced traders
// had fewer, but not zero); Dufwenberg, Lindqvist & Moore, AER 95(5):1731–1737 (2005); Lei, Noussair & Plott, Econometrica 69(4):831–859 (2001);
// Bachelier, Ann. sci. ENS 3e série 17:21–86 (1900), doi 10.24033/asens.476 (defended 29 March 1900 before Poincaré); Fama, J. Finance 25(2):383–417 (1970) (doi 10.2307/2325486);
// Shiller, AER 71(3):421–436 (1981); LeRoy & Porter, Econometrica 49(3):555–574 (1981).
// 5.11 independently reads Blanchard–Watson's authored 1982 chapter, pp.295–300; original-page formulas inspected.
// Its explicit summability/finite-annuity illustration and checks are documented in the dedicated bubble follow-up.
// Real data: Shiller's annual series (ch05.shared.js), the daily and monthly market and industry returns (French library). Models and reconstructions are labelled as such.
import { clamp, pct, fx, sg, data, daily, shiller, shillerDetrended, exPost, meanOf, sdOf, acf, normPdf, normCdf, pricePath, rng, mean, sdev, IND_NAMES } from './ch05.shared.js';
import { bubbleScenario, sampledBubbleReturn } from './source-audit-bubbles.js';

export default {
  collection: 'fin',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11', kind: 'Theorem', name: 'Rational bubbles and the transversality condition',
      statement: String.raw`Let $q=1+r>1$, let information $\mathcal F_t$ increase with time, and let the adapted, integrable ex-dividend price satisfy
$$p_t=q^{-1}E_t[p_{t+1}+d_{t+1}].$$
Assume nonnegative integrable dividends and $E[\sum_{j\ge1}q^{-j}d_j]<\infty$. Then the finite fundamental value is
$$f_t=\sum_{k\ge1}q^{-k}E_t[d_{t+k}].$$
Every solution is $p_t=f_t+B_t$, with $E_tB_{t+1}=qB_t$. Iterating gives
$$p_t=\sum_{k=1}^{H}q^{-k}E_t[d_{t+k}]+q^{-H}E_t[p_{t+H}].$$
The last term tends to **$B_t$**. Thus the solution is fundamental exactly when the transversality condition $\lim_{H\to\infty}q^{-H}E_t[p_{t+H}]=0$ holds at every date. The pricing equation alone does not impose this condition.

A bubble can survive with probability $\pi$ each period, grow by $q/\pi$ on survival, and become permanently zero on a crash. Its expected growth is still $q$. A positive crash probability does **not** rule it out. A specified finite terminal payoff does: the bubble is zero at the terminal date and hence at all earlier dates.`,
      idea: String.raw`The forward identity repeatedly uses the **tower property** of conditional expectation (prob-4.1.13). Discounted nonnegative dividends have an integrable sum, so their remaining expected tail tends to zero. Subtracting the fundamental solution leaves the homogeneous bubble equation; its discounted conditional expectation remains $B_t$ at every horizon.

A bursting bubble with $B_0>0$ and $\pi<1$ crashes almost surely eventually, but its increasingly large surviving values keep $q^{-H}E_0[B_H]=B_0$. Taking the expectation after the pathwise limit would incorrectly discard that contribution. This is a statement about solutions of the pricing equation, not proof that an entire equilibrium economy supports them. Blanchard and Watson discuss the additional institutional and participant assumptions separately.`,
      caption: String.raw`Prices are **after** the current dividend. The infinite asset pays 5 at every future date, giving $f=5/r$. A certain or bursting bubble is added to that fundamental; **New history** changes the random draws. At $B_0=0$ both infinite modes are simply fundamental.

The **finite asset** instead pays 5 only at dates $1,\ldots,T$ and is worthless after the last payment: $p_T=0$ and $f_t=(5/r)(1-q^{-(T-t)})$ for $t\le T$. Its blue price falls toward zero. In the right panel, the dashed red candidate adds a discounted bubble contribution $B_0$ and violates the zero terminal condition when $B_0>0$. The initial-bubble slider controls only this rejected candidate in finite mode.

The right panel shows **date-zero conditional expected discounted resale**, rather than the discounted realized history. Its infinite-horizon limit is $B_0$; the valid finite curve reaches zero exactly at $T$. The readout separates the exact branch-weighted expected gross return from a finite Monte Carlo sample and its theoretical standard error.`,
      deps: ['fin-1.9', 'prob-4.1.13'], see: ['fin-5.10'],
      refs: ['Blanchard & Watson (1982), Rationality, Arbitrage, and Bubbles; Bubbles and Transversality Conditions, pp. 296–300'],
      tags: ['rational bubbles', 'transversality', 'present value'],
      credit: 'Olivier J. Blanchard & Mark W. Watson, 1982 (pricing-equation framework)',
      scope: String.raw`An adapted integrable solution of a constant-required-return pricing equation under the explicit dividend summability condition; this is not a general equilibrium existence theorem. If prices are additionally nonnegative, the displayed limiting identity implies $B_t\ge0$. The chosen constant dividend, initial bubble, survival rate and random histories are teaching parameters, not market data. Only the stated sections of the author-hosted original are used; no direct reading of the earlier Blanchard or Tirole originals is claimed.`,
      verify: false,
      links: { source: 'https://www.princeton.edu/~mwatson/papers/Blanchard_Watson_Bubbles.pdf', doi: 'https://doi.org/10.3386/w0945' },
      viz(v) {
        const reg = v.select('asset / bubble', [{ value: 'cert', label: 'certain bubble' }, { value: 'burst', label: 'bursting bubble' }, { value: 'fin', label: 'finite asset' }], 'cert');
        const rr = v.slider('required return $r$', .02, .1, .05, { step: .0025, fmt: x => pct(x, 2) });
        const B0 = v.slider('initial bubble / rejected candidate $B_0$', 0, 60, 20, { step: 1 });
        const pi = v.slider('survival probability $\\pi$', .5, .99, .9, { step: .01 });
        const Th = v.slider('last dividend date $T$', 5, 50, 25, { int: true });
        let seed = 2; v.button('New history', () => { seed++; });
        const A = v.stage({ x: [-3, 53], y: [-10, 400], axes: 'box', gutter: true, height: 370, minWidth: 250, xlabel: 'date t (after its dividend)', ylabel: 'price', title: 'realized price and fundamental value' });
        const B = v.stage({ x: [-3, 53], y: [-10, 200], axes: 'box', gutter: true, height: 370, minWidth: 250, xlabel: 'future horizon H from date zero', ylabel: 'expected discounted resale', title: 'conditional expectation, not one realized history' });
        v.legend([['accent', 'valid price / expected discounted resale'], ['green', 'fundamental value', { dash: true }], ['gold', 'infinite expected bubble contribution'], ['red', 'rejected finite bubble candidate', { dash: true }]]);
        let st;
        v.render(() => {
          pi.el.hidden = reg.value !== 'burst'; Th.el.hidden = reg.value !== 'fin';
          const m = bubbleScenario({ r: rr.value, initial: B0.value, survival: pi.value, terminal: Th.value, regime: reg.value, random: rng(seed * 523 + 1) });
          const sample = sampledBubbleReturn(m, rng(seed * 719 + 99));
          const priceTop = Math.max(...m.prices.map(p => p[1]), ...m.fundamentals.map(p => p[1]));
          const tailTop = Math.max(...m.discountedExpected.map(p => p[1]), ...(reg.value === 'fin' ? m.candidateDiscounted.map(p => p[1]) : []));
          const timeView = [-.08 * m.end, 1.08 * m.end];
          A.setView(timeView, [-.12 * priceTop, 1.2 * priceTop]); B.setView(timeView, [-.12 * tailTop, 1.2 * tailTop]);
          A.path(m.fundamentals, { color: 'green', width: 2, dash: [5, 4] }); A.path(m.prices, { color: 'accent', width: 2.6 });
          B.path(m.discountedExpected, { color: 'accent', width: 2.6 });
          if (reg.value === 'fin') {
            A.vline(m.terminal, { color: 'muted', dash: true }); B.vline(m.terminal, { color: 'muted', dash: true });
            B.path(m.candidateDiscounted, { color: 'red', width: 2, dash: [5, 4] });
            A.dot(m.terminal, 0, { r: 6, color: 'accent' });
            B.dot(m.terminal, m.initial, { r: 6, hollow: true, color: 'red' }); B.dot(m.terminal, 0, { r: 6, color: 'accent' });
          } else {
            B.line(0, m.initial, 50, m.initial, { color: 'gold', width: 1.5, dash: [4, 4] });
            if (m.crash !== null) A.dot(m.crash, m.infiniteValue, { r: 6, color: 'red' });
          }
          st = { ...m, sample };
        });
        v.readout(() => {
          const finite = st.regime === 'fin', s = st.sample;
          const sampleText = s.draws ? `Monte Carlo: ${s.mean.toFixed(6)} from ${s.draws.toLocaleString()} independent one-step draws; theoretical standard error ${s.standardError.toFixed(6)}. A finite sample need not equal its expectation.` : 'This one-step return is deterministic; no Monte Carlo sample is needed.';
          const conclusion = finite ? `Last dividend is at T=${st.terminal}; ex-dividend p_T=0. The ${st.initial > 0 ? 'positive candidate violates that boundary' : 'zero candidate is the valid fundamental solution'}.` : st.initial === 0 ? 'B0=0: this is the fundamental solution and transversality holds.' : `Discounted conditional expected resale tends to B0=${st.initial}, so transversality fails. ${st.regime === 'burst' ? (st.crash === null ? 'This history survives all 50 transitions.' : 'This history crashes at date ' + st.crash + '.') + ' The conditional-expectation curve includes rare surviving histories.' : 'The bubble grows by 1+r every period.'}`;
          return `Initial fundamental ${fx(st.fundamentals[0][1], 4)}; initial valid price ${fx(st.price0, 4)}. Exact branch-weighted expected gross return ${st.expectedReturn.toFixed(6)}; required 1+r=${st.gross.toFixed(6)}.\n${sampleText}\n${conclusion}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Phenomenon',
      name: 'Bubbles in the laboratory (Smith–Suchanek–Williams)',
      statement: String.raw`In the **Smith–Suchanek–Williams** experiments, a small group of traders (university students, often about a dozen) trade a single asset in a computerised double auction over a fixed number of periods (15 in the standard design). At the end of each period every share pays a dividend drawn from a known distribution (in the standard design, $0, 8, 28$ or $60$ cents with equal probability, expected dividend 24 cents), and the share is worthless after the last period. So the **fundamental value** is known and **declines in a staircase**: with $n$ periods left it is $n\times$ (expected dividend), i.e. 3.60 dollars at the start and 0.24 at the last period. Instead of following that staircase, prices typically start below it, rise above it, form a **bubble** of many times the fundamental value and **crash** near the end. With **experienced** subjects (who have taken part in earlier sessions with the same market) the bubbles shrink or disappear.

Scope: the distinctive outcome of the original experiments (14 of 22 sessions with bubbles and crashes); results depend on design details (cash endowments, dividend structure, trading rules), and later studies find that bubbles are reduced by common knowledge of rationality and by experience. The dividend distribution above is from memory of the standard design and is flagged for checking.`,
      idea: String.raw`Because the dividend process is public and the fundamental value is a simple staircase, a trader who trusts that others will trade rationally should sell above the staircase; the collapse of the bubble requires everyone to carry out backward induction to the end. Subjects instead extrapolate recent price changes (the paper's "endogenous expectations": prices rise because traders expect them to rise) and uncertainty about *others'* rationality makes it optimal to ride the trend (limits to arbitrage, fin-5.7). Experience shifts weight from trend-following to the fundamental value, and with cash-rich traders (high liquidity) bubbles grow larger.`,
      caption: String.raw`A reduced-form **model** of mean market price per period, not the original data: each period the price moves by a **trend-following** share $\beta$ of its last change and by a share $\kappa$ of the gap to the fundamental value (the green staircase), plus noise; the pull to fundamentals strengthens as the end nears. Choose a preset (inexperienced, once experienced, twice experienced) or the sliders, and press **Resample** for new sessions (thin lines are other sessions with the same parameters). **Right**: the three presets side by side. The readout gives the average relative deviation (RD) and relative absolute deviation (RAD) of price from fundamental value. (Simulation; original data not reproduced.)`,
      deps: ['fin-5.10'],
      refs: ['BKM ch. 12'],
      tags: ['experimental economics', 'bubbles', 'backward induction'],
      credit: 'Smith, Suchanek & Williams, 1988',
      scope: String.raw`Describes the laboratory asset market with a known declining fundamental value; it does not show that field markets behave the same way.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vernon_L._Smith' },
      viz(v) {
        const T = 15, div = 0.24;
        const FV = (t) => (T - t + 1) * div; // t = 1..15
        const pre = v.select('traders', [{ value: 0, label: 'inexperienced' }, { value: 1, label: 'once experienced' }, { value: 2, label: 'twice experienced' }], 0, { onChange: (x) => { const P = PRE[x]; beta.set(P[0]); kap.set(P[1]); } });
        const PRE = [[0.7, 0.07], [0.4, 0.2], [0.15, 0.45]];
        const beta = v.slider('trend-following $\\beta$', 0, 1, 0.7, { step: 0.01 });
        const kap = v.slider('pull to fundamental value $\\kappa$', 0, 0.8, 0.07, { step: 0.01 });
        const noise = v.slider('noise (cents)', 0, 40, 12, { step: 1 });
        let seed = 21; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 16], y: [0, 6], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'trading period', ylabel: 'price ($ per share)', xticks: [1, 3, 5, 7, 9, 11, 13, 15], title: 'one parameter set, several sessions (model)' });
        const B = v.stage({ x: [0, 16], y: [0, 6], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'trading period', ylabel: 'mean price ($)', xticks: [1, 3, 5, 7, 9, 11, 13, 15], title: 'experience shrinks the bubble' });
        const sim = (b, k, nz, sd) => {
          const R = rng(sd), p = []; let p1 = 1.9, p2 = 1.6;
          for (let t = 1; t <= T; t++) {
            const w = Math.min(1, k + (1 - k) * Math.pow(t / T, 6) * 0.5);
            let x = p1 + b * (p1 - p2) + w * (FV(t) - p1) + nz / 100 * R.normal();
            x = Math.max(0.02, x); p.push(x); p2 = p1; p1 = x;
          }
          return p;
        };
        const meas = (p) => { let rd = 0, rad = 0, mfv = 0; for (let t = 1; t <= T; t++) mfv += FV(t) / T; for (let t = 1; t <= T; t++) { rd += (p[t - 1] - FV(t)) / T / mfv; rad += Math.abs(p[t - 1] - FV(t)) / T / mfv; } return { rd, rad, }; };
        v.legend([['green', 'fundamental value'], ['red', 'inexperienced'], ['orange', 'once experienced'], ['teal', 'twice experienced']]);
        let m = {};
        v.render(() => {
          const stairs = []; for (let t = 1; t <= T; t++) { stairs.push([t - 0.5, FV(t)], [t + 0.5, FV(t)]); }
          A.path(stairs, { color: 'green', width: 2.6 }); A.text('fundamental value', 1.2, 3.85, { size: 11.5, color: 'green', weight: 700 });
          for (let s = 1; s <= 4; s++) A.path(sim(beta.value, kap.value, noise.value, seed * 100 + s).map((y, t) => [t + 1, y]), { color: 'accent', width: 1.2, alpha: 0.45 });
          const main = sim(beta.value, kap.value, noise.value, seed * 100);
          A.path(main.map((y, t) => [t + 1, y]), { color: 'accent', width: 2.8 }); A.dots(main.map((y, t) => [t + 1, y]), { r: 3.4, color: 'accent' });
          B.path(stairs, { color: 'green', width: 2.2 });
          const cols = ['red', 'orange', 'teal'], names = ['inexperienced', 'once experienced', 'twice experienced'];
          PRE.forEach((P, k) => { const avg = new Array(T).fill(0); for (let s = 0; s < 40; s++) sim(P[0], P[1], noise.value, 5000 + s).forEach((y, t) => { avg[t] += y / 40; }); B.path(avg.map((y, t) => [t + 1, y]), { color: cols[k], width: 2.4 });  });
          const mm = meas(main); let pk = 0, pf = 0; main.forEach((y, t) => { if (y > pk) { pk = y; pf = FV(t + 1); } }); m = { ...mm, pk, pf };
        });
        v.readout(() => `Session shown in bold: mean relative deviation from fundamental value **RD = ${sg(m.rd, 2)}**, relative absolute deviation **RAD = ${v.fix(m.rad, 2)}** (both divided by the mean fundamental value 1.92 dollars); peak price \\$${v.fix(m.pk, 2)} against a fundamental value of \\$${v.fix(m.pf, 2)} in that period. A market that follows the staircase would have RD = RAD = 0.\nModel parameters, not estimates: the presets are chosen to mimic the qualitative pattern (bubble, then smaller bubbles with experience), not fitted to the 1988 data.`);
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Paper',
      name: 'Théorie de la spéculation',
      paper: { authors: 'L. Bachelier', year: 1900, title: 'Théorie de la spéculation', venue: 'Annales scientifiques de l’École Normale Supérieure, 3e série, 17: 21–86', doi: '10.24033/asens.476' },
      introduces: ['fin-5.2'],
      statement: String.raw`Bachelier's doctoral thesis (defended in Paris on 29 March 1900 before Henri Poincaré) treats the fluctuations of prices on the Paris Bourse as the result of many small, independent, fair steps: the expected profit of a speculator is zero, and the price at a later time is the sum of many independent changes. He deduces that the probability that the price $x$ (relative to its current value) is found at time $t$ is Gaussian with variance **proportional to $t$**, so the spread of prices grows like $\sqrt t$; that the probability "radiates" as heat does (the density satisfies the heat equation); and that the probability that the price has reached a level $a$ at some time before $t$ is **twice** the probability that it is above $a$ at time $t$ (the reflection principle). He uses the law to price options (forward contracts and "primes"): the value of an option is the expected payoff against the Gaussian,
$$C=\int (x-K)^+\,p(x,T)\,dx=(S-K)\,\Phi(d)+\sigma\sqrt T\,\varphi(d),\qquad d=\frac{S-K}{\sigma\sqrt T}.$$

Scope: arithmetic Brownian motion without drift or interest, prices that can go negative; the framework of fin-5.2.`,
      idea: String.raw`Before 1900 the study of markets was descriptive; Bachelier gave speculation a mathematical theory five years before Einstein's and Smoluchowski's work on Brownian motion, using the central limit theorem and the diffusion (heat) equation (pde-1.x) to describe the probabilities of price changes, and reasoning that a fair market has no predictable gains. His work was largely ignored for decades (it was brought back to economists' attention by Savage and Samuelson in the 1950s and 1960s, and is now seen as the origin of mathematical finance); the later Black–Scholes model (fin-9.3) differs mainly by using geometric Brownian motion and discounting. The thesis introduced the random-walk model of prices (fin-5.2), option valuation by expected payoff, and the connection between probability and the heat equation that underlies fin-9.2.`,
      caption: String.raw`**Left**: 60 simulated price paths (a fair game with daily standard deviation $\sigma$) from today's price 100 with Bachelier's $\pm\sigma\sqrt t$ envelope; move the **time** slider and watch the histogram of prices across paths at that date fill out the Gaussian curve with variance $\sigma^2t$. **Right**: the call payoff and the Gaussian density of the final price; the option's value is the shaded area under payoff × density. Move the **strike** $K$: the closed form, the numerical integral and the average over 4000 simulated paths agree. The readout also checks his reflection principle. (Simulation of Bachelier's model with illustrative parameters; the thesis's own tables are not reproduced.)`,
      deps: ['prob-3.4.1', 'fin-5.2'],
      refs: [],
      tags: ['Brownian motion', 'option pricing', 'heat equation'],
      credit: 'Louis Bachelier, 1900',
      scope: String.raw`Bachelier's model has arithmetic increments and no discounting; for realistic option prices use the Black–Scholes model (fin-9.3).`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Louis_Bachelier', doi: 'https://doi.org/10.24033/asens.476' },
      viz(v) {
        const sig = v.slider('daily standard deviation $\\sigma$', 0.2, 2, 1, { step: 0.05 });
        const tt = v.slider('time $t$ (days)', 1, 60, 40, { int: true });
        const K = v.slider('strike $K$', 85, 115, 102, { step: 0.5 });
        let seed = 1; v.button('New paths', () => { seed++; });
        const A = v.stage({ x: [0, 60], y: [75, 125], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 300, xlabel: 'day', ylabel: 'price', title: 'a fair game and Bachelier’s ±σ√t envelope' });
        const B = v.stage({ x: [80, 125], y: [0, 0.12], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'price at the horizon', ylabel: 'density and payoff', title: 'option value = expected payoff' });
        const NP = 4000, TT = 60;
        let ends = null, key = '', st = {};
        const phi = (x) => normPdf(x), Phi = normCdf;
        v.render(() => {
          const R = rng(seed * 733 + 5), s = sig.value;
          const key2 = seed + '|' + s;
          if (key !== key2) { ends = []; for (let i = 0; i < NP; i++) { const p = new Float64Array(TT + 1); p[0] = 100; for (let t = 1; t <= TT; t++) p[t] = p[t - 1] + s * R.normal(); ends.push(p); } key = key2; }
          const t0 = tt.value;
          A.fn((t) => 100 + s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 2 }); A.fn((t) => 100 - s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 2 });
          A.fn((t) => 100 + 2 * s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 1, dash: true }); A.fn((t) => 100 - 2 * s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 1, dash: true });
          for (let i = 0; i < 60; i++) A.path(Array.from(ends[i], (y, t) => [t, y]), { color: 'accent', width: 1, alpha: 0.35 });
          A.vline(t0, { color: 'gold', width: 2 }); A.text('±σ√t', 58, 100 + s * Math.sqrt(58), { dx: -2, dy: -8, align: 'right', size: 11.5, color: 'green', weight: 700 });
          // histogram at time t0 along the vertical line (drawn as horizontal bars to the right)
          const nb = 30, lo = 75, hi = 125, w = (hi - lo) / nb, cnt = new Array(nb).fill(0); for (let i = 0; i < NP; i++) { const b = Math.floor((ends[i][t0] - lo) / w); if (b >= 0 && b < nb) cnt[b]++; }
          const sc = 14 / Math.max(...cnt) / 1; cnt.forEach((c, b) => { if (c) A.rect(t0, lo + b * w, t0 + c * sc / 1.0 * (60 / 60) * 0.6, lo + (b + 1) * w, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 0.5 }); });
          A.fn((y) => t0 + 14 * 0.6 * normPdf(y, 100, s * Math.sqrt(t0)) / normPdf(100, 100, s * Math.sqrt(t0)), { domain: [75, 125], color: 'red', width: 2 });
          // option panel at horizon T = t0
          const sd = s * Math.sqrt(t0), S0 = 100, k = K.value, d = (S0 - k) / sd;
          const closed = (S0 - k) * Phi(d) + sd * phi(d);
          const num = v.M.integrate((x) => Math.max(x - k, 0) * normPdf(x, S0, sd), S0 - 8 * sd, S0 + 8 * sd, 800);
          let mc = 0, hit = 0, above = 0; for (let i = 0; i < NP; i++) { mc += Math.max(ends[i][t0] - k, 0); let mx = -1e9; for (let t = 0; t <= t0; t++) if (ends[i][t] > mx) mx = ends[i][t]; if (mx >= k) hit++; if (ends[i][t0] >= k) above++; } mc /= NP;
          B.setView([80, 125], [0, Math.max(0.12, 1.15 * normPdf(0, 0, sd), 0)]);
          B.fn((x) => normPdf(x, S0, sd), { domain: [80, 125], color: 'red', width: 2.2, n: 300 });
          B.fn((x) => normPdf(x, S0, sd) * Math.max(x - k, 0), { domain: [k, 125], color: 'accent', fill: true, fillAlpha: 0.3, width: 1.5, n: 200 });
          B.vline(k, { color: 'orange', width: 2 }); B.vline(S0, { color: 'faint', dash: true });
          B.text('density of the price at t', 82, 0.012, { align: 'left', size: 11, color: 'red', weight: 700 });
          st = { closed, num, mc, hit: hit / NP, above: above / NP, sd, k };
        });
        v.readout(() => `At $t=${tt.value}$: spread of the price $\\sigma\\sqrt t=${v.fix(st.sd, 2)}$ (Gaussian, variance $\\sigma^2 t$). Call with strike ${v.fix(st.k, 1)} expiring then: closed form **${v.fix(st.closed, 3)}**, numerical integral ${v.fix(st.num, 3)}, mean of 4000 simulated payoffs ${v.fix(st.mc, 3)}.\nReflection principle: P(price reached ${v.fix(st.k, 1)} by day ${tt.value}) = ${pct(st.hit, 1)} in simulation, and 2 × P(price above it at the end) = ${pct(2 * st.above, 1)} for $K\\ge100$ (the simulation checks the path only once a day, so it misses some excursions and sits a little below). At the money, $C=0.399\\,\\sigma\\sqrt T$.`);
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Paper',
      name: 'Efficient Capital Markets',
      paper: { authors: 'Eugene F. Fama', year: 1970, title: 'Efficient Capital Markets: A Review of Theory and Empirical Work', venue: 'Journal of Finance 25 (2): 383–417', doi: '10.1111/j.1540-6261.1970.tb00518.x' },
      introduces: ['fin-5.1'],
      statement: String.raw`Fama's review organises the evidence on stock-price behaviour around one idea: a market is **efficient** if prices "fully reflect" available information. Formalised as a **fair game**, $\mathrm E[r_{j,t+1}\mid\Phi_t]=\mathrm E[r_{j,t+1}\mid\text{price model}]$, the hypothesis is tested through the return surprises. He distinguishes three levels by the information set $\Phi_t$: **weak** (past prices), **semi-strong** (all public information) and **strong** (all information, including private). Reviewing the literature to 1970 he finds the evidence strong for the weak and semi-strong forms (serial correlations of returns are close to zero; prices adjust quickly to announcements such as splits and earnings), with the strong form contradicted only for a few groups with monopolistic access to information. He stresses the **joint-hypothesis problem**: every test of efficiency is also a test of the model of expected returns used to define "normal" returns.

Scope: evidence available to 1970 on U.S. stocks.`,
      idea: String.raw`Earlier work (Kendall, Osborne, Fama 1965) had found that stock prices behave like random walks, and Samuelson (1965) had proved that properly anticipated prices fluctuate randomly; Fama's contribution was to replace "random walk" by the broader fair-game formulation, which allows expected returns to differ across stocks and over time, and to organise the empirical work by information set, so that each study became a test of one level. The paper made "efficient market" the common language of financial economics and set the research agenda: event studies for the semi-strong form (fin-5.4), fund-performance studies for the strong form (fin-5.5), and the joint-hypothesis problem, which is why the debate is hard to settle (the 2013 Nobel prize for Fama, Shiller and Hansen reflected both sides). Later evidence of predictability (momentum, value, excess volatility, fin-5.6) is read either as inefficiency or as evidence of time-varying required returns.`,
      caption: String.raw`Four tabs. **Weak form**: the lag-$k$ autocorrelation of monthly returns of ten U.S. industry portfolios, 1963–2026 (real data; Fama's own tests used daily returns of the 30 Dow stocks, 1957–62, whose numbers are not reproduced), with the 95% band for no correlation. **Semi-strong**: a stylised version of the stock-split event study (Fama, Fisher, Jensen and Roll, 1969): prices rise before the split, then stay flat on average, because dividend increases keep some stocks up and cuts drop others. **Strong**: the distribution of simulated fund alphas (t-statistics) with and without a share of really skilled managers. **Joint hypothesis**: a trading rule that profits from a predictable component until traders arbitrage the predictability away. (Real data in the first tab only; the others are models.)`,
      deps: ['fin-5.13', 'fin-5.2'],
      refs: [],
      tags: ['efficient markets', 'fair game', 'joint hypothesis'],
      credit: 'Eugene F. Fama, 1970',
      scope: String.raw`A literature review; the empirical findings are those of the studies to 1970, and the later literature (fin-5.6, fin-4.10) has qualified them.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Efficient-market_hypothesis', doi: 'https://doi.org/10.1111/j.1540-6261.1970.tb00518.x' },
      viz(v) {
        const d = data(), n = d.n;
        const tab = v.select('form', [{ value: 'weak', label: 'weak' }, { value: 'semi', label: 'semi-strong' }, { value: 'strong', label: 'strong' }, { value: 'joint', label: 'joint hypothesis' }], 'weak');
        const lag = v.slider('lag $k$ (months)', 1, 12, 1, { int: true });
        const up = v.slider('share of splits followed by dividend increases', 0, 1, 0.7, { step: 0.05, fmt: (x) => pct(x, 0) });
        const skill = v.slider('share of skilled funds', 0, 0.3, 0, { step: 0.01, fmt: (x) => pct(x, 0) });
        const arb = v.slider('share of predictability traded away', 0, 1, 0, { step: 0.01, fmt: (x) => pct(x, 0) });
        let seed = 3; v.button('Resample', () => { seed++; });
        const W = v.stage({ x: [0.4, 10.6], y: [-0.2, 0.2], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'industry portfolio', ylabel: 'autocorrelation at lag k', xticks: IND_NAMES.map((s, i) => [i + 1, s]), title: 'weak form: serial correlation of monthly returns (real)' });
        const S = v.stage({ x: [-30, 30], y: [-5, 50], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'months from the split', ylabel: 'cumulative abnormal return (%)', title: 'semi-strong form: a stock-split study (stylised)' });
        const F = v.stage({ x: [-6, 8], y: [0, 0.35], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 't-statistic of the fund’s alpha', ylabel: 'share of funds', title: 'strong form: do funds beat the market? (simulated)' });
        const J = v.stage({ x: [0, 600], y: [-10, 60], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'period', ylabel: 'cumulative profit of the rule', title: 'joint hypothesis: profit until it is priced away (model)' });
        let st = {};
        const sets = { weak: W, semi: S, strong: F, joint: J };
        v.render(() => {
          for (const k in sets) sets[k].el.style.display = k === tab.value ? '' : 'none';
          lag.el.hidden = tab.value !== 'weak'; up.el.hidden = tab.value !== 'semi'; skill.el.hidden = tab.value !== 'strong'; arb.el.hidden = tab.value !== 'joint';
          if (tab.value === 'weak') {
            const k = lag.value, band = 1.96 / Math.sqrt(n), vals = d.ind.map((s) => acf(s, k));
            W.hband(-band, band, { color: 'muted', alpha: 0.18 }); W.hline(0, { color: 'faint' });
            W.bars(vals, { x0: 1, dx: 1, color: (q) => (Math.abs(q) > band ? 'orange' : 'accent') });
            const out = vals.filter((q) => Math.abs(q) > band).length; st = { out, band, mx: Math.max(...vals.map(Math.abs)), mean: meanOf(vals) };
          } else if (tab.value === 'semi') {
            const R = rng(seed * 11), pts = [], inc = [], dec = [], up0 = up.value; let a = 0, b = 0, c = 0;
            for (let t = -30; t <= 30; t++) {
              let mu = t <= 0 ? 0.9 : 0, mu2 = mu;
              if (t > 0 && t <= 6) { mu = 0.35; mu2 = -0.35 * up0 / Math.max(0.05, 1 - up0); }
              a += mu + 0.15 * R.normal(); b += mu2 + 0.15 * R.normal(); c += up0 * mu + (1 - up0) * mu2 + 0.1 * R.normal() * 0.3;
              inc.push([t, a]); dec.push([t, b]); pts.push([t, c]);
            }
            S.vline(0, { color: 'faint', dash: true });
            S.path(inc, { color: 'green', width: 2 }); S.path(dec, { color: 'red', width: 2 }); S.path(pts, { color: 'accent', width: 3 });
            S.text('dividend increased', 30, inc[60][1], { dx: -4, dy: -9, align: 'right', size: 11, color: 'green', weight: 700 }); S.text('dividend cut', 30, dec[60][1], { dx: -4, dy: 14, align: 'right', size: 11, color: 'red', weight: 700 }); S.text('all splits', 30, pts[60][1], { dx: -4, dy: -9, align: 'right', size: 11.5, color: 'accent', weight: 700 });
            st = { post: pts[60][1] - pts[30][1], pre: pts[30][1] - pts[0][1] };
          } else if (tab.value === 'strong') {
            const R = rng(seed * 17), N = 400, H = 10, te = 4, ts = []; let hits = 0;
            for (let i = 0; i < N; i++) { const sk = R() < skill.value, al = sk ? 3 : -0.8; const t = (al + te / Math.sqrt(H) * R.normal()) / (te / Math.sqrt(H)); ts.push(t); if (t > 1.96) hits++; }
            const nb = 28, lo = -6, hi = 8, w = (hi - lo) / nb, cnt = new Array(nb).fill(0); for (const t of ts) { const k = Math.floor((t - lo) / w); if (k >= 0 && k < nb) cnt[k]++; }
            F.rect(1.96, 0, 8, 0.35, { fill: 'green', fillAlpha: 0.08, stroke: false });
            cnt.forEach((q, k) => F.rect(lo + k * w + 0.03, 0, lo + (k + 1) * w - 0.03, q / N, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 0.8 }));
            F.fn((x) => normPdf(x, -0.8 / (te / Math.sqrt(H)), 1) * w, { domain: [-6, 8], color: 'muted', width: 1.8, dash: true });
            F.text('significant at 5%', 6.5, 0.32, { size: 11, color: 'green', align: 'center', weight: 700 });
            st = { hits, N, lucky: N * (1 - normCdf(1.96 + 0.8 / (te / Math.sqrt(H)))) };
          } else {
            const R = rng(seed * 23), N = 600, phi = 0.9, b = 0.35; let x = 0, cum = 0; const pts = [[0, 0]]; let s1 = 0, s2 = 0;
            for (let t = 0; t < N; t++) { const e = R.normal(); const pf = Math.sign(x) * (b * (1 - arb.value) * Math.abs(x)); const r = b * (1 - arb.value) * x + 3 * e; const g = Math.sign(x) * r; cum += g; s1 += g; s2 += g * g; pts.push([t + 1, cum]); x = phi * x + Math.sqrt(1 - phi * phi) * R.normal(); }
            J.hline(0, { color: 'faint' }); J.path(pts, { color: arb.value > 0.95 ? 'muted' : 'green', width: 2.6 });
            const m = s1 / N, sdv = Math.sqrt(s2 / N - m * m); st = { tstat: m / (sdv / Math.sqrt(N)), final: cum };
            J.setView([0, N], [Math.min(-10, ...pts.map((q) => q[1])) - 2, Math.max(60, ...pts.map((q) => q[1])) + 2]);
          }
        });
        v.readout(() => ({
          weak: () => `At lag ${lag.value}: **${st.out}** of 10 industries lie outside the 95% band ±${v.fix(st.band, 3)} (chance alone gives about 0.5); the largest absolute autocorrelation is ${v.fix(st.mx, 3)}, mean ${fx(st.mean, 3)}. Serial correlations are small, as Fama reported for the stocks of his day. Industry portfolios are used here instead of his 30 Dow stocks.`,
          semi: () => `Average split: run-up before the split ${sg(st.pre, 1)}% over the 30 months, then ${sg(st.post, 1)}% over the next 30; the average is flat after the split because some stocks keep their gains (dividend increases) and some give them back (cuts), the pattern behind the semi-strong form.`,
          strong: () => `${st.hits} of ${st.N} simulated funds look “significantly” skilled (t > 1.96); chance alone would give about ${v.fix(st.lucky, 1)} even among funds that lose the fee. With no skilled funds, finding a few winners is no evidence against the strong form (Jensen found little evidence of skill; this is a model).`,
          joint: () => `Rule “hold the asset when the predictor $x_t>0$, otherwise sell it short”: final profit ${v.fix(st.final, 1)}, $t=${v.fix(st.tstat, 1)}$. When ${pct(arb.value, 0)} of the predictability has been traded away the profit shrinks; at 100% the market is efficient with respect to $x$, but in an empirical test you could not tell this from a risk premium that varies with $x$ (the joint-hypothesis problem).`,
        })[tab.value]());
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Paper',
      name: 'Do Stock Prices Move Too Much?',
      paper: { authors: 'Robert J. Shiller', year: 1981, title: 'Do Stock Prices Move Too Much to be Justified by Subsequent Changes in Dividends?', venue: 'American Economic Review 71 (3): 421–436', url: 'https://www.jstor.org/stable/1802789' },
      introduces: ['fin-5.6'],
      statement: String.raw`Shiller compares two series for the Standard & Poor's Composite Stock Price Index (annual, 1871–1979, in real terms and detrended for growth): the price $p_t$, and the **ex-post rational price** $p_t^*$, the present value of the dividends that were actually paid afterwards, discounted at a constant rate (with a terminal value). If $p_t$ is the optimal forecast of $p_t^*$, then $p_t^*-p_t$ is a forecast error uncorrelated with $p_t$, which implies the **variance bound** $\operatorname{var}(p_t)\le\operatorname{var}(p_t^*)$, equivalently $\sigma(p)\le\sigma(p^*)$. In the data $p^*$ is a smooth, slowly varying curve, while $p$ fluctuates widely around it, so the bound fails by a large margin: stock prices "move too much" to be justified by subsequent changes in dividends. LeRoy and Porter (1981) reached the same conclusion with a different test. Subsequent critics (Flavin 1983, Marsh and Merton 1986, Kleidon 1986) pointed out that the bound is distorted when dividends are non-stationary or highly persistent and the sample is short.

Scope: the original series, discount rate and terminal-value choices are Shiller's; the panel here uses his later, extended online data, so the numbers differ from the paper.`,
      idea: String.raw`The test is a variance decomposition of a forecast and its target (fin-5.6). Smooth dividends make $p^*$ smooth because $p^*$ is a long discounted average of them; if the price fluctuates far more, it must respond to something other than expected dividends. The paper opened the "excess volatility" literature and, with Shiller's later work, fed the case for behavioural explanations (fads, over-reaction); the critics' point, that the sample variances of persistent series are biased and the bound requires stationary series, led to improved tests that still rejected in many specifications, and to the view that time-varying discount rates also matter (Campbell and Shiller's present-value decompositions). The paper figures in Shiller's 2013 Nobel citation.`,
      caption: String.raw`**Left**: Shiller's Figure 1 reconstructed from his online annual data: the real S&P price (detrended, blue) and the ex-post rational price (green); choose the **sample** (1871–1979 as in the paper, or to 2022), the **discount rate** and the **terminal value** and compare the standard deviations. **Right**: the critics' point. We simulate a *perfectly rational* market with the same size of dividends, where $p_t$ is exactly the expected present value of dividends with persistence $\rho$, and apply Shiller's procedure to 109 years of simulated data; the histogram shows the ratio $\sigma(p)/\sigma(p^*)$ over 400 simulations, with the real data's ratio as the gold line. For persistence near 0.95 the bound already fails in a large share of rational markets, but the real ratio is far out in the tail. (Real data: Shiller's later series; simulation: a model.)`,
      deps: ['fin-1.11', 'fin-5.14', 'fin-5.6'],
      refs: [],
      tags: ['variance bounds', 'excess volatility', 'present value'],
      credit: 'Robert J. Shiller, 1981',
      scope: String.raw`The bound assumes stationary series, a constant discount rate and a given terminal value; the reconstruction uses extended data, not the paper's 1871–1979 series.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Excess_volatility', url: 'https://www.jstor.org/stable/1802789' },
      viz(v) {
        const smp = v.select('sample', [{ value: 109, label: '1871–1979' }, { value: 152, label: '1871–2022' }], 109);
        const r = v.slider('discount rate $r$ (detrended)', 0.02, 0.12, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const term = v.select('terminal value of $p^*$', [{ value: 'mean', label: 'mean of the price' }, { value: 'last', label: 'last price' }], 'mean');
        const rho = v.slider('dividend persistence $\\rho$ (rational market)', 0, 0.99, 0.9, { step: 0.01 });
        let seed = 6; v.button('Resimulate', () => { seed++; });
        const A = v.stage({ x: [1871, 1980], y: [0, 200], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 300, xlabel: 'year', ylabel: 'real price, detrended', title: 'Shiller’s Figure 1, reconstructed' });
        const B = v.stage({ x: [0, 3], y: [0, 0.35], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'σ(p) / σ(p*)', ylabel: 'share of simulations', title: 'a perfectly rational market, same number of years' });
        let st = {};
        v.render(() => {
          const S = shillerDetrended(smp.value), T = S.T, mp = meanOf(S.p);
          const ps = exPost(S.d, r.value, term.value === 'mean' ? mp : S.p[T - 1]);
          const sp = sdOf(S.p), sps = sdOf(ps), ratio = sp / sps;
          A.setView([1871, S.year[T - 1] + 1], [0, Math.max(...S.p, ...ps) * 1.1]);
          A.path(S.year.map((y, i) => [y, S.p[i]]), { color: 'accent', width: 2.2 }); A.path(S.year.map((y, i) => [y, ps[i]]), { color: 'green', width: 2.8 });
          A.text('p', 1960, S.p[89], { dx: 6, dy: -10, size: 13, color: 'accent', weight: 700 }); A.text('p*', 1960, ps[89], { dx: 6, dy: 14, size: 13, color: 'green', weight: 700 });
          // Monte Carlo: rational market, AR(1) dividends around the sample mean with the sample sd
          const R = rng(seed * 1009 + 3), M = 400, Tn = smp.value, mu = meanOf(S.d), sdd = sdOf(S.d), e = sdd * Math.sqrt(1 - rho.value ** 2), rs = []; let bad = 0;
          for (let m = 0; m < M; m++) {
            const dd = []; let x = sdd * R.normal(); for (let t = 0; t < Tn; t++) { dd.push(mu + x); x = rho.value * x + e * R.normal(); }
            const p = dd.map((q) => mu / r.value + (q - mu) / (1 + r.value - rho.value)), pstar = exPost(dd, r.value, meanOf(p));
            const q = sdOf(p) / sdOf(pstar); rs.push(q); if (q > 1) bad++;
          }
          const xm = Math.max(3, ratio + 0.4), nb = 40, w = xm / nb, cnt = new Array(nb).fill(0); for (const q of rs) { const k = Math.min(nb - 1, Math.floor(q / w)); cnt[k]++; }
          B.setView([0, xm], [0, Math.max(0.2, Math.max(...cnt) / M * 1.15)]);
          cnt.forEach((c, k) => B.rect(k * w + 0.01, 0, (k + 1) * w - 0.01, c / M, { fill: k * w >= 1 ? 'red' : 'accent', fillAlpha: 0.45, color: k * w >= 1 ? 'red' : 'accent', width: 0.6 }));
          B.vline(1, { color: 'ink', dash: true }); B.text('bound violated →', 1.05, 0.33, { size: 11, color: 'red', weight: 700 });
          B.vline(ratio, { color: 'gold', width: 3 }); B.text('real data', ratio, 0.3, { dx: -6, size: 11.5, color: 'gold', align: 'right', weight: 700 });
          st = { sp, sps, ratio, bad: bad / M, mrs: meanOf(rs), tail: rs.filter((q) => q >= ratio).length / M };
        });
        v.readout(() => `Real data (${smp.value === 109 ? '1871–1979' : '1871–2022'}, $r=${pct(r.value, 2)}$): $\\sigma(p)=${v.fix(st.sp, 1)}$, $\\sigma(p^*)=${v.fix(st.sps, 1)}$, ratio **${v.fix(st.ratio, 2)}**; Shiller's bound needs a ratio of at most 1.\nPerfectly rational market with dividend persistence ${v.fix(rho.value, 2)}: the bound appears violated in **${pct(st.bad, 0)}** of 400 simulated samples (average ratio ${v.fix(st.mrs, 2)}); a ratio as large as the real one occurred in **${pct(st.tail, 1)}** of them. The real dividends' own persistence (lag-1 autocorrelation about 0.9) makes the bound less reliable than it looks, but does not by itself account for a ratio this large.`);
      },
    },
  ],
};
