// Kit demos — worked examples of v.graph, v.graphs, v.steps and v.table, shaped like a chapter file.
// Render one: tools/harness.html?file=tools/demos/kits.js&id=demo-1.1&theme=light   (id = `demo-${num}`)

// ---- DP helpers (1.5): every frame is a full snapshot so the player can jump anywhere
const LCS_CODE = [
  'c[i, 0] ← 0;   c[0, j] ← 0',
  'for i ← 1 to m',
  '  for j ← 1 to n',
  '    if $x_i = y_j$',
  '      c[i, j] ← c[i−1, j−1] + 1          // ↖',
  '    else',
  '      c[i, j] ← max(c[i−1, j], c[i, j−1])  // ↑ ←',
  'trace back from (m, n): ↖ = a letter of the LCS',
];
const EDIT_CODE = [
  'D[i, 0] ← i;   D[0, j] ← j',
  'for i ← 1 to m',
  '  for j ← 1 to n',
  '    c ← 0 if $x_i = y_j$ else 1',
  '    D[i, j] ← min( D[i−1, j] + 1,     // delete',
  '                   D[i, j−1] + 1,     // insert',
  '                   D[i−1, j−1] + c )  // keep/swap',
  'trace back from (m, n): the edit script',
];
function dpFrames(mode, X, Y) {
  const m = X.length, n = Y.length, lcs = mode === 'lcs';
  const c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null)), p = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
  const frames = [], snap = (o) => frames.push({ vals: c.map((r) => r.slice()), ptr: p.map((r) => r.slice()), ...o });
  for (let i = 0; i <= m; i++) { c[i][0] = lcs ? 0 : i; if (!lcs && i) p[i][0] = [-1, 0]; }
  for (let j = 0; j <= n; j++) { c[0][j] = lcs ? 0 : j; if (!lcs && j) p[0][j] = [0, -1]; }
  snap({ line: 1, note: lcs ? 'Row 0 and column 0 hold 0: a common subsequence with an empty string is empty.' : 'Turning a prefix of length $i$ into the empty string takes $i$ deletions (column 0); building a prefix of length $j$ from nothing takes $j$ insertions (row 0).' });
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const a = X[i - 1], b = Y[j - 1], same = a === b, cur = [i, j];
    if (lcs) {
      if (same) { c[i][j] = c[i - 1][j - 1] + 1; p[i][j] = [-1, -1]; snap({ cur, deps: [[i - 1, j - 1]], line: [4, 5], note: `$x_{${i}} = y_{${j}} = $ **${a}**: extend the diagonal, $c[${i},${j}] = ${c[i - 1][j - 1]} + 1 = ${c[i][j]}$.` }); }
      else {
        const up = c[i - 1][j], left = c[i][j - 1]; c[i][j] = Math.max(up, left); p[i][j] = up >= left ? [-1, 0] : [0, -1];
        snap({ cur, deps: [[i - 1, j], [i, j - 1]], line: [6, 7], note: `**${a}** ≠ **${b}**: take the larger of above (${up}) and left (${left}) → ${c[i][j]} ${up >= left ? '↑' : '←'}.` });
      }
    } else {
      const del = c[i - 1][j] + 1, ins = c[i][j - 1] + 1, sub = c[i - 1][j - 1] + (same ? 0 : 1), best = Math.min(sub, del, ins);
      c[i][j] = best; p[i][j] = best === sub ? [-1, -1] : best === del ? [-1, 0] : [0, -1];
      snap({ cur, deps: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], line: [4, 5, 6, 7], note: `${same ? `**${a}** = **${b}**, keep it` : `**${a}** → **${b}** costs 1`}: min(delete ${del}, insert ${ins}, ${same ? 'keep' : 'substitute'} ${sub}) = **${best}**.` });
    }
  }
  // trace back along the pointers
  let i = m, j = n; const path = [[i, j]], out = [], ops = [];
  snap({ path: path.slice(), line: 8, note: lcs ? `Done: the LCS has length **${c[m][n]}**. Now walk back from the corner along the arrows.` : `Done: the edit distance is **${c[m][n]}**. Now walk back from the corner along the arrows.` });
  while (i > 0 || j > 0) {
    const [di, dj] = p[i][j] || (i > 0 ? [-1, 0] : [0, -1]);
    if (lcs && di && dj) out.unshift(X[i - 1]);
    if (!lcs) ops.unshift(di && dj ? (X[i - 1] === Y[j - 1] ? `keep ${X[i - 1]}` : `${X[i - 1]}→${Y[j - 1]}`) : di ? `delete ${X[i - 1]}` : `insert ${Y[j - 1]}`);
    i += di; j += dj; path.push([i, j]);
    if (lcs && (i === 0 || j === 0)) break;
    snap({ path: path.slice(), line: 8, hold: 0.6, note: lcs ? `Common subsequence so far (read backwards): **${out.join('') || '—'}**` : `Edit script so far: ${ops.join(', ')}` });
  }
  snap({ path: path.slice(), line: 8, hold: 2, note: lcs ? `LCS of ${X} and ${Y}: **${out.join('')}** (length ${c[m][n]}). The green diagonal steps are its letters.` : `${X} → ${Y} in **${c[m][n]}** edits: ${ops.filter((s) => !s.startsWith('keep')).join(', ')}.` });
  return frames;
}

// ---- insertion sort frames (1.10): positions per element id, so the player can tween between frames
const INSERTION_CODE = ['for j ← 2 to n', '  key ← A[j];   i ← j − 1', '  while i > 0 and A[i] > key', '    A[i+1] ← A[i]       // shift right', '    i ← i − 1', '  A[i+1] ← key'];
function insertionFrames(vals) {
  const n = vals.length, A = vals.map((_, k) => k), frames = [];
  const P = () => { const o = {}; A.forEach((id, p) => { if (id != null) o[id] = [p, 0]; }); return o; };
  const snap = (o, key, hole) => frames.push({ ...o, key, pos: key == null ? P() : { ...P(), [key]: [hole, 1] } });
  snap({ line: [], sorted: 1, note: 'The first element on its own is a sorted prefix (green).' });
  for (let j = 1; j < n; j++) {
    const key = A[j]; let i = j - 1, hole = j; A[j] = null;
    snap({ line: [1, 2], sorted: j, note: `Lift the key **${vals[key]}** out of position ${j + 1}.` }, key, hole);
    while (i >= 0 && vals[A[i]] > vals[key]) {
      snap({ line: 3, sorted: j, cmp: A[i], note: `${vals[A[i]]} > ${vals[key]}: it must move right.` }, key, hole);
      A[i + 1] = A[i]; A[i] = null; hole = i; i--;
      snap({ line: [4, 5], sorted: j, note: 'Shift it one place right; the gap moves left.' }, key, hole);
    }
    if (i >= 0) snap({ line: 3, sorted: j, cmp: A[i], note: `${vals[A[i]]} ≤ ${vals[key]}: stop here.` }, key, hole);
    A[hole] = key;
    snap({ line: 6, sorted: j + 1, hold: 1.4, note: `Drop **${vals[key]}** into the gap: the first ${j + 1} elements are sorted.` });
  }
  frames[frames.length - 1].note = `Sorted. Insertion sort made ${frames.filter((f) => f.cmp != null).length} comparisons on this input.`;
  return frames;
}

// ---- small group tables (1.6)
const PERM = { e: [0, 1, 2], r: [1, 2, 0], s: [0, 2, 1] };
const pmul = (a, b) => b.map((k) => a[k]); // (a ∘ b)(k) = a(b(k))
const S3 = (() => {
  const r2 = pmul(PERM.r, PERM.r), els = [PERM.e, PERM.r, r2, PERM.s, pmul(PERM.r, PERM.s), pmul(r2, PERM.s)];
  const idx = (q) => els.findIndex((x) => x.every((y, k) => y === q[k]));
  return { n: 6, labels: ['$e$', '$r$', '$r^2$', '$s$', '$rs$', '$r^2s$'], tex: ['e', 'r', 'r^2', 's', 'rs', 'r^2s'], op: (i, j) => idx(pmul(els[i], els[j])), sym: '$\\circ$', texSym: '\\circ' };
})();
const Z6 = { n: 6, labels: ['0', '1', '2', '3', '4', '5'], tex: ['0', '1', '2', '3', '4', '5'], op: (i, j) => (i + j) % 6, sym: '+', texSym: '+' };
const ELEMENT_COLORS = ['green', 'blue', 'purple', 'orange', 'red', 'gold'];

export default {
  collection: 'demo',
  chapter: 1,
  title: 'Kit demos',
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Algorithm',
      name: 'Dijkstra demo',
      statement: String.raw`**Dijkstra's algorithm.** In a directed graph with non-negative edge weights, repeatedly *extract* the unfinished vertex $u$ with the smallest tentative distance $d[u]$ and *relax* every edge $u\to v$: if $d[u]+w(u,v) < d[v]$, lower $d[v]$. Each extracted distance is final, and the parent pointers $\pi$ form a shortest-path tree.`,
      caption: String.raw`Step through the run (or press play) and watch the highlighted pseudocode line. **Edit the graph**: drag vertices, click a weight to raise it (shift-click lowers it), click two vertices in turn to add or remove an edge, click empty space to add a vertex, Alt-click to delete. The run restarts on every edit.`,
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330 });
        const G = v.graph(s, {
          directed: true, weights: true, editable: true, layout: 'none',
          nodes: [
            { id: 's', x: 0.8, y: 3, notePos: 'w' }, { id: 't', x: 3.6, y: 5.3 }, { id: 'x', x: 7.8, y: 5.3 },
            { id: 'y', x: 3.6, y: 0.7, notePos: 's' }, { id: 'z', x: 7.8, y: 0.7, notePos: 's' },
          ],
          edges: [['s', 't', 10], ['s', 'y', 5], ['t', 'x', 1], ['t', 'y', 2], ['y', 't', 3], ['y', 'x', 9], ['y', 'z', 2], ['x', 'z', 4], ['z', 'x', 6], ['z', 's', 7]],
        });
        let run = G.dijkstra('s');
        const S = v.steps({ frames: () => (run = G.dijkstra('s')).events, code: run.code, codeTitle: 'Dijkstra(G, s)', speed: 1.2 });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => G.draw(S.frame.view));
        v.legend([['gold', 'extracted now', { dot: true }], ['accent', 'final', { dot: true }], ['orange', 'tentative', { dot: true }], ['green', 'shortest-path tree']]);
        v.readout(() => {
          const d = run.dist, out = G.nodes.filter((n) => n.id !== 's').map((n) => `$d(${n.id}) = ${d[n.id] === Infinity ? '\\infty' : d[n.id]}$ (${G.path(run.prev, n.id).join('→') || 'unreachable'})`);
          return `Final: ${out.join(' · ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Algorithm',
      name: 'BFS on a grid graph',
      statement: String.raw`**Breadth-first search** visits vertices in order of their distance from the source: a FIFO queue guarantees that every vertex at distance $k$ is dequeued before any vertex at distance $k+1$, so the first time BFS reaches a vertex it has found a shortest path to it.`,
      caption: String.raw`Each step dequeues one vertex (gold) and discovers its unvisited neighbours (orange); numbers are distances from **S**. **Click a vertex to toggle a wall** and watch the wavefront flow around it; the green path is a shortest route to **T**.`,
      viz(v) {
        const R = 7, C = 12, id = (i, j) => i * C + j, src = id(3, 1), dst = id(3, 10);
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360 });
        const G = v.graph(s, { ...v.graphs('grid', R, C), r: 13, autoRadius: false, fontSize: 11.5, draggable: false });
        for (const n of G.nodes) n.label = n.id === src ? 'S' : n.id === dst ? 'T' : 'ABCDEFGHIJKL'[n.col] + (n.row + 1); // names used in the notes
        const walls = new Set([id(1, 4), id(2, 4), id(3, 4), id(4, 4), id(5, 4), id(0, 7), id(1, 7), id(2, 7), id(3, 7), id(5, 7), id(6, 7), id(4, 9), id(5, 9), id(4, 10)]);
        const frames = () => G.bfs(src, { skip: walls, detail: 'node' }).events;
        const S = v.steps({ frames, code: G.bfs(src).code, codeTitle: 'BFS(G, s)', codePos: 'below', speed: 5 });
        G.onClick = ({ node }) => {
          if (node && node.id !== src && node.id !== dst) { if (walls.has(node.id)) walls.delete(node.id); else walls.add(node.id); S.reset({ at: 'end' }); }
          return true;
        };
        v.render(() => {
          const f = S.frame, view = f.view || {}, reached = f.dist && f.dist[dst] < Infinity;
          const path = reached ? G.path(f.prev, dst) : [], onPath = new Set(path);
          const tree = new Set(Object.values(f.prevEdge || {}).filter(Boolean));
          G.draw({
            ...view,
            nodeFill: (k) => (walls.has(k) ? 'muted' : onPath.has(k) && S.atEnd ? 'green' : k === src && !view.nodeFill?.(k) ? 'ink' : view.nodeFill?.(k)),
            nodeColor: (k) => (onPath.has(k) ? 'green' : k === dst ? 'red' : view.nodeColor?.(k)),
            nodeLabel: (k) => (k === src ? 'S' : k === dst && !reached ? 'T' : walls.has(k) ? '' : f.dist?.[k] < Infinity ? f.dist[k] : ''),
            nodeNote: null,
            edgeColor: (e) => view.edgeColor?.(e) === 'orange' ? 'orange' : tree.has(e) ? 'green' : null,
            edgeWidth: (e) => (view.edgeColor?.(e) === 'orange' ? 3.2 : tree.has(e) ? 1.6 : null),
            highlightPath: path,
            dim: [...walls],
          });
        });
        v.readout(() => {
          const f = S.frame; if (!f.dist) return '';
          return f.dist[dst] < Infinity ? `Shortest S→T distance: **${f.dist[dst]}** (BFS has visited ${f.done.length} vertices).` : `Queue: ${f.queue.length} vertices waiting · visited ${f.done.length}${S.atEnd ? ' — **T is unreachable**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Algorithm',
      name: 'Kruskal minimum spanning tree',
      statement: String.raw`**Kruskal's algorithm.** Scan the edges in order of increasing weight and keep an edge exactly when it joins two different trees of the forest built so far (a union–find structure answers this). By the cut property every kept edge is safe, so the result is a minimum spanning tree.`,
      caption: String.raw`Vertices are coloured by the tree they currently belong to; watch the colours merge. Rejected edges (dashed red) would close a cycle. Click a weight to change it (shift-click lowers it) — the run is recomputed.`,
      viz(v) {
        const s = v.stage({ x: [-0.45, 4.85], y: [-0.4, 2.4], axes: false, equal: true, height: 320 });
        const P = { a: [0, 1], b: [1, 2], c: [2.2, 2], d: [3.4, 2], e: [4.4, 1], f: [3.4, 0], g: [2.2, 0], h: [1, 0], i: [1.65, 1] };
        const G = v.graph(s, {
          weights: true, layout: 'none', editable: { editWeight: true },
          nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })),
          edges: [['a', 'b', 4], ['a', 'h', 8], ['b', 'h', 11], ['b', 'c', 8], ['c', 'i', 2], ['c', 'f', 4], ['c', 'd', 7], ['d', 'f', 14], ['d', 'e', 9], ['e', 'f', 10], ['f', 'g', 2], ['g', 'i', 6], ['g', 'h', 1], ['h', 'i', 7]],
        });
        const first = G.mst();
        const S = v.steps({ frames: () => G.mst().events, code: first.code, codeTitle: 'Kruskal(G)', speed: 1.2 });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => G.draw(S.frame.view));
        v.legend([['green', 'tree edge'], ['red', 'rejected (cycle)', { dash: true }]]);
        v.readout(() => `Edges kept: ${S.frame.chosen?.length ?? 0} of ${G.nodes.length - 1} · weight so far **${S.frame.weight ?? 0}**`);
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Algorithm',
      name: 'Edmonds–Karp maximum flow',
      statement: String.raw`**Edmonds–Karp.** While the residual graph $G_f$ contains an $s$–$t$ path, augment along a *shortest* one (found by BFS) by its bottleneck capacity. Backward residual arcs let later paths cancel earlier flow. When no path is left, the vertices reachable from $s$ form a cut whose capacity equals the flow value (max-flow = min-cut).`,
      caption: String.raw`Left: the network, labelled flow/capacity (line width ∝ flow). Right: the residual graph — grey forward arcs carry the spare capacity, dashed purple backward arcs the flow that could be cancelled. The orange path is the next augmentation; the final step shows the minimum cut.`,
      viz(v) {
        const win = { x: [-0.32, 3.32], y: [-0.42, 2.42], axes: false, equal: true, height: 290 };
        const s1 = v.stage({ ...win, title: 'Flow network  (flow / capacity)' });
        const s2 = v.stage({ ...win, title: 'Residual graph $G_f$' });
        const nodes = [
          { id: 's', x: 0, y: 1 }, { id: 'v1', label: '$v_1$', x: 1, y: 2 }, { id: 'v2', label: '$v_2$', x: 1, y: 0 },
          { id: 'v3', label: '$v_3$', x: 2, y: 2 }, { id: 'v4', label: '$v_4$', x: 2, y: 0 }, { id: 't', x: 3, y: 1 },
        ];
        const G = v.graph(s1, { directed: true, layout: 'none', nodes, edges: [['s', 'v1', 16], ['s', 'v2', 13], ['v2', 'v1', 4], ['v1', 'v3', 12], ['v3', 'v2', 9], ['v2', 'v4', 14], ['v4', 'v3', 7], ['v3', 't', 20], ['v4', 't', 4]] });
        const R = v.graph(s2, { directed: true, weights: true, layout: 'none', nodes }); // same node objects: dragging moves both
        const run = G.maxflow('s', 't');
        const S = v.steps({ frames: run.events, code: run.code, codeTitle: 'Edmonds–Karp(G, s, t)', codePos: 'below', speed: 0.8 });
        v.render(() => { const f = S.frame; G.draw(f.view); R.edges = f.residual; R.draw(f.residualView); });
        v.legend([['orange', 'augmenting path'], ['accent', 'carries flow'], ['purple', 'backward residual arc', { dash: true }], ['red', 'min cut'], ['teal', 'source side of the cut', { dot: true }]]);
        v.readout(() => `Flow value: **${S.frame.value}**${S.frame.bottleneck ? ` · bottleneck of the current path: ${S.frame.bottleneck}` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Algorithm',
      name: 'DP table: LCS and edit distance',
      statement: String.raw`**Dynamic programming on prefixes.** The length $c[i,j]$ of a longest common subsequence of $x_1\dots x_i$ and $y_1\dots y_j$ satisfies $c[i,j]=c[i-1,j-1]+1$ if $x_i=y_j$ and $\max(c[i-1,j],c[i,j-1])$ otherwise; the edit distance obeys $D[i,j]=\min(D[i-1,j]+1,\,D[i,j-1]+1,\,D[i-1,j-1]+[x_i\ne y_j])$. Filling the table row by row costs $O(mn)$.`,
      caption: String.raw`The current cell (gold) is computed from the orange cells it depends on; small arrows record which one won. After the fill, the trace-back (green) follows the arrows from the bottom-right corner. Switch problems with the selector.`,
      viz(v) {
        const PROB = { lcs: { X: 'ABCBDAB', Y: 'BDCABA', code: LCS_CODE, title: 'LCS-Length(x, y)' }, edit: { X: 'KITTEN', Y: 'SITTING', code: EDIT_CODE, title: 'Edit-Distance(x, y)' } };
        let mode = 'lcs';
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370 });
        const T = v.table(s, { maxCell: 40, size: 14.5 });
        const S = v.steps({ frames: () => dpFrames(mode, PROB[mode].X, PROB[mode].Y), code: LCS_CODE, codeTitle: PROB.lcs.title, speed: 4 });
        v.select('', [{ value: 'lcs', label: 'Longest common subsequence' }, { value: 'edit', label: 'Edit distance' }], 'lcs', { onChange: (m) => { mode = m; S.setCode(PROB[m].code, PROB[m].title); S.reset(); } });
        v.render(() => {
          const f = S.frame, { X, Y } = PROB[mode], key = (i, j) => i * 100 + j, path = f.path || [];
          const onPath = new Set(path.map(([i, j]) => key(i, j))), deps = new Set((f.deps || []).map(([i, j]) => key(i, j)));
          const diag = new Set(); for (let k = 0; k + 1 < path.length; k++) if (path[k][0] - path[k + 1][0] === 1 && path[k][1] - path[k + 1][1] === 1 && X[path[k][0] - 1] === Y[path[k][1] - 1]) diag.add(key(...path[k]));
          T.draw({
            rows: X.length + 1, cols: Y.length + 1,
            rowLabels: ['', ...X], colLabels: ['', ...Y], cornerLabel: '',
            value: (i, j) => f.vals[i][j],
            fill: (i, j) => (f.cur && f.cur[0] === i && f.cur[1] === j ? ['gold', 0.42] : deps.has(key(i, j)) ? ['orange', 0.3] : diag.has(key(i, j)) ? ['green', 0.42] : onPath.has(key(i, j)) ? ['green', 0.16] : null),
            textColor: (i, j) => (f.vals[i][j] == null ? null : onPath.has(key(i, j)) || (f.cur && f.cur[0] === i && f.cur[1] === j) ? 'ink' : 'muted'),
            weight: (i, j) => (onPath.has(key(i, j)) || (f.cur && f.cur[0] === i && f.cur[1] === j) ? 700 : 500),
            highlight: f.cur ? [f.cur] : [], activeRow: f.cur?.[0], activeCol: f.cur?.[1],
            rowLabelColor: (i) => (diag.size && [...diag].some((k) => Math.floor(k / 100) === i) ? 'green' : null),
          });
          for (let i = 0; i <= X.length; i++) for (let j = 0; j <= Y.length; j++) if (f.ptr[i][j] && !(f.cur && f.cur[0] === i && f.cur[1] === j)) T.pointer(i, j, f.ptr[i][j], { color: onPath.has(key(i, j)) ? 'green' : 'faint' });
          if (f.cur) { const [di, dj] = f.ptr[f.cur[0]][f.cur[1]]; T.arrow(f.cur, [f.cur[0] + di, f.cur[1] + dj], { color: 'accent', width: 2.2 }); }
          for (let k = 0; k + 1 < path.length; k++) T.arrow(path[k], path[k + 1], { color: 'green', width: 2.6 });
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Cayley table of a group',
      statement: String.raw`The **Cayley table** of a finite group lists every product $g_i g_j$. Each row and each column contains every element exactly once (a *Latin square*), because left and right multiplication by a fixed element are bijections. The table is symmetric about its diagonal exactly when the group is abelian.`,
      caption: String.raw`Colours identify elements, so the Latin-square pattern is visible at a glance. Click a cell to read off its product; switch on the marker to see the pairs that do not commute — there are none in $\Z/6$, but $S_3$ (the symmetries of a triangle: rotation $r$, reflection $s$) is not abelian.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360 });
        const T = v.table(s, { maxCell: 46, size: 15 });
        const which = v.select('Group', [{ value: 'S3', label: '$S_3$' }, { value: 'Z6', label: '$\\Z/6$' }], 'S3');
        const comm = v.toggle('mark pairs with $ab\\neq ba$', true);
        let sel = [1, 3];
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        v.render(() => {
          const G = which.value === 'S3' ? S3 : Z6, n = G.n;
          T.draw({
            rows: n, cols: n, rowLabels: G.labels, colLabels: G.labels, cornerLabel: G.sym,
            value: (i, j) => G.labels[G.op(i, j)],
            fill: (i, j) => [ELEMENT_COLORS[G.op(i, j)], i === sel[0] || j === sel[1] ? 0.4 : 0.2],
            highlight: [sel], activeRow: sel[0], activeCol: sel[1],
            sub: (i, j) => (comm.value && G.op(i, j) !== G.op(j, i) ? '≠' : ''), subColor: 'red', subSize: 14,
          });
        });
        v.readout(() => {
          const G = which.value === 'S3' ? S3 : Z6, [i, j] = sel, a = G.tex[i], b = G.tex[j], ab = G.tex[G.op(i, j)], ba = G.tex[G.op(j, i)];
          return `$${a} ${G.texSym} ${b} = ${ab}$` + (ab !== ba ? `, but $${b} ${G.texSym} ${a} = ${ba}$` : `$\\;= ${b} ${G.texSym} ${a}$`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Layered DAG (technology tree)',
      statement: String.raw`A directed acyclic graph can be drawn in **layers** so that every edge points downward: assign each vertex the length of the longest path reaching it, insert dummy points on long edges, reorder each layer by the barycentre of its neighbours to remove crossings, then align vertices with their neighbours (the Sugiyama framework).`,
      caption: String.raw`Click an invention to see what it builds on (orange) and what it enabled (teal); long edges are routed through the intermediate layers. Switch the drawing direction with the selector.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430 });
        const N = { fire: 'Fire', tools: 'Stone\ntools', farm: 'Agriculture', pot: 'Pottery', wheel: 'Wheel', bronze: 'Bronze', write: 'Writing', iron: 'Iron', math: 'Mathematics', sail: 'Sailing', astro: 'Astronomy', nav: 'Navigation', paper: 'Paper', print: 'Printing\npress', cart: 'Chariot' };
        const E = [['fire', 'pot'], ['fire', 'bronze'], ['tools', 'farm'], ['farm', 'pot'], ['farm', 'write'], ['pot', 'wheel'], ['wheel', 'cart'], ['bronze', 'cart'], ['bronze', 'iron'], ['write', 'math'], ['math', 'astro'], ['astro', 'nav'], ['sail', 'nav'], ['tools', 'sail'], ['write', 'paper'], ['paper', 'print'], ['iron', 'print'], ['math', 'nav']];
        const G = v.graph(s, { directed: true, shape: 'box', layout: 'layered', r: 11, fontSize: 12, nodes: Object.entries(N).map(([id, label]) => ({ id, label })), edges: E });
        v.select('Direction', [{ value: 'down', label: 'top → bottom' }, { value: 'right', label: 'left → right' }], 'down', { onChange: (d) => G.layout('layered', { rankdir: d }) });
        let focus = 'print';
        G.onClick = ({ node }) => { focus = node ? node.id : null; return true; };
        const reach = (id, dir) => { const out = new Set(), q = [id]; while (q.length) { const u = q.shift(); for (const a of dir === 'up' ? G.inn(u) : G.adj(u)) if (!out.has(a.id)) { out.add(a.id); q.push(a.id); } } return out; };
        v.render(() => {
          const anc = focus ? reach(focus, 'up') : new Set(), desc = focus ? reach(focus, 'down') : new Set();
          const rel = (id) => !focus || id === focus || anc.has(id) || desc.has(id);
          G.draw({
            nodeFill: (id) => (id === focus ? 'accent' : null),
            nodeColor: (id) => (anc.has(id) ? 'orange' : desc.has(id) ? 'teal' : null),
            edgeColor: (e) => (focus && (anc.has(e.from) || e.from === focus) && (anc.has(e.to) || e.to === focus) && e.from !== focus ? 'orange' : focus && (desc.has(e.to)) && (desc.has(e.from) || e.from === focus) ? 'teal' : null),
            edgeWidth: (e) => (focus && rel(e.from) && rel(e.to) && (anc.has(e.from) || desc.has(e.to)) ? 2.6 : null),
            dim: G.nodes.filter((n) => !rel(n.id)).map((n) => n.id),
          });
        });
        v.readout(() => {
          if (!focus) return 'Click an invention.';
          const a = reach(focus, 'up').size, d = reach(focus, 'down').size;
          return `**${G.lab(focus)}** builds on ${a} earlier invention${a === 1 ? '' : 's'} and enabled ${d} later one${d === 1 ? '' : 's'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Concept',
      name: 'Tidy tree (binary search tree)',
      statement: String.raw`Inserting keys into a **binary search tree** walks down from the root, going left for smaller and right for larger keys, and hangs the new key where the walk falls off. The tree is drawn with a *tidy* layout: subtrees are packed as closely as their contours allow, parents sit centred over their children, and left/right children keep their side.`,
      caption: String.raw`Drag the slider to insert more keys; the newest key is gold and the comparisons it went through are green. The layout re-packs the subtrees after every insertion.`,
      viz(v) {
        const keys = [50, 30, 72, 18, 41, 60, 85, 9, 25, 36, 47, 66, 79, 93, 22, 39, 44, 63, 55, 3];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const k = v.slider('keys inserted', 1, keys.length, 14, { int: true });
        const G = v.graph(s, { nodes: [], edges: [], layout: 'none', r: 13, draggable: false });
        let built = 0, path = [], height = 0;
        const build = (n) => {
          const left = new Map(), right = new Map(), edges = [];
          for (const key of keys.slice(1, n)) {
            let u = keys[0];
            for (;;) { const M = key < u ? left : right; if (!M.has(u)) { M.set(u, key); edges.push({ from: u, to: key, side: key < u ? 'left' : 'right' }); break; } u = M.get(u); }
          }
          G.set({ nodes: keys.slice(0, n).map((id) => ({ id })), edges }).layout('tree', { root: keys[0] });
          const last = keys[n - 1]; path = [keys[0]]; let u = keys[0];
          while (u !== last) { u = last < u ? left.get(u) : right.get(u); path.push(u); }
          const depth = (u, d) => Math.max(d, ...[left.get(u), right.get(u)].filter((x) => x != null).map((c) => depth(c, d + 1)));
          height = depth(keys[0], 0);
        };
        v.render(() => {
          if (k.value !== built) { build(k.value); built = k.value; }
          G.draw({ highlightPath: path, nodeFill: (id) => (id === keys[k.value - 1] ? 'gold' : null) });
        });
        v.readout(() => `Inserted **${keys[k.value - 1]}** after ${path.length - 1} comparison${path.length === 2 ? '' : 's'} (${path.slice(0, -1).join(' → ') || 'it is the root'}) · ${k.value} keys, height ${height}`);
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Graph gallery: generators and layouts',
      statement: String.raw`Standard graphs from **v.graphs(name, …)**: the Petersen graph, grid graphs, complete graphs, cycles, hypercubes, complete binary trees and random $G(n,p)$ graphs, each with a layout of your choice. Distances from a chosen vertex come from breadth-first search.`,
      caption: String.raw`Pick a graph and a layout, then click a vertex to colour every vertex by its BFS distance from it; drag vertices to rearrange.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360 });
        const GENS = { petersen: [], grid: [4, 6], complete: [7], cycle: [10], hypercube: [3], tree: [3, 2], random: [14, 0.2, 5] };
        const gen = v.select('', Object.keys(GENS), 'petersen');
        const lay = v.select('layout', ['auto', 'force', 'circle', 'grid'], 'auto');
        const G = v.graph(s, { nodes: [], edges: [], layout: 'none' });
        let key = '', src = 0, bfs = null;
        G.onClick = ({ node }) => { if (node) { src = node.id; bfs = G.bfs(src); } return true; };
        const RING = ['accent', 'teal', 'orange', 'purple', 'pink', 'gold', 'green', 'red'];
        v.render(() => {
          if (key !== gen.value + lay.value) {
            key = gen.value + lay.value; const spec = v.graphs(gen.value, ...GENS[gen.value]);
            G.set({ shape: 'circle', r: 13, directed: false, ...spec });
            G.layout(lay.value === 'auto' ? spec.layout : lay.value, spec); src = 0; bfs = G.bfs(src);
          }
          G.draw({ nodeFill: (id) => (id === src ? 'ink' : null), nodeColor: (id) => (bfs.dist[id] < Infinity ? RING[(bfs.dist[id] - 1) % RING.length] : 'faint'), nodeNote: null, highlightPath: null });
        });
        v.readout(() => { const ds = Object.values(bfs.dist).filter((d) => d < Infinity); return `${G.nodes.length} vertices, ${G.edges.length} edges · eccentricity of ${G.lab(src)}: ${Math.max(...ds)} · ${G.components().length} component(s)`; });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Algorithm',
      name: 'Insertion sort with animated steps',
      statement: String.raw`**Insertion sort** grows a sorted prefix: each new key is lifted out, larger elements of the prefix shift one place right, and the key drops into the gap. It makes between $n-1$ and $\binom n2$ comparisons — linear on sorted input, quadratic on reversed input.`,
      caption: String.raw`Press play: bars glide between steps (S.prev and S.tween). The gold bar is the key held aside, orange the element it is compared with. Shuffle for a new input or try the extremes.`,
      viz(v) {
        const n = 10, s = v.stage({ x: [-0.7, n - 0.3], y: [-1.6, 23], axes: false, height: 300 });
        let vals = [5, 2, 9, 4, 7, 1, 8, 3, 10, 6];
        const S = v.steps({ frames: () => insertionFrames(vals), code: INSERTION_CODE, codeTitle: 'Insertion-Sort(A)', speed: 2.5, transition: 0.32 });
        const rng = v.rng(7);
        v.button('Shuffle', () => { vals = rng.shuffle(vals); S.reset(); });
        v.button('Sorted', () => { vals = vals.slice().sort((a, b) => a - b); S.reset(); });
        v.button('Reversed', () => { vals = vals.slice().sort((a, b) => b - a); S.reset(); });
        v.render(() => {
          const f = S.frame, g = S.prev, t = S.tween, LIFT = 12;
          s.line(-0.6, 0, n - 0.4, 0, { color: 'faint', width: 1 });
          for (let id = 0; id < n; id++) {
            const [p1, l1] = f.pos[id], [p0, l0] = (g.pos || f.pos)[id], x = p0 + (p1 - p0) * t, lift = (l0 + (l1 - l0) * t) * LIFT, h = vals[id];
            const col = id === f.key ? 'gold' : id === f.cmp ? 'orange' : f.pos[id][0] < f.sorted && f.key !== id ? 'green' : 'accent';
            s.rect(x - 0.36, lift, x + 0.36, lift + h, { fill: col, fillAlpha: id === f.key || id === f.cmp ? 0.85 : 0.55, color: col, width: 1.2 });
            s.text(String(h), x, lift + h, { align: 'center', dy: -9, size: 12, weight: 600, color: col === 'accent' ? 'ink' : col });
          }
          if (f.sorted) s.text('sorted prefix', (f.sorted - 1) / 2, -0.9, { align: 'center', size: 11, color: 'green' });
        });
      },
    },
  ],
};
