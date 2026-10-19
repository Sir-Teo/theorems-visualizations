// Stochastic Processes — Chapter 4 (part b): items 4.9–4.16 (reversibility, ergodic theorem, tree theorem, PageRank, Ehrenfest)
import { STATE_COL, stationary, vecP, l1, tv, ringPos, cumRows, nextState, binom, reverseChain, arborescences, treeWeight, presetChain } from './ch04.shared.js';

import { AUDIT_CYCLES, cycleChain, cycleLogRatio, treeChain, ehrenfestBandTime, ehrenfestReturns } from './source-audit.shared.js';

const vtex = (x, d = 3) => '(' + x.map((t) => t.toFixed(d)).join(',\\ ') + ')';

/** Five-state ring chain: (1-rho) S + rho C, S the symmetric lazy walk on the pentagon, C the rotation i -> i+1. Stationary law uniform. */
const ringRot = (rho) => Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => {
  const s = j === i ? 0.4 : (j === (i + 1) % 5 || j === (i + 4) % 5) ? 0.3 : 0;
  return (1 - rho) * s + (j === (i + 1) % 5 ? rho : 0);
}));
/** Birth–death chain on 0..4 with fixed up/down probabilities. */
const BD = [[0.6, 0.4, 0, 0, 0], [0.2, 0.3, 0.5, 0, 0], [0, 0.3, 0.2, 0.5, 0], [0, 0, 0.4, 0.2, 0.4], [0, 0, 0, 0.7, 0.3]];

export default {
  collection: 'stoch',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9', kind: 'Definition', name: 'Detailed balance and reversibility',
      statement: String.raw`A transition matrix $P$ and a probability vector $\pi$ satisfy **detailed balance** if
$$\pi(x)\,p_{xy}=\pi(y)\,p_{yx}\qquad\text{for all states }x,y.$$
Then $\pi$ is stationary for $P$ (sum over $x$), and $P$ is called **reversible** with respect to $\pi$: a stationary chain $(X_n)$ has the same law as its time reversal $(X_{N-n})$. In words, at equilibrium the probability flow $\pi(x)p_{xy}$ along each edge is exactly balanced by the flow back along it.`,
      idea: String.raw`Stationarity only asks that the *total* inflow to each state equal its outflow, $\sum_x\pi(x)p_{xy}=\pi(y)$; detailed balance asks the much stronger statement that every pair of states exchanges equal flow. Summing detailed balance over $x$ gives $\pi P=\pi$ (4.1), which is why it is the standard way to *find* stationary distributions: guess $\pi$ from edge ratios and check one edge at a time. Chains that circulate (a net current around a cycle) are stationary without being reversible.`,
      caption: String.raw`Five states on a pentagon. Arrow thickness is the equilibrium flow $\pi(x)p_{xy}$; the bars on the right are the imbalance $|\pi(x)p_{xy}-\pi(y)p_{yx}|$ of each edge. With the rotation $\rho=0$ the two arrows of every edge have equal width and all bars vanish. Raise $\rho$ and a current starts to circulate: $\pi$ is still uniform (the chain stays stationary) but detailed balance fails on every edge. The birth–death chain is reversible for any parameters, because a chain on a path has no cycles around which a current could flow.`,
      deps: ['stoch-4.1'], refs: ['LPW §1.6', 'Norris §1.9'], tags: ['reversibility', 'detailed balance'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'ring', label: 'ring with rotation' }, { value: 'bd', label: 'birth–death chain' }], 'ring');
        const rho = v.slider('rotation $\\rho$', 0, 0.6, 0.3, { step: 0.01 });
        const s1 = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.5], axes: false, equal: true, height: 320, title: 'equilibrium flows $\\pi(x)p_{xy}$' });
        const s2 = v.stage({ x: [-0.6, 4.6], y: [0, 0.1], axes: 'box', gutter: true, height: 320, xlabel: 'edge $\\{x,x+1\\}$', ylabel: 'imbalance', xticks: [[0, '12'], [1, '23'], [2, '34'], [3, '45'], [4, '51']], title: '$|\\pi(x)p_{xy}-\\pi(y)p_{yx}|$', weight: 0.8 });
        const pos = ringPos(5, 1.05);
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 15, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: [] });
        const getP = () => (kind.value === 'ring' ? ringRot(rho.value) : BD);
        v.render(() => {
          rho.el.hidden = kind.value !== 'ring';
          const P = getP(), pi = stationary(P), n = 5;
          const edges = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && P[i][j] > 1e-12) edges.push({ from: i, to: j, w: pi[i] * P[i][j] });
          G.set({ directed: true, layout: 'none', draggable: false, r: 15, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges });
          G.draw({ edgeWidth: (e) => 0.8 + 55 * e.w, edgeColor: (e) => (e.to === (e.from + 1) % 5 ? 'orange' : 'accent'), nodeColor: 'muted' });
          const def = Array.from({ length: n }, (_, i) => { const j = (i + 1) % n; return Math.abs(pi[i] * P[i][j] - pi[j] * P[j][i]); });
          s2.setView([-0.6, 4.6], [0, Math.max(0.02, ...def) * 1.2]);
          s2.bars(def, { x0: 0, dx: 1, color: 'red' });
        });
        v.legend([['orange', 'flow $x\\to x+1$'], ['accent', 'flow $x\\to x-1$']]);
        v.readout(() => {
          const P = getP(), pi = stationary(P);
          let m = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) m = Math.max(m, Math.abs(pi[i] * P[i][j] - pi[j] * P[j][i]));
          return `$\\pi=${vtex(pi)}$, $\\|\\pi P-\\pi\\|_1=${v.sci(l1(pi, vecP(pi, P)), 2)}$.  Largest imbalance $\\max_{x,y}|\\pi(x)p_{xy}-\\pi(y)p_{yx}|=${v.fix(m, 4)}$ — ${m < 1e-9 ? '**reversible**' : '**not reversible**: a current circulates'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10', kind: 'Theorem', name: 'Kolmogorov’s cycle criterion',
      statement: String.raw`Let $P$ be an irreducible transition matrix on a finite state space. Then $P$ is reversible with respect to its stationary distribution if and only if, for every cycle $x_0\to x_1\to\cdots\to x_{k}=x_0$ of states,
$$p_{x_0x_1}\,p_{x_1x_2}\cdots p_{x_{k-1}x_0}\;=\;p_{x_0x_{k-1}}\,p_{x_{k-1}x_{k-2}}\cdots p_{x_1x_0},$$
the probability of going round the cycle equals that of going round it in the opposite direction. No knowledge of $\pi$ is needed to test it, and it suffices to check cycles without repeated vertices; if $p_{xy}>0$ then also $p_{yx}>0$ is required for reversibility.`,
      idea: String.raw`If detailed balance holds, multiplying $\pi(x_i)p_{x_ix_{i+1}}=\pi(x_{i+1})p_{x_{i+1}x_i}$ around a cycle makes all the $\pi$'s cancel and leaves the cycle identity. Conversely, fix a base state $o$ and *define* $\pi(x)=\pi(o)\prod p_{ox_1}\cdots p_{x_{m-1}x}/\prod p_{xx_{m-1}}\cdots p_{x_1o}$ along any path from $o$ to $x$; the cycle condition says exactly that the value does not depend on the path, and the resulting $\pi$ satisfies detailed balance on every edge (4.9).`,
      caption: String.raw`A complete weighted graph on five vertices with symmetric weights, to which a circulation $e^{\theta}$ is added around the triangle $1\to2\to3\to1$ (and $e^{-\theta}$ against it); rows are then renormalised. Choose a cycle: orange arrows go forward and red ones backward, labelled by their probabilities. The bars show $\log(\text{forward}/\text{backward})$ for six cycles. At $\theta=0$ all are zero; for $\theta\ne0$ the triangle $1\to2\to3$ has log-ratio $6\theta$, while the cycle $3\to4\to5$ stays balanced. These are six illustrative cycles; the criterion quantifies over every cycle, and one failure is enough.`,
      deps: ['stoch-4.9'], refs: ['Kolmogoroff (1936), §4, eqs. (9)–(10), p.159', 'Durrett 5.5.6'], credit: 'A. N. Kolmogorov, 1936', tags: ['reversibility', 'cycles'],
      links: { doi: 'https://doi.org/10.1007/BF01565412', source: 'https://gdz.sub.uni-goettingen.de/download/pdf/PPN235181684_0112/LOG_0015.pdf' },
      viz(v) {
        const CYC = AUDIT_CYCLES;
        const sel = v.select('cycle', CYC.map((c, i) => ({ value: String(i), label: c.map((x) => x + 1).join('→') })), '0');
        const th = v.slider('circulation $\\theta$', 0, 1.5, 0.6, { step: 0.05 });
        let seed = 4; v.button('new weights', () => { seed++; });
        const s1 = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.5], axes: false, equal: true, height: 320, title: 'the chosen cycle' });
        const s2 = v.stage({ x: [-0.6, 5.6], y: [-1, 1], axes: 'box', gutter: true, height: 320, xlabel: 'cycle', ylabel: '$\\log$ (forward / backward)', xticks: CYC.map((c, i) => [i, c.map((x) => x + 1).join('')]), title: 'cycle imbalance', weight: 0.9 });
        const pos = ringPos(5, 1.05);
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 15, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges: [] });
        const build = () => cycleChain(v.rng(seed * 7 + 1), th.value);
        const logRatio = cycleLogRatio;
        v.render(() => {
          const P = build(), c = CYC[+sel.value], k = c.length;
          const edges = [];
          for (let i = 0; i < k; i++) { const a = c[i], b = c[(i + 1) % k]; edges.push({ from: a, to: b, w: P[a][b], color: 'orange', width: 2.4 }, { from: b, to: a, w: P[b][a], color: 'red', width: 1.8, dash: true }); }
          G.set({ directed: true, layout: 'none', draggable: false, r: 15, nodes: pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), edges });
          G.draw({ edgeColor: (e) => e.color, edgeWidth: (e) => e.width, edgeDash: (e) => !!e.dash, edgeLabel: (e) => e.w.toFixed(3), nodeColor: (id) => (c.includes(id) ? 'ink' : 'faint') });
          const L = CYC.map((cc) => logRatio(P, cc)), m = Math.max(0.3, ...L.map(Math.abs));
          s2.setView([-0.6, 5.6], [-m * 1.2, m * 1.2]);
          s2.hline(0, { color: 'muted' });
          s2.bars(L, { x0: 0, dx: 1, color: (val, i) => (i === +sel.value ? 'orange' : Math.abs(val) < 1e-9 ? 'green' : 'accent') });
        });
        v.readout(() => {
          const P = build(), c = CYC[+sel.value], k = c.length;
          let f = 1, b = 1; for (let i = 0; i < k; i++) { f *= P[c[i]][c[(i + 1) % k]]; b *= P[c[(i + 1) % k]][c[i]]; }
          const pi = stationary(P); let m = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) m = Math.max(m, Math.abs(pi[i] * P[i][j] - pi[j] * P[j][i]));
          return `Cycle ${c.map((x) => x + 1).join('→')}: forward $${v.fix(f, 5)}$, backward $${v.fix(b, 5)}$ (ratio $${v.fix(f / b, 4)}$).  Detailed-balance defect of the whole chain: $${v.fix(m, 5)}$ — ${m < 1e-9 ? 'reversible' : 'not reversible'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11', kind: 'Theorem', name: 'Random walk on a graph: π proportional to degree',
      statement: String.raw`Let $G=(V,E)$ be a finite connected graph and let $P$ be the transition matrix of simple random walk, $p_{xy}=1/\deg x$ if $x\sim y$ and $0$ otherwise. Then the unique stationary distribution is
$$\pi(x)=\frac{\deg(x)}{2\,|E|},$$
and the walk is reversible with respect to it. For a weighted graph with edge weights $c_{xy}=c_{yx}$ the same holds with $\deg$ replaced by $c(x)=\sum_yc_{xy}$ and $2|E|$ by $\sum_xc(x)$. By the ergodic theorem (4.13) the fraction of time spent at $x$ tends to $\pi(x)$ even if the walk is periodic.`,
      idea: String.raw`Check detailed balance: $\pi(x)p_{xy}=\frac{\deg x}{2|E|}\cdot\frac1{\deg x}=\frac1{2|E|}$, which is symmetric in $x,y$ (4.9). So $\pi$ is stationary; it is a probability vector because $\sum_x\deg x=2|E|$ (every edge is counted twice); and connectedness makes the walk irreducible, so $\pi$ is unique (4.4). The result says that a random surfer is found at a vertex in proportion to the number of its links.`,
      caption: String.raw`Edit the graph (drag nodes; click empty space to add a node; click a node then another to add or delete an edge; Alt-click deletes). A walk of $n$ steps is run from node 1 and the blue bars show the fraction of time at each node, against the black dots $\deg x/2|E|$. Each node's note is its degree. Remove or add an edge and both change together. If you disconnect the graph, the comparison is restricted to the component of the start.`,
      deps: ['stoch-4.9', 'stoch-1.8'], refs: ['LPW §1.5'], tags: ['random walk on graphs', 'degree'],
      viz(v) {
        const n = v.slider('walk length $n$', 200, 50000, 10000, { log: true, int: true });
        let seed = 3; v.button('rerun walk', () => { seed++; });
        const s1 = v.stage({ x: [-0.3, 8.3], y: [-0.3, 5.6], axes: false, equal: true, height: 330, title: 'the graph (editable)' });
        const s2 = v.stage({ x: [-0.6, 6.6], y: [0, 0.4], axes: 'box', gutter: true, height: 330, xlabel: 'node', ylabel: 'fraction of time', title: 'visit frequency against $\\deg/2|E|$', weight: 0.9 });
        const nodes = [[1, 4.6], [3.2, 5.0], [5.4, 4.4], [7.2, 3.2], [5.6, 1.4], [3.0, 0.8], [1.2, 2.2]].map(([x, y], i) => ({ id: i + 1, label: String(i + 1), x, y }));
        const edges = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 1], [2, 6], [3, 5], [2, 7]];
        const G = v.graph(s1, { layout: 'none', editable: true, draggable: true, r: 15, nodes, edges: edges.map(([a, b]) => ({ from: a, to: b })), onChange: () => v.invalidate() });
        let res = null;
        function walk() {
          const ids = G.nodes.map((q) => q.id), idx = new Map(ids.map((id, i) => [id, i])), N = ids.length;
          const adj = ids.map((id) => G.adj(id).map((a) => idx.get(a.id)).filter((j) => j !== undefined));
          const key = JSON.stringify(adj) + '|' + n.value + '|' + seed;
          if (res && res.key === key) return res;
          const R = v.rng(seed * 31 + 7), cnt = new Array(N).fill(0);
          let x = 0; const seen = new Set([0]), st = [0];
          while (st.length) { const u = st.pop(); for (const w of adj[u]) if (!seen.has(w)) { seen.add(w); st.push(w); } }
          const T = n.value;
          if (adj[0].length) for (let t = 0; t < T; t++) { x = adj[x][Math.floor(R() * adj[x].length)]; cnt[x]++; } else cnt[0] = T;
          const deg = adj.map((a) => a.length), tot = [...seen].reduce((s, i) => s + deg[i], 0) || 1;
          res = { key, ids, N, freq: cnt.map((c) => c / T), theo: deg.map((d, i) => (seen.has(i) ? d / tot : 0)), deg, connected: seen.size === N, comp: seen.size, E: tot / 2 };
          return res;
        }
        v.render(() => {
          const r = walk();
          s2.setView([-0.6, r.N - 0.4], [0, Math.max(0.1, ...r.freq, ...r.theo) * 1.2]);
          s2.setTicks(r.ids.map((id, i) => [i, String(id)]), undefined);
          s2.bars(r.freq, { x0: 0, dx: 1, color: 'accent' });
          r.theo.forEach((p, i) => s2.dot(i, p, { r: 5, color: 'ink' }));
          G.draw({ nodeNote: (id) => 'd=' + r.deg[r.ids.indexOf(id)], nodeColor: (id) => (r.theo[r.ids.indexOf(id)] > 0 || r.connected ? 'accent' : 'muted') });
        });
        v.legend([['accent', 'observed fraction of time', { area: true }], ['ink', '$\\deg x/2|E|$', { dot: true }]]);
        v.readout(() => { const r = walk(); return `${r.N} nodes, ${Math.round(r.E)} edges${r.connected ? '' : ` (disconnected: start component has ${r.comp} nodes)`}. Largest gap between observed and $\\deg/2|E|$: $${v.fix(Math.max(...r.freq.map((f, i) => Math.abs(f - r.theo[i]))), 4)}$ (shrinks like $1/\\sqrt n$).`; });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12', kind: 'Theorem', name: 'Time reversal of a stationary chain',
      statement: String.raw`Let $(X_n)_{0\le n\le N}$ be a Markov chain with irreducible transition matrix $P$ and initial distribution equal to its stationary distribution $\pi$. Then the reversed process $\hat X_n=X_{N-n}$ is a Markov chain with transition matrix
$$\hat p_{xy}=\frac{\pi(y)\,p_{yx}}{\pi(x)},$$
which is again a stochastic matrix with the same stationary distribution $\pi$. The chain is reversible exactly when $\hat P=P$, i.e. under detailed balance (4.9).`,
      idea: String.raw`Compute the probability of a path: $\Pr(X_0=x_0,\dots,X_N=x_N)=\pi(x_0)p_{x_0x_1}\cdots p_{x_{N-1}x_N}$. Using $\pi(x_i)\hat p_{x_ix_{i-1}}=\pi(x_{i-1})p_{x_{i-1}x_i}$ repeatedly, this equals $\pi(x_N)\hat p_{x_Nx_{N-1}}\cdots\hat p_{x_1x_0}$, which is the path probability of a chain with matrix $\hat P$ started from $\pi$. Rows of $\hat P$ sum to one because $\sum_y\pi(y)p_{yx}=\pi(x)$ (that is stationarity, 4.1).`,
      caption: String.raw`A stationary trajectory on five states (left strip) and the same sample read backwards (right strip). For the **ring** with rotation $\rho$ the path is drawn unwrapped around the pentagon (going once round adds $5$): the forward path drifts upwards with speed $\rho$ while the backward path drifts down, so the arrow of time is visible. Bars (right): row $x$ of $P$ (blue), of the predicted reversed matrix $\hat P$ (orange), and the empirical row of the backward transitions counted in a long run (black dots) — they sit on $\hat P$, not on $P$. At $\rho=0$ (or for a birth–death chain) the forward and backward pictures cannot be told apart.`,
      deps: ['stoch-4.1'], refs: ['Norris §1.9', 'LPW §1.6'], tags: ['time reversal', 'stationary process'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'ring', label: 'ring with rotation' }, { value: 'weather', label: 'weather' }, { value: 'bd', label: 'birth–death' }], 'ring', { onChange: () => rebuild() });
        const rho = v.slider('rotation $\\rho$', 0, 0.6, 0.35, { step: 0.01, onChange: () => rebuild() });
        const xs = v.slider('row $x$', 0, 4, 0, { int: true, step: 1 });
        let seed = 2; v.button('resample', () => { seed++; rebuild(); });
        const s1 = v.stage({ x: [0, 40], y: [-0.5, 4.5], axes: 'box', gutter: true, height: 280, xlabel: 'time', ylabel: 'state', title: 'forward path', weight: 0.8 });
        const s2 = v.stage({ x: [0, 40], y: [-0.5, 4.5], axes: 'box', gutter: true, height: 280, xlabel: 'reversed time', ylabel: 'state', title: 'the same path, read backwards', weight: 0.8 });
        const s3 = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 280, xlabel: 'next state $y$', ylabel: 'probability', title: 'row $x$ of $P$ and of $\\hat P$', weight: 0.9 });
        let P, pi, Ph, path, emp, n;
        function rebuild() {
          P = kind.value === 'ring' ? ringRot(rho.value) : kind.value === 'bd' ? BD : presetChain('weather').P; n = P.length; pi = stationary(P); Ph = reverseChain(P, pi);
          xs.el.max = n - 1; rho.el.hidden = kind.value !== 'ring';
          const R = v.rng(seed * 41 + 1), C = cumRows(P), L = 40000; path = new Int8Array(L + 1);
          let u = R(), s = 0; for (let i = 0, a = 0; i < n; i++) { a += pi[i]; if (u < a) { s = i; break; } }
          path[0] = s; for (let t = 1; t <= L; t++) path[t] = nextState(C, path[t - 1], R());
          const cnt = P.map(() => new Array(n).fill(0));
          for (let t = 0; t < L; t++) cnt[path[t + 1]][path[t]]++;
          emp = cnt.map((r) => { const m = r.reduce((a, b) => a + b, 0) || 1; return r.map((c) => c / m); });
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const x = Math.min(Math.round(xs.value), n - 1), W = 40, ring = kind.value === 'ring';
          let h = 0; const pts = Array.from({ length: W + 1 }, (_, t) => { if (ring && t) h += ((path[t] - path[t - 1] + 7) % 5) - 2; return [t, ring ? h : path[t]]; });
          const lo = Math.min(...pts.map((q) => q[1])) - 0.7, hi = Math.max(...pts.map((q) => q[1])) + 0.7;
          s1.setView([0, W], [lo, hi]); s2.setView([0, W], [lo, hi]); s3.setView([-0.6, n - 0.4], [0, 1]);
          s1.setLabels(undefined, ring ? 'position (unwrapped)' : 'state'); s2.setLabels(undefined, ring ? 'position (unwrapped)' : 'state');
          s1.setTicks(undefined, null); s2.setTicks(undefined, null);
          s1.path(pts, { color: 'accent', width: 1.4 }); pts.forEach(([t, k]) => s1.dot(t, k, { r: 3, color: 'accent' }));
          const rev = pts.map(([t, k]) => [W - t, k]).reverse();
          s2.path(rev, { color: 'orange', width: 1.4 }); rev.forEach(([t, k]) => s2.dot(t, k, { r: 3, color: 'orange' }));
          s3.bars(P[x], { x0: -0.14, dx: 1, barWidth: 0.26, color: 'accent' });
          s3.bars(Ph[x], { x0: 0.14, dx: 1, barWidth: 0.26, color: 'orange' });
          emp[x].forEach((p, y) => s3.dot(y + 0.14, p, { r: 4, color: 'ink' }));
        });
        v.legend([['accent', '$p_{xy}$', { area: true }], ['orange', '$\\hat p_{xy}$', { area: true }], ['ink', 'empirical backward', { dot: true }]]);
        v.readout(() => {
          const x = Math.min(Math.round(xs.value), n - 1); let d = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d = Math.max(d, Math.abs(Ph[i][j] - P[i][j]));
          return `$\\hat P$ has rows summing to $1$ and stationary law $\\pi=${vtex(pi, 3)}$.  $\\max|\\hat p_{xy}-p_{xy}|=${v.fix(d, 4)}$ — ${d < 1e-9 ? 'reversible: forward and backward films look alike' : 'not reversible'}.  Row ${x}: empirical backward law is within $${v.fix(Math.max(...emp[x].map((e, j) => Math.abs(e - Ph[x][j]))), 4)}$ of $\\hat P$ (and $${v.fix(Math.max(...emp[x].map((e, j) => Math.abs(e - P[x][j]))), 4)}$ of $P$).`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13', kind: 'Theorem', name: 'Ergodic theorem for Markov chains',
      statement: String.raw`Let $P$ be irreducible and let $\lambda$ be any initial distribution. Write $V_x(n)=\sum_{k=0}^{n-1}\mathbf 1\{X_k=x\}$ for the number of visits to $x$ before time $n$. Then, almost surely,
$$\frac{V_x(n)}n\longrightarrow\frac1{\mathbb E_xT_x^+}\qquad(n\to\infty),$$
and if $P$ is positive recurrent with stationary distribution $\pi$, then for every bounded function $f$ on the states
$$\frac1n\sum_{k=0}^{n-1}f(X_k)\longrightarrow\sum_x\pi(x)f(x)\quad\text{almost surely.}$$
No aperiodicity is needed. If $\mathbb E_xT_x^+=\infty$ (null recurrence or transience) the limit is $0$.`,
      idea: String.raw`By the strong Markov property (2.8) the successive return times to $x$ cut the path into i.i.d. excursions of mean length $m_x=\mathbb E_xT_x^+$, so the strong law of large numbers gives that the $r$-th return happens at time $\sim r\,m_x$; inverting this renewal count gives $V_x(n)/n\to1/m_x$. For general $f$, split the path into excursions from a fixed state and apply the strong law to the (i.i.d.) excursion sums of $f$, as in 4.2. Fluctuations of order $1/\sqrt n$ come from the central limit theorem for those excursion sums.`,
      caption: String.raw`The fraction of time spent in the chosen state $x$ along $150$ runs. Left: six sample runs (colours), the empirical $\pm2$ standard-deviation band over all runs (grey), and $\pi(x)$ (black line); the horizontal axis is logarithmic. Right: the same curves multiplied by $\sqrt n$; the band stops shrinking and stays at a constant width, so the error really is of order $n^{-1/2}$. The *periodic walk* alternates between two classes at every step, yet the time averages still converge, to $\pi$.`,
      deps: ['stoch-4.2', 'stoch-2.8'], refs: ['Norris §1.10', 'LPW §4.7'], tags: ['ergodic theorem', 'law of large numbers', 'time averages'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'weather', label: 'weather' }, { value: 'rooms', label: 'two rooms' }, { value: 'per', label: 'periodic walk' }], 'weather', { onChange: () => rebuild() });
        const xs = v.slider('state $x$', 0, 3, 0, { int: true, step: 1, onChange: () => rebuild() });
        let seed = 1; v.button('resample', () => { seed++; rebuild(); });
        const N = 10000, RUNS = 150;
        const s1 = v.stage({ x: [10, N], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: 'fraction of time at $x$', title: 'time average $V_x(n)/n$' });
        const s2 = v.stage({ x: [10, N], y: [-2, 2], xlog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: '$\\sqrt n\\,(V_x(n)/n-\\pi(x))$', title: 'fluctuations on the $\\sqrt n$ scale' });
        let pi, data, cps, sd, x;
        function rebuild() {
          const P = kind.value === 'per' ? [[0, 0.5, 0, 0.5], [0.5, 0, 0.5, 0], [0, 0.5, 0, 0.5], [0.5, 0, 0.5, 0]] : presetChain(kind.value).P;
          const n = P.length; xs.el.max = n - 1; x = Math.min(Math.round(xs.value), n - 1); pi = stationary(P);
          cps = []; for (let c = 10; c <= N; c = Math.max(c + 1, Math.round(c * 1.12))) cps.push(c);
          const R = v.rng(seed * 53 + 9), C = cumRows(P);
          data = Array.from({ length: RUNS }, () => {
            let s = Math.floor(R() * n), cnt = 0, ci = 0; const out = new Float64Array(cps.length);
            for (let t = 1; t <= N && ci < cps.length; t++) { if (s === x) cnt++; s = nextState(C, s, R()); if (t === cps[ci]) { out[ci++] = cnt / t; } }
            return out;
          });
          sd = cps.map((_, i) => { const m = data.reduce((a, d) => a + d[i], 0) / RUNS; return Math.sqrt(data.reduce((a, d) => a + (d[i] - m) ** 2, 0) / RUNS); });
          const scale = Math.max(...cps.map((c, i) => 2 * sd[i] * Math.sqrt(c))); s2.setView([10, N], [-scale * 1.25, scale * 1.25]);
          s1.setView([10, N], [Math.max(0, pi[x] - 0.4), Math.min(1, pi[x] + 0.4)]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const band = (f, sgn) => cps.map((c, i) => [c, f(c, i) + sgn * 2 * sd[i]]);
          const up1 = band((c) => pi[x], 1), lo1 = band((c) => pi[x], -1);
          s1.poly([...up1, ...lo1.slice().reverse()], { fill: 'muted', fillAlpha: 0.25, stroke: false });
          for (let r = 0; r < 6; r++) s1.path(cps.map((c, i) => [c, data[r][i]]), { color: STATE_COL[r], width: 1.3, alpha: 0.85 });
          s1.hline(pi[x], { color: 'ink', width: 2 });
          const up2 = cps.map((c, i) => [c, 2 * sd[i] * Math.sqrt(c)]), lo2 = cps.map((c, i) => [c, -2 * sd[i] * Math.sqrt(c)]);
          s2.poly([...up2, ...lo2.slice().reverse()], { fill: 'muted', fillAlpha: 0.25, stroke: false });
          for (let r = 0; r < 6; r++) s2.path(cps.map((c, i) => [c, (data[r][i] - pi[x]) * Math.sqrt(c)]), { color: STATE_COL[r], width: 1.3, alpha: 0.85 });
          s2.hline(0, { color: 'ink', width: 1.5 });
        });
        v.legend([['ink', '$\\pi(x)$'], ['muted', '$\\pm2$ s.d. over 150 runs', { area: true }]]);
        v.readout(() => { const a = Math.floor(cps.length / 2), z = cps.length - 1; return `$\\pi(x)=${v.fix(pi[x], 4)}$.  Standard deviation of $V_x(n)/n$ over runs: $${v.fix(sd[0], 3)}$ at $n=10$, $${v.fix(sd[a], 4)}$ at $n=${cps[a]}$, $${v.fix(sd[z], 4)}$ at $n=10^4$.  Times $\\sqrt n$: $${v.fix(sd[a] * Math.sqrt(cps[a]), 3)}$ and $${v.fix(sd[z] * Math.sqrt(cps[z]), 3)}$ — about the same, so the error is of order $n^{-1/2}$.`; });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14', kind: 'Theorem', name: 'Markov chain tree theorem',
      statement: String.raw`Let $P$ be an irreducible transition matrix on a finite state set $S$. For a state $r$ let $\mathcal T_r$ be the set of spanning trees of the directed graph (edge $x\to y$ when $p_{xy}>0$) in which every state $x\ne r$ has exactly one outgoing edge and all edges lead towards $r$ (spanning in-trees, or arborescences, rooted at $r$), and put $w(T)=\prod_{(x\to y)\in T}p_{xy}$. Then the stationary distribution is
$$\pi(r)=\frac{\sum_{T\in\mathcal T_r}w(T)}{\sum_{s\in S}\sum_{T\in\mathcal T_s}w(T)}.$$
Self-loops are not tree edges, though changing a holding probability while renormalizing other transitions can change the weights. For a reversible weighted walk, $w(T)=c(r)\prod_{e\in T}c_e/\prod_xc(x)$, so the normalized root weights recover $\pi(r)\propto c(r)$.`,
      idea: String.raw`Aldous and Fill's tree-valued chain supplies a probabilistic proof (Theorem 9.10 and Corollary 9.11): update a tree rooted at $v$ when the chain moves to $w$, by adding $v\to w$ and removing $w$'s old outgoing edge. The stationary tree weights are proportional to products of edge transition probabilities, so their root marginal is $\pi$. Algebraically, the directed matrix-tree identity gives the same root weights as the principal cofactors of $I-P$. The adjugate identity and rank $|S|-1$ then show that their row vector annihilates $I-P$.`,
      caption: String.raw`A four-state chain whose off-diagonal weights come from a seed (new weights: button). Pick the root $r$: the tiles show every spanning in-tree towards $r$ (arrows point from each non-root state to its unique successor), with its weight below. The bars on the right are the total tree weight for each root, normalised, against the stationary distribution computed by solving $\pi P=\pi$ (green dots): they agree. A large root weight means a large sum of products of transition probabilities over its in-trees; both their number and their individual weights matter.`,
      deps: ['stoch-4.4', 'circ-2.12'], refs: ['Aldous–Fill, §9.2.1, Theorem 9.10 and Corollary 9.11'], tags: ['spanning trees', 'matrix-tree theorem'],
      links: { source: 'https://www.stat.berkeley.edu/~aldous/RWG/Book_Ralph/Ch9.S2.html' },
      viz(v) {
        const root = v.slider('root $r$', 0, 3, 0, { int: true, step: 1 });
        let seed = 5; v.button('new weights', () => { seed++; });
        const s1 = v.stage({ x: [-0.05, 4.4], y: [-5.0, 0.3], axes: false, equal: true, height: 380, title: 'spanning in-trees towards the root', weight: 1.4 });
        const s2 = v.stage({ x: [-0.6, 3.6], y: [0, 0.6], axes: 'box', gutter: true, height: 380, xlabel: 'root $r$', ylabel: 'normalised tree weight', xticks: [[0, '1'], [1, '2'], [2, '3'], [3, '4']], title: 'tree weights against $\\pi$', weight: 0.7 });
        const build = () => treeChain(v.rng(seed * 17 + 3));
        const NP = [[0.15, 0.75], [0.85, 0.75], [0.85, 0.2], [0.15, 0.2]];
        v.render(() => {
          const P = build(), r = Math.round(root.value), pi = stationary(P);
          const trees = [0, 1, 2, 3].map((q) => arborescences(P, q)), W = trees.map((ts) => ts.reduce((a, t) => a + treeWeight(P, t), 0)), tot = W.reduce((a, b) => a + b, 0);
          const T = trees[r], cols = 4, rows = Math.max(1, Math.ceil(T.length / cols));
          s1.setView([-0.05, 4.4], [-rows * 1.35 + 0.1, 0.3]);
          T.forEach((par, k) => {
            const ox = (k % cols) * 1.1, oy = -Math.floor(k / cols) * 1.35;
            s1.rect(ox - 0.03, oy - 0.08 - 1.02, ox + 1.03, oy - 0.08, { color: 'faint', fill: false, radius: 6 });
            par.forEach((j, i) => { if (j >= 0) s1.arrow(ox + NP[i][0] + 0 * 0, oy - 1 + NP[i][1] - 0.05 + 0.05, ox + NP[j][0], oy - 1 + NP[j][1], { color: 'accent', width: 1.8 }); });
            NP.forEach(([x, y], i) => s1.dot(ox + x, oy - 1 + y, { r: i === r ? 9 : 7, color: i === r ? 'gold' : 'ink', label: String(i + 1), labelPos: i < 2 ? 'n' : 's' }));
            s1.text(treeWeight(P, par).toFixed(4), ox + 0.5, oy - 1.2, { size: 11, color: 'muted' });
          });
          s2.bars(W.map((w) => w / tot), { x0: 0, dx: 1, color: (_, i) => (i === r ? 'gold' : 'accent') });
          pi.forEach((p, i) => s2.dot(i, p, { r: 5, color: 'green' }));
          s2.setView([-0.6, 3.6], [0, Math.max(...pi) * 1.25]);
        });
        v.legend([['accent', 'normalised tree weight', { area: true }], ['green', '$\\pi$ from $\\pi P=\\pi$', { dot: true }]]);
        v.readout(() => {
          const P = build(), r = Math.round(root.value), pi = stationary(P);
          const trees = [0, 1, 2, 3].map((q) => arborescences(P, q)), W = trees.map((ts) => ts.reduce((a, t) => a + treeWeight(P, t), 0)), tot = W.reduce((a, b) => a + b, 0);
          return `Root ${r + 1}: ${trees[r].length} spanning in-trees, total weight $${v.fix(W[r], 5)}$; all roots: $${W.map((w) => v.fix(w, 4)).join(',\\ ')}$ (sum $${v.fix(tot, 4)}$). Tree formula $\\pi=${vtex(W.map((w) => w / tot), 4)}$ versus linear algebra $${vtex(pi, 4)}$.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15', kind: 'Model', name: 'PageRank',
      statement: String.raw`Given a directed graph of $n$ pages, let $M$ be the link matrix of the surfer who follows a uniformly random outgoing link (a page without links jumps to a uniformly random page), and let $d\in[0,1)$ be the damping factor. The **PageRank** vector is the stationary distribution of the chain
$$G=d\,M+(1-d)\tfrac1n\mathbf 1\mathbf 1^{\!\top}.$$
Because every entry of $G$ is at least $(1-d)/n>0$, the chain is irreducible and aperiodic; so the stationary distribution $r$ exists and is unique (4.4), every start converges to it (4.7), and the power iteration $r_{k+1}=r_kG$ satisfies $\|r_k-r\|_1\le 2d^{\,k}$.`,
      idea: String.raw`The teleportation term $(1-d)\frac1n\mathbf 1\mathbf 1^\top$ makes $G$ a positive matrix, which is exactly the hypothesis of the Perron–Frobenius theorem (4.6) and of the convergence theorem (4.7): the dominant eigenvalue is $1$ and all others have modulus at most $d$ (for a link matrix $M$ stochastic). Hence the error shrinks by the factor $d$ per iteration, and a damping of $0.85$ means that about 50 multiplications give single precision. PageRank of a page is the long-run fraction of time a random surfer spends on it (4.13).`,
      caption: String.raw`Edit the web: click empty space to add a page, click one page then another to add a link (Alt-click removes). The notes on the pages are their rank after $k$ power-iteration steps from the uniform start. Middle: the rank vector at step $k$ (bars) against the exact stationary law (dots). Right: the $\ell^1$ error on a log scale, falling below the guaranteed $2d^k$ (dashed). Lower $d$ makes convergence faster but flattens the ranking towards uniform; $d\to1$ approaches the raw link-following chain.`,
      deps: ['stoch-4.7', 'stoch-4.6'], refs: ['LPW §1.5'], credit: 'S. Brin and L. Page, 1998', links: { doi: 'https://doi.org/10.1016/s0169-7552(98)00110-x' }, tags: ['PageRank', 'power iteration', 'web graph'],
      scope: String.raw`A model of web surfing: the surfer ignores page content, follows links uniformly, and teleports uniformly at random. The deployed ranking of a search engine involves many further ingredients.`,
      viz(v) {
        const d = v.slider('damping $d$', 0, 0.99, 0.85, { step: 0.01 });
        const k = v.slider('iterations $k$', 0, 60, 8, { int: true, step: 1 });
        const s1 = v.stage({ x: [-0.3, 7.3], y: [-0.3, 5.0], axes: false, equal: true, height: 320, title: 'a small web (editable)', weight: 1.2 });
        const s2 = v.stage({ x: [-0.6, 5.6], y: [0, 0.5], axes: 'box', gutter: true, height: 320, xlabel: 'page', ylabel: 'rank', title: 'rank after $k$ steps', weight: 0.8 });
        const s3 = v.stage({ x: [0, 60], y: [1e-8, 3], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'iteration $k$', ylabel: '$\\|r_k-r\\|_1$', title: 'convergence', weight: 0.8 });
        const nodes = [[1.0, 2.5], [2.8, 4.2], [4.6, 3.8], [6.2, 2.4], [4.0, 0.8], [2.0, 0.7]].map(([x, y], i) => ({ id: i + 1, label: String(i + 1), x, y }));
        const links = [[1, 2], [2, 3], [3, 1], [3, 4], [4, 3], [5, 3], [5, 4], [6, 1], [6, 5], [2, 1], [4, 5]];
        const G = v.graph(s1, { directed: true, layout: 'none', editable: true, draggable: true, r: 16, nodes, edges: links.map(([a, b]) => ({ from: a, to: b })), onChange: () => v.invalidate() });
        const model = () => {
          const ids = G.nodes.map((q) => q.id), idx = new Map(ids.map((id, i) => [id, i])), n = ids.length, dd = d.value;
          const Gm = ids.map((id) => { const out = G.adj(id).map((a) => idx.get(a.id)).filter((j) => j !== undefined); const r = new Array(n).fill((1 - dd) / n); if (out.length) out.forEach((j) => { r[j] += dd / out.length; }); else for (let j = 0; j < n; j++) r[j] += dd / n; return r; });
          return { ids, n, Gm, pi: n > 1 ? stationary(Gm) : [1] };
        };
        v.render(() => {
          const { ids, n, Gm, pi } = model(), K = Math.round(k.value);
          let r = new Array(n).fill(1 / n); const err = [l1(r, pi)];
          for (let i = 0; i < 60; i++) { r = vecP(r, Gm); err.push(l1(r, pi)); }
          let rk = new Array(n).fill(1 / n); for (let i = 0; i < K; i++) rk = vecP(rk, Gm);
          G.draw({ nodeNote: (id) => (rk[ids.indexOf(id)] * 100).toFixed(1) + '%', nodeFill: (id) => null, nodeColor: (id) => 'accent' });
          s2.setView([-0.6, n - 0.4], [0, Math.max(0.1, ...rk, ...pi) * 1.2]); s2.setTicks(ids.map((id, i) => [i, String(id)]), undefined);
          s2.bars(rk, { x0: 0, dx: 1, color: 'accent' }); pi.forEach((p, i) => s2.dot(i, p, { r: 5, color: 'ink' }));
          s3.path(err.map((e, i) => [i, Math.max(e, 1e-9)]), { color: 'accent', width: 2 });
          s3.fn((i) => 2 * d.value ** i, { color: 'ink', dash: true, domain: [0, 60], n: 60 });
          s3.vline(K, { color: 'gold' });
        });
        v.legend([['accent', 'error'], ['ink', '$2d^k$', { dash: true }]]);
        v.readout(() => { const { ids, pi } = model(), top = pi.indexOf(Math.max(...pi)); return `Exact PageRank $r=${vtex(pi, 3)}$ — highest: page ${ids[top]} ($${v.fix(100 * pi[top], 1)}\\%$). Damping $d=${v.fix(d.value, 2)}$, so the error contracts by $d$ per step: $d^{60}=${v.sci(d.value ** 60, 2)}$.`; });
      },
    },

    // ───────────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16', kind: 'Paradox', name: 'Ehrenfest model and the recurrence paradox',
      statement: String.raw`In the **Ehrenfest urn**, choose one of $N$ numbered balls uniformly and move it to the other urn. If $X_t=k$ counts balls in A, $p_{k,k-1}=k/N$ and $p_{k,k+1}=(N-k)/N$. Its stationary probability is $\pi(k)=\binom Nk2^{-N}$ and, from $X_0=k_0$,
$$\mathbb E X_t=\tfrac N2+(k_0-\tfrac N2)(1-\tfrac2N)^t\qquad(t=0,1,\ldots).$$
The mean offset decays on a scale of order $N\log N$ to the equilibrium fluctuation scale. **This is not fixed-time convergence to stationarity:** parity alternates, so from a fixed start the total-variation distance is at least $1/2$ at every time. Nevertheless time occupations converge to $\pi$, and the mean first positive return time to $N$ is $1/\pi(N)=2^N$.`,
      idea: String.raw`The original 1907 paper's §6 (pp.312–313) describes numbered balls and repeated random number draws. It compares likely motion toward balanced populations with recurrence and time reversal. In modern notation, detailed balance with the binomial law proves stationarity. Conditional expectation gives $\mathbb E[X_{t+1}-N/2\mid X_t]=(1-2/N)(X_t-N/2)$; Kac's formula gives the return mean. The chain has period two. Its stationary parity classes each have mass $1/2$, explaining why a decaying mean cannot establish mixing in total variation.`,
      caption: String.raw`Left: a run from all balls in A, integer-time exact means (black, joined for visibility), and $N/2\pm\sqrt N$ (grey, twice the stationary standard deviation). Middle: 100000-step occupation frequencies and the binomial law. Right: exact return means $2^N$ and the first integer time when the mean offset enters that grey band (orange points; zero at $N=4$, omitted from the log axis). Green points estimate return means using 150 excursions for each $N\le12$, capped at one million steps and fixed across path resamples. These are noisy sample means, not exact recurrence times. All selectable $N$ values fit the axes.`,
      deps: ['stoch-4.2', 'stoch-1.11'], refs: ['P. and T. Ehrenfest (1907), §6, pp.312–313', 'Durrett 5.5.11'], credit: 'P. and T. Ehrenfest, 1907', tags: ['Ehrenfest urn', 'recurrence', 'statistical mechanics'],
      scope: String.raw`A finite mathematical urn model. Its step count is a model clock; no physical collision rate or number of gas molecules is inferred. No laziness or randomization of observation time is added to remove the period-two obstruction.`,
      links: { source: 'https://www.lorentz.leidenuniv.nl/IL-publications/sources/Ehrenfest_07b.pdf' },
      viz(v) {
        const NN = v.slider('number of balls $N$', 4, 60, 20, { int: true, step: 1, onChange: () => rebuild() });
        let seed = 3; v.button('resample', () => { seed++; rebuild(); });
        const s1 = v.stage({ x: [0, 300], y: [0, 20], axes: 'box', gutter: true, height: 300, xlabel: 'step $t$', ylabel: 'balls in urn A', title: 'relaxation from "all in A"' });
        const s2 = v.stage({ x: [-0.5, 20.5], y: [0, 0.2], axes: 'box', gutter: true, height: 300, xlabel: 'balls in A', ylabel: 'fraction of time', title: 'occupation of a long run', weight: 0.8 });
        const s3 = v.stage({ x: [2, 60], y: [0.8, 2 ** 61], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'number of balls $N$', ylabel: 'steps', title: 'two time scales', weight: 0.9 });
        let run, hist, N, tmax;
        const retPts = [];
        for (let n = 2; n <= 12; n++) retPts.push([n, ehrenfestReturns(n, v.rng(1000 + n))]);
        function rebuild() {
          N = Math.round(NN.value); const R = v.rng(seed * 71 + N);
          tmax = Math.max(60, Math.round(8 * N)); let k = N; run = [k];
          for (let t = 1; t <= tmax; t++) { k = R() < k / N ? k - 1 : k + 1; run.push(k); }
          hist = new Array(N + 1).fill(0); const L = 100000; for (let t = 0; t < L; t++) { k = R() < k / N ? k - 1 : k + 1; hist[k]++; }
          hist = hist.map((c) => c / L);
          s1.setView([0, tmax], [0, N]); s2.setView([-0.5, N + 0.5], [0, Math.max(...hist, binom(N, Math.floor(N / 2)) / 2 ** N) * 1.2]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const sd = Math.sqrt(N);
          s1.poly([[0, N / 2 - sd], [tmax, N / 2 - sd], [tmax, N / 2 + sd], [0, N / 2 + sd]], { fill: 'muted', fillAlpha: 0.2, stroke: false });
          s1.path(run.map((y, t) => [t, y]), { color: 'accent', width: 1.4 });
          s1.path(Array.from({ length: tmax + 1 }, (_, t) => [t, N / 2 + (N / 2) * (1 - 2 / N) ** t]), { color: 'ink', width: 2 });
          s2.bars(hist, { x0: 0, dx: 1, color: 'accent' });
          for (let k = 0; k <= N; k++) s2.dot(k, binom(N, k) / 2 ** N, { r: 3.5, color: 'ink' });
          s3.path(Array.from({ length: 59 }, (_, j) => [j + 2, 2 ** (j + 2)]), { color: 'ink', width: 2 });
          for (let n = 5; n <= 60; n++) s3.dot(n, ehrenfestBandTime(n), { color: 'orange', r: 2.5 });
          retPts.forEach(([n, r]) => s3.dot(n, r.mean, { r: 4, color: 'green' }));
          s3.vline(N, { color: 'gold' });
        });
        v.legend([['ink', 'mean return time $2^N$'], ['orange', 'mean enters two-s.d. band', { dot: true }], ['green', 'measured mean return', { dot: true }]]);
        v.readout(() => {
          const censored = retPts.reduce((s, [, r]) => s + r.censored, 0), largest = retPts.at(-1)[1];
          return String.raw`$N=${N}$: $\pi(N)=2^{-N}=${v.sci(2 ** -N, 2)}$, exact mean return $2^N=${v.sci(2 ** N, 3)}$ steps. Mean enters $N/2\pm\sqrt N$ at integer time ${ehrenfestBandTime(N)}. Fixed-start total-variation distance remains at least $1/2$ (period two). Return samples: 150 excursions per $N=2,\ldots,12$; ${censored} censored at $10^6$ steps. At $N=12$, capped sample mean ${v.fix(largest.mean, 1)}, estimated s.e. ${v.fix(largest.se, 1)}; exact uncapped mean 4096. Green cohorts stay fixed when resampling the path.`;
        });
      },
    },
  ],
};
