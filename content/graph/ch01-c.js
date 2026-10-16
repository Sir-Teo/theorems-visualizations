// Graph Theory (Diestel) — Chapter 1: The Basics, part c (§§1.7–1.10: minors, Euler tours, linear algebra, other notions of graphs)
import { K, ix, degrees, bfs, comps, parPath, pathEdges, spanTree, treePath, fundCycle, fundCut, xor, popcount, dotF2, rankF2, oddVerts, cycleDecomp, named, blob, PALETTE, ekey } from './ch01.shared.js';

// ---------- local helpers ----------
const fixed = (P, E) => ({ nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: E.trim().split(/\s+/).map((p) => [p[0], p[1]]), layout: 'none' });
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, ...o });
const EDIT = 'click empty space to add a vertex, click two vertices to add or remove the edge between them, Alt-click to delete, drag to move';
const eset = (H, ks) => new Set(ks.map((k) => H.E[k][2]));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
/** A small clock for click-triggered tweens: start(), then read .u (0 → 1) inside render; it keeps requesting frames until done. */
function tweener(v, dur = 0.5) {
  let t0 = -1e9;
  return { start() { t0 = performance.now(); v.invalidate(); }, get u() { const u = Math.min(1, (performance.now() - t0) / (dur * 1000)); if (u < 1) v.invalidate(); return ease(u); }, get busy() { return performance.now() - t0 < dur * 1000; } };
}
/** Contract the edge u–w of a kit graph in place (simple-graph sense): w merges into u, which moves to `at`. Branch sets live on n.bs. */
function contract(G, u, w, at) {
  const nu = G.node(u), nw = G.node(w); nu.bs = (nu.bs || [u]).concat(nw.bs || [w]); [nu.x, nu.y] = at;
  const nb = new Set(G.neighbors(u).map(K)); const add = G.neighbors(w).filter((z) => K(z) !== K(u) && !nb.has(K(z)));
  G.removeNode(w); for (const z of add) G.addEdge(u, z);
}
/** The 7-edge Königsberg multigraph (A = Kneiphof island). */
const KONIG = () => ({ nodes: [{ id: 'A', x: 4.6, y: 3.2 }, { id: 'B', x: 4.6, y: 5.8 }, { id: 'C', x: 4.6, y: 0.6 }, { id: 'D', x: 8.6, y: 3.2 }],
  edges: [['A', 'B'], ['A', 'B'], ['A', 'C'], ['A', 'C'], ['A', 'D'], ['B', 'D'], ['C', 'D']], layout: 'none' });
/** A medium graph for the linear-algebra items. */
const LA = () => fixed({ a: [1.0, 1.0], b: [3.4, 0.6], c: [5.8, 1.0], d: [8.4, 0.8], e: [1.6, 3.6], f: [4.4, 3.2], g: [7.0, 3.6], h: [3.0, 5.8], i: [6.0, 5.8], j: [9.0, 4.4] },
  'ab bc cd ae bf cf cg dg ef fg eh fh fi gi hi gj dj ij');

export default {
  collection: 'graph',
  chapter: 1,
  items: [
    // ================================================================== 1.7 Contraction and minors
    {
      num: '1.7.1a', kind: 'Definition', name: 'Contraction and minors', verify: true,
      statement: String.raw`A graph $G$ is an **$IX$** (an inflated $X$) if $V(G)$ has a partition $\{V_x: x\in V(X)\}$ into connected sets, the **branch sets**, such that distinct $x,y$ are adjacent in $X$ if and only if $G$ has a $V_x$–$V_y$ edge; then $X$ arises from $G$ by **contracting** the subgraphs $G[V_x]$. If a graph $Y$ contains an $IX$ as a subgraph, $X$ is a **minor** of $Y$, written $X\preccurlyeq Y$, and the $IX$ is a **model** of $X$ in $Y$. Contracting a single edge $e=xy$ gives $G/e$: $x$ and $y$ are replaced by one new vertex $v_e$ adjacent to all their other neighbours.`,
      idea: String.raw`Equivalently, $X\preccurlyeq Y$ if there is a map from a subset of $V(Y)$ onto $V(X)$ whose fibres are connected and such that every edge of $X$ is realised by an edge between the corresponding fibres. Branch sets may be single vertices, so every subgraph is a minor. Contraction can only lower the number of vertices and edges, but it can create dense minors from sparse graphs: the cubic Petersen graph has $K^5$ as a minor.`,
      caption: String.raw`Right: the current minor $X$. Click an edge of $X$ to contract it (animated); Alt-click a vertex to delete it. Left: the original Petersen graph $G$ with the branch set of every vertex of $X$ as a coloured blob. **Contract the spokes** produces the famous $K^5$ minor.`,
      deps: ['graph-1.1.1c', 'graph-1.4.1a'], refs: ['Diestel §1.7'], tags: ['minors'],
      viz(v) {
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 300, title: '$G$ with the branch sets' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 300, title: 'the minor $X$' });
        const P = named('petersen');
        const G = v.graph(L, { ...P, r: 11, nodeLabel: '', draggable: false });
        const X = v.graph(R, { nodes: [], edges: [], r: 13, draggable: true });
        const tw = tweener(v, 0.5); let pend = null;
        function reset() { const Q = named('petersen'); X.set({ nodes: Q.nodes.map((n) => ({ ...n, label: '' })), edges: Q.edges }).layout('fit'); X.nodes.forEach((n) => (n.bs = [n.id])); pend = null; }
        reset();
        for (const i of [0, 2]) { const a = X.node(i), b = X.node(i + 5); contract(X, i, i + 5, [(a.x * 2 + b.x) / 3, (a.y * 2 + b.y) / 3]); }
        X.onClick = ({ node, edge, alt }) => {
          if (pend) return true;
          if (node && alt) { X.removeNode(node.id); return true; }
          if (edge) { const a = X.node(edge.from), b = X.node(edge.to); pend = { u: a.id, w: b.id, pu: [a.x, a.y], pw: [b.x, b.y], mid: [(a.x + b.x) / 2, (a.y + b.y) / 2] }; tw.start(); }
          return true;
        };
        v.button('Contract the spokes', () => { for (let i = 0; i < 5; i++) if (X.has(i) && X.has(i + 5) && X.edge(i, i + 5)) { const a = X.node(i), b = X.node(i + 5); contract(X, i, i + 5, [(a.x * 2 + b.x) / 3, (a.y * 2 + b.y) / 3]); } pend = null; });
        v.button('Reset', reset);
        v.render(() => {
          if (pend) {
            const u = tw.u, a = X.node(pend.u), b = X.node(pend.w);
            if (u >= 1) { contract(X, pend.u, pend.w, pend.mid); pend = null; }
            else { [a.x, a.y] = [lerp(pend.pu[0], pend.mid[0], u), lerp(pend.pu[1], pend.mid[1], u)]; [b.x, b.y] = [lerp(pend.pw[0], pend.mid[0], u), lerp(pend.pw[1], pend.mid[1], u)]; }
          }
          const owner = new Map(); X.nodes.forEach((n, i) => (n.bs || [n.id]).forEach((o) => owner.set(K(o), i)));
          X.nodes.forEach((n, i) => { const bs = n.bs || [n.id]; if (bs.length < 2) return; const pts = bs.map((o) => [G.node(o).x, G.node(o).y]); const segs = G.edges.filter((e) => bs.some((o) => K(o) === K(e.from)) && bs.some((o) => K(o) === K(e.to))).map((e) => [[G.node(e.from).x, G.node(e.from).y], [G.node(e.to).x, G.node(e.to).y]]); blob(L, pts, segs, v.color(PALETTE[i % 8]), 30, 0.25); });
          const col = (id) => (owner.has(K(id)) ? PALETTE[owner.get(K(id)) % 8] : null);
          G.draw({ nodeFill: (id) => (owner.has(K(id)) ? col(id) : null), dim: G.nodes.filter((n) => !owner.has(K(n.id))).map((n) => n.id),
            edgeColor: (e) => (owner.get(K(e.from)) === owner.get(K(e.to)) && owner.has(K(e.from)) ? col(e.from) : null), edgeWidth: (e) => (owner.get(K(e.from)) === owner.get(K(e.to)) ? 3.4 : 1.4) });
          X.draw({ nodeFill: (id) => PALETTE[X.nodes.findIndex((n) => K(n.id) === K(id)) % 8], nodeLabel: (id) => { const n = X.node(id); return n.bs && n.bs.length > 1 ? String(n.bs.length) : ''; },
            edgeColor: (e) => (pend && ((K(e.from) === K(pend.u) && K(e.to) === K(pend.w)) || (K(e.to) === K(pend.u) && K(e.from) === K(pend.w))) ? 'gold' : null), edgeWidth: () => 2.2 });
        });
        v.readout(() => {
          const d = degrees(ix(X)), n = X.nodes.length, complete = d.every((x) => x === n - 1);
          return `$|X| = ${n}$, $\\|X\\| = ${X.edges.length}$ · branch sets of sizes ${X.nodes.map((nn) => (nn.bs || [0]).length).join(', ')}${complete && n >= 4 ? ` · $X = K^{${n}}$ is a minor of the Petersen graph` : ''}`;
        });
      },
    },
    {
      num: '1.7.1b', kind: 'Definition', name: 'Subdivisions and topological minors', verify: true,
      statement: String.raw`A **subdivision** of a graph $X$ is obtained by replacing some or all edges of $X$ by new paths between their ends, so that no such path has an inner vertex in $V(X)$ or on another new path; such a graph is called a **$TX$**. The original vertices are its **branch vertices**, the new ones its **subdividing vertices**. If a graph $Y$ contains a $TX$ as a subgraph, then $X$ is a **topological minor** of $Y$.`,
      idea: String.raw`Subdividing vertices have degree $2$ while branch vertices keep their degree from $X$, so $X$ is recovered from a $TX$ by suppressing the subdividing vertices. Topologically a $TX$ is the same space as $X$ — which is why Kuratowski's theorem (Chapter 4) can say "no $TK^5$ and no $TK_{3,3}$".`,
      caption: String.raw`Click an edge of the left graph to subdivide it; click a small (subdividing) vertex to suppress it again. Branch vertices are large, subdividing vertices small, and the subdivided paths dotted. The right panel suppresses all subdividing vertices and always gives back $X$.`,
      deps: ['graph-1.1.1c', 'graph-1.3.1a'], refs: ['Diestel §1.7'], tags: ['minors', 'subdivisions'],
      viz(v) {
        const which = v.select('$X$ =', [{ value: 'k4', label: '$K^4$' }, { value: 'k33', label: '$K_{3,3}$' }], 'k4', { onChange: () => load() });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.3], axes: false, equal: true, height: 300, title: 'a $TX$' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.3], axes: false, equal: true, height: 300, title: '$X$, by suppressing the small vertices' });
        const T = v.graph(L, { nodes: [], edges: [], r: 13 });
        const Xg = v.graph(R, { nodes: [], edges: [], r: 13, draggable: false });
        let next = 0;
        function load() {
          const P = which.value === 'k4' ? { nodes: [{ id: 'a', x: 0, y: 1 }, { id: 'b', x: -0.95, y: -0.6 }, { id: 'c', x: 0.95, y: -0.6 }, { id: 'd', x: 0, y: -0.05 }], edges: [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'], ['c', 'd']] }
            : (() => { const Q = named('kmn', 3, 3); return { nodes: Q.nodes.map((n) => ({ id: 'abcdef'[n.id], x: n.x, y: n.y })), edges: Q.edges.map(([a, b]) => ['abcdef'[a], 'abcdef'[b]]) }; })();
          T.set({ nodes: P.nodes.map((n) => ({ ...n, r: 15 })), edges: P.edges }).layout('fit'); Xg.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges }).layout('fit'); next = 0;
          for (const [a, b] of which.value === 'k4' ? [['a', 'b'], ['c', 'd'], ['b', 'd']] : [['a', 'd'], ['b', 'f']]) sub(T.edge(a, b));
          sub(T.edges.find((e) => String(e.from).startsWith('s') || String(e.to).startsWith('s')));
        }
        function sub(e) { if (!e) return; const a = T.node(e.from), b = T.node(e.to), id = 's' + next++; T.removeEdge(e); T.addNode({ id, label: '', r: 6, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); T.addEdge(a.id, id); T.addEdge(id, b.id); }
        load();
        T.onClick = ({ node, edge }) => {
          if (node && String(node.id).startsWith('s')) { const nb = T.neighbors(node.id); T.removeNode(node.id); if (nb.length === 2 && !T.edge(nb[0], nb[1])) T.addEdge(nb[0], nb[1]); }
          else if (edge) sub(edge);
          return true;
        };
        const isSub = (id) => String(id).startsWith('s');
        v.render(() => {
          T.draw({ nodeFill: (id) => (isSub(id) ? 'orange' : 'accent'), nodeLabel: (id) => (isSub(id) ? '' : id), edgeDash: (e) => isSub(e.from) || isSub(e.to), edgeColor: (e) => (isSub(e.from) || isSub(e.to) ? 'orange' : 'accent'), edgeWidth: () => 2.4 });
          Xg.draw({ nodeFill: () => 'accent', edgeColor: () => 'accent', edgeWidth: () => 2.4 });
        });
        v.legend([['accent', 'branch vertices and unsubdivided edges'], ['orange', 'subdivided paths', { dash: true }]]);
        v.readout(() => {
          const H = ix(T), d = degrees(H), s = H.ids.filter(isSub).length, br = H.ids.map((id, u) => (isSub(id) ? null : `${id}:${d[u]}`)).filter(Boolean);
          return `${s} subdividing vertices, all of degree 2 · branch vertices keep their degrees in $X$ (${br.join(', ')}) · $|TX| = |X| + ${s}$, $\\|TX\\| = \\|X\\| + ${s}$`;
        });
      },
    },
    {
      num: '1.7.1', kind: 'Proposition', name: 'The minor and topological-minor relations are partial orders',
      statement: String.raw`On the class of finite graphs, the minor relation $\preccurlyeq$ and the topological-minor relation are partial orders: they are reflexive, antisymmetric and transitive.`,
      idea: String.raw`Reflexivity: take singleton branch sets (or the trivial subdivision). Transitivity: given a model of $X$ in $Y$ with branch sets $V_x$ and a model of $Y$ in $Z$ with branch sets $W_y$, the sets $\bigcup_{y\in V_x}W_y$ are connected in $Z$ and joined by edges wherever $X$ needs them; for subdivisions, compose the paths. Antisymmetry: if $X\preccurlyeq Y\preccurlyeq X$ for finite graphs, then $|X|\le|Y|\le|X|$ and $\|X\|\le\|Y\|\le\|X\|$, which forces the models to be isomorphisms.`,
      caption: String.raw`A chain $X\preccurlyeq Y\preccurlyeq Z$ with $X=K^4$, $Y$ the triangular prism and $Z$ a subdivision of $Y$. Click a vertex of $X$, then click vertices of $Y$ to add them to or remove them from its branch set. The model of $Y$ in $Z$ is fixed; the composed model of $X$ in $Z$ appears on the right, and both models are checked live (connected branch sets, all edges of $X$ realised).`,
      deps: ['graph-1.7.1a', 'graph-1.7.1b'], refs: ['Diestel §1.7'], tags: ['minors', 'orders'],
      viz(v) {
        const st = (title) => v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 260, minWidth: 240, title });
        const SX = st('$X = K^4$'), SY = st('$Y$: model of $X$'), SZ = st('$Z$: composed model of $X$');
        const XS = ['1', '2', '3', '4'], CL = { 1: 'blue', 2: 'orange', 3: 'green', 4: 'purple' };
        const GX = v.graph(SX, { nodes: [{ id: '1', x: 0, y: 1 }, { id: '2', x: -0.95, y: -0.6 }, { id: '3', x: 0.95, y: -0.6 }, { id: '4', x: 0, y: 0 }], edges: [['1', '2'], ['1', '3'], ['1', '4'], ['2', '3'], ['2', '4'], ['3', '4']], layout: 'fit', r: 13, draggable: false });
        const YP = { a: [0, 1.1], b: [-1, -0.6], c: [1, -0.6], d: [0, 0.45], e: [-0.4, -0.2], f: [0.4, -0.2] };
        const YE = [['a', 'b'], ['b', 'c'], ['c', 'a'], ['d', 'e'], ['e', 'f'], ['f', 'd'], ['a', 'd'], ['b', 'e'], ['c', 'f']];
        const GY = v.graph(SY, { nodes: Object.entries(YP).map(([id, [x, y]]) => ({ id, x, y })), edges: YE, layout: 'fit', r: 12, draggable: false });
        // Z: every edge of Y subdivided once; the subdividing vertex of uv belongs to the branch set W_u of its first end
        const ZN = Object.entries(YP).map(([id, [x, y]]) => ({ id: id.toUpperCase(), x, y })), ZE = [], W = {};
        for (const id of Object.keys(YP)) W[id] = [id.toUpperCase()];
        YE.forEach(([a, b], i) => { const s = 's' + i; ZN.push({ id: s, label: '', r: 6, x: (YP[a][0] + YP[b][0]) / 2, y: (YP[a][1] + YP[b][1]) / 2 }); ZE.push([a.toUpperCase(), s], [s, b.toUpperCase()]); W[a].push(s); });
        const GZ = v.graph(SZ, { nodes: ZN, edges: ZE, layout: 'fit', r: 11, draggable: false });
        let model = { 1: ['a'], 2: ['b'], 3: ['c'], 4: ['d', 'e', 'f'] }, sel = '1';
        GX.onClick = ({ node }) => { if (node) sel = node.id; return true; };
        GY.onClick = ({ node }) => { if (node && sel) { const y = node.id; for (const x of XS) model[x] = model[x].filter((q) => q !== y); if (!(model[sel].length === 0 && false)) model[sel].push(y); } return true; };
        v.button('Remove from all branch sets', () => { for (const x of XS) model[x] = []; });
        const check = (G, sets) => {
          const H = ix(G), conn = XS.every((x) => { const S = new Set(sets[x].map(K)); if (!S.size) return false; return comps(ix(G, { skipNode: (id) => !S.has(K(id)) })).k === 1; });
          const owner = new Map(); for (const x of XS) for (const q of sets[x]) owner.set(K(q), x);
          const has = new Set(); H.E.forEach(([a, b]) => { const p = owner.get(K(H.ids[a])), q = owner.get(K(H.ids[b])); if (p && q && p !== q) has.add(p < q ? p + q : q + p); });
          const miss = GX.edges.filter((e) => !has.has(e.from < e.to ? e.from + e.to : e.to + e.from));
          return { conn, miss, owner };
        };
        const zsets = () => { const o = {}; for (const x of XS) o[x] = model[x].flatMap((y) => W[y]); return o; };
        v.render(() => {
          const cy = check(GY, model), cz = check(GZ, zsets());
          GX.draw({ nodeFill: (id) => CL[id], nodeRing: (id) => (id === sel ? 'ink' : null), edgeColor: (e) => (cy.miss.includes(e) ? 'red' : 'green'), edgeWidth: () => 2.6 });
          const drawM = (G, c) => G.draw({ nodeFill: (id) => (c.owner.has(K(id)) ? CL[c.owner.get(K(id))] : null), dim: G.nodes.filter((n) => !c.owner.has(K(n.id))).map((n) => n.id),
            edgeColor: (e) => { const p = c.owner.get(K(e.from)), q = c.owner.get(K(e.to)); return p && p === q ? CL[p] : null; }, edgeWidth: (e) => { const p = c.owner.get(K(e.from)), q = c.owner.get(K(e.to)); return p && p === q ? 4 : 1.4; } });
          drawM(GY, cy); drawM(GZ, cz);
        });
        v.legend([['blue', '$V_1$', { dot: true }], ['orange', '$V_2$', { dot: true }], ['green', '$V_3$', { dot: true }], ['purple', '$V_4$', { dot: true }], ['red', 'edge of $X$ not realised']]);
        v.readout(() => {
          const cy = check(GY, model), cz = check(GZ, zsets()), ok = (c) => c.conn && !c.miss.length;
          return `selected branch set $V_${sel}$ = {${model[sel].join(', ')}} · model of $X$ in $Y$: ${ok(cy) ? 'valid ✓' : `invalid (${!cy.conn ? 'a branch set is empty or disconnected' : `missing ${cy.miss.map((e) => e.from + e.to).join(', ')}`})`} · composed model in $Z$: ${ok(cz) ? 'valid ✓ — transitivity' : 'invalid'}`;
        });
      },
    },
    {
      num: '1.7.2', kind: 'Corollary', name: 'Minors arise by deleting and contracting edges',
      statement: String.raw`Let $X$ and $Y$ be finite graphs. Then $X$ is a minor of $Y$ if and only if there are graphs $G_0,\dots,G_n$ with $G_0=Y$ and $G_n=X$ such that each $G_{i+1}$ arises from $G_i$ by deleting an edge, contracting an edge, or deleting a vertex.`,
      idea: String.raw`Each single operation produces a minor, and $\preccurlyeq$ is transitive (1.7.1), so the backward direction holds. Forward, by induction on $|Y|+\|Y\|$: given a model of $X$ in $Y$, delete a vertex outside all branch sets, or contract an edge inside a branch set (keeping it connected), or delete an edge that the model does not need — each step lowers $|Y|+\|Y\|$ and keeps a model of $X$.`,
      caption: String.raw`A model of $X$ in the Petersen graph is played back as single operations: first the vertex outside every branch set is deleted, then edges inside branch sets are contracted (watch the two ends slide together), then unneeded edges are deleted. The readout tracks $|G_i|+\|G_i\|$, which drops at every step.`,
      deps: ['graph-1.7.1a'], refs: ['Diestel §1.7'], tags: ['minors'],
      viz(v) {
        const target = v.select('$X$ =', [{ value: 'c4', label: '$C^4$' }, { value: 'k4', label: '$K^4$' }], 'c4', { onChange: () => S.reset() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, draggable: false });
        const BS = { 1: [0, 5], 2: [1, 6], 3: [2, 7], 4: [3, 4, 8] }, CL = { 1: 'blue', 2: 'orange', 3: 'green', 4: 'purple' };
        function frames() {
          const P = named('petersen'); let nodes = P.nodes.map((n) => ({ id: n.id, x: n.x * 1.1, y: n.y * 1.1, bs: [n.id] })), edges = P.edges.map(([a, b]) => [a, b]);
          const owner = (id) => +Object.keys(BS).find((x) => BS[x].includes(id)) || null;
          const F = [{ nodes, edges, note: `$G_0 = Y$, the Petersen graph, with the branch sets of a model of $X$ coloured.`, line: 0 }];
          const push = (o) => { F.push({ nodes: o.nodes, edges: o.edges, op: o.op, note: o.note }); };
          // delete vertices outside the model
          for (const n of nodes.slice()) if (!owner(n.id)) { const nodes2 = nodes.filter((m) => m.id !== n.id), edges2 = edges.filter(([a, b]) => a !== n.id && b !== n.id); push({ nodes: nodes2, edges: edges2, op: { del: n.id }, note: `Delete vertex ${n.id}: it lies in no branch set.` }); nodes = nodes2; edges = edges2; }
          // contract edges inside branch sets
          for (const x of Object.keys(BS)) {
            for (;;) {
              const e = edges.find(([a, b]) => owner(a) === +x && owner(b) === +x); if (!e) break;
              const [u, w] = e, nu = nodes.find((m) => m.id === u), nw = nodes.find((m) => m.id === w), mid = [(nu.x + nw.x) / 2, (nu.y + nw.y) / 2];
              const nodes2 = nodes.filter((m) => m.id !== w).map((m) => (m.id === u ? { ...m, x: mid[0], y: mid[1], bs: m.bs.concat(nw.bs) } : m));
              const nb = new Set(edges.filter(([a, b]) => a === u || b === u).map(([a, b]) => (a === u ? b : a)));
              let edges2 = edges.filter(([a, b]) => !(a === w || b === w));
              for (const [a, b] of edges) if ((a === w || b === w) && !(a === u || b === u)) { const z = a === w ? b : a; if (!nb.has(z)) { edges2.push([u, z]); nb.add(z); } }
              push({ nodes: nodes2, edges: edges2, op: { u, w, from: [[nu.x, nu.y], [nw.x, nw.y]], mid }, note: `Contract the edge ${u}${w} inside branch set $V_${x}$.` }); nodes = nodes2; edges = edges2;
            }
          }
          // delete edges X does not need
          const need = target.value === 'k4' ? null : new Set(['1,2', '2,3', '3,4', '1,4']);
          for (const [a, b] of edges.slice()) { const k = ekey(owner(a), owner(b)); if (need && !need.has(k)) { const edges2 = edges.filter((e) => e[0] !== a || e[1] !== b); push({ nodes, edges: edges2, op: { delE: [a, b] }, note: `Delete the edge between $V_${owner(a)}$ and $V_${owner(b)}$: $X$ does not need it.` }); edges = edges2; } }
          F.push({ nodes, edges, note: `$G_${F.length} = X$ ✓ (${F.length} operations).` });
          return F.map((f, i) => ({ ...f, i, size: f.nodes.length + f.edges.length, owner }));
        }
        const S = v.steps({ frames, speed: 1.1, transition: 0.55, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.nodes) return; const t = S.tween, prev = S.prev && S.prev.nodes ? S.prev : null;
          let nodes = f.nodes, edges = f.edges, hi = null;
          if (t < 1 && prev && f.op) {
            nodes = prev.nodes.map((n) => ({ ...n })); edges = prev.edges;
            if (f.op.u != null) { const a = nodes.find((n) => n.id === f.op.u), b = nodes.find((n) => n.id === f.op.w); [a.x, a.y] = [lerp(f.op.from[0][0], f.op.mid[0], t), lerp(f.op.from[0][1], f.op.mid[1], t)]; [b.x, b.y] = [lerp(f.op.from[1][0], f.op.mid[0], t), lerp(f.op.from[1][1], f.op.mid[1], t)]; hi = [f.op.u, f.op.w]; }
            if (f.op.delE) hi = f.op.delE; if (f.op.del != null) hi = [f.op.del];
          }
          G.set({ nodes: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, label: n.bs && n.bs.length > 1 ? String(n.bs.length) : '' })), edges: edges.map(([a, b]) => ({ from: a, to: b })) });
          const isHi = (e) => hi && hi.length === 2 && ((e.from === hi[0] && e.to === hi[1]) || (e.from === hi[1] && e.to === hi[0]));
          G.draw({ nodeFill: (id) => CL[f.owner(id)] || 'muted', nodeRing: (id) => (hi && hi.length === 1 && hi[0] === id ? 'red' : null),
            edgeColor: (e) => (isHi(e) ? (f.op && f.op.delE ? 'red' : 'gold') : f.owner(e.from) === f.owner(e.to) ? CL[f.owner(e.from)] : null), edgeWidth: (e) => (isHi(e) ? 4.5 : 2) });
        });
        v.readout(() => { const f = S.frame; return f.nodes ? `$G_{${f.i}}$: $|G_{${f.i}}| + \\|G_{${f.i}}\\| = ${f.nodes.length} + ${f.edges.length} = ${f.size}$ — strictly decreasing along the sequence` : ''; });
      },
    },
    {
      num: '1.7.3', kind: 'Proposition', name: 'Topological minors are minors; converse for Δ ≤ 3',
      statement: String.raw`(i) Every $TX$ is also an $IX$; thus every topological minor of a graph is also a minor of it.

(ii) If $\Delta(X)\le3$, then every $IX$ contains a $TX$; thus every minor of a graph with maximum degree at most $3$ is also a topological minor of it.`,
      idea: String.raw`(i) Put each subdividing vertex of a $TX$ into the branch set of one end of its path: the branch sets become paths, which are connected, and the remaining edges realise $X$. (ii) In an $IX$ choose one edge for each edge of $X$, and a spanning tree in every branch set $V_x$. At most three chosen edges leave $V_x$; in a tree, the paths linking three attachment points meet in a single vertex (two points: take a path), which becomes the branch vertex, and the three tree paths from it are the subdivided edges. For $\Delta(X)\ge4$ this fails: the Petersen graph has a $K^5$ minor, but being cubic it contains no vertex of degree 4 and so no $TK^5$.`,
      caption: String.raw`Mode (i): drag the slider to contract the subdivided paths of a $TK_{3,3}$ into its branch vertices, turning it into an $IK_{3,3}$. Mode (ii): an $IK^4$ whose branch sets are trees; the gold vertices are the meeting points of the attachment paths and the thick edges form a $TK^4$ inside it. Mode Petersen: a $K^5$ minor (spokes as branch sets) without any $TK^5$.`,
      deps: ['graph-1.7.1a', 'graph-1.7.1b'], refs: ['Diestel §1.7'], tags: ['minors', 'subdivisions'],
      viz(v) {
        const mode = v.select('', [{ value: 'i', label: '(i) $TX$ is an $IX$' }, { value: 'ii', label: '(ii) $\\Delta\\le3$: $IX\\supseteq TX$' }, { value: 'pet', label: 'Petersen: $IK^5$, no $TK^5$' }], 'i');
        const tS = v.slider('contract', 0, 1, 0.35, { step: 0.01 });
        const s = v.stage({ x: [0, 10], y: [0, 6.6], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, draggable: false });
        // (i) TK33: branch a,b,c (top) and x,y,z (bottom); each edge subdivided once or twice
        const B = { a: [1.5, 5.6], b: [5, 5.6], c: [8.5, 5.6], x: [1.5, 0.8], y: [5, 0.8], z: [8.5, 0.8] };
        const TK = []; const SUBV = {}; let ns = 0;
        for (const p of 'abc') for (const q of 'xyz') { const k = ('abc'.indexOf(p) + 'xyz'.indexOf(q)) % 2 ? 1 : 2; let prev = p; for (let i = 1; i <= k; i++) { const id = 's' + ns++, t = i / (k + 1); SUBV[id] = { x: lerp(B[p][0], B[q][0], t), y: lerp(B[p][1], B[q][1], t), owner: i <= k / 2 + 0.01 || k === 1 ? p : q }; TK.push([prev, id]); prev = id; } TK.push([prev, q]); }
        // (ii) IK4 with tree branch sets
        const P2 = { a1: [3, 5.6], a2: [5, 5.9], a3: [7, 5.6], b0: [2, 2.6], b1: [1, 4.2], b2: [3.2, 0.8], b3: [0.8, 1.2], c1: [8, 1.6], c2: [8.8, 3.8], d1: [5, 3.6], d2: [5.9, 2.5] };
        const T2 = 'a1-a2 a2-a3 b0-b1 b0-b2 b0-b3 c1-c2 d1-d2'.split(' ').map((p) => p.split('-'));
        const X2 = 'a1-b1 a3-c2 a2-d1 b2-c1 b0-d1 c1-d2'.split(' ').map((p) => p.split('-'));
        const TKE = new Set(['a1-a2', 'a2-a3', 'b0-b1', 'b0-b2', 'c1-c2', 'd1-d2', ...X2.map((e) => e.join('-'))]), MED = new Set(['a2', 'b0', 'c1', 'd1']);
        let last = '';
        v.render(() => {
          tS.el.hidden = mode.value !== 'i';
          if (mode.value === 'i') {
            const t = ease(tS.value);
            G.set({ nodes: [...Object.entries(B).map(([id, [x, y]]) => ({ id, x, y, r: 14 })), ...Object.entries(SUBV).map(([id, o]) => ({ id, label: '', r: 6, x: lerp(o.x, B[o.owner][0], t), y: lerp(o.y, B[o.owner][1], t) }))], edges: TK.map(([a, b]) => ({ from: a, to: b })) });
            const own = (id) => (B[id] ? id : SUBV[id].owner), C = { a: 'blue', b: 'orange', c: 'green', x: 'purple', y: 'teal', z: 'pink' };
            if (t > 0.02) for (const id of Object.keys(B)) { const pts = [B[id], ...Object.values(SUBV).filter((o) => o.owner === id).map((o) => [lerp(o.x, B[id][0], t), lerp(o.y, B[id][1], t)])]; blob(s, pts, pts.slice(1).map((q) => [B[id], q]), v.color(C[id]), 26, 0.12 + 0.12 * t); }
            G.draw({ nodeFill: (id) => C[own(id)], edgeColor: (e) => (own(e.from) === own(e.to) ? C[own(e.from)] : 'muted'), edgeWidth: (e) => (own(e.from) === own(e.to) ? 3.4 : 2), edgeDash: (e) => own(e.from) === own(e.to) });
            last = 'i'; return;
          }
          if (mode.value === 'ii') {
            if (last !== 'ii') G.set({ nodes: Object.entries(P2).map(([id, [x, y]]) => ({ id, label: '', x, y, r: MED.has(id) ? 13 : 9 })), edges: [...T2, ...X2].map(([a, b]) => ({ from: a, to: b })) });
            const C = { a: 'blue', b: 'orange', c: 'green', d: 'purple' };
            for (const x of 'abcd') { const ids = Object.keys(P2).filter((id) => id[0] === x); blob(s, ids.map((id) => P2[id]), T2.filter(([p]) => p[0] === x).map(([p, q]) => [P2[p], P2[q]]), v.color(C[x]), 34, 0.18); }
            const inTK = (e) => TKE.has(e.from + '-' + e.to) || TKE.has(e.to + '-' + e.from);
            G.draw({ nodeFill: (id) => (MED.has(id) ? 'gold' : id === 'b3' ? null : C[id[0]]), nodeColor: (id) => (id === 'b3' ? 'faint' : null), edgeColor: (e) => (inTK(e) ? 'ink' : 'faint'), edgeWidth: (e) => (inTK(e) ? 3.6 : 1.4), edgeDash: (e) => !inTK(e) });
          } else {
            if (last !== 'pet') { const P = named('petersen'); G.set({ nodes: P.nodes.map((n) => ({ id: n.id, label: '', x: 5 + 3 * n.x, y: 3.3 + 3 * n.y })), edges: P.edges.map(([a, b]) => ({ from: a, to: b })) }); }
            for (let i = 0; i < 5; i++) { const a = G.node(i), b = G.node(i + 5); blob(s, [[a.x, a.y], [b.x, b.y]], [[[a.x, a.y], [b.x, b.y]]], v.color(PALETTE[i]), 30, 0.22); }
            G.draw({ nodeFill: (id) => PALETTE[id % 5], nodeLabel: (id) => '3', edgeColor: (e) => (Math.abs(e.from - e.to) === 5 ? PALETTE[Math.min(e.from, e.to)] : null), edgeWidth: (e) => (Math.abs(e.from - e.to) === 5 ? 4 : 1.8) });
          }
          last = mode.value;
        });
        v.readout(() => {
          if (mode.value === 'i') return `${Object.keys(SUBV).length} subdividing vertices are being absorbed into the branch sets (contraction ${Math.round(tS.value * 100)}%): every $TK_{3,3}$ is an $IK_{3,3}$, so $K_{3,3}$ is also an ordinary minor.`;
          if (mode.value === 'ii') return 'Each branch set (a tree) has ≤ 3 attachment points; the gold meeting point becomes a branch vertex of degree 3, and the leftover vertex b₃ is not needed: a $TK^4$ inside the $IK^4$ ✓';
          return 'Five spokes as branch sets give a $K^5$ minor. A $TK^5$ needs 5 branch vertices of degree 4, but every vertex of the Petersen graph has degree 3: $K^5$ is a minor, **not** a topological minor ($\\Delta(K^5) = 4 > 3$).';
        });
      },
    },
    // ================================================================== 1.8 Euler tours
    {
      num: '1.8.1a', kind: 'Definition', name: 'Euler tours and Eulerian graphs', verify: true,
      statement: String.raw`A closed walk in a graph is an **Euler tour** if it traverses every edge of the graph exactly once. A graph is **Eulerian** if it admits an Euler tour.`,
      idea: String.raw`The notion goes back to Euler's 1736 analysis of the seven bridges of Königsberg: a round trip crossing every bridge once is an Euler tour of the corresponding multigraph. Each pass of a tour through a vertex uses two of its edges, which is the source of the parity condition in Euler's theorem (1.8.1).`,
      caption: String.raw`Click an edge to start, then keep clicking unused edges at the current vertex (gold). Used edges are numbered and grey out. The tour is accepted when every edge has been used once and you are back at the start; **Undo** steps back. The octahedron is Eulerian; the house has two odd vertices, so every attempt fails.`,
      deps: ['graph-1.4.1a', 'graph-1.2.1a'], refs: ['Diestel §1.8'], tags: ['Euler tours'],
      viz(v) {
        const PRE = { oct: () => named('octahedron'), house: () => ({ ...fixed({ a: [0, 0], b: [2, 0], c: [2, 2], d: [0, 2], e: [1, 3.3] }, 'ab bc cd da ce de ac'), layout: 'fit' }), k5: () => named('complete', 5) };
        const pre = v.select('', [{ value: 'oct', label: 'octahedron' }, { value: 'house', label: 'house' }, { value: 'k5', label: '$K^5$' }], 'oct', { onChange: () => load() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, draggable: true });
        let walk = [], start = null, cur = null, msg = '';
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges }).layout('fit'); walk = []; start = cur = null; msg = ''; if (pre.value === 'oct') { for (const [a, b] of [[0, 1], [1, 2], [2, 0], [0, 4]]) click(G.edge(a, b)); } }
        function click(e) {
          if (!e || walk.includes(e)) { msg = e ? 'edge already used' : ''; return; }
          if (cur == null) { start = e.from; cur = e.to; walk.push(e); return; }
          if (K(e.from) !== K(cur) && K(e.to) !== K(cur)) { msg = 'that edge does not start at the current vertex'; return; }
          cur = K(e.from) === K(cur) ? e.to : e.from; walk.push(e); msg = '';
        }
        load();
        G.onClick = ({ edge }) => { if (edge) click(edge); return true; };
        v.button('Undo', () => { walk.pop(); if (!walk.length) { start = cur = null; return; } let c = start; for (const e of walk) c = K(e.from) === K(c) ? e.to : e.from; cur = c; if (walk.length === 1) { start = walk[0].from; cur = walk[0].to; } });
        v.button('Clear', () => { walk = []; start = cur = null; msg = ''; });
        v.render(() => {
          const d = degrees(ix(G)), H = ix(G);
          G.draw({ nodeFill: (id) => (cur != null && K(id) === K(cur) ? 'gold' : null), nodeRing: (id) => (start != null && K(id) === K(start) ? 'ink' : null), nodeColor: (id) => (d[H.at(id)] % 2 ? 'red' : null),
            edgeColor: (e) => (walk.includes(e) ? 'faint' : null), edgeLabel: (e) => (walk.includes(e) ? walk.indexOf(e) + 1 : null), edgeLabelColor: () => 'accent', edgeWidth: (e) => (walk.includes(e) ? 3 : 2) });
          if (msg) s.corner(msg, 'bl', { color: 'red', weight: 600 });
        });
        v.legend([['gold', 'current vertex', { dot: true }], ['red', 'odd degree', { dot: true }]]);
        v.readout(() => {
          const m = G.edges.length, done = walk.length === m && cur != null && K(cur) === K(start);
          return `${walk.length} of ${m} edges used${start != null ? `, started at ${start}, now at ${cur}` : ''} · ${done ? '**Euler tour** ✓' : walk.length === m ? 'all edges used but not back at the start' : 'keep going'}`;
        });
      },
    },
    {
      num: '1.8.1', kind: 'Theorem', name: 'Euler’s theorem: Eulerian iff every degree is even', credit: 'Euler, 1736',
      statement: String.raw`A connected graph is Eulerian if and only if every vertex has even degree. (The same holds for connected multigraphs, with a loop counting $2$ towards the degree.)`,
      idea: String.raw`Necessity: a vertex passed $k$ times by a tour (the start counted once more at the end) has degree $2k$. Sufficiency: with all degrees even, a trail started anywhere can only get stuck back at its start, so there is a closed trail $W$; take a longest one. If it misses edges, the rest $G-E(W)$ still has all degrees even, and by connectedness one of its edges meets $W$; an Euler tour of that component (by induction) can be spliced into $W$, contradicting maximality. Hierholzer's algorithm performs exactly these splices.`,
      caption: String.raw`Odd vertices are red. Step through Hierholzer's algorithm: a closed trail is grown from the start until it returns, then a new trail starts at a tour vertex with unused edges and is spliced in; each subtour has its own colour and the final numbers give the order of the Euler tour. On Königsberg (a multigraph) all four vertices are odd and the first trail gets stuck.`,
      deps: ['graph-1.8.1a', 'graph-1.2.1a'], see: ['algo-8.20', 'bioinf-9.5'], refs: ['Diestel §1.8'], tags: ['Euler tours'],
      viz(v) {
        const PRE = { oct: () => named('octahedron'), bow: () => fixed({ a: [0.8, 1.2], b: [0.8, 5.2], c: [3.0, 3.2], d: [5.0, 1.0], e: [6.4, 3.4], f: [9.0, 5.4], g: [9.0, 1.4] }, 'ab bc ca cd de ec ef fg ge'), k5: () => named('complete', 5), konig: KONIG };
        const pre = v.select('', [{ value: 'bow', label: 'two bowties' }, { value: 'oct', label: 'octahedron' }, { value: 'k5', label: '$K^5$' }, { value: 'konig', label: 'Königsberg' }], 'bow', { onChange: () => load() });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: true });
        let S = null;
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges.map(([a, b]) => ({ from: a, to: b })) }); if (P.layout === 'fit') G.layout('fit'); if (S) S.reset({ at: 'end' }); }
        load();
        function frames() {
          const H = ix(G, { multi: true }), d = degrees(H), odd = H.ids.filter((_, u) => d[u] % 2), used = new Uint8Array(H.m), F = [], color = new Map();
          const snap = (o) => F.push({ used: Uint8Array.from(used), color: new Map(color), odd, ...o });
          if (!H.m) return [{ used, color, odd, note: 'no edges' }];
          const s0 = odd.length ? H.at(odd[0]) : 0; let tour = [s0], sub = 0; snap({ cur: H.ids[s0], note: odd.length ? `Odd vertices exist; start at the odd vertex ${H.ids[s0]}.` : `Start at ${H.ids[s0]}.` });
          const walk = (s0) => {
            const tr = [s0]; let u = s0;
            for (;;) { const nx = H.adj[u].find(([, k]) => !used[k]); if (!nx) break; used[nx[1]] = 1; color.set(H.E[nx[1]][2], sub); u = nx[0]; tr.push(u); snap({ cur: H.ids[u], note: `Subtour ${sub + 1}: walk along an unused edge to ${H.ids[u]}.` }); }
            return tr;
          };
          const t0 = walk(s0);
          if (t0[t0.length - 1] !== s0) { snap({ stuck: true, cur: H.ids[t0[t0.length - 1]], note: `Stuck at ${H.ids[t0[t0.length - 1]]} ≠ ${H.ids[s0]}: the trail cannot close up — no Euler tour exists.` }); return F; }
          tour = t0;
          for (;;) {
            const i = tour.findIndex((u) => H.adj[u].some(([, k]) => !used[k])); if (i < 0) break;
            sub++; snap({ cur: H.ids[tour[i]], note: `${H.ids[tour[i]]} on the tour still has unused edges: start subtour ${sub + 1} there.` });
            const t = walk(tour[i]); tour = tour.slice(0, i).concat(t, tour.slice(i + 1));
            snap({ cur: H.ids[tour[i]], note: `Splice subtour ${sub + 1} into the tour at ${H.ids[t[0]]}.` });
          }
          const order = new Map(); for (let j = 0; j + 1 < tour.length; j++) { const a = tour[j], b = tour[j + 1]; const k = H.adj[a].find(([w, kk]) => w === b && !order.has(H.E[kk][2]))[1]; order.set(H.E[k][2], j + 1); }
          const all = used.every((x) => x);
          snap({ done: true, order, note: all ? `All ${H.m} edges used: the Euler tour is ${tour.map((u) => H.ids[u]).join(' ')}.` : 'The graph is disconnected: some edges were never reached.' });
          return F;
        }
        S = v.steps({ frames, speed: 3, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        const SUB = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
        v.render(() => {
          const f = S.frame; if (!f.used) return; const oddS = new Set(f.odd.map(K));
          G.draw({ nodeFill: (id) => (K(id) === K(f.cur) ? 'gold' : null), nodeColor: (id) => (oddS.has(K(id)) ? 'red' : null), nodeRing: (id) => (oddS.has(K(id)) ? 'red' : null),
            edgeColor: (e) => (f.color.has(e) ? SUB[f.color.get(e) % SUB.length] : null), edgeWidth: (e) => (f.color.has(e) ? 3.6 : 1.6), edgeLabel: (e) => (f.order ? f.order.get(e) ?? null : null) });
        });
        v.legend([['red', 'odd degree', { dot: true }], ['blue', 'subtour 1'], ['orange', 'subtour 2'], ['green', 'subtour 3']]);
        v.readout(() => { const f = S.frame; if (!f.used) return ''; const H = ix(G, { multi: true }), conn = comps(H).k === 1; return `${conn ? 'connected' : 'disconnected'} · odd vertices: ${f.odd.length ? f.odd.join(', ') : 'none'} → ${f.odd.length ? '**not Eulerian**' : conn ? '**Eulerian**' : 'not connected'}${f.done && !f.odd.length && conn ? ' ✓ tour found' : ''}`; });
      },
    },
    // ================================================================== 1.9 Some linear algebra
    {
      num: '1.9.1a', kind: 'Definition', name: 'Edge space and cycle space over 𝔽₂', verify: true,
      statement: String.raw`For a graph $G=(V,E)$ with $E=\{e_1,\dots,e_m\}$, the **edge space** $\mathcal E(G)$ is the vector space of all functions $E\to\mathbb F_2$; identifying a function with the set of edges it maps to $1$, its elements are the subsets of $E$, vector addition is symmetric difference $F+F'=F\triangle F'$, the zero is $\emptyset$, and $\dim\mathcal E(G)=m$. (The vertex space $\mathcal V(G)$ is defined likewise, of dimension $n$.) The bilinear form $\langle F,F'\rangle=\sum_e F(e)F'(e)\in\mathbb F_2$ is $0$ exactly when $F,F'$ share an even number of edges. The **cycle space** $\mathcal C(G)$ is the subspace spanned by the edge sets of the cycles of $G$; its dimension is the **cyclomatic number**.`,
      idea: String.raw`Over $\mathbb F_2$ every vector is its own negative, so adding an edge set twice cancels it: the sum of two cycles is their symmetric difference, which in general is not a cycle but a union of edge-disjoint cycles. Note that $\langle F,F\rangle$ can be $0$ for $F\ne\emptyset$ — the form is not positive definite, yet orthogonal complements still satisfy $\dim\mathcal F+\dim\mathcal F^\perp=m$.`,
      caption: String.raw`Choose which register to edit and click edges: $F$ is blue, $F'$ orange (edges in both are purple). The right panel shows the sum $F+F'$ in green; red vertices have odd degree in it. A set lies in the cycle space exactly when no vertex is red (1.9.1).`,
      deps: ['graph-1.3.1a'], see: ['ladr-1.33'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'cycle space'],
      viz(v) {
        const reg = v.select('click edits', [{ value: 'F', label: '$F$' }, { value: 'G', label: "$F'$" }], 'F');
        const A = gstage(v, { height: 280, title: "$F$ and $F'$" }), B = gstage(v, { height: 280, title: "$F + F' = F\\,\\triangle\\, F'$" });
        const G = v.graph(A, { ...LA(), r: 11 }), G2 = v.graph(B, { nodes: [], edges: [], r: 11, draggable: false });
        const H = ix(G); let F = new Uint8Array(H.m), F2 = new Uint8Array(H.m);
        const set = (S, pairs) => pairs.split(' ').forEach((p) => (S[H.eix.get(G.edge(p[0], p[1]))] = 1));
        set(F, 'ab bf fe ea'); set(F2, 'bf bc cf');
        G.onClick = ({ edge }) => { if (edge) { const k = H.eix.get(edge), T = reg.value === 'F' ? F : F2; T[k] ^= 1; } return true; };
        v.render(() => {
          G2.nodes = G.nodes; G2.edges = G.edges; const S = xor(F, F2), odd = new Set(oddVerts(H, S).map((u) => H.ids[u]));
          G.draw({ edgeColor: (e) => { const k = H.eix.get(e); return F[k] && F2[k] ? 'purple' : F[k] ? 'blue' : F2[k] ? 'orange' : null; }, edgeWidth: (e) => { const k = H.eix.get(e); return F[k] || F2[k] ? 4 : 1.3; } });
          G2.draw({ nodeFill: (id) => (odd.has(id) ? 'red' : null), edgeColor: (e) => (S[H.eix.get(e)] ? 'green' : 'faint'), edgeWidth: (e) => (S[H.eix.get(e)] ? 4 : 1.2) });
        });
        v.legend([['blue', '$F$'], ['orange', "$F'$"], ['purple', 'in both'], ['green', "$F+F'$"], ['red', 'odd vertex', { dot: true }]]);
        v.readout(() => {
          const S = xor(F, F2), inC = (X) => (oddVerts(H, X).length ? '∉' : '∈');
          return String.raw`$|F| = ${popcount(F)}$, $|F'| = ${popcount(F2)}$, $|F+F'| = ${popcount(S)}$ · $\langle F,F'\rangle = ${dotF2(F, F2)}$ (they share ${[...F].filter((x, i) => x && F2[i]).length} edges) · $F ${inC(F)} \mathcal C$, $F' ${inC(F2)} \mathcal C$, $F+F' ${inC(S)} \mathcal C$`;
        });
      },
    },
    {
      num: '1.9.1', kind: 'Proposition', name: 'The cycle space consists of the even edge sets',
      statement: String.raw`For an edge set $D\subseteq E$ the following are equivalent:

(i) $D\in\mathcal C(G)$;

(ii) $D$ is a (possibly empty) disjoint union of edge sets of cycles of $G$;

(iii) all vertex degrees of the graph $(V,D)$ are even.`,
      idea: String.raw`Cycles have all degrees even, and symmetric differences preserve this (degrees add mod 2), giving (i)⇒(iii). For (iii)⇒(ii), induct on $|D|$: a non-empty graph with all degrees even has minimum degree $\ge2$ on its non-isolated part and hence contains a cycle (1.3.1); remove its edges and continue. (ii)⇒(i) is immediate from the definition.`,
      caption: String.raw`Click edges to toggle them in $D$. As long as some vertex has odd degree in $D$ (red), $D$ is not in the cycle space. Once all degrees are even, $D$ is split live into edge-disjoint cycles, each drawn in its own colour.`,
      deps: ['graph-1.9.1a', 'graph-1.3.1'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'cycle space'],
      viz(v) {
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...LA(), r: 12 });
        const H = ix(G), D = new Uint8Array(H.m);
        'ab fe ea bc cg gf fi ih hf'.split(' ').forEach((p) => (D[H.eix.get(G.edge(p[0], p[1]))] = 1));
        G.onClick = ({ edge }) => { if (edge) D[H.eix.get(edge)] ^= 1; return true; };
        v.button('Clear', () => D.fill(0));
        v.render(() => {
          const odd = new Set(oddVerts(H, D).map((u) => H.ids[u])), dec = cycleDecomp(H, D), col = new Map();
          if (dec) dec.forEach((c, i) => c.forEach((k) => col.set(H.E[k][2], PALETTE[i % 8])));
          G.draw({ nodeFill: (id) => (odd.has(id) ? 'red' : null), edgeColor: (e) => (D[H.eix.get(e)] ? col.get(e) || 'ink' : 'faint'), edgeWidth: (e) => (D[H.eix.get(e)] ? 4 : 1.2) });
        });
        v.legend([['red', 'odd degree in $D$', { dot: true }]]);
        v.readout(() => {
          const odd = oddVerts(H, D), dec = cycleDecomp(H, D);
          if (odd.length) return `$|D| = ${popcount(D)}$ · odd degree at ${odd.map((u) => H.ids[u]).join(', ')} → $D \\notin \\mathcal C(G)$`;
          return `$|D| = ${popcount(D)}$, all degrees even → $D\\in\\mathcal C(G)$ = disjoint union of ${dec.length} cycle(s) of lengths ${dec.map((c) => c.length).join(' + ') || '0'}`;
        });
      },
    },
    {
      num: '1.9.1b', kind: 'Definition', name: 'Cuts, bonds and the cut space', verify: true,
      statement: String.raw`A set $F$ of edges is a **cut** in $G$ if there is a partition $\{V_1,V_2\}$ of $V$ (into non-empty classes) with $F=E(V_1,V_2)$, the set of edges with one end in each class; the edges of $F$ **cross** the partition, and if $G$ is connected the partition is determined by $F$ and its classes are the **sides** of the cut. A minimal non-empty cut is a **bond**. Cuts of the form $E(v)$ are **atomic**. The cuts, together with $\emptyset$, form the **cut space** $\mathcal B(G)$ (1.9.2).`,
      idea: String.raw`In a connected graph a cut is a bond exactly when both sides induce connected subgraphs: if a side fell into pieces, the edges leaving one piece would form a smaller non-empty cut. Bonds play for the cut space the role that cycles play for the cycle space — they are its minimal non-empty elements.`,
      caption: String.raw`Click vertices to move them between the sides $V_1$ (blue) and $V_2$ (orange). The crossing edges, the cut $E(V_1,V_2)$, are red. The badge says whether it is a bond: it is exactly when both sides stay connected.`,
      deps: ['graph-1.9.1a', 'graph-1.4.1a'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'cuts'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...LA(), r: 13 });
        const U = new Set(['a', 'b', 'e', 'h']);
        G.onClick = ({ node }) => { if (node) U.has(node.id) ? U.delete(node.id) : U.add(node.id); return true; };
        const comp = () => { const H = ix(G), c1 = comps(ix(G, { skipNode: (id) => !U.has(id) })).k, c2 = comps(ix(G, { skipNode: (id) => U.has(id) })).k; const cut = G.edges.filter((e) => U.has(e.from) !== U.has(e.to)); return { H, c1, c2, cut, proper: U.size > 0 && U.size < H.n }; };
        v.render(() => {
          const c = comp(), cs = new Set(c.cut);
          G.draw({ nodeFill: (id) => (U.has(id) ? 'blue' : 'orange'), edgeColor: (e) => (cs.has(e) ? 'red' : null), edgeWidth: (e) => (cs.has(e) ? 3.8 : 1.6), edgeDash: (e) => cs.has(e) });
          const bond = c.proper && c.c1 === 1 && c.c2 === 1;
          s.corner(!c.proper ? 'not a partition' : bond ? 'a BOND' : `a cut, not a bond (${c.c1} + ${c.c2} pieces)`, 'tl', { color: bond ? 'green' : 'red', weight: 700, size: 13 });
        });
        v.legend([['blue', '$V_1$', { dot: true }], ['orange', '$V_2$', { dot: true }], ['red', 'cut $E(V_1,V_2)$', { dash: true }]]);
        v.readout(() => { const c = comp(); return `$|E(V_1,V_2)| = ${c.cut.length}$ · $G[V_1]$ has ${c.c1} and $G[V_2]$ has ${c.c2} component(s) → ${c.proper && c.c1 === 1 && c.c2 === 1 ? 'both sides connected: **bond**' : 'not a bond'}`; });
      },
    },
    {
      num: '1.9.2', kind: 'Proposition', name: 'The cuts form a subspace generated by vertex stars',
      statement: String.raw`Together with $\emptyset$, the cuts of $G$ form a subspace $\mathcal B=\mathcal B(G)$ of $\mathcal E(G)$, and this space is generated by the atomic cuts $E(v)$.`,
      idea: String.raw`For a vertex set $U$, the sum $\sum_{v\in U}E(v)$ counts an edge with both ends in $U$ twice — so it cancels — and an edge with one end in $U$ once: the sum is exactly $E(U,V\setminus U)$, or $\emptyset$ when $U\in\{\emptyset,V\}$. So every cut is a sum of stars, and every sum of stars is a cut or empty; the cuts with $\emptyset$ are thus the span of the stars.`,
      caption: String.raw`Click vertices to put them into $U$. Every edge is labelled with the number of stars $E(v)$, $v\in U$, that contain it: edges labelled 2 cancel over $\mathbb F_2$ (dashed), edges labelled 1 survive — and they are precisely the cut $E(U,V\setminus U)$ (red).`,
      deps: ['graph-1.9.1b'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'cuts'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...LA(), r: 13 });
        const U = new Set(['b', 'f', 'g']);
        G.onClick = ({ node }) => { if (node) U.has(node.id) ? U.delete(node.id) : U.add(node.id); return true; };
        const cnt = (e) => (U.has(e.from) ? 1 : 0) + (U.has(e.to) ? 1 : 0);
        v.render(() => {
          G.draw({ nodeFill: (id) => (U.has(id) ? 'blue' : null), edgeColor: (e) => ({ 1: 'red', 2: 'muted' })[cnt(e)] ?? 'faint', edgeWidth: (e) => (cnt(e) === 1 ? 3.8 : cnt(e) === 2 ? 2 : 1.2), edgeDash: (e) => cnt(e) === 2,
            edgeLabel: (e) => (cnt(e) ? String(cnt(e)) : null), edgeLabelColor: (e) => (cnt(e) === 1 ? 'red' : 'muted') });
        });
        v.legend([['blue', 'vertices in $U$', { dot: true }], ['red', 'in one star: the cut'], ['muted', 'in two stars: cancels', { dash: true }]]);
        v.readout(() => { const one = G.edges.filter((e) => cnt(e) === 1).length, two = G.edges.filter((e) => cnt(e) === 2).length; return String.raw`$\sum_{v\in U} E(v)$: ${one + 2 * two} edge incidences, ${two} edges counted twice cancel, ${one} remain $= |E(U, V\setminus U)|$ ✓`; });
      },
    },
    {
      num: '1.9.3', kind: 'Lemma', name: 'Every cut is a disjoint union of bonds',
      statement: String.raw`Every cut is a disjoint union of bonds.`,
      idea: String.raw`Induct on the size of the cut $F$. If $F=\emptyset$ it is the empty union; if $F$ is a bond we are done. Otherwise $F$ properly contains a non-empty cut $F'$, and by 1.9.2 so is $F\setminus F'=F+F'$; both are smaller cuts, hence disjoint unions of bonds, and so is $F$. Concretely, if a side $V_1$ falls into components, the edges leaving one component already form a smaller cut inside $F$.`,
      caption: String.raw`Click vertices to choose the side $U$ (filled). The cut $E(U,V\setminus U)$ is split recursively, by peeling off the edges at a component of a disconnected side, into bonds — each drawn in its own colour.`,
      deps: ['graph-1.9.2'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'cuts'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...LA(), r: 13 });
        const U = new Set(['a', 'c', 'h', 'i', 'g']);
        G.onClick = ({ node }) => { if (node) U.has(node.id) ? U.delete(node.id) : U.add(node.id); return true; };
        const bonds = () => {
          const H = ix(G), out = [];
          const rec = (side) => { // side: Set of vertex indices; cut = E(side, rest)
            const cut = H.E.map(([a, b], k) => (side.has(a) !== side.has(b) ? k : -1)).filter((k) => k >= 0); if (!cut.length) return;
            for (const S of [side, new Set([...Array(H.n).keys()].filter((u) => !side.has(u)))]) {
              const C = comps(H, (u) => S.has(u)); if (C.k > 1) { const A = new Set(C.lists[0]); rec(A); const rest = new Set([...side].filter((u) => !A.has(u))); rec(S === side ? rest : new Set([...side, ...A])); return; }
            }
            out.push(cut);
          };
          rec(new Set([...U].map((id) => H.at(id)))); return { H, out };
        };
        v.render(() => {
          const { H, out } = bonds(), col = new Map(); out.forEach((b, i) => b.forEach((k) => col.set(H.E[k][2], PALETTE[i % 8])));
          G.draw({ nodeFill: (id) => (U.has(id) ? 'ink' : null), edgeColor: (e) => col.get(e) || 'faint', edgeWidth: (e) => (col.has(e) ? 4 : 1.3) });
        });
        v.readout(() => { const { out } = bonds(); const tot = out.reduce((a, b) => a + b.length, 0); return `cut of size ${G.edges.filter((e) => U.has(e.from) !== U.has(e.to)).length} = disjoint union of ${out.length} bond(s) of sizes ${out.map((b) => b.length).join(' + ') || '0'} = ${tot} ✓`; });
      },
    },
    {
      num: '1.9.4', kind: 'Theorem', name: 'Cycle space and cut space are orthogonal complements',
      statement: String.raw`The cycle space $\mathcal C$ and the cut space $\mathcal B$ of any graph satisfy $\mathcal C=\mathcal B^\perp$ and $\mathcal B=\mathcal C^\perp$.`,
      idea: String.raw`A cycle crosses every cut an even number of times, so $\mathcal C\subseteq\mathcal B^\perp$ and $\mathcal B\subseteq\mathcal C^\perp$. If $F\notin\mathcal C$, some vertex $v$ meets $F$ in an odd number of edges (1.9.1), so $\langle E(v),F\rangle=1$ and $F\notin\mathcal B^\perp$. If $F\in\mathcal C^\perp$, contract the edges outside $F$: every cycle of the resulting multigraph extends to a cycle of $G$ using an even number of edges outside $F$, so it is even, the multigraph is bipartite (1.6.1), and its bipartition makes $F$ a cut.`,
      caption: String.raw`Mode $\mathcal C\perp\mathcal B$: click edges to build $D$ and vertices to choose the side $U$ of a cut; the number of common edges is shown, and it is always even when $D$ is in the cycle space. Mode $\mathcal C^\perp=\mathcal B$: click edges to build $F$; if $F$ meets some cycle oddly that cycle is shown, otherwise the bipartition that makes $F$ a cut is found and coloured.`,
      deps: ['graph-1.9.1', 'graph-1.9.2', 'graph-1.6.1', 'graph-1.5.1'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'duality'],
      viz(v) {
        const mode = v.select('', [{ value: 'a', label: '$D\\in\\mathcal C$ against cuts' }, { value: 'b', label: '$F\\perp\\mathcal C\\Rightarrow F$ is a cut' }], 'a');
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...LA(), r: 13 });
        const H = ix(G), D = new Uint8Array(H.m), F = new Uint8Array(H.m), U = new Set(['b', 'c', 'f', 'g']);
        'ef fi ih he'.split(' ').forEach((p) => (D[H.eix.get(G.edge(p[0], p[1]))] = 1));
        'bc cf cg dg dj'.split(' ').forEach((p) => (F[H.eix.get(G.edge(p[0], p[1]))] = 1));
        G.onClick = ({ node, edge }) => { if (edge) (mode.value === 'a' ? D : F)[H.eix.get(edge)] ^= 1; else if (node && mode.value === 'a') U.has(node.id) ? U.delete(node.id) : U.add(node.id); return true; };
        const T = spanTree(H, 0, 'bfs');
        const testF = () => {
          for (let k = 0; k < H.m; k++) if (!T.inT[k]) { const C = fundCycle(H, T, k); if (dotF2(C, F)) return { bad: C }; }
          // contract edges outside F and 2-colour
          const C = comps(H, null, (k) => !F[k]), col = new Array(C.k).fill(-1); col[0] = 0; const q = [0];
          const adj = Array.from({ length: C.k }, () => []); H.E.forEach(([a, b], k) => { if (F[k]) { adj[C.comp[a]].push(C.comp[b]); adj[C.comp[b]].push(C.comp[a]); } });
          for (let i = 0; i < q.length; i++) for (const w of adj[q[i]]) if (col[w] < 0) { col[w] = 1 - col[q[i]]; q.push(w); }
          return { side: H.ids.map((_, u) => (col[C.comp[u]] < 0 ? 0 : col[C.comp[u]])) };
        };
        v.render(() => {
          if (mode.value === 'a') {
            const odd = new Set(oddVerts(H, D).map((u) => H.ids[u])), cut = (e) => U.has(e.from) !== U.has(e.to);
            G.draw({ nodeFill: (id) => (U.has(id) ? 'orange' : null), nodeRing: (id) => (odd.has(id) ? 'red' : null),
              edgeColor: (e) => { const k = H.eix.get(e); return D[k] && cut(e) ? 'purple' : D[k] ? 'blue' : cut(e) ? 'orange' : null; }, edgeWidth: (e) => (D[H.eix.get(e)] || cut(e) ? 3.6 : 1.3), edgeDash: (e) => cut(e) && !D[H.eix.get(e)] });
          } else {
            const r = testF(), bad = r.bad;
            G.draw({ nodeFill: (id) => (r.side ? (r.side[H.at(id)] ? 'orange' : 'blue') : null),
              edgeColor: (e) => { const k = H.eix.get(e); return F[k] && bad && bad[k] ? 'red' : F[k] ? 'ink' : bad && bad[k] ? 'red' : null; }, edgeWidth: (e) => { const k = H.eix.get(e); return F[k] ? 4 : bad && bad[k] ? 2.6 : 1.3; }, edgeDash: (e) => !!(bad && bad[H.eix.get(e)] && !F[H.eix.get(e)]) });
          }
        });
        v.legend([['blue', '$D$ (or side $V_1$)'], ['orange', 'cut $E(U,V\\setminus U)$ (or side $V_2$)', { dash: true }], ['purple', '$D\\cap$ cut'], ['red', 'odd vertex / a cycle meeting $F$ oddly']]);
        v.readout(() => {
          if (mode.value === 'a') { const inC = !oddVerts(H, D).length, common = G.edges.filter((e) => D[H.eix.get(e)] && U.has(e.from) !== U.has(e.to)).length; return String.raw`$D ${inC ? '\\in' : '\\notin'} \mathcal C$ · $|D\cap E(U,V\setminus U)| = ${common}$, so $\langle D, E(U,\cdot)\rangle = ${common % 2}$${inC ? ' — even, as the theorem demands ✓' : ' — odd vertices exist, and $D$ is not orthogonal to their stars'}`; }
          const r = testF(); return r.bad ? `$F$ meets the red cycle in ${popcount(r.bad.map((x, i) => x & F[i]))} edges (odd): $F \\notin \\mathcal C^\\perp$, and indeed $F$ is not a cut` : `$F$ is orthogonal to every (fundamental) cycle → $F = E(V_1, V_2)$ for the coloured bipartition ✓`;
        });
      },
    },
    {
      num: '1.9.5', kind: 'Theorem', name: 'Fundamental cycles and cuts form bases; dim C = m − n + 1',
      statement: String.raw`Let $G$ be a connected graph with $n$ vertices and $m$ edges, and $T\subseteq G$ a spanning tree. For a chord $e\notin T$ let $C_e$ be the unique cycle in $T+e$ (its **fundamental cycle**), and for $f\in T$ let $D_f$ be the set of edges between the two components of $T-f$ (its **fundamental cut**). Then

(i) the fundamental cuts and the fundamental cycles form bases of $\mathcal B(G)$ and $\mathcal C(G)$, respectively;

(ii) hence $\dim\mathcal B(G)=n-1$ and $\dim\mathcal C(G)=m-n+1$.`,
      idea: String.raw`A chord $e$ lies in $C_e$ and in no other fundamental cycle, and a tree edge $f$ lies in $D_f$ and in no other fundamental cut, so both families are independent. For any $C\in\mathcal C$, the sum $C+\sum_{e\in C\setminus T}C_e$ lies in $\mathcal C$ but inside $T$, where the only element of $\mathcal C$ is $\emptyset$; so $C$ is the sum of the fundamental cycles of its chords. The same argument works for cuts. Counting: $n-1$ tree edges (1.5.2), $m-n+1$ chords.`,
      caption: String.raw`Choose how $T$ (green) is grown. Click a chord to light up its fundamental cycle, a tree edge for its fundamental cut. The table lists the fundamental cycles as rows of $\mathcal E(G)$, chords first: the identity block on the left is why they are independent. Switch to *build* to click any edge set $D$: if it is even, it is rebuilt as the XOR of the fundamental cycles of its chords.`,
      deps: ['graph-1.9.4', 'graph-1.5.2', 'graph-1.5.1'], see: ['top-11.12', 'ladr-2.35'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'spanning trees'],
      viz(v) {
        const kind = v.select('$T$ by', [{ value: 'bfs', label: 'BFS' }, { value: 'dfs', label: 'DFS' }], 'bfs');
        const mode = v.select('click to', [{ value: 'show', label: 'show $C_e$ / $D_f$' }, { value: 'build', label: 'build $D\\in\\mathcal C$' }], 'show');
        const s = gstage(v, { height: 300, full: true });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true, title: 'fundamental cycles as vectors in $\\mathbb F_2^m$ (columns: chords, then tree edges)' });
        const G = v.graph(s, { ...LA(), r: 12 });
        const H = ix(G), Tb = v.table(t, { rows: 1, cols: 1, maxCell: 30, size: 11 });
        let pick = H.eix.get(G.edge('f', 'g')); const D = new Uint8Array(H.m);
        'ef fi ih he bf bc cf'.split(' ').forEach((p) => (D[H.eix.get(G.edge(p[0], p[1]))] = 1));
        G.onClick = ({ edge }) => { if (edge) { if (mode.value === 'show') pick = H.eix.get(edge); else D[H.eix.get(edge)] ^= 1; } return true; };
        const comp = () => {
          const T = spanTree(H, 0, kind.value), chords = [...Array(H.m).keys()].filter((k) => !T.inT[k]), tree = [...Array(H.m).keys()].filter((k) => T.inT[k]);
          const cyc = chords.map((k) => fundCycle(H, T, k)), cuts = tree.map((k) => fundCut(H, T, k).F);
          return { T, chords, tree, cyc, cuts, rc: rankF2(cyc), rb: rankF2(cuts), orth: cyc.every((c) => cuts.every((d) => !dotF2(c, d))) };
        };
        v.render(() => {
          const c = comp(), lab = (k) => H.ids[H.E[k][0]] + H.ids[H.E[k][1]];
          let hi = new Uint8Array(H.m), col = 'red';
          if (mode.value === 'show') { if (c.T.inT[pick]) { hi = fundCut(H, c.T, pick).F; col = 'orange'; } else { hi = fundCycle(H, c.T, pick); col = 'red'; } }
          const odd = mode.value === 'build' ? oddVerts(H, D) : [];
          let rebuilt = null; if (mode.value === 'build' && !odd.length) { rebuilt = new Uint8Array(H.m); c.chords.forEach((k, i) => { if (D[k]) rebuilt = xor(rebuilt, c.cyc[i]); }); }
          G.draw({ nodeRing: (id) => (odd.includes(H.at(id)) ? 'red' : null),
            edgeColor: (e) => { const k = H.eix.get(e); if (mode.value === 'build') return D[k] ? (rebuilt && rebuilt[k] ? 'purple' : 'ink') : c.T.inT[k] ? 'green' : null; return k === pick ? 'gold' : hi[k] ? col : c.T.inT[k] ? 'green' : null; },
            edgeWidth: (e) => { const k = H.eix.get(e); return (mode.value === 'build' ? D[k] : hi[k] || k === pick) ? 4.2 : c.T.inT[k] ? 2.6 : 1.4; }, edgeDash: (e) => !c.T.inT[H.eix.get(e)] && mode.value === 'show' && !hi[H.eix.get(e)] });
          const order = [...c.chords, ...c.tree], rows = c.cyc.length, ri = mode.value === 'show' && !c.T.inT[pick] ? c.chords.indexOf(pick) : -1;
          Tb.draw({ rows, cols: H.m, rowLabels: c.chords.map((k) => `$C_{${lab(k)}}$`), colLabels: order.map(lab), value: (i, j) => (c.cyc[i][order[j]] ? '1' : ''),
            fill: (i, j) => (c.cyc[i][order[j]] ? (j < rows ? ['accent', 0.55] : ['red', 0.3]) : null), activeRow: ri >= 0 ? ri : undefined, activeColor: 'gold', square: false, cellAspect: 1.2, labelSize: 11 });
        });
        v.legend([['green', 'spanning tree $T$'], ['red', 'fundamental cycle $C_e$'], ['orange', 'fundamental cut $D_f$'], ['purple', '$D$ rebuilt from fundamental cycles']]);
        v.readout(() => {
          const c = comp(), n = H.n, m = H.m; let extra = '';
          if (mode.value === 'build') { const odd = oddVerts(H, D); if (odd.length) extra = ` · $D$ has odd vertices, so $D\\notin\\mathcal C$`; else { let r = new Uint8Array(m); c.chords.forEach((k, i) => { if (D[k]) r = xor(r, c.cyc[i]); }); extra = ` · $D = \\sum_{e\\in D\\setminus T} C_e$ over ${c.chords.filter((k) => D[k]).length} chords: ${r.every((x, i) => x === D[i]) ? '✓' : '✗'}`; } }
          return String.raw`$m - n + 1 = ${m} - ${n} + 1 = ${m - n + 1}$ fundamental cycles, rank ${c.rc}; $n - 1 = ${n - 1}$ fundamental cuts, rank ${c.rb}; all $\langle C_e, D_f\rangle = 0$: ${c.orth ? '✓' : '✗'}` + extra;
        });
      },
    },
    {
      num: '1.9.5a', kind: 'Definition', name: 'Incidence and adjacency matrices', verify: true,
      statement: String.raw`Let $V=\{v_1,\dots,v_n\}$ and $E=\{e_1,\dots,e_m\}$. The **incidence matrix** $B=(b_{ij})_{n\times m}$ of $G$ has $b_{ij}=1$ if $v_i\in e_j$ and $b_{ij}=0$ otherwise; over $\mathbb F_2$ it defines linear maps $B\colon\mathcal E(G)\to\mathcal V(G)$ and $B^\top\colon\mathcal V(G)\to\mathcal E(G)$. The **adjacency matrix** $A=(a_{ij})_{n\times n}$ has $a_{ij}=1$ if $v_iv_j\in E$ and $a_{ij}=0$ otherwise.`,
      idea: String.raw`Every column of $B$ has exactly two $1$s (an edge has two ends) and row $i$ has $d(v_i)$ of them; $A$ is symmetric with zero diagonal and row sums equal to the degrees. Over $\mathbb F_2$, $B$ sends an edge set to the vertices of odd degree in it, $B^\top$ sends a vertex set $U$ to the cut $E(U,V\setminus U)$, and $A$ sends $U$ to the vertices with an odd number of neighbours in $U$.`,
      caption: String.raw`Click a vertex or an edge of the graph (or a row or column label of a matrix) to highlight its row in $B$ and $A$ or its column in $B$. Edit the graph (${EDIT}; up to 7 vertices) and both matrices are rewritten.`,
      deps: ['graph-1.9.1a'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'matrices'],
      viz(v) {
        const s = gstage(v, { height: 260, y: [0, 5.2] });
        const ta = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, title: 'adjacency matrix $A$' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true, title: 'incidence matrix $B$ (rows: vertices, columns: edges)' });
        const G = v.graph(s, { ...fixed({ a: [1.2, 1.0], b: [4.6, 0.8], c: [8.4, 1.2], d: [2.6, 4.2], e: [6.4, 4.4], f: [9.2, 3.6] }, 'ab bc ad bd be ce cf ef'), editable: true, r: 14 });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 7) G.removeNode(obj.id); };
        const TA = v.table(ta, { rows: 1, cols: 1, maxCell: 34, size: 12 }), TB = v.table(tb, { rows: 1, cols: 1, maxCell: 34, size: 12 });
        let sel = { v: 'b' };
        G.onClick = ({ node, edge }) => { if (node && !sel.edit) { sel = { v: node.id }; } else if (edge) { sel = { e: edge }; return true; } return false; };
        const lab = (H, k) => 'e' + (k + 1);
        ta.onClick((x, y) => { const c = TA.hit(x, y), H = ix(G); if (c) { const i = c.i >= 0 ? c.i : c.j; if (i >= 0) sel = { v: H.ids[i] }; } });
        tb.onClick((x, y) => { const c = TB.hit(x, y), H = ix(G); if (!c) return; if (c.j >= 0) sel = { e: H.E[c.j][2] }; else if (c.i >= 0) sel = { v: H.ids[c.i] }; });
        v.render(() => {
          const H = ix(G), A = G.matrix(false), vi = sel.v != null ? H.at(sel.v) : -1, ej = sel.e ? H.eix.get(sel.e) ?? -1 : -1;
          G.draw({ nodeFill: (id) => (H.at(id) === vi ? 'gold' : ej >= 0 && (H.E[ej][0] === H.at(id) || H.E[ej][1] === H.at(id)) ? 'orange' : null),
            edgeColor: (e) => (H.eix.get(e) === ej ? 'orange' : vi >= 0 && (H.at(e.from) === vi || H.at(e.to) === vi) ? 'gold' : null), edgeWidth: (e) => (H.eix.get(e) === ej || (vi >= 0 && (H.at(e.from) === vi || H.at(e.to) === vi)) ? 3.6 : 1.8),
            edgeLabel: (e) => lab(H, H.eix.get(e)), edgeLabelColor: () => 'muted' });
          TA.draw({ rows: H.n, cols: H.n, rowLabels: H.ids, colLabels: H.ids, value: (i, j) => A[i][j], fill: (i, j) => (A[i][j] ? ['accent', 0.35] : null), activeRow: vi >= 0 ? vi : undefined, activeCol: vi >= 0 ? vi : undefined, activeColor: 'gold' });
          TB.draw({ rows: H.n, cols: H.m, rowLabels: H.ids, colLabels: H.E.map((_, k) => lab(H, k)), value: (i, j) => (H.E[j][0] === i || H.E[j][1] === i ? 1 : 0), fill: (i, j) => (H.E[j][0] === i || H.E[j][1] === i ? ['accent', 0.35] : null),
            activeRow: vi >= 0 ? vi : undefined, activeCol: ej >= 0 ? ej : undefined, activeColor: vi >= 0 ? 'gold' : 'orange', square: false, cellAspect: 1.1 });
        });
        v.readout(() => {
          const H = ix(G), d = degrees(H);
          if (sel.e && H.eix.has(sel.e)) { const k = H.eix.get(sel.e); return `column ${lab(H, k)} of $B$ has its two 1s in rows ${H.ids[H.E[k][0]]} and ${H.ids[H.E[k][1]]} — the ends of the edge`; }
          const u = H.at(sel.v); return u == null ? '' : `row ${sel.v}: ${d[u]} ones in $B$ and ${d[u]} ones in $A$, both equal to $d(${sel.v}) = ${d[u]}$`;
        });
      },
    },
    {
      num: '1.9.6', kind: 'Proposition', name: 'Kernel of the incidence matrix is the cycle space',
      statement: String.raw`Over $\mathbb F_2$, the incidence matrix $B$ of $G$ satisfies: (i) the kernel of $B\colon\mathcal E(G)\to\mathcal V(G)$ is $\mathcal C(G)$; (ii) the image of $B^\top\colon\mathcal V(G)\to\mathcal E(G)$ is $\mathcal B(G)$.`,
      idea: String.raw`Row $i$ of $B$ applied to an edge set $F$ counts, mod 2, the edges of $F$ at $v_i$; so $BF$ is the set of vertices of odd degree in $(V,F)$, which is empty exactly for $F\in\mathcal C$ (1.9.1). Column $j$ of $B^\top$ applied to a vertex set $U$ counts the ends of $e_j$ in $U$ mod 2, so $B^\top U=E(U,V\setminus U)$, and these sets are exactly the cuts and $\emptyset$ (1.9.2). With rank–nullity this gives $\dim\mathcal C+\operatorname{rank}B=m$ again.`,
      caption: String.raw`Mode $BF$: click edges to choose $F$; its columns of $B$ are highlighted and the extra column shows the row sums mod 2 — the odd vertices of $F$, all zero exactly when $F$ is in the cycle space. Mode $B^\top U$: click vertices; the extra row adds the selected rows mod 2 and returns the cut $E(U,V\setminus U)$.`,
      deps: ['graph-1.9.5a', 'graph-1.9.1', 'graph-1.9.2'], see: ['ladr-3.21'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'matrices'],
      viz(v) {
        const mode = v.select('', [{ value: 'B', label: '$B\\,F$ (edges → vertices)' }, { value: 'Bt', label: '$B^\\top U$ (vertices → edges)' }], 'B');
        const s = gstage(v, { height: 250, y: [0, 5.2] });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, full: true });
        const G = v.graph(s, { ...fixed({ a: [1.2, 1.0], b: [4.6, 0.8], c: [8.4, 1.2], d: [2.6, 4.2], e: [6.4, 4.4], f: [9.2, 3.6] }, 'ab bc ad bd be ce cf ef'), r: 14 });
        const H = ix(G), F = new Uint8Array(H.m), U = new Set(['b', 'e']);
        'ab bd ad be ce cb'.split(' ').forEach((p) => { const e = G.edge(p[0], p[1]); if (e) F[H.eix.get(e)] ^= 1; });
        G.onClick = ({ node, edge }) => { if (mode.value === 'B' && edge) F[H.eix.get(edge)] ^= 1; if (mode.value === 'Bt' && node) U.has(node.id) ? U.delete(node.id) : U.add(node.id); return true; };
        const T = v.table(t, { rows: 1, cols: 1, maxCell: 34, size: 12 });
        const inc = (i, j) => (H.E[j][0] === i || H.E[j][1] === i ? 1 : 0);
        v.render(() => {
          const n = H.n, m = H.m, lab = (k) => 'e' + (k + 1);
          if (mode.value === 'B') {
            const BF = [...Array(n)].map((_, i) => [...Array(m)].reduce((a, _, j) => a ^ (inc(i, j) & F[j]), 0));
            G.draw({ nodeFill: (id) => (BF[H.at(id)] ? 'red' : null), edgeColor: (e) => (F[H.eix.get(e)] ? 'accent' : null), edgeWidth: (e) => (F[H.eix.get(e)] ? 4 : 1.6), edgeLabel: (e) => lab(H.eix.get(e)), edgeLabelColor: () => 'muted' });
            T.draw({ rows: n, cols: m + 1, rowLabels: H.ids, colLabels: [...H.E.map((_, k) => lab(k)), '$BF$'], value: (i, j) => (j < m ? inc(i, j) : BF[i]),
              fill: (i, j) => (j === m ? (BF[i] ? ['red', 0.45] : ['green', 0.2]) : F[j] && inc(i, j) ? ['accent', 0.55] : F[j] ? ['accent', 0.12] : null), square: false, cellAspect: 1.1, colWeights: [...Array(m).fill(1), 1.5] });
          } else {
            const BU = [...Array(m)].map((_, j) => [...U].reduce((a, id) => a ^ inc(H.at(id), j), 0));
            G.draw({ nodeFill: (id) => (U.has(id) ? 'accent' : null), edgeColor: (e) => (BU[H.eix.get(e)] ? 'red' : null), edgeWidth: (e) => (BU[H.eix.get(e)] ? 4 : 1.6), edgeDash: (e) => !!BU[H.eix.get(e)], edgeLabel: (e) => lab(H.eix.get(e)), edgeLabelColor: () => 'muted' });
            T.draw({ rows: n + 1, cols: m, rowLabels: [...H.ids, '$B^\\top U$'], colLabels: H.E.map((_, k) => lab(k)), value: (i, j) => (i < n ? inc(i, j) : BU[j]),
              fill: (i, j) => (i === n ? (BU[j] ? ['red', 0.45] : null) : U.has(H.ids[i]) && inc(i, j) ? ['accent', 0.55] : U.has(H.ids[i]) ? ['accent', 0.12] : null), square: false, cellAspect: 1.1 });
          }
        });
        v.readout(() => {
          if (mode.value === 'B') { const odd = oddVerts(H, F); return `$BF$ = {${odd.map((u) => H.ids[u]).join(', ')}} = the odd vertices of $F$ → ${odd.length ? '$F \\notin \\ker B = \\mathcal C(G)$' : '$BF = 0$: $F \\in \\ker B = \\mathcal C(G)$ ✓'}`; }
          const cut = G.edges.filter((e) => U.has(e.from) !== U.has(e.to)).length; return `$B^\\top U$ has ${cut} ones = the cut $E(U, V\\setminus U)$ with $U$ = {${[...U].join(', ')}} ✓`;
        });
      },
    },
    {
      num: '1.9.7', kind: 'Proposition', name: 'BBᵀ = A + D',
      statement: String.raw`Viewing the incidence matrix $B$ and the adjacency matrix $A$ as real matrices, and letting $D$ be the diagonal matrix of the degrees $d(v_1),\dots,d(v_n)$, one has $BB^\top=A+D$.`,
      idea: String.raw`The $(i,j)$ entry of $BB^\top$ is $\sum_k b_{ik}b_{jk}$, the number of edges incident with both $v_i$ and $v_j$. For $i\ne j$ that is $1$ if $v_iv_j$ is an edge and $0$ otherwise, i.e. $a_{ij}$; for $i=j$ it counts the edges at $v_i$, i.e. $d(v_i)$. (With signed orientations instead one gets the Laplacian $D-A$ of the matrix-tree theorem.)`,
      caption: String.raw`Step through the product entry by entry: rows $i$ and $j$ of $B$ (highlighted below) are multiplied and summed, which counts their common edges. Off the diagonal the result is an adjacency, on the diagonal a degree. Edit the graph (${EDIT}) and the product is recomputed; it always equals $A+D$.`,
      deps: ['graph-1.9.5a'], see: ['circ-2.12'], refs: ['Diestel §1.9'], tags: ['linear algebra', 'matrices'],
      viz(v) {
        const s = gstage(v, { height: 240, y: [0, 5] });
        const tp = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, title: '$BB^\\top$ filling in' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true, title: 'rows $i$ (gold) and $j$ (orange) of $B$' });
        const G = v.graph(s, { ...fixed({ a: [1.2, 1.0], b: [5.0, 0.8], c: [8.6, 1.4], d: [3.0, 4.2], e: [7.0, 4.2] }, 'ab bc ad bd be ce de'), editable: true, r: 14 });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 6) G.removeNode(obj.id); S.reset({ at: 'end' }); };
        const TP = v.table(tp, { rows: 1, cols: 1, maxCell: 36, size: 13 }), TB = v.table(tb, { rows: 1, cols: 1, maxCell: 32, size: 12 });
        function frames() { const H = ix(G), F = []; for (let i = 0; i < H.n; i++) for (let j = 0; j < H.n; j++) { let c = 0; for (const [a, b] of H.E) if ((a === i || b === i) && (a === j || b === j)) c++; F.push({ i, j, val: c, k: F.length, note: i === j ? `$(BB^\\top)_{${H.ids[i]}${H.ids[j]}}$ = edges at ${H.ids[i]} = $d(${H.ids[i]}) = ${c}$` : `$(BB^\\top)_{${H.ids[i]}${H.ids[j]}}$ = common edges of ${H.ids[i]} and ${H.ids[j]} = ${c} $= a_{${H.ids[i]}${H.ids[j]}}$` }); } return F; }
        const S = v.steps({ frames, speed: 4, start: 'end', still: 'end' });
        v.render(() => {
          const H = ix(G), f = S.frame; if (f.i == null || f.i >= H.n || f.j >= H.n) return; const A = G.matrix(false), d = degrees(H), n = H.n, inc = (i, k) => H.E[k][0] === i || H.E[k][1] === i;
          G.draw({ nodeFill: (id) => (H.at(id) === f.i ? 'gold' : H.at(id) === f.j ? 'orange' : null), edgeColor: (e) => { const k = H.eix.get(e); return inc(f.i, k) && inc(f.j, k) ? 'green' : null; }, edgeWidth: (e) => { const k = H.eix.get(e); return inc(f.i, k) && inc(f.j, k) ? 4 : 1.8; } });
          TP.draw({ rows: n, cols: n, rowLabels: H.ids, colLabels: H.ids, value: (i, j) => (i * n + j <= f.k ? (i === j ? d[i] : A[i][j]) : null), fill: (i, j) => (i * n + j <= f.k ? (i === j ? ['orange', 0.35] : A[i][j] ? ['accent', 0.35] : null) : null), highlight: [[f.i, f.j, 'gold']] });
          TB.draw({ rows: n, cols: H.m, rowLabels: H.ids, colLabels: H.E.map((_, k) => 'e' + (k + 1)), value: (i, k) => (inc(i, k) ? 1 : 0), fill: (i, k) => (inc(i, k) && (i === f.i || i === f.j) && inc(f.i, k) && inc(f.j, k) ? ['green', 0.5] : i === f.i ? ['gold', 0.18] : i === f.j ? ['orange', 0.18] : null), square: false, cellAspect: 1.1 });
        });
        v.legend([['accent', 'adjacency entries', { area: true }], ['orange', 'degrees on the diagonal', { area: true }], ['green', 'common edges of rows $i$, $j$']]);
        v.readout(() => { const H = ix(G), A = G.matrix(false), d = degrees(H); let ok = true; for (let i = 0; i < H.n; i++) for (let j = 0; j < H.n; j++) { let c = 0; for (const [a, b] of H.E) if ((a === i || b === i) && (a === j || b === j)) c++; if (c !== (i === j ? d[i] : A[i][j])) ok = false; } return `entry ${S.frame.k + 1} of ${H.n * H.n} · $BB^\\top = A + D$: ${ok ? 'every entry agrees ✓' : '✗'}`; });
      },
    },
    // ================================================================== 1.10 Other notions of graphs
    {
      num: '1.10.1a', kind: 'Definition', name: 'Multigraphs and directed graphs', verify: true,
      statement: String.raw`A **directed graph** (digraph) is a pair $(V,E)$ of disjoint sets with two maps $\mathrm{init}\colon E\to V$ and $\mathrm{ter}\colon E\to V$ assigning to each edge $e$ an initial and a terminal vertex; $e$ is directed from $\mathrm{init}(e)$ to $\mathrm{ter}(e)$, and it is a **loop** if $\mathrm{init}(e)=\mathrm{ter}(e)$. Several edges may join the same two vertices (**multiple edges**). A **multigraph** is a pair $(V,E)$ with a map assigning to every edge one or two vertices, its ends: a digraph with the directions forgotten. A graph is a multigraph without loops and multiple edges; an **orientation** of a graph directs each of its edges.`,
      idea: String.raw`In a multigraph a loop contributes $2$ to the degree of its vertex, so $\sum_v d(v)=2|E|$ still holds and the handshake lemma survives. Contraction is simpler in multigraphs: contracting $e=xy$ deletes only $e$, so edges parallel to $e$ become loops and edges $xv$, $yv$ become parallel — exactly the picture of the Königsberg bridges.`,
      caption: String.raw`Switch between a graph, a multigraph and a directed graph on the same four vertices; the table lists every edge with its ends (or its $\mathrm{init}$ and $\mathrm{ter}$). In the multigraph, click an edge to contract it: parallel edges turn into loops. In the digraph, click an arc to reverse it.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §1.10'], tags: ['multigraphs', 'digraphs'],
      viz(v) {
        const mode = v.select('', [{ value: 'g', label: 'graph' }, { value: 'm', label: 'multigraph' }, { value: 'd', label: 'directed graph' }], 'm', { onChange: () => load() });
        const s = gstage(v, { height: 300 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'edges and their ends' });
        const G = v.graph(s, { nodes: [], edges: [], r: 15 });
        const T = v.table(t, { rows: 1, cols: 1, maxCell: 34, size: 13 });
        function load() {
          const N = [{ id: 'u', x: 1.4, y: 3.2 }, { id: 'v', x: 4.6, y: 5.6 }, { id: 'w', x: 4.6, y: 0.8 }, { id: 'x', x: 8.4, y: 3.2 }];
          const E = mode.value === 'g' ? [['u', 'v'], ['u', 'w'], ['v', 'x'], ['w', 'x'], ['v', 'w']]
            : mode.value === 'm' ? [['u', 'v'], ['u', 'v'], ['u', 'w'], ['w', 'x'], ['v', 'x'], ['v', 'w'], ['x', 'x']]
            : [['u', 'v'], ['v', 'u'], ['u', 'w'], ['w', 'x'], ['x', 'v'], ['v', 'w'], ['x', 'x']];
          G.set({ nodes: N, edges: E.map(([a, b], i) => ({ from: a, to: b, name: 'e' + (i + 1) })), directed: mode.value === 'd' });
        }
        load();
        G.onClick = ({ edge }) => {
          if (!edge) return true;
          if (mode.value === 'd') { [edge.from, edge.to] = [edge.to, edge.from]; }
          else if (mode.value === 'm' && edge.from !== edge.to) {
            const x = edge.from, y = edge.to, nx = G.node(x), ny = G.node(y); nx.x = (nx.x + ny.x) / 2; nx.y = (nx.y + ny.y) / 2;
            G.edges = G.edges.filter((e) => e !== edge).map((e) => ({ ...e, from: e.from === y ? x : e.from, to: e.to === y ? x : e.to }));
            G.nodes = G.nodes.filter((n) => n.id !== y); nx.label = nx.label || x + y; if (!nx.label.includes(y)) nx.label += y;
          }
          return true;
        };
        v.button('Reset', load);
        v.render(() => {
          const md = mode.value, deg = new Map(G.nodes.map((n) => [n.id, 0])); G.edges.forEach((e) => { deg.set(e.from, deg.get(e.from) + 1); deg.set(e.to, deg.get(e.to) + 1); });
          G.draw({ nodeNote: (id) => (md === 'd' ? null : 'd=' + deg.get(id)), noteColor: () => 'muted', edgeLabel: (e) => e.name, edgeColor: (e) => (e.from === e.to ? 'orange' : null), edgeWidth: () => 2.2 });
          const E = G.edges;
          T.draw({ rows: E.length, cols: md === 'd' ? 2 : 1, rowLabels: E.map((e) => e.name), colLabels: md === 'd' ? ['init', 'ter'] : ['ends'],
            value: (i, j) => (md === 'd' ? (j ? E[i].to : E[i].from) : E[i].from === E[i].to ? `{${E[i].from}} (loop)` : `{${E[i].from}, ${E[i].to}}`),
            fill: (i) => (E[i].from === E[i].to ? ['orange', 0.25] : null), square: false, cellAspect: md === 'd' ? 1.4 : 3.6, size: 12.5 });
        });
        v.readout(() => {
          const sum = G.edges.length * 2, md = mode.value, loops = G.edges.filter((e) => e.from === e.to).length;
          const par = G.edges.filter((e, i) => G.edges.some((f, j) => j < i && ekey(e.from, e.to) === ekey(f.from, f.to) && e.from !== e.to)).length;
          if (md === 'd') return `${G.edges.length} arcs, ${loops} loop(s) · out-degrees: ${G.nodes.map((n) => `${n.id}:${G.edges.filter((e) => e.from === n.id).length}`).join(', ')} · in-degrees: ${G.nodes.map((n) => `${n.id}:${G.edges.filter((e) => e.to === n.id).length}`).join(', ')}`;
          return `${G.edges.length} edges, ${loops} loop(s), ${par} repeated edge(s) · $\\sum_v d(v) = ${sum} = 2|E|$ (a loop counts 2)${md === 'g' && !loops && !par ? ' · a graph' : ''}`;
        });
      },
    },
  ],
};
