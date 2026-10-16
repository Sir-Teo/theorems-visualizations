// Stochastic Processes — Chapter 4: Stationary distributions and convergence (items 4.1–4.8; 4.9–4.16 in ch04-b.js)
import { STATE_COL, stationary, matPow, vecP, l1, tv, unit, meanReturn, simExcursions, excursionMeasure, SIMP, simplexXY, simplexMu, presetChain, powers, walkMatrix, periodOf, edgesOf, ringPos, pfmt, cumRows, nextState } from './ch04.shared.js';

const CHAIN_OPTS = [{ value: 'weather', label: 'weather' }, { value: 'path', label: 'lazy path' }, { value: 'rooms', label: 'two rooms' }, { value: 'random', label: 'random 5-state' }];
const vtex = (x, d = 3) => '(' + x.map((t) => t.toFixed(d)).join(',\\ ') + ')';

export default {
  collection: 'stoch',
  chapter: 4,
  title: 'Stationary distributions and convergence',
  summary: String.raw`A stationary distribution is left unchanged by one step of the chain; for irreducible chains it exists exactly under positive recurrence, is unique, and equals the reciprocal of the mean return time. If the chain is also aperiodic, the distribution at time $n$ converges to it from any start, and time averages converge whatever the period. Reversible chains satisfy detailed balance, which makes stationary distributions easy to find, and the theory explains PageRank and resolves the Ehrenfest recurrence paradox.`,
  items: [
    // ───────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1', kind: 'Definition', name: 'Stationary distribution',
      statement: String.raw`Let $P$ be a transition matrix on a state space $S$. A probability vector $\pi=(\pi_i)_{i\in S}$ is a **stationary** (or **invariant**, or **equilibrium**) distribution for $P$ if
$$\pi P=\pi,\qquad\text{i.e.}\qquad \pi_j=\sum_{i}\pi_i\,p_{ij}\ \ \text{for every }j.$$
Equivalently, if $X_0\sim\pi$ then $X_n\sim\pi$ for every $n$, and in fact the whole process $(X_n)$ is then stationary: $(X_{m},X_{m+1},\dots)$ has the same law for every $m$. For finite $S$ this says that $\pi$ is a left eigenvector of $P$ for the eigenvalue $1$.`,
      idea: String.raw`One step of the chain maps a law $\mu$ to $\mu P$ (the distribution at time one when $X_0\sim\mu$, by Chapman–Kolmogorov 1.2, $\mu P^n$ at time $n$). A fixed point of this linear map that is a probability vector is exactly a law that survives every step; since the law of the whole process is built from the one-dimensional marginal and $P$ (1.1), a stationary marginal makes the process shift-invariant. Probability mass is conserved by $P$, so the picture is of mass sloshing among states with every state's outflow balanced by its inflow.`,
      caption: String.raw`The triangle is the set of all laws on three states; drag the gold point $\mu$ (or press the snap button). The orange trail is $\mu,\mu P,\mu P^2,\dots$ for $k$ steps and the green ring is $\pi$. Bars compare $\mu$, $\mu P$ and $\pi$. In the *weather* chain the trail spirals into $\pi$; in the *rotor* it spirals more violently; for the *pure 3-cycle* the trail is a rotating triangle that never settles, and only the centre is frozen.`,
      deps: ['stoch-1.1'], refs: ['Norris §1.7', 'LPW §1.5'], tags: ['stationary distribution', 'invariant measure'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'weather', label: 'weather' }, { value: 'rotor', label: 'rotor' }, { value: 'cycle', label: 'pure 3-cycle' }], 'weather', { onChange: () => setChain() });
        const k = v.slider('steps shown $k$', 0, 30, 10, { int: true, step: 1 });
        const s1 = v.stage({ x: [-0.15, 1.15], y: [-0.12, 1.0], equal: true, axes: false, height: 330, title: 'the simplex of laws on three states' });
        const s2 = v.stage({ x: [-0.6, 2.6], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'state', ylabel: 'probability', xticks: [[0, '1'], [1, '2'], [2, '3']], title: '$\\mu$, $\\mu P$ and $\\pi$' });
        let P, pi;
        function setChain() { P = kind.value === 'cycle' ? [[0, 1, 0], [0, 0, 1], [1, 0, 0]] : presetChain(kind.value).P; pi = stationary(P); v.invalidate(); }
        setChain();
        const h = s1.handle(0.08, 0.1, { color: 'gold', r: 8, label: 'μ', constrain: (x, y) => simplexXY(simplexMu(x, y)) });
        v.button('snap $\\mu$ to $\\pi$', () => { const [x, y] = simplexXY(pi); h.set(x, y); });
        v.render(() => {
          s1.path([...SIMP, SIMP[0]], { color: 'muted', width: 1.6 });
          SIMP.forEach(([x, y], i) => s1.text(String(i + 1), x, y, { dy: i === 2 ? -12 : 14, color: 'muted', size: 13 }));
          const mu = simplexMu(h.x, h.y), orbit = [mu];
          for (let j = 0; j < k.value; j++) orbit.push(vecP(orbit[j], P));
          s1.path(orbit.map(simplexXY), { color: 'orange', width: 1.5, alpha: 0.75 });
          orbit.slice(1).forEach((m) => { const [x, y] = simplexXY(m); s1.dot(x, y, { r: 3, color: 'orange' }); });
          const [px, py] = simplexXY(pi); s1.dot(px, py, { r: 8, color: 'green', hollow: true, label: 'π', labelPos: 'ne' });
          const mP = vecP(mu, P);
          if (l1(mu, mP) > 0.02) { const [a, b] = simplexXY(mu), [c, d] = simplexXY(mP); s1.arrow(a, b, c, d, { color: 'orange', width: 2 }); }
          [[mu, 'gold', -0.28], [mP, 'orange', 0], [pi, 'green', 0.28]].forEach(([vec, col, off]) => s2.bars(vec, { x0: off, dx: 1, barWidth: 0.26, color: col }));
        });
        v.legend([['gold', 'μ'], ['orange', 'μP'], ['green', 'π']]);
        v.readout(() => {
          const mu = simplexMu(h.x, h.y), d = l1(mu, vecP(mu, P));
          return `$\\pi=${vtex(pi)}$.  $\\|\\mu P-\\mu\\|_1=${v.fix(d, 4)}$ — ${d < 0.003 ? '**$\\mu$ is (numerically) stationary**' : 'one step still moves the mass'}. Check: $\\|\\pi P-\\pi\\|_1=${v.sci(l1(pi, vecP(pi, P)), 2)}$.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2', kind: 'Theorem', name: 'Kac’s formula: π(x) = 1/E_x[return time]',
      statement: String.raw`Let $P$ be an irreducible transition matrix and $x$ a state, with $T_x^+=\inf\{n\ge1:X_n=x\}$ the first return time. If $P$ has a stationary distribution $\pi$, then $P$ is positive recurrent and
$$\pi(x)=\frac1{\mathbb E_x\,[T_x^+]}\qquad\text{for every state }x.$$
In particular the stationary distribution is determined by the mean return times, and states that are visited rarely have long mean return times.`,
      idea: String.raw`Start the chain from $\pi$ and let $T=\inf\{n\ge0:X_n=x\}$. Shifting time by one step (stationarity) and conditioning on the first visit gives $\Pr_\pi(T=n)=\pi(x)\Pr_x(T_x^+>n)$ for $n\ge1$. Summing over $n\ge1$, and using that the stationary chain reaches $x$ with probability one (irreducibility; the chain is recurrent, 3.4 and 3.7), yields $1-\pi(x)=\pi(x)\big(\mathbb E_xT_x^+-1\big)$, that is $\pi(x)\,\mathbb E_xT_x^+=1$. In words: excursions from $x$ are fresh starts (strong Markov property, 2.8), one visit per cycle, so the long-run fraction of time at $x$ is the reciprocal of the cycle length.`,
      caption: String.raw`Pick a chain and the number of simulated excursions from every state. Left: the empirical value of $1/\bar T_x$ (blue bars), where $\bar T_x$ is the average observed return time, against the stationary probability $\pi(x)$ computed by linear algebra (green dots). Right: the mean return times themselves (bars) against $1/\pi(x)$ (black dots). The lazy path is the instructive case: its end states are visited rarely and so take longest to return to.`,
      deps: ['stoch-4.1', 'stoch-3.7', 'stoch-2.8'], refs: ['Norris §1.7'], credit: 'M. Kac, 1947', tags: ['return time', 'stationary distribution'],
      links: { doi: 'https://doi.org/10.1090/s0002-9904-1947-08927-8' },
      viz(v) {
        const kind = v.select('chain', CHAIN_OPTS, 'weather', { onChange: () => rebuild() });
        const N = v.slider('excursions per state', 200, 20000, 3000, { log: true, int: true, onChange: () => rebuild() });
        let seed = 3; v.button('new random chain', () => { seed++; kind.value = 'random'; rebuild(); });
        const s1 = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, xticks: [0, 1, 2, 3, 4], xlabel: 'state $x$', ylabel: 'probability', title: '$1/\\bar T_x$ against $\\pi(x)$' });
        const s2 = v.stage({ x: [-0.6, 4.6], y: [0, 10], axes: 'box', gutter: true, height: 300, xticks: [0, 1, 2, 3, 4], xlabel: 'state $x$', ylabel: 'mean return time', title: 'mean return times against $1/\\pi(x)$' });
        let P, pi, sim;
        function rebuild() {
          P = presetChain(kind.value, seed * 13 + 1, v).P; pi = stationary(P);
          const R = v.rng(seed * 101 + 5);
          sim = P.map((_, x) => simExcursions(P, x, N.value, R).mean);
          const n = P.length; s1.setView([-0.6, n - 0.4], [0, Math.max(...pi, ...sim.map((t) => 1 / t)) * 1.15]); s2.setView([-0.6, n - 0.4], [0, Math.max(...pi.map((p) => 1 / p), ...sim) * 1.15]); v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.bars(sim.map((t) => 1 / t), { x0: 0, dx: 1, color: 'accent' });
          pi.forEach((p, i) => s1.dot(i, p, { r: 5, color: 'green' }));
          s2.bars(sim, { x0: 0, dx: 1, color: 'accent' });
          pi.forEach((p, i) => s2.dot(i, 1 / p, { r: 5, color: 'ink' }));
        });
        v.legend([['accent', 'simulation', { area: true }], ['green', '$\\pi(x)$', { dot: true }], ['ink', '$1/\\pi(x)$', { dot: true }]]);
        v.readout(() => `Exact mean return times $\\mathbb E_xT_x^+$ (first-step analysis): $${vtex(P.map((_, x) => meanReturn(P, x)), 3)}$ versus $1/\\pi=${vtex(pi.map((p) => 1 / p), 3)}$.\nSimulated: $${vtex(sim, 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3', kind: 'Theorem', name: 'Finite irreducible chains have a stationary distribution',
      statement: String.raw`Let $P$ be an irreducible transition matrix on a finite state set $S$ and fix $x\in S$. Define
$$\nu(y)=\mathbb E_x\Big[\sum_{n=0}^{T_x^+-1}\mathbf 1\{X_n=y\}\Big],$$
the expected number of visits to $y$ during one excursion from $x$ (so $\nu(x)=1$). Then $\nu(y)<\infty$, $\nu P=\nu$, and $\pi=\nu/\sum_y\nu(y)$ is a stationary distribution, with $\sum_y\nu(y)=\mathbb E_xT_x^+$. The choice of $x$ does not matter.`,
      idea: String.raw`Finiteness and irreducibility give $\mathbb E_xT_x^+<\infty$ (the chain is recurrent, 3.4, and hitting times in a finite irreducible chain have geometric tails), so $\nu$ has finite total mass. To see $\nu P=\nu$, count visits to $z$ at times $n\ge 1$ during the excursion by conditioning on where the chain was one step earlier; the Markov property turns this into $\sum_y\nu(y)p_{yz}$, and the visit at time $T_x^+$ replaces the visit at time $0$ when $z=x$. Normalising yields $\pi$; combined with Kac's formula (4.2) the normalising constant is the mean return time.`,
      caption: String.raw`Choose a base state $x$. Left: the expected number of visits to each state per excursion from $x$, simulated (blue bars) against the exact solution of the linear system (black dots); the bar at $x$ itself is $1$. Right: the normalised measure $\nu/\mathbb E_xT_x^+$ compared with the stationary distribution found directly from $\pi P=\pi$ (green dots). Change the base state and the left picture changes but the right one cannot.`,
      deps: ['stoch-4.2'], refs: ['LPW §1.5'], tags: ['stationary distribution', 'excursions'],
      viz(v) {
        const kind = v.select('chain', CHAIN_OPTS, 'weather', { onChange: () => rebuild() });
        const base = v.slider('base state $x$', 0, 4, 0, { int: true, step: 1, onChange: () => rebuild() });
        let seed = 3; v.button('new random chain', () => { seed++; kind.value = 'random'; rebuild(); });
        const s1 = v.stage({ x: [-0.6, 4.6], y: [0, 3], axes: 'box', gutter: true, height: 300, xlabel: 'state $y$', ylabel: 'visits per excursion', title: '$\\nu(y)$: expected visits during an excursion from $x$' });
        const s2 = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'state $y$', ylabel: 'probability', title: '$\\nu/\\sum\\nu$ against the eigenvector $\\pi$' });
        let P, pi, x, sim, ex, Z;
        function rebuild() {
          P = presetChain(kind.value, seed * 13 + 1, v).P; pi = stationary(P); const n = P.length;
          base.el.hidden = false; x = Math.min(Math.round(base.value), n - 1);
          const R = v.rng(seed * 31 + x);
          sim = simExcursions(P, x, 4000, R).vis; ex = excursionMeasure(P, x); Z = ex.reduce((a, b) => a + b, 0);
          s1.setView([-0.6, n - 0.4], [0, Math.max(...ex, ...sim) * 1.2]); s2.setView([-0.6, n - 0.4], [0, Math.max(...pi) * 1.2]); v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.bars(sim, { x0: 0, dx: 1, color: (_, i) => (i === x ? 'orange' : 'accent') });
          ex.forEach((e, i) => s1.dot(i, e, { r: 5, color: 'ink' }));
          s2.bars(ex.map((e) => e / Z), { x0: 0, dx: 1, color: 'accent' });
          pi.forEach((p, i) => s2.dot(i, p, { r: 5, color: 'green' }));
        });
        v.legend([['accent', 'simulation (4000 excursions)', { area: true }], ['ink', 'exact $\\nu(y)$', { dot: true }], ['green', '$\\pi(y)$', { dot: true }]]);
        v.readout(() => `Base state $x=${x}$: $\\sum_y\\nu(y)=${v.fix(Z, 4)}=\\mathbb E_xT_x^+$, and $1/\\pi(x)=${v.fix(1 / pi[x], 4)}$.  $\\|\\nu/\\sum\\nu-\\pi\\|_1=${v.sci(l1(ex.map((e) => e / Z), pi), 2)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4', kind: 'Theorem', name: 'Uniqueness of the stationary distribution',
      statement: String.raw`If $P$ is an irreducible transition matrix on a finite state set, it has exactly one stationary distribution. More generally, a chain with $k$ closed communicating classes has stationary distributions exactly the convex combinations $\sum_{c}t_c\,\pi^{(c)}$ of the stationary distributions $\pi^{(c)}$ of those classes (each supported on its class), a $(k-1)$-dimensional family; transient states carry no mass.`,
      idea: String.raw`A right eigenvector of $P$ for the eigenvalue $1$ is a harmonic function (2.9). For an irreducible finite chain the maximum principle forces it to be constant, so $\ker(P-I)$ is one-dimensional; a matrix and its transpose have kernels of equal dimension, so the left kernel $\{\pi:\pi P=\pi\}$ is a line, and positive normalised solutions on that line are unique. With several closed classes the harmonic functions are the functions constant on each class (and fixed by hitting probabilities elsewhere), giving a $k$-dimensional right kernel and hence a $k$-dimensional space of stationary vectors.`,
      caption: String.raw`Five states: $\{1,2\}$ and $\{3,4\}$ are closed classes (blue and orange), and state 5 is transient. With the leak $\varepsilon=0$ every mixture $\pi(t)=(t\pi^A,(1-t)\pi^B,0)$ is stationary: the residual $\|\pi P-\pi\|_1$ (right) is zero for *all* $t$. Turn on the leak $\varepsilon>0$, which joins the two classes into one, and the flat zero collapses to a single point $t^*$: uniqueness. The orange tick (at $\varepsilon=0$) marks where a chain started at state 5 ends up on average, which depends on $a$.`,
      deps: ['stoch-4.1', 'stoch-2.9'], refs: ['LPW §1.5'], tags: ['stationary distribution', 'uniqueness', 'closed classes'],
      viz(v) {
        const eps = v.slider('leak $\\varepsilon$ joining the classes', 0, 0.3, 0, { step: 0.005 });
        const t = v.slider('mixture weight $t$ on the first class', 0, 1, 0.5, { step: 0.01 });
        const a = v.slider('from state 5: probability $a$ to enter the first class', 0, 1, 0.3, { step: 0.05 });
        const build = (e, aa) => [
          [0.3, 0.7, 0, 0, 0], [0.6 * (1 - e), 0.4 * (1 - e), e, 0, 0], [0, 0, 0.5, 0.5, 0], [e, 0, 0.2 * (1 - e), 0.8 * (1 - e), 0], [aa, 0, 1 - aa, 0, 0],
        ];
        const piA = [6 / 13, 7 / 13, 0, 0, 0], piB = [0, 0, 2 / 7, 5 / 7, 0];
        const mix = (tt) => piA.map((p, i) => tt * p + (1 - tt) * piB[i]);
        const s1 = v.stage({ x: [-0.9, 6.9], y: [-0.2, 3.2], axes: false, equal: true, height: 300, title: 'the chain', weight: 1.1 });
        const s2 = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'state', ylabel: 'mass', xticks: [[0, '1'], [1, '2'], [2, '3'], [3, '4'], [4, '5']], title: '$\\pi(t)$ (a candidate)' });
        const s3 = v.stage({ x: [0, 1], y: [0, 0.3], axes: 'box', gutter: true, height: 300, xlabel: 'mixture weight $t$', ylabel: '$\\|\\pi(t)P-\\pi(t)\\|_1$', title: 'the residual: where is $\\pi P=\\pi$?' });
        const pos = [[0.9, 2.4], [2.4, 2.4], [3.9, 2.4], [5.4, 2.4], [3.15, 0.5]];
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 16, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: [] });
        const resid = (tt, P) => l1(mix(tt), vecP(mix(tt), P));
        v.render(() => {
          const P = build(eps.value, a.value);
          G.set({ directed: true, layout: 'none', draggable: false, r: 16, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: edgesOf(P) });
          G.draw({ nodeColor: (i) => (i < 2 ? 'accent' : i < 4 ? 'orange' : 'muted') });
          s2.bars(mix(t.value), { x0: 0, dx: 1, color: (_, i) => (i < 2 ? 'accent' : i < 4 ? 'orange' : 'muted') });
          let rmax = 0.02; for (let i = 0; i <= 100; i++) rmax = Math.max(rmax, resid(i / 100, P)); s3.setView([0, 1], [-0.02 * rmax, rmax * 1.15]);
          s3.fn((tt) => resid(tt, P), { color: 'ink', width: 2, n: 200, domain: [0, 1] });
          s3.dot(t.value, resid(t.value, P), { r: 6, color: 'gold' });
          if (eps.value < 1e-9) s3.vline(a.value, { color: 'orange', dash: true });
          let best = 0, bv = 9; for (let i = 0; i <= 1000; i++) { const r = resid(i / 1000, P); if (r < bv) { bv = r; best = i / 1000; } }
          s3.dot(best, bv, { r: 6, color: 'green', hollow: true });
        });
        v.readout(() => {
          const P = build(eps.value, a.value), r = resid(t.value, P);
          return eps.value < 1e-9
            ? `$\\varepsilon=0$: two closed classes, so *every* $t$ solves $\\pi P=\\pi$ (residual $${v.sci(r + 1e-16, 2)}$). A chain started at state 5 spends a long-run fraction $a=${v.fix(a.value, 2)}$ of time in the first class.`
            : `$\\varepsilon=${v.fix(eps.value, 3)}$: the chain on $\\{1,2,3,4\\}$ is irreducible, so only one $t$ gives residual $0$ (green ring); at the current $t$ the residual is $${v.fix(r, 3)}$.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5', kind: 'Theorem', name: 'Positive recurrence ⇔ an invariant distribution exists',
      statement: String.raw`Let $P$ be an irreducible transition matrix on a countable state space. The following are equivalent: (i) some state is positive recurrent; (ii) every state is positive recurrent, i.e. $\mathbb E_xT_x^+<\infty$ for all $x$; (iii) $P$ has a stationary distribution $\pi$. In that case $\pi$ is unique and $\pi(x)=1/\mathbb E_xT_x^+$. Irreducible recurrent chains always have an invariant *measure* (unique up to scaling), but it is summable exactly in case (iii).`,
      idea: String.raw`Positive recurrence is a class property (3.3 and its proof), so (i) and (ii) agree. If $P$ is recurrent, the excursion measure $\nu$ of 4.3 is invariant with total mass $\mathbb E_xT_x^+$, so it normalises to a distribution iff $x$ is positive recurrent. Conversely if $\pi$ exists, Kac's formula (4.2) gives $\mathbb E_xT_x^+=1/\pi(x)<\infty$. For transient irreducible chains no invariant distribution can exist, because an invariant distribution forces $\mathbb E_xT_x^+<\infty$.`,
      caption: String.raw`A reflecting walk on $\{0,1,2,\dots\}$: up with probability $p$, down with $q=1-p$, staying put when it tries to step below $0$. Left: the invariant measure $(p/q)^n$ and its partial sums (log scale); the sum converges iff $p<\tfrac12$. Right: the running average of simulated return times to $0$ (each excursion capped at 4000 steps). For $p<\tfrac12$ it settles on $\mathbb E_0T_0^+=1/\pi_0=q/(q-p)$; at $p=\tfrac12$ (null recurrence) and above it keeps drifting upwards.`,
      deps: ['stoch-4.2', 'stoch-3.7'], refs: ['Norris §1.7'], tags: ['positive recurrence', 'invariant measure', 'reflecting walk'],
      viz(v) {
        const p = v.slider('up-probability $p$', 0.15, 0.85, 0.35, { step: 0.01, onChange: () => rebuild() });
        let seed = 1; v.button('resample', () => { seed++; rebuild(); });
        const s1 = v.stage({ x: [-1, 60], y: [1e-4, 1e5], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'site $n$ / cut-off $N$', ylabel: '$(p/q)^n$ and $\\sum_{n\\le N}(p/q)^n$', title: 'the invariant measure' });
        const s2 = v.stage({ x: [0, 600], y: [0.8, 5000], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'number of excursions', ylabel: 'running mean return time', title: 'mean return time to 0' });
        let run, r;
        const CAP = 4000, M = 600;
        function rebuild() {
          const R = v.rng(seed * 977 + Math.round(p.value * 1000)), pp = p.value; r = pp / (1 - pp);
          let tot = 0, notBack = 0; run = [];
          for (let e = 1; e <= M; e++) {
            let T = 1;
            if (R() < pp) { let x = 1; T = 1; while (x > 0 && T < CAP) { x += R() < pp ? 1 : -1; T++; } if (x > 0) notBack++; }
            tot += T; run.push([e, tot / e]);
          }
          run.notBack = notBack; v.invalidate();
        }
        rebuild();
        v.render(() => {
          const N = 60;
          const ms = Array.from({ length: N }, (_, n) => [n, r ** n]); s1.path(ms, { color: 'accent', width: 1.5 }); ms.forEach(([n, m]) => s1.dot(n, m, { r: 2.5, color: 'accent' }));
          let sum = 0; const pts = []; for (let n = 0; n < N; n++) { sum += r ** n; pts.push([n, sum]); }
          s1.path(pts, { color: 'orange', width: 2 });
          if (r < 1) s1.hline(1 / (1 - r), { color: 'green', dash: true });
          s2.path(run, { color: 'accent', width: 1.6 });
          if (r < 1) s2.hline(1 / (1 - r), { color: 'green', dash: true });
        });
        v.legend([['accent', 'measure $(p/q)^n$', { dot: true }], ['orange', 'partial sums'], ['green', '$1/\\pi_0=q/(q-p)$', { dash: true }]]);
        v.readout(() => r < 1 - 1e-9
          ? `$p/q=${v.fix(r, 3)}<1$: the measure is summable, $\\sum(p/q)^n=${v.fix(1 / (1 - r), 3)}$, so $\\pi_0=${v.fix(1 - r, 3)}$ and $\\mathbb E_0T_0^+=${v.fix(1 / (1 - r), 3)}$ — positive recurrent.`
          : `$p/q=${v.fix(r, 3)}\\ge1$: the invariant measure has infinite mass, so there is no invariant distribution. ${Math.abs(r - 1) < 1e-9 ? 'The walk is recurrent but null: return times are finite with infinite mean.' : 'The walk is transient.'} ${run.notBack} of 600 excursions had not returned within ${4000} steps.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6', kind: 'Theorem', name: 'Perron–Frobenius theorem',
      statement: String.raw`Let $A$ be a square matrix with nonnegative entries that is irreducible (the digraph with an edge $i\to j$ when $a_{ij}>0$ is strongly connected). Then its spectral radius $\rho>0$ is itself an eigenvalue; it is a simple root of the characteristic polynomial; and it has left and right eigenvectors with strictly positive entries (unique up to scaling, and no other eigenvalue has a nonnegative eigenvector). If $A$ is **primitive** ($A^m>0$ entrywise for some $m$, e.g. $A>0$) then $|\lambda|<\rho$ for every other eigenvalue, so $\rho^{-n}xA^n$ converges to a multiple of the left Perron vector for every $x\ge0$, $x\ne0$. If $A$ has period $h>1$, exactly $h$ eigenvalues have modulus $\rho$, namely $\rho e^{2\pi ik/h}$. For a stochastic matrix $\rho=1$, the right vector is $\mathbf 1$ and the left vector is $\pi$.`,
      idea: String.raw`For a positive matrix, $A$ maps the simplex of nonnegative vectors (after normalising) continuously into its interior, so Brouwer's fixed point theorem gives a positive eigenvector; strict positivity of the image forces $\rho$ to dominate all other eigenvalues: if $|\lambda|=\rho$ with eigenvector $z$ then $A|z|\ge|Az|=\rho|z|$ and equality forces $z$ to be a multiple of a positive vector, hence $\lambda=\rho$. Irreducible matrices are treated by passing to $(I+A)^{n-1}>0$, and the periodic case by splitting into cyclic classes (1.6, 1.7). For Markov chains this is the existence-and-uniqueness half of the stationary theory.`,
      caption: String.raw`Left: the map $x\mapsto xA/\|xA\|_1$ on the triangle of laws, applied $k$ times to eight starting points (trails). Right: the spectrum of $A$ in the plane with the circle of radius $\rho$. **Positive** and **primitive** matrices pull every trail to one point, the left Perron vector, because the other eigenvalues sit strictly inside the circle. The **cyclic** matrix has three eigenvalues on the circle and the trails never converge; they rotate. The **reducible** matrix is outside the theorem: eigenvalues $3,2,1$ are real and separate, but the Perron vector has a zero entry.`,
      deps: ['stoch-1.7', 'ladr-5.19'], refs: ['Grimmett–Stirzaker §6.6'], credit: 'O. Perron, 1907 (positive matrices); G. Frobenius, 1908–1912 (nonnegative matrices)',
      links: { doi: 'https://doi.org/10.1007/bf01449896' }, tags: ['eigenvalues', 'positive matrices', 'spectral radius'],
      viz(v) {
        const MATS = {
          positive: [[1, 4, 1], [2, 1, 5], [5, 1, 2]],
          primitive: [[0, 1, 1], [1, 0, 2], [3, 1, 0]],
          cyclic: [[0, 2, 0], [0, 0, 1], [3, 0, 0]],
          reducible: [[2, 1, 0], [0, 3, 0], [1, 1, 1]],
        };
        const kind = v.select('matrix $A$', [{ value: 'positive', label: 'positive' }, { value: 'primitive', label: 'primitive, with zeros' }, { value: 'cyclic', label: 'cyclic (period 3)' }, { value: 'reducible', label: 'reducible' }], 'positive');
        const k = v.slider('iterations $k$', 0, 40, 12, { int: true, step: 1 });
        const s1 = v.stage({ x: [-0.15, 1.15], y: [-0.12, 1.0], equal: true, axes: false, height: 330, title: '$x\\mapsto xA/\\|xA\\|_1$ on the simplex' });
        const s2 = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: true, height: 330, title: 'spectrum of $A$ (scaled by $1/\\rho$)' });
        const starts = [[0.9, 0.05, 0.05], [0.05, 0.9, 0.05], [0.05, 0.05, 0.9], [0.5, 0.4, 0.1], [0.1, 0.5, 0.4], [0.4, 0.1, 0.5], [0.34, 0.33, 0.33], [0.6, 0.2, 0.2]];
        const step = (x, A) => { const y = vecP(x, A), s = y[0] + y[1] + y[2]; return y.map((t) => t / s); };
        v.render(() => {
          const A = MATS[kind.value];
          s1.path([...SIMP, SIMP[0]], { color: 'muted', width: 1.6 });
          starts.forEach((x0, si) => {
            const orbit = [x0]; for (let j = 0; j < k.value; j++) orbit.push(step(orbit[j], A));
            const col = STATE_COL[si];
            s1.path(orbit.map(simplexXY), { color: col, width: 1.3, alpha: 0.6 });
            const [ex, ey] = simplexXY(orbit[orbit.length - 1]); s1.dot(ex, ey, { r: 4.5, color: col });
            const [bx, by] = simplexXY(x0); s1.dot(bx, by, { r: 3, color: col, hollow: true });
          });
          const ev = v.M.eig(A).values, rho = ev[0].abs();
          const At = A[0].map((_, j) => A.map((r) => r[j]));
          let w = [1 / 3, 1 / 3, 1 / 3]; if (kind.value !== 'cyclic') for (let j = 0; j < 400; j++) w = step(w, A);
          if (kind.value !== 'cyclic') { const [px, py] = simplexXY(w); s1.dot(px, py, { r: 9, color: 'ink', hollow: true, label: 'Perron', labelPos: 'ne' }); }
          s2.circle(0, 0, 1, { color: 'muted', dash: true });
          ev.forEach((z) => s2.dot(z.re / rho, z.im / rho, { r: 6, color: Math.abs(z.abs() - rho) < 1e-6 * rho ? 'green' : 'accent' }));
          void At;
        });
        v.legend([['green', 'eigenvalue on the circle $|\\lambda|=\\rho$', { dot: true }], ['accent', 'inside', { dot: true }]]);
        v.readout(() => {
          const A = MATS[kind.value], ev = v.M.eig(A).values, rho = ev[0].abs();
          const on = ev.filter((z) => Math.abs(z.abs() - rho) < 1e-6 * rho).length;
          return `$A=\\begin{pmatrix}${A.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}$, spectral radius $\\rho=${v.fix(rho, 4)}$, eigenvalue moduli $${ev.map((z) => v.fix(z.abs(), 3)).join(',\\ ')}$: **${on} on the circle** — ${kind.value === 'cyclic' ? 'imprimitive, no convergence' : kind.value === 'reducible' ? 'not irreducible: theorem does not apply' : 'primitive, trails converge'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7', kind: 'Theorem', name: 'Convergence theorem',
      statement: String.raw`Let $P$ be an irreducible and aperiodic transition matrix on a finite state space with stationary distribution $\pi$. Then there are constants $\alpha\in(0,1)$ and $C>0$ such that
$$\max_{x}\ \big\|P^{t}(x,\cdot)-\pi\big\|_{\mathrm{TV}}\le C\alpha^{t}\qquad(t\ge0).$$
In particular $\Pr_\lambda(X_t=y)\to\pi(y)$ for every initial law $\lambda$ and every $y$. (For countable state spaces an irreducible aperiodic chain with an invariant distribution still satisfies $\Pr(X_t=y)\to\pi(y)$, but no rate is guaranteed.)`,
      idea: String.raw`By 1.7 some power $P^r$ has all entries positive, so $P^r(x,y)\ge\delta\pi(y)$ for some $\delta>0$ and all $x,y$; this lets us write $P^r=(1-\delta)\Pi'+\delta\Pi$ with $\Pi$ the matrix all of whose rows equal $\pi$, and the remainder $\Pi'$ stochastic. Iterating gives $P^{kr}=(1-(1-\delta)^k)\Pi+(1-\delta)^k\Pi'_k$, hence geometric decay of the distance. Existence and uniqueness of $\pi$ are 4.3 and 4.4. For a diagonalisable chain the best rate is the second-largest eigenvalue modulus, $\alpha=\max_{i\ge2}|\lambda_i|$.`,
      caption: String.raw`Coloured curves: $\|P^t(x,\cdot)-\pi\|_{\mathrm{TV}}$ for each start state $x$ on a logarithmic scale; they fall like a straight line, the dashed black line being $|\lambda_2|^t$. Bars show the distribution $P^t(x_0,\cdot)$ (the start $x_0$ and time $t$ are yours to choose) against $\pi$. The *two rooms* chain has a narrow door, so $|\lambda_2|$ is close to $1$ and convergence is slow.`,
      deps: ['stoch-4.4', 'stoch-1.7'], refs: ['LPW §4.3', 'Norris §1.8'], tags: ['convergence', 'total variation', 'aperiodicity'],
      viz(v) {
        const kind = v.select('chain', CHAIN_OPTS, 'weather', { onChange: () => rebuild() });
        const x0 = v.slider('start state $x_0$', 0, 4, 0, { int: true, step: 1 });
        const t = v.slider('time $t$', 0, 40, 5, { int: true, step: 1 });
        let seed = 3; v.button('new random chain', () => { seed++; kind.value = 'random'; rebuild(); });
        const T = 40;
        const s1 = v.stage({ x: [0, T], y: [1e-6, 1], ylog: true, axes: 'box', gutter: true, height: 310, xlabel: 'time $t$', ylabel: '$d_x(t)=\\|P^t(x,\\cdot)-\\pi\\|_{TV}$', title: 'distance to stationarity' });
        const s2 = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 310, xlabel: 'state', ylabel: 'probability', title: '$P^t(x_0,\\cdot)$ against $\\pi$' });
        let P, pi, Pw, lam2;
        function rebuild() {
          P = presetChain(kind.value, seed * 13 + 1, v).P; pi = stationary(P); Pw = powers(P, T);
          const ev = v.M.eig(P).values; lam2 = ev[1].abs();
          s2.setView([-0.6, P.length - 0.4], [0, 1]); v.invalidate();
        }
        rebuild();
        v.render(() => {
          const n = P.length, xs = Math.min(Math.round(x0.value), n - 1);
          for (let x = 0; x < n; x++) s1.path(Pw.map((M, tt) => [tt, Math.max(tv(M[x], pi), 1e-9)]), { color: STATE_COL[x], width: x === xs ? 2.6 : 1.4, alpha: x === xs ? 1 : 0.6 });
          s1.fn((tt) => lam2 ** tt, { color: 'ink', dash: true, width: 1.6, domain: [0, T], n: 40 });
          s1.vline(t.value, { color: 'gold' });
          s2.bars(Pw[t.value][xs], { x0: -0.14, dx: 1, barWidth: 0.3, color: STATE_COL[xs] });
          s2.bars(pi, { x0: 0.14, dx: 1, barWidth: 0.3, color: 'green' });
        });
        v.legend([['ink', '$|\\lambda_2|^t$', { dash: true }], ['green', '$\\pi$', { area: true }]]);
        v.readout(() => {
          const xs = Math.min(Math.round(x0.value), P.length - 1);
          return `$|\\lambda_2|=${v.fix(lam2, 4)}$.  At $t=${t.value}$ from $x_0=${xs}$: $\\|P^t(x_0,\\cdot)-\\pi\\|_{TV}=${v.fix(tv(Pw[t.value][xs], pi), 5)}$; worst start: ${v.fix(Math.max(...Pw[t.value].map((r) => tv(r, pi))), 5)}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8', kind: 'Proposition', name: 'Periodic chains oscillate forever',
      statement: String.raw`Let $P$ be irreducible with period $d>1$ and cyclic classes $C_0,\dots,C_{d-1}$ (so $P$ maps $C_r$ into $C_{r+1}$), with stationary distribution $\pi$. Then $P^t(x,\cdot)$ does not converge as $t\to\infty$ for any $x$: for $x\in C_0$,
$$P^{nd+r}(x,y)\longrightarrow d\,\pi(y)\ \ (y\in C_r),\qquad P^{nd+r}(x,y)=0\ \ (y\notin C_r).$$
Nevertheless the Cesàro averages $\frac1t\sum_{s=1}^tP^s(x,\cdot)$ converge to $\pi$, and the lazy chain $\tfrac12(I+P)$ is aperiodic and does converge. (Example: simple random walk on a bipartite graph alternates between the two sides.)`,
      idea: String.raw`The chain $P^d$ restricted to one cyclic class is irreducible and aperiodic (1.6, 1.7), so the convergence theorem 4.7 applies to it, with stationary law $\pi$ conditioned on the class, i.e. $d\pi$ on $C_r$ because each class carries mass $1/d$. Thus the sequence $P^t(x,\cdot)$ has $d$ different limit points. Averaging over a full period mixes these limit points into $\pi$. Laziness adds a loop at every state, so the gcd of return times becomes $1$ and 4.7 gives convergence.`,
      caption: String.raw`Random walk on a small graph; the walk is periodic exactly when the graph is bipartite (even cycle, path, cube). Bars: $P^t(0,\cdot)$ against $\pi$. Right: the distance of $P^t(0,\cdot)$ to $\pi$ (blue, never reaching $0$ if periodic) and of its running average (orange, which does). Add laziness $\lambda$ and the blue curve falls too; the odd cycle $C_7$ is aperiodic from the start.`,
      deps: ['stoch-4.7', 'stoch-1.6'], refs: ['Norris §1.8'], tags: ['periodicity', 'bipartite graphs', 'laziness'],
      viz(v) {
        const GR = {
          c6: Array.from({ length: 6 }, (_, i) => [(i + 5) % 6, (i + 1) % 6]),
          c7: Array.from({ length: 7 }, (_, i) => [(i + 6) % 7, (i + 1) % 7]),
          path: [[1], [0, 2], [1, 3], [2, 4], [3]],
          cube: Array.from({ length: 8 }, (_, i) => [i ^ 1, i ^ 2, i ^ 4]),
        };
        const kind = v.select('graph', [{ value: 'c6', label: 'cycle $C_6$' }, { value: 'c7', label: 'cycle $C_7$' }, { value: 'path', label: 'path $P_5$' }, { value: 'cube', label: 'cube $Q_3$' }], 'c6', { onChange: () => rebuild() });
        const lam = v.slider('laziness $\\lambda$', 0, 0.6, 0, { step: 0.05, onChange: () => rebuild() });
        const t = v.slider('time $t$', 0, 40, 6, { int: true, step: 1 });
        const T = 60;
        const s1 = v.stage({ x: [-0.6, 7.6], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'vertex', ylabel: 'probability', title: '$P^t(0,\\cdot)$ against $\\pi$' });
        const s2 = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'time $t$', ylabel: 'distance to $\\pi$ in TV', title: 'the sequence and its running average' });
        let P, pi, Pw, d, dist, cesaro;
        function rebuild() {
          const adj = GR[kind.value]; P = walkMatrix(adj, lam.value); pi = stationary(P); Pw = powers(P, T);
          const A = P.map((r) => r.map((x) => (x > 0 ? 1 : 0))); d = periodOf(A, 0);
          dist = Pw.map((M) => tv(M[0], pi));
          let acc = P.map(() => 0); cesaro = [tv(Pw[0][0], pi)];
          for (let s = 1; s <= T; s++) { acc = acc.map((a, j) => a + Pw[s][0][j]); cesaro.push(tv(acc.map((a) => a / s), pi)); }
          s1.setView([-0.6, P.length - 0.4], [0, 1]); v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.bars(Pw[t.value][0], { x0: -0.14, dx: 1, barWidth: 0.3, color: 'accent' });
          s1.bars(pi, { x0: 0.14, dx: 1, barWidth: 0.3, color: 'green' });
          s2.path(dist.map((y, i) => [i, y]), { color: 'accent', width: 2 });
          s2.path(cesaro.map((y, i) => [i, y]), { color: 'orange', width: 2 });
          s2.vline(t.value, { color: 'gold' });
        });
        v.legend([['accent', '$P^t(0,\\cdot)$'], ['orange', 'running average'], ['green', '$\\pi$', { area: true }]]);
        v.readout(() => `Period of the walk: **${d}**${d > 1 ? ' — the mass sits on one side at even $t$ and on the other at odd $t$' : ' — aperiodic, so convergence'}. At $t=${t.value}$: TV distance $${v.fix(dist[t.value], 4)}$; running average $${v.fix(cesaro[t.value], 4)}$. At $t=60$: $${v.fix(dist[T], 4)}$ and $${v.fix(cesaro[T], 4)}$.`);
      },
    },
  ],
};
