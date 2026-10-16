// Algorithms — Chapter 9: landmark paper written early as a flagship item (9.17, Dijkstra 1959).
//
// Verified against the note (Numer. Math. 1: 269–271, scan at ir.cwi.nl/pub/9256): Problem 1, "construct the tree of
// minimum total length between the n nodes", branches in sets I (assigned to the tree), II (from which the next branch
// is selected), III (rejected or not yet considered), nodes in sets A (connected by branches of I) and B, Steps 1–2;
// preferred to Kruskal's and Loberman–Weinberger's methods, which sort all — possibly ½n(n − 1) — branches, because it
// stores at most n branches. Problem 2, "find the path of minimum total length between two given nodes P and Q": nodes
// in A (minimal path from P known), B (connected to A but not in it), C (the rest), branches in I, II, III, Steps 1–2,
// stop when Q enters A; Remark 1 (directed lengths); preferred to Ford's method (as described by Berge). Today's bounds
// for comparison: O(m + n log n) with Fibonacci heaps (Fredman & Tarjan, J. ACM 34, 1987).

const NODES = [
  { id: 'P', x: 0.7, y: 3.0 }, { id: 'a', x: 2.6, y: 5.3 }, { id: 'b', x: 2.7, y: 0.7 }, { id: 'c', x: 4.5, y: 3.2 },
  { id: 'd', x: 5.3, y: 0.8 }, { id: 'e', x: 6.6, y: 5.3 }, { id: 'f', x: 7.0, y: 2.7 }, { id: 'g', x: 8.7, y: 0.9 }, { id: 'Q', x: 9.4, y: 4.2 },
];
const EDGES = [['P', 'a', 4], ['P', 'b', 3], ['P', 'c', 5], ['a', 'c', 2], ['a', 'e', 6], ['b', 'c', 4], ['b', 'd', 4], ['c', 'd', 3], ['c', 'f', 4],
  ['c', 'e', 5], ['d', 'f', 3], ['d', 'g', 6], ['e', 'f', 2], ['e', 'Q', 5], ['f', 'Q', 4], ['f', 'g', 3], ['g', 'Q', 3]];
const other = (e, id) => (String(e.from) === String(id) ? e.to : e.from);

/** Problem 2, step by step in Dijkstra's notation. Frames carry node sets A/B/C, branch sets I/II/III, distances. */
function problem2(G, P, Q) {
  const node = {}, br = new Map(), dist = {}, via = {}, F = [];
  for (const n of G.nodes) node[n.id] = 'C';
  const snap = (extra) => F.push({ node: { ...node }, br: new Map(br), dist: { ...dist }, ...extra, stored: [...br.values()].filter((s) => s === 'I' || s === 'II').length });
  snap({ line: 1, note: 'To start, every node is in set C and every branch in set III.' });
  node[P] = 'A'; dist[P] = 0;
  snap({ line: 1, cur: P, note: `Node ${P} is transferred to set A: its minimal path (of length 0) is known.` });
  let last = P, guard = 0;
  while (guard++ < 200) {
    for (const { id: R, edge: r, w } of G.adj(last)) {
      if (node[R] === 'A') continue;
      const d = dist[last] + w;
      if (node[R] === 'B') {
        const old = via[R];
        if (d < dist[R]) { br.set(old, 'III'); br.set(r, 'II'); via[R] = r; const was = dist[R]; dist[R] = d; snap({ line: 3, cur: last, edge: r, rej: old, note: `Step 1: branch ${last}–${R} gives a path of length ${d} to ${R}, shorter than the ${was} via set II: it replaces that branch, which is rejected (III).` }); }
        else { br.set(r, 'III'); snap({ line: 3, cur: last, edge: r, rej: r, note: `Step 1: branch ${last}–${R} would give ${d}, not shorter than the ${dist[R]} already known via set II: it is rejected (III).` }); }
      } else { node[R] = 'B'; br.set(r, 'II'); via[R] = r; dist[R] = d; snap({ line: 4, cur: last, edge: r, note: `Step 1: ${R} was in C; it joins set B, and branch ${last}–${R} (path length ${d}) joins set II.` }); }
    }
    const cand = G.nodes.filter((n) => node[n.id] === 'B');
    if (!cand.length) { snap({ line: 6, note: `Set B is empty: ${Q} cannot be reached from ${P}.`, end: true }); break; }
    const nx = cand.reduce((b, n) => (dist[n.id] < dist[b.id] ? n : b)).id;
    node[nx] = 'A'; br.set(via[nx], 'I'); last = nx;
    snap({ line: 5, cur: nx, edge: via[nx], note: `Step 2: of the nodes in B, ${nx} is nearest to ${P} (distance ${dist[nx]}): it moves to A and its branch moves from II to I.` });
    if (nx === Q) { snap({ line: 6, end: true, note: `${Q} has entered set A: the minimal path from ${P} to ${Q} has length **${dist[Q]}**; it runs along branches of set I.`, path: true }); break; }
  }
  return { F, dist, via };
}
/** Problem 1 (shortest spanning tree), in the note's notation: node sets A/B, branch sets I/II/III. */
function problem1(G, P) {
  const node = {}, br = new Map(), via = {}, len = {}, F = [];
  for (const n of G.nodes) node[n.id] = 'B';
  const snap = (extra) => F.push({ node: { ...node }, br: new Map(br), len: { ...len }, ...extra, stored: [...br.values()].filter((s) => s === 'I' || s === 'II').length });
  node[P] = 'A';
  for (const { id: R, edge: r, w } of G.adj(P)) { br.set(r, 'II'); via[R] = r; len[R] = w; }
  snap({ line: 1, cur: P, note: `Choose ${P} as the only member of set A and put every branch ending in ${P} into set II; set I is empty.` });
  let guard = 0, total = 0;
  while (guard++ < 200) {
    const cand = G.nodes.filter((n) => node[n.id] === 'B' && via[n.id]);
    if (!cand.length) { const lost = G.nodes.filter((n) => node[n.id] === 'B').length; snap({ line: 6, end: true, total, note: lost ? `Sets II is empty but ${lost} node(s) are unreachable: the graph is not connected.` : `Sets II and B are empty: the branches of set I form the shortest spanning tree, total length **${total}**.` }); break; }
    const nx = cand.reduce((b, n) => (len[n.id] < len[b.id] ? n : b)).id;
    node[nx] = 'A'; br.set(via[nx], 'I'); total += len[nx];
    snap({ line: 2, cur: nx, edge: via[nx], total, note: `Step 1: the shortest branch of set II (length ${len[nx]}) moves to set I, bringing node ${nx} from B into A.` });
    for (const { id: R, edge: r, w } of G.adj(nx)) {
      if (node[R] !== 'B' || r === via[R]) continue;
      if (!via[R]) { br.set(r, 'II'); via[R] = r; len[R] = w; snap({ line: 3, cur: nx, edge: r, total, note: `Step 2: no branch of set II leads to ${R} yet, so ${nx}–${R} (length ${w}) is placed in II.` }); }
      else if (w < len[R]) { const old = via[R], was = len[R]; br.set(old, 'III'); br.set(r, 'II'); via[R] = r; len[R] = w; snap({ line: 5, cur: nx, edge: r, rej: old, total, note: `Step 2: branch ${nx}–${R} (length ${w}) is shorter than ${R}'s branch in set II (${was}): it replaces it, and the old one is rejected.` }); }
      else { br.set(r, 'III'); snap({ line: 4, cur: nx, edge: r, rej: r, total, note: `Step 2: branch ${nx}–${R} (length ${w}) is not shorter than ${R}'s branch in set II (${len[R]}): it is rejected.` }); }
    }
  }
  return { F, total };
}
/** Brute-force checks: Bellman–Ford distances and Kruskal's tree weight. */
function bellmanFord(G, P) { const d = {}; for (const n of G.nodes) d[n.id] = Infinity; d[P] = 0; for (let k = 0; k < G.nodes.length; k++) for (const e of G.edges) { const w = e.w ?? 1; if (d[e.from] + w < d[e.to]) d[e.to] = d[e.from] + w; if (d[e.to] + w < d[e.from]) d[e.from] = d[e.to] + w; } return d; }

// ───────── Hart, Nilsson & Raphael (1968): A* on a grid ─────────
// Claims checked against the authors' 1972 correction (SIGART Newsletter 37; cse.sc.edu copy) and standard accounts:
// with an admissible h (never above the true remaining cost) the algorithm finds a minimal-cost path whenever one exists;
// with the consistency assumption h(n) ≤ c(n, n′) + h(n′) it expands no more nodes than any admissible algorithm that is
// no better informed. Bound w·C* for weighted heuristics (w ≥ 1): Pohl (1970), a later result.
const AS_W = 26, AS_H = 16;
/** Best-first search on a 4-connected unit-cost grid: f = g + h(cell). Graph search without reopening, ties to larger g.
 *  Returns the expansion order, the path and its cost. */
function aStarGrid(walls, s, t, h) {
  const N = AS_W * AS_H, g = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), closed = new Uint8Array(N), order = [];
  const heap = []; const push = (f, gg, i) => { heap.push([f, -gg, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (cmp(heap[k], heap[p]) < 0) { [heap[k], heap[p]] = [heap[p], heap[k]]; k = p; } else break; } };
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && cmp(heap[l], heap[m]) < 0) m = l; if (r < heap.length && cmp(heap[r], heap[m]) < 0) m = r; if (m === k) break; [heap[k], heap[m]] = [heap[m], heap[k]]; k = m; } } return top; };
  g[s] = 0; push(h(s), 0, s);
  while (heap.length) {
    const [, , i] = pop(); if (closed[i]) continue; closed[i] = 1; order.push(i);
    if (i === t) break;
    const x = i % AS_W, y = (i / AS_W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= AS_W || Y >= AS_H) continue;
      const j = Y * AS_W + X; if (walls[j] || closed[j]) continue;
      if (g[i] + 1 < g[j]) { g[j] = g[i] + 1; prev[j] = i; push(g[j] + h(j), g[j], j); }
    }
  }
  const path = []; if (g[t] < Infinity) { for (let k = t; k >= 0; k = prev[k]) path.push(k); path.reverse(); }
  return { order, path, cost: g[t] };
}

export default {
  collection: 'algo',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.17
    {
      num: '9.17',
      kind: 'Paper',
      name: 'A Note on Two Problems in Connexion with Graphs',
      paper: { authors: 'E. W. Dijkstra', year: 1959, title: 'A Note on Two Problems in Connexion with Graphs', venue: 'Numerische Mathematik 1: 269–271', doi: '10.1007/BF01386390' },
      introduces: ['algo-9.8'],
      statement: String.raw`In under three pages Dijkstra solved two problems on a connected graph whose branches have given (non-negative) lengths.

**Problem 1**, the tree of minimum total length joining all $n$ nodes: grow a single tree from any node, repeatedly adding the shortest branch that joins the tree (set A) to a node outside it (set B), while keeping, for each outside node, only its shortest candidate branch (set II). This is the method now known as Prim's (or Jarník's) algorithm.

**Problem 2**, the path of minimum total length from $P$ to $Q$: settle the nodes in order of increasing distance from $P$. Set A holds the nodes whose minimal distance is known, set B the nodes adjacent to A, each with the best path found so far through a single branch of set II, set C the rest. Repeatedly move the node of B nearest to $P$ into A, then use its branches to improve or create the tentative paths of its neighbours; stop when $Q$ enters A. Its correctness rests on the observation the note starts from: every node on a minimal path from $P$ to $Q$ is itself reached minimally along that path. This is **Dijkstra's algorithm**, valid for directed lengths too (Remark 1) but not for negative ones.

Both methods store at most $n$ branches at a time (sets I and II), against all of the up to $\tfrac12n(n-1)$ branches that Kruskal's method sorts.`,
      idea: String.raw`In 1956 Dijkstra, then a programmer at the Mathematical Centre in Amsterdam, needed a problem whose solution non-mathematicians could follow to demonstrate the new ARMAC computer, and chose the shortest route between Dutch cities (Rotterdam to Groningen, as he told it in 2001); the spanning-tree problem came from hardware colleagues who had to connect many points of a large panel with as little copper wire as possible. His note answers both with the same pattern: a growing set of finished nodes, a frontier with one candidate branch per node, and a greedy choice of the closest frontier node, justified because a shortest path's prefixes are shortest paths (algo-9.1) and improved by relaxation (algo-9.3). The shortest-path method (algo-9.8) became one of the most used algorithms in computing, from routing protocols to maps; with a priority queue it runs in $O(m\log n)$ time, and with Fibonacci heaps in $O(m+n\log n)$ (Fredman and Tarjan, 1987).`,
      caption: String.raw`A road map with editable lengths (click a length to add 1, shift-click to subtract 1; drag nodes; click empty space to add a node, then click two nodes to join them). Step through either problem in Dijkstra's own notation: nodes in **A** filled blue, in **B** ringed orange, in **C** plain; branches in **I** green, in **II** orange, rejected (**III**) dashed red, the branch under consideration gold. Distances from $P$ (problem 2) or candidate lengths (problem 1) sit beside the nodes. The readout checks the result against brute force and counts the branches stored.`,
      deps: ['algo-9.1', 'algo-9.3'],
      refs: [],
      tags: ['graphs', 'shortest paths', 'history'],
      credit: 'Dijkstra, 1959',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm' },
      viz(v) {
        const CODE2 = [
          'all nodes in C, all branches in III; transfer $P$ to A',
          'Step 1: for each branch $r$ from the node just put in A to a node $R$ in B or C:',
          '   $R$ in B: if $r$ gives a shorter path to $R$, $r$ replaces $R$\'s branch in II (old → III); else $r$ → III',
          '   $R$ in C: $R$ → B, $r$ → II',
          'Step 2: the node of B nearest to $P$ → A; its branch II → I',
          'repeat until $Q$ is in A',
        ];
        const CODE1 = [
          'one node ($P$) is the only member of A; all branches ending in it → II',
          'Step 1: shortest branch of II → I; its node moves from B to A',
          'Step 2: for each branch from that node to a node still in B:',
          '   longer than that node\'s branch in II → rejected (III)',
          '   shorter → it replaces that branch in II (old → III)',
          'repeat until II and B are empty',
        ];
        const prob = v.select('problem', [{ value: 2, label: '2 · shortest path P → Q' }, { value: 1, label: '1 · shortest spanning tree' }], 2, { onChange: () => { S.setCode(+prob.value === 1 ? CODE1 : CODE2, +prob.value === 1 ? 'Problem 1 (Dijkstra 1959)' : 'Problem 2 (Dijkstra 1959)'); S.reset({ at: 0 }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 360, title: 'a road map: drag nodes, click lengths' });
        const G = v.graph(s, { weights: true, layout: 'none', editable: { editWeight: true, addNode: true, addEdge: true, deleteNode: true, deleteEdge: true, minWeight: 1, maxWeight: 15, weight: 4 }, r: 15, nodes: NODES.map((n) => ({ ...n })), edges: EDGES.map(([a, b, w]) => [a, b, w]) });
        let run = null;
        const frames = () => { const has = (id) => G.has(id); const P = has('P') ? 'P' : G.nodes[0]?.id, Q = has('Q') ? 'Q' : G.nodes[G.nodes.length - 1]?.id; run = +prob.value === 1 ? { ...problem1(G, P), P, Q, k: 1 } : { ...problem2(G, P, Q), P, Q, k: 2 }; return run.F; };
        const S = v.steps({ frames, code: CODE2, codeTitle: 'Problem 2 (Dijkstra 1959)', start: 12, still: 12, speed: 1.4 });
        G.onChange = () => S.reset({ at: 'keep' });
        v.legend([['accent', 'node in A', { dot: true }], ['orange', 'node in B'], ['green', 'branch in I'], ['orange', 'branch in II'], ['red', 'rejected (III)', { dash: true }], ['gold', 'branch considered now']]);
        v.render(() => {
          const f = S.frame; if (!f.node) return;
          const setOf = (e) => f.br.get(e) || 'III';
          const pathEdges = new Set();
          if (f.path && run.k === 2) { let x = run.Q; for (let k = 0; k < 50 && x !== run.P; k++) { const e = [...f.br.entries()].find(([ed, st2]) => st2 === 'I' && (String(ed.to) === String(x) || String(ed.from) === String(x)) && (f.dist[other(ed, x)] ?? Infinity) + (ed.w ?? 1) === f.dist[x]); if (!e) break; pathEdges.add(e[0]); x = other(e[0], x); } }
          G.draw({
            nodeFill: (id) => (f.node[id] === 'A' ? (id === f.cur ? 'gold' : 'accent') : null),
            nodeColor: (id) => (f.node[id] === 'B' ? 'orange' : f.node[id] === 'A' ? 'accent' : 'muted'),
            nodeRing: (id) => (id === run.Q && run.k === 2 ? 'purple' : null),
            nodeNote: (id) => (run.k === 2 ? (f.dist[id] != null ? String(f.dist[id]) : null) : (f.node[id] === 'B' && f.len[id] != null ? `≤ ${f.len[id]}` : null)),
            noteColor: (id) => (f.node[id] === 'A' ? 'accent' : 'orange'),
            edgeColor: (e) => (e === f.edge ? 'gold' : pathEdges.has(e) ? 'green' : setOf(e) === 'I' ? 'green' : setOf(e) === 'II' ? 'orange' : e === f.rej || f.br.get(e) === 'III' ? 'red' : 'muted'),
            edgeWidth: (e) => (e === f.edge ? 5 : pathEdges.has(e) ? 6 : setOf(e) === 'I' ? 4 : setOf(e) === 'II' ? 3 : 1.5),
            edgeDash: (e) => (f.br.get(e) === 'III' && e !== f.edge ? [5, 4] : null),
          });
        });
        v.readout(() => {
          const f = S.frame; if (!f.node || !run) return '';
          const n = G.nodes.length, m = G.edges.length, cnt = (k) => Object.values(f.node).filter((x) => x === k).length;
          const sets = run.k === 2 ? `A ${cnt('A')}, B ${cnt('B')}, C ${cnt('C')}` : `A ${cnt('A')}, B ${cnt('B')}`;
          const store = `branches stored now (sets I + II): **${f.stored}** ≤ $n$ = ${n}, against the ${m} branches (up to $\\tfrac12n(n-1)$ = ${n * (n - 1) / 2}) that Kruskal's method sorts first`;
          let check = '';
          if (run.k === 2) { const bf = bellmanFord(G, run.P), ok = run.dist[run.Q] === bf[run.Q]; check = `Dijkstra: $d(${run.P},${run.Q})$ = ${run.dist[run.Q] ?? '∞'}, Bellman–Ford over all branches: ${bf[run.Q] === Infinity ? '∞' : bf[run.Q]} ${ok ? '✓' : '✗'}`; }
          else { const K = G.mst(), ok = Math.abs(K.weight - run.total) < 1e-9; check = `Dijkstra's tree: total length ${run.total}, Kruskal's: ${K.weight} ${ok ? '✓' : '✗'}`; }
          return `nodes: ${sets} · ${store} · ${check} · as written, each Step 2 scans set B, $O(n^2)$ in all; today, with a priority queue, $O(m\\log n)$, or $O(m+n\\log n)$ with Fibonacci heaps (Fredman & Tarjan 1987)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.18
    {
      num: '9.18',
      kind: 'Paper',
      name: 'Heuristic Determination of Minimum Cost Paths',
      paper: { authors: 'Peter E. Hart, Nils J. Nilsson and Bertram Raphael', year: 1968, title: 'A Formal Basis for the Heuristic Determination of Minimum Cost Paths',
               venue: 'IEEE Transactions on Systems Science and Cybernetics 4 (2): 100–107', doi: '10.1109/TSSC.1968.300136' },
      introduces: ['algo-9.12'],
      statement: String.raw`Hart, Nilsson and Raphael defined the search algorithm A*: keep a frontier of discovered nodes and always expand the one with the smallest
$$f(n)=g(n)+h(n),$$
where $g(n)$ is the cost of the best path found so far from the start and $h(n)$ an estimate of the remaining cost to a goal. They proved:
(a) **admissibility**: if $h(n)\le h^*(n)$ for every node (the estimate never exceeds the true remaining cost $h^*$), A* finds a minimum-cost path whenever one exists;
(b) **optimality**: under the consistency assumption $h(n)\le c(n,n')+h(n')$, A* expands no more nodes than any other admissible algorithm using no more information.
With $h\equiv0$ it is Dijkstra's algorithm (algo-9.8); the better the admissible estimate, the fewer nodes are expanded. An overestimating $h$ can be faster but loses the guarantee: the path found may be longer.

The results assume non-negative edge costs bounded away from zero and a finite branching factor; the optimality claim needed the consistency condition stated in the authors' 1972 correction.`,
      idea: String.raw`At SRI, the mobile robot Shakey had to plan routes across a room with obstacles, and two traditions met: the "uniform-cost" search of operations research (Dijkstra, Moore), which is exact but explores in all directions, and the heuristic search of early AI, which used rules of thumb with no guarantees. The paper's insight was to make the heuristic a lower bound and add it to the cost so far, so that $f$ estimates the length of the best path through $n$ and never overestimates it; a node on an optimal path then always has $f\le C^*$, which is why the goal cannot be reached by a worse path first. A consistent $h$ also keeps $f$ non-decreasing along paths, so each node is expanded once, as in Dijkstra's algorithm. A* with a consistent heuristic (algo-9.12) became the standard for path finding in robotics, games, and route planning, and its variants (weighted A*, IDA*, D*) trade the guarantee for speed or memory.`,
      caption: String.raw`Two copies of one maze, four-connected, each step cost 1. **Left**: A* with your heuristic; **right**: Dijkstra's algorithm ($h=0$) on the same maze. Shading shows nodes in the order they are expanded (light to dark), the green line the path found. **Drag** the start (S) and goal (G), **paint walls** by dragging on empty cells of either grid (drag over walls to erase). Choose the base estimate, straight-line or Manhattan distance, both admissible here, and multiply it by the **weight** $w$: at $w\le1$ the path stays optimal while far fewer nodes are expanded; past $w=1$ the estimate can overestimate and, in the default maze, the path found is 6 steps longer than the shortest.`,
      deps: ['algo-9.8'],
      refs: [],
      tags: ['search', 'shortest paths', 'heuristics'],
      credit: 'Hart, Nilsson & Raphael, 1968',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/A*_search_algorithm' },
      viz(v) {
        const walls = new Uint8Array(AS_W * AS_H);
        const reset = () => { walls.fill(0); const wl = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) walls[y * AS_W + x] = 1; }; wl(14, 3, 14, 12); wl(9, 3, 14, 3); wl(9, 12, 14, 12); wl(19, 0, 19, 9); };
        reset();
        const base = v.select('estimate h', [{ value: 'man', label: 'Manhattan' }, { value: 'euc', label: 'straight line' }], 'man', { onChange: () => v.restart() });
        const wS = v.slider('weight w (h × w)', 0, 4, 1, { step: 0.05, onChange: () => v.restart() });
        v.button('reset maze', () => { reset(); v.restart(); });
        const opts = { x: [0, AS_W], y: [0, AS_H + 1.4], equal: true, axes: false, height: 300 };
        const L = v.stage({ ...opts, title: 'A*, f = g + w·h' }), R = v.stage({ ...opts, title: 'Dijkstra, h = 0' });
        const snapCell = (x, y) => [Math.min(AS_W - 1, Math.max(0, Math.floor(x))) + 0.5, Math.min(AS_H - 1, Math.max(0, Math.floor(y))) + 0.5];
        const S = L.handle(3.5, AS_H - 8.5, { color: 'blue', r: 9, label: 'S', labelPos: 'w', constrain: (x, y) => snapCell(x, y), onDrag: () => v.restart() });
        const G = L.handle(23.5, AS_H - 5.5, { color: 'red', r: 9, label: 'G', labelPos: 'e', constrain: (x, y) => snapCell(x, y), onDrag: () => v.restart() });
        const cellOf = (x, y) => { const cx = Math.floor(x), cy = AS_H - 1 - Math.floor(y); return cx < 0 || cy < 0 || cx >= AS_W || cy >= AS_H ? -1 : cy * AS_W + cx; };
        let paint = 1;
        for (const st of [L, R]) st.onDrag((x, y, ph) => { const c = cellOf(x, y); if (c < 0) return; if (c === cellOf(S.x, S.y) || c === cellOf(G.x, G.y)) return; if (ph === 'start') paint = walls[c] ? 0 : 1; walls[c] = paint; v.restart(); });
        let st = null;
        v.animate((t) => {
          const s = cellOf(S.x, S.y), g = cellOf(G.x, G.y); walls[s] = 0; walls[g] = 0;
          const tx = g % AS_W, ty = (g / AS_W) | 0, w = wS.value;
          const hb = base.value === 'man' ? (i) => Math.abs((i % AS_W) - tx) + Math.abs(((i / AS_W) | 0) - ty) : (i) => Math.hypot((i % AS_W) - tx, ((i / AS_W) | 0) - ty);
          const A = aStarGrid(walls, s, g, (i) => w * hb(i)), D = aStarGrid(walls, s, g, () => 0);
          const shown = Math.floor(t * 120);
          for (const [stg, res] of [[L, A], [R, D]]) {
            const n = Math.min(res.order.length, shown), tot = Math.max(1, res.order.length);
            for (let i = 0; i < AS_W * AS_H; i++) { const x = i % AS_W, y = AS_H - 1 - ((i / AS_W) | 0); stg.rect(x + 0.04, y + 0.04, x + 0.96, y + 0.96, { fill: walls[i] ? 'ink' : 'grid', fillAlpha: walls[i] ? 0.85 : 0.35, stroke: false }); }
            for (let k = 0; k < n; k++) { const i = res.order[k], x = i % AS_W, y = AS_H - 1 - ((i / AS_W) | 0); stg.rect(x + 0.04, y + 0.04, x + 0.96, y + 0.96, { fill: 'orange', fillAlpha: 0.18 + 0.5 * (k / tot), stroke: false }); }
            if (n >= res.order.length && res.path.length) stg.path(res.path.map((i) => [(i % AS_W) + 0.5, AS_H - 1 - ((i / AS_W) | 0) + 0.5]), { color: 'green', width: 3.4 });
            if (stg === R) { R.dot(S.x, S.y, { r: 8, color: 'blue' }); R.dot(G.x, G.y, { r: 8, color: 'red' }); }
            stg.corner(`${n} expanded${n >= res.order.length ? (res.path.length ? ` · path ${res.cost}` : ' · no path') : '…'}`, 'tl', { size: 12, weight: 700, color: 'ink', plate: true });
          }
          st = { A, D, w };
        }, { still: 8, period: 1e9 });
        v.legend([['orange', 'expanded (darker = later)', { area: true }], ['green', 'path found'], ['ink', 'wall', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { A, D, w } = st;
          if (!D.path.length) return 'no path between S and G: both searches exhaust the reachable cells';
          const opt = A.cost === D.cost, adm = w <= 1 + 1e-9;
          return `A* with ${w === 0 ? '$h = 0$ (Dijkstra itself)' : `$${v.fix(w, 2)}\\times$ ${base.value === 'man' ? 'Manhattan' : 'straight-line'} distance`}: **${A.order.length}** nodes expanded against **${D.order.length}** for Dijkstra (${v.fix((100 * A.order.length) / D.order.length, 0)}%); path cost **${A.cost}**, shortest ${D.cost} — ${opt ? 'optimal' : `**${A.cost - D.cost} longer than optimal**`}${adm ? ' (the estimate is admissible, so optimality is guaranteed)' : opt ? ' (no guarantee at w > 1: here it happened to be optimal)' : ' (w > 1 lets h overestimate, so the guarantee is lost; Pohl later showed the cost stays within w × optimal)'} · on this grid Manhattan distance is the exact cost when no wall intervenes, the better informed of the two; straight-line distance is admissible but weaker, so A* expands more`;
        });
      },
    },
  ],
};
