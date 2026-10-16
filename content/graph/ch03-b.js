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
const TWOK4 = () => F({ a: [1.2, 5.6], b: [1.2, 0.8], c: [3.0, 3.2], x: [5.0, 3.2], e: [8.8, 5.6], f: [8.8, 0.8], g: [7.0, 3.2] }, 'ab ac ax bc bx cx ex fx gx ef eg fg');

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
        const S = v.steps({ frames, code, codeTitle: 'Menger by alternating walks', codePos: 'below', speed: 1, start: 'end', still: 'end' });
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
        const s = gstage(v, { height: 340, x: [0, 10], y: [-0.05, 6.95] });
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
      caption: String.raw`The table lists, for every pair of vertices, the greatest number of independent paths (switch to edge-disjoint paths); the cells attaining the minimum are red, the chosen pair is outlined. Click a cell to draw those paths in the graph. The minimum equals $\kappa(G)$ (or $\lambda(G)$), computed independently from separators — so $G$ is $k$-connected exactly for $k\le$ the minimum. Edit the graph (${EDIT}).`,
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
    // ================================================================== 3.4 A-paths and Mader's theorem
    {
      num: '3.4.1', kind: 'Theorem', name: 'Gallai: k disjoint A-paths or 2k − 2 vertices meeting all', credit: 'Gallai, 1961',
      statement: String.raw`Let $A$ be a set of vertices of a graph $G$ and $k\ge1$ an integer. Then $G$ contains $k$ disjoint $A$-paths (nontrivial paths meeting $A$ exactly in their two ends), or $G$ has a set of at most $2k-2$ vertices meeting every $A$-path. The complete graph $K^{2k-1}$ with $A$ its whole vertex set shows that $2k-2$ cannot be lowered.`,
      idea: String.raw`Diestel derives this from Mader's theorem through Corollary 3.4.3 (his Exercise 30). One way: attach a new pendant vertex $a'$ to every $a\in A$ and let $H$ be the set of these new vertices. In the new graph the $H$-paths are the $A$-paths extended by two pendant edges, independent $H$-paths correspond to disjoint $A$-paths, and vertex sets of $G$ meeting all $H$-paths meet all $A$-paths. Corollary 3.4.3 gives at least $\tfrac12\tau$ disjoint $A$-paths, where $\tau$ is the least size of such a set; so if there are fewer than $k$ of them, $\tau\le 2(k-1)$. In $K^{2k-1}$ with $A=V$ the $A$-paths are the edges: at most $k-1$ are disjoint, and every set meeting all edges misses at most one vertex.`,
      caption: String.raw`Click vertices to put them into $A$ (blue) or take them out; choose $k$ with the slider. If $k$ disjoint $A$-paths exist they are drawn; otherwise a smallest set meeting all $A$-paths is boxed in red — never more than $2k-2$ vertices. The chart plots, against $k$, the bound $2k-2$ (orange) and the true minimum $\tau$ of such a set (red): where $k$ disjoint paths exist the band is green, and to its right the red line always stays under the orange one. $K^5$ with $k=3$ is the tight case.`,
      deps: ['graph-1.3.1a'], see: ['graph-3.4.3'], refs: ['Diestel §3.4'], tags: ['A-paths', 'Erdős–Pósa'],
      viz(v) {
        const PRE = { k5: () => ({ ...named('complete', 5), A: [0, 1, 2, 3, 4] }), pet: () => ({ ...named('petersen'), A: [0, 1, 2, 3, 4] }), grid: () => ({ ...GRID(), A: ['a', 'e', 'k', 'o', 'c', 'm', 'h'] }) };
        const pre = v.select('', [{ value: 'k5', label: '$K^5$, $A = V$' }, { value: 'pet', label: 'Petersen, $A$ = outer cycle' }, { value: 'grid', label: 'triangulated grid' }], 'k5', { onChange: () => reload() });
        const kS = v.slider('$k$', 1, 6, 3, { int: true });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 320, weight: 1.35 });
        const c = v.stage({ x: [0.5, 6.5], y: [0, 11], axes: 'box', gutter: true, height: 320, xlabel: '$k$', ylabel: 'vertices', xticks: [1, 2, 3, 4, 5, 6], yticks: [0, 2, 4, 6, 8, 10] });
        const G = v.graph(s, { nodes: [], edges: [], r: 12 });
        const A = new Set();
        function reload() { const P = PRE[pre.value](); load(G, P); A.clear(); P.A.forEach((x) => A.add(K(x))); }
        reload();
        G.onClick = ({ node }) => { if (node) A.has(K(node.id)) ? A.delete(K(node.id)) : A.add(K(node.id)); return true; };
        const info = cacheBy((G, key) => { const H = ix(G), Ai = [...A].map((id) => H.at(id)).filter((u) => u != null), P = maxAPaths(H, Ai), X = bitsOf(minAHit(H, Ai)); return { H, Ai, nu: P.val, P: P.P, X, tau: X.length }; });
        const get = () => info(G, [...A].sort().join(','));
        v.render(() => {
          const I = get(), k = kS.value, H = I.H, ok = I.nu >= k;
          const pm = ok ? pathMap(H, I.P.slice(0, k)) : new Map(), xs = new Set(ok ? [] : I.X);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 5 : 1.5), edgeDash: (e) => xs.has(H.at(e.from)) || xs.has(H.at(e.to)),
            nodeFill: (id) => (A.has(K(id)) ? 'blue' : null), dim: [...xs].map((u) => H.ids[u]) });
          for (const u of xs) squareMark(s, G, H.ids[u], v.color('red'), 16, 2.8);
          s.corner(ok ? `${k} disjoint A-paths` : `no ${k} disjoint A-paths — ${I.tau} vertices meet all A-paths (≤ 2k − 2 = ${2 * k - 2})`, 'tl', { color: ok ? 'green' : 'red', weight: 700, size: 12.5, plate: true });
          // chart
          c.vband(0.5, Math.min(6.5, I.nu + 0.5), { color: 'green', alpha: 0.13 });
          if (I.nu >= 1) c.text(`${I.nu >= 6 ? '≥ 6' : ''} k disjoint A-paths`, Math.min(6.5, I.nu + 0.5) / 2 + 0.25, 10.2, { size: 11.5, color: 'green', align: 'center' });
          c.fn((x) => 2 * x - 2, { domain: [0.5, 6.5], color: 'orange', width: 2.4, dash: [6, 4] });
          c.hline(I.tau, { color: 'red', width: 2.6 });
          c.text(`τ = ${I.tau}`, 6.4, I.tau, { dy: -8, size: 12, color: 'red', align: 'right' });
          c.text('2k − 2', 5.2, 8.4, { size: 12, color: 'orange', align: 'right' });
          c.vline(k, { color: 'gold', width: 2 });
          for (let x = 1; x <= 6; x++) c.dot(x, 2 * x - 2, { r: x === k ? 5 : 3, color: 'orange' });
        });
        v.legend([['blue', '$A$', { dot: true }], ['orange', 'disjoint $A$-paths'], ['red', 'hitting set (boxed) / $\\tau$'], ['orange', '$2k-2$', { dash: true }]]);
        v.readout(() => {
          const I = get(), k = kS.value;
          return `$|A| = ${I.Ai.length}$ · max disjoint $A$-paths $= ${I.nu}$ · fewest vertices meeting all $A$-paths $\\tau = ${I.tau}$ · for $k = ${k}$: ${I.nu >= k ? `$k$ disjoint paths ✓` : `$\\tau = ${I.tau} \\le 2k-2 = ${2 * k - 2}$ ${I.tau <= 2 * k - 2 ? '✓' : '✗'}`} · in general $\\tau \\le 2\\nu$: ${I.tau} ≤ ${2 * I.nu} ${I.tau <= 2 * I.nu ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '3.4.2', kind: 'Theorem', name: 'Mader’s theorem on independent H-paths', credit: 'Mader, 1978',
      statement: String.raw`Let $H$ be an induced subgraph of $G$. For $X\subseteq V(G-H)$ and $F\subseteq E(G-H-X)$ such that every $H$-path in $G$ has a vertex in $X$ or an edge in $F$, let $\mathcal C_F$ be the set of components of the graph $(V(G-H)\setminus X,\,F)$, and for $C\in\mathcal C_F$ let $\partial C$ be the set of vertices of $C$ with a neighbour in $G-X-C$. Put
$$M_H(G):=\min_{X,F}\Big(|X|+\sum_{C\in\mathcal C_F}\big\lfloor\tfrac12|\partial C|\big\rfloor\Big).$$
Then $G$ contains $M_H(G)$ independent $H$-paths.`,
      idea: String.raw`$M_H(G)$ is an upper bound: independent $H$-paths have disjoint interiors in $G-H$; each one that avoids $X$ must use an edge of $F$, hence pass through some $C\in\mathcal C_F$, entering and leaving it through two vertices of $\partial C$ — so at most $\lfloor\frac12|\partial C|\rfloor$ of them can use $C$. Mader's theorem says this bound is always attained, a common generalisation of Menger's theorem and of Tutte's 1-factor theorem (Diestel states it without proof; the shortest known proof is in Schrijver's book).`,
      caption: String.raw`$H$ sits in the shaded strip. A largest set of independent $H$-paths is drawn (they may share ends in $H$, never inner vertices). **show X, F** displays a minimising choice in Mader's formula, found by brute force over all $X$ and $F$: $X$ boxed in red, $F$ red dashed, each component $C$ shaded purple with the vertices of $\partial C$ ringed. The two numbers agree on every graph — try **random G** for new examples.`,
      deps: ['graph-3.3.1', 'graph-1.3.1a'], refs: ['Diestel §3.4'], tags: ['H-paths', 'Mader'],
      viz(v) {
        const pre = v.select('', [{ value: 'ex', label: 'example' }, { value: 'k3', label: '$H = K^3$ with two copies' }, { value: 'rnd', label: 'random G' }], 'ex', { onChange: () => build() });
        const show = v.toggle('show X, F', true);
        const s = gstage(v, { height: 340, x: [0, 10], y: [-0.3, 6.4] });
        const G = v.graph(s, { nodes: [], edges: [], r: 12, draggable: true });
        let seed = 1, Hids = [];
        const EXM = () => F({ h1: [1.4, 0.6], h2: [3.8, 0.6], h3: [6.2, 0.6], h4: [8.6, 0.6], x: [5.0, 3.0], y1: [1.6, 3.2], y2: [2.8, 5.2], z1: [7.2, 5.2], z2: [8.4, 3.2], w: [5.0, 5.6] },
          'x h1,x h2,x h3,x h4,y1 h1,y1 h2,y1 y2,y2 w,y2 h3,z1 w,z1 z2,z2 h4,z2 h3,w x'.split(',').map((p) => p.split(' ')));
        const EXK3 = () => F({ h0: [3.6, 0.7], h1: [5.0, 1.7], h2: [6.4, 0.7], u0: [0.9, 3.4], u1: [2.2, 5.6], u2: [3.4, 3.6], w0: [6.6, 3.6], w1: [7.8, 5.6], w2: [9.1, 3.4] },
          'h0 h1,h1 h2,h0 h2,u0 u1,u1 u2,u0 u2,w0 w1,w1 w2,w0 w2,u0 h0,u1 h1,u2 h2,w0 h0,w1 h1,w2 h2'.split(',').map((p) => p.split(' ')));
        const RND = () => {
          const r = v.rng(seed), nH = 3 + Math.floor(r() * 2), nY = 6 + Math.floor(r() * 2), P = {}, E = [];
          for (let i = 0; i < nH; i++) P['h' + i] = [1.5 + (7 * i) / (nH - 1), 0.6];
          for (let j = 0; j < nY; j++) { const a = Math.PI * (0.92 - (0.84 * j) / (nY - 1)); P['y' + j] = [5 + 4.1 * Math.cos(a), 1.9 + 3.6 * Math.sin(a)]; }
          for (let j = 0; j < nY; j++) for (let l = j + 1; l < nY; l++) if (r() < (l === j + 1 ? 0.6 : 0.22)) E.push(['y' + j, 'y' + l]);
          for (let j = 0; j < nY; j++) for (let i = 0; i < nH; i++) if (r() < 0.32) E.push(['y' + j, 'h' + i]);
          return F(P, E);
        };
        function build() { const P = pre.value === 'ex' ? EXM() : pre.value === 'k3' ? EXK3() : RND(); load(G, P); Hids = P.nodes.filter((n) => K(n.id)[0] === 'h').map((n) => K(n.id)); }
        build();
        v.button('random G', () => { seed++; pre.set('rnd'); build(); });
        const info = cacheBy((G) => {
          const Hx = ix(G), Hm = Hids.reduce((m, id) => (Hx.at(id) != null ? m | (1 << Hx.at(id)) : m), 0), I = hPaths(Hx, Hm), best = I.maxIndep(), md = I.mader(best.val + 1);
          return { Hx, Hm, best, md };
        });
        v.render(() => {
          const I = info(G), Hx = I.Hx;
          s.rect(0.3, -0.15, 9.7, 1.45, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1, radius: 14 });
          s.text('H', 9.45, 1.2, { size: 15, color: 'muted', weight: 700, math: true, align: 'right', baseline: 'top' });
          const paths = I.best.P.map((P) => [P.h1, ...P.vs, P.h2]), pm = pathMap(Hx, paths);
          const md = I.md, X = new Set(show.value ? bitsOf(md.X) : []), Fs = new Set(show.value ? md.F : []), dC = new Set();
          if (show.value) md.parts.forEach((p) => { bitsOf(p.dC).forEach((u) => dC.add(u)); if (popc(p.C) > 1) blob(s, bitsOf(p.C).map((u) => { const n = G.node(Hx.ids[u]); return [n.x, n.y]; }), md.F.filter((k) => (p.C >> Hx.E[k][0]) & 1).map((k) => { const [a, b] = Hx.E[k]; const A = G.node(Hx.ids[a]), B = G.node(Hx.ids[b]); return [[A.x, A.y], [B.x, B.y]]; }), v.color('purple'), 34, 0.16); });
          G.draw({ edgeColor: (e) => (Fs.has(Hx.eix.get(e)) ? 'red' : pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : Fs.has(Hx.eix.get(e)) ? 3 : 1.5), edgeDash: (e) => Fs.has(Hx.eix.get(e)),
            nodeFill: (id) => (Hids.includes(K(id)) ? 'muted' : null), nodeRing: (id) => (dC.has(Hx.at(id)) ? 'purple' : null) });
          for (const u of X) squareMark(s, G, Hx.ids[u], v.color('red'), 16, 2.8);
        });
        v.legend([['orange', 'independent $H$-paths'], ['red', '$X$ (boxed), $F$', { dash: true }], ['purple', 'components $C$; $\\partial C$ ringed', { area: true }]]);
        v.readout(() => {
          const I = info(G), md = I.md, terms = md.parts.filter((p) => popc(p.dC) >= 2).map((p) => `\\lfloor ${popc(p.dC)}/2\\rfloor`);
          return `**${I.best.val} independent $H$-paths** · $M_H(G) = |X| + \\sum\\lfloor\\frac12|\\partial C|\\rfloor = ${popc(md.X)}${terms.length ? ' + ' + terms.join(' + ') : ''} = ${md.val}$ ${md.val === I.best.val ? '✓ equal' : '✗'}`;
        });
      },
    },
    {
      num: '3.4.3', kind: 'Corollary', name: 'Half the hitting number of H-paths can be packed',
      statement: String.raw`Let $H$ be an induced subgraph of $G$. Let $\kappa_H(G)$ be the least size of a set $X\subseteq V(G-H)$ meeting every $H$-path, and $\lambda_H(G)$ the least size of a set $F\subseteq E(G)$ meeting every $H$-path. Then $G$ contains at least $\tfrac12\kappa_H(G)$ independent $H$-paths and at least $\tfrac12\lambda_H(G)$ edge-disjoint $H$-paths.`,
      idea: String.raw`Take $X$ and $F$ attaining Mader's bound $k=|X|+\sum_C\lfloor\frac12|\partial C|\rfloor$. From each $\partial C\neq\emptyset$ drop one vertex to get $Y_C$; then $\lfloor\frac12|\partial C|\rfloor\ge\frac12|Y_C|$, and $X\cup\bigcup_C Y_C$ meets every $H$-path (a path through $C$ needs two vertices of $\partial C$, so at least one in $Y_C$). Hence $k\ge\frac12|X\cup Y|\ge\frac12\kappa_H(G)$. The edge version follows by applying this to a suitable graph built from the line graph (Exercise 27). Both bounds are best possible: Exercise 28 builds graphs with only $\frac12\kappa_H(G)$ independent $H$-paths.`,
      caption: String.raw`Each dot is a graph with a marked $H$ (random examples, plus Diestel's Exercise 28 construction: $H=K^{2m+1}$ joined bijectively to $k$ further copies, gold). Horizontal: $\kappa_H(G)$; vertical: the maximum number of independent $H$-paths, both by brute force. Every dot lies between the lines $y=x/2$ (the corollary) and $y=x$ (trivial: every path needs its own vertex of $X$); the gold dots sit exactly on $y=x/2$. Click a dot to draw that graph with its paths and a smallest hitting set.`,
      deps: ['graph-3.4.2'], refs: ['Diestel §3.4'], tags: ['H-paths', 'Mader'],
      viz(v) {
        const s = gstage(v, { height: 320, x: [0, 10], y: [-0.3, 6.4], weight: 1.15 });
        const c = v.stage({ x: [0, 9.5], y: [0, 5.5], axes: 'box', gutter: true, height: 320, xlabel: '$\\kappa_H(G)$', ylabel: 'independent $H$-paths', xticks: [0, 2, 4, 6, 8], yticks: [0, 1, 2, 3, 4, 5] });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        // the sample: random small instances and Exercise 28 (H = K^{2m+1} with k copies)
        const inst = [];
        const ex28 = (m, k) => {
          const q = 2 * m + 1, P = {}, E = [];
          for (let i = 0; i < q; i++) P['h' + i] = [5 + 1.6 * (i - (q - 1) / 2) * (m > 1 ? 0.7 : 1), 0.6 + (i % 2) * 0.6];
          for (let c2 = 0; c2 < k; c2++) for (let i = 0; i < q; i++) { const cx = k === 1 ? 5 : 2.4 + (5.2 * c2) / (k - 1), a = Math.PI / 2 + (2 * Math.PI * i) / q; P[`c${c2}_${i}`] = [cx + 1.2 * Math.cos(a), 4.1 + 1.25 * Math.sin(a)]; }
          for (let i = 0; i < q; i++) for (let j = i + 1; j < q; j++) { E.push(['h' + i, 'h' + j]); for (let c2 = 0; c2 < k; c2++) E.push([`c${c2}_${i}`, `c${c2}_${j}`]); }
          for (let c2 = 0; c2 < k; c2++) for (let i = 0; i < q; i++) E.push(['h' + i, `c${c2}_${i}`]);
          return { spec: F(P, E), ex: true, label: `Exercise 28: $m=${m}$, $k=${k}$` };
        };
        inst.push(ex28(1, 1), ex28(1, 2), ex28(2, 1));
        const r = v.rng(7);
        for (let t = 0; t < 34; t++) {
          const nH = 2 + Math.floor(r() * 3), nY = 4 + Math.floor(r() * 4), P = {}, E = [];
          for (let i = 0; i < nH; i++) P['h' + i] = [1.5 + (7 * i) / Math.max(1, nH - 1), 0.6];
          for (let j = 0; j < nY; j++) { const a = Math.PI * (0.92 - (0.84 * j) / Math.max(1, nY - 1)); P['y' + j] = [5 + 4.1 * Math.cos(a), 1.9 + 3.6 * Math.sin(a)]; }
          for (let j = 0; j < nY; j++) for (let l = j + 1; l < nY; l++) if (r() < 0.35) E.push(['y' + j, 'y' + l]);
          for (let j = 0; j < nY; j++) for (let i = 0; i < nH; i++) if (r() < 0.4) E.push(['y' + j, 'h' + i]);
          if (nH > 1 && r() < 0.5) E.push(['h0', 'h1']);
          inst.push({ spec: F(P, E), ex: false, label: `random: $|H| = ${nH}$, $|G-H| = ${nY}$` });
        }
        for (const I of inst) {
          const Hx = ixOf(0, []); void Hx;
          const ids = I.spec.nodes.map((n) => K(n.id)), H2 = ix({ nodes: I.spec.nodes, edges: I.spec.edges });
          const Hm = ids.reduce((m, id, i) => (id[0] === 'h' ? m | (1 << H2.at(id)) : m), 0), hp = hPaths(H2, Hm), best = hp.maxIndep(), X = bitsOf(hp.kappaH());
          Object.assign(I, { H2, best, X, kap: X.length, nu: best.val });
        }
        let sel = 1;
        c.onClick((x, y) => { let b = -1, bd = Infinity; inst.forEach((I, i) => { const d = Math.hypot(I.kap - x, I.nu - y); if (d < bd) { bd = d; b = i; } }); if (bd < 0.7) { const at = inst.filter((I) => I.kap === inst[b].kap && I.nu === inst[b].nu); const cur = at.indexOf(inst[sel]); sel = inst.indexOf(at[(cur + 1) % at.length]); } });
        v.render(() => {
          const I = inst[sel];
          if (G._sel !== sel) { G._sel = sel; load(G, I.spec); }
          const H2 = ix(G), paths = I.best.P.map((P) => [P.h1, ...P.vs, P.h2].map((u) => H2.at(I.H2.ids[u]))), pm = pathMap(H2, paths), X = new Set(I.X.map((u) => K(I.H2.ids[u])));
          s.rect(0.3, -0.15, 9.7, 1.55, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1, radius: 14 });
          s.text('H', 9.45, 1.3, { size: 15, color: 'muted', weight: 700, math: true, align: 'right', baseline: 'top' });
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 4.5 : 1.3), nodeFill: (id) => (K(id)[0] === 'h' ? 'muted' : null), nodeLabel: () => '' });
          for (const id of X) squareMark(s, G, id, v.color('red'), 14, 2.6);
          // scatter
          c.fn((x) => x, { domain: [0, 5.5], color: 'muted', dash: [5, 4], width: 1.5 });
          c.fn((x) => x / 2, { domain: [0, 9.5], color: 'red', width: 2.2 });
          c.text('y = x', 4.6, 5.1, { size: 11.5, color: 'muted', align: 'right' });
          c.text('y = x/2', 9.3, 4.35, { size: 11.5, color: 'red', align: 'right' });
          const cnt = new Map(); inst.forEach((J) => { const k = J.kap + ',' + J.nu; cnt.set(k, (cnt.get(k) || 0) + 1); });
          for (const [k, n] of cnt) { const [x, y] = k.split(',').map(Number); const ex = inst.some((J) => J.ex && J.kap === x && J.nu === y); c.dot(x, y, { r: 4 + 1.6 * Math.sqrt(n), color: ex ? 'gold' : 'accent', fill: ex ? 'gold' : 'accent', fillAlpha: 0.45 }); }
          c.dot(I.kap, I.nu, { r: 13, hollow: true, color: 'ink' });
        });
        v.legend([['accent', 'random examples', { dot: true }], ['gold', 'Exercise 28 (tight)', { dot: true }], ['red', '$y = x/2$'], ['red', 'smallest hitting set $X$ (boxed)', { dot: true }]]);
        v.readout(() => {
          const I = inst[sel], all = inst.every((J) => 2 * J.nu >= J.kap && J.nu <= J.kap);
          return `${I.label}: $\\kappa_H(G) = ${I.kap}$, ${I.nu} independent $H$-paths ${2 * I.nu >= I.kap ? '≥' : '<'} $\\frac12\\kappa_H$ ${2 * I.nu >= I.kap ? '✓' : '✗'} · all ${inst.length} graphs between the lines: ${all ? '✓' : '✗'}`;
        });
      },
    },
    // ================================================================== 3.5 Linking pairs of vertices
    {
      num: '3.5.1a', kind: 'Definition', name: 'k-linked graphs', verify: true,
      statement: String.raw`A set $X\subseteq V(G)$ is **linked** in $G$ if for every choice of distinct vertices $s_1,\dots,s_\ell,t_1,\dots,t_\ell\in X$ there are disjoint paths $P_i=s_i\dots t_i$ in $G$ with no inner vertex in $X$. $G$ is **$k$-linked** if $|G|\ge 2k$ and every set of at most $2k$ vertices is linked — equivalently, if $|G|\ge2k$ and for every $2k$ distinct vertices $s_1,\dots,s_k,t_1,\dots,t_k$ there are disjoint paths $P_i=s_i\dots t_i$.`,
      idea: String.raw`Unlike Menger's theorem, which only asks for disjoint paths between two sets, linkedness prescribes which vertex each path must reach — a much stronger demand. Every $k$-linked graph is $k$-connected, but not conversely: in a 3-connected planar graph, four vertices around a face in the order $s_1,s_2,t_1,t_2$ cannot be linked, because the two paths would have to cross. The equivalence of the two forms holds because extra dummy terminals can pad a smaller set up to $2k$ vertices.`,
      caption: String.raw`Click vertices to place terminals: each click on a free vertex gives it the next missing label $s_1,t_1,s_2,t_2,\dots$; click a terminal to remove it. The app searches exhaustively for disjoint paths $s_i\dots t_i$. The readout also tests **every** placement of $2k$ terminals: the cube is 3-connected but not 2-linked (the default placement around a face fails), while the octahedron and the Petersen graph are 2-linked. **Show a failing placement** finds one if there is any.`,
      deps: ['graph-1.3.1a', 'graph-1.4.1b'], refs: ['Diestel §3.5'], tags: ['linkage'],
      viz(v) {
        const PRE = { cube: () => named('cube'), oct: () => named('octahedron'), pet: () => named('petersen'), k5: () => named('complete', 5), k33: () => named('kmn', 3, 3) };
        const DEF = { cube: [0, 2, 1, 3], oct: [0, 4, 1, 5], pet: [0, 2, 1, 3], k5: [0, 2, 1, 3], k33: [0, 1, 3, 4] };
        const pre = v.select('', [{ value: 'cube', label: 'cube' }, { value: 'oct', label: 'octahedron' }, { value: 'pet', label: 'Petersen' }, { value: 'k5', label: '$K^5$' }, { value: 'k33', label: '$K_{3,3}$' }], 'cube', { onChange: () => reload() });
        const kSel = v.select('$k$', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 2, { onChange: () => { term.length = Math.min(term.length, 2 * kSel.value); } });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13 });
        let term = []; // [s1, t1, s2, t2, …] as ids (null for holes)
        function reload() { load(G, PRE[pre.value]()); term = DEF[pre.value].map(K); }
        reload();
        G.onClick = ({ node }) => {
          if (!node) return true; const id = K(node.id), i = term.indexOf(id);
          if (i >= 0) term[i] = null; else { const j = term.indexOf(null); if (j >= 0) term[j] = id; else if (term.length < 2 * kSel.value) term.push(id); }
          while (term.length && term[term.length - 1] == null) term.pop();
          return true;
        };
        const whole = cacheBy((G, k) => kLinked(ix(G), +k));
        v.button('Show a failing placement', () => { const r = whole(G, kSel.value); if (r.fail) { const H = ix(G); term = r.fail.flat().map((u) => K(H.ids[u])); } });
        const calc = () => {
          const H = ix(G), pairs = [];
          for (let i = 0; i + 1 < term.length; i += 2) if (term[i] != null && term[i + 1] != null) pairs.push([H.at(term[i]), H.at(term[i + 1])]);
          return { H, pairs, r: pairs.length ? linkPairs(H, pairs, { budget: 4e5 }) : null };
        };
        v.render(() => {
          const c = calc(), H = c.H, pm = c.r && c.r.paths ? pathMap(H, c.r.paths) : new Map();
          const lab = (id) => { const i = term.indexOf(K(id)); return i < 0 ? '' : `${i % 2 ? 't' : 's'}${sub(Math.floor(i / 2) + 1)}`; };
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : null), edgeWidth: (e) => (pm.has(e) ? 5 : 1.6),
            nodeFill: (id) => { const i = term.indexOf(K(id)); return i < 0 ? null : PC[Math.floor(i / 2) % PC.length]; }, nodeLabel: lab });
          if (c.r) s.corner(c.r.paths ? `linked: ${c.pairs.length} disjoint path${c.pairs.length > 1 ? 's' : ''}` : c.r.exact ? 'no such disjoint paths exist' : 'search budget exceeded', 'tl', { color: c.r.paths ? 'green' : 'red', weight: 700, size: 13 });
        });
        v.legend([['orange', '$s_1 \\dots t_1$'], ['purple', '$s_2 \\dots t_2$'], ['pink', '$s_3 \\dots t_3$']]);
        v.readout(() => {
          const c = calc(), k = +kSel.value, W = whole(G, k), H = c.H;
          const kap = kappa(H).k;
          return `this placement: ${c.r ? (c.r.paths ? 'linked ✓' : '**not linkable**') : 'place terminals'} · whole graph ($\\kappa = ${kap}$): ${W.tooSmall ? `fewer than $2k$ vertices` : W.ok ? `**${k}-linked** — all ${W.tested} placements linked` : `**not ${k}-linked** (found after ${W.tested} placements)`}`;
        });
      },
    },
    {
      num: '3.5.1', kind: 'Lemma', name: 'Large average degree forces a topological Kʳ',
      statement: String.raw`There is a function $h:\mathbb N\to\mathbb N$ such that, for every $r$, every graph of average degree at least $h(r)$ contains $K^r$ as a topological minor.`,
      idea: String.raw`The lemma is borrowed from Chapter 7.2, where it is proved (with $h$ exponential in $r$) among several results of this type; here it serves Theorem 3.5.2, where high connectivity — hence high average degree, by Theorem 1.4.3 — provides a large subdivided complete graph $K$ through which terminals can be linked. A topological $K^r$ consists of $r$ **branch vertices** joined pairwise by $\binom r2$ independent paths.`,
      caption: String.raw`A random graph on 11 vertices with the chosen average degree; the app searches for a subdivided $K^r$ by backtracking (exhaustive) and draws its branch vertices gold and its $\binom r2$ subdivided edges in colour. **Resample** draws a new graph. The chart repeats the experiment for 16 random graphs at each average degree: the fraction containing a $TK^r$ climbs to 1 as $d(G)$ grows, as the lemma predicts.`,
      deps: ['graph-1.7.1b', 'graph-1.2.1a'], see: ['graph-7.2.2', 'graph-7.2.3'], refs: ['Diestel §3.5'], tags: ['topological minors', 'average degree'],
      viz(v) {
        const rS = v.select('$r$', [{ value: 4, label: '4' }, { value: 5, label: '5' }], 4);
        const dS = v.slider('average degree', 2, 7, 3.4, { step: 0.2 });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 320, weight: 1.15 });
        const c = v.stage({ x: [1.5, 8.5], y: [0, 1.08], axes: 'box', gutter: true, height: 320, xlabel: 'average degree $d(G)$', ylabel: 'fraction with a $TK^r$', yticks: [0, 0.25, 0.5, 0.75, 1] });
        const G = v.graph(s, { nodes: [], edges: [], r: 11 });
        const N = 11; let seed = 1;
        v.button('Resample', () => { seed++; });
        const gen = (n, d, sd) => { const r = v.rng(sd), all = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) all.push([i, j]); for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } return all.slice(0, Math.round((d * n) / 2)); };
        const sweep = cacheBy((G, rr) => { const out = []; for (let d = 2; d <= 8.01; d += 0.5) { let hit = 0; const T = 16; for (let t = 0; t < T; t++) if (findTK(ixOf(N, gen(N, d, 1000 + 37 * t + Math.round(d * 10))), +rr).found) hit++; out.push([d, hit / T]); } return out; });
        const cur = cacheBy((G, key) => { const [d, sd, rr] = key.split('|').map(Number), E = gen(N, d, sd), H = ixOf(N, E); return { E, H, res: findTK(H, rr) }; });
        v.render(() => {
          const key = `${dS.value}|${seed}|${rS.value}`, C = cur(G, key);
          if (G._key !== key.split('|').slice(0, 2).join('|')) { G._key = key.split('|').slice(0, 2).join('|'); G.set({ nodes: [...Array(N).keys()].map((i) => ({ id: i, label: '' })), edges: C.E }); G.layout('circle'); }
          const f = C.res.found, H = ix(G), pm = f ? pathMap(H, f.paths) : new Map(), U = new Set(f ? f.U.map((u) => K(H.ids[u])) : []);
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e) % PC.length] : 'faint'), edgeWidth: (e) => (pm.has(e) ? 4 : 1.3), nodeFill: (id) => (U.has(K(id)) ? 'gold' : null), nodeRing: (id) => (U.has(K(id)) ? 'gold' : null) });
          s.corner(f ? `TK${'⁰¹²³⁴⁵⁶⁷⁸⁹'[+rS.value]} found` : `no TK${'⁰¹²³⁴⁵⁶⁷⁸⁹'[+rS.value]}${C.res.exact ? '' : ' found (search cut short)'}`, 'tl', { color: f ? 'green' : 'red', weight: 700, size: 13 });
          const sw = sweep(G, rS.value);
          c.path(sw.map(([x, y]) => [x, y]), { color: 'accent', width: 2.4 });
          sw.forEach(([x, y]) => c.dot(x, y, { r: 4, color: 'accent' }));
          const d = (2 * C.H.m) / N; c.vline(d, { color: f ? 'green' : 'red', width: 2, dash: [5, 4] });
        });
        v.legend([['gold', 'branch vertices', { dot: true }], ['orange', 'subdivided edges of $K^r$'], ['accent', 'fraction of 16 random graphs']]);
        v.readout(() => {
          const C = cur(G, `${dS.value}|${seed}|${rS.value}`), d = (2 * C.H.m) / N, f = C.res.found;
          return `$|G| = ${N}$, $\\|G\\| = ${C.H.m}$, $d(G) = ${d.toFixed(2)}$ · ${f ? `$TK^${rS.value}$ with branch vertices ${f.U.length} gold, ${f.paths.filter((p) => p.length > 2).length} of the ${f.paths.length} edges subdivided` : `no $TK^${rS.value}$ (${C.res.exact ? 'exhaustive search' : 'search cut short'})`}`;
        });
      },
    },
    {
      num: '3.5.2', kind: 'Theorem', name: 'Jung, Larman–Mani: high connectivity forces k-linkedness', credit: 'Jung, 1970; Larman & Mani, 1970',
      statement: String.raw`There is a function $f:\mathbb N\to\mathbb N$ such that every $f(k)$-connected graph is $k$-linked, for all $k\in\mathbb N$.`,
      idea: String.raw`Take $f(k)=h(3k)+2k$ with $h$ from Lemma 3.5.1. An $f(k)$-connected $G$ has average degree $\ge h(3k)$, so it contains a subdivided $K^{3k}$, $K$, with branch vertices $U$. Given terminals $s_1,\dots,s_k,t_1,\dots,t_k$, Menger's theorem ($\kappa\ge 2k$) gives disjoint paths $P_i$ from $s_i$ and $Q_i$ from $t_i$ to $U$, without inner vertices in $U$; choose them with as few edges outside $K$ as possible. Let $u_1,\dots,u_k$ be the unused branch vertices, $L_i$ and $M_i$ the subdivided edges of $K$ from $u_i$ to the ends of $P_i$ and $Q_i$, and $v_i$, $w_i$ their first vertices on any path. Minimality forces $v_i\in P_i$ and $w_i\in Q_i$, so the paths $s_iP_iv_iL_iu_iM_iw_iQ_it_i$ are disjoint.`,
      caption: String.raw`Step through the proof for $k=2$ on a graph containing a subdivided $K^6$ (blue, branch vertices gold). The Menger paths to $U$ are found by a minimum-cost flow that charges only edges outside $K$; then the unused branch vertices $u_1,u_2$, the subdivided edges $L_i$, $M_i$ (dashed), the first hits $v_i$, $w_i$ (ringed), and finally the two disjoint linking paths. Click the outer vertices to choose the terminals (each click gives the next missing label). The construction needs only $K$ and the $2k$ Menger paths; high connectivity is what guarantees both.`,
      deps: ['graph-3.5.1', 'graph-3.3.1', 'graph-3.5.1a'], refs: ['Diestel §3.5'], tags: ['linkage', 'Menger', 'topological minors'],
      viz(v) {
        const J = (() => {
          const P = {}, E = [], cx = 5, cy = 3.3, R = 2.45, Kset = new Set(), U = [...Array(6).keys()].map((i) => 'u' + i);
          U.forEach((u, i) => { const a = Math.PI / 2 - (Math.PI / 3) * i; P[u] = [cx + R * 1.25 * Math.cos(a), cy + R * Math.sin(a)]; });
          const sid = (i, j) => 's' + Math.min(i, j) + Math.max(i, j);
          for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
            const d = Math.min(j - i, 6 - (j - i)), t = d === 3 ? [0.34, 0.5, 0.66][i] : 0.5, [x1, y1] = P[U[i]], [x2, y2] = P[U[j]];
            P[sid(i, j)] = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
            E.push([U[i], sid(i, j)], [sid(i, j), U[j]]); Kset.add(U[i] + '|' + sid(i, j)); Kset.add(sid(i, j) + '|' + U[j]);
          }
          for (let i = 0; i < 6; i++) { const a = Math.PI / 2 - (Math.PI / 3) * i - Math.PI / 6; P['t' + i] = [cx + 4.55 * Math.cos(a), cy + 3.0 * Math.sin(a)]; E.push(['t' + i, sid(i, (i + 1) % 6)], ['t' + i, 't' + ((i + 1) % 6)]); }
          for (let i = 0; i < 6; i++) { const d = sid(i, (i + 2) % 6); E.push([d, sid(i, (i + 1) % 6)], [d, sid((i + 1) % 6, (i + 2) % 6)]); }
          for (let i = 0; i < 3; i++) { const l = sid(i, i + 3); E.push([l, sid((i + 1) % 6, (i + 5) % 6)], [l, sid((i + 2) % 6, (i + 4) % 6)]); }
          const spec = F(P, E); spec.nodes.forEach((n) => { n.label = ''; });
          return { spec, Kset, U, sid };
        })();
        const s = gstage(v, { height: 360, x: [0, 10], y: [0, 6.6] });
        const G = v.graph(s, { ...J.spec, r: 10 });
        let term = ['t0', 't3', 't1', 't4'];
        G.onClick = ({ node }) => {
          if (!node || K(node.id)[0] !== 't') return true; const id = K(node.id), i = term.indexOf(id);
          if (i >= 0) term[i] = null; else { const j = term.indexOf(null); if (j >= 0) term[j] = id; else if (term.length < 4) term.push(id); }
          S.reset({ at: 'end' }); return true;
        };
        const inK = (H, k) => { const [a, b] = H.E[k], x = K(H.ids[a]), y = K(H.ids[b]); return J.Kset.has(x + '|' + y) || J.Kset.has(y + '|' + x); };
        function frames() {
          const H = ix(G), L = (u) => K(H.ids[u]);
          if (term.length < 4 || term.includes(null)) return [{ H, note: 'Choose four terminals $s_1, t_1, s_2, t_2$ among the outer vertices.' }];
          const T = term.map((id) => H.at(id)), U = J.U.map((id) => H.at(id));
          const mc = minCostPaths(H, T, U, (k) => (inK(H, k) ? 0 : 1)); if (mc.paths.length < 4) return [{ H, note: 'Fewer than 4 disjoint paths to $U$.' }];
          const byStart = new Map(mc.paths.map((p) => [p[0], p])), Pi = [byStart.get(T[0]), byStart.get(T[2])], Qi = [byStart.get(T[1]), byStart.get(T[3])];
          const ends = new Set(mc.paths.map((p) => p[p.length - 1])), free = U.filter((u) => !ends.has(u));
          const onAny = new Map(); mc.paths.forEach((p, i) => p.forEach((x) => onAny.set(x, i)));
          const subEdge = (u, w) => { const iu = J.U.indexOf(L(u)), iw = J.U.indexOf(L(w)); return [u, H.at(J.sid(iu, iw)), w]; };
          const Li = [0, 1].map((i) => subEdge(free[i], Pi[i][Pi[i].length - 1])), Mi = [0, 1].map((i) => subEdge(free[i], Qi[i][Qi[i].length - 1]));
          const first = (path) => path.find((x) => onAny.has(x));
          const vi = Li.map(first), wi = Mi.map(first);
          const link = [0, 1].map((i) => { const a = Pi[i].slice(0, Pi[i].indexOf(vi[i]) + 1), b = Li[i].slice(0, Li[i].indexOf(vi[i])).reverse(), c2 = Mi[i].slice(1, Mi[i].indexOf(wi[i]) + 1), d = Qi[i].slice(0, Qi[i].indexOf(wi[i])).reverse(); return [...a, ...b, ...c2, ...d]; });
          const base = { H, Pi, Qi, free, Li, Mi, vi, wi, link };
          const nm = (u) => (L(u)[0] === 'u' ? `u${sub(+L(u)[1] + 1)}` : L(u));
          return [
            { ...base, st: 0, note: `$K$: a subdivided $K^6$ (blue) with branch vertices $U$ (gold). We must link $s_1$–$t_1$ and $s_2$–$t_2$.` },
            { ...base, st: 1, note: `Menger: 4 disjoint paths from the terminals to $U$, no inner vertex in $U$, using as few edges outside $K$ as possible (${mc.total} here).` },
            { ...base, st: 2, note: `Two branch vertices are unused: they become $u_1$, $u_2$. $L_i$ and $M_i$ are the subdivided edges of $K$ from $u_i$ to the ends of $P_i$ and $Q_i$ (dashed).` },
            { ...base, st: 3, note: `$v_i$, $w_i$: the first vertices of $L_i$, $M_i$ on any of the paths (ringed) — by minimality they lie on $P_i$ and $Q_i$.` },
            { ...base, st: 4, note: `The paths $s_iP_iv_iL_iu_iM_iw_iQ_it_i$ are disjoint: $G$ links the two pairs.` },
          ].map((f) => ({ ...f, nm }));
        }
        const S = v.steps({ frames, speed: 0.7, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, H = ix(G); if (!f.H) return;
          const lab = (id) => { const i = term.indexOf(K(id)); return i < 0 ? '' : `${i % 2 ? 't' : 's'}${sub(Math.floor(i / 2) + 1)}`; };
          const kE = (e) => inK(H, H.eix.get(e));
          const pmP = f.st >= 1 && f.st < 4 ? pathMap(H, [...f.Pi, ...f.Qi]) : new Map(), pmL = f.st >= 2 && f.st < 4 ? pathMap(H, [...f.Li, ...f.Mi]) : new Map(), pmF = f.st === 4 ? pathMap(H, f.link) : new Map();
          const colP = (i) => (i < 2 ? PC[i] : PC[i - 2]);
          G.draw({
            edgeColor: (e) => (pmF.has(e) ? PC[pmF.get(e)] : pmP.has(e) ? colP(pmP.get(e)) : pmL.has(e) ? 'red' : kE(e) ? 'accent' : 'faint'),
            edgeWidth: (e) => (pmF.has(e) ? 5 : pmP.has(e) ? 4.5 : pmL.has(e) ? 3 : kE(e) ? 2.2 : 1.1), edgeDash: (e) => pmL.has(e) && !pmP.has(e),
            nodeFill: (id) => { const i = term.indexOf(K(id)); if (i >= 0) return PC[Math.floor(i / 2)]; return J.U.includes(K(id)) ? 'gold' : null; },
            nodeLabel: (id) => lab(id) || (f.free && f.st >= 2 && f.free.includes(H.at(id)) ? `u${sub(f.free.indexOf(H.at(id)) + 1)}` : ''),
            nodeRing: (id) => (f.st === 3 && f.vi && (f.vi.includes(H.at(id)) || f.wi.includes(H.at(id))) ? 'red' : null),
          });
        });
        v.legend([['accent', '$K = TK^6$'], ['gold', 'branch vertices $U$', { dot: true }], ['orange', 'pair 1'], ['purple', 'pair 2'], ['red', '$L_i$, $M_i$', { dash: true }]]);
        v.readout(() => {
          const f = S.frames[S.n - 1]; if (!f || !f.link) return 'choose four terminals';
          const used = new Set(); let ok = true; f.link.forEach((p) => p.forEach((x) => { if (used.has(x)) ok = false; used.add(x); }));
          const kap = kappa(f.H).k;
          return `linking paths of lengths ${f.link.map((p) => p.length - 1).join(' and ')} · disjoint ${ok ? '✓' : '✗'} · this graph has $\\kappa = ${kap}$: far below $f(2) = h(6) + 4$, but it already contains the $TK^6$ and the four Menger paths the proof needs`;
        });
      },
    },
    {
      num: '3.5.3', kind: 'Theorem', name: 'Thomas–Wollan: 2k-connected and dense implies k-linked', credit: 'Thomas & Wollan, 2005',
      statement: String.raw`Let $G$ be a graph and $k\in\mathbb N$. If $G$ is $2k$-connected and $\varepsilon(G)\ge 8k$ (that is, $\|G\|\ge 8k\,|G|$), then $G$ is $k$-linked. Since $2\varepsilon(G)\ge\delta(G)\ge\kappa(G)$, every $16k$-connected graph is $k$-linked: $f(k)=16k$ works in Theorem 3.5.2.`,
      idea: String.raw`Diestel proves a stronger statement $(*)$ by induction: if $V\setminus X$ is *heavy* (it meets more than $8k$ times as many edges as it has vertices) and every *small* $X$-separation leaves a *light* far side, then $X$ is linked. One may assume there is no linked $X$-separation; contracting an edge shows every edge outside $X$ lies in at least $8k-1$ triangles; deleting an edge bounds the minimum degree outside $X$ by $16k-1$. The neighbourhood of a vertex of minimum degree is then a small dense graph $H$ with $\delta(H)\ge8k\ge|H|/2$, which contains a $k$-linked subgraph $L$ (Lemma 3.5.4); Menger's theorem joins $X$ to $L$ by disjoint paths, linking $X$.`,
      caption: String.raw`Each dot is a graph, placed by its connectivity $\kappa$ (capped at 10) and its edge density $\varepsilon=\|G\|/|G|$, coloured by whether it is 2-linked (exhaustively for at most 10 vertices, otherwise tested on 300 random terminal sets). The shaded corner $\kappa\ge4$, $\varepsilon\ge16$ is where Thomas–Wollan guarantees 2-linkedness: every dot there is green. Outside it the theorem is silent — some sparse graphs are 2-linked anyway, planar ones like the cube and the grid are not. Sliders make a random graph $G(n,p)$ (ringed); its graph and a linkage of random terminals are drawn on the left.`,
      deps: ['graph-3.5.1a'], see: ['graph-3.5.4'], refs: ['Diestel §3.5'], tags: ['linkage', 'density'],
      viz(v) {
        const nS = v.slider('$n$', 8, 44, 40, { int: true }), pS = v.slider('$p$', 0.1, 1, 0.9, { step: 0.01 });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 320 });
        const c = v.stage({ x: [0, 10.6], y: [0, 22], axes: 'box', gutter: true, height: 320, xlabel: 'connectivity $\\kappa$', ylabel: '$\\varepsilon = \\|G\\|/|G|$', xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 4, 8, 12, 16, 20] });
        const G = v.graph(s, { nodes: [], edges: [], r: 7, draggable: false });
        let tseed = 1;
        v.button('New terminals', () => { tseed++; });
        const test = (H, sd) => { const ex = H.n <= 10; const r = kLinked(H, 2, ex ? {} : { sample: 300, rng: v.rng(sd) }); return { ok: r.ok, ex }; };
        const lib = [];
        const add = (H, name) => { const kap = kappaFast(H, 10); lib.push({ name, kap, eps: H.m / H.n, ...test(H, 11 + lib.length) }); };
        const nm = (spec) => ix({ nodes: spec.nodes, edges: spec.edges });
        add(nm(named('cube')), 'cube'); add(nm(named('octahedron')), 'octahedron'); add(nm(named('petersen')), 'Petersen'); add(nm(named('complete', 5)), '$K^5$'); add(nm(named('kmn', 3, 3)), '$K_{3,3}$'); add(nm(wheel(7)), 'wheel'); add(nm(named('prism', 5)), 'prism');
        add(nm(GRID()), 'triangulated grid'); add(nm(named('complete', 8)), '$K^8$');
        const R = v.rng(5);
        for (const [n, p] of [[10, 0.3], [10, 0.5], [12, 0.45], [14, 0.6], [18, 0.5], [22, 0.7], [26, 0.75], [30, 0.85], [34, 0.98], [36, 0.95], [40, 0.88], [40, 0.95], [44, 0.82], [44, 0.9]]) add(ixOf(n, gnp(n, p, R)), `$G(${n}, ${p})$`);
        const cur = cacheBy((G, key) => { const [n, p] = key.split('|').map(Number), H = ixOf(n, gnp(n, p, v.rng(Math.round(n * 1000 + p * 100)))); const kap = kappaFast(H, 10); return { H, kap, eps: H.m / H.n, ...test(H, 3) }; });
        v.render(() => {
          const key = `${nS.value}|${pS.value}`, C = cur(G, key), H = C.H;
          if (G._key !== key) { G._key = key; G.set({ nodes: [...Array(H.n).keys()].map((i) => ({ id: i, label: '' })), edges: H.E.map(([a, b]) => [a, b]) }); G.layout('circle'); }
          // a random placement and its linkage
          const r = v.rng(tseed * 31 + H.n), pick = []; while (pick.length < 4 && H.n >= 4) { const u = Math.floor(r() * H.n); if (!pick.includes(u)) pick.push(u); }
          const lk = pick.length === 4 ? linkPairs(H, [[pick[0], pick[1]], [pick[2], pick[3]]], { budget: 2e5 }) : null, pm = lk && lk.paths ? pathMap(ix(G), lk.paths) : new Map();
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e)] : 'faint'), edgeWidth: (e) => (pm.has(e) ? 4 : 0.6), nodeFill: (id) => { const i = pick.indexOf(+id); return i < 0 ? null : PC[Math.floor(i / 2)]; }, nodeColor: () => 'muted' });
          s.corner(lk ? (lk.paths ? 'these terminals are linked' : lk.exact ? 'these terminals cannot be linked' : 'search cut short') : 'too few vertices', 'tl', { color: lk && lk.paths ? 'green' : 'red', weight: 700, size: 12.5, plate: true });
          c.rect(4, 16, 10.6, 22, { fill: 'green', fillAlpha: 0.1, color: 'green', width: 1 });
          c.text('κ ≥ 4, ε ≥ 16: k-linked', 10.4, 21.3, { size: 11.5, color: 'green', align: 'right', baseline: 'top' });
          for (const P of lib) c.dot(Math.min(P.kap, 10), Math.min(P.eps, 21.8), { r: 5, color: P.ok ? 'green' : 'red', fill: P.ok ? 'green' : 'red', fillAlpha: 0.5 });
          c.dot(Math.min(C.kap, 10), Math.min(C.eps, 21.8), { r: 10, hollow: true, color: 'ink' });
        });
        v.legend([['green', '2-linked', { dot: true }], ['red', 'not 2-linked', { dot: true }], ['ink', 'your $G(n,p)$', { dot: true }]]);
        v.readout(() => {
          const C = cur(G, `${nS.value}|${pS.value}`), inRegion = C.kap >= 4 && C.eps >= 16, bad = lib.filter((P) => P.kap >= 4 && P.eps >= 16 && !P.ok).length;
          return `$G(${nS.value}, ${pS.value})$: $\\kappa ${C.kap >= 10 ? '\\ge' : '='} ${C.kap}$, $\\varepsilon = ${C.eps.toFixed(1)}$ · ${C.ok ? '2-linked' : '**not 2-linked**'} (${C.ex ? 'all placements' : '300 random placements'}) · ${inRegion ? 'inside the Thomas–Wollan corner ✓' : 'outside the corner: the theorem says nothing'} · counterexamples in the corner: ${bad}`;
        });
      },
    },
    {
      num: '3.5.4', kind: 'Lemma', name: 'Dense small graphs contain k-linked subgraphs',
      statement: String.raw`Every graph $H$ with $\delta(H)\ge 8k\ge |H|/2$ has a $k$-linked subgraph.`,
      idea: String.raw`If $H$ is not $k$-linked, take terminals that cannot be linked and a maximal set $\mathcal P$ of short linking paths (length $\le7$, total length minimal), and let $J$ be spanned by the terminals and these paths, $K:=H-J$. Each vertex of $K$ has at most three neighbours on each path, so $\delta(K)\ge5k$ and $|K|\le14k$. The vertices within distance 2 of a neighbour of $s_1$ and of $t_1$ in $K$ form two disjoint sets with no edges between them that together exhaust $K$, so $K$ is disconnected; its smaller component $C$ then satisfies $2\delta(C)\ge|C|+3k$. In $C$ any two vertices have at least $3k$ common neighbours, at least $k$ of them outside any $2k$ terminals — so pairs can be linked one by one by paths of length 2, and $C$ is $k$-linked.`,
      caption: String.raw`The final step of the proof, on a graph $C$ with $|C|$ vertices and minimum degree $\delta$ (sliders), for $k=2$: when $2\delta(C)\ge|C|+3k$, any two vertices have at least $2\delta-|C|\ge3k$ common neighbours. Click vertices to move the terminals $s_1,t_1,s_2,t_2$; each pair is linked through a common neighbour outside the terminals (gold), as in the proof. The histogram counts, over all pairs of vertices, their common neighbours: the guaranteed minimum $2\delta-|C|$ (green) never drops below the needed $3k$ (red) while the inequality holds. Lower $\delta$ to break it.`,
      deps: ['graph-3.3.1', 'graph-3.5.1a'], see: ['graph-3.5.3'], refs: ['Diestel §3.5'], tags: ['linkage', 'density'],
      viz(v) {
        const kk = 2;
        const nS = v.slider('$|C|$', 10, 16, 14, { int: true }), dS = v.slider('$\\delta$', 4, 15, 11, { int: true });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], axes: false, equal: true, height: 320 });
        const c = v.stage({ x: [-0.5, 16.5], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'common neighbours $|N(u)\\cap N(v)|$', ylabel: 'pairs $\\{u, v\\}$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 11 });
        let term = [0, 7, 3, 10];
        G.onClick = ({ node }) => { if (!node) return true; const u = +node.id, i = term.indexOf(u); if (i >= 0) term[i] = null; else { const j = term.indexOf(null); if (j >= 0) term[j] = u; } return true; };
        const make = cacheBy((G, key) => {
          const [n, d] = key.split('|').map(Number), r = v.rng(n * 31 + d), A = Array.from({ length: n }, () => new Set());
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { A[i].add(j); A[j].add(i); }
          const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
          for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
          for (const [a, b] of pairs) if (A[a].size > d && A[b].size > d) { A[a].delete(b); A[b].delete(a); }
          const E = []; for (let i = 0; i < n; i++) for (const j of A[i]) if (i < j) E.push([i, j]);
          const cn = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { let x = 0; for (const w of A[i]) if (A[j].has(w)) x++; cn.push(x); }
          return { n, A, E, cn, delta: Math.min(...A.map((a) => a.size)) };
        });
        v.render(() => {
          const key = `${nS.value}|${Math.min(dS.value, nS.value - 1)}`, M = make(G, key), n = M.n;
          if (G._key !== key) { G._key = key; G.set({ nodes: [...Array(n).keys()].map((i) => ({ id: i, label: '' })), edges: M.E }); G.layout('circle'); }
          term = term.map((u) => (u != null && u < n ? u : null));
          // link the pairs greedily by paths of length 2 through common neighbours outside the terminals
          const Y = new Set(term.filter((u) => u != null)), used = new Set(), links = [];
          for (let i = 0; i < kk; i++) { const a = term[2 * i], b = term[2 * i + 1]; if (a == null || b == null) { links.push(null); continue; } const w = [...M.A[a]].find((x) => M.A[b].has(x) && !Y.has(x) && !used.has(x)); if (w != null) used.add(w); links.push(w == null ? false : [a, w, b]); }
          const H = ix(G), pm = pathMap(H, links.filter(Boolean));
          G.draw({ edgeColor: (e) => (pm.has(e) ? PC[pm.get(e)] : 'faint'), edgeWidth: (e) => (pm.has(e) ? 4.5 : 0.8),
            nodeFill: (id) => { const i = term.indexOf(+id); return i >= 0 ? PC[Math.floor(i / 2)] : used.has(+id) ? 'gold' : null; },
            nodeLabel: (id) => { const i = term.indexOf(+id); return i < 0 ? '' : `${i % 2 ? 't' : 's'}${sub(Math.floor(i / 2) + 1)}`; } });
          const fail = links.some((l) => l === false);
          s.corner(fail ? 'some pair has no free common neighbour' : 'pairs linked by paths of length 2', 'tl', { color: fail ? 'red' : 'green', weight: 700, size: 12.5, plate: true });
          // histogram
          const counts = new Array(n + 1).fill(0); M.cn.forEach((x) => counts[x]++); const top = Math.max(...counts);
          c.setView([-0.5, n + 0.5], [0, top * 1.18]);
          c.bars(counts, { x0: 0, color: (x, i) => (i < 3 * kk ? 'red' : 'accent'), fillAlpha: 0.55 });
          c.vline(3 * kk - 0.5, { color: 'red', width: 2, dash: [5, 4] }); c.text('3k', 3 * kk - 0.6, top * 1.12, { size: 12, color: 'red', align: 'right' });
          const g = 2 * M.delta - n; c.vline(g - 0.5, { color: 'green', width: 2 }); c.text('2δ − |C|', g - 0.4, top * 1.04, { size: 12, color: 'green', align: 'left' });
        });
        v.legend([['red', 'needed: $3k$', { dash: true }], ['green', 'guaranteed: $2\\delta - |C|$'], ['gold', 'linking common neighbours', { dot: true }]]);
        v.readout(() => {
          const M = make(G, `${nS.value}|${Math.min(dS.value, nS.value - 1)}`), mn = Math.min(...M.cn), ok = 2 * M.delta >= M.n + 3 * kk;
          return `$|C| = ${M.n}$, $\\delta(C) = ${M.delta}$, $k = ${kk}$ · $2\\delta(C) = ${2 * M.delta}$ ${ok ? '\\ge' : '<'} $|C| + 3k = ${M.n + 3 * kk}$ · fewest common neighbours of a pair: ${mn} ${mn >= 3 * kk ? `≥ 3k = ${3 * kk} ✓` : `< 3k = ${3 * kk}`}${ok ? ` (guaranteed ≥ ${2 * M.delta - M.n})` : ''}`;
        });
      },
    },
  ],
};
