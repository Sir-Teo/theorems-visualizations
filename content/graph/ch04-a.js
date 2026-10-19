import {polygonRadius,radialLower,angularMap,conePoint,coneMeshAngles,complementProbe,checkedPlaneState,checkedPlaneGuard} from './ch04-plane-audit.shared.js';
// Graph Theory (Diestel) — Chapter 4, part A (§§4.1–4.2, first half: topological prerequisites; plane graphs and their faces)
// The chapter title and summary come from the syllabus (part B writes §§4.3–4.6 in ch04-b*.js).
import {
  K, gstage, FILLS, VIEW, crossPairs, planarize, faceStruct, winding, innerPoint, paintFaces, markCross, planeOf, planeState, planeGuard, loadG,
  planeSpec, pgSpec, PGS, nearOnPoly, rayHits, regionsOf, distSeg, segInter, polyArea, cacheBy,
} from './ch04-a.shared.js';

// ---------- local helpers ----------
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const TAU = 2 * Math.PI;
/** Draggable vertices for a polygon/polyline editor: returns handles; `ok(i, x, y)` may veto a move. */
function vertexHandles(s, n, color, ok) {
  const hs = [];
  for (let i = 0; i < n; i++) {
    hs.push(s.handle(0, 0, { color, r: 7, constrain: (x, y) => (ok && !ok(i, x, y) ? [hs[i].x, hs[i].y] : [Math.max(0.2, Math.min(9.8, x)), Math.max(0.2, Math.min(6.2, y))]) }));
    hs[i].visible = false;
  }
  return hs;
}
const loadPts = (hs, pts) => hs.forEach((h, i) => { h.visible = i < pts.length; if (i < pts.length) h.set(pts[i][0], pts[i][1]); });
const ptsOf = (hs, n) => hs.slice(0, n).map((h) => [h.x, h.y]);
/** Is the closed polygon / polyline through pts free of crossings (touching ends excepted)? */
function simpleOK(pts, closed) {
  const E = pts.map((_, i) => [i, (i + 1) % pts.length]).slice(0, closed ? pts.length : pts.length - 1);
  return crossPairs(pts, E, 0.06).length === 0;
}
/** Draw regions of a regionsOf() result; colorOf(face) may pick. Returns nothing. */
function paintRegions(s, R, colorOf, alpha) {
  paintFaces(s, R.F, { colorOf: (i) => (colorOf ? colorOf(i) : i ? FILLS[(i - 1) % 8] : 'muted'), alpha });
}
const lab = (i) => 'P' + SUBS[i + 1];
const sameSet = (A, B) => A.size === B.size && [...A].every((x) => B.has(x));

export default {
  collection: 'graph',
  chapter: 4,
  items: [
    // ====================================================================== 4.1 Topological prerequisites
    {
      num: '4.1.1a', kind: 'Definition', name: 'Polygons, arcs, regions and frontiers',
      statement: String.raw`A **polygonal arc** is a subset of the plane that is a union of finitely many straight segments and homeomorphic to $[0,1]$; the images of $0$ and $1$ are its **endpoints**, and the rest is its interior. A **polygon** is such a union homeomorphic to a circle. (Diestel simply says *arc* for polygonal arcs throughout the chapter.)

For an open set $O\subseteq\R^2$, "are equal or can be joined by an arc inside $O$" is an equivalence relation; its classes are the **regions** of $O$. Unions of finitely many arcs and points are compact, so the complement $\R^2\setminus X$ of such an $X$ is open and has regions. The **frontier** of a set $Y$ consists of the points every neighbourhood of which meets both $Y$ and $\R^2\setminus Y$.`,
      idea: String.raw`Nothing is proved here: these are the words in which every later argument about drawings is phrased. Regions are the connected pieces of the complement that can be reached from each other by a polygonal path, and the frontier of a region is the part of $X$ that touches it. The pictures to keep in mind: an arc leaves one region, a polygon cuts the plane in two, and a region can be touched by only part of $X$.`,
      caption: String.raw`Drag the vertices of the drawn set $X$ (choose one of five examples). Its complement is cut into **regions**, each tinted; the gold point $p$ selects one region, which turns blue, and its **frontier** is traced in bold. The preset labels describe their initial shapes; after free dragging an arc or polygon may cease to be simple. Crossings are split for the floating-point face calculation; the displayed counts use geometric tolerances near degeneracies. If $p$ is within 0.02 data units of the drawing, no complementary region is assigned; move it away to select a region.`,
      deps: [], refs: ['Diestel, Graph Theory, sixth-edition author preview (2025), §4.1, pp.94–95'], tags: ['regions', 'polygonal arcs'], links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf' },
      viz(v) {
        const SETS = {
          arc: { name: 'an arc', parts: [{ n: 5, closed: false, pts: [[1.2, 1.6], [3.0, 4.8], [4.8, 2.0], [6.6, 5.0], [8.6, 2.4]] }] },
          poly: { name: 'a polygon', parts: [{ n: 5, closed: true, pts: [[2.0, 1.2], [8.0, 1.2], [8.6, 4.8], [5.2, 3.2], [1.6, 5.2]] }] },
          two: { name: 'two nested polygons', parts: [{ n: 4, closed: true, pts: [[1.4, 0.9], [8.6, 0.9], [8.6, 5.6], [1.4, 5.6]] }, { n: 4, closed: true, pts: [[3.4, 1.9], [6.6, 1.9], [6.6, 4.4], [3.4, 4.4]] }] },
          mix: { name: 'a polygon and an arc', parts: [{ n: 4, closed: true, pts: [[1.4, 1.2], [4.6, 1.2], [4.6, 4.8], [1.4, 4.8]] }, { n: 3, closed: false, pts: [[6.0, 1.4], [8.4, 3.4], [6.2, 5.2]] }] },
          eight: { name: 'a figure eight', parts: [{ n: 4, closed: true, pts: [[2.0, 1.4], [8.0, 4.8], [8.0, 1.4], [2.0, 4.8]] }] },
        };
        const sel = v.select('$X$ is', Object.entries(SETS).map(([k, o]) => ({ value: k, label: o.name })), 'poly', { onChange: () => load() });
        const s = gstage(v, { height: 340 });
        const hs = vertexHandles(s, 9, 'accent');
        const p = s.handle(5.0, 3.9, { color: 'gold', r: 8, label: 'p' });
        const load = () => { const S = SETS[sel.value]; loadPts(hs, S.parts.flatMap((q) => q.pts)); p.set(sel.value === 'poly' ? 4.8 : sel.value === 'two' ? 2.2 : sel.value === 'mix' ? 3.0 : sel.value === 'eight' ? 5.0 : 4.0, sel.value === 'two' ? 3.0 : sel.value === 'eight' ? 3.1 : sel.value === 'poly' ? 2.4 : 3.4); };
        load();
        let info = null;
        v.render(() => {
          const S = SETS[sel.value]; let o = 0;
          const parts = S.parts.map((q) => { const r = { pts: hs.slice(o, o + q.n).map((h) => [h.x, h.y]), closed: q.closed }; o += q.n; return r; });
          const R=complementProbe(parts,[p.x,p.y]),F=R.F,cur=R.cur,fr=cur===null?null:F.faces[cur];
          paintRegions(s, R, (i) => (i === cur ? 'accent' : i ? FILLS[i % 8] : null), 0.2);
          parts.forEach((q) => s.path(q.pts, { color: 'ink', width: 2.4, close: q.closed }));
          R.pl.E.forEach(([a, b], k) => { if (fr?.edges.has(k)) s.line(R.pl.P[a][0], R.pl.P[a][1], R.pl.P[b][0], R.pl.P[b][1], { color: 'accent', width: 5, alpha: 0.9 }); });
          R.frontierPoints.forEach(q=>s.dot(...q,{color:'accent',r:5}));
          const totE = R.pl.E.length;
          info = { regions: F.faces.length, cur, bounded: cur > 0, fe: fr?.edges.size||0, tot: totE, nparts: parts.length,near:R.near,all:R.allFrontier };
        });
        v.readout(() => (info ? info.near?`The complement has ${info.regions} regions. $p$ is on or within 0.02 units of the drawing; no region is assigned.`:`$\\mathbb R^2\\setminus X$ has **${info.regions}** region${info.regions === 1 ? '' : 's'} · $p$ lies in the ${info.bounded ? 'bounded' : 'unbounded'} region, whose frontier is ${info.all ? '**all of $X$**' : `**${info.fe} of the ${info.tot} segments of $X$**`}` : ''));
      },
    },
    {
      num: '4.1.1', kind: 'Theorem', name: 'Jordan curve theorem for polygons',
      statement: String.raw`For every polygon $P\subseteq\R^2$, the set $\R^2\setminus P$ has exactly two regions, and each of them has the entire polygon $P$ as its frontier. (One region is bounded, the **inside**, the other is unbounded.)`,
      idea: String.raw`Shoot a ray from a point $x\notin P$ in a direction that avoids all vertices and count how often it crosses $P$. The parity of that count does not depend on the direction, and it can only change when $x$ crosses an edge of $P$, because a crossing at a vertex comes in pairs: it counts as two or as none. Thus parity is constant on each region and opposite parities occur next to every edge. This is a useful way to recognise the two sides; proving that each parity class is connected is an additional global step in the Jordan theorem. The parity calculation alone does not prove there are only two regions.`,
      caption: String.raw`Drag the vertices to reshape the polygon (it must stay simple unless you switch to *free*), drag the gold point $p$ and turn the ray with the slider: the gold marks are the crossings and their parity says inside or outside, whatever the direction. In *free* mode, make the polygon cross itself, and the plane falls into more than two regions: the hypothesis "polygon" has been broken.`,
      deps: ['graph-4.1.1a'], refs: ['Diestel §4.1'], see: ['top-10.1', 'top-10.5'], tags: ['Jordan curve', 'parity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jordan_curve_theorem' },
      viz(v) {
        const SH = {
          blob: [[2.0, 1.4], [5.0, 0.8], [8.2, 1.6], [8.8, 3.8], [6.4, 5.4], [4.6, 4.2], [2.8, 5.2], [1.2, 3.4]],
          notch: [[1.0, 1.0], [9.0, 1.0], [9.0, 5.6], [7.6, 5.6], [7.6, 2.6], [5.6, 2.6], [5.6, 5.6], [1.0, 5.6]],
          bow: [[2.0, 1.4], [8.0, 5.0], [8.0, 1.4], [2.0, 5.0]],
        };
        let n = 8;
        const mode = v.select('vertices', [{ value: 'simple', label: 'stay simple' }, { value: 'free', label: 'free' }], 'simple');
        const shape = v.select('shape', [{ value: 'blob', label: 'blob' }, { value: 'notch', label: 'U-shape' }, { value: 'bow', label: 'bow-tie' }], 'blob', {
          onChange: () => { if (shape.value === 'bow') mode.set('free', { fire: true }); n = SH[shape.value].length; loadPts(hs, SH[shape.value]); },
        });
        const ang = v.slider('ray angle', 0, 359, 23, { step: 1, decimals: 0 });
        const s = gstage(v, { height: 340 });
        const hs = vertexHandles(s, 8, 'accent', (i, x, y) => {
          if (mode.value === 'free') return true;
          const pts = ptsOf(hs, n); pts[i] = [x, y]; return simpleOK(pts, true);
        });
        loadPts(hs, SH.blob);
        const p = s.handle(4.6, 3.0, { color: 'gold', r: 8, label: 'p' });
        let info = null;
        v.render(() => {
          const pts = ptsOf(hs, n), th = (ang.value * Math.PI) / 180;
          const R = regionsOf([{ pts, closed: true }]), hits = rayHits(pts, [p.x, p.y], th), inside = hits.length % 2 === 1;
          paintRegions(s, R, (i) => (i === 0 ? null : 'accent'), 0.2);
          if (R.F.faces.length > 2) paintRegions(s, R, (i) => (i ? FILLS[(i - 1) % 8] : null), 0.2);
          s.path(pts, { color: 'ink', width: 2.6, close: true });
          const far = 14;
          s.line(p.x, p.y, p.x + far * Math.cos(th), p.y + far * Math.sin(th), { color: 'orange', width: 2, dash: [6, 4] });
          hits.forEach((h) => s.dot(h.x, h.y, { r: 6, color: 'gold' }));
          const where = R.F.locate(p.x, p.y);
          info = { k: hits.length, inside, regions: R.F.faces.length, simple: simpleOK(pts, true), agree: R.F.faces.length === 2 ? inside === (where !== 0) : null };
          s.corner(info.simple ? (inside ? 'inside' : 'outside') : 'not a polygon', 'tr', { color: info.simple ? (inside ? 'accent' : 'orange') : 'red', weight: 700, size: 13 });
        });
        v.readout(() => (info ? `ray crosses $P$ **${info.k}** time${info.k === 1 ? '' : 's'} (${info.k % 2 ? 'odd' : 'even'}) · $\\mathbb R^2\\setminus P$ has **${info.regions}** region${info.regions === 1 ? '' : 's'}${info.simple ? ` ${info.regions === 2 ? '✓' : '✗'}` : ' (the curve crosses itself, so it is not a polygon)'}${info.agree == null ? '' : ` · parity ${info.agree ? 'agrees' : 'disagrees'} with the region of $p$`}` : ''));
      },
    },
    {
      num: '4.1.2', kind: 'Lemma', name: 'Three arcs between two points make three regions',
      statement: String.raw`Let $P_1,P_2,P_3$ be three arcs with the same two endpoints that are otherwise disjoint.

(i) $\R^2\setminus(P_1\cup P_2\cup P_3)$ has exactly three regions, with frontiers $P_1\cup P_2$, $P_2\cup P_3$ and $P_1\cup P_3$.

(ii) If $P$ is an arc between a point in $\mathring P_1$ and a point in $\mathring P_3$ whose interior lies in the region of $\R^2\setminus(P_1\cup P_3)$ that contains $\mathring P_2$, then $\mathring P\cap\mathring P_2\neq\emptyset$.`,
      idea: String.raw`Each pair $P_i\cup P_j$ is a polygon, so by the Jordan curve theorem it has an inside and an outside. $P_3$ minus its ends lies in only one of these two regions, and $P_3$ cuts it in two, which gives three regions in total; the frontier of each is read off from the polygons. Part (ii) says that inside the polygon $P_1\cup P_3$ the arc $P_2$ separates its two sides: an arc $P$ from $P_1$ to $P_3$ staying in the same region must run into it.`,
      caption: String.raw`Drag the eight vertices (the arcs must stay disjoint unless you switch to *free*). The three regions get their own colours and their frontiers are named in the legend. Tick **try an arc $P$** to add a fourth arc from $P_1$ to $P_3$ through one bend $m$: when it is in the region of $P_1\cup P_3$ that contains $P_2$, it is forced to cross $P_2$; take $m$ to the other side and it no longer has to.`,
      deps: ['graph-4.1.1'], refs: ['Diestel §4.1'], tags: ['theta graph', 'regions'],
      viz(v) {
        const base = [[1.8, 3.2], [8.2, 3.2], [3.4, 5.5], [6.6, 5.5], [3.6, 3.5], [6.4, 3.0], [3.6, 0.9], [6.4, 1.0]];
        const mode = v.select('vertices', [{ value: 'simple', label: 'arcs stay disjoint' }, { value: 'free', label: 'free' }], 'simple');
        const showP = v.toggle('try an arc $P$', false, {});
        const s = gstage(v, { height: 360 });
        // vertices: 0 = a, 1 = b, then two bends on each arc (P1: 2,3; P2: 4,5; P3: 6,7)
        const buildE = () => [[0, 2], [2, 3], [3, 1], [0, 4], [4, 5], [5, 1], [0, 6], [6, 7], [7, 1]];
        const arcOf = [0, 0, 0, 1, 1, 1, 2, 2, 2];
        const hs = vertexHandles(s, 8, 'accent', (i, x, y) => {
          if (mode.value === 'free') return true;
          const pts = ptsOf(hs, 8); pts[i] = [x, y]; return crossPairs(pts, buildE(), 0.06).length === 0;
        });
        loadPts(hs, base);
        hs[0].color = 'ink'; hs[1].color = 'ink';
        const arcPts = (i) => { const q = [[2, 3], [4, 5], [6, 7]][i]; return [[hs[0].x, hs[0].y], [hs[q[0]].x, hs[q[0]].y], [hs[q[1]].x, hs[q[1]].y], [hs[1].x, hs[1].y]]; };
        const proj = (i, x, y) => {
          const r = nearOnPoly(arcPts(i), x, y), pts = arcPts(i), L = pts.length - 1;
          let q = [r.x, r.y]; const lo = r.i === 0 && r.t < 0.25 ? 0.25 : r.i === L - 1 && r.t > 0.75 ? 0.75 : r.t;
          if (lo !== r.t) { const a = pts[r.i], b = pts[r.i + 1]; q = [a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo]; }
          return q;
        };
        const q1 = s.handle(3.6, 5.5, { color: 'pink', r: 7, label: 'q₁', constrain: (x, y) => proj(0, x, y) });
        const q3 = s.handle(5.0, 0.9, { color: 'pink', r: 7, label: 'q₃', constrain: (x, y) => proj(2, x, y) });
        const mm = s.handle(5.0, 4.6, { color: 'pink', r: 7, label: 'm' });
        let info = null;
        v.render(() => {
          for (const h of [q1, q3, mm]) h.visible = showP.value;
          const pts = ptsOf(hs, 8), E = buildE();
          const parts = [0, 1, 2].map((i) => ({ pts: arcPts(i), closed: false }));
          const R = regionsOf(parts), F = R.F;
          // which arcs bound each region
          const arcOfPl = (k) => R.g.part[R.pl.orig[k]];
          const sets = F.faces.map((f) => new Set([...f.edges].map(arcOfPl)));
          paintRegions(s, R, (i) => (i ? FILLS[(i - 1) % 8] : null), 0.2);
          const AC = ['blue', 'orange', 'green'];
          E.forEach(([a, b], k) => s.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], { color: AC[arcOf[k]], width: 3.2 }));
          pts.forEach((p, i) => s.dot(p[0], p[1], { r: 4.5, color: i < 2 ? 'ink' : AC[arcOf[E.findIndex(([a, b]) => a === i || b === i)]] }));
          s.tex('a', pts[0][0] - 0.28, pts[0][1], { size: 15 }); s.tex('b', pts[1][0] + 0.28, pts[1][1], { size: 15 });
          s.tex('P_1', (pts[2][0] + pts[3][0]) / 2, Math.max(pts[2][1], pts[3][1]) + 0.3, { color: 'blue', size: 15 });
          s.tex('P_2', (pts[4][0] + pts[5][0]) / 2, (pts[4][1] + pts[5][1]) / 2 + 0.3, { color: 'orange', size: 15 });
          s.tex('P_3', (pts[6][0] + pts[7][0]) / 2, Math.min(pts[6][1], pts[7][1]) - 0.3, { color: 'green', size: 15 });
          const fro = [];
          for (let i = 1; i < F.faces.length; i++) {
            const ip = innerPoint(F, i), set = [...sets[i]].sort();
            fro.push(set.map((x) => x + 1));
            if (set.length === 2) s.tex(`P_${set[0] + 1}\\cup P_${set[1] + 1}`, ip[0], ip[1], { size: 14, color: 'ink' });
          }
          let ii = null;
          if (showP.value) {
            const A = [q1.x, q1.y], B = [q3.x, q3.y], M = [mm.x, mm.y];
            const poly = [...arcPts(0), ...arcPts(2).slice(1, 3).reverse()];
            const side = (p) => winding(poly, p[0], p[1]) !== 0;
            const sameSide = side(M) === side(pts[4]);
            const segs = [[A, M], [M, B]];
            const hitC = segs.some(([p, q]) => poly.some((a, i) => { const b = poly[(i + 1) % poly.length]; const h = segInter(p, q, a, b); if (!h) return false; const nearEnd = Math.hypot(h.x - A[0], h.y - A[1]) < 1e-6 || Math.hypot(h.x - B[0], h.y - B[1]) < 1e-6; return !nearEnd; }));
            const cross2 = segs.reduce((acc, [p, q]) => acc + [[4, 5], [0, 4], [5, 1]].filter(([i, j]) => segInter(p, q, pts[i], pts[j])).length, 0);
            s.path([A, M, B], { color: 'pink', width: 3.4, dash: [7, 4] });
            const applies = sameSide && !hitC;
            ii = { applies, cross2 };
            if (applies && cross2) segs.forEach(([p, q]) => [[4, 5], [0, 4], [5, 1]].forEach(([i, j]) => { const h = segInter(p, q, pts[i], pts[j]); if (h) s.dot(h.x, h.y, { r: 7, hollow: true, color: 'red' }); }));
          }
          info = { regions: F.faces.length, fro, ii, valid: crossPairs(pts, E, 0.06).length === 0 };
        });
        v.readout(() => {
          if (!info) return '';
          const f = info.fro.map((x) => `$${x.map((i) => 'P_' + i).join('\\cup ')}$`).join(', ');
          let t = info.valid ? `**${info.regions}** regions in all (one unbounded) — frontiers of the bounded ones: ${f}` : `the arcs cross each other, so the lemma does not apply (${info.regions} regions)`;
          if (info.ii) t += info.ii.applies ? ` · $\\mathring P$ stays in the region of $P_1\\cup P_3$ containing $\\mathring P_2$ and meets $\\mathring P_2$ in **${info.ii.cross2}** point${info.ii.cross2 === 1 ? '' : 's'} ${info.ii.cross2 ? '✓' : '✗'}` : ' · here $\\mathring P$ is not in that region, so (ii) says nothing';
          return t;
        });
      },
    },
    {
      num: '4.1.3', kind: 'Lemma', name: 'An arc joining two disjoint sets does not split a region',
      statement: String.raw`Let $X_1,X_2\subseteq\R^2$ be disjoint sets, each a union of finitely many points and arcs, and let $P$ be an arc between a point of $X_1$ and a point of $X_2$ whose interior lies in a region $O$ of $\R^2\setminus(X_1\cup X_2)$. Then $O\setminus P$ is a region of $\R^2\setminus(X_1\cup P\cup X_2)$; in particular $P$ does not separate $O$.`,
      idea: String.raw`Take a thin neighbourhood of $P$ in $O$. Any two points of $O\setminus P$ can be joined inside $O$ by an arc; if that arc hits $P$, go around $P$ along its two sides. The only way to get around $P$ is through its ends, and these lie on $X_1$ and $X_2$, which are disjoint; so the two sides of $P$ are connected to each other around the whole of $P$, through $O$ itself, and $O\setminus P$ stays connected. If both ends were on the same set $X_1$, the two sides could be separated, as in a chord of a polygon.`,
      caption: String.raw`The left panel shows $X_1\cup X_2$ with its regions, the right one adds the arc $P$ (drag $P$'s two bends; its ends slide along the sets). Joining **$X_1$ to $X_2$** never increases the number of regions; switch to joining **$X_1$ to $X_1$** and the outer region falls into two, because the lemma needs the ends on different sets. Regions on the right take the colour of the left region they lie in.`,
      deps: ['graph-4.1.1a'], refs: ['Diestel §4.1'], tags: ['regions', 'arcs'],
      viz(v) {
        const X1 = [[1.2, 1.6], [4.0, 1.2], [4.4, 4.2], [1.6, 4.6]];
        const A2 = [[6.2, 1.6], [7.4, 3.8], [8.8, 2.2]];
        const sel2 = v.select('$X_2$ is', [{ value: 'arc', label: 'an arc' }, { value: 'poly', label: 'a polygon' }], 'arc');
        const join = v.select('$P$ joins', [{ value: 'x12', label: '$X_1$ to $X_2$' }, { value: 'x11', label: '$X_1$ to $X_1$' }], 'x12', { onChange: () => resetEnds() });
        const sL = gstage(v, { height: 330, title: '$X_1\\cup X_2$' }), sR = gstage(v, { height: 330, title: '$X_1\\cup P\\cup X_2$' });
        const h1 = vertexHandles(sR, 7, 'accent');
        loadPts(h1, [...X1, ...A2]);
        const x1 = () => h1.slice(0, 4).map((h) => [h.x, h.y]), x2 = () => h1.slice(4, 7).map((h) => [h.x, h.y]);
        const e1 = sR.handle(4.2, 2.7, { color: 'pink', r: 7, constrain: (x, y) => { const r = nearOnPoly(x1(), x, y, true); return [r.x, r.y]; } });
        const e2 = sR.handle(6.8, 2.7, { color: 'pink', r: 7, constrain: (x, y) => { const r = join.value === 'x12' ? nearOnPoly(x2(), x, y, sel2.value === 'poly') : nearOnPoly(x1(), x, y, true); return [r.x, r.y]; } });
        const m1 = sR.handle(5.0, 4.1, { color: 'pink', r: 7 }), m2 = sR.handle(5.7, 1.3, { color: 'pink', r: 7 });
        function resetEnds() {
          if (join.value === 'x12') { e1.set(4.2, 2.7); m1.set(5.0, 4.1); m2.set(5.7, 1.3); e2.set(6.8, 2.7); } else { e1.set(4.2, 2.7); m1.set(5.0, 5.7); m2.set(0.7, 5.3); e2.set(1.4, 3.1); }
        }
        let info = null;
        v.render(() => {
          const closed2 = sel2.value === 'poly';
          const partsX = [{ pts: x1(), closed: true }, { pts: x2(), closed: closed2 }];
          const A = [e1.x, e1.y], B = [e2.x, e2.y], Pp = [A, [m1.x, m1.y], [m2.x, m2.y], B];
          const L = regionsOf(partsX), Rr = regionsOf([...partsX, { pts: Pp, closed: false }]);
          // region O of the left picture containing the middle of P
          const O = L.F.locate(m1.x, m1.y), colL = (i) => (i === 0 ? 'muted' : FILLS[(i - 1) % 8]);
          paintRegions(sL, L, (i) => (i === O ? 'accent' : colL(i)), 0.22);
          const mapped = Rr.F.faces.map((f, i) => { const ip = innerPoint(Rr.F, i); return L.F.locate(ip[0], ip[1]); });
          paintFaces(sR, Rr.F, { colorOf: (i) => (mapped[i] === O ? (Rr.F.faces.filter((_, j) => mapped[j] === O).length > 1 ? FILLS[(i + 1) % 8] : 'accent') : colL(mapped[i])), alpha: 0.24 });
          for (const [S, parts] of [[sL, partsX], [sR, partsX]]) parts.forEach((q, k) => S.path(q.pts, { color: 'ink', width: 2.6, close: q.closed }));
          sR.path(Pp, { color: 'pink', width: 3.6 });
          // is the interior of P inside O and free of X?
          const segs = [[Pp[0], Pp[1]], [Pp[1], Pp[2]], [Pp[2], Pp[3]]];
          const Xe = [...x1().map((p, i, a) => [p, a[(i + 1) % a.length]]), ...x2().map((p, i, a) => [p, a[(i + 1) % a.length]]).slice(0, closed2 ? 3 : 2)];
          let bad = 0;
          segs.forEach(([p, q]) => Xe.forEach(([a, b]) => { const h = segInter(p, q, a, b); if (h && Math.hypot(h.x - A[0], h.y - A[1]) > 1e-6 && Math.hypot(h.x - B[0], h.y - B[1]) > 1e-6) { bad++; sR.dot(h.x, h.y, { r: 7, hollow: true, color: 'red' }); } }));
          if (segInter(Pp[0], Pp[1], Pp[2], Pp[3])) bad++;
          const inO = L.F.locate(m1.x, m1.y) === L.F.locate(m2.x, m2.y);
          const nO = mapped.filter((o, i) => o === O && i >= 0).length;
          info = { a: L.F.faces.length, b: Rr.F.faces.length, bad, inO, nO, O };
        });
        v.readout(() => (info ? `regions of $X_1\\cup X_2$: **${info.a}** · after adding $P$: **${info.b}**${info.bad ? ' · $P$ touches $X_1\\cup X_2$ in its interior: hypothesis broken' : !info.inO ? ' · the bends are in different regions: hypothesis broken' : join.value === 'x12' ? `; $O\\setminus P$ is ${info.nO === 1 ? '**one region ✓**' : `**${info.nO} regions**`}` : `; $O\\setminus P$ is ${info.nO === 1 ? 'one region' : `**${info.nO} regions** — both ends on $X_1$, so the lemma does not apply`}`}` : ''));
      },
    },
    {
      num: '4.1.4', kind: 'Theorem', name: 'Homeomorphisms of circles extend to the discs they bound',
      statement: String.raw`Let $\varphi\colon C_1\to C_2$ be a homeomorphism between two circles on the sphere $S^2$ (images, under the inverse of a stereographic projection $\pi\colon S^2\setminus\{N\}\to\R^2$, of polygons in the plane), let $O_1$ be a region of $S^2\setminus C_1$ and $O_2$ a region of $S^2\setminus C_2$. Then $\varphi$ extends to a homeomorphism $C_1\cup O_1\to C_2\cup O_2$.`,
      idea: String.raw`This is the Jordan–Schoenflies theorem. It says that every circle is a standard circle up to a homeomorphism of the whole surface, so the two regions of a circle on the sphere are discs, and a homeomorphism between the boundary circles is enough to glue a disc to a disc. The example uses two star-shaped polygons and an explicitly monotone angular boundary map. Positive radial functions and a strictly monotone angular map give an explicit continuous inverse to the cone extension, including at the centre. This proves the displayed special case; a finite mesh orientation check would not establish the general theorem.`,
      caption: String.raw`Planar representatives of the theorem's bounded discs: the source is a regular 80-gon, and the target is an 80-edge star-shaped polygon. Drag the four target markers; their angular parameters stay in order. Choose a preserving or reversing boundary map: both extend homeomorphically. The polar mesh uses relative radius inside each polygon. The readout checks analytic positive-radius and angular-gap bounds, rather than treating a finite mesh as a proof.`,
      deps: ['graph-4.1.1a'], refs: ['Diestel, Graph Theory, sixth-edition author preview (2025), Theorem 4.1.4 and preceding definitions, p.96'], see: ['top-10.6'], tags: ['Jordan–Schoenflies', 'homeomorphism'],
      links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf' },
      viz(v) {
        const shape = v.select('target curve', [{ value: 'blob', label: 'blob' }, { value: 'star', label: 'five-pointed' }, { value: 'pear', label: 'pear' }], 'blob', { onChange: () => reset() });
        const orientation=v.select('boundary orientation',[{value:'preserve',label:'preserving'},{value:'reverse',label:'reversing'}],'preserve');
        const sL = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'source polygon and bounded disc' });
        const sR = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 340, title: 'target polygon and bounded disc' });
        const th = [0, 1, 2, 3].map((i) => (i * Math.PI) / 2), al = th.slice();
        const COL = ['blue', 'orange', 'green', 'purple'];
        const rho=(a)=>polygonRadius(shape.value,a),C=[0,0];
        const pt = (a) => [C[0] + rho(a) * Math.cos(a), C[1] + rho(a) * Math.sin(a)];
        const wrap = (x) => { while (x > Math.PI) x -= TAU; while (x <= -Math.PI) x += TAU; return x; };
        const hs = th.map((t, i) => {
          const h = sR.handle(...pt(t), {
            color: COL[i], r: 8,
            constrain: (x, y) => {
              let a = th[i] + wrap(Math.atan2(y - C[1], x - C[0]) - th[i]);
              const lo = (i === 0 ? al[3] - TAU : al[i - 1]) + 0.2, hi = (i === 3 ? al[0] + TAU : al[i + 1]) - 0.2;
              a = Math.max(lo, Math.min(hi, a)); al[i] = a; return pt(a);
            },
          });
          return h;
        });
        function reset() { al.splice(0, 4, ...th); hs.forEach((h, i) => h.set(...pt(th[i]))); }
        const phi=t=>angularMap(t,al,orientation.value==='reverse');
        const F=(r,t)=>conePoint(r,t,shape.value,al,orientation.value==='reverse');
        const sourcePoint=(r,t)=>{const rho=polygonRadius('source',t);return [r*rho*Math.cos(t),r*rho*Math.sin(t)];};
        let info = null;
        v.render(() => {
          const NR=5,NS=24,NT=160;const reverse=orientation.value==='reverse',samples=coneMeshAngles(shape.value,al,reverse);hs.forEach((h,i)=>h.color=COL[reverse?(4-i)%4:i]);
          // sectors tinted by quarter
          for (let q = 0; q < 4; q++) {
            const t0 = th[q], t1 = t0 + Math.PI / 2, B = [[0, 0]], D = [[0, 0]];
            for(const t of samples.filter(t=>t>=t0-1e-10&&t<=t1+1e-10)){B.push(sourcePoint(1,t));D.push(F(1,t));}
            sL.poly(B, { fill: COL[q], fillAlpha: 0.14, stroke: false }); sR.poly(D, { fill: COL[q], fillAlpha: 0.14, stroke: false });
          }
          for (let k = 1; k <= NR; k++) {
            const r = k / NR, a = [], b = [];
            for(const t of samples){a.push(sourcePoint(r,t));b.push(F(r,t));}
            sL.path(a, { color: k === NR ? 'ink' : 'muted', width: k === NR ? 2.6 : 1.2 }); sR.path(b, { color: k === NR ? 'ink' : 'muted', width: k === NR ? 2.6 : 1.2 });
          }
          for (let j = 0; j < NS; j++) {
            const t = (TAU * j) / NS; sL.line(0,0,...sourcePoint(1,t), { color: 'muted', width: 1.2 }); const e = F(1, t); sR.line(C[0], C[1], e[0], e[1], { color: 'muted', width: 1.2 });
          }
          th.forEach((t, i) => sL.dot(...sourcePoint(1,t), { r: 8, color: COL[i], label: String(i + 1) }));
          const gaps=al.map((a,i)=>(i===3?al[0]+TAU:al[i+1])-a);
          info={minGap:Math.min(...gaps),minSlope:Math.min(...gaps)/(Math.PI/2),radial:radialLower[shape.value]*Math.cos(Math.PI/80),reverse};
        });
        v.readout(()=>info&&`Minimum target radial bound $${v.fix(info.radial,4)}>0$; minimum angular gap $${v.fix(info.minGap,4)}$ radians, so $|\\varphi'|\\ge${v.fix(info.minSlope,4)}>0$ on each linear piece. The angular map is strictly ${info.reverse?'decreasing (orientation reversing)':'increasing (orientation preserving)'}. Its inverse and positive radial division define the inverse disc map; finite mesh cells are only an illustration.`);
      },
    },
    // ====================================================================== 4.2 Plane graphs
    {
      num: '4.2.1a', kind: 'Definition', name: 'Plane graphs and faces',
      statement: String.raw`A **plane graph** is a pair $(V,E)$ of finite sets with $V\subseteq\R^2$, in which every edge is an arc between two vertices, different edges have different sets of endpoints, and the interior of an edge contains no vertex and no point of any other edge. The **faces** of a plane graph $G$ are the regions of $\R^2\setminus G$. Exactly one face is unbounded, the **outer face**; the others are **inner faces**. $F(G)$ is the set of faces.`,
      idea: String.raw`A plane graph is a graph together with one particular crossing-free drawing. The faces are the pieces the drawing leaves of the plane, so they are determined by the drawing and not by the abstract graph, and the same graph can have differently shaped faces in different drawings. Every face is open and its frontier lies in $G$.`,
      caption: String.raw`Edit the drawing (${'click empty space to add a vertex, click two vertices to join them, drag to move, Alt-click to delete'}); crossings and edge/foreign-vertex contacts are refused on release, and vertices must stay at least 0.08 data units apart for numerical clearance. Clicking an already joined pair removes that edge. Faces are tinted and numbered, the outer face is grey. For a plane graph with $c$ components, $n-m+\ell=1+c$.`,
      deps: ['graph-4.1.1a', 'graph-1.1.1a'], refs: ['Diestel, Graph Theory, sixth-edition author preview (2025), unnumbered plane-graph and face definitions, pp.96–97'], tags: ['plane graph', 'faces'], links: { source: 'https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf' },
      viz(v) {
        const PRE = {
          house: () => planeSpec({ a: [2, 1], b: [7, 1], c: [7, 4], d: [4.5, 5.4], e: [2, 4], f: [4.5, 6.0] }, 'ab bc cd de ea ac df'),
          cube: () => pgSpec(PGS.cube()),
          comps: () => planeSpec({ a: [1.2, 1.2], b: [3.8, 1.2], c: [2.5, 4.4], d: [5.6, 1.4], e: [8.6, 1.4], f: [8.6, 4.6], g: [5.6, 4.6], h: [4.4, 5.5] }, 'ab bc ca de ef fg gd'),
          tree: () => planeSpec({ a: [1, 3.2], b: [3, 4.8], c: [3, 1.6], d: [5, 5.4], e: [5, 3.6], f: [5, 1.2], g: [7, 4.4], h: [8.8, 3.2] }, 'ab ac bd be cf eg gh'),
        };
        const sel = v.select('', [{ value: 'house', label: 'house' }, { value: 'cube', label: 'cube' }, { value: 'comps', label: 'three components' }, { value: 'tree', label: 'tree' }], 'house', { onChange: () => { loadG(G, PRE[sel.value]()); guard.reset(); } });
        const s = gstage(v, { height: 350 });
        const st = { msg: '' };
        const G = v.graph(s, { ...PRE.house(), r: 10, editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true } });
        const guard = checkedPlaneGuard(G, st);
        let info = null;
        v.render(() => {
          const ps = checkedPlaneState(G);
          if (ps.bad.length) { markCross(s, ps.bad); info = { bad: true }; G.draw({}); s.corner('crossing: release to undo', 'tr', { color: 'red', weight: 700 }); return; }
          const F = ps.F;
          paintFaces(s, F, { colorOf: (i) => (i ? FILLS[(i - 1) % 8] : 'muted'), alpha: 0.2 });
          G.draw({ nodeColor: 'ink' });
          F.faces.forEach((f, i) => { if (!f.walks.length && i) return; const p = innerPoint(F, i); s.text(i ? String(i) : 'outer', p[0], p[1], { size: 15, color: 'ink', align: 'center', baseline: 'middle', weight: 700 }); });
          if (st.msg) s.corner(st.msg, 'bl', { color: 'red', weight: 600, size: 12.5 });
          info = { n: ps.P.length, m: ps.E.length, l: F.faces.length, c: F.comps, lens: F.faces.map((f) => f.len) };
        });
        v.readout(() => (info && !info.bad ? `${st.msg?st.msg+' · ':''}$n=${info.n}$, $m=${info.m}$, $\\ell=${info.l}$ faces, $c=${info.c}$ component${info.c === 1 ? '' : 's'} · $n-m+\\ell=${info.n - info.m + info.l}$ $=1+c$ ${info.n - info.m + info.l === 1 + info.c ? '✓' : '✗'} · face lengths (outer first): ${info.lens.join(', ')}` : ''));
      },
    },
    {
      num: '4.2.1', kind: 'Lemma', name: 'Faces of a plane graph lie inside faces of its subgraphs',
      statement: String.raw`Let $G$ be a plane graph, $f\in F(G)$ a face and $H\subseteq G$ a subgraph.

(i) $H$ has a face $f'$ containing $f$.

(ii) If the frontier of $f$ lies in $H$, then $f'=f$.`,
      idea: String.raw`(i) The points of $f$ can be joined by arcs avoiding $G$, hence avoiding $H$; so they are equivalent in $\R^2\setminus H$ and lie in a common face $f'$. (ii) If $f'$ were larger than $f$, an arc inside $f'$ from a point of $f$ to a point outside $f$ would have to meet the frontier of $f$ at its first point outside $f$. That point is on $H$, but $f'$ avoids $H$: a contradiction.`,
      caption: String.raw`Click an edge to delete it from $H$ (click again to put it back; deleted edges are dashed). Each face of $G$ is tinted with the colour of the face of $H$ that contains it. A face of $G$ whose whole frontier survives in $H$ keeps its colour to itself, and is then a face of $H$, as in (ii).`,
      deps: ['graph-4.2.1a'], refs: ['Diestel §4.2'], tags: ['faces', 'subgraphs'],
      viz(v) {
        const s = gstage(v, { height: 350 });
        const spec = pgSpec(PGS.cube());
        const nodes = spec.nodes;
        const G = v.graph(s, { nodes, edges: spec.edges.concat([['e', 'g']]), r: 10, editable: {} });
        const off = new Set(['e-g', 'g-h']);
        const key = (e) => K(e.from) + '-' + K(e.to);
        G.onClick = ({ edge, node }) => { if (edge) { const k = key(edge); off.has(k) ? off.delete(k) : off.add(k); return true; } return !!node && false; };
        const st = { msg: '' }; planeGuard(G, st);
        v.button('restore all edges', () => off.clear());
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const FG = ps.F, keep = ps.E.map((_, i) => i).filter((i) => !off.has(key(ps.eo[i])));
          const FH = faceStruct(ps.P, keep.map((i) => ps.E[i]));
          const colH = (h) => (h ? FILLS[(h - 1) % 8] : 'muted');
          const contain = FG.faces.map((f, i) => { const p = innerPoint(FG, i); return FH.locate(p[0], p[1]); });
          paintFaces(s, FG, { colorOf: (i) => colH(contain[i]), alpha: 0.24 });
          const keptKey = new Set(keep.map((i) => key(ps.eo[i])));
          G.draw({ edgeDash: (e) => off.has(key(e)), edgeColor: (e) => (off.has(key(e)) ? 'red' : null), edgeWidth: (e) => (off.has(key(e)) ? 1.4 : 2.4) });
          // faces of G whose frontier lies in H
          let same = 0, ok = 0;
          FG.faces.forEach((f, i) => {
            const fe = [...f.edges].map((k) => key(ps.eo[k]));
            if (fe.every((k) => keptKey.has(k))) {
              same++;
              const hf = FH.faces[contain[i]], he = new Set([...hf.edges].map((k) => key(ps.eo[keep[k]])));
              if (sameSet(he, new Set(fe))) ok++;
            }
          });
          const nIn = FH.faces.map((_, h) => contain.filter((c) => c === h).length);
          info = { lg: FG.faces.length, lh: FH.faces.length, same, ok, nIn };
        });
        v.legend([['red', 'deleted edge', { dash: true }]]);
        v.readout(() => (info ? `$G$ has **${info.lg}** faces, $H$ has **${info.lh}**; faces of $G$ inside each face of $H$ (outer first): ${info.nIn.join(', ')} · ${info.same} face${info.same === 1 ? '' : 's'} of $G$ with frontier in $H$, of which ${info.ok} are faces of $H$ ${info.same === info.ok ? '✓' : '✗'}` : ''));
      },
    },
    {
      num: '4.2.2', kind: 'Lemma', name: 'An edge on a cycle lies on the frontier of exactly two faces',
      statement: String.raw`Let $G$ be a plane graph and $e$ an edge of $G$.

(i) If $X$ is the frontier of a face of $G$, then either $e\subseteq X$ or $X\cap\mathring e=\emptyset$.

(ii) If $e$ lies on a cycle $C\subseteq G$, then $e$ lies on the frontier of exactly two faces of $G$, and these are contained in distinct faces of $C$.

(iii) If $e$ lies on no cycle, then $e$ lies on the frontier of exactly one face of $G$.`,
      idea: String.raw`Near an inner point of $e$ the plane is cut by $e$ into two half-discs, each inside a face; call these faces $f_1$ and $f_2$. If $e$ is on a cycle, the two half-discs lie on different sides of the cycle (Jordan), so $f_1\ne f_2$. If $e$ is a bridge, it joins two disjoint pieces and by Lemma 4.1.3 removing it does not split the face around it, so $f_1=f_2$. Sliding along $e$ the same two faces stay on its two sides, which gives (i).`,
      caption: String.raw`Click an edge (or edit the graph). The two faces on its sides light up in different colours. A bridge has the same face on both sides; for an edge on a cycle, the app also draws a cycle $C$ through it (gold) and checks that the two faces lie one inside and one outside $C$.`,
      deps: ['graph-4.2.1', 'graph-4.1.1', 'graph-4.1.3'], refs: ['Diestel §4.2'], tags: ['faces', 'bridges', 'cycles'],
      viz(v) {
        const s = gstage(v, { height: 350 });
        const spec = planeSpec({ a: [1.4, 1.0], b: [5.0, 1.0], c: [5.0, 4.4], d: [1.4, 4.4], e: [3.2, 2.7], f: [6.6, 2.7], g: [8.4, 1.4], h: [8.4, 4.4], i: [3.2, 5.8] }, 'ab bc cd da ae be ce de bf fg fh di');
        const G = v.graph(s, { ...spec, r: 10, editable: { addEdge: true, deleteEdge: true, addNode: true, deleteNode: true } });
        const st = { msg: '' }; const guard = planeGuard(G, st);
        let sel = null; // edge key
        const key = (e) => K(e.from) + '-' + K(e.to);
        G.onClick = ({ edge, alt }) => { if (edge && !alt) { sel = key(edge); return true; } return false; };
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          if (ps.bad.length) { markCross(s, ps.bad); G.draw({}); return; }
          const F = ps.F; let k = ps.eo.findIndex((e) => key(e) === sel);
          if (k < 0) { sel = null; k = 0; }
          if (!ps.E.length) { G.draw({}); info = null; return; }
          const fl = F.faceOfHe[2 * k], fr = F.faceOfHe[2 * k + 1];
          paintFaces(s, F, { colorOf: (i) => (i === fl && i === fr ? 'red' : i === fl ? 'blue' : i === fr ? 'orange' : null), alpha: 0.28 });
          // a cycle through the edge: shortest path avoiding e
          const [a, b] = ps.E[k], adj = ps.P.map(() => []);
          ps.E.forEach(([x, y], i) => { if (i !== k) { adj[x].push([y, i]); adj[y].push([x, i]); } });
          const prev = new Array(ps.P.length).fill(null); prev[a] = [-1, -1]; const Q = [a];
          while (Q.length && !prev[b]) { const u = Q.shift(); for (const [w, i] of adj[u]) if (!prev[w]) { prev[w] = [u, i]; Q.push(w); } }
          let cyc = null;
          if (prev[b]) { cyc = [b]; for (let u = b; u !== a; u = prev[u][0]) cyc.push(prev[u][0]); }
          let split = null;
          if (cyc) {
            const poly = cyc.map((i) => ps.P[i]);
            for (let i = 0; i < cyc.length; i++) { const p = ps.P[cyc[i]], q = ps.P[cyc[(i + 1) % cyc.length]]; s.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 6, alpha: 0.8 }); }
            const pl = innerPoint(F, fl), pr = innerPoint(F, fr);
            const wl = winding(poly, pl[0], pl[1]) !== 0, wr = winding(poly, pr[0], pr[1]) !== 0;
            split = wl !== wr;
          }
          G.draw({ edgeColor: (e) => (key(e) === sel ? 'accent' : null), edgeWidth: (e) => (key(e) === sel ? 4.4 : 2.2) });
          if (st.msg) s.corner(st.msg, 'bl', { color: 'red', weight: 600 });
          info = { e: `${G.lab(ps.ids[a])}${G.lab(ps.ids[b])}`, bridge: fl === fr, split, l: F.faces.length };
        });
        v.legend([['blue', 'face on the left', { area: true }], ['orange', 'face on the right', { area: true }], ['red', 'same face on both sides', { area: true }], ['gold', 'a cycle through the edge']]);
        v.readout(() => (info ? (info.bridge ? `edge **${info.e}** lies on no cycle: it is a bridge and borders **one** face (case iii)` : `edge **${info.e}** lies on a cycle: it borders **two** different faces ${info.split ? '— one inside the gold cycle, one outside ✓' : '✗'}`) + ` · the graph has ${info.l} faces` : 'click an edge'));
      },
    },
    {
      num: '4.2.3', kind: 'Corollary', name: 'Face frontiers are subgraphs',
      statement: String.raw`The frontier of a face of a plane graph is always the point set of a subgraph: it consists of whole edges and their ends, never of half an edge. This subgraph $G[f]$ is called the **boundary** of the face $f$.`,
      idea: String.raw`By Lemma 4.2.2 (i), the frontier of a face either contains an edge or misses its interior altogether. So the frontier is the union of the edges it contains together with their endpoints; a vertex on the frontier belongs to the frontier of an incident edge's face, so nothing else can occur.`,
      caption: String.raw`Click inside a face. The face is tinted, and its frontier is extracted on the right as a subgraph: whole edges and their ends. A test independent of the construction probes five points beside every edge on both sides, and the readout compares the result with the extracted boundary.`,
      deps: ['graph-4.2.1', 'graph-4.2.2'], refs: ['Diestel §4.2'], tags: ['faces', 'boundary'],
      viz(v) {
        const sL = gstage(v, { height: 340, title: 'the plane graph' }), sR = gstage(v, { height: 340, title: 'the boundary of the chosen face' });
        const spec = planeSpec({ a: [1.2, 1.0], b: [4.8, 1.0], c: [4.8, 3.6], d: [1.2, 3.6], e: [3.0, 5.6], f: [7.0, 2.2], g: [8.8, 4.2], h: [6.6, 4.8], i: [3.0, 2.3] }, 'ab bc cd da de ec bf fg gh hb ci');
        const G = v.graph(sL, { ...spec, r: 10, editable: { addEdge: true, deleteEdge: true, addNode: true, deleteNode: true } });
        const st = { msg: '' }; planeGuard(G, st);
        let face = 1;
        G.onClick = ({ node, edge, x, y, alt }) => {
          if (node || edge || alt) return false;
          const ps = planeState(G); if (!ps.F) return true;
          face = ps.F.locate(x, y); return face > 0 ? true : (face = 0, true);
        };
        const H = v.graph(sR, { nodes: [], edges: [], r: 10, draggable: false });
        let info = null;
        v.render(() => {
          const ps = planeState(G);
          sR.corner('', 'tl');
          if (ps.bad.length) { markCross(sL, ps.bad); G.draw({}); return; }
          const F = ps.F; if (face >= F.faces.length) face = 0;
          paintFaces(sL, F, { colorOf: (i) => (i === face ? 'accent' : null), alpha: 0.28 });
          const f = F.faces[face];
          G.draw({ edgeColor: (e) => { const k = ps.eo.indexOf(e); return k >= 0 && f.edges.has(k) ? 'accent' : null; }, edgeWidth: (e) => { const k = ps.eo.indexOf(e); return k >= 0 && f.edges.has(k) ? 4.4 : 1.6; }, nodeColor: (id) => (f.verts.has(ps.idx.get(K(id))) ? 'accent' : 'faint') });
          // right: the boundary subgraph in place
          const ids = [...f.verts].map((i) => ps.ids[i]), eds = [...f.edges].map((k) => [ps.eo[k].from, ps.eo[k].to]);
          H.set({ nodes: ids.map((id) => { const n = G.node(id); return { id, x: n.x, y: n.y }; }), edges: eds });
          H.draw({ edgeColor: () => 'accent', edgeWidth: () => 3.4, nodeColor: () => 'accent' });
          // independent probe: points beside each edge, on both sides
          let agree = 0, tot = 0;
          ps.E.forEach(([a, b], k) => {
            const A = ps.P[a], B = ps.P[b], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; let touches = false;
            for (const t of [0.15, 0.3, 0.5, 0.7, 0.85]) for (const sd of [-1, 1]) {
              if (F.locate(A[0] + dx * t - (sd * 0.03 * dy) / L, A[1] + dy * t + (sd * 0.03 * dx) / L) === face) touches = true;
            }
            tot++; if (touches === f.edges.has(k)) agree++;
          });
          info = { face, nv: f.verts.size, ne: f.edges.size, agree, tot, l: F.faces.length };
          sL.corner(face ? `face ${face}` : 'outer face', 'tr', { color: 'accent', weight: 700 });
        });
        v.readout(() => (info ? `the ${info.face ? 'face' : 'outer face'} is bounded by a subgraph with **${info.nv} vertices** and **${info.ne} whole edges** · probes agree with the boundary on **${info.agree} of ${info.tot}** edges ${info.agree === info.tot ? '✓' : '✗'}` : ''));
      },
    },
  ],
};
