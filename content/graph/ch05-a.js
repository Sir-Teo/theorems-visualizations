// Graph Theory (Diestel) — Chapter 5, part A1 (§§5.1–5.2, first half: colourings, the four and five colour theorems, Grötzsch, greedy bounds)
// The chapter title and summary come from the syllabus (part A2 = ch05-a2.js; §§5.4–5.6 are written elsewhere).
import {
  K, ix, named, wheel, gstage, cacheBy, loadSpec, COL, colName, rng32, shuffled, nbrs, conflicts, colourWith, chromatic, greedyColour, degeneracy,
  kempe, fiveFrames, triangles, edgeColourWith, maxDeg, crown, grotzsch, gnm, triFreePlanar, planarSpec, isPlanar, randomTriangulation, triangulation, TAU,
} from './ch05-a.shared.js';

// ---------- local helpers ----------
const spec0 = (sp) => ({ ...sp, nodes: sp.nodes.map((n) => ({ ...n })) });
/** Palette colour of class c (or null if uncoloured). */
const cc = (c) => (c >= 0 ? COL[c % COL.length] : null);
/** Index structure and colour array of a kit graph, with colours kept in a Map keyed by node id. */
function colArr(H, map) { return H.ids.map((id) => (map.has(String(id)) ? map.get(String(id)) : -1)); }
/** Best attempt at a k-colouring: greedy start, then min-conflict local search. → {col, bad} */
function bestAttempt(H, k, seed) {
  const adj = nbrs(H), r = rng32(seed), col = new Array(H.n).fill(0);
  const cost = (v, c) => adj[v].reduce((s, w) => s + (col[w] === c ? 1 : 0), 0);
  const base = colourWith(adj, k, 2e5); if (base.status === 'yes') return { col: base.col, bad: 0 };
  H.E.forEach((_, i) => i); for (let v = 0; v < H.n; v++) { col[v] = Math.floor(r() * k); }
  let best = null, bb = Infinity;
  for (let it = 0; it < 600; it++) {
    const bad = []; for (let v = 0; v < H.n; v++) if (cost(v, col[v]) > 0) bad.push(v);
    const nb = conflicts(H, col).length; if (nb < bb) { bb = nb; best = col.slice(); }
    if (!bad.length) break;
    const v = bad[Math.floor(r() * bad.length)]; let bc = col[v], bv = Infinity;
    for (let c = 0; c < k; c++) { const x = cost(v, c) + (r() < 0.1 ? 1 : 0); if (x < bv) { bv = x; bc = c; } }
    col[v] = bc;
  }
  return { col: best, bad: bb };
}
const PRE5 = {
  c5: ['$C^5$', () => named('cycle', 5)], k4: ['$K^4$', () => named('complete', 4)], pet: ['Petersen', () => named('petersen')],
  w5: ['wheel', () => wheel(5)], cube: ['cube', () => named('cube')], gro: ['Grötzsch', () => grotzsch()],
};
const opts = (P) => Object.entries(P).map(([value, a]) => ({ value, label: a[0] }));

export default {
  collection: 'graph',
  chapter: 5,
  items: [
    // ====================================================================== 5.1 Colouring maps and planar graphs
    {
      num: '5.1.1a', kind: 'Definition', name: 'Vertex colourings and chromatic number',
      statement: String.raw`A **vertex colouring** of a graph $G=(V,E)$ with colours $\{1,\dots,k\}$ is a map $c\colon V\to\{1,\dots,k\}$ with $c(x)\neq c(y)$ for every edge $xy$ (a *proper* colouring; the colour classes are independent sets). The least $k$ for which such a map exists is the **chromatic number** $\chi(G)$; $G$ is **$k$-colourable** if $\chi(G)\le k$ and **$k$-chromatic** if $\chi(G)=k$.`,
      idea: String.raw`Colouring is the same as partitioning $V$ into $k$ independent sets, so $\chi(G)=1$ exactly for non-empty edgeless graphs, $\chi(G)=2$ exactly for bipartite graphs with an edge, and every clique $K^r\subseteq G$ forces $\chi(G)\ge r$. Computing $\chi$ in general is hard; for the small graphs here the picture is produced by an exact backtracking search.`,
      caption: String.raw`Click a vertex to cycle through the colours (Shift-click goes backwards); an edge whose ends share a colour turns red. Try to use as few colours as you can, then compare with $\chi(G)$ in the readout. Switch on *edit the graph* to add and delete vertices and edges.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel, Graph Theory, 6th ed., Chapter 5 introduction, p. 123'], see: ['comb-9.9'], tags: ['colouring', 'chromatic number'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Graph_coloring' },
      viz(v) {
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...PRE5.pet[1](), r: 13, editable: true });
        const col = new Map();
        const start0 = () => { col.clear(); '0,3,2,1,3,1,1,0,0,2'.split(',').forEach((c, i) => col.set(String(i), +c)); };
        start0();
        const nk = v.slider('colours in the palette', 2, 7, 4, { int: true });
        const edit = v.toggle('edit the graph', false);
        const sel = v.select('graph', opts(PRE5), 'pet', { onChange: (k) => { loadSpec(G, PRE5[k][1]()); col.clear(); } });
        const chi = cacheBy((g) => chromatic(ix(g)));
        G.onClick = ({ node, shift, alt }) => {
          if (edit.value || alt) return false;
          if (node) {
            const id = String(node.id), cur = col.has(id) ? col.get(id) : -1, K1 = nk.value;
            const nx = shift ? (cur < 0 ? K1 - 1 : cur - 1) : (cur + 1 >= K1 ? -1 : cur + 1);
            if (nx < 0) col.delete(id); else col.set(id, nx);
          }
          return true;
        };
        v.button('Clear colours', () => col.clear());
        v.button('Show an optimal colouring', () => { const H = ix(G), r = chromatic(H); col.clear(); if (r.col) H.ids.forEach((id, i) => col.set(String(id), r.col[i])); if (r.k > nk.value) nk.set(Math.min(7, r.k)); });
        let info = {};
        v.render(() => {
          for (const id of [...col.keys()]) if (!G.has(id) && !G.has(Number(id))) col.delete(id);
          const H = ix(G), c = colArr(H, col), bad = conflicts(H, c), badE = new Set(bad.map((k) => H.E[k][2]));
          const used = new Set(c.filter((x) => x >= 0)).size, all = c.every((x) => x >= 0);
          info = { used, nbad: bad.length, all, chi: chi(G), n: H.n };
          G.draw({
            nodeFill: (id) => cc(col.has(String(id)) ? col.get(String(id)) : -1),
            edgeColor: (e) => (badE.has(e) ? 'red' : null), edgeWidth: (e) => (badE.has(e) ? 4.5 : null),
          });
        });
        v.legend([['red', 'edge with both ends the same colour']]);
        v.readout(() => {
          const x = info.chi;
          const chiT = x.exact ? `$\\chi(G)=${x.k}$` : `$\\chi(G)\\ge ${x.k}$`;
          const state = !info.all ? 'some vertices are still uncoloured' : info.nbad ? `${info.nbad} conflicting edge${info.nbad > 1 ? 's' : ''}` : info.used === x.k ? 'proper, and optimal' : `proper with ${info.used} colours — can you use fewer?`;
          return `colours used: $${info.used}$ · ${chiT}` + '\n' + state;
        });
      },
    },
    {
      num: '5.1.1b', kind: 'Definition', name: 'Edge colourings and chromatic index',
      statement: String.raw`An **edge colouring** of $G$ with $k$ colours assigns each edge one of $k$ colours so that edges sharing an end get different colours; the colour classes are matchings. The least such $k$ is the **chromatic index** $\chi'(G)$. Always $\chi'(G)\ge\Delta(G)$, since the edges at a vertex of maximum degree need distinct colours.`,
      idea: String.raw`An edge colouring of $G$ is exactly a vertex colouring of its line graph $L(G)$, so $\chi'(G)=\chi(L(G))$. The inequality $\chi'\ge\Delta$ is local; how far above $\Delta$ the chromatic index can go is settled in §5.3 (König for bipartite graphs, Vizing in general).`,
      caption: String.raw`Click an edge to cycle through its colours. Two edges of equal colour at a vertex are drawn red and the vertex is ringed. The readout compares your palette with $\Delta$ and the exact value of $\chi'$.`,
      deps: ['graph-5.1.1a'], refs: ['Diestel, Graph Theory, 6th ed., Chapter 5 introduction, p. 124'], tags: ['edge colouring', 'chromatic index'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Edge_coloring' },
      viz(v) {
        const P = { k4: ['$K^4$', () => named('complete', 4)], k5: ['$K^5$', () => named('complete', 5)], pet: ['Petersen', () => named('petersen')], k33: ['$K_{3,3}$', () => named('kmn', 3, 3)], cube: ['cube', () => named('cube')], c5: ['$C^5$', () => named('cycle', 5)] };
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...P.pet[1](), r: 11, editable: true });
        const col = new Map();
        const start0 = () => { col.clear(); const H0 = ix(G); '1,0,2,3,2,1,1,0,1,3,0,3,4,2,0'.split(',').forEach((c, i) => col.set(keyOf(H0.E[i][2]), +c)); };
        const keyOf = (e) => [K(e.from), K(e.to)].sort().join('|');
        const nk = v.slider('colours in the palette', 2, 7, 5, { int: true });
        start0();
        const edit = v.toggle('edit the graph', false);
        v.select('graph', opts(P), 'pet', { onChange: (k) => { loadSpec(G, P[k][1]()); col.clear(); } });
        const chi1 = cacheBy((g) => {
          const H = ix(g), D = maxDeg(H); if (!H.m) return { k: 0, exact: true, D };
          const a = edgeColourWith(H, D); if (a.status === 'yes') return { k: D, exact: true, D, col: a.col, H };
          const b = edgeColourWith(H, D + 1); return { k: D + 1, exact: a.status === 'no', D, col: b.status === 'yes' ? b.col : null, H };
        });
        G.onClick = ({ node, edge, shift, alt }) => {
          if (edit.value || alt) return false;
          if (edge) {
            const kk = keyOf(edge), cur = col.has(kk) ? col.get(kk) : -1, K1 = nk.value;
            const nx = shift ? (cur < 0 ? K1 - 1 : cur - 1) : (cur + 1 >= K1 ? -1 : cur + 1);
            if (nx < 0) col.delete(kk); else col.set(kk, nx);
          }
          return true;
        };
        v.button('Clear colours', () => col.clear());
        v.button('Show an optimal colouring', () => { const r = chi1(G); col.clear(); if (r.col) { r.H.E.forEach(([a, b, e], i) => col.set(keyOf(e), r.col[i])); if (r.k > nk.value) nk.set(Math.min(7, r.k)); } });
        let info = {};
        v.render(() => {
          const H = ix(G), ec = H.E.map(([, , e]) => (col.has(keyOf(e)) ? col.get(keyOf(e)) : -1));
          const badE = new Set(), badV = new Set();
          for (let u = 0; u < H.n; u++) { const seen = new Map(); for (const [, k] of H.adj[u]) if (ec[k] >= 0) { if (seen.has(ec[k])) { badE.add(H.E[k][2]); badE.add(H.E[seen.get(ec[k])][2]); badV.add(H.ids[u]); } else seen.set(ec[k], k); } }
          info = { used: new Set(ec.filter((x) => x >= 0)).size, bad: badE.size, all: ec.every((x) => x >= 0), D: maxDeg(H), chi: chi1(G), m: H.m };
          G.draw({
            edgeColor: (e) => (badE.has(e) ? 'red' : cc(col.has(keyOf(e)) ? col.get(keyOf(e)) : -1)),
            edgeWidth: (e) => (badE.has(e) ? 5 : col.has(keyOf(e)) ? 4.5 : null),
            nodeRing: (id) => (badV.has(id) ? 'red' : null),
          });
        });
        v.legend([['red', 'two equal colours at a vertex']]);
        v.readout(() => {
          const x = info.chi, cls = x.k === info.D ? 'class 1 ($\\chi\'=\\Delta$)' : 'class 2 ($\\chi\'=\\Delta+1$)';
          const state = !info.all ? 'some edges are still uncoloured' : info.bad ? 'conflicts at the ringed vertices' : info.used === x.k ? 'proper, and optimal' : 'proper — can you use fewer colours?';
          return `$\\Delta=${info.D}$ · colours used $${info.used}$ · $\\chi'(G)${x.exact ? '=' : '\\ge'}${x.k}$ — ${x.exact ? cls : 'search budget exceeded'}` + '\n' + state;
        });
      },
    },
    {
      num: '5.1.1', kind: 'Theorem', name: 'Four colour theorem',
      statement: String.raw`Every planar graph has a proper vertex colouring with at most four colours: $\chi(G)\le 4$ for all planar $G$. Equivalently, the countries of any map in the plane (each connected, meeting along borders of positive length) can be coloured with four colours so that neighbours differ.`,
      idea: String.raw`Kempe's 1879 attempt reduces the claim to a finite list of configurations, but his handling of the hardest one was flawed. The accepted proofs show that a minimal counterexample must contain one of a list of *reducible* configurations while every plane triangulation contains one of an *unavoidable* set; both lists are checked by computer (Appel and Haken, published 1977; a smaller, cleaner version by Robertson, Sanders, Seymour and Thomas 1997). The picture below does not prove anything: it colours random plane triangulations, the extremal case, and shows the claim empirically.`,
      caption: String.raw`Resample random plane triangulations and change $n$. With four colours the search always succeeds. Switch to three colours to see how often that fails (the red edges show the best attempt), and read the bar chart: over many samples $\chi$ is $3$ or $4$, never $5$.`,
      deps: ['graph-5.1.1a', 'graph-4.4.1a'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.1.1, p. 124; notes pp. 152–153'], see: ['graph-5.1.2', 'geog-7.8'], tags: ['colouring', 'planar'],
      credit: 'Appel & Haken, 1977 (publication); Robertson, Sanders, Seymour & Thomas, 1997',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Four_color_theorem' },
      viz(v) {
        const s = gstage(v, { height: 340, title: 'a random plane triangulation' });
        const sb = v.stage({ x: [2, 6], y: [0, 100], axes: 'box', gutter: true, height: 340, xlabel: '$\\chi$ of the sampled triangulation', ylabel: '% of 120 samples', xticks: [3, 4, 5], title: 'how many colours do random triangulations need?' });
        const nS = v.slider('vertices $n$', 4, 22, 12, { int: true });
        const kS = v.select('colours allowed', [{ value: '4', label: '4 colours' }, { value: '3', label: '3 colours' }], '4');
        let seed = 11;
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 10 });
        let cur = { key: '' }, hist = { key: '', p: [0, 0, 0] };
        const mkTri = (n, sd, light) => (light ? { n, E: randomTriangulation(n, rng32(sd), 60).E } : triangulation(n, sd));
        function refresh() {
          const key = nS.value + ':' + seed; if (cur.key === key) return;
          const D = mkTri(nS.value, seed);
          loadSpec(G, { nodes: D.pos.map(([x, y], i) => ({ id: i, x, y, label: String(i + 1) })), edges: D.E, layout: 'fit' });
          const H = ix(G), c4 = colourWith(nbrs(H), 4), c3 = colourWith(nbrs(H), 3);
          cur = { key, H, c3, c4, att: c3.status === 'yes' ? null : bestAttempt(H, 3, seed) };
        }
        function histo() {
          const n = nS.value; if (hist.key === String(n)) return;
          let c = [0, 0, 0];
          for (let i = 0; i < 120; i++) { const D = mkTri(n, 500 + i, true), H = ix({ nodes: Array.from({ length: D.n }, (_, j) => ({ id: j })), edges: D.E }), a = nbrs(H); const x = colourWith(a, 3, 3e5).status === 'yes' ? 0 : colourWith(a, 4, 3e5).status === 'yes' ? 1 : 2; c[x]++; }
          hist = { key: String(n), p: c.map((x) => (100 * x) / 120) };
        }
        v.button('Resample', () => { seed += 1; });
        v.render(() => {
          refresh(); histo();
          const three = kS.value === '3', H = cur.H;
          const col = three ? (cur.c3.status === 'yes' ? cur.c3.col : cur.att.col) : cur.c4.col;
          const bad = new Set(conflicts(H, col).map((k) => H.E[k][2]));
          G.draw({ nodeFill: (id) => COL[col[H.at(id)]], edgeColor: (e) => (bad.has(e) ? 'red' : null), edgeWidth: (e) => (bad.has(e) ? 4.5 : null) });
          sb.bars(hist.p, { x0: 3, dx: 1, color: (val, i) => (i === 2 ? 'red' : i === 1 ? 'orange' : 'accent') });
          [3, 4, 5].forEach((x, i) => sb.text(`${v.fix(hist.p[i], 0)}%`, x, hist.p[i] + 6, { align: 'center', color: 'ink' }));
          cur.info = { three, nbad: bad.size, m: H.m, n: H.n, k3: cur.c3.status };
        });
        v.legend([['red', 'conflict (only when 3 colours are not enough)']]);
        v.readout(() => {
          const i = cur.info; if (!i) return '';
          const res = !i.three ? 'a proper 4-colouring was found' : i.k3 === 'yes' ? 'this triangulation happens to be 3-colourable' : `no proper 3-colouring exists; the best attempt leaves $${i.nbad}$ conflicting edge${i.nbad > 1 ? 's' : ''}`;
          return `$n=${i.n}$, $m=3n-6=${i.m}$ · ${res}`;
        });
      },
    },
    {
      num: '5.1.2', kind: 'Proposition', name: 'Five colour theorem',
      statement: String.raw`Every planar graph is $5$-colourable.`,
      idea: String.raw`Induct on $|G|$. A planar graph has a vertex $v$ of degree at most $5$ (from $m\le 3n-6$); colour $G-v$ by induction. If the neighbours of $v$ use at most four colours, give $v$ a free one. Otherwise $v$ has five neighbours $n_1,\dots,n_5$ in cyclic order with colours $1,\dots,5$. Look at the Kempe chain of colours $1,3$ containing $n_1$. If it misses $n_3$, swap its two colours and colour $v$ with $1$. If it reaches $n_3$, it together with $v$ forms a closed curve that separates $n_2$ from $n_4$, so the $2,4$-chain from $n_2$ cannot reach $n_4$: swap that one instead. Kempe's argument for four colours breaks because a degree-$5$ vertex lets two chains be unlinked only when only two colours are involved.`,
      caption: String.raw`Step through the proof on a random plane triangulation: first vertices of degree $\le5$ are peeled off, then they are re-inserted in reverse order. When all five colours surround a vertex, the Kempe chain (red ring) is swapped. Use *next example with a swap* to find a graph where this happens.`,
      deps: ['graph-4.2.10', 'graph-5.1.1a', 'graph-4.1.1'], refs: ['Diestel, Graph Theory, 6th ed., Proposition 5.1.2 and first proof, pp. 124–125'], tags: ['colouring', 'Kempe chain', 'planar'],
      credit: 'Heawood, 1890 (repairing Kempe, 1879)',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Five_color_theorem' },
      viz(v) {
        const s = gstage(v, { height: 360 });
        const nS = v.slider('vertices $n$', 6, 20, 14, { int: true, onChange: () => rebuild() });
        let seed = 1, swapsInfo = 0;
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 10, draggable: false });
        function build() { return fiveFrames(triangulation(nS.value, seed * 31 + nS.value), seed); }
        let B = build(); for (let t = 0; t < 300 && B.swaps === 0; t++) { seed++; B = build(); } swapsInfo = B.swaps;
        loadSpec(G, { nodes: B.D.pos.map(([x, y], i) => ({ id: i, x, y, label: String(i + 1) })), edges: B.D.E, layout: 'fit' });
        const swAt = () => { const i = B.frames.findIndex((f) => /^Swap/.test(f.note)); return i >= 0 ? i : 'end'; };
        const S = v.steps({ frames: B.frames, start: swAt(), still: swAt(), speed: 1.3, codePos: 'below', code: ['peel: repeatedly remove a vertex v of degree ≤ 5', 'recolour back in reverse order:', '  if the neighbours of v miss a colour: use it', '  else (5 neighbours, 5 colours): take a Kempe chain', '    n₁→n₃ if it avoids n₃, else n₂→n₄; swap its colours', '  and give v the colour that is now free'], codeTitle: 'Five-colouring proof' });
        function rebuild() { B = build(); swapsInfo = B.swaps; loadSpec(G, { nodes: B.D.pos.map(([x, y], i) => ({ id: i, x, y, label: String(i + 1) })), edges: B.D.E, layout: 'fit' }); S.reset(B.frames, { at: swAt() }); }
        v.button('Next example', () => { seed++; rebuild(); });
        v.button('Next example with a Kempe swap', () => { for (let t = 0; t < 300; t++) { seed++; B = build(); if (B.swaps > 0) break; } rebuild(); });
        v.render(() => {
          const f = S.frame; if (!f.live) return;
          const dead = []; f.live.forEach((l, i) => { if (!l) dead.push(i); });
          const chain = new Set(f.chain), nb = new Set(f.nb);
          G.draw({
            dim: dead, nodeFill: (id) => cc(f.col[id]), nodeRing: (id) => (id === f.cur ? 'gold' : chain.has(id) ? 'red' : nb.has(id) ? 'purple' : null),
            edgeColor: (e) => (f.cur >= 0 && (e.from === f.cur || e.to === f.cur) ? 'gold' : null),
          });
        });
        v.legend([['gold', 'the vertex being handled', { dot: true }], ['purple', 'its neighbours', { dot: true }], ['red', 'Kempe chain', { dot: true }]]);
        v.readout(() => `this graph needs ${swapsInfo} Kempe swap${swapsInfo === 1 ? '' : 's'} in the proof`);
      },
    },
    {
      num: '5.1.3', kind: 'Theorem', name: 'Grötzsch: triangle-free planar graphs are 3-colourable',
      statement: String.raw`Every planar graph without triangles is $3$-colourable.`,
      idea: String.raw`The proof (Grötzsch 1959; Thomassen's later argument is much shorter) strengthens the claim so that it can be proved by induction on plane graphs, controlling the colouring of the outer face. Both hypotheses are needed: a planar graph with triangles may need four colours ($K^4$, odd wheels), and a triangle-free graph that is not planar may need four too (the Grötzsch graph, a Mycielski construction on $C^5$).`,
      caption: String.raw`Pick *random* to sample maximal triangle-free planar graphs and watch a proper 3-colouring appear. The other presets break one hypothesis each: $K^4$ and the wheel are planar but have triangles, the Grötzsch graph is triangle-free but not planar, and both need four colours.`,
      deps: ['graph-5.1.1a', 'graph-4.4.1a'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.1.3, p. 126'], tags: ['colouring', 'planar', 'triangle-free'],
      credit: 'Grötzsch, 1959',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Gr%C3%B6tzsch%27s_theorem' },
      viz(v) {
        const s = gstage(v, { height: 360 });
        const P = { rnd: ['random', null], k4: ['$K^4$', () => named('complete', 4)], w5: ['odd wheel', () => wheel(5)], gro: ['Grötzsch graph', () => grotzsch()], c5: ['$C^5$', () => named('cycle', 5)] };
        const sel = v.select('graph', opts(P), 'rnd');
        const nS = v.slider('vertices (random)', 6, 16, 11, { int: true });
        let seed = 3;
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 12, editable: false });
        let key = '', info = null, H = null, col = null;
        v.button('Resample', () => { seed++; });
        v.render(() => {
          const k2 = sel.value + (sel.value === 'rnd' ? ':' + nS.value + ':' + seed : '');
          if (k2 !== key) {
            key = k2;
            let sp;
            if (sel.value === 'rnd') { const E = triFreePlanar(nS.value, rng32(seed * 17 + nS.value)); sp = planarSpec(nS.value, E); } else sp = spec0(P[sel.value][1]());
            sp.nodes.forEach((n, i) => { n.label = String(i + 1); });
            loadSpec(G, sp);
            H = ix(sp);
            const c3 = colourWith(nbrs(H), 3), ch = chromatic(H);
            col = c3.status === 'yes' ? c3.col : ch.col;
            info = { n: H.n, m: H.m, tri: triangles(H), planar: isPlanar(H), chi: ch.k };
          }
          G.draw({ nodeFill: (id) => cc(col[H.at(id)]) });
        });
        v.readout(() => {
          const i = info; if (!i) return '';
          const hyp = `${i.planar ? 'planar' : 'not planar'}, ${i.tri ? i.tri + ' triangle' + (i.tri > 1 ? 's' : '') : 'no triangle'}`;
          const concl = i.planar && !i.tri ? `hypotheses hold, so $\\chi\\le3$ — and indeed $\\chi=${i.chi}$` : `a hypothesis fails; here $\\chi=${i.chi}$`;
          return `$n=${i.n}$, $m=${i.m}$ · ${hyp}\n${concl}`;
        });
      },
    },
    // ====================================================================== 5.2 Colouring vertices
    {
      num: '5.2.1', kind: 'Proposition', name: String.raw`χ(G) ≤ ½ + √(2m + ¼)`,
      statement: String.raw`Every graph with $m$ edges satisfies $\chi(G)\le \tfrac12+\sqrt{2m+\tfrac14}$. Equality holds for complete graphs $K^k$, for which $m=\binom k2$.`,
      idea: String.raw`In an optimal colouring with $k=\chi(G)$ colours, every two colour classes must be joined by at least one edge: otherwise merge them and save a colour. So $G$ has at least $\binom k2$ edges, i.e. $k^2-k\le 2m$; solving the quadratic gives the bound. For $K^k$ every pair of classes is joined by exactly one edge, so nothing is wasted.`,
      caption: String.raw`Each grey dot is $\chi$ of a random graph on $n$ vertices with the given number $m$ of edges (exact colouring); the curve is the bound. Complete graphs (green) touch it. Drag the handle along $m$ to see a sample graph with its optimal colouring.`,
      deps: ['graph-5.1.1a'], refs: ['Diestel §5.2'], tags: ['colouring', 'bounds'],
      viz(v) {
        const sA = v.stage({ x: [0, 46], y: [0, 11], axes: 'box', gutter: true, height: 340, xlabel: 'edges $m$', ylabel: '$\\chi$', title: '$\\chi$ against $m$', yticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
        const sB = gstage(v, { height: 340, title: 'a sample with the chosen $m$' });
        const nS = v.slider('vertices $n$', 5, 10, 8, { int: true });
        const h = sA.handle(10, 1, { color: 'orange', constrain: 'x' });
        let seed = 1, data = { n: 0 };
        const G = v.graph(sB, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 12, draggable: false });
        v.button('Resample', () => { seed++; data = { n: 0 }; });
        let samp = { key: '' }, info = {};
        v.render(() => {
          const n = nS.value, N = (n * (n - 1)) / 2;
          if (data.n !== n) {
            const pts = [];
            for (let m = 0; m <= N; m++) for (let j = 0; j < 6; j++) { const sp = gnm(n, m, rng32(seed * 7919 + n * 131 + m * 17 + j)); pts.push([m, chromatic(ix(sp)).k]); }
            data = { n, pts };
          }
          sA.setView([-1, N + 1], [0, Math.max(5, Math.ceil(0.5 + Math.sqrt(2 * N + 0.25)) + 1)]);
          const m = Math.max(0, Math.min(N, Math.round(h.x))); h.set(m, h.y);
          const bound = (mm) => 0.5 + Math.sqrt(2 * mm + 0.25);
          sA.fn(bound, { domain: [0, N], color: 'accent', width: 2.5 });
          sA.dots(data.pts, { r: 3.5, color: 'muted', alpha: 0.55 });
          for (let k = 2; k <= n; k++) sA.dot((k * (k - 1)) / 2, k, { r: 6, color: 'green', label: `K${k}`, labelPos: 'se' });
          sA.vline(m, { color: 'orange', width: 1.5, dash: true });
          const key = n + ':' + m + ':' + seed;
          if (samp.key !== key) { const sp = gnm(n, m, rng32(seed * 31 + m + n)); sp.nodes.forEach((x, i) => { x.label = String(i + 1); }); loadSpec(G, sp); const H = ix(sp), r = chromatic(H); samp = { key, H, col: r.col, k: r.k }; }
          G.draw({ nodeFill: (id) => cc(samp.col[samp.H.at(id)]) });
          const at = data.pts.filter((p) => p[0] === m).map((p) => p[1]);
          info = { m, b: bound(m), mx: at.length ? Math.max(...at) : samp.k, k: samp.k };
        });
        v.legend([['accent', '$\\tfrac12+\\sqrt{2m+\\frac14}$'], ['muted', 'random graphs', { dot: true }], ['green', 'complete graph $K^k$', { dot: true }]]);
        v.readout(() => `$m=${info.m}$: bound $=${v.fix(info.b, 2)}$, so $\\chi\\le${Math.floor(info.b + 1e-9)}$ · largest $\\chi$ among the samples $=${info.mx}$ · shown graph: $\\chi=${info.k}$`);
      },
    },
    {
      num: '5.2.1a', kind: 'Algorithm', name: 'Greedy colouring and the colouring number',
      statement: String.raw`**Greedy colouring.** Given an order $v_1,\dots,v_n$ of the vertices, give $v_i$ the least colour not used by its neighbours among $v_1,\dots,v_{i-1}$. It uses at most $\Delta(G)+1$ colours, and in general at most $1+\max_i d_{<}(v_i)$ colours, where $d_<(v_i)$ counts earlier neighbours. The **colouring number** $\operatorname{col}(G)$ is the least $k$ such that some order has every vertex with fewer than $k$ earlier neighbours.`,
      idea: String.raw`A vertex with $d_<$ earlier neighbours can only be blocked by $d_<$ colours, so colour number $d_<+1$ is always free. The order matters enormously: on a crown graph (bipartite, $\chi=2$) the order $a_1,b_1,a_2,b_2,\dots$ forces $n$ colours, while ordering by repeated deletion of a minimum-degree vertex (smallest-last) achieves $\operatorname{col}(G)$ colours.`,
      caption: String.raw`Choose a graph and an order, then step through the greedy algorithm (the small numbers show the order, the gold ring the vertex being coloured). On the crown graph the label order is a bad one: compare with smallest-last. The readout lists $\chi$, $\operatorname{col}(G)$ and $\Delta+1$.`,
      deps: ['graph-5.1.1a', 'graph-1.2.1a'], refs: ['Diestel, Graph Theory, 6th ed., §5.2, pp. 126–127'], tags: ['greedy', 'colouring number'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const s = gstage(v, { height: 340 });
        const P = { crown: ['crown graph', () => crown(5)], pet: ['Petersen', () => named('petersen')], rnd: ['random', () => gnm(11, 20, rng32(5))], cube: ['cube', () => named('cube')] };
        const gsel = v.select('graph', opts(P), 'crown', { onChange: () => recompute() });
        const osel = v.select('order', [{ value: 'label', label: 'label order' }, { value: 'random', label: 'random' }, { value: 'sl', label: 'smallest-last' }, { value: 'lf', label: 'largest degree first' }], 'label', { onChange: () => recompute() });
        let seed = 1, H = null, order = [], sum = {}, S = null;
        const G = v.graph(s, { ...P.crown[1](), r: 13, draggable: true });
        function frames() {
          const adj = nbrs(H), col = new Array(H.n).fill(-1), out = [{ col: col.slice(), cur: -1, note: 'Start: nothing coloured.' }];
          for (const u of order) {
            const seen = [...new Set(adj[u].map((w) => col[w]).filter((c) => c >= 0))].sort((a, b) => a - b); let c = 0; while (seen.includes(c)) c++;
            col[u] = c;
            out.push({ col: col.slice(), cur: u, note: `Vertex ${G.lab(H.ids[u])}: earlier neighbours use ${seen.length ? seen.map(colName).join(', ') : 'no colour'}; take ${colName(c)}.` });
          }
          return out;
        }
        function recompute() {
          const sp = P[gsel.value][1](); loadSpec(G, sp); H = ix(G);
          const d = degeneracy(H), r = rng32(seed * 13);
          order = osel.value === 'label' ? H.ids.map((_, i) => i) : osel.value === 'random' ? shuffled(H.ids.map((_, i) => i), r) : osel.value === 'sl' ? d.removed.slice().reverse() : H.ids.map((_, i) => i).sort((a, b) => nbrs(H)[b].length - nbrs(H)[a].length);
          const g = greedyColour(H, order), ch = chromatic(H);
          sum = { used: g.used, chi: ch.k, col: d.d + 1, D: maxDeg(H) + 1 };
          if (S) S.reset(frames(), { at: 'end' });
        }
        H = ix(G); recompute();
        S = v.steps({ frames: frames(), start: 'end', still: 'end', speed: 1.3, codePos: 'below', code: ['for i = 1 … n:', '  c ← least colour not on an earlier neighbour of vᵢ', '  colour vᵢ with c'], codeTitle: 'Greedy colouring' });
        v.button('New random order', () => { seed++; osel.set('random', { fire: true }); });
        v.render(() => {
          const f = S.frame; if (!f.col) return;
          const rank = new Map(order.map((u, i) => [H.ids[u], i + 1]));
          G.draw({ nodeFill: (id) => cc(f.col[H.at(id)]), nodeNote: (id) => String(rank.get(id)), nodeRing: (id) => (f.cur >= 0 && H.at(id) === f.cur ? 'gold' : null) });
        });
        v.readout(() => `greedy used $${sum.used}$ colours · $\\chi(G)=${sum.chi}$ · $\\operatorname{col}(G)=${sum.col}$ · $\\Delta+1=${sum.D}$`);
      },
    },
    {
      num: '5.2.2', kind: 'Proposition', name: String.raw`χ ≤ col(G) = max δ(H) + 1`,
      statement: String.raw`For every graph $G$, $\chi(G)\le \operatorname{col}(G)=1+\max_{H\subseteq G}\delta(H)$, the maximum over all subgraphs $H$ of the minimum degree.`,
      idea: String.raw`Delete a vertex of least degree again and again. Let $d$ be the largest degree met at the moment of deletion. Re-inserting the vertices in reverse order, each has at most $d$ earlier neighbours, so greedy colouring uses at most $d+1$ colours; hence $\operatorname{col}(G)\le d+1$. Conversely the remaining graph at the first moment a vertex of degree $d$ is deleted has minimum degree $d$, and in any order the last vertex of a subgraph $H$ has $\delta(H)$ earlier neighbours; so $\operatorname{col}(G)\ge\delta(H)+1$ for every $H$.`,
      caption: String.raw`In *peel* mode delete vertices of least degree one at a time (slider) and watch the bar chart of the degrees at deletion; when the remaining graph is the subgraph $H$ with $\delta(H)=d$ it is ringed in green. In *colour back* mode re-insert in reverse order, colouring greedily: never more than $d+1$ colours.`,
      deps: ['graph-5.2.1a'], refs: ['Diestel, Graph Theory, 6th ed., Proposition 5.2.2 and preceding proof, p. 127'], tags: ['degeneracy', 'colouring number'],

      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const P = {
          rnd: ['random', () => gnm(14, 26, rng32(9))], pet: ['Petersen', () => named('petersen')],
          k5t: ['$K^5$ with a tail', () => ({ nodes: [...Array(5).keys()].map((i) => ({ id: i, x: Math.cos(TAU * i / 5), y: Math.sin(TAU * i / 5) })).concat([5, 6, 7, 8].map((i) => ({ id: i, x: 1.8 + (i - 5) * 0.8, y: 0 }))), edges: [...[0, 1, 2, 3, 4].flatMap((a) => [0, 1, 2, 3, 4].filter((b) => b > a).map((b) => [a, b])), [4, 5], [5, 6], [6, 7], [7, 8]], layout: 'fit' })],
          grid: ['grid', () => ({ nodes: [...Array(16).keys()].map((i) => ({ id: i, x: i % 4, y: -Math.floor(i / 4) })), edges: [...Array(16).keys()].flatMap((i) => [(i % 4) < 3 ? [i, i + 1] : null, i < 12 ? [i, i + 4] : null]).filter(Boolean), layout: 'fit' })],
        };
        const s = gstage(v, { height: 340, title: 'the graph (numbers: degrees in what is left)' });
        const sb = v.stage({ x: [0, 16], y: [0, 7], axes: 'box', gutter: true, height: 340, xlabel: 'deletion step', ylabel: 'degree at deletion', title: 'smallest degree met' });
        const gsel = v.select('graph', opts(P), 'rnd', { onChange: () => load() });
        const mode = v.select('mode', [{ value: 'peel', label: 'peel' }, { value: 'back', label: 'colour back' }], 'peel');
        const G = v.graph(s, { ...P.rnd[1](), r: 13, draggable: true });
        const tS = v.slider('steps', 0, 16, 0, { int: true });
        let H, D, backCol;
        function load() {
          loadSpec(G, P[gsel.value][1]()); H = ix(G); D = degeneracy(H);
          const g = greedyColour(H, D.removed.slice().reverse()); backCol = g.col;
          sb.setView([-0.5, H.n + 0.5], [0, Math.max(...D.mins) + 2]);
          tS.set(D.coreAt);
        }
        load();
        v.render(() => {
          const t = Math.min(tS.value, H.n), peel = mode.value === 'peel';
          const adj = nbrs(H);
          const gone = new Set(D.removed.slice(0, t));
          const deg = (u) => adj[u].filter((w) => !gone.has(w)).length;
          if (peel) {
            const core = t === D.coreAt;
            const dead = D.removed.slice(0, t);
            G.draw({
              dim: dead.map((u) => H.ids[u]), nodeNote: (id) => (gone.has(H.at(id)) ? null : String(deg(H.at(id)))),
              nodeRing: (id) => { const u = H.at(id); if (gone.has(u)) return null; if (core) return 'green'; return t < H.n && u === D.removed[t] ? 'gold' : null; },
            });
          } else {
            const shown = new Set(D.removed.slice().reverse().slice(0, t));
            const back = (u) => adj[u].filter((w) => shown.has(w) && D.removed.indexOf(w) > D.removed.indexOf(u)).length;
            G.draw({ dim: H.ids.filter((_, u) => !shown.has(u)), nodeFill: (id) => (shown.has(H.at(id)) ? cc(backCol[H.at(id)]) : null), nodeNote: (id) => (shown.has(H.at(id)) ? String(back(H.at(id))) : null) });
          }
          D.mins.forEach((m, i) => { if (!peel || i < t) sb.rect(i + 0.15, 0, i + 0.85, m, { fill: m === D.d ? 'green' : 'accent', fillAlpha: 0.5, color: m === D.d ? 'green' : 'accent' }); });
          sb.hline(D.d, { color: 'green', dash: true });
          sb.text(`d = ${D.d}`, H.n - 0.3, D.d + 0.35, { align: 'right', color: 'green' });
        });
        v.readout(() => {
          const t = Math.min(tS.value, H.n);
          const gnow = new Set(D.removed.slice(0, t));
          if (mode.value === 'peel') return `after $${t}$ deletions the remaining graph has minimum degree $${t < H.n ? Math.min(...H.ids.map((_, u) => u).filter((u) => !gnow.has(u)).map((u) => nbrs(H)[u].filter((w) => !gnow.has(w)).length)) : '-'}$ · degeneracy $d=${D.d}$, so $\\operatorname{col}(G)=${D.d + 1}$`;
          const used = new Set(D.removed.slice().reverse().slice(0, t).map((u) => backCol[u])).size;
          return `re-inserted $${t}$ vertices (numbers: earlier neighbours) · colours used so far $${used}$ ≤ $d+1=${D.d + 1}$`;
        });
      },
    },
  ],
};
