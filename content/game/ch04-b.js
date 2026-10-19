// Game Theory & Social Choice — Chapter 4 (part b): centipede, ultimatum, chain store, imperfect information, Kuhn's theorem
import {
  idx, leaf, dec, isLeaf, prep, playBeh, infoSets, pureStrategies, stratName, drawTree, treeView, nmz, kuhnBehaviour, mixedOutcome,
} from './ch04.shared.js';

// ---------------------------------------------------------------- centipede helpers
const cBig = (m) => 4 * 2 ** (m - 1), cSmall = (m) => 2 ** (m - 1);   // take at node m: mover gets big, the other small
/** Level-j take sets (arrays of booleans indexed 1..n) for the player who moves at the odd (who = 0) or even (who = 1) nodes. */
function levelStrategy(n, who, lvl, memo = {}) {
  const k = `${who}/${lvl}`; if (memo[k]) return memo[k];
  let res;
  if (lvl <= 0) res = new Array(n + 2).fill(false);
  else {
    const opp = levelStrategy(n, 1 - who, lvl - 1, memo), mine = new Array(n + 2).fill(false);
    const mover = (m) => (m % 2 === 1 ? 0 : 1);
    const payoff = (m) => (mover(m) === who ? cBig(m) : cSmall(m));          // my payoff if the game stops at m (m = n+1: end)
    const V = new Array(n + 3).fill(0); V[n + 1] = payoff(n + 1);
    for (let m = n; m >= 1; m--) {
      if (mover(m) !== who) { V[m] = opp[m] ? payoff(m) : V[m + 1]; continue; }
      const pass = V[m + 1];
      mine[m] = payoff(m) > pass + 1e-9; V[m] = mine[m] ? payoff(m) : pass;
    }
    res = mine;
  }
  return (memo[k] = res);
}
function centipedePlay(n, a, b) {
  const memo = {}, S = [levelStrategy(n, 0, a, memo), levelStrategy(n, 1, b, memo)];
  for (let m = 1; m <= n; m++) if (S[(m % 2 === 1) ? 0 : 1][m]) return m;
  return n + 1;
}
const centiPay = (m) => (m % 2 === 1 ? [cBig(m), cSmall(m)] : [cSmall(m), cBig(m)]);

export const continuousThresholdAcceptance = (x, mu, sigma, erf) => 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));

// ---------------------------------------------------------------- chain store (reputation) helpers
const EQ = 1e-9;
/** Entrant enters with probability e; the weak monopolist fights an entrant with probability s. k = towns left, p = belief "tough". */
export function chainStrat(k, p) {
  const thr = 2 ** -k;
  if (p > thr * (1 + EQ)) { if (k === 1) return { e: 0, s: 0 }; const q = Math.min(1, p * 2 ** (k - 1)); return { e: 0, s: (q - p) / (1 - p) }; }
  if (p < thr * (1 - EQ)) { const q = Math.min(1, p * 2 ** (k - 1)); return { e: 1, s: (q - p) / (1 - p) }; }
  return { e: 1 / 3, s: (0.5 - p) / (1 - p) };
}
export function chainValue(k, p) {
  if (k === 0) return 0;
  const { e, s } = chainStrat(k, p), q = p + (1 - p) * s;
  const out = 5 + chainValue(k - 1, p), acc = 2 + 2 * (k - 1), fight = q > 0 ? chainValue(k - 1, p / q) : 0;
  return (1 - e) * out + e * (s * fight + (1 - s) * acc);
}
/** For a weak monopolist: probability that town t (1..K) is entered, in equilibrium, plus expected payoff. */
export function chainEntry(K, p0) {
  const ent = new Array(K + 1).fill(0), fightP = new Array(K + 1).fill(0);
  const go = (k, p, mass) => {
    if (k === 0 || mass < 1e-15) return;
    const t = K - k + 1, { e, s } = chainStrat(k, p), q = p + (1 - p) * s;
    ent[t] += mass * e; fightP[t] += mass * e * s;
    for (let r = 1; r < k; r++) ent[t + r] += mass * e * (1 - s);           // accommodated once: revealed weak, later entrants all enter
    if (e < 1) go(k - 1, p, mass * (1 - e));
    if (e > 0 && s > 0 && q > 0) go(k - 1, p / q, mass * e * s);
  };
  go(K, p0, 1);
  return { ent, fightP, value: chainValue(K, p0) };
}

export default {
  collection: 'game',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Paradox',
      name: 'Centipede game',
      statement: String.raw`Two players move in turn, starting with player 1. At each of $n$ nodes the mover can **take**, ending the game with the larger pile for herself and the smaller for her partner, or **pass**, which doubles both piles and hands the move over. If every node is passed the game ends with the piles after the last doubling. At every node, taking gives the mover more than she would get if the partner took at the next node, so backward induction (game-4.2) says: the first player takes at once, and the pair ends with a tiny payoff, although they would both be far better off if the game went to the end.`,
      idea: String.raw`At the last node taking beats passing; knowing this, the player before her also takes, since passing would only give her the smaller pile; and so on to the root. Every step is a correct application of the rule, yet the result is that two people who could split a large pot settle for crumbs. The conclusion rests on common knowledge that everyone reasons all the way down; if a player thinks the other might pass, passing becomes attractive. In laboratory versions people commonly pass for several rounds, which is why the game is called a paradox.`,
      caption: String.raw`A centipede with $n$ nodes (blue = player 1, orange = player 2; the pair below a node is what the game gives if the mover takes there). The right grid assumes **level-$k$ reasoners**: level 0 always passes, level $k$ best-responds to a level $k-1$ opponent. Each cell shows where the game stops when player 1 has the row level and player 2 the column level. Drag the sliders or click the grid; when both reasoning levels are sufficiently high the game ends at node 1, while other level pairs can let it run on. This is a model of reasoning, not experimental data.`,
      credit: 'Rosenthal, 1981 (laboratory version: McKelvey & Palfrey, 1992)',
      scope: String.raw`Payoffs here: taking at node $m$ gives the mover $4\cdot 2^{m-1}$ and the other player $2^{m-1}$ (arbitrary units), in the pattern of the McKelvey–Palfrey design.`,
      deps: ['game-4.2'],
      refs: ['MSZ §7.2'],
      tags: ['paradox', 'backward induction', 'common knowledge'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Centipede_game' },
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.35, title: 'the centipede' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, equal: true, title: 'where play stops, by reasoning level' });
        const sn = v.slider('number of nodes $n$', 2, 10, 6, { int: true });
        const la = v.slider('player 1 reasoning level', 0, 10, 2, { int: true });
        const lb = v.slider('player 2 reasoning level', 0, 10, 2, { int: true });
        const grid = (n) => ({ x0: 0.14, y0: 0.88, cs: 0.84 / (n + 1) });
        B.onClick((x, y) => {
          const n = sn.value, g = grid(n), j = Math.floor((x - g.x0) / g.cs), i = Math.floor((g.y0 - y) / g.cs);
          if (i >= 0 && i <= n && j >= 0 && j <= n) { la.set(i); lb.set(j); }
        });
        let info;
        v.render(() => {
          const n = sn.value, a = Math.min(la.value, n), b = Math.min(lb.value, n), stop = centipedePlay(n, a, b);
          const pay = centiPay(stop), bi = centiPay(1), full = centiPay(n + 1);
          const maxc = cBig(n + 1);
          A.setView([0.2, n + 1.8], [-3.1, 1.6]);
          for (let m = 1; m <= n + 1; m++) {
            const x = m, pl = m % 2 === 1 ? 'blue' : 'orange', on = m <= stop;
            if (m <= n) A.arrow(x, 0, x + 1 - 0.12, 0, { color: on && m < stop ? 'gold' : 'muted', width: on && m < stop ? 4 : 1.8, head: 8 });
            if (m <= n) A.dot(x, 0, { r: 11, color: pl });
            const [u1, u2] = centiPay(m);
            if (m <= n) A.line(x, 0, x, -0.55, { color: m === stop ? 'gold' : 'muted', width: m === stop ? 4 : 1.4 });
            else A.line(x, 0, x, -0.55, { color: m === stop ? 'gold' : 'muted', width: m === stop ? 4 : 1.4 });
            A.rect(x - 0.34, -0.6 - 2.3 * u1 / maxc * 0.9, x - 0.02, -0.6, { fill: 'blue', fillAlpha: m === stop ? 0.55 : 0.25, color: 'blue', width: 1 });
            A.rect(x + 0.02, -0.6 - 2.3 * u2 / maxc * 0.9, x + 0.34, -0.6, { fill: 'orange', fillAlpha: m === stop ? 0.55 : 0.25, color: 'orange', width: 1 });
            if (m === stop) A.text(`${u1}, ${u2}`, x, -0.6 - 2.3 * Math.max(u1, u2) / maxc * 0.9 - 0.08, { align: 'center', baseline: 'top', size: 11.5, weight: 700, color: 'ink', plate: true });
            A.text(m <= n ? `take ${m}` : 'all pass', x, -0.28, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
          }
          // grid
          const g = grid(n);
          B.setView([0, 1], [0, 1]);
          for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
            const st = centipedePlay(n, i, j), t = (st - 1) / n;
            const x0 = g.x0 + j * g.cs, y0 = g.y0 - (i + 1) * g.cs, sel = i === a && j === b;
            B.rect(x0, y0, x0 + g.cs, y0 + g.cs, { fill: st === 1 ? 'red' : st === n + 1 ? 'green' : 'gold', fillAlpha: st === 1 ? 0.3 : st === n + 1 ? 0.3 : 0.12 + 0.35 * t, color: sel ? 'ink' : 'faint', width: sel ? 3 : 0.6 });
            if (n <= 8) B.text(String(st), x0 + g.cs / 2, y0 + g.cs / 2, { align: 'center', baseline: 'middle', size: 11, weight: sel ? 800 : 500, color: 'ink' });
          }
          B.text('P2 level →', g.x0 + (n + 1) * g.cs / 2, g.y0 + 0.015, { align: 'center', baseline: 'bottom', size: 11.5, color: 'orange', weight: 700 });
          B.text('P1 level ↓', g.x0 - 0.01, g.y0 + 0.015, { align: 'right', baseline: 'bottom', size: 11.5, color: 'blue', weight: 700 });
          info = { n, stop, pay, bi, full, a, b };
        });
        v.readout(() => {
          const { n, stop, pay, bi, full, a, b } = info;
          return `player 1 at level ${a} against player 2 at level ${b}: the game stops at node ${stop === n + 1 ? 'n + 1 (everyone passed)' : stop}, payoffs $(${pay[0]},\\,${pay[1]})$\nbackward induction: take at node 1, payoffs $(${bi[0]},\\,${bi[1]})$; passing to the end would give $(${full[0]},\\,${full[1]})$, ${Math.round(full[0] / bi[0])} times better for player 1 and ${Math.round(full[1] / bi[1])} times for player 2`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Ultimatum game',
      statement: String.raw`A proposer divides a pie of size $10$ and offers the responder an integer share $x\in\{0,\dots,10\}$; the responder accepts (payoffs $10-x$ and $x$) or rejects (both get $0$). If the responder simply maximises her own money and accepts any $x\ge 0$, backward induction (game-4.2) gives the subgame perfect equilibrium $x=0$ (with the tie broken in favour of accepting; offering the smallest positive amount is the other pure equilibrium if she rejects $0$): the proposer takes everything. More generally if the responder accepts exactly the offers at least $m$, the best offer is $m$, and if responders differ the proposer picks the offer maximising $(10-x)\,F(x)$, where $F(x)$ is the fraction who would accept $x$.`,
      idea: String.raw`The responder’s decision is the last move, so it is solved first: accept if and only if her payoff from accepting beats $0$, with her own notion of payoff. The proposer then faces a fixed acceptance rule and just maximises. Everything depends on the responder’s utility. If it is pure money, almost nothing is offered; if she dislikes getting less than the proposer (inequity aversion, as in Fehr and Schmidt’s model), the threshold rises toward an even split, and a proposer who is only selfish is then forced to offer a lot. The theory predicts nothing without a model of preferences.`,
      caption: String.raw`Left: the proposer’s expected payoff for each offer. Right: the probability that an offer is accepted. Choose how responders decide: money-maximising, a fixed threshold, a population with scattered thresholds (normal with mean $\mu$ and spread $\sigma$), or inequity-averse responders with envy weight $\alpha$ and advantageous-inequality weight $\beta=0$ (accept $x$ iff $x-\alpha\max(10-2x,0)\ge 0$). The gold bar is the best offer. The thresholds are model inputs, not data.`,
      credit: 'Güth, Schmittberger & Schwarze, 1982 (experiment); Fehr & Schmidt, 1999 (inequity aversion)',
      deps: ['game-4.4'],
      refs: ['Osborne §6.1'],
      tags: ['bargaining', 'fairness', 'subgame perfection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ultimatum_game' },
      viz(v) {
        const L = v.stage({ x: [-0.6, 10.6], y: [0, 10.5], axes: 'box', gutter: true, height: 320, xlabel: 'offer $x$ to the responder', ylabel: 'proposer’s expected payoff', xticks: idx(11), title: 'what each offer is worth to the proposer' });
        const R = v.stage({ x: [-0.6, 10.6], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 0.8, xlabel: 'offer $x$', ylabel: 'probability of acceptance', xticks: idx(11), title: 'acceptance rule' });
        const mode = v.select('responders', [{ value: 'spe', label: 'money-maximising' }, { value: 'thr', label: 'fixed threshold' }, { value: 'pop', label: 'scattered thresholds' }, { value: 'fs', label: 'inequity-averse' }], 'spe', { onChange: () => vis() });
        const mu = v.slider('threshold $\\mu$', 0, 6, 3, { step: 0.5 });
        const sg = v.slider('spread $\\sigma$', 0.25, 3, 1.5, { step: 0.25 });
        const al = v.slider('envy weight $\\alpha$', 0, 4, 1, { step: 0.25 });
        const vis = () => { mu.el.hidden = mode.value !== 'thr' && mode.value !== 'pop'; sg.el.hidden = mode.value !== 'pop'; al.el.hidden = mode.value !== 'fs'; };
        vis();
        const acc = (x) => {
          switch (mode.value) {
            case 'spe': return 1;
            case 'thr': return x >= mu.value - 1e-9 ? 1 : 0;
            case 'pop': return continuousThresholdAcceptance(x, mu.value, sg.value, v.M.erf);   // continuous threshold ~ N(mu, sigma), accepts x if threshold <= x
            default: return x - al.value * Math.max(10 - 2 * x, 0) >= -1e-9 ? 1 : 0;
          }
        };
        let info;
        v.render(() => {
          const F = idx(11).map(acc), E = F.map((f, x) => (10 - x) * f), best = Math.max(...E), bx = E.indexOf(best);
          idx(11).forEach((x) => {
            L.rect(x - 0.36, 0, x + 0.36, E[x], { fill: x === bx ? 'gold' : 'blue', fillAlpha: x === bx ? 0.55 : 0.28, color: x === bx ? 'gold' : 'blue', width: 1.5 });
            R.rect(x - 0.36, 0, x + 0.36, F[x], { fill: 'green', fillAlpha: 0.28, color: 'green', width: 1.5 });
          });
          L.line(-0.6, 10, 10.6, 10, { color: 'faint', dash: true });
          L.text('whole pie', 10.5, 10.05, { align: 'right', baseline: 'bottom', size: 11, color: 'muted' });
          info = { E, best, bx, F };
        });
        v.readout(() => {
          const { E, best, bx } = info;
          const bests = idx(11).filter((x) => Math.abs(E[x] - best) < 1e-9);
          return `best offer: $x=${bests.join(' \\text{ or } ')}$; the proposer expects ${v.fix(best, 2)} and the responder ${v.fix(bests[0] * info.F[bests[0]], 2)}\nwith the displayed accept-at-zero tie rule, money-maximising responders get $0$ and the proposer keeps $10$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Paradox',
      name: 'Chain-store paradox',
      statement: String.raw`A monopolist owns stores in $K$ towns, and in each town in turn a different potential entrant chooses *Out* (entrant 1, monopolist 5) or *In*; if she enters the monopolist either **accommodates** (2, 2) or **fights** (0, 0). The payoffs here are an illustration in the style of Selten’s example. Fighting is bad for the monopolist after entry, so backward induction (game-4.2) gives: in the last town she accommodates; hence the entrant there enters; hence the second-last fight cannot deter anything, and so on. The unique subgame perfect equilibrium has every entrant enter and every entry accommodated, although the monopolist would like to be known as a fighter.`,
      idea: String.raw`The argument starts from the last town, where reputation is worth nothing, and the unravelling cannot be stopped by any earlier fight. Selten found the conclusion unconvincing as a description of behaviour. Kreps–Wilson and Milgrom–Roberts resolved it with a little incomplete information: with prior probability $p_0$ the monopolist is a “tough” type who always fights. Then a weak monopolist fights early to be taken for the tough type. In the equilibrium computed here entrants stay out until about $\log_2(1/p_0)$ towns remain, and the entry that does occur is mixed.`,
      caption: String.raw`Bars: the probability that each town is entered in equilibrium (for the weak monopolist), compared with the backward-induction prediction (entry in every town, grey line). Raise the number of towns $K$ or the prior $p_0$ of the tough type: the entry-free stretch grows. The right plot shows the weak monopolist’s average payoff per town as $K$ grows: it climbs far above the backward-induction value $2$. Equilibrium computed by the recursion in the idea above (own derivation for these payoffs, checked by one-shot-deviation tests).`,
      credit: 'Selten, 1978; Kreps & Wilson, 1982; Milgrom & Roberts, 1982',
      scope: String.raw`Simplified payoffs; the tough type fights every entrant; entrants live one period and maximise their own payoff; equilibrium is sequential (beliefs by Bayes’ rule).`,
      deps: ['game-4.2'],
      refs: ['Osborne §7.2'],
      tags: ['paradox', 'reputation', 'entry deterrence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chain_store_paradox' },
      verify: true,
      viz(v) {
        const L = v.stage({ x: [0.3, 20.7], y: [0, 1.15], axes: 'box', gutter: true, height: 320, xlabel: 'town (in order of play)', ylabel: 'probability of entry', title: 'who enters in equilibrium' });
        const R = v.stage({ x: [1, 20], y: [1.5, 5.3], axes: 'box', gutter: true, height: 320, weight: 0.7, xlabel: 'number of towns $K$', ylabel: 'monopolist’s payoff per town', title: 'value of a reputation' });
        const sK = v.slider('number of towns $K$', 1, 20, 12, { int: true });
        const sp = v.slider('prior probability of the tough type $p_0$', 0.002, 0.5, 0.05, { log: true, sig: 2 });
        let info;
        v.render(() => {
          const K = sK.value, p0 = sp.value, r = chainEntry(K, p0);
          L.setView([0.3, Math.max(K, 3) + 0.7], [0, 1.15]);
          L.line(0.3, 1, K + 0.7, 1, { color: 'faint', dash: true });
          for (let t = 1; t <= K; t++) {
            L.rect(t - 0.34, 0, t + 0.34, Math.min(1, r.ent[t]), { fill: 'gold', fillAlpha: 0.4, color: 'gold', width: 1.5 });
            L.dot(t, 1, { r: 3.5, color: 'muted' });
          }
          L.text('backward induction: every town enters', Math.max(K, 3) + 0.6, 1.07, { align: 'right', size: 11.5, color: 'muted', weight: 600 });
          R.setView([1, 20], [1.5, 5.3]);
          R.hline(2, { color: 'muted', dash: true }); R.text('backward induction', 19.8, 1.88, { align: 'right', size: 11.5, color: 'muted', weight: 600, plate: true });
          R.hline(5, { color: 'muted', dash: true }); R.text('no entry at all', 19.8, 5.05, { align: 'right', size: 11.5, color: 'muted', weight: 600, plate: true });
          const pts = idx(20).map((i) => [i + 1, chainValue(i + 1, p0) / (i + 1)]);
          R.path(pts, { color: 'green', width: 2.5 }); R.dot(K, chainValue(K, p0) / K, { r: 6, color: 'gold' });
          info = { K, p0, r };
        });
        v.readout(() => {
          const { K, p0, r } = info, ent = r.ent.slice(1).reduce((a, b) => a + Math.min(1, b), 0);
          const first = r.ent.findIndex((x, i) => i > 0 && x > 1e-9);
          return `expected number of entered towns: ${v.fix(ent, 2)} of ${K}${first > 0 ? `, entry first possible at town ${first} (the last ${K - first + 1} towns)` : ', none'}; expected payoff for the weak monopolist ${v.fix(r.value, 2)} against $2K=${2 * K}$ without reputation\nrule of thumb: with $p_0=${v.fix(p0, 3)}$ entry is deterred while more than $\\log_2(1/p_0)\\approx${v.fix(Math.log2(1 / p0), 1)}$ towns remain`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Imperfect information: information sets and behaviour strategies',
      statement: String.raw`In an extensive game with **imperfect information** the decision nodes of a player are partitioned into **information sets**: the player knows only which set she is in, so the same actions must be available at all of its nodes and her choice cannot depend on which node it is. Chance moves are nodes of a nature player with given probabilities. A **pure strategy** chooses one action in every information set, a **mixed strategy** is a probability distribution over pure strategies, and a **behaviour strategy** chooses, independently in each information set, a probability distribution over its actions. A profile of behaviour strategies fixes the probability of every leaf (product of the probabilities along its path) and hence expected payoffs. The game has **perfect recall** if no player forgets what she knew or did earlier.`,
      idea: String.raw`Information sets are the tree’s way of saying “I cannot tell these histories apart”. They destroy backward induction in the form of game-4.2, since a mover at a set cannot condition on the node. A behaviour strategy needs one probability per action per information set, far fewer numbers than a mixed strategy over exponentially many pure strategies; Kuhn’s theorem (game-4.10) says that under perfect recall nothing is lost by using them. Every simultaneous game is an imperfect-information game: the second mover’s two nodes form one information set.`,
      caption: String.raw`Pick a game and set the behaviour strategies with the sliders (each is the probability of the first listed action at the information set of that letter). Dashed bars join nodes of one information set. Edge labels show the probabilities you chose, grey numbers under the leaves the probability of reaching them. In the poker game, the button “equilibrium” sets the strategies that make both players indifferent; try deviating from them and watch the value move.`,
      credit: 'Kuhn, 1950–53',
      deps: ['game-4.1', 'game-2.1', 'prob-2.1.1a'],
      refs: ['MSZ §6.1', 'Osborne §10.1'],
      tags: ['information set', 'behaviour strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information_set_(game_theory)' },
      viz(v) {
        const MK = {
          mp: () => dec(1, [['Heads', dec(2, [['Heads', leaf(1, -1)], ['Tails', leaf(-1, 1)]], 'B')], ['Tails', dec(2, [['Heads', leaf(-1, 1)], ['Tails', leaf(1, -1)]], 'B')]], 'A'),
          poker: () => dec(0, [['High', dec(1, [['Bet', dec(2, [['Call', leaf(2, -2)], ['Fold', leaf(1, -1)]], 'C')], ['Check', leaf(1, -1)]], 'A'), 0.5], ['Low', dec(1, [['Bet', dec(2, [['Call', leaf(-2, 2)], ['Fold', leaf(1, -1)]], 'C')], ['Check', leaf(-1, 1)]], 'B'), 0.5]]),
        };
        let key = 'mp', P = prep(MK.mp());
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'game tree with information sets' });
        const sl = ['A', 'B', 'C'].map((k, i) => v.slider(`information set ${k}: probability of the first action`, 0, 1, 0.5, { step: 0.05 }));
        const setup = () => { P = prep(MK[key]()); sl.forEach((s, i) => { s.el.hidden = !infoSets(P, 1).concat(infoSets(P, 2)).some((I) => I.key === 'ABC'[i]); }); };
        v.select('game', [{ value: 'mp', label: 'Matching Pennies as a tree' }, { value: 'poker', label: 'one-card poker' }], key, { onChange: (k) => { key = k; setup(); } });
        v.button('equilibrium', () => { if (key === 'mp') sl.forEach((s) => s.set(0.5)); else { sl[0].set(1); sl[1].set(1 / 3); sl[2].set(2 / 3); } });
        setup();
        let info;
        v.render(() => {
          const beh = {};
          [...infoSets(P, 1), ...infoSets(P, 2)].forEach((I) => { const p = sl['ABC'.indexOf(I.key)].value; beh[I.key] = [p, 1 - p]; });
          const r = playBeh(P, beh), vw = treeView(P); T.setView(vw.x, vw.y);
          drawTree(T, P, {
            edgeLabel: (e) => (e.from.p === 0 ? `${e.a} ${e.pr}` : `${e.a} ${v.fix(beh[e.from.key][e.i], 2)}`),
            leafNote: (n) => `prob ${v.fix(r.leafP.get(n) || 0, 3)}`,
            edgeWidth: (e) => (e.from.p === 0 ? 2 : 1.4 + 4 * (beh[e.from.key][e.i] || 0)),
            nodeTag: (n) => (n.p === 0 ? 'nature' : `${n.p} · ${n.key}`),
          });
          info = { r, beh };
        });
        v.readout(() => {
          const { r } = info, S1 = pureStrategies(P, 1).length, S2 = pureStrategies(P, 2).length;
          const nb = infoSets(P, 1).concat(infoSets(P, 2)).length;
          return `expected payoffs $(${nmz(r.u[0])},\\,${nmz(r.u[1])})$ = sum over leaves of (reach probability) × (payoff)\nplayer 1 has ${S1} pure strategies, player 2 has ${S2}; a behaviour profile needs only ${nb} numbers (one per information set of this tree)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Kuhn’s theorem: behaviour and mixed strategies under perfect recall',
      statement: String.raw`In a finite extensive game in which a player has **perfect recall**, every mixed strategy of that player is **outcome-equivalent** to a behaviour strategy: whatever the others do, both induce the same probability distribution over leaves. Conversely every behaviour strategy is equivalent to a mixed one. Hence in games of perfect recall one may restrict to behaviour strategies without changing the set of achievable outcome distributions or the equilibria payoffs. Without perfect recall this fails.`,
      idea: String.raw`Given a mixed strategy $\mu$, define the behaviour probability of action $a$ at an information set $I$ as the probability, under $\mu$, of choosing $a$ conditional on the player’s own earlier choices on the way to $I$ (the same for every node of $I$, by perfect recall). The chain rule for conditional probabilities factorises the probability of a player’s own action sequence under $\mu$; multiplying by the others’ moves and nature’s gives exactly the behaviour-strategy leaf probability. The coordinates of a mixed strategy can be correlated: independence of the original choices is not assumed. With imperfect recall, as for the absent-minded driver, one information set contains two nodes on the same path and the factorisation breaks.`,
      caption: String.raw`Choose “perfect recall”: player 1 mixes over her 16 pure strategies with random weights (re-roll with the button, or change how concentrated they are). Kuhn’s formula turns the mixture into probabilities on player 1’s edges (shown: the probability of the first action, $a$ or $U$, at each of her information sets, and of the second one on the other edge). The bars compare the leaf distribution of the original mixture with the distribution of the behaviour strategy, and they agree to machine precision. Choose “absent-minded driver”: exit at the first or second junction without remembering which. Mixed strategies give at most payoff $1$, behaviour strategies reach $4/3$ at $p=2/3$.`,
      credit: 'Kuhn, 1950–53; Aumann, 1964 (proof); absent-minded driver: Piccione & Rubinstein, 1997',
      scope: String.raw`Finite games with perfect recall; the theorem concerns one player’s strategies at a time and holds for any behaviour of the others.`,
      deps: ['game-4.9', 'stat-2.1'],
      refs: ['MSZ §6.2'],
      tags: ['perfect recall', 'behaviour strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perfect_recall_(game_theory)' },
      viz(v) {
        const mkPR = () => dec(1, [
          ['U', dec(2, [['l', dec(1, [['a', leaf(3, -3)], ['b', leaf(0, 0)]], 'B')], ['r', dec(1, [['a', leaf(1, -1)], ['b', leaf(4, -4)]], 'C')]], 'X')],
          ['D', dec(2, [['l', dec(1, [['a', leaf(2, -2)], ['b', leaf(-1, 1)]], 'E')], ['r', dec(1, [['a', leaf(2, -2)], ['b', leaf(-1, 1)]], 'E')]], 'Y')],
        ], 'A');
        const mkAM = () => dec(1, [['exit', leaf(0, 0)], ['continue', dec(1, [['exit', leaf(4, 0)], ['continue', leaf(1, 0)]], 'D')]], 'D');
        // The driver's first and second nodes form ONE information set 'D'
        let mode = 'pr', P = prep(mkPR()), S = pureStrategies(P, 1), seed = 5, mu = null;
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, title: 'game tree (player 1 is the one who mixes)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, title: 'outcome distributions' });
        const conc = v.slider('concentration of the mixture', 0.15, 3, 0.7, { step: 0.05, onChange: () => draw0() });
        const q2 = v.slider('player 2 plays $l$ at $X$ with probability', 0, 1, 0.5, { step: 0.05 });
        const q3 = v.slider('player 2 plays $l$ at $Y$ with probability', 0, 1, 0.3, { step: 0.05 });
        const pd = v.slider('driver continues with probability $p$', 0, 1, 2 / 3, { step: 0.01 });
        const draw0 = () => { const r = v.rng(seed); const w = S.map(() => Math.pow(-Math.log(1 - r() * 0.999999), 1 / conc.value)); const t = w.reduce((a, b) => a + b, 0); mu = w.map((x) => x / t); };
        const setMode = (m) => { mode = m; P = prep(m === 'pr' ? mkPR() : mkAM()); S = pureStrategies(P, 1); draw0(); [conc, q2, q3].forEach((c) => { c.el.hidden = m !== 'pr'; }); pd.el.hidden = m !== 'am'; };
        v.select('game', [{ value: 'pr', label: 'perfect recall' }, { value: 'am', label: 'absent-minded driver' }], 'pr', { onChange: setMode });
        v.button('new random mixture', () => { seed += 1; draw0(); });
        setMode('pr');
        let info;
        v.render(() => {
          const vw = treeView(P); T.setView(vw.x, vw.y);
          if (mode === 'pr') {
            B.setTitle('outcome distributions');
            const others = { X: [q2.value, 1 - q2.value], Y: [q3.value, 1 - q3.value] };
            const beh = kuhnBehaviour(P, 1, S, mu), bAll = { ...others, ...beh };
            const mixOut = mixedOutcome(P, 1, S, mu, others), behOut = P.leaves.map((l) => playBeh(P, bAll).leafP.get(l) || 0);
            drawTree(T, P, { edgeLabel: (e) => (e.from.p === 1 ? `${v.fix(beh[e.from.key][e.i], 2)}` : e.a), nodeTag: (n) => (n.p ? `${n.p}·${n.key}` : null), size: 12 });
            B.setView([0.4, P.nl + 0.6], [0, Math.max(0.3, ...mixOut) * 1.2]);
            P.leaves.forEach((l, j) => {
              B.rect(j + 1 - 0.38, 0, j + 1 - 0.02, mixOut[j], { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1.2 });
              B.rect(j + 1 + 0.02, 0, j + 1 + 0.38, behOut[j], { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.2 });
            });
            B.setTicks(P.leaves.map((l, j) => [j + 1, `${l.u[0]}`]), null); B.setLabels('leaf (payoff to player 1)', 'probability');
            info = { diff: Math.max(...mixOut.map((x, j) => Math.abs(x - behOut[j]))), support: mu.filter((x) => x > 0.01).length, u: playBeh(P, bAll).u[0] };
          } else {
            B.setTitle('expected payoff');
            const p = pd.value, beh = { D: [1 - p, p] }, r = playBeh(P, beh);
            drawTree(T, P, { edgeLabel: (e) => `${e.a} ${v.fix(beh.D[e.a === 'exit' ? 0 : 1], 2)}`, nodeTag: (n) => (n.p ? 'driver · D' : null), size: 12 });
            B.setView([0, 1], [0, 1.6]); B.setTicks(null, null); B.setLabels('probability $p$ of continuing', 'expected payoff');
            B.fn((x) => 4 * x * (1 - x) + x * x, { color: 'green', width: 3 });
            B.line(0, 0, 1, 1, { color: 'blue', width: 3 });
            B.text('behaviour strategies', 0.12, 1.45, { color: 'green', weight: 700, size: 12, align: 'left' });
            B.text('mixtures of the two pure strategies', 0.97, 0.3, { color: 'blue', weight: 700, size: 12, align: 'right' });
            B.dot(p, r.u[0], { r: 7, color: 'gold' }); B.dot(2 / 3, 4 / 3, { r: 4, color: 'green' });
            info = { u: r.u[0], p };
          }
        });
        v.readout(() => (mode === 'pr'
          ? `mixture over ${S.length} pure strategies (${info.support} with weight above 1%); largest difference between the two leaf distributions: ${info.diff.toExponential(1)}\nexpected payoff to player 1: ${v.fix(info.u, 3)} — the same under both descriptions`
          : `behaviour payoff at $p=${v.fix(info.p, 2)}$: ${v.fix(info.u, 3)}; best behaviour strategy $p=2/3$ gives $4/3$, best mixture of pure strategies gives only $1$ — the mixture cannot imitate the behaviour strategy`));
      },
    },
  ],
};
