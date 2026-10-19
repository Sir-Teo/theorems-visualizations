// Algorithms — Chapter 11: Network flow, matching and linear programming (items 11.7–11.13; 11.1–11.6 in ch11.js, 11.14–11.19 in ch11-c.js, 11.21–11.25 in ch11-d.js)
import { K, ids, plural, clamp, rngOf, sumOf, NETS, num, flowValue, cutCap, minCutBrute, resArcs, findPath, pathBottleneck, pushPath, fordFulkerson, FF_CODE, arcsOf, zeros, netStage, mkNet, loadNet, netIds, drawFlow, ffDraw, rkey, decompose, bipNet, matchingOf, matchBrute, hallBrute, coverBrute, bipNodes, bipRandom, LET, combos, R, TX } from './ch11.shared.js';

const NET_SELECT = [{ value: 'A', label: 'network A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }];
const PATHCOL = ['green', 'orange', 'purple', 'teal', 'pink', 'gold'];
const isInt = (x) => Math.abs(x - Math.round(x)) < 1e-9;
const EDIT = (cb) => ({ editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true });

// ---------------------------------------------------------------- bipartite presets for 11.10–11.12
const BIP = {
  aug: { label: 'perfect matching exists (needs re-routing)', nL: 5, nR: 5, E: [[0, 0], [0, 1], [1, 0], [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4]] },
  hall: { label: 'three vertices share two neighbours', nL: 5, nR: 5, E: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 2], [3, 3], [4, 3], [4, 4]] },
  rand: { label: 'random', nL: 6, nR: 6, E: null },
};
const bipPreset = (key, seed) => { const P = BIP[key]; return { nL: P.nL, nR: P.nR, E: P.E ? P.E.map((e) => e.slice()) : bipRandom(P.nL, P.nR, 0.33, seed) }; };
/** Max matching of a bipartite graph via the flow network: {net, run, match, Z (reachable set), left/right in Z}. */
function bipSolve(nL, nR, E) {
  const net = bipNet(nL, nR, E), run = fordFulkerson(net.ids, net.arcs, 's', 't', 'bfs');
  const match = matchingOf(net, E, run.f), Z = run.S;
  return { net, run, match, Z, ZL: net.L.map((x, i) => (Z.has(x) ? i : -1)).filter((i) => i >= 0), ZR: net.R.map((x, j) => (Z.has(x) ? j : -1)).filter((j) => j >= 0) };
}
const edgeKey = (l, r) => `${l}-${r}`;

export default {
  collection: 'algo',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.7
    {
      num: '11.7',
      kind: 'Theorem',
      name: 'Integrality theorem',
      statement: String.raw`If every capacity of a flow network is an integer, then the augmenting-path method (11.5) terminates, every flow it produces takes integer values on all edges, and in particular there is a maximum flow with integer values on every edge. More generally, if all capacities are integer multiples of $1/q$, so is every flow value produced.`,
      idea: String.raw`Induct on the number of augmentations. The zero flow is integral. If $f$ is integral, every residual capacity is a difference of integers, hence an integer, so the bottleneck $b$ is an integer and $f+b$ along the path is again integral. Each step raises the value by at least $1$ and the value is bounded by any cut capacity (11.3), so the method stops. The statement is false for real capacities in general: with an irrational capacity the produced flows take irrational values.`,
      caption: String.raw`Step through the augmentations with every capacity rounded to a multiple of $1/q$ (choose integers, halves or quarters); the bar chart records each bottleneck, and the dashed lines mark the multiples of $1/q$, where every step size lands. Choose **one is $3\sqrt2$** to break the hypothesis: an irrational bottleneck appears, and some flow values are no longer rational.`,
      deps: ['algo-11.5'],
      refs: ['KT §7.2', 'Erickson Ch. 10'],
      tags: ['flow'],
      viz(v) {
        const s = netStage(v, { height: 310, weight: 1.5 });
        const bars = v.stage({ x: [0, 8], y: [0, 10], axes: 'box', gutter: true, height: 310, xlabel: 'augmentation', ylabel: 'bottleneck $b$', weight: 0.8 });
        const base = NETS.A.arcs, G = mkNet(v, s, 'A', { draggable: true });
        const mode = v.select('capacities', [{ value: 'int', label: 'integers' }, { value: 'half', label: 'multiples of ½' }, { value: 'quarter', label: 'multiples of ¼' }, { value: 'irr', label: 'one is $3\\sqrt2$' }], 'int', { onChange: () => { setCaps(); S.reset({ at: 'start' }); } });
        const qOf = () => ({ int: 1, half: 2, quarter: 4, irr: 1 })[mode.value];
        function setCaps() { const q = qOf(); G.edges.forEach((e, i) => { e.w = base[i][2] + ((i * 7 + 3) % q) / q; }); if (mode.value === 'irr') G.edges[3].w = 3 * Math.SQRT2; }
        setCaps();
        let run = null;
        const S = v.steps({ frames: () => { run = fordFulkerson(netIds(G), arcsOf(G), 's', 't', 'bfs'); return run.frames; }, code: FF_CODE, codeTitle: 'Ford–Fulkerson(G, s, t)', speed: 1, still: 99 });
        v.render(() => {
          const fr = S.frame; ffDraw(G, null, fr, { net: { nodeColor: null } });
          const bs = run.steps.map((p) => p.b), done = S.frames.slice(0, S.i + 1).filter((q) => q.type === 'push').length, q = qOf();
          bars.setView([0, Math.max(bs.length, 4) + 1], [0, Math.max(...bs, 1) * 1.2]);
          for (let m = 0; m <= Math.max(...bs, 1) * 1.2 * q; m++) bars.hline(m / q, { color: 'grid', alpha: 0.7, width: 1 });
          bars.bars(bs.map((b, i) => (i < done ? b : 0)), { color: (b) => (isInt(b * q) ? 'accent' : 'red') });
        });
        v.legend([['orange', 'augmenting path'], ['accent', 'bottleneck on a multiple of $1/q$', { area: true }], ['red', 'bottleneck off the grid', { area: true }]]);
        v.readout(() => {
          const fr = S.frame, q = qOf(), all = fr.f.every((x) => isInt(x * q)), ints = fr.f.every(isInt);
          return `After ${plural(S.frames.slice(0, S.i + 1).filter((x) => x.type === 'push').length, 'augmentation')}: value **${num(fr.value, 3)}** · ${mode.value === 'irr' ? (all ? 'every edge flow is still on the grid' : '**some edge flows are irrational**') : `every edge flow is a multiple of $1/${q}$: **${all ? 'yes' : 'no'}**`}${q === 1 && mode.value === 'int' ? ` · integral: **${ints ? 'yes' : 'no'}**` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.8
    {
      num: '11.8',
      kind: 'Proposition',
      name: 'Bad augmenting paths: slow or non-terminating runs',
      statement: String.raw`The augmenting-path method with an unconstrained choice of paths can be very slow, and with irrational capacities it need not terminate.
(a) In the network with edges $s\to a$, $s\to b$, $a\to t$, $b\to t$ of capacity $C$ and $a\to b$ of capacity $1$, the maximum flow is $2C$, but the paths $s,a,b,t$ and $s,b,a,t$ (the second using the backward residual edge of $a\to b$) can be chosen alternately, each with bottleneck $1$, so $2C$ augmentations are made: a number exponential in the bit length of $C$.
(b) There is a six-vertex network with real capacities, including $1$ and $(\sqrt5-1)/2$, for which a particular infinite sequence of augmenting paths has flow values converging to a number strictly smaller than the maximum flow.`,
      idea: String.raw`In (a) the unit middle edge is crossed forwards by one path and "un-crossed" by the next, so each pair of paths adds just two units although two huge edges stay unsaturated. Choosing shortest paths instead needs only two augmentations (11.9). In (b) the bottlenecks form the geometric sequence $r,r^2,r^3,\dots$ with $r^2=1-r$ (so $r^{k}=r^{k+1}+r^{k+2}$): the residual capacities of the three special edges just cycle through $r^k,r^{k+1},0$, forever leaving a path, but the total pushed is the finite sum $1+2\sum_{k\ge1}r^k$.`,
      caption: String.raw`**Unit middle edge:** slide $C$ and step through; the adversarial rule alternates the two paths of bottleneck 1, so the number of augmentations is $2C$, while **shortest** finishes in two. **Irrational capacities:** the adversarial rule repeats a cycle of paths whose bottlenecks shrink like powers of $r$; after 30 augmentations the flow value (gold) is still short of the limit (red line), which itself is far below the true maximum (green). The run is cut off at 30 augmentations.`,
      deps: ['algo-11.5'],
      refs: ['Erickson §10.4, pp. 333–336'], sourceUrl: 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/Algorithms-JeffE.pdf',
      tags: ['flow', 'counterexample'],
      credit: 'Examples and proof: Erickson, Algorithms, §10.4, pp. 333–336; no priority claim is made here',
      links: { doi: 'https://doi.org/10.1016/0304-3975(95)00022-O' },
      viz(v) {
        const s = netStage(v, { height: 300, weight: 1.3 });
        const chart = v.stage({ x: [0, 31], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: 'augmentation', ylabel: 'flow value', weight: 1 });
        const rr = (Math.sqrt(5) - 1) / 2, M = 2;
        const SLOW = (C) => ({ pos: { s: [0.9, 3], a: [4.4, 5.1], b: [4.4, 0.9], t: [8.1, 3] }, arcs: [['s', 'a', C], ['s', 'b', C], ['a', 'b', 1], ['a', 't', C], ['b', 't', C]], seq: [['s', 'a', 'b', 't'], ['s', 'b', 'a', 't']], first: null });
        const ZW = { pos: { s: [0.7, 3], v1: [3.1, 5.2], v2: [3.1, 0.8], v4: [5.8, 5.2], v3: [5.8, 0.8], t: [8.6, 3] },
          arcs: [['s', 'v1', M], ['s', 'v2', M], ['s', 'v4', M], ['v2', 'v3', 1], ['v4', 'v3', rr], ['v2', 'v1', 1], ['v1', 't', M], ['v3', 't', M], ['v4', 't', M]],
          seq: [['s', 'v4', 'v3', 'v2', 'v1', 't'], ['s', 'v2', 'v3', 'v4', 't'], ['s', 'v4', 'v3', 'v2', 'v1', 't'], ['s', 'v1', 'v2', 'v3', 't']], first: ['s', 'v2', 'v3', 't'] };
        const ex = v.select('example', [{ value: 'slow', label: 'unit middle edge' }, { value: 'irr', label: 'irrational capacities' }], 'slow', { onChange: () => { C.el.hidden = ex.value === 'irr'; load(); } });
        const C = v.slider('capacity $C$', 1, 12, 5, { int: true, onChange: () => load() });
        const rule = v.select('path choice', [{ value: 'bad', label: 'adversarial' }, { value: 'bfs', label: 'shortest' }], 'bad', { onChange: () => S.reset({ at: 'start' }) });
        const def = () => (ex.value === 'slow' ? SLOW(C.value) : ZW);
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', nodes: [], edges: [], draggable: true });
        let N = null, run = null, maxf = 0, S = null;
        function load() { N = def(); G.set({ nodes: Object.entries(N.pos).map(([id, [x, y]]) => ({ id, x, y, notePos: id === 's' ? 'w' : id === 't' ? 'e' : 'n' })), edges: N.arcs.map((a) => a.slice()) }); if (S) S.reset({ at: 'start' }); }
        const ids = () => Object.keys(N.pos);
        function build() {
          const arcs = N.arcs, I = ids(); maxf = fordFulkerson(I, arcs, 's', 't', 'bfs').value;
          if (rule.value === 'bfs') { run = fordFulkerson(I, arcs, 's', 't', 'bfs'); return run.frames; }
          // adversarial: the prescribed node sequences, resolved to residual arcs, until none applies or 30 augmentations
          let f = zeros(arcs.length); const frames = [], cap = 30;
          const mk = (type, extra) => frames.push({ type, f: f.slice(), value: flowValue(arcs, f, 's'), res: resArcs(arcs, f), ...extra });
          mk('init', { note: 'Start from the zero flow.' });
          const resolve = (nodes) => { const res = resArcs(arcs, f), p = []; for (let k = 0; k + 1 < nodes.length; k++) { const a = res.find((x) => x.from === nodes[k] && x.to === nodes[k + 1]); if (!a) return null; p.push(a); } return p; };
          let k = 0;
          for (; k < (ex.value === 'slow' ? 4 * C.value : cap); k++) {
            const nodes = k === 0 && N.first ? N.first : N.seq[(N.first ? k - 1 : k) % N.seq.length], p = resolve(nodes);
            if (!p) break;
            const b = Math.min(...p.map((r) => r.w));
            if (b < 1e-12) break;
            mk('path', { path: p, bottleneck: b, k: k + 1, note: `Augmentation ${k + 1}: the path ${nodes.join('→')} has bottleneck ${num(b, 4)}.` });
            f = pushPath(f, p, b); mk('push', { path: p, bottleneck: b, k: k + 1, note: `Pushed ${num(b, 4)}: the value is ${num(flowValue(arcs, f, 's'), 4)}.` });
          }
          const left = findPath(resArcs(arcs, f), 's', 't', 'bfs');
          mk('end', { note: left ? `Stopped after ${k} augmentations: an augmenting path still exists (the flow is not maximum, and the process has not ended).` : `No augmenting path is left after ${k} augmentations.` });
          run = { frames, steps: frames.filter((q) => q.type === 'push'), value: flowValue(arcs, f, 's') };
          return frames;
        }
        load();
        S = v.steps({ frames: build, code: FF_CODE, codeTitle: 'Ford–Fulkerson(G, s, t)', speed: 4, still: 8 });
        v.render(() => {
          const fr = S.frame; ffDraw(G, null, { ...fr, S: fr.type === 'done' ? fr.S : null }, { net: { edgeLabel: (e) => `${num(fr.f[G.edges.indexOf(e)], 3)}/${num(e.w, 3)}` } });
          const pts = S.frames.filter((q) => q.type === 'push' || q.type === 'init'), shown = pts.filter((q) => S.frames.indexOf(q) <= S.i);
          const lim = ex.value === 'irr' ? 3 + 2 * rr : null, top = Math.max(maxf, 1) * 1.1;
          chart.setView([0, Math.max(pts.length, 6) + 0.5], [0, top]);
          chart.hline(maxf, { color: 'green', dash: true }); if (lim) chart.hline(lim, { color: 'red', dash: true });
          chart.path(shown.map((q, i) => [i, q.value]), { color: 'gold', width: 2.4 }); shown.forEach((q, i) => chart.dot(i, q.value, { r: 3.5, color: 'gold' }));
        });
        v.legend([['orange', 'augmenting path'], ['gold', 'flow value after each augmentation'], ['green', 'maximum flow', { dash: true }], ['red', 'limit of the endless run', { dash: true }]]);
        v.readout(() => {
          const n = S.frames.slice(0, S.i + 1).filter((q) => q.type === 'push').length, fr = S.frame;
          return `Augmentations so far: **${n}** · value **${num(fr.value, 4)}** of maximum **${num(maxf, 2)}**${ex.value === 'slow' ? ` · prediction: ${rule.value === 'bad' ? `$2C=${2 * C.value}$` : '2'} augmentations in total (this run: ${run.steps.length})` : rule.value === 'bad' ? ` · limit of the flow values: $3+2r=${num(3 + 2 * rr, 4)}<${num(maxf, 2)}$, $r=(\\sqrt5-1)/2$` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.9
    {
      num: '11.9',
      kind: 'Algorithm',
      name: 'Edmonds–Karp: shortest augmenting paths',
      statement: String.raw`The **Edmonds–Karp algorithm** is the Ford–Fulkerson method with every augmenting path chosen to have the fewest edges (found by breadth-first search in $G_f$). Then (i) the residual distance $\delta_f(s,v)$ of every vertex from $s$ never decreases during the run; (ii) each edge can be a *critical* edge (a bottleneck edge of the augmenting path) at most about $|V|/2$ times; hence there are $O(|V|\,|E|)$ augmentations, and the total time is $O(|V|\,|E|^2)$, whatever the capacities, even real ones.`,
      idea: String.raw`(i) A push only creates backward edges that run from a vertex at distance $d+1$ to one at distance $d$ (it lies on a shortest path), and such edges can never shorten a distance; so no distance decreases. (ii) When $(u,v)$ is critical it disappears from $G_f$ and has $\delta(v)=\delta(u)+1$. To become critical again it must first reappear, which requires a push along $(v,u)$ when $\delta(u)=\delta(v)+1$; by monotonicity $\delta(u)$ has then grown by at least $2$. Distances are below $|V|$, so each edge is critical $O(|V|)$ times; every augmentation makes some edge critical, which counts $O(|V||E|)$ augmentations. Each costs one BFS, $O(|E|)$.`,
      caption: String.raw`Step through the augmentations (a random network is a click away). The right panel plots, for every vertex, its distance from $s$ in the residual graph at each augmentation: every curve only goes up, never down. Critical edges (those that fill up) are red on the network, and the readout keeps the largest tally of times any one edge was critical, to compare with the $|V|/2$ bound.`,
      deps: ['algo-11.5', 'algo-8.5'],
      refs: ['Erickson §10.6, Lemmas 10.2–10.3, pp. 341–342'], sourceUrl: 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/Algorithms-JeffE.pdf',
      tags: ['flow'],
      credit: 'Algorithm and complete distance/bottleneck proof: Erickson, Algorithms, §10.6, pp. 341–342',
      links: { doi: 'https://doi.org/10.1145/321694.321699' },
      viz(v) {
        const s = netStage(v, { height: 300, weight: 1.3 });
        const ch = v.stage({ x: [0, 8], y: [0, 7], axes: 'box', gutter: true, height: 300, xlabel: 'augmentation $k$', ylabel: 'distance from $s$ in $G_f$', weight: 1 });
        let key = 'A', seed = 1;
        const G = mkNet(v, s, 'A', { draggable: true });
        v.select('network', NET_SELECT, 'A', { onChange: (k) => { key = k; loadNet(G, k); S.reset({ at: 'start' }); } });
        v.button('Random network', () => { seed++; key = `R${seed}`; loadNet(G, key); S.reset({ at: 'start' }); });
        let run = null, tally = new Map();
        const S = v.steps({ frames: () => {
          run = fordFulkerson(netIds(G), arcsOf(G), 's', 't', 'bfs');
          tally = new Map(); run.steps.forEach((st, i) => { for (const r of st.path) if (Math.abs(r.w - st.b) < 1e-9) { const kk = `${r.from}→${r.to}`; tally.set(kk, (tally.get(kk) || 0) + 1); } });
          return run.frames;
        }, code: ['f ← 0', 'while G_f has an s–t path:', '    P ← a path with the fewest edges (BFS in G_f)', '    push the bottleneck of P along P', 'return f'], codeTitle: 'Edmonds–Karp(G, s, t)', speed: 1, still: 3 });
        const COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        v.render(() => {
          const fr = S.frame, I = netIds(G), crit = new Set((fr.path || []).filter((r) => Math.abs(r.w - fr.bottleneck) < 1e-9).map((r) => r.i));
          ffDraw(G, null, fr, { net: { edgeColor: (e) => { const i = G.edges.indexOf(e); return fr.type !== 'done' && crit.has(i) ? 'red' : fr.type !== 'done' && (fr.path || []).some((r) => r.i === i) ? 'orange' : fr.f[i] > 0 ? 'accent' : 'faint'; }, nodeColor: null } });
          const steps = run.steps, shown = Math.min(steps.length, S.frames.slice(0, S.i + 1).filter((q) => q.type === 'path').length), n = I.length;
          ch.setView([0.5, Math.max(steps.length, 4) + 0.5], [0, n]);
          I.filter((x) => x !== 's').forEach((x, j) => {
            const pts = []; for (let k = 0; k < shown; k++) { const d = steps[k].dist[x]; if (d < Infinity) pts.push([k + 1, d + (j - 2) * 0.03]); }
            ch.path(pts, { color: COL[j % COL.length], width: 2 }); pts.forEach(([a, b]) => ch.dot(a, b, { r: 3, color: COL[j % COL.length] }));
          });
        });
        v.legend([['red', 'critical edge of the current path'], ['orange', 'other edges of the path'], ['accent', 'carries flow']]);
        v.readout(() => {
          const I = netIds(G), steps = run.steps, shown = Math.min(steps.length, S.frames.slice(0, S.i + 1).filter((q) => q.type === 'path').length);
          let mono = true; I.forEach((x) => { let last = 0; for (let k = 0; k < shown; k++) { const d = steps[k].dist[x]; if (d < last) mono = false; last = Math.max(last, d); } });
          const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
          return `Augmentation ${shown} of ${steps.length} · distances nondecreasing so far: **${mono ? 'yes' : 'NO'}** · most often critical: ${top ? `edge ${top[0]}, **${top[1]}** time${top[1] > 1 ? 's' : ''}` : '—'} (bound ≈ $|V|/2=${I.length / 2}$) · $|V||E|/2=${(I.length * G.edges.length) / 2}$ vs ${steps.length} augmentations`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.10
    {
      num: '11.10',
      kind: 'Algorithm',
      name: 'Maximum bipartite matching via flow',
      statement: String.raw`Let $H=(L\sqcup R,E)$ be bipartite. Build the network $N_H$: a source $s$ joined to every left vertex, a sink $t$ joined from every right vertex, every edge of $H$ directed from $L$ to $R$, all capacities $1$. Integral flows of $N_H$ correspond exactly to matchings of $H$, with $|f|=|M|$. So a maximum matching is found by running Ford–Fulkerson on $N_H$, in time $O(|V||E|)$ since the value is at most $\min(|L|,|R|)$; each augmenting path alternates between non-matching and matching edges, starting and ending at free vertices.`,
      idea: String.raw`An integral flow (11.7) uses each $s\to l$ edge at most once and each $r\to t$ edge at most once; by conservation each used left vertex sends its one unit through exactly one $H$-edge, and each right vertex receives at most one: that is a matching. Conversely a matching routes one unit along $s,l,r,t$ for every matched edge. An augmenting path in the residual graph goes forward along an unmatched edge, backward along a matched edge (un-matching it), forward again, and so on: it is exactly an alternating path, and pushing along it enlarges the matching by one.`,
      caption: String.raw`Click a **left** vertex and then a **right** vertex to add or remove an edge (or pick a preset), then step through the augmentations. Matched edges are bold green; the orange path alternates: unmatched edge forward, matched edge backward. The readout compares the result with an exhaustive search over all matchings.`,
      deps: ['algo-11.7', 'algo-11.6'],
      refs: ['CLRS 4e §24.3', 'KT §7.5'],
      tags: ['matching', 'flow'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340 });
        let nL = 5, nR = 5, E = bipPreset('aug').E, pick = null, seed = 1, net = null;
        const mkSpec = () => { net = bipNet(nL, nR, E); return { nodes: bipNodes(nL, nR, true), edges: net.arcs.map((a) => a.slice()) }; };
        const G = v.graph(s, { directed: true, layout: 'none', weights: true, ...mkSpec(), draggable: false, onClick: ({ node, id }) => {
          if (!node) return false; const k = String(id);
          if (k[0] === 'l') { pick = pick === k ? null : k; return true; }
          if (k[0] === 'r' && pick) { const l = +pick.slice(1), r = +k.slice(1), at = E.findIndex(([a, b]) => a === l && b === r); if (at >= 0) E.splice(at, 1); else E.push([l, r]); pick = null; reload(); return true; }
          return true;
        } });
        function reload() { G.set(mkSpec()); S.reset({ at: 'start' }); }
        v.select('graph', [{ value: 'aug', label: 'needs re-routing' }, { value: 'hall', label: 'no perfect matching' }, { value: 'rand', label: 'random' }], 'aug', { onChange: (k) => { const P = bipPreset(k, seed); nL = P.nL; nR = P.nR; E = P.E; pick = null; reload(); } });
        v.button('New random', () => { seed++; const P = bipPreset('rand', seed); nL = P.nL; nR = P.nR; E = P.E; pick = null; reload(); });
        const S = v.steps({ frames: () => fordFulkerson(net.ids, net.arcs, 's', 't', 'bfs').frames, code: ['M ← ∅   (the zero flow)', 'while the residual graph has an s–t path P:', '    P alternates: unmatched edge, matched edge, …', '    flip every edge of P (matched ↔ unmatched)', 'return M'], codeTitle: 'Matching by flow', speed: 1, still: 5 });
        v.render(() => {
          const fr = S.frame, idx = new Map(G.edges.map((e, i) => [e, i])), pk = new Set((fr.path || []).map((r) => r.i)), mid = (e) => String(e.from)[0] === 'l' && String(e.to)[0] === 'r';
          ffDraw(G, null, fr, { net: {
            edgeLabel: () => null,
            edgeColor: (e) => (fr.type !== 'done' && pk.has(idx.get(e)) ? 'orange' : fr.f[idx.get(e)] > 0.5 ? (mid(e) ? 'green' : 'muted') : 'faint'),
            edgeWidth: (e) => (fr.type !== 'done' && pk.has(idx.get(e)) ? 3.6 : fr.f[idx.get(e)] > 0.5 ? (mid(e) ? 4.6 : 2) : 1.4),
            nodeColor: (id) => (String(id) === pick ? 'gold' : null), nodeRing: (id) => (String(id) === pick ? 'gold' : null), nodeNote: null,
          } });
        });
        v.legend([['green', 'matched edge'], ['orange', 'augmenting (alternating) path'], ['faint', 'unmatched edge'], ['gold', 'selected left vertex', { dot: true }]]);
        v.readout(() => {
          const fr = S.frame, M = matchingOf(net, E, fr.f), best = matchBrute(nL, nR, E), done = fr.type === 'done';
          return `Matching size **${M.length}**${M.length ? ': ' + M.map(([l, r]) => `${l + 1}${LET(r)}`).join(', ') : ''}${fr.path ? ` · alternating path of ${plural(fr.path.length - 2, 'edge')} between $L$ and $R$` : ''}${done ? ` · no augmenting path: maximum. Exhaustive search over all matchings: **${best}** ${best === M.length ? '✓' : '✗'}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.11
    {
      num: '11.11',
      kind: 'Theorem',
      name: 'Hall’s theorem via max-flow min-cut',
      statement: String.raw`Let $H=(L\sqcup R,E)$ be a bipartite graph and write $N(X)$ for the set of neighbours of $X\subseteq L$. $H$ has a matching that covers every vertex of $L$ if and only if **Hall's condition** holds: $|N(X)|\ge|X|$ for every $X\subseteq L$. When it fails, the maximum matching has size $|L|-\max_X(|X|-|N(X)|)$.`,
      idea: String.raw`Necessity is clear: the matched partners of $X$ are $|X|$ distinct vertices of $N(X)$. For sufficiency, take the unit network of 11.10 and a minimum cut $(S,T)$, and let $X=L\cap S$. Raising the capacity of the middle edges to $\infty$ changes no flow value (each carries at most one unit anyway) but forces a finite cut to keep every edge leaving $X$ inside $S$, so $N(X)\subseteq S$ and the cut capacity is $(|L|-|X|)+|N(X)|$. If Hall's condition holds this is at least $|L|$, so by 11.6 the maximum flow, hence the matching, has size $|L|$. Otherwise the minimum cut itself exhibits a violating set $X$.`,
      caption: String.raw`The maximum matching is computed by the flow of 11.10. If it leaves some left vertex unmatched, the vertices reached from $s$ in the final residual graph are shaded: the red left vertices are the Hall violator $X$ and the orange right vertices are exactly $N(X)$, one fewer or more. Choose **pick a subset** to select your own $X$ and compare $|X|$ with $|N(X)|$; click a left then a right vertex in **edit edges** mode to change the graph.`,
      deps: ['algo-11.10', 'algo-11.6'],
      refs: ['KT §7.5'],
      tags: ['matching'],
      credit: 'P. Hall, 1935 (On representatives of subsets)',
      links: { doi: 'https://doi.org/10.1112/jlms/s1-10.37.26' },
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340 });
        let nL = 5, nR = 5, E = bipPreset('hall').E, pick = null, seed = 1, X = new Set(), sol = null;
        const spec = () => ({ nodes: bipNodes(nL, nR), edges: E.map(([l, r]) => [`l${l}`, `r${r}`]) });
        const mode = v.select('click', [{ value: 'edit', label: 'edit edges' }, { value: 'pick', label: 'pick a subset' }], 'pick');
        const G = v.graph(s, { layout: 'none', ...spec(), draggable: false, onClick: ({ node, id }) => {
          if (!node) return false; const k = String(id);
          if (mode.value === 'pick') { if (k[0] === 'l') { const i = +k.slice(1); if (X.has(i)) X.delete(i); else X.add(i); } return true; }
          if (k[0] === 'l') { pick = pick === k ? null : k; return true; }
          if (pick) { const l = +pick.slice(1), r = +k.slice(1), at = E.findIndex(([a, b]) => a === l && b === r); if (at >= 0) E.splice(at, 1); else E.push([l, r]); pick = null; G.set(spec()); }
          return true;
        } });
        v.select('graph', [{ value: 'aug', label: 'perfect' }, { value: 'hall', label: 'Hall fails' }, { value: 'rand', label: 'random' }], 'hall', { onChange: (k) => { const P = bipPreset(k, seed); nL = P.nL; nR = P.nR; E = P.E; pick = null; X = new Set(); G.set(spec()); } });
        v.button('New random', () => { seed++; const P = bipPreset('rand', seed); nL = P.nL; nR = P.nR; E = P.E; X = new Set(); G.set(spec()); });
        v.button('Clear subset', () => { X = new Set(); });
        const nb = (set) => { const out = new Set(); for (const [l, r] of E) if (set.has(l)) out.add(r); return out; };
        let info = {};
        v.render(() => {
          sol = bipSolve(nL, nR, E);
          const Lz = new Set(sol.ZL), Rz = new Set(sol.ZR), unmatchedL = nL - sol.match.length, viol = unmatchedL > 0, nX = nb(X);
          const mset = new Set(sol.match.map(([l, r]) => edgeKey(l, r)));
          info = { viol, Lz, Rz, hb: hallBrute(nL, E) };
          G.draw({
            edgeColor: (e) => (mset.has(edgeKey(+String(e.from).slice(1), +String(e.to).slice(1))) ? 'green' : 'faint'),
            edgeWidth: (e) => (mset.has(edgeKey(+String(e.from).slice(1), +String(e.to).slice(1))) ? 4.4 : 1.6),
            nodeFill: (id) => { const k = String(id), i = +k.slice(1); return viol && k[0] === 'l' && Lz.has(i) ? 'red' : viol && k[0] === 'r' && Rz.has(i) ? 'orange' : null; },
            nodeColor: (id) => { const k = String(id), i = +k.slice(1); return (k[0] === 'l' && X.has(i)) || (k[0] === 'r' && nX.has(i)) ? 'gold' : k === pick ? 'gold' : null; },
            nodeRing: (id) => { const k = String(id), i = +k.slice(1); return (k[0] === 'l' && X.has(i)) ? 'gold' : (k[0] === 'r' && nX.has(i)) ? 'gold' : null; },
          });
        });
        v.legend([['green', 'edge of a maximum matching'], ['red', 'Hall violator $X$', { dot: true }], ['orange', 'its neighbourhood $N(X)$', { dot: true }], ['gold', 'your subset and its neighbours', { dot: true }]]);
        v.readout(() => {
          const nXs = nb(X), m = sol.match.length, hb = info.hb;
          const mine = X.size ? `your $X$: $|X|=${X.size}$, $|N(X)|=${nXs.size}$ ${nXs.size < X.size ? '— **violates Hall**' : ''}\n` : '';
          if (!info.viol) return `${mine}Perfect matching of $L$ found ($|M|=${m}=|L|$); exhaustive check of all ${(1 << nL) - 1} nonempty subsets: Hall's condition holds ${hb.deficiency === 0 ? '✓' : '✗'}`;
          return `${mine}No matching covers $L$: $|M|=${m}$. Minimum cut gives $X=\\{${sol.ZL.map((i) => i + 1).join(',')}\\}$ with $N(X)=\\{${sol.ZR.map(LET).join(',')}\\}$: $|X|=${sol.ZL.length}>${sol.ZR.length}=|N(X)|$ · cut capacity $(|L|-|X|)+|N(X)|=${nL - sol.ZL.length + sol.ZR.length}=|M|$ · exhaustive worst deficiency ${hb.deficiency}: $|L|-${hb.deficiency}=${nL - hb.deficiency}$ ${nL - hb.deficiency === m ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.12
    {
      num: '11.12',
      kind: 'Theorem',
      name: 'König’s theorem: matchings and vertex covers',
      statement: String.raw`In a bipartite graph the size of a maximum matching equals the size of a minimum vertex cover:
$$\nu(H)=\tau(H),$$
where a **vertex cover** is a set of vertices touching every edge. (In any graph $\nu\le\tau$, since each matched edge needs its own cover vertex; bipartiteness makes this tight. For odd cycles it fails: a triangle has $\nu=1$, $\tau=2$.)`,
      idea: String.raw`Take a maximum matching $M$ (a maximum flow in the unit network) and let $Z$ be the set of vertices reachable from $s$ in the final residual graph, that is, reachable from the unmatched left vertices by alternating paths. Put $K=(L\setminus Z)\cup(R\cap Z)$. An edge $l r$ with $l\in Z$ and $r\notin Z$ would be an unmatched edge leaving $Z$ with spare capacity — impossible — so every edge is covered. Every vertex of $K$ is matched (otherwise there would be an augmenting path), and no matched edge has both ends in $K$; so $|K|=|M|$. This is the minimum cut of 11.6 read off as vertices: $\min$ cut $=\max$ flow becomes $\tau=\nu$.`,
      caption: String.raw`Bold green edges are a maximum matching. The red vertices are the König cover $K$ read off the residual reachability set (teal ring: $Z$); every edge touches a red vertex and the count equals the matching size. Click vertices to build **your own** cover: uncovered edges turn into dashed red lines, and you can never get below $|M|$. The readout compares with exhaustive search over all vertex subsets.`,
      deps: ['algo-11.10', 'algo-11.6'],
      refs: ['Erickson Ch. 11', 'König, Graphok és mátrixok, Mat. Fiz. Lapok38 (1931), pp.116–119', 'Egerváry, Matrixok kombinatorius tulajdonságairól, Mat. Fiz. Lapok38 (1931), pp.16–28, especially pp.16–17 and §§1–2'],
      tags: ['matching', 'duality'],
      credit: 'D. König, 1931; J. Egerváry, 1931 (new proof and weighted generalization, explicitly crediting König)',
      links: { source: 'https://real-j.mtak.hu/7307/1/MTA_MatematikaiEsPhysikaiLapok_38.pdf', translation: 'https://arxiv.org/abs/2009.03780' },
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340 });
        let nL = 5, nR = 5, E = bipPreset('hall').E, seed = 1, mine = new Set();
        const spec = () => ({ nodes: bipNodes(nL, nR), edges: E.map(([l, r]) => [`l${l}`, `r${r}`]) });
        const G = v.graph(s, { layout: 'none', ...spec(), draggable: false, onClick: ({ node, id }) => { if (!node) return false; const k = String(id); if (mine.has(k)) mine.delete(k); else mine.add(k); return true; } });
        const showK = v.toggle('show König cover', true);
        v.select('graph', [{ value: 'aug', label: 'perfect' }, { value: 'hall', label: 'no perfect matching' }, { value: 'rand', label: 'random' }], 'hall', { onChange: (k) => { const P = bipPreset(k, seed); nL = P.nL; nR = P.nR; E = P.E; mine = new Set(); G.set(spec()); } });
        v.button('New random', () => { seed++; const P = bipPreset('rand', seed); nL = P.nL; nR = P.nR; E = P.E; mine = new Set(); G.set(spec()); });
        v.button('Clear my cover', () => { mine = new Set(); });
        let sol = null, Kset = new Set();
        v.render(() => {
          sol = bipSolve(nL, nR, E);
          Kset = new Set([...Array(nL).keys()].filter((i) => !sol.ZL.includes(i)).map((i) => `l${i}`).concat(sol.ZR.map((j) => `r${j}`)));
          const mset = new Set(sol.match.map(([l, r]) => edgeKey(l, r)));
          const unc = (e) => !mine.has(String(e.from)) && !mine.has(String(e.to)), eid = (e) => edgeKey(+String(e.from).slice(1), +String(e.to).slice(1));
          G.draw({
            edgeColor: (e) => (mine.size && unc(e) ? 'red' : mset.has(eid(e)) ? 'green' : 'faint'), edgeWidth: (e) => (mset.has(eid(e)) ? 4.4 : mine.size && unc(e) ? 2.6 : 1.6), edgeDash: (e) => !!mine.size && unc(e) && !mset.has(eid(e)),
            nodeFill: (id) => (showK.value && Kset.has(String(id)) ? 'red' : null),
            nodeColor: (id) => (mine.has(String(id)) ? 'gold' : sol.Z.has(String(id)) ? 'teal' : null), nodeRing: (id) => (mine.has(String(id)) ? 'gold' : sol.Z.has(String(id)) ? 'teal' : null),
          });
        });
        v.legend([['green', 'maximum matching'], ['red', 'König cover $K$', { dot: true }], ['teal', '$Z$: reachable by alternating paths', { dot: true }], ['gold', 'your cover', { dot: true }]]);
        v.readout(() => {
          const tau = coverBrute(nL, nR, E), cov = E.every(([l, r]) => Kset.has(`l${l}`) || Kset.has(`r${r}`)), myOK = E.every(([l, r]) => mine.has(`l${l}`) || mine.has(`r${r}`));
          return `$|M|=${sol.match.length}$ · König cover $|K|=${Kset.size}$ covers every edge: ${cov ? '✓' : '✗'} · minimum vertex cover by exhaustive search $\\tau=${tau}$ ${tau === sol.match.length ? '✓' : '✗'}\nYour cover: ${mine.size} vertices, ${myOK ? 'covers all edges' : `**${E.filter(([l, r]) => !mine.has(`l${l}`) && !mine.has(`r${r}`)).length} edges uncovered**`}${myOK && mine.size < sol.match.length ? ' — impossible!' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.13
    {
      num: '11.13',
      kind: 'Theorem',
      name: 'Menger’s theorem: disjoint paths and cuts',
      statement: String.raw`Let $G$ be a directed graph and $s\ne t$ vertices. (a) The maximum number of pairwise **edge-disjoint** $s$–$t$ paths equals the minimum number of edges whose removal destroys all $s$–$t$ paths. (b) If $s$ and $t$ are not joined by an edge, the maximum number of **internally vertex-disjoint** $s$–$t$ paths equals the minimum number of vertices (other than $s,t$) whose removal destroys all $s$–$t$ paths.`,
      idea: String.raw`(a) Give every edge capacity $1$. Integral flows (11.7) of value $k$ decompose into $k$ edge-disjoint paths, and a cut of capacity $c$ is a set of $c$ edges that separates; 11.6 says the two numbers agree. (b) Split each internal vertex $v$ into $v_{in}\to v_{out}$ of capacity $1$, with the edges entering $v_{in}$ and leaving $v_{out}$: disjoint paths in the new graph are vertex-disjoint paths in the old one, and a minimum cut consists of unit edges which may be taken to be split edges, i.e. vertices.`,
      caption: String.raw`Choose $s$ and $t$ and the type of disjointness. The integral maximum flow is decomposed into paths drawn in distinct colours; the dashed red edges (or red-ringed vertices) are a separating set of the same size, found by exhaustive search over all candidate sets of that size, and a second search confirms that nothing smaller separates. The hub $d$ is a single vertex through which three edge-disjoint routes pass: switch type and watch the count drop, with the separating set changing from three edges to a single vertex.`,
      deps: ['algo-11.7', 'algo-11.6'],
      refs: ['KT §7.6', 'Erickson Ch. 11'],
      tags: ['flow', 'connectivity'],
      credit: 'K. Menger, 1927 (Zur allgemeinen Kurventheorie)',
      links: { doi: 'https://doi.org/10.4064/fm-10-1-96-115' },
      viz(v) {
        const POS = { a: [0.8, 3], b: [2.9, 5.2], c: [2.9, 0.8], d: [5.2, 3], e: [7.2, 5.2], f: [7.2, 0.8], g: [9.0, 3] };
        const EDG = [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'd'], ['c', 'd'], ['d', 'e'], ['d', 'f'], ['d', 'g'], ['e', 'g'], ['f', 'g'], ['e', 'f'], ['b', 'e']];
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { directed: true, layout: 'none', nodes: Object.entries(POS).map(([id, [x, y]]) => ({ id, x, y })), edges: EDG.map((e) => e.slice()), draggable: true });
        const VS = Object.keys(POS).map((x) => ({ value: x, label: x }));
        const src = v.select('source $s$', VS, 'a'), snk = v.select('sink $t$', VS, 'g');
        const kind = v.select('disjoint', [{ value: 'edge', label: 'edge-disjoint' }, { value: 'vertex', label: 'vertex-disjoint' }], 'edge');
        const cache = new Map();
        function solve(sv, tv, mode) {
          const key = `${sv}${tv}${mode}`; if (cache.has(key)) return cache.get(key);
          const E = EDG, m = E.length; let arcs, I, edgeOf;
          if (mode === 'edge') { I = Object.keys(POS); arcs = E.map(([a, b]) => [a, b, 1]); edgeOf = E.map((_, i) => i); }
          else {
            const mid = Object.keys(POS).filter((x) => x !== sv && x !== tv); I = [sv, tv, ...mid.flatMap((x) => [`${x}i`, `${x}o`])]; arcs = []; edgeOf = [];
            mid.forEach((x) => { arcs.push([`${x}i`, `${x}o`, 1]); edgeOf.push(-1); });
            E.forEach(([a, b], i) => { const u = a === sv ? sv : a === tv ? null : `${a}o`, w = b === tv ? tv : b === sv ? null : `${b}i`; if (u && w) { arcs.push([u, w, 1]); edgeOf.push(i); } });
          }
          const run = fordFulkerson(I, arcs, sv, tv, 'bfs'), val = run.value, paths = decompose(arcs, run.f, sv, tv);
          const pe = paths.map((p) => p.arcs.map((i) => edgeOf[i]).filter((i) => i >= 0));
          const adj = (rem) => { const ok = new Set([sv]), q = [sv]; for (let h = 0; h < q.length; h++) E.forEach(([a, b], i) => { if (a === q[h] && !ok.has(b) && !(mode === 'edge' ? rem.has(i) : rem.has(b))) { ok.add(b); q.push(b); } }); return ok.has(tv); };
          const pool = mode === 'edge' ? E.map((_, i) => i) : Object.keys(POS).filter((x) => x !== sv && x !== tv);
          let sep = null, smaller = false;
          const direct = E.some(([a, b]) => a === sv && b === tv);
          if (!(mode === 'vertex' && direct)) {
            for (let k = 0; k < val && !smaller; k++) for (const c of combos(pool.length, k)) if (!adj(new Set(c.map((i) => pool[i])))) { smaller = true; break; }
            if (val > 0 && !smaller) for (const c of combos(pool.length, val)) if (!adj(new Set(c.map((i) => pool[i])))) { sep = c.map((i) => pool[i]); break; }
          }
          const out = { val, pe, sep, smaller, direct, reach: val > 0 || mode === 'edge' };
          cache.set(key, out); return out;
        }
        v.render(() => {
          const sv = src.value, tv = snk.value, mode = kind.value;
          if (sv === tv) { G.draw({}); return; }
          const R = solve(sv, tv, mode), of = new Map(); R.pe.forEach((p, k) => p.forEach((i) => of.set(i, k)));
          const sepE = new Set(mode === 'edge' && R.sep ? R.sep : []), sepV = new Set(mode === 'vertex' && R.sep ? R.sep : []), pv = new Map();
          R.pe.forEach((p, k) => p.forEach((i) => { pv.set(EDG[i][0], k); pv.set(EDG[i][1], k); }));
          G.draw({
            edgeColor: (e) => { const i = EDG.findIndex(([a, b]) => a === e.from && b === e.to); return sepE.has(i) ? 'red' : of.has(i) ? PATHCOL[of.get(i) % PATHCOL.length] : 'faint'; },
            edgeWidth: (e) => { const i = EDG.findIndex(([a, b]) => a === e.from && b === e.to); return of.has(i) ? 4.2 : sepE.has(i) ? 3 : 1.5; },
            edgeDash: (e) => sepE.has(EDG.findIndex(([a, b]) => a === e.from && b === e.to)),
            nodeColor: (id) => (id === sv ? 'green' : id === tv ? 'orange' : sepV.has(String(id)) ? 'red' : null), nodeFill: (id) => (id === sv ? 'green' : id === tv ? 'orange' : null),
            nodeRing: (id) => (sepV.has(String(id)) ? 'red' : null),
          });
        });
        v.legend([['green', 'disjoint paths (one colour each)'], ['red', 'separating edges or vertices', { dash: true }]]);
        v.readout(() => {
          const sv = src.value, tv = snk.value, mode = kind.value;
          if (sv === tv) return 'Choose different vertices for $s$ and $t$.';
          const R = solve(sv, tv, mode);
          if (mode === 'vertex' && R.direct) return `$s$ and $t$ are joined by an edge: no vertex set separates them (the vertex version of the theorem assumes non-adjacent $s,t$). Disjoint paths: ${R.val}.`;
          const what = mode === 'edge' ? 'edges' : 'vertices';
          if (R.val === 0) return `No path from $s$ to $t$: 0 disjoint paths, and the empty set separates.`;
          return `**${R.val}** ${mode}-disjoint path${R.val > 1 ? 's' : ''} · a separating set of ${R.val} ${what}: ${R.sep ? (mode === 'edge' ? R.sep.map((i) => EDG[i].join('→')).join(', ') : R.sep.join(', ')) : 'none found'} · nothing smaller separates: **${R.smaller ? '✗ (a smaller set exists!)' : '✓'}** (exhaustive)`;
        });
      },
    },
  ],
};
