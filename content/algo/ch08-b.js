// Algorithms — Chapter 8: Graph search (items 8.11–8.20; 8.1–8.10 in ch08.js)
import { K, COMP, KIND_COL, clamp, plural, ids, nodesAt, DFS_CODE, dfsTrace, dfsView, isAnc, LOW_CODE, lowTrace, TARJAN_CODE, tarjanTrace, closure, sccBrute, countComps, countTopo, blob, strip, arcPx } from './ch08.shared.js';

const TC = ['blue', 'teal', 'green', 'pink', 'red'];
const R = (s, X0, Y0, X1, Y1, st) => s.rect(s.invX(X0), s.invY(Y1), s.invX(X1), s.invY(Y0), st);
const T = (s, str, X, Y, st) => s.textPx(String(str), X, Y, st);

/** SCCs (Tarjan, from the kit) ordered by their first vertex in node order, with a vertex → index map. */
function sccOrdered(G) {
  const pos = new Map(ids(G).map((id, i) => [K(id), i]));
  const comps = G.scc().map((c) => c.slice().sort((a, b) => pos.get(K(a)) - pos.get(K(b)))).sort((a, b) => pos.get(K(a[0])) - pos.get(K(b[0])));
  const compOf = {}; comps.forEach((c, k) => c.forEach((x) => { compOf[K(x)] = k; }));
  return { comps, compOf };
}
/** Component graph: one node per component, one edge per ordered pair of components joined by an edge. */
function condense(G, comps, compOf, label) {
  const nodes = comps.map((c, k) => ({ id: 'C' + k, k, label: label ? label(c, k) : c.map((x) => G.lab(x)).join(' ') }));
  const seen = new Map();
  for (const e of G.edges) {
    const a = compOf[K(e.from)], b = compOf[K(e.to)]; if (a == null || b == null || a === b) continue;
    const key = a + '>' + b; if (!seen.has(key)) seen.set(key, { from: 'C' + a, to: 'C' + b, a, b, refs: [] }); seen.get(key).refs.push(e);
  }
  return { nodes, edges: [...seen.values()] };
}
/** Draw shaded hulls around the components (singletons get a disc). */
function hulls(v, s, G, comps, colorOf, alpha = 0.1) {
  comps.forEach((c, k) => blob(v, s, c.map((x) => [G.node(x).x, G.node(x).y]), 24, { color: colorOf(k), alpha, edge: 0.45 }));
}
/** Is the reachability relation of G acyclic? (Warshall: no vertex reaches itself.) */
const hasCycle = (G) => { const { R: M } = closure(G); return M.some((row, i) => row[i]); };

// ---------------------------------------------------------------- 8.11 DAG on a line
const E811 = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['c', 'e'], ['d', 'f'], ['e', 'f'], ['b', 'g'], ['g', 'f']];
const START811 = ['d', 'a', 'f', 'c', 'g', 'b', 'e'];
function perms(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((x, i) => { for (const p of perms(a.slice(0, i).concat(a.slice(i + 1)))) out.push([x, ...p]); }); return out; }

// ---------------------------------------------------------------- 8.12 cycle detection
const P812 = { a: [0.9, 4.6], b: [3.2, 5.3], c: [5.6, 5.3], d: [8.0, 5.0], e: [1.6, 1.4], f: [4.2, 2.6], g: [6.6, 2.0], h: [9.1, 1.4] };
const E812 = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e'], ['e', 'f'], ['f', 'c'], ['d', 'g'], ['f', 'g'], ['g', 'h'], ['e', 'h'], ['b', 'f']];

// ---------------------------------------------------------------- 8.13 a recipe DAG
const P813 = { shop: [0.9, 3.2], chop: [3.0, 5.2], boil: [3.0, 1.2], sauce: [5.3, 5.2], pasta: [5.3, 1.2], drain: [7.3, 1.2], mix: [7.4, 2.9], table: [8.3, 5.3], serve: [9.4, 3.2] };
const E813 = [['shop', 'chop'], ['shop', 'boil'], ['chop', 'sauce'], ['boil', 'pasta'], ['pasta', 'drain'], ['drain', 'mix'], ['sauce', 'mix'], ['mix', 'serve'], ['table', 'serve'], ['shop', 'pasta']];

// ---------------------------------------------------------------- 8.14 course prerequisites
const N814 = [['prog', 'Prog 1'], ['disc', 'Discrete'], ['calc', 'Calculus'], ['ds', 'Data str.'], ['la', 'Lin. alg.'], ['prob', 'Probability'], ['alg', 'Algorithms'], ['ml', 'Machine l.'], ['th', 'Theory']];
const E814 = [['prog', 'ds'], ['disc', 'ds'], ['disc', 'prob'], ['calc', 'la'], ['calc', 'prob'], ['ds', 'alg'], ['prob', 'alg'], ['la', 'ml'], ['prob', 'ml'], ['alg', 'ml'], ['alg', 'th'], ['disc', 'th']];
const KAHN_CODE = ['compute indeg[v] for every vertex v', 'Q ← vertices with indeg 0              ▷ the current sources', 'while Q is not empty:', '  u ← dequeue(Q);  output u', '  for each edge u → v:', '    indeg[v] ← indeg[v] − 1', '    if indeg[v] = 0:  enqueue(Q, v)', 'if fewer than n vertices were output:  a cycle remains'];

// ---------------------------------------------------------------- 8.15 / 8.16 / 8.17 a digraph with clustered components
const P815 = { a: [0.8, 4.6], b: [2.6, 5.4], c: [2.3, 3.4], d: [4.6, 5.3], e: [4.9, 3.6], f: [2.0, 1.2], g: [3.9, 1.8], h: [3.4, 0.7], i: [7.0, 4.4], j: [8.9, 5.3], k: [9.0, 3.4], l: [7.2, 1.2], m: [9.2, 1.0] };
const E815 = [['a', 'b'], ['b', 'c'], ['c', 'a'], ['b', 'd'], ['d', 'e'], ['e', 'd'], ['c', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'f'], ['e', 'i'], ['g', 'e'], ['i', 'j'], ['j', 'k'], ['k', 'i'], ['g', 'l'], ['l', 'm'], ['k', 'm'], ['d', 'j']];
const KOS_CODE = ['run DFS(G), recording finishing times f        ▷ pass 1', 'L ← the vertices by decreasing f', 'for each u in L:', '  if u is unvisited:  Visit(Gᴿ, u)   ▷ pass 2, edges reversed', '  every vertex this visit reaches forms one component'];

// ---------------------------------------------------------------- 8.18 cut vertices
const P818 = { a: [0.8, 4.4], b: [2.4, 5.5], c: [2.6, 3.3], d: [4.4, 4.4], e: [6.0, 5.4], f: [6.2, 3.3], g: [7.8, 4.3], h: [4.6, 1.4], i: [2.9, 0.8], j: [6.4, 0.8], k: [9.4, 4.4], l: [9.3, 1.6] };
const E818 = [['a', 'b'], ['b', 'c'], ['c', 'a'], ['b', 'd'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'd'], ['e', 'g'], ['f', 'g'], ['d', 'h'], ['h', 'i'], ['h', 'j'], ['i', 'j'], ['g', 'k'], ['k', 'l']];

// ---------------------------------------------------------------- 8.19 Tarjan
const P819 = { a: [0.9, 4.0], b: [2.8, 5.2], c: [2.8, 2.8], d: [4.8, 5.2], e: [4.8, 2.8], f: [6.8, 5.3], g: [8.9, 5.0], h: [6.8, 2.8], i: [8.9, 2.5], j: [4.6, 0.6], k: [7.0, 0.6] };
const E819 = [['a', 'b'], ['b', 'c'], ['c', 'a'], ['b', 'd'], ['c', 'e'], ['d', 'e'], ['e', 'd'], ['d', 'f'], ['f', 'g'], ['g', 'f'], ['e', 'h'], ['h', 'i'], ['i', 'h'], ['g', 'i'], ['e', 'j'], ['j', 'k'], ['k', 'h']];

// ---------------------------------------------------------------- 8.20 Hierholzer
const P820 = { a: [1.6, 3.0], b: [4.0, 4.5], c: [6.4, 3.0], d: [4.0, 0.9], e: [0.5, 5.0], f: [2.4, 5.6], g: [6.9, 5.5], h: [8.9, 3.0] };
const E820 = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a'], ['a', 'e'], ['e', 'f'], ['f', 'a'], ['c', 'g'], ['g', 'h'], ['h', 'c'], ['b', 'f'], ['f', 'g'], ['g', 'b']];
const HIER_CODE = [
  'pick a start s (an odd-degree vertex if there are two);  S ← ⟨s⟩;  T ← ⟨⟩',
  'while S is not empty:',
  '  u ← top(S)',
  '  if u has an unused edge uw:  mark uw used;  push w    ▷ extend the walk',
  '  else:  pop u;  append u to T                         ▷ u is exhausted: back up',
  'T is an Euler tour (read it backwards)',
];
function hierholzer(G, s) {
  const used = new Map(), stack = [s], tour = [], F = []; let sub = 0, lastPop = false;
  const snap = (e) => F.push({ ...e, used: new Map(used), stack: stack.slice(), tour: tour.slice(), sub });
  snap({ line: 1, note: `Start the walk at **${G.lab(s)}**.` });
  while (stack.length) {
    const u = stack[stack.length - 1], nxt = G.adj(u).find(({ edge }) => !used.has(edge));
    if (nxt) {
      if (lastPop) sub++; lastPop = false;
      used.set(nxt.edge, sub); stack.push(nxt.id);
      snap({ line: [3, 4], u, edge: nxt.edge, note: `${G.lab(u)} has an unused edge: walk ${G.lab(u)}–${G.lab(nxt.id)}${sub ? ` (sub-tour ${sub + 1}, to be spliced in at ${G.lab(stack[stack.length - 2])})` : ''}.` });
    } else {
      stack.pop(); tour.push(u); lastPop = true;
      snap({ line: [3, 5], u, popped: true, note: `Every edge at ${G.lab(u)} is used: pop it and append it to the tour (${tour.length} vertices so far).` });
    }
  }
  snap({ line: 6, done: true, note: `Done: the tour is ${tour.slice().reverse().map((x) => G.lab(x)).join(' ')}.` });
  return F;
}

export default {
  collection: 'algo',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11',
      kind: 'Definition',
      name: 'DAGs and topological orders',
      statement: String.raw`A **directed acyclic graph** (DAG) is a directed graph with no directed cycle. A **topological order** of a directed graph $G$ is a listing $v_1,v_2,\dots,v_n$ of its vertices in which every edge points forward: $v_i\to v_j$ implies $i<j$. Equivalently, it is a linear order on $V$ that extends the reachability relation.

A directed graph has a topological order if and only if it is a DAG. Every DAG has at least one **source** (in-degree 0) and at least one **sink** (out-degree 0). A DAG can have many topological orders; it has exactly one if and only if it contains a directed path through all its vertices.`,
      idea: String.raw`If the vertices are listed with every edge pointing forward, a directed cycle would have to come back to its start while always moving right, which is impossible; so only DAGs can have topological orders. Conversely, in a DAG, walk backwards along incoming edges as long as you can. The walk cannot repeat a vertex (that would close a cycle), so it stops, and it stops at a source. List that source first, delete it, and repeat: what remains is still a DAG. This is Kahn's algorithm (8.14). In the language of order theory (pma-1.5), reachability in a DAG is a partial order, and a topological order is a linear extension of it.`,
      caption: String.raw`Drag the vertices along the line. Edges that point right arc above the line in green; edges that point left arc below it in red. The arrangement is a topological order exactly when no red arc is left. **Snap** sorts the line with Kahn's algorithm. Turn on the edge **f → a** to close a cycle: no arrangement clears every red arc, and the readout finds the fewest red arcs possible by trying all $7! = 5040$ arrangements. The right panel shows the same graph drawn by layers.`,
      deps: ['algo-8.1', 'pma-1.5'],
      refs: ['CLRS 4e §20.4'],
      tags: ['graphs', 'dags'],
      viz(v) {
        const cyc = v.toggle('edge f → a (makes a cycle)', false);
        const s = v.stage({ x: [0, 10], y: [-3, 3], axes: false, height: 300, weight: 1.5, title: 'drag the vertices along the line' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'the same graph by layers' });
        const names = [...'abcdefg'];
        const G = v.graph(s, { nodes: START811.map((id, i) => ({ id, x: 1 + (8 * i) / 6, y: 0 })), edges: [], layout: 'none', r: 14 });
        const H = v.graph(s2, { directed: true, nodes: names.map((id) => ({ id })), edges: E811.map(([a, b]) => [a, b]), layout: 'layered', rankdir: 'right', draggable: false, r: 13 });
        const edges = () => (cyc.value ? [...E811, ['f', 'a']] : E811);
        v.button('Snap to a topological order', () => {
          const E = edges(), indeg = Object.fromEntries(names.map((x) => [x, 0])); E.forEach(([, b]) => indeg[b]++);
          const byX = G.nodes.slice().sort((p, q) => p.x - q.x).map((n) => n.id), out = [], left = new Set(names);
          while (left.size) {
            let u = byX.find((x) => left.has(x) && indeg[x] === 0);
            if (u == null) u = byX.find((x) => left.has(x)); // stuck on a cycle: take the leftmost remaining vertex
            out.push(u); left.delete(u); E.forEach(([a, b]) => { if (a === u) indeg[b]--; });
          }
          out.forEach((id, i) => { G.node(id).x = 1 + (8 * i) / 6; });
        });
        v.button('Scramble', () => { START811.forEach((id, i) => { G.node(id).x = 1 + (8 * i) / 6; }); });
        let minBack = null, minKey = '';
        let info = {};
        v.render(() => {
          for (const n of G.nodes) { n.y = 0; n.x = clamp(n.x, 0.4, 9.6); }
          const E = edges(), pos = Object.fromEntries(G.nodes.map((n) => [n.id, n.x]));
          s.hline(0, { color: 'faint', width: 1.2 });
          let back = 0;
          for (const [a, b] of E) {
            const Xa = s.X(pos[a]), Xb = s.X(pos[b]), fwd = Xb > Xa, h = Math.min(s.height / 2 - 26, 14 + 0.3 * Math.abs(Xb - Xa));
            if (!fwd) back++;
            arcPx(s, Xa + (fwd ? 8 : -8), Xb + (fwd ? -12 : 12), s.Y(0), fwd ? -h : h, { color: fwd ? 'green' : 'red', width: fwd ? 2 : 2.6, dash: fwd ? null : [6, 4] });
          }
          G.draw({ nodeFill: (id) => (E.some(([a, b]) => (a === id || b === id) && pos[b] < pos[a]) ? 'red' : 'accent') });
          s.text('← earlier', 0.3, -2.75, { size: 11, color: 'faint' }); s.text('later →', 9.7, -2.75, { size: 11, color: 'faint', align: 'right' });
          const key = E.map((e) => e.join('')).join(',');
          if (key !== minKey) {
            minKey = key; const ps = perms(names); minBack = Infinity;
            for (const p of ps) { const ix = Object.fromEntries(p.map((x, i) => [x, i])); let c = 0; for (const [a, b] of E) if (ix[b] < ix[a]) c++; if (c < minBack) minBack = c; }
            H.set({ edges: E.map(([a, b]) => [a, b]) }); H.layout('layered', { rankdir: 'right' });
          }
          H.draw({ edgeColor: (e) => (pos[e.to] < pos[e.from] ? 'red' : 'green'), edgeWidth: (e) => (pos[e.to] < pos[e.from] ? 3 : 2), nodeColor: 'accent' });
          info = { back, order: G.nodes.slice().sort((p, q) => p.x - q.x).map((n) => n.id), nTopo: countTopo(H) };
        });
        v.legend([['green', 'points right (forward)'], ['red', 'points left (backward)', { dash: true }]]);
        v.readout(() => {
          const { back, order, nTopo } = info; if (!order) return '';
          const head = `Line: ${order.join(' ')} · ${plural(back, 'backward edge')}`;
          if (!cyc.value) return `${head} ${back ? '— not yet a topological order' : '— **a topological order** ✓'} · this DAG has **${nTopo}** topological orders (counted by dynamic programming over subsets)`;
          return `${head} · with f → a the graph has the cycle a → c → d → f → a, so it has ${nTopo} topological orders: the fewest backward edges over all 5040 arrangements is **${minBack}** ${minBack > 0 ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.12
    {
      num: '8.12',
      kind: 'Theorem',
      name: 'A digraph is acyclic iff DFS finds no back edge',
      statement: String.raw`A directed graph $G$ is acyclic if and only if a depth-first search of $G$ (from any vertex order, scanning edges in any order) produces no back edges. Consequently, a directed cycle, if one exists, can be found in $O(n+m)$ time: a back edge $u\to v$ together with the tree path from $v$ down to $u$ is a directed cycle.`,
      idea: String.raw`A back edge $u\to v$ goes to an ancestor $v$ of $u$, and the tree path $v\leadsto u$ followed by the edge closes a cycle. Conversely, suppose $G$ has a cycle, and let $v$ be the first of its vertices that DFS discovers. At time $d[v]$ every other vertex of the cycle is white, and the rest of the cycle is a white path from $v$ to its predecessor $u$ on the cycle. By the white-path theorem (8.9), $u$ becomes a descendant of $v$. When the edge $u\to v$ is examined, $v$ is an ancestor of $u$, still grey: a back edge (8.10). The search order changes *which* back edge is found, never *whether* one is.`,
      caption: String.raw`Step through DFS. A back edge shows up in red, and at the end the cycle it closes is drawn thick in gold. Turn on the edge **h → b** to make a cycle, or turn it off to make the graph acyclic, or click two vertices to add or remove an edge. **Shuffle** changes the order in which DFS starts its trees: the back edges move, but they appear exactly when the graph has a cycle. The readout checks this against Warshall's transitive closure.`,
      deps: ['algo-8.10', 'algo-8.9', 'algo-8.11'],
      refs: ['CLRS 4e §20.4'],
      tags: ['graphs', 'dags'],
      viz(v) {
        const tog = v.toggle('edge h → b', true, { onChange: (x) => { const e = G.edges.find((q) => q.from === 'h' && q.to === 'b'); if (x && !e) G.addEdge('h', 'b'); if (!x && e) G.removeEdge(e); S.reset({ at: 'end' }); } });
        let order = [...'abcdefgh'], shuf = 0;
        v.button('Shuffle start order', () => { order = v.rng(++shuf * 977).shuffle(order.slice()); S.reset({ at: 'end' }); });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320 });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P812, { e: { notePos: 's' }, f: { notePos: 's' }, g: { notePos: 's' }, h: { notePos: 's' } }), edges: [...E812, ['h', 'b']].map(([a, b]) => [a, b]) });
        G.onChange = () => { tog.value = G.edges.some((q) => q.from === 'h' && q.to === 'b'); S.reset({ at: 'end' }); };
        const S = v.steps({ frames: () => dfsTrace(G, { roots: order.filter((x) => G.has(x)).concat(ids(G).filter((x) => !order.includes(x))) }).events, code: DFS_CODE, codeTitle: 'DFS(G)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          const backs = G.edges.filter((e) => f.kinds.get(e) === 'back');
          let cyc = [];
          if (f.type === 'done' && backs.length) { const e = backs[0]; let x = e.from; cyc = [x]; while (K(x) !== K(e.to) && f.prev[K(x)] != null) { x = f.prev[K(x)]; cyc.unshift(x); } }
          const cycE = new Set(); for (let k = 0; k < cyc.length; k++) { const a = cyc[k], b = cyc[(k + 1) % cyc.length]; const e = G.edges.find((q) => K(q.from) === K(a) && K(q.to) === K(b)); if (e) cycE.add(e); }
          const base = dfsView(f);
          G.draw({ ...base, edgeColor: (e) => (cycE.has(e) && f.kinds.get(e) !== 'back' ? 'gold' : base.edgeColor(e)), edgeWidth: (e) => (cycE.has(e) ? 4.4 : base.edgeWidth(e)), nodeRing: (id) => (cyc.some((x) => K(x) === K(id)) ? 'gold' : null) });
          info = { f, backs, cyc, truth: hasCycle(G) };
        });
        v.legend([['green', 'tree'], ['red', 'back', { dash: true }], ['purple', 'forward', { dash: true }], ['teal', 'cross', { dash: true }], ['gold', 'the cycle a back edge closes']]);
        v.readout(() => {
          const { f, backs, cyc, truth } = info; if (!f) return '';
          const head = `Start order ${order.join(' ')} · ${plural(backs.length, 'back edge')}${f.type === 'done' ? '' : ' so far'}`;
          if (f.type !== 'done') return head;
          const ok = (backs.length > 0) === truth;
          return `${head}${backs.length ? `, e.g. ${G.lab(backs[0].from)} → ${G.lab(backs[0].to)}, closing the cycle ${cyc.map((x) => G.lab(x)).join(' → ')} → ${G.lab(cyc[0])}` : ''} · Warshall's closure: the graph is ${truth ? '**cyclic**' : '**acyclic**'} ${ok ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.13
    {
      num: '8.13',
      kind: 'Algorithm',
      name: 'Topological sort by finishing times',
      statement: String.raw`**Algorithm.** Run DFS on a DAG and, each time a vertex finishes, put it at the *front* of a list. The final list, in order of decreasing finishing time, is a topological order. The running time is $O(n+m)$. If the graph is not acyclic, DFS meets a back edge (8.12), and that edge is exactly where the list fails.`,
      idea: String.raw`For every edge $u\to v$ of a DAG, $f[v]<f[u]$. When the edge is examined, $v$ cannot be grey, because that would make it a back edge and so close a cycle (8.12). If $v$ is white, it becomes a descendant of $u$ and finishes first (8.8). If $v$ is black, it has already finished, while $u$ is still grey. Either way $v$ finishes before $u$, so $u$ comes earlier in the list. Prepending at finish time costs $O(1)$, so sorting adds nothing to the cost of the search.`,
      caption: String.raw`Step through DFS on a recipe. When a task finishes it is pushed onto the front of the list below, and at the end every arc in the list points right. Click two tasks to add or remove a prerequisite edge. Turn on **serve → shop** to make a cycle: DFS meets a back edge, and in the final list it is the one arc pointing left (in red).`,
      deps: ['algo-8.12'],
      refs: ['CLRS 4e §20.4', 'Erickson Ch. 6'],
      tags: ['graphs', 'dags'],
      credit: 'Tarjan, 1976',
      viz(v) {
        const tog = v.toggle('edge serve → shop (makes a cycle)', false, { onChange: (x) => { const e = G.edges.find((q) => q.from === 'serve' && q.to === 'shop'); if (x && !e) G.addEdge('serve', 'shop', { bend: 75 }); if (!x && e) G.removeEdge(e); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6.2], axes: false, equal: true, height: 300 });
        const sl = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 170, full: true, title: 'the list, in order of decreasing finishing time' });
        const G = v.graph(s, { directed: true, layout: 'none', shape: 'box', fontSize: 12, editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P813, { boil: { notePos: 's' }, pasta: { notePos: 's' }, drain: { notePos: 's' } }), edges: E813.map(([a, b]) => [a, b]) });
        G.onChange = () => { tog.value = G.edges.some((q) => q.from === 'serve' && q.to === 'shop'); S.reset({ at: 'end' }); };
        const S = v.steps({ frames: () => dfsTrace(G).events, code: [...DFS_CODE.slice(0, 6), '  time ← time + 1;  f[u] ← time;  colour u black;  put u at the front of L'], codeTitle: 'TopoSort(G)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          G.draw(dfsView(f));
          const L = f.post.slice().reverse(), W = sl.width, Hh = sl.height, n = ids(G).length, cw = Math.min(86, (W - 20) / n - 6), Y0 = Hh / 2 - 13;
          const cx = strip(sl, L.map((id) => ({ label: G.lab(id), color: K(id) === K(f.u) && f.type === 'finish' ? 'gold' : 'accent', fill: K(id) === K(f.u) && f.type === 'finish' ? 'gold' : null, note: `f=${f.f[K(id)]}` })), 10, Y0, { w: cw, h: 26, gap: 6, size: 11.5, empty: 'empty — nothing has finished yet' });
          const at = Object.fromEntries(L.map((id, i) => [K(id), cx[i][0]]));
          let bad = 0, checked = 0;
          for (const e of G.edges) {
            const a = at[K(e.from)], b = at[K(e.to)]; if (a == null || b == null) continue; checked++;
            const ok = a < b; if (!ok) bad++;
            arcPx(sl, a, b + (ok ? -6 : 6), ok ? Y0 - 2 : Y0 + 40, ok ? -Math.min(Y0 - 6, 6 + 0.18 * Math.abs(b - a)) : Math.min(Hh - Y0 - 46, 6 + 0.18 * Math.abs(b - a)), { color: ok ? 'green' : 'red', width: ok ? 1.5 : 2.4, dash: ok ? null : [5, 4], headSize: 6 });
          }
          info = { f, bad, checked, backs: G.edges.filter((e) => f.kinds.get(e) === 'back') };
        });
        v.legend([['green', 'edge pointing forward in the list'], ['red', 'edge pointing backward', { dash: true }], ['orange', 'grey task', { dot: true }], ['accent', 'finished task', { dot: true }]]);
        v.readout(() => {
          const { f, bad, checked, backs } = info; if (!f) return '';
          if (f.type !== 'done') return `${f.post.length} of ${G.nodes.length} tasks finished · among them, ${checked - bad} of ${checked} edges already point forward`;
          if (!bad) return `Every one of ${checked} edges goes from a larger to a smaller finishing time, so the list is a **topological order** ✓`;
          return `${plural(bad, 'edge')} point${bad === 1 ? 's' : ''} backward in the list — exactly the back edge${backs.length === 1 ? '' : 's'} ${backs.map((e) => `${G.lab(e.from)} → ${G.lab(e.to)}`).join(', ')} DFS found ${bad === backs.length ? '✓' : '✗'}: the graph has a cycle, so no order exists`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.14
    {
      num: '8.14',
      kind: 'Algorithm',
      name: 'Kahn’s algorithm (topological sort by in-degree)',
      statement: String.raw`**Algorithm.** Compute every in-degree and put the vertices of in-degree 0 into a queue. Repeatedly remove a vertex $u$ from the queue, output it, and delete its outgoing edges: decrement the in-degree of each out-neighbour, and enqueue any whose in-degree drops to 0. If all $n$ vertices are output, the output is a topological order. Otherwise the remaining vertices all still have positive in-degree, and they contain a directed cycle. The running time is $O(n+m)$.`,
      idea: String.raw`A vertex is output only when all of its in-neighbours have been output already, so every edge points forward in the output. If the queue empties early, every remaining vertex has an incoming edge from another remaining vertex. Walking backwards along such edges must eventually repeat a vertex, and that closes a cycle. This is the constructive form of "every DAG has a source" (8.11). Each edge is deleted once and each vertex queued once, so the total work is linear. Choosing among several sources at the same time is what gives different topological orders.`,
      caption: String.raw`Step through the algorithm on a course-prerequisite graph. Notes give each course's current in-degree ("in 2") or its place in the output ("#3"). The panel below shows the queue of current sources and the output so far. Turn on **Algorithms → Data str.** to create a cycle: the queue runs dry, and the courses left over (red) all still have prerequisites among themselves.`,
      deps: ['algo-8.11'],
      refs: ['KT §3.6'],
      tags: ['graphs', 'dags'],
      credit: 'Kahn, 1962',
      viz(v) {
        const tog = v.toggle('edge Algorithms → Data str. (makes a cycle)', false, { onChange: (x) => { const e = G.edges.find((q) => q.from === 'alg' && q.to === 'ds'); if (x && !e) G.addEdge('alg', 'ds', { bend: 22 }); if (!x && e) G.removeEdge(e); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320 });
        const sq = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const G = v.graph(s, { directed: true, shape: 'box', fontSize: 12, notePos: 's', nodes: N814.map(([id, label]) => ({ id, label })), edges: E814.map(([a, b]) => [a, b]), layout: 'layered', rankdir: 'right' });
        const S = v.steps({ frames: () => G.topoSort().events.map((e) => (e.type === 'done' && e.cycle ? { ...e, note: `Stuck: the queue is empty but ${G.nodes.length - e.order.length} courses are left, each with a prerequisite among the leftovers. Following prerequisites backwards must eventually repeat a course, which closes a cycle.` } : e)), code: KAHN_CODE, codeTitle: 'Kahn(G)', codePos: 'below', speed: 2, start: 9, still: 9 });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.view) return;
          const left = f.type === 'done' && f.cycle ? new Set(ids(G).filter((x) => !f.order.includes(x)).map(K)) : new Set();
          G.draw({ ...f.view, edgeColor: (e) => (left.has(K(e.from)) && left.has(K(e.to)) ? 'red' : f.removed.includes(e) ? 'faint' : f.view.edgeColor(e)), edgeWidth: (e) => (e === f.edge ? 3.4 : left.has(K(e.from)) && left.has(K(e.to)) ? 2.6 : null) });
          const W = sq.width;
          strip(sq, f.queue.map((id) => ({ label: G.lab(id), color: 'orange' })), 12, 44, { title: 'sources (queue)', titleW: 118, w: 84, h: 26, gap: 5, size: 11.5, maxW: W - 24, empty: 'empty' });
          strip(sq, f.order.map((id, i) => ({ label: `${i + 1}. ${G.lab(id)}`, fill: K(id) === K(f.node) && f.type === 'pop' ? 'gold' : 'accent' })), 12, 130, { title: 'output', titleW: 118, w: 92, h: 26, gap: 5, size: 11, maxW: W - 24, empty: '—' });
          info = { f, left };
        });
        v.legend([['gold', 'output now', { dot: true }], ['accent', 'output', { dot: true }], ['orange', 'source waiting in the queue', { dot: true }], ['red', 'left over: on or behind a cycle', { dot: true }]]);
        v.readout(() => {
          const { f, left } = info; if (!f || !f.order) return '';
          if (f.type !== 'done') return `${f.order.length} of ${G.nodes.length} courses output · ${f.queue.length} source${f.queue.length === 1 ? '' : 's'} waiting`;
          if (!f.cycle) {
            const ix = Object.fromEntries(f.order.map((x, i) => [K(x), i])), fwd = G.edges.every((e) => ix[K(e.from)] < ix[K(e.to)]);
            return `All ${G.nodes.length} courses output; every prerequisite comes first ${fwd ? '✓' : '✗'} · this is one of **${countTopo(G)}** valid orders (dynamic programming over subsets)`;
          }
          const leftIds = [...left], allPos = leftIds.every((x) => f.indeg[x] > 0), { I, R: M } = closure(G), onCyc = leftIds.filter((x) => M[I.findIndex((y) => K(y) === x)][I.findIndex((y) => K(y) === x)]);
          return `Stuck after ${f.order.length} of ${G.nodes.length}: the ${leftIds.length} left over all have in-degree ≥ 1 ${allPos ? '✓' : '✗'}; ${onCyc.map((x) => G.lab(x)).join(', ')} lie on a directed cycle (Warshall) — no topological order exists (${countTopo(G)} orders)`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.15
    {
      num: '8.15',
      kind: 'Definition',
      name: 'Strongly connected components and the component DAG',
      statement: String.raw`In a directed graph, vertices $u$ and $v$ are **strongly connected** if each is reachable from the other. This is an equivalence relation; its classes are the **strongly connected components** (SCCs). The **component graph** (or condensation) $G^{\mathrm{SCC}}$ has one vertex per component and an edge $C\to C'$ whenever $G$ has an edge from a vertex of $C$ to a vertex of $C'\ne C$.

**Proposition.** $G^{\mathrm{SCC}}$ is always a DAG. So every directed graph is a DAG of strongly connected pieces, and $G$ itself is a DAG exactly when every component is a single vertex (with no self-loop).`,
      idea: String.raw`Mutual reachability is reflexive and symmetric by definition, and transitive by concatenating paths, so it is an equivalence relation. If $G^{\mathrm{SCC}}$ had a cycle $C_1\to C_2\to\cdots\to C_1$, the edges realising it, together with paths inside each component, would let every vertex of $C_1$ reach every vertex of $C_2$ and back. The two components would then be one, a contradiction. Condensing therefore separates "going round in circles" (inside a component) from "making progress" (along the DAG). This is what lets topological sorting (8.13) and the SCC algorithms (8.17, 8.19) be combined.`,
      caption: String.raw`Edit the directed graph: click two vertices to add or remove an edge, click empty space to add a vertex, and Alt-click to delete. Each strongly connected component is shaded in its own colour, and the right panel contracts it to a single box. Add edges freely: components merge when an edge closes a cycle between them, and the component graph stays acyclic. The readout checks the components against brute-force mutual reachability.`,
      deps: ['algo-8.11'],
      refs: ['CLRS 4e §20.5'],
      tags: ['graphs', 'connectivity'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, weight: 1.4 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'component graph' });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true }, nodes: nodesAt(P815), edges: E815.map(([a, b]) => [a, b]) });
        const C = v.graph(s2, { directed: true, nodes: [], edges: [], layout: 'none', shape: 'box', fontSize: 12, draggable: false });
        let key = '', info = {};
        v.render(() => {
          const { comps, compOf } = sccOrdered(G), col = (k) => COMP[k % COMP.length];
          hulls(v, s, G, comps, col, 0.1);
          G.draw({ nodeColor: (id) => col(compOf[K(id)]), edgeColor: (e) => (compOf[K(e.from)] === compOf[K(e.to)] ? col(compOf[K(e.from)]) : null), edgeWidth: (e) => (compOf[K(e.from)] === compOf[K(e.to)] ? 2.4 : null) });
          const cg = condense(G, comps, compOf), k2 = JSON.stringify([cg.nodes.map((n) => n.label), cg.edges.map((e) => e.from + e.to)]);
          if (k2 !== key) { key = k2; C.set(cg); C.layout('layered', { rankdir: 'down' }); }
          C.draw({ nodeColor: (id, n) => col(n.k), nodeFill: (id, n) => null, edgeLabel: (e) => (e.refs.length > 1 ? `×${e.refs.length}` : null) });
          const br = sccBrute(G), same = br.comps.length === comps.length && ids(G).every((a) => ids(G).every((b) => (br.compOf[K(a)] === br.compOf[K(b)]) === (compOf[K(a)] === compOf[K(b)])));
          info = { comps, same, acyclic: !C.topoSort().cycle, nE: cg.edges.length };
        });
        v.readout(() => {
          const { comps, same, acyclic, nE } = info; if (!comps) return '';
          return `${plural(comps.length, 'strongly connected component')}: ${comps.map((c) => `{${c.map((x) => G.lab(x)).join(' ')}}`).join(' ')} · brute force (mutual reachability by Warshall's closure) agrees ${same ? '✓' : '✗'} · the component graph has ${plural(nE, 'edge')} and is acyclic ${acyclic ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.16
    {
      num: '8.16',
      kind: 'Lemma',
      name: 'The last-finishing component is a source',
      statement: String.raw`Run DFS on a directed graph $G$, and for a set $C$ of vertices let $f(C)=\max_{v\in C}f[v]$ be its latest finishing time. If $C$ and $C'$ are distinct strongly connected components and $G$ has an edge from $C$ to $C'$, then $f(C)>f(C')$. Consequently, the vertex with the largest finishing time lies in a **source** component of $G^{\mathrm{SCC}}$; and in the reversed graph $G^{\mathsf R}$, whose edges go the other way, that component is a **sink**.`,
      idea: String.raw`Let $x$ be the first vertex of $C\cup C'$ that DFS discovers. If $x\in C$, then at time $d[x]$ all of $C\cup C'$ is white and reachable from $x$ through white vertices, so by the white-path theorem (8.9) every vertex of $C\cup C'$ becomes a descendant of $x$ and finishes before it: $f(C)=f[x]>f(C')$. If $x\in C'$, the search from $x$ reaches all of $C'$, but none of $C$, because an edge back from $C'$ to $C$ would merge the two components (8.15). So all of $C'$ finishes before any vertex of $C$ is discovered, and again $f(C)>f(C')$. The *earliest* finishing time carries no such guarantee, since a vertex of $C$ can finish before the search ever crosses into $C'$.`,
      caption: String.raw`Every component of the graph is labelled with a finishing-time statistic, and the component graph on the right colours each edge green when it runs from a larger label to a smaller one, red otherwise. With **latest finish** (the lemma) every edge is green whatever the start order. **Shuffle** the start order to test it. Switch to **earliest finish** and red edges appear. The component with the largest label is outlined in gold: it is a source.`,
      deps: ['algo-8.15', 'algo-8.9'],
      refs: ['CLRS 4e §20.5'],
      tags: ['graphs', 'connectivity'],
      viz(v) {
        const stat = v.select('label each component by', [{ value: 'max', label: 'latest finish f(C)' }, { value: 'min', label: 'earliest finish (fails)' }], 'max');
        let order = ids({ nodes: nodesAt(P815) }), shuf = 3;
        v.button('Shuffle start order', () => { order = v.rng(++shuf * 7919).shuffle(order.slice()); });
        v.button('Alphabetical', () => { order = Object.keys(P815); });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, weight: 1.4 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'component graph' });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P815, { c: { notePos: 's' }, e: { notePos: 's' }, f: { notePos: 'w' }, h: { notePos: 's' }, j: { notePos: 'e' }, k: { notePos: 'e' }, l: { notePos: 's' }, m: { notePos: 's' } }), edges: E815.map(([a, b]) => [a, b]) });
        const C = v.graph(s2, { directed: true, nodes: [], edges: [], layout: 'none', shape: 'box', fontSize: 12, draggable: false });
        let key = '', info = {};
        v.render(() => {
          const Rr = dfsTrace(G, { roots: order.filter((x) => G.has(x)).concat(ids(G).filter((x) => !order.includes(x))), events: false });
          const { comps, compOf } = sccOrdered(G), col = (k) => COMP[k % COMP.length];
          const lab = comps.map((c) => (stat.value === 'max' ? Math.max : Math.min)(...c.map((x) => Rr.f[K(x)])));
          hulls(v, s, G, comps, col, 0.08);
          G.draw({ nodeColor: (id) => col(compOf[K(id)]), nodeNote: (id) => `${Rr.d[K(id)]}/${Rr.f[K(id)]}`, noteColor: (id) => (Rr.f[K(id)] === lab[compOf[K(id)]] ? col(compOf[K(id)]) : 'muted'), edgeColor: (e) => (Rr.kinds.get(e) === 'tree' ? 'ink' : null), edgeWidth: (e) => (Rr.kinds.get(e) === 'tree' ? 2.2 : null) });
          const cg = condense(G, comps, compOf, (c, k) => `${c.map((x) => G.lab(x)).join(' ')}\n${stat.value === 'max' ? 'max' : 'min'} f = ${lab[k]}`), k2 = JSON.stringify([cg.nodes.map((n) => n.label), cg.edges.map((e) => e.from + e.to)]);
          if (k2 !== key) { key = k2; C.set(cg); C.layout('layered', { rankdir: 'down' }); }
          const top = lab.indexOf(Math.max(...lab)); let bad = 0;
          for (const e of C.edges) if (!(lab[e.a] > lab[e.b])) bad++;
          C.draw({
            nodeColor: (id, n) => col(n.k), nodeRing: (id, n) => (n.k === top ? 'gold' : null),
            edgeColor: (e) => (lab[e.a] > lab[e.b] ? 'green' : 'red'), edgeWidth: () => 2.4, edgeDash: (e) => !(lab[e.a] > lab[e.b]),
          });
          info = { bad, nE: C.edges.length, topSrc: !C.edges.some((e) => e.b === top), topName: comps[top]?.map((x) => G.lab(x)).join(' ') };
        });
        v.legend([['green', 'edge from larger to smaller label'], ['red', 'violates the order', { dash: true }], ['gold', 'largest label (ring)', { dot: true }], ['ink', 'DFS tree edge']]);
        v.readout(() => {
          const { bad, nE, topSrc, topName } = info; if (nE == null) return '';
          return `Start order: ${order.join(' ')} · ${nE - bad} of ${nE} component edges go from a larger to a smaller label ${bad ? `— **${bad} violate** it ✗` : '✓'} · the component with the largest label, {${topName}}, ${topSrc ? 'has no incoming edge: a source ✓' : 'has an incoming edge ✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.17
    {
      num: '8.17',
      kind: 'Algorithm',
      name: 'Strongly connected components (Kosaraju–Sharir)',
      statement: String.raw`**Algorithm.** (1) Run DFS on $G$ and record finishing times. (2) Run DFS on the reversed graph $G^{\mathsf R}$, taking the roots of its outer loop in order of *decreasing* finishing time from pass 1. Each tree of the second search is exactly one strongly connected component of $G$, and the components appear in topological order of $G^{\mathrm{SCC}}$. The total time is $O(n+m)$; reversing the graph costs $O(n+m)$ as well.`,
      idea: String.raw`$G$ and $G^{\mathsf R}$ have the same components, with the component DAG reversed. By 8.16, the vertex $r$ finishing last in pass 1 lies in a source component $C$ of $G$, which is a sink of $G^{\mathsf R}$. A search of $G^{\mathsf R}$ from $r$ therefore reaches all of $C$ and nothing else. Delete $C$; the next root in the list again lies in a component with no edges out in $G^{\mathsf R}$ apart from those into components already removed, and so on. Taking the roots in the wrong order (for instance increasing finishing time) lets a tree escape through an edge into a component that has not been claimed yet, and two components get merged.`,
      caption: String.raw`Pass 1 (DFS on $G$) records finishing times, and the list below sorts the vertices by decreasing $f$. In pass 2 the arrows flip ($G^{\mathsf R}$), and each new search tree floods one component with a single colour. Step through both passes, or edit the graph by clicking pairs of vertices. Turn on **increasing order** to break it: some trees swallow two components, which the readout flags against brute force.`,
      deps: ['algo-8.16', 'algo-8.13'],
      refs: ['CLRS 4e §20.5', 'Erickson Ch. 6'],
      tags: ['graphs', 'connectivity'],
      credit: 'Kosaraju, 1978 (unpublished); Sharir, 1981',
      viz(v) {
        const wrong = v.toggle('pass 2 in increasing f order (breaks it)', false, { onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320 });
        const sl = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P815, { c: { notePos: 's' }, e: { notePos: 's' }, f: { notePos: 'w' }, h: { notePos: 's' }, j: { notePos: 'e' }, k: { notePos: 'e' }, l: { notePos: 's' }, m: { notePos: 's' } }), edges: E815.map(([a, b]) => [a, b]) });
        const GR = v.graph(s, { directed: true, layout: 'none', nodes: G.nodes, edges: [], draggable: false });
        G.onChange = () => S.reset({ at: 'end' });
        const frames = () => {
          const p1 = dfsTrace(G), L = p1.post.slice().reverse(), roots = wrong.value ? p1.post.slice() : L;
          GR.nodes = G.nodes; GR.edges = G.edges.map((e) => ({ from: e.to, to: e.from, ref: e }));
          const p2 = dfsTrace(G, { rev: true, roots });
          const F = p1.events.filter((e) => e.type !== 'done').map((e) => ({ ...e, phase: 1, line: 1, L: e.post.slice().reverse(), fin: p1.f }));
          F.push({ ...p1.events[p1.events.length - 1], phase: 1.5, line: 2, L, fin: p1.f, note: `Pass 1 done. Sort by decreasing finishing time: ${L.map((x) => G.lab(x)).join(' ')}${wrong.value ? ' — but pass 2 will (wrongly) take them in increasing order' : ''}.` });
          for (const e of p2.events) if (e.type !== 'init') F.push({ ...e, phase: 2, line: e.type === 'start' ? [3, 4] : e.type === 'done' ? 5 : 4, L, fin: p1.f, p2roots: roots, note: e.type === 'start' ? `Next root in the list that is still unvisited: **${G.lab(e.u)}**. Start a new tree in $G^{\\mathsf R}$ — a new component.` : e.type === 'done' ? (wrong.value ? 'Pass 2 done. With the roots in the wrong order, compare the trees with the true components in the readout.' : 'Pass 2 done: each tree is one strongly connected component.') : e.note });
          return F;
        };
        const S = v.steps({ frames, code: KOS_CODE, codeTitle: 'Kosaraju–Sharir(G)', codePos: 'below', speed: 2.5, start: 'end', still: 'end' });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          if (f.phase < 2) { G.draw(dfsView(f)); }
          else {
            const rootsSeen = []; for (const x of f.p2roots) if (f.root[K(x)] != null && !rootsSeen.includes(K(f.root[K(x)]))) rootsSeen.push(K(f.root[K(x)]));
            const ci = (x) => (f.root[K(x)] == null ? -1 : rootsSeen.indexOf(K(f.root[K(x)])));
            const base = dfsView(f, { notes: false });
            GR.draw({
              nodeFill: (id) => (K(id) === K(f.u) && f.type !== 'done' ? 'gold' : ci(id) >= 0 && f.color[K(id)] === 2 ? COMP[ci(id) % COMP.length] : null),
              nodeColor: (id) => (ci(id) >= 0 ? COMP[ci(id) % COMP.length] : null), nodeNote: (id) => `f=${f.fin[K(id)]}`, noteColor: 'muted',
              edgeColor: (e) => (f.kinds.get(e.ref) === 'tree' ? COMP[ci(e.from) % COMP.length] : null), edgeWidth: (e) => (f.kinds.get(e.ref) === 'tree' ? 3.2 : e.ref === f.edge ? 3 : null), edgeDash: (e) => !!f.kinds.get(e.ref) && f.kinds.get(e.ref) !== 'tree',
            });
            void base;
          }
          s.corner(f.phase < 2 ? 'pass 1: DFS on G' : 'pass 2: DFS on Gᴿ (arrows reversed)', 'tl', { weight: 700, color: f.phase < 2 ? 'muted' : 'ink' });
          // the finishing-order list
          const L = f.L || [], W = sl.width;
          const rootsSeen = []; if (f.phase === 2) for (const x of f.p2roots) if (f.root[K(x)] != null && !rootsSeen.includes(K(f.root[K(x)]))) rootsSeen.push(K(f.root[K(x)]));
          strip(sl, (wrong.value && f.phase >= 1.5 ? L.slice().reverse() : L).map((x) => { const k = f.phase === 2 && f.root[K(x)] != null ? rootsSeen.indexOf(K(f.root[K(x)])) : -1; return { label: G.lab(x), note: f.fin[K(x)] ?? '', color: k >= 0 ? COMP[k % COMP.length] : 'accent', fill: k >= 0 ? COMP[k % COMP.length] : null }; }),
            12, 74, { title: f.phase >= 1.5 ? (wrong.value ? 'increasing f' : 'decreasing f') : 'finished so far', titleW: 104, w: 30, h: 26, maxW: W - 24, empty: 'nothing finished yet' });
          let trees = null, ok = null;
          if (f.type === 'done' && f.phase === 2) {
            const br = sccBrute(G), groups = new Map(); for (const x of ids(G)) { const r = K(f.root[K(x)]); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(x); }
            trees = [...groups.values()]; ok = trees.length === br.comps.length && trees.every((t) => t.every((x) => br.compOf[K(x)] === br.compOf[K(t[0])]));
            info = { trees, ok, nb: br.comps.length, mixed: trees.filter((t) => new Set(t.map((x) => br.compOf[K(x)])).size > 1) };
          } else info = { f };
        });
        v.legend([['gold', 'current vertex', { dot: true }], ['green', 'tree edge (pass 1)'], ['red', 'back edge', { dash: true }], ['blue', 'one colour per pass-2 tree', { dot: true }]]);
        v.readout(() => {
          const { trees, ok, nb, mixed, f } = info;
          if (!trees) return f ? `${f.phase < 2 ? 'Pass 1' : 'Pass 2'} · step through to the end to compare with brute force` : '';
          return `${plural(trees.length, 'pass-2 tree')}: ${trees.map((t) => `{${t.map((x) => G.lab(x)).join(' ')}}`).join(' ')} · brute force finds ${plural(nb, 'component')} ${ok ? '— the trees are exactly the components ✓' : `— ${mixed.length ? `${plural(mixed.length, 'tree')} mix${mixed.length === 1 ? 'es' : ''} several components` : 'mismatch'} ✗`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.18
    {
      num: '8.18',
      kind: 'Algorithm',
      name: 'Cut vertices, bridges and biconnected components',
      statement: String.raw`Let $G$ be a connected undirected graph. A **cut vertex** (articulation point) is a vertex whose removal disconnects $G$, and a **bridge** is an edge whose removal does. The **biconnected components** (blocks) are the maximal subgraphs with no cut vertex of their own. Every edge lies in exactly one block, and two blocks share at most one vertex, which is a cut vertex.

**Algorithm (Hopcroft–Tarjan).** Run DFS and compute $\mathrm{low}(u)=\min\{d[w]: w=u$, or some back edge joins a descendant of $u$ to $w\}$. Then:
(a) the root is a cut vertex if and only if it has at least two tree children;
(b) a non-root $u$ is a cut vertex if and only if some tree child $w$ has $\mathrm{low}(w)\ge d[u]$;
(c) the tree edge $uw$ is a bridge if and only if $\mathrm{low}(w)>d[u]$.

Keeping the edges on a stack and popping them at each case of (b) yields the blocks. The total time is $O(n+m)$.`,
      idea: String.raw`In an undirected DFS every non-tree edge is a back edge (8.10), so the subtree of a child $w$ can reach the rest of the graph only through $u$ or through back edges that climb above $u$. $\mathrm{low}(w)$ records the highest point such an escape reaches. If $\mathrm{low}(w)\ge d[u]$, nothing in $w$'s subtree climbs above $u$, and deleting $u$ cuts it off. If $\mathrm{low}(w)>d[u]$, nothing even reaches $u$ except the edge $uw$ itself, which is then a bridge. The root has no ancestors, so it separates exactly when it has two subtrees, since no edge joins two different subtrees. $\mathrm{low}$ is computed in postorder as the minimum over the vertex's own back edges and its children's low values.`,
      caption: String.raw`Step through the DFS. Notes show $d/\mathrm{low}$ as they are computed. When a child returns with $\mathrm{low}\ge d$ of its parent, a block is popped and coloured. At the end, cut vertices have red rings and bridges are thick red edges. Choose **remove a vertex** and click one to delete it temporarily: the pieces that remain are shaded, confirming that a cut vertex splits the graph and any other vertex does not. In **edit edges** mode, click two vertices to add or remove an edge.`,
      deps: ['algo-8.10'],
      refs: ['CLRS 4e Prob. 20-2'],
      tags: ['graphs', 'connectivity'],
      credit: 'Hopcroft & Tarjan, 1973',
      viz(v) {
        const mode = v.select('click a vertex to', [{ value: 'rm', label: 'remove it (test)' }, { value: 'edit', label: 'edit edges' }], 'rm');
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P818, { i: { notePos: 's' }, j: { notePos: 's' }, h: { notePos: 'e' }, l: { notePos: 's' } }), edges: E818.map(([a, b]) => [a, b]) });
        let gone = null;
        G.onClick = ({ node }) => { if (mode.value === 'rm') { gone = node ? (gone === node.id ? null : node.id) : null; return true; } return false; };
        G.onChange = () => S.reset({ at: 'end' });
        const S = v.steps({ frames: () => lowTrace(G).events, code: LOW_CODE, codeTitle: 'CutVertices(G)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.d) return;
          if (gone != null && !G.has(gone)) gone = null;
          if (gone != null) {
            const rest = ids(G).filter((x) => K(x) !== K(gone)), par = new Map(rest.map((x) => [K(x), K(x)])), find = (x) => { while (par.get(x) !== x) x = par.get(x); return x; };
            for (const e of G.edges) if (par.has(K(e.from)) && par.has(K(e.to))) par.set(find(K(e.from)), find(K(e.to)));
            const groups = new Map(); for (const x of rest) { const r = find(K(x)); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(x); }
            [...groups.values()].forEach((c, k) => blob(v, s, c.map((x) => [G.node(x).x, G.node(x).y]), 22, { color: COMP[k % COMP.length], alpha: 0.12 }));
          }
          const cur = f.type !== 'done' && f.type !== 'init' ? K(f.u) : null;
          G.draw({
            nodeFill: (id) => (K(id) === cur ? 'gold' : null),
            nodeColor: (id) => (f.d[K(id)] != null ? 'accent' : null),
            nodeRing: (id) => (f.cut.has(K(id)) ? 'red' : null),
            nodeNote: (id) => (f.d[K(id)] != null ? `${f.d[K(id)]}/${f.low[K(id)]}` : null), noteColor: (id) => (f.cut.has(K(id)) ? 'red' : 'muted'),
            edgeColor: (e) => (f.bridges.has(e) ? 'red' : f.blockOf.has(e) ? COMP[f.blockOf.get(e) % COMP.length] : e === f.edge ? 'gold' : null),
            edgeWidth: (e) => (f.bridges.has(e) ? 4.4 : f.blockOf.has(e) ? 3 : e === f.edge ? 3.4 : null),
            dim: gone != null ? [gone] : [],
          });
          info = { f, base: countComps(G), cutB: ids(G).filter((x) => countComps(G, x) > countComps(G)), brB: G.edges.filter((e) => countComps(G, null, e) > countComps(G)), after: gone != null ? countComps(G, gone) : null };
        });
        v.legend([['red', 'cut vertex (ring) / bridge'], ['blue', 'blocks: one colour each'], ['gold', 'current', { dot: true }]]);
        v.readout(() => {
          const { f, base, cutB, brB, after } = info; if (!f) return '';
          const test = gone != null ? ` · removing **${G.lab(gone)}** leaves ${plural(after, 'piece')} (was ${base}) — ${after > base ? 'a cut vertex' : 'not a cut vertex'} ${(after > base) === f.cut.has(K(gone)) || f.type !== 'done' ? '✓' : '✗'}` : '';
          if (f.type !== 'done') return `${plural(f.nb, 'block')} popped so far${test}`;
          const cs = [...f.cut].sort().join(', '), sameC = cutB.length === f.cut.size && cutB.every((x) => f.cut.has(K(x))), sameB = brB.length === f.bridges.size && brB.every((e) => f.bridges.has(e));
          return `low values: cut vertices {${cs}}, ${plural(f.bridges.size, 'bridge')}, ${plural(f.nb, 'block')} · brute force (delete each vertex / edge and count components): cut vertices ${sameC ? '✓' : '✗'}, bridges ${sameB ? '✓' : '✗'}${test}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.19
    {
      num: '8.19',
      kind: 'Algorithm',
      name: 'Tarjan’s strongly connected components algorithm',
      statement: String.raw`**Algorithm.** Run one DFS that numbers vertices in discovery order, $d[u]$, and pushes each vertex onto a stack $S$ when it is discovered. Maintain $\mathrm{low}[u]$, the smallest number reachable from $u$'s subtree by tree edges followed by at most one edge to a vertex still on $S$. When $\mathrm{Visit}(u)$ ends with $\mathrm{low}[u]=d[u]$, pop $S$ down to and including $u$: the popped vertices form one strongly connected component. Components are output in **reverse topological order** of $G^{\mathrm{SCC}}$ (sinks first), and the algorithm runs in $O(n+m)$ time with a single pass over the graph.`,
      idea: String.raw`The first vertex DFS discovers in a component $C$, its **root**, has all of $C$ in its subtree (white-path theorem, 8.9). By the time the root finishes, every component that $C$ can reach has already been completed and popped. So the vertices above the root on the stack are exactly those of $C$. $\mathrm{low}[u]=d[u]$ says that nothing in $u$'s subtree reaches a vertex still on the stack that was discovered before $u$, which is exactly the condition for $u$ to be a root. Edges into components that have already been popped are ignored, because those components are finished and cannot lead back. The low-value bookkeeping is the same as for cut vertices (8.18), applied to a directed graph.`,
      caption: String.raw`Step through the single DFS. Notes show $d/\mathrm{low}$, and the panel below shows the stack $S$ (bottom on the left) and the components popped so far, numbered in the order found. When a vertex finishes with $\mathrm{low}=d$, the top of the stack down to it is popped and coloured. Sinks come out first. Click two vertices to add or remove an edge. The readout checks the components against brute force and checks that they come out in reverse topological order.`,
      deps: ['algo-8.15', 'algo-8.18'],
      refs: ['Erickson Ch. 6'],
      tags: ['graphs', 'connectivity'],
      credit: 'Tarjan, 1972',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320 });
        const sq = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P819, { c: { notePos: 's' }, e: { notePos: 's' }, h: { notePos: 's' }, i: { notePos: 's' }, j: { notePos: 's' }, k: { notePos: 's' } }), edges: E819.map(([a, b]) => [a, b]) });
        G.onChange = () => S.reset({ at: 'end' });
        const S = v.steps({ frames: () => tarjanTrace(G).events, code: TARJAN_CODE, codeTitle: 'Tarjan(G)', codePos: 'below', speed: 2, start: 20, still: 20 });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.d) return;
          const onS = new Set(f.S.map(K)), call = new Set((f.call || []).map(K)), cur = f.type !== 'done' && f.type !== 'init' ? K(f.u) : null, cc = (x) => TC[f.compOf[K(x)] % COMP.length];
          G.draw({
            nodeFill: (id) => (K(id) === cur ? 'gold' : f.compOf[K(id)] != null ? cc(id) : null),
            nodeColor: (id) => (onS.has(K(id)) ? (call.has(K(id)) ? 'orange' : 'purple') : null),
            nodeNote: (id) => (f.d[K(id)] != null ? `${f.d[K(id)]}/${f.low[K(id)]}` : null), noteColor: (id) => (f.compOf[K(id)] != null ? cc(id) : onS.has(K(id)) ? 'orange' : 'muted'),
            edgeColor: (e) => (e === f.edge ? (f.type === 'deadedge' ? 'faint' : 'gold') : f.compOf[K(e.from)] != null && f.compOf[K(e.from)] === f.compOf[K(e.to)] ? cc(e.from) : null),
            edgeWidth: (e) => (e === f.edge ? 3.8 : f.compOf[K(e.from)] != null && f.compOf[K(e.from)] === f.compOf[K(e.to)] ? 2.6 : null),
          });
          const W = sq.width;
          strip(sq, f.S.map((x) => ({ label: G.lab(x), color: call.has(K(x)) ? 'orange' : 'purple', note: `${f.d[K(x)]}/${f.low[K(x)]}` })), 12, 40, { title: 'stack S', titleW: 90, w: 30, h: 26, maxW: W - 24, empty: 'empty' });
          T(sq, 'popped', 12, 134, { size: 12, weight: 600, color: 'muted' });
          let X = 102; f.comps.forEach((c, k) => { const txt = `#${k + 1} {${c.map((x) => G.lab(x)).join(' ')}}`, w = 14 + 7.4 * txt.length; if (X + w > W - 8) return; R(sq, X, 122, X + w, 146, { fill: TC[k % COMP.length], fillAlpha: 0.85, color: TC[k % COMP.length], radius: 5 }); T(sq, txt, X + w / 2, 134.5, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false }); X += w + 6; });
          if (!f.comps.length) T(sq, 'none yet', 102, 134, { size: 12, color: 'faint' });
          if (f.type === 'done') {
            const br = sccBrute(G), same = br.comps.length === f.comps.length && f.comps.every((c) => c.every((x) => br.compOf[K(x)] === br.compOf[K(c[0])]));
            const revTopo = G.edges.every((e) => f.compOf[K(e.from)] >= f.compOf[K(e.to)]);
            info = { f, same, revTopo };
          } else info = { f };
        });
        v.legend([['gold', 'current vertex / edge', { dot: true }], ['orange', 'on S and on the call stack', { dot: true }], ['purple', 'on S, call finished', { dot: true }], ['blue', 'popped component', { dot: true }]]);
        v.readout(() => {
          const { f, same, revTopo } = info; if (!f) return '';
          if (f.type !== 'done') return `${plural(f.comps.length, 'component')} popped · stack S holds ${f.S.length} · every vertex on S has low ≤ its own number ${f.S.every((x) => f.low[K(x)] <= f.d[K(x)]) ? '✓' : '✗'}`;
          return `${plural(f.comps.length, 'component')} · brute force (mutual reachability) agrees ${same ? '✓' : '✗'} · every edge between components runs from a later-found to an earlier-found component, so the order found is reverse topological ${revTopo ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.20
    {
      num: '8.20',
      kind: 'Algorithm',
      name: 'Euler tours in linear time (Hierholzer)',
      statement: String.raw`An **Euler tour** of a graph is a closed walk that uses every edge exactly once; an **Euler path** is such a walk that need not be closed. **Theorem (Euler, Hierholzer).** A connected undirected graph (ignoring isolated vertices) has an Euler tour if and only if every vertex has even degree, and an Euler path if and only if at most two vertices have odd degree; the path then starts and ends at those two.

**Algorithm (Hierholzer).** Keep a stack $S$, starting with $\langle s\rangle$. Look at the top vertex $u$: if it has an unused edge $uw$, mark the edge used and push $w$; otherwise pop $u$ and append it to the tour $T$. When $S$ is empty, $T$ read backwards is an Euler tour (or path). With an index into each adjacency list this takes $O(n+m)$ time.`,
      idea: String.raw`Every time a walk passes through a vertex it uses two of its edges, so a closed walk needs even degrees everywhere, and an open one needs them everywhere except at its ends. For the converse, start walking from $s$ along unused edges. When every degree is even, the walk can only get stuck back at $s$, since every other vertex it enters has an unused edge to leave by. If unused edges remain, some vertex on the walk still has one (the graph is connected); walk a sub-tour from there and splice it in. The stack does this splicing automatically: popping exhausted vertices backs up along the walk to the first vertex with an unused edge, and the sub-tour walked from there ends up inserted at that point of $T$.`,
      caption: String.raw`Step through Hierholzer's algorithm. The first closed walk is drawn in blue, and each later sub-tour, started from a vertex of the walk that still has unused edges, gets its own colour. At the end every edge carries its position in the tour. The strip below shows the stack and the tour built so far. Click two vertices to add or remove an edge, or empty space to add a vertex. A vertex of odd degree gets a red ring: with exactly two of them the algorithm traces an Euler path between them, and with more it cannot cover every edge.`,
      deps: ['algo-8.1', 'algo-8.7'],
      refs: ['CLRS 4e Prob. 20-3', 'Erickson Ch. 6'],
      tags: ['graphs'],
      credit: 'Euler, 1736 (Königsberg bridges); Hierholzer, 1873',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6.2], axes: false, equal: true, height: 320 });
        const sq = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const G = v.graph(s, { layout: 'none', editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true }, nodes: nodesAt(P820, { a: { notePos: 'w' }, c: { notePos: 's' }, d: { notePos: 's' }, h: { notePos: 'e' } }), edges: E820.map(([a, b]) => [a, b]) });
        const odd = () => ids(G).filter((x) => G.degree(x) % 2 === 1);
        const startV = () => { const o = odd(); if (o.length === 2) return o[0]; const withE = ids(G).find((x) => G.degree(x) > 0); return withE ?? ids(G)[0]; };
        G.onChange = () => S.reset({ at: 'end' });
        const S = v.steps({ frames: () => (G.nodes.length ? hierholzer(G, startV()) : []), code: HIER_CODE, codeTitle: 'Hierholzer(G)', codePos: 'below', speed: 2.5, start: 'end', still: 'end' });
        const SUB = ['blue', 'orange', 'purple', 'teal', 'pink', 'green'];
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.used) { G.draw(); return; }
          const o = new Set(odd().map(K)), tour = f.done ? f.tour.slice().reverse() : null, pos = new Map();
          if (tour) for (let k = 0; k + 1 < tour.length; k++) { const e = G.edges.find((q) => !pos.has(q) && ((K(q.from) === K(tour[k]) && K(q.to) === K(tour[k + 1])) || (K(q.to) === K(tour[k]) && K(q.from) === K(tour[k + 1])))); if (e) pos.set(e, k + 1); }
          G.draw({
            nodeFill: (id) => (K(id) === K(f.u) && !f.done ? 'gold' : null),
            nodeColor: (id) => (G.degree(id) ? 'accent' : null),
            nodeRing: (id) => (o.has(K(id)) ? 'red' : null),
            nodeNote: (id) => `deg ${G.degree(id)}`, noteColor: (id) => (o.has(K(id)) ? 'red' : 'muted'),
            edgeColor: (e) => (f.used.has(e) ? SUB[f.used.get(e) % SUB.length] : null), edgeWidth: (e) => (e === f.edge ? 4.4 : f.used.has(e) ? 3 : null), edgeDash: (e) => !f.used.has(e) && f.done,
            edgeLabel: (e) => (pos.has(e) ? pos.get(e) : null),
          });
          const W = sq.width;
          strip(sq, f.stack.map((x, i) => ({ label: G.lab(x), color: 'orange', fill: i === f.stack.length - 1 ? 'gold' : null })), 12, 50, { title: 'stack S', titleW: 84, w: 28, h: 28, gap: 3, maxW: W - 24, empty: 'empty' });
          strip(sq, f.tour.map((x) => ({ label: G.lab(x), color: 'green', fill: 'green' })), 12, 120, { title: 'tour T', titleW: 84, w: 28, h: 28, gap: 3, maxW: W - 24, empty: 'empty' });
          let check = null;
          if (f.done) {
            const usedAll = G.edges.every((e) => f.used.has(e)), consec = pos.size === G.edges.length;
            check = { usedAll, consec, closed: tour.length > 1 && K(tour[0]) === K(tour[tour.length - 1]), len: tour.length - 1, tour };
          }
          info = { f, o: [...o], check };
        });
        v.legend([['blue', 'first walk'], ['orange', 'second sub-tour'], ['purple', 'third sub-tour'], ['red', 'odd degree (ring)', { dot: true }]]);
        v.readout(() => {
          const { f, o, check } = info; if (!f) return 'Add vertices and edges.';
          const parity = o.length ? `odd-degree vertices: {${o.map((x) => G.lab(x)).join(', ')}}` : 'every degree is even';
          if (!check) return `${parity} · ${G.edges.length - f.used.size} of ${G.edges.length} edges still unused`;
          const comps = countComps({ nodes: G.nodes.filter((n) => G.degree(n.id) > 0), edges: G.edges, isDirected: () => false }), conn = comps <= 1;
          if (check.usedAll && check.consec) return `${parity} · the walk ${check.tour.map((x) => G.lab(x)).join(' ')} uses all ${G.edges.length} edges once each ✓ and is ${check.closed ? '**closed: an Euler tour** ✓' : `**open: an Euler path** from ${G.lab(check.tour[0])} to ${G.lab(check.tour[check.tour.length - 1])}`}${!check.closed && o.length !== 2 ? ' ✗' : ''}`;
          return `${parity}${conn ? '' : ' and the edges are not connected'} · the walk covers only ${check.len} of ${G.edges.length} edges: ${o.length > 2 ? `more than two odd vertices — **no Euler path exists** ✓` : conn ? '✗' : 'no single walk can cover them ✓'}`;
        });
      },
    },
  ],
};
