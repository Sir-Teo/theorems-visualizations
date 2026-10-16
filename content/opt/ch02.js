// Optimization — Chapter 2: Convex sets (items 2.1–2.7; 2.8–2.13 in ch02-b.js)
//
// House style: every claim of the form "this set is convex" is *tested* in the picture by a seeded chord test on the
// set the reader is looking at, so that a non-convex variant (a ring, a crescent, a union, a dented body) fails
// visibly; cones are drawn from their generators, separations from closest pairs, and the readout compares the
// computed number with the statement.
import {
  TAU, clamp, mulberry, inPoly, hull, segClosest, clipHalf, boxPoly, polyhedron, chordTest, SETS, inCone2, coneWidth,
  fanPoly, polysIntersect, polyDistance, support, infimum, sub2, add2, dot2, len2,
} from './ch02.shared.js';

/** Maximal runs of the segment p→q (sampled at n+1 points) inside / outside a membership function. */
function runs(inside, p, q, n = 240) {
  const out = []; let cur = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, ok = inside(p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]));
    if (!cur || cur.ok !== ok) { if (cur) cur.t1 = t; cur = { ok, t0: t, t1: t }; out.push(cur); } else cur.t1 = t;
  }
  return out;
}
const fmt2 = (v, x) => v.fix(x, 2);
const memo = () => { let k = null, val; return (key, f) => { if (key !== k) { val = f(); k = key; } return val; }; };
const rgbA = (v, name, a) => [...v.rgb(name).slice(0, 3), a];

export default {
  collection: 'opt',
  chapter: 2,
  title: 'Convex sets',
  summary: String.raw`A set is convex when it contains every segment between its points. Halfspaces, balls, ellipsoids, polyhedra and the cone of positive semidefinite matrices are the basic examples, and intersections, affine images and perspectives preserve convexity. The central fact is separation: two disjoint convex sets can be split by a hyperplane, and every boundary point of a convex set has a supporting hyperplane — the geometry beneath all of duality.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Affine sets, convex sets and convex hulls',
      statement: String.raw`A set $C\subseteq\R^n$ is **affine** if the whole line through any two of its points lies in it, $\theta x+(1-\theta)y\in C$ for all $x,y\in C$ and all $\theta\in\R$; it is **convex** if only the segment is required, $\theta x+(1-\theta)y\in C$ for $x,y\in C$ and $0\le\theta\le1$. A **convex combination** of $x_1,\dots,x_k$ is $\sum_i\theta_ix_i$ with $\theta_i\ge0$ and $\sum_i\theta_i=1$ (an **affine combination** drops the sign condition). The **convex hull** $\operatorname{conv}S$ is the set of all convex combinations of points of $S$ and the **affine hull** $\operatorname{aff}S$ the set of all affine combinations. They are the smallest convex, respectively affine, sets containing $S$. Affine sets are the translates of linear subspaces; every affine set is convex, but not conversely.`,
      idea: String.raw`The definitions say "closed under the combinations with weights summing to one", and the two flavours differ only in the allowed weights: all reals give lines, planes and their higher analogues, weights in $[0,1]$ give the segments, triangles and polytopes between the points. Induction on the number of points shows that a convex set contains all convex combinations of its points (a combination of $k$ points is a segment between a $(k-1)$-point combination and the last point), so $\operatorname{conv}S$ really is the smallest convex set around $S$. Intersections of convex sets are convex, which is what makes "smallest" well defined.`,
      caption: String.raw`**Left:** drag the points (change their number with $k$); the rubber-band polygon is $\operatorname{conv}$, the shaded plane or line is $\operatorname{aff}$, and the gold point $z$ is tested against both. Press *collinear* and the affine hull collapses from the plane to a line. Interior points are hollow: they are not needed. **Right:** pick a set and drag the segment's endpoints; green stretches stay in the set, red stretches leave it. The chord test samples 1400 random chords: a convex set has none that leave, the ring, crescent, two discs and star all do. Toggle the dashed convex hull of the set.`,
      deps: ['pma-2.17'],
      refs: ['Boyd–Vandenberghe §2.1'],
      tags: ['convex set', 'convex hull', 'affine set'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_set' },
      viz(v) {
        const view = { x: [-4.2, 4.2], y: [-3.2, 3.2] };
        const SA = v.stage({ ...view, equal: true, axes: false, grid: true, height: 340, title: 'points, affine hull, convex hull' });
        const SB = v.stage({ ...view, equal: true, axes: false, grid: true, height: 340, title: 'the segment test' });
        const hs = v.select('hulls', [{ value: 'both', label: 'both' }, { value: 'convex', label: 'convex' }, { value: 'affine', label: 'affine' }], 'both');
        const kS = v.slider('points $k$', 2, 8, 6, { step: 1, int: true });
        const start = [[-2.6, -1.3], [-1.0, 2.0], [1.7, 1.6], [2.9, -0.5], [0.8, -2.2], [-0.5, 0.1], [-3.0, 0.9], [1.5, -0.4]];
        const H = start.map((p) => SA.handle(p[0], p[1], { color: 'accent', r: 6 }));
        const z = SA.handle(0.9, 0.5, { color: 'gold', label: 'z', labelPos: 'ne' });
        v.button('collinear', () => {
          const o = [H[0].x, H[0].y], d = [H[1].x - o[0], H[1].y - o[1]], ts = [0, 1, 0.45, -0.55, 1.5, 0.75, -0.2, 1.2];
          H.forEach((h, i) => h.set(o[0] + ts[i] * d[0], o[1] + ts[i] * d[1]));
          z.set(o[0] + 0.3 * d[0], o[1] + 0.3 * d[1]);
        });
        v.button('spread out', () => { H.forEach((h, i) => h.set(start[i][0], start[i][1])); z.set(0.9, 0.5); });
        const setSel = v.select('set', SETS.map((s) => ({ value: s.key, label: s.label })), 'crescent');
        const showH = v.toggle('dashed convex hull of the set', true);
        const P = SB.handle(-1.9, -0.9, { color: 'accent', label: 'x', labelPos: 'sw' });
        const Q = SB.handle(0.4, 2.2, { color: 'accent', label: 'y', labelPos: 'ne' });
        const mem = memo(), memH = memo();
        let info = {}, chord = {};
        v.render(() => {
          const k = kS.value;
          H.forEach((h, i) => { h.visible = i < k; });
          const ps = H.slice(0, k).map((h) => [h.x, h.y]);
          // farthest pair → line; spread of the others about it
          let p0 = ps[0], q0 = ps[1], bl = 0;
          for (const a of ps) for (const b of ps) { const L = Math.hypot(a[0] - b[0], a[1] - b[1]); if (L > bl) { bl = L; p0 = a; q0 = b; } }
          let off = 0;
          for (const a of ps) { const c = Math.abs((q0[0] - p0[0]) * (a[1] - p0[1]) - (q0[1] - p0[1]) * (a[0] - p0[0])) / (bl || 1); off = Math.max(off, c); }
          const dim = bl < 0.05 ? 0 : off < 0.04 ? 1 : 2;
          const hl = dim === 2 ? hull(ps) : dim === 1 ? [p0, q0] : [p0];
          const zp = [z.x, z.y];
          const inConv = dim === 2 ? inPoly(zp[0], zp[1], hl) : dim === 1 ? Math.hypot(...sub2(zp, segClosest(zp, p0, q0))) < 0.05 : false;
          const inAff = dim === 2 ? true : dim === 1 ? Math.abs((q0[0] - p0[0]) * (zp[1] - p0[1]) - (q0[1] - p0[1]) * (zp[0] - p0[0])) / bl < 0.06 : false;
          const showA = hs.value !== 'convex', showC = hs.value !== 'affine';
          if (showA) {
            if (dim === 2) { SA.rect(-40, -40, 40, 40, { fill: 'teal', fillAlpha: 0.09, stroke: false }); SA.corner('aff S = ℝ²', 'tl', { color: 'teal' }); }
            else if (dim === 1) { const d = sub2(q0, p0); SA.line(p0[0] - 30 * d[0], p0[1] - 30 * d[1], q0[0] + 30 * d[0], q0[1] + 30 * d[1], { color: 'teal', width: 2.4 }); SA.corner('aff S = a line', 'tl', { color: 'teal' }); }
          }
          if (showC) {
            if (dim === 2) SA.poly(hl, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
            else if (dim === 1) SA.segment(p0, q0, { color: 'accent', width: 4 });
          }
          ps.forEach((p, i) => SA.dot(p[0], p[1], { r: 6, color: 'accent', hollow: showC && dim === 2 && !hl.some((h) => h === p) }));
          SA.dot(zp[0], zp[1], { r: 7, color: inConv ? 'green' : 'gold', label: 'z', labelPos: 'ne' });
          // right panel
          const S = SETS.find((s) => s.key === setSel.value);
          SB.raster((x, y) => (S.inside(x, y) ? rgbA(v, 'accent', 64) : null), { res: 3, key: 'set|' + S.key });
          chord = mem(S.key, () => chordTest(S.inside, [-4.2, -3.2, 4.2, 3.2]));
          if (showH.value) {
            const hh = memH(S.key, () => { const g = []; for (let x = -4.2; x <= 4.2; x += 0.06) for (let y = -3.2; y <= 3.2; y += 0.06) if (S.inside(x, y)) g.push([x, y]); return hull(g); });
            SB.poly(hh, { fill: false, color: 'muted', width: 1.6, dash: true });
          }
          if (chord.worst && showH.value) SB.segment(chord.worst[0], chord.worst[1], { color: 'red', width: 1.4, alpha: 0.55, dash: true });
          const pq = [[P.x, P.y], [Q.x, Q.y]], rs = runs(S.inside, pq[0], pq[1]);
          let inLen = 0;
          for (const r of rs) {
            const a = [P.x + r.t0 * (Q.x - P.x), P.y + r.t0 * (Q.y - P.y)], b = [P.x + r.t1 * (Q.x - P.x), P.y + r.t1 * (Q.y - P.y)];
            SB.segment(a, b, { color: r.ok ? 'green' : 'red', width: 4 });
            if (r.ok) inLen += r.t1 - r.t0;
          }
          SB.dot(P.x, P.y, { r: 6, color: S.inside(P.x, P.y) ? 'accent' : 'red', label: 'x', labelPos: 'sw' });
          info = { dim, hullN: hl.length, inConv, inAff, inside: inLen, S, endsIn: S.inside(P.x, P.y) && S.inside(Q.x, Q.y) };
        });
        v.readout(() => {
          const { dim, hullN, inConv, inAff, inside, S, endsIn } = info;
          const hullTxt = dim === 2 ? `$\\operatorname{conv}$ has ${hullN} vertices` : dim === 1 ? '$\\operatorname{conv}$ is a segment' : '$\\operatorname{conv}$ is a point';
          const seg = !endsIn ? 'an endpoint is outside $S$, so the test does not apply' : inside > 0.9999 ? 'the whole segment $[x,y]$ lies in $S$' : `only ${v.fix(100 * inside, 0)}% of $[x,y]$ lies in $S$: **not convex**`;
          return `$\\dim\\operatorname{aff}=${dim}$, ${hullTxt}; $z\\in\\operatorname{conv}$: ${inConv ? 'yes' : 'no'}, $z\\in\\operatorname{aff}$: ${inAff ? 'yes' : 'no'}.\n${S.label}: ${seg}. Random chords leaving it: **${chord.bad}** of ${chord.tested}${chord.bad === 0 ? ' (consistent with convex)' : ' (so $S$ is not convex)'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Cones and convex cones',
      statement: String.raw`A set $K\subseteq\R^n$ is a **cone** if $x\in K$ and $\theta\ge0$ imply $\theta x\in K$. It is a **convex cone** if moreover $x,y\in K$ implies $x+y\in K$; equivalently, $K$ contains all **conic combinations** $\theta_1x_1+\dots+\theta_kx_k$ with $\theta_i\ge0$ of its points. The **conic hull** of $S$ is the set of all conic combinations of points of $S$, the smallest convex cone containing $S$. A cone is **pointed** if it contains no line ($x,-x\in K\Rightarrow x=0$). A convex cone is exactly a set that is convex and a cone at the same time.`,
      idea: String.raw`A cone is a union of rays from the origin, so it remembers only directions. Convexity of a cone is the single closure property $x,y\in K\Rightarrow x+y\in K$: for $\theta\in[0,1]$ the combination $\theta x+(1-\theta)y$ is the sum of the two points $\theta x$ and $(1-\theta)y$ of the cone, and conversely $x+y=2\left(\tfrac12x+\tfrac12y\right)$. So a convex cone is the same as a convex set stable under positive scaling (opt-2.1), and the conic hull of finitely many generators is the finitely generated cone one meets in linear programming.`,
      caption: String.raw`Choose what to build from the generators $g_i$ (drag their tips): the **convex cone** they generate, just the **rays** through them (a cone that is not convex), or $\operatorname{conv}\{0,g_i\}$ (convex but not a cone). Drag the test points $x,y$ and the scale $\theta$: for the convex cone, $x+y$ and $\theta x$ never leave it; for the other two you can make one of them leave. In *3D* the cone is spanned by three generators and membership is decided by solving $G\lambda=w$ and checking $\lambda\ge0$.`,
      deps: ['opt-2.1'],
      refs: ['Boyd–Vandenberghe §2.1'],
      tags: ['cone', 'conic hull', 'convex cone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_cone' },
      viz(v) {
        const dimSel = v.select('space', [{ value: '2', label: 'plane' }, { value: '3', label: '3D' }], '2');
        const objSel = v.select('set built from the generators', [{ value: 'cone', label: 'convex cone' }, { value: 'rays', label: 'rays only' }, { value: 'hull', label: 'conv{0, g}' }], 'cone');
        const nG = v.slider('generators', 2, 4, 2, { step: 1, int: true });
        const th = v.slider('scale $\\theta$', 0, 3, 1.4, { step: 0.05 });
        const S2 = v.stage({ x: [-4, 4], y: [-3.2, 3.2], equal: true, axes: false, grid: true, height: 380, title: 'cone in the plane' });
        const g0 = [[2.4, 0.6], [0.5, 2.0], [-1.7, 1.2], [-1.2, -1.6]];
        const G = g0.map((g, i) => S2.handle(g[0], g[1], { color: 'orange', label: 'g' + (i + 1), labelPos: 'n' }));
        const X = S2.handle(1.0, 0.9, { color: 'purple', label: 'x', labelPos: 'ne' });
        const Y = S2.handle(0.4, 1.3, { color: 'teal', label: 'y', labelPos: 'nw' });
        const S3 = v.stage({ x: [-2.2, 2.2], y: [-2, 2.2], equal: true, axes: false, height: 380, title: 'cone in space' });
        const sc = v.scene3(S3, { yaw: -0.7, pitch: 0.3, axis: 1.6, lim: 1.5 });
        const g3 = [[1.1, 0.2, 0.3], [-0.2, 1.1, 0.4], [0.1, -0.1, 1.2]].map((p, i) => sc.handle(p, { color: 'orange', label: 'g' + (i + 1) }));
        const X3 = sc.handle([0.35, 0.35, 0.45], { color: 'purple', label: 'x', labelPos: 'sw' });
        const Y3 = sc.handle([0.2, 0.6, 0.3], { color: 'teal', label: 'y' });
        let info = {};
        const inObj2 = (gens, kind, w) => {
          if (kind === 'cone') return inCone2(gens, w);
          if (kind === 'rays') return Math.hypot(...w) < 1e-9 || gens.some((g) => { const t = dot2(w, g) / dot2(g, g); return t >= -1e-9 && Math.hypot(w[0] - t * g[0], w[1] - t * g[1]) < 0.03; });
          const hl = hull([[0, 0], ...gens]);
          return hl.length >= 3 ? inPoly(w[0], w[1], hl) : Math.hypot(...sub2(w, segClosest(w, hl[0], hl[hl.length - 1]))) < 0.03;
        };
        v.render(() => {
          const is3 = dimSel.value === '3';
          S2.el.style.display = is3 ? 'none' : '';
          S3.el.style.display = is3 ? '' : 'none';
          nG.el.hidden = is3; objSel.el.hidden = is3;
          const kind = objSel.value;
          if (!is3) {
            const k = nG.value;
            G.forEach((g, i) => { g.visible = i < k; });
            const gens = G.slice(0, k).map((g) => [g.x, g.y]);
            const n = 720, flags = [];
            for (let i = 0; i < n; i++) flags.push(inCone2(gens, [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)], 1e-7));
            if (kind === 'cone') {
              const fp = fanPoly(flags, 14);
              if (fp.length) S2.poly(fp, { fill: 'accent', fillAlpha: 0.16, stroke: false });
              // edge rays
              for (let i = 0; i < n; i++) if (flags[i] !== flags[(i + 1) % n]) { const a = (TAU * (flags[i] ? i : i + 1)) / n; S2.line(0, 0, 14 * Math.cos(a), 14 * Math.sin(a), { color: 'accent', width: 2 }); }
            } else if (kind === 'rays') gens.forEach((g) => S2.line(0, 0, 10 * g[0] / len2(g), 10 * g[1] / len2(g), { color: 'accent', width: 3 }));
            else { const hl = hull([[0, 0], ...gens]); if (hl.length >= 3) S2.poly(hl, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 }); }
            gens.forEach((g) => S2.arrow(0, 0, g[0], g[1], { color: 'orange', width: 2.2 }));
            S2.dot(0, 0, { r: 4, color: 'ink' });
            const x = [X.x, X.y], y = [Y.x, Y.y], sum = add2(x, y), tx = [th.value * x[0], th.value * x[1]];
            const ix = inObj2(gens, kind, x), iy = inObj2(gens, kind, y), is = inObj2(gens, kind, sum), it = inObj2(gens, kind, tx);
            S2.segment(x, sum, { color: 'muted', dash: true, width: 1 }); S2.segment(y, sum, { color: 'muted', dash: true, width: 1 });
            S2.arrow(0, 0, sum[0], sum[1], { color: is ? 'green' : 'red', width: 2 });
            S2.dot(sum[0], sum[1], { r: 6, color: is ? 'green' : 'red', label: 'x+y', labelPos: 'ne' });
            S2.dot(tx[0], tx[1], { r: 5, color: it ? 'green' : 'red', hollow: true, label: 'θx', labelPos: 'ne' });
            const wd = coneWidth(gens, 720), ptd = !flags.some((f, i) => f && flags[(i + n / 2) % n]);
            info = { ix, iy, is, it, wd, ptd, kind, d: 2 };
          } else {
            const gens = g3.map((h) => h.p), x = X3.p, y = Y3.p;
            const Gm = [0, 1, 2].map((r) => gens.map((g) => g[r]));
            const lam = (w) => v.M.solve(Gm, w);
            const inC = (w) => { const l = lam(w); return !!l && l.every((t) => t >= -1e-9); };
            const sc3 = 1.7, P = gens.map((g) => g.map((c) => c * sc3));
            sc.begin();
            const det = v.M.det(Gm);
            [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => sc.poly([[0, 0, 0], P[a], P[b]], { fill: 'accent', fillAlpha: 0.12, edge: false }));
            sc.poly(P, { fill: 'accent', fillAlpha: 0.08, edge: false });
            P.forEach((p) => sc.line([0, 0, 0], p, { color: 'accent', width: 1.6 }));
            sc.path(P, { color: 'accent', width: 1.4, close: true });
            gens.forEach((g) => sc.arrow([0, 0, 0], g, { color: 'orange', width: 2.2 }));
            const sum = add3(x, y), tx = x.map((c) => c * th.value);
            const ix = inC(x), iy = inC(y), is = inC(sum), it = inC(tx);
            sc.arrow([0, 0, 0], x, { color: 'purple', width: 2 }); sc.arrow([0, 0, 0], y, { color: 'teal', width: 2 });
            sc.dot(sum, { r: 6, color: is ? 'green' : 'red' });
            sc.dot(tx, { r: 5, color: it ? 'green' : 'red', hollow: true });
            sc.flush();
            info = { ix, iy, is, it, d: 3, det: Math.abs(det) };
          }
        });
        function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
        v.readout(() => {
          const t = (b) => (b ? '✓' : '✗'), I = info;
          if (I.d === 3) return `$x\\in K$ ${t(I.ix)}, $y\\in K$ ${t(I.iy)}; $x+y\\in K$ ${t(I.is)}, $\\theta x\\in K$ ${t(I.it)}. The three generators have $|\\det G|=${v.fix(I.det, 2)}$ (the cone is solid when this is not 0).\nGreen = inside, red = outside the cone; a convex cone is closed under both sums and nonnegative scalings.`;
          const what = I.kind === 'cone' ? `opening angle ${v.fix(I.wd * 360, 0)}°, ${I.ptd ? 'pointed' : 'contains a line'}` : I.kind === 'rays' ? 'a union of rays: a cone, not convex' : 'convex but not a cone: not closed under scaling';
          return `$x\\in K$ ${t(I.ix)}, $y\\in K$ ${t(I.iy)}; $x+y\\in K$ ${t(I.is)}, $\\theta x\\in K$ ${t(I.it)}. ${what}.\nFor the convex cone, $x,y\\in K$ always give ✓✓; with *rays only* a sum leaves the set, with $\\operatorname{conv}\\{0,g\\}$ scaling leaves it.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Halfspaces, balls, ellipsoids and polyhedra',
      statement: String.raw`The basic convex sets of $\R^n$ are
(a) a **hyperplane** $\{x:a^\top x=b\}$ and the **halfspace** $\{x:a^\top x\le b\}$, $a\ne0$;
(b) a **Euclidean ball** $B(x_c,r)=\{x:\norm{x-x_c}_2\le r\}$ — indeed every norm ball $\{x:\norm{x-x_c}\le r\}$;
(c) an **ellipsoid** $\{x:(x-x_c)^\top P^{-1}(x-x_c)\le1\}$ with $P\in\mathbb S^n_{++}$ (symmetric positive definite), whose semi-axes are $\sqrt{\lambda_i(P)}$ along the eigenvectors of $P$;
(d) a **polyhedron** $\{x:Ax\preceq b,\ Cx=d\}$, a finite intersection of halfspaces and hyperplanes, and a **polytope** if it is bounded.
All of them are convex.`,
      idea: String.raw`Each is a sublevel set of a convex function or an intersection of such: a halfspace is $\{\ell\le b\}$ for the affine function $\ell(x)=a^\top x$, a norm ball is a sublevel set of $\norm{x-x_c}$ whose convexity is the triangle inequality plus homogeneity, an ellipsoid is $\{\norm{P^{-1/2}(x-x_c)}_2\le1\}$, the image of the unit ball under the affine map $u\mapsto x_c+P^{1/2}u$, and a polyhedron is an intersection of halfspaces. The segment test is then one line each: if $x,y$ satisfy the defining inequalities, so does $\theta x+(1-\theta)y$, because the left sides are convex in $x$. Positive definiteness is exactly what is needed: for indefinite $P^{-1}$ the same formula describes the region between hyperbola branches.`,
      caption: String.raw`Pick a shape. **Ball:** drag the centre and radius handles and change the exponent $p$ of the $\ell_p$ "ball": for $p\ge1$ (a norm) it is convex, for $p<1$ it is a pinched star that fails the test. **Ellipsoid:** edit the entries of $A=P^{-1}$; positive definite gives an ellipse with its semi-axes drawn, indefinite $A$ (a negative eigenvalue) gives the region beyond a hyperbola. **Polyhedron:** drag each boundary point and the tip of its normal vector, and add halfspaces with $k$. The readout reports the 1400-chord convexity test on exactly the set you see.`,
      deps: ['opt-2.1', 'ladr-7.62'],
      refs: ['Boyd–Vandenberghe §2.2'],
      tags: ['halfspace', 'ellipsoid', 'polyhedron'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polyhedron' },
      viz(v) {
        const shape = v.select('shape', [{ value: 'half', label: 'halfspace' }, { value: 'ball', label: 'ball' }, { value: 'ell', label: 'ellipsoid' }, { value: 'poly', label: 'polyhedron' }], 'poly');
        const pS = v.slider('ball exponent $p$', 0.4, 4, 2, { step: 0.05 });
        const q11 = v.slider('$A_{11}$', -0.6, 2.5, 0.8, { step: 0.05 });
        const q12 = v.slider('$A_{12}$', -1.5, 1.5, 0.35, { step: 0.05 });
        const q22 = v.slider('$A_{22}$', -0.6, 2.5, 0.35, { step: 0.05 });
        const kS = v.slider('halfspaces $k$', 2, 6, 5, { step: 1, int: true });
        const view = { x: [-5, 5], y: [-3.8, 3.8] };
        const s = v.stage({ ...view, equal: true, axes: false, grid: true, height: 420, title: 'convex sets and the chord test' });
        const C = s.handle(0.2, 0.1, { color: 'orange', label: 'c', labelPos: 'n' });
        const R = s.handle(2.2, 0.1, { color: 'accent', label: 'r', labelPos: 'ne' });
        const cons = [];
        for (let i = 0; i < 6; i++) {
          const ang0 = (TAU * i) / 6 + 0.3;
          const st = { ang: ang0 };
          st.a = s.handle(2.0 * Math.cos(ang0), 1.7 * Math.sin(ang0), { color: 'accent', r: 5.5 });
          st.t = s.handle(st.a.x + 0.9 * Math.cos(ang0), st.a.y + 0.9 * Math.sin(ang0), {
            color: 'orange', r: 5,
            constrain: (x, y) => { const dx = x - st.a.x, dy = y - st.a.y, l = Math.hypot(dx, dy) || 1; st.ang = Math.atan2(dy, dx); return [st.a.x + (0.9 * dx) / l, st.a.y + (0.9 * dy) / l]; },
          });
          st.a.onDrag = () => st.t.set(st.a.x + 0.9 * Math.cos(st.ang), st.a.y + 0.9 * Math.sin(st.ang));
          cons.push(st);
        }
        const mem = memo();
        let info = {};
        v.render(() => {
          const sh = shape.value;
          pS.el.hidden = sh !== 'ball'; [q11, q12, q22].forEach((c) => { c.el.hidden = sh !== 'ell'; }); kS.el.hidden = sh !== 'poly';
          C.visible = sh === 'ball' || sh === 'ell'; R.visible = sh === 'ball';
          const k = sh === 'half' ? 1 : kS.value;
          cons.forEach((c, i) => { c.a.visible = (sh === 'half' || sh === 'poly') && i < k; c.t.visible = c.a.visible; });
          let inside, key, label;
          const hsl = cons.slice(0, k).map((c) => ({ nx: Math.cos(c.ang), ny: Math.sin(c.ang), c: Math.cos(c.ang) * c.a.x + Math.sin(c.ang) * c.a.y }));
          if (sh === 'ball') {
            const r = Math.max(0.05, Math.hypot(R.x - C.x, R.y - C.y)), p = pS.value, cx = C.x, cy = C.y;
            inside = (x, y) => (Math.abs(x - cx) ** p + Math.abs(y - cy) ** p) ** (1 / p) <= r;
            key = ['ball', cx, cy, r, p].map((t) => (typeof t === 'number' ? t.toFixed(3) : t)).join('|');
            label = `$\\ell_{${v.fix(p, 2)}}$-ball of radius ${v.fix(r, 2)}: ${p >= 1 ? 'a norm ball' : '$\\sum|x_i|^p$ with $p<1$ is not a norm'}`;
          } else if (sh === 'ell') {
            const a = q11.value, b = q12.value, d = q22.value, cx = C.x, cy = C.y;
            inside = (x, y) => { const u = x - cx, w = y - cy; return a * u * u + 2 * b * u * w + d * w * w <= 1; };
            const ev = v.M.eigSym2([[a, b], [b, d]]).values;
            key = ['ell', a, b, d, cx, cy].map((t) => (typeof t === 'number' ? t.toFixed(3) : t)).join('|');
            label = ev[1] > 1e-9 ? `$A=P^{-1}$ has eigenvalues $${v.fix(ev[0], 2)},\\,${v.fix(ev[1], 2)}$: positive definite, semi-axes $${v.fix(1 / Math.sqrt(ev[0]), 2)}$ and $${v.fix(1 / Math.sqrt(ev[1]), 2)}$` : `$A$ has eigenvalues $${v.fix(ev[0], 2)},\\,${v.fix(ev[1], 2)}$: **not positive semidefinite**`;
            info.ev = ev;
          } else {
            const poly = polyhedron(hsl, boxPoly(-9, -9, 9, 9));
            inside = (x, y) => hsl.every((h) => h.nx * x + h.ny * y <= h.c + 1e-12);
            key = 'poly|' + hsl.map((h) => h.nx.toFixed(3) + h.ny.toFixed(3) + h.c.toFixed(3)).join('|');
            const bounded = poly.length > 0 && poly.every((p) => Math.abs(p[0]) < 8.9 && Math.abs(p[1]) < 8.9);
            label = sh === 'half' ? `halfspace $\\{a^\\top x\\le b\\}$ with $a=(${v.fix(hsl[0].nx, 2)},${v.fix(hsl[0].ny, 2)})$, $b=${v.fix(hsl[0].c, 2)}$` : poly.length === 0 ? 'empty polyhedron' : `polyhedron $\\{Ax\\preceq b\\}$ with ${k} inequalities: ${bounded ? 'a polytope with ' + poly.length + ' vertices' : 'unbounded'}`;
            s.raster((x, y) => (inside(x, y) ? rgbA(v, 'accent', 64) : null), { res: 3, key });
            if (poly.length >= 3) s.clip(() => s.poly(poly, { fill: false, color: 'accent', width: 2.2 }));
            hsl.forEach((h, i) => { const c = cons[i]; s.arrow(c.a.x, c.a.y, c.a.x + 0.9 * h.nx, c.a.y + 0.9 * h.ny, { color: 'orange', width: 2 }); s.clip(() => s.line(c.a.x - 14 * h.ny, c.a.y + 14 * h.nx, c.a.x + 14 * h.ny, c.a.y - 14 * h.nx, { color: 'muted', width: 1, dash: true })); });
          }
          if (sh === 'ball' || sh === 'ell') {
            s.raster((x, y) => (inside(x, y) ? rgbA(v, 'accent', 64) : null), { res: 2, key });
            if (sh === 'ell' && info.ev[1] > 1e-9) {
              const E = v.M.eigSym2([[q11.value, q12.value], [q12.value, q22.value]]);
              [0, 1].forEach((i) => { const L = 1 / Math.sqrt(E.values[i]), u = E.vectors[i]; s.segment([C.x - L * u[0], C.y - L * u[1]], [C.x + L * u[0], C.y + L * u[1]], { color: 'green', width: 1.8 }); });
            }
          }
          const ch = mem(key, () => chordTest(inside, [-5, -3.8, 5, 3.8]));
          if (ch.worst) s.segment(ch.worst[0], ch.worst[1], { color: 'red', width: 2, dash: true });
          info = { ...info, label, ch, sh };
        });
        v.readout(() => {
          const { label, ch } = info;
          return `${label}.\nChord test: **${ch.bad}** of ${ch.tested} random chords leave the set${ch.bad ? ' (the longest is dashed red): not convex' : ': convex'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'The positive semidefinite cone',
      statement: String.raw`Let $\mathbb S^n$ be the space of symmetric $n\times n$ matrices with the inner product $\langle X,Y\rangle=\tr(XY)$. The **positive semidefinite cone** is $\mathbb S^n_+=\{X\in\mathbb S^n:\ z^\top Xz\ge0\ \text{for all }z\}$, the set of matrices with all eigenvalues $\ge0$, and $\mathbb S^n_{++}$, the positive definite matrices, is its interior. $\mathbb S^n_+$ is a closed, pointed, convex cone with nonempty interior. For $n=2$, $\begin{pmatrix}x&y\\y&z\end{pmatrix}\succeq0$ iff $x\ge0$, $z\ge0$ and $xz\ge y^2$.`,
      idea: String.raw`For each fixed $z$ the condition $z^\top Xz\ge0$ is a linear inequality in $X$, so $\mathbb S^n_+$ is an intersection of (infinitely many) halfspaces through the origin, hence a closed convex cone (opt-2.2, opt-2.3); it is pointed because $X,-X\succeq0$ forces all eigenvalues zero. In $2\times2$ coordinates $a=\tfrac{x+z}2$, $d=\tfrac{x-z}2$ the eigenvalues are $a\pm\sqrt{d^2+y^2}$, so the cone is exactly $\{a\ge\sqrt{d^2+y^2}\}$: a right circular cone with a $45^\circ$ half-angle, the "ice-cream cone". Its slices $a=\text{const}$ are discs, which is why a $2\times 2$ density matrix lives in a ball.`,
      caption: String.raw`The point $X=\begin{pmatrix}a+d&y\\y&a-d\end{pmatrix}$ is the draggable handle, plotted in the orthonormal coordinates $(d,y,a)$ (scaled so that Frobenius distance is Euclidean). The cone surface is the set of singular PSD matrices ($\det X=0$). The handle's ring is green inside the cone and red outside, and the bars show its two eigenvalues: they change sign exactly when the point crosses the surface. Move the slicing plane $\operatorname{tr}X/2=a$: the section is a disc of radius $a$.`,
      deps: ['opt-2.2', 'ladr-7.38'],
      refs: ['Boyd–Vandenberghe §2.2'],
      tags: ['positive semidefinite', 'matrix cone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Definite_matrix' },
      viz(v) {
        const sl = v.slider('slice $a=\\operatorname{tr}X/2$', 0.2, 1.4, 0.8, { step: 0.02 });
        const S3 = v.stage({ x: [-2.1, 2.1], y: [-1.9, 2.1], equal: true, axes: false, height: 400, title: 'symmetric 2×2 matrices (d, y, a)' });
        const sc = v.scene3(S3, { yaw: -0.55, pitch: 0.32, axis: 1.5, lim: 1.5, labels: ['d', 'y', 'a'] });
        const X = sc.handle([0.35, 0.25, 0.8], { color: 'purple', label: 'X' });
        const E = v.stage({ x: [0.3, 2.7], y: [-2, 3], axes: 'box', gutter: true, height: 400, ylabel: 'eigenvalue', title: 'eigenvalues of X', xticks: [[1, 'λ₁'], [2, 'λ₂']] });
        let info = {};
        v.render(() => {
          const [d, y, a] = X.p, H = 1.45;
          sc.begin();
          const N = 48, ring = (r, h) => Array.from({ length: N }, (_, i) => [r * Math.cos((TAU * i) / N), r * Math.sin((TAU * i) / N), h]);
          const R = ring(H, H);
          for (let i = 0; i < N; i++) sc.poly([[0, 0, 0], R[i], R[(i + 1) % N]], { fill: 'accent', fillAlpha: 0.075, edge: false });
          sc.path(R, { color: 'accent', width: 1.6, close: true });
          for (let i = 0; i < N; i += 6) sc.line([0, 0, 0], R[i], { color: 'accent', width: 0.8, alpha: 0.5 });
          sc.disc([1, 0, 0], [0, 1, 0], sl.value, { fill: 'orange', fillAlpha: 0.22, color: 'orange', grid: true }, [0, 0, sl.value]);
          const x = a + d, z = a - d, M2 = [[x, y], [y, z]], ev = v.M.eigSym2(M2).values;
          let qmin = Infinity;
          for (let i = 0; i < 360; i++) { const t = (TAU * i) / 360, c = Math.cos(t), s = Math.sin(t); qmin = Math.min(qmin, x * c * c + 2 * y * c * s + z * s * s); }
          const psd = ev[1] >= -1e-9;
          sc.dot(X.p, { r: 10, color: psd ? 'green' : 'red', hollow: true });
          sc.arrow([0, 0, 0], X.p, { color: 'purple', width: 1.6, alpha: 0.7 });
          sc.flush();
          E.bars([ev[0], ev[1]], { x0: 1, dx: 1, color: (val) => (val >= 0 ? 'green' : 'red') });
          E.hline(0, { color: 'ink', width: 1.4 });
          info = { x, y, z, ev, psd, qmin, syl: x >= 0 && z >= 0 && x * z >= y * y - 1e-12 };
        });
        v.readout(() => {
          const { x, y, z, ev, psd, qmin, syl } = info;
          return `$X=\\begin{pmatrix}${v.fix(x, 2)}&${v.fix(y, 2)}\\\\${v.fix(y, 2)}&${v.fix(z, 2)}\\end{pmatrix}$, eigenvalues $${v.fix(ev[0], 3)}$ and $${v.fix(ev[1], 3)}$: **${psd ? 'positive semidefinite' : 'not PSD'}**.\n$\\min_{|z|=1}z^\\top Xz=${v.fix(qmin, 3)}$ (sampled; equals $\\lambda_{\\min}$); the test $x\\ge0,\\ z\\ge0,\\ xz\\ge y^2$ says ${syl ? 'PSD' : 'not PSD'}: ${syl === psd ? 'the two tests agree' : 'rounding at the boundary'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Operations that preserve convexity',
      statement: String.raw`Let $C,D\subseteq\R^n$ be convex.
(a) **Intersection:** $C\cap D$ is convex (for any family, finite or not).
(b) **Affine maps:** if $f(x)=Mx+t$, then the image $f(C)$ and the preimage $f^{-1}(E)$ of a convex set $E$ are convex; so are $C+D$ and $\alpha C$.
(c) **Perspective:** $P(x,t)=x/t$ on $\R^n\times\R_{++}$ maps convex sets to convex sets, and so do preimages of convex sets under $P$; linear-fractional maps $x\mapsto(Ax+b)/(c^\top x+d)$ on $\{c^\top x+d>0\}$ likewise.
Union does **not** preserve convexity: two convex sets can have a non-convex union.`,
      idea: String.raw`(a) A segment between two points of $C\cap D$ lies in $C$ and in $D$. (b) $f(\theta x+(1-\theta)y)=\theta f(x)+(1-\theta)f(y)$ because $f$ is affine, so a segment maps onto a segment, and a preimage inherits segments through the same identity. (c) The perspective of a segment $[(x_1,t_1),(x_2,t_2)]$ is the segment between $x_1/t_1$ and $x_2/t_2$, traversed at a non-uniform speed: the point $\theta x_1+(1-\theta)x_2$ over $\theta t_1+(1-\theta)t_2$ equals $\mu x_1/t_1+(1-\mu)x_2/t_2$ with $\mu=\theta t_1/(\theta t_1+(1-\theta)t_2)\in[0,1]$. A union fails because the segment between points of different pieces can leave both.`,
      caption: String.raw`Choose an operation. **Intersection / union:** drag the disc and the quadrilateral: the chord test passes for $C\cap D$ and fails for $C\cup D$ once the pieces are apart (the longest bad chord is dashed). **Image:** the quadrilateral and the disc are mapped by $x\mapsto Mx$ with $M=R(\theta)\begin{pmatrix}s_x&h\\0&s_y\end{pmatrix}$ (dashed: the originals); the tested set is the image of $C\cap D$, and it stays convex for every $M$. **Perspective:** the polygon lives at heights $t>0$; every point is projected through the origin to the line $t=1$, and the image is an interval; the gold wedge is the preimage of the interval between the two green handles.`,
      deps: ['opt-2.1'],
      refs: ['Boyd–Vandenberghe §2.3'],
      tags: ['convexity', 'perspective', 'intersection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_set#Properties' },
      viz(v) {
        const op = v.select('operation', [{ value: 'cap', label: 'intersection' }, { value: 'cup', label: 'union' }, { value: 'img', label: 'affine image' }, { value: 'per', label: 'perspective' }], 'cap');
        const th = v.slider('rotation $\\theta$', -180, 180, 30, { step: 1 });
        const sx = v.slider('$s_x$', 0.3, 2, 1.4, { step: 0.05 });
        const sy = v.slider('$s_y$', 0.3, 2, 0.7, { step: 0.05 });
        const sh = v.slider('shear $h$', -1.5, 1.5, 0.5, { step: 0.05 });
        const view = { x: [-4.6, 4.6], y: [-3.4, 3.4] };
        const s = v.stage({ ...view, equal: true, axes: false, grid: true, height: 420, title: 'two convex sets and an operation' });
        const Ac = s.handle(-1.3, 0.3, { color: 'blue', label: 'C', labelPos: 'n' });
        const Ar = s.handle(0.4, 0.3, { color: 'blue', r: 5 });
        const Bh = [[-0.4, -1.4], [2.6, -1.0], [2.9, 1.3], [0.2, 1.6]].map((p, i) => s.handle(p[0], p[1], { color: 'orange', r: 5.5, label: i ? undefined : 'D', labelPos: 'sw' }));
        const Ph = [[-1.8, 1.0], [-0.2, 0.8], [0.6, 2.6], [-1.3, 3.1]].map((p, i) => s.handle(p[0], p[1], { color: 'orange', r: 5.5, constrain: (x, y) => [x, Math.max(y, 0.35)], label: i ? undefined : 'D', labelPos: 'sw' }));
        const U1 = s.handle(-0.8, 1, { color: 'green', label: 'u₁', labelPos: 'nw', constrain: (x) => [x, 1] });
        const U2 = s.handle(1.9, 1, { color: 'green', label: 'u₂', labelPos: 'ne', constrain: (x) => [x, 1] });
        const mem = memo();
        let info = {};
        v.render(() => {
          const o = op.value, per = o === 'per', img = o === 'img';
          [th, sx, sy, sh].forEach((c) => { c.el.hidden = !img; });
          [Ac, Ar, ...Bh].forEach((h) => { h.visible = !per; }); [...Ph, U1, U2].forEach((h) => { h.visible = per; });
          s.setView(per ? [-4.6, 4.6] : view.x, per ? [-0.7, 5.9] : view.y);
          if (!per) {
            const rad = Math.max(0.1, Math.hypot(Ar.x - Ac.x, Ar.y - Ac.y)), poly = hull(Bh.map((h) => [h.x, h.y]));
            const inC = (x, y) => (x - Ac.x) ** 2 + (y - Ac.y) ** 2 <= rad * rad, inD = (x, y) => inPoly(x, y, poly);
            let inside, key, box = [-4.6, -3.4, 4.6, 3.4];
            if (img) {
              const t = (th.value * Math.PI) / 180, c = Math.cos(t), sn = Math.sin(t);
              const Mx = [[c * sx.value, c * sh.value - sn * sy.value], [sn * sx.value, sn * sh.value + c * sy.value]];
              const Mi = v.M.inverse(Mx);
              const preIn = (x, y) => { const u = Mi[0][0] * x + Mi[0][1] * y, w = Mi[1][0] * x + Mi[1][1] * y; return inC(u, w) || inD(u, w); };
              // image of C and D separately, drawn exactly
              const imgPts = (pts) => pts.map((p) => [Mx[0][0] * p[0] + Mx[0][1] * p[1], Mx[1][0] * p[0] + Mx[1][1] * p[1]]);
              const circ = Array.from({ length: 120 }, (_, i) => [Ac.x + rad * Math.cos((TAU * i) / 120), Ac.y + rad * Math.sin((TAU * i) / 120)]);
              s.poly(circ, { fill: false, color: 'muted', width: 1, dash: true }); s.poly(poly, { fill: false, color: 'muted', width: 1, dash: true });
              s.poly(imgPts(circ), { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 2 }); s.poly(imgPts(poly), { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 2 });
              // the image of the intersection is convex: test it
              const preBoth = (x, y) => { const u = Mi[0][0] * x + Mi[0][1] * y, w = Mi[1][0] * x + Mi[1][1] * y; return inC(u, w) && inD(u, w); };
              inside = preBoth; box = [-4.6, -3.4, 4.6, 3.4];
              key = 'img|' + [Ac.x, Ac.y, rad, th.value, sx.value, sy.value, sh.value, ...Bh.flatMap((h) => [h.x, h.y])].map((x) => (+x).toFixed(3)).join(',');
              info = { o, det: v.fix(Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0], 2), pre: preIn(0, 0) };
            } else {
              inside = o === 'cap' ? (x, y) => inC(x, y) && inD(x, y) : (x, y) => inC(x, y) || inD(x, y);
              key = o + '|' + [Ac.x, Ac.y, rad, ...Bh.flatMap((h) => [h.x, h.y])].map((x) => x.toFixed(3)).join(',');
              s.raster((x, y) => { const a = inC(x, y), b = inD(x, y); return o === 'cap' ? (a && b ? rgbA(v, 'green', 110) : a ? rgbA(v, 'blue', 40) : b ? rgbA(v, 'orange', 40) : null) : a || b ? rgbA(v, a && b ? 'purple' : a ? 'blue' : 'orange', 80) : null; }, { res: 3, key: 'ras|' + key });
              const circ = Array.from({ length: 120 }, (_, i) => [Ac.x + rad * Math.cos((TAU * i) / 120), Ac.y + rad * Math.sin((TAU * i) / 120)]);
              s.poly(circ, { fill: false, color: 'blue', width: 1.6 }); s.poly(poly, { fill: false, color: 'orange', width: 1.6 });
            }
            const ch = mem(key, () => chordTest(inside, box));
            if (ch.worst) s.segment(ch.worst[0], ch.worst[1], { color: 'red', width: 2.2, dash: true });
            info = { ...info, o, ch };
          } else {
            const poly = hull(Ph.map((h) => [h.x, h.y])), us = [U1.x, U2.x].sort((a, b) => a - b);
            s.hline(0, { color: 'faint' }); s.vline(0, { color: 'faint' }); s.hline(1, { color: 'green', width: 1.6 });
            s.tex('t=1', 4.0, 1.2, { color: 'green', size: 13 }); s.dot(0, 0, { r: 4, color: 'ink', label: 'O', labelPos: 'sw' });
            // preimage wedge {u1 <= x/t <= u2}
            s.poly([[0, 0], [us[0] * 6, 6], [us[1] * 6, 6]], { fill: 'gold', fillAlpha: 0.13, stroke: false });
            s.line(0, 0, us[0] * 6, 6, { color: 'gold', width: 1 }); s.line(0, 0, us[1] * 6, 6, { color: 'gold', width: 1 });
            s.poly(poly, { fill: 'orange', fillAlpha: 0.24, color: 'orange', width: 2 });
            const vs = poly.map((p) => p[0] / p[1]), lo = Math.min(...vs), hi = Math.max(...vs);
            poly.forEach((p) => s.line(0, 0, p[0], p[1], { color: 'muted', width: 0.8, alpha: 0.6, dash: true }));
            const r = mulberry(11); let okAll = true, cnt = 0;
            for (let i = 0; i < 400 && cnt < 40; i++) {
              const x = -4 + 8 * r(), t = 0.3 + 5.6 * r();
              if (!inPoly(x, t, poly)) continue; cnt++;
              const u = x / t; if (u < lo - 1e-9 || u > hi + 1e-9) okAll = false;
              s.dot(x, t, { r: 2, color: 'orange', alpha: 0.7 }); s.dot(u, 1, { r: 2.5, color: 'accent' });
            }
            s.segment([lo, 1], [hi, 1], { color: 'accent', width: 5 });
            info = { o, lo, hi, okAll, cnt, us };
          }
        });
        v.readout(() => {
          const I = info;
          if (I.o === 'per') return `The perspective image $P(D)=\\{x/t\\}$ of the polygon is the interval $[${v.fix(I.lo, 3)},\\,${v.fix(I.hi, 3)}]$ (from its vertices); ${I.cnt} sampled interior points all project into it: **${I.okAll ? '✓' : '✗'}**. Preimage of $[u_1,u_2]=[${v.fix(I.us[0], 2)},${v.fix(I.us[1], 2)}]$ is the convex wedge in gold.`;
          const head = I.o === 'cap' ? '$C\\cap D$' : I.o === 'cup' ? '$C\\cup D$' : 'the image of $C\\cap D$ under $M$ (determinant ' + I.det + ')';
          return `${head}: **${I.ch.bad}** of ${I.ch.tested} random chords leave the set${I.ch.m < 12 ? ' (set empty or too small to test)' : I.ch.bad ? ': **not convex**' + (I.o === 'cup' ? ' (separate the two pieces)' : '') : ': convex'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'Proper cones and generalized inequalities',
      statement: String.raw`A convex cone $K\subseteq\R^n$ is **proper** if it is closed, has nonempty interior (**solid**) and is pointed. A proper cone defines a **generalized inequality**
$$x\preceq_Ky\iff y-x\in K,\qquad x\prec_Ky\iff y-x\in\operatorname{int}K,$$
a partial order that is reflexive, antisymmetric, transitive and compatible with addition and nonnegative scaling. It is in general only a *partial* order: $x,y$ may be incomparable. Examples: $\R^n_+$ (componentwise order), the second-order cone, $\mathbb S^n_+$ (the matrix order $X\preceq Y$). In a set $S$, $x$ is the **minimum element** if $x\preceq_Ky$ for all $y\in S$, and **minimal** if $y\preceq_Kx$ and $y\in S$ imply $y=x$.`,
      idea: String.raw`The four defining properties of a proper cone are exactly what makes $\preceq_K$ an order: convex cone gives transitivity and compatibility with sums and scalings ($y-x,z-y\in K\Rightarrow z-x\in K$), pointedness gives antisymmetry ($y-x,x-y\in K\Rightarrow x=y$), and being solid and closed makes the strict order and limits behave. Generalizing $\R_+$ to a cone makes the order partial: the points $y$ with $x\preceq_Ky$ form the translated cone $x+K$, and everything outside $(x+K)\cup(x-K)$ is incomparable with $x$. For $K=\R^n_+$ the minimal elements of a set are its Pareto-optimal points, which need not include a minimum element.`,
      caption: String.raw`The cone $K=\{r(\cos\varphi,\sin\varphi):|\varphi-\beta|\le\alpha\}$ has half-angle $\alpha$ and axis $\beta$ (drag the green axis handle, or press a preset). Move $x$ and $y$: the plane is split into the green set above $x$ ($x+K$), the blue set below ($x-K$) and the unshaded incomparable set. Turn on the eight points: gold rings mark the $K$-minimal elements (none of the others lies below them). Push $\alpha$ to $90^\circ$ (a halfspace, not pointed) and beyond (not even convex) to see the properties fail one by one.`,
      deps: ['opt-2.2'],
      refs: ['Boyd–Vandenberghe §2.4'],
      tags: ['proper cone', 'partial order', 'generalized inequality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Generalized_inequality' },
      viz(v) {
        const aS = v.slider('half-angle $\\alpha$ (°)', 5, 120, 45, { step: 1 });
        const showPts = v.toggle('eight points: minimal elements', true);
        const s = v.stage({ x: [-4.4, 4.4], y: [-3.4, 3.4], equal: true, axes: false, grid: true, height: 420, title: 'x ⪯_K y  ⇔  y − x ∈ K' });
        let beta = Math.PI / 4;
        const Ax = s.handle(Math.cos(beta) * 1.3, Math.sin(beta) * 1.3, {
          color: 'green',
          constrain: (x, y) => { beta = Math.atan2(y, x); return [1.3 * Math.cos(beta), 1.3 * Math.sin(beta)]; },
        });
        const X = s.handle(-1.4, -0.6, { color: 'purple', label: 'x', labelPos: 'sw' });
        const Y = s.handle(1.2, 1.5, { color: 'teal', label: 'y', labelPos: 'ne' });
        v.button('orthant ℝ²₊', () => { beta = Math.PI / 4; Ax.set(1.3 * Math.cos(beta), 1.3 * Math.sin(beta)); aS.set(45); });
        v.button('second-order cone', () => { beta = Math.PI / 2; Ax.set(0, 1.3); aS.set(45); });
        v.button('narrow wedge', () => { beta = 0.3; Ax.set(1.3 * Math.cos(beta), 1.3 * Math.sin(beta)); aS.set(18); });
        const PTS = [[-2.8, 1.6], [-1.6, -0.2], [-0.4, -1.5], [0.9, -2.3], [1.0, 0.4], [2.2, -0.9], [-1.0, 1.9], [2.6, 1.8]];
        let info = {};
        v.render(() => {
          const al = (aS.value * Math.PI) / 180;
          const inK = (dx, dy) => { const r = Math.hypot(dx, dy); if (r < 1e-9) return true; let d = Math.atan2(dy, dx) - beta; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) <= al + 1e-12; };
          const x = [X.x, X.y], y = [Y.x, Y.y];
          s.raster((px, py) => (inK(px - x[0], py - x[1]) ? rgbA(v, 'green', 70) : inK(x[0] - px, x[1] - py) ? rgbA(v, 'blue', 60) : null), { res: 3, key: [x[0].toFixed(3), x[1].toFixed(3), aS.value, beta.toFixed(3)].join('|') });
          // cone boundary rays from x, and the cone at the origin as dashed
          for (const sg of [-1, 1]) { const a = beta + sg * al; s.line(x[0], x[1], x[0] + 12 * Math.cos(a), x[1] + 12 * Math.sin(a), { color: 'green', width: 1.8 }); s.line(x[0], x[1], x[0] - 12 * Math.cos(a), x[1] - 12 * Math.sin(a), { color: 'blue', width: 1.8 }); s.line(0, 0, 3 * Math.cos(a), 3 * Math.sin(a), { color: 'muted', width: 1, dash: true }); }
          s.dot(0, 0, { r: 3.5, color: 'muted' }); s.tex('K', 2.1 * Math.cos(beta), 2.1 * Math.sin(beta), { color: 'muted', size: 14 });
          const up = inK(y[0] - x[0], y[1] - x[1]), dn = inK(x[0] - y[0], x[1] - y[1]);
          s.arrow(x[0], x[1], y[0], y[1], { color: up ? 'green' : dn ? 'blue' : 'red', width: 2.2 });
          let minimal = [];
          if (showPts.value) {
            PTS.forEach((p, i) => { const dom = PTS.some((q, j) => j !== i && inK(p[0] - q[0], p[1] - q[1])); if (!dom) minimal.push(i); });
            PTS.forEach((p, i) => { const m = minimal.includes(i); s.dot(p[0], p[1], { r: 5, color: m ? 'gold' : 'muted' }); if (m) s.dot(p[0], p[1], { r: 10, hollow: true, color: 'gold' }); });
          }
          const closed = true, solid = true, convex = al <= Math.PI / 2 + 1e-9, pointed = al < Math.PI / 2 - 1e-9;
          const minElt = showPts.value ? PTS.findIndex((p, i) => PTS.every((q, j) => j === i || inK(q[0] - p[0], q[1] - p[1]))) : -1;
          info = { up, dn, convex, pointed, closed, solid, nmin: minimal.length, minElt, deg: aS.value };
        });
        v.readout(() => {
          const { up, dn, convex, pointed, nmin, minElt, deg } = info;
          const rel = up && dn ? '$x=y$' : up ? '$x\\preceq_Ky$' : dn ? '$y\\preceq_Kx$' : '**incomparable**';
          const proper = convex && pointed ? '$K$ is a proper cone' : !convex ? '$K$ is **not convex** ($\\alpha>90^\\circ$): no order' : '$K$ is a halfspace: **not pointed**, so antisymmetry fails';
          return `$\\alpha=${deg}^\\circ$: ${proper}. Relation of $x$ and $y$: ${rel}.${nmin || minElt >= 0 ? `\nOf the eight points, ${nmin} are $K$-minimal${minElt >= 0 ? `; point ${minElt + 1} is a minimum element (below all others)` : '; there is no minimum element'}.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Separating hyperplane theorem',
      statement: String.raw`Let $C,D\subseteq\R^n$ be nonempty convex sets with $C\cap D=\emptyset$. Then there exist $a\ne0$ and $b$ with $a^\top x\le b$ for all $x\in C$ and $a^\top x\ge b$ for all $x\in D$: the hyperplane $\{a^\top x=b\}$ **separates** $C$ and $D$. If $C$ is closed, $D$ is compact and they are disjoint, the separation can be made **strict**: $a^\top x<b<a^\top y$ for $x\in C$, $y\in D$. Disjointness alone does not give strict separation (two closed sets, such as a halfplane and the region above a hyperbola branch, can have distance $0$), and without convexity separation can fail.`,
      idea: String.raw`In the strict case take the closest pair $c^\star\in C$, $d^\star\in D$ (it exists by compactness and is unique, see opt-2.11) and use the perpendicular bisector: $a=d^\star-c^\star$, $b=\tfrac12(\norm{d^\star}^2-\norm{c^\star}^2)$. The variational inequality of the projection (opt-2.11) shows that all of $C$ lies on one side and all of $D$ on the other. Equivalently, the difference set $C-D$ is convex and misses $0$, so $0$ is separated from it by the hyperplane perpendicular to its closest point to $0$. The general case follows by approximating $C$ and $D$ by compact convex subsets and passing to a limit of unit normals (or by Hahn–Banach, fa-3.4).`,
      caption: String.raw`**Left:** drag the vertices of the two convex polygons $C$ (blue) and $D$ (orange). The closest pair is found exactly; the green line is the perpendicular bisector. **Right:** the difference set $C-D$ with the origin and its closest point $u$: the segment from $0$ to $u$ is the normal. Move the sets until they overlap and $0$ enters $C-D$: no line separates them. Switch $D$ to the **C-shaped** non-convex set and press *interlock*: $C$ sits in the cup of $D$, the two sets are disjoint, yet a search of 720 directions finds none that separates (and $0\in\operatorname{conv}(C-D)$ while $0\notin C-D$).`,
      credit: 'Minkowski, from 1896 (supporting and separating hyperplanes of convex bodies)',
      deps: ['opt-2.1', 'fa-3.4', 'rca-4.10'],
      refs: ['Boyd–Vandenberghe §2.5'],
      tags: ['separation', 'hyperplane', 'duality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hyperplane_separation_theorem' },
      viz(v) {
        const dSel = v.select('set $D$', [{ value: 'cvx', label: 'convex polygon' }, { value: 'c', label: 'C-shaped (non-convex)' }], 'cvx');
        const view = { x: [-5, 5], y: [-3.6, 3.6] };
        const L = v.stage({ ...view, equal: true, axes: false, grid: true, height: 400, title: 'two sets and a separating line' });
        const Rg = v.stage({ x: [-9, 9], y: [-6, 6], equal: true, axes: false, grid: true, height: 400, title: 'the difference set C − D' });
        const Ah = [[-3.2, -0.9], [-1.4, -1.3], [-1.0, 0.9], [-2.9, 1.2]].map((p, i) => L.handle(p[0], p[1], { color: 'blue', r: 5.5, label: i ? undefined : 'C', labelPos: 'nw' }));
        const Bh = [[0.9, -1.1], [3.2, -1.6], [3.6, 1.0], [1.6, 1.6]].map((p, i) => L.handle(p[0], p[1], { color: 'orange', r: 5.5, label: i ? undefined : 'D', labelPos: 'ne' }));
        const Cc = L.handle(1.6, 0, { color: 'orange', r: 7, label: 'D', labelPos: 'n' });
        const g = 0.55;
        const Cshape = (cx, cy) => {
          const pts = [], N = 36;
          for (let i = 0; i <= N; i++) { const t = -Math.PI + g + ((TAU - 2 * g) * i) / N; pts.push([cx + 2.4 * Math.cos(t), cy + 2.4 * Math.sin(t)]); }
          for (let i = N; i >= 0; i--) { const t = -Math.PI + g + ((TAU - 2 * g) * i) / N; pts.push([cx + 1.5 * Math.cos(t), cy + 1.5 * Math.sin(t)]); }
          return pts;
        };
        v.button('interlock', () => { dSel.set('c', { fire: true }); Cc.set(0.9, 0); [[-0.3, -0.35], [0.5, -0.5], [0.6, 0.4], [-0.35, 0.45]].forEach((p, i) => Ah[i].set(0.9 + p[0], p[1])); });
        v.button('pull apart', () => { Cc.set(2.6, 0); [[-3.2, -0.9], [-1.4, -1.3], [-1.0, 0.9], [-2.9, 1.2]].forEach((p, i) => Ah[i].set(p[0], p[1])); });
        const mem = memo();
        let info = {};
        v.render(() => {
          const isC = dSel.value === 'c';
          Bh.forEach((h) => { h.visible = !isC; }); Cc.visible = isC;
          const Cp = hull(Ah.map((h) => [h.x, h.y])), Dp = isC ? Cshape(Cc.x, Cc.y) : hull(Bh.map((h) => [h.x, h.y]));
          L.poly(Cp, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 }); L.poly(Dp, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2 });
          const key = [...Cp.flat(), ...Dp.flat()].map((x) => x.toFixed(3)).join(',');
          const res = mem(key, () => {
            const pd = polyDistance(Cp, Dp);
            let bestGap = -Infinity, bestA = null;
            for (let i = 0; i < 720; i++) { const t = (TAU * i) / 720, a = [Math.cos(t), Math.sin(t)], gap = infimum(Dp, a) - support(Cp, a); if (gap > bestGap) { bestGap = gap; bestA = a; } }
            // difference set
            const diff = []; for (const p of Cp) for (const q of Dp) diff.push([p[0] - q[0], p[1] - q[1]]);
            const hd = hull(diff);
            return { pd, bestGap, bestA, hd, Cp, Dp };
          });
          const { pd, bestGap, bestA, hd } = res;
          // right panel
          if (!isC) Rg.poly(hd, { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 2 });
          else {
            Rg.raster((x, y) => (polysIntersect(Cp, Dp.map((p) => [p[0] + x, p[1] + y])) ? rgbA(v, 'purple', 80) : null), { res: 5, key: 'diff|' + key });
            Rg.poly(hd, { fill: false, color: 'purple', width: 1.4, dash: true });
          }
          Rg.dot(0, 0, { r: 6, color: 'ink', label: '0', labelPos: 'nw' });
          let sepOk = false, msg;
          if (!isC && pd.d > 1e-9) {
            const n = [(pd.b[0] - pd.a[0]) / pd.d, (pd.b[1] - pd.a[1]) / pd.d], mid = [(pd.a[0] + pd.b[0]) / 2, (pd.a[1] + pd.b[1]) / 2];
            L.clip(() => L.line(mid[0] - 12 * n[1], mid[1] + 12 * n[0], mid[0] + 12 * n[1], mid[1] - 12 * n[0], { color: 'green', width: 2.6 }));
            L.segment(pd.a, pd.b, { color: 'ink', width: 1.6, dash: true }); L.dot(pd.a[0], pd.a[1], { r: 4.5, color: 'blue' }); L.dot(pd.b[0], pd.b[1], { r: 4.5, color: 'orange' });
            const u = [pd.a[0] - pd.b[0], pd.a[1] - pd.b[1]];
            Rg.arrow(0, 0, u[0], u[1], { color: 'green', width: 2.4 }); Rg.dot(u[0], u[1], { r: 5, color: 'green', label: 'u', labelPos: 'ne' });
            const gapN = infimum(Dp, n) - support(Cp, n);
            sepOk = true; msg = `Closest pair at distance $${v.fix(pd.d, 3)}$; the bisector normal has gap $\\min_D a^\\top y-\\max_C a^\\top x=${v.fix(gapN, 3)}$ (equals the distance). Best of 720 directions: gap $${v.fix(bestGap, 3)}$.`;
          } else if (!isC) msg = '$C\\cap D\\ne\\emptyset$: $0\\in C-D$, so no hyperplane separates them (the hypothesis fails).';
          else if (bestGap > 1e-9 && pd.d > 0) {
            const a = bestA, b = (infimum(Dp, a) + support(Cp, a)) / 2;
            L.clip(() => L.line(a[0] * b - 12 * a[1], a[1] * b + 12 * a[0], a[0] * b + 12 * a[1], a[1] * b - 12 * a[0], { color: 'green', width: 2.6 }));
            sepOk = true; msg = `$C$ and $D$ are disjoint and a line separates them (best gap $${v.fix(bestGap, 3)}$ over 720 directions): move $C$ into the cup to break it.`;
          } else msg = pd.d > 0 ? `$C\\cap D=\\emptyset$ yet **no line separates them**: the best of 720 directions has gap $${v.fix(bestGap, 3)}\\le0$. $D$ is not convex, so the theorem does not apply; $0\\in\\operatorname{conv}(C-D)$ but $0\\notin C-D$.` : '$C\\cap D\\ne\\emptyset$.';
          info = { msg, sepOk };
        });
        v.readout(() => info.msg);
      },
    },
  ],
};
