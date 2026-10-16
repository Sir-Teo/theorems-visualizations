// Graph Theory (Diestel) — Chapter 3: Connectivity, part b (§§3.3–3.5: Menger's theorem, A-paths and Mader's theorem, linkages)
import {
  K, ix, comps, bfs, blob, PALETTE, named, fit, gstage, EDIT, cacheBy, popc, bitsOf, squareMark, pathEdges, parPath,
  menger, bruteSep, edgeMenger, indepPaths, greedyPaths, kappa, lambda, amask, hasABPath, maxAPaths, minAHit, hPaths,
  linkPairs, kLinked, findTK, gnp, ixOf, minCostPaths, kappaFast, wheel, sub, combos,
} from './ch03.shared.js';

// ---------- local helpers ----------
const PC = ['orange', 'purple', 'pink', 'teal', 'gold', 'blue', 'green'];
const ROLEFILL = { A: 'blue', B: 'green', AB: 'purple' };
const NEXTROLE = { A: 'B', B: 'AB', AB: null };
function load(G, spec) { G.set({ nodes: spec.nodes.map((n) => ({ ...n })), edges: spec.edges.map((e) => (Array.isArray(e) ? [e[0], e[1]] : [e.from, e.to])) }); G.layout(spec.layout || 'none'); }
/** Map kit edge object → index of the path (vertex lists of H) it lies on. */
function pathMap(H, paths) { const M = new Map(); paths.forEach((p, i) => pathEdges(H, p).forEach((k) => M.set(H.E[k][2], i))); return M; }
/** Draw an alternating walk as arrows beside the edges: forward steps gold, steps backwards along path edges red and dashed. */
function drawWalk(s, G, H, walk, o = {}) {
  const sc = s.X(1) - s.X(0), rr = (o.r ?? 13) / sc, off = (o.off ?? 6) / sc;
  for (let i = 0; i + 1 < walk.length; i++) {
    const p = G.node(H.ids[walk[i].v]), q = G.node(H.ids[walk[i + 1].v]), back = walk[i + 1].back;
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy); if (L < 1e-9) continue;
    const ux = dx / L, uy = dy / L, nx = -uy * off, ny = ux * off;
    s.arrow(p.x + ux * rr + nx, p.y + uy * rr + ny, q.x - ux * rr + nx, q.y - uy * rr + ny, { color: back ? 'red' : 'gold', width: 3, head: 10, dash: back ? [5, 4] : null });
  }
}
/** Columns layout helper: P = {id: [x, y]} in data units of gstage. */
const F = (P, E) => ({ ...fit(P, E), layout: 'none' });
/** Index lists of the vertices with a role. */
function roleIdx(H, role) {
  const A = [], B = [];
  for (const [id, r] of role) { const u = H.at(id); if (u == null) continue; if (r === 'A' || r === 'AB') A.push(u); if (r === 'B' || r === 'AB') B.push(u); }
  return { A, B };
}
/** A–B path in G − X (vertex list) or null. */
function abPathAvoiding(H, A, B, X) {
  const xs = new Set(X), inB = new Set(B), par = new Int32Array(H.n).fill(-2), q = [];
  for (const a of A) if (!xs.has(a)) { par[a] = -1; q.push(a); }
  for (let i = 0; i < q.length; i++) { const u = q[i]; if (inB.has(u)) { const p = []; for (let x = u; x !== -1; x = par[x]) p.push(x); return p.reverse(); } for (const [w] of H.adj[u]) if (par[w] === -2 && !xs.has(w)) { par[w] = u; q.push(w); } }
  return null;
}
const MENG = () => F({ a1: [0.6, 5.7], a2: [0.6, 4.0], a3: [0.6, 2.4], a4: [0.6, 0.7], c1: [3.2, 5.1], c2: [3.2, 3.2], c3: [3.2, 1.3], d1: [6.6, 5.7], d2: [6.6, 4.0], d3: [6.6, 2.4], d4: [6.6, 0.7], b1: [9.4, 5.7], b2: [9.4, 4.0], b3: [9.4, 2.4], b4: [9.4, 0.7] },
  'a1c1 a1c2 a1c3 a2c1 a3c1 a3c2 a3c3 a4c2 c1d2 c1d3 c2d1 c2d2 c2d3 c2d4 c3d1 c3d2 d1b3 d2b1 d2b2 d2b4 d3b2 d3b3 d4b2 d4b4 d1d2 d2d3'.split(' ').map((p) => [p.slice(0, 2), p.slice(2)]));
const LADDER = () => F({ a1: [0.7, 5.6], a2: [0.7, 3.2], a3: [0.7, 0.8], p1: [3.4, 5.6], p2: [3.4, 3.2], p3: [3.4, 0.8], q1: [6.6, 5.6], q2: [6.6, 3.2], q3: [6.6, 0.8], b1: [9.3, 5.6], b2: [9.3, 3.2], b3: [9.3, 0.8] },
  'a1p1 a1p2 a2p2 a3p2 a3p3 p1q1 p1q2 p2q1 p2q2 p2q3 p3q3 q1b1 q2b1 q2b2 q2b3 q3b3'.split(' ').map((p) => [p.slice(0, 2), p.slice(2)]));
const SEP3 = () => F({ a1: [1.2, 5.9], a2: [3.8, 5.9], a3: [6.2, 5.9], a4: [8.8, 5.9], c1: [2.4, 4.1], c2: [5.0, 4.1], c3: [7.6, 4.1], d1: [1.2, 2.3], d2: [3.8, 2.3], d3: [6.2, 2.3], d4: [8.8, 2.3], b1: [1.2, 0.5], b2: [3.8, 0.5], b3: [6.2, 0.5], b4: [8.8, 0.5] },
  'a1c1 a1c3 a2c1 a3c1 a3c2 a3c3 a4c2 c1d1 c1d3 c1d4 c2d1 c2d3 c3d1 c3d2 d1b4 d2b1 d2b2 d3b2 d4b2 d4b3 d4b4 c1c2 d1d2'.split(' ').map((p) => [p.slice(0, 2), p.slice(2)]));
const FANG = () => F({ a: [0.9, 3.2], n1: [2.6, 5.5], n2: [2.6, 4.0], n3: [2.6, 2.4], n4: [2.6, 0.9], m1: [4.7, 5.8], m2: [4.7, 4.2], m3: [4.7, 2.2], m4: [4.7, 0.6], o1: [6.8, 4.8], o2: [6.8, 1.6], b1: [9.0, 5.7], b2: [9.3, 4.0], b3: [9.3, 2.4], b4: [9.0, 0.7] },
  'a n1,a n2,a n3,a n4,n1 m1,n2 m2,n2 m1,n3 m2,n3 m3,n4 m4,m1 o1,m2 o1,m3 o2,m4 o2,m2 m3,o1 b1,o1 b2,o2 b3,o2 b4,m3 b3,n1 n2'.split(',').map((p) => p.split(' ')));
const GRID = () => {
  const P = {}, E = [], L = 'abcdefghijklmno';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) P[L[5 * i + j]] = [1.0 + 2.0 * j, 5.6 - 2.4 * i];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) { const u = L[5 * i + j]; if (j < 4) E.push([u, L[5 * i + j + 1]]); if (i < 2) E.push([u, L[5 * (i + 1) + j]]); }
  E.push(['a', 'g'], ['g', 'm'], ['c', 'i'], ['i', 'o'], ['h', 'n'], ['b', 'h']);
  return F(P, E);
};
const TWOK4 = () => F({ a: [1.0, 5.4], b: [1.0, 1.0], c: [3.2, 3.2], d: [1.9, 3.2], x: [5.0, 3.2], e: [7.0, 5.4], f: [7.0, 1.0], g: [9.0, 3.2] }, 'ab ac ad bc bd cd cx dx? '.replace('dx? ', '').trim() + ' xe xf xg ef eg fg');

export default {
  collection: 'graph',
  chapter: 3,
  items: [
    // ================================================================== 3.3 Menger's theorem
    {
      num: '3.3.1', kind: 'Theorem', name: 'Menger’s theorem', credit: 'Menger, 1927',
      statement: String.raw`Let $G=(V,E)$ be a graph and $A,B\subseteq V$. The least number of vertices separating $A$ from $B$ in $G$ equals the greatest number of disjoint $A$–$B$ paths in $G$.`,
      idea: String.raw`Disjoint paths each need their own separator vertex, so "$\ge$" is clear; the work is to find $k=k(G,A,B)$ disjoint paths. Diestel gives three proofs: by induction on $\|G\|$, contracting or deleting an edge (Halin); by induction on the number of path vertices (Böhme, Göring and Harant); and by alternating walks (Grünwald, later Gallai), shown here. Start with any set $\mathcal P$ of disjoint $A$–$B$ paths. If an alternating walk — one that may run backwards along edges of the paths — leads from an unused vertex of $A$ to an unused vertex of $B$, it yields a larger path system (Lemma 3.3.2). If none does, the last vertices of the paths reached by such walks form an $A$–$B$ separator lying on $\mathcal P$ (Lemma 3.3.3), so $|\mathcal P|\ge k$. On a bipartite graph this is König's theorem 2.1.1.`,
      caption: String.raw`Step through the third proof: each alternating walk is drawn as arrows — gold where it uses a new edge, red and dashed where it runs backwards along a path — and then the paths of $E[\mathcal P]\,\triangle\,E(W)$ replace $\mathcal P$. At the end, the vertices reached by alternating walks are shaded gold and the separator $X$ on the paths is boxed in red. Click a vertex to cycle its role (none → $A$ → $B$ → both); shift-drag between vertices adds an edge, Alt-click deletes, click empty space for a new vertex. The readout compares with a brute-force minimum separator.`,
      deps: ['graph-1.4.1b', 'graph-1.3.1a'], see: ['algo-11.13', 'graph-2.1.1'], refs: ['Diestel §3.3'], tags: ['Menger', 'disjoint paths', 'separators'],
      viz(v) {
        const s = gstage(v, { height: 340, x: [0, 10], y: [0.15, 6.3] });
        const G = v.graph(s, { ...MENG(), r: 13, editable: true });
        const role = new Map(); ['a1', 'a2', 'a3', 'a4'].forEach((x) => role.set(x, 'A')); ['b1', 'b2', 'b3', 'b4'].forEach((x) => role.set(x, 'B'));
        G.onClick = ({ node, alt }) => { if (alt || !node) return false; const r = role.get(K(node.id)), nx = r ? NEXTROLE[r] : 'A'; nx ? role.set(K(node.id), nx) : role.delete(K(node.id)); S.reset({ at: 'end' }); return true; };
        const code = ['𝒫 ← ∅', 'while an alternating walk W runs from A ∖ V[𝒫] to B ∖ V[𝒫]:', '   𝒫 ← the A–B paths in E[𝒫] △ E(W)      ▷ Lemma 3.3.2', 'X ← on each P ∈ 𝒫 the last vertex reached by a walk   ▷ Lemma 3.3.3', 'return 𝒫, X        ▷ |𝒫| = |X|'];
        function frames() {
          const H = ix(G), { A, B } = roleIdx(H, role), L = (u) => G.lab(H.ids[u]);
          if (!A.length || !B.length) return [{ H, P: [], line: 1, note: 'Mark at least one vertex of $A$ and one of $B$ (click a vertex to cycle its role).' }];
          const r = menger(H, A, B, { events: true }), out = [{ H, P: [], line: 1, note: 'Start with no paths: $\\mathcal P = \\emptyset$.' }];
          for (const e of r.events) {
            if (e.type === 'walk') {
              const nb = e.walk.filter((w) => w.back).length, w0 = e.walk[0].v, w1 = e.walk[e.walk.length - 1].v;
              out.push({ H, P: e.before, walk: e.walk, line: 2, note: e.walk.length === 1 ? `${L(w0)} lies in $A\\cap B$: a trivial path.` : `An alternating walk from ${L(w0)} to ${L(w1)}${nb ? `, running backwards along ${nb} path edge${nb > 1 ? 's' : ''} (red)` : ''}.` });
              out.push({ H, P: e.after, line: 3, note: `$\\mathcal P$ := the $A$–$B$ paths in $E[\\mathcal P]\\,\\triangle\\,E(W)$ — now ${e.after.length} disjoint path${e.after.length === 1 ? '' : 's'}.` });
            } else out.push({ H, P: e.paths, reach: e.reach, sep: e.sep, line: [4, 5], note: `No alternating walk reaches $B\\setminus V[\\mathcal P]$. The last vertex reached on each path gives $X = \\{${e.sep.map(L).join(', ')}\\}$, an $A$–$B$ separator on $\\mathcal P$: $|X| = |\\mathcal P| = ${e.paths.length}$.` });
          }
          return out;
        }
        const S = v.steps({ frames, code, codeTitle: 'Menger by alternating walks', speed: 1, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.H || f.H.n !== G.nodes.length) return; const H = f.H;
          if (f.reach) blob(s, [...f.reach.keys()].filter((u) => f.reach[u]).map((u) => { const n = G.node(H.ids[u]); return [n.x, n.y]; }), [], v.color('gold'), 36, 0.28);
          const pm = pathMap(H, f.P);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 5 : 1.5),
            nodeFill: (id) => ROLEFILL[role.get(K(id))] ?? null });
          if (f.walk) drawWalk(s, G, H, f.walk);
          if (f.sep) for (const u of f.sep) squareMark(s, G, H.ids[u], v.color('red'), 17, 2.8);
        });
        v.legend([['blue', '$A$', { dot: true }], ['green', '$B$', { dot: true }], ['orange', 'paths of $\\mathcal P$'], ['gold', 'walk: new edge'], ['red', 'walk: backwards / separator $X$', { dash: true }]]);
        v.readout(() => {
          const H = ix(G), { A, B } = roleIdx(H, role); if (!A.length || !B.length) return 'mark $A$ and $B$';
          const r = menger(H, A, B), bs = H.n <= 20 ? popc(bruteSep(H, A, B)) : null;
          return `**${r.paths.length} disjoint $A$–$B$ paths** · separator on them $|X| = ${r.sep.length}$ · minimum $A$–$B$ separator by brute force: ${bs ?? '—'} ${bs === r.paths.length && r.sep.length === bs ? '✓ equal' : bs == null ? '' : '✗'}`;
        });
      },
    },
    {
      num: '3.3.2', kind: 'Lemma', name: 'An alternating walk to B enlarges a set of A–B paths',
      statement: String.raw`Let $\mathcal P$ be a set of disjoint $A$–$B$ paths in $G$. A walk $W=x_0e_0x_1\dots e_{n-1}x_n$ with distinct edges **alternates** with respect to $\mathcal P$ if it starts in $A\setminus V[\mathcal P]$, traverses every edge of $E[\mathcal P]$ it uses backwards (against the direction of its path), visits vertices outside $V[\mathcal P]$ at most once, and enters and leaves each vertex of $V[\mathcal P]$ with at least one path edge. If such a walk ends in $B\setminus V[\mathcal P]$, then $G$ contains a set of disjoint $A$–$B$ paths that **exceeds** $\mathcal P$: its ends in $A$ and its ends in $B$ properly contain those of $\mathcal P$, so it has at least $|\mathcal P|+1$ paths.`,
      idea: String.raw`Let $H$ be the graph on $V(G)$ whose edge set is the symmetric difference $E[\mathcal P]\,\triangle\,E(W)$. The rules for alternating walks make every vertex of $H$ have degree 0 or 2, except the ends of the paths of $\mathcal P$ and of $W$, which have degree 1. So the components of $H$ starting at the old $A$-ends and at $x_0$ are paths, and by induction along them each edge is traversed forwards (with respect to $\mathcal P$ or $W$) — hence they are $A$–$B$ paths, one more than before, ending at all old $B$-ends and at $x_n$.`,
      caption: String.raw`Read the three panels left to right. (1) A maximal but not maximum system $\mathcal P$ (coloured) and an alternating walk $W$ from an unused $A$-vertex to an unused $B$-vertex — it enters a path and runs backwards along it (red dashes). (2) The symmetric difference $E[\mathcal P]\,\triangle\,E(W)$: every vertex has degree 0, 1 or 2 (numbers), and the degree-1 vertices are exactly the path ends. (3) Its components are $|\mathcal P|+1$ disjoint $A$–$B$ paths. **Another 𝒫** draws a new random maximal system.`,
      deps: ['graph-1.3.1a'], see: ['graph-3.3.1'], refs: ['Diestel §3.3'], tags: ['Menger', 'alternating walks'],
      viz(v) {
        const spec = LADDER(), nodes = spec.nodes.map((n) => ({ ...n }));
        const st = (title) => gstage(v, { height: 240, x: [0, 10], y: [0.1, 6.3], title, minWidth: 230 });
        const s1 = st('1. $\\mathcal P$ and an alternating walk $W$'), s2 = st('2. $E[\\mathcal P]\\,\\triangle\\,E(W)$'), s3 = st('3. $|\\mathcal P|+1$ disjoint paths');
        const mk = (s) => v.graph(s, { nodes, edges: spec.edges, r: 11, draggable: false, fontSize: 11 });
        const G1 = mk(s1), G2 = mk(s2), G3 = mk(s3);
        const A0 = ['a1', 'a2', 'a3'], B0 = ['b1', 'b2', 'b3'];
        let seed = 3, state = null;
        function make() {
          const H = ix(G1), A = A0.map((x) => H.at(x)), B = B0.map((x) => H.at(x)), max = menger(H, A, B).paths.length;
          let best = null;
          for (let t = 0; t < 80; t++) {
            const P = greedyPaths(H, A, B, v.rng(seed * 97 + t));
            if (P.length >= max) continue;
            const r = menger(H, A, B, { start: P, limit: 0 });
            if (!r.walk) continue;
            const cand = { P, walk: r.walk, Q: menger(H, A, B, { start: P, limit: 1 }).paths };
            if (r.walk.some((w) => w.back)) { best = cand; break; }
            best = best || cand;
          }
          if (!best) { const P = menger(H, A, B).paths.slice(1); const r = menger(H, A, B, { start: P, limit: 0 }); best = { P, walk: r.walk, Q: menger(H, A, B, { start: P, limit: 1 }).paths }; }
          state = { H, A, B, ...best };
        }
        make();
        v.button('Another 𝒫', () => { seed++; make(); });
        v.render(() => {
          const { H, P, walk, Q } = state, role = (id) => (A0.includes(K(id)) ? 'blue' : B0.includes(K(id)) ? 'green' : null);
          const pm = pathMap(H, P);
          G1.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e)] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : 1.3), nodeFill: role });
          drawWalk(s1, G1, H, walk, { r: 11, off: 5 });
          // symmetric difference
          const H2 = ix(G2), Wk = new Set(); for (let i = 0; i + 1 < walk.length; i++) { const k = pathEdges(H2, [walk[i].v, walk[i + 1].v])[0]; if (k != null) Wk.add(k); }
          const Pk = new Set(); P.forEach((p) => pathEdges(H2, p).forEach((k) => Pk.add(k)));
          const D = new Set([...Pk].filter((k) => !Wk.has(k)).concat([...Wk].filter((k) => !Pk.has(k))));
          const deg = new Array(H2.n).fill(0); for (const k of D) { deg[H2.E[k][0]]++; deg[H2.E[k][1]]++; }
          G2.draw({ edgeColor: (e) => { const k = H2.eix.get(e); return D.has(k) ? (Wk.has(k) ? 'gold' : 'ink') : Pk.has(k) && Wk.has(k) ? 'red' : 'faint'; },
            edgeWidth: (e) => { const k = H2.eix.get(e); return D.has(k) ? 4 : Pk.has(k) && Wk.has(k) ? 2 : 1; }, edgeDash: (e) => { const k = H2.eix.get(e); return Pk.has(k) && Wk.has(k); },
            nodeFill: role, nodeNote: (id) => { const d = deg[H2.at(id)]; return d ? String(d) : null; }, noteColor: 'ink' });
          const H3 = ix(G3), pm3 = pathMap(H3, Q);
          G3.draw({ edgeColor: (e) => (pm3.has(e) ? PC[pm3.get(e)] : null), edgeWidth: (e) => (pm3.has(e) ? 4.5 : 1.3), nodeFill: role });
        });
        v.legend([['orange', 'paths'], ['gold', '$W$: new edges'], ['red', '$W$ backwards: cancelled', { dash: true }], ['ink', 'kept path edges']]);
        v.readout(() => {
          const { H, P, Q, A, B } = state, L = (u) => G1.lab(H.ids[u]);
          const eA = (S) => S.map((p) => p[0]), eB = (S) => S.map((p) => p[p.length - 1]);
          const sup = (X, Y) => X.every((x) => Y.includes(x)) && Y.length > X.length;
          void A; void B;
          return `$|\\mathcal P| = ${P.length}$ → ${Q.length} paths · $A$-ends {${eA(P).map(L).join(', ')}} ⊊ {${eA(Q).map(L).join(', ')}} ${sup(eA(P), eA(Q)) ? '✓' : '✗'} · $B$-ends {${eB(P).map(L).join(', ')}} ⊊ {${eB(Q).map(L).join(', ')}} ${sup(eB(P), eB(Q)) ? '✓' : '✗'} — the new system exceeds $\\mathcal P$`;
        });
      },
    },
    {
      num: '3.3.3', kind: 'Lemma', name: 'Without such a walk there is an A–B separator on the paths',
      statement: String.raw`Let $\mathcal P$ be a set of disjoint $A$–$B$ paths in $G$. If no alternating walk (with respect to $\mathcal P$) ends in $B\setminus V[\mathcal P]$, then $G$ has an $A$–$B$ separator **on** $\mathcal P$: a set consisting of exactly one vertex from each path of $\mathcal P$.`,
      idea: String.raw`For each $P\in\mathcal P$ let $x_P$ be the last vertex of $P$ that lies on some alternating walk (or the first vertex of $P$ if there is none), and $X=\{x_P\}$. If an $A$–$B$ path $Q$ avoided $X$, take the last vertex $y$ of $Q$ on the initial segments $Px_P$; it lies strictly before $x_P$ on its path $P$, and an alternating walk $W$ ending at $x_P$ can be continued backwards along $P$ to $y$ and then along $Q$ to $B$. After trimming where it meets itself, this is an alternating walk ending in $B\setminus V[\mathcal P]$ — contrary to the assumption.`,
      caption: String.raw`With a maximum path system, the vertices reached by alternating walks are shaded gold and $X$ (red boxes) takes the last reached vertex of each path; the two sides of $G-X$ are tinted blue ($A$-side) and green. Click an edge of a path to drop that path from $\mathcal P$: now an alternating walk does reach $B\setminus V[\mathcal P]$ (arrows), the hypothesis fails, and the same recipe gives a set $X$ that does **not** separate — a red dashed $A$–$B$ path avoids it. **Reset** restores the maximum system.`,
      deps: ['graph-3.3.2'], see: ['graph-3.3.1'], refs: ['Diestel §3.3'], tags: ['Menger', 'separators'],
      viz(v) {
        const s = gstage(v, { height: 330, x: [0, 10], y: [-0.05, 6.45] });
        const G = v.graph(s, { ...SEP3(), r: 13, draggable: true });
        const A0 = ['a1', 'a2', 'a3', 'a4'], B0 = ['b1', 'b2', 'b3', 'b4'];
        const dropped = new Set();
        const base = cacheBy((G) => { const H = ix(G), A = A0.map((x) => H.at(x)), B = B0.map((x) => H.at(x)); return { H, A, B, Pmax: menger(H, A, B).paths }; });
        G.onClick = ({ edge }) => {
          if (!edge) return true; const I = base(G), k = I.H.eix.get(edge);
          const i = I.Pmax.findIndex((p) => pathEdges(I.H, p).includes(k)); if (i >= 0) dropped.has(i) ? dropped.delete(i) : dropped.add(i);
          return true;
        };
        v.button('Reset', () => dropped.clear());
        const calc = () => {
          const I = base(G), P = I.Pmax.filter((_, i) => !dropped.has(i));
          const r = menger(I.H, I.A, I.B, { start: P, limit: 0 });
          const X = r.sep ?? P.map((p) => { let x = p[0]; for (const u of p) if (r.reach[u]) x = u; return x; });
          return { ...I, P, r, X, leak: r.walk ? abPathAvoiding(I.H, I.A, I.B, X) : null };
        };
        v.render(() => {
          const c = calc(), { H } = c, xs = new Set(c.X);
          const side = comps(H, (u) => !xs.has(u)), aSide = new Set(); c.A.forEach((a) => { if (!xs.has(a)) aSide.add(side.comp[a]); });
          if (!c.r.walk) {
            const pts = (pred) => [...Array(H.n).keys()].filter((u) => !xs.has(u) && pred(u)).map((u) => { const n = G.node(H.ids[u]); return [n.x, n.y]; });
            blob(s, pts((u) => aSide.has(side.comp[u])), [], v.color('blue'), 44, 0.1);
            blob(s, pts((u) => !aSide.has(side.comp[u])), [], v.color('green'), 44, 0.1);
          }
          blob(s, [...c.r.reach.keys()].filter((u) => c.r.reach[u]).map((u) => { const n = G.node(H.ids[u]); return [n.x, n.y]; }), [], v.color('gold'), 32, 0.3);
          const pm = pathMap(H, c.P), leak = c.leak ? new Set(pathEdges(H, c.leak).map((k) => H.E[k][2])) : new Set();
          G.draw({ edgeColor: (e) => (leak.has(e) ? 'red' : pm.has(e) ? PC[pm.get(e)] : null), edgeWidth: (e) => (leak.has(e) ? 4 : pm.has(e) ? 5 : 1.5), edgeDash: (e) => leak.has(e),
            nodeFill: (id) => (A0.includes(K(id)) ? 'blue' : B0.includes(K(id)) ? 'green' : null) });
          if (c.r.walk) drawWalk(s, G, H, c.r.walk);
          for (const u of c.X) squareMark(s, G, H.ids[u], v.color('red'), 17, 2.8);
          s.corner(c.r.walk ? 'an alternating walk reaches B ∖ V[𝒫]: X does not separate' : 'no alternating walk reaches B ∖ V[𝒫]: X separates A from B', 'tl', { color: c.r.walk ? 'red' : 'green', weight: 700, size: 12.5, plate: true });
        });
        v.legend([['gold', 'on an alternating walk', { area: true }], ['red', '$X$ (boxed) / leaking path', { dash: true }], ['blue', '$A$-side of $G-X$', { area: true }], ['green', '$B$-side', { area: true }]]);
        v.readout(() => {
          const c = calc(), Am = amask(c.H), m = (L) => L.reduce((q, u) => q | (1 << u), 0), sepOK = !hasABPath(Am, m(c.A), m(c.B), m(c.X), (1 << c.H.n) - 1);
          return `$|\\mathcal P| = ${c.P.length}$ (maximum ${c.Pmax.length}) · alternating walk to $B\\setminus V[\\mathcal P]$: ${c.r.walk ? '**yes**' : '**none**'} · $X$ = {${c.X.map((u) => G.lab(c.H.ids[u])).join(', ')}}, one vertex per path · $X$ separates $A$ from $B$: ${sepOK ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '3.3.4', kind: 'Corollary', name: 'Fan version of Menger’s theorem',
      statement: String.raw`A set of $a$–$B$ paths is an **$a$–$B$ fan** if any two of them have only $a$ in common. For $B\subseteq V$ and $a\in V\setminus B$, the least number of vertices (other than $a$) separating $a$ from $B$ in $G$ equals the greatest number of paths in an $a$–$B$ fan.`,
      idea: String.raw`Apply Menger's theorem 3.3.1 to $G-a$ with $A:=N_G(a)$. Disjoint $N(a)$–$B$ paths, each extended by an edge back to $a$, form a fan, and conversely a fan minus $a$ is a set of disjoint $N(a)$–$B$ paths; a set separating $N(a)$ from $B$ in $G-a$ is exactly a set separating $a$ from $B$ in $G$ (a neighbour of $a$ in $B$ must itself be in the separator).`,
      caption: String.raw`Left: a largest fan from $a$ (gold) to $B$ (green), each path in its own colour; right: a smallest set $X$ separating $a$ from $B$ (red boxes), with the part of $G-X$ that $a$ still reaches shaded. With **click toggles B**, click vertices to change $B$; with **click moves a**, click a vertex to make it $a$. Shift-drag adds edges, Alt-click deletes.`,
      deps: ['graph-3.3.1'], refs: ['Diestel §3.3'], tags: ['Menger', 'fans'],
      viz(v) {
        const mode = v.select('', [{ value: 'B', label: 'click toggles B' }, { value: 'a', label: 'click moves a' }], 'B');
        const spec = FANG(), nodes = spec.nodes.map((n) => ({ ...n }));
        const s1 = gstage(v, { height: 290, x: [0, 10], y: [0.1, 6.4], title: 'a largest $a$–$B$ fan' }), s2 = gstage(v, { height: 290, x: [0, 10], y: [0.1, 6.4], title: 'a smallest $a$–$B$ separator' });
        const G = v.graph(s1, { nodes, edges: spec.edges, r: 12, editable: { addEdge: true, deleteNode: true, deleteEdge: true, moveNode: true } }), G2 = v.graph(s2, { nodes, edges: spec.edges, r: 12, draggable: false });
        let a = 'a'; const Bs = new Set(['b1', 'b2', 'b3', 'b4']);
        G.onClick = ({ node, alt }) => {
          if (alt || !node) return false;
          if (mode.value === 'a') { a = K(node.id); Bs.delete(a); } else if (K(node.id) !== a) Bs.has(K(node.id)) ? Bs.delete(K(node.id)) : Bs.add(K(node.id));
          return true;
        };
        G.onChange = () => { G2.set({ nodes, edges: G.edges.map((e) => [e.from, e.to]) }); };
        const calc = () => {
          const H = ix(G); if (!G.has(a)) a = K(G.nodes[0].id);
          const ai = H.at(a), N = H.adj[ai].map(([w]) => w), B = [...Bs].map((id) => H.at(id)).filter((u) => u != null);
          const r = menger(H, N, B, { gone: (u) => u === ai });
          const alive = ((1 << H.n) - 1) & ~(1 << ai), bs = B.length && H.n <= 20 ? popc(bruteSep(H, N, B, alive)) : null;
          return { H, ai, B, fan: r.paths.map((p) => [ai, ...p]), sep: r.sep, bs };
        };
        v.render(() => {
          const c = calc(), H = c.H, pm = pathMap(H, c.fan), xs = new Set(c.sep), C = comps(H, (u) => !xs.has(u));
          const fill = (id) => (K(id) === a ? 'gold' : Bs.has(K(id)) ? 'green' : null);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : 1.4), nodeFill: fill });
          const H2 = ix(G2), reachA = (u) => !xs.has(u) && C.comp[u] === C.comp[c.ai];
          blob(s2, [...Array(H.n).keys()].filter(reachA).map((u) => { const n = G.node(H.ids[u]); return [n.x, n.y]; }), [], v.color('gold'), 34, 0.18);
          G2.draw({ nodeFill: (id) => (xs.has(H2.at(id)) ? null : fill(id)), edgeDash: (e) => xs.has(H2.at(e.from)) || xs.has(H2.at(e.to)), dim: c.sep.map((u) => H.ids[u]) });
          for (const u of c.sep) squareMark(s2, G2, H.ids[u], v.color('red'), 16, 2.8);
        });
        v.legend([['gold', '$a$ / the part $a$ still reaches', { dot: true }], ['green', '$B$', { dot: true }], ['orange', 'fan paths'], ['red', 'separator $X$', { dot: true }]]);
        v.readout(() => {
          const c = calc();
          return c.B.length ? `fan of **${c.fan.length}** paths meeting only in $a$ · separator $X$ of **${c.sep.length}** vertices · smallest by brute force: ${c.bs} ${c.bs === c.fan.length && c.sep.length === c.bs ? '✓ equal' : '✗'}` : 'choose some vertices of $B$';
        });
      },
    },
    {
      num: '3.3.5', kind: 'Corollary', name: 'Menger for two vertices: independent and edge-disjoint paths',
      statement: String.raw`Let $a\ne b$ be vertices of $G$. (i) If $ab\notin E$, the least number of vertices separating $a$ from $b$ equals the greatest number of independent $a$–$b$ paths (paths meeting only in $a$ and $b$). (ii) The least number of edges separating $a$ from $b$ equals the greatest number of edge-disjoint $a$–$b$ paths.`,
      idea: String.raw`(i) Apply Menger's theorem to $G-\{a,b\}$ with $A:=N(a)$ and $B:=N(b)$: disjoint $N(a)$–$N(b)$ paths extend to independent $a$–$b$ paths (a common neighbour is a trivial path). (ii) Apply it to the line graph $L(G)$ with $A:=E(a)$ and $B:=E(b)$, the edges at $a$ and at $b$: disjoint $A$–$B$ paths in $L(G)$ are edge-disjoint $a$–$b$ walks in $G$, which contain edge-disjoint paths, and vertex separators of $L(G)$ are edge separators of $G$.`,
      caption: String.raw`Click a vertex to make it $a$, the next click makes it $b$ (alternating). **independent** shows a largest set of independent $a$–$b$ paths (left) and a smallest vertex separator (right, red boxes, with the two sides coloured); **edge-disjoint** shows edge-disjoint paths and a smallest edge cut (red dashes). Choose adjacent $a, b$: no vertex set separates them, and (i) does not apply — but the edge version still holds.`,
      deps: ['graph-3.3.1'], refs: ['Diestel §3.3'], tags: ['Menger', 'independent paths', 'edge cuts'],
      viz(v) {
        const mode = v.select('', [{ value: 'v', label: 'independent paths' }, { value: 'e', label: 'edge-disjoint paths' }], 'v');
        const spec = GRID(), nodes = spec.nodes.map((n) => ({ ...n }));
        const s1 = gstage(v, { height: 280, x: [0, 10], y: [0.2, 6.4], title: 'paths' }), s2 = gstage(v, { height: 280, x: [0, 10], y: [0.2, 6.4], title: 'a smallest separator' });
        const G = v.graph(s1, { nodes, edges: spec.edges, r: 12 }), G2 = v.graph(s2, { nodes, edges: spec.edges, r: 12, draggable: false });
        let ab = ['f', 'j'], next = 0;
        const click = ({ node }) => { if (node) { ab[next] = K(node.id); if (ab[0] === ab[1]) ab[1 - next] = null; next = 1 - next; } return true; };
        G.onClick = click; G2.onClick = click;
        const calc = () => {
          const H = ix(G); if (!ab[0] || !ab[1] || ab[0] === ab[1]) return { H, none: true };
          const a = H.at(ab[0]), b = H.at(ab[1]);
          if (mode.value === 'v') { const r = indepPaths(H, a, b); return { H, a, b, paths: r.paths, sep: r.sep, adj: r.adj, bs: r.adj ? null : popc(bruteSep(H, H.adj[a].map(([w]) => w), H.adj[b].map(([w]) => w), ((1 << H.n) - 1) & ~(1 << a) & ~(1 << b))) }; }
          const r = edgeMenger(H, a, b); return { H, a, b, paths: r.paths, cut: r.cut, reach: r.reach, ln: r.k };
        };
        v.render(() => {
          const c = calc(), H = c.H, H2 = ix(G2);
          const fill = (id) => (K(id) === ab[0] ? 'gold' : K(id) === ab[1] ? 'blue' : null);
          if (c.none) { G.draw({ nodeFill: fill }); G2.draw({ nodeFill: fill }); return; }
          const pm = pathMap(H, c.paths);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : 1.4), nodeFill: fill, nodeLabel: (id) => (K(id) === ab[0] ? 'a' : K(id) === ab[1] ? 'b' : '') });
          if (mode.value === 'v') {
            if (c.adj) { G2.draw({ nodeFill: fill, nodeLabel: (id) => (K(id) === ab[0] ? 'a' : K(id) === ab[1] ? 'b' : ''), edgeColor: (e) => ((K(e.from) === ab[0] && K(e.to) === ab[1]) || (K(e.to) === ab[0] && K(e.from) === ab[1]) ? 'red' : null), edgeWidth: (e) => ((K(e.from) === ab[0] && K(e.to) === ab[1]) || (K(e.to) === ab[0] && K(e.from) === ab[1]) ? 4 : null) });
              s2.corner('a and b are adjacent: no vertex set separates them', 'tl', { color: 'red', weight: 700, size: 12.5, plate: true }); return; }
            const xs = new Set(c.sep), C = comps(H, (u) => !xs.has(u));
            G2.draw({ nodeFill: (id) => { const u = H2.at(id); return xs.has(u) ? null : K(id) === ab[0] || K(id) === ab[1] ? fill(id) : C.comp[u] === C.comp[c.a] ? 'gold' : C.comp[u] === C.comp[c.b] ? 'blue' : 'faint'; },
              nodeLabel: (id) => (K(id) === ab[0] ? 'a' : K(id) === ab[1] ? 'b' : ''), dim: c.sep.map((u) => H.ids[u]), edgeDash: (e) => xs.has(H2.at(e.from)) || xs.has(H2.at(e.to)) });
            for (const u of c.sep) squareMark(s2, G2, H.ids[u], v.color('red'), 16, 2.8);
          } else {
            const cut = new Set(c.cut);
            G2.draw({ nodeFill: (id) => (K(id) === ab[0] || K(id) === ab[1] ? fill(id) : c.reach[H2.at(id)] ? 'gold' : 'blue'), nodeLabel: (id) => (K(id) === ab[0] ? 'a' : K(id) === ab[1] ? 'b' : ''),
              edgeColor: (e) => (cut.has(H2.eix.get(e)) ? 'red' : null), edgeWidth: (e) => (cut.has(H2.eix.get(e)) ? 4 : null), edgeDash: (e) => cut.has(H2.eix.get(e)) });
          }
        });
        v.legend([['gold', '$a$ and its side', { dot: true }], ['blue', '$b$ and its side', { dot: true }], ['orange', 'paths'], ['red', 'separator / cut', { dash: true }]]);
        v.readout(() => {
          const c = calc(); if (c.none) return 'choose two distinct vertices';
          if (mode.value === 'v') return c.adj ? `$ab\\in E$: ${c.paths.length} independent $a$–$b$ paths (the edge counts as one), but no separating vertex set — (i) needs $ab\\notin E$` : `**${c.paths.length} independent** $a$–$b$ paths · smallest vertex separator: ${c.sep.length} (brute force ${c.bs}) ${c.sep.length === c.paths.length && c.bs === c.paths.length ? '✓' : '✗'}`;
          return `**${c.paths.length} edge-disjoint** $a$–$b$ paths · smallest $a$–$b$ edge cut: ${c.cut.length} edges ${c.cut.length === c.paths.length ? '✓ equal' : '✗'}`;
        });
      },
    },
    {
      num: '3.3.6', kind: 'Theorem', name: 'Global version of Menger’s theorem', credit: 'Whitney, 1932',
      statement: String.raw`(i) A graph is $k$-connected if and only if it contains $k$ independent paths between any two vertices. (ii) A graph is $k$-edge-connected if and only if it contains $k$ edge-disjoint paths between any two vertices.`,
      idea: String.raw`If every two vertices are joined by $k$ independent paths, then $|G|>k$ and no set of fewer than $k$ vertices can separate anything. Conversely let $G$ be $k$-connected, and suppose $a,b$ are not joined by $k$ independent paths. By Corollary 3.3.5 (i) they must be adjacent; in $G':=G-ab$ they are joined by at most $k-2$ independent paths, hence separated by a set $X$ of at most $k-2$ vertices. Some further vertex $v$ exists as $|G|>k$; $X$ separates $v$ from $a$ or from $b$ in $G'$, say from $a$ — then $X\cup\{b\}$, of size $\le k-1$, separates $v$ from $a$ in $G$, a contradiction. (ii) is Corollary 3.3.5 (ii). Diestel credits the global version to Whitney (1932).`,
      caption: String.raw`The table lists, for every pair of vertices, the greatest number of independent paths (switch to edge-disjoint paths); the darkest cells are the minimum, outlined in red. Click a cell to draw those paths in the graph. The minimum equals $\kappa(G)$ (or $\lambda(G)$), computed independently from separators — so $G$ is $k$-connected exactly for $k\le$ the minimum. Edit the graph (${EDIT}).`,
      deps: ['graph-3.3.5', 'graph-1.4.1b'], refs: ['Diestel §3.3'], tags: ['Menger', 'connectivity'],
      viz(v) {
        const PRE = { two: TWOK4, cube: () => named('cube'), w5: () => wheel(5), pet: () => named('petersen') };
        const pre = v.select('', [{ value: 'two', label: 'two $K^4$ at a vertex' }, { value: 'cube', label: 'cube' }, { value: 'w5', label: 'wheel' }, { value: 'pet', label: 'Petersen' }], 'two', { onChange: () => { load(G, PRE[pre.value]()); sel = null; } });
        const mode = v.select('count', [{ value: 'v', label: 'independent paths' }, { value: 'e', label: 'edge-disjoint paths' }], 'v');
        const s = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 330 }), t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, editable: true }); load(G, TWOK4());
        let sel = null;
        const T = v.table(t, { rows: 2, cols: 2, maxCell: 34, size: 12.5 });
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0 && c.i !== c.j) sel = [c.i, c.j]; });
        const info = cacheBy((G, m) => {
          const H = ix(G), n = H.n, M = Array.from({ length: n }, () => new Array(n).fill(null));
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const k = m === 'v' ? indepPaths(H, i, j).k : edgeMenger(H, i, j).k; M[i][j] = M[j][i] = k; }
          const vals = M.flat().filter((x) => x != null), mn = vals.length ? Math.min(...vals) : 0, mx = vals.length ? Math.max(...vals) : 0;
          return { H, M, mn, mx, kap: m === 'v' ? kappa(H).k : lambda(H).l };
        });
        v.render(() => {
          const I = info(G, mode.value), { H, M, mn, mx } = I, n = H.n;
          if (sel && (sel[0] >= n || sel[1] >= n)) sel = null;
          if (!sel && n > 1) { outer: for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (M[i][j] === mn) { sel = [i, j]; break outer; } }
          const labs = H.ids.map((id) => G.lab(id));
          T.draw({ rows: n, cols: n, rowLabels: labs, colLabels: labs, value: (i, j) => (i === j ? null : M[i][j]),
            fill: (i, j) => (i === j ? null : M[i][j] === mn ? ['red', 0.45] : ['accent', 0.08 + (0.4 * (mx - M[i][j])) / Math.max(1, mx - mn)]),
            highlight: sel ? [[sel[0], sel[1], 'ink'], [sel[1], sel[0], 'ink']] : [] });
          if (!sel) { G.draw({}); return; }
          const [a, b] = sel, paths = mode.value === 'v' ? indepPaths(H, a, b).paths : edgeMenger(H, a, b).paths, pm = pathMap(H, paths);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : 1.4), nodeFill: (id) => (H.at(id) === a ? 'gold' : H.at(id) === b ? 'blue' : null) });
        });
        v.legend([['red', 'pairs attaining the minimum', { area: true }], ['gold', 'chosen pair', { dot: true }], ['orange', 'their paths']]);
        v.readout(() => {
          const I = info(G, mode.value), nm = mode.value === 'v' ? '\\kappa' : '\\lambda';
          return `minimum over all pairs: **${I.mn}** · $${nm}(G) = ${I.kap}$ from separators ${I.mn === I.kap ? '✓ equal' : '✗'} — so $G$ is ${I.kap}-${mode.value === 'v' ? '' : 'edge-'}connected and not ${I.kap + 1}-${mode.value === 'v' ? '' : 'edge-'}connected`;
        });
      },
    },
  ],
};
