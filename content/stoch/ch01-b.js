// Stochastic Processes — Chapter 1: Markov chains: definitions and examples (items 1.8–1.14)
import { cumRows, nextState, ringPos, pfmt, makeClock, tvDist, rowNormalize } from './ch01.shared.js';

const STATE = ['accent', 'orange', 'purple', 'teal'];

// ─── helpers: groups ─────────────────────────────────────────────────────────
const permKey = (p) => p.join('');
function permutations(n) {
  const out = [];
  const rec = (a, rest) => { if (!rest.length) { out.push(a); return; } rest.forEach((x, i) => rec([...a, x], rest.filter((_, j) => j !== i))); };
  rec([], Array.from({ length: n }, (_, i) => i));
  return out;
}
/** A finite group given by element labels, the index of the identity (0) and `mul(i, g)`: index of x·g. */
function makeGroup(kind) {
  if (kind === 'z12' || kind === 'z12b') {
    const n = 12, gens = kind === 'z12' ? [1, 11] : [1, 11, 5, 7];
    return { n, labels: Array.from({ length: n }, (_, i) => String(i)), gens: gens.map((g) => (x) => (x + g) % n), sym: true, pos: ringPos(n, 1.2), name: kind === 'z12' ? '$\\mathbb Z_{12}$, generators $\\pm1$' : '$\\mathbb Z_{12}$, generators $\\pm1,\\pm5$' };
  }
  if (kind === 'cube') {
    const d = 4, n = 16;
    const pos = Array.from({ length: n }, (_, x) => { const b = [0, 1, 2, 3].map((i) => (x >> i) & 1); return [(b[0] - 0.5) * 1.6 + (b[2] - 0.5) * 0.55 + 0, (b[1] - 0.5) * 1.3 + (b[3] - 0.5) * 0.7 + (b[2] - 0.5) * 0.3]; });
    return { n, labels: Array.from({ length: n }, (_, x) => x.toString(2).padStart(d, '0')), gens: [0, 1, 2, 3].map((i) => (x) => x ^ (1 << i)), sym: true, pos, name: '$\\mathbb Z_2^4$, flip one bit (hypercube)' };
  }
  const P = permutations(4), idx = new Map(P.map((p, i) => [permKey(p), i]));
  const comp = (p, g) => p.map((_, i) => p[g[i]]); // x·g : position i of the new arrangement shows what was at g[i]
  const swap = [1, 0, 2, 3], cyc = [1, 2, 3, 0], tr = [[0, 1], [1, 2], [2, 3]].map(([a, b]) => { const g = [0, 1, 2, 3]; g[a] = b; g[b] = a; return g; });
  const sorted = P.map((p, i) => ({ p, i }));
  const gensP = kind === 's4' ? tr : [swap, cyc];
  const ident = idx.get('0123');
  // reorder so that the identity is element 0
  const order = [ident, ...P.map((_, i) => i).filter((i) => i !== ident)], newIdx = new Map(order.map((o, k) => [o, k]));
  void sorted;
  return {
    n: 24, labels: order.map((o) => permKey(P[o]).split('').map((c) => +c + 1).join('')),
    gens: gensP.map((g) => (x) => newIdx.get(idx.get(permKey(comp(P[order[x]], g))))), sym: kind === 's4',
    pos: null, name: kind === 's4' ? '$S_4$, adjacent transpositions (card shuffle)' : '$S_4$, swap top two $\\,$&$\\,$ cut the deck',
  };
}

// ─── helpers: Markov text ─────────────────────────────────────────────────────
const PASSAGE = 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters. My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last? Mr. Bennet replied that he had not. But it is, returned she; for Mrs. Long has just been here, and she told me all about it. Mr. Bennet made no answer. Do you not want to know who has taken it? cried his wife impatiently. You want to tell me, and I have no objection to hearing it. This was invitation enough.';
const LETTERS = ' abcdefghijklmnopqrstuvwxyz';
const CLEAN = PASSAGE.toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/ +/g, ' ').trim(); // a 27-symbol alphabet
function ngramModel(tokens, k) {
  const M = new Map();
  for (let i = 0; i + k < tokens.length; i++) {
    const key = tokens.slice(i, i + k).join('\u0001'), nxt = tokens[i + k];
    if (!M.has(key)) M.set(key, new Map());
    M.get(key).set(nxt, (M.get(key).get(nxt) || 0) + 1);
  }
  return M;
}
function condEntropy(tokens, k) { // H(next | previous k) in bits, plug-in estimate
  const M = ngramModel(tokens, k); let H = 0, tot = 0;
  M.forEach((m) => { let s = 0; m.forEach((c) => (s += c)); m.forEach((c) => { H -= c * Math.log2(c / s); }); tot += s; });
  return H / tot;
}

export default {
  collection: 'stoch',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Random walk on a graph',
      statement: String.raw`Let $G=(V,E)$ be a finite graph in which every vertex has at least one neighbour. The **simple random walk** on $G$ is the Markov chain on $V$ with transition matrix $p_{xy}=\dfrac{1}{\deg x}$ for each neighbour $y$ of $x$ (and $0$ otherwise); with weights $w_{xy}=w_{yx}>0$ on edges one puts $p_{xy}=w_{xy}/\sum_z w_{xz}$. Each step moves to a uniformly chosen neighbour. The chain is irreducible exactly when $G$ is connected, and aperiodic exactly when $G$ is connected and not bipartite.`,
      idea: String.raw`The transition matrix is $D^{-1}A$ ($A$ the adjacency matrix, $D$ the diagonal matrix of degrees), so the walk records nothing but the graph. Communicating classes are the connected components; a period larger than $1$ requires that every cycle has length divisible by it, and for an undirected graph the only possibility is $2$, which happens iff the graph is bipartite. A first sight of the long-run behaviour: the walker visits vertices in proportion to their degrees, $\pi_x=\deg x/2|E|$, which the bars below will confirm.`,
      caption: String.raw`Draw a graph (click empty space to add a vertex, click two vertices to join or separate them; Alt-click deletes) or pick one, and the walker starts moving to a uniformly random neighbour. Vertices glow with the number of visits; the bars compare each vertex's visit frequency with the target $\deg x/2|E|$ (dots). On the lollipop the walker lingers in the clique, in proportion to degree.`,
      deps: ['stoch-1.1'], refs: ['LPW §1.4'], tags: ['random walk', 'graphs'],
      viz(v) {
        const gsel = v.select('graph', [{ value: 'petersen', label: 'Petersen' }, { value: 'grid', label: 'grid' }, { value: 'lolli', label: 'lollipop' }, { value: 'star', label: 'star' }], 'lolli', { onChange: () => load() });
        const rate = v.slider('hops per second', 1, 1000, 80, { log: true, int: true });
        v.button('reset counts', () => reset());
        const s1 = v.stage({ x: [-1.7, 1.7], y: [-1.3, 1.3], axes: false, equal: true, height: 360, title: 'the graph (edit freely)' });
        const s2 = v.stage({ x: [-0.6, 12.6], y: [0, 0.4], axes: 'box', gutter: true, height: 360, xlabel: 'vertex', ylabel: 'fraction of visits', title: 'visit frequency vs degree' });
        const G = v.graph(s1, { layout: 'none', r: 14, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true, moveNode: true }, nodes: [{ id: 0, x: 0, y: 0 }], edges: [] });
        const clk = makeClock();
        let R = v.rng(5), cur = 0, cnt = new Map(), steps = 0;
        function reset() { R = v.rng(5); cnt = new Map(); steps = 0; cur = G.nodes.length ? G.nodes[0].id : 0; clk.reset(); v.invalidate(); }
        function load() {
          const k = gsel.value;
          if (k === 'petersen') G.set({ ...v.graphs('petersen'), r: 13 });
          else if (k === 'grid') G.set({ ...v.graphs('grid', 3, 4), r: 13 });
          else if (k === 'star') G.set({ ...v.graphs('star', 8), r: 13 });
          else {
            const nodes = [], edges = [];
            for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (2 * Math.PI * i) / 5 + 0.3; nodes.push({ id: i, x: 0.75 * Math.cos(a), y: 0.75 * Math.sin(a) }); }
            for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) edges.push({ from: i, to: j });
            for (let i = 5; i < 9; i++) nodes.push({ id: i, x: 0.9 + 0.75 * (i - 4), y: -0.6 });
            edges.push({ from: 3, to: 5 }); for (let i = 5; i < 8; i++) edges.push({ from: i, to: i + 1 });
            G.set({ nodes, edges, layout: 'none', r: 13 }); G.layout('fit');
          }
          reset();
        }
        G.onChange = () => reset();
        load();
        let info = {};
        v.animate((t) => {
          const k = clk.due(t, rate.value);
          if (clk.restarted) reset();
          for (let i = 0; i < k; i++) {
            if (!G.has(cur)) cur = G.nodes[0].id;
            const nb = G.adj(cur); if (!nb.length) break;
            cur = nb[Math.floor(R() * nb.length)].id; cnt.set(cur, (cnt.get(cur) || 0) + 1); steps++;
          }
          const ids = G.nodes.map((n) => n.id), deg = ids.map((i) => G.adj(i).length), E2 = deg.reduce((a, b) => a + b, 0) || 1;
          const frac = ids.map((i) => (steps ? (cnt.get(i) || 0) / steps : 0)), mx = Math.max(0.0001, ...frac);
          G.draw({
            nodeFill: (id) => (id === cur ? 'gold' : steps ? v.ramp(Math.min(1, (cnt.get(id) || 0) / steps / mx), 'accent') : null),
            nodeColor: () => 'accent', labelColor: null,
            edgeColor: () => 'muted', edgeWidth: () => 1.5,
          });
          s2.setView([-0.6, Math.max(ids.length, 3) - 0.4], [0, Math.max(0.12, ...frac, ...deg.map((d) => d / E2)) * 1.15]);
          s2.bars(frac, { x0: 0, dx: 1, color: 'accent' });
          s2.dots(deg.map((d, i) => [i, d / E2]), { color: 'green', r: 5 });
          const tv = tvDist(frac, deg.map((d) => d / E2));
          info = { tv, V: ids.length, E: E2 / 2, comps: G.components().length, steps };
        }, { still: 12 });
        v.legend([['accent', 'visit frequency', { area: true }], ['green', '$\\deg x/2|E|$', { dot: true }], ['gold', 'walker', { dot: true }]]);
        v.readout(() => `$|V|=${info.V}$, $|E|=${info.E}$, ${info.comps} component${info.comps > 1 ? 's (walker confined to its own)' : ' (connected: irreducible)'}. After $n=${info.steps}$ hops: total variation distance between visit frequencies and $\\deg/2|E|$ is **${v.fix(info.tv, 3)}**.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9', kind: 'Model', name: 'Random walks on groups',
      statement: String.raw`Let $\Gamma$ be a finite group and $\mu$ a probability measure on $\Gamma$ (typically uniform on a generating set $S$). The **random walk on $\Gamma$ driven by $\mu$** is the Markov chain with $X_{n+1}=X_n\,\xi_{n+1}$, where $\xi_1,\xi_2,\dots$ are i.i.d. with law $\mu$: its transition matrix is $p_{xy}=\mu(x^{-1}y)$. Its transition graph is the Cayley graph of $(\Gamma,S)$. The walk is irreducible iff $S$ generates $\Gamma$, and the uniform distribution on $\Gamma$ is stationary because the matrix is doubly stochastic. Card shuffling is the case $\Gamma=S_n$.`,
      idea: String.raw`Right multiplication by $g$ is a bijection of $\Gamma$, so every column of $P$ also sums to one: the uniform law $U$ satisfies $UP=U$. The law of $X_n$ is the $n$-fold convolution $\mu^{*n}$, which is why group structure gives such clean mixing computations. Parity can obstruct convergence: if all generators are odd in a $\mathbb Z_2$-grading (a bipartite Cayley graph), the walk alternates between two halves and $\mu^{*n}$ never approaches $U$ unless one makes the walk lazy.`,
      caption: String.raw`Pick a group and generators; the walker multiplies by a uniformly random generator, and the Cayley graph glows where it has been. The right panel is exact: the total-variation distance from $\mu^{*n}$ to the uniform law on a log scale (a gold marker shows the current step count). For the bipartite examples the distance sticks at $1/2$ until you switch on the lazy walk.`,
      deps: ['stoch-1.1'], refs: ['LPW §2.6'], tags: ['random walk', 'groups', 'cayley graph'],
      credit: 'cf. Diaconis, Group Representations in Probability and Statistics, 1988',
      viz(v) {
        const gsel = v.select('group', [{ value: 'z12', label: 'Z₁₂ ±1' }, { value: 'z12b', label: 'Z₁₂ ±1, ±5' }, { value: 'cube', label: 'hypercube' }, { value: 's4', label: 'S₄ shuffle' }, { value: 's4b', label: 'S₄ swap+cut' }], 'cube', { onChange: () => load() });
        const lz = v.toggle('lazy (stay put w.p. ½)', false, { onChange: () => load() });
        const rate = v.slider('steps per second', 1, 600, 40, { log: true, int: true });
        v.button('reset', () => reset());
        const s1 = v.stage({ x: [-1.9, 1.9], y: [-1.4, 1.4], axes: false, equal: true, height: 350, title: 'Cayley graph' });
        const KMAX = 60;
        const s2 = v.stage({ x: [0, KMAX], y: [1e-4, 1.2], ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'step $n$', ylabel: '$\\|\\mu^{*n}-U\\|_{TV}$', title: 'distance to uniform' });
        const G = v.graph(s1, { layout: 'none', r: 11, draggable: true, nodes: [{ id: 0, x: 0, y: 0 }], edges: [] });
        const clk = makeClock();
        let grp, R, cur, cnt, steps, tvs, P, title = '';
        function reset() { R = v.rng(8); cur = 0; cnt = new Array(grp.n).fill(0); cnt[0] = 0; steps = 0; clk.reset(); v.invalidate(); }
        function load() {
          grp = makeGroup(gsel.value);
          const n = grp.n, q = lz.value ? 0.5 : 0;
          P = Array.from({ length: n }, () => new Array(n).fill(0));
          for (let x = 0; x < n; x++) { P[x][x] += q; grp.gens.forEach((g) => { P[x][g(x)] += (1 - q) / grp.gens.length; }); }
          let mu = new Array(n).fill(0); mu[0] = 1; tvs = [0.5 * (mu.reduce((s, m) => s + Math.abs(m - 1 / n), 0))];
          for (let k = 1; k <= KMAX; k++) { const nx = new Array(n).fill(0); for (let x = 0; x < n; x++) if (mu[x]) for (let y = 0; y < n; y++) nx[y] += mu[x] * P[x][y]; mu = nx; tvs.push(0.5 * mu.reduce((s, m) => s + Math.abs(m - 1 / n), 0)); }
          const edges = []; const seen = new Set();
          for (let x = 0; x < n; x++) grp.gens.forEach((g) => { const y = g(x), key = grp.sym ? Math.min(x, y) + '-' + Math.max(x, y) : x + '>' + y; if (x !== y && !seen.has(key)) { seen.add(key); edges.push({ from: x, to: y }); } });
          const nodes = grp.labels.map((l, i) => ({ id: i, label: n <= 16 ? l : '', x: grp.pos ? grp.pos[i][0] : undefined, y: grp.pos ? grp.pos[i][1] : undefined }));
          G.set({ nodes, edges, directed: !grp.sym, layout: grp.pos ? 'none' : 'force', seed: 3, r: n <= 16 ? 14 : 9 });
          if (grp.pos) G.layout('none');
          title = grp.name; reset();
        }
        load();
        let info = {};
        v.animate((t) => {
          const k = clk.due(t, rate.value);
          if (clk.restarted) reset();
          const q = lz.value ? 0.5 : 0;
          for (let i = 0; i < k; i++) { if (!(q && R() < q)) cur = grp.gens[Math.floor(R() * grp.gens.length)](cur); cnt[cur]++; steps++; }
          const mx = Math.max(1, ...cnt);
          G.draw({
            nodeFill: (id) => (id === cur ? 'gold' : steps ? v.ramp(Math.min(1, cnt[id] / mx), 'accent') : null),
            nodeColor: () => 'accent', edgeColor: () => 'muted', edgeWidth: () => 1.3, arrows: !grp.sym,
          });
          s1.setTitle('Cayley graph of ' + title);
          s2.path(tvs.map((y, n) => [n, Math.max(y, 1e-4)]), { color: 'accent', width: 2.2 });
          if (steps <= KMAX) s2.dot(steps, Math.max(tvs[steps], 1e-4), { color: 'gold', r: 6 });
          info = { steps, tv: tvs[Math.min(steps, KMAX)], visited: cnt.filter((c) => c > 0).length, n: grp.n, cur: grp.labels[cur] };
        }, { still: 10 });
        v.legend([['gold', 'walker', { dot: true }], ['accent', 'visits (darker = more)', { dot: true }]]);
        v.readout(() => `$|\\Gamma|=${info.n}$; walker at **${info.cur}**, after $n=${info.steps}$ steps it has visited ${info.visited} of ${info.n} elements.\nExact $\\|\\mu^{*n}-U\\|_{TV}$ at $n=${Math.min(info.steps, KMAX)}$: **${v.fix(info.tv, 4)}**${info.steps > KMAX ? ' (curve ends at 60)' : ''}${tvs[KMAX] > 0.3 ? '. The distance does not go to $0$: the walk is periodic (bipartite Cayley graph).' : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10', kind: 'Model', name: 'Birth-and-death chains',
      statement: String.raw`A **birth-and-death chain** on $\{0,1,\dots,N\}$ (or $\mathbb N$) moves one step at a time: from $i$ it goes up with probability $p_i$, down with probability $q_i$ and stays with probability $r_i=1-p_i-q_i$, where $q_0=0$ and $p_N=0$. It is irreducible iff $p_i>0$ for $i<N$ and $q_i>0$ for $i>0$; it then has a unique stationary distribution, given by detailed balance $\pi_ip_i=\pi_{i+1}q_{i+1}$:
$$\pi_i=\pi_0\prod_{k=1}^{i}\frac{p_{k-1}}{q_k}.$$`,
      idea: String.raw`On a line the flow of probability across the edge $\{i,i+1\}$ can only go up or down through that one edge, so a stationary law has no net flow there: $\pi_ip_i=\pi_{i+1}q_{i+1}$ (detailed balance, by induction from $0$). Multiplying the ratios gives $\pi_i$ and normalising gives $\pi_0$. The drift $p_i-q_i$ pushes the chain towards the level where the two rates balance, and $\pi$ concentrates around it.`,
      caption: String.raw`Drag the blue handles (up probability $p_i$) and orange handles (down probability $q_i$, drawn below the axis) at each level, keeping $p_i+q_i\le1$; or pick a preset. The right panels show one simulated trajectory and the occupation frequencies of a long run against the detailed-balance formula (dots). The dashed line marks where $p_i$ crosses $q_i$.`,
      deps: ['stoch-1.1'], refs: ['LPW §2.5'], tags: ['birth and death', 'detailed balance'],
      viz(v) {
        const N = 12;
        const pre = v.select('preset', [{ value: 'logistic', label: 'logistic' }, { value: 'drift', label: 'constant drift' }, { value: 'sym', label: 'symmetric' }, { value: 'ehr', label: 'Ehrenfest' }], 'logistic', { onChange: () => setPreset() });
        let seed = 4; v.button('resample', () => { seed++; resim(); });
        const s1 = v.stage({ x: [-0.7, N + 0.7], y: [-1.05, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'level $i$', ylabel: '$p_i$ (up), $-q_i$ (down)', title: 'rates at each level (drag the handles)', xticks: Array.from({ length: N + 1 }, (_, i) => i) });
        const s2 = v.stage({ x: [0, 400], y: [-0.5, N + 0.5], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', ylabel: 'level', title: 'a trajectory' });
        const s3 = v.stage({ x: [-0.7, N + 0.7], y: [0, 0.5], axes: 'box', gutter: true, height: 340, xlabel: 'level $i$', ylabel: 'probability', title: 'stationary law vs long-run frequency', xticks: Array.from({ length: N + 1 }, (_, i) => i) });
        const ph = [], qh = [];
        for (let i = 0; i <= N; i++) {
          if (i < N) { const h = s1.handle(i, 0.5, { color: 'accent', r: 7, constrain: (x, y) => [i, Math.max(0, Math.min(1 - (qh[i] ? -qh[i].y : 0), y))] }); ph.push(h); } else ph.push(null);
          if (i > 0) { const h = s1.handle(i, -0.3, { color: 'orange', r: 7, constrain: (x, y) => [i, Math.min(0, Math.max(-(1 - (ph[i] ? ph[i].y : 0)), y))] }); qh.push(h); } else qh.push(null);
        }
        function setPreset() {
          for (let i = 0; i <= N; i++) {
            let p = 0, q = 0; const u = i / N;
            if (pre.value === 'logistic') { p = 0.75 * (1 - u) + 0.02; q = 0.6 * u + 0.02; }
            else if (pre.value === 'drift') { p = 0.55; q = 0.3; }
            else if (pre.value === 'sym') { p = 0.35; q = 0.35; }
            else { p = (N - i) / N; q = u; }
            if (ph[i]) ph[i].set(i, p); if (qh[i]) qh[i].set(i, -q);
          }
          resim();
        }
        const getP = () => ph.map((h, i) => (h ? Math.max(0, h.y) : 0)), getQ = () => qh.map((h) => (h ? Math.max(0, -h.y) : 0));
        let path = [], occ = [], pistat = [];
        function resim() {
          const p = getP(), q = getQ(), R = v.rng(seed * 17 + 1);
          let x = 0; path = [0]; occ = new Array(N + 1).fill(0);
          for (let t = 1; t <= 30000; t++) { const u = R(); x = u < p[x] ? x + 1 : u < p[x] + q[x] ? x - 1 : x; if (t <= 400) path.push(x); if (t > 1000) occ[x]++; }
          occ = occ.map((o) => o / 29000);
          let w = [1]; for (let i = 1; i <= N; i++) w.push(q[i] > 0 ? w[i - 1] * (p[i - 1] / q[i]) : 0);
          const s = w.reduce((a, b) => a + b, 0); pistat = w.map((x) => x / s);
          v.invalidate();
        }
        ph.concat(qh).forEach((h) => { if (h) h.onDrag = resim; });
        setPreset();
        let info = {};
        v.render(() => {
          const p = getP(), q = getQ();
          for (let i = 0; i <= N; i++) { if (i < N) s1.rect(i - 0.28, 0, i + 0.28, p[i], { fill: 'accent', color: 'accent', fillAlpha: 0.4 }); if (i > 0) s1.rect(i - 0.28, -q[i], i + 0.28, 0, { fill: 'orange', color: 'orange', fillAlpha: 0.4 }); }
          let bal = null; for (let i = 0; i < N; i++) if (p[i] - q[i] > 0 && p[i + 1] - q[i + 1] <= 0 && bal === null) bal = i + (p[i] - q[i]) / ((p[i] - q[i]) - (p[i + 1] - q[i + 1]));
          if (bal !== null) { s1.vline(bal, { color: 'green', dash: true, width: 1.6 }); s2.hline(bal, { color: 'green', dash: true, width: 1.6 }); }
          const pts = path.map((x, t) => [t, x]); s2.path(pts, { color: 'accent', width: 1.5 });
          s3.bars(occ, { x0: 0, dx: 1, color: 'accent' });
          s3.dots(pistat.map((x, i) => [i, x]), { color: 'green', r: 5 });
          const mean = pistat.reduce((s, x, i) => s + i * x, 0);
          info = { bal, mean, tv: tvDist(occ, pistat), emean: occ.reduce((s, x, i) => s + i * x, 0) };
        });
        v.legend([['accent', '$p_i$ and long-run frequency', { area: true }], ['orange', '$q_i$', { area: true }], ['green', 'balance level / $\\pi$ (detailed balance)', { dash: true }]]);
        v.readout(() => `${info.bal === null ? 'No level where $p_i$ crosses $q_i$ from above (the drift never changes sign).' : `Rates balance near level $${v.fix(info.bal, 2)}$.`} Mean level under $\\pi_i\\propto\\prod p_{k-1}/q_k$: $${v.fix(info.mean, 2)}$; long-run average of the simulation: $${v.fix(info.emean, 2)}$. Total variation between them: **${v.fix(info.tv, 3)}**.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11', kind: 'Model', name: 'Ehrenfest urn and the hypercube walk',
      statement: String.raw`In the **Ehrenfest model** $N$ balls are divided between two urns. At each step a ball is chosen uniformly at random and moved to the other urn. The number $L_n$ of balls in the left urn is a birth-and-death chain on $\{0,\dots,N\}$ with $p_{k,k-1}=k/N$, $p_{k,k+1}=(N-k)/N$; its stationary law is $\mathrm{Binomial}(N,\tfrac12)$, $\pi_k=\binom Nk2^{-N}$. The full configuration is the simple random walk on the hypercube $\{0,1\}^N$ (flip a uniformly chosen coordinate), whose stationary law is uniform; $L_n$ is the number of coordinates equal to $0$. The chain has period $2$.`,
      idea: String.raw`Detailed balance for the lumped chain: $\pi_k\frac{N-k}{N}=\pi_{k+1}\frac{k+1}{N}$ is satisfied by the binomial weights $\binom Nk$ (because $\binom N{k+1}(k+1)=\binom Nk(N-k)$). On the hypercube the same law is the projection of the uniform measure, and a ball position is a coordinate that is flipped at rate $1/N$ per step. Because the pull back towards $N/2$ is proportional to the displacement, the fluctuations are of order $\sqrt N/2$ and the walk "hovers".`,
      caption: String.raw`Balls hop one at a time (the last mover is gold). The trace is the count in the left urn with its $\pm\sqrt N/2$ band; start from "all left" and watch the pull to $N/2$. The histogram collects occupation frequencies against $\mathrm{Binomial}(N,\frac12)$ (dots). The cube shows the configuration of the first three balls, a lazy walk on $\{0,1\}^3$.`,
      deps: ['stoch-1.1'], refs: ['LPW §2.3'], tags: ['ehrenfest', 'hypercube', 'binomial'],
      credit: 'P. and T. Ehrenfest, 1907',
      viz(v) {
        const Ns = v.slider('balls $N$', 4, 40, 20, { int: true, step: 1, onChange: () => reset() });
        const st0 = v.select('start', [{ value: 'left', label: 'all in left' }, { value: 'half', label: 'half and half' }], 'left', { onChange: () => reset() });
        const rate = v.slider('moves per second', 1, 400, 30, { log: true, int: true });
        v.button('reset', () => reset());
        const s1 = v.stage({ x: [0, 10], y: [0, 5.2], axes: false, height: 280, title: 'two urns', minWidth: 190 });
        const s2 = v.stage({ x: [0, 300], y: [0, 40], axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: 'balls in the left urn', title: 'left urn count $L_n$', minWidth: 190 });
        const s3 = v.stage({ x: [-0.7, 40.7], y: [0, 0.5], axes: 'box', gutter: true, height: 300, xlabel: '$k$ = balls in the left urn', ylabel: 'frequency', title: 'occupation vs binomial', minWidth: 190 });
        const s4 = v.stage({ x: [-0.3, 1.9], y: [-0.3, 1.9], axes: false, equal: true, height: 300, title: 'first three balls: cube $\\{0,1\\}^3$', minWidth: 190 });
        const clk = makeClock();
        let N, bits, L, hist, cnt, steps, R, last;
        function reset() {
          N = Ns.value; R = v.rng(13); bits = Array.from({ length: N }, (_, i) => (st0.value === 'left' ? 0 : i % 2)); // 0 = left urn
          L = bits.filter((b) => b === 0).length; hist = [L]; cnt = new Array(N + 1).fill(0); cnt[L]++; steps = 0; last = -1; clk.reset(); v.invalidate();
        }
        reset();
        const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
        const cube = (b) => [b[0] + 0.45 * b[2], b[1] + 0.45 * b[2]];
        let info = {};
        v.animate((t) => {
          const k = clk.due(t, rate.value);
          if (clk.restarted) reset();
          for (let i = 0; i < k; i++) { const j = Math.floor(R() * N); bits[j] ^= 1; L += bits[j] === 0 ? 1 : -1; last = j; steps++; cnt[L]++; if (hist.length < 4000) hist.push(L); }
          // urns: left box [0.2,4.6], right [5.4,9.8]; balls on grids
          s1.rect(0.2, 0.3, 4.6, 4.7, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.04 }); s1.rect(5.4, 0.3, 9.8, 4.7, { color: 'ink', width: 2, fill: 'orange', fillAlpha: 0.04 });
          const cols = Math.ceil(Math.sqrt(N * 1.3)), place = [0, 0];
          const slot = (side, idx) => { const r = Math.floor(idx / cols), c = idx % cols; return [(side ? 5.4 : 0.2) + 0.4 + (c * 3.6) / Math.max(cols - 1, 1), 0.7 + (r * 3.4) / Math.max(Math.ceil(N / cols) - 1, 1)]; };
          for (let j = 0; j < N; j++) { const side = bits[j]; const [x, y] = slot(side, place[side]++); s1.dot(x, y, { r: j === last ? 8 : 6, color: j === last ? 'gold' : side ? 'orange' : 'accent', ...{} }); }
          s1.text(`left: ${L}`, 2.4, 4.95, { size: 13, color: 'accent', align: 'center' }); s1.text(`right: ${N - L}`, 7.6, 4.95, { size: 13, color: 'orange', align: 'center' });
          const T = Math.max(300, Math.ceil(steps / 100) * 100);
          s2.setView([0, T], [0, N]);
          s2.hband(N / 2 - Math.sqrt(N) / 2, N / 2 + Math.sqrt(N) / 2, { color: 'green', alpha: 0.12 }); s2.hline(N / 2, { color: 'green', dash: true });
          s2.path(hist.map((y, x) => [x, y]), { color: 'accent', width: 1.4 });
          s3.setView([-0.7, N + 0.7], [0, Math.max(0.2, ...cnt.map((c) => c / (steps + 1)), binom(N, Math.floor(N / 2)) / 2 ** N) * 1.15]);
          const emp = cnt.map((c) => c / (steps + 1)), pi = Array.from({ length: N + 1 }, (_, k) => binom(N, k) / 2 ** N);
          s3.bars(emp, { x0: 0, dx: 1, color: 'accent' }); s3.dots(pi.map((p, k) => [k, p]), { color: 'green', r: 4 });
          const verts = []; for (let m = 0; m < 8; m++) verts.push([m & 1, (m >> 1) & 1, (m >> 2) & 1]);
          verts.forEach((a, i) => verts.forEach((b, j) => { if (i < j && a.reduce((s, x, k) => s + Math.abs(x - b[k]), 0) === 1) { const [x1, y1] = cube(a), [x2, y2] = cube(b); s4.line(x1, y1, x2, y2, { color: 'muted', width: 1.5 }); } }));
          verts.forEach((a) => { const [x, y] = cube(a); s4.dot(x, y, { r: 9, color: 'accent', hollow: true }); });
          const cur = bits.slice(0, 3); const [cx, cy] = cube(cur); s4.dot(cx, cy, { r: 9, color: 'gold' });
          info = { L, steps, tv: tvDist(emp, pi), mean: hist.reduce((a, b) => a + b, 0) / hist.length };
        }, { still: 25 });
        v.legend([['accent', 'left urn / histogram', { dot: true }], ['orange', 'right urn', { dot: true }], ['green', 'Binomial$(N,\\frac12)$, band $N/2\\pm\\sqrt N/2$', { dot: true }]]);
        v.readout(() => `$n=${info.steps}$: $L_n=${info.L}$ of $N=${N}$. Time-average of $L_n$ so far: $${v.fix(info.mean, 2)}$ (target $N/2=${N / 2}$). Total variation between occupation frequencies and $\\mathrm{Binomial}(N,\\frac12)$: **${v.fix(info.tv, 3)}**.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12', kind: 'Model', name: 'Markov text generation (Markov 1913, Shannon 1948)',
      statement: String.raw`An **order-$k$ Markov text model** treats a text as a realisation of a chain whose state is the last $k$ symbols: from a context $c$, the next symbol $a$ is drawn with probability $\hat p(a\mid c)=N(ca)/N(c\cdot)$ (counts in a training text). Order $0$ is i.i.d. letters, order $1$ the transition matrix between adjacent letters. In 1913 Markov classified the letters of Pushkin's *Eugene Onegin* only as vowel/consonant and showed that the two-state chain fitted the dependence; Shannon (1948) generated approximations of English from letter- and word-level chains of growing order.`,
      idea: String.raw`Every $\hat p(\cdot\mid c)$ is a row of a stochastic matrix over contexts, so generation is a Markov chain on the $k$-letter windows; the transition matrix of order $k$ is $27^k\times27^k$ but extremely sparse. Higher order captures longer dependencies (the conditional entropy $H(X_{n+1}\mid X_{n-k+1..n})$ falls with $k$), but on a finite text the contexts become unique and the model simply copies the training data: the entropy hits $0$ and generated passages are quotations.`,
      caption: String.raw`The corpus is a short public-domain passage (typed from memory, punctuation stripped). Choose letters or words, set the order $k$, and generate text; the heat map is the order-1 transition matrix of the corpus (rows: current symbol, columns: next). The curve shows the estimated conditional entropy per letter for $k=0,\dots,4$. At high order the output is mostly copied from the passage: the readout counts how much of it is new.`,
      deps: ['stoch-1.1'], refs: ['Grimmett–Stirzaker §6.1'], tags: ['text', 'entropy', 'language models'],
      credit: 'A. A. Markov 1913; C. E. Shannon 1948',
      viz(v) {
        const lvl = v.select('symbols', [{ value: 'letter', label: 'letters' }, { value: 'word', label: 'words' }], 'letter', { onChange: () => v.invalidate() });
        const ord = v.slider('order $k$', 0, 4, 2, { int: true, step: 1 });
        const len = v.slider('length', 60, 400, 240, { int: true, step: 20 });
        let seed = 3; v.button('generate again', () => { seed++; v.invalidate(); });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: 'order-1 transition matrix of the corpus' });
        const s2 = v.stage({ x: [-0.4, 4.4], y: [0, 5], axes: 'box', gutter: true, height: 340, xlabel: 'context length $k$', ylabel: 'bits per letter', title: 'conditional entropy $H(X_{n+1}\\mid\\text{previous }k)$', xticks: [0, 1, 2, 3, 4] });
        const T = v.table(s1, { rows: 27, cols: 27, size: 9, maxCell: 18, minCell: 7, labelSize: 9 });
        const chars = CLEAN.split(''), words = CLEAN.split(' ');
        const Hs = [0, 1, 2, 3, 4].map((k) => condEntropy(chars, k));
        // Markov's vowel/consonant chain on the passage
        const isV = (c) => 'aeiou'.includes(c);
        let vv = 0, vc = 0, cv = 0, cc = 0; for (let i = 0; i + 1 < chars.length; i++) { const a = chars[i], b = chars[i + 1]; if (a === ' ' || b === ' ') continue; if (isV(a)) (isV(b) ? vv++ : vc++); else (isV(b) ? cv++ : cc++); }
        const letters = chars.filter((c) => c !== ' '), pV = letters.filter(isV).length / letters.length;
        const top = (() => { const f = new Map(); words.forEach((w) => f.set(w, (f.get(w) || 0) + 1)); return [...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((e) => e[0]); })();
        let out = '', novel = 0;
        function generate() {
          const toks = lvl.value === 'letter' ? chars : words, k = Math.min(ord.value, lvl.value === 'word' ? 3 : 4), M = ngramModel(toks, k), R = v.rng(seed * 101 + 5);
          const pick = (m) => { let tot = 0; m.forEach((c) => (tot += c)); let u = R() * tot, last = null; for (const [a, c] of m) { last = a; u -= c; if (u < 0) return a; } return last; };
          let ctx = toks.slice(0, k), res = [...ctx];
          const target = lvl.value === 'letter' ? len.value : Math.round(len.value / 5.5);
          if (k === 0) { const m = ngramModel(toks, 0).get(''); res = []; for (let i = 0; i < target; i++) res.push(pick(m)); }
          else while (res.length < target) {
            const m = M.get(ctx.join('\u0001'));
            if (!m) { ctx = toks.slice(0, k); continue; }
            const a = pick(m); res.push(a); ctx = [...ctx.slice(1), a];
          }
          out = lvl.value === 'letter' ? res.join('') : res.join(' ');
          const W = 12, text = lvl.value === 'letter' ? CLEAN : CLEAN; let nv = 0, tot = 0;
          const flat = out.replace(/ +/g, ' ');
          for (let i = 0; i + W <= flat.length; i++) { tot++; if (!text.includes(flat.slice(i, i + W))) nv++; }
          novel = tot ? nv / tot : 0;
        }
        v.render(() => {
          generate();
          const labs = lvl.value === 'letter' ? LETTERS.split('') : top;
          const toks = lvl.value === 'letter' ? chars : words, M = ngramModel(toks, 1), n = labs.length;
          const mat = labs.map((a) => { const m = M.get(a); const tot = m ? [...m.values()].reduce((x, y) => x + y, 0) : 0; return labs.map((b) => (m && tot ? (m.get(b) || 0) / tot : 0)); });
          T.draw({ rows: n, cols: n, rowLabels: labs.map((c) => (c === ' ' ? '␣' : c)), colLabels: labs.map((c) => (c === ' ' ? '␣' : c)), value: () => '', fill: (i, j) => (mat[i][j] > 0 ? ['accent', Math.min(0.95, 0.12 + 1.6 * mat[i][j])] : null), size: n > 20 ? 9 : 11, maxCell: n > 20 ? 18 : 28 });
          s2.bars(Hs, { x0: 0, dx: 1, color: (val, i) => (i === ord.value ? 'gold' : 'accent') });
          s2.hline(Math.log2(27), { color: 'muted', dash: true }); s2.text('$\\log_2 27=4.75$', 4.35, Math.log2(27) + 0.18, { size: 11, color: 'muted', align: 'right' });
        });
        v.legend([['accent', 'bigram frequency / entropy of order $k$', { area: true }], ['gold', 'chosen order', { area: true }]]);
        v.readout(() => `**Generated (${lvl.value === 'letter' ? 'letters' : 'words'}, order ${Math.min(ord.value, lvl.value === 'word' ? 3 : 4)}):** ${out}\nAbout ${Math.round(100 * novel)}% of its 12-letter windows do not occur in the corpus. Corpus: ${chars.length} symbols; entropy $H_${ord.value}=${v.fix(Hs[ord.value], 2)}$ bits.\nMarkov's vowel/consonant chain on this corpus: $\\Pr(V)=${v.fix(pV, 3)}$, $\\Pr(V\\mid V)=${v.fix(vv / (vv + vc), 3)}$, $\\Pr(V\\mid C)=${v.fix(cv / (cv + cc), 3)}$ (Markov 1913, *Onegin*, 20 000 letters: $0.432$, $0.128$, $0.663$).`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13', kind: 'Paper', name: 'Extending the law of large numbers to dependent quantities',
      paper: { authors: 'A. A. Markov', year: 1906, title: 'Распространение закона больших чисел на величины, зависящие друг от друга (Extension of the law of large numbers to quantities depending on each other)', venue: 'Izvestiya Fiziko-matematicheskogo obshchestva pri Kazanskom universitete (2) 15: 135–156' },
      introduces: ['stoch-1.1', 'stoch-1.4'],
      statement: String.raw`Markov showed that the law of large numbers does not need independence. For trials with two outcomes, $0$ and $1$, whose probabilities depend on the previous outcome (what are now called two-state Markov chains), the frequency $S_n/n$ of the outcome $1$ converges in probability to a constant, namely the stationary share $\pi_1=\alpha/(\alpha+\beta)$. His tool was Chebyshev's inequality, $\Pr(|S_n/n-\pi_1|>\varepsilon)\le\operatorname{Var}(S_n)/(n^2\varepsilon^2)$, together with a computation showing $\operatorname{Var}(S_n)=O(n)$ because the dependence decays geometrically at rate $|1-\alpha-\beta|$.`,
      idea: String.raw`Before: Chebyshev and others had proved the law of large numbers for independent variables, and in 1902 P. A. Nekrasov had argued that independence is *necessary* for it (a claim with theological overtones about statistics and free will). What the paper did: it replaced independence by a dependence that fades fast (conditionally on the last outcome, the past is irrelevant), bounded the variance of the sum using the correlations $\operatorname{Cov}(X_0,X_k)=\pi_0\pi_1(1-\alpha-\beta)^k$, and applied Chebyshev. What it changed: it introduced the simplest Markov chains (stoch-1.1) and the geometric decay of $P^n$ for two states (stoch-1.4) as an analytic tool; Markov followed with a central limit theorem for chains in 1908.`,
      caption: String.raw`Set the two switching probabilities (the third strip shows the dependent outcomes of one run). Left: running frequencies $S_k/k$ of 12 independent runs funnel into the stationary share (green); the dashed envelope is $\pm2\sigma/\sqrt k$. Right: over 1500 runs, the spread of $S_n/n$ at the chosen $n$ against the normal curve. Markov's Chebyshev bound is compared with the simulated probability of a deviation $>\varepsilon$ in the readout. No original data exist for this paper; the experiment is a modern simulation of its claim.`,
      deps: ['prob-2.2.14'], refs: [], tags: ['law of large numbers', 'dependence'], verify: true, credit: 'A. A. Markov, 1906',
      viz(v) {
        const a = v.slider('$\\alpha$ = P(0→1)', 0.02, 0.98, 0.15, { step: 0.01, onChange: () => resim() });
        const b = v.slider('$\\beta$ = P(1→0)', 0.02, 0.98, 0.3, { step: 0.01, onChange: () => resim() });
        const nn = v.slider('$n$', 10, 1000, 200, { log: true, int: true });
        const eps = v.slider('$\\varepsilon$', 0.01, 0.2, 0.05, { step: 0.005 });
        let seed = 2; v.button('new runs', () => { seed++; resim(); });
        const K = 1000, M = 1500;
        const s1 = v.stage({ x: [0, K], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'number of trials $k$', ylabel: 'frequency $S_k/k$', title: 'running frequency of state 1' });
        const s2 = v.stage({ x: [0, 1], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: '$S_n/n$', ylabel: 'density', title: 'spread over many runs at $n$' });
        const s3 = v.stage({ x: [0, 100], y: [0, 1], axes: false, height: 110, title: 'outcomes of one run' });
        let runs, S;
        function resim() {
          const A = a.value, B = b.value, R = v.rng(seed * 977 + 1), pi1 = A / (A + B);
          S = new Uint16Array(M * (K + 1)); runs = [];
          for (let r = 0; r < M; r++) {
            let x = R() < pi1 ? 1 : 0, c = 0; const base = r * (K + 1);
            for (let k = 1; k <= K; k++) { c += x; S[base + k] = c; x = R() < (x === 0 ? A : B) ? 1 - x : x; }
          }
          // a single displayed run, regenerated with the same seed for the strip
          const R2 = v.rng(seed * 5 + 9); let x = R2() < pi1 ? 1 : 0; runs = []; for (let k = 0; k < 100; k++) { runs.push(x); x = R2() < (x === 0 ? A : B) ? 1 - x : x; }
          v.invalidate();
        }
        resim();
        let info = {};
        v.render(() => {
          const A = a.value, B = b.value, lam = 1 - A - B, pi1 = A / (A + B), sig2 = pi1 * (1 - pi1) * (1 + lam) / (1 - lam), sig = Math.sqrt(sig2);
          const env = [], envm = []; for (let k = 5; k <= K; k += 5) { env.push([k, Math.min(1, pi1 + 2 * sig / Math.sqrt(k))]); envm.push([k, Math.max(0, pi1 - 2 * sig / Math.sqrt(k))]); }
          s1.path(env, { color: 'orange', width: 1, dash: true }); s1.path(envm, { color: 'orange', width: 1, dash: true });
          for (let r = 0; r < 12; r++) { const pts = []; for (let k = 5; k <= K; k += 5) pts.push([k, S[r * (K + 1) + k] / k]); s1.path(pts, { color: STATE[r % 4], width: 1.3, alpha: 0.85 }); }
          s1.hline(pi1, { color: 'green', width: 2 });
          s1.vline(nn.value, { color: 'gold', dash: true });
          // histogram at n
          const n = nn.value, vals = []; for (let r = 0; r < M; r++) vals.push(S[r * (K + 1) + n] / n);
          const sd = sig / Math.sqrt(n), xlo = Math.max(0, pi1 - 5 * sd), xhi = Math.min(1, pi1 + 5 * sd);
          s2.setView([xlo, xhi], [0, 1.15 / (sd * Math.sqrt(2 * Math.PI)) * 1.1]);
          s2.hist(vals, { bins: 40, range: [xlo, xhi], density: true, color: 'accent' });
          s2.fn((x) => Math.exp(-0.5 * ((x - pi1) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)), { color: 'green', width: 2, domain: [xlo, xhi] });
          s2.vband(pi1 - eps.value, pi1 + eps.value, { color: 'gold', alpha: 0.08 });
          for (let k = 0; k < 100; k++) s3.rect(k + 0.08, 0.1, k + 0.92, 0.9, { fill: runs[k] ? 'accent' : 'muted', color: runs[k] ? 'accent' : 'muted', fillAlpha: runs[k] ? 0.8 : 0.18, width: 0.5 });
          let out = 0; vals.forEach((x) => { if (Math.abs(x - pi1) > eps.value) out++; });
          const cheb = Math.min(1, sig2 / (n * eps.value ** 2));
          const z = eps.value * Math.sqrt(n) / sig, normal = 2 * (1 - 0.5 * (1 + v.M.erf(z / Math.SQRT2)));
          info = { pi1, lam, sig2, out: out / M, cheb, normal, infl: (1 + lam) / (1 - lam), sd };
        });
        v.legend([['green', '$\\pi_1$ and normal density', { dash: false }], ['orange', '$\\pi_1\\pm2\\sigma/\\sqrt{k}$', { dash: true }], ['gold', 'chosen $n$, band $\\pm\\varepsilon$', { dash: true }]]);
        v.readout(() => `$\\pi_1=${v.fix(info.pi1, 3)}$, correlation factor $\\lambda=1-\\alpha-\\beta=${v.fix(info.lam, 2)}$; $\\operatorname{Var}(S_n)\\approx\\sigma^2n$ with $\\sigma^2=\\pi_0\\pi_1\\frac{1+\\lambda}{1-\\lambda}=${v.fix(info.sig2, 3)}$ (${v.fix(info.infl, 2)} times the independent value).\nAt $n=${nn.value}$, $\\varepsilon=${v.fix(eps.value, 3)}$: simulated $\\Pr(|S_n/n-\\pi_1|>\\varepsilon)=${v.fix(info.out, 3)}$; Markov's Chebyshev bound $\\sigma^2/(n\\varepsilon^2)=${v.fix(info.cheb, 3)}$; modern normal approximation $${v.fix(info.normal, 3)}$. The spread is $\\sigma/\\sqrt n=${v.fix(Math.sqrt(info.sig2 / nn.value), 4)}$, so it shrinks like $1/\\sqrt n$ without independence.`);
        void rowNormalize; void cumRows; void nextState; void pfmt;
      },
    },

    // ───────────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14', kind: 'Paper', name: 'Grundbegriffe der Wahrscheinlichkeitsrechnung',
      paper: { authors: 'A. Kolmogoroff', year: 1933, title: 'Grundbegriffe der Wahrscheinlichkeitsrechnung', venue: 'Ergebnisse der Mathematik und ihrer Grenzgebiete 2 (3), Berlin: Springer', doi: '10.1007/978-3-642-49888-6' },
      introduces: ['prob-1.1.1a', 'prob-2.1.21', 'prob-4.1.1a'],
      statement: String.raw`Kolmogorov's monograph founded probability on measure theory. A probability space is a set $\Omega$ with a field (later: $\sigma$-algebra) $\mathcal F$ of events and a function $\Pr$ on $\mathcal F$ satisfying: $\Pr(A)\ge0$; $\Pr(\Omega)=1$; $\Pr(A\cup B)=\Pr(A)+\Pr(B)$ for disjoint $A,B$ (finite additivity); and a continuity axiom — if $A_1\supset A_2\supset\cdots$ with $\bigcap A_n=\varnothing$ then $\Pr(A_n)\to0$ — which together with the others is equivalent to countable additivity. The book also proves that a consistent family of finite-dimensional distributions extends to a probability measure on the space of infinite sequences (or paths): the extension theorem that constructs stochastic processes.`,
      idea: String.raw`Before 1933 probability was a mixture of combinatorics, limit theorems and informal axioms (von Mises' frequentist collectives, Borel's countable additivity). Kolmogorov observed that Lebesgue's measure and integral already supply the right framework: events are measurable sets, random variables measurable functions, expectation an integral, conditional expectation a Radon–Nikodym derivative. The continuity axiom is what makes infinite constructions legitimate. It introduced probability spaces, independence in the measure-theoretic sense, conditional expectation and the consistency/extension theorem that builds a process (a Markov chain, say) from its finite-dimensional laws.`,
      caption: String.raw`**Left:** the three events' set function on $\Omega=\{1,2,3\}$. Drag the bars for the probabilities of the eight events (singletons, pairs, $\Omega$); the checker tests non-negativity, $\Pr(\Omega)=1$ and additivity over every pair of disjoint events and names the first failure. "Snap" rebuilds an additive function from the three singletons. **Right:** coin-flip cylinder sets of depth $1$–$5$ in $[0,1]$ (cell = first $n$ binary digits; darkness = density against Lebesgue measure). With the consistent family $\Pr_n(w)=\prod p_{w_k}$ the extension to infinite sequences exists; switch to the "inconsistent" family and the marginal check turns red cell by cell. The original paper has no data; its content is the axiom system and the extension theorem.`,
      deps: ['rca-1.18', 'pma-11.12'], refs: [], tags: ['axioms', 'measure theory', 'extension theorem'], credit: 'A. N. Kolmogorov, 1933',
      viz(v) {
        const s1 = v.stage({ x: [-0.6, 7.6], y: [-0.45, 1.15], axes: 'box', gutter: true, height: 340, title: 'a set function on the events of $\\Omega=\\{1,2,3\\}$', ylabel: '$\\Pr(A)$', xticks: [] });
        const EV = Array.from({ length: 8 }, (_, m) => m); // bitmask events; 0 = empty set
        const lab = (m) => (m === 0 ? '∅' : '{' + [1, 2, 3].filter((k) => m & (1 << (k - 1))).join('') + '}');
        const base = [0, 0.2, 0.5, 0.7, 0.3, 0.5, 0.8, 1];
        const hs = EV.map((m) => s1.handle(m, base[m], { color: m === 7 ? 'green' : m === 0 ? 'muted' : 'accent', r: 8, constrain: { x: [m, m], y: [-0.4, 1.1] } }));
        v.button('snap to additive (singletons {1}, {2}, {3})', () => { const w = [hs[1].y, hs[2].y, hs[4].y]; EV.forEach((m) => hs[m].set(m, [1, 2, 4].reduce((s, bit, i) => s + (m & bit ? w[i] : 0), 0))); v.invalidate(); });
        v.button('break additivity', () => { hs[3].set(3, Math.min(1, hs[3].y + 0.25)); v.invalidate(); });
        const p = v.slider('coin bias $p$ = P(digit 1)', 0.05, 0.95, 0.5, { step: 0.01 });
        const fam = v.select('family of laws', [{ value: 'ok', label: 'consistent' }, { value: 'bad', label: 'inconsistent' }], 'ok');
        const s2 = v.stage({ x: [0, 1], y: [0, 5.9], axes: false, height: 340, title: 'cylinder sets of the infinite coin-flip space' });
        let sel = [1, 0, 1];
        s2.onClick((x, y) => { const n = 5 - Math.floor(y); if (n < 1 || n > 5) return; const bits = []; let lo = 0, w = 1; for (let k = 0; k < n; k++) { w /= 2; if (x >= lo + w) { bits.push(1); lo += w; } else bits.push(0); } sel = bits; });
        const prob = (w, n) => { // P_n of word w of length n under the chosen family
          let r = 1; for (let k = 0; k < w.length; k++) { const q = fam.value === 'bad' && k === n - 1 ? 1 - p.value : p.value; r *= w[k] ? q : 1 - q; } return r;
        };
        let info = {};
        v.render(() => {
          // left: bars of the set function
          const val = hs.map((h) => h.y);
          EV.forEach((m) => { const y = val[m]; s1.rect(m - 0.3, 0, m + 0.3, y, { fill: y < 0 ? 'red' : 'accent', color: y < 0 ? 'red' : 'accent', fillAlpha: 0.35 }); s1.text(lab(m), m, -0.4, { size: 13, color: 'ink', align: 'center', baseline: 'middle' }); });
          s1.hline(1, { color: 'green', dash: true, width: 1.2 });
          const neg = EV.filter((m) => val[m] < -1e-9), normOk = Math.abs(val[7] - 1) < 1e-9 && Math.abs(val[0]) < 1e-9;
          let bad = null;
          for (const A of EV) for (const B of EV) { if (A < B && (A & B) === 0 && Math.abs(val[A | B] - val[A] - val[B]) > 1e-9) { bad = bad || [A, B]; } }
          // right: icicle of cylinders
          let incons = 0;
          for (let n = 1; n <= 5; n++) {
            const y = 5 - n + 0.1, W = 2 ** n;
            for (let c = 0; c < W; c++) {
              const w = Array.from({ length: n }, (_, k) => (c >> (n - 1 - k)) & 1), pr = prob(w, n);
              let bad2 = false;
              if (n < 5) { const m2 = prob([...w, 0], n + 1) + prob([...w, 1], n + 1); bad2 = Math.abs(m2 - pr) > 1e-9; if (bad2) incons++; }
              const dens = pr * W, isSel = sel.length === n && sel.every((b, k) => b === w[k]), onPath = sel.length >= n && sel.slice(0, n).every((b, k) => b === w[k]);
              s2.rect(c / W + 0.002, y, (c + 1) / W - 0.002, y + 0.8, { fill: bad2 ? 'red' : 'accent', color: isSel ? 'gold' : onPath ? 'ink' : bad2 ? 'red' : 'accent', width: isSel ? 3 : onPath ? 1.6 : 0.6, fillAlpha: Math.min(0.9, 0.05 + 0.4 * dens) });
              if (n <= 3) s2.text(pr.toFixed(n === 3 ? 2 : 2), (c + 0.5) / W, y + 0.4, { size: n === 1 ? 12 : 11, color: 'ink', align: 'center', baseline: 'middle' });
            }
          }
          s2.text('$\\Omega=\\{0,1\\}^{\\mathbb N}\\cong[0,1]$', 0.5, 5.55, { size: 12, color: 'muted', align: 'center' });
          const pw = prob(sel, sel.length), kids = sel.length < 5 ? prob([...sel, 0], sel.length + 1) + prob([...sel, 1], sel.length + 1) : null;
          info = { neg, normOk, bad, incons, sum: val[7], pw, kids, ones: p.value };
        });
        v.legend([['accent', 'mass / density', { area: true }], ['red', 'violation', { area: true }], ['gold', 'selected cylinder (click a cell)', { area: true }]]);
        v.readout(() => {
          const L = (m) => lab(m);
          const ax = info.neg.length ? `**III fails**: $\\Pr(${L(info.neg[0])})<0$.` : info.normOk ? 'III (non-negative) and IV ($\\Pr(\\Omega)=1,\\ \\Pr(\\varnothing)=0$) hold.' : `**IV fails**: $\\Pr(\\Omega)=${v.fix(info.sum, 2)}$ or $\\Pr(\\varnothing)\\ne0$.`;
          const add = info.bad ? `**V fails** for the disjoint pair ${L(info.bad[0])}, ${L(info.bad[1])}: $\\Pr(${L(info.bad[0] | info.bad[1])})=${v.fix(hs[info.bad[0] | info.bad[1]].y, 2)}\\ne ${v.fix(hs[info.bad[0]].y + hs[info.bad[1]].y, 2)}$.` : 'V (additivity over all disjoint pairs) holds.';
          return `${ax} ${add}\nCylinder $[${sel.join('')}]$: $\\Pr_${sel.length}=${v.fix(info.pw, 4)}$${info.kids === null ? '' : `; children sum to $${v.fix(info.kids, 4)}$ ${Math.abs(info.kids - info.pw) < 1e-9 ? '(consistent, so the family extends to a measure)' : '(**inconsistent**: no measure restricts to both laws)'}`}. Continuity: $\\Pr(\\text{first }n\\text{ digits all }1)=p^n\\to0$ (e.g. $n=5$: ${v.fix(info.ones ** 5, 4)}$).`;
        });
      },
    },
  ],
};
