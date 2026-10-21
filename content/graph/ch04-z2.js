// Graph Theory (Diestel) — Chapter 4, part Z2 (§§4.5–4.6: planarity criteria, Schnyder woods, plane duals, abstract duals)
import {
  K, ix, comps, PALETTE, named, gstage, cacheBy, wheel, isKconn, amask, allCycles, allBonds, nonSepInduced,
  faceWalks, dmp, tutte, spread, isPlanar, faceKey, ixE, loadSpec, norm, ekey2, TAU, simpleBasis, dualOf, isBondMask, isCycleMask,
  cyclesToBonds, randomTriangulation, triDraw, schnyder, schnyderRegions, crossings,
} from './ch04-z.shared.js';

import { abstractDualAudit, incidenceRealizer, schnyderCertificate, drawingDefects } from './ch04-duality-audit.shared.js';

// ---------- presets (same graphs as part Z1) ----------
const K24 = () => ({ nodes: [[0, 0], [3, 0], [1.5, 1.7], [1.5, 0.6], [1.5, -0.6], [1.5, -1.7]].map(([x, y], i) => ({ id: i, x, y })), edges: [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5]] });
const K4K4 = () => ({ nodes: [[0, 0.8], [0, -0.8], [-1.4, 0], [-0.6, 0.15], [1.4, 0], [0.6, -0.15]].map(([x, y], i) => ({ id: i, x, y })), edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3], [0, 4], [0, 5], [1, 4], [1, 5], [4, 5]] });
const PRE = {
  cube: () => named('cube'), prism: () => named('prism', 5), w5: () => wheel(5), oct: () => named('octahedron'), k4: () => named('complete', 4),
  k5: () => named('complete', 5), k33: () => named('kmn', 3, 3), pet: () => named('petersen'), k24: K24, k4k4: K4K4,
};
const PLAB = { cube: 'cube', prism: '5-prism', w5: 'wheel $W_5$', oct: 'octahedron', k4: '$K^4$', k5: '$K^5$', k33: '$K_{3,3}$', pet: 'Petersen', k24: '$K_{2,4}$', k4k4: 'two $K^4$ along an edge' };
const opts = (keys) => keys.map((k) => ({ value: k, label: PLAB[k] }));
const norms = {}; const NORM = (k) => (norms[k] ||= norm(PRE[k]()));
const lab1 = (i) => String(i + 1);
const outerOf = (faces) => faces.reduce((b, f, i) => (f.length > faces[b].length ? i : b), 0);
const CX = 5, CY = 3.2, SC = 2.2;
const toS = (p) => [CX + SC * p[0], CY + SC * p[1]];
/** Plane setup of a planar 2-connected preset: straight-line drawing (stage coordinates), faces, plane dual. */
function plane(N, outer) {
  const faces = dmp(N.n, N.E); const o = outer == null ? outerOf(faces) : ((outer % faces.length) + faces.length) % faces.length;
  const rel = tutte(N.n, N.E, faces, o), P = rel.map(toS), H = ixE(N.n, N.E), F = faceWalks(H, P);
  const dual = dualOf(H, F.map((f) => f.walk)), oi = F.findIndex((f) => f.area < 0);
  const cen = F.map((f, i) => (i === oi ? null : [f.walk.reduce((a, u) => a + P[u][0], 0) / f.walk.length, f.walk.reduce((a, u) => a + P[u][1], 0) / f.walk.length]));
  const c = [F[oi].walk.reduce((a, u) => a + P[u][0], 0) / F[oi].walk.length, F[oi].walk.reduce((a, u) => a + P[u][1], 0) / F[oi].walk.length];
  const R = 1.22 * Math.max(...P.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
  return { N, H, P, F, dual, oi, cen, ring: { c, R }, pos: P };
}
const mid = (P, [a, b]) => [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2];
/** Polyline of the dual edge crossing primal edge k. */
function dualLine(S, k) {
  const [a, b] = S.H.E[k], de = S.dual.edges[k], m = mid(S.P, [a, b]), { c, R } = S.ring;
  const end = (f) => { if (f !== S.oi) return S.cen[f]; const d = Math.hypot(m[0] - c[0], m[1] - c[1]) || 1; return [c[0] + ((m[0] - c[0]) / d) * R, c[1] + ((m[1] - c[1]) / d) * R]; };
  return [end(de.a), m, end(de.b)];
}
function drawDual(s, S, { hi = new Set(), color = 'orange', ring = true, vtx = true } = {}) {
  if (ring) s.circle(S.ring.c[0], S.ring.c[1], S.ring.R, { color, dash: true, width: 1.2, alpha: 0.55 });
  S.H.E.forEach((_, k) => { const on = hi.has(k); s.path(dualLine(S, k), { color: on ? 'red' : color, width: on ? 3.4 : 1.5, alpha: on ? 1 : 0.8 }); });
  if (vtx) S.cen.forEach((p) => { if (p) s.dot(p[0], p[1], { r: 4.5, color, hollow: true }); });
}
function shadeFaces(s, S, colOf, alpha = 0.22) { S.F.forEach((f, i) => { if (i === S.oi) return; const c = colOf(i); if (c) s.poly(f.walk.map((u) => S.P[u]), { fill: c, fillAlpha: alpha, stroke: false }); }); }
function setPlane(G, S, fit) { G.set({ nodes: S.H.ids.map((id, i) => ({ id, x: S.P[i][0], y: S.P[i][1], label: lab1(i) })), edges: S.N.E.map(([a, b]) => [a, b]) }); G.layout(fit ? 'fit' : 'none'); }
const CYC = (H) => allCycles(H, 3000).sort((p, q) => p.vs.length - q.vs.length);
const dualIx = (S) => ix({ nodes: S.F.map((_, i) => ({ id: i })), edges: S.dual.edges.map((e) => [e.a, e.b]) }, { multi: true });

export default {
  collection: 'graph',
  chapter: 4,
  items: [
    // =====================================================================================================  4.5
    {
      num: '4.5.1', kind: 'Theorem', name: 'MacLane’s planarity criterion',
      statement: String.raw`A finite graph is planar if and only if its cycle space has a **sparse basis** (also called a simple basis): every edge lies in at most two basis elements. Equivalently, such a basis can be chosen to consist of edge sets of individual cycles.`,
      idea: String.raw`For a connected plane graph, the boundaries of its bounded faces, interpreted as edge sets modulo two, form a sparse basis of the cycle space: every edge is incident with at most two faces. Apply this component by component for a disconnected graph, whose cycle-space dimension is $m-n+c$. A boundary vector need not be a single cycle; split it into edge-disjoint cycles and extract a basis without increasing edge usage. Conversely, Diestel proves that a sparse basis implies planarity (4.5.1), using inheritance under edge deletion and subdivision, then dimension and girth counts to exclude $K^5$ and $K_{3,3}$. The finite searches here illustrate that theorem on the offered graphs; they are not its general proof.`,
      caption: String.raw`The app searches through all cycles of the graph for a family of $m-n+1$ independent cycles in which every edge is used at most twice. A found basis is a positive certificate. A completed unsuccessful search certifies nonexistence; a search stopped by its budget is inconclusive. A partial independent family found by the search is shown when no basis is found, without a maximum-size claim. The matrix on the right has one row per cycle of the family and one column per edge; the bottom row counts how many cycles use the edge. Use the slider to look at one cycle at a time.`,
      deps: ['graph-1.9.5', 'graph-4.2.6', 'graph-4.4.6', 'graph-4.2.2'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 4.5.1, p. 112'], tags: ['planar', 'cycle space'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Planar_graph#Other_criteria' },
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4', 'k33', 'k5', 'pet']), 'cube', { onChange: () => load() });
        const which = v.slider('cycle shown (0 = all)', 0, 8, 0, { int: true });
        const sL = gstage(v, { height: 330 }), sR = v.stage({ x: [0, 16], y: [-8, 1.5], axes: false, height: 330, title: 'cycles of the family (rows) and the edges they use (columns)' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, draggable: false });
        let N, H, res, fam, load2, HG;
        function load() { N = NORM(ex.value); H = ixE(N.n, N.E); res = simpleBasis(H); fam = res.basis || res.best || []; load2 = new Int32Array(H.m); fam.forEach((c) => c.E.forEach((x, k) => { if (x) load2[k]++; })); loadSpec(G, { nodes: N.pos.map(([x, y], i) => ({ id: i, x, y, label: lab1(i) })), edges: N.E.map(([a, b]) => [a, b]), layout: 'fit' }); HG = ix(G); }
        load();
        v.render(() => {
          const w = Math.min(which.value, fam.length), colE = (e) => { const k = HG.eix.get(e); return k == null ? null : w ? (fam[w - 1].E[k] ? 'green' : 'faint') : load2[k] === 2 ? 'orange' : load2[k] === 1 ? 'accent' : 'faint'; };
          G.draw({ edgeColor: colE, edgeWidth: (e) => { const k = HG.eix.get(e); return w ? (fam[w - 1].E[k] ? 4.2 : 1.2) : 1.5 + 1.2 * load2[k]; }, edgeLabel: (e) => (w ? null : String(load2[HG.eix.get(e)])), edgeLabelColor: () => 'ink' });
          const m = H.m, rows = fam.length, cw = Math.min(1, 15.5 / m);
          sR.setView([-0.4, Math.max(m * cw, 6) + 0.4], [-(Math.max(rows, 4) + 2.3), 1.3]);
          fam.forEach((c, r) => { for (let k = 0; k < m; k++) if (c.E[k]) sR.rect(k * cw + 0.06, -r - 0.9, (k + 1) * cw - 0.06, -r - 0.1, { fill: !w || w - 1 === r ? PALETTE[r % PALETTE.length] : 'faint', fillAlpha: 0.75, stroke: false }); });
          const y = -Math.max(rows, 4) - 1.2;
          for (let k = 0; k < m; k++) sR.text(String(load2[k]), (k + 0.5) * cw, y, { size: 12, color: load2[k] > 2 ? 'red' : load2[k] === 2 ? 'orange' : 'ink', align: 'center', baseline: 'middle' });
          sR.text('uses of the edge', -0.2, y + 0.9, { size: 11, color: 'muted', align: 'left' });
        });
        v.legend([['orange', 'edge in two basis cycles', { dot: true }], ['accent', 'edge in one', { dot: true }], ['green', 'cycle shown', { dash: false }]]);
        v.readout(() => res.tooBig ? 'graph too large for the exhaustive search' : res.basis
          ? `$n=${H.n}$, $m=${H.m}$, cycle space dimension $m-n+1=${res.dim}$ · a **simple basis exists**: ${res.basis.length} cycles, every edge in at most two of them ✓ (${res.basis.map((c) => c.vs.length).join(', ')} edges long) → consistent with planarity: **${isPlanar(H) ? 'planar' : 'NOT planar'}**`
          : `$n=${H.n}$, $m=${H.m}$, cycle space dimension $m-n+1=${res.dim}$ · searched all ${res.nCycles} cycles: ${res.exhausted?'**no simple basis exists** (completed search)':'**no basis found within the search budget** (inconclusive)'}; partial independent family found: ${res.best.length} cycles → the graph is **${isPlanar(H) ? 'planar?!' : 'not planar'}**`);
      },
    },
    {
      num: '4.5.2', kind: 'Theorem', name: 'Kelmans’s planarity criterion for 3-connected graphs',
      statement: String.raw`A finite 3-connected graph is planar if and only if every edge lies on at most two non-separating induced cycles (equivalently, on exactly two).`,
      idea: String.raw`In a plane drawing of a 3-connected graph the non-separating induced cycles are exactly the facial cycles (4.2.7), and an edge borders exactly two faces (4.2.2); so planar graphs satisfy the condition with equality. For the converse one uses that the non-separating induced cycles generate the cycle space (3.2.6): if every edge lay on at most two of them, a suitable choice of $m-n+1$ of them would form a simple basis, and MacLane's theorem 4.5.1 applies.`,
      caption: String.raw`Each edge is labelled with the number of non-separating induced cycles that contain it (all of them found by brute force). In a planar graph every label is 2; in a non-planar 3-connected graph some edge is on three or more (red). Click an edge, then use the slider to run through the non-separating induced cycles through it; the cycle shown is drawn in green.`,
      deps: ['graph-3.2.6', 'graph-4.2.7', 'graph-4.2.2'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 4.5.2, p. 113'], tags: ['planar', 'induced cycles'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=21' },
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4', 'k33', 'k5', 'pet']), 'cube', { onChange: () => load() });
        const which = v.slider('cycle through the selected edge', 1, 8, 1, { int: true });
        const s = gstage(v, { height: 350 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        let N, H, HG, cnt, ns, sel = 0;
        function load() {
          N = NORM(ex.value); H = ixE(N.n, N.E); const A = amask(H);
          ns = allCycles(H, 4000).filter((c) => nonSepInduced(H, A, c)); cnt = new Int32Array(H.m); ns.forEach((c) => c.E.forEach((x, k) => { if (x) cnt[k]++; }));
          loadSpec(G, { nodes: N.pos.map(([x, y], i) => ({ id: i, x, y, label: lab1(i) })), edges: N.E.map(([a, b]) => [a, b]), layout: 'fit' }); HG = ix(G); sel = 0;
        }
        load();
        G.onClick = ({ edge }) => { if (!edge) return false; const k = HG.eix.get(edge); if (k != null) { sel = k; which.set(1); } return true; };
        v.render(() => {
          const through = ns.filter((c) => c.E[sel]), w = Math.min(which.value, through.length), cyc = through[w - 1];
          G.draw({
            edgeColor: (e) => { const k = HG.eix.get(e); return cyc && cyc.E[k] ? 'green' : cnt[k] > 2 ? 'red' : null; },
            edgeWidth: (e) => { const k = HG.eix.get(e); return cyc && cyc.E[k] ? 4.4 : k === sel ? 3 : null; },
            edgeLabel: (e) => String(cnt[HG.eix.get(e)]), edgeLabelColor: (e) => (cnt[HG.eix.get(e)] > 2 ? 'red' : 'ink'),
          });
        });
        v.legend([['red', 'edge on $\\ge3$ such cycles', { dash: false }], ['green', 'cycle shown', { dash: false }]]);
        v.readout(() => {
          const three = isKconn(H, 3).ok, mx = Math.max(...cnt), through = ns.filter((c) => c.E[sel]), planar = isPlanar(H);
          return `${H.n} vertices, ${H.m} edges · 3-connected: **${three ? '✓' : '✗'}** · non-separating induced cycles: **${ns.length}** · largest number through one edge: **${mx}**\nall counts $\\le2$: **${mx <= 2 ? '✓' : '✗'}** ⇔ planar: **${planar ? '✓' : '✗'}** (exact test) ${mx <= 2 === planar ? '✓ the criterion agrees' : ''} · selected edge: ${through.length} cycle${through.length === 1 ? '' : 's'}`;
        });
      },
    },
    {
      num: '4.5.3', kind: 'Theorem', name: 'Schnyder: planar iff incidence poset has dimension ≤ 3',
      statement: String.raw`A finite simple graph $G$ is planar if and only if its **incidence poset** — the set $V\cup E$ with $v<e$ whenever the vertex $v$ is an end of the edge $e$ — has order dimension at most $3$, i.e. it is the intersection of three linear orders.`,
      idea: String.raw`Three suitable vertex orders have no common comparison between distinct vertices and have the following separation property: for every edge $uv$ and vertex $w\notin\{u,v\}$, some order places $w$ above both ends. Insert each edge after its later endpoint in each order; the resulting three orders on vertices and edges realize the incidence poset. Schnyder woods give these vertex orders for planar triangulations: face-count coordinates separate every nonincident vertex-edge pair. The general theorem follows by extending planar graphs to triangulations and restricting orders. For the converse, standard three-order representations admit an edge contraction and inverse vertex-insertion induction that builds a plane triangulation; the theorem is not proved by a failed finite drawing search. See Barrera-Cruz–Haxell, Theorems 1, 4 and 5, and the face-count separation property (R1) in Barrera-Cruz–Haxell–Lubiw.`,
      caption: String.raw`A random plane triangulation with outer vertices $a_1,a_2,a_3$ and its Schnyder wood: each inner edge has one orientation and colour, and each inner vertex has one outgoing edge of each colour. Click an inner vertex to shade the three regions bounded by its root paths. The right drawing uses counts of inner faces in two regions. The readout checks the complete wood rules, distinct vertices and all edge contacts. Toggle the three orders to inspect an actual incidence-poset realizer: $v_i$ names vertex $i$ (the first three are $a_1,a_2,a_3$); the toggled edge labels identify $e_i$. Every ordered pair is checked.`,
      deps: ['graph-4.4.1a', 'graph-4.2.7a', 'graph-4.4.6'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 4.5.3, p. 113', 'Barrera-Cruz & Haxell, A Note on Schnyder’s Theorem, https://arxiv.org/abs/1606.08943', 'Barrera-Cruz, Haxell & Lubiw, Morphing Schnyder drawings of planar triangulations, §2 Theorem 1 and (R1), https://arxiv.org/abs/1411.6186'], see: ['comb-8.1'], tags: ['planar', 'order dimension', 'Schnyder wood'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=21' },
      viz(v) {
        const showOrders = v.toggle('show the three incidence orders',false);
        const nS = v.slider('$n$', 5, 12, 8, { int: true, onChange: () => make() });
        v.button('new triangulation', () => { seed++; make(); });
        const sL = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 350, title: 'Schnyder wood' }), sR = v.stage({ x: [-1, 15], y: [-1, 15], axes: false, equal: true, height: 350, title: 'grid drawing from the region counts' });
        const OC = ['orange', 'teal', 'purple'];
        const G = v.graph(sL, { nodes: [], edges: [], r: 10, draggable: false, directed: true });
        let seed = 1, n, T, W, E, pos, Pg, sel = 3, regs, woodCheck, realizer, coordinates;
        const sp = (p) => [5 + 3.0 * p[0], 3.0 + 3.0 * p[1]];
        function make() {
          n = nS.value; let tries = 0;
          do { const r = v.rng(seed * 8191 + 17 + tries); T = triDraw(randomTriangulation(n, r, 4 + Math.floor(r() * 8))); W = schnyder(n, T.E, T.pos); tries++; } while (!W && tries < 20);
          if(!W)throw new Error('No Schnyder wood found for this triangulation');
          pos = spread(n, T.E, T.pos, 60, [0, 1, 2]); E = T.E;
          woodCheck=schnyderCertificate(n,E,pos,W.out);
          const ed = []; for (let u = 0; u < n; u++) for (const [a, b, c] of W.out[u]) if (!(a < 3 && b < 3)) ed.push({ from: a, to: b, c, directed: true });
          for (const [a, b] of [[0, 1], [1, 2], [0, 2]]) ed.push({ from: a, to: b, c: 0, directed: false });
          G.set({ nodes: pos.map((p, i) => { const q = sp(p); return { id: i, x: q[0], y: q[1], label: i < 3 ? ['a₁', 'a₂', 'a₃'][i] : lab1(i) }; }), edges: ed, directed: true }); G.layout('none');
          const m = 2 * n - 5; regs = []; Pg = [];
          for (let u = 0; u < n; u++) { if (u < 3) { regs.push(null); Pg.push(u === 0 ? [m, 0] : u === 1 ? [0, m] : [0, 0]); continue; } const R = schnyderRegions(n, T.tri, W.out, u); regs.push(R); Pg.push([R.counts[0], R.counts[1]]); }
          coordinates=Pg.map((p,u)=>u<3?[+(u===0)*m,+(u===1)*m,+(u===2)*m]:regs[u].counts);realizer=incidenceRealizer(n,E,coordinates);
          sel = 3; const mm = 2 * n - 5; sR.setView([-1, mm + 1], [-1, mm + 1]);
        }
        make();
        G.onClick = ({ node }) => { if (node && node.id >= 3) sel = node.id; return true; };
        const pathTo = (u, c) => { const ks = [u]; let g = 0; while (u !== c - 1 && g++ < 40) { const e = W.out[u].find((x) => x[2] === c); if (!e) break; u = e[1]; ks.push(u); } return ks; };
        v.render(() => {
          const R = regs[sel], P = pos.map(sp);
          T.tri.forEach((t, i) => { const r = R.reg[i]; if (r >= 0) sL.poly(t.map((u) => P[u]), { fill: OC[r], fillAlpha: 0.2, stroke: false }); });
          const onPath = [1, 2, 3].map((c) => new Set(pathTo(sel, c).flatMap((u, i, a) => (i ? [ekey2(a[i - 1], u)] : []))));
          G.draw({
            edgeColor: (e) => { if (!e.c) return 'muted'; const k = ekey2(e.from, e.to); return OC[e.c - 1]; },
            edgeWidth: (e) => { const k = ekey2(e.from, e.to); return e.c && onPath[e.c - 1].has(k) ? 4.2 : e.c ? 1.8 : 2.6; },
            edgeLabel:e=>showOrders.value?'e'+(E.findIndex(([a,b])=>ekey2(a,b)===ekey2(e.from,e.to))+1):null,
            nodeFill: (id) => (id === sel ? 'gold' : null), nodeRing: (id) => (id < 3 ? 'ink' : null),
          });
          // right panel
          const m = 2 * n - 5;
          for (let t = 0; t <= m; t++) { sR.line(t, 0, t, m - t, { color: 'grid', width: 0.6, alpha: 0.5 }); sR.line(0, t, m - t, t, { color: 'grid', width: 0.6, alpha: 0.5 }); }
          E.forEach(([a, b]) => sR.line(Pg[a][0], Pg[a][1], Pg[b][0], Pg[b][1], { color: 'muted', width: 1.4 }));
          Pg.forEach((p, i) => sR.dot(p[0], p[1], { r: i === sel ? 7 : 4.5, color: i === sel ? 'gold' : 'accent', label: i < 3 ? ['a₁', 'a₂', 'a₃'][i] : lab1(i), labelPos: 'ne' }));
        });
        v.legend([['orange', 'colour 1 (to $a_1$)', { dash: false }], ['teal', 'colour 2 (to $a_2$)', { dash: false }], ['purple', 'colour 3 (to $a_3$)', { dash: false }]]);
        v.readout(() => {
          const R=regs[sel],c=R.counts,tot=c.reduce((a,b)=>a+b,0),defects=drawingDefects(n,E,Pg),name=x=>x<n?'v_{'+(x+1)+'}':'e_{'+(x-n+1)+'}';
          return `vertex ${lab1(sel)}: region face counts **${c.join(', ')}**, total $${tot}=2n-5=${2*n-5}$. Complete wood rules/root paths: **${woodCheck.valid?'pass':'FAIL'}**. Grid drawing defects (coincidences, vertex-edge contacts, crossings): **${defects.length}**. Three orders realize the incidence poset: **${realizer.valid?'yes':'NO'}**, checking all ${realizer.checked} ordered pairs.${showOrders.value?'\n'+realizer.orders.map((L,i)=>'$L_'+(i+1)+'$: '+L.map(x=>'$'+name(x)+'$').join(' < ')).join('\n'):''}`;
        });
      },
    },
    // =====================================================================================================  4.6
    {
      num: '4.6.1a', kind: 'Definition', name: 'Plane duals',
      statement: String.raw`Let $G=(V,E)$ be a finite connected plane multigraph. Loops and parallel edges are allowed; loops and pairs of parallel edges count as cycles. Its **plane dual** $G^*=(V^*,E^*)$ is the multigraph with one vertex $v^*(f)$ in the interior of every face $f$ of $G$ and, for every edge $e$ of $G$, an edge $e^*$ crossing $e$ exactly once and no other edge of $G$, joining the vertices of the two faces on either side of $e$ (a loop if $e$ is a bridge). The dual of a connected plane graph is a connected plane multigraph.`,
      idea: String.raw`The construction exchanges the roles of vertices and faces: $G^*$ has $\ell$ vertices and $m$ edges, where $\ell$ is the number of faces of $G$; the degree of $v^*(f)$ is the length of the boundary walk of $f$. Euler's formula $n-m+\ell=2$ is symmetric under this exchange, and for a connected plane graph one finds $G^{**}\cong G$. Parallel edges arise when two faces share more than one edge, so duals of simple graphs are in general multigraphs. Different drawings of the same abstract graph can have non-isomorphic duals; for 3-connected graphs the drawing is unique (4.3.2), and so is the dual.`,
      caption: String.raw`The finite examples are 2-connected simple plane graphs, drawn in blue. Orange paths show dual incidence: one hollow dot per bounded face, the dashed circle representing a single identified outer-face vertex (its endpoints on the circle are identified; this is a schematic representation), and a dual edge crossing each primal edge. Changing the outer face redraws the same embedding with a different unbounded face; its abstract dual incidences are preserved. $K_{2,4}$ has four faces of length 4 sharing two edges at a time: its dual has parallel edges. Two $K^4$ glued along an edge provide a contrasting 2-connected example whose displayed dual has no parallel pair.`,
      deps: ['graph-4.2.1a', 'graph-1.10.1a'], refs: ['Diestel, Graph Theory, 6th ed. (2025), unnumbered plane-dual definition, pp. 114–115'], tags: ['duality', 'plane graphs'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=22' },
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4', 'k24', 'k4k4']), 'cube', { onChange: () => load() });
        const out = v.slider('outer face', 0, 11, 0, { int: true, onChange: () => load() });
        const show = v.toggle('show $G^*$', true);
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        let S;
        function load() { S = plane(NORM(ex.value), out.value === 0 ? null : out.value); setPlane(G, S); }
        load();
        v.render(() => { shadeFaces(s, S, (i) => PALETTE[i % PALETTE.length], 0.12); if (show.value) drawDual(s, S); G.draw({ edgeColor: () => 'accent', edgeWidth: () => 2.4 }); });
        v.legend([['accent', '$G$', { dash: false }], ['orange', '$G^*$ (dashed circle = unbounded face)', { dash: false }]]);
        v.readout(() => {
          const n = S.H.n, m = S.H.m, f = S.F.length, deg = new Int32Array(f); S.dual.edges.forEach((e) => { deg[e.a]++; deg[e.b]++; });
          const lens = S.F.map((x) => x.walk.length), okDeg = lens.every((l, i) => l === deg[i]);
          let par = 0; const seen = new Set(); S.dual.edges.forEach((e) => { const k = ekey2(e.a, e.b); if (seen.has(k)) par++; seen.add(k); });
          return `$G$: $n=${n}$, $m=${m}$, ${f} faces (lengths ${lens.slice().sort((a, b) => a - b).join(', ')}) · Euler: $n-m+\\ell=${n - m + f}$ ${n - m + f === 2 ? '✓' : '✗'}\n$G^*$: ${f} vertices, ${m} edges, ${par} of them parallel to another · degrees of $G^*$ = face lengths of $G$: **${okDeg ? '✓' : '✗'}**`;
        });
      },
    },
    {
      num: '4.6.1', kind: 'Proposition', name: 'Cycles of G correspond to bonds of G*',
      statement: String.raw`Let $G$ be a connected plane graph with plane dual $G^*$. A set $F\subseteq E(G)$ is the edge set of a cycle in $G$ if and only if the set $F^*=\{e^*: e\in F\}$ is a bond (a minimal non-empty cut) of $G^*$.`,
      idea: String.raw`A cycle $C$ is a Jordan curve (4.1.1); it separates the faces of $G$ into those inside and those outside, and the dual edges $e^*$ with $e\in C$ are exactly the dual edges joining an inside face to an outside face. So $F^*$ is the cut of $G^*$ between the two sets, and since both the inside and the outside faces are connected through dual edges not crossing $C$ (4.2.4 prevents extra components), the cut is a bond. Conversely, a bond of $G^*$ separates the faces into two connected classes, and the primal edges crossing between the two classes form a connected closed curve, a cycle.`,
      caption: String.raw`Pick a cycle of $G$ with the arrows (cycles are listed from short to long). The cycle is drawn in red, its dual edges $F^*$ in thick red as well. The faces inside the cycle are tinted blue, those outside orange: $F^*$ is exactly the set of dual edges between the two groups, and removing it splits $G^*$ into two connected pieces. The readout also checks the proposition for *all* cycles of the graph, and counts the bonds of $G^*$ to see that there are no others.`,
      deps: ['graph-4.6.1a', 'graph-4.1.1', 'graph-4.2.4', 'graph-1.9.1b'], refs: ['Diestel §4.6'], tags: ['duality', 'cycles', 'bonds'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4', 'k24', 'k4k4']), 'cube', { onChange: () => load() });
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        let S, cycles, idx = 0, all, HG;
        function load() {
          S = plane(NORM(ex.value)); setPlane(G, S); HG = ix(G); cycles = CYC(S.H); idx = 0;
          const D = { n: S.F.length, ends: S.dual.edges.map((e) => [e.a, e.b]) };
          const bad = cycles.filter((c) => !isBondMask(D.n, D.ends, c.E)).length, bonds = allBonds(dualIx(S)).length;
          all = { n: cycles.length, bad, bonds };
        }
        load();
        v.button('previous cycle', () => { idx = (idx + cycles.length - 1) % cycles.length; });
        v.button('next cycle', () => { idx = (idx + 1) % cycles.length; });
        v.render(() => {
          const c = cycles[idx], F = new Set(); c.E.forEach((x, k) => { if (x) F.add(k); });
          // components of G* - F*
          const par = Array.from({ length: S.F.length }, (_, i) => i), find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
          S.dual.edges.forEach((e, k) => { if (!F.has(k)) par[find(e.a)] = find(e.b); });
          const outRoot = find(S.oi);
          shadeFaces(s, S, (i) => (find(i) === outRoot ? 'orange' : 'accent'), 0.26);
          drawDual(s, S, { hi: F });
          const inE = new Set([...F].map((k) => HG.E[k][2]));
          G.draw({ edgeColor: (e) => (inE.has(e) ? 'red' : 'accent'), edgeWidth: (e) => (inE.has(e) ? 3.4 : 2.2) });
        });
        v.legend([['accent', 'faces inside the cycle', { area: true }], ['orange', 'faces outside', { area: true }], ['red', 'cycle $F$ and its dual edges $F^*$', { dash: false }]]);
        v.readout(() => {
          const c = cycles[idx], D = { n: S.F.length, ends: S.dual.edges.map((e) => [e.a, e.b]) };
          return `cycle ${idx + 1} of ${all.n}: length ${c.vs.length} · $F^*$ is a bond of $G^*$: **${isBondMask(D.n, D.ends, c.E) ? '✓' : '✗'}**\nall ${all.n} cycles of $G$ give bonds: **${all.bad === 0 ? '✓' : '✗'}** · $G^*$ has ${all.bonds} bonds in total ${all.bonds === all.n ? '— as many as $G$ has cycles ✓' : '✗'}`;
        });
      },
    },
    {
      num: '4.6.1b', kind: 'Definition', name: 'Abstract duals',
      statement: String.raw`For finite multigraphs $G$ and $G^*$, $G^*$ is an **abstract dual** of $G$ if there is a bijection $\varphi\colon E(G)\to E(G^*)$ such that a set $F\subseteq E(G)$ is the edge set of a cycle of $G$ if and only if $\varphi(F)$ is a bond of $G^*$. Neither graph must be connected. Loops and two parallel edges count as cycles. By 4.6.1, a plane dual is an abstract dual.`,
      idea: String.raw`The definition forgets the drawing and keeps only the matroidal content: which edge sets are cycles on one side and bonds on the other. The bijection matters: a graph can be an abstract dual of $G$ through one pairing of the edges and fail through another. Pairing every edge of $K^4$ with its opposite gives one self-duality. Composing it with a vertex automorphism gives 24 valid edge pairings; the opposite pairing is not unique.`,
      caption: String.raw`The left graph is $G$ with numbered edges. On the right is a candidate $G^*$; each of its edges carries the number of the edge of $G$ it is paired with. The app tests both directions: every cycle must map to a bond and every candidate bond must be the image of a cycle. For the plane dual of $G$ the test succeeds; click two edges of the candidate to swap their labels and test the modified pairing (a failing witness is shown in red on both sides). For $K^4$, choose **$G$ itself** and fix the pairing by swapping edges until it works.`,
      deps: ['graph-4.6.1', 'graph-1.9.1b'], refs: ['Diestel, Graph Theory, 6th ed. (2025), unnumbered abstract-dual definition, p. 116'], tags: ['duality', 'abstract dual'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=24' },
      viz(v) {
        const ex = v.select('graph', opts(['k4', 'cube', 'prism', 'w5']), 'k4', { onChange: () => load() });
        const cand = v.select('candidate $G^*$', [{ value: 'dual', label: 'plane dual' }, { value: 'self', label: '$G$ itself' }], 'dual', { onChange: () => load() });
        const sL = gstage(v, { height: 330, title: 'graph $G$ (edges numbered)' }), sR = gstage(v, { height: 330, title: 'candidate $G^*$ (edges carry the paired number)' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, draggable: false }), D = v.graph(sR, { nodes: [], edges: [], r: 11, draggable: false });
        let S, H, Dm, pi, cycles, sel = null, HD, HG;
        function load() {
          S = plane(NORM(ex.value)); H = S.H; setPlane(G, S, true); HG = ix(G); cycles = CYC(H); sel = null;
          const ends = cand.value === 'dual' ? S.dual.edges.map((e) => [e.a, e.b]) : H.E.map(([a, b]) => [a, b]);
          const nn = cand.value === 'dual' ? S.F.length : H.n;
          const pts = cand.value === 'dual' ? S.F.map((f, i) => (i === S.oi ? [S.ring.c[0], S.ring.c[1] + 1.25 * S.ring.R] : S.cen[i])) : S.P;
          Dm = { n: nn, ends }; pi = ends.map((_, k) => k);
          D.set({ nodes: pts.map((p, i) => ({ id: i, x: p[0], y: p[1], label: cand.value === 'dual' ? '*' + (i + 1) : lab1(i) })), edges: ends.map(([a, b], k) => ({ from: a, to: b, k })) }); D.layout('fit'); HD = ix(D, { multi: true });
        }
        load();
        D.onClick = ({ edge }) => {
          if (!edge) { sel = null; return true; }
          if (sel == null) sel = edge.k; else { const a = pi.indexOf(sel), b = pi.indexOf(edge.k); if (a >= 0 && b >= 0 && a !== b) { pi[a] = edge.k; pi[b] = sel; } sel = null; }
          return true;
        };
        v.button('reset the pairing', () => { pi = Dm.ends.map((_, k) => k); sel = null; });
        v.button('swap two random labels', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); const a = Math.floor(r() * pi.length); let b = Math.floor(r() * pi.length); if (b === a) b = (a + 1) % pi.length; [pi[a], pi[b]] = [pi[b], pi[a]]; });
        v.render(() => {
          const bad = abstractDualAudit(H, Dm, pi, cycles);
          const badG = new Set(), badD = new Set(); if (bad) bad.E.forEach((x, k) => { if (x) { badG.add(HG.E[k][2]); badD.add(pi[k]); } });
          G.draw({ edgeLabel: (e) => String(HG.eix.get(e) + 1), edgeColor: (e) => (badG.has(e) ? 'red' : null), edgeWidth: (e) => (badG.has(e) ? 3.6 : null) });
          D.draw({
            edgeLabel: (e) => String(pi.indexOf(e.k) + 1), edgeColor: (e) => (e.k === sel ? 'gold' : badD.has(e.k) ? 'red' : null), edgeWidth: (e) => (e.k === sel || badD.has(e.k) ? 3.6 : null),
          });
        });
        v.readout(() => {
          const bad = abstractDualAudit(H, Dm, pi, cycles);
          return bad?.kind==='bond'?`**the pairing is not an abstract duality:** a candidate bond has inverse edge set ${Array.from(bad.E,(x,k)=>x?k+1:0).filter(Boolean).join(', ')}, which is not a cycle of $G$ (red)`:bad ? `**the pairing is not an abstract duality:** the cycle of $G$ with edges ${bad.E.map((x, k) => (x ? k + 1 : 0)).filter(Boolean).join(', ')} is mapped to a set that is not a bond of the candidate (red)` : `all ${cycles.length} cycles of $G$ correspond exactly to all candidate bonds ${cand.value === 'dual' && pi.every((x, k) => x === k) ? '(the plane dual with its natural pairing)' : ''} ✓ → $G^*$ is an abstract dual of $G$ through this pairing`;
        });
      },
    },
    {
      num: '4.6.2', kind: 'Proposition', name: 'An abstract dual swaps cycle space and cut space',
      statement: String.raw`Let $G^*$ be an abstract dual of the finite multigraph $G$ via the bijection $\varphi\colon E(G)\to E(G^*)$. Then $F\subseteq E(G)$ lies in the cycle space $\mathscr C(G)$ if and only if $\varphi(F)$ lies in the cut space $\mathscr C^*(G^*)$; so $\varphi$ induces an isomorphism $\mathscr C(G)\cong\mathscr C^*(G^*)$, and the dimensions agree: $m-n+c=n^*-c^*$, where $c,c^*$ count components, including isolated vertices.`,
      idea: String.raw`Extend $\varphi$ linearly to a map between the edge spaces over $\mathbb F_2$. The cycle space is generated by the cycles of $G$ (1.9.1), and the cut space of $G^*$ is generated by its bonds, because every cut is a disjoint union of bonds (1.9.3). By definition $\varphi$ sends cycles of $G$ exactly to bonds of $G^*$, so it maps a generating set of $\mathscr C(G)$ onto a generating set of the cut space of $G^*$, and being bijective on edges it is an isomorphism between the two spaces. The dimensions are $m-n+c$ and $|G^*|-c^*$. A connected primal graph can still have a disconnected abstract dual, because isolated dual vertices do not affect bonds. For connected plane duals $c=c^*=1$ and the identity becomes Euler's formula.`,
      caption: String.raw`$G^*$ is the plane dual with its natural pairing. Click edges of $G$ to build an arbitrary edge set $F$; the right panel shows the same set $F^*$ in the dual. The app reports whether $F$ is in the cycle space (every vertex has even degree in $F$) and whether $F^*$ is in the cut space of $G^*$ (the vertices of $G^*$ can be 2-coloured so that $F^*$ is exactly the set of bichromatic edges; if so the two colours are shown). The two answers always agree. **random cycle-space element** adds up a few cycles for you.`,
      deps: ['graph-4.6.1b', 'graph-1.9.4', 'graph-1.9.3', 'graph-1.9.2', 'graph-1.9.5'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Proposition 4.6.2, p. 116'], tags: ['duality', 'cycle space', 'cut space'],
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4']), 'cube', { onChange: () => load() });
        const sL = gstage(v, { height: 340, title: 'edge set $F\\subseteq E(G)$ (click edges)' }), sR = gstage(v, { height: 340, title: 'dual edge set $F^*$ in $G^*$' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, draggable: false }), D = v.graph(sR, { nodes: [], edges: [], r: 11, draggable: false });
        let S, H, HG, Fs = new Set(), cycles, HD;
        function load() {
          S = plane(NORM(ex.value)); H = S.H; setPlane(G, S, true); HG = ix(G); Fs = new Set(); cycles = CYC(H); { const c0 = cycles[Math.min(3, cycles.length - 1)]; c0.E.forEach((x, k) => { if (x) Fs.add(k); }); }
          const pts = S.F.map((f, i) => (i === S.oi ? [S.ring.c[0], S.ring.c[1] + 1.25 * S.ring.R] : S.cen[i]));
          D.set({ nodes: pts.map((p, i) => ({ id: i, x: p[0], y: p[1], label: '*' + (i + 1) })), edges: S.dual.edges.map((e, k) => ({ from: e.a, to: e.b, k })) }); D.layout('fit');
        }
        load();
        G.onClick = ({ edge }) => { if (!edge) return true; const k = HG.eix.get(edge); if (k != null) { if (Fs.has(k)) Fs.delete(k); else Fs.add(k); } return true; };
        v.button('clear', () => Fs.clear());
        let seed = 1;
        v.button('random cycle-space element', () => { const r = v.rng(++seed * 31 + 7); const F = new Uint8Array(H.m); const t = 1 + Math.floor(r() * 3); for (let i = 0; i < t; i++) { const c = cycles[Math.floor(r() * cycles.length)]; c.E.forEach((x, k) => (F[k] ^= x)); } Fs = new Set(); F.forEach((x, k) => { if (x) Fs.add(k); }); });
        const info = () => {
          const F = new Uint8Array(H.m); Fs.forEach((k) => (F[k] = 1));
          const deg = new Int32Array(H.n); Fs.forEach((k) => { deg[H.E[k][0]]++; deg[H.E[k][1]]++; });
          const even = deg.every((d) => d % 2 === 0);
          // 2-colouring of G*: edges in F* join different colours, others the same colour
          const nf = S.F.length, col = new Int32Array(nf).fill(-1); let ok = true;
          const adj = Array.from({ length: nf }, () => []); S.dual.edges.forEach((e, k) => { adj[e.a].push([e.b, Fs.has(k) ? 1 : 0]); adj[e.b].push([e.a, Fs.has(k) ? 1 : 0]); });
          for (let s0 = 0; s0 < nf && ok; s0++) { if (col[s0] >= 0) continue; col[s0] = 0; const q = [s0]; for (let i = 0; i < q.length && ok; i++) for (const [w, d] of adj[q[i]]) { const c = col[q[i]] ^ d; if (col[w] < 0) { col[w] = c; q.push(w); } else if (col[w] !== c) { ok = false; break; } } }
          return { even, cut: ok, col };
        };
        v.render(() => {
          const I = info(), inF = new Set([...Fs].map((k) => HG.E[k][2]));
          G.draw({ edgeColor: (e) => (inF.has(e) ? (I.even ? 'green' : 'red') : null), edgeWidth: (e) => (inF.has(e) ? 4 : null) });
          D.draw({ edgeColor: (e) => (Fs.has(e.k) ? (I.cut ? 'green' : 'red') : 'faint'), edgeWidth: (e) => (Fs.has(e.k) ? 4 : 1.3), nodeFill: (id) => (I.cut ? (I.col[id] ? 'orange' : 'accent') : null) });
        });
        v.legend([['green', '$F$ and $F^*$ when they belong to the spaces', { dash: false }], ['red', 'when they do not', { dash: false }]]);
        v.readout(() => {
          const I = info(), m = H.m, n = H.n, f = S.F.length;
          return `$|F|=${Fs.size}$ · $F\\in\\mathscr C(G)$ (all degrees even): **${I.even ? '✓' : '✗'}** · $F^*\\in$ cut space of $G^*$: **${I.cut ? '✓' : '✗'}** → ${I.even === I.cut ? 'the two answers agree ✓' : 'DISAGREE'}\n$\\dim\\mathscr C(G)=m-n+1=${m - n + 1}$ and $\\dim$ cut space of $G^*=|G^*|-1=${f - 1}$ ${m - n + 1 === f - 1 ? '✓' : '✗'}`;
        });
      },
    },
    {
      num: '4.6.3', kind: 'Theorem', name: 'Whitney: planar iff an abstract dual exists',
      statement: String.raw`A finite graph is planar if and only if it has an abstract dual.`,
      idea: String.raw`For a planar graph, take a plane dual separately for each connected component and form their disjoint union; cycles and bonds correspond component by component. Conversely, abstract duality identifies the cycle space of $G$ with the cut space of $G^*$ (4.6.2). The latter has a sparse basis of atomic cuts (1.9.2), so the former has a sparse basis and MacLane's criterion (4.5.1) proves planarity. This works with disconnected graphs and isolated vertices; no 2-connectivity assumption is needed. If one wants basis vectors that are single cycles, split Eulerian vectors into edge-disjoint cycles and extract a basis without increasing any edge's total use.`,
      caption: String.raw`For a planar graph the app draws the plane dual with its natural edge pairing and checks the definition in both directions on all cycles and bonds (the readout reports the test). For $K^5$, $K_{3,3}$ and the Petersen graph there is no drawing to take a dual of. Suppose there were an abstract dual: the proof turns it into a simple basis of the cycle space, so the app searches for a sparse cycle basis. A completed search can certify nonexistence; a budget-limited failure is inconclusive. The right picture shows a partial independent family found by the search, not a claimed maximum.`,
      deps: ['graph-4.6.1', 'graph-4.6.2', 'graph-4.5.1', 'graph-1.9.2'], refs: ['Diestel, Graph Theory, 6th ed. (2025), Theorem 4.6.3, p. 117'], see: ['circ-3.11'], tags: ['duality', 'planar'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=25' },
      viz(v) {
        const ex = v.select('graph', opts(['cube', 'prism', 'w5', 'oct', 'k4', 'k24', 'k33', 'k5', 'pet']), 'cube', { onChange: () => load() });
        const sL = gstage(v, { height: 340, title: 'graph $G$' }), sR = gstage(v, { height: 340, title: 'its dual, or a failed search' });
        const G = v.graph(sL, { nodes: [], edges: [], r: 11, draggable: false }), R = v.graph(sR, { nodes: [], edges: [], r: 11, draggable: false });
        let N, H, S = null, res = null, test = null, HG, HR;
        const OC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
        function load() {
          N = NORM(ex.value); H = ixE(N.n, N.E); S = null; res = null; test = null;
          if (isPlanar(H) && H.n >= 3 && isKconn(H, 2).ok) {
            S = plane(N); setPlane(G, S); HG = ix(G);
            const Dm = { n: S.F.length, ends: S.dual.edges.map((e) => [e.a, e.b]) }, cycles = CYC(H);
            test = { bad: abstractDualAudit(H, Dm, Dm.ends.map((_, k) => k), cycles), nc: cycles.length, bonds: allBonds(dualIx(S)).length };
            const pts = S.F.map((f, i) => (i === S.oi ? [S.ring.c[0], S.ring.c[1] + 1.25 * S.ring.R] : S.cen[i]));
            R.set({ nodes: pts.map((p, i) => ({ id: i, x: p[0], y: p[1], label: '*' + (i + 1) })), edges: S.dual.edges.map((e, k) => ({ from: e.a, to: e.b, k })) }); R.layout('fit'); HR = ix(R, { multi: true });
          } else {
            loadSpec(G, { nodes: N.pos.map(([x, y], i) => ({ id: i, x, y, label: lab1(i) })), edges: N.E.map(([a, b]) => [a, b]), layout: 'fit' }); HG = ix(G);
            res = simpleBasis(H); loadSpec(R, { nodes: N.pos.map(([x, y], i) => ({ id: i, x, y, label: lab1(i) })), edges: N.E.map(([a, b]) => [a, b]), layout: 'fit' }); HR = ix(R);
          }
        }
        load();
        v.render(() => {
          if (S) drawDual(sL, S, {});
          G.draw({ edgeColor: () => 'accent', edgeWidth: () => 2.2 });
          if (S) { R.draw({ edgeColor: () => 'orange', nodeColor: () => 'orange' }); }
          else {
            const fam = res && (res.basis || res.best) || [], load = new Int32Array(H.m); fam.forEach((c) => c.E.forEach((x, k) => { if (x) load[k]++; }));
            R.draw({ edgeColor: (e) => (load[HR.eix.get(e)] === 2 ? 'orange' : load[HR.eix.get(e)] === 1 ? 'accent' : 'faint'), edgeWidth: (e) => 1.5 + 1.3 * load[HR.eix.get(e)] });
          }
        });
        v.legend([['orange', 'plane dual / edge in two cycles of the family', { dash: false }], ['accent', 'edge in one cycle of the family', { dash: false }]]);
        v.readout(() => {
          if (S) return `**planar** (${H.n} vertices, ${H.m} edges, ${S.F.length} faces): the plane dual with the pairing $e\\mapsto e^*$ maps all ${test.nc} cycles of $G$ to bonds of $G^*$ ${test.bad ? '✗' : '✓'}, and $G^*$ has ${test.bonds} bonds ${test.bonds === test.nc ? '✓' : '✗'} → an abstract dual exists`;
          if (res.tooBig) return 'too large';
          return `Exact planarity test: **${isPlanar(H)?'planar':'not planar'}**. Cycle-space dimension ${res.dim}; searched ${res.nCycles} cycles. ${res.basis?'A sparse basis was found.':res.exhausted?'The basis search completed and no sparse basis exists.':'The search budget was exhausted; failure to find a basis is inconclusive.'} A partial independent family of ${res.best?.length||0} cycles was found (no maximum-size claim). By the theorem, ${isPlanar(H)?'an abstract dual exists':'no abstract dual exists'}.`;
        });
      },
    },
  ],
};

// Exposed pure construction for independent combinatorial/geometry verification.
export { plane as planeDualModel, PRE as dualityPresets, dualLine as planeDualLine };
