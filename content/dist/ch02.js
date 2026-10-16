// Distributed Computing — Chapter 2: Basic network algorithms (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
import { hash01, clamp, range, plural, log2, ringXY, ringHop, drawRingEdges, floodEcho, asyncBF, dijkstraDist, ringIds, lcr, lcrCount, hs, orderClasses } from './ch02.shared.js';

const PAL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'blue'];

export default {
  collection: 'dist',
  chapter: 2,
  title: 'Basic network algorithms',
  summary: String.raw`Many tasks reduce to spreading information and breaking symmetry. Flooding builds spanning trees for broadcast and convergecast, and asynchronous Bellman–Ford computes shortest paths. Electing a leader in a ring is impossible among identical processes but costs $\Theta(n\log n)$ messages when identifiers can be compared; randomization breaks symmetry where determinism cannot. Synchronizers let synchronous algorithms run on asynchronous networks, and diffusing computations can detect their own termination.`,
  items: [
    // ------------------------------------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Algorithm', name: 'Flooding, broadcast and convergecast',
      statement: String.raw`In a connected network a designated root $r$ starts by sending a message to all its neighbours; every other process, on the first message it receives, remembers the sender as its *parent* and forwards the message to all remaining neighbours. Each message is answered exactly once: with a *reject* if the receiver already has a parent, or, from a process whose whole subtree has answered, with the sum of the values held in that subtree. Then (a) the parent pointers form a spanning tree of the network rooted at $r$, (b) the root eventually learns the sum of all values, and (c) with $n$ processes and $m$ edges exactly $2m-(n-1)$ messages are flooded and the total, answers included, is $2\bigl(2m-n+1\bigr)$. No bound on delays is needed for correctness; the tree itself depends on the delays.`,
      idea: String.raw`A process is reached as soon as some path of channels from the root delivers a message, so every process of the component adopts a parent; a parent always received the message strictly earlier, so the pointers cannot form a cycle and give a tree. A process answers its parent only after every message it sent has been answered, which is an induction up the tree from the leaves: each subtree sum is complete when it is sent. Each edge carries a flood in both directions except at the parent, which saves one message per tree edge. This builds on the message-passing model of 1.1.`,
      caption: String.raw`Orange tokens flood outwards, red ones are rejections, green ones carry subtree sums towards the root. The tree (green edges) is whichever messages arrive first, so change the *delay spread* or press *new delays* and it changes. Drag nodes, switch to *pick source* and click a node to move the root, or edit the graph; delete an edge to disconnect a node and watch it stay unreached. The right panel counts reached and finished processes over time.`,
      deps: ['dist-1.1'], refs: ['Lynch §15.3', 'Attiya–Welch ch. 2'], tags: ['broadcast', 'spanning tree', 'convergecast'],
      scope: String.raw`Reliable channels and no failures; the root must be in the same connected component as the processes it should reach. The message count assumes that every flooded message is answered once (the echo variant).`,
      viz(v) {
        const sN = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 350, title: 'network (value of each process below it)', weight: 1.35, minWidth: 300 });
        const sT = v.stage({ x: [0, 16], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time', ylabel: 'processes', height: 350, title: 'progress', weight: 1, minWidth: 250 });
        const mode = v.select('click', [{ value: 'src', label: 'pick source' }, { value: 'edit', label: 'edit graph' }], 'src');
        const spread = v.slider('delay spread', 0, 1, 0.6, { step: 0.05 });
        let seed = 1, root = 0;
        v.button('new delays', () => { seed++; });
        const G = v.graph(sN, {
          editable: true, directed: false, layout: 'none', r: 16, fontSize: 13, notePos: 's',
          nodes: [{ id: 0, x: 1.2, y: 3.0 }, { id: 1, x: 3.2, y: 5.0 }, { id: 2, x: 3.4, y: 1.0 }, { id: 3, x: 5.2, y: 3.2 }, { id: 4, x: 6.6, y: 5.0 }, { id: 5, x: 6.8, y: 1.2 }, { id: 6, x: 8.8, y: 3.4 }, { id: 7, x: 5.0, y: 5.4 }, { id: 8, x: 8.9, y: 5.2 }],
          edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 7], [3, 4], [3, 5], [4, 6], [5, 6], [4, 8], [7, 4], [2, 5]],
          onClick: (c) => { if (mode.value !== 'src') return undefined; const id = c.id ?? (c.node && c.node.id); if (id != null) { root = id; v.invalidate(); } return true; },
        });
        let key = '', run = null, adj = null, idx = null;
        const val = (u) => ((idx.get(u) * 5 + 3) % 9) + 1;
        const compute = () => {
          if (!G.has(root)) root = G.nodes.length ? G.nodes[0].id : 0;
          idx = new Map(G.nodes.map((n, i) => [n.id, i]));
          adj = new Map(G.nodes.map((n) => [n.id, []]));
          for (const e of G.edges) if (adj.has(e.from) && adj.has(e.to) && e.from !== e.to) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
          const k = JSON.stringify([[...adj], root, spread.value, seed]);
          if (k !== key) {
            key = k;
            const d = (a, b) => { const i = idx.get(a), j = idx.get(b); return 1 + spread.value * 1.4 * (hash01(seed, Math.min(i, j), Math.max(i, j)) - 0.5); };
            run = floodEcho(adj, root, d, val);
          }
          return run;
        };
        v.animate((t) => {
          compute();
          const R = run, n = G.nodes.length;
          const treeEdge = (e) => (R.parent.get(e.to) === e.from && R.arrive.get(e.to) <= t) || (R.parent.get(e.from) === e.to && R.arrive.get(e.from) <= t);
          G.draw({
            nodeLabel: (id) => String(id), nodeNote: (id) => (R.done.has(id) && R.done.get(id) <= t ? `Σ=${R.sum.get(id)}` : String(val(id))), noteColor: (id) => (R.done.has(id) && R.done.get(id) <= t ? 'green' : 'ink'),
            nodeFill: (id) => (R.done.has(id) && R.done.get(id) <= t ? 'green' : R.arrive.has(id) && t - R.arrive.get(id) < 0.5 ? 'gold' : null),
            nodeColor: (id) => (R.arrive.has(id) && R.arrive.get(id) <= t ? 'accent' : 'faint'), nodeRing: (id) => (id === root ? 'gold' : null),
            edgeColor: (e) => (treeEdge(e) ? 'green' : 'faint'), edgeWidth: (e) => (treeEdge(e) ? 3.4 : 1.5),
          });
          for (const m of R.msgs) {
            if (m.ts > t || m.tr <= t) continue;
            const a = G.node(m.from), b = G.node(m.to); if (!a || !b) continue;
            const f = (t - m.ts) / (m.tr - m.ts), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ox = (-dy / L) * 0.2, oy = (dx / L) * 0.2;
            const col = m.kind === 'flood' ? 'orange' : m.kind === 'reject' ? 'red' : 'green', px = a.x + dx * f + ox, py = a.y + dy * f + oy;
            sN.dot(px, py, { r: 6.5, color: col, fill: true });
            if (m.kind === 'value') sN.text(String(m.val), px, py + 0.34, { size: 11, color: 'green', align: 'center', halo: true });
          }
          // progress panel
          sT.setView([0, Math.max(8, Math.ceil(R.end + 1))], [0, n + 0.6]);
          sT.fn((x) => [...R.arrive.values()].filter((a) => a <= x).length, { color: 'accent', width: 2.4, n: 300 });
          sT.fn((x) => [...R.done.values()].filter((a) => a <= x).length, { color: 'green', width: 2.4, n: 300 });
          sT.hline(n, { color: 'faint', dash: true });
          sT.vline(t, { color: 'gold', width: 1.6 });
        }, { period: 22, still: 9 });
        v.legend([['orange', 'flood', { dot: true }], ['red', 'reject', { dot: true }], ['green', 'subtree sum', { dot: true }], ['accent', 'processes reached'], ['green', 'processes finished']]);
        v.readout(() => {
          compute(); const t = v.t, R = run, n = G.nodes.length;
          const sent = (k) => R.msgs.filter((m) => m.kind === k && m.ts <= t).length;
          const nr = R.reached.length, mr = G.edges.filter((e) => R.arrive.has(e.from) && R.arrive.has(e.to) && e.from !== e.to).length;
          const F = R.msgs.filter((m) => m.kind === 'flood').length, expF = 2 * mr - (nr - 1), total = R.msgs.length, trueSum = R.reached.reduce((s, u) => s + val(u), 0);
          const rootKnows = R.rootDone <= t;
          return `t = ${v.fix(t, 1)} · sent so far: **${sent('flood')}** flood, **${sent('reject')}** reject, **${sent('value')}** sum messages · reached ${nr} of ${n} processes\n`
            + `Whole run: flood messages $${F}$ vs $2m-(n-1)=2\\cdot${mr}-${nr - 1}=${expF}$ ${F === expF ? '✓' : '✗'} · total $${total}=2F$ ${total === 2 * F ? '✓' : '✗'} · root's sum $${R.sum.get(root)}$ vs true sum $${trueSum}$ ${R.sum.get(root) === trueSum ? '✓' : '✗'}${rootKnows ? ' (root already knows it)' : ''} · done at $t=${v.fix(R.rootDone, 1)}$`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Algorithm', name: 'Breadth-first search and asynchronous Bellman–Ford',
      statement: String.raw`Let a connected network have a source $s$ and non-negative edge weights $w(e)$. Every process keeps an estimate $d$ of its distance from $s$, initially $\infty$ ($0$ at $s$). Whenever its estimate decreases a process sends the new estimate plus the edge weight to every neighbour, and a received value that is smaller than the current estimate becomes the new estimate. In an asynchronous network with arbitrary finite delays the estimates converge to the true shortest-path distances and the algorithm then stops; the parent pointers form a shortest-path tree. With unit weights (breadth-first search) a process changes its estimate at most $n-1$ times, so at most $O(n\,|E|)$ messages are sent.`,
      idea: String.raw`Every estimate is the length of some real path from $s$, so it can never be smaller than the true distance, and estimates only decrease and are bounded below, so the process halts. At the end the usual Bellman–Ford inequality $d(v)\le d(u)+w(uv)$ holds for every edge, since otherwise a message would still be in flight or an improvement pending; together with the lower bound this forces $d=\mathrm{dist}$. The price of asynchrony is overshoot: a long path may win the race, a process announces a too-large estimate, and later corrections ripple through its neighbours. This is the relaxation step of Bellman–Ford (algo-9.6) driven by message arrival instead of rounds.`,
      caption: String.raw`Click an edge to slow it down (dashed, delay times 8), or press the adversary button to slow exactly the edges of the true shortest-path tree. Left: current estimates; orange tokens are announcements in flight. Right: each process's estimate over time as a staircase; the hollow dot at the right edge is the true distance. Slow the tree edges and watch estimates overshoot and later fall; switch between hop count (BFS) and weights.`,
      deps: ['dist-2.1', 'algo-9.6'], refs: ['Lynch §15.4'], tags: ['shortest paths', 'bfs', 'relaxation'],
      scope: String.raw`Non-negative weights, reliable channels, any finite delays; the process count bound $n-1$ changes per process holds for hop counts only (with weights the number of corrections depends on the schedule).`,
      viz(v) {
        const sN = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 350, title: 'network (estimate beside each process)', weight: 1.3, minWidth: 300 });
        const sT = v.stage({ x: [0, 30], y: [0, 14], axes: 'box', gutter: true, xlabel: 'time', ylabel: 'estimate', height: 350, title: 'estimates over time', weight: 1, minWidth: 260 });
        const metric = v.select('metric', [{ value: 'hops', label: 'hops (BFS)' }, { value: 'w', label: 'weights' }], 'w');
        const slow = new Set(['0-1']);
        const G = v.graph(sN, {
          directed: false, layout: 'none', r: 15, fontSize: 13, notePos: 's', editable: false, weights: true,
          nodes: [{ id: 0, x: 1, y: 3 }, { id: 1, x: 3, y: 5 }, { id: 2, x: 3, y: 1 }, { id: 3, x: 5.2, y: 3 }, { id: 4, x: 7, y: 5 }, { id: 5, x: 7, y: 1 }, { id: 6, x: 9, y: 3 }, { id: 7, x: 5.2, y: 5.3 }],
          edges: [[0, 1, 1], [0, 2, 4], [1, 3, 5], [2, 3, 1], [1, 7, 2], [7, 4, 6], [3, 4, 2], [3, 5, 4], [4, 6, 1], [5, 6, 2], [2, 5, 8]],
          onClick: (c) => { if (c.edge) { const k = `${c.edge.from}-${c.edge.to}`; if (slow.has(k)) slow.delete(k); else slow.add(k); v.invalidate(); return true; } return undefined; },
        });
        const nodes = G.nodes.map((n) => n.id), COL = (id) => PAL[id % PAL.length];
        const edgeList = () => G.edges.map((e) => ({ a: e.from, b: e.to, w: e.w, slow: slow.has(`${e.from}-${e.to}`) }));
        v.button('slow the shortest-path tree', () => {
          const unit = metric.value === 'hops', d = dijkstraDist(nodes, edgeList(), 0, unit); slow.clear();
          for (const e of G.edges) { const w = unit ? 1 : e.w; if (Math.abs(d.get(e.from) + w - d.get(e.to)) < 1e-9 || Math.abs(d.get(e.to) + w - d.get(e.from)) < 1e-9) slow.add(`${e.from}-${e.to}`); }
        });
        v.button('clear slow links', () => { slow.clear(); });
        let key = '', run = null, truth = null;
        const compute = () => {
          const k = JSON.stringify([[...slow].sort(), metric.value]);
          if (k !== key) { key = k; const unit = metric.value === 'hops'; run = asyncBF(nodes, edgeList(), 0, { unit, seed: 3, slowFactor: 8 }); truth = dijkstraDist(nodes, edgeList(), 0, unit); }
        };
        const est = (id, t) => { let r = Infinity; for (const [tt, x] of run.hist.get(id)) if (tt <= t) r = x; return r; };
        v.animate((t) => {
          compute();
          const unit = metric.value === 'hops';
          G.weights = !unit;
          G.draw({
            nodeNote: (id) => { const e = est(id, t); return e === Infinity ? '∞' : String(e); }, noteColor: (id) => (est(id, t) === truth.get(id) ? 'green' : 'orange'),
            nodeFill: (id) => (est(id, t) === truth.get(id) ? 'green' : null), nodeColor: (id) => (est(id, t) < Infinity ? 'accent' : 'faint'),
            edgeDash: (e) => (slow.has(`${e.from}-${e.to}`) ? [6, 5] : null), edgeColor: (e) => (slow.has(`${e.from}-${e.to}`) ? 'red' : 'muted'),
          });
          for (const m of run.msgs) {
            if (m.ts > t || m.tr <= t) continue;
            const a = G.node(m.from), b = G.node(m.to), f = (t - m.ts) / (m.tr - m.ts), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ox = (-dy / L) * 0.2, oy = (dx / L) * 0.2;
            sN.dot(a.x + dx * f + ox, a.y + dy * f + oy, { r: 6, color: 'orange', fill: true });
            sN.text(String(m.val), a.x + dx * f + ox, a.y + dy * f + oy + 0.32, { size: 10.5, color: 'orange', align: 'center', halo: true });
          }
          const T = Math.max(12, Math.ceil(run.end + 1)), top = Math.max(3, ...nodes.map((u) => Math.max(...run.hist.get(u).map((h) => (h[1] === Infinity ? 0 : h[1]))))) + 1;
          sT.setView([0, T], [0, top]);
          for (const u of nodes) {
            const pts = []; let prev = null;
            for (const [tt, x] of run.hist.get(u)) { if (x === Infinity || tt > t) continue; if (prev != null) pts.push([tt, prev]); pts.push([tt, x]); prev = x; }
            if (prev != null) pts.push([t, prev]);
            if (pts.length) sT.path(pts, { color: COL(u), width: 2 });
            const tr = truth.get(u); sT.dot(T, tr, { r: 4, hollow: true, color: COL(u) });
            if (pts.length) sT.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], { r: 3.5, color: COL(u), fill: true });
          }
          sT.vline(t, { color: 'gold', width: 1.6 });
        }, { period: 40, still: 14 });
        v.readout(() => {
          compute(); const t = v.t, n = nodes.length, unit = metric.value === 'hops';
          const sent = run.msgs.filter((m) => m.ts <= t).length, ch = nodes.reduce((s, u) => s + run.hist.get(u).filter((h) => h[0] <= t && h[1] < Infinity).length, 0);
          const ok = nodes.every((u) => run.dist.get(u) === truth.get(u)), mx = Math.max(...nodes.map((u) => run.changes.get(u)));
          return `t = ${v.fix(t, 1)} · messages sent **${sent}** of ${run.msgs.length} · estimate updates so far **${ch}** (a perfect run needs ${n}) \n`
            + `At the end: all distances correct ${ok ? '✓' : '✗'} · finished at $t=${v.fix(run.end, 1)}$ · most updates at one process: $${mx}$${unit ? ` ≤ n−1 = ${n - 1} ${mx <= n - 1 ? '✓' : '✗'}` : ' (no fixed bound with weights)'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Theorem', name: 'No deterministic leader election among identical processes',
      statement: String.raw`Consider a synchronous ring of $n$ processes that are *identical*: they run the same deterministic program from the same initial state and have no identifiers. Then no algorithm elects a leader, in the sense that exactly one process eventually outputs "leader" and the rest "non-leader". More generally, if the initial states are invariant under rotation of the ring by $n/p$ positions ($p\mid n$, $p>1$), then in every round the states are still invariant under that rotation, so the processes that output "leader" come in orbits of size at least $p$, and never exactly one.`,
      idea: String.raw`Argue by induction on the round. Initially all processes are in the same state. In a round each process sends the same messages that every other process sends and receives the same ones, because its neighbours are in the same state as everyone else's; applying the same deterministic transition gives the same new state again. So at every round the whole ring is in one state and whatever is decided by one is decided by all, so either nobody or everybody is leader. The symmetric-group version is the same induction with the rotation as the symmetry. This is an indistinguishability argument (1.7): the views of two processes never differ.`,
      caption: String.raw`The ring runs a deterministic rule from the identifiers you choose (identical when the period is 1). Colours show each process's full state; the grid on the right records every round, one row each, so a symmetric ring shows identical columns forever. Raise the period of the identifiers (a divisor of $n$) and the leaders come in groups of that size. Only with all identifiers distinct does a rule such as *max-flood* produce a single leader.`,
      deps: ['dist-1.7'], refs: ['Lynch §3.2'], tags: ['symmetry', 'leader election', 'impossibility'],
      scope: String.raw`Deterministic processes with identical programs and initial states on a symmetric network; it breaks as soon as identifiers, randomness or an asymmetric network are available.`,
      viz(v) {
        const sR = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], axes: false, equal: true, height: 340, title: 'ring at round r (number = identifier, colour = whole state)', weight: 1, minWidth: 280 });
        const sG = v.stage({ x: [-0.5, 12.5], y: [-1.2, 12.5], axes: false, height: 340, title: 'states, one row per round', weight: 1, minWidth: 260 });
        const n = v.slider('processes $n$', 3, 12, 8, { step: 1, int: true });
        const per = v.slider('id period $p$', 1, 12, 1, { step: 1, int: true });
        const rule = v.select('rule', [{ value: 'max', label: 'max-flood' }, { value: 'mix', label: 'hash mixing' }], 'max');
        const rd = v.slider('round $r$', 0, 11, 4, { step: 1, int: true });
        const H = (a, b, c) => { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); return (h ^ (h >>> 15)) >>> 0; };
        const states = () => {
          const N = n.value, p = N % per.value === 0 ? per.value : N;
          const ids = range(N).map((i) => (i % p) + 1), rows = [];
          let cur = ids.map((id) => (rule.value === 'max' ? [id, id] : [id, id]));
          rows.push(cur);
          for (let r = 1; r <= 11; r++) {
            cur = cur.map((s, i) => { const L = cur[(i - 1 + N) % N], R = cur[(i + 1) % N]; return rule.value === 'max' ? [s[0], Math.max(s[1], L[1], R[1])] : [s[0], H(s[1], L[1], R[1]) % 1000]; });
            rows.push(cur);
          }
          return { N, p, ids, rows };
        };
        const decide = (S, r) => S.rows[r].map((s) => (rule.value === 'max' ? r >= Math.floor(S.N / 2) && s[1] === s[0] : r >= 1 && s[1] % 3 === 0));
        v.render(() => {
          const S = states(), r = rd.value, row = S.rows[r], N = S.N, lead = decide(S, r);
          const keyOf = (s) => s[0] * 100000 + s[1], seen = [];
          const colOf = (s) => { const k = keyOf(s); let i = seen.indexOf(k); if (i < 0) { seen.push(k); i = seen.length - 1; } return PAL[i % PAL.length]; };
          S.rows.forEach((rw) => rw.forEach((s) => colOf(s)));
          drawRingEdges(sR, N, 1.15, { dir: true, r: 0.24 });
          row.forEach((s, i) => {
            const [x, y] = ringXY(i, N, 1.15), c = colOf(s);
            sR.circle(x, y, 0.2, { fill: c, fillAlpha: 0.55, color: lead[i] ? 'ink' : c, width: lead[i] ? 3.5 : 2 });
            sR.text(String(s[0]), x, y, { align: 'center', baseline: 'middle', size: 12, color: 'ink' });
            if (lead[i]) sR.text('leader', x * 1.38, y * 1.38, { align: 'center', size: 11, color: 'ink', halo: true });
          });
                    const cw = 11 / Math.max(N, 1);
          for (let rr = 0; rr <= 11; rr++) for (let i = 0; i < N; i++) {
            const y0 = 11 - rr, c = colOf(S.rows[rr][i]);
            sG.rect(i * cw, y0, (i + 1) * cw - 0.04 * cw, y0 + 0.9, { fill: c, fillAlpha: rr <= r ? 0.7 : 0.18, color: c, stroke: false });
          }
          sG.rect(0, 11 - r, N * cw, 11 - r + 0.9, { color: 'ink', width: 2 });
          sG.text('round 0 at the top, round 11 at the bottom', 5.5, -0.7, { align: 'center', size: 11, color: 'muted' });
        });
        v.readout(() => {
          const S = states(), r = rd.value, lead = decide(S, r), cnt = lead.filter(Boolean).length;
          let inv = true; if (S.p < S.N) for (const rw of S.rows) for (let i = 0; i < S.N; i++) { const j = (i + S.p) % S.N; if (rw[i][0] !== rw[j][0] || rw[i][1] !== rw[j][1]) inv = false; }
          const msg = S.p === S.N ? 'identifiers all distinct: no symmetry to preserve' : `ids repeat with period $${S.p}$: states stay invariant under rotation by $${S.p}$ in all 12 rounds ${inv ? '✓' : '✗'}`;
          return `round $${r}$: leaders **${cnt}** (of $${S.N}$)${per.value !== S.p && S.N % per.value ? ` · period ${per.value} does not divide ${S.N}: ids are distinct` : ''}\n${msg}${S.p < S.N ? ` · leaders come in groups of $${S.p}$ at least: exactly one is impossible` : (cnt === 1 ? ' · exactly one leader ✓' : '')}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Algorithm', name: 'LCR leader election',
      statement: String.raw`In a ring of $n$ processes with distinct comparable identifiers, where every process can send only to its clockwise neighbour, each process first sends its own identifier clockwise. A process that receives an identifier $u$ forwards it if $u$ exceeds its own, discards it if $u$ is smaller, and declares itself leader if $u$ equals its own identifier. Exactly one process, the one with the maximum identifier, becomes leader, after $n$ synchronous rounds, and the number of messages sent is between $2n-1$ and $n(n+1)/2$ depending on how the identifiers are arranged; over uniformly random arrangements the mean is $n H_n\approx n\ln n$.`,
      idea: String.raw`The maximum identifier is never discarded, because no process holds a larger one, so it goes all the way around and returns to its owner. Every other identifier meets, at the latest at the owner of the maximum, a larger one and is swallowed there, so nobody else can ever see their own identifier come back. The message count is the total distance that all identifiers travel: an identifier is carried until the first larger identifier on its clockwise path, which is 1 hop in an increasing ring and up to $n$ hops in a decreasing one. Distinct identifiers are what remove the symmetry of 2.3.`,
      caption: String.raw`Tokens carry identifiers clockwise; a token vanishes at the first process with a larger identifier. Choose the arrangement of identifiers around the ring, press *reshuffle*, and watch the running message count. The right panel sweeps the ring size for the chosen arrangement against $n(n+1)/2$, $nH_n$ and $2n-1$ and marks your $n$.`,
      deps: ['dist-2.3'], refs: ['Lynch §3.3', 'Lynch §15.1.1'], tags: ['leader election', 'ring', 'message complexity'],
      credit: 'Le Lann, 1977; Chang & Roberts, 1979',
      scope: String.raw`Unidirectional ring, distinct identifiers drawn from a totally ordered set, synchronous rounds in this picture (the algorithm is also correct asynchronously).`,
      viz(v) {
        const sR = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], axes: false, equal: true, height: 360, title: 'tokens travelling clockwise', weight: 1.1, minWidth: 290 });
        const sP = v.stage({ x: [0, 40], y: [0, 100], axes: 'box', gutter: true, xlabel: 'ring size n', ylabel: 'messages', height: 360, title: 'messages against n', weight: 1, minWidth: 270 });
        const n = v.slider('processes $n$', 3, 16, 10, { step: 1, int: true });
        const arr = v.select('arrangement', [{ value: 'random', label: 'random' }, { value: 'increasing', label: 'increasing' }, { value: 'decreasing', label: 'decreasing' }], 'decreasing');
        let seed = 1; v.button('reshuffle', () => { seed++; });
        const cache = new Map();
        const sweep = () => {
          const k = `${arr.value}|${seed}`; if (cache.has(k)) return cache.get(k);
          const pts = []; for (let m = 3; m <= 40; m++) { if (arr.value === 'random') { let s = 0; for (let j = 0; j < 12; j++) s += lcrCount(ringIds(m, 'random', seed * 31 + j)); pts.push([m, s / 12]); } else pts.push([m, lcrCount(ringIds(m, arr.value, seed))]); }
          cache.set(k, pts); return pts;
        };
        let run, ids;
        v.animate((t) => {
          ids = ringIds(n.value, arr.value, seed); run = lcr(ids);
          const N = n.value, rt = Math.min(t * 1.1, run.frames.length - 1), r = Math.min(Math.floor(rt), run.frames.length - 1), f = rt - r, F = run.frames[r];
          drawRingEdges(sR, N, 1.25, { dir: true, r: 0.26 });
          ids.forEach((id, i) => { const [x, y] = ringXY(i, N, 1.25); const lead = F.leader === i; sR.circle(x, y, 0.22, { fill: lead ? 'green' : 'panel', fillAlpha: lead ? 0.5 : 1, color: lead ? 'green' : 'ink', width: 2 }); sR.text(String(id), x, y, { align: 'center', baseline: 'middle', size: 12, color: 'ink' }); });
          if (r < run.frames.length - 1) for (const tk of F.toks) {
            const [x, y] = ringHop(tk.pos, Math.min(f, 1), N, 1.25), dx = x, dy = y, L = Math.hypot(dx, dy) || 1;
            sR.dot(x * 0.78, y * 0.78, { r: 8, color: tk.id === N ? 'gold' : 'orange', fill: true });
            sR.text(String(tk.id), x * 0.78 * (1 + 0.0), y * 0.78 + 0.0, { align: 'center', baseline: 'middle', size: 9, color: 'ink', dy: -12, halo: true });
          }
          const mx = Math.max(110, ...sweep().map((p) => p[1]));
          sP.setView([0, 41], [0, mx * 1.05]);
          sP.fn((m) => m * (m + 1) / 2, { color: 'red', dash: true, width: 1.6, domain: [3, 40] });
          sP.fn((m) => m * (log2(m) * Math.LN2 + 0.5772), { color: 'purple', dash: true, width: 1.6, domain: [3, 40] });
          sP.fn((m) => 2 * m - 1, { color: 'green', dash: true, width: 1.6, domain: [3, 40] });
          sP.path(sweep(), { color: 'accent', width: 2.6 });
          sP.dot(N, lcrCount(ids), { r: 6, color: 'gold', fill: true });
        }, { period: 40, still: 7 });
        v.legend([['accent', 'your arrangement'], ['red', '$n(n+1)/2$', { dash: true }], ['purple', '$nH_n$', { dash: true }], ['green', '$2n-1$', { dash: true }]]);
        v.readout(() => {
          const N = n.value, total = lcrCount(ids), HN = range(N).reduce((s, i) => s + 1 / (i + 1), 0);
          const winner = ids.indexOf(Math.max(...ids));
          const shown = run.frames[Math.min(Math.floor(Math.min(v.t * 1.1, run.frames.length - 1)), run.frames.length - 1)].total;
          return `messages so far **${shown}** of **${total}** · bounds for $n=${N}$: $2n-1=${2 * N - 1}$ ≤ ${total} ≤ $n(n+1)/2=${N * (N + 1) / 2}$ ${total >= 2 * N - 1 && total <= N * (N + 1) / 2 ? '✓' : '✗'} · average over random rings $nH_n=${v.fix(N * HN, 1)}$\nleader: process holding ${Math.max(...ids)} (the maximum) ${run.leader === winner ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Algorithm', name: 'Hirschberg–Sinclair election in O(n log n) messages',
      statement: String.raw`In a bidirectional ring with distinct identifiers, the algorithm works in phases $k=0,1,2,\dots$. In phase $k$ every surviving *candidate* sends its identifier in both directions to distance $2^k$. A process on the way discards the probe if its own identifier is larger and relays it otherwise; the process at distance $2^k$ turns it round. A candidate whose two probes both return survives into phase $k+1$; one whose probe is discarded drops out, and a candidate that receives its own probe is the leader. Exactly the maximum becomes leader, and the number of messages sent is below $8n(\lceil\log_2 n\rceil+1)$, so $O(n\log n)$ in every arrangement.`,
      idea: String.raw`Correctness is as for LCR: the maximum is never discarded. For the count, two candidates that survive phase $k-1$ must be more than $2^{k-1}$ apart (each would have discarded a probe of the other otherwise), so at most $n/(2^{k-1}+1)$ candidates enter phase $k$. A candidate spends at most $4\cdot2^k$ messages in phase $k$ (two probes out, two replies back), so a phase costs less than $8n$ messages, and there are at most $\lceil\log_2 n\rceil+1$ phases. Compared with LCR's quadratic worst case this replaces "go all the way until beaten" by "check a doubling neighbourhood".`,
      caption: String.raw`Slide the *phase* to see who is still a candidate (filled) and the probes of that phase (outer arcs: clockwise probes on the inner arc, anticlockwise on the outer one; green = came back, red = killed at the cross). Choose the arrangement; *decreasing* is LCR's worst case and *bit-reversal* is a bad one for HS. The right panel compares the message counts of HS and LCR as $n$ grows, with $n\log_2 n$ for reference.`,
      deps: ['dist-2.4'], refs: ['Lynch §3.4', 'Lynch §15.1.2'], tags: ['leader election', 'ring', 'message complexity'],
      credit: 'Hirschberg & Sinclair, 1980',
      scope: String.raw`Bidirectional ring, distinct identifiers from a totally ordered set; the constant 8 is from the counting argument in the idea above, not a tight constant.`,
      viz(v) {
        const sR = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], axes: false, equal: true, height: 370, title: 'candidates and probes of the chosen phase', weight: 1.15, minWidth: 300 });
        const sP = v.stage({ x: [0, 64], y: [0, 100], axes: 'box', gutter: true, xlabel: 'ring size n', ylabel: 'messages', height: 370, title: 'HS against LCR', weight: 1, minWidth: 270 });
        const n = v.slider('processes $n$', 4, 32, 16, { step: 1, int: true });
        const arr = v.select('arrangement', [{ value: 'random', label: 'random' }, { value: 'decreasing', label: 'decreasing' }, { value: 'bitrev', label: 'bit-reversal' }], 'bitrev');
        const ph = v.slider('phase $k$', 0, 6, 0, { step: 1, int: true });
        let seed = 1; v.button('reshuffle', () => { seed++; });
        const cache = new Map();
        const sweep = () => {
          const k = `${arr.value}|${seed}`; if (cache.has(k)) return cache.get(k);
          const a = [], b = []; for (let m = 4; m <= 64; m++) { const ids = ringIds(m, arr.value, seed); a.push([m, hs(ids).total]); b.push([m, lcrCount(ids)]); }
          const o = { hs: a, lcr: b }; cache.set(k, o); return o;
        };
        let H, ids;
        const arcPts = (c, dir, hops, N, R) => { const p = []; for (let h = 0; h <= hops; h++) p.push(ringXY((((c + dir * h) % N) + N) % N, N, R)); return p; };
        v.render(() => {
          const N = n.value; ids = ringIds(N, arr.value, seed); H = hs(ids);
          const k = Math.min(ph.value, H.phases.length - 1), P = H.phases[k], cs = new Set(P.cands);
          drawRingEdges(sR, N, 1.2, { r: 0.0, width: 1.2 });
          for (const pr of P.probes) {
            const R = pr.dir > 0 ? 1.42 : 1.6, pts = arcPts(pr.c, pr.dir, pr.hops, N, R), col = pr.hit ? 'orange' : pr.killed != null ? 'red' : 'green';
            sR.path(pts.map(([x, y]) => [x, y]), { color: col, width: 2, alpha: 0.7 });
            const e = pts[pts.length - 1]; if (pr.killed != null) sR.text('✕', e[0], e[1], { align: 'center', baseline: 'middle', size: 13, color: 'red', halo: true });
          }
          ids.forEach((id, i) => {
            const [x, y] = ringXY(i, N, 1.2), cand = cs.has(i), lead = H.leader === i && k === H.phases.length - 1;
            sR.circle(x, y, 0.15, { fill: lead ? 'green' : cand ? 'accent' : 'panel', fillAlpha: cand ? 0.6 : 1, color: cand ? 'accent' : 'faint', width: 2 });
            if (N <= 24) sR.text(String(id), x * 0.8, y * 0.8, { align: 'center', baseline: 'middle', size: 10.5, color: cand ? 'ink' : 'muted' });
          });
          const S = sweep(), mx = Math.max(100, ...S.hs.map((p) => p[1]), ...S.lcr.map((p) => p[1]));
          sP.setView([0, 65], [0, mx * 1.05]);
          sP.fn((m) => m * log2(m), { color: 'muted', dash: true, width: 1.5, domain: [4, 64] });
          sP.path(S.lcr, { color: 'red', width: 2.2 }); sP.path(S.hs, { color: 'accent', width: 2.6 });
          sP.dot(N, lcrCount(ids), { r: 5, color: 'red', fill: true }); sP.dot(N, H.total, { r: 5, color: 'gold', fill: true });
        });
        v.legend([['accent', 'Hirschberg–Sinclair'], ['red', 'LCR'], ['muted', '$n\\log_2 n$', { dash: true }], ['green', 'probe returned', { dot: true }]]);
        v.readout(() => {
          const N = n.value, k = Math.min(ph.value, H.phases.length - 1), P = H.phases[k], cum = H.phases.slice(0, k + 1).reduce((s, p) => s + p.msgs, 0);
          return `phase $${k}$ of ${H.phases.length}: probe distance $2^{${k}}=${P.L}$ · candidates **${P.cands.length}** (bound $n/(2^{k-1}+1)=${k ? v.fix(N / (2 ** (k - 1) + 1), 1) : N}$) · messages this phase **${P.msgs}** (< $8n=${8 * N}$ ${P.msgs < 8 * N ? '✓' : '✗'}) · cumulative ${cum}\nwhole run: **${H.total}** messages < $8n(\\lceil\\log_2 n\\rceil+1)=${H.bound}$ ${H.total < H.bound ? '✓' : '✗'} · $n\\log_2 n=${v.fix(N * log2(N), 0)}$ · LCR on the same ring: ${lcrCount(ids)} · leader holds max id ${ids[H.leader] === Math.max(...ids) ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Theorem', name: 'Ω(n log n) messages for comparison-based election',
      statement: String.raw`A leader election algorithm for rings is *comparison-based* if processes only compare identifiers with each other, and never use their numerical values. For every ring size $n$ there is an arrangement of distinct identifiers on which any comparison-based algorithm that elects a leader in a bidirectional ring sends $\Omega(n\log n)$ messages. So Hirschberg–Sinclair is asymptotically optimal for these algorithms, and the quadratic worst case of LCR cannot be avoided by cleverness alone, only by a better idea.`,
      idea: String.raw`Take the bit-reversal arrangement. For every radius $r$ the clockwise windows of $2r+1$ consecutive identifiers fall into few order-equivalence classes, so each class has many members ($\gtrsim n/(2r+1)$). A comparison-based algorithm cannot tell order-equivalent neighbourhoods apart: for $r$ rounds, all processes of a class send the same messages in the same direction. So whenever the algorithm is still sending in round $r$ (and it must be, until some process has seen enough to know the ring has a maximum), at least a whole class of processes sends, adding $\gtrsim n/(2r+1)$ messages for that round; summing over $r\le n/2$ gives a harmonic sum of order $n\log n$. This is the shape of the argument; the full proof also treats asynchrony and the construction of the ring.`,
      caption: String.raw`Colours mark order-equivalence classes of the radius-$r$ window around every process (the largest classes in colour, singletons in grey). In the bit-reversal ring (try $n=64$) every class stays large as $r$ grows; in a random ring nearly everyone is alone after $r=2$, so the argument gets no grip, and in an increasing ring only the processes near the wrap-around differ. Bars: the size of the smallest class at each radius; the line adds them up and compares with what HS and LCR actually send on this ring.`,
      deps: ['dist-2.5'], refs: ['Lynch §3.6', 'Attiya–Welch ch. 3'], tags: ['lower bound', 'leader election', 'ring'],
      credit: 'Frederickson & Lynch, 1984; Pachl, Korach & Rotem, 1984',
      scope: String.raw`Comparison-based algorithms on rings of known or unknown size; algorithms that use the numerical values of identifiers (for example a constant-time election in a synchronous ring with small identifiers) escape the bound. The panel's "forced" sum is the simplified accounting of the idea, not the exact constant of the theorem.`,
      viz(v) {
        const sR = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], axes: false, equal: true, height: 360, title: 'order-type of each process’s neighbourhood', weight: 1.05, minWidth: 290 });
        const sB = v.stage({ x: [0, 32], y: [0, 70], axes: 'box', gutter: true, xlabel: 'radius r', ylabel: 'processes', height: 360, title: 'smallest class and the accumulated count', weight: 1, minWidth: 270 });
        const n = v.select('$n$', [{ value: 16, label: '16' }, { value: 32, label: '32' }, { value: 64, label: '64' }], 32);
        const kind = v.select('ring', [{ value: 'bitrev', label: 'bit-reversal' }, { value: 'random', label: 'random' }, { value: 'increasing', label: 'increasing' }], 'bitrev');
        const rs = v.slider('radius $r$', 1, 31, 3, { step: 1, int: true });
        const cache = new Map();
        const all = (nv = n.value, kd = kind.value) => {
          const k = `${kd}|${nv}`; if (cache.has(k)) return cache.get(k);
          const ids = ringIds(nv, kd, 5), out = [], Rmax = Math.floor((nv - 1) / 2);
          for (let r = 1; r <= Rmax; r++) out.push(orderClasses(ids, r));
          const o = { ids, cl: out, Rmax, h: hs(ids).total, l: lcrCount(ids), sum: out.reduce((a, c) => a + c.minSize, 0) }; cache.set(k, o); return o;
        };
        v.render(() => {
          const A = all(), N = n.value, r = Math.min(rs.value, A.Rmax), C = A.cl[r - 1];
          drawRingEdges(sR, N, 1.3, { r: 0.0, width: 1.2 });
          A.ids.forEach((id, i) => {
            const [x, y] = ringXY(i, N, 1.3), g = C.cls[i], big = g < 8 && C.groups[g].length > 1, c = big ? PAL[g % PAL.length] : 'faint';
            sR.circle(x, y, N > 32 ? 0.085 : 0.12, { fill: c, fillAlpha: big ? 0.75 : 0.35, color: c, width: 1.5 });
            if (N <= 32) sR.text(String(id), x * 0.82, y * 0.82, { align: 'center', baseline: 'middle', size: 9.5, color: 'muted' });
          });
          sR.text(`window: ${2 * r + 1} consecutive identifiers`, 0, 0.1, { align: 'center', size: 12, color: 'muted' });
          sR.text(`${C.groups.length} classes, smallest ${C.minSize}`, 0, -0.15, { align: 'center', size: 12, color: 'ink' });
          let cum0 = 0; A.cl.forEach((c) => { cum0 += c.minSize; }); const top = cum0 * 1.1 + 2; sB.setView([0, Math.max(10, A.Rmax + 1)], [0, top]);
          let cum = 0;
          const cumPts = A.cl.map((c, i) => { cum += c.minSize; return [i + 1, cum]; });
          sB.bars(A.cl.map((c) => c.minSize), { x0: 1, color: (val, i) => (i + 1 === r ? 'gold' : 'accent') });
          sB.path(cumPts, { color: 'green', width: 2.4 });
        });
        v.legend([['accent', 'smallest class at radius r'], ['green', 'accumulated Σ']]);
        v.readout(() => {
          const A = all(), N = n.value, r = Math.min(rs.value, A.Rmax), m = A.cl[r - 1].minSize, tot = A.sum, fl = Math.floor(N / (2 * r + 1));
          const sums = [16, 32, 64].map((x) => `$n=${x}$: ${all(x).sum} (${v.fix(all(x).sum / x, 2)}$n$)`).join(' · ');
          return `radius $${r}$: smallest class $m(${r})=${m}$ vs $\\lfloor n/(2r+1)\\rfloor=${fl}$ ${m >= fl ? '✓' : '✗ (the class bound fails for this ring)'} · accumulated $\\sum_{r\\le ${A.Rmax}} m(r)=${tot}$\nthis ring type, Σ for each size: ${sums}${kind.value === 'bitrev' ? ' — it grows faster than $n$, like $n\\log n$' : ''}\nactual messages on this ring: HS $${A.h}$ ${A.h >= tot ? '≥' : '<'} Σ ${A.h >= tot ? '✓' : '✗'}, LCR $${A.l}$`;
        });
      },
    },
  ],
};
