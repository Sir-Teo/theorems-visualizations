// Stochastic Processes — Chapter 1: Markov chains: definitions and examples (items 1.1–1.7; 1.8–1.14 in ch01-b.js)
import { gcd, matMul, matPow, cumRows, nextState, lazy, classes, periodOf, levels, patterns, stationary, ringPos, pfmt, edgesOf, rowNormalize, WEATHER, makeClock, STATE_COL } from './ch01.shared.js';


/** Example chains with their names (all rows sum to one). */
function preset(kind, seed, v) {
  if (kind === 'weather') return { names: WEATHER.names, P: WEATHER.P };
  if (kind === 'path') { // lazy reflecting walk on a path of four states
    return { names: ['0', '1', '2', '3'], P: [[0.5, 0.5, 0, 0], [0.25, 0.5, 0.25, 0], [0, 0.25, 0.5, 0.25], [0, 0, 0.5, 0.5]] };
  }
  if (kind === 'rooms') { // two rooms joined by a thin door
    return { names: ['A', 'B', 'C', 'D'], P: [[0.45, 0.5, 0.05, 0], [0.5, 0.4, 0.1, 0], [0, 0.1, 0.4, 0.5], [0, 0.05, 0.5, 0.45]] };
  }
  const R = v.rng(seed), n = 4;
  const P = rowNormalize(Array.from({ length: n }, () => Array.from({ length: n }, () => { const u = R(); return u < 0.25 ? 0 : (0.1 + R()) ** 2; })));
  return { names: ['a', 'b', 'c', 'd'], P };
}

export default {
  collection: 'stoch',
  chapter: 1,
  title: 'Markov chains: definitions and examples',
  summary: String.raw`A Markov chain forgets everything but its present state: the next step is drawn from a row of a transition matrix, and $n$ steps are the $n$-th matrix power. States group into communicating classes, and a period measures how rigidly returns are timed; for finite irreducible aperiodic chains some power of the matrix is strictly positive, a fact that rests on a number-theoretic lemma about sums. Random walks on graphs and groups, birth-and-death chains, the Ehrenfest urn and Markov's own text model are the running examples, and the chapter closes with the two papers that frame it: Markov's 1906 law of large numbers without independence and Kolmogorov's 1933 axioms.`,
  items: [
    // ───────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Markov chain and transition matrix',
      statement: String.raw`Let $S$ be a finite (or countable) set of states. A matrix $P=(p_{ij})_{i,j\in S}$ is a **transition matrix** (stochastic matrix) if $p_{ij}\ge 0$ and every row sums to one, $\sum_j p_{ij}=1$. A sequence of random variables $X_0,X_1,\dots$ with values in $S$ is a **Markov chain** with transition matrix $P$ and initial law $\lambda$ if $\Pr(X_0=i)=\lambda_i$ and
$$\Pr(X_{n+1}=j\mid X_0=i_0,\dots,X_{n-1}=i_{n-1},X_n=i)=p_{ij}$$
for all $n$ and all histories of positive probability: given the present, the future does not depend on the past.`,
      idea: String.raw`The definition packages a whole process into one matrix: row $i$ is the law of the next state when the chain stands at $i$. Multiplying the conditional probabilities along a path gives $\Pr(X_0=i_0,\dots,X_n=i_n)=\lambda_{i_0}p_{i_0i_1}\cdots p_{i_{n-1}i_n}$, so $(\lambda,P)$ determines every finite-dimensional law. Conversely, the transition probabilities can be read from data: the relative frequency of the jumps $i\to j$ among all visits to $i$ converges to $p_{ij}$ by the law of large numbers, which is what the second panel shows.`,
      caption: String.raw`A token hops along the arrows (arrow thickness is the probability). The table records how often each jump actually happened, as a fraction of the visits to its row; the small number in each cell is the true $p_{ij}$. Pick another chain, make it lazier, or draw a new random one, and watch the empirical rows settle onto the matrix.`,
      deps: [], refs: ['Norris §1.1', 'LPW §1.1'], tags: ['markov chains', 'transition matrix'],
      credit: 'A. A. Markov, 1906',
      viz(v) {
        const kinds = [{ value: 'weather', label: 'weather' }, { value: 'path', label: 'path' }, { value: 'rooms', label: 'two rooms' }, { value: 'random', label: 'random' }];
        const kind = v.select('chain', kinds, 'weather', { onChange: () => rebuild() });
        const lam = v.slider('laziness $\\lambda$', 0, 0.9, 0, { step: 0.05, onChange: () => rebuild() });
        const rate = v.slider('hops per second', 1, 2000, 120, { log: true, int: true });
        let seed = 3;
        v.button('new random chain', () => { seed++; kind.value = 'random'; rebuild(); });
        v.button('reset counts', () => { fresh(); });
        const s1 = v.stage({ x: [-1.7, 1.7], y: [-1.3, 1.6], axes: false, equal: true, height: 330, title: 'the chain' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'empirical $\\hat p_{ij}$ (small: true $p_{ij}$)' });
        let names, P, C, n, st;
        const pos = (k) => ringPos(k, 0.82).map(([x, y]) => [x * 1.5, y]);
        const G = v.graph(s1, { directed: true, layout: 'none', nodes: [{ id: 0, x: 0, y: 0 }], edges: [], draggable: true, r: 17 });
        const T = v.table(s2, { rows: 3, cols: 3, square: false, cellAspect: 1.05, maxCell: 66, size: 14 });
        const clk = makeClock();
        let R = v.rng(11);
        function fresh() { st = { x: 0, prev: -1, steps: 0, cnt: P.map(() => P.map(() => 0)), vis: P.map(() => 0) }; R = v.rng(11); clk.reset(); v.invalidate(); }
        function rebuild() {
          const pr = preset(kind.value, seed, v);
          names = pr.names; P = lazy(pr.P, lam.value); C = cumRows(P); n = P.length;
          const ps = pos(n);
          G.set({ directed: true, layout: 'none', r: 17,
            nodes: names.map((nm, i) => ({ id: i, label: nm, x: ps[i][0], y: ps[i][1], notePos: ps[i][1] < 0 ? 's' : 'n' })),
            edges: edgesOf(P) });
          fresh();
        }
        rebuild();
        const stepOnce = () => { const j = nextState(C, st.x, R()); st.cnt[st.x][j]++; st.vis[st.x]++; st.prev = st.x; st.x = j; st.steps++; };
        v.animate((t) => {
          const k = clk.due(t, rate.value);
          if (clk.restarted) fresh();
          for (let i = 0; i < k; i++) stepOnce();
          G.draw({
            nodeFill: (id) => (id === st.x ? 'gold' : null),
            nodeColor: (id) => STATE_COL[id % 8],
            nodeNote: (id) => (st.steps ? Math.round((100 * st.vis[id]) / st.steps) + '%' : null),
            edgeColor: (e) => (st.steps && e.from === st.prev && e.to === st.x ? 'gold' : 'muted'),
            edgeWidth: (e) => 1 + 5 * e.w + (st.steps && e.from === st.prev && e.to === st.x ? 1.5 : 0),
            edgeLabel: (e) => pfmt(e.w),
          });
          T.draw({
            rows: n, cols: n, rowLabels: names, colLabels: names, cornerLabel: 'from \\ to',
            value: (i, j) => (st.vis[i] ? st.cnt[i][j] / st.vis[i] : null),
            format: (x) => (x == null ? '' : x.toFixed(2)),
            sub: (i, j) => (P[i][j] > 0 ? 'p=' + pfmt(P[i][j]) : ''),
            fill: (i, j) => (st.vis[i] ? ['accent', 0.08 + 0.7 * (st.cnt[i][j] / st.vis[i])] : null),
            activeRow: st.steps ? st.prev : null, activeColor: 'gold',
          });
        }, { still: 9 });
        v.legend([['gold', 'token (current state)', { dot: true }], ['accent', 'empirical frequency']]);
        v.readout(() => {
          let err = 0, rows = 0;
          for (let i = 0; i < n; i++) if (st.vis[i] >= 1) { rows++; for (let j = 0; j < n; j++) err = Math.max(err, Math.abs(st.cnt[i][j] / st.vis[i] - P[i][j])); }
          const rs = P.map((r) => r.reduce((a, b) => a + b, 0));
          return `$n=${st.steps}$ hops, now at **${names[st.x]}**. Row sums of $P$: ${rs.map((x) => v.fix(x, 3)).join(', ')}.\n$\\max_{ij}|\\hat p_{ij}-p_{ij}| = ${rows ? v.fix(err, 3) : '-'}$ over the ${rows} visited rows.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2', kind: 'Theorem', name: 'Chapman–Kolmogorov: n-step transitions are matrix powers',
      statement: String.raw`Let $(X_n)$ be a Markov chain with transition matrix $P$ on a countable state space. Then for all $m,n\ge0$ and states $i,j$,
$$p^{(m+n)}_{ij}=\Pr(X_{m+n}=j\mid X_0=i)=\sum_k p^{(m)}_{ik}\,p^{(n)}_{kj},$$
and consequently $p^{(n)}_{ij}=(P^n)_{ij}$: the $n$-step transition matrix is the $n$-th power of $P$. If $\lambda$ is the initial law then $X_n$ has law $\lambda P^n$.`,
      idea: String.raw`Condition on the position $X_m=k$ at the intermediate time. The Markov property says the chain restarts from $k$ without remembering how it got there, so the two stretches contribute independent factors $p^{(m)}_{ik}$ and $p^{(n)}_{kj}$, and the law of total probability sums over $k$. The identity is exactly the rule for multiplying matrices; induction on $n$ with $P^{n}=P\cdot P^{n-1}$ identifies the $n$-step matrix with $P^n$.`,
      caption: String.raw`Thousands of independent chains are run for $n$ steps from the chosen start; bars are the histogram of where they end, dots are the row of $P^n$ computed by matrix multiplication (the vertical ticks are $\pm2$ standard errors). Move $n$, change the start, and use the split $m$ to check $P^{m+n}=P^mP^{n}$.`,
      deps: ['stoch-1.1'], refs: ['Norris §1.1'], tags: ['markov chains', 'matrix powers'],
      credit: 'S. Chapman 1928, A. N. Kolmogorov 1931',
      viz(v) {
        const MATS = {
          path: [[0.5, 0.5, 0, 0, 0], [0.25, 0.5, 0.25, 0, 0], [0, 0.25, 0.5, 0.25, 0], [0, 0, 0.25, 0.5, 0.25], [0, 0, 0, 0.5, 0.5]],
          cycle: [[0.1, 0.6, 0, 0, 0.3], [0.3, 0.1, 0.6, 0, 0], [0, 0.3, 0.1, 0.6, 0], [0, 0, 0.3, 0.1, 0.6], [0.6, 0, 0, 0.3, 0.1]],
          rooms: [[0.45, 0.5, 0.05, 0, 0], [0.5, 0.4, 0.1, 0, 0], [0, 0.1, 0.45, 0.45, 0], [0, 0, 0.45, 0.4, 0.15], [0, 0, 0, 0.15, 0.85]],
          random: null,
        };
        const kind = v.select('chain', [{ value: 'path', label: 'reflecting walk' }, { value: 'cycle', label: 'drifting cycle' }, { value: 'rooms', label: 'bottleneck' }, { value: 'random', label: 'random' }], 'cycle', { onChange: () => resim() });
        const n = v.slider('steps $n$', 0, 30, 4, { int: true, step: 1 });
        const m = v.slider('split $m$', 0, 30, 2, { int: true, step: 1 });
        const start = v.slider('start state', 0, 4, 0, { int: true, step: 1, onChange: () => resim() });
        const N = v.slider('chains', 200, 20000, 3000, { log: true, int: true, onChange: () => resim() });
        let seed = 5;
        v.button('resample', () => { seed++; resim(); });
        const s1 = v.stage({ x: [-0.7, 4.7], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'state $j$', ylabel: 'probability', title: 'where $N$ chains are after $n$ steps', xticks: [0, 1, 2, 3, 4] });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'the matrix $P^n$ (start row outlined)' });
        const T = v.table(s2, { rows: 5, cols: 5, size: 13, maxCell: 54, rowLabels: [0, 1, 2, 3, 4].map(String), colLabels: [0, 1, 2, 3, 4].map(String) });
        const K = 30;
        let P, C, paths, Nn, x0;
        function resim() {
          P = kind.value === 'random' ? (() => { const R = v.rng(100 + seed); return rowNormalize(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => (R() < 0.45 ? 0 : 0.1 + R())))); })() : MATS[kind.value];
          C = cumRows(P); Nn = N.value; x0 = start.value;
          const R = v.rng(seed * 7 + 1); paths = new Uint8Array(Nn * (K + 1));
          for (let c = 0; c < Nn; c++) { let x = x0; paths[c * (K + 1)] = x; for (let k = 1; k <= K; k++) { x = nextState(C, x, R()); paths[c * (K + 1) + k] = x; } }
          v.invalidate();
        }
        resim();
        let info = {};
        v.render(() => {
          const nn = n.value, Pn = matPow(P, nn), row = Pn[x0];
          const cnt = [0, 0, 0, 0, 0]; for (let c = 0; c < Nn; c++) cnt[paths[c * (K + 1) + nn]]++;
          const emp = cnt.map((c) => c / Nn);
          s1.bars(emp, { x0: 0, dx: 1, color: 'accent' });
          row.forEach((p, j) => { const se = Math.sqrt(p * (1 - p) / Nn); s1.line(j, Math.max(0, p - 2 * se), j, Math.min(1, p + 2 * se), { color: 'ink', width: 1.5 }); s1.dot(j, p, { color: 'green', r: 5 }); });
          const mm = Math.min(m.value, nn), A = matPow(P, mm), B = matPow(P, nn - mm), prod = matMul(A, B);
          let dif = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) dif = Math.max(dif, Math.abs(prod[i][j] - Pn[i][j]));
          T.draw({ value: (i, j) => Pn[i][j], format: (x) => (x < 0.0005 ? '0' : x.toFixed(2)), fill: (i, j) => ['green', 0.08 + 0.75 * Pn[i][j]], highlight: [[x0, 0], [x0, 1], [x0, 2], [x0, 3], [x0, 4]].map((c) => [...c, 'accent']), activeRow: x0, activeColor: 'accent' });
          info = { dif, tv: 0.5 * emp.reduce((a, b, j) => a + Math.abs(b - row[j]), 0), mm, nn };
        });
        v.legend([['accent', 'simulated frequency', { area: true }], ['green', 'row $x_0$ of $P^n$', { dot: true }]]);
        v.readout(() => `$n=${info.nn}$, $N=${Nn}$. Total variation between histogram and $P^n(${x0},\\cdot)$: **${v.fix(info.tv, 4)}** (about $\\sqrt{5/N}\\approx ${v.fix(Math.sqrt(5 / Nn), 3)}$ is pure sampling noise).\n$\\max_{ij}\\big|P^{${info.nn}}-P^{${info.mm}}P^{${info.nn - info.mm}}\\big|_{ij} = ${v.sci(info.dif, 2)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Random mapping representation',
      statement: String.raw`Let $P$ be a transition matrix on $S=\{0,\dots,k-1\}$. A **random mapping representation** of $P$ is a function $f:S\times[0,1]\to S$ with $\Pr\big(f(i,U)=j\big)=p_{ij}$ for $U$ uniform on $[0,1]$. For instance, with cumulative sums $c_{ij}=p_{i0}+\dots+p_{ij}$ one may take $f(i,u)=\min\{j:\ u<c_{ij}\}$. If $U_1,U_2,\dots$ are i.i.d. uniform and $X_{n}=f(X_{n-1},U_n)$, then $(X_n)$ is a Markov chain with transition matrix $P$ for any initial state; the same sequence $(U_n)$ can drive chains started anywhere simultaneously.`,
      idea: String.raw`Each row of $P$ cuts $[0,1]$ into consecutive intervals of lengths $p_{i0},p_{i1},\dots$; a single uniform draw lands in the interval of $j$ with probability exactly $p_{ij}$, so the update is a legitimate sample of row $i$. Since the draw is independent of the past, the Markov property holds. Nothing forces the chains to use separate randomness: feeding one stream $U_n$ to several chains leaves each marginally correct but couples them, which is how chains started apart are made to meet (the idea behind coupling and perfect sampling).`,
      caption: String.raw`Each row of the picture is the interval $[0,1]$ cut by that state's transition probabilities and coloured by the target state. A uniform draw (the vertical line) selects, in every row, where that state would go; the coloured marks are the chains, one started at each state. Step through: with *common* randomness the chains merge and stay merged; switch to independent draws and they wander separately, though each is still a correct chain.`,
      deps: ['stoch-1.1'], refs: ['LPW §1.2'], tags: ['coupling', 'simulation'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'weather', label: 'weather' }, { value: 'path', label: 'path' }, { value: 'rooms', label: 'two rooms' }], 'weather', { onChange: () => build() });
        const common = v.toggle('common randomness for all chains', true, { onChange: () => build() });
        let seed = 21;
        v.button('new random numbers', () => { seed++; build(); });
        const s1 = v.stage({ x: [-0.28, 1.14], y: [-0.7, 3.75], axes: false, height: 330, title: 'update rule $f(i,u)$: one row per state' });
        const s2 = v.stage({ x: [0, 24], y: [-0.5, 3.5], axes: 'box', gutter: true, xlabel: 'time $n$', ylabel: 'state', height: 330, title: 'the coupled chains', yticks: [0, 1, 2, 3] });
        const K = 24;
        let P, names, C, n, S, trails, meet;
        const CH = ['accent', 'orange', 'purple', 'teal'];
        function build() {
          const pr = preset(kind.value, 1, v); P = pr.P; names = pr.names; n = P.length; C = cumRows(P);
          const R = v.rng(seed);
          let xs = names.map((_, i) => i);
          const frames = [{ k: 0, xs: xs.slice(), us: null, nxt: null, note: String.raw`One chain per state, all started at time 0. Press ▶ to feed them uniform random numbers.` }];
          trails = [xs.slice()]; meet = null;
          for (let k = 1; k <= K; k++) {
            const u0 = R(), us = xs.map(() => (common.value ? u0 : R()));
            const nx = xs.map((x, c) => nextState(C, x, us[c]));
            frames.push({ k, xs: nx.slice(), prev: xs.slice(), us, u0: common.value ? u0 : null, nxt: nx, note: common.value ? `$U_${k}=${v.fix(u0, 3)}$ is used by every chain.` : `Each chain draws its own $U_${k}$.` });
            xs = nx; trails.push(xs.slice());
            if (meet === null && xs.every((x) => x === xs[0])) meet = k;
          }
          const frames2 = frames.map((f) => ({ ...f, merged: f.xs.every((x) => x === f.xs[0]) }));
          if (S) S.reset(frames2, { at: 'start' }); else S = v.steps({ frames: frames2, speed: 2, still: 8, counter: 'time' });
          v.invalidate();
        }
        build();
        const rowY = (i) => n - 1 - i + (4 - n) * 0.0; // state 0 on top
        v.render(() => {
          const f = S.frame, k = S.i;
          s1.setView([-0.28, 1.14], [-0.7, n + 0.05]);
          for (let i = 0; i < n; i++) {
            const y = n - 1 - i;
            s1.text(names[i], -0.1, y + 0.4, { size: 13, color: 'ink', align: 'center', baseline: 'middle' });
            let a = 0;
            for (let j = 0; j < n; j++) {
              const b = a + P[i][j];
              if (P[i][j] > 0) { s1.rect(a, y + 0.12, b, y + 0.68, { fill: STATE_COL[j], color: STATE_COL[j], fillAlpha: 0.5, width: 1 }); if (P[i][j] > 0.07) s1.text(names[j], (a + b) / 2, y + 0.4, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); }
              a = b;
            }
          }
          if (f.us) {
            if (f.u0 != null) s1.line(f.u0, -0.1, f.u0, n + 0.0, { color: 'gold', width: 2.2, dash: [5, 3] });
            f.prev.forEach((x, c) => { const y = n - 1 - x; if (f.u0 == null) s1.line(f.us[c], y + 0.05, f.us[c], y + 0.75, { color: CH[c % 4], width: 2.5 }); s1.dot(f.us[c], y + 0.4, { color: CH[c % 4], r: 4 }); });
          }
          const cur = f.us ? f.prev : f.xs;
          cur.forEach((x, c) => s1.dot(-0.2 + 0.0, n - 1 - x + 0.4 + (c - (n - 1) / 2) * 0.12, { color: CH[c % 4], r: 4.5 }));
          s1.text('0', 0, -0.35, { size: 11, color: 'muted', align: 'center' }); s1.text('1', 1, -0.35, { size: 11, color: 'muted', align: 'center' });
          s1.text('u', 0.5, -0.35, { size: 11, color: 'muted', align: 'center', math: true });
          for (let c = 0; c < n; c++) {
            const pts = []; for (let t = 0; t <= k; t++) pts.push([t, trails[t][c] + (c - (n - 1) / 2) * 0.08]);
            s2.path(pts, { color: CH[c % 4], width: 2 });
            s2.dot(k, trails[k][c] + (c - (n - 1) / 2) * 0.08, { color: CH[c % 4], r: 5 });
          }
          s2.setView([0, K], [-0.5, n - 0.5]);
          if (meet !== null && k >= meet) s2.vline(meet, { color: 'green', dash: true });
        });
        v.legend([['gold', 'common $U$', { dash: true }], ['accent', 'chain started at 0', { dot: true }], ['orange', 'chain started at 1', { dot: true }], ['purple', 'chain started at 2', { dot: true }]]);
        v.readout(() => `Time $${S.i}$: chains are at ${S.frame.xs.map((x) => names[x]).join(', ')}.\n${meet === null ? 'These chains have not all met within 24 steps.' : `All chains first coincide at time $${meet}$` + (common.value ? ' and then move together forever (same map, same input).' : ' (by chance; they need not stay together).')}`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4', kind: 'Theorem', name: 'The two-state chain',
      statement: String.raw`Let $P=\begin{pmatrix}1-\alpha&\alpha\\ \beta&1-\beta\end{pmatrix}$ with $\alpha+\beta>0$. Then for all $n\ge0$
$$P^n=\frac1{\alpha+\beta}\begin{pmatrix}\beta&\alpha\\ \beta&\alpha\end{pmatrix}+\frac{(1-\alpha-\beta)^n}{\alpha+\beta}\begin{pmatrix}\alpha&-\alpha\\ -\beta&\beta\end{pmatrix}.$$
Hence if $|1-\alpha-\beta|<1$ (i.e. unless $\alpha=\beta=1$), $p^{(n)}_{ij}\to\pi_j$ with $\pi=\big(\tfrac{\beta}{\alpha+\beta},\tfrac{\alpha}{\alpha+\beta}\big)$, geometrically fast at rate $|1-\alpha-\beta|^n$. For $\alpha=\beta=1$ the chain alternates and $P^n$ does not converge.`,
      idea: String.raw`$P$ has eigenvalues $1$ and $\lambda=1-\alpha-\beta$ (the trace is $2-\alpha-\beta$), with right eigenvectors $\mathbf1$ and $(\alpha,-\beta)^{\mathsf T}$. Decompose $P=\Pi+\lambda E$ with $\Pi$ the rank-one projection onto $\mathbf1$ along the left eigenvector $\pi$; since $\Pi E=E\Pi=0$ and $\Pi^2=\Pi$, $E^2=E$, the power is $P^n=\Pi+\lambda^nE$. This is Chapman–Kolmogorov in the simplest case where the matrix power can be computed by hand.`,
      caption: String.raw`Set the switching probabilities $\alpha$ and $\beta$. Left: the exact $P^n_{x_0,0}$ (line) and the simulated frequency of being in state 0 (dots) against the limit $\pi_0$ and the envelope $\pi_0\pm|\lambda|^n$. Right: the same error on a log scale, a straight line of slope $\log|\lambda|$ until it hits the noise floor of the simulation. Try $\alpha=\beta=1$ (no convergence) and $\alpha=\beta=0$ (two absorbing states).`,
      deps: ['stoch-1.2'], refs: ['Norris §1.1'], tags: ['markov chains', 'spectral'],
      viz(v) {
        const a = v.slider('$\\alpha$ (0→1)', 0, 1, 0.3, { step: 0.01, onChange: () => resim() });
        const b = v.slider('$\\beta$ (1→0)', 0, 1, 0.2, { step: 0.01, onChange: () => resim() });
        const x0 = v.select('start', [{ value: 0, label: 'state 0' }, { value: 1, label: 'state 1' }], 0, { onChange: () => resim() });
        let seed = 9; v.button('resample', () => { seed++; resim(); });
        const K = 30, N = 2500;
        const s1 = v.stage({ x: [0, K], y: [-0.02, 1.02], axes: 'box', gutter: true, height: 300, xlabel: 'step $n$', ylabel: '$\\Pr(X_n=0)$', title: 'probability of state 0' });
        const s2 = v.stage({ x: [0, K], y: [1e-6, 1.2], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'step $n$', ylabel: '$|P^n_{x_0 0}-\\pi_0|$', title: 'distance from the limit (log scale)' });
        let emp = [];
        function resim() {
          const R = v.rng(seed * 31 + 7), A = a.value, B = b.value, cnt = new Array(K + 1).fill(0);
          for (let c = 0; c < N; c++) { let x = x0.value; if (x === 0) cnt[0]++; for (let k = 1; k <= K; k++) { x = R() < (x === 0 ? A : B) ? 1 - x : x; if (x === 0) cnt[k]++; } }
          emp = cnt.map((c) => c / N); v.invalidate();
        }
        resim();
        let info = {};
        v.render(() => {
          const A = a.value, B = b.value, S = A + B, lam = 1 - A - B, st = x0.value;
          const pi0 = S > 0 ? B / S : st === 0 ? 1 : 0;
          const exact = [], err = [];
          let chk = 0;
          for (let n = 0; n <= K; n++) {
            const e = S > 0 ? pi0 + ((st === 0 ? 1 : 0) - pi0) * lam ** n : (st === 0 ? 1 : 0);
            exact.push([n, e]); err.push(Math.abs(e - pi0));
            if (n <= 12) chk = Math.max(chk, Math.abs(matPow([[1 - A, A], [B, 1 - B]], n)[st][0] - e));
          }
          s1.hline(pi0, { color: 'green', dash: true, width: 1.6 });
          if (S > 0) { const up = [], lo = []; for (let n = 0; n <= K; n++) { const d = Math.abs(lam) ** n * (st === 0 ? 1 - pi0 : pi0); up.push([n, Math.min(1, pi0 + d)]); lo.push([n, Math.max(0, pi0 - d)]); } s1.path(up, { color: 'orange', width: 1, dash: true }); s1.path(lo, { color: 'orange', width: 1, dash: true }); }
          s1.path(exact, { color: 'accent', width: 2.2 });
          s1.dots(exact.map(([n]) => [n, emp[n]]), { color: 'gold', r: 3.2 });
          const floor = 1e-6;
          const pts = err.map((e, n) => [n, Math.max(e, floor)]);
          s2.path(pts, { color: 'accent', width: 2.2 });
          s2.dots(emp.map((e, n) => [n, Math.max(Math.abs(e - pi0), floor)]), { color: 'gold', r: 3 });
          s2.hline(1 / Math.sqrt(N), { color: 'muted', dash: true });
          s2.text('sampling noise $\\approx 1/\\sqrt{N}$', K - 0.5, 1 / Math.sqrt(N) * 1.35, { size: 11, color: 'muted', align: 'right' });
          info = { lam, pi0, S, chk };
        });
        v.legend([['accent', 'exact $P^n$'], ['gold', `simulation, $N=${N}$`, { dot: true }], ['green', '$\\pi_0$', { dash: true }], ['orange', '$\\pi_0\\pm|\\lambda|^n$', { dash: true }]]);
        v.readout(() => info.S === 0 ? `$\\alpha=\\beta=0$: both states absorbing, $P=I$, nothing converges.` : `$\\lambda=1-\\alpha-\\beta=${v.fix(info.lam, 3)}$, $\\pi=(${v.fix(info.pi0, 3)},\\,${v.fix(1 - info.pi0, 3)})$. ${Math.abs(info.lam) >= 1 - 1e-9 ? 'Here $|\\lambda|=1$: the chain alternates deterministically and $P^n$ has no limit.' : `Error shrinks by the factor $|\\lambda|=${v.fix(Math.abs(info.lam), 3)}$ per step (a decade every ${v.fix(Math.log(10) / -Math.log(Math.abs(info.lam) || 1e-9), 1)} steps).`}\nFormula vs matrix power $P^n$ ($n\\le12$): max difference $${v.sci(info.chk, 2)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5', kind: 'Definition', name: 'Communicating classes and irreducibility',
      statement: String.raw`State $j$ is **accessible** from $i$ ($i\to j$) if $p^{(n)}_{ij}>0$ for some $n\ge0$, equivalently if the transition diagram has a directed path from $i$ to $j$; $i$ and $j$ **communicate** ($i\leftrightarrow j$) if $i\to j$ and $j\to i$. Communication is an equivalence relation, whose classes are the strongly connected components of the diagram. A class $C$ is **closed** if no arrow leaves it ($i\in C$, $i\to j$ implies $j\in C$), otherwise **open**. The chain is **irreducible** if there is a single class. States of open classes are left for good with probability one when $S$ is finite (they are *transient*).`,
      idea: String.raw`Reflexivity and symmetry of $\leftrightarrow$ are clear, transitivity is Chapman–Kolmogorov: $p^{(m+n)}_{ik}\ge p^{(m)}_{ij}p^{(n)}_{jk}>0$. So the state space splits into classes, and the quotient diagram on classes is acyclic: the chain can only move down this order, and once it enters a closed class it stays there. In a finite chain an open class is left at a positive rate each time it is visited, so it is left for good almost surely; the long-run time is spent only in closed classes.`,
      caption: String.raw`Edit the arrows (click a state, then another to add or remove an arrow; in *loop* mode click a state to toggle its self-loop; in *start* mode click to choose the starting state). Colours mark communicating classes, a green ring a closed class; each state moves to a uniformly chosen out-neighbour. The bars show where a 5000-step run spends its last 2000 steps: transient states fade out.`,
      deps: ['stoch-1.2'], refs: ['Norris §1.2', 'LPW §1.3'], tags: ['communicating classes', 'transience'],
      viz(v) {
        const mode = v.select('click mode', [{ value: 'edge', label: 'arrows' }, { value: 'loop', label: 'self-loops' }, { value: 'start', label: 'start state' }], 'edge');
        const pre = v.select('example', [{ value: 'ex', label: 'three classes' }, { value: 'ring', label: 'one ring' }, { value: 'chain', label: 'staircase' }], 'ex', { onChange: () => load() });
        const s1 = v.stage({ x: [-1.6, 1.6], y: [-1.35, 1.35], equal: true, axes: false, height: 340, title: 'transition diagram' });
        const s2 = v.stage({ x: [-0.6, 5.6], y: [0, 1], height: 340, axes: 'box', gutter: true, xlabel: 'state', ylabel: 'fraction of last 2000 steps', title: 'long-run occupancy', xticks: [0, 1, 2, 3, 4, 5].map((i) => [i, String(i + 1)]) });
        const pp = ringPos(6, 1.05).map(([x, y]) => [x * 1.3, y]);
        const EX = {
          ex: [[0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [4, 3], [4, 5], [5, 4], [5, 5]],
          ring: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
          chain: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3], [3, 4], [4, 4], [4, 5], [5, 5]],
        };
        const G = v.graph(s1, { directed: true, layout: 'none', r: 16, draggable: true, editable: { addEdge: true, deleteEdge: true, moveNode: true },
          nodes: pp.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: EX.ex.map(([f, t]) => ({ from: f, to: t })) });
        let start = 0, info = null;
        function load() { G.set({ directed: true, nodes: pp.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: EX[pre.value].map(([f, t]) => ({ from: f, to: t })), layout: 'none' }); start = 0; compute(); v.invalidate(); }
        G.onClick = (c) => {
          if (c.node == null && c.id == null) return false;
          const id = c.id != null ? c.id : c.node.id;
          if (mode.value === 'loop') { const e = G.edges.find((e) => e.from === id && e.to === id); if (e) G.removeEdge(e); else G.addEdge(id, id); compute(); v.invalidate(); return true; }
          if (mode.value === 'start') { start = id; compute(); v.invalidate(); return true; }
          return false;
        };
        G.onChange = () => { compute(); };
        function compute() {
          const n = 6, A = Array.from({ length: n }, () => new Array(n).fill(0));
          G.edges.forEach((e) => { A[e.from][e.to] = 1; });
          for (let i = 0; i < n; i++) if (!A[i].some((x) => x)) { A[i][i] = 1; }
          const P = rowNormalize(A), C = cumRows(P), R = v.rng(77), cl = classes(A);
          let x = start; const occ = new Array(n).fill(0), T = 5000, W = 2000;
          for (let t = 1; t <= T; t++) { x = nextState(C, x, R()); if (t > T - W) occ[x]++; }
          info = { A, cl, occ: occ.map((o) => o / W), n };
        }
        compute();
        const col = (i) => STATE_COL[info.cl.comp[i] % 8];
        const closedOf = (i) => info.cl.closed[info.cl.comp[i]];
        v.render(() => {
          const absorbing = (i) => info.A[i].filter((x) => x).length === 1 && info.A[i][i];
          G.draw({
            nodeColor: (i) => col(i),
            nodeFill: (i) => (closedOf(i) ? col(i) : i === start ? 'gold' : null),
            nodeRing: (i) => (i === start ? 'gold' : closedOf(i) ? 'green' : null),
            nodeNote: (i) => (info.occ[i] > 0 ? Math.round(info.occ[i] * 100) + '%' : null),
            dim: info.occ.map((o, i) => (o === 0 && !closedOf(i) ? i : null)).filter((i) => i !== null),
            edgeColor: (e) => (info.cl.comp[e.from] === info.cl.comp[e.to] ? col(e.from) : 'muted'),
            edgeWidth: (e) => (info.cl.comp[e.from] === info.cl.comp[e.to] ? 2.2 : 1.4),
          });
          s2.bars(info.occ, { x0: 0, dx: 1, color: (val, i) => col(i) });
          void absorbing;
        });
        v.legend([['green', 'ring: closed class (solid fill)', { dot: true }], ['muted', 'faded: transient, never visited late', { dot: true }], ['gold', 'start state', { dot: true }]]);
        v.readout(() => {
          const L = info.cl.members.map((m, c) => `{${m.map((i) => i + 1).join(',')}} ${info.cl.closed[c] ? 'closed' : 'open'}`).join(' · ');
          return `Classes: ${L}.\n${info.cl.count === 1 ? '**Irreducible**: every state reaches every other.' : `**${info.cl.count} classes**, not irreducible. The run from state ${start + 1} ends in ${info.occ.filter((o) => o > 0).length === 0 ? '-' : 'states ' + info.occ.map((o, i) => (o > 0 ? i + 1 : null)).filter((i) => i).join(', ')}.`} (States without an out-arrow get a self-loop.)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6', kind: 'Definition', name: 'Period and aperiodicity',
      statement: String.raw`The **period** of a state $i$ is $d(i)=\gcd\{n\ge1:\ p^{(n)}_{ii}>0\}$ (the gcd of the possible return times; undefined if the set is empty). Period is a class property: all states of a communicating class have the same period $d$. A class (or irreducible chain) with $d=1$ is **aperiodic**. For an irreducible chain of period $d$ the states split into $d$ **cyclic classes** $C_0,\dots,C_{d-1}$ and every step goes from $C_r$ to $C_{r+1\bmod d}$.`,
      idea: String.raw`If $i\leftrightarrow j$, choose $r,s$ with $p^{(r)}_{ij}>0$ and $p^{(s)}_{ji}>0$; every return time $n$ of $i$ yields the return times $r+s$ and $r+s+n$ of $j$, so $d(j)$ divides $r+s$ and then divides $n$, hence divides $d(i)$; by symmetry $d(i)=d(j)$. Fixing $i$ and putting $j$ into $C_r$ when $p^{(n)}_{ij}>0$ forces $n\equiv r\pmod d$ gives the cyclic classes. In the diagram, the period is the gcd of the lengths of all cycles.`,
      caption: String.raw`A directed cycle of length $L$ with an optional extra arc that closes a second cycle of length $m$ (from state $m-1$ back to $0$; $m=1$ is a self-loop at $0$). The right panel marks every $n\le40$ at which a return to $0$ in exactly $n$ steps is possible; the period is their gcd. Colours show the cyclic classes. Add a cycle of coprime length, or a single self-loop, and the period collapses to 1.`,
      deps: ['stoch-1.5', 'nt-1.2'], refs: ['LPW §1.3'], tags: ['period', 'gcd'],
      viz(v) {
        const L = v.slider('main cycle length $L$', 2, 9, 6, { int: true, step: 1, onChange: () => build() });
        const m = v.slider('extra cycle length $m$ (0 = none)', 0, 9, 0, { int: true, step: 1, onChange: () => build() });
        const s1 = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.4], equal: true, axes: false, height: 330, title: 'transition diagram (arrows are possible moves)' });
        const s2 = v.stage({ x: [0, 41], y: [0, 1.15], axes: 'box', gutter: true, height: 330, xlabel: 'time $n$', ylabel: '', title: 'can the chain be back at 0 at time $n$?', yticks: [] });
        const G = v.graph(s1, { directed: true, layout: 'none', r: 16, draggable: false, nodes: [{ id: 0, x: 0, y: 0 }], edges: [] });
        let A, ret, d, lv, firsts;
        const PAL = ['blue', 'orange', 'green', 'purple', 'pink', 'teal', 'gold', 'red', 'muted'];
        function build() {
          const l = L.value, ps = ringPos(l, 1.05).map(([x, y]) => [x * 1.4, y]);
          const E = []; for (let i = 0; i < l; i++) E.push([i, (i + 1) % l]);
          if (m.value >= 1 && m.value <= l && !(m.value === l)) E.push([m.value - 1, 0]);
          A = Array.from({ length: l }, () => new Array(l).fill(0)); E.forEach(([f, t]) => { A[f][t] = 1; });
          G.set({ directed: true, layout: 'none', r: 16, nodes: ps.map(([x, y], i) => ({ id: i, label: String(i), x, y })), edges: E.map(([f, t]) => ({ from: f, to: t, ...(f === m.value - 1 && t === 0 && m.value !== l && !(m.value === 1 && false) && !(f === l - 1) ? { color: 'orange' } : {}) })) });
          const pats = patterns(A, 40); ret = pats.map((P) => P[0][0]);
          d = periodOf(A, 0); lv = levels(A, 0);
          firsts = []; ret.forEach((r, i) => { if (r) firsts.push(i + 1); });
          v.invalidate();
        }
        build();
        v.render(() => {
          G.draw({ nodeColor: (i) => PAL[(lv[i] % d + d) % d % 9], nodeFill: (i) => PAL[(lv[i] % d + d) % d % 9], edgeColor: (e) => e.color || 'muted', edgeWidth: 2 });
          ret.forEach((r, i) => { if (r) s2.rect(i + 0.65, 0, i + 1.35, 1, { fill: 'green', color: 'green', fillAlpha: 0.75 }); else s2.rect(i + 0.8, 0, i + 1.2, 0.05, { fill: 'muted', color: 'muted', fillAlpha: 0.5 }); });
          if (d > 0) for (let k = d; k <= 40; k += d) s2.vline(k, { color: 'accent', alpha: 0.25, dash: true });
        });
        v.legend([['green', '$p^{(n)}_{00}>0$', { area: true }], ['accent', 'multiples of the period', { dash: true }]]);
        v.readout(() => {
          let g = 0; const run = firsts.slice(0, 6).map((n) => { g = gcd(g, n); return `${n}\\,[\\gcd=${g}]`; }).join(',\\ ');
          return `Return times to 0 (first few, with the running gcd): $${run || '\\varnothing'}$.\n**Period $d(0)=${d}$**${d === 1 ? ' (aperiodic)' : ''}. Cyclic classes: ${d ? Array.from({ length: d }, (_, r) => '{' + lv.map((x, i) => (x >= 0 && x % d === r ? i : null)).filter((i) => i !== null).join(',') + '}').join(' → ') : '-'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7', kind: 'Lemma', name: 'Aperiodic irreducible chains are eventually positive',
      statement: String.raw`Let $P$ be the transition matrix of a finite irreducible chain. If $P$ is aperiodic, there is $N$ such that $P^n$ has **all entries strictly positive** for every $n\ge N$. Equivalently $p^{(n)}_{ij}>0$ for all $i,j$ and all large $n$ (the chain is *regular*). If the period is $d>1$, this fails for every $n$.`,
      idea: String.raw`The set $R_i=\{n\ge1:p^{(n)}_{ii}>0\}$ is closed under addition (Chapman–Kolmogorov) and has gcd $1$, so by the number-theoretic lemma it contains every integer beyond some $n_i$ (for two generators $a,b$ coprime the last gap is the Frobenius number $ab-a-b$). Irreducibility gives, for each pair $(i,j)$, a path of some length $r_{ij}$; then $p^{(n)}_{ij}\ge p^{(r_{ij})}_{ij}\,p^{(n-r_{ij})}_{jj}>0$ once $n-r_{ij}>n_j$. Taking the maximum over the finitely many states gives a uniform $N$.`,
      caption: String.raw`The chain: a hub (state 0) with two loops of lengths $a$ and $b$ (so the return times to 0 are the sums of $a$'s and $b$'s). The grid is the zero pattern of $P^n$ (green = positive); step $n$ and watch it fill. Below: the fraction of positive entries against $n$, and along the bottom which $n$ are return times to 0 (green) and which are Frobenius gaps (red). The grid fills completely, from a time shortly after the last gap $ab-a-b$. Take $\gcd(a,b)>1$ and it never does.`,
      deps: ['stoch-1.6', 'nt-1.14'], refs: ['LPW §1.3'], tags: ['regular chains', 'frobenius'],
      viz(v) {
        const a = v.slider('loop length $a$', 1, 7, 3, { int: true, step: 1, onChange: () => build() });
        const b = v.slider('loop length $b$', 1, 7, 5, { int: true, step: 1, onChange: () => build() });
        const nn = v.slider('time $n$', 1, 40, 4, { int: true, step: 1 });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'zero pattern of $P^n$' });
        const s2 = v.stage({ x: [0, 41], y: [-0.17, 1.05], axes: 'box', gutter: true, height: 360, xlabel: 'time $n$', ylabel: 'fraction of entries $>0$', title: 'filling up' });
        let A, pats, frac, N0, S, ret0, frob, g;
        let T;
        function build() {
          const A_ = a.value, B_ = b.value, n = A_ + B_ - 1;
          A = Array.from({ length: n }, () => new Array(n).fill(0));
          // loop A: 0→1→…→a−1→0 ; loop B: 0→a→…→a+b−2→0 (a self-loop when the length is 1)
          const A1 = [0]; for (let i = 1; i < A_; i++) A1.push(i);
          const B1 = [0]; for (let i = 0; i < B_ - 1; i++) B1.push(A_ + i);
          for (let i = 0; i < A1.length; i++) A[A1[i]][A1[(i + 1) % A1.length]] = 1;
          for (let i = 0; i < B1.length; i++) A[B1[i]][B1[(i + 1) % B1.length]] = 1;
          pats = patterns(A, 40); S = n;
          frac = pats.map((P) => P.reduce((s, r) => s + r.filter((x) => x).length, 0) / (n * n));
          N0 = frac.findIndex((f) => f === 1) + 1; if (N0 === 0) N0 = null;
          ret0 = pats.map((P) => P[0][0]);
          g = gcd(A_, B_); frob = g === 1 ? A_ * B_ - A_ - B_ : null;
          T = v.table(s1, { rows: n, cols: n, size: 12, maxCell: 40, minCell: 8 });
          v.invalidate();
        }
        build();
        v.render(() => {
          const n = S, k = nn.value, P = pats[k - 1];
          T.draw({ rows: n, cols: n, value: (i, j) => (P[i][j] ? '' : '0'), fill: (i, j) => (P[i][j] ? ['green', 0.45] : ['red', 0.12]), textColor: () => 'muted', rowLabels: (i) => String(i), colLabels: (j) => String(j) });
          frac.forEach((f, i) => s2.rect(i + 0.6, 0, i + 1.4, f, { fill: i + 1 === k ? 'gold' : 'accent', color: i + 1 === k ? 'gold' : 'accent', fillAlpha: 0.7 }));
          ret0.forEach((r, i) => s2.rect(i + 0.6, -0.14, i + 1.4, -0.04, { fill: r ? 'green' : 'red', color: r ? 'green' : 'red', fillAlpha: r ? 0.6 : 0.8 }));
          if (frob !== null && frob >= 1) s2.vline(frob + 0.5, { color: 'red', dash: true, alpha: 0.7 });
          if (N0) s2.vline(N0 - 0.5, { color: 'green', dash: true });
        });
        v.legend([['green', 'positive entry / return to 0 possible', { area: true }], ['red', 'zero entry / Frobenius gap', { area: true }], ['gold', 'selected $n$', { area: true }]]);
        v.readout(() => {
          const P = pats[nn.value - 1], pos = P.reduce((s, r) => s + r.filter((x) => x).length, 0), tot = S * S;
          const gaps = ret0.map((r, i) => (r ? null : i + 1)).filter((x) => x !== null);
          const lastGap = gaps.length ? gaps[gaps.length - 1] : 0;
          return `$n=${nn.value}$: ${pos} of ${tot} entries of $P^n$ are positive. ${g === 1 ? `Hub return times $\\{n:p^{(n)}_{00}>0\\}$ = all sums of ${a.value} and ${b.value}; last gap $ab-a-b=${frob}$ (largest non-return time seen: ${lastGap || 'none'}).\n**$P^n>0$ for every $n\\ge ${N0 || '>40'}$.**` : `$\\gcd(a,b)=${g}>1$: the chain has period ${g}, $P^n$ keeps $\\ge$ a zero in every power, the pattern never fills.`}`;
        });
      },
    },
  ],
};
