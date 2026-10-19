// Graph Theory (Diestel) — Chapter 5, part Z2 (§§5.5–5.6: chordal and perfect graphs, the perfect graph theorems, χ-bounded classes)
import {
  K, ix, CP, GAL, gstage, placed, loadSpec, masksOf, masksOfG, complementA, edgesOf, full, lowBit, popc, bitsOf, compMasks, blobs,
  maxClique, omegaOf, alphaOf, chiColour, chiOf, scanInduced, imperfectWitness, holesIn, oddHoles, oddAntiholes, mcs, cliqueSplit,
  longestInducedPathFrom, inducedPath, inducedCopy, repairFree, inducedE, randomA, mycielski, chips, ring, rnd, lemmaColour, gyNbr, bfsLayers, ringP, cycE, gspec,
} from './ch05-z.shared.js';

// ---------- small helpers ----------
const memoScan = new Map();
/** All induced subgraphs of the graph with masks A: {rows, wit} (memoised). */
function scan(A) {
  const key = A.join(','); let r = memoScan.get(key);
  if (!r) { const rows = scanInduced(A); r = { rows, wit: imperfectWitness(rows) }; if (memoScan.size > 300) memoScan.clear(); memoScan.set(key, r); }
  return r;
}
const ids = (H, mask) => bitsOf(mask).map((i) => H.ids[i]);
const nm = (mask) => '{' + bitsOf(mask).map((x) => x + 1).join(', ') + '}';
const edgeKey = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
const cycKeys = (cyc) => new Set(cyc.map((u, i) => edgeKey(u, cyc[(i + 1) % cyc.length])));
const PRE_LAB = { c5: '$C_5$', c6: '$C_6$', c7: '$C_7$', c7c: '$\\overline{C_7}$', house: 'house', wheel5: 'wheel $W_5$', bull: 'bull', petersen: 'Petersen', k33: '$K_{3,3}$', sun3: '3-sun', tree: 'tree', fan: 'two apexes', p5: 'path $P_5$', c4: '$C_4$', k4: '$K^4$', grotzsch: 'Grötzsch' };
const presets = (keys) => keys.map((k) => ({ value: k, label: PRE_LAB[k] }));
const loadPre = (G, key, rect) => { const g = GAL[key](); loadSpec(G, placed(g.P, g.E, rect)); };
/** Random graph on n vertices as a kit spec (circle layout). */
const randSpec = (A, rect) => { const n = A.length; return placed(ringP(n, 1), edgesOf(A), rect); };
const EDIT_UP = 'click empty space to add a vertex (at most 11), click two vertices to add or remove the edge between them, Alt-click to delete, drag to move';

export default {
  collection: 'graph',
  chapter: 5,
  items: [
    // =====================================================================================================  5.5
    {
      num: '5.5.1a', kind: 'Definition', name: 'Perfect graphs, clique number and independence number',
      statement: String.raw`The **clique number** $\omega(G)$ is the largest order of a complete subgraph of $G$, and the **independence number** $\alpha(G)$ the largest order of an independent vertex set; $\alpha(G)=\omega(\overline G)$. Always $\chi(G)\ge\omega(G)$. A graph $G$ is **perfect** if $\chi(H)=\omega(H)$ for every induced subgraph $H$ of $G$.`,
      idea: String.raw`Perfection asks that the obvious lower bound $\omega$ for $\chi$ be exact not just for $G$ but hereditarily; requiring it for all induced subgraphs is what makes the notion robust (a graph like $C_5$ plus a universal vertex has $\chi=\omega+1$ only because of the induced $C_5$). Bipartite graphs, complements of bipartite graphs, chordal graphs (5.5.2) and comparability graphs are perfect; odd cycles of length $\ge5$ and their complements are the smallest imperfect graphs (5.5.3).`,
      caption: String.raw`Click vertices to choose an induced subgraph $H$ (selected vertices are coloured by an optimal colouring of $H$, a largest clique is ringed). The readout gives $\omega(H)$, $\alpha(H)$ and $\chi(H)$. *Smallest bad subgraph* selects a smallest induced subgraph with $\chi>\omega$ if one exists. The check over **all** $2^n-1$ induced subgraphs is done once per graph. Presets cover perfect (house, $C_6$, $K_{3,3}$, bull) and imperfect graphs ($C_5$, $\overline{C_7}$, wheel $W_5$, Petersen).`,
      deps: ['graph-5.1.1a', 'graph-1.1.1c'], refs: ['Diestel, Graph Theory, 6th ed., §5.5, pp. 139–140'], tags: ['perfect graphs', 'clique number'], credit: 'Berge, 1961',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Perfect_graph' },
      viz(v) {
        const ex = v.select('graph', presets(['house', 'c6', 'k33', 'bull', 'c5', 'c7c', 'wheel5', 'petersen']), 'c5', { onChange: () => load() });
        const s = gstage(v, { height: 350 });
        let S = 0;
        const G = v.graph(s, { nodes: [], edges: [], r: 14, draggable: false, onClick: ({ node }) => { if (node) { S ^= 1 << ix(G).at(node.id); } return true; } });
        function load() { loadPre(G, ex.value, [1.6, 0.9, 8.4, 5.5]); S = full(G.nodes.length); }
        v.button('all vertices', () => { S = full(G.nodes.length); });
        v.button('smallest bad subgraph', () => { const { A } = masksOfG(G), w = scan(A).wit; if (w) S = w.S; });
        v.button('random graph', () => { const r = rnd(Math.floor(Math.random() * 1e6)), A = randomA(8, 0.35 + 0.3 * r(), r); loadSpec(G, randSpec(A, [1.6, 0.9, 8.4, 5.5])); S = full(8); });
        load();
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), sel = S & full(n), cc = chiColour(A, sel), cl = maxClique(A, sel), sc = scan(A);
          G.draw({ nodeFill: (id) => (sel >> H.at(id) & 1 ? CP[cc.col[H.at(id)] % 8] : null), dim: ids(H, full(n) & ~sel) });
          ring(v, s, G, ids(H, cl), 'ink', 19);
          info = { w: popc(cl), a: alphaOf(A, sel), chi: cc.chi, sz: popc(sel), wit: sc.wit, n };
        });
        v.readout(() => !info ? '' : `Induced subgraph $H$ on ${info.sz} vertices: $\\omega(H)=${info.w}$, $\\alpha(H)=${info.a}$, $\\chi(H)=${info.chi}$ → ${info.chi === info.w ? 'equal here' : '**$\\chi>\\omega$ here**'}.\nAll ${(1 << info.n) - 1} induced subgraphs checked: **${info.wit ? `not perfect** — e.g. ${nm(info.wit.S)} has $\\chi=${info.wit.chi}>\\omega=${info.wit.w}$` : 'perfect ✓**'}.`);
      },
    },
    {
      num: '5.5.1b', kind: 'Definition', name: 'Chordal graphs',
      statement: String.raw`A graph is **chordal** (or triangulated) if it has no induced cycle of length at least 4: every cycle of length $\ge4$ in it has a chord, an edge joining two non-consecutive vertices of the cycle.`,
      idea: String.raw`An induced cycle of length $\ge4$ is called a hole, so chordal means "no holes". Trees, complete graphs, interval graphs and graphs built from cliques by gluing along cliques (5.5.1) are chordal. Equivalent descriptions, proved in the next results, are a perfect elimination ordering (every vertex is simplicial when its turn comes) and decomposition along clique separators.`,
      caption: String.raw`Edit the graph (${EDIT_UP}). Every induced cycle of length $\ge4$ is a hole; *next hole* cycles through them (the current one in red). If there are none the graph is chordal and the vertices are numbered by the reverse of a maximum-cardinality-search order: each vertex's higher-numbered neighbours then form a clique (shown by the check).`,
      deps: ['graph-1.3.1a'], refs: ['Diestel, Graph Theory, 6th ed., §5.5, p. 140'], tags: ['chordal graphs'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Chordal_graph' },
      viz(v) {
        const ex = v.select('graph', presets(['sun3', 'tree', 'house', 'fan', 'c6', 'c5']), 'house', { onChange: () => { loadPre(G, ex.value, [1.4, 0.9, 8.6, 5.5]); hi = 0; } });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: true, onChange: (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 11) G.removeNode(obj.id); } });
        let hi = 0;
        v.button('next hole', () => { hi++; });
        loadPre(G, 'house', [1.4, 0.9, 8.6, 5.5]);
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), holes = holesIn(A, full(n), 4), m = mcs(A, full(n));
          const cur = holes.length ? holes[((hi % holes.length) + holes.length) % holes.length] : null, keys = cur ? cycKeys(cur) : new Set();
          const rank = new Map(m.order.slice().reverse().map((u, i) => [u, i + 1]));
          G.draw({ edgeColor: (e) => (keys.has(edgeKey(H.at(e.from), H.at(e.to))) ? 'red' : null), edgeWidth: (e) => (keys.has(edgeKey(H.at(e.from), H.at(e.to))) ? 4 : null),
            nodeColor: (id) => (cur && cur.includes(H.at(id)) ? 'red' : null), nodeNote: (id) => (!holes.length ? String(rank.get(H.at(id))) : null), noteColor: () => 'muted' });
          info = { holes: holes.length, len: cur ? cur.length : 0, chordal: !holes.length, agree: m.chordal === !holes.length, n };
        });
        v.readout(() => !info ? '' : info.chordal ? `No induced cycle of length $\\ge4$: the graph is **chordal ✓**. Numbers = a perfect elimination ordering (earlier-visited neighbours form a clique at every step; test agrees: **${info.agree ? '✓' : '✗'}**).` : `**Not chordal:** ${info.holes} hole${info.holes === 1 ? '' : 's'}; the one shown has length ${info.len}. Add a chord to destroy it.`);
      },
    },
    {
      num: '5.5.1', kind: 'Proposition', name: 'Chordal graphs are built by pasting along cliques',
      statement: String.raw`A graph is chordal if and only if it can be constructed recursively by pasting along complete subgraphs, starting from complete graphs: that is, it is a complete graph, or it arises from two smaller graphs of this kind by identifying a complete induced subgraph of one with one of the other.`,
      idea: String.raw`Pasting two chordal graphs along a clique creates no new induced cycle of length $\ge4$, because an induced cycle that meets both sides must cross the clique in at least two non-adjacent vertices, which a clique does not have. Conversely, in a chordal graph that is not complete take two non-adjacent vertices $a,b$ and a minimal $a$–$b$ separator $S$; one shows $S$ is a clique (otherwise two non-adjacent vertices of $S$ together with paths through the two sides would give a hole), and $G$ is the paste of the two sides together with $S$. Induct.`,
      caption: String.raw`Each step of the slider splits one piece along a smallest clique whose removal disconnects it (reading from the right, the steps are pastings). Pieces are shaded; they overlap in the separating cliques. For a chordal graph the process ends with only complete pieces; for a graph with a hole it gets stuck on a **red** piece that is not complete and has no clique separator, which contains the hole. Edit the graph to see both outcomes.`,
      deps: ['graph-5.5.1b'], refs: ['Diestel §5.5'], tags: ['chordal graphs', 'clique separators'],
      viz(v) {
        const ex = v.select('graph', presets(['sun3', 'tree', 'house', 'fan', 'c6']), 'sun3', { onChange: () => { loadPre(G, ex.value, [1.4, 0.9, 8.6, 5.5]); t.set(12); } });
        const t = v.slider('splits shown', 0, 12, 12, { int: true });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: true, onChange: (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 11) G.removeNode(obj.id); t.set(12); } });
        loadPre(G, 'sun3', [1.4, 0.9, 8.6, 5.5]);
        const complete = (A, P) => bitsOf(P).every((x) => (P & ~(1 << x) & ~A[x]) === 0);
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), frames = []; let pieces = [full(n)]; const stuck = new Set(); frames.push(pieces.slice());
          for (let guard = 0; guard < 40; guard++) {
            let did = false;
            for (let i = 0; i < pieces.length && !did; i++) {
              const P = pieces[i]; if (complete(A, P) || stuck.has(P)) continue;
              const sp = cliqueSplit(A, P); if (!sp) { stuck.add(P); continue; }
              pieces = [...pieces.slice(0, i), ...sp.parts, ...pieces.slice(i + 1)]; frames.push(pieces.slice()); did = true;
            }
            if (!did) break;
          }
          const k = Math.min(t.value, frames.length - 1), cur = frames[k];
          blobs(v, s, G, cur.map((P) => ids(H, P)), (i, g) => (!complete(A, cur[i]) && k === frames.length - 1 ? 'red' : CP[i % 6]));
          G.draw({});
          const hole = holesIn(A, full(n), 4).length > 0;
          info = { k, tot: frames.length - 1, np: cur.length, atoms: cur.filter((P) => !complete(A, P)).length, hole, n };
        });
        v.readout(() => !info ? '' : `After ${info.k} of ${info.tot} splits: ${info.np} piece${info.np === 1 ? '' : 's'}, ${info.atoms} not complete. ${info.k === info.tot ? (info.atoms === 0 ? '**All pieces are cliques: the graph was pasted together from complete graphs, so it is chordal ✓**' : '**Stuck on a piece that is not complete: the graph is not chordal**') + ` (direct hole test: ${info.hole ? 'hole found' : 'no hole'}, consistent ✓)` : 'move the slider to the end to see the final pieces'}.`);
      },
    },
    {
      num: '5.5.2', kind: 'Proposition', name: 'Chordal graphs are perfect',
      statement: String.raw`Every chordal graph is perfect. In fact every chordal graph $G$ satisfies $\chi(G)=\omega(G)$, and this holds for each induced subgraph, since induced subgraphs of chordal graphs are chordal.`,
      idea: String.raw`Induction along the pasting (5.5.1): complete graphs have $\chi=\omega$, and if $G$ is pasted from $G_1$ and $G_2$ along a clique $C$, then colourings of $G_1,G_2$ with $\omega(G_i)$ colours can be permuted so that they agree on $C$ (the vertices of $C$ get distinct colours in both), giving a colouring of $G$ with $\max\omega(G_i)=\omega(G)$ colours. Equivalent algorithm: colour greedily along a perfect elimination ordering reversed; each vertex sees only a clique of earlier neighbours, so a colour among $\omega$ is always free.`,
      caption: String.raw`Click vertices to choose an induced subgraph. The slider colours its vertices one by one in maximum-cardinality-search order, each with the smallest colour not used on already coloured neighbours; the current vertex and its coloured neighbours (which form a clique) are ringed. For chordal graphs the number of colours used equals $\omega$. Switch to a graph with a hole ($C_5$, $C_6$, house) and the greedy order may need more colours than $\omega$.`,
      deps: ['graph-5.5.1', 'graph-5.5.1a'], refs: ['Diestel §5.5'], tags: ['chordal graphs', 'perfect graphs'],
      viz(v) {
        const ex = v.select('graph', [...presets(['sun3', 'tree', 'bull', 'house', 'c5']), { value: 'rand', label: 'random chordal' }], 'sun3', { onChange: () => load() });
        const t = v.slider('vertices coloured', 0, 11, 11, { int: true });
        const s = gstage(v, { height: 350 });
        let S = 0, seed = 1;
        const G = v.graph(s, { nodes: [], edges: [], r: 14, draggable: false, onClick: ({ node }) => { if (node) S ^= 1 << ix(G).at(node.id); return true; } });
        function load() {
          if (ex.value === 'rand') {
            const r = rnd(seed * 91 + 3), n = 9, A = new Array(n).fill(0);
            for (let i = 1; i < n; i++) {
              const j = Math.floor(r() * i); let cl = 1 << j; const cand = bitsOf(A[j] & ((1 << i) - 1)).sort(() => r() - 0.5);
              for (const c of cand) if (r() < 0.7 && bitsOf(cl).every((x) => x === c || (A[c] >> x & 1))) cl |= 1 << c;
              for (const x of bitsOf(cl)) { A[i] |= 1 << x; A[x] |= 1 << i; }
            }
            loadSpec(G, randSpec(A, [1.6, 0.9, 8.4, 5.5]));
          } else loadPre(G, ex.value, [1.4, 0.9, 8.6, 5.5]);
          S = full(G.nodes.length); t.set(12);
        }
        v.button('new random chordal graph', () => { seed++; ex.set('rand'); load(); });
        load();
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), sel = S & full(n), m = mcs(A, sel), col = new Int16Array(n).fill(-1), k = Math.min(t.value, m.order.length);
          m.order.forEach((u, i) => { const used = new Set(); for (const w of bitsOf(A[u] & sel)) if (col[w] >= 0 && m.order.indexOf(w) < i) used.add(col[w]); let c = 0; while (used.has(c)) c++; col[u] = c; });
          const cur = k > 0 ? m.order[k - 1] : -1, shown = new Set(m.order.slice(0, k));
          G.draw({ nodeFill: (id) => (shown.has(H.at(id)) ? CP[col[H.at(id)] % 8] : null), dim: ids(H, full(n) & ~sel) });
          if (cur >= 0) ring(v, s, G, [H.ids[cur], ...bitsOf(A[cur] & sel).filter((w) => shown.has(w) && m.order.indexOf(w) < k - 1).map((w) => H.ids[w])], 'ink', 20);
          const usedAll = Math.max(-1, ...m.order.slice(0, k).map((u) => col[u])) + 1;
          info = { k, tot: m.order.length, used: usedAll, w: omegaOf(A, sel), chi: chiOf(A, sel), chordal: m.chordal };
        });
        v.readout(() => !info ? '' : `$H$ chordal: **${info.chordal ? '✓' : '✗'}**. Coloured ${info.k} of ${info.tot} vertices with ${info.used} colour${info.used === 1 ? '' : 's'}; $\\omega(H)=${info.w}$, $\\chi(H)=${info.chi}$.${info.k === info.tot ? (info.used === info.w ? ' **Greedy used exactly $\\omega$ colours ✓**' : info.chordal ? ' ✗ (should not happen)' : ` Greedy used ${info.used}, more than $\\omega$ — no elimination ordering here.`) : ''}`);
      },
    },
    {
      num: '5.5.3', kind: 'Theorem', name: 'Strong perfect graph theorem',
      statement: String.raw`A graph is perfect if and only if it contains neither an odd hole nor an odd antihole, that is, no induced $C_{2k+1}$ with $k\ge2$ and no induced complement of such a cycle. (Graphs with neither are called **Berge graphs**.)`,
      idea: String.raw`Odd holes and odd antiholes are not perfect ($\chi=\omega+1$), and perfection is hereditary, so one direction is easy. The converse is hard: Berge conjectured it (1963 in Diestel); Chudnovsky, Robertson, Seymour and Thomas proved it in a 178-page paper by showing that every Berge graph is either one of a few basic types (bipartite graphs, line graphs of bipartite graphs, their complements, and double split graphs) or has one of a few kinds of decomposition that a minimal counterexample cannot have. The picture only verifies the statement by brute force on small graphs.`,
      caption: String.raw`Edit the graph (${EDIT_UP}). The three columns of the readout are computed independently: odd hole present? odd antihole present? and, by brute force over all induced subgraphs, is $\chi=\omega$ everywhere? An odd hole (blue) or odd antihole (orange) is highlighted if found. *Test 300 random graphs* compares "Berge" with "perfect" on random 8-vertex graphs.`,
      deps: ['graph-5.5.1a'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.5.3 and discussion, p. 141'], tags: ['perfect graphs', 'Berge graphs'], credit: 'Chudnovsky, Robertson, Seymour & Thomas, 2006 (conjectured by Berge (1963 in Diestel))',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Strong_perfect_graph_theorem' },
      viz(v) {
        const ex = v.select('graph', presets(['c5', 'c7', 'c7c', 'house', 'wheel5', 'c6', 'sun3']), 'c7c', { onChange: () => loadPre(G, ex.value, [1.4, 0.9, 8.6, 5.5]) });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: true, onChange: (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 10) G.removeNode(obj.id); } });
        let test = null;
        v.button('test 300 random graphs', () => {
          const r = rnd(Math.floor(Math.random() * 1e6)); let both = 0, agree = 0, per = 0;
          for (let i = 0; i < 300; i++) { const A = randomA(8, 0.25 + 0.5 * r(), r), n = 8, F = full(n), berge = !oddHoles(A, F).length && !oddAntiholes(A, F).length, perf = !scan(A).wit; both++; if (berge === perf) agree++; if (perf) per++; }
          test = `${agree} of ${both} random graphs: "Berge" and "perfect" agree (${per} perfect)`;
        });
        loadPre(G, 'c7c', [1.4, 0.9, 8.6, 5.5]);
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), F = full(n), oh = oddHoles(A, F), oa = oddAntiholes(A, F), sc = scan(A);
          const hk = oh.length ? cycKeys(oh[0]) : new Set(), ak = oa.length ? oa[0] : null, aset = ak ? new Set(ak) : new Set();
          G.draw({ edgeColor: (e) => (hk.has(edgeKey(H.at(e.from), H.at(e.to))) ? 'accent' : null), edgeWidth: (e) => (hk.has(edgeKey(H.at(e.from), H.at(e.to))) ? 4 : null), nodeColor: (id) => (aset.has(H.at(id)) ? 'orange' : oh.length && oh[0].includes(H.at(id)) ? 'accent' : null) });
          info = { oh: oh.length, oa: oa.length, perfect: !sc.wit, berge: !oh.length && !oa.length, ohl: oh.length ? oh[0].length : 0, oal: ak ? ak.length : 0 };
        });
        v.readout(() => !info ? '' : `Odd holes: **${info.oh}**${info.oh ? ` (shown: length ${info.ohl})` : ''} · odd antiholes: **${info.oa}**${info.oa ? ` (shown: length ${info.oal})` : ''} → Berge **${info.berge ? '✓' : '✗'}**. Brute force over all induced subgraphs: perfect **${info.perfect ? '✓' : '✗'}**. ${info.berge === info.perfect ? 'The theorem’s two sides agree.' : '✗ they disagree (should be impossible)'}${test ? '\n' + test + '.' : ''}`);
      },
    },
    {
      num: '5.5.4', kind: 'Theorem', name: 'Lovász: the complement of a perfect graph is perfect',
      statement: String.raw`A graph $G$ is perfect if and only if its complement $\overline G$ is perfect. Equivalently, every induced subgraph $H$ of a perfect graph has a cover of its vertex set by $\alpha(H)$ cliques (the colour classes of an optimal colouring of $\overline H$).`,
      idea: String.raw`Proved by Lovász in 1972 (the "perfect graph theorem", conjectured by Berge). One standard route goes through the replication lemma (5.5.5) and the characterization $|H|\le\alpha(H)\omega(H)$ (5.5.6): that condition is symmetric under complementation, since $\alpha(\overline H)=\omega(H)$ and $\omega(\overline H)=\alpha(H)$, and 5.5.6 turns it into perfection.`,
      caption: String.raw`The same selected induced subgraph $H$ is shown in $G$ (left) and $\overline G$ (right). Click vertices on either side to change $H$. The readout gives $\chi$, $\omega$ in both: since $\omega(\overline H)=\alpha(H)$ and $\chi(\overline H)$ is the clique-cover number of $H$, perfection of $\overline G$ says $\alpha=$ clique cover number for all induced $H$. The bars count the induced subgraphs with $\chi>\omega$ in each graph: one is zero exactly when the other is.`,
      deps: ['graph-5.5.1a'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.5.4 and proofs, pp. 142–145'], tags: ['perfect graphs', 'complements'], credit: 'Lovász, 1972',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Perfect_graph_theorem' },
      viz(v) {
        const ex = v.select('graph', presets(['c5', 'c6', 'house', 'bull', 'wheel5', 'c7c', 'sun3']), 'c5', { onChange: () => load() });
        const sA = gstage(v, { height: 300, title: '$G$' }), sB = gstage(v, { height: 300, title: 'complement $\\overline G$' }), sC = v.stage({ x: [0, 3], y: [0, 40], axes: 'box', gutter: true, height: 150, title: 'induced subgraphs with $\\chi>\\omega$', full: true, ylabel: 'count', xticks: [[0.5, 'G'], [1.5, 'complement of G']] });
        let S = 0;
        const click = (G) => ({ node }) => { if (node) S ^= 1 << ix(G).at(node.id); return true; };
        const GA = v.graph(sA, { nodes: [], edges: [], r: 13, draggable: false, onClick: (e) => click(GA)(e) });
        const GB = v.graph(sB, { nodes: [], edges: [], r: 13, draggable: false, onClick: (e) => click(GB)(e) });
        let comp = null;
        function setup(P, E) {
          loadSpec(GA, placed(P, E, [1.5, 0.9, 8.5, 5.5])); const n = P.length;
          loadSpec(GB, placed(P, edgesOf(complementA(masksOf(n, E))), [1.5, 0.9, 8.5, 5.5])); S = full(n);
        }
        function load() { const g = GAL[ex.value](); setup(g.P, g.E); }
        v.button('random graph', () => { const r = rnd(Math.floor(Math.random() * 1e6)), A = randomA(8, 0.3 + 0.4 * r(), r); setup(ringP(8, 1), edgesOf(A)); });
        load();
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(GA), C = complementA(A), sel = S & full(n), cA = chiColour(A, sel), cB = chiColour(C, sel);
          GA.draw({ nodeFill: (id) => (sel >> H.at(id) & 1 ? CP[cA.col[H.at(id)] % 8] : null), dim: ids(H, full(n) & ~sel) });
          GB.draw({ nodeFill: (id) => (sel >> H.at(id) & 1 ? CP[cB.col[H.at(id)] % 8] : null), dim: ids(H, full(n) & ~sel) });
          const rA = scan(A).rows, rB = scan(C).rows, badA = rA.filter((r) => r.chi > r.w).length, badB = rB.filter((r) => r.chi > r.w).length;
          sC.setView([0, 3], [0, Math.max(5, badA, badB) * 1.15]);
          sC.bars([badA, badB], { x0: 0.5, dx: 1, color: (val) => (val === 0 ? 'green' : 'red') });
          info = { chiA: cA.chi, wA: omegaOf(A, sel), chiB: cB.chi, wB: omegaOf(C, sel), alpha: alphaOf(A, sel), badA, badB };
        });
        v.readout(() => !info ? '' : `$H$: in $G$ $\\chi=${info.chiA}$, $\\omega=${info.wA}$; in $\\overline G$ $\\chi=${info.chiB}$ (clique cover of $H$), $\\omega=${info.wB}$ $(=\\alpha(H)=${info.alpha})$.\nInduced subgraphs with $\\chi>\\omega$: $G$ has **${info.badA}**, $\\overline G$ has **${info.badB}** → ${(info.badA === 0) === (info.badB === 0) ? 'perfect for both or for neither ✓' : '✗'}.`);
      },
    },
    {
      num: '5.5.5', kind: 'Lemma', name: 'Replication lemma',
      statement: String.raw`If $G$ is perfect and $v$ is a vertex of $G$, then the graph $G'$ obtained by adding a new vertex $v'$ adjacent to $v$ and to all neighbours of $v$ (replacing $v$ by two adjacent twins) is perfect.`,
      idea: String.raw`Every induced subgraph of $G'$ either lies in $G$ or is a replication of an induced subgraph of $G$, so it suffices to show $\chi(G')=\omega(G')$. If $v$ lies in a maximum clique of $G$, then $\omega(G')=\omega(G)+1$: colour $G$ with $\omega(G)$ colours and give $v'$ a new one. Otherwise $\omega(G')=\omega(G)=k$. Take a $k$-colouring of $G$ and let $S$ be the colour class of $v$; then $T=(S\setminus\{v\})\cup\{v'\}$ is stable in $G'$. Every $k$-clique of $G$ misses $v$ and meets $S$, hence meets $S\setminus\{v\}$, so $G'-T=G-(S\setminus\{v\})$ has clique number at most $k-1$; it is an induced subgraph of the perfect graph $G$, so $k-1$ colours suffice for it, and $T$ is one more colour class.`,
      caption: String.raw`Click a vertex to replace it by two adjacent twins (twins get the same outline colour). The perfection test after every step is by brute force. Start from a perfect graph and replicate as often as you like: the check stays green, and $\omega,\chi$ rise together. Start from $C_5$ and it stays imperfect (nothing to repair); *undo* and *reset* restore earlier graphs. The graph is limited to 11 vertices.`,
      deps: ['graph-5.5.1a'], refs: ['Diestel, Graph Theory, 6th ed., Lemma 5.5.5 and proof, pp. 142–143'], tags: ['perfect graphs', 'replication'], credit: 'Lovász, 1972',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const ex = v.select('start graph', presets(['p5', 'bull', 'house', 'k33', 'sun3', 'c5']), 'house', { onChange: () => reset() });
        const s = gstage(v, { height: 350 });
        let hist = [], twinOf = new Map();
        const G = v.graph(s, { nodes: [], edges: [], r: 13, draggable: false, onClick: ({ node }) => {
          if (!node || G.nodes.length >= 11) return true;
          const Hh = ix(G), i = Hh.at(node.id); hist.push({ nodes: G.nodes.map((q) => ({ ...q })), edges: G.edges.map((e) => [e.from, e.to]), tw: new Map(twinOf) });
          const nid = Math.max(...G.nodes.map((q) => +q.id)) + 1, cx = G.nodes.reduce((a, q) => a + q.x, 0) / G.nodes.length, cy = G.nodes.reduce((a, q) => a + q.y, 0) / G.nodes.length;
          const dx = node.x - cx, dy = node.y - cy, d = Math.hypot(dx, dy) || 1;
          G.addNode({ id: nid, x: Math.min(9.3, Math.max(0.7, node.x + (0.75 * dx) / d)), y: Math.min(5.9, Math.max(0.5, node.y + (0.75 * dy) / d)), label: String(nid + 1) });
          G.addEdge(node.id, nid); for (const [w] of Hh.adj[i]) G.addEdge(Hh.ids[w], nid);
          const gid = twinOf.get(+node.id) ?? +node.id; twinOf.set(+node.id, gid); twinOf.set(nid, gid); return true;
        } });
        function reset() { loadPre(G, ex.value, [1.6, 1.0, 8.4, 5.4]); hist = []; twinOf = new Map(); }
        v.button('undo', () => { const h = hist.pop(); if (h) { G.set({ nodes: h.nodes, edges: h.edges.map(([a, b]) => [a, b]) }); G.layout('none'); twinOf = h.tw; } });
        v.button('reset', reset);
        reset();
        let info = null, prev = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), F = full(n), sc = scan(A), w = omegaOf(A, F), chi = chiOf(A, F);
          const grp = new Map(); for (const [a, g] of twinOf) grp.set(a, g);
          const names = [...new Set(grp.values())];
          G.draw({ nodeColor: (id) => (grp.has(+id) ? CP[names.indexOf(grp.get(+id)) % 8] : null), nodeFill: (id) => (grp.has(+id) ? CP[names.indexOf(grp.get(+id)) % 8] : null) });
          info = { n, w, chi, perfect: !sc.wit, steps: hist.length };
        });
        v.readout(() => !info ? '' : `${info.n} vertices after ${info.steps} replication${info.steps === 1 ? '' : 's'}: $\\omega=${info.w}$, $\\chi=${info.chi}$ · perfect (all ${(1 << info.n) - 1} induced subgraphs checked): **${info.perfect ? '✓' : '✗'}**.${info.perfect ? '' : ' (The start graph was not perfect: replication cannot repair it.)'}`);
      },
    },
    {
      num: '5.5.6', kind: 'Theorem', name: 'Lovász: perfect iff every induced H has order ≤ α(H)·ω(H)',
      statement: String.raw`A graph $G$ is perfect if and only if every induced subgraph $H$ of $G$ satisfies $|H|\le\alpha(H)\,\omega(H)$.`,
      idea: String.raw`If $G$ is perfect, colour each induced $H$ with $\omega(H)$ colours; every class has at most $\alpha(H)$ vertices, giving $|H|\le\alpha(H)\omega(H)$. The book's converse uses induction and a rank argument. In a minimal imperfect graph construct $\alpha\omega+1$ independent sets and the same number of maximum cliques so that their incidence-intersection matrix has zero diagonal and ones elsewhere. This matrix is nonsingular, but factors through an $n$-dimensional vertex space, forcing $n\ge\alpha\omega+1$, contrary to the assumed inequality. Complementation exchanges $\alpha$ and $\omega$, yielding 5.5.4.`,
      caption: String.raw`Every induced subgraph $H$ of the chosen graph is a point $(\alpha(H)\omega(H),\,|H|)$ (disc area = how many $H$ share the point). Points on or below the diagonal satisfy the inequality; points above it, in red, are violations — they appear exactly for imperfect graphs ($C_5$: $5>2\cdot2$). Click vertices to mark one induced subgraph (gold ring) and read its numbers.`,
      deps: ['graph-5.5.1a'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.5.6 and proof, pp. 144–145'], tags: ['perfect graphs'], credit: 'Lovász, 1972',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const ex = v.select('graph', presets(['c5', 'c7', 'c7c', 'house', 'c6', 'wheel5', 'k33', 'petersen']), 'c5', { onChange: () => { loadPre(G, ex.value, [1.4, 0.9, 8.6, 5.5]); S = full(G.nodes.length); } });
        const sA = gstage(v, { height: 320 }), sB = v.stage({ x: [0, 17], y: [0, 11], axes: 'box', gutter: true, height: 320, xlabel: '$\\alpha(H)\\,\\omega(H)$', ylabel: '$|H|$', title: 'all induced subgraphs' });
        let S = 0;
        const G = v.graph(sA, { nodes: [], edges: [], r: 13, draggable: false, onClick: ({ node }) => { if (node) S ^= 1 << ix(G).at(node.id); return true; } });
        loadPre(G, 'c5', [1.4, 0.9, 8.6, 5.5]); S = full(5);
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), rows = scan(A).rows, sel = S & full(n), cnt = new Map();
          for (const r of rows) { const k = r.a * r.w + ',' + r.size; cnt.set(k, (cnt.get(k) || 0) + 1); }
          const mx = Math.max(...rows.map((r) => Math.max(r.a * r.w, r.size))) + 1; sB.setView([0, mx + 1], [0, mx + 1]);
          sB.poly([[0, 0], [mx + 1, mx + 1], [0, mx + 1]], { fill: 'red', fillAlpha: 0.08, stroke: false });
          sB.line(0, 0, mx + 1, mx + 1, { color: 'muted', dash: true });
          const cur = rows[sel - 1]; if (cur) sB.dot(cur.a * cur.w, cur.size, { r: 12, color: 'gold' });
          let viol = 0; for (const [k, c] of cnt) { const [x, y] = k.split(',').map(Number); if (y > x) viol += c; sB.dot(x, y, { r: 3 + 2.2 * Math.sqrt(c), color: y > x ? 'red' : 'accent' }); }
          G.draw({ nodeFill: (id) => (sel >> H.at(id) & 1 ? 'gold' : null), nodeColor: (id) => (sel >> H.at(id) & 1 ? 'gold' : null) });
          info = { viol, total: rows.length, cur: cur || { size: 0, a: 0, w: 0 }, perfect: !scan(A).wit };
        });
        v.legend([['accent', '$|H|\\le\\alpha\\omega$', { dot: true }], ['red', '$|H|>\\alpha\\omega$', { dot: true }]]);
        v.readout(() => !info ? '' : `Selected $H$: $|H|=${info.cur.size}$, $\\alpha=${info.cur.a}$, $\\omega=${info.cur.w}$, $\\alpha\\omega=${info.cur.a * info.cur.w}$. Violations among all ${info.total} induced subgraphs: **${info.viol}** → ${info.viol === 0 ? 'inequality holds everywhere' : 'inequality fails'}; brute-force perfect: **${info.perfect ? '✓' : '✗'}** (${(info.viol === 0) === info.perfect ? 'the two tests agree ✓' : '✗ they disagree (should be impossible)'}).`);
      },
    },
    // =====================================================================================================  5.6
    {
      num: '5.6.1a', kind: 'Definition', name: 'χ-bounded graph classes',
      statement: String.raw`A class $\mathcal C$ closed under induced subgraphs is **$\chi$-bounded** if there is $f\colon\mathbb N\to\mathbb N$ such that $\chi(G)\le f(r)$ whenever $G\in\mathcal C$ and $\omega(G)\le r$. This is equivalent to the existence of a nondecreasing $f$ with $\chi(G)\le f(\omega(G))$. Perfect graphs admit $f(r)=r$; triangle-free graphs admit no such function.`,
      idea: String.raw`The clique number is a lower bound for $\chi$, and $\chi$-boundedness says that it is, up to a function, the only obstruction inside the class. That triangle-free graphs of large chromatic number exist (Mycielski's construction, and Erdős's high-girth graphs, 5.2.5) means that forbidding a single clique is not enough; the questions of this section ask which *induced* subgraphs one has to forbid.`,
      caption: String.raw`Each dot is a random graph from the chosen class, plotted at $(\omega,\chi)$ (exact values). The slider sets a candidate bound $f(\omega)=a\,\omega$; points above it are red. For *interval graphs* $f(\omega)=\omega$ works. For *triangle-free* graphs the hollow dots are Mycielski's graphs $M_k$, with $\omega=2$ and $\chi=k$ (computed for $k\le4$, the theorem for larger $k$), so every cap $f(2)$ is exceeded by some $M_k$. Random samples of fixed size cannot show unboundedness by themselves.`,
      deps: ['graph-5.5.1a'], refs: ['Diestel, Graph Theory, 6th ed., §5.6, p. 146'], tags: ['chi-bounded', 'clique number'], credit: 'Gyárfás, 1975 (introduction of χ-boundedness)',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const cls = v.select('class', [{ value: 'int', label: 'interval graphs' }, { value: 'tf', label: 'triangle-free' }, { value: 'all', label: 'all graphs' }], 'int', { onChange: () => resample() });
        const aS = v.slider('bound $f(\\omega)=a\\,\\omega$, $a=$', 1, 4, 1.5, { step: 0.5 });
        const s = v.stage({ x: [0.4, 8], y: [0, 10], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega(H)$', ylabel: '$\\chi(H)$', xticks: [1, 2, 3, 4, 5, 6], yticks: [0, 2, 4, 6, 8, 10] });
        let pts = [], seed = 1;
        // Mycielski chain: M_k has ω = 2 and χ = k (k = 2: K_2, k = 3: C_5, k = 4: Grötzsch); larger k by Mycielski's theorem
        const myc = [{ k: 2, exact: true }, { k: 3, exact: true }, { k: 4, exact: true }, { k: 5 }, { k: 6 }, { k: 7 }, { k: 8 }];
        function resample() {
          const r = rnd(seed * 1237 + 5); pts = [];
          for (let i = 0; i < 70; i++) {
            const n = 8 + Math.floor(r() * 5); let A;
            if (cls.value === 'int') { A = new Array(n).fill(0); const iv = Array.from({ length: n }, () => { const a = r() * 10, l = 0.5 + r() * 4; return [a, a + l]; }); for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (iv[a][0] <= iv[b][1] && iv[b][0] <= iv[a][1]) { A[a] |= 1 << b; A[b] |= 1 << a; } }
            else if (cls.value === 'tf') { A = new Array(n).fill(0); const prs = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) prs.push([a, b]); prs.sort(() => r() - 0.5); for (const [a, b] of prs) if (!(A[a] & A[b])) { A[a] |= 1 << b; A[b] |= 1 << a; } }
            else A = randomA(n, 0.3 + 0.5 * r(), r);
            const F = full(n); pts.push([omegaOf(A, F), chiOf(A, F)]);
          }
        }
        v.button('resample', () => { seed++; resample(); });
        resample();
        let info = null;
        v.render(() => {
          const a = aS.value; let over = 0;
          s.fn((x) => a * x, { color: 'orange', domain: [0.4, 8] });
          const best = new Map(); for (const [w, c] of pts) best.set(w, Math.max(best.get(w) || 0, c));
          const jit = (i) => ((i * 0.6180339) % 1 - 0.5) * 0.28;
          pts.forEach(([w, c], i) => { const bad = c > a * w; if (bad) over++; s.dot(w + jit(i), c + jit(i * 7 + 1) * 0.6, { r: 3.2, color: bad ? 'red' : 'accent' }); });
          for (const [w, c] of best) s.segment([w - 0.3, c], [w + 0.3, c], { color: 'muted' });
          let overM = 0;
          if (cls.value !== 'int') for (const m of myc) { const bad = m.k > a * 2; if (bad) overM++; s.dot(2, m.k, { r: m.exact ? 6 : 6, hollow: !m.exact, color: bad ? 'red' : 'teal' }); }
          info = { over, overM, a, n: pts.length };
        });
        v.legend([['accent', 'sample graph', { dot: true }], ['orange', '$f(\\omega)=a\\omega$'], ['teal', 'Mycielski $M_k$ ($\\omega=2$, $\\chi=k$)', { dot: true }]]);
        v.readout(() => `$f(\\omega)=${v.fix(info.a, 1)}\\,\\omega$: **${info.over}** of ${info.n} sampled graphs above the bound${cls.value !== 'int' ? `; **${info.overM}** of the Mycielski graphs shown (they have $\\omega=2$, so cap $f(2)=${v.fix(2 * info.a, 1)}$)` : ''}.${cls.value === 'int' ? ' Interval graphs are perfect: $\\chi=\\omega$.' : ' No function $f$ works for this whole class (the Mycielski graphs climb forever at $\\omega=2$).'}`);
      },
    },
    {
      num: '5.6.1', kind: 'Theorem', name: 'Scott–Seymour: graphs with no odd hole are χ-bounded',
      statement: String.raw`The class of graphs with no odd hole (no induced odd cycle of length at least five) is $\chi$-bounded.`,
      idea: String.raw`Scott and Seymour proved the statement quoted by Diestel. Unlike Berge graphs, odd-hole-free graphs may contain odd antiholes and need not be perfect: $\overline{C_7}$ has $\omega=3$, $\alpha=2$, $\chi=4$, and no odd hole. Repeated substitution of this graph gives odd-hole-free examples with $7^k$ vertices, independence number $2^k$ and clique number $3^k$; hence their chromatic number is at least $(7/2)^k$. The hollow markers below show this lower bound, not computed chromatic numbers.`,
      caption: String.raw`Random graphs on at most 11 vertices are repaired by deleting vertices of odd holes; their exact $(\omega,\chi)$ values are shown on log axes. Hollow markers give the lower-bound pairs $(3^k,(7/2)^k)$ from repeated substitution of $\overline{C_7}$; these are not measured graph values. Finite samples illustrate the class but cannot prove $\chi$-boundedness. *Add $\overline{C_7}$* marks the smallest imperfect example.`,
      deps: ['graph-5.6.1a', 'graph-5.5.3'], refs: ['Diestel, Graph Theory, 6th ed., Theorem 5.6.1, p. 146'], tags: ['chi-bounded', 'odd holes'], credit: 'Scott & Seymour, 2016',
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Strong_perfect_graph_theorem' },
      scope: String.raw`Only holes are excluded here; odd antiholes are allowed (otherwise the graphs would be perfect).`,
      viz(v) {
        const nS = v.slider('vertices before repair', 7, 11, 10, { int: true, onChange: () => resample() });
        const s = v.stage({ x: [0.8, 120], y: [0.8, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: '$\\omega$', ylabel: '$\\chi$' });
        let pts = [], seed = 1, extra = false;
        function resample() {
          const r = rnd(seed * 503 + nS.value); pts = [];
          for (let i = 0; i < 80; i++) { const n = nS.value, A = randomA(n, 0.3 + 0.5 * r(), r), S = repairFree(n, (X) => { const h = oddHoles(A, X); return h.length ? h[0].reduce((m, x) => m | (1 << x), 0) : 0; }, r); if (S) pts.push([omegaOf(A, S), chiOf(A, S)]); }
        }
        v.button('resample', () => { seed++; resample(); });
        v.button('add $\\overline{C_7}$', () => { extra = true; });
        resample();
        let info = null;
        v.render(() => {
          s.fn((x) => x, { color: 'muted', dash: true });
          for (let k = 0; k <= 4; k++) s.dot(Math.pow(3, k), Math.pow(3.5, k), { r: 5, hollow: true, color: 'teal' });
          let gap = 0; pts.forEach(([w, c], i) => { gap = Math.max(gap, c - w); s.dot(w * (1 + 0.04 * (((i * 0.618) % 1) - 0.5)), c * (1 + 0.04 * (((i * 0.37) % 1) - 0.5)), { r: 3.3, color: 'accent' }); });
          if (extra) s.dot(3, 4, { r: 7, color: 'red' });
          info = { n: pts.length, gap, perfectCount: pts.filter(([w, c]) => w === c).length };
        });
        v.legend([['accent', 'odd-hole-free sample', { dot: true }], ['muted', '$\\chi=\\omega$', { dash: true }], ['teal', '$(3^k,(7/2)^k)$ lower bound', { dot: true }]]);
        v.readout(() => `${info.n} odd-hole-free samples; **${info.perfectCount}** have $\\chi=\\omega$, the largest gap $\\chi-\\omega$ is **${info.gap}**.${extra ? ' Red: $\\overline{C_7}$, $\\omega=3$, $\\chi=4$, no odd hole.' : ''}`);
      },
    },
    {
      num: '5.6.2', kind: 'Proposition', name: 'Gyárfás: forbidding an induced path gives χ-boundedness',
      statement: String.raw`For every fixed path $P$, the class of graphs with no induced copy of $P$ is $\chi$-bounded. In the diagram $P$ has $k$ vertices, hence length $k-1$ in Diestel's notation.`,
      idea: String.raw`Induct on the clique number, using 5.6.3. With $k\ge3$ vertices forbidden in an induced path, a connected graph has no induced path of length $k-1$ starting at any vertex. If each neighbourhood needs at most $c=f_k(\omega-1)$ colours, the lemma gives $g(c,k-1)=1+(k-2)(c+1)$. Starting with $f_k(1)=1$, take $f_k(r)=1+(k-2)(f_k(r-1)+1)$; disconnected components share a palette. This is the book's recursion after converting path length to vertex count.`,
      caption: String.raw`A random graph without an induced path on $k$ vertices (repaired by deleting a vertex of each such path). The colouring is produced by the proof: the root (click to change it, ringed) is coloured after its neighbourhood, which is coloured recursively; the rest is split into components, each coloured recursively from a neighbour of the root with a fresh shared palette. Numbers beside the vertices are BFS layers from the root. The readout compares the colours used with $\omega$, with $\chi$ and with the bound of this proof.`,
      deps: ['graph-5.6.1a'], refs: ['Diestel, Graph Theory, 6th ed., Proposition 5.6.2 and Lemma 5.6.3, pp. 146–147'], tags: ['chi-bounded', 'induced paths'], credit: 'Gyárfás, 1975 (introduction of χ-boundedness)',
      scope: String.raw`The bound shown is the recursion obtained from Lemma 5.6.3, with the path parameter converted from length to number of vertices.`,
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const kS = v.select('forbidden path', [{ value: 4, label: '$P^4$' }, { value: 5, label: '$P^5$' }, { value: 6, label: '$P^6$' }], 5, { onChange: () => resample() });
        const nS = v.slider('vertices before repair', 8, 14, 13, { int: true, onChange: () => resample() });
        const pS = v.slider('edge density', 0.15, 0.6, 0.3, { step: 0.05, onChange: () => resample() });
        const s = gstage(v, { height: 360, y: [-0.5, 6.9] });
        let root = 0, seed = 1, A = [], S = 0, nn = 0;
        const G = v.graph(s, { nodes: [], edges: [], r: 14, draggable: false, onClick: ({ node }) => { if (node) root = ix(G).at(node.id); return true; } });
        function resample() {
          const r = rnd(seed * 331 + nS.value * 7), k = +kS.value; nn = nS.value; A = randomA(nn, pS.value, r);
          S = repairFree(nn, (X) => inducedPath(A, X, k), r);
          const sub = inducedE(A, S); const B = masksOf(sub.n, sub.E); A = B; nn = sub.n; S = full(nn); root = 0;
          loadSpec(G, { nodes: Array.from({ length: nn }, (_, i) => ({ id: i, label: String(i + 1) })), edges: sub.E, layout: 'force' });
        }
        v.button('new sample', () => { seed++; resample(); });
        v.button('C5 example (P5-free, imperfect)', () => { kS.set(5); A = masksOf(5, cycE(5)); nn = 5; S = full(5); root = 0; loadSpec(G, placed(ringP(5), cycE(5), [1.6, 0.9, 8.4, 5.5])); });
        resample();
        let info = null;
        v.render(() => {
          const { H, n, A: A2 } = masksOfG(G), F = full(n), f = gyNbr(A2), comps = compMasks(A2, F), col = new Int16Array(n).fill(-1); let used = 0;
          const bfs = bfsLayers(A2, F, root);
          for (const C of comps) {
            const r0 = C >> root & 1 ? root : lowBit(C), res = lemmaColour(A2, C, r0, f);
            for (const x of bitsOf(C)) col[x] = res.col[x]; used = Math.max(used, res.used);
          }
          G.draw({ nodeFill: (id) => CP[col[H.at(id)] % 8], nodeLabel: (id) => String(col[H.at(id)] + 1), nodeNote: (id) => (bfs[H.at(id)] >= 0 ? String(bfs[H.at(id)]) : null), noteColor: () => 'muted' });
          ring(v, s, G, [H.ids[root]], 'ink', 20);
          const w = omegaOf(A2, F), kk = +kS.value; let b = 1; for (let i = 2; i <= w; i++) b = (kk - 2) * (b + 1) + 1;
          info = { n, w, chi: chiOf(A2, F), used, b, kk, ok: edgesOf(A2).every(([a, c]) => col[a] !== col[c]), p5: !inducedPath(A2, F, kk) };
        });
        v.readout(() => !info ? '' : `$n=${info.n}$, no induced path on $${info.kk}$ vertices: **${info.p5 ? '✓' : '✗'}**. $\\omega=${info.w}$, $\\chi=${info.chi}$; the proof's colouring is proper **${info.ok ? '✓' : '✗'}** and uses **${info.used}** colours (bound of the recursion: ${info.b}).`);
      },
    },
    {
      num: '5.6.3', kind: 'Lemma', name: 'Local colourability plus no long induced path bounds χ',
      statement: String.raw`For all $c,\ell$ there is a number $g(c,\ell)$ such that the following holds. If $G$ is connected, every vertex neighbourhood $G[N(x)]$ can be coloured with $c$ colours, and some vertex $v$ is the start of no induced path on $\ell$ vertices, then $\chi(G)\le g(c,\ell)$. One can take $g(c,\ell)=(\ell-2)(c+1)+1$ for $\ell\ge2$.`,
      idea: String.raw`Induction on $\ell$. Colour $N(v)$ with $c$ colours and $v$ with one more. Every component $H$ of $G-N[v]$ has a vertex adjacent to some $u\in N(v)$. The graph $H\cup\{u\}$ is connected and locally $c$-colourable; and $u$ starts no induced path on $\ell-1$ vertices in it, since prefixing $v$ would give one on $\ell$ vertices in $G$ ($v$ has no neighbour in $H$). So by induction $H\cup\{u\}$, hence $H$, can be coloured with $g(c,\ell-1)$ colours. All components can reuse the same fresh palette, since there are no edges between them: $g(c,\ell)=c+1+g(c,\ell-1)$, with $g(c,2)=1$ (then $v$ is isolated).`,
      caption: String.raw`Click a vertex to choose the root $v$. The app finds $c$ (largest chromatic number of a neighbourhood, exactly) and $\ell-1$ (the longest induced path starting at $v$), then runs the proof. Numbers beside the vertices give the recursion depth at which they are coloured: depth 0 is $N[v]$, depth 1 the components of $G-N[v]$, and so on. The slider hides deeper levels. The colours used never exceed $g(c,\ell)$.`,
      deps: ['graph-5.6.1a'], refs: ['Diestel §5.6'], tags: ['chi-bounded', 'local colouring'],
      viz(v) {
        const nS = v.slider('vertices', 7, 12, 10, { int: true, onChange: () => resample() });
        const pS = v.slider('edge density', 0.2, 0.6, 0.3, { step: 0.05, onChange: () => resample() });
        const dS = v.slider('recursion depths shown', 0, 6, 6, { int: true });
        const s = gstage(v, { height: 360, y: [-0.5, 6.9] });
        let root = 0, seed = 1;
        const G = v.graph(s, { nodes: [], edges: [], r: 14, draggable: false, onClick: ({ node }) => { if (node) root = ix(G).at(node.id); return true; } });
        function resample() {
          const r = rnd(seed * 211 + nS.value); let A;
          for (let t = 0; t < 50; t++) { A = randomA(nS.value, pS.value, r); if (compMasks(A, full(nS.value)).length === 1) break; }
          const E = edgesOf(A); loadSpec(G, { nodes: Array.from({ length: nS.value }, (_, i) => ({ id: i, label: String(i + 1) })), edges: E, layout: 'force' }); root = 0;
        }
        v.button('new graph', () => { seed++; resample(); });
        resample();
        let info = null;
        v.render(() => {
          const { H, n, A } = masksOfG(G), F = full(n), comp = compMasks(A, F).find((C) => C >> root & 1), exact = (S) => { const r = chiColour(A, S); return { col: r.col, used: r.chi }; };
          let c = 0; for (const x of bitsOf(comp)) c = Math.max(c, chiOf(A, A[x] & comp));
          const path = longestInducedPathFrom(A, comp, root), ell = path.length + 1, dep = new Int16Array(n).fill(-1), res = lemmaColour(A, comp, root, exact, dep);
          const maxd = Math.max(...bitsOf(comp).map((x) => dep[x])), D = dS.value;
          G.draw({ nodeFill: (id) => (dep[H.at(id)] >= 0 && dep[H.at(id)] <= D ? CP[res.col[H.at(id)] % 8] : null), nodeLabel: (id) => String(res.col[H.at(id)] + 1), nodeNote: (id) => (dep[H.at(id)] >= 0 ? 'd' + dep[H.at(id)] : null), noteColor: () => 'muted', dim: ids(H, F & ~comp) });
          ring(v, s, G, [H.ids[root]], 'ink', 20); ring(v, s, G, path.slice(1).map((x) => H.ids[x]), 'accent', 17);
          info = { c, ell, used: res.used, g: (ell - 2) * (c + 1) + 1, maxd, chi: chiOf(A, comp), ok: edgesOf(A).every(([a, b]) => !(comp >> a & 1) || res.col[a] !== res.col[b]) };
        });
        v.readout(() => !info ? '' : `Root ${root + 1}: $c=${info.c}$, longest induced path from the root has ${info.ell - 1} vertices, so $\\ell=${info.ell}$. The proof colours with **${info.used}** colours (proper: ${info.ok ? '✓' : '✗'}), recursion depth ${info.maxd}; bound $g=(\\ell-2)(c+1)+1=${info.g}$ → **${info.used <= info.g ? '✓' : '✗'}**; $\\chi=${info.chi}$.`);
      },
    },
    {
      num: '5.6.3a', kind: 'Hypothesis', name: 'Gyárfás–Sumner conjecture',
      statement: String.raw`**Conjecture.** For every tree $T$ the class of graphs with no induced copy of $T$ is $\chi$-bounded: there is a function $f_T$ with $\chi(G)\le f_T(\omega(G))$ for all graphs $G$ without an induced $T$. The same then holds for every forest. The conjecture is open in general; it is known for paths, stars and several further families of trees. Forbidding an induced subgraph that contains a cycle can never give a $\chi$-bounded class.`,
      idea: String.raw`That the condition cannot be weakened to graphs with a cycle follows from Erdős's theorem (5.2.5): there are graphs of arbitrarily large girth and large chromatic number, with $\omega=2$ and no short cycle at all, so for a graph $H$ with a cycle they contain no induced $H$ yet have unbounded $\chi$. Stars are covered by Ramsey's theorem and paths by 5.6.2. Proposed independently by Gyárfás and by Sumner.`,
      caption: String.raw`Choose the forbidden graph $H$ and sample random graphs without an induced $H$ (vertices of found copies are deleted). Each is plotted at $(\omega,\chi)$, with the largest $\chi$ seen for each $\omega$. For $H$ a **tree** the cloud stays low, as the conjecture predicts — which proves nothing, since samples are small. For $H=K_3$ (not a forest) the Mycielski graphs $M_k$ (hollow, $\chi=k$ by theorem for $k\ge5$) climb above any bound at $\omega=2$.`,
      deps: ['graph-5.6.1a', 'graph-5.6.2'], refs: ['Diestel, Graph Theory, 6th ed., §5.6, Gyárfás–Sumner conjecture, p. 147'], tags: ['chi-bounded', 'conjecture', 'trees'], credit: 'Gyárfás, 1975; Sumner, 1981',
      scope: String.raw`Open. The picture uses graphs on at most 12 vertices, so it cannot test an asymptotic statement.`,
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf' },
      viz(v) {
        const TREES = {
          p4: { A: masksOf(4, [[0, 1], [1, 2], [2, 3]]), lab: '$P^4$' }, star: { A: masksOf(4, [[0, 1], [0, 2], [0, 3]]), lab: '$K_{1,3}$' },
          p5: { A: masksOf(5, [[0, 1], [1, 2], [2, 3], [3, 4]]), lab: '$P^5$' }, spider: { A: masksOf(5, [[0, 1], [0, 2], [0, 3], [3, 4]]), lab: 'spider' },
          k3: { A: masksOf(3, [[0, 1], [1, 2], [0, 2]]), lab: '$K_3$ (not a tree)' },
        };
        const ex = v.select('forbidden induced subgraph $H$', Object.entries(TREES).map(([value, t]) => ({ value, label: t.lab })), 'spider', { onChange: () => resample() });
        const s = v.stage({ x: [0.4, 8], y: [0, 9], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega$', ylabel: '$\\chi$', xticks: [1, 2, 3, 4, 5, 6], yticks: [0, 2, 4, 6, 8] });
        let pts = [], seed = 1;
        function resample() {
          const r = rnd(seed * 4999 + 17), T = TREES[ex.value].A; pts = [];
          for (let i = 0; i < 90; i++) {
            const n = 9 + Math.floor(r() * 4), A0 = randomA(n, 0.25 + 0.55 * r(), r), S = repairFree(n, (X) => inducedCopy(A0, X, T), r);
            if (S) pts.push([omegaOf(A0, S), chiOf(A0, S)]);
          }
        }
        v.button('resample', () => { seed++; resample(); });
        resample();
        let info = null;
        v.render(() => {
          const best = new Map(); for (const [w, c] of pts) best.set(w, Math.max(best.get(w) || 0, c));
          pts.forEach(([w, c], i) => s.dot(w + (((i * 0.618) % 1) - 0.5) * 0.3, c + (((i * 0.37) % 1) - 0.5) * 0.3, { r: 3.2, color: 'accent' }));
          s.path([...best].sort((a, b) => a[0] - b[0]).map(([w, c]) => [w, c]), { color: 'orange', width: 2 });
          for (const [w, c] of best) s.dot(w, c, { r: 6, hollow: true, color: 'orange' });
          if (ex.value === 'k3') for (let k = 2; k <= 8; k++) s.dot(2, k, { r: 6, hollow: k >= 5, color: 'teal' });
          info = { n: pts.length, best: [...best].sort((a, b) => a[0] - b[0]) };
        });
        v.legend([['accent', 'sample graph without induced $H$', { dot: true }], ['orange', 'largest $\\chi$ seen at each $\\omega$'], ['teal', 'Mycielski $M_k$', { dot: true }]]);
        v.readout(() => `${info.n} samples without an induced ${TREES[ex.value].lab}: largest $\\chi$ per $\\omega$: ${info.best.map(([w, c]) => `$\\omega=${w}$: ${c}`).join(' · ')}.${ex.value === 'k3' ? ' Triangle-free graphs ($\\omega=2$) reach every $\\chi$: no bound exists for $H=K_3$.' : ''}`);
      },
    },
  ],
};
