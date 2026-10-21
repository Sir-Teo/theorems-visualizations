import { uniform, totalVariation, finiteKernel, mixingProfile, distributionPair, couplingMatrix,
  disagreement, stickyTail, pathTrajectories, memoOne, probabilityStage, drawSeries } from './ch05.shared.js';
const SOURCE = 'https://pages.uoregon.edu/dlevin/MARKOV/markovmixing.pdf';
const choices = [{ value: 'cycle', label: 'lazy cycle' }, { value: 'rooms', label: 'two rooms' }, { value: 'periodic', label: 'periodic cycle' }];
const sum = row => row.reduce((a, b) => a + b, 0);
export default {
  collection: 'stoch', chapter: 5, title: 'Coupling and mixing times',
  summary: String.raw`Total variation measures the largest discrepancy between event probabilities. Couplings turn that discrepancy into a disagreement probability, and coalescing chains give mixing bounds. Exact finite computations distinguish a useful coupling bound from a sharp mixing scale; bottlenecks and statistics provide lower bounds, while retaining random maps from the past gives an exact-sampling algorithm under its stated assumptions.`,
  items: [
    {
      num: '5.1', kind: 'Definition', name: 'Total variation distance',
      statement: String.raw`For probability laws $\mu,\nu$ on a finite or countable set $S$, their **total variation distance** is
$$\begin{gathered}\|\mu-\nu\|_{\rm TV}\\=\sup_{A\subseteq S}|\mu(A)-\nu(A)|.\end{gathered}$$
It also equals $\frac12\sum_{x\in S}|\mu(x)-\nu(x)|$. The event $\{x:\mu(x)\ge\nu(x)\}$ attains the supremum. The distance lies in $[0,1]$, is zero precisely for equal laws, and is one precisely when their supports are disjoint.`,
      idea: String.raw`The signed differences sum to zero. Their positive part therefore has the same total mass as the negative part. Collecting all positive differences gives the largest possible event discrepancy; half the sum of absolute differences is exactly that mass.`,
      caption: String.raw`Move the second law away from the first, then choose any of the 32 events using its bit mask. The marked bars belong to that event. Its probability discrepancy never exceeds the exact total variation, and selecting all positive differences attains the bound.`,
      scope: 'The bars are two explicitly specified five-state laws; every event is available, including the empty and full events.',
      deps: [], refs: ['LPW 2nd ed. §4.1, Proposition 4.2'], links: { source: SOURCE }, tags: ['total variation', 'probability distance'],
      viz(v) {
        const shift = v.slider('separate the laws', 0, 1, .7, { step: 'any', decimals: 4 });
        const mask = v.slider('event bit mask', 0, 31, 7, { int: true, step: 1 });
        const s = v.stage({ x: [-.7, 4.7], y: [-.07, .52], axes: 'box', gutter: true, height: 300, xlabel: 'state', ylabel: 'probability', xticks: [0, 1, 2, 3, 4] });
        v.render(() => {
          const { mu, nu } = distributionPair(shift.value);
          s.bars(mu, { x0: -.16, dx: 1, barWidth: .28, color: 'blue' });
          s.bars(nu, { x0: .16, dx: 1, barWidth: .28, color: 'orange' });
          for (let i = 0; i < 5; i++) if (mask.value & (1 << i)) s.dot(i, .47, { color: 'gold', r: 4 });
        });
        v.legend([['blue', 'μ'], ['orange', 'ν'], ['gold', 'selected event']]);
        v.readout(() => {
          const { mu, nu } = distributionPair(shift.value), event = mu.reduce((x, p, i) => x + ((mask.value & (1 << i)) ? p - nu[i] : 0), 0);
          const optimal = mu.reduce((m, p, i) => p >= nu[i] ? m | (1 << i) : m, 0);
          return String.raw`$\|\mu-\nu\|_{\rm TV}=${v.fix(totalVariation(mu, nu), 5)}$. Selected $|\mu(A)-\nu(A)|=${v.fix(Math.abs(event), 5)}$. An attaining event has mask **${optimal}**.`;
        });
      },
    },
    {
      num: '5.2', kind: 'Theorem', name: 'Total variation via couplings',
      statement: String.raw`A **coupling** of laws $\mu,\nu$ is a joint law of $(X,Y)$ with those respective marginals. For finite or countable $S$,
$$\|\mu-\nu\|_{\rm TV}=\min\Pr\{X\ne Y\},$$
where the minimum ranges over all couplings. One minimizing coupling places diagonal mass $\min(\mu(x),\nu(x))$ at every $(x,x)$ and pairs the remaining masses, whose supports are disjoint.`,
      idea: String.raw`For any event, different membership indicators can occur only when $X\ne Y$, proving the lower bound on disagreement. Match the common mass first. If its complement has mass $r>0$, couple the two normalized residual laws independently; their disjoint supports force disagreement exactly on that mass $r$. If $r=0$, put everything on the diagonal.`,
      caption: 'Compare maximal, independent and common-uniform quantile couplings of the same two laws. Every square is an actual joint probability, and its row and column sums remain the prescribed marginals. The maximal coupling has the least off-diagonal mass.',
      scope: 'The five-state joint table is computed directly. A common random number need not give a maximal coupling for the displayed state ordering.',
      deps: ['stoch-5.1'], refs: ['LPW 2nd ed. §4.2, Proposition 4.7'], links: { source: SOURCE }, tags: ['coupling', 'total variation'],
      viz(v) {
        const kind = v.select('coupling', ['maximal', 'independent', 'quantile'], 'maximal');
        const shift = v.slider('separate the laws', 0, 1, .7, { step: 'any', decimals: 4 });
        const s = v.stage({ x: [-.65, 4.65], y: [-.65, 4.65], equal: true, axes: 'box', gutter: true, height: 340,
          xlabel: 'X', ylabel: 'Y', xticks: [0, 1, 2, 3, 4], yticks: [0, 1, 2, 3, 4], title: 'joint probabilities' });
        v.render(() => {
          const { mu, nu } = distributionPair(shift.value), C = couplingMatrix(mu, nu, kind.value);
          for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            s.rect(i - .45, j - .45, i + .45, j + .45, { fill: i === j ? 'green' : 'orange', fillAlpha: .08 + 1.8 * C[i][j], color: 'grid', width: .5 });
            s.text(C[i][j].toFixed(2), i, j, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
          }
        });
        v.legend([['green', 'agreement diagonal'], ['orange', 'disagreement']]);
        v.readout(() => {
          const { mu, nu } = distributionPair(shift.value), C = couplingMatrix(mu, nu, kind.value);
          const residual = Math.max(...mu.map((p, i) => Math.abs(p - sum(C[i]))), ...nu.map((p, j) => Math.abs(p - sum(C.map(row => row[j])))));
          return String.raw`$\Pr(X\ne Y)=${v.fix(disagreement(C), 5)}$; TV $=${v.fix(totalVariation(mu, nu), 5)}$. Largest marginal residual: $${v.sci(residual, 2)}$. Entries are rounded only for labels.`;
        });
      },
    },
    {
      num: '5.3', kind: 'Definition', name: 'Mixing time',
      statement: String.raw`For a finite irreducible aperiodic Markov chain with kernel $P$ and stationary law $\pi$, set
$$d(t)=\max_x\|P^t(x,\cdot)-\pi\|_{\rm TV}.$$
Its mixing time at tolerance $\varepsilon\in(0,1)$ is $t_{\rm mix}(\varepsilon)=\min\{t\ge0:d(t)\le\varepsilon\}$. The usual convention is $t_{\rm mix}=t_{\rm mix}(1/4)$. Markov-kernel contraction makes $d$ nonincreasing; irreducibility and aperiodicity ensure convergence to zero.`,
      idea: String.raw`A stationary law is unchanged by another step. Applying the same kernel to both laws cannot increase their event discrepancy: each event probability becomes an average of numbers in $[0,1]$. Thus once the worst starting state is close, it stays close. The convergence theorem ensures the threshold is eventually crossed.`,
      caption: 'Choose a chain and tolerance. The blue curve maximizes the computed distance over all six starting states. The bars show the current law from state 0 beside stationarity. The non-lazy even cycle breaks the aperiodicity assumption and remains at distance at least one half.',
      scope: 'All six-state transition powers are computed directly. “Not reached” means not reached within the displayed 100-step horizon, rather than a claim about all future times.',
      deps: ['stoch-5.1', 'stoch-4.7'], refs: ['LPW 2nd ed. §§4.4–4.5'], links: { source: SOURCE }, tags: ['mixing time', 'stationarity'],
      viz(v) {
        const kind = v.select('chain', choices, 'cycle'), tolerance = v.slider('tolerance', .05, .45, .25, { step: 'any', decimals: 4 });
        const t = v.slider('steps', 0, 100, 8, { int: true, step: 1 }), cache = memoOne();
        const get = () => cache(kind.value, () => mixingProfile(finiteKernel(kind.value), 100));
        const s = probabilityStage(v, 100), b = v.stage({ x: [-.7, 5.7], y: [-.05, 1.08], axes: 'box', gutter: true, height: 290, xlabel: 'state', ylabel: 'probability' });
        v.render(() => {
          const m = get(); drawSeries(s, m.d, 'blue'); s.hline(tolerance.value, { color: 'orange', dash: true });
          s.dot(t.value, m.d[t.value], { color: 'gold', r: 4 });
          b.bars(m.powers[t.value][0], { x0: -.16, dx: 1, barWidth: .28, color: 'blue' });
          b.bars(uniform(6), { x0: .16, dx: 1, barWidth: .28, color: 'green' });
        });
        v.legend([['blue', 'worst-case distance / current law'], ['orange', 'tolerance'], ['green', 'stationary law'], ['gold', 'selected time']]);
        v.readout(() => {
          const m = get(), first = m.d.findIndex(x => x <= tolerance.value);
          return String.raw`$d(${t.value})=${v.fix(m.d[t.value], 5)}$. First crossing of tolerance ${v.fix(tolerance.value, 3)}: **${first < 0 ? 'not reached by step 100' : 'step ' + first}**. Stationarity residual is zero by symmetry.`;
        });
      },
    },
    {
      num: '5.4', kind: 'Lemma', name: 'Submultiplicativity of the distance to stationarity',
      statement: String.raw`For a finite Markov kernel with stationary law $\pi$, define the pairwise distance
$$\begin{gathered}\bar d(t)=\max_{x,y}\\\|P^t(x,\cdot)-P^t(y,\cdot)\|_{\rm TV}.\end{gathered}$$
Then $d(t)\le\bar d(t)\le2d(t)$ and $\bar d(s+t)\le\bar d(s)\bar d(t)$. Consequently, for an irreducible aperiodic finite chain, $d(k t_{\rm mix})\le2^{-k}$ for every positive integer $k$. Submultiplicativity is asserted for $\bar d$, rather than for $d$ itself.`,
      idea: String.raw`Couple the two laws at time $s$ maximally. They disagree with probability at most $\bar d(s)$. Equal states contribute no difference after the next $t$ steps; unequal states contribute at most $\bar d(t)$. Stationarity is a mixture of starting states, giving $d\le\bar d$, while the triangle inequality through $\pi$ gives the other comparison. At $t_{\rm mix}$, $\bar d\le1/2$, so iterate the product bound.`,
      caption: String.raw`Choose $s$ and $t$. The plot compares both distance conventions over time. The bars directly compare $\bar d(s+t)$ with its product bound; all row-pair maxima are recomputed from the transition matrix.`,
      scope: 'Six-state kernels and integer times are computed without a fitted exponential. The distinction between the two distances matters even when their plotted curves nearly coincide.',
      deps: ['stoch-5.3', 'stoch-5.2'], refs: ['LPW 2nd ed. §4.4, Lemmas 4.10–4.11'], links: { source: SOURCE }, tags: ['contraction', 'mixing time'],
      viz(v) {
        const kind = v.select('chain', ['cycle', 'path', 'rooms'], 'path'), a = v.slider('s', 0, 30, 4, { int: true, step: 1 }), b = v.slider('t', 0, 30, 7, { int: true, step: 1 });
        const cache = memoOne(), get = () => cache(kind.value, () => mixingProfile(finiteKernel(kind.value), 60));
        const s = probabilityStage(v, 60), bars = v.stage({ x: [-.7, 1.7], y: [-.06, 1.08], axes: 'box', gutter: true, height: 290, xticks: [[0, 'joint'], [1, 'product']], ylabel: 'distance / bound' });
        v.render(() => { const m = get(); drawSeries(s, m.d, 'blue'); drawSeries(s, m.pair, 'orange'); s.dot(a.value + b.value, m.pair[a.value + b.value], { color: 'gold', r: 4 }); bars.bars([m.pair[a.value + b.value], m.pair[a.value] * m.pair[b.value]], { x0: 0, dx: 1, barWidth: .5, color: (_, i) => i ? 'orange' : 'green' }); });
        v.legend([['blue', 'distance to π'], ['orange', 'largest row-pair distance'], ['gold', 's+t']]);
        v.readout(() => { const m = get(); return String.raw`$\bar d(s+t)=${v.fix(m.pair[a.value + b.value], 6)}\le${v.fix(m.pair[a.value] * m.pair[b.value], 6)}=\bar d(s)\bar d(t)$. Selected $s+t=${a.value + b.value}$.`; });
      },
    },
    {
      num: '5.5', kind: 'Definition', name: 'Markovian couplings',
      statement: String.raw`A **Markovian coupling** of a kernel $P$ is a Markov chain $(X_t,Y_t)$ on $S\times S$ whose transition law from $(x,y)$ has first marginal $P(x,\cdot)$ and second marginal $P(y,\cdot)$. Each coordinate is therefore a $P$-chain, even conditional on the full paired past. It is **coalescing** if, after the coordinates first agree, all subsequent coordinates agree. Any Markovian coupling can be made coalescing by using identical transitions on the diagonal.`,
      idea: String.raw`A joint transition must have the correct two marginals at every current pair, not just after averaging a particular starting distribution. Choosing shared randomness is one construction. Once both states are the same, applying one shared transition preserves both marginal laws and prevents the pair from separating again.`,
      caption: 'Start walkers at opposite ends of a reflected path. Shared signs preserve their order; alternatively use independent signs until their first meeting, then share every sign. The displayed trajectory is one reproducible example, rather than an estimate of a meeting-time probability.',
      scope: 'A sign chooses a left or right step with equal probability, with attempted exits held at the endpoint. The seed specifies pseudorandom signs for illustration; the mathematical coupling assumes independent fair signs over time.',
      deps: ['stoch-5.2', 'stoch-1.3'], refs: ['LPW 2nd ed. §5.1, Example 5.1 and Remark 5.3'], links: { source: SOURCE }, tags: ['Markovian coupling', 'coalescence'],
      viz(v) {
        const n = v.slider('states', 3, 9, 6, { int: true, step: 1 }), seed = v.slider('seed', 1, 50000, 73, { int: true, step: 1 });
        const same = v.toggle('share signs before meeting', true), t = v.slider('steps shown', 10, 80, 40, { int: true, step: 1 });
        const s = v.stage({ x: [-5, 85], y: [-.55, 8.55], axes: 'box', gutter: true, height: 320, xlabel: 'steps', ylabel: 'state' });
        const get = () => pathTrajectories(n.value, seed.value, t.value, same.value);
        v.render(() => { const m = get(); drawSeries(s, m.a, 'blue'); drawSeries(s, m.b, 'orange', { dash: true }); s.dot(t.value, m.a.at(-1), { color: 'blue', r: 4 }); s.dot(t.value, m.b.at(-1), { color: 'orange', r: 6, hollow: true }); });
        v.legend([['blue', 'walker X'], ['orange', 'walker Y (dashed / hollow)']]);
        v.readout(() => { const m = get(); return `First meeting: **${m.meeting === null ? 'not yet in this prefix' : 'step ' + m.meeting}**. Current states: ${m.a.at(-1)}, ${m.b.at(-1)}. Once equal, both use the same future signs.`; });
      },
    },
    {
      num: '5.6', kind: 'Theorem', name: 'Coupling bound on mixing',
      statement: String.raw`Let $(X_t,Y_t)$ be a coalescing coupling of $P$-chains, and let $\tau$ be their meeting time. For initial states $x,y$,
$$\begin{gathered}\|P^t(x,\cdot)-P^t(y,\cdot)\|_{\rm TV}\\\le\Pr_{x,y}(\tau>t).\end{gathered}$$
If instead $X_0=x$ and $Y_0\sim\pi$, stationarity gives $\|P^t(x,\cdot)-\pi\|_{\rm TV}\le\Pr(\tau>t)$. A bound uniform over starting states bounds $d(t)$; a single starting pair alone does not establish that worst-case bound.`,
      idea: String.raw`At time $t$, the pair is a coupling of the two required marginal laws. The coupling characterization bounds their total variation by disagreement. Coalescence identifies disagreement at $t$ with the event that meeting has not yet occurred. Starting the second chain in stationarity makes its marginal equal to $\pi$ at every time.`,
      caption: 'The green curve is the exact distance from state 0; the orange curve is the exact survival probability of a stationary-start sticky coupling. The latter is propagated on all 36 ordered pairs, rather than estimated by sampled meeting times. Inspect any integer time.',
      scope: 'The displayed kernels are symmetric six-state chains with uniform stationary law. The finite joint computation uses independent transitions away from the diagonal and identical transitions on it.',
      deps: ['stoch-5.5'], refs: ['LPW 2nd ed. §5.2, Theorem 5.4 and Corollary 5.5'], links: { source: SOURCE }, tags: ['mixing bound', 'coupling'],
      viz(v) {
        const kind = v.select('chain', ['cycle', 'rooms'], 'cycle'), t = v.slider('inspect time', 0, 80, 10, { int: true, step: 1 }), cache = memoOne();
        const get = () => cache(kind.value, () => { const P = finiteKernel(kind.value), m = mixingProfile(P, 80); return { tail: stickyTail(P, 80), d: m.powers.map(rows => totalVariation(rows[0], uniform(6))) }; });
        const s = probabilityStage(v, 80, 'exact law and coupling survival');
        v.render(() => { const m = get(); drawSeries(s, m.tail, 'orange'); drawSeries(s, m.d, 'green'); s.dot(t.value, m.d[t.value], { color: 'green', r: 4 }); s.dot(t.value, m.tail[t.value], { color: 'orange', r: 5, hollow: true }); });
        v.legend([['green', 'TV from state 0'], ['orange', 'probability not yet coupled']]);
        v.readout(() => { const m = get(); return String.raw`At $t=${t.value}$, TV $=${v.fix(m.d[t.value], 6)}\le${v.fix(m.tail[t.value], 6)}=\Pr(\tau>t)$. Both curves are exact finite-law recurrences, subject to binary64 rounding.`; });
      },
    },
  ],
};
