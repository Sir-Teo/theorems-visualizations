// Distributed Computing — Chapter 2 (part b): items 2.7–2.12
import { mulberry32, hash01, clamp, range, plural, log2, ringXY, drawRingEdges, irLaw, irRun, luby, randomAdj, coleVishkin, lowDiff, bitsOf, logStar, ghs, kruskal, synchronize, diffuse } from './ch02.shared.js';

const PAL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'blue'];
const ekey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export default {
  collection: 'dist',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Algorithm', name: 'Randomized election in anonymous rings',
      statement: String.raw`In a ring of $n$ anonymous processes (identical, no identifiers, possibly not even knowing $n$) every process starts as a *candidate*. In a round every candidate draws an independent uniform number from $\{1,\dots,K\}$, $K\ge2$, and only the candidates that drew the maximum stay candidates; the others become non-candidates and merely relay messages. The rounds repeat until exactly one candidate is left, which is then elected (a token sent once round the ring tells a lone candidate that it is alone). The algorithm never elects two leaders, it ends with probability 1, and the expected number of rounds is finite: for $K=2$ about $\log_2 n+O(1)$, and it tends to $1$ as $K\to\infty$ with $n$ fixed.`,
      idea: String.raw`Safety is trivial: a round never removes every candidate, because the maximum always has a holder, so at least one candidate survives forever. Progress follows from the probability that the maximum is unique, which is positive for every number of candidates $m\ge2$ (for example, one candidate drawing $K$ and every other candidate drawing less is possible), so the number of candidates is a Markov chain on $\{1,\dots,n\}$ that is absorbed at 1 with probability 1. Randomness is exactly what 2.3 showed to be missing: independent draws make the symmetric states of the ring unequal.`,
      caption: String.raw`Left: one run on the ring: candidates (filled) with the number each drew; the ones holding the maximum stay. Step through the rounds with the slider and press *new run*. Right: the number of rounds over 3000 independent runs (bars) against the exact law computed from the Markov chain (dots). Make $K$ large and almost every run finishes in one round; at $K=2$ it takes about $\log_2 n$.`,
      deps: ['dist-2.3', 'prob-2.1.1a', 'stoch-2.5'], refs: ['Attiya–Welch ch. 14'], tags: ['randomization', 'symmetry breaking', 'ring'],
      credit: 'Itai & Rodeh, 1981',
      scope: String.raw`Anonymous synchronous ring; the guarantee is probability 1 termination and always-correct output (a Las Vegas algorithm), not a worst-case bound on rounds.`,
      viz(v) {
        const sR = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], axes: false, equal: true, height: 350, title: 'one run', weight: 1, minWidth: 280 });
        const sH = v.stage({ x: [0, 14], y: [0, 1], axes: 'box', gutter: true, xlabel: 'rounds until a unique leader', ylabel: 'fraction of runs', height: 350, title: '3000 runs', weight: 1.05, minWidth: 270 });
        const n = v.slider('processes $n$', 2, 40, 12, { step: 1, int: true });
        const K = v.slider('range $K$', 2, 40, 2, { step: 1, int: true });
        const rd = v.slider('round', 0, 14, 0, { step: 1, int: true });
        let seed = 1, hseed = 1;
        v.button('new run', () => { seed++; });
        v.button('resample 3000 runs', () => { hseed++; });
        let key = '', hist = null, law = null, run = null, rkey = '';
        const prep = () => {
          const k = `${n.value}|${K.value}|${hseed}`;
          if (k !== key) {
            key = k; const r = mulberry32(hseed * 977 + n.value * 13 + K.value), cnt = new Array(41).fill(0); let sum = 0;
            for (let i = 0; i < 3000; i++) { const R = irRun(n.value, K.value, r).rounds.length; cnt[Math.min(R, 40)]++; sum += R; }
            hist = { cnt, mean: sum / 3000 }; law = irLaw(n.value, K.value, 60);
          }
          const rk = `${n.value}|${K.value}|${seed}`;
          if (rk !== rkey) { rkey = rk; run = irRun(n.value, K.value, mulberry32(seed * 31 + n.value * 7 + K.value)); }
        };
        v.render(() => {
          prep(); const N = n.value, r = Math.min(rd.value, run.rounds.length), R = run.rounds[r];
          drawRingEdges(sR, N, 1.35, { r: 0.0, width: 1.2 });
          const cand = new Set(R ? R.cands : [run.leader]), draws = new Map(R ? R.cands.map((c, i) => [c, R.draws[i]]) : []), win = new Set(R ? R.winners : [run.leader]);
          for (let i = 0; i < N; i++) {
            const [x, y] = ringXY(i, N, 1.35), c = cand.has(i), w = win.has(i), fin = !R;
            sR.circle(x, y, N > 24 ? 0.1 : 0.14, { fill: fin && w ? 'green' : c ? (w ? 'accent' : 'orange') : 'panel', fillAlpha: c ? 0.65 : 1, color: c ? (fin && w ? 'green' : 'accent') : 'faint', width: 2 });
            if (draws.has(i)) sR.text(String(draws.get(i)), x * 0.8, y * 0.8, { align: 'center', baseline: 'middle', size: 11, color: w ? 'accent' : 'muted' });
          }
          sR.setTitle(R ? `round ${r + 1}: ${R.cands.length} candidates draw, ${R.winners.length} hold the maximum` : `leader elected after ${run.rounds.length} rounds`);
          const top = Math.max(0.1, ...hist.cnt.map((c) => c / 3000), ...law.pmf.slice(1, 15)) * 1.15;
          sH.setView([0, 14], [0, top]);
          sH.bars(hist.cnt.slice(1, 14).map((c) => c / 3000), { x0: 1, color: 'accent', alpha: 0.5 });
          sH.dots(law.pmf.slice(1, 14).map((p, i) => [i + 1, p]), { r: 4.5, color: 'gold' });
          sH.vline(law.mean, { color: 'green', dash: true, width: 1.8 });
        });
        v.legend([['accent', 'simulated'], ['gold', 'exact law', { dot: true }], ['green', 'exact mean', { dash: true }]]);
        v.readout(() => { prep(); return `simulated mean **${v.fix(hist.mean, 3)}** rounds vs exact $E=${v.fix(law.mean, 3)}$ ${Math.abs(hist.mean - law.mean) < 0.12 ? '✓' : '(Monte-Carlo noise)'} · $\\Pr[\\text{finished within }\\ 3]=${v.fix(law.cdf[3] ?? 1, 3)}$ · this run took ${run.rounds.length} rounds · $\\log_2 n=${v.fix(log2(n.value), 2)}$`; });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Algorithm', name: 'Luby’s maximal independent set',
      statement: String.raw`A set $I$ of vertices of a graph is *independent* if no two are adjacent and *maximal* if no vertex can be added. Luby's algorithm works in synchronous rounds on the graph of still-active vertices: each active vertex draws a fresh random priority, a vertex whose priority is smaller than those of all its active neighbours joins $I$, and then every vertex of $I$ and all its neighbours leave the active set. When no vertex is active, $I$ is a maximal independent set. The expected number of rounds is $O(\log n)$ and, with high probability, $O(\log n)$ for every graph on $n$ vertices.`,
      idea: String.raw`Independence holds because two adjacent vertices cannot both be the strict local minimum, and maximality because a vertex leaves the active set only by joining $I$ or by being adjacent to a member. For speed, a vertex of degree $d$ is the local minimum with probability $\ge 1/(d+1)$, and a standard counting argument shows that in expectation a constant fraction of the edges disappears in every round (a removed vertex takes its edges with it). With $O(\log n)$ halvings the graph is empty. The picture computes the real thing: the scaling plot runs the algorithm on random graphs of growing size.`,
      caption: String.raw`Step through the rounds: first every active vertex draws a number, then the local minima (gold) join $I$ and they and their neighbours drop out (faded). Edit the graph by dragging nodes, clicking empty space to add a vertex, and clicking two vertices to add or remove an edge; press *new priorities* to rerun with other luck. Right: rounds against $\log_2 n$ on random graphs of average degree 4, with the spread over 8 runs per size.`,
      deps: ['dist-1.2', 'prob-1.6.1'], refs: ['Lynch §4.5'], tags: ['randomization', 'independent set', 'symmetry breaking'],
      credit: 'Luby, 1985; Alon, Babai & Itai, 1986',
      scope: String.raw`Synchronous message-passing network; each round uses one message exchange of priorities and one of membership. Ties between equal priorities (probability 0 here) are broken by identifier.`,
      viz(v) {
        const sG = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 360, title: 'graph', weight: 1.25, minWidth: 300 });
        const sP = v.stage({ x: [2.5, 10.5], y: [0, 12], axes: 'box', gutter: true, xlabel: 'log₂ n', ylabel: 'rounds', height: 360, title: 'rounds against log n', weight: 1, minWidth: 260 });
        let seed = 1; v.button('new priorities', () => { seed++; S.reset({ at: 'start' }); });
        const pos = range(14).map((i) => i);
        const edges0 = []; { const r0 = mulberry32(21); for (let i = 0; i < 14; i++) for (let j = i + 1; j < 14; j++) if (r0() < 0.2 || j === i + 1 && r0() < 0.6) edges0.push([i, j]); }
        const G = v.graph(sG, { editable: true, directed: false, layout: 'force', seed: 4, r: 14, fontSize: 12, notePos: 's', nodes: pos, edges: edges0, onChange: () => S.reset({ at: 'start' }) });
        let last = null;
        const build = () => {
          const adj = new Map(G.nodes.map((n) => [n.id, []]));
          for (const e of G.edges) if (adj.has(e.from) && adj.has(e.to) && e.from !== e.to) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
          const r = mulberry32(seed * 101 + 7), res = luby(adj, r), frames = [], I = new Set(), gone = new Set();
          frames.push({ I: new Set(), gone: new Set(), active: new Set(adj.keys()), val: null, join: [], note: `All ${adj.size} vertices are active.`, line: 1 });
          res.rounds.forEach((R, k) => {
            frames.push({ I: new Set(I), gone: new Set(gone), active: R.active, val: R.val, join: [], note: `Round ${k + 1}: every active vertex draws a random priority.`, line: 2 });
            for (const u of R.join) I.add(u); for (const u of R.gone) gone.add(u);
            frames.push({ I: new Set(I), gone: new Set(gone), active: R.active, val: R.val, join: R.join, removed: R.gone, note: `Round ${k + 1}: ${plural(R.join.length, 'local minimum', 'local minima')} join $I$; with their neighbours, ${R.gone.size} vertices leave.`, line: 3 });
          });
          frames.push({ I: new Set(I), gone: new Set(gone), active: new Set(), val: null, join: [], done: true, note: `No active vertex is left: $|I|=${I.size}$ in ${res.rounds.length} rounds.`, line: 4 });
          last = { adj, res, I };
          return frames;
        };
        const S = v.steps({ frames: build, still: 3, codeTitle: 'Luby(G)', code: ['active ← V; I ← ∅', 'while active ≠ ∅: every v ∈ active draws r(v) ∈ (0,1)', '  I ← I ∪ {v : r(v) < r(w) for all active neighbours w};  remove I and N(I) from active', 'return I'], speed: 0.9 });
        const cache = new Map();
        const scal = () => {
          if (cache.size) return cache;
          for (let e = 3; e <= 10; e++) { const N = 2 ** e, vals = []; for (let s = 0; s < 8; s++) { const r = mulberry32(s * 977 + e); vals.push(luby(randomAdj(N, 4, r), mulberry32(s * 13 + e + 100)).rounds.length); } cache.set(e, vals); }
          return cache;
        };
        v.render(() => {
          const F = S.frame;
          G.draw({
            nodeFill: (id) => (F.I.has(id) ? 'green' : F.join.includes(id) ? 'gold' : null), nodeColor: (id) => (F.gone.has(id) && !F.I.has(id) ? 'faint' : 'accent'),
            nodeNote: (id) => (F.val && F.active.has(id) ? v.fix(F.val.get(id), 2) : null), noteColor: (id) => (F.join.includes(id) ? 'gold' : 'ink'),
            dim: [...F.gone].filter((id) => !F.I.has(id) && !F.join.includes(id)),
          });
          const sc = scal(); sP.setView([2.5, 10.5], [0, Math.max(10, ...[...sc.values()].map((a) => Math.max(...a))) + 1]);
          const means = [...sc.entries()].map(([e, a]) => [e, a.reduce((s, x) => s + x, 0) / a.length]);
          for (const [e, a] of sc) sP.line(e, Math.min(...a), e, Math.max(...a), { color: 'accent', width: 3, alpha: 0.3 });
          sP.path(means, { color: 'accent', width: 2 }); sP.dots(means, { r: 4.5, color: 'accent' });
          const nn = G.nodes.length; if (last) sP.dot(log2(Math.max(nn, 2)), last.res.rounds.length, { r: 6, color: 'gold', fill: true });
        });
        v.legend([['green', 'in $I$', { dot: true }], ['gold', 'joins now', { dot: true }], ['accent', 'mean rounds (random graphs)'], ['gold', 'your graph', { dot: true }]]);
        v.readout(() => {
          const F = S.frame; if (!last) return '';
          let indep = true, maxl = true; const I = last.I;
          for (const u of I) for (const w of last.adj.get(u)) if (I.has(w)) indep = false;
          for (const [u, nb] of last.adj) if (!I.has(u) && !nb.some((w) => I.has(w))) maxl = false;
          return `round ${Math.ceil((S.i) / 2)} · active **${F.active.size}** · in $I$ **${F.I.size}**${F.done ? ` · independent ${indep ? '✓' : '✗'} · maximal ${maxl ? '✓' : '✗'} · rounds $${last.res.rounds.length}$ vs $\\log_2 n=${v.fix(log2(Math.max(2, last.adj.size)), 1)}$` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Algorithm', name: 'Cole–Vishkin colouring in O(log* n) rounds',
      statement: String.raw`Let the processes form a ring with a consistent orientation (each knows its successor), and suppose each starts with a distinct identifier from $\{0,\dots,2^b-1\}$ as its initial colour. In one round every process sends its colour to its predecessor, finds the lowest bit position $i$ at which its colour $c$ differs from its successor's colour, and takes as new colour $2i+c_i$, where $c_i$ is the bit of $c$ at position $i$. Neighbouring colours stay different in every round, a $b$-bit colour becomes a colour below $2b$, and after $\log^* n+O(1)$ rounds the ring is properly coloured with at most 6 colours.`,
      idea: String.raw`Why neighbours stay distinct: let $v$ differ from its successor $w$ first at $i$, and $w$ from its successor first at $j$. If $i\ne j$ the new colours $2i+\cdot$ and $2j+\cdot$ differ in their high part. If $i=j$, then $v$ and $w$ have different bits at position $i$, so the low bits differ. The new colour is just a position (about $\log b$ bits) plus one bit, so the number of bits goes $b\to\lceil\log_2 b\rceil+1\to\cdots$, a repeated logarithm; it stops shrinking at 3 bits, i.e. colours $0..5$. The colour count collapses from $2^b$ to 6 in a handful of rounds regardless of $n$.`,
      caption: String.raw`Left: the ring, with each process's current colour (once all colours are below 6 they get palette colours). Right: the binary colours (position 0 on the left) of the first nine processes; the gold box in each row is the bit position where it differs from the row below, which determines the next colour $2i+c_i$. Step the *round* slider, enlarge $b$ and see that the number of rounds hardly grows.`,
      deps: ['dist-1.2', 'graph-5.1.1a'], refs: ['Lynch §4.5'], tags: ['symmetry breaking', 'colouring', 'ring'],
      credit: 'Cole & Vishkin, 1986',
      scope: String.raw`Oriented ring (every process knows which neighbour is its successor), unique identifiers, synchronous rounds. Reducing 6 colours to 3 takes a few more rounds that are not drawn here.`,
      viz(v) {
        const sR = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], axes: false, equal: true, height: 360, title: 'ring (colours appear once all are below 6)', weight: 1, minWidth: 280 });
        const sT = v.stage({ x: [-1.2, 32], y: [-0.3, 9.6], axes: false, height: 360, title: 'colours in binary (bit 0 at the left)', weight: 1.1, minWidth: 300 });
        const n = v.slider('processes $n$', 5, 40, 20, { step: 1, int: true });
        const b = v.slider('identifier bits $b$', 6, 30, 16, { step: 1, int: true });
        const rd = v.slider('round', 0, 6, 0, { step: 1, int: true });
        let seed = 1; v.button('new identifiers', () => { seed++; });
        let key = '', R = null, ids = null;
        const prep = () => {
          const k = `${n.value}|${b.value}|${seed}`; if (k === key) return; key = k;
          const r = mulberry32(seed * 313 + n.value * 7 + b.value), seen = new Set(); ids = [];
          while (ids.length < n.value) { const x = Math.floor(r() * 2 ** b.value); if (!seen.has(x)) { seen.add(x); ids.push(x); } }
          R = coleVishkin(ids);
        };
        v.render(() => {
          prep(); const N = n.value, r = Math.min(rd.value, R.length - 1), col = R[r].col, small = Math.max(...col) < 6;
          drawRingEdges(sR, N, 1.3, { dir: true, r: 0.14, width: 1.2 });
          col.forEach((c, i) => {
            const [x, y] = ringXY(i, N, 1.3), cc = small ? PAL[c % PAL.length] : 'faint';
            sR.circle(x, y, N > 24 ? 0.09 : 0.12, { fill: cc, fillAlpha: small ? 0.7 : 0.4, color: small ? cc : 'muted', width: 1.6 });
            if (small) sR.text(String(c), x, y, { align: 'center', baseline: 'middle', size: 11, color: 'ink' });
          });
          const rows = Math.min(9, N), L = Math.max(...col.slice(0, rows).map(bitsOf), 3), nextIdx = R[r + 1] ? R[r + 1].idx : null, cw = Math.min(1, 30 / Math.max(L, 8));
          for (let i = 0; i < rows; i++) {
            const y = 8.6 - i, c = col[i];
            sT.text(`P${i}`, -0.7, y + 0.4, { align: 'center', baseline: 'middle', size: 11, color: 'muted' });
            for (let k = 0; k < L; k++) {
              const bit = (c >>> k) & 1, x0 = k * cw * 1.0;
              sT.rect(x0, y, x0 + cw * 0.9, y + 0.8, { fill: bit ? 'accent' : 'panel', fillAlpha: bit ? 0.55 : 1, color: 'faint', width: 1 });
              sT.text(String(bit), x0 + cw * 0.45, y + 0.4, { align: 'center', baseline: 'middle', size: 11 * Math.min(1, cw + 0.3), color: 'ink' });
            }
            if (nextIdx) { const k = nextIdx[i], x0 = k * cw; sT.rect(x0 - 0.02, y - 0.04, x0 + cw * 0.9 + 0.02, y + 0.84, { color: 'gold', width: 3 }); }
            sT.text(`= ${c}`, L * cw + 0.3, y + 0.4, { align: 'left', baseline: 'middle', size: 11, color: 'ink' });
          }
          sT.text(nextIdx ? 'gold: first bit that differs from the process below (its successor)' : 'all colours are below 6: the rounds stop', 0, -0.05, { size: 11, color: 'muted' });
        });
        v.readout(() => {
          prep(); const N = n.value, r = Math.min(rd.value, R.length - 1), col = R[r].col;
          const proper = col.every((c, i) => c !== col[(i + 1) % N]);
          return `round $${r}$ of ${R.length - 1}: largest colour $${Math.max(...col)}$ (${bitsOf(Math.max(...col))} bits) · distinct colours **${new Set(col).size}** · neighbours always different ${proper ? '✓' : '✗'}\nbits per round: ${R.map((x) => bitsOf(Math.max(...x.col))).join(' → ')} · rounds used $${R.length - 1}$ · $\\log^*(2^{${b.value}})=${logStar(2 ** b.value)}$, $\\log^*${N}=${logStar(N)}$`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Algorithm', name: 'Distributed minimum spanning tree (GHS)',
      statement: String.raw`Let a connected network have distinct edge weights, and let every process initially be a *fragment* of level 0. Each fragment finds its minimum-weight outgoing edge (MWOE) and uses it as follows. If the fragment at its far end has a higher level, the sender is absorbed into it and takes its level; if both fragments have the same level and chose the same edge, they merge into a fragment whose level is one higher; otherwise the fragment waits. The fragments' edges converge to the unique minimum spanning tree, and the algorithm sends $O(m+n\log n)$ messages in total.`,
      idea: String.raw`Correctness is the cut property of MSTs (algo-10.13): for any fragment the lightest edge leaving it belongs to the MST when weights are distinct, so every edge ever added is safe. Levels give the message bound: a fragment of level $k$ contains at least $2^k$ processes (it arose by merging two of level $k-1$, and absorbing only grows it), so levels never exceed $\log_2 n$, and each process pays $O(1)$ messages to find an MWOE for each level it climbs, plus $O(1)$ per edge to test and reject internal edges. The animation runs the fragment rules itself; it does not simulate the individual test/accept/connect messages of the full protocol.`,
      caption: String.raw`Colours are fragments and the number beside a fragment is its level. Step through: in a *find* step every fragment marks its lightest outgoing edge (orange); in the next step equal-level fragments sharing an edge merge, lower levels are absorbed, others wait. Green edges are the tree built so far; the readout checks every orange edge against the cut property and the final tree against Kruskal's. Press *new network* for another random network.`,
      deps: ['dist-2.1', 'algo-10.13'], refs: ['Lynch §15.5'], tags: ['minimum spanning tree', 'fragments', 'cut property'],
      credit: 'Gallager, Humblet & Spira, 1983',
      scope: String.raw`Distinct edge weights (ties are broken by identifier in the real protocol), reliable asynchronous channels. The $O(m+n\log n)$ message bound is for the full message-level protocol, which this picture abstracts.`,
      viz(v) {
        const sG = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 380, title: 'weighted network', weight: 1, minWidth: 300 });
        let seed = 3;
        v.button('new network', () => { seed++; setup(); S.reset({ at: 'start' }); });
        let nodes, edges, G;
        const setup = () => {
          const r = mulberry32(seed * 271), N = 11, pts = [];
          for (let g = 0; pts.length < N && g < 5000; g++) { const x = 0.8 + 8.4 * r(), y = 0.7 + 5.0 * r(); if (pts.every((q) => Math.hypot(q.x - x, q.y - y) > 1.5)) pts.push({ id: pts.length, x, y }); }
          const pairs = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairs.push({ a: i, b: j, d: Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) });
          pairs.sort((p, q) => p.d - q.d);
          const mst = kruskal(range(N), pairs.map((p) => ({ a: p.a, b: p.b, w: p.d }))), inM = new Set(mst.map((e) => ekey(e.a, e.b)));
          const chosen = pairs.filter((p) => inM.has(ekey(p.a, p.b)) || p.d < 3.3);
          edges = chosen.map((p, k) => ({ a: p.a, b: p.b, w: k + 1 })); nodes = pts;
          if (G) G.set({ nodes: pts.map((p) => ({ ...p })), edges: edges.map((e) => [e.a, e.b, e.w]) });
        };
        setup();
        G = v.graph(sG, { editable: false, directed: false, weights: true, layout: 'none', r: 13, fontSize: 12, notePos: 'n', nodes: nodes.map((p) => ({ ...p })), edges: edges.map((e) => [e.a, e.b, e.w]) });
        let run = null;
        const S = v.steps({
          frames: () => (run = ghs(range(nodes.length), edges)).frames,
          codeTitle: 'GHS (fragment level)', speed: 0.8, still: 4, codePos: 'below',
          code: ['every process is a fragment of level 0', 'repeat: every fragment finds its minimum-weight outgoing edge e (to fragment F′)', '  level(F) < level(F′): F is absorbed into F′ (keeps level(F′))', '  level(F) = level(F′) and F′ chose the same e: merge, new level = level + 1', '  otherwise: wait', 'until one fragment remains: its edges are the MST'],
        });
        const fid = new Map(); let nextf = 0;
        v.render(() => {
          if (!run) return;
          const F = S.frame, mwKeys = new Set(F.mw ? [...F.mw.values()].map((e) => ekey(e.a, e.b)) : []), treeKeys = new Set([...F.tree].map((e) => ekey(e.a, e.b)));
          const frs = [...new Set(F.frag.values())].sort((a, b) => a - b), rep = new Map(); for (const [u, f] of F.frag) if (!rep.has(f) || u < rep.get(f)) rep.set(f, u);
          const colF = (f) => PAL[frs.indexOf(f) % PAL.length], lvl = (u) => F.level.get(F.frag.get(u));
          G.draw({
            nodeColor: (id) => colF(F.frag.get(id)), nodeFill: (id) => (F.frag.get(id) !== undefined && frs.length === 1 ? 'green' : null),
            nodeNote: (id) => (rep.get(F.frag.get(id)) === id ? `L${lvl(id)}` : null), noteColor: (id) => colF(F.frag.get(id)),
            edgeColor: (e) => (mwKeys.has(ekey(e.from, e.to)) ? 'orange' : treeKeys.has(ekey(e.from, e.to)) ? 'green' : 'faint'),
            edgeWidth: (e) => (mwKeys.has(ekey(e.from, e.to)) ? 4 : treeKeys.has(ekey(e.from, e.to)) ? 3.4 : 1.2),
          });
        });
        v.legend([['green', 'tree edge'], ['orange', 'minimum outgoing edge'], ['accent', 'colour = fragment, L = level']]);
        v.readout(() => {
          if (!run) return ''; const F = S.frame, frs = new Set(F.frag.values());
          let cutOk = true;
          if (F.mw) for (const [f, e] of F.mw) for (const g of edges) { if ((F.frag.get(g.a) === f) !== (F.frag.get(g.b) === f) && g.w < e.w) cutOk = false; }
          const mst = kruskal(range(nodes.length), edges), a = new Set(mst.map((e) => ekey(e.a, e.b))), fin = S.atEnd, same = fin && [...F.tree].every((e) => a.has(ekey(e.a, e.b))) && F.tree.size === a.size;
          return `**${frs.size}** fragments · levels ${[...frs].map((f) => F.level.get(f)).sort((x, y) => y - x).join(', ')} (a level-$k$ fragment has ≥ $2^k$ processes; here the largest has ${Math.max(...[...frs].map((f) => [...F.frag.values()].filter((x) => x === f).length))} of ${nodes.length}) · tree edges ${F.tree.size}\n${F.mw ? `every orange edge is the lightest leaving its fragment ${cutOk ? '✓' : '✗'}` : ''}${fin ? `final tree = Kruskal's MST ${same ? '✓' : '✗'}, weight ${[...F.tree].reduce((s, e) => s + e.w, 0)}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Algorithm', name: 'Synchronizers',
      statement: String.raw`A *synchronizer* simulates synchronous rounds (*pulses*) on an asynchronous network with reliable channels. After sending its algorithm messages of pulse $p$, a process waits for every one to be acknowledged and is then *safe* for pulse $p$; it may start pulse $p+1$ once it knows that all its neighbours' pulse-$p$ messages have been delivered. Synchronizer $\alpha$ tells each neighbour directly that it is safe, costing $2|E|$ extra messages per pulse and $O(1)$ time per pulse. Synchronizer $\beta$ gathers the safe reports up a spanning tree and broadcasts the next pulse down it, costing $2(n-1)$ extra messages per pulse and time proportional to the tree height. Either way a synchronous algorithm gives the same results as in the synchronous model.`,
      idea: String.raw`In a synchronous run a message sent in pulse $p$ arrives before pulse $p+1$ starts; asynchrony could break this, and "safe" is exactly the condition that restores it: when all neighbours of $v$ are safe, nothing of pulse $p$ can still arrive at $v$, so it can move on. $\alpha$ discovers this locally, at the price of a message on every edge each pulse; $\beta$ discovers it globally via the convergecast/broadcast of 2.1, trading messages for time. A synchronous BFS (2.2) then runs on the asynchronous network with one pulse per level.`,
      caption: String.raw`A synchronous breadth-first search from the root (click a node to move it) runs on an asynchronous network whose delays you set. Each curve in the two lower panels is one process: the time at which it starts pulse $p$ under $\alpha$ (left) and $\beta$ (right); the dashed line is the ideal one-time-unit-per-pulse clock. Increase the delay spread to see what each pays: $\alpha$ stays close to the line but uses many more messages, $\beta$ is slower per pulse (it waits for the whole tree) but sends few messages.`,
      deps: ['dist-1.2', 'dist-2.1'], refs: ['Lynch §16.4'], tags: ['synchronizer', 'asynchrony', 'simulation'],
      credit: 'Awerbuch, 1985',
      scope: String.raw`Reliable asynchronous channels with delays at most 1 (one time unit = the pulse length of the simulated synchronous algorithm); no failures. The picture counts the control messages only for pulses that the BFS actually uses.`,
      viz(v) {
        const sG = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330, title: 'network (colour = BFS level; green = β tree)', weight: 1, minWidth: 300, full: true });
        const sA = v.stage({ x: [0, 8], y: [0, 14], axes: 'box', gutter: true, xlabel: 'pulse p', ylabel: 'start time', height: 270, title: 'synchronizer α', weight: 1, minWidth: 260 });
        const sB = v.stage({ x: [0, 8], y: [0, 14], axes: 'box', gutter: true, xlabel: 'pulse p', ylabel: 'start time', height: 270, title: 'synchronizer β', weight: 1, minWidth: 260 });
        const kind = v.select('highlight', [{ value: 'alpha', label: 'α' }, { value: 'beta', label: 'β' }], 'alpha');
        const spread = v.slider('delay spread', 0, 1, 0.5, { step: 0.05 });
        let root = 0, seed = 1; v.button('new delays', () => { seed++; });
        const G = v.graph(sG, {
          editable: false, directed: false, layout: 'none', r: 15, fontSize: 13, notePos: 's',
          nodes: [{ id: 0, x: 1.0, y: 3 }, { id: 1, x: 2.8, y: 5 }, { id: 2, x: 2.8, y: 1 }, { id: 3, x: 4.8, y: 3.3 }, { id: 4, x: 6.4, y: 5.2 }, { id: 5, x: 6.4, y: 1.0 }, { id: 6, x: 8.2, y: 3.0 }, { id: 7, x: 4.6, y: 5.4 }, { id: 8, x: 9.2, y: 5 }, { id: 9, x: 9.0, y: 1 }],
          edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 7], [7, 4], [3, 4], [3, 5], [4, 6], [5, 6], [4, 8], [6, 8], [5, 9], [6, 9], [2, 5]],
          onClick: (c) => { const id = c.id ?? (c.node && c.node.id); if (id != null) { root = id; v.invalidate(); return true; } return undefined; },
        });
        const adj = new Map(G.nodes.map((n) => [n.id, []]));
        for (const e of G.edges) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
        let key = '', A = null, B = null;
        const prep = () => {
          const k = `${root}|${spread.value}|${seed}`; if (k === key) return; key = k;
          const d = (a, b) => 1 - 0.85 * spread.value * hash01(seed, Math.min(a, b), Math.max(a, b));
          const P = Math.max(...[...synchronize(adj, root, d, 'alpha', 1).level.values()]) + 1;
          A = synchronize(adj, root, d, 'alpha', P); B = synchronize(adj, root, d, 'beta', P); A.P = P;
        };
        v.render(() => {
          prep();
          const R = kind.value === 'alpha' ? A : B, tree = new Set(); for (const [u, p] of B.parent) if (p != null) tree.add(ekey(u, p));
          G.draw({
            nodeLabel: (id) => String(id), nodeColor: (id) => PAL[(A.level.get(id) ?? 0) % PAL.length], nodeFill: (id) => (id === root ? 'gold' : null),
            edgeColor: (e) => (kind.value === 'beta' ? (tree.has(ekey(e.from, e.to)) ? 'green' : 'faint') : 'accent'), edgeWidth: (e) => (kind.value === 'beta' ? (tree.has(ekey(e.from, e.to)) ? 3.5 : 1.2) : 2),
          });
          const P = A.P, top = Math.max(P + 1, ...A.starts[P].values(), ...B.starts[P].values()) * 1.05;
          for (const [s, R2, nm] of [[sA, A, 'α'], [sB, B, 'β']]) {
            s.setView([0, P + 0.5], [0, top]);
            s.line(0, 0, P, P, { color: 'muted', dash: true, width: 1.6 });
            for (const u of adj.keys()) s.path(range(P + 1).map((p) => [p, R2.starts[p].get(u)]), { color: PAL[(A.level.get(u) ?? 0) % PAL.length], width: kind.value === (nm === 'α' ? 'alpha' : 'beta') ? 2.2 : 1.5, alpha: 0.85 });
          }
        });
        v.readout(() => {
          prep(); const P = A.P, n = adj.size, tA = Math.max(...A.starts[P].values()), tB = Math.max(...B.starts[P].values()), h = B.height;
          const okA = tA / P <= 3 + 1e-9, okB = tB / P <= 2 + 2 * h + 1e-9;
          return `BFS needs $${P}$ pulses on $n=${n}$, $m=${A.m}$, tree height $${h}$ · ideal time $${P}$\n$\\alpha$: time $${v.fix(tA, 1)}$ (${v.fix(tA / P, 2)} per pulse ≤ 3 ${okA ? '✓' : '✗'}) · control messages **${A.ctrl}** = $2m$ safe + acks per pulse\n$\\beta$: time $${v.fix(tB, 1)}$ (${v.fix(tB / P, 2)} per pulse ≤ $2+2h=${2 + 2 * h}$ ${okB ? '✓' : '✗'}) · control messages **${B.ctrl}** = $2(n-1)$ per pulse + acks · algorithm messages ${A.appMsgs}`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Algorithm', name: 'Termination detection (Dijkstra–Scholten)',
      statement: String.raw`In a *diffusing computation* a single root process starts active, and an idle process can become active only by receiving a work message. In the Dijkstra–Scholten scheme every work message is acknowledged. A process that receives work while it is not *engaged* becomes engaged with the sender as its parent, and acknowledges its parent only when it is idle and has received an acknowledgement for each work message it sent; a process that is already engaged acknowledges at once. The engaged processes always form a tree rooted at the root. When the root is idle with every message it sent acknowledged, the computation has terminated: no process is active and no work message is in transit; and if it terminates, the root detects it. The scheme adds exactly one acknowledgement per work message.`,
      idea: String.raw`The invariant is that every active process and every in-flight work message is covered by the tree: a message in transit is counted in its sender's deficit, so the sender stays engaged, and every engaged process is a descendant of the root through parents that have not yet been acknowledged. If the root reaches deficit zero while idle, the tree has shrunk to the root alone, so nothing is active and nothing is on the way. The tree can only empty from the leaves, because a process disengages once all it sent is acknowledged. The naive rule "the root is idle, so we are done" fails exactly because work may still be hidden in channels or deep in the network. This is the broadcast and convergecast structure of 2.1 for a computation whose extent is not known in advance.`,
      caption: String.raw`Orange tokens are work messages and green tokens acknowledgements. Gold nodes are working, the ring marks engaged processes and the thick arrows are the engagement tree. Right: processes engaged and work in transit over time, with the true end of the computation (green) and the moment the root declares termination (red). Switch to *naive* and the root declares as soon as its own job ends, long before the work is done. Change the spawn probability and depth to make the computation bigger.`,
      deps: ['dist-2.1'], refs: ['Lynch §19.1'], tags: ['termination detection', 'diffusing computation'],
      credit: 'Dijkstra & Scholten, 1980',
      scope: String.raw`Reliable channels, asynchronous delays, a single initiator; processes can be activated only by messages. With several spontaneous initiators the scheme needs extending.`,
      viz(v) {
        const sG = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 360, title: 'network', weight: 1.25, minWidth: 300 });
        const sT = v.stage({ x: [0, 24], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time', ylabel: 'count', height: 360, title: 'engaged processes and work in transit', weight: 1, minWidth: 260 });
        const mode = v.select('detector', [{ value: 'ds', label: 'Dijkstra–Scholten' }, { value: 'naive', label: 'naive (root idle)' }], 'ds');
        const p = v.slider('spawn probability', 0.2, 1, 0.8, { step: 0.05 });
        const dp = v.slider('depth', 1, 7, 5, { step: 1, int: true });
        let seed = 4; v.button('new run', () => { seed++; });
        const G = v.graph(sG, {
          editable: false, directed: false, layout: 'none', r: 15, fontSize: 13, draggable: true,
          nodes: [{ id: 0, x: 1.1, y: 3 }, { id: 1, x: 3.0, y: 5 }, { id: 2, x: 3.0, y: 1 }, { id: 3, x: 5.0, y: 3.2 }, { id: 4, x: 6.8, y: 5.1 }, { id: 5, x: 6.8, y: 1.0 }, { id: 6, x: 8.8, y: 3.0 }, { id: 7, x: 5.0, y: 5.4 }],
          edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 7], [7, 4], [3, 4], [3, 5], [4, 6], [5, 6]],
        });
        const adj = new Map(G.nodes.map((n) => [n.id, []]));
        for (const e of G.edges) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
        let key = '', R = null;
        const prep = () => { const k = `${mode.value}|${p.value}|${dp.value}|${seed}`; if (k !== key) { key = k; R = diffuse(adj, 0, { p: p.value, depth: dp.value, seed, mode: mode.value }); } };
        const engagedAt = (u, t) => R.eng.find((e) => e.u === u && e.t0 <= t && (e.t1 == null || t < e.t1));
        const busyAt = (u, t) => R.jobs.some((j) => j.u === u && j.t0 <= t && t < j.t1);
        v.animate((t) => {
          prep();
          G.draw({
            nodeFill: (id) => (busyAt(id, t) ? 'gold' : null), nodeColor: (id) => (engagedAt(id, t) ? 'accent' : 'faint'), nodeRing: (id) => (engagedAt(id, t) ? 'accent' : null),
            edgeColor: (e) => { const a = engagedAt(e.from, t), b = engagedAt(e.to, t); return (a && a.par === e.to) || (b && b.par === e.from) ? 'accent' : 'faint'; },
            edgeWidth: (e) => { const a = engagedAt(e.from, t), b = engagedAt(e.to, t); return (a && a.par === e.to) || (b && b.par === e.from) ? 3.6 : 1.3; },
          });
          for (const m of R.msgs) {
            if (m.ts > t || m.tr <= t) continue;
            const a = G.node(m.from), b = G.node(m.to), f = (t - m.ts) / (m.tr - m.ts), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ox = (-dy / L) * 0.2, oy = (dx / L) * 0.2;
            sG.dot(a.x + dx * f + ox, a.y + dy * f + oy, { r: 6, color: m.kind === 'work' ? 'orange' : 'green', fill: true });
          }
          if (R.declared != null && t >= R.declared) sG.corner('root declares: terminated', 'tl', { color: mode.value === 'naive' && R.declared < R.trueEnd ? 'red' : 'green', plate: true });
          const T = Math.max(8, Math.ceil(R.end + 1)); sT.setView([0, T], [0, 10]);
          sT.fn((x) => R.eng.filter((e) => e.t0 <= x && (e.t1 == null || x < e.t1)).length, { color: 'accent', width: 2.4, n: 400 });
          sT.fn((x) => R.msgs.filter((m) => m.kind === 'work' && m.ts <= x && x < m.tr).length, { color: 'orange', width: 2.4, n: 400 });
          sT.vline(R.trueEnd, { color: 'green', dash: true, width: 2 });
          if (R.declared != null) sT.vline(R.declared, { color: 'red', width: 2 });
          sT.vline(t, { color: 'gold', width: 1.6 });
        }, { period: 28, still: 7 });
        v.legend([['orange', 'work'], ['green', 'acknowledgement / true end', { dot: true }], ['accent', 'engaged'], ['red', 'root declares']]);
        v.readout(() => {
          prep(); const W = R.msgs.filter((m) => m.kind === 'work').length, A = R.msgs.filter((m) => m.kind === 'ack').length, early = R.declared != null && R.declared < R.trueEnd - 1e-9;
          return `work messages **${W}**, acknowledgements **${A}**${mode.value === 'ds' ? ` ${W === A ? '✓ one each' : '✗'}` : ''} · computation really ends at $t=${v.fix(R.trueEnd, 1)}$ · root declares at $t=${R.declared == null ? '\\text{never}' : v.fix(R.declared, 1)}$ ${mode.value === 'ds' ? (R.declared != null && !early ? '✓ safe (never early)' : '✗') : (early ? '✗ declared too early: work was still running' : 'happened to be right this time')}`;
        });
      },
    },
  ],
};
