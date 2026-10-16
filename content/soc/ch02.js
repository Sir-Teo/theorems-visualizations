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
      statement: String.raw`In any graph with degrees $k_i$, a person picked at random has on average $\langle k\rangle$ friends, but a **friend of a random person** (the far end of a randomly chosen edge end) has on average
$$\frac{\langle k^2\rangle}{\langle k\rangle} \;=\; \langle k\rangle + \frac{\operatorname{Var}(k)}{\langle k\rangle} \;\ge\; \langle k\rangle,$$
with equality only if every degree is the same. So "your friends have more friends than you do" is true on average over friendship ends, even though about half of everyone is more popular than their own friends.`,
      scope: String.raw`The identity is exact for any finite graph with at least one edge. What the paradox says about the typical person (as opposed to the average over edge ends) depends on the degree distribution: the share of people with fewer friends than their friends' average is usually well above one half in skewed networks, but is not guaranteed to exceed it.`,
      idea: String.raw`A person with $k$ friends appears as someone's friend exactly $k$ times, so sampling a friend means sampling people with probability proportional to their degree. Weighting by degree raises the mean from $\sum_k k p_k$ to $\sum_k k\cdot kp_k/\langle k\rangle$, and the excess is the variance divided by the mean. Popular people are over-represented among everyone's friends.`,
      caption: String.raw`Each dot is a person: their own degree against the mean degree of their friends. Dots above the diagonal (green) are people whose friends are more popular than they are. Try the regular ring, where every degree is equal and the paradox vanishes.`,
      deps: ['soc-2.3'],
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
  ],
};
