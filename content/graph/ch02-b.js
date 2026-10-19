// Graph Theory (Diestel) — Chapter 2: Matching, Covering and Packing, part b (§§2.3–2.5: Erdős–Pósa, tree packing and covering, path covers)
import {
  K, ix, comps, ekey, blobs, PALETTE, named, fixed, gstage, EDIT, MULTI_EDIT, eset, cacheBy, popc, bitsOf, adjMasks, compMasks,
  minFeedback, maxCyclePacking, isForestMinus, smallestSet, girth, lambda, packCover, crossEdges, densest, isConnected, isSpanningTree,
  exchangeSearch, chainFrom, fundCycleEdges, bfsTreeMask, multiEdit, bipMatch, konigCover, matchSize, ringPts,
} from './ch02.shared.js';

// ---------- local helpers ----------
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (s) => String(s).replace(/\d/g, (d) => SUB[d]);
const TC = ['blue', 'orange', 'purple', 'teal'];
const CC = ['orange', 'purple', 'teal', 'pink', 'blue'];
const log2 = Math.log2;
/** Diestel's constants in Lemma 2.3.1 / Theorem 2.3.2 (log = log₂). */
const rk = (k) => log2(k) + log2(log2(k)) + 4;
const sk = (k) => (k <= 1 ? 1 : 4 * k * rk(k));
const fk = (k) => Math.floor(sk(k) + k - 1);
/** Vertex list of a shortest cycle through z inside the vertex set allowed (Set of indices, containing z), or null. */
function shortestCycleThrough(H, z, allowed) {
  const dist = new Map([[z, 0]]), par = new Map([[z, -1]]), br = new Map([[z, -1]]), q = [z]; let best = null;
  const up = (x) => { const out = []; for (let y = x; y !== -1; y = par.get(y)) out.push(y); return out; }; // x … z
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    for (const [w] of H.adj[u]) {
      if (!allowed.has(w)) continue;
      if (!dist.has(w)) { dist.set(w, dist.get(u) + 1); par.set(w, u); br.set(w, u === z ? w : br.get(u)); q.push(w); continue; }
      if (w === par.get(u) || u === par.get(w)) continue; // tree edge
      let cyc = null;
      if (w === z || u === z) cyc = up(w === z ? u : w).reverse();
      else if (br.get(u) !== br.get(w)) cyc = up(u).reverse().concat(up(w).slice(0, -1));
      if (cyc && (!best || cyc.length < best.length)) best = cyc;
    }
  }
  return best;
}
/** Shortest cycle inside an allowed vertex set (vertex list) or null. */
function shortestCycleIn(H, allowed) { let best = null; for (const z of allowed) { const c = shortestCycleThrough(H, z, allowed); if (c && (!best || c.length < best.length)) best = c; } return best; }
/** Proof of Erdős–Pósa (2.3.2): greedy subgraph H with degrees 2 and 3, maximal under adding a disjoint cycle or an H-path between degree-2 vertices. */
function epStructure(H, k) {
  const n = H.n, inV = new Uint8Array(n), inE = new Uint8Array(H.m), deg = new Array(n).fill(0), ekeyMap = new Map(H.E.map(([a, b], i) => [ekey(a, b), i]));
  const addPath = (vs, close) => { const L = close ? vs.concat([vs[0]]) : vs; for (let i = 0; i + 1 < L.length; i++) { const e = ekeyMap.get(ekey(L[i], L[i + 1])); inE[e] = 1; deg[L[i]]++; deg[L[i + 1]]++; } for (const x of vs) inV[x] = 1; };
  for (let g = 0; g < 4 * n; g++) {
    let found = null;
    for (let x = 0; x < n && !found; x++) {
      if (!inV[x] || deg[x] !== 2) continue;
      const par = new Map([[x, -1]]), q = [x];
      for (let i = 0; i < q.length && !found; i++) {
        const u = q[i];
        for (const [w, e] of H.adj[u]) {
          if (inE[e]) continue;
          if (inV[w]) { if (w !== x && deg[w] === 2) { const P = [w]; for (let y = u; y !== -1; y = par.get(y)) P.push(y); found = P.reverse(); break; } continue; }
          if (!par.has(w)) { par.set(w, u); q.push(w); }
        }
      }
    }
    if (found) { addPath(found, false); continue; }
    const out = new Set([...Array(n).keys()].filter((x) => !inV[x])), C = shortestCycleIn(H, out);
    if (C) { addPath(C, true); continue; }
    break;
  }
  const U = [...Array(n).keys()].filter((x) => deg[x] === 3), Cz = [];
  for (let z = 0; z < n; z++) {
    if (!inV[z] || deg[z] !== 2) continue;
    const allowed = new Set([...Array(n).keys()].filter((x) => !inV[x] || x === z)), c = shortestCycleThrough(H, z, allowed);
    if (c) Cz.push({ z, c });
  }
  const Hsub = { n, adj: H.adj.map((l) => l.filter(([, e]) => inE[e])) }, HC = comps(Hsub, (x) => inV[x] === 1);
  const Z = new Set(Cz.map((o) => o.z)), D = HC.lists.filter((L) => L.length >= 3 && L.every((x) => deg[x] === 2) && !L.some((x) => Z.has(x)));
  const cycles = Cz.map((o) => o.c).concat(D.map((L) => { const ord = [L[0]], seen = new Set([L[0]]); for (let g = 0; g < L.length; g++) { const u = ord[ord.length - 1], nx = Hsub.adj[u].map(([w]) => w).find((w) => !seen.has(w)); if (nx == null) break; ord.push(nx); seen.add(nx); } return ord; }));
  const X = [...Z].concat(D.map((L) => L[0]));
  let cover = 0; for (const x of X.concat(U)) cover |= 1 << x;
  return { inV, inE, deg, U, Cz, Z, D, cycles, X, cover, ok: cycles.length >= k };
}
const cycEdges = (H, vs) => { const M = new Map(H.E.map(([a, b, e]) => [ekey(a, b), e])), out = new Set(); for (let i = 0; i < vs.length; i++) { const e = M.get(ekey(vs[i], vs[(i + 1) % vs.length])); if (e) out.add(e); } return out; };
/** All partitions of {0..n−1} as class arrays (restricted growth strings), visited by f(part, classes). */
function eachPartition(n, f) {
  const a = new Array(n).fill(0);
  const go = (i, mx) => { if (i === n) { f(a, mx + 1); return; } for (let c = 0; c <= mx + 1; c++) { a[i] = c; go(i + 1, Math.max(mx, c)); } };
  if (n) { a[0] = 0; go(1, 0); }
}
/** Minimum over all partitions P of (cross-edges − k(|P| − 1)), with a minimising partition (n ≤ 9). */
function packingSlack(H, k) {
  let best = { slack: Infinity, part: null, np: 0 };
  eachPartition(H.n, (a, np) => { let c = 0; for (const [x, y] of H.E) if (a[x] !== a[y]) c++; const sl = c - k * (np - 1); if (sl < best.slack) best = { slack: sl, part: a.slice(), np }; });
  return best;
}
/** Multigraph helpers. */
const mulH = (G) => ix(G, { multi: true });
const multiSpec = (P, E) => ({ nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: E.trim().split(/\s+/).map((p) => ({ from: p[0], to: p[1] })), layout: 'none' });
/** Arboricity by Bowler–Carmesin exchanges: least k with k spanning trees covering E (connected multigraph). */
function arboricity(H) { for (let k = 1; k <= H.m + 1; k++) { const R = packCover(H, k); if ([...R.used].every((x) => x > 0)) return { a: k, R }; } return { a: Infinity, R: null }; }
/** Directed index: out-neighbours by vertex index. */
function dix(G) { const ids = G.nodes.map((n) => n.id), pos = new Map(ids.map((id, i) => [K(id), i])), out = ids.map(() => []), arcs = []; for (const e of G.edges) { const a = pos.get(K(e.from)), b = pos.get(K(e.to)); if (a == null || b == null || a === b) continue; if (!out[a].includes(b)) { out[a].push(b); arcs.push([a, b, e]); } } return { n: ids.length, ids, pos, out, arcs }; }
/** Enumerate path covers (successor maps) of a digraph: {minPaths, best (succ array), ters: Map mask → succ}. */
function pathCovers(D, budget = 3e5) {
  const n = D.n, succ = new Array(n).fill(-1), hasPred = new Uint8Array(n), ters = new Map(); let steps = 0, best = null, minPaths = n + 1;
  const reaches = (from, target) => { for (let x = from, g = 0; x >= 0 && g <= n; x = succ[x], g++) if (x === target) return true; return false; };
  const go = (i) => {
    if (++steps > budget) return;
    if (i === n) {
      let mask = 0, cnt = 0; for (let v = 0; v < n; v++) if (succ[v] < 0) { mask |= 1 << v; cnt++; }
      if (!ters.has(mask)) ters.set(mask, succ.slice());
      if (cnt < minPaths) { minPaths = cnt; best = succ.slice(); }
      return;
    }
    for (const w of D.out[i]) { if (hasPred[w] || reaches(w, i)) continue; succ[i] = w; hasPred[w] = 1; go(i + 1); succ[i] = -1; hasPred[w] = 0; }
    go(i + 1);
  };
  go(0);
  return { minPaths, best, ters, exact: steps <= budget };
}
const pathsOf = (n, succ) => { const hasP = new Uint8Array(n); succ.forEach((w) => { if (w >= 0) hasP[w] = 1; }); const out = []; for (let v = 0; v < n; v++) if (!hasP[v]) { const P = [v]; for (let x = v, g = 0; succ[x] >= 0 && g < n; x = succ[x], g++) P.push(succ[x]); out.push(P); } return out; };
/** Maximum independent set size of a digraph's underlying graph (n ≤ 16). */
function alphaD(D) { const A = new Array(D.n).fill(0); for (const [a, b] of D.arcs) { A[a] |= 1 << b; A[b] |= 1 << a; } let best = 0, set = 0; for (let m = 0; m < 1 << D.n; m++) { const c = popc(m); if (c <= best) continue; let ok = true; for (let x = m; x; x &= x - 1) { const v = 31 - Math.clz32(x & -x); if (A[v] & m) { ok = false; break; } } if (ok) { best = c; set = m; } } return { best, set }; }
const DIG = () => ({ nodes: [['a', 1.0, 5.4], ['b', 3.4, 5.6], ['c', 6.0, 5.6], ['d', 8.8, 5.2], ['e', 1.6, 3.0], ['f', 4.2, 3.2], ['g', 6.6, 3.0], ['h', 9.0, 2.6], ['i', 3.0, 0.8], ['j', 6.4, 0.7]].map(([id, x, y]) => ({ id, x, y })),
  edges: 'ab bc cd ae bf cg dh ef fg gh ei fi gj hj ij fb'.split(' ').map((p) => ({ from: p[0], to: p[1] })), directed: true, layout: 'none' });

export default {
  collection: 'graph',
  chapter: 2,
  items: [
    // ================================================================== 2.3 The Erdős–Pósa theorem
    {
      num: '2.3.1a', kind: 'Definition', name: 'The Erdős–Pósa property',
      statement: String.raw`A class $\mathcal H$ of graphs has the **Erdős–Pósa property** if there is a function $f\colon\mathbb N\to\mathbb N$ such that for every $k$ and every graph $G$, either $G$ contains $k$ disjoint subgraphs each isomorphic to a graph in $\mathcal H$, or there is a set $U\subseteq V(G)$ of at most $f(k)$ vertices such that $G-U$ has no subgraph in $\mathcal H$. In other words, the minimum size of a *cover* (a vertex set meeting every $\mathcal H$-subgraph) is bounded by a function of the maximum size of a *packing* (disjoint $\mathcal H$-subgraphs), independently of $G$.`,
      idea: String.raw`A cover always needs at least as many vertices as there are disjoint $\mathcal H$-subgraphs, one in each: $\tau\ge\nu$. The property asks for a converse up to a function. König's theorem is the perfect case for $\mathcal H=\{K^2\}$ in bipartite graphs ($f(k)=k-1$). For cycles the answer is yes (Theorem 2.3.2, with $f(k)$ of order $k\log k$), for odd cycles it is no — there are graphs with no two disjoint odd cycles that need arbitrarily many vertices to meet all of them.`,
      caption: String.raw`For the graph on the left, a maximum family of disjoint cycles (coloured) and a minimum set of vertices meeting all cycles (red) are computed by brute force; the slider asks the property's question for your $k$. On the right, each dot is a graph with its packing number $\nu$ and covering number $\tau$; the yellow dot is yours. Graphs left of the line $\nu=k$ have no $k$ disjoint cycles, and the theorem bounds their $\tau$ by $f(k)$. Edit the graph (${EDIT}; up to 14 vertices).`,
      deps: ['graph-1.3.1a'], refs: ['Diestel, Graph Theory, 6th ed., §2.3, pp. 47–48'], tags: ['packing', 'covering', 'Erdős–Pósa'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch2.pdf' },
      viz(v) {
        const kS = v.slider('$k$', 1, 4, 2, { int: true });
        const s = gstage(v, { height: 320, title: '$G$: a cycle packing and a cycle cover' });
        const p = v.stage({ x: [-0.4, 4.4], y: [-0.4, 8.4], axes: 'box', gutter: true, height: 320, xlabel: 'ν = max. disjoint cycles', ylabel: 'τ = min. cover', title: 'packing against covering', xticks: [0, 1, 2, 3, 4], yticks: [0, 2, 4, 6, 8] });
        const G = v.graph(s, { ...named('petersen'), r: 13, editable: true });
        G.layout('fit'); G.nodes.forEach((n) => (n.label = ''));
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 14) G.removeNode(obj.id); };
        const meas = (g) => { const H = ix(g); return { nu: maxCyclePacking(H).val, tau: popc(minFeedback(H)) }; };
        const grid = (r, c) => { const g = v.graphs('grid', r, c); return { nodes: g.nodes.map((n) => ({ id: n.id })), edges: g.edges.map((e) => [e.from, e.to]) }; };
        const GAL = [['K⁴', named('complete', 4)], ['K⁵', named('complete', 5)], ['K⁶', named('complete', 6)], ['K⁷', named('complete', 7)], ['K⁸', named('complete', 8)], ['K⁹', named('complete', 9)], ['K₃,₃', named('kmn', 3, 3)], ['K₄,₄', named('kmn', 4, 4)], ['W₆', { nodes: [...Array(7).keys()].map((i) => ({ id: i })), edges: [...Array(6).keys()].flatMap((i) => [[6, i], [i, (i + 1) % 6]]) }], ['cube', named('cube')], ['3×3', grid(3, 3)], ['3×4', grid(3, 4)], ['4×4', grid(4, 4)], ['C⁵', named('cycle', 5)]]
          .map(([name, g]) => ({ name, ...meas(g) }));
        const pts = new Map(); for (const g of GAL) { const key = g.nu + ',' + g.tau; pts.set(key, (pts.get(key) ? pts.get(key) + ', ' : '') + g.name); }
        const info = cacheBy((G) => { const H = ix(G), P = maxCyclePacking(H), T = minFeedback(H); return { H, P, T: bitsOf(T).map((u) => K(H.ids[u])) }; });
        v.render(() => {
          const I = info(G), k = kS.value, T = new Set(I.T), cyc = I.P.cyc.map((c) => cycEdges(I.H, c));
          const col = (e) => { const i = cyc.findIndex((C) => C.has(e)); return i >= 0 ? PALETTE[[0, 1, 2, 3, 4, 6][i % 6]] : null; };
          G.draw({ nodeFill: (id) => (T.has(K(id)) ? 'red' : null), edgeColor: col, edgeWidth: (e) => (col(e) ? 4.5 : null) });
          p.vband(-0.4, k - 0.5, { color: 'faint', alpha: 0.18 });
          p.line(-0.4, -0.4, 4.4, 4.4, { color: 'muted', dash: [6, 4], width: 1.2 });
          p.text('τ = ν', 3.3, 3.3, { color: 'muted', size: 11.5, align: 'left', dy: 10 });
          p.text(`ν < ${k}: here τ ≤ f(${k}) = ${fk(k)}`, -0.25, 8.15, { color: 'muted', size: 11.5, baseline: 'top' });
          for (const [key, name] of pts) { const [x, y] = key.split(',').map(Number); p.dot(x, y, { r: 5, color: 'accent' }); p.text(name, x, y, { dx: 9, size: 11, color: 'muted', baseline: 'middle' }); }
          p.dot(I.P.val, I.T.length, { r: 7.5, color: 'gold' });
        });
        v.legend([['blue', 'disjoint cycles (a maximum packing)'], ['red', 'minimum cover (meets every cycle)', { dot: true }], ['gold', 'your graph', { dot: true }]]);
        v.readout(() => {
          const I = info(G), k = kS.value;
          return `$\\nu(G) = ${I.P.val}$ disjoint cycles · $\\tau(G) = ${I.T.length}$ vertices meet all cycles · for $k = ${k}$: ${I.P.val >= k ? `**$G$ contains ${k} disjoint cycles**` : `no ${k} disjoint cycles, and a cover of ${I.T.length} ≤ $f(${k}) = ${fk(k)}$ vertices exists ✓`}`;
        });
      },
    },
    {
      num: '2.3.1', kind: 'Lemma', name: 'Large cubic multigraphs contain k disjoint cycles',
      statement: String.raw`Let $k\in\mathbb N$ and put $r_k=\log k+\log\log k+4$ and $s_k=4kr_k$ for $k\ge2$, $s_k=1$ for $k\le1$ (logarithms to base 2). Every cubic multigraph $H$ with $|H|\ge s_k$ contains $k$ disjoint cycles.`,
      idea: String.raw`Induction on $k$. Take a shortest cycle $C$; since $H$ is cubic, $|C|\le2\log|H|$ (Corollary 1.3.5; loops and double edges are cycles of length 1 and 2). Delete $C$, then repeatedly delete vertices of degree at most 1 and suppress vertices of degree 2. Fewer than $2|C|$ vertices disappear this way, so the cubic multigraph $H'$ left over has $|H'|\ge|H|-2|C|\ge|H|-4\log|H|\ge s_{k-1}$ by the choice of $s_k$, and by induction it contains $k-1$ disjoint cycles, which together with $C$ (on a subdivision of $H'$ in $H-C$) give $k$.`,
      caption: String.raw`A random cubic multigraph (loops and parallel edges allowed). Step through the proof's procedure: the gold cycle is a shortest one; it is removed and the rest is cleaned up to a cubic multigraph again. The bars on the right show $|H|$ after each round, with the bound $|H|-2|C|$ (red tick) that the proof guarantees. Compare the number of disjoint cycles actually found with the number guaranteed by the lemma, $\max\{k: s_k\le|H|\}$ — the lemma is generous.`,
      deps: ['graph-1.3.5', 'graph-1.10.1a'], refs: ['Diestel §2.3'], tags: ['Erdős–Pósa', 'cubic graphs', 'girth'],
      viz(v) {
        const nS = v.slider('$|H|$', 8, 60, 44, { step: 2, int: true, onChange: () => S.reset({ at: 'end' }) });
        let seed = 2;
        v.button('New graph', () => { seed++; S.reset({ at: 'end' }); });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 330 });
        const p = v.stage({ x: [-0.6, 8.6], y: [0, 62], axes: 'box', gutter: true, height: 330, xlabel: 'round', ylabel: '|H|', title: 'order after each round', minWidth: 240, weight: 0.8 });
        const G = v.graph(s, { nodes: [], edges: [], r: 5, draggable: false });
        function frames() {
          const n = nS.value, r = v.rng(seed * 1009 + n), pts = []; for (let x = 0; x < n; x++) pts.push(x, x, x);
          for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
          let E = []; for (let i = 0; i < pts.length; i += 2) E.push({ a: pts[i], b: pts[i + 1], id: i / 2, eids: [i / 2] });
          const E0 = E.map((e) => ({ ...e })), cycRound = new Map(), edgeRound = new Map(); // original vertices / edges → index of the cycle using them
          const P = ringPts(n, 1); let nid = E.length;
          const alive = new Set([...Array(n).keys()]), F = [], hist = [{ n, lb: n }];
          const deg = (x) => E.reduce((c, e) => c + (e.a === x) + (e.b === x), 0);
          const snap = (o) => F.push({ alive: new Set(alive), E: E.map((e) => ({ ...e })), P, hist: hist.map((h) => ({ ...h })), ...o });
          let found = 0, bonus = 0;
          snap({ note: `A random cubic multigraph on ${n} vertices.` });
          for (let round = 0; round < 40 && alive.size; round++) {
            let C = null; const loop = E.find((e) => e.a === e.b);
            if (loop) C = { vs: [loop.a], es: new Set([loop.id]) };
            else { const seen = new Map(); for (const e of E) { const kk = ekey(e.a, e.b); if (seen.has(kk)) { C = { vs: [e.a, e.b], es: new Set([e.id, seen.get(kk)]) }; break; } seen.set(kk, e.id); } }
            if (!C) {
              const ids = [...alive], H = ix({ nodes: ids.map((x) => ({ id: x })), edges: E.map((e) => [e.a, e.b]) }), g = girth(H);
              if (!g.cycle.length) break;
              const vs = g.cycle.map((u) => H.ids[u]), es = new Set(); for (let i = 0; i < vs.length; i++) { const a = vs[i], b = vs[(i + 1) % vs.length]; const e = E.find((x) => !es.has(x.id) && ekey(x.a, x.b) === ekey(a, b)); if (e) es.add(e.id); }
              C = { vs, es };
            }
            const before = alive.size; found++;
            for (const e of E) if (C.es.has(e.id)) for (const oid of e.eids) { edgeRound.set(oid, found - 1); const o = E0[oid]; cycRound.set(o.a, found - 1); cycRound.set(o.b, found - 1); }
            snap({ cyc: C, note: `Round ${round + 1}: a shortest cycle has length ${C.vs.length} (≤ $2\\log_2|H| = ${(2 * log2(before)).toFixed(1)}$). Delete it.` });
            for (const x of C.vs) alive.delete(x); E = E.filter((e) => alive.has(e.a) && alive.has(e.b));
            for (let ch = true, g2 = 0; ch && g2 < 10 * n; g2++) {
              ch = false;
              for (const x of [...alive]) {
                const d = deg(x);
                if (d <= 1) { alive.delete(x); E = E.filter((e) => e.a !== x && e.b !== x); ch = true; }
                else if (d === 2) {
                  const inc = E.filter((e) => e.a === x || e.b === x);
                  if (inc.length === 1) { alive.delete(x); for (const oid of inc[0].eids) { edgeRound.set(oid, found + bonus); const o = E0[oid]; cycRound.set(o.a, found + bonus); cycRound.set(o.b, found + bonus); } E = E.filter((e) => e !== inc[0]); bonus++; ch = true; continue; } // an isolated loop: a cycle on its own
                  const ends = inc.map((e) => (e.a === x ? e.b : e.a)); alive.delete(x); E = E.filter((e) => !inc.includes(e)); E.push({ a: ends[0], b: ends[1], id: nid++, eids: inc[0].eids.concat(inc[1].eids) }); ch = true;
                }
              }
            }
            hist.push({ n: alive.size, lb: Math.max(0, before - 2 * C.vs.length) });
            snap({ note: `Remove vertices of degree ≤ 1 and suppress those of degree 2: a cubic multigraph on ${alive.size} vertices remains (proof: ≥ ${Math.max(0, before - 2 * C.vs.length)}).`, found: found + bonus });
          }
          F.push({ ...F[F.length - 1], alive: new Set([...Array(n).keys()]), E: E0, cycRound, edgeRound, cyc: null, done: true, found: found + bonus, note: `Done — the cycles found, traced back to the original multigraph through the suppressed vertices: ${found + bonus} disjoint cycles found${bonus ? ` (${bonus} of them were left over as isolated loops)` : ''}.` });
          return F;
        }
        const S = v.steps({ frames, speed: 1.2, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.alive) return;
          G.set({ nodes: [...f.alive].map((x) => ({ id: x, x: f.P[x][0], y: f.P[x][1], label: '' })), edges: f.E.map((e) => ({ from: e.a, to: e.b, cid: e.id })), layout: 'none' });
          if (f.done) G.draw({ nodeFill: (id) => (f.cycRound.has(id) ? PALETTE[f.cycRound.get(id) % 8] : 'faint'), edgeColor: (e) => (f.edgeRound.has(e.cid) ? PALETTE[f.edgeRound.get(e.cid) % 8] : 'faint'), edgeWidth: (e) => (f.edgeRound.has(e.cid) ? 3 : 1.1) });
          else G.draw({ nodeFill: (id) => (f.cyc && f.cyc.vs.includes(id) ? 'gold' : 'accent'), edgeColor: (e) => (f.cyc && f.cyc.es.has(e.cid) ? 'gold' : null), edgeWidth: (e) => (f.cyc && f.cyc.es.has(e.cid) ? 4 : 1.5) });
          if (!f.alive.size) s.text('(empty)', 0, 0, { align: 'center', color: 'muted' });
          const n0 = nS.value; p.setView([-0.6, Math.max(4, f.hist.length) - 0.4], [0, n0 + 4]);
          p.bars(f.hist.map((h) => h.n), { x0: 0, dx: 1, color: (val, i) => (i === f.hist.length - 1 ? 'gold' : 'accent') });
          f.hist.forEach((h, i) => { if (i) p.line(i - 0.42, h.lb, i + 0.42, h.lb, { color: 'red', width: 2.5 }); });
          for (let k = 2; sk(k) <= n0 + 4; k++) { p.hline(sk(k), { color: 'muted', dash: [4, 4], width: 1 }); p.text(`s${sub(k)}`, Math.max(4, f.hist.length) - 0.5, sk(k), { dy: -8, size: 11, color: 'muted', align: 'right' }); }
        });
        v.legend([['gold', 'shortest cycle, removed'], ['accent', '$|H|$ after the round', { area: true }], ['red', 'guaranteed $\\ge|H|-2|C|$'], ['muted', '$s_k$', { dash: true }]]);
        v.readout(() => {
          const last = S.frames[S.n - 1]; if (!last) return '';
          const n = nS.value; let g = 0; for (let k = 1; k < 50; k++) if (sk(k) <= n) g = k;
          return `$|H| = ${n}$ · $s_2 = ${sk(2).toFixed(0)}$, $s_3 = ${sk(3).toFixed(1)}$ · the lemma guarantees **${g}** disjoint cycle(s) · the procedure found **${last.found ?? 0}** · every round lost at most $2|C|$ vertices: ${last.hist.every((h) => h.n >= h.lb) ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '2.3.2', kind: 'Theorem', name: 'Erdős–Pósa theorem for cycles', credit: 'Erdős & Pósa, 1965',
      statement: String.raw`There is a function $f\colon\mathbb N\to\mathbb N$ such that, for every $k\in\mathbb N$, every graph contains either $k$ disjoint cycles or a set of at most $f(k)$ vertices meeting all its cycles. One can take $f(k)=\lfloor s_k+k-1\rfloor$ with $s_k$ as in Lemma 2.3.1, which is of order $k\log k$.`,
      idea: String.raw`Take a maximal subgraph $H$ of $G$ with all degrees 2 or 3, and let $U$ be its degree-3 vertices. Pick one cycle $C_z$ for each vertex $z\in H-U$ that lies on a cycle meeting $H$ only in $z$; by maximality these are disjoint. Together with the 2-regular components of $H$ avoiding these $z$ (the set $\mathcal D$) they form disjoint cycles. If there are fewer than $k$, put one vertex of each into $X$, $|X|\le k-1$. Every cycle of $G$ then meets $X\cup U$ (maximality again). Finally, if $|U|\ge s_k$, Lemma 2.3.1 applied to $H$ with its degree-2 vertices suppressed gives $k$ disjoint cycles.`,
      caption: String.raw`The proof's construction runs on your graph: the teal subgraph $H$ (degrees 2 and 3), its degree-3 vertices $U$ (purple), the private cycles $C_z$ (orange, dashed) and the cycle components $\mathcal D$. Either $k$ disjoint cycles light up in green, or $X$ (red) and $U$ together meet every cycle — checked by testing that $G-(X\cup U)$ is a forest — and the readout compares $|X\cup U|$ with the optimum $\tau(G)$. On the sun, $H$ is the central triangle and the three petals are private cycles $C_z$; on the flower, the cover is needed. Edit the graph (${EDIT}).`,
      deps: ['graph-2.3.1', 'graph-2.3.1a'], refs: ['Diestel §2.3'], tags: ['Erdős–Pósa', 'cycles', 'packing'],
      viz(v) {
        const kS = v.slider('$k$', 1, 4, 3, { int: true });
        const PRE = {
          sun: () => fixed({ a: [5.0, 4.2], b: [4.0, 2.6], c: [6.0, 2.6], d: [3.9, 5.1], e: [5.0, 6.0], f: [6.1, 5.1], g: [2.6, 3.1], h: [1.9, 1.8], i: [3.2, 1.2], j: [7.4, 3.1], k: [8.1, 1.8], l: [6.8, 1.2] }, 'ab bc ca ad de ef fa bg gh hi ib cj jk kl lc'),
          flowers: () => fixed({ a: [1.0, 5.4], b: [2.4, 6.0], c: [2.2, 4.4], d: [5.0, 3.4], e: [4.2, 5.6], f: [5.8, 5.8], g: [8.6, 5.4], h: [7.6, 6.0], i: [7.8, 4.4], j: [2.6, 1.0], k: [4.0, 1.8], l: [6.2, 1.6], m: [7.6, 0.8] }, 'ab bc ca cd de ef fd di ih hg gi dk kj jd dl lm md'),
          grid: () => { const g = v.graphs('grid', 3, 4); return { nodes: g.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: g.edges.map((e) => [e.from, e.to]), layout: 'fit' }; },
          k33: () => named('kmn', 3, 3),
        };
        const pre = v.select('', [{ value: 'sun', label: 'sun' }, { value: 'flowers', label: 'flower' }, { value: 'grid', label: '3×4 grid' }, { value: 'k33', label: '$K_{3,3}$' }], 'sun', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: P.layout === 'none' ? n.id : '' })), edges: P.edges }).layout(P.layout || 'none'); } });
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...PRE.sun(), r: 13, editable: true });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 16) G.removeNode(obj.id); };
        const info = cacheBy((G, k) => {
          const H = ix(G), R = epStructure(H, +k), A = adjMasks(H), forest = isForestMinus(H, A, R.cover);
          return { H, R, forest, tau: H.n <= 16 ? popc(minFeedback(H)) : null, nu: H.n <= 16 ? maxCyclePacking(H).val : null };
        });
        v.render(() => {
          const k = kS.value, I = info(G, String(k)), { H, R } = I, idOf = (u) => K(H.ids[u]);
          const Uset = new Set(R.U.map(idOf)), Xset = new Set(R.X.map(idOf)), inH = new Set(H.E.filter((_, e) => R.inE[e]).map((x) => x[2]));
          const Cz = new Set(); R.Cz.forEach((o) => cycEdges(H, o.c).forEach((e) => Cz.add(e)));
          const win = R.ok ? new Set() : null; if (R.ok) R.cycles.slice(0, k).forEach((c) => cycEdges(H, c).forEach((e) => win.add(e)));
          G.draw({
            nodeFill: (id) => (!R.ok && Xset.has(K(id)) ? 'red' : Uset.has(K(id)) ? 'purple' : null), nodeRing: (id) => (R.Z.has(H.at(id)) ? 'orange' : null),
            edgeColor: (e) => (win && win.has(e) ? 'green' : inH.has(e) ? 'teal' : Cz.has(e) ? 'orange' : null), edgeWidth: (e) => (win && win.has(e) ? 5 : inH.has(e) ? 3.4 : Cz.has(e) ? 2.6 : null), edgeDash: (e) => !inH.has(e) && Cz.has(e) && !(win && win.has(e)),
          });
          s.corner(R.ok ? `${k} disjoint cycles` : `X ∪ U meets every cycle`, 'tl', { color: R.ok ? 'green' : 'red', weight: 700 });
        });
        v.legend([['teal', 'subgraph $H$ (degrees 2, 3)'], ['purple', '$U$: degree 3 in $H$', { dot: true }], ['orange', 'cycles $C_z$', { dash: true }], ['red', '$X$', { dot: true }], ['green', '$k$ disjoint cycles']]);
        v.readout(() => {
          const k = kS.value, I = info(G, String(k)), { R } = I;
          const opt = I.tau != null ? ` · optimum: $\\nu(G) = ${I.nu}$, $\\tau(G) = ${I.tau}$` : '';
          const head = `$|U| = ${R.U.length}$ (< $s_{${k}} = ${sk(k).toFixed(0)}$) · $|\\mathcal C'| = ${R.Cz.length}$, $|\\mathcal D| = ${R.D.length}$`;
          if (R.ok) return `${head} · $|\\mathcal C'\\cup\\mathcal D| \\ge ${k}$: **${k} disjoint cycles** ✓${opt}`;
          return `${head} · $|X| = ${R.X.length} \\le k-1 = ${k - 1}$ · $|X\\cup U| = ${popc(R.cover)} \\le f(${k}) = ${fk(k)}$ · $G-(X\\cup U)$ ${I.forest ? 'is a forest ✓' : 'has a cycle ✗'}${opt}`;
        });
      },
    },
    // ================================================================== 2.4 Tree packing and arboricity
    {
      num: '2.4.1', kind: 'Theorem', name: 'Nash-Williams–Tutte tree-packing theorem', credit: 'Nash-Williams, 1961; Tutte, 1961',
      statement: String.raw`A multigraph contains $k$ edge-disjoint spanning trees if and only if for every partition $P$ of its vertex set it has at least $k\,(|P|-1)$ **cross-edges** (edges between different classes of $P$).`,
      idea: String.raw`Necessity: a spanning tree has at least $|P|-1$ cross-edges, since contracting the classes leaves a connected multigraph on $|P|$ vertices; $k$ edge-disjoint trees need $k(|P|-1)$. Sufficiency follows from the packing-covering theorem (2.4.4): it gives a partition $P$ such that every class carries $k$ edge-disjoint spanning trees and $G/P$ is covered by $k$ spanning trees. If $G/P$ has at least $k(|P|-1)$ edges, these $k$ covering trees (with $|P|-1$ edges each) must be edge-disjoint, and combining them with the trees inside the classes gives $k$ edge-disjoint spanning trees of $G$.`,
      caption: String.raw`Choose $k$. Either $k$ edge-disjoint spanning trees appear (one colour each; grey dashed edges are unused), or the partition from the packing-covering theorem is shaded, with its cross-edges (orange) fewer than $k(|P|-1)$. For up to 9 vertices the readout also checks all partitions by brute force. Petersen has 15 edges but two spanning trees need 18. Edit the multigraph: ${MULTI_EDIT}.`,
      deps: ['graph-1.5.1', 'graph-1.10.1a'], see: ['graph-2.4.4'], refs: ['Diestel §2.4'], tags: ['spanning trees', 'packing'],
      viz(v) {
        const PRE = {
          wheel: () => ({ nodes: [{ id: 'h', x: 5, y: 3.2 }].concat(ringPts(5, 2.7, 5, 3.2).map(([x, y], i) => ({ id: 'abcde'[i], x, y }))), edges: [...'abcde'].flatMap((c, i) => [{ from: 'h', to: c }, { from: c, to: 'abcde'[(i + 1) % 5] }]) }),
          two: () => multiSpec({ a: [1.0, 5.2], b: [3.2, 5.6], c: [1.4, 1.2], d: [3.4, 1.0], e: [6.6, 5.6], f: [8.9, 5.2], g: [6.6, 1.0], h: [8.6, 1.2] }, 'ab ac ad bc bd cd ef eg eh fg fh gh be dg'),
          pet: () => { const P = named('petersen'); return { nodes: P.nodes.map((n) => ({ id: n.id, x: 5 + 2.9 * n.x, y: 3.2 + 2.9 * n.y, label: '' })), edges: P.edges.map(([a, b]) => ({ from: a, to: b })) }; },
          dbl: () => ({ nodes: ringPts(5, 2.6, 5, 3.2).map(([x, y], i) => ({ id: 'abcde'[i], x, y })), edges: [...'abcde'].flatMap((c, i) => [{ from: c, to: 'abcde'[(i + 1) % 5] }, { from: c, to: 'abcde'[(i + 1) % 5] }]) }),
        };
        const pre = v.select('', [{ value: 'wheel', label: 'wheel' }, { value: 'two', label: 'two $K^4$' }, { value: 'pet', label: 'Petersen' }, { value: 'dbl', label: 'doubled $C^5$' }], 'two', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes, edges: P.edges }); } });
        const kS = v.slider('$k$', 1, 4, 2, { int: true });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...PRE.two(), r: 13 });
        const ed = multiEdit(G, { maxNodes: 12 });
        const info = cacheBy((G, k) => {
          const H = mulH(G); k = +k; if (!isConnected(H)) return { H, disc: true };
          const R = packCover(H, k), disjoint = [...R.used].every((x) => x <= 1), cross = crossEdges(H, R.part);
          return { H, R, disjoint, cross, brute: H.n <= 9 ? packingSlack(H, k) : null };
        });
        v.render(() => {
          const k = kS.value, I = info(G, String(k)), H = I.H;
          if (I.disc) { G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null) }); s.corner('disconnected: no spanning tree at all', 'tl', { color: 'red', weight: 700 }); return; }
          const tree = (e) => { const x = H.eix.get(e); for (let j = 0; j < k; j++) if (I.R.T[j][x]) return j; return -1; };
          if (I.disjoint) G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null), edgeColor: (e) => (tree(e) >= 0 ? TC[tree(e)] : 'faint'), edgeWidth: (e) => (tree(e) >= 0 ? 4 : 1.4), edgeDash: (e) => tree(e) < 0 });
          else {
            const groups = []; H.ids.forEach((id, u) => { (groups[I.R.part[u]] ||= []).push(id); });
            blobs(v, s, G, groups, CC, 38, 0.18);
            const cr = (e) => I.R.part[H.at(e.from)] !== I.R.part[H.at(e.to)];
            G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null), edgeColor: (e) => (cr(e) ? 'orange' : 'muted'), edgeWidth: (e) => (cr(e) ? 3.6 : 1.5) });
          }
          s.corner(I.disjoint ? `${k} edge-disjoint spanning trees` : `partition with too few cross-edges`, 'tl', { color: I.disjoint ? 'green' : 'red', weight: 700 });
        });
        v.legend([['blue', 'tree 1'], ['orange', 'tree 2 / cross-edges'], ['purple', 'tree 3'], ['teal', 'tree 4'], ['faint', 'unused', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, I = info(G, String(k)); if (I.disc) return 'connect the multigraph';
          const b = I.brute ? ` · brute force over all partitions: min of cross-edges $- k(|P|-1)$ is ${I.brute.slack} ${I.brute.slack >= 0 ? '≥ 0' : '< 0'} ${(I.brute.slack >= 0) === I.disjoint ? '✓' : '✗'}` : '';
          return `$\\|G\\| = ${I.H.m}$, $k(|G|-1) = ${k * (I.H.n - 1)}$ · ${I.disjoint ? `**${k} edge-disjoint spanning trees** ✓ (all verified as trees)` : `no packing: $|P| = ${I.R.np}$ classes, ${I.cross} cross-edges $< k(|P|-1) = ${k * (I.R.np - 1)}$`}${b}`;
        });
      },
    },
    {
      num: '2.4.2', kind: 'Corollary', name: '2k-edge-connected: k edge-disjoint spanning trees',
      statement: String.raw`Every $2k$-edge-connected multigraph has $k$ edge-disjoint spanning trees.`,
      idea: String.raw`Let $P$ be a partition into $r$ classes. Each class is joined to the rest by at least $2k$ edges, by edge-connectivity; summing over the classes counts every cross-edge twice, so there are at least $\frac12\cdot r\cdot2k=kr\ge k(r-1)$ cross-edges, and Theorem 2.4.1 applies. The factor 2 cannot simply be dropped: $(2k-1)$-regular, $(2k-1)$-edge-connected graphs on more than $2k$ vertices have fewer than $k(|G|-1)$ edges.`,
      caption: String.raw`The readout computes the edge-connectivity $\lambda(G)$ by max-flow. With a multigraph of $\lambda\ge2k$ the $k$ coloured spanning trees always appear. The circulant examples are $(2k-1)$-regular with $\lambda=2k-1$: they fall one short of the hypothesis, and indeed the singleton partition has too few cross-edges. Change $k$ and the graph; in the last option you can edit (${MULTI_EDIT}).`,
      deps: ['graph-2.4.1', 'graph-1.4.1b'], refs: ['Diestel §2.4'], tags: ['spanning trees', 'edge-connectivity'],
      viz(v) {
        const kS = v.slider('$k$', 1, 3, 2, { int: true, onChange: () => load() });
        const typ = v.select('', [{ value: 'mult', label: 'λ ≥ 2k multigraph' }, { value: 'circ', label: '(2k−1)-regular circulant' }, { value: 'edit', label: 'your multigraph' }], 'circ', { onChange: () => load() });
        let seed = 1;
        v.button('Resample', () => { seed++; load(); });
        const s = gstage(v, { height: 320 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12 });
        const ed = multiEdit(G, { maxNodes: 12 });
        function load() {
          const k = kS.value, r = v.rng(seed * 7 + k);
          if (typ.value === 'mult') {
            const n = 6, P = ringPts(n, 2.7, 5, 3.2), edges = [];
            for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) edges.push({ from: i, to: (i + 1) % n });
            for (let t = 0; t < 3; t++) { const a = Math.floor(r() * n), b = (a + 2 + Math.floor(r() * (n - 3))) % n; edges.push({ from: a, to: b }); }
            G.set({ nodes: P.map(([x, y], i) => ({ id: i, x, y, label: '' })), edges });
          } else if (typ.value === 'circ') {
            const n = k === 1 ? 6 : 2 * k + 4, J = k === 1 ? [] : [...Array(k - 1).keys()].map((i) => i + 1).concat([n / 2]), P = ringPts(n, 2.8, 5, 3.2), edges = [];
            if (k === 1) for (let i = 0; i + 1 < n; i++) edges.push({ from: i, to: i + 1 });
            else for (let i = 0; i < n; i++) for (const j of J) { const w = (i + j) % n; if (j === n / 2 && w < i) continue; edges.push({ from: i, to: w }); }
            G.set({ nodes: P.map(([x, y], i) => ({ id: i, x, y, label: '' })), edges });
          } else if (!G.nodes.length || typ.value === 'edit') { const P = ringPts(5, 2.6, 5, 3.2); G.set({ nodes: P.map(([x, y], i) => ({ id: i, x, y, label: '' })), edges: [0, 1, 2, 3, 4].flatMap((i) => [{ from: i, to: (i + 1) % 5 }, { from: i, to: (i + 1) % 5 }, { from: i, to: (i + 2) % 5 }]) }); }
        }
        load();
        const info = cacheBy((G, k) => {
          k = +k; const H = mulH(G); if (!isConnected(H)) return { H, disc: true, lam: 0 };
          const lam = lambda(H).l, R = packCover(H, k), disjoint = [...R.used].every((x) => x <= 1);
          return { H, lam, R, disjoint, cross: crossEdges(H, R.part) };
        });
        v.render(() => {
          const k = kS.value, I = info(G, String(k)), H = I.H;
          if (I.disc) { G.draw(); s.corner('disconnected', 'tl', { color: 'red', weight: 700 }); return; }
          const tree = (e) => { const x = H.eix.get(e); for (let j = 0; j < k; j++) if (I.R.T[j][x]) return j; return -1; };
          if (I.disjoint) G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null), edgeColor: (e) => (tree(e) >= 0 ? TC[tree(e)] : 'faint'), edgeWidth: (e) => (tree(e) >= 0 ? 4 : 1.4), edgeDash: (e) => tree(e) < 0 });
          else { const groups = []; H.ids.forEach((id, u) => { (groups[I.R.part[u]] ||= []).push(id); }); blobs(v, s, G, groups, CC, 34, 0.18); G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null), edgeColor: () => 'orange' }); }
          s.corner(`λ(G) = ${I.lam} ${I.lam >= 2 * k ? '≥' : '<'} 2k = ${2 * k}`, 'tl', { color: I.lam >= 2 * k ? 'green' : 'red', weight: 700 });
        });
        v.legend([['blue', 'tree 1'], ['orange', 'tree 2 / cross-edges'], ['purple', 'tree 3'], ['faint', 'unused', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, I = info(G, String(k)); if (I.disc) return 'connect the multigraph';
          const hyp = I.lam >= 2 * k;
          return `$\\lambda(G) = ${I.lam}$ · $\\|G\\| = ${I.H.m}$ vs $k(|G|-1) = ${k * (I.H.n - 1)}$ · ${I.disjoint ? `**${k} edge-disjoint spanning trees**` : `no ${k} edge-disjoint spanning trees (partition into ${I.R.np} classes with ${I.cross} < ${k * (I.R.np - 1)} cross-edges)`} · ${hyp ? (I.disjoint ? 'as the corollary promises ✓' : '✗') : 'hypothesis $\\lambda\\ge 2k$ fails, so the corollary says nothing'}`;
        });
      },
    },
    {
      num: '2.4.3', kind: 'Theorem', name: 'Nash-Williams tree-covering theorem', credit: 'Nash-Williams, 1964',
      statement: String.raw`The edges of a multigraph $G=(V,E)$ can be covered by at most $k$ trees if and only if $\|G[U]\|\le k\,(|U|-1)$ for every non-empty set $U\subseteq V$.`,
      idea: String.raw`Necessity: a tree contains at most $|U|-1$ edges with both ends in $U$. Sufficiency, via the packing-covering theorem (2.4.4) applied to each component $C$: the classes $U$ of its partition carry $k$ edge-disjoint spanning trees, which use $k(|U|-1)\ge\|G[U]\|$ edges and hence *all* edges of $G[U]$; adding the $k$ spanning trees of $C/P$ that cover the cross-edges gives $k$ spanning trees of $C$ covering $E(C)$. Combining components gives $k$ forests, which extend to $k$ trees.`,
      caption: String.raw`The slider sets the number $k$ of trees. If $k$ suffices, the edges are split into $k$ forests (colours) taken from $k$ covering trees. If not, a class $U$ of the Bowler–Carmesin partition containing an uncovered edge is shaded: it is too dense, $\|G[U]\|>k(|U|-1)$. The readout compares the least $k$ (the arboricity) with $\max_U\lceil\|G[U]\|/(|U|-1)\rceil$, computed by brute force. Edit the multigraph: ${MULTI_EDIT}.`,
      deps: ['graph-1.5.2', 'graph-1.10.1a'], see: ['graph-2.4.4'], refs: ['Diestel §2.4'], tags: ['spanning trees', 'covering', 'arboricity'],
      viz(v) {
        const kS = v.slider('$k$', 1, 4, 2, { int: true });
        const s = gstage(v, { height: 330 });
        const base = multiSpec({ a: [1.2, 5.2], b: [3.4, 5.8], c: [2.0, 2.8], d: [4.2, 3.6], e: [6.4, 5.4], f: [8.8, 5.0], g: [6.8, 2.6], h: [8.8, 1.4], i: [4.4, 0.8] }, 'ab ac ad bc bd cd de ef eg fg fh gh gi ci ab cd');
        const G = v.graph(s, { ...base, r: 13 });
        const ed = multiEdit(G, { maxNodes: 12 });
        const info = cacheBy((G, k) => {
          k = +k; const H = mulH(G); if (!isConnected(H)) return { H, disc: true };
          const R = packCover(H, k), uncovered = [...Array(H.m).keys()].filter((e) => !R.used[e]), A = arboricity(H), d = densest(H);
          let dense = null; if (uncovered.length) { const c = R.part[H.E[uncovered[0]][0]]; dense = [...Array(H.n).keys()].filter((u) => R.part[u] === c); }
          return { H, R, uncovered, a: A.a, d, dense, cover: uncovered.length ? null : R.T };
        });
        v.render(() => {
          const k = kS.value, I = info(G, String(k)), H = I.H;
          if (I.disc) { G.draw(); s.corner('disconnected: apply the theorem to each component', 'tl', { color: 'red' }); return; }
          const ring = (id) => (K(id) === K(ed.sel) ? 'gold' : null);
          if (I.cover) { const forest = (e) => { const x = H.eix.get(e); for (let j = 0; j < k; j++) if (I.cover[j][x]) return j; return -1; }; G.draw({ nodeRing: ring, edgeColor: (e) => TC[forest(e)], edgeWidth: () => 3.6 }); }
          else {
            const U = new Set(I.dense.map((u) => K(H.ids[u]))), unc = new Set(I.uncovered.map((e) => H.E[e][2]));
            blobs(v, s, G, [I.dense.map((u) => H.ids[u])], 'red', 40, 0.16);
            G.draw({ nodeRing: ring, nodeFill: (id) => (U.has(K(id)) ? 'red' : null), edgeColor: (e) => (unc.has(e) ? 'red' : U.has(K(e.from)) && U.has(K(e.to)) ? 'ink' : 'muted'), edgeWidth: (e) => (unc.has(e) ? 3.6 : 1.8), edgeDash: (e) => unc.has(e) });
          }
          s.corner(I.cover ? `covered by ${k} forests` : `${k} trees are not enough`, 'tl', { color: I.cover ? 'green' : 'red', weight: 700 });
        });
        v.legend([['blue', 'forest 1'], ['orange', 'forest 2'], ['purple', 'forest 3'], ['red', 'dense set $U$ / uncovered edge', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, I = info(G, String(k)); if (I.disc) return '';
          const ratio = I.d.ratio, need = Math.ceil(ratio - 1e-9), Ud = popc(I.d.U);
          const dense = I.dense ? `$U$ has $|U| = ${I.dense.length}$ and $\\|G[U]\\| = ${I.H.E.filter(([a, b]) => I.dense.includes(a) && I.dense.includes(b)).length} > k(|U|-1) = ${k * (I.dense.length - 1)}$` : `**${k} trees cover all ${I.H.m} edges** ✓`;
          return `${dense} · arboricity $= ${I.a}$ · brute force: densest $U$ has ${I.d.e} edges on ${Ud} vertices, $\\lceil ${I.d.e}/${Ud - 1}\\rceil = ${need}$ ${need === I.a ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '2.4.3a', kind: 'Definition', name: 'Arboricity',
      statement: String.raw`The **arboricity** of a loopless multigraph $G$ is the least number of trees (allowed to use additional edges, as in the book), equivalently forests in $G$, whose union contains every edge of $G$. By the tree-covering theorem (2.4.3) it equals $\max_U\bigl\lceil\|G[U]\|/(|U|-1)\bigr\rceil$, the maximum taken over all $U\subseteq V(G)$ with $|U|\ge2$.`,
      idea: String.raw`Arboricity measures the densest spot of a graph: a subgraph with $\varepsilon(H)=\|H\|/|H|$ large forces many forests, and conversely, by Nash-Williams, local sparseness everywhere allows few. Planar graphs have arboricity at most 3 (they have fewer than $3|U|-3$ edges on any $U$), complete graphs $K^n$ have arboricity $\lceil n/2\rceil$.`,
      caption: String.raw`Click an edge to cycle its colour (1–4, then none). A colour class containing a cycle is flagged in red. Try to colour every edge with as few colours as possible; the lower bound from the densest vertex set (shaded with **show densest set**) tells you when to stop, and **Optimal** fills in an optimal colouring from the exchange-chain algorithm.`,
      deps: ['graph-1.5.1a'], see: ['graph-2.4.3'], refs: ['Diestel, Graph Theory, 6th ed., §2.4, p. 51; Theorem 2.4.3'], tags: ['arboricity', 'forests'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch2.pdf' },
      viz(v) {
        const PRE = { k6: () => named('complete', 6), oct: () => named('octahedron'), pet: () => named('petersen'), grid: () => { const g = v.graphs('grid', 3, 4); return { nodes: g.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: g.edges.map((e) => [e.from, e.to]), layout: 'fit' }; } };
        const pre = v.select('', [{ value: 'k6', label: '$K^6$' }, { value: 'oct', label: 'octahedron' }, { value: 'pet', label: 'Petersen' }, { value: 'grid', label: '3×4 grid' }], 'oct', { onChange: () => load() });
        const showD = v.toggle('show densest set', true);
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.22, 1.22], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12 });
        let col = new Map();
        const info = cacheBy((G) => { const H = ix(G), A = arboricity(H), d = densest(H); return { H, a: A.a, R: A.R, d }; });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges.map(([a, b]) => ({ from: a, to: b })) }).layout('fit'); col = new Map(); // greedy start: the first of two colours that keeps a forest, else uncoloured
          const uf = [new Map(), new Map()], find = (m, x) => { while (m.has(x) && m.get(x) !== x) x = m.get(x); return x; };
          for (const e of G.edges) for (let c = 0; c < 2; c++) { const a = find(uf[c], K(e.from)), b = find(uf[c], K(e.to)); if (a !== b) { uf[c].set(a, b); col.set(e, c + 1); break; } } }
        load();
        G.onClick = ({ edge }) => { if (edge) col.set(edge, ((col.get(edge) || 0) + 1) % 5); return true; };
        v.button('Optimal', () => { const I = info(G), H = ix(G); col = new Map(); G.edges.forEach((e) => { const x = H.eix.get(e); for (let j = 0; j < I.a; j++) if (I.R.T[j][x]) { col.set(e, j + 1); break; } }); });
        v.button('Clear', () => { col = new Map(); });
        const cyclic = () => { // edges lying on a monochromatic cycle
          const bad = new Set();
          for (let c = 1; c <= 4; c++) {
            const Ec = G.edges.filter((e) => col.get(e) === c); if (!Ec.length) continue;
            const H = ix({ nodes: G.nodes, edges: Ec }), sub2 = H;
            for (let k = 0; k < H.m; k++) { const [a, b] = H.E[k]; const C = comps(sub2, null, (kk) => kk !== k); if (C.comp[a] === C.comp[b]) bad.add(H.E[k][2]); }
          }
          return bad;
        };
        v.render(() => {
          const I = info(G), bad = cyclic();
          if (showD.value) blobs(v, s, G, [bitsOf(I.d.U).map((u) => I.H.ids[u])], 'gold', 44, 0.11);
          G.draw({ edgeColor: (e) => (bad.has(e) ? 'red' : col.get(e) ? TC[col.get(e) - 1] : 'faint'), edgeWidth: (e) => (col.get(e) ? 4 : 1.4), edgeDash: (e) => bad.has(e) || !col.get(e) });
        });
        v.legend([['blue', 'colour 1'], ['orange', 'colour 2'], ['purple', 'colour 3'], ['teal', 'colour 4'], ['red', 'on a monochromatic cycle', { dash: true }], ['gold', 'densest set', { area: true }]]);
        v.readout(() => {
          const I = info(G), bad = cyclic(), un = G.edges.filter((e) => !col.get(e)).length, used = new Set([...G.edges].map((e) => col.get(e)).filter(Boolean)).size;
          const ok = !un && !bad.size, Ud = popc(I.d.U);
          return `${un ? `${un} edge(s) uncoloured` : bad.size ? `${bad.size} edge(s) on monochromatic cycles` : `**${used} forests cover all edges** ✓`} · lower bound: densest set has ${I.d.e} edges on ${Ud} vertices, $\\lceil ${I.d.e}/${Ud - 1}\\rceil = ${Math.ceil(I.d.ratio - 1e-9)}$ · arboricity $= ${I.a}$${ok && used === I.a ? ' — optimal!' : ''}`;
        });
      },
    },
    {
      num: '2.4.4', kind: 'Theorem', name: 'Bowler–Carmesin packing-covering theorem', credit: 'Bowler & Carmesin, 2015',
      statement: String.raw`For every connected multigraph $G=(V,E)$ and every $k\in\mathbb N$ there is a partition $P$ of $V$ such that every $G[U]$, $U\in P$, has $k$ edge-disjoint spanning trees, and the edges of the contracted multigraph $G/P$ can be covered by $k$ spanning trees.`,
      idea: String.raw`Choose a family $\mathcal T=(T_1,\dots,T_k)$ of spanning trees with $E(\mathcal T)=\bigcup E(T_j)$ maximal, and let $D$ be the set of edges that start an exchange chain (2.4.5) — including all edges in no tree. By the lemma and maximality, no edge of $D$ lies in two trees. Let $P$ consist of the vertex sets of the components of $(V,D)$. Inside a class $U$, the edges of $T_j$ in $D$ form a spanning tree of $G[U]$ (a tree path between the ends of a $D$-edge consists of $D$-edges), and these are edge-disjoint. Contracting the classes turns each $T_j$ into a spanning tree of $G/P$, and every cross-edge lies in some tree, since unused edges are in $D$.`,
      caption: String.raw`The partition $P$ is shaded on the left, each class showing its $k$ edge-disjoint spanning trees in colour; the right panel shows $G/P$, the classes contracted to single vertices, with $k$ spanning trees covering all its edges (an edge in several trees is labelled with all of them). Vary $k$: for small $k$ there is one class (a tree packing), for large $k$ all classes are single vertices (a tree covering). Edit: ${MULTI_EDIT}.`,
      deps: ['graph-1.5.2', 'graph-1.10.1a', 'graph-2.4.5'], see: ['graph-2.4.1', 'graph-2.4.3'], refs: ['Diestel §2.4'], tags: ['spanning trees', 'packing', 'covering'],
      viz(v) {
        const kS = v.slider('$k$', 1, 4, 2, { int: true });
        const L = gstage(v, { height: 330, title: '$G$ and the classes of $P$' });
        const R = gstage(v, { height: 330, title: '$G/P$ covered by $k$ spanning trees', minWidth: 240 });
        const base = multiSpec({ a: [0.8, 5.2], b: [2.6, 5.9], c: [1.0, 3.0], d: [2.9, 3.6], e: [5.4, 5.6], f: [7.0, 6.0], g: [5.6, 3.8], h: [8.9, 4.4], i: [7.8, 2.4], j: [3.2, 0.9], k: [5.6, 1.2] }, 'ab ac ad bc bd cd be ef eg fg dg fh hi gi gk jk cj dj ab cd');
        const G = v.graph(L, { ...base, r: 13 });
        const GP = v.graph(R, { nodes: [], edges: [], r: 15, draggable: false, fontSize: 11 });
        const ed = multiEdit(G, { maxNodes: 12 });
        const info = cacheBy((G, k) => {
          k = +k; const H = mulH(G); if (!isConnected(H)) return { H, disc: true };
          const Rr = packCover(H, k), classes = []; H.ids.forEach((id, u) => { (classes[Rr.part[u]] ||= []).push(u); });
          const inClass = classes.map((cl) => { const S = new Set(cl); return Rr.T.map((Tj) => { const sub2 = { nodes: cl.map((u) => ({ id: u })), edges: H.E.filter(([a, b], e) => Tj[e] && Rr.D[e] && S.has(a) && S.has(b)).map(([a, b]) => [a, b]) }; return sub2.edges.length === cl.length - 1 && (cl.length === 1 || comps(ix(sub2)).k === 1); }).every(Boolean); });
          const cross = H.E.map(([a, b], e) => [a, b, e]).filter(([a, b]) => Rr.part[a] !== Rr.part[b]);
          const coverOK = cross.every(([, , e]) => Rr.used[e] > 0) && Rr.T.every((Tj) => { const es = cross.filter(([, , e]) => Tj[e]); return es.length === classes.length - 1 && comps(ix({ nodes: classes.map((_, i) => ({ id: i })), edges: es.map(([a, b]) => [Rr.part[a], Rr.part[b]]) })).k === 1; });
          return { H, R: Rr, classes, inClass, cross, coverOK };
        });
        v.render(() => {
          const k = kS.value, I = info(G, String(k)), H = I.H;
          if (I.disc) { G.draw(); L.corner('connect the multigraph', 'tl', { color: 'red' }); return; }
          const trees = (e) => { const x = H.eix.get(e), out = []; for (let j = 0; j < k; j++) if (I.R.T[j][x]) out.push(j); return out; };
          blobs(v, L, G, I.classes.map((cl) => cl.map((u) => H.ids[u])), CC, 40, 0.17);
          const isCross = (e) => I.R.part[H.at(e.from)] !== I.R.part[H.at(e.to)];
          G.draw({ nodeRing: (id) => (K(id) === K(ed.sel) ? 'gold' : null), edgeColor: (e) => (isCross(e) ? 'faint' : trees(e).length ? TC[trees(e)[0]] : 'muted'), edgeWidth: (e) => (isCross(e) ? 1.4 : trees(e).length ? 3.6 : 1.4), edgeDash: (e) => isCross(e) || !trees(e).length });
          const cent = I.classes.map((cl) => [cl.reduce((a, u) => a + G.node(H.ids[u]).x, 0) / cl.length, cl.reduce((a, u) => a + G.node(H.ids[u]).y, 0) / cl.length]);
          const nodes = I.classes.map((cl, i) => ({ id: 'P' + i, x: cent[i][0], y: cent[i][1], label: cl.length <= 4 ? cl.map((u) => G.lab(H.ids[u])).join('') : `${cl.length}`, fill: CC[i % 5] }));
          const edges = I.cross.map(([a, b, e]) => ({ from: 'P' + I.R.part[a], to: 'P' + I.R.part[b], e }));
          const key = JSON.stringify([nodes.map((x) => [x.id, x.label, x.x.toFixed(2), x.y.toFixed(2)]), edges.map((x) => x.from + x.to + x.e)]);
          if (GP._key !== key) { GP.set({ nodes, edges }); GP._key = key; }
          GP.draw({ nodeColor: (id) => CC[+id.slice(1) % 5], edgeColor: (e) => { const t = I.R.T.map((Tj, j) => (Tj[e.e] ? j : -1)).filter((j) => j >= 0); return t.length ? TC[t[0]] : 'red'; }, edgeWidth: () => 3,
            edgeLabel: (e) => { const t = I.R.T.map((Tj, j) => (Tj[e.e] ? j + 1 : 0)).filter(Boolean); return t.length > 1 ? t.join(',') : null; } });
          if (I.classes.length === 1) R.text('one class: G itself carries k disjoint trees', 5, 3.2, { align: 'center', color: 'muted', size: 12.5 });
        });
        v.legend([['blue', 'tree 1'], ['orange', 'tree 2'], ['purple', 'tree 3'], ['teal', 'tree 4'], ['faint', 'cross-edge (see right) / unused', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, I = info(G, String(k)); if (I.disc) return '';
          return `$|P| = ${I.classes.length}$ classes (sizes ${I.classes.map((c) => c.length).join(', ')}) · each $G[U]$ has ${k} edge-disjoint spanning trees: ${I.inClass.every(Boolean) ? '✓' : '✗'} · $G/P$ has ${I.cross.length} edges, covered by ${k} spanning trees: ${I.coverOK ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '2.4.5', kind: 'Lemma', name: 'Exchange chains enlarge a family of spanning trees',
      statement: String.raw`Let $\mathcal T=(T_1,\dots,T_k)$ be spanning trees of $G$. A sequence $(e_0,\dots,e_n)$ of edges is an **exchange chain** (started by $e_0$) if $e_n$ lies in none of the trees and for every $i<n$ there is $j=j(i)$ such that $e_{i+1}$ is a chord of $T_j$ whose fundamental cycle in $T_j$ contains $e_i$. If $e_0$ starts an exchange chain and lies in two of the trees, then there is a family $\mathcal T'$ of $k$ spanning trees with $E(\mathcal T)\subsetneq E(\mathcal T')$.`,
      idea: String.raw`Take a shortest chain from $e_0$. Exchange $e_0$ for $e_1$ in $T_{j(0)}$, then $e_1$ for $e_2$ in $T_{j(1)}$, and so on: each step is a tree exchange $T+e-f$ along a fundamental cycle (Corollary 1.5.2), and minimality of the chain guarantees that the later fundamental cycles are not disturbed by the earlier exchanges. The union of the trees loses nothing — $e_0$ survives in its second tree, and each $e_i$ re-enters before it leaves — and gains $e_n$.`,
      caption: String.raw`Two (or three) spanning trees start out equal, so every tree edge lies in several trees (gold). Each round finds a shortest exchange chain $e_0,\dots,e_n$ (labels) and performs the exchanges one by one; the union $E(\mathcal T)$ grows by one edge per round, and the readout confirms after every step that all $k$ are still spanning trees. At the end no edge of $D$ lies in two trees, as in the proof of 2.4.4.`,
      deps: ['graph-1.5.2'], see: ['graph-2.4.4'], refs: ['Diestel §2.4'], tags: ['spanning trees', 'exchange'],
      viz(v) {
        const PRE = {
          wheel: () => ({ nodes: [{ id: 'h', x: 5, y: 3.2 }].concat(ringPts(5, 2.7, 5, 3.2).map(([x, y], i) => ({ id: 'abcde'[i], x, y }))), edges: [...'abcde'].flatMap((c, i) => [{ from: 'h', to: c }, { from: c, to: 'abcde'[(i + 1) % 5] }]) }),
          k5: () => ({ nodes: ringPts(5, 2.8, 5, 3.2).map(([x, y], i) => ({ id: 'abcde'[i], x, y })), edges: [...'abcde'].flatMap((c, i) => [...'abcde'].slice(i + 1).map((d) => ({ from: c, to: d }))) }),
          two: () => multiSpec({ a: [1.0, 5.2], b: [3.2, 5.6], c: [1.4, 1.2], d: [3.4, 1.0], e: [6.6, 5.6], f: [8.9, 5.2], g: [6.6, 1.0], h: [8.6, 1.2] }, 'ab ac ad bc bd cd ef eg eh fg fh gh be dg'),
        };
        const pre = v.select('', [{ value: 'wheel', label: 'wheel' }, { value: 'k5', label: '$K^5$' }, { value: 'two', label: 'two $K^4$' }], 'wheel', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes, edges: P.edges }); S.reset({ at: 'end' }); } });
        const kS = v.slider('$k$', 2, 3, 2, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...PRE.wheel(), r: 13 });
        multiEdit(G, { maxNodes: 10, onEdit: () => S.reset({ at: 'end' }) });
        function frames() {
          const H = mulH(G), k = kS.value; if (!isConnected(H)) return [{ H, note: 'Connect the graph.' }];
          const T0 = bfsTreeMask(H), Rr = packCover(H, k, { start: Array.from({ length: k }, () => T0), log: true }), F = [];
          const size = (T) => { let c = 0; for (let e = 0; e < H.m; e++) if (T.some((Tj) => Tj[e])) c++; return c; };
          F.push({ H, T: Rr.rounds.length ? Rr.rounds[0].before : Rr.T, note: `Start: ${k} copies of one spanning tree; $|E(\\mathcal T)| = ${H.n - 1}$.`, line: 1 });
          Rr.rounds.forEach((rd, r) => {
            const lab = new Map(rd.chain.map((e, i) => [e, i])), L = (e) => G.lab(H.ids[H.E[e][0]]) + G.lab(H.ids[H.E[e][1]]);
            F.push({ H, T: rd.before, lab, note: `Round ${r + 1}: $e_0 = ${L(rd.chain[0])}$ lies in two trees; a shortest exchange chain has length ${rd.chain.length - 1}, ending in the unused edge ${L(rd.chain[rd.chain.length - 1])}.`, line: 2 });
            let cur = rd.before.map((x) => Uint8Array.from(x));
            for (let i = 0; i + 1 < rd.chain.length; i++) {
              const j = rd.js[i]; cur = cur.map((x) => Uint8Array.from(x)); cur[j][rd.chain[i + 1]] = 1; cur[j][rd.chain[i]] = 0;
              F.push({ H, T: cur, lab, swap: [rd.chain[i], rd.chain[i + 1]], note: `In $T_${j + 1}$ exchange $e_${i} = ${L(rd.chain[i])}$ for $e_${i + 1} = ${L(rd.chain[i + 1])}$ (on its fundamental cycle).`, line: 3, hold: 0.8 });
            }
            F.push({ H, T: rd.after, note: `$|E(\\mathcal T)| = ${size(rd.after)}$: the union grew by one edge.`, line: 4 });
          });
          F.push({ H, T: Rr.T, D: Rr.D, part: Rr.part, done: true, note: `No edge in two trees starts an exchange chain any more: $E(\\mathcal T)$ is maximal (${size(Rr.T)} edges), and $(V, D)$ has ${Rr.np} component(s).`, line: 5 });
          return F;
        }
        const S = v.steps({ frames, code: ['$T_1 = \\dots = T_k$: one spanning tree', 'find a shortest exchange chain $e_0\\dots e_n$, $e_0$ in two trees', '  for $i < n$: $T_{j(i)} \\leftarrow T_{j(i)} + e_{i+1} - e_i$', '  $E(\\mathcal T)$ has grown by $e_n$', 'until no such chain: $D$, partition $P$'], codeTitle: 'Lemma 2.4.5, repeated', speed: 1.3, start: 'end', still: 2 });
        v.render(() => {
          const f = S.frame; if (!f.T) { G.draw(); return; }
          const H = f.H, cnt = (e) => { const x = H.eix.get(e); return f.T.reduce((c, Tj) => c + (Tj[x] ? 1 : 0), 0); }, first = (e) => { const x = H.eix.get(e); return f.T.findIndex((Tj) => Tj[x]); };
          if (f.done && f.part) { const groups = []; H.ids.forEach((id, u) => { (groups[f.part[u]] ||= []).push(id); }); if (groups.length > 1 && groups.some((g) => g.length > 1)) blobs(v, s, G, groups, CC, 38, 0.15); }
          G.draw({
            edgeColor: (e) => (cnt(e) >= 2 ? 'gold' : cnt(e) === 1 ? TC[first(e)] : 'faint'), edgeWidth: (e) => (f.swap && f.swap.includes(H.eix.get(e)) ? 6 : cnt(e) ? 3.6 : 1.4), edgeDash: (e) => !cnt(e),
            edgeLabel: (e) => { const x = H.eix.get(e); if (f.lab && f.lab.has(x)) return `e${sub(f.lab.get(x))}`; return cnt(e) >= 2 ? f.T.map((Tj, j) => (Tj[x] ? j + 1 : 0)).filter(Boolean).join(',') : null; },
          });
        });
        v.legend([['blue', 'only in $T_1$'], ['orange', 'only in $T_2$'], ['purple', 'only in $T_3$'], ['gold', 'in two or more trees'], ['faint', 'in no tree', { dash: true }]]);
        v.readout(() => {
          const f = S.frame; if (!f.T) return '';
          const H = f.H; let un = 0; for (let e = 0; e < H.m; e++) if (f.T.some((Tj) => Tj[e])) un++;
          return `$|E(\\mathcal T)| = ${un}$ of ${H.m} edges · all ${f.T.length} are spanning trees: ${f.T.every((Tj) => isSpanningTree(H, Tj)) ? '✓' : '✗'} · edges in ≥ 2 trees: ${[...Array(H.m).keys()].filter((e) => f.T.filter((Tj) => Tj[e]).length >= 2).length}`;
        });
      },
    },
    // ================================================================== 2.5 Path covers
    {
      num: '2.5.1a', kind: 'Definition', name: 'Path covers of directed graphs',
      statement: String.raw`A **directed path** is a directed graph $P\ne\emptyset$ with distinct vertices $x_0,\dots,x_k$ and edges $e_0,\dots,e_{k-1}$ such that $e_i$ is directed from $x_i$ to $x_{i+1}$; $x_k$ is its **last vertex**, and for a set $\mathcal P$ of paths, $\mathrm{ter}(\mathcal P)$ is the set of their last vertices. A **path cover** of a directed graph $G$ is a set of disjoint (directed) paths in $G$ which together contain all the vertices of $G$.`,
      idea: String.raw`The trivial paths $\{v\}$ always form a path cover, so the interesting question is how *few* paths suffice. Choosing arcs for the paths amounts to choosing a set of arcs with every vertex having in- and out-degree at most 1 and no directed cycle; each chosen arc saves one path, so the number of paths is $|G|$ minus the number of arcs used. For a bipartite graph oriented from $A$ to $B$, minimum path covers correspond to maximum matchings.`,
      caption: String.raw`Click arcs to add them to the paths (coloured) or remove them; an arc that would give a vertex two successors or two predecessors, or close a cycle, is refused. Uncovered vertices form trivial paths. Last vertices are ringed. **Minimum** shows a path cover with the fewest paths found by a capped exhaustive search; the readout says when the optimum is unproved.`,
      deps: ['graph-1.10.1a', 'graph-1.3.1a'], refs: ['Diestel, Graph Theory, 6th ed., §2.5, pp. 54–55'], tags: ['path covers', 'digraphs'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch2.pdf' },
      viz(v) {
        const s = gstage(v, { height: 320 });
        const G = v.graph(s, { ...DIG(), r: 13 });
        let A = new Set(), msg = '';
        const succ = () => { const m = new Map(); for (const e of A) m.set(K(e.from), K(e.to)); return m; };
        G.onClick = ({ edge }) => {
          msg = ''; if (!edge) return true;
          if (A.has(edge)) { A.delete(edge); return true; }
          const sc = succ(), preds = new Set(sc.values());
          if (sc.has(K(edge.from))) msg = `${G.lab(edge.from)} already has a successor`;
          else if (preds.has(K(edge.to))) msg = `${G.lab(edge.to)} already has a predecessor`;
          else { let x = K(edge.to), cyc = false; for (let g = 0; g < 30 && x != null; g++) { if (x === K(edge.from)) { cyc = true; break; } x = sc.get(x); } if (cyc) msg = 'that would close a directed cycle'; else A.add(edge); }
          return true;
        };
        const opt = cacheBy((G) => pathCovers(dix(G)));
        v.button('Minimum', () => { const D = dix(G), P = opt(G); A = new Set(); P.best.forEach((w, u) => { if (w >= 0) A.add(G.edges.find((e) => K(e.from) === K(D.ids[u]) && K(e.to) === K(D.ids[w]))); }); msg = ''; });
        v.button('Clear', () => { A = new Set(); msg = ''; });
        A = new Set(['ab', 'bc', 'ei', 'fg'].map((p) => G.edges.find((e) => e.from === p[0] && e.to === p[1])));
        v.render(() => {
          const ids = G.nodes.map((n) => K(n.id)), sc = succ(), hasP = new Set(sc.values()), paths = [];
          for (const id of ids) if (!hasP.has(id)) { const P = [id]; let x = id; while (sc.has(x)) { x = sc.get(x); P.push(x); } paths.push(P); }
          const pathOf = new Map(); paths.forEach((P, i) => P.forEach((x) => pathOf.set(x, i)));
          G.draw({ nodeFill: (id) => PALETTE[pathOf.get(K(id)) % 8], nodeRing: (id) => (!sc.has(K(id)) ? 'ink' : null), edgeColor: (e) => (A.has(e) ? PALETTE[pathOf.get(K(e.from)) % 8] : 'faint'), edgeWidth: (e) => (A.has(e) ? 4.2 : 1.4) });
          if (msg) s.corner('refused: ' + msg, 'tl', { color: 'red', weight: 600 });
        });
        v.legend([['ink', 'last vertex (ring)', { dot: true }], ['faint', 'arc not used']]);
        v.readout(() => {
          const n = G.nodes.length, P = opt(G), paths = n - A.size, sc = succ();
          const ter = G.nodes.filter((x) => !sc.has(K(x.id))).map((x) => G.lab(x.id));
          return `${paths} paths ($= |G| - ${A.size}$ arcs used) · $\\mathrm{ter}(\\mathcal P) = \\{${ter.join(', ')}\\}$ · ${P.exact ? 'minimum number of paths' : 'best number found (search capped; optimum unproved)'}: ${P.minPaths}${paths === P.minPaths && P.exact ? ' — **minimum** ✓' : ''}`;
        });
      },
    },
    {
      num: '2.5.1', kind: 'Theorem', name: 'Gallai–Milgram theorem', credit: 'Gallai & Milgram, 1960',
      statement: String.raw`Every directed graph $G$ has a path cover $\mathcal P$ and an independent set $\{v_P\mid P\in\mathcal P\}$ of vertices with $v_P\in P$ for every $P\in\mathcal P$. In particular, $G$ can be covered by at most $\alpha(G)$ disjoint directed paths.`,
      idea: String.raw`Induction on $|G|$, for any path cover $\mathcal P$ whose set $\mathrm{ter}(\mathcal P)$ of last vertices is inclusion-minimal. If the last vertices are independent, take them. Otherwise there is an arc $v_2\to v_1$ between last vertices of $P_2$ and $P_1$. Minimality forbids $P_1$ being trivial (else $P_2v_2v_1$ would merge two paths), so delete $v_1$: the shortened cover of $G-v_1$ is again ter-minimal (a smaller one would lift to a smaller one for $G$), and by induction it has an independent set of representatives, which works for $\mathcal P$ too.`,
      caption: String.raw`Edit the digraph (${EDIT}; arcs point from the first vertex clicked to the second; up to 9 vertices). The app finds a path cover with inclusion-minimal $\mathrm{ter}(\mathcal P)$ by exhaustive search, then steps through the proof: while two last vertices are joined by an arc (red), the head $v_1$ is deleted. At the end the last vertices of the shortened paths (green) are independent — one representative per path.`,
      deps: ['graph-2.5.1a'], refs: ['Diestel §2.5'], tags: ['path covers', 'digraphs', 'independent sets'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const D0 = DIG(); D0.nodes = D0.nodes.filter((n) => n.id !== 'j'); D0.edges = D0.edges.filter((e) => e.from !== 'j' && e.to !== 'j').concat([{ from: 'c', to: 'b' }, { from: 'h', to: 'd' }, { from: 'i', to: 'e' }]);
        const G = v.graph(s, { ...D0, r: 13, editable: true });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 9) G.removeNode(obj.id); S.reset({ at: 'end' }); };
        function frames() {
          const D = dix(G), n = D.n; if (!n) return [{ note: 'empty' }];
          const PC = pathCovers(D), masks = [...PC.ters.keys()], minimal = masks.filter((m) => !masks.some((x) => x !== m && (x & m) === x));
          minimal.sort((a, b) => popc(a) - popc(b));
          const succ = PC.ters.get(minimal[0]).slice(), paths = pathsOf(n, succ), alive = new Set([...Array(n).keys()]), F = [];
          const L = (u) => G.lab(D.ids[u]), cur = paths.map((P) => P.slice());
          const snap = (o) => F.push({ D, paths: cur.map((P) => P.slice()), orig: paths, alive: new Set(alive), ...o });
          snap({ note: `A path cover with inclusion-minimal set of last vertices: ${paths.length} paths, $\\mathrm{ter} = \\{${paths.map((P) => L(P[P.length - 1])).join(', ')}\\}$.`, line: 1 });
          for (let g = 0; g < n; g++) {
            const T = cur.map((P) => P[P.length - 1]), Ts = new Set(T);
            const arc = D.arcs.find(([a, b]) => alive.has(a) && alive.has(b) && Ts.has(a) && Ts.has(b));
            if (!arc) break;
            const [v2, v1] = arc, i1 = cur.findIndex((P) => P[P.length - 1] === v1);
            if (cur[i1].length < 2) { snap({ note: 'Unexpected: a trivial path ends in an arc head (the cover was not ter-minimal).', line: 2 }); break; }
            snap({ arc: [v2, v1], note: `The last vertices ${L(v2)} and ${L(v1)} are joined by the arc ${L(v2)} → ${L(v1)}; ${L(v1)} is not alone on its path.`, line: 2 });
            cur[i1].pop(); alive.delete(v1);
            snap({ note: `Delete ${L(v1)}: its path now ends at ${L(cur[i1][cur[i1].length - 1])}, and the cover of $G - ${L(v1)}$ is still ter-minimal.`, line: 3 });
          }
          const reps = cur.map((P) => P[P.length - 1]);
          snap({ reps, done: true, note: `The last vertices ${reps.map(L).join(', ')} are independent: one representative $v_P$ on each of the ${paths.length} original paths.`, line: 4 });
          return F;
        }
        const S = v.steps({ frames, code: ['take a path cover 𝒫 with ter(𝒫) minimal', 'while some arc v₂ → v₁ joins two last vertices:', '  delete v₁ from G and from its path', 'return the last vertices: independent'], codeTitle: 'Gallai–Milgram (proof)', speed: 1.3, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.D) return; const D = f.D;
          const pathOf = new Map(); f.orig.forEach((P, i) => P.forEach((u) => pathOf.set(K(D.ids[u]), i)));
          const onPath = new Map(); f.orig.forEach((P) => { for (let i = 0; i + 1 < P.length; i++) onPath.set(K(D.ids[P[i]]) + '>' + K(D.ids[P[i + 1]]), pathOf.get(K(D.ids[P[i]]))); });
          const repSet = new Set((f.reps || []).map((u) => K(D.ids[u]))), term = new Set(f.paths.map((P) => K(D.ids[P[P.length - 1]])));
          const gone = (id) => !f.alive.has(D.pos.get(K(id)));
          G.draw({
            nodeFill: (id) => (repSet.has(K(id)) ? 'green' : gone(id) ? 'faint' : PALETTE[pathOf.get(K(id)) % 8]),
            nodeRing: (id) => (f.arc && (D.pos.get(K(id)) === f.arc[0] || D.pos.get(K(id)) === f.arc[1]) ? 'red' : !gone(id) && term.has(K(id)) ? 'ink' : null),
            edgeColor: (e) => { if (f.arc && D.pos.get(K(e.from)) === f.arc[0] && D.pos.get(K(e.to)) === f.arc[1]) return 'red'; const p = onPath.get(K(e.from) + '>' + K(e.to)); return p != null ? PALETTE[p % 8] : 'faint'; },
            edgeWidth: (e) => (f.arc && D.pos.get(K(e.from)) === f.arc[0] && D.pos.get(K(e.to)) === f.arc[1] ? 4 : onPath.has(K(e.from) + '>' + K(e.to)) ? 4 : 1.3),
            edgeDash: (e) => gone(e.from) || gone(e.to),
          });
        });
        v.legend([['blue', 'paths of the cover'], ['ink', 'current last vertices', { dot: true }], ['red', 'arc between last vertices'], ['green', 'independent representatives', { dot: true }]]);
        const alpha = cacheBy((G) => alphaD(dix(G)).best);
        v.readout(() => {
          const last = S.frames[S.n - 1]; if (!last || !last.reps) return '';
          const D = last.D, R = new Set(last.reps), indep = !D.arcs.some(([a, b]) => R.has(a) && R.has(b));
          return `$|\\mathcal P| = ${last.orig.length}$ paths · representatives ${last.reps.map((u) => G.lab(D.ids[u])).join(', ')} — ${indep ? 'independent ✓' : 'not independent ✗'}, one on each path ✓ · $\\alpha(G) = ${alpha(G)} \\ge |\\mathcal P|$ ${alpha(G) >= last.orig.length ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '2.5.2', kind: 'Corollary', name: 'Dilworth’s theorem', credit: 'Dilworth, 1950',
      statement: String.raw`In every finite partially ordered set $(P,\le)$, the minimum number of chains whose union is $P$ equals the maximum cardinality of an antichain in $P$.`,
      idea: String.raw`An antichain meets every chain at most once, so at least as many chains as the size of any antichain are needed. Conversely, apply Gallai–Milgram (2.5.1) to the digraph on $P$ with an arc $x\to y$ whenever $x<y$: a directed path is a chain, and the independent representatives — one per path — are pairwise incomparable, an antichain of the same size as the path cover. (Computationally, a minimum chain cover is $|P|$ minus a maximum matching from "lower copies" to "upper copies", and König's theorem produces the antichain.)`,
      caption: String.raw`Drag the points: $p\le q$ when $q$ lies weakly up and to the right of $p$. A minimum chain cover is drawn as coloured increasing polylines, a maximum antichain (a decreasing set) is ringed in red; both are computed exactly (bipartite matching plus König), and the counts always agree. The right panel shows the same poset as a Hasse diagram.`,
      deps: ['graph-2.5.1', 'comb-8.2'], see: ['comb-8.4', 'algo-16.12'], refs: ['Diestel §2.5'], tags: ['posets', 'chains', 'antichains'],
      viz(v) {
        const nS = v.slider('elements', 4, 14, 11, { int: true });
        let seed = 5;
        v.button('Shuffle', () => { seed++; place(); });
        const s = v.stage({ x: [0, 10], y: [0, 7], axes: 'box', gutter: true, height: 330, title: 'points in the plane, ordered by dominance', ticks: false });
        const R = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 330, title: 'Hasse diagram', minWidth: 240 });
        const Hd = v.graph(R, { nodes: [], edges: [], r: 11, draggable: false, fontSize: 11 });
        const LET = 'abcdefghijklmn', hs = [...Array(14)].map((_, i) => s.handle(1, 1, { color: 'ink', r: 5, label: LET[i] }));
        function place() { const r = v.rng(seed * 17); hs.forEach((h) => h.set(0.6 + 8.8 * r(), 0.5 + 6 * r())); }
        place();
        const calc = () => {
          const n = nS.value, P = hs.slice(0, n).map((h) => [h.x, h.y]), lt = (i, j) => i !== j && P[i][0] <= P[j][0] && P[i][1] <= P[j][1];
          const H = { n: 2 * n, adj: Array.from({ length: 2 * n }, () => []), E: [] };
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (lt(i, j)) { const k = H.E.length; H.E.push([i, n + j, null]); H.adj[i].push([n + j, k]); H.adj[n + j].push([i, k]); }
          const side = [...Array(2 * n)].map((_, u) => (u < n ? 0 : 1)), mate = bipMatch(H, side).mate, kc = konigCover(H, side, mate), U = new Set(kc.U);
          const anti = [...Array(n).keys()].filter((x) => !U.has(x) && !U.has(n + x));
          const hasPred = new Set(); for (let i = 0; i < n; i++) if (mate[i] >= 0) hasPred.add(mate[i] - n);
          const chains = []; for (let i = 0; i < n; i++) if (!hasPred.has(i)) { const C = [i]; for (let x = i; mate[x] >= 0; x = mate[x] - n) C.push(mate[x] - n); chains.push(C); }
          let best = 0; if (n <= 14) for (let m = 1; m < 1 << n; m++) { const c = popc(m); if (c <= best) continue; let ok = true; const B = bitsOf(m); for (let a = 0; a < B.length && ok; a++) for (let b = 0; b < B.length; b++) if (a !== b && lt(B[a], B[b])) { ok = false; break; } if (ok) best = c; }
          return { n, P, lt, chains, anti, best };
        };
        v.render(() => {
          const C = calc(), chainOf = new Map(); C.chains.forEach((ch, i) => ch.forEach((x) => chainOf.set(x, i)));
          hs.forEach((h, i) => { h.visible = i < C.n; });
          C.chains.forEach((ch, i) => { if (ch.length > 1) s.path(ch.map((x) => C.P[x]), { color: PALETTE[i % 8], width: 3.5 }); });
          C.anti.forEach((x) => s.circle(C.P[x][0], C.P[x][1], 0.32, { color: 'red', width: 2.5 }));
          C.P.forEach(([x, y], i) => s.dot(x, y, { r: 10, color: PALETTE[chainOf.get(i) % 8] }));
          // Hasse diagram: rank = longest chain below
          const rank = new Array(C.n).fill(0), ord = [...Array(C.n).keys()].sort((a, b) => C.P[a][0] + C.P[a][1] - C.P[b][0] - C.P[b][1]);
          for (const j of ord) for (const i of ord) if (C.lt(i, j)) rank[j] = Math.max(rank[j], rank[i] + 1);
          const maxR = Math.max(...rank), byR = []; ord.forEach((i) => (byR[rank[i]] ||= []).push(i));
          byR.forEach((L) => L.sort((a, b) => C.P[a][0] - C.P[b][0]));
          const pos = new Map(); byR.forEach((L, r) => L.forEach((i, t) => pos.set(i, [10 * (t + 1) / (L.length + 1), maxR ? 0.6 + (5.8 * r) / maxR : 3.5])));
          const cover = []; for (let i = 0; i < C.n; i++) for (let j = 0; j < C.n; j++) if (C.lt(i, j) && ![...Array(C.n).keys()].some((z) => C.lt(i, z) && C.lt(z, j))) cover.push([i, j]);
          const key = JSON.stringify([C.n, cover]);
          if (Hd._key !== key) { Hd.set({ nodes: [...Array(C.n).keys()].map((i) => ({ id: i, label: LET[i], x: pos.get(i)[0], y: pos.get(i)[1] })), edges: cover.map(([i, j]) => ({ from: i, to: j })) }); Hd._key = key; }
          else Hd.nodes.forEach((nd) => { [nd.x, nd.y] = pos.get(nd.id); });
          const inCh = (e) => chainOf.get(e.from) === chainOf.get(e.to) && C.chains[chainOf.get(e.from)].some((x, t, ch) => ch[t + 1] === e.to && x === e.from);
          Hd.draw({ nodeFill: (id) => PALETTE[chainOf.get(id) % 8], nodeRing: (id) => (C.anti.includes(id) ? 'red' : null), edgeColor: (e) => (inCh(e) ? PALETTE[chainOf.get(e.from) % 8] : 'faint'), edgeWidth: (e) => (inCh(e) ? 3.4 : 1.3) });
        });
        v.legend([['blue', 'chains of a minimum chain cover'], ['red', 'maximum antichain', { dot: true }]]);
        v.readout(() => { const C = calc(); return `${C.n} elements · minimum chain cover: **${C.chains.length}** chains (sizes ${C.chains.map((c) => c.length).join(', ')}) · maximum antichain: **${C.anti.length}** (brute force: ${C.best}) ${C.chains.length === C.anti.length && C.anti.length === C.best ? '— equal ✓' : '✗'}`; });
      },
    },
  ],
};
