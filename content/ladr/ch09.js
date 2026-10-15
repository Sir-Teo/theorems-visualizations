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
        const S3 = v.stage3d({ range: 2.05, height: 370, yaw: -0.5, pitch: 0.45, labels: ['x₁', 'x₂', ''], title: 'its graph over $[-1.6, 1.6]^2$ (heights $\\times 0.3$)' });
        const uh = P.handle(0.8, 0.7, { color: 'accent', label: 'u', constrain: disc(1.5) });
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
          S3.surface((x, y) => [x, y, k * f(x, y)], [-R, R], [-R, R], { n: 24, alpha: 0.7, colorFn: (x, y, p) => v.mix('panel', p[2] >= 0 ? 'blue' : 'red', 0.3 + 0.7 * Math.min(1, Math.abs(p[2]) / zm)) });
          if (cand.value !== 'nrm') {
            // the zero level of the frozen functional, drawn on the graph
            const g = first ? mv(tp(A), u) : mv(A, u), d = unit(rot90(g)), c0 = cand.value === 'aff' ? -1 : 0, gg = dot(g, g);
            if (gg > 1e-9) { const p0 = scl(g, c0 / gg), pts = []; for (let t = -3; t <= 3; t += 0.1) { const q = add(p0, scl(d, t)); if (Math.abs(q[0]) <= R && Math.abs(q[1]) <= R) pts.push([q[0], q[1], 0]); } S3.path(pts, { color: 'purple', width: 2.4 }); }
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
  ],
};
