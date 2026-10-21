// Graph Theory (Diestel) — Chapter 2: Matching, Covering and Packing (§§2.1–2.2; §§2.3–2.5 in ch02-b.js)
import {
  K, ix, comps, ekey, blobs, PALETTE, named, fixed, gstage, EDIT, eset, cacheBy, mateOf, matchEdges, matchSize, altReach, backPath,
  bipMatch, konigCover, edmondsSearch, maxMatching, maxMatchingOn, augment, popc, bitsOf, adjMasks, compMasks, tutteDeficiency,
  minVertexCover, bruteMatching, randomCubic, degrees,
} from './ch02.shared.js';

// ---------- local helpers ----------
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (s) => String(s).replace(/\d/g, (d) => SUB[d]);
const MID = 5;
const sideOf = (n) => (n.x < MID ? 0 : 1);
/** Bipartite graph with A = a1… on the left (x = 2.2) and B = b1… on the right (x = 7.8); spec '1:12 2:23' = a1b1 a1b2 a2b2 a2b3. */
function bipSpec(nA, nB, spec, top = 5.8, bot = 0.6) {
  const y = (i, n) => (n === 1 ? (top + bot) / 2 : top - (i * (top - bot)) / (n - 1));
  const nodes = [...Array(nA)].map((_, i) => ({ id: 'a' + (i + 1), label: sub('a' + (i + 1)), x: 2.2, y: y(i, nA), labelPos: 'in' }))
    .concat([...Array(nB)].map((_, i) => ({ id: 'b' + (i + 1), label: sub('b' + (i + 1)), x: 7.8, y: y(i, nB) })));
  const edges = [];
  for (const tok of spec.trim().split(/\s+/)) { const [a, bs] = tok.split(':'); for (const b of bs) edges.push(['a' + a, 'b' + b]); }
  return { nodes, edges, layout: 'none' };
}
/** Keep the graph bipartite with respect to the sides x < 5 / x > 5: drop edges inside a side; returns true if something was dropped. */
function keepBip(G) {
  const before = G.edges.length;
  G.edges = G.edges.filter((e) => { const a = G.node(e.from), b = G.node(e.to); return a && b && sideOf(a) !== sideOf(b); });
  return G.edges.length < before;
}
const bipH = (G) => { const H = ix(G); return { H, side: H.nodes.map(sideOf) }; };
function sides(s) {
  s.vline(MID, { color: 'faint', dash: [5, 5], width: 1 });
  s.corner('A', 'tl', { color: 'muted', weight: 700 }); s.corner('B', 'tr', { color: 'muted', weight: 700 });
}
const nm = (G, id) => G.lab(id);
const edgeName = (G, e) => nm(G, e.from) + nm(G, e.to);
/** Kit edge objects of a matching mate array. */
const mEdges = (H, mate) => eset(H, matchEdges(H, mate));
/** Edge object between two vertex indices (first match). */
function edgeObj(H, a, b) { for (const [w, k] of H.adj[a]) if (w === b) return H.E[k][2]; return null; }
const pathObjs = (H, vs) => { const out = new Set(); for (let i = 0; i + 1 < vs.length; i++) { const e = edgeObj(H, vs[i], vs[i + 1]); if (e) out.add(e); } return out; };
/** Spanning 2-regular subgraph by backtracking (edge index set) or null. */
function twoFactor(H) {
  const deg = new Array(H.n).fill(0), pick = new Uint8Array(H.m), last = new Array(H.n).fill(-1);
  H.E.forEach(([a, b], k) => { last[a] = k; last[b] = k; });
  if (last.some((l) => l < 0)) return null;
  let steps = 0;
  const ok = (k) => { const [a, b] = H.E[k]; return !(last[a] <= k && deg[a] !== 2) && !(last[b] <= k && deg[b] !== 2); };
  const go = (k) => {
    if (++steps > 3e5) return false;
    if (k === H.m) return deg.every((d) => d === 2);
    const [a, b] = H.E[k];
    if (deg[a] < 2 && deg[b] < 2) { deg[a]++; deg[b]++; pick[k] = 1; if (ok(k) && go(k + 1)) return true; deg[a]--; deg[b]--; pick[k] = 0; }
    return ok(k) && go(k + 1);
  };
  return go(0) ? [...pick.keys()].filter((k) => pick[k]) : null;
}
/** Cycle lengths of a 2-regular edge set. */
function cycleLengths(H, ks) {
  const sub2 = { n: H.n, adj: H.adj.map((l) => l.filter(([, k]) => ks.has(k))) };
  return comps(sub2).lists.filter((L) => L.length > 1).map((L) => L.length).sort((a, b) => a - b);
}
/** Euler tour (closed, vertex list) of a connected graph with even degrees (Hierholzer). */
function eulerTour(H) {
  const used = new Uint8Array(H.m), it = new Array(H.n).fill(0), st = [0], tour = [];
  while (st.length) {
    const u = st[st.length - 1];
    while (it[u] < H.adj[u].length && used[H.adj[u][it[u]][1]]) it[u]++;
    if (it[u] === H.adj[u].length) { tour.push(st.pop()); continue; }
    const [w, k] = H.adj[u][it[u]]; used[k] = 1; st.push(w);
  }
  return tour.reverse();
}
/** Preference lists: pref[id] = neighbour ids, most preferred first. */
function randPrefs(G, seedRng) {
  const pref = {};
  for (const n of G.nodes) {
    const nb = G.edges.filter((e) => K(e.from) === K(n.id) || K(e.to) === K(n.id)).map((e) => (K(e.from) === K(n.id) ? e.to : e.from));
    for (let i = nb.length - 1; i > 0; i--) { const j = Math.floor(seedRng() * (i + 1)); [nb[i], nb[j]] = [nb[j], nb[i]]; }
    pref[K(n.id)] = nb;
  }
  return pref;
}
/** Random bipartite graph on a1..an, b1..bn with every vertex of degree ≥ 2 (for the stable-matching items). */
function prefGraph(n, r, missing) {
  for (let t = 0; t < 200; t++) {
    const spec = [...Array(n)].map((_, i) => `${i + 1}:${[...Array(n)].map((_, j) => j + 1).join('')}`).join(' ');
    const G = bipSpec(n, n, spec, 5.9, 0.5);
    const drop = new Set(); while (drop.size < missing) drop.add(Math.floor(r() * G.edges.length));
    G.edges = G.edges.filter((_, i) => !drop.has(i));
    const deg = {}; G.edges.forEach(([a, b]) => { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; });
    if (G.nodes.every((x) => (deg[x.id] || 0) >= 2)) return G;
  }
  return bipSpec(n, n, [...Array(n)].map((_, i) => `${i + 1}:${[...Array(n)].map((_, j) => j + 1).join('')}`).join(' '), 5.9, 0.5);
}
/** Blocking edges of the matching (Map id → partner id) under preferences pref. */
function blocking(G, pref, partner) {
  const rank = (x, y) => pref[K(x)].findIndex((z) => K(z) === K(y));
  const happierWith = (x, y) => { const p = partner.get(K(x)); return p == null || rank(x, y) < rank(x, p); };
  return G.edges.filter((e) => partner.get(K(e.from)) !== K(e.to) && happierWith(e.from, e.to) && happierWith(e.to, e.from));
}
/** Draw preference lists beside the vertices: A-lists to the left, B-lists to the right. */
function drawPrefs(s, G, pref, partner, bad, dx = 0.62) {
  for (const n of G.nodes) {
    const L = pref[K(n.id)], left = sideOf(n) === 0;
    L.forEach((w, i) => {
      const x = left ? n.x - 0.62 - (L.length - i) * dx + dx / 2 : n.x + 0.62 + i * dx + dx / 2;
      const isP = partner.get(K(n.id)) === K(w), isBad = bad.has(ekey(K(n.id), K(w)));
      s.text(sub(G.lab(w)), x, n.y, { size: 12.5, align: 'center', baseline: 'middle', color: isP ? 'green' : isBad ? 'red' : 'muted', weight: isP || isBad ? 700 : 400 });
      if (i < L.length - 1) s.text('›', x + (left ? dx / 2 : dx / 2), n.y, { size: 11, align: 'center', baseline: 'middle', color: 'faint' });
    });
  }
}
const pkey = (e) => ekey(K(e.from), K(e.to));
/** All matchings of a small graph (arrays of edge objects). */
function allMatchings(G, cap = 5000) {
  const E = G.edges, out = [];
  const go = (i, used, cur) => { if (out.length >= cap) return; if (i === E.length) { out.push(cur.slice()); return; } go(i + 1, used, cur); const e = E[i]; if (!used.has(K(e.from)) && !used.has(K(e.to))) { used.add(K(e.from)); used.add(K(e.to)); cur.push(e); go(i + 1, used, cur); cur.pop(); used.delete(K(e.from)); used.delete(K(e.to)); } };
  go(0, new Set(), []);
  return out;
}
const partnerOf = (M) => { const p = new Map(); for (const e of M) { p.set(K(e.from), K(e.to)); p.set(K(e.to), K(e.from)); } return p; };
/** Bridges of a graph (edge indices). */
function bridges(H) { const out = new Set(), base = comps(H).k; for (let k = 0; k < H.m; k++) if (comps(H, null, (kk) => kk !== k).k > base) out.add(k); return out; }
/** Components of G − S (S = Set of vertex indices) with parity. */
function compsMinus(H, S) { const C = comps(H, (v) => !S.has(v)); return C.lists.map((L) => ({ L, odd: L.length % 2 === 1 })); }
/** Graphs for the general-matching items. */
const TUTTE_BAD = () => fixed({ s: [5.0, 3.3], a: [2.0, 5.4], b: [3.4, 5.9], c: [2.6, 4.4], d: [7.8, 5.3], e: [8.6, 4.0], f: [7.0, 4.3], g: [3.2, 1.0], h: [4.6, 0.5], i: [6.6, 1.0], j: [7.6, 1.8], k: [5.6, 1.6] },
  'sa sb sc ab bc ac sd se de df ef sg gh sk hk hi ik ij jk');
function sylvester() { // cubic, with three bridges at the centre and no 1-factor
  const nodes = [{ id: 0, x: 0, y: 0 }], edges = [];
  for (let t = 0; t < 3; t++) {
    const a = Math.PI / 2 + (2 * Math.PI * t) / 3, c = Math.cos(a), sn = Math.sin(a), rot = (x, y) => [c * x - sn * y, sn * x + c * y];
    const P = [[0.75, 0], [1.35, 0.42], [1.35, -0.42], [1.95, 0.3], [1.95, -0.3]], base = 1 + 5 * t;
    P.forEach(([x, y], i) => { const [X, Y] = rot(x, y); nodes.push({ id: base + i, x: X, y: Y }); });
    const [x, p, q, r, s2] = [0, 1, 2, 3, 4].map((i) => base + i);
    edges.push([0, x], [x, p], [x, q], [p, r], [p, s2], [q, r], [q, s2], [r, s2]);
  }
  return { nodes, edges, layout: 'fit' };
}

/** G_S of Theorem 2.2.3: S (Set of vertex indices) against the components of G − S, with a maximum matching of S. */
function gsInfo(H, Sset) {
  const C = comps(H, (u) => !Sset.has(u)), cl = C.lists, Sa = [...Sset].sort((a, b) => a - b), nS = Sa.length, n = nS + cl.length;
  const adj = Array.from({ length: n }, () => []), E = [], seen = new Set();
  Sa.forEach((sv, i) => { for (const [w] of H.adj[sv]) { const c = C.comp[w]; if (c < 0 || seen.has(i + ',' + c)) continue; seen.add(i + ',' + c); const k = E.length; E.push([i, nS + c, null]); adj[i].push([nS + c, k]); adj[nS + c].push([i, k]); } });
  const GH = { n, adj, E }, side = [...Array(n)].map((_, u) => (u < nS ? 0 : 1)), R = bipMatch(GH, side);
  const free = [...Array(nS).keys()].find((i) => R.mate[i] < 0);
  let viol = null;
  if (free != null) { const r = altReach(GH, side, R.mate, [free]); viol = { S: [...Array(nS).keys()].filter((i) => r.reachA[i]).map((i) => Sa[i]), C: [...Array(cl.length).keys()].filter((c) => r.reachB[nS + c]) }; }
  return { cl, comp: C.comp, Sa, E, mate: R.mate, nS, viol, matchable: free == null };
}
/** Is the vertex set L (indices) factor-critical in H? {ok, bad: a vertex v with no 1-factor of L − v}. */
function fcCheck(H, L) {
  const inL = new Set(L);
  for (const v of L) { const mate = maxMatchingOn(H, (u) => inL.has(u) && u !== v); if (L.some((u) => u !== v && mate[u] < 0)) return { ok: false, bad: v }; }
  return { ok: L.length % 2 === 1, bad: -1 };
}
/** Draw G_S on the stage of the kit graph GS (S on the left, components on the right). */
function drawGS(GS, H, G, I, o = {}) {
  const nS = I.nS, nC = I.cl.length, y = (i, n) => (n === 1 ? 3.2 : 5.9 - (i * 5.4) / (n - 1));
  const lab = (L) => { const t = L.map((u) => G.lab(H.ids[u])).join(''); return t.length <= 5 ? t : `|C|=${L.length}`; };
  const nodes = I.Sa.map((u, i) => ({ id: 's' + i, label: G.lab(H.ids[u]), x: 2.2, y: y(i, nS) })).concat(I.cl.map((L, j) => ({ id: 'c' + j, label: lab(L), shape: 'box', x: 7.6, y: y(j, nC) })));
  const edges = I.E.map(([a, b]) => ({ from: 's' + a, to: 'c' + (b - nS) }));
  const key = JSON.stringify([nodes.map((x) => [x.id, x.label]), edges.map((e) => e.from + e.to)]);
  if (GS._key !== key) { GS.set({ nodes, edges }); GS._key = key; }
  const matched = (e) => { const a = +e.from.slice(1), b = +e.to.slice(1) + nS; return I.mate[a] === b; };
  GS.draw({
    nodeFill: (id) => (id[0] === 's' ? 'gold' : o.compColor ? o.compColor(+id.slice(1)) : I.cl[+id.slice(1)].length % 2 ? 'red' : 'blue'),
    nodeRing: (id) => (I.viol && ((id[0] === 's' && I.viol.S.includes(I.Sa[+id.slice(1)])) || (id[0] === 'c' && I.viol.C.includes(+id.slice(1)))) ? 'orange' : null),
    edgeColor: (e) => (matched(e) ? 'green' : null), edgeWidth: (e) => (matched(e) ? 4.5 : 1.5),
  });
}
const CC = ['orange', 'purple', 'teal', 'pink', 'blue'];
const idxSet = (H, ids) => new Set([...ids].map((id) => H.at(id)).filter((u) => u != null));

export default {
  collection: 'graph',
  chapter: 2,
  title: 'Matching, Covering and Packing',
  summary: String.raw`How many independent edges does a graph have, and how can we be sure there are no more? In bipartite graphs the answer is König's min–max theorem and Hall's marriage condition, both proved with augmenting paths; stable matchings exist for any preferences (Gale–Shapley), and every regular graph of even degree has a 2-factor. In general graphs Tutte's odd-component condition decides whether a perfect matching exists, and the Gallai–Edmonds theorem describes the structure behind every maximum matching. The chapter then trades packing against covering: the Erdős–Pósa theorem bounds the number of vertices needed to meet all cycles by a function of the maximum number of disjoint cycles, the packing-covering theorem of Bowler and Carmesin yields Nash-Williams' and Tutte's theorems on packing and covering by spanning trees in one stroke, and the Gallai–Milgram theorem on path covers of digraphs implies Dilworth's theorem.`,
  items: [
    // ================================================================== 2.1 Matching in bipartite graphs
    {
      num: '2.1.1a', kind: 'Definition', name: 'Matchings and k-factors', verify: true,
      statement: String.raw`A **matching** in a graph $G=(V,E)$ is a set $M\subseteq E$ of independent edges (no two share an end). $M$ is a matching **of** $U\subseteq V$ if every vertex of $U$ lies on an edge of $M$; these vertices are **matched**, the others **unmatched**. A $k$-regular spanning subgraph of $G$ is a **$k$-factor**. So a subgraph $H\subseteq G$ is a **1-factor** exactly when $E(H)$ is a matching of all of $V$ (a *perfect matching*), and a 2-factor is a spanning union of disjoint cycles.`,
      idea: String.raw`A matching pairs off some vertices along edges; it can match at most $\lfloor |G|/2\rfloor$ vertex pairs, so a 1-factor needs $|G|$ even. A 1-factor is a matching that cannot be enlarged for the trivial reason that nothing is left unmatched, while a merely *maximal* matching may be far from maximum — which is why the chapter needs augmenting paths. A 2-factor is the next case: every vertex gets exactly two edges, so the factor falls apart into disjoint cycles covering $V$.`,
      caption: String.raw`Click edges to build a matching: an edge sharing an end with one already chosen is refused (it flashes red). Matched vertices fill in; the readout compares $|M|$ with the maximum. Switch to **2-factor** and pick edges so that every vertex gets degree exactly 2. The bow-tie has neither a 1-factor (odd order) nor a 2-factor (its centre has degree 4). Edit the graph: ${EDIT} (clicks on edges select them).`,
      deps: ['graph-1.1.1c', 'graph-1.2.1a'], refs: ['Diestel §2.1'], tags: ['matching', 'factors'],
      viz(v) {
        const PRE = { cube: () => named('cube'), pet: () => named('petersen'), bow: () => ({ nodes: [{ id: 0, x: 0, y: 0 }, { id: 1, x: -1.2, y: 0.7 }, { id: 2, x: -1.2, y: -0.7 }, { id: 3, x: 1.2, y: 0.7 }, { id: 4, x: 1.2, y: -0.7 }], edges: [[0, 1], [0, 2], [1, 2], [0, 3], [0, 4], [3, 4]], layout: 'fit' }) };
        const pre = v.select('', [{ value: 'cube', label: 'cube' }, { value: 'pet', label: 'Petersen' }, { value: 'bow', label: 'bow-tie' }], 'cube', { onChange: () => load() });
        const mode = v.select('build', [{ value: 'm', label: 'a matching' }, { value: 'f', label: 'a 2-factor' }], 'm', { onChange: () => preset() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.22, 1.22], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true } });
        const F = new Set(); let flash = null;
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges }).layout('fit'); preset(); }
        function preset() { // a starting selection: a maximal (greedy) matching, or most of a 2-factor
          F.clear(); flash = null; const H = ix(G);
          if (mode.value === 'm') { const used = new Set(); for (const e of [...G.edges].reverse()) if (!used.has(K(e.from)) && !used.has(K(e.to))) { F.add(e); used.add(K(e.from)); used.add(K(e.to)); if (F.size >= 2) break; } }
          else { const ks = twoFactor(H); if (ks) ks.slice(0, Math.max(0, ks.length - 3)).forEach((k) => F.add(H.E[k][2])); else G.edges.forEach((e) => F.add(e)); }
        }
        load();
        G.onClick = ({ edge, alt }) => {
          if (!edge || alt) return false;
          flash = null;
          if (F.has(edge)) F.delete(edge);
          else if (mode.value === 'm') { const c = [...F].find((f) => [f.from, f.to].some((x) => K(x) === K(edge.from) || K(x) === K(edge.to))); if (c) flash = { e: edge, c }; else F.add(edge); }
          else F.add(edge);
          return true;
        };
        v.button('Maximum / find', () => {
          const H = ix(G); F.clear(); flash = null;
          if (mode.value === 'm') for (const e of mEdges(H, maxMatching(H))) F.add(e);
          else { const ks = twoFactor(H); if (ks) for (const k of ks) F.add(H.E[k][2]); else flash = { none: true }; }
        });
        v.button('Clear', () => { F.clear(); flash = null; });
        const info = cacheBy((G) => { const H = ix(G); return { nu: matchSize(maxMatching(H)), tf: !!twoFactor(H) }; });
        v.render(() => {
          for (const e of [...F]) if (!G.edges.includes(e)) F.delete(e);
          const deg = new Map(G.nodes.map((n) => [K(n.id), 0])); for (const e of F) { deg.set(K(e.from), deg.get(K(e.from)) + 1); deg.set(K(e.to), deg.get(K(e.to)) + 1); }
          if (mode.value === 'm') {
            G.draw({ nodeFill: (id) => (deg.get(K(id)) ? 'accent' : null), edgeColor: (e) => (F.has(e) ? 'accent' : flash && flash.e === e ? 'red' : flash && flash.c === e ? 'orange' : null),
              edgeWidth: (e) => (F.has(e) ? 5 : flash && flash.e === e ? 3.5 : null), edgeDash: (e) => !!(flash && flash.e === e) });
            if (flash && flash.e) s.corner('refused: shares a vertex with an edge of M', 'tl', { color: 'red', weight: 600 });
          } else {
            G.draw({ nodeFill: (id) => ({ 2: 'green' })[deg.get(K(id))] ?? (deg.get(K(id)) > 2 ? 'red' : null), edgeColor: (e) => (F.has(e) ? 'green' : null), edgeWidth: (e) => (F.has(e) ? 4.5 : null) });
            if (flash && flash.none) s.corner('this graph has no 2-factor', 'tl', { color: 'red', weight: 600 });
          }
        });
        v.legend([['accent', 'matching edge / matched vertex'], ['green', '2-factor edge (degree 2)'], ['red', 'refused or degree > 2', { dash: true }]]);
        v.readout(() => {
          const n = G.nodes.length, I = info(G);
          if (mode.value === 'm') { const matched = 2 * F.size; return `$|M| = ${F.size}$ · ${matched} of ${n} vertices matched · maximum matching: $${I.nu}$ edges · ${matched === n && n ? '**a 1-factor (perfect matching)** ✓' : n % 2 ? `no 1-factor: $|G| = ${n}$ is odd` : I.nu * 2 === n ? 'a 1-factor exists — keep going' : 'this graph has no 1-factor'}`; }
          const deg = new Map(G.nodes.map((nd) => [K(nd.id), 0])); for (const e of F) { deg.set(K(e.from), deg.get(K(e.from)) + 1); deg.set(K(e.to), deg.get(K(e.to)) + 1); }
          const good = [...deg.values()].filter((d) => d === 2).length;
          if (good === n && n) { const H = ix(G), ks = new Set([...F].map((e) => H.eix.get(e))); return `every vertex has degree 2: **a 2-factor** ✓ — disjoint cycles of lengths ${cycleLengths(H, ks).join(', ')}`; }
          return `${good} of ${n} vertices have degree 2 in the chosen subgraph · ${I.tf ? 'a 2-factor exists' : 'this graph has **no** 2-factor'}`;
        });
      },
    },
    {
      num: '2.1.1b', kind: 'Definition', name: 'Alternating and augmenting paths', verify: true,
      statement: String.raw`Let $G$ be bipartite with bipartition $\{A,B\}$ and $M$ a matching in $G$. A path that starts at an unmatched vertex of $A$ and then uses edges from $E\setminus M$ and from $M$ alternately is an **alternating path** with respect to $M$ (the trivial path is allowed). An alternating path that ends at an unmatched vertex of $B$ is an **augmenting path**: the symmetric difference $M\,\triangle\,E(P)$ is again a matching, with one edge more than $M$, matching both ends of $P$ in addition.`,
      idea: String.raw`Along an augmenting path the non-matching edges outnumber the matching edges by one, and at every inner vertex one $M$-edge is swapped for one non-$M$-edge, so $M\triangle E(P)$ is a matching with $|M|+1$ edges. Conversely, a matching that is not maximum always admits an augmenting path (Berge; Exercise 1), so repeated augmentation finds maximum matchings. In a general graph the same definitions make sense, but a breadth-first search for alternating paths can be misled by an odd cycle (a *blossom*) — Edmonds' algorithm shrinks such cycles and keeps searching.`,
      caption: String.raw`Bold blue edges form $M$. Step through the search from the free root: outer vertices are blue, inner ones orange, and the alternating tree is green. When a free vertex is reached, the augmenting path lights up and **Augment** flips it. Click an edge to put it in or out of $M$, click a free vertex to make it the root; shift-drag between vertices adds an edge, Alt-click deletes. On the blossom graph, switch **shrink blossoms** off: the bipartite-style search ignores the odd cycle and misses the augmenting path $r\,s\,a\,b\,c\,d\,e\,f$.`,
      deps: ['graph-2.1.1a', 'graph-1.3.1a'], refs: ['Diestel §2.1'], tags: ['matching', 'augmenting paths', 'blossoms'],
      viz(v) {
        const PRE = {
          bip: { ...fixed({ a: [2.2, 5.6], b: [2.2, 4.0], c: [2.2, 2.4], d: [2.2, 0.8], w: [7.8, 5.6], x: [7.8, 4.0], y: [7.8, 2.4], z: [7.8, 0.8] }, 'bw aw ax cx cy dy dz'), M: ['aw', 'cx'], root: 'b' },
          blossom: { ...fixed({ r: [0.8, 3.2], s: [2.5, 3.2], a: [4.3, 3.2], b: [5.5, 5.4], c: [7.9, 5.0], d: [8.2, 2.0], e: [5.9, 1.0], f: [3.3, 0.6] }, 'rs sa ab bc cd de ea ef'), M: ['sa', 'bc', 'de'], root: 'r' },
        };
        const pre = v.select('', [{ value: 'bip', label: 'bipartite' }, { value: 'blossom', label: 'with a blossom' }], 'blossom', { onChange: () => load() });
        const shrink = v.toggle('shrink blossoms', true, { onChange: () => S.reset({ at: 'end' }) });
        const s = gstage(v, { height: 320 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true } });
        let M = new Set(), root = null, S = null;
        function load() { const P = PRE[pre.value]; G.set({ nodes: P.nodes.map((n) => ({ ...n })), edges: P.edges }); M = new Set(P.M.map((p) => G.edge(p[0], p[1]))); root = P.root; if (S) S.reset({ at: 'end' }); }
        load();
        const code = ['outer ← {r}; queue ← [r]', 'for each outer v and edge vw ∉ M:', '  if w is unmatched: augmenting path found', '  if w is unreached: w inner, its partner outer', '  if w is outer: odd cycle — shrink the blossom', 'no augmenting path from r'];
        function frames() {
          for (const e of [...M]) if (!G.edges.includes(e)) M.delete(e);
          const H = ix(G), ks = [...M].map((e) => H.eix.get(e)).filter((k) => k != null), mate = mateOf(H, ks);
          let r = root != null ? H.at(root) : null;
          if (r == null || mate[r] >= 0) { r = [...Array(H.n).keys()].find((u) => mate[u] < 0 && H.adj[u].length) ?? -1; root = r >= 0 ? H.ids[r] : null; }
          if (r < 0) return [{ note: 'Every vertex with an edge is matched: nothing to augment.', line: 6, H }];
          const res = edmondsSearch(H, mate, r, { events: true, naive: !shrink.value }), L = (u) => G.lab(H.ids[u]);
          const out = res.events.map((e) => {
            const outer = new Set(), inner = new Set(), tree = new Set();
            for (let u = 0; u < H.n; u++) { if (e.used[u]) outer.add(K(H.ids[u])); else if (e.p[u] >= 0) inner.add(K(H.ids[u])); if (e.p[u] >= 0) { const o = edgeObj(H, u, e.p[u]); if (o) tree.add(o); } }
            const groups = new Map(); for (let u = 0; u < H.n; u++) if (e.used[u] || e.p[u] >= 0 || u === r) { const b = e.base[u]; if (!groups.has(b)) groups.set(b, []); groups.get(b).push(H.ids[u]); }
            const blos = [...groups.values()].filter((g) => g.length > 1);
            const cur = e.v != null && e.to != null ? edgeObj(H, e.v, e.to) : null;
            const f = { H, outer, inner, tree, blos, cur, type: e.type };
            if (e.type === 'root') return { ...f, line: 1, note: `Start at the unmatched vertex ${L(r)}: it is outer.` };
            if (e.type === 'grow') return { ...f, line: 4, note: `${L(e.v)}${L(e.to)} ∉ M and ${L(e.to)} is matched: ${L(e.to)} becomes inner, its partner ${L(e.m)} outer.` };
            if (e.type === 'blossom') return { ...f, line: 5, note: `${L(e.v)}${L(e.to)} joins two outer vertices: an odd cycle (blossom) with base ${L(e.b)}. Shrink it — all ${e.members.length} of its vertices become outer.` };
            if (e.type === 'odd') return { ...f, line: 5, bad: true, note: `${L(e.v)}${L(e.to)} joins two outer vertices — an odd cycle. A bipartite search **ignores** it.` };
            if (e.type === 'found') { const pathE = pathObjs(H, e.path); return { ...f, line: 3, path: pathE, pathLen: e.path.length - 1, newPath: e.path, note: `${L(e.to)} is unmatched: augmenting path ${e.path.map(L).join(' ')} of length ${e.path.length - 1}.` }; }
            return { ...f, line: 6, note: `The search from ${L(r)} is exhausted: no augmenting path from ${L(r)}.` };
          });
          const last = out[out.length - 1];
          if (last.path) { const m2 = Int32Array.from(mate); augment(m2, last.newPath); out.push({ ...last, flip: mEdges(H, m2), line: 3, note: `$M\\,\\triangle\\,E(P)$: a matching with ${matchSize(m2)} edges.` }); }
          return out;
        }
        S = v.steps({ frames, code, codeTitle: 'augmenting-path search from r', speed: 1.4, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        G.onClick = ({ node, edge, alt }) => {
          if (alt) return false;
          if (edge) {
            if (M.has(edge)) M.delete(edge);
            else { for (const f of [...M]) if ([f.from, f.to].some((x) => K(x) === K(edge.from) || K(x) === K(edge.to))) M.delete(f); M.add(edge); }
            S.reset({ at: 'end' }); return true;
          }
          if (node) { const busy = [...M].some((f) => K(f.from) === K(node.id) || K(f.to) === K(node.id)); if (!busy) { root = node.id; S.reset({ at: 'start' }); } return true; }
          return false;
        };
        v.button('Augment', () => { const f = S.frames[S.n - 1]; if (f && f.flip) { M = new Set(f.flip); root = null; S.reset({ at: 'end' }); } });
        v.button('Reset', () => load());
        const nuOf = cacheBy((G) => matchSize(maxMatching(ix(G))));
        v.render(() => {
          const f = S.frame; if (!f.H) return;
          const showM = f.flip || M;
          if (f.blos && !f.flip) blobs(v, s, G, f.blos, 'purple', 40, 0.16);
          G.draw({
            nodeFill: (id) => (f.flip ? null : f.outer && f.outer.has(K(id)) ? 'blue' : f.inner && f.inner.has(K(id)) ? 'orange' : null),
            nodeRing: (id) => (K(id) === K(root) ? 'gold' : null),
            edgeColor: (e) => (f.flip ? (showM.has(e) ? 'green' : null) : f.path && f.path.has(e) ? 'green' : e === f.cur ? (f.bad ? 'red' : 'gold') : M.has(e) ? 'accent' : f.tree && f.tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (f.flip ? (showM.has(e) ? 5 : null) : f.path && f.path.has(e) ? 5.5 : e === f.cur ? 4 : M.has(e) ? 5 : f.tree && f.tree.has(e) ? 2.6 : null),
            edgeDash: (e) => !!(!f.flip && f.path && f.path.has(e) && !M.has(e)) || (e === f.cur && !!f.bad),
          });
        });
        v.legend([['accent', 'matching $M$'], ['blue', 'outer', { dot: true }], ['orange', 'inner', { dot: true }], ['purple', 'shrunk blossom', { area: true }], ['green', 'alternating tree / augmenting path']]);
        v.readout(() => {
          const f = S.frame; if (!f.H) return '';
          const nu = nuOf(G), last = S.frames[S.n - 1];
          let st = last.path ? `augmenting path of length ${last.pathLen} found` : 'no augmenting path from the root';
          if (!last.path && !shrink.value && root != null) {
            const H = ix(G), mate = mateOf(H, [...M].map((e) => H.eix.get(e)).filter((k) => k != null)), real = edmondsSearch(H, mate, H.at(root));
            if (real.path) st = `**missed**: an augmenting path from ${G.lab(root)} exists (${real.path.map((u) => G.lab(H.ids[u])).join(' ')}) — the blossom hid it`;
          }
          if (!last.path && M.size === nu) st += ' — and $M$ is maximum';
          return `$|M| = ${M.size}$ · maximum matching $\\nu(G) = ${nu}$ · ${st}`;
        });
      },
    },
    {
      num: '2.1.1c', kind: 'Definition', name: 'Vertex cover', verify: true,
      statement: String.raw`A set $U\subseteq V$ is a (**vertex**) **cover** of the edges of $G=(V,E)$ if every edge of $G$ has at least one end in $U$.`,
      idea: String.raw`A cover and a matching are dual objects: each edge of a matching $M$ needs its own vertex of $U$, since the edges of $M$ are disjoint. So every cover has at least $|M|$ vertices, for every matching $M$: $\max|M|\le\min|U|$. König's theorem (2.1.1) says that for bipartite graphs the two numbers are equal; in a triangle they are not ($\nu=1$, $\tau=2$).`,
      caption: String.raw`Click vertices to put them into $U$ (filled purple). Edges with an end in $U$ turn green, uncovered edges stay red; once nothing is red, $U$ is a cover. **Minimum** finds a smallest cover by brute force; dashed blue edges are a maximum matching, and each of its edges visibly needs its own cover vertex. Compare the bipartite grid (where $\tau=\nu$) with the Petersen graph ($\tau=6>5=\nu$). Click empty space to add a vertex, shift-drag between vertices to add an edge, Alt-click to delete.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §2.1'], tags: ['vertex cover', 'duality'],
      viz(v) {
        const grid = () => { const g = v.graphs('grid', 3, 4); return { nodes: g.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: g.edges.map((e) => [e.from, e.to]), layout: 'fit' }; };
        const PRE = { grid, pet: () => named('petersen'), k4: () => named('complete', 5) };
        const pre = v.select('', [{ value: 'grid', label: '3×4 grid' }, { value: 'pet', label: 'Petersen' }, { value: 'k4', label: '$K^5$' }], 'grid', { onChange: () => load() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.15, 1.15], axes: false, equal: true, height: 320 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true } });
        let U = new Set();
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges }).layout('fit'); U = new Set(G.nodes.filter((_, i) => i % 3 === 0).map((n) => K(n.id))); }
        load();
        G.onClick = ({ node, alt }) => { if (!node || alt) return false; const k = K(node.id); if (U.has(k)) U.delete(k); else U.add(k); return true; };
        const info = cacheBy((G) => { const H = ix(G), mvc = minVertexCover(H), mate = maxMatching(H); return { H, tau: popc(mvc), cover: bitsOf(mvc).map((u) => K(H.ids[u])), mm: mEdges(H, mate), nu: matchSize(mate) }; });
        v.button('Minimum', () => { U = new Set(info(G).cover); });
        v.button('Clear', () => { U.clear(); });
        const showM = v.toggle('show a maximum matching', true);
        v.render(() => {
          const I = info(G), cov = (e) => U.has(K(e.from)) || U.has(K(e.to));
          G.draw({ nodeFill: (id) => (U.has(K(id)) ? 'purple' : null), edgeColor: (e) => (cov(e) ? 'green' : 'red'), edgeWidth: (e) => (showM.value && I.mm.has(e) ? 4.5 : cov(e) ? 2 : 3), edgeDash: (e) => showM.value && I.mm.has(e) });
        });
        v.legend([['purple', 'vertex in $U$', { dot: true }], ['green', 'covered edge'], ['red', 'uncovered edge'], ['ink', 'maximum matching (dashed, bold)', { dash: true }]]);
        v.readout(() => {
          for (const k of [...U]) if (!G.has(k) && !G.nodes.some((n) => K(n.id) === k)) U.delete(k);
          const I = info(G), un = G.edges.filter((e) => !U.has(K(e.from)) && !U.has(K(e.to))).length;
          return `$|U| = ${U.size}$ · ${un ? `${un} edge(s) uncovered` : '**$U$ is a cover** ✓'} · minimum cover $\\tau(G) = ${I.tau}$ · maximum matching $\\nu(G) = ${I.nu}$ · $\\nu\\le\\tau$ always${I.nu === I.tau ? ', here with equality' : `, here $${I.nu} < ${I.tau}$`}`;
        });
      },
    },
    {
      num: '2.1.1', kind: 'Theorem', name: 'König’s theorem: maximum matching = minimum vertex cover', credit: 'König, 1931',
      statement: String.raw`In a bipartite graph $G$, the maximum number of edges in a matching equals the minimum number of vertices in a vertex cover of $E(G)$.`,
      idea: String.raw`A cover needs one vertex per matching edge, so $\min|U|\ge\max|M|$. For the converse take a maximum matching $M$ and pick one end of every edge $ab\in M$: the end $b\in B$ if some alternating path (2.1.1b) ends at $b$, otherwise $a$. These $|M|$ vertices cover $E$: for an edge $ab$ with $a$ not picked, either $a$ is unmatched (then $ab$ is itself an alternating path to $b$), or $a$'s partner $b'$ is reached by an alternating path $P$, which extends via $b'a$ to $b$; and an alternating path ending in $B$ cannot end at an unmatched vertex, since $M$ is maximum, so $b$ is matched and was picked.`,
      caption: String.raw`Step through: the matching grows by augmenting paths (green) until none is left; then the alternating paths from the unmatched vertices of $A$ are traced (orange rings), and one end of each matching edge is picked (purple) by König's rule. The readout checks that the purple set covers every edge and compares its size with a brute-force minimum cover. Edit the graph (${EDIT}); edges inside $A$ or inside $B$ are refused.`,
      deps: ['graph-2.1.1b', 'graph-2.1.1c', 'graph-1.6.1a'], see: ['algo-11.12'], refs: ['Diestel §2.1'], tags: ['matching', 'duality', 'bipartite'],
      viz(v) {
        const s = gstage(v, { height: 340 });
        const G = v.graph(s, { ...bipSpec(5, 5, '1:1 2:12 3:1 4:2345 5:4'), editable: true, r: 14 });
        let S = null, refused = false;
        function frames() {
          const { H, side } = bipH(G), L = (u) => G.lab(H.ids[u]), R = bipMatch(H, side, { events: true }), F = [];
          for (const e of R.events) {
            const M = mEdges(H, e.mate);
            if (e.type === 'init') F.push({ M, H, note: 'Start with the empty matching; search from each unmatched vertex of $A$ in turn.', line: 1 });
            else if (e.type === 'search') F.push({ M, H, path: pathObjs(H, e.path), ring: new Set([...e.order].map((u) => K(H.ids[u]))), note: `Alternating search from ${L(e.root)} reaches the unmatched ${L(e.path[e.path.length - 1])}: augmenting path ${e.path.map(L).join(' ')}.`, line: 2 });
            else if (e.type === 'augment') F.push({ M, H, note: `Flip it: now $|M| = ${matchSize(e.mate)}$.`, line: 3 });
            else if (e.type === 'stuck') F.push({ M, H, ring: new Set([...e.order].map((u) => K(H.ids[u]))), note: `No alternating path from ${L(e.root)} ends at an unmatched vertex: ${L(e.root)} stays unmatched.`, line: 2 });
          }
          const kc = konigCover(H, side, R.mate), M = mEdges(H, R.mate), Z = new Set(); for (let u = 0; u < H.n; u++) if (kc.reachA[u] || kc.reachB[u]) Z.add(K(H.ids[u]));
          F.push({ M, H, ring: Z, note: `$M$ is maximum. Orange rings: the vertices reached by alternating paths from the unmatched vertices of $A$.`, line: 4 });
          const U = new Set(kc.U.map((u) => K(H.ids[u])));
          F.push({ M, H, ring: Z, U, final: true, note: `From each edge of $M$ take its $B$-end if an alternating path ends there, else its $A$-end: $U = \\{${kc.U.map(L).join(', ')}\\}$, $|U| = |M| = ${kc.U.length}$.`, line: 5 });
          return F;
        }
        S = v.steps({ frames, code: ['M ← ∅', 'for each unmatched a ∈ A: search alternating paths from a', '  if one ends at an unmatched b: M ← M △ P', 'Z ← vertices on alternating paths from unmatched A-vertices', 'U ← for each ab ∈ M: (b ∈ Z ? b : a)'], codeTitle: 'König’s cover', speed: 1.2, start: 'end', still: 'end' });
        G.onChange = (kind) => { refused = (kind === 'add-edge' || kind === 'move') && keepBip(G); S.reset({ at: 'end' }); };
        const mvc = cacheBy((G) => popc(minVertexCover(ix(G))));
        v.render(() => {
          const f = S.frame; if (!f.H) return; sides(s);
          const cov = (e) => f.U && (f.U.has(K(e.from)) || f.U.has(K(e.to)));
          G.draw({
            nodeFill: (id) => (f.U && f.U.has(K(id)) ? 'purple' : null), nodeRing: (id) => (f.ring && f.ring.has(K(id)) ? 'orange' : null),
            edgeColor: (e) => (f.path && f.path.has(e) ? 'green' : f.M.has(e) ? 'accent' : f.final && !cov(e) ? 'red' : null),
            edgeWidth: (e) => (f.path && f.path.has(e) ? 5.5 : f.M.has(e) ? 5 : null), edgeDash: (e) => !!(f.path && f.path.has(e) && !f.M.has(e)),
          });
          if (refused) s.corner('edge refused: both ends on one side', 'bl', { color: 'red', weight: 600 });
        });
        v.legend([['accent', 'matching $M$'], ['green', 'augmenting path', { dash: true }], ['orange', 'reached by an alternating path', { dot: true }], ['purple', 'cover $U$', { dot: true }]]);
        v.readout(() => {
          const f = S.frame; if (!f.H) return '';
          const last = S.frames[S.n - 1], unc = G.edges.filter((e) => !last.U.has(K(e.from)) && !last.U.has(K(e.to))).length, t = mvc(G);
          return `maximum matching: $|M| = ${last.M.size}$ · König's set: $|U| = ${last.U.size}$, ${unc ? `${unc} edge(s) uncovered ✗` : 'covers every edge ✓'} · brute-force minimum cover: $\\tau = ${t}$ ${t === last.M.size ? '$= \\nu$ ✓' : '✗'}`;
        });
      },
    },
    {
      num: '2.1.2', kind: 'Theorem', name: 'Hall’s marriage theorem', credit: 'Hall, 1935',
      statement: String.raw`Let $G$ be bipartite with bipartition $\{A,B\}$. Then $G$ contains a matching of $A$ if and only if $|N(S)|\ge|S|$ for every $S\subseteq A$ (the **marriage condition**).`,
      idea: String.raw`Necessity is clear: a matching of $A$ sends $S$ to $|S|$ distinct neighbours. For sufficiency (the first of Diestel's three proofs) let $M$ leave some $a\in A$ unmatched, and let $A',B'$ be the vertices reachable from $a$ by alternating paths (2.1.1b). If no augmenting path exists, every $b\in B'$ is matched, and its partner lies in $A'$; these partners are distinct and differ from $a$, so $|A'|\ge|B'|+1$. But every neighbour of $A'$ lies in $B'$ (an edge $a'b$ extends an alternating path to $b$), so $S:=A'$ violates the marriage condition. Hence a maximum matching that misses $a$ hands us the violating set.`,
      caption: String.raw`Edit the edges between $A$ and $B$ (${EDIT}). If a matching of $A$ exists it is drawn in green and the readout confirms the marriage condition for all $2^{|A|}$ subsets by brute force. Otherwise the alternating search from an unmatched $a$ produces $S$ (orange) and $N(S)$ (red rings) with $|N(S)|=|S|-1$; the blue matching edges pair $N(S)$ off inside $S$, showing where the missing partner went.`,
      deps: ['graph-2.1.1b', 'graph-1.6.1a'], see: ['algo-11.11'], refs: ['Diestel §2.1'], tags: ['matching', 'Hall', 'bipartite'],
      viz(v) {
        const PRE = { bad: () => bipSpec(5, 5, '1:2 2:23 3:23 4:13 5:45'), good: () => bipSpec(5, 5, '1:12 2:23 3:13 4:345 5:45') };
        const pre = v.select('', [{ value: 'bad', label: 'condition fails' }, { value: 'good', label: 'condition holds' }], 'bad', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes, edges: P.edges }); } });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...PRE.bad(), editable: true, r: 14 });
        let refused = false;
        G.onChange = (kind) => { refused = (kind === 'add-edge' || kind === 'move') && keepBip(G); };
        const info = cacheBy((G) => {
          const { H, side } = bipH(G), R = bipMatch(H, side), A = [...Array(H.n).keys()].filter((u) => side[u] === 0);
          const free = A.find((a) => R.mate[a] < 0);
          let viol = 0; const nA = A.length;
          if (nA <= 12) for (let m = 1; m < 1 << nA; m++) { const Nb = new Set(); let c = 0; for (let i = 0; i < nA; i++) if ((m >> i) & 1) { c++; for (const [w] of H.adj[A[i]]) Nb.add(w); } if (Nb.size < c) viol++; }
          const res = { H, M: mEdges(H, R.mate), nA, viol, size: matchSize(R.mate) };
          if (free != null) { const r = altReach(H, side, R.mate, [free]); res.S = new Set(); res.N = new Set(); for (let u = 0; u < H.n; u++) { if (r.reachA[u]) res.S.add(K(H.ids[u])); if (r.reachB[u]) res.N.add(K(H.ids[u])); } res.free = K(H.ids[free]); }
          return res;
        });
        v.render(() => {
          sides(s); const I = info(G), bad = !!I.S;
          const fromS = (e) => bad && (I.S.has(K(e.from)) || I.S.has(K(e.to)));
          G.draw({
            nodeFill: (id) => (bad && I.S.has(K(id)) ? 'orange' : null), nodeRing: (id) => (bad && I.N.has(K(id)) ? 'red' : bad && K(id) === I.free ? 'gold' : null),
            edgeColor: (e) => (I.M.has(e) ? (bad ? 'accent' : 'green') : fromS(e) ? 'orange' : null), edgeWidth: (e) => (I.M.has(e) ? 5 : fromS(e) ? 2.6 : null),
          });
          if (refused) s.corner('edge refused: both ends on one side', 'bl', { color: 'red', weight: 600 });
        });
        v.legend([['green', 'matching of $A$'], ['orange', '$S\\subseteq A$ and its edges', { dot: true }], ['red', '$N(S)$', { dot: true }], ['accent', 'maximum matching (when $A$ cannot be matched)']]);
        v.readout(() => {
          const I = info(G), chk = I.nA <= 12 ? ` · brute force: ${I.viol} of the $2^{${I.nA}}-1$ non-empty $S\\subseteq A$ violate the condition` : '';
          if (!I.S) return `**a matching of $A$** with ${I.size} edges ✓${chk}`;
          const L = (set) => [...set].map((k) => sub(G.lab(G.nodes.find((n) => K(n.id) === k).id))).join(', ');
          return `no matching of $A$ (maximum: ${I.size} edges) · $S = \\{${L(I.S)}\\}$, $N(S) = \\{${L(I.N)}\\}$: $|N(S)| = ${I.N.size} < ${I.S.size} = |S|$${chk}`;
        });
      },
    },
    {
      num: '2.1.3', kind: 'Corollary', name: 'Regular bipartite graphs have a 1-factor',
      statement: String.raw`Every $k$-regular bipartite graph with $k\ge1$ has a 1-factor.`,
      idea: String.raw`Counting edges gives $k|A|=\|G\|=k|B|$, so $|A|=|B|$ and a matching of $A$ is a 1-factor. For $S\subseteq A$, the $k|S|$ edges at $S$ all end in $N(S)$, where they are among the $k|N(S)|$ edges at $N(S)$. So $k|S|\le k|N(S)|$, the marriage condition holds, and Hall's theorem (2.1.2) gives the matching. Regularity on *both* sides matters: if only the vertices of $A$ have degree $k$, the edges from $S$ may crowd into fewer than $|S|$ vertices.`,
      caption: String.raw`A random $k$-regular bipartite graph with its 1-factor in green. Click vertices of $A$ (top row) to form $S$: its $k|S|$ edges (orange) all land in $N(S)$ (red rings), which can absorb only $k|N(S)|$ edge-ends, so $|N(S)|\ge|S|$. Switch to **only A regular**: now Hall's condition can fail and the violating set is shown.`,
      deps: ['graph-2.1.2'], refs: ['Diestel §2.1'], tags: ['matching', 'regular graphs'],
      viz(v) {
        const nS = v.slider('$n$', 3, 8, 6, { int: true, onChange: () => gen() });
        const kS = v.slider('$k$', 1, 5, 3, { int: true, onChange: () => gen() });
        const mode = v.select('', [{ value: 'reg', label: 'k-regular' }, { value: 'skew', label: 'only A regular' }], 'reg', { onChange: () => gen() });
        let seed = 7;
        v.button('New graph', () => { seed++; gen(); });
        const s = gstage(v, { height: 300 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13 });
        let S = new Set();
        function gen() {
          const n = nS.value, k = Math.min(kS.value, mode.value === 'skew' ? n - 1 : n), r = v.rng(seed * 31 + n * 7 + k);
          const perm = () => { const p = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
          const nodes = [], edges = [], x = (i) => (n === 1 ? 5 : 0.9 + (i * 8.2) / (n - 1));
          for (let i = 0; i < n; i++) { nodes.push({ id: 'a' + (i + 1), label: sub('a' + (i + 1)), x: x(i), y: 5.3 }); nodes.push({ id: 'b' + (i + 1), label: sub('b' + (i + 1)), x: x(i), y: 1.1, notePos: 's' }); }
          const sg = perm(), tau = perm();
          if (mode.value === 'reg') { for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) edges.push(['a' + (i + 1), 'b' + (sg[(tau[i] + t) % n] + 1)]); }
          else for (let i = 0; i < n; i++) { const nb = i <= k && k < n ? sg.slice(0, k) : perm().slice(0, k); for (const j of nb) edges.push(['a' + (i + 1), 'b' + (j + 1)]); }
          G.set({ nodes, edges, layout: 'none' });
          S = new Set(['a1', 'a2'].filter((id) => G.has(id)));
          if (mode.value === 'skew') { const I = info(G); if (I.viol) S = new Set(I.viol); }
        }
        const info = cacheBy((G) => {
          const H = ix(G), side = H.nodes.map((nd) => (nd.y > 3 ? 0 : 1)), R = bipMatch(H, side), free = [...Array(H.n).keys()].find((u) => side[u] === 0 && R.mate[u] < 0);
          let viol = null; if (free != null) { const rr = altReach(H, side, R.mate, [free]); viol = [...Array(H.n).keys()].filter((u) => rr.reachA[u]).map((u) => K(H.ids[u])); }
          return { M: mEdges(H, R.mate), size: matchSize(R.mate), viol, degA: degrees(H).filter((_, u) => side[u] === 0), degB: degrees(H).filter((_, u) => side[u] === 1) };
        });
        gen();
        G.onClick = ({ node }) => { if (node && node.y > 3) { const k = K(node.id); if (S.has(k)) S.delete(k); else S.add(k); } return true; };
        v.render(() => {
          const I = info(G), N = new Set(); for (const e of G.edges) if (S.has(K(e.from))) N.add(K(e.to));
          const fromS = (e) => S.has(K(e.from));
          G.draw({ nodeFill: (id) => (S.has(K(id)) ? 'orange' : null), nodeRing: (id) => (N.has(K(id)) ? 'red' : null),
            edgeColor: (e) => (fromS(e) ? 'orange' : I.M.has(e) ? 'green' : null), edgeWidth: (e) => (I.M.has(e) ? 4.5 : fromS(e) ? 2.4 : 1.3), edgeDash: (e) => fromS(e) && I.M.has(e),
            nodeNote: (id) => (N.has(K(id)) ? String(G.edges.filter((e) => K(e.to) === K(id)).length) : null), noteColor: () => 'red' });
          s.text('A', 0.15, 5.3, { color: 'muted', weight: 700, baseline: 'middle' }); s.text('B', 0.15, 1.1, { color: 'muted', weight: 700, baseline: 'middle' });
        });
        v.legend([['green', 'perfect matching (1-factor)'], ['orange', '$S$ and its edges', { dot: true }], ['red', '$N(S)$ (note: its degree)', { dot: true }]]);
        v.readout(() => {
          const I = info(G), n = nS.value, N = new Set(); let out = 0; for (const e of G.edges) if (S.has(K(e.from))) { N.add(K(e.to)); out++; }
          let ends = 0; for (const e of G.edges) if (N.has(K(e.to))) ends++;
          const reg = I.degA.concat(I.degB).every((d) => d === I.degA[0]);
          return `degrees: $A$ ${[...new Set(I.degA)].join('/')}, $B$ ${[...new Set(I.degB)].join('/')} ${reg ? '(regular)' : '(not regular)'} · $|S| = ${S.size}$: ${out} edges leave $S$, all into $N(S)$, which carries ${ends} edge-ends · $|N(S)| = ${N.size}$ ${N.size >= S.size ? '≥' : '<'} $|S|$ · ${I.size === n ? '**1-factor** ✓' : `no 1-factor (maximum matching ${I.size})`}`;
        });
      },
    },
    {
      num: '2.1.3a', kind: 'Definition', name: 'Stable matchings', verify: true,
      statement: String.raw`A family $(\le_v)_{v\in V}$ of linear orders, $\le_v$ on the set $E(v)$ of edges at $v$, is a set of **preferences** for $G$ ($e<_v f$: $v$ prefers $f$ to $e$). A matching $M$ in $G$ is **stable** if for every edge $e\in E\setminus M$ there is an edge $f\in M$ sharing a vertex $v$ with $e$ such that $e<_v f$. Equivalently, there is no **blocking** edge $e=ab\notin M$ whose two ends each are unmatched or prefer $e$ to their own matching edge.`,
      idea: String.raw`A blocking edge is an incentive to deviate: $a$ and $b$ would both rather be matched to each other, so they could drop their current partners and take $e$. Stability is a local, "no two vertices conspire" condition, quite different from maximality: a stable matching need not be maximum, and a maximum matching need not be stable.`,
      caption: String.raw`Each vertex lists its neighbours, favourite first (green = current partner, red = a blocking partner). Click edges to build a matching; edges already at a vertex are dropped automatically. Blocking edges are drawn in red. **Next stable** steps through the stable matchings, found by brute force over all matchings of $G$; **New preferences** reshuffles the lists.`,
      deps: ['graph-2.1.1a'], see: ['game-7.3'], refs: ['Diestel §2.1'], tags: ['matching', 'stable marriage'],
      viz(v) {
        let seed = 3, pref = {}, M = new Set(), stable = [], si = -1;
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, draggable: false });
        function gen() {
          const r = v.rng(seed * 101 + 5), P = prefGraph(4, r, 3);
          for (const n of P.nodes) n.x = n.id[0] === 'a' ? 3.6 : 6.4;
          G.set({ nodes: P.nodes, edges: P.edges, layout: 'none' }); pref = randPrefs(G, r); M = new Set(); si = -1;
          const all = allMatchings(G).map((m) => ({ m, b: blocking(G, pref, partnerOf(m)).length }));
          stable = all.filter((o) => o.b === 0).map((o) => o.m);
          const start = all.filter((o) => o.m.length === 4 && o.b > 0).sort((x, y) => x.b - y.b)[0];
          if (start) M = new Set(start.m);
        }
        gen();
        G.onClick = ({ edge }) => {
          if (!edge) return true;
          if (M.has(edge)) M.delete(edge); else { for (const f of [...M]) if ([f.from, f.to].some((x) => x === edge.from || x === edge.to)) M.delete(f); M.add(edge); }
          return true;
        };
        v.button('Next stable', () => { if (stable.length) { si = (si + 1) % stable.length; M = new Set(stable[si]); } });
        v.button('Clear', () => { M = new Set(); });
        v.button('New preferences', () => { seed++; gen(); });
        v.render(() => {
          const p = partnerOf(M), bl = blocking(G, pref, p), bad = new Set(bl.map(pkey));
          G.draw({ edgeColor: (e) => (M.has(e) ? 'green' : bad.has(pkey(e)) ? 'red' : null), edgeWidth: (e) => (M.has(e) ? 5 : bad.has(pkey(e)) ? 3 : 1.3), edgeDash: (e) => bad.has(pkey(e)) });
          drawPrefs(s, G, pref, p, bad, 0.6);
        });
        v.legend([['green', 'matching $M$'], ['red', 'blocking edge', { dash: true }]]);
        const all = cacheBy((G) => allMatchings(G).length);
        v.readout(() => {
          const p = partnerOf(M), bl = blocking(G, pref, p);
          const verdict = bl.length ? `${bl.length} blocking edge(s): ${bl.map((e) => sub(edgeName(G, e))).join(', ')} — **not stable**` : '**stable** ✓ (no blocking edge)';
          return `$|M| = ${M.size}$ · ${verdict} · brute force: ${stable.length} of the ${all(G)} matchings of $G$ are stable${si >= 0 ? ` (showing #${si + 1})` : ''}`;
        });
      },
    },
    {
      num: '2.1.4', kind: 'Theorem', name: 'Gale–Shapley: stable matchings always exist', credit: 'Gale & Shapley, 1962',
      statement: String.raw`For every set of preferences, a bipartite graph $G$ has a stable matching.`,
      idea: String.raw`Start with $M=\emptyset$ and keep every vertex of $A$ "happy" (unmatched, or matched to its favourite among the $b$ that would accept it). Call $a\in A$ *acceptable* to $b$ if $b$ is unmatched or prefers $ab$ to its matching edge. While some unmatched $a$ is acceptable to a neighbour, add $a$'s favourite edge $ab$ with $a$ acceptable to $b$ and drop $b$'s old edge. Each step makes $B$ strictly happier, and a vertex $b$ can improve at most $d(b)$ times, so the process stops — at a matching in which no unmatched $a$ is acceptable to anyone and every matched $a$ is happy: no edge blocks.`,
      caption: String.raw`Step through deferred acceptance (Diestel's version): the gold edge is the current proposal, a red dashed edge is the one $b$ drops. The lower panel tracks how happy each receiver is (rank of its partner, best at the top): the curves only rise, which is the termination argument. Switch who proposes, or reshuffle the preferences; the final matching is checked for blocking edges.`,
      deps: ['graph-2.1.3a', 'graph-1.6.1a'], see: ['algo-11.14', 'game-7.3', 'game-7.4'], refs: ['Diestel §2.1'], tags: ['stable marriage', 'algorithm'],
      viz(v) {
        let seed = 11, pref = {};
        const who = v.select('proposers', [{ value: 'a', label: '$A$ proposes' }, { value: 'b', label: '$B$ proposes' }], 'a', { onChange: () => S.reset({ at: 'end' }) });
        v.button('New preferences', () => { seed++; gen(); S.reset({ at: 'end' }); });
        const s = gstage(v, { y: [0, 6.8], height: 310, full: true });
        const p = v.stage({ x: [0, 1], y: [-0.4, 5.4], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'step', ylabel: 'happiness', title: 'receivers: rank of current partner (higher = better)' });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, draggable: false });
        const n = 5;
        function gen() { const r = v.rng(seed * 13 + 1), P = prefGraph(n, r, 6); for (const nd of P.nodes) nd.x = nd.id[0] === 'a' ? 3.7 : 6.3; G.set({ nodes: P.nodes, edges: P.edges, layout: 'none' }); pref = randPrefs(G, r); }
        gen();
        const rank = (x, y) => pref[K(x)].findIndex((z) => K(z) === K(y));
        function frames() {
          const P = who.value, prop = G.nodes.filter((x) => x.id[0] === P).map((x) => K(x.id)), recv = G.nodes.filter((x) => x.id[0] !== P).map((x) => K(x.id));
          const partner = new Map(), F = [], hist = [];
          const happy = () => recv.map((b) => (partner.has(b) ? pref[b].length - rank(b, partner.get(b)) : 0));
          const snap = (o) => { hist.push(happy()); F.push({ partner: new Map(partner), hist: hist.map((h) => h.slice()), ...o }); };
          snap({ note: 'Start with the empty matching.', line: 1 });
          for (let g = 0; g < 200; g++) {
            const acceptable = (a, b) => !partner.has(b) || rank(b, a) < rank(b, partner.get(b));
            const a = prop.find((x) => !partner.has(x) && pref[x].some((b) => acceptable(x, K(b))));
            if (a == null) break;
            const b = K(pref[a].find((y) => acceptable(a, K(y)))), old = partner.get(b);
            if (old != null) partner.delete(old);
            partner.set(a, b); partner.set(b, a);
            snap({ cur: ekey(a, b), drop: old != null ? ekey(old, b) : null, line: 3, note: `${sub(G.lab(a))} is unmatched; its favourite among the receivers that would accept it is ${sub(G.lab(b))}${old != null ? `, who drops ${sub(G.lab(old))}` : ''}.` });
          }
          const bl = blocking(G, pref, partner);
          F.push({ ...F[F.length - 1], cur: null, drop: null, done: true, line: 4, note: `No unmatched proposer is acceptable to anyone: stop. Blocking edges: ${bl.length ? bl.map((e) => sub(edgeName(G, e))).join(', ') : 'none — **stable** ✓'}.` });
          return F;
        }
        const S = v.steps({ frames, code: ['M ← ∅', 'while some unmatched proposer a is acceptable to a neighbour:', '  b ← a’s favourite among the neighbours that accept a', '  add ab to M, drop b’s old edge (b trades up)', 'return M   ▷ stable'], codeTitle: 'Gale–Shapley', speed: 1.5, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.partner) return;
          const M = new Set(G.edges.filter((e) => f.partner.get(K(e.from)) === K(e.to)).map(pkey)), bl = f.done ? new Set(blocking(G, pref, f.partner).map(pkey)) : new Set();
          G.draw({ edgeColor: (e) => (pkey(e) === f.cur ? 'gold' : M.has(pkey(e)) ? 'green' : pkey(e) === f.drop ? 'red' : bl.has(pkey(e)) ? 'red' : null),
            edgeWidth: (e) => (pkey(e) === f.cur ? 5.5 : M.has(pkey(e)) ? 4.5 : pkey(e) === f.drop ? 3 : 1.2), edgeDash: (e) => pkey(e) === f.drop });
          drawPrefs(s, G, pref, f.partner, bl, 0.55);
          s.text(who.value === 'a' ? 'proposers' : 'receivers', 3.7, 6.5, { size: 11.5, align: 'center', color: 'muted' }); s.text(who.value === 'a' ? 'receivers' : 'proposers', 6.3, 6.5, { size: 11.5, align: 'center', color: 'muted' });
          const T = Math.max(1, S.n - 2); p.setView([0, T], [-0.4, n + 0.4]); p.setTicks([...Array(T + 1).keys()].filter((i) => T <= 12 || i % 2 === 0), [0, 1, 2, 3, 4, 5]);
          const recv = G.nodes.filter((x) => x.id[0] !== who.value);
          recv.forEach((b, j) => { const pts = f.hist.map((h, i) => [i, h[j] + (j - 2) * 0.06]); p.path(pts, { color: PALETTE[j], width: 2.4 }); const L = pts[pts.length - 1]; p.dot(L[0], L[1], { r: 3.5, color: PALETTE[j] }); p.text(sub(G.lab(b.id)), L[0], L[1], { dx: 6, size: 11.5, color: PALETTE[j], baseline: 'middle' }); });
        });
        v.legend([['gold', 'proposal'], ['green', 'matching'], ['red', 'dropped / blocking', { dash: true }]]);
        v.readout(() => { const f = S.frame; if (!f.partner) return ''; const last = S.frames[S.n - 1], bl = blocking(G, pref, last.partner); return `step ${S.i} of ${S.n - 1} · final matching: ${[...last.partner].filter(([x]) => x[0] === 'a').map(([x, y]) => sub(G.lab(x) + G.lab(y))).join(', ')} · ${bl.length ? 'blocking edges remain ✗' : '0 blocking edges: **stable** ✓'}`; });
      },
    },
    {
      num: '2.1.5', kind: 'Corollary', name: 'Petersen: regular graphs of even degree have a 2-factor', credit: 'Petersen, 1891',
      statement: String.raw`Every regular graph of positive even degree has a 2-factor.`,
      idea: String.raw`Let $G$ be $2k$-regular, without loss of generality connected. By Euler's theorem (1.8.1) it has an Euler tour $v_0e_0v_1\dots e_{\ell-1}v_\ell=v_0$; orient each $e_i$ from $v_i$ to $v_{i+1}$, so every vertex has $k$ outgoing and $k$ incoming edges. Split each vertex $v$ into $v^+$ (tails) and $v^-$ (heads): the bipartite graph $G'$ with edges $v_i^+v_{i+1}^-$ is $k$-regular, so it has a 1-factor by 2.1.3. Gluing $v^+$ and $v^-$ back together, each vertex receives one outgoing and one incoming factor edge: a 2-factor of $G$.`,
      caption: String.raw`Step through the proof: the Euler tour orients $G$ edge by edge, $G'$ appears on the right ($v^+$ left column, $v^-$ right column), its 1-factor is found, and folding $v^\pm$ together gives the 2-factor on the left, its cycles in different colours. Try the different $2k$-regular graphs.`,
      deps: ['graph-1.8.1', 'graph-2.1.3'], refs: ['Diestel §2.1'], tags: ['factors', 'Euler tours'],
      viz(v) {
        const circ = (n, J) => { const P = named('cycle', n); const edges = []; for (let i = 0; i < n; i++) for (const j of J) { const w = (i + j) % n; if (!edges.some(([a, b]) => ekey(a, b) === ekey(i, w))) edges.push([i, w]); } return { nodes: P.nodes, edges, layout: 'fit' }; };
        const PRE = { oct: () => named('octahedron'), c9: () => circ(9, [1, 3]), k5: () => named('complete', 5), k7: () => named('complete', 7) };
        const pre = v.select('', [{ value: 'oct', label: 'octahedron (4-reg.)' }, { value: 'c9', label: '$C_9(1,3)$ (4-reg.)' }, { value: 'k5', label: '$K^5$' }, { value: 'k7', label: '$K^7$ (6-reg.)' }], 'c9', { onChange: () => { load(); S.reset({ at: 'end' }); } });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 320, title: '$G$' });
        const R = v.stage({ x: [0, 10], y: [-0.7, 9.7], axes: false, height: 320, title: "$G'$: $v^+$ (tails) and $v^-$ (heads)" });
        const G = v.graph(L, { nodes: [], edges: [], r: 13, directed: false, draggable: true });
        const B = v.graph(R, { nodes: [], edges: [], r: 11, draggable: false, fontSize: 11 });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: String(n.id + 1) })), edges: P.edges.map(([a, b]) => ({ from: a, to: b })) }).layout('fit'); }
        load();
        function frames() {
          const H = ix(G), n = H.n, tour = eulerTour(H), F = [], arcs = [];
          F.push({ arcs: [], stage: 0, note: `$G$ is ${degrees(H)[0]}-regular, so it has an Euler tour.`, line: 1 });
          for (let i = 0; i + 1 < tour.length; i++) { arcs.push([tour[i], tour[i + 1]]); F.push({ arcs: arcs.slice(), stage: 0, note: `Tour edge ${i + 1}: orient ${tour[i] + 1} → ${tour[i + 1] + 1}.`, line: 1, hold: 0.5 }); }
          const Bn = []; for (let u = 0; u < n; u++) { const y = n === 1 ? 4.5 : 9 - (u * 9) / (n - 1); Bn.push({ id: 'p' + u, label: `${u + 1}⁺`, x: 2.2, y }, { id: 'm' + u, label: `${u + 1}⁻`, x: 7.8, y }); }
          const Be = arcs.map(([a, b]) => ({ from: 'p' + a, to: 'm' + b }));
          F.push({ arcs, stage: 1, Bn, Be, note: `Split each vertex: arc $u\\to w$ becomes the edge $u^+w^-$. $G'$ is ${degrees(H)[0] / 2}-regular and bipartite.`, line: 2 });
          const BH = ix({ nodes: Bn, edges: Be }), side = BH.ids.map((id) => (id[0] === 'p' ? 0 : 1)), mate = bipMatch(BH, side).mate;
          const fac = new Set(); for (let u = 0; u < BH.n; u++) if (side[u] === 0 && mate[u] >= 0) fac.add(ekey(BH.ids[u], BH.ids[mate[u]]));
          F.push({ arcs, stage: 2, Bn, Be, fac, note: 'By 2.1.3 $G\'$ has a 1-factor (green).', line: 3 });
          const chosen = arcs.filter(([a, b]) => fac.has(ekey('p' + a, 'm' + b)));
          F.push({ arcs, stage: 3, Bn, Be, fac, chosen, note: 'Glue $v^+$ and $v^-$ back together: every vertex has one outgoing and one incoming factor edge — a 2-factor.', line: 4 });
          return F;
        }
        const S = v.steps({ frames, code: ['orient G along an Euler tour', "split v into v⁺, v⁻: G' is k-regular bipartite", "find a 1-factor of G' (Cor. 2.1.3)", 'glue v⁺, v⁻ back: a 2-factor of G'], codeTitle: 'Petersen 1891', speed: 3, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.arcs) return;
          const H = ix(G), ar = new Map(f.arcs.map(([a, b], i) => [ekey(a, b), [a, b, i]]));
          let cyc = new Map();
          if (f.chosen) { const sub2 = { n: H.n, adj: H.adj.map((l, u) => l.filter(([w]) => f.chosen.some(([a, b]) => ekey(a, b) === ekey(u, w)))) }; comps(sub2).lists.forEach((Lc, i) => Lc.forEach((u) => cyc.set(u, i))); }
          G.edges.forEach((e) => { const a = ar.get(ekey(e.from, e.to)); e.directed = !!a; if (a) { e.from = a[0]; e.to = a[1]; } });
          const inF = (e) => f.chosen && f.chosen.some(([a, b]) => a === e.from && b === e.to);
          G.draw({ edgeColor: (e) => (inF(e) ? PALETTE[cyc.get(e.from) % 8] : ar.has(ekey(e.from, e.to)) ? (f.stage === 0 && ar.get(ekey(e.from, e.to))[2] === f.arcs.length - 1 ? 'gold' : 'muted') : 'faint'),
            edgeWidth: (e) => (inF(e) ? 4.5 : 1.6), nodeFill: (id) => (f.chosen ? PALETTE[cyc.get(id) % 8] : null) });
          if (f.Bn) { if (B.nodes.length !== f.Bn.length || B.edges.length !== f.Be.length) B.set({ nodes: f.Bn.map((x) => ({ ...x })), edges: f.Be.map((e) => ({ ...e })) }); B.draw({ edgeColor: (e) => (f.fac && f.fac.has(ekey(e.from, e.to)) ? 'green' : 'muted'), edgeWidth: (e) => (f.fac && f.fac.has(ekey(e.from, e.to)) ? 4 : 1.2) }); }
          else R.text('(appears after the tour)', 5, 4.5, { align: 'center', color: 'muted', size: 13 });
        });
        v.legend([['gold', 'tour edge just oriented'], ['green', "1-factor of $G'$"], ['blue', 'cycles of the 2-factor']]);
        v.readout(() => {
          const last = S.frames[S.n - 1]; if (!last || !last.chosen) return '';
          const H = ix(G), deg = new Array(H.n).fill(0); last.chosen.forEach(([a, b]) => { deg[a]++; deg[b]++; });
          const ks = new Set(last.chosen.map(([a, b]) => H.eix.get(G.edges.find((e) => ekey(e.from, e.to) === ekey(a, b)))));
          return `$G$: ${H.n} vertices, degree ${degrees(H)[0]} · Euler tour of length ${H.m} · factor: every vertex has degree ${deg.every((d) => d === 2) ? '**2** ✓' : 'not 2 ✗'} — cycles of lengths ${cycleLengths(H, ks).join(', ')}`;
        });
      },
    },
    // ================================================================== 2.2 Matching in general graphs
    {
      num: '2.2.1a', kind: 'Definition', name: 'Tutte’s condition and odd components', verify: true,
      statement: String.raw`For a graph $G$ let $\mathcal C_G$ be the set of its components and $q(G)$ the number of its **odd components**, those of odd order. $G$ satisfies **Tutte's condition** if $q(G-S)\le|S|$ for every $S\subseteq V(G)$. A set $S$ with $q(G-S)>|S|$ is called **bad**.`,
      idea: String.raw`If $G$ has a 1-factor, every odd component $C$ of $G-S$ must send a factor edge to $S$ — its vertices cannot all be paired up inside $C$ — and distinct odd components use distinct vertices of $S$. So a 1-factor forces Tutte's condition; a bad set is a short certificate that no 1-factor exists. Taking $S=\emptyset$ already says that every component of $G$ must be even.`,
      caption: String.raw`Click vertices to put them into $S$ (gold). The components of $G-S$ are shaded: odd ones red, even ones blue, each labelled with its order. The readout compares $q(G-S)$ with $|S|$. With $S=\{s\}$ the default graph leaves three odd components behind one vertex, so it cannot have a 1-factor. Edit the graph: click empty space to add a vertex, shift-drag to add an edge, Alt-click to delete.`,
      deps: ['graph-1.4.1a', 'graph-2.1.1a'], refs: ['Diestel §2.2'], tags: ['matching', 'Tutte'],
      viz(v) {
        const PRE = { bad: () => ({ g: TUTTE_BAD(), S: ['s'] }), pet: () => ({ g: named('petersen'), S: [0, 7, 8] }), grid: () => { const g = v.graphs('grid', 3, 4); return { g: { nodes: g.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: g.edges.map((e) => [e.from, e.to]), layout: 'fit' }, S: [5] }; } };
        const pre = v.select('', [{ value: 'bad', label: 'three odd pieces' }, { value: 'pet', label: 'Petersen' }, { value: 'grid', label: '3×4 grid' }], 'bad', { onChange: () => load() });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 14, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true } });
        let S = new Set();
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.g.nodes.map((n) => ({ ...n, label: pre.value === 'bad' ? n.id : '' })), edges: P.g.edges }).layout(P.g.layout || 'none'); S = new Set(P.S.map(K)); }
        load();
        G.onClick = ({ node, alt }) => { if (!node || alt) return false; const k = K(node.id); if (S.has(k)) S.delete(k); else S.add(k); return true; };
        v.button('Clear $S$', () => S.clear());
        v.render(() => {
          const H = ix(G), Si = idxSet(H, S), cs = compsMinus(H, Si);
          blobs(v, s, G, cs.map((c) => c.L.map((u) => H.ids[u])), (i) => (cs[i].odd ? 'red' : 'blue'), 36, 0.17);
          G.draw({ nodeFill: (id) => (S.has(K(id)) ? 'gold' : null), edgeColor: (e) => (S.has(K(e.from)) || S.has(K(e.to)) ? 'faint' : null), edgeDash: (e) => S.has(K(e.from)) || S.has(K(e.to)) });
          for (const c of cs) { const P = c.L.map((u) => G.node(H.ids[u])), cx = P.reduce((a, n) => a + n.x, 0) / P.length, cy = P.reduce((a, n) => a + n.y, 0) / P.length; s.text(String(c.L.length), cx, cy, { dy: c.L.length === 1 ? -26 : 0, align: 'center', size: 14, weight: 800, color: c.odd ? 'red' : 'blue', plate: true }); }
        });
        v.legend([['gold', '$S$', { dot: true }], ['red', 'odd component of $G-S$', { area: true }], ['blue', 'even component', { area: true }]]);
        v.readout(() => {
          const H = ix(G), cs = compsMinus(H, idxSet(H, S)), q = cs.filter((c) => c.odd).length;
          return `$|S| = ${S.size}$ · components of $G-S$: ${cs.length} (orders ${cs.map((c) => c.L.length).join(', ') || '—'}) · $q(G-S) = ${q}$ ${q > S.size ? `$> ${S.size} = |S|$: **$S$ is bad**, so $G$ has no 1-factor` : `$\\le ${S.size} = |S|$: the condition holds for this $S$`}`;
        });
      },
    },
    {
      num: '2.2.1', kind: 'Theorem', name: 'Tutte’s 1-factor theorem', credit: 'Tutte, 1947',
      statement: String.raw`A graph $G$ has a 1-factor if and only if $q(G-S)\le|S|$ for all $S\subseteq V(G)$.`,
      idea: String.raw`Necessity is 2.2.1a. For sufficiency take $G$ edge-maximal without a 1-factor (adding edges can only merge components of $G-S$, so a bad set for the bigger graph is bad for $G$). If the set $S$ of vertices adjacent to all others leaves only complete components, then either $S$ or $\emptyset$ is bad. Otherwise there are $a,b,c$ with $ab,bc\in E$, $ac\notin E$, and some $d$ with $bd\notin E$; maximality gives 1-factors $M_1$ of $G+ac$ and $M_2$ of $G+bd$, and following an $M_1$–$M_2$ alternating path from $d$ produces a 1-factor of $G$ itself — a contradiction. Algorithmically, Edmonds' blossom algorithm (2.1.1b) finds either a 1-factor or, from its final alternating forest, a bad set.`,
      caption: String.raw`Edit the graph (${EDIT}). If it has a 1-factor, Edmonds' algorithm draws it in green and a brute-force sweep over all $2^{|G|}$ sets $S$ confirms Tutte's condition. If not, the worst bad set $S$ (gold, maximising $q(G-S)-|S|$) appears with its odd components (red), together with a maximum matching whose unmatched vertices (red rings) number exactly $q(G-S)-|S|$.`,
      deps: ['graph-2.2.1a'], see: ['cplx-5.7'], refs: ['Diestel §2.2'], tags: ['matching', 'Tutte', 'blossoms'],
      viz(v) {
        const PRE = { bad: () => TUTTE_BAD(), pet: () => named('petersen'), k24: () => { const g = named('kmn', 2, 4); return g; } };
        const pre = v.select('', [{ value: 'bad', label: 'three odd pieces' }, { value: 'pet', label: 'Petersen' }, { value: 'k24', label: '$K_{2,4}$' }], 'bad', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: pre.value === 'bad' ? n.id : '' })), edges: P.edges }).layout(P.layout || 'none'); } });
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...TUTTE_BAD(), r: 14, editable: true });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 16) G.removeNode(obj.id); };
        const info = cacheBy((G) => {
          const H = ix(G), mate = maxMatching(H), size = matchSize(mate), td = H.n <= 16 ? tutteDeficiency(H) : null;
          const S = td ? new Set(bitsOf(td.small)) : new Set();
          return { H, mate, size, td, S, cs: compsMinus(H, S), M: mEdges(H, mate) };
        });
        v.render(() => {
          const I = info(G), perfect = 2 * I.size === I.H.n, Sid = new Set([...I.S].map((u) => K(I.H.ids[u])));
          if (!perfect) blobs(v, s, G, I.cs.filter((c) => c.odd).map((c) => c.L.map((u) => I.H.ids[u])), 'red', 36, 0.16);
          G.draw({ nodeFill: (id) => (!perfect && Sid.has(K(id)) ? 'gold' : null), nodeRing: (id) => (!perfect && I.mate[I.H.at(id)] < 0 ? 'red' : null),
            edgeColor: (e) => (I.M.has(e) ? (perfect ? 'green' : 'accent') : null), edgeWidth: (e) => (I.M.has(e) ? 4.5 : null) });
          s.corner(perfect ? '1-factor found' : 'no 1-factor: a bad set', 'tl', { color: perfect ? 'green' : 'red', weight: 700 });
        });
        v.legend([['green', '1-factor'], ['gold', 'bad set $S$', { dot: true }], ['red', 'odd components / unmatched', { area: true }], ['accent', 'maximum matching']]);
        v.readout(() => {
          const I = info(G), n = I.H.n, perfect = 2 * I.size === n;
          if (!I.td) return `$|G| = ${n}$ is too large for the brute-force check · maximum matching ${I.size}`;
          if (perfect) return `1-factor with ${I.size} edges ✓ · brute force: all $2^{${n}}$ sets $S$ satisfy $q(G-S)\\le|S|$ (max of $q(G-S)-|S|$ is ${I.td.def})`;
          const q = I.cs.filter((c) => c.odd).length;
          return `$S = \\{${[...I.S].map((u) => G.lab(I.H.ids[u])).join(', ')}\\}$: $q(G-S) = ${q} > ${I.S.size} = |S|$ · deficiency $${q - I.S.size}$ = ${n - 2 * I.size} unmatched vertices of a maximum matching (${I.size} edges, Edmonds) ✓`;
        });
      },
    },
    {
      num: '2.2.2', kind: 'Corollary', name: 'Petersen: bridgeless cubic graphs have a 1-factor', credit: 'Petersen, 1891',
      statement: String.raw`Every bridgeless cubic graph has a 1-factor.`,
      idea: String.raw`We check Tutte's condition (2.2.1). Let $S\subseteq V$ and let $C$ be an odd component of $G-S$. The degrees in $C$ sum to $3|C|$, an odd number, while the edges inside $C$ contribute an even amount; so an odd number of edges joins $C$ to $S$. One edge would be a bridge, hence there are at least three. Thus at least $3q(G-S)$ edges leave $S$, and at most $3|S|$ can, since $G$ is cubic: $q(G-S)\le|S|$.`,
      caption: String.raw`Click vertices to choose $S$ (gold). Each odd component of $G-S$ is shaded and labelled with the number of edges it sends to $S$ — always odd, and at least 3 when there is no bridge. The readout checks $3q(G-S)\le e(S,G-S)\le3|S|$. The last example is cubic but has three bridges (red): with $S$ its centre, the three odd pieces each send only one edge, and indeed it has no 1-factor.`,
      deps: ['graph-2.2.1', 'graph-1.4.1b'], refs: ['Diestel §2.2'], tags: ['matching', 'cubic graphs'],
      viz(v) {
        let seed = 4;
        const rc = () => { for (let t = 0; t < 60; t++) { const r = v.rng(seed * 97 + t), E = randomCubic(12, r); if (!E) continue; const H = ix({ nodes: [...Array(12).keys()].map((i) => ({ id: i })), edges: E }); if (comps(H).k === 1 && !bridges(H).size) { const P = named('cycle', 12); return { nodes: P.nodes, edges: E, layout: 'force' }; } } return named('prism', 6); };
        const PRE = { pet: () => ({ g: named('petersen'), S: [1, 2, 4, 5] }), prism: () => ({ g: named('prism', 5), S: [1, 2, 4, 5] }), rand: () => ({ g: rc(), S: [0, 1] }), syl: () => ({ g: sylvester(), S: [0] }) };
        const pre = v.select('', [{ value: 'pet', label: 'Petersen' }, { value: 'prism', label: 'prism' }, { value: 'rand', label: 'random' }, { value: 'syl', label: 'with bridges' }], 'pet', { onChange: () => load() });
        v.button('New random', () => { seed++; pre.value = 'rand'; load(); });
        const showM = v.toggle('show a 1-factor', false);
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.15, 1.2], axes: false, equal: true, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12 });
        let S = new Set();
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.g.nodes.map((n) => ({ ...n, label: '' })), edges: P.g.edges, seed: 3 }).layout(P.g.layout || 'fit'); S = new Set(P.S.map(K)); }
        load();
        G.onClick = ({ node }) => { if (node) { const k = K(node.id); if (S.has(k)) S.delete(k); else S.add(k); } return true; };
        const info = cacheBy((G) => { const H = ix(G), mate = maxMatching(H); return { H, br: eset(H, bridges(H)), M: mEdges(H, mate), perfect: 2 * matchSize(mate) === H.n }; });
        const stats = () => {
          const I = info(G), H = I.H, Si = idxSet(H, S), cs = compsMinus(H, Si).filter((c) => c.odd);
          const cut = cs.map((c) => { const inC = new Set(c.L); return H.E.filter(([a, b]) => (inC.has(a) && Si.has(b)) || (inC.has(b) && Si.has(a))).length; });
          const tot = H.E.filter(([a, b]) => Si.has(a) !== Si.has(b)).length;
          return { I, H, Si, cs, cut, tot };
        };
        v.render(() => {
          const { I, H, cs, cut } = stats();
          blobs(v, s, G, cs.map((c) => c.L.map((u) => H.ids[u])), (i) => (cut[i] >= 3 ? 'orange' : 'red'), 34, 0.18);
          const toS = (e) => S.has(K(e.from)) !== S.has(K(e.to));
          G.draw({ nodeFill: (id) => (S.has(K(id)) ? 'gold' : null), edgeColor: (e) => (I.br.has(e) ? 'red' : showM.value && I.M.has(e) ? 'green' : toS(e) ? 'orange' : null),
            edgeWidth: (e) => (I.br.has(e) ? 4 : showM.value && I.M.has(e) ? 4.5 : toS(e) ? 2.6 : null) });
          cs.forEach((c, i) => { const P = c.L.map((u) => G.node(H.ids[u])), cx = P.reduce((a, n) => a + n.x, 0) / P.length, cy = P.reduce((a, n) => a + n.y, 0) / P.length; s.text(String(cut[i]), cx, cy, { dy: c.L.length === 1 ? -25 : 0, align: 'center', size: 15, weight: 800, color: cut[i] >= 3 ? 'orange' : 'red', plate: true }); });
        });
        v.legend([['gold', '$S$', { dot: true }], ['orange', 'odd component and its edges to $S$', { area: true }], ['red', 'bridge'], ['green', '1-factor']]);
        v.readout(() => {
          const { I, cs, cut, tot } = stats(), q = cs.length;
          const ok = 3 * q <= tot && tot <= 3 * S.size;
          return `${I.br.size ? `**${I.br.size} bridges**` : 'bridgeless'} · $q(G-S) = ${q}$, $|S| = ${S.size}$ · edges from odd components to $S$: ${cut.join(', ') || '—'} · $e(S, G-S) = ${tot}$: ${I.br.size && cut.some((c) => c < 3) ? `an odd piece sends a single edge (a bridge), so the count fails` : ok ? `$3q = ${3 * q}\\le ${tot}\\le ${3 * S.size} = 3|S|$ ✓` : `$${tot} \\le ${3 * S.size} = 3|S|$`} · ${I.perfect ? '1-factor exists ✓' : '**no 1-factor**'}`;
        });
      },
    },
    {
      num: '2.2.2a', kind: 'Definition', name: 'Factor-critical graphs and matchable sets', verify: true,
      statement: String.raw`A non-empty graph $G$ is **factor-critical** if $G$ has no 1-factor but $G-v$ has a 1-factor for every vertex $v$. A set $S\subseteq V(G)$ is **matchable** to $\mathcal C_{G-S}$ if the bipartite graph $G_S$ — obtained from $G$ by contracting every component of $G-S$ to a single vertex and deleting the edges inside $S$, so that $s\in S$ is joined to a component $C$ when $s$ has a neighbour in $C$ — contains a matching of $S$.`,
      idea: String.raw`A factor-critical graph has odd order (its vertex-deleted subgraphs have 1-factors), and it is "as close as possible" to having a 1-factor: whichever vertex is left out, the rest pairs up. Odd cycles, complete graphs of odd order and the Petersen graph minus a vertex are examples; Edmonds' blossoms are factor-critical too. Matchability says that the vertices of $S$ can be sent to distinct components of $G-S$ — the configuration that the Gallai–Edmonds theorem (2.2.3) produces.`,
      caption: String.raw`**Factor-critical**: click a vertex to delete it; a 1-factor of the rest appears (green), or the vertex it fails for is reported. The table records the test for every vertex. The path $P^5$ fails. **Matchable**: click vertices to form $S$; the right panel shows $G_S$ with a maximum matching of $S$, and orange rings mark a Hall violator when $S$ is not matchable.`,
      deps: ['graph-2.2.1a'], refs: ['Diestel §2.2'], tags: ['matching', 'factor-critical'],
      viz(v) {
        const petv = () => { const P = named('petersen'); return { nodes: P.nodes.filter((n) => n.id !== 0), edges: P.edges.filter(([a, b]) => a !== 0 && b !== 0), layout: 'fit' }; };
        const bow = () => ({ nodes: [{ id: 0, x: 0, y: 0 }, { id: 1, x: -1.2, y: 0.7 }, { id: 2, x: -1.2, y: -0.7 }, { id: 3, x: 1.2, y: 0.7 }, { id: 4, x: 1.2, y: -0.7 }], edges: [[0, 1], [0, 2], [1, 2], [0, 3], [0, 4], [3, 4]], layout: 'fit' });
        const p5 = () => ({ nodes: [0, 1, 2, 3, 4].map((i) => ({ id: i, x: i, y: 0.25 * (i % 2) })), edges: [[0, 1], [1, 2], [2, 3], [3, 4]], layout: 'fit' });
        const PRE = { c7: () => named('cycle', 7), petv, bow, p5, tut: () => TUTTE_BAD() };
        const mode = v.select('', [{ value: 'fc', label: 'factor-critical' }, { value: 'ms', label: 'matchable $S$' }], 'fc', { onChange: () => load() });
        const pre = v.select('', [{ value: 'c7', label: '$C^7$' }, { value: 'petv', label: 'Petersen − v' }, { value: 'bow', label: 'bow-tie' }, { value: 'p5', label: '$P^5$' }, { value: 'tut', label: 'three pieces' }], 'petv', { onChange: () => load() });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 320, title: '$G$' });
        const R = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, height: 320, title: 'test' });
        const G = v.graph(L, { nodes: [], edges: [], r: 13 });
        const GS = v.graph(R, { nodes: [], edges: [], r: 13, draggable: false, fontSize: 11.5 });
        const T = v.table(R, { rows: 1, cols: 1, maxCell: 50, size: 17, region: [0, 1.6, 10, 6.4] });
        let del = null, S = new Set();
        function load() {
          const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: pre.value === 'tut' ? n.id : String(G.nodes.length >= 0 ? (typeof n.id === 'number' ? n.id + 1 : n.id) : '') })), edges: P.edges }).layout(P.layout === 'none' ? 'fit' : P.layout || 'fit');
          del = G.nodes[0].id; const v0 = G.nodes[0].id; S = new Set(pre.value === 'tut' ? ['s'] : G.edges.filter((e) => K(e.from) === K(v0) || K(e.to) === K(v0)).map((e) => K(K(e.from) === K(v0) ? e.to : e.from)));
          R.setTitle(mode.value === 'fc' ? 'does $G-v$ have a 1-factor?' : '$G_S$: $S$ against the components of $G-S$');
        }
        load();
        G.onClick = ({ node }) => { if (!node) return true; if (mode.value === 'fc') del = node.id; else { const k = K(node.id); if (S.has(k)) S.delete(k); else S.add(k); } return true; };
        R.onClick((x, y) => { if (mode.value !== 'fc') return; const c = T.hit(x, y); if (c && c.j >= 0) del = G.nodes[c.j].id; });
        const fc = cacheBy((G) => { const H = ix(G); return { H, res: H.ids.map((id, v0) => { const mate = maxMatchingOn(H, (u) => u !== v0); return { mate, ok: H.ids.every((_, u) => u === v0 || mate[u] >= 0) }; }) }; });
        v.render(() => {
          if (mode.value === 'fc') {
            const { H, res } = fc(G), d = H.at(del), r = res[d] || res[0];
            G.draw({ nodeFill: (id) => (K(id) === K(del) ? 'faint' : null), nodeRing: (id) => (K(id) !== K(del) && r.mate[H.at(id)] < 0 ? 'red' : null),
              edgeColor: (e) => (K(e.from) === K(del) || K(e.to) === K(del) ? 'faint' : r.mate[H.at(e.from)] === H.at(e.to) ? 'green' : null),
              edgeWidth: (e) => (r.mate[H.at(e.from)] === H.at(e.to) ? 4.5 : null), edgeDash: (e) => K(e.from) === K(del) || K(e.to) === K(del) });
            const n = H.n, cols = Math.min(n, 10);
            T.draw({ rows: Math.ceil(n / cols), cols, colLabels: null, value: (i, j) => { const k = i * cols + j; return k < n ? (res[k].ok ? '✓' : '✗') : null; },
              rowLabels: null, sub: (i, j) => { const k = i * cols + j; return k < n ? G.lab(H.ids[k]) : null; }, subSize: 11,
              fill: (i, j) => { const k = i * cols + j; return k < n ? [res[k].ok ? 'green' : 'red', 0.25] : null; }, highlight: [[Math.floor(d / cols), d % cols]], textColor: (i, j) => (res[i * cols + j] && res[i * cols + j].ok ? 'green' : 'red') });
            R.text(`deleted: ${G.lab(del)} — ${r.ok ? 'the rest has a 1-factor' : 'the rest has none'}`, 5, 1.1, { align: 'center', size: 13.5, weight: 600, color: r.ok ? 'green' : 'red' });
            R.text('(click a cell or a vertex to test it)', 5, 0.45, { align: 'center', size: 11.5, color: 'muted' });
          } else {
            const H = ix(G), Si = idxSet(H, S), I = gsInfo(H, Si);
            blobs(v, L, G, I.cl.map((Lc) => Lc.map((u) => H.ids[u])), (i) => (I.cl[i].length % 2 ? 'red' : 'blue'), 34, 0.16);
            G.draw({ nodeFill: (id) => (S.has(K(id)) ? 'gold' : null), edgeColor: (e) => (S.has(K(e.from)) && S.has(K(e.to)) ? 'faint' : null), edgeDash: (e) => S.has(K(e.from)) && S.has(K(e.to)) });
            drawGS(GS, H, G, I);
          }
        });
        v.legend([['green', '1-factor of $G-v$ / matching in $G_S$'], ['red', 'unmatched vertex / odd component', { dot: true }], ['gold', '$S$', { dot: true }], ['orange', 'Hall violator in $G_S$', { dot: true }]]);
        v.readout(() => {
          if (mode.value === 'fc') {
            const { H, res } = fc(G), good = res.filter((x) => x.ok).length, n = H.n;
            const fcOk = good === n && n % 2 === 1;
            return `$|G| = ${n}$ ${n % 2 ? '(odd: no 1-factor)' : '(even)'} · $G - v$ has a 1-factor for ${good} of ${n} vertices · ${fcOk ? '**factor-critical** ✓' : 'not factor-critical'}`;
          }
          const H = ix(G), I = gsInfo(H, idxSet(H, S));
          const fcs = I.cl.map((Lc) => fcCheck(H, Lc).ok);
          return `$|S| = ${S.size}$, $|\\mathcal C_{G-S}| = ${I.cl.length}$ · ${I.matchable ? '**$S$ is matchable** to $\\mathcal C_{G-S}$ ✓' : `not matchable: ${I.viol.S.length} vertices of $S$ see only ${I.viol.C.length} component(s)`} · factor-critical components: ${fcs.filter(Boolean).length} of ${I.cl.length}`;
        });
      },
    },
    {
      num: '2.2.3', kind: 'Theorem', name: 'Gallai–Edmonds structure theorem', credit: 'Gallai, 1964; Edmonds, 1965',
      statement: String.raw`Every graph $G$ has a set $S\subseteq V(G)$ such that
(i) $S$ is matchable to $\mathcal C_{G-S}$, and
(ii) every component of $G-S$ is factor-critical.
For any such $S$, $G$ has a 1-factor if and only if $|S|=|\mathcal C_{G-S}|$. Moreover, as (i) and (ii) imply, every maximum matching consists of $|S|$ edges from $S$ to distinct components of $G-S$ and of near-perfect matchings of all these components, so it has $|S|+\frac12\bigl(|V|-|S|-|\mathcal C_{G-S}|\bigr)$ edges.`,
      idea: String.raw`Induction on $|G|$. Choose $S$ to maximise the deficiency $d(S)=q(G-S)-|S|$, and among such sets take a largest. If a component $C$ were even, adding one of its vertices to $S$ would not lower $d$, contradicting the maximality of $|S|$; if some $C-c$ had no 1-factor, Tutte's theorem for $C-c$ (by induction) and a parity argument would give a larger deficiency. If $S$ were not matchable, Hall's theorem (2.1.2) would give $S'\subseteq S$ seeing fewer than $|S'|$ components, and $S\setminus S'$ would have larger deficiency. Counting edges of any matching against $S$ and the odd components then gives the formula for maximum matchings.`,
      caption: String.raw`The app finds $S$ as in the proof — a largest set maximising $q(G-S)-|S|$, by brute force — and shows it in gold, the components of $G-S$ shaded (each tested for factor-criticality), and $G_S$ on the right with a matching of $S$. The green matching $M_0$ is assembled from that matching and near-perfect matchings of the components; the readout checks its size against Edmonds' algorithm. Edit the graph (${EDIT}).`,
      deps: ['graph-2.2.2a', 'graph-2.1.2'], refs: ['Diestel §2.2'], tags: ['matching', 'structure'],
      viz(v) {
        const tree = () => fixed({ a: [1.0, 5.4], b: [2.6, 4.2], c: [1.0, 3.0], d: [4.4, 4.6], e: [5.6, 5.8], f: [6.0, 3.4], g: [7.8, 4.6], h: [8.8, 5.9], i: [8.9, 3.0], j: [3.4, 1.4], k: [5.2, 1.6], l: [7.4, 1.2] }, 'ab bc bd de df fg gh gi dj fk kl');
        const mix = () => fixed({ a: [1.0, 5.4], b: [2.4, 5.9], c: [1.6, 4.0], s: [3.6, 4.4], t: [6.2, 4.4], d: [5.0, 5.9], e: [8.0, 5.6], f: [8.9, 4.2], g: [7.6, 3.2], h: [2.2, 1.6], i: [4.2, 1.0], j: [6.0, 1.6], k: [8.0, 1.2] }, 'ab bc ac as bs sd td te tf tg ef fg eg sh hi ij it jk tk');
        const PRE = { mix, tree, bad: () => TUTTE_BAD() };
        const pre = v.select('', [{ value: 'mix', label: 'mixed' }, { value: 'tree', label: 'a tree' }, { value: 'bad', label: 'three pieces' }], 'mix', { onChange: () => { const P = PRE[pre.value](); G.set({ nodes: P.nodes, edges: P.edges }); } });
        const L = gstage(v, { height: 330, title: '$G$, $S$ and $\\mathcal C_{G-S}$' });
        const R = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, height: 330, title: '$G_S$', minWidth: 220, weight: 0.7 });
        const G = v.graph(L, { ...mix(), r: 14, editable: true });
        const GS = v.graph(R, { nodes: [], edges: [], r: 13, draggable: false, fontSize: 11.5 });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 15) G.removeNode(obj.id); };
        const info = cacheBy((G) => {
          const H = ix(G); if (H.n > 15) return null;
          const td = tutteDeficiency(H), Si = new Set(bitsOf(td.large)), I = gsInfo(H, Si), fcs = I.cl.map((Lc) => fcCheck(H, Lc));
          const mate = new Int32Array(H.n).fill(-1), root = new Array(I.cl.length).fill(-1);
          I.Sa.forEach((sv, i) => { const c = I.mate[i] - I.nS; if (I.mate[i] < 0) return; const w = H.adj[sv].map(([x]) => x).find((x) => I.comp[x] === c); mate[sv] = w; mate[w] = sv; root[c] = w; });
          I.cl.forEach((Lc, c) => { const r = root[c] >= 0 ? root[c] : Lc[0], inC = new Set(Lc), m = maxMatchingOn(H, (u) => inC.has(u) && u !== r); for (const u of Lc) if (m[u] >= 0) mate[u] = m[u]; });
          return { H, td, Si, I, fcs, M0: mEdges(H, mate), m0: matchSize(mate), nu: matchSize(maxMatching(H)) };
        });
        v.render(() => {
          const X = info(G); if (!X) { L.corner('at most 15 vertices for the brute-force search', 'tl', { color: 'red' }); G.draw(); return; }
          const { H, I, fcs } = X, Sid = new Set([...X.Si].map((u) => K(H.ids[u])));
          blobs(v, L, G, I.cl.map((Lc) => Lc.map((u) => H.ids[u])), (i) => CC[i % 5], 36, 0.2);
          G.draw({ nodeFill: (id) => (Sid.has(K(id)) ? 'gold' : null), nodeRing: (id) => { const u = H.at(id); return !Sid.has(K(id)) && ![...X.M0].some((e) => K(e.from) === K(id) || K(e.to) === K(id)) ? 'red' : null; },
            edgeColor: (e) => (X.M0.has(e) ? 'green' : Sid.has(K(e.from)) && Sid.has(K(e.to)) ? 'faint' : null), edgeWidth: (e) => (X.M0.has(e) ? 4.5 : null) });
          drawGS(GS, H, G, I, { compColor: (j) => CC[j % 5] });
          I.cl.forEach((Lc, c) => { if (!fcs[c].ok) { const P = Lc.map((u) => G.node(H.ids[u])); L.text('not f.-c.', P[0].x, P[0].y, { dy: -22, color: 'red', size: 11, align: 'center' }); } });
        });
        v.legend([['gold', '$S$', { dot: true }], ['green', 'maximum matching $M_0$ / matching of $S$ in $G_S$'], ['red', 'unmatched by $M_0$', { dot: true }]]);
        v.readout(() => {
          const X = info(G); if (!X) return '';
          const { H, I, fcs } = X, nC = I.cl.length, nS = I.nS, pred = nS + (H.n - nS - nC) / 2;
          return `$S = \\{${I.Sa.map((u) => G.lab(H.ids[u])).join(', ')}\\}$ (deficiency $q(G-S)-|S| = ${X.td.def}$) · (i) ${I.matchable ? 'matchable ✓' : 'not matchable ✗'} · (ii) ${fcs.filter((f) => f.ok).length} of ${nC} components factor-critical${fcs.every((f) => f.ok) ? ' ✓' : ' ✗'} · $|M_0| = ${nS} + \\tfrac12(${H.n} - ${nS} - ${nC}) = ${pred}$, Edmonds: $\\nu = ${X.nu}$ ${pred === X.nu ? '✓' : '✗'} · ${nS === nC ? '$|S| = |\\mathcal C_{G-S}|$: **1-factor**' : `$|S| < |\\mathcal C_{G-S}|$: no 1-factor`}`;
        });
      },
    },
  ],
};
