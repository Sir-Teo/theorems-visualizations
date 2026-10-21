// Networks & Collective Behavior — Chapter 2: Social networks and ties
//
// Data sources: Zachary's karate club, Les Misérables co-appearances, Florentine marriages and the Southern women
// attendance table are the copies bundled with networkx 3.7 (see ch02.shared.js); every statistic printed on the pages
// is recomputed in the browser. Models (preferential attachment, random graphs, rings) are generated with seeded RNGs.
import {
  getNet, nodeSpec, RANK, CYC, shortestPath, bfs, components, triangleStats, betweenness, burtConstraint, deg,
  gnm, mkGraph, rng32, shuffle, hasEdge,
} from './ch02.shared.js';

const NETS = [{ value: 'karate', label: 'Karate club' }, { value: 'lesmis', label: 'Les Misérables' }, { value: 'florence', label: 'Florence' }];

export default {
  collection: 'soc',
  chapter: 2,
  title: 'Social networks and ties',
  summary: String.raw`Treating people as nodes and relationships as edges turns social structure into graph theory. Friends of friends tend to become friends (triadic closure), which forces the bridges between groups to be weak ties: the reason acquaintances, not close friends, bring news of jobs. Similar people cluster, whether by choice or through influence, and signed networks tend toward balance.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Social networks as graphs',
      statement: String.raw`A **social network** is modelled as a graph $G = (V, E)$: the nodes $V$ are people (or organisations) and an edge $\{u, v\} \in E$ records that the two have some relationship (friendship, communication, kinship, a shared meeting). Edges may be undirected (mutual acquaintance) or directed (who nominated whom), and may carry a weight or a sign.

For an undirected graph, a **path** is a sequence of nodes in which consecutive ones are joined by an edge, the graph is **connected** if every pair is joined by a path, and its **components** are the maximal connected pieces. The **degree** $k_i$ of a node is its number of edges, and counting edge endpoints gives $\sum_i k_i = 2|E|$.`,
      idea: String.raw`The modelling move is to discard everything about a person except who they are tied to, and then let graph theory answer structural questions: who can reach whom, through how many hands, and which groups are cut off from one another. Everything in this chapter is a statement about such graphs; the handshake identity $\sum k_i = 2|E|$ (every edge has two ends) is the first of them.`,
      caption: String.raw`Drag any node. Click one node, then a second: the shortest path between them is highlighted. Switch networks, and remove the selected person to watch the group split into components.`,
      deps: [],
      refs: ['E&K §2.1', 'Newman ch. 4'],
      tags: ['graphs', 'networks'],
      credit: 'Moreno (sociograms), 1934; Zachary karate club study, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Social_network' },
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 400 });
        const sel = v.select('Network', NETS, 'karate', { onChange: load });
        let net = getNet('karate'), sources = [], removed = new Set();
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 11, fontSize: 10.5 });
        const rm = v.button('Remove / restore selected person', () => { if (sources.length) { const i = sources[sources.length - 1]; if (removed.has(i)) removed.delete(i); else removed.add(i); } });
        const reset = v.button('Clear', () => { sources = []; removed = new Set(); });
        function load() {
          net = getNet(sel.value); sources = []; removed = new Set();
          G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: net.g.n > 40 ? 5 : 11, autoRadius: false, labelPos: net.g.n < 20 ? 'n' : 'in' }).layout('fit');
        }
        G.onClick = ({ node }) => {
          if (node) { const i = node.id; if (sources.length >= 2) sources = []; if (!sources.includes(i)) sources.push(i); }
          return true;
        };
        let info = {};
        v.render(() => {
          const g = net.g, comps = components(g, removed), compOf = new Array(g.n).fill(-1);
          comps.forEach((c, k) => c.forEach((i) => { compOf[i] = k; }));
          let path = [];
          if (sources.length === 2) path = shortestPath(g, sources[0], sources[1], removed);
          const dim = [...removed];
          G.draw({
            nodeColor: (id) => (compOf[id] >= 0 ? CYC[compOf[id] % CYC.length] : 'faint'),
            nodeFill: (id) => (sources.includes(id) ? 'gold' : null),
            nodeLabel: (id) => (g.n < 40 ? (net.g.n === 15 ? '' : net.labels[id]) : ''),
            nodeNote: (id) => (g.n === 15 ? net.labels[id] : null),
            highlightPath: path, pathColor: 'green', dim,
          });
          info = { n: g.n - removed.size, m: g.edges.filter(([a, b]) => !removed.has(a) && !removed.has(b)).length, comps: comps.length, big: comps[0] ? comps[0].length : 0, path, g };
        });
        v.readout(() => {
          const g = info.g; if (!g) return '';
          const d = deg(g), a = sources[0], b = sources[1];
          const dsum = d.reduce((x, y) => x + y, 0);
          let l = `$|V| = ${info.n}$, $|E| = ${info.m}$ · **${info.comps}** connected component${info.comps === 1 ? '' : 's'}, the largest with ${info.big} people`;
          if (!removed.size) l += ` · $\\sum_i k_i = ${dsum} = 2|E|$`;
          if (a != null) l += `\nSelected ${a != null ? `person ${net.labels[a]}: degree ${d[a]}` : ''}`;
          if (b != null) l += info.path.length ? ` · distance to ${net.labels[b]}: **${info.path.length - 1}** step${info.path.length === 2 ? '' : 's'}` : ` · ${net.labels[b]} is **unreachable** (different components)`;
          return l;
        });
        v.legend([['gold', 'selected', { dot: true }], ['green', 'shortest path'], ['accent', 'largest component', { dot: true }], ['orange', 'other components', { dot: true }]]);
        v.onCleanup(() => {});
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Distance and breadth-first search',
      statement: String.raw`In a connected graph the **distance** $d(u, v)$ is the number of edges on a shortest path from $u$ to $v$ (and $\infty$ if none exists). **Breadth-first search** from a source $s$ visits the nodes in rings: first $s$ itself, then its neighbours (distance 1), then their not-yet-visited neighbours (distance 2), and so on; the ring a node is found in is exactly $d(s, v)$.

The **diameter** is $\max_{u,v} d(u,v)$ and the **average path length** is the mean of $d(u,v)$ over pairs. The **distance distribution** of a network, the share of pairs at each distance, is the usual summary of how "small" a social world is.`,
      idea: String.raw`BFS processes nodes from a first-in, first-out queue, so every node at distance $r$ is dequeued before any node at distance $r + 1$; when a node is first reached it is reached from a node of the previous ring, which makes its recorded ring the shortest possible. This is the breadth-first search of algorithm theory; here its rings are the "degrees of separation" of folk wisdom.`,
      caption: String.raw`Click a person to make them the source; the colours are BFS rings and the right panel compares their distance profile with the profile of all pairs. The slider limits the search to a radius.`,
      deps: ['soc-2.1', 'algo-8.5'],
      refs: ['E&K §2.3'],
      tags: ['distance', 'bfs'],
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 380, weight: 1.3 });
        const p = v.stage({ x: [0, 8], y: [0, 0.6], axes: 'box', gutter: true, xlabel: 'distance $d$', ylabel: 'share', height: 380, weight: 1, xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
        const sel = v.select('Network', NETS, 'karate', { onChange: load });
        const rad = v.slider('Radius shown $r$', 0, 8, 8, { int: true });
        let net = getNet('karate'), src = 0, allD = null;
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 11, fontSize: 10.5, draggable: true });
        function load() {
          net = getNet(sel.value); src = net.g.n === 34 ? 0 : 0; allD = null;
          G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: net.g.n > 40 ? 5 : 11, autoRadius: false }).layout('fit');
        }
        G.onClick = ({ node }) => { if (node) src = node.id; return true; };
        const allPairs = () => {
          const g = net.g, cnt = new Array(g.n + 1).fill(0);
          for (let a = 0; a < g.n; a++) { const d = bfs(g, a); for (let b = a + 1; b < g.n; b++) if (d[b] > 0) cnt[d[b]]++; }
          const tot = cnt.reduce((x, y) => x + y, 0); return { cnt, tot, share: cnt.map((c) => c / tot), mean: cnt.reduce((x, c, d) => x + c * d, 0) / tot, diam: cnt.reduce((m, c, d) => (c ? d : m), 0) };
        };
        let stat = {};
        v.render(() => {
          const g = net.g; if (!allD) allD = allPairs();
          const d = bfs(g, src), R = rad.value;
          const cnt = new Array(10).fill(0); let reach = 0, ecc = 0, sum = 0;
          d.forEach((x, i) => { if (i !== src && x > 0) { cnt[Math.min(x, 9)]++; reach++; ecc = Math.max(ecc, x); sum += x; } });
          G.draw({
            nodeFill: (id) => (d[id] >= 0 && d[id] <= R ? RANK[Math.min(d[id], RANK.length - 1)] : null),
            nodeColor: (id) => (d[id] >= 0 && d[id] <= R ? RANK[Math.min(d[id], RANK.length - 1)] : 'faint'),
            nodeLabel: (id) => (g.n < 40 && net.labels && g.n !== 15 ? net.labels[id] : ''),
            nodeNote: (id) => (g.n === 15 ? net.labels[id] : (d[id] >= 0 && d[id] <= R && g.n < 40 ? null : null)),
            dim: g.adj.map((_, i) => i).filter((i) => d[i] < 0 || d[i] > R),
          });
          const top = Math.max(0.05, ...cnt.slice(1).map((c) => c / Math.max(1, reach)), ...allD.share.slice(1));
          p.setView([0, Math.max(6, allD.diam + 1)], [0, Math.ceil(top * 10 + 0.5) / 10]);
          p.bars(cnt.slice(1, 10).map((c) => c / Math.max(1, reach)), { x0: 1, dx: 1, color: 'accent' });
          p.path(allD.share.slice(1).map((x, i) => [i + 1, x]).filter((q, i) => i < allD.diam), { color: 'orange', width: 2 });
          p.dots(allD.share.slice(1).map((x, i) => [i + 1, x]).filter((q, i) => i < allD.diam), { color: 'orange', r: 4 });
          stat = { reach, ecc, mean: reach ? sum / reach : NaN, n: g.n };
        });
        v.legend([['accent', 'from the chosen person', { area: true }], ['orange', 'all pairs']]);
        v.readout(() => `From person ${net.labels[src]}: **${stat.reach}** of ${stat.n - 1} others reachable, eccentricity ${stat.ecc}, mean distance ${v.fix(stat.mean, 2)}\nWhole network: diameter **${allD ? allD.diam : ''}**, average path length **${allD ? v.fix(allD.mean, 2) : ''}**, over ${allD ? allD.tot : ''} pairs`);
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Degree and degree distribution',
      statement: String.raw`The **degree** of a node is its number of neighbours. The **degree distribution** $p_k$ is the fraction of nodes with degree exactly $k$; its mean is $\langle k\rangle = 2|E|/|V|$. The **complementary cumulative distribution** $P(K \ge k) = \sum_{j\ge k} p_j$ shows the tail.

In a random graph where each pair is joined independently with probability $p$, degrees are binomial, close to Poisson with mean $\langle k\rangle$ and variance $\approx\langle k\rangle$: a narrow peak with a thin tail. Many real networks instead have much larger variance and a **long tail**: a few hubs with degree far above the mean.`,
      idea: String.raw`The distribution is a one-number-per-node summary that ignores who is tied to whom, yet it controls much of what follows (how quickly things spread, how fragile the network is to losing hubs, the friendship paradox). Plotting on log axes turns a power-law-like tail into a roughly straight line and a Poisson tail into a sharp drop.`,
      caption: String.raw`Choose a network and compare its degree histogram with the Poisson distribution of the same mean (orange). Switch on the log–log view to see the tail as the complementary cumulative distribution.`,
      deps: ['soc-2.1'],
      refs: ['Newman ch. 10'],
      tags: ['degree', 'distribution'],
      viz(v) {
        const s = v.stage({ x: [0, 20], y: [0, 0.3], axes: 'box', gutter: true, xlabel: 'degree $k$', ylabel: '$p_k$', height: 380 });
        const sel = v.select('Network', [{ value: 'karate', label: 'Karate' }, { value: 'lesmis', label: 'Les Mis' }, { value: 'pref', label: 'Pref. attach.' }, { value: 'random', label: 'Random' }], 'lesmis');
        const lg = v.toggle('Log–log tail $P(K \\ge k)$', false);
        let st = {};
        const pois = (lam, k) => Math.exp(-lam + k * Math.log(lam) - v.M.lgamma(k + 1));
        v.render(() => {
          const net = getNet(sel.value), d = deg(net.g), n = net.g.n, mean = d.reduce((a, b) => a + b, 0) / n;
          const kmax = Math.max(...d), cnt = new Array(kmax + 2).fill(0); d.forEach((k) => cnt[k]++);
          const p = cnt.map((c) => c / n), ccdf = []; let acc = 0;
          for (let k = kmax; k >= 1; k--) { acc += p[k]; ccdf[k] = acc; }
          const variance = d.reduce((a, k) => a + (k - mean) ** 2, 0) / n;
          if (!lg.value) {
            s.setScale({ xlog: false, ylog: false, x: [0, kmax + 2], y: [0, Math.max(...p, 0.05) * 1.12] });
            s.setLabels('degree $k$', '$p_k$');
            s.bars(p.slice(0, kmax + 1), { x0: 0, dx: 1, color: 'accent' });
            const pts = []; for (let k = 0; k <= kmax; k++) pts.push([k, pois(mean, k)]);
            s.path(pts, { color: 'orange', width: 2 }); s.dots(pts, { color: 'orange', r: 3 });
          } else {
            s.setScale({ xlog: true, ylog: true, x: [1, Math.max(10, kmax * 1.3)], y: [Math.min(0.5 / n, 0.002), 1.3] });
            s.setLabels('degree $k$', '$P(K\\ge k)$');
            const pts = []; for (let k = 1; k <= kmax; k++) if (p[k] > 0) pts.push([k, ccdf[k]]);
            s.dots(pts, { color: 'accent', r: 4 });
            const th = []; for (let k = 1; k <= kmax * 1.2 + 4; k++) { let tail = 0; for (let j = k; j < k + 80; j++) tail += pois(mean, j); th.push([k, tail]); }
            s.path(th, { color: 'orange', width: 2 });
          }
          st = { n, mean, kmax, variance, m: net.g.edges.length, title: net.title };
        });
        v.legend([['accent', 'network'], ['orange', 'Poisson, same mean']]);
        v.readout(() => `${st.title}: $n = ${st.n}$, $|E| = ${st.m}$, $\\langle k\\rangle = ${v.fix(st.mean, 2)}$, maximum degree $${st.kmax}$ (${v.fix(st.kmax / st.mean, 1)} times the mean)\nVariance / mean $= ${v.fix(st.variance / st.mean, 2)}$ (about 1 for a Poisson distribution, much larger for a long tail)`);
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Paradox',
      name: 'The friendship paradox',
      statement: String.raw`In any graph with degrees $k_i$, a person picked at random has on average $\langle k\rangle$ friends, but the far endpoint of a **uniformly selected oriented edge** has on average
$$\frac{\langle k^2\rangle}{\langle k\rangle} \;=\; \langle k\rangle + \frac{\operatorname{Var}(k)}{\langle k\rangle} \;\ge\; \langle k\rangle,$$
with equality only if every degree is the same. So "your friends have more friends than you do" is true on average over friendship ends; the comparison for a uniformly sampled person is a different statistic.`,
      scope: String.raw`The identity is exact for any finite graph with at least one edge. What the paradox says about the typical person (as opposed to the average over edge ends) depends on the degree distribution: the share of people with fewer friends than their friends' average is usually well above one half in skewed networks, but is not guaranteed to exceed it.`,
      idea: String.raw`A person with degree $k$ appears at exactly $k$ edge ends, so the far end of a uniformly selected oriented edge has degree law $k p_k/\langle k\rangle$. The variance identity in prob-1.6.9a, $\operatorname{Var}(K)=E K^2-(EK)^2$, rewrites its mean $EK^2/EK$ as $EK+\operatorname{Var}(K)/EK$. Nonnegativity of variance proves the comparison; equality means all node degrees coincide. Sampling a node uniformly and then one of its neighbours is a different experiment and need not give this size-biased law.`,
      caption: String.raw`Each dot is a person: their own degree against the mean degree of their friends. Dots above the diagonal (green) are people whose friends are more popular than they are. Try the regular ring, where every degree is equal and the paradox vanishes.`,
      deps: ['soc-2.3', 'prob-1.6.9a'],
      refs: ['Newman ch. 12'],
      tags: ['paradox', 'degree'],
      credit: 'Feld, 1991 ("Why your friends have more friends than you do")',
      viz(v) {
        const s = v.stage({ x: [0, 20], y: [0, 20], axes: 'box', gutter: true, xlabel: 'own degree $k_i$', ylabel: 'mean degree of friends', height: 400, equal: false });
        const sel = v.select('Network', [{ value: 'karate', label: 'Karate' }, { value: 'lesmis', label: 'Les Mis' }, { value: 'pref', label: 'Pref. attach.' }, { value: 'random', label: 'Random' }, { value: 'ring', label: 'Regular ring' }], 'lesmis');
        let st = {};
        v.render(() => {
          const net = getNet(sel.value), g = net.g, d = deg(g);
          const nb = g.adj.map((a) => (a.length ? a.reduce((x, j) => x + d[j], 0) / a.length : NaN));
          const kmax = Math.max(...d, ...nb.filter((x) => isFinite(x))) * 1.05 + 1;
          s.setView([0, kmax], [0, kmax]);
          s.line(0, 0, kmax, kmax, { color: 'muted', dash: true });
          const hi = [], lo = [];
          let above = 0, nn = 0;
          g.adj.forEach((a, i) => { if (!a.length) return; nn++; const pt = [d[i] + (((i * 37) % 17) / 17 - 0.5) * 0.35, nb[i]]; if (nb[i] > d[i]) { above++; hi.push(pt); } else lo.push(pt); });
          s.dots(lo, { color: 'red', r: 3.5 }); s.dots(hi, { color: 'green', r: 3.5 });
          const mean = d.reduce((a, b) => a + b, 0) / g.n, k2 = d.reduce((a, b) => a + b * b, 0) / g.n;
          let endSum = 0; for (const [a, b] of g.edges) endSum += d[a] + d[b];
          st = { mean, k2, ratio: k2 / mean, edgeMean: endSum / (2 * g.edges.length), above, nn, title: net.title, var: k2 - mean * mean };
          s.hline(st.ratio, { color: 'orange', dash: [4, 3] }); s.vline(mean, { color: 'accent', dash: [4, 3] });
        });
        v.legend([['green', 'friends more popular', { dot: true }], ['red', 'friends no more popular', { dot: true }], ['accent', '$\\langle k\\rangle$', { dash: true }], ['orange', '$\\langle k^2\\rangle/\\langle k\\rangle$', { dash: true }]]);
        v.readout(() => `${st.title}\n$\\langle k\\rangle = ${v.fix(st.mean, 2)}$ · average degree of a random friend (over edge ends) $= ${v.fix(st.edgeMean, 3)}$ · $\\langle k\\rangle + \\operatorname{Var}/\\langle k\\rangle = ${v.fix(st.mean + st.var / st.mean, 3)}$\n**${st.above}** of ${st.nn} people (${v.fix(100 * st.above / st.nn, 0)}%) have friends who average more popular than they are`);
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Concept',
      name: 'Triadic closure and the clustering coefficient',
      statement: String.raw`**Triadic closure**: if two people $B$ and $C$ both have a tie to $A$, then a tie between $B$ and $C$ is more likely than between two random people. A path $B - A - C$ with $B, C$ not joined is an **open triad** (a connected triple centred on $A$); with the edge $BC$ present it is **closed**, a triangle.

The **clustering coefficient** of node $A$ is the fraction of pairs of $A$'s neighbours that are themselves joined, $C_A = \dfrac{\#\text{triangles at }A}{\binom{k_A}{2}}$; the **transitivity** of the graph is $C = \dfrac{3\,\#\text{triangles}}{\#\text{connected triples}}$. In a random graph with edge density $\rho$ one expects $C \approx \rho$, but real social networks have $C$ several times larger.`,
      idea: String.raw`Three forces make closing likely: $B$ and $C$ meet through $A$ (opportunity), they share a friend and so tend to trust one another (trust), and $A$ is uneasy when two friends are at odds (incentive). Transitivity counts how often open triads are in fact closed; the random-graph value $\rho$ is what you would get if edges ignored shared friends altogether.`,
      caption: String.raw`Left: click two nodes to add or remove an edge. Open triads at the selected node are drawn as dashed red missing sides; the buttons close them. Right: density against transitivity for real networks (blue) and random graphs of the same size (grey) lie far apart; your graph is the gold dot.`,
      deps: ['soc-2.1'],
      refs: ['E&K §3.1'],
      tags: ['clustering', 'triangles'],
      credit: 'Simmel, 1908; Rapoport, 1953',
      viz(v) {
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.05, 1.05], axes: false, equal: true, height: 380, weight: 1.1 });
        const p = v.stage({ x: [0, 1], y: [-0.03, 1], axes: 'box', gutter: true, xlabel: 'edge density $\\rho$', ylabel: 'transitivity $C$', height: 380, weight: 1 });
        const nodes = [['A', 0, 0.8], ['B', -0.85, 0.3], ['C', 0.85, 0.3], ['D', -0.55, -0.8], ['E', 0.55, -0.8], ['F', 0, -0.3]].map(([id, x, y]) => ({ id, x, y }));
        const G = v.graph(s, { nodes, edges: [['A', 'B'], ['A', 'C'], ['A', 'F'], ['B', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F'], ['B', 'F']], layout: 'none', r: 14, editable: { addNode: false, deleteNode: false, deleteEdge: true, addEdge: true, moveNode: true } });
        let focus = 'A';
        G.onClick = ({ node }) => { if (node) focus = node.id; return false; };
        const toG = () => { const ids = G.nodes.map((n) => n.id); return { g: mkGraph(ids.length, G.edges.map((e) => [ids.indexOf(e.from), ids.indexOf(e.to)])), ids }; };
        const open = (g, i) => { const out = []; const a = g.adj[i]; for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) if (!hasEdge(g, a[x], a[y])) out.push([a[x], a[y]]); return out; };
        const closeAt = (all) => {
          const { g, ids } = toG(); const f = ids.indexOf(focus); const list = all ? open(g, f) : (() => { const o = open(g, f); return o.length ? [o[0]] : []; })();
          for (const [a, b] of list) G.addEdge(ids[a], ids[b]);
        };
        v.button('Close one open triad at the selected node', () => closeAt(false));
        v.button('Close all of them', () => closeAt(true));
        v.button('Reset', () => { G.set({ nodes: nodes.map((n) => ({ ...n })), edges: [['A', 'B'], ['A', 'C'], ['A', 'F'], ['B', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F'], ['B', 'F']] }); focus = 'A'; });
        const refs = ['karate', 'lesmis', 'florence'].map((k) => {
          const g = getNet(k).g, R = rng32(9); let sum = 0; for (let t = 0; t < 40; t++) sum += triangleStats(gnm(g.n, g.edges.length, R)).transitivity;
          return { k, rho: g.edges.length / (g.n * (g.n - 1) / 2), C: triangleStats(g).transitivity, rnd: sum / 40 };
        });
        let st = {};
        v.render(() => {
          const { g, ids } = toG(); const f = ids.indexOf(focus);
          const tr = triangleStats(g);
          const op = f >= 0 ? open(g, f) : [];
          G.draw({
            nodeFill: (id) => (id === focus ? 'gold' : null),
            edgeColor: (e) => { const a = ids.indexOf(e.from), b = ids.indexOf(e.to); return f >= 0 && a !== f && b !== f && g.adj[f].includes(a) && g.adj[f].includes(b) ? 'green' : null; },
          });
          for (const [a, b] of op) { const A = G.node(ids[a]), B = G.node(ids[b]); s.line(A.x, A.y, B.x, B.y, { color: 'red', dash: [5, 4], width: 2 }); }
          const m = g.edges.length, rho = m / (g.n * (g.n - 1) / 2);
          p.line(0, 0, 1, 1, { color: 'muted', dash: true });
          for (const r of refs) { p.dot(r.rho, r.C, { color: 'accent', r: 6, label: r.k === 'lesmis' ? 'Les Mis' : r.k === 'karate' ? 'Karate' : 'Florence', labelPos: r.k === 'florence' ? 'se' : 'ne' }); p.dot(r.rho, r.rnd, { color: 'faint', r: 4, hollow: true }); p.line(r.rho, r.rnd, r.rho, r.C, { color: 'faint' }); }
          p.dot(rho, tr.transitivity, { color: 'gold', r: 7, label: 'yours', labelPos: 'nw' });
          st = { tr, rho, f, ops: op.length, kf: f >= 0 ? g.adj[f].length : 0, cf: f >= 0 && g.adj[f].length > 1 ? tr.tri[f] / tr.trip[f] : NaN };
        });
        v.legend([['accent', 'real network', { dot: true }], ['faint', 'random graph, same $n, m$', { dot: true }], ['gold', 'your graph', { dot: true }]]);
        v.readout(() => `Your graph: ${v.fix(st.tr.T, 0)} triangle(s), ${st.tr.P} connected triples → transitivity $C = ${v.fix(st.tr.transitivity, 3)}$ (edge density $\\rho = ${v.fix(st.rho, 3)}$)\nAt the selected node: degree ${st.kf}, **${st.ops}** open triad(s)${isFinite(st.cf) ? `, local clustering $C_A = ${v.fix(st.cf, 2)}$` : ''}`);
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Strong triadic closure makes local bridges weak',
      statement: String.raw`Label each tie of a network **strong** or **weak**. Say a node $A$ satisfies the **strong triadic closure property** if, whenever $A$ has strong ties to both $B$ and $C$, the people $B$ and $C$ are joined by some tie (strong or weak). A **local bridge** is an edge $AB$ whose endpoints have no common neighbour (deleting it would raise their distance above 2).

**Theorem.** If a node $A$ satisfies strong triadic closure and has strong ties to at least two people, then every local bridge at $A$ is weak. Equivalently: in a network where every node satisfies strong triadic closure, a strong tie can be a local bridge only when neither endpoint has another strong tie.`,
      idea: String.raw`Suppose the local bridge $AB$ were strong and $A$ had another strong tie $AC$. Strong triadic closure at $A$ would then force a tie between $B$ and $C$, so $C$ would be a common neighbour of $A$ and $B$, and $AB$ would not be a local bridge: a contradiction. The argument uses only the definition of local bridge and one application of the property.`,
      caption: String.raw`Click edges to switch them between strong (thick) and weak (thin dashed). Red dashed lines show the missing closing tie of each violated triad. Try to make a bridge between the two clusters strong without breaking the property: the counted labellings below show it cannot be done.`,
      deps: ['soc-2.5'],
      refs: ['E&K §3.2'],
      tags: ['bridges', 'weak ties'],
      credit: 'Easley & Kleinberg formalisation of Granovetter, 1973',
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.0, 1.0], axes: false, equal: true, height: 400 });
        const pts = { A: [-0.35, 0.1], B: [-0.9, 0.55], C: [-0.9, -0.4], D: [-1.2, 0.08], E: [0.35, 0.1], F: [0.9, 0.55], G: [0.9, -0.4], H: [1.2, 0.08], I: [-0.35, 0.8] };
        const ids = Object.keys(pts);
        const E0 = [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D'], ['C', 'D'], ['E', 'F'], ['E', 'G'], ['F', 'G'], ['F', 'H'], ['G', 'H'], ['A', 'E'], ['A', 'I']];
        const G = v.graph(s, { nodes: ids.map((id) => ({ id, x: pts[id][0], y: pts[id][1] })), edges: E0.map(([a, b]) => ({ from: a, to: b, strong: ['AB', 'AC', 'BC', 'EF', 'EG', 'FG'].includes(a + b) })), layout: 'none', r: 14 });
        const idx = (id) => ids.indexOf(id);
        const g = mkGraph(ids.length, E0.map(([a, b]) => [idx(a), idx(b)]));
        const bridge = E0.map(([a, b]) => !g.adj[idx(a)].some((x) => g.adj[idx(b)].includes(x)));
        const viol = (lab) => { const out = []; for (let a = 0; a < g.n; a++) { const st = []; E0.forEach(([x, y], k) => { if (lab[k]) { if (idx(x) === a) st.push(idx(y)); if (idx(y) === a) st.push(idx(x)); } }); for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) if (!g.adj[st[i]].includes(st[j])) out.push([a, st[i], st[j]]); } return out; };
        const strongDeg = (lab, a) => E0.reduce((c, [x, y], k) => c + (lab[k] && (idx(x) === a || idx(y) === a) ? 1 : 0), 0);
        // all 2^12 labellings: those with strong triadic closure everywhere, and among them any strong local bridge at a node with another strong tie
        let ok = 0, bad = 0;
        for (let mask = 0; mask < 1 << E0.length; mask++) {
          const lab = E0.map((_, k) => (mask >> k) & 1);
          if (viol(lab).length) continue; ok++;
          E0.forEach(([x, y], k) => { if (lab[k] && bridge[k] && (strongDeg(lab, idx(x)) >= 2 || strongDeg(lab, idx(y)) >= 2)) bad++; });
        }
        const lab = () => G.edges.map((e) => !!e.strong);
        G.onClick = ({ edge }) => { if (edge) edge.strong = !edge.strong; return true; };
        v.button('All weak', () => G.edges.forEach((e) => { e.strong = false; }));
        v.button('All strong', () => G.edges.forEach((e) => { e.strong = true; }));
        v.button('Repair: weaken offenders', () => {
          for (let it = 0; it < 30; it++) {
            const l = lab(), V = viol(l); if (!V.length) break;
            const [a, b, c] = V[0]; const pick = (x) => G.edges.findIndex((e) => e.strong && ((idx(e.from) === a && idx(e.to) === x) || (idx(e.to) === a && idx(e.from) === x)));
            const kb = pick(b), kc = pick(c); const k = bridge[kb] ? kb : bridge[kc] ? kc : kb; G.edges[k].strong = false;
          }
        });
        let st = {};
        v.render(() => {
          const l = lab(), V = viol(l), bad_ = new Set(V.map((x) => x[0]));
          G.draw({
            edgeColor: (e) => (e.strong ? 'accent' : 'muted'),
            edgeWidth: (e) => (e.strong ? 5 : 1.6),
            edgeDash: (e) => (e.strong ? null : [5, 4]),
            edgeLabel: (e) => { const k = G.edges.indexOf(e); return bridge[k] ? 'bridge' : null; },
            edgeLabelColor: (e) => 'orange',
            nodeRing: (id) => { const a = idx(id); return strongDeg(l, a) >= 2 ? (bad_.has(a) ? 'red' : 'green') : null; },
          });
          for (const [a, b, c] of V) s.line(pts[ids[b]][0], pts[ids[b]][1], pts[ids[c]][0], pts[ids[c]][1], { color: 'red', dash: [5, 4], width: 2.5 });
          const strongBridges = E0.map((_, k) => k).filter((k) => l[k] && bridge[k]);
          const strongBridgeAtMulti = strongBridges.filter((k) => strongDeg(l, idx(E0[k][0])) >= 2 || strongDeg(l, idx(E0[k][1])) >= 2);
          st = { V, strongBridges, strongBridgeAtMulti, ns: l.filter(Boolean).length };
        });
        v.legend([['accent', 'strong tie'], ['muted', 'weak tie', { dash: true }], ['orange', 'local bridge'], ['red', 'missing closing tie', { dash: true }]]);
        v.readout(() => `${st.ns} strong ties · **${st.V.length}** violated triad${st.V.length === 1 ? '' : 's'} ${st.V.length ? '(strong triadic closure fails)' : '(strong triadic closure holds everywhere)'}\nStrong local bridges at a node with another strong tie: **${st.strongBridgeAtMulti.length}**${st.V.length ? ' (only possible because the property is violated)' : ' — as the theorem says'}\nAll $2^{12} = 4096$ labellings checked: **${ok}** satisfy strong triadic closure, and among them **${bad}** contain a strong local bridge at a node with another strong tie`);
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'The strength of weak ties (Granovetter)',
      statement: String.raw`In a social network made of tightly knit groups, the acquaintances you see rarely tend to provide **new** information (job leads, news, ideas) more often than the close friends you see often. Close friends move in the same circles and already know what you know; weak ties are the ones that reach into other circles, and they are often the only routes between circles.

Granovetter's job-mobility survey found that people who got their jobs through a contact usually saw that contact only occasionally or rarely. Large-scale network data on mobile-phone calls fit the structural half of the claim: removing the weak ties disconnects the network far sooner than removing the strong ones.`,
      scope: String.raw`An empirical regularity about information that is not already common knowledge, in networks where strong ties are mostly within groups. It says nothing about emotional support or influence, where strong ties matter more, and the later experimental literature finds that the most useful ties for job leads are moderately, not extremely, weak.`,
      idea: String.raw`By strong triadic closure (2.6), a strong tie tends to sit inside a cluster of mutual friends, so what one end knows the other end's friends probably know as well. Bridges between clusters are weak ties, so information that has to cross from one cluster to another must travel over them. The model here makes both effects visible: strong ties are only inside groups, weak ties are the few links between groups.`,
      caption: String.raw`Six groups of eight, strong ties inside, a few weak ties between. In **Spread** mode, an item of news starts at one person and passes along each tie with a probability that is lower for weak ties; the right panel averages 120 runs. In **Delete ties** mode remove ties weak-first, strong-first or at random, and watch the largest connected piece.`,
      deps: ['soc-2.6'],
      refs: ['E&K §3.2', 'E&K §3.3'],
      tags: ['weak ties', 'information'],
      credit: 'Granovetter, 1973; Onnela et al., 2007 (phone-call network)',
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.1, 1.1], axes: false, equal: true, height: 400, weight: 1.15 });
        const p = v.stage({ x: [0, 25], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time step', ylabel: 'share informed', height: 400, weight: 1 });
        const mode = v.select('Mode', [{ value: 'spread', label: 'Spread' }, { value: 'delete', label: 'Delete ties' }], 'spread');
        const W = v.slider('Weak ties between groups', 0, 30, 10, { int: true });
        const ratio = v.slider('Weak-tie contact rate relative to strong', 0, 1, 0.3, { step: 0.05 });
        const T = v.slider('Time step $t$', 0, 25, 6, { int: true });
        const order = v.select('Delete first', [{ value: 'weak', label: 'weak ties' }, { value: 'strong', label: 'strong ties' }, { value: 'random', label: 'random' }], 'weak');
        const frac = v.slider('Fraction of ties deleted', 0, 1, 0.3, { step: 0.02 });
        const K = 6, M = 8, QS = 0.4;
        const nodePos = [], comm = [];
        for (let c = 0; c < K; c++) for (let i = 0; i < M; i++) {
          const a = Math.PI / 2 - 2 * Math.PI * c / K, ca = [0.78 * Math.cos(a), 0.78 * Math.sin(a)], b = 2 * Math.PI * i / M + a;
          nodePos.push([ca[0] + 0.3 * Math.cos(b), ca[1] + 0.3 * Math.sin(b)]); comm.push(c);
        }
        let key = null, net = null;
        function build(w) {
          const R = rng32(41), E = [];
          for (let c = 0; c < K; c++) {
            for (let i = 0; i < M; i++) E.push([c * M + i, c * M + (i + 1) % M, 1]);
            for (let i = 0; i < M; i++) for (let j = i + 2; j < M; j++) if (!(i === 0 && j === M - 1) && R() < 0.45) E.push([c * M + i, c * M + j, 1]);
          }
          const seen = new Set(); let tries = 0, added = 0;
          while (added < w && tries++ < 5000) {
            const a = Math.floor(R() * K * M), b = Math.floor(R() * K * M);
            if (comm[a] === comm[b]) continue; const k = Math.min(a, b) * 99 + Math.max(a, b); if (seen.has(k)) continue; seen.add(k); E.push([a, b, 0]); added++;
          }
          const g = mkGraph(K * M, E.map(([a, b]) => [a, b]));
          return { g, E, weakIdx: E.map((e, k) => k).filter((k) => !E[k][2]), strongIdx: E.map((e, k) => k).filter((k) => E[k][2]) };
        }
        // one SI run with per-tie transmission probability; returns {at[], via[]}
        function run(net, qw, seed, tMax) {
          const R = rng32(seed), at = new Array(net.g.n).fill(-1), viaWeak = new Array(net.g.n).fill(false); at[0] = 0;
          for (let t = 1; t <= tMax; t++) for (let k = 0; k < net.E.length; k++) {
            const [a, b, st] = net.E[k]; const q = st ? QS : qw; const r1 = R();
            let src = -1, dst = -1;
            if (at[a] >= 0 && at[a] < t && at[b] < 0) { src = a; dst = b; } else if (at[b] >= 0 && at[b] < t && at[a] < 0) { src = b; dst = a; }
            if (src >= 0 && r1 < q) { at[dst] = t; viaWeak[dst] = !st; }
          }
          return { at, viaWeak };
        }
        const curves = {};
        function ensure() {
          const k = `${W.value}|${ratio.value}`;
          if (k === key) return; key = k; net = build(W.value);
          const mk = (qw) => { const c = new Array(26).fill(0); let wk = 0, tot = 0; for (let r = 0; r < 120; r++) { const o = run(net, qw, 1000 + r, 25); for (let i = 1; i < o.at.length; i++) if (o.at[i] >= 0) { for (let t = o.at[i]; t <= 25; t++) c[t]++; tot++; if (o.viaWeak[i]) wk++; } c[0] += 1; } return { c: c.map((x) => x / (120 * K * M)), wk, tot }; };
          curves.as = mk(ratio.value * QS); curves.full = mk(QS); curves.none = mk(0);
          curves.one = run(net, ratio.value * QS, 1000, 25);
          // deletion curves
          const nE = net.E.length, grid = Array.from({ length: 41 }, (_, i) => i / 40);
          const giant = (removedSet) => { const comps = components(net.g, null, null); return 0; };
          const gc = (ord) => grid.map((f) => { const del = new Set(ord.slice(0, Math.round(f * nE))); const E2 = net.E.filter((_, k) => !del.has(k)); return components(mkGraph(net.g.n, E2.map(([a, b]) => [a, b])))[0].length / net.g.n; });
          const R = rng32(5), sh = (a) => shuffle(a.slice(), R);
          const avg = (mkOrd) => { const acc = new Array(41).fill(0); for (let r = 0; r < 20; r++) gc(mkOrd()).forEach((x, i) => { acc[i] += x / 20; }); return acc; };
          curves.del = { weak: avg(() => [...sh(net.weakIdx), ...sh(net.strongIdx)]), strong: avg(() => [...sh(net.strongIdx), ...sh(net.weakIdx)]), random: avg(() => sh(net.E.map((_, k) => k))), grid };
          curves.delOrd = [sh(net.weakIdx), sh(net.strongIdx), sh(net.E.map((_, k) => k))];
        }
        let st = {};
        v.render(() => {
          ensure();
          const spread = mode.value === 'spread';
          T.el.hidden = !spread; ratio.el.hidden = !spread; order.el.hidden = spread; frac.el.hidden = spread;
          let delSet = new Set();
          if (!spread) {
            const nE = net.E.length, n = Math.round(frac.value * nE), w = net.weakIdx, sg = net.strongIdx;
            const rnd = (a) => { const R = rng32(77); return shuffle(a.slice(), R); };
            const ord = order.value === 'weak' ? [...rnd(w), ...rnd(sg)] : order.value === 'strong' ? [...rnd(sg), ...rnd(w)] : rnd(net.E.map((_, k) => k));
            delSet = new Set(ord.slice(0, n));
          }
          const comps = !spread ? components(mkGraph(net.g.n, net.E.filter((_, k) => !delSet.has(k)).map(([a, b]) => [a, b]))) : null;
          const cid = new Array(net.g.n).fill(0); if (comps) comps.forEach((c, k) => c.forEach((i) => { cid[i] = k; }));
          const one = curves.one;
          net.E.forEach(([a, b, strong], k) => {
            const dead = delSet.has(k);
            const informed = spread && one.at[a] >= 0 && one.at[b] >= 0 && one.at[a] <= T.value && one.at[b] <= T.value;
            s.line(nodePos[a][0], nodePos[a][1], nodePos[b][0], nodePos[b][1], { color: dead ? 'faint' : strong ? (informed ? 'gold' : 'accent') : informed ? 'gold' : 'orange', width: strong ? 2.2 : 2.6, alpha: dead ? 0.25 : strong ? 0.85 : 1, dash: dead ? [3, 4] : strong ? undefined : [6, 4] });
          });
          for (let i = 0; i < net.g.n; i++) {
            const inf = spread && one.at[i] >= 0 && one.at[i] <= T.value;
            const col = spread ? (inf ? 'gold' : 'faint') : CYC[cid[i] % CYC.length];
            s.dot(nodePos[i][0], nodePos[i][1], { color: col, r: i === 0 ? 8 : 5.5, hollow: spread && !inf });
          }
          s.dot(nodePos[0][0], nodePos[0][1], { color: 'red', r: 3, label: spread ? 'source' : '', labelPos: 'n' });
          if (spread) {
            p.setScale({ x: [0, 25], y: [0, 1] }); p.setLabels('time step', 'share informed');
            const line = (c, col, w) => p.path(c.map((y, t) => [t, y]), { color: col, width: w });
            line(curves.none.c, 'red', 2); line(curves.full.c, 'green', 2); line(curves.as.c, 'accent', 3);
            p.vline(T.value, { color: 'gold', dash: [4, 3] });
          } else {
            p.setScale({ x: [0, 1], y: [0, 1] }); p.setLabels('fraction of ties deleted', 'largest piece / all');
            const d = curves.del; const line = (c, col, w) => p.path(c.map((y, i) => [d.grid[i], y]), { color: col, width: w });
            line(d.random, 'muted', 2); line(d.strong, 'green', 2.4); line(d.weak, 'red', 2.4);
            p.vline(frac.value, { color: 'gold', dash: [4, 3] });
          }
          const inf = one.at.filter((x) => x >= 0 && x <= T.value).length;
          st = { spread, inf, gsize: comps ? comps[0].length : 0, ncomp: comps ? comps.length : 0, nDel: delSet.size, nE: net.E.length, weakN: net.weakIdx.length };
        });
        v.legend([['accent', 'strong tie (inside a group)'], ['orange', 'weak tie (between groups)', { dash: true }], ['gold', 'informed']]);
        v.readout(() => {
          if (st.spread) return `${st.inf} of 48 informed at $t = ${T.value}$ in the drawn run · averages over 120 runs: weak ties at the chosen rate (blue) vs no weak ties at all (red, confined to the starting group) vs weak ties as active as strong ones (green)\nShare of people first informed over a weak tie: **${v.fix(100 * curves.as.wk / Math.max(1, curves.as.tot), 0)}%** although weak ties are only ${v.fix(100 * st.weakN / st.nE, 0)}% of all ties`;
          return `${st.nDel} of ${st.nE} ties deleted (${order.value === 'weak' ? 'weak first' : order.value === 'strong' ? 'strong first' : 'at random'}): largest connected piece has **${st.gsize}** of 48 people, ${st.ncomp} pieces\nCurves: deleting weak ties first (red) isolates the groups with only ${st.weakN} deletions; deleting strong ones (green) barely matters`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Concept',
      name: 'Structural holes and betweenness',
      statement: String.raw`A **structural hole** is a gap between two groups that have no direct ties to one another; a person who spans the gap is a **broker**. Two measures capture brokerage.

**Betweenness** of a node $v$ is $b(v) = \sum_{s \ne v \ne t} \sigma_{st}(v)/\sigma_{st}$, the (pair-counted) share of shortest paths between other pairs that pass through $v$ (here $\sigma_{st}$ is the number of shortest $s$–$t$ paths and $\sigma_{st}(v)$ those through $v$). **Burt's constraint** $c_i = \sum_{j}\bigl(p_{ij} + \sum_{q} p_{iq}p_{qj}\bigr)^2$, where $p_{ij}$ is the share of $i$'s effort given to $j$, is small when one's contacts are not tied to one another, that is, when one spans many holes.`,
      idea: String.raw`If two clusters connect only through $v$, every shortest path between them passes through $v$, so $b(v)$ is large and removing $v$ disconnects the clusters. Constraint measures the same position from the inside: a person whose contacts all know each other is constrained, while one with unconnected contacts controls the flow between them. Brandes' algorithm computes all betweenness values with one breadth-first search per node, and gives exactly the sums above.`,
      caption: String.raw`Node size shows the chosen measure (large = more betweenness, or lower constraint = more brokerage). Click a person to remove or restore them and see which pieces fall apart. In the karate club, the instructor and the president are the brokers.`,
      deps: ['soc-2.7'],
      refs: ['E&K §3.5', 'E&K §3.6'],
      tags: ['brokerage', 'centrality'],
      credit: 'Freeman (betweenness), 1977; Burt (structural holes), 1992',
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 410 });
        const sel = v.select('Network', [{ value: 'brokers', label: 'Two groups + broker' }, { value: 'karate', label: 'Karate club' }], 'brokers', { onChange: load });
        const meas = v.select('Size by', [{ value: 'b', label: 'Betweenness' }, { value: 'c', label: 'Burt constraint (low = broker)' }], 'b');
        const bro = (() => {
          const E = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { E.push([i, j]); E.push([6 + i, 6 + j]); }
          E.push([12, 0], [12, 6]);
          const pos = []; for (let i = 0; i < 6; i++) pos.push([-0.95 + 0.45 * Math.cos(2 * Math.PI * i / 6 + 0.5), 0.45 * Math.sin(2 * Math.PI * i / 6 + 0.5)]);
          for (let i = 0; i < 6; i++) pos.push([0.95 + 0.45 * Math.cos(2 * Math.PI * i / 6 + Math.PI + 0.5), 0.45 * Math.sin(2 * Math.PI * i / 6 + Math.PI + 0.5)]);
          pos.push([0, 0]);
          // put the attachment points on the facing sides
          pos[0] = [-0.5, 0.0]; pos[6] = [0.5, 0.0];
          return { g: mkGraph(13, E), pos, labels: Array.from({ length: 13 }, (_, i) => (i === 12 ? 'B' : '')), title: 'Two cliques of six joined only through a broker B' };
        })();
        let net = bro, removed = new Set();
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 12, autoRadius: false });
        function load() { net = sel.value === 'karate' ? getNet('karate') : bro; removed = new Set(); G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: 12, autoRadius: false }).layout('fit'); }
        G.onClick = ({ node }) => { if (node) { if (removed.has(node.id)) removed.delete(node.id); else removed.add(node.id); } return true; };
        v.button('Restore everyone', () => { removed = new Set(); });
        let st = {};
        v.render(() => {
          const g = net.g, b = betweenness(g, removed), c = burtConstraint(g);
          const live = [...Array(g.n).keys()].filter((i) => !removed.has(i));
          const bm = Math.max(1e-9, ...live.map((i) => b[i])), cmin = Math.min(...live.map((i) => c[i]).filter(isFinite)), cmax = Math.max(...live.map((i) => c[i]).filter(isFinite));
          const rad = (i) => (meas.value === 'b' ? 5 + 17 * Math.sqrt(b[i] / bm) : 5 + 17 * Math.sqrt(Math.max(0, (cmax - c[i]) / Math.max(1e-9, cmax - cmin))));
          G.nodes.forEach((n) => { n.r = rad(n.id); });
          const top = live.reduce((a, i) => (b[i] > b[a] ? i : a), live[0]);
          const comps = components(g, removed);
          const cid = new Array(g.n).fill(-1); comps.forEach((cc, k) => cc.forEach((i) => { cid[i] = k; }));
          G.draw({
            nodeColor: (id) => (removed.has(id) ? 'faint' : CYC[cid[id] % CYC.length]),
            nodeFill: (id) => (id === top ? 'gold' : null),
            nodeLabel: (id) => (net.g.n < 20 ? net.labels[id] : ''),
            dim: [...removed],
          });
          st = { b, c, top, comps, topList: [...live].sort((x, y) => b[y] - b[x]).slice(0, 3), n: g.n };
        });
        v.legend([['gold', 'highest betweenness', { dot: true }], ['accent', 'largest piece', { dot: true }], ['orange', 'other pieces', { dot: true }]]);
        v.readout(() => `${net.title}\nBetweenness ranking: ${st.topList.map((i) => `${net.labels[i] || i + 1} (${v.fix(st.b[i], 1)})`).join(' > ')} · Burt constraint of the top person: ${v.fix(st.c[st.top], 3)} (median ${v.fix(v.M.median(st.c.filter(isFinite)), 3)})\nPieces after removals: **${st.comps.length}** (sizes ${st.comps.map((c) => c.length).join(', ')})`);
      },
    },
  ],
};
