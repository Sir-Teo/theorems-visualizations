// Political Science & Social Choice — Chapter 5 (part b): items 5.6-5.10
import {juryTheorem} from './source-audit-strategic-jury.js';
import {downsIgnorance} from './source-audit-downs-items.js';
import { sum, range, clamp, mean, pct, Phi, phi, lgam, binomPmf, binomTail, majProb, tieProb, logspace } from './ch05.shared.js';

/** Distribution of D = (votes for A) - (votes for B) from independent voters: voters = [[pA, pB], ...] plus a fixed shift. Returns { off, p }. */
function diffDist(voters, shift = 0) {
  const M = voters.length + Math.abs(shift) + 1, off = M;
  let p = new Float64Array(2 * M + 1); p[off + shift] = 1;
  for (const [a, b] of voters) {
    const r = new Float64Array(2 * M + 1), c = 1 - a - b;
    for (let i = 1; i < 2 * M; i++) { const x = p[i]; if (x === 0) continue; r[i + 1] += x * a; r[i - 1] += x * b; r[i] += x * c; }
    p = r;
  }
  return { off, at: (d) => { const i = off + d; return i >= 0 && i < p.length ? p[i] : 0; } };
}

/**
 * Swing-voter model. Two equally likely states, A and B. Informed voters (nI) vote for the right candidate with probability q;
 * partisans (a for A, b for B) always vote for their candidate; the other independents (nU uninformed) vote A, B or abstain.
 * Gain in expected utility of one uninformed independent from voting A (resp. B) instead of abstaining, when the other nU-1 use (al, be).
 */
function gains(nI, q, a, b, nU, al, be) {
  const out = {};
  const D = { A: null, B: null };
  for (const s of ['A', 'B']) {
    const vs = [];
    for (let i = 0; i < nI; i++) vs.push(s === 'A' ? [q, 1 - q] : [1 - q, q]);
    for (let j = 0; j < nU - 1; j++) vs.push([al, be]);
    D[s] = diffDist(vs, a - b);
  }
  const gA = 0.25 * ((D.A.at(0) + D.A.at(-1)) - (D.B.at(0) + D.B.at(-1)));
  const gB = 0.25 * (-(D.A.at(0) + D.A.at(1)) + (D.B.at(0) + D.B.at(1)));
  return { gA, gB };
}
/** Symmetric equilibrium of the uninformed voters' game by exponential-weights (replicator) dynamics from the centre. */
function swingEq(nI, q, a, b, nU) {
  let s = [1 / 3, 1 / 3, 1 / 3], res = 0;
  for (let it = 0; it < 500; it++) {
    const { gA, gB } = gains(nI, q, a, b, nU, s[0], s[1]);
    const w = [s[0] * Math.exp(40 * gA), s[1] * Math.exp(40 * gB), s[2]], Z = w[0] + w[1] + w[2];
    s = w.map((x) => x / Z);
    if (it === 499) res = Math.max(gA - Math.max(0, gB), 0);
  }
  return { al: s[0], be: s[1], ab: s[2] };
}

export default {
  collection: 'polsci',
  chapter: 5,
  items: [
    // Source-audited jury branches 5.6
    juryTheorem,

    // Source-audited finite comparison 5.7
    downsIgnorance,

    // ───────────────────────────────────────────────────────────── 5.8
    {
      num: '5.8',
      kind: 'Concept',
      name: 'The miracle of aggregation',
      statement: String.raw`Let a fraction $f$ of $N$ voters be informed, each right with probability $a>\tfrac12$, and let the others be uninformed, each right with probability $u$; all votes are independent. The average chance of being right is $\bar p = fa+(1-f)u$. By the law of large numbers the majority is right with probability tending to $1$ whenever $\bar p>\tfrac12$, that is, whenever
$$f\,(a-\tfrac12) \;>\; (1-f)\,(\tfrac12-u).$$
In particular, if the uninformed guess completely at random ($u=\tfrac12$), then **any** positive fraction of informed voters, however small, makes the large majority right: the random votes cancel and the informed minority decides. If the uninformed are systematically biased ($u<\tfrac12$) the inequality can fail and the majority is wrong in the limit.`,
      idea: String.raw`Write the number of correct votes as a sum of independent Bernoulli variables; its mean is $N\bar p$ and its standard deviation is of order $\sqrt N$, so only the sign of $\bar p-\tfrac12$ matters when $N$ is large (polsci-5.4). Uninformed voters with $u=\tfrac12$ add a symmetric random walk to the tally, which has size $\sqrt N$, while the informed add a drift of $f N (a-\tfrac12)$, which wins eventually. Random noise is harmless; *bias* is what defeats the argument, and bias is exactly what correlation produces (polsci-5.5). This is the sense in which a public that is largely uninformed can still reach a sensible collective judgment, an argument associated with the study of public opinion by Page and Shapiro (1992).`,
      caption: String.raw`The colour shows (by a normal approximation) the probability that the majority is right for $N$ voters as a function of the informed share $f$ (horizontal) and the uninformed voters’ accuracy $u$ (vertical). Above the red curve, $\bar p>\tfrac12$ and large majorities are right. Drag the dot to choose a point; the right panel gives the exact distribution of the number of correct votes with the majority threshold.`,
      deps: ['polsci-5.4'],
      see: ['polsci-5.5', 'polsci-5.7'],
      refs: ['Shepsle: group decisions', 'Page and Shapiro (1992), The Rational Public'],
      tags: ['aggregation', 'public opinion'],
      scope: String.raw`Votes are independent with two accuracy levels, and the heat map uses a normal approximation of the number of correct votes (the readout and bar chart on the right are exact). Whether real electorates behave this way is exactly the empirical question the literature debates; the argument gives conditions, not evidence. I did not trace the phrase to its first use; Page and Shapiro (1992) is the work usually cited for the argument.`,
      verify: true,
      links: {},
      viz(v) {
        const H = v.stage({ x: [0, 1], y: [0.3, 0.7], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: 'informed share $f$', ylabel: 'uninformed accuracy $u$', title: 'probability the majority is right' });
        const Bp = v.stage({ x: [0, 100], y: [0, 0.1], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'number of correct votes', ylabel: 'probability', title: 'the vote count' });
        const NS = v.slider('voters $N$', 11, 501, 201, { int: true, step: 2 });
        const aS = v.slider('informed accuracy $a$', 0.55, 0.95, 0.65, { step: 0.01 });
        const h = H.handle(0.1, 0.5, { color: 'gold', r: 9, constrain: { x: [0, 1], y: [0.3, 0.7] } });
        const approx = (N, a, f, u) => {
          const F = f * N, m = F * a + (N - F) * u, sd = Math.sqrt(Math.max(1e-12, F * a * (1 - a) + (N - F) * u * (1 - u)));
          return Phi((m - N / 2) / sd);
        };
        let info = {};
        v.render(() => {
          const N = NS.value % 2 ? NS.value : NS.value + 1, a = aS.value;
          H.heat((f, u) => approx(N, a, f, u), { range: [0, 1], cmap: 'theme', color: 'green', res: 5, key: `h${N}|${a}` });
          H.path(range(101).map((i) => { const f = i / 100; return [f, (0.5 - f * a) / (1 - f + 1e-9)]; }).filter((p) => p[1] >= 0.3 && p[1] <= 0.7), { color: 'red', width: 2.2 });
          H.hline(0.5, { color: 'ink', dash: true, alpha: 0.5 });
          const F = Math.round(h.x * N), f = F / N, u = h.y;
          // exact distribution: Bin(F, a) convolved with Bin(N - F, u)
          const d1 = range(F + 1).map((k) => binomPmf(F, k, a)), d2 = range(N - F + 1).map((k) => binomPmf(N - F, k, u));
          const tot = new Float64Array(N + 1);
          for (let i = 0; i <= F; i++) for (let j = 0; j <= N - F; j++) tot[i + j] += d1[i] * d2[j];
          const exact = sum(range(N + 1).filter((k) => k > N / 2).map((k) => tot[k]));
          const lo = Math.max(0, Math.floor(N * 0.2)), hi = Math.min(N, Math.ceil(N * 0.8)), vals = range(hi - lo + 1).map((i) => tot[lo + i]);
          Bp.setView([lo - 1, hi + 1], [0, Math.max(...vals) * 1.2]);
          Bp.bars(vals, { x0: lo, dx: 1, color: (val, i) => (lo + i > N / 2 ? 'green' : 'accent') });
          Bp.vline(N / 2, { color: 'ink', dash: true, alpha: 0.6 });
          info = { N, a, f, u, exact, pbar: f * a + (1 - f) * u, F };
        });
        v.legend([['red', '$\\bar p=\\tfrac12$ (limit boundary)'], ['gold', 'chosen $(f,u)$', { dot: true }]]);
        v.readout(() => `$N=${info.N}$ voters, ${info.F} informed ($f=${v.fix(info.f, 3)}$, $a=${v.fix(info.a, 2)}$), uninformed accuracy $u=${v.fix(info.u, 3)}$: average accuracy $\\bar p=${v.fix(info.pbar, 4)}$ ${info.pbar > 0.5 ? '(above ½)' : '(at most ½)'}. The majority is right with probability **${v.fix(info.exact, 4)}** (exact).`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.9
    {
      num: '5.9',
      kind: 'Theorem',
      name: 'The swing voter’s curse',
      statement: String.raw`Two states of the world, $A$ and $B$, are equally likely; the better candidate is the one named after the state. Some voters are *informed*: each votes for the correct candidate with probability $q>\tfrac12$. Some are *partisans* who always vote for their own candidate, with equally many partisans $a=b$ on each side. The rest are *independents* who share the common goal of electing the correct candidate but have no information. An independent can vote $A$, vote $B$ or abstain; she is decisive when the others tie or when her side is one vote behind.

**Claim.** If the number $n_I$ of informed voters is odd and all the other independents abstain, then voting for either candidate gives an independent a strictly *lower* expected payoff than abstaining:
$$\Delta U_A = \Delta U_B = \tfrac14\bigl[\Pr{}_A(D=-1)-\Pr{}_A(D=1)\bigr]<0,$$
where $D$ is the margin of votes for $A$ over $B$ among the others in state $A$. Abstention by the uninformed is therefore part of an equilibrium even though voting is free.`,
      idea: String.raw`An independent's vote matters only when the others are tied (or one behind), and *those are exactly the events in which the informed voters are split*, which is bad news about the state: given a tie, the informed voters' information has cancelled, but given a one-vote lead for the true side it is the true side that would be more likely to win anyway. When the margin is $D=-1$, the votes are more likely to have come from a world where the state is $B$, so adding a vote for $A$ pushes the result in the wrong direction more often than the right one. The net effect is the difference $\Pr_A(D=-1)-\Pr_A(D=1)$, which is negative because the true state is more likely to lead. Hence the uninformed do best to leave the decision to those who know. With unbalanced partisans the same pivotal-event logic makes some independents vote for the side that is behind, to offset the partisans (as the right panel shows).`,
      caption: String.raw`Left: for the profile you pick ($\alpha$ and $\beta$ are the shares of the *other* independents who vote $A$ and $B$; the rest abstain), the expected payoff gain of one independent from voting $A$ or $B$ instead of abstaining. When partisans are balanced and the others abstain, both bars are below zero. Right: the symmetric equilibrium shares of independents who abstain, vote $A$ and vote $B$, as the number of informed voters changes. Add partisans on one side and watch independents vote for the other.`,
      deps: ['polsci-5.6'],
      see: ['polsci-5.7', 'polsci-3.7'],
      refs: ['Shepsle: voting and turnout', 'Feddersen and Pesendorfer (1996), American Economic Review 86: 408–424'],
      tags: ['abstention', 'strategic voting', 'information'],
      credit: 'Timothy Feddersen and Wolfgang Pesendorfer, 1996',
      scope: String.raw`This is a reconstruction of the idea of the 1996 paper in a finite, simplified setting of my own: informed voters have noisy signals of accuracy $q$ (the paper's informed voters know the state), the equilibrium on the right is found by running an exponential-weights dynamic from the centre and need not be the only symmetric equilibrium, and ties are broken by a fair coin. A published comment on the paper's proofs exists (Fey and Kim, 2000), which I could not confirm in detail.`,
      verify: true,
      links: {},
      viz(v) {
        const L = v.stage({ x: [0, 3], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 320, minWidth: 300, ylabel: 'gain over abstaining', title: 'gain from voting', xticks: [[0.5, 'vote A'], [1.5, 'vote B'], [2.5, 'abstain']] });
        const R = v.stage({ x: [1, 12], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'informed voters $n_I$', ylabel: 'share of independents', title: 'equilibrium behaviour of independents' });
        const nI = v.slider('informed voters $n_I$', 1, 12, 3, { int: true });
        const qS = v.slider('informed accuracy $q$', 0.55, 1, 0.8, { step: 0.01 });
        const aS = v.slider('partisans for $A$', 0, 6, 0, { int: true });
        const bS = v.slider('partisans for $B$', 0, 6, 0, { int: true });
        const nU = v.slider('independents $n_U$', 2, 10, 4, { int: true });
        const alS = v.slider('others vote $A$ ($\\alpha$)', 0, 1, 0, { step: 0.05 });
        const beS = v.slider('others vote $B$ ($\\beta$)', 0, 1, 0, { step: 0.05 });
        const cache = new Map();
        const eqCurve = () => {
          const key = [qS.value, aS.value, bS.value, nU.value].join('|');
          if (!cache.has(key)) { if (cache.size > 20) cache.clear(); cache.set(key, range(12).map((i) => [i + 1, swingEq(i + 1, qS.value, aS.value, bS.value, nU.value)])); }
          return cache.get(key);
        };
        let info = {};
        v.render(() => {
          const al = Math.min(alS.value, 1 - beS.value), be = beS.value;
          const g = gains(nI.value, qS.value, aS.value, bS.value, nU.value, al, be);
          const m = Math.max(0.02, Math.abs(g.gA), Math.abs(g.gB)) * 1.4;
          L.setView([0, 3], [-m, m]);
          L.hline(0, { color: 'ink', alpha: 0.6 });
          L.rect(0.2, 0, 0.8, g.gA, { fill: 'blue', fillAlpha: 0.6, color: 'blue' });
          L.rect(1.2, 0, 1.8, g.gB, { fill: 'orange', fillAlpha: 0.6, color: 'orange' });
          L.rect(2.2, 0, 2.8, 0, { fill: 'muted', color: 'muted' });
          const E = eqCurve();
          R.path(E.map(([n, e]) => [n, e.ab]), { color: 'muted', width: 2.4 });
          R.path(E.map(([n, e]) => [n, e.al]), { color: 'blue', width: 2.2 });
          R.path(E.map(([n, e]) => [n, e.be]), { color: 'orange', width: 2.2 });
          R.vline(nI.value, { color: 'gold', dash: true, width: 1.6 });
          info = { g, e: E[nI.value - 1][1] };
        });
        v.legend([['muted', 'abstain'], ['blue', 'vote $A$'], ['orange', 'vote $B$']]);
        v.readout(() => `Others: $\\alpha=${v.fix(Math.min(alS.value, 1 - beS.value), 2)}$ vote $A$, $\\beta=${v.fix(beS.value, 2)}$ vote $B$. Gain from voting $A$: **${v.fix(info.g.gA, 4)}**, from voting $B$: **${v.fix(info.g.gB, 4)}** (abstaining is 0). Equilibrium at this $n_I$: abstain ${pct(info.e.ab, 0)}, vote $A$ ${pct(info.e.al, 0)}, vote $B$ ${pct(info.e.be, 0)}${nI.value % 2 === 0 && aS.value === bS.value ? '. With an even number of informed voters and balanced partisans the margin never equals $\\pm1$, so the gains are zero.' : ''}`);
      },
    },

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
