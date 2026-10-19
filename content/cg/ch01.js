// Computational Geometry & Graphics — Chapter 1: Geometric primitives and robustness (§§1.1–1.6; §§1.7–1.9 in ch01-b.js)
import { sgn, det3, orient, segTest, segSolve, windCross, windAngle, signedArea, isSimple } from './ch01.shared.js';

// ---------- local helpers ----------
const rgba = (v, name, a) => [...v.rgb(name).slice(0, 3), a];
const gstage = (v, o = {}) => v.stage({ x: [-0.5, 9.5], y: [-0.2, 6.4], equal: true, axes: false, height: 340, ...o });
const sg = (k) => (k > 0 ? '+' : k < 0 ? '−' : '0');
const sgCol = (k) => (k > 0 ? 'blue' : k < 0 ? 'red' : 'gold');
const f2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
/** Winding number only (no allocation), rightward half-open ray. */
function wind(px, py, P) {
  let w = 0;
  for (let i = 0, n = P.length; i < n; i++) {
    const a = P[i], b = P[i + 1 === n ? 0 : i + 1];
    if (a[1] <= py) { if (b[1] > py && (b[0] - a[0]) * (py - a[1]) - (px - a[0]) * (b[1] - a[1]) > 0) w++; }
    else if (b[1] <= py && (b[0] - a[0]) * (py - a[1]) - (px - a[0]) * (b[1] - a[1]) < 0) w--;
  }
  return w;
}

export default {
  collection: 'cg',
  chapter: 1,
  title: 'Geometric primitives and robustness',
  summary: String.raw`Geometric algorithms are built from a handful of predicates — which side of a line a point lies on, whether two segments cross, whether a point is inside a polygon — each reducing to the sign of a small determinant. Floating-point arithmetic can get those signs wrong near degeneracies and send an otherwise correct algorithm into contradiction. Exact and adaptive predicates and symbolic perturbation make algorithms robust.`,
  items: [
    // ================================================================== 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Points, vectors and affine combinations',
      statement: String.raw`In the plane, a **point** is a location and a **vector** is a displacement. The difference of two points $B-A$ is a vector; a point plus a vector is a point; but the sum of two points has no meaning. A weighted sum $\sum_i w_iA_i$ of points is nevertheless meaningful as a point exactly when the weights satisfy $\sum_i w_i=1$ (an **affine combination**): then $P=O+\sum_i w_i(A_i-O)$ does not depend on the auxiliary origin $O$. If $\sum_i w_i=0$ the result is a vector instead. For $\sum_i w_i\ne 1,0$ the answer changes with the origin.`,
      idea: String.raw`Write $P_O=O+\sum_i w_i(A_i-O)=\sum_i w_iA_i+\bigl(1-\sum_i w_i\bigr)O$. Changing the origin from $O_1$ to $O_2$ moves the result by $(1-\sum_iw_i)(O_2-O_1)$, which vanishes precisely when the weights sum to one. So affine combinations are the operations that make sense without an origin, which is why geometric code (and the homogeneous coordinates of chapter 8) treats points and vectors as different types.`,
      caption: String.raw`Drag the points $A,B,C$ and the two auxiliary origins $O_1$ (orange) and $O_2$ (purple). Each origin builds the combination $O+\sum w_i(A_i-O)$ by chaining the weighted vectors. In *affine* mode $w_C=1-w_A-w_B$ and the two results coincide at one green point; switch to *free weights* and change $w_C$: the two results part by exactly $|1-\sum w|\cdot|O_1O_2|$.`,
      deps: ['opt-2.1'], refs: ['PBRT 4e §3.3', 'PBRT 4e §3.4'], tags: ['points', 'vectors', 'affine'],
      viz(v) {
        const s = gstage(v);
        const mode = v.select('weights', [{ value: 'aff', label: 'affine: Σw = 1' }, { value: 'free', label: 'free weights' }], 'aff', { onChange: () => sync() });
        const wa = v.slider('$w_A$', -1, 2, 0.4, { step: 0.05 }), wb = v.slider('$w_B$', -1, 2, 0.35, { step: 0.05 }), wc = v.slider('$w_C$', -1, 2, 0.25, { step: 0.05 });
        const sync = () => { wc.el.hidden = mode.value === 'aff'; };
        sync();
        const A = s.handle(1.2, 1.0, { color: 'accent', label: 'A' }), B = s.handle(7.6, 1.6, { color: 'accent', label: 'B', labelPos: 'se' }), C = s.handle(4.2, 5.2, { color: 'accent', label: 'C', labelPos: 'n' });
        const O1 = s.handle(0.6, 3.6, { color: 'orange', label: 'O₁', labelPos: 'w' }), O2 = s.handle(8.4, 4.6, { color: 'purple', label: 'O₂', labelPos: 'e' });
        const W = () => { const a = wa.value, b = wb.value, c = mode.value === 'aff' ? 1 - a - b : wc.value; return [a, b, c]; };
        const build = (O) => { const w = W(), Ps = [A, B, C]; let x = O.x, y = O.y; const steps = []; Ps.forEach((P, i) => { const nx = x + w[i] * (P.x - O.x), ny = y + w[i] * (P.y - O.y); steps.push([x, y, nx, ny]); x = nx; y = ny; }); return { x, y, steps }; };
        v.render(() => {
          s.poly([[A.x, A.y], [B.x, B.y], [C.x, C.y]], { color: 'faint', fill: 'faint', fillAlpha: 0.08, width: 1.2 });
          const [a, b, c] = W(), tot = a + b + c;
          // the difference of two points is a vector: draw it between points and again from O1 (free vector)
          s.arrow(A.x, A.y, B.x, B.y, { color: 'teal', width: 1.6 });
          s.arrow(O1.x, O1.y, O1.x + B.x - A.x, O1.y + B.y - A.y, { color: 'teal', width: 1.6 });
          s.tex(String.raw`B-A`, (A.x + B.x) / 2, (A.y + B.y) / 2, { color: 'teal', dy: 12, size: 12 });
          for (const [O, col] of [[O1, 'orange'], [O2, 'purple']]) {
            const r = build(O);
            [A, B, C].forEach((P) => s.line(O.x, O.y, P.x, P.y, { color: col, alpha: 0.35, width: 1, dash: true }));
            r.steps.forEach(([x0, y0, x1, y1]) => s.arrow(x0, y0, x1, y1, { color: col, width: 2.2, head: 7 }));
            O.res = r;
          }
          const P1 = O1.res, P2 = O2.res, same = Math.hypot(P1.x - P2.x, P1.y - P2.y) < 1e-9;
          if (same) s.dot(P1.x, P1.y, { r: 7, color: 'green', label: 'P', labelPos: 'ne' });
          else { s.dot(P1.x, P1.y, { r: 6, color: 'orange', label: 'P₁', labelPos: 'ne' }); s.dot(P2.x, P2.y, { r: 6, color: 'purple', label: 'P₂', labelPos: 'ne' }); s.line(P1.x, P1.y, P2.x, P2.y, { color: 'red', width: 1.6, dash: true }); }
          s.corner(`Σw = ${f2(tot)}`, 'tr', { color: Math.abs(tot - 1) < 1e-9 ? 'green' : 'red', weight: 700 });
        });
        v.legend([['teal', 'vector $B-A$ (a difference of points)'], ['orange', 'built from $O_1$'], ['purple', 'built from $O_2$'], ['green', 'origin-free result', { dot: true }]]);
        v.readout(() => {
          const [a, b, c] = W(), tot = a + b + c, P1 = O1.res, P2 = O2.res, d = Math.hypot(P1.x - P2.x, P1.y - P2.y), pred = Math.abs(1 - tot) * Math.hypot(O1.x - O2.x, O1.y - O2.y);
          return `$w=(${f2(a)},\\,${f2(b)},\\,${f2(c)})$, $\\sum w=${f2(tot)}$\n$|P_1-P_2|=${d.toFixed(4)}$ and $|1-\\sum w|\\cdot|O_1O_2|=${pred.toFixed(4)}$ — ${d < 1e-9 ? 'the combination is independent of the origin: a point.' : 'the result depends on the origin: not a point.'}`;
        });
      },
    },
    // ================================================================== 1.2
    {
      num: '1.2', kind: 'Theorem', name: 'Orientation predicate: the sign of a determinant',
      statement: String.raw`For points $p,q,r\in\R^2$ let $$\Delta(p,q,r)=\det\begin{pmatrix}q_x-p_x& r_x-p_x\\ q_y-p_y& r_y-p_y\end{pmatrix}=(q_x-p_x)(r_y-p_y)-(q_y-p_y)(r_x-p_x).$$ Then $\Delta/2$ is the signed area of triangle $pqr$, and $\operatorname{orient}(p,q,r)=\operatorname{sgn}\Delta$ is $+1$ when $r$ lies strictly to the left of the directed line $pq$ (the triple turns counter-clockwise), $-1$ when strictly to the right, and $0$ exactly when $p,q,r$ are collinear. It is unchanged by cyclic permutations of the arguments and changes sign under any transposition.`,
      idea: String.raw`The determinant is the signed area of the parallelogram spanned by $q-p$ and $r-p$, i.e. $|pq|\cdot h$ with $h$ the signed distance of $r$ from the line $pq$ (positive on the left). Its sign is therefore the side of the line, and it vanishes iff $r$ is on the line. Alternating in the rows (ladr-9.43) gives the cyclic/transposition rules, and the change of base point is a row operation that leaves the determinant fixed.`,
      caption: String.raw`Drag $p,q,r$. The plane is shaded blue on the left of $pq$ and red on the right; parallel lines mark signed distance $h=\pm1,\pm2,\dots$ from the line (the value of $\Delta$ there is $|pq|\,h$). The parallelogram spanned by $q-p$ and $r-p$ has area $|\Delta|$. Swap two points with the button and every sign flips.`,
      deps: ['cg-1.1', 'rca-2.23', 'ladr-9.43'], refs: ['de Berg §1.1'], tags: ['orientation', 'determinant'],
      viz(v) {
        const s = gstage(v);
        const p = s.handle(1.5, 1.2, { color: 'accent', label: 'p', labelPos: 'sw' }), q = s.handle(6.8, 2.6, { color: 'accent', label: 'q', labelPos: 'se' }), r = s.handle(3.8, 4.9, { color: 'gold', label: 'r', labelPos: 'n' });
        v.button('swap q ↔ r', () => { const t = [q.x, q.y]; q.set(r.x, r.y); r.set(t[0], t[1]); });
        v.render(() => {
          const P = [p.x, p.y], Q = [q.x, q.y], R = [r.x, r.y], d = det3(P, Q, R), L = Math.hypot(Q[0] - P[0], Q[1] - P[1]) || 1e-9;
          s.raster((x, y) => { const t = det3(P, Q, [x, y]); return t > 0 ? rgba(v, 'blue', 0.13) : t < 0 ? rgba(v, 'red', 0.13) : null; }, { res: 4, key: `${p.x}|${p.y}|${q.x}|${q.y}` });
          // lines at signed distance k
          const ux = (Q[0] - P[0]) / L, uy = (Q[1] - P[1]) / L, nx = -uy, ny = ux;
          for (let k = -6; k <= 6; k++) if (k) s.line(P[0] + nx * k - ux * 30, P[1] + ny * k - uy * 30, P[0] + nx * k + ux * 30, P[1] + ny * k + uy * 30, { color: 'grid', width: 1, alpha: 0.9 });
          s.line(P[0] - ux * 30, P[1] - uy * 30, P[0] + ux * 30, P[1] + uy * 30, { color: 'ink', width: 1.4, alpha: 0.6 });
          s.poly([P, Q, [Q[0] + R[0] - P[0], Q[1] + R[1] - P[1]], R], { color: 'faint', fill: 'faint', fillAlpha: 0.08, width: 1, dash: true });
          s.poly([P, Q, R], { color: sgCol(sgn(d)), fill: sgCol(sgn(d)), fillAlpha: 0.3, width: 2.2 });
          s.arrow(P[0], P[1], Q[0], Q[1], { color: 'ink', width: 2.2 });
          s.corner(sgn(d) > 0 ? 'left turn · orient = +1' : sgn(d) < 0 ? 'right turn · orient = −1' : 'collinear · orient = 0', 'tr', { color: sgCol(sgn(d)), weight: 700, plate: true });
        });
        v.legend([['blue', 'left of $pq$: $\\Delta>0$', { area: true }], ['red', 'right of $pq$: $\\Delta<0$', { area: true }]]);
        v.readout(() => {
          const P = [p.x, p.y], Q = [q.x, q.y], R = [r.x, r.y], d = det3(P, Q, R);
          return `$\\Delta=(${f2(Q[0] - P[0])})(${f2(R[1] - P[1])})-(${f2(Q[1] - P[1])})(${f2(R[0] - P[0])})=${f2(d)}$, signed area $=${f2(d / 2)}$\n` +
            `orient$(p,q,r)=${sg(orient(P, Q, R))}$, $(q,r,p)=${sg(orient(Q, R, P))}$, $(r,p,q)=${sg(orient(R, P, Q))}$ · transposed: $(q,p,r)=${sg(orient(Q, P, R))}$, $(p,r,q)=${sg(orient(P, R, Q))}$, $(r,q,p)=${sg(orient(R, Q, P))}$`;
        });
      },
    },
    // ================================================================== 1.3
    {
      num: '1.3', kind: 'Algorithm', name: 'Segment intersection test',
      statement: String.raw`Closed segments $ab$ and $cd$ share a point iff either (i) they **cross properly**: $\operatorname{orient}(a,b,c)\cdot\operatorname{orient}(a,b,d)<0$ and $\operatorname{orient}(c,d,a)\cdot\operatorname{orient}(c,d,b)<0$; or (ii) some endpoint lies on the other segment: one of the four orientations is $0$ and the endpoint is within the bounding box of that segment. The test uses four orientation evaluations and no division, and handles touching and collinear overlap exactly (provided the orientations are exact).`,
      idea: String.raw`If $c$ and $d$ lie strictly on opposite sides of line $ab$, and $a,b$ strictly on opposite sides of line $cd$, each segment straddles the other's line, so they meet at the one point where the lines meet (that point lies on both segments). A zero orientation means an endpoint on the other line, where only the bounding-box test can say whether it lies on the segment. All of it is the orientation predicate (1.2).`,
      caption: String.raw`Drag the four endpoints (turn on *snap* to land exactly on degenerate positions) or pick a preset. The signs $o_1,\dots,o_4$ are written next to the endpoint they test. Green segments intersect. The independent check solves $a+t(b-a)=c+u(d-c)$ for $t,u\in[0,1]$ and must always agree.`,
      deps: ['cg-1.2'], refs: ['de Berg §2.1'], tags: ['segments', 'intersection'],
      viz(v) {
        const snap = v.toggle('snap to grid', false);
        const grid = (x, y) => (snap.value ? [Math.round(x * 2) / 2, Math.round(y * 2) / 2] : [x, y]);
        const s = gstage(v);
        const mk = (x, y, label, pos, col) => s.handle(x, y, { color: col, label, labelPos: pos, constrain: grid });
        const a = mk(1.5, 1.5, 'a', 'sw', 'accent'), b = mk(7.5, 4.5, 'b', 'ne', 'accent'), c = mk(2, 4.8, 'c', 'nw', 'orange'), d = mk(7, 1, 'd', 'se', 'orange');
        const H = [a, b, c, d];
        const presets = { cross: [[1.5, 1.5], [7.5, 4.5], [2, 4.5], [7, 1]], free: null };
        presets.T = [[1.5, 1.5], [7.5, 1.5], [4.5, 4.5], [4.5, 1.5]]; presets.vee = [[1.5, 1.5], [5, 4], [5, 4], [8.5, 1.5]]; presets.overlap = [[1, 1], [6, 4], [3, 2], [8.5, 5.5]]; presets.gap = [[1, 1], [4, 3], [5, 3.5], [8, 5.5]];
        v.select('preset', [{ value: 'free', label: 'free' }, { value: 'cross', label: 'proper crossing' }, { value: 'T', label: 'T-touch' }, { value: 'vee', label: 'shared endpoint' }, { value: 'overlap', label: 'collinear overlap' }, { value: 'gap', label: 'collinear, disjoint' }], 'free', {
          onChange: (k) => { const P = presets[k]; if (P) H.forEach((h, i) => h.set(P[i][0], P[i][1])); },
        });
        v.render(() => {
          const A = [a.x, a.y], B = [b.x, b.y], Cc = [c.x, c.y], D = [d.x, d.y], t = segTest(A, B, Cc, D), ok = segSolve(A, B, Cc, D);
          s.line(A[0] - (B[0] - A[0]) * 5, A[1] - (B[1] - A[1]) * 5, B[0] + (B[0] - A[0]) * 5, B[1] + (B[1] - A[1]) * 5, { color: 'accent', alpha: 0.25, dash: true, width: 1 });
          s.line(Cc[0] - (D[0] - Cc[0]) * 5, Cc[1] - (D[1] - Cc[1]) * 5, D[0] + (D[0] - Cc[0]) * 5, D[1] + (D[1] - Cc[1]) * 5, { color: 'orange', alpha: 0.3, dash: true, width: 1 });
          const col1 = t.hit ? 'green' : 'accent', col2 = t.hit ? 'green' : 'orange';
          s.segment(A, B, { color: col1, width: 3.5 }); s.segment(Cc, D, { color: col2, width: 3.5 });
          if (t.kind === 'cross') { const den = det3([0, 0], [B[0] - A[0], B[1] - A[1]], [D[0] - Cc[0], D[1] - Cc[1]]); const u = ((Cc[0] - A[0]) * (D[1] - Cc[1]) - (Cc[1] - A[1]) * (D[0] - Cc[0])) / den; s.dot(A[0] + u * (B[0] - A[0]), A[1] + u * (B[1] - A[1]), { r: 6, color: 'gold' }); }
          if (t.kind === 'overlap') { const pts = [A, B, Cc, D].sort((p, q) => p[0] - q[0] || p[1] - q[1]); s.segment(pts[1], pts[2], { color: 'gold', width: 6, alpha: 0.7 }); }
          const badge = (P, k, dx, dy) => s.text(`${sg(k)}`, P[0], P[1], { color: sgCol(k), size: 15, dx, dy, align: 'center', plate: true });
          badge(Cc, t.o1, 0, 26); badge(D, t.o2, 0, 26); badge(A, t.o3, 0, -26); badge(B, t.o4, 0, -26);
          s.corner(t.hit ? `intersect · ${t.kind}` : 'disjoint', 'tr', { color: t.hit ? 'green' : 'red', weight: 700, plate: true });
          s._ok = ok; s._t = t;
        });
        v.legend([['orange', 'orient$(a,b,\\cdot)$ marked at $c,d$'], ['accent', 'orient$(c,d,\\cdot)$ marked at $a,b$'], ['gold', 'crossing / overlap', { dot: true }]]);
        v.readout(() => `$o_1=\\mathrm{or}(a,b,c)=${sg(s._t.o1)}$, $o_2=\\mathrm{or}(a,b,d)=${sg(s._t.o2)}$, $o_3=\\mathrm{or}(c,d,a)=${sg(s._t.o3)}$, $o_4=\\mathrm{or}(c,d,b)=${sg(s._t.o4)}$\nfour-orientation test: **${s._t.hit ? 'intersect' : 'disjoint'}** · parametric solve $t,u\\in[0,1]$: **${s._ok ? 'intersect' : 'disjoint'}** — ${s._t.hit === s._ok ? 'they agree' : 'DISAGREE'}`);
      },
    },
    // ================================================================== 1.4
    {
      num: '1.4', kind: 'Theorem', name: 'Shoelace formula for polygon area',
      statement: String.raw`For a closed polygon with vertices $v_0,\dots,v_{n-1}$ (indices mod $n$), the number $$A=\tfrac12\sum_{i=0}^{n-1}\det(v_i,v_{i+1})=\tfrac12\sum_{i}(x_iy_{i+1}-x_{i+1}y_i)$$ equals, for any choice of origin $O$, the sum of the signed areas of the triangles $O v_iv_{i+1}$. For a simple polygon $A$ is the area of the enclosed region, positive when the vertices run counter-clockwise and negative when clockwise. For a self-intersecting polygon $A=\iint w(x)\,dx$, each region weighted by its winding number.`,
      idea: String.raw`Fan triangles out of $O$: each term $\tfrac12\det(v_i-O,v_{i+1}-O)$ is a signed area (1.2), positive where the edge $v_iv_{i+1}$ sweeps counter-clockwise about $O$. Where $O$ is outside, the triangles on the near side of the polygon are negative and cancel exactly the surplus of the far side; the cancellation is the same telescoping that makes the answer independent of $O$. The shoelace formula is Green's theorem $\tfrac12\oint x\,dy-y\,dx$ on a polygon.`,
      caption: String.raw`Drag the six vertices and the fan centre $O$ (orange). In *fan* view each triangle $Ov_iv_{i+1}$ is blue if counter-clockwise and red if clockwise, with its signed area; their sum never changes as $O$ moves. In *winding* view the polygon is shaded by winding number. The grid count adds up $w(x)\cdot$cell area over thousands of sample cells and must agree with the formula, even after you drag an edge across another to self-intersect the polygon.`,
      deps: ['cg-1.2', 'pma-10.45'], refs: ['de Berg §1.1'], tags: ['area', 'polygon'], credit: 'area formula of Gauss (1795, published 1813); surveyors\u2019 formula',
      viz(v) {
        const view = v.select('view', [{ value: 'fan', label: 'fan triangles from O' }, { value: 'wind', label: 'winding number' }], 'fan');
        const s = gstage(v, { x: [-0.5, 9.5], y: [-0.4, 6.4] });
        const init = [[1.5, 1.2], [4.2, 0.6], [7.8, 1.6], [8.2, 4.8], [5, 5.6], [2, 4.2]];
        const Vh = init.map(([x, y], i) => s.handle(x, y, { color: 'accent', label: String(i), labelPos: 'n' }));
        const O = s.handle(1.0, 2.8, { color: 'orange', label: 'O', labelPos: 'w' });
        v.button('reverse order', () => { const pts = Vh.map((h) => [h.x, h.y]).reverse(); Vh.forEach((h, i) => h.set(pts[i][0], pts[i][1])); });
        v.render(() => {
          const P = Vh.map((h) => [h.x, h.y]), n = P.length;
          if (view.value === 'wind') s.raster((x, y) => { const w = wind(x, y, P); return w === 0 ? null : rgba(v, w > 0 ? 'blue' : 'red', Math.min(0.55, 0.2 + 0.15 * Math.abs(w))); }, { res: 3, key: P.flat().join('|') });
          else for (let i = 0; i < n; i++) {
            const a = P[i], b = P[(i + 1) % n], t = det3([O.x, O.y], a, b) / 2;
            s.poly([[O.x, O.y], a, b], { color: t >= 0 ? 'blue' : 'red', fill: t >= 0 ? 'blue' : 'red', fillAlpha: 0.2, width: 1, alpha: 0.7 });
            s.text(f2(t), (O.x + a[0] + b[0]) / 3, (O.y + a[1] + b[1]) / 3, { color: t >= 0 ? 'blue' : 'red', size: 11, align: 'center', plate: true });
          }
          s.path(P, { close: true, color: 'ink', width: 2.4 });
          s.corner(`A = ${f2(signedArea(P))}`, 'tr', { color: 'ink', weight: 700, plate: true });
        });
        v.legend([['blue', 'counter-clockwise (+)', { area: true }], ['red', 'clockwise (−)', { area: true }]]);
        v.readout(() => {
          const P = Vh.map((h) => [h.x, h.y]), n = P.length, A = signedArea(P);
          const terms = P.map((p, i) => det3([O.x, O.y], p, P[(i + 1) % n]) / 2), sum = terms.reduce((a, b) => a + b, 0);
          // grid sum of winding numbers
          const g = 0.04; let acc = 0, ev = 0; for (let x = -0.5 + g / 2; x < 9.5; x += g) for (let y = -0.4 + g / 2; y < 6.4; y += g) { const w = wind(x, y, P); acc += w; if (w & 1) ev++; }
          const simple = isSimple(P);
          return `shoelace $A=${f2(A)}$ · fan sum from $O$: $${terms.map(f2).join('+')}=${f2(sum)}$ ${Math.abs(sum - A) < 1e-9 ? '(equal)' : ''}\n` +
            `grid count $\\sum w\\cdot g^2=${f2(acc * g * g)}$` + (simple ? ` · polygon is simple: $|A|$ = area, vertices run ${A > 0 ? 'counter-clockwise' : 'clockwise'}` : ` · **self-intersecting**: odd-winding area is ${f2(ev * g * g)}, not $A$`);
        });
      },
    },
    // ================================================================== 1.5
    {
      num: '1.5', kind: 'Algorithm', name: 'Point in polygon: crossing number and winding number',
      statement: String.raw`Let $q$ be a point and $P$ a closed polygon, and shoot a ray from $q$ in any direction not passing through a vertex. The **crossing number** is the number of edges the ray meets; the **even–odd rule** calls $q$ inside iff it is odd. The **winding number** $w(q)$ counts those crossings with sign (+1 where the edge crosses the ray counter-clockwise about $q$, −1 clockwise); the **nonzero rule** calls $q$ inside iff $w(q)\ne0$. Both are independent of the ray, $w(q)=\frac1{2\pi}\sum_i\angle v_iqv_{i+1}$, and for simple polygons the two rules agree.`,
      idea: String.raw`The sign of a crossing is an orientation test of $q$ against the crossed edge. The signed crossings sum to the number of times the polygon wraps around $q$, which is the angle sum divided by $2\pi$: moving the ray across a vertex adds a crossing and removes one of opposite sign (or two of the same parity), so the count is a topological invariant of the pair. For a simple polygon this is the Jordan curve theorem (top-10.1) in its polygonal form; the pentagram shows that for non-simple curves the two rules differ.`,
      caption: String.raw`Drag the query point $q$, the polygon's vertices, and the ray angle. Crossings are dots: blue where the edge goes up through the ray, red where it goes down. The shading shows what each rule fills (choose which). Rotate the ray: its count changes but parity and signed sum do not. Pentagram: the middle pentagon has winding number 2, so even–odd leaves it empty while nonzero fills it.`,
      deps: ['cg-1.3', 'top-10.1', 'graph-4.1.1'], refs: ['de Berg §6.1'], tags: ['polygon', 'winding number', 'ray casting'],
      viz(v) {
        const shape = v.select('polygon', [{ value: 'p52', label: 'pentagram {5/2}' }, { value: 'p73', label: 'heptagram {7/3}' }, { value: 'bow', label: 'bow tie' }, { value: 'conc', label: 'simple concave' }], 'p52', { onChange: () => load() });
        const fill = v.select('shading', [{ value: 'eo', label: 'even–odd' }, { value: 'nz', label: 'nonzero' }, { value: 'w', label: 'winding number' }], 'w');
        const ang = v.slider('ray angle (°)', 0, 360, 20, { step: 1 });
        const s = gstage(v, { x: [-3.6, 3.6], y: [-3.4, 3.7], height: 380 });
        const star = (n, k, R = 3) => Array.from({ length: n }, (_, i) => [R * Math.cos(Math.PI / 2 + (2 * Math.PI * k * i) / n), R * Math.sin(Math.PI / 2 + (2 * Math.PI * k * i) / n)]);
        const SH = { p52: star(5, 2), p73: star(7, 3), bow: [[-2.8, -2.2], [2.8, 2.2], [2.8, -2.2], [-2.8, 2.2]], conc: [[-3, -2.5], [3, -2.5], [3, 2.5], [1, 2.5], [0, -0.2], [-1, 2.5], [-3, 2.5]] };
        const Vh = Array.from({ length: 7 }, (_, i) => s.handle(0, 0, { color: 'accent', r: 6, label: String(i), labelPos: 'n' }));
        const q = s.handle(0.4, 0.3, { color: 'gold', r: 8, label: 'q', labelPos: 'ne' });
        let nv = 5;
        function load() { const P = SH[shape.value]; nv = P.length; Vh.forEach((h, i) => { h.visible = i < nv; if (i < nv) h.set(P[i][0], P[i][1]); }); if (shape.value === 'p52') q.set(0.4, 0.3); }
        load();
        v.render(() => {
          const P = Vh.slice(0, nv).map((h) => [h.x, h.y]);
          s.raster((x, y) => {
            const w = wind(x, y, P);
            if (fill.value === 'eo') return w & 1 ? rgba(v, 'accent', 0.3) : null;
            if (fill.value === 'nz') return w ? rgba(v, 'accent', 0.3) : null;
            return w === 0 ? null : rgba(v, w > 0 ? 'blue' : 'red', Math.min(0.6, 0.15 + 0.15 * Math.abs(w)));
          }, { res: 3, key: `${fill.value}|${P.flat().join('|')}` });
          s.path(P, { close: true, color: 'ink', width: 2.2 });
          const th = (ang.value * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th), Q = [q.x, q.y];
          // rotate the polygon about q so the ray becomes the +x ray
          const R = P.map(([x, y]) => [(x - Q[0]) * c + (y - Q[1]) * sn, -(x - Q[0]) * sn + (y - Q[1]) * c]);
          const res = windCross([0, 0], R);
          s.arrow(Q[0], Q[1], Q[0] + 12 * c, Q[1] + 12 * sn, { color: 'gold', width: 2.2, head: 9 });
          res.hits.forEach((h, k) => { const X = Q[0] + h.x * c, Y = Q[1] + h.x * sn; s.dot(X, Y, { r: 6, color: h.up ? 'blue' : 'red' }); s.text(String(k + 1), X, Y, { dy: -14, size: 11, color: h.up ? 'blue' : 'red', align: 'center', plate: true }); });
          s.corner(`crossings ${res.cross} · w = ${res.w}`, 'tr', { color: res.w ? 'green' : 'muted', weight: 700, plate: true });
          q.res = res;
        });
        v.legend([['blue', 'edge crosses ray upward (+1)', { dot: true }], ['red', 'downward (−1)', { dot: true }], ['gold', 'ray from $q$']]);
        v.readout(() => {
          const P = Vh.slice(0, nv).map((h) => [h.x, h.y]), Q = [q.x, q.y], r = q.res, wa = windAngle(Q, P), w2 = wind(Q[0], Q[1], P);
          return `crossing number $${r.cross}$ → even–odd: **${r.cross % 2 ? 'inside' : 'outside'}** · signed sum $w=${r.w}$ → nonzero: **${r.w ? 'inside' : 'outside'}**\nangle sum $\\frac1{2\\pi}\\sum\\angle=${wa}$ (${wa === r.w && w2 === r.w ? 'agrees with every ray' : 'DISAGREES'}) · polygon is ${isSimple(P) ? 'simple: both rules agree' : 'self-intersecting: the rules can differ'}`;
        });
      },
    },
    // ================================================================== 1.6
    {
      num: '1.6', kind: 'Definition', name: 'Barycentric coordinates',
      statement: String.raw`Let $A,B,C$ be affinely independent points of the plane. Every point $P$ has unique **barycentric coordinates** $(\lambda_A,\lambda_B,\lambda_C)$ with $\lambda_A+\lambda_B+\lambda_C=1$ and $P=\lambda_AA+\lambda_BB+\lambda_CC$. They are ratios of signed areas, $\lambda_A=\operatorname{area}(PBC)/\operatorname{area}(ABC)$ and cyclically, i.e. ratios of orientation determinants. $P$ lies in the closed triangle iff all three are $\ge0$, and for any quantity $f$ known at the vertices, $\sum\lambda_if(A_i)$ is its linear interpolation.`,
      idea: String.raw`$\lambda_A$ is the signed distance from $P$ to line $BC$ relative to that of $A$ — an affine function equal to 1 at $A$ and 0 on $BC$ — and the three affine functions sum to the constant 1. Written as areas, each is a quotient of two orientation determinants (1.2), negative exactly when $P$ is across the opposite side. This is the weighting used to interpolate colours and depths across a triangle, and in the ray-triangle test of rendering.`,
      caption: String.raw`Drag the triangle's corners and the point $P$. In *areas* view the three sub-triangles $PBC$, $PCA$, $PAB$ are coloured with the colour of the opposite vertex (hatched when their signed area is negative, i.e. $P$ is outside); in *colour blend* view the triangle shows the mix of the vertex colours with weights $\lambda$. Drag $P$ outside and a weight goes negative.`,
      deps: ['cg-1.1', 'ladr-2.28'], refs: ['PBRT 4e §6.5'], tags: ['barycentric', 'triangle', 'interpolation'], credit: 'Möbius, 1827',
      viz(v) {
        const vw = v.select('view', [{ value: 'areas', label: 'sub-triangle areas' }, { value: 'blend', label: 'colour blend' }], 'areas');
        const s = gstage(v);
        const A = s.handle(1.4, 1.1, { color: 'red', label: 'A', labelPos: 'sw' }), B = s.handle(8, 1.7, { color: 'green', label: 'B', labelPos: 'se' }), C = s.handle(4.4, 5.6, { color: 'blue', label: 'C', labelPos: 'n' });
        const P = s.handle(4.2, 2.6, { color: 'gold', r: 8, label: 'P', labelPos: 'ne' });
        const cols = ['red', 'green', 'blue'];
        const lam = () => { const a = [A.x, A.y], b = [B.x, B.y], c = [C.x, C.y], p = [P.x, P.y], T = det3(a, b, c) || 1e-12; return [det3(p, b, c) / T, det3(a, p, c) / T, det3(a, b, p) / T]; };
        v.render(() => {
          const a = [A.x, A.y], b = [B.x, B.y], c = [C.x, C.y], p = [P.x, P.y], T = det3(a, b, c) || 1e-12;
          const rg = cols.map((n) => v.rgb(n));
          if (vw.value === 'blend') s.raster((x, y) => { const l = [det3([x, y], b, c) / T, det3(a, [x, y], c) / T, det3(a, b, [x, y]) / T]; if (l[0] < 0 || l[1] < 0 || l[2] < 0) return null; return [0, 1, 2].map((k) => l[0] * rg[0][k] + l[1] * rg[1][k] + l[2] * rg[2][k]).concat(0.8); }, { res: 3, key: `${A.x}|${A.y}|${B.x}|${B.y}|${C.x}|${C.y}` });
          const L = lam(), subs = [[p, b, c], [a, p, c], [a, b, p]];
          if (vw.value === 'areas') subs.forEach((tri, k) => s.poly(tri, { color: cols[k], fill: cols[k], fillAlpha: L[k] < 0 ? 0.0 : 0.32, width: 1.8, hatch: L[k] < 0 ? cols[k] : false, dash: L[k] < 0 }));
          s.poly([a, b, c], { color: 'ink', width: 2.2, fill: false });
          [a, b, c].forEach((q) => s.line(p[0], p[1], q[0], q[1], { color: 'ink', alpha: 0.35, width: 1, dash: true }));
          s.corner(L.every((x) => x >= 0) ? 'P inside' : 'P outside', 'tr', { color: L.every((x) => x >= 0) ? 'green' : 'red', weight: 700, plate: true });
        });
        v.legend([['red', '$\\lambda_A$ = area$(PBC)$/area$(ABC)$', { area: true }], ['green', '$\\lambda_B$ = area$(PCA)$/…', { area: true }], ['blue', '$\\lambda_C$ = area$(PAB)$/…', { area: true }]]);
        v.readout(() => {
          const L = lam(), rx = L[0] * A.x + L[1] * B.x + L[2] * C.x, ry = L[0] * A.y + L[1] * B.y + L[2] * C.y;
          return `$(\\lambda_A,\\lambda_B,\\lambda_C)=(${f2(L[0])},\\,${f2(L[1])},\\,${f2(L[2])})$ · sum $=${(L[0] + L[1] + L[2]).toFixed(6)}$\nreconstruction error $|\\sum\\lambda_iA_i-P|=${Math.hypot(rx - P.x, ry - P.y).toExponential(1)}$`;
        });
      },
    },
  ],
};
