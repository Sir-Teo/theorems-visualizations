// Stochastic Processes — Chapter 2: Hitting times, absorption and random-walk paths (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
import { matMul, cumRows, nextState, ringPos, pfmt, edgesOf, rowNormalize, STATE_COL, solveLin, canReach, hitProb, meanHit, simHits, binom } from './ch02.shared.js';

/** The seven-state "maze with a trap" used by 2.1 and 2.2 (state 6 is absorbing). */
const MAZE = {
  names: ['0', '1', '2', '3', '4', '5', '6'],
  P: [
    [0, 0.5, 0.5, 0, 0, 0, 0],
    [0.2, 0, 0, 0.5, 0.3, 0, 0],
    [0.3, 0, 0, 0, 0.4, 0.3, 0],
    [0, 0.5, 0, 0, 0.5, 0, 0],
    [0, 0, 0.2, 0.4, 0, 0, 0.4],
    [0, 0, 0.5, 0, 0, 0, 0.5],
    [0, 0, 0, 0, 0, 0, 1],
  ],
  pos: [[1.4, 3], [3.4, 5.2], [3.4, 1.6], [7, 5.2], [6, 3], [5, 0.6], [8, 1.5]],
};

export default {
  collection: 'stoch',
  chapter: 2,
  title: 'Hitting times, absorption and random-walk paths',
  summary: String.raw`How likely is a chain to reach a target set, and how long does it take? Both quantities solve linear equations obtained by conditioning on the first step, and they are the minimal nonnegative solutions. The fundamental matrix of an absorbing chain packages all the expected visit counts at once, and gambler's ruin and snakes and ladders are its classical applications. Stopping times and the strong Markov property let a chain restart at random times, harmonic functions turn hitting probabilities into a boundary-value problem, and for simple random walk counting paths with the reflection principle gives the ballot theorem, the distribution of first-passage times and the counterintuitive arcsine laws.`,
  items: [
    // ───────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1', kind: 'Definition', name: 'Hitting times and absorption probabilities',
      statement: String.raw`Let $(X_n)$ be a Markov chain on a countable set $S$ with transition matrix $P$, and let $A\subseteq S$. The **hitting time** of $A$ is $H^A=\inf\{n\ge 0: X_n\in A\}$, with $H^A=\infty$ if $A$ is never reached. Starting from $i$, the **hitting probability** is $h^A_i=\Pr_i(H^A<\infty)$ and the **mean hitting time** is $k^A_i=\mathbb E_i[H^A]$ (which is $+\infty$ unless $h^A_i=1$). If $A$ is a closed class, $h^A_i$ is called the **absorption probability** and $H^A$ the absorption time. Always $h^A_i=1$ and $k^A_i=0$ for $i\in A$.`,
      idea: String.raw`Both numbers are expectations of functions of the whole future path: $h^A_i=\mathbb E_i[\mathbf 1\{H^A<\infty\}]$ and $k^A_i=\mathbb E_i[H^A]$. Because the chain restarts afresh at every step (Markov property of 1.1), they obey a closed system of equations, the first-step equations proved in 2.2 and 2.3. Here we only meet the objects: many independent walkers are released from every state and the frequencies of arrival, and their average arrival times, are the Monte Carlo estimates of $h^A_i$ and $k^A_i$.`,
      caption: String.raw`Shift-click states to put them in (or take them out of) the target set $A$ (green discs). Every state is shaded by how many of the walkers started there reached $A$ (blue: all of them, orange: some, red: none), and the label gives the observed fraction and mean arrival time. The bar charts compare the simulation with the exact values from 2.2 and 2.3. In the maze, state 6 is a trap: walkers who fall into it never come back.`,
      deps: ['stoch-1.1'], refs: ['Norris §1.3'], tags: ['hitting times', 'absorption'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'maze', label: 'maze with a trap' }, { value: 'ring', label: '8-cycle' }], 'maze', { onChange: () => rebuild() });
        const Nw = v.slider('walkers per state', 50, 3000, 400, { log: true, int: true, onChange: () => resim() });
        let seed = 4;
        v.button('resample', () => { seed++; resim(); });
        const s1 = v.stage({ x: [0, 10], y: [-0.2, 6], axes: false, equal: true, height: 330, title: 'the chain (shift-click: toggle target)' });
        const s2 = v.stage({ x: [-0.7, 7.7], y: [0, 1.1], axes: 'box', gutter: true, height: 330, xlabel: 'start state', ylabel: 'fraction reaching $A$', title: 'hitting probability $h_i$' });
        const s3 = v.stage({ x: [-0.7, 7.7], y: [0, 10], axes: 'box', gutter: true, height: 330, xlabel: 'start state', ylabel: 'mean arrival time', title: 'mean hitting time $k_i$' });
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, nodes: [{ id: 0, x: 1, y: 1 }], edges: [], r: 16 });
        let names, P, n, tgt, h, k, sim, topY = 10;
        function rebuild() {
          if (kind.value === 'maze') { names = MAZE.names; P = MAZE.P; tgt = P.map((_, i) => i === 3); }
          else {
            n = 8; names = Array.from({ length: n }, (_, i) => String(i));
            P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === (i + 1) % n || j === (i + n - 1) % n ? 0.5 : 0)));
            tgt = P.map((_, i) => i === 0);
          }
          n = P.length;
          const pos = kind.value === 'maze' ? MAZE.pos : ringPos(n, 2.3).map(([x, y]) => [5 + x * 1.35, 3 + y * 1.25]);
          G.set({ directed: true, layout: 'none', r: 16, draggable: false,
            nodes: names.map((nm, i) => ({ id: i, label: nm, x: pos[i][0], y: pos[i][1], notePos: kind.value === 'maze' ? (i === 4 ? 'e' : pos[i][1] > 3.1 ? 'n' : 's') : (Math.abs(pos[i][0] - 5) > 1 ? (pos[i][0] > 5 ? 'e' : 'w') : (pos[i][1] > 3 ? 'n' : 's')) })),
            edges: edgesOf(P) });
          s2.setView([-0.7, n - 0.3], [0, 1.1]); s3.setView([-0.7, n - 0.3], [0, 10]);
          resim();
        }
        function resim() {
          const R = v.rng(seed * 31 + 7);
          h = hitProb(P, tgt); k = meanHit(P, tgt, h);
          sim = simHits(P, tgt, R, Nw.value, 600, nextState, cumRows);
          const fin = k.filter((x) => isFinite(x));
          const top = Math.max(2, ...fin, ...sim.mean.filter((x) => isFinite(x))) * 1.25;
          topY = top; s3.setView([-0.7, n - 0.3], [0, top]);
          v.invalidate();
        }
        G.onClick = ({ node, id }) => {
          if (node == null) return true;
          const i = id !== undefined ? id : node.id;
          const next = tgt.slice(); next[i] = !next[i];
          if (next.some(Boolean)) { tgt = next; resim(); }
          return true;
        };
        rebuild();
        v.render(() => {
          G.draw({
            nodeFill: (id) => (tgt[id] ? 'green' : null),
            nodeColor: (id) => (tgt[id] ? 'green' : sim.frac[id] > 0.995 ? 'blue' : sim.frac[id] > 0 ? 'orange' : 'red'),
            nodeNote: (id) => (tgt[id] ? 'in A' : `${v.fix(sim.frac[id], 2)} | ${isFinite(sim.mean[id]) ? v.fix(sim.mean[id], 1) : '–'}`),
            edgeWidth: (e) => 1 + 4 * e.w, edgeLabel: (e) => (kind.value === 'maze' ? pfmt(e.w) : null),
          });
          const col = (i) => (tgt[i] ? 'green' : 'accent');
          s2.bars(sim.frac, { x0: 0, dx: 1, color: (x, i) => col(i) });
          h.forEach((x, i) => s2.dot(i, x, { color: 'ink', r: 5 }));
          s2.hline(1, { color: 'faint', dash: true });
          s3.bars(sim.mean.map((x) => (isFinite(x) ? x : 0)), { x0: 0, dx: 1, color: (x, i) => col(i) });
          k.forEach((x, i) => { if (isFinite(x)) s3.dot(i, x, { color: 'ink', r: 5 }); else s3.tex('\\infty', i, topY * 0.85, { color: 'red', size: 22, align: 'center' }); });
        });
        v.legend([['accent', 'simulated', { area: true }], ['ink', 'exact (2.2, 2.3)', { dot: true }], ['green', 'target set $A$', { dot: true }]]);
        v.readout(() => {
          let eh = 0, ek = 0;
          for (let i = 0; i < n; i++) { eh = Math.max(eh, Math.abs(sim.frac[i] - h[i])); if (isFinite(k[i]) && isFinite(sim.mean[i])) ek = Math.max(ek, Math.abs(sim.mean[i] - k[i])); }
          const trapped = h.map((x, i) => (x < 1 - 1e-9 && !tgt[i] ? i : -1)).filter((i) => i >= 0);
          return `$A=\\{${tgt.map((t, i) => (t ? names[i] : null)).filter((x) => x !== null).join(',')}\\}$. Largest gap between simulation and exact hitting probability: **${v.fix(eh, 3)}**; between mean arrival times: **${v.fix(ek, 2)}**.\n${trapped.length ? `From ${trapped.map((i) => names[i]).join(', ')} the target is missed with positive probability, so $k_i=\\infty$ there (the simulated mean averages only the walkers that arrived).` : 'Every state reaches $A$ with probability one, so all mean hitting times are finite.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2', kind: 'Theorem', name: 'Hitting probabilities are the minimal solution of the first-step equations',
      statement: String.raw`Let $A\subseteq S$. The vector of hitting probabilities $h^A=(h^A_i)_{i\in S}$ is the **minimal nonnegative solution** of
$$h_i=1\ (i\in A),\qquad h_i=\sum_{j}p_{ij}h_j\ (i\notin A).$$
That is, $h^A$ solves the system, and every nonnegative solution $g$ satisfies $g_i\ge h^A_i$ for all $i$. Moreover $h^A_i=\lim_{m\to\infty}h^{(m)}_i$, where $h^{(m)}_i=\Pr_i(H^A\le m)$ is obtained by starting from $h^{(0)}=\mathbf 1_A$ and iterating $h^{(m+1)}=\mathbf 1_A+\mathbf 1_{A^c}\,Ph^{(m)}$, and the iterates increase with $m$.`,
      idea: String.raw`Condition on the first step: from $i\notin A$ the chain is at $j$ after one step, and the hitting problem restarts there (Markov property), which gives the equations. For minimality, take any nonnegative solution $g$. Then $g\ge\mathbf 1_A=h^{(0)}$, and if $g\ge h^{(m)}$ then $g=\mathbf 1_A+\mathbf 1_{A^c}Pg\ge \mathbf 1_A+\mathbf 1_{A^c}Ph^{(m)}=h^{(m+1)}$; so $g\ge h^{(m)}$ for all $m$, and letting $m\to\infty$ (monotone convergence, since $h^{(m)}_i=\Pr_i(H^A\le m)\uparrow\Pr_i(H^A<\infty)$) gives $g\ge h^A$. Non-uniqueness is real: if the chain can wander forever outside $A$, the all-ones vector also solves the system.`,
      caption: String.raw`Bars are the iterate $h^{(m)}$; drag $m$ upward and they climb to the exact minimal solution (black dots) and to the simulated hitting frequency (orange ticks). Raise the starting level $s$ on the non-target states: with $s=0$ the iteration rises to the minimal solution, but with $s=1$ it sits at the all-ones solution forever, and intermediate $s$ converge to other solutions lying above the minimal one. In the drifting walk the minimal solution is $(q/p)^i$ although $h\equiv 1$ also solves the equations.`,
      deps: ['stoch-2.1'], refs: ['Norris §1.3'], tags: ['hitting times', 'minimal solution'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'maze', label: 'maze, target {3}' }, { value: 'drift', label: 'walk drifting away from 0' }], 'drift', { onChange: () => rebuild() });
        const m = v.slider('iterations $m$', 0, 120, 6, { int: true, step: 1 });
        const s0 = v.slider('starting level $s$ off the target', 0, 1, 0, { step: 0.05, onChange: () => rebuild(true) });
        const s1 = v.stage({ x: [-0.7, 7.7], y: [0, 1.12], axes: 'box', gutter: true, height: 330, xlabel: 'state $i$', ylabel: 'value', title: 'the iterate $h^{(m)}$ vs the minimal solution' });
        const s2 = v.stage({ x: [0, 120], y: [1e-6, 2], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'iteration $m$', ylabel: 'max distance to minimal $h$', title: 'distance to the minimal solution' });
        const M = 24, pUp = 0.65;
        let P, tgt, n, hist, hmin, hsim, K, closedForm;
        function rebuild(keep) {
          if (!keep || !P) {
            if (kind.value === 'maze') { P = MAZE.P; tgt = P.map((_, i) => i === 3); closedForm = null; }
            else {
              P = Array.from({ length: M + 1 }, (_, i) => Array.from({ length: M + 1 }, (_, j) => (i === 0 || i === M ? (i === j ? 1 : 0) : j === i + 1 ? pUp : j === i - 1 ? 1 - pUp : 0)));
              tgt = P.map((_, i) => i === 0);
              closedForm = (i) => ((1 - pUp) / pUp) ** i;
            }
            n = P.length;
            s1.setView([-0.7, n - 0.3], [0, 1.12]);
            const R = v.rng(99); hsim = simHits(P, tgt, R, 1500, 700, nextState, cumRows).frac;
            hmin = hitProb(P, tgt);
          }
          K = kind.value === 'maze' ? 60 : 120; if (m.value > K) m.set(K);
          const h = P.map((_, i) => (tgt[i] ? 1 : s0.value)); hist = [h.slice()];
          let cur = h;
          for (let t = 0; t < 120; t++) {
            cur = cur.map((x, i) => (tgt[i] ? 1 : P[i].reduce((a, p, j) => a + p * cur[j], 0)));
            hist.push(cur);
          }
          s2.setView([0, K], [1e-6, 2]);
          v.invalidate();
        }
        rebuild();
        let info = {};
        v.render(() => {
          const cur = hist[Math.min(m.value, K)];
          const nn = n;
          s1.bars(cur, { x0: 0, dx: 1, color: (x, i) => (tgt[i] ? 'green' : 'accent') });
          s1.hline(1, { color: 'red', dash: true, width: 1.5 });
          s1.text('$h\\equiv 1$ also solves the equations', nn * 0.55, 1.06, { size: 12, color: 'red', align: 'center' });
          hmin.forEach((x, i) => s1.dot(i, x, { color: 'ink', r: 5 }));
          hsim.forEach((x, i) => s1.line(i - 0.3, x, i + 0.3, x, { color: 'orange', width: 2.5 }));
          const err = (t) => Math.max(...hist[t].map((x, i) => Math.abs(x - hmin[i])));
          const pts = []; for (let t = 0; t <= K; t++) pts.push([t, Math.max(1e-6, err(t))]);
          s2.path(pts, { color: 'accent', width: 2.2 });
          s2.vline(Math.min(m.value, K), { color: 'gold', width: 2 });
          s2.dot(Math.min(m.value, K), Math.max(1e-6, err(Math.min(m.value, K))), { color: 'gold', r: 5 });
          let mono = true; for (let t = 0; t < K; t++) for (let i = 0; i < nn; i++) if (hist[t + 1][i] < hist[t][i] - 1e-12) mono = false;
          const resid = Math.max(...cur.map((x, i) => (tgt[i] ? 0 : Math.abs(x - P[i].reduce((a, p, j) => a + p * cur[j], 0)))));
          info = { mono, e: err(Math.min(m.value, K)), resid, above: hist[K].every((x, i) => x >= hmin[i] - 1e-9) };
        });
        v.legend([['accent', 'iterate $h^{(m)}$', { area: true }], ['ink', 'minimal solution', { dot: true }], ['orange', 'simulated frequency'], ['red', 'the solution $h\\equiv1$', { dash: true }]]);
        v.readout(() => `$m=${Math.min(m.value, K)}$: distance to the minimal solution **${info.e < 1e-6 ? '< 10^{-6}' : v.fix(info.e, 4)}**; residual of the first-step equations ${v.fix(info.resid, 4)}.\nIterates nondecreasing in $m$: **${info.mono ? 'yes' : 'no'}** (they start at $s=${v.fix(s0.value, 2)}$ off the target). Limit lies above the minimal solution: **${info.above ? 'yes' : 'no'}**.${closedForm ? ` For the infinite walk $h_i=(q/p)^i$, e.g. $h_5=${v.fix(closedForm(5), 4)}$ against exact ${v.fix(hmin[5], 4)} on this truncation.` : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3', kind: 'Theorem', name: 'Mean hitting times solve the first-step equations',
      statement: String.raw`Let $A\subseteq S$ and $k^A_i=\mathbb E_i[H^A]\in[0,\infty]$. Then $k^A=(k^A_i)$ is the **minimal nonnegative solution** of
$$k_i=0\ (i\in A),\qquad k_i=1+\sum_{j\notin A}p_{ij}k_j\ (i\notin A).$$
If the chain is finite and $h^A_i=1$ for all $i$ outside $A$ (the set $A$ is reached from everywhere with probability one), the system has a unique solution. If $h^A_i<1$ for some $i$, then $k^A_i=\infty$.`,
      idea: String.raw`Count one step and then restart: $H^A=1+H^A\circ\theta_1$ on $\{X_0\notin A\}$, so taking expectations with the Markov property gives the equations; minimality follows exactly as in 2.2 by iterating from $k^{(0)}=0$, since $k^{(m)}_i=\mathbb E_i[\min(H^A,m)]\uparrow k^A_i$. In a finite chain that reaches $A$ surely the matrix $I-Q$ ($Q$ the part of $P$ outside $A$) is invertible, because $Q^m\to0$, so the solution is $k=(I-Q)^{-1}\mathbf 1$. If $A$ can be missed with positive probability the chain spends infinite time in the escape set, and the expectation is infinite.`,
      caption: String.raw`Edit the chain: click empty space to add a state, click two states in turn to add or remove an arrow, click a number to change a weight (rows are normalised into probabilities). **Shift-click a state** to make it the target. Bars are the solution of the linear system, gold dots the average of simulated arrival times. Delete the arrows into the target and the solution blows up to $\infty$ (red crosses).`,
      deps: ['stoch-2.1'], refs: ['Norris §1.3'], tags: ['hitting times', 'linear systems'],
      viz(v) {
        const preset = v.select('example', [{ value: 'a', label: 'five states' }, { value: 'b', label: 'path with an escape' }, { value: 'c', label: 'cycle of six' }], 'a', { onChange: () => load() });
        const Nw = v.slider('walkers per state', 50, 2000, 300, { log: true, int: true });
        let seed = 3; v.button('resample', () => { seed++; v.invalidate(); });
        const s1 = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, title: 'draw a chain (shift-click: target)' });
        const s2 = v.stage({ x: [-0.7, 5.7], y: [0, 10], axes: 'box', gutter: true, height: 340, xlabel: 'state', ylabel: 'expected steps to reach $A$', title: 'mean hitting time $k_i$' });
        const G = v.graph(s1, { directed: true, weights: true, editable: { moveNode: true, addNode: true, addEdge: true, deleteNode: true, deleteEdge: true, editWeight: true, maxWeight: 9 }, layout: 'none', nodes: [{ id: 0, x: 1, y: 1 }], edges: [], r: 16 });
        let targets = new Set([4]);
        const PRE = {
          a: { nodes: [[0, 1, 3], [1, 3.5, 5], [2, 3.5, 1], [3, 6.2, 3], [4, 9, 3]], edges: [[0, 1, 1], [0, 2, 1], [1, 0, 1], [1, 2, 1], [1, 3, 1], [2, 0, 1], [2, 3, 2], [3, 1, 1], [3, 4, 1], [4, 0, 1]], t: [4] },
          b: { nodes: [[0, 1, 3], [1, 3.4, 3], [2, 5.6, 3], [3, 8.8, 3], [4, 5.6, 0.8]], edges: [[0, 1, 1], [1, 0, 1], [1, 2, 1], [2, 1, 1], [2, 3, 1], [2, 4, 1], [3, 3, 1], [4, 4, 1]], t: [3] },
          c: { nodes: [0, 1, 2, 3, 4, 5].map((i) => [i, 5 + 3.2 * Math.cos(Math.PI / 2 - (i * Math.PI) / 3), 3 + 2.4 * Math.sin(Math.PI / 2 - (i * Math.PI) / 3)]), edges: [0, 1, 2, 3, 4, 5].flatMap((i) => [[i, (i + 1) % 6, 1], [(i + 1) % 6, i, 1]]), t: [0] },
        };
        function load() {
          const p = PRE[preset.value];
          G.set({ directed: true, weights: true, layout: 'none', nodes: p.nodes.map(([id, x, y]) => ({ id, x, y })), edges: p.edges.map(([a, b, w]) => ({ from: a, to: b, w })) });
          targets = new Set(p.t); v.invalidate();
        }
        G.onClick = ({ node, id, shift }) => {
          if (shift && (node != null || id != null)) { const i = id !== undefined ? id : node.id; if (targets.has(i)) { if (targets.size > 1) targets.delete(i); } else targets.add(i); v.invalidate(); return true; }
          return false;
        };
        G.onChange = () => v.invalidate();
        load();
        let cacheKey = '', cache = null;
        function solve() {
          const ids = G.nodes.map((nd) => nd.id), idx = new Map(ids.map((id, a) => [id, a])), n = ids.length;
          const W = Array.from({ length: n }, () => new Array(n).fill(0));
          G.edges.forEach((e) => { if (idx.has(e.from) && idx.has(e.to)) W[idx.get(e.from)][idx.get(e.to)] += e.w ?? 1; });
          const P = rowNormalize(W), tg = ids.map((id) => targets.has(id));
          const key = JSON.stringify([P, tg, Nw.value, seed]);
          if (key !== cacheKey) {
            const h = hitProb(P, tg), k = meanHit(P, tg, h);
            const R = v.rng(seed * 13 + 5), sim = simHits(P, tg, R, Nw.value, 1500, nextState, cumRows);
            cacheKey = key; cache = { ids, P, tg, h, k, sim, n };
          }
          return cache;
        }
        let C;
        v.render(() => {
          C = solve();
          const { ids, P, tg, h, k, sim, n } = C;
          const fin = k.filter((x) => isFinite(x)), top = Math.max(3, ...fin, ...sim.mean.filter((x) => isFinite(x))) * 1.25;
          s2.setView([-0.7, n - 0.3], [0, top]);
          s2.setTicks(ids.map((id, i) => [i, String(id)]), null);
          const rs = (a) => G.edges.filter((e) => e.from === ids[a]).reduce((t, e) => t + (e.w ?? 1), 0);
          G.draw({
            nodeFill: (id) => (targets.has(id) ? 'green' : null),
            nodeColor: (id) => (targets.has(id) ? 'green' : h[ids.indexOf(id)] > 1 - 1e-9 ? 'blue' : 'red'),
            nodeNote: (id) => { const a = ids.indexOf(id); return targets.has(id) ? '' : isFinite(k[a]) ? `E = ${v.fix(k[a], 2)}` : 'E = ∞'; },
            edgeLabel: (e) => { const a = ids.indexOf(e.from); return a >= 0 && rs(a) ? pfmt((e.w ?? 1) / rs(a)) : ''; },
          });
          s2.bars(k.map((x, i) => (isFinite(x) ? x : 0)), { x0: 0, dx: 1, color: (x, i) => (tg[i] ? 'green' : 'accent') });
          sim.mean.forEach((x, i) => { if (isFinite(x) && !tg[i]) s2.dot(i, x, { color: 'gold', r: 5 }); });
          k.forEach((x, i) => { if (!isFinite(x)) s2.text('∞', i, top * 0.85, { color: 'red', size: 20, align: 'center' }); });
        });
        v.legend([['accent', 'solution of $k=\\mathbf 1+Qk$', { area: true }], ['gold', 'simulated mean arrival', { dot: true }], ['red', '$k_i=\\infty$']]);
        v.readout(() => {
          const { k, sim, tg, ids, P } = C; let gap = 0;
          k.forEach((x, i) => { if (isFinite(x) && isFinite(sim.mean[i]) && !tg[i]) gap = Math.max(gap, Math.abs(x - sim.mean[i])); });
          let res = 0; k.forEach((x, i) => { if (!tg[i] && isFinite(x)) res = Math.max(res, Math.abs(x - 1 - P[i].reduce((a, p, j) => a + (tg[j] ? 0 : p * (isFinite(k[j]) ? k[j] : 0)), 0))); });
          const bad = ids.filter((id, i) => !isFinite(k[i]));
          return `Targets $A=\\{${ids.filter((id, i) => tg[i]).join(',')}\\}$. Residual of $k_i=1+\\sum_{j\\notin A}p_{ij}k_j$: **${res.toExponential(1)}**; largest gap to the simulation **${v.fix(gap, 2)}** steps.\n${bad.length ? `States ${bad.join(', ')} cannot reach $A$ for sure, so $k=\\infty$ there.` : 'All states reach $A$ with probability one: the solution is finite and unique.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4', kind: 'Model', name: 'Gambler’s ruin',
      statement: String.raw`A gambler with fortune $a\in\{0,1,\dots,N\}$ repeatedly wins one unit with probability $p$ and loses one with probability $q=1-p$, stopping on reaching $0$ (ruin) or $N$ (target). Write $\rho=q/p$. The probability of ruin starting from $a$ is
$$r_a=\frac{\rho^a-\rho^N}{1-\rho^N}\quad(p\ne\tfrac12),\qquad r_a=1-\frac aN\quad(p=\tfrac12),$$
and the expected duration of the game is
$$D_a=\frac{a}{q-p}-\frac{N}{q-p}\cdot\frac{1-\rho^a}{1-\rho^N}\quad(p\ne\tfrac12),\qquad D_a=a(N-a)\quad(p=\tfrac12).$$`,
      idea: String.raw`Both quantities satisfy first-step equations (2.2, 2.3): $r_a=p\,r_{a+1}+q\,r_{a-1}$ with $r_0=1,r_N=0$, and $D_a=1+pD_{a+1}+qD_{a-1}$ with $D_0=D_N=0$. These are linear recurrences with constant coefficients: the first has the general solution $\alpha+\beta\rho^a$ (or $\alpha+\beta a$ when $\rho=1$), and the boundary values fix the constants; for $D$ one adds the particular solution $a/(q-p)$ (or $-a^2$ when $p=\tfrac12$). Because the system has a unique solution here, it is the minimal one.`,
      caption: String.raw`The left panel shows 16 simulated fortunes (green: reach $N$, red: ruined). Move the start $a$, the target $N$ and the bias $p$. The right panel compares the closed-form curve with the frequency of ruin (or the average duration) measured in 400 simulated games from every starting fortune; the gold line marks your $a$. Near $p=\tfrac12$ the games become long, with mean duration $a(N-a)$; a tiny bias makes the house win almost always when $N$ is large.`,
      deps: ['stoch-2.2', 'stoch-2.3'], refs: ['Norris §1.3', 'LPW §2.1'], tags: ['gambler\'s ruin', 'random walk'],
      scope: String.raw`Independent unit bets with fixed probability $p$ and absorbing barriers at $0$ and $N$.`,
      credit: 'Pascal, Fermat and Huygens (1650s); Jacob Bernoulli (published 1713)',
      viz(v) {
        const a = v.slider('start $a$', 1, 29, 8, { int: true, step: 1 });
        const N = v.slider('target $N$', 3, 30, 20, { int: true, step: 1, onChange: () => { if (a.value >= N.value) a.set(N.value - 1); } });
        const p = v.slider('win probability $p$', 0.05, 0.95, 0.5, { step: 0.01 });
        const panel = v.select('right panel', [{ value: 'ruin', label: 'ruin probability' }, { value: 'dur', label: 'mean duration' }], 'ruin');
        let seed = 7; v.button('new games', () => { seed++; v.invalidate(); });
        const s1 = v.stage({ x: [0, 60], y: [-0.5, 30.5], axes: 'box', gutter: true, height: 340, xlabel: 'bet number', ylabel: 'fortune', title: '16 games from $a$' });
        const s2 = v.stage({ x: [0, 20], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'starting fortune $a$', ylabel: 'probability', title: '' });
        const ruinF = (aa, NN, pp) => { if (Math.abs(pp - 0.5) < 1e-9) return 1 - aa / NN; const r = (1 - pp) / pp; return (r ** aa - r ** NN) / (1 - r ** NN); };
        const durF = (aa, NN, pp) => { if (Math.abs(pp - 0.5) < 1e-9) return aa * (NN - aa); const r = (1 - pp) / pp, d = 1 - 2 * pp; return aa / d - (NN / d) * (1 - r ** aa) / (1 - r ** NN); };
        let key = '', paths = [], ruinSim = [], durSim = [];
        function sim() {
          const k = `${N.value}|${p.value}|${a.value}|${seed}`; if (k === key) return; key = k;
          const R = v.rng(seed * 101 + N.value), NN = N.value, pp = p.value;
          paths = [];
          for (let g = 0; g < 16; g++) { const tr = [a.value]; let x = a.value; while (x > 0 && x < NN) { x += R() < pp ? 1 : -1; tr.push(x); } paths.push(tr); }
          ruinSim = []; durSim = [];
          const runs = 400;
          for (let s = 0; s <= NN; s++) {
            let ru = 0, du = 0;
            for (let g = 0; g < runs; g++) { let x = s, t = 0; while (x > 0 && x < NN) { x += R() < pp ? 1 : -1; t++; } if (x === 0) ru++; du += t; }
            ruinSim.push(ru / runs); durSim.push(du / runs);
          }
        }
        v.render(() => {
          sim();
          const NN = N.value, pp = p.value, aa = a.value;
          const T = Math.min(220, Math.max(20, ...paths.map((t) => t.length - 1)));
          s1.setView([0, T * 1.02], [-0.5, NN + 0.5]);
          s1.hline(0, { color: 'red', width: 2 }); s1.hline(NN, { color: 'green', width: 2 });
          paths.forEach((tr) => { const ruined = tr[tr.length - 1] === 0; s1.path(tr.map((y, i) => [i, y]), { color: ruined ? 'red' : 'green', width: 1.2, alpha: 0.55 }); });
          s1.dot(0, aa, { color: 'gold', r: 6 });
          const mode = panel.value;
          const f = mode === 'ruin' ? ruinF : durF, sm = mode === 'ruin' ? ruinSim : durSim;
          const top = mode === 'ruin' ? 1.05 : Math.max(2, ...Array.from({ length: NN + 1 }, (_, s) => f(s, NN, pp)), ...sm) * 1.12;
          s2.setView([0, NN], [0, top]); s2.setTitle(mode === 'ruin' ? 'ruin probability $r_a$' : 'mean duration $D_a$');
          s2.setLabels(undefined, mode === 'ruin' ? 'probability of ruin' : 'expected number of bets');
          s2.path(Array.from({ length: NN + 1 }, (_, s) => [s, f(s, NN, pp)]), { color: 'accent', width: 2.4 });
          sm.forEach((y, s) => s2.dot(s, y, { color: 'orange', r: 3.5 }));
          s2.vline(aa, { color: 'gold', width: 2 });
        });
        v.legend([['accent', 'closed form'], ['orange', '400 simulated games per $a$', { dot: true }], ['green', 'reached $N$'], ['red', 'ruined']]);
        v.readout(() => {
          const NN = N.value, pp = p.value, aa = a.value, rho = (1 - pp) / pp;
          return `$a=${aa},\\ N=${NN},\\ p=${v.fix(pp, 2)}$ (${Math.abs(pp - 0.5) < 1e-9 ? '$\\rho=1$' : `$\\rho=${v.fix(rho, 3)}$`}).\nRuin: formula **${v.fix(ruinF(aa, NN, pp), 4)}**, simulated ${v.fix(ruinSim[aa], 3)}. Mean duration: formula **${v.fix(durF(aa, NN, pp), 2)}**, simulated ${v.fix(durSim[aa], 2)}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5', kind: 'Theorem', name: 'Absorbing chains and the fundamental matrix',
      statement: String.raw`Let a finite chain have transient states $T$ and absorbing states $B$ (every state of $T$ can reach $B$), and write its transition matrix in block form $P=\begin{pmatrix}Q&R\\0&I\end{pmatrix}$, with $Q$ the transitions inside $T$. Then $I-Q$ is invertible and the **fundamental matrix** $F=(I-Q)^{-1}=\sum_{m\ge0}Q^m$ has the following meaning: $F_{ij}$ is the expected number of visits to $j\in T$ (counting time $0$) before absorption, starting from $i\in T$. Consequently the expected time to absorption from $i$ is $\sum_jF_{ij}$ (the $i$-th entry of $F\mathbf 1$), and the probability of being absorbed in $b\in B$ is $(FR)_{ib}$.`,
      idea: String.raw`The number of visits to $j$ by time $m$ has expectation $\sum_{l\le m}(Q^l)_{ij}$ because paths inside $T$ are governed by $Q$ alone. Since every transient state reaches $B$, $Q^m\to0$ geometrically, the series converges, and the Neumann series sums to $(I-Q)^{-1}$; the equations $F=I+QF$ are the first-step equations of 2.3 for the visit counts. Absorption in $b$ happens at the step after the last visit to some $j$, hence $\Pr_i(\text{absorbed in }b)=\sum_jF_{ij}R_{jb}$, which agrees with the minimal solution of 2.2.`,
      caption: String.raw`Each cell of the table is $F_{ij}$, with the simulated average number of visits (over 3000 runs per start) printed small in its corner. Click a state in the diagram to choose the start $i$; the diagram's notes are row $i$ of $F$. The readout gives the expected time to absorption, $\sum_j F_{ij}$, and the absorption probabilities $(FR)_{ib}$ with the simulated frequencies.`,
      deps: ['stoch-2.3'], refs: ['Norris §1.3'], tags: ['absorbing chains', 'fundamental matrix'],
      credit: 'Kemeny & Snell, 1960',
      viz(v) {
        const kind = v.select('chain', [{ value: 'drunk', label: 'drunkard’s walk' }, { value: 'mouse', label: 'mouse in a maze' }, { value: 'random', label: 'random' }], 'mouse', { onChange: () => rebuild() });
        const p = v.slider('step right $p$ (drunkard)', 0.1, 0.9, 0.5, { step: 0.05, onChange: () => { if (kind.value === 'drunk') rebuild(); } });
        let seed = 5; v.button('new random chain', () => { seed++; kind.value = 'random'; rebuild(); });
        const s1 = v.stage({ x: [0, 10], y: [-0.5, 6], axes: false, equal: true, height: 340, title: 'the chain (click a transient state)' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: '$F=(I-Q)^{-1}$ (small: simulated visits)' });
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, nodes: [{ id: 0, x: 1, y: 1 }], edges: [], r: 16 });
        const T = v.table(s2, { rows: 2, cols: 2, size: 14, maxCell: 70 });
        let D, tr, ab, Fm, Bm, simF, simB, start = 0;
        function chain() {
          if (kind.value === 'drunk') {
            const n = 6, q = 1 - p.value;
            const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 || i === n - 1 ? (i === j ? 1 : 0) : j === i + 1 ? p.value : j === i - 1 ? q : 0)));
            return { names: ['0', '1', '2', '3', '4', '5'], P, pos: Array.from({ length: n }, (_, i) => [0.9 + (i * 8.2) / (n - 1), 3]), ab: [0, 5] };
          }
          if (kind.value === 'mouse') {
            const nb = [[1, 2], [0, 3, 4], [0, 3, 5], [1, 2, 5], [4], [5]];
            const P = nb.map((l, i) => Array.from({ length: 6 }, (_, j) => (i >= 4 ? (i === j ? 1 : 0) : l.includes(j) ? 1 / l.length : 0)));
            return { names: ['A', 'B', 'C', 'D', 'cheese', 'cat'], P, pos: [[1.5, 4.8], [4.6, 4.8], [1.5, 1.8], [4.6, 1.8], [8, 4.8], [3.05, 0.2]], ab: [4, 5] };
          }
          const Rr = v.rng(seed * 17 + 3), n = 6;
          const W = Array.from({ length: n }, (_, i) => (i >= 4 ? Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)) : Array.from({ length: n }, (_, j) => (i === j || Rr() < 0.45 ? 0 : 0.2 + Rr()))));
          for (let i = 0; i < 4; i++) { if (!W[i].some((x, j) => x && (j >= 4 || j !== i))) W[i][(i + 1) % 4] = 1; }
          W[3][(Rr() < 0.5 ? 4 : 5)] += 0.8; W[2][(Rr() < 0.5 ? 4 : 5)] += 0.5;
          const P = rowNormalize(W);
          return { names: ['a', 'b', 'c', 'd', 'X', 'Y'], P, pos: [[1.5, 4.8], [4.6, 4.8], [1.5, 1.8], [4.6, 1.8], [8, 4.8], [3.05, 0.2]], ab: [4, 5] };
        }
        function rebuild() {
          D = chain(); const n = D.P.length;
          ab = D.ab; tr = D.P.map((_, i) => i).filter((i) => !ab.includes(i));
          const Q = tr.map((i) => tr.map((j) => D.P[i][j])), Rm = tr.map((i) => ab.map((j) => D.P[i][j]));
          const IQ = Q.map((r, a) => r.map((x, b) => (a === b ? 1 : 0) - x));
          Fm = v.M.inverse(IQ); Bm = Fm.map((row) => ab.map((_, b) => row.reduce((s, f, c) => s + f * Rm[c][b], 0)));
          // simulation
          const C = cumRows(D.P), R = v.rng(seed * 5 + 11), runs = 3000;
          simF = tr.map(() => tr.map(() => 0)); simB = tr.map(() => ab.map(() => 0));
          tr.forEach((s, a) => {
            for (let r = 0; r < runs; r++) { let x = s; for (;;) { const ti = tr.indexOf(x); if (ti < 0) { simB[a][ab.indexOf(x)]++; break; } simF[a][ti]++; x = nextState(C, x, R()); } }
            simF[a] = simF[a].map((c) => c / runs); simB[a] = simB[a].map((c) => c / runs);
          });
          G.set({ directed: true, layout: 'none', r: 16, draggable: false,
            nodes: D.names.map((nm, i) => ({ id: i, label: nm, x: D.pos[i][0], y: D.pos[i][1], notePos: D.pos[i][1] > 3 ? 'n' : (i === 5 ? 'e' : 's') })), edges: edgesOf(D.P, () => ({ bend: 20 })) });
          start = 0; v.invalidate();
        }
        G.onClick = ({ node, id }) => { const i = id !== undefined ? id : node && node.id; if (i != null && tr.includes(i)) { start = tr.indexOf(i); v.invalidate(); } return true; };
        rebuild();
        v.render(() => {
          const s0 = tr[start];
          G.draw({
            nodeFill: (id) => (id === s0 ? 'gold' : null),
            nodeColor: (id) => (ab.includes(id) ? 'red' : STATE_COL[id % 8]),
            nodeNote: (id) => (tr.includes(id) ? `F=${v.fix(Fm[start][tr.indexOf(id)], 2)}` : `→ ${v.fix(Bm[start][ab.indexOf(id)], 2)}`),
            edgeWidth: (e) => 1 + 4 * e.w, edgeLabel: (e) => pfmt(e.w),
          });
          const nt = tr.length;
          const mx = Math.max(...Fm.flat());
          T.draw({
            rows: nt, cols: nt, rowLabels: tr.map((i) => D.names[i]), colLabels: tr.map((i) => D.names[i]), cornerLabel: 'from \\ at', size: 14,
            value: (i, j) => Fm[i][j], format: (x) => v.fix(x, 2), sub: (i, j) => v.fix(simF[i][j], 2),
            fill: (i, j) => ['accent', 0.06 + 0.7 * (Fm[i][j] / mx)], activeRow: start, activeColor: 'gold',
          });
        });
        v.legend([['gold', 'chosen start', { dot: true }], ['red', 'absorbing states', { dot: true }]]);
        v.readout(() => {
          const t = Fm[start].reduce((a, b) => a + b, 0), ts = simF[start].reduce((a, b) => a + b, 0);
          let gap = 0; Fm.forEach((r, i) => r.forEach((x, j) => { gap = Math.max(gap, Math.abs(x - simF[i][j])); }));
          return `Start **${D.names[tr[start]]}**: expected time to absorption $\\sum_jF_{ij}=${v.fix(t, 3)}$ (simulated ${v.fix(ts, 3)}).\nAbsorbed in ${ab.map((b, k) => `**${D.names[b]}** with probability ${v.fix(Bm[start][k], 3)} (simulated ${v.fix(simB[start][k], 3)})`).join(', ')}. Largest $|F_{ij}-\\hat F_{ij}|$ in the table: ${v.fix(gap, 3)}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6', kind: 'Model', name: 'Snakes and ladders as an absorbing chain',
      statement: String.raw`On a board with squares $1,\dots,100$ a player starts off the board (state $0$), repeatedly rolls a fair die $d\in\{1,\dots,6\}$ and moves from $s$ to $s+d$; if the new square is the foot of a ladder or the head of a snake, the player is carried to its other end (one jump only). Under the **exact-finish** rule a roll that would pass $100$ leaves the player where she is. The squares then form an absorbing Markov chain with the single absorbing state $100$, and the expected number of turns from square $s$ is $E_s=\big((I-Q)^{-1}\mathbf 1\big)_s$, the solution of $E_{100}=0$, $E_s=1+\tfrac16\sum_{d=1}^6E_{\,\mathrm{jump}(\min\{s+d,\,\cdot\})}$ (with the overshoot rule applied).`,
      idea: String.raw`This is 2.3 and 2.5 on a 101-state chain: the system $(I-Q)E=\mathbf 1$ is solved by Gaussian elimination, and $E_0$ is the expected length of a game. No closed formula exists because snakes and ladders connect distant squares, but the chain is still finite and absorbing, so the answer exists and is unique as long as the last square stays reachable from everywhere. A game is a path of the chain, so its length is the absorption time, and the histogram of simulated lengths is the distribution of that time, with mean $E_0$.`,
      caption: String.raw`Squares are shaded by the expected number of turns still to go (deeper orange: longer). **Edit the board:** click a square, then another, to add a ladder (up) or a snake (down) between them; click a jump's first square again (with nothing selected) to remove it. The right panel is the histogram of 20000 simulated games, with the exact mean $E_0$ from the linear system as the gold line. The "classic" board is the commonly cited 19-jump layout of the Milton Bradley Chutes and Ladders board, reproduced from memory and not checked against a scan of the original, so treat it as indicative; try deleting all snakes, or all ladders, and switch the finishing rule.`,
      deps: ['stoch-2.5'], refs: ['Norris §1.3'], tags: ['absorbing chains', 'board games'], verify: true,
      viz(v) {
        const CLASSIC = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100, 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
        const rule = v.select('finish', [{ value: 'exact', label: 'exact finish' }, { value: 'over', label: 'overshoot wins' }], 'exact', { onChange: () => recompute() });
        const pre = v.select('board', [{ value: 'classic', label: 'classic' }, { value: 'empty', label: 'no jumps' }, { value: 'ladders', label: 'ladders only' }, { value: 'snakes', label: 'snakes only' }], 'classic', { onChange: () => { jumps = pick(); sel = null; recompute(); } });
        const s1 = v.stage({ x: [-0.1, 10.1], y: [-0.9, 10.1], axes: false, equal: true, height: 460, title: 'the board (click two squares to add a snake or ladder)' });
        const s2 = v.stage({ x: [0, 200], y: [0, 0.05], axes: 'box', gutter: true, height: 460, xlabel: 'turns to finish', ylabel: 'density', title: 'game length, 20000 simulated games' });
        const pick = () => { const o = {}; for (const [a, b] of Object.entries(CLASSIC)) { if (pre.value === 'classic' || (pre.value === 'ladders' && b > a) || (pre.value === 'snakes' && b < a)) o[a] = b; } return pre.value === 'empty' ? {} : o; };
        let jumps = pick(), sel = null, E = null, lens = [], meanSim = 0, ok = true;
        const cell = (s) => { const r = Math.floor((s - 1) / 10); let c = (s - 1) % 10; if (r % 2) c = 9 - c; return [c + 0.5, r + 0.5]; };
        const squareAt = (x, y) => { if (y < 0 || y >= 10 || x < 0 || x >= 10) return null; const r = Math.floor(y); let c = Math.floor(x); if (r % 2) c = 9 - c; return r * 10 + c + 1; };
        function recompute() {
          const n = 101, over = rule.value === 'over';
          const land = (s, d) => { let t = s + d; if (t > 100) { if (over) return 100; return s; } return jumps[t] !== undefined && t !== 100 ? jumps[t] : t; };
          const idx = []; for (let s = 0; s < 100; s++) idx.push(s);
          const A = idx.map((s) => idx.map((t) => (s === t ? 1 : 0))), b = idx.map(() => 1);
          idx.forEach((s) => { for (let d = 1; d <= 6; d++) { const t = land(s, d); if (t < 100) A[s][t] -= 1 / 6; } });
          const sol = solveLin(A, b);
          E = sol ? sol.concat([0]) : null; ok = !!sol && sol.every((x) => x > 0 && isFinite(x));
          lens = [];
          if (ok) {
            const R = v.rng(12345);
            for (let g = 0; g < 20000; g++) { let s = 0, t = 0; while (s < 100 && t < 5000) { s = land(s, 1 + Math.floor(R() * 6)); t++; } lens.push(t); }
            meanSim = lens.reduce((a, c) => a + c, 0) / lens.length;
          }
          v.invalidate();
        }
        v.button('clear selection', () => { sel = null; v.invalidate(); });
        s1.onClick((x, y) => {
          const s = squareAt(x, y); if (!s) return;
          if (sel === null) { if (jumps[s] !== undefined) { delete jumps[s]; recompute(); } else if (s < 100) sel = s; }
          else if (sel === s) sel = null;
          else { jumps[sel] = s; sel = null; recompute(); }
          v.invalidate();
        });
        recompute();
        v.render(() => {
          const e0 = ok ? E[0] : 1;
          for (let s = 1; s <= 100; s++) {
            const [cx, cy] = cell(s), hasJ = jumps[s] !== undefined;
            const t = ok ? Math.min(1, E[s] / e0) : 0;
            s1.rect(cx - 0.5, cy - 0.5, cx + 0.5, cy + 0.5, { fill: ok ? v.ramp(t * 0.85, 'orange') : 'muted', fillAlpha: 1, color: sel === s ? 'gold' : 'faint', width: sel === s ? 3 : 1 });
            s1.text(String(s), cx - 0.36, cy + 0.34, { size: 9.5, color: 'muted', align: 'left', baseline: 'middle' });
          }
          Object.entries(jumps).forEach(([a, b]) => {
            const [x0, y0] = cell(+a), [x1, y1] = cell(b), up = b > +a;
            s1.arrow(x0, y0, x1, y1, { color: up ? 'green' : 'red', width: 3, alpha: 0.85 });
            s1.dot(x0, y0, { color: up ? 'green' : 'red', r: 4 });
          });
          s1.text('start: off the board (square 0)', 0.02, -0.45, { size: 12, color: 'muted', align: 'left' });
          if (ok) {
            const ymax = Math.max(0.012, ...v.M.histogram(lens, { bins: 100, range: [0, 200] }).density) * 1.3;
            s2.setView([0, 200], [0, ymax]);
            s2.hist(lens, { bins: 100, range: [0, 200], density: true, color: 'accent' });
            s2.vline(E[0], { color: 'gold', width: 3 });
            s2.vline(meanSim, { color: 'red', width: 1.5, dash: true });
            s2.text(`$E_0=${v.fix(E[0], 1)}$`, E[0] + 4, ymax * 0.93, { size: 14, color: 'gold', align: 'left' });
          } else s2.text('the last square cannot be reached', 100, 0.02, { color: 'red', size: 16, align: 'center' });
        });
        v.legend([['green', 'ladder', { dot: true }], ['red', 'snake', { dot: true }], ['gold', 'exact $E_0$'], ['accent', 'simulated games', { area: true }]]);
        v.readout(() => (ok ? `${Object.keys(jumps).length} jumps. Expected game length from the linear system: $E_0=$ **${v.fix(E[0], 2)}** turns; mean of 20000 simulated games **${v.fix(meanSim, 2)}**; median ${v.M.median(lens)}, longest ${Math.max(...lens)} (histogram shows up to 200).\n${sel ? `Selected square ${sel}: click another square to join.` : ''}` : 'The finish cannot be reached from some square: $I-Q$ is singular and $E=\\infty$. Remove a snake.'));
      },
    },
  ],
};
