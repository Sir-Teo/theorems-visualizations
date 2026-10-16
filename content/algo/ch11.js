// Algorithms — Chapter 11: Network flow, matching and linear programming (items 11.1–11.6; 11.7–11.13 in ch11-b.js, 11.14–11.19 in ch11-c.js, 11.21–11.25 in ch11-d.js)
// 11.17 (simplex method), 11.18 (Farkas) and 11.20 (complementary slackness) are cross-listings of opt-6.3, opt-5.14 and opt-5.8.
import { K, ids, plural, clamp, rngOf, sumOf, NETS, num, excess, flowValue, isFeasible, cutCap, cutNet, allCuts, minCutBrute, resArcs, reachSet, findPath, pathBottleneck, pushPath, randomFlow, fordFulkerson, FF_CODE, arcsOf, zeros, netStage, mkNet, loadNet, netIds, drawFlow, ffDraw, rkey, TX, R } from './ch11.shared.js';

const NET_SELECT = [{ value: 'A', label: 'network A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }];
const fmtCut = (S) => `\\{${[...S].join(',')}\\}`;

export default {
  collection: 'algo',
  chapter: 11,
  title: 'Network flow, matching and linear programming',
  summary: String.raw`Pushing as much as possible from a source to a sink through capacitated edges is a problem with a perfect certificate: the maximum flow equals the minimum cut. Augmenting paths in the residual graph find both, and choosing shortest paths makes the method polynomial. Matching, disjoint paths and Hall’s theorem are flows in disguise, and the whole story is one instance of linear programming duality, where every maximization comes with a minimization that bounds it.`,
  items: [
    // ------------------------------------------------------------------ 11.1
    {
      num: '11.1',
      kind: 'Definition',
      name: 'Flow networks and flows',
      statement: String.raw`A **flow network** is a directed graph $G=(V,E)$ with a **source** $s$, a **sink** $t\ne s$ and a **capacity** $c(u,v)\ge 0$ on each edge. A **flow** is a function $f:E\to\R$ with
(a) **capacity:** $0\le f(u,v)\le c(u,v)$ for every edge, and
(b) **conservation:** at every vertex $v\notin\{s,t\}$, $\sum_{(u,v)\in E}f(u,v)=\sum_{(v,w)\in E}f(v,w)$.
Its **value** is the net flow out of the source, $|f|=\sum_{(s,v)}f(s,v)-\sum_{(u,s)}f(u,s)$. The **maximum-flow problem** asks for a feasible flow of largest value.`,
      idea: String.raw`Think of pipes with a throughput limit: nothing may exceed a pipe's capacity, and no interior junction may create or swallow material. Conservation forces everything leaving $s$ to arrive at $t$ (this is made precise in 11.3). The definition is the object every later result in the chapter is about; the dependence on 8.1 is only the vocabulary of directed paths and connectivity.`,
      caption: String.raw`Click an edge to change its flow by the amount chosen in **click does** (the label reads flow/capacity). An edge over its capacity (or below zero) turns red; an interior vertex whose inflow and outflow disagree gets a red ring and a note with the imbalance. Only when no red remains is the picture a flow, and then the value leaving $s$ equals the value arriving at $t$.`,
      deps: ['algo-8.1'],
      refs: ['CLRS 4e §24.1', 'Erickson Ch. 10'],
      tags: ['flow'],
      viz(v) {
        const s = netStage(v, { height: 340 });
        let f = [], seed = 3;
        const G = mkNet(v, s, 'A', { onClick: ({ edge, shift }) => { if (!edge) return false; const i = G.edges.indexOf(edge), d = (step.value === '+1') !== !!shift ? 1 : -1; f[i] = clamp(f[i] + d, -3, edge.w + 4); return true; } });
        const step = v.select('click does', ['+1', '−1'], '+1');
        const newF = () => { f = randomFlow(netIds(G), arcsOf(G), 's', 't', seed, 3); };
        newF();
        v.select('network', NET_SELECT, 'A', { onChange: (k) => { loadNet(G, k); newF(); } });
        v.button('Zero flow', () => { f = zeros(G.edges.length); });
        v.button('Random feasible flow', () => { seed++; newF(); });
        v.button('Maximum flow', () => { const r = fordFulkerson(netIds(G), arcsOf(G), 's', 't', 'bfs'); f = r.f.slice(); });
        v.render(() => {
          const arcs = arcsOf(G), ex = (id) => excess(arcs, f, String(id));
          drawFlow(G, f, () => ({
            nodeRing: (id) => (id !== 's' && id !== 't' && Math.abs(ex(id)) > 1e-9 ? 'red' : null),
            nodeNote: (id) => (id !== 's' && id !== 't' && Math.abs(ex(id)) > 1e-9 ? `${ex(id) > 0 ? '+' : '−'}${num(Math.abs(ex(id)), 2)}` : null), noteColor: 'red',
          }));
        });
        v.legend([['accent', 'carries flow'], ['red', 'violates capacity'], ['red', 'vertex out of balance (inflow − outflow)', { dot: true }]]);
        v.readout(() => {
          const arcs = arcsOf(G), I = netIds(G), bad = G.edges.filter((e, i) => f[i] > e.w + 1e-9 || f[i] < -1e-9).length;
          const off = I.filter((x) => x !== 's' && x !== 't' && Math.abs(excess(arcs, f, x)) > 1e-9);
          return `Value leaving $s$: **${num(flowValue(arcs, f, 's'), 2)}** · arriving at $t$: **${num(excess(arcs, f, 't'), 2)}**\n${bad ? `${plural(bad, 'edge')} outside $[0,c]$` : 'all capacities respected'} · ${off.length ? `not conserved at ${off.join(', ')}` : 'conserved at every interior vertex'} · ${isFeasible(arcs, f, I, 's', 't') ? '**a flow**' : 'not a flow yet'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.2
    {
      num: '11.2',
      kind: 'Definition',
      name: 's–t cuts and their capacity',
      statement: String.raw`An **$s$–$t$ cut** is a partition $V=S\sqcup T$ with $s\in S$ and $t\in T$. Its **capacity** counts only the edges that leave $S$ and enter $T$:
$$c(S,T)=\sum_{u\in S,\ v\in T,\ (u,v)\in E}c(u,v).$$
Edges from $T$ back to $S$ are crossed by the cut too, but they do not contribute to its capacity. A **minimum cut** is a cut of smallest capacity.`,
      idea: String.raw`A cut is a way of severing the network so that no route remains from $s$ to $t$, and its capacity is the throughput of the severed pipes: whatever flows from $s$ to $t$ must cross every cut, so no flow can exceed any cut capacity (this is 11.3). Backward edges are free: a pipe running from the sink side to the source side does not help carry anything across.`,
      caption: String.raw`Click a vertex to move it between the source side (blue) and the sink side (orange). Edges that leave $S$ are drawn red and counted; edges coming back into $S$ are purple and dashed, and not counted. On the right, every one of the $2^{n-2}$ cuts of the network is a bar sorted by capacity; the gold bar is your cut and the green bars are minimum cuts.`,
      deps: ['algo-11.1'],
      refs: ['CLRS 4e §24.2', 'Erickson Ch. 10'],
      tags: ['flow', 'cuts'],
      viz(v) {
        const s = netStage(v, { weight: 1.4 });
        const bars = v.stage({ x: [0, 17], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: 'cuts, sorted by capacity', ylabel: 'capacity', weight: 0.9 });
        let S = new Set(['s', 'a']);
        const G = mkNet(v, s, 'A', { draggable: true, onClick: ({ node, id }) => { if (!node || id === 's' || id === 't') return false; const k = String(id); if (S.has(k)) S.delete(k); else S.add(k); return true; } });
        v.select('network', NET_SELECT, 'A', { onChange: (k) => { loadNet(G, k); S = new Set(['s']); } });
        v.button('Show a minimum cut', () => { S = new Set(minCutBrute(netIds(G), arcsOf(G), 's', 't').cuts[0].S); });
        v.button('Reset', () => { S = new Set(['s']); });
        let info = { cap: 0, parts: [], back: 0 };
        v.render(() => {
          const arcs = arcsOf(G), I = netIds(G), cuts = allCuts(I, arcs, 's', 't').sort((a, b) => a.cap - b.cap || a.mask - b.mask);
          const key = (X) => [...X].sort().join(','), cur = cuts.findIndex((c) => key(c.S) === key(S)), mn = cuts[0].cap;
          const fwd = G.edges.filter((e) => S.has(String(e.from)) && !S.has(String(e.to))), back = G.edges.filter((e) => !S.has(String(e.from)) && S.has(String(e.to)));
          info = { cap: cutCap(arcs, S), parts: fwd.map((e) => e.w), back: sumOf(back, (e) => e.w) };
          G.draw({
            nodeColor: (id) => (S.has(String(id)) ? 'blue' : 'orange'), nodeFill: (id) => (S.has(String(id)) ? 'blue' : null),
            edgeLabel: (e) => num(e.w, 2),
            edgeColor: (e) => (fwd.includes(e) ? 'red' : back.includes(e) ? 'purple' : 'faint'), edgeWidth: (e) => (fwd.includes(e) ? 4.4 : back.includes(e) ? 2.2 : 1.6), edgeDash: (e) => back.includes(e),
          });
          const top = Math.max(cuts[cuts.length - 1].cap, 1);
          bars.setView([0, cuts.length + 1], [0, top * 1.12]);
          bars.bars(cuts.map((c) => c.cap), { color: (val, i) => (i === cur ? 'gold' : val === mn ? 'green' : 'blue') });
          bars.hline(mn, { color: 'green', dash: true, alpha: 0.7 });
        });
        v.legend([['blue', 'source side $S$', { dot: true }], ['orange', 'sink side $T$', { dot: true }], ['red', 'counted: $S\\to T$'], ['purple', 'crossing back, not counted', { dash: true }]]);
        v.readout(() => `$c(S,T)=${info.parts.length ? info.parts.join('+') : '0'}=${num(info.cap, 2)}$ for $S=${fmtCut(S)}$${info.back ? ` · backward capacity ${num(info.back, 2)} ignored` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 11.3
    {
      num: '11.3',
      kind: 'Lemma',
      name: 'Flow value equals net flow across any cut',
      statement: String.raw`Let $f$ be a flow in a network and $(S,T)$ any $s$–$t$ cut. Then the net flow across the cut equals the value of the flow:
$$f(S,T)-f(T,S)=|f|,$$
where $f(S,T)=\sum_{u\in S,v\in T}f(u,v)$. Consequently $|f|\le c(S,T)$ for every flow and every cut: no flow is larger than any cut's capacity.`,
      idea: String.raw`Sum the conservation equations (net outflow $=0$) over all vertices of $S\setminus\{s\}$. Every edge with both ends in $S$ appears once with each sign and cancels, leaving exactly the edges between $S$ and $T$ plus the net outflow of $s$. Hence net flow across the cut is $|f|$. Since $f(S,T)\le c(S,T)$ and $f(T,S)\ge 0$, the bound $|f|\le c(S,T)$ follows.`,
      caption: String.raw`The flow is fixed; step the slider through all cuts. For each cut the forward flow (green) minus the backward flow (red) is the same number, the value. On the right each bar is a cut's capacity and the dot is its net flow (green, gold for the selected cut): every dot sits on the same level, below every bar. Switch on **leak** to break conservation at the sink end and watch the dots scatter, so the equality fails.`,
      deps: ['algo-11.2'],
      refs: ['CLRS 4e §24.2'],
      tags: ['flow', 'cuts'],
      viz(v) {
        const s = netStage(v, { weight: 1.4 });
        const bars = v.stage({ x: [0, 17], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: 'cut number', ylabel: 'capacity / net flow', weight: 0.9 });
        let seed = 5, base = [], cuts = [];
        const G = mkNet(v, s, 'A', { draggable: false });
        const setup = () => { const arcs = arcsOf(G); base = randomFlow(netIds(G), arcs, 's', 't', seed, 4); cuts = allCuts(netIds(G), arcs, 's', 't'); };
        setup();
        const k = v.slider('cut', 0, 15, 5, { int: true });
        const leak = v.toggle('leak', false);
        v.select('network', NET_SELECT, 'A', { onChange: (n) => { loadNet(G, n); setup(); k.set(Math.min(k.value, cuts.length - 1)); } });
        v.button('Another flow', () => { seed++; setup(); });
        const flow = () => { const f = base.slice(); if (leak.value) { const i = f.length - 1; f[i] += f[i] + 2 <= G.edges[i].w ? 2 : -Math.min(2, f[i]); } return f; };
        let nets = [];
        v.render(() => {
          const arcs = arcsOf(G), f = flow(), c = cuts[Math.min(k.value, cuts.length - 1)], S = c.S;
          const fw = G.edges.filter((e) => S.has(String(e.from)) && !S.has(String(e.to))), bw = G.edges.filter((e) => !S.has(String(e.from)) && S.has(String(e.to)));
          drawFlow(G, f, (fl) => ({
            nodeColor: (id) => (S.has(String(id)) ? 'blue' : 'orange'), nodeFill: (id) => (S.has(String(id)) ? 'blue' : null),
            edgeColor: (e) => (fw.includes(e) ? 'green' : bw.includes(e) ? 'red' : fl(e) > 0 ? 'faint' : 'faint'), edgeWidth: (e) => (fw.includes(e) || bw.includes(e) ? 4 : 1.6),
          }));
          nets = cuts.map((q) => cutNet(arcs, f, q.S));
          const top = Math.max(...cuts.map((q) => q.cap), ...nets.map(Math.abs), 1);
          bars.setView([0, cuts.length + 1], [0, top * 1.12]);
          bars.bars(cuts.map((q) => q.cap), { color: (val, i) => (i === k.value ? 'gold' : 'blue') });
          const val = flowValue(arcs, f, 's');
          bars.hline(val, { color: 'green', dash: true });
          cuts.forEach((q, i) => bars.dot(i + 1, nets[i], { r: i === k.value ? 6 : 4, color: i === k.value ? 'gold' : 'green' }));
        });
        v.legend([['green', 'forward flow $S\\to T$'], ['red', 'backward flow $T\\to S$'], ['blue', 'cut capacity (bars)', { area: true }], ['green', 'net flow across each cut (dots)', { dot: true }]]);
        v.readout(() => {
          const arcs = arcsOf(G), f = flow(), c = cuts[Math.min(k.value, cuts.length - 1)], S = c.S, a = sumOf(G.edges.filter((e) => S.has(String(e.from)) && !S.has(String(e.to))), (e) => f[G.edges.indexOf(e)]), b = sumOf(G.edges.filter((e) => !S.has(String(e.from)) && S.has(String(e.to))), (e) => f[G.edges.indexOf(e)]);
          const val = flowValue(arcs, f, 's'), same = nets.every((x) => Math.abs(x - val) < 1e-9);
          return `$S=${fmtCut(S)}$: $f(S,T)-f(T,S)=${num(a, 2)}-${num(b, 2)}=${num(a - b, 2)}$ · $|f|=${num(val, 2)}$ · $c(S,T)=${num(c.cap, 2)}$\n${same ? `all ${cuts.length} cuts carry net flow $|f|$, and $|f|\\le\\min c=${Math.min(...cuts.map((q) => q.cap))}$` : '**conservation is broken: the cuts disagree**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.4
    {
      num: '11.4',
      kind: 'Definition',
      name: 'Residual networks and augmenting paths',
      statement: String.raw`Given a flow $f$ in a network, the **residual network** $G_f$ has, for each edge $(u,v)$ of $G$, a **forward** residual edge $(u,v)$ of capacity $c(u,v)-f(u,v)$ when this is positive, and a **backward** residual edge $(v,u)$ of capacity $f(u,v)$ when this is positive. An **augmenting path** is an $s$–$t$ path in $G_f$; its **bottleneck** is the smallest residual capacity on it. Pushing $b$ units along an augmenting path with bottleneck $b$ (adding $b$ on forward edges and subtracting $b$ on backward edges) gives a flow of value $|f|+b$.`,
      idea: String.raw`Forward edges say how much more may be pushed along an edge; backward edges say how much already-pushed flow may be taken back, so an early choice never traps the algorithm. After the push every capacity constraint still holds because $b$ is at most each residual capacity, and conservation still holds because the path enters and leaves each interior vertex once. The value rises by $b$ since the path's first edge leaves $s$.`,
      caption: String.raw`Left: the network and its flow. Right: the residual network, with spare capacity in grey and "undo" edges dashed purple. Click residual edges from $s$ onwards to lay down a path (click its last edge again to undo a step), then press **Augment**: both pictures update, and the readout checks that the result is still a flow.`,
      deps: ['algo-11.1'],
      refs: ['CLRS 4e §24.2'],
      tags: ['flow'],
      viz(v) {
        const win = { x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300, weight: 1 };
        const s1 = v.stage({ ...win, title: 'Flow  (flow / capacity)' }), s2 = v.stage({ ...win, title: 'Residual network $G_f$' });
        let seed = 7, f = [], path = [];
        const G = mkNet(v, s1, 'A', { draggable: true });
        const Rg = v.graph(s2, { directed: true, weights: true, layout: 'none', nodes: G.nodes, edges: [], draggable: false, onClick: ({ edge }) => {
          if (!edge) return false;
          const key = rkey(edge), last = path[path.length - 1];
          if (last && rkey(last) === key) { path.pop(); return true; }
          const at = last ? last.to : 's', seen = new Set(['s', ...path.map((r) => r.to)]);
          if (String(edge.from) === at && !seen.has(String(edge.to))) path.push(edge);
          return true;
        } });
        const newF = () => { f = randomFlow(netIds(G), arcsOf(G), 's', 't', seed, 3); path = []; };
        newF();
        const done = () => path.length && path[path.length - 1].to === 't';
        v.button('Augment', () => { if (!done()) return; const b = Math.min(...path.map((r) => r.w)); f = pushPath(f, path, b); path = []; });
        v.button('Shortest path', () => { const p = findPath(resArcs(arcsOf(G), f), 's', 't', 'bfs'); path = p || []; });
        v.button('Clear path', () => { path = []; });
        v.button('New flow', () => { seed++; newF(); });
        v.render(() => {
          const arcs = arcsOf(G), res = resArcs(arcs, f);
          path = path.map((p) => res.find((r) => rkey(r) === rkey(p))).filter(Boolean);
          const pk = new Set(path.map(rkey)), pi = new Set(path.map((r) => r.i));
          drawFlow(G, f, (fl, idx) => ({ edgeColor: (e) => (pi.has(idx.get(e)) ? 'orange' : fl(e) > 0 ? 'accent' : 'faint') }));
          Rg.edges = res;
          Rg.draw({ edgeColor: (e) => (pk.has(rkey(e)) ? 'orange' : e.fwd ? 'muted' : 'purple'), edgeDash: (e) => !e.fwd, edgeLabel: (e) => num(e.w, 2), edgeWidth: (e) => (pk.has(rkey(e)) ? 4 : null) });
        });
        v.legend([['muted', 'forward slack  $c-f$'], ['purple', 'backward: undo  $f$', { dash: true }], ['orange', 'chosen path']]);
        v.readout(() => {
          const arcs = arcsOf(G), val = flowValue(arcs, f, 's');
          if (!path.length) return `$|f|=${num(val, 2)}$ · click residual edges leaving $s$ to build an augmenting path`;
          if (!done()) return `$|f|=${num(val, 2)}$ · path so far: $s\\to ${path.map((r) => r.to).join('\\to ')}$ (not yet at $t$)`;
          const b = Math.min(...path.map((r) => r.w)), g = pushPath(f, path, b);
          return `bottleneck $b=${num(b, 2)}$ · pushing gives $|f'|=${num(val, 2)}+${num(b, 2)}=${num(flowValue(arcs, g, 's'), 2)}$ and ${isFeasible(arcs, g, netIds(G), 's', 't') ? 'the result is still a flow' : '**the result is not a flow**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.5
    {
      num: '11.5',
      kind: 'Algorithm',
      name: 'Ford–Fulkerson method',
      statement: String.raw`**Ford–Fulkerson method.** Start from the zero flow. While the residual network $G_f$ contains an $s$–$t$ path $P$, push the bottleneck amount of $P$ through it. When no such path remains, return $f$. The method does not say *which* augmenting path to take; its correctness (the final flow is maximum, 11.6) does not depend on the choice, but the running time and even termination do (11.7–11.9). With integer capacities each augmentation raises the value by at least $1$, so there are at most $|f^*|$ rounds and the cost is $O(|E|\,|f^*|)$.`,
      idea: String.raw`Each augmentation keeps the flow feasible (11.4) and strictly increases its value, so progress is monotone. At the end, the set $S$ of vertices reachable from $s$ in $G_f$ has every outgoing edge saturated and every incoming edge empty, which makes the flow equal to the capacity of the cut $(S,V\setminus S)$; by 11.3 it is therefore a maximum flow (the theorem 11.6).`,
      caption: String.raw`Choose how the next path is picked (**fewest edges**, **depth-first**, or **fattest**) and step through. The orange path is the next augmentation with its bottleneck; the right panels show the residual network and the climbing flow value. The last step shades the vertices reachable from $s$ (teal) and marks the edges that leave them (red). Click an edge's capacity to edit it; the run restarts.`,
      deps: ['algo-11.4'],
      refs: ['CLRS 4e §24.2', 'Erickson Ch. 10'],
      tags: ['flow'],
      credit: 'L. R. Ford Jr. & D. R. Fulkerson, 1956',
      links: { doi: 'https://doi.org/10.4153/CJM-1956-045-5' },
      viz(v) {
        const win = { x: [0, 10], y: [0, 6], axes: false, equal: true, height: 290, weight: 1.15 };
        const s1 = v.stage({ ...win, title: 'Network  (flow / capacity)' }), s2 = v.stage({ ...win, title: 'Residual network $G_f$' });
        const meter = v.stage({ x: [0, 8], y: [0, 24], axes: 'box', gutter: true, height: 290, xlabel: 'augmentations', ylabel: 'flow value', weight: 0.7 });
        const rule = v.select('path choice', [{ value: 'bfs', label: 'fewest edges' }, { value: 'dfs', label: 'depth-first' }, { value: 'fat', label: 'fattest' }], 'bfs', { onChange: () => S.reset({ at: 'start' }) });
        const G = mkNet(v, s1, 'A', { editable: { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true }, onChange: () => S.reset({ at: 'start' }) });
        const Rg = v.graph(s2, { directed: true, weights: true, layout: 'none', nodes: G.nodes, edges: [], draggable: false });
        let run = null;
        const S = v.steps({ frames: () => { run = fordFulkerson(netIds(G), arcsOf(G), 's', 't', rule.value); return run.frames; }, code: FF_CODE, codeTitle: 'Ford–Fulkerson(G, s, t)', speed: 1, still: 5 });
        v.render(() => {
          const fr = S.frame; ffDraw(G, Rg, fr);
          const pts = S.frames.filter((q) => q.type === 'push' || q.type === 'init'), mx = Math.max(run.value, 1);
          meter.setView([-0.3, Math.max(pts.length, 4) + 0.3], [0, mx * 1.15]);
          meter.hline(run.value, { color: 'green', dash: true, alpha: 0.7 });
          const shown = pts.filter((q) => S.frames.indexOf(q) <= S.i);
          meter.path(shown.map((q, i) => [i, q.value]), { color: 'accent', width: 2 }); shown.forEach((q, i) => meter.dot(i, q.value, { r: 4, color: 'accent' }));
        });
        v.legend([['orange', 'augmenting path'], ['accent', 'carries flow'], ['purple', 'backward residual', { dash: true }], ['red', 'edges leaving the reachable set'], ['teal', 'reachable from $s$', { dot: true }]]);
        v.readout(() => { const f = S.frame; return `Flow value **${num(f.value, 2)}**${f.type === 'path' || f.type === 'push' ? ` · path ${f.path.map((r) => (r === f.path[0] ? `${r.from}→${r.to}` : `→${r.to}`)).join('')}, bottleneck **${num(f.bottleneck, 2)}** (augmentation ${f.k})` : ''}${f.type === 'done' ? ` · no augmenting path: reachable set $${fmtCut(f.S)}$ has cut capacity **${num(f.cap, 2)}** = the flow value` : ''}`; });
      },
    },
    // ------------------------------------------------------------------ 11.6
    {
      num: '11.6',
      kind: 'Theorem',
      name: 'Max-flow min-cut theorem',
      statement: String.raw`In every flow network with finite capacities the following three statements about a flow $f$ are equivalent:
(a) $f$ is a maximum flow;
(b) the residual network $G_f$ has no $s$–$t$ path;
(c) $|f|=c(S,T)$ for some $s$–$t$ cut $(S,T)$.
In particular, the value of a maximum flow equals the capacity of a minimum cut:
$$\max_f |f|=\min_{(S,T)}c(S,T).$$`,
      idea: String.raw`(a)⇒(b): an augmenting path would let us increase $f$. (b)⇒(c): let $S$ be the set reachable from $s$ in $G_f$; $t\notin S$ by (b). A forward edge leaving $S$ must be saturated and a backward edge entering $S$ must be empty, or its far end would be reachable; so 11.3 gives $|f|=f(S,T)-f(T,S)=c(S,T)-0$. (c)⇒(a): by 11.3 every flow has $|f'|\le c(S,T)=|f|$. The algorithm 11.5 shows existence: with integral capacities it terminates in situation (b).`,
      caption: String.raw`Slide the number of augmentations performed. While an augmenting path exists (orange) the flow value (gold line on the right) is still below the cheapest cut; every bar is the capacity of one of the $2^{n-2}$ cuts, and the value can never poke above the lowest. When the path runs out, the reachable set is shaded and the line lands exactly on a minimum cut, found by exhaustive search for comparison.`,
      deps: ['algo-11.3', 'algo-11.5'],
      refs: ['CLRS 4e §24.2', 'KT §7.2'],
      tags: ['flow', 'duality'],
      credit: 'Ford & Fulkerson, 1956; independently Elias, Feinstein & Shannon, 1956',
      links: { doi: 'https://doi.org/10.4153/CJM-1956-045-5' },
      viz(v) {
        const s = netStage(v, { weight: 1.3 });
        const bars = v.stage({ x: [0, 17], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: 'cuts, sorted by capacity', ylabel: 'capacity', weight: 0.9 });
        let run = null;
        const G = mkNet(v, s, 'A', { editable: { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true }, onChange: () => { recompute(); } });
        const k = v.slider('augmentations performed', 0, 8, 2, { int: true });
        v.select('network', NET_SELECT, 'A', { onChange: (n) => { loadNet(G, n); recompute(); } });
        function recompute() { run = fordFulkerson(netIds(G), arcsOf(G), 's', 't', 'bfs'); }
        recompute();
        const frameAt = (n) => (n >= run.steps.length ? run.frames[run.frames.length - 1] : run.frames.filter((q) => q.type === 'push' || q.type === 'init')[n]);
        v.render(() => {
          const arcs = arcsOf(G), n = Math.min(k.value, run.steps.length), fr = frameAt(n), atEnd = n >= run.steps.length;
          const res = fr.res, p = atEnd ? null : findPath(res, 's', 't', 'bfs');
          const view = atEnd ? fr : { ...fr, type: 'path', path: p || [] };
          ffDraw(G, null, view);
          const cuts = allCuts(netIds(G), arcs, 's', 't').sort((a, b) => a.cap - b.cap), mn = cuts[0].cap;
          bars.setView([0, cuts.length + 1], [0, Math.max(cuts[cuts.length - 1].cap, 1) * 1.12]);
          bars.bars(cuts.map((c) => c.cap), { color: (val) => (val === mn ? 'green' : 'blue') });
          bars.hline(fr.value, { color: atEnd ? 'green' : 'gold', width: 3 });
        });
        v.legend([['orange', 'augmenting path (flow can still grow)'], ['red', 'edges of the reachable-set cut'], ['teal', 'reachable from $s$', { dot: true }], ['green', 'minimum cuts (bars)', { area: true }]]);
        v.readout(() => {
          const arcs = arcsOf(G), n = Math.min(k.value, run.steps.length), fr = frameAt(n), mc = minCutBrute(netIds(G), arcs, 's', 't').cap;
          return n >= run.steps.length ? `After ${plural(n, 'augmentation')}: no augmenting path. $|f|=${num(fr.value, 2)}$, reachable-set cut $c(S,T)=${num(fr.cap, 2)}$, exhaustive minimum cut $=${num(mc, 2)}$ — all three agree.` : `After ${plural(n, 'augmentation')}: $|f|=${num(fr.value, 2)}<${num(mc, 2)}=$ minimum cut, so an augmenting path must (and does) exist.`;
        });
      },
    },
  ],
};
