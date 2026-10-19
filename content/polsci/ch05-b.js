// Political Science & Social Choice — Chapter 5 (part b): items 5.6-5.10
import { sum, range, clamp, mean, pct, Phi, phi, lgam, binomPmf, binomTail, majProb, tieProb, logspace } from './ch05.shared.js';

import { juryEquilibrium as jury, gains, swingEq } from './verification-models.js';

export default {
  collection: 'polsci',
  chapter: 5,
  items: [
    // ───────────────────────────────────────────────────────────── 5.6
    {
      num: '5.6',
      kind: 'Theorem',
      name: 'Unanimous juries convict innocents (Feddersen–Pesendorfer)',
      statement: String.raw`Model a jury as follows. The defendant is guilty with prior probability $\pi$ or innocent. Each of $n$ jurors receives a private signal that points to the true state with probability $q>\tfrac12$. The defendant is convicted if at least $k$ jurors vote to convict. Each juror prefers conviction exactly when her posterior probability of guilt is at least a threshold $z$, and she votes *strategically*: she conditions on the event that her vote is pivotal. In a monotone symmetric equilibrium each signal has a conviction probability. Depending on the prior and threshold, innocent-signal jurors may mix while guilty-signal jurors convict, or guilty-signal jurors may mix while innocent-signal jurors acquit; sincere and limiting pure cases are also possible.

Under the **unanimity rule** ($k=n$) being pivotal means that all other jurors vote to convict, which is strong evidence of guilt; for sufficiently large juries in the responsive parameter range, equilibrium has $\rho_n>0$ (jurors vote against their own innocent signal), and the probability of convicting an innocent defendant need not fall as $n$ grows: it can increase with $n$, and the probability of acquitting a guilty one is also large. Under simple majority, responsive equilibria aggregate information and both errors tend to zero as jury size grows. The comparison need not hold for every small jury or every limiting pure case.`,
      idea: String.raw`A juror's vote matters only if it is pivotal, and what pivotal means depends on the rule. Under unanimity, her vote is decisive only when all the other jurors vote to convict, and she should update on that: with many jurors, an innocent signal of her own is outweighed by the others' unanimity, so she overrides it, and the conviction probability that follows from sincere voting (which falls exponentially, since all $n$ signals would have to point to guilt) is replaced by a much larger one. Under majority rule, she is pivotal when the others are split almost evenly, and the evidence that carries is weak, so sincere voting is an equilibrium when the prior/threshold permit it; otherwise one signal type mixes. Information still aggregates asymptotically in the responsive equilibrium. The comparison is therefore not between sincere and strategic voters but between the rules once strategic behaviour is taken into account.`,
      caption: String.raw`Left: the probability of convicting an innocent defendant against the jury size $n$ in the symmetric equilibrium, under unanimity (red) and simple majority (blue), with sincere voting under unanimity for comparison (dashed). Right: the probability of acquitting a guilty defendant. Move the signal accuracy $q$, the prior $\pi$ and the threshold $z$ (the default weighs the two errors equally; extreme controls can produce limiting pure strategies). The readout gives the equilibrium probability $\rho_n$ that a juror votes to convict against her innocent signal.`,
      deps: ['polsci-5.4', 'stat-10.1'],
      see: ['polsci-5.9', 'polsci-3.7'],
      refs: ['Shepsle: group decisions', 'Feddersen and Pesendorfer (1998), American Political Science Review 92: 23–35'],
      tags: ['jury', 'strategic voting', 'unanimity'],
      credit: 'Timothy Feddersen and Wolfgang Pesendorfer, 1998',
      scope: String.raw`This reconstructs a monotone symmetric equilibrium, allowing mixing after either signal and limiting pure corners; it does not select among every unresponsive Nash equilibrium. The original has prior½; the prior slider is an explicit extension. Petersen’s2026 correction (doi10.1017/S0003055426101762) repairs the proof of Proposition2, preserving its strictly positive large-jury innocent-conviction limit under unanimity. For original notation p=signal accuracy and q=threshold, f=(1−q)(1−p)/(qp), that limit is f^{p/(2p−1)} when q>1−p. No deliberation or empirical jury data are modelled.`,
      links: { doi: 'https://doi.org/10.2307/2585926' },
      viz(v) {
        const A = v.stage({ x: [1, 45], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'jury size $n$', ylabel: 'P(convict innocent)', title: 'convicting the innocent' });
        const Bp = v.stage({ x: [1, 45], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'jury size $n$', ylabel: 'P(acquit guilty)', title: 'acquitting the guilty' });
        const qS = v.slider('signal accuracy $q$', 0.55, 0.95, 0.7, { step: 0.01 });
        const piS = v.slider('prior of guilt $\\pi$', 0.2, 0.8, 0.5, { step: 0.01 });
        const zS = v.slider('threshold $z$', 0.2, 0.8, 0.5, { step: 0.01 });
        const nS = v.slider('jury size $n$', 1, 45, 12, { int: true });
        const cache = new Map();
        const run = () => {
          const key = [qS.value, piS.value, zS.value].map((x) => x.toFixed(3)).join('|');
          if (!cache.has(key)) {
            if (cache.size > 30) cache.clear();
            const ns = range(23).map((i) => 2 * i + 1);
            cache.set(key, ns.map((n) => ({ n, u: jury(n, n, qS.value, piS.value, zS.value), m: jury(n, (n + 1) / 2, qS.value, piS.value, zS.value), sinc: { ci: binomTail(n, n, 1 - qS.value), ag: 1 - binomTail(n, n, qS.value) } })));
          }
          return cache.get(key);
        };
        let info = {};
        v.render(() => {
          const R = run();
          A.path(R.map((r) => [r.n, r.u.ci]), { color: 'red', width: 2.4 });
          A.path(R.map((r) => [r.n, r.m.ci]), { color: 'accent', width: 2.4 });
          A.path(R.map((r) => [r.n, r.sinc.ci]), { color: 'muted', width: 1.6, dash: true });
          Bp.path(R.map((r) => [r.n, r.u.ag]), { color: 'red', width: 2.4 });
          Bp.path(R.map((r) => [r.n, r.m.ag]), { color: 'accent', width: 2.4 });
          Bp.path(R.map((r) => [r.n, r.sinc.ag]), { color: 'muted', width: 1.6, dash: true });
          A.vline(nS.value, { color: 'gold', dash: true, width: 1.6 }); Bp.vline(nS.value, { color: 'gold', dash: true, width: 1.6 });
          const n = nS.value, mm = n % 2 ? n : n + 1;
          info = { n, u: jury(n, n, qS.value, piS.value, zS.value), m: jury(mm, (mm + 1) / 2, qS.value, piS.value, zS.value), mm };
        });
        v.legend([['red', 'unanimity, strategic'], ['accent', 'majority, strategic'], ['muted', 'unanimity, sincere', { dash: true }]]);
        v.readout(() => `At $n=${info.n}$ under unanimity jurors with an innocent signal vote to convict with probability **$\\rho_n=${v.fix(info.u.rho, 3)}$** and guilty-signal jurors convict with probability ${v.fix(info.u.guilty, 3)}; the chance of convicting an innocent defendant is ${v.fix(info.u.ci, 3)} and of acquitting a guilty one ${v.fix(info.u.ag, 3)}. Under majority rule (jury of ${info.mm}): errors ${v.fix(info.m.ci, 3)} and ${v.fix(info.m.ag, 3)}; conviction given guilty signal ${v.fix(info.m.guilty, 3)}, given innocent signal ${v.fix(info.m.innocent, 3)}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.7
    {
      num: '5.7',
      kind: 'Concept',
      name: 'Rational ignorance',
      statement: String.raw`A voter is **rationally ignorant** when it costs her more to learn about the choice than the information is worth to her. Suppose that a vote cast with information level $s\ge0$ picks the better candidate with probability $a(s)$, that information costs $c$ per unit, and that her vote is decisive with probability $p$ and the stake is $B$. If the gain from voting for the better rather than the worse candidate is $pB\,(2a(s)-1)$ and $2a(s)-1 = 1-e^{-s}$, then the net value of information level $s$ is $V(s)=pB(1-e^{-s})-cs$, maximized at
$$s^*=\max\bigl\{0,\ \ln (pB/c)\bigr\}.$$
Because $p$ is small in a large electorate (polsci-5.3), $s^*=0$ for all $n$ beyond a finite size: an optimal voter learns nothing.`,
      idea: String.raw`The marginal value of an extra unit of information is $pBe^{-s}$ and its marginal cost is $c$, so the voter stops learning when the two meet. Since the benefit of information operates only through the chance $p$ of casting the decisive vote, the same smallness that explains low turnout (polsci-5.1) also explains why those who do vote may know little: ignorance, like abstention, is the rational response to a tiny $p$. The concept is behind Downs's view that voters rely on cheap cues such as party labels, and it motivates the question of whether an electorate of ill-informed voters can nevertheless decide well (polsci-5.8).`,
      caption: String.raw`Left: the net value $V(s)=pB(1-e^{-s})-cs$ of acquiring information level $s$ for the electorate size you choose; the dot is the optimum $s^*$. Right (log scale in $n$): the optimal information level $s^*$ and the accuracy $a(s^*)$ that goes with it, against $n$. Choose the dead-heat tie probability $\sqrt{2/\pi n}$ or the smoother $1/(n+1)$ that arises when the lean is uncertain, and change the stake and the cost.`,
      deps: ['polsci-5.1', 'behav-1.3'],
      see: ['polsci-5.8', 'polsci-5.9'],
      refs: ['Shepsle: voting and turnout'],
      tags: ['information', 'turnout'],
      credit: 'Anthony Downs, 1957',
      scope: String.raw`The exponential information technology, $2a(s)-1=1-e^{-s}$, and the linear cost are assumptions chosen to make the optimum explicit, not estimates from data; the qualitative weak decrease of optimal information as p falls extends to concave benefits and convex costs; the logarithmic formula is specific to this exponential example. The voter is assumed to vote regardless (for example from duty, polsci-5.2), so only the information choice is modelled.`,
      links: {},
      viz(v) {
        const L = v.stage({ x: [0, 8], y: [-1, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'information level $s$', ylabel: 'net value $V(s)$', title: 'what information is worth' });
        const R = v.stage({ x: [10, 1e9], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'number of voters $n$', ylabel: 'accuracy $a(s^*)$', title: 'optimal ignorance' });
        const B = v.slider('stake $B$', 100, 1e6, 5000, { log: true, sig: 2 });
        const c = v.slider('cost per unit $c$', 0.01, 100, 1, { log: true, sig: 2 });
        const nS = v.slider('electorate size $n$', 10, 1e9, 1e4, { log: true, sig: 2 });
        const mode = v.select('decisive probability', [{ value: 'tie', label: 'dead heat $\\sqrt{2/\\pi n}$' }, { value: 'unc', label: 'uncertain lean $1/(n+1)$' }], 'tie');
        const pOf = (n) => (mode.value === 'tie' ? Math.sqrt(2 / (Math.PI * n)) : 1 / (n + 1));
        const sStar = (n) => Math.max(0, Math.log((pOf(n) * B.value) / c.value));
        const acc = (s) => 1 - 0.5 * Math.exp(-s);
        let info = {};
        v.render(() => {
          const n = nS.value, p = pOf(n), b = B.value, cc = c.value, ss = sStar(n);
          const V = (s) => p * b * (1 - Math.exp(-s)) - cc * s;
          const top = Math.max(Math.abs(V(0)), V(ss), p * b, cc * 2, 1e-9);
          const xmax = Math.max(8,ss*1.15); L.setView([0, xmax], [Math.max(-cc*xmax,-top*3), top*1.3]);
          L.hline(0, { color: 'faint' });
          L.fn(V, { color: 'accent', width: 2.4, domain: [0, Math.max(8,ss*1.15)] });
          L.dot(ss, V(ss), { r: 7, color: 'green', label: 's*', labelPos: 'ne' });
          const ns = logspace(10, 1e9, 140);
          R.path(ns.map((x) => [x, acc(sStar(x))]), { color: 'accent', width: 2.4 });
          R.hline(0.5, { color: 'faint', dash: true });
          R.vline(n, { color: 'gold', dash: true, width: 1.6 });
          R.dot(n, acc(ss), { r: 6, color: 'green' });
          const nz = mode.value === 'tie' ? (2 * b * b) / (Math.PI * cc * cc) : b / cc - 1;
          if (nz > 10 && nz < 1e9) { R.vline(nz, { color: 'red', dash: true, alpha: 0.7 }); R.text('s* = 0 beyond', nz, 0.25, { color: 'red', size: 11.5, align: 'right' }); }
          info = { p, ss, nz, a: acc(ss) };
        });
        v.legend([['accent', 'value / accuracy'], ['green', 'optimum', { dot: true }], ['red', 'size where learning stops', { dash: true }]]);
        v.readout(() => `$p=${v.sci(info.p, 3)}$, so $pB=${v.sci(info.p * B.value, 3)}$ against $c=${v.fmt(c.value, 3)}$: optimal information $s^*=\\mathbf{${v.fix(info.ss, 2)}}$, giving accuracy $a(s^*)=${v.fix(info.a, 3)}$ (pure guessing is $0.5$). Beyond $n\\approx ${v.sci(info.nz, 3)}$ the optimal voter learns nothing.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.8
    {
      num: '5.8',
      kind: 'Concept',
      name: 'The miracle of aggregation',
      statement: String.raw`Let a fraction $f$ of $N$ voters be informed, each right with probability $a>\tfrac12$, and let the others be uninformed, each right with probability $u$; all votes are independent. The average chance of being right is $\bar p = fa+(1-f)u$. By the law of large numbers the majority is right with probability tending to $1$ whenever $\bar p>\tfrac12$, that is, whenever
$$f\,(a-\tfrac12) \;>\; (1-f)\,(\tfrac12-u).$$
In particular, if the uninformed guess completely at random ($u=\tfrac12$), then **any** positive fraction of informed voters, however small, makes the large majority right: the random votes cancel and the informed minority decides. If the uninformed are systematically biased ($u<\tfrac12$) the average can fall below½, making the majority wrong with probability tending to1. Equality is a boundary case, not a certainty of error.`,
      idea: String.raw`Write the number of correct votes as a sum of independent Bernoulli variables; its mean is $N\bar p$ and its standard deviation is of order $\sqrt N$, so only the sign of $\bar p-\tfrac12$ matters when $N$ is large (polsci-5.4). Uninformed voters with $u=\tfrac12$ add a symmetric random walk to the tally, which has size $\sqrt N$, while the informed add a drift of $f N (a-\tfrac12)$, which wins eventually. Independent unbiased noise averages out. Bias can reverse the limit; correlation can also prevent concentration without changing any voter’s marginal accuracy (polsci-5.5). This is the sense in which a public that is largely uninformed can still reach a sensible collective judgment, an argument associated with the study of public opinion by Page and Shapiro (1992).`,
      caption: String.raw`The colour shows (by a normal approximation) the probability that the majority is right for $N$ voters as a function of the informed share $f$ (horizontal) and the uninformed voters’ accuracy $u$ (vertical). Above the red curve, $\bar p>\tfrac12$ and large majorities are right. Drag the dot to choose a point; the right panel gives the exact distribution of the number of correct votes with the majority threshold.`,
      deps: ['polsci-5.4', 'prob-2.2.6'],
      see: ['polsci-5.5', 'polsci-5.7'],
      refs: ['Shepsle: group decisions', 'Page and Shapiro (1992), The Rational Public'],
      tags: ['aggregation', 'public opinion'],
      scope: String.raw`Votes are independent with two accuracy levels, and the heat map uses a normal approximation of the number of correct votes (the readout and bar chart on the right are exact). Whether real electorates behave this way is exactly the empirical question the literature debates; the argument gives conditions, not evidence. The complete1992author excerpt “Individual Ignorance and Collective Wisdom” discusses cancellation of random survey/individual-opinion errors and warns that available information must be accurate/helpful. The two-type electoral Bernoulli model here is our mathematical illustration, not their empirical design or a claim of historical priority.`,
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
          const lo = 0, hi = N, vals = range(hi - lo + 1).map((i) => tot[lo + i]);
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
      statement: String.raw`Two states of the world, $A$ and $B$, are equally likely; the better candidate is the one named after the state. Some voters are *informed*: each votes for the correct candidate with probability $q>\tfrac12$ (fixed signal-following behaviour). Some are *partisans* who always vote for their own candidate, with equally many partisans $a=b$ on each side. The rest are *independents* who share the common goal of electing the correct candidate but have no information. An independent can vote $A$, vote $B$ or abstain; she is decisive when the others tie or when her side is one vote behind.

**Claim.** If $1/2<q<1$, the number $n_I$ of informed voters is odd and all the other independents abstain, then voting for either candidate gives an independent a strictly *lower* expected payoff than abstaining:
$$\Delta U_A = \Delta U_B = \tfrac14\bigl[\Pr{}_A(D=-1)-\Pr{}_A(D=1)\bigr]<0,$$
where $D$ is the margin of votes for $A$ over $B$ among the others in state $A$. Thus abstention is a best response for the uninformed against this fixed informed behaviour even though voting is free. At q=1 with at least three informed voters, both gains are zero; strictness need not hold.`,
      idea: String.raw`An independent's vote matters only when the others are tied (or one behind), and *those are exactly the events in which the informed voters are split*, which is bad news about the state: given a tie, the informed voters' information has cancelled, but given a one-vote lead for the true side it is the true side that would be more likely to win anyway. When the margin is $D=-1$, the votes are more likely to have come from a world where the state is $B$, so adding a vote for $A$ pushes the result in the wrong direction more often than the right one. The net effect is the difference $\Pr_A(D=-1)-\Pr_A(D=1)$, which is negative because the true state is more likely to lead. Hence the uninformed do best to leave the decision to those who know. With unbalanced partisans the same pivotal-event logic makes some independents vote for the side that is behind, to offset the partisans (as the right panel shows).`,
      caption: String.raw`Left: for the profile you pick ($\alpha$ and $\beta$ are the shares of the *other* independents who vote $A$ and $B$; the rest abstain), the expected payoff gain of one independent from voting $A$ or $B$ instead of abstaining. With odd informed count, balanced partisans and 1/2<q<1, the bars are below zero when the others abstain. Right: approximate symmetric response shares of independents who abstain, vote $A$ and vote $B$, after500 exponential-weight steps as the informed count changes. Add partisans on one side and watch independents vote for the other.`,
      deps: ['polsci-5.6', 'behav-1.3'],
      see: ['polsci-5.7', 'polsci-3.7'],
      refs: ['Shepsle: voting and turnout', 'Feddersen and Pesendorfer (1996), American Economic Review 86: 408–424'],
      tags: ['abstention', 'strategic voting', 'information'],
      credit: 'Timothy Feddersen and Wolfgang Pesendorfer, 1996',
      scope: String.raw`A finite toy inspired by the1996paper (complete October1995author version inspected): the original informed voters know the state and voter types/counts are random, whereas this demo fixes counts and noisy signal-following. Only uninformed choices are optimized here; the whole profile is not claimed as a Bayesian equilibrium for noisy informed voters. The iterative response curve reports its unilateral-improvement residual and can remain unconverged. Fey–Kim’s August2000author comment (published2002) repairs Proposition1’s proof; it preserves the abstention result under the original assumptions. Ties use a fair coin.`,
      links: {},
      viz(v) {
        const L = v.stage({ x: [0, 3], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 320, minWidth: 300, ylabel: 'gain over abstaining', title: 'gain from voting', xticks: [[0.5, 'vote A'], [1.5, 'vote B'], [2.5, 'abstain']] });
        const R = v.stage({ x: [1, 12], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'informed voters $n_I$', ylabel: 'share of independents', title: 'iterative responses of independents' });
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
          info = { g, e: E[nI.value - 1][1], maxRegret:Math.max(...E.map(([,e])=>e.regret)) };
        });
        v.legend([['muted', 'abstain'], ['blue', 'vote $A$'], ['orange', 'vote $B$']]);
        v.readout(() => `Others: $\\alpha=${v.fix(Math.min(alS.value, 1 - beS.value), 2)}$ vote $A$, $\\beta=${v.fix(beS.value, 2)}$ vote $B$. Gain from voting $A$: **${v.fix(info.g.gA, 4)}**, from voting $B$: **${v.fix(info.g.gB, 4)}** (abstaining is 0). After500steps at this $n_I$: abstain ${pct(info.e.ab, 0)}, vote $A$ ${pct(info.e.al, 0)}, vote $B$ ${pct(info.e.be, 0)}. Maximum unilateral gain at this point ${v.fix(info.e.regret,6)}; over the curve ${v.fix(info.maxRegret,6)}. ${info.maxRegret>1e-5 ? 'The iteration has not certified equilibrium along the whole curve.' : 'All plotted profiles pass a10⁻⁵ best-response tolerance.'}${nI.value % 2 === 0 && aS.value === bS.value ? '. When the others abstain, an even informed count and balanced partisans mean the margin never equals $\\pm1$, so the gains are zero.' : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.10
    {
      num: '5.10',
      kind: 'Paper',
      name: 'Essai sur l’application de l’analyse à la probabilité…',
      paper: { authors: 'Marquis de Condorcet', year: 1785, title: 'Essai sur l’application de l’analyse à la probabilité des décisions rendues à la pluralité des voix', venue: 'Paris: Imprimerie Royale', url: 'https://archive.org/details/essaisurlapplica00cond' },
      introduces: ['polsci-5.4', 'polsci-2.1', 'polsci-1.6'],
      statement: String.raw`Condorcet's *Essai* applies probability to decisions taken by majority vote. Two results from it organize this chapter and the one before. First, if each voter in an assembly is right with the same probability greater than one half and votes independently, then the probability that the majority is right grows along odd assembly sizes and approaches certainty; if each voter is more likely wrong than right the opposite happens. This is the jury theorem (polsci-5.4). Second, in the voting examples he discusses, majority preferences among three or more candidates can be cyclic: a majority prefers $A$ to $B$, a majority prefers $B$ to $C$, yet a majority prefers $C$ to $A$ (polsci-2.1), so that the candidate who beats every other in pairwise contests, when there is one, is the right winner (polsci-1.6) and may fail to exist. These results appear explicitly in the complete Discours préliminaire: originalpp.xxiv–xxv for the equal-competence majority limit andpp.lvi–lxi for the three-candidate comparisons/cycle. Independence and equal competence are the mathematical reconstruction used here.`,
      idea: String.raw`The two ideas answer the same question from opposite sides. For two alternatives where one is correct, independent voters of equal competence above one half make majority rule a statistical estimator whose error shrinks along odd group sizes. Under those assumptions a large group is reliable. For three or more alternatives with arbitrary preference rankings, pairwise majority need not form a coherent ordering: voters with perfectly transitive rankings can produce an intransitive collective preference, and the aggregation problem is structural, not statistical. Condorcet's criticism of the Borda count (polsci-1.5) comes from the same pairwise logic. The first result underlies the epistemic defence of democracy; the second opens the line that leads through Arrow's theorem (polsci-3.3).`,
      caption: String.raw`**Left:** a jury of odd size $n$ with independent voters, each right with probability $p$; the curve gives the exact probability that the majority is right. For $p>\tfrac12$ it climbs to 1, for $p<\tfrac12$ it sinks to 0. **Right:** three candidates and the voters' rankings. The initial electorate is the classic one of three voters ($ABC$, $BCA$, $CAB$), in which every pairwise majority is 2 to 1 and they form a cycle. Press the button to draw a random electorate of the size you pick, with each voter's ranking chosen uniformly among the six; the readout reports how often such electorates are cyclic, from a simulation of 3000 draws.`,
      deps: ['polsci-1.5'],
      see: ['polsci-5.4', 'polsci-2.1', 'polsci-2.2'],
      refs: [],
      tags: ['paper', 'jury theorem', 'Condorcet'],
      credit: 'Marquis de Condorcet, 1785',
      scope: String.raw`The rankings in the right panel are random draws from a model (every strict ranking equally likely), not historical data, and the cycle frequency is my own simulation. The jury panel assumes independent voters of equal competence.`,
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
