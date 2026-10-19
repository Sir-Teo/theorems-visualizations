// Behavioural Economics — Chapter 4, part b: items 4.5–4.7 (house money and break-even, narrow bracketing, transaction utility).
//
// Sources checked (Oct 2026):
// - Thaler & Johnson 1990 (Management Science 36: 643–660), Table 4 (Experiment 4, real money, two-stage vs one-stage
//   versions, N = 95 and 111): percent risk-seeking after prior outcomes +\$15, \$0, −\$2.25, −\$7.50 with a 50-50 gamble of
//   ±\$4.50 (first row) or ±\$2.25 (others): 77/41/69/40 (two-stage) and 44/50/87/77 (one-stage). Read in a full-text copy.
//   The abstract (via IDEAS/RePEc) states the house-money and break-even effects. Later work (Peng, Miao & Xiao 2013, Judgment and
//   Decision Making 8: 150–160, "Why are gainers more risk seeking") reports that some framings do not produce a house-money effect;
//   only the title and a search snippet were read.
// - For 4.6, read original Samuelson 1963 CAS reprint §§3–8 and Read–Loewenstein–Rabin 1999 author scan pp171–181.
//   Their p180 illustrative alpha=1/lambda=2.5 gives V1=-25 and V2=25; this is not an empirical parameter fit.
// - For 4.7, read original Thaler 1985 §3.1 pp205–207 and weighted-model footnote7 in the full UF faculty-hosted PDF.
//   Beer medians are $2.65/$1.50 from executive regular beer drinkers; the linear curves/reference parameters are authored.
import { clamp, usdR, wilson, errBar } from './ch04.shared.js';
import { bracketDistribution, bracketScenario, transactionParts, transactionWtp } from './source-audit-bracketing.js';

export default {
  collection: 'behav',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Phenomenon', name: 'House money and fungibility violations',
      statement: String.raw`If money is fungible, only the final wealth distribution matters, so a choice after a prior gain or loss should match the one-step choice with the same final outcomes. Thaler and Johnson (1990) found it does not. After a **prior gain** people become more willing to take a fair gamble (the **house-money effect**); after a **prior loss** they avoid fair gambles unless one of the outcomes lets them return to where they started, which makes that gamble especially attractive (the **break-even effect**). In their real-money Experiment 4, with a 50-50 gamble of $\pm\$4.50$ after winning \$15, 77% of 95 subjects gambled in the two-stage version, against 44% of 111 who chose between the same final wealths (\$15 for sure, or \$19.50 or \$10.50) in a one-stage version. After losing \$2.25 and facing $\pm\$2.25$, 69% gambled (a chance to break even); after losing \$7.50, only 40%.`,
      scope: String.raw`Small stakes, student subjects, and a hypothetical or modest-money setting; later studies report weaker or no house-money effects in some designs (for example Peng, Miao and Xiao, 2013). The break-even effect needs the break-even outcome to be within reach.`,
      idea: String.raw`The initial outcome is booked in an account that the next choice may or may not be merged with (behav-4.1). A prior gain acts as a cushion: a loss on the new bet is netted against the gain and so does not feel like a loss (the gamble is "played with the house's money"). A prior loss stays open, and a gamble that can close the account at zero is valued steeply by the kink at the reference point (behav-2.2, behav-2.3). The two-stage and one-stage versions end in identical wealth, so any gap between them is a violation of fungibility.`,
      caption: String.raw`Choose the **prior outcome**. Bars show the share who took the gamble in the two-stage (orange) and one-stage (blue) versions, with 95% Wilson intervals; the lower panel draws the final wealths, which are identical in both versions. Answer both versions yourself with the selectors. Data: Thaler and Johnson (1990), Table 4, rows 1-4.`,
      deps: ['behav-4.1'], refs: ['W&K ch. 6'], tags: ['house money', 'break-even', 'fungibility'],
      see: ['behav-2.11', 'behav-4.2'],
      credit: 'Thaler & Johnson, 1990',
      links: { doi: 'https://doi.org/10.1287/mnsc.36.6.643' },
      viz(v) {
        const ROWS = [
          { init: 15, g: 4.5, two: 77, one: 44 },
          { init: 0, g: 2.25, two: 41, one: 50 },
          { init: -2.25, g: 2.25, two: 69, one: 87 },
          { init: -7.5, g: 2.25, two: 40, one: 77 },
        ];
        const lab = (x) => (x < 0 ? '−' : '') + '$' + Math.abs(x).toFixed(2).replace(/\.00$/, '');
        const sel = v.select('prior outcome', ROWS.map((r, i) => ({ value: String(i), label: r.init > 0 ? 'won \\$15' : r.init === 0 ? 'nothing' : 'lost \\$' + Math.abs(r.init).toFixed(2) })), '0');
        const a2 = v.select('two-stage: take the coin flip?', [{ value: '-', label: '—' }, { value: 'y', label: 'flip' }, { value: 'n', label: 'keep' }], '-');
        const a1 = v.select('one-stage: which final wealth?', [{ value: '-', label: '—' }, { value: 'sure', label: 'the sure amount' }, { value: 'gamble', label: 'the 50-50 pair' }], '-');
        const A = v.stage({ x: [0, 4.6], y: [0, 100], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: 'prior outcome', ylabel: '% who gamble', title: 'Thaler & Johnson (1990), Table 4', xticks: [[0.9, '+$15'], [1.9, '$0'], [2.9, '−$2.25'], [3.9, '−$7.50']] });
        const W = v.stage({ x: [-14, 24], y: [0, 3], axes: false, height: 320, title: 'the same final wealth in both versions' });
        v.legend([['orange', 'two-stage version (N = 95)'], ['blue', 'one-stage version (N = 111)']]);
        let st = {};
        v.render(() => {
          const r = ROWS[+sel.value];
          ROWS.forEach((row, i) => {
            const x = i + 0.9, on = i === +sel.value;
            [[x - 0.2, row.two, 'orange', 95], [x + 0.2, row.one, 'blue', 111]].forEach(([bx, p, col, n]) => {
              A.rect(bx - 0.18, 0, bx + 0.18, p, { fill: col, fillAlpha: on ? 0.7 : 0.3, color: col, width: on ? 2 : 1 });
              const [lo, hi] = wilson(Math.round(p * n / 100), n);
              errBar(A, bx, lo * 100, hi * 100, { color: 'ink', cap: 0.06, width: 1.2 });
              A.text(p + '%', bx, p, { dy: -22, align: 'center', size: 11.5, weight: 800, color: col });
            });
          });
          A.hline(50, { color: 'muted', width: 1, dash: [4, 4] });
          // final wealth panel
          W.line(-12, 1.1, 22, 1.1, { color: 'faint', width: 1.4 });
          for (let t = -10; t <= 20; t += 5) { W.line(t, 1.1, t, 1.2, { color: 'faint' }); W.text(String(t).replace('-', '−'), t, 1.1, { dy: 14, align: 'center', size: 10.5, color: 'muted' }); }
          W.vline(0, { color: 'green', width: 1.4, dash: [4, 4] }); W.text('break even', 0, 3, { dx: 5, dy: 12, size: 11, color: 'green', weight: 700 });
          const lo = r.init - r.g, hi = r.init + r.g;
          W.arrow(r.init, 1.8, lo, 1.8, { color: 'red', width: 2 }); W.arrow(r.init, 1.8, hi, 1.8, { color: 'green', width: 2 });
          W.dot(r.init, 1.8, { r: 8, color: 'gold' }); W.text(`start ${lab(r.init)}`, r.init, 1.8, { dy: -18, align: 'center', size: 12, weight: 700, color: 'gold' });
          W.dot(lo, 1.1, { r: 7, color: 'red' }); W.dot(hi, 1.1, { r: 7, color: 'green' }); W.dot(r.init, 1.1, { r: 7, color: 'gold' });
          W.text(`${lab(lo)}`, lo, 1.8, { dy: 18, align: 'center', size: 12, weight: 700, color: 'red' });
          W.text(`${lab(hi)}`, hi, 1.8, { dy: 18, align: 'center', size: 12, weight: 700, color: 'green' });
          W.text(`two-stage: you hold ${lab(r.init)}, then a coin flip wins or loses ${r.g} dollars`, -13, 2.45, { size: 11.5, weight: 600, color: 'orange' });
          W.text(`one-stage: ${r.init} for sure, or ${hi} / ${lo} with equal chance (dollars)`.replace(/-/g, '−'), -13, 0.45, { size: 11.5, weight: 600, color: 'blue' });
          st = { r };
        });
        v.readout(() => {
          const r = st.r; if (!r) return '';
          const gap = r.two - r.one, you = a2.value !== '-' && a1.value !== '-' ? ((a2.value === 'y') === (a1.value === 'gamble') ? ' You chose consistently across the two versions.' : ' You chose differently in the two versions, as many subjects did.') : '';
          return `Two-stage ${r.two}% versus one-stage ${r.one}%: a gap of **${gap > 0 ? '+' : '−'}${Math.abs(gap)} points** between choices with identical final wealth (${usdR(r.init - r.g, 2)} or ${usdR(r.init + r.g, 2)}). ${r.init > 0 ? 'House money: more gambling after the gain.' : r.init === 0 ? 'No prior outcome: the versions are close.' : r.init + r.g >= 0 ? 'The gamble can reach break-even (\\$0): gambling is attractive in the two-stage form.' : 'The gamble cannot reach break-even: the loss stays open and few gamble.'}` + you;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Phenomenon', name: 'Narrow bracketing',
      statement: String.raw`**Narrow bracketing** evaluates choices separately; **broad bracketing** considers their combined consequences. Samuelson (1963) described a colleague who refused a fair-coin bet to win \$200 or lose \$100 but said he would accept 100 independent repetitions. The total has mean \$5,000 and loss probability about 0.0437%. That small probability alone is not an expected-utility argument: the maximum possible loss and absolute standard deviation grow with the number of bets.

The picture uses an explicitly specified ordinary-probability value model,
$$v(x)=\begin{cases}x^\alpha,&x\ge0,\\-\lambda(-x)^\alpha,&x<0.\end{cases}$$
A narrow evaluator assigns $nV_1$ to $n$ isolated bets; a broad evaluator assigns $V_n=E[v(S_n)]$ to their total. One bet is rejected exactly when $\lambda>2^\alpha$ (and is indifferent at equality). The model can prefer a bundle while rejecting its pieces, but acceptance need not be monotone in the integer $n$.`,
      scope: String.raw`These curves are a teaching calculation, not measured acceptance frequencies or an estimate of Samuelson's colleague's preferences. Defaults $\alpha=1$, $\lambda=2.5$ reproduce Read–Loewenstein–Rabin's (1999, p. 180) illustrative values $V_1=-25$, $V_2=25$. The broad evaluator applies $v$ to the net total at one fixed reference; the narrow evaluator resets that reference for each piece. A one-bet rejection at the initial reference alone does not rule out bundle acceptance under expected utility.`,
      idea: String.raw`For $K_n\sim\operatorname{Binomial}(n,1/2)$, $S_n=300K_n-100n$ dollars. Thus $ES_n=50n$ dollars and $\operatorname{sd}(S_n)=150\sqrt n$ dollars; the standard deviation of the **average** is $150/\sqrt n$. The finite-variance weak law (prob-2.2.3) gives $S_n/n\to50$ in probability, so $P(S_n<0)\to0$. Absolute risk does not shrink, and finite loss probabilities can jump: $P(S_3<0)=1/8$, while $P(S_4<0)=5/16$.

Samuelson's theorem has a stronger premise than rejecting one bet at today's wealth: if the expected utility of a single bet is no better than abstention **at every wealth level reachable within the specified range**, then no finite independent sequence staying in that range improves expected utility. Rejection only at the initial wealth does not establish that premise.`,
      caption: String.raw`Choose an integer number of independent bets. **Left:** exact binomial probabilities of dollar totals, red for a net loss and green for zero or a gain. **Middle:** ordinary-probability values $nV_1$ (purple) and $V_n$ (blue); the broad-value marker is hollow so coincident predictions remain visible. **Right:** the exact chance of a strictly negative total. Lines connect discrete integer cases. The green line marks the **first** accepted bundle within 1–100, not a permanent threshold. The readout lists all accepted ranges in that finite window.

Try $\alpha=0.5$, $\lambda=4$: three bets are accepted and four rejected. With $\lambda=1$ a single favorable bet can already be attractive, so the narrow line need not fall. Parameters are assumptions; no probability weighting is used.`,
      deps: ['behav-4.1', 'prob-2.2.3'], refs: ['Samuelson (1963), §§3–8', 'Read, Loewenstein & Rabin (1999), §§2.1 and 3.1, pp. 174–180'], tags: ['bracketing', 'loss aversion', 'portfolio'],
      see: ['behav-1.8', 'behav-3.9', 'behav-2.12'],
      credit: 'Samuelson, 1963; Read, Loewenstein & Rabin, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Choice_bracketing' },
      verify: false,
      viz(v) {
        const nS = v.slider('number of independent bets $n$', 1, 100, 2, { step: 1, int: true });
        const aS = v.slider('curvature $\\alpha$', 0.5, 1, 1, { step: 0.01 });
        const lS = v.slider('loss aversion $\\lambda$', 1, 4, 2.5, { step: 0.05 });
        v.button('Read et al. example: α = 1, λ = 2.5', () => { nS.set(2); aS.set(1); lS.set(2.5); });
        const A = v.stage({ x: [-500, 800], y: [-0.03, 0.6], axes: 'box', gutter: true, height: 340, minWidth: 270, weight: 1.2, xlabel: 'total net result (dollars)', ylabel: 'probability mass', title: 'exact distribution of the total' });
        const B = v.stage({ x: [0.7, 145], y: [-100, 100], axes: 'box', gutter: true, xlog: true, height: 340, minWidth: 270, xlabel: 'number of bets n (integer)', ylabel: 'value (model units)', title: 'separate versus combined evaluation' });
        const C = v.stage({ x: [0.7, 145], y: [-0.06, 0.59], axes: 'box', gutter: true, xlog: true, height: 340, minWidth: 270, xlabel: 'number of bets n (integer)', ylabel: 'P(total < 0)', title: 'loss chance can jump at small n' });
        v.legend([['red', 'net loss / loss probability'], ['green', 'nonnegative total / first accepted n'], ['purple', 'narrow value nV₁'], ['blue', 'broad value Vₙ', { dot: true }]]);
        let cached = null;
        const calc = () => {
          const key = aS.value + ',' + lS.value;
          if (cached?.key !== key) cached = { ...bracketScenario(aS.value, lS.value), key };
          return cached;
        };
        v.render(() => {
          const n = nS.value, m = calc(), d = bracketDistribution(n), maxP = Math.max(...d.map(o => o.probability));
          const dollarMargin = Math.max(250, 0.08 * 300 * n);
          A.setView([-100 * n - dollarMargin, 200 * n + dollarMargin], [-0.07 * maxP, 1.24 * maxP]);
          d.forEach(o => A.rect(o.total - 125, 0, o.total + 125, o.probability, { fill: o.total < 0 ? 'red' : 'green', fillAlpha: 0.65, stroke: false }));
          A.vline(0, { color: 'ink', width: 1.2 }); A.vline(50 * n, { color: 'gold', width: 1.4, dash: true });
          A.text('mean', 50 * n, maxP, { dx: 5, dy: -10, size: 11, color: 'gold', weight: 700 });
          const nar = m.rows.map(r => [r.n, r.n * m.singleValue]), bro = m.rows.map(r => [r.n, r.value]);
          const vals = [0, ...nar.map(p => p[1]), ...bro.map(p => p[1])], lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi - lo);
          B.setView([0.7, 145], [lo - 0.14 * span, hi + 0.14 * span]); B.hline(0, { color: 'ink', width: 1.2 });
          B.path(nar, { color: 'purple', width: 2.4 }); B.path(bro, { color: 'blue', width: 2.4 });
          if (m.firstAccepted !== null) B.vline(m.firstAccepted, { color: 'green', width: 1.2, dash: true });
          B.dot(n, n * m.singleValue, { r: 6, color: 'purple' }); B.dot(n, m.rows[n - 1].value, { r: 8, color: 'blue', hollow: true });
          C.path(m.rows.map(r => [r.n, r.lossProbability]), { color: 'red', width: 2.4 }); C.hline(0.5, { color: 'muted', width: 1, dash: true }); C.dot(n, m.rows[n - 1].lossProbability, { r: 6, color: 'red' });
        });
        v.readout(() => {
          const n = nS.value, m = calc(), r = m.rows[n - 1], name = d => d > 0 ? 'accepts' : d < 0 ? 'rejects' : 'indifferent';
          const ranges = m.ranges.map(([a, b]) => a === b ? String(a) : a + '–' + b).join(', ');
          return `n = ${n}: mean ${usdR(r.mean)}, absolute standard deviation ${usdR(r.sd, 2)}, maximum possible loss ${usdR(100 * n)}; strict loss probability ${(100 * r.lossProbability).toFixed(4)}%.\nNarrow value ${v.fix(n * m.singleValue, 3)} (${name(m.singleDecision)} each bet); broad value ${v.fix(r.value, 3)} (${name(r.decision)}).\nAccepted integer n within 1–100: ${ranges || 'none'}. ${m.firstAccepted === null ? 'No first accepted bundle in this finite window.' : 'First accepted n = ' + m.firstAccepted + '; this alone does not imply acceptance at every larger n.'} Equality is classified as indifferent (relative numerical tolerance 10⁻¹²).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Concept', name: 'Transaction utility and reference prices',
      statement: String.raw`Thaler (1985, §3.1) separates **acquisition utility** from **transaction utility**: the value of receiving the good relative to its cost, and the perceived merits of the deal relative to an expected or fair price. In his beer-on-the-beach questionnaire, executive-program participants who were regular beer drinkers reported median willingness to pay of \$2.65 for beer bought at a resort hotel and \$1.50 for the same beer bought at a small run-down grocery. Consumption remained on the beach; no hotel atmosphere or bargaining was part of the scenario.

Here an **authored piecewise-linear illustration**, rather than Thaler's full value-function model, uses
$$U(p;r)=V-p+w\,\omega(r-p),$$
$$\omega(z)=\begin{cases}z,&z\ge0,\\\lambda z,&z<0.\end{cases}$$
The buyer buys when $U\ge0$. Parameters $V,r,w,\lambda$ are assumptions. With positive $V,r$, $w\ge0$ and $\lambda\ge1$, this continuous strictly decreasing function has a unique zero, the model's maximum willingness to pay.`,
      scope: String.raw`The two historical questionnaire medians are empirical references, not observed reference prices. The defaults choose $V=1.50$, $w=1$, $r_h=3.80$ and $r_g=1.50$ to reproduce them; they do not identify or estimate those parameters. Thaler's original Eq. 2 uses more general acquisition/reference-dependent value functions and discusses a transaction-utility weight in footnote 7. Changing the sliders changes only this illustration.`,
      idea: String.raw`If $V\le r$, the zero lies on the bargain branch and
$$p^*(r)=\frac{V+wr}{1+w}.$$
If $V\ge r$, it lies on the overpayment branch and
$$p^*(r)=\frac{V+w\lambda r}{1+w\lambda}.$$
Both formulas give $r$ at $V=r$, and $V$ when $w=0$. Thus different assumed reference prices can yield different reservation prices even with the same consumption value. The construction illustrates Thaler's distinction; the two medians alone cannot determine a unique decomposition.`,
      caption: String.raw`**Left:** model total utility against asked price in the hotel and grocery settings; dots and labels show the **calculated** willingness to pay. Drag the orange handle or set the asked-price slider. The complete price domain is 0–6 dollars, and ranges include all model values. If $w=0$, both curves and reservation prices coincide.

**Right:** acquisition value (gray), weighted transaction value (the setting's color) and their sum (horizontal black line) at the chosen price. All signs and extreme values remain visible. With the defaults, the model reproduces the historical \$2.65/\$1.50 medians; other settings are not additional empirical results.`,
      deps: ['behav-4.1', 'behav-2.1'], refs: ['Thaler (1985), §3.1, pp. 205–207 and footnote 7'], tags: ['transaction utility', 'reference price', 'mental accounting'],
      see: ['behav-4.3'],
      credit: 'Richard Thaler, 1985; authored linear illustration',
      verify: false,
      links: { doi: 'https://doi.org/10.1287/mksc.4.3.199' },
      viz(v) {
        const Vs = v.slider('consumption value $V$ (dollars)', 0.5, 4, 1.5, { step: 0.05 });
        const rh = v.slider('assumed hotel reference $r_h$', 1, 6, 3.8, { step: 0.05 });
        const rg = v.slider('assumed grocery reference $r_g$', 0.5, 4, 1.5, { step: 0.05 });
        const lam = v.slider('overpayment loss multiplier $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const w = v.slider('transaction weight $w$', 0, 1, 1, { step: 0.05 });
        const asked = v.slider('asked price (dollars)', 0, 6, 2.65, { step: 0.05, fmt: x => '$' + x.toFixed(2) });
        const A = v.stage({ x: [-0.5, 6.5], y: [-12, 8], axes: 'box', gutter: true, height: 350, minWidth: 290, weight: 1.3, xlabel: 'asked price p (dollars)', ylabel: 'total value (model units)', title: 'authored acquisition + transaction model' });
        const B = v.stage({ x: [0, 4], y: [-8, 8], axes: false, height: 350, minWidth: 270, title: 'components at the asked price' });
        const params = () => ({ value: Vs.value, lambda: lam.value, weight: w.value });
        const show = (x, digits = 3) => (Math.abs(x) < 1e-10 ? 0 : x).toFixed(digits);
        const price = A.handle(2.65, 0, { color: 'orange', r: 9, constrain: x => [clamp(x, 0, 6), 0] });
        price.onDrag = () => asked.set(price.x);
        v.legend([['blue', 'hotel total / transaction value'], ['teal', 'grocery total / transaction value'], ['muted', 'acquisition value V − p', { dash: true }], ['ink', 'sum of components']]);
        v.render(() => {
          const o = params(), p = asked.value, refs = [rh.value, rg.value], U = (x, r) => transactionParts(x, r, o).total;
          const ys = [0, o.value, o.value - 6, ...refs.flatMap(r => [U(0, r), U(6, r)])], lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(1, hi - lo);
          A.setView([-0.5, 6.5], [lo - 0.16 * span - 0.1, hi + 0.16 * span + 0.1]); A.hline(0, { color: 'ink', width: 1 });
          A.fn(x => o.value - x, { color: 'muted', width: 1.4, dash: true, domain: [0, 6] });
          A.fn(x => U(x, rh.value), { color: 'blue', width: 2.4, domain: [0, 6] }); A.fn(x => U(x, rg.value), { color: 'teal', width: 2.4, domain: [0, 6] });
          const wh = transactionWtp(rh.value, o), wg = transactionWtp(rg.value, o);
          A.dot(wh, 0, { r: 6, color: 'blue' }); A.dot(wg, 0, { r: 8, color: 'teal', hollow: true });
          A.text('hotel $' + wh.toFixed(2), wh, 0, { dy: -20, align: 'center', size: 11.5, color: 'blue', weight: 700 });
          A.text('grocery $' + wg.toFixed(2), wg, 0, { dy: 24, align: 'center', size: 11.5, color: 'teal', weight: 700 });
          price.set(p, 0); A.vline(p, { color: 'orange', width: 1, dash: true });
          const parts = refs.map(r => transactionParts(p, r, o)), bs = [0, ...parts.flatMap(c => [c.acquisition, c.transaction, c.total])], blo = Math.min(...bs), bhi = Math.max(...bs), bspan = Math.max(1, bhi - blo);
          B.setView([0, 4], [blo - 0.48 * bspan, bhi + 0.28 * bspan]);
          [[1, 'hotel', parts[0], 'blue'], [3, 'grocery', parts[1], 'teal']].forEach(([x, name, c, color]) => {
            B.rect(x - 0.7, 0, x - 0.05, c.acquisition, { fill: 'muted', fillAlpha: 0.55, color: 'muted', width: 1 });
            B.rect(x + 0.05, 0, x + 0.7, c.transaction, { fill: color, fillAlpha: 0.6, color, width: 1 });
            B.line(x - 0.7, c.total, x + 0.7, c.total, { color: 'ink', width: 2.4 });
            B.text('acq.', x - 0.37, c.acquisition, { dy: c.acquisition >= 0 ? -10 : 20, align: 'center', size: 10.5, color: 'muted', weight: 700 });
            B.text('deal', x + 0.37, c.transaction, { dy: c.transaction >= 0 ? -10 : 20, align: 'center', size: 10.5, color, weight: 700 });
            B.text(name + ': total ' + show(c.total, 2), x, blo - 0.31 * bspan, { align: 'center', size: 11.5, color: c.total >= 0 ? 'green' : 'red', weight: 700 });
          }); B.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const o = params(), p = asked.value, h = transactionParts(p, rh.value, o), g = transactionParts(p, rg.value, o), wh = transactionWtp(rh.value, o), wg = transactionWtp(rg.value, o);
          return `Asked ${usdR(p, 2)}: hotel ${h.total >= -1e-10 ? 'buys' : 'refuses'}, grocery ${g.total >= -1e-10 ? 'buys' : 'refuses'} (numerical zero tolerance 10⁻¹⁰). Model willingness to pay: hotel ${usdR(wh, 2)}, grocery ${usdR(wg, 2)}.\nHotel: acquisition ${show(h.acquisition)} + deal ${show(h.transaction)} = ${show(h.total)}; grocery: acquisition ${show(g.acquisition)} + deal ${show(g.transaction)} = ${show(g.total)}.\nHistorical questionnaire medians: \\$2.65 / \\$1.50; reference-price sliders are assumed, not observed. ${w.value === 0 ? 'At w = 0 both reservation prices equal V.' : 'The curve and decomposition are authored assumptions.'}`;
        });
      },
    },
  ],
};
