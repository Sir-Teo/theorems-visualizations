import {drawingIssues,faceComparison,buildK5Model,K5_MODELS,glueGraphs,displayPlanarPos as planarPos} from './ch04-embedding.audit.js';
// Graph Theory (Diestel) — Chapter 4, part Z1 (§§4.3–4.4: planar embeddings, Whitney, planar and maximally planar graphs, Kuratowski–Wagner)
import {
  K, ix, comps, blob, PALETTE, named, gstage, EDIT, cacheBy, wheel, kappa, isKconn, amask, allCycles, nonSepInduced, blocks,
  crossings, faceWalks, dmp, tutte, spread, isPlanar, planarEdges, kuratowski, faceSetKey, faceKey, maximalize, ixE, fitPos, posOf,
  loadSpec, segPoint, specOf, norm, contractG, randomTriangulation, triDraw, ekey2, TAU,
} from './ch04-z.shared.js';

// ---------- presets ----------
const K24 = () => specOf([[0, 0], [3, 0], [1.5, 1.7], [1.5, 0.6], [1.5, -0.6], [1.5, -1.7]], [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5]]);
const K4K4 = () => specOf([[0, 0.8], [0, -0.8], [-1.4, 0], [-0.8, 0.3], [1.4, 0], [0.8, -0.3]].map(([x, y], i) => (i === 3 ? [-0.6, 0.15] : i === 5 ? [0.6, -0.15] : [x, y])),
  [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3], [0, 4], [0, 5], [1, 4], [1, 5], [4, 5]]);
const K5M = () => { const S = named('complete', 5); return { ...S, edges: S.edges.filter(([a, b]) => !(a === 0 && b === 1)) }; };
const PRE = {
  cycle:()=>named('cycle',5), cube: () => named('cube'), prism: () => named('prism', 5), w5: () => wheel(5), oct: () => named('octahedron'), k4: () => named('complete', 4),
  k5: () => named('complete', 5), k5m: K5M, k33: () => named('kmn', 3, 3), pet: () => named('petersen'), k24: K24, k4k4: K4K4,
};
const PLAB = { cycle:'$C_5$', cube: 'cube', prism: '5-prism', w5: 'wheel $W_5$', oct: 'octahedron', k4: '$K^4$', k5: '$K^5$', k5m: '$K^5$ minus an edge', k33: '$K_{3,3}$', pet: 'Petersen', k24: '$K_{2,4}$', k4k4: 'two $K^4$ along an edge' };
const opts = (keys) => keys.map((k) => ({ value: k, label: PLAB[k] }));
const norms = {}; const NORM = (k) => (norms[k] ||= norm(PRE[k]()));
export const embeddingPreset=k=>NORM(k);
const PH = (k) => { const N = NORM(k); return ixE(N.n, N.E); };
const lab1 = (i) => String(i + 1);
/** Largest face as outer face. */
const outerOf = (faces) => faces.reduce((b, f, i) => (f.length > faces[b].length ? i : b), 0);
/** Embedding variant of a 2-connected graph (random DMP choices from rng) drawn by Tutte's method. */
function embed(N, rng, outer) {
  const faces = dmp(N.n, N.E, rng); if (!faces) return null;
  const o = outer == null ? outerOf(faces) : ((outer % faces.length) + faces.length) % faces.length;
  return { faces, outer: o, pos: spread(N.n, N.E, tutte(N.n, N.E, faces, o), 60, faces[o]) };
}
/** Fill the bounded faces of a crossing-free drawing. */
function shade(s, F, pos, colOf, alpha = 0.22) {
  for (const f of F) { if (f.area <= 1e-9) continue; const c = colOf(f); if (c) s.poly(f.walk.map((i) => pos[i]), { fill: c, fillAlpha: alpha, stroke: false }); }
}
const setG = (G, N, pos) => loadSpec(G, specOf(pos || N.pos, N.E));
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const nonSepKeys = (H) => { const A = amask(H); return new Set(allCycles(H, 4000).filter((c) => nonSepInduced(H, A, c)).map((c) => faceKey(c.vs))); };

export function embeddingContractions(N) {
          let g = { groups: N.pos.map((_, i) => [i]), E: N.E.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]) }; const levels = [{ g, e: null }];
          for (let guard = 0; g.groups.length > 4 && guard < 30; guard++) {
            let done = false;
            for (let k = 0; k < g.E.length && !done; k++) {
              const [a, b] = g.E[k], h = contractG(g, a, b), H = ixE(h.groups.length, h.E);
              if (h.groups.length >= 4 && isKconn(H, 3).ok) { levels[levels.length - 1].e = [a, b]; levels.push({ g: h, e: null }); g = h; done = true; }
            }
            if (!done) break;
          }
          return levels;
        }

export default {
  collection: 'graph',
  chapter: 4,
  items: [
    // =====================================================================================================  4.3
    {
      num: '4.3.1a', kind: 'Definition', name: 'Planar embeddings; topological and combinatorial isomorphism',
      statement: String.raw`A planar embedding is an isomorphism from an abstract graph to a plane graph, called its drawing. For a fixed abstract isomorphism $\varphi$ between two plane graphs:
(a) it is **topological** in Diestel's convention if it is induced by a homeomorphism of the sphere after identifying the plane with a punctured sphere;
(b) it is **combinatorial** if it extends to a bijection of vertices, edges and faces preserving all incidences;
(c) it is **graph-theoretical** if it maps the set of facial boundary subgraphs onto that of the other drawing, without recording which face has each boundary.
An extension to a homeomorphism of the plane is an additional requirement that preserves the outer face.`,
      idea: String.raw`A sphere homeomorphism induces an incidence-preserving face bijection, hence a combinatorial isomorphism, and that implies the graph-theoretical condition. Distinguishing the last two definitions matters for a cycle: its inner and outer faces have the same boundary subgraph, and either face bijection is possible. In Diestel's topological convention, a bounded face may become the outer face. Theorem 4.3.1 relates these notions; its sphere homeomorphism is not required to fix the removed point.`,
      caption: String.raw`The left drawing $A$ is fixed, with each bounded face tinted. Drag the vertices of $B$: as long as no two edges cross, the app computes the faces of $B$ and compares their boundaries with those of $A$ edge by edge (the identity map of the vertex labels is $\varphi$). Matching faces get matching tints; a face of $B$ whose boundary is not a face boundary of $A$ is red. The buttons redraw $B$ with another outer face or with another embedding (possible when $G$ is only 2-connected). The drawing check treats contacts within its numerical precision as degeneracies.`,
      deps: ['graph-4.2.1a'], refs: ['Diestel, sixth edition (2025), §4.3 definitions, pp. 102–104.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=10'}, tags: ['plane graphs', 'isomorphism'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'k4k4', 'k24', 'w5', 'cycle']), 'cube', { onChange: () => reset() });
        const sA = gstage(v, { height: 320, title: 'drawing $A$ (fixed)' }), sB = gstage(v, { height: 320, title: 'drawing $B$ (drag the vertices)' });
        const GA = v.graph(sA, { nodes: [], edges: [], r: 11, draggable: false }), GB = v.graph(sB, { nodes: [], edges: [], r: 11 });
        let N = null, seedB = 0, outerB = 0, embA = null;
        function reset() { N = NORM(ex.value); embA = embed(N, null); seedB = 0; outerB = embA.outer; setG(GA, N, embA.pos); setG(GB, N, embA.pos); }
        v.button('another outer face for $B$', () => { const e = embed(N, null, ++outerB); setG(GB, N, e.pos); });
        v.button('another embedding for $B$', () => { const e = embed(N, v.rng(++seedB * 7919 + 1)); outerB = e.outer; setG(GB, N, e.pos); });
        v.button('scramble $B$', () => { const r = v.rng(++seedB * 31 + 5); setG(GB, N, N.pos.map(() => [r() * 2 - 1, r() * 2 - 1])); });
        v.button('reset $B$ to $A$', () => { setG(GB, N, embA.pos); });
        reset();
        let info = null;
        v.render(() => {
          const HA = ix(GA), HB = ix(GB), pA = posOf(GA, HA), pB = posOf(GB, HB);
          const FA=faceWalks(HA,pA),issues=drawingIssues(HB,pB),cr=crossings(HB,pB),FB=issues.length?[]:faceWalks(HB,pB);
          const keysA = new Set(FA.map((f) => f.key)), keysB = new Set(FB.map((f) => f.key));
          const colA = new Map(); FA.filter((f) => f.area > 0).forEach((f, i) => colA.set(f.key, PALETTE[i % PALETTE.length]));
          shade(sA, FA, pA, (f) => colA.get(f.key));
          GA.draw({});
          const bad = [];
          if (!cr.length) shade(sB, FB, pB, (f) => colA.get(f.key) || (bad.push(f), 'red'), 0.28);
          const pts = cr.map(([i, j]) => segPoint(pB[HB.E[i][0]], pB[HB.E[i][1]], pB[HB.E[j][0]], pB[HB.E[j][1]])).filter(Boolean);
          const crossE = new Set(); cr.forEach(([i, j]) => { crossE.add(HB.E[i][2]); crossE.add(HB.E[j][2]); });
          issues.forEach(q=>q.edges.forEach(k=>crossE.add(HB.E[k][2])));const badVertices=new Set(issues.flatMap(q=>q.vertices));
          GB.draw({nodeFill:id=>badVertices.has(HB.at(id))?'red':null, edgeColor: (e) => (crossE.has(e) ? 'red' : null), edgeWidth: (e) => (crossE.has(e) ? 3 : null) });
          for (const p of pts) sB.dot(p[0], p[1], { r: 4.5, color: 'red' });
          const oA = FA.find((f) => f.area < 0), oB = FB.find((f) => f.area < 0);
          const comparison=faceComparison(FA,FB),comb=!issues.length&&comparison.same;
          info={cr:issues.length,types:[...new Set(issues.map(q=>q.type))].join(', '),comb,top:comparison.planeExtension,unique:comparison.uniqueFaceMap,fa:FA.length,fb:FB.length};
        });
        v.legend([['accent', 'face of $A$ and the same face of $B$', { area: true }], ['red', 'face of $B$ not a face of $A$', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          if(info.cr)return `**$B$ fails the plane drawing check:** ${info.cr} geometric issue(s): ${info.types}. Separate vertices from one another and from nonincident edges, or reset the drawing.`;
          return `$A$ has ${info.fa} faces, $B$ has ${info.fb}. Identity labels: graph-theoretical **${info.comb?'✓':'✗'}**, combinatorial **${info.comb?'✓':'✗'}**, topological on the sphere **${info.comb?'✓':'✗'}**. ${info.comb?`A plane homeomorphism also exists: **${info.top?'✓':'✗'}** (${info.top?'outer boundary preserved':'outer boundary changed; sphere equivalence still holds'}). Face bijection ${info.unique?'unique':'not unique: a cycle has two choices'}.`:''}`;
        });
      },
    },
    {
      num: '4.3.1', kind: 'Theorem', name: 'Graph-theoretical, combinatorial & topological isomorphisms',
      statement: String.raw`(i) Every graph-theoretical isomorphism between two plane graphs is combinatorial. Its extension to a bijection of faces is unique exactly when the graph is not a cycle.
(ii) Every combinatorial isomorphism between two 2-connected plane graphs is topological, using Diestel's sphere convention.
An arbitrary abstract isomorphism need not preserve facial boundaries. For the 2-connected drawings here, fixing the outer face additionally permits an extension to a homeomorphism of the plane.`,
      idea: String.raw`For a cycle, Jordan's theorem gives two faces with the same boundary and two possible face bijections. Otherwise each facial boundary determines its face uniquely (4.2.5), so a graph-theoretical isomorphism gives the required incidence-preserving face bijection. For (ii), first extend the vertex map continuously along every edge. Because the graph is 2-connected, face boundaries are cycles. On the sphere, extend each boundary-circle map over its face disc by 4.1.4, and glue these finitely many compatible extensions. This constructs a sphere homeomorphism; preserving the designated outer face allows the removed point to be fixed as well.`,
      caption: String.raw`The left drawing uses one embedding of the graph, the right drawing another embedding (or another choice of outer face) of the *same* abstract graph, with $\varphi$ the identity of labels. The readout distinguishes abstract identity, facial-boundary preservation, the resulting combinatorial and sphere-topological isomorphisms, and the extra outer-face condition for a plane homeomorphism. The cycle shows the nonunique face-bijection case in (i). Slide **faces glued** to extend $\varphi$ over one more face at a time; a face whose cycle is missing on the right turns red and the extension stops there. $K_{2,4}$ and the glued $K^4$s have several embeddings; the cube and the prism have only one.`,
      deps: ['graph-4.3.1a', 'graph-4.1.4', 'graph-4.2.5', 'graph-4.2.6'], refs: ['Diestel, sixth edition (2025), Theorem 4.3.1 and proof, pp. 104–106.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=12'}, tags: ['plane graphs', 'isomorphism'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'k24', 'k4k4', 'cycle']), 'k24', { onChange: () => reset() });
        const emb = v.slider('embedding of $G\'$', 0, 5, 2, { int: true, onChange: () => redo() });
        const out = v.slider('outer face of $G\'$', 0, 11, 0, { int: true, onChange: () => redo() });
        const glue = v.slider('faces glued', 0, 12, 12, { int: true });
        const sA = gstage(v, { height: 310, title: 'embedding of $G$' }), sB = gstage(v, { height: 310, title: 'embedding of $G\'$' });
        const GA = v.graph(sA, { nodes: [], edges: [], r: 11, draggable: false }), GB = v.graph(sB, { nodes: [], edges: [], r: 11, draggable: false });
        let N, eA, eB;
        function reset() { N = NORM(ex.value); eA = embed(N, null); setG(GA, N, eA.pos); redo(); }
        function redo() { eB = embed(N, emb.value === 0 ? null : v.rng(emb.value * 104729 + 3), out.value); setG(GB, N, eB.pos); }
        reset();
        let info = null;
        v.render(() => {
          const HA = ix(GA), pA = posOf(GA, HA), HB = ix(GB), pB = posOf(GB, HB);
          const FA = faceWalks(HA, pA), FB = faceWalks(HB, pB);
          const keysB = new Set(FB.map((f) => f.key)), keysA = new Set(FA.map((f) => f.key));
          const inner = FA.filter((f) => f.area > 0), order = inner.map((f) => f.key);
          const upto = Math.min(glue.value, order.length), done = new Set(order.slice(0, upto));
          const colA = new Map(); inner.forEach((f, i) => colA.set(f.key, PALETTE[i % PALETTE.length]));
          let stop = null;
          for (const k of order.slice(0, upto)) if (!keysB.has(k)) { stop = k; break; }
          shade(sA, FA, pA, (f) => (done.has(f.key) ? (keysB.has(f.key) && (!stop || order.indexOf(f.key) < order.indexOf(stop)) ? colA.get(f.key) : 'red') : null), 0.26);
          shade(sB, FB, pB, (f) => (done.has(f.key) && keysA.has(f.key) && (!stop || order.indexOf(f.key) < order.indexOf(stop)) ? colA.get(f.key) : null), 0.26);
          GA.draw({}); GB.draw({});
          const oA = FA.find((f) => f.area < 0), oB = FB.find((f) => f.area < 0);
          const comb = FA.length === FB.length && [...keysA].every((k) => keysB.has(k));
          const comparison=faceComparison(FA,FB);info={comb,top:comparison.planeExtension,unique:comparison.uniqueFaceMap,fa:FA.length,upto,stop:!!stop,total:order.length};
        });
        v.legend([['accent', 'face of $G$ and its image under $\\varphi$', { area: true }], ['red', 'facial cycle of $G$ that is not a facial cycle of $G\'$', { area: true }]]);
        v.readout(()=>info&&`abstract identity **✓** · graph-theoretical/combinatorial **${info.comb?'✓':'✗'}** · topological on the sphere **${info.comb?'✓':'✗'}** · extends over the plane **${info.top?'✓':'✗'}**. Face bijection ${info.unique?'unique':'not unique (cycle: two choices)'}.
extension illustrated over ${info.upto} of ${info.total} bounded faces${info.stop?' — missing facial boundary prevents this extension':info.comb?' — face discs can be glued':''}.`);
      },
    },
    {
      num: '4.3.2', kind: 'Theorem', name: 'Whitney: 3-connected planar graphs embed uniquely', credit: 'H. Whitney',
      statement: String.raw`Any two planar embeddings of a 3-connected planar graph are combinatorially isomorphic through the identity of the abstract graph: all embeddings have the same facial cycles, namely the non-separating induced cycles of the graph. Equivalently, a 3-connected planar graph has an essentially unique embedding on the sphere.`,
      idea: String.raw`By 4.2.7 the facial cycles of any plane drawing of a 3-connected graph are exactly its non-separating induced cycles, a set which does not depend on the drawing. Since faces of 2-connected plane graphs are bounded by cycles, two embeddings therefore have the same facial cycles, and 4.3.1 turns this into a homeomorphism of the sphere. For graphs that are merely 2-connected the set of non-separating induced cycles is not forced and different embeddings occur: flipping a piece across a 2-separator changes the facial cycles.`,
      caption: String.raw`Press **sample** to run many randomised embedding procedures (each makes different choices when it may place a piece in several faces). The bars count how often each distinct set of facial cycles occurs; the slider shows one of them. For the 3-connected graphs there is exactly one bar, and its faces are the non-separating induced cycles that the app lists independently. For $K_{2,4}$ or two $K^4$ glued along an edge, flipping across the 2-separator can produce further bars. These are frequencies of this randomized procedure, not uniform samples of all embeddings. Finite searches do not prove uniqueness; the graph-theoretical characterization of facial cycles does.`,
      deps: ['graph-4.3.1', 'graph-4.2.7'], refs: ['Diestel, sixth edition (2025), Theorem 4.3.2 and proof, p. 106; source labels the theorem Whitney 1933.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=14'}, tags: ['planar', 'uniqueness of embedding'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k24', 'k4k4']), 'cube', { onChange: () => run() });
        const sel = v.slider('embedding shown', 1, 6, 1, { int: true });
        const sB = v.stage({ x: [0, 8], y: [0, 100], axes: 'box', gutter: true, height: 300, xlabel: 'embedding found', ylabel: 'samples (%)', title: 'how often each set of facial cycles occurs' });
        const sG = gstage(v, { height: 300, title: 'the embedding selected' });
        const G = v.graph(sG, { nodes: [], edges: [], r: 11, draggable: false });
        let N,H,found=[],ns,three,batch=0;
        function run() {
          N = NORM(ex.value); H = ixE(N.n, N.E);
          const m = new Map(); const rng=v.rng(2025+997*batch++);
          for (let i = 0; i < 400; i++) { const fc = dmp(N.n, N.E, rng); const key = faceSetKey(fc); if (!m.has(key)) m.set(key, { faces: fc, n: 0 }); m.get(key).n++; }
          found = [...m.values()].sort((a, b) => b.n - a.n);
          ns = nonSepKeys(H); three = isKconn(H, 3).ok; sel.set(1); show();
        }
        function show() { const e = found[Math.min(sel.value, found.length) - 1]; const o = outerOf(e.faces); setG(G, N, spread(N.n, N.E, tutte(N.n, N.E, e.faces, o), 60, e.faces[o])); }
        v.button('sample', run);
        sel.el.addEventListener?.('input', show);
        run();
        let last = 1;
        v.render(() => {
          if (sel.value !== last) { last = sel.value; show(); }
          sel.el.hidden=found.length<2;if(sel.value>found.length)sel.set(found.length);
          const tot = found.reduce((a, e) => a + e.n, 0);
          sB.setView([0, Math.max(6, found.length + 1)], [0, 100]);
          sB.bars(found.map((e) => (100 * e.n) / tot), { x0: 1, color: (val, i) => (i + 1 === Math.min(sel.value, found.length) ? 'accent' : 'muted') });
          const e = found[Math.min(sel.value, found.length) - 1], hf = faceWalks(ix(G), posOf(G, ix(G)));
          shade(sG, hf, posOf(G, ix(G)), (f) => PALETTE[hf.indexOf(f) % PALETTE.length], 0.2);
          G.draw({});
        });
        v.readout(() => {
          const e = found[Math.min(sel.value, found.length) - 1], keys = new Set(e.faces.map(faceKey)), same = ns.size === keys.size && [...ns].every((k) => keys.has(k));
          return `${H.n} vertices, ${H.m} edges · 3-connected: **${three ? '✓' : '✗'}** · distinct sets of facial cycles found: **${found.length}**\nthe ${e.faces.length} faces of the embedding shown ${same ? 'are exactly the ' : 'are not the '}${ns.size} non-separating induced cycles ${same ? '✓' : '✗'}`;
        });
      },
    },
    // =====================================================================================================  4.4
    {
      num: '4.4.1a', kind: 'Definition', name: 'Planar and maximally planar graphs',
      statement: String.raw`A graph is **planar** if it can be drawn in the plane, i.e. if it is isomorphic to a plane graph. A planar graph is **maximally planar** if it is planar but adding any edge between two non-adjacent vertices produces a non-planar graph.`,
      idea: String.raw`Planarity is a property of the abstract graph, witnessed by one crossing-free drawing, while "plane" refers to a drawing that has been fixed. The planar graphs are closed under taking subgraphs, so maximal planar graphs are the natural extremal objects: every planar graph is a spanning subgraph of a maximally planar one on the same vertex set (add edges while possible), which is why bounds on the number of edges of maximally planar graphs bound those of all planar graphs.`,
      caption: String.raw`Drag the vertices to remove the crossings (crossing edges and their crossing points are red). Whenever the graph is planar, **untangle** finds a crossing-free drawing for you. The readout applies a combinatorial planarity algorithm independently of the picture; geometric checks also reject coincident vertices and vertices lying on nonincident edges and counts how many non-edges could still be added keeping the graph planar; when that number is $0$ the graph is maximally planar. Edit the graph freely (${EDIT}).`,
      deps: ['graph-4.3.1a'], refs: ['Diestel, sixth edition (2025), §4.4 unnumbered definitions, p. 106.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=14'}, tags: ['planar', 'maximally planar'],
      viz(v) {
        const ex = v.select('start', opts(['k5m', 'k5', 'k33', 'cube', 'pet', 'oct']), 'k5m', { onChange: () => load(true) });
        const s = gstage(v, { height: 340, x: [0, 10], y: [0, 6.4] });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, editable: true });
        let rs = 0;
        function load(scr) { const N = NORM(ex.value), r = v.rng(++rs * 977 + 13); const idx = N.pos.map((_, i) => i).sort(() => r() - 0.5); const ring = N.pos.map((_, i) => [Math.cos(Math.PI / 2 - (TAU * idx[i]) / N.n), Math.sin(Math.PI / 2 - (TAU * idx[i]) / N.n)]); setG(G, N, ring); }
        v.button('scramble', () => load(true));
        v.button('untangle', () => { const H = ix(G); const p = planarPos(H); if (p) fitPos(G, H, p); });
        load(true);
        const info = cacheBy((G) => {
          const H = ix(G), planar = isPlanar(H); let add = 0;
          if (planar) { const have = new Set(H.E.map(([a, b]) => ekey2(a, b))), E = H.E.map(([a, b]) => [a, b]); for (let i = 0; i < H.n; i++) for (let j = i + 1; j < H.n; j++) if (!have.has(ekey2(i, j))) { E.push([i, j]); if (planarEdges(H.n, E)) add++; E.pop(); } }
          return { planar, add, n: H.n, m: H.m };
        });
        v.render(() => {
          const H = ix(G), pos = posOf(G, H), cr = crossings(H, pos), ce = new Set();
          cr.forEach(([i,j])=>{ce.add(H.E[i][2]);ce.add(H.E[j][2]);});const issues=drawingIssues(H,pos);issues.forEach(q=>q.edges.forEach(k=>ce.add(H.E[k][2])));const badVertices=new Set(issues.flatMap(q=>q.vertices));
          G.draw({nodeFill:id=>badVertices.has(H.at(id))?'red':null,edgeColor: (e) => (ce.has(e) ? 'red' : null), edgeWidth: (e) => (ce.has(e) ? 3 : null) });
          for (const [i, j] of cr) { const p = segPoint(pos[H.E[i][0]], pos[H.E[i][1]], pos[H.E[j][0]], pos[H.E[j][1]]); if (p) s.dot(p[0], p[1], { r: 4.5, color: 'red' }); }
        });
        v.readout(() => {
          const H=ix(G),I=info(G),issues=drawingIssues(H,posOf(G,H)),c=issues.length;
          return `drawing now: **${c} geometric issue${c===1?'':'s'}**${c===0?' (a plane graph)':': '+[...new Set(issues.map(q=>q.type))].join(', ')} · graph is **${I.planar ? 'planar' : 'not planar'}** (exact test)${I.planar ? ` · edges that could be added keeping it planar: **${I.add}** → ${I.add === 0 ? '**maximally planar**' : 'not maximally planar'}` : ' · so no drawing, however clever, avoids a crossing'}`;
        });
      },
    },
    {
      num: '4.4.1', kind: 'Proposition', name: 'Maximally planar graphs have exactly 3n − 6 edges',
      statement: String.raw`Every maximally planar graph with $n\ge 3$ vertices has exactly $3n-6$ edges. Consequently every planar graph with $n\ge3$ vertices has at most $3n-6$ edges, and every planar graph is a spanning subgraph of a maximally planar one.`,
      idea: String.raw`Draw the graph in the plane. By maximality it is a maximally plane graph, and a maximally plane graph is a plane triangulation (4.2.8): every face is bounded by a triangle, so $3\ell=2m$. Plugging into Euler's formula $n-m+\ell=2$ gives $m=3n-6$. The bound for arbitrary planar graphs follows by adding edges until maximality is reached (4.2.10).`,
      caption: String.raw`Start from a random spanning tree on $n$ vertices (drawn crossing-free) and add edges one at a time, each chosen at random among those that keep the graph planar, until none is left. The right panel shows many such runs for $n=4,\dots,12$: every run ends exactly on the line $m=3n-6$. Click two vertices in the left panel to test an edge of your own: if it would destroy planarity the app finds the subdivided $K^5$ or $K_{3,3}$ that appears.`,
      deps: ['graph-4.4.1a', 'graph-4.2.8', 'graph-4.2.10'], refs: ['Diestel §4.4'], tags: ['planar', 'edge count'],
      viz(v) {
        const nS = v.slider('$n$', 4, 12, 8, { int: true, onChange: () => fresh() });
        const sL = gstage(v, { height: 330, title: 'grow a maximally planar graph' });
        const sR = v.stage({ x: [3, 13], y: [0, 36], axes: 'box', gutter: true, height: 330, xlabel: 'number of vertices $n$', ylabel: 'edges at the end', title: 'where maximal runs end' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 12, draggable: false });
        let n, E, seed = 0, sel = null, flash = null, runs = [];
        const rngOf = () => v.rng(seed * 6007 + 11);
        function tree() { const r = rngOf(); const E0 = []; for (let i = 1; i < n; i++) E0.push([Math.floor(r() * i), i]); return E0; }
        function draw() { const H = ixE(n, E), p = planarPos(H); const nodes = H.ids.map((id, i) => ({ id, x: p[i][0], y: p[i][1], label: lab1(i) })); G.set({ nodes, edges: E.map(([a, b]) => [a, b]) }); G.layout('fit'); }
        function fresh() { n = nS.value; seed++; E = tree(); sel = null; flash = null; draw(); }
        function addables() { const have = new Set(E.map(([a, b]) => ekey2(a, b))), out = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!have.has(ekey2(i, j))) { E.push([i, j]); if (planarEdges(n, E)) out.push([i, j]); E.pop(); } return out; }
        v.button('add a random edge', () => { const a = addables(); if (a.length) { const r = rngOf(); E.push(a[Math.floor(r() * a.length)]); seed++; flash = null; draw(); } });
        v.button('run to the end', () => { const r = rngOf(); seed++; E = E.concat(maximalize(ixE(n, E), r)); flash = null; draw(); });
        v.button('new random tree', fresh);
        G.onClick = ({ node }) => {
          if (!node) { sel = null; return true; }
          if (sel == null || sel === node.id) { sel = sel === node.id ? null : node.id; return true; }
          const a = sel, b = node.id; sel = null;
          if (E.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) { flash = { msg: 'already an edge' }; return true; }
          E.push([a, b]);
          if (planarEdges(n, E)) { flash = null; draw(); } else { const k = kuratowski(ixE(n, E)); flash = { msg: `adding ${lab1(a)}${lab1(b)} creates a subdivided ${k.type === 'K5' ? 'K⁵' : 'K₃,₃'}`, k, E: E.slice() }; E.pop(); }
          return true;
        };
        // data for the scatter: many maximal runs
        { const r = v.rng(99); for (let nn = 4; nn <= 12; nn++) for (let t = 0; t < 5; t++) { const E0 = []; for (let i = 1; i < nn; i++) E0.push([Math.floor(r() * i), i]); const add = maximalize(ixE(nn, E0), r); runs.push([nn, E0.length + add.length]); } }
        fresh();
        v.render(() => {
          const H = ixE(n, E), kk = flash && flash.k;
          const inK = new Set(); if (kk) kk.edges.forEach((k) => inK.add(k));
          G.draw({
            nodeRing: (id) => (K(id) === K(sel) ? 'gold' : null),
            nodeFill: (id) => (kk && kk.branch.includes(H.at(id)) ? 'red' : null),
          });
          sR.line(3, 3 * 3 - 6, 13, 3 * 13 - 6, { color: 'green', width: 2 });
          sR.dots(runs.map(([a, b]) => [a, b]), { r: 3.2, color: 'accent' });
          sR.dot(n, E.length, { r: 7, color: 'gold' });
          sR.corner('line $m=3n-6$', 'tl', { color: 'green', weight: 700 });
        });
        v.legend([['green', '$m=3n-6$', { dash: false }], ['accent', 'ends of random maximal runs', { dot: true }], ['gold', 'current graph', { dot: true }]]);
        v.readout(() => {
          const a = addables().length;
          return `$n=${n}$, $m=${E.length}$, $3n-6=${3 * n - 6}$ · addable edges left: **${a}**${a === 0 ? ` → maximally planar, $m=3n-6$ ${E.length === 3 * n - 6 ? '✓' : '✗'}` : ` · so far $m\\le 3n-6$ ${E.length <= 3 * n - 6 ? '✓' : '✗'}`}${flash ? `\n**${flash.msg}**` : ''}`;
        });
      },
    },
    {
      num: '4.4.2', kind: 'Lemma', name: 'K⁵ or K₃,₃ as a minor iff as a topological minor',
      statement: String.raw`A graph contains $K^5$ or $K_{3,3}$ as a minor if and only if it contains $K^5$ or $K_{3,3}$ as a topological minor (i.e. a subdivision of one of them as a subgraph).`,
      idea: String.raw`A topological minor is always a minor, and a $K_{3,3}$ minor yields a subdivision because its maximum degree is 3 (1.7.3). For a $K^5$ minor take a minimal model. Each branch set is a tree, with exactly one edge to every other branch set. Adjoining those four external edges produces a tree with four leaves. After suppressing degree-2 vertices, it is either a 4-star or has two degree-3 vertices. If all five trees are stars, the model is a $TK^5$. Otherwise contract a nonstar branch tree to its two degree-3 vertices and all other branch sets to single vertices: the resulting six-vertex graph contains $K_{3,3}$. Apply 1.7.3 again to obtain the required subdivision.`,
      caption: String.raw`A $K^5$ minor model is shown on the left: each vertex of $K^5$ has been blown up into a path (its branch set, the shaded blob), with the four incident edges attached at various points. The right panel lets the app search for a subgraph that is a subdivision of $K^5$ or $K_{3,3}$ and shows what it finds. Choose the splitting pattern: $2{+}2$ at one vertex forces a $K_{3,3}$, $3{+}1$ leaves a $K^5$ subdivision, and with two vertices split as $2{+}2$ there are only three vertices of degree $\ge4$.`,
      deps: ['graph-1.7.3'], refs: ['Diestel, sixth edition (2025), Lemma 4.4.2 and proof, p. 107.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=15'}, tags: ['minors', 'topological minors'],
      viz(v) {
        const MODELS=K5_MODELS;
        const sel = v.select('model', [{ value: 'plain', label: 'no splitting' }, { value: 'a', label: 'one vertex $2{+}2$' }, { value: 'b', label: 'one vertex $3{+}1$' }, { value: 'c', label: 'one vertex $2{+}1{+}1$' }, { value: 'd', label: 'two vertices $2{+}2$' }], 'a', { onChange: () => load() });
        const sL = gstage(v, { height: 340, title: 'a $K^5$ model: branch sets shaded' }), sR = gstage(v, { height: 340, title: 'a subdivision found by the app' });
        const GL = v.graph(sL, { nodes: [], edges: [], r: 10, draggable: false }), GR = v.graph(sR, { nodes: [], edges: [], r: 10, draggable: false });
        let H, branch, kur;
        function load() {
          const M = buildK5Model(MODELS[sel.value]); H = ixE(M.n, M.E); branch = M.br; kur = kuratowski(H);
          loadSpec(GL, specOf(M.pos, M.E)); loadSpec(GR, specOf(M.pos, M.E));
        }
        load();
        v.render(() => {
          const pts = (ids) => ids.map((i) => { const n = GL.node(i); return [n.x, n.y]; });
          branch.forEach((ids, b) => {
            const segs = []; for (let k = 0; k + 1 < ids.length; k++) { const A = GL.node(ids[k]), B = GL.node(ids[k + 1]); segs.push([[A.x, A.y], [B.x, B.y]]); }
            blob(sL, pts(ids), segs, v.color(PALETTE[b % PALETTE.length]), 30, 0.22);
          });
          const col = new Map(); branch.forEach((ids, b) => ids.forEach((i) => col.set(K(i), PALETTE[b % PALETTE.length])));
          GL.draw({ nodeColor: (id) => col.get(K(id)) });
          const kk = (e) => ekey2(H.at(e.from), H.at(e.to)), inK = new Set(kur.edges.map((k) => ekey2(H.E[k][0], H.E[k][1]))), isB = new Set(kur.branch.map((u) => K(H.ids[u])));
          GR.draw({ edgeColor: (e) => (inK.has(kk(e)) ? 'green' : 'faint'), edgeWidth: (e) => (inK.has(kk(e)) ? 3.6 : 1.2), nodeFill: (id) => (isB.has(K(id)) ? 'gold' : null) });
        });
        v.legend([['green', 'subdivision found', { dash: false }], ['gold', 'its branch vertices', { dot: true }]]);
        v.readout(() => {
          const deg = H.adj.map((a) => a.length), big = deg.filter((d) => d >= 4).length;
          return `model: $K^5$ with branch sets of sizes ${branch.map((b) => b.length).join(', ')} · vertices of degree $\\ge4$: **${big}** (a $TK^5$ needs five)\nsubgraph found: subdivided **${kur.type === 'K5' ? '$K^5$' : '$K_{3,3}$'}** with ${kur.branch.length} branch vertices — so a $K^5$ minor always yields a topological $K^5$ or $K_{3,3}$ ✓`;
        });
      },
    },
    {
      num: '4.4.3', kind: 'Lemma', name: '3-connected graphs without a K⁵ or K₃,₃ minor are planar',
      statement: String.raw`Every 3-connected graph that contains neither $K^5$ nor $K_{3,3}$ as a minor is planar.`,
      idea: String.raw`Induction on $|G|$. For $K^4$ draw a triangle with a centre. Otherwise there is an edge $xy$ such that $G/xy$ is still 3-connected (3.2.4); as a minor of $G$ it has no $K^5$ or $K_{3,3}$ minor, so it has a plane drawing by induction, and in it the faces around the contracted vertex $w$ are bounded by cycles (4.2.6). One then has to split $w$ back into $x$ and $y$ inside this picture: if the neighbours of $x$ and of $y$ on the cycles around $w$ interleave in a way that blocks every such splitting, one finds a $K^5$ or $K_{3,3}$ minor from them (case analysis in the book, not reproduced here). The app illustrates a sequence of 3-connectivity-preserving contractions, but independently calls its planarity algorithm and redraws each graph; it does not implement the local geometric extension argument of the proof.`,
      caption: String.raw`The app contracts edges whose contraction keeps the graph 3-connected until $K^4$ remains, then illustrates the contraction sequence backwards: each step splits a vertex (the pair $x,y$ in orange) and redraws the larger graph. Planar examples go all the way up. For $K^5$, $K_{3,3}$ or the Petersen graph the process stops at the first graph that is no longer planar, where the app displays the subdivision of $K^5$ or $K_{3,3}$ that has appeared. Pick the graph and step with the player. Planarity is tested separately at every frame; these finite examples do not establish the lemma.`,
      deps: ['graph-3.2.4', 'graph-4.2.1', 'graph-4.2.6', 'graph-4.4.1a'], refs: ['Diestel, sixth edition (2025), Lemma 4.4.3 and proof, pp. 108–109.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=16'}, tags: ['planar', 'contraction'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k5', 'k33', 'pet']), 'cube', { onChange: () => rebuild() });
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, draggable: false });
        let S, shown = null;
        const chain=embeddingContractions;
        function frames() {
          const N = NORM(ex.value), L = chain(N), out = [];
          for (let j = L.length - 1; j >= 0; j--) {
            const g = L[j].g, H = ixE(g.groups.length, g.E), planar = isPlanar(H), pos = planar ? planarPos(H) : null;
            const split = j < L.length - 1 ? L[j].e : null;
            const kur = planar ? null : kuratowski(H);
            const lab = g.groups.map((m) => m.map((x) => x + 1).join('·'));
            const note = j === L.length - 1 ? `Contracting 3-connected-preserving edges leaves $K^4$, drawn as a triangle with a centre.` : planar ? `Split the orange vertex pair back: ${g.groups.length} vertices, still drawn without crossings.` : `**Stuck:** the graph on ${g.groups.length} vertices is not planar. It contains a subdivided ${kur.type === 'K5' ? '$K^5$' : '$K_{3,3}$'}, hence a $K^5$ or $K_{3,3}$ minor of $G$.`;
            out.push({ H, pos, kur, lab, split, note, level: j });
            if (!planar) break;
          }
          return out;
        }
        S = v.steps({ frames: frames(), speed: 0.9, start: 'end', still: 'end' });
        function rebuild() { S.reset(frames(), { at: 'end' }); shown = null; }
        v.render(() => {
          const f = S.frame; if (!f.H) return;
          if (shown !== f) {
            shown = f;
            const pos = f.pos || f.H.ids.map((_, i) => [Math.cos(Math.PI / 2 - (TAU * i) / f.H.n), Math.sin(Math.PI / 2 - (TAU * i) / f.H.n)]);
            G.set({ nodes: f.H.ids.map((id, i) => ({ id, x: pos[i][0], y: pos[i][1], label: f.lab[i] })), edges: f.H.E.map(([a, b]) => [a, b]) }); G.layout('fit');
          }
          const kk = (e) => ekey2(f.H.at(e.from), f.H.at(e.to));
          const inK = f.kur ? new Set(f.kur.edges.map((k) => ekey2(f.H.E[k][0], f.H.E[k][1]))) : null;
          const sp = f.split ? ekey2(f.split[0], f.split[1]) : null;
          G.draw({
            nodeFill: (id) => (f.split && (f.H.at(id) === f.split[0] || f.H.at(id) === f.split[1]) ? 'orange' : f.kur && f.kur.branch.includes(f.H.at(id)) ? 'gold' : null),
            edgeColor: (e) => (inK ? (inK.has(kk(e)) ? 'red' : 'faint') : sp && kk(e) === sp ? 'orange' : null),
            edgeWidth: (e) => (inK && inK.has(kk(e)) ? 3.6 : sp && kk(e) === sp ? 3.6 : null),
          });
        });
        v.readout(() => { const f = S.frame; return f.H ? `level ${f.level} of the contraction sequence: $|G_${f.level}|=${f.H.n}$ vertices, ${f.H.m} edges · crossings in the drawing: **${f.pos ? crossings(f.H, f.pos).length : '—'}**` : ''; });
      },
    },
    {
      num: '4.4.4', kind: 'Lemma', name: 'Edge-maximal graphs without X split along K²',
      statement: String.raw`Let $\mathcal X$ be a family of 3-connected graphs. Suppose $G$ has a proper vertex separation $\{V_1,V_2\}$ of order $\kappa(G)\le2$, with $V_1\cup V_2=V(G)$, both $V_i\setminus V_{3-i}$ nonempty, and no edge between the two sides. If $G$ is edge-maximal without a topological minor in $\mathcal X$, then both induced subgraphs $G[V_1]$ and $G[V_2]$ are edge-maximal with that property, and their intersection is a $K^2$. The examples use $\mathcal X=\{K^5,K_{3,3}\}$.`,
      idea: String.raw`Minimality of the separator ensures each separator vertex has a neighbor in every component on either side. Maximality forces every added edge into a forbidden subdivision. The 3-connected forbidden graph forces its branch vertices onto one side, apart from at most a subdividing path through the other. For an empty separator or a singleton, an edge across the sides can be rerouted through the separator to obtain a forbidden subdivision already in $G$, a contradiction. For two nonadjacent separator vertices, add their edge and replace it by a path through the other side. Thus the separator is an edge. Finally, an edge missing within one induced side, together with replacement of any excursion through the other side by this separator edge, establishes edge-maximality of both induced sides.`,
      caption: String.raw`Glue two graphs $G_1$ and $G_2$ along a separator of your choice: an edge ($K^2$), a single vertex, or two non-adjacent vertices. The readout tests whether the result has a $TK^5/TK_{3,3}$ (planarity test), and whether it could be edge-maximal: it counts the edges between the two sides that could still be added without creating one. The source lemma requires a proper minimum-order separation; all selected pieces are 3-connected, so the shown gluing set has the indicated minimum order. The examples that are planar have an addable edge across the sides and thus fail maximality. Nonplanar gluings fail the forbidden-subdivision hypothesis. This finite test is an illustration, not the general proof.`,
      deps: ['graph-1.4.1b', 'graph-1.7.1b'], refs: ['Diestel, sixth edition (2025), Lemma 4.4.4 and proof, pp. 109–110.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=17'}, tags: ['topological minors', 'edge-maximal'],
      viz(v) {
        const a = v.select('$G_1$', opts(['w5', 'oct', 'cube', 'prism']), 'w5', { onChange: () => load() });
        const b = v.select('$G_2$', opts(['oct', 'w5', 'cube', 'prism']), 'oct', { onChange: () => load() });
        const sep = v.select('separator $S$', [{ value: 'k2', label: 'edge ($K^2$)' }, { value: 'k1', label: 'one vertex' }, { value: 'nk', label: 'two non-adjacent vertices' }], 'k2', { onChange: () => load() });
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], r: 10, draggable: false });
        let H, side, S = [], res;
        function load() {
          const M=glueGraphs(NORM(a.value),NORM(b.value),sep.value);if(!M){res={none:true};return;}H=M.H;side=M.side;S=M.S;const c=H.n,E=H.E.map(([a,b])=>[a,b]),posAll=M.posAll;
          const planar = isPlanar(H); const pos = planar ? planarPos(H) : null;
          let add = 0; if (planar) { const Ec = E.map(([x, y]) => [x, y]); for (let i = 0; i < c; i++) for (let j = i + 1; j < c; j++) if (side[i] === 1 && side[j] === 2) { Ec.push([i, j]); if (planarEdges(c, Ec)) add++; Ec.pop(); } }
          const kur = planar ? null : kuratowski(H);
          res = { planar, add, kur, c, none: false, pos };
          const p = pos || (() => { const r = v.rng(3); return posAll.map((q) => [q[0] + (r() - 0.5) * 0.01, q[1]]); })();
          G.set({ nodes: H.ids.map((id, i) => ({ id, x: p[i][0], y: p[i][1], label: lab1(i) })), edges: H.E.map(([x, y]) => [x, y]) }); G.layout('fit');
        }
        load();
        v.render(() => {
          if (res.none) { s.corner('this graph has no pair of non-adjacent vertices: choose another one', 'bl', { color: 'red', weight: 700 }); return; }
          const kk = (e) => ekey2(H.at(e.from), H.at(e.to)), inK = res.kur ? new Set(res.kur.edges.map((k) => ekey2(H.E[k][0], H.E[k][1]))) : null;
          G.draw({
            nodeFill: (id) => (S.includes(H.at(id)) ? 'gold' : side[H.at(id)] === 1 ? 'accent' : 'orange'),
            edgeColor: (e) => (inK ? (inK.has(kk(e)) ? 'red' : 'faint') : null), edgeWidth: (e) => (inK && inK.has(kk(e)) ? 3.4 : null),
          });
        });
        v.legend([['accent', '$G_1\\setminus S$', { dot: true }], ['orange', '$G_2\\setminus S$', { dot: true }], ['gold', 'the separator $S$', { dot: true }]]);
        v.readout(() => res.none ? '' : res.planar
          ? `the glued graph has **no** $TK^5$ or $TK_{3,3}$ (planar) · edges between the sides that could still be added without creating one: **${res.add}**${res.add ? ' → not edge-maximal' : ' → no such edge'}`
          : `the glued graph is **not planar**: it contains a subdivided ${res.kur.type === 'K5' ? '$K^5$' : '$K_{3,3}$'} (red) → it is not a graph without $TX$, so it is not a candidate for the lemma`);
      },
    },
    {
      num: '4.4.5', kind: 'Lemma', name: 'Edge-maximal graphs without TK⁵, TK₃,₃ are 3-connected',
      statement: String.raw`Let $G$ be an edge-maximal graph with $n\ge4$ vertices that contains neither $TK^5$ nor $TK_{3,3}$. Then $G$ is 3-connected.`,
      idea: String.raw`Induct on the number of vertices, with $K^4$ as the base. If a proper separator of minimum order at most 2 exists, 4.4.4 makes it an edge $xy$ and makes both induced sides edge-maximal. Each smaller side is a triangle or 3-connected by induction, hence planar by 4.4.2–4.4.3. On each side choose a face incident with $xy$ and a third boundary vertex $z_i$. Maximality forces a forbidden subdivision in $G+z_1z_2$. If its branch vertices lie on one side, its excursion can be replaced using that face, creating a forbidden subdivision in a planar graph. Otherwise the small separator forces a $TK_{3,3}$ with only one branch vertex on one side; rerouting it into the chosen face again creates one in a planar graph. Both contradict 4.2.11. The player independently checks small finite examples; connectivity may already be at least 3 before maximality.`,
      caption: String.raw`Choose a starting graph with a small separator. The player adds, one at a time, edges that keep the graph free of $TK^5$ and $TK_{3,3}$ (that is: planar), in a random order, until no edge can be added. The orange vertices form a smallest separator at each step and the readout gives $\kappa$; the right panel plots $\kappa$ against the step. Whatever the start, the final graph has $\kappa\ge3$ (for $n\ge4$), and at the end the edge count is $3n-6$.`,
      deps: ['graph-4.4.4', 'graph-4.4.2', 'graph-4.4.3', 'graph-4.2.11'], refs: ['Diestel, sixth edition (2025), Lemma 4.4.5 and proof, pp. 110–111.'], links:{source:'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=18'}, tags: ['edge-maximal', 'connectivity'],
      viz(v) {
        const START = {
          path: (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]),
          bow: (n) => { const E = [], cl = (L) => { for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) E.push([L[i], L[j]]); }; cl([0, 1, 2, 3]); const L2 = n > 6 ? [3, 4, 5, 6] : [3, 4, 5]; cl(L2); for (let i = L2[L2.length - 1]; i + 1 < n; i++) E.push([i, i + 1]); return E; },
          star: (n) => Array.from({ length: n - 1 }, (_, i) => [0, i + 1]),
          two: (n) => { const E = []; for (let i = 0; i + 1 < Math.floor(n / 2); i++) E.push([i, i + 1]); for (let i = Math.floor(n / 2); i + 1 < n; i++) E.push([i, i + 1]); return E; },
        };
        const st = v.select('start', [{ value: 'path', label: 'path' }, { value: 'bow', label: 'two cliques at a cutvertex' }, { value: 'star', label: 'star' }, { value: 'two', label: 'two disjoint paths' }], 'path', { onChange: () => rebuild() });
        const nS = v.slider('$n$', 6, 11, 9, { int: true, onChange: () => rebuild() });
        v.button('other random order', () => { seed++; rebuild(); });
        const sL = gstage(v, { height: 330 }), sR = v.stage({ x: [0, 30], y: [-0.4, 5], axes: 'box', gutter: true, height: 330, xlabel: 'edges added', ylabel: 'connectivity $\\kappa$' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, draggable: false });
        let seed = 1, S, hist = [], shown = -1;
        const frames = () => {
          const n = nS.value, E0 = START[st.value](n), H0 = ixE(n, E0), r = v.rng(seed * 4093 + 7), add = maximalize(H0, r), out = [];
          hist = [];
          for (let t = 0; t <= add.length; t++) {
            const E = E0.concat(add.slice(0, t)), H = ixE(n, E), k = kappa(H); hist.push(k.k);
            out.push({ n, E, H, k, t, last: t === add.length, added: t ? add[t - 1] : null, total: add.length });
          }
          return out;
        };
        S = v.steps({ frames: frames(), speed: 3, start: 0, still: 'end', loop: false });
        function rebuild() { S.reset(frames(), { at: 'end' }); shown = -1; }
        v.render(() => {
          const f = S.frame; if (!f.H) return;
          if (shown !== f.t || G.nodes.length !== f.n) {
            shown = f.t; const p = planarPos(f.H);
            G.set({ nodes: f.H.ids.map((id, i) => ({ id, x: p[i][0], y: p[i][1], label: lab1(i) })), edges: f.E.map(([a, b]) => [a, b]) }); G.layout('fit');
          }
          const sepSet = new Set(f.k.sep.map((u) => K(f.H.ids[u]))), last = f.added ? ekey2(f.added[0], f.added[1]) : null, kk = (e) => ekey2(f.H.at(e.from), f.H.at(e.to));
          G.draw({ nodeFill: (id) => (sepSet.has(K(id)) ? 'orange' : null), edgeColor: (e) => (last && kk(e) === last ? 'green' : null), edgeWidth: (e) => (last && kk(e) === last ? 4 : null) });
          sR.setView([0, Math.max(10, f.total + 1)], [-0.4, 5]);
          sR.path(hist.map((k, t) => [t, k]), { color: 'faint', width: 1.5 });
          sR.path(hist.slice(0, f.t + 1).map((k, t) => [t, k]), { color: 'accent', width: 2.6 });
          sR.dot(f.t, f.k.k, { r: 6, color: 'gold' });
          sR.hline(3, { color: 'green', dash: true });
        });
        v.legend([['orange', 'a smallest separator', { dot: true }], ['green', 'newest edge', { dash: false }], ['accent', '$\\kappa$ so far']]);
        v.readout(() => { const f = S.frame; return f.H ? `step ${f.t}/${f.total}: $n=${f.n}$, $m=${f.E.length}$ (maximal value $3n-6=${3 * f.n - 6}$) · $\\kappa(G)=${f.k.k}$${f.last ? ` · **no edge can be added**: edge-maximal without $TK^5,TK_{3,3}$, and $\\kappa\\ge3$ ${f.k.k >= 3 ? '✓' : '✗'}` : ''}` : ''; });
      },
    },
    {
      num: '4.4.6', kind: 'Theorem', name: 'Kuratowski–Wagner theorem', credit: 'C. Kuratowski, 1930; K. Wagner, 1937',
      statement: String.raw`For a graph $G$ the following are equivalent: (i) $G$ is planar; (ii) $G$ contains neither $K^5$ nor $K_{3,3}$ as a minor; (iii) $G$ contains neither $K^5$ nor $K_{3,3}$ as a topological minor (i.e. no subgraph is a subdivision of $K^5$ or $K_{3,3}$).`,
      idea: String.raw`Planar graphs contain neither as a topological minor, because a plane graph has none (4.2.11), and (ii)$\Leftrightarrow$(iii) is 4.4.2. For the converse let $G$ have no $K^5$ or $K_{3,3}$ minor and add edges until it is edge-maximal with this property, on the same vertex set (by 4.4.2 this is the same as being edge-maximal without $TK^5,TK_{3,3}$). By 4.4.5 the result is 3-connected (if it has at least four vertices), hence planar by 4.4.3, and $G$ is a subgraph of a planar graph.`,
      caption: String.raw`Edit the graph (${EDIT}). If it is planar the right panel shows a crossing-free drawing computed by the app and the left panel keeps your layout; if not, the app finds a minimal non-planar subgraph, which is a subdivision of $K^5$ or $K_{3,3}$ (highlighted in red with its branch vertices in gold), and the right panel contracts the subdividing paths to display the $K^5$ or $K_{3,3}$ itself, labelling each edge with the length of its path.`,
      deps: ['graph-4.2.11', 'graph-4.4.2', 'graph-4.4.3', 'graph-4.4.5'], refs: ['Diestel §4.4'], see: ['top-10.8'], tags: ['planar', 'Kuratowski'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kuratowski%27s_theorem' },
      viz(v) {
        const ex = v.select('start', opts(['pet', 'k5', 'k33', 'cube', 'oct']), 'pet', { onChange: () => load() });
        const sL = gstage(v, { height: 340, title: 'your graph' }), sR = gstage(v, { height: 340, title: 'result' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, editable: true }), R = v.graph(sR, { nodes: [], edges: [], r: 11, draggable: false });
        function load() { const N = NORM(ex.value); setG(G, N); }
        load();
        const res = cacheBy((G) => {
          const H = ix(G), kur = kuratowski(H); let pos = null;
          if (!kur) pos = planarPos(H);
          return { H, kur, pos };
        });
        let shown = null;
        v.render(() => {
          const { H, kur, pos } = res(G);
          if (shown !== H || (shown && shown.sig !== null)) {
            shown = H;
            if (!kur) {
              const p = pos || [];
              R.set({ nodes: H.ids.map((id, i) => ({ id, x: p[i][0], y: p[i][1], label: G.lab(id) })), edges: H.E.map(([a, b]) => [H.ids[a], H.ids[b]]) }); R.layout('fit');
            } else {
              const br = kur.branch, id = new Map(br.map((u, i) => [u, i])), ring = br.map((_, i) => (kur.type === 'K5' ? [Math.cos(Math.PI / 2 - (TAU * i) / 5), Math.sin(Math.PI / 2 - (TAU * i) / 5)] : [(i < 3 ? i - 1 : i - 4) * 1.1, i < 3 ? 0.7 : -0.7]));
              let ps = ring;
              if (kur.type === 'K33') { // bipartition from paths
                const side = new Map([[br[0], 0]]); for (let t = 0; t < 4; t++) for (const p of kur.paths) { if (side.has(p.a) && !side.has(p.b)) side.set(p.b, 1 - side.get(p.a)); if (side.has(p.b) && !side.has(p.a)) side.set(p.a, 1 - side.get(p.b)); }
                let c0 = 0, c1 = 0; ps = br.map((u) => (side.get(u) === 0 ? [(c0++ - 1) * 1.2, 0.8] : [(c1++ - 1) * 1.2, -0.8]));
              }
              R.set({ nodes: br.map((u, i) => ({ id: H.ids[u], x: ps[i][0], y: ps[i][1], label: G.lab(H.ids[u]) })), edges: kur.paths.map((p) => ({ from: H.ids[p.a], to: H.ids[p.b], label: p.ks.length > 1 ? String(p.ks.length) : null })) }); R.layout('fit');
            }
          }
          const inK = kur ? new Set(kur.edges.map((k) => H.E[k][2])) : null;
          G.draw({ edgeColor: (e) => (inK ? (inK.has(e) ? 'red' : 'faint') : null), edgeWidth: (e) => (inK && inK.has(e) ? 3.6 : null), nodeFill: (id) => (kur && kur.branch.includes(H.at(id)) ? 'gold' : null) });
          R.draw({ nodeFill: () => (kur ? 'gold' : null), edgeColor: () => (kur ? 'red' : 'green') });
        });
        v.readout(() => { const { H, kur } = res(G); return kur ? `**not planar:** a subgraph is a subdivision of ${kur.type === 'K5' ? '$K^5$' : '$K_{3,3}$'} (${kur.edges.length} edges, branch vertices gold; the labels on the right give the lengths of the subdividing paths) → by the theorem no drawing exists` : `**planar** (${H.n} vertices, ${H.m} edges): crossing-free drawing on the right · no subdivision of $K^5$ or $K_{3,3}$ exists`; });
      },
    },
    {
      num: '4.4.7', kind: 'Corollary', name: 'Maximal planar graphs on ≥ 4 vertices are 3-connected',
      statement: String.raw`Every maximal planar graph (equivalently every edge-maximal graph without $K^5$ or $K_{3,3}$ as a minor) with at least $4$ vertices is 3-connected.`,
      idea: String.raw`By the Kuratowski–Wagner theorem 4.4.6 the planar graphs are exactly the graphs without a $TK^5$ or $TK_{3,3}$, so a maximal planar graph is edge-maximal without them, and 4.4.5 shows that such a graph with at least $4$ vertices is 3-connected.`,
      caption: String.raw`A random maximal planar graph on $n$ vertices. Click any two vertices to delete them: the remaining graph stays connected, and the colours show its components. The readout checks all $\binom n2$ pairs at once. Switch on **remove an edge** to leave the maximal class: if the removed edge meets a degree-3 vertex, its degree becomes 2 and its two neighbors separate it from the rest. Otherwise the graph may remain 3-connected; the readout checks the actual result rather than guaranteeing failure.`,
      deps: ['graph-4.4.5', 'graph-4.4.6'], refs: ['Diestel §4.4'], tags: ['maximal planar', 'connectivity'],
      viz(v) {
        const nS = v.slider('$n$', 4, 12, 9, { int: true, onChange: () => make() });
        const cut = v.toggle('remove an edge (leave the maximal class)', false, { onChange: () => make(true) });
        v.button('new graph', () => { seed++; make(); });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, draggable: false });
        let seed = 1, n, E, pairs, sel = [], H;
        function make(keep) {
          n = nS.value; const r = v.rng(seed * 7001 + 3);
          const T = triDraw(randomTriangulation(n, r, 8)); E = T.E.slice(); const P0 = spread(n, T.E, T.pos, 60, [0, 1, 2]);
          if (cut.value) { const deg = new Int32Array(n); E.forEach(([a, b]) => { deg[a]++; deg[b]++; }); const cand = E.filter(([a, b]) => deg[a] === 3 || deg[b] === 3); const e = cand.length ? cand[Math.floor(r() * cand.length)] : E[0]; E = E.filter((x) => x !== e); }
          H = ixE(n, E); const p = P0;
          G.set({ nodes: H.ids.map((id, i) => ({ id, x: p[i][0], y: p[i][1], label: lab1(i) })), edges: E.map(([a, b]) => [a, b]) }); G.layout('fit');
          pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const C = comps(H, (u) => u !== i && u !== j); pairs.push({ i, j, k: C.k }); }
          sel = [];
        }
        G.onClick = ({ node }) => { if (!node) { sel = []; return true; } const u = H.at(node.id); sel = sel.includes(u) ? sel.filter((x) => x !== u) : sel.length >= 2 ? [u] : sel.concat([u]); return true; };
        make();
        v.render(() => {
          let C = null;
          if (sel.length === 2) C = comps(H, (u) => u !== sel[0] && u !== sel[1]);
          G.draw({
            nodeFill: (id) => { const u = H.at(id); if (sel.includes(u)) return 'red'; return C ? PALETTE[C.comp[u] % PALETTE.length] : null; },
            dim: sel.map((u) => H.ids[u]), nodeRing: (id) => (sel.includes(H.at(id)) ? 'red' : null),
          });
          if (!sel.length) s.corner('click two vertices to delete them', 'bl', { color: 'muted', weight: 600 });
        });
        v.readout(() => {
          const bad = pairs.filter((p) => p.k > 1), mx = Math.max(...pairs.map((p) => p.k));
          let t = sel.length === 2 ? `deleting ${lab1(sel[0])} and ${lab1(sel[1])} leaves **${pairs.find((p) => p.i === Math.min(...sel) && p.j === Math.max(...sel)).k} component${pairs.find((p) => p.i === Math.min(...sel) && p.j === Math.max(...sel)).k === 1 ? '' : 's'}**\n` : '';
          return `${t}$n=${n}$, $m=${E.length}$ (maximal planar: $3n-6=${3 * n - 6}$) · of all ${pairs.length} pairs, **${bad.length}** disconnect the graph (at most ${mx} components) → ${bad.length === 0 ? '3-connected ✓' : 'not 3-connected'}`;
        });
      },
    },
  ],
};
