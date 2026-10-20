// Political Science & Social Choice — Chapter 4: Spatial models and the median voter
import {strictSpatialHandle,spatialPoint} from './source-audit-spatial-state.js';
import {yolkConcept} from './source-audit-yolk.js';
import {chaosTheorem} from './source-audit-chaos.js';
import {plottModel,PLOTT_BASE} from './source-audit-plott.js';
import { CC, sum, range, clamp, txt, rr, chip, Phi, phi, median, mean, pct, dist2, votesFor, beats, yolk, medianLines, tournament, coverage, sophisticated, chaosPath, mixGrid, binX, gridMedian, gridMean, LINE } from './ch04.shared.js';

// ---------- local helpers (items 4.1-4.7; the rest are in ch04-b.js)
const LET = 'ABCDEFGHIJ';
/** Utility of a voter with peak p at position x: three single-peaked shapes (only the order of utilities matters). */
const UT = {
  tent: (p, x) => 1 - Math.abs(x - p) / 10,
  skew: (p, x) => 1 - (x < p ? (p - x) / 6 : (x - p) / 14),
  quad: (p, x) => 1 - ((x - p) * (x - p)) / 60,
};
/** The seven alternatives A..G placed on the policy line. */
const ALT = [0.8, 2.2, 3.6, 5, 6.4, 7.8, 9.2];
/** Ranking (best first) of indices given utilities. */
const rankOf = (u) => range(u.length).sort((a, b) => u[b] - u[a] || a - b);
/** In an ordering of alternatives (positions along an axis), the first triple a, b, c in which the middle one is strictly worst for a voter with utilities u. */
function valley(u, order) {
  const n = order.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const a = order[i], b = order[j], c = order[k];
    if (u[b] < Math.min(u[a], u[c]) - 1e-9) return [a, b, c];
  }
  return null;
}
/** Pairwise majority matrix over alternatives with utilities U[voter][alt]: M[a][b] = voters preferring a minus those preferring b. */
function majMatrix(U) {
  const m = U[0].length;
  return range(m).map((a) => range(m).map((b) => (a === b ? 0 : sum(U.map((u) => Math.sign(u[a] - u[b]))))));
}
/** First Condorcet cycle a > b > c > a in a majority matrix, or null. */
function findCycle(M) {
  const m = M.length;
  for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
    if (M[a][b] <= 0) continue;
    for (let c = 0; c < m; c++) if (M[b][c] > 0 && M[c][a] > 0) return [a, b, c];
  }
  return null;
}
const condorcetOf = (M) => range(M.length).filter((a) => range(M.length).every((b) => b === a || M[a][b] > 0));

export default {
  collection: 'polsci',
  chapter: 4,
  title: 'Spatial models and the median voter',
  summary: String.raw`Place voters and policies on a line and give each voter a single-peaked preference. Then majority rule behaves: the median voter’s ideal point beats every alternative (Black), vote-seeking parties are drawn toward it (Hotelling and Downs), and the same logic ties the size of redistribution to the gap between the median and the mean income (Meltzer and Richard). Reality pulls parties apart again once candidates care about policy, turnout falls with distance, or the median is uncertain. In two or more dimensions the picture changes completely. A Condorcet winner exists only when the voters’ ideal points are arranged with a special symmetry (Plott); otherwise a majority can be led from any point to any other (McKelvey), and the outcomes that sophisticated agendas can produce shrink only to the yolk and the uncovered set. What keeps real legislatures stable is therefore institutional: who proposes (Romer and Rosenthal), whose consent is needed (Tsebelis) and which committee has jurisdiction over which issue (Shepsle and Weingast). The chapter ends with Black’s and Downs’s original papers.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Single-peaked preferences',
      statement: String.raw`Let the alternatives be arranged along a line by some fixed ordering $\prec$ (an *axis*: left to right, say). A voter's strict preference ordering is **single-peaked** with respect to $\prec$ if there is a top-ranked alternative $x^*$, the voter's *peak*, such that moving away from $x^*$ in either direction makes things worse: for alternatives $y \prec z \preceq x^*$ or $x^* \preceq z \prec y$, the voter ranks $z$ above $y$. Equivalently, **in no triple $a \prec b \prec c$ does the voter rank the middle alternative $b$ below both $a$ and $c$.** A profile is single-peaked if every voter is single-peaked with respect to the *same* axis.

Single-peakedness is a restriction on the domain of preferences, and it depends on the axis: the same ballots can be single-peaked along one ordering of the alternatives and not along another. What matters for what follows is that *some* common axis exists.`,
      idea: String.raw`The spatial picture is the model: alternatives are positions on a policy line and a voter's satisfaction falls as the position moves away from her ideal point, so her ranking is single-peaked whatever the exact shape of the fall-off (symmetric or lopsided, linear or curved). The "no valley" form of the definition is what the proof of the median voter theorem uses (polsci-4.2): a valley is exactly what lets a majority cycle appear, as in Condorcet's paradox (polsci-2.1). The definition restricts the domain of Arrow's unrestricted-domain condition, which is why single-peaked electorates escape the cycles of the unrestricted case.`,
      caption: String.raw`Left: five voters' utility curves over a policy line with seven alternatives $A$–$G$. Drag a voter's peak (the dot at the top of her curve) and pick the curve shape. The slider gives voter 3 a second hump at the far end of the line. Right: the same voters' rankings along the axis you pick. Bars show how high each voter ranks each alternative; a red bar is the middle of a triple that the voter ranks below both outer alternatives. Only the natural left-to-right axis fits everybody: reorder the axis, or add the second hump, and the checker fails.`,
      deps: ['polsci-1.1'],
      see: ['polsci-4.2', 'polsci-4.12', 'polsci-3.3'],
      refs: ['Shepsle: spatial model', 'Black (1948), Journal of Political Economy 56: 23–34'],
      tags: ['single-peaked', 'domain restriction'],
      credit: 'Duncan Black, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Single_peaked_preferences' },
      viz(v) {
        const A = v.stage({ x: [0, 10], y: [-0.75, 1.18], axes: 'box', gutter: true, height: 340, minWidth: 340, xticks: ALT.map((x, k) => [x, LET[k]]), yticks: [], xlabel: 'policy line', ylabel: 'utility (only the order matters)', title: 'preferences over a policy line' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 340, title: 'the rankings along an axis' });
        const shape = v.select('curve shape', [{ value: 'tent', label: 'symmetric' }, { value: 'skew', label: 'lopsided' }, { value: 'quad', label: 'curved' }], 'tent');
        const hump = v.slider('second hump of voter 3', 0, 1, 0, { step: 0.01 });
        const order = v.select('axis', [{ value: 'nat', label: 'A B C D E F G' }, { value: 'swap', label: 'A B E D C F G' }, { value: 'shuf', label: 'D A F B G C E' }], 'nat');
        const ORD = { nat: [0, 1, 2, 3, 4, 5, 6], swap: [0, 1, 4, 3, 2, 5, 6], shuf: [3, 0, 5, 1, 6, 2, 4] };
        const PK = [1.4, 3.1, 4.9, 6.6, 8.5];
        const H = PK.map((p, i) => A.handle(p, 1, { color: CC[i], r: 7.5, constrain: 'x', label: `${i + 1}`, labelPos: 'n' }));
        const hx = () => (H[2].x < 5 ? 9.2 : 0.8);
        const util = (i, x) => {
          const b = UT[shape.value](H[i].x, x);
          return i === 2 ? Math.max(b, hump.value * Math.exp(-(((x - hx()) / 0.9) ** 2))) : b;
        };
        let info = null;
        v.render(() => {
          const U = range(5).map((i) => ALT.map((x) => util(i, x)));
          const ord = ORD[order.value];
          for (let i = 0; i < 5; i++) {
            A.fn((x) => util(i, x), { color: CC[i], width: 2, alpha: 0.9 });
            ALT.forEach((x, k) => A.dot(x, U[i][k], { r: 3, color: CC[i] }));
          }
                  // right panel
          const c = B.ctx, W = B.width, Hh = B.height, rowH = (Hh - 54) / 5, x0 = 56, sw = (W - x0 - 38) / 7;
          const bad = [];
          for (let i = 0; i < 5; i++) {
            const Y = 12 + (i + 1) * rowH, rk = rankOf(U[i]), val = valley(U[i], ord);
            bad.push(val);
            chip(v, c, 22, Y - rowH / 2 + 2, 0, { r: 10, color: CC[i], label: String(i + 1) });
            ord.forEach((a, k) => {
              const h = ((7 - rk.indexOf(a)) / 7) * (rowH - 14), X = x0 + k * sw + sw / 2, hot = val && val.includes(a);
              c.fillStyle = v.color(hot ? 'red' : CC[i], hot ? 0.8 : rk[0] === a ? 0.9 : 0.4); rr(c, X - sw * 0.34, Y - 4 - h, sw * 0.68, h, 3); c.fill();
              if (rk[0] === a) txt(v, c, '★', X, Y - 4 - h - 7, { size: 11, color: 'gold' });
            });
            c.strokeStyle = v.color('grid'); c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - 4, Y - 3.5); c.lineTo(W - 34, Y - 3.5); c.stroke();
            txt(v, c, val ? '✗' : '✓', W - 16, Y - rowH / 2, { size: 17, weight: 800, color: val ? 'red' : 'green' });
          }
          ord.forEach((a, k) => txt(v, c, LET[a], x0 + k * sw + sw / 2, Hh - 22, { size: 13, weight: 700, color: 'muted' }));
          txt(v, c, 'axis →', x0 - 8, Hh - 22, { size: 10.5, color: 'muted', align: 'right' });
          txt(v, c, 'bar height = how high the voter ranks the alternative', W / 2, Hh - 6, { size: 10, color: 'muted' });
          info = { U, bad, ord };
        });
        v.legend([['red', 'middle of a triple ranked below both ends'], ['gold', 'peak ★', { dot: true }]]);
        v.readout(() => {
          const { U, bad, ord } = info;
          const names = (t) => t.map((a) => LET[a]).join(', ');
          const ok = bad.filter((b) => !b).length;
          const lines = U.map((u, i) => `voter ${i + 1}: ${rankOf(u).map((a) => LET[a]).join(' ≻ ')}${bad[i] ? ` — ranks ${LET[bad[i][1]]} below both ${LET[bad[i][0]]} and ${LET[bad[i][2]]}` : ''}`);
          const M = majMatrix(U), cyc = findCycle(M), cw = condorcetOf(M);
          const tail = ok === 5
            ? `All five rankings are single-peaked along **${names(ord)}**, so majority rule has a Condorcet winner (here ${cw.map((a) => LET[a]).join('')}) and no cycle, as the median voter theorem predicts.`
            : `**${ok} of 5** voters are single-peaked along ${names(ord)}. ${cyc ? `The majority relation of these very rankings cycles: ${LET[cyc[0]]} ≻ ${LET[cyc[1]]} ≻ ${LET[cyc[2]]} ≻ ${LET[cyc[0]]}.` : cw.length ? `Here the majority relation still has a Condorcet winner (${LET[cw[0]]}); single-peakedness is sufficient for that, not necessary.` : 'Majority rule has no Condorcet winner here.'}`;
          return `${lines.join('\n')}\n${tail}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Black’s median voter theorem',
      statement: String.raw`Let an odd number $n$ of voters have strict, single-peaked preferences over alternatives arranged on a line, with peaks $x_1 \le \dots \le x_n$ and **median peak** $m = x_{(n+1)/2}$. Then $m$ is a **Condorcet winner**: for every other alternative $y$, a strict majority of voters prefers $m$ to $y$. It is therefore the only alternative that is never beaten, there is no majority cycle, and majority rule is transitive on the profile.

With an even number of voters, every alternative between the two middle peaks is never beaten by any alternative, although ties become possible. Without single-peakedness the conclusion fails in general: majority cycles can appear (polsci-2.1).`,
      idea: String.raw`Take any $y \ne m$, say $y < m$. Every voter whose peak is at or to the right of $m$ (at least $(n+1)/2$ of them, since $m$ is the median) sees $y$ and $m$ on the same side of her peak, with $m$ nearer; single-peakedness says she prefers $m$ to $y$. That is a majority for $m$ whatever else the remaining voters think, and the case $y > m$ is the mirror image. The only property used is that nobody ranks the middle of three alternatives last (polsci-4.1); the cardinal shape of the utility curves never enters. Because the argument is about each pair $(m, y)$ separately, a profile that fails single-peakedness for even one voter can break it.`,
      caption: String.raw`Drag the voters' peaks (dots on the line), the challenger $y$ (orange) and the number of voters. Top: each voter's utility curve; the median peak $m$ is the green line, and each voter's ring is green if she prefers $m$ to $y$, orange if she prefers $y$. Bottom: for every alternative $y$, the net number of voters who prefer $m$, divided by $n$. It never goes below zero while everyone is single-peaked. Raise the second hump of voter 3 (or press the button for Black's three-voter cycle) and the median can lose; the readout then searches all alternatives for a Condorcet winner and a cycle.`,
      deps: ['polsci-4.1', 'polsci-2.1'],
      see: ['polsci-4.12', 'polsci-4.3', 'polsci-3.3'],
      refs: ['Shepsle: spatial model', 'Black (1948), Journal of Political Economy 56: 23–34'],
      tags: ['median voter', 'Condorcet winner'],
      credit: 'Duncan Black, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Median_voter_theorem' },
      viz(v) {
        const S = v.stage({ x: [0, 10], y: [-0.5, 1.2], axes: 'box', gutter: true, height: 300, full: true, yticks: [], xlabel: 'policy line', ylabel: 'utility', title: 'voters, their curves, and the median' });
        const D = v.stage({ x: [0, 10], y: [-1.05, 1.05], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'challenger y', ylabel: 'net share for m', title: 'how the median fares against each challenger', yticks: [[-1, '−1'], [0, '0'], [1, '1']] });
        const nS = v.slider('voters $n$', 3, 9, 5, { int: true, step: 2 });
        const hump = v.slider('second hump of voter 3', 0, 1, 0, { step: 0.01 });
        const PK = [1.2, 3.0, 4.6, 6.8, 8.7, 2.2, 7.6, 5.4, 9.3];
        const H = PK.map((p, i) => S.handle(p, 0, { color: CC[i % 5], r: 7, constrain: 'x', label: `${i + 1}`, labelPos: 's' }));
        const Y = S.handle(7.7, -0.3, { color: 'orange', r: 8, constrain: 'x', label: 'y', labelPos: 's' });
        const hx = () => (H[2].x < 5 ? 9.2 : 0.8);
        const util = (i, x) => {
          const b = UT.tent(H[i].x, x);
          return i === 2 ? Math.max(b, hump.value * Math.exp(-(((x - hx()) / 0.9) ** 2))) : b;
        };
        v.button('Black’s three-voter cycle', () => {
          nS.set(3); H[0].set(1, 0); H[1].set(6.5, 0); H[2].set(9, 0); hump.set(0.8);
        });
        v.button('reset', () => { nS.set(5); PK.forEach((p, i) => H[i].set(p, 0)); hump.set(0); Y.set(7.7, -0.3); });
        let st = null;
        const GRID = range(51).map((i) => i * 0.2);
        v.render(() => {
          const n = nS.value;
          H.forEach((h, i) => { h.visible = i < n; });
          const peaks = range(n).map((i) => H[i].x), m = median(peaks), yv = Y.x;
          const prefM = range(n).map((i) => util(i, m) > util(i, yv));
          const tally = [sum(prefM.map(Number)), sum(range(n).map((i) => (util(i, yv) > util(i, m) ? 1 : 0)))];
          range(n).forEach((i) => S.fn((x) => util(i, x), { color: CC[i % 5], width: 1.8, alpha: 0.5 }));
          S.vline(m, { color: 'green', width: 2 }); S.text('m', m, 1.1, { color: 'green', size: 13, weight: 700 });
          S.vline(yv, { color: 'orange', width: 1.5, dash: true });
          range(n).forEach((i) => {
            const pm = util(i, m) > util(i, yv), py = util(i, yv) > util(i, m);
            S.dot(H[i].x, 0.0, { r: 11, hollow: true, color: pm ? 'green' : py ? 'orange' : 'muted' });
          });
          // net share for the median against every challenger
          const net = (x) => sum(range(n).map((i) => Math.sign(util(i, m) - util(i, x)))) / n;
          const pos = (x) => Math.max(net(x), 0), neg = (x) => Math.min(net(x), 0);
          D.hline(0, { color: 'muted' });
          D.between(pos, () => 0, 0, 10, { fill: 'green', fillAlpha: 0.3 });
          D.between(neg, () => 0, 0, 10, { fill: 'red', fillAlpha: 0.45 });
          D.fn(net, { color: 'ink', width: 1.6, n: 400 });
          D.vline(yv, { color: 'orange', dash: true }); D.dot(yv, net(yv), { r: 5, color: 'orange' });
          // Condorcet winner and cycle over a grid of alternatives
          const U = range(n).map((i) => GRID.map((x) => util(i, x)));
          const M = majMatrix(U), cw = condorcetOf(M), cyc = findCycle(M);
          const loseTo = GRID.filter((x) => net(x) < 0);
          st = { n, m, yv, tally, cw: cw.map((a) => GRID[a]), cyc: cyc && cyc.map((a) => GRID[a]), minNet: Math.min(...GRID.map(net)), lose: loseTo.length };
        });
        v.legend([['green', 'the median peak $m$'], ['orange', 'challenger $y$'], ['red', 'challengers that beat $m$']]);
        v.readout(() => {
          const f = (x) => v.fix(x, 1);
          const head = `$n=${st.n}$ voters, median peak $m=${f(st.m)}$. Against $y=${f(st.yv)}$: **${st.tally[0]}** voters prefer $m$, **${st.tally[1]}** prefer $y$.`;
          const tail = st.lose === 0
            ? ` The median beats or ties all 51 sampled alternatives (smallest net share ${v.fix(st.minNet, 2)}); it is the Condorcet winner${st.cw.length ? ` (${st.cw.map(f).join(', ')})` : ''}.`
            : ` The median **loses** to ${st.lose} sampled alternatives. ${st.cw.length ? `A Condorcet winner still exists, at ${st.cw.map(f).join(', ')}, but it is not the median peak.` : `No alternative beats all the others${st.cyc ? `: ${st.cyc.map(f).join(' ≻ ')} ≻ ${f(st.cyc[0])} is a majority cycle` : ''}.`}`;
          return head + tail;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Hotelling–Downs party competition',
      statement: String.raw`Voters have ideal points on a left–right line with distribution $F$ (density $f$) and are **single-peaked**: each votes for the party whose announced position is nearest to her ideal point. Two parties each choose a position $x_A, x_B$ to maximize their number of votes, taking the other's position as given. If every voter votes, the unique equilibrium of this game has **both parties at the median** $m$ of $F$, where $F(m) = \tfrac12$, and they tie. At any other pair of positions the party farther from the median can do better by moving toward it.

The result is fragile in each of its assumptions. If voters abstain when the nearest party is more than a distance $d$ away, or if a third party can enter, or if more than two parties compete, the median is no longer an equilibrium and the parties can stay apart (or no pure equilibrium exists at all).`,
      idea: String.raw`With two parties, the voters nearer $x_A$ than $x_B$ form a half-line cut at the midpoint $(x_A + x_B)/2$, so a party gains by shifting toward its rival exactly while the midpoint is on its own side of the median: its vote share is $F(\text{midpoint})$ or its complement (polsci-4.2). The median is the unique pair at which neither side can move. Hotelling's principle of minimum differentiation, written for two shops on a street (micro-10.17, geog-9.3), is the same calculation with customers for voters, and Black's theorem supplies the voter side. Abstention by the alienated breaks the argument because moving to the centre now loses voters at the margin who have nowhere else to go but home, and a third entrant can take the flank that a centrist party leaves.`,
      caption: String.raw`The shaded density is the electorate; each bin is coloured by what its voters do (vote for party A, B or C, or abstain). Drag the parties' positions, raise the hump separation to make the electorate two-humped, move the left weight, or **paint** extra voters directly on the density. A party may move at most $\Delta$ per turn (nobody leaps over a rival); **A, B move** plays one round of vote-maximizing moves, **run** plays until nobody moves. With no abstention, two parties meet at the median wherever they start; try the alienation threshold $d$ to see them stay apart, and add a third party to see that no resting place exists.`,
      deps: ['polsci-4.2', 'micro-10.17', 'geog-9.3'],
      see: ['polsci-4.13', 'polsci-4.4'],
      refs: ['Shepsle: spatial model', 'Hotelling (1929), Economic Journal 39: 41–57', 'Downs (1957), Journal of Political Economy 65: 135–150'],
      tags: ['party competition', 'median voter'],
      credit: 'Hotelling, 1929; Downs, 1957',
      scope: String.raw`Holds for two vote-maximizing parties, a single policy dimension, full turnout and fixed, publicly known positions. A pure equilibrium need not exist with three or more parties.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hotelling%27s_law' },
      viz(v) {
        const N = 201, Y0 = -0.09;
        const S = v.stage({ x: [0, 10], y: [-0.2, 1.25], axes: 'box', gutter: true, height: 300, full: true, yticks: [], xlabel: 'left–right position', ylabel: 'voters (relative density)', title: 'the electorate and the parties · drag the parties, paint voters' });
        const T = v.stage({ x: [0, 12], y: [0, 10], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'round', ylabel: 'position', title: 'positions round by round' });
        const sep = v.slider('hump separation', 0, 7, 0, { step: 0.1, onChange: () => resetHist() });
        const wl = v.slider('weight of the left hump', 0.15, 0.85, 0.5, { step: 0.01, onChange: () => resetHist() });
        const sd = v.slider('spread', 0.8, 2.4, 1.6, { step: 0.05, onChange: () => resetHist() });
        const dth = v.slider('alienation threshold $d$', 0.8, 10.5, 10.5, { step: 0.1, fmt: (x) => (x >= 10.4 ? '∞ (all vote)' : v.fix(x, 1)), onChange: () => resetHist() });
        const dl = v.slider('largest move per turn $\\Delta$', 0.2, 3, 0.7, { step: 0.05 });
        const third = v.toggle('add a third party C', false, { onChange: () => { Hs[2].visible = third.value; resetHist(); } });
        const PCOL = ['blue', 'orange', 'teal'], NM = ['A', 'B', 'C'];
        const Hs = [2, 8, 5].map((x, j) => S.handle(x, Y0, { color: PCOL[j], r: 9, constrain: 'x', label: NM[j], labelPos: 'n' }));
        Hs[2].visible = false;
        let paint = new Float64Array(N), hist = [], dens = null;
        const act = () => (third.value ? [0, 1, 2] : [0, 1]);
        const pos = () => act().map((j) => Hs[j].x);
        function resetHist() { hist = [pos()]; }
        Hs.forEach((h) => { h.onDrag = () => resetHist(); });
        const weights = () => mixGrid(N, [[wl.value, 5 - sep.value / 2, sd.value], [1 - wl.value, 5 + sep.value / 2, sd.value]], paint);
        /** votes per party and abstention for positions P under density w. */
        function tally(P, w) {
          const vt = P.map(() => 0); let ab = 0; const who = new Int8Array(N);
          for (let i = 0; i < N; i++) {
            const x = binX(N, i); let bd = 1e9, ties = [];
            P.forEach((p, j) => { const dd = Math.abs(x - p); if (dd < bd - 1e-12) { bd = dd; ties = [j]; } else if (Math.abs(dd - bd) <= 1e-12) ties.push(j); });
            if (bd > dth.value) { ab += w[i]; who[i] = -1; continue; }
            ties.forEach((j) => { vt[j] += w[i] / ties.length; }); who[i] = ties[0];
          }
          return { vt, ab, who };
        }
        function round() {
          const w = weights(); let moved = 0; const P = pos();
          act().forEach((j, k) => {
            let bz = P[k], bv = -1;
            for (let z = Math.max(0, P[k] - dl.value); z <= Math.min(10, P[k] + dl.value) + 1e-9; z += 0.05) {
              const Q = P.slice(); Q[k] = z; const val = tally(Q, w).vt[k];
              if (val > bv + 1e-9 || (Math.abs(val - bv) <= 1e-9 && Math.abs(z - P[k]) < Math.abs(bz - P[k]) - 1e-12)) { bv = val; bz = z; }
            }
            moved += Math.abs(bz - P[k]); P[k] = bz; Hs[j].set(bz, Y0);
          });
          hist.push(P.slice()); return moved;
        }
        v.button('A, B move', () => { round(); });
        v.button('run', () => { for (let r = 0; r < 40; r++) if (round() < 1e-6) break; });
        v.button('reset positions', () => { [2, 8, 5].forEach((x, j) => Hs[j].set(x, Y0)); resetHist(); });
        v.button('clear painted voters', () => { paint = new Float64Array(N); resetHist(); });
        S.onDrag((x, y, phase) => {
          if (Hs.some((h) => h.dragging)) return;
          for (let i = 0; i < N; i++) { const dx = binX(N, i) - x; paint[i] += 0.012 * Math.exp(-((dx / 0.45) ** 2)); }
          if (phase === 'end') resetHist();
        });
        resetHist(); for (let r = 0; r < 40; r++) if (round() < 1e-6) break;
        let info = null;
        v.render(() => {
          const w = weights(), P = pos(), tl = tally(P, w), mx = Math.max(...w);
          const med = gridMedian(w), mn = gridMean(w);
          for (let i = 0; i < N; i++) {
            const x0 = LINE.lo + (i * (LINE.hi - LINE.lo)) / N, x1 = x0 + (LINE.hi - LINE.lo) / N, g = tl.who[i];
            S.rect(x0, 0, x1, w[i] / mx, { fill: g < 0 ? 'gray' : PCOL[act()[g]], fillAlpha: g < 0 ? 0.28 : 0.5, stroke: false });
          }
          S.fn((x) => w[clamp(Math.floor((x / 10) * N), 0, N - 1)] / mx, { color: 'ink', width: 1.4, n: 300 });
          S.vline(med, { color: 'green', width: 2 }); S.text('median', med, 1.17, { color: 'green', size: 11.5, weight: 700 });
          if (Math.abs(mn - med) > 0.15) { S.vline(mn, { color: 'muted', dash: true }); S.text('mean', mn, 1.07, { color: 'muted', size: 10.5 }); }
          // trace panel
          const R = Math.max(12, hist.length - 1);
          T.setView([0, R], [0, 10]);
          T.hline(med, { color: 'green', dash: true, width: 1.6 });
          act().forEach((j, k) => T.path(hist.map((q, t) => [t, q[k]]), { color: PCOL[j], width: 2.2 }));
          act().forEach((j, k) => T.dot(hist.length - 1, hist[hist.length - 1][k], { r: 4.5, color: PCOL[j] }));
          info = { P, tl, med, mn };
        });
        v.legend([['blue', 'votes for A', { area: true }], ['orange', 'votes for B', { area: true }], ['teal', 'votes for C', { area: true }], ['gray', 'abstains', { area: true }], ['green', 'median']]);
        v.readout(() => {
          const { P, tl, med } = info, a = act();
          const sh = a.map((j, k) => `${NM[j]} at ${v.fix(P[k], 2)}: **${pct(tl.vt[k], 1)}**`).join(', ');
          const gap = Math.max(...P) - Math.min(...P), settled = hist.length > 1 && Math.abs(hist[hist.length - 1].reduce((s2, x, k) => s2 + Math.abs(x - hist[hist.length - 2][k]), 0)) < 1e-6;
          const verdict = a.length === 2
            ? (gap < 0.2 ? 'The two parties sit together at the median.' : settled ? `They have stopped ${v.fix(gap, 2)} apart: neither gains by moving.` : `They are ${v.fix(gap, 2)} apart and still moving.`)
            : (settled ? 'The three parties have stopped.' : 'With three parties the moves go on: no resting place.');
          return `Median voter at ${v.fix(med, 2)}. ${sh}; abstaining: ${pct(tl.ab, 1)}. ${verdict}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Why parties do not fully converge',
      statement: String.raw`The Hotelling–Downs prediction that competing parties adopt the same platform at the median (polsci-4.3) is not what is observed in two-party systems with real elections: the parties' positions stay apart. Several mechanisms in the formal literature generate separation while keeping the spatial logic:

(a) **Policy-motivated candidates** who care about the policy that is implemented as well as about winning, facing an **uncertain** median voter (Wittman 1983, and others);
(b) **voters who abstain** when both parties are far from them (Downs's own discussion; polsci-4.3);
(c) the **threat of entry** by a third party, which pushes the established parties apart (Palfrey 1984);
(d) **primaries and activists**, which tie a candidate to the party's own supporters.

In model (a) below, two candidates with ideal points $a < b$ choose platforms $x_A, x_B$. The median voter's position $\mu_m \sim N(\mu, \sigma^2)$ is unknown, so $A$ wins with probability $P_A = \Phi\big((\tfrac{x_A + x_B}{2} - \mu)/\sigma\big)$. A candidate with weight $\rho \in [0, 1]$ on winning and $1 - \rho$ on policy maximizes $\rho P_A - (1-\rho)\,\mathbb{E}\,(\text{implemented} - \text{own ideal})^2$. In equilibrium the platforms separate whenever $\sigma > 0$ and $\rho < 1$, and converge to $\mu$ as $\rho \to 1$ or $\sigma \to 0$.`,
      idea: String.raw`With a known median ($\sigma \to 0$) and pure office-seeking ($\rho = 1$) the model collapses to polsci-4.3: the winner is whoever is nearer the median, so each candidate moves to it. Uncertainty and a policy motive change the trade-off. A candidate who wins implements her announced platform, so moving it toward the centre carries a certain policy loss, weighted by the probability of winning. It buys only a small gain in that probability, proportional to the density of the median's position at the midpoint of the two platforms, and that density is low and flat when $\sigma$ is large. The first-order conditions balance these two effects, so the equilibrium gap grows with $\sigma$ and with the policy weight $1-\rho$ and shrinks to zero when either vanishes.`,
      caption: String.raw`**Top left:** the unknown median voter (blue band) and the two candidates' ideal points (hollow circles; drag them). Filled dots are the equilibrium platforms of the model above, found by iterating best responses. Move the sliders for uncertainty $\sigma$ and the weight $\rho$ on winning: at $\sigma \to 0$ or $\rho = 1$ the platforms meet at the median. **Top right:** equilibrium polarization as a function of $\sigma$ for several $\rho$. **Bottom:** the real counterpart, the average position of each party's House members on the first DW-NOMINATE dimension from the 56th Congress (1899) to the 118th (2023): the gap between the parties varies a lot but is never close to zero.`,
      deps: ['polsci-4.3'],
      see: ['polsci-4.13'],
      refs: ['Shepsle: spatial model', 'Wittman (1983), APSR 77: 142–157', 'Palfrey (1984), Review of Economic Studies 51: 139–156', 'Poole & Rosenthal, voteview.com'],
      tags: ['party polarization', 'candidate motivation'],
      credit: 'Wittman, 1983; Palfrey, 1984',
      scope: String.raw`The equilibrium panel is my own computation of a standard stylized model (quadratic policy loss, normal uncertainty about the median), not a replication of one paper's figures. The DW-NOMINATE series measures how legislators vote, not the platforms on which they campaigned, and it is on a different scale from the model's $[0,10]$ line.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Median_voter_theorem' },
      viz(v) {
        // House party means of the first DW-NOMINATE dimension, 56th-118th Congress: [year, Democratic mean, Republican mean]. Source: Voteview (voteview.com), file HSall_parties.csv, nominate_dim1_mean.
        const HOUSE = [[1899, -0.364, 0.437], [1901, -0.369, 0.448], [1903, -0.364, 0.45], [1905, -0.38, 0.445], [1907, -0.36, 0.438], [1909, -0.353, 0.427], [1911, -0.325, 0.414], [1913, -0.308, 0.404], [1915, -0.314, 0.41], [1917, -0.308, 0.408], [1919, -0.311, 0.405], [1921, -0.31, 0.395], [1923, -0.289, 0.407], [1925, -0.281, 0.395], [1927, -0.286, 0.382], [1929, -0.284, 0.369], [1931, -0.256, 0.36], [1933, -0.251, 0.331], [1935, -0.256, 0.305], [1937, -0.256, 0.314], [1939, -0.249, 0.308], [1941, -0.258, 0.313], [1943, -0.249, 0.302], [1945, -0.265, 0.303], [1947, -0.237, 0.285], [1949, -0.276, 0.277], [1951, -0.262, 0.28], [1953, -0.253, 0.278], [1955, -0.279, 0.277], [1957, -0.283, 0.268], [1959, -0.296, 0.267], [1961, -0.277, 0.262], [1963, -0.292, 0.256], [1965, -0.301, 0.246], [1967, -0.296, 0.243], [1969, -0.31, 0.255], [1971, -0.311, 0.254], [1973, -0.323, 0.261], [1975, -0.315, 0.265], [1977, -0.306, 0.267], [1979, -0.301, 0.295], [1981, -0.3, 0.307], [1983, -0.302, 0.326], [1985, -0.309, 0.334], [1987, -0.309, 0.335], [1989, -0.313, 0.34], [1991, -0.314, 0.345], [1993, -0.334, 0.371], [1995, -0.361, 0.397], [1997, -0.376, 0.402], [1999, -0.373, 0.404], [2001, -0.377, 0.41], [2003, -0.376, 0.417], [2005, -0.387, 0.423], [2007, -0.368, 0.439], [2009, -0.349, 0.456], [2011, -0.393, 0.467], [2013, -0.384, 0.482], [2015, -0.394, 0.48], [2017, -0.388, 0.489], [2019, -0.372, 0.5], [2021, -0.379, 0.503], [2023, -0.384, 0.508]];
        const M0 = 5, SC = 4;
        const S = v.stage({ x: [0, 10], y: [0, 0.6], axes: 'box', gutter: true, height: 230, minWidth: 360, yticks: [], xlabel: 'left–right position', title: 'unknown median, ideal points and equilibrium platforms' });
        const E = v.stage({ x: [0, 4], y: [0, 10], axes: 'box', gutter: true, height: 230, minWidth: 300, xlabel: 'uncertainty σ about the median', ylabel: 'platform gap', title: 'equilibrium polarization' });
        const R = v.stage({ x: [1899, 2023], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'year (start of Congress)', ylabel: 'DW-NOMINATE dim. 1 (party mean)', title: 'US House: party means, 56th–118th Congress', xticks: [1900, 1920, 1940, 1960, 1980, 2000, 2020] });
        const sg = v.slider('uncertainty $\\sigma$', 0.1, 4, 1.5, { step: 0.05 });
        const rh = v.slider('weight on winning $\\rho$', 0, 1, 0.5, { step: 0.01 });
        const HA = S.handle(2, 0.03, { color: 'blue', r: 8, constrain: (x) => [clamp(x, 0.3, 4.6), 0.03], label: 'a', labelPos: 'n' });
        const HB = S.handle(8, 0.03, { color: 'orange', r: 8, constrain: (x) => [clamp(x, 5.4, 9.7), 0.03], label: 'b', labelPos: 'n' });
        /** Win probability of the candidate at xa against the one at xb, median ~ N(M0, sg). */
        const pA = (xa, xb, sig) => (xa === xb ? 0.5 : xa < xb ? Phi(((xa + xb) / 2 - M0) / sig) : 1 - Phi(((xa + xb) / 2 - M0) / sig));
        const uA = (xa, xb, a, b, rho, sig) => { const p = pA(xa, xb, sig); return rho * p - ((1 - rho) * (p * (xa - a) ** 2 + (1 - p) * (xb - a) ** 2)) / SC; };
        const uB = (xa, xb, a, b, rho, sig) => { const p = pA(xa, xb, sig); return rho * (1 - p) - ((1 - rho) * (p * (xa - b) ** 2 + (1 - p) * (xb - b) ** 2)) / SC; };
        /** Equilibrium by damped best-response iteration on a 0.1 grid. */
        function equilibrium(a, b, rho, sig, start) {
          let xa = start ? start[0] : a, xb = start ? start[1] : b;
          const G = range(101).map((i) => i / 10);
          for (let it = 0; it < 90; it++) {
            let ba = xa, bu = -1e9; for (const z of G) { const u = uA(z, xb, a, b, rho, sig); if (u > bu + 1e-12) { bu = u; ba = z; } }
            let bb = xb; bu = -1e9; for (const z of G) { const u = uB(xa, z, a, b, rho, sig); if (u > bu + 1e-12) { bu = u; bb = z; } }
            const na = xa + 0.6 * (ba - xa), nb = xb + 0.6 * (bb - xb);
            if (Math.abs(na - xa) + Math.abs(nb - xb) < 1e-4) { xa = na; xb = nb; break; }
            xa = na; xb = nb;
          }
          return [xa, xb];
        }
        const RHOS = [1, 0.8, 0.6, 0.4];
        let info = null;
        v.render(() => {
          const a = HA.x, b = HB.x, rho = rh.value, sig = sg.value;
          S.fn((x) => phi((x - M0) / sig) / sig, { color: 'accent', fill: true, fillAlpha: 0.18, width: 1.6, n: 200 });
          S.vline(M0, { color: 'green', dash: true });
          const [xa, xb] = equilibrium(a, b, rho, sig);
          S.arrow(a, 0.075, xa, 0.075, { color: 'blue', width: 1.6 }); S.arrow(b, 0.075, xb, 0.075, { color: 'orange', width: 1.6 });
          S.dot(xa, 0.075, { r: 7, color: 'blue', label: 'A', labelPos: 'n' }); S.dot(xb, 0.075, { r: 7, color: 'orange', label: 'B', labelPos: 'n' });
          S.text('ideal points', (a + b) / 2, 0.012, { size: 10.5, color: 'muted' });
          // equilibrium gap as a function of sigma, for several rho
          const sigs = range(26).map((i) => 0.1 + (i * 3.9) / 25);
          RHOS.forEach((r2, k) => {
            let st = null;
            const pts = sigs.map((s2) => { st = equilibrium(a, b, r2, s2, st || [(a + b) / 2, (a + b) / 2]); return [s2, st[1] - st[0]]; });
            E.path(pts, { color: ['ink', 'blue', 'purple', 'teal'][k], width: r2 === 1 ? 1.4 : 2, dash: r2 === 1 });
            E.text(`ρ = ${r2}`, 3.95, Math.min(9.7, pts[pts.length - 1][1] + 0.55), { size: 10, color: ['ink', 'blue', 'purple', 'teal'][k], align: 'right' });
          });
          E.hline(b - a, { color: 'faint', dash: true }); E.text('gap between ideal points', 0.1, b - a + 0.45, { size: 10, color: 'muted', align: 'left' });
          E.dot(sig, xb - xa, { r: 6, color: 'gold' });
          // real data
          R.hline(0, { color: 'muted' });
          R.path(HOUSE.map((d) => [d[0], d[1]]), { color: 'teal', width: 2.2 });
          R.path(HOUSE.map((d) => [d[0], d[2]]), { color: 'orange', width: 2.2 });
          R.text('Democratic Party', 1903, -0.43, { color: 'teal', size: 11, weight: 700, align: 'left' });
          R.text('Republican Party', 1903, 0.52, { color: 'orange', size: 11, weight: 700, align: 'left' });
          info = { xa, xb, a, b };
        });
        v.legend([['accent', 'unknown median voter $N(5,\\sigma^2)$', { area: true }], ['gold', 'current $\\sigma$', { dot: true }]]);
        v.readout(() => {
          const gaps = HOUSE.map((d) => d[2] - d[1]), imin = gaps.indexOf(Math.min(...gaps)), last = HOUSE[HOUSE.length - 1];
          const { xa, xb, a, b } = info;
          return `Model: ideal points ${v.fix(a, 1)} and ${v.fix(b, 1)}, equilibrium platforms **${v.fix(xa, 2)}** and **${v.fix(xb, 2)}** (gap ${v.fix(xb - xa, 2)}; the median is at 5). Data: the smallest gap between the party means was **${v.fix(gaps[imin], 3)}** in ${HOUSE[imin][0]}, the largest **${v.fix(last[2] - last[1], 3)}** in ${last[0]}; each party's mean stays between 0.24 and 0.51 away from zero.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.5
    {
      num:'4.5',kind:'Theorem',name:'Plott’s symmetry condition',
      statement:String.raw`Let an odd number n of voters have Euclidean preferences over the full plane: voter i strictly prefers policies closer to her ideal point pᵢ. Indifferent voters do not support a change. A policy q is unbeaten by a strict majority if and only if every open half-plane with boundary through q contains at most (n−1)/2 ideal points.

If exactly one voter's ideal is q, this is equivalent to pairing all the other ideals on opposite rays through q. Their distances from q need not agree. The one-voter qualification matters when ideal points coincide. Plott's original paper (1967, pp.788–791) studies local gradient conditions, explicitly qualifying the one-maximum case; the global Euclidean half-plane formulation and proof here are a specialization.`,
      idea:String.raw`The squared-norm expansion in vcalc-1.2 applies to the policy plane by setting the third coordinate to zero. It shows that a voter prefers y to q precisely when $(p_i-q)\cdot(y-q)>\|y-q\|^2/2$. Such voters belong to the open half-plane with positive dot product against y−q. Thus the half-plane bound suffices. Conversely, if a direction has a strict majority of positive dot products, a sufficiently small step in that direction beats q.

When q is not any ideal point, a generic line through it splits the odd electorate into unequal parts; one open side has a majority. Hence every equilibrium is an ideal point. If exactly one voter is at q, the remaining even electorate must split equally across every generic line. Rotating the boundary then forces equal numbers on opposite rays, which can be paired. Additional voters at q can prevent a majority without this pairing, so that case uses the general half-plane test.`,
      caption:String.raw`Drag ideals and the gold status quo q; inputs snap to an eighth-unit grid inside the stated square. Choose 3,5 or7 voters, or load a symmetric, broken-pair or coincident-majority preset. The left panel contains every ideal; the right panel zooms around q and a certified winning proposal when one exists. Orange is a sampled winset, whose visible pixels do not determine the equilibrium verdict. The exact finite direction test does.`,
      scope:String.raw`Odd electorate, Euclidean distance preferences, full continuous policy plane and no strategic voting. Input coordinates lie on a bounded1/8 grid, allowing all orientation/dot signs to be exact integers. The half-plane test enumerates every angular sector, including rays and coincidences, then tests every distinct ideal as a possible equilibrium. Its verdict is independent of raster resolution and a numerical yolk minimizer. The constructed winning proposal is evaluated by the actual strict distance inequalities. This is not a certification of arbitrary utility gradients, constrained policy spaces, the general Plott paper or a negotiation dynamic.`,
      deps:['polsci-4.2','vcalc-1.2'],see:['polsci-4.6','polsci-4.7'],refs:['Plott (1967), AER57:787–806, pp.788–791, unrestricted local conditions and one-maximum qualification; Euclidean specialization derived here'],tags:['spatial voting','majority-rule equilibrium'],credit:'Original local symmetry analysis: Charles R.Plott,1967; exact Euclidean half-plane comparison authored here.',links:{source:'https://authors.library.caltech.edu/records/rzmbm-kft47'},verify:false,
      viz(v){
        const S=v.stage({x:[-2.6,2.6],y:[-2.6,2.6],axes:false,equal:true,height:360,title:'all ideals and status quo q'}),Z=v.stage({x:[-.5,.5],y:[-.5,.5],axes:false,equal:true,height:360,title:'local winset and an actual winning proposal'});
        const snap=(x,y)=>[x,y].map(t=>Math.round(Math.max(-2,Math.min(2,t))*8)/8),n=v.select('voters',[3,5,7].map(value=>({value,label:String(value)})),5,{onChange:()=>reset('symmetric')}),H=PLOTT_BASE.map((p,i)=>S.handle(...p,{color:'accent',r:5,constrain:snap})),Q=S.handle(0,0,{color:'gold',r:7,constrain:snap});H.forEach((h,i)=>strictSpatialHandle(h,p=>spatialPoint(p,2),`ideal${i+1}`));strictSpatialHandle(Q,p=>spatialPoint(p,2),'status quo');
        function reset(mode){PLOTT_BASE.forEach((p,i)=>H[i].set(...p));Q.set(0,0);if(mode==='broken')H[2].set(-1.5,-.25);if(mode==='coincident')for(let i=0;i<=(n.value-1)/2;i++)H[i].set(0,0);}
        v.button('Symmetric preset',()=>reset('symmetric'));v.button('Break first pair',()=>reset('broken'));v.button('Coincident majority',()=>reset('coincident'));let info;
        v.render(()=>{H.forEach((h,i)=>h.visible=i<n.value);const p=plottModel(H.slice(0,n.value).map(h=>[h.x,h.y]),[Q.x,Q.y]),dy=p.test.witness?p.test.witness.map((x,i)=>x-p.q[i]):[.25,.25],zoom=Math.max(.1,1.5*Math.max(...dy.map(Math.abs))+.03),color=v.ramp(.45,'orange'),wins=(x,y)=>p.V.filter(a=>(a[0]-x)**2+(a[1]-y)**2<(a[0]-p.q[0])**2+(a[1]-p.q[1])**2).length>p.test.limit;
          S.setView([-p.R,p.R],[-p.R,p.R]);Z.setView([p.q[0]-zoom,p.q[0]+zoom],[p.q[1]-zoom,p.q[1]+zoom]);const key=JSON.stringify([p.V,p.q]);S.raster((x,y)=>wins(x,y)?color:null,{res:3,key:'global'+key});Z.raster((x,y)=>wins(x,y)?color:null,{res:2,key:'local'+key+'|'+zoom});for(const e of p.candidates)S.text(String(e.indices[0]+1)+(e.indices.length>1?'×'+e.indices.length:''),e.point[0]-.1,e.point[1]+.25,{align:'center',baseline:'bottom',size:11,color:'ink'});S.text('q',...p.q.map((x,i)=>i?x-.25:x),{align:'center',baseline:'top',size:12,color:'gold'});for(const e of p.equilibria)S.dot(...e.point,{color:'green',r:11,hollow:true,width:1.5});Z.dot(...p.q,{color:'gold',r:6});if(p.test.witness){Z.dot(...p.test.witness,{color:'red',r:5});Z.text('winning y',p.test.witness[0],p.test.witness[1]+.12*zoom,{color:'red',align:'center',baseline:'bottom',size:11});}info=p;});
        v.legend([['accent','voter ideals'],['gold','status quo q',{dot:true}],['green','exact equilibrium',{dot:true}],['orange','sampled winset'],['red','winning proposal',{dot:true}]]);
        v.readout(()=>{const p=info;return `At q=(${p.q.join(', ')}), maximum open-half-plane count ${p.test.maximum}; majority requires ${p.test.limit+1}. ${p.test.stable?'No point in the plane beats q.':`Constructed y=(${p.test.witness.map(x=>v.fix(x,9)).join(', ')}); actual strict supporters ${p.test.votes.map(i=>i+1).join(', ')} (${p.test.votes.length} votes).`}\nAll ${p.candidates.length} distinct ideal candidates tested: ${p.equilibria.length?`equilibrium at (${p.equilibria[0].point.join(', ')})`:'no equilibrium in the full plane'}. ${p.candidates.some(e=>e.indices.length>1)?'Coincident ideals present: the general half-plane condition is used.':'Ideals are distinct.'} Raster pixels are sampled and are not a proof of an empty winset.`;});
      },
    },

    // Source-audited bounded chain 4.6
    chaosTheorem,

    // Source-audited triangle and finite covering 4.7
    yolkConcept,

  ],
};
