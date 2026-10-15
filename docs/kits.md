# Visualization kits

Kits are higher-level building blocks on the viz API: `v.graph`, `v.graphs`, `v.steps`, `v.table`.
Like stages and controls, **create them once** in `viz(v)` and **draw inside `v.render`**. No imports.
Every kit draws with palette names only, so it works in light and dark.

Working examples of everything below: `tools/demos/kits.js`, rendered by
`tools/harness.html?file=tools/demos/kits.js&id=demo-1.1` (ids `demo-1.1` … `demo-1.13`; add `&theme=dark`).

| demo | shows |
|---|---|
| 1.1 | Dijkstra on an editable weighted digraph + pseudocode (`G.dijkstra(s).events` → `v.steps`) |
| 1.2 | BFS wavefront on `v.graphs('grid')`, click to toggle walls (`skip`, `onClick`, `S.reset`) |
| 1.3 | Kruskal MST, vertices coloured by union–find tree, editable weights |
| 1.4 | Edmonds–Karp: network (flow/capacity) + residual graph on a second stage sharing the nodes |
| 1.5 | LCS / edit-distance DP table filled cell by cell, back-pointers, trace-back (`v.table` + `v.steps`, `S.setCode`) |
| 1.6 | Cayley tables of $S_3$ and $\Z/6$ with TeX entries, click a cell, non-commuting marks |
| 1.7 | Layered DAG (technology tree), box nodes, ancestors/descendants on click, rank direction |
| 1.8 | Tidy binary tree (BST insertion), left/right children via `side` |
| 1.9 | Generator gallery (`v.graphs`) × layouts, BFS distances |
| 1.10 | Insertion sort with gliding transitions (`transition`, `S.prev`, `S.tween`) |
| 1.11 | Euclid by cutting squares — `v.steps` without a graph, `vars` chips |
| 1.12 | Payoff matrices with best responses (pair values) |
| 1.13 | DFS edge classification (d/f times, self-loop) and Kahn's topological sort with cycle detection |
| 1.14 | Automaton notation: start arrow, accepting double ring, contrast labels on filled nodes |
| 1.15 | Icon array of 1000 screened people; split by test result (`block`) to read off $P(\text{ill}\mid +)$ |
| 1.16 | Parliament hemicycle under d'Hondt / Sainte-Laguë apportionment |

---

## 1. `v.graph(stage, spec)` → `G`

Node-link diagrams. Positions live on the node objects in **data coordinates** (`n.x`, `n.y`); layouts are
computed in pixels inside the stage's view window (so circles stay round). Use a stage with `axes: false`
(and usually `equal: true`).

### Spec

| key | default | |
|---|---|---|
| `nodes` | from edges | `[{id, x?, y?, label?, color?, fill?, r?, shape?, labelPos?, notePos?, fixed?, layer?, hidden?}]` or bare ids. Objects are used as given (share them between two graphs to share positions). |
| `edges` | `[]` | `[{from, to, w?, cap?, label?, color?, width?, dash?, directed?, bend?, angle?, side?}]` or `[from, to, w]` / `[from, to, {…}]`. |
| `directed` | `false` | arrows; per-edge `directed` overrides. |
| `weights` | `false` | show `e.w` (default 1) as edge labels. |
| `layout` | `'none'` if every node has x, y, else `'force'` | see layouts. |
| `editable` | `false` | `true` or `{addNode, addEdge, deleteNode, deleteEdge, editWeight, moveNode, weight (new edge), minWeight, maxWeight}`. |
| `draggable` | `true` | drag nodes (`false` for read-only pictures; then touch scrolling is not blocked). |
| `onChange(kind, obj, G)` | | after an edit: `'add-node' 'add-edge' 'remove-node' 'remove-edge' 'weight' 'move'`. |
| `onClick({node, id, edge, x, y, shift, alt})` | | any click; return `true` to skip the default editing action. |
| `r` | 13 | node radius px (grows to fit an inside label unless `autoRadius: false`). |
| `shape` | `'circle'` | `'box'`: rounded rectangle sized to the label (`'\n'` = two lines). |
| `labelPos` | `'in'` | `'in'` or `'n' 'ne' 'e' 'se' 's' 'sw' 'w' 'nw'` (label beside a small node). |
| `notePos` | `'n'` | where `nodeNote` text goes. |
| `fontSize` | 12.5 | node label px. Labels `'$…$'` render with KaTeX. |
| `seed`, `rankdir`, `root`, … | | layout options, below. |
| `style` | | default `draw()` options. |

### Layouts — `G.layout(name, opts)` (also the `layout` spec key)

| name | |
|---|---|
| `'none'` | use `n.x, n.y` (data units); missing ones go on a circle. |
| `'fit'` | treat `n.x, n.y` as relative coordinates (y up) and fit them into the view, keeping the aspect ratio. |
| `'circle'` | evenly spaced, clockwise from `startAngle` (90 = top). |
| `'grid'` | row-major, `cols` (default ≈ √n), or the nodes' `row`/`col`. |
| `'force'` | seeded Fruchterman–Reingold, fixed `iterations` (300), best of `restarts` seeds by edge crossings, principal-axis aligned; `fixed` nodes stay put. Deterministic for a given `seed`. |
| `'layered'` | Sugiyama-lite for DAGs: cycles broken, longest-path layers (pin with `n.layer`), dummy points on long edges (drawn as smooth routes), barycentre crossing reduction, aligned coordinates. `rankdir: 'down' \| 'right' \| 'up' \| 'left'`, `gap` px. |
| `'tree'` | tidy tree (Reingold–Tilford contours) from `root` (default: first node, or first source if directed); children in edge order, `e.side: 'left' \| 'right'` keeps binary-tree sides; `tidy: false` = leaves evenly spaced (dendrogram); `rankdir` as above; extra components laid out side by side. |

`layout()` never triggers a redraw by itself; call it in a control callback or inside `render` (cheap).
Dragging a node clears the routed points of its edges.

### Drawing — `G.draw(opts)` inside `v.render`

Function options receive `(id, node)` for nodes and `(edge)` for edges. For colour/width functions, returning
`null`/`undefined` means "default"; for label functions the return value is used as is (`null` = no label).

| option | |
|---|---|
| `nodeColor` | outline + light tint. |
| `nodeFill` | solid disc (label switches to the panel colour) — use for "visited"/"current". |
| `nodeLabel` | text inside/beside the node (e.g. a distance instead of the name). |
| `nodeNote`, `noteColor` | small bold text beside the node at `notePos` (distances, `d/f` times, in-degrees). |
| `nodeRing` | colour of an extra outer ring. `labelColor` overrides label colours (labels on solid `nodeFill` discs pick dark or white ink automatically for contrast). |
| `accept`, `start`, `startDir` | automata: `accept` (id, array, Set or `(id, node) => bool`) draws a double ring; `start` draws an incoming arrow on the node's free side (or `startDir`). Can also be set once in the spec. See tools/demos/kits.js demo-1.14. |
| `edgeColor`, `edgeWidth`, `edgeDash` | per-edge style (default muted, 1.7 px). |
| `edgeLabel`, `edgeLabelColor` | replaces the weight label (e.g. `` e => `${f}/${c}` ``); drawn on a halo pill at the arc midpoint. |
| `highlightPath: [ids]`, `pathColor` | thick edges along consecutive ids (default green). |
| `dim` | array/Set of node ids and edge objects drawn faded (incident edges of dim nodes too). |
| `arrows` | `false` hides arrowheads. |

Rendering rules: arrows stop at node boundaries (circles and boxes); parallel and antiparallel edges bend
apart symmetrically (`e.bend` px overrides); self-loops point away from the neighbours (`e.angle` degrees);
long layered edges follow their routed points.

### Data and queries

| member | |
|---|---|
| `G.nodes`, `G.edges` | arrays (assigning a new array is fine, e.g. `R.edges = f.residual` each frame). |
| `G.node(id)`, `G.has(id)`, `G.edge(a, b)` | lookups (`edge` matches either direction when undirected). |
| `G.adj(id)` → `[{id, edge, w}]` | out-neighbours (all neighbours if undirected); `G.inn(id)` in-neighbours; `G.neighbors(id)`; `G.degree(id)`. |
| `G.addNode({id, x, y} \| id, x?, y?)`, `G.addEdge(a, b, w \| {…})`, `G.removeNode(id)`, `G.removeEdge(e \| a, b)`, `G.clear()` | edits (no redraw by themselves). |
| `G.set({nodes, edges, directed, weights, …style})` | replace the whole graph (chainable: `G.set(spec).layout('tree')`). |
| `G.matrix(weighted)` | adjacency matrix in node order. |
| `G.lab(id)` | label text (for notes). |
| `G.hitNode(x, y)` → node \| null, `G.hitEdge(x, y)` → edge \| null, `G.hit(x, y)` → `{node, id}` \| `{edge}` \| null | data coordinates; edges hit on the line or the label. |
| `G.path(prev, t)` | ids from the source to `t` along `prev` pointers (`[]` if unreachable). |

### Editing (when `editable`)

drag a node = move · click empty space = add a node · click a node, then another = add (or remove) that edge ·
shift-drag from a node to a node = add an edge · click a weight = +1, shift-click = −1 (wraps in
`[minWeight, maxWeight]`, default max = max(9, 1.5 × largest weight)) · Alt-click a node/edge = delete ·
select a node + Delete/Backspace = delete · Esc = deselect. Each edit calls `onChange`.

### Algorithms (with step events)

Each returns its result plus `code` (pseudocode lines) and `events`. **Every event is a complete snapshot**:
`{type, line, note, node?, edge?, to?, …state, view}` where `view` is a ready-made `G.draw` option object.
So `v.steps({ frames: r.events, code: r.code })` + `G.draw(S.frame.view)` animates the algorithm; spread the
view to customise it: `G.draw({ ...S.frame.view, nodeNote: null })`.

| call | result | event types · state in each event |
|---|---|---|
| `G.bfs(s, {skip, detail})` | `{dist, prev, prevEdge, order}` | `init dequeue discover edge done` (or one `visit` per vertex with `detail: 'node'`) · `dist prev prevEdge queue done` |
| `G.dfs(s?, {skip})` | `{d, f, prev, order, post, kinds}` | `enter tree back forward cross finish done` · `color d f prev stack order post kinds` |
| `G.dijkstra(s, {skip, all})` | `{dist, prev, prevEdge, order}` | `init extract relax unreachable done` (+ `improved old new`) · `dist prev prevEdge done` |
| `G.topoSort()` | `{order, cycle}` | `init pop decrement push done` · `indeg queue order removed` |
| `G.mst()` | `{edges, weight}` (Kruskal) | `init accept reject done` · `chosen rejected comp (node → colour) weight sorted` |
| `G.maxflow(s, t)` | `{value, flow, cut}` (Edmonds–Karp; capacity `e.cap ?? e.w`) | `init path augment done` · `flow value path residual bottleneck cut`, plus `residualView` |
| `G.residual(flow)` | `[{from, to, w, forward, edge, key}]` | residual arcs, ready to assign to a second graph's `edges` |
| `G.components()`, `G.scc()` | arrays of id arrays | connected (direction ignored) / strongly connected (Tarjan) |

`skip`: ids, a Set, or `(id, edge) => bool` (vertices/edges to ignore, e.g. walls). State maps are keyed by
`String(id)` (`f.dist[id]` works for numeric ids too). Default colours follow the site: gold = current,
accent = finished, orange = frontier/tentative, green = tree/result, red = rejected/cut.

### Generators — `v.graphs(name, ...args)` → `{nodes, edges, layout, …}`

Spread into a spec: `v.graph(s, { ...v.graphs('petersen'), r: 12 })`. `v.graphs()` returns the table.

| name | |
|---|---|
| `random(n, p, seed, {weights: [lo, hi]})` | $G(n,p)$, force layout |
| `grid(r, c)` | ids `i*c + j`, nodes carry `row`, `col` |
| `complete(n)`, `cycle(n)`, `path(n)`, `star(n)`, `wheel(n)` | |
| `bipartite(m, n)` | $K_{m,n}$ in two columns |
| `tree(depth, k)` | complete k-ary tree rooted at 0 |
| `hypercube(d)` | binary-string labels, box nodes |
| `petersen()` | outer pentagon + inner pentagram |
| `fromAdjacency(A, labels?)` | directed unless symmetric, weighted if any entry ≠ 0/1 |

(`v.graph.petersen()` style access needs a core change that copies a kit's static members onto `v.graph`;
use `v.graphs` meanwhile.)

### Example — Dijkstra on an editable graph (demo 1.1)

```js
viz(v) {
  const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330 });
  const G = v.graph(s, {
    directed: true, weights: true, editable: true, layout: 'none',
    nodes: [{ id: 's', x: 0.8, y: 3, notePos: 'w' }, { id: 't', x: 3.6, y: 5.3 }, { id: 'x', x: 7.8, y: 5.3 },
            { id: 'y', x: 3.6, y: 0.7, notePos: 's' }, { id: 'z', x: 7.8, y: 0.7, notePos: 's' }],
    edges: [['s', 't', 10], ['s', 'y', 5], ['t', 'x', 1], ['t', 'y', 2], ['y', 't', 3], ['y', 'x', 9],
            ['y', 'z', 2], ['x', 'z', 4], ['z', 'x', 6], ['z', 's', 7]],
  });
  let run = G.dijkstra('s');
  const S = v.steps({ frames: () => (run = G.dijkstra('s')).events, code: run.code, codeTitle: 'Dijkstra(G, s)' });
  G.onChange = () => S.reset({ at: 'end' });          // re-run after every edit, show the result
  v.render(() => G.draw(S.frame.view));
  v.legend([['gold', 'extracted now', { dot: true }], ['accent', 'final', { dot: true }],
            ['orange', 'tentative', { dot: true }], ['green', 'shortest-path tree']]);
  v.readout(() => G.nodes.map((n) => `$d(${n.id}) = ${run.dist[n.id] === Infinity ? '\\infty' : run.dist[n.id]}$`).join(' · '));
}
```

---

## 2. `v.steps(spec)` → `S`

A step-through player for algorithms, proofs and constructions. Adds ⏮ ◀ ▶/⏸ ▶| buttons (with
aria-labels; ←/→/Home/End work when a button has focus), a scrubber and a "step k / n" counter at the front of
the controls row; optionally a pseudocode panel (beside the stages, wrapping below on narrow screens) and a note
line under the stages. Every step redraws (`v.render` runs); it pauses on the global `vizpause` event, does not
autoplay under `prefers-reduced-motion` or the checker's still mode, and cleans up its timers.

| spec key | default | |
|---|---|---|
| `frames` | | array of frame objects, or a function returning one (re-run by `S.reset()`). |
| `code`, `codeTitle` | | pseudocode lines (`$TeX$` allowed; keywords bold, `//` or `▷` comments muted). |
| `codePos` | `'side'` | `'below'` = full-width panel under the stages. `codeWidth` px fixes its width. |
| `speed` | 1.5 | steps per second while playing (`S.speed` is writable). |
| `autoplay`, `loop` | `false` | |
| `start` | 0 | initial step (index or `'end'`); `still` = step shown in still/screenshot mode. |
| `transition` | 0 | seconds over which `S.tween` runs 0 → 1 after each step (for gliding animations). |
| `note` | auto | `false` hides the note line; `true` forces it. |
| `counter` | `'step'` | counter word. `onChange(frame, i)` callback. |

Frame fields read by the player (everything else is yours): `line` or `lines` (1-based number or array,
highlighted in the code panel), `note` (rich text/TeX, or `f => string`), `vars` (`{name: value}` shown as
chips under the note), `hold` (dwell multiplier while playing).

| member | |
|---|---|
| `S.frame` | current frame (`{}` if there are none); `S.prev` = the frame shown before it. |
| `S.i`, `S.n`, `S.frames`, `S.atEnd`, `S.playing` | |
| `S.tween` | eased 0 → 1 since the last step (1 when `transition` is 0, paused, or still). Interpolate `S.prev` → `S.frame`. |
| `S.set(i)`, `S.next()`, `S.back()`, `S.first()`, `S.last()`, `S.play()`, `S.pause()`, `S.toggle()` | navigation (all redraw). |
| `S.reset(frames?, {at: 'start' \| 'end' \| 'keep' \| i})` | new frames (or re-run the frames function), e.g. after the user edits the input. |
| `S.setCode(lines, title?)` | swap the pseudocode (e.g. when a selector switches algorithm). |
| `S.el`, `S.codeEl`, `S.noteEl` | DOM elements (hide with `.hidden = true`). |

### Example — Euclid by cutting squares (demo 1.11)

```js
viz(v) {
  const s = v.stage({ x: [-0.5, 21.5], y: [-0.5, 8.5], equal: true, axes: false, height: 260 });
  const frames = [{ squares: [], rest: [0, 0, 21, 8], line: [], note: String.raw`A $21\times 8$ rectangle.` }];
  let [x, y, w, h] = [0, 0, 21, 8]; const sq = [];
  while (w > 0 && h > 0) {
    const q = Math.min(w, h); sq.push([x, y, q]);
    if (w > h) { x += q; w -= q; } else { y += q; h -= q; }
    frames.push({ squares: sq.slice(), rest: [x, y, w, h], line: w === 0 || h === 0 ? 4 : w >= h ? 2 : 3,
      vars: { a: w || q, b: h || q }, note: w && h ? `Cut off a ${q} × ${q} square.` : `$\\gcd(21, 8) = ${q}$.` });
  }
  const S = v.steps({ frames, code: ['while a ≠ b', '  if a > b:  a ← a − b', '  else:  b ← b − a', 'return a'] });
  v.render(() => {
    const f = S.frame;
    f.squares.forEach(([x0, y0, q], k) => {
      const col = k === f.squares.length - 1 ? 'gold' : ['blue', 'teal', 'purple'][k % 3];
      s.rect(x0, y0, x0 + q, y0 + q, { fill: col, color: col, width: 1.5 });
    });
    const [rx, ry, rw, rh] = f.rest; if (rw && rh) s.rect(rx, ry, rx + rw, ry + rh, { color: 'accent', width: 2.5, dash: true });
  });
}
```

Gliding transitions (demo 1.10): store positions per element id in each frame, pass `transition: 0.3`, and
draw `lerp(S.prev.pos[id], S.frame.pos[id], S.tween)`.

---

## 3. `v.table(stage, spec)` → `T`

Grids of cells: DP tables, Cayley/multiplication tables, payoff matrices, truth tables, transition matrices.
Row `i` counts down from the top, column `j` to the right. By default the table is **fitted** (centred in the
stage, square cells sized in pixels, `maxCell` px max); with `cell: [w, h]` it sits at `(x0, y0)` = top-left
corner of cell (0, 0) in data units. Text uses the stage's canvas text, or KaTeX for `'$…$'` strings.

| spec key | default | |
|---|---|---|
| `rows`, `cols` | 3, 3 | |
| `value(i, j)` / `data[i][j]` | | number, string (`'$…$'` = TeX), boolean (T/F), or `[a, b]` pair (payoffs; `pairColors` default blue/red, `pairSep` `', '`). `null` = empty. |
| `format` | | `(v, i, j) => string` or a number of decimals (default: integers as is, else 2 decimals, ∞, real minus). |
| `fill(i, j)` | | colour, `[colour, alpha]` (default alpha `fillAlpha` .28) or `[r, g, b]`; text switches to the panel colour on dark solid fills. |
| `heat(i, j)`, `cmap` | | value in [0, 1] → colour map fill (`'viridis' 'magma' 'diverging'`). |
| `textColor(i, j)`, `weight(i, j)`, `size` | ink, 500, 14 | value style (long values shrink to fit). |
| `rowLabels`, `colLabels` | | arrays or `k => label` (TeX allowed); `cornerLabel` for the top-left header cell. |
| `rowLabelColor(i)`, `colLabelColor(j)`, `labelSize`, `headerFill` | | header styling. |
| `highlight` | | `[[i, j], [i, j, colour], …]` thick outlines (`highlightColor`, default accent). |
| `activeRow`, `activeCol`, `activeColor` | | tint a whole row/column and its header. |
| `sub(i, j)`, `subColor`, `subSize` | | small annotation in the bottom-right corner of a cell. |
| `fit` · `margin` · `square` · `maxCell` · `minCell` · `cellAspect` · `align` · `region` | `true` · 10 · `true` · 62 · 14 · 1 · `'center'` · whole stage | fitted geometry (`square: false` + `cellAspect` for wide cells; `region: [x0, y0, x1, y1]` data units). |
| `colWeights` | equal | relative column widths, e.g. `[1, 1, 2.5]` for a wide formula column; the total width is unchanged (use with `square: false`). |
| `cell: [w, h]`, `x0`, `y0`, `labelWidth`, `labelHeight` | | explicit geometry in data units. |

| method | |
|---|---|
| `T.draw(overrides)` | draw inside `v.render`; any spec key can be overridden for this draw. |
| `T.set(spec)` | change spec keys for later draws. |
| `T.hit(x, y)` → `{i, j}` \| `{i: −1, j, header: 'col'}` \| `{i, j: −1, header: 'row'}` \| null | for `stage.onClick`. |
| `T.cellCenter(i, j)` → `[x, y]`, `T.cellRect(i, j)` → `[x0, y0, x1, y1]` | data coordinates (for your own drawing on top). |
| `T.arrow([i, j], [k, l], {color, width, head, dash, trim})` | arrow between cells, trimmed clear of the values (DP back-pointers, trace-backs). |
| `T.pointer(i, j, [di, dj], st)` | small CLRS-style arrow inside cell (i, j) pointing to its neighbour. |
| `T.box(i0, j0, i1, j1, {color, dash, width})` | outline a block of cells. |
| `T.geo` | last geometry `{X0, Y0, cw, ch, lw, lh, x0, y0, w, h}` (px and data). |

### Example — payoff matrix with best responses (demo 1.12)

```js
viz(v) {
  const names = ['Cooperate', 'Defect'], P = [[[3, 3], [0, 5]], [[5, 0], [1, 1]]];
  const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230 });
  const T = v.table(s, { rows: 2, cols: 2, square: false, maxCell: 62, cellAspect: 2.3, size: 17,
                         rowLabels: names, colLabels: names, cornerLabel: 'A \\ B' });
  let sel = [1, 1];
  s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
  const brA = (i, j) => P[i][j][0] === Math.max(P[0][j][0], P[1][j][0]);   // row player's best response to column j
  const brB = (i, j) => P[i][j][1] === Math.max(P[i][0][1], P[i][1][1]);   // column player's best response to row i
  v.render(() => T.draw({
    value: (i, j) => [P[i][j][0] + (brA(i, j) ? '*' : ''), P[i][j][1] + (brB(i, j) ? '*' : '')],
    fill: (i, j) => (brA(i, j) && brB(i, j) ? ['green', 0.3] : null),          // Nash equilibrium
    highlight: [sel],
  }));
  v.readout(() => `(${names[sel[0]]}, ${names[sel[1]]}) pays A **${P[sel[0]][sel[1]][0]}**, B **${P[sel[0]][sel[1]][1]}**`);
}
```

A DP table with steps (demo 1.5) keeps a snapshot of the table in each frame (`vals`, `ptr`, `cur`, `deps`,
`path`) and draws `T.draw({value: (i, j) => f.vals[i][j], fill: …, highlight: [f.cur]})`, then
`T.pointer(...)` for every stored back-pointer and `T.arrow(...)` along the trace-back.

## `v.scene3(stage, opts)` — 3D scenes with draggable handles

A rotatable orthographic 3D scene drawn on an ordinary 2D stage (create the stage with `equal: true, axes: false`), so that points in ℝ³ can carry handles — the runtime's `stage3d` rotates but has no handles. Drag the background to rotate.

| member | |
|---|---|
| `opts` | `{yaw, pitch, axis (axis length), lim (handle box), labels: ['x','y','z'], axes: true, hint: true}` |
| `sc.begin()` / `sc.flush()` | call at the start / end of each `render`; everything drawn in between is depth-sorted |
| `sc.line(p, q, st, n)`, `sc.path(pts, st)`, `sc.poly(pts, st)`, `sc.disc(a, b, r, st, c)` | geometry (points are `[x, y, z]`; `disc` lies in span{a, b}, orthonormal) |
| `sc.arrow(p, q, st)`, `sc.dot(p, st)`, `sc.dots(pts, st)`, `sc.tex(latex, p, st)` | drawn on top (`st.top: false` to depth-sort them too) |
| `sc.handle(p0, {mode: 'free'|'plane'|'line', a, b, d, snap: p => p', color, label})` | draggable point; read `h.p` (3D), `h.t` (line parameter); `h.set(p)` |
| `sc.P(p)` | project a 3D point → `[x, y, depth]` on the stage |

```js
viz(v) {
  const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360 });
  const sc = v.scene3(S, { yaw: -0.6, pitch: 0.35 });
  const u = sc.handle([1, 0.4, 0.3], { color: 'accent', label: 'u' });
  const w = sc.handle([0.2, 1, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'orange', label: 'w' });
  v.render(() => {
    sc.begin();
    sc.disc([1, 0, 0], [0, 1, 0], 1.4, { fill: 'orange', fillAlpha: 0.08, grid: true });
    sc.arrow([0, 0, 0], u.p, { color: 'accent' }); sc.arrow([0, 0, 0], w.p, { color: 'orange' });
    sc.flush();
  });
  v.readout(() => `$u\\cdot w = ${v.fix(v.M.dot(u.p, w.p), 3)}$`);
}
```

---

## 7. `v.icons(stage, spec)` → `I`

Icon arrays for counts of people or things: natural frequencies, risk, base rates, waffles, conditioning by
splitting into blocks, and parliament hemicycles. Positions are computed in **pixels** inside `spec.region`
(data units, default the whole stage) so icons stay square; use a stage with `axes: false`.

```js
const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
const I = v.icons(s, { n: 1000, order: 'group' });
v.render(() => {
  I.set({ groups: [{ n: TP, color: 'red', label: 'ill, test +' }, { n: FN, color: 'orange', label: 'ill, test −' }, { n: FP, color: 'blue', label: 'healthy, test +' }],
          rest: { color: 'muted', alpha: 0.35, label: 'healthy, test −' },
          block: split ? (i) => (positive(i) ? 0 : 1) : null, blockLabels: (b, n) => (b ? `test − (${n})` : `test + (${n})`) });
  I.draw(); I.legend();
});
```

| key | default | |
|---|---|---|
| `n` | Σ group counts, else 100 | number of icons |
| `groups` | `[]` | consecutive runs `{n, color, label, alpha?, hollow?, ring?, mark?, shape?}`: icon i is in the first group whose running total covers it |
| `rest` | `{color: 'muted', alpha: 0.35}` | style of icons in no group (give it a `label` to show it in the legend and tooltip) |
| `style` | — | `(i) => style \| null \| undefined` per-icon override (null hides; undefined falls back to groups) |
| `layout` | `'grid'` | `'grid'` or `'hemicycle'` (parliament: rows ∝ radius, seats filled left → right by `order`) |
| `order` | `'index'` | slot order: `'index'`, `'group'` (groups together), `'shuffle'` (seeded by `seed`), a permutation array, or `(i) => sort key` |
| `cols`, `rows` | auto | grid size (auto = largest icons that fit) |
| `fill`, `from` | `'rows'`, `'top'` | grid fill order (`'columns'`, `'bottom'` for waffles that grow upward) |
| `block` | — | `(i) => k` splits the grid into side-by-side blocks (k < 0 or null hides the icon); `blockLabels`: array or `(k, count) => label`; `blockWidths` to override the √count widths |
| `shape` | `'auto'` | `'person'` (pictogram, when cells ≥ 13 px), `'dot'`, `'square'` |
| `gap`, `margin`, `maxCell`, `inner` | 0.18, 8, 46, 0.38 | spacing fraction, px margin, largest cell px, hemicycle inner radius |
| `tween` | 650 | glide duration ms (0 = snap; still captures and reduced motion always snap) |
| `hover` | `true` | dims the other groups and shows "label · count of n"; `onClick(i, {group, style})` |

`I.set(spec)` compares by content and only re-lays out when an icon actually moves, so calling it every frame
in `v.render` is free. `I.draw({dim: pred, highlight: pred, ringColor, label: false})`. Geometry for annotations:
`I.pos(i)` (data units), `I.bbox(k | pred)`, `I.blocks()` → `[{x0, y0, x1, y1, n, label, members}]`, `I.cell` (px),
`I.hit(x, y)`, `I.groupOf(i)`, `I.counts()`, `I.legend({percent, digits, rest})`.
`v.hemicycle(n, inner)` returns raw seat positions `{seats: [{x, y, r, a}], d}` for custom drawings.
