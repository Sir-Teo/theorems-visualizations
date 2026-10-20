// Networks & Collective Behavior — Chapter 3: Centrality, influence and power
//
// Data: Zachary's karate club, the Florentine marriage network (networkx 3.7 copies, see ch02.shared.js) and the
// 10-node "kite" edge list of networkx's krackhardt_kite_graph. Directed web pages (3.3) and the societies of 3.5 are
// models, not data. Exchange fixtures (3.7) evaluate specified payoffs and outside options, not laboratory data.
import {
  getNet, nodeSpec, RANK, CYC, betweenness, deg, kite, letter, layoutOf, normLayout,
  centralities, leadingEigen, secondRatio, eigStep, katz, pearson,
  hitsHistory, pageRank,
  trustRows, degrootStep, influence, society,
  modularity, greedyHistory, bestLouvain, bestBisection,
  rng32, shuffle,
} from './ch03.shared.js';
import {exchangeFixture,EXCHANGE_CHOICES} from './source-audit-exchange.js';

// ---------- small shared pieces ----------
const NETS3 = [{ value: 'karate', label: 'Karate club' }, { value: 'florence', label: 'Florence' }, { value: 'kite', label: 'Kite (10 nodes)' }];
const netCache = {};
function net3(name) {
  if (netCache[name]) return netCache[name];
  if (name === 'kite') {
    const g = kite(); const pos = normLayout(layoutOf(g, 400, 4));
    return (netCache[name] = { g, pos, labels: Array.from({ length: g.n }, (_, i) => letter(i)), title: 'Kite graph: 10 people (edge list of networkx’s krackhardt_kite_graph)', real: false });
  }
  return (netCache[name] = getNet(name));
}
/** Indices with the maximum value (ties within 1e-9). */
function argmaxAll(a) { const m = Math.max(...a); return a.map((x, i) => (x > m - 1e-9 ? i : -1)).filter((i) => i >= 0); }
const nodeName = (net, i) => (net.g.n === 15 ? net.labels[i] : net.g.n === 10 ? net.labels[i] : String(i + 1));
/** Nearest simple fraction p/q (q ≤ 12) if within 1e-6, else a 3-decimal number. */
function frac(x) {
  for (let q = 1; q <= 12; q++) { const p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-6) { if (p === 0) return '0'; if (q === 1) return String(p); const gg = (a, b) => (b ? gg(b, a % b) : a); const d = gg(p, q); return `${p / d}/${q / d}`; } }
  return x.toFixed(3);
}

export default {
  collection: 'soc',
  chapter: 3,
  title: 'Centrality, influence and power',
  summary: String.raw`Who matters in a network depends on what “matters” means: having many ties, being close to everyone, sitting on many shortest paths, or being connected to other important people. Eigenvector-type scores also describe how opinions settle when people repeatedly average their neighbours’ views, and they decide whether a large crowd stays wise. In exchange networks, power comes from position: from having alternatives your partners lack.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Degree, closeness and betweenness centrality',
      statement: String.raw`Let $G$ be a finite simple connected undirected graph on $n\ge3$ nodes, $k_i$ the degree of node $i$, $d(i,j)$ the shortest-path distance, and $\sigma_{st}$ the number of shortest paths from $s$ to $t$ ($\sigma_{st}(i)$ of them through $i$). Three classical centralities, each scaled to lie in $[0,1]$:

(a) **Degree:** $C_D(i) = \dfrac{k_i}{n-1}$, the share of the other people $i$ is directly tied to.

(b) **Closeness:** $C_C(i) = \dfrac{n-1}{\sum_{j\ne i} d(i,j)}$, the inverse of the average distance to everyone else.

(c) **Betweenness:** $C_B(i) = \dfrac{1}{\binom{n-1}{2}} \sum_{s<t,\; s,t\ne i} \dfrac{\sigma_{st}(i)}{\sigma_{st}}$, the mean fraction of shortest paths through $i$, giving each unordered pair of other vertices equal weight.

The measures need not agree: the most connected person, the person nearest to everyone, and the person on the largest mean fraction of shortest paths can be three different people.`,
      idea: String.raw`The three formulas formalise three different ideas of being central: being *active* (many direct contacts), being *independent* of intermediaries (few steps to everyone), and *controlling flow* (many shortest paths pass through you). They separate because they respond to different parts of the structure: a node inside a dense cluster has many ties but few shortest paths run through it, while a node whose only job is to link two clusters has few ties but lies on every shortest path between them. A breadth-first search from each node supplies distances and shortest-path counts (2.2); a backwards accumulation then computes betweenness from those counts.`,
      caption: String.raw`Switch the measure: node size shows the relative score and every tied top node is gold; the bars list the eight highest scores. On the kite graph the top node changes from the most connected person (D) to the best-placed one (F, G) to the bridge (H) as you change the measure. Florence vertices use numeric labels; the ranking lists their family names. The fixed drawing leaves edges unchanged when the measure changes.`,
      scope: String.raw`The displayed formulas concern connected unweighted undirected graphs with at least three vertices. All three offered graphs are connected. These structural scores do not establish observed influence, actual routing or causal power. The kite, karate-club and Florentine-marriage edge lists are the NetworkX 3.7 bundled examples; the kite is labelled A–J here. Its name follows that package, without a separate claim to authenticate the graph against Krackhardt's original paper. Graph positions are a drawing choice and do not affect scores.`,
      deps: ['soc-2.2'],
      refs: ['Freeman, Centrality in Social Networks: Conceptual Clarification (1978/79), pp.220–226','NetworkX 3.7 source: krackhardt_kite_graph, karate_club_graph, florentine_families_graph'],
      tags: ['centrality', 'networks'],
      credit: 'Three centrality definitions compared by Linton C. Freeman, 1978/79; NetworkX 3.7 example graphs.',
      links: { source:'https://www.cin.ufpe.br/~rbcp/taia/Freeman1979-centrality.pdf',graph:'https://networkx.org/documentation/stable/reference/generated/networkx.generators.small.krackhardt_kite_graph.html' },
      verify: false,
      viz(v) {
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.15, 1.15], axes: false, equal: true, height: 400 });
        const sb = v.stage({ x: [-0.5, 3.2], y: [-0.2, 8.2], axes: false, height: 400, weight: 0.8, minWidth: 240, title: 'Eight highest scores' });
        const sel = v.select('Network', [{ value: 'kite', label: 'Kite (10 nodes)' }, { value: 'karate', label: 'Karate club' }, { value: 'florence', label: 'Florence' }], 'kite', { onChange: load });
        const meas = v.select('Node size shows', [{ value: 'degree', label: 'Degree' }, { value: 'closeness', label: 'Closeness' }, { value: 'betweenness', label: 'Betweenness' }], 'degree');
        let net = net3('kite'), cache = {};
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 24, autoRadius: false, draggable: false });
        function load() { net = net3(sel.value); G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: 24, autoRadius: false }).layout('fit'); }
        const get = () => (cache[sel.value] ??= centralities(net.g, betweenness(net.g)));
        let st = {};
        v.render(() => {
          const c = get(), arr = c[meas.value], mx = Math.max(...arr), top = argmaxAll(arr);
          G.nodes.forEach((nd) => { nd.r = 8 + 15 * Math.sqrt(arr[nd.id] / mx); });
          G.draw({
            nodeColor: () => 'accent', nodeFill: (id) => (top.includes(id) ? 'gold' : null),
            nodeLabel: (id) => net.g.n === 15 ? String(id+1) : net.labels[id],
          });
          const order = [...arr.keys()].sort((a, b) => arr[b] - arr[a]).slice(0, 8);
          order.forEach((i, r) => {
            const y = 7.5 - r, w = arr[i] / mx * 1.0;
            sb.rect(1.4, y - 0.32, 1.4 + w, y + 0.32, { fill: top.includes(i) ? 'gold' : 'accent', fillAlpha: 0.7, color: top.includes(i) ? 'gold' : 'accent' });
            sb.text(net.g.n===15?`${i+1} ${nodeName(net,i)}`:nodeName(net,i), 1.32, y, { align: 'right', baseline: 'middle', size: 11, color: 'ink' });
            sb.text(v.fix(arr[i], 2), 1.44 + w, y, { align: 'left', baseline: 'middle', size: 11.5, color: 'muted' });
          });
          st = { c, tops: ['degree', 'closeness', 'betweenness'].map((k) => argmaxAll(c[k])) };
        });
        v.legend([['gold', 'highest under the chosen measure', { dot: true }]]);
        v.readout(() => {
          const nm = (idx) => idx.map((i) => nodeName(net, i)).join(', ');
          const same = st.tops.every((t) => t.join() === st.tops[0].join());
          return `Top node by degree: **${nm(st.tops[0])}** (${v.fix(st.c.degree[st.tops[0][0]], 2)}) · by closeness: **${nm(st.tops[1])}** (${v.fix(st.c.closeness[st.tops[1][0]], 2)}) · by betweenness: **${nm(st.tops[2])}** (${v.fix(st.c.betweenness[st.tops[2][0]], 2)})\n${same ? 'On this network all three measures crown the same node.' : 'The three measures disagree about who is most central.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Eigenvector and Katz centrality',
      statement: String.raw`Let $A$ be the adjacency matrix of a connected undirected graph and $\lambda_1$ its largest eigenvalue.

**Eigenvector centrality** is the vector $x$ with $Ax = \lambda_1 x$, normalised to be positive and (say) sum to one. Equivalently, $x_i = \lambda_1^{-1}\sum_j A_{ij}x_j$: your score is proportional to the sum of your neighbours' scores. By the Perron–Frobenius theorem, for a connected graph it exists, is unique up to scale, and has all entries positive.

**Katz centrality** with attenuation $0 < \alpha < 1/\lambda_1$ is $x = (I - \alpha A)^{-1}\mathbf 1 = \sum_{k\ge 0}\alpha^k A^k \mathbf 1$: node $i$ scores one point for every walk that ends at it, a walk of length $k$ counting $\alpha^k$.`,
      idea: String.raw`Repeating "replace each score by the sum of the neighbours' scores" multiplies by $A$ each time, so $A^t x_0$ is dominated by the eigenvector of the largest eigenvalue (see the definition of eigenvalue) and the direction converges at the rate $|\lambda_2/\lambda_1|^t$ for any positive start. Katz' series $\sum_k \alpha^k A^k\mathbf 1$ is a geometric series in the matrix $\alpha A$ and converges exactly when $\alpha\lambda_1<1$. For small $\alpha$ the first two terms give $x\approx \mathbf 1 + \alpha\,(k_i)_i$, so the ranking is by degree; as $\alpha\to 1/\lambda_1$ the $k$-th term is dominated by $\lambda_1^k$ and the ranking becomes that of eigenvector centrality. Katz therefore interpolates between the two.`,
      caption: String.raw`Slide the number of rounds: every node's score is replaced by the sum over its neighbours, then rescaled. Watch the shares settle on the true eigenvector (the dots at the right edge). Switch to Katz and move the attenuation: small values rank people by degree, values near the limit by eigenvector centrality.`,
      scope: String.raw`Eigenvector centrality is only well defined for connected (strongly connected, if directed) networks; in a directed graph with a source node it gives zero to everyone who cannot be reached, which is one motivation for Katz. Katz needs $\alpha<1/\lambda_1$.`,
      deps: ['soc-3.1', 'ladr-5.5'],
      refs: ['Newman ch. 7'],
      tags: ['centrality', 'eigenvectors'],
      credit: 'Katz, 1953 (status index); Bonacich, 1972 (eigenvector centrality)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Eigenvector_centrality' },
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 400 });
        const sp = v.stage({ x: [0, 40], y: [0, 0.1], axes: 'box', gutter: true, xlabel: 'round t', ylabel: 'share of total score', height: 400 });
        const sel = v.select('Network', NETS3, 'karate', { onChange: load });
        const mode = v.select('Score', [{ value: 'eig', label: 'Eigenvector (power iteration)' }, { value: 'katz', label: 'Katz' }], 'eig', { onChange: () => { aS.el.hidden = mode.value !== 'katz'; } });
        const tS = v.slider('rounds $t$', 0, 40, 3, { int: true });
        const aS = v.slider('attenuation $\\alpha\\lambda_1$', 0.02, 0.97, 0.5, { step: 0.01 });
        aS.el.hidden = true;
        let net = net3('karate'), lead = null;
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 11, autoRadius: false });
        function load() { net = net3(sel.value); lead = null; G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: 11, autoRadius: false }).layout('fit'); }
        let st = {};
        v.render(() => {
          const g = net.g, n = g.n; lead ||= { ...leadingEigen(g) }; if (lead.rho == null) lead.rho = secondRatio(g, lead);
          const T = 40, tr = []; let x;
          const norm1 = (z) => { const t = z.reduce((a, b) => a + b, 0); return z.map((q) => q / t); };
          let limit, alpha = aS.value / lead.lambda;
          if (mode.value === 'eig') {
            x = new Array(n).fill(1 / Math.sqrt(n)); tr.push(norm1(x));
            for (let t = 0; t < T; t++) { x = eigStep(g, x); tr.push(norm1(x)); }
            limit = norm1(lead.vec);
          } else {
            x = new Array(n).fill(1); tr.push(norm1(x));
            for (let t = 0; t < T; t++) { x = x.map((_, i) => 1 + alpha * g.adj[i].reduce((q, j) => q + x[j], 0)); tr.push(norm1(x)); }
            limit = norm1(katz(g, alpha));
          }
          const t = tS.value, cur = tr[t], mxC = Math.max(...cur);
          const ym = Math.max(...tr.map((row) => Math.max(...row))) * 1.08;
          sp.setView([0, T], [0, ym]);
          const topL = [...limit.keys()].sort((a, b) => limit[b] - limit[a]).slice(0, 3);
          for (let i = 0; i < n; i++) {
            const k = topL.indexOf(i);
            sp.path(tr.map((row, tt) => [tt, row[i]]), { color: k >= 0 ? RANK[k] : 'muted', alpha: k >= 0 ? 1 : 0.35, width: k >= 0 ? 2.4 : 1 });
            sp.dot(T, limit[i], { r: k >= 0 ? 4 : 2.5, color: k >= 0 ? RANK[k] : 'muted' });
          }
          sp.vline(t, { color: 'ink', width: 1.5, dash: [5, 4] });
          G.nodes.forEach((nd) => { nd.r = 5 + 18 * Math.sqrt(cur[nd.id] / mxC); });
          G.draw({ nodeColor: () => 'accent', nodeFill: (id) => (id === topL[0] ? 'gold' : null), nodeLabel: (id) => (n < 40 && n !== 15 ? net.labels[id] : ''), nodeNote: (id) => (n === 15 ? net.labels[id] : null) });
          const err = Math.sqrt(cur.reduce((q, c, i) => q + (c - limit[i]) ** 2, 0));
          const d = deg(g);
          st = { err, top: topL[0], lambda: lead.lambda, rho: lead.rho, rD: pearson(limit, d), rE: pearson(limit, lead.vec), alpha, t };
        });
        v.legend([['ink', 'dashed line: round shown on the left', { dash: true }], ['gold', 'top node at the limit', { dot: true }], ['green', 'second and third', { dot: true }]]);
        v.readout(() => `$\\lambda_1 = ${v.fix(st.lambda, 3)}$, $|\\lambda_2|/\\lambda_1 = ${v.fix(st.rho, 3)}$ · after $t = ${st.t}$ rounds the shares are $${v.sci(st.err, 2)}$ from the limit (Euclidean distance)\n${mode.value === 'eig' ? `Top node at the limit: **${nodeName(net, st.top)}**. Each further round shrinks the error by a factor close to $|\\lambda_2|/\\lambda_1$.` : `$\\alpha = ${v.fix(st.alpha, 3)}$ ($\\alpha\\lambda_1 = ${v.fix(aS.value, 2)}$) · correlation of the Katz scores with degree: **${v.fix(st.rD, 3)}**, with the eigenvector scores: **${v.fix(st.rE, 3)}**`}`);
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Algorithm',
      name: 'Hubs and authorities (HITS)',
      statement: String.raw`Let $A$ be the adjacency matrix of a directed graph (here, pages and their links, $A_{pq}=1$ if $p$ links to $q$). Give every page a **hub score** $h_p$ and an **authority score** $a_p$, all starting at 1, and repeat:

$$a \leftarrow A^{\!\top} h,\qquad h \leftarrow A\,a,\qquad \text{then rescale both to unit length.}$$

A page's authority is the total hub score of the pages that point to it, and its hub score is the total authority of the pages it points to. If the largest eigenvalue of $A^{\!\top}A$ is simple (and the starting vector is not orthogonal to its eigenvector), the scores converge to the principal eigenvectors of $A^{\!\top}A$ (for $a$) and $AA^{\!\top}$ (for $h$).`,
      idea: String.raw`Two successive updates compose to $a \leftarrow A^{\!\top}A\,a$, so HITS is power iteration on the symmetric positive semidefinite matrix $A^{\!\top}A$, and the same eigenvector argument as for eigenvector centrality gives convergence to its top eigenvector. The two scores formalise a mutual reinforcement: good hubs list good authorities and good authorities are listed by good hubs. Kleinberg applied it to a small query-specific set of pages. PageRank, by contrast, gives one score per page from a random surfer who follows links and occasionally jumps anywhere.`,
      caption: String.raw`The links form a small invented web (not real data): pages A–C are list pages, F–H heavily cited. Slide the number of rounds to watch hubs (orange) and authorities (blue) settle, and compare with PageRank (grey, damping 0.85). The graph is editable: click one page then another to add or remove a link, and see which scores move.`,
      scope: String.raw`Scores depend on the graph chosen; if the top eigenvalue of $A^{\!\top}A$ is repeated (for instance two disconnected, identical link communities), the limit depends on the starting vector. A small, densely linked cluster can capture the top scores even when it is not the most relevant group.`,
      deps: ['soc-3.2', 'stoch-4.15'],
      refs: ['E&K §14.2'],
      tags: ['link analysis', 'eigenvectors'],
      credit: 'Kleinberg, Journal of the ACM, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/HITS_algorithm' },
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.05, 1.05], axes: false, equal: true, height: 400 });
        const sb = v.stage({ x: [-0.7, 10.2], y: [-0.14, 1.12], axes: false, height: 400, title: 'Scores, each scaled so its largest is 1' });
        const metric = v.select('Node size shows', [{ value: 'a', label: 'Authority' }, { value: 'h', label: 'Hub' }, { value: 'pr', label: 'PageRank' }], 'a');
        const kS = v.slider('rounds $k$', 0, 25, 2, { int: true });
        const EDGES = [[0, 5], [0, 6], [0, 7], [0, 3], [1, 5], [1, 6], [1, 7], [2, 6], [2, 7], [2, 8], [3, 5], [3, 6], [4, 6], [4, 9], [8, 5], [9, 7], [6, 1], [7, 2]];
        const POS = [[-0.9, 0.7], [-0.9, 0.0], [-0.9, -0.7], [-0.1, 0.3], [-0.1, -0.6], [0.9, 0.75], [0.9, 0.1], [0.9, -0.45], [0.2, -1.0], [0.2, 1.0]];
        const nodes = POS.map((p, i) => ({ id: i, x: p[0], y: p[1], label: letter(i) }));
        const G = v.graph(s, { nodes, edges: EDGES.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none', editable: { addNode: false, deleteNode: false, addEdge: true, deleteEdge: true, moveNode: true }, r: 11, autoRadius: false });
        v.button('Reset links', () => { G.set({ nodes: POS.map((p, i) => ({ id: i, x: p[0], y: p[1], label: letter(i) })), edges: EDGES.map(([a, b]) => ({ from: a, to: b })), directed: true }); });
        let st = {};
        v.render(() => {
          const n = G.nodes.length, idx = new Map(G.nodes.map((nd, i) => [String(nd.id), i]));
          const E = G.edges.map((e) => [idx.get(String(e.from)), idx.get(String(e.to))]).filter(([a, b]) => a != null && b != null && a !== b);
          const hist = hitsHistory(n, E, 60), k = kS.value, cur = hist[k], lim = hist[60], pr = pageRank(n, E, 0.85);
          const sc = (arr) => { const m = Math.max(...arr) || 1; return arr.map((x) => x / m); };
          const a = sc(cur.a), h = sc(cur.h), p = sc(pr);
          const val = metric.value === 'a' ? a : metric.value === 'h' ? h : p;
          G.nodes.forEach((nd, i) => { nd.r = 8 + 10 * Math.sqrt(val[i]); });
          const topN = val.indexOf(Math.max(...val));
          G.draw({ nodeColor: (id) => (metric.value === 'h' ? 'orange' : metric.value === 'pr' ? 'muted' : 'accent'), nodeFill: (id) => (idx.get(String(id)) === topN ? 'gold' : null), nodeLabel: (id) => letter(idx.get(String(id))) });
          for (let i = 0; i < n; i++) {
            sb.rect(i - 0.36, 0, i - 0.12, h[i], { fill: 'orange', fillAlpha: 0.75, color: 'orange' });
            sb.rect(i - 0.1, 0, i + 0.14, a[i], { fill: 'accent', fillAlpha: 0.75, color: 'accent' });
            sb.rect(i + 0.16, 0, i + 0.4, p[i], { fill: 'muted', fillAlpha: 0.6, color: 'muted' });
            sb.text(letter(i), i, -0.07, { size: 12, baseline: 'middle', align: 'center', color: 'ink' });
          }
          // spectral check: at the limit AᵀA a = λ a
          const A2 = new Array(n).fill(0), t1 = new Array(n).fill(0);
          for (const [q, r] of E) t1[q] += lim.a[r];
          for (const [q, r] of E) A2[r] += t1[q];
          const lam = A2.reduce((q, x, i) => q + x * lim.a[i], 0), resid = Math.hypot(...A2.map((x, i) => x - lam * lim.a[i]));
          const rank = (arr) => [...arr.keys()].sort((x, y) => arr[y] - arr[x]).slice(0, 3).map(letter).join(' > ');
          st = { auth: rank(lim.a), hub: rank(lim.h), pr: rank(pr), lam, resid, m: E.length, n };
        });
        v.legend([['orange', 'hub score'], ['accent', 'authority score'], ['muted', 'PageRank'], ['gold', 'top node of the size measure', { dot: true }]]);
        v.readout(() => `${st.n} pages, ${st.m} links. After 60 rounds: top authorities **${st.auth}**, top hubs **${st.hub}**; PageRank ranks **${st.pr}**.\nSpectral check: $A^{\\top}A\\,a = \\lambda a$ with $\\lambda = ${v.fix(st.lam, 3)}$ and residual $${v.sci(st.resid, 1)}$, so the iteration has reached the top eigenvector of $A^{\\top}A$.`);
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Model',
      name: 'DeGroot learning: consensus by repeated averaging',
      statement: String.raw`Let $n$ people hold opinions $p(t)\in\mathbb R^n$ and let $T$ be a row-stochastic **trust matrix** ($T_{ij}\ge0$ is the weight person $i$ puts on person $j$, each row summing to 1). In each round everyone replaces their opinion by the weighted average of the opinions they listen to:
$$p(t+1) = T\,p(t),\qquad\text{so } p(t) = T^{t}p(0).$$
If the trust graph is strongly connected and aperiodic, then $T^t \to \mathbf 1 s^{\!\top}$ where $s$ is the unique probability vector with $s^{\!\top}T = s^{\!\top}$, and everyone's opinion converges to the same **consensus** $\sum_i s_i\,p_i(0)$. The weight $s_i$ is person $i$'s **influence**. When trust is symmetric and each person splits their attention equally, $s_i$ is proportional to the number of people $i$ listens to ($i$'s degree).`,
      idea: String.raw`Averaging is a Markov chain run on the opinions instead of on a walker: $T$ is the transition matrix, and the stationary distribution of the chain is the influence vector $s$. Strong connectivity and aperiodicity give $T^t\to \mathbf 1 s^{\!\top}$ (convergence to the stationary distribution), and since $s$ is a left eigenvector of $T$, the quantity $\sum_i s_i p_i(t)$ never changes: it is conserved and therefore equals the consensus. People with large $s_i$ are those who many others (directly or indirectly) listen to, which is why influence is an eigenvector-type centrality.`,
      caption: String.raw`Choose a network and initial opinions (colour from blue = 0 to orange = 1) and slide the number of rounds. The green line is the predicted consensus $\sum s_i p_i(0)$; the dashed line is the plain average, which is different. Raise the self-weight to slow convergence. Click a person to make them stubborn (weight 1 on themselves) and watch consensus fail.`,
      scope: String.raw`The consensus formula needs a strongly connected, aperiodic trust graph. Here trust is symmetric (each person weights themselves $a$ and shares the rest equally among their neighbours), so $s_i=k_i/2m$. A stubborn person who never updates breaks the hypothesis: with two stubborn people holding different views no consensus is reached, and the limit is read off after 600 rounds.`,
      deps: ['soc-3.2', 'stoch-4.1'],
      refs: [],
      tags: ['learning', 'consensus'],
      credit: 'DeGroot, 1974 (building on French, 1956)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/DeGroot_learning' },
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 400 });
        const sp = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, xlabel: 'round t', ylabel: 'opinion', height: 400 });
        const sel = v.select('Network', NETS3, 'karate', { onChange: load });
        const ini = v.select('Initial opinions', [{ value: 'rand', label: 'Random' }, { value: 'camps', label: 'Two camps' }, { value: 'hub', label: 'Only the best-connected person says 1' }, { value: 'leaf', label: 'Only the least connected says 1' }], 'rand');
        const aS = v.slider('weight on oneself $a$', 0, 0.9, 0.3, { step: 0.05 });
        const tS = v.slider('rounds $t$', 0, 60, 4, { int: true });
        let net = net3('karate'), stubborn = new Set();
        const G = v.graph(s, { nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 11, autoRadius: false });
        function load() { net = net3(sel.value); stubborn = new Set(); G.set({ nodes: nodeSpec(net), edges: net.g.edges.map(([a, b]) => [a, b]), r: 11, autoRadius: false }).layout('fit'); }
        G.onClick = ({ node }) => { if (node) { if (stubborn.has(node.id)) stubborn.delete(node.id); else stubborn.add(node.id); } return true; };
        v.button('Clear stubborn people', () => { stubborn = new Set(); });
        const x0Of = () => {
          const g = net.g, n = g.n, d = deg(g);
          if (ini.value === 'rand') { const R = rng32(7 + n); return Array.from({ length: n }, () => R()); }
          if (ini.value === 'camps') return net.g.n === 34 ? net.g.adj.map((_, i) => (i < 34 ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1][i] : 0)) : Array.from({ length: n }, (_, i) => (i < n / 2 ? 0 : 1));
          if (ini.value === 'hub') return d.map((q) => (q === Math.max(...d) ? 1 : 0)).map((q, i, a) => (a.indexOf(1) === i ? 1 : 0));
          const mn = Math.min(...d); const first = d.indexOf(mn); return d.map((_, i) => (i === first ? 1 : 0));
        };
        let st = {};
        v.render(() => {
          const g = net.g, n = g.n, a = aS.value, rows = trustRows(g, a, stubborn), x0 = x0Of();
          const T = 60, tr = [x0]; let x = x0;
          for (let t = 0; t < T; t++) { x = degrootStep(rows, x); tr.push(x); }
          let lim = x; for (let t = 0; t < 540; t++) lim = degrootStep(rows, lim);
          const sInf = influence(rows, 1500), pred = sInf.reduce((q, w, i) => q + w * x0[i], 0), mean = x0.reduce((q, z) => q + z, 0) / n;
          const t = tS.value, cur = tr[t];
          const col = (q) => v.diverge(2 * q - 1, 'accent', 'orange');
          for (let i = 0; i < n; i++) sp.path(tr.map((row, tt) => [tt, row[i]]), { color: col(x0[i]), width: stubborn.has(i) ? 3 : 1.3, alpha: 0.9 });
          sp.hline(pred, { color: 'green', width: 2 }); sp.hline(mean, { color: 'muted', dash: [5, 4] }); sp.vline(t, { color: 'gold', width: 2 });
          G.draw({ nodeFill: (id) => col(cur[id]), nodeRing: (id) => (stubborn.has(id) ? 'red' : null), nodeLabel: (id) => (n < 40 && n !== 15 ? net.labels[id] : ''), nodeNote: (id) => (n === 15 ? net.labels[id] : null), labelColor: () => 'ink' });
          st = { pred, mean, spread: Math.max(...cur) - Math.min(...cur), lim, sInf, x0, nst: stubborn.size, n, t, finalSpread: Math.max(...lim) - Math.min(...lim) };
        });
        v.legend([['green', 'predicted consensus $\\sum_i s_ip_i(0)$'], ['muted', 'plain average of the starting opinions', { dash: true }], ['red', 'ring: stubborn person', { dot: true }]]);
        v.readout(() => {
          const topI = [...st.sInf.keys()].sort((p, q) => st.sInf[q] - st.sInf[p])[0];
          if (st.nst === 0) return `Round ${st.t}: opinions differ by at most **${v.fix(st.spread, 3)}**. Predicted consensus $\\sum_i s_i p_i(0) = ${v.fix(st.pred, 4)}$ against the plain average ${v.fix(st.mean, 4)}; opinions after 600 rounds: ${v.fix(Math.min(...st.lim), 4)} to ${v.fix(Math.max(...st.lim), 4)}.\nMost influential: **${nodeName(net, topI)}** with $s = ${v.fix(st.sInf[topI], 3)}$ (degree over $2m$); least: $s = ${v.fix(Math.min(...st.sInf), 3)}$.`;
          return `${st.nst} stubborn ${st.nst === 1 ? 'person' : 'people'} (ringed): after 600 rounds opinions range over ${v.fix(Math.min(...st.lim), 3)} to ${v.fix(Math.max(...st.lim), 3)}, spread **${v.fix(st.finalSpread, 3)}**.\n${st.finalSpread < 1e-3 ? 'Everyone has been pulled to the stubborn person’s view.' : 'No consensus: the formula for a strongly connected, aperiodic trust graph no longer applies.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Wise crowds need no prominent groups (Golub–Jackson)',
      statement: String.raw`Consider a sequence of societies $n=1,2,\dots$ in which person $i$ of society $n$ starts with a noisy belief $p_i(0)\in[0,1]$ about a true value $\mu$, the beliefs being independent with mean $\mu$ and variance at least $\sigma^2>0$. Beliefs evolve by DeGroot updating with a trust matrix $T(n)$ that is strongly connected and aperiodic, with influence vector $s(n)$ (so every belief converges to $\sum_i s_i(n)p_i(0)$). The sequence is **wise** if every person's limiting belief converges in probability to $\mu$ as $n\to\infty$. Then:
$$\text{the sequence is wise}\iff \max_i s_i(n)\to 0 .$$
Special case: if links are symmetric and everyone weights their neighbours equally, the sequence is wise iff the maximum degree divided by the sum of all degrees tends to 0.`,
      idea: String.raw`The common limit is the weighted average $\sum_i s_i p_i(0)$, with mean $\mu$ and variance between $\sigma^2\sum_i s_i^2$ and about $\sum_i s_i^2$ (the beliefs lie in $[0,1]$). Since $\sum_i s_i^2\le \max_i s_i\cdot\sum_i s_i=\max_i s_i$, the variance vanishes when the largest influence does (Chebyshev gives convergence in probability), and since $\sum_i s_i^2\ge(\max_i s_i)^2$ it stays bounded away from 0 when the largest influence does not. A prominent person or group who keep a fixed share of influence therefore transmit their own error to everyone, however large the crowd; this uses the influence vector as the stationary distribution from 3.4.`,
      caption: String.raw`Pick a society and the crowd size $n$. The circle shows the influence $s_i$ of each person as the size of their dot; the histogram shows the limiting consensus over 400 draws of independent noise (bounded, standard deviation 1; the truth is 0). On the log–log plot, wise societies follow the dashed $1/\sqrt n$ line; the star and the media society level off. The curves are computed exactly from the influence vector, the histogram by simulation.`,
      scope: String.raw`The theorem needs independent beliefs with variance bounded below (here: uniform noise of standard deviation 1, so the bounded range $[0,1]$ of the paper is rescaled) and convergent trust matrices; "wise" says nothing about how fast the crowd converges. The five societies are illustrative families of my own choosing, not data: complete (everyone hears everyone), ring (two neighbours each side), star (everyone listens to one hub), media (everyone gives half their attention to three people), and a preferential-attachment network.`,
      deps: ['soc-3.4'],
      refs: [],
      tags: ['wisdom of crowds', 'learning'],
      credit: 'Golub & Jackson, 2010',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/DeGroot_learning' },
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.15, 1.15], axes: false, equal: true, height: 380, title: 'Influence $s_i$ (dot area)' });
        const sp = v.stage({ x: [8, 500], y: [0.02, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'crowd size n', ylabel: 'standard deviation of the consensus', height: 380 });
        const sh = v.stage({ x: [-1.2, 1.2], y: [0, 1], axes: 'box', gutter: true, xlabel: 'consensus minus truth', ylabel: 'draws', height: 380, weight: 0.8, minWidth: 240 });
        const KINDS = [['complete', 'Complete', 'green'], ['ring', 'Ring', 'accent'], ['pref', 'Preferential attachment', 'teal'], ['media', 'Media (3 prominent)', 'orange'], ['star', 'Star', 'red']];
        const sel = v.select('Society', KINDS.map(([value, label]) => ({ value, label })), 'star');
        const nS = v.slider('crowd size $n$', 8, 500, 60, { int: true, log: true });
        let seed = 1; v.button('Redraw the noise', () => { seed++; });
        const cache = {};
        function stats(kind, n) {
          const key = kind + n; if (cache[key]) return cache[key];
          if (kind === 'complete' || kind === 'ring') return (cache[key] = { s: new Array(n).fill(1 / n), sumsq: 1 / n, max: 1 / n });
          const rows = society(kind, n); const sv = influence(rows, 900); return (cache[key] = { s: sv, sumsq: sv.reduce((a, x) => a + x * x, 0), max: Math.max(...sv) });
        }
        const GRID = [8, 12, 18, 28, 44, 70, 110, 180, 300, 500];
        let st = {};
        v.render(() => {
          const n = nS.value, kind = sel.value, S = stats(kind, n);
          const pos = Array.from({ length: n }, (_, i) => [Math.cos(Math.PI / 2 - 2 * Math.PI * i / n), Math.sin(Math.PI / 2 - 2 * Math.PI * i / n)]);
          if (kind === 'star') pos[0] = [0, 0];
          if (kind === 'media') for (let i = 0; i < 3; i++) pos[i] = [0.28 * Math.cos(Math.PI / 2 + i * 2.0944), 0.28 * Math.sin(Math.PI / 2 + i * 2.0944)];
          const ring = (kind === 'star' || kind === 'media') ? 0.85 : 0.95;
          const P = pos.map((q, i) => ((kind === 'star' && i === 0) || (kind === 'media' && i < 3) ? q : [q[0] * ring, q[1] * ring]));
          if (n <= 40) { const rows = society(kind, n); rows.forEach((r, i) => r.forEach(([j, w]) => { if (j !== i && w > 0 && (kind === 'star' ? true : j > i || kind !== 'ring')) s.line(P[i][0], P[i][1], P[j][0], P[j][1], { color: 'muted', alpha: 0.25, width: 1 }); })); }
          else if (kind === 'star') for (let i = 1; i < n; i++) s.line(0, 0, P[i][0], P[i][1], { color: 'muted', alpha: 0.12, width: 1 });
          else if (kind === 'media') for (let i = 3; i < n; i++) for (let j = 0; j < 3; j++) s.line(P[i][0], P[i][1], P[j][0], P[j][1], { color: 'muted', alpha: 0.05, width: 1 });
          const big = S.s.map((x, i) => i).sort((a, b) => S.s[a] - S.s[b]);
          for (const i of big) s.dot(P[i][0], P[i][1], { r: 2 + 42 * Math.sqrt(S.s[i]), color: S.s[i] === S.max && S.max > 0.05 ? 'red' : 'accent', fill: true });
          // error curves
          for (const [k, , col] of KINDS) sp.path(GRID.map((N) => [N, Math.sqrt(stats(k, N).sumsq)]), { color: col, width: k === kind ? 3 : 1.4, alpha: k === kind ? 1 : 0.55 });
          sp.fn((x) => 1 / Math.sqrt(x), { color: 'muted', dash: [5, 4] });
          sp.vline(n, { color: 'gold', width: 1.5 });
          sp.dot(n, Math.sqrt(S.sumsq), { r: 6, color: 'gold' });
          // Monte-Carlo consensus
          const R = v.rng(seed * 1009 + n), vals = [];
          for (let r = 0; r < 400; r++) { let c = 0; for (let i = 0; i < n; i++) c += S.s[i] * (2 * R() - 1) * Math.sqrt(3); vals.push(c); }
          const h = v.M.histogram(vals, { bins: 48, range: [-1.2, 1.2] }), mx = Math.max(...h.counts);
          sh.setView([-1.2, 1.2], [0, mx * 1.15]);
          sh.hist({ edges: h.edges, counts: h.counts }, { color: 'accent' });
          sh.vline(0, { color: 'green', width: 2 });
          sh.vline(Math.sqrt(S.sumsq), { color: 'muted', dash: [4, 3] }); sh.vline(-Math.sqrt(S.sumsq), { color: 'muted', dash: [4, 3] });
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length, sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
          st = { S, n, sd, kind };
        });
        v.legend(KINDS.map(([, label, col]) => [col, label]).concat([['muted', '$1/\\sqrt n$ (n independent people)', { dash: true }]]));
        v.readout(() => `Largest influence $\\max_i s_i = ${v.fix(st.S.max, 4)}$ · consensus standard deviation $\\sqrt{\\sum s_i^2} = ${v.fix(Math.sqrt(st.S.sumsq), 4)}$ (simulated: ${v.fix(st.sd, 3)}) · the crowd is worth **${v.fix(1 / st.S.sumsq, 1)}** independent people out of ${st.n}.\n${st.S.max > 0.05 ? 'A single person holds a large, non-vanishing share of influence: making the crowd bigger will not remove their error.' : 'Nobody holds a large share of the influence at this size; the error follows the law of large numbers.'}`);
      },
    },

    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Community structure and modularity',
      statement: String.raw`A **community structure** is a partition of the nodes into groups that are densely connected inside and sparsely connected between. For a partition $c$ of a graph with $m$ edges, the **modularity** is the fraction of edges that fall inside groups minus the fraction expected if the same degrees were wired at random:
$$Q = \frac1{2m}\sum_{i,j}\Bigl(A_{ij}-\frac{k_ik_j}{2m}\Bigr)\,\delta(c_i,c_j) \;=\; \sum_{g}\Bigl[\frac{m_g}{m}-\Bigl(\frac{K_g}{2m}\Bigr)^{2}\Bigr],$$
where $m_g$ is the number of edges inside group $g$ and $K_g$ the total degree of its members. Putting everyone in one group gives $Q=0$; community-detection methods search for partitions with large $Q$.`,
      idea: String.raw`The null model keeps each node's degree but rewires the edges at random, so $k_ik_j/2m$ is the expected number of edges between $i$ and $j$; a good partition has more internal edges than that. Exact maximisation of $Q$ is hard in general, so one uses heuristics: greedy merging of the pair of groups that raises $Q$ most, or the Louvain method of repeated local moves. A group of triangle-rich nodes (as in the clustering coefficient of 2.5) is the typical high-$Q$ community. Modularity has a resolution limit: for large networks it can fail to separate small communities, so a maximum of $Q$ is a guide rather than the truth.`,
      caption: String.raw`Click a person to cycle their group colour and watch $Q$ and the plot move. Buttons load the real split of the club, the best two-way split, the greedy agglomeration (the slider replays its merges) and the best partition found by Louvain. A random relabelling of the same groups scores about 0.`,
      scope: String.raw`Zachary's club (networkx copy, 34 members, 78 ties) split into two factions after a dispute; the faction labels are the networkx ones. The greedy, two-way and Louvain results are computed by the page's own code (60 Louvain restarts): the best value found, $Q\approx0.4198$ with four groups, agrees with the proven optimum reported in the literature on modularity maximisation. Modularity alone does not recover the real split, whose $Q$ is lower than that of finer partitions.`,
      deps: ['soc-2.5'],
      refs: ['Newman ch. 14'],
      tags: ['communities', 'modularity'],
      credit: 'Newman & Girvan, 2004 (modularity); Girvan & Newman, 2002; Zachary, 1977 (the club)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modularity_(networks)' },
      viz(v) {
        const net = getNet('karate'), g = net.g, n = g.n, CL = [...CYC, 'red'];
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.05], axes: false, equal: true, height: 410 });
        const sp = v.stage({ x: [0, 35], y: [-0.1, 0.5], axes: 'box', gutter: true, xlabel: 'number of groups', ylabel: 'modularity Q', height: 410, weight: 0.9 });
        const club = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        const hist = greedyHistory(g), bi = bestBisection(g), lou = bestLouvain(g, 60, 1);
        const qBest = modularity(g, lou), qBi = modularity(g, bi), qClub = modularity(g, club);
        let comm = club.slice();
        const mS = v.slider('greedy merges replayed', 0, 33, 0, { int: true, onChange: (x) => { comm = hist[x].comm.slice(); } });
        const G = v.graph(s, { nodes: nodeSpec(net), edges: g.edges.map(([a, b]) => [a, b]), layout: 'fit', r: 11, autoRadius: false });
        G.onClick = ({ node }) => { if (node) comm[node.id] = (comm[node.id] + 1) % CL.length; return true; };
        v.button('Real factions', () => { comm = club.slice(); });
        v.button('Best two-way split', () => { comm = bi.slice(); });
        v.button('Greedy optimum', () => { const b = hist.reduce((a, x) => (x.q > a.q ? x : a)); comm = b.comm.slice(); });
        v.button('Louvain best', () => { comm = lou.slice(); });
        v.button('Everyone apart', () => { comm = Array.from({ length: n }, (_, i) => i); });
        v.button('One group', () => { comm = new Array(n).fill(0); });
        v.button('Scramble', () => { const R = rng32(Math.floor(Math.random() * 1e6)); comm = shuffle(comm.slice(), R); });
        let st = {};
        v.render(() => {
          const ids = [...new Set(comm)], remap = new Map(ids.map((c, i) => [c, i])), cc = comm.map((c) => remap.get(c));
          const q = modularity(g, comm), k = ids.length;
          sp.path(hist.map((h) => [h.k, h.q]), { color: 'muted', width: 1.6, alpha: 0.8 });
          hist.forEach((h) => sp.dot(h.k, h.q, { r: 2.5, color: 'muted' }));
          sp.hline(0, { color: 'faint' });
          sp.dot(new Set(lou).size, qBest, { r: 6, color: 'green', label: 'best found', labelPos: 'ne' });
          sp.dot(2, qClub, { r: 9, hollow: true, color: 'red', label: 'real factions', labelPos: 'ne' });
          sp.dot(k, q, { r: 4.5, color: 'gold' });
          G.draw({ nodeFill: (id) => CL[cc[id] % CL.length], nodeRing: (id) => (club[id] ? 'ink' : null), nodeLabel: (id) => net.labels[id], labelColor: () => 'ink' });
          // purity against the real factions and a shuffled-label baseline
          let pure = 0; for (const c of ids) { let a = 0, b = 0; comm.forEach((x, i) => { if (x === c) { if (club[i]) b++; else a++; } }); pure += Math.max(a, b); }
          const R = rng32(99); let rnd = 0; for (let r = 0; r < 200; r++) rnd += modularity(g, shuffle(comm.slice(), R)); rnd /= 200;
          st = { q, k, pure: pure / n, rnd };
        });
        v.legend([['muted', 'greedy merging path (CNM style)'], ['gold', 'your partition', { dot: true }], ['green', 'best partition found', { dot: true }], ['red', 'real split', { dot: true }], ['ink', 'ring: members of one real faction', { dot: true }]]);
        v.readout(() => `Partition into **${st.k}** group${st.k === 1 ? '' : 's'}: modularity $Q = ${v.fix(st.q, 4)}$ · same groups with the members shuffled: ${v.fix(st.rnd, 3)} on average\nAgreement with the real factions: ${v.fix(100 * st.pure, 0)}% of members in the majority faction of their group · reference values: real split ${v.fix(qClub, 4)}, best two-way ${v.fix(qBi, 4)}, greedy ${v.fix(Math.max(...hist.map((h) => h.q)), 4)}, Louvain ${v.fix(qBest, 4)}`);
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Power from position in exchange networks',
      statement: String.raw`In a **one-exchange network model**, every edge offers one unit to divide, each vertex can trade with at most one neighbour, and unmatched vertices receive zero. An outcome is a matching $M$ and nonnegative payoffs $x_i$, with $x_i+x_j=1$ on each matched edge.

The outside option is $\alpha_i=\max(\{0\}\cup\{1-x_j:ij\in E\setminus M\})$. An outcome is **stable** when $x_i\ge\alpha_i$ for every vertex, equivalently $x_i+x_j\ge1$ on every edge outside the matching. It is **balanced** when it is stable and matched partners have equal surplus over their outside options: $x_i-\alpha_i=x_j-\alpha_j$. The four-node path has the balanced payoff vector $(1/3,2/3,2/3,1/3)$; a middle position alone does not determine a vertex's payoff.`,
      idea: String.raw`An outside option is the limiting amount a vertex could keep by offering another neighbour slightly more than that neighbour currently gets. Stability prevents a pair from both gaining by abandoning their current agreements. Equal division of the surplus refines stability: on the four-node path, the inner vertices' options depend on each other's payoffs, giving the two-thirds split.

For a triangle, any nonempty matching leaves one vertex with zero. Stability on its two incident edges would require both matched vertices to receive at least one, contradicting their total of one. The empty matching also fails. This proves nonexistence of a stable outcome in this model; it does not specify a negotiation process or prove that real negotiations never settle.`,
      caption: String.raw`Choose one of six fixed graphs. At zero deviation, the five paths/stem examples show an exact balanced outcome; the triangle shows a feasible half-and-half candidate that fails stability. Change the first trading pair's split while preserving its total of one. Compare every payoff with its outside option and watch the stability and balance residuals. Red edges identify pairs with a positive stability deficit.`,
      scope: String.raw`Finite undirected, unit-edge, one-exchange model, following the definitions and examples in Kleinberg and Tardos (2008), pp.295–297. The widget evaluates specified outcomes on the six offered fixtures; it is not a solver for arbitrary edited graphs and does not estimate laboratory shares or negotiation dynamics. The triangle's nonexistence claim follows the proof above, independently of a numerical iteration. Other fixtures show one specified matching, without claiming to enumerate every matching or balanced payoff.`,
      deps: ['soc-3.1', 'game-7.1'],
      refs: ['Kleinberg & Tardos, Balanced Outcomes in Social Exchange Networks (STOC 2008), pp.295–297, definitions and Fig.2'],
      tags: ['exchange networks', 'bargaining', 'power'],
      credit: 'Definitions and examples: Kleinberg & Tardos, 2008; their account attributes the balanced-outcome model to Cook & Yamagishi, 1992.',
      links: { source: 'https://www.cs.cornell.edu/info/people/kleinber/stoc08-exchange.pdf' },
      verify: false,
      viz(v) {
        const s=v.stage({x:[-1.5,1.5],y:[-1.15,1.15],axes:false,equal:true,height:320});
        const sb=v.stage({x:[-.7,4.7],y:[-.1,1.35],axes:'box',xticks:[],ylabel:'unit-edge amount',height:320});
        const sel=v.select('graph',EXCHANGE_CHOICES,'p3',{onChange:()=>d.set(0)});
        const d=v.slider('first-pair split deviation',-1,1,0,{step:.01});
        v.button('Reset split',()=>d.set(0));let info;
        v.render(()=>{const p=exchangeFixture(sel.value,d.value);sb.setView([-.7,p.n-.3],[-.1,1.35]);sb.setTicks(Array.from({length:p.n},(_,i)=>[i,letter(i)]),null);
          p.edges.forEach(([a,b],j)=>s.line(...p.pos[a],...p.pos[b],{color:p.partner[a]===b?'green':p.edgeGaps[j]>2e-12?'red':'muted',width:p.partner[a]===b?4:1.6}));
          p.pos.forEach(([x,y],i)=>{s.dot(x,y,{color:'accent',r:6});s.text(letter(i),p.id==='stem'&&i>=2?x+.18:x,p.id==='stem'&&i>=2?y:y+.2,{align:p.id==='stem'&&i>=2?'left':'center',baseline:p.id==='stem'&&i>=2?'middle':'bottom',color:'ink',size:13});});
          p.values.forEach((x,i)=>{sb.rect(i-.31,0,i-.03,x,{fill:'accent',fillAlpha:.75,color:'accent'});sb.rect(i+.03,0,i+.31,p.outside[i],{fill:'orange',fillAlpha:.75,color:'orange'});sb.text(frac(x),i-.17,x+.055,{align:'center',baseline:'bottom',size:12,color:'ink'});});info=p;});
        v.legend([['green','specified trading pair'],['red','edge with a stability deficit'],['accent','payoff'],['orange','outside option']]);
        v.readout(()=>{const p=info;return `Specified matching: ${p.match.map(([a,b])=>`${letter(a)}–${letter(b)}`).join(', ')}. First changed pair: ${p.match[0].map(letter).join('–')}.\nPayoffs: ${p.values.map((x,i)=>`${letter(i)} ${frac(x)}`).join(' · ')}. Outside options: ${p.outside.map((x,i)=>`${letter(i)} ${frac(x)}`).join(' · ')}.\nMaximum stability deficit ${v.fix(p.stabilityResidual,8)}; maximum matched surplus imbalance ${v.fix(p.balanceResidual,8)}. Within numerical tolerance: ${p.balanced?'stable and balanced':p.stable?'stable, not balanced':'fails stability'}.${p.id==='tri'?' No stable outcome exists on the triangle by the matching argument above; these bars show one candidate.':' These checks evaluate this specified outcome only.'}`;});
      },
    },
  ],
};
