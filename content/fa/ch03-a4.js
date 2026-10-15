// Rudin, Functional Analysis — Chapter 3 (part 4): separation of compact convex sets and extreme points, 3.21–3.25

const d2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Intersection parameters [t0, t1] of the line p + t·d with a convex polygon (p inside). */
function chord(poly, p, d) {
  let t0 = -Infinity, t1 = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const n = [Q[1] - P[1], -(Q[0] - P[0])];             // outward normal (CCW polygon)
    const num = d2(n, [P[0] - p[0], P[1] - p[1]]), den = d2(n, d);
    if (Math.abs(den) < 1e-14) continue;
    const t = num / den;
    if (den > 0) t1 = Math.min(t1, t); else t0 = Math.max(t0, t);
  }
  return [t0, t1];
}
/** Clip a convex polygon to {x : a·x ≤ b}. */
function clipLe2(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = d2(a, P) - b, fq = d2(a, Q) - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Distance from p to the boundary of a polygon, and the closest boundary point. */
function toBoundary(M, poly, p) {
  let best = Infinity, q = null;
  for (let i = 0; i < poly.length; i++) { const z = M.closestOnSegment(p, poly[i], poly[(i + 1) % poly.length]); const d = M.dist(p, z); if (d < best) { best = d; q = z; } }
  return [best, q];
}
/** A small library of planar compact convex sets with their extreme points described exactly. */
function shapeLib(M) {
  const arc = (c, r, a0, a1, n = 64) => M.range(n + 1).map((i) => { const t = a0 + (a1 - a0) * i / n; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });
  const a = 0.85, r = 0.8;
  const sR = arc([a, 0], r, -Math.PI / 2, Math.PI / 2), sL = arc([-a, 0], r, Math.PI / 2, 1.5 * Math.PI);
  const D1 = arc([-0.55, 0], 1.3, -Math.PI / 2, Math.PI / 2);
  const circ = arc([0, 0], 1.2, 0, 2 * Math.PI, 160);
  const hex = [[1.35, -0.4], [1.05, 0.85], [-0.2, 1.15], [-1.35, 0.45], [-1.15, -0.8], [0.15, -1.1]];
  return {
    hex: { label: 'polygon', poly: hex, flats: hex.map((P, i) => [P, hex[(i + 1) % hex.length]]), arcs: [], verts: hex },
    stadium: { label: 'stadium', poly: sR.concat(sL), flats: [[[a, r], [-a, r]], [[-a, -r], [a, -r]]], arcs: [sR, sL], verts: [] },
    D: { label: 'half-disc', poly: D1, flats: [[[-0.55, 1.3], [-0.55, -1.3]]], arcs: [D1], verts: [] },
    disc: { label: 'disc', poly: circ.slice(0, -1), flats: [], arcs: [circ], verts: [] },
  };
}
/** Is p (on the boundary) in the relative interior of one of the flat pieces? Returns that piece or null. */
function flatAt(M, flats, p, tol = 2e-3) {
  for (const [P, Q] of flats) if (M.dist(M.closestOnSegment(p, P, Q), p) < tol && M.dist(p, P) > tol && M.dist(p, Q) > tol) return [P, Q];
  return null;
}

export default {
  collection: 'fa',
  chapter: 3,
  items: [
    {
      num: '3.21',
      kind: 'Theorem',
      name: 'Separating compact convex sets when X* separates points',
      statement: String.raw`Let $X$ be a topological vector space on which $X^*$ separates points, and let $A$ and $B$ be disjoint, nonempty, compact, convex subsets of $X$. Then there is $\Lambda\in X^*$ with
$$\sup_{x\in A}\Re\Lambda x<\inf_{y\in B}\Re\Lambda y .$$`,
      idea: String.raw`$X$ need not be locally convex, so 3.4(b) cannot be applied directly. Pass to the weak topology: $X_w$ is locally convex (3.11) with the same dual $X^*$, and $A$, $B$ remain compact in the weaker topology (hence weakly closed, $X_w$ being Hausdorff). Now 3.4(b) in $X_w$ produces $\Lambda\in(X_w)^*=X^*$.`,
      caption: String.raw`A planar cartoon of $\ell^p$ with $0<p<1$, a non-locally-convex space whose dual still separates points. Its neighbourhoods of $0$ are stars $V$ (orange; inset bottom left), and $A+V$ (orange) is not convex, so the proof of 3.4(b) cannot use it. A weak neighbourhood $V_w=\{|\Lambda x|<\delta\}$ is a whole strip (green, inset) — convex, and the slab $A+V_w$ still misses $B$; the separating line sits in the gap. Drag the vertices of $A$ and $B$.`,
      deps: ['fa-3.4', 'fa-3.11'],
      tags: ['Hahn–Banach', 'separation', 'weak topologies'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3, 3], y: [-1.95, 1.95], equal: true, height: 390, ticks: false, axes: false });
        const pS = v.slider('$p$ (star $=\\ell^p$ ball)', 0.3, 1, 0.5, { step: 0.01 });
        const dS = v.slider('size $\\delta$ of the neighbourhoods', 0.1, 0.7, 0.35, { step: 0.01 });
        const A = [[-2.0, -0.25], [-0.95, -0.75], [-0.45, 0.55], [-1.55, 1.2]].map(([x, y]) => S.handle(x, y, { color: 'blue', r: 6 }));
        const B = [[1.0, -0.75], [2.35, -0.95], [2.15, 0.9], [0.95, 0.55]].map(([x, y]) => S.handle(x, y, { color: 'red', r: 6 }));
        let st = {};
        v.render(() => {
          const HA = M.hull(A.map((h) => [h.x, h.y])), HB = M.hull(B.map((h) => [h.x, h.y]));
          const p = pS.value, del = dS.value;
          // closest pair (or overlap)
          let best = Infinity, pa = null, pb = null;
          const edges = (H) => H.map((P, i) => [P, H[(i + 1) % H.length]]);
          for (const a of HA) for (const [P, Q] of edges(HB)) { const z = M.closestOnSegment(a, P, Q), d = M.dist(a, z); if (d < best) { best = d; pa = a; pb = z; } }
          for (const b of HB) for (const [P, Q] of edges(HA)) { const z = M.closestOnSegment(b, P, Q), d = M.dist(b, z); if (d < best) { best = d; pa = z; pb = b; } }
          const overlap = HA.some((a) => M.pointInPoly(a, HB)) || HB.some((b) => M.pointInPoly(b, HA)) || edges(HA).some(([P, Q]) => edges(HB).some(([R, T]) => {
            const c = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
            return c(P, Q, R) * c(P, Q, T) < 0 && c(R, T, P) * c(R, T, Q) < 0;
          }));
          // A + δV_p exactly: A, the stars at the vertices, and every star edge swept along every edge of A
          const star = M.unitBall(p, 120).map(([x, y]) => [del * x, del * y]);
          const rings = [HA.slice()];
          const orient = (q) => (M.polyArea(q) < 0 ? q.reverse() : q);
          for (const a of HA) rings.push(orient(star.map(([x, y]) => [a[0] + x, a[1] + y])));
          for (const [P, Q] of edges(HA)) for (let k = 0; k < star.length; k++) {
            const s0 = star[k], s1 = star[(k + 1) % star.length];
            rings.push(orient([[P[0] + s0[0], P[1] + s0[1]], [P[0] + s1[0], P[1] + s1[1]], [Q[0] + s1[0], Q[1] + s1[1]], [Q[0] + s0[0], Q[1] + s0[1]]]));
          }
          if (!overlap) {
            const n = M.normalize([pb[0] - pa[0], pb[1] - pa[1]]), t = [-n[1], n[0]];
            const g1 = d2(n, pa), g2 = d2(n, pb), w = Math.min(del, (g2 - g1) * 0.45);
            const slab = (lo, hi, st2) => S.poly([[lo * n[0] - 9 * t[0], lo * n[1] - 9 * t[1]], [hi * n[0] - 9 * t[0], hi * n[1] - 9 * t[1]], [hi * n[0] + 9 * t[0], hi * n[1] + 9 * t[1]], [lo * n[0] + 9 * t[0], lo * n[1] + 9 * t[1]]], st2);
            const minA = Math.min(...HA.map((z) => d2(n, z)));
            slab(minA - w, g1 + w, { fill: 'green', fillAlpha: 0.1, color: 'green', width: 1, dash: [5, 4], alpha: 0.7 });
            const mid = (g1 + g2) / 2;
            S.line(mid * n[0] - 9 * t[0], mid * n[1] - 9 * t[1], mid * n[0] + 9 * t[0], mid * n[1] + 9 * t[1], { color: 'green', width: 2.6 });
            S.line(pa[0], pa[1], pb[0], pb[1], { color: 'muted', width: 1.2, dash: [2, 3] });
            st = { overlap, g1, g2, w };
          } else st = { overlap };
          S.rings(rings, { fill: 'orange', fillAlpha: 0.3, stroke: false });
          S.poly(HA, { fill: 'panel', fillAlpha: 1, stroke: false });
          S.poly(HA, { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 2 });
          // inset: the two neighbourhoods of 0 themselves
          const ic = [-2.35, -1.38], ih = 0.5;
          S.rect(ic[0] - ih, ic[1] - ih, ic[0] + ih, ic[1] + ih, { fill: 'panel', fillAlpha: 1, color: 'faint', width: 1 });
          if (!st.overlap) { const n = M.normalize([pb[0] - pa[0], pb[1] - pa[1]]), t = [-n[1], n[0]], w = Math.min(st.w, ih * 0.9); let q = [[-ih, -ih], [ih, -ih], [ih, ih], [-ih, ih]]; q = clipLe2(clipLe2(q, n, w), [-n[0], -n[1]], w); S.poly(q.map(([x, y]) => [ic[0] + x, ic[1] + y]), { fill: 'green', fillAlpha: 0.18, color: 'green', width: 1, dash: [4, 3] }); }
          const k0 = Math.min(1, (ih * 0.85) / del);
          S.poly(star.map(([x, y]) => [ic[0] + k0 * x, ic[1] + k0 * y]), { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.3 });
          S.dot(ic[0], ic[1], { color: 'ink', r: 2.2 });
          S.tex('\\text{at } 0:\\ V,\\ V_w', ic[0] - ih, ic[1] + ih + 0.14, { color: 'muted', size: 13, align: 'left' });
          S.poly(HB, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 2 });
          const cA = [M.mean(HA.map((z) => z[0])), M.mean(HA.map((z) => z[1]))], cB = [M.mean(HB.map((z) => z[0])), M.mean(HB.map((z) => z[1]))];
          S.tex('A', cA[0], cA[1], { color: 'blue', size: 18 }); S.tex('B', cB[0], cB[1], { color: 'red', size: 18 });
          if (overlap) S.corner('A ∩ B ≠ ∅ — nothing to separate', 'tl', { color: 'red', weight: 600 });
          else S.corner('A + V is not convex; A + V_w is a convex slab', 'tl', { color: 'muted', weight: 600 });
        });
        v.legend([['orange', '$V$ and $A+V$ (original, not convex)', { area: true }], ['green', '$V_w$ and $A+V_w$ (weak, convex)', { area: true }], ['green', 'separating line']]);
        v.readout(() => st.overlap ? 'The sets meet, so the hypothesis fails.' : `$\\sup_A\\Re\\Lambda = ${v.fix(st.g1, 3)} < ${v.fix(st.g2, 3)} = \\inf_B\\Re\\Lambda$, where $\\Lambda$ is the unit functional in the direction of the closest pair. The weak neighbourhood $V_w=\\{|\\Lambda x|<${v.fix(st.w, 3)}\\}$ keeps $A+V_w$ off $B$.`);
      },
    },
    {
      num: '3.22',
      kind: 'Definition',
      name: 'Extreme points and extreme sets',
      statement: String.raw`Let $K$ be a subset of a vector space $X$. A nonempty $S\subset K$ is an **extreme set** of $K$ if whenever $x,y\in K$, $0<t<1$ and $(1-t)x+ty\in S$, then $x\in S$ and $y\in S$. An **extreme point** of $K$ is a point $p$ such that $\{p\}$ is an extreme set: $p$ is not an interior point of any segment with distinct endpoints in $K$. The set of extreme points is denoted $E(K)$.`,
      idea: String.raw`Extreme points are the "corners" from which a convex set can be rebuilt (Krein–Milman, 3.23). Faces of a polytope, and more generally the sets where a linear functional attains its maximum, are extreme sets.`,
      caption: String.raw`Choose a compact convex set $K$ and drag the probe $p$ (it sticks to the boundary when close). Green marks $E(K)$: the vertices of a polygon, every boundary point of a disc, the two arcs of a stadium but not its flat sides. If $p$ is not extreme, the red segment exhibits it as $(1-t)x+ty$ with $x\ne y$ in $K$.`,
      deps: [],
      tags: ['convexity', 'extreme points'],
      viz(v) {
        const M = v.M;
        const LIB = shapeLib(M);
        const which = v.select('$K=$', Object.entries(LIB).map(([value, o]) => ({ value, label: o.label })), 'stadium');
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, axes: false });
        const snap = (x, y) => {
          const K = LIB[which.value], P = [x, y];
          for (const vtx of K.verts) if (M.dist(vtx, P) < 0.09) return vtx.slice();
          const [d, q] = toBoundary(M, K.poly, P);
          if (!M.pointInPoly(P, K.poly) || d < 0.06) return q;
          return P;
        };
        const p = S.handle(0.2, 0.8, { color: 'gold', label: 'p', constrain: snap });
        let last = null, st = {};
        v.render(() => {
          const K = LIB[which.value];
          if (last !== which.value) { last = which.value; const q = snap(p.x, p.y); p.x = q[0]; p.y = q[1]; }
          S.poly(K.poly, { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 2 });
          for (const a of K.arcs) S.path(a, { color: 'green', width: 4.5 });
          for (const vtx of K.verts) S.dot(vtx[0], vtx[1], { color: 'green', r: 6 });
          for (const a of K.arcs) { S.dot(a[0][0], a[0][1], { color: 'green', r: 4 }); S.dot(a[a.length - 1][0], a[a.length - 1][1], { color: 'green', r: 4 }); }
          const P = [p.x, p.y], [db] = toBoundary(M, K.poly, P);
          let seg = null, extreme = false;
          if (db < 2e-3) {
            const f = flatAt(M, K.flats, P);
            if (f) seg = f; else extreme = true;
          } else {
            const d = M.normalize([1, 0.45]); const [t0, t1] = chord(K.poly, P, d);
            seg = [[P[0] + t0 * d[0], P[1] + t0 * d[1]], [P[0] + t1 * d[0], P[1] + t1 * d[1]]];
          }
          if (seg) {
            S.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1], { color: 'red', width: 3 });
            const lft = seg[0][0] <= seg[1][0];
            S.dot(seg[0][0], seg[0][1], { color: 'red', r: 5, label: 'x', labelPos: lft ? 'nw' : 'ne' });
            S.dot(seg[1][0], seg[1][1], { color: 'red', r: 5, label: 'y', labelPos: lft ? 'ne' : 'nw' });
          }
          S.corner(extreme ? 'p is an extreme point' : 'p is not extreme', 'tl', { color: extreme ? 'green' : 'red', weight: 600 });
          const t = seg ? M.dist(seg[0], P) / M.dist(seg[0], seg[1]) : null;
          st = { extreme, t, interior: db >= 2e-3 };
        });
        v.legend([['blue', '$K$', { area: true }], ['green', 'extreme points $E(K)$'], ['red', 'a segment in $K$ through $p$']]);
        v.readout(() => st.extreme ? 'No segment with distinct endpoints in $K$ has $p$ in its interior: $p\\in E(K)$.' : `$p=(1-t)x+ty$ with $t=${v.fix(st.t, 3)}$ and $x\\ne y$ in $K$ — ${st.interior ? 'an interior point is never extreme' : 'a point in the middle of a flat side is not extreme'}.`);
      },
    },
    {
      num: '3.23',
      kind: 'Theorem',
      name: 'Krein–Milman theorem',
      statement: String.raw`Let $X$ be a topological vector space on which $X^*$ separates points. If $K$ is a nonempty compact convex set in $X$, then $K$ is the closed convex hull of its extreme points:
$$K=\overline{\co}\,(E(K)).$$
In particular $E(K)\ne\emptyset$.`,
      idea: String.raw`Let $\mathscr P$ be the family of compact extreme sets of $K$. For $S\in\mathscr P$ and $\Lambda\in X^*$, the set where $\Re\Lambda$ is maximal on $S$ is again in $\mathscr P$; a minimal member (Zorn, using compactness) is therefore a set on which every $\Re\Lambda$ is constant, hence a single point because $X^*$ separates points — an extreme point. So every $S\in\mathscr P$ meets $E(K)$. If some $x_0\in K$ were outside $H=\overline{\co}(E(K))$, separate $x_0$ from $H$ by 3.21; the face of $K$ where that $\Re\Lambda$ is maximal is in $\mathscr P$ but misses $H$ — impossible.`,
      caption: String.raw`Compact convex bodies in $\R^3$ with their extreme points in gold: the 8 corners of a cube, the 6 vertices of the $\ell^1$ ball, the two rims of a cylinder, apex and rim of a cone, the whole sphere. The blue polytope is the convex hull of $N$ sampled extreme points; as $N$ grows its volume fills $K$, as Krein–Milman demands — compact convex polygons are the hulls of their vertices, and this is the infinite-dimensional version. The **open cylinder** (rims removed) is convex but not compact and has no extreme points at all. Drag to rotate.`,
      deps: ['fa-3.21', 'fa-3.22', 'fa-3.19'],
      tags: ['convexity', 'extreme points', 'Krein–Milman'],
      viz(v) {
        const M = v.M;
        const SH = { cube: 'cube', oct: '$\\ell^1$ ball', cyl: 'cylinder', cone: 'cone', ball: 'ball', open: 'open cylinder' };
        const which = v.select('$K=$', Object.entries(SH).map(([value, label]) => ({ value, label })), 'cyl');
        const nS = v.slider('$N$ sampled extreme points per curve', 3, 40, 7, { int: true });
        const S3 = v.stage3d({ range: 1.75, height: 400, yaw: -0.6, pitch: 0.36, axes: false });
        const ring = (r, z, n, ph = 0) => M.range(n).map((i) => [r * Math.cos(M.TAU * i / n + ph), r * Math.sin(M.TAU * i / n + ph), z]);
        const tetVol = (a, b, c) => Math.abs(M.dot(a, M.cross3(b, c))) / 6;
        let st = {};
        v.render(() => {
          const k = which.value, N = nS.value;
          const faces = []; let dots = [], curves = [], ratio = 1, nE = 0, wire = [];
          if (k === 'cube') {
            const a = 0.85, V = (i, j, l) => [i * a, j * a, l * a];
            for (const s of [-1, 1]) {
              faces.push([V(s, -1, -1), V(s, 1, -1), V(s, 1, 1), V(s, -1, 1)]);
              faces.push([V(-1, s, -1), V(1, s, -1), V(1, s, 1), V(-1, s, 1)]);
              faces.push([V(-1, -1, s), V(1, -1, s), V(1, 1, s), V(-1, 1, s)]);
            }
            for (const i of [-1, 1]) for (const j of [-1, 1]) for (const l of [-1, 1]) dots.push(V(i, j, l));
            nE = 8;
          } else if (k === 'oct') {
            const a = 1.25, e = [[a, 0, 0], [-a, 0, 0], [0, a, 0], [0, -a, 0], [0, 0, a], [0, 0, -a]];
            for (const x of [e[0], e[1]]) for (const y of [e[2], e[3]]) for (const z of [e[4], e[5]]) faces.push([x, y, z]);
            dots = e; nE = 6;
          } else if (k === 'cyl' || k === 'open') {
            const h = 0.85, top = ring(1, h, N), bot = ring(1, -h, N);
            wire = [ring(1, h, 96), ring(1, -h, 96)];
            if (k === 'cyl') {
              faces.push(top, bot.slice().reverse());
              for (let i = 0; i < N; i++) faces.push([bot[i], bot[(i + 1) % N], top[(i + 1) % N], top[i]]);
              curves = wire; dots = top.concat(bot);
              ratio = N * Math.sin(M.TAU / N) / M.TAU; nE = Infinity;
            }
          } else if (k === 'cone') {
            const apex = [0, 0, 1.05], bot = ring(1.05, -0.75, N);
            faces.push(bot.slice().reverse());
            for (let i = 0; i < N; i++) faces.push([bot[i], bot[(i + 1) % N], apex]);
            wire = [ring(1.05, -0.75, 96)]; curves = wire; dots = bot.concat([apex]);
            ratio = N * Math.sin(M.TAU / N) / M.TAU; nE = Infinity;
          } else if (k === 'ball') {
            const R = 1.15, m = Math.max(2, Math.round(N / 2)), lat = M.range(m - 1, 1).map((j) => -Math.PI / 2 + Math.PI * j / m);
            const rings = lat.map((t) => ring(R * Math.cos(t), R * Math.sin(t), N));
            const S0 = [0, 0, -R], N0 = [0, 0, R];
            for (let i = 0; i < N; i++) { faces.push([S0, rings[0][(i + 1) % N], rings[0][i]]); faces.push([N0, rings[rings.length - 1][i], rings[rings.length - 1][(i + 1) % N]]); }
            for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < N; i++) faces.push([rings[j][i], rings[j][(i + 1) % N], rings[j + 1][(i + 1) % N], rings[j + 1][i]]);
            dots = rings.flat().concat([S0, N0]);
            let vol = 0; for (const f of faces) for (let q = 1; q + 1 < f.length; q++) vol += tetVol(f[0], f[q], f[q + 1]);
            ratio = vol / (4 / 3 * Math.PI * R ** 3); nE = Infinity;
            wire = [ring(R, 0, 96)]; curves = [];
            for (let q = 0; q < 6; q++) wire.push(M.range(49).map((s) => { const t = -Math.PI / 2 + Math.PI * s / 48, ph = Math.PI * q / 6; return [R * Math.cos(t) * Math.cos(ph), R * Math.cos(t) * Math.sin(ph), R * Math.sin(t)]; }).concat(M.range(49).map((s) => { const t = Math.PI / 2 - Math.PI * s / 48, ph = Math.PI * q / 6 + Math.PI; return [R * Math.cos(t) * Math.cos(ph), R * Math.cos(t) * Math.sin(ph), R * Math.sin(t)]; })));
          }
          if (k === 'open') {
            const h = 0.85;
            for (const w of wire) S3.path(w.concat([w[0]]), { color: 'red', width: 1.6, dash: [4, 4] });
            for (let i = 0; i < 12; i++) { const a = M.TAU * i / 12; S3.line([Math.cos(a), Math.sin(a), -h * 0.97], [Math.cos(a), Math.sin(a), h * 0.97], { color: 'red', width: 1, alpha: 0.5 }); }
            const q = [0.3, 0.2, 0.84], r0 = [0.3, 0.2, -0.84];
            S3.line(r0, q, { color: 'red', width: 2.6 }); S3.dot([0.3, 0.2, 0.3], { color: 'gold', r: 5 });
          } else {
            for (const w of wire) S3.path(w.concat([w[0]]), { color: 'muted', width: 1, alpha: 0.55 });
            for (const f of faces) S3.poly(f, { fill: 'blue', fillAlpha: 0.16, color: 'blue', alpha: 0.6, width: 1 });
            for (const c of curves) S3.path(c.concat([c[0]]), { color: 'gold', width: 3, bias: -0.05 });
            for (const d of dots) S3.dot(d, { color: 'gold', r: nE === Infinity ? 3.5 : 6 });
          }
          st = { k, N, ratio, nE };
        });
        v.legend([['gold', 'extreme points $E(K)$ (sampled)', { dot: true }], ['blue', '$\\co$ of the sampled extreme points', { area: true }], ['red', 'non-compact case: no extreme points', { dash: true }]]);
        v.readout(() => {
          const s = st;
          if (s.k === 'open') return 'The open cylinder $\\{x_1^2+x_2^2\\le1,\\ |x_3|<0.85\\}$ is convex but not closed, hence not compact: every point lies inside a vertical segment in it, so $E(K)=\\emptyset$ and the conclusion of Krein–Milman fails.';
          if (s.nE !== Infinity) return `$E(K)$ has ${s.nE} points and $\\co(E(K))=K$ exactly ($\\mathrm{vol}$ ratio $1$).`;
          return `$N=${s.N}$: $\\mathrm{vol}\\,\\co(E_N)/\\mathrm{vol}\\,K = ${v.fix(s.ratio, 4)}$ $\\to1$ as $N\\to\\infty$, so $\\overline{\\co}(E(K))=K$.`;
        });
      },
    },
    {
      num: '3.24',
      kind: 'Theorem',
      name: 'Linear functionals attain their maximum at extreme points',
      statement: String.raw`Let $X$ be a topological vector space on which $X^*$ separates points, and $K\ne\emptyset$ a compact convex subset of $X$.
(a) Every compact extreme set of $K$ contains an extreme point of $K$.
(b) For each $\Lambda\in X^*$, the set $K_\Lambda=\{x\in K:\Re\Lambda x=\max_K\Re\Lambda\}$ is a compact extreme set; hence $\Re\Lambda$ attains its maximum over $K$ at an extreme point of $K$.`,
      idea: String.raw`(b) If $(1-t)x+ty\in K_\Lambda$ with $x,y\in K$ and $0<t<1$, then $\Re\Lambda x,\Re\Lambda y\le\max$ and their weighted average equals the max, so both equal it. (a) is the Zorn's-lemma step of the Krein–Milman proof: a minimal compact extreme subset is a point, since otherwise some $\Re\Lambda$ is non-constant on it and its maximum set is a smaller extreme set.`,
      caption: String.raw`Drag the arrow tip to choose $\Lambda$ (it snaps to the normals of flat sides). The orange set is $K_\Lambda$, where $\Lambda$ is maximal: a point or a whole side — and in either case it contains extreme points of $K$ (green). Right: $\Lambda$ along the boundary of $K$ (by arc length), drawn green on extreme points and blue on flat sides; the maximum always occurs on green.`,
      deps: ['fa-3.22', 'fa-3.23'],
      tags: ['extreme points', 'Krein–Milman', 'linear functionals'],
      verify: true,
      viz(v) {
        const M = v.M;
        const LIB = shapeLib(M);
        const which = v.select('$K=$', Object.entries(LIB).map(([value, o]) => ({ value, label: o.label })), 'hex');
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 340, ticks: false, axes: false, title: '$K$, the functional $\\Lambda$ and its face $K_\\Lambda$' });
        const R = v.stage({ x: [0, 1], y: [-1, 1], height: 340, axes: 'box', xlabel: 'arc length', title: '$\\Lambda x$ for $x$ running once around $\\partial K$' });
        const normals = () => LIB[which.value].flats.map(([P, Q]) => M.normalize([Q[1] - P[1], -(Q[0] - P[0])]));
        const tip = L.handle(0.78, 0.19, {
          color: 'green', label: 'Λ',
          constrain: (x, y) => {
            const r = M.clamp(Math.hypot(x, y), 0.5, 1.6), a = Math.atan2(y, x);
            for (const n of normals()) { const b = Math.atan2(n[1], n[0]); let d = Math.abs(a - b); d = Math.min(d, M.TAU - d); if (d < 0.08) return [r * n[0], r * n[1]]; }
            return [r * Math.cos(a), r * Math.sin(a)];
          },
        });
        let st = {}, snapped = null;
        v.render(() => {
          const K = LIB[which.value], poly = K.poly;
          if (snapped !== which.value) { snapped = which.value; const q = tip.constrain(tip.x, tip.y); tip.x = q[0]; tip.y = q[1]; }
          const lam = M.normalize([tip.x, tip.y]);
          const vals = poly.map((z) => d2(lam, z)), mx = Math.max(...vals);
          const face = poly.filter((z, i) => vals[i] > mx - 1e-6);
          const f0 = face[0], f1 = face[face.length - 1];
          let ends = [f0];
          if (face.length > 1) { let a = face[0], b = face[0], best = 0; for (const p of face) for (const q of face) { const d = M.dist(p, q); if (d > best) { best = d; a = p; b = q; } } ends = best > 1e-6 ? [a, b] : [a]; }
          const t = [-lam[1], lam[0]];
          L.poly(poly, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 2 });
          for (const a of K.arcs) L.path(a, { color: 'green', width: 3.5, alpha: 0.75 });
          for (const z of K.verts) L.dot(z[0], z[1], { color: 'green', r: 4.5 });
          L.line(mx * lam[0] - 6 * t[0], mx * lam[1] - 6 * t[1], mx * lam[0] + 6 * t[0], mx * lam[1] + 6 * t[1], { color: 'orange', width: 1.3, dash: [6, 4] });
          L.arrow(0, 0, tip.x, tip.y, { color: 'green', width: 2.2, head: 10 });
          if (ends.length === 2) L.line(ends[0][0], ends[0][1], ends[1][0], ends[1][1], { color: 'orange', width: 6, alpha: 0.85 });
          ends.forEach((z) => L.dot(z[0], z[1], { color: 'green', r: 7 }));
          if (ends.length === 1) L.dot(ends[0][0], ends[0][1], { color: 'orange', r: 3 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // boundary profile
          const pts = poly.concat([poly[0]]); let s = 0; const prof = [[0, d2(lam, pts[0])]], flags = [];
          for (let i = 1; i < pts.length; i++) {
            s += M.dist(pts[i - 1], pts[i]); prof.push([s, d2(lam, pts[i])]);
            const mid = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2];
            flags.push(!!flatAt(M, K.flats, mid, 1e-3));
          }
          const Ltot = s, lo = Math.min(...prof.map((q) => q[1])) - 0.15, hi = mx + 0.25;
          R.setView([0, Ltot], [lo, hi]);
          R.hline(mx, { color: 'orange', width: 1.3, dash: [6, 4] });
          for (let i = 1; i < prof.length; i++) R.line(prof[i - 1][0], prof[i - 1][1], prof[i][0], prof[i][1], { color: flags[i - 1] ? 'blue' : 'green', width: flags[i - 1] ? 2 : 3 });
          if (K.verts.length) prof.slice(0, -1).forEach((q) => R.dot(q[0], q[1], { color: 'green', r: 4 }));
          prof.forEach((q, i) => { if (q[1] > mx - 1e-6 && i < prof.length - 1) R.dot(q[0], q[1], { color: 'orange', r: 3.2 }); });
          st = { mx, n: ends.length, len: ends.length === 2 ? M.dist(ends[0], ends[1]) : 0 };
        });
        v.legend([['blue', '$K$; flat sides (not extreme)', { area: true }], ['green', 'extreme points'], ['orange', '$K_\\Lambda$ and the level $\\max_K\\Lambda$', { dash: true }]]);
        v.readout(() => st.n === 2
          ? `$\\max_K\\Lambda = ${v.fix(st.mx, 3)}$ is attained on a whole side (length $${v.fix(st.len, 3)}$): $K_\\Lambda$ is an extreme set, and its two endpoints are extreme points of $K$.`
          : `$\\max_K\\Lambda = ${v.fix(st.mx, 3)}$ is attained at a single point, which is an extreme point of $K$.`);
      },
    },
    {
      num: '3.25',
      kind: 'Theorem',
      name: "Milman's theorem (partial converse of Krein–Milman)",
      statement: String.raw`Let $K$ be a compact set in a locally convex space $X$ such that $\overline{\co}(K)$ is also compact. Then every extreme point of $\overline{\co}(K)$ lies in $K$.`,
      idea: String.raw`Suppose an extreme point $x_0$ of $H=\overline{\co}(K)$ is not in $K$. Choose a convex balanced neighbourhood $V$ of $0$ with $(x_0+\overline V)\cap K=\emptyset$, cover the compact set $K$ by finitely many $x_i+V$ with $x_i\in K$, and put $A_i=\overline{\co}(K\cap(x_i+\overline V))\subset x_i+\overline V$. The $A_i$ are compact and convex, so $\co(A_1\cup\dots\cup A_n)$ is compact (3.20(a)); it contains $K$ and lies in $H$, hence equals $H$. Writing $x_0=\sum t_iy_i$ with $y_i\in A_i$, extremality forces $x_0=y_i$ for some $i$, so $x_0\in x_i+\overline V$, i.e. $x_i\in x_0+\overline V$ — contradicting the choice of $V$.`,
      caption: String.raw`$K$ (purple) is a compact set made of six points and a circular arc; drag the points and the arc's centre. The dashed region is $\co(K)$; its extreme points (green) always belong to $K$ — some of the isolated points and part of the arc. Points without a green ring are not extreme. Toggle **remove the arc's endpoint**: $K$ is no longer closed, and the corner of $\overline{\co}(K)$ at that endpoint (red ring) is an extreme point outside $K$.`,
      deps: ['fa-3.20', 'fa-3.22'],
      tags: ['extreme points', 'Krein–Milman', 'convexity'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.65, 1.65], equal: true, height: 360, ticks: false, axes: false });
        const holed = v.toggle("remove the arc's endpoint", false);
        const R = v.rng(11);
        const P = [[-1.9, -0.6], [-1.2, 0.95], [-0.4, -1.25], [0.2, 0.15], [-0.7, 0.1], [0.9, -1.1]].map(([x, y]) => S.handle(x + R.uniform(-0.05, 0.05), y, { color: 'purple', r: 5.5 }));
        const C = S.handle(0.7, 0.05, { color: 'gray', r: 5, label: 'centre' });
        const rS = v.slider('arc radius', 0.5, 1.4, 1.0, { step: 0.01 });
        let st = {};
        v.render(() => {
          const c = [C.x, C.y], r = rS.value, a0 = -0.35, a1 = 1.9;
          const arc = M.range(81).map((i) => { const t = a0 + (a1 - a0) * i / 80; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });
          const pts = P.map((h) => [h.x, h.y]);
          const all = pts.map((p, i) => ({ p, kind: 'pt', i })).concat(arc.map((p, i) => ({ p, kind: 'arc', i })));
          const H = M.hull(all.map((o) => o.p));
          const onHull = (q) => H.some((z) => Math.abs(z[0] - q[0]) < 1e-9 && Math.abs(z[1] - q[1]) < 1e-9);
          S.poly(H, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1.6, dash: [6, 4] });
          S.path(arc, { color: 'purple', width: 2.5 });
          // extreme points: hull vertices (each is an isolated point or an arc sample); arc samples on the hull form extreme arcs
          let run = [];
          const flush = () => { if (run.length > 1) S.path(run, { color: 'green', width: 5 }); run = []; };
          arc.forEach((q) => { if (onHull(q)) run.push(q); else flush(); }); flush();
          let nExt = 0;
          pts.forEach((q) => { const e = onHull(q); if (e) { nExt++; S.dot(q[0], q[1], { hollow: true, color: 'green', r: 11, width: 3 }); } });
          const endIdx = onHull(arc[0]) ? 0 : arc.length - 1, endExt = onHull(arc[endIdx]);
          if (holed.value) {
            const e = arc[endIdx];
            S.dot(e[0], e[1], { hollow: true, color: endExt ? 'red' : 'purple', r: 7, width: 2.6 });
          }
          S.tex('K', c[0] + r * Math.cos(0.8) + 0.18, c[1] + r * Math.sin(0.8) + 0.12, { color: 'purple', size: 16 });
          st = { nExt, arcExt: arc.filter(onHull).length, endExt, holed: holed.value, nH: H.length };
          S.corner(holed.value && endExt ? 'an extreme point of the closed hull is missing from K' : 'every extreme point of the closed hull lies in K', 'tl', { color: holed.value && endExt ? 'red' : 'green', weight: 600 });
        });
        v.legend([['purple', '$K$: six points and an arc'], ['blue', '$\\co(K)$', { dash: true }], ['green', 'extreme points of $\\overline{\\co}(K)$']]);
        v.readout(() => {
          const s = st;
          const base = `${s.nExt} of the 6 isolated points and ${s.arcExt > 1 ? 'an arc of' : s.arcExt === 1 ? 'one point of' : 'none of'} the curve are extreme in $\\overline{\\co}(K)$; all of them lie in $K$.`;
          if (s.holed && s.endExt) return 'With the arc\'s endpoint removed, $K$ is not compact. $\\overline{\\co}(K)$ is unchanged, and its extreme point at the missing endpoint is not in $K$: compactness of $K$ cannot be dropped.';
          if (s.holed) return 'The removed endpoint is not an extreme point here (it is inside the hull), so nothing breaks — move the arc so that its endpoint is a corner of the hull.';
          return base;
        });
      },
    },
  ],
};
