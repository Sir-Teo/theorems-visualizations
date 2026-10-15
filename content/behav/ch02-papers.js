// Behavioural Economics — Chapter 2: landmark paper written early as a flagship item (2.13, Kahneman & Tversky 1979).
//
// Every problem and percentage below was checked against the paper (Econometrica 47 (2): 263–291): Problems 1–8
// (pp. 265–267), Table I with Problems 3′, 4′, 7′, 8′ (p. 268), Problem 9 (95 Stanford students, p. 269–270), Problem 10
// (141 subjects, 78 per cent chose the latter prospect, p. 271), Problems 11–12 (p. 273), 13 and 13′ (p. 277), 14 and 14′
// (p. 281). Outcomes are Israeli pounds (median net monthly family income about 3,000). Figures 3 and 4 of the paper
// are "hypothetical" shapes with no parameters; the parametric forms and the estimates α = β = 0.88, λ = 2.25,
// γ = 0.61 (gains), δ = 0.69 (losses) are from Tversky & Kahneman (1992), J. Risk Uncertainty 5: 297–323, as listed by
// P. Wakker's CPT calculator.

const PROBS = [
  { id: '1', N: 72, A: [[2500, 0.33], [2400, 0.66], [0, 0.01]], B: [[2400, 1]], pct: [18, 82] },
  { id: '2', N: 72, A: [[2500, 0.33], [0, 0.67]], B: [[2400, 0.34], [0, 0.66]], pct: [83, 17], L: ['C', 'D'] },
  { id: '3', N: 95, A: [[4000, 0.8]], B: [[3000, 1]], pct: [20, 80] },
  { id: '4', N: 95, A: [[4000, 0.2]], B: [[3000, 0.25]], pct: [65, 35], L: ['C', 'D'] },
  { id: '5', N: 72, tA: ['50% chance to win a three-week', 'tour of England, France and Italy'], tB: ['a one-week tour of England,', 'with certainty'], pct: [22, 78] },
  { id: '6', N: 72, tA: ['5% chance to win a three-week', 'tour of England, France and Italy'], tB: ['10% chance to win a', 'one-week tour of England'], pct: [67, 33], L: ['C', 'D'] },
  { id: '7', N: 66, A: [[6000, 0.45]], B: [[3000, 0.9]], pct: [14, 86] },
  { id: '8', N: 66, A: [[6000, 0.001]], B: [[3000, 0.002]], pct: [73, 27], L: ['C', 'D'] },
  { id: '3′', N: 95, A: [[-4000, 0.8]], B: [[-3000, 1]], pct: [92, 8] },
  { id: '4′', N: 95, A: [[-4000, 0.2]], B: [[-3000, 0.25]], pct: [42, 58] },
  { id: '7′', N: 66, A: [[-3000, 0.9]], B: [[-6000, 0.45]], pct: [8, 92] },
  { id: '8′', N: 66, A: [[-3000, 0.002]], B: [[-6000, 0.001]], pct: [70, 30] },
  { id: '9', N: 95, head: 'Insurance you find barely worth its premium; now “probabilistic insurance”: pay half the premium; after damage, a 50% chance you pay the other half and are covered, a 50% chance your money is refunded and you bear the loss.', tA: ['Yes, buy probabilistic', 'insurance'], tB: ['No'], pct: [20, 80] },
  { id: '10', N: 141, head: 'Two stages: a .75 chance to end the game with nothing, a .25 chance to reach stage two, where you get the option you choose now.', A: [[4000, 0.8]], B: [[3000, 1]], pct: [22, 78] },
  { id: '11', N: 70, head: 'In addition to whatever you own, you have been given 1,000. Choose between', A: [[1000, 0.5]], B: [[500, 1]], pct: [16, 84] },
  { id: '12', N: 68, head: 'In addition to whatever you own, you have been given 2,000. Choose between', A: [[-1000, 0.5]], B: [[-500, 1]], pct: [69, 31], L: ['C', 'D'] },
  { id: '13', N: 68, A: [[6000, 0.25]], B: [[4000, 0.25], [2000, 0.25]], pct: [18, 82] },
  { id: '13′', N: 64, A: [[-6000, 0.25]], B: [[-4000, 0.25], [-2000, 0.25]], pct: [70, 30] },
  { id: '14', N: 72, A: [[5000, 0.001]], B: [[5, 1]], pct: [72, 28] },
  { id: '14′', N: 72, A: [[-5000, 0.001]], B: [[-5, 1]], pct: [17, 83] },
];
const num = (x) => (x < 0 ? '−' : '') + Math.abs(x).toLocaleString('en-US');
const prob = (p) => (p >= 1 ? 'with certainty' : `with probability ${String(p).replace(/^0/, '')}`);
const lines = (pr) => pr.filter(([x]) => x !== 0).map(([x, p]) => `${num(x)} ${prob(p)}`).concat(pr.some(([x, p]) => x === 0 && p > 0) ? [`0 ${prob(pr.find(([x]) => x === 0)[1])}`] : []);
/** Tversky–Kahneman (1992) one-parameter weighting function. */
const wfun = (p, g) => (p >= 1 ? 1 : p <= 0 ? 0 : p ** g / (p ** g + (1 - p) ** g) ** (1 / g));
const val = (x, a, l) => (x >= 0 ? (x / 1000) ** a : -l * (-x / 1000) ** a);
/** 1979 rule for regular prospects, V = Σ π(p) v(x) (outcomes in thousands; a certain outcome has π(1) = 1). */
const V = (pr, a, l, g, d) => pr.reduce((s, [x, p]) => s + (x === 0 ? 0 : wfun(p, x > 0 ? g : d) * val(x, a, l)), 0);
const EV = (pr) => pr.reduce((s, [x, p]) => s + x * p, 0);

export default {
  collection: 'behav',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Paper',
      name: 'Prospect Theory: An Analysis of Decision under Risk',
      paper: { authors: 'Daniel Kahneman and Amos Tversky', year: 1979, title: 'Prospect Theory: An Analysis of Decision under Risk', venue: 'Econometrica 47 (2): 263–291', doi: '10.2307/1914185' },
      introduces: ['behav-2.2', 'behav-2.3', 'behav-2.4', 'behav-2.6', 'behav-2.7'],
      statement: String.raw`Using hypothetical choices put to students and faculty (in Israel, with replications in Stockholm and Michigan), Kahneman and Tversky documented systematic violations of expected utility theory and proposed **prospect theory** in its place:

- **Certainty effect**: outcomes that are certain are overweighted relative to merely probable ones (82% preferred 2,400 for sure to a gamble worth more, yet 83% reversed that choice when both options were made uncertain).
- **Reflection effect**: preferences between losses mirror those between gains, risk aversion for gains becoming risk seeking for losses.
- **Isolation effect**: components shared by the options are ignored, so the framing of a problem changes the choice.

The theory evaluates a prospect in two phases. Editing codes outcomes as **gains and losses relative to a reference point**; evaluation assigns $V=\sum_i\pi(p_i)\,v(x_i)$, where the value function $v$ is concave for gains, convex for losses and steeper for losses than for gains (**loss aversion**), and the decision weight $\pi(p)$ is not a probability: it overweights small probabilities, underweights moderate and high ones, and satisfies $\pi(p)+\pi(1-p)<1$. Its scope is choice among prospects with few outcomes and stated probabilities; the paper's figures of $v$ and $\pi$ are qualitative.`,
      idea: String.raw`Expected utility (von Neumann and Morgenstern's axioms, behav-1.3) was the accepted normative and descriptive theory of risky choice, and Allais (behav-1.16) had shown in 1953 that people violate its independence axiom. Kahneman and Tversky turned isolated paradoxes into a catalogue of effects (the certainty effect, behav-2.6, and the reflection effect, behav-2.7) and a single descriptive model that explains them: a reference-dependent, S-shaped value function with loss aversion (behav-2.3, behav-2.2), echoing the psychophysics of diminishing sensitivity (Fechner's law, psych-1.11), and a probability-weighting function (behav-2.4). It became one of the most cited papers in economics, launched behavioural economics, was extended to cumulative prospect theory in 1992, and was cited when Kahneman received the 2002 Nobel memorial prize (Tversky had died in 1996).`,
      caption: String.raw`Answer each problem before you see the data: click a problem number, then click the option you would choose. The paper's percentages (and $N$) appear once you have answered; the chips turn green when you agreed with the majority. Below, prospect theory's two curves: the value function $v(x)$ (curvature $\alpha$, loss aversion $\lambda$) and the weighting function $\pi(p)$ ($\gamma$ for gains, $\delta$ for losses), with the current problem's outcomes and probabilities marked. Set the parameters (or load Tversky and Kahneman's 1992 estimates) and see how many of the paper's majority choices the theory reproduces, compared with expected value.`,
      deps: ['behav-1.16', 'behav-1.3', 'psych-1.11'],
      refs: [],
      tags: ['decision', 'prospect theory', 'history'],
      credit: 'Kahneman & Tversky, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prospect_theory' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('curvature $\\alpha$', 0.3, 1.2, 0.88, { step: 0.01 });
        const lS = v.slider('loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const gS = v.slider('weighting, gains $\\gamma$', 0.3, 1.2, 0.61, { step: 0.01 });
        const dS = v.slider('weighting, losses $\\delta$', 0.3, 1.2, 0.69, { step: 0.01 });
        v.button('Tversky–Kahneman 1992', () => { aS.set(0.88); lS.set(2.25); gS.set(0.61); dS.set(0.69); });
        v.button('expected value', () => { aS.set(1); lS.set(1); gS.set(1); dS.set(1); });
        const reveal = v.toggle('show all results', false);
        const S = v.stage({ x: [0, 100], y: [0, 64], axes: false, height: 330, full: true });
        const Vs = v.stage({ x: [-6.6, 6.6], y: [-10, 6], axes: true, height: 290, xlabel: 'outcome x (thousands)', ylabel: 'v(x)', title: 'value function (Figure 3, now with parameters)' });
        const Ws = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 290, xlabel: 'stated probability p', ylabel: 'π(p)', title: 'weighting function (Figure 4)', equal: false });
        let cur = 0; const ans = {};
        const chipX = (k) => 1 + k * (98 / PROBS.length);
        const cardA = [2, 4, 48.5, 40], cardB = [51.5, 4, 98, 40];
        S.onClick((x, y) => {
          if (y > 54) { const k = Math.floor((x - 1) / (98 / PROBS.length)); if (k >= 0 && k < PROBS.length) cur = k; return; }
          const inside = (c) => x >= c[0] && x <= c[2] && y >= c[1] && y <= c[3];
          if (inside(cardA)) ans[PROBS[cur].id] = 0; else if (inside(cardB)) ans[PROBS[cur].id] = 1;
        });
        const predict = (P, a, l, g, d) => { if (!P.A) return null; const va = V(P.A, a, l, g, d), vb = V(P.B, a, l, g, d); return { va, vb, c: Math.abs(va - vb) < 1e-9 * Math.max(1, Math.abs(va)) ? -1 : va > vb ? 0 : 1 }; };
        const majority = (P) => (P.pct[0] > P.pct[1] ? 0 : 1);
        let st = null;
        v.legend([['blue', 'gains'], ['red', 'losses'], ['gold', 'outcomes / probabilities of this problem', { dot: true }], ['faint', 'expected value (linear)', { dash: true }]]);
        v.render(() => {
          const a = aS.value, l = lS.value, g = gS.value, d = dS.value, P = PROBS[cur], lab = P.L || ['A', 'B'];
          // ---- chips
          PROBS.forEach((Q, k) => {
            const x0 = chipX(k), x1 = x0 + 98 / PROBS.length - 0.6, has = ans[Q.id] != null, agree = has && ans[Q.id] === majority(Q);
            S.rect(x0, 55.5, x1, 62.5, { fill: k === cur ? 'accent' : has ? (agree ? 'green' : 'orange') : 'grid', fillAlpha: k === cur ? 0.9 : has ? 0.35 : 1, color: k === cur ? 'accent' : 'faint', width: 1 });
            S.text(Q.id, (x0 + x1) / 2, 59, { align: 'center', size: 12, weight: 700, color: k === cur ? 'panel' : 'ink', halo: false });
          });
          // ---- header
          const head = `Problem ${P.id} · N = ${P.N}${P.head ? ' · ' + P.head : ' · Choose between'}`;
          const wrap = (str, n) => { const out = []; let line = ''; for (const w of str.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
          const hl = wrap(head, 118);
          hl.forEach((t, i) => S.text(t, 2, 51 - i * 4.2, { size: 12.5, weight: i === 0 ? 600 : 500, color: 'ink' }));
          // ---- cards
          const show = reveal.value || ans[P.id] != null, pred = predict(P, a, l, g, d);
          [cardA, cardB].forEach((c, k) => {
            const chosen = ans[P.id] === k, top = c[3] - (hl.length > 1 ? 4 : 0);
            S.rect(c[0], c[1], c[2], top, { fill: chosen ? 'accent' : 'panel', fillAlpha: chosen ? 0.12 : 1, color: chosen ? 'accent' : 'faint', width: chosen ? 2.4 : 1.2 });
            S.text(lab[k], c[0] + 2.2, top - 4.2, { size: 18, weight: 800, color: chosen ? 'accent' : 'muted' });
            const txt = P.A ? lines(k === 0 ? P.A : P.B) : (k === 0 ? P.tA : P.tB);
            txt.forEach((t, i) => S.text(t, c[0] + 7, top - 4.2 - i * 5, { size: 13.5, weight: 500 }));
            if (P.A) S.text(`expected value ${num(Math.round(EV(k === 0 ? P.A : P.B)))}`, c[0] + 7, c[1] + 12.5, { size: 11.5, color: 'muted' });
            if (pred) S.text(`prospect value V = ${pred[k === 0 ? 'va' : 'vb'].toFixed(3)}${pred.c === k ? '  ◀ predicted' : ''}`, c[0] + 7, c[1] + 8.5, { size: 11.5, color: pred.c === k ? 'purple' : 'muted', weight: pred.c === k ? 700 : 500 });
            // the paper's percentage
            const bx0 = c[0] + 2, bx1 = c[2] - 2, by = c[1] + 2.2;
            S.rect(bx0, by - 1.2, bx1, by + 1.6, { fill: 'grid', fillAlpha: 1, stroke: false });
            if (show) {
              const f = P.pct[k] / 100, maj = majority(P) === k;
              S.rect(bx0, by - 1.2, bx0 + (bx1 - bx0) * f, by + 1.6, { fill: maj ? 'green' : 'orange', fillAlpha: 0.8, stroke: false });
              S.text(`${P.pct[k]}%${maj ? ' *' : ''}`, bx0 + (bx1 - bx0) * f, by + 0.2, { size: 12, weight: 700, dx: 5, color: 'ink' });
            } else S.text('? answer first', (bx0 + bx1) / 2, by + 0.2, { size: 11.5, align: 'center', color: 'muted' });
          });
          // ---- value function
          const xs = P.A ? [...P.A, ...P.B].filter(([x]) => x !== 0).map(([x]) => x / 1000) : [];
          const vmax = 6.6 ** a, vmin = -l * 6.6 ** a;
          Vs.setView([-6.6, 6.6], [vmin * 1.08, vmax * 1.6]);
          Vs.fn((x) => x, { color: 'faint', width: 1.2, dash: [5, 4] });
          Vs.fn((x) => (x >= 0 ? x ** a : NaN), { color: 'blue', width: 2.6, domain: [0, 6.6] });
          Vs.fn((x) => (x <= 0 ? -l * (-x) ** a : NaN), { color: 'red', width: 2.6, domain: [-6.6, 0] });
          for (const x of xs) { const y = val(x * 1000, a, l); Vs.line(x, 0, x, y, { color: 'gold', width: 1, dash: [3, 3] }); Vs.dot(x, y, { r: 4.5, color: 'gold' }); }
          Vs.text(`v(−1) / v(1) = −${l.toFixed(2)}`, -6.3, vmax * 1.3, { color: 'red', weight: 600, size: 12 });
          // ---- weighting function
          Ws.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [5, 4] });
          Ws.fn((p) => wfun(p, g), { color: 'blue', width: 2.6, domain: [0, 1] });
          Ws.fn((p) => wfun(p, d), { color: 'red', width: 2, dash: [7, 4], domain: [0, 1] });
          if (P.A) for (const [x, p] of [...P.A, ...P.B]) { if (x === 0 || p >= 1) continue; const q = wfun(p, x > 0 ? g : d); Ws.line(p, 0, p, q, { color: 'gold', width: 1, dash: [3, 3] }); Ws.dot(p, q, { r: 4.5, color: 'gold' }); }
          Ws.text(`π(.33) + π(.67) = ${(wfun(0.33, g) + wfun(0.67, g)).toFixed(2)}`, 0.04, 0.9, { size: 12, weight: 600, color: 'blue' });
          // ---- tallies
          let ptOk = 0, evOk = 0, evTie = 0, nMon = 0, you = 0, nAns = 0;
          for (const Q of PROBS) {
            if (ans[Q.id] != null) { nAns++; if (ans[Q.id] === majority(Q)) you++; }
            const pq = predict(Q, a, l, g, d), eq = predict(Q, 1, 1, 1, 1); if (!pq || Q.id === '9') continue;
            nMon++; if (pq.c === majority(Q)) ptOk++; if (eq.c === majority(Q)) evOk++; if (eq.c < 0) evTie++;
          }
          st = { P, pred, ptOk, evOk, evTie, nMon, you, nAns, show, lab };
        });
        v.readout(() => {
          if (!st) return '';
          const { P, pred, ptOk, evOk, evTie, nMon, you, nAns, show, lab } = st;
          const maj = majority(P), mine = ans[P.id];
          let s = mine == null ? `**Problem ${P.id}**: click the option you would choose.` : `**Problem ${P.id}**: you chose ${lab[mine]}; **${P.pct[mine]}%** of the paper's ${P.N} respondents chose ${lab[mine]} (${mine === maj ? 'the majority' : 'the minority'}).`;
          if (show && !(mine != null)) s += ` The paper: ${lab[0]} ${P.pct[0]}%, ${lab[1]} ${P.pct[1]}% (N = ${P.N}).`;
          if (pred) s += ` With these parameters prospect theory predicts **${pred.c < 0 ? 'indifference' : lab[pred.c]}**${show ? (pred.c === maj ? ' ✓' : ' ✗') : ''}.`;
          else if (P.id === '9') s += ' Prospect theory explains the rejection through the overweighting of the certainty that full insurance buys (paper, p. 270).';
          else s += ' Non-monetary outcomes: the certainty effect again, π(.50) times the long tour losing to the sure short tour, while π(.05) against π(.10) favours the long tour.';
          if (P.id === '10') s += ' Ignoring the shared first stage (the isolation effect), it is Problem 3 again; in final outcomes it is Problem 4, where the majority chose the other way.';
          if (P.id === '11' || P.id === '12') s += ' In final wealth Problems 11 and 12 are identical (2,000 vs a .5 chance of 1,000 more), so expected utility of wealth cannot choose B and C.';
          return `${s} · Over the ${nMon} monetary problems, these parameters reproduce **${ptOk}** of the paper's majority choices; expected value reproduces ${evOk} (and is indifferent in ${evTie}) · you agree with the majority on ${you} of ${nAns} answered · today: Tversky and Kahneman's 1992 estimates (median of individual fits: $\\alpha$ = 0.88, $\\lambda$ = 2.25, $\\gamma$ = 0.61, $\\delta$ = 0.69) reproduce 15 of these 17 majorities, missing Problems 7 and 7′`;
        });
      },
    },
  ],
};
