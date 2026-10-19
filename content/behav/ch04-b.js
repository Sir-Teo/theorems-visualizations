// Behavioural Economics — Chapter 4, part b: items 4.5–4.7 (house money and break-even, narrow bracketing, transaction utility).
//
// Sources checked (Oct 2026):
// - Thaler & Johnson 1990 (Management Science 36: 643–660), Table 4 (Experiment 4, real money, two-stage vs one-stage
//   versions, N = 95 and 111): percent risk-seeking after prior outcomes +\$15, \$0, −\$2.25, −\$7.50 with a 50-50 gamble of
//   ±\$4.50 (first row) or ±\$2.25 (others): 77/41/69/40 (two-stage) and 44/50/87/77 (one-stage). Read in a full-text copy.
//   The abstract (via IDEAS/RePEc) states the house-money and break-even effects. Later work (Peng, Miao & Xiao 2013, Judgment and
//   Decision Making 8: 150–160, "Why are gainers more risk seeking") reports that some framings do not produce a house-money effect;
//   only the title and a search snippet were read.
// - Samuelson1963 complete original reprint, §§1–7; Read, Loewenstein & Rabin1999 complete PDF,
//   relevant risk-aggregation discussion pp179–181; Thaler1985 complete PDF, §§3.1–3.2 pp205–207.
//   Original beer medians2.65/1.50 verified; model weights are illustrative. See docs/verification/behav-source-review.md.
import { clamp, num, pct, usdC, usdR, vPT, wilson, errBar, bundle, bundleValue, bundleLossProb } from './ch04.shared.js';

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
      statement: String.raw`**Narrow bracketing** is evaluating each decision on its own rather than as part of the portfolio of decisions it belongs to. Samuelson (1963) reported a colleague who refused a single 50-50 bet to win \$200 or lose \$100, though the bet has positive expected value, but said he would take 100 such bets. The 100 bets together have expected gain \$5,000 and, because $\Pr(\text{total}<0)=\Pr(\text{wins}\le 33)$, a loss probability below 0.1%; this motivates comparing separate and joint evaluation. Refusal at one wealth level alone does not prove an expected-utility inconsistency: Samuelson’s theorem assumes refusal at every attainable wealth. With the prospect-theory value function, a sufficiently loss-averse person may reject each separate bet while accepting some bundles; the sign depends on the selected parameters and need not change monotonically with $n$.`,
      scope: String.raw`Applies when decisions are made one by one, and when they could be combined but the decision maker does not. Read, Loewenstein and Rabin (1999, pp. 179–181) discuss risk aggregation and give a worked loss-aversion example. The first accepted bundle here depends on assumed parameters $\alpha$ and $\lambda$.`,
      idea: String.raw`Aggregation reduces risk: the total of $n$ independent bets has mean $50n$ dollars and standard deviation growing only like $\sqrt n$, so the chance of a net loss tends to zero by the variance-bound weak law (prob-2.2.6). A loss-averse value function (behav-2.2) penalizes the possibility of loss at the level of the evaluated prospect; evaluated alone, one bet has a 50% chance of a loss and may be rejected, while a large bundle has a small loss probability. Myopic loss aversion (behav-2.12) is the same mechanism applied to the frequency of evaluating returns.`,
      caption: String.raw`Slide the **number of bets $n$** (each wins \$200 or loses \$100 with probability 1/2). Left: the distribution of the total, losses in red. Middle: the value of the prospect for the narrow evaluator, who values each bet alone ($n\,V_1$), and for the broad one who values the total ($V_n$). Right: the chance of ending in loss. The value function uses $\alpha$ and $\lambda$ from the sliders (defaults are the median Tversky–Kahneman estimates, an assumption).`,
      deps: ['behav-4.1', 'behav-2.12', 'prob-2.2.6'], refs: ['Kahneman ch. 31'], tags: ['bracketing', 'loss aversion', 'portfolio'],
      see: ['behav-1.8', 'behav-3.9'],
      credit: 'Samuelson, 1963; Read, Loewenstein & Rabin, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Choice_bracketing' },
      viz(v) {
        const W = 200, L = 100;
        const nS = v.slider('number of bets $n$', 1, 100, 1, { step: 1, int: true });
        const aS = v.slider('curvature $\\alpha$', 0.5, 1, 0.88, { step: 0.01 });
        const lS = v.slider('loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const A = v.stage({ x: [-110, 210], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'total net result (hundreds of dollars)', ylabel: 'probability', title: 'distribution of the total' });
        const B = v.stage({ x: [1, 100], y: [-100, 100], axes: 'box', gutter: true, xlog: true, height: 300, xlabel: 'number of bets n', ylabel: 'value', title: 'value of the prospect' });
        const C = v.stage({ x: [1, 100], y: [0, 0.5], axes: 'box', gutter: true, xlog: true, height: 300, xlabel: 'number of bets n', ylabel: 'P(net loss)', title: 'chance of ending in a loss' });
        v.legend([['red', 'ends in a loss'], ['green', 'ends in a gain'], ['purple', 'narrow: $n\\,V_1$'], ['blue', 'broad: $V_n$']]);
        let cache = { key: '', Vn: [], nstar: null };
        const calc = () => {
          const a = aS.value, l = lS.value, key = a + ',' + l;
          if (cache.key !== key) {
            const Vn = [null], Ls = [null];
            let nstar = null;
            for (let n = 1; n <= 100; n++) { Vn.push(bundleValue(n, W, L, a, l)); Ls.push(bundleLossProb(n, W, L)); if (nstar == null && Vn[n] > 0) nstar = n; }
            cache = { key, Vn, Ls, nstar };
          }
          return cache;
        };
        v.render(() => {
          const n = nS.value, { Vn, Ls, nstar } = calc();
          const d = bundle(n, W, L), bw = Math.max(1, (W + L) / 2) * 0.9; // bar width: spacing is 3 per win (300 per win in dollars)
          const scale = 100; // dollars per x unit
          const maxP = Math.max(...d.map((o) => o.p));
          A.setView([-L * n / scale - 1.5 * 3 - 2, W * n / scale + 3 + 2], [0, maxP * 1.15]);
          const half = 1.5;
          d.forEach((o) => A.rect(o.total / scale - half, 0, o.total / scale + half, o.p, { fill: o.total < 0 ? 'red' : 'green', fillAlpha: 0.65, stroke: false }));
          A.vline(0, { color: 'ink', width: 1.4 });
          const mean = (0.5 * W - 0.5 * L) * n / scale;
          A.vline(mean, { color: 'gold', width: 1.4, dash: [4, 4] }); A.text('mean', mean, maxP * 1.15, { dx: 4, dy: 12, size: 11, color: 'gold', weight: 700 });
          // value curves
          const nar = [], bro = [];
          for (let k = 1; k <= 100; k++) { nar.push([k, k * Vn[1]]); bro.push([k, Vn[k]]); }
          const top = Math.max(60, ...bro.map(p => p[1]), ...nar.map(p => p[1])) * 1.1, bot = Math.min(-60, ...nar.map(p => p[1]), ...bro.map(p => p[1])) * 1.1;
          B.setView([1, 100], [bot, top]);
          B.hline(0, { color: 'ink', width: 1.2 });
          B.path(nar, { color: 'purple', width: 2.4 }); B.path(bro, { color: 'blue', width: 2.4 });
          if (nstar) { B.vline(nstar, { color: 'green', width: 1.2, dash: [4, 4] }); B.text(`n* = ${nstar}`, nstar, top, { dx: 5, dy: 14, size: 11.5, weight: 800, color: 'green' }); }
          B.dot(n, n * Vn[1], { r: 6, color: 'purple' }); B.dot(n, Vn[n], { r: 6, color: 'blue' });
          const lp = []; for (let k = 1; k <= 100; k++) lp.push([k, Ls[k]]);
          C.path(lp, { color: 'red', width: 2.4 }); C.hline(0.5, { color: 'muted', width: 1, dash: [3, 3] });
          C.dot(n, Ls[n], { r: 6, color: 'red' });
        });
        v.readout(() => {
          const n = nS.value, { Vn, Ls, nstar } = calc();
          const totalMean = (0.5 * W - 0.5 * L) * n, sd = Math.sqrt(n) * (W + L) / 2;
          return `$n=${n}$: expected total ${usdR(totalMean)}, standard deviation ${usdR(sd)}, chance of a net loss **${(100 * Ls[n]).toFixed(Ls[n] < 0.01 ? 3 : 1)}%**. The narrow evaluator's value ${v.fix(n * Vn[1], 1)} ${Vn[1] < 0 ? '(rejects every bet)' : ''}; the broad evaluator's value ${v.fix(Vn[n], 1)} (${Vn[n] > 0 ? 'accepts' : 'rejects'}). ${nstar ? 'The first accepted bundle has $n^*=' + nstar + '$ bets; later acceptance need not be monotone.' : 'No bundle of up to 100 is accepted with these parameters.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Concept', name: 'Transaction utility and reference prices',
      statement: String.raw`Thaler (1985) splits the value of a purchase into two parts. **Acquisition utility** is the value $V$ of the good minus what is paid, $V-p$: the only part in standard theory. **Transaction utility** is the pleasure or pain of the deal itself, the gap between the **reference price** $r$ (what the buyer thinks the good should cost in that setting) and the price paid, $w\,\omega(r-p)$, with $\omega(z)=z$ for $z\ge0$ (a bargain) and $\omega(z)=\lambda z$ for $z<0$ (a rip-off, felt more strongly). The buyer buys iff $V-p+w\,\omega(r-p)\ge0$. Two identical goods sold in settings with different reference prices therefore command different prices: in Thaler's beer-on-the-beach question, the median willingness to pay was \$2.65 if the beer came from a fancy resort hotel and \$1.50 if it came from a small run-down grocery store.`,
      scope: String.raw`The decomposition is a model (Thaler's own formulation is more general). The medians come from a questionnaire given to executive-programme participants; the reference prices below are fitted to them with an assumed $V$.`,
      idea: String.raw`Standard theory says the price you are willing to pay is the value of the good to you, whatever the seller; the same \$2 should buy the same beer anywhere. Reference-dependent evaluation (behav-2.1) instead measures the price against an expectation set by the setting, so overpaying relative to the reference is a loss and underpaying a gain. An inflated reference price can therefore make a given selling price feel like a bargain (behav-4.1).`,
      caption: String.raw`Left: total utility of buying the beer at each price, in a hotel (reference price $r_h$) and in a grocery ($r_g$); the dots mark the maximum price each buyer would pay, which with the defaults reproduces the two reported medians. Drag the **price** handle to see the split into acquisition and transaction utility on the right. Set the weight $w$ on transaction utility to 0 and the two buyers become identical, the standard-theory case.`,
      deps: ['behav-4.1', 'behav-2.1'], refs: ['W&K ch. 6'], tags: ['transaction utility', 'reference price', 'mental accounting'],
      see: ['behav-4.3'],
      credit: 'Richard Thaler, 1985',
      links: { doi: 'https://doi.org/10.1287/mksc.4.3.199' },
      viz(v) {
        const Vs = v.slider('value of the beer $V$ (\\$)', 0.5, 4, 1.5, { step: 0.05 });
        const rh = v.slider('reference price at the resort hotel $r_h$', 1, 6, 3.8, { step: 0.05 });
        const rg = v.slider('reference price at the grocery $r_g$', 0.5, 4, 1.5, { step: 0.05 });
        const lam = v.slider('loss aversion $\\lambda$ for overpaying', 1, 4, 2.25, { step: 0.05 });
        const w = v.slider('weight $w$ on transaction utility', 0, 1, 1, { step: 0.05 });
        const A = v.stage({ x: [0, 6], y: [-4, 6], axes: true, height: 330, weight: 1.3, xlabel: 'price asked (dollars)', ylabel: 'total utility', title: 'utility of buying at each price' });
        const B = v.stage({ x: [0, 4], y: [-5, 3], axes: false, height: 330, title: 'acquisition + transaction utility at the price asked' });
        const price = A.handle(2.65, 0, { color: 'orange', r: 10, constrain: 'x' });
        v.legend([['blue', 'resort hotel'], ['teal', 'small grocery'], ['muted', 'acquisition utility V − p', { dash: true }]]);
        const om = (z) => (z >= 0 ? z : lam.value * z);
        const U = (p, r) => Vs.value - p + w.value * om(r - p);
        const wtp = (r) => v.M.bisect((p) => U(p, r), 0, 12, 1e-6);
        let st = {};
        v.render(() => {
          const refs = [rh.value, rg.value], extremes = refs.flatMap(r => [U(0,r), U(6,r)]);
          A.setView([0,6], [Math.min(-4, ...extremes)*1.1, Math.max(6, ...extremes)*1.1]);
          const parts=refs.flatMap(r=>[Vs.value-price.x,w.value*om(r-price.x),U(price.x,r)]), blo=Math.min(-5,...parts)*1.15,bhi=Math.max(3,...parts)*1.15; B.setView([0,4],[blo,bhi]);
          A.hline(0, { color: 'ink', width: 1 });
          A.fn((p) => Vs.value - p, { color: 'muted', width: 1.4, dash: [5, 4] });
          A.fn((p) => U(p, rh.value), { color: 'blue', width: 2.4, domain: [0, 6] });
          A.fn((p) => U(p, rg.value), { color: 'teal', width: 2.4, domain: [0, 6] });
          const wh = wtp(rh.value), wg = wtp(rg.value);
          A.dot(wh, 0, { r: 7, color: 'blue', label: `$${wh.toFixed(2)}`, labelPos: 'ne' });
          A.dot(wg, 0, { r: 7, color: 'teal', label: `$${wg.toFixed(2)}`, labelPos: 'nw' });
          price.set(clamp(price.x, 0, 6), 0);
          const p = price.x;
          A.vline(p, { color: 'orange', width: 1, dash: [3, 3] });
          // decomposition bars
          [[1, 'hotel', rh.value, 'blue'], [3, 'grocery', rg.value, 'teal']].forEach(([x, nm, r, col]) => {
            const acq = Vs.value - p, tr = w.value * om(r - p);
            B.rect(x - 0.7, 0, x - 0.05, acq, { fill: 'muted', fillAlpha: 0.55, color: 'muted', width: 1 });
            B.rect(x + 0.05, 0, x + 0.7, tr, { fill: col, fillAlpha: 0.6, color: col, width: 1 });
            B.line(x - 0.7, acq + tr, x + 0.7, acq + tr, { color: 'ink', width: 2.4 });
            B.text('acq.', x - 0.37, 0, { dy: acq >= 0 ? -12 : 14, align: 'center', size: 10.5, color: 'muted', weight: 700 });
            B.text('trans.', x + 0.37, 0, { dy: tr >= 0 ? -12 : 14, align: 'center', size: 10.5, color: col, weight: 700 });
            B.text(`${nm}: total ${(acq + tr >= 0 ? '+' : '−')}$${Math.abs(acq + tr).toFixed(2)}`, x, blo+(bhi-blo)*.04, { align: 'center', size: 11.5, weight: 800, color: acq + tr >= 0 ? 'green' : 'red' });
          });
          B.hline(0, { color: 'ink', width: 1 });
          st = { wh, wg, p };
        });
        v.readout(() => {
          const { wh, wg, p } = st; if (wh == null) return '';
          return `At ${usdR(p, 2)}: hotel buyer ${U(p, rh.value) >= 0 ? '**buys**' : '**refuses**'}, grocery buyer ${U(p, rg.value) >= 0 ? '**buys**' : '**refuses**'}. Maximum willingness to pay: **${usdR(wh, 2)}** (hotel) and **${usdR(wg, 2)}** (grocery), a difference of ${usdR(wh - wg, 2)} for the same beer; the reported medians are \\$2.65 and \\$1.50. With $w=0$ both would pay exactly the value $V$ = ${usdR(Vs.value, 2)}.`;
        });
      },
    },
  ],
};
