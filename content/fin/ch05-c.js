// Finance — Chapter 5 (part 3): items 5.11–5.15 (rational bubbles, laboratory bubbles and the three papers).
//
// Sources and honesty notes (checked Oct 2026): Blanchard, Economics Letters 3(4):387–389 (1979); Blanchard & Watson (1982, NBER w0945); Tirole, Econometrica 53(6):1499–1528 (1985);
// Smith, Suchanek & Williams, Econometrica 56(5):1119–1151 (1988) (15- or 30-period sessions, dividends drawn from a known distribution; 14 of 22 sessions had bubbles; experienced traders
// had fewer, but not zero); Dufwenberg, Lindqvist & Moore, AER 95(5):1731–1737 (2005); Lei, Noussair & Plott, Econometrica 69(4):831–859 (2001);
// Bachelier, Ann. sci. ENS 3e série 17:21–86 (1900), doi 10.24033/asens.476; Fama, J. Finance 25(2):383–417 (1970) (doi 10.2307/2325486);
// Shiller, AER 71(3):421–436 (1981); LeRoy & Porter, Econometrica 49(3):555–574 (1981).
// 5.11 independently reads Blanchard–Watson's authored 1982 chapter, pp.295–300; original-page formulas inspected.
// Its explicit summability/finite-annuity illustration and checks are documented in the dedicated bubble follow-up.
// Real data: Shiller's annual series (ch05.shared.js), the daily and monthly market and industry returns (French library). Models and reconstructions are labelled as such.
import { clamp, pct, fx, sg, data, daily, shiller, shillerDetrended, exPost, meanOf, sdOf, acf, normPdf, normCdf, pricePath, rng, mean, sdev, IND_NAMES } from './ch05.shared.js';
import { bubbleScenario, sampledBubbleReturn } from './source-audit-bubbles.js';
import { LAB_PRESETS, labFundamental, labSession, labDeviation, labMean } from './source-audit-laboratory.js';
import { benchmarkExperiment, splitIllustration, fundIllustration } from './source-audit-efficiency.js';
import { bachelierLaw, standardGaussianWalks, sampledBachelier, terminalHistogram } from './source-audit-bachelier.js';

// 5.13 independently reads original Numdam pp.31–43,46–51,70–75; inspected original Gaussian,
// premium and barrier formulas. Modern zero-rate simulation is distinct from adjusted cours vrai and original tables.

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
      statement: String.raw`Smith, Suchanek and Williams studied computerized double-auction asset markets with common announced dividend distributions. Their Table I **design 4** has 15 periods, no terminal buyout, and dividends of 0, 8, 28 or 60 cents, each with probability one quarter. Before period $t$'s dividend, the **undiscounted risk-neutral expected-dividend benchmark** is
$$F_t=0.24(16-t)\quad(t=1,\ldots,15),$$
with zero value after the final dividend. This is an expected cash-flow benchmark, not a certain realized dividend or a universal risk-adjusted price.

The paper classifies 14 of 22 experiments without intervention/disruption as bubble–crash markets; nine of those 14 used experienced subjects. Experience reduced the tendency to bubble without eliminating it. Other original designs used different dividends, terminal buyouts or a 30-period horizon. The chart below is an authored recurrence, not any original session.`,
      idea: String.raw`The benchmark adds the 15-period design's remaining expected cash flows at zero discount, applying fin-1.5. Common knowledge of dividends does not force participants to have common expectations about other traders. The original study discusses that distinction; the recurrence here does not identify traders' motives or prove a learning mechanism.

For a chosen trend weight $\beta$, pull $\kappa$ and Gaussian noise $\epsilon_t$, the illustration sets
$$w_t=\kappa+\tfrac12(1-\kappa)(t/15)^6,$$
$$m_t=p_{t-1}+\beta(p_{t-1}-p_{t-2}),$$
$$a_t=m_t+w_t(F_t-p_{t-1}),$$
$$p_t=\max\{0.02,a_t+\epsilon_t\}.$$
The initial levels 1.9 and 1.6 dollars, two-cent floor and increasing pull are authored assumptions. The three parameter presets are not measured experience categories. Independent simulated paths have finite second moments; prob-2.2.3 explains convergence of their averages as the number of paths grows. Forty paths remain a finite estimate with sampling error.`,
      caption: String.raw`**Left:** one bold authored session and four other sessions at the actual controls. All prices are before that period's dividend. Green is the expected-dividend staircase; the separate hollow marker at “after” is the assumed zero terminal value. It is not a simulated crash.

**Right:** means of 40 finite paths under each of three chosen presets, using matched noise draws for comparison. Preset buttons set the left trend/pull controls; changing them manually selects a custom model. **Resample all paths** refreshes both panels. Neither prices nor parameter values are original observations or estimates, and the three sample curves need not be ordered.`,
      deps: ['fin-1.5', 'prob-2.2.3'],
      see: ['fin-5.10'],
      refs: ['Smith, Suchanek & Williams (1988), §§1,3, Table I and §6.1, pp.1119–1126 and1147–1148'],
      tags: ['experimental economics', 'bubbles', 'expectations'],
      credit: 'Smith, Suchanek & Williams, 1988; specified recurrence authored here',
      scope: String.raw`The original mechanism has actual bids, offers, cash/share endowments and no short selling. This recurrence simulates none of those constraints, has no endogenous order book or learning, and is not the paper's estimated lagged-excess-bid model. RD and RAD below are explicitly defined normalized descriptive errors, not an attribution of those metrics to the 1988 study. A finite simulated sample cannot certify an experience effect or predict field markets.`,
      verify: false,
      links: { doi: 'https://doi.org/10.2307/1911361', source: 'https://web.archive.org/web/20140202134430/http://teaching.ust.hk/~bee/papers/040918/1988-Smith_etal-bubbles.pdf' },
      viz(v) {
        const beta = v.slider('authored trend weight β', 0, 1, 0.7, { step: 0.01 });
        const kap = v.slider('authored fundamental pull κ', 0, 0.8, 0.07, { step: 0.01 });
        const noise = v.slider('Gaussian noise standard deviation (cents)', 0, 40, 12, { step: 1 });
        const labels = ['A: high trend', 'B: balanced', 'C: strong pull'], colors = ['red', 'orange', 'teal'];
        LAB_PRESETS.forEach((p, i) => v.button(`Preset ${labels[i]}`, () => { beta.set(p[0]); kap.set(p[1]); }));
        let seed = 21; v.button('Resample all paths', () => { seed++; });
        const options = { x: [0, 17], y: [-0.3, 6], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'period (before dividend; then after)', ylabel: 'dollars per share', xticks: [[1, '1'], [5, '5'], [10, '10'], [16, 'after']] };
        const A = v.stage({ ...options, title: 'authored session at current controls' });
        const B = v.stage({ ...options, title: '40-path means of three authored presets' });
        v.legend([['green', 'expected-dividend benchmark'], ['accent', 'current controls: one + four paths'], ['red', labels[0]], ['orange', labels[1]], ['teal', labels[2]], ['ink', 'assumed zero after final dividend']]);
        let cache, key, st = {};
        const draw = (b, k, n) => { const R = rng(n); return labSession(b, k, noise.value, () => R.normal()); };
        v.render(() => {
          const next = [seed, beta.value, kap.value, noise.value].join('|');
          if (key !== next) {
            const sessions = Array.from({ length: 5 }, (_, j) => draw(beta.value, kap.value, seed * 100 + j));
            const comparison = LAB_PRESETS.map(([b, k]) => labMean(Array.from({ length: 40 }, (_, j) => draw(b, k, seed * 10000 + 5000 + j))));
            cache = { sessions, comparison, metrics: labDeviation(sessions[0]) }; key = next;
          }
          const { sessions, comparison, metrics } = cache, max = Math.max(3.6, ...sessions.flat(), ...comparison.flatMap(q => q.mean)), top = max * 1.15 + 0.1;
          for (const s of [A, B]) {
            s.setView([0, 17], [-0.08 * top, top]);
            const stairs = []; for (let t = 1; t <= 15; t++) stairs.push([t - .5, labFundamental(t)], [t + .5, labFundamental(t)]);
            s.path(stairs, { color: 'green', width: 2.3 }); s.dot(16, 0, { color: 'ink', r: 5, hollow: true });
          }
          for (let j = 1; j < 5; j++) A.path(sessions[j].map((p, t) => [t + 1, p]), { color: 'accent', width: 1.1, alpha: .4 });
          A.path(sessions[0].map((p, t) => [t + 1, p]), { color: 'accent', width: 2.6 }); A.dots(sessions[0].map((p, t) => [t + 1, p]), { color: 'accent', r: 3.4 });
          comparison.forEach((q, j) => B.path(q.mean.map((p, t) => [t + 1, p]), { color: colors[j], width: 2.4 }));
          st = { ...metrics, comparison, preset: LAB_PRESETS.findIndex(([b, k]) => Math.abs(b - beta.value) < 1e-10 && Math.abs(k - kap.value) < 1e-10) };
        });
        v.readout(() => `Current parameters: ${st.preset < 0 ? 'custom' : labels[st.preset]}. Bold path RD = mean(p−F)/mean(F) = ${v.fix(st.rd, 4)}; RAD = mean|p−F|/mean(F) = ${v.fix(st.rad, 4)}. Mean(F) = 1.92 dollars. Peak price ${v.fix(st.peak, 3)} dollars at period ${st.peakPeriod}, benchmark ${v.fix(labFundamental(st.peakPeriod), 3)} dollars. These are uncalibrated model outputs.\nRight panel uses 40 paths per preset; largest estimated standard error across its 15 means: ${st.comparison.map((q, j) => `${'ABC'[j]} ${v.fix(Math.max(...q.se), 4)}`).join(', ')} dollars. A zero noise setting is deterministic. Every path/mean is shown within the plot bounds. The separate zero terminal marker is imposed by the no-buyout design, not evidence that a simulated price discovers its value.`);
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Paper',
      name: 'Théorie de la spéculation',
      paper: { authors: 'L. Bachelier', year: 1900, title: 'Théorie de la spéculation', venue: 'Annales scientifiques de l’École Normale Supérieure, 3e série, 17: 21–86', doi: '10.24033/asens.476' },
      introduces: ['fin-5.2'],
      statement: String.raw`Bachelier (1900) derives a Gaussian law, its diffusion equation, option values and a barrier-crossing identity. His zero-expectation principle concerns the **cours vrai**, adjusted for coupons and financing reports; it is not a claim that every quoted bond price has zero drift.

This modern **zero-rate illustration** uses $S_t=100+\sigma W_t$: independent Gaussian daily increments, with variance $\sigma^2t$. A European call has
$$C=E[(S_T-K)^+],$$
$$C=(100-K)\Phi(d)+\sigma\sqrt T\,\varphi(d),$$
$$d=\frac{100-K}{\sigma\sqrt T}.$$
For an **upper barrier** $K>100$, the continuous-path identity is
$$P\!\left(\max_{0\le s\le T}S_s\ge K\right)=2P(S_T\ge K).$$
If $K\le100$, that event has probability **one**, since time zero is included. Observing the path only once a day can miss crossings between observations.`,
      idea: String.raw`The independent-step normal approximation (prob-3.4.1) leads to a Gaussian whose standard deviation grows as $\sqrt t$. The written heat kernel (pde-3.3), with diffusivity $D=\sigma^2/2$, gives
$$q(x,t)=\frac{e^{-(x-100)^2/(2\sigma^2t)}}{\sigma\sqrt{2\pi t}},\qquad q_t=Dq_{xx}.$$
Integrating $(x-K)^+q(x,T)$ by parts gives the call formula. Bachelier's original coefficient $k$ is the one-period positive expected gain, not our standard deviation: $k=\sigma/\sqrt{2\pi}$. His simple at-the-money premium is therefore $k\sqrt T=\sigma\sqrt T/\sqrt{2\pi}$. The original general-prime equation on pp. 49–51 maps to $C=E[(S_T-K)^+]$ after writing its exercise offset as $K-100$. The barrier result on p. 75 concerns the whole time interval, whereas the simulation records only its daily grid.`,
      caption: String.raw`**Paths:** 60 of 4,000 simulated daily paths over the full 60 days, with one- and two-standard-deviation envelopes. The gold line selects the horizon; all displayed paths fit the view.

**Terminal density:** the histogram counts **all 4,000** prices at that horizon and is normalized to area one. The red curve is the Gaussian density, in inverse price units. The displayed window includes every sample and at least $\pm5\sigma\sqrt T$.

**Call integrand:** $(x-K)^+q(x,T)$ is dimensionless; its full-domain area is the option value in price units. The plot shows a finite window. Density and payoff-weighted density do not share an axis. The formula, numerical integral and Monte Carlo mean are separate comparisons, with a sample standard error. A very small integrand can look flat. All parameters and paths are illustrative; none are historical observations.`,
      deps: ['prob-3.4.1', 'fin-5.2', 'pde-3.3'],
      refs: ['Bachelier (1900), pp. 31–43, 46–51 and 70–75'],
      tags: ['Brownian motion', 'option pricing', 'heat equation'],
      credit: 'Louis Bachelier, 1900',
      scope: String.raw`An authored arithmetic-Gaussian extension starting at 100 arbitrary price units, with zero interest and no trading costs. Prices can be negative. Bachelier's coupon/report-adjusted contracts and tables are not reconstructed. The 4,000-path estimates have sampling error, and daily monitoring differs from continuous monitoring; their agreement is not guaranteed. A zero estimated payoff standard error can mean that no positive payoff was sampled. Displayed zero in an extreme Gaussian tail can reflect finite precision. This illustration does not establish which asset-price model is empirically appropriate.`,
      verify: false,
      links: { doi: 'https://doi.org/10.24033/asens.476', source: 'https://www.numdam.org/item/ASENS_1900_3_17__21_0.pdf' },
      viz(v) {
        const sig = v.slider('daily standard deviation $\\sigma$', 0.2, 2, 1, { step: 0.05 });
        const tt = v.slider('horizon $T$ (days)', 1, 60, 40, { step: 1, int: true });
        const K = v.slider('strike $K$', 85, 115, 102, { step: 0.5 });
        let seed = 1; v.button('New paths', () => { seed++; });
        const A = v.stage({ x: [-2, 63], y: [75, 125], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 280, xlabel: 'day', ylabel: 'price units', title: 'daily paths and Gaussian envelopes' });
        const B = v.stage({ x: [80, 125], y: [-0.01, 0.12], axes: 'box', gutter: true, height: 340, minWidth: 280, xlabel: 'terminal price (price units)', ylabel: 'density (inverse price units)', title: 'all 4,000 terminal observations' });
        const C = v.stage({ x: [80, 125], y: [-0.01, 0.3], axes: 'box', gutter: { l: 62 }, height: 340, minWidth: 280, xlabel: 'terminal price (price units)', ylabel: 'payoff × density (unitless)', title: 'call integrand, separate ordinate' });
        const NP = 4000, TT = 60;
        let paths = null, pathSeed = null, cached = null;
        const amount = x => x > 0 && x < 0.001 ? x.toExponential(3) : v.fix(x, 4);
        const probability = x => x > 0 && x < 1e-5 ? (100 * x).toExponential(3) + '%' : pct(x, 3);
        v.legend([['accent', '60 daily price paths'], ['green', '±σ√t / dashed ±2σ√t'], ['gold', 'chosen horizon / sample density'], ['red', 'Gaussian density'], ['teal', 'call payoff × density'], ['orange', 'strike K']]);
        const calc = () => {
          if (pathSeed !== seed) { const R = rng(seed * 733 + 5); paths = standardGaussianWalks(() => R.normal(), NP, TT); pathSeed = seed; }
          const key = [seed, sig.value, tt.value, K.value].join('|');
          if (cached?.key !== key) {
            const law = bachelierLaw(sig.value, tt.value, K.value), sample = sampledBachelier(paths, sig.value, tt.value, K.value);
            cached = { key, law, sample, histogram: terminalHistogram(sample.prices, law.sd) };
          }
          return cached;
        };
        v.render(() => {
          const { law, histogram } = calc(), s = sig.value, t0 = tt.value;
          const shown = paths.slice(0, 60).map(p => Array.from(p, (z, t) => [t, 100 + s * z]));
          let lo = 100 - 2 * s * Math.sqrt(TT), hi = 100 + 2 * s * Math.sqrt(TT);
          for (const p of shown) for (const [, y] of p) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
          const pad = 0.12 * (hi - lo) + 0.2;
          A.setView([-2, 63], [lo - pad, hi + pad]);
          A.fn((t) => 100 + s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 2 }); A.fn((t) => 100 - s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 2 });
          A.fn((t) => 100 + 2 * s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 1, dash: true }); A.fn((t) => 100 - 2 * s * Math.sqrt(t), { domain: [0, 60], color: 'green', width: 1, dash: true });
          shown.forEach(p => A.path(p, { color: 'accent', width: 1, alpha: 0.3 }));
          A.vline(t0, { color: 'gold', width: 2 }); A.hline(100, { color: 'muted', width: 1, dash: true });
          const peak = Math.max(law.pdf(100), ...histogram.bins.map(b => b.density));
          B.setView([histogram.lo, histogram.hi], [-0.08 * peak, 1.23 * peak]);
          histogram.bins.forEach(b => B.rect(b.lo, 0, b.hi, b.density, { fill: 'gold', fillAlpha: 0.45, stroke: false }));
          B.fn(law.pdf, { domain: [histogram.lo, histogram.hi], color: 'red', width: 2.4, n: 400 });
          B.dot(100, law.pdf(100), { color: 'red', r: 4.5 });
          let cx0 = Math.min(histogram.lo, law.strike, law.peakX), cx1 = Math.max(histogram.hi, law.strike, law.peakX);
          const cp = 0.09 * (cx1 - cx0); cx0 -= cp; cx1 += cp;
          const cpmax = Math.max(1e-12, law.peakY);
          C.setView([cx0, cx1], [-0.15 * cpmax, 1.4 * cpmax]);
          const tick = x => x === 0 ? '0' : x < 0.001 ? x.toExponential(0).replace('e-', 'e−') : String(+x.toPrecision(2));
          C.setTicks(null, [0, 0.5 * cpmax, cpmax].map(x => [x, tick(x)]));
          const xs = v.M.linspace(cx0, cx1, 450).concat(law.strike, law.peakX).sort((a, b) => a - b);
          C.path([[cx0, 0], ...xs.map(x => [x, law.integrand(x)]), [cx1, 0]], { color: 'teal', width: 2.4, fill: true, fillAlpha: 0.25, close: true });
          C.vline(law.strike, { color: 'orange', width: 1.6 });
          if (law.peakY > 0) C.dot(law.peakX, law.peakY, { color: 'teal', r: 4.5 });
        });
        v.readout(() => {
          const { law, sample, histogram } = calc(), count = histogram.bins.reduce((s, b) => s + b.count, 0);
          const barrier = law.strike <= 100 ? 'K ≤ 100: the upper barrier is already reached at time zero; continuous and daily probabilities are 100%.' : `K > 100: exact continuous upper-barrier probability = ${probability(law.continuousHit)} = twice the exact terminal tail ${probability(law.terminalAbove)}. Daily-monitored simulation = ${probability(sample.dailyHit)}; terminal-above simulation = ${probability(sample.terminalAbove)}. Finite monitoring misses between-day excursions, and the sample also has Monte Carlo error.`;
          return `T = ${law.time} days; σ√T = ${amount(law.sd)} price units. Histogram counted ${count}/${NP} terminals, area = ${v.fix(histogram.bins.reduce((s, b) => s + b.density * (b.hi - b.lo), 0), 6)}.\nCall K = ${v.fix(law.strike, 1)}: formula ${amount(law.call)}, numerical integral ${amount(law.integral)}, Monte Carlo ${amount(sample.call)}, estimated standard error ${amount(sample.callSE)} (price units). These finite estimates need not coincide.\n${barrier}\nOriginal coefficient k = σ/√(2π) = ${amount(sig.value / Math.sqrt(2 * Math.PI))}; at the money C = k√T. Tiny positive values use scientific notation; extreme-tail zero can reflect finite precision.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Paper',
      name: 'Efficient Capital Markets',
      paper: { authors: 'Eugene F. Fama', year: 1970, title: 'Efficient Capital Markets: A Review of Theory and Empirical Work', venue: 'Journal of Finance 25 (2): 383–417', doi: '10.1111/j.1540-6261.1970.tb00518.x' },
      introduces: ['fin-5.1'],
      statement: String.raw`Fama organises evidence by the information reflected in prices: **weak** (past prices), **semi-strong** (public information), and **strong** (including private information). In his expected-return formulation, an equilibrium model supplies a $\Phi_t$-measurable benchmark $b_t$, and the joint restriction is
$$\mathrm E[r_{t+1}-b_t\mid\Phi_t]=0.$$
For bounded positions chosen using $\Phi_t$, the conditional expectation rule in prob-4.1.14 then rules out positive expected abnormal trading gains before costs. Subtracting the true conditional mean instead would give a mathematical identity, not an empirical test. Independent returns are a stronger assumption; a fair-game residual permits predictable risk compensation.

The review's 1970 assessment supports weak and semi-strong efficiency in the studies considered, while identifying specialists and corporate insiders as exceptions to the strong form. These are historical conclusions, not a verdict on current markets. Tests depend jointly on information, the expected-return model and measurement.`,
      idea: String.raw`An expected raw return and an abnormal return are different objects. In the finite-state illustration, $x$ and $\varepsilon$ are independent equiprobable signs, $r=\mu+\beta x+\sigma\varepsilon$, and the chosen risk benchmark is $b(x)=\mu+\gamma x$. Thus $\mathrm E[r-b(x)\mid x]=(\beta-\gamma)x$. The bounded rule $h=x$ earns expected raw return $\beta$, benchmark compensation $\gamma$, and abnormal gain $\beta-\gamma$. When $\gamma=\beta>0$, raw returns are predictable while this benchmark's abnormal mean is zero. Data on returns alone cannot establish that the chosen benchmark correctly measures risk.`,
      caption: String.raw`**Weak:** lagged autocorrelations of ten real monthly U.S. industry portfolios, July 1963–August 2026, with a pointwise white-noise reference band. These are later data, not Fama's original stock-level results. **Semi-strong:** an authored split-response diagram; its weighted post-event mean is flat by construction for every weight. **Strong:** an authored Gaussian fund experiment with known noise, fees and assigned skill; its statistics are z scores. **Joint hypothesis:** independently change return predictability and the assumed risk benchmark, and compare conditional means and abnormal returns. Only the first tab contains empirical observations.`,
      deps: ['fin-5.1', 'prob-4.1.14'],
      see: ['fin-5.2', 'fin-5.4', 'fin-5.5'],
      refs: ['Fama (1970), §§I–II, pp.383–388; §IV, pp.413–416'],
      tags: ['efficient markets', 'fair game', 'joint hypothesis'],
      credit: 'Eugene F. Fama, 1970',
      scope: String.raw`A historical literature review. The later industry data and three authored illustrations do not reproduce the paper's empirical tables. The autocorrelation band is an asymptotic pointwise white-noise reference, without multiple-comparison or heteroskedasticity adjustment. Fund performance against an assumed benchmark cannot test every private-information strategy. A flat aggregate event response and a zero conditional abnormal mean in the toy models hold by construction, not as empirical findings.`,
      verify: false,
      links: { doi: 'https://doi.org/10.1111/j.1540-6261.1970.tb00518.x', source: 'https://people.hec.edu/rosu/wp-content/uploads/sites/43/2023/09/Fama-Efficient-capital-markets-1970.pdf' },
      viz(v) {
        const d = data(), n = d.n;
        const tab = v.select('form', [{ value: 'weak', label: 'weak' }, { value: 'semi', label: 'semi-strong' }, { value: 'strong', label: 'strong' }, { value: 'joint', label: 'joint hypothesis' }], 'weak');
        const lag = v.slider('lag $k$ (months)', 1, 12, 1, { int: true });
        const up = v.slider('weight of dividend-increase group (authored)', 0, 1, 0.7, { step: 0.05, fmt: x => pct(x, 0) });
        const skill = v.slider('assigned skilled-fund share', 0, 0.3, 0, { step: 0.01, fmt: x => pct(x, 0) });
        const beta = v.slider('return predictability β (percentage points)', 0, 4, 2, { step: 0.1 });
        const gamma = v.slider('risk-benchmark slope γ (percentage points)', 0, 4, 2, { step: 0.1 });
        let seed = 3, cache, cacheKey; const resample = v.button('Resample funds', () => { seed++; });
        const W = v.stage({ x: [0.4, 10.6], y: [-0.2, 0.2], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'industry portfolio', ylabel: 'sample autocorrelation', xticks: IND_NAMES.map((s, i) => [i + 1, s]), title: 'monthly industry returns, 1963–2026 (real)' });
        const S = v.stage({ x: [-33, 33], y: [-3, 33], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'months from split', ylabel: 'chosen abnormal level (percentage points)', title: 'weighted split response (authored diagram)' });
        const F = v.stage({ x: [-6, 8], y: [-0.01, 0.35], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'z score (known noise standard deviation)', ylabel: 'sample share per bin', title: '400 funds, 10 years (authored Gaussian model)' });
        const J = v.stage({ x: [-1.6, 1.6], y: [-5, 6], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'observed predictor x', ylabel: 'return (percentage points)', xticks: [[-1, '−1'], [1, '+1']], title: 'conditional mean versus chosen risk benchmark' });
        const sets = { weak: W, semi: S, strong: F, joint: J }; let st = {};
        v.render(() => {
          for (const k in sets) sets[k].el.style.display = k === tab.value ? '' : 'none';
          lag.el.hidden = tab.value !== 'weak'; up.el.hidden = tab.value !== 'semi'; skill.el.hidden = resample.hidden = tab.value !== 'strong'; beta.el.hidden = gamma.el.hidden = tab.value !== 'joint';
          if (tab.value === 'weak') {
            const band = 1.96 / Math.sqrt(n), vals = d.ind.map(s => acf(s, lag.value)), extent = Math.max(0.15, band * 1.4, ...vals.map(x => Math.abs(x) * 1.2));
            W.setView([0.4, 10.6], [-extent, extent]);
            W.hband(-band, band, { color: 'muted', alpha: 0.18 }); W.hline(0, { color: 'faint' });
            W.bars(vals, { x0: 1, dx: 1, color: q => Math.abs(q) > band ? 'orange' : 'accent' });
            st = { vals, band, out: vals.filter(q => Math.abs(q) > band).length, mx: Math.max(...vals.map(Math.abs)) };
            v.legend([['accent', 'within pointwise reference band'], ['orange', 'outside pointwise reference band'], ['muted', '±1.96/√n white-noise reference']]);
          } else if (tab.value === 'semi') {
            st = splitIllustration(up.value);
            S.vline(0, { color: 'faint', dash: true });
            S.path(st.increase, { color: 'green', width: 2 }); S.path(st.decrease, { color: 'red', width: 2, dash: true }); S.path(st.aggregate, { color: 'accent', width: 3 });
            v.legend([['green', 'increase group'], ['red', 'decrease group'], ['accent', 'weighted mean (flat by construction)']]);
          } else if (tab.value === 'strong') {
            const key = `${seed}|${skill.value}`;
            if (cacheKey !== key) { const R = rng(seed * 17); cache = fundIllustration(R, () => R.normal(), skill.value); cacheKey = key; }
            st = cache;
            const nullMean = -0.8 / st.standardError, peak = Math.max(...st.bins.map(q => q / st.count), normPdf(nullMean, nullMean, 1) * st.width), top = peak * 1.2;
            F.setView([st.lo, st.hi], [-0.06 * top, top]);
            F.rect(1.96, 0, st.hi, top, { fill: 'green', fillAlpha: 0.08, stroke: false });
            st.bins.forEach((q, k) => F.rect(st.lo + k * st.width, 0, st.lo + (k + 1) * st.width, q / st.count, { fill: 'accent', fillAlpha: 0.5, stroke: false }));
            F.fn(x => normPdf(x, nullMean, 1) * st.width, { domain: [st.lo, st.hi], color: 'muted', width: 1.8, dash: true });
            v.legend([['accent', 'all 400 sampled scores'], ['muted', 'unskilled Gaussian density × bin width'], ['green', 'positive rejection region z > 1.96']]);
          } else {
            st = benchmarkExperiment(beta.value, gamma.value);
            const ys = st.conditional.flatMap(q => [q.mean, q.benchmark, q.alpha]), lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), pad = Math.max(0.5, 0.15 * (hi - lo));
            J.setView([-1.6, 1.6], [lo - pad, hi + pad]); J.hline(0, { color: 'faint' });
            for (const q of st.conditional) {
              J.rect(q.x - 0.28, 0, q.x - 0.03, q.mean, { fill: 'accent', fillAlpha: 0.6, stroke: false });
              J.rect(q.x + 0.03, 0, q.x + 0.28, q.benchmark, { fill: 'orange', fillAlpha: 0.6, stroke: false });
              J.dot(q.x, q.alpha, { color: 'red', r: 5 });
            }
            v.legend([['accent', 'true conditional mean μ + βx'], ['orange', 'chosen benchmark μ + γx'], ['red', 'conditional abnormal mean (β − γ)x']]);
          }
        });
        v.readout(() => ({
          weak: () => `n = ${n} months per industry. Lag ${lag.value}: ${st.out}/10 sample autocorrelations outside ±${v.fix(st.band, 3)}; largest absolute value ${v.fix(st.mx, 3)}. This is an asymptotic pointwise white-noise reference, not a simultaneous 95% band for 10 industries or 120 industry/lag comparisons. Serial dependence, changing variance and risk compensation require further modeling; the chart supplies no efficiency verdict.`,
          semi: () => `Chosen pre-event increase = 27 percentage points; aggregate post-event change = 0 by construction. At every date, mean = ${v.fix(up.value, 2)} × increase-group level + ${v.fix(1 - up.value, 2)} × decrease-group level. A group with zero weight is a counterfactual curve. The shape and magnitudes are authored, not the original study's observations or estimates.`,
          strong: () => `${st.bins.reduce((a, b) => a + b, 0)}/${st.count} sampled z scores counted; ${st.skilled} assigned skilled funds. Assumed annual net alpha: unskilled −0.8%, skilled +3%; known annual noise σ = 4%, 10 independent Gaussian years, standard error ${v.fix(st.standardError, 3)} percentage points. ${st.hits}/${st.count} exceed z = 1.96. This is the positive half of a two-sided 5% rule (2.5% positive tail under zero net alpha). With the −0.8% fee and no skill, the model expects ${v.fix(st.count * 0.5 * v.M.erfc((1.96 + 0.8 / st.standardError) / Math.SQRT2), 2)} positive rejections. Random winners and the assigned skill mix cannot prove or disprove all-information efficiency.`,
          joint: () => `Four equiprobable states: r = 0.5 + βx + 1.5ε; x and ε are independent signs. For h = x, expected raw return = ${v.fix(st.rawRule, 2)}, benchmark compensation = ${v.fix(st.benchmarkRule, 2)}, abnormal gain = ${v.fix(st.abnormalRule, 2)} percentage points. ${Math.abs(st.abnormalRule) < 1e-12 ? 'The chosen benchmark has zero conditional abnormal means even when raw returns are predictable.' : 'Conditional abnormal means are nonzero under this chosen benchmark.'} Subtracting the true conditional mean always gives zero; whether γ is the right risk adjustment is an additional economic assumption.`,
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
