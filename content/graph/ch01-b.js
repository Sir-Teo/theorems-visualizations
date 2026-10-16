// Graph Theory (Diestel) — Chapter 1: The Basics, part b (§§1.4–1.6: connectivity, trees and forests, bipartite graphs)
import { K, ix, degrees, bfs, comps, parPath, pathEdges, kappa, lambda, spanTree, treePath, below, comparable, eccs, named, PALETTE, ekey } from './ch01.shared.js';

// ---------- local helpers ----------
const fixed = (P, E) => ({ nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: E.trim().split(/\s+/).map((p) => [p[0], p[1]]), layout: 'none' });
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, ...o });
const EDIT = 'click empty space to add a vertex, click two vertices to add or remove the edge between them, Alt-click to delete, drag to move';
const eset = (H, ks) => new Set(ks.map((k) => H.E[k][2]));
const fmt2 = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));
/** Edge indices that lie on no cycle (bridges). */
function bridges(H) {
  const out = new Set(), base = comps(H).k;
  for (let k = 0; k < H.m; k++) if (comps(H, null, (kk) => kk !== k).k > base) out.add(k);
  return out;
}
/** A graph on letters used by the normal-tree items. */
const NT = () => fixed({ a: [1.0, 1.0], b: [3.2, 0.7], c: [5.4, 1.0], d: [7.6, 0.8], e: [9.2, 2.2], f: [2.0, 3.2], g: [4.4, 3.0], h: [6.6, 3.2], i: [8.4, 4.6], j: [1.4, 5.4], k: [3.8, 5.6], l: [6.2, 5.6] },
  'ab bc cd de af bg ch di ei fg gh hi fj gk hl jk kl il bf ch dh fk');
/** Lay a kit graph out as the rooted tree T (vertex indices of H) and return the positions by id. */
function treeLayout(v, stage, H, T, rootIdx) {
  const tmp = v.graph(stage, { nodes: H.ids.map((id) => ({ id })), edges: H.E.filter((_, k) => T.inT[k]).map(([a, b]) => [H.ids[a], H.ids[b]]), layout: 'none', draggable: false });
  tmp.layout('tree', { root: H.ids[rootIdx] }); const P = new Map(tmp.nodes.map((n) => [K(n.id), [n.x, n.y]])); tmp.set({ nodes: [], edges: [] }); return P;
}

export default {
  collection: 'graph',
  chapter: 1,
  items: [
    // ================================================================== 1.4 Connectivity
    {
      num: '1.4.1a', kind: 'Definition', name: 'Connected graphs and components', verify: true,
      statement: String.raw`A graph $G$ is **connected** if it is non-empty and any two of its vertices are linked by a path in $G$; a vertex set $U$ is connected if $G[U]$ is. A maximal connected subgraph of $G$ is a **component** of $G$. The components are induced subgraphs and their vertex sets partition $V(G)$.`,
      idea: String.raw`"Linked by a path in $G$" is an equivalence relation on $V$: reflexive (paths of length $0$), symmetric, and transitive because the union of an $x$–$y$ path and a $y$–$z$ path contains an $x$–$z$ path. Its classes induce exactly the components; no edge can join two classes, which is why components are induced and partition the vertex set.`,
      caption: String.raw`Each component has its own colour. Click an edge to delete it and watch the graph fall apart; click two vertices to add an edge back and merge components (${EDIT}).`,
      deps: ['graph-1.3.1a'], refs: ['Diestel §1.4'], tags: ['connectivity'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [1.0, 1.2], b: [2.8, 0.7], c: [2.2, 2.8], d: [4.4, 2.2], e: [5.8, 1.0], f: [6.0, 3.4], g: [8.0, 2.4], h: [9.2, 1.0], i: [8.6, 4.6], j: [1.4, 5.0], k: [3.4, 5.6], l: [5.6, 5.4] },
          'ab bc ac cd de df ef fg gh gi hi fl jk kc lk'), editable: true, r: 14 });
        G.onClick = ({ edge }) => { if (edge) { G.removeEdge(edge); return true; } return false; };
        v.button('Restore', () => G.set(fixed({ a: [1.0, 1.2], b: [2.8, 0.7], c: [2.2, 2.8], d: [4.4, 2.2], e: [5.8, 1.0], f: [6.0, 3.4], g: [8.0, 2.4], h: [9.2, 1.0], i: [8.6, 4.6], j: [1.4, 5.0], k: [3.4, 5.6], l: [5.6, 5.4] }, 'ab bc ac cd de df ef fg gh gi hi fl jk kc lk')));
        v.render(() => {
          const H = ix(G), C = comps(H), col = (id) => PALETTE[C.comp[H.at(id)] % PALETTE.length];
          G.draw({ nodeFill: col, edgeColor: (e) => col(e.from), edgeWidth: () => 2.6 });
        });
        v.readout(() => {
          const H = ix(G), C = comps(H);
          return `${C.k} component${C.k === 1 ? '' : 's'}: ${C.lists.map((L) => '{' + L.map((u) => H.ids[u]).join(',') + '}').join(' ∪ ')} = V · ${C.k === 1 ? '**connected**' : 'disconnected'}`;
        });
      },
    },
    {
      num: '1.4.1', kind: 'Proposition', name: 'Connected graphs can be built up vertex by vertex',
      statement: String.raw`The vertices of a connected graph $G$ can be enumerated as $v_1,\dots,v_n$ so that $G_i:=G[v_1,\dots,v_i]$ is connected for every $i$.`,
      idea: String.raw`Start with any $v_1$. Given $v_1,\dots,v_i$ with $i<n$, take any vertex $v$ outside $G_i$ and a $v$–$v_1$ path $P$ (it exists since $G$ is connected); the last vertex of $P$ before it enters $G_i$ has a neighbour in $G_i$, so choosing it as $v_{i+1}$ keeps $G_{i+1}$ connected. Induction on $i$ finishes the proof.`,
      caption: String.raw`Step through the enumeration: the built part $G_i$ is blue, the dashed path $P$ runs from an outside vertex to $v_1$, and the gold vertex is the last one of $P$ outside $G_i$ — it becomes $v_{i+1}$. Click a vertex to start from it. Toggle the bridge off: the graph is disconnected and the construction gets stuck.`,
      deps: ['graph-1.4.1a'], see: ['algo-8.3'], refs: ['Diestel §1.4'], tags: ['connectivity', 'induction'],
      viz(v) {
        const s = gstage(v, { height: 320 });
        const G = v.graph(s, { ...fixed({ a: [1.0, 1.0], b: [3.0, 0.7], c: [2.0, 3.0], d: [4.4, 2.6], e: [1.2, 5.4], f: [3.6, 5.2], g: [6.0, 4.6], h: [6.4, 1.6], i: [8.4, 1.0], j: [8.8, 3.6], k: [7.8, 5.8] }, 'ab ac bc cd ce ef fd dg gh hi ij jg gk kj'), r: 14 });
        let v1 = 'e';
        const bridge = v.toggle('bridge $dg$ present', true, { onChange: () => S.reset() });
        G.onClick = ({ node }) => { if (node) { v1 = node.id; S.reset(); } return true; };
        function frames() {
          const H = ix(G, { skipEdge: (e) => !bridge.value && ekey(e.from, e.to) === 'd,g' }), r = H.at(v1), inG = new Set([r]), order = [r], F = [];
          F.push({ inG: new Set(inG), order: order.slice(), P: [], pick: null, note: `$v_1 = ${v1}$; $G_1$ is a single vertex.` });
          while (order.length < H.n) {
            const out = [...Array(H.n).keys()].filter((u) => !inG.has(u)), vv = out[0], P = parPath(bfs(H, vv).par, r);
            if (!P.length || P[0] !== vv) { F.push({ inG: new Set(inG), order: order.slice(), P: [], pick: null, stuck: vv, note: `No path from ${H.ids[vv]} to $v_1$: $G$ is disconnected, so no vertex outside $G_{${order.length}}$ has a neighbour in it — stuck.` }); break; }
            let j = 0; while (j + 1 < P.length && !inG.has(P[j + 1])) j++;
            const pick = P[j];
            F.push({ inG: new Set(inG), order: order.slice(), P: P.map((u) => H.ids[u]), pick: H.ids[pick], note: `Path ${P.map((u) => H.ids[u]).join('')} from ${H.ids[vv]} to $v_1$; its last vertex outside $G_{${order.length}}$ is ${H.ids[pick]}, adjacent to ${H.ids[P[j + 1]]} ∈ $G_{${order.length}}$.` });
            inG.add(pick); order.push(pick);
            F.push({ inG: new Set(inG), order: order.slice(), P: [], pick: null, note: `$v_{${order.length}} = ${H.ids[pick]}$: $G_{${order.length}}$ is connected.` });
          }
          return F.map((f) => ({ ...f, inIds: new Set([...f.inG].map((u) => H.ids[u])), num: new Map(f.order.map((u, i) => [H.ids[u], i + 1])) }));
        }
        const S = v.steps({ frames, speed: 2, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.inIds) return; const P = f.P, onP = new Set(); for (let i = 0; i + 1 < P.length; i++) onP.add(G.edge(P[i], P[i + 1]));
          G.draw({ nodeFill: (id) => (id === f.pick ? 'gold' : f.inIds.has(id) ? 'accent' : null), nodeColor: (id) => (f.stuck != null && !f.inIds.has(id) ? 'red' : null),
            nodeNote: (id) => (f.num.has(id) ? 'v' + f.num.get(id) : null), noteColor: () => 'accent',
            edgeColor: (e) => (onP.has(e) ? 'orange' : f.inIds.has(e.from) && f.inIds.has(e.to) ? 'accent' : null), edgeDash: (e) => onP.has(e) || (!bridge.value && ekey(e.from, e.to) === 'd,g'),
            edgeWidth: (e) => (onP.has(e) ? 3 : f.inIds.has(e.from) && f.inIds.has(e.to) ? 3 : null), dim: bridge.value ? [] : [G.edge('d', 'g')] });
        });
        v.legend([['accent', '$G_i$'], ['orange', 'path $P$ to $v_1$', { dash: true }], ['gold', 'next vertex $v_{i+1}$', { dot: true }]]);
        v.readout(() => { const f = S.frame; return f.inIds ? `$|G_i| = ${f.inIds.size}$ of ${G.nodes.length} · order so far: ${[...f.num.keys()].join(', ')}${f.stuck != null ? ' · **stuck**: the hypothesis "connected" fails' : f.inIds.size === G.nodes.length ? ' · every $G_i$ connected ✓' : ''}` : ''; });
      },
    },
    {
      num: '1.4.1b', kind: 'Definition', name: 'k-connectivity, edge-connectivity and separators', verify: true,
      statement: String.raw`A set $X$ of vertices or edges **separates** $A$ from $B$ if every $A$–$B$ path meets $X$; it is a **separator** of $G$ if it separates two vertices not in $X$. A **cutvertex** separates two vertices of its component, a **bridge** is an edge separating its ends. $G$ is **$k$-connected** if $|G|>k$ and $G-X$ is connected for every $X\subseteq V$ with $|X|<k$; the largest such $k$ is the **connectivity** $\kappa(G)$. $G$ is **$\ell$-edge-connected** if $|G|>1$ and $G-F$ is connected for every edge set $F$ with $|F|<\ell$; the largest such $\ell$ is the **edge-connectivity** $\lambda(G)$.`,
      idea: String.raw`So $\kappa(G)$ is the size of a smallest vertex separator (or $|G|-1$ for complete graphs) and $\lambda(G)$ the size of a smallest disconnecting edge set. Both are computed here by Menger's theorem (Chapter 3): the least number of vertices separating $s$ from $t$ equals the greatest number of independent $s$–$t$ paths, found as a maximum flow.`,
      caption: String.raw`Click vertices or edges to delete them (click again to restore); the remaining components are coloured. The buttons delete a smallest separator or a smallest disconnecting edge set computed by max-flow, so the graph breaks with exactly $\kappa(G)$ or $\lambda(G)$ deletions.`,
      deps: ['graph-1.4.1a'], see: ['algo-8.18'], refs: ['Diestel §1.4'], tags: ['connectivity', 'separators'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [0.9, 1.4], b: [2.6, 0.6], c: [2.6, 3.0], d: [0.9, 4.6], e: [2.8, 5.6], f: [4.6, 2.2], g: [5.4, 4.4], h: [7.2, 1.0], i: [7.4, 3.4], j: [9.2, 2.2], k: [8.8, 5.4], l: [6.6, 5.8] },
          'ab ac bc ad cd de ce bf cf fg eg fh fi gi gl hi hj ij ik jk kl il'), r: 14 });
        let goneV = new Set(), goneE = new Set();
        G.onClick = ({ node, edge }) => { if (node) { goneV.has(node.id) ? goneV.delete(node.id) : goneV.add(node.id); } else if (edge) { goneE.has(edge) ? goneE.delete(edge) : goneE.add(edge); } return true; };
        const base = () => ix(G);
        v.button('Delete a smallest separator', () => { const H = base(), r = kappa(H); goneE.clear(); goneV = new Set(r.sep.map((u) => H.ids[u])); });
        v.button('Delete a smallest edge cut', () => { const H = base(), r = lambda(H); goneV.clear(); goneE = new Set(r.cut.map((k) => H.E[k][2])); });
        v.button('Restore', () => { goneV.clear(); goneE.clear(); });
        const rest = () => { const H = ix(G, { skipNode: (id) => goneV.has(id), skipEdge: (e) => goneE.has(e) }); return { H, C: comps(H) }; };
        v.render(() => {
          const { H, C } = rest();
          G.draw({ nodeFill: (id) => (goneV.has(id) ? null : C.k > 1 ? PALETTE[C.comp[H.at(id)] % 8] : 'accent'), nodeColor: (id) => (goneV.has(id) ? 'red' : null),
            edgeColor: (e) => (goneE.has(e) ? 'red' : null), edgeDash: (e) => goneE.has(e) || goneV.has(e.from) || goneV.has(e.to), dim: [...goneV] });
          s.corner(C.k > 1 ? `disconnected: ${C.k} components` : 'connected', 'tl', { color: C.k > 1 ? 'red' : 'green', weight: 700, size: 13 });
        });
        v.legend([['red', 'deleted', { dash: true }]]);
        const H0 = base(), kp0 = kappa(H0), lm0 = lambda(H0);
        v.readout(() => { const H = base(), kp = kappa(H), lm = lambda(H); return String.raw`$\kappa(G) = ${kp.k}$ (e.g. {${kp.sep.map((u) => H.ids[u]).join(', ')}}) · $\lambda(G) = ${lm.l}$ · deleted ${goneV.size} vertices and ${goneE.size} edges` + (kp0 && lm0 ? '' : ''); });
      },
    },
    {
      num: '1.4.2', kind: 'Proposition', name: 'Connectivity ≤ edge-connectivity ≤ minimum degree',
      statement: String.raw`If $G$ is non-trivial, then $\kappa(G)\le\lambda(G)\le\delta(G)$.`,
      idea: String.raw`The edges at a vertex of minimum degree disconnect it from the rest, so $\lambda\le\delta$. For $\kappa\le\lambda$, take a minimal disconnecting edge set $F$ with $|F|=\lambda$. If some vertex $v$ is incident with no edge of $F$, the ends of $F$ inside the component $C$ of $v$ in $G-F$ separate $v$ from $G-C$, and there are at most $|F|$ of them. Otherwise every vertex meets $F$, and the neighbourhood of any vertex shows $\kappa\le d(v)\le|F|$ unless $G$ is complete, where $\kappa=\lambda=|G|-1$.`,
      caption: String.raw`The three bars show $\kappa\le\lambda\le\delta$ for the graph drawn; red rings mark a smallest separator, dashed red edges a smallest disconnecting edge set, and the gold vertex has minimum degree. Try the presets — the octahedron has all three equal, the other two separate them — or edit (${EDIT}).`,
      deps: ['graph-1.4.1b', 'graph-1.2.1a'], refs: ['Diestel §1.4'], tags: ['connectivity'],
      viz(v) {
        const twoK5 = () => { const nodes = [], edges = [], L = [[0, 1.6], [1.0, 3.0], [1.0, 0.2]], Rr = [[5.4, 1.6], [4.4, 3.0], [4.4, 0.2]], S2 = [[2.7, 2.4], [2.7, 0.8]];
          const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; [...L, ...S2, ...Rr].forEach(([x, y], i) => nodes.push({ id: ids[i], x, y }));
          const A = ['a', 'b', 'c', 'd', 'e'], B = ['d', 'e', 'f', 'g', 'h']; for (const X of [A, B]) for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (!edges.some(([p, q]) => (p === X[i] && q === X[j]))) edges.push([X[i], X[j]]);
          return { nodes, edges: edges.filter(([p, q], i) => edges.findIndex(([r, t]) => r === p && t === q) === i), layout: 'fit' }; };
        const strict = () => ({ ...fixed({ a: [0, 0], b: [0, 2], c: [1.6, 2], d: [1.8, 0.4], e: [3.6, 1.6], f: [3.6, -0.4], g: [5.4, 1.6], h: [5.4, -0.4] }, 'ab ac ad bc bd cd de df ef eg eh fg fh gh'), layout: 'fit' });
        const PRE = { oct: () => named('octahedron'), two: twoK5, strict, pet: () => named('petersen') };
        const pre = v.select('', [{ value: 'oct', label: 'octahedron' }, { value: 'two', label: 'two $K^5$ sharing 2 vertices' }, { value: 'strict', label: '$\\kappa<\\lambda<\\delta$' }, { value: 'pet', label: 'Petersen' }], 'two', { onChange: () => load() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 300, weight: 1.4 });
        const p = v.stage({ x: [-0.6, 2.6], y: [0, 6], axes: 'box', gutter: true, height: 300, xticks: [[0, 'κ'], [1, 'λ'], [2, 'δ']], title: '$\\kappa\\le\\lambda\\le\\delta$' });
        const G = v.graph(s, { nodes: [], edges: [], editable: true, r: 13 });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges }).layout('fit'); }
        load();
        const comp = () => { const H = ix(G), d = degrees(H), kp = kappa(H), lm = lambda(H), del = H.n ? Math.min(...d) : 0; return { H, d, kp, lm, del, vmin: d.indexOf(del) }; };
        v.render(() => {
          const c = comp(), H = c.H; if (!H.n) return; const sep = new Set(c.kp.sep.map((u) => H.ids[u])), cut = eset(H, c.lm.cut);
          G.draw({ nodeRing: (id) => (sep.has(id) ? 'red' : null), nodeFill: (id) => (H.at(id) === c.vmin ? 'gold' : null), edgeColor: (e) => (cut.has(e) ? 'red' : null), edgeDash: (e) => cut.has(e), edgeWidth: (e) => (cut.has(e) ? 3 : null) });
          const vals = [c.kp.k, c.lm.l, c.del]; p.setView([-0.6, 2.6], [0, Math.max(...vals) + 1.5]);
          p.bars(vals, { x0: 0, color: (x, i) => ['red', 'orange', 'gold'][i], fillAlpha: 0.6 });
          vals.forEach((x, i) => p.text(String(x), i, x, { align: 'center', baseline: 'bottom', dy: -4, size: 14, weight: 700 }));
        });
        v.legend([['red', 'smallest separator / edge cut', { dash: true }], ['gold', 'a vertex of minimum degree', { dot: true }]]);
        v.readout(() => { const c = comp(); if (c.H.n < 2) return 'trivial graph'; return String.raw`$\kappa(G) = ${c.kp.k} \le \lambda(G) = ${c.lm.l} \le \delta(G) = ${c.del}$ ${c.kp.k <= c.lm.l && c.lm.l <= c.del ? '✓' : '✗'}${c.kp.k < c.lm.l && c.lm.l < c.del ? ' — both strict' : c.kp.k === c.del ? ' — all equal' : ''}`; });
      },
    },
    {
      num: '1.4.3', kind: 'Theorem', name: 'Mader: high average degree forces a k-connected subgraph', credit: 'Mader, 1972',
      statement: String.raw`Let $0\ne k\in\mathbb N$. Every graph $G$ with $d(G)\ge4k$ has a $(k+1)$-connected subgraph $H$ with $\varepsilon(H)>\varepsilon(G)-k$ (equivalently $d(H)>d(G)-2k$); in particular $G$ has a $k$-connected subgraph.`,
      idea: String.raw`Put $\gamma:=\varepsilon(G)\ge2k$ and consider the subgraphs $G'$ with $|G'|\ge2k$ and $\|G'\|>\gamma(|G'|-k)$; $G$ is one, so let $H$ be one of smallest order. Minimality forces $\delta(H)>\gamma$ (deleting a vertex of degree $\le\gamma$ would keep the inequality), and dividing gives $\varepsilon(H)>\gamma-k$. If $H$ had a separation $\{U_1,U_2\}$ of order $\le k$, both sides would be smaller graphs failing the inequality, and adding their edge counts would contradict it for $H$.`,
      caption: String.raw`Set $k$ and press **Resample** for a random graph with $d(G)\ge4k$. The app searches all vertex subsets for a smallest $G'$ satisfying Mader's inequality $\|G'\|>\gamma(|G'|-k)$; that $H$ (green) is checked to be $(k+1)$-connected, with its minimum separator size shown. Delete edges (${EDIT}) to push $d(G)$ below $4k$.`,
      deps: ['graph-1.2.2', 'graph-1.4.1b'], refs: ['Diestel §1.4'], tags: ['connectivity', 'extremal'],
      viz(v) {
        const kS = v.slider('$k$', 1, 2, 1, { int: true, onChange: () => resample() });
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], editable: true, r: 12 });
        let seed = 4;
        function resample() {
          const k = kS.value, n = k === 1 ? 12 : 15, r = v.rng(seed * 7 + k), nodes = [], edges = [];
          for (let i = 0; i < n; i++) nodes.push({ id: 'abcdefghijklmnopq'[i] });
          // a denser cluster plus sparse periphery, then top up to d(G) ≥ 4k
          const pin = k === 1 ? 0.62 : 0.85, pout = k === 1 ? 0.18 : 0.42, core = Math.ceil(n * 0.55);
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < (i < core && j < core ? pin : pout)) edges.push([nodes[i].id, nodes[j].id]);
          for (let t = 0; t < 400 && (2 * edges.length) / n < 4 * k; t++) { const i = r.int(0, n - 1), j = r.int(0, n - 1); if (i !== j && !edges.some(([a, b]) => ekey(a, b) === ekey(nodes[i].id, nodes[j].id))) edges.push([nodes[i].id, nodes[j].id]); }
          G.set({ nodes, edges }).layout('force', { seed: 3 });
        }
        resample();
        v.button('Resample', () => { seed++; resample(); });
        let memo = { key: '', res: null };
        const solve = () => {
          const key = kS.value + '|' + G.nodes.map((n) => n.id).join('') + '|' + G.edges.map((e) => e.from + e.to).join(',');
          if (memo.key === key) return memo.res;
          const H = ix(G), n = H.n, k = kS.value, gam = H.m / Math.max(1, n), A = new Array(n).fill(0);
          H.E.forEach(([a, b]) => { A[a] |= 1 << b; A[b] |= 1 << a; });
          const pc = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
          let best = -1, bs = Infinity;
          for (let mask = 1; mask < 1 << n; mask++) {
            const sz = pc(mask); if (sz < 2 * k || sz >= bs) continue;
            let e2 = 0; for (let u = 0; u < n; u++) if (mask & (1 << u)) e2 += pc(A[u] & mask);
            if (e2 / 2 > gam * (sz - k) + 1e-9) { best = mask; bs = sz; }
          }
          let res = { H, gam, k, mask: best, ids: new Set() };
          if (best >= 0) {
            const ids = new Set(H.ids.filter((_, u) => best & (1 << u))), Hs = ix(G, { skipNode: (id) => !ids.has(id) }), kp = kappa(Hs);
            res = { ...res, ids, sub: Hs, kap: kp.k, epsH: Hs.m / Hs.n };
          }
          memo = { key, res }; return res;
        };
        v.render(() => {
          const r = solve(), inH = (id) => r.ids.has(id);
          G.draw({ nodeFill: (id) => (inH(id) ? 'green' : null), edgeColor: (e) => (inH(e.from) && inH(e.to) ? 'green' : null), edgeWidth: (e) => (inH(e.from) && inH(e.to) ? 2.6 : 1.2), dim: G.nodes.filter((n) => !inH(n.id)).map((n) => n.id) });
        });
        v.legend([['green', 'smallest $G\'$ with $\\|G\'\\|>\\gamma(|G\'|-k)$: the subgraph $H$']]);
        v.readout(() => {
          const r = solve(), dG = (2 * r.H.m) / r.H.n, hyp = dG >= 4 * r.k;
          if (r.mask < 0) return String.raw`$d(G) = ${fmt2(dG)}$ ${hyp ? '' : `< 4k = ${4 * r.k}$ (hypothesis fails) $`} · no subgraph satisfies Mader's inequality`;
          return String.raw`$d(G) = ${fmt2(dG)} ${hyp ? '\ge' : '<'} 4k = ${4 * r.k}$${hyp ? '' : ' (hypothesis fails)'} · $H$: $|H| = ${r.sub.n}$, $\kappa(H) = ${r.kap} ${r.kap >= r.k + 1 ? '\ge' : '<'} k+1 = ${r.k + 1}$ ${r.kap >= r.k + 1 ? '✓' : '✗'}, $\varepsilon(H) = ${fmt2(r.epsH)} > \varepsilon(G) - k = ${fmt2(r.gam - r.k)}$ ${r.epsH > r.gam - r.k ? '✓' : '✗'}`;
        });
      },
    },
    // ================================================================== 1.5 Trees and forests
    {
      num: '1.5.1a', kind: 'Definition', name: 'Trees, forests and leaves', verify: true,
      statement: String.raw`An **acyclic** graph, one containing no cycle, is a **forest**; a connected forest is a **tree**, so a forest is a graph whose components are trees. The vertices of degree $1$ in a tree are its **leaves**, the others its **inner vertices**. Every non-trivial tree has at least two leaves, for instance the ends of a longest path, and deleting a leaf from a tree leaves a tree.`,
      idea: String.raw`If $x_0\dots x_k$ is a longest path in a tree, every neighbour of $x_k$ lies on the path; a neighbour other than $x_{k-1}$ would close a cycle. So $x_k$ (and likewise $x_0$) is a leaf. This is the standard start of inductions on trees: remove a leaf, apply the hypothesis, put the leaf back.`,
      caption: String.raw`Build a graph edge by edge (${EDIT}). Edges lying on a cycle turn red; while there are none the graph is a forest, and a tree when it is also connected. Leaves are drawn hollow, inner vertices filled.`,
      deps: ['graph-1.4.1a', 'graph-1.3.1a'], refs: ['Diestel §1.5'], tags: ['trees'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [1.0, 3.0], b: [2.6, 1.4], c: [2.6, 4.6], d: [4.4, 3.0], e: [4.0, 0.8], f: [6.4, 1.2], g: [7.8, 2.8], h: [9.2, 1.4], i: [7.4, 5.0], j: [9.2, 4.6], k: [5.4, 5.6] }, 'ab ac ad be fg gh gi ij dk'), editable: true, r: 14 });
        v.render(() => {
          const H = ix(G), d = degrees(H), br = bridges(H), cyc = eset(H, [...Array(H.m).keys()].filter((k) => !br.has(k))), C = comps(H);
          G.draw({ nodeFill: (id) => (d[H.at(id)] >= 2 ? PALETTE[C.comp[H.at(id)] % 8] : null), nodeColor: (id) => PALETTE[C.comp[H.at(id)] % 8],
            edgeColor: (e) => (cyc.has(e) ? 'red' : PALETTE[C.comp[H.at(e.from)] % 8]), edgeWidth: (e) => (cyc.has(e) ? 3.6 : 2.4) });
          const forest = cyc.size === 0, tree = forest && C.k === 1;
          s.corner(tree ? 'a tree' : forest ? `a forest of ${C.k} trees` : 'contains a cycle', 'tl', { color: tree || forest ? 'green' : 'red', weight: 700, size: 13 });
        });
        v.legend([['red', 'edge on a cycle'], ['muted', 'hollow = leaf', { dot: true }]]);
        v.readout(() => {
          const H = ix(G), d = degrees(H), br = bridges(H), C = comps(H), leaves = H.ids.filter((_, u) => d[u] === 1);
          return `${C.k} component(s), ${H.m - br.size} edges on cycles · ${br.size === H.m ? (C.k === 1 ? '**tree**' : '**forest**') : 'not a forest'} · leaves: ${leaves.join(', ') || 'none'}`;
        });
      },
    },
    {
      num: '1.5.1', kind: 'Theorem', name: 'Equivalent characterisations of trees',
      statement: String.raw`For a graph $T$ the following are equivalent:

(i) $T$ is a tree;

(ii) any two vertices of $T$ are linked by a unique path in $T$;

(iii) $T$ is minimally connected: $T$ is connected but $T-e$ is disconnected for every edge $e$;

(iv) $T$ is maximally acyclic: $T$ contains no cycle, but $T+xy$ does for any two non-adjacent vertices $x,y$.`,
      idea: String.raw`Two different $x$–$y$ paths together contain a cycle, and a cycle gives two paths between any two of its vertices; so (i)⇔(ii). An edge $e=xy$ disconnects $T$ exactly when $xy$ is the only $x$–$y$ path, giving (ii)⇔(iii). And $T+xy$ has a new cycle exactly when $T$ already contains an $x$–$y$ path, giving (ii)⇔(iv). The unique path in a tree is written $xTy$.`,
      caption: String.raw`The four tests run on the graph you edit (${EDIT}) and pass or fail together. The picture shows a witness for the condition you select: the path between two vertices, the two sides left after deleting an edge, or the cycle created by adding a non-edge — or, when the graph is not a tree, the pair with no or two paths, the non-bridge, or the existing cycle. **Next witness** cycles through examples.`,
      deps: ['graph-1.5.1a'], refs: ['Diestel §1.5'], tags: ['trees'],
      viz(v) {
        const which = v.select('witness for', [{ value: '2', label: '(ii) unique path' }, { value: '3', label: '(iii) minimally connected' }, { value: '4', label: '(iv) maximally acyclic' }], '2');
        const s = gstage(v, { height: 320 });
        const G = v.graph(s, { ...fixed({ a: [1.0, 1.0], b: [3.0, 1.6], c: [1.6, 4.2], d: [5.0, 3.0], e: [4.4, 0.6], f: [7.0, 1.4], g: [6.8, 4.6], h: [9.0, 3.0], i: [4.2, 5.6], j: [9.2, 5.6] }, 'ab bc bd de df dg gh gi hj'), editable: true, r: 14 });
        let idx = 0; v.button('Next witness', () => idx++);
        const analyse = () => {
          const H = ix(G), C = comps(H), br = bridges(H), conn = C.k === 1 && H.n > 0, acyc = br.size === H.m;
          // witnesses
          const nonE = []; for (let a = 0; a < H.n; a++) for (let b = a + 1; b < H.n; b++) if (!H.adj[a].some(([w]) => w === b)) nonE.push([a, b]);
          return { H, C, br, conn, acyc, tree: conn && acyc, nonE };
        };
        v.render(() => {
          const A = analyse(), H = A.H; if (!H.n) return; let hiE = new Set(), hiE2 = new Set(), ring = new Set(), cols = null, note = '';
          if (which.value === '2') {
            if (!A.conn) { const x = A.C.lists[0][0], y = A.C.lists[1][0]; ring = new Set([H.ids[x], H.ids[y]]); note = `${H.ids[x]} and ${H.ids[y]}: no path`; }
            else if (!A.acyc) { const ks = [...Array(H.m).keys()].filter((k) => !A.br.has(k)), k = ks[idx % ks.length], [x, y] = H.E[k]; const P2 = parPath(bfs(H, x, null, (kk) => kk !== k).par, y); hiE = eset(H, [k]); hiE2 = eset(H, pathEdges(H, P2)); ring = new Set([H.ids[x], H.ids[y]]); note = `${H.ids[x]} and ${H.ids[y]}: two paths`; }
            else { const pairs = []; for (let a = 0; a < H.n; a++) for (let b = a + 1; b < H.n; b++) pairs.push([a, b]); const [x, y] = pairs[(idx * 7) % pairs.length]; const T = spanTree(H, x); hiE = eset(H, pathEdges(H, treePath(T, x, y))); ring = new Set([H.ids[x], H.ids[y]]); note = `the unique path ${H.ids[x]}T${H.ids[y]}`; }
          } else if (which.value === '3') {
            if (!A.conn) { cols = A.C; note = 'already disconnected'; }
            else if (!A.acyc) { const ks = [...Array(H.m).keys()].filter((k) => !A.br.has(k)); const k = ks[idx % ks.length]; hiE = eset(H, [k]); note = `T − ${H.ids[H.E[k][0]]}${H.ids[H.E[k][1]]} is still connected`; }
            else if (H.m) { const k = idx % H.m; hiE2 = eset(H, [k]); cols = comps(H, null, (kk) => kk !== k); note = `T − ${H.ids[H.E[k][0]]}${H.ids[H.E[k][1]]} falls into two parts`; }
          } else {
            if (!A.acyc) { const ks = [...Array(H.m).keys()].filter((k) => !A.br.has(k)), k = ks[idx % ks.length], [x, y] = H.E[k]; hiE = eset(H, [k, ...pathEdges(H, parPath(bfs(H, x, null, (kk) => kk !== k).par, y))]); note = 'T already contains a cycle'; }
            else if (A.nonE.length) {
              const [x, y] = A.nonE[idx % A.nonE.length]; ring = new Set([H.ids[x], H.ids[y]]);
              if (A.C.comp[x] !== A.C.comp[y]) note = `adding ${H.ids[x]}${H.ids[y]} creates no cycle`;
              else { hiE = eset(H, pathEdges(H, treePath(spanTree(H, x), x, y))); note = `T + ${H.ids[x]}${H.ids[y]} has exactly one cycle`; }
              v._extra = [H.ids[x], H.ids[y]];
            }
          }
          const ex = which.value === '4' && A.acyc && A.nonE.length ? (() => { const [x, y] = A.nonE[idx % A.nonE.length]; return [H.ids[x], H.ids[y]]; })() : null;
          if (ex) { const p = G.node(ex[0]), q = G.node(ex[1]); s.line(p.x, p.y, q.x, q.y, { color: A.C.comp[H.at(ex[0])] === A.C.comp[H.at(ex[1])] ? 'orange' : 'red', width: 3, dash: [6, 4] }); }
          G.draw({ nodeRing: (id) => (ring.has(id) ? 'gold' : null), nodeFill: (id) => (cols ? PALETTE[cols.comp[H.at(id)] % 8] : null),
            edgeColor: (e) => (hiE.has(e) ? (A.tree ? 'orange' : 'red') : hiE2.has(e) ? (A.tree ? 'red' : 'purple') : null), edgeWidth: (e) => (hiE.has(e) || hiE2.has(e) ? 4 : null), edgeDash: (e) => hiE2.has(e) && A.tree });
          s.corner(note, 'bl', { color: 'ink', weight: 600 });
        });
        v.readout(() => {
          const A = analyse(), H = A.H; if (!H.n) return '';
          let uniq = true; if (!A.tree) uniq = false;
          const minC = A.conn && A.br.size === H.m, maxA = A.acyc && A.nonE.every(([x, y]) => A.C.comp[x] === A.C.comp[y]);
          const b = (t) => (t ? '✓' : '✗');
          return `(i) tree ${b(A.tree)} · (ii) unique paths ${b(uniq)} · (iii) minimally connected ${b(minC)} · (iv) maximally acyclic ${b(maxA)} — ${A.tree === minC && minC === maxA ? 'all agree' : 'disagree?!'}`;
        });
      },
    },
    {
      num: '1.5.2', kind: 'Corollary', name: 'Connected with n vertices: a tree iff n − 1 edges',
      statement: String.raw`A connected graph with $n$ vertices is a tree if and only if it has $n-1$ edges.`,
      idea: String.raw`Enumerate a tree as in 1.4.1, each $G_i$ connected: since the tree is acyclic, every vertex after $v_1$ has exactly one neighbour among the earlier ones, so each step adds exactly one edge — $n-1$ in all. Conversely a connected graph with $n-1$ edges contains a spanning tree (a minimal connected spanning subgraph, 1.5.1(iii)), which already has $n-1$ edges, so it is the whole graph.`,
      caption: String.raw`Vertices are numbered in a 1.4.1-style enumeration; each vertex after the first has one green edge back to an earlier vertex, and any further back-edges are orange — each one is an edge beyond $n-1$ and closes a cycle. Edit the graph (${EDIT}): the tree badge lights exactly when $m=n-1$, provided the graph is connected — a triangle plus an isolated vertex has $m=n-1$ too.`,
      deps: ['graph-1.5.1', 'graph-1.4.1'], refs: ['Diestel §1.5'], tags: ['trees', 'counting'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [1.0, 3.0], b: [2.8, 1.2], c: [2.8, 4.8], d: [4.8, 3.0], e: [6.6, 1.2], f: [6.6, 4.8], g: [8.4, 3.0], h: [9.4, 5.4] }, 'ab ac ad de df fg gh eg'), editable: true, r: 14 });
        v.render(() => {
          const H = ix(G); if (!H.n) return; const C = comps(H), num = new Array(H.n).fill(-1); let t = 0;
          for (const L of C.lists) for (const u of bfs(H, L[0]).order) num[u] = t++;
          const kind = new Map(); for (let u = 0; u < H.n; u++) { const back = H.adj[u].filter(([w]) => num[w] < num[u]).sort((p, q) => num[p[0]] - num[q[0]]); back.forEach(([, k], i) => kind.set(H.E[k][2], i === 0 ? 'tree' : 'extra')); }
          G.draw({ nodeLabel: (id) => String(num[H.at(id)] + 1), nodeNote: (id) => id, noteColor: () => 'muted',
            edgeColor: (e) => (kind.get(e) === 'extra' ? 'orange' : 'green'), edgeWidth: (e) => (kind.get(e) === 'extra' ? 3.4 : 2.6), edgeDash: (e) => kind.get(e) === 'extra' });
          const tree = C.k === 1 && H.m === H.n - 1;
          s.corner(tree ? 'TREE' : C.k > 1 ? 'not connected' : 'not a tree', 'tl', { color: tree ? 'green' : 'red', weight: 800, size: 14 });
        });
        v.legend([['green', 'first back-edge of each vertex'], ['orange', 'extra back-edge', { dash: true }]]);
        v.readout(() => { const H = ix(G), C = comps(H); return `$n = ${H.n}$, $m = ${H.m}$, $n - 1 = ${H.n - 1}$ · ${C.k === 1 ? 'connected' : `${C.k} components (hypothesis fails)`} · ${C.k === 1 ? (H.m === H.n - 1 ? '$m = n-1$ ⇔ **tree** ✓' : `$m > n-1$: ${H.m - H.n + 1} extra edge(s), so cycles`) : H.m === H.n - 1 ? '$m = n - 1$ but not a tree' : ''}`; });
      },
    },
    {
      num: '1.5.3', kind: 'Corollary', name: 'Minimum degree at least t − 1 contains every tree of order t',
      statement: String.raw`If $T$ is a tree and $G$ is any graph with $\delta(G)\ge|T|-1$, then $T$ is isomorphic to a subgraph of $G$.`,
      idea: String.raw`Enumerate $T$ as $t_1,\dots,t_n$ with each $t_i$ ($i\ge2$) adjacent to exactly one earlier vertex, its parent (1.4.1). Map the vertices one at a time: when $t_i$ is to be placed, its parent's image has at least $\delta(G)\ge n-1$ neighbours, of which at most $i-2\le n-2$ are already used, so a free neighbour always exists.`,
      caption: String.raw`Pick a tree $T$ (left) and step through the greedy embedding into $G$ (right): the gold vertex is the next one, mapped to a free neighbour (orange ring) of its parent's image. Delete edges of $G$ (${EDIT}) to push $\delta(G)$ below $|T|-1$, or choose the 6-vertex spider: the greedy embedding can then get stuck.`,
      deps: ['graph-1.5.1a', 'graph-1.4.1'], refs: ['Diestel §1.5'], tags: ['trees', 'embedding'],
      viz(v) {
        const TREES = { path: [[0, 1], [1, 2], [2, 3], [3, 4]], star: [[0, 1], [0, 2], [0, 3], [0, 4]], chair: [[0, 1], [1, 2], [1, 3], [3, 4]], spider: [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5]] };
        const tsel = v.select('$T$ =', [{ value: 'path', label: 'path $P^4$' }, { value: 'star', label: 'star $K_{1,4}$' }, { value: 'chair', label: 'chair' }, { value: 'spider', label: 'spider (order 6)' }], 'chair', { onChange: () => { setT(); S.reset({ at: 'end' }); } });
        const L = v.stage({ x: [0, 4], y: [0, 4], axes: false, equal: true, height: 290, weight: 0.6, title: '$T$' });
        const R = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 290, title: '$G$: circulant $C_{10}(1,2)$, $\\delta = 4$' });
        const TG = v.graph(L, { nodes: [], edges: [], r: 13, draggable: false });
        const GG = v.graph(R, { nodes: [...Array(10)].map((_, i) => ({ id: 'g' + i, label: String(i), x: Math.cos(Math.PI / 2 - (i * 2 * Math.PI) / 10), y: Math.sin(Math.PI / 2 - (i * 2 * Math.PI) / 10) })),
          edges: [...Array(10)].flatMap((_, i) => [['g' + i, 'g' + ((i + 1) % 10)], ['g' + i, 'g' + ((i + 2) % 10)]]), layout: 'fit', editable: true, r: 13 });
        function setT() { const E = TREES[tsel.value], n = E.length + 1; TG.set({ nodes: [...Array(n)].map((_, i) => ({ id: 't' + i, label: 'abcdef'[i] })), edges: E.map(([a, b]) => ['t' + a, 't' + b]) }).layout('tree', { root: 't0' }); }
        setT();
        function frames() {
          const HT = ix(TG), HG = ix(GG), order = bfs(HT, 0), F = [], phi = new Map(), used = new Set();
          phi.set(0, 0); used.add(0);
          F.push({ phi: new Map(phi), cur: 0, note: `Map ${TG.lab('t0')} to vertex 0.` });
          for (const t of order.order.slice(1)) {
            const p = order.par[t], img = phi.get(p), free = HG.adj[img].map(([w]) => w).filter((w) => !used.has(w)).sort((a, b) => a - b);
            if (!free.length) { F.push({ phi: new Map(phi), cur: t, stuck: img, cand: [], note: `The image ${HG.ids[img].slice(1)} of ${TG.lab(HT.ids[p])} has no free neighbour: **stuck**.` }); break; }
            phi.set(t, free[0]); used.add(free[0]);
            F.push({ phi: new Map(phi), cur: t, par: img, cand: free, note: `${TG.lab(HT.ids[t])}: its parent ${TG.lab(HT.ids[p])} sits at ${HG.ids[img].slice(1)}, which has ${HG.adj[img].length} neighbours, ${HG.adj[img].length - free.length} used — take ${HG.ids[free[0]].slice(1)}.` });
          }
          return F.map((f) => ({ ...f, img: new Map([...f.phi].map(([t, g]) => [HG.ids[g], TG.lab(HT.ids[t])])), tIds: new Set([...f.phi.keys()].map((t) => HT.ids[t])), curId: HT.ids[f.cur], candIds: new Set((f.cand || []).map((g) => HG.ids[g])), parId: f.par != null ? HG.ids[f.par] : null }));
        }
        const S = v.steps({ frames, speed: 1.5, start: 'end', still: 'end' });
        GG.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.img) return;
          const HT = ix(TG), inv = new Map([...f.img].map(([g, lab]) => [lab, g]));
          TG.draw({ nodeFill: (id) => (id === f.curId ? 'gold' : f.tIds.has(id) ? 'accent' : null), edgeColor: (e) => (f.tIds.has(e.from) && f.tIds.has(e.to) ? 'accent' : null), edgeWidth: () => 3 });
          const imgE = new Set(); for (const [a, b] of HT.E) { const ga = inv.get(TG.lab(HT.ids[a])), gb = inv.get(TG.lab(HT.ids[b])); if (ga && gb) imgE.add(ekey(ga, gb)); }
          GG.draw({ nodeLabel: (id) => f.img.get(id) ?? id.slice(1), nodeFill: (id) => (f.img.has(id) ? (f.img.get(id) === TG.lab(f.curId) && f.stuck == null ? 'gold' : 'accent') : null), nodeRing: (id) => (f.candIds.has(id) ? 'orange' : f.parId === id ? 'ink' : null),
            nodeColor: (id) => (f.stuck != null && GG.node(id) && ix(GG).at(id) === f.stuck ? 'red' : null), edgeColor: (e) => (imgE.has(ekey(e.from, e.to)) ? 'accent' : null), edgeWidth: (e) => (imgE.has(ekey(e.from, e.to)) ? 3.4 : 1.4) });
        });
        v.legend([['accent', 'embedded'], ['gold', 'placed now', { dot: true }], ['orange', 'free neighbours of the parent\'s image', { dot: true }]]);
        v.readout(() => { const HG = ix(GG), d = Math.min(...degrees(HG)), t = TG.nodes.length, f = S.frame; return String.raw`$\delta(G) = ${d} ${d >= t - 1 ? '\ge' : '<'} |T| - 1 = ${t - 1}$${d >= t - 1 ? '' : ' (hypothesis fails)'} · embedded ${f.img ? f.img.size : 0} of ${t}${f.stuck != null ? ' — **stuck**' : f.img && f.img.size === t ? ' — $T\\subseteq G$ ✓' : ''}`; });
      },
    },
    {
      num: '1.5.3a', kind: 'Definition', name: 'Rooted trees, tree-order and normal trees', verify: true,
      statement: String.raw`A tree $T$ with a fixed vertex $r$, its **root**, is a **rooted tree**. Writing $x\le y$ when $x$ lies on the path $rTy$ defines a partial order on $V(T)$, the **tree-order**: the root is its least element, the leaves are maximal, the **down-closure** $\lceil y\rceil=\{x: x\le y\}$ of every vertex is a chain, and the vertices at distance $k$ from $r$ form the $k$-th **level**. A rooted tree $T\subseteq G$ is **normal** in $G$ if the ends of every $T$-path in $G$ are comparable; for a spanning tree this means that any two vertices adjacent in $G$ are comparable in the tree-order.`,
      idea: String.raw`In a normal spanning tree every edge of $G$ runs "vertically", between a vertex and one of its ancestors, never across between two branches. That is what makes such trees a tool for reading off the separation structure of $G$ (1.5.4); depth-first search produces them, breadth-first search usually does not.`,
      caption: String.raw`Choose how the spanning tree $T$ (green) is grown and click a vertex to make it the root. The right panel redraws $G$ with $T$ laid out by levels: edges of $G$ between incomparable vertices are red, so $T$ is normal exactly when there is no red edge. DFS trees are always normal; BFS trees rarely are.`,
      deps: ['graph-1.5.1a'], refs: ['Diestel §1.5'], tags: ['trees', 'normal trees'],
      viz(v) {
        const kind = v.select('grow $T$ by', [{ value: 'dfs', label: 'depth-first search' }, { value: 'bfs', label: 'breadth-first search' }, { value: 'random', label: 'random' }], 'bfs');
        const A = gstage(v, { height: 300, title: '$G$ and the spanning tree $T$' });
        const B = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 300, title: '$T$ by levels, with the other edges of $G$' });
        const G = v.graph(A, { ...NT(), r: 13 });
        const G2 = v.graph(B, { nodes: [], edges: [], r: 12, draggable: false });
        let root = 'a', last = '';
        G.onClick = ({ node }) => { if (node) root = node.id; return true }; G2.onClick = ({ node }) => { if (node) root = node.id; return true; };
        const comp = () => { const H = ix(G), T = spanTree(H, H.at(root), kind.value, v.rng(5)); const bad = new Set(); H.E.forEach(([a, b], k) => { if (!T.inT[k] && !comparable(T, a, b)) bad.add(k); }); return { H, T, bad }; };
        v.render(() => {
          const { H, T, bad } = comp(), badE = eset(H, [...bad]), tE = eset(H, [...Array(H.m).keys()].filter((k) => T.inT[k]));
          G.draw({ nodeFill: (id) => (id === root ? 'ink' : null), edgeColor: (e) => (tE.has(e) ? 'green' : badE.has(e) ? 'red' : null), edgeWidth: (e) => (tE.has(e) ? 3.4 : badE.has(e) ? 2.4 : 1.4), edgeDash: (e) => badE.has(e) });
          const key = root + kind.value; if (key !== last) { last = key; const P = treeLayout(v, B, H, T, H.at(root)); G2.set({ nodes: H.ids.map((id) => ({ id, x: P.get(K(id))[0], y: P.get(K(id))[1] })), edges: H.E.map(([a, b]) => ({ from: H.ids[a], to: H.ids[b] })) }); }
          const H2 = ix(G2); G2.edges.forEach((e) => { const k = H2.eix.get(e); e.bend = T.inT[k] ? 0 : 22; });
          G2.draw({ nodeFill: (id) => (id === root ? 'ink' : null), nodeNote: (id) => 'h' + T.depth[H.at(id)], noteColor: () => 'muted', notePos: 'e',
            edgeColor: (e) => { const k = H2.eix.get(e); return T.inT[k] ? 'green' : bad.has(k) ? 'red' : 'muted'; }, edgeWidth: (e) => (T.inT[H2.eix.get(e)] ? 3.2 : 1.6), edgeDash: (e) => !T.inT[H2.eix.get(e)] });
        });
        v.legend([['green', 'tree edge'], ['muted', 'edge of $G$ between comparable vertices', { dash: true }], ['red', 'edge between incomparable vertices', { dash: true }]]);
        v.readout(() => { const { H, bad } = comp(); return `root ${root}, ${H.m - H.n + 1} non-tree edges, ${bad.size} between incomparable vertices · $T$ is ${bad.size ? '**not normal**' : '**normal** in $G$ ✓'}`; });
      },
    },
    {
      num: '1.5.4', kind: 'Lemma', name: 'Separation properties of normal trees',
      statement: String.raw`Let $T$ be a normal tree in $G$.

(i) Any two vertices $x,y$ of $T$ that are incomparable in the tree-order are separated in $G$ by the set $\lceil x\rceil\cap\lceil y\rceil$.

(ii) If $V(T)=V(G)=:V$ and $S\subseteq V$ is down-closed, then the components of $G-S$ are spanned by the sets $\lfloor x\rfloor$ with $x$ minimal in $V\setminus S$.`,
      idea: String.raw`(i) Follow any $x$–$y$ path $P$ and record the vertices of $T$ on it; consecutive ones are comparable, because each stretch between them is a tree edge or a $T$-path. A shortest such comparable chain from $x$ to $y$ must first go down and then up, so its lowest member lies below both $x$ and $y$: it is in $\lceil x\rceil\cap\lceil y\rceil$. (ii) Each up-closure $\lfloor x\rfloor$ is connected in $T$; for distinct minimal $x,x'$ the set $\lceil x\rceil\cap\lceil x'\rceil\subseteq S$ separates them by (i), so these sets are exactly the components of $G-S$.`,
      caption: String.raw`$G$ is drawn along a DFS (hence normal) spanning tree. In mode (i), click two incomparable vertices: the gold set $\lceil x\rceil\cap\lceil y\rceil$ is removed and the components of what remains are coloured — $x$ and $y$ always end up apart. In mode (ii), the slider cuts off the down-closed set $S$ of the lowest levels; the components of $G-S$ coincide with the up-closures of the minimal vertices above $S$.`,
      deps: ['graph-1.5.3a'], refs: ['Diestel §1.5'], tags: ['trees', 'normal trees', 'separation'],
      viz(v) {
        const mode = v.select('', [{ value: '1', label: '(i) separate two vertices' }, { value: '2', label: '(ii) down-closed S' }], '1');
        const hS = v.slider('levels in $S$', 1, 4, 2, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 360 });
        const base = NT(), H0 = ix(base), T = spanTree(H0, 0, 'dfs');
        const G = v.graph(s, { nodes: [], edges: [], r: 13 });
        const P = treeLayout(v, s, H0, T, 0);
        G.set({ nodes: H0.ids.map((id) => ({ id, x: P.get(K(id))[0], y: P.get(K(id))[1] })), edges: H0.E.map(([a, b], k) => ({ from: H0.ids[a], to: H0.ids[b], bend: T.inT[k] ? 0 : 22 })) });
        let pick = ['h', 'l'];
        G.onClick = ({ node }) => { if (node && mode.value === '1') { pick = [pick[1], node.id]; } return true; };
        const comp = () => {
          const at = (id) => H0.at(id);
          if (mode.value === '1') {
            const [x, y] = pick.map(at), inc = !comparable(T, x, y);
            const Sx = new Set(); for (let u = x; u !== -1; u = T.par[u]) if (below(T, u, y)) Sx.add(u);
            const C = comps(H0, (u) => !Sx.has(u));
            return { S: Sx, C, inc, x, y };
          }
          const Sx = new Set(H0.ids.map((_, u) => u).filter((u) => T.depth[u] < hS.value)), C = comps(H0, (u) => !Sx.has(u));
          const mins = [...Array(H0.n).keys()].filter((u) => !Sx.has(u) && (T.par[u] === -1 || Sx.has(T.par[u])));
          const ok = mins.every((x) => { const up = new Set([...Array(H0.n).keys()].filter((w) => below(T, x, w))); const L = C.lists[C.comp[x]]; return L.length === up.size && L.every((w) => up.has(w)); });
          return { S: Sx, C, mins, ok };
        };
        v.render(() => {
          hS.el.hidden = mode.value !== '2';
          const c = comp(), tE = new Set(G.edges.filter((e) => !e.bend));
          G.draw({ nodeFill: (id) => (c.S.has(H0.at(id)) ? 'gold' : PALETTE[c.C.comp[H0.at(id)] % 8]), nodeRing: (id) => (mode.value === '1' ? (pick.includes(id) ? 'ink' : null) : c.mins.includes(H0.at(id)) ? 'ink' : null),
            nodeNote: (id) => (mode.value === '1' && pick.includes(id) ? (id === pick[0] ? 'x' : 'y') : null), noteColor: () => 'ink', notePos: 'e',
            edgeColor: (e) => (c.S.has(H0.at(e.from)) || c.S.has(H0.at(e.to)) ? 'faint' : tE.has(e) ? 'green' : 'muted'), edgeWidth: (e) => (tE.has(e) ? 3 : 1.5), edgeDash: (e) => !tE.has(e) });
          if (mode.value === '2') { const yv = G.nodes.find((n) => T.depth[H0.at(n.id)] === hS.value - 1); if (yv) s.hline(yv.y - 0.55, { color: 'gold', dash: [6, 4], width: 1.5 }); }
        });
        v.legend([['gold', 'the separating set $S$', { dot: true }], ['green', 'normal spanning tree (DFS)'], ['muted', 'other edges of $G$', { dash: true }]]);
        v.readout(() => {
          const c = comp(), nm = (S) => [...S].map((u) => H0.ids[u]).join(', ');
          if (mode.value === '1') { if (!c.inc) return `${pick[0]} and ${pick[1]} are comparable — pick two vertices in different branches.`; return String.raw`$\lceil ${pick[0]}\rceil\cap\lceil ${pick[1]}\rceil = \{${nm(c.S)}\}$ · in $G - S$: ${pick[0]} and ${pick[1]} lie in ${c.C.comp[c.x] !== c.C.comp[c.y] ? '**different components** ✓' : 'the same component ✗'}`; }
          return String.raw`$S$ = levels below ${hS.value} = {${nm(c.S)}} · $G - S$ has ${c.C.k} components; minimal vertices of $V\setminus S$: ${c.mins.map((u) => H0.ids[u]).join(', ')} · components $= \lfloor x\rfloor$: ${c.ok ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '1.5.5', kind: 'Proposition', name: 'Every connected graph has a normal spanning tree',
      statement: String.raw`Every connected graph has a normal spanning tree.`,
      idea: String.raw`Take a maximal normal tree $T$ in $G$ and suppose it misses a component $C$ of $G-T$. Normality makes the neighbourhood $N(C)$ a chain in $T$; let $x$ be its greatest element and $y\in C$ a neighbour of $x$. Attaching $y$ to $x$ gives a larger tree $T'$, still normal: a new $T'$-path ends at $y$ and at some $z\in N(C)$, and $z\le x<y$. So $T$ was not maximal. Depth-first search builds such trees directly — this is why normal spanning trees are also called DFS trees.`,
      caption: String.raw`Step through the proof's construction from the root: the teal vertices form the component $C$ of $G-T$ being attacked, its neighbourhood $N(C)$ (orange rings) is a chain, and the new vertex $y$ (gold) is attached to the top of that chain, $x$. At the end every edge of $G$ joins comparable vertices.`,
      deps: ['graph-1.5.3a', 'graph-1.5.4'], see: ['algo-8.7'], refs: ['Diestel §1.5'], tags: ['trees', 'normal trees'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...NT(), r: 13 });
        let root = 'g';
        G.onClick = ({ node }) => { if (node) { root = node.id; S.reset({ at: 'end' }); } return true; };
        function frames() {
          const H = ix(G), r = H.at(root), par = new Array(H.n).fill(-1), dep = new Array(H.n).fill(-1), inT = new Set([r]), tE = new Set(), F = []; dep[r] = 0;
          const T = { par, depth: dep }, snap = (o) => F.push({ inT: new Set([...inT].map((u) => H.ids[u])), tE: new Set(tE), ...o });
          snap({ note: `Start with the trivial normal tree $\\{${root}\\}$.` });
          while (inT.size < H.n) {
            const C = comps(H, (u) => !inT.has(u)), Cl = C.lists[0], Cs = new Set(Cl);
            const N = [...inT].filter((u) => H.adj[u].some(([w]) => Cs.has(w))).sort((a, b) => dep[a] - dep[b]);
            const x = N[N.length - 1], y = Cl.filter((w) => H.adj[w].some(([z]) => z === x)).sort((a, b) => a - b)[0], k = H.adj[x].find(([w]) => w === y)[1];
            snap({ C: new Set(Cl.map((u) => H.ids[u])), N: new Set(N.map((u) => H.ids[u])), x: H.ids[x], y: H.ids[y], note: `Component {${Cl.map((u) => H.ids[u]).join(',')}} of $G - T$: $N(C) = \\{${N.map((u) => H.ids[u]).join(',')}\\}$ is a chain with top $x = ${H.ids[x]}$; attach $y = ${H.ids[y]}$.` });
            par[y] = x; dep[y] = dep[x] + 1; inT.add(y); tE.add(H.E[k][2]);
          }
          const bad = H.E.filter(([a, b]) => !comparable(T, a, b)).length;
          snap({ done: true, note: `$T$ spans $G$; ${bad === 0 ? 'every edge of $G$ joins comparable vertices: **normal** ✓' : bad + ' edges between incomparable vertices ✗'}` });
          return F.map((f) => ({ ...f, bad, depth: new Map(H.ids.map((id, u) => [id, dep[u]])) }));
        }
        const S = v.steps({ frames, speed: 1.2, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.inT) return;
          G.draw({ nodeFill: (id) => (id === f.y ? 'gold' : id === root ? 'ink' : f.C && f.C.has(id) ? 'teal' : f.inT.has(id) ? 'accent' : null), nodeRing: (id) => (f.N && f.N.has(id) ? (id === f.x ? 'red' : 'orange') : null),
            nodeNote: (id) => (id === f.x ? 'x' : id === f.y ? 'y' : null), noteColor: () => 'ink',
            edgeColor: (e) => (f.tE.has(e) ? 'green' : f.x && ((e.from === f.x && e.to === f.y) || (e.to === f.x && e.from === f.y)) ? 'gold' : null), edgeWidth: (e) => (f.tE.has(e) ? 3.6 : null) });
        });
        v.legend([['green', 'normal tree $T$'], ['teal', 'component $C$ of $G-T$', { dot: true }], ['orange', '$N(C)$, a chain (top $x$ red)', { dot: true }], ['gold', 'new vertex $y$', { dot: true }]]);
        v.readout(() => { const f = S.frame; return f.inT ? `$|T| = ${f.inT.size}$ of ${G.nodes.length}${f.done ? (f.bad === 0 ? ' · normal spanning tree found ✓' : '') : ''} · click a vertex to change the root` : ''; });
      },
    },
    // ================================================================== 1.6 Bipartite graphs
    {
      num: '1.6.1a', kind: 'Definition', name: 'Bipartite and r-partite graphs', verify: true,
      statement: String.raw`Let $r\ge2$. A graph $G=(V,E)$ is **$r$-partite** if $V$ admits a partition into $r$ classes such that every edge has its ends in different classes; **bipartite** means 2-partite. An $r$-partite graph in which any two vertices from different classes are adjacent is **complete**; the complete $r$-partite graph with classes of sizes $n_1,\dots,n_r$ is $K_{n_1,\dots,n_r}$, and $K^r_s$ denotes the one with $r$ classes of size $s$. The graphs $K_{1,n}$ are **stars**.`,
      idea: String.raw`An $r$-partition is the same thing as a proper colouring with $r$ colours (Chapter 5): each class is an independent set. So "$r$-partite" means "chromatic number at most $r$". Deciding 2-partiteness is easy (1.6.1), while for $r\ge3$ it is NP-complete.`,
      caption: String.raw`Click a vertex to cycle its class through the $r$ colours. Edges inside a class turn red; the graph is $r$-partite once nothing is red. **Find** searches for an $r$-partition by backtracking. The octahedron is $K_{2,2,2}=K^3_2$; the 5-cycle and the Petersen graph need three classes.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §1.6'], tags: ['bipartite', 'colouring'],
      viz(v) {
        const PRE = { k33: () => named('kmn', 3, 3), oct: () => named('octahedron'), c5: () => named('cycle', 5), pet: () => named('petersen') };
        const pre = v.select('', [{ value: 'k33', label: '$K_{3,3}$' }, { value: 'oct', label: '$K_{2,2,2}$' }, { value: 'c5', label: '$C^5$' }, { value: 'pet', label: 'Petersen' }], 'pet', { onChange: () => load() });
        const rS = v.slider('$r$', 2, 4, 3, { int: true });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14 });
        let col = new Map(), msg = '';
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges }).layout('fit'); col = new Map(G.nodes.map((n) => [n.id, 0])); msg = ''; if (pre.value === 'pet') find(); }
        function find() {
          const H = ix(G), r = rS.value, c = new Array(H.n).fill(-1);
          const go = (u) => { if (u === H.n) return true; for (let k = 0; k < r; k++) if (H.adj[u].every(([w]) => c[w] !== k)) { c[u] = k; if (go(u + 1)) return true; } c[u] = -1; return false; };
          if (go(0)) { col = new Map(H.ids.map((id, u) => [id, c[u]])); msg = ''; } else msg = `no ${r}-partition exists`;
        }
        load();
        G.onClick = ({ node }) => { if (node) { col.set(node.id, ((col.get(node.id) ?? 0) + 1) % rS.value); msg = ''; } return true; };
        v.button('Find', find);
        const CL = ['blue', 'orange', 'green', 'purple'];
        v.render(() => {
          const r = rS.value; for (const [k, c] of col) if (c >= r) col.set(k, c % r);
          const bad = (e) => col.get(e.from) === col.get(e.to);
          G.draw({ nodeFill: (id) => CL[col.get(id) ?? 0], edgeColor: (e) => (bad(e) ? 'red' : null), edgeWidth: (e) => (bad(e) ? 3.6 : null) });
          if (msg) s.corner(msg, 'tl', { color: 'red', weight: 700 });
        });
        v.legend([['red', 'edge inside a class']]);
        v.readout(() => { const r = rS.value, badN = G.edges.filter((e) => col.get(e.from) === col.get(e.to)).length, sizes = [...Array(r)].map((_, k) => [...col.values()].filter((c) => c === k).length); return `class sizes ${sizes.join(' + ')} · ${badN} edge(s) inside a class · ${badN ? `not yet an ${r}-partition` : `**${r}-partite** ✓`}`; });
      },
    },
    {
      num: '1.6.1', kind: 'Proposition', name: 'Bipartite iff no odd cycle',
      statement: String.raw`A graph is bipartite if and only if it contains no odd cycle (a cycle of odd length).`,
      idea: String.raw`A cycle in a bipartite graph alternates between the two classes, so it is even. Conversely, assume there is no odd cycle and (component by component) take a spanning tree $T$ with root $r$; put $v$ in a class according to the parity of the length of $rTv$. Tree edges join vertices of different parity. For an edge $e=xy\notin T$, the fundamental cycle $xTy+e$ is even by assumption, and along $xTy$ the parities alternate, so $x$ and $y$ again lie in different classes.`,
      caption: String.raw`Step through breadth-first search from the root, colouring each vertex by the parity of its distance. At the end, either no edge joins equal colours — a bipartition — or a monochromatic edge (red) appears; together with the two tree paths up to their meeting point it closes an **odd cycle**, highlighted as the certificate. Edit the graph (${EDIT}) or switch presets.`,
      deps: ['graph-1.6.1a', 'graph-1.3.1a', 'graph-1.5.1'], see: ['algo-8.6'], refs: ['Diestel §1.6'], tags: ['bipartite', 'cycles', 'BFS'],
      viz(v) {
        const PRE = { odd: () => fixed({ a: [1.0, 3.2], b: [2.6, 1.2], c: [2.6, 5.2], d: [4.6, 1.0], e: [4.6, 3.2], f: [4.6, 5.4], g: [6.6, 1.6], h: [6.6, 4.8], i: [8.6, 3.2] }, 'ab ac bd be ce cf dg eg eh fh gi hi dh'),
          even: () => ({ ...named('cube') }), grid: () => { const Gr = v.graphs('grid', 3, 4); return { nodes: Gr.nodes.map((n) => ({ id: 'abcdefghijkl'[n.id], x: n.x, y: n.y })), edges: Gr.edges.map((e) => ['abcdefghijkl'[e.from], 'abcdefghijkl'[e.to]]), layout: 'fit' }; } };
        const pre = v.select('', [{ value: 'odd', label: 'with an odd cycle' }, { value: 'even', label: 'cube' }, { value: 'grid', label: 'grid' }], 'odd', { onChange: () => load() });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], editable: true, r: 14 });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges }).layout(P.layout || 'none'); if (S) S.reset({ at: 'end' }); }
        let S = null; load();
        function frames() {
          const H = ix(G); if (!H.n) return [{ col: new Map(), note: 'empty' }];
          const r = 0, B = bfs(H, r), F = [], col = new Map();
          B.order.forEach((u, i) => { col.set(H.ids[u], B.dist[u] % 2); F.push({ col: new Map(col), cur: H.ids[u], tree: new Set(B.order.slice(0, i + 1).filter((w) => B.parE[w] >= 0).map((w) => H.E[B.parE[w]][2])), note: `${H.ids[u]} at distance ${B.dist[u]}: colour ${B.dist[u] % 2 ? 'orange (odd)' : 'blue (even)'}.` }); });
          const tree = new Set(B.order.filter((w) => B.parE[w] >= 0).map((w) => H.E[B.parE[w]][2]));
          const badK = H.E.findIndex(([a, b]) => B.dist[a] < Infinity && B.dist[a] % 2 === B.dist[b] % 2);
          if (badK < 0) F.push({ col, tree, done: true, note: B.order.length < H.n ? 'Only the root\'s component is coloured (the graph is disconnected).' : 'No edge joins two vertices of the same colour: **bipartite** ✓' });
          else {
            const [a, b] = H.E[badK]; let x = a, y = b; const A1 = [], B1 = [];
            while (B.dist[x] > B.dist[y]) { A1.push(x); x = B.par[x]; } while (B.dist[y] > B.dist[x]) { B1.push(y); y = B.par[y]; }
            while (x !== y) { A1.push(x); x = B.par[x]; B1.push(y); y = B.par[y]; }
            const cyc = A1.concat([x], B1.reverse());
            F.push({ col, tree, done: true, bad: H.E[badK][2], cyc: eset(H, pathEdges(H, cyc, true)), cycV: new Set(cyc.map((u) => H.ids[u])), len: cyc.length, note: `Edge ${H.ids[a]}${H.ids[b]} joins two vertices of the same parity: with the tree paths to ${H.ids[x]} it closes an odd cycle of length ${cyc.length}.` });
          }
          return F;
        }
        S = v.steps({ frames, speed: 2, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.col) return;
          G.draw({ nodeFill: (id) => (f.col.has(id) ? (f.col.get(id) ? 'orange' : 'blue') : null), nodeRing: (id) => (id === f.cur && !f.done ? 'gold' : f.cycV && f.cycV.has(id) ? 'red' : null),
            edgeColor: (e) => (e === f.bad ? 'red' : f.cyc && f.cyc.has(e) ? 'red' : f.tree && f.tree.has(e) ? 'green' : null), edgeWidth: (e) => (e === f.bad ? 5 : f.cyc && f.cyc.has(e) ? 3.6 : f.tree && f.tree.has(e) ? 2.6 : null), edgeDash: (e) => !!(f.cyc && f.cyc.has(e) && e !== f.bad) });
        });
        v.legend([['blue', 'even distance', { dot: true }], ['orange', 'odd distance', { dot: true }], ['green', 'BFS tree'], ['red', 'odd cycle certificate', { dash: true }]]);
        v.readout(() => { const f = S.frame; if (!f.done) return `colouring… ${f.col ? f.col.size : 0} of ${G.nodes.length}`; return f.len ? `**not bipartite**: odd cycle of length ${f.len}` : 'a proper 2-colouring: **bipartite**, and so no odd cycle'; });
      },
    },
  ],
};
