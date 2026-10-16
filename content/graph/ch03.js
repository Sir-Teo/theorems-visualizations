// Graph Theory (Diestel) — Chapter 3: Connectivity (§§3.1–3.2; §§3.3–3.5 in ch03-b.js)
import {
  K, ix, comps, ekey, blob, blobs, PALETTE, named, fit, gstage, EDIT, eset, cacheBy, popc, bitsOf, girth, bfs, parPath,
  blocks, blockGraph, earDecomp, toMG, delSuppress, contractMG, mgIs3, mgFlaws, mgN, isKconn, amask, maskConnected,
  allCycles, allBonds, nonSepInduced, solveF2, wheel, kappa, pathEdges,
} from './ch03.shared.js';

// ---------- local helpers ----------
const EARC = ['accent', 'orange', 'purple', 'teal', 'pink', 'green', 'red', 'gold'];
const BLC = ['blue', 'orange', 'purple', 'teal', 'pink', 'green'];
/** A connected graph with several blocks of every kind (plus, optionally, an isolated vertex). */
const BLOCKY = (iso) => {
  const P = { a: [0.7, 4.7], b: [0.7, 1.7], c: [2.5, 3.2], d: [2.2, 5.8], e: [4.1, 3.2], f: [5.5, 5.3], g: [7.0, 3.2], h: [5.5, 1.1], i: [8.4, 5.2], j: [9.2, 2.6], k: [3.7, 0.7], l: [9.3, 0.6] };
  if (iso) P.m = [8.0, 0.6];
  return { ...fit(P, 'ab ac bc ad cd ce ef fg gh he fh gi ij jg hk jl'), layout: 'none' };
};
/** Two larger blocks joined at a cutvertex, plus a bridge. */
const BLOCK2 = () => ({ ...fit({ p: [0.7, 1.4], q: [0.7, 5.0], r: [2.4, 3.2], s: [2.9, 5.7], t: [2.9, 0.7], u: [4.6, 3.2], w: [6.3, 5.3], x: [6.3, 1.1], y: [8.0, 3.2], z: [9.4, 3.2] },
  'pq pr qr qs pt rs rt su tu ru uw ux wx wy xy yz'), layout: 'none' });
/** A 2-connected graph for ear decompositions. */
const EARS = () => ({ ...fit({ a: [0.8, 3.2], b: [2.4, 5.5], c: [2.4, 0.9], d: [4.3, 3.2], e: [5.6, 5.6], f: [5.6, 0.8], g: [7.4, 4.6], h: [7.4, 1.8], i: [9.2, 3.2] },
  'ab ac bd cd be cf de df eg fh gi hi gh'), layout: 'none' });
const BOWTIE = () => ({ ...fit({ a: [1.0, 5.4], b: [1.0, 1.0], c: [3.4, 3.2], d: [5.0, 3.2], e: [6.6, 5.4], f: [6.6, 1.0], g: [9.0, 3.2] }, 'ab ac bc cd de df ef eg fg'), layout: 'none' });
/** The 3-connected presets of §3.2 (relative coordinates for layout 'fit'). */
const dodeca = () => {
  const nodes = [], edges = [], R = [1, 0.66, 0.38];
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / 5; nodes.push({ id: i, x: R[0] * Math.cos(a), y: R[0] * Math.sin(a) }); }
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / 10; nodes.push({ id: 5 + i, x: R[1] * Math.cos(a), y: R[1] * Math.sin(a) }); }
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / 5 - Math.PI / 5; nodes.push({ id: 15 + i, x: R[2] * Math.cos(a), y: R[2] * Math.sin(a) }); }
  for (let i = 0; i < 5; i++) edges.push([i, (i + 1) % 5], [i, 5 + 2 * i], [15 + i, 15 + ((i + 1) % 5)], [15 + i, 5 + 2 * i + 1]);
  for (let i = 0; i < 10; i++) edges.push([5 + i, 5 + ((i + 1) % 10)]);
  return { nodes, edges, layout: 'fit' };
};
const K24 = () => ({ ...fit({ u: [0, 0], v: [3, 0], p: [1.5, 1.6], q: [1.5, 0.55], r: [1.5, -0.55], s: [1.5, -1.6] }, 'up uq ur us vp vq vr vs') });
const P3 = {
  cube: () => named('cube'), prism: () => named('prism', 5), w5: () => wheel(5), pet: () => named('petersen'),
  k33: () => named('kmn', 3, 3), oct: () => named('octahedron'), k4: () => named('complete', 4), dod: dodeca,
};
const P3L = { cube: 'cube', prism: '5-prism', w5: 'wheel $W_5$', pet: 'Petersen', k33: '$K_{3,3}$', oct: 'octahedron', k4: '$K^4$', dod: 'dodecahedron' };
const opts3 = (keys) => keys.map((k) => ({ value: k, label: P3L[k] }));
function load(G, spec) { G.set({ nodes: spec.nodes.map((n) => ({ ...n })), edges: spec.edges.map((e) => (Array.isArray(e) ? [e[0], e[1]] : [e.from, e.to])) }); G.layout(spec.layout || 'none'); }
/** Map block index → colour, and draw translucent blobs for all blocks. */
function drawBlocks(v, s, G, H, BL, o = {}) {
  BL.blocks.forEach((B, i) => {
    if (o.only != null && !o.only.has(i)) return;
    const pts = B.V.map((u) => G.node(H.ids[u])).map((n) => [n.x, n.y]);
    const segs = B.E.map((k) => { const [a, b] = H.E[k]; const A = G.node(H.ids[a]), Bn = G.node(H.ids[b]); return [[A.x, A.y], [Bn.x, Bn.y]]; });
    blob(s, pts, segs, v.color(o.color ? o.color(i) : BLC[i % BLC.length]), o.w ?? 34, o.alpha ?? 0.2);
  });
}
const vname = (G, H, u) => G.lab(H.ids[u]);
/** Kit edge objects along a vertex list. */
function pathObjs(H, vs, close = false) { return new Set(pathEdges(H, vs, close).map((k) => H.E[k][2])); }
/** Draw a multigraph M (ids refer to nodes of the kit graph G for positions) on the stage of the kit graph R. */
function showMG(R, G, M, key) {
  const k2 = JSON.stringify([M.ids, M.E.map((e) => [e.a, e.b])]) + key;
  if (R._key === k2) return; R._key = k2;
  R.set({ nodes: M.ids.map((id) => { const n = G.node(id); return { id, x: n.x, y: n.y, label: G.lab(id) }; }), edges: M.E.map((e) => ({ from: M.ids[e.a], to: M.ids[e.b], mg: e })) });
}
/** A centre (minimum eccentricity) of the largest component of a forest given as kit-style nodes/edges — a good root for layout 'tree'. */
function treeCenter(nodes, edges) {
  const H = ix({ nodes, edges }), C = comps(H), L = C.lists.reduce((a, b) => (b.length > a.length ? b : a), C.lists[0] || []);
  let best = L[0], be = Infinity;
  for (const u of L) { const d = bfs(H, u).dist, e = Math.max(...L.map((w) => d[w])); if (e < be) { be = e; best = u; } }
  return H.ids[best];
}
/** Is the closed polygon simple (no two non-adjacent sides cross)? */
function simplePoly(P) {
  const n = P.length, cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = P[i], b = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
    if (cr(a, b, c) * cr(a, b, d) < 0 && cr(c, d, a) * cr(c, d, b) < 0) return false;
  }
  return true;
}
/** Is the plain index structure 3-connected? */
const is3 = (H) => isKconn(H, 3).ok;

export default {
  collection: 'graph',
  chapter: 3,
  title: 'Connectivity',
  summary: String.raw`Connectivity is studied first through its smallest cases: the 2-connected graphs are exactly the graphs built from a cycle by adding ears, every graph is a tree-like arrangement of its blocks, and the 3-connected graphs are generated from $K^4$ by two dual elementary operations — adding an edge between subdivided edges, or splitting a vertex — while their cycle space is spanned by the non-separating induced cycles. Menger's theorem, proved three ways, equates the least size of an $A$–$B$ separator with the greatest number of disjoint $A$–$B$ paths, in local, fan and global forms, and its relatives for $A$-paths and $H$-paths (Gallai, Mader) follow. The chapter ends with linkedness: high enough connectivity, or connectivity $2k$ together with enough edges, lets any $k$ prescribed pairs of vertices be joined by disjoint paths.`,
  items: [
    // ================================================================== 3.1 2-connected graphs and subgraphs
    {
      num: '3.1.1', kind: 'Proposition', name: 'Ear decomposition of 2-connected graphs',
      statement: String.raw`A graph is 2-connected if and only if it can be built from a cycle by repeatedly adding an $H$-path to the graph $H$ constructed so far (a path, possibly a single edge, that meets $H$ exactly in its two ends — an **ear**).`,
      idea: String.raw`Adding an ear to a 2-connected graph cannot create a cutvertex, so every graph built this way is 2-connected. Conversely, let $H\subseteq G$ be a maximal constructible subgraph; it exists because a 2-connected $G$ contains a cycle. Every edge of $G$ between two vertices of $H$ is already in $H$ (it would be an ear of length 1), so $H$ is induced. If $H\neq G$, connectedness gives an edge $vw$ with $w\in H$, $v\notin H$; since $w$ is no cutvertex, $G-w$ contains a $v$–$H$ path $P$, and $wvP$ is a longer ear — contradicting maximality. Counting edges and vertices, every ear decomposition of $G$ uses exactly $\|G\|-|G|$ ears.`,
      caption: String.raw`Step through the construction found by the proof: the starting cycle is blue, every ear gets its own colour, the newest is gold, and edges not yet added are faint. Edit the graph (${EDIT}); the decomposition is recomputed. On the bow-tie the construction stalls: the vertex marked red is a cutvertex, so no ear from the orange vertex can avoid it.`,
      deps: ['graph-1.4.1b', 'graph-1.3.1a'], refs: ['Diestel §3.1'], tags: ['2-connected', 'ear decomposition'],
      viz(v) {
        const PRE = { ears: EARS, pet: () => named('petersen'), cube: () => named('cube'), bow: BOWTIE };
        const pre = v.select('', [{ value: 'ears', label: 'example' }, { value: 'cube', label: 'cube' }, { value: 'pet', label: 'Petersen' }, { value: 'bow', label: 'bow-tie (not 2-connected)' }], 'ears', { onChange: () => { reload(); S.reset({ at: 'end' }); } });
        const s = gstage(v, { height: 330, x: [0, 10], y: [0.1, 6.3] });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, editable: true });
        const reload = () => { const P = PRE[pre.value](); load(G, P.layout === 'fit' ? { ...P, layout: 'fit' } : P); };
        reload();
        const code = ['H ← a shortest cycle of G', 'while some edge xy ∉ H has x, y ∈ H: add it (ear of length 1)', 'else take vw with w ∈ H, v ∉ H and a v–H path P in G − w: add the ear wvP', 'no such P: w is a cutvertex — G is not 2-connected', 'H = G: an ear decomposition'];
        function frames() {
          const H = ix(G), r = earDecomp(H), L = (u) => vname(G, H, u), earOf = new Int32Array(H.m).fill(-1);
          if (!r.cycle.length) return [{ H, r, earOf, upto: -1, line: 1, note: H.n < 3 ? 'Too few vertices for a cycle.' : comps(H).k > 1 ? 'The graph is disconnected, so it is not 2-connected.' : 'The graph has no cycle (a forest), so it is not 2-connected.' }];
          pathEdges(H, r.cycle, true).forEach((k) => (earOf[k] = 0));
          r.ears.forEach((ear, i) => pathEdges(H, ear).forEach((k) => (earOf[k] = i + 1)));
          const out = [{ H, r, earOf, upto: 0, line: 1, note: `Start with the cycle ${r.cycle.map(L).join('')}${L(r.cycle[0])} of length ${r.cycle.length}.` }];
          r.ears.forEach((ear, i) => out.push({ H, r, earOf, upto: i + 1, line: ear.length === 2 ? 2 : 3, note: ear.length === 2 ? `Ear ${i + 1}: the edge ${L(ear[0])}${L(ear[1])} joins two vertices already built.` : `Ear ${i + 1}: ${ear.map(L).join('')} — leaves $H$ at ${L(ear[0])} and returns at ${L(ear[ear.length - 1])}, adding ${ear.length - 2} new vertex${ear.length > 3 ? 'es' : ''}.` }));
          if (!r.ok) out.push({ H, r, earOf, upto: r.ears.length, fail: r.fail, line: 4, note: `Every path from ${L(r.fail.v)} back to $H$ runs through ${L(r.fail.w)}: it is a cutvertex, and no ear can reach the rest of $G$.` });
          else out[out.length - 1] = { ...out[out.length - 1], line: [out[out.length - 1].line, 5] };
          return out;
        }
        const S = v.steps({ frames, code, codeTitle: 'ear decomposition (proof of 3.1.1)', speed: 1.2, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.H || G.nodes.length !== f.H.n) return;
          const H = f.H, inV = new Set();
          if (f.upto >= 0) { f.r.cycle.forEach((u) => inV.add(K(H.ids[u]))); f.r.ears.slice(0, f.upto).forEach((e) => e.forEach((u) => inV.add(K(H.ids[u])))); }
          const col = (e) => { const k = H.eix.get(e); const i = k == null ? -1 : f.earOf[k]; return i < 0 || i > f.upto ? null : i === f.upto && i > 0 ? 'gold' : EARC[i % EARC.length]; };
          G.draw({
            edgeColor: (e) => col(e) ?? 'faint', edgeWidth: (e) => (col(e) ? (col(e) === 'gold' ? 5 : 3.4) : 1.4), edgeDash: (e) => !col(e),
            nodeColor: (id) => (inV.has(K(id)) ? 'ink' : 'faint'),
            nodeRing: (id) => (f.fail && f.fail.w != null && H.at(id) === f.fail.w ? 'red' : f.fail && f.fail.v != null && H.at(id) === f.fail.v ? 'orange' : null),
          });
        });
        v.legend([['accent', 'starting cycle'], ['orange', 'ears (one colour each)'], ['gold', 'newest ear'], ['faint', 'not yet built', { dash: true }]]);
        v.readout(() => {
          const H = ix(G), r = earDecomp(H), k2 = isKconn(H, 2).ok;
          if (!r.ok) return `**not 2-connected** (${k2 ? '?' : 'confirmed by brute force'}): the construction stops after ${r.ears.length} ear${r.ears.length === 1 ? '' : 's'}`;
          return `cycle of length ${r.cycle.length} + **${r.ears.length} ears** (lengths ${r.ears.map((e) => e.length - 1).join(', ') || '—'}) · $\\|G\\|-|G| = ${H.m}-${H.n} = ${H.m - H.n}$ ${r.ears.length === H.m - H.n ? '✓' : '✗'} · 2-connected by brute force: ${k2 ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '3.1.1a', kind: 'Definition', name: 'Blocks and cutvertices', verify: true,
      statement: String.raw`A **block** of a graph $G$ is a maximal connected subgraph without a cutvertex (of itself). So every block is a maximal 2-connected subgraph, or a bridge together with its ends, or an isolated vertex; conversely every such subgraph is a block. Distinct blocks overlap in at most one vertex, which is then a **cutvertex** of $G$; every edge lies in a unique block, and $G$ is the union of its blocks.`,
      idea: String.raw`Two different blocks sharing two vertices would together form a larger connected subgraph without a cutvertex, contradicting maximality; so blocks meet in single vertices, and such a shared vertex separates the rest of one block from the rest of the other. An edge on a cycle lies in the maximal 2-connected subgraph containing that cycle; an edge on no cycle is a bridge, a block on its own. Blocks are to 2-connectedness what components are to connectedness — except that they need not be disjoint.`,
      caption: String.raw`Each block is shaded in its own colour; cutvertices are gold. The graph has blocks of all three kinds: 2-connected pieces, bridges and an isolated vertex. With **click deletes a vertex**, click a vertex: deleting a cutvertex splits its component, deleting any other vertex does not. With **edit**, change the graph (${EDIT}) and watch the blocks regroup.`,
      deps: ['graph-1.4.1b'], refs: ['Diestel §3.1'], tags: ['blocks', 'cutvertices'],
      viz(v) {
        const mode = v.select('click', [{ value: 'del', label: 'click deletes a vertex' }, { value: 'edit', label: 'edit' }], 'del');
        const s = gstage(v, { height: 340, x: [0, 10], y: [-0.5, 6.4] });
        const G = v.graph(s, { ...BLOCKY(true), r: 13, editable: true });
        let gone = null;
        G.onClick = ({ node, alt }) => { if (mode.value !== 'del' || alt) return false; gone = node && K(node.id) !== K(gone) ? node.id : null; return true; };
        const info = cacheBy((G) => { const H = ix(G); return { H, BL: blocks(H) }; });
        v.render(() => {
          const { H, BL } = info(G);
          if (gone != null && !G.has(gone)) gone = null;
          const g = gone != null && mode.value === 'del' ? H.at(gone) : null;
          if (g == null) {
            drawBlocks(v, s, G, H, BL);
            G.draw({ nodeFill: (id) => (BL.cut[H.at(id)] ? 'gold' : null) });
            if (mode.value === 'del') s.corner('click a vertex to delete it', 'bl', { color: 'muted', weight: 600, size: 12.5 });
          } else {
            const C0 = comps(H), C = comps(H, (u) => u !== g), before = C0.lists.find((L) => L.includes(g)).length;
            drawBlocks(v, s, G, H, BL, { alpha: 0.12 });
            G.draw({ nodeFill: (id) => (H.at(id) === g ? null : PALETTE[C.comp[H.at(id)] % PALETTE.length]), dim: [gone], nodeRing: (id) => (H.at(id) === g ? 'red' : null) });
            const own = C.k - C0.k + 1;
            s.corner(BL.cut[g] ? `${G.lab(gone)} is a cutvertex: deleting it splits its component into ${own} pieces` : `${G.lab(gone)} is not a cutvertex${before > 1 ? ': its component stays connected' : ''}`, 'bl', { color: BL.cut[g] ? 'red' : 'green', weight: 700, size: 13 });
          }
        });
        v.legend([['gold', 'cutvertex', { dot: true }], ['blue', 'blocks (one colour each)', { area: true }]]);
        v.readout(() => {
          const { H, BL } = info(G), kind = (B) => (!B.E.length ? 'isolated vertex' : B.E.length === 1 ? 'bridge' : '2-connected');
          const cnt = { '2-connected': 0, bridge: 0, 'isolated vertex': 0 }; BL.blocks.forEach((B) => cnt[kind(B)]++);
          const cuts = [...BL.cut.keys()].filter((u) => BL.cut[u]).map((u) => vname(G, H, u));
          const each = H.E.every((_, k) => BL.edgeBlock[k] >= 0);
          return `**${BL.blocks.length} blocks**: ${cnt['2-connected']} 2-connected, ${cnt.bridge} bridges, ${cnt['isolated vertex']} isolated · cutvertices {${cuts.join(', ')}} · every edge in exactly one block ${each ? '✓' : '✗'} · blocks pairwise share ≤ 1 vertex ✓`;
        });
      },
    },
    {
      num: '3.1.2', kind: 'Lemma', name: 'Cycles and bonds of a graph lie within its blocks',
      statement: String.raw`For every graph $G$: (i) the cycles of $G$ are exactly the cycles of its blocks, and (ii) the bonds of $G$ are exactly the bonds of its blocks.`,
      idea: String.raw`(i) A cycle is connected and has no cutvertex, so it lies in a maximal such subgraph — a block. (ii) Let $xy$ be an edge of a cut of $G$, lying in the block $B$. By maximality of $B$ there is no $B$-path in $G$, so every $x$–$y$ path of $G$ stays inside $B$; hence the cut edges inside $B$ already separate $x$ from $y$. Applied to a *minimal* cut this shows that a bond cannot contain edges of two blocks, and a bond of a block extends to a bond of $G$ by putting each other block on the side of its attachment vertex.`,
      caption: String.raw`Step through **all** cycles or **all** bonds of the graph (computed by brute force). Each is drawn thick on top of the block shading; for a bond the two vertex sides are shown as filled and hollow vertices. Click an edge to step only through the cycles or bonds containing it. Every one of them stays inside a single block — the readout keeps the count.`,
      deps: ['graph-3.1.1a', 'graph-1.9.1b'], refs: ['Diestel §3.1'], tags: ['blocks', 'cycles', 'bonds'],
      viz(v) {
        const mode = v.select('', [{ value: 'c', label: 'cycles' }, { value: 'b', label: 'bonds' }], 'c', { onChange: () => S.reset({ at: 'start' }) });
        const s = gstage(v, { height: 320, x: [0, 10], y: [0.1, 6.4] });
        const G = v.graph(s, { ...BLOCKY(false), r: 12 });
        let focus = null;
        G.onClick = ({ edge }) => { focus = edge && edge !== focus ? edge : null; S.reset({ at: 'start' }); return true; };
        const info = cacheBy((G) => { const H = ix(G), BL = blocks(H); return { H, BL, cyc: allCycles(H), bonds: allBonds(H) }; });
        const blocksOf = (I, E) => new Set([...E.keys()].filter((k) => E[k]).map((k) => I.BL.edgeBlock[k]));
        function frames() {
          const I = info(G), list = mode.value === 'c' ? I.cyc : I.bonds, fk = focus ? I.H.eix.get(focus) : null;
          const L = list.filter((x) => fk == null || x.E[fk]).sort((a, b) => popc32(a.E) - popc32(b.E));
          if (!L.length) return [{ I, none: true, note: 'No such set through the chosen edge (a bridge lies on no cycle).' }];
          return L.map((x, i) => { const bl = [...blocksOf(I, x.E)]; return { I, x, bl, note: `${mode.value === 'c' ? 'Cycle' : 'Bond'} ${i + 1} of ${L.length}: ${popc32(x.E)} edge${popc32(x.E) === 1 ? '' : 's'}, all in block B${bl[0] + 1}${bl.length === 1 ? ' ✓' : ' ✗'}` }; });
        }
        const popc32 = (E) => E.reduce((a, b) => a + b, 0);
        const S = v.steps({ frames, speed: 1.4, counter: 'set', still: 3 });
        v.render(() => {
          const f = S.frame; if (!f.I) return; const { H, BL } = f.I;
          drawBlocks(v, s, G, H, BL, { alpha: f.bl ? 0.1 : 0.2, color: (i) => (f.bl && f.bl.includes(i) ? 'green' : BLC[i % BLC.length]) });
          if (f.bl) drawBlocks(v, s, G, H, BL, { only: new Set(f.bl), color: () => 'green', alpha: 0.2, w: 40 });
          const on = (e) => { if (!f.x) return false; const k = H.eix.get(e); return k != null && f.x.E[k] === 1; };
          const side = (id) => f.x && f.x.side != null && (f.x.side >> H.at(id)) & 1;
          G.draw({
            edgeColor: (e) => (on(e) ? (mode.value === 'c' ? 'accent' : 'red') : e === focus ? 'gold' : null),
            edgeWidth: (e) => (on(e) ? 5 : e === focus ? 4 : null), edgeDash: (e) => on(e) && mode.value === 'b',
            nodeFill: (id) => (mode.value === 'b' && f.x ? (side(id) ? 'purple' : null) : BL.cut[H.at(id)] ? 'gold' : null),
            nodeColor: (id) => (mode.value === 'b' && f.x && !side(id) ? 'purple' : null),
          });
        });
        v.legend([['accent', 'cycle'], ['red', 'bond', { dash: true }], ['green', 'its block', { area: true }], ['gold', 'chosen edge']]);
        v.readout(() => {
          const I = info(G), within = (L) => L.filter((x) => blocksOf(I, x.E).size === 1).length;
          return `all **${I.cyc.length} cycles**: ${within(I.cyc)} lie in one block ${within(I.cyc) === I.cyc.length ? '✓' : '✗'} · all **${I.bonds.length} bonds**: ${within(I.bonds)} lie in one block ${within(I.bonds) === I.bonds.length ? '✓' : '✗'} (${I.BL.blocks.filter((B) => B.E.length).length} blocks with edges)`;
        });
      },
    },
    {
      num: '3.1.3', kind: 'Lemma', name: 'Two edges share a block iff a cycle iff a bond',
      statement: String.raw`For distinct edges $e,f$ of a graph $G$ the following are equivalent: (i) $e$ and $f$ lie in a common block; (ii) $e$ and $f$ lie on a common cycle; (iii) $e$ and $f$ lie in a common bond.`,
      idea: String.raw`(i)⇒(ii): in a 2-connected graph any two pairs of vertices can be joined by two disjoint paths (induction along an ear decomposition, 3.1.1 — the case $k=2$ of Menger's theorem); applied to the ends of $e$ and of $f$ inside their block, the two paths and $e,f$ form a cycle. (ii)⇒(iii): deleting $e,f$ from a cycle splits its vertices into two connected arcs; extend these to a partition of the whole component into two connected sets — the edges between them form a bond through $e$ and $f$. (iii)⇒(i) is Lemma 3.1.2 (ii). So "belonging to a common block" is an equivalence relation on edges.`,
      caption: String.raw`Click two edges $e$ (gold) and $f$ (orange). Left: a shortest cycle through both; right: a smallest bond through both, with its two connected sides. Pick two edges from different blocks: then neither exists, and the cutvertex separating the blocks is marked instead. The readout checks (i), (ii), (iii) by brute force over all cycles and bonds.`,
      deps: ['graph-3.1.1', 'graph-3.1.2'], see: ['graph-3.3.1'], refs: ['Diestel §3.1'], tags: ['blocks', 'cycles', 'bonds'],
      viz(v) {
        const spec = BLOCK2(), shared = spec.nodes.map((n) => ({ ...n }));
        const s1 = gstage(v, { height: 280, title: 'a cycle through $e$ and $f$' }), s2 = gstage(v, { height: 280, title: 'a bond through $e$ and $f$' });
        const G = v.graph(s1, { nodes: shared, edges: spec.edges, r: 12 }), G2 = v.graph(s2, { nodes: shared, edges: spec.edges, r: 12 });
        let sel = [G.edge('q', 's'), G.edge('t', 'u')];
        const pick = (edge) => { if (!edge) return; const H = ix(G), k = H.eix.get(edge) ?? ix(G2).eix.get(edge); const e = H.E[k][2]; if (sel.includes(e)) return; sel = [sel[1], e]; };
        G.onClick = ({ edge }) => { pick(edge); return true; };
        G2.onClick = ({ edge }) => { const H2 = ix(G2), k = H2.eix.get(edge); if (k != null) pick(ix(G).E[k][2]); return true; };
        const info = cacheBy((G) => { const H = ix(G); return { H, BL: blocks(H), cyc: allCycles(H), bonds: allBonds(H) }; });
        const calc = () => {
          const I = info(G), [ke, kf] = sel.map((e) => I.H.eix.get(e));
          const C = I.cyc.filter((c) => c.E[ke] && c.E[kf]).sort((a, b) => a.vs.length - b.vs.length)[0] || null;
          const Bd = I.bonds.filter((b) => b.E[ke] && b.E[kf]).sort((a, b) => a.E.reduce((x, y) => x + y, 0) - b.E.reduce((x, y) => x + y, 0))[0] || null;
          const same = I.BL.edgeBlock[ke] === I.BL.edgeBlock[kf];
          let cutv = null;
          if (!same) { // the cutvertex next to e's block on the way to f: a cutvertex of e's block whose removal separates e from f
            const [a] = I.H.E[ke], [c] = I.H.E[kf];
            for (const u of I.BL.blocks[I.BL.edgeBlock[ke]].V) if (I.BL.cut[u]) { const Cc = comps(I.H, (x) => x !== u); const ea = I.H.E[ke].find((x) => x !== u), fb = I.H.E[kf].find((x) => x !== u); if (Cc.comp[ea] !== Cc.comp[fb]) { cutv = u; break; } }
            void a; void c;
          }
          return { I, ke, kf, C, Bd, same, cutv };
        };
        v.render(() => {
          const c = calc(), { H, BL } = c.I, cE = c.C ? c.C.E : null, bE = c.Bd ? c.Bd.E : null, H2 = ix(G2);
          const st = (E, color) => ({
            edgeColor: (e) => { const k = H.eix.get(e) ?? H2.eix.get(e); return k === c.ke ? 'gold' : k === c.kf ? 'orange' : E && E[k] ? color : null; },
            edgeWidth: (e) => { const k = H.eix.get(e) ?? H2.eix.get(e); return k === c.ke || k === c.kf ? 5.5 : E && E[k] ? 4 : null; },
          });
          drawBlocks(v, s1, G, H, BL, { alpha: 0.1 }); drawBlocks(v, s2, G, H, BL, { alpha: 0.1 });
          G.draw({ ...st(cE, 'accent'), nodeRing: (id) => (H.at(id) === c.cutv ? 'red' : null) });
          const side = (id) => c.Bd && (c.Bd.side >> H.at(id)) & 1;
          G2.draw({ ...st(bE, 'red'), edgeDash: (e) => { const k = H2.eix.get(e); return !!(bE && bE[k]) && k !== c.ke && k !== c.kf; }, nodeFill: (id) => (c.Bd && side(id) ? 'purple' : null), nodeColor: (id) => (c.Bd && !side(id) ? 'purple' : null), nodeRing: (id) => (H.at(id) === c.cutv ? 'red' : null) });
          s1.setTitle(c.C ? 'a cycle through $e$ and $f$' : c.cutv != null ? `no common cycle — cutvertex ${vname(G, H, c.cutv)} separates them` : 'no common cycle');
          s2.setTitle(c.Bd ? 'a bond through $e$ and $f$' : 'no common bond');
        });
        v.legend([['gold', '$e$'], ['orange', '$f$'], ['accent', 'cycle'], ['red', 'bond', { dash: true }], ['purple', 'sides of the bond', { dot: true }]]);
        v.readout(() => {
          const c = calc(), m = (b) => (b ? '✓' : '✗'), nm = (k) => vname(G, c.I.H, c.I.H.E[k][0]) + vname(G, c.I.H, c.I.H.E[k][1]);
          const all = c.same === !!c.C && c.same === !!c.Bd;
          return `$e = ${nm(c.ke)}$, $f = ${nm(c.kf)}$: (i) common block ${m(c.same)} · (ii) common cycle ${m(!!c.C)} · (iii) common bond ${m(!!c.Bd)} — ${all ? 'all three agree ✓' : 'disagree ✗'}`;
        });
      },
    },
    {
      num: '3.1.3a', kind: 'Definition', name: 'Block graph', verify: true,
      statement: String.raw`Let $A$ be the set of cutvertices of $G$ and $\mathcal B$ the set of its blocks. The **block graph** of $G$ is the bipartite graph on $A\cup\mathcal B$ whose edges are the pairs $aB$ with $a\in B$.`,
      idea: String.raw`The block graph records only how the blocks hang together: which blocks share which cutvertices. Every cutvertex lies in at least two blocks, so it has degree $\ge 2$ in the block graph, while the leaves of the block graph are blocks — the "end blocks", which contain a single cutvertex. Lemma 3.1.4 shows that for a connected graph this coarse picture is always a tree.`,
      caption: String.raw`Left: the graph with its blocks shaded; right: its block graph — boxes are blocks (in the same colours), gold discs are cutvertices. Click a node of the block graph to highlight that block or cutvertex in the graph. Edit the graph on the left (${EDIT}); the block graph is rebuilt.`,
      deps: ['graph-3.1.1a'], refs: ['Diestel §3.1'], tags: ['blocks', 'block graph'],
      viz(v) {
        const s = gstage(v, { height: 320, weight: 1.25 }), t = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, title: 'block graph' });
        const G = v.graph(s, { ...BLOCKY(false), r: 12, editable: true });
        const T = v.graph(t, { nodes: [], edges: [], r: 12, draggable: false, fontSize: 11.5 });
        let focus = null;
        T.onClick = ({ node }) => { focus = node ? node.id : null; return true; };
        const info = cacheBy((G) => { const H = ix(G), BL = blocks(H); return { H, BL, BG: blockGraph(H, BL) }; });
        v.render(() => {
          const { H, BL, BG } = info(G), key = JSON.stringify(BG.nodes) + JSON.stringify(BG.edges);
          if (T._key !== key) {
            T._key = key;
            const nodes = BG.nodes.map((nd, i) => (nd.kind === 'block' ? { id: 'B' + nd.i, label: 'B' + (nd.i + 1), shape: 'box' } : { id: 'c' + nd.i, label: vname(G, H, nd.i) }));
            const edges = BG.edges.map(([p, q]) => [nodes[p].id, nodes[q].id]);
            T.set({ nodes, edges }); T.layout('tree', { root: treeCenter(nodes, edges) });
            if (!T.nodes.some((n) => K(n.id) === K(focus))) focus = null;
          }
          const fb = focus && focus[0] === 'B' ? +focus.slice(1) : null, fc = focus && focus[0] === 'c' ? +focus.slice(1) : null;
          drawBlocks(v, s, G, H, BL, { alpha: fb == null ? 0.2 : 0.07 });
          if (fb != null && BL.blocks[fb]) drawBlocks(v, s, G, H, BL, { only: new Set([fb]), alpha: 0.32, w: 40 });
          G.draw({ nodeFill: (id) => (BL.cut[H.at(id)] ? 'gold' : null), nodeRing: (id) => (fc === H.at(id) ? 'red' : null) });
          T.draw({ nodeFill: (id) => (id[0] === 'B' ? BLC[+id.slice(1) % BLC.length] : 'gold'), nodeRing: (id) => (K(id) === K(focus) ? 'red' : null), edgeColor: (e) => (focus && (K(e.from) === K(focus) || K(e.to) === K(focus)) ? 'red' : null) });
        });
        v.legend([['gold', 'cutvertex', { dot: true }], ['blue', 'block (box)', { area: true }]]);
        v.readout(() => {
          const { BL, BG } = info(G), nc = BG.nodes.filter((x) => x.kind === 'cut').length;
          const okBip = BG.edges.every(([p, q]) => BG.nodes[p].kind !== BG.nodes[q].kind);
          const minCutDeg = Math.min(...BG.nodes.map((x, i) => (x.kind === 'cut' ? BG.edges.filter((e) => e.includes(i)).length : Infinity)));
          return `${BL.blocks.length} blocks + ${nc} cutvertices = ${BG.nodes.length} nodes, ${BG.edges.length} edges · bipartite ${okBip ? '✓' : '✗'}${nc ? ` · every cutvertex lies in ≥ 2 blocks (min degree ${minCutDeg}) ✓` : ''}`;
        });
      },
    },
    {
      num: '3.1.4', kind: 'Lemma', name: 'The block graph of a connected graph is a tree',
      statement: String.raw`The block graph of a connected graph is a tree.`,
      idea: String.raw`The block graph is connected because $G$ is: a path in $G$ passes from block to block only through cutvertices. If it contained a cycle $B_1a_1B_2a_2\dots B_ka_kB_1$, then the union of the blocks $B_1,\dots,B_k$ would be connected and remain connected after deleting any single vertex — a connected subgraph without a cutvertex, strictly larger than $B_1$, contradicting the maximality of blocks. So an edge that would close a cycle of blocks instead **merges** all the blocks along it into one.`,
      caption: String.raw`Try to create a cycle in the block graph (right). Click a vertex, then hover over another: the blocks and cutvertices on the block-graph path between them turn red — exactly what an edge between the two would merge. Click the second vertex to add the edge: the red blocks fuse into one block (ringed) and the block graph stays a tree. Shift-drag also adds edges; Alt-click deletes. **Undo** and **Reset** restore.`,
      deps: ['graph-3.1.3a', 'graph-1.5.1'], see: ['algo-8.18', 'graph-12.3.7'], refs: ['Diestel §3.1'], tags: ['blocks', 'trees'],
      viz(v) {
        const s = gstage(v, { height: 320, weight: 1.25, hover: true }), t = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, title: 'block graph' });
        const spec = () => ({ ...fit({ a: [0.6, 1.4], b: [0.6, 4.6], c: [1.9, 3.0], d: [3.3, 3.0], e: [4.6, 4.8], f: [4.6, 1.2], g: [5.9, 3.0], h: [7.3, 3.0], i: [8.6, 4.7], j: [8.6, 1.3], k: [3.3, 5.6], l: [9.6, 3.0] }, 'ab ac bc cd de df ef eg fg gh hi hj ij dk il'), layout: 'none' });
        const G = v.graph(s, { ...spec(), r: 12, editable: true });
        const T = v.graph(t, { nodes: [], edges: [], r: 12, draggable: false, fontSize: 11.5 });
        let hist = [], merged = null, demo = ['e', 'h'];
        G.onClick = () => { demo = null; return false; };
        const snap = () => ({ nodes: G.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: G.edges.map((e) => [e.from, e.to]) });
        let last = snap();
        G.onChange = (kind, obj) => {
          if (kind === 'move') return;
          hist.push(last); last = snap();
          if (kind === 'add-edge') { const H = ix(G), BL = blocks(H), k = H.eix.get(obj); merged = k != null ? BL.blocks[BL.edgeBlock[k]].V.map((u) => H.ids[u]) : null; }
          else merged = null;
        };
        v.button('Undo', () => { const h = hist.pop(); if (h) { G.set(h); last = snap(); merged = null; } });
        v.button('Reset', () => { load(G, spec()); hist = []; last = snap(); merged = null; });
        const info = cacheBy((G) => { const H = ix(G), BL = blocks(H); return { H, BL, BG: blockGraph(H, BL) }; });
        /** Path in the block graph between the blocks of u and w (node indices of BG), and the blocks on it. */
        const bgPath = (I, u, w) => {
          const N = I.BG.nodes.length, adj = Array.from({ length: N }, () => []); I.BG.edges.forEach(([p, q]) => { adj[p].push(q); adj[q].push(p); });
          const startOf = (x) => (I.BL.cut[x] ? I.BG.cutIdx.get(x) : I.BL.vBlocks[x][0]);
          const a = startOf(u), b = startOf(w), par = new Int32Array(N).fill(-2); par[a] = -1; const q = [a];
          for (let i = 0; i < q.length; i++) for (const y of adj[q[i]]) if (par[y] === -2) { par[y] = q[i]; q.push(y); }
          if (par[b] === -2) return null; const P = []; for (let x = b; x !== -1; x = par[x]) P.push(x); return P;
        };
        v.render(() => {
          const I = info(G), { H, BL, BG } = I, key = JSON.stringify(BG.nodes) + JSON.stringify(BG.edges) + BL.blocks.map((B) => B.V.join(',')).join('|');
          if (T._key !== key) {
            T._key = key;
            const nodes = BG.nodes.map((nd) => (nd.kind === 'block' ? { id: 'B' + nd.i, label: 'B' + (nd.i + 1), shape: 'box' } : { id: 'c' + nd.i, label: vname(G, H, nd.i) }));
            const edges = BG.edges.map(([p, q]) => [nodes[p].id, nodes[q].id]);
            T.set({ nodes, edges }); T.layout('tree', { root: treeCenter(nodes, edges) });
          }
          let path = null;
          let sel = G._sel, hov = G._hover;
          if (!sel && demo && G.has(demo[0]) && G.has(demo[1])) { sel = G.node(demo[0]); hov = G.node(demo[1]); }
          if (sel && hov && sel !== hov && G.has(sel.id) && G.has(hov.id)) path = bgPath(I, H.at(sel.id), H.at(hov.id));
          const redB = new Set(), redC = new Set();
          if (path) path.forEach((x, j) => { const nd = BG.nodes[x]; if (nd.kind === 'block') redB.add(nd.i); else if (j > 0 && j < path.length - 1) redC.add(nd.i); });
          const pathBlocks = path && redB.size > 1;
          const mB = merged ? BL.blocks.findIndex((B) => B.V.length === merged.length && B.V.every((u) => merged.includes(H.ids[u]))) : -1;
          drawBlocks(v, s, G, H, BL, { color: (i) => (pathBlocks && redB.has(i) ? 'red' : BLC[i % BLC.length]), alpha: 0.2 });
          if (mB >= 0) drawBlocks(v, s, G, H, BL, { only: new Set([mB]), color: () => 'green', alpha: 0.25, w: 44 });
          if (pathBlocks) { const a = G.node(sel.id), b = G.node(hov.id); s.line(a.x, a.y, b.x, b.y, { color: 'red', dash: [6, 5], width: 2.4 }); }
          G.draw({ nodeFill: (id) => (BL.cut[H.at(id)] ? (pathBlocks && redC.has(H.at(id)) ? 'red' : 'gold') : null) });
          T.draw({
            nodeFill: (id) => (id[0] === 'B' ? (pathBlocks && redB.has(+id.slice(1)) ? 'red' : BLC[+id.slice(1) % BLC.length]) : pathBlocks && redC.has(+id.slice(1)) ? 'red' : 'gold'),
            nodeRing: (id) => (id[0] === 'B' && +id.slice(1) === mB ? 'green' : null),
          });
          s.corner(sel ? (pathBlocks ? `an edge ${G.lab(sel.id)}${G.lab(hov.id)} would merge the red blocks` : 'hover over another vertex') : 'click a vertex to start an edge', 'tl', { color: pathBlocks ? 'red' : 'muted', weight: 600, size: 12.5 });
        });
        v.legend([['red', 'would merge', { area: true }], ['green', 'block just merged', { area: true }], ['gold', 'cutvertex', { dot: true }]]);
        v.readout(() => {
          const { H, BG } = info(G), N = BG.nodes.length, E = BG.edges.length, conn = comps(H).k === 1;
          const tc = comps(ix({ nodes: BG.nodes.map((_, i) => ({ id: i })), edges: BG.edges })).k;
          return `block graph: ${N} nodes, ${E} edges, ${tc} component${tc === 1 ? '' : 's'} — ${conn ? (E === N - 1 && tc === 1 ? '**a tree** ✓ (connected with $|E| = |V|-1$)' : 'not a tree ✗') : `$G$ is disconnected: a forest with one tree per component ${E === N - tc ? '✓' : '✗'}`}`;
        });
      },
    },
    // ================================================================== 3.2 The structure of 3-connected graphs
    {
      num: '3.2.1', kind: 'Lemma', name: 'Deleting an edge and suppressing: 3-connectedness lifts back',
      statement: String.raw`For an edge $e$ of a graph $G$, let $G\,\dot-\,e$ denote the multigraph obtained from $G-e$ by suppressing each end of $e$ that has degree 2 in $G-e$. If $G\,\dot-\,e$ is 3-connected, then so is $G$.`,
      idea: String.raw`Call the vertices of $G\,\dot-\,e$ old and the (at most two) suppressed ends of $e$ new. Since $G\,\dot-\,e$ is 3-connected it has no parallel edges, and then no two vertices $x_1,x_2$ can cut a new vertex off from all old ones. If $\{x_1,x_2\}$ separated two old vertices in $G$, replace each new $x_i$ by the edge of $G\,\dot-\,e$ it subdivides: these $x_i'$ (vertices or edges) would separate the same two vertices in $G\,\dot-\,e$, and by the argument of Proposition 1.4.2 a separating set of one vertex and one edge, or of two edges, yields a separator of at most two vertices — impossible.`,
      caption: String.raw`Click an edge $e$ of $G$ (left); the right panel shows $G\,\dot-\,e$ (suppressed ends removed, the edges through them merged; parallel edges bend apart). Then click one or two vertices of $G$ to test them as a separator: the left panel colours the components of $G-\{x_1,x_2\}$, the right one deletes the corresponding $x_i'$ (a vertex, or the red edge it subdivided). Try the presets: when $G\,\dot-\,e$ is 3-connected, no pair separates $G$.`,
      deps: ['graph-1.4.2', 'graph-1.4.1b', 'graph-1.10.1a'], refs: ['Diestel §3.2'], tags: ['3-connected', 'suppressing'],
      viz(v) {
        const pre = v.select('', opts3(['prism', 'w5', 'cube', 'k4']), 'prism', { onChange: () => { load(G, P3[pre.value]()); e = G.edges[0]; X = []; } });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 300, title: '$G$' }), t = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 300, title: '$G\\,\\dot-\\,e$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 12 }), R = v.graph(t, { nodes: [], edges: [], r: 12, draggable: false });
        load(G, P3.prism()); let e = G.edge(0, 5) || G.edges[0], X = [5, 1];
        G.onClick = ({ node, edge }) => {
          if (edge) { e = edge; X = []; }
          else if (node) { const i = X.findIndex((x) => K(x) === K(node.id)); if (i >= 0) X.splice(i, 1); else { X.push(node.id); if (X.length > 2) X.shift(); } }
          return true;
        };
        const calc = () => {
          const H = ix(G); if (!G.edges.includes(e)) e = G.edges[0];
          const M = toMG(H), k = H.eix.get(e), D = delSuppress(M, k);
          const sup = new Set(D.suppressed.map(K));
          // components of G − X
          const xs = new Set(X.map((id) => H.at(id))), CG = comps(H, (u) => !xs.has(u));
          // corresponding X' in G ∸ e: old vertices stay, a new vertex becomes the edge of G ∸ e whose path passes through it
          const xv = X.filter((id) => !sup.has(K(id))), xe = X.filter((id) => sup.has(K(id))).map((id) => D.M.E.find((f) => f.path.slice(1, -1).some((p) => K(p) === K(id)))).filter(Boolean);
          const Hd = ix({ nodes: D.M.ids.map((id) => ({ id })), edges: D.M.E.map((f) => ({ from: D.M.ids[f.a], to: D.M.ids[f.b], mg: f })) }, { multi: true });
          const xvs = new Set(xv.map((id) => Hd.at(id))), CD = comps(Hd, (u) => !xvs.has(u), (kk) => !xe.includes(Hd.E[kk][2].mg));
          return { H, M, D, sup, CG, CD, Hd, xv, xe, three: mgIs3(D.M), threeG: is3(H) };
        };
        v.render(() => {
          const c = calc(), xs = new Set(X.map(K));
          showMG(R, G, c.D.M, '');
          G.draw({ edgeColor: (f) => (f === e ? 'red' : null), edgeWidth: (f) => (f === e ? 4 : null), edgeDash: (f) => f === e,
            nodeFill: (id) => (xs.has(K(id)) ? null : X.length && c.CG.k > 1 ? PALETTE[c.CG.comp[c.H.at(id)] % PALETTE.length] : null),
            nodeColor: (id) => (c.sup.has(K(id)) ? 'orange' : null), nodeRing: (id) => (xs.has(K(id)) ? 'red' : null), dim: X });
          const pk = (f) => f.path.map(K).join('>'), xeK = new Set(c.xe.map(pk)), isX = (f) => xeK.has(pk(f.mg));
          R.draw({ edgeColor: (f) => (isX(f) ? 'red' : f.mg.path.length > 2 ? 'orange' : null), edgeWidth: (f) => (isX(f) || f.mg.path.length > 2 ? 3.5 : null), edgeDash: (f) => isX(f),
            nodeFill: (id) => (c.xv.some((x) => K(x) === K(id)) ? null : X.length && c.CD.k > 1 ? PALETTE[c.CD.comp[c.Hd.at(id)] % PALETTE.length] : null), dim: c.xv, nodeRing: (id) => (c.xv.some((x) => K(x) === K(id)) ? 'red' : null) });
          s.setTitle(X.length ? `$G$ — {${X.map((x) => G.lab(x)).join(', ')}} ${c.CG.k > 1 ? '**separates** $G$ ✗' : 'does not separate $G$ ✓'}` : '$G$ — click vertices to test a separator');
          const f = mgFlaws(c.D.M);
          t.setTitle(`$G\\,\\dot-\\,e$ — ${c.three.ok ? '3-connected ✓' : f.par ? `${f.par} pair${f.par > 1 ? 's' : ''} of parallel edges ✗` : c.three.small ? 'too small ✗' : `separator {${c.three.sep.map((i) => G.lab(c.D.M.ids[i])).join(', ')}} ✗`}`);
        });
        v.legend([['red', '$e$ / deleted $x_i\'$', { dash: true }], ['orange', 'suppressed end; merged edge'], ['red', 'tested separator', { dot: true }]]);
        v.readout(() => {
          const c = calc();
          return `$G\\,\\dot-\\,e$: ${mgN(c.D.M)} vertices, ${c.D.M.E.length} edges, suppressed {${c.D.suppressed.map((id) => G.lab(id)).join(', ') || '—'}} — ${c.three.ok ? '**3-connected**' : 'not 3-connected'} · $G$: ${c.threeG ? '3-connected' : 'not 3-connected'} (all pairs tested) · lemma ${!c.three.ok || c.threeG ? '✓' : '✗'}${!c.three.ok && c.threeG ? ' (the converse fails here)' : ''}`;
        });
      },
    },
    {
      num: '3.2.2', kind: 'Lemma', name: 'Every 3-connected graph other than K⁴ has a deletable edge',
      statement: String.raw`Every 3-connected graph $G\neq K^4$ has an edge $e$ such that $G\,\dot-\,e$ is again 3-connected.`,
      idea: String.raw`First, $G$ contains a subdivided $K^4$: take a shortest cycle $C$ (it is induced), a $C$-path $P=u\dots v$ (it has an inner vertex), and a $C$–$P$ path $Q$ in $G-\{u,v\}$; then $C\cup P\cup Q=TK^4$. Now choose $H=TJ\subseteq G$ with $J$ 3-connected, $J\ne G$, and $\|H\|$ maximum. An $H$-path $P$ whose ends do not lie on one subdivided edge of $J$ exists (3-connectedness), and adding it to $J$ as a new edge gives a 3-connected $J'$ (Lemma 3.2.1) with $J'\,\dot-\,e=J$; maximality forces $J'=G$.`,
      caption: String.raw`Every edge is coloured: green if $G\,\dot-\,e$ is 3-connected, red if not (each tested by brute force). Click an edge to see $G\,\dot-\,e$ on the right. **show TK⁴** draws the subdivided $K^4$ from the first step of the proof: shortest cycle $C$ (blue), $C$-path $P$ (orange), $C$–$P$ path $Q$ (purple), branch vertices gold. $K^4$ itself has no green edge — every $K^4\,\dot-\,e$ has parallel edges. Edit: ${EDIT}.`,
      deps: ['graph-3.2.1', 'graph-1.7.1b'], refs: ['Diestel §3.2'], tags: ['3-connected', 'subdivisions'],
      viz(v) {
        const pre = v.select('', opts3(['w5', 'cube', 'pet', 'k33', 'k4']), 'w5', { onChange: () => { load(G, P3[pre.value]()); sel = null; } });
        const tk = v.toggle('show TK⁴', false);
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 310, weight: 1.3 }), t = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 310, title: '$G\\,\\dot-\\,e$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, editable: true }), R = v.graph(t, { nodes: [], edges: [], r: 11, draggable: false });
        load(G, P3.w5()); let sel = null;
        G.onClick = ({ edge, alt }) => { if (edge && !alt) { sel = edge; return true; } return false; };
        const info = cacheBy((G) => {
          const H = ix(G), M = toMG(H), ok = H.E.map((_, k) => mgIs3(delSuppress(M, k).M).ok);
          // TK^4 from the proof
          let T4 = null; const g = girth(H);
          if (g.g < Infinity && is3(H)) {
            const C = g.cycle, onC = new Set(C), adjC = (x) => H.adj[x].filter(([w]) => onC.has(w)).map(([w]) => w);
            const D = comps(H, (x) => !onC.has(x));
            for (const L of D.lists) {
              const att = new Map(); for (const x of L) for (const w of adjC(x)) if (!att.has(w)) att.set(w, x);
              if (att.size < 2) continue;
              const [u, v2] = [...att.keys()], r = bfs(H, att.get(u), (x) => !onC.has(x)), inner = parPath(r.par, att.get(v2)), P = [u, ...inner, v2];
              const Pin = new Set(inner), dist = new Array(H.n).fill(-1), par = new Array(H.n).fill(-1), q = [...Pin]; q.forEach((x) => (dist[x] = 0));
              let hit = -1;
              for (let i = 0; i < q.length && hit < 0; i++) for (const [w] of H.adj[q[i]]) { if (w === u || w === v2 || dist[w] >= 0) continue; dist[w] = dist[q[i]] + 1; par[w] = q[i]; if (onC.has(w)) { hit = w; break; } if (!Pin.has(w)) q.push(w); }
              if (hit < 0) continue;
              const Q = []; for (let x = hit; x !== -1; x = par[x]) Q.push(x);
              T4 = { C, P, Q, branch: [u, v2, Q[0], Q[Q.length - 1]] }; break;
            }
          }
          return { H, M, ok, T4, three: is3(H) };
        });
        v.render(() => {
          const I = info(G), { H } = I; if (sel && !G.edges.includes(sel)) sel = null;
          const k = sel ? H.eix.get(sel) : I.ok.findIndex(Boolean), e0 = k >= 0 ? H.E[k][2] : null;
          const T4 = tk.value ? I.T4 : null, cE = T4 ? pathObjs(H, T4.C, true) : null, pE = T4 ? pathObjs(H, T4.P) : null, qE = T4 ? pathObjs(H, T4.Q) : null;
          G.draw({
            edgeColor: (e) => (T4 ? (cE.has(e) ? 'accent' : pE.has(e) ? 'orange' : qE.has(e) ? 'purple' : 'faint') : I.ok[H.eix.get(e)] ? 'green' : 'red'),
            edgeWidth: (e) => (T4 ? (cE.has(e) || pE.has(e) || qE.has(e) ? 4 : 1.4) : e === e0 ? 6 : 3), edgeDash: (e) => !T4 && !I.ok[H.eix.get(e)],
            nodeFill: (id) => (T4 && T4.branch.includes(H.at(id)) ? 'gold' : null),
          });
          if (e0) { const D = delSuppress(I.M, k); showMG(R, G, D.M, ''); const th = mgIs3(D.M); R.draw({ edgeColor: (f) => (f.mg.path.length > 2 ? 'orange' : null), edgeWidth: (f) => (f.mg.path.length > 2 ? 3.5 : null) });
            t.setTitle(`$G\\,\\dot-\\,e$ — ${th.ok ? '3-connected ✓' : mgFlaws(D.M).par ? 'parallel edges ✗' : 'not 3-connected ✗'}`);
            const a = G.node(e0.from), b = G.node(e0.to); s.text('e', (a.x + b.x) / 2, (a.y + b.y) / 2, { dx: 9, dy: -9, color: 'ink', size: 14, math: true });
          } else { showMG(R, G, I.M, ''); R.draw({}); t.setTitle('$G\\,\\dot-\\,e$ — no deletable edge'); }
        });
        v.legend([['green', '$G\\,\\dot-\\,e$ 3-connected'], ['red', 'not', { dash: true }], ['accent', '$C$'], ['orange', '$P$'], ['purple', '$Q$']]);
        v.readout(() => {
          const I = info(G), g = I.ok.filter(Boolean).length, isK4 = I.H.n === 4 && I.H.m === 6;
          if (!I.three) return `$G$ is not 3-connected (brute force), so the lemma says nothing · ${g} of ${I.H.m} edges green`;
          return `$G$ is 3-connected${isK4 ? ' and equal to $K^4$' : ' and $\\neq K^4$'} · **${g} of ${I.H.m} edges** are deletable ${isK4 ? (g === 0 ? '(none, as expected)' : '') : g > 0 ? '✓' : '✗'}${I.T4 && tk.value ? ` · $TK^4$ with branch vertices ${I.T4.branch.map((u) => vname(G, I.H, u)).join(', ')} ✓` : ''}`;
        });
      },
    },
    {
      num: '3.2.3', kind: 'Theorem', name: 'Tutte: 3-connected graphs arise from K⁴ by adding edges', credit: 'Tutte, 1966',
      statement: String.raw`A graph $G$ is 3-connected if and only if there is a sequence $G_0,\dots,G_n$ of graphs with (i) $G_0=K^4$ and $G_n=G$, and (ii) for every $i<n$, $G_{i+1}$ has an edge $e$ with $G_i=G_{i+1}\,\dot-\,e$. Moreover, every graph in such a sequence is 3-connected.`,
      idea: String.raw`If $G$ is 3-connected, Lemma 3.2.2 finds $G_n=G,\,G_{n-1},\dots$ down to $K^4$, each 3-connected. Conversely, along any such sequence 3-connectedness passes from $G_i$ to $G_{i+1}$ by Lemma 3.2.1. Read forwards, each step adds one edge to $G_i$ — between two existing vertices, between two new vertices subdividing distinct edges, or between an old vertex and a new subdividing vertex — so all 3-connected graphs can be generated from $K^4$ this way (Diestel notes the theorem is often credited to Barnette and Grünbaum, 1969).`,
      caption: String.raw`Play the sequence from $K^4$ (step 1) to $G$: the vertices of $G_i$ are dark, each edge of $G_i$ is drawn along the path of $G$ it stands for (so $G_i$ appears as a subdivision inside $G$), and the edge added at this step is gold — its ends are marked old or new in the note. Switch **draw** to see each $G_i$ as a graph in its own right. The readout confirms that every $G_i$ is 3-connected.`,
      deps: ['graph-3.2.2', 'graph-3.2.1'], refs: ['Diestel §3.2'], tags: ['3-connected', 'Tutte'],
      viz(v) {
        const pre = v.select('', opts3(['cube', 'prism', 'pet', 'dod', 'oct']), 'dod', { onChange: () => { load(G, P3[pre.value]()); S.reset({ at: 1 }); } });
        const draw = v.select('draw $G_i$', [{ value: 'sub', label: 'inside $G$' }, { value: 'own', label: 'on its own' }], 'sub');
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.18, 1.18], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11 }), R = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        load(G, P3.dod());
        const frames = () => {
          const H = ix(G); let M = toMG(H); const seq = [{ M, e: null }];
          if (!is3(H)) return [{ H, bad: true, note: 'This graph is not 3-connected.' }];
          for (let g = 0; g < 60 && !(mgN(M) === 4 && M.E.length === 6); g++) {
            const k = M.E.findIndex((_, kk) => mgIs3(delSuppress(M, kk).M).ok); if (k < 0) break;
            const D = delSuppress(M, k); seq.push({ M: D.M, e: M.E[k], sup: D.suppressed, from: M }); M = D.M;
          }
          seq.reverse(); // seq[0] = K4 … seq[n] = G ; the edge added from seq[i-1] to seq[i] is seq[i-1].e
          return seq.map((x, i) => {
            const prev = seq[i - 1], add = prev ? prev.e : null;
            let note = `$G_0 = K^4$ — the start.`;
            if (add) {
              const oldIds = new Set(prev.M.ids.map(K)), [p, q] = [add.path[0], add.path[add.path.length - 1]].map((id) => G.lab(id));
              const kind = (id) => (oldIds.has(K(id)) ? 'old' : 'new');
              note = `$G_{${i}}$: add the edge ${p}${q} (${kind(add.path[0])}–${kind(add.path[add.path.length - 1])}${add.path.length > 2 ? `, through ${add.path.length - 2} vertex${add.path.length > 3 ? 'es' : ''} of $G$` : ''}) — ${mgN(x.M)} vertices, ${x.M.E.length} edges.`;
            }
            return { H, M: x.M, add, i, n: seq.length - 1, note };
          });
        };
        const S = v.steps({ frames, speed: 0.9, start: 1, still: 2, counter: 'graph' });
        v.render(() => {
          const f = S.frame; if (!f.H) return;
          if (f.bad) { G.draw({}); return; }
          const live = new Set(f.M.ids.map(K)), addKey = f.add ? f.add.path.map(K).join('>') : null;
          if (draw.value === 'sub') {
            const onEdge = new Map(); // G-edge → 'add' | 'in'
            for (const e of f.M.E) { const isAdd = e.path.map(K).join('>') === addKey || e.path.map(K).reverse().join('>') === addKey; for (let i = 0; i + 1 < e.path.length; i++) { const ge = G.edge(e.path[i], e.path[i + 1]); if (ge) onEdge.set(ge, isAdd ? 'add' : 'in'); } }
            G.draw({ edgeColor: (e) => (onEdge.get(e) === 'add' ? 'gold' : onEdge.get(e) ? 'accent' : 'faint'), edgeWidth: (e) => (onEdge.get(e) === 'add' ? 5 : onEdge.get(e) ? 3 : 1.2), edgeDash: (e) => !onEdge.get(e),
              nodeFill: (id) => (live.has(K(id)) ? 'ink' : null), nodeColor: (id) => (live.has(K(id)) ? null : 'faint'), nodeLabel: () => '' });
          } else {
            showMG(R, G, f.M, 'own');
            G.draw({ edgeColor: () => 'faint', edgeWidth: () => 0.6, nodeColor: () => 'faint', nodeLabel: () => '', dim: G.nodes.map((n) => n.id) });
            R.draw({ edgeColor: (e) => (e.mg.path.map(K).join('>') === addKey || e.mg.path.map(K).reverse().join('>') === addKey ? 'gold' : 'accent'), edgeWidth: (e) => (e.mg.path.map(K).join('>') === addKey || e.mg.path.map(K).reverse().join('>') === addKey ? 5 : 2.6), nodeFill: () => 'ink', nodeLabel: () => '' });
          }
          s.corner(`$G_{${f.i}}$ in $G_0, \\dots, G_{${f.n}}$`, 'tl', { color: 'ink', weight: 700, size: 14 });
        });
        v.legend([['accent', 'edges of $G_i$ (as paths of $G$)'], ['gold', 'edge just added'], ['ink', 'vertices of $G_i$', { dot: true }]]);
        v.readout(() => {
          const fr = S.frames; if (!fr.length || fr[0].bad) return 'not 3-connected: no such sequence exists';
          const all = fr.every((f) => mgIs3(f.M).ok);
          return `sequence $K^4 = G_0, \\dots, G_{${fr.length - 1}} = G$ found by repeatedly applying Lemma 3.2.2 · every $G_i$ 3-connected ${all ? '✓' : '✗'} · $G_{i} = G_{i+1}\\,\\dot-\\,e$ at each step ✓`;
        });
      },
    },
    {
      num: '3.2.4', kind: 'Lemma', name: '3-connected graphs other than K⁴ have a contractible edge',
      statement: String.raw`Every 3-connected graph $G\neq K^4$ has an edge $e$ such that $G/e$ is again 3-connected.`,
      idea: String.raw`Suppose no edge works. Then for every edge $xy$ the contracted graph $G/xy$ has a separator of size 2, which must contain the new vertex $v_{xy}$ (since $\kappa(G)\ge3$): so there is a $z$ with $\{x,y,z\}$ separating $G$, and every vertex of $\{x,y,z\}$ has a neighbour in every component of $G-\{x,y,z\}$. Choose $xy$, $z$ and a component $C$ with $|C|$ minimum, and a neighbour $v\in C$ of $z$. Again $\{z,v,w\}$ separates $G$ for some $w$; a component $D$ of $G-\{z,v,w\}$ avoiding the adjacent $x,y$ turns out to lie inside $C$ and to be smaller — a contradiction.`,
      caption: String.raw`Green edges are contractible ($G/e$ is 3-connected), red ones are not. Click an edge: the right panel shows $G/e$ with the merged vertex gold and, if there is one, a 2-separator $\{v_{xy}, z\}$ in red; on the left the corresponding 3-separator $\{x,y,z\}$ of $G$ is ringed and the components of $G-\{x,y,z\}$ are coloured. $K^4$ is the only 3-connected graph with no green edge. Edit: ${EDIT}.`,
      deps: ['graph-1.4.1b', 'graph-1.7.1a'], refs: ['Diestel §3.2'], tags: ['3-connected', 'contraction'],
      viz(v) {
        const pre = v.select('', opts3(['w5', 'prism', 'oct', 'k33', 'k4']), 'w5', { onChange: () => { load(G, P3[pre.value]()); sel = null; } });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 310, weight: 1.2 }), t = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 310, title: '$G/e$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, editable: true }), R = v.graph(t, { nodes: [], edges: [], r: 12, draggable: false });
        load(G, P3.w5()); let sel = null;
        G.onClick = ({ edge, alt }) => { if (edge && !alt) { sel = edge; return true; } return false; };
        const info = cacheBy((G) => { const H = ix(G), M = toMG(H); return { H, M, res: H.E.map((_, k) => { const c = contractMG(M, k); return { c, t: mgIs3(c.M) }; }), three: is3(H) }; });
        v.render(() => {
          const I = info(G), { H } = I; if (sel && !G.edges.includes(sel)) sel = null;
          const bad = I.res.findIndex((r) => !r.t.ok), k = sel ? H.eix.get(sel) : bad >= 0 ? bad : H.m ? 0 : -1, e0 = k >= 0 ? H.E[k][2] : null;
          let T = new Set(), CG = null;
          if (e0) {
            const r = I.res[k], c = r.c; showMG(R, G, c.M, 'c');
            const vxy = K(c.kept);
            const sepIds = r.t.sep ? r.t.sep.map((i) => c.M.ids[i]) : [];
            if (sepIds.length) { T = new Set(sepIds.flatMap((id) => (K(id) === vxy ? [e0.from, e0.to] : [id])).map(K)); CG = comps(H, (u) => !T.has(K(H.ids[u]))); }
            // position the merged vertex at the midpoint of e
            const a = G.node(e0.from), b = G.node(e0.to), m = R.node(c.kept); if (m) { m.x = (a.x + b.x) / 2; m.y = (a.y + b.y) / 2; m.label = G.lab(e0.from) + G.lab(e0.to); }
            R.draw({ nodeFill: (id) => (K(id) === vxy ? 'gold' : CG ? null : null), nodeRing: (id) => (sepIds.some((x) => K(x) === K(id)) ? 'red' : null) });
            t.setTitle(`$G/e$ — ${r.t.ok ? '3-connected ✓' : r.t.small ? 'only 3 vertices ✗' : `2-separator {${sepIds.map((id) => (K(id) === vxy ? '$v_{xy}$' : G.lab(id))).join(', ')}} ✗`}`);
          }
          G.draw({
            edgeColor: (e) => (I.res[H.eix.get(e)].t.ok ? 'green' : 'red'), edgeWidth: (e) => (e === e0 ? 6 : 3), edgeDash: (e) => !I.res[H.eix.get(e)].t.ok,
            nodeRing: (id) => (T.has(K(id)) ? 'red' : null), nodeFill: (id) => (CG && !T.has(K(id)) ? PALETTE[CG.comp[H.at(id)] % PALETTE.length] : null),
          });
        });
        v.legend([['green', 'contractible'], ['red', 'not contractible', { dash: true }], ['gold', 'contracted vertex $v_{xy}$', { dot: true }]]);
        v.readout(() => {
          const I = info(G), g = I.res.filter((r) => r.t.ok).length, isK4 = I.H.n === 4 && I.H.m === 6;
          return `${I.three ? '$G$ is 3-connected' : '$G$ is **not** 3-connected'}${isK4 ? ' ($K^4$)' : ''} · **${g} of ${I.H.m}** edges contractible${I.three && !isK4 ? (g ? ' ✓' : ' ✗') : ''}`;
        });
      },
    },
    {
      num: '3.2.5', kind: 'Theorem', name: 'Tutte: 3-connected graphs from K⁴ by splitting vertices', credit: 'Tutte, 1961',
      statement: String.raw`A graph $G$ is 3-connected if and only if there is a sequence $G_0,\dots,G_n$ of graphs with (i) $G_0=K^4$ and $G_n=G$, and (ii) for every $i<n$, $G_{i+1}$ has an edge $xy$ with $d(x),d(y)\ge3$ and $G_i=G_{i+1}/xy$. Moreover, every graph in such a sequence is 3-connected.`,
      idea: String.raw`Lemma 3.2.4 gives the sequence for a 3-connected $G$ (contract contractible edges until $K^4$ remains). Conversely, if $G_i$ is 3-connected but $G_{i+1}$ had a separator $S$ of at most two vertices, take two components $C_1,C_2$ of $G_{i+1}-S$ with $x,y\notin C_1$; then $C_2$ can contain neither both $x,y$ nor any other vertex (or $G_i$ would be separable by $\le2$ vertices), so $C_2$ is just $x$ or $y$ — of degree $\le2$, contrary to (ii). Read forwards, each step **splits** a vertex into two adjacent vertices, each joined to at least two former neighbours: the core of Tutte's wheel theorem.`,
      caption: String.raw`Play forwards from $K^4$: at each step one vertex splits into two adjacent vertices (they glide apart; the new edge $xy$ is gold) and the degrees $d(x), d(y)\ge3$ are shown. Each $G_i$ is drawn with every vertex at the centre of the vertices of $G$ it will become. The readout checks every $G_i$ for 3-connectedness. Compare 3.2.3, which builds the same graphs by adding edges instead.`,
      deps: ['graph-3.2.4', 'graph-1.7.1a'], refs: ['Diestel §3.2'], tags: ['3-connected', 'Tutte', 'wheel theorem'],
      viz(v) {
        const pre = v.select('', opts3(['cube', 'prism', 'pet', 'dod', 'oct']), 'cube', { onChange: () => { load(G, P3[pre.value]()); S.reset({ at: 2 }); } });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.18, 1.18], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false }), R = v.graph(s, { nodes: [], edges: [], r: 12, draggable: false });
        load(G, P3.cube());
        const frames = () => {
          const H = ix(G); if (!is3(H)) return [{ H, bad: true, note: 'This graph is not 3-connected.' }];
          let M = toMG(H), bags = Object.fromEntries(H.ids.map((id) => [K(id), [id]]));
          const seq = [{ M, bags }];
          const pos = (id) => { const n = G.node(id); return [n.x, n.y]; };
          for (let g = 0; g < 40 && mgN(M) > 4; g++) {
            const cand = M.E.map((e, k) => ({ k, c: contractMG(M, k, bags) })).filter((x) => mgIs3(x.c.M).ok);
            if (!cand.length) break;
            const len = (x) => { const e = M.E[x.k], A = bags[K(M.ids[e.a])].map(pos), B = bags[K(M.ids[e.b])].map(pos), ca = A.reduce((p, q) => [p[0] + q[0] / A.length, p[1] + q[1] / A.length], [0, 0]), cb = B.reduce((p, q) => [p[0] + q[0] / B.length, p[1] + q[1] / B.length], [0, 0]); return Math.hypot(ca[0] - cb[0], ca[1] - cb[1]); };
            cand.sort((a, b) => len(a) - len(b));
            const { c } = cand[0]; seq.push({ M: c.M, bags: c.bags, kept: c.kept, merged: c.merged }); M = c.M; bags = c.bags;
          }
          seq.reverse();
          const cen = (bag) => { const P = bag.map(pos); return [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length]; };
          return seq.map((x, i) => {
            const P = {}; for (const id of x.M.ids) P[K(id)] = cen(x.bags[K(id)]);
            // seq[i] arises from seq[i−1] by splitting the vertex 'kept' into 'kept' and 'merged' (recorded on seq[i−1], the contracted graph)
            const prev = seq[i - 1]; let split = null, from = null, note = '$G_0 = K^4$.';
            if (prev && prev.kept != null) {
              split = [prev.kept, prev.merged]; from = {};
              for (const id of x.M.ids) from[K(id)] = split.some((q) => K(q) === K(id)) ? prev.P[K(prev.kept)] : prev.P[K(id)];
              const d = (id) => x.M.E.filter((e) => K(x.M.ids[e.a]) === K(id) || K(x.M.ids[e.b]) === K(id)).length;
              note = `$G_{${i}}$: split one vertex into $x$, $y$ with $d(x) = ${d(split[0])}$, $d(y) = ${d(split[1])}$ (both $\\ge 3$) — ${mgN(x.M)} vertices, ${x.M.E.length} edges.`;
            }
            x.P = P;
            return { H, M: x.M, P, from, split, i, n: seq.length - 1, note };
          });
        };
        const S = v.steps({ frames, speed: 0.8, transition: 0.7, start: 2, still: 2, counter: 'graph' });
        v.render(() => {
          const f = S.frame; if (!f.H) return;
          G.draw({ edgeColor: () => 'faint', edgeWidth: () => 0.8, nodeColor: () => 'faint', nodeLabel: () => '', dim: G.nodes.map((n) => n.id) });
          if (f.bad) return;
          const tw = S.tween, key = JSON.stringify([f.M.ids, f.M.E.map((e) => [e.a, e.b])]);
          if (R._key !== key) { R._key = key; R.set({ nodes: f.M.ids.map((id) => ({ id, x: 0, y: 0, label: '' })), edges: f.M.E.map((e) => ({ from: f.M.ids[e.a], to: f.M.ids[e.b] })) }); }
          for (const n of R.nodes) { const p = f.P[K(n.id)], q = f.from ? f.from[K(n.id)] : p; n.x = q[0] + (p[0] - q[0]) * tw; n.y = q[1] + (p[1] - q[1]) * tw; }
          const isSplit = (id) => f.split && f.split.some((q) => K(q) === K(id));
          R.draw({ edgeColor: (e) => (f.split && isSplit(e.from) && isSplit(e.to) ? 'gold' : 'accent'), edgeWidth: (e) => (f.split && isSplit(e.from) && isSplit(e.to) ? 5 : 2.6),
            nodeFill: (id) => (isSplit(id) ? 'gold' : 'ink'), nodeNote: (id) => (isSplit(id) ? String(R.degree(id)) : null), noteColor: 'gold' });
          s.corner(`$G_{${f.i}}$ in $G_0, \\dots, G_{${f.n}}$`, 'tl', { color: 'ink', weight: 700, size: 14 });
        });
        v.legend([['accent', 'edges of $G_i$'], ['gold', 'the split: $x$, $y$ and the new edge $xy$'], ['faint', '$G$', { dash: true }]]);
        v.readout(() => {
          const fr = S.frames; if (!fr.length || fr[0].bad) return 'not 3-connected: no such sequence exists';
          const all = fr.every((f) => mgIs3(f.M).ok);
          const degs = fr.slice(1).every((f) => !f.split || f.split.every((id) => f.M.E.filter((e) => K(f.M.ids[e.a]) === K(id) || K(f.M.ids[e.b]) === K(id)).length >= 3));
          return `$K^4 = G_0, \\dots, G_{${fr.length - 1}} = G$ by repeated contraction (Lemma 3.2.4), read backwards · every $G_i$ 3-connected ${all ? '✓' : '✗'} · $d(x), d(y) \\ge 3$ at every split ${degs ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '3.2.6', kind: 'Theorem', name: 'Tutte: non-separating induced cycles span the cycle space', credit: 'Tutte, 1963',
      statement: String.raw`The cycle space of every 3-connected graph $G$ is generated by its non-separating induced cycles (induced cycles $C$ such that $G-V(C)$ is connected).`,
      idea: String.raw`Let $b(C)$ be the order of a largest component of $G-C$ (0 if $C$ is a Hamilton cycle), and suppose some cycle is not generated; take one, $C$, with $b(C)$ maximum. A Hamilton cycle is the sum of two cycles through a chord, each with larger $b$. Otherwise let $B$ be a largest component of $G-C$. If some $C$-path $P$ in $G-B$ has inner vertices of $N(B)$ on both arcs of $C$ between its ends, $C$ is the sum of two cycles through $P$ whose complements contain $B$ properly. If not, 3-connectedness forces $V(C)=N(B)$ and $C$ chordless; unless $C$ is already induced and non-separating, a second component of $G-C$ yields three cycles summing to $C$, each with larger $b$. Either way the maximality of $b(C)$ is contradicted.`,
      caption: String.raw`Step through the cycles of $G$ (longest first). The chosen cycle $C$ is drawn in thick ink; it is written as a sum of non-separating induced cycles, each shown shrunk and shaded in its own colour — for planar drawings these are faces, and their symmetric difference is exactly $C$. Choose $K_{2,4}$ to break the hypothesis: it is only 2-connected, has no non-separating induced cycle at all, and nothing can be generated.`,
      deps: ['graph-1.9.1', 'graph-1.4.1b'], refs: ['Diestel §3.2'], tags: ['3-connected', 'cycle space'],
      viz(v) {
        const PRE = { ...P3, k24: K24 };
        const pre = v.select('', [...opts3(['cube', 'prism', 'w5', 'pet']), { value: 'k24', label: '$K_{2,4}$ (2-connected)' }], 'cube', { onChange: () => { load(G, PRE[pre.value]()); S.reset({ at: 'start' }); } });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11 });
        load(G, P3.cube());
        const info = cacheBy((G) => {
          const H = ix(G), A = amask(H), cyc = allCycles(H), gens = cyc.filter((c) => nonSepInduced(H, A, c));
          return { H, cyc: cyc.slice().sort((a, b) => b.vs.length - a.vs.length), gens, rank: solveF2(gens.map((c) => c.E), new Uint8Array(H.m)).rank, three: is3(H) };
        });
        const S = v.steps({ frames: () => { const I = info(G); return I.cyc.map((C, i) => { const r = solveF2(I.gens.map((g) => g.E), C.E); return { I, C, sol: r.sol, note: r.sol ? `$C$ (length ${C.vs.length}) $=$ the sum of ${r.sol.length} non-separating induced cycle${r.sol.length === 1 ? '' : 's'}${r.sol.length === 1 ? ' — itself' : ''}.` : `$C$ (length ${C.vs.length}) is **not** a sum of non-separating induced cycles.` }; }); }, counter: 'cycle', speed: 1, still: 1 });
        v.render(() => {
          const f = S.frame; if (!f.I) return; const { H, gens } = f.I;
          const P = (u) => { const n = G.node(H.ids[u]); return [n.x, n.y]; };
          (f.sol || []).forEach((gi, j) => {
            const pts = gens[gi].vs.map(P), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
            const sh = pts.map(([x, y]) => [cx + 0.86 * (x - cx), cy + 0.86 * (y - cy)]), col = EARC[(j + 1) % EARC.length];
            // a self-crossing drawing (non-planar graphs) is outlined only, so that the overlaps stay readable
            s.poly(sh, simplePoly(sh) ? { fill: col, fillAlpha: 0.2, color: col, width: 1.6 } : { color: col, width: 2.2 });
          });
          const cE = new Set(pathEdges(H, f.C.vs, true).map((k) => H.E[k][2]));
          G.draw({ edgeColor: (e) => (cE.has(e) ? 'ink' : null), edgeWidth: (e) => (cE.has(e) ? 5 : 1.6), nodeLabel: () => '' });
        });
        v.legend([['ink', 'the cycle $C$'], ['orange', 'non-separating induced cycles used (shrunk)', { area: true }]]);
        v.readout(() => {
          const I = info(G), dim = I.H.m - I.H.n + 1, f = S.frame;
          const allOk = I.cyc.every((C) => solveF2(I.gens.map((g) => g.E), C.E).sol);
          return `${I.three ? '3-connected' : '**not** 3-connected'} · ${I.gens.length} non-separating induced cycles of ${I.cyc.length} cycles · they span a space of dimension ${I.rank} ${I.rank === dim ? '=' : '<'} $\\dim\\mathcal C(G) = \\|G\\|-|G|+1 = ${dim}$ ${I.rank === dim ? '✓' : '✗'} · ${allOk ? 'every cycle generated ✓' : 'some cycles not generated'}${f.sol ? '' : ''}`;
        });
      },
    },
  ],
};
