// Computational Geometry & Graphics — Chapter 3: Segment intersection and polygons (§§3.6–3.9; §§3.1–3.5 in ch03.js)
import { cross, hull2, ccwPoly, area2, pip, segCross, isSimplePoly, triangulate, segInside, visPoly, makeMonotone, splitByDiagonals, monotoneTriangulate, minkowski, convexOverlap, dijkstraTrace } from './ch03.shared.js';

const v2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 7], equal: true, axes: false, height: 340, ...o });
const centroid = (poly) => poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
/** Chvátal's comb with k teeth: 3k vertices, counter-clockwise, each tooth needs its own guard. */
function comb(k) {
  const sp = Math.min(2, 9 / k), w = 0.2 * sp, yb = 1.8, yt = 6.1, y0 = 0.7, x0 = (10 - k * sp) / 2, xc = (i) => x0 + sp * (i + 0.5);
  const P = [[xc(0) - w, y0], [xc(k - 1) + w, y0]];
  for (let i = k - 1; i >= 0; i--) { P.push([xc(i), yt]); if (i > 0) { P.push([xc(i) - w, yb]); P.push([xc(i - 1) + w, yb]); } }
  return { P, tips: Array.from({ length: k }, (_, i) => [xc(i), yt - 0.05]) };
}
/** Proper 3-colouring of the vertices of a triangulation (the dual graph is a tree, so a walk over it colours everything). */
function color3(n, tris) {
  const col = new Array(n).fill(-1), E = new Map();
  tris.forEach((t, i) => { for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3], k = Math.min(a, b) + ',' + Math.max(a, b); if (!E.has(k)) E.set(k, []); E.get(k).push(i); } });
  const seen = new Set([0]), Q = [0]; tris[0].forEach((x, i) => { col[x] = i; });
  while (Q.length) {
    const i = Q.shift(), t = tris[i];
    for (let e = 0; e < 3; e++) {
      const a = t[e], b = t[(e + 1) % 3];
      for (const j of E.get(Math.min(a, b) + ',' + Math.max(a, b))) {
        if (seen.has(j)) continue;
        seen.add(j); const c = tris[j].find((x) => x !== a && x !== b); col[c] = 3 - col[a] - col[b]; Q.push(j);
      }
    }
  }
  return col;
}
const CLS = ['orange', 'teal', 'purple'];

export default {
  collection: 'cg',
  chapter: 3,
  items: [
    // ================================================================== 3.6
    {
      num: '3.6', kind: 'Theorem', name: 'Art gallery theorem',
      statement: String.raw`Every simple polygon with $n\ge3$ vertices can be guarded by at most $\lfloor n/3\rfloor$ guards placed at its vertices: there is a set $G$ of at most $\lfloor n/3\rfloor$ vertices such that every point of the polygon is joined to some $g\in G$ by a segment that stays inside the polygon. The bound cannot be improved: for every $k\ge1$ there are polygons with $n=3k$ vertices (the **combs**) that need $k=\lfloor n/3\rfloor$ guards, even with guards anywhere in the polygon.`,
      idea: String.raw`Triangulate the polygon (3.5) — its dual graph is a tree. Then the vertices can be coloured with three colours so that every triangle gets all three: colour one triangle, and walk over the tree, where each new triangle shares an edge with an old one and its one new vertex takes the third colour. Every triangle has a vertex of each colour, and a guard at a vertex sees its whole triangle (a triangle is convex), so any one colour class guards the polygon. The three classes partition the $n$ vertices, so the smallest has at most $\lfloor n/3\rfloor$ of them. For tightness, each tooth of a comb has a tip that is seen only from within a narrow cone below it; the cones of different teeth are disjoint, so each tooth needs its own guard.

The final guard count uses the averaging form of the pigeonhole principle (COMB 1.2). If all three color classes had more than $\lfloor n/3\rfloor$ vertices, each would have at least $\lfloor n/3\rfloor+1$, making their total exceed $n$. Hence a smallest class has at most $\lfloor n/3\rfloor$ vertices. This only bounds the size after the triangulation and valid three-coloring have already shown that every class guards the whole polygon.`,
      caption: String.raw`A random gallery (drag its vertices, or choose **comb**). Its triangulation is faint, vertices carry the three colours of the proper 3-colouring, and the guards are the vertices of the class you select, each with its **visibility region** shaded; any red dots mark a point nobody sees (there are none, for every class). **Smallest** picks the class with fewest vertices. In **comb** mode switch on *tip cones*: the red regions are exactly the places that see the tip of each tooth; they never overlap, so $k$ guards are necessary and $\lfloor n/3\rfloor=k$ suffice. Break the hypothesis by dragging an edge across another: then the polygon is not simple and nothing is claimed.`,
      credit: 'V. Chvátal, 1975 (problem posed by V. Klee, 1973); the 3-colouring proof is S. Fisk, 1978',
      deps: ['cg-3.5', 'comb-1.2'], refs: ['de Berg §3.1'], tags: ['visibility', 'polygon'],
      viz(v) {
        const s = gstage(v, { height: 400, minWidth: 360 });
        const kind = v.select('gallery', [{ value: 'rand', label: 'random' }, { value: 'comb', label: 'comb' }], 'rand', { onChange: () => load() });
        const nsl = v.slider('vertices $n$', 6, 18, 12, { int: true, onChange: () => load() });
        const ksl = v.slider('teeth $k$', 2, 6, 4, { int: true, onChange: () => load() });
        const which = v.select('guards', [{ value: 'min', label: 'smallest class' }, { value: '0', label: 'class 1' }, { value: '1', label: 'class 2' }, { value: '2', label: 'class 3' }], 'min');
        const cones = v.toggle('tip cones (comb)', true);
        let seed = 3;
        const H = Array.from({ length: 18 }, () => s.handle(5, 3, { color: 'ink', r: 6 }));
        const randomPoly = () => { const r = v.rng(seed * 17 + nsl.value), n = nsl.value, th = Array.from({ length: n }, () => r.uniform(0, 2 * Math.PI)).sort((a, b) => a - b); return th.map((t) => { const rr = r.uniform(0.9, 3.2); return [5 + 1.45 * rr * Math.cos(t), 3.5 + rr * Math.sin(t)]; }); };
        let tips = [];
        const load = () => {
          let P, i = 0;
          if (kind.value === 'comb') { const c = comb(ksl.value); P = c.P; tips = c.tips; } else { P = randomPoly(); tips = []; }
          H.forEach((h, k) => { if (k < P.length) { h.set(P[k][0], P[k][1]); h.visible = kind.value === 'rand'; } else h.visible = false; });
          nsl.el.hidden = kind.value === 'comb'; ksl.el.hidden = kind.value === 'rand'; cones.el.hidden = kind.value === 'rand';
          combP = kind.value === 'comb' ? P : null; v.invalidate();
        };
        let combP = null;
        v.button('resample', () => { seed++; kind.value = 'rand'; load(); });
        load();
        let info = {};
        v.render(() => {
          const raw = combP || H.filter((h) => h.visible).map((h) => [h.x, h.y]);
          const P = ccwPoly(raw), n = P.length;
          if (!isSimplePoly(P)) { s.poly(P, { color: 'red', width: 3 }); s.corner('not a simple polygon: the theorem needs one', 'tl', { color: 'red', weight: 600 }); info = { bad: true }; return; }
          const tri = triangulate(P); if (!tri) { info = { bad: true }; return; }
          const col = color3(n, tri), cnt = [0, 1, 2].map((c) => col.filter((x) => x === c).length);
          const cls = which.value === 'min' ? cnt.indexOf(Math.min(...cnt)) : +which.value;
          const G = P.map((_, i) => i).filter((i) => col[i] === cls);
          s.poly(P, { fill: 'accent', fillAlpha: 0.05, color: 'accent', width: 3 });
          // visibility regions
          const VP = G.map((gi) => visPoly(P[gi], P, gi));
          VP.forEach((vp) => { if (vp.length > 2) s.poly(vp, { fill: CLS[cls], fillAlpha: 0.2, color: CLS[cls], width: 1, alpha: 0.9 }); });
          tri.forEach((t) => { for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3]; if (a < b || true) s.segment(P[a], P[b], { color: 'faint', width: 1, alpha: 0.7 }); } });
          let tipCones = 0;
          if (combP && cones.value) {
            const vs = tips.map((t) => visPoly(t, P));
            vs.forEach((vp) => s.poly(vp, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.5 }));
            tips.forEach((t) => s.dot(t[0], t[1], { r: 4, color: 'red' }));
            for (let x = 0.05; x < 10; x += 0.1) for (let y = 0.05; y < 7; y += 0.1) { const p = [x, y]; if (pip(p, P) && vs.filter((vp) => pip(p, vp)).length > 1) tipCones++; }
            info.tipCones = tipCones;
          }
          // coverage by direct segment tests
          let miss = 0, total = 0; const bad = [];
          for (let x = 0.1; x < 10; x += 0.2) for (let y = 0.1; y < 7; y += 0.2) {
            const p = [x, y]; if (!pip(p, P)) continue; total++;
            if (!G.some((gi) => segInside(P[gi], p, P))) { miss++; bad.push(p); }
          }
          bad.forEach((p) => s.dot(p[0], p[1], { r: 3, color: 'red' }));
          P.forEach((p, i) => { s.dot(p[0], p[1], { r: 9, color: CLS[col[i]], hollow: true }); });
          G.forEach((gi) => s.dot(P[gi][0], P[gi][1], { r: 13, color: 'ink', hollow: true }));
          info = { n, cnt, cls, G: G.length, miss, total, tipCones: combP && cones.value ? tipCones : null, k: combP ? ksl.value : null, tri: tri.length };
        });
        v.legend([['orange', 'class 1'], ['teal', 'class 2'], ['purple', 'class 3']]);
        v.readout(() => { if (info.bad) return 'The polygon is not simple (edges cross), so it has no inside to guard and no triangulation: the theorem makes no claim here.'; const i = info;
          return `$n=${i.n}$, triangulation: $${i.tri}=n-2$ triangles. Colour classes have sizes $${i.cnt.join(',\\ ')}$ (sum $${i.n}$); guards used: $${i.G}$ from class ${i.cls + 1}, bound $\\lfloor n/3\\rfloor=${Math.floor(i.n / 3)}$ — ${i.G <= Math.floor(i.n / 3) ? '**within the bound**' : 'above'}.\nCoverage by direct visibility tests: ${i.total - i.miss} of ${i.total} sample points seen (${i.miss === 0 ? '**all**' : i.miss + ' missed'}).` + (i.tipCones != null ? `\nComb with $k=${i.k}$ teeth: the $k$ tip cones share ${i.tipCones} sample points (0 means disjoint), so any guard set needs at least $k=\\lfloor n/3\\rfloor$ guards: the bound is tight.` : ''); });
      },
    },
    // ================================================================== 3.7
    {
      num: '3.7', kind: 'Algorithm', name: 'Monotone partition and triangulation',
      statement: String.raw`A simple polygon is **$y$-monotone** if every horizontal line meets it in a single segment (or point, or nothing). A simple polygon with $n$ vertices can be triangulated in $O(n\log n)$ time in two stages. (1) A top-to-bottom sweep classifies each vertex as **start, end, split, merge** or **regular** (by whether its neighbours are both below or both above it, and whether the interior angle is more or less than $\pi$) and adds diagonals from every split and merge vertex, which are exactly the vertices that prevent monotonicity; the pieces are $y$-monotone. (2) Each monotone polygon is triangulated in linear time by a stack-based scan of its vertices in order of $y$. The polygon has no split or merge vertex if and only if it is $y$-monotone.`,
      idea: String.raw`A polygon fails to be monotone exactly where the boundary has a local-minimum-like bend that is reflex: a split vertex (both neighbours below, interior angle $>\pi$) or a merge vertex (both above). The sweep of 3.1 keeps the polygon edges immediately left of the sweep line in a search tree, each with a *helper* — the lowest vertex seen so far between that edge and the interior to its right. A split vertex is joined to the helper of the edge on its left, a merge vertex becomes the helper of the edge on its left and is joined by a diagonal as soon as that helper is replaced (or the edge ends) further down, and each diagonal removes the offending bend. In a monotone piece the stack always holds a reflex chain visible from the current vertex, so each vertex is pushed and popped once: linear time.`,
      caption: String.raw`Step through the sweep (top to bottom, gold line). Vertex colours: green start, red end, orange split, purple merge, grey regular. Blue edges are the status (edges left of the line with the interior to their right) and orange dashes link each to its helper; green segments are the diagonals added at split and merge vertices. After the last vertex the pieces are shaded and each is triangulated by the stack scan (blue rings: the stack, gold: the vertex being processed). Drag the vertices or choose another polygon; if two edges cross the polygon is not simple and the algorithm has no meaning.`,
      credit: 'Garey, Johnson, Preparata & Tarjan, 1978 (triangulation of a simple polygon in O(n log n) via monotone pieces)',
      deps: ['cg-3.5', 'cg-3.1'], refs: ['de Berg §3.2', 'de Berg §3.3'], tags: ['triangulation', 'sweep'],
      viz(v) {
        const s = gstage(v, { height: 400, minWidth: 360 });
        const PRE = { M: [[0.8, 3.2], [1.8, 0.6], [3.4, 2.4], [5.0, 0.9], [8.2, 1.6], [9.2, 4.2], [7.4, 6.4], [5.6, 4.2], [3.6, 6.2], [2.0, 5.4]] };
        let seed = 5;
        const randomPoly = () => { const r = v.rng(seed * 13 + 1), n = 12, th = Array.from({ length: n }, () => r.uniform(0, 2 * Math.PI)).sort((a, b) => a - b); return th.map((t) => { const rr = r.uniform(0.9, 3.2); return [5 + 1.45 * rr * Math.cos(t), 3.5 + rr * Math.sin(t)]; }); };
        const pre = v.select('polygon', [{ value: 'M', label: 'M shape' }, { value: 'rand', label: 'random' }], 'M', { onChange: () => load() });
        const H = Array.from({ length: 12 }, () => s.handle(5, 3, { color: 'ink', r: 5 }));
        let S, P = [], M = null, pieces = [], PT = [], bad = false;
        const load = () => { const Q = pre.value === 'rand' ? randomPoly() : PRE.M; H.forEach((h, i) => { if (i < Q.length) { h.set(Q[i][0], Q[i][1]); h.visible = true; } else h.visible = false; }); if (S) S.reset(); };
        v.button('resample', () => { seed++; pre.value = 'rand'; load(); });
        const build = () => {
          P = ccwPoly(H.filter((h) => h.visible).map((h) => [h.x, h.y]));
          bad = !isSimplePoly(P); M = null; pieces = []; PT = [];
          if (bad) return [{ phase: 0, bad: true, note: 'Two edges cross or touch: the polygon is **not simple**, so the sweep and the stack scan make no sense. Move the vertices back.' }];
          M = makeMonotone(P);
          const fr = M.frames.map((f, i) => ({ ...f, phase: 1, line: f.type === 'start' ? 3 : f.type === 'end' ? 4 : f.type === 'split' ? 5 : f.type === 'merge' ? 6 : f.type ? 7 : 2, vars: f.v == null ? {} : { vertex: f.v, diagonals: f.diags.length } }));
          pieces = splitByDiagonals(P, M.diags);
          let doneTris = [];
          pieces.forEach((ids, k) => {
            const T = ids.length === 3 ? { frames: [], tris: [ids], diags: [], sorted: ids, chain: {} } : monotoneTriangulate(P, ids);
            PT.push(T);
            if (ids.length === 3) fr.push({ phase: 2, piece: k, ids, stack: [], j: null, diags: [], doneTris: doneTris.slice(), line: 9, note: `Piece ${k + 1} is a triangle already.` });
            T.frames.forEach((f) => fr.push({ phase: 2, piece: k, ids, ...f, doneTris: doneTris.slice(), line: f.j == null ? 9 : 10, note: `Piece ${k + 1} (${ids.length} vertices). ${f.note}`, vars: { stack: f.stack.length, diagonals: f.diags.length } }));
            if (ids.length > 3) fr.push({ phase: 2, piece: k, ids, stack: [], j: null, diags: T.diags, tris: T.tris, doneTris: doneTris.slice(), line: 11, note: `Piece ${k + 1} is triangulated: ${T.tris.length} triangles.` });
            doneTris = doneTris.concat(T.tris);
          });
          fr.push({ phase: 3, ids: [], doneTris, diags: [], note: `Done: ${pieces.length} monotone pieces, ${doneTris.length} triangles $=n-2$ for $n=${P.length}$.`, line: 11 });
          return fr;
        };
        load();
        S = v.steps({ frames: build, code: ['sort the vertices from top to bottom', 'for each vertex v in this order', '  start: insert its edge in T, helper(e) ← v', '  end: if helper(e⁻) is a merge vertex: diagonal; delete e⁻', '  split: diagonal v–helper(left edge); helper(left) ← v', '  merge: as for end; then fix the helper of the left edge', '  regular: update T and the helper as for its chain', 'pieces ← faces of P plus the diagonals', 'for each monotone piece: push the two highest vertices', '  for each next vertex: opposite chain → connect to the stack; same chain → pop while inside', 'last vertex: connect to the rest of the stack'], codeTitle: 'Monotone triangulation', speed: 1.3, still: 21 });
        H.forEach((h) => { h.onDrag = () => S.reset(undefined, { at: 'keep' }); });
        const TC = { start: 'green', end: 'red', split: 'orange', merge: 'purple', regular: 'muted' };
        const PIECE = ['blue', 'orange', 'teal', 'purple', 'pink', 'green'];
        v.render(() => {
          const f = S.frame; if (!P.length) return;
          if (bad || f.bad) { s.poly(P, { color: 'red', width: 3 }); return; }
          const n = P.length;
          if (f.phase >= 2) pieces.forEach((ids, k) => s.poly(ids.map((i) => P[i]), { fill: PIECE[k % 6], fillAlpha: f.piece === k && f.phase === 2 ? 0.2 : 0.08, stroke: false }));
          s.poly(P, { color: 'accent', width: 3, fill: f.phase === 1 ? 'accent' : false, fillAlpha: 0.06 });
          if (f.phase === 1) {
            if (f.v != null) s.hline(f.y, { color: 'gold', width: 2.5 });
            (f.status || []).forEach(({ e, h }) => { const a = P[e], b = P[(e + 1) % n]; s.segment(a, b, { color: 'blue', width: 5, alpha: 0.85 }); if (h != null) s.segment([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], P[h], { color: 'orange', width: 2, dash: [5, 4] }); });
            (f.diags || []).forEach(([a, b]) => s.segment(P[a], P[b], { color: 'green', width: 3.5 }));
            if (f.v != null) s.dot(P[f.v][0], P[f.v][1], { r: 12, color: 'gold', hollow: true });
          } else {
            M.diags.forEach(([a, b]) => s.segment(P[a], P[b], { color: 'green', width: 2.5, alpha: 0.7 }));
            (f.doneTris || []).forEach((t) => s.poly(t.map((i) => P[i]), { color: 'green', width: 1.5, fill: false }));
            (f.diags || []).forEach(([a, b]) => s.segment(P[a], P[b], { color: 'gold', width: 3 }));
            (f.stack || []).forEach((i) => s.dot(P[i][0], P[i][1], { r: 11, color: 'accent', hollow: true }));
            if (f.j != null) s.dot(P[f.j][0], P[f.j][1], { r: 9, color: 'gold' });
            if (f.tris) f.tris.forEach((t) => s.poly(t.map((i) => P[i]), { color: 'green', width: 1.5, fill: false }));
            if (f.phase === 3) (f.doneTris || []).forEach((t) => s.poly(t.map((i) => P[i]), { color: 'green', fill: 'green', fillAlpha: 0.14, width: 1.5 }));
          }
          M.types.forEach((t, i) => { s.dot(P[i][0], P[i][1], { r: 10, color: TC[t], hollow: true }); s.text(String(i), P[i][0], P[i][1], { size: 11, color: 'muted', dx: 9, dy: -9 }); });
        });
        v.legend([['green', 'start'], ['red', 'end'], ['orange', 'split'], ['purple', 'merge'], ['muted', 'regular']]);
        v.readout(() => { if (bad || !M) return 'Not a simple polygon: no vertex classification exists.'; const cnt = (t) => M.types.filter((x) => x === t).length, sm = cnt('split') + cnt('merge');
          return `$n=${P.length}$: ${cnt('start')} start, ${cnt('end')} end, ${cnt('split')} split, ${cnt('merge')} merge, ${cnt('regular')} regular vertices. Diagonals added: ${M.diags.length}${M.diags.length <= sm ? ` (at most one per split/merge vertex: ${sm})` : ''}; pieces: ${pieces.length}.\nEach piece is $y$-monotone and the triangles total ${PT.reduce((a, t) => a + t.tris.length, 0)}, expected $n-2=${P.length - 2}$; a polygon with no split or merge vertex is monotone already.`; });
      },
    },
    // ================================================================== 3.8
    {
      num: '3.8', kind: 'Definition', name: 'Minkowski sums and configuration space',
      statement: String.raw`The **Minkowski sum** of two sets is $A\oplus B=\{a+b:a\in A,\ b\in B\}$. For a rigid robot $R$ with a chosen **reference point** (placed at the origin of its own frame) that translates in the plane among obstacles, the robot placed with its reference point at $p$ is $R+p$. It meets an obstacle $O$ exactly when $p\in O\oplus(-R)$, where $-R=\{-r:r\in R\}$ is the reflected robot. The **configuration space** is the set of placements $p$ of the reference point; its forbidden part (**C-obstacles**) is $\bigcup_O\,O\oplus(-R)$. So moving the robot among $O$ is the same as moving a *point* among the grown obstacles. If $A$ and $B$ are convex polygons with $n$ and $m$ vertices, $A\oplus B$ is a convex polygon with at most $n+m$ vertices, found in $O(n+m)$ time by merging the edge directions.`,
      idea: String.raw`$R+p$ meets $O$ iff some $r\in R$ and $o\in O$ satisfy $r+p=o$, i.e. $p=o-r\in O\oplus(-R)$ — the whole definition is this one line, and it holds for any shapes. For convex polygons the sum is the convex hull of all pairwise vertex sums (2.1), and its edges are the edges of $A$ and of $B$ sorted by direction, which gives the $n+m$ bound. A robot that also rotates adds a dimension: for each fixed angle the C-obstacles are another slice, and a rotating robot is a path in this three-dimensional space (not drawn).`,
      caption: String.raw`Left: the workspace. Drag the gold reference point $p$ of the robot (blue); the two grey walls leave a door (the dashed rectangle is the room: placements outside it are not considered) whose width you set with **door height**; choose the robot's shape, **size** and **rotation**. Right: the configuration space of the same situation: the robot has shrunk to the point $p$, and the walls have grown to the orange regions $O\oplus(-R)$. The robot overlaps a wall exactly when the point is inside its orange region (the readout tests 3000 random placements against the direct overlap test). The green cells are the placements reachable from the left side — the robot gets through the door iff that region reaches the right side.`,
      scope: String.raw`Translations only: for each rotation the picture is one slice of the full configuration space. Exact for convex obstacles; the green region is a grid computation (cell 0.08).`,
      deps: ['cg-2.1'], refs: ['de Berg §13.1', 'de Berg §13.3'], tags: ['configuration space', 'motion planning'],
      viz(v) {
        const W = gstage(v, { height: 360, minWidth: 300, title: 'workspace' });
        const C = gstage(v, { height: 360, minWidth: 300, title: 'configuration space (the robot is a point)' });
        const shape = v.select('robot', [{ value: 'tri', label: 'triangle' }, { value: 'bar', label: 'bar' }, { value: 'sq', label: 'square' }], 'tri');
        const size = v.slider('size', 0.5, 1.6, 1, { step: 0.02 });
        const rot = v.slider('rotation (°)', 0, 180, 25, { step: 1 });
        const door = v.slider('door height', 0.5, 3, 2.6, { step: 0.02 });
        const SH = { tri: [[-0.9, -0.6], [1.1, -0.2], [-0.1, 0.9]], bar: [[-1.2, -0.22], [1.2, -0.22], [1.2, 0.22], [-1.2, 0.22]], sq: [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]] };
        const p = W.handle(1.6, 1.4, { color: 'gold', r: 8, label: 'p', labelPos: 'ne', constrain: { x: [0, 10], y: [0, 7] } });
        let info = {};
        const rng = v.rng(11), SAMP = Array.from({ length: 3000 }, () => [rng.uniform(0, 10), rng.uniform(0, 7)]);
        v.render(() => {
          const th = (rot.value * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
          const R = SH[shape.value].map(([x, y]) => [size.value * (c * x - sn * y), size.value * (sn * x + c * y)]);
          const negR = R.map(([x, y]) => [-x, -y]);
          const d = door.value, O1 = [[3.6, -1], [6.4, -1], [5.9, 2.7], [4.2, 3.0]], O2 = [[3.7, 8], [6.3, 8], [5.8, 3.1 + d], [4.1, 2.8 + d]];
          const G1 = minkowski(O1, negR), G2 = minkowski(O2, negR);
          const at = (q) => R.map(([x, y]) => [x + q[0], y + q[1]]);
          // reachable placements from the left edge (grid flood fill in the configuration space)
          const h = 0.08, nx = Math.round(10 / h), ny = Math.round(7 / h), free = new Uint8Array(nx * ny);
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const q = [(i + 0.5) * h, (j + 0.5) * h]; free[i * ny + j] = pip(q, G1) || pip(q, G2) ? 0 : 1; }
          const seen = new Uint8Array(nx * ny), st = [];
          const si = Math.floor(p.x / h), sj = Math.floor(p.y / h);
          const startCells = []; for (let j = 0; j < ny; j++) if (free[j]) startCells.push(j);
          startCells.forEach((j) => { seen[j] = 1; st.push([0, j]); });
          while (st.length) { const [i, j] = st.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= nx || y >= ny) continue; const k = x * ny + y; if (!seen[k] && free[k]) { seen[k] = 1; st.push([x, y]); } } }
          let right = false; for (let j = 0; j < ny; j++) if (seen[(nx - 1) * ny + j]) right = true;
          // workspace
          W.rect(0, 0, 10, 7, { color: 'faint', width: 1, dash: true, fill: false }); C.rect(0, 0, 10, 7, { color: 'faint', width: 1, dash: true, fill: false });
          W.poly(O1, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 2 }); W.poly(O2, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 2 });
          W.poly(G1, { color: 'orange', width: 1.5, fill: false, dash: [6, 5], alpha: 0.7 }); W.poly(G2, { color: 'orange', width: 1.5, fill: false, dash: [6, 5], alpha: 0.7 });
          const hit = convexOverlap(at([p.x, p.y]), O1) || convexOverlap(at([p.x, p.y]), O2);
          W.poly(at([p.x, p.y]), { fill: hit ? 'red' : 'blue', fillAlpha: 0.35, color: hit ? 'red' : 'blue', width: 2.5 });
          // configuration space
          const ctx = C.ctx; ctx.fillStyle = v.color('green', 0.2);
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (seen[i * ny + j]) { const x0 = C.X(i * h), x1 = C.X((i + 1) * h), y0 = C.Y(j * h), y1 = C.Y((j + 1) * h); ctx.fillRect(x0, Math.min(y0, y1), x1 - x0 + 0.5, Math.abs(y1 - y0) + 0.5); }
          C.poly(O1, { color: 'muted', width: 1, fill: false, alpha: 0.5 }); C.poly(O2, { color: 'muted', width: 1, fill: false, alpha: 0.5 });
          C.poly(G1, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 2.5 }); C.poly(G2, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 2.5 });
          C.dot(p.x, p.y, { r: 7, color: hit ? 'red' : 'blue' });
          // honest check: direct overlap vs point in the grown obstacle
          let mis = 0;
          for (const q of SAMP) { const a = convexOverlap(at(q), O1) || convexOverlap(at(q), O2), b = pip(q, G1) || pip(q, G2); if (a !== b) mis++; }
          info = { hit, mis, right, nv: [O1.length + negR.length, G1.length], gv: G1.length, n1: O1.length, m: R.length };
        });
        v.legend([['orange', 'grown obstacle $O\\oplus(-R)$'], ['green', 'reachable from the left']]);
        v.readout(() => `Robot at $p$: **${info.hit ? 'collides' : 'free'}** by the direct overlap test, and the point $p$ is **${info.hit ? 'inside' : 'outside'}** a grown obstacle.\n3000 random placements: direct test and point-in-$O\\oplus(-R)$ disagree on **${info.mis}** of them. The lower wall has ${info.n1} vertices and the robot ${info.m}, and its grown copy has ${info.gv} $\\le ${info.n1 + info.m}$.\nThe robot ${info.right ? '**fits through the door**: free placements connect the left and right sides' : '**does not fit through the door**: the grown walls close it'}.`);
      },
    },
    // ================================================================== 3.9
    {
      num: '3.9', kind: 'Algorithm', name: 'Visibility graphs and shortest paths among obstacles',
      statement: String.raw`Let $s,t$ be points in the plane and $O_1,\dots,O_m$ disjoint polygonal obstacles with $n$ vertices in total. The **visibility graph** has as nodes $s$, $t$ and all obstacle vertices, and joins two nodes by an edge, weighted by their distance, when the open segment between them avoids the interiors of all obstacles. A shortest collision-free path from $s$ to $t$ (for a point robot, so the obstacles may be replaced by the grown obstacles of 3.8) is a polygonal path in this graph, so it bends only at obstacle vertices and is found by Dijkstra's algorithm. The graph has $O(n^2)$ edges and can be built in $O(n^2\log n)$ time by a rotational sweep around each vertex (or in $O(n^3)$ time by testing every pair against every edge).`,
      idea: String.raw`Pull a shortest path taut like a string: wherever it bends in free space, one can cut the corner and get a strictly shorter path, so every bend is at an obstacle vertex, where the string presses against the obstacle. The straight pieces between bends are free segments between vertices, i.e. visibility edges, so a shortest path is a shortest path in the visibility graph, which Dijkstra's algorithm (algo-9.8) computes. A robot of radius $r$ is handled by growing the obstacles by a disc (3.8), which reduces it to the point case.

The strict shortening step is the equality criterion in LADR 6.17: for two consecutive displacements $u,v$, the straight chord has length at most the sum of their lengths, with equality only when the displacements point along the same line in the same direction. At a genuine corner in free space, a small chord is collision-free and the inequality is strict; the same local argument removes a bend in the interior of a straight obstacle edge using its free-side half-plane. Obstacle vertices are the remaining places where the chord can be blocked. This is Euclidean polygonal geometry; a circular grown obstacle requires arcs, or the disclosed polygonal approximation.`,
      caption: String.raw`Drag the obstacles' handles and $s$, $t$; grey lines are the visibility edges. Step through Dijkstra's algorithm: gold is the node being settled, orange the edges being relaxed, blue the nodes already settled with their distances; at the end the shortest path is green. The **robot radius** slider grows every obstacle by a disc of that radius (a regular 12-gon around it), so the picture is exactly the point-robot case of 3.8. The readout compares the result with an independent check on a grid.`,
      scope: String.raw`Discs are approximated by circumscribed 12-gons. The grid check is a 16-neighbour search on a $0.125$ grid whose cells are blocked when their centre lies in an obstacle, so it only approximates the true length (differences of about one cell are expected) and may fail to pass narrow gaps.`,
      credit: 'T. Lozano-Pérez & M. A. Wesley, 1979 (visibility graph for motion planning among polyhedral obstacles)',
      deps: ['cg-3.8', 'algo-9.8', 'ladr-6.17'], refs: ['de Berg §15.1', 'de Berg §15.2'], tags: ['shortest path', 'motion planning'],
      viz(v) {
        const s = gstage(v, { height: 400, minWidth: 360 });
        const rad = v.slider('robot radius', 0, 0.8, 0, { step: 0.02, onChange: () => S && S.reset(undefined, { at: 'end' }) });
        const BASE = [
          [[-1.2, -0.9], [1.1, -1.1], [1.4, 0.7], [-0.3, 1.3], [-1.4, 0.3]],
          [[-1.3, -0.7], [1.0, -0.9], [1.4, 0.5], [-0.2, 1.1]],
          [[-1.0, -1.0], [1.2, -0.6], [0.9, 1.2], [-1.1, 0.8]],
        ];
        const C0 = [[2.9, 4.7], [5.3, 2.1], [7.6, 5.1]];
        const OH = C0.map((c, i) => s.handle(c[0], c[1], { color: 'muted', r: 7, label: 'O' + (i + 1), labelPos: 'n' }));
        const hs = s.handle(0.7, 0.9, { color: 'green', r: 8, label: 's', labelPos: 'ne' }), ht = s.handle(9.3, 6.2, { color: 'red', r: 8, label: 't', labelPos: 'nw' });
        const disc = Array.from({ length: 12 }, (_, i) => [Math.cos((2 * Math.PI * (i + 0.5)) / 12), Math.sin((2 * Math.PI * (i + 0.5)) / 12)]);
        let G = null, S;
        const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
        const blocked = (a, b, polys) => {
          for (const poly of polys) {
            const ts = [0, 1], L = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
            for (let i = 0; i < poly.length; i++) {
              const e0 = poly[i], e1 = poly[(i + 1) % poly.length], X = segCross(a, b, e0, e1, 1e-9);
              if (X) ts.push(X[2]);
              for (const Pt of [e0, e1]) { const t = ((Pt[0] - a[0]) * (b[0] - a[0]) + (Pt[1] - a[1]) * (b[1] - a[1])) / L; if (t > 1e-9 && t < 1 - 1e-9 && Math.abs(cross(a, b, Pt)) < 1e-9 * Math.sqrt(L)) ts.push(t); }
            }
            ts.sort((x, y) => x - y);
            for (let k = 0; k + 1 < ts.length; k++) {
              if (ts[k + 1] - ts[k] < 1e-9) continue;
              const m = (ts[k] + ts[k + 1]) / 2, q = [a[0] + m * (b[0] - a[0]), a[1] + m * (b[1] - a[1])];
              let onB = false; for (let i = 0; i < poly.length && !onB; i++) { const e0 = poly[i], e1 = poly[(i + 1) % poly.length], ex = e1[0] - e0[0], ey = e1[1] - e0[1], t = Math.max(0, Math.min(1, ((q[0] - e0[0]) * ex + (q[1] - e0[1]) * ey) / (ex * ex + ey * ey))); if (Math.hypot(e0[0] + t * ex - q[0], e0[1] + t * ey - q[1]) < 1e-7) onB = true; }
              if (!onB && pip(q, poly)) return true;
            }
          }
          return false;
        };
        const gridPath = (polys, s0, t0) => {
          const h = 0.125, nx = 80, ny = 56, blk = new Uint8Array(nx * ny);
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const q = [(i + 0.5) * h, (j + 0.5) * h]; if (polys.some((P) => pip(q, P))) blk[i * ny + j] = 1; }
          const cell = (p) => [Math.max(0, Math.min(nx - 1, Math.floor(p[0] / h))), Math.max(0, Math.min(ny - 1, Math.floor(p[1] / h)))];
          const [si, sj] = cell(s0), [ti, tj] = cell(t0), D = new Float64Array(nx * ny).fill(Infinity), done = new Uint8Array(nx * ny);
          const mv = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].map(([a, b]) => [a, b, Math.hypot(a, b) * h]);
          const heap = [[0, si, sj]]; D[si * ny + sj] = 0;
          const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
          const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
          while (heap.length) {
            const [d, i, j] = pop(); const k = i * ny + j; if (done[k]) continue; done[k] = 1; if (i === ti && j === tj) break;
            for (const [a, b, w] of mv) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= nx || y >= ny || blk[x * ny + y]) continue;
              if (Math.abs(a) === 2) { if (blk[(i + a / 2) * ny + j] || blk[(i + a / 2) * ny + j + b] || blk[(i + a) * ny + j]) continue; }
              else if (Math.abs(b) === 2) { if (blk[i * ny + j + b / 2] || blk[(i + a) * ny + j + b / 2] || blk[i * ny + j + b]) continue; }
              else if (a && b && (blk[(i + a) * ny + j] || blk[i * ny + j + b])) continue;
              const nd = d + w; if (nd < D[x * ny + y]) { D[x * ny + y] = nd; push([nd, x, y]); } }
          }
          const dd = D[ti * ny + tj]; return isFinite(dd) ? dd + 0 : null;
        };
        const build = () => {
          const polys = OH.map((hh, i) => { const base = BASE[i].map(([x, y]) => [x + hh.x, y + hh.y]); if (rad.value < 0.01) return base; const rp = rad.value / Math.cos(Math.PI / 12); return minkowski(base, disc.map(([x, y]) => [x * rp, y * rp])); });
          const nodes = [[hs.x, hs.y], [ht.x, ht.y]]; polys.forEach((P, k) => P.forEach((p, i) => nodes.push(p)));
          const adj = nodes.map(() => []), edges = [];
          for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
            if (!blocked(nodes[i], nodes[j], polys)) { const w = dist(nodes[i], nodes[j]); adj[i].push([j, w]); adj[j].push([i, w]); edges.push([i, j]); }
          }
          const inside = [0, 1].some((k) => polys.some((P) => pip(nodes[k], P)));
          const T = dijkstraTrace(nodes.length, adj, 0);
          const path = []; if (isFinite(T.dist[1])) for (let u = 1; u >= 0; u = T.prev[u]) { path.push(u); if (u === 0) break; }
          path.reverse();
          const grid = gridPath(polys, nodes[0], nodes[1]);
          G = { polys, nodes, edges, adj, T, path, inside, grid, nObs: nodes.length - 2 };
          return T.frames.map((f, i) => ({ ...f, line: f.kind === 'extract' ? 3 : f.kind === 'relax' ? 5 : f.kind === 'done' ? 7 : 1, vars: { settled: f.done.filter(Boolean).length }, note: f.kind === 'init' ? 'Start at $s$ with distance 0; every other node is at distance ∞.' : f.kind === 'extract' ? `Settle the nearest unsettled node (distance ${v2(f.dist[f.cur])}).` : f.kind === 'relax' ? `Relax the edge to node ${f.to === 1 ? 't' : f.to}: a shorter route (${v2(f.dist[f.to])}) is found through the settled node.` : isFinite(T.dist[1]) ? `Done: the shortest path has length ${v2(T.dist[1])}.` : 'Done: $t$ is not reachable.' }));
        };
        S = v.steps({ frames: build, code: ['build the visibility graph on s, t and the obstacle vertices', 'dist(s) ← 0, all other distances ← ∞', 'repeat: settle the unsettled node u of least distance', '  for each visible node w of u:', '    if dist(u) + |uw| < dist(w):  update dist(w), remember u', 'the path is read back from t through the stored predecessors'], codeTitle: 'Shortest path', speed: 2, start: 'end', still: 'end' });
        OH.concat([hs, ht]).forEach((h) => { h.onDrag = () => S.reset(undefined, { at: 'end' }); });
        v.render(() => {
          if (!G) return;
          const f = S.frame, N = G.nodes;
          G.polys.forEach((P) => s.poly(P, { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 2 }));
          G.edges.forEach(([i, j]) => s.segment(N[i], N[j], { color: 'faint', width: 1, alpha: 0.8 }));
          if (f.kind === 'relax') s.segment(N[f.cur], N[f.to], { color: 'orange', width: 3.5 });
          const atEnd = S.i === S.n - 1;
          if (atEnd && G.path.length > 1) s.path(G.path.map((i) => N[i]), { color: 'green', width: 5 });
          N.forEach((p, i) => { if (i < 2) return; const done = f.done && f.done[i], col = i === f.cur && f.kind === 'extract' ? 'gold' : done ? 'accent' : 'muted'; s.dot(p[0], p[1], { r: done ? 5.5 : 4, color: col }); if (done && N.length < 24) s.text(v2(f.dist[i]), p[0], p[1], { size: 10, color: 'accent', dx: 11, dy: -10 }); });
          [0, 1].forEach((i) => { s.dot(N[i][0], N[i][1], { r: 7, color: i ? 'red' : 'green' }); });
          if (G.inside) s.corner('s or t lies inside an obstacle', 'tl', { color: 'red', weight: 600 });
        });
        v.readout(() => { if (!G) return ''; const d = G.T.dist[1], N = G.nodes;
          if (!isFinite(d)) return `Visibility graph: ${G.nodes.length} nodes, ${G.edges.length} edges — **no path** from $s$ to $t$${G.inside ? ' (a terminal lies inside a grown obstacle)' : ''}.`;
          const bends = G.path.slice(1, -1).filter((i) => i >= 2), straight = Math.hypot(N[0][0] - N[1][0], N[0][1] - N[1][1]);
          return `Visibility graph: ${N.length} nodes, ${G.edges.length} edges (of $\\binom{${N.length}}{2}=${(N.length * (N.length - 1)) / 2}$ pairs). Shortest path $${v2(d)}$ vs straight line $${v2(straight)}$; it bends at ${bends.length} obstacle vertices and only there (${G.path.length - 2} intermediate nodes, all obstacle corners).\nIndependent grid search: ${G.grid == null ? 'no path found (gap narrower than the grid)' : `$${v2(G.grid)}$, ${Math.abs(G.grid - d) < 0.35 ? '**agrees** with the graph path' : '**differs** from the graph path'} (difference $${v2(G.grid - d)}$; about a cell is grid noise)`}.`; });
      },
    },
  ],
};
