// Linear Algebra Done Right — Chapter 7: Operators on Inner Product Spaces
// Part 4 (7.86–7.111): the norm of a linear map and its formulas, the norm of the adjoint, best approximation by
// maps of lower rank, the polar decomposition, ellipsoids and parallelepipeds and what invertible operators do to
// them, boxes, and volume via singular values. Parts 1–3: ch07.js, ch07-b.js, ch07-c.js.

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** Fixed decimals for canvas text (real minus sign). */
const pf = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
/** TeX for a real matrix (array of rows). */
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** TeX for a vector as a tuple. */
const vtex = (a, d = 2) => `(${a.map((x) => tn(x, d)).join(', ')})`;
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const perp = (a) => [-a[1], a[0]];
const ZERO = [0, 0, 0];
const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
const outer = (a, b) => a.map((x) => b.map((y) => x * y));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const inv2 = (A) => { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
const rot = (t) => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
const smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const uAt = (t) => [Math.cos(t), Math.sin(t)];
const modPi = (t) => ((t % Math.PI) + Math.PI) % Math.PI;
const angOf = (a) => Math.atan2(a[1], a[0]);
const PI_TICKS = [[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2'], [(3 * Math.PI) / 4, '3π/4'], [Math.PI, 'π']];
/** Eigen-data of the symmetric matrix [[a, b], [b, d]]: eigenvalues l[0] ≥ l[1], unit eigenvector u for l[0]. */
function sym2(a, b, d) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), t = 0.5 * Math.atan2(2 * b, a - d);
  return { l: [m + r, m - r], u: [Math.cos(t), Math.sin(t)] };
}
/** SVD of a real 2×2 matrix (as in 7.70): A = s₁f₁e₁ᵀ + s₂f₂e₂ᵀ, e₂ = perp(e₁); f₂ = perp(f₁) when s₂ = 0. */
function svd22(A) {
  const [[a, b], [c, d]] = A, det = a * d - b * c;
  const E = sym2(a * a + c * c, a * b + c * d, b * b + d * d);
  const s1 = Math.sqrt(Math.max(0, E.l[0])), s2 = s1 > 1e-12 ? Math.abs(det) / s1 : 0;
  const e1 = E.u, e2 = perp(e1);
  const f1 = s1 > 1e-12 ? unit(mv(A, e1)) : [1, 0];
  const f2 = s2 > 1e-9 * Math.max(1, s1) ? unit(mv(A, e2)) : perp(f1);
  return { s: [s1, s2], e: [e1, e2], f: [f1, f2], det };
}
/** SVD of a real 3×3 matrix via v.M.svd: singular values s (decreasing), right/left singular vectors e, f (lists). */
function svd3(M, A) {
  const { U, S, V } = M.svd(A);
  const s = S.map((x) => Math.max(0, x)), e = [0, 1, 2].map((k) => V.map((r) => r[k]));
  const f = [0, 1, 2].map((k) => U.map((r) => r[k]));
  if (dot(f[2], cross(f[0], f[1])) < 0 && s[2] < 1e-9 * Math.max(1, s[0])) f[2] = scl(f[2], -1);
  return { s, e, f };
}
/** Draggable images T(1,0), T(0,1) of the standard basis, i.e. the columns of a 2×2 matrix (snapped to a grid). */
function colHandles(S, A0, o = {}) {
  const g = o.grid ?? 0.1;
  const snap = (x, y) => [Math.round(x / g) * g, Math.round(y / g) * g];
  const h1 = S.handle(A0[0][0], A0[1][0], { color: 'teal', label: o.l1 ?? 'T(1,0)', constrain: o.c1 ?? snap });
  const h2 = S.handle(A0[0][1], A0[1][1], { color: 'pink', label: o.l2 ?? 'T(0,1)', constrain: o.c2 ?? snap });
  return { h1, h2, get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
}
/** The image of the circle of radius r under a 2×2 matrix A, as a closed polyline. */
const ellPts = (A, r = 1, n = 160) => Array.from({ length: n + 1 }, (_, k) => mv(A, [r * Math.cos((TAU * k) / n), r * Math.sin((TAU * k) / n)]));
/** A small right-angle mark at `at` between the directions a and b (2D). */
function rightMark(S, a, b, r = 0.16, color = 'green', at = [0, 0]) {
  const u = scl(unit(a), r), w = scl(unit(b), r);
  S.path([add(at, u), add(at, add(u, w)), add(at, w)], { color, width: 1.4 });
}
/** Rotation of R³ by angle t about the axis u (Rodrigues), as a matrix. */
function rot3(u, t) {
  const [x, y, z] = unit(u), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
/** Two unit vectors completing the unit vector f to an orthonormal basis (f, g, f × g). */
function basisPerp(f) {
  const r = Math.abs(f[2]) < 0.96 ? [0, 0, 1] : [1, 0, 0], g = unit(sub(r, scl(f, dot(r, f))));
  return [g, cross(f, g)];
}
const DIAG3 = (s) => [[s[0], 0, 0], [0, s[1], 0], [0, 0, s[2]]];
/** An RGBA pixel of a palette colour with the given opacity (0–1), for rasters drawn over the panel. */
const rgba = (v, name, a) => { const c = v.rgb(name); return [c[0], c[1], c[2], Math.round(255 * Math.min(1, Math.max(0, a)))]; };
// ---------- 3D helpers (for v.scene3) ----------
/** Faces of the parallelepiped o + P(a, b, c). */
function pped(sc, o, a, b, c, st) {
  const ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[ZERO, a, ab, b], [c, ac, abc, bc], [ZERO, a, ac, c], [b, ab, abc, bc], [ZERO, b, bc, c], [a, ab, abc, ac]]) sc.poly(f.map((p) => add(o, p)), st);
}
/** The twelve edges of o + P(a, b, c). */
function ppedEdges(sc, o, a, b, c, st) {
  const V = [ZERO, a, b, c, add(a, b), add(a, c), add(b, c), add(add(a, b), c)].map((p) => add(o, p));
  for (const [i, j] of [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]]) sc.line(V[i], V[j], st, 1);
}
/** A right-angle mark at `at` between the directions a and b in R³. */
function rightMark3(sc, a, b, r = 0.15, color = 'green', at = ZERO) {
  const u = scl(unit(a), r), w = scl(unit(b), r);
  sc.path([add(at, u), add(at, add(u, w)), add(at, w)], { color, width: 1.6, alpha: 0.9 });
}
const EYE3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
/** Three faint great circles of the sphere of radius r. */
function sphereWire(sc, r = 1, st = {}) {
  for (const [a, b] of [[[1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 0, 1]], [[0, 1, 0], [0, 0, 1]]]) {
    const pts = []; for (let k = 0; k <= 72; k++) { const t = (TAU * k) / 72; pts.push(add(scl(a, r * Math.cos(t)), scl(b, r * Math.sin(t)))); }
    sc.path(pts, { color: 'faint', width: 1, alpha: 0.8, ...st });
  }
}
/** The filled ellipse {c + cos t·a + sin t·b} in R³ (a, b its conjugate semi-axes). */
function ellPoly3(sc, a, b, st, c = ZERO) {
  const pts = []; for (let k = 0; k < 64; k++) { const t = (TAU * k) / 64; pts.push(add(c, add(scl(a, Math.cos(t)), scl(b, Math.sin(t))))); }
  sc.poly(pts, st);
}
/** Images under the 3×3 matrix T of three meridians and three parallels of the unit sphere. */
function sphereImage(sc, T, st) {
  const cs = [];
  for (let m = 0; m < 3; m++) { const ph = (m * Math.PI) / 3; cs.push((t) => [Math.cos(t) * Math.cos(ph), Math.cos(t) * Math.sin(ph), Math.sin(t)]); }
  for (const z of [-0.6, 0, 0.6]) { const r = Math.sqrt(1 - z * z); cs.push((t) => [r * Math.cos(t), r * Math.sin(t), z]); }
  for (const c of cs) { const pts = []; for (let k = 0; k <= 48; k++) pts.push(mv(T, c((TAU * k) / 48))); sc.path(pts, st); }
}
/** Orthographic outline of the solid ellipsoid c + A(ball), drawn directly on the stage S under the scene's view. */
function silhouette(sc, S, A, st, c = ZERO) {
  const px = [sc.P([1, 0, 0]), sc.P([0, 1, 0]), sc.P([0, 0, 1])];
  const B = mm([[px[0][0], px[1][0], px[2][0]], [px[0][1], px[1][1], px[2][1]]], A), G = mm(B, tr(B));
  const E = sym2(G[0][0], G[0][1], G[1][1]), a = Math.sqrt(Math.max(0, E.l[0])), b = Math.sqrt(Math.max(0, E.l[1])), u = E.u, w = perp(u), C = sc.P(c);
  S.path(Array.from({ length: 121 }, (_, k) => { const t = (TAU * k) / 120; return [C[0] + a * Math.cos(t) * u[0] + b * Math.sin(t) * w[0], C[1] + a * Math.cos(t) * u[1] + b * Math.sin(t) * w[1]]; }), { close: true, ...st });
}
// ---------- regions and boxes (7.109, 7.111) ----------
const ringOf = (rf, n = 360) => Array.from({ length: n }, (_, k) => { const t = (TAU * k) / n; return scl(uAt(t), rf(t)); });
const ellRing = (a, b, phi, n = 360) => Array.from({ length: n }, (_, k) => { const t = (TAU * k) / n; return mv(rot(phi), [a * Math.cos(t), b * Math.sin(t)]); });
/** Shoelace area of a closed polygon (positive for counter-clockwise). */
const polyArea = (P) => P.reduce((s, p, k) => s + cross2(p, P[(k + 1) % P.length]), 0) / 2;
/** Does the segment pq meet the closed rectangle [x0, x1] × [y0, y1]? (Liang–Barsky clipping.) */
function segHitsRect(p, q, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  const P = [-dx, dx, -dy, dy], Q = [p[0] - x0, x1 - p[0], p[1] - y0, y1 - p[1]];
  for (let i = 0; i < 4; i++) {
    if (P[i] === 0) { if (Q[i] < 0) return false; continue; }
    const r = Q[i] / P[i];
    if (P[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
/**
 * Classify the cells of the n×n grid of squares covering [−L, L]² against the region bounded by `rings` (even–odd
 * rule; coordinates already in the grid's frame): cells crossed by the boundary (exact segment tests), and cells
 * entirely inside (centre inside and not crossed). Returns {h, inn: [[i, j]], bnd: [[i, j]]}.
 */
function boxCells(rings, n, L) {
  const h = (2 * L) / n, bd = new Uint8Array(n * n), inn = [], bnd = [];
  const cellOf = (x) => Math.floor((x + L) / h);
  for (const R of rings) for (let k = 0; k < R.length; k++) {
    const p = R[k], q = R[(k + 1) % R.length];
    const i0 = Math.max(0, cellOf(Math.min(p[0], q[0]))), i1 = Math.min(n - 1, cellOf(Math.max(p[0], q[0])));
    const j0 = Math.max(0, cellOf(Math.min(p[1], q[1]))), j1 = Math.min(n - 1, cellOf(Math.max(p[1], q[1])));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (!bd[i * n + j] && segHitsRect(p, q, -L + i * h, -L + j * h, -L + (i + 1) * h, -L + (j + 1) * h)) bd[i * n + j] = 1;
  }
  for (let j = 0; j < n; j++) {
    const y = -L + (j + 0.5) * h, xs = [];
    for (const R of rings) for (let k = 0; k < R.length; k++) { const p = R[k], q = R[(k + 1) % R.length]; if ((p[1] > y) !== (q[1] > y)) xs.push(p[0] + ((y - p[1]) * (q[0] - p[0])) / (q[1] - p[1])); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      if (bd[i * n + j]) { bnd.push([i, j]); continue; }
      const x = -L + (i + 0.5) * h; let c = 0; for (const t of xs) { if (t < x) c++; else break; }
      if (c % 2) inn.push([i, j]);
    }
  }
  return { h, inn, bnd };
}

export default {
  collection: 'ladr',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.86
    {
      num: '7.86',
      kind: 'Definition',
      name: 'Norm of a linear map',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. The **norm** of $T$ is
$$\|T\| = \max\{\|Tv\| : v \in V \text{ and } \|v\| \le 1\},$$
the greatest length of the image of a vector in the closed unit ball. The maximum exists and equals the largest singular value $s_1$ of $T$: by 7.82 no such $\|Tv\|$ exceeds $s_1$, and $v = e_1$ from a singular value decomposition gives $\|Te_1\| = \|s_1f_1\| = s_1$.`,
      idea: String.raw`$\|T\|$ is the largest factor by which $T$ stretches a vector. In $W$, $T$ carries the closed unit ball onto a solid (possibly flattened) ellipsoid, and $\|T\|$ is the radius of the smallest ball centred at $0$ that contains it — its longest semi-axis. A maximum of infinitely many numbers need not exist; here it does because the ball is closed and contains $e_1$ (7.82 and the equation after it). Over the open ball $\|v\| < 1$ the numbers $\|Tv\|$ come arbitrarily close to $s_1$ without reaching it. The symbol $\|\cdot\|$ now has two meanings, the length of a vector and the norm of a map; the second generally does not come from an inner product on $\mathcal L(V, W)$.`,
      caption: String.raw`Drag $T(1,0)$ and $T(0,1)$ (right) to choose $T$, and the gold $v$ in the closed unit disk (left). Left: the disk shaded by $\|Tv\|$, with level curves; the dashed green curve $\|Tv\| = s_1$ touches the disk only at $\pm e_1$, where $v$ snaps. Right: $T(\text{disk})$ and the smallest circle around $0$ containing it, of radius $\|T\|$. Switch to the open disk: the rim is gone, $v$ can only approach it, and the largest value is never attained.`,
      deps: ['ladr-6.7', 'ladr-7.82'],
      see: ['pma-9.6', 'rca-5.2'],
      tags: ['norms'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Operator_norm' },
      viz(v) {
        const D = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, height: 340, minWidth: 260, ticks: false, title: 'in $V$: the unit disk, shaded by $\\|Tv\\|$' });
        const W = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, minWidth: 260, title: 'in $W$: $T(\\text{disk})$ and the radius $\\|T\\|$' });
        const PRE = { gen: [[1.3, 0.6], [0.5, -0.9]], rot: [[0.8, -0.6], [0.6, 0.8]], r1: [[1.2, 0.6], [0.8, 0.4]], zero: [[0, 0], [0, 0]] };
        const H = colHandles(W, PRE.gen);
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'rot', label: 'rotation' }, { value: 'r1', label: 'rank 1' }, { value: 'zero', label: 'zero map' }], 'gen', { onChange: (k) => H.set(PRE[k]) });
        const open = v.toggle('open disk $\\|v\\| < 1$ instead', false);
        const RO = 0.985;
        const vh = D.handle(0.45, 0.55, {
          color: 'gold', label: 'v', constrain: (x, y) => {
            let p = [x, y]; const r = len(p), R = open.value ? RO : 1;
            if (r > R) p = scl(p, R / r);
            if (!open.value) { const { s, e } = svd22(H.A); if (s[0] - s[1] > 1e-6) for (const sg of [1, -1]) if (len(sub(p, scl(e[0], sg))) < 0.1) p = scl(e[0], sg); }
            return p;
          },
        });
        let st = null;
        v.render(() => {
          const T = H.A, { s, e, f } = svd22(T), s1 = s[0], op = open.value;
          if (op && len([vh.x, vh.y]) > RO) { const p = scl(unit([vh.x, vh.y]), RO); vh.x = p[0]; vh.y = p[1]; }
          const key = [T.flat().map((x) => x.toFixed(3)).join(','), v.rgb('accent').join()].join('|');
          D.raster((x, y) => (x * x + y * y > 1 ? null : rgba(v, 'accent', 0.04 + 0.5 * (s1 > 1e-9 ? len(mv(T, [x, y])) / s1 : 0))), { key, res: 2 });
          // level curves ‖Tv‖ = c·s₁: in the direction u they sit at radius c·s₁/‖Tu‖
          const level = (c, rmax) => { const pts = []; for (let k = 0; k <= 360; k++) { const u = uAt((TAU * k) / 360), n = len(mv(T, u)), r = n > 1e-9 ? (c * s1) / n : Infinity; pts.push(r <= rmax ? scl(u, r) : null); } return pts; };
          if (s1 > 1e-9) {
            for (const c of [0.25, 0.5, 0.75]) D.path(level(c, 1), { color: 'accent', width: 1, alpha: 0.75 });
            D.path(level(1, 2), { color: 'green', width: 1.8, dash: [6, 4] });
          }
          D.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: op ? [4, 4] : false });
          if (s1 > 1e-9 && s[0] - s[1] > 1e-6) for (const sg of [1, -1]) D.dot(sg * e[0][0], sg * e[0][1], { color: 'green', r: 5, hollow: op });
          if (s1 > 1e-9 && s[0] - s[1] > 1e-6) { const lp = scl(e[0], e[0][1] >= 0 ? 1.22 : -1.22); D.tex('e_1', lp[0], lp[1], { color: 'green', size: 15 }); }
          const vv = [vh.x, vh.y], Tv = mv(T, vv);
          D.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          // W: the image of the disk and the smallest circle around 0 containing it
          W.circle(0, 0, s1, { color: 'green', width: 1.8, dash: [7, 4], fill: 'green', fillAlpha: 0.05 });
          if (s1 > 1e-9) W.path(ellPts(T), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.8, dash: op ? [5, 4] : false });
          else W.dot(0, 0, { color: 'accent', r: 5 });
          if (s1 > 1e-9) {
            for (const sg of [1, -1]) W.dot(sg * s1 * f[0][0], sg * s1 * f[0][1], { color: 'green', r: 5.5, hollow: op });
            let u = unit(sub(f[1], f[0])); if (u[1] < 0) u = scl(u, -1);
            const q = scl(u, s1), m = add(scl(q, 0.6), scl(perp(u), u[0] >= 0 ? 0.3 : -0.3));
            W.line(0, 0, q[0], q[1], { color: 'green', width: 1.6 });
            W.tex(`\\|T\\| = ${tn(s1)}`, m[0], m[1], { color: 'green', size: 14 });
          }
          if (len(Tv) > 0.02) { W.arrow(0, 0, Tv[0], Tv[1], { color: 'gold', width: 2.6 }); W.tex('Tv', Tv[0], Tv[1], { color: 'gold', size: 15, dx: 12 * Math.sign(Tv[0] || 1), dy: -10 }); }
          W.corner(s1 < 1e-9 ? 'T = 0: the image is {0} and ‖T‖ = 0' : op ? 'open disk: ‖Tv‖ comes close to ‖T‖, never reaches it' : 'the maximum is attained at v = ±e₁', 'bl', { color: op ? 'red' : 'muted', weight: 600, size: 11.5 });
          // brute-force search over a polar grid of the disk (closed: radii up to 1; open: up to 0.999)
          let mx = 0; const rM = op ? 0.999 : 1;
          for (let i = 1; i <= 20; i++) for (let k = 0; k < 360; k++) mx = Math.max(mx, len(mv(T, scl(uAt((Math.PI * k) / 360), (rM * i) / 20))));
          st = { s, nv: len(vv), nTv: len(Tv), op, mx };
        });
        v.legend([['accent', '$\\|Tv\\|$: shading and level curves', { area: true }], ['green', '$\\|Tv\\| = s_1$, radius $\\|T\\|$', { dash: true }], ['gold', '$v$ and $Tv$']]);
        v.readout(() => {
          if (!st) return '';
          const { s, nv, nTv, op, mx } = st, at = `$\\|v\\| = ${tn(nv, 3)}$, $\\|Tv\\| = ${tn(nTv, 3)}$. `;
          if (s[0] < 1e-9) return at + 'Here $T = 0$, so every $\\|Tv\\| = 0$ and $\\|T\\| = 0$.';
          if (op) return at + `Over the open disk every value is below $s_1 = ${tn(s[0], 3)}$ (largest found, at radius $0.999$: $${tn(mx, 4)}$). The supremum is $s_1$, but **no maximum exists** — that is why the definition uses $\\|v\\| \\le 1$.`;
          return at + `A search over the closed disk finds $\\max \\|Tv\\| = ${tn(mx, 4)}$, the largest singular value $s_1 = ${tn(s[0], 4)}$, reached on the rim at $\\pm e_1$: $\\|T\\| = ${tn(s[0], 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.87
    {
      num: '7.87',
      kind: 'Theorem',
      name: 'Basic properties of norms of linear maps',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $\|T\| \ge 0$;
(b) $\|T\| = 0$ if and only if $T = 0$;
(c) $\|\lambda T\| = |\lambda|\,\|T\|$ for every $\lambda \in \mathbf F$;
(d) $\|S + T\| \le \|S\| + \|T\|$ for every $S \in \mathcal L(V, W)$ (the triangle inequality).`,
      idea: String.raw`(a) Every $\|Tv\|$ is $\ge 0$. (b) If $\|T\| = 0$ then $Tv = 0$ whenever $\|v\| \le 1$; any $u \ne 0$ is $\|u\|$ times the unit vector $u/\|u\|$, so $Tu = \|u\|\,T(u/\|u\|) = 0$. (c) Each $\|\lambda Tv\| = |\lambda|\,\|Tv\|$ (6.9), and $|\lambda|$ comes out of the maximum. (d) Pick $v$ with $\|v\| \le 1$ at which $\|(S + T)v\|$ is largest; the triangle inequality in $W$ (6.17) gives $\|S + T\| = \|Sv + Tv\| \le \|Sv\| + \|Tv\| \le \|S\| + \|T\|$. Equality needs one unit vector that both $S$ and $T$ stretch the most, sending it in the same direction.`,
      caption: String.raw`Edit $S$ (left) and $T$ (middle) by dragging the images of the basis vectors, and move the gold unit vector $v$. Each panel shows the image of the unit circle with the circle of radius equal to the norm. Right: $(S + T)v$ is built tip to tail from $Sv$ (blue) and $Tv$ (orange), so it can never leave the dashed circle of radius $\|S\| + \|T\|$; the green circle is $\|S + T\|$. Try $T = S$ (equality), $T = -S$ and $T = 0$ (property (b)), and slide $\lambda$ to watch $\lambda T$ (dashed purple) scale by $|\lambda|$.`,
      deps: ['ladr-7.86', 'ladr-6.9', 'ladr-6.17'],
      tags: ['norms'],
      viz(v) {
        const mk = (title) => v.stage({ x: [-2.9, 2.9], y: [-2.9, 2.9], equal: true, height: 300, minWidth: 250, ticks: false, title });
        const PS = mk('$S$'), PT = mk('$T$ and $\\lambda T$'), PU = mk('$S + T$');
        const S0 = [[1.3, 0.4], [0.3, -0.8]], T0 = [[-0.3, 1.1], [1.0, 0.4]];
        const HS = colHandles(PS, S0, { l1: 'S(1,0)', l2: 'S(0,1)' });
        const HT = colHandles(PT, T0);
        v.select('', [{ value: 'gen', label: 'generic $T$' }, { value: 'same', label: '$T = S$' }, { value: 'opp', label: '$T = -S$' }, { value: 'zero', label: '$T = 0$' }], 'gen', {
          onChange: (k) => HT.set(k === 'gen' ? T0 : k === 'zero' ? [[0, 0], [0, 0]] : mscl(HS.A, k === 'opp' ? -1 : 1)),
        });
        const lam = v.slider('$\\lambda$', -2, 2, -0.6, { step: 0.05 });
        const vh = PS.handle(Math.cos(2.4), Math.sin(2.4), { color: 'gold', label: 'v', constrain: (x, y) => (Math.hypot(x, y) > 1e-9 ? unit([x, y]) : [1, 0]) });
        v.button('v = best for S + T', () => { const e1 = svd22(madd(HS.A, HT.A)).e[0]; vh.set(e1[0], e1[1]); });
        let st = null;
        v.render(() => {
          const S = HS.A, T = HT.A, U = madd(S, T), L = lam.value, LT = mscl(T, L);
          const nS = svd22(S).s[0], nT = svd22(T).s[0], nU = svd22(U).s[0], nL = svd22(LT).s[0];
          const u = [vh.x, vh.y], Su = mv(S, u), Tu = mv(T, u), Uu = add(Su, Tu);
          for (const P of [PS, PT, PU]) P.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 4] });
          const lab = (P, txt, p, c, o = 0.32) => { if (len(p) > 0.15) { const q = add(p, scl(unit(p), o)); P.tex(txt, q[0], q[1], { color: c, size: 14 }); } };
          // S
          PS.circle(0, 0, nS, { color: 'blue', width: 1.4, dash: [6, 4] });
          PS.path(ellPts(S), { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.8 });
          PS.arrow(0, 0, Su[0], Su[1], { color: 'blue', width: 2.6 }); lab(PS, 'Sv', Su, 'blue');
          PS.corner(`‖S‖ = ${pf(nS)}`, 'tl', { color: 'blue', weight: 700 });
          // T and λT
          PT.circle(0, 0, nT, { color: 'orange', width: 1.4, dash: [6, 4] });
          if (Math.abs(L) > 1e-9) { PT.path(ellPts(LT), { color: 'purple', width: 1.6, dash: [5, 4] }); PT.circle(0, 0, Math.abs(L) * nT, { color: 'purple', width: 1, dash: [2, 3], alpha: 0.8 }); }
          PT.path(ellPts(T), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.8 });
          PT.dot(u[0], u[1], { color: 'gold', r: 4.5 });
          PT.arrow(0, 0, Tu[0], Tu[1], { color: 'orange', width: 2.6 }); lab(PT, 'Tv', Tu, 'orange');
          PT.corner(`‖T‖ = ${pf(nT)}    ‖λT‖ = ${pf(nL)}`, 'tl', { color: 'orange', weight: 700 });
          // S + T: the triangle inequality, tip to tail
          PU.circle(0, 0, nS + nT, { color: 'ink', width: 1.4, dash: [7, 4], alpha: 0.7 });
          PU.circle(0, 0, nU, { color: 'green', width: 1.6, dash: [5, 3] });
          PU.path(ellPts(U), { fill: 'green', fillAlpha: 0.16, color: 'green', width: 1.8 });
          PU.arrow(0, 0, Su[0], Su[1], { color: 'blue', width: 2.2 });
          PU.arrow(Su[0], Su[1], Uu[0], Uu[1], { color: 'orange', width: 2.2 });
          PU.arrow(0, 0, Uu[0], Uu[1], { color: 'green', width: 2.8 }); lab(PU, '(S+T)v', Uu, 'green', 0.55);
          const eq = nS + nT - nU < 1e-6;
          PU.corner(`‖S + T‖ = ${pf(nU)} ${eq ? '=' : '<'} ‖S‖ + ‖T‖ = ${pf(nS + nT)}`, 'tl', { color: eq ? 'green' : 'ink', weight: 700, size: 11.5 });
          st = { nS, nT, nU, nL, L, isZero: maxAbs(T) < 1e-12, nSu: len(Su), nTu: len(Tu), nUu: len(Uu), eq };
        });
        v.legend([['blue', '$S$'], ['orange', '$T$'], ['purple', '$\\lambda T$', { dash: true }], ['green', '$S + T$'], ['ink', 'radius $\\|S\\| + \\|T\\|$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { nS, nT, nU, nL, L, isZero, nSu, nTu, nUu, eq } = st;
          return `(a) $\\|S\\| = ${tn(nS, 3)} \\ge 0$, $\\|T\\| = ${tn(nT, 3)} \\ge 0$. (b) ${isZero ? '$T = 0$ and $\\|T\\| = 0$.' : '$T \\ne 0$, and $\\|T\\| > 0$.'} (c) $\\|\\lambda T\\| = ${tn(nL, 3)} = |${tn(L)}| \\cdot ${tn(nT, 3)}$. (d) $\\|S + T\\| = ${tn(nU, 3)} ${eq ? '=' : '<'} ${tn(nS + nT, 3)} = \\|S\\| + \\|T\\|$; at $v$: $\\|(S+T)v\\| = ${tn(nUu, 3)} \\le \\|Sv\\| + \\|Tv\\| = ${tn(nSu + nTu, 3)}$.${eq && !isZero ? ' **Equality**: $S$ and $T$ stretch the same unit vector most, in the same direction.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.88
    {
      num: '7.88',
      kind: 'Theorem',
      name: 'Alternative formulas for ‖T‖',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $\|T\|$ equals the largest singular value of $T$;
(b) $\|T\| = \max\{\|Tv\| : v \in V \text{ and } \|v\| = 1\}$;
(c) $\|T\|$ is the smallest number $c$ such that $\|Tv\| \le c\|v\|$ for all $v \in V$.`,
      idea: String.raw`(a) is the computation that motivated 7.86: $\|Tv\| \le s_1\|v\|$ (7.82) and $\|Te_1\| = s_1$. (b) If $0 < \|v\| \le 1$, the unit vector $u = v/\|v\|$ has $\|Tu\| = \|Tv\|/\|v\| \ge \|Tv\|$, so the maximum over the ball is attained on the sphere. (c) Scaling a nonzero $v$ to length $1$ gives $\|Tv\| \le \|T\|\,\|v\|$, so $c = \|T\|$ works; conversely, if $\|Tv\| \le c\|v\|$ for all $v$, then $\|Tv\| \le c$ on the ball and so $\|T\| \le c$. In practice (a) is how $\|T\|$ is computed: find the largest eigenvalue of $T^*T$ and take its square root.`,
      caption: String.raw`$T$ is an operator on $\mathbf R^3$. Left: one dot $(\|v\|, \|Tv\|)$ for each of 240 random vectors. Drag the orange handle to change the slope $c$: dots above the line $y = cx$ (red) break $\|Tv\| \le c\|v\|$. Lower $c$ until red appears — it does exactly when $c < \|T\|$ (the handle snaps at $c = \|T\|$; the green line has slope $s_1$ and holds the vectors $te_1$). Right (drag the background to rotate): the unit vectors $v/\|v\|$ are sent to $T(v/\|v\|)$ on the ellipsoid $T(\text{sphere})$; the red ones stick out of the orange sphere of radius $c$, which can only contain the ellipsoid once $c \ge s_1$, its longest semi-axis.`,
      deps: ['ladr-7.86', 'ladr-7.82'],
      tags: ['norms', 'singular values'],
      viz(v) {
        const M = v.M, XC = 1.6, XR = 1.75;
        const G = v.stage({ x: [0, XR], y: [0, 3.5], height: 360, minWidth: 270, axes: 'box', xlabel: '‖v‖', title: 'one dot $(\\|v\\|, \\|Tv\\|)$ per sample $v$' });
        const S = v.stage({ x: [-2.25, 2.25], y: [-2.05, 2.45], equal: true, axes: false, height: 360, minWidth: 290, weight: 1.15, title: 'unit vectors $u$ go to $Tu$; sphere of radius $c$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.25, lim: 2 });
        const usv = (R1, s, R2) => mm(R1, mm(DIAG3(s), tr(R2)));
        const R1 = rot3([1, 2, 0.5], 0.8), R2 = rot3([0.3, -1, 1], 0.9), R3 = rot3([1, 1, 0], 0.7);
        const PRE = { gen: usv(R1, [1.8, 0.95, 0.45], R2), sym: usv(R3, [1.6, 0.8, 0.4], R3), thin: usv(R2, [1.7, 0.25, 0.1], R1), rot: rot3([1, 1, 1], 1) };
        let T = PRE.gen, seed = 7, samples = [];
        const resample = () => { const r = v.rng(seed++); samples = Array.from({ length: 240 }, () => scl(unit([r.normal(), r.normal(), r.normal()]), 0.06 + 1.6 * r())); };
        resample();
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'sym', label: 'symmetric' }, { value: 'thin', label: 'nearly rank 1' }, { value: 'rot', label: 'a rotation' }], 'gen', { onChange: (k) => { T = PRE[k]; } });
        v.button('Resample', resample);
        let s1now = 1;
        const ch = G.handle(XC, XC * 1.2, { color: 'orange', label: 'c', labelPos: 'w', constrain: (x, y) => { let c = Math.max(0.05, y / XC); if (Math.abs(c - s1now) < 0.04) c = s1now; return [XC, c * XC]; } });
        let st = null;
        v.render(() => {
          const sv = svd3(M, T), s1 = (s1now = sv.s[0]), c = ch.y / XC;
          const data = samples.map((p) => { const n = len(p), Tp = mv(T, p); return { n, m: len(Tp), dir: scl(Tp, 1 / n) }; });
          const isBad = (d) => d.m > c * d.n + 1e-12, bad = data.filter(isBad), good = data.filter((d) => !isBad(d));
          // left: the scatter and the line y = cx
          G.clip(() => {
            G.poly([[0, 0], [XR, XR * c], [XR, 99], [0, 99]], { fill: 'red', fillAlpha: 0.06, stroke: false });
            G.line(0, 0, XR, XR * s1, { color: 'green', width: 1.8, dash: [7, 4] });
            G.dots(good.map((d) => [d.n, d.m]), { color: 'accent', r: 2.6, alpha: 0.75 });
            G.dots(bad.map((d) => [d.n, d.m]), { color: 'red', r: 3.2 });
            G.line(0, 0, XR, XR * c, { color: 'orange', width: 2.2 });
          });
          G.vline(1, { color: 'muted', width: 1, dash: [4, 4] });
          G.dot(1, s1, { color: 'green', r: 5.5, label: `(b) max at ‖v‖ = 1: ${pf(s1)}`, labelPos: 'nw', labelColor: 'green', math: false });
          G.corner(bad.length ? `c = ${pf(c)}: ${bad.length} samples break ‖Tv‖ ≤ c‖v‖` : `c = ${pf(c)}: ‖Tv‖ ≤ c‖v‖ for every sample`, 'tl', { color: bad.length ? 'red' : 'green', weight: 700, size: 11.5 });
          // right: T(unit sphere) against the sphere of radius c
          sc.begin();
          S.circle(0, 0, c, { color: 'orange', width: 1.6, dash: [6, 4], fill: 'orange', fillAlpha: 0.04 });
          silhouette(sc, S, T, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.3 });
          sphereWire(sc, c, { color: 'orange', alpha: 0.45 });
          sphereImage(sc, T, { color: 'accent', width: 1, alpha: 0.35 });
          const t1 = scl(sv.f[0], s1);
          sc.line(scl(t1, -1), t1, { color: 'green', width: 1.2, dash: [4, 4] });
          sc.arrow(ZERO, t1, { color: 'green', width: 2.8 });
          sc.tex('s_1f_1', scl(sv.f[0], s1 + 0.25), { color: 'green', size: 14 });
          sc.dots(good.map((d) => d.dir), { color: 'accent', r: 1.9, alpha: 0.7 });
          sc.dots(bad.map((d) => d.dir), { color: 'red', r: 2.4 });
          sc.flush();
          // (b) by brute force over a grid on the unit sphere
          let mx = 0;
          for (let i = 0; i <= 90; i++) { const th = (Math.PI * i) / 90, z = Math.cos(th), r = Math.sin(th); for (let k = 0; k < 180; k++) { const ph = (TAU * k) / 180; mx = Math.max(mx, len(mv(T, [r * Math.cos(ph), r * Math.sin(ph), z]))); } }
          const ratio = Math.max(...data.map((d) => d.m / d.n));
          st = { ev: M.eigSym(mm(tr(T), T)).values, s1, mx, c, nb: bad.length, ratio };
        });
        v.legend([['accent', 'samples within the bound'], ['red', 'samples with $\\|Tv\\| > c\\|v\\|$'], ['orange', 'slope / radius $c$'], ['green', 'slope / semi-axis $s_1$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ev, s1, mx, c, nb, ratio } = st;
          return `(a) $T^*T$ has eigenvalues $${ev.map((x) => tn(x, 3)).join(', ')}$, so $s_1 = \\sqrt{${tn(ev[0], 3)}} = ${tn(s1, 4)}$. (b) A grid search over the unit sphere gives $\\max \\|Tu\\| = ${tn(mx, 4)}$. (c) The largest ratio $\\|Tv\\|/\\|v\\|$ among the samples is $${tn(ratio, 4)} \\le s_1$; with $c = ${tn(c, 3)}$, ${nb ? `${nb} samples violate the bound — $c$ is too small` : 'no sample violates the bound'}. All three formulas give $\\|T\\| = ${tn(s1, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.91
    {
      num: '7.91',
      kind: 'Theorem',
      name: 'Norm of the adjoint',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then $\|T^*\| = \|T\|$.`,
      idea: String.raw`For $w \in W$, Cauchy–Schwarz (6.14) and the bound $\|Tx\| \le \|T\|\,\|x\|$ give
$$\|T^*w\|^2 = \langle TT^*w, w\rangle \le \|TT^*w\|\,\|w\| \le \|T\|\,\|T^*w\|\,\|w\|,$$
so $\|T^*w\| \le \|T\|\,\|w\|$ and $\|T^*\| \le \|T\|$ by 7.88(c). Applying this to $T^*$ and using $(T^*)^* = T$ (7.5) gives the reverse inequality. Geometrically, $T$ and $T^*$ have the same positive singular values (swap the $e$'s and the $f$'s, 7.75), so the images of the unit ball have equally long longest semi-axes, even though they point in different directions.`,
      caption: String.raw`Drag $T(1,0)$, $T(0,1)$ and the gold $w$. Left: the images of the unit circle under $T$ (blue) and under $T^*$ (orange) — different ellipses, which touch the green circle of radius $s_1$ at different places. Right: $\|Tu\|$ and $\|T^*u\|$ for every unit vector $u$; the curves differ but have the same maximum. Break it: switch to the *transpose in a skewed basis* — write $T$ in a basis $b_1, b_2$ that is not orthonormal, transpose that matrix and read it back (red). That is not the adjoint (7.9 needs an orthonormal basis), and its norm is different.`,
      deps: ['ladr-7.88', 'ladr-7.5', 'ladr-6.14'],
      see: ['fa-4.10', 'ladr-7.9'],
      tags: ['norms', 'adjoint'],
      viz(v) {
        const S = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 360, minWidth: 290, weight: 1.1 });
        const G = v.stage({ x: [0, Math.PI], y: [0, 3], height: 360, minWidth: 260, axes: 'box', xlabel: 'direction of u', xticks: PI_TICKS, title: '$\\|Tu\\|$ and $\\|T^*u\\|$ for unit $u$' });
        const H = colHandles(S, [[1.2, 1.1], [-0.2, 0.6]]);
        const mode = v.select('', [{ value: 'adj', label: 'the adjoint $T^*$' }, { value: 'skew', label: 'transpose in a skewed basis' }], 'adj');
        const al = v.slider('angle between $b_1$ and $b_2$', 0.4, 1.5708, 0.7, { step: 0.01 });
        const wh = S.handle(-1.3, 0.9, { color: 'gold', label: 'w' });
        let st = null;
        v.render(() => {
          const T = H.A, Ts = tr(T), sk = mode.value === 'skew'; al.el.hidden = !sk;
          const a = al.value, P = [[1, Math.cos(a)], [0, Math.sin(a)]], N = mm(P, mm(tr(mm(inv2(P), mm(T, P))), inv2(P)));
          const sT = svd22(T), sS = svd22(Ts), sN = svd22(N), s1 = sT.s[0];
          S.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 4] });
          S.circle(0, 0, s1, { color: 'green', width: 1.8, dash: [7, 4], fill: 'green', fillAlpha: 0.04 });
          if (sk) {
            S.path(ellPts(N), { color: 'red', width: 2, dash: [6, 4] });
            S.circle(0, 0, sN.s[0], { color: 'red', width: 1, dash: [2, 3], alpha: 0.8 });
            [[1, 0], [Math.cos(a), Math.sin(a)]].forEach((b, k) => { S.arrow(0, 0, b[0], b[1], { color: 'red', width: 1.6, alpha: 0.6 }); S.tex(`b_${k + 1}`, b[0] * 1.18, b[1] * 1.18 + (k ? 0 : -0.15), { color: 'red', size: 13 }); });
          }
          S.path(ellPts(Ts), { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 1.8 });
          S.path(ellPts(T), { fill: 'blue', fillAlpha: 0.13, color: 'blue', width: 1.8 });
          for (const sg of [1, -1]) { S.dot(sg * s1 * sT.f[0][0], sg * s1 * sT.f[0][1], { color: 'blue', r: 5 }); S.dot(sg * s1 * sS.f[0][0], sg * s1 * sS.f[0][1], { color: 'orange', r: 5 }); }
          const w = [wh.x, wh.y], Tsw = mv(Ts, w);
          S.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.2 });
          if (len(Tsw) > 0.05) { S.arrow(0, 0, Tsw[0], Tsw[1], { color: 'orange', width: 2.6 }); S.tex('T^*w', Tsw[0], Tsw[1], { color: 'orange', size: 14, dx: 16 * Math.sign(Tsw[0] || 1), dy: -10 }); }
          S.corner(`‖T‖ = ${pf(s1, 3)}   ‖T*‖ = ${pf(sS.s[0], 3)}${sk ? `   ‖skewed transpose‖ = ${pf(sN.s[0], 3)}` : ''}`, 'tl', { color: 'ink', weight: 700, size: 11.5 });
          // the two (or three) stretch profiles
          const ymax = Math.max(1.2, 1.18 * Math.max(s1, sk ? sN.s[0] : 0));
          G.setView(null, [0, ymax]);
          G.hline(s1, { color: 'green', width: 1.6, dash: [7, 4] });
          G.fn((t) => len(mv(T, uAt(t))), { color: 'blue', width: 2.4 });
          G.fn((t) => len(mv(Ts, uAt(t))), { color: 'orange', width: 2.4 });
          if (sk) G.fn((t) => len(mv(N, uAt(t))), { color: 'red', width: 2, dash: [6, 4] });
          G.dot(modPi(angOf(sT.e[0])), s1, { color: 'blue', r: 5 });
          G.dot(modPi(angOf(sS.e[0])), s1, { color: 'orange', r: 5 });
          G.text(`s₁ = ${pf(s1)}`, 0.06, s1, { dy: -11, color: 'green', size: 12, weight: 600 });
          // the chain of inequalities in the proof, at w
          const TTw = mv(T, Tsw), nw = len(w), a2 = dot(Tsw, Tsw);
          st = { s1, sS: sS.s[0], sN: sN.s[0], sk, a2, ip: dot(TTw, w), m1: len(TTw) * nw, m2: s1 * len(Tsw) * nw, nTsw: len(Tsw), nw };
        });
        v.legend([['blue', '$T$'], ['orange', '$T^*$'], ['red', 'transpose in a skewed basis', { dash: true }], ['green', '$s_1 = \\|T\\| = \\|T^*\\|$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { s1, sS, sN, sk, a2, ip, m1, m2, nTsw, nw } = st;
          const chain = `At $w$: $\\|T^*w\\|^2 = ${tn(a2, 3)} = \\langle TT^*w, w\\rangle = ${tn(ip, 3)} \\le \\|TT^*w\\|\\|w\\| = ${tn(m1, 3)} \\le \\|T\\|\\|T^*w\\|\\|w\\| = ${tn(m2, 3)}$, so $\\|T^*w\\| = ${tn(nTsw, 3)} \\le \\|T\\|\\|w\\| = ${tn(s1 * nw, 3)}$.`;
          return `$\\|T\\| = ${tn(s1, 4)}$ and $\\|T^*\\| = ${tn(sS, 4)}$. ${chain}${sk ? ` The skewed "transpose" has norm $${tn(sN, 4)}$${Math.abs(sN - s1) > 1e-6 ? ' $\\ne \\|T\\|$: it is **not** the adjoint' : ''}.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.92
    {
      num: '7.92',
      kind: 'Theorem',
      name: 'Best approximation by a map of rank at most k',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$ has positive singular values $s_1 \ge \cdots \ge s_m$, and $1 \le k < m$. Then
$$\min\{\|T - S\| : S \in \mathcal L(V, W) \text{ and } \dim \operatorname{range} S \le k\} = s_{k+1}.$$
Moreover, if $Tv = s_1\langle v, e_1\rangle f_1 + \cdots + s_m\langle v, e_m\rangle f_m$ is a singular value decomposition and $T_kv = s_1\langle v, e_1\rangle f_1 + \cdots + s_k\langle v, e_k\rangle f_k$, then $\dim \operatorname{range} T_k = k$ and $\|T - T_k\| = s_{k+1}$: cutting the decomposition off after $k$ terms gives a best approximation.`,
      idea: String.raw`Since $(T - T_k)v = \sum_{j > k} s_j\langle v, e_j\rangle f_j$, the argument of 7.82 (6.24 and Bessel's inequality) gives $\|(T - T_k)v\| \le s_{k+1}\|v\|$, with equality at $v = e_{k+1}$. Conversely, if $\dim \operatorname{range} S \le k$, the $k + 1$ vectors $Se_1, \dots, Se_{k+1}$ are linearly dependent, so some nonzero $z = a_1e_1 + \cdots + a_{k+1}e_{k+1}$ has $Sz = 0$. On that witness $\|(T - S)z\|^2 = \|Tz\|^2 = \sum_{j \le k+1} s_j^2|a_j|^2 \ge s_{k+1}^2\|z\|^2$, so $\|T - S\| \ge s_{k+1}$. In the plane with $k = 1$: a rank-one $S$ kills a whole line, and on that line $T$ still stretches by at least $s_2$.`,
      caption: String.raw`Try to beat the theorem in $\mathbf R^2$ ($k = 1$). A rank-one map $S = b\langle\cdot, a\rangle$ is set by the unit vector $a$ (left; it snaps to $e_1$) and the vector $b$ (right). Right: $T(\text{circle})$ (dashed), $S(\text{circle})$ (the orange segment) and the error ellipse $(T - S)(\text{circle})$ (purple), whose largest semi-axis $\|T - S\|$ never gets inside the green circle of radius $s_2$. The witness $z$ spans $\operatorname{null} S$, and the gold arrow $(T - S)z = Tz$ always reaches the green circle. Bottom: the best error possible for each direction of $a$, and yours above it. *S = T₁* jumps to the optimum, error exactly $s_2$.`,
      deps: ['ladr-7.70', 'ladr-7.86', 'ladr-7.88', 'ladr-6.24'],
      tags: ['singular values', 'approximation'],
      credit: 'Schmidt, 1907; Eckart & Young, 1936; Mirsky, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Low-rank_approximation' },
      viz(v) {
        const V = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 320, minWidth: 240, title: 'in $V$: $a$, $\\operatorname{null} S$ and the witness $z$' });
        const W = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 320, minWidth: 280, weight: 1.25, title: 'in $W$: $T$, $S$ and the error $T - S$' });
        const G = v.stage({ x: [0, Math.PI], y: [0, 2.4], height: 175, full: true, axes: 'box', xlabel: 'direction of a', xticks: PI_TICKS, title: 'best error with this $a$: $\\min_b \\|T - b\\langle\\cdot, a\\rangle\\| = \\|Ta^\\perp\\|$' });
        const sv = (s1, s2, th, ph) => mm(rot(th), mm([[s1, 0], [0, s2]], rot(-ph)));
        const PRE = { gen: sv(2, 0.7, 0.9, 0.5), close: sv(1.5, 1.15, -0.4, -0.7), far: sv(2.1, 0.3, 2.2, 1.1) };
        let T = PRE.gen;
        v.select('', [{ value: 'gen', label: '$s_1 = 2,\\ s_2 = 0.7$' }, { value: 'close', label: '$s_1 = 1.5,\\ s_2 = 1.15$' }, { value: 'far', label: '$s_1 = 2.1,\\ s_2 = 0.3$' }], 'gen', { onChange: (k) => { T = PRE[k]; } });
        const ah = V.handle(Math.cos(1.9), Math.sin(1.9), {
          color: 'orange', label: 'a', constrain: (x, y) => {
            let t = Math.atan2(y, x); const te = angOf(svd22(T).e[0]);
            for (let k = -2; k <= 2; k++) if (Math.abs(t - (te + k * Math.PI)) < 0.06) t = te + k * Math.PI;
            return uAt(t);
          },
        });
        const bh = W.handle(-0.7, 1.1, { color: 'orange', label: 'b' });
        v.button('best b for this a', () => { const b = mv(T, [ah.x, ah.y]); bh.set(b[0], b[1]); });
        v.button('S = T₁', () => { const { s, e, f } = svd22(T); ah.set(e[0][0], e[0][1]); bh.set(s[0] * f[0][0], s[0] * f[0][1]); });
        let st = null;
        v.render(() => {
          const { s, e, f } = svd22(T), a = [ah.x, ah.y], b = [bh.x, bh.y];
          const E = msub(T, outer(b, a)), nE = svd22(E).s[0];
          const live = len(b) > 1e-9, z = live ? perp(a) : e[0], Tz = mv(T, z);
          // V: the direction a, the null space of S and the witness z
          V.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          e.forEach((u, k) => { V.line(-1.6 * u[0], -1.6 * u[1], 1.6 * u[0], 1.6 * u[1], { color: k ? 'purple' : 'blue', width: 1, alpha: 0.4, dash: [4, 4] }); const lp = scl(u, u[1] >= 0 ? 1.35 : -1.35); V.tex(`e_${k + 1}`, lp[0], lp[1], { color: k ? 'purple' : 'blue', size: 14, dx: 10 }); });
          if (live) { V.line(-2 * z[0], -2 * z[1], 2 * z[0], 2 * z[1], { color: 'red', width: 6, alpha: 0.22 }); const lp = add(scl(z, 1.5), scl(a, -0.2)); V.tex('\\operatorname{null} S', lp[0], lp[1], { color: 'red', size: 13 }); rightMark(V, a, z, 0.13, 'muted'); }
          V.arrow(0, 0, a[0], a[1], { color: 'orange', width: 2.4 });
          V.arrow(0, 0, z[0], z[1], { color: 'gold', width: 2.8 });
          const zl = add(scl(z, 1.12), scl(a, -0.16));
          V.tex('z', zl[0], zl[1], { color: 'gold', size: 15 });
          // W: T, S, and the error T − S against the circle of radius s₂
          W.circle(0, 0, s[1], { color: 'green', width: 2, fill: 'green', fillAlpha: 0.08 });
          W.path(ellPts(T), { color: 'accent', width: 1.3, alpha: 0.6, dash: [4, 3] });
          W.path(ellPts(E), { fill: 'purple', fillAlpha: 0.16, color: 'purple', width: 2 });
          W.circle(0, 0, nE, { color: 'purple', width: 1.2, dash: [6, 4] });
          W.line(-b[0], -b[1], b[0], b[1], { color: 'orange', width: 4, alpha: 0.55 });
          W.arrow(0, 0, Tz[0], Tz[1], { color: 'gold', width: 2.8 });
          const tl = add(scl(unit(Tz), len(Tz) + 0.2), scl(perp(unit(Tz)), 0.18));
          W.tex('Tz', tl[0], tl[1], { color: 'gold', size: 14 });
          const opt = nE - s[1] < 1e-6;
          W.corner(`‖T − S‖ = ${pf(nE, 3)} ${opt ? '=' : '>'} s₂ = ${pf(s[1], 3)}`, 'tl', { color: opt ? 'green' : 'purple', weight: 700, size: 11.5 });
          // G: the best error for each direction of a
          const best = (t) => len(mv(T, perp(uAt(t)))), ymax = Math.max(1.6, 1.12 * s[0]);
          G.setView(null, [0, ymax]);
          G.hline(s[1], { color: 'green', width: 1.6, dash: [7, 4] });
          G.text(`s₂ = ${pf(s[1])}`, 0.05, s[1], { color: 'green', dy: -10, size: 12, weight: 600 });
          G.fn(best, { color: 'accent', width: 2.4 });
          const te = modPi(angOf(e[0])), ta = modPi(angOf(a));
          G.vline(te, { color: 'blue', width: 1, dash: [3, 4] });
          G.text('a = ±e₁', te, ymax * 0.93, { color: 'blue', size: 11.5, align: te > 2.6 ? 'right' : 'left', dx: te > 2.6 ? -6 : 6, weight: 600 });
          G.dot(te, s[1], { color: 'green', r: 5 });
          const yE = Math.min(nE, ymax * 0.98);
          G.line(ta, best(ta), ta, yE, { color: 'orange', width: 1.4, dash: [3, 3] });
          G.dot(ta, best(ta), { color: 'accent', r: 4 });
          G.dot(ta, yE, { color: 'orange', r: 5.5, label: 'your S', labelPos: 'n', labelColor: 'orange', math: false });
          st = { s, nE, nTz: len(Tz), bestA: best(angOf(a)), opt, live };
        });
        v.legend([['purple', '$(T - S)(\\text{circle})$, radius $\\|T - S\\|$', { area: true }], ['orange', '$S(\\text{circle})$ and $a$'], ['green', 'radius $s_2$', { area: true }], ['gold', 'witness $z$ and $(T - S)z = Tz$'], ['accent', '$T(\\text{circle})$ / best error', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { s, nE, nTz, bestA, opt, live } = st;
          const wit = live ? `$z \\perp a$ spans $\\operatorname{null} S$, and $\\|(T - S)z\\| = \\|Tz\\| = ${tn(nTz, 3)} \\ge s_2$` : `$S = 0$ kills everything; with $z = e_1$, $\\|Tz\\| = ${tn(nTz, 3)} \\ge s_2$`;
          return `$S = b\\langle\\cdot, a\\rangle$ has rank $${live ? 1 : 0} \\le 1$: $\\|T - S\\| = ${tn(nE, 3)}$ (best with this $a$: $${tn(bestA, 3)}$) $\\ge s_2 = ${tn(s[1], 3)}$. Witness: ${wit}.${opt ? ' This is $T_1 = s_1\\langle\\cdot, e_1\\rangle f_1$: the error is **exactly** $s_2$.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.93
    {
      num: '7.93',
      kind: 'Theorem',
      name: 'Polar decomposition',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then there exists a unitary operator $S \in \mathcal L(V)$ such that
$$T = S\sqrt{T^*T}.$$`,
      idea: String.raw`Take a singular value decomposition $Tv = s_1\langle v, e_1\rangle f_1 + \cdots + s_m\langle v, e_m\rangle f_m$ (7.70) and extend both orthonormal lists to orthonormal bases $e_1, \dots, e_n$ and $f_1, \dots, f_n$ of $V$ (6.36). The operator $Sv = \sum_{k=1}^n \langle v, e_k\rangle f_k$ sends one orthonormal basis to another, so $\|Sv\| = \|v\|$: it is unitary (7.51). Since $T^*Tv = \sum_k s_k^2\langle v, e_k\rangle e_k$ (by 7.75), the positive operator $v \mapsto \sum_k s_k\langle v, e_k\rangle e_k$ squares to $T^*T$, so it is $\sqrt{T^*T}$ (7.39); and then $S\sqrt{T^*T}v = \sum_k s_k\langle v, e_k\rangle f_k = Tv$. It is the operator version of $z = \frac{z}{|z|}\,|z|$: a stretch along perpendicular axes, then a rigid motion. When $T$ is not invertible the extension of the $f$'s, and hence $S$, is not unique.`,
      caption: String.raw`Drag $T(1,0)$ and $T(0,1)$ to choose $T$ and watch: the plane (grid, unit circle, letter F) is first stretched by the positive operator $\sqrt{T^*T}$ — by $s_1, s_2$ along the perpendicular axes $e_1, e_2$ — and then moved rigidly by the unitary $S$ (a rotation, or a mirror flip when $\det T < 0$). It lands exactly on the dashed target $T(\text{picture})$. Break it: put $\sqrt{TT^*}$ first, or flip $f_2$ in $S$ — the result misses the target (red) unless $T$ is normal, resp. not invertible. Click the timeline to jump.`,
      deps: ['ladr-7.70', 'ladr-7.75', 'ladr-6.36', 'ladr-7.51', 'ladr-7.39'],
      see: ['fa-12.35'],
      tags: ['factorization', 'positivity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polar_decomposition' },
      viz(v) {
        const S = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, height: 390, minWidth: 330, weight: 1.6 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, minWidth: 230, title: 'the two factors' });
        const TL = v.stage({ x: [0, 10], y: [0, 1], height: 56, full: true, axes: false });
        const PRE = { gen: [[0.9, -1.2], [1.4, 0.2]], ref: [[0.5, 1.4], [1.3, -0.2]], r1: [[1.4, 0.7], [0.6, 0.3]], cx: [[1.1, -0.8], [0.8, 1.1]] };
        const H = colHandles(S, PRE.gen);
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'ref', label: '$\\det T < 0$' }, { value: 'r1', label: 'rank 1' }, { value: 'cx', label: 'normal (a complex number)' }], 'gen', { onChange: (k) => H.set(PRE[k]) });
        const which = v.select('positive factor', [{ value: 'r', label: '$\\sqrt{T^*T}$' }, { value: 'w', label: '$\\sqrt{TT^*}$ (wrong)' }], 'r');
        const flip = v.toggle('replace $f_2$ by $-f_2$ in $S$', false);
        TL.onClick((x) => { v.pause(); v.t = Math.max(0, Math.min(9.99, x)); });
        const F = [[-0.32, -0.6], [-0.12, -0.6], [-0.12, -0.08], [0.24, -0.08], [0.24, 0.1], [-0.12, 0.1], [-0.12, 0.42], [0.36, 0.42], [0.36, 0.6], [-0.32, 0.6]];
        let st = null;
        v.animate((t) => {
          const T = H.A, { s, e, f } = svd22(T), f2 = flip.value ? scl(f[1], -1) : f[1];
          const P = madd(mscl(outer(e[0], e[0]), s[0]), mscl(outer(e[1], e[1]), s[1]));
          const Q = madd(mscl(outer(f[0], f[0]), s[0]), mscl(outer(f[1], f[1]), s[1]));
          const U = madd(outer(f[0], e[0]), outer(f2, e[1])), dU = U[0][0] * U[1][1] - U[0][1] * U[1][0];
          const wrong = which.value === 'w', Pos = wrong ? Q : P, axes = wrong ? f : e;
          const u1 = smooth((t - 1) / 2.5), u2 = smooth((t - 4.5) / 2.5), phi = Math.atan2(U[1][0], U[0][0]);
          const Su = dU > 0 ? rot(phi * u2) : mm(mm(rot(phi / 2), [[1, 0], [0, 1 - 2 * u2]]), rot(-phi / 2));
          const L = mm(Su, madd([[1, 0], [0, 1]], mscl(msub(Pos, [[1, 0], [0, 1]]), u1)));
          const final = mm(U, Pos), err = maxAbs(msub(final, T)), miss = err > 1e-6;
          // the moving grid, unit circle and letter
          for (let i = -6; i <= 6; i++) {
            const a = mv(L, [i, -6]), b = mv(L, [i, 6]), c = mv(L, [-6, i]), d = mv(L, [6, i]);
            S.line(a[0], a[1], b[0], b[1], { color: 'accent', width: i ? 1 : 1.6, alpha: i ? 0.13 : 0.3 });
            S.line(c[0], c[1], d[0], d[1], { color: 'accent', width: i ? 1 : 1.6, alpha: i ? 0.13 : 0.3 });
          }
          const tc = t > 7.2 && miss ? 'red' : 'muted';
          S.path(ellPts(T), { color: tc, width: 1.4, dash: [6, 4] });
          S.poly(F.map((p) => mv(T, p)), { color: tc, width: 1.4, dash: [4, 3] });
          S.path(ellPts(L), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2 });
          S.poly(F.map((p) => mv(L, p)), { fill: 'ink', fillAlpha: 0.45, color: 'ink', width: 1.2 });
          // what is happening now: stretch axes, then the rotation arc or the mirror line
          if (t >= 0.5 && t < 4.2) axes.forEach((d, k) => {
            const c = k ? 'purple' : 'blue';
            S.line(-3.5 * d[0], -3.5 * d[1], 3.5 * d[0], 3.5 * d[1], { color: 'orange', width: 1.2, dash: [6, 4], alpha: 0.7 });
            const lp = scl(d, d[1] < -1e-9 || (Math.abs(d[1]) < 1e-9 && d[0] < 0) ? -2.05 : 2.05);
            S.text(`×${pf(1 + (s[k] - 1) * u1)}`, lp[0], lp[1], { color: 'orange', size: 12.5, weight: 700, align: 'center' });
          });
          if (t >= 4.2 && t < 7.4) {
            if (dU > 0) S.curve((x) => scl(uAt(x * phi * u2), 0.55), 0, 1, { color: 'purple', width: 2.2 });
            else { const m = uAt(phi / 2); S.line(-3.5 * m[0], -3.5 * m[1], 3.5 * m[0], 3.5 * m[1], { color: 'purple', width: 1.6, dash: [7, 4] }); }
          }
          axes.forEach((d, k) => {
            const c = k ? 'purple' : 'blue', w = mv(L, d);
            if (len(w) < 0.03) return;
            S.arrow(0, 0, w[0], w[1], { color: c, width: 3 });
            const phase = t < 1 ? 0 : t < 4.5 ? 1 : 2, nm = wrong ? 'f' : 'e';
            const lab = phase === 0 ? `${nm}_${k + 1}` : phase === 1 ? `s_${k + 1}${nm}_${k + 1}` : `S(s_${k + 1}${nm}_${k + 1})`;
            const lp = add(w, scl(unit(w), 0.36));
            S.tex(lab, lp[0], lp[1], { color: c, size: 14 });
          });
          const msg = t < 1 ? 'the picture, with the axes of the positive factor' : t < 4.2 ? `1 · stretch by ${wrong ? '√(TT*)' : '√(T*T)'} along perpendicular axes` : t < 7.4 ? `2 · rigid motion S: ${dU > 0 ? `rotation by ${pf(phi * DEG, 0)}°` : 'reflection in the purple line'}` : miss ? 'missed: this is not T(picture)' : 'done: S√(T*T) = T';
          S.corner(msg, 'tl', { color: t >= 7.4 ? (miss ? 'red' : 'green') : 'muted', weight: 700 });
          // timeline
          const PH = [[1, 3.5, `1 · stretch by ${wrong ? '√(TT*)' : '√(T*T)'}`, 'orange'], [4.5, 7, `2 · ${dU > 0 ? 'rotate' : 'reflect'} by S`, 'purple']];
          TL.rect(0, 0.28, 10, 0.72, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          for (const [a, b, lab, c] of PH) { TL.rect(a, 0.28, b, 0.72, { fill: c, fillAlpha: 0.22, stroke: false }); TL.text(lab, (a + b) / 2, 0.5, { align: 'center', size: 11.5 }); }
          TL.text(miss ? 'result ≠ T' : 'result = T', 8.6, 0.5, { align: 'center', size: 11.5, color: miss ? 'red' : 'green', weight: 700 });
          TL.line(t, 0.08, t, 0.92, { color: 'gold', width: 3 });
          // the factors as matrices
          for (const y of [0.74, 0.47, 0.2]) R.line(0.05, y, 0.95, y, { color: 'grid', width: 1 });
          R.tex(`T = ${mtex(T)}`, 0.5, 0.87, { size: 15 });
          R.tex(`${wrong ? '\\sqrt{TT^*}' : '\\sqrt{T^*T}'} = ${mtex(Pos)}`, 0.5, 0.65, { size: 14.5, color: 'orange' });
          R.text(`positive: eigenvalues ${pf(s[0])}, ${pf(s[1])} on ${wrong ? 'f₁, f₂' : 'e₁, e₂'}`, 0.5, 0.535, { size: 11.5, color: 'muted', align: 'center' });
          R.tex(`S = ${mtex(U)}`, 0.5, 0.38, { size: 14.5, color: 'purple' });
          R.text(`unitary: S*S = I, ${dU > 0 ? `rotation by ${pf(phi * DEG, 0)}°` : 'a reflection'}`, 0.5, 0.265, { size: 11.5, color: 'muted', align: 'center' });
          R.tex(`S${wrong ? '\\sqrt{TT^*}' : '\\sqrt{T^*T}'} = ${mtex(final)}`, 0.5, 0.12, { size: 14.5, color: miss ? 'red' : 'green' });
          R.text(miss ? '≠ T' : '= T', 0.5, 0.03, { size: 12.5, color: miss ? 'red' : 'green', weight: 700, align: 'center' });
          st = { T, P, Q, U, dU, err, wrong, s, errQ: maxAbs(msub(mm(Q, U), T)), normal: maxAbs(msub(P, Q)) < 1e-6, fl: flip.value };
        }, { period: 10, still: 5.8 });
        v.legend([['blue', 'image of $e_1$'], ['purple', 'image of $e_2$'], ['orange', 'stretch axes', { dash: true }], ['muted', 'target $T(\\text{picture})$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, P, Q, U, dU, err, wrong, s, errQ, normal, fl } = st;
          const head = `$S$ is ${dU > 0 ? 'a rotation' : 'a reflection'} ($\\det S = ${dU > 0 ? 1 : -1}$, $S^*S = I$) and $\\sqrt{T^*T}$ has eigenvalues $s_1 = ${tn(s[0])}$, $s_2 = ${tn(s[1])}$ on $e_1, e_2$. `;
          if (wrong) return head + (normal ? `$T$ is normal, so $\\sqrt{TT^*} = \\sqrt{T^*T}$ and this order works too.` : `$S\\sqrt{TT^*}$ misses $T$ by $${tn(err, 3)}$: $\\sqrt{TT^*}$ belongs on the other side, $\\sqrt{TT^*}\\,S = T$ (difference $${v.sci(errQ, 1)}$).`);
          if (fl) return head + (s[1] > 1e-9 ? `Flipping $f_2$ breaks it ($\\|S\\sqrt{T^*T} - T\\|_{\\max} = ${tn(err, 3)}$): for invertible $T$ the unitary factor is unique.` : `With $s_2 = 0$ the flipped $S$ works as well (difference $${v.sci(err, 1)}$): for non-invertible $T$, $S$ is **not unique**.`);
          return head + `$S\\sqrt{T^*T} = T$ up to $${v.sci(err, 1)}$.`;
        });
      },
    },
  ],
};
