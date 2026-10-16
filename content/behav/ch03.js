// Behavioural Economics — Chapter 3: Heuristics, biases and the framing of choices (items 3.1–3.10; 3.11–3.20 in ch03-b.js)
//
// Sources checked (Oct 2026):
// - Tversky & Kahneman 1974 (Science 185: 1124–1131), text as reprinted in Kahneman 2011, Appendix A: wheel of fortune 10 / 65 →
//   median estimates 25 / 45 (% of African countries in the UN); 8×7×…×1 median 2,250, 1×2×…×8 median 512, true 40,320;
//   engineer–lawyer problem (70/30 vs 30/70, Bayes odds ratio (.7/.3)² = 5.44; "Dick" judged .5 in both conditions);
//   hospital problem (45 vs 15 births a day; answers larger 21, smaller 21, about the same 53); 98% intervals missed ≈ 30%.
// - Tversky & Kahneman 1981 (Science 211: 453–458), checked on the scanned page: Problem 1 N = 152, 72% / 28%;
//   Problem 2 N = 155, 22% / 78%.
// - Tversky & Kahneman 1973 (Cognitive Psychology 5: 207–232): letters K, L, N, R, V; 105 of 152 subjects judged the first
//   position more likely for most letters, median ratio 2:1; famous-names lists of 19 famous + 20 less famous names, recall
//   12.3 of 19 vs 8.4 of 20, 80 of 99 judged the famous sex more frequent.
// - Frederick 2005 (J. Econ. Perspectives 19 (4): 25–42), Table 1 as reproduced by Avram (Studia UBB Oeconomica 63, 2018):
//   mean CRT scores and N by location, total N = 3,428.
// - Tversky & Kahneman 1983 (Psych. Review 90: 293–315) via Charness, Karni & Levin 2010 (Games Econ. Behav. 68: 551–556),
//   Table 1: 121/142 = 85.2% (UBC undergraduates) and the CKL replication rates.
// - Klein et al. 2014 ("Many Labs", Social Psychology 45: 142–152): anchoring means as tabulated in a secondary summary
//   (LessWrong, "Is anchoring a reliable cognitive bias?"); flagged in the caption.
// - Letter counts: computed for this page from five Project Gutenberg novels (Alice's Adventures in Wonderland, Pride and
//   Prejudice, Frankenstein, Moby-Dick, A Tale of Two Cities; 459,394 words of three letters or more).
// - Not verified, quoted from secondary sources: the cab problem's median answer .80 (Kahneman 2011, ch. 16), Kahneman's
//   "more than 50% at Harvard, MIT and Princeton gave 10 cents".
import { clamp, inside, num, pct, card, binomPmf, binomTail, reservation, satisficeValue, satisficeLooks, runStats, hbars } from './ch03.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

/** TK 1992 weighting function. */
const wTK = (p, g) => (p >= 1 ? 1 : p <= 0 ? 0 : p ** g / (p ** g + (1 - p) ** g) ** (1 / g));

/** Probability that a fair-coin sequence of length n has longest run ≤ m (exact DP over the current run length). */
function pLongestAtMost(n, m) {
  if (n === 0) return 1;
  if (m <= 0) return 0;
  let f = new Float64Array(m + 1); f[1] = 1; // after the first flip: run length 1 with probability 1
  for (let i = 2; i <= n; i++) {
    const g = new Float64Array(m + 1); let tot = 0;
    for (let r = 1; r <= m; r++) tot += f[r];
    g[1] = tot / 2; // switch
    for (let r = 1; r < m; r++) g[r + 1] += f[r] / 2; // continue the run
    f = g;
  }
  let s = 0; for (let r = 1; r <= m; r++) s += f[r]; return s;
}

const FREDERICK = [['MIT', 2.18, 61], ['Princeton', 1.63, 121], ['Boston fireworks display', 1.53, 195], ['Carnegie Mellon', 1.51, 746], ['Harvard', 1.43, 51],
  ['U. Michigan, Ann Arbor', 1.18, 1267], ['web-based studies', 1.1, 525], ['Bowling Green', 0.87, 52], ['U. Michigan, Dearborn', 0.83, 154], ['Michigan State', 0.79, 118], ['U. Toledo', 0.57, 138]];

export default {
  collection: 'behav',
  chapter: 3,
  title: 'Heuristics, biases and the framing of choices',
  summary: String.raw`People have limited attention and computing power, so they decide with shortcuts. Simon called this bounded rationality: search until something is good enough. Tversky and Kahneman catalogued the heuristics people use to judge probability, namely anchoring, availability and representativeness. These often work but err in predictable ways: base rates are neglected, a conjunction is judged more likely than one of its parts, chance sequences are read as patterns, luck is mistaken for skill, and forecasts are too confident and too optimistic. Choices also depend on description: equivalent frames, response modes and irrelevant options all change what people pick. Some classic results have been revised. The hot-hand "fallacy" rested on a subtle statistical bias, and the ecological-rationality programme showed that simple heuristics can beat complex models.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Concept', name: 'Bounded rationality and satisficing (Simon)',
      statement: String.raw`**Bounded rationality**: real decision makers have limited information, attention and computing power, so they cannot carry out the global optimization assumed by rational-choice theory. Simon proposed that they **satisfice**: they examine alternatives one at a time and accept the first that meets an **aspiration level**, adjusting the aspiration up when satisfactory options come easily and down when they do not. In a search problem where offers $X_1,X_2,\dots$ arrive one per period, independent with distribution $F$, and each look costs $c$, the optimal rule is itself a threshold: accept the first offer above the reservation value $r^*$ solving $c=E[(X-r^*)^+]$. A satisficer with aspiration $a$ earns $E[X\mid X\ge a]-c/(1-F(a))$, which is maximized at $a=r^*$ but is flat near it, so a roughly chosen aspiration loses little while needing no knowledge of $F$.`,
      idea: String.raw`The optimal stopping rule needs the decision maker to know the offer distribution and to solve a fixed-point equation; Simon's point was that people use a simpler procedure that does almost as well in the environments they face. The expected payoff of an aspiration rule is smooth with a maximum at $r^*$, so its derivative vanishes there and an aspiration that is off by $\Delta$ costs only of order $\Delta^2$. Aspirations that adapt to experience then home in on a good threshold without any calculation (behav-3.19). "Bounded" does not mean irrational: the procedure is rational given the cost of thinking, a theme taken up by fast-and-frugal heuristics (behav-3.18).`,
      caption: String.raw`You are selling a house. Offers arrive one at a time, uniformly between 150 and 250 thousand, and each week of waiting costs the amount on the slider. Press **next offer** until you **accept** one; your net payoff is the offer minus the waiting costs. Then reveal the rules: the green line is the optimal reservation price, the orange line a satisficer's aspiration (slider), and the markers show where each would have stopped on the same stream. The right panel plots the expected net payoff of every aspiration level: a broad, flat top, shaded where an aspiration earns within 1% of the optimum.`,
      deps: [], refs: ['W&K ch. 3'], tags: ['bounded rationality', 'search', 'heuristics'],
      see: ['behav-3.19', 'behav-3.18'],
      credit: 'Herbert Simon, 1955–1956',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Satisficing' },
      viz(v) {
        const L = 150, H = 250;
        const cS = v.slider('cost of waiting one more week (thousands)', 0.25, 8, 2, { step: 0.25 });
        const aS = v.slider('satisficer’s aspiration level (thousands)', 160, 248, 215, { step: 1 });
        let seed = 3, offers = [], k = 5, acc = null;
        const regen = () => { const r = v.rng(seed); offers = Array.from({ length: 60 }, () => L + (H - L) * r()); k = 5; acc = null; };
        regen();
        v.button('next offer', () => { if (acc == null && k < offers.length) k++; });
        v.button('accept the current offer', () => { if (acc == null) acc = k - 1; });
        v.button('new stream of offers', () => { seed++; regen(); });
        const rev = v.toggle('reveal the optimal rule and the satisficer', false);
        const A = v.stage({ x: [0.3, 20.7], y: [150, 250], axes: 'box', gutter: true, height: 300, weight: 1.35, xlabel: 'week (one offer per week)', ylabel: 'offer (thousands)', title: 'the stream of offers' });
        const B = v.stage({ x: [160, 250], y: [150, 250], axes: 'box', gutter: true, height: 300, xlabel: 'aspiration level a', ylabel: 'expected net payoff', title: 'what each aspiration earns on average' });
        v.legend([['gold', 'offers seen', { dot: true }], ['accent', 'your sale', { dot: true }], ['green', 'optimal reservation price r*'], ['orange', 'satisficer’s aspiration']]);
        const stopAt = (thr) => { const i = offers.findIndex((x) => x >= thr); return i < 0 ? offers.length - 1 : i; };
        let st = {};
        v.render(() => {
          const c = cS.value, a = aS.value, r = reservation(L, H, c), show = rev.value || acc != null;
          const iS = stopAt(a), iO = stopAt(r);
          const W0 = Math.max(0, Math.max(k, show ? Math.max(iS, iO) + 1 : 0) - 20);
          A.setView([W0 + 0.3, W0 + 20.7], [150, 250]);
          if (show) {
            A.hline(r, { color: 'green', width: 2 }); A.text(`r* = ${v.fix(r, 1)}`, W0 + 20.7, r, { dx: -4, dy: -9, align: 'right', size: 11.5, weight: 700, color: 'green' });
            A.hline(a, { color: 'orange', width: 2, dash: [6, 4] }); A.text(`a = ${a}`, W0 + 0.3, a, { dx: 6, dy: a > r - 6 && a < r + 6 ? 11 : -9, size: 11.5, weight: 700, color: 'orange' });
          }
          const upto = show ? Math.max(k, iS + 1, iO + 1) : k;
          for (let i = 0; i < Math.min(upto, offers.length); i++) {
            const seen = i < k, x = i + 1;
            A.line(x, 150, x, offers[i], { color: seen ? 'gold' : 'faint', width: 1, alpha: 0.5 });
            A.dot(x, offers[i], { r: seen ? 5 : 3.5, color: i === acc ? 'accent' : seen ? 'gold' : 'muted', hollow: !seen });
          }
          if (acc == null && k < offers.length) A.text('?', k + 1, 200, { align: 'center', size: 18, weight: 700, color: 'muted' });
          if (show) {
            A.dot(iO + 1, offers[iO], { r: 10, hollow: true, color: 'green', width: 2.2 }); A.text('optimizer stops', iO + 1, offers[iO], { dy: -18, align: 'center', size: 10.5, weight: 700, color: 'green' });
            A.dot(iS + 1, offers[iS], { r: 13, hollow: true, color: 'orange', width: 2 }); A.text('satisficer stops', iS + 1, offers[iS], { dy: iS === iO ? -32 : 20, align: 'center', size: 10.5, weight: 700, color: 'orange' });
          }
          if (acc != null) A.text('sold', acc + 1, offers[acc], { dy: 20, align: 'center', size: 11, weight: 700, color: 'accent' });
          // expected payoff curve
          const best = r, f = (x) => satisficeValue(L, H, c, x);
          const lo = Math.max(150, best - 40);
          B.setView([160, 250], [Math.max(150, Math.floor((lo - 5) / 10) * 10), Math.ceil((best + 6) / 5) * 5]);
          let x0 = null, x1 = null;
          for (let x = 160; x <= 249.5; x += 0.25) if (f(x) >= 0.99 * best) { if (x0 == null) x0 = x; x1 = x; }
          if (x0 != null) B.vband(x0, x1, { color: 'green', alpha: 0.1 });
          B.fn(f, { color: 'blue', width: 2.4, domain: [160, 249.5] });
          B.hline(best, { color: 'green', width: 1.2, dash: [5, 4] });
          B.dot(r, best, { r: 5.5, color: 'green', label: 'r*', labelPos: 'n' });
          B.dot(a, f(a), { r: 5.5, color: 'orange' });
          B.vline(a, { color: 'orange', width: 1, dash: [3, 3] });
          st = { c, a, r, iS, iO, val: f(a), looks: satisficeLooks(L, H, a), looksO: satisficeLooks(L, H, r) };
        });
        v.readout(() => {
          const { c, a, r, iS, iO, val, looks, looksO } = st; if (r == null) return '';
          const you = acc != null ? `You sold in week ${acc + 1} for ${v.fix(offers[acc], 1)}, net **${v.fix(offers[acc] - c * (acc + 1), 1)}** thousand. ` : `Offers seen: ${k}; current offer ${v.fix(offers[k - 1], 1)}, waiting has cost ${v.fix(c * k, 1)} so far. `;
          const runs = (acc != null || rev.value) ? `On this stream the optimizer stops in week ${iO + 1} (net ${v.fix(offers[iO] - c * (iO + 1), 1)}), the satisficer in week ${iS + 1} (net ${v.fix(offers[iS] - c * (iS + 1), 1)}). ` : '';
          return you + runs + `On average: optimal rule $r^* = 250-\\sqrt{2c\\cdot100} = ${v.fix(r, 1)}$ earns **${v.fix(r, 1)}** after ${v.fix(looksO, 1)} looks; aspiration ${a} earns **${v.fix(val, 1)}** after ${v.fix(looks, 1)} looks (${v.fix((100 * (r - val)) / r, 2)}% less), without knowing the offer distribution.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Concept', name: 'Dual-process theory: System 1 and System 2',
      statement: String.raw`Dual-process theories distinguish two modes of thinking. **System 1** is fast, automatic, effortless and associative; it produces impressions and intuitive answers. **System 2** is slow, deliberate and effortful; it can check and override System 1 but is lazy and easily depleted. Many judgment errors arise when System 1 supplies an attractive answer to an easier question and System 2 endorses it without checking. Frederick's three-item **Cognitive Reflection Test** (CRT) measures the tendency to override an intuitive wrong answer: in the bat-and-ball item ("a bat and a ball cost \$1.10; the bat costs \$1.00 more than the ball; how much is the ball?") the answer 10 cents springs to mind, but the ball costs 5 cents. Across 3,428 respondents the mean score was 1.24 of 3, ranging from 2.18 at MIT to 0.57 at the University of Toledo.`,
      scope: String.raw`"System 1" and "System 2" are labels for clusters of processes, not brain modules. The CRT correlates with numeracy and intelligence, and its items lose their power once widely known. Some dual-process claims of the 2000s, such as ego depletion, have failed to replicate.`,
      idea: String.raw`The intuitive answers are not random errors: they come from substituting a feature that is easy to compute (the salient numbers \$1.10 and \$1.00, the repeated 5s, the halving of 48) for the relation actually asked about. Checking costs effort, and people who score high on the CRT are those who notice the conflict and recompute. The same lens explains anchoring (behav-3.4), substitution of similarity for probability (behav-3.6) and the conjunction fallacy (behav-3.8): a fast heuristic answers, and a slower process may or may not intervene.`,
      caption: String.raw`Answer the three CRT questions with the buttons first. Then drag the ball's price on the bar model: the bat is always one dollar more, and the total hits \$1.10 only at 5 cents; at the intuitive 10 cents it is \$1.20. The chart shows Frederick's mean scores by sample ($N$ in brackets), with your score added as a red bar once you have answered all three.`,
      deps: [], refs: ['Kahneman ch. 1'], tags: ['dual process', 'intuition', 'cognitive reflection'],
      see: ['behav-3.4', 'behav-3.6'],
      credit: 'Stanovich & West, 2000; Kahneman, 2003; Frederick, 2005',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dual_process_theory' },
      viz(v) {
        const Qs = v.stage({ x: [0, 100], y: [0, 3], axes: false, height: 104, full: true, title: 'the Cognitive Reflection Test (answer with the buttons below)' });
        const q1 = v.select('1. bat and ball: the ball costs', [{ value: '-', label: 'not answered' }, { value: 'i', label: '10 cents' }, { value: 'c', label: '5 cents' }, { value: 'o', label: 'something else' }], '-');
        const q2 = v.select('2. widgets: 100 machines take', [{ value: '-', label: 'not answered' }, { value: 'i', label: '100 minutes' }, { value: 'c', label: '5 minutes' }, { value: 'o', label: 'something else' }], '-');
        const q3 = v.select('3. lily pads: half the lake takes', [{ value: '-', label: 'not answered' }, { value: 'i', label: '24 days' }, { value: 'c', label: '47 days' }, { value: 'o', label: 'something else' }], '-');
        const A = v.stage({ x: [0, 150], y: [0, 3.3], axes: false, height: 230, full: true, title: 'the bat-and-ball problem as a bar model (drag the ball’s price)' });
        const B = v.stage({ x: [0, 3], y: [0, 12], axes: false, height: 340, full: true, title: 'mean CRT score (0–3) by sample, Frederick (2005, Table 1)' });
        const h = A.handle(10, 2.55, { color: 'gold', constrain: (x) => [clamp(Math.round(x * 2) / 2, 0, 20), 2.55] });
        v.render(() => {
          ['1. A bat and a ball cost \$1.10 in total. The bat costs \$1.00 more than the ball. How much does the ball cost?',
            '2. If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?',
            '3. A patch of lily pads doubles in size every day. It covers the whole lake in 48 days. How long to cover half the lake?'].forEach((t, i) => Qs.text(t, 1, 2.5 - i, { size: 12.5 }));
          const ball = h.x, bat = ball + 100, tot = ball + bat;
          // rows: ball, bat, total
          A.rect(0, 2.3, ball, 2.8, { fill: 'gold', fillAlpha: 0.7, color: 'gold' });
          A.text(`ball ${v.fix(ball, 1)}¢`, ball, 2.55, { dx: 18, size: 12, weight: 700, color: 'gold' });
          A.rect(0, 1.35, ball, 1.85, { fill: 'gold', fillAlpha: 0.7, color: 'gold' });
          A.rect(ball, 1.35, bat, 1.85, { fill: 'blue', fillAlpha: 0.55, color: 'blue' });
          A.text('bat = ball + 100¢', ball + 50, 1.6, { align: 'center', size: 12, weight: 700, color: 'ink', halo: false });
          A.text(`${v.fix(bat, 1)}¢`, bat, 1.6, { dx: 6, size: 12, weight: 700, color: 'blue' });
          const ok = Math.abs(tot - 110) < 1e-9;
          A.rect(0, 0.4, tot, 0.9, { fill: ok ? 'green' : 'red', fillAlpha: 0.45, color: ok ? 'green' : 'red' });
          A.vline(110, { color: 'ink', width: 1.6, dash: [5, 4] });
          A.text('\$1.10', 110, 3.1, { align: 'center', size: 12, weight: 700 });
          A.text(`total ${v.fix(tot, 1)}¢`, tot, 0.65, { dx: 6, size: 12, weight: 700, color: ok ? 'green' : 'red' });
          // Frederick table
          const tot3 = FREDERICK.reduce((s, r) => s + r[2], 0), mean = FREDERICK.reduce((s, r) => s + r[1] * r[2], 0) / tot3;
          const ans = [q1.value, q2.value, q3.value], answered = ans.filter((a) => a !== '-').length, score = ans.filter((a) => a === 'c').length;
          const rows = FREDERICK.map(([nm, m, n]) => ({ label: `${nm} (${n})`, value: m, color: 'blue' }));
          rows.splice(6, 0, { label: `all ${num(tot3)} respondents`, value: mean, color: 'purple', bold: true });
          if (answered === 3) {
            let at = rows.findIndex((r) => r.value < score); if (at < 0) at = rows.length;
            rows.splice(at, 0, { label: 'you', value: score, color: 'red', bold: true, labelColor: 'red' });
          }
          const x0 = 1.05, x1 = 2.6;
          hbars(B, rows, { x0, x1, yTop: 11.9, rowH: 11.8 / rows.length, max: 3, size: 11, fmt: (x) => v.fix(x, 2) });
        });
        v.readout(() => {
          const ans = [q1.value, q2.value, q3.value], answered = ans.filter((a) => a !== '-').length;
          const intuitive = ans.filter((a) => a === 'i').length, score = ans.filter((a) => a === 'c').length;
          const model = `Algebra: $b + (b + 100) = 110 \\Rightarrow b = 5$ cents. At the slider's ${v.fix(h.x, 1)}¢ the total is ${v.fix(2 * h.x + 100, 1)}¢.`;
          if (answered < 3) return `Answer all three questions to see your score. ${model}`;
          return `Your CRT score: **${score} / 3** (${intuitive} intuitive answer${intuitive === 1 ? '' : 's'}: 10 cents, 100 minutes, 24 days). Frederick's respondents averaged 1.24, and in his data nearly everyone who did not give the intuitive answer gave the correct one. ${model}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Phenomenon', name: 'Framing: the Asian disease problem',
      statement: String.raw`Tversky and Kahneman (1981) told students that an unusual disease is expected to kill 600 people and asked them to choose between two programmes. One group (Problem 1, $N=152$) saw the outcomes as **lives saved**: programme A saves 200 people (72% chose it); programme B saves all 600 with probability 1/3 and nobody with probability 2/3 (28%). A second group (Problem 2, $N=155$) saw the same programmes described as **lives lost**: under C 400 people die (22%); under D nobody dies with probability 1/3 and all 600 die with probability 2/3 (78%). A and C, and B and D, are the same programmes, yet the majority preference reverses. **Framing effects** like this violate *description invariance*, a principle every normative theory of choice takes for granted.`,
      scope: String.raw`The effect has been replicated many times, including in the Many Labs project (2014), and was found among university faculty and physicians. Its size depends on how completely the options are described: stating both the saved and the lost numbers shrinks it.`,
      idea: String.raw`The frame sets the reference point. Described as lives saved, the outcomes are gains above "600 die", where the value function of prospect theory (behav-2.3) is concave: a sure 200 is worth more than a one-in-three chance of 600, the certainty effect. Described as lives lost, the same outcomes are losses below "nobody dies", where the value function is convex and people gamble, as in the reflection effect (behav-2.7). Because nothing in the programmes themselves changes, no theory defined on final outcomes can produce both majority choices.`,
      caption: String.raw`Choose a programme under the frame shown, then switch the frame and choose again. The dot pictures are identical in both frames (each dot is 10 people; green alive, red dead); only the words change. Bottom left: the published choice shares beside your own choices. Bottom right: the prospect-theory value function $v(x)=x^{\alpha}$ for gains and $-\lambda(-x)^{\alpha}$ for losses, with the sure option (green dot) and the gamble's value (purple dot: on the dashed chord, or at the weight $w(p)$ when weighting is on) for the current frame. Raise $\alpha$ toward 1 to see the predicted reversal disappear.`,
      deps: ['behav-2.7', 'behav-2.3'], refs: ['Kahneman ch. 34'], tags: ['framing', 'prospect theory', 'risk'],
      see: ['behav-2.13'],
      credit: 'Tversky & Kahneman, 1981',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Framing_effect_(psychology)' },
      viz(v) {
        const fr = v.select('frame', [{ value: 'gain', label: 'lives saved (Problem 1)' }, { value: 'loss', label: 'lives lost (Problem 2)' }], 'gain');
        const aS = v.slider('value-function curvature $\\alpha$', 0.4, 1, 0.88, { step: 0.01 });
        const wt = v.toggle('probability weighting (TK 1992: γ = .61, δ = .69)', false);
        const C = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 210, full: true, title: '600 people are expected to die. Which programme do you favour?' });
        const D = v.stage({ x: [0, 1], y: [0, 4], axes: false, height: 250, title: 'share choosing the sure programme' });
        const Vs = v.stage({ x: [-650, 650], y: [-300, 300], axes: 'box', gutter: true, height: 250, xlabel: 'lives relative to the reference point', ylabel: 'v(x)', title: 'value function and the two options' });
        const ans = { gain: null, loss: null };
        const R = { sure: [1.5, 2, 49, 38], risky: [51, 2, 98.5, 38] };
        C.onClick((x, y) => { for (const k of ['sure', 'risky']) if (inside(R[k], x, y)) ans[fr.value] = k; });
        const grid = (x0, y0, n, alive, dx = 1.9, dy = 3.1, cols = 12) => {
          for (let i = 0; i < n; i++) C.dot(x0 + (i % cols) * dx, y0 - Math.floor(i / cols) * dy, { r: 4.6, color: i < alive ? 'green' : 'red', alpha: 0.85 });
        };
        v.render(() => {
          const g = fr.value === 'gain', a = aS.value;
          const L = g ? { sure: ['Programme A:', '200 people will be saved.'], risky: ['Programme B: probability 1/3 that 600 are', 'saved, 2/3 that nobody is saved.'] }
            : { sure: ['Programme C:', '400 people will die.'], risky: ['Programme D: probability 1/3 that nobody', 'dies, 2/3 that 600 people die.'] };
          for (const k of ['sure', 'risky']) card(C, R[k], { tag: '', lines: L[k], chosen: ans[fr.value] === k, dim: ans[fr.value] && ans[fr.value] !== k, sub: ans[fr.value] ? (k === 'sure' ? (g ? '72% chose A' : '22% chose C') : (g ? '28% chose B' : '78% chose D')) : null });
          grid(14, 21.5, 60, 20);
          C.text('for sure', 14, 26, { size: 11, weight: 700, color: 'muted' });
          grid(54, 21.5, 60, 60, 1.5); grid(75.5, 21.5, 60, 0, 1.5);
          C.text('probability 1/3', 54, 26, { size: 11, weight: 700, color: 'muted' }); C.text('probability 2/3', 75.5, 26, { size: 11, weight: 700, color: 'muted' });
          // data
          const rows = [{ label: 'saved frame, N = 152', value: 0.72, color: 'blue' }, { label: 'you, saved frame', value: ans.gain ? (ans.gain === 'sure' ? 1 : 0) : 0, note: ans.gain ? (ans.gain === 'sure' ? 'sure (A)' : 'gamble (B)') : 'not yet', color: 'accent', labelColor: 'accent' },
            { label: 'lost frame, N = 155', value: 0.22, color: 'red' }, { label: 'you, lost frame', value: ans.loss ? (ans.loss === 'sure' ? 1 : 0) : 0, note: ans.loss ? (ans.loss === 'sure' ? 'sure (C)' : 'gamble (D)') : 'not yet', color: 'accent', labelColor: 'accent' }];
          hbars(D, rows, { x0: 0.42, x1: 0.84, yTop: 3.9, rowH: 0.95, max: 1, size: 11 });
          // value function
          const lam = 2.25, v_ = (x) => (x >= 0 ? Math.pow(x, a) : -lam * Math.pow(-x, a)), sc = 300 / v_(600);
          const f = (x) => sc * v_(x);
          Vs.setView([-650, 650], [-sc * lam * Math.pow(600, a) * 1.05, 330]);
          Vs.hline(0, { color: 'muted', width: 1 }); Vs.vline(0, { color: 'muted', width: 1 });
          Vs.fn(f, { color: 'blue', width: 2.4, domain: [-640, 640] });
          const p = 1 / 3, w = wt.value ? (g ? wTK(p, 0.61) : wTK(2 / 3, 0.69)) : g ? p : 2 / 3;
          if (g) {
            Vs.line(0, 0, 600, f(600), { color: 'purple', width: 1.4, dash: [5, 4] });
            const vs = f(200), vr = w * f(600);
            Vs.dot(200, vs, { r: 6, color: 'green' }); Vs.text('sure: +200', 200, vs, { dx: -8, dy: -12, align: 'right', size: 11, weight: 700, color: 'green' });
            Vs.dot(600 * w, vr, { r: 6, color: 'purple' }); Vs.text('gamble', 600 * w, vr, { dx: 8, dy: 12, size: 11, weight: 700, color: 'purple' });
            Vs.corner('reference: 600 die', 'tl', { color: 'ink', weight: 700 });
          } else {
            Vs.line(0, 0, -600, f(-600), { color: 'purple', width: 1.4, dash: [5, 4] });
            const vs = f(-400), vr = w * f(-600);
            Vs.dot(-400, vs, { r: 6, color: 'green' }); Vs.text('sure: −400', -400, vs, { dx: 8, dy: 4, size: 11, weight: 700, color: 'green' });
            Vs.dot(-600 * w, vr, { r: 6, color: 'purple' }); Vs.text('gamble', -600 * w, vr, { dx: 8, dy: -10, size: 11, weight: 700, color: 'purple' });
            Vs.corner('reference: nobody dies', 'tl', { color: 'ink', weight: 700 });
          }
        });
        v.readout(() => {
          const a = aS.value, wt1 = wt.value;
          const wg = wt1 ? wTK(1 / 3, 0.61) : 1 / 3, wl = wt1 ? wTK(2 / 3, 0.69) : 2 / 3;
          const gS = Math.pow(200, a), gR = wg * Math.pow(600, a), lS = -Math.pow(400, a), lR = -wl * Math.pow(600, a);
          const pg = gS > gR ? 'sure' : 'gamble', pl = lS > lR ? 'sure' : 'gamble';
          const mine = ans.gain && ans.loss ? ` You chose the ${ans.gain === 'sure' ? 'sure' : 'risky'} programme when lives were saved and the ${ans.loss === 'sure' ? 'sure' : 'risky'} one when lives were lost${ans.gain !== ans.loss ? ' — **a framing reversal**, although the programmes are identical.' : ': consistent across frames.'}` : ' Choose under both frames to compare yourself with the data.';
          return `Prospect theory with $\\alpha = ${v.fix(a, 2)}$${wt1 ? ' and TK 1992 weights' : ''}: saved frame $v(200) = ${v.fix(gS, 1)}$ vs $${v.fix(wg, 3)}\\,v(600) = ${v.fix(gR, 1)}$ → **${pg}**; lost frame $v(-400) \\propto ${v.fix(lS, 1)}$ vs $${v.fix(wl, 3)}\\,v(-600) \\propto ${v.fix(lR, 1)}$ → **${pl}**.${pg !== pl ? ' The frame alone reverses the prediction.' : ''}` + mine;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Phenomenon', name: 'Anchoring and adjustment',
      statement: String.raw`When people estimate a quantity after considering a number, even an obviously arbitrary one, their estimates are pulled toward that number: they start from the **anchor** and adjust, and the adjustment is typically insufficient. In Tversky and Kahneman's demonstration (1974) a wheel of fortune, rigged to stop at 10 or 65, was spun before subjects judged whether the percentage of African countries in the United Nations was higher or lower than the number and then estimated it; the median estimates were 25 for the group that saw 10 and 45 for the group that saw 65. A convenient measure is the **anchoring index** (difference in mean or median estimates)/(difference in anchors), here $20/55\approx0.36$; 0 means no influence and 1 means estimates equal to the anchors.`,
      scope: String.raw`Anchoring is one of the most robust effects in judgment research: the Many Labs project (2014) reproduced it in dozens of laboratories. It is strongest when people know little about the quantity, and it affects experts (real-estate agents, judges) and negotiations. Payoffs for accuracy did not remove it in the 1974 study.`,
      idea: String.raw`Two mechanisms are supported. In *anchoring and adjustment*, people move away from the anchor until they reach a plausible region and stop at its near edge, so a high anchor leaves estimates high and a low one leaves them low. In *selective accessibility*, comparing the target with the anchor brings to mind features consistent with the anchor, which then shape the estimate. Either way the final estimate is a compromise $\hat x\approx \text{anchor}+k\,(\text{belief}-\text{anchor})$ with $k<1$, whose slope against the anchor, $1-k$, is the anchoring index.`,
      caption: String.raw`Spin the rigged wheel (it lands on 65 or 10), then set your estimate of the percentage of African countries among UN members with the slider before turning on the data. Centre: estimate against anchor, with the 1974 medians (gold) and the adjustment model's line through them; your estimate is the blue dot. Bottom: the four anchoring questions of the Many Labs project each on its own logarithmic scale running from the low to the high anchor (grey ticks), the mean estimate after each (blue and red), the true value (green) and the anchoring index. The Many Labs means are taken from a secondary tabulation of Klein et al. (2014).`,
      deps: [], refs: ['Kahneman ch. 11'], tags: ['anchoring', 'heuristics', 'estimation'],
      see: ['behav-3.20', 'behav-3.17'],
      credit: 'Tversky & Kahneman, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Anchoring_effect' },
      viz(v) {
        let anchor = 65, spins = 1;
        v.button('spin the wheel', () => { spins++; anchor = anchor === 65 ? 10 : 65; });
        const est = v.slider('your estimate: % of UN members that are African', 0, 100, 50, { step: 1 });
        const show = v.toggle('show the 1974 data', false);
        const kS = v.slider('adjustment model: fraction k of the way from anchor to belief', 0, 1, 0.64, { step: 0.01 });
        const W = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 270, title: 'wheel of fortune' });
        const P = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 270, weight: 1.3, xlabel: 'anchor shown', ylabel: 'estimate (%)', title: 'estimate against anchor' });
        const M = v.stage({ x: [0, 1], y: [0, 4.6], axes: false, height: 250, full: true, title: 'Many Labs (2014) anchoring questions: low and high anchor → mean estimate' });
        const ML = [['babies born per day in the US', 100, 50000, 3200, 26700, 10000], ['population of Chicago', 2e5, 5e6, 1.03e6, 3.0e6, 2.75e6], ['height of Mount Everest (feet)', 2000, 45500, 11800, 34500, 29032], ['San Francisco to New York (miles)', 1500, 6000, 2850, 3990, 2570]];
        const short = (x) => (x >= 1e6 ? `${+(x / 1e6).toFixed(2)}M` : x >= 1e3 ? `${+(x / 1e3).toFixed(1)}k` : String(x));
        v.render(() => {
          // wheel
          const ang = (t) => Math.PI / 2 - (2 * Math.PI * t) / 100;
          W.circle(0, 0, 1, { color: 'ink', width: 1.6, fill: 'grid', fillAlpha: 0.25 });
          for (let t = 0; t < 100; t += 5) {
            const a = ang(t), r0 = t % 10 === 0 ? 0.86 : 0.92;
            W.line(r0 * Math.cos(a), r0 * Math.sin(a), Math.cos(a), Math.sin(a), { color: 'muted', width: 1 });
            if (t % 10 === 0) W.text(String(t), 0.74 * Math.cos(a), 0.74 * Math.sin(a), { align: 'center', size: 10.5, color: 'muted' });
          }
          const a = ang(anchor);
          W.arrow(0, 0, 0.9 * Math.cos(a), 0.9 * Math.sin(a), { color: 'orange', width: 3, head: 12 });
          W.dot(0, 0, { r: 5, color: 'orange' });
          W.text(String(anchor), 0, -0.35, { align: 'center', size: 24, weight: 800, color: 'orange' });
          W.corner(`spin ${spins}`, 'tr');
          // estimate vs anchor
          const truth = (100 * 54) / 193;
          P.hline(truth, { color: 'green', width: 1.5, dash: [6, 4] }); P.text(`today: 54 of 193 = ${v.fix(truth, 1)}%`, 100, truth, { dx: -4, dy: 10, align: 'right', size: 11, weight: 600, color: 'green' });
          P.line(0, 0, 100, 100, { color: 'faint', width: 1, dash: [3, 4] }); P.text('estimate = anchor', 88, 88, { dx: -6, dy: -10, align: 'right', size: 10.5, color: 'muted' });
          if (show.value) {
            const k = kS.value, belief = (25 - 10 * (1 - k)) / k; // model fitted to pass through the low-anchor median
            P.fn((x) => x + k * (belief - x), { color: 'gold', width: 1.8, dash: [6, 4], domain: [0, 100] });
            P.dot(10, 25, { r: 7, color: 'gold', label: 'median 25', labelPos: 'se' }); P.dot(65, 45, { r: 7, color: 'gold', label: 'median 45', labelPos: 'nw' });
          }
          P.vline(anchor, { color: 'orange', width: 1, dash: [3, 3] });
          P.dot(anchor, est.value, { r: 6.5, color: 'blue', label: 'you', labelPos: 'e' });
          // Many Labs rows
            ML.forEach(([nm, lo, hi, mlo, mhi, tru], i) => {
            const lx = (x) => 0.32 + (0.54 * Math.log(x / lo)) / Math.log(hi / lo);
            const y = 4.1 - i * 1.02;
            M.text(nm, 0.29, y, { align: 'right', size: 11.5, weight: 600 });
            M.line(lx(lo), y, lx(hi), y, { color: 'faint', width: 6, alpha: 0.6 });
            for (const [x, lab] of [[lo, 'low'], [hi, 'high']]) { M.line(lx(x), y - 0.17, lx(x), y + 0.17, { color: 'muted', width: 2 }); M.text(short(x), lx(x), y, { dy: -16, align: 'center', size: 10, color: 'muted' }); }
            M.arrow(lx(lo), y - 0.06, lx(mlo), y - 0.06, { color: 'blue', width: 1.6, head: 7 });
            M.arrow(lx(hi), y + 0.06, lx(mhi), y + 0.06, { color: 'red', width: 1.6, head: 7 });
            M.dot(lx(mlo), y, { r: 5, color: 'blue' }); M.dot(lx(mhi), y, { r: 5, color: 'red' });
            M.dot(lx(tru), y, { r: 6, hollow: true, color: 'green', width: 2.2 });
            M.text(`${short(mlo)} → ${short(mhi)}`, lx(Math.sqrt(mlo * mhi)), y, { dy: 15, align: 'center', size: 10.5, weight: 700, color: 'ink' });
            M.text(`index ${v.fix((mhi - mlo) / (hi - lo), 2)}`, 0.985, y, { align: 'right', size: 11, weight: 700, color: 'purple' });
          });
        });
        v.legend([['orange', 'anchor'], ['gold', 'TK 1974 medians', { dot: true }], ['blue', 'after low anchor', { dot: true }], ['red', 'after high anchor', { dot: true }], ['green', 'true value', { dot: true }]]);
        v.readout(() => {
          const k = kS.value;
          return `You estimated **${est.value}%** after the wheel showed ${anchor}. In 1974 the median was 25% after 10 and 45% after 65: anchoring index $\\tfrac{45-25}{65-10} = ${v.fix(20 / 55, 2)}$. The adjustment model with $k = ${v.fix(k, 2)}$ has index $1-k = ${v.fix(1 - k, 2)}$${Math.abs(1 - k - 20 / 55) < 0.02 ? ', matching the 1974 medians' : ''}. Many Labs indices: ${ML.map((r) => v.fix((r[4] - r[3]) / (r[2] - r[1]), 2)).join(', ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Concept', name: 'The availability heuristic',
      statement: String.raw`People judge the frequency of a class, or the probability of an event, by the **ease** with which instances come to mind (Tversky and Kahneman 1973). Ease of recall is correlated with frequency, so the heuristic often works, but anything that makes instances easier to retrieve, such as fame, vividness, recency or the way memory is indexed, inflates the judgment. Two of the original demonstrations: asked whether the letters K, L, N, R and V appear more often as the first or the third letter of English words, 105 of 152 subjects chose the first position for most letters (median estimated ratio 2:1), although word counts showed all five more frequent in third position; and after hearing a list of 19 famous names of one sex and 20 less famous names of the other, 80 of 99 subjects judged the famous sex to be more numerous.`,
      scope: String.raw`The letter result depends on the corpus: Tversky and Kahneman relied on Mayzner and Tresselt's counts, and later work (Sedlmeier, Hertwig and Gigerenzer 1998) found that for several letters the claimed third-position majority does not hold in other corpora. The page's own counts show the same nuance for K.`,
      idea: String.raw`Memory is searched by cues, and words are indexed by their beginnings, so "words starting with K" are retrieved fluently while "words with K third" are not. In the names study the famous names are recalled better (12.3 of 19 famous against 8.4 of 20 less famous), so if frequency is judged from what comes back, the famous sex wins. The heuristic substitutes an easy question (how easily do instances come to mind?) for a hard one (how often does this happen?), in the System 1 manner of behav-3.2.`,
      caption: String.raw`First click, for each letter, whether you think it is more often the first or the third letter of a word. Then reveal the counts from five classic novels (459,394 words of three letters or more), as running text or as distinct words: R, N and L are far more common in third position, but K is close, and among distinct words K is more often first. Bottom: a model of the famous-names study. Each simulated listener recalls each famous name with the first probability and each less famous one with the second, and judges the sex with more recalled names to be more numerous; the curve is the exact distribution of (famous recalled − other recalled), and the readout compares the predicted share with the 80 of 99 observed.`,
      deps: [], refs: ['Kahneman ch. 12'], tags: ['availability', 'heuristics', 'memory'],
      see: ['behav-3.2'],
      credit: 'Tversky & Kahneman, 1973',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Availability_heuristic' },
      viz(v) {
        const LET = ['K', 'L', 'N', 'R', 'V'];
        const TOK = { K: [3084, 3566], L: [15664, 19216], N: [11959, 25224], R: [11452, 42691], V: [4017, 8781] };
        const TYP = { K: [144, 120], L: [727, 1256], N: [353, 1837], R: [1221, 2351], V: [362, 499] };
        const reveal = v.toggle('reveal the corpus counts', false);
        const mode = v.select('count', [{ value: 'tok', label: 'running text' }, { value: 'typ', label: 'distinct words' }], 'tok');
        const pf = v.slider('recall probability, famous names', 0.2, 0.95, 12.3 / 19, { step: 0.005 });
        const pl = v.slider('recall probability, less famous names', 0.1, 0.9, 8.4 / 20, { step: 0.005 });
        const Q = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 290, title: 'is the letter more often 1st or 3rd?' });
        const Cn = v.stage({ x: [0, 1], y: [0, 6], axes: false, height: 290, weight: 1.35, title: 'share of the letter’s occurrences in each position' });
        const F = v.stage({ x: [-20.5, 20.5], y: [0, 0.14], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'famous names recalled − less famous names recalled', ylabel: 'probability', title: 'the famous-names study as recall-based judgment (19 famous vs 20 less famous names)' });
        const ans = {};
        Q.onClick((x, y) => { const i = Math.floor((5.6 - y) / 1.1); if (i >= 0 && i < 5 && x > 2.2) ans[LET[i]] = x < 6 ? 'first' : 'third'; });
        let st = {};
        v.render(() => {
          LET.forEach((Lt, i) => {
            const y = 5.05 - i * 1.1;
            Q.text(Lt, 1.1, y, { align: 'center', size: 22, weight: 800, color: 'ink' });
            for (const [k, x0, x1] of [['first', 2.4, 5.8], ['third', 6.2, 9.6]]) {
              const ch = ans[Lt] === k, correct = reveal.value && (mode.value === 'tok' ? TOK : TYP)[Lt][k === 'first' ? 0 : 1] >= (mode.value === 'tok' ? TOK : TYP)[Lt][k === 'first' ? 1 : 0];
              Q.rect(x0, y - 0.4, x1, y + 0.4, { fill: ch ? 'accent' : 'panel', fillAlpha: ch ? 0.18 : 1, color: ch ? 'accent' : 'faint', width: ch ? 2.2 : 1, radius: 7 });
              Q.text(k === 'first' ? '1st letter' : '3rd letter', (x0 + x1) / 2, y, { align: 'center', size: 12, weight: ch ? 700 : 500, color: correct ? 'green' : ch ? 'accent' : 'ink' });
            }
          });
          const D = mode.value === 'tok' ? TOK : TYP;
          if (reveal.value) {
            const rows = [];
            LET.forEach((Lt) => { const [a, b] = D[Lt]; rows.push({ label: `${Lt}: 1st`, value: a / (a + b), color: 'blue', note: `${num(a)} (${pct(a / (a + b))})` }, { label: `${Lt}: 3rd`, value: b / (a + b), color: 'orange', note: `${num(b)} (${pct(b / (a + b))})` }); });
            hbars(Cn, rows, { x0: 0.2, x1: 0.72, yTop: 5.95, rowH: 0.59, max: 1, size: 11 });
          } else {
            const n = Object.keys(ans).length, firsts = Object.values(ans).filter((x) => x === 'first').length;
            Cn.text('what people answered (Tversky & Kahneman 1973)', 0.5, 5.5, { align: 'center', size: 12, weight: 700, color: 'muted' });
            hbars(Cn, [{ label: 'chose 1st for most letters', value: 105 / 152, color: 'blue', note: '105 of 152' }, { label: 'chose 3rd for most letters', value: 47 / 152, color: 'orange', note: '47 of 152' },
              { label: 'you: letters put 1st', value: n ? firsts / 5 : 0, color: 'accent', labelColor: 'accent', note: n ? `${firsts} of 5` : 'click the letters' }], { x0: 0.42, x1: 0.8, yTop: 5, rowH: 1.05, max: 1, size: 11.5 });
            Cn.text('median estimated ratio: 2 : 1 in favour of the 1st position', 0.5, 1.2, { align: 'center', size: 12, weight: 600 });
            Cn.text('reveal the counts to check', 0.5, 0.55, { align: 'center', size: 11.5, color: 'muted' });
          }
          // famous names model: D = A − B, A ~ Bin(19, pf), B ~ Bin(20, pl)
          const a = pf.value, b = pl.value, pa = [], pb = [];
          for (let k = 0; k <= 19; k++) pa.push(binomPmf(19, k, a));
          for (let k = 0; k <= 20; k++) pb.push(binomPmf(20, k, b));
          const pd = new Map(); let win = 0, tie = 0, ymax = 0;
          for (let i = 0; i <= 19; i++) for (let j = 0; j <= 20; j++) { const d = i - j, p = pa[i] * pb[j]; pd.set(d, (pd.get(d) || 0) + p); if (d > 0) win += p; else if (d === 0) tie += p; }
          for (const p of pd.values()) ymax = Math.max(ymax, p);
          F.setView([-20.5, 20.5], [0, Math.max(0.1, ymax * 1.25)]);
          for (const [d, p] of pd) F.rect(d - 0.4, 0, d + 0.4, p, { fill: d > 0 ? 'purple' : d === 0 ? 'muted' : 'teal', fillAlpha: 0.7, stroke: false });
          F.vline(0, GUIDE);
          F.text('famous sex judged more numerous →', 1, Math.max(0.1, ymax * 1.25), { dy: 12, size: 11.5, weight: 700, color: 'purple' });
          F.text('← the larger (less famous) class wins', -1, Math.max(0.1, ymax * 1.25), { dy: 12, align: 'right', size: 11.5, weight: 700, color: 'teal' });
          st = { win, tie, a, b };
        });
        v.readout(() => {
          const { win, tie, a, b } = st; if (win == null) return '';
          const n = Object.keys(ans).length, firsts = Object.values(ans).filter((x) => x === 'first').length;
          const you = n === 5 ? `You chose the first position for ${firsts} of 5 letters (105 of 152 subjects did so for a majority). ` : `Answered ${n} of 5 letters. `;
          const kk = mode.value === 'tok' ? TOK.K : TYP.K;
          return you + `In these texts K is first ${num(kk[0])} times and third ${num(kk[1])} times (${mode.value === 'tok' ? 'running text' : 'distinct words'}); R is third ${v.fix(TOK.R[1] / TOK.R[0], 1)}× as often as first. Names model: recall ${v.fix(19 * a, 1)} famous vs ${v.fix(20 * b, 1)} other names on average; P(more famous recalled) = **${pct(win, 1)}** (+ half the ties: ${pct(win + tie / 2, 1)}), against 80/99 = ${pct(80 / 99, 1)} observed.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Concept', name: 'The representativeness heuristic',
      statement: String.raw`People judge the probability that an object belongs to a class, or that a sample came from a process, by how much it **resembles** the class or process (Kahneman and Tversky 1972, 1973). Similarity is insensitive to factors that should matter for probability: the **base rate** of the class, the reliability of the description, and sample size. In the engineer–lawyer study, subjects judged personality sketches said to be drawn at random from a group of 70 engineers and 30 lawyers, or of 30 engineers and 70 lawyers. By Bayes' rule the odds that any given sketch is an engineer's should be $(0.7/0.3)^2\approx5.44$ times higher in the first group; the judgments were essentially the same in both. Given no sketch, subjects used the base rates correctly (0.7 and 0.3); given a sketch that said nothing relevant ("Dick", a capable, well-liked married man of 30), they answered 0.5 in both groups.`,
      idea: String.raw`By Bayes' rule (stat-10.1), posterior odds = prior odds × likelihood ratio. Representativeness evaluates only the likelihood side, how typical the sketch is of an engineer, and drops the prior odds. Plotting a person's answer in the 70%-engineer condition against the answer in the 30% condition makes this visible: Bayesian answers lie on a curve on which the odds differ by the factor 5.44, while answers by similarity lie on the diagonal. In the Tom W study (1973) rankings of graduate fields by the likelihood that a student is enrolled in each almost coincided with rankings by similarity, not with the fields' sizes.`,
      caption: String.raw`Pick a sketch and give your probability that the person is an engineer under each base rate (two sliders) before turning on Bayes. Left: your two answers as a point; the diagonal is what pure similarity gives, the purple curve every pair consistent with Bayes' rule, and the green dot the Bayesian answer for the sketch's diagnosticity (the likelihood ratio slider, which you can set to your own sense of the sketch). Right: 100 professionals in the chosen group; the highlighted icons are those who fit the sketch, so the posterior can be counted.`,
      deps: ['stat-10.1'], refs: ['Kahneman ch. 14'], tags: ['representativeness', 'base rates', 'Bayes'],
      see: ['behav-3.7', 'behav-3.8'],
      credit: 'Kahneman & Tversky, 1972–1973',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Representativeness_heuristic' },
      viz(v) {
        const SK = {
          eng: { lr: 4, text: ['Jon, 45: married, four children, conservative and careful; spends his', 'free time on home carpentry, model trains and logic puzzles.'] },
          dick: { lr: 1, text: ['Dick, 30: married, no children; a man of high ability and motivation,', 'expected to do well in his field; his colleagues like him.'] },
          law: { lr: 0.3, text: ['Ana, 38: a persuasive debater who loves arguing a case; she reads', 'political history and chairs her neighbourhood council.'] },
        };
        const sk = v.select('sketch', [{ value: 'eng', label: 'Jon' }, { value: 'dick', label: 'Dick (uninformative)' }, { value: 'law', label: 'Ana' }], 'eng', { onChange: (k) => lr.set(SK[k].lr) });
        const a70 = v.slider('your P(engineer) if the group is 70 engineers, 30 lawyers', 0, 1, 0.5, { step: 0.01 });
        const a30 = v.slider('your P(engineer) if the group is 30 engineers, 70 lawyers', 0, 1, 0.5, { step: 0.01 });
        const lr = v.slider('likelihood ratio of the sketch, P(fits | engineer) / P(fits | lawyer)', 0.1, 10, 4, { log: true });
        const grp = v.select('group shown in the icons', [{ value: 70, label: '70 engineers' }, { value: 30, label: '30 engineers' }], 70);
        const T = v.stage({ x: [0, 100], y: [0, 10], axes: false, height: 64, full: true });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, equal: true, height: 330, xlabel: 'P(engineer), 30-engineer group', ylabel: 'P(engineer), 70-engineer group', title: 'your two answers' });
        const Ic = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: '100 professionals: who fits the sketch?' });
        const I = v.icons(Ic, { n: 100, order: 'index', region: [0, 0.12, 1, 1] });
        const post = (prior, L) => (prior * L) / (prior * L + (1 - prior));
        v.render(() => {
          const L = lr.value, s = SK[sk.value];
          s.text.forEach((t, i) => T.text(t, 50, 6.6 - 3.6 * i, { align: 'center', size: 12.5, weight: 500 }));
          S.line(0, 0, 1, 1, { color: 'muted', width: 1.4, dash: [5, 4] }); S.text('same answer in both groups', 0.95, 0.88, { dy: 14, align: 'right', size: 10.5, color: 'muted' });
          S.curve((t) => { const p30 = t; const o = (p30 / (1 - p30)) * 5.444; return [p30, o / (1 + o)]; }, 0.0005, 0.9995, { color: 'purple', width: 2 });
          S.text('Bayes: odds × 5.44', 0.2, 0.62, { size: 11, weight: 700, color: 'purple', align: 'center', dy: -8 });
          const b70 = post(0.7, L), b30 = post(0.3, L);
          S.dot(b30, b70, { r: 7, color: 'green', label: 'Bayes', labelPos: 'se' });
          if (sk.value === 'dick') S.dot(0.5, 0.5, { r: 7, hollow: true, color: 'gold', width: 2.4, label: 'subjects (1973)', labelPos: 'nw' });
          S.dot(a30.value, a70.value, { r: 7, color: 'blue', label: 'you', labelPos: 'ne' });
          // icons
          const g = +grp.value, fitE = L >= 1 ? 0.5 : 0.5 * L, fitL = L >= 1 ? 0.5 / L : 0.5;
          const nE = g, nL = 100 - g, kE = Math.round(nE * fitE), kL = Math.round(nL * fitL);
          I.set({ groups: [{ n: kE, color: 'blue', label: 'engineer, fits the sketch' }, { n: nE - kE, color: 'blue', alpha: 0.25, label: 'engineer, does not fit' }, { n: kL, color: 'red', label: 'lawyer, fits the sketch' }, { n: nL - kL, color: 'red', alpha: 0.25, label: 'lawyer, does not fit' }] });
          I.draw(); I.legend();
          Ic.corner(`fit: ${kE} engineers, ${kL} lawyers → P(engineer | fits) ≈ ${v.fix(kE / Math.max(1, kE + kL), 2)}`, 'bl', { color: 'ink', weight: 600, plate: true });
        });
        v.readout(() => {
          const L = lr.value, b70 = post(0.7, L), b30 = post(0.3, L);
          const o = (p) => p / (1 - p), r = a70.value > 0 && a70.value < 1 && a30.value > 0 && a30.value < 1 ? o(a70.value) / o(a30.value) : NaN;
          return `With likelihood ratio ${v.fix(L, 2)}, Bayes gives **${v.fix(b70, 2)}** (70 engineers) and **${v.fix(b30, 2)}** (30 engineers): odds ratio 5.44 whatever the sketch. Your answers ${v.fix(a70.value, 2)} and ${v.fix(a30.value, 2)} have odds ratio ${isFinite(r) ? v.fix(r, 2) : '—'}${isFinite(r) && r < 2 ? ': close to ignoring the base rate, as the subjects did.' : '.'}${sk.value === 'dick' ? ' For Dick the sketch is worthless, so the answers should be the base rates 0.7 and 0.3; subjects said 0.5 and 0.5.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Phenomenon', name: 'Base-rate neglect (the cab problem)',
      statement: String.raw`A cab was involved in a hit-and-run accident at night. 85% of the city's cabs are Green and 15% Blue. A witness identified the cab as Blue; tested under the same conditions, the witness identifies each colour correctly 80% of the time. The probability that the cab was Blue is, by Bayes' rule,
$$P(B\mid\text{"B"})=\frac{0.15\times0.8}{0.15\times0.8+0.85\times0.2}=\frac{0.12}{0.29}\approx0.41,$$
yet the typical answer is 0.80, the witness's reliability, as if the base rate did not exist (Tversky and Kahneman 1980, 1982). When the base rate is made causal ("85% of accidents involve Green cabs") people use it much more.`,
      idea: String.raw`Neglecting the base rate means answering with the likelihood $P(\text{"B"}\mid B)$ instead of the posterior $P(B\mid\text{"B"})$ (stat-10.1). Natural frequencies make the posterior countable: of 1,000 cabs, 150 are Blue and the witness calls 120 of them Blue; 850 are Green and the witness wrongly calls 170 of them Blue; so 120 of the 290 "Blue" reports are right. Because Green cabs are so common, the witness's 20% error rate on them produces more false "Blue" reports than the 80% hit rate produces true ones. The same arithmetic governs medical screening (epi-2.3).`,
      caption: String.raw`Give your answer with the first slider before splitting the cabs. The icon array shows 1,000 cabs coloured by their true colour, darker when the witness would say "Blue". Split them by what the witness says to count the posterior. The base-rate and reliability sliders change the problem; the curve on the right is the posterior for every base rate at the current reliability, against the flat line of base-rate neglect.`,
      deps: ['behav-3.6', 'stat-10.1'], refs: ['Kahneman ch. 16'], tags: ['base rates', 'Bayes', 'natural frequencies'],
      see: ['epi-2.3'],
      credit: 'Tversky & Kahneman, 1980',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Base_rate_fallacy' },
      viz(v) {
        const you = v.slider('your answer: P(cab was Blue | witness says Blue)', 0, 1, 0.5, { step: 0.01 });
        const split = v.select('view', [{ value: 'all', label: 'all 1,000 cabs' }, { value: 'split', label: 'split by the witness report' }], 'all');
        const br = v.slider('share of Blue cabs', 0.01, 0.6, 0.15, { step: 0.01 });
        const ac = v.slider('witness accuracy', 0.5, 0.99, 0.8, { step: 0.01 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.6 });
        const P = v.stage({ x: [0, 0.6], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'share of Blue cabs', ylabel: 'P(Blue | "Blue")', title: 'posterior against base rate' });
        const N = 1000, I = v.icons(s, { n: N, order: 'group', shape: 'square' });
        let st = {};
        v.render(() => {
          const nB = Math.round(N * br.value), TP = Math.round(nB * ac.value), FP = Math.round((N - nB) * (1 - ac.value));
          const groups = [{ n: TP, color: 'blue', label: 'Blue, witness says Blue' }, { n: nB - TP, color: 'blue', alpha: 0.3, label: 'Blue, witness says Green' }, { n: FP, color: 'green', label: 'Green, witness says Blue' }];
          const saysB = (i) => i < TP || (i >= nB && i < nB + FP);
          I.set({ groups, rest: { color: 'green', alpha: 0.3, label: 'Green, witness says Green' }, block: split.value === 'split' ? (i) => (saysB(i) ? 0 : 1) : null, blockLabels: split.value === 'split' ? (b, n) => (b === 0 ? `witness says “Blue” (${n})` : `witness says “Green” (${n})`) : null });
          I.draw(); I.legend();
          const a = ac.value, f = (b) => (b * a) / (b * a + (1 - b) * (1 - a));
          P.hline(a, { color: 'red', width: 1.6, dash: [6, 4] }); P.text('base-rate neglect: answer = accuracy', 0.59, a, { dx: -2, dy: -9, align: 'right', size: 10.5, weight: 600, color: 'red' });
          P.fn(f, { color: 'blue', width: 2.4, domain: [0.002, 0.6] });
          P.dot(br.value, f(br.value), { r: 6, color: 'blue', label: v.fix(f(br.value), 2), labelPos: 'se' });
          P.dot(br.value, you.value, { r: 6, color: 'gold', label: 'you', labelPos: 'nw' });
          st = { TP, FP, post: TP / Math.max(1, TP + FP), exact: f(br.value) };
        });
        v.readout(() => {
          const { TP, FP, post, exact } = st; if (TP == null) return '';
          return `Of the ${TP + FP} cabs the witness calls Blue, **${TP}** are Blue and **${FP}** are Green: $P(B\\mid\\text{“B”}) = ${TP}/${TP + FP} = ${v.fix(post, 3)}$ (exact ${v.fix(exact, 3)}). Your answer: ${v.fix(you.value, 2)}${Math.abs(you.value - ac.value) < 0.03 ? ' — the witness’s accuracy, the typical base-rate-neglecting answer (median .80 in the original problem).' : '.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Paradox', name: 'The conjunction fallacy (Linda)',
      statement: String.raw`"Linda is 31, single, outspoken and very bright. She majored in philosophy, cared deeply about discrimination and social justice, and joined anti-nuclear demonstrations." Which is more probable: (T) Linda is a bank teller, or (T&F) Linda is a bank teller and is active in the feminist movement? For any events, $P(T\wedge F)\le P(T)$, yet 85% of 142 University of British Columbia undergraduates chose T&F (Tversky and Kahneman 1983). Judging a conjunction more probable than one of its constituents is the **conjunction fallacy**. In a replication with mild incentives and group discussion (Charness, Karni and Levin 2010) the rate fell to 58% for individuals without incentives, 33% with incentives, and 10% for trios with incentives.`,
      idea: String.raw`The description is representative of a feminist and unrepresentative of a bank teller, and adding "feminist" makes the story more similar to Linda (behav-3.6), even though every added detail can only remove possibilities. In a Venn diagram the feminist bank tellers are a subset of the bank tellers, so their probability is at most that of the larger set, whatever the numbers. Critics argued that people read "bank teller" as "bank teller and not feminist", or "probable" in a non-mathematical sense; the fallacy shrinks with frequency formats ("of 100 women like Linda, how many…") and incentives, but survives in betting versions.`,
      caption: String.raw`Click the statement you think more probable. In the square, every point is a woman like Linda: the column on the left is the bank tellers (width set by the first slider) and the shaded part of it the feminist bank tellers (share set by the second slider). Whatever you set, the shaded area cannot exceed the column. The bars show violation rates in the original study and in the 2010 replication, with your answer.`,
      deps: ['behav-3.6'], refs: ['Kahneman ch. 15'], tags: ['probability', 'representativeness', 'paradoxes'],
      credit: 'Tversky & Kahneman, 1983',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Conjunction_fallacy' },
      viz(v) {
        const pT = v.slider('P(T): Linda is a bank teller', 0.01, 0.5, 0.1, { step: 0.01 });
        const pFT = v.slider('P(F | T): feminist, among bank tellers', 0, 1, 0.6, { step: 0.01 });
        const pF = v.slider('P(F): feminist overall', 0, 1, 0.75, { step: 0.01 });
        const C = v.stage({ x: [0, 100], y: [0, 30], axes: false, height: 132, full: true, title: 'Which is more probable?' });
        const Q = v.stage({ x: [-0.05, 1.05], y: [-0.08, 1.05], equal: true, axes: false, height: 330, title: 'women like Linda' });
        const B = v.stage({ x: [0, 1], y: [0, 9], axes: false, height: 330, weight: 1.3, title: 'share choosing T&F (violations)' });
        let ans = null;
        const RT = [1.5, 1.5, 34, 13], RTF = [36, 1.5, 98.5, 13];
        C.onClick((x, y) => { if (inside(RT, x, y)) ans = 'T'; else if (inside(RTF, x, y)) ans = 'TF'; });
        v.render(() => {
          C.text('Linda is 31 years old, single, outspoken and very bright. She majored in philosophy. As a student she was deeply concerned', 50, 26, { align: 'center', size: 12 });
          C.text('with issues of discrimination and social justice, and also took part in anti-nuclear demonstrations.', 50, 19.5, { align: 'center', size: 12 });
          card(C, RT, { tag: 'T', lines: ['Linda is a bank teller.'], chosen: ans === 'T', dim: ans === 'TF' });
          card(C, RTF, { tag: 'T&F', lines: ['Linda is a bank teller and is active in the feminist movement.'], chosen: ans === 'TF', dim: ans === 'T' });
          const t = pT.value, ft = pFT.value, f = pF.value;
          // feminists outside T fill the rest so that overall P(F) is honoured when possible
          const fOut = clamp((f - t * ft) / (1 - t), 0, 1);
          Q.rect(0, 0, 1, 1, { color: 'ink', width: 1.4, fill: 'grid', fillAlpha: 0.2 });
          Q.rect(t, 1 - fOut, 1, 1, { fill: 'purple', fillAlpha: 0.22, stroke: false });
          Q.rect(0, 0, t, 1, { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 2 });
          Q.rect(0, 1 - ft, t, 1, { fill: 'purple', fillAlpha: 0.75, color: 'purple', width: 2 });
          Q.text('T', t / 2, 0.04, { align: 'center', size: 13, weight: 800, color: 'blue' });
          Q.text('T&F', t / 2, 1 - ft / 2, { align: 'center', size: 11, weight: 800, color: 'ink', halo: false });
          Q.text('feminists, not tellers', (1 + t) / 2, 1 - fOut / 2, { align: 'center', size: 11.5, weight: 600, color: 'purple' });
          Q.text('neither', (1 + t) / 2, (1 - fOut) / 2, { align: 'center', size: 11.5, color: 'muted' });
          const rows = [
            { label: 'TK 1983, UBC (121/142)', value: 121 / 142, color: 'red' },
            { label: 'CKL 2010, alone, no pay (50/86)', value: 50 / 86, color: 'orange' },
            { label: 'alone, \$4 for correct (31/94)', value: 31 / 94, color: 'orange' },
            { label: 'pairs, no pay (27/56)', value: 27 / 56, color: 'gold' },
            { label: 'pairs, paid (5/38)', value: 5 / 38, color: 'gold' },
            { label: 'trios, no pay (10/39)', value: 10 / 39, color: 'green' },
            { label: 'trios, paid (5/48)', value: 5 / 48, color: 'green' },
            { label: 'you', value: ans ? (ans === 'TF' ? 1 : 0) : 0, note: ans ? (ans === 'TF' ? 'T&F (a violation)' : 'T (correct)') : 'click a statement', color: 'accent', labelColor: 'accent', bold: true },
          ];
          hbars(B, rows, { x0: 0.5, x1: 0.84, yTop: 8.9, rowH: 1.1, max: 1, size: 10.5 });
        });
        v.readout(() => {
          const t = pT.value, ft = pFT.value, f = pF.value, both = t * ft, need = t * ft <= f;
          return `$P(T\\wedge F) = P(T)\\,P(F\\mid T) = ${v.fix(t, 2)}\\times${v.fix(ft, 2)} = ${v.fix(both, 3)} \\le P(T) = ${v.fix(t, 2)}$ for every setting.${need ? '' : ' (Your P(F) is smaller than P(T∧F), which is impossible too: a conjunction cannot exceed either part.)'} ${ans ? (ans === 'TF' ? 'You chose T&F, like 85% of the original subjects: no assignment of probabilities supports it.' : 'You chose T, the only answer consistent with probability theory.') : 'Click T or T&F above.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Phenomenon', name: 'The law of small numbers',
      statement: String.raw`People expect even small samples to resemble the population closely, as if the law of large numbers applied to small numbers too (Tversky and Kahneman 1971). They therefore over-interpret extreme results from small samples and are surprised that small samples vary so much. In the hospital problem (1972), a town has a large hospital with about 45 births a day and a small one with about 15; asked which records more days on which over 60% of babies are boys, 21 of 95 students said the larger, 21 the smaller and 53 "about the same", although the small hospital records about twice as many such days. Likewise, the US counties with the highest *and* the lowest rates of kidney cancer are mostly small rural counties: their extreme rates are what small populations produce by chance.`,
      idea: String.raw`The proportion of boys in a day's $n$ births has standard deviation $\sqrt{p(1-p)/n}$, so a deviation of 10 percentage points is about 0.8 standard deviations for $n=15$ but 1.3 for $n=45$. Exactly, $P(\text{more than }60\%\text{ boys})$ is $P(X\ge10)$ for $X\sim\text{Bin}(15,\tfrac12)$, about 0.15, against $P(X\ge28)$ for $\text{Bin}(45,\tfrac12)$, about 0.07. Representativeness (behav-3.6) ignores $n$: "more than 60%" looks equally typical either way. In the county map the same variance makes rates of small counties spread widely around the common true rate, so both tails of the ranking are filled with small counties, inviting causal stories about rural life.`,
      caption: String.raw`Answer the hospital question first; the students' answers then appear. Left: the exact distribution of the share of boys on a day in each hospital, with the days over 60% shaded and counted per year. Right: 3,000 simulated counties with the same true cancer rate (synthetic populations; seeded); each dot is a county's observed rate over ten years against its population. The 10% highest (red) and lowest (blue) rates are highlighted: both crowd into the small counties on the left.`,
      deps: [], refs: ['Kahneman ch. 10'], tags: ['sampling', 'small samples', 'representativeness'],
      see: ['stat-12.9'],
      credit: 'Tversky & Kahneman, 1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Insensitivity_to_sample_size' },
      viz(v) {
        const hl = v.select('highlight', [{ value: 'both', label: 'top and bottom 10%' }, { value: 'top', label: 'highest 10%' }, { value: 'bot', label: 'lowest 10%' }], 'both');
        const rate = v.slider('true rate (cases per 100,000 per year)', 2, 40, 8, { step: 1 });
        const C = v.stage({ x: [0, 100], y: [0, 22], axes: false, height: 116, full: true, title: 'Which hospital records more days with over 60% boys?' });
        const H = v.stage({ x: [0, 1], y: [0, 0.29], axes: 'box', gutter: true, height: 300, xlabel: 'share of boys born on a day', ylabel: 'probability', title: 'small vs large hospital' });
        const M = v.stage({ x: [500, 3e6], xlog: true, y: [0, 30], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'county population (log)', ylabel: 'observed rate per 100,000 per year', title: '3,000 counties, one true rate' });
        let ans = null;
        const R = [[1.5, 1.5, 33, 10], [34, 1.5, 66, 10], [67, 1.5, 98.5, 10]], LAB = ['the larger hospital', 'the smaller hospital', 'about the same'], N = [21, 21, 53];
        C.onClick((x, y) => R.forEach((r, i) => { if (inside(r, x, y)) ans = i; }));
        const r0 = v.rng(11), pops = Array.from({ length: 3000 }, () => clamp(Math.exp(Math.log(25000) + 1.25 * r0.normal()), 600, 2.8e6));
        let cache = null;
        const counties = (rt) => {
          if (cache && cache.rt === rt) return cache;
          const r = v.rng(5), out = pops.map((p) => {
            const lam = (rt / 1e5) * p * 10; let k;
            if (lam < 40) { const L = Math.exp(-lam); let pr = 1; k = -1; do { k++; pr *= r(); } while (pr > L); } else k = Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal()));
            return { p, rate: (k / (p * 10)) * 1e5 };
          });
          const sorted = out.map((c) => c.rate).sort((a, b) => a - b);
          cache = { rt, out, lo: sorted[Math.floor(0.1 * out.length)], hi: sorted[Math.floor(0.9 * out.length)] };
          return cache;
        };
        let st = {};
        v.render(() => {
          C.text('A town has two hospitals: about 45 babies are born each day in the larger one and about 15 in the smaller one. About 50% of babies are boys,', 50, 19, { align: 'center', size: 12 });
          C.text('but the share varies from day to day. For one year each hospital records the days on which more than 60% of the babies born were boys.', 50, 14, { align: 'center', size: 12 });
          R.forEach((r, i) => card(C, r, { lines: [LAB[i]], chosen: ans === i, dim: ans != null && ans !== i, sub: ans != null ? `${N[i]} of 95 students` : null, subColor: i === 1 ? 'green' : 'muted' }));
          // hospital distributions
          const dist = (n, col, off) => {
            for (let k = 0; k <= n; k++) { const p = binomPmf(n, k, 0.5), x = k / n, w = 0.32 / n; H.rect(x - w + off, 0, x + w + off, p, { fill: col, fillAlpha: k / n > 0.6 ? 0.85 : 0.25, color: col, width: 0.8 }); }
          };
          dist(15, 'orange', 0); dist(45, 'blue', 0);
          H.vline(0.6, { color: 'ink', width: 1.4, dash: [5, 4] }); H.text('60%', 0.6, 0.215, { dx: 5, size: 11, weight: 700 });
          const ps = binomTail(15, 10, 0.5), pl = binomTail(45, 28, 0.5);
          H.text(`small (15/day): ${v.fix(ps, 3)} → ${Math.round(365 * ps)} days a year`, 0.02, 0.275, { size: 11.5, weight: 700, color: 'orange' });
          H.text(`large (45/day): ${v.fix(pl, 3)} → ${Math.round(365 * pl)} days a year`, 0.02, 0.25, { size: 11.5, weight: 700, color: 'blue' });
          // counties
          const Cc = counties(rate.value), ymax = Math.max(30, rate.value * 3.2);
          M.setView([500, 3e6], [0, ymax]);
          const pts = [], top = [], bot = [];
          for (const c of Cc.out) { const y = Math.min(c.rate, ymax * 0.995); if (c.rate >= Cc.hi && hl.value !== 'bot') top.push([c.p, y]); else if (c.rate <= Cc.lo && hl.value !== 'top') bot.push([c.p, y]); else pts.push([c.p, y]); }
          M.dots(pts, { r: 1.8, color: 'muted', alpha: 0.5 });
          M.dots(bot, { r: 2.4, color: 'blue' }); M.dots(top, { r: 2.4, color: 'red' });
          M.hline(rate.value, { color: 'green', width: 1.8 }); M.text('true rate', 3e6, rate.value, { dx: -4, dy: -9, align: 'right', size: 11, weight: 700, color: 'green' });
          const small = (arr) => arr.length ? arr.filter(([p]) => p < 25000).length / arr.length : 0;
          st = { ps, pl, sTop: small(top), sBot: small(bot), nTop: top.length, nBot: bot.length };
        });
        v.readout(() => {
          const { ps, pl, sTop, sBot, nTop, nBot } = st; if (ps == null) return '';
          const you = ans == null ? 'Pick an answer above. ' : ans === 1 ? 'You picked the smaller hospital: right. ' : `You picked “${LAB[ans]}”, like ${N[ans]} of 95 students; the smaller hospital is right. `;
          const c = [nTop ? `${pct(sTop)} of the highest-rate counties` : null, nBot ? `${pct(sBot)} of the lowest-rate counties` : null].filter(Boolean).join(' and ');
          return you + `$P(X\\ge10\\mid n=15) = ${v.fix(ps, 3)}$ vs $P(X\\ge28\\mid n=45) = ${v.fix(pl, 3)}$: ${v.fix(ps / pl, 1)} times as many such days in the small hospital. Counties: ${c} are below the median population of 25,000, although every county has the same true rate.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Phenomenon', name: 'The gambler’s fallacy',
      statement: String.raw`The **gambler's fallacy** is the belief that independent chance events balance out over short runs: after several reds at roulette black feels "due", although the probability is unchanged. It shows up when people produce or judge random sequences. Asked to write down a random series of coin flips, people switch between heads and tails too often and avoid long runs; sequences with an alternation rate of about 0.6 to 0.7 are judged the most random, while a fair coin alternates half the time (reviews by Bar-Hillel and Wagenaar 1991; Falk and Konold 1997). In 50 genuine flips a run of at least five occurs with probability 0.82 (at least four: 0.98).`,
      idea: String.raw`Applying representativeness (behav-3.6) locally, people expect every short stretch of a sequence to look like the long-run 50–50 mix, the law of small numbers (behav-3.9) applied to sequences. A fair coin has no memory, so the number of alternations among $n$ flips is $\text{Bin}(n-1,\tfrac12)$, and the longest run grows like $\log_2 n$; both distributions can be computed exactly, so a "human" sequence can be tested against them. The mirror-image belief, that streaks continue, is the hot hand (behav-3.11).`,
      caption: String.raw`Write a "random" sequence of up to 50 flips with the H and T buttons (the page starts with an example produced by a simulated person who switches 65% of the time; clear it to write your own). The panels show the exact distribution, for a fair coin and a sequence of your length, of the longest run and of the number of switches, with your sequence marked and its percentile. Over-alternating sequences sit in the left tail of the first and the right tail of the second.`,
      deps: ['behav-3.9'], refs: ['W&K ch. 4'], tags: ['randomness', 'probability', 'sequences'],
      see: ['behav-3.11'],
      credit: 'Laplace, 1814 (described); Tversky & Kahneman, 1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gambler%27s_fallacy' },
      viz(v) {
        let seq = [];
        const qS = v.slider('switch probability of the simulated person', 0.3, 0.9, 0.65, { step: 0.01 });
        const example = () => { const r = v.rng(Math.round(qS.value * 1000)); seq = [r() < 0.5 ? 1 : 0]; while (seq.length < 50) seq.push(r() < qS.value ? 1 - seq[seq.length - 1] : seq[seq.length - 1]); };
        example();
        v.button('H', () => { if (seq.length < 50) seq.push(1); });
        v.button('T', () => { if (seq.length < 50) seq.push(0); });
        v.button('undo', () => { seq.pop(); });
        v.button('clear', () => { seq = []; });
        v.button('example from the simulated person', () => example());
        v.button('50 real coin flips', () => { const r = v.rng(Date.now() % 100000); seq = Array.from({ length: 50 }, () => (r() < 0.5 ? 1 : 0)); });
        const Sq = v.stage({ x: [0, 50], y: [0, 1], axes: false, height: 74, full: true });
        const A = v.stage({ x: [0.5, 15.5], y: [0, 0.4], axes: 'box', gutter: true, height: 270, xlabel: 'longest run', ylabel: 'probability', title: 'longest run in a fair sequence' });
        const B = v.stage({ x: [0, 50], y: [0, 0.15], axes: 'box', gutter: true, height: 270, xlabel: 'number of switches H↔T', ylabel: 'probability', title: 'switches in a fair sequence' });
        let st = {};
        v.render(() => {
          const n = seq.length;
          for (let i = 0; i < 50; i++) {
            const x = i + 0.5;
            if (i < n) { Sq.rect(i + 0.08, 0.2, i + 0.92, 0.8, { fill: seq[i] ? 'gold' : 'teal', fillAlpha: 0.8, color: seq[i] ? 'gold' : 'teal', radius: 3 }); Sq.text(seq[i] ? 'H' : 'T', x, 0.5, { align: 'center', size: 10.5, weight: 700, halo: false }); }
            else Sq.rect(i + 0.08, 0.2, i + 0.92, 0.8, { color: 'faint', width: 1, radius: 3 });
          }
          if (n < 2) { A.text('add at least two flips', 8, 0.2, { align: 'center', size: 12, color: 'muted' }); st = { n }; return; }
          const rs = runStats(seq);
          // longest-run distribution
          const pr = []; let prev = 0, ymax = 0;
          for (let m = 1; m <= Math.min(n, 15); m++) { const c = pLongestAtMost(n, m); pr.push([m, c - prev]); prev = c; }
          for (const [, p] of pr) ymax = Math.max(ymax, p);
          A.setView([0.5, 15.5], [0, ymax * 1.3]);
          for (const [m, p] of pr) A.rect(m - 0.38, 0, m + 0.38, p, { fill: m === rs.longest ? 'red' : 'blue', fillAlpha: m === rs.longest ? 0.85 : 0.45, color: m === rs.longest ? 'red' : 'blue', width: 1 });
          const pLeL = pLongestAtMost(n, rs.longest), pLtL = pLongestAtMost(n, rs.longest - 1);
          A.text(`yours: ${rs.longest}`, Math.min(rs.longest, 13), ymax * 1.2, { align: 'center', size: 11.5, weight: 700, color: 'red' });
          // switches: Bin(n − 1, 1/2)
          let ym = 0; const pb = []; for (let k = 0; k <= n - 1; k++) { const p = binomPmf(n - 1, k, 0.5); pb.push(p); ym = Math.max(ym, p); }
          B.setView([-0.5, Math.max(10, n - 0.5)], [0, ym * 1.3]);
          pb.forEach((p, k) => B.rect(k - 0.4, 0, k + 0.4, p, { fill: k === rs.alt ? 'red' : 'blue', fillAlpha: k === rs.alt ? 0.85 : 0.45, stroke: false }));
          B.vline((n - 1) / 2, GUIDE);
          B.text(`yours: ${rs.alt}`, rs.alt, ym * 1.2, { align: 'center', size: 11.5, weight: 700, color: 'red' });
          let cdf = 0; for (let k = 0; k <= rs.alt; k++) cdf += pb[k];
          st = { n, rs, pLeL, pLtL, swUp: 1 - cdf + pb[rs.alt], p4: 1 - pLongestAtMost(n, 3) };
        });
        v.readout(() => {
          const { n, rs, pLeL, pLtL, swUp, p4 } = st; if (!rs) return `${n} flip${n === 1 ? '' : 's'} so far.`;
          const flag = [];
          if (pLeL < 0.05) flag.push('a longest run this short happens in under 5% of fair sequences');
          if (swUp < 0.05) flag.push('this many switches happens in under 5% of fair sequences');
          return `${n} flips: longest run **${rs.longest}** (fair coin: P(longest ≤ ${rs.longest}) = ${v.fix(pLeL, 3)}, P(longest < ${rs.longest}) = ${v.fix(pLtL, 3)}), switches **${rs.alt}** of ${n - 1} (rate ${v.fix(rs.rate, 2)}; P(at least this many) = ${v.fix(swUp, 3)}). A fair sequence of this length has a run of 4 or more with probability ${v.fix(p4, 3)}.${flag.length ? ' **Not random-looking to a statistician:** ' + flag.join('; ') + '.' : ''}`;
        });
      },
    },
  ],
};
