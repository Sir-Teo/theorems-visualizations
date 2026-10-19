// Algorithms — Chapter 10: Greedy algorithms, spanning trees and matroids (items 10.17–10.22; 10.1–10.8 in ch10.js, 10.9–10.16 in ch10-b.js)
import { K, ids, plural, clamp, fmt, rngOf, sumOf, huffman, entropy, shannonFano, textFreqs, bruteCodeLengths, R, TX, LN, blob, eKey, UF, ranked, wOf, totalW, mstBrute, kruskalTrace, primTrace, boruvkaTrace, MST_POS, MST_EDGES, nodesFrom, COMPC, popc, bitsOf, sysGraphic, sysLinear, sysUniform, sysMatching, allIndep, matroidTest, greedyIndep, bestIndep } from './ch10.shared.js';

import {exchangeCounterexample} from './greedy-audit.shared.js';

const r2 = (x) => String(Math.round(x * 1000) / 1000).replace('-', '−');

// ---------------------------------------------------------------- 10.17 graphs for Borůvka
function gridSpec(r, c, seed) {
  const nodes = [], edges = [], rg = rngOf(seed);
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) nodes.push({ id: String.fromCharCode(97 + i * c + j), x: 1.0 + j * (8.0 / (c - 1)), y: 0.7 + (r - 1 - i) * (4.6 / (r - 1)) });
  const pairs = []; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { const a = String.fromCharCode(97 + i * c + j); if (j + 1 < c) pairs.push([a, String.fromCharCode(97 + i * c + j + 1)]); if (i + 1 < r) pairs.push([a, String.fromCharCode(97 + (i + 1) * c + j)]); }
  const w = pairs.map((_, k) => k + 1).sort(() => rg() - 0.5);
  pairs.forEach(([a, b], k) => edges.push([a, b, w[k]]));
  return { nodes, edges };
}

// ---------------------------------------------------------------- 10.19–10.21 pictures of independence systems
const SQ = [[-2.4, 1.9], [2.4, 1.9], [2.4, -1.9], [-2.4, -1.9]];
const K4E = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
const PENT = Array.from({ length: 5 }, (_, i) => [2.6 * Math.cos(Math.PI / 2 + (2 * Math.PI * i) / 5), 2.3 * Math.sin(Math.PI / 2 + (2 * Math.PI * i) / 5)]);
const C5E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]];
const SYSNAMES = { graphic: 'graphic matroid of $K_4$ (independent = forests)', linear: 'linear matroid of 5 vectors in the plane', uniform: 'uniform matroid $U_{2,5}$ (any $\\le2$ elements)', matching: 'matchings of the 5-cycle (not a matroid)' };
const SYSOPTS = [{ value: 'graphic', label: 'graphic $K_4$' }, { value: 'linear', label: 'vectors' }, { value: 'uniform', label: '$U_{2,5}$' }, { value: 'matching', label: 'matchings of $C_5$' }];
/** Geometry of element i of a system: a segment (or a point) in data coordinates. */
function geom(kind, vecs) {
  if (kind === 'graphic') return K4E.map(([a, b]) => ({ p: SQ[a], q: SQ[b] }));
  if (kind === 'linear') return vecs.map(([x, y]) => ({ p: [0, 0], q: [x, y] }));
  if (kind === 'uniform') return PENT.map((p) => ({ p, q: p }));
  return C5E.map(([a, b]) => ({ p: PENT[a], q: PENT[b] }));
}
function makeSys(kind, vecs) {
  if (kind === 'graphic') return sysGraphic(K4E.map(([a, b]) => [a, b]));
  if (kind === 'linear') return sysLinear(vecs);
  if (kind === 'uniform') return sysUniform(2, 5);
  return sysMatching(C5E.map(([a, b]) => [a, b]));
}
/** Draw a system. st(i) → {color, width, ring, label}. Returns the geometry for hit testing. */
function drawSys(s, kind, vecs, st, o = {}) {
  const gm = geom(kind, vecs);
  if (kind === 'graphic') SQ.forEach(([x, y], i) => s.dot(x, y, { r: 6, color: 'muted', fill: 'muted' }));
  if (kind === 'matching') PENT.forEach(([x, y]) => s.dot(x, y, { r: 6, color: 'muted', fill: 'muted' }));
  if (kind === 'linear') { s.hline(0, { color: 'grid', width: 1 }); s.vline(0, { color: 'grid', width: 1 }); s.dot(0, 0, { r: 4, color: 'muted', fill: 'muted' }); }
  gm.forEach((g, i) => {
    const t = st(i) || {}, col = t.color || 'muted';
    if (kind === 'uniform') { if (t.ring) s.dot(g.p[0], g.p[1], { r: 20, color: t.ring, fill: t.ring, fillAlpha: 0.35 }); s.dot(g.p[0], g.p[1], { r: 14, color: col, fill: t.fillOn ? col : 'panel' }); s.text(String(i + 1), g.p[0], g.p[1], { align: 'center', baseline: 'middle', size: 13, weight: 700, color: t.fillOn ? 'panel' : 'ink' }); return; }
    if (t.ring) s.line(g.p[0], g.p[1], g.q[0], g.q[1], { color: t.ring, width: (t.width ?? 3) + 7, alpha: 0.35 });
    if (kind === 'linear') s.arrow(g.p[0], g.p[1], g.q[0], g.q[1], { color: col, width: t.width ?? 3, head: 10 }); else s.line(g.p[0], g.p[1], g.q[0], g.q[1], { color: col, width: t.width ?? 3 });
    const f = kind === 'linear' ? 0.55 : 0.34, mx = g.p[0] + (g.q[0] - g.p[0]) * f, my = g.p[1] + (g.q[1] - g.p[1]) * f;
    s.dot(mx, my, { r: 11, color: col, fill: 'panel' }); s.text(String(i + 1), mx, my, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'ink' });
  });
  void o;
  return gm;
}
function hitElem(gm, x, y, kind) {
  let best = -1, bd = kind === 'uniform' ? 0.7 : 0.55;
  gm.forEach((g, i) => {
    const f = kind === 'linear' ? 0.55 : 0.34, mx = g.p[0] + (g.q[0] - g.p[0]) * f, my = g.p[1] + (g.q[1] - g.p[1]) * f;
    let d = Math.hypot(mx - x, my - y);
    if (kind !== 'uniform') { const dx = g.q[0] - g.p[0], dy = g.q[1] - g.p[1], L = dx * dx + dy * dy || 1, t = clamp(((x - g.p[0]) * dx + (y - g.p[1]) * dy) / L, 0, 1); d = Math.min(d, Math.hypot(g.p[0] + t * dx - x, g.p[1] + t * dy - y) * 1.4); }
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}
const maskStr = (m, n) => '{' + bitsOf(m, n).map((i) => i + 1).join(', ') + '}';
const texSet = (m, n) => '\\{' + bitsOf(m, n).map((i) => i + 1).join(',') + '\\}';

export default {
  collection: 'algo',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.17
    {
      num: '10.17',
      kind: 'Algorithm',
      name: 'Borůvka’s algorithm',
      statement: String.raw`**Borůvka's algorithm** builds a minimum spanning tree of a connected weighted graph (with distinct weights, or with a consistent tie-break) in rounds. Start with every vertex as its own component. In each round, every component selects the lightest edge leaving it, and all selected edges are added at once; the components they join are merged. Every selected edge belongs to the MST (cut property, 10.13), and **each round at least halves the number of components**, so after at most $\lceil\log_2 n\rceil$ rounds a single tree remains. Each round takes $O(m)$ time (a scan of the edges), so the total is $O(m\log n)$.`,
      idea: String.raw`Safety: each component $C$ defines the cut $\delta(C)$, and its lightest outgoing edge is a lightest edge of that cut, so it lies in the MST by the cut property. Adding all of them at once is also safe if ties are broken consistently (otherwise two components could pick different equally light edges forming a cycle). Progress: every component picks an edge and so merges with at least one other, so a merged component contains at least two old ones; the number of components at least halves. Unlike Kruskal's and Prim's algorithms, all selections within a round are independent of each other, which makes Borůvka's algorithm the natural parallel MST algorithm and a building block of linear-time randomized algorithms. It is the oldest of the three: Borůvka published it in 1926 to design an electrical network for Moravia, and it was rediscovered several times (for example by Sollin in 1965).`,
      caption: String.raw`Choose the **road map** or the **4×4 grid** and step through. In a *select* step each component's lightest outgoing edge lights up in orange (two components often pick the same edge); in the *merge* step those edges join the tree (green) and the shaded components grow. The chart tracks the number of components after each round against the bound $n/2^r$. Click a weight to change it; the final tree is checked against Kruskal's.`,
      deps: ['algo-10.13'],
      refs: ['Erickson Ch. 7'],
      tags: ['mst', 'greedy'],
      credit: 'O. Borůvka, 1926',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bor%C5%AFvka%27s_algorithm' },
      viz(v) {
        const gsel = v.select('graph', [{ value: 'map', label: 'road map (8 vertices)' }, { value: 'grid', label: '4×4 grid (16 vertices)' }], 'map', { onChange: () => { G.set(spec(gsel.value)); S.reset({ at: 'start' }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ch = v.stage({ x: [-0.5, 5], y: [0, 17], axes: 'box', gutter: true, height: 340, xlabel: 'round $r$', ylabel: 'components', weight: 0.8 });
        const spec = (k) => (k === 'map' ? { nodes: nodesFrom(MST_POS, { a: { notePos: 'w' }, h: { notePos: 'e' } }), edges: MST_EDGES.map(([a, b, w]) => [a, b, w]) } : (() => { const g = gridSpec(4, 4, 11); return { nodes: g.nodes, edges: g.edges }; })());
        const G = v.graph(s, { weights: true, layout: 'none', ...spec('map'), editable: { editWeight: true, minWeight: 1, maxWeight: 30, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true }, onChange: () => S.reset({ at: 'keep' }) });
        let run = null;
        const S = v.steps({ frames: () => { run = boruvkaTrace(G); return run.frames; }, code: ['every vertex is a component', 'repeat until one component remains:', '  for every component C:', '    pick the lightest edge leaving C', '  add all picked edges to T;  merge the components', 'return T'], codeTitle: 'Borůvka(G)', speed: 0.9, start: 1, still: 4 });
        v.render(() => {
          const f = S.frame, reps = [...new Set(Object.values(f.comp))], colOf = (id) => COMPC[reps.indexOf(f.comp[K(id)]) % COMPC.length];
          for (const r of reps) { const mem = G.nodes.filter((x) => f.comp[K(x.id)] === r); if (mem.length > 1) blob(v, s, mem.map((x) => [x.x, x.y]), 22, { color: colOf(mem[0].id), alpha: 0.13, edge: 0.5 }); }
          const picked = new Set(f.picks.values());
          G.draw({
            nodeColor: (id) => colOf(id), nodeFill: (id) => colOf(id),
            edgeColor: (e) => (f.T.has(e) ? 'green' : picked.has(e) ? 'orange' : null),
            edgeWidth: (e) => (f.T.has(e) ? 4.6 : picked.has(e) ? 5 : null),
            dim: G.edges.filter((e) => !f.T.has(e) && !picked.has(e) && f.comp[K(e.from)] === f.comp[K(e.to)]),
          });
          const n = ids(G).length, counts = [n]; for (const g of S.frames) if (g.phase === 'merge') counts.push(g.nc);
          const shown = [n]; for (const g of S.frames.slice(0, S.i + 1)) if (g.phase === 'merge') shown.push(g.nc);
          const Rm = Math.max(3, counts.length), mx = n + 1;
          ch.setView([-0.5, Rm + 0.6], [0, mx]); ch.setTicks(Array.from({ length: Rm + 1 }, (_, i) => i), null);
          const bound = []; for (let r = 0; r <= Rm; r++) bound.push([r, n / 2 ** r]);
          ch.path(bound, { color: 'purple', width: 2, dash: [6, 4] });
          shown.forEach((c, r) => { ch.rect(r - 0.32, 0, r + 0.32, c, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.4 }); ch.text(String(c), r, c + 0.7, { align: 'center', size: 12, weight: 700 }); });
        });
        v.legend([['orange', 'lightest outgoing edge of a component'], ['green', 'tree edge'], ['purple', 'bound $n/2^r$', { dash: true }]]);
        v.readout(() => {
          if (!run) return '';
          const f = S.frame, n = ids(G).length, kr = kruskalTrace(G), M = n <= 9 ? mstBrute(G) : null;
          const ok = Math.abs(run.weight - kr.weight) < 1e-9 && (!M || Math.abs(M.w - run.weight) < 1e-9);
          const halved = S.frames.filter((g) => g.phase === 'merge').every((g) => g.nc <= g.before / 2);
          return `${plural(f.nc, 'component')} now · round ${f.round}${f.phase === 'select' ? ' (selecting)' : ''} · every round at least halves the count: ${halved ? '✓' : '✗'} · bound $\\lceil\\log_2 ${n}\\rceil=${Math.ceil(Math.log2(n))}$ rounds, used ${run.rounds} · ${S.atEnd ? `tree weight ${fmt(run.weight)}, Kruskal ${fmt(kr.weight)}${M ? `, exhaustive minimum ${fmt(M.w)}` : ''} ${ok ? '✓' : '✗'}` : `tree weight so far ${fmt(totalW(f.T))}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.18
    {
      num: '10.18',
      kind: 'Algorithm',
      name: 'Single-linkage clustering via MST',
      statement: String.raw`**Problem.** Given $n$ points with pairwise distances $d$ and an integer $k$, split them into $k$ nonempty clusters so as to maximise the **spacing**: the smallest distance between two points in different clusters. **Algorithm (single linkage).** Compute a minimum spanning tree of the complete graph with edge weights $d$ and delete its $k-1$ heaviest edges; the $k$ components are the clusters. Equivalently, run Kruskal's algorithm (10.15) and stop when $k$ components remain. This clustering has the maximum spacing among all $k$-clusterings, and its spacing equals the weight of the lightest deleted edge.`,
      idea: String.raw`Kruskal's algorithm merges the globally closest pair that is not yet in one cluster, so stopping it at $k$ components means every merged pair was closer than the next distance $d^*$ the algorithm would have used. Hence the clusters it returns are separated by distance at least $d^*$ (any pair in different clusters was examined later, so is at least as far), and the spacing is exactly $d^*$. Any other $k$-clustering must separate two points that Kruskal had already joined by a path of edges each of length at most $d^*$; along that path some edge crosses between clusters of the other clustering, so its spacing is at most $d^*$. This is the cut property (10.13) in disguise: single linkage is the one clustering rule for which a greedy method is provably optimal.`,
      caption: String.raw`**Drag the ten points** and choose $k$. The thin lines are the MST of all points; the $k-1$ heaviest edges (red, dashed) are deleted and the components get their own colours. The gold segment is the spacing, the closest pair in different clusters. The bars list the MST edge lengths in decreasing order: the gap after the $(k-1)$-st bar is the spacing. The readout checks the result against an exhaustive search over all clusterings of the ten points into $k$ nonempty groups.`,
      deps: ['algo-10.15'],
      refs: ['KT §4.7'],
      tags: ['mst', 'clustering'],
      credit: 'Gower & Ross, 1969 (single linkage and the minimum spanning tree)',
      viz(v) {
        const kk = v.slider('clusters $k$', 2, 6, 3, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ch = v.stage({ x: [0, 10], y: [0, 4], axes: 'box', gutter: true, height: 340, xlabel: 'MST edges, longest first', ylabel: 'length', weight: 0.8 });
        const init = [[1.6, 4.6], [2.4, 3.8], [1.2, 3.3], [2.8, 4.9], [6.5, 4.6], [7.4, 3.9], [7.9, 5.0], [4.2, 1.3], [5.0, 0.8], [3.5, 0.9]];
        const P = init.map(([x, y], i) => s.handle(x, y, { color: 'accent', r: 8, constrain: { x: [0.3, 9.7], y: [0.3, 5.7] }, label: String.fromCharCode(65 + i), labelPos: 'ne' }));
        const n = P.length;
        function mst(pts) {
          const inT = new Array(n).fill(false), best = new Array(n).fill(Infinity), from = new Array(n).fill(-1), E = []; best[0] = 0;
          for (let it = 0; it < n; it++) { let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i; inT[u] = true; if (from[u] >= 0) E.push({ a: from[u], b: u, d: best[u] }); for (let j = 0; j < n; j++) if (!inT[j]) { const d = Math.hypot(pts[u][0] - pts[j][0], pts[u][1] - pts[j][1]); if (d < best[j]) { best[j] = d; from[j] = u; } } }
          return E;
        }
        function bruteSpacing(D, k) {
          let best = -1, count = 0, total = 0; const g = new Array(n).fill(0);
          const go = (i, m) => {
            if (i === n) { if (m !== k) return; total++; let sp = Infinity; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (g[a] !== g[b] && D[a][b] < sp) sp = D[a][b]; if (sp > best + 1e-9) { best = sp; count = 1; } else if (Math.abs(sp - best) < 1e-9) count++; return; }
            if (m + (n - i) < k) return;
            for (let c = 0; c <= m && c < k; c++) { g[i] = c; go(i + 1, Math.max(m, c + 1)); }
          };
          go(0, 0);
          return { best, count, total };
        }
        let info = null;
        v.render(() => {
          const pts = P.map((h) => [h.x, h.y]), E = mst(pts), k = kk.value, sorted = E.slice().sort((a, b) => b.d - a.d), cut = new Set(sorted.slice(0, k - 1));
          const u = new UF(Array.from({ length: n }, (_, i) => i)); for (const e of E) if (!cut.has(e)) u.union(e.a, e.b);
          const reps = [...new Set(Array.from({ length: n }, (_, i) => u.find(i)))], colOf = (i) => COMPC[reps.indexOf(u.find(i)) % COMPC.length];
          for (const r of reps) { const mem = pts.filter((_, i) => u.find(i) === r); blob(v, s, mem, 22, { color: colOf(pts.indexOf(mem[0])), alpha: 0.12, edge: 0.5 }); }
          for (const e of E) s.line(pts[e.a][0], pts[e.a][1], pts[e.b][0], pts[e.b][1], cut.has(e) ? { color: 'red', width: 2.6, dash: [6, 4] } : { color: 'muted', width: 1.6 });
          let sp = Infinity, pa = 0, pb = 0; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (u.find(a) !== u.find(b)) { const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]); if (d < sp) { sp = d; pa = a; pb = b; } }
          s.line(pts[pa][0], pts[pa][1], pts[pb][0], pts[pb][1], { color: 'gold', width: 4 });
          P.forEach((h, i) => { h.color = colOf(i); });
          const D = pts.map((p) => pts.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])));
          const bf = bruteSpacing(D, k);
          ch.setView([0, n + 0.5], [0, Math.max(...sorted.map((e) => e.d)) * 1.15]); ch.setTicks(sorted.map((_, i) => i + 1), null);
          sorted.forEach((e, i) => { const c = i < k - 1 ? 'red' : 'accent'; ch.rect(i + 0.6, 0, i + 1.4, e.d, { fill: c, fillAlpha: i < k - 1 ? 0.55 : 0.28, color: c, width: 1.3 }); });
          if (k - 1 < sorted.length) ch.hline(sorted[k - 2].d, { color: 'gold', width: 2, dash: [5, 4] });
          info = { sp, bf, k, nc: reps.length };
        });
        v.legend([['red', 'deleted MST edges', { dash: true }], ['muted', 'kept MST edges'], ['gold', 'spacing: closest pair in different clusters']]);
        v.readout(() => {
          if (!info) return '';
          const { sp, bf, k, nc } = info;
          return `${plural(nc, 'cluster')} · spacing $${r2(sp)}$ (= the shortest deleted MST edge) · exhaustive search over all ${bf.total} ways to split the 10 points into $k=${k}$ nonempty groups: best spacing $${r2(bf.best)}$ ${Math.abs(bf.best - sp) < 1e-9 ? '— equal ✓' : '✗'}${bf.count > 1 ? ` (${bf.count} groupings tie)` : ' (unique optimum)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.19
    {
      num: '10.19',
      kind: 'Definition',
      name: 'Matroids',
      statement: String.raw`A **matroid** is a pair $M=(E,\mathcal I)$ of a finite ground set $E$ and a family $\mathcal I$ of subsets of $E$, the **independent sets**, such that: (i) $\emptyset\in\mathcal I$; (ii) *hereditary*: if $B\in\mathcal I$ and $A\subseteq B$ then $A\in\mathcal I$; (iii) *exchange*: if $A,B\in\mathcal I$ and $|A|<|B|$, then there is an element $x\in B\setminus A$ with $A\cup\{x\}\in\mathcal I$. Examples: the **graphic matroid** of a graph (independent sets = edge sets with no cycle, so the bases are the spanning trees), the **linear matroid** of a family of vectors (independent = linearly independent), and the **uniform matroid** $U_{k,n}$ (independent = at most $k$ of $n$ elements). Matchings in a graph do *not* form a matroid in general. All maximal independent sets (**bases**) of a matroid have the same size, its rank.`,
      idea: String.raw`The exchange axiom is the abstract common core of two familiar facts: in linear algebra, a smaller independent set can always be grown with a vector of a larger one (Steinitz exchange), and in graphs, a smaller forest can always be grown with an edge of a larger forest, because the larger one has fewer components. Whitney introduced matroids in 1935 as an abstraction of linear independence in vector spaces and graphs. Axiom (iii) forces all bases to have the same size: a maximal independent set that was smaller than another independent set could be extended from it, contradicting maximality. The point of the definition for algorithms is the theorem 10.20: for a hereditary family, the greedy algorithm finds a maximum-weight independent set for every weighting exactly when the exchange axiom holds.`,
      caption: String.raw`Pick a system and **click elements** to put them into $A$ (blue) or $B$ (orange), switching between the two with the selector. The readout tests independence of each and, when $|A|<|B|$, lists the elements of $B$ that extend $A$ (green rings); a red message means the exchange axiom fails for this pair. In the vector system you can **drag the arrow tips** (they snap to whole numbers, so parallelism is exact); the last line tests the axioms over every pair of independent sets. For the matchings of $C_5$, **show a failing pair** fills in a witness.`,
      deps: ['algo-10.12'],
      refs: ['Erickson notes: Matroids'],
      tags: ['matroids'],
      credit: 'H. Whitney, 1935',
      viz(v) {
        const kind = v.select('system', SYSOPTS, 'graphic', { onChange: () => { [A, B] = ({ graphic: [0b11, 0b10101], linear: [0b1, 0b110], uniform: [0b1, 0b110], matching: [0b10, 0b101] })[kind.value]; vh.forEach((h) => { h.visible = kind.value === 'linear'; }); } });
        const which = v.select('click edits set', [{ value: 'A', label: 'A (blue)' }, { value: 'B', label: 'B (orange)' }], 'A');
        v.button('show a failing pair', () => { const t = matroidTest(makeSys(kind.value, vecs())); if (t.witness) { A = t.witness.A; B = t.witness.B; } });
        v.button('clear', () => { A = 0; B = 0; });
        const s = v.stage({ x: [-4.6, 4.6], y: [-3.4, 3.4], axes: false, equal: true, height: 360, weight: 1.4 });
        const V0 = [[3, 0], [2, 2], [-1, 2], [-2, 0], [0, -2]];
        const vh = V0.map(([x, y], i) => { const h = s.handle(x, y, { color: 'accent', r: 7, constrain: (X, Y) => [clamp(Math.round(X), -4, 4), clamp(Math.round(Y), -3, 3)] }); h.visible = false; return h; });
        const vecs = () => vh.map((h) => [Math.round(h.x), Math.round(h.y)]);
        let A = 0b11, B = 0b10101, gm = null, info = null;
        s.onClick((x, y) => { if (!gm) return; const i = hitElem(gm, x, y, kind.value); if (i < 0) return; if (which.value === 'A') A ^= 1 << i; else B ^= 1 << i; });
        v.render(() => {
          const k = kind.value, sys = makeSys(k, vecs()), n = sys.n, ia = sys.indep(A), ib = sys.indep(B);
          const ext = []; if (ia && ib && popc(A) < popc(B)) for (let i = 0; i < n; i++) if ((B >> i & 1) && !(A >> i & 1) && sys.indep(A | 1 << i)) ext.push(i);
          const fails = ia && ib && popc(A) < popc(B) && !ext.length;
          gm = drawSys(s, k, vecs(), (i) => ({ color: (A >> i & 1) && (B >> i & 1) ? 'purple' : A >> i & 1 ? 'blue' : B >> i & 1 ? 'orange' : 'muted', width: (A | B) >> i & 1 ? 4.5 : 2.4, ring: ext.includes(i) ? 'green' : fails && (B >> i & 1) && !(A >> i & 1) ? 'red' : null, fillOn: (A | B) >> i & 1 }));
          s.corner(SYSNAMES[k], 'tl', { color: 'muted', weight: 600, plate: true });
          const t = matroidTest(sys);
          info = { ia, ib, ext, fails, t, n, k };
        });
        v.legend([['blue', 'set $A$'], ['orange', 'set $B$'], ['purple', 'in both'], ['green', 'extends $A$ from $B$', { dot: true }], ['red', '$B\\setminus A$: nothing extends $A$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { ia, ib, ext, fails, t, n } = info, tag = (m) => `${maskStr(m, n)} is ${(m === A ? ia : ib) ? 'independent' : '**dependent**'}`;
          const pair = `$A$ ${tag(A)}, $B$ ${tag(B)}`;
          const ex = ia && ib ? (popc(A) >= popc(B) ? ` · $|A|\\ge|B|$: nothing to exchange` : fails ? ' · **no element of $B\\setminus A$ extends $A$: the exchange axiom fails for this pair**' : ` · exchange works: add ${ext.map((i) => i + 1).join(' or ')} to $A$ ✓`) : '';
          const glob = `${t.count} independent sets, ${t.pairs} pairs $|A|<|B|$ tested: ${t.exchange ? '**exchange axiom holds: a matroid** ✓' : `**not a matroid**, e.g. $A=${texSet(t.witness.A, n)}$ and $B=${texSet(t.witness.B, n)}$`}${t.hereditary ? '' : ' (not even hereditary ✗)'}`;
          return `${pair}${ex}\n${glob}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.20
    {
      num: '10.20',
      kind: 'Theorem',
      name: 'Greedy is optimal exactly on matroids (Rado–Edmonds)',
      statement: String.raw`Let $E$ be finite and $\mathcal I$ a nonempty hereditary family of its subsets. Greedy scans elements in nonincreasing order of a **nonnegative** weight function $w:E\to\mathbb R_{\ge0}$ and adds an element whenever independence is preserved. It returns a maximum-weight independent set for every such weighting if and only if $(E,\mathcal I)$ is a matroid. On a matroid it also returns a maximum-weight basis. For arbitrary real weights, the basis claim remains valid, while independent-set maximization requires skipping negative-weight elements. On the graphic matroid of a connected graph, weights $W-w(e)\ge0$ turn this into minimum-spanning-tree Kruskal.`,
      idea: String.raw`For a matroid, let $G=\{g_1,\dots,g_k\}$ be greedy's choices and $O=\{o_1,\dots,o_\ell\}$ any independent set, ordered by decreasing weight. Exchange gives $\ell\le k$. If $w(g_i)<w(o_i)$ for $i\le\ell$, exchange between $G_{i-1}$ and $\{o_1,\dots,o_i\}$ supplies an element outside $G_{i-1}$ extending it and heavier than $g_i$. Heredity means it was also feasible with the earlier, smaller greedy set when first scanned, so it could not have been rejected. Hence $w(g_i)\ge w(o_i)$. Nonnegative remaining weights give $w(G)\ge w(O)$. For bases, $k=\ell$ and no sign restriction is needed.

Conversely, if exchange fails for independent $A,B$ with $a=|A|<|B|$, assign weight $a+2$ to $A$, $a+1$ to $B\setminus A$ and zero elsewhere. Greedy takes $A$ first and cannot take any positive-weight element of $B\setminus A$, so its weight is $a(a+2)$. But $w(B)\ge(a+1)^2>a(a+2)$. Zero-weight additions cannot repair the gap. This is the explicit counterexample made by the button.`,
      caption: String.raw`Choose a system and drag the bar tops to set nonnegative integer weights. Green elements are kept by greedy, red elements are rejected, and gold marks one exhaustive optimum. The bars compare actual totals. On matchings of $C_5$, **make greedy lose** builds weights from a failed exchange. A complete subset/exchange check certifies the displayed finite system; the separate 300 seeded random-weight trials are illustrations, not a proof for all weights. In the vector example, zero vectors are loops and parallel vectors cannot both be kept.`,
      deps: ['algo-10.19', 'algo-10.3'],
      refs: ['Jeff Erickson, Matroids notes (2018), §E.1, Theorems E.1–E.2 pp.3–4', 'Luca Ferrari (2013), Greedy algorithms and poset matroids, Theorem 1.1 p.3 (Edmonds–Rado naming)'],
      tags: ['matroids', 'greedy'],
      credit: 'Rado–Edmonds characterization; proof source: Erickson (2018), Theorems E.1–E.2',
      scope: 'Finite nonempty hereditary systems and nonnegative weights for independent-set optimization. The display checks all subsets of systems of at most six elements, with exact integer graph/vector oracles. Its random trials cover only the stated finite sample.',
      links: { source: 'https://jeffe.cs.illinois.edu/teaching/algorithms/notes/E-matroids.pdf' },
      viz(v) {
        const lose = () => {
          const counter=exchangeCounterexample(makeSys(kind.value,vecs()));
          if(counter)W.forEach((h,i)=>h.set(i+1,counter.weights[i]??0));else v.invalidate();
        };
        const kind = v.select('system', SYSOPTS, 'graphic', { onChange: () => { W.forEach((h, i) => h.set(i + 1, [5, 3, 4, 2, 6, 1][i])); vh.forEach((h) => { h.visible = kind.value === 'linear'; }); if (kind.value === 'matching') lose(); } });
        v.button('make greedy lose', lose);
        v.button('random weights', () => { const r = rngOf(Math.floor(Math.random() * 1e6)); W.forEach((h, i) => h.set(i + 1, Math.floor(r() * 10))); });
        const s = v.stage({ x: [-4.6, 4.6], y: [-3.4, 3.4], axes: false, equal: true, height: 340, weight: 1.2 });
        const ws = v.stage({ x: [0, 7], y: [0, 12], axes: 'box', gutter: true, height: 340, xlabel: 'element', ylabel: 'weight', weight: 1, xticks: [1, 2, 3, 4, 5, 6] });
        const V0 = [[3, 0], [2, 2], [-1, 2], [-2, 0], [0, -2]];
        const vh = V0.map(([x, y]) => { const h = s.handle(x, y, { color: 'accent', r: 7, constrain: (X, Y) => [clamp(Math.round(X), -4, 4), clamp(Math.round(Y), -3, 3)] }); h.visible = false; return h; });
        const vecs = () => vh.map((h) => [Math.round(h.x), Math.round(h.y)]);
        const W = [5, 3, 4, 2, 6, 1].map((w, i) => ws.handle(i + 1, w, { color: 'blue', r: 8, constrain: (x, y) => [i + 1, clamp(Math.round(y), 0, 10)] }));
        let info = null,randomCache=null;
        v.render(() => {
          const k = kind.value, sys = makeSys(k, vecs()), n = sys.n, w = W.slice(0, n).map((h) => Math.round(h.y));
          const g = greedyIndep(sys, w), best = bestIndep(sys, w), rank = new Map(); let c = 0; for (const t of g.trace) if (t.ok) rank.set(t.i, ++c);
          const rej = new Set(g.trace.filter((t) => !t.ok).map((t) => t.i));
          drawSys(s, k, vecs(), (i) => ({ color: rank.has(i) ? 'green' : rej.has(i) ? 'red' : 'muted', width: rank.has(i) ? 5 : 2.4, ring: best.mask >> i & 1 ? 'gold' : null, fillOn: rank.has(i) }));
          s.corner(SYSNAMES[k], 'tl', { color: 'muted', weight: 600, plate: true });
          W.forEach((h, i) => { h.visible = i < n; });
          ws.setView([0, n + 1], [0, 11.5]); ws.setTicks(Array.from({ length: n }, (_, i) => i + 1), null);
          for (let i = 0; i < n; i++) { const cc = rank.has(i) ? 'green' : rej.has(i) ? 'red' : 'blue'; ws.rect(i + 0.7, 0, i + 1.3, w[i], { fill: cc, fillAlpha: 0.5, color: cc, width: 1.4 }); ws.text(rank.has(i) ? `#${rank.get(i)}` : rej.has(i) ? '✗' : '', i + 1, w[i] + 0.8, { align: 'center', size: 12, weight: 700, color: cc }); }
          ws.corner(`greedy ${g.weight}   best ${best.weight}`, 'tr', { color: g.weight === best.weight ? 'green' : 'red', weight: 700, plate: true });
          const key=k+'|'+JSON.stringify(vecs());
          if(randomCache?.key!==key){
            const r=rngOf(4242);let lose=0;
            for(let t=0;t<300;t++){const ww=Array.from({length:n},()=>Math.floor(r()*10));if(greedyIndep(sys,ww).weight!==bestIndep(sys,ww).weight)lose++;}
            const test=matroidTest(sys);randomCache={key,lose,certified:test.nonempty&&test.hereditary&&test.exchange,witness:test.witness};
          }
          info={g,best,lose:randomCache.lose,certified:randomCache.certified,witness:randomCache.witness,n,k,order:g.ord,w};
        });
        v.legend([['green', 'kept by greedy (rank)'], ['red', 'rejected: would be dependent'], ['gold', 'a best independent set (glow)']]);
        v.readout(() => {
          if (!info) return '';
          const {g,best,lose,order,w,n,certified}=info,eq=g.weight===best.weight;
          return `Greedy scans ${order.map(i=>`${i+1}(${w[i]})`).join(' ')} and keeps ${maskStr(g.mask,n)}, weight ${g.weight}. Exhaustive optimum: ${best.weight} on ${maskStr(best.mask,n)}; ${eq?'greedy is optimal for these weights ✓':'**greedy is not optimal for these weights**'}. Complete subset/exchange check: **${certified?'matroid':'exchange fails'}**. Separate seeded trials: ${lose}/300 losses. These finite weight trials alone do not prove a universal claim.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.21
    {
      num: '10.21',
      kind: 'Algorithm',
      name: 'Scheduling unit jobs with deadlines via matroids',
      statement: String.raw`**Problem.** There are $n$ unit-time jobs on one machine. Job $j$ has a deadline $d_j\in\{1,\dots,n\}$ (it must finish by time $d_j$) and a penalty $p_j\ge0$ paid if it is *not* scheduled on time. Choose a set of jobs that can all meet their deadlines so as to maximise the total penalty avoided (equivalently, minimise the penalty paid for the jobs left out). A set $S$ of jobs is **feasible** if it can be scheduled on time; this holds exactly when, for every $t$, at most $t$ jobs of $S$ have deadline $\le t$. **Theorem.** The feasible sets form a matroid, so the greedy algorithm is optimal: consider the jobs in decreasing penalty order and keep a job whenever the kept set stays feasible. The kept jobs are then run in order of deadline; the rest are late.`,
      idea: String.raw`Hereditary: dropping a job from a feasible set only frees time. Exchange: write $N_S(t)=\#\{j\in S: d_j\le t\}$, so $S$ is feasible iff $N_S(t)\le t$ for all $t$. Let $A,B$ be feasible with $|A|<|B|$ and let $t_0$ be the largest $t$ with $N_B(t)\le N_A(t)$ (it exists, since $N(0)=0$, and $t_0<n$ because $|B|>|A|$). At $t_0+1$ the counts flip, which forces $B$ to have more jobs with deadline exactly $t_0+1$ than $A$ has, so some job $x\in B\setminus A$ has $d_x=t_0+1$. Adding $x$ to $A$ leaves $N_A(t)$ unchanged below $t_0+1$ and raises it by one from there on, giving $N_{A+x}(t)\le N_B(t)\le t$ because $N_B>N_A$ beyond $t_0$. So the feasible sets satisfy the exchange axiom, and Rado–Edmonds (10.20) says greedy by penalty is optimal. The feasibility test is the counting condition itself: sort the kept deadlines $d_{(1)}\le d_{(2)}\le\cdots$ and check $d_{(i)}\ge i$; running the jobs earliest-deadline-first (10.6) meets every deadline exactly when that holds.`,
      caption: String.raw`**Drag the seven dots**: horizontal position = deadline, height = penalty. The player takes the jobs in decreasing penalty order; each accepted job joins the timeline (slots 1 to 7, jobs sorted by deadline), a rejected job would push some job past its deadline (the red overflow shows which). The readout compares the penalty avoided with an exhaustive search over all $2^7$ subsets, and tests the exchange axiom on all of the feasible sets of your instance.`,
      deps: ['algo-10.20', 'algo-10.6'],
      refs: ['Erickson notes: Matroids'],
      tags: ['matroids', 'scheduling'],
      viz(v) {
        const N = 7, NAMES = 'ABCDEFG';
        const s = v.stage({ x: [0, 8], y: [0, 11], axes: 'box', gutter: true, height: 330, xlabel: 'deadline $d_j$', ylabel: 'penalty $p_j$', weight: 1, xticks: [1, 2, 3, 4, 5, 6, 7], title: 'the jobs' });
        const tl = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1.3, title: 'the schedule of kept jobs' });
        const init = [[2, 9], [2, 7], [1, 6], [3, 5], [4, 4], [4, 3], [6, 2]];
        const H = init.map(([d, p], i) => s.handle(d, p, { color: COMPC[i], r: 8, label: NAMES[i], labelPos: 'ne', constrain: (x, y) => [clamp(Math.round(x), 1, 7), clamp(Math.round(y), 1, 10)] }));
        const jobs = () => H.map((h, i) => ({ id: i, d: Math.round(h.x), p: Math.round(h.y) }));
        const feasible = (set) => { const ds = set.map((j) => j.d).sort((a, b) => a - b); return ds.every((d, i) => d >= i + 1); };
        const frames = () => {
          const J = jobs(), order = J.slice().sort((a, b) => b.p - a.p || a.id - b.id), kept = [], F = [];
          F.push({ kept: [], cur: null, ok: true, order, note: `Sort the jobs by decreasing penalty: ${order.map((j) => `${NAMES[j.id]} (${j.p})`).join(', ')}.` });
          for (const j of order) { const t = kept.concat(j), ok = feasible(t); if (ok) kept.push(j); F.push({ kept: kept.slice(), cur: j, ok, trial: t, order, note: ok ? `Try ${NAMES[j.id]} (deadline ${j.d}, penalty ${j.p}): the deadlines ${t.map((q) => q.d).sort((a, b) => a - b).join(', ')} satisfy $d_{(i)}\\ge i$, so **keep** it.` : `Try ${NAMES[j.id]} (deadline ${j.d}, penalty ${j.p}): sorted deadlines ${t.map((q) => q.d).sort((a, b) => a - b).join(', ')} put ${t.map((q) => q.d).sort((a, b) => a - b).findIndex((d, i) => d < i + 1) + 1} jobs by time ${t.map((q) => q.d).sort((a, b) => a - b)[t.map((q) => q.d).sort((a, b) => a - b).findIndex((d, i) => d < i + 1)]}: **reject** it.` }); }
          return F;
        };
        const S = v.steps({ frames, code: ['sort the jobs by decreasing penalty;  S ← ∅', 'for each job j in that order:', '  if S ∪ {j} is feasible:   S ← S ∪ {j}', 'run S in order of deadline;  the other jobs are late'], codeTitle: 'ScheduleUnitJobs', speed: 1, start: 'end', still: 'end' });
        let info = null;
        v.render(() => {
          const f = S.frame, J = jobs(), keptSet = new Set(f.kept.map((j) => j.id));
          H.forEach((h, i) => { h.color = f.cur && f.cur.id === i ? (f.ok ? 'green' : 'red') : keptSet.has(i) ? 'green' : 'muted'; });
          const W = tl.width, X0 = 40, cw = Math.min(70, (W - X0 - 14) / N), by = 70;
          const row = (list, y, title) => { TX(tl, title, 8, y - 16, { size: 11.5, weight: 700, color: 'muted', align: 'left' }); list.forEach((j, i) => { const x = X0 + i * cw; R(tl, x, y, x + cw - 4, y + 44, { fill: j.late ? 'red' : COMPC[j.id], fillAlpha: 0.45, color: j.late ? 'red' : COMPC[j.id], width: j.late ? 2.4 : 1.6, radius: 5 }); TX(tl, NAMES[j.id], x + (cw - 4) / 2, y + 17, { align: 'center', size: 14, weight: 700, color: 'ink', halo: false }); TX(tl, `d=${j.d}`, x + (cw - 4) / 2, y + 34, { align: 'center', size: 10.5, color: j.late ? 'red' : 'muted', weight: 600, halo: false }); }); };
          for (let t = 0; t < N; t++) { const x = X0 + t * cw; R(tl, x, by, x + cw - 4, by + 44, { color: 'faint', width: 1, radius: 5, dash: [3, 3] }); TX(tl, `slot ${t + 1}`, x + (cw - 4) / 2, by - 8, { align: 'center', size: 10.5, color: 'faint' }); }
          const sched = (f.trial && !f.ok ? f.trial : f.kept).slice().sort((a, b) => a.d - b.d || a.id - b.id).map((j, i) => ({ ...j, late: i + 1 > j.d }));
          row(sched, by, '');
          const late = J.filter((j) => !keptSet.has(j.id));
          TX(tl, 'not scheduled (penalty paid)', 8, by + 80, { size: 11.5, weight: 700, color: 'muted', align: 'left' });
          late.forEach((j, i) => { const x = X0 + i * cw; R(tl, x, by + 92, x + cw - 4, by + 128, { fill: 'muted', fillAlpha: 0.1, color: 'muted', width: 1.2, radius: 5 }); TX(tl, `${NAMES[j.id]} ${j.p}`, x + (cw - 4) / 2, by + 110, { align: 'center', size: 12, weight: 700, color: 'muted', halo: false }); });
          // brute force
          let best = -1, bestM = 0; const fam = []; for (let m = 0; m < 1 << N; m++) { const set = J.filter((j) => m >> j.id & 1); if (feasible(set)) { fam.push(m); const sc = sumOf(set, (j) => j.p); if (sc > best) { best = sc; bestM = m; } } }
          const sys = { n: N, indep: (m) => feasible(J.filter((j) => m >> j.id & 1)) };
          const t = matroidTest(sys);
          info = { avoided: sumOf(f.kept, (j) => j.p), total: sumOf(J, (j) => j.p), best, bestM, t, fam: fam.length, J };
        });
        v.legend([['green', 'kept job / schedule slot'], ['red', 'job that would miss its deadline'], ['muted', 'not scheduled']]);
        v.readout(() => {
          if (!info) return '';
          const { avoided, total, best, bestM, t, fam, J } = info;
          return `penalty avoided so far ${avoided} (penalty paid ${total - avoided} of ${total}) · exhaustive search over all 128 subsets: best feasible set ${J.filter((j) => bestM >> j.id & 1).map((j) => NAMES[j.id]).join('')} avoids ${best} ${S.atEnd ? (avoided === best ? '— greedy matches ✓' : '— ✗') : ''} · the ${fam} feasible sets ${t.exchange ? 'satisfy the exchange axiom ✓ (a matroid)' : 'violate the exchange axiom ✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.22
    {
      num: '10.22',
      kind: 'Paper',
      name: 'A Method for the Construction of Minimum-Redundancy Codes',
      paper: { authors: 'David A. Huffman', year: 1952, title: 'A Method for the Construction of Minimum-Redundancy Codes', venue: 'Proceedings of the IRE 40 (9): 1098–1101', doi: '10.1109/JRPROC.1952.273898' },
      introduces: ['algo-10.10', 'algo-10.11'],
      statement: String.raw`Huffman's four-page paper solves the problem of finding, for a finite ensemble of messages with known probabilities, a code that minimises the average number of code digits per message, among codes in which no message's code is the beginning of another's (so that a stream of code words can be split without any separator). He derives necessary conditions on an optimum code: more probable messages never get longer codes, and the longest codes include a pair of equal length that differ only in their last digit. He then shows that these conditions are sufficient and give a procedure: combine the two least probable messages into one composite message whose probability is their sum, reorder, and repeat until only two messages remain (assign the digits 0 and 1 to them); then unfold the combinations backwards, extending the code of each composite message by one digit for each of its two parts. The paper works through an ensemble of 13 messages (the tables below) with average length 3.42 binary digits, and extends the method to $D$-ary codes by first reducing the ensemble to a size $N_1$ with $(N_1-1)/(D-1)$ an integer (the least probable $n_0$ messages are combined first), with an 8-message example for $D=4$.`,
      idea: String.raw`Before 1952 the best known constructions were those of Shannon and Fano, which split the ensemble from the top (or round lengths up to $\lceil-\log_2p\rceil$) and are not optimum, although they approach the optimum when the number of messages tends to infinity, as the paper itself says in its introduction; Kraft had also treated the problem for a finite ensemble. Huffman's insight, which according to the usual story came out of a term-paper assignment in Fano's course at MIT, was to build the code from the bottom: the least probable messages must end up deepest, so decide them first. The paper argues with code lengths and a table of brackets rather than with trees, but trees are the picture everyone now uses, and the paper's idea of reducing the ensemble by one message (the 'auxiliary ensemble') is exactly the optimal substructure of 10.11. It introduced the algorithm of 10.10 and the optimality argument of 10.11. Huffman codes are optimal among symbol-by-symbol prefix codes; arithmetic coding, which drops that restriction, can do better.`,
      caption: String.raw`The left panel redraws the paper's central figure, its Table I: each column is an **auxiliary ensemble**, the probabilities in decreasing order, and the lines gather the least probable messages into the new composite one (gold). The probabilities of the 13-message ensemble were read from a scan of the original (Tables I and II); the $D=4$ example is its Table III. **Choose an ensemble**, or type your own message: the table on the right gives the code, the Huffman and Shannon–Fano lengths and the entropy bound, and the readout compares the paper's printed average length with the recomputed one. Digits and the order of equally probable messages may differ from the printed table; the paper itself notes that such choices do not change the average length.`,
      deps: ['algo-10.9', 'info-4.3'],
      refs: [],
      tags: ['coding', 'history'],
      credit: 'D. A. Huffman, 1952',
      links: { doi: 'https://doi.org/10.1109/JRPROC.1952.273898', wikipedia: 'https://en.wikipedia.org/wiki/Huffman_coding' },
      viz(v) {
        const PAPER = { t2: { p: [0.20, 0.18, 0.10, 0.10, 0.10, 0.06, 0.06, 0.04, 0.04, 0.04, 0.04, 0.03, 0.01], D: 2, Lav: 3.42, name: 'Table I/II: 13 messages, binary' }, t3: { p: [0.22, 0.20, 0.18, 0.15, 0.10, 0.08, 0.05, 0.02], D: 4, Lav: null, name: 'Table III: 8 messages, four digits' } };
        const ens = v.select('ensemble', [{ value: 't2', label: 'paper, Table I (13 messages)' }, { value: 't3', label: 'paper, Table III ($D=4$)' }, { value: 'msg', label: 'your message' }], 't2', { onChange: () => { S.reset({ at: 'end' }); msgIn.el.hidden = ens.value !== 'msg'; } });
        const msgIn = v.input('message', 'minimum redundancy', { width: 230, onChange: () => S.reset({ at: 'end' }) });
        msgIn.el.hidden = true;
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 360, weight: 1.6, title: 'auxiliary ensembles (the paper\'s Table I)' });
        const tb = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 360, weight: 1, title: 'result (the paper\'s Table II)' });
        let model = null;
        const build = () => {
          let list, D = 2, Lav = null;
          if (ens.value === 'msg') { const tf = textFreqs(String(msgIn.value).slice(0, 120), 16), T = sumOf(tf.list, (x) => x.w) || 1; list = tf.list.map((x) => ({ sym: x.sym, w: x.w / T, n: x.w })); }
          else { const P = PAPER[ens.value]; list = P.p.map((w, i) => ({ sym: String(i + 1), w })); D = P.D; Lav = P.Lav; }
          if (list.length < 2) { model = null; return [{ forest: [], hot: [], note: 'Type a message with at least two different letters.' }]; }
          const H = huffman(list, D), sf = D === 2 ? shannonFano(list) : null;
          model = { list, D, Lav, H, sf };
          // positions by column: each frame's forest sorted by weight descending
          return H.frames.map((fr, i) => ({ ...fr, col: i }));
        };
        const S = v.steps({ frames: build, speed: 1, start: 'end', still: 'end', counter: 'column' });
        v.render(() => {
          const M = model; if (!M) return;
          const f = S.frame, F = S.frames, ncol = F.length, W = s.width, X0 = 18, cwid = Math.min(74, (W - X0 - 10) / ncol), rowH = Math.min(21, (s.height - 50) / Math.max(...F.map((g) => g.forest.length)));
          const idPos = [];
          F.forEach((g, ci) => {
            const arr = g.forest.slice().sort((a, b) => b.w - a.w || b.id - a.id), pos = new Map(); arr.forEach((t, r) => pos.set(t.id, r));
            idPos.push({ arr, pos });
          });
          const shown = S.i;
          for (let ci = 0; ci < ncol; ci++) {
            const { arr } = idPos[ci], x = X0 + ci * cwid;
            TX(s, `${ci}`, x + cwid / 2 - 4, 16, { align: 'center', size: 10.5, color: 'faint', weight: 600 });
            if (ci > shown) continue;
            arr.forEach((t, r) => {
              const y = 36 + r * rowH, hot = F[ci].hot.includes(t.id);
              if (hot) R(s, x - 2, y - rowH / 2 + 1, x + cwid - 10, y + rowH / 2 - 1, { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.4, radius: 4 });
              TX(s, t.dummy ? '0' : r2d(t.w), x + (cwid - 10) / 2, y, { align: 'center', size: cwid < 50 ? 10.5 : 11.5, weight: hot ? 700 : 500, color: t.dummy ? 'faint' : 'ink', halo: false });
            });
            if (ci > 0) { // brackets: from the merged parts in the previous column to the new composite
              const prev = idPos[ci - 1], hotNode = F[ci].forest.find((t) => F[ci].hot.includes(t.id)), px = X0 + (ci - 1) * cwid + cwid - 12, nx = x - 2;
              const cy = 36 + idPos[ci].pos.get(hotNode.id) * rowH;
              for (const kid of hotNode.kids) { const ky = 36 + prev.pos.get(kid.id) * rowH; LN(s, px, ky, nx, cy, { color: 'gold', width: 1.6 }); }
            }
          }
          // other (unmerged) entries keep faint lines? no: keep the figure clean
          // result table
          const { list, H, D, sf } = M, n = list.length, rh = Math.min(19, (tb.height - 150) / n);
          const hdr = ['i', 'P(i)', 'L(i)', D === 2 ? 'SF' : '', 'code'];
          const cx = [10, 40, 100, 140, 190];
          hdr.forEach((h, i) => TX(tb, h, cx[i], 18, { size: 11.5, weight: 700, color: 'muted', align: 'left' }));
          const order = list.map((it, i) => ({ ...it, i })).sort((a, b) => b.w - a.w || a.i - b.i);
          order.forEach((it, k) => {
            const y = 38 + k * rh, code = H.codes[it.sym];
            TX(tb, ens.value === 'msg' ? it.sym : k + 1, cx[0], y, { size: 11.5, color: 'muted', align: 'left', weight: ens.value === 'msg' ? 700 : 400 }); TX(tb, r2d(it.w), cx[1], y, { size: 11.5, color: 'ink', align: 'left' }); TX(tb, code.length, cx[2], y, { size: 11.5, weight: 700, color: 'green', align: 'left' });
            if (sf) TX(tb, sf.codes[it.sym].length, cx[3], y, { size: 11.5, color: sf.codes[it.sym].length > code.length ? 'red' : 'muted', align: 'left', weight: sf.codes[it.sym].length > code.length ? 700 : 400 });
            TX(tb, code, cx[4], y, { size: 11.5, color: 'teal', align: 'left', weight: 600 });
          });
          const by = 38 + n * rh + 14, Hh = entropy(list) / Math.log2(D), mx = Math.max(H.avg, sf ? sf.avg : 0, Hh, 1) * 1.08, bw = tb.width - 150;
          [['Huffman', H.avg, 'green'], ...(sf ? [['Shannon–Fano', sf.avg, 'orange']] : []), [D === 2 ? 'entropy' : 'entropy (base 4)', Hh, 'purple']].forEach(([lab, val, col], i) => { const y = by + i * 25; TX(tb, lab, 10, y + 8, { size: 11, weight: 600, color: 'muted', align: 'left' }); R(tb, 112, y, 112 + (val / mx) * bw, y + 16, { fill: col, fillAlpha: 0.5, color: col, width: 1.3, radius: 3 }); TX(tb, r2(val), 118 + (val / mx) * bw, y + 8, { size: 11, weight: 700, color: 'ink', align: 'left' }); });
          void f;
        });
        function r2d(x) { return (Math.round(x * 100) / 100).toFixed(2).replace(/^0\./, '.'); }
        v.legend([['gold', 'least probable messages combined'], ['green', 'Huffman length $L(i)$'], ['orange', 'Shannon–Fano is longer', { dash: true }]]);
        v.readout(() => {
          const M = model; if (!M) return 'type a message with at least two different letters';
          const { list, H, D, Lav, sf } = M, Hh = entropy(list) / Math.log2(D), n = list.length;
          const paper = Lav != null ? `the paper prints $L_{av}=${Lav}$, recomputed $${r2(H.avg)}$ ${Math.abs(H.avg - Lav) < 0.005 ? '✓' : '✗'}` : D === 4 ? `average $${r2(H.avg)}$ quaternary digits per message (the paper's Table III lists lengths 1,1,1,2,2,2,3,3 and codes 1, 2, 3, 00, 01, 02, 030, 031; recomputed lengths ${list.map((x) => H.lens[x.sym]).sort((a, b) => a - b).join(',')} ${list.map((x) => H.lens[x.sym]).sort((a, b) => a - b).join(',') === '1,1,1,2,2,2,3,3' ? '✓' : '✗'})` : `average $${r2(H.avg)}$ binary digits per letter`;
          const bf = D === 2 && n <= 9 ? bruteCodeLengths(list.map((x) => x.w)) : null;
          return `${n} messages, ${D === 2 ? 'binary' : '$D=4$'} code · ${paper} · entropy bound $${r2(Hh)}$: ${H.avg >= Hh - 1e-9 && H.avg < Hh + 1 ? '$H\\le L<H+1$ ✓' : '✗'}${sf ? ` · Shannon–Fano average $${r2(sf.avg)}$ ${sf.avg > H.avg + 1e-9 ? '(worse than Huffman)' : '(ties Huffman here)'}` : ''}${bf != null ? ` · exhaustive optimum $${r2(bf)}$ ${Math.abs(bf - H.avg) < 1e-9 ? '✓' : '✗'}` : ''}`;
        });
      },
    },
  ],
};
