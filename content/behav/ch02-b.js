// Behavioural Economics — Chapter 2: Prospect theory and reference dependence (items 2.7–2.12; 2.1–2.6 in ch02.js)
//
// Sources checked (Oct 2026):
// - Kahneman & Tversky 1979, Table I (Problems 3, 4, 7, 8 and their reflections; N = 95, 95, 66, 66), as checked for
//   ch02-papers.js.
// - Kahneman, Knetsch & Thaler 1990, J. Polit. Econ. 98: 1325–1348 (scanned text): experiment 1, 44 Cornell law-and-economics
//   students, 22 mugs (bookstore price $6.00), expected trades 11; mug trials 4–7: trades 4, 1, 2, 2; median buyer reservation
//   prices 2.75, 2.25, 2.25, 2.25 and median seller prices 5.25 in every trial; induced-value tokens traded 12, 11, 10 of 11
//   expected. Experiment 6 (77 Simon Fraser students): medians $7.12 sellers, $3.12 choosers, $2.87 buyers; 3 trades of
//   12.5 expected. Experiment 7 (117 UBC students): $7.00, $3.50, $2.00; 1 trade of 19 expected.
// - Plott & Zeiler 2005, Am. Econ. Rev. 95: 530–545, working-paper version (Caltech SSWP 1132, revised), Tables 1 and 3:
//   every individual WTP and WTA response, reproduced below. Replication of KKT's procedures: WTP mean $1.74 (n = 29),
//   WTA mean $4.72 (n = 29). With training, practice, anonymity and BDM elicitation (experiments 1 and 3, with binding
//   lottery experience): WTP means $5.20 and $7.29, WTA means $5.69 and $5.06.
// - Samuelson & Zeckhauser 1988, J. Risk Uncertainty 1: 7–59 (scanned text): the investment question (Question 2) and
//   Tables 1a–1c (pairs, triples, quads) of choice shares as status quo / neutral / alternative to the status quo;
//   pooled regression SQ = .17 + .83 NEUT, ASQ = .83 NEUT (Table 2b).
// - Odean 1998, J. Finance 53: 1775–1798 (author's PDF): 10,000 discount-brokerage accounts 1987–1993; Table I PGR 0.148,
//   PLR 0.098 for the whole year (Dec.: 0.108 / 0.128; Jan.–Nov.: 0.152 / 0.094); winners sold beat losers held by 3.4%
//   over the following year.
// - Benartzi & Thaler, NBER WP 4369 (1993; QJE 1995): CRSP 1926–1990 monthly returns resampled; stocks and five-year bonds
//   have equal prospective utility at an evaluation period of 11–12 months (nominal), between 9 and 12 months in all four
//   comparisons; optimal one-year portfolio about 50% stocks; 6.5% real equity premium consistent with a one-year period,
//   4.65% for two years, 3.0, 2.0, 1.4% for 5, 10, 20 years.
// - Not verified from the original: the New Jersey / Pennsylvania insurance-default figures (20% and 75%), quoted from
//   Xiao et al. 2021 (Meta-Psychology 5) citing Johnson et al. 1993; the default return parameters of the 2.12 stand-in
//   (stocks about 10% a year with 20% volatility, bonds 5% with 6%) are rough values from memory, not BT's data.
import { clamp, inside, num, pct, usdC, usdR, wTK, vPT, vInv, TK92, cptValue, cptWeights, optValue, EV, ninv, card, hbars, halves } from './ch02.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
/** Market clearing for one unit per trader: buyers' WTP sorted down, sellers' WTA up; trades = largest k with b_k ≥ s_k. */
function clear(wtp, wta) {
  const b = [...wtp].sort((x, y) => y - x), s = [...wta].sort((x, y) => x - y);
  let k = 0; while (k < Math.min(b.length, s.length) && b[k] >= s[k]) k++;
  const price = k > 0 ? (Math.max(s[k - 1], k < b.length ? b[k] : 0) + Math.min(b[k - 1], k < s.length ? s[k] : 1e9)) / 2 : null;
  return { k, b, s, price };
}
/** CPT value of n equally likely outcomes (rank-dependent weights from TK92-type weighting). */
function cptEq(xs, a, l, g, d) {
  const N = xs.length, s = Float64Array.from(xs).sort();
  let V = 0, nl = 0; while (nl < N && s[nl] < 0) nl++;
  for (let j = 0; j < nl; j++) V += (wTK((j + 1) / N, d) - wTK(j / N, d)) * -l * Math.pow(-s[j], a);
  for (let i = 0; i < N - nl; i++) V += (wTK((i + 1) / N, g) - wTK(i / N, g)) * Math.pow(s[N - 1 - i], a);
  return V;
}

// Plott & Zeiler (2005), individual mug valuations in dollars.
const PZ = {
  rep: { wtp: [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1, 1.5, 2, 2, 2, 2, 2, 2.5, 2.5, 2.5, 3, 3, 3.5, 4.5, 5, 5],
    wta: [0, 1.5, 2, 2, 2.5, 2.5, 3, 3.5, 3.5, 3.5, 3.5, 3.5, 4, 4.5, 4.5, 5.5, 5.5, 5.5, 6, 6, 6, 6.5, 7, 7, 7, 7.5, 7.5, 7.5, 8.5] },
  ctl: { wtp: [0, 1, 1.62, 3.5, 4, 4, 4.17, 5, 6, 6, 6.5, 8, 8.75, 9.5, 10, 2.5, 5.85, 6, 7.5, 8, 8.5, 8.5, 8.78, 10],
    wta: [0, 0.01, 3, 3.75, 3.75, 3.75, 5, 5, 5, 6, 6, 6, 7, 11, 12, 13.75, 3, 3, 3.5, 3.5, 5, 5, 7.5, 10] },
};

// Samuelson & Zeckhauser (1988) Tables 1a–1c: [question, option, SQ, NEUT, ASQ].
const SZT = {
  2: [[1, '60-40', 0.61, 0.46, 0.24], [1, '50-50', 0.76, 0.54, 0.39], [1, '30-70', 0.62, 0.47, 0.38], [1, '70-30', 0.62, 0.53, 0.38],
    [2, 'moderate risk', 0.63, 0.6, 0.44], [2, 'high risk', 0.56, 0.4, 0.37], [2, 'Treasury bills', 0.51, 0.53, 0.37], [2, 'moderate risk', 0.63, 0.47, 0.49],
    [3, '$120K', 0.75, 0.68, 0.63], [3, '$125K', 0.37, 0.32, 0.25], [3, '$115K', 0.95, 0.86, 0.72], [3, '$125K', 0.28, 0.14, 0.05],
    [4, 'E. Coast', 0.8, 0.74, 0.21], [4, 'W. Coast 1', 0.79, 0.26, 0.2], [4, 'W. Coast 2', 0.8, 0.77, 0.68], [4, 'Midwest', 0.32, 0.23, 0.2],
    [5, 'sparse 1500', 0.65, 0.62, 0.32], [5, 'dense 1000', 0.68, 0.38, 0.35], [5, 'dense 2000', 0.5, 0.33, 0.36], [5, 'sparse 1500', 0.64, 0.67, 0.5],
    [6, 'silver', 0.67, 0.7, 0.62], [6, 'red', 0.38, 0.3, 0.33], [6, 'tan', 0.4, 0.56, 0.52], [6, 'white', 0.48, 0.44, 0.6]],
  3: [[1, '60-40', 0.42, 0.35, 0.19], [1, '50-50', 0.5, 0.4, 0.3], [1, '30-70', 0.35, 0.25, 0.2],
    [2, 'moderate risk', 0.38, 0.35, 0.44], [2, 'high risk', 0.5, 0.25, 0.21], [2, 'Treasury bills', 0.33, 0.4, 0.31],
    [3, '$120K', 0.3, 0.17, 0.13], [3, '$125K', 0.25, 0.26, 0.09], [3, '$115K', 0.83, 0.57, 0.56],
    [4, 'E. Coast', 0.8, 0.43, 0.3], [4, 'W. Coast 1', 0.33, 0.17, 0.08], [4, 'W. Coast 2', 0.68, 0.4, 0.2],
    [5, 'sparse 1500', 0.43, 0.41, 0.34], [5, 'dense 1000', 0.22, 0.18, 0.11], [5, 'dense 2000', 0.43, 0.41, 0.51],
    [6, 'silver', 0.5, 0.53, 0.54], [6, 'red', 0.39, 0.33, 0.33], [6, 'tan', 0.18, 0.12, 0.1]],
  4: [[1, '60-40', 0.37, 0.21, 0.06], [1, '50-50', 0.32, 0.21, 0.24], [1, '30-70', 0.54, 0.39, 0.28], [1, '70-30', 0.52, 0.18, 0.16],
    [2, 'moderate risk', 0.39, 0.32, 0.29], [2, 'high risk', 0.28, 0.18, 0.21], [2, 'Treasury bills', 0.29, 0.18, 0.17], [2, 'municipal bonds', 0.47, 0.32, 0.21],
    [3, '$120K', 0.32, 0.16, 0.23], [3, '$125K', 0.26, 0.19, 0.14], [3, '$115K', 0.76, 0.58, 0.45], [3, '$130K', 0.11, 0.06, 0.04],
    [4, 'E. Coast', 0.65, 0.52, 0.29], [4, 'W. Coast 1', 0.12, 0.02, 0.08], [4, 'W. Coast 2', 0.66, 0.39, 0.4], [4, 'Midwest', 0.15, 0.07, 0.09],
    [5, 'sparse 1500', 0.63, 0.41, 0.34], [5, 'dense 1000', 0.17, 0.09, 0.03], [5, 'dense 2000', 0.34, 0.27, 0.33], [5, 'sparse 1500', 0.3, 0.23, 0.17],
    [6, 'silver', 0.76, 0.52, 0.5], [6, 'red', 0.53, 0.22, 0.15], [6, 'tan', 0.13, 0.09, 0.02], [6, 'white', 0.28, 0.17, 0.09]],
};
// The investment question with four options (Table 1c), counts [chose, asked] as SQ, NEUT, ASQ.
const SZQ = [
  { k: 'A', name: 'moderate-risk company A', d: ['in a year: +30% w.p. .5,', 'unchanged .2, −20% .3'], n: [[7, 18], [9, 28], [27, 93]] },
  { k: 'B', name: 'high-risk company B', d: ['in a year: doubles w.p. .4,', 'unchanged .3, −40% .3'], n: [[8, 29], [5, 28], [17, 82]] },
  { k: 'C', name: 'Treasury bills', d: ['a nearly certain', 'return of 9%'], n: [[13, 45], [5, 28], [11, 66]] },
  { k: 'D', name: 'municipal bonds', d: ['a nearly certain', 'tax-free return of 6%'], n: [[9, 19], [9, 28], [19, 92]] },
];

export default {
  collection: 'behav',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Phenomenon', name: 'The reflection effect',
      statement: String.raw`Replacing every gain in a pair of prospects by the equal loss reverses the preference between them: **risk aversion for gains turns into risk seeking for losses**. In Kahneman and Tversky's (1979) Table I, 80% of 95 respondents preferred 3,000 for sure to an 80% chance of 4,000, but 92% preferred an 80% chance of losing 4,000 to a sure loss of 3,000; 86% of 66 preferred a 90% chance of 3,000 to a 45% chance of 6,000, while 92% preferred a 45% chance of losing 6,000 to a 90% chance of losing 3,000. Even the certainty effect reflects: with tiny probabilities (.002 against .001) the majority took the larger gain and the smaller loss. Since the reflected prospects have the same variance, these choices also refute the idea that people dislike variance as such.`,
      scope: String.raw`Observed in hypothetical and real-money choices for moderate stakes; reflection is a tendency, not a law (it is imperfect within individuals, and loss aversion makes mixed prospects behave differently). Risk seeking for losses weakens when the losses are large relative to wealth.`,
      idea: String.raw`The value function (behav-2.3) is concave above the reference point and convex below it, and close to a mirror image of itself (scaled by $\lambda$). A concave branch makes a sure gain worth more than a gamble with the same mean; the mirrored convex branch makes a sure loss hurt more than a gamble with the same mean. Probability weighting (behav-2.4) is roughly the same for gains and losses, so the weighting term reflects too, which is why the certainty effect and its reverse at small probabilities appear on both sides. Framing a choice as gains or as losses therefore flips it (behav-3.3).`,
      caption: String.raw`Answer the four gain problems on the left and their mirror images on the right (click an option). Below left: for each pair, the share of the 1979 respondents who chose the option with the smaller amount, for gains (blue) and losses (red), joined by an arrow; your own choices are the rings at 0% or 100%. Below right: the value function and, dashed, its losses branch reflected into the gains quadrant and divided by $\lambda$; when $\alpha=\beta$ the two coincide, which is the reflection effect in one picture. The dots mark the outcomes of the problem you last clicked, and a dashed purple frame marks the option the model predicts with the sliders' parameters.`,
      deps: ['behav-2.3'], refs: ['Kahneman ch. 26'], tags: ['prospect theory', 'risk', 'framing'],
      see: ['behav-2.13', 'behav-3.3'],
      credit: 'Kahneman & Tversky, 1979',
      viz(v) {
        const PAIRS = [
          { id: '3', N: 95, S: [[3000, 1]], R: [[4000, 0.8]], g: 80, l: 8 },
          { id: '4', N: 95, S: [[3000, 0.25]], R: [[4000, 0.2]], g: 35, l: 58 },
          { id: '7', N: 66, S: [[3000, 0.9]], R: [[6000, 0.45]], g: 86, l: 8 },
          { id: '8', N: 66, S: [[3000, 0.002]], R: [[6000, 0.001]], g: 27, l: 70 },
        ];
        const aS = v.slider('value curvature $\\alpha$ (gains) ', 0.3, 1, 0.88, { step: 0.01 });
        const bS = v.slider('value curvature $\\beta$ (losses)', 0.3, 1, 0.88, { step: 0.01 });
        const gS = v.slider('probability weighting $\\gamma$ (both)', 0.3, 1, 0.65, { step: 0.01 });
        const C = v.stage({ x: [0, 100], y: [0, 42], axes: false, height: 250, full: true, title: 'choose one option in each problem' });
        const D = v.stage({ x: [-6, 103], y: [-0.1, 4.7], axes: false, height: 290, title: 'share choosing the smaller amount (1979)' });
        const Vs = v.stage({ x: [-6.5, 6.5], y: [-1, 1], axes: 'box', gutter: true, height: 290, xlabel: 'outcome (thousands)', ylabel: 'v(x)', title: 'the value function and its mirror image' });
        const ans = {}; let last = 0;
        const rowY = (i) => 34 - i * 9.6, cell = (i, side) => side === 'g' ? [8, rowY(i) - 3.8, 52.5, rowY(i) + 3.8] : [55, rowY(i) - 3.8, 99.5, rowY(i) + 3.8];
        C.onClick((x, y) => { PAIRS.forEach((P, i) => ['g', 'l'].forEach((sd) => { const [L, R] = halves(cell(i, sd), 1); if (inside(L, x, y)) { ans[P.id + sd] = 'S'; last = i; } else if (inside(R, x, y)) { ans[P.id + sd] = 'R'; last = i; } })); });
        const desc = (L, sgn) => L.map(([x, p]) => `${sgn < 0 ? 'lose ' : ''}${num(x)}${p >= 1 ? ' for sure' : ` w.p. ${String(p).replace(/^0/, '')}`}`)[0];
        v.legend([['blue', 'gains', { dot: true }], ['red', 'losses', { dot: true }], ['muted', 'your choices: rings at 0% or 100%', { dot: true }], ['red', 'losses branch reflected: $-v(-x)/\\lambda$', { dash: true }], ['purple', 'option predicted by the model', { dash: true }]]);
        let st = {};
        v.render(() => {
          const a = aS.value, b = bS.value, g = gS.value, par = { a, b, l: 2.25, g, d: g };
          C.text('gains', 30.25, 40.6, { align: 'center', size: 12.5, weight: 700, color: 'blue' });
          C.text('the same problems with losses', 77.25, 40.6, { align: 'center', size: 12.5, weight: 700, color: 'red' });
          let agreeG = 0, agreeL = 0;
          PAIRS.forEach((P, i) => {
            C.text(`Problem ${P.id}`, 1, rowY(i) + 1.2, { size: 11.5, weight: 700 }); C.text(`N = ${P.N}`, 1, rowY(i) - 2.2, { size: 10.5, color: 'muted' });
            ['g', 'l'].forEach((sd) => {
              const sgn = sd === 'g' ? 1 : -1, [L, R] = halves(cell(i, sd), 1), key = P.id + sd;
              const pred = cptValue(P.S.map(([x, p]) => [sgn * x, p]), par) > cptValue(P.R.map(([x, p]) => [sgn * x, p]), par) ? 'S' : 'R';
              const maj = (sd === 'g' ? P.g : P.l) > 50 ? 'S' : 'R';
              if (pred === maj) { if (sd === 'g') agreeG++; else agreeL++; }
              [[L, P.S, 'S'], [R, P.R, 'R']].forEach(([r, pr, k]) => {
                const on = ans[key] === k;
                C.rect(r[0], r[1], r[2], r[3], { fill: on ? 'accent' : 'panel', fillAlpha: on ? 0.14 : 1, color: on ? 'accent' : pred === k ? 'purple' : 'faint', width: on ? 2.2 : pred === k ? 1.6 : 1, dash: pred === k && !on ? [4, 3] : undefined, radius: 7 });
                C.text(desc(pr, sgn), (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, { align: 'center', size: 11.5, weight: on ? 700 : 500, halo: false });
              });
            });
          });
          // ---- dumbbells
          D.line(0, 0.45, 100, 0.45, { color: 'muted', width: 1 });
          for (const t of [0, 25, 50, 75, 100]) { D.line(t, 0.45, t, 0.38, { color: 'muted', width: 1 }); D.text(`${t}%`, t, 0.38, { dy: 9, align: 'center', size: 10.5, color: 'muted' }); }
          D.line(50, 0.5, 50, 4.6, GUIDE);
          PAIRS.forEach((P, i) => {
            const y = 4.2 - i;
            D.text(P.id, -3, y, { align: 'center', size: 12, weight: 700 });
            D.line(0, y, 100, y, { color: 'grid', width: 1 });
            D.arrow(P.g, y, P.l, y, { color: 'muted', width: 1.8 });
            D.dot(P.g, y, { r: 6.5, color: 'blue' }); D.dot(P.l, y, { r: 6.5, color: 'red' });
            D.text(`${P.g}%`, P.g, y, { dy: -13, align: 'center', size: 10.5, weight: 700, color: 'blue' });
            D.text(`${P.l}%`, P.l, y, { dy: -13, align: 'center', size: 10.5, weight: 700, color: 'red' });
            for (const sd of ['g', 'l']) { const c = ans[P.id + sd]; if (c) D.dot(c === 'S' ? 100 : 0, y + (sd === 'g' ? 0.18 : -0.18), { r: 6, hollow: true, width: 2.2, color: sd === 'g' ? 'blue' : 'red' }); }
          });
          // ---- value function and its point reflection
          const lam = 2.25, vf = (x) => vPT(x, a, lam, b);
          const top = Math.pow(6.5, Math.max(a, b)) * 1.15, bot = -lam * Math.pow(6.5, b) * 1.05;
          Vs.setView([-6.5, 6.5], [bot, top]);
          Vs.hline(0, { color: 'muted', width: 1 }); Vs.vline(0, { color: 'muted', width: 1 });
          Vs.fn((x) => (x >= 0 ? vf(x) : NaN), { color: 'blue', width: 2.6, domain: [0, 6.5] });
          Vs.fn((x) => (x <= 0 ? vf(x) : NaN), { color: 'red', width: 2.6, domain: [-6.5, 0] });
          Vs.fn((x) => -vf(-x) / lam, { color: 'red', width: 1.8, dash: [7, 4], domain: [0, 6.5] });
          const P = PAIRS[last];
          for (const [x] of [...P.S, ...P.R]) {
            const X = x / 1000;
            Vs.line(X, 0, X, vf(X), GUIDE); Vs.line(-X, 0, -X, vf(-X), GUIDE);
            Vs.dot(X, vf(X), { r: 5, color: 'blue' }); Vs.dot(-X, vf(-X), { r: 5, color: 'red' });
            Vs.dot(X, -vf(-X) / lam, { r: 4, color: 'red', hollow: true, width: 2 });
          }
          Vs.text(`Problem ${P.id}: outcomes ±${[...new Set([...P.S, ...P.R].map(([x]) => num(x)))].join(', ±')}`, -6.3, top * 0.86, { size: 11, weight: 700, color: 'ink' });
          Vs.text(Math.abs(a - b) < 0.005 ? 'α = β: the dashed mirror lies on the gains curve' : `α ≠ β: the mirror separates`, -6.3, top * 0.86 - 0.12 * (top - bot), { size: 10.5, color: 'muted' });
          st = { agreeG, agreeL };
        });
        v.readout(() => {
          const { agreeG, agreeL } = st; if (agreeG == null) return '';
          const n = Object.keys(ans).length;
          let flips = 0, pairs = 0;
          for (const P of PAIRS) if (ans[P.id + 'g'] && ans[P.id + 'l']) { pairs++; if (ans[P.id + 'g'] !== ans[P.id + 'l']) flips++; }
          const you = n === 0 ? 'Answer the problems first.' : pairs ? `You reversed your choice in **${flips} of ${pairs}** mirrored pairs${flips === pairs && pairs === 4 ? ': the full reflection effect' : ''}.` : 'Answer a problem and its mirror image to compare.';
          return `${you} With these parameters prospect theory picks the majority option in ${agreeG} of 4 gain problems and ${agreeL} of 4 loss problems. The 1979 majorities reversed in all four pairs (80% → 8%, 35% → 58%, 86% → 8%, 27% → 70% for the smaller amount).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Model', name: 'Cumulative prospect theory',
      statement: String.raw`**Cumulative prospect theory** (Tversky and Kahneman 1992) evaluates a prospect with outcomes $x_1\le\dots\le x_k<0\le x_{k+1}\le\dots\le x_n$ and probabilities $p_i$ by $V=\sum_i\pi_i\,v(x_i)$, where the decision weights are differences of a weighting function applied to **cumulative** probabilities:
$$\pi_i=w^+\big(p_i+\dots+p_n\big)-w^+\big(p_{i+1}+\dots+p_n\big)\ \ (x_i\ge0),\qquad \pi_i=w^-\big(p_1+\dots+p_i\big)-w^-\big(p_1+\dots+p_{i-1}\big)\ \ (x_i<0).$$
A gain is weighted by how much $w^+$ rises when it is added to the better outcomes; a loss by how much $w^-$ rises when it is added to the worse ones. Unlike the original (1979) rule $V=\sum w(p_i)v(x_i)$, the cumulative form always respects **first-order stochastic dominance**, extends to any number of outcomes and to uncertain events, and allows different weighting functions for gains and losses.`,
      scope: String.raw`The same descriptive domain as prospect theory, now for prospects with many outcomes. For gains alone it coincides with Quiggin's rank-dependent utility. It still violates some properties people show (event splitting effects, Birnbaum's violations of coalescing), and it inherits the question of what the reference point is.`,
      idea: String.raw`Weighting each probability separately overweights the many small slices of a split outcome: cutting a 10% chance into ten 1% chances multiplies its total weight because $w(0.01)$ is far above 0.01, so a dominated prospect can win (the 1979 paper needed an editing rule to remove dominated options by hand). Applying $w$ to the decumulative distribution instead makes the weights telescope: however finely an outcome is split, the slices' weights add up to the weight of the whole, and moving probability to better outcomes can only raise $V$, which is first-order dominance (behav-1.9). The weighting function of behav-2.4 now distorts ranks: extreme outcomes, best and worst, get the most weight.`,
      caption: String.raw`Choose first: $A$ pays \$100 with probability 10%; $B$ splits the same 10% into $n$ equal slices paying slightly less (between \$100 − $\varepsilon$ and \$100), so $A$ dominates $B$. Left: the outcomes (stems) with each slice's decision weight (bars) under the model selected. Right: the decumulative distributions $P(X\ge x)$, with $B$ never above $A$ (the dominance), and what each model does to them. Under the original rule, raise $n$ and watch $B$'s total weight grow until it beats $A$; switch to the cumulative rule and the weights of the slices always sum to $w(0.1)$.`,
      deps: ['behav-2.4', 'behav-1.9'], refs: ['W&K ch. 5'], tags: ['prospect theory', 'dominance', 'rank dependence'],
      see: ['behav-2.6'],
      credit: 'Quiggin, 1982; Tversky & Kahneman, 1992',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cumulative_prospect_theory' },
      viz(v) {
        const md = v.select('model', [{ value: 'opt', label: 'original prospect theory (1979)' }, { value: 'cpt', label: 'cumulative prospect theory (1992)' }], 'opt');
        const nS = v.slider('number of slices $n$ in $B$', 1, 20, 10, { int: true });
        const eS = v.slider('shortfall $\\varepsilon$ (dollars)', 0.5, 5, 2, { step: 0.1 });
        const gS = v.slider('weighting $\\gamma$', 0.3, 1, 0.61, { step: 0.01 });
        const C = v.stage({ x: [0, 100], y: [0, 15], axes: false, height: 84, full: true, title: 'which would you rather have?' });
        const S = v.stage({ x: [94.5, 100.6], y: [0, 0.2], axes: 'box', gutter: true, height: 300, xlabel: 'outcome (dollars; both pay 0 otherwise)', ylabel: 'probability / weight', title: 'outcomes and decision weights' });
        const F = v.stage({ x: [94.5, 100.6], y: [0, 0.32], axes: 'box', gutter: true, height: 300, xlabel: 'x (dollars)', ylabel: 'P(X ≥ x)', title: 'decumulative distributions' });
        let pick = null;
        const RA = [1, 1, 49, 13], RB = [51, 1, 99, 13];
        C.onClick((x, y) => { if (inside(RA, x, y)) pick = 'A'; else if (inside(RB, x, y)) pick = 'B'; });
        v.legend([['blue', 'A: probability / weight'], ['orange', 'B: probability / weight'], ['ink', 'stated probability (tick)']]);
        let st = {};
        v.render(() => {
          const n = nS.value, e = eS.value, g = gS.value, par = { a: 0.88, b: 0.88, l: 2.25, g, d: 0.69 };
          const A = [[100, 0.1], [0, 0.9]];
          const B = Array.from({ length: n }, (_, k) => [100 - (e * (n - k)) / n, 0.1 / n]).concat([[0, 0.9]]);
          const cum = md.value === 'cpt';
          card(C, RA, { tag: 'A', lines: ['$100 with probability 10%', 'otherwise nothing'], chosen: pick === 'A', dim: pick === 'B' });
          card(C, RB, { tag: 'B', lines: [n === 1 ? `${usdC(B[0][0], 2)} with probability 10%` : `${n} slices of ${(10 / n).toFixed(2).replace(/\.?0+$/, '')}% each, paying`, n === 1 ? 'otherwise nothing' : `${usdC(B[0][0], 2)} up to ${usdC(B[n - 1][0], 2)}; else nothing`], chosen: pick === 'B', dim: pick === 'A' });
          const wA = cum ? cptWeights(A, par) : A.map(([x, p]) => ({ x, p, pi: wTK(p, g) }));
          const wB = cum ? cptWeights(B, par) : B.map(([x, p]) => ({ x, p, pi: x === 0 ? 0 : wTK(p, g) }));
          const VA = cum ? cptValue(A, par) : optValue(A, par), VB = cum ? cptValue(B, par) : optValue(B, par);
          const sumB = wB.filter((o) => o.x > 0).reduce((s, o) => s + o.pi, 0), sumA = wA.filter((o) => o.x > 0).reduce((s, o) => s + o.pi, 0);
          // ---- stems and weights
          const ymax = Math.max(0.2, sumA * 1.25, ...wB.filter((o) => o.x > 0).map((o) => o.pi * 1.25)), xl = 100 - 1.5 * e - 0.4;
          S.setView([xl, 100.6], [0, ymax]); F.setView([xl, 100.6], [0, 0.32]);
          const bw = Math.min(0.12, (0.8 * e) / Math.max(1, n));
          for (const o of wB) if (o.x > 0) {
            S.rect(o.x - bw / 2, 0, o.x + bw / 2, o.pi, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
            S.line(o.x - bw / 2, o.p, o.x + bw / 2, o.p, { color: 'ink', width: 1.6 });
          }
          const bA = Math.max(0.05, bw) / 2;
          S.rect(100 - bA, 0, 100 + bA, sumA, { fill: 'blue', fillAlpha: 0.55, color: 'blue', width: 1 });
          S.line(100 - 1.6 * bA, 0.1, 100 + 1.6 * bA, 0.1, { color: 'ink', width: 2, dash: [3, 2] });
          S.text('p = 0.1', 100 - 1.6 * bA, 0.1, { dx: -4, align: 'right', size: 10.5, color: 'muted' });
          S.text(`A: weight ${sumA.toFixed(3)}`, 100, sumA, { dx: -6, dy: -10, align: 'right', size: 11, weight: 700, color: 'blue' });
          S.text(`B: total weight ${sumB.toFixed(3)}`, xl + 0.03 * (100.6 - xl), ymax * 0.93, { size: 11.5, weight: 700, color: 'orange' });
          S.text(cum ? 'weights telescope: Σ = w(0.1)' : `n · w(0.1/n) = ${n} × ${wTK(0.1 / n, g).toFixed(3)}`, xl + 0.03 * (100.6 - xl), ymax * 0.85, { size: 11, color: 'muted' });
          // ---- decumulative distributions (and their weighted versions)
          const decA = (x) => (x <= 100 ? 0.1 : 0), decB = (x) => B.filter(([y, p]) => y >= x && y > 0).reduce((s, [, p]) => s + p, 0);
          const tx = xl + 0.03 * (100.6 - xl);
          F.fn(decA, { color: 'blue', width: 2.4, domain: [xl, 100.6], n: 800 });
          F.fn(decB, { color: 'orange', width: 2.4, domain: [xl, 100.6], n: 800 });
          if (cum) {
            F.fn((x) => wTK(decA(x), g), { color: 'blue', width: 1.4, dash: [6, 4], domain: [xl, 100.6], n: 800 });
            F.fn((x) => wTK(decB(x), g), { color: 'orange', width: 1.4, dash: [6, 4], domain: [xl, 100.6], n: 800 });
            F.text('dashed: w applied to P(X ≥ x)', tx, 0.29, { size: 11, color: 'muted' });
          } else F.text('original rule: w applied slice by slice', tx, 0.29, { size: 11, color: 'muted' });
          F.text('B never above A: A dominates', tx, 0.26, { size: 11, weight: 700, color: 'green' });
          st = { VA, VB, sumA, sumB, cum, n };
        });
        v.readout(() => {
          const { VA, VB, sumA, sumB, cum, n } = st; if (VA == null) return '';
          const you = pick ? `You chose **${pick}**${pick === 'A' ? ', respecting dominance.' : ': a dominated option.'} ` : 'Choose first. ';
          return `${you}${cum ? 'Cumulative' : 'Original'} prospect theory: $V(A) = ${VA.toFixed(2)}$, $V(B) = ${VB.toFixed(2)}$, so it prefers **${VA >= VB ? 'A' : 'B'}**${VA < VB ? ' — a violation of first-order dominance' : ''}. Total weight of the 10% chance: ${sumA.toFixed(3)} in $A$, ${sumB.toFixed(3)} in $B$ (${n} slice${n > 1 ? 's' : ''}).${cum ? ' Under the cumulative rule the slices of B add up to exactly the weight of A’s single outcome, and B’s outcomes are smaller, so B always loses.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Phenomenon', name: 'The endowment effect',
      statement: String.raw`People demand much more to give up an object they have been given than they would pay to acquire it: **willingness to accept (WTA) exceeds willingness to pay (WTP)**, and goods allocated at random are traded far less often than standard theory predicts. In Kahneman, Knetsch and Thaler's (1990) experiment 1, 22 of 44 Cornell students were given coffee mugs (bookstore price \$6). If valuations did not depend on ownership, about half the mugs (11) should have changed hands; in four markets only 4, 1, 2 and 2 traded, with median selling prices of \$5.25 against median buying prices of \$2.25–2.75. The same students traded induced-value tokens at the predicted volume. In experiment 6, owners valued the mug at \$7.12 (median), buyers at \$2.87 and "choosers" offered a mug or money at \$3.12: the gap comes from reluctance to sell, not to buy.`,
      scope: String.raw`Robust for consumption goods in the classic designs; small or absent for goods held for exchange (money, tokens, goods bought for resale) and for experienced traders. Plott and Zeiler (2005) replicated the gap with KKT's procedures (mean WTA \$4.72 vs WTP \$1.74) but found none after extensive training, practice rounds, anonymity and an incentive-compatible elicitation (means \$5.56 vs \$6.62 across their three experiments); later work disputes how general that null is.`,
      idea: String.raw`With loss aversion (behav-2.2), giving up the mug is coded as a loss and receiving money as a gain, while for a buyer paying is (in this account) not a loss but getting the mug is a gain. The owner's minimum price is therefore about $\lambda$ times the buyer's maximum, and if owners' values are inflated by a factor $r>1$, fewer owners' asking prices fall below buyers' bids, so volume falls. Standard theory (the Coase theorem: with no transaction costs, the allocation does not depend on who starts with the goods) predicts that random endowment is undone by trade, half the goods moving to those who value them most; induced-value tokens, which carry no endowment effect, trade at exactly that rate.`,
      caption: String.raw`First set your own prices with the two sliders at the top (as an owner, the least you would sell a mug for; as a non-owner, the most you would pay). The icons are a class of 44 like KKT's: owners (left) and non-owners (right), coloured by who trades at the market-clearing price. The chart shows the supply of the owners (their asking prices, orange) and the demand of the non-owners (their bids, blue); trades happen where demand lies above supply. Slide the WTA/WTP ratio from 1 (no endowment effect: about 11 trades) upward and watch trade dry up; switch to Plott and Zeiler's actual responses to see their replication and their null result.`,
      deps: ['behav-2.2'], refs: ['Kahneman ch. 27'], tags: ['endowment effect', 'loss aversion', 'markets'],
      see: ['behav-2.10'],
      credit: 'Thaler, 1980; Kahneman, Knetsch & Thaler, 1990',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endowment_effect' },
      viz(v) {
        const myA = v.slider('YOU, owner: least you would sell the mug for (\\$)', 0, 10, 0, { step: 0.25 });
        const myB = v.slider('YOU, non-owner: most you would pay for it (\\$)', 0, 10, 0, { step: 0.25 });
        const ds = v.select('data', [{ value: 'sim', label: 'simulated class of 44' }, { value: 'rep', label: 'Plott–Zeiler: KKT procedures' }, { value: 'ctl', label: 'Plott–Zeiler: with controls' }], 'sim');
        const rS = v.slider('owners’ WTA ÷ non-owners’ WTP (simulated class)', 1, 3.5, 2.2, { step: 0.05 });
        let seed = 7;
        v.button('new simulated class', () => { seed++; });
        const I = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'who trades' });
        const SD = v.stage({ x: [0, 30], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: 'number of mugs', ylabel: 'price (dollars)', title: 'supply (owners) and demand (non-owners)' });
        const IC = v.icons(I, { n: 44, shape: 'person', order: 'index' });
        v.legend([['orange', 'owners: asking prices (WTA)'], ['blue', 'non-owners: bids (WTP)'], ['green', 'traders', { dot: true }]]);
        let st = {};
        v.render(() => {
          let wtp, wta, label;
          if (ds.value === 'sim') {
            // values lognormal around a $2.20 median (KKT's median bids were $2.25–2.75); owners ask r × their value
            const rr = v.rng(seed), z = () => { let s = 0; for (let k = 0; k < 12; k++) s += rr(); return s - 6; };
            // both groups get the same 22 underlying values (in different random orders), so r = 1 gives exactly 11 trades
            const vals = Array.from({ length: 22 }, () => clamp(2.2 * Math.exp(0.5 * z()), 0.25, 30));
            wta = rr.shuffle(vals.slice()).map((x) => clamp(rS.value * x, 0, 30)); wtp = rr.shuffle(vals.slice());
            label = 'simulated';
          } else { wtp = PZ[ds.value].wtp; wta = PZ[ds.value].wta; label = ds.value === 'rep' ? 'replication of KKT' : 'with training, anonymity'; }
          const { k, b, s, price } = clear(wtp, wta);
          const nS = wta.length, nB = wtp.length, N = nS + nB;
          // ---- icons: owners first (sellers sorted by ask), then non-owners (buyers sorted by bid)
          const sellers = new Set(), buyers = new Set();
          const so = wta.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]), bo = wtp.map((x, i) => [x, i]).sort((p, q) => q[0] - p[0]);
          for (let j = 0; j < k; j++) { sellers.add(so[j][1]); buyers.add(bo[j][1]); }
          IC.set({
            n: N,
            style: (i) => (i < nS ? (sellers.has(i) ? { color: 'green' } : { color: 'orange', alpha: 0.85 }) : (buyers.has(i - nS) ? { color: 'green' } : { color: 'blue', alpha: 0.45 })),
            block: (i) => (i < nS ? 0 : 1), blockLabels: (bk, c) => (bk === 0 ? `owners (${c}): ${k} sell` : `non-owners (${c}): ${k} buy`),
          });
          IC.draw();
          // ---- supply and demand steps
          const qmax = Math.max(nS, nB) + 1, pmax = Math.max(10, ...s.slice(0, Math.min(s.length, 25)).map((x) => x * 1.05), ...b.map((x) => x * 1.05));
          const ptop = Math.min(12, pmax);
          SD.setView([0, qmax], [0, ptop]);
          const step = (arr) => { const pts = []; arr.forEach((y, j) => { pts.push([j, y], [j + 1, y]); }); return pts; };
          SD.path(step(s), { color: 'orange', width: 2.4 });
          SD.path(step(b), { color: 'blue', width: 2.4 });
          if (k > 0) { SD.vband(0, k, { color: 'green', alpha: 0.1 }); SD.vline(k, { color: 'green', width: 1.6 }); SD.text(`${k} trade${k === 1 ? '' : 's'}`, k, 0, { dx: 5, dy: -10, size: 11.5, weight: 700, color: 'green' }); }
          const vstar = Math.min(nS, nB) / 2;
          SD.vline(vstar, GUIDE); SD.text(`no endowment effect: ≈ ${vstar}`, vstar, ptop * 0.96, { dx: 5, size: 10.5, color: 'muted' });
          if (ds.value === 'sim') {
            SD.line(0, 5.25, 0.9, 5.25, { color: 'orange', width: 3 }); SD.line(0, 2.25, 0.9, 2.25, { color: 'blue', width: 3 });
            SD.text('KKT median ask 5.25', 1.1, 5.25, { size: 10, color: 'orange', weight: 700, plate: true });
            SD.text('KKT median bid 2.25', 1.1, 2.25, { dy: 1, size: 10, color: 'blue', weight: 700, plate: true });
          }
          if (myA.value > 0) { SD.hline(myA.value, { color: 'orange', width: 1, dash: [2, 3] }); SD.text('your ask', qmax, myA.value, { dx: -4, dy: -8, align: 'right', size: 10.5, color: 'orange', weight: 700 }); }
          if (myB.value > 0) { SD.hline(myB.value, { color: 'blue', width: 1, dash: [2, 3] }); SD.text('your bid', qmax, myB.value, { dx: -4, dy: 11, align: 'right', size: 10.5, color: 'blue', weight: 700 }); }
          st = { k, vstar, mA: median(wta), mB: median(wtp), meA: mean(wta), meB: mean(wtp), label, price, sim: ds.value === 'sim' };
        });
        v.readout(() => {
          const { k, vstar, mA, mB, meA, meB, label, price, sim } = st; if (k == null) return '';
          const you = myA.value > 0 && myB.value > 0 ? `Your WTA/WTP ratio: **${(myA.value / myB.value).toFixed(2)}** (${usdR(myA.value, 2)} / ${usdR(myB.value, 2)}). ` : 'Set your selling and buying prices first. ';
          const dat = `Here (${label}): **${k} trades** against ≈ ${vstar} without an endowment effect (V/V* = ${(k / vstar).toFixed(2)}); median WTA ${usdR(mA, 2)}, median WTP ${usdR(mB, 2)} (means ${usdR(meA, 2)} and ${usdR(meB, 2)}, ratio ${(meA / Math.max(0.01, meB)).toFixed(2)})${price != null ? `; clearing price ≈ ${usdR(price, 2)}` : ''}.`;
          const ref = sim ? ' KKT 1990, experiment 1: 4, 1, 2, 2 trades of 11 expected; median asks \\$5.25, median bids \\$2.25–2.75.' : ' Plott and Zeiler: with KKT’s procedures the gap is large; with their controls it vanishes.';
          return you + dat + ref;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Phenomenon', name: 'Status quo bias',
      statement: String.raw`Decision makers choose an option more often when it is presented as the **status quo** (the current state, or what happens if they do nothing) than when the same option is one alternative among others. Samuelson and Zeckhauser (1988) gave 486 students the same decision problems in a neutral version and in versions where one option was the status quo. In the investment question (an inheritance to put in a moderate-risk company, a high-risk company, Treasury bills or municipal bonds), each option was chosen more often when it was the existing portfolio than when it was offered neutrally, and less often when another option held that position: municipal bonds 47% as status quo, 32% neutral, 21% as an alternative. Pooling all 66 option–condition cases, the share as status quo was about $0.17+0.83\times$ the neutral share and as an alternative about $0.83\times$ the neutral share. They found the same pattern in the health-plan and retirement choices of Harvard and TIAA–CREF participants.`,
      scope: String.raw`Strong where switching requires an active decision, information is costly or regret looms; weaker when options are trivial or preferences strong. A large pre-registered replication (Xiao et al. 2021) confirmed it in three of four scenarios tested. Defaults in pensions, organ donation and insurance are the field version (behav-12.x); the New Jersey and Pennsylvania car-insurance case (about 20% versus 75% ending up with the full right to sue, depending on the default) is often cited.`,
      idea: String.raw`Several mechanisms push the same way. Loss aversion (behav-2.2) makes the disadvantages of leaving the status quo loom larger than the advantages, since each alternative is evaluated against the current position. The endowment effect (behav-2.9) is the special case of goods already owned. Add transaction and thinking costs, anticipated regret (errors of commission feel worse than errors of omission) and the implicit recommendation carried by an existing arrangement. The SQ advantage grows with the number of alternatives, because the status quo needs no comparison while each new option adds work.`,
      caption: String.raw`Choose a portfolio under the frame you are shown (switch the frame and choose again; the options never change, only which one you already hold). Left: Samuelson and Zeckhauser's choice shares for each option when it was the status quo, when the question was neutral and when another option was the status quo; the bars that apply to the current frame are outlined. Right: all 66 option–condition cases of their Tables 1a–1c, share as status quo (orange) and as alternative (blue) against the neutral share, with their fitted lines. Points above the diagonal are boosted by being the status quo.`,
      deps: ['behav-2.2'], refs: ['W&K ch. 3'], tags: ['status quo bias', 'defaults', 'loss aversion'],
      see: ['behav-2.9'],
      credit: 'Samuelson & Zeckhauser, 1988',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Status_quo_bias' },
      viz(v) {
        const fr = v.select('frame', [{ value: 'N', label: 'neutral' }, { value: 'A', label: 'you hold A' }, { value: 'B', label: 'you hold B' }, { value: 'C', label: 'you hold C' }, { value: 'D', label: 'you hold D' }], 'C');
        const tb = v.select('cases shown on the right', [{ value: 'all', label: 'all 66' }, { value: '2', label: 'pairs' }, { value: '3', label: 'triples' }, { value: '4', label: 'quads' }], 'all');
        const C = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 214, full: true });
        const B = v.stage({ x: [0, 100], y: [-0.6, 10.4], axes: false, height: 300, title: 'investment question: share choosing each option' });
        const Sc = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'share when neutral', ylabel: 'share', title: 'all cases (Tables 1a–1c)' });
        const ans = {};
        const R = { A: [1, 15, 49.5, 29], B: [50.5, 15, 99, 29], C: [1, 1, 49.5, 14], D: [50.5, 1, 99, 14] };
        C.onClick((x, y) => { for (const k in R) if (inside(R[k], x, y)) ans[fr.value] = k; });
        v.legend([['orange', 'as the status quo', { dot: true }], ['faint', 'neutral', { dot: true }], ['blue', 'as an alternative to it', { dot: true }]]);
        let st = {};
        v.render(() => {
          const f = fr.value;
          const head = f === 'N' ? 'You inherited a large sum from your great-uncle and are considering different portfolios:' : `You inherited a portfolio, a large part of it in ${SZQ.find((q) => q.k === f).name}. Keep it, or switch (costs are negligible)?`;
          C.text(head, 1, 37, { size: 12.5, weight: 600 });
          if (f !== 'N') C.text(`Your current holding: ${f}`, 1, 32.4, { size: 11.5, weight: 700, color: 'orange' });
          for (const q of SZQ) {
            const chosen = ans[f] === q.k;
            card(C, R[q.k], { tag: q.k, lines: [q.name + (f === q.k ? '  (current)' : ''), ...q.d], chosen, dim: ans[f] && !chosen, size: 12 });
            if (f === q.k) C.rect(R[q.k][0], R[q.k][1], R[q.k][2], R[q.k][3], { color: 'orange', width: 2, radius: 9, dash: [5, 3] });
          }
          // ---- grouped bars
          const x0 = 25, x1 = 82, MX = 0.6, SHORT = { A: 'moderate risk', B: 'high risk', C: 'T-bills', D: 'municipal bonds' };
          B.line(x0, 0.3, x1, 0.3, { color: 'muted', width: 1 });
          for (const t of [0, 0.2, 0.4, 0.6]) { const xx = x0 + ((x1 - x0) * t) / MX; B.line(xx, 0.3, xx, 0.15, { color: 'muted', width: 1 }); B.text(pct(t), xx, 0.15, { dy: 9, align: 'center', size: 10.5, color: 'muted' }); }
          SZQ.forEach((q, i) => {
            const yb = 9.7 - i * 2.35;
            B.text(`${q.k}: ${SHORT[q.k]}`, x0, yb - 0.85, { dx: -8, align: 'right', size: 11.5, weight: 600 });
            const role = f === 'N' ? 1 : f === q.k ? 0 : 2;
            [['orange', 0], ['faint', 1], ['blue', 2]].forEach(([col, j]) => {
              const [c, n] = q.n[j], sh = c / n, y = yb - 0.3 - j * 0.55;
              B.rect(x0, y - 0.22, x0 + ((x1 - x0) * sh) / MX, y + 0.22, { fill: col, fillAlpha: j === 1 ? 0.9 : 0.7, color: role === j ? 'ink' : col, width: role === j ? 2 : 1 });
              B.text(`${pct(sh)} (${c}/${n})`, x0 + ((x1 - x0) * sh) / MX, y, { dx: 5, size: 10, weight: role === j ? 700 : 500, color: role === j ? 'ink' : 'muted' });
            });
          });
          // ---- scatter
          Sc.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [5, 4] });
          Sc.line(0, 0.17, 1, 1, { color: 'orange', width: 1.8 });
          Sc.line(0, 0, 1, 0.83, { color: 'blue', width: 1.8 });
          const keys = tb.value === 'all' ? ['2', '3', '4'] : [tb.value];
          let nPts = 0, nUp = 0;
          for (const kk of keys) for (const [qq, , sq, ne, asq] of SZT[kk]) {
            Sc.dot(ne, sq, { r: qq === 2 ? 5 : 3.6, color: 'orange', hollow: qq !== 2, width: 1.6 });
            Sc.dot(ne, asq, { r: qq === 2 ? 5 : 3.6, color: 'blue', hollow: qq !== 2, width: 1.6 });
            nPts++; if (sq > asq) nUp++;
          }
          Sc.text('SQ = .17 + .83 · neutral', 0.03, 0.95, { size: 11, weight: 700, color: 'orange' });
          Sc.text('alternative = .83 · neutral', 0.97, 0.06, { size: 11, weight: 700, color: 'blue', align: 'right' });
          Sc.text('filled: the investment question', 0.97, 0.13, { size: 10.5, color: 'muted', align: 'right' });
          st = { nPts, nUp };
        });
        v.readout(() => {
          const { nPts, nUp } = st; if (nPts == null) return '';
          const frames = Object.keys(ans);
          const held = frames.filter((f) => f !== 'N' && ans[f] === f).length, nsq = frames.filter((f) => f !== 'N').length;
          const you = frames.length === 0 ? 'Choose a portfolio first, then switch the frame and choose again.' : `Your choices: ${frames.map((f) => `${f === 'N' ? 'neutral' : 'holding ' + f} → **${ans[f]}**`).join(', ')}.${nsq ? ` You kept the status quo in ${held} of ${nsq} framed versions.` : ''}`;
          return `${you} In the data, an option's share as status quo exceeds its share as an alternative in ${nUp} of the ${nPts} cases shown. The fitted lines give an option with a 25% neutral share 38% as status quo and 21% as an alternative.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Phenomenon', name: 'The disposition effect',
      statement: String.raw`Investors sell assets that have risen in value since purchase (winners) more readily than assets that have fallen (losers). Shefrin and Statman (1985) named it; Odean (1998) measured it in the trades of 10,000 accounts at a US discount broker, 1987–1993. On every day an investor sold something, each stock in the portfolio counted as a realized or paper (unrealized) gain or loss. The **proportion of gains realized** was $\text{PGR}=\frac{\text{realized gains}}{\text{realized}+\text{paper gains}}=0.148$ and the **proportion of losses realized** $\text{PLR}=0.098$: a winner was about 1.5 times as likely to be sold as a loser. The effect reversed only in December, when tax-loss selling pushed PLR (0.128) above PGR (0.108). The winners sold went on to beat the losers kept by 3.4 percentage points over the next year, so the behaviour was costly.`,
      scope: String.raw`Found among individual investors in many countries, in housing (owners hold out for their purchase price), among mutual-fund managers and even professional traders, though weaker for more sophisticated investors. Its explanation is debated: prospect theory with the purchase price as reference point is the classic account, but realization utility and beliefs in mean reversion fit some evidence better.`,
      idea: String.raw`Take the purchase price as the reference point (behav-2.1). A stock that has risen sits in the concave region of the value function (behav-2.3), where the investor is risk averse and prefers to lock in the gain; a stock that has fallen sits in the convex region, where holding on, a gamble that might return to break-even, is preferred to realizing the loss. Mental accounting keeps each stock in its own account, so the losses are not netted against gains. The measure PGR − PLR compares sales with opportunities to sell, so it is not fooled by rising markets that simply create more winners.`,
      caption: String.raw`You hold six stocks, each bought at the price where its line starts (the dashed zero line marks the purchase price). Press **next day** to let prices move; to sell a stock, click its label on the right (it is replaced by a new purchase at today's price). The tally counts, on each day you sell, your realized and paper gains and losses, exactly as Odean did. The bars compare your PGR and PLR with two simulated investors trading the same kind of random prices (a prospect-theory investor who sells whichever position it least wants to keep, and one who sells at random) and with Odean's data.`,
      deps: ['behav-2.3'], refs: ['Kahneman ch. 32'], tags: ['disposition effect', 'finance', 'prospect theory'],
      see: ['behav-2.12'],
      credit: 'Shefrin & Statman, 1985; Odean, 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Disposition_effect' },
      viz(v) {
        const K = 6, SIG = 0.025;
        const aS = v.slider('simulated PT investor: curvature $\\alpha$', 0.3, 1, 0.88, { step: 0.01 });
        let seed = 11, rr, S;
        const fresh = () => { rr = v.rng(seed); S = { day: 0, ref: Array(K).fill(50), px: Array(K).fill(50), path: Array.from({ length: K }, () => [[0, 0]]), start: Array(K).fill(0), tal: { RG: 0, PG: 0, RL: 0, PL: 0 }, sold: [] }; for (let i = 0; i < 12; i++) step(); };
        const gauss = () => { let s = 0; for (let k = 0; k < 12; k++) s += rr(); return s - 6; };
        function step() { S.day++; for (let i = 0; i < K; i++) { S.px[i] *= Math.exp(SIG * gauss() - SIG * SIG / 2); S.path[i].push([S.day, S.px[i] / S.ref[i] - 1]); } }
        fresh();
        const sell = (i) => {
          const gi = S.px[i] / S.ref[i] - 1;
          if (S.sold.some(([d]) => d === S.day)) return; // one sale per day
          for (let j = 0; j < K; j++) { const g = S.px[j] / S.ref[j] - 1; if (j === i) { if (g > 0) S.tal.RG++; else if (g < 0) S.tal.RL++; } else { if (g > 0) S.tal.PG++; else if (g < 0) S.tal.PL++; } }
          S.sold.push([S.day, i, gi]);
          S.ref[i] = S.px[i]; S.start[i] = S.day; S.path[i] = [[S.day, 0]];
        };
        v.button('next day', () => step());
        v.button('next 5 days', () => { for (let k = 0; k < 5; k++) step(); });
        v.button('new portfolio', () => { seed++; fresh(); });
        const P = v.stage({ x: [0, 40], y: [-0.3, 0.3], axes: 'box', gutter: true, height: 320, full: true, xlabel: 'trading day', ylabel: 'gain since purchase', title: 'your portfolio: click a label to sell that stock today' });
        const Bc = v.stage({ x: [0, 100], y: [0, 10], axes: false, height: 250, full: true, title: 'proportion of gains realized (PGR) and of losses realized (PLR)' });
        P.onClick((x, y) => {
          if (x < S.day + 0.5) return;
          let best = -1, bd = 1e9;
          for (const L of labPos) { const d = Math.abs(L.y - P.Y(y)); if (d < bd) { bd = d; best = L.i; } }
          if (best >= 0 && bd < 12) sell(best);
        });
        // simulated investors on random portfolios (same price process)
        const simulate = (kind, a) => {
          const r2 = v.rng(kind === 'pt' ? 101 : 202); const T = { RG: 0, PG: 0, RL: 0, PL: 0 };
          const g2 = () => { let s = 0; for (let k = 0; k < 12; k++) s += r2(); return s - 6; };
          const w5 = wTK(0.5, 0.61), w5l = wTK(0.5, 0.69), h = 0.1;
          for (let run = 0; run < 200; run++) {
            const px = Array(K).fill(50), ref = Array(K).fill(50);
            for (let d = 1; d <= 60; d++) {
              for (let i = 0; i < K; i++) px[i] *= Math.exp(SIG * g2() - SIG * SIG / 2);
              if (r2() > 0.2) continue; // sells on about one day in five
              let pick = 0;
              if (kind === 'pt') {
                // preference for selling: v(g) − V(hold: 50-50 move of ±h around g), evaluated with CPT
                let best = -1e9;
                for (let i = 0; i < K; i++) {
                  const g = 100 * (px[i] / ref[i] - 1), H = 100 * h;
                  const hold = cptValue([[g + H, 0.5], [g - H, 0.5]], { a, b: a, l: 2.25, g: 0.61, d: 0.69 });
                  const pref = vPT(g, a, 2.25) - hold + 1e-9 * r2();
                  if (pref > best) { best = pref; pick = i; }
                }
              } else pick = Math.floor(r2() * K);
              for (let j = 0; j < K; j++) { const g = px[j] / ref[j] - 1; if (j === pick) { if (g > 0) T.RG++; else if (g < 0) T.RL++; } else { if (g > 0) T.PG++; else if (g < 0) T.PL++; } }
              ref[pick] = px[pick];
            }
          }
          return T;
        };
        let cacheA = null, simPT = null; const simRnd = simulate('rnd', 1);
        v.legend([['green', 'gain since purchase'], ['red', 'loss since purchase'], ['green', 'PGR', { dot: true }], ['red', 'PLR', { dot: true }]]);
        let st = {}, labPos = [];
        v.render(() => {
          if (cacheA !== aS.value) { cacheA = aS.value; simPT = simulate('pt', cacheA); }
          const d0 = Math.max(0, S.day - 30), d1 = Math.max(d0 + 22, S.day + 8);
          let lo = -0.12, hi = 0.12;
          for (let i = 0; i < K; i++) for (const [d, g] of S.path[i]) if (d >= d0) { lo = Math.min(lo, g); hi = Math.max(hi, g); }
          P.setView([d0, d1], [lo - 0.03, hi + 0.03]);
          const yt = []; for (let t = Math.ceil((lo - 0.03) / 0.05) * 0.05; t <= hi + 0.03; t += 0.05) yt.push([t, `${Math.round(100 * t)}%`]);
          P.setTicks(null, yt);
          P.hline(0, { color: 'muted', width: 1.2, dash: [5, 4] });
          for (const [d] of S.sold) if (d >= d0) P.vline(d, { color: 'faint', width: 1 });
          for (let i = 0; i < K; i++) {
            const pts = S.path[i].filter(([d]) => d >= d0 - 1), g = S.px[i] / S.ref[i] - 1;
            P.path(pts, { color: g >= 0 ? 'green' : 'red', width: 2 });
            P.dot(S.day, g, { r: 4, color: g >= 0 ? 'green' : 'red' });
          }
          // labels outside the plot area on the right (drawn in pixels, de-overlapped)
          const ctx = P.ctx, labs = [];
          for (let i = 0; i < K; i++) { const g = S.px[i] / S.ref[i] - 1; labs.push({ i, g, y: P.Y(g) }); }
          labs.sort((p, q) => p.y - q.y);
          for (let j = 1; j < labs.length; j++) if (labs[j].y - labs[j - 1].y < 19) labs[j].y = labs[j - 1].y + 19;
          const xL = P.X(S.day) + 26;
          ctx.save(); ctx.font = '600 11.5px system-ui, sans-serif'; ctx.textBaseline = 'middle';
          for (const L of labs) {
            ctx.strokeStyle = v.color(L.g >= 0 ? 'green' : 'red');
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(xL, L.y - 8.5, 96, 17, 5) : ctx.rect(xL, L.y - 8.5, 96, 17);
            ctx.fillStyle = v.color('panel'); ctx.fill(); ctx.fillStyle = v.color(L.g >= 0 ? 'green' : 'red', 0.15); ctx.fill(); ctx.stroke();
            ctx.fillStyle = v.color('ink'); ctx.fillText(`sell #${L.i + 1} ${L.g >= 0 ? '+' : '−'}${Math.abs(100 * L.g).toFixed(1)}%`, xL + 6, L.y);
            ctx.strokeStyle = v.color('faint'); ctx.beginPath(); ctx.moveTo(P.X(S.day) + 5, P.Y(L.g)); ctx.lineTo(xL, L.y); ctx.stroke();
          }
          ctx.restore();
          labPos = labs;
          // ---- bars
          const rate = (T) => ({ pgr: T.RG / Math.max(1, T.RG + T.PG), plr: T.RL / Math.max(1, T.RL + T.PL), n: T.RG + T.RL });
          const you = rate(S.tal), pt = rate(simPT), rnd = rate(simRnd);
          const groups = [['you', you, S.sold.length ? `${S.sold.length} sale${S.sold.length > 1 ? 's' : ''}` : 'no sales yet'], ['simulated PT investor', pt, '200 portfolios'], ['simulated random seller', rnd, '200 portfolios'], ['Odean 1998 (whole year)', { pgr: 0.148, plr: 0.098 }, '10,000 accounts'], ['Odean 1998 (December)', { pgr: 0.108, plr: 0.128 }, 'tax-loss selling']];
          const x0 = 34, x1 = 86, mx = Math.max(0.3, ...groups.map(([, r]) => Math.max(r.pgr, r.plr))) * 1.1;
          groups.forEach(([lab, r, note], i) => {
            const y = 9.2 - i * 1.85;
            Bc.text(lab, x0, y - 0.3, { dx: -8, align: 'right', size: 11.5, weight: i === 0 ? 700 : 600, color: i === 0 ? 'accent' : 'ink' });
            Bc.text(note, x0, y - 0.95, { dx: -8, align: 'right', size: 10, color: 'muted' });
            [['green', r.pgr, 'PGR', 0], ['red', r.plr, 'PLR', 0.62]].forEach(([c, val, nm, off]) => {
              const yy = y - off;
              Bc.rect(x0, yy - 0.26, x0 + ((x1 - x0) * val) / mx, yy + 0.26, { fill: c, fillAlpha: 0.7, color: c, width: 1 });
              Bc.text(`${nm} ${val.toFixed(3)}`, x0 + ((x1 - x0) * val) / mx, yy, { dx: 5, size: 10.5, weight: 700, color: c });
            });
            if (r.plr > 0) Bc.text(`ratio ${(r.pgr / r.plr).toFixed(2)}`, 99, y - 0.3, { align: 'right', size: 11, weight: 700, color: r.pgr > r.plr ? 'green' : 'red' });
          });
          st = { you, pt, rnd, day: S.day };
        });
        v.readout(() => {
          const { you, pt, rnd, day } = st; if (!you) return '';
          const y = you.n ? `Your PGR ${you.pgr.toFixed(3)} and PLR ${you.plr.toFixed(3)} after ${S.sold.length} sales: ${you.pgr > you.plr ? `you realize gains ${(you.pgr / Math.max(1e-9, you.plr)).toFixed(1)}× as readily as losses — the disposition effect` : you.pgr < you.plr ? 'you realize losses more readily than gains (the opposite of the effect)' : 'no difference so far'}.` : `Day ${day}: sell something (click a label) to start your tally.`;
          return `${y} The prospect-theory investor: PGR/PLR = ${(pt.pgr / Math.max(1e-9, pt.plr)).toFixed(2)}; the random seller: ${(rnd.pgr / Math.max(1e-9, rnd.plr)).toFixed(2)} (no effect). Odean's investors: 0.148 / 0.098 = 1.51. Levels depend on portfolio size and how often one trades, so compare ratios.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Model', name: 'Myopic loss aversion (Benartzi–Thaler)',
      statement: String.raw`**Myopic loss aversion** combines loss aversion with frequent evaluation of a portfolio. An investor with prospect-theory preferences (behav-2.3) who evaluates the gains and losses of each holding period of length $h$ dislikes stocks when $h$ is short, because short-period stock returns are often negative and losses weigh about twice as much as gains; over longer periods the probability of a loss shrinks and stocks become attractive. Benartzi and Thaler (1995) resampled US monthly returns for 1926–1990 and found that, with Tversky and Kahneman's 1992 parameters, stocks and bonds have equal prospective value at an evaluation period of about one year (11–12 months for stocks against five-year bonds, in nominal terms). That is, the historical equity premium is what loss-averse investors who look once a year would demand. For a one-year evaluation the best mix was about 50% stocks; the premium consistent with longer evaluation periods would fall from 6.5% a year to 4.65% for two years and 1.4% for twenty.`,
      scope: String.raw`A partial-equilibrium explanation: it asks what evaluation period makes the observed premium an equilibrium, not why prices are what they are. Experiments (Gneezy and Potters 1997; Thaler, Tversky, Kahneman and Schwartz 1997) confirm that people invest less in a risky asset when they see its results more often; the size of the effect outside the laboratory is debated.`,
      idea: String.raw`Over an evaluation period of $h$ months the log return is roughly normal with mean $\mu h$ and standard deviation $\sigma\sqrt h$, so the probability of a loss, about $\Phi(-\mu\sqrt h/\sigma)$, falls as $h$ grows. With loss aversion $\lambda\approx2.25$ (behav-2.2), what matters is how often the evaluator sees red: a daily evaluator sees losses almost half the time, a decade evaluator rarely. Narrow framing in time (each period evaluated on its own) is the myopia; loss aversion makes it costly. The equity-premium puzzle of Mehra and Prescott (a premium far too large for plausible risk aversion under expected utility, compare behav-1.8) becomes a puzzle about how often people look.`,
      caption: String.raw`First pick your share in stocks with the top slider. Left: the distribution of a stock investment's return over the evaluation period (a lognormal stand-in for the historical record, parameters adjustable), with losses in red. Middle: the prospective value of holding all stocks minus all bonds as the evaluation period grows; it crosses zero at the period where a loss-averse investor becomes indifferent (Benartzi and Thaler found about a year with real data). Right: the prospective value of every stock share for the current period, with the best share and yours. Set $\lambda=1$ and the myopia stops mattering.`,
      deps: ['behav-2.2'], refs: ['Kahneman ch. 31'], tags: ['loss aversion', 'finance', 'equity premium'],
      see: ['behav-2.11', 'behav-1.8'],
      credit: 'Benartzi & Thaler, 1995',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equity_premium_puzzle' },
      viz(v) {
        const myW = v.slider('YOUR share in stocks (%)', 0, 100, 50, { step: 5 });
        const hS = v.slider('evaluation period (months)', 1, 120, 12, { log: true, sig: 2 });
        const lS = v.slider('loss aversion $\\lambda$', 1, 3.5, 2.25, { step: 0.05 });
        const muS = v.slider('stocks: mean log return per year', 0.04, 0.14, 0.1, { step: 0.005 });
        const sgS = v.slider('stocks: volatility per year', 0.1, 0.3, 0.2, { step: 0.01 });
        const MB = 0.05, SB = 0.06;
        const D = v.stage({ x: [-60, 100], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'return over the period (%)', ylabel: 'density', title: 'stock returns over one evaluation period' });
        const Hs = v.stage({ x: [1, 120], y: [-2, 2], xlog: true, axes: 'box', gutter: true, height: 290, xlabel: 'evaluation period (months)', ylabel: 'CE gap (points/year)', title: 'when do stocks win?' });
        const As = v.stage({ x: [0, 100], y: [-1, 1], axes: 'box', gutter: true, height: 290, xlabel: 'share in stocks (%)', ylabel: 'prospective value', title: 'the best mix for this period' });
        const NQ = 200, QZ = Array.from({ length: NQ }, (_, i) => ninv((i + 0.5) / NQ)), NQ2 = 36, QZ2 = Array.from({ length: NQ2 }, (_, i) => ninv((i + 0.5) / NQ2));
        const rets = (mu, sg, h, Z) => Z.map((z) => 100 * (Math.exp((mu * h) / 12 + sg * Math.sqrt(h / 12) * z) - 1));
        v.legend([['red', 'losses over the period'], ['blue', 'stocks’ certainty-equivalent edge over bonds'], ['green', 'indifference period', { dash: true }], ['purple', 'value of a stock–bond mix'], ['accent', 'your share', { dot: true }]]);
        let st = {};
        v.render(() => {
          const h = hS.value, l = lS.value, mu = muS.value, sg = sgS.value, a = 0.88, g = 0.61, d = 0.69;
          // ---- density of the stock return over h months (lognormal)
          const m = (mu * h) / 12, s = sg * Math.sqrt(h / 12), mb = (MB * h) / 12, sb = SB * Math.sqrt(h / 12);
          const dens = (x, mm, ss) => { const y = 1 + x / 100; if (y <= 0) return 0; const z = (Math.log(y) - mm) / ss; return Math.exp(-0.5 * z * z) / (y * ss * Math.sqrt(2 * Math.PI)) / 100; };
          const xr = [Math.max(-80, 100 * (Math.exp(m - 3.2 * s) - 1)), 100 * (Math.exp(m + 3.2 * s) - 1)];
          let top = 0; for (let x = xr[0]; x <= xr[1]; x += (xr[1] - xr[0]) / 200) top = Math.max(top, dens(x, m, s));
          D.setView(xr, [0, top * 1.25]);
          D.fn((x) => (x < 0 ? dens(x, m, s) : NaN), { color: 'red', width: 2, fill: 'red', fillAlpha: 0.25, domain: [xr[0], 0], n: 200 });
          D.fn((x) => (x >= 0 ? dens(x, m, s) : NaN), { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.15, domain: [0, xr[1]], n: 300 });
          D.vline(0, { color: 'ink', width: 1 });
          const z0 = -m / s, Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), y = 1 - (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? y : 1 - y; };
          const pl = Phi(z0), plb = Phi(-mb / sb);
          D.text(`stocks: P(loss) = ${pct(pl, 1)}`, xr[1] - 0.03 * (xr[1] - xr[0]), top * 1.15, { align: 'right', size: 12, weight: 700, color: 'red' });
          D.text(`bonds: P(loss) = ${pct(plb, 1)}`, xr[1] - 0.03 * (xr[1] - xr[0]), top * 1.03, { align: 'right', size: 11, color: 'teal', weight: 600 });
          // ---- V(stocks) − V(bonds) over the evaluation period
          // certainty-equivalent return over the period (CPT value inverted), annualized; same sign as the value difference
          const ceR = (V) => vInv(V, a, l);
          const diff = (hh) => (ceR(cptEq(rets(mu, sg, hh, QZ), a, l, g, d)) - ceR(cptEq(rets(MB, SB, hh, QZ), a, l, g, d))) * (12 / hh);
          const H = []; for (let k = 0; k <= 40; k++) { const hh = Math.exp((Math.log(120) * k) / 40); H.push([hh, diff(hh)]); }
          let hStar = null; for (let k = 1; k < H.length; k++) if (H[k - 1][1] < 0 && H[k][1] >= 0) { const [h0, d0] = H[k - 1], [h1, d1] = H[k]; hStar = Math.exp(Math.log(h0) + ((Math.log(h1) - Math.log(h0)) * -d0) / (d1 - d0)); break; }
          const lo = Math.min(...H.map((p) => p[1])), hi = Math.max(...H.map((p) => p[1]));
          const span = Math.max(1, hi - lo);
          const yLo = Math.min(lo, -0.1 * span) - 0.06 * span, yHi = Math.max(hi, 0.1 * span) + 0.1 * span;
          Hs.setView([1, 120], [yLo, yHi]);
          Hs.hline(0, { color: 'muted', width: 1.2 });
          Hs.path(H, { color: 'blue', width: 2.6 });
          const dNow = diff(h);
          Hs.dot(h, dNow, { r: 6, color: dNow >= 0 ? 'green' : 'red' });
          if (hStar) { Hs.vline(hStar, { color: 'green', width: 1.6, dash: [5, 4] }); Hs.text(`indifferent: ${hStar.toFixed(1)} mo`, hStar, yLo, { dx: hStar > 15 ? -6 : 6, dy: -12, align: hStar > 15 ? 'right' : 'left', size: 11, weight: 700, color: 'green', plate: true }); }
          Hs.vband(11, 12, { color: 'gold', alpha: 0.25 });
          Hs.text('BT 1995: 11–12', 12, yHi, { dx: 4, dy: 12, size: 10.5, color: 'gold', weight: 700 });
          // ---- allocation curve for this period (stocks and bonds independent)
          const RS = rets(mu, sg, h, QZ2), RB = rets(MB, SB, h, QZ2);
          const val = (wS) => { const xs = new Float64Array(NQ2 * NQ2); let k = 0; for (const x of RS) for (const y of RB) xs[k++] = wS * x + (1 - wS) * y; return cptEq(xs, a, l, g, d); };
          const AL = []; for (let p = 0; p <= 100; p += 5) AL.push([p, val(p / 100)]);
          let best = AL[0]; for (const q of AL) if (q[1] > best[1]) best = q;
          const alo = Math.min(...AL.map((q) => q[1])), ahi = Math.max(...AL.map((q) => q[1])), pad = 0.12 * Math.max(0.2, ahi - alo);
          As.setView([0, 100], [alo - pad, ahi + 2 * pad]);
          As.hline(0, { color: 'muted', width: 1 });
          As.path(AL, { color: 'purple', width: 2.6 });
          As.dot(best[0], best[1], { r: 6, color: 'green', label: `best: ${best[0]}%`, labelPos: 'n' });
          const mine = val(myW.value / 100);
          As.dot(myW.value, mine, { r: 6, color: 'accent', hollow: true, width: 2.4, label: 'you', labelPos: myW.value > 60 ? 'sw' : 'se' });
          st = { h, hStar, pl, best: best[0], mine, bestV: best[1], dNow, l };
        });
        v.readout(() => {
          const { h, hStar, pl, best, mine, bestV, dNow, l } = st; if (h == null) return '';
          return `Evaluating every **${h.toFixed(h < 10 ? 1 : 0)} months**, a stock investment shows a loss with probability ${pct(pl, 1)}; with $\\lambda = ${l.toFixed(2)}$ all-stocks is worth ${dNow >= 0 ? 'more' : 'less'} than all-bonds (certainty-equivalent gap ${dNow >= 0 ? '+' : '−'}${Math.abs(dNow).toFixed(2)} points a year). ${hStar ? `This stand-in makes them equal at **${hStar.toFixed(1)} months**` : 'No crossing in 1–120 months'} (Benartzi–Thaler, with resampled 1926–1990 data: 11–12 months). Best share in stocks for this period: **${best}%** (prospective value ${bestV.toFixed(2)}; your ${myW.value}%: ${mine.toFixed(2)}; Benartzi–Thaler: about 50% at one year). Stocks and bonds are drawn independently here.`;
        });
      },
    },
  ],
};
