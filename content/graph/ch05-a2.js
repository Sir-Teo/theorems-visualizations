// Graph Theory (Diestel) — Chapter 5, part A2 (§5.2 second half and §5.3: critical subgraphs, Brooks, Erdős, Hajós, edge colourings)
import {
  K, ix, named, wheel, gstage, cacheBy, loadSpec, COL, colName, rng32, shuffled, nbrs, conflicts, colourWith, chromatic, greedyColour, bfs, comps, girth,
  alphaMask, popcnt, edgeColourWith, maxDeg, gnm, grotzsch, regularGraph, konigFrames, vizingFrames, hajosRecipe, TAU,
} from './ch05-a.shared.js';

import {brooksPlan,erdosBounds,factorizationObstruction} from './ch05-brooks-edge-audit.shared.js';

const cc = (c) => (c >= 0 ? COL[c % COL.length] : null);
const opts = (P) => Object.entries(P).map(([value, a]) => ({ value, label: a[0] }));
const nm = (G, H) => (u) => String(G.lab(H.ids[u]));
const ringSpec = (n, E) => ({ nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(i + 1), x: Math.cos(Math.PI / 2 - (TAU * i) / n), y: Math.sin(Math.PI / 2 - (TAU * i) / n) })), edges: E, layout: 'fit' });
/** Random connected graph: random tree plus extra random edges. */
function connectedGraph(n, extra, r) {
  const E = [], have = new Set(), key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
  for (let i = 1; i < n; i++) { const j = Math.floor(r() * i); E.push([j, i]); have.add(key(j, i)); }
  for (let t = 0, c = 0; c < extra && t < 500; t++) { const a = Math.floor(r() * n), b = Math.floor(r() * n); if (a === b || have.has(key(a, b))) continue; have.add(key(a, b)); E.push([a, b]); c++; }
  return ringSpec(n, E);
}
/** Random bipartite graph with parts of sizes a, b and m edges, drawn in two columns. */
function bipartite(a, b, m, r) {
  const pairs = []; for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) pairs.push([i, a + j]);
  const nodes = []; for (let i = 0; i < a; i++) nodes.push({ id: i, label: 'u' + (i + 1), x: -1, y: (a - 1) / 2 - i });
  for (let j = 0; j < b; j++) nodes.push({ id: a + j, label: 'w' + (j + 1), x: 1, y: (b - 1) / 2 - j });
  return { nodes, edges: shuffled(pairs, r).slice(0, m), layout: 'fit' };
}
/** Draw edge colours of a frame on kit graph G (edge objects ↔ indices through H). */
function edgeStyle(H, ecol, extra = {}) {
  const idx = new Map(H.E.map(([, , e], k) => [e, k]));
  return {
    edgeColor: (e) => { const k = idx.get(e); if (extra.cur === k && ecol[k] < 0) return 'gold'; return cc(ecol[k]) || null; },
    edgeWidth: (e) => { const k = idx.get(e); return extra.hot && extra.hot.has(k) ? 7 : ecol[k] >= 0 ? 4.5 : extra.cur === k ? 5 : 1.5; },
    edgeDash: (e) => (ecol[idx.get(e)] < 0 && extra.cur !== idx.get(e) ? [4, 4] : null),
  };
}

export default {
  collection: 'graph',
  chapter: 5,
  items: [
    {
      num: '5.2.3', kind: 'Lemma', name: String.raw`k-chromatic graphs have k-chromatic subgraphs with δ ≥ k − 1`,
      statement: String.raw`Every graph $G$ with $\chi(G)=k$ has a subgraph $H$ with $\chi(H)=k$ and $\delta(H)\ge k-1$. (A minimal such $H$ is *vertex-critical*: deleting any vertex lowers $\chi$.)`,
      idea: String.raw`Take a $k$-chromatic subgraph $H$ with as few vertices as possible. If some vertex $v$ of $H$ had degree below $k-1$, colour $H-v$ with $k-1$ colours (minimality) and give $v$ a colour of the $k-1$ not met by its fewer than $k-1$ neighbours: a $(k-1)$-colouring of $H$, contradicting $\chi(H)=k$.`,
      caption: String.raw`Vertices are examined in a random order and deleted whenever $\chi$ stays $k$ (the ringed vertex is the one just examined; dimmed ones are gone). The numbers show degrees in what is left. At the end every degree is at least $k-1$.`,
      deps: ['graph-5.1.1a', 'graph-1.2.1a'], refs: ['Diestel §5.2'], tags: ['critical graphs', 'colouring'],
      viz(v) {
        const s = gstage(v, { height: 340 });
        const kS = v.select('$\\chi(G)$', [{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }], '4', { onChange: () => build() });
        const iS = v.slider('vertices examined', 0, 11, 11, { int: true });
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 13, draggable: false });
        let seed = 1, B = null;
        function build() {
          const k = +kS.value, base = [0, 0, 0, 14, 25, 35][k]; let sp;
          for (let t = 0; t < 600; t++) { const r = rng32(seed * 977 + k * 131 + t); sp = gnm(11, base + Math.floor(r() * 5), r); if (chromatic(ix(sp)).k === k) break; }
          sp.nodes.forEach((x, i) => { x.label = String(i + 1); });
          loadSpec(G, sp);
          const order = shuffled([...Array(11).keys()], rng32(seed * 31 + k)), alive = new Set(order), states = [];
          const info = (last, del) => { const H = ix(sp, { skipNode: (id) => !alive.has(id) }), r = chromatic(H); return { alive: new Set(alive), last, del, chi: r.k, col: r.col, H }; };
          states.push(info(-1, false));
          for (const u of order) { alive.delete(u); const r = chromatic(ix(sp, { skipNode: (id) => !alive.has(id) })); if (r.k < k) alive.add(u); states.push(info(u, !alive.has(u))); }
          B = { sp, k, states };
        }
        build();
        v.button('Another graph', () => { seed++; build(); });
        v.render(() => {
          const st = B.states[Math.min(iS.value, 11)], H = st.H;
          const deg = (id) => H.adj[H.at(id)].length;
          G.draw({
            dim: [...Array(11).keys()].filter((u) => !st.alive.has(u)), nodeFill: (id) => (st.alive.has(id) ? cc(st.col[H.at(id)]) : null),
            nodeNote: (id) => (st.alive.has(id) ? String(deg(id)) : null), nodeRing: (id) => (id === st.last ? 'gold' : null),
          });
        });
        v.readout(() => {
          const st = B.states[Math.min(iS.value, 11)], H = st.H, k = B.k, md = Math.min(...H.adj.map((l) => l.length));
          const msg = iS.value >= 11 ? (md >= k - 1 ? `finished: $\\delta(H)=${md}\\ge k-1=${k - 1}$ and every further deletion would lower $\\chi$` : '') : st.last >= 0 ? (st.del ? `vertex ${st.last + 1} was deleted: $\\chi$ stayed $${k}$` : `vertex ${st.last + 1} must stay: without it $\\chi$ would drop below $${k}$`) : 'the original graph';
          return `$|H|=${H.n}$, $\\chi(H)=${st.chi}$, $\\delta(H)=${md}$ (target $k-1=${k - 1}$)\n${msg}`;
        });
      },
    },
    {
      num: '5.2.4', kind: 'Theorem', name: 'Brooks’s theorem',
      statement: String.raw`Let $G$ be a finite connected simple graph that is neither complete nor an odd cycle. Then $\chi(G)\le\Delta(G)$.`,
      idea: String.raw`If every vertex except the last has a later neighbour, each earlier vertex sees at most $\Delta-1$ already-coloured neighbours; the last needs an extra argument. If some vertex $z$ has degree $<\Delta$, order the vertices by decreasing distance from $z$, with $z$ last. First reduce a graph with cutvertices to its blocks and permute colour names to agree at shared vertices. In the remaining 2-connected $\Delta$-regular case with $\Delta\ge3$, choose a vertex $v$ with two non-adjacent neighbours $x,y$ such that $G-x-y$ is connected, put $x,y$ first (they get the same colour) and the rest by decreasing distance from $v$ in $G-x-y$, with $v$ last: then $v$ sees only $\Delta-1$ colours. Complete graphs and odd cycles are exactly the connected graphs with $\chi=\Delta+1$.`,
      caption: String.raw`Pick a graph and step through the greedy colouring in the order the proof prescribes (gold: the root $z$ or $v$; purple: the two vertices $x,y$ that share a colour). Switch off *proof order* to compare label order, which can use more than $\Delta$ colours. $K^4$ and $C^5$ are the exceptions.`,
      deps: ['graph-5.2.1a', 'graph-1.4.1b'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 5.2.4, pp. 127–129; Exercise 17, p. 149', 'Lovász, Three Short Proofs in Graph Theory, pp. 269–270 (1975)'], tags: ['colouring', 'greedy'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=5', wikipedia: 'https://en.wikipedia.org/wiki/Brooks%27_theorem' },
      viz(v) {
        const P = {
          pet: ['Petersen', () => named('petersen')], cube: ['cube', () => named('cube')], w5: ['wheel', () => wheel(6)], c6: ['$C^6$', () => named('cycle', 6)],
          rnd: ['random', null], k4: ['$K^4$', () => named('complete', 4)], c5: ['$C^5$', () => named('cycle', 5)],
        };
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...P.pet[1](), r: 13 });
        let seed = 1, H, plan, S;
        const gsel = v.select('graph', opts(P), 'pet', { onChange: () => load() });
        const proof = v.toggle('proof order', true, { onChange: () => load() });
        function frames() {
          const adj = nbrs(H), col = new Array(H.n).fill(-1), fr = [];
          const order = proof.value && plan.order ? plan.order : [...Array(H.n).keys()];
          fr.push({ col: col.slice(), cur: -1, note: plan.excl ? `This is a ${plan.excl}: Brooks's theorem does not apply — expect $\\chi=\\Delta+1=${plan.D + 1}$.` : proof.value ? plan.note : 'Label order: no guarantee.' });
          for (const u of order) {
            const seen = new Set(adj[u].map((w) => col[w]).filter((c) => c >= 0)); let c = 0; while (seen.has(c)) c++; col[u] = c;
            const later = adj[u].filter((w) => col[w] < 0).length;
            fr.push({ col: col.slice(), cur: u, note: `Colour ${u + 1}: ${later} neighbour${later === 1 ? '' : 's'} still uncoloured, ${seen.size} colour${seen.size === 1 ? '' : 's'} blocked → ${colName(c)}.` });
          }
          const used = Math.max(...col) + 1;
          fr.push({ col: col.slice(), cur: -1, note: `Done with ${used} colour${used > 1 ? 's' : ''}; $\\Delta=${plan.D}$.` });
          return fr;
        }
        function load() {
          const sp = gsel.value === 'rnd' ? connectedGraph(10, 5 + (seed % 6), rng32(seed * 41)) : P[gsel.value][1]();
          loadSpec(G, sp); H = ix(G); plan = brooksPlan(H);
          if (S) S.reset(frames(), { at: 'end' });
        }
        load();
        S = v.steps({ frames: frames(), start: 'end', still: 'end', speed: 1.2, codePos: 'below', code: ['reduce at cutvertices; otherwise choose a low-degree root or a nonseparating pair', '  (decreasing distance from a vertex z of degree < Δ, or from v after x, y)', 'colour greedily in that order', 'every vertex sees ≤ Δ − 1 earlier colours, and the last one sees ≤ Δ − 1 distinct'], codeTitle: 'Brooks’s colouring' });
        v.button('Another random graph', () => { seed++; gsel.set('rnd', { fire: true }); load(); });
        v.render(() => {
          const f = S.frame; if (!f.col) return;
          G.draw({ nodeFill: (id) => cc(f.col[H.at(id)]), nodeRing: (id) => { const u = H.at(id); if (f.cur === u) return 'gold'; if (proof.value && plan.kind === 'triple' && (u === plan.x || u === plan.y)) return 'purple'; if (proof.value && plan.kind && plan.z >= 0 && u === plan.z) return 'gold'; return null; } });
        });
        v.readout(() => {
          const f = S.frame; if (!f.col) return ''; const used = f.col.some((c) => c < 0) ? Math.max(0, ...f.col) + 1 : Math.max(...f.col) + 1;
          return `$\\Delta=${plan.D}$ · colours used so far $${used}$` + (plan.excl ? ` · ${plan.excl}: $\\chi=\\Delta+1$` : f.col.every((c) => c >= 0) ? (used <= plan.D ? ' · within $\\Delta$ ✓' : ' · more than $\\Delta$ colours — this order is not the proof’s') : '');
        });
      },
    },
    {
      num: '5.2.5', kind: 'Theorem', name: 'Erdős: graphs of large girth and large chromatic number',
      statement: String.raw`For every pair of integers $k\ge 1$ and $g\ge3$ there is a graph $G$ with girth greater than $g$ and chromatic number greater than $k$. The classical existence proof is probabilistic; this display illustrates that proof. The two-parameter form follows from the book’s single parameter by taking its maximum.`,
      idea: String.raw`Take a random graph on $n$ vertices with edge probability $p=n^{\varepsilon-1}$ with $0<\varepsilon<1/g$. The expected number of cycles of length $3\le i\le g$ is at most $\sum_{i=3}^g(np)^i/(2i)=o(n)$, so with probability tending to one there are fewer than $n/2$ short cycles. At the same time, the chance of an independent set of size $r=\lceil n/2k\rceil$ is at most $\binom nr(1-p)^{\binom r2}\le (ne^{-p(r-1)/2})^r\to0$. Delete one vertex from each short cycle: at least $n/2$ vertices remain, every independent set has fewer than $n/2k$ vertices, so $\chi>k$.`,
      caption: String.raw`Right: the two estimates of the proof against $\log_{10}n$ for your $k$, $g$ and $\varepsilon=f/g$. Orange: the bound on the chance of $\ge n/2$ short cycles; blue: the bound $(ne^{-p(r-1)/2})^r$ on the existence of an independent set of size $r=\lceil n/2k\rceil$. Values above 1 are harmless upper estimates; values below the plot floor are clipped explicitly. Green points mark checked grid values where both bounds fall below $\frac12$, giving the proof’s sufficient estimate. The marked boundary is the first checked grid point, not a certified least integer $n$. Left: a small sample (with its own density) on which the construction is run for real; the readout gives its computed girth, independence number and chromatic bounds.`,
      deps: ['graph-5.1.1a', 'graph-1.3.1b'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 5.2.5, p. 130 (the two-parameter equivalent form)', 'Diestel, Lemmas 11.1.2, 11.1.4–5 and Theorem 11.2.2, pp. 342–347'], see: ['graph-11.2.2', 'comb-12.10'], tags: ['probabilistic method', 'girth', 'colouring'],
      scope: String.raw`The curves use the first-moment bounds from the proof (an upper bound on probabilities), not exact values; the sample on the left is a model illustration at a tiny $n$.`,
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=8', wikipedia: 'https://en.wikipedia.org/wiki/Probabilistic_method' },
      viz(v) {
        const sG = gstage(v, { height: 320, title: 'a small sample, short cycles deleted' });
        const sA = v.stage({ x: [0, 40], y: [-12, 4], axes: 'box', gutter: true, height: 320, xlabel: '$\\log_{10} n$', ylabel: '$\\log_{10}$ of the quantity', title: 'the two estimates of the proof' });
        const kS = v.select('want $\\chi>k$ with $k=$', [2, 3, 4, 5].map((x) => ({ value: String(x), label: String(x) })), '3');
        const gS = v.select('and girth $>g$ with $g=$', [3, 4, 5, 6].map((x) => ({ value: String(x), label: String(x) })), '4');
        const fS = v.slider('$f$ in $\\varepsilon=f/g$', 0.1, 0.9, 0.5, { step: 0.05 });
        const nS = v.slider('sample size $n$', 8, 30, 24, { int: true });
        const dS = v.slider('sample: average degree', 1.5, 6, 3.5, { step: 0.5 });
        const G = v.graph(sG, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 11, draggable: false });
        let seed = 1, samp = { key: '' }, info = {};
        v.button('Resample', () => { seed++; });
        const LN10 = Math.LN10;
        v.render(() => {
          const k = +kS.value, g = +gS.value, eps = fS.value / g, half = Math.log10(0.5);
          const c1=t=>erdosBounds(t,k,g,fS.value).cycles, c2=t=>erdosBounds(t,k,g,fS.value).independent;
          const clamp=y=>Math.max(-12,Math.min(4,y));
          sA.fn(t=>clamp(c1(t)),{domain:[0.3,40],color:'orange',width:2.5});
          sA.fn(t=>clamp(c2(t)),{domain:[0.3,40],color:'accent',width:2.5});
          sA.hline(half, { color: 'green', dash: true }); sA.hline(0, { color: 'muted', dash: true, alpha: 0.5 });
          let tStar=null;const checked=[];
          for(let t=.3;t<=40;t+=.02)if(c1(t)<half&&c2(t)<half){if(tStar==null)tStar=t;checked.push([t,-11.7]);}
          if(checked.length)sA.dots(checked,{color:'green',r:1.3});
          if(tStar!=null)sA.vline(tStar,{color:'green',width:2});
          sA.text('½', 39.5, half + 0.5, { align: 'right', color: 'green' });
          const n = nS.value, key = [n, k, g, dS.value, seed].join(':');
          if (samp.key !== key) {
            const r = rng32(seed * 101 + n), p = Math.min(0.9, dS.value / (n - 1)), E = [];
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < p) E.push([i, j]);
            const sp = { nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(i + 1), x: Math.cos(Math.PI / 2 - (TAU * i) / n), y: Math.sin(Math.PI / 2 - (TAU * i) / n) })), edges: E, layout: 'fit' };
            const gone = new Set(); let H;
            for (let it = 0; it < n; it++) { H = ix(sp, { skipNode: (id) => gone.has(id) }); const gi = girth(H); if (gi.g > g) break; gone.add(H.ids[gi.cycle[0]]); }
            H = ix(sp, { skipNode: (id) => gone.has(id) });
            loadSpec(G, sp);
            const A = H.adj.map((l) => l.reduce((m, [w]) => m | (1 << w), 0));
            const al = H.n ? alphaMask(A, (1 << H.n) - 1) : 0, ch = H.n <= 22 ? chromatic(H) : null;
            samp = { key, gone, H, n, m: E.length, p, al, ch, gi: girth(H).g };
          }
          G.draw({ dim: [...samp.gone] });
          info = { tStar, eps };
        });
        v.legend([['orange', '$\\frac{2}{n}\\sum_{i=3}^g\\frac{(np)^i}{2i}$: bound on $P(\\ge n/2$ short cycles$)$'], ['accent', '$(n\\,e^{-p(r-1)/2})^r$: bound on $P(\\alpha\\ge r)$, $r=\\lceil n/2k\\rceil$'], ['green', 'checked grid values with both bounds below ½']]);
        v.readout(() => {
          const x = samp, i = info;
          const t = i.tStar == null ? 'no grid point up to $10^{40}$ satisfies both bounds' : `first checked point $\\log_{10}n\\approx${v.fix(i.tStar,2)}$ satisfies both bounds`;
          return `with $p=n^{\\varepsilon-1}$, $\\varepsilon\\approx${v.fix(i.eps, 3)}$, ${t}; curves are clipped to $[-12,4]$\n` + `sample (its own density): $n=${x.n}$, ${x.m} edges, ${x.gone.size} vertices deleted to reach girth $>g$: $n'=${x.H.n}$, girth ${x.gi === Infinity ? '$\\infty$' : x.gi}, $\\alpha=${x.al}$, so $\\chi\\ge\\lceil n'/\\alpha\\rceil=${x.al ? Math.ceil(x.H.n / x.al) : '-'}$` + (x.ch ? `, $\\chi${x.ch.exact?'=':'\\ge'}${x.ch.k}$` : '');
        });
      },
    },
    {
      num: '5.2.5a', kind: 'Definition', name: 'k-constructible graphs (Hajós construction)',
      statement: String.raw`For an integer $k\ge1$ the class of **$k$-constructible** graphs is generated by three rules: (i) $K^k$ is $k$-constructible; (ii) (*Hajós join*) if $G_1,G_2$ are disjoint $k$-constructible graphs with edges $x_1y_1\in G_1$, $x_2y_2\in G_2$, then deleting these two edges, identifying $x_1$ with $x_2$ and adding the edge $y_1y_2$ gives a $k$-constructible graph; (iii) identifying two non-adjacent vertices of a $k$-constructible graph gives a $k$-constructible graph. Every $k$-constructible graph has $\chi\ge k$.`,
      idea: String.raw`Each rule preserves "not $(k-1)$-colourable". For the join, a $(k-1)$-colouring would give $x_1=x_2$ one colour; then $y_1$ and $y_2$ cannot both share it (they are adjacent), so one of the deleted edges $x_iy_i$ is still properly coloured and the colouring extends to the corresponding original graph, a contradiction. A colouring after identifying two non-adjacent vertices pulls back to a colouring of the original graph. For $k=4$, joining two copies of $K^4$ gives the abstract Moser spindle.`,
      caption: String.raw`Start from $K^k$. Click an edge (the end nearer to your click becomes the glued vertex) and press *join with a new $K^k$*; or click two non-adjacent vertices and press *identify*. The readout keeps checking $\chi\ge k$ by exhaustive search. Try $k=4$: one join of two $K^4$ gives the 7-vertex Moser spindle.`,
      deps: ['graph-5.1.1a'], refs: ['Diestel, Graph Theory, 6th ed. (2025), unnumbered k-constructible definition, p. 130'], tags: ['Hajós', 'colouring'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=8', wikipedia: 'https://en.wikipedia.org/wiki/Haj%C3%B3s_construction' },
      viz(v) {
        const s = gstage(v, { height: 360 });
        const kS = v.select('$k$', [3, 4, 5].map((x) => ({ value: String(x), label: String(x) })), '4', { onChange: () => reset() });
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 12 });
        const chi = cacheBy((g) => chromatic(ix(g)));
        let sel = { v: [], e: null, keep: null }, hist = [], uid = 0, log = [];
        const snap = () => ({ nodes: G.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: G.edges.map((e) => [e.from, e.to]), log: log.slice() });
        const put = (S, lay) => { G.set({ nodes: S.nodes.map((n) => ({ ...n, label: String(n.id >= 100 ? n.id - 100 : n.id) })), edges: S.edges }); if (lay) G.layout(lay); sel = { v: [], e: null, keep: null }; };
        function reset() {
          const k = +kS.value; uid = k; log = [`start: $K^${k}$`];
          const nodes = Array.from({ length: k }, (_, i) => ({ id: i, x: Math.cos(Math.PI / 2 - (TAU * i) / k), y: Math.sin(Math.PI / 2 - (TAU * i) / k) }));
          const edges = []; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) edges.push([i, j]);
          hist = []; G.set({ nodes: nodes.map((n) => ({ ...n, label: String(n.id >= 100 ? n.id - 100 : n.id) })), edges }); G.layout('fit'); sel = { v: [], e: null, keep: null };
        }
        reset();
        const nid = (x) => String(x);
        G.onClick = ({ node, edge, x, y }) => {
          if (node) { const i = sel.v.indexOf(node.id); if (i >= 0) sel.v.splice(i, 1); else { sel.v.push(node.id); if (sel.v.length > 2) sel.v.shift(); } sel.e = null; }
          else if (edge) { const a = G.node(edge.from), b = G.node(edge.to); sel.e = edge; sel.keep = Math.hypot(a.x - x, a.y - y) <= Math.hypot(b.x - x, b.y - y) ? edge.from : edge.to; sel.v = []; }
          else { sel = { v: [], e: null, keep: null }; }
          return true;
        };
        v.button('Hajós join with a new Kᵏ along the selected edge', () => {
          if (!sel.e || G.nodes.length + (+kS.value) - 1 > 20) return;
          hist.push(snap());
          const k = +kS.value, a = sel.keep, b = sel.e.from === a ? sel.e.to : sel.e.from, nodes = G.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));
          const mx = Math.max(...nodes.map((n) => n.x)) + 1.2, ids = [a]; for (let i = 1; i < k; i++) { ids.push(++uid + 100); nodes.push({ id: ids[i], x: mx + Math.cos(i) * 0.8, y: Math.sin(i) * 0.8 }); }
          const edges = G.edges.filter((e) => e !== sel.e).map((e) => [e.from, e.to]);
          for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (!(i === 0 && j === 1)) edges.push([ids[i], ids[j]]);
          edges.push([b, ids[1]]);
          log.push(`join at edge ${a}–${b} with a copy of $K^${k}$`);
          put({ nodes, edges }, 'force');
        });
        v.button('Identify the two selected vertices', () => {
          if (sel.v.length !== 2) return; const [a, b] = sel.v; if (G.edge(a, b)) return;
          hist.push(snap());
          const nodes = G.nodes.filter((n) => n.id !== b).map((n) => ({ id: n.id, x: n.x, y: n.y })), seen = new Set(), edges = [];
          for (const e of G.edges) { const p = e.from === b ? a : e.from, q = e.to === b ? a : e.to, kk = [p, q].sort().join('|'); if (!seen.has(kk)) { seen.add(kk); edges.push([p, q]); } }
          log.push(`identify ${a} and ${b}`);
          put({ nodes, edges }, 'force');
        });
        v.button('Undo', () => { const S = hist.pop(); if (S) { log = S.log; put(S); } });
        v.button('Reset', () => reset());
        v.render(() => {
          const H = ix(G), r = chi(G), vs = new Set(sel.v);
          G.draw({
            nodeFill: (id) => (r.col ? cc(r.col[H.at(id)]) : null), nodeRing: (id) => (vs.has(id) ? 'gold' : id === sel.keep && sel.e ? 'gold' : null),
            edgeColor: (e) => (e === sel.e ? 'gold' : null), edgeWidth: (e) => (e === sel.e ? 5 : null),
          });
        });
        v.readout(() => { const H = ix(G), r = chi(G), k = +kS.value; return `$n=${H.n}$, $m=${H.m}$ · $\\chi(G)${r.exact ? '=' : '\\ge'}${r.k}\\ge k=${k}$ ${r.k >= k ? '✓' : ''}\n${log.slice(-4).join(' → ')}` + (H.n + k - 1 > 20 ? '\n(joins are disabled above 20 vertices)' : ''); });
      },
    },
    {
      num: '5.2.6', kind: 'Theorem', name: 'Hajós: χ ≥ k iff there is a k-constructible subgraph',
      statement: String.raw`A finite simple graph $G$ has $\chi(G)\ge k$, for an integer $k\ge1$, if and only if it contains a $k$-constructible subgraph. The construction certifies a subgraph with chromatic number at least $k$.`,
      idea: String.raw`"If" is 5.2.5a. For "only if" take an edge-maximal counterexample $G$ on a fixed vertex set. It is not complete multipartite (that would contain $K^k$), so there are $x,y_1,y_2$ with $xy_1,xy_2\notin E$ but $y_1y_2\in E$. By maximality $G+xy_1$ and $G+xy_2$ contain $k$-constructible subgraphs $H_1\ni xy_1$ and $H_2\ni xy_2$. Join them at $x$ (deleting both added edges, adding $y_1y_2$) and identify the remaining copies of corresponding vertices: this is a $k$-constructible subgraph of $G$. The picture runs this argument as a recursion.`,
      caption: String.raw`Step through the construction found by the proof for the chosen graph. Green edges belong to $G$; orange dashed edges are "virtual" edges that the recursion added to $G$ and that later joins remove again. A join at $x$ merges two earlier steps (named in the note); the last step is a $k$-constructible subgraph of $G$.`,
      deps: ['graph-5.2.5a'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 5.2.6, p. 131'], tags: ['Hajós', 'colouring'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=9', wikipedia: 'https://en.wikipedia.org/wiki/Haj%C3%B3s_construction' },
      scope: String.raw`The sequence shown is what this particular implementation of the proof produces (labels of $G$ are reused instead of building disjoint copies and identifying afterwards); other valid sequences exist.`,
      viz(v) {
        const diamond = (a, ang) => [[Math.cos(ang + Math.PI / 6), Math.sin(ang + Math.PI / 6)], [Math.cos(ang - Math.PI / 6), Math.sin(ang - Math.PI / 6)], [Math.sqrt(3) * Math.cos(ang), Math.sqrt(3) * Math.sin(ang)]];
        const d1 = diamond(0, 0.293), d2 = diamond(0, -0.293);
        const moser = { nodes: [[0, 0], ...d1, ...d2].map(([x, y], i) => ({ id: i, x, y })), edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [0, 4], [0, 5], [4, 5], [4, 6], [5, 6], [3, 6]], layout: 'fit' };
        const P = { c5: ['$C^5$ ($k=3$)', () => named('cycle', 5), 3], w5: ['wheel ($k=4$)', () => wheel(5), 4], moser: ['Moser spindle ($k=4$)', () => moser, 4], gro: ['Grötzsch ($k=4$)', () => grotzsch(), 4] };
        const s = gstage(v, { height: 360 });
        const gsel = v.select('graph', opts(P), 'moser', { onChange: () => load() });
        const G = v.graph(s, { ...moser, r: 12, draggable: true });
        let H, R, S, k;
        const key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
        function frames() {
          const inG = new Set(H.E.map(([a, b]) => key(a, b))), fr = [];
          R.nodes.forEach((nd, i) => {
            const vs = new Set(); nd.edges.forEach((e) => e.split(',').forEach((x) => vs.add(+x)));
            const virt = nd.edges.filter((e) => !inG.has(e)).length;
            const lab = (x) => G.lab(H.ids[x]);
            const note = nd.kind === 'K' ? `Step ${i + 1}: a copy of $K^${k}$ on {${nd.verts.map(lab).join(', ')}}${virt ? ` (${virt} of its edges are not in $G$ yet)` : ' (inside $G$)'}.`
              : `Step ${i + 1}: Hajós join of steps ${nd.a + 1} and ${nd.b + 1} at $x=${lab(nd.x)}$: delete $x y_1$ and $x y_2$ (with $y_1=${lab(nd.y1)}$, $y_2=${lab(nd.y2)}$), add $y_1y_2$; then identify the shared vertices. ${virt ? virt + ' virtual edges remain.' : 'No virtual edge remains: a subgraph of $G$.'}`;
            fr.push({ edges: nd.edges, vs, note });
          });
          return fr;
        }
        function load() {
          const p = P[gsel.value]; loadSpec(G, p[1]()); H = ix(G); k = p[2];
          R = hajosRecipe(H.n, H.E.map(([a, b]) => [a, b]), k);
          if (S) S.reset(R ? frames() : [{ edges: [], vs: new Set(), note: 'no construction found' }], { at: 'end' });
        }
        load();
        S = v.steps({ frames: R ? frames() : [{ edges: [], vs: new Set(), note: '' }], start: 'end', still: 'end', speed: 1.5, note: true });
        v.render(() => {
          const f = S.frame; if (!f.edges) return;
          const inG = new Set(H.E.map(([a, b]) => key(a, b))), use = new Set(f.edges);
          G.draw({
            dim: H.ids.filter((_, u) => !f.vs.has(u)),
            edgeColor: (e) => (use.has(key(H.at(e.from), H.at(e.to))) ? 'green' : null), edgeWidth: (e) => (use.has(key(H.at(e.from), H.at(e.to))) ? 5 : 1.2),
          });
          for (const e of f.edges) if (!inG.has(e)) { const [a, b] = e.split(',').map(Number), A = G.node(H.ids[a]), B = G.node(H.ids[b]); s.line(A.x, A.y, B.x, B.y, { color: 'orange', width: 3.5, dash: [6, 5] }); }
        });
        v.readout(() => {
          const f = S.frame; if (!f.edges) return ''; const n = H.n;
          const sub = ix({ nodes: H.ids.map((id) => ({ id })), edges: f.edges.map((e) => e.split(',').map((x) => H.ids[+x])) }, { skipNode: (id) => !f.vs.has(H.at(id)) });
          const r = chromatic(sub);
          return `step ${S.i + 1} of ${S.n}: ${f.edges.length} edges on ${f.vs.size} of ${n} vertices · this graph has $\\chi${r.exact?'=':'\\ge'}${r.k}\\ge k=${k}$ ${r.k >= k ? '✓' : ''}`;
        });
      },
    },
    // ====================================================================== 5.3 Colouring edges
    {
      num: '5.3.1', kind: 'Proposition', name: 'König: bipartite graphs have chromatic index Δ',
      statement: String.raw`Every finite bipartite simple graph $G$ satisfies $\chi'(G)=\Delta(G)$.`,
      idea: String.raw`Colour the edges one at a time with $\Delta$ colours, keeping the colouring proper. For a new edge $xy$ both ends have a missing colour, say $\alpha$ at $x$ and $\beta$ at $y$; if $\alpha=\beta$ or $\alpha$ is also missing at $y$ we are done. Otherwise follow the path from $y$ that alternates $\alpha,\beta,\alpha,\dots$ and swap the two colours along it. This path cannot reach $x$: with $x\\in A$ and $y\\in B$ for the two sides, the path alternately visits $B$ and $A$ and enters every vertex of $A$ along an $\\alpha$-edge, but $x$ has no $\\alpha$-edge. After the swap $\alpha$ is missing at both ends of $xy$.`,
      caption: String.raw`Step through the algorithm: the gold edge is the one being coloured, a thick edge is the alternating path that is swapped. Choose *Petersen* (not bipartite) to see the argument fail: the path runs into $x$ and the algorithm gets stuck with $\Delta=3$ colours.`,
      deps: ['graph-5.1.1b', 'graph-1.6.1'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Proposition 5.3.1, p. 132'], tags: ['edge colouring', 'bipartite'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=10', wikipedia: 'https://en.wikipedia.org/wiki/K%C5%91nig%27s_theorem_(graph_theory)' },
      viz(v) {
        const P = { rnd: ['random bipartite', null], k33: ['$K_{3,3}$', () => named('kmn', 3, 3)], cube: ['cube', () => named('cube')], pet: ['Petersen (not bipartite)', () => named('petersen')] };
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...named('kmn', 3, 3), r: 13 });
        let seed = 1, H, F, S, D;
        const gsel = v.select('graph', opts(P), 'rnd', { onChange: () => load() });
        function load() {
          const r = rng32(seed * 53 + 7);
          const sp = gsel.value === 'rnd' ? bipartite(4 + (seed % 2), 4, 11 + (seed % 3), r) : P[gsel.value][1]();
          sp.nodes.forEach((n, i) => { if (!n.label) n.label = String(i + 1); });
          loadSpec(G, sp); H = ix(G); D = maxDeg(H); F = konigFrames(H, D, nm(G, H));
          if (S) S.reset(F.frames, { at: at() });
        }
        load();
        const at = () => { const i = F.frames.findIndex((f) => /^Swap/.test(f.note)); return i >= 0 ? i : 'end'; };
        S = v.steps({ frames: F.frames, start: at(), still: at(), speed: 1.4, codePos: 'below', code: ['for each edge xy in turn:', '  if some colour is missing at both x and y: use it', '  else α missing at x, β missing at y:', '    swap α, β on the alternating path from y (it avoids x)', '    colour xy with α'], codeTitle: 'König’s edge colouring' });
        v.button('Another graph', () => { seed++; if (gsel.value !== 'rnd') gsel.set('rnd', { fire: true }); else load(); });
        v.render(() => { const f = S.frame; if (!f.ecol) return; G.draw(edgeStyle(H, f.ecol, { cur: f.cur, hot: new Set(f.path) })); });
        v.readout(() => { const f = S.frame; if (!f.ecol) return ''; const n = f.ecol.filter((c) => c >= 0).length; return `$\\Delta=${D}$ colours · ${n} of ${H.m} edges coloured` + (F.complete ? '' : ' · the full run gets stuck: not bipartite') ; });
      },
    },
    {
      num: '5.3.2', kind: 'Theorem', name: 'Vizing’s theorem',
      statement: String.raw`Every finite simple graph $G$ satisfies $\Delta(G)\le\chi'(G)\le\Delta(G)+1$.`,
      idea: String.raw`Colour edges one at a time with $\Delta+1$ colours. To colour an uncoloured edge $xy_0$, build a *fan* at $x$: a sequence $y_0,y_1,\dots,y_t$ of neighbours where the colour of $xy_{i+1}$ is missing at $y_i$. Let $c$ be missing at $x$ and $d$ missing at $y_t$. Flip the $c/d$-alternating path starting at $x$ (so $d$ becomes missing at $x$); some initial piece of the fan ending at a vertex $y_j$ that misses $d$ is still a fan. Rotate it (each fan edge takes the next one's colour) and colour $xy_j$ with $d$. The picture follows the Misra–Gries implementation of this proof.`,
      caption: String.raw`Step through the colouring (edges coloured one by one in the order of the list). Purple rings mark the fan at the gold vertex, thick edges are the fan edges or the inverted alternating path. $K^5$ and the Petersen graph really need $\Delta+1$ colours; the cube needs only $\Delta$, although this $\Delta+1$ algorithm may use an extra colour even there. The readout separately certifies the minimum on these small examples.`,
      deps: ['graph-5.1.1b'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 5.3.2, pp. 132–133', 'Misra & Gries, A Constructive Proof of Vizing’s Theorem, https://www.cs.utexas.edu/~misra/psp.dir/vizing.pdf'], tags: ['edge colouring', 'Vizing'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=10', wikipedia: 'https://en.wikipedia.org/wiki/Vizing%27s_theorem' },
      viz(v) {
        const P = { pet: ['Petersen', () => named('petersen')], k5: ['$K^5$', () => named('complete', 5)], k4: ['$K^4$', () => named('complete', 4)], cube: ['cube', () => named('cube')], rnd: ['random', null] };
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...named('petersen'), r: 12 });
        let seed = 1, H, F, S, optimum;
        const gsel = v.select('graph', opts(P), 'pet', { onChange: () => load() });
        function load() {
          const sp = gsel.value === 'rnd' ? connectedGraph(8, 6 + (seed % 5), rng32(seed * 29)) : P[gsel.value][1]();
          sp.nodes.forEach((n, i) => { if (!n.label) n.label = String(i + 1); });
          loadSpec(G, sp); H = ix(G); F = vizingFrames(H, nm(G, H)); optimum=edgeColourWith(H,maxDeg(H));
          if (S) S.reset(F.frames, { at: at() });
        }
        load();
        const at = () => { let i = F.frames.findIndex((f) => /^Rotate/.test(f.note)); if (i < 0) i = F.frames.findIndex((f) => /^Follow/.test(f.note)); return i >= 0 ? i : 'end'; };
        S = v.steps({ frames: F.frames, start: at(), still: at(), speed: 1.5, codePos: 'below', code: ['for each uncoloured edge x y₀:', '  build a maximal fan y₀ … y_t at x', '  c ← colour missing at x,  d ← colour missing at y_t', '  invert the c/d-path that starts at x', '  find a prefix of the fan ending at y_j with d missing', '  rotate that prefix, colour x y_j with d'], codeTitle: 'Misra–Gries' });
        v.button('Another random graph', () => { seed++; if (gsel.value !== 'rnd') gsel.set('rnd', { fire: true }); else load(); });
        v.render(() => {
          const f = S.frame; if (!f.ecol) return;
          const hot = new Set(f.path); if (f.fan.length > 1 && f.centre >= 0) for (const [w, k] of H.adj[f.centre]) if (f.fan.includes(w)) hot.add(k);
          const ring = new Set(f.fan.map((u) => H.ids[u]));
          G.draw({ ...edgeStyle(H, f.ecol, { cur: f.cur, hot }), nodeRing: (id) => (H.at(id) === f.centre ? 'gold' : ring.has(id) ? 'purple' : null) });
        });
        v.legend([['gold', 'edge being coloured / its common end', { dot: true }], ['purple', 'fan vertices', { dot: true }]]);
        v.readout(() => { const f = S.frame; if (!f.ecol) return ''; const used = new Set(f.ecol.filter((c) => c >= 0)).size; return `$\\Delta=${maxDeg(H)}$, palette $\\Delta+1=${maxDeg(H) + 1}$ · ${f.ecol.filter((c) => c >= 0).length} of ${H.m} edges coloured with ${used} colours; ${optimum.status==='yes'?`minimum $\\chi'=${maxDeg(H)}$`:optimum.status==='no'?`minimum $\\chi'=${maxDeg(H)+1}$`:'minimum not decided within the search budget'}` + (S.atEnd ? (F.ok ? ' · proper ✓' : ' · error') : ''); });
      },
    },
    {
      num: '5.3.3', kind: 'Theorem', name: '1-factorization of dense regular graphs (CKLOT)',
      statement: String.raw`There is $n_0$ such that every finite simple $d$-regular graph on an even number $n\ge n_0$ of vertices with $d\ge 2\lceil n/4\rceil-1$ is 1-factorizable, i.e. $\chi'(G)=d$: its edges split into $d$ perfect matchings. The bound on $d$ is best possible.`,
      idea: String.raw`This is the (large) 1-factorization conjecture of Chetwynd and Hilton, proved using robust-expander decompositions and detailed structural cases. The threshold $2\lceil n/4\rceil-1\approx n/2$ is sharp: for $n\equiv2\pmod4$, two odd cliques of order $n/2$ have degree one below the threshold. For $n\equiv0\pmod4$, use odd cliques of orders $n/2-1,n/2+1$ and remove a Hamilton cycle from the larger. Both constructions have odd components and no perfect matching.`,
      caption: String.raw`Choose $n$ and $d$ and a graph (a sampled $d$-regular graph, or a threshold-sharp example with two odd components). An exhaustive search for a $d$-edge-colouring either shows the perfect matchings one colour class at a time or proves none exists; stopping at the search budget is inconclusive. The theorem needs an unspecified sufficiently large $n\ge n_0$, so these small cases only illustrate it; the odd-component examples show why the sharp degree bound cannot be lowered. The degree control is limited by $n-1$ and disabled in sharpness mode, whose degree is determined by the construction. The colour-class control spans the effective palette.`,
      deps: ['graph-5.1.1b', 'graph-5.3.2', 'graph-2.1.1a'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 5.3.3, p. 133 (weaker degree n/2 form); Csaba et al., Theorem 1.1.1, https://arxiv.org/abs/1401.4159'], tags: ['edge colouring', '1-factorization'],
      scope: String.raw`Asymptotic: holds for all sufficiently large even $n$. The small graphs drawn here are illustrations and are decided by exhaustive search, not by the theorem.`,
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=11', wikipedia: 'https://en.wikipedia.org/wiki/Graph_factorization' },
      viz(v) {
        const s = gstage(v, { height: 360 });
        const nS = v.slider('$n$ (even)', 6, 12, 10, { int: true, step: 2 });
        const dS = v.slider('degree $d$', 2, 11, 5, { int: true });
        const kind = v.select('graph', [{ value: 'reg', label: 'random $d$-regular' }, { value: 'two', label: 'odd-component sharpness example' }], 'reg');
        const cS = v.slider('colour class (0 = all)', 0, 11, 0, { int: true });
        const G = v.graph(s, { nodes: [{ id: 0, x: 0, y: 0 }], edges: [], layout: 'none', r: 11, draggable: true });
        let seed = 1, B = { key: '' };
        v.button('Resample', () => { seed++; });
        v.render(() => {
          const n = nS.value - (nS.value % 2), two = kind.value === 'two', d = two ? 2*Math.ceil(n/4)-2 : Math.min(dS.value, n - 1), key = [n, d, two, seed].join(':');
          dS.input.max=n-1;dS.input.disabled=two;if(two&&dS.value!==d)dS.set(d);else if(dS.value>n-1)dS.set(n-1);cS.input.max=d;if(cS.value>d)cS.set(d);
          if (B.key !== key) {
            let sp;
            if (two) {const Q=factorizationObstruction(n);let off=0;const nodes=[];Q.parts.forEach((h,b)=>{for(let j=0;j<h;j++){const a=Math.PI/2-TAU*j/h;nodes.push({id:off+j,label:String(off+j+1),x:(b?1.3:-1.3)+.9*Math.cos(a),y:.9*Math.sin(a)});}off+=h;});sp={nodes,edges:Q.E,layout:'fit'};}
            else { sp = regularGraph(n, d, rng32(seed * 7 + n * 13 + d), 300); sp.nodes.forEach((x, i) => { x.label = String(i + 1); }); }
            loadSpec(G, sp);
            const H = ix(G), cm = comps(H), odd = cm.lists.some((l) => l.length % 2), r = odd ? { status: 'no' } : edgeColourWith(H, d, 2e6);
            B = { key, H, n, d, two, odd, r, thr: 2 * Math.ceil(n / 4) - 1 };
          }
          const { H, r } = B, cls = Math.min(cS.value, B.d), ok = r.status === 'yes';
          const idx = new Map(H.E.map(([, , e], k) => [e, k]));
          G.draw({
            edgeColor: (e) => (ok ? (cls === 0 || r.col[idx.get(e)] === cls - 1 ? cc(r.col[idx.get(e)]) : null) : B.odd ? 'red' : null),
            edgeWidth: (e) => (ok ? (cls === 0 ? 3.5 : r.col[idx.get(e)] === cls - 1 ? 6 : 1.2) : 2),
          });
        });
        v.readout(() => {
          const b = B; if (!b.H) return '';
          const res = b.r.status === 'yes' ? `found $${b.d}$ perfect matchings — 1-factorizable` : b.r.status === 'no' ? (b.odd ? `a component has odd order, so there is no perfect matching: not 1-factorizable` : `exhaustive search: no $${b.d}$-edge-colouring, so $\\chi'=${b.d + 1}$`) : 'search budget exceeded';
          return `$n=${b.n}$, $d=${b.d}$, threshold $2\\lceil n/4\\rceil-1=${b.thr}$: $d$ is ${b.d >= b.thr ? 'at least' : 'below'} it\n${res}`;
        });
      },
    },
  ],
};
