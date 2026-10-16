// Political Science & Social Choice — Chapter 5: Turnout, information and juries (items 5.1-5.5; the rest are in ch05-b.js)
import { sum, range, clamp, mean, pct, Phi, phi, lgam, binomPmf, binomTail, majProb, tieProb, hoeffding, logspace } from './ch05.shared.js';

/** Tie probability for a given electorate size and expected support q (cached by rounding). */
const pDec = (n, q) => tieProb(n, q);
/** Number of voters needed before p*B drops below c for a dead-heat electorate: p ~ sqrt(2/(pi n)). */
const nStar = (B, c) => (2 * B * B) / (Math.PI * c * c);

export default {
  collection: 'polsci',
  chapter: 5,
  title: 'Turnout, information and juries',
  summary: String.raw`A single vote almost never decides a large election, so a purely instrumental voter, who votes only to change the result, should stay home: this is the paradox of voting. The calculus of voting repairs the prediction by adding a taste for voting itself, and the probability of a decisive vote turns out to be an exact binomial calculation, with a very different size depending on what the voter knows about the electorate. Voting also aggregates information. Condorcet's jury theorem says that a majority of independent voters who are each better than chance is almost surely right when the group is large; it fails when votes are correlated, and strategic jurors who vote as though they were pivotal can make a unanimous jury convict more innocent defendants as it grows. The last items look at who bothers to learn anything (rational ignorance), why noisy electorates can still be wise (the miracle of aggregation), and why an uninformed voter may do best to abstain (the swing voter's curse). The chapter ends with Condorcet's own essay of 1785.`,
  items: [
    // ───────────────────────────────────────────────────────────── 5.1
    {
      num: '5.1',
      kind: 'Paradox',
      name: 'The paradox of voting (Downs)',
      statement: String.raw`Suppose a citizen votes only to change who wins. If the benefit to her of her preferred side winning is $B$, the cost of voting is $c$, and the probability that her single vote is decisive is $p$, then voting is worth it exactly when
$$pB > c.$$
In a large electorate $p$ is tiny: for $n$ voters who are split evenly, the probability of an exact tie is about $\sqrt{2/(\pi n)}$, and if the electorate leans even slightly to one side it is far smaller still. So $pB$ falls below any fixed cost $c$ once $n$ exceeds about $2B^2/(\pi c^2)$ (for a dead heat), and the model predicts that almost nobody votes. Millions do. That mismatch between the instrumental model and observed turnout is the **paradox of voting**.`,
      idea: String.raw`The argument is arithmetic on three numbers. The benefit $B$ is bounded by what is at stake, the cost $c$ of registering, informing oneself and going to the polls is positive, and the probability of being pivotal shrinks like $1/\sqrt n$ at best (polsci-5.3 computes it exactly). Expected-utility reasoning (behav-1.3) says to compare the expected gain $pB$ with $c$, so for large $n$ the comparison always fails. The paradox is not that rational voters would abstain, but that the model which makes voting a rational investment in the outcome cannot account for turnout; the standard repair adds a term for the satisfaction of voting itself (polsci-5.2).`,
      caption: String.raw`Both axes are logarithmic. The blue curve is the expected benefit $pB$ of voting in a dead-heat electorate as the number of voters $n$ grows; the red line is the cost $c$. The orange curve gives the same quantity when the electorate is expected to lean by a few tenths of a percent to one side, which kills $p$ much faster. The green line marks the size $2B^2/(\pi c^2)$ beyond which a dead-heat voter's expected gain is below the cost. Move the stake, the cost and the electorate size and read $p$ off the readout.`,
      deps: ['behav-1.3'],
      see: ['polsci-5.2', 'polsci-5.3', 'polsci-5.7'],
      refs: ['Shepsle: voting and turnout', 'Gelman, Silver and Edlin (2012), Economic Inquiry 50: 321–326'],
      tags: ['turnout', 'pivotal voter'],
      credit: 'Anthony Downs, 1957',
      scope: String.raw`The decisive probability is that of an exact tie among $n$ voters who vote independently, with the same chance $q$ for each of two candidates. Real elections are decided through many districts and recounts, and a voter does not know $q$ precisely (polsci-5.3), but even Gelman, Silver and Edlin's estimate for an average U.S. voter in the 2008 presidential election, about 1 chance in 60 million of being decisive, leaves $pB$ very small. The stake and cost values are illustrative and not data.`,
      verify: true,
      links: { doi: 'https://doi.org/10.1086/257897' },
      viz(v) {
        const s = v.stage({ x: [100, 1e9], y: [1e-6, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, full: true, xlabel: 'number of voters $n$', ylabel: 'expected benefit $pB$ (dollars)' });
        const B = v.slider('stake $B$ (dollars)', 100, 1e6, 5000, { log: true, sig: 2 });
        const c = v.slider('cost $c$ (dollars)', 1, 1000, 10, { log: true, sig: 2 });
        const lean = v.slider('expected lean of the electorate (percentage points)', 0, 2, 0.3, { step: 0.05 });
        const nS = v.slider('electorate size $n$', 100, 1e9, 1e6, { log: true, sig: 2 });
        v.render(() => {
          const b = B.value, cc = c.value, q = 0.5 + lean.value / 100, n = Math.round(nS.value / 2) * 2;
          s.fn((x) => b * Math.sqrt(2 / (Math.PI * x)), { color: 'accent', width: 2.4, n: 220 });
          if (lean.value > 0) s.fn((x) => b * pDec(Math.round(x / 2) * 2, q), { color: 'orange', width: 2.2, n: 220 });
          s.hline(cc, { color: 'red', width: 2 });
          const ns = nStar(b, cc);
          if (ns > 100 && ns < 1e9) { s.vline(ns, { color: 'green', width: 1.6, dash: true }); s.text('n* = 2B²/(πc²)', ns, 3e4, { color: 'green', size: 11.5, align: 'center' }); }
          s.vline(n, { color: 'gold', width: 1.6, dash: true });
          const p0 = Math.sqrt(2 / (Math.PI * n));
          s.dot(n, b * p0, { r: 6, color: 'accent' });
          const p1 = pDec(n, q);
          if (lean.value > 0 && p1 > 0) s.dot(n, b * p1, { r: 6, color: 'orange' });
        });
        v.legend([['accent', 'dead heat: $B\\sqrt{2/\\pi n}$'], ['orange', 'leaning electorate'], ['red', 'cost $c$'], ['green', 'breakeven size', { dash: true }]]);
        v.readout(() => {
          const b = B.value, cc = c.value, q = 0.5 + lean.value / 100, n = Math.round(nS.value / 2) * 2;
          const p0 = Math.sqrt(2 / (Math.PI * n)), p1 = pDec(n, q);
          return `At $n=${v.sci(n, 2)}$ the chance of a tie in a dead heat is $p=${v.sci(p0, 3)}$, so $pB=${v.sci(b * p0, 3)}$ dollars against a cost of $${v.fmt(cc, 3)}$: voting ${b * p0 > cc ? '**pays**' : '**does not pay**'}.\nWith a lean of ${v.fix(lean.value, 2)} points, $p=${p1 > 0 ? v.sci(p1, 3) : '0'}$ and $pB=${v.sci(b * p1, 3)}$. The dead-heat breakeven is $n^*\\approx ${v.sci(nStar(b, cc), 3)}$.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 5.2
    {
      num: '5.2',
      kind: 'Model',
      name: 'The calculus of voting (Riker–Ordeshook)',
      statement: String.raw`In the **calculus of voting**, a citizen votes when her reward
$$R = pB - C + D$$
is positive (or at least non-negative), where $B$ is the difference in benefit between her preferred and her less preferred outcome, $p$ the probability that her vote is decisive, $C$ the cost of voting and $D$ a term for the *direct* satisfaction of voting (a sense of duty, expressing a preference, taking part). The $pB$ term depends on the size and closeness of the election; $C$ and $D$ do not. Consequently turnout in a large electorate is predicted by the share of citizens whose $D$ exceeds their $C$, and a close election raises turnout only through the small term $pB$.`,
      idea: String.raw`Without $D$, the rule $pB>C$ reproduces the paradox of voting (polsci-5.1): $p$ is negligible, so $R<0$ for nearly everyone. Adding a $D$ that does not shrink with $n$ restores positive turnout: a voter votes if her duty outweighs her cost, up to a small correction. The model is a classification of motives, and its price is flexibility: $D$ can absorb any pattern of turnout, which is why the model is often judged by what it implies for how turnout *varies* (with cost, with closeness) rather than for its level.`,
      caption: String.raw`Left: each dot is one of 300 simulated citizens with a cost $C$ (horizontal) and a total reward $D+pB$ (vertical). Citizens above the diagonal vote ($R>0$), the others stay home. Right: the share who vote as the electorate grows. Without $D$ (red) turnout collapses; with it (green) turnout settles at the share of citizens with $D>C$. Change the stake, the typical cost and duty, the lean of the electorate (a closer race raises $p$) and the toggle.`,
      deps: ['polsci-5.1'],
      see: ['polsci-5.3', 'polsci-5.7'],
      refs: ['Shepsle: voting and turnout', 'Riker and Ordeshook (1968), American Political Science Review 62: 25–42'],
      tags: ['turnout', 'civic duty'],
      credit: 'William H. Riker and Peter C. Ordeshook, 1968',
      scope: String.raw`The population is a model, not data: costs $C$ and duty terms $D$ are drawn from log-normal distributions (spread $0.6$ and $0.5$ in the logarithm) around the medians you set, with the same stake $B$ for everyone, and $p$ is the tie probability of $n$ independent voters with the lean you set (polsci-5.3).`,
      links: { doi: 'https://doi.org/10.2307/1953324' },
      viz(v) {
        const rng = v.rng(7), M = 300, zc = range(M).map(() => rng.normal()), zd = range(M).map(() => rng.normal());
        const S = v.stage({ x: [0.5, 500], y: [0.5, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'cost of voting $C$', ylabel: 'reward $D+pB$', title: 'who votes' });
        const T = v.stage({ x: [1e3, 1e9], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'number of voters $n$', ylabel: 'turnout', title: 'turnout against electorate size' });
        const B = v.slider('stake $B$', 100, 1e6, 5000, { log: true, sig: 2 });
        const cm = v.slider('median cost $C$', 1, 100, 8, { log: true, sig: 2 });
        const dm = v.slider('median duty $D$', 1, 100, 6, { log: true, sig: 2 });
        const lean = v.slider('expected lean (points)', 0, 2, 0, { step: 0.05 });
        const nS = v.slider('electorate size $n$', 1e3, 1e9, 1e6, { log: true, sig: 2 });
        const useD = v.toggle('include duty $D$', true);
        const Cs = zc.map((z) => cm.value * Math.exp(0.6 * z));
        const turnout = (n, withD, b, q, cmv, dmv) => {
          const pB = b * tieProb(Math.round(n / 2) * 2, q);
          let k = 0;
          for (let i = 0; i < M; i++) if ((withD ? dmv * Math.exp(0.5 * zd[i]) : 0) + pB > cmv * Math.exp(0.6 * zc[i])) k++;
          return k / M;
        };
        let last = {};
        v.render(() => {
          const b = B.value, q = 0.5 + lean.value / 100, n = Math.round(nS.value / 2) * 2, pB = b * tieProb(n, q);
          {
            S.line(0.5, 0.5, 500, 500, { color: 'faint', width: 1.4 });
            const yes = [], no = [];
            for (let i = 0; i < M; i++) {
              const C = cm.value * Math.exp(0.6 * zc[i]), D = (useD.value ? dm.value * Math.exp(0.5 * zd[i]) : 0), y = D + pB;
              (y > C ? yes : no).push([C, Math.max(y, 0.5001)]);
            }
            S.dots(no, { r: 3, color: 'gold' });
            S.dots(yes, { r: 3, color: 'green' });
            S.text('votes', 6, 150, { color: 'green', size: 12, weight: 700 });
            S.text('stays home', 100, 1.2, { color: 'gold', size: 12, weight: 700 });
            last.share = yes.length / M;
          }
          const ns = logspace(1e3, 1e9, 70);
          T.path(ns.map((x) => [x, turnout(x, false, b, q, cm.value, dm.value)]), { color: 'red', width: 2.2 });
          T.path(ns.map((x) => [x, turnout(x, true, b, q, cm.value, dm.value)]), { color: 'green', width: 2.2 });
          T.vline(n, { color: 'gold', width: 1.6, dash: true });
          last.t0 = turnout(n, false, b, q, cm.value, dm.value); last.t1 = turnout(n, true, b, q, cm.value, dm.value); last.pB = pB;
        });
        v.legend([['red', 'turnout without $D$'], ['green', 'turnout with $D$'], ['gold', 'current $n$', { dash: true }]]);
        v.readout(() => `At $n=${v.sci(Math.round(nS.value), 2)}$: $pB=${v.sci(last.pB, 3)}$. Turnout without duty ${pct(last.t0, 0)}, with duty ${pct(last.t1, 0)}; the left panel shows ${pct(last.share, 0)} voting. The reward is dominated by $D$ unless $pB$ is comparable to the typical cost.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.3
    {
      num: '5.3',
      kind: 'Theorem',
      name: 'The probability of a decisive vote',
      statement: String.raw`Let $n$ be even and let each of $n$ other voters vote for $A$ independently with probability $q$ and for $B$ otherwise. Your vote is decisive exactly when the others tie, which has probability
$$P_n(q)=\binom{n}{n/2}\,\bigl(q(1-q)\bigr)^{n/2}.$$
(a) If $q=\tfrac12$ then $P_n \sim \sqrt{\dfrac{2}{\pi n}}$ as $n\to\infty$.
(b) If $q\neq\tfrac12$ then $P_n \le \dfrac{(4q(1-q))^{n/2}}{\sqrt{\pi n/2}}$, which decays exponentially in $n$.
(c) If $q$ is itself uncertain with a density $f$ that is continuous at $\tfrac12$, then the probability of a tie, averaged over $q$, is asymptotically $f(\tfrac12)/n$; for the uniform density it equals exactly $1/(n+1)$.`,
      idea: String.raw`Stirling's formula (pma-8.22) turns $\binom{n}{n/2}\approx 2^n\sqrt{2/(\pi n)}$ into (a), and the bound in (b) is the same estimate multiplied by $(4q(1-q))^{n/2}<1$. Part (c) is an integral of the binomial probability: the tie probability as a function of $q$ is a spike of height $\sqrt{2/\pi n}$ and width of order $1/\sqrt n$ around $\tfrac12$, whose area is exactly $1/(n+1)$, so a prior that is spread out over the width of the spike gives $f(\tfrac12)/n$. The size of $p$ in the calculus of voting therefore depends on what the voter knows: certainty about a lean makes it vanish, honest uncertainty makes it merely small.`,
      caption: String.raw`Left: the exact distribution of the number of votes for $A$ among $n$ voters; the green bar is the tie. Right (both axes logarithmic): the tie probability against $n$. Blue is the exact value for the lean you set, the dashed line is $\sqrt{2/\pi n}$ for a dead heat, orange is the tie probability when the lean itself is uncertain with the standard deviation $\sigma$ you choose (a normal approximation, which falls like $1/n$ instead of exponentially).`,
      deps: ['polsci-5.1', 'pma-8.22'],
      see: ['polsci-5.2', 'polsci-7.6'],
      refs: ['Shepsle: voting and turnout', 'Good and Mayer (1975), Behavioral Science 20: 25–33', 'Gelman, Silver and Edlin (2012), Economic Inquiry 50: 321–326'],
      tags: ['pivotal voter', 'binomial'],
      scope: String.raw`Independent voters with a common $q$ (part c: a common $q$ drawn once from the prior). For (c) the orange curve uses the local normal approximation of the tie probability, $\frac1n\,N\!\bigl(q_0-\tfrac12;\,0,\ \sigma^2+\tfrac1{4n}\bigr)$, valid when $n$ is large and $q$ is not far from $\tfrac12$.`,
      links: {},
      viz(v) {
        const L = v.stage({ x: [-1, 21], y: [0, 0.3], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'votes for $A$', ylabel: 'probability', title: 'the tally of $n$ voters' });
        const R = v.stage({ x: [2, 1e6], y: [1e-12, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'number of voters $n$', ylabel: 'probability of a tie', title: 'the probability of a decisive vote' });
        const nS = v.slider('voters $n$', 2, 100, 20, { int: true, step: 2 });
        const lean = v.slider('lean $q_0-\\tfrac12$ (points)', 0, 5, 1, { step: 0.1 });
        const sig = v.slider('uncertainty $\\sigma$ (points)', 0.1, 5, 2, { log: true, sig: 2 });
        let info = {};
        v.render(() => {
          const n = Math.round(nS.value / 2) * 2, q = 0.5 + lean.value / 100, sd = sig.value / 100;
          const vals = range(n + 1).map((k) => binomPmf(n, k, q)), mx = Math.max(...vals);
          L.setView([-1, n + 1], [0, mx * 1.2]);
          L.bars(vals, { x0: 0, dx: 1, color: (val, i) => (i === n / 2 ? 'green' : 'accent') });
          L.vline(n / 2, { color: 'green', alpha: 0.4, dash: true });
          const mix = (m) => (1 / m) * phi((lean.value / 100) / Math.sqrt(sd * sd + 1 / (4 * m))) / Math.sqrt(sd * sd + 1 / (4 * m));
          R.fn((x) => tieProb(Math.round(x / 2) * 2 || 2, q), { color: 'accent', width: 2.4, n: 200 });
          R.fn((x) => Math.sqrt(2 / (Math.PI * x)), { color: 'ink', width: 1.4, dash: true, n: 100 });
          R.fn(mix, { color: 'orange', width: 2.2, n: 200 });
          R.vline(n, { color: 'gold', width: 1.6, dash: true });
          info = { n, q, tie: binomPmf(n, n / 2, q), asym: Math.sqrt(2 / (Math.PI * n)), mix: mix(n), mixBig: mix(1e6) };
        });
        v.legend([['accent', 'exact, lean known'], ['ink', '$\\sqrt{2/\\pi n}$ (dead heat)', { dash: true }], ['orange', 'lean uncertain'], ['green', 'tie', { dot: true }]]);
        v.readout(() => `For $n=${info.n}$: tie probability **$${v.sci(info.tie, 3)}$** (exact), dead-heat formula $\\sqrt{2/\\pi n}=${v.sci(info.asym, 3)}$, uncertain lean $${v.sci(info.mix, 3)}$. At $n=10^6$ with this uncertainty the tie probability is about $${v.sci(info.mixBig, 3)}$, while with the lean known exactly it is $${v.sci(tieProb(1e6, info.q), 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.4
    {
      num: '5.4',
      kind: 'Theorem',
      name: 'Condorcet’s jury theorem',
      statement: String.raw`Two alternatives, exactly one of which is correct. A jury of $n$ voters (with $n$ odd) votes by simple majority, and each voter independently chooses the correct alternative with the same probability $p$. Let $P_n(p)$ be the probability that the majority is correct. Then:
(a) if $p>\tfrac12$, $P_n(p)$ is increasing in $n$ and $P_n(p)\to 1$ as $n\to\infty$; moreover $P_n(p)\ge 1-e^{-2n(p-1/2)^2}$;
(b) if $p<\tfrac12$, $P_n(p)\to0$;
(c) if $p=\tfrac12$, $P_n=\tfrac12$ for every $n$.`,
      idea: String.raw`The number of correct votes is $\mathrm{Bin}(n,p)$ with mean $np$, so the jury is wrong only when this falls to at most $n/2$, which is a deviation of $n(p-\tfrac12)$ below the mean. By the law of large numbers (or sharply by Hoeffding's inequality) such deviations have vanishing probability. Monotonicity comes from comparing a jury of $n$ with one of $n+2$: the extra two voters change the outcome only when the first $n$ are one vote from a tie, and then it is more likely they push the majority toward the correct side. The result rests on the computation of probabilities for the binomial distribution (polsci-5.3) and is the formal core of the wisdom-of-crowds argument for majority rule.`,
      caption: String.raw`Left: the probability that the majority is right as the jury grows, for the competence $p$ you set (blue) with Hoeffding's lower bound (dashed), and the same curve for $1-p$ (red): a jury of the worse-than-chance is certain to be wrong. Right: the distribution of the number of correct votes for the jury size $n$ you choose; the bars to the right of the dashed line, in green, are the cases where the majority is right.`,
      deps: ['polsci-5.3'],
      see: ['polsci-5.5', 'polsci-5.8', 'polsci-5.10'],
      refs: ['Shepsle: group decisions', 'Easley and Kleinberg, Networks, Crowds, and Markets, ch. 23'],
      tags: ['jury theorem', 'majority rule'],
      credit: 'Marquis de Condorcet, 1785',
      scope: String.raw`Holds for independent voters of equal competence $p$ choosing between two alternatives, with sincere voting (polsci-5.6 relaxes the last assumption and polsci-5.5 the independence). With different competences, the same conclusion holds if the average competence stays above $\tfrac12$ and the voters are independent, as shown by later authors; I do not reproduce that here.`,
      verify: true,
      links: {},
      viz(v) {
        const A = v.stage({ x: [0, 301], y: [0, 1.02], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'jury size $n$', ylabel: 'probability majority is right', title: 'the majority is right' });
        const Bp = v.stage({ x: [-1, 32], y: [0, 0.3], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'number of correct votes', ylabel: 'probability', title: 'one jury' });
        const pS = v.slider('competence $p$', 0.3, 0.8, 0.55, { step: 0.005 });
        const nS = v.slider('jury size $n$', 1, 301, 31, { int: true, step: 2 });
        const cache = new Map();
        const curve = (p) => {
          const key = p.toFixed(4);
          if (!cache.has(key)) { if (cache.size > 40) cache.clear(); cache.set(key, range(151).map((i) => [2 * i + 1, majProb(2 * i + 1, p)])); }
          return cache.get(key);
        };
        let info = {};
        v.render(() => {
          const p = pS.value, n = nS.value % 2 ? nS.value : nS.value + 1;
          A.path(curve(p), { color: 'accent', width: 2.4 });
          A.path(curve(1 - p), { color: 'red', width: 1.8, alpha: 0.8 });
          if (p > 0.5) A.path(range(151).map((i) => [2 * i + 1, hoeffding(2 * i + 1, p)]), { color: 'ink', width: 1.4, dash: true });
          A.hline(0.5, { color: 'faint', dash: true });
          A.vline(n, { color: 'gold', width: 1.6, dash: true });
          const vals = range(n + 1).map((k) => binomPmf(n, k, p)), mx = Math.max(...vals);
          Bp.setView([-1, n + 1], [0, mx * 1.2]);
          Bp.bars(vals, { x0: 0, dx: 1, color: (val, i) => (i > n / 2 ? 'green' : 'accent') });
          Bp.vline(n / 2, { color: 'ink', dash: true, alpha: 0.6 });
          info = { p, n, P: majProb(n, p), h: hoeffding(n, p) };
        });
        v.legend([['accent', 'competence $p$'], ['red', 'competence $1-p$'], ['ink', 'Hoeffding bound', { dash: true }]]);
        v.readout(() => `With $p=${v.fix(info.p, 3)}$ and $n=${info.n}$ the majority is right with probability **${v.fix(info.P, 4)}**${info.p > 0.5 ? `; the bound $1-e^{-2n(p-1/2)^2}$ gives ${v.fix(info.h, 4)}` : ''}. A single voter is right ${v.fix(info.p, 3)} of the time.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.5
    {
      num: '5.5',
      kind: 'Phenomenon',
      name: 'Correlated voters break the jury theorem',
      statement: String.raw`Keep the setting of Condorcet's jury theorem (polsci-5.4) but let the votes be dependent in the following way. There is one opinion leader who is right with probability $p>\tfrac12$. Each voter, independently of the others, *follows the leader* with probability $\rho$ and otherwise votes independently, right with probability $p$. Every voter is still right with probability $p$ overall. Then the probability that the majority of $n$ voters is right is
$$P_n=p\,\Pr\bigl[\mathrm{Bin}(n,\rho+(1-\rho)p)>\tfrac n2\bigr]+(1-p)\,\Pr\bigl[\mathrm{Bin}(n,(1-\rho)p)>\tfrac n2\bigr],$$
and as $n\to\infty$ it tends to $1$ if $\rho<1-\frac1{2p}$ but to $p$ (not $1$) if $\rho>1-\frac1{2p}$.`,
      idea: String.raw`Conditional on whether the leader is right, the voters are independent, so the jury theorem applies in each case with the competence of that case. When the leader is right a voter is right with probability $\rho+(1-\rho)p>\tfrac12$ and the majority is right in the limit. When the leader is wrong a voter is right only with probability $(1-\rho)p$, which is below $\tfrac12$ exactly when $\rho>1-\frac1{2p}$, and then the majority is wrong in the limit. With enough shared influence the large group is no better than the leader. This is the dependent version of the theorem: independence is not a technicality but the engine of the result.`,
      caption: String.raw`Left: the probability that the majority is right against the jury size, for the strength of following $\rho$ you set (blue) and for independent voters (dashed grey). The dotted red line is the limit. Right: the probability that the majority is right as a function of $\rho$, for the jury size you choose (blue) and in the limit of an infinite jury (red step). The step sits at $\rho^*=1-1/(2p)$.`,
      deps: ['polsci-5.4'],
      see: ['polsci-5.8', 'soc-7.3'],
      refs: ['Shepsle: group decisions', 'Ladha (1992), American Journal of Political Science 36: 617–634'],
      tags: ['jury theorem', 'correlation'],
      scope: String.raw`This one-leader model is a standard textbook-style illustration of correlated votes and is my own construction for the picture, not a model from a specific paper; the general results on correlated votes (for example Ladha 1992) are stated under different dependence conditions that I have not checked in detail.`,
      verify: true,
      links: {},
      viz(v) {
        const A = v.stage({ x: [0, 401], y: [0, 1.02], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'jury size $n$', ylabel: 'probability majority is right', title: 'growth with the jury' });
        const Bp = v.stage({ x: [0, 1], y: [0, 1.02], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'strength of following the leader $\\rho$', ylabel: 'probability majority is right', title: 'the limit as $\\rho$ varies' });
        const pS = v.slider('competence $p$', 0.55, 0.9, 0.7, { step: 0.005 });
        const rS = v.slider('following $\\rho$', 0, 1, 0.4, { step: 0.01 });
        const nS = v.slider('jury size $n$', 1, 401, 101, { int: true, step: 2 });
        const Pn = (n, p, r) => p * majProb(n, r + (1 - r) * p) + (1 - p) * majProb(n, (1 - r) * p);
        const cache = new Map();
        const curve = (p, r) => {
          const key = p.toFixed(4) + '|' + r.toFixed(3);
          if (!cache.has(key)) { if (cache.size > 40) cache.clear(); cache.set(key, range(101).map((i) => [4 * i + 1, Pn(4 * i + 1, p, r)])); }
          return cache.get(key);
        };
        let info = {};
        v.render(() => {
          const p = pS.value, r = rS.value, n = nS.value % 2 ? nS.value : nS.value + 1, rs = 1 - 1 / (2 * p);
          const lim = r < rs ? 1 : p;
          A.path(curve(p, 0), { color: 'muted', width: 1.6, dash: true });
          A.path(curve(p, r), { color: 'accent', width: 2.4 });
          A.hline(lim, { color: 'red', width: 1.6, dash: [2, 4] });
          A.vline(n, { color: 'gold', width: 1.6, dash: true });
          Bp.path(range(81).map((i) => [i / 80, Pn(n, p, i / 80)]), { color: 'accent', width: 2.4 });
          Bp.line(0, 1, rs, 1, { color: 'red', width: 2.2 }); Bp.line(rs, p, 1, p, { color: 'red', width: 2.2 });
          Bp.vline(rs, { color: 'red', alpha: 0.4, dash: true });
          Bp.vline(r, { color: 'gold', width: 1.6, dash: true });
          info = { p, r, rs, n, P: Pn(n, p, r), lim };
        });
        v.legend([['accent', 'following $\\rho$'], ['muted', 'independent ($\\rho=0$)', { dash: true }], ['red', 'limit $n\\to\\infty$']]);
        v.readout(() => `$\\rho^*=1-1/(2p)=${v.fix(info.rs, 3)}$. With $\\rho=${v.fix(info.r, 2)}$ the majority of $n=${info.n}$ is right with probability **${v.fix(info.P, 4)}**; as $n\\to\\infty$ this ${info.r < info.rs ? 'tends to **1**' : `tends to **${v.fix(info.p, 3)}**, the leader's accuracy`}.`);
      },
    },
  ],
};
