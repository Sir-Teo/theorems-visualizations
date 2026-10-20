import {auditedDCEL, auditedEars, polygonStatus, diagonalWitness, validDiagonal} from './geometry-source-audit.shared.js';
// Computational Geometry & Graphics — Chapter 3: Segment intersection and polygons (§§3.1–3.5; §§3.6–3.9 in ch03-b.js)
import { segInside, cross, hull2, sweepRun, bruteCross, segCross, buildDCEL, voronoiCells, clipConvex, pip, area2, ccwPoly, isSimplePoly, earTrace, convexOverlap } from './ch03.shared.js';

const v2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const SC = ['blue', 'orange', 'teal', 'purple', 'pink', 'muted'];
const NM = 'abcdefghijklmnopqrstuvwxyz'.split('');
const nm = (i) => (i < 26 ? NM[i] : NM[(i / 26 - 1) | 0] + NM[i % 26]);
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 7], equal: true, axes: false, height: 340, ...o });
/** Random segments in the box [0,10]×[0,7]: length about L, never vertical. */
function randSegs(r, n, L) {
  const S = [], cl = (x, a, b) => Math.max(a, Math.min(b, x));
  while (S.length < n) {
    const x = r.uniform(0.3, 9.7), y = r.uniform(0.3, 6.7), th = r.uniform(-1.3, 1.3), l = L * r.uniform(0.5, 1);
    const x2 = cl(x + l * Math.cos(th), 0.2, 9.8), y2 = cl(y + l * Math.sin(th), 0.2, 6.8);
    if (Math.abs(x2 - x) > 0.15) S.push([x, y, x2, y2]);
  }
  return S;
}
/** Status-structure picture on a stage with unit coordinates: boxes from the top of the sweep line down. */
function drawStatus(R, f, colorOf, label) {
  const st = (f.status || []).slice().reverse(), W = 0.5, hh = Math.min(0.1, 0.8 / Math.max(st.length, 1));
  R.text('status  (top ↑)', 0.5, 0.97, { size: 12, color: 'muted' });
  st.forEach((id, k) => {
    const y1 = 0.92 - k * (hh + 0.012), y0 = y1 - hh;
    R.rect(0.5 - W / 2, y0, 0.5 + W / 2, y1, { fill: colorOf(id), fillAlpha: 0.2, color: colorOf(id), width: f.hl && f.hl.includes(id) ? 3 : 1.5, radius: 5 });
    R.text(label(id), 0.5, (y0 + y1) / 2, { size: 13, color: 'ink', baseline: 'middle' });
  });
  if (!st.length) R.text('(empty)', 0.5, 0.6, { size: 13, color: 'faint' });
}

export default {
  collection: 'cg',
  chapter: 3,
  title: 'Segment intersection and polygons',
  summary: String.raw`Sweeping a line across the plane turns two-dimensional problems into a sequence of one-dimensional updates; it reports all crossings of $n$ segments in time sensitive to their number and overlays maps stored in doubly connected edge lists. Every simple polygon can be cut into triangles, which underlies the art gallery theorem: $\lfloor n/3\rfloor$ guards always suffice. Minkowski sums turn robot motion planning into point navigation among grown obstacles, where shortest paths run along a visibility graph.`,
  items: [
    // ================================================================== 3.1
    {
      num: '3.1', kind: 'Method', name: 'The plane sweep paradigm',
      statement: String.raw`A **plane sweep** moves a vertical line $\ell$ across the plane from left to right and maintains two structures. The **event queue** holds the $x$-positions at which something can change (for segments: their endpoints, processed in order of $x$, ties by $y$). The **status** is the set of objects currently met by $\ell$, kept in a balanced search tree ordered by their $y$-coordinate on $\ell$. Between two consecutive events the combinatorial picture does not change, so the work happens only at events: each one inserts, deletes or reorders $O(1)$ objects at a cost of $O(\log n)$. The method is correct as long as every change of the order along $\ell$ is itself an event.`,
      idea: String.raw`Two segments that do not cross keep the same above/below relation for as long as both are met by $\ell$, so the order of the status can only change when a segment enters (left endpoint), leaves (right endpoint), or two segments swap — which requires them to cross. A search tree makes each of these updates $O(\log n)$, and a segment can only meet a new neighbour at an event; this is why the sweep needs to look at *adjacent* segments only. The sweep trades a two-dimensional problem for a sorted sequence of one-dimensional updates — the same idea as sorting by angle in 2.6, with the orientation test of 1.2 deciding which segment lies above which.

Between endpoints of two nonvertical segments, each height on the sweep line is an affine continuous function of its horizontal coordinate. If their relative order changed, the difference of those heights would change sign; PMA 4.23 would force a zero in between, hence an intersection event. This proves the claimed invariance of status order on an event-free interval. Endpoint insertions/deletions and coincident or vertical events still need the stated event conventions, rather than following from continuity alone.`,
      caption: String.raw`Step through the events of six segments (use the scrubber to jump). The gold line is the sweep line; the right column is the status, top of $\ell$ upwards, and the queue lists the next events (L = left endpoint, R = right endpoint). Orange dashes mark neighbours that get tested at each event. **Disjoint** segments never change order. Pick **crossing** (or drag endpoints until two segments cross): the sweep only visits endpoints, so the status order silently goes wrong and the picture says so — crossings must be events too, which is exactly what 3.2 adds.`,
      deps: ['cg-1.3', 'pma-4.23'], refs: ['de Berg §2.1'], tags: ['sweep', 'paradigm'],
      viz(v) {
        const P0 = { disjoint: [[0.5, 1.0, 3.5, 1.8], [1.2, 3.0, 4.6, 2.5], [2.2, 5.6, 5.8, 6.2], [4.0, 4.4, 7.2, 3.4], [6.0, 1.0, 9.3, 1.8], [6.5, 5.2, 9.5, 6.1]],
          crossing: [[0.5, 1.0, 5.5, 3.2], [1.2, 3.6, 4.6, 0.8], [2.2, 5.6, 8.0, 2.4], [4.0, 4.6, 7.2, 1.0], [6.0, 1.0, 9.3, 3.8], [6.5, 5.2, 9.5, 6.1]] };
        const s = gstage(v, { height: 360, minWidth: 340 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 220, weight: 0.5 });
        const pre = v.select('segments', [{ value: 'disjoint', label: 'disjoint' }, { value: 'crossing', label: 'crossing' }], 'disjoint', { onChange: () => { P0[pre.value].forEach((q, i) => { H[2 * i].set(q[0], q[1]); H[2 * i + 1].set(q[2], q[3]); }); S.reset(); } });
        const H = [];
        P0.disjoint.forEach((q, i) => {
          const col = SC[i];
          H.push(s.handle(q[0], q[1], { color: col, r: 5, label: nm(i), labelPos: 'nw' }));
          H.push(s.handle(q[2], q[3], { color: col, r: 5 }));
        });
        const segs = () => H.length ? P0.disjoint.map((_, i) => [H[2 * i].x, H[2 * i].y, H[2 * i + 1].x, H[2 * i + 1].y]) : P0.disjoint;
        let run, S;
        const build = () => { run = sweepRun(segs(), { cross: false }); return run.frames.map((f, i) => {
          const nxt = f.queue.slice(0, 6).map((e) => (e.type === 'L' ? 'L' : 'R') + nm(e.seg)).join('  ');
          const note = f.kind === 'start' ? 'The sweep line starts left of everything. The queue holds all ' + H.length + ' endpoints in sorted order; the status is empty.'
            : f.kind === 'insert' ? `Left endpoint of **${nm(f.seg)}**: search the status for its place along the line and insert it; its new neighbours are the only pairs that can interact next.`
            : f.kind === 'delete' ? `Right endpoint of **${nm(f.seg)}**: remove it from the status; the two segments it separated become neighbours.`
            : 'All events processed: the status is empty again.';
          return { ...f, hl: f.seg != null ? [f.seg] : [], note: note + (f.stale ? ' **The stored order is no longer the order along the sweep line**: two segments crossed between events and nothing told the sweep.' : ''), vars: { events: i, queue: f.queue.length, status: f.status.length }, nxt };
        }); };
        S = v.steps({ frames: build, code: ['Q ← all endpoints sorted by x', 'T ← empty status', 'while Q is not empty', '  p ← next event in Q', '  if p is a left endpoint: insert its segment in T', '  if p is a right endpoint: delete its segment from T', '  test the new neighbours in T'], codeTitle: 'Plane sweep', speed: 1.2, still: 5 });
        H.forEach((h) => { h.onDrag = () => S.reset(undefined, { at: 'keep' }); });
        v.render(() => {
          const f = S.frame, all = segs(), act = new Set(f.status || []);
          if (f.x != null && isFinite(f.x)) s.vline(f.x, { color: 'gold', width: 2.5 });
          all.forEach((q, i) => {
            const col = SC[i], isAct = act.has(i);
            s.segment([q[0], q[1]], [q[2], q[3]], { color: col, width: isAct ? 3.5 : 2, alpha: isAct || !f.status ? 1 : 0.5 });
            const a = q[0] < q[2] ? 0 : 2, b = 2 - a;
            const done = f.x != null && q[b] < f.x - 1e-9, started = f.x != null && q[a] <= f.x + 1e-9;
            s.dot(q[a], q[a + 1], { r: 4.5, color: col, hollow: !started });
            s.dot(q[b], q[b + 1], { r: 4.5, color: col, hollow: !done, alpha: 0.9 });
          });
          // positions on the sweep line
          const ys = (i) => { const q = all[i], dx = q[2] - q[0]; return q[1] + ((q[3] - q[1]) * (f.x - q[0])) / dx; };
          const lx = (i) => (all[i][0] < all[i][2] ? all[i] : [all[i][2], all[i][3], all[i][0], all[i][1]]);
          const pos = (i) => { const q = lx(i); return q[1] + ((q[3] - q[1]) * (f.x - q[0])) / (q[2] - q[0]); };
          (f.tested || []).forEach(([i, j]) => s.segment([f.x, pos(i)], [f.x, pos(j)], { color: 'orange', width: 3, dash: [5, 4] }));
          (f.status || []).forEach((i) => s.dot(f.x, pos(i), { r: 5, color: 'gold' }));
          if (f.kind === 'insert' || f.kind === 'delete') s.dot(f.x, f.y, { r: 10, color: 'gold', hollow: true });
          s.corner(f.stale ? 'status order is stale' : 'status order = order on the sweep line', 'tl', { color: f.stale ? 'red' : 'green', weight: 600 });
          // right column
          drawStatus(R, f, (id) => SC[id], (id) => nm(id));
          R.text('queue:  ' + ((f.queue && f.queue.length) ? f.queue.slice(0, 4).map((e) => (e.type === 'L' ? 'L' : 'R') + nm(e.seg)).join('  ') + (f.queue.length > 4 ? ' …' : '') : '—'), 0.5, 0.05, { size: 12, color: 'muted' });
        });
        v.readout(() => `event ${S.i} of ${S.n - 1}: sweep at $x=${v2(S.frame.x ?? 0)}$; ${S.frame.status ? S.frame.status.length : 0} segment${(S.frame.status || []).length === 1 ? '' : 's'} in the status, ${S.frame.queue ? S.frame.queue.length : 0} events waiting; status comparisons so far $${S.frame.cmp ?? 0}$.\n` + (run && run.frames.some((f) => f.stale) ? 'Order check: **stale after some event** — these segments cross.' : 'Order check: the stored status agrees with the true order along the line after every event — no crossing.'));
      },
    },
    // ================================================================== 3.2
    {
      num: '3.2', kind: 'Algorithm', name: 'Bentley–Ottmann segment intersection',
      statement: String.raw`Given $n$ line segments in the plane, the **Bentley–Ottmann sweep** reports all $k$ points where two of them cross. It sweeps a vertical line over the plane, keeping the segments met by the line in a balanced tree ordered by height. The event queue starts with all $2n$ endpoints. Whenever two segments become **adjacent** in the status (after an insertion, a deletion or a swap) they are tested, and a crossing lying to the right of the sweep line is inserted into the queue as a new event; at such an event the two segments swap places. Assuming general position (no vertical segments, no three segments through a point, no coinciding event positions), it reports exactly the $k$ crossings in $O((n+k)\log n)$ time and $O(n+k)$ space for the queue (only $O(n)$ if the queue keeps just the next crossing of each adjacent pair).`,
      idea: String.raw`Two segments about to cross are adjacent in the status just before their crossing (anything between them would itself have to cross one of them first — a crossing even earlier, by induction on the sweep order), and they became adjacent at some earlier event, where the algorithm tested them. So every crossing is found; the swap at a crossing event keeps the status equal to the true order. There are $2n+k$ events, each costing $O(\log n)$ on the tree and $O(1)$ neighbour tests, giving $O((n+k)\log n)$ — against the $\binom n2$ tests of brute force. The sweep paradigm of 3.1 supplies the structure; the segment test of 1.3 is the only geometry.`,
      caption: String.raw`Left: step the sweep through random segments (**segments** slider, **length** controls how many cross). Green dots are crossings already reported, the orange dashes the neighbour pairs just tested; use the scrubber to jump to any event. Right: the work done (status comparisons + neighbour tests + events) of 68 random inputs and of your instance (gold), against $(n+k)\log_2 n$ on log–log axes — they stay on one line (the dashed line is the largest ratio seen). The readout checks the sweep's $k$ against brute force.`,
      credit: 'J. L. Bentley & T. A. Ottmann, 1979 (building on Shamos & Hoey, 1976)',
      deps: ['cg-3.1'], refs: ['de Berg §2.1'], tags: ['sweep', 'intersection'],
      viz(v) {
        let seed = 4;
        const s = gstage(v, { height: 360, minWidth: 340 });
        const nsl = v.slider('segments $n$', 3, 30, 8, { int: true, onChange: () => regen() });
        const lsl = v.slider('length', 1, 8, 4, { step: 0.1, onChange: () => regen() });
        let segs = [], S, k0 = 0;
        const regen = () => { segs = randSegs(v.rng(seed * 100 + nsl.value), nsl.value, lsl.value); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        segs = randSegs(v.rng(seed * 100 + 8), 8, 4);
        let cur;
        const build = () => { cur = sweepRun(segs); k0 = bruteCross(segs).length; return cur.frames.map((f, i) => ({ ...f, line: f.kind === 'insert' ? 5 : f.kind === 'delete' ? 6 : f.kind === 'cross' ? 7 : 3,
          note: f.kind === 'start' ? `The queue holds the ${2 * segs.length} endpoints. Whenever two segments become neighbours in the status they are tested; a crossing to the right of the line becomes a new event.`
            : f.kind === 'insert' ? `Left endpoint of **${nm(f.seg)}** inserted; its new neighbours are tested${f.tested.length ? ' (orange)' : ''}.`
            : f.kind === 'delete' ? `Right endpoint of **${nm(f.seg)}** leaves; the two segments it separated become neighbours and are tested.`
            : f.kind === 'cross' ? `**Crossing of ${nm(f.pair[0])} and ${nm(f.pair[1])}** reported; they swap places in the status and their new outer neighbours are tested.`
            : `Queue empty: ${f.found.length} crossings reported.`,
          vars: { events: i, found: f.found.length, tests: f.tests } })); };
        S = v.steps({ frames: build, code: ['Q ← endpoints of all segments;  T ← ∅', 'while Q ≠ ∅', '  p ← next event', '  left endpoint of s:   insert s in T;  test s with its two neighbours', '  right endpoint of s:  delete s;  test its former neighbours', '  crossing of s, t:  report;  swap s, t in T', '                     test the new neighbours;', '  (a crossing to the right of p becomes a new event)'], codeTitle: 'Bentley–Ottmann', speed: 1.5, still: 12 });
        // cost cloud
        const C = v.stage({ x: [10, 1e5], y: [10, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: '(n + k) log₂ n', ylabel: 'work', title: 'work done vs (n+k)·log n', height: 360, minWidth: 260 });
        const cloud = [];
        [[10, 2], [10, 5], [20, 1.5], [20, 4], [20, 8], [40, 1.2], [40, 3], [40, 6], [60, 2], [60, 5], [80, 1.5], [80, 3.5], [100, 1], [100, 2.5], [100, 5], [120, 2], [120, 4]].forEach(([n, L], i) => {
          for (let rep = 0; rep < 4; rep++) {
            const sg = randSegs(v.rng(900 + i * 7 + rep), n, L), R = sweepRun(sg, { frames: false }), kk = R.found.length;
            cloud.push({ n, k: kk, x: (n + kk) * Math.log2(n), y: R.cmp + R.tests + R.events });
          }
        });
        const ratios = cloud.map((c) => c.y / c.x), rlo = Math.min(...ratios), rhi = Math.max(...ratios);
        v.render(() => {
          const f = S.frame, found = f.found || [];
          if (f.x != null && isFinite(f.x)) s.vline(f.x, { color: 'gold', width: 2.5 });
          const act = new Set(f.status || []);
          segs.forEach((q, i) => {
            const col = SC[i % 6], a = act.has(i);
            s.segment([q[0], q[1]], [q[2], q[3]], { color: col, width: a ? 3.5 : 2, alpha: a || !f.status ? 1 : 0.55 });
            if (segs.length <= 14) s.text(nm(i), Math.min(q[0], q[2]), q[0] < q[2] ? q[1] : q[3], { size: 11, color: col, dx: -8, dy: -8 });
          });
          const lx = (i) => (segs[i][0] < segs[i][2] ? segs[i] : [segs[i][2], segs[i][3], segs[i][0], segs[i][1]]);
          const pos = (i) => { const q = lx(i); return q[1] + ((q[3] - q[1]) * (f.x - q[0])) / (q[2] - q[0]); };
          (f.tested || []).forEach(([i, j]) => s.segment([f.x, pos(i)], [f.x, pos(j)], { color: 'orange', width: 3, dash: [5, 4] }));
          (f.status || []).forEach((i) => s.dot(f.x, pos(i), { r: 4, color: 'gold' }));
          found.forEach((c) => s.dot(c.x, c.y, { r: 5.5, color: 'green' }));
          (f.queue || []).filter((e) => e.type === 'X').forEach((e) => s.dot(e.x, e.y, { r: 6, color: 'green', hollow: true }));
          if (f.kind === 'cross') s.dot(f.x, f.y, { r: 11, color: 'gold', hollow: true });
          s.corner(`k = ${k0} crossings`, 'tl');
          // cloud
          C.path([[10, 10 * rhi], [1e5, 1e5 * rhi]], { color: 'faint', dash: true, width: 1 });
          cloud.forEach((c) => C.dot(c.x, c.y, { r: 3.5, color: 'blue', alpha: 0.7 }));
          const n = segs.length, W = cur.cmp + cur.tests + cur.events;
          C.dot(Math.max(10, (n + cur.found.length) * Math.log2(Math.max(n, 2))), Math.max(10, W), { r: 8, color: 'gold' });
        });
        v.legend([['blue', 'random inputs'], ['gold', 'your instance']]);
        v.readout(() => { const n = segs.length, f = S.frame, ok = cur.found.length === k0; return `$n=${n}$ segments, $k=${cur.found.length}$ crossings found by the sweep; brute force over all $\\binom n2=${(n * (n - 1)) / 2}$ pairs finds $${k0}$ — ${ok ? '**they agree**' : '**mismatch (degenerate input)**'}.\nThe sweep tested only $${cur.tests}$ neighbour pairs in total ($${f.tests ?? 0}$ so far), with $${cur.cmp}$ status comparisons; work$/((n+k)\\log_2 n)$ was between $${v2(rlo)}$ and $${v2(rhi)}$ over the 68 sample inputs.`; });
      },
    },
    // ================================================================== 3.3
    {
      num: '3.3', kind: 'Definition', name: 'Doubly connected edge lists',
      statement: String.raw`A **doubly connected edge list** (DCEL) stores a planar subdivision with one record per **half-edge**. Every undirected edge is split into two directed half-edges, one for each of its sides; a half-edge $h$ stores its **origin** vertex, its **twin** $\operatorname{twin}(h)$ (the opposite half-edge of the same edge), the face $f(h)$ to its left, and the pointers $\operatorname{next}(h)$ and $\operatorname{prev}(h)$ to the following and preceding half-edges on the boundary of $f(h)$. Each nonisolated vertex stores one outgoing half-edge; a face stores an outer-boundary pointer and a list of inner-boundary pointers, with a null outer pointer for the unbounded face. Isolated vertices need separate records. The pointers satisfy $\operatorname{twin}(\operatorname{twin}(h))=h$, $\operatorname{prev}(\operatorname{next}(h))=h$ and $\operatorname{dest}(h)=\operatorname{origin}(\operatorname{next}(h))$. Each cycle of $\operatorname{next}$ is a boundary walk; a face with holes or a disconnected subdivision can require several boundary cycles. For a connected graph with at least one edge, each face has one boundary walk, which may repeat bridge edges. A connected plane graph with $V$ vertices, $E$ edges and $F$ faces (counting the unbounded one) has $2E$ half-edges and $V-E+F=2$.`,
      idea: String.raw`Orienting each edge both ways gives every face a consistent boundary orientation (counter-clockwise around bounded faces, clockwise around the unbounded one), so "walk around the face" becomes pointer-chasing. To build the $\operatorname{next}$ pointer, sort the outgoing half-edges at each vertex by angle (the orientation test of 1.2 compares directions): after arriving along $h$ at $v$, the face on the left continues along the first outgoing half-edge clockwise from $\operatorname{twin}(h)$. For the connected graphs shown here, each face is one orbit of this permutation, so total boundary length is $2E$, and the structure supports reading all edges around a vertex or face in time proportional to their number — what the map overlay of 3.4 needs.

The identities for next and prev make next a bijection of the finite set of half-edges. Apply the cycle-decomposition argument of COMB 2.1: following next from any half-edge returns to it, distinct orbits are disjoint, and the orbits partition all $2E$ half-edges. These cycles are boundary walks, with total length $2E$. Identifying one walk with each face uses the connected plane-graph setting specified here; a general face may have several boundary components.`,
      caption: String.raw`**Click a half-edge** (each edge is drawn twice, the two arrows offset to the left of their direction). Gold is the one you picked, orange its twin, green its next, purple its prev, and the blue shading is the face to its left. Press **next** to walk the boundary one half-edge at a time. **faces** colours every boundary cycle. Switch on the **pendant edge**: the vertex of degree one makes a face visit the same edge twice (once on each side). Drag vertices: if two edges cross, it is no longer a plane graph and the DCEL is rejected.`,
      scope: String.raw`Conventions differ between texts (which side the face is on, which pointers are stored); this follows the convention of de Berg et al.: the face lies to the left of its half-edges. The interactive construction is restricted to connected straight-line plane graphs without coincident vertices or edges passing through another vertex. General DCELs also store multiple boundary components and isolated vertices.`,
      deps: ['comb-2.1'], refs: ['de Berg et al., 3rd ed., §2.2, pp.29–33'], tags: ['data structure', 'subdivision'],
      viz(v) {
        const s = gstage(v, { height: 430, minWidth: 360 });
        const V0 = [[1, 1], [5, 0.8], [9, 1.2], [9.2, 5.8], [5, 6.2], [0.8, 5.6], [3.5, 3.2], [6.5, 3.6], [8.0, 2.3]];
        const E0 = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 7], [7, 4], [7, 3], [6, 7], [6, 0], [6, 5]];
        const mode = v.select('view', [{ value: 'ptr', label: 'pointers' }, { value: 'faces', label: 'face cycles' }], 'ptr');
        const pend = v.toggle('pendant edge', false);
        const H = V0.map((p, i) => s.handle(p[0], p[1], { color: 'ink', r: 6, label: 'v' + i, labelPos: 'n' }));
        let sel = 6, info = {};
        s.onClick((x, y) => { if (!info.geo) return; let pick=-1, best=.25; info.geo.forEach((g,i)=>{const dx=g.q[0]-g.p[0],dy=g.q[1]-g.p[1],t=Math.max(0,Math.min(1,((x-g.p[0])*dx+(y-g.p[1])*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(x-g.p[0]-t*dx,y-g.p[1]-t*dy);if(d<best){best=d;pick=i;}});if(pick>=0)sel=pick; });
        v.button('next ▸', () => { if (info.D) sel = info.D.H[sel].next; });
        v.button('twin ⇄', () => { if (info.D) sel = sel ^ 1; });
        const FC = ['blue', 'orange', 'teal', 'purple', 'pink', 'green'];
        v.render(() => {
          const nv = pend.value ? 9 : 8; H[8].visible = pend.value;
          const V = H.slice(0, nv).map((h) => [h.x, h.y]), E = E0.concat(pend.value ? [[7, 8]] : []);
          const checked=auditedDCEL(V,E);
          if(checked.bad){E.forEach(([a,b])=>s.segment(V[a],V[b],{color:'red',width:2.5}));info={bad:checked.bad};s.corner(checked.bad+': invalid plane embedding','tl',{color:'red',weight:600});return;}
          const D=checked.D;if(sel>=D.H.length)sel=0;
          const geo = D.H.map((h) => { const a = V[h.origin], b = V[h.dest], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 0.16, ny = dx / L * 0.16, c = Math.min(0.3, L * 0.22);
            return { p: [a[0] + nx + (dx / L) * c, a[1] + ny + (dy / L) * c], q: [b[0] + nx - (dx / L) * c, b[1] + ny - (dy / L) * c] }; });
          const hs = D.H[sel], fc = D.faces[hs.face];
          if (mode.value === 'faces') {
            D.faces.forEach((f, k) => { if (!f.outer) s.poly(f.verts.map((i) => V[i]), { fill: FC[k % 6], fillAlpha: 0.14, stroke: false }); });
          } else if (!fc.outer) s.poly(fc.verts.map((i) => V[i]), { fill: 'accent', fillAlpha: 0.16, stroke: false });
          E.forEach(([a, b]) => s.segment(V[a], V[b], { color: 'faint', width: 1.5 }));
          D.H.forEach((h, i) => {
            let col = 'muted', w = 1.5, al = 0.55;
            if (mode.value === 'faces') { col = D.faces[h.face].outer ? 'red' : FC[h.face % 6]; w = 2.2; al = 0.95; }
            else if (D.faces[h.face] === fc) { col = 'accent'; w = 2.2; al = 0.9; }
            if (mode.value === 'ptr') { if (i === hs.next) { col = 'green'; w = 3.5; al = 1; } if (i === hs.prev) { col = 'purple'; w = 3.5; al = 1; } if (i === hs.twin) { col = 'orange'; w = 3.5; al = 1; } }
            if (i === sel) { col = 'gold'; w = 4.5; al = 1; }
            s.arrow(geo[i].p[0], geo[i].p[1], geo[i].q[0], geo[i].q[1], { color: col, width: w, alpha: al, head: 8 });
          });
          const lab = (i, c) => { const g = geo[i], mx = (g.p[0] + g.q[0]) / 2, my = (g.p[1] + g.q[1]) / 2; s.text('h' + i, mx, my, { size: 11, color: c, dy: -9 }); };
          if (mode.value === 'ptr') { lab(sel, 'ink'); lab(hs.twin, 'orange'); lab(hs.next, 'green'); if (hs.prev !== hs.next) lab(hs.prev, 'purple'); }
          if (mode.value === 'faces') D.faces.forEach((f, k) => { if (f.outer) return; const c = f.verts.map((i) => V[i]).reduce((a, p) => [a[0] + p[0] / f.verts.length, a[1] + p[1] / f.verts.length], [0, 0]); s.text('f' + k, c[0], c[1], { size: 14, color: 'ink' }); });
          s.corner(fc.outer ? 'face to the left: f' + hs.face + ' (unbounded)' : 'face to the left: f' + hs.face, 'bl', { color: 'accent', weight: 600 });
          const ok = D.H.every((h, i) => D.H[h.twin].twin === i && D.H[h.next].prev === i && D.H[h.next].origin === h.dest);
          info = { D, V, E, geo, ok, sel, hs, fc, nf: D.faces.length };
        });
        v.readout(() => { if (info.bad) return `Invalid plane embedding: **${info.bad}**. This drawing needs a vertex split, edge subdivision or separated vertices before the DCEL construction applies.`; const { D, V, E, hs, fc } = info; const len = fc.edges.length;
          return `half-edge $h_{${sel}}$: origin $v_${hs.origin}$ → $v_${hs.dest}$;  twin $h_{${hs.twin}}$,  next $h_{${hs.next}}$,  prev $h_{${hs.prev}}$,  face $f_${hs.face}$ (${fc.outer ? 'unbounded' : 'bounded'}, boundary of ${len} half-edges: ${fc.edges.map((e) => 'h' + e).join(' → ')} → back).\n$V=${V.length}$, $E=${E.length}$, $F=${info.nf}$: $V-E+F=${V.length - E.length + info.nf}$, $2E=${2 * E.length}=\\sum_f(\\text{boundary length})=${D.faces.reduce((a, f) => a + f.edges.length, 0)}$; pointer identities hold for all ${D.H.length} half-edges: ${info.ok ? '**yes**' : 'no'}.`; });
      },
    },
    // ================================================================== 3.4
    {
      num: '3.4', kind: 'Algorithm', name: 'Map overlay',
      statement: String.raw`Given two planar subdivisions $S_1$ (with $n_1$ edges) and $S_2$ ($n_2$ edges), each stored as a DCEL, their **overlay** is the subdivision whose vertices are the vertices of both maps and all crossing points of an edge of $S_1$ with an edge of $S_2$, whose edges are the pieces of edges between them, and whose faces are the maximal connected pieces $f_1\cap f_2$, each labelled with the pair of faces it came from. One sweep with Bentley–Ottmann (3.2) over the edges of both maps finds the crossings $k$ and, with the DCELs, builds the overlay DCEL in $O((n+k)\log n)$ time, $n=n_1+n_2$. Boolean combinations of the layers — union, intersection, difference — then select faces by their labels.`,
      idea: String.raw`The sweep finds every crossing between the two edge sets (3.2), and, while it runs, the DCEL records of the two maps are copied and re-linked at each event: at a crossing, the four half-edges around it are re-wired locally, so next/prev pointers stay consistent (3.3). Faces of the overlay are the cycles of the new pointers, and each face's pair of labels is read off from the half-edge it was found with: the face of $S_1$ and the face of $S_2$ immediately to its left. The $k$ crossings are the reason for the $+k$ in the running time, and the size of the output.`,
      caption: String.raw`Two maps — **A** (blue, four sites) and **B** (orange, four sites) — are the Voronoi cells of draggable sites inside the same rectangle. Green dots are the crossings of A-edges with B-edges. **overlay** colours every face $f_i\cap g_j$ and labels it $(i,j)$; **Boolean** keeps the faces satisfying the chosen operation on the layers "cells flagged in A" and "cells flagged in B" (click the map to flag or unflag the cell under the cursor in the layer chosen by *click edits*). Areas of all faces must add up to the rectangle; the readout checks it.`,
      scope: String.raw`Illustrative model: the two maps are Voronoi diagrams of a few sites, so every overlay face is a convex polygon and can be computed exactly by clipping $f_i\cap g_j$; the general algorithm instead sweeps the two DCELs as above.`,
      deps: ['cg-3.2', 'cg-3.3'], refs: ['de Berg §2.3', 'de Berg §2.4'], tags: ['overlay', 'subdivision'],
      viz(v) {
        const s = gstage(v, { height: 440, minWidth: 360 });
        const BOX = [0, 0, 10, 7];
        const view = v.select('view', [{ value: 'ov', label: 'overlay' }, { value: 'bool', label: 'Boolean' }], 'ov');
        const op = v.select('operation', [{ value: 'or', label: 'A ∪ B' }, { value: 'and', label: 'A ∩ B' }, { value: 'diff', label: 'A ∖ B' }, { value: 'xor', label: 'A △ B' }], 'and');
        const edit = v.select('click edits', [{ value: 'A', label: 'layer A' }, { value: 'B', label: 'layer B' }], 'A');
        const A0 = [[2, 5.2], [3.6, 1.6], [7.2, 4.6], [8.2, 1.4]], B0 = [[1.6, 2.2], [5.0, 5.8], [5.6, 2.6], [9.0, 5.8]];
        const HA = A0.map((p, i) => s.handle(p[0], p[1], { color: 'blue', r: 7, label: 'A' + (i + 1), labelPos: 'nw' }));
        const HB = B0.map((p, i) => s.handle(p[0], p[1], { color: 'orange', r: 7, label: 'B' + (i + 1), labelPos: 'ne' }));
        const flagA = new Set([0, 2]), flagB = new Set([1]);
        const PAL = ['blue', 'orange', 'teal', 'purple', 'pink', 'green'];
        let info = {};
        const cellOf = (cells, x, y) => cells.findIndex((c) => pip([x, y], c));
        s.onClick((x, y) => { if (!info.CA) return; if (edit.value === 'A') { const i = cellOf(info.CA, x, y); if (i >= 0) flagA.has(i) ? flagA.delete(i) : flagA.add(i); } else { const j = cellOf(info.CB, x, y); if (j >= 0) flagB.has(j) ? flagB.delete(j) : flagB.add(j); } v.invalidate(); });
        const test = (a, b) => (op.value === 'or' ? a || b : op.value === 'and' ? a && b : op.value === 'diff' ? a && !b : a !== b);
        v.render(() => {
          const SA = HA.map((h) => [h.x, h.y]), SB = HB.map((h) => [h.x, h.y]);
          const CA = voronoiCells(SA, BOX), CB = voronoiCells(SB, BOX);
          const faces = [];
          CA.forEach((a, i) => CB.forEach((b, j) => { const f = clipConvex(a, b); if (f.length >= 3 && area2(f) / 2 > 1e-6) faces.push({ i, j, poly: f, area: area2(f) / 2 }); }));
          faces.forEach((f) => {
            const keep = test(flagA.has(f.i), flagB.has(f.j));
            if (view.value === 'ov') s.poly(f.poly, { fill: PAL[(f.i * 2 + f.j) % 6], fillAlpha: 0.22, stroke: false });
            else s.poly(f.poly, { fill: keep ? 'green' : 'faint', fillAlpha: keep ? 0.42 : 0.07, stroke: false });
            f.keep = keep;
          });
          // overlay edges: faint outlines of the faces, then both maps on top
          faces.forEach((f) => s.poly(f.poly, { color: 'faint', width: 1, fill: false }));
          CA.forEach((c) => s.poly(c, { color: 'blue', width: 3, fill: false }));
          CB.forEach((c) => s.poly(c, { color: 'orange', width: 3, fill: false, dash: [8, 5] }));
          // crossings of A-edges with B-edges
          const X = []; const seen = new Set();
          for (const a of CA) for (let p = 0; p < a.length; p++) for (const b of CB) for (let q = 0; q < b.length; q++) {
            const c = segCross(a[p], a[(p + 1) % a.length], b[q], b[(q + 1) % b.length], 1e-9);
            if (c) { const key = c[0].toFixed(5) + ',' + c[1].toFixed(5); if (!seen.has(key)) { seen.add(key); X.push(c); } }
          }
          X.forEach((c) => s.dot(c[0], c[1], { r: 4.5, color: 'green' }));
          if (view.value === 'ov') faces.forEach((f) => { const c = f.poly.reduce((a, p) => [a[0] + p[0] / f.poly.length, a[1] + p[1] / f.poly.length], [0, 0]); s.text(`${f.i + 1},${f.j + 1}`, c[0], c[1], { size: 11, color: 'ink' }); });
          else { CA.forEach((c, i) => { if (flagA.has(i)) { const m = c.reduce((a, p) => [a[0] + p[0] / c.length, a[1] + p[1] / c.length], [0, 0]); s.text('A', m[0], m[1], { size: 15, color: 'blue', dx: -12, dy: 12 }); } });
            CB.forEach((c, j) => { if (flagB.has(j)) { const m = c.reduce((a, p) => [a[0] + p[0] / c.length, a[1] + p[1] / c.length], [0, 0]); s.text('B', m[0], m[1], { size: 15, color: 'orange', dx: 12, dy: 12 }); } }); }
          HA.concat(HB).forEach(() => {});
          const tot = faces.reduce((a, f) => a + f.area, 0), sel = faces.filter((f) => f.keep).reduce((a, f) => a + f.area, 0);
          info = { CA, CB, nf: faces.length, k: X.length, tot, sel, nkeep: faces.filter((f) => f.keep).length };
        });
        v.legend([['blue', 'map A'], ['orange', 'map B', { dash: true }], ['green', 'crossing (a new vertex)', { dot: true }]]);
        v.readout(() => `overlay: ${info.nf} faces (at most $4\\cdot4=16$ labels $(i,j)$), ${info.k} new vertices from A×B crossings.\narea check: faces add up to $${v2(info.tot)}$ of $${10 * 7}$ — ${Math.abs(info.tot - 70) < 1e-6 ? '**exact**' : 'mismatch'}.` + (view.value === 'bool' ? `\n${op.value === 'or' ? 'A ∪ B' : op.value === 'and' ? 'A ∩ B' : op.value === 'diff' ? 'A ∖ B' : 'A △ B'}: ${info.nkeep} faces selected, area $${v2(info.sel)}$.` : ''));
      },
    },
    // ================================================================== 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Every simple polygon can be triangulated',
      statement: String.raw`Every simple polygon $P$ with $n\ge3$ vertices can be decomposed into $n-2$ triangles by $n-3$ pairwise non-crossing diagonals (segments joining two vertices and lying inside $P$). More precisely, (i) every simple polygon with $n\ge4$ vertices has a diagonal; (ii) for $n\ge4$ it has at least two non-overlapping **ears** — vertices $v$ whose two neighbours are joined by a diagonal, so that cutting off the triangle $v^-vv^+$ leaves a simple polygon with $n-1$ vertices (**two-ears theorem**). The angle sum then shows that the number of triangles is $n-2$, whatever the triangulation.`,
      idea: String.raw`Take the lowest leftmost vertex $v$, with neighbours $u,w$. If the closed triangle $uvw$ contains no other vertex, $uw$ is an internal diagonal. Otherwise choose a vertex in or on that triangle farthest from the line $uw$; joining it to $v$ gives a diagonal, since an edge crossing that segment would force a vertex still farther from $uw$. The diagonal splits $P$ into simple polygons of sizes $m_1,m_2<n$ with $m_1+m_2=n+2$. Induction triangulates both, with $(m_1-2)+(m_2-2)=n-2$ triangles and $n-3$ diagonals in total. The weak dual of a triangulation is connected, with $n-2$ nodes and $n-3$ edges, hence is a tree. Its two leaves give non-overlapping ears when $n\ge4$.

The weak dual has one vertex per triangle and one edge per internal diagonal. It is connected (a path between triangle interiors crosses a sequence of shared diagonals), and its counts are $n-2$ vertices and $n-3$ edges. GRAPH 1.5.2 therefore makes it a tree. For $n\ge4$ it has at least two vertices, so the longest-path argument of GRAPH 1.5.1a supplies two leaves. A leaf triangle has only one diagonal side and thus two polygon boundary sides: it is an ear. Different leaf triangles have disjoint interiors, giving the two-ear conclusion.`,
      caption: String.raw`**Ear clipping** steps through a triangulation: orange rings are all current ears, the gold dots mark two non-overlapping ears (the two-ears theorem guarantees them whenever $n\ge4$), the gold triangle is the one about to be cut off, green ones are done. **Diagonal lemma** shows the construction of one diagonal from the leftmost vertex. Pick a polygon, **resample** the random one, or drag the vertices: once two edges cross the polygon is no longer simple and the picture says that ear clipping has no guarantee.`,
      credit: 'Two-ears theorem: G. H. Meisters, 1975; triangulation/diagonal proof: de Berg et al., Theorem 3.1',
      deps: ['cg-1.2', 'top-10.1', 'graph-1.5.2', 'graph-1.5.1a'], refs: ['de Berg et al., 3rd ed., Theorem 3.1, pp.46–47; O’Rourke, Art Gallery Theorems, §1.3'], tags: ['polygon', 'triangulation'],
      viz(v) {
        const s = gstage(v, { height: 400, minWidth: 360 });
        const PRE = {
          M: [[0.8, 3.2], [1.8, 0.6], [3.4, 2.4], [5.0, 0.9], [8.2, 1.6], [9.2, 4.2], [7.4, 6.4], [5.6, 4.2], [3.6, 6.2], [2.0, 5.4]],
          star: Array.from({ length: 10 }, (_, k) => { const a = Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 1.4 : 3.1; return [5 + 1.35 * r * Math.cos(a), 3.5 + r * Math.sin(a)]; }),
          C: [[1, 0.8], [9, 0.8], [9, 2.2], [3, 2.2], [3, 4.8], [9, 4.8], [9, 6.2], [1, 6.2]],
        };
        let seed = 2;
        const randomPoly = () => { const r = v.rng(seed * 31 + 5), n = 12, th = Array.from({ length: n }, () => r.uniform(0, 2 * Math.PI)).sort((a, b) => a - b); return th.map((t) => { const rr = r.uniform(1.0, 3.2); return [5 + 1.4 * rr * Math.cos(t), 3.5 + rr * Math.sin(t)]; }); };
        const view = v.select('view', [{ value: 'ear', label: 'ear clipping' }, { value: 'diag', label: 'diagonal lemma' }], 'ear');
        const pre = v.select('polygon', [{ value: 'M', label: 'M shape' }, { value: 'star', label: 'star' }, { value: 'C', label: 'C shape' }, { value: 'rand', label: 'random' }], 'M', { onChange: () => load() });
        const H = Array.from({ length: 12 }, (_, i) => s.handle(5, 3, { color: 'ink', r: 6 }));
        let S;
        const load = () => { const P = pre.value === 'rand' ? randomPoly() : PRE[pre.value]; H.forEach((h, i) => { if (i < P.length) { h.set(P[i][0], P[i][1]); h.visible = true; } else h.visible = false; }); if (S) S.reset(); };
        v.button('resample', () => { seed++; pre.value = 'rand'; load(); });
        const pts = () => H.filter((h) => h.visible).map((h) => [h.x, h.y]);
        let simple = true, P = [], T;
        const build = () => {
          P = ccwPoly(pts()); simple = !polygonStatus(P);
          if (!simple) { T = null; return [{ ids: P.map((_, i) => i), ears: [], tris: [], diags: [], bad: true, note: 'Two edges cross or touch: this is **not a simple polygon**, so neither ear clipping nor the theorem applies. Drag the vertices back.' }]; }
          T = auditedEars(P);
          if(T.stuck)return[{ids:P.map((_,i)=>i),ears:[],tris:[],bad:true,note:'The numerical construction could not find a valid ear; no triangulation is certified.'}];
          return T.frames.map((f, i) => ({ ...f, line: f.done ? 5 : 3, note: f.done ? `The last triangle remains: ${T.tris.length} triangles $=n-2$ for $n=${P.length}$.` : `**${f.ears.length} ears** available (gold: two non-overlapping ones, as guaranteed). Clip vertex ${f.ear}: the diagonal ${f.tri[0]}–${f.tri[2]} cuts off a triangle and leaves a simple polygon with ${f.ids.length - 1} vertices.`, vars: { n: f.ids.length, clipped: f.tris.length-(f.done?1:0) } }));
        };
        load();
        S = v.steps({ frames: build, code: ['while the polygon has more than 3 vertices', '  find an ear v  (convex, and v⁻v v⁺ contains no other vertex)', '  output the triangle v⁻ v v⁺', '  remove v;  add the diagonal v⁻v⁺', 'output the last triangle'], codeTitle: 'Ear clipping', speed: 1.4, still: 4 });
        H.forEach((h) => { h.onDrag = () => S.reset(undefined, { at: 'keep' }); });
        let dinfo = {};
        v.render(() => {
          const f = S.frame; if (!P.length) return;
          S.el.hidden = view.value === 'diag'; if (S.codeEl) S.codeEl.hidden = view.value === 'diag'; if (S.noteEl) S.noteEl.hidden = view.value === 'diag';
          if (view.value === 'diag') {
            s.poly(P, { color: simple ? 'accent' : 'red', fill: 'accent', fillAlpha: 0.08, width: 3 });
            P.forEach((p, i) => s.dot(p[0], p[1], { r: 4.5, color: 'ink' }));
            if (!simple) { dinfo = { bad: true }; return; }
            const witness=diagonalWitness(P),vi=witness.v,u=P[witness.u],w=P[witness.w],c=P[vi],inside=witness.inside;
            s.poly([u,c,w],{color:'orange',fill:'orange',fillAlpha:.2,width:1.5,dash:true});
            const a=P[witness.a],b=P[witness.b],kind=witness.kind;
            inside.forEach(i=>s.dot(P[i][0],P[i][1],{r:8,color:'red',hollow:true}));
            s.segment(a, b, { color: 'green', width: 4 });
            s.dot(c[0], c[1], { r: 8, color: 'gold' }); s.dot(u[0], u[1], { r: 6, color: 'orange' }); s.dot(w[0], w[1], { r: 6, color: 'orange' });
            s.text('v', c[0], c[1], { dx: -12, dy: 10, size: 14, color: 'gold' }); s.text('u', u[0], u[1], { dx: -12, dy: -8, size: 13, color: 'orange' }); s.text('w', w[0], w[1], { dx: -12, dy: 10, size: 13, color: 'orange' });
            dinfo = { kind, inside: inside.length, ok: validDiagonal(P,witness.a,witness.b) };
            return;
          }
          const ids = f.ids;
          P.forEach((p, i) => { const q = P[(i + 1) % P.length]; s.segment(p, q, { color: 'faint', width: 1, dash: true }); });
          (f.tris || []).forEach((t) => s.poly(t.map((i) => P[i]), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.5 }));
          if (!f.done && !f.bad) s.poly(ids.map((i) => P[i]), { color: 'accent', width: 3.5 });
          if (f.tri) s.poly(f.tri.map((i) => P[i]), { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 2 });
          if (f.bad) s.poly(P, { color: 'red', width: 3 });
          P.forEach((p, i) => { const alive = ids.includes(i); s.dot(p[0], p[1], { r: alive ? 4.5 : 3, color: alive ? 'ink' : 'faint' }); s.text(String(i), p[0], p[1], { size: 11, color: 'muted', dx: 9, dy: -9 }); });
          (f.ears || []).forEach((e) => s.dot(P[e][0], P[e][1], { r: 10, color: 'orange', hollow: true }));
          (f.twoEars || []).forEach((e) => s.dot(P[e][0], P[e][1], { r: 6.5, color: 'gold' }));
        });
        v.readout(() => { if (view.value === 'diag') return dinfo.bad ? 'Not a simple polygon: the lemma does not apply.' : (dinfo.kind === 'uw' ? 'The triangle $uvw$ holds no other vertex, so $uw$ is a diagonal' : `$${dinfo.inside}$ vertices lie in or on $uvw$; joining $v$ to the one farthest from $uw$ gives a diagonal`) + `: it lies inside the polygon — **${dinfo.ok ? 'verified' : 'not verified'}** by testing against every edge.`;
          const f = S.frame; if (f.bad) return 'Not a simple polygon — the theorem’s hypothesis fails.'; const n = P.length;
          return `$n=${n}$ vertices, ${f.done?`$${f.tris.length}$ triangles completed`:`$${f.tris.length}$ triangle${f.tris.length === 1 ? '' : 's'} cut off so far, ${f.ids.length} vertices remain`}; the full triangulation has $n-2=${n - 2}$ triangles. ` + (T ? `Total triangle area $${v2(T.tris.reduce((a, t) => a + Math.abs(area2(t.map((i) => P[i]))) / 2, 0))}$ vs polygon area $${v2(area2(P) / 2)}$.` : ''); });
      },
    },
    // @@NEXT
  ],
};
