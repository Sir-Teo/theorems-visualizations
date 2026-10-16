// Behavioural Economics — Chapter 2: Prospect theory and reference dependence (items 2.1–2.6; 2.7–2.12 in ch02-b.js,
// the 1979 paper 2.13 in ch02-papers.js)
//
// Sources checked (Oct 2026):
// - Tversky & Kahneman 1992, J. Risk Uncertainty 5: 297–323 (scanned text): 25 subjects; Table 3 median cash equivalents of
//   all two-outcome nonmixed prospects (e.g. (0, 100): .05 → 14, .25 → 25, .50 → 36, .75 → 52, .95 → 78; (0, −100): −8,
//   −23.5, −42, −63, −84); Table 4 (risk seeking 78% for low-probability gains, risk averse 88% for high-probability gains,
//   80% for low-probability losses, risk seeking 87% for high-probability losses; the whole fourfold pattern in 22 of 25
//   subjects); Table 6 (mixed prospects acceptable when the gain was 61, 101, 202, 280 against losses of 25, 50, 100, 150);
//   median estimates α = β = 0.88, λ = 2.25, γ = 0.61, δ = 0.69.
// - Brown, Imai, Vieider & Camerer 2024, J. Econ. Literature 62 (2): 485–516: mean λ 1.955, 95% interval [1.82, 2.10],
//   607 estimates from 150 articles (abstract). Walasek, Mullett & Stewart 2024, J. Econ. Psychology 103: 102740:
//   λ = 1.31, 95% CI [1.10, 1.53] (abstract).
// - Kahneman & Tversky 1979: Problems 1 and 2 (N = 72; 82% and 83%), as checked for ch02-papers.js.
// - Prelec 1998 (Econometrica 66: 497–527): w(p) = exp(−(−ln p)^a), fixed point 1/e (a property of the formula).
// - Not verified (quoted from Kahneman 2011, ch. 25, via secondary summaries): the Anthony-and-Betty and Jack-and-Jill
//   stories; summaries disagree on whether Jack and Jill have 4 or 5 million today, so the text gives no figure.
import { clamp, inside, num, pct, usdC, usdR, wTK, wPrelec, vPT, vInv, TK92, cptValue, cptWeights, cptCE, EV, fixedPoint, golden, card, hbars, halves } from './ch02.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

/** CRRA utility of wealth; ρ = 1 is the logarithm. */
const crra = (w, r) => (Math.abs(r - 1) < 1e-9 ? Math.log(w) : (Math.pow(w, 1 - r) - 1) / (1 - r));
const crraInv = (u, r) => (Math.abs(r - 1) < 1e-9 ? Math.exp(u) : Math.pow(1 + (1 - r) * u, 1 / (1 - r)));

// TK92 Table 3: median cash equivalents of (0, x) prospects, as [x, p, c].
const T3 = [
  [50, 0.1, 9], [50, 0.5, 21], [50, 0.9, 37],
  [-50, 0.1, -8], [-50, 0.5, -21], [-50, 0.9, -39],
  [100, 0.05, 14], [100, 0.25, 25], [100, 0.5, 36], [100, 0.75, 52], [100, 0.95, 78],
  [-100, 0.05, -8], [-100, 0.25, -23.5], [-100, 0.5, -42], [-100, 0.75, -63], [-100, 0.95, -84],
  [200, 0.01, 10], [200, 0.1, 20], [200, 0.5, 76], [200, 0.9, 131], [200, 0.99, 188],
  [-200, 0.01, -3], [-200, 0.1, -23], [-200, 0.5, -89], [-200, 0.9, -155], [-200, 0.99, -190],
  [400, 0.01, 12], [400, 0.99, 377], [-400, 0.01, -14], [-400, 0.99, -380],
];
const T3COL = { 50: 'teal', 100: 'blue', 200: 'purple', 400: 'pink' };

export default {
  collection: 'behav',
  chapter: 2,
  title: 'Prospect theory and reference dependence',
  summary: String.raw`Kahneman and Tversky's prospect theory replaces the utility of final wealth with the value of gains and losses measured from a reference point. The value function is concave for gains, convex for losses and steeper for losses than for gains (loss aversion). Probabilities enter through decision weights that overweight small probabilities and underweight large ones. Together these explain the fourfold pattern of risk attitudes, the certainty effect behind the Allais paradox and the reflection of preferences between gains and losses. In markets they explain why owners demand far more to give up a good than buyers will pay, why people stick with the status quo, why investors sell winners and hold losers, and why stocks must pay a large premium to investors who check them often. How large loss aversion really is remains debated.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Concept', name: 'Reference dependence: gains and losses',
      statement: String.raw`**Reference dependence**: people evaluate outcomes as **changes** (gains and losses) relative to a reference point, usually the status quo, an expectation or a recent level, rather than as final states of wealth. Bernoulli's expected utility (behav-1.2) assigns a utility $u(w)$ to final wealth $w$, so two people facing the same distribution of final wealth must make the same choice and two people with the same wealth must be equally well off. A reference-dependent evaluation instead uses a value function $v(w-r)$ of the change from a reference point $r$, so the same final positions can be gains for one person and losses for another. Kahneman's illustrations: Anthony (owning 1 million) and Betty (owning 4 million) choose between owning 2 million for sure and an even chance of owning 1 or 4 million: identical in final wealth, but a choice between gains for Anthony and between losses for Betty. And of two people with the same wealth today, the one who had less yesterday is happier.`,
      scope: String.raw`A descriptive principle about how outcomes are coded, not a normative one. What serves as the reference point (status quo, expectations, aspirations, a purchase price) depends on the situation and can be shifted by framing; theories of expectation-based reference points (Kőszegi–Rabin) make it endogenous.`,
      idea: String.raw`Perception is relative: the same water feels warm to a hand that was in cold water and cold to one that was in hot water, and sensitivity diminishes with distance from the adaptation level, as in Fechner's law. Kahneman and Tversky carried this psychophysics to money: the carrier of value is the change, and the value function is concave above the reference point and convex below it. Bernoulli's model, which ignores where a person starts, cannot distinguish Anthony from Betty; the reference-dependent model predicts that Betty, facing a sure loss, is the one more willing to gamble (the reflection effect, behav-2.7), and that losses hurt more than equal gains please (loss aversion, behav-2.2).`,
      caption: String.raw`Answer the question first (click a card; in the Anthony-and-Betty example answer once as each). Left: Bernoulli's utility of final wealth (curvature $\rho$; $\rho=1$ is his logarithm). It sees one lottery for both people, so its certainty equivalent (where the dashed chord's midpoint meets the curve) is the same for both. Right: the value of changes from each person's own reference point, with Anthony's options in blue and Betty's in red; the sure option is a dot on the curve and the gamble's value the midpoint of the chord. Switch to **Jack and Jill** to compare two people with the same wealth today.`,
      deps: ['behav-1.2'], refs: ['Kahneman ch. 25', 'W&K ch. 5'], tags: ['reference dependence', 'prospect theory', 'value'],
      see: ['behav-2.3', 'behav-2.7'],
      credit: 'Markowitz, 1952; Kahneman & Tversky, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reference_dependence' },
      viz(v) {
        const ex = v.select('example', [{ value: 'ab', label: 'Anthony and Betty' }, { value: 'jj', label: 'Jack and Jill' }], 'ab');
        const rS = v.slider('utility of wealth: curvature $\\rho$ ($\\rho=1$: Bernoulli’s log)', 0, 3, 1.5, { step: 0.05 });
        const aS = v.slider('value function: curvature $\\alpha$', 0.3, 1, 0.6, { step: 0.01 });
        const lS = v.slider('value function: loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const C = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 180, full: true });
        const U = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'final wealth w (millions)', ylabel: 'u(w)', title: 'utility of final wealth (Bernoulli)' });
        const Vs = v.stage({ x: [-5, 5], y: [-1, 1], axes: 'box', gutter: true, height: 290, xlabel: 'change from the reference point (millions)', ylabel: 'v(x)', title: 'value of gains and losses' });
        const ans = { ab0: null, ab1: null, jj: null };
        const RAB = [[[25, 21, 61, 33], [63, 21, 99, 33]], [[25, 3, 61, 15], [63, 3, 99, 15]]];
        const RJJ = [[2, 4, 33, 24], [35, 4, 66, 24], [68, 4, 99, 24]];
        C.onClick((x, y) => {
          if (ex.value === 'ab') RAB.forEach((row, i) => row.forEach((r, k) => { if (inside(r, x, y)) ans['ab' + i] = k; }));
          else RJJ.forEach((r, k) => { if (inside(r, x, y)) ans.jj = k; });
        });
        let st = {};
        v.render(() => {
          const r = rS.value, a = aS.value, l = lS.value, ab = ex.value === 'ab';
          v.legend(ab ? [['ink', 'utility / value curve'], ['blue', 'Anthony (owns 1 million)', { dot: true }], ['red', 'Betty (owns 4 million)', { dot: true }], ['muted', 'chord: value of the 50–50 gamble', { dash: true }]]
            : [['ink', 'utility / value curve'], ['blue', 'Jack (had 1 million yesterday)', { dot: true }], ['red', 'Jill (had 9 million yesterday)', { dot: true }]]);
          // ---------------- question cards
          if (ab) {
            C.text('Choose between owning 2 million for sure and an even chance of owning 1 million or 4 million.', 1, 38, { size: 12.5, weight: 600 });
            ['If you owned 1 million (Anthony)', 'If you owned 4 million (Betty)'].forEach((t, i) => {
              const yc = i === 0 ? 27 : 9;
              C.text(t.split(' (')[0], 1, yc + 2, { size: 12, weight: 600, color: i ? 'red' : 'blue' });
              C.text('(' + t.split(' (')[1], 1, yc - 2.5, { size: 11.5, color: 'muted' });
              const c = ans['ab' + i];
              card(C, RAB[i][0], { tag: 'S', lines: ['own 2 million for sure', i ? '(a sure loss of 2 million)' : '(a sure gain of 1 million)'], chosen: c === 0, dim: c === 1, size: 12 });
              card(C, RAB[i][1], { tag: 'G', lines: ['50%: own 1 million, 50%: own 4 million', i ? '(lose 3 million or nothing)' : '(gain nothing or 3 million)'], chosen: c === 1, dim: c === 0, size: 12 });
            });
          } else {
            C.text('Two people have the same wealth today. Yesterday Jack had 1 million and Jill had 9 million.', 1, 37.5, { size: 12.5, weight: 600 });
            C.text('Who is happier today?', 1, 32.5, { size: 12.5, weight: 600 });
            ['Jack', 'Jill', 'equally happy'].forEach((t, k) => card(C, RJJ[k], { tag: '', lines: [t], chosen: ans.jj === k, dim: ans.jj != null && ans.jj !== k, size: 14 }));
          }
          // ---------------- utility of final wealth
          const W0 = 0.25, W1 = 10, u = (w) => crra(w, r);
          const ulo = u(0.6), uhi = u(W1);
          U.setView([0, W1], [ulo - 0.08 * (uhi - ulo), uhi + 0.12 * (uhi - ulo)]);
          U.fn(u, { color: 'ink', width: 2.4, domain: [W0, W1] });
          let ceW = null;
          if (ab) {
            const u1 = u(1), u4 = u(4), mid = (u1 + u4) / 2; ceW = crraInv(mid, r);
            U.line(1, u1, 4, u4, { color: 'muted', width: 1.4, dash: [5, 4] });
            U.line(2.5, mid, ceW, mid, { color: 'purple', width: 1.6 });
            U.dot(2.5, mid, { r: 4.5, color: 'muted' });
            U.dot(ceW, mid, { r: 5.5, color: 'purple' });
            U.text(`certainty equivalent ${ceW.toFixed(2)}M`, ceW, mid, { dx: 10, dy: 14, size: 11, weight: 700, color: 'purple' });
            U.dot(2, u(2), { r: 5.5, color: 'green', label: 'sure 2M', labelPos: 'nw' });
            U.dot(1, u1, { r: 4, color: 'ink' }); U.dot(4, u4, { r: 4, color: 'ink' });
            U.text('one lottery over final wealth,', 9.8, ulo + 0.24 * (uhi - ulo), { align: 'right', size: 11.5, color: 'muted', weight: 600 });
            U.text('the same for Anthony and Betty', 9.8, ulo + 0.15 * (uhi - ulo), { align: 'right', size: 11.5, color: 'muted', weight: 600 });
          } else {
            U.arrow(1, u(1), 4.85, u(5) - 0.02 * (uhi - ulo), { color: 'blue', width: 1.6 });
            U.arrow(9, u(9), 5.15, u(5) - 0.02 * (uhi - ulo), { color: 'red', width: 1.6 });
            U.dot(1, u(1), { r: 5, color: 'blue', hollow: true, label: 'Jack yesterday', labelPos: 'se' });
            U.dot(9, u(9), { r: 5, color: 'red', hollow: true, label: 'Jill yesterday', labelPos: 'n' });
            U.dot(5, u(5), { r: 7, color: 'purple', label: 'both today', labelPos: 'n' });
            U.text('same wealth, same utility', 9.8, ulo + 0.08 * (uhi - ulo), { align: 'right', size: 11.5, color: 'muted', weight: 600 });
          }
          // ---------------- value of changes
          const val = (x) => vPT(x, a, l);
          const vmax = val(4.6), vmin = val(-4.6);
          Vs.setView([-5, 5], [vmin * 1.05, vmax * 1.5]);
          Vs.hline(0, { color: 'muted', width: 1 }); Vs.vline(0, { color: 'muted', width: 1 });
          Vs.fn(val, { color: 'ink', width: 2.4, domain: [-5, 5] });
          let ceA = null, ceB = null;
          if (ab) {
            // Anthony: sure +1, gamble 0 / +3. Betty: sure −2, gamble −3 / 0 (equal weights 1/2: no probability weighting here)
            const gA = 0.5 * val(3), gB = 0.5 * val(-3);
            ceA = vInv(gA, a, l); ceB = vInv(gB, a, l);
            Vs.line(0, 0, 3, val(3), { color: 'blue', width: 1.3, dash: [5, 4] });
            Vs.line(-3, val(-3), 0, 0, { color: 'red', width: 1.3, dash: [5, 4] });
            Vs.dot(3, val(3), { r: 3.5, color: 'blue' }); Vs.dot(-3, val(-3), { r: 3.5, color: 'red' });
            Vs.dot(1.5, gA, { r: 5, color: 'blue', hollow: true, width: 2 });
            Vs.dot(1, val(1), { r: 6, color: 'blue', label: 'Anthony: sure +1', labelPos: 'nw' });
            Vs.dot(-1.5, gB, { r: 5, color: 'red', hollow: true, width: 2 });
            Vs.dot(-2, val(-2), { r: 6, color: 'red', label: 'Betty: sure −2', labelPos: 'se' });
            Vs.text(gA > val(1) ? 'Anthony: gamble ≻ sure' : 'Anthony: sure ≻ gamble', 1.5, gA, { dx: 4, dy: 22, size: 11, weight: 700, color: 'blue' });
            Vs.text(gB > val(-2) ? 'Betty: gamble ≻ sure' : 'Betty: sure ≻ gamble', -1.5, gB, { dx: -12, dy: -2, align: 'right', size: 11, weight: 700, color: 'red' });
          } else {
            Vs.line(4, 0, 4, val(4), { color: 'blue', width: 5, alpha: 0.5 });
            Vs.line(-4, 0, -4, val(-4), { color: 'red', width: 5, alpha: 0.5 });
            Vs.dot(4, val(4), { r: 6, color: 'blue', label: `Jack: v(+4) = ${val(4).toFixed(2)}`, labelPos: 'nw' });
            Vs.dot(-4, val(-4), { r: 6, color: 'red', label: `Jill: v(−4) = ${val(-4).toFixed(2)}`, labelPos: 'e' });
          }
          st = { ab, ceW, ceA, ceB, a, l, r, vA: val(1), gA: ab ? 0.5 * val(3) : 0, vJ: val(4), vJi: val(-4) };
        });
        v.readout(() => {
          const { ab, ceW, ceA, ceB, a, l, r, vA, gA, vJ, vJi } = st; if (ab == null) return '';
          if (!ab) {
            const pick = ans.jj == null ? 'Answer the question first. ' : `You said: **${['Jack', 'Jill', 'equally happy'][ans.jj]}**. `;
            return `${pick}Utility of wealth: both have $u(\\text{today})$, so they are **equally** well off whatever $\\rho$. Value of the change: Jack gained 4 million, $v(+4) = ${vJ.toFixed(2)}$; Jill lost 4 million, $v(-4) = ${vJi.toFixed(2)}$. Her loss outweighs his gain by the factor $\\lambda = ${l.toFixed(2)}$.`;
          }
          const mine = (i) => (ans['ab' + i] == null ? '?' : ans['ab' + i] === 0 ? 'sure' : 'gamble');
          const pick = ans.ab0 == null || ans.ab1 == null ? 'Answer as Anthony and as Betty first. ' : `You chose **${mine(0)}** as Anthony and **${mine(1)}** as Betty${ans.ab0 !== ans.ab1 ? ': different choices for the same final-wealth lottery, impossible for any utility of wealth' : ''}. `;
          const thr = Math.log(2) / Math.log(3);
          return `${pick}Bernoulli ($\\rho = ${r.toFixed(2)}$): both value the gamble at **${ceW.toFixed(2)} million** of final wealth, so both ${ceW > 2 ? 'gamble' : ceW < 2 ? 'take the sure 2 million' : 'are indifferent'}. Reference-dependent value ($\\alpha = ${a.toFixed(2)}$): Anthony values the gamble at **${(1 + ceA).toFixed(2)} million** (${gA > vA ? 'gambles' : 'takes the sure thing'}), Betty at **${(4 + ceB).toFixed(2)} million** (gambles). Betty gambles for every $\\alpha \\le 1$; Anthony takes the sure gain only if $\\alpha < \\ln 2/\\ln 3 = ${thr.toFixed(2)}$, since the gamble's expected value is 2.5 million.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Phenomenon', name: 'Loss aversion',
      statement: String.raw`**Loss aversion**: losses loom larger than gains of the same size. Most people reject a 50–50 gamble to win or lose the same amount, and accept a mixed gamble (win $G$ or lose $L$ with equal chances) only when $G$ is well above $L$. In prospect theory this is a kink of the value function at the reference point, measured by the **loss-aversion coefficient** $\lambda=-v(-x)/v(x)$; with a linear value function and no probability weighting, an even-chance gamble is acceptable exactly when $G/L\ge\lambda$. Tversky and Kahneman's (1992) subjects accepted an even chance to lose \$25, \$50, \$100 or \$150 only for gains of at least \$61, \$101, \$202 or \$280 (medians), ratios of about 2, and their median fitted $\lambda$ was 2.25. A 2024 meta-analysis of 607 estimates (Brown, Imai, Vieider and Camerer) puts the mean at 1.96 (95% interval 1.82–2.10); another, restricted to fits of individual choices between mixed gambles (Walasek, Mullett and Stewart), finds only 1.31 (1.10–1.53).`,
      scope: String.raw`Strongest for money and goods given up from an endowment and for moderate stakes; weak or absent for small stakes, for money spent as intended, for experienced traders and for some elicitation methods. Estimates of $\lambda$ depend on the assumed curvature and probability weighting and on what is taken as the reference point, which is why the critics (Gal and Rucker 2018) argue that the effect has been overstated.`,
      idea: String.raw`Loss aversion explains the refusal of favourable small gambles that expected utility can explain only with absurd risk aversion (Rabin's theorem, behav-1.8), and it underlies the endowment effect (behav-2.9), status quo bias (behav-2.10) and the equity premium (behav-2.12). It is measured by finding where a person switches from rejecting to accepting mixed gambles: at the switch $v(G)=\lambda\,|v(-L)|$, so the ratio $G/L$ of the switch point estimates $\lambda$ once curvature and weights are fixed. Because gains and losses enter through different branches, an estimate made with a bilinear value function and one made with curvature and weighting differ, as the toggle shows.`,
      caption: String.raw`Each row offers even-chance gambles that lose the amount shown on the left; going right, the gain grows from 1 to 4 times the loss. Click the first gamble in each row you would accept: it and everything to its right turn green, the rest red (shift-click toggles one gamble). The vertical line is the loss-aversion coefficient fitted to all your answers by maximum likelihood (logistic choice), and the gold marks are the median switch points of Tversky and Kahneman's subjects for the same losses. Below, your $\lambda$ beside published estimates. Or set a $\lambda$ and press **simulate a respondent**.`,
      deps: ['behav-2.1'], refs: ['Kahneman ch. 26', 'Kahneman ch. 28'], tags: ['loss aversion', 'prospect theory', 'measurement'],
      see: ['behav-1.8', 'behav-2.9'],
      credit: 'Kahneman & Tversky, 1979; Tversky & Kahneman, 1992',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Loss_aversion' },
      viz(v) {
        const LOSS = [150, 100, 50, 25], RAT = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 4], TKX = { 25: 61, 50: 101, 100: 202, 150: 280 };
        const corr = v.toggle('allow for curvature and weighting (α = .88, TK92 weights)', false);
        const simL = v.slider('simulated respondent’s $\\lambda$', 1, 3.5, 2, { step: 0.05 });
        let seed = 1;
        const ans = LOSS.map(() => RAT.map(() => null));
        v.button('simulate a respondent', () => {
          const rr = v.rng(seed++);
          LOSS.forEach((L, i) => RAT.forEach((R, j) => { const p = 1 / (1 + Math.exp(-6 * (Math.log(R) - Math.log(simL.value)))); ans[i][j] = rr() < p; }));
        });
        v.button('clear my answers', () => LOSS.forEach((_, i) => RAT.forEach((_, j) => { ans[i][j] = null; })));
        const G = v.stage({ x: [0.88, 4.5], y: [0.4, 4.6], xlog: true, axes: 'box', gutter: { l: 70, b: 40, t: 10, r: 10 }, height: 300, full: true, xlabel: 'gain ÷ loss', ylabel: '', yticks: LOSS.map((L, i) => [i + 1, `lose $${L}`]), xticks: RAT.map((R) => [R, String(R)]), title: 'which 50–50 gambles would you accept?' });
        const Mtr = v.stage({ x: [-0.9, 3.2], y: [0.4, 6.6], axes: false, height: 240, full: true, title: 'your λ beside published estimates (loss-aversion coefficient)' });
        G.onClick((x, y, mod) => {
          const i = Math.round(y) - 1; if (i < 0 || i >= LOSS.length) return;
          let j = 0, best = 1e9; RAT.forEach((R, k) => { const d = Math.abs(Math.log(R) - Math.log(Math.max(0.5, x))); if (d < best) { best = d; j = k; } });
          if (best > 0.12) return;
          if (mod && mod.shift) ans[i][j] = !ans[i][j];
          else RAT.forEach((_, k) => { ans[i][k] = k >= j; });
        });
        v.legend([['green', 'accept', { dot: true }], ['red', 'reject', { dot: true }], ['gold', 'TK92 median switch point', { dot: true }], ['accent', 'your fitted λ']]);
        let st = {};
        v.render(() => {
          const wr = corr.value ? wTK(0.5, 0.61) / wTK(0.5, 0.69) : 1, al = corr.value ? 0.88 : 1;
          const lamOf = (R) => wr * Math.pow(R, al); // λ implied by indifference at gain/loss ratio R
          // ---- fit P(accept) = σ(κ (ln λ(R) − ln λ̂)) by maximum likelihood on a grid
          const obs = []; LOSS.forEach((L, i) => RAT.forEach((R, j) => { if (ans[i][j] != null) obs.push([Math.log(lamOf(R)), ans[i][j]]); }));
          let fit = null;
          if (obs.length) {
            let bestLL = -1e18;
            for (let m = Math.log(0.6); m <= Math.log(6); m += 0.005) for (const k of [1, 2, 3, 5, 8, 12, 20, 35]) {
              let ll = 0; for (const [x, y] of obs) { const z = k * (x - m); ll += y ? -Math.log1p(Math.exp(-z)) : -Math.log1p(Math.exp(z)); }
              if (ll > bestLL + 1e-9) { bestLL = ll; fit = { lam: Math.exp(m), k }; }
            }
            // ties (separable data): centre of the flat stretch at the largest κ
            const kk = fit.k, ms = [];
            for (let m = Math.log(0.6); m <= Math.log(6); m += 0.005) { let ll = 0; for (const [x, y] of obs) { const z = kk * (x - m); ll += y ? -Math.log1p(Math.exp(-z)) : -Math.log1p(Math.exp(z)); } if (ll >= bestLL - 1e-6) ms.push(m); }
            if (ms.length) fit.lam = Math.exp((ms[0] + ms[ms.length - 1]) / 2);
            fit.acc = obs.filter(([x, y]) => y === x >= Math.log(fit.lam)).length;
          }
          // ---- grid
          LOSS.forEach((L, i) => {
            const yc = i + 1;
            G.hline(yc, { color: 'grid', width: 1 });
            RAT.forEach((R, j) => {
              const a = ans[i][j];
              G.dot(R, yc, { r: 10, color: a == null ? 'faint' : a ? 'green' : 'red', hollow: a == null, width: 1.5 });
              G.text(`+${Math.round(R * L)}`, R, yc, { dy: 19, align: 'center', size: 10, color: 'muted' });
            });
            const tk = TKX[L] / L;
            G.line(tk, yc - 0.3, tk, yc + 0.3, { color: 'gold', width: 3 });
            G.text(`TK92: +${TKX[L]}`, tk, yc + 0.3, { dy: -7, align: 'center', size: 10.5, weight: 700, color: 'gold' });
          });
          if (fit) {
            const R = corr.value ? Math.pow(fit.lam / wr, 1 / al) : fit.lam;
            if (R >= 0.88 && R <= 4.5) { G.vline(R, { color: 'accent', width: 2.4 }); }
          }
          // ---- meter
          const rows = [
            { y: 6, lab: 'you (fitted to your answers)', c: 'accent', m: fit ? fit.lam : null },
            { y: 5, lab: 'Tversky–Kahneman 1992 (median fit)', c: 'blue', m: 2.25 },
            { y: 4, lab: 'TK92 Table 6 switch ratios', c: 'gold', lo: 1.87, hi: 2.44, m: null },
            { y: 3, lab: 'Brown et al. 2024 (607 estimates)', c: 'green', m: 1.955, lo: 1.82, hi: 2.10 },
            { y: 2, lab: 'Walasek et al. 2024 (mixed gambles)', c: 'orange', m: 1.31, lo: 1.10, hi: 1.53 },
            { y: 1, lab: 'simulated respondent', c: 'muted', m: simL.value },
          ];
          Mtr.line(0.8, 0.55, 3.2, 0.55, { color: 'muted', width: 1 });
          for (let t = 1; t <= 3; t += 0.5) { Mtr.line(t, 0.55, t, 0.45, { color: 'muted', width: 1 }); Mtr.text(String(t), t, 0.45, { dy: 9, align: 'center', size: 10.5, color: 'muted' }); }
          Mtr.line(1, 0.55, 1, 6.5, GUIDE); Mtr.text('λ = 1: no loss aversion', 1, 6.5, { dx: 5, dy: 4, size: 10.5, color: 'muted' });
          for (const r of rows) {
            Mtr.text(r.lab, -0.88, r.y, { size: 11.5, weight: r.c === 'accent' ? 700 : 500, color: r.c === 'accent' ? 'accent' : 'ink' });
            Mtr.line(0.8, r.y, 3.2, r.y, { color: 'grid', width: 1 });
            if (r.lo != null) Mtr.line(r.lo, r.y, r.hi, r.y, { color: r.c, width: 5, alpha: 0.6 });
            if (r.m != null) { Mtr.dot(clamp(r.m, 0.8, 3.2), r.y, { r: 6.5, color: r.c }); Mtr.text(r.m.toFixed(2), clamp(r.m, 0.8, 3.2), r.y, { dy: -13, align: 'center', size: 11, weight: 700, color: r.c }); }
            else if (r.lo == null) Mtr.text('answer some rows above', 2, r.y, { align: 'center', size: 11, color: 'muted' });
          }
          st = { fit, n: obs.length, corr: corr.value };
        });
        v.readout(() => {
          const { fit, n, corr: c } = st;
          const how = c ? 'with $v(x)=x^{0.88}$ and TK92 weights, $\\lambda = \\tfrac{w^+(.5)}{w^-(.5)}(G/L)^{0.88}$' : 'with a linear value function and equal weights, $\\lambda$ is the gain/loss ratio at your switch point';
          if (!fit) return `No answers yet: click one gamble per row. Tversky and Kahneman's subjects switched at ratios 2.44, 2.02, 2.02 and 1.87 (losses of \\$25 to \\$150). Here ${how}.`;
          return `From your ${n} answers: $\\hat\\lambda = ${fit.lam.toFixed(2)}$ (${fit.acc} of ${n} answers fit the threshold rule), ${how}. ${fit.lam < 1.05 ? 'You show no loss aversion: you accept fair or nearly fair gambles.' : fit.lam > 2.6 ? 'Stronger than the typical subject.' : 'In the range of the published estimates.'} The meta-analytic means differ by a factor of 1.5 (1.96 against 1.31), largely through which studies and model assumptions are pooled.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Model', name: 'Prospect-theory value function',
      statement: String.raw`Prospect theory evaluates an outcome $x$, a gain ($x>0$) or a loss ($x<0$) relative to the reference point, by a **value function** $v$ with three properties: (i) $v(0)=0$ and $v$ is increasing; (ii) **diminishing sensitivity**: concave for gains and convex for losses (an S shape); (iii) **loss aversion**: steeper for losses, $-v(-x)>v(x)$ for $x>0$, with a kink at 0. The standard parametric form (Tversky and Kahneman 1992) is
$$v(x)=\begin{cases}x^{\alpha}, & x\ge0,\\ -\lambda(-x)^{\beta}, & x<0,\end{cases}$$
with median estimates $\alpha=\beta=0.88$ and $\lambda=2.25$. A prospect paying $x_i$ with probabilities $p_i$ is worth $V=\sum_i\pi_i\,v(x_i)$, where the decision weights $\pi_i$ come from the probability-weighting function (behav-2.4).`,
      scope: String.raw`A descriptive model of choices among simple monetary prospects with stated probabilities, fitted best to moderate stakes. The power form is a convenience: with $\alpha\ne\beta$ the value of $\lambda$ depends on the unit of money, so loss aversion is better quoted as $-v(-x)/v(x)$ at a stated $x$. Parameters vary widely between people and tasks.`,
      idea: String.raw`Each property answers an observation. Reference dependence (behav-2.1) puts the origin at the status quo. Diminishing sensitivity, the psychophysical law that the difference between 100 and 200 feels larger than between 1,100 and 1,200 (Weber and Fechner, psych-1.11), makes people risk averse for gains and risk seeking for losses (behav-2.7). Loss aversion (behav-2.2) explains why mixed gambles need gains about twice the losses. Each shape parameter can be read off a single kind of choice: the certainty equivalent of a gamble over gains fixes $\alpha$, over losses $\beta$, and the acceptability of a mixed gamble fixes $\lambda$.`,
      caption: String.raw`Three choice lists, as used in experiments: in each row choose between the fixed gamble at the top and the alternative in the row. Click the row where you switch: rows above it take the top option of the list, rows from it down the other. Your three switch points are converted into the value function on the right: the dots are the points of the curve your answers pin down, the blue and red curve the value function fitted through them, and the dashed curve Tversky and Kahneman's median. The toggle decides whether a 50% chance counts as weight 0.5 or with the weights estimated in 1992 (0.42 for gains, 0.45 for losses).`,
      deps: ['behav-2.1', 'behav-2.2', 'psych-1.11'], refs: ['Kahneman ch. 26', 'W&K ch. 5'], tags: ['prospect theory', 'value function', 'measurement'],
      see: ['behav-2.13'],
      credit: 'Kahneman & Tversky, 1979; Tversky & Kahneman, 1992',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prospect_theory' },
      viz(v) {
        const LISTS = [
          { key: 'g', title: ['Gamble: 50% win $1,000,', 'otherwise nothing'], rows: [100, 200, 300, 350, 400, 450, 500, 600, 700], top: 'gamble', bot: 'sure', row: (x) => `win ${usdC(x)} for sure`, color: 'blue' },
          { key: 'l', title: ['Gamble: 50% lose $1,000,', 'otherwise nothing'], rows: [200, 300, 350, 400, 450, 500, 550, 600, 800], top: 'sure', bot: 'gamble', row: (x) => `lose ${usdC(x)} for sure`, color: 'red' },
          { key: 'm', title: ['Nothing, or a 50–50 gamble:', 'lose $500 or win the row amount'], rows: [500, 600, 750, 900, 1000, 1100, 1250, 1500, 2000], top: 'reject', bot: 'accept', color: 'purple' },
        ];
        const wt = v.toggle('probability weights from TK92 (w⁺(.5) = .42, w⁻(.5) = .45)', false);
        const sw = { g: null, l: null, m: null };
        const S = v.stage({ x: [0, 100], y: [0, 11.6], axes: false, height: 330, full: true, title: 'choice lists: click the row where you switch' });
        const COLX = [[1, 32.3], [34.4, 65.6], [67.7, 99]], rowY = (i) => 8.85 - i * 0.98;
        v.button('typical answers (TK92 model)', () => {
          const P = TK92;
          const ceG = cptCE([[1000, 0.5], [0, 0.5]], P), ceL = cptCE([[-1000, 0.5], [0, 0.5]], P);
          sw.g = LISTS[0].rows.filter((x) => x < ceG).length;
          sw.l = LISTS[1].rows.filter((x) => -x > ceL).length;
          sw.m = LISTS[2].rows.filter((x) => cptValue([[x, 0.5], [-500, 0.5]], P) < 0).length;
        });
        v.button('clear', () => { sw.g = sw.l = sw.m = null; });
        S.onClick((x, y) => {
          LISTS.forEach((L, c) => {
            const [x0, x1] = COLX[c]; if (x < x0 || x > x1) return;
            // the left half of every row is the list's top option: clicking it there means rows 0..i take it
            L.rows.forEach((_, i) => { if (Math.abs(y - rowY(i)) < 0.49) sw[L.key] = x < (x0 + x1) / 2 ? i + 1 : i; });
          });
        });
        const Vs = v.stage({ x: [-1100, 2100], y: [-3, 1.6], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'gain or loss (dollars)', ylabel: 'v(x) / v(1000)', title: 'the value function your choices imply' });
        v.legend([['blue', 'fitted: gains $x^{\\alpha}$'], ['red', 'fitted: losses $-\\lambda(-x)^{\\beta}$'], ['faint', 'TK92 median', { dash: true }], ['gold', 'points pinned down by your switches', { dot: true }]]);
        let st = {};
        v.render(() => {
          const wp = wt.value ? wTK(0.5, 0.61) : 0.5, wm = wt.value ? wTK(0.5, 0.69) : 0.5;
          // ---- lists. For list l the left half is the sure loss; we store s = number of top rows taking the list's top option.
          LISTS.forEach((L, c) => {
            const [x0, x1] = COLX[c], xm = (x0 + x1) / 2, s = sw[L.key];
            L.title.forEach((t, k) => S.text(t, x0 + 0.5, 11.15 - k * 0.55, { size: 11.5, weight: 700, color: L.color }));
            const lt = L.key === 'l' ? 'sure loss' : L.key === 'm' ? 'nothing' : 'the gamble', rt = L.key === 'l' ? 'the gamble' : L.key === 'm' ? 'the gamble' : 'sure gain';
            S.text(lt, (x0 + xm) / 2, 9.65, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
            S.text(rt, (xm + x1) / 2, 9.65, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
            L.rows.forEach((amt, i) => {
              const yc = rowY(i);
              // which side is chosen in row i?
              const side = s == null ? null : i < s ? 'L' : 'R';
              const lab = L.key === 'g' ? ['50%: win $1,000', usdC(amt) + ' for sure'] : L.key === 'l' ? [usdC(-amt) + ' for sure', '50%: lose $1,000'] : ['nothing', `win ${usdC(amt)} / lose 500`];
              [[x0, xm - 0.3, 'L'], [xm + 0.3, x1, 'R']].forEach(([a, b, sd], k) => {
                const on = side === sd;
                S.rect(a, yc - 0.42, b, yc + 0.42, { fill: on ? L.color : 'grid', fillAlpha: on ? 0.22 : 0.35, color: on ? L.color : 'faint', width: on ? 1.6 : 0.8, radius: 5 });
                S.text(lab[k], (a + b) / 2, yc, { align: 'center', size: 10.5, weight: on ? 700 : 500, color: on ? 'ink' : 'muted', halo: false });
              });
            });
            if (s != null && s > 0 && s < L.rows.length) S.line(x0, (rowY(s - 1) + rowY(s)) / 2, x1, (rowY(s - 1) + rowY(s)) / 2, { color: L.color, width: 2 });
          });
          // ---- indifference points (midpoints between the last top row and the first bottom row)
          const mid = (rows, s) => (s == null ? null : s <= 0 ? rows[0] - (rows[1] - rows[0]) / 2 : s >= rows.length ? rows[rows.length - 1] + (rows[rows.length - 1] - rows[rows.length - 2]) / 2 : (rows[s - 1] + rows[s]) / 2);
          const cG = mid(LISTS[0].rows, sw.g), cL = mid(LISTS[1].rows, sw.l), gM = mid(LISTS[2].rows, sw.m);
          // gains: c^α = w⁺·1000^α → α = ln w⁺ / ln(c/1000); losses likewise; λ at ±$500: (w⁺/w⁻)(G/500)^α
          const al = cG != null ? clamp(Math.log(wp) / Math.log(clamp(cG, 1, 999) / 1000), 0.15, 3) : 0.88;
          const be = cL != null ? clamp(Math.log(wm) / Math.log(clamp(cL, 1, 999) / 1000), 0.15, 3) : 0.88;
          const lam500 = gM != null ? (wp / wm) * Math.pow(gM / 500, al) : null;
          const lam1000 = lam500 != null ? lam500 * Math.pow(2, be - al) : 2.25;
          const vf = (x) => (x >= 0 ? Math.pow(x / 1000, al) : -lam1000 * Math.pow(-x / 1000, be));
          const tk = (x) => (x >= 0 ? Math.pow(x / 1000, 0.88) : -2.25 * Math.pow(-x / 1000, 0.88));
          const lo = Math.min(vf(-1100), tk(-1100)), hi = Math.max(vf(2100), tk(2100));
          Vs.setView([-1100, 2100], [lo * 1.08, hi * 1.12]);
          Vs.hline(0, { color: 'muted', width: 1 }); Vs.vline(0, { color: 'muted', width: 1 });
          Vs.fn(tk, { color: 'faint', width: 1.6, dash: [6, 4] });
          Vs.fn((x) => (x >= 0 ? vf(x) : NaN), { color: 'blue', width: cG != null ? 2.6 : 1.2, alpha: cG != null ? 1 : 0.5, domain: [0, 2100] });
          Vs.fn((x) => (x <= 0 ? vf(x) : NaN), { color: 'red', width: cL != null ? 2.6 : 1.2, alpha: cL != null ? 1 : 0.5, domain: [-1100, 0] });
          Vs.dot(1000, 1, { r: 4, color: 'ink', label: 'v(1000) = 1', labelPos: 'se' });
          if (cG != null) { Vs.dot(cG, wp, { r: 6, color: 'gold' }); Vs.line(cG, 0, cG, wp, GUIDE); Vs.text(`CE ${usdC(cG)}`, cG, 0, { dy: 12, align: 'center', size: 10.5, color: 'blue', weight: 700 }); }
          if (cL != null) { Vs.dot(-cL, vf(-cL), { r: 6, color: 'gold' }); Vs.line(-cL, 0, -cL, vf(-cL), GUIDE); Vs.text(`CE ${usdC(-cL)}`, -cL, 0, { dy: -10, align: 'center', size: 10.5, color: 'red', weight: 700 }); }
          if (gM != null) {
            Vs.dot(gM, vf(gM), { r: 6, color: 'gold' }); Vs.dot(-500, vf(-500), { r: 6, color: 'gold' });
            Vs.line(gM, vf(gM), gM, 0, GUIDE); Vs.line(-500, vf(-500), -500, 0, GUIDE);
            Vs.text(`accept from +${usdC(gM)}`, gM, vf(gM), { dx: 8, dy: 12, size: 10.5, color: 'purple', weight: 700 });
          }
          st = { cG, cL, gM, al, be, lam500, wp, wm };
        });
        v.readout(() => {
          const { cG, cL, gM, al, be, lam500 } = st;
          if (cG == null && cL == null && gM == null) return 'Click a switch row in each list (or press **typical answers**). Tversky and Kahneman (1992): $\\alpha=\\beta=0.88$, $\\lambda=2.25$.';
          const parts = [];
          parts.push(cG != null ? `gains: CE ${usdR(cG)} of a gamble worth ${usdR(500)} on average → $\\alpha = ${al.toFixed(2)}$ (${cG < 500 ? 'risk averse, concave' : cG > 500 ? 'risk seeking' : 'neutral'})` : 'gains: no answer');
          parts.push(cL != null ? `losses: CE ${usdR(-cL)} → $\\beta = ${be.toFixed(2)}$ (${cL < 500 ? 'risk seeking, convex' : cL > 500 ? 'risk averse' : 'neutral'})` : 'losses: no answer');
          parts.push(gM != null ? `mixed: you need +${usdR(gM)} against −\\$500 → loss aversion $-v(-500)/v(500) = ${lam500.toFixed(2)}$` : 'mixed: no answer');
          return parts.join(' · ') + '. TK92 medians: $\\alpha=\\beta=0.88$, $\\lambda=2.25$.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Model', name: 'Probability weighting function',
      statement: String.raw`In prospect theory a probability $p$ enters choice through a **decision weight** $w(p)$, where $w$ is increasing with $w(0)=0$ and $w(1)=1$ but is not the identity. The typical **inverse-S** shape overweights small probabilities ($w(p)>p$), underweights moderate and large ones, and is steepest near the endpoints (**possibility** and **certainty effects**). Two standard one-parameter forms:
$$w_{\text{TK}}(p)=\frac{p^{\gamma}}{\big(p^{\gamma}+(1-p)^{\gamma}\big)^{1/\gamma}},\qquad w_{\text{Prelec}}(p)=\exp\!\big(-(-\ln p)^{a}\big),$$
with $0<\gamma,a<1$ giving the inverse S and $\gamma=a=1$ giving $w(p)=p$ (expected utility). Tversky and Kahneman (1992) estimated $\gamma=0.61$ for gains and $0.69$ for losses, so that $w(p)=p$ near $p\approx0.34$–$0.38$; Prelec's form always crosses the diagonal at $1/e\approx0.37$. A weight is read off a certainty equivalent: if $c$ is worth the same as a chance $p$ of $x$, then $w(p)=v(c)/v(x)$.`,
      scope: String.raw`Describes choices from described probabilities. When people learn probabilities from experience, rare events are often underweighted instead (the description–experience gap). Fitted parameters vary across people, and in cumulative prospect theory the weights apply to cumulative probabilities (behav-2.8).`,
      idea: String.raw`Two psychophysical ideas meet in the inverse S. Changes from impossibility to possibility and from possibility to certainty are qualitative and loom large, while the same change in the middle of the scale barely registers (diminishing sensitivity to probability, measured from both ends). Overweighting small probabilities explains why people buy lottery tickets and insurance at unfair odds, and underweighting near-certainties explains the common-ratio effect (behav-1.12) and the certainty effect in the Allais paradox (behav-2.6). Because $w(p)+w(1-p)<1$ (subcertainty), the weights of complementary events do not add up.`,
      caption: String.raw`Left: for each probability, drag the gold handle to the sure amount you would take instead of a chance $p$ of \$100 (start: the expected value, a risk-neutral answer). The coloured marks are the median answers of Tversky and Kahneman's 25 subjects for chances of \$50, \$100, \$200 and \$400, scaled to \$100. Right: the weights your answers imply, $w(p)=(c/100)^{\alpha}$, with the best-fitting Tversky–Kahneman curve (blue) and Prelec curve (purple) and their crossing points with the diagonal. Press **load the 1992 medians** to see the inverse S in their data.`,
      deps: ['behav-1.12', 'behav-2.3'], refs: ['Kahneman ch. 29'], tags: ['prospect theory', 'probability weighting', 'risk'],
      see: ['behav-2.5', 'behav-2.8'],
      credit: 'Kahneman & Tversky, 1979; Tversky & Kahneman, 1992; Prelec, 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prospect_theory#Probability_weighting' },
      viz(v) {
        const PS = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];
        const MED = { 0.01: 4, 0.05: 14, 0.1: 14, 0.25: 25, 0.5: 38.7, 0.75: 52, 0.9: 69.8, 0.95: 78, 0.99: 94.1 }; // mean of the c/x medians available at each p
        const aS = v.slider('value-function curvature $\\alpha$ (to turn amounts into weights)', 0.5, 1, 0.88, { step: 0.01 });
        const A = v.stage({ x: [0, 1], y: [0, 100], axes: 'box', gutter: true, height: 330, xlabel: 'probability p of winning 100 dollars', ylabel: 'sure amount (dollars)', title: 'what is a chance p of winning 100 dollars worth to you?' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'stated probability p', ylabel: 'decision weight w(p)', title: 'the weights your answers imply' });
        const H = PS.map((p) => A.handle(p, 100 * p, { color: 'gold', r: 7, constrain: (x, y) => [p, clamp(y, 0.5, 99.5)] }));
        v.button('load the 1992 medians', () => PS.forEach((p, i) => H[i].set(p, MED[p])));
        v.button('risk neutral (c = 100p)', () => PS.forEach((p, i) => H[i].set(p, 100 * p)));
        v.legend([['gold', 'your answers', { dot: true }], ['blue', 'Tversky–Kahneman fit'], ['purple', 'Prelec fit'], ['faint', 'TK92: γ = .61', { dash: true }]]);
        let st = {};
        v.render(() => {
          const a = aS.value;
          // ---- left: certainty equivalents
          A.line(0, 0, 1, 100, { color: 'faint', width: 1.4, dash: [6, 4] });
          A.text('risk neutral: c = 100p', 0.62, 66, { size: 10.5, color: 'muted', align: 'right' });
          for (const [x, p, c] of T3) if (x > 0) A.dot(p, (100 * c) / x, { r: 3.5, color: T3COL[x], hollow: true, width: 1.6 });
          A.text('○ TK92 medians: chances of', 0.03, 95, { size: 10.5, color: 'muted' });
          [[50, 0.03], [100, 0.12], [200, 0.22], [400, 0.32]].forEach(([x, xx], k) => A.text(`$${x}`, xx + 0.03 * k, 89, { size: 10.5, weight: 700, color: T3COL[x] }));
          H.forEach((h) => A.line(h.x, 100 * h.x, h.x, h.y, { color: h.y > 100 * h.x ? 'orange' : 'blue', width: 2, alpha: 0.5 }));
          // ---- implied weights and fits
          const pts = H.map((h) => [h.x, Math.pow(h.y / 100, a)]);
          const sse = (wf) => pts.reduce((S, [p, y]) => S + (wf(p) - y) ** 2, 0);
          const g = golden((x) => sse((p) => wTK(p, x)), 0.2, 2), pa = golden((x) => sse((p) => wPrelec(p, x)), 0.1, 2);
          B.line(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          B.fn((p) => wTK(p, 0.61), { color: 'faint', width: 1.4, dash: [6, 4], domain: [0, 1] });
          B.fn((p) => wTK(p, g), { color: 'blue', width: 2.6, domain: [0, 1], n: 300 });
          B.fn((p) => wPrelec(p, pa), { color: 'purple', width: 2, domain: [0.0005, 1], n: 300 });
          const fT = Math.abs(g - 1) > 0.06 ? fixedPoint((p) => wTK(p, g)) : null, fP = Math.abs(pa - 1) > 0.06 ? fixedPoint((p) => wPrelec(p, pa)) : null;
          if (fT) B.dot(fT, fT, { r: 5, color: 'blue', label: `${fT.toFixed(2)}`, labelPos: 'se' });
          if (fP) B.dot(fP, fP, { r: 5, color: 'purple', label: `${fP.toFixed(2)}`, labelPos: 'nw' });
          for (const [p, y] of pts) B.dot(p, y, { r: 5.5, color: 'gold' });
          B.text('overweighted', 0.04, 0.55, { size: 11, color: 'orange', weight: 600 });
          B.text('underweighted', 0.96, 0.42, { size: 11, color: 'blue', weight: 600, align: 'right' });
          st = { g, pa, fT, fP, a, w01: wTK(0.01, g), w99: wTK(0.99, g), sub: wTK(0.5, g) * 2 };
        });
        v.readout(() => {
          const { g, pa, fT, fP, w01, w99, sub } = st; if (g == null) return '';
          const shape = g < 0.95 ? 'an **inverse S**: small probabilities overweighted, large ones underweighted' : g > 1.05 ? 'an S (the opposite of the usual pattern)' : 'nearly the diagonal: you weight probabilities linearly, as expected utility requires';
          return `Best fits: Tversky–Kahneman $\\gamma = ${g.toFixed(2)}$${fT ? ` (crosses the diagonal at $p = ${fT.toFixed(2)}$)` : ''}, Prelec $a = ${pa.toFixed(2)}$${fP ? ` (at ${fP.toFixed(2)}, always $1/e$ when it crosses)` : ''}: ${shape}. With the fitted $\\gamma$: $w(.01) = ${w01.toFixed(3)}$ (${(w01 / 0.01).toFixed(1)}× the probability), $w(.99) = ${w99.toFixed(3)}$, $w(.5)+w(.5) = ${sub.toFixed(2)}$. TK92: $\\gamma = 0.61$ for gains, $0.69$ for losses.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Phenomenon', name: 'The fourfold pattern of risk attitudes',
      statement: String.raw`Risk attitudes depend jointly on the sign of the outcome and on its probability:

- **high-probability gains**: risk aversion (take a sure \$9,500 rather than a 95% chance of \$10,000);
- **low-probability gains**: risk seeking (lottery tickets: prefer a 5% chance of \$10,000 to a sure \$500);
- **high-probability losses**: risk seeking (gamble on a 95% chance of losing \$10,000 rather than accept a sure loss of \$9,500);
- **low-probability losses**: risk aversion (insurance: pay a sure \$500 rather than face a 5% chance of losing \$10,000).

In Tversky and Kahneman's (1992) experiment, the median cash equivalent of a 5% chance of \$100 was \$14 and of a 95% chance \$78; for losses, −\$8 and −\$84. Across 25 subjects, 78% of choices were risk seeking for gains with $p\le0.1$, 88% risk averse for gains with $p\ge0.5$, 80% risk averse for losses with $p\le0.1$ and 87% risk seeking for losses with $p\ge0.5$; 22 subjects showed the whole pattern.`,
      scope: String.raw`Found for moderate monetary stakes with stated probabilities. The low-probability cells weaken for very large outcomes (few would gamble a sure \$1 million against a 5% chance of \$20 million) and reverse when rare events are learned from experience.`,
      idea: String.raw`The certainty equivalent of a chance $p$ of $x$ is $c=w(p)^{1/\alpha}x$, combining the value function (behav-2.3) and the weighting function (behav-2.4). For moderate and large $p$, $w(p)<p$ and concavity both push $c$ below the expected value for gains (risk aversion), while for losses the convexity of $v$ and $w(p)<p$ make the gamble less painful than the sure loss (risk seeking). For small $p$, overweighting $w(p)>p$ dominates and reverses both attitudes. Kahneman named the cells by their emotions: fear of disappointment, hope of large gain, hope to avoid loss, fear of large loss.`,
      caption: String.raw`Answer the four choices first. The middle grid then shows the model's verdict in each cell: the certainty equivalent of the gamble against its expected value, coloured orange for risk seeking and blue for risk averse, with the share of choices of the same type in Tversky and Kahneman's data. The right panel shows why: the model's $c/x$ for gains (blue) and $|c/x|$ for losses (red) against $p$, with their medians (dots). Above the diagonal is risk seeking for gains but risk averse for losses. Drag $\gamma$ or $\delta$ to 1 and the low-probability cells flip back.`,
      deps: ['behav-2.3', 'behav-2.4'], refs: ['Kahneman ch. 29'], tags: ['prospect theory', 'risk', 'insurance'],
      see: ['behav-2.7'],
      credit: 'Tversky & Kahneman, 1992',
      viz(v) {
        const gS = v.slider('weighting, gains $\\gamma$', 0.3, 1.2, 0.61, { step: 0.01 });
        const dS = v.slider('weighting, losses $\\delta$', 0.3, 1.2, 0.69, { step: 0.01 });
        const aS = v.slider('value curvature $\\alpha = \\beta$', 0.4, 1, 0.88, { step: 0.01 });
        const pH = v.slider('high probability', 0.6, 0.99, 0.95, { step: 0.01 }), pL = v.slider('low probability', 0.01, 0.3, 0.05, { step: 0.01 });
        const X = 10000;
        const C = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 200, full: true, title: 'four choices: click the option you prefer in each cell' });
        const Q = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 290, title: 'the model’s verdict and the 1992 data' });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'probability p of the outcome', ylabel: 'c / x', title: 'certainty equivalent as a share of the outcome' });
        const ans = {}; // key 'hg' etc → 'gamble' | 'sure'
        const CELL = { hg: [14, 21, 56, 35.5], hl: [57.5, 21, 99.5, 35.5], lg: [14, 2, 56, 16.5], ll: [57.5, 2, 99.5, 16.5] };
        C.onClick((x, y) => { for (const k in CELL) { const [L, R] = halves(CELL[k]); if (inside(L, x, y)) ans[k] = 'gamble'; else if (inside(R, x, y)) ans[k] = 'sure'; } });
        const DATA = { hg: [88, 'averse'], lg: [78, 'seeking'], hl: [87, 'seeking'], ll: [80, 'averse'] };
        v.legend([['blue', 'gains: $c/x = w^+(p)^{1/\\alpha}$'], ['red', 'losses: $|c/x| = w^-(p)^{1/\\alpha}$'], ['blue', 'TK92 medians, gains', { dot: true }], ['red', 'TK92 medians, losses', { dot: true }]]);
        let st = {};
        v.render(() => {
          const g = gS.value, d = dS.value, a = aS.value, ph = pH.value, pl = pL.value;
          const ce = (p, sgn) => sgn * Math.pow(wTK(p, sgn > 0 ? g : d), 1 / a) * X;
          // ---- choice cells
          C.text('gains', 35, 38, { align: 'center', size: 12.5, weight: 700, color: 'blue' });
          C.text('losses', 78.5, 38, { align: 'center', size: 12.5, weight: 700, color: 'red' });
          C.text(`${Math.round(ph * 100)}% chance`, 1, 28.3, { size: 12, weight: 700 }); C.text('(high)', 1, 24.8, { size: 11, color: 'muted' });
          C.text(`${Math.round(pl * 100)}% chance`, 1, 9.3, { size: 12, weight: 700 }); C.text('(low)', 1, 5.8, { size: 11, color: 'muted' });
          for (const k in CELL) {
            const p = k[0] === 'h' ? ph : pl, sgn = k[1] === 'g' ? 1 : -1, [L, R] = halves(CELL[k]);
            const ev = Math.round(p * X);
            const tl = [sgn > 0 ? `${Math.round(p * 100)}% chance to` : `${Math.round(p * 100)}% chance to`, sgn > 0 ? 'win $10,000' : 'lose $10,000'];
            const tr = [sgn > 0 ? `win ${usdC(ev)}` : `lose ${usdC(ev)}`, 'for sure'];
            [[L, tl, 'gamble'], [R, tr, 'sure']].forEach(([r, t, key]) => {
              const on = ans[k] === key;
              C.rect(r[0], r[1], r[2], r[3], { fill: on ? 'accent' : 'panel', fillAlpha: on ? 0.14 : 1, color: on ? 'accent' : 'faint', width: on ? 2.2 : 1, radius: 8 });
              t.forEach((s, i) => C.text(s, (r[0] + r[2]) / 2, r[3] - 4.8 - 4.6 * i, { align: 'center', size: 12, weight: on ? 700 : 500 }));
            });
          }
          // ---- verdict grid
          Q.text('gains', 38, 38, { align: 'center', size: 12, weight: 700, color: 'blue' });
          Q.text('losses', 78, 38, { align: 'center', size: 12, weight: 700, color: 'red' });
          Q.text('high p', 1, 27, { size: 11.5, weight: 700 }); Q.text('low p', 1, 9, { size: 11.5, weight: 700 });
          const QC = { hg: [17, 19, 58.5, 35.5], hl: [60, 19, 99.5, 35.5], lg: [17, 1, 58.5, 17.5], ll: [60, 1, 99.5, 17.5] };
          const verdict = {};
          for (const k in QC) {
            const p = k[0] === 'h' ? ph : pl, sgn = k[1] === 'g' ? 1 : -1, c = ce(p, sgn), ev = sgn * p * X;
            const seek = c > ev + 1e-6, avert = c < ev - 1e-6, r = QC[k];
            verdict[k] = seek ? 'seeking' : avert ? 'averse' : 'neutral';
            const inten = clamp(Math.abs(c - ev) / (0.6 * p * X + 50), 0.15, 0.6);
            Q.rect(r[0], r[1], r[2], r[3], { fill: seek ? 'orange' : avert ? 'blue' : 'grid', fillAlpha: inten, color: seek ? 'orange' : avert ? 'blue' : 'faint', width: 1.4, radius: 8 });
            const cx = (r[0] + r[2]) / 2;
            Q.text(seek ? 'risk seeking' : avert ? 'risk averse' : 'risk neutral', cx, r[3] - 3.6, { align: 'center', size: 12.5, weight: 800, color: 'ink', halo: false });
            Q.text(`CE ${num(c)} · EV ${num(ev)}`, cx, r[3] - 8, { align: 'center', size: 10.5, color: 'ink', halo: false });
            const [dp, dk] = DATA[k];
            Q.text(`1992 data: ${dp}% ${dk}`, cx, r[3] - 12, { align: 'center', size: 10.5, weight: 700, color: 'ink', halo: false });
            if (ans[k]) Q.text(`you: ${ans[k] === 'gamble' ? 'seeking' : 'averse'}`, cx, r[3] - 15.6, { align: 'center', size: 10.5, weight: 700, color: 'accent', halo: false });
          }
          // ---- c/x against p
          P.line(0, 0, 1, 1, { color: 'faint', width: 1.4, dash: [6, 4] });
          P.fn((p) => Math.pow(wTK(p, g), 1 / a), { color: 'blue', width: 2.4, domain: [0.001, 0.999], n: 300 });
          P.fn((p) => Math.pow(wTK(p, d), 1 / a), { color: 'red', width: 2.4, domain: [0.001, 0.999], n: 300 });
          for (const [x, p, c] of T3) P.dot(p, c / x, { r: 3.8, color: x > 0 ? 'blue' : 'red', alpha: 0.85 });
          P.vline(ph, GUIDE); P.vline(pl, GUIDE);
          P.text('above: seeking (gains),', 0.03, 0.93, { size: 10.5, color: 'muted' });
          P.text('averse (losses)', 0.03, 0.87, { size: 10.5, color: 'muted' });
          P.text('below: averse (gains),', 0.97, 0.12, { size: 10.5, color: 'muted', align: 'right' });
          P.text('seeking (losses)', 0.97, 0.06, { size: 10.5, color: 'muted', align: 'right' });
          st = { verdict, n: Object.keys(ans).length };
        });
        v.readout(() => {
          const { verdict, n } = st; if (!verdict) return '';
          const four = verdict.hg === 'averse' && verdict.lg === 'seeking' && verdict.hl === 'seeking' && verdict.ll === 'averse';
          const you = n < 4 ? `Answer all four cells (${n} of 4 so far).` : (() => { const m = ['hg', 'lg', 'hl', 'll'].filter((k) => (ans[k] === 'gamble' ? 'seeking' : 'averse') === DATA[k][1]).length; return `You match the fourfold pattern in **${m} of 4** cells${m === 4 ? ', like 22 of the 25 subjects in 1992' : ''}.`; })();
          return `${you} With these parameters the model ${four ? '**reproduces the whole fourfold pattern**' : 'does **not** produce the full pattern'} (gains: high p ${verdict.hg}, low p ${verdict.lg}; losses: high p ${verdict.hl}, low p ${verdict.ll}). Expected value ($\\gamma=\\delta=\\alpha=1$) is neutral everywhere; concavity alone ($\\gamma=\\delta=1$, $\\alpha<1$) gives risk aversion for every gain and risk seeking for every loss, never the low-probability cells.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Phenomenon', name: 'The certainty effect explains Allais',
      statement: String.raw`**Certainty effect**: outcomes obtained with certainty are overweighted relative to outcomes that are merely probable. In Kahneman and Tversky's (1979) version of the Allais paradox, 82% of 72 respondents preferred 2,400 for sure (B) to a gamble paying 2,500 with probability .33, 2,400 with .66 and nothing with .01 (A); yet 83% preferred 2,500 with probability .33 (C) to 2,400 with probability .34 (D). Expected utility forces $B\succ A \iff D\succ C$. In (cumulative) prospect theory the gamble A receives the weight $1-w(0.99)$ for its 1% chance of nothing, whereas removing the common 66% chance of 2,400 changes the weights only in the flat middle of the weighting function: with $\gamma=0.61$, the last 1% before certainty carries weight $1-w(0.99)=0.088$, ten times the $w(0.34)-w(0.33)=0.008$ that the same 1% receives in the middle. The model predicts B and C. Allais's original prizes (100 and 500 million francs) need, in addition, much stronger curvature of value over millions.`,
      scope: String.raw`The weighting function explains common-consequence and common-ratio violations with stated probabilities. Whether a given parameter set predicts the pattern depends on both the weighting and the curvature, and the effect weakens with real payoffs and transparent presentations.`,
      idea: String.raw`Write the decision weights under cumulative prospect theory (behav-2.8). In choice 1 the sure option has $\pi=w(1)=1$, while the gamble spreads only $w(0.99)\approx0.91$ over its positive outcomes: certainty is worth a bonus of almost 9% of the decision weight. In choice 2 both options sit in the middle of the curve, where $w$ is nearly linear and both shrink by about the same factor. Expected utility (behav-1.3) weights probabilities linearly, so the common 66% (or 89%) cancels out and the two choices must agree (behav-1.11). The inverse-S weighting function (behav-2.4) is what lets them disagree.`,
      caption: String.raw`Choose in both pairs first (pick the problem with the selector). Left: the weighting function, with the two 1% slices that matter, the last 1% before certainty and a 1% step in the middle, and their weights compared in the inset. Right: every combination of weighting $\gamma$ and value curvature $\alpha$, coloured by the pair of choices cumulative prospect theory predicts. Drag the handle: purple is the certainty-effect pattern (safe in pair 1, risky in pair 2). The right edge $\gamma=1$ is expected utility with a power utility: never purple.`,
      deps: ['behav-2.4', 'behav-1.11'], refs: ['Kahneman ch. 29'], tags: ['prospect theory', 'Allais', 'certainty effect'],
      see: ['behav-2.13', 'behav-1.16', 'behav-2.8'],
      credit: 'Allais, 1953; Kahneman & Tversky, 1979',
      viz(v) {
        const PROB = {
          kt: { unit: '', pairs: [['A', [[2500, 0.33], [2400, 0.66], [0, 0.01]]], ['B', [[2400, 1]]], ['C', [[2500, 0.33], [0, 0.67]]], ['D', [[2400, 0.34], [0, 0.66]]]], safe1: 'B', risky2: 'C', data: { A: 18, B: 82, C: 83, D: 17 }, mid: [0.33, 0.34], col: { 0: 'faint', 2400: 'teal', 2500: 'purple' } },
          al: { unit: 'M', pairs: [['A', [[100, 1]]], ['B', [[500, 0.1], [100, 0.89], [0, 0.01]]], ['C', [[100, 0.11], [0, 0.89]]], ['D', [[500, 0.1], [0, 0.9]]]], safe1: 'A', risky2: 'D', data: null, mid: [0.1, 0.11], col: { 0: 'faint', 100: 'teal', 500: 'purple' } },
        };
        const pr = v.select('problem', [{ value: 'kt', label: 'Kahneman–Tversky 1979: 2,400 / 2,500' }, { value: 'al', label: 'Allais 1953: 100M / 500M francs' }], 'kt', { onChange: () => { ans[1] = ans[2] = null; } });
        const C = v.stage({ x: [0, 100], y: [0, 44], axes: false, height: 214, full: true });
        const W = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'probability p', ylabel: 'w(p)', title: 'where the weighting function is steep' });
        const R = v.stage({ x: [0.3, 1], y: [0.05, 1], axes: 'box', gutter: true, height: 330, xlabel: 'probability weighting γ (1 = linear)', ylabel: 'value curvature α', title: 'what CPT predicts for each (γ, α)' });
        const h = R.handle(0.61, 0.88, { color: 'ink', r: 8, constrain: (x, y) => [clamp(x, 0.3, 1), clamp(y, 0.05, 1)] });
        const ans = { 1: null, 2: null };
        const RECT = { A: [2, 24.5, 49, 40], B: [51, 24.5, 98, 40], C: [2, 3, 49, 18.5], D: [51, 3, 98, 18.5] };
        C.onClick((x, y) => { for (const k in RECT) if (inside(RECT[k], x, y)) ans[k < 'C' ? 1 : 2] = k; });
        const PATCOL = { cert: 'purple', safe: 'green', risky: 'blue', rev: 'red' };
        v.legend([['purple', 'certainty-effect pattern', { dot: true }], ['green', 'safe in both', { dot: true }], ['blue', 'risky in both', { dot: true }], ['red', 'the reverse pattern', { dot: true }]]);
        const predict = (P, g, a) => {
          const par = { a, b: a, l: 2.25, g, d: g };
          const V = Object.fromEntries(P.pairs.map(([k, L]) => [k, cptValue(L, par)]));
          const c1 = V.A > V.B ? 'A' : 'B', c2 = V.C > V.D ? 'C' : 'D';
          const s1 = c1 === P.safe1, r2 = c2 === P.risky2;
          return { V, c1, c2, pat: s1 && r2 ? 'cert' : s1 ? 'safe' : r2 ? 'risky' : 'rev' };
        };
        let st = {};
        v.render(() => {
          const P = PROB[pr.value], g = h.x, a = h.y, u = P.unit;
          const fmt = (x) => (x === 0 ? 'nothing' : num(x) + u);
          // ---- cards
          C.text('choice 1', 50, 42.6, { align: 'center', size: 11, color: 'muted', weight: 600 });
          C.text('choice 2', 50, 21.2, { align: 'center', size: 11, color: 'muted', weight: 600 });
          const pred = predict(P, g, a);
          for (const [k, L] of P.pairs) {
            const pair = k < 'C' ? 1 : 2;
            const lines = L.filter(([x]) => x > 0).map(([x, p]) => (p >= 1 ? `${fmt(x)} for sure` : `${fmt(x)} with probability ${String(p).replace(/^0/, '')}`));
            const segs = L.slice().sort((A2, B2) => A2[0] - B2[0]).map(([x, p]) => [p, P.col[x], p >= 0.2 ? `${fmt(x)}: ${Math.round(p * 100)}%` : '']);
            const dat = P.data && ans[pair] ? ` · 1979: ${P.data[k]}%` : '';
            card(C, RECT[k], { tag: k, lines, segs, chosen: ans[pair] === k, dim: ans[pair] && ans[pair] !== k, sub: `CPT value ${pred.V[k].toFixed(1)}${(pair === 1 ? pred.c1 : pred.c2) === k ? ' ◀ predicted' : ''}${dat}` });
          }
          // ---- weighting function and the two slices
          const w = (p) => wTK(p, g);
          W.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [5, 4] });
          W.fn(w, { color: 'blue', width: 2.6, domain: [0, 1], n: 400 });
          const [m0, m1] = P.mid;
          W.rect(0.99, w(0.99), 1, 1, { fill: 'purple', fillAlpha: 0.6, color: 'purple', width: 2 });
          W.rect(m0, w(m0), m1, w(m1), { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 2 });
          W.line(0.99, w(0.99), 0.99, 0, { color: 'purple', width: 1, dash: [3, 3] });
          W.line(m0, w(m0), m0, 0, { color: 'orange', width: 1, dash: [3, 3] });
          const certW = 1 - w(0.99), midW = w(m1) - w(m0);
          // inset bars
          const bx = 0.5, bw = 0.42, by = 0.06;
          W.rect(bx - 0.02, by - 0.03, bx + bw + 0.02, by + 0.27, { fill: 'panel', fillAlpha: 0.9, color: 'faint', width: 1, radius: 6 });
          W.text('weight of a 1% slice', bx, by + 0.23, { size: 10.5, weight: 700, color: 'muted' });
          const sc = bw / Math.max(0.12, certW * 1.15);
          W.rect(bx, by + 0.12, bx + certW * sc, by + 0.17, { fill: 'purple', fillAlpha: 0.7, stroke: false });
          W.text(`.99 → 1: ${certW.toFixed(3)}`, bx + certW * sc, by + 0.145, { dx: 4, size: 10.5, weight: 700, color: 'purple' });
          W.rect(bx, by + 0.02, bx + Math.max(0.002, midW * sc), by + 0.07, { fill: 'orange', fillAlpha: 0.7, stroke: false });
          W.text(`${m0} → ${m1}: ${midW.toFixed(3)}`, bx + midW * sc, by + 0.045, { dx: 4, size: 10.5, weight: 700, color: 'orange' });
          // ---- prediction map
          const RC = Object.fromEntries(Object.entries(PATCOL).map(([k, c]) => [k, v.ramp(0.42, c)]));
          R.raster((x, y) => RC[predict(P, x, y).pat], { res: 3, key: pr.value });
          R.vline(1, { color: 'ink', width: 2.4 });
          R.text('expected utility', 0.985, 0.5, { align: 'right', size: 10.5, weight: 700, color: 'ink', plate: true });
          R.dot(0.61, 0.88, { r: 4, color: 'ink', hollow: true });
          R.text('TK92', 0.61, 0.88, { dx: 12, dy: 12, size: 10.5, weight: 700, color: 'ink', plate: true });
          st = { P, pred, g, a, certW, midW };
        });
        v.readout(() => {
          const { P, pred, g, a, certW, midW } = st; if (!P) return '';
          const you = !ans[1] || !ans[2] ? 'Choose in both pairs first. ' : `You chose **${ans[1]}** and **${ans[2]}**: ${ans[1] === P.safe1 && ans[2] === P.risky2 ? 'the certainty-effect pattern, which no expected-utility maximizer can show.' : (ans[1] === P.safe1) === (ans[2] !== P.risky2) ? 'consistent with expected utility.' : 'the reverse pattern.'} `;
          const name = { cert: 'the certainty-effect pattern', safe: 'the safe option in both pairs', risky: 'the risky option in both pairs', rev: 'the reverse pattern' }[pred.pat];
          return `${you}At $\\gamma = ${g.toFixed(2)}$, $\\alpha = ${a.toFixed(2)}$ CPT predicts **${pred.c1}** and **${pred.c2}**, ${name}. The last 1% before certainty weighs ${certW.toFixed(3)}, the 1% step from ${P.mid[0]} to ${P.mid[1]} only ${midW.toFixed(3)} (${(certW / Math.max(1e-9, midW)).toFixed(1)}×). ${P.data ? 'The 1979 respondents: 82% B, 83% C.' : 'With TK92’s $\\alpha = 0.88$ the 500 million is too attractive; the purple region needs $\\alpha$ below about 0.25 at $\\gamma = 0.61$.'}`;
        });
      },
    },
  ],
};
