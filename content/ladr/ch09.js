// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 1 (this file, with the chapter title and summary): 9.1–9.13 — bilinear forms, their matrices, change of basis,
// symmetric bilinear forms and their diagonalization. Part 2 is ch09-b.js (9.14–9.25: alternating forms, the
// symmetric ⊕ alternating splitting, quadratic forms, multilinear forms); 9.27 onwards live in later part files.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;

/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
const mark = (ok) => (ok ? '✓' : '✗');
/** "a + b" in TeX with the sign of b folded in. */
const plus = (b, d = 2) => (b < 0 ? `- ${tn(-b, d)}` : `+ ${tn(b, d)}`);
/** a, snapped onto b when they agree to rounding error (so that equal quantities print equal). */
const same = (a, b) => (Math.abs(a - b) <= 1e-9 * (1 + Math.abs(b)) ? b : a);

// ---------- real vectors and matrices (matrices are arrays of rows) ----------
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const tp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
function inv2(A) { const [[a, b], [c, d]] = A, D = a * d - b * c; return [[d / D, -b / D], [-c / D, a / D]]; }
const rot90 = (p) => [-p[1], p[0]];
/** β(u, w) = uᵗ A w for the bilinear form with matrix A. */
const bil = (A, u, w) => dot(u, mv(A, w));
const symPart = (A) => A.map((r, i) => r.map((x, j) => (x + A[j][i]) / 2));
/** Matrix of the bilinear form uᵗBw with respect to the basis E (a list of vectors): entries β(e_j, e_k). */
const gram = (B, E) => E.map((ej) => E.map((ek) => bil(B, ej, ek)));
/** Eigenvalues l[0] ≥ l[1] and unit eigenvectors of a symmetric 2×2 matrix. */
function esym2(A) {
  const a = A[0][0], b = (A[0][1] + A[1][0]) / 2, d = A[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const phi = 0.5 * Math.atan2(2 * b, a - d), c = Math.cos(phi), s = Math.sin(phi);
  return { l: [m + r, m - r], phi, u: [[c, s], [-s, c]] };
}
/** Eigenvalues of a real 2×2 matrix: {real, l: [l1 ≥ l2]} or {real: false, re, im}. */
function eig2r(A) {
  const [[a, b], [c, d]] = A, t = (a + d) / 2, disc = t * t - (a * d - b * c);
  if (disc >= -1e-12) { const s = Math.sqrt(Math.max(0, disc)); return { real: true, l: [t + s, t - s] }; }
  return { real: false, re: t, im: Math.sqrt(-disc) };
}
/** A "nice" step near x (1, 2, 5 × 10ᵏ). */
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x)), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
/** Signs of a list of numbers as (n₊, n₋, n₀). */
function signature(ls, tol = 1e-9) { let p = 0, m = 0, z = 0; for (const l of ls) { if (l > tol) p++; else if (l < -tol) m++; else z++; } return [p, m, z]; }

// ---------- drawing ----------
/** Keep a handle inside the disc of radius r. */
const disc = (r) => (x, y) => { const l = Math.hypot(x, y); return l > r ? [(x * r) / l, (y * r) / l] : [x, y]; };
/** TeX label just beyond the tip of the vector p (drawn from the origin). */
function tip(S, tex, p, color, { off = 15, size = 15 } = {}) {
  const r = Math.hypot(p[0], p[1]) || 1;
  S.tex(tex, p[0], p[1], { color, size, dx: (off * p[0]) / r, dy: (-off * p[1]) / r });
}
/**
 * Points of the level set {x ∈ R² : xᵗAx = c} (only the symmetric part of A matters), sampled by angle:
 * r(θ) = √(c / q(θ)); null where there is no point in that direction or it lies beyond radius R.
 */
function conic(A, c, R = 8, n = 540) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = (TAU * k) / n, u = [Math.cos(t), Math.sin(t)], Q = bil(A, u, u), r2 = c / Q;
    pts.push(Math.abs(Q) > 1e-12 && r2 > 0 && r2 < R * R ? scl(u, Math.sqrt(r2)) : null);
  }
  return pts;
}
/** Shade a stage by the sign and size of f: blue where f > 0, red where f < 0 (recomputed only when key changes). */
function signHeat(v, S, f, key, scale = 1, a = 0.45) {
  const P = v.rgb('blue'), N = v.rgb('red'), BG = v.rgb('panel');
  S.raster((x, y) => {
    const z = f(x, y); if (!isFinite(z)) return null;
    const C = z >= 0 ? P : N, k = Math.min(1, Math.abs(z) / scale) * a;
    return [BG[0] + (C[0] - BG[0]) * k, BG[1] + (C[1] - BG[1]) * k, BG[2] + (C[2] - BG[2]) * k];
  }, { key: `${key}|${BG.join(',')}`, res: 3 });
}
/** Lines of the grid {x₁e₁ + x₂e₂ : x₁ or x₂ an integer} of the basis e₁, e₂, clipped to the stage. */
function skewGrid(S, e1, e2, st = {}) {
  const K = st.K ?? 8;
  S.clip(() => {
    for (let k = -K; k <= K; k++) {
      S.line(k * e1[0] - 9 * e2[0], k * e1[1] - 9 * e2[1], k * e1[0] + 9 * e2[0], k * e1[1] + 9 * e2[1], { color: st.c1 || 'teal', width: k ? 0.8 : 1.3, alpha: st.alpha ?? 0.3 });
      S.line(k * e2[0] - 9 * e1[0], k * e2[1] - 9 * e1[1], k * e2[0] + 9 * e1[0], k * e2[1] + 9 * e1[1], { color: st.c2 || 'pink', width: k ? 0.8 : 1.3, alpha: st.alpha ?? 0.3 });
    }
  });
}
/**
 * A small matrix with brackets, drawn with its top-left corner at pixel (X, Y). o: {cw, ch, size, d, color(i, j),
 * row, col (tinted), cells: [[i, j, colour]] (outlined), frame, label (TeX above)}. Returns its pixel box for hit-tests.
 */
function matPx(v, S, A, X, Y, o = {}) {
  const rows = A.length, cols = A[0].length, cw = o.cw ?? 44, ch = o.ch ?? 28, W = cols * cw, H = rows * ch, c = S.ctx;
  c.save();
  if (o.fill) for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const f = o.fill(i, j); if (f) { c.fillStyle = v.color(f[0], f[1] ?? 0.2); c.fillRect(X + j * cw + 1, Y + i * ch + 1, cw - 2, ch - 2); } }
  if (o.row != null) { c.fillStyle = v.color(o.hl || 'gold', 0.2); c.fillRect(X, Y + o.row * ch, W, ch); }
  if (o.col != null) { c.fillStyle = v.color(o.hl || 'gold', 0.2); c.fillRect(X + o.col * cw, Y, cw, H); }
  for (const [i, j, col] of o.cells || []) { c.strokeStyle = v.color(col || 'gold'); c.lineWidth = 2.2; c.strokeRect(X + j * cw + 2, Y + i * ch + 2, cw - 4, ch - 4); }
  c.strokeStyle = v.color(o.frame || 'ink'); c.lineWidth = o.frameW ?? 1.5; c.beginPath();
  c.moveTo(X + 5, Y - 2); c.lineTo(X, Y - 2); c.lineTo(X, Y + H + 2); c.lineTo(X + 5, Y + H + 2);
  c.moveTo(X + W - 5, Y - 2); c.lineTo(X + W, Y - 2); c.lineTo(X + W, Y + H + 2); c.lineTo(X + W - 5, Y + H + 2);
  c.stroke(); c.restore();
  const size = o.size ?? Math.min(15, ch * 0.5, cw * 0.36);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    S.textPx(pn(A[i][j], o.d ?? 2), X + (j + 0.5) * cw, Y + (i + 0.5) * ch + 0.5, { align: 'center', size, color: o.color ? o.color(i, j) : 'ink', halo: false, weight: o.weight ? o.weight(i, j) : 500 });
  }
  if (o.label) S.texPx(o.label, X + W / 2, Y - 14, { color: o.labelColor || 'ink', size: o.labelSize ?? 14, baseline: 'bottom' });
  return { X, Y, W, H, cw, ch, rows, cols, hit(px, py) { const j = Math.floor((px - X) / cw), i = Math.floor((py - Y) / ch); return i >= 0 && i < rows && j >= 0 && j < cols ? [i, j] : null; } };
}
/** Rings on the 3D stage: a small circle around p in the horizontal plane (a marker for a predicted value). */
function ring3(S3, p, r, st) {
  const pts = []; for (let k = 0; k <= 24; k++) { const t = (TAU * k) / 24; pts.push([p[0] + r * Math.cos(t), p[1] + r * Math.sin(t), p[2]]); }
  S3.path(pts, st);
}
/** The four elementary forms on R²: β_jk(u, v) = u_j v_k, evaluated on unit vectors at angles φ (for u) and θ (for v). */
const TRIG = [Math.cos, Math.sin];
const elem = (j, k, ph, th) => TRIG[j](ph) * TRIG[k](th);
/** β(u_φ, v_θ) for the form with matrix A. */
const chartVal = (A, ph, th) => { const c = Math.cos(ph), s = Math.sin(ph), C = Math.cos(th), Sn = Math.sin(th); return A[0][0] * c * C + A[0][1] * c * Sn + A[1][0] * s * C + A[1][1] * s * Sn; };
/** Colour for a signed value on a diverging blue/red scale (rgb arrays cached by the caller). */
function divCol(z, scale, P, N, BG, a = 0.85) {
  const C = z >= 0 ? P : N, k = Math.min(1, Math.abs(z) / scale) * a;
  return [BG[0] + (C[0] - BG[0]) * k, BG[1] + (C[1] - BG[1]) * k, BG[2] + (C[2] - BG[2]) * k];
}
const PI_TICKS = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [TAU, '2π']];

// ---------- three dimensions ----------
const det3 = (a, b, c) => dot(a, cross(b, c));
/** Orthonormal pair spanning the plane perpendicular to n. */
function perpPair(n) { const u = unit(n), a = unit(Math.abs(u[0]) < 0.9 ? cross(u, [1, 0, 0]) : cross(u, [0, 1, 0])); return [a, cross(u, a)]; }
/** The isotropic set {x : xᵗAx = 0} of a symmetric 3×3 matrix in a scene3: a double cone, two planes, a plane or a line. */
function drawIso(sc, M, As, R = 1.55) {
  const E = M.eigSym(As), ls = E.values, vs = E.vecs, tol = 1e-6 * Math.max(1, ...ls.map(Math.abs)), pos = [], neg = [], zer = [];
  ls.forEach((l, i) => (l > tol ? pos : l < -tol ? neg : zer).push(i));
  const st = { color: 'muted', width: 1, alpha: 0.28 };
  if (zer.length === 0 && pos.length && neg.length) {
    const lone = pos.length === 1 ? pos[0] : neg[0], [b, c] = pos.length === 1 ? neg : pos, tips = [[], []];
    for (let k = 0; k < 24; k++) {
      const t = (TAU * k) / 24;
      const d = scl(unit(add(add(scl(vs[b], Math.cos(t) / Math.sqrt(Math.abs(ls[b]))), scl(vs[c], Math.sin(t) / Math.sqrt(Math.abs(ls[c])))), scl(vs[lone], 1 / Math.sqrt(Math.abs(ls[lone]))))), R);
      sc.line(scl(d, -1), d, st, 6); tips[0].push(d); tips[1].push(scl(d, -1));
    }
    for (const T of tips) sc.path([...T, T[0]], { color: 'muted', width: 1.2, alpha: 0.45 });
    return 'cone';
  }
  if (zer.length === 1 && pos.length === 1) {
    const z = vs[zer[0]], a = vs[pos[0]], b = vs[neg[0]];
    for (const sg of [1, -1]) sc.disc(z, unit(add(scl(a, 1 / Math.sqrt(ls[pos[0]])), scl(b, sg / Math.sqrt(-ls[neg[0]])))), 1.3, { fill: 'muted', fillAlpha: 0.07, color: 'muted', alpha: 0.4 });
    return 'planes';
  }
  if (zer.length === 1) { sc.line(scl(vs[zer[0]], -R), scl(vs[zer[0]], R), { color: 'muted', width: 2.4, alpha: 0.6 }, 8); return 'line'; }
  if (zer.length === 2) { sc.disc(vs[zer[0]], vs[zer[1]], 1.3, { fill: 'muted', fillAlpha: 0.07, color: 'muted', alpha: 0.4 }); return 'plane'; }
  return 'none';
}

export default {
  collection: 'ladr',
  chapter: 9,
  title: 'Multilinear Algebra and Determinants',
  summary: String.raw`The chapter opens with bilinear forms — functions of two vectors, linear in each — and studies them through their matrices, which change by $C^{t}BC$ rather than $C^{-1}BC$ when the basis changes. Every bilinear form splits uniquely into a symmetric and an alternating part; symmetric forms, and with them quadratic forms, can always be diagonalized, and on a real inner product space even by an orthonormal basis. Alternating multilinear forms of top degree then make up a one-dimensional space, so every operator acts on it by a single scalar — its determinant. From this basis-free definition come the permutation formula, multiplicativity, the invertibility test, the links with eigenvalues, singular values and volume, the characteristic polynomial and Cayley–Hamilton over $\mathbf R$, and Hadamard's inequality. The book closes with tensor products, built from bilinear functionals on dual spaces.`,
  items: [
    // ------------------------------------------------------------------ 9.1
    {
      num: '9.1',
      kind: 'Definition',
      name: 'Bilinear form',
      statement: String.raw`A **bilinear form** on $V$ is a function $\beta \colon V \times V \to \mathbf F$ that is linear in each slot when the other slot is held fixed: for every $u \in V$, both
$$v \mapsto \beta(v, u) \qquad\text{and}\qquad v \mapsto \beta(u, v)$$
are linear functionals on $V$. The set of bilinear forms on $V$ is denoted $V^{(2)}$; with the usual addition and scalar multiplication of functions it is a vector space.`,
      idea: String.raw`Freezing one slot leaves an element of the dual space $V'$ (3.110), so a bilinear form is a rule that turns every vector into a linear functional, and does so linearly. Examples: $\sum_{j,k} A_{j,k}x_jy_k$ on $\mathbf F^n$ for any $n \times n$ matrix $A$; $\langle u, Tv\rangle$ on a real inner product space for any operator $T$; $\varphi(u)\tau(v)$ for any $\varphi, \tau \in V'$; $p(2)\,q'(3)$ on $\mathcal P_n(\mathbf R)$. A real inner product is a bilinear form that happens to be symmetric and positive definite; a complex inner product is not a bilinear form at all, since scalars leave its second slot conjugated. And a bilinear form is *not* a linear map on the vector space $V \times V$: $\beta(2u, 2v) = 4\beta(u, v)$, so only $\beta = 0$ is both.`,
      caption: String.raw`Drag $u$ (blue). The colours and purple level lines show the linear functional obtained by freezing one slot at $u$: straight, parallel, equally spaced lines, with the zero line (thick) through the origin, which turn and crowd together as $u$ moves. On the right its graph is a plane through the origin. Drag the test vectors $v$ and $w$: the green stick at $v + w$ always reaches the black ring placed at height $\beta(\cdot, v) + \beta(\cdot, w)$. Now pick a candidate that is not bilinear: for $u^{t}Av + 1$ the plane misses the origin, for $\|u\|\,\|v\|$ the levels are circles and the graph a cone — and the ring and the stick separate.`,
      deps: ['ladr-3.110'],
      tags: ['bilinear forms'],
      viz(v) {
        const A = [[1, 1.4], [-0.6, 0.7]];
        const F = { bil: (a, b) => bil(A, a, b), aff: (a, b) => bil(A, a, b) + 1, nrm: (a, b) => len(a) * len(b) };
        const cand = v.select('$\\beta$', [{ value: 'bil', label: '$u^{t}Av$ (bilinear)' }, { value: 'aff', label: '$u^{t}Av + 1$' }, { value: 'nrm', label: '$\\|u\\|\\,\\|v\\|$' }], 'bil');
        const slot = v.select('freeze', [{ value: 'first', label: 'first slot at $u$' }, { value: 'second', label: 'second slot at $u$' }], 'first');
        const P = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 370, title: 'levels of $x \\mapsto \\beta(u, x)$' });
        const S3 = v.stage3d({ range: 2.05, height: 370, yaw: -0.5, pitch: 0.45, labels: ['x₁', 'x₂', ''], title: 'its graph over $[-1.6, 1.6]^2$ (heights $\\times 0.4$)' });
        const uh = P.handle(0.3, 1.0, { color: 'accent', label: 'u', constrain: disc(1.5) });
        const vh = P.handle(0.9, 0.6, { color: 'gold', label: 'v', constrain: disc(1.15) });
        const wh = P.handle(0.3, -1.05, { color: 'teal', label: 'w', constrain: disc(1.15) });
        let st = null, lastTitle = '';
        v.render(() => {
          const f0 = F[cand.value], u = [uh.x, uh.y], first = slot.value === 'first';
          const f = (x, y) => (first ? f0(u, [x, y]) : f0([x, y], u));
          const ttl = first ? 'levels of $x \\mapsto \\beta(u, x)$' : 'levels of $x \\mapsto \\beta(x, u)$';
          if (ttl !== lastTitle) { P.setTitle(ttl); lastTitle = ttl; }
          let fmax = 0.6;
          for (const p of [[2.3, 2.3], [2.3, -2.3], [-2.3, 2.3], [-2.3, -2.3], [2.3, 0], [0, 2.3], [-2.3, 0], [0, -2.3]]) fmax = Math.max(fmax, Math.abs(f(...p)));
          signHeat(v, P, f, `${cand.value}|${slot.value}|${u}`, fmax, 0.4);
          const dl = niceStep(fmax / 6), lv = []; for (let k = -14; k <= 14; k++) if (k) lv.push(k * dl);
          P.contour(f, lv, { color: 'purple', width: 1, res: 100 });
          P.contour(f, [0], { color: 'purple', width: 2.4, res: 100 });
          P.axes();
          const a = [vh.x, vh.y], b = [wh.x, wh.y], ab = add(a, b);
          P.poly([[0, 0], a, ab, b], { fill: 'green', fillAlpha: 0.06, color: 'muted', width: 1, dash: [4, 4] });
          P.arrow(0, 0, a[0], a[1], { color: 'gold', width: 2.2 });
          P.arrow(0, 0, b[0], b[1], { color: 'teal', width: 2.2 });
          P.arrow(0, 0, ab[0], ab[1], { color: 'green', width: 2.6 }); tip(P, 'v + w', ab, 'green', { size: 14, off: 22 });
          P.arrow(0, 0, u[0], u[1], { color: 'accent', width: 3 });
          // the graph
          const k = 0.4, R = 1.6, fa = f(...a), fb = f(...b), fab = f(...ab), f00 = f(0, 0), zm = Math.max(0.3, k * fmax * 0.7);
          S3.surface((x, y) => [x, y, k * f(x, y)], [-R, R], [-R, R], { n: 24, alpha: 0.7, colorFn: (x, y, p) => v.mix('panel', p[2] >= 0 ? 'blue' : 'red', 0.85 * Math.min(1, Math.abs(p[2]) / zm)) });
          if (cand.value !== 'nrm') {
            // the zero level of the frozen functional, drawn on the graph
            const g = first ? mv(tp(A), u) : mv(A, u), d = unit(rot90(g)), c0 = cand.value === 'aff' ? -1 : 0, gg = dot(g, g);
            if (gg > 1e-9) { const p0 = scl(g, c0 / gg), pts = []; for (let t = -3; t <= 3; t += 0.1) { const q = add(p0, scl(d, t)); if (Math.abs(q[0]) <= R && Math.abs(q[1]) <= R) pts.push([q[0], q[1], 0]); } S3.path(pts, { color: 'purple', width: 2.6, bias: -0.6 }); }
          }
          const stick = (p, val, col, w = 2.6) => { S3.line([p[0], p[1], 0], [p[0], p[1], k * val], { color: col, width: w }); S3.dot([p[0], p[1], k * val], { r: 4.5, color: col }); };
          S3.line([a[0], a[1], 0], [0, 0, 0], { color: 'gold', width: 1, alpha: 0.6 });
          S3.line([b[0], b[1], 0], [0, 0, 0], { color: 'teal', width: 1, alpha: 0.6 });
          S3.line([ab[0], ab[1], 0], [0, 0, 0], { color: 'green', width: 1, alpha: 0.6 });
          stick(a, fa, 'gold'); stick(b, fb, 'teal'); stick(ab, fab, 'green', 3);
          ring3(S3, [ab[0], ab[1], k * (fa + fb)], 0.13, { color: 'ink', width: 2 });
          if (Math.abs(f00) > 1e-9) stick([0, 0], f00, 'red');
          const nm = first ? (x) => `\\beta(u, ${x})` : (x) => `\\beta(${x}, u)`;
          st = { fa, fb, fab, gap: fab - fa - fb, hom: f(...scl(a, 2)) - 2 * fa, f2: f(...scl(a, 2)), f00, nm, bil: cand.value === 'bil', b4: [bil(A, scl(u, 2), scl(a, 2)), bil(A, u, a)] };
        });
        v.legend([['accent', '$u$ (frozen slot)'], ['gold', '$v$'], ['teal', '$w$'], ['green', '$v + w$'], ['purple', 'level lines']]);
        v.readout(() => {
          if (!st) return '';
          const { nm } = st, ok = Math.abs(st.gap) < 1e-9 && Math.abs(st.hom) < 1e-9;
          let s = `$${nm('v')} + ${nm('w')} = ${tn(st.fa, 3)} ${plus(st.fb, 3)} = ${tn(st.fa + st.fb, 3)}$, while $${nm('v + w')} = ${tn(st.fab, 3)}$ ${mark(Math.abs(st.gap) < 1e-9)}; $\\ ${nm('2v')} = ${tn(st.f2, 3)}$ vs $2\\,${nm('v')} = ${tn(2 * st.fa, 3)}$ ${mark(Math.abs(st.hom) < 1e-9)}.`;
          if (ok) s += st.bil ? ` Linear in this slot — and in the other one too (switch). But not linear on $V \\times V$: $\\beta(2u, 2v) = ${tn(st.b4[0], 3)} = 4\\beta(u, v)$.` : '';
          else s += Math.abs(st.f00) > 1e-9 ? ` Not linear: it is $${tn(st.f00, 3)}$ at $x = 0$, and a linear functional must vanish there.` : ' Not linear in this slot, so not a bilinear form.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4',
      kind: 'Definition',
      name: 'Matrix of a bilinear form',
      statement: String.raw`Suppose $\beta \in V^{(2)}$ and $e_1, \dots, e_n$ is a basis of $V$. The **matrix of $\beta$** with respect to this basis is the $n \times n$ matrix $\mathcal M(\beta)$ whose entry in row $j$, column $k$ is
$$\mathcal M(\beta)_{j,k} = \beta(e_j, e_k).$$
When the basis has to be named, one writes $\mathcal M\big(\beta, (e_1, \dots, e_n)\big)$. If $u = \sum_j x_je_j$ and $v = \sum_k y_ke_k$, then $\beta(u, v) = \sum_{j,k}\mathcal M(\beta)_{j,k}\,x_jy_k$.`,
      idea: String.raw`Expand both slots with bilinearity: $\beta\big(\sum_j x_je_j, \sum_k y_ke_k\big) = \sum_{j,k} x_jy_k\,\beta(e_j, e_k)$. So the $n^2$ numbers $\beta(e_j, e_k)$ determine $\beta$ completely, and the matrix just records them — the row index belongs to the first slot, the column index to the second. Nothing is "applied" to $e_k$, as it is for the matrix of an operator: we only evaluate. The matrix depends on the basis; 9.7 says exactly how.`,
      caption: String.raw`Drag the basis vectors $e_1$ (teal) and $e_2$ (pink): the faint grid shows their coordinates, and the table on the right is refilled with the four numbers $\beta(e_j, e_k)$. Click a cell to light up the pair it pairs. Drag $u$ and $v$: their coordinates $x, y$ (the dashed paths along the grid) fed into $\sum_{j,k}\mathcal M_{j,k}x_jy_k$ reproduce $\beta(u, v)$ exactly. Switch on the wrong pairing — $e$-coordinates with the standard matrix of $\beta$ — and the two numbers part ways; squeeze $e_1, e_2$ onto one line and coordinates stop existing.`,
      deps: ['ladr-9.1', 'ladr-2.26'],
      tags: ['bilinear forms', 'matrices'],
      viz(v) {
        const FORMS = { gen: [[1, 2], [0, -1]], dot: [[1, 0], [0, 1]], area: [[0, 1], [-1, 0]] };
        const form = v.select('$\\beta$', [{ value: 'gen', label: '$u_1v_1 + 2u_1v_2 - u_2v_2$' }, { value: 'dot', label: 'dot product' }, { value: 'area', label: 'signed area $u_1v_2 - u_2v_1$' }], 'gen');
        const wrong = v.toggle('wrong pairing: $e$-coordinates with the standard matrix', false);
        const P = v.stage({ x: [-2.4, 2.4], y: [-2.1, 2.1], equal: true, height: 380, weight: 1.15 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.85, minWidth: 260 });
        const e1 = P.handle(1.1, 0.25, { color: 'teal', label: 'e₁' });
        const e2 = P.handle(0.45, 0.95, { color: 'pink', label: 'e₂' });
        const uh = P.handle(1.6, 1.25, { color: 'accent', label: 'u' });
        const vh = P.handle(-1.3, 0.75, { color: 'gold', label: 'v' });
        let sel = [0, 1], box = null, st = null;
        R.onClick((x, y) => { const c = box && box.hit(R.X(x), R.Y(y)); if (c) sel = c; });
        v.render(() => {
          const B = FORMS[form.value], E = [[e1.x, e1.y], [e2.x, e2.y]], dC = det2(E[0], E[1]), ok = Math.abs(dC) > 0.08;
          const Mb = gram(B, E), u = [uh.x, uh.y], w = [vh.x, vh.y];
          const Ci = ok ? inv2(fromCols(E)) : null, x = ok ? mv(Ci, u) : null, y = ok ? mv(Ci, w) : null;
          const used = wrong.value ? B : Mb, direct = bil(B, u, w), sum = ok ? same(bil(used, x, y), direct) : NaN;
          // the plane
          if (ok) skewGrid(P, E[0], E[1], { alpha: 0.22 });
          const decomp = (p, c, col) => { const a = scl(E[0], c[0]); P.path([[0, 0], a, p], { color: col, width: 1.6, dash: [5, 4] }); };
          if (ok) { decomp(u, x, 'accent'); decomp(w, y, 'gold'); }
          const [j, k] = sel;
          for (const idx of new Set([j, k])) P.arrow(0, 0, E[idx][0], E[idx][1], { color: 'gold', width: 8, alpha: 0.35 });
          P.arrow(0, 0, E[0][0], E[0][1], { color: 'teal', width: 2.8 });
          P.arrow(0, 0, E[1][0], E[1][1], { color: 'pink', width: 2.8 });
          P.arrow(0, 0, u[0], u[1], { color: 'accent', width: 2.2 });
          P.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.2 });
          if (!ok) P.corner('e₁, e₂ are not a basis: coordinates are not defined', 'tl', { color: 'red', weight: 700 });
          // the table
          const W = R.width, H = R.height, cw = Math.min(76, (W - 90) / 2), ch = Math.min(52, cw * 0.72), X0 = (W - 2 * cw) / 2 + 14, Y0 = 62;
          box = matPx(v, R, Mb, X0, Y0, { cw, ch, size: 17, cells: [[j, k, 'gold']], label: '\\mathcal M\\big(\\beta, (e_1, e_2)\\big)', labelSize: 15, fill: (i, jj) => [i === 0 ? 'teal' : 'pink', 0.06] });
          ['e_1', 'e_2'].forEach((t, i) => { R.texPx(t, X0 - 16, Y0 + (i + 0.5) * ch, { color: i ? 'pink' : 'teal', size: 14 }); R.texPx(t, X0 + (i + 0.5) * cw, Y0 + 2 * ch + 14, { color: i ? 'pink' : 'teal', size: 14 }); });
          R.textPx('first slot ↓   second slot →', W / 2 + 8, Y0 + 2 * ch + 36, { align: 'center', size: 11, color: 'muted' });
          const ly = Y0 + 2 * ch + 70, lh = Math.min(30, (H - ly - 10) / 4.2);
          R.texPx(`\\beta(e_${j + 1}, e_${k + 1}) = ${tn(Mb[j][k], 3)}`, W / 2, ly, { color: 'gold', size: 15 });
          if (ok) {
            R.texPx(`x = ${vtex(x)},\\ \\ y = ${vtex(y)}`, W / 2, ly + lh, { size: 14 });
            R.texPx(`\\textstyle\\sum_{j,k} ${wrong.value ? 'B' : '\\mathcal M'}_{j,k}\\,x_jy_k = ${tn(sum, 3)}`, W / 2, ly + 2 * lh, { size: 15, color: wrong.value ? 'red' : 'green' });
          } else R.texPx('\\text{no coordinates}', W / 2, ly + 1.5 * lh, { size: 14, color: 'red' });
          R.texPx(`\\beta(u, v) = ${tn(direct, 3)}`, W / 2, ly + 3 * lh, { size: 15, color: 'accent' });
          st = { ok, sum, direct, Mb, x, y, j, k, wrong: wrong.value, B };
        });
        v.legend([['teal', '$e_1$'], ['pink', '$e_2$'], ['accent', '$u$, coordinates $x$', { dash: true }], ['gold', '$v$, coordinates $y$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return '$e_1, e_2$ are (almost) parallel, so they are not a basis: $u$ and $v$ have no coordinates, and a matrix with respect to them would not determine $\\beta$.';
          const good = Math.abs(st.sum - st.direct) < 1e-9;
          return `With $u = ${tn(st.x[0])}e_1 ${plus(st.x[1])}e_2$ and $v = ${tn(st.y[0])}e_1 ${plus(st.y[1])}e_2$: $\\ \\sum_{j,k} ${st.wrong ? 'B' : '\\mathcal M(\\beta)'}_{j,k}\\,x_jy_k = ${tn(st.sum, 4)}$ and $\\beta(u, v) = ${tn(st.direct, 4)}$ ${mark(good)}` + (st.wrong ? (good ? ' — they agree only by accident here (try another basis).' : ` — the standard matrix $B = ${mtex(st.B)}$ belongs to the standard basis, so it must be fed standard coordinates.`) : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5',
      kind: 'Theorem',
      name: 'dim V⁽²⁾ = (dim V)²',
      statement: String.raw`Suppose $e_1, \dots, e_n$ is a basis of $V$. Then the map $\beta \mapsto \mathcal M(\beta)$ is an isomorphism of $V^{(2)}$ onto $\mathbf F^{n,n}$. In particular,
$$\dim V^{(2)} = (\dim V)^2.$$`,
      idea: String.raw`The map $\beta \mapsto \mathcal M(\beta)$ is clearly linear. Its inverse sends a matrix $A$ to the form $\beta_A\big(\sum_j x_je_j, \sum_k y_ke_k\big) = \sum_{j,k}A_{j,k}x_jy_k$: indeed $\mathcal M(\beta_A) = A$ by evaluating on basis pairs, and $\beta_{\mathcal M(\beta)} = \beta$ by the bilinear expansion behind 9.4. So the two spaces are isomorphic and have the same dimension, $\dim\mathbf F^{n,n} = n^2$ (3.40, 3.70). Concretely, the $n^2$ elementary forms $\beta_{jk}(u, v) = x_jy_k$ (the $j$-th coordinate of $u$ times the $k$-th coordinate of $v$) correspond to the matrix units, so they form a basis of $V^{(2)}$: every form is $\sum_{j,k}\beta(e_j, e_k)\,\beta_{jk}$, and none can be left out.`,
      caption: String.raw`A bilinear form on $\mathbf R^2$ is pictured by its values $\beta(u, v)$ on all pairs of unit vectors: the square chart has the angle $\varphi$ of $u$ across and the angle $\theta$ of $v$ up (blue $> 0$, red $< 0$). Left: the four elementary forms $\beta_{jk}$, each weighted by its slider $c_{jk}$. Right: their sum, with its level lines in black and those of the target form in gold. Move the sliders until the black lines run inside the gold ones — the only way is $c_{jk} = \beta(e_j, e_k)$ (or press the button). Drop $\beta_{21}$ and some targets become unreachable: at the pair $(u, v) = (e_2, e_1)$ the other three forms all vanish.`,
      deps: ['ladr-9.4', 'ladr-3.40', 'ladr-3.70'],
      tags: ['bilinear forms', 'dimension'],
      viz(v) {
        const TG = { myst: [[-0.5, 1.5], [1, 0.5]], dot: [[1, 0], [0, 1]], area: [[0, 1], [-1, 0]], rank1: [[0.5, -1], [0.5, -1]] };
        const tgt = v.select('target $\\beta$', [{ value: 'myst', label: 'mystery form' }, { value: 'dot', label: 'dot product' }, { value: 'area', label: 'area form' }, { value: 'rank1', label: '$\\varphi(u)\\,\\tau(v)$' }], 'myst');
        const sl = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([j, k]) => v.slider(`$c_{${j + 1}${k + 1}}$`, -2, 2, [[0.6, 0.4], [0.3, -0.6]][j][k], { step: 0.05 }));
        const drop = v.toggle('drop $\\beta_{21}$', false, { onChange: (b) => { sl[2].el.hidden = b; } });
        v.button('read off $c_{jk} = \\beta(e_j, e_k)$', () => { const B = TG[tgt.value]; sl.forEach((s, i) => { if (!(drop.value && i === 2)) s.set(B[i >> 1][i & 1]); }); });
        const L = v.stage({ x: [0, 2.35], y: [0, 2.5], equal: true, axes: false, height: 370, weight: 0.85, minWidth: 260, title: 'elementary forms $c_{jk}\\,\\beta_{jk}$' });
        const R = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', height: 370, weight: 1.15, xticks: PI_TICKS, yticks: PI_TICKS, xlabel: 'angle φ of u', ylabel: 'angle θ of v', title: '$\\sum c_{jk}\\beta_{jk}$ (colour, black levels) vs target (gold levels)' });
        const TS = 0.95, tile = (j, k) => [0.12 + 1.15 * k, 0.08 + 1.2 * (1 - j)];
        let st = null;
        v.render(() => {
          const c = sl.map((s, i) => (drop.value && i === 2 ? 0 : s.value)), Cm = [[c[0], c[1]], [c[2], c[3]]], B = TG[tgt.value];
          const P = v.rgb('blue'), N = v.rgb('red'), BG = v.rgb('panel');
          L.raster((x, y) => {
            for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
              const [x0, y0] = tile(j, k);
              if (x >= x0 && x <= x0 + TS && y >= y0 && y <= y0 + TS) return divCol(Cm[j][k] * elem(j, k, ((x - x0) / TS) * TAU, ((y - y0) / TS) * TAU), 1.4, P, N, BG, 0.9);
            }
            return null;
          }, { key: `${c}|${BG}`, res: 2 });
          for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
            const [x0, y0] = tile(j, k), off = drop.value && j === 1 && k === 0;
            L.rect(x0, y0, x0 + TS, y0 + TS, { color: off ? 'red' : 'muted', width: off ? 2 : 1, dash: off ? [5, 4] : null });
            L.tex(`${tn(Cm[j][k])}\\,\\beta_{${j + 1}${k + 1}}`, x0 + TS / 2, y0 + TS + 0.09, { size: 14, color: off ? 'red' : 'ink' });
            if (off) L.text('dropped', x0 + TS / 2, y0 + TS / 2, { align: 'center', color: 'red', size: 13, weight: 700 });
          }
          R.raster((x, y) => (x < 0 || y < 0 || x > TAU || y > TAU ? null : divCol(chartVal(Cm, x, y), 2.2, P, N, BG)), { key: `${c}|${BG}`, res: 2 });
          const lv = [-1.6, -0.8, 0.8, 1.6];
          R.contour((x, y) => chartVal(B, x, y), lv, { color: 'gold', width: 2.6, res: 90 });
          R.contour((x, y) => chartVal(B, x, y), [0], { color: 'gold', width: 4, res: 90 });
          R.contour((x, y) => chartVal(Cm, x, y), lv, { color: 'ink', width: 1, res: 90 });
          R.contour((x, y) => chartVal(Cm, x, y), [0], { color: 'ink', width: 1.8, res: 90 });
          R.axes();
          let err = 0; for (let a = 0; a < 48; a++) for (let b = 0; b < 48; b++) { const ph = (TAU * a) / 48, th = (TAU * b) / 48; err = Math.max(err, Math.abs(chartVal(Cm, ph, th) - chartVal(B, ph, th))); }
          if (drop.value) R.dot(Math.PI / 2, 0, { r: 7, color: 'red', label: '(e₂, e₁)', labelPos: 'ne' });
          st = { err, Cm, B, drop: drop.value, floor: Math.abs(B[1][0]) };
        });
        v.legend([['ink', 'levels of your combination'], ['gold', 'levels of the target $\\beta$'], ['blue', 'value $> 0$', { area: true }], ['red', 'value $< 0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const m = st.err < 0.01;
          let s = `$\\max_{\\varphi,\\theta}\\big|\\sum c_{jk}\\beta_{jk} - \\beta\\big| = ${tn(st.err, 3)}$, with $\\mathcal M\\big(\\sum c_{jk}\\beta_{jk}\\big) = ${mtex(st.Cm)}$. `;
          if (m) s += `**Match**: $\\mathcal M(\\beta) = ${mtex(st.B)}$, i.e. $c_{jk} = \\beta(e_j, e_k)$ — the four elementary forms span $V^{(2)}$, and they are independent, so $\\dim V^{(2)} = 2^2 = 4$.`;
          else if (st.drop && st.floor > 0.01) s += `Without $\\beta_{21}$ the error can never drop below $|\\beta(e_2, e_1)| = ${tn(st.floor)}$: at $(u, v) = (e_2, e_1)$ the remaining three forms are all $0$. Three forms do not span a 4-dimensional space.`;
          else s += 'Adjust the sliders until the black level lines run inside the gold ones.';
          return s;
        });
      },
    },

    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6',
      kind: 'Theorem',
      name: 'Composition of a bilinear form and an operator',
      statement: String.raw`Suppose $\beta \in V^{(2)}$ and $T \in \mathcal L(V)$. Define bilinear forms $\alpha$ and $\rho$ on $V$ by
$$\alpha(u, v) = \beta(u, Tv) \qquad\text{and}\qquad \rho(u, v) = \beta(Tu, v).$$
If $e_1, \dots, e_n$ is a basis of $V$ and all matrices are taken with respect to it, then
$$\mathcal M(\alpha) = \mathcal M(\beta)\,\mathcal M(T) \qquad\text{and}\qquad \mathcal M(\rho) = \mathcal M(T)^{t}\,\mathcal M(\beta).$$`,
      idea: String.raw`Compute one entry. The $k$-th column of $\mathcal M(T)$ lists the coordinates of $Te_k$ (5.35), so linearity in the second slot gives
$$\mathcal M(\alpha)_{j,k} = \beta(e_j, Te_k) = \textstyle\sum_m \beta(e_j, e_m)\,\mathcal M(T)_{m,k},$$
row $j$ of $\mathcal M(\beta)$ against column $k$ of $\mathcal M(T)$ — the $(j,k)$ entry of the product. In the first slot, $\mathcal M(\rho)_{j,k} = \beta(Te_j, e_k) = \sum_m \mathcal M(T)_{m,j}\,\beta(e_m, e_k)$: now *column* $j$ of $\mathcal M(T)$ meets column $k$ of $\mathcal M(\beta)$, and turning that column into a row is exactly what the transpose (3.54) does.`,
      caption: String.raw`Drag $Te_1$ (teal) and $Te_2$ (pink) to change $T$; the matrix of $\beta$ is fixed. Click an entry of the matrix computed from the definition (bottom left): the row and the column it is built from light up in the product above, and the sum is written out underneath. The product in the order of the theorem always agrees with it (green frame); the tempting other order (bottom right) does not. Switch to the first slot and watch the transpose appear — the coloured columns of $\mathcal M(T)$ become rows. Drag $u$ and $v$ to evaluate the new form both ways in the readout.`,
      deps: ['ladr-9.4', 'ladr-5.35', 'ladr-3.54'],
      tags: ['bilinear forms', 'matrices'],
      viz(v) {
        const B = [[1, 2], [-1, 0.5]];
        const slot = v.select('feed $T$ into the', [{ value: 'second', label: 'second slot: $\\alpha(u, v) = \\beta(u, Tv)$' }, { value: 'first', label: 'first slot: $\\rho(u, v) = \\beta(Tu, v)$' }], 'second');
        const P = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 400, weight: 0.85, minWidth: 260 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.15, minWidth: 330 });
        const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const h1 = P.handle(1.2, 0.4, { color: 'teal', label: 'Te₁', constrain: snap });
        const h2 = P.handle(-0.5, 1.1, { color: 'pink', label: 'Te₂', constrain: snap });
        const uh = P.handle(-1.5, -0.8, { color: 'accent', label: 'u' });
        const vh = P.handle(0.8, -1.4, { color: 'gold', label: 'v' });
        let sel = [0, 1], box = null, st = null;
        R.onClick((x, y) => { const c = box && box.hit(R.X(x), R.Y(y)); if (c) sel = c; });
        v.render(() => {
          const T = [[h1.x, h2.x], [h1.y, h2.y]], second = slot.value === 'second', [j, k] = sel;
          const form = second ? (a, b) => bil(B, a, mv(T, b)) : (a, b) => bil(B, mv(T, a), b);
          const I2 = [[1, 0], [0, 1]], direct = I2.map((ej) => I2.map((ek) => form(ej, ek)));
          const Lm = second ? B : tp(T), Rm = second ? T : B, prod = mm(Lm, Rm), wrongP = mm(T, B);
          const agree = maxAbs(msub(prod, direct)) < 1e-9, wrongOK = maxAbs(msub(wrongP, direct)) < 1e-9;
          // the plane: T as the image of the unit square
          P.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: 'muted', fillAlpha: 0.05, color: 'muted', width: 1, dash: [4, 4] });
          P.poly([[0, 0], mv(T, [1, 0]), mv(T, [1, 1]), mv(T, [0, 1])], { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1, alpha: 0.5 });
          P.arrow(0, 0, 1, 0, { color: 'teal', width: 1.4, alpha: 0.5 }); P.arrow(0, 0, 0, 1, { color: 'pink', width: 1.4, alpha: 0.5 });
          P.arrow(0, 0, h1.x, h1.y, { color: 'teal', width: 2.8 }); P.arrow(0, 0, h2.x, h2.y, { color: 'pink', width: 2.8 });
          const u = [uh.x, uh.y], w = [vh.x, vh.y], img = second ? mv(T, w) : mv(T, u);
          P.arrow(0, 0, u[0], u[1], { color: 'accent', width: 2.2 }); P.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.2 });
          P.arrow(0, 0, img[0], img[1], { color: second ? 'gold' : 'accent', width: 2, dash: [5, 4] });
          tip(P, second ? 'Tv' : 'Tu', img, second ? 'gold' : 'accent', { size: 14, off: 16 });
          // the matrices
          const W = R.width, H = R.height, cw = Math.max(32, Math.min(50, (W - 120) / 6)), ch = Math.min(30, cw * 0.72), gap = 26;
          const tot = 6 * cw + 2 * gap, X0 = (W - tot) / 2, Y1 = 50;
          const colT = (i, jj) => (second ? null : (jj === 0 ? 'teal' : 'pink'));
          const tint = (isT, trans) => (i, jj) => (isT ? [(trans ? i : jj) === 0 ? 'teal' : 'pink', 0.12] : null);
          matPx(v, R, Lm, X0, Y1, { cw, ch, row: j, fill: tint(!second, true), label: second ? '\\mathcal M(\\beta)' : '\\mathcal M(T)^{t}' });
          R.textPx('·', X0 + 2 * cw + gap / 2, Y1 + ch, { align: 'center', size: 22, color: 'muted' });
          matPx(v, R, Rm, X0 + 2 * cw + gap, Y1, { cw, ch, col: k, fill: tint(second, false), label: second ? '\\mathcal M(T)' : '\\mathcal M(\\beta)' });
          R.textPx('=', X0 + 4 * cw + 1.5 * gap, Y1 + ch, { align: 'center', size: 18, color: 'muted' });
          matPx(v, R, prod, X0 + 4 * cw + 2 * gap, Y1, { cw, ch, cells: [[j, k, 'gold']], frame: agree ? 'green' : 'red', frameW: 2.4, label: '\\text{product}' });
          const Y2 = Y1 + 2 * ch + 74, X2a = W / 4 - cw + 6, X2b = (3 * W) / 4 - cw - 6;
          box = matPx(v, R, direct, X2a, Y2, { cw, ch, cells: [[j, k, 'gold']], frame: 'ink', label: second ? '\\alpha(e_j, e_k) = \\beta(e_j, Te_k)' : '\\rho(e_j, e_k) = \\beta(Te_j, e_k)', labelSize: 13 });
          matPx(v, R, wrongP, X2b, Y2, { cw, ch, cells: [[j, k, wrongOK ? 'green' : 'red']], frame: wrongOK ? 'green' : 'red', frameW: 2, label: second ? '\\text{other order: } \\mathcal M(T)\\mathcal M(\\beta)' : '\\text{no transpose: } \\mathcal M(T)\\mathcal M(\\beta)', labelSize: 13, labelColor: 'red' });
          R.textPx('click an entry', X2a + cw, Y2 + 2 * ch + 14, { align: 'center', size: 11, color: 'muted' });
          // the expansion of the chosen entry
          const terms = [0, 1].map((m) => (second ? [B[j][m], T[m][k]] : [T[m][j], B[m][k]]));
          const ex = terms.map(([a, b]) => `${tn(a, 1).startsWith('-') ? `(${tn(a, 1)})` : tn(a, 1)}\\cdot${tn(b, 1).startsWith('-') ? `(${tn(b, 1)})` : tn(b, 1)}`).join(' + ');
          const head = second ? `\\beta(e_${j + 1}, Te_${k + 1})` : `\\beta(Te_${j + 1}, e_${k + 1})`;
          const Y3 = Y2 + 2 * ch + 52;
          R.texPx(`${head} = ${ex} = ${tn(direct[j][k], 2)}`, W / 2, Y3, { size: 15, color: 'gold' });
          R.texPx(second ? `\\text{row } ${j + 1} \\text{ of } \\mathcal M(\\beta) \\text{ against column } ${k + 1} \\text{ of } \\mathcal M(T)` : `\\text{column } ${j + 1} \\text{ of } \\mathcal M(T) \\text{ against column } ${k + 1} \\text{ of } \\mathcal M(\\beta)`, W / 2, Y3 + 28, { size: 13, color: 'muted' });
          const x = u, y = w, val = form(u, w), viaM = same(bil(direct, x, y), val);
          st = { second, prod, direct, wrongP, agree, wrongOK, val, viaM };
        });
        v.legend([['teal', '$Te_1$'], ['pink', '$Te_2$'], ['accent', '$u$'], ['gold', '$v$'], ['gold', 'chosen entry, its row and column', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const nm = st.second ? '\\alpha' : '\\rho', f = st.second ? '\\beta(u, Tv)' : '\\beta(Tu, v)', fm = st.second ? '\\mathcal M(\\beta)\\mathcal M(T)' : '\\mathcal M(T)^{t}\\mathcal M(\\beta)';
          return `$${nm}(u, v) = ${f} = ${tn(st.val, 3)}$, and from the matrix, $\\sum_{j,k}\\mathcal M(${nm})_{j,k}\\,u_jv_k = ${tn(st.viaM, 3)}$ ${mark(Math.abs(st.viaM - st.val) < 1e-9)}. $\\ \\mathcal M(${nm}) = ${mtex(st.direct)} = ${fm}$ ${mark(st.agree)}, whereas $\\mathcal M(T)\\mathcal M(\\beta) = ${mtex(st.wrongP)}$ ${st.wrongOK ? '(equal here only by coincidence)' : mark(false)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7',
      kind: 'Theorem',
      name: 'Change-of-basis formula for bilinear forms',
      statement: String.raw`Suppose $\beta \in V^{(2)}$, and $e_1, \dots, e_n$ and $f_1, \dots, f_n$ are bases of $V$. Let
$$A = \mathcal M\big(\beta, (e_1, \dots, e_n)\big), \quad B = \mathcal M\big(\beta, (f_1, \dots, f_n)\big), \quad C = \mathcal M\big(I, (e_1, \dots, e_n), (f_1, \dots, f_n)\big),$$
so that the $k$-th column of $C$ holds the coordinates of $e_k$ with respect to $f_1, \dots, f_n$. Then
$$A = C^{t}BC.$$`,
      idea: String.raw`By the linear map lemma (3.4) there is an operator $T$ with $Tf_k = e_k$ for each $k$; its matrix in the basis $f$ is $C$. Put $\rho(u, v) = \beta(Tu, Tv)$. Then $A_{j,k} = \beta(e_j, e_k) = \beta(Tf_j, Tf_k) = \rho(f_j, f_k)$, and applying 9.6 once to each slot gives $\mathcal M(\rho, f) = C^{t}BC$. Compare the change-of-basis formula for operators (3.84), $C^{-1}BC$: a transpose instead of an inverse. So the matrix of a bilinear form changes by *congruence*, not similarity — its trace, determinant and eigenvalues are not invariant ($\det A = (\det C)^2\det B$), but for symmetric forms the *signs* of the eigenvalues are (Sylvester's law of inertia), reflecting the fact that the curve $\beta(v, v) = 1$ does not depend on any basis.`,
      caption: String.raw`The same symmetric matrix $B$ is read in two ways in the standard basis: as a bilinear form $\beta$ (its curves $\beta(v, v) = \pm1$ in blue and orange) and as an operator $T$. Drag the new basis $e_1, e_2$. Right: the new matrices, $C^{t}BC$ for the form and $C^{-1}BC$ for the operator, and their eigenvalues on two number lines (compressed scale). The operator's eigenvalues never move; the form's slide around but never cross $0$ — their signs are fixed. On the left, the dotted green curve is drawn from the new matrix in the new coordinates and lies exactly on the true curves. Use the operator formula for the form instead and the dotted curve (now red) comes loose.`,
      deps: ['ladr-3.4', 'ladr-9.6'],
      see: ['ladr-3.84'],
      tags: ['bilinear forms', 'change of basis'],
      viz(v) {
        const PRE = { ind: [[1, 1.1], [1.1, -0.4]], pos: [[1.4, 0.5], [0.5, 0.7]] };
        const which = v.select('$B$', [{ value: 'ind', label: 'indefinite' }, { value: 'pos', label: 'positive definite' }], 'ind', { onChange: () => { trail.length = 0; } });
        const wrong = v.toggle('treat the form like an operator: $C^{-1}BC$', false);
        const P = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 400, minWidth: 280 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 300 });
        const e1 = P.handle(1.3, 0.35, { color: 'teal', label: 'e₁' });
        const e2 = P.handle(-0.6, 1.3, { color: 'pink', label: 'e₂' });
        const trail = [];
        let st = null;
        const sl = (x) => Math.sign(x) * Math.log1p(Math.abs(x));
        v.render(() => {
          const B = PRE[which.value], E = [[e1.x, e1.y], [e2.x, e2.y]], C = fromCols(E), dC = det2(E[0], E[1]), ok = Math.abs(dC) > 0.04;
          const A = mm(mm(tp(C), B), C), direct = gram(B, E), Ci = ok ? inv2(C) : null, Sm = ok ? mm(mm(Ci, B), C) : null;
          const used = wrong.value && ok ? Sm : A;
          // the plane
          if (ok) skewGrid(P, E[0], E[1], { alpha: 0.2 });
          P.clip(() => { P.path(conic(B, 1), { color: 'accent', width: 2.8 }); P.path(conic(B, -1), { color: 'orange', width: 2.8 }); });
          if (ok) {
            const back = mm(mm(tp(Ci), symPart(used)), Ci), col = wrong.value ? 'red' : 'green';
            P.clip(() => { P.path(conic(back, 1), { color: col, width: 2.2, dash: [2, 5] }); P.path(conic(back, -1), { color: col, width: 2.2, dash: [2, 5] }); });
          } else P.corner('e₁, e₂ are not a basis', 'tl', { color: 'red', weight: 700 });
          P.arrow(0, 0, E[0][0], E[0][1], { color: 'teal', width: 2.8 }); P.arrow(0, 0, E[1][0], E[1][1], { color: 'pink', width: 2.8 });
          // matrices
          const W = R.width, cw = Math.max(36, Math.min(52, (W - 70) / 4.6)), ch = 30, Y1 = 44;
          const XA = W / 4 - cw, XB = (3 * W) / 4 - cw;
          const formOK = maxAbs(msub(used, direct)) < 1e-9;
          matPx(v, R, used, XA, Y1, { cw, ch, frame: formOK ? 'green' : 'red', frameW: 2.2, label: wrong.value ? '\\text{form: } C^{-1}BC' : '\\text{form: } C^{t}BC', labelColor: wrong.value ? 'red' : 'ink' });
          if (ok) matPx(v, R, Sm, XB, Y1, { cw, ch, frame: 'purple', frameW: 2.2, label: '\\text{operator: } C^{-1}BC' });
          R.texPx(formOK ? '= \\big(\\beta(e_j, e_k)\\big)\\ ✓' : '\\ne \\big(\\beta(e_j, e_k)\\big)\\ ✗', XA + cw, Y1 + 2 * ch + 18, { size: 13, color: formOK ? 'green' : 'red' });
          if (ok) R.texPx('\\text{matrix of } T \\text{ in } e_1, e_2', XB + cw, Y1 + 2 * ch + 18, { size: 12, color: 'muted' });
          // eigenvalue number lines
          const lf = ok ? eig2r(symPart(A)).l : [NaN, NaN], lo = ok ? eig2r(Sm) : null, l0 = eig2r(B).l;
          if (ok && lf.every(isFinite) && (!trail.length || Math.abs(trail[trail.length - 1][0] - lf[0]) + Math.abs(trail[trail.length - 1][1] - lf[1]) > 0.02)) { trail.push(lf); if (trail.length > 160) trail.shift(); }
          const xl = 24, xr = W - 24, xc = (xl + xr) / 2, smax = sl(40), X = (l) => xc + (sl(l) / smax) * (xr - xc);
          const line = (Y, title, col) => {
            R.ctx.save(); R.ctx.fillStyle = v.color('red', 0.05); R.ctx.fillRect(xl, Y - 16, xc - xl, 32); R.ctx.fillStyle = v.color('blue', 0.05); R.ctx.fillRect(xc, Y - 16, xr - xc, 32); R.ctx.restore();
            R.ctx.save(); R.ctx.strokeStyle = v.color('muted'); R.ctx.lineWidth = 1.2; R.ctx.beginPath(); R.ctx.moveTo(xl, Y); R.ctx.lineTo(xr, Y); R.ctx.stroke();
            for (const t of [-30, -10, -3, -1, 0, 1, 3, 10, 30]) { R.ctx.beginPath(); R.ctx.moveTo(X(t), Y - (t ? 4 : 9)); R.ctx.lineTo(X(t), Y + (t ? 4 : 9)); R.ctx.stroke(); }
            R.ctx.restore();
            for (const t of [-30, -10, -3, -1, 0, 1, 3, 10, 30]) R.textPx(pn(t, 0), X(t), Y + 15, { align: 'center', size: 10, color: 'muted', halo: false });
            R.texPx(title, xl, Y - 26, { align: 'left', size: 13, color: col });
          };
          const Yf = Y1 + 2 * ch + 100, Yo = Yf + 92;
          line(Yf, '\\text{eigenvalues of the form\'s matrix } C^{t}BC', 'accent');
          line(Yo, '\\text{eigenvalues of the operator\'s matrix } C^{-1}BC', 'purple');
          for (const p of trail) for (const l of p) R.dots([[R.invX(X(l)), R.invY(Yf)]], { r: 2, color: 'accent', alpha: 0.25 });
          for (const l of l0) { R.dot(R.invX(X(l)), R.invY(Yf), { r: 7, hollow: true, color: 'muted', width: 1.4 }); }
          if (ok) {
            for (const l of lf) R.dot(R.invX(X(l)), R.invY(Yf), { r: 6, color: l > 0 ? 'blue' : 'red' });
            if (lo.real) for (const l of lo.l) R.dot(R.invX(X(l)), R.invY(Yo), { r: 6, color: 'purple' });
          }
          const sg = signature(lf, 1e-9);
          st = { ok, A, used, direct, formOK, Sm, lf, lo, l0, dC, detB: B[0][0] * B[1][1] - B[0][1] * B[1][0], sg, wrong: wrong.value };
        });
        v.legend([['accent', '$\\beta(v, v) = 1$'], ['orange', '$\\beta(v, v) = -1$'], ['green', 'curve rebuilt from the new matrix', { dash: [2, 4] }], ['muted', 'eigenvalues of $B$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return '$e_1, e_2$ are not a basis, so $C$ is not invertible and there is no matrix of $\\beta$ with respect to them.';
          const s = `$C^{t}BC = ${mtex(st.A)} = \\big(\\beta(e_j, e_k)\\big)$ ${mark(maxAbs(msub(st.A, st.direct)) < 1e-9)}: $\\det = (\\det C)^2\\det B = ${tn(st.dC * st.dC, 2)}\\cdot(${tn(st.detB, 2)}) = ${tn(st.dC * st.dC * st.detB, 3)}$, eigenvalues $${tn(st.lf[0])}, ${tn(st.lf[1])}$ — signs $(n_+, n_-) = (${st.sg[0]}, ${st.sg[1]})$ as for $B$. The operator's $C^{-1}BC$ keeps trace $${tn(st.Sm[0][0] + st.Sm[1][1])}$ and determinant $${tn(st.detB)}$ of $B$.`;
          return st.wrong ? s + ` **But** $C^{-1}BC = ${mtex(st.Sm)}$ is not the matrix of the form: it disagrees with $\\big(\\beta(e_j, e_k)\\big)$, and the red curve it predicts is wrong.` : s;
        });
      },
    },
    // ------------------------------------------------------------------ 9.9
    {
      num: '9.9',
      kind: 'Definition',
      name: 'Symmetric bilinear form',
      statement: String.raw`A bilinear form $\rho \in V^{(2)}$ is called **symmetric** if
$$\rho(u, w) = \rho(w, u) \qquad\text{for all } u, w \in V.$$
The set of symmetric bilinear forms on $V$ is denoted $V^{(2)}_{\mathrm{sym}}$. A square matrix $A$ is called **symmetric** if $A^{t} = A$.`,
      idea: String.raw`Examples: a real inner product; $\langle u, Tw\rangle$ on a real inner product space, which is symmetric exactly when $T$ is self-adjoint (7.10); $\operatorname{tr}(ST)$ on $\mathcal L(V)$, because $\operatorname{tr}(ST) = \operatorname{tr}(TS)$. Expanding in a basis with $A = \mathcal M(\rho)$ gives $\rho(u, w) - \rho(w, u) = \sum_{j,k}(A_{j,k} - A_{k,j})\,x_jy_k$, so a form is symmetric exactly when its matrix is (9.12 makes this precise). On $\mathbf R^2$ the defect is $(A_{1,2} - A_{2,1})(u_1w_2 - u_2w_1)$: a multiple of the signed area of the parallelogram on $u$ and $w$.`,
      caption: String.raw`Right: the chart of all values $\rho(u, w)$ for unit vectors $u, w$, the angle of the first input across and of the second up. Swapping the inputs is reflection in the dashed diagonal, so $\rho$ is symmetric exactly when the chart is mirror-symmetric — the black level lines and their reflections (gold) coincide. Drag $u$ and $w$ on the circle: the gold point is $(u, w)$, the purple one its mirror image $(w, u)$. Add a skew part $s$ (or pick a non-self-adjoint $T$): the picture loses its mirror symmetry and the parallelogram on the left fills with the defect $\rho(u, w) - \rho(w, u) = s \cdot (\text{signed area})$.`,
      deps: ['ladr-9.1'],
      see: ['ladr-7.10'],
      tags: ['bilinear forms', 'symmetry'],
      viz(v) {
        const BASE = { sa: [[1, 0.8], [0.8, -0.5]], dot: [[1, 0], [0, 1]], ns: [[1, 0.8], [0.8, -0.5]] };
        const pre = v.select('$\\rho(u, w) = \\langle u, Tw\\rangle$ with', [{ value: 'sa', label: '$T$ self-adjoint' }, { value: 'dot', label: '$T = I$' }, { value: 'ns', label: '$T$ not self-adjoint' }], 'sa', { onChange: (k) => sk.set(k === 'ns' ? 1.2 : 0) });
        const sk = v.slider('skew part $s = A_{1,2} - A_{2,1}$', -2, 2, 0, { step: 0.05 });
        const P = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 380, weight: 0.85, minWidth: 250 });
        const R = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', height: 380, weight: 1.15, xticks: PI_TICKS, yticks: PI_TICKS, xlabel: 'angle of the first input', ylabel: 'angle of the second input', title: '$\\rho(\\text{first}, \\text{second})$ on unit vectors' });
        const onC = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const uh = P.handle(Math.cos(0.6), Math.sin(0.6), { color: 'accent', label: 'u', constrain: onC });
        const wh = P.handle(Math.cos(2.2), Math.sin(2.2), { color: 'gold', label: 'w', constrain: onC });
        let st = null;
        v.render(() => {
          const S0 = BASE[pre.value], s = sk.value, A = [[S0[0][0], S0[0][1] + s / 2], [S0[1][0] - s / 2, S0[1][1]]];
          const u = [uh.x, uh.y], w = [wh.x, wh.y], ang = (p) => (Math.atan2(p[1], p[0]) + TAU) % TAU, a = ang(u), b = ang(w);
          const ruw = bil(A, u, w), rwu = bil(A, w, u), d = ruw - rwu, area = det2(u, w);
          // the plane
          P.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          P.poly([[0, 0], u, add(u, w), w], { fill: d >= 0 ? 'blue' : 'red', fillAlpha: Math.min(0.5, 0.35 * Math.abs(d)), color: 'muted', width: 1, dash: [4, 4] });
          if (Math.abs(d) > 0.05) P.text(`ρ(u,w) − ρ(w,u) = ${pn(d, 2)}`, (u[0] + w[0]) / 2, (u[1] + w[1]) / 2, { align: 'center', size: 12, color: d > 0 ? 'blue' : 'red', weight: 700 });
          P.arrow(0, 0, u[0], u[1], { color: 'accent', width: 2.6 }); P.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.6 });
          P.corner(`ρ(u, w) = ${pn(ruw, 3)}`, 'tl', { color: 'gold', weight: 700 });
          P.corner(`ρ(w, u) = ${pn(rwu, 3)}`, 'bl', { color: 'purple', weight: 700 });
          // the chart and its mirror image
          const Pc = v.rgb('blue'), Nc = v.rgb('red'), BG = v.rgb('panel');
          R.raster((x, y) => (x < 0 || y < 0 || x > TAU || y > TAU ? null : divCol(chartVal(A, x, y), 1.8, Pc, Nc, BG, 0.75)), { key: `${A.flat()}|${BG}`, res: 2 });
          const lv = [-1.5, -1, -0.5, 0.5, 1, 1.5];
          R.contour((x, y) => chartVal(A, y, x), lv, { color: 'gold', width: 2.6, res: 90 });
          R.contour((x, y) => chartVal(A, y, x), [0], { color: 'gold', width: 3.6, res: 90 });
          R.contour((x, y) => chartVal(A, x, y), lv, { color: 'ink', width: 1, res: 90 });
          R.contour((x, y) => chartVal(A, x, y), [0], { color: 'ink', width: 1.8, res: 90 });
          R.line(0, 0, TAU, TAU, { color: 'ink', width: 1.4, dash: [6, 5], alpha: 0.7 });
          R.line(a, b, b, a, { color: 'muted', width: 1.4, dash: [3, 4] });
          R.dot(a, b, { r: 7, color: 'gold', label: '(u, w)', labelPos: 'ne' });
          R.dot(b, a, { r: 7, color: 'purple', label: '(w, u)', labelPos: 'sw' });
          R.axes();
          st = { A, ruw, rwu, d, area, s };
        });
        v.legend([['ink', 'levels of $\\rho$'], ['gold', 'levels of the swapped form $\\rho(w, u)$'], ['blue', '$> 0$', { area: true }], ['red', '$< 0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const sym = Math.abs(st.s) < 1e-9;
          return `$A = \\mathcal M(\\rho) = ${mtex(st.A)}$. $\\ \\rho(u, w) = ${tn(st.ruw, 3)}$, $\\rho(w, u) = ${tn(st.rwu, 3)}$, and $\\rho(u, w) - \\rho(w, u) = ${tn(st.d, 3)} = (A_{1,2} - A_{2,1})(u_1w_2 - u_2w_1) = ${tn(st.s, 2)} \\cdot ${tn(st.area, 3)}$ ${mark(Math.abs(st.d - st.s * st.area) < 1e-9)}. ` + (sym ? '**Symmetric**: $A = A^{t}$, so the values agree for every pair.' : '**Not symmetric**: $A \\ne A^{t}$, and the values differ for every pair of independent vectors.');
        });
      },
    },

    // ------------------------------------------------------------------ 9.12
    {
      num: '9.12',
      kind: 'Theorem',
      name: 'Symmetric bilinear forms are diagonalizable',
      statement: String.raw`Suppose $\rho \in V^{(2)}$. The following are equivalent:
(a) $\rho$ is a symmetric bilinear form on $V$;
(b) $\mathcal M\big(\rho, (e_1, \dots, e_n)\big)$ is a symmetric matrix for every basis $e_1, \dots, e_n$ of $V$;
(c) $\mathcal M\big(\rho, (e_1, \dots, e_n)\big)$ is a symmetric matrix for some basis $e_1, \dots, e_n$ of $V$;
(d) $\mathcal M\big(\rho, (e_1, \dots, e_n)\big)$ is a diagonal matrix for some basis $e_1, \dots, e_n$ of $V$.`,
      idea: String.raw`(a)⇒(b)⇒(c) are immediate; (c)⇒(a) by expanding $\rho(u, w)$ in the basis; (d)⇒(c) because diagonal matrices are symmetric. The heart is (a)⇒(d), by induction on $\dim V$. If $\rho = 0$ any basis works. Otherwise some $\rho(u, w) \ne 0$, and the identity
$$2\rho(u, w) = \rho(u + w, u + w) - \rho(u, u) - \rho(w, w)$$
produces a vector $v$ with $\rho(v, v) \ne 0$. Its $\rho$-orthogonal space $U = \{u : \rho(u, v) = 0\}$ is the null space of a nonzero linear functional, so $\dim U = n - 1$ and $v \notin U$. By induction $U$ has a basis $e_1, \dots, e_{n-1}$ in which $\rho|_U$ is diagonal; then $e_1, \dots, e_{n-1}, v$ diagonalizes $\rho$, since $\rho(e_k, v) = 0$ by construction and $\rho(v, e_k) = 0$ **by symmetry** — the one step that uses (a). The diagonal entries depend on the choices, but by Sylvester's law of inertia the numbers of positive, negative and zero entries do not.`,
      caption: String.raw`A bilinear form on $\mathbf R^3$; the grey rays form its cone of isotropic vectors, where $\rho(x, x) = 0$. Drag $v_1$ (blue) anywhere off the cone: the orange plane is $U_1 = \{u : \rho(u, v_1) = 0\}$. Drag $v_2$ (purple), which stays in $U_1$; the green line is $U_2 = \{u \in U_1 : \rho(u, v_2) = 0\}$, and it gives $v_3$. On the right, the matrix of $\rho$ in the basis $v_1, v_2, v_3$ is diagonal however you choose; its diagonal entries change, their signs never do. Put $v_1$ on the cone and the step breaks down ($v_1 \in U_1$). In *every axis isotropic* all $\rho(e_j, e_j) = 0$, and the start $v_1 = e_1 + e_2$ comes from the identity above. For *not symmetric* only the entries below the diagonal vanish. Drag the background to rotate.`,
      deps: ['ladr-9.9', 'ladr-9.4'],
      tags: ['bilinear forms', 'diagonalization'],
      viz(v) {
        const M = v.M;
        const PRE = {
          ind: { A: [[1, 0.6, 0.4], [0.6, -0.2, 0.7], [0.4, 0.7, 0.3]], v1: [-0.48, 1.03, 0.17], view: [-0.5, 0.3] },
          iso: { A: [[0, 1, 0.5], [1, 0, 0.8], [0.5, 0.8, 0]], v1: [0.85, 0.85, 0], view: [2.58, 0.34] },
          pos: { A: [[1.6, 0.4, 0.2], [0.4, 1.1, -0.3], [0.2, -0.3, 0.8]], v1: [0.18, -0.36, 1.08], view: [-0.5, 0.3] },
          ns: { A: [[1, 0.9, -0.2], [-0.3, -0.5, 0.8], [0.6, -0.4, 0.4]], v1: [0.66, -0.6, -0.73], view: [-0.5, 0.3] },
        };
        const pre = v.select('$\\rho$', [{ value: 'ind', label: 'indefinite' }, { value: 'iso', label: 'every axis isotropic' }, { value: 'pos', label: 'positive definite' }, { value: 'ns', label: 'not symmetric' }], 'ind', { onChange: (k) => { [sc.yaw, sc.pitch] = PRE[k].view; h1.set(PRE[k].v1); h2.set([0.1, 0.95, -0.5]); } });
        const S = v.stage({ x: [-2, 2], y: [-1.85, 1.85], equal: true, axes: false, height: 420, weight: 1.2 });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 0.8, minWidth: 260 });
        const h1 = sc.handle(PRE.ind.v1, { color: 'accent', label: 'v₁' });
        const h2 = sc.handle([0.1, 0.95, -0.5], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'purple', label: 'v₂' });
        let st = null;
        v.render(() => {
          const key = pre.value, A = PRE[key].A, As = symPart(A), symm = key !== 'ns';
          sc.begin();
          const iso = drawIso(sc, M, As);
          // step 1: v₁ and its ρ-orthogonal plane U₁ = (Av₁)^⊥
          const v1 = h1.p, q1 = bil(A, v1, v1), n1 = mv(A, v1), [a1, b1] = perpPair(n1);
          h2.a = a1; h2.b = b1;
          { const nn = unit(n1); let p = sub(h2.p, scl(nn, dot(h2.p, nn))); if (len(p) < 0.25) p = scl(a1, 0.95); h2.p = p; }
          // step 2: v₂ ∈ U₁ and U₂ = U₁ ∩ (Av₂)^⊥
          const v2 = h2.p, q2 = bil(A, v2, v2), n2 = mv(A, v2);
          let d3 = cross(n1, n2); const ok3 = len(d3) > 1e-6 * Math.max(1, len(n1) * len(n2));
          if (det3(v1, v2, d3) < 0) d3 = scl(d3, -1);
          const v3 = ok3 ? scl(unit(d3), 1.15) : [0, 0, 0];
          sc.disc(a1, b1, 1.3, { fill: 'orange', fillAlpha: 0.11, color: 'orange', grid: true, alpha: 0.6 });
          sc.tex('U_1', scl(add(a1, b1), 0.95), { color: 'orange', size: 15, top: true });
          if (ok3) { const d = unit(d3); sc.line(scl(d, -1.65), scl(d, 1.65), { color: 'green', width: 2.2, alpha: 0.75 }, 14); sc.tex('U_2', scl(d, -1.75), { color: 'green', size: 15 }); }
          if (key === 'iso') {
            const e1 = [0.85, 0, 0], e2 = [0, 0.85, 0];
            sc.arrow([0, 0, 0], e1, { color: 'muted', width: 1.8 }); sc.arrow([0, 0, 0], e2, { color: 'muted', width: 1.8 });
            sc.line(e1, add(e1, e2), { color: 'muted', dash: [4, 4], width: 1.2 }); sc.line(e2, add(e1, e2), { color: 'muted', dash: [4, 4], width: 1.2 });
            sc.tex('e_1', e1, { color: 'muted', size: 13, dx: 4, dy: 12 }); sc.tex('e_2', e2, { color: 'muted', size: 13, dx: 10, dy: 8 });
          }
          sc.arrow([0, 0, 0], v1, { color: 'accent', width: 3 });
          sc.arrow([0, 0, 0], v2, { color: 'purple', width: 3 });
          if (ok3) { sc.arrow([0, 0, 0], v3, { color: 'green', width: 3 }); sc.tex('v_3', v3, { color: 'green', size: 15, dx: 12, dy: -10 }); }
          sc.flush();
          const basis = [v1, v2, v3], dB = det3(v1, v2, v3), isBasis = ok3 && Math.abs(dB) > 0.03;
          const bad1 = Math.abs(q1) < 0.05 * dot(v1, v1), bad2 = Math.abs(q2) < 0.05 * dot(v2, v2);
          if (bad1) S.corner('ρ(v₁, v₁) ≈ 0: v₁ lies in U₁ — choose another v₁', 'tl', { color: 'red', weight: 700 });
          else if (bad2) S.corner('ρ(v₂, v₂) ≈ 0: v₂ lies in U₂ — choose another v₂', 'tl', { color: 'red', weight: 700 });
          // the matrix of ρ in the basis v₁, v₂, v₃
          const Mr = gram(A, basis), W = R.width, H = R.height, cw = Math.min(64, (W - 70) / 3), ch = Math.min(44, cw * 0.75), X0 = (W - 3 * cw) / 2 + 10, Y0 = 70;
          const zero = (x) => Math.abs(x) < 1e-9;
          matPx(v, R, Mr, X0, Y0, {
            cw, ch, size: 15, label: '\\mathcal M\\big(\\rho, (v_1, v_2, v_3)\\big)', labelSize: 15,
            fill: (i, j) => (i === j ? [Mr[i][i] > 1e-9 ? 'blue' : Mr[i][i] < -1e-9 ? 'red' : 'muted', 0.18] : zero(Mr[i][j]) ? ['green', 0.1] : ['red', 0.18]),
            color: (i, j) => (i !== j && zero(Mr[i][j]) ? 'green' : 'ink'),
          });
          ['v_1', 'v_2', 'v_3'].forEach((t, i) => R.texPx(t, X0 - 18, Y0 + (i + 0.5) * ch, { size: 14, color: ['accent', 'purple', 'green'][i] }));
          const dg = [0, 1, 2].map((i) => Mr[i][i]), sg = signature(dg, 1e-9), ev = M.eigSym(As).values, sgE = signature(ev, 1e-7);
          const sgn = (x) => (x > 1e-9 ? '+' : x < -1e-9 ? '-' : '0');
          let y = Y0 + 3 * ch + 36;
          const line = (tex, col = 'ink', size = 14) => { R.texPx(tex, W / 2, y, { size, color: col }); y += 30; };
          if (!isBasis) line('\\text{not a basis}', 'red', 15);
          else if (symm) {
            line(`\\text{diagonal signs } (${dg.map(sgn).join(', ')})`, 'ink');
            line(`(n_+, n_-, n_0) = (${sg.join(', ')})`, 'ink', 15);
            line(`\\text{eigenvalues of } \\mathcal M(\\rho, \\text{std}):`, 'muted', 13);
            line(ev.map((x) => tn(x, 2)).join(',\\ \\ '), 'muted', 13);
            line(`\\text{signs } (${sgE.join(', ')}) \\text{ — the same}`, sgE.join() === sg.join() ? 'green' : 'red', 13);
          } else {
            line('\\text{below the diagonal: all } 0', 'green');
            line('\\text{above: } \\rho(v_1, v_2) = ' + tn(Mr[0][1], 2), 'red');
            line('\\text{not diagonal: } \\rho(v_1, v_2) \\ne \\rho(v_2, v_1)', 'red', 13);
          }
          st = { Mr, dg, sg, ev, sgE, symm, isBasis, bad1, bad2, iso };
        });
        v.legend([['accent', '$v_1$'], ['orange', '$U_1 = \\{u : \\rho(u, v_1) = 0\\}$', { area: true }], ['purple', '$v_2 \\in U_1$'], ['green', '$U_2$ and $v_3$'], ['muted', 'isotropic cone']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.isBasis) return 'With this choice $v_1, v_2, v_3$ is not a basis: an isotropic vector ($\\rho(v, v) = 0$) lies in its own $\\rho$-orthogonal space, which is why the proof first finds a $v$ with $\\rho(v, v) \\ne 0$ (from the identity $2\\rho(u, w) = \\rho(u + w, u + w) - \\rho(u, u) - \\rho(w, w)$).';
          const off = Math.max(...[[0, 1], [0, 2], [1, 2], [1, 0], [2, 0], [2, 1]].map(([i, j]) => Math.abs(st.Mr[i][j])));
          if (st.symm) return `$\\mathcal M\\big(\\rho, (v_1, v_2, v_3)\\big) = \\operatorname{diag}(${st.dg.map((x) => tn(x, 3)).join(', ')})$, largest off-diagonal entry $${v.sci(off, 2)}$. Signs $(n_+, n_-, n_0) = (${st.sg.join(', ')})$ — the same as the signs of the eigenvalues of the standard matrix, for every admissible choice of $v_1, v_2$ (Sylvester's law of inertia).`;
          return `$\\mathcal M\\big(\\rho, (v_1, v_2, v_3)\\big) = ${mtex(st.Mr)}$: the entries $\\rho(v_2, v_1), \\rho(v_3, v_1), \\rho(v_3, v_2)$ vanish by construction, but without symmetry nothing forces $\\rho(v_1, v_2)$ and its companions to vanish. A non-symmetric form has no diagonal matrix in any basis: (d) implies (a).`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.13
    {
      num: '9.13',
      kind: 'Theorem',
      name: 'Diagonalizing a symmetric form by an orthonormal basis',
      statement: String.raw`Suppose $V$ is a real inner product space and $\rho$ is a symmetric bilinear form on $V$. Then $\rho$ has a diagonal matrix with respect to some orthonormal basis of $V$.`,
      idea: String.raw`Take any orthonormal basis $f_1, \dots, f_n$ and let $B = \mathcal M(\rho, f)$, a symmetric matrix by 9.12. The operator $T$ with $\mathcal M(T, f) = B$ is self-adjoint (its matrix in an orthonormal basis equals its transpose), so the real spectral theorem (7.29) gives an orthonormal basis $e_1, \dots, e_n$ in which $T$ is diagonal: $C^{-1}BC$ is diagonal, where $C = \mathcal M\big(I, (e), (f)\big)$ (3.84). Because $C$ is a real unitary matrix, $C^{-1} = C^{t}$ (7.57), so by 9.7 $\mathcal M(\rho, e) = C^{t}BC = C^{-1}BC$ is diagonal. The inner product has nothing to do with $\rho$: the theorem diagonalizes two quadratic forms at once — the positive definite $\langle v, v\rangle$ (to the identity) and $\rho(v, v)$. The proof fails over $\mathbf C$, where a symmetric matrix need not be self-adjoint.`,
      caption: String.raw`Left: the dashed ellipse is the unit circle of the inner product $\langle x, y\rangle = x_1y_1 + c\,x_2y_2$, and the blue and orange curves are $\rho(v, v) = 1$ and $\rho(v, v) = -1$. Drag $f_1$ around the dashed ellipse; $f_2$ is the unit vector orthogonal to it *for this inner product*, so $f_1, f_2$ is always an orthonormal basis. Right: the same picture in the coordinates of $f_1, f_2$, where the inner product becomes the ordinary dot product and the curves are those of $\mathcal M(\rho, (f_1, f_2))$. When the dashed green principal axes line up with the coordinate axes (the handle snaps there) the matrix is diagonal. With $c \ne 1$ the solution is orthonormal but does not look perpendicular. A skew part $s$ breaks symmetry: the curves can still be aligned, but the matrix keeps the off-diagonal entries $\pm s/\sqrt c$.`,
      deps: ['ladr-9.12', 'ladr-7.29', 'ladr-3.84', 'ladr-9.7', 'ladr-7.57'],
      see: ['mech-11.4'],
      tags: ['bilinear forms', 'spectral theorem'],
      viz(v) {
        const PRE = { ell: [[1.3, 0.55], [0.55, 0.6]], hyp: [[0.5, 0.9], [0.9, -0.4]] };
        const pre = v.select('$\\rho$', [{ value: 'ell', label: 'ellipse type' }, { value: 'hyp', label: 'hyperbola type' }], 'ell');
        const cw = v.slider('weight $c$ in $\\langle x, y\\rangle = x_1y_1 + c\\,x_2y_2$', 0.3, 3, 1, { step: 0.05 });
        const sk = v.slider('skew part $s$ added to $\\rho$', -1, 1, 0, { step: 0.05 });
        const P = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 380, title: 'in $V = \\mathbf R^2$' });
        const Q = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 380, title: 'in the coordinates of $f_1, f_2$' });
        let t = 0.2;
        /** Angles (in whitened coordinates y = G^{1/2}x) of the G-orthonormal eigen-directions of the symmetric part. */
        const targets = () => {
          const c = cw.value, Bs = PRE[pre.value], r = Math.sqrt(c), Bt = [[Bs[0][0], Bs[0][1] / r], [Bs[1][0] / r, Bs[1][1] / c]], E = esym2(Bt);
          return E.u.flatMap((u) => { const a = Math.atan2(u[1], u[0]); return [a, a + Math.PI, a - Math.PI, a + TAU, a - TAU]; });
        };
        const fh = P.handle(Math.cos(t), Math.sin(t), {
          color: 'gold', label: 'f₁', constrain: (x, y) => {
            const r = Math.sqrt(cw.value); let tt = Math.atan2(y * r, x);
            for (const z of targets()) if (Math.abs(tt - z) < 3.5 / DEG) tt = z;
            t = tt; return [Math.cos(t), Math.sin(t) / r];
          },
        });
        let st = null;
        v.render(() => {
          const c = cw.value, r = Math.sqrt(c), s = sk.value, Bs = PRE[pre.value], Bf = [[Bs[0][0], Bs[0][1] + s], [Bs[1][0] - s, Bs[1][1]]], G = [[1, 0], [0, c]];
          const f1 = [Math.cos(t), Math.sin(t) / r], f2 = [-Math.sin(t), Math.cos(t) / r];
          fh.x = f1[0]; fh.y = f1[1];
          const F = fromCols([f1, f2]), Mf = mm(mm(tp(F), Bf), F), Mg = mm(mm(tp(F), G), F), Ms = symPart(Mf);
          const diag = Math.abs(Mf[0][1]) < 1e-9 && Math.abs(Mf[1][0]) < 1e-9, aligned = Math.abs(Ms[0][1]) < 1e-9;
          // left: the plane
          const ell = []; for (let k = 0; k <= 120; k++) { const a = (TAU * k) / 120; ell.push([Math.cos(a), Math.sin(a) / r]); }
          P.path(ell, { color: 'muted', width: 1.4, dash: [5, 4] });
          P.clip(() => { P.path(conic(Bs, 1), { color: 'accent', width: 2.6 }); P.path(conic(Bs, -1), { color: 'orange', width: 2.6 }); });
          if (aligned) for (const f of [f1, f2]) { const u = unit(f); P.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: 'green', width: 1.4, alpha: 0.7 }); }
          P.arrow(0, 0, f1[0], f1[1], { color: 'gold', width: 3 });
          P.arrow(0, 0, f2[0], f2[1], { color: 'purple', width: 3 }); tip(P, 'f_2', f2, 'purple', { off: 16 });
          // right: in f-coordinates
          Q.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
          Q.clip(() => { Q.path(conic(Ms, 1), { color: 'accent', width: 2.6 }); Q.path(conic(Ms, -1), { color: 'orange', width: 2.6 }); });
          const E = esym2(Ms);
          for (const u of E.u) Q.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: 'green', width: 1.6, dash: [7, 5], alpha: aligned ? 1 : 0.75 });
          Q.arrow(0, 0, 1, 0, { color: 'gold', width: 3 }); Q.arrow(0, 0, 0, 1, { color: 'purple', width: 3 });
          Q.tex('f_1', 1, 0, { color: 'gold', dx: 12, dy: 12 }); Q.tex('f_2', 0, 1, { color: 'purple', dx: 14, dy: 8 });
          const tilt = ((((E.phi * DEG) % 90) + 135) % 90) - 45;
          Q.corner(aligned ? (diag ? 'diagonal: aligned with the axes' : 'aligned, but the skew part stays') : `principal axes tilted by ${pn(tilt, 1)}°`, 'tl', { color: aligned ? (diag ? 'green' : 'red') : 'muted', weight: 700 });
          st = { Mf, Mg, diag, aligned, s, c };
        });
        v.legend([['muted', 'unit circle of $\\langle\\cdot,\\cdot\\rangle$', { dash: true }], ['accent', '$\\rho(v, v) = 1$'], ['orange', '$\\rho(v, v) = -1$'], ['gold', '$f_1$'], ['purple', '$f_2$'], ['green', 'principal axes', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `$\\mathcal M\\big(\\rho, (f_1, f_2)\\big) = ${mtex(st.Mf, 3)}$, and $\\big(\\langle f_j, f_k\\rangle\\big) = ${mtex(st.Mg, 3)}$: an orthonormal basis. `;
          if (st.diag) return head + `**Diagonal**, with entries $\\rho(f_1, f_1) = ${tn(st.Mf[0][0], 3)}$ and $\\rho(f_2, f_2) = ${tn(st.Mf[1][1], 3)}$ — the eigenvalues of the self-adjoint operator $T$ with $\\langle Tu, w\\rangle = \\rho(u, w)$.`;
          if (Math.abs(st.s) > 1e-9) return head + `The off-diagonal entries are $${tn(st.Mf[0][1], 3)}$ and $${tn(st.Mf[1][0], 3)}$: their difference is $2s/\\sqrt c = ${tn((2 * st.s) / Math.sqrt(st.c), 3)}$ for *every* orthonormal basis, so they never vanish together — a non-symmetric form is not diagonalizable at all (9.12).`;
          return head + 'Rotate $f_1$ until the off-diagonal entries vanish (the handle snaps there).';
        });
      },
    },
  ],
};
