// Political Science & Social Choice — Chapter 5 (part b): items 5.6-5.10
import {aggregationConcept} from './source-audit-aggregation.js';
import {swingTheorem} from './source-audit-swing.js';
import {juryTheorem} from './source-audit-strategic-jury.js';
import {downsIgnorance} from './source-audit-downs-items.js';
import { sum, range, clamp, mean, pct, Phi, phi, lgam, binomPmf, binomTail, majProb, tieProb, logspace } from './ch05.shared.js';

export default {
  collection: 'polsci',
  chapter: 5,
  items: [
    // Source-audited jury branches 5.6
    juryTheorem,

    // Source-audited finite comparison 5.7
    downsIgnorance,

    // Source-audited independent aggregation illustration 5.8
    aggregationConcept,

    // Source-audited exact deviation example 5.9
    swingTheorem,

    // ───────────────────────────────────────────────────────────── 5.10
    {
      num: '5.10',
      kind: 'Paper',
      name: 'Essai sur l’application de l’analyse à la probabilité…',
      paper: { authors: 'Marquis de Condorcet', year: 1785, title: 'Essai sur l’application de l’analyse à la probabilité des décisions rendues à la pluralité des voix', venue: 'Paris: Imprimerie Royale', url: 'https://archive.org/details/essaisurlapplica00cond' },
      introduces: ['polsci-5.4', 'polsci-2.1', 'polsci-1.6'],
      statement: String.raw`Condorcet's *Essai* applies probability to decisions taken by majority vote. Two results from it organize this chapter and the one before. First, if each voter in an assembly is right with probability greater than one half and votes independently, then the probability that the majority is right grows with the size of the assembly and approaches certainty; if each voter is more likely wrong than right the opposite happens. This is the jury theorem (polsci-5.4). Second, in the voting examples he discusses, majority preferences among three or more candidates can be cyclic: a majority prefers $A$ to $B$, a majority prefers $B$ to $C$, yet a majority prefers $C$ to $A$ (polsci-2.1), so that the candidate who beats every other in pairwise contests, when there is one, is the right winner (polsci-1.6) and may fail to exist. (This account follows the standard secondary literature; I have not been able to check the *Essai* itself, so the extent to which each result appears there in the modern form, in particular the general jury theorem, should be read with that caveat.)`,
      idea: String.raw`The two ideas answer the same question from opposite sides. For two alternatives where one is correct, majority rule is a statistical estimator whose error shrinks with the group size, so a large group is trustworthy. For three or more alternatives, pairwise majority is not an estimator of anything: voters with perfectly transitive rankings can produce an intransitive collective preference, and the aggregation problem is structural, not statistical. Condorcet's criticism of the Borda count (polsci-1.5) comes from the same pairwise logic. The first result underlies the epistemic defence of democracy; the second opens the line that leads through Arrow's theorem (polsci-3.3).`,
      caption: String.raw`**Left:** a jury of $n$ independent voters, each right with probability $p$; the curve gives the exact probability that the majority is right. For $p>\tfrac12$ it climbs to 1, for $p<\tfrac12$ it sinks to 0. **Right:** three candidates and the voters' rankings. The initial electorate is the classic one of three voters ($ABC$, $BCA$, $CAB$), in which every pairwise majority is 2 to 1 and they form a cycle. Press the button to draw a random electorate of the size you pick, with each voter's ranking chosen uniformly among the six; the readout reports how often such electorates are cyclic, from a simulation of 3000 draws.`,
      deps: ['polsci-1.5'],
      see: ['polsci-5.4', 'polsci-2.1', 'polsci-2.2'],
      refs: [],
      tags: ['paper', 'jury theorem', 'Condorcet'],
      credit: 'Marquis de Condorcet, 1785',
      scope: String.raw`The rankings in the right panel are random draws from a model (every strict ranking equally likely), not historical data, and the cycle frequency is my own simulation. The jury panel assumes independent voters of equal competence.`,
      verify: true,
      links: { archive: 'https://archive.org/details/essaisurlapplica00cond' },
      viz(v) {
        const J = v.stage({ x: [0, 201], y: [0, 1.02], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'jury size $n$', ylabel: 'probability majority is right', title: 'the jury' });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.75], equal: true, axes: false, height: 340, minWidth: 300, title: 'three candidates, pairwise majorities' });
        const pS = v.slider('competence $p$', 0.3, 0.8, 0.6, { step: 0.005 });
        const nS = v.slider('voters in the election $m$', 3, 101, 3, { int: true, step: 2, onChange: () => draw() });
        const rng = v.rng(1785);
        const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]], NM = 'ABC';
        let counts = [1, 0, 0, 1, 1, 0]; // ABC, BCA, CAB
        const tally = () => {
          const w = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          PERMS.forEach((pm, k) => { for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) w[pm[i]][pm[j]] += counts[k]; });
          return w;
        };
        function draw() {
          const m = nS.value;
          counts = [0, 0, 0, 0, 0, 0];
          if (m === 3) counts = [1, 0, 0, 1, 1, 0];
          else for (let i = 0; i < m; i++) counts[rng.int(0, 5)]++;
          v.invalidate();
        }
        v.button('draw a random electorate', () => { const m = nS.value; counts = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < m; i++) counts[rng.int(0, 5)]++; });
        const freqCache = new Map();
        const cycleFreq = (m) => {
          if (!freqCache.has(m)) {
            const r = v.rng(m * 7 + 11); let k = 0;
            for (let t = 0; t < 3000; t++) {
              const w = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
              for (let i = 0; i < m; i++) { const pm = PERMS[r.int(0, 5)]; for (let x = 0; x < 3; x++) for (let y = x + 1; y < 3; y++) w[pm[x]][pm[y]]++; }
              const AB = w[0][1] > w[1][0], BC = w[1][2] > w[2][1], CA = w[2][0] > w[0][2];
              if ((AB && BC && CA) || (!AB && !BC && !CA)) k++;
            }
            freqCache.set(m, k / 3000);
          }
          return freqCache.get(m);
        };
        const jc = new Map();
        const jury = (p) => { const key = p.toFixed(4); if (!jc.has(key)) { if (jc.size > 40) jc.clear(); jc.set(key, range(101).map((i) => [2 * i + 1, majProb(2 * i + 1, p)])); } return jc.get(key); };
        const P3 = [[0, 1.15], [-0.98, -0.55], [0.98, -0.55]];
        let info = {};
        v.render(() => {
          const p = pS.value;
          J.path(jury(p), { color: 'accent', width: 2.4 }); J.path(jury(1 - p), { color: 'red', width: 1.8, alpha: 0.8 });
          J.hline(0.5, { color: 'faint', dash: true });
          const w = tally(), m = sum(counts), edges = [];
          for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
            const win = w[i][j] > w[j][i] ? [i, j] : w[j][i] > w[i][j] ? [j, i] : null;
            edges.push({ i, j, win, a: w[i][j], b: w[j][i] });
          }
          const cyc = edges.every((e) => e.win) && (() => { const into = [0, 0, 0]; edges.forEach((e) => into[e.win[1]]++); return into.every((x) => x === 1); })();
          for (const e of edges) {
            const [x, y] = e.win ? [e.win[0], e.win[1]] : [e.i, e.j];
            const p0 = P3[x], p1 = P3[y], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L0 = Math.hypot(dx, dy), u = [dx / L0, dy / L0];
            C.arrow(p0[0] + u[0] * 0.28, p0[1] + u[1] * 0.28, p1[0] - u[0] * 0.28, p1[1] - u[1] * 0.28, { color: cyc ? 'red' : 'accent', width: 2.6, head: 11 });
            const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
            C.text(`${NM[e.i]}:${e.a}  ${NM[e.j]}:${e.b}`, mx - u[1] * 0.2 * (mx > 0 ? -1 : 1) * 0 + (mx > 0.1 ? 0.35 : mx < -0.1 ? -0.35 : 0), my + (Math.abs(mx) < 0.1 ? -0.2 : 0.1), { size: 11.5, align: 'center', color: 'ink' });
          }
          P3.forEach((pt, i) => C.dot(pt[0], pt[1], { r: 15, color: ['blue', 'orange', 'purple'][i] }));
          P3.forEach((pt, i) => C.text(NM[i], pt[0], pt[1], { size: 14, color: 'panel', weight: 700, align: 'center', baseline: 'middle' }));
          const cw = [0, 1, 2].filter((i) => [0, 1, 2].every((j) => j === i || w[i][j] > w[j][i]));
          C.text(cyc ? 'cycle: no Condorcet winner' : cw.length ? `Condorcet winner: ${NM[cw[0]]}` : 'tie in some pair', 0, -1.3, { size: 13, weight: 700, color: cyc ? 'red' : 'green', align: 'center' });
          info = { m, cyc, p, n: 101 };
        });
        v.legend([['accent', 'competence $p$'], ['red', 'competence $1-p$']]);
        v.readout(() => `Jury: with $p=${v.fix(info.p, 3)}$ and $n=101$ the majority is right with probability ${v.fix(majProb(101, info.p), 4)}. Election with ${info.m} voters, rankings uniform: in 3000 simulated electorates of this size, **${pct(cycleFreq(info.m), 1)}** have a cyclic pairwise majority (for ${info.m} voters).`);
      },
    },
  ],
};
