// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 8 (9.79–9.92): the universal property (bilinear maps ↔ linear maps on V ⊗ W), the inner product on V ⊗ W and
// its orthonormal bases, then several factors: m-linear functionals, V₁ ⊗ ⋯ ⊗ V_m, its dimension and basis, and
// m-linear maps ↔ linear maps. Part 7 (9.68–9.77) is ch09-g.js.
//
// Elements of F^{n₁} ⊗ ⋯ ⊗ F^{n_m} are drawn as arrays of coefficients in the basis of tensor products of standard basis
// vectors: a 2D grid for two factors, a 3D block of cells (scene3) for three. Blue = positive, red = negative.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** A factor for a TeX product: negative numbers in parentheses. */
const tp = (x, d = 2) => (x < -0.5 * 10 ** -d ? `(${tn(x, d)})` : tn(x, d));
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
const mark = (ok) => (ok ? '✓' : '✗');
const etx = (M, e) => (e === 0 ? '0' : M.sci(e, 2));

// ---------- vectors, matrices, 3-way arrays ----------
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const transp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const outer = (a, b) => a.map((x) => b.map((y) => x * y));
const outer3 = (a, b, c) => a.map((x) => b.map((y) => c.map((z) => x * y * z)));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const maxAbs = (A) => { let m = 0; for (const x of [A].flat(Infinity)) m = Math.max(m, Math.abs(x)); return m; };
const rot = (p, t) => [Math.cos(t) * p[0] - Math.sin(t) * p[1], Math.sin(t) * p[0] + Math.cos(t) * p[1]];
const r1 = (x) => Math.round(x * 10) / 10;
const nrank = (S, rel = 1e-9) => S.filter((s) => s > rel * Math.max(S[0] || 0, 1e-300) && s > 1e-13).length;
/** Kronecker product of matrices. */
const kron = (A, B) => A.flatMap((ra) => B.map((rb) => ra.flatMap((a) => rb.map((b) => a * b))));
/** Apply matrices to the three modes of a 3-way array: out_{ijk} = Σ A_{ip} B_{jq} C_{kr} T_{pqr}. */
function mode3(T, A, B, C) {
  const n1 = A.length, n2 = B.length, n3 = C.length, p1 = T.length, p2 = T[0].length, p3 = T[0][0].length;
  const out = [];
  for (let i = 0; i < n1; i++) { out.push([]); for (let j = 0; j < n2; j++) { out[i].push([]); for (let k = 0; k < n3; k++) {
    let s = 0;
    for (let p = 0; p < p1; p++) for (let q = 0; q < p2; q++) for (let r = 0; r < p3; r++) s += A[i][p] * B[j][q] * C[k][r] * T[p][q][r];
    out[i][j].push(s);
  } } }
  return out;
}
const add3 = (S, T) => S.map((P, i) => P.map((r, j) => r.map((x, k) => x + T[i][j][k])));
const scl3 = (T, c) => T.map((P) => P.map((r) => r.map((x) => x * c)));
const zeros3 = (a, b, c) => Array.from({ length: a }, () => Array.from({ length: b }, () => Array(c).fill(0)));
/** The three unfoldings (flattenings) of a 3-way array, as matrices. */
function unfold(T) {
  const n1 = T.length, n2 = T[0].length, n3 = T[0][0].length, A = [], B = [], C = [];
  for (let i = 0; i < n1; i++) { const r = []; for (let j = 0; j < n2; j++) for (let k = 0; k < n3; k++) r.push(T[i][j][k]); A.push(r); }
  for (let j = 0; j < n2; j++) { const r = []; for (let i = 0; i < n1; i++) for (let k = 0; k < n3; k++) r.push(T[i][j][k]); B.push(r); }
  for (let k = 0; k < n3; k++) { const r = []; for (let i = 0; i < n1; i++) for (let j = 0; j < n2; j++) r.push(T[i][j][k]); C.push(r); }
  return [A, B, C];
}

// ---------- drawing ----------
/** An m×n array on a 2D stage, square cells of side c, top-left corner (x0, y0); blue > 0, red < 0. */
function grid(S, A, x0, y0, c, o = {}) {
  const m = A.length, n = A[0].length, s = o.scale || Math.max(1e-9, maxAbs(A)), dec = o.dec ?? 2;
  const px = Math.abs(S.X(c) - S.X(0)), fs = o.size ?? Math.max(8, Math.min(13, px * 0.3));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const a = A[i][j], X = x0 + j * c, Y = y0 - (i + 1) * c, t = Math.min(1, Math.abs(a) / s);
    if (t > 1e-9) S.rect(X, Y, X + c, Y + c, { fill: a > 0 ? 'blue' : 'red', fillAlpha: (o.alpha ?? 0.6) * (0.1 + 0.9 * t), stroke: false });
    if (o.numbers !== false && px >= (o.minPx ?? 26)) S.text(pn(a, dec), X + c / 2, Y + c / 2, { size: fs, align: 'center', baseline: 'middle', color: Math.abs(a) < 0.5 * 10 ** -dec ? 'faint' : 'ink', halo: false });
  }
  for (let k = 1; k < n; k++) S.line(x0 + k * c, y0, x0 + k * c, y0 - m * c, { color: 'grid', width: 0.7 });
  for (let k = 1; k < m; k++) S.line(x0, y0 - k * c, x0 + n * c, y0 - k * c, { color: 'grid', width: 0.7 });
  S.rect(x0, y0 - m * c, x0 + n * c, y0, { color: o.frame || 'muted', width: o.fw ?? 1.2 });
  for (const [i, j, col] of o.hl || []) S.rect(x0 + j * c, y0 - (i + 1) * c, x0 + (j + 1) * c, y0 - i * c, { color: col || 'accent', width: 2.4 });
  return { x0, y0, x1: x0 + n * c, y1: y0 - m * c, cx: x0 + (n * c) / 2, cy: y0 - (m * c) / 2 };
}
/** Vector as bars (see ch09-g.js): 'h' bars at heights pos[k], 'v' bars at abscissae pos[k]; tips are handles. */
function bars(S, vals, o) {
  const H = o.orient === 'h', cell = o.cell ?? 1;
  const hs = o.edit === false ? [] : vals.map((_, k) => S.handle(0, 0, {
    color: o.color, r: 5.5,
    constrain: (x, y) => {
      const t = Math.max(-o.lim, Math.min(o.lim, r1(((H ? x : y) - o.zero) / o.sc)));
      vals[k] = t;
      return H ? [o.zero + t * o.sc, o.pos[k]] : [o.pos[k], o.zero + t * o.sc];
    },
  }));
  return {
    hs,
    show(b) { hs.forEach((h) => { h.visible = b; }); },
    draw(V = vals, st = {}) {
      const col = st.color || o.color, L = o.lim * o.sc, th = (o.thick ?? 0.17) * cell;
      const lo = Math.min(...o.pos) - 0.45 * cell, hi = Math.max(...o.pos) + 0.45 * cell;
      if (H) S.line(o.zero, lo, o.zero, hi, { color: 'muted', width: 1 }); else S.line(lo, o.zero, hi, o.zero, { color: 'muted', width: 1 });
      V.forEach((t, k) => {
        const tt = Math.max(-o.lim, Math.min(o.lim, t)), e = o.zero + tt * o.sc, p = o.pos[k];
        if (Math.abs(tt) > 1e-9) {
          if (H) S.rect(o.zero, p - th, e, p + th, { fill: col, fillAlpha: 0.45, color: col, width: 1.2 });
          else S.rect(p - th, o.zero, p + th, e, { fill: col, fillAlpha: 0.45, color: col, width: 1.2 });
        }
        if (st.labels !== false) {
          if (H) S.text(pn(t, 1), o.zero - L - 0.1 * cell, p, { size: 11.5, align: 'right', color: col, weight: 600 });
          else S.text(pn(t, 1), p, o.zero - L - 0.16 * cell, { size: 11.5, align: 'center', color: col, weight: 600 });
        }
        if (hs[k] && !hs[k].dragging) { hs[k].x = H ? e : p; hs[k].y = H ? p : e; }
      });
    },
  };
}
/** A cube with centre p and half-side h in a scene3 (translucent faces). */
function cell3(sc, p, h, st) {
  const V = (a, b, c) => [p[0] + a * h, p[1] + b * h, p[2] + c * h];
  const F = [[[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
    [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]];
  for (const f of F) sc.poly(f.map((q) => V(...q)), { fill: st.fill, color: st.color || st.fill, fillAlpha: st.fillAlpha ?? 0.4, alpha: st.alpha ?? 0.8, width: st.width ?? 0.9 });
}
/**
 * A 3-way array T (n1×n2×n3) as a block of cells in a scene3: index i along x, j along y, k up. Each nonzero entry is
 * a small cube whose size grows with |T_ijk| (blue > 0, red < 0); the cell lattice is drawn faintly.
 * o: {gap, scale, numbers, dec, hl: [i, j, k], ghost: array drawn as dashed outlines, labels}
 */
function block3(sc, T, o = {}) {
  const n1 = T.length, n2 = T[0].length, n3 = T[0][0].length, g = o.gap ?? 0.75, s = o.scale || Math.max(1e-9, maxAbs(T));
  const C = (i, j, k) => [(i - (n1 - 1) / 2) * g, (j - (n2 - 1) / 2) * g, (k - (n3 - 1) / 2) * g];
  const h = g / 2, X = [-(n1 * h), n1 * h], Y = [-(n2 * h), n2 * h], Z = [-(n3 * h), n3 * h];
  // lattice lines on the box
  for (let a = 0; a <= n1; a++) for (let b = 0; b <= n2; b++) { const x = X[0] + a * g, y = Y[0] + b * g; sc.line([x, y, Z[0]], [x, y, Z[1]], { color: 'faint', width: 0.7, alpha: 0.6 }, 2); }
  for (let a = 0; a <= n1; a++) for (let c = 0; c <= n3; c++) { const x = X[0] + a * g, z = Z[0] + c * g; sc.line([x, Y[0], z], [x, Y[1], z], { color: 'faint', width: 0.7, alpha: 0.6 }, 2); }
  for (let b = 0; b <= n2; b++) for (let c = 0; c <= n3; c++) { const y = Y[0] + b * g, z = Z[0] + c * g; sc.line([X[0], y, z], [X[1], y, z], { color: 'faint', width: 0.7, alpha: 0.6 }, 2); }
  for (let i = 0; i < n1; i++) for (let j = 0; j < n2; j++) for (let k = 0; k < n3; k++) {
    const t = T[i][j][k], f = Math.min(1, Math.abs(t) / s), p = C(i, j, k);
    if (f > 1e-6) cell3(sc, p, h * (0.14 + 0.5 * Math.sqrt(f)), { fill: t > 0 ? 'blue' : 'red', fillAlpha: 0.2 + 0.4 * f });
    if (o.ghost) { const q = o.ghost[i][j][k], fq = Math.min(1, Math.abs(q) / s); if (fq > 1e-6) { const hh = h * (0.14 + 0.5 * Math.sqrt(fq)); cell3(sc, p, hh, { fill: q > 0 ? 'blue' : 'red', fillAlpha: 0, alpha: 0.55, width: 0.9 }); } }
    if (o.numbers && (o.numbers !== 'nz' || Math.abs(t) >= 5e-3)) sc.tex(pn(t, o.dec ?? 2), p, { size: 11, color: Math.abs(t) < 5e-3 ? 'faint' : 'ink' });
  }
  if (o.hl) { const [i, j, k] = o.hl; cell3(sc, C(i, j, k), h * 0.98, { fill: 'gold', fillAlpha: 0.06, color: 'gold', width: 2, alpha: 1 }); }
  if (o.labels !== false) {
    for (let i = 0; i < n1; i++) sc.tex(`${i + 1}`, [C(i, 0, 0)[0], Y[0] - 0.22, Z[0] - 0.12], { size: 11, color: 'blue' });
    for (let j = 0; j < n2; j++) sc.tex(`${j + 1}`, [X[0] - 0.22, C(0, j, 0)[1], Z[0] - 0.12], { size: 11, color: 'purple' });
    for (let k = 0; k < n3; k++) sc.tex(`${k + 1}`, [X[1] + 0.2, Y[0] - 0.2, C(0, 0, k)[2]], { size: 11, color: 'teal' });
    sc.tex(o.names?.[0] ?? 'i', [X[1] + 0.35, Y[0] - 0.22, Z[0] - 0.12], { size: 14, color: 'blue' });
    sc.tex(o.names?.[1] ?? 'j', [X[0] - 0.22, Y[1] + 0.35, Z[0] - 0.12], { size: 14, color: 'purple' });
    sc.tex(o.names?.[2] ?? 'k', [X[1] + 0.2, Y[0] - 0.2, Z[1] + 0.32], { size: 14, color: 'teal' });
  }
  return C;
}
/** Parallelepiped with edges a, b, c from the origin in a scene3. */
function box3(sc, a, b, c, st = {}) {
  const P = (i, j, k) => [0, 1, 2].map((t) => i * a[t] + j * b[t] + k * c[t]);
  const faces = [[[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]];
  for (const f of faces) sc.poly(f.map((q) => P(...q)), { fill: st.fill || 'accent', color: st.fill || 'accent', fillAlpha: st.fillAlpha ?? 0.1, alpha: 0.6, width: 1.1 });
}

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.79
    {
      num: '9.79',
      kind: 'Theorem',
      name: 'Converting bilinear maps to linear maps',
      statement: String.raw`Suppose $U$ is a vector space.
(a) If $\Gamma\colon V \times W \to U$ is a bilinear map, then there is a unique linear map $\hat\Gamma\colon V \otimes W \to U$ with
$$\hat\Gamma(v \otimes w) = \Gamma(v, w) \qquad \text{for all } (v, w) \in V \times W.$$
(b) Conversely, if $T\colon V \otimes W \to U$ is a linear map, then there is a unique bilinear map $T^{\#}\colon V \times W \to U$ with $T^{\#}(v, w) = T(v \otimes w)$ for all $(v, w) \in V \times W$.`,
      idea: String.raw`One cannot simply *define* $\hat\Gamma(v \otimes w) = \Gamma(v, w)$ and extend linearly, because a tensor has many expressions as sums of simple tensors. Instead take bases $e_j$ of $V$ and $f_k$ of $W$: the $e_j \otimes f_k$ form a basis of $V \otimes W$ (9.74), so the linear map lemma (3.4) gives a unique linear $\hat\Gamma$ with $\hat\Gamma(e_j \otimes f_k) = \Gamma(e_j, f_k)$. Expanding $v = \sum a_j e_j$, $w = \sum b_k f_k$ and using 9.73, linearity of $\hat\Gamma$ and bilinearity of $\Gamma$, both $\hat\Gamma(v \otimes w)$ and $\Gamma(v, w)$ equal $\sum_{j,k} a_j b_k\, \Gamma(e_j, f_k)$. Uniqueness holds because simple tensors span. For (b), $T^{\#}$ is bilinear by 9.73. In coordinates: flatten the array of $v \otimes w$ into a column of length $mn$; then $\hat\Gamma$ is the matrix whose columns are the vectors $\Gamma(e_j, f_k)$. This is the *universal property* of the tensor product: bilinear maps out of $V \times W$ are the same thing as linear maps out of $V \otimes W$.`,
      caption: String.raw`$V = W = \mathbf R^2$. Drag $v$ and $w$ (left). Right, the pipeline: the array of $v \otimes w$ is flattened into a column of four numbers, and the matrix of $\hat\Gamma$ — whose columns are $\Gamma(e_1, f_1), \Gamma(e_1, f_2), \Gamma(e_2, f_1), \Gamma(e_2, f_2)$ — multiplies it. The output always agrees with $\Gamma(v, w)$ computed directly. Choose $\Gamma$: the signed area $\det(v, w)$ and the dot product land in $U = \mathbf R$; complex multiplication $vw$ (viewing $\mathbf R^2$ as $\mathbf C$) lands in $U = \mathbf R^2$ and needs a $2\times4$ matrix. The last choice, $\|v\|\,\|w\|$, is not bilinear: the only candidate $\hat\Gamma$ (forced by the basis values) gives $(v_1 + v_2)(w_1 + w_2)$ instead.`,
      deps: ['ladr-9.77', 'ladr-3.4', 'ladr-9.74', 'ladr-9.73'],
      tags: ['tensors', 'universal property'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tensor_product#Universal_property' },
      viz(v) {
        const sel = v.select('$\\Gamma(v, w)$', [
          { value: 'det', label: '$\\det(v, w)$' }, { value: 'dot', label: '$\\langle v, w\\rangle$' },
          { value: 'cmul', label: '$vw$ in $\\mathbf C$' }, { value: 'brk', label: '$\\|v\\|\\,\\|w\\|$ (break)' },
        ], 'det');
        const P = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 290, weight: 0.8, minWidth: 250 });
        const F = v.stage({ x: [-0.4, 12.6], y: [-5.0, 1.3], equal: true, axes: false, height: 290, weight: 1.2, minWidth: 330 });
        const hv = P.handle(1.3, 0.4, { color: 'accent', label: '$v$' }), hw = P.handle(0.5, 1.2, { color: 'orange', label: '$w$' });
        const G = {
          det: (a, b) => [a[0] * b[1] - a[1] * b[0]],
          dot: (a, b) => [a[0] * b[0] + a[1] * b[1]],
          cmul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
          brk: (a, b) => [len(a) * len(b)],
        };
        const E = [[1, 0], [0, 1]];
        let st = null;
        v.render(() => {
          const k = sel.value, Gf = G[k], vv = [hv.x, hv.y], w = [hw.x, hw.y];
          // ---- the plane picture
          if (k === 'det') { const a = Gf(vv, w)[0], col = a >= 0 ? 'green' : 'red'; P.poly([[0, 0], vv, add(vv, w), w], { fill: col, fillAlpha: 0.18, color: col, width: 1.2 }); P.tex(`\\det = ${tn(a, 2)}`, 0.42 * (vv[0] + w[0]), 0.42 * (vv[1] + w[1]), { color: col, size: 13 }); }
          if (k === 'dot') { const u = scl(vv, 1 / Math.max(len(vv), 1e-9)), pr = scl(u, dot(w, u)); P.line(-2.2 * u[0], -2.2 * u[1], 2.2 * u[0], 2.2 * u[1], { color: 'faint', width: 1 }); P.line(w[0], w[1], pr[0], pr[1], { color: 'muted', dash: [4, 4], width: 1.2 }); P.line(0, 0, pr[0], pr[1], { color: 'green', width: 5, alpha: 0.6 }); }
          if (k === 'cmul') { const z = Gf(vv, w); P.arrow(0, 0, z[0], z[1], { color: 'green', width: 2.8 }); P.tex('vw', z[0], z[1], { dx: 14, dy: -10, color: 'green', size: 15 }); P.circle(0, 0, 1, { color: 'faint', width: 1 }); }
          if (k === 'brk') { P.circle(0, 0, len(vv), { color: 'accent', width: 1, dash: [4, 4] }); P.circle(0, 0, len(w), { color: 'orange', width: 1, dash: [4, 4] }); }
          P.arrow(0, 0, vv[0], vv[1], { color: 'accent', width: 2.6 }); P.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.6 });
          // ---- the pipeline: v⊗w → vec → matrix of Γ̂ → output
          const T = outer(vv, w), vec = T.flat(), cols = [];
          for (let j = 0; j < 2; j++) for (let q = 0; q < 2; q++) cols.push(Gf(E[j], E[q]));
          const Mh = fromCols(cols), p = Mh.length, out = mv(Mh, vec), direct = Gf(vv, w), err = len(subv(out, direct));
          const sT = Math.max(1, maxAbs(T));
          const gT = grid(F, T, 0, 0, 1, { scale: sT });
          F.tex('v \\otimes w', gT.cx, 0.12, { size: 14, baseline: 'bottom' });
          F.tex('\\xrightarrow{\\text{flatten}}', 2.75, -1, { size: 14, color: 'muted' });
          const yM = -2 + p / 2;
          const gM = grid(F, Mh, 3.6, yM, 1, { scale: 1.2, dec: 0 });
          F.tex('\\hat\\Gamma', gM.cx, yM + 0.12, { size: 15, baseline: 'bottom' });
          ['11', '12', '21', '22'].forEach((s, i) => F.text(s, 3.6 + i + 0.5, yM - p - 0.25, { size: 10.5, color: 'muted', align: 'center' }));
          F.tex('\\cdot', 7.85, -2, { size: 22 });
          const gV = grid(F, vec.map((x) => [x]), 8.2, 0, 1, { scale: sT });
          ['11', '12', '21', '22'].forEach((s, i) => F.text(s, 8.0, -i - 0.5, { size: 10.5, color: 'muted', align: 'right' }));
          F.tex('=', 9.65, -2, { size: 22, color: err < 1e-9 ? 'green' : 'red' });
          grid(F, out.map((x) => [x]), 10.1, yM, 1, { scale: Math.max(1, maxAbs(out)), frame: err < 1e-9 ? 'green' : 'red', fw: 2 });
          F.tex('\\hat\\Gamma(v \\otimes w)', 10.6, yM + 0.12, { size: 13, baseline: 'bottom', color: err < 1e-9 ? 'green' : 'red' });
          F.tex(`\\text{computed directly: } \\Gamma(v, w) = ${p === 1 ? tn(direct[0], 2) : vtex(direct, 2)}`, 6.3, -4.55, { size: 13.5, color: err < 1e-9 ? 'green' : 'red' });
          // a non-simple tensor: Γ̂ is defined on all of V ⊗ W
          const nonS = mv(Mh, add(vec, outer(w, vv).flat())), sumG = add(direct, Gf(w, vv));
          st = { k, out, direct, err, nonS, sumG, p };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, out, direct, err, nonS, sumG, p } = st, f = (z) => (p === 1 ? tn(z[0], 3) : vtex(z, 3));
          if (k === 'brk') return `$\\|v\\|\\,\\|w\\| = ${f(direct)}$, but the candidate $\\hat\\Gamma$ forced by the basis values ($\\|e_j\\|\\|f_k\\| = 1$) gives $(v_1 + v_2)(w_1 + w_2) = ${f(out)}$ ✗. A map that is not bilinear has no linear partner on $V \\otimes W$.`;
          const extra = k === 'det' ? ` On $v \\otimes w + w \\otimes v$, which is not a simple tensor, it gives $${f(nonS)} = \\det(v,w) + \\det(w,v)$: the signed area kills symmetric tensors.` : ` On $v \\otimes w + w \\otimes v$, which is not a simple tensor, it gives $${f(nonS)} = \\Gamma(v,w) + \\Gamma(w,v) = ${f(sumG)}$.`;
          return `$\\hat\\Gamma(v \\otimes w) = ${f(out)}$ and $\\Gamma(v, w) = ${f(direct)}$ — difference $${etx(v.M, err)}$ ${mark(err < 1e-9)}.${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.80
    {
      num: '9.80',
      kind: 'Theorem',
      name: 'Inner product on tensor product of two inner product spaces',
      statement: String.raw`Suppose $V$ and $W$ are inner product spaces. Then there is a unique inner product on $V \otimes W$ such that
$$\langle v \otimes w, u \otimes x \rangle = \langle v, u\rangle \langle w, x\rangle \qquad \text{for all } v, u \in V \text{ and } w, x \in W.$$
In particular $\|v \otimes w\| = \|v\|\,\|w\|$.`,
      idea: String.raw`Pick orthonormal bases $e_1, \dots, e_m$ of $V$ and $f_1, \dots, f_n$ of $W$ (6.35) and declare the inner product of two tensors to be the sum of the products of their coefficients in the basis $e_j \otimes f_k$ (9.74): $\big\langle \sum b_{j,k}\, e_j \otimes f_k, \sum c_{j,k}\, e_j \otimes f_k \big\rangle = \sum b_{j,k}\, c_{j,k}$. This is plainly an inner product (6.2). For simple tensors the coefficients are $v_j w_k$ and $u_j x_k$, and $\sum_{j,k} v_j w_k\, u_j x_k = \big(\sum_j v_j u_j\big)\big(\sum_k w_k x_k\big) = \langle v, u\rangle\langle w, x\rangle$ — this step needs the bases to be orthonormal. Uniqueness: simple tensors span $V \otimes W$. The formula could not be used as a definition directly: a tensor has many expressions as sums of simple tensors, and, for instance, the "rule" $\langle v,u\rangle + \langle w, x\rangle$ is not even well defined.`,
      caption: String.raw`$V = W = \mathbf R^2$. Drag $v, u$ (left) and $w, x$ (right). Below: the arrays of $v \otimes w$ and $u \otimes x$, and the array of their cell-by-cell products, whose total is the inner product of the two tensors — it always equals $\langle v, u\rangle\langle w, x\rangle$, and $\|v \otimes w\| = \|v\|\,\|w\|$. Break it two ways: use coordinates in a *skewed* (non-orthonormal) basis of $V$ — the cell-by-cell sum no longer matches; or try the rule $\langle v, u\rangle + \langle w, x\rangle$ and move $\lambda$, which rewrites the *same* tensor $v \otimes w$ as $(\lambda v) \otimes (w/\lambda)$ — the "inner product" changes, so the rule is not even a function of the tensors.`,
      deps: ['ladr-9.74', 'ladr-6.35', 'ladr-6.2'],
      see: ['qm-14.1'],
      tags: ['tensors', 'inner products'],
      viz(v) {
        const mode = v.select('', [{ value: 'on', label: 'orthonormal coordinates' }, { value: 'skew', label: 'skewed basis of $V$ (break)' }, { value: 'sum', label: 'rule $\\langle v,u\\rangle + \\langle w,x\\rangle$ (break)' }], 'on');
        const lam = v.slider('$\\lambda$: write $v\\otimes w = (\\lambda v)\\otimes(w/\\lambda)$', 0.3, 3, 1.8, { log: true, sig: 2 });
        const A = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.9], equal: true, height: 260, title: '$V = \\mathbf R^2$' });
        const B = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.9], equal: true, height: 260, title: '$W = \\mathbf R^2$' });
        const T = v.stage({ x: [-0.2, 14.4], y: [-2.75, 0.9], equal: true, axes: false, height: 200, full: true });
        const hv = A.handle(1.2, 0.5, { color: 'accent', label: '$v$' }), hu = A.handle(0.4, 1.3, { color: 'purple', label: '$u$' });
        const hw = B.handle(1.1, -0.4, { color: 'orange', label: '$w$' }), hx = B.handle(0.9, 0.9, { color: 'teal', label: '$x$' });
        const b1 = [1, 0], b2 = [0.8, 0.6], Bm = fromCols([b1, b2]);
        const coords = (p) => v.M.solve(Bm, p);
        const arc = (S, a, b, r, col) => { const t0 = Math.atan2(a[1], a[0]); let d = Math.atan2(b[1], b[0]) - t0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; S.curve((t) => [r * Math.cos(t0 + t * d), r * Math.sin(t0 + t * d)], 0, 1, { color: col, width: 1.6 }); };
        let st = null;
        v.render(() => {
          const md = mode.value; lam.el.hidden = md !== 'sum';
          const vv = [hv.x, hv.y], u = [hu.x, hu.y], w = [hw.x, hw.y], x = [hx.x, hx.y];
          if (md === 'skew') { A.arrow(0, 0, b1[0], b1[1], { color: 'muted', width: 2, dash: [5, 4] }); A.arrow(0, 0, b2[0], b2[1], { color: 'muted', width: 2, dash: [5, 4] }); A.tex('b_1', b1[0], b1[1], { dx: 6, dy: 14, color: 'muted', size: 13 }); A.tex('b_2', b2[0], b2[1], { dx: 14, dy: -6, color: 'muted', size: 13 }); }
          arc(A, vv, u, 0.45, 'green'); arc(B, w, x, 0.45, 'green');
          A.arrow(0, 0, vv[0], vv[1], { color: 'accent', width: 2.6 }); A.arrow(0, 0, u[0], u[1], { color: 'purple', width: 2.6 });
          B.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.6 }); B.arrow(0, 0, x[0], x[1], { color: 'teal', width: 2.6 });
          const ivu = dot(vv, u), iwx = dot(w, x);
          A.corner(`⟨v, u⟩ = ${pn(ivu, 2)}`, 'tl', { color: 'green', weight: 700 }); B.corner(`⟨w, x⟩ = ${pn(iwx, 2)}`, 'tl', { color: 'green', weight: 700 });
          // coefficient arrays
          const cv = md === 'skew' ? coords(vv) : vv, cu = md === 'skew' ? coords(u) : u;
          const X1 = outer(cv, w), X2 = outer(cu, x), Pm = X1.map((r, i) => r.map((a, j) => a * X2[i][j])), tot = Pm.flat().reduce((s, a) => s + a, 0);
          const sc0 = Math.max(1, maxAbs([X1, X2]));
          const g1 = grid(T, X1, 0.3, 0, 1, { scale: sc0 }), g2 = grid(T, X2, 3.4, 0, 1, { scale: sc0 }), g3 = grid(T, Pm, 7.2, 0, 1, { scale: Math.max(0.5, maxAbs(Pm)) });
          const pre = md === 'skew' ? '\\text{coeffs of }' : '';
          T.tex(`${pre}v \\otimes w`, g1.cx, 0.12, { size: 13.5, baseline: 'bottom' }); T.tex(`${pre}u \\otimes x`, g2.cx, 0.12, { size: 13.5, baseline: 'bottom' });
          T.tex('\\text{cell-by-cell products}', g3.cx, 0.12, { size: 13.5, baseline: 'bottom' });
          T.tex('\\odot', 2.85, -1, { size: 20 }); T.tex('=', 6.3, -1, { size: 20 });
          let lhs, rhs, lab;
          if (md === 'sum') { const L = lam.value; lhs = dot(scl(vv, L), u) + dot(scl(w, 1 / L), x); rhs = ivu * iwx; lab = `\\langle \\lambda v,u\\rangle + \\langle w/\\lambda,x\\rangle = ${tn(lhs, 3)}`; }
          else { lhs = tot; rhs = ivu * iwx; lab = `\\textstyle\\sum = ${tn(tot, 3)}`; }
          const ok = Math.abs(lhs - rhs) < 1e-9;
          T.tex(lab, 12.4, -0.55, { size: 14, color: ok ? 'green' : 'red' });
          T.tex(`${ok ? '=' : '\\ne'}\\ \\langle v,u\\rangle\\langle w,x\\rangle = ${tn(rhs, 3)}`, 12.4, -1.25, { size: 14, color: ok ? 'green' : 'red' });
          T.tex(`\\|v\\otimes w\\| = ${tn(Math.sqrt(X1.flat().reduce((s, a) => s + a * a, 0)), 3)},\\ \\ \\|v\\|\\|w\\| = ${tn(len(vv) * len(w), 3)}`, 12.4, -2.1, { size: 12.5, color: 'muted' });
          st = { md, lhs, rhs, ivu, iwx, ok, L: lam.value, nv: len(vv) * len(w) };
        });
        v.legend([['accent', '$v$'], ['purple', '$u$'], ['orange', '$w$'], ['teal', '$x$'], ['green', 'angles and inner products']]);
        v.readout(() => {
          if (!st) return '';
          const { md, lhs, rhs, ivu, iwx, ok, L } = st;
          if (md === 'on') return `$\\langle v\\otimes w, u\\otimes x\\rangle = \\sum_{j,k} v_j w_k\\, u_j x_k = ${tn(lhs, 4)}$ and $\\langle v,u\\rangle\\langle w,x\\rangle = ${tp(ivu, 3)} \\times ${tp(iwx, 3)} = ${tn(rhs, 4)}$ ${mark(ok)}.`;
          if (md === 'skew') return `In the skewed basis $b_1 = (1, 0)$, $b_2 = (0.8, 0.6)$ of $V$ the sum of products of coefficients is $${tn(lhs, 3)}$, not $\\langle v,u\\rangle\\langle w,x\\rangle = ${tn(rhs, 3)}$ ${mark(ok)}: the construction in the proof needs **orthonormal** bases.`;
          return `$\\lambda = ${tn(L, 2)}$: the tensor $(\\lambda v)\\otimes(w/\\lambda) = v \\otimes w$ has not changed, yet $\\langle\\lambda v, u\\rangle + \\langle w/\\lambda, x\\rangle = ${tn(lhs, 3)}$ moves with $\\lambda$ — so this "rule" does not define anything on $V \\otimes W$. The product rule gives $${tn(rhs, 3)}$ for every $\\lambda$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.83
    {
      num: '9.83',
      kind: 'Theorem',
      name: 'Orthonormal basis of V ⊗ W',
      statement: String.raw`Suppose $V$ and $W$ are inner product spaces, $e_1, \dots, e_m$ is an orthonormal basis of $V$ and $f_1, \dots, f_n$ is an orthonormal basis of $W$. Then $\{e_j \otimes f_k\}_{j = 1, \dots, m;\ k = 1, \dots, n}$ is an orthonormal basis of $V \otimes W$ (with the inner product of 9.80).`,
      idea: String.raw`It is a basis by 9.74(b), so only orthonormality needs checking, and 9.80 does it in one line: $\langle e_j \otimes f_k, e_M \otimes f_N\rangle = \langle e_j, e_M\rangle\langle f_k, f_N\rangle$, which is $1$ when $j = M$ and $k = N$ and $0$ otherwise. The point is that these bases may differ from the ones used to *build* the inner product in 9.80 — any orthonormal bases of the factors will do. More generally the Gram matrix of the list $e_j \otimes f_k$ is the Kronecker product of the two Gram matrices, $G_{V\otimes W} = G_V \otimes G_W$, which is the identity exactly when both factors are.`,
      caption: String.raw`$V = W = \mathbf R^2$. Turn the orthonormal bases by dragging $e_1$ and $f_1$ around their circles ($e_2$ and $f_2$ follow at right angles). Below: the four arrays $e_j \otimes f_k$, and their $4\times4$ Gram matrix of inner products — always the identity. The readout also expands a fixed tensor $A$ in this basis and checks Parseval: $\sum |\langle A, e_j \otimes f_k\rangle|^2 = \|A\|^2$. Switch on *break: $e_2$ free* and drag $e_2$ off the right angle: the Gram matrix fills in, and it is exactly $G_V \otimes G_W$.`,
      deps: ['ladr-9.74', 'ladr-9.80'],
      tags: ['tensors', 'orthonormal'],
      viz(v) {
        const brk = v.toggle('break: $e_2$ free (not orthonormal)', false, { onChange: (b) => { if (b) { const p = rot([he1.x, he1.y], 1.15); he2.set(0.8 * p[0], 0.8 * p[1]); } } });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.6], equal: true, height: 240, axes: false, title: 'orthonormal basis of $V$' });
        const B = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.6], equal: true, height: 240, axes: false, title: 'orthonormal basis of $W$' });
        const T = v.stage({ x: [-0.3, 15.2], y: [-4.6, 0.95], equal: true, axes: false, height: 275, full: true });
        const onC = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const he1 = A.handle(Math.cos(0.4), Math.sin(0.4), { color: 'blue', label: '$e_1$', constrain: onC });
        const he2 = A.handle(-0.2, 0.9, { color: 'purple', label: '$e_2$' });
        const hf1 = B.handle(Math.cos(-0.3), Math.sin(-0.3), { color: 'orange', label: '$f_1$', constrain: onC });
        const Am = [[0.9, -0.4], [0.3, 1.1]];
        let st = null;
        v.render(() => {
          he2.visible = brk.value;
          const e1 = [he1.x, he1.y], e2 = brk.value ? [he2.x, he2.y] : rot(e1, Math.PI / 2), f1 = [hf1.x, hf1.y], f2 = rot(f1, Math.PI / 2);
          if (!brk.value) { he2.x = e2[0]; he2.y = e2[1]; }
          for (const S of [A, B]) { S.circle(0, 0, 1, { color: 'faint', width: 1 }); S.line(-1.4, 0, 1.4, 0, { color: 'faint', width: 0.8 }); S.line(0, -1.4, 0, 1.4, { color: 'faint', width: 0.8 }); }
          A.arrow(0, 0, e1[0], e1[1], { color: 'blue', width: 2.8 }); A.arrow(0, 0, e2[0], e2[1], { color: 'purple', width: 2.8 });
          if (!brk.value) A.tex('e_2', e2[0], e2[1], { dx: -14, dy: -10, color: 'purple', size: 15 });
          B.arrow(0, 0, f1[0], f1[1], { color: 'orange', width: 2.8 }); B.arrow(0, 0, f2[0], f2[1], { color: 'pink', width: 2.8 }); B.tex('f_2', f2[0], f2[1], { dx: -14, dy: -10, color: 'pink', size: 15 });
          const es = [e1, e2], fs = [f1, f2], list = [];
          for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) list.push({ j, k, X: outer(es[j], fs[k]) });
          const G = list.map((a) => list.map((b) => a.X.flat().reduce((s, t, i) => s + t * b.X.flat()[i], 0)));
          const GV = es.map((a) => es.map((b) => dot(a, b))), GW = fs.map((a) => fs.map((b) => dot(a, b))), K = kron(GV, GW);
          const offI = Math.max(...G.flatMap((r, i) => r.map((g, j) => Math.abs(g - (i === j ? 1 : 0))))), offK = maxAbs(G.map((r, i) => r.map((g, j) => g - K[i][j])));
          // tiles
          list.forEach(({ j, k, X }, q) => {
            const x0 = 0.15 + (q % 2) * 1.85, y0 = -0.05 - Math.floor(q / 2) * 2.25;
            grid(T, X, x0, y0, 0.62, { scale: 1, numbers: false, fw: 1 });
            T.tex(`e_${j + 1}\\otimes f_${k + 1}`, x0 + 0.62, y0 - 1.24 - 0.08, { size: 12.5, baseline: 'top' });
          });
          // Gram matrix
          const okI = offI < 1e-9;
          const gG = grid(T, G, 4.5, 0.0, 0.95, { scale: 1, dec: 2 });
          T.tex('\\text{Gram matrix } \\langle e_j\\otimes f_k,\\, e_M\\otimes f_N\\rangle', gG.cx, 0.1, { size: 13, baseline: 'bottom', color: okI ? 'green' : 'ink' });
          T.tex(okI ? '= I_4' : '\\ne I_4', gG.x1 + 0.55, gG.cy, { size: 16, color: okI ? 'green' : 'red', align: 'left' });
          const gV = grid(T, GV, 10.6, -0.25, 0.7, { scale: 1, dec: 2, size: 11 }), gW = grid(T, GW, 13.1, -0.25, 0.7, { scale: 1, dec: 2, size: 11 });
          T.tex('G_V', gV.cx, -0.15, { size: 13, baseline: 'bottom' }); T.tex('\\otimes', 12.4, gV.cy, { size: 18 }); T.tex('G_W', gW.cx, -0.15, { size: 13, baseline: 'bottom' });
          T.tex(`= G\\ \\ ${offK < 1e-9 ? '\\checkmark' : ''}`, 12.4, -2.35, { size: 15, color: 'green' });
          // Parseval for a fixed tensor
          const coef = list.map(({ X }) => X.flat().reduce((s, t, i) => s + t * Am.flat()[i], 0)), pars = coef.reduce((s, c) => s + c * c, 0), nA = Am.flat().reduce((s, a) => s + a * a, 0);
          st = { okI, offI, offK, pars, nA, GV };
        });
        v.legend([['blue', '$e_1$'], ['purple', '$e_2$'], ['orange', '$f_1$'], ['pink', '$f_2$']]);
        v.readout(() => {
          if (!st) return '';
          const { okI, offI, offK, pars, nA } = st, okP = Math.abs(pars - nA) < 1e-9;
          return `Largest deviation of the Gram matrix from $I_4$: $${okI ? etx(v.M, offI) : tn(offI, 3)}$ ${mark(okI)}; and $G = G_V \\otimes G_W$ to within $${etx(v.M, offK)}$. Parseval for $A = \\begin{pmatrix} 0.9 & -0.4 \\\\ 0.3 & 1.1 \\end{pmatrix}$: $\\sum_{j,k} \\langle A, e_j\\otimes f_k\\rangle^2 = ${tn(pars, 4)}$ vs $\\|A\\|^2 = ${tn(nA, 4)}$ ${mark(okP)}${okI ? '.' : ' — Parseval needs an orthonormal basis.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.87
    {
      num: '9.87',
      kind: 'Theorem',
      name: 'Dimension of the space of m-linear functionals',
      statement: String.raw`Suppose $V_1, \dots, V_m$ are finite-dimensional vector spaces ($m \ge 2$), and let $\mathcal B(V_1, \dots, V_m)$ be the vector space of **$m$-linear functionals** on $V_1 \times \cdots \times V_m$ — functions to $\mathbf F$ that are linear in each slot when the other slots are held fixed. Then
$$\dim \mathcal B(V_1, \dots, V_m) = (\dim V_1) \cdots (\dim V_m).$$`,
      idea: String.raw`Copy the proof of 9.70. With a basis of each $V_r$, an $m$-linear functional $\beta$ is determined by its values on lists of basis vectors, $c_{j_1, \dots, j_m} = \beta(e^1_{j_1}, \dots, e^m_{j_m})$, because expanding each slot gives $\beta(v_1, \dots, v_m) = \sum c_{j_1,\dots,j_m}\, a^1_{j_1} \cdots a^m_{j_m}$ in terms of the coordinates $a^r$ of $v_r$. Conversely any array of numbers $c$ defines an $m$-linear functional by that formula. So $\beta \mapsto c$ is an isomorphism onto the space of $n_1 \times \cdots \times n_m$ arrays, of dimension $n_1 \cdots n_m$. (Axler's example 9.86, $\varphi_1(v_1)\cdots\varphi_m(v_m)$, has the array $c = \varphi_1 \otimes \cdots \otimes \varphi_m$.)`,
      caption: String.raw`Three slots, $V_r = \mathbf R^{n_r}$. Left: the block of $n_1 n_2 n_3$ cells holds the numbers $c_{ijk} = \beta(e_i, f_j, g_k)$ — one cell per elementary trilinear functional $u_i v_j w_k$; drag the background to rotate. Right: for a test triple $(u, v, w)$ the $n_1 n_2 n_3$ terms $c_{ijk}\,u_i v_j w_k$ are stacked as a waterfall; they always land exactly on $\beta(u, v, w)$ computed directly (dashed line). Change the slot dimensions and the functional; *new test triple* draws new $u, v, w$. The last functional, $u_1 + v_1 + w_1$, is not trilinear: its basis values no longer determine it, and the waterfall misses.`,
      deps: ['ladr-9.70'],
      see: ['ladr-9.25'],
      tags: ['tensors', 'dimension'],
      viz(v) {
        const M = v.M;
        const s1 = v.slider('$n_1$', 1, 3, 2, { int: true }), s2 = v.slider('$n_2$', 1, 3, 2, { int: true }), s3 = v.slider('$n_3$', 1, 3, 2, { int: true });
        const fn = v.select('$\\beta$', [{ value: 'prod', label: '$\\varphi_1(u)\\varphi_2(v)\\varphi_3(w)$' }, { value: 'ip', label: '$\\langle u, v\\rangle\\, w_1$' }, { value: 'rand', label: 'random' }, { value: 'brk', label: '$u_1 + v_1 + w_1$ (break)' }], 'rand');
        let seed = 4;
        v.button('new test triple', () => { seed++; });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.9], equal: true, axes: false, height: 340, weight: 1, minWidth: 280 });
        const W = v.stage({ x: [0, 28], y: [-3, 3], axes: 'box', height: 340, weight: 1.1, minWidth: 300, xticks: [], title: 'the terms $c_{ijk}\\,u_i v_j w_k$, added one by one' });
        const sc = v.scene3(S, { yaw: 0.6, pitch: 0.42, axes: false });
        const PH = [[1, -0.5, 0.3], [0.8, 0.6, -0.4], [0.5, 1, 0.7]];
        let st = null;
        v.render(() => {
          const n = [s1.value, s2.value, s3.value], k = fn.value;
          const r = v.rng(seed), g = () => { const x = r1(r.uniform(-1.2, 1.2)); return Math.abs(x) < 0.25 ? (x < 0 ? -0.5 : 0.5) : x; };
          const u = Array.from({ length: n[0] }, g), vv = Array.from({ length: n[1] }, g), w = Array.from({ length: n[2] }, g);
          const rr = v.rng(77 + n[0] * 9 + n[1] * 3 + n[2]), Rc = zeros3(3, 3, 3).map((P) => P.map((row) => row.map(() => r1(rr.uniform(-1, 1)))));
          const beta = (a, b, c) => {
            if (k === 'prod') return dot(PH[0].slice(0, n[0]), a) * dot(PH[1].slice(0, n[1]), b) * dot(PH[2].slice(0, n[2]), c);
            if (k === 'ip') { let s = 0; for (let i = 0; i < Math.min(n[0], n[1]); i++) s += a[i] * b[i]; return s * c[0]; }
            if (k === 'rand') { let s = 0; for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let q = 0; q < n[2]; q++) s += Rc[i][j][q] * a[i] * b[j] * c[q]; return s; }
            return a[0] + b[0] + c[0];
          };
          const e = (d, i) => Array.from({ length: d }, (_, t) => +(t === i));
          const C = zeros3(n[0], n[1], n[2]);
          for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let q = 0; q < n[2]; q++) C[i][j][q] = beta(e(n[0], i), e(n[1], j), e(n[2], q));
          sc.begin(); block3(sc, C, { gap: Math.min(0.9, 2.4 / Math.max(...n)), numbers: n[0] * n[1] * n[2] <= 12, names: ['i', 'j', 'k'] }); sc.flush();
          S.corner(`${n[0]} · ${n[1]} · ${n[2]} = ${n[0] * n[1] * n[2]} cells`, 'tl', { color: 'blue', weight: 700, size: 13 });
          // waterfall
          const terms = [];
          for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let q = 0; q < n[2]; q++) terms.push({ t: C[i][j][q] * u[i] * vv[j] * w[q], lab: `${i + 1}${j + 1}${q + 1}` });
          const direct = beta(u, vv, w), cum = [0]; terms.forEach((t) => cum.push(cum[cum.length - 1] + t.t));
          const N = terms.length, Y = Math.max(1, ...cum.map(Math.abs), Math.abs(direct)) * 1.18;
          W.setView([0, N + 1.6], [-Y, Y]);
          W.hline(0, { color: 'muted', width: 1 });
          terms.forEach((t, i) => {
            const a = cum[i], b = cum[i + 1], col = t.t >= 0 ? 'blue' : 'red';
            W.rect(i + 0.6, Math.min(a, b), i + 1.4, Math.max(a, b), { fill: col, fillAlpha: 0.55, color: col, width: 1 });
            if (i < N - 1) W.line(i + 1.4, b, i + 1.6, b, { color: 'muted', width: 1 });
            if (N <= 14) W.text(t.lab, i + 1, -Y, { dy: -9, size: 9.5, color: 'muted', align: 'center' });
          });
          const ok = Math.abs(cum[N] - direct) < 1e-9;
          W.line(0, direct, N + 1.6, direct, { color: ok ? 'green' : 'red', width: 1.6, dash: [6, 4] });
          W.text(`β(u, v, w) = ${pn(direct, 3)}`, 0.3, direct, { dy: direct >= cum[N] ? -10 : 11, size: 12, color: ok ? 'green' : 'red', weight: 700, align: 'left' });
          W.dot(N + 1, cum[N], { r: 5, color: ok ? 'green' : 'red' });
          // independence of the elementary functionals, numerically
          const rs = v.rng(5), smp = Array.from({ length: N + 6 }, () => [n[0], n[1], n[2]].map((d) => Array.from({ length: d }, () => rs.normal())));
          const Emat = smp.map(([a, b, c]) => outer3(a, b, c).flat(2)), rk = nrank(M.svd(Emat).S);
          st = { n, N, direct, sum: cum[N], ok, rk, u, vv, w, k };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, N, direct, sum, ok, rk, u, vv, w, k } = st;
          const head = `$u = ${vtex(u, 1)}$, $v = ${vtex(vv, 1)}$, $w = ${vtex(w, 1)}$. `;
          const dim = `The ${N} elementary functionals $u_i v_j w_k$ are independent (sampled at ${N + 6} random triples they give rank ${rk}), so $\\dim \\mathcal B(\\mathbf R^{${n[0]}}, \\mathbf R^{${n[1]}}, \\mathbf R^{${n[2]}}) = ${n[0]}\\cdot${n[1]}\\cdot${n[2]} = ${N}$.`;
          if (k === 'brk') return `${head}$\\sum c_{ijk}u_iv_jw_k = ${tn(sum, 3)}$ but $u_1 + v_1 + w_1 = ${tn(direct, 3)}$ ${mark(ok)}: not trilinear, so not determined by its basis values.`;
          return `${head}$\\sum_{i,j,k} c_{ijk}\\,u_i v_j w_k = ${tn(sum, 4)} = \\beta(u, v, w)$ ${mark(ok)}. ${dim}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.88
    {
      num: '9.88',
      kind: 'Definition',
      name: 'Tensor product V₁ ⊗ ⋯ ⊗ V_m',
      statement: String.raw`Suppose $V_1, \dots, V_m$ are finite-dimensional ($m \ge 2$).
- The **tensor product** $V_1 \otimes \cdots \otimes V_m$ is the space $\mathcal B(V_1', \dots, V_m')$ of $m$-linear functionals on $V_1' \times \cdots \times V_m'$.
- For $v_1 \in V_1, \dots, v_m \in V_m$, the element $v_1 \otimes \cdots \otimes v_m$ of $V_1 \otimes \cdots \otimes V_m$ is defined by
$$(v_1 \otimes \cdots \otimes v_m)(\varphi_1, \dots, \varphi_m) = \varphi_1(v_1) \cdots \varphi_m(v_m) \qquad \text{for } (\varphi_1, \dots, \varphi_m) \in V_1' \times \cdots \times V_m'.$$`,
      idea: String.raw`This is the definition 9.71 with more slots, and it inherits everything: $v_1 \otimes \cdots \otimes v_m$ is linear in each $v_r$, and in coordinates (standard bases of $\mathbf F^{n_r}$) it is the $n_1 \times \cdots \times n_m$ array of products $(v_1)_{j_1} \cdots (v_m)_{j_m}$ — a two-index matrix for $m = 2$, a three-index block for $m = 3$. A general element is a sum of such simple tensors, and need not be one: for three qubits, $\mathbf C^2 \otimes \mathbf C^2 \otimes \mathbf C^2$, the simple tensors are the *product states* and the others are *entangled*, like the GHZ state $e_1 \otimes e_1 \otimes e_1 + e_2 \otimes e_2 \otimes e_2$. A simple tensor has every flattening (unfolding into a matrix) of rank at most one; GHZ has all three of rank two.`,
      caption: String.raw`$V_1 = V_2 = V_3 = \mathbf R^2$. Drag the bar tips of $v_1, v_2, v_3$ (left); right, the $2\times2\times2$ block of $v_1 \otimes v_2 \otimes v_3$: the cell $(i, j, k)$ holds $(v_1)_i (v_2)_j (v_3)_k$ (drag the background to rotate). The readout evaluates the tensor on a fixed triple of functionals, $\varphi_1(v_1)\varphi_2(v_2)\varphi_3(v_3)$, against the sum over the block, and lists the ranks of the three flattenings. Choose the *GHZ* or *W* state to see tensors that are not of the form $v_1 \otimes v_2 \otimes v_3$ — "entangled" in quantum language.`,
      deps: ['ladr-9.71'],
      see: ['qm-14.1', 'qinfo-2.2'],
      tags: ['tensors'],
      viz(v) {
        const M = v.M;
        const st0 = v.select('', [{ value: 'prod', label: 'simple tensor $v_1\\otimes v_2\\otimes v_3$' }, { value: 'ghz', label: 'GHZ: $e_1^{\\otimes 3} + e_2^{\\otimes 3}$' }, { value: 'w', label: 'W: $e_1e_1e_2 + e_1e_2e_1 + e_2e_1e_1$' }], 'prod');
        const L = v.stage({ x: [-0.5, 9.3], y: [-2.3, 2.2], equal: true, axes: false, height: 330, weight: 0.85, minWidth: 260 });
        const R = v.stage({ x: [-1.85, 1.85], y: [-1.7, 1.85], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 290 });
        const sc = v.scene3(R, { yaw: 0.62, pitch: 0.4, axes: false });
        const V = [[1, 0.6], [0.8, -0.5], [0.4, 1.1]], COL = ['blue', 'purple', 'teal'];
        const bs = V.map((vals, r) => bars(L, vals, { orient: 'v', pos: [r * 3.2 + 0.6, r * 3.2 + 1.6], zero: 0, sc: 0.8, lim: 1.8, color: COL[r] }));
        const PHI = [[0.7, -0.3], [1, 0.4], [-0.2, 0.9]];
        let st = null;
        v.render(() => {
          const k = st0.value, prod = k === 'prod';
          bs.forEach((b) => b.show(prod));
          let T;
          if (prod) T = outer3(V[0], V[1], V[2]);
          else { T = zeros3(2, 2, 2); if (k === 'ghz') { T[0][0][0] = 1; T[1][1][1] = 1; } else { T[0][0][1] = 1; T[0][1][0] = 1; T[1][0][0] = 1; } }
          if (prod) {
            bs.forEach((b, r) => { b.draw(); L.tex(`v_${r + 1}`, r * 3.2 + 1.1, -2.05, { size: 16, color: COL[r] }); });
            L.tex('\\otimes', 2.7, 0, { size: 20 }); L.tex('\\otimes', 5.9, 0, { size: 20 });
          } else {
            L.tex(k === 'ghz' ? 'e_1\\otimes e_1\\otimes e_1 + e_2\\otimes e_2\\otimes e_2' : '\\begin{gathered} e_1\\otimes e_1\\otimes e_2 \\\\ +\\ e_1\\otimes e_2\\otimes e_1 \\\\ +\\ e_2\\otimes e_1\\otimes e_1\\end{gathered}', 4.4, 0.4, { size: 15 });
            L.tex('\\text{no } v_1, v_2, v_3 \\text{ give this block}', 4.4, -1.5, { size: 13, color: 'red' });
            L.tex('\\text{three qubits: an entangled state}', 4.4, -2.0, { size: 12.5, color: 'muted' });
          }
          sc.begin(); block3(sc, T, { gap: 0.95, numbers: true, scale: prod ? Math.max(0.3, maxAbs(T)) : 1, names: ['i', 'j', 'k'] }); sc.flush();
          // evaluation on (φ₁, φ₂, φ₃), flattening ranks
          const ev = mode3(T, [PHI[0]], [PHI[1]], [PHI[2]])[0][0][0];
          const prd = prod ? dot(PHI[0], V[0]) * dot(PHI[1], V[1]) * dot(PHI[2], V[2]) : null;
          const ranks = unfold(T).map((A) => nrank(M.svd(A).S));
          R.corner(`flattening ranks (${ranks.join(', ')})`, 'tl', { color: ranks.every((x) => x <= 1) ? 'green' : 'red', weight: 700, size: 13 });
          st = { k, ev, prd, ranks, T };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, ev, prd, ranks } = st;
          const evs = `$\\sum_{i,j,k} (\\varphi_1)_i(\\varphi_2)_j(\\varphi_3)_k\\,T_{ijk} = ${tn(ev, 4)}$`;
          if (k === 'prod') return `With $\\varphi_1 = (0.7, -0.3)$, $\\varphi_2 = (1, 0.4)$, $\\varphi_3 = (-0.2, 0.9)$: $\\varphi_1(v_1)\\varphi_2(v_2)\\varphi_3(v_3) = ${tn(prd, 4)}$ and ${evs} ${mark(Math.abs(ev - prd) < 1e-9)}. Flattening ranks $(${ranks.join(', ')})$: a simple tensor.`;
          return `${evs}. Flattening ranks $(${ranks.join(', ')})$: every simple tensor has all three ranks $\\le 1$, so this ${k === 'ghz' ? 'GHZ' : 'W'} tensor is **not** $v_1\\otimes v_2\\otimes v_3$ for any vectors — though it is a sum of ${k === 'ghz' ? 'two' : 'three'} of them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.89
    {
      num: '9.89',
      kind: 'Theorem',
      name: 'Dimension of a tensor product of several spaces',
      statement: String.raw`Suppose $V_1, \dots, V_m$ are finite-dimensional. Then
$$\dim(V_1 \otimes \cdots \otimes V_m) = (\dim V_1) \cdots (\dim V_m).$$`,
      idea: String.raw`As for two factors (9.72): $V_1 \otimes \cdots \otimes V_m = \mathcal B(V_1', \dots, V_m')$ by definition, $\dim V_r' = \dim V_r$ (3.111), and 9.87 counts $\dim \mathcal B(V_1', \dots, V_m') = (\dim V_1') \cdots (\dim V_m')$. The dimension multiplies with every factor, while for the product space $V_1 \times \cdots \times V_m$ it only adds — which is why $m$ qubits need $2^m$ amplitudes, not $2m$.`,
      caption: String.raw`Choose the number of factors $m$ and their dimension $n$ (switch on *mixed* for dimensions $n, n+1, n, n+1, \dots$). Top: an element of $V_1 \otimes \cdots \otimes V_m$ — here a random simple tensor — drawn as its array of coefficients, nested: the last two indices form small grids, the earlier indices lay those grids out in rows and columns. The count of cells is the dimension. Bottom: the dimension for the first $k$ factors, product (blue) against sum (orange), on a log scale. The readout checks the count numerically for small sizes: random simple tensors span a space of exactly that dimension. Switch to $\times$ to see the product space instead.`,
      deps: ['ladr-9.88', 'ladr-9.87', 'ladr-3.111', 'ladr-9.72'],
      tags: ['tensors', 'dimension'],
      viz(v) {
        const M = v.M;
        const sm = v.slider('number of factors $m$', 2, 5, 4, { int: true });
        const sn = v.slider('dimension $n$', 1, 4, 2, { int: true });
        const mix = v.toggle('mixed: $n, n+1, n, \\dots$', false);
        const sp = v.select('', [{ value: 'ten', label: '$V_1 \\otimes \\cdots \\otimes V_m$' }, { value: 'prod', label: '$V_1 \\times \\cdots \\times V_m$' }], 'ten');
        const A = v.stage({ x: [0, 100], y: [0, 40], axes: false, height: 260, full: true });
        const B = v.stage({ x: [0.3, 5.7], y: [0.4, 3000], ylog: true, axes: 'box', height: 210, full: true, xticks: [1, 2, 3, 4, 5].map((k) => [k, `k = ${k}`]), ylabel: 'dimension' });
        let memo = null;
        /** Lay out the n1 × … × nm array: returns cell rectangles [x, y, s, value-index] in px of a W×H box. */
        const layout = (d, Wpx, Hpx) => {
          // size of a block for indices r..m-1, in units of cells (with gaps)
          const gap = (lev) => 0.35 + 0.45 * lev; // gap between sub-blocks at nesting level lev (0 = innermost)
          const sizeOf = (r) => {
            const m = d.length;
            if (r === m - 2) return [d[m - 1], d[m - 2]];
            if (r === m - 1) return [d[m - 1], 1];
            const [w, h] = sizeOf(r + 1), lev = Math.floor((m - 2 - r + 1) / 2), horiz = (m - 2 - r) % 2 === 1;
            return horiz ? [d[r] * w + (d[r] - 1) * gap(lev), h] : [w, d[r] * h + (d[r] - 1) * gap(lev)];
          };
          const [tw, th] = sizeOf(0), s = Math.min(Wpx / tw, Hpx / th, 40), cells = [], frames = [];
          const place = (r, x, y, idx) => {
            const m = d.length;
            if (r === m - 2) { for (let i = 0; i < d[m - 2]; i++) for (let j = 0; j < d[m - 1]; j++) cells.push([x + j * s, y + i * s, s, [...idx, i, j]]); frames.push([x, y, d[m - 1] * s, d[m - 2] * s]); return; }
            const [w, h] = sizeOf(r + 1), lev = Math.floor((m - 2 - r + 1) / 2), horiz = (m - 2 - r) % 2 === 1;
            for (let i = 0; i < d[r]; i++) place(r + 1, x + (horiz ? i * (w + gap(lev)) * s : 0), y + (horiz ? 0 : i * (h + gap(lev)) * s), [...idx, i]);
          };
          place(0, (Wpx - tw * s) / 2, (Hpx - th * s) / 2, []);
          return { cells, s, frames };
        };
        let st = null;
        v.render(() => {
          const m = sm.value, n = sn.value, ten = sp.value === 'ten', d = Array.from({ length: m }, (_, r) => (mix.value && r % 2 ? n + 1 : n));
          const P = d.reduce((a, b) => a * b, 1), Sm = d.reduce((a, b) => a + b, 0);
          const r = v.rng(3 + m * 7 + n), vecs = d.map((q) => Array.from({ length: q }, () => r.uniform(-1, 1)));
          // ---- the array
          const Wpx = A.width - 30, Hpx = A.height - 50;
          if (ten) {
            const { cells, s, frames } = layout(d, Wpx, Hpx), vals = cells.map((c) => c[3].reduce((a, i, q) => a * vecs[q][i], 1)), mx = Math.max(1e-9, ...vals.map(Math.abs));
            cells.forEach(([x, y, sz], q) => {
              const X0 = A.invX(15 + x), Y0 = A.invY(35 + y), X1 = A.invX(15 + x + sz), Y1 = A.invY(35 + y + sz), t = vals[q] / mx;
              A.rect(X0, Y1, X1, Y0, { fill: t >= 0 ? 'blue' : 'red', fillAlpha: 0.1 + 0.55 * Math.sqrt(Math.abs(t)), color: 'panel', width: s > 6 ? 1 : 0 });
            });
            frames.forEach(([x, y, w, hh]) => A.rect(A.invX(15 + x), A.invY(35 + y + hh), A.invX(15 + x + w), A.invY(35 + y), { color: 'muted', width: 1 }));
            A.texPx(`${d.join(' \\times ')} = ${P} \\text{ cells}`, A.width / 2, 17, { size: 15, color: 'blue' });
          } else {
            const tot = Sm + (m - 1) * 0.8, s = Math.min(Wpx / tot, 40); let x = (A.width - tot * s) / 2;
            d.forEach((q, rr) => { for (let i = 0; i < q; i++) { const t = vecs[rr][i]; A.rect(A.invX(x + i * s), A.invY(A.height / 2 + s / 2), A.invX(x + (i + 1) * s), A.invY(A.height / 2 - s / 2), { fill: t >= 0 ? 'blue' : 'red', fillAlpha: 0.1 + 0.5 * Math.abs(t), color: 'muted', width: 1 }); } A.texPx(`V_${rr + 1}`, x + (q * s) / 2, A.height / 2 + s / 2 + 16, { size: 13 }); x += (q + 0.8) * s; });
            A.texPx(`${d.join(' + ')} = ${Sm} \\text{ cells}`, A.width / 2, 17, { size: 15, color: 'orange' });
          }
          // ---- growth chart
          B.setView([0.3, m + 0.7], [0.4, Math.max(10, P * 2.5)]);
          B.hline(1, { color: 'muted', width: 1 });
          for (let k = 1; k <= m; k++) {
            const pk = d.slice(0, k).reduce((a, b) => a * b, 1), sk = d.slice(0, k).reduce((a, b) => a + b, 0);
            B.rect(k - 0.32, 1, k - 0.02, Math.max(pk, 1.0001), { fill: 'blue', fillAlpha: ten ? 0.75 : 0.3, stroke: false });
            B.rect(k + 0.02, 1, k + 0.32, Math.max(sk, 1.0001), { fill: 'orange', fillAlpha: ten ? 0.3 : 0.75, stroke: false });
            B.text(String(pk), k - 0.17, Math.max(pk, 1), { dy: -8, size: 11, color: 'blue', align: 'center', weight: 600 });
            B.text(String(sk), k + 0.17, Math.max(sk, 1), { dy: -8, size: 11, color: 'orange', align: 'center', weight: 600 });
          }
          // ---- numerical check: span of random simple tensors
          const key = `${d.join(',')}|${ten}`;
          if (!memo || memo.key !== key) {
            let rk = null; const target = ten ? P : Sm;
            if (target <= 64) {
              const rs = v.rng(9), rows = [];
              for (let q = 0; q < target + 4; q++) {
                const vs = d.map((c) => Array.from({ length: c }, () => rs.normal()));
                rows.push(ten ? vs.reduce((acc, x) => acc.flatMap((a) => x.map((b) => a * b)), [1]) : vs.flat());
              }
              rk = nrank(M.svd(rows).S);
            }
            memo = { key, rk, target };
          }
          st = { d, P, Sm, ten, ...memo };
        });
        v.legend([['blue', 'tensor product: multiply'], ['orange', 'product space: add']]);
        v.readout(() => {
          if (!st) return '';
          const { d, P, Sm, ten, rk, target } = st;
          const chk = rk == null ? `(too big to check numerically here: ${target} cells)` : `Numerically: ${target + 4} random ${ten ? 'simple tensors' : 'elements'} span a space of dimension **${rk}** ${mark(rk === target)}.`;
          return ten ? `$\\dim(V_1\\otimes\\cdots\\otimes V_${d.length}) = ${d.join('\\cdot')} = ${P}$, against $\\dim(V_1\\times\\cdots\\times V_${d.length}) = ${Sm}$. ${chk}` : `$\\dim(V_1\\times\\cdots\\times V_${d.length}) = ${d.join(' + ')} = ${Sm}$ (3.92) — the dimensions add. ${chk}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.90
    {
      num: '9.90',
      kind: 'Theorem',
      name: 'Basis of V₁ ⊗ ⋯ ⊗ V_m',
      statement: String.raw`Suppose $\dim V_r = n_r$ and $e^r_1, \dots, e^r_{n_r}$ is a basis of $V_r$, for $r = 1, \dots, m$. Then the list
$$\{e^1_{j_1} \otimes \cdots \otimes e^m_{j_m}\}_{j_1 = 1, \dots, n_1;\ \dots;\ j_m = 1, \dots, n_m}$$
is a basis of $V_1 \otimes \cdots \otimes V_m$.`,
      idea: String.raw`Follow 9.74. Dual functionals $\varphi^r_j$ with $\varphi^r_j(e^r_k) = \delta_{jk}$ (from the linear map lemma) satisfy $(e^1_{j_1} \otimes \cdots \otimes e^m_{j_m})(\varphi^1_{k_1}, \dots, \varphi^m_{k_m}) = 1$ if every $j_r = k_r$ and $0$ otherwise; applying a vanishing combination to these lists of functionals kills each coefficient, so the list is independent. It has $n_1 \cdots n_m$ elements, the dimension (9.89), so it is a basis (2.38). Consequently an element of $V_1 \otimes \cdots \otimes V_m$ is described by an array with $m$ indices — its coefficients — which is why tensors appear wherever multi-index arrays do. With bases other than the standard ones, the coefficient array is obtained by applying the inverse change-of-basis matrix along each index.`,
      caption: String.raw`$\mathbf R^2 \otimes \mathbf R^2 \otimes \mathbf R^2$ and a fixed target tensor $T$ (its cells outlined in the right block). Step through the eight basis tensors $b_i \otimes c_j \otimes d_k$: left, the current one, scaled by its coefficient $a_{ijk}$ (with standard bases it lights up a single cell; with skewed bases it fills the whole block); right, the running sum $\sum a_{ijk}\, b_i \otimes c_j \otimes d_k$, which reaches $T$ exactly at step 8. Drag either background to rotate. Choose *break* to replace the basis of the second factor by two parallel vectors: the eight tensors span only a 4-dimensional space and the sum never reaches $T$.`,
      deps: ['ladr-9.88', 'ladr-9.74', 'ladr-9.89'],
      tags: ['tensors', 'bases'],
      viz(v) {
        const M = v.M;
        const T = add3(outer3([1, 0.4], [0.5, -1], [0.8, 0.6]), outer3([-0.3, 0.9], [1, 0.7], [-0.6, 1]));
        const bases = {
          std: [[[1, 0], [0, 1]], [[1, 0], [0, 1]], [[1, 0], [0, 1]]],
          skew: [[[1, 0.3], [0.2, 1]], [[0.8, -0.6], [0.6, 0.8]], [[1, 0.7], [0, 1]]],
          dep: [[[1, 0], [0, 1]], [[1, 0.5], [0.5, 0.25]], [[1, 0], [0, 1]]],
        };
        let S = null;
        const sel = v.select('bases', [{ value: 'std', label: 'standard' }, { value: 'skew', label: 'skewed' }, { value: 'dep', label: 'break: $c_2 = \\tfrac12 c_1$' }], 'std', { onChange: () => S && S.reset({ at: 'end' }) });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.8], equal: true, axes: false, height: 300, title: 'step’s basis tensor, times its coefficient' });
        const R = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.8], equal: true, axes: false, height: 300, title: 'running sum, and the target $T$ (outlines)' });
        const s1 = v.scene3(L, { yaw: 0.62, pitch: 0.4, axes: false }), s2 = v.scene3(R, { yaw: 0.62, pitch: 0.4, axes: false, hint: false });
        const frames = () => {
          const B = bases[sel.value], Bm = B.map((b) => fromCols(b)), Pinv = Bm.map((x) => M.pinv(x));
          const a = mode3(T, Pinv[0], Pinv[1], Pinv[2]), out = [];
          let sum = zeros3(2, 2, 2);
          out.push({ sum, cur: null, idx: null, note: 'Start from the zero tensor.', err: Math.sqrt(T.flat(2).reduce((s, x) => s + x * x, 0)) });
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
            const cur = scl3(outer3(B[0][i], B[1][j], B[2][k]), a[i][j][k]);
            sum = add3(sum, cur);
            const err = Math.sqrt(T.flat(2).map((x, q) => x - sum.flat(2)[q]).reduce((s, x) => s + x * x, 0));
            out.push({ sum, cur, idx: [i, j, k], a: a[i][j][k], err, note: `add $a_{${i + 1}${j + 1}${k + 1}}\\, b_${i + 1}\\otimes c_${j + 1}\\otimes d_${k + 1}$ with $a_{${i + 1}${j + 1}${k + 1}} = ${tn(a[i][j][k], 3)}$; distance to $T$ now $${tn(err, 4)}$` });
          }
          const Kr = kron(kron(Bm[0], Bm[1]), Bm[2]);
          out.forEach((f) => { f.rank = nrank(M.svd(Kr).S); });
          return out;
        };
        S = v.steps({ frames, start: 'end', still: 8, speed: 1.2 });
        let ang = [s1.yaw, s1.pitch];
        v.render(() => {
          if (s1.yaw !== ang[0] || s1.pitch !== ang[1]) { s2.yaw = s1.yaw; s2.pitch = s1.pitch; } else { s1.yaw = s2.yaw; s1.pitch = s2.pitch; }
          ang = [s1.yaw, s1.pitch];
          const f = S.frame; if (!f || !f.sum) return;
          const scale = Math.max(1, maxAbs(T));
          s1.begin(); block3(s1, f.cur || zeros3(2, 2, 2), { gap: 0.95, scale, numbers: f.cur ? 'nz' : false, hl: f.idx || undefined, names: ['i', 'j', 'k'] }); s1.flush();
          s2.begin(); block3(s2, f.sum, { gap: 0.95, scale, ghost: T, numbers: 'nz', names: ['i', 'j', 'k'] }); s2.flush();
          R.corner(`‖T − sum‖ = ${pn(f.err, 3)}`, 'tl', { color: f.err < 1e-9 ? 'green' : S.atEnd ? 'red' : 'muted', weight: 700, size: 13 });
          L.corner(sel.value === 'std' ? 'standard bases' : sel.value === 'skew' ? 'skewed bases' : 'c₂ = ½ c₁', 'tl', { color: sel.value === 'dep' ? 'red' : 'muted', weight: 600, size: 12.5 });
        });
        v.readout(() => {
          const f = S.frame; if (!f || !f.sum) return '';
          const done = S.atEnd;
          if (!done) return `${S.i} of the 8 basis tensors added: the running sum is still at distance $${tn(f.err, 4)}$ from $T$.`;
          return f.rank === 8 ? `After all 8 basis tensors the sum equals $T$ (distance $${etx(M, f.err)}$) ✓ — the list $\\{b_i\\otimes c_j\\otimes d_k\\}$ has rank ${f.rank} $= 2\\cdot2\\cdot2$, a basis, and the coefficients $a_{ijk}$ are unique.` : `With $c_2 = \\tfrac12 c_1$ the eight tensors have rank only ${f.rank} $= 2\\cdot1\\cdot2$: the best combination still misses $T$ by $${tn(f.err, 3)}$ ✗.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.92
    {
      num: '9.92',
      kind: 'Theorem',
      name: 'Converting m-linear maps to linear maps',
      statement: String.raw`Suppose $U$ is a vector space.
(a) If $\Gamma\colon V_1 \times \cdots \times V_m \to U$ is an **$m$-linear map** (linear in each slot when the others are held fixed), then there is a unique linear map $\hat\Gamma\colon V_1 \otimes \cdots \otimes V_m \to U$ with $\hat\Gamma(v_1 \otimes \cdots \otimes v_m) = \Gamma(v_1, \dots, v_m)$ for all $(v_1, \dots, v_m) \in V_1 \times \cdots \times V_m$.
(b) Conversely, if $T\colon V_1 \otimes \cdots \otimes V_m \to U$ is linear, there is a unique $m$-linear map $T^{\#}$ with $T^{\#}(v_1, \dots, v_m) = T(v_1 \otimes \cdots \otimes v_m)$ for all $(v_1, \dots, v_m)$.`,
      idea: String.raw`The proof of 9.79 goes through word for word: by 9.90 the tensors $e^1_{j_1} \otimes \cdots \otimes e^m_{j_m}$ form a basis, the linear map lemma defines $\hat\Gamma$ on them by $\hat\Gamma(e^1_{j_1} \otimes \cdots \otimes e^m_{j_m}) = \Gamma(e^1_{j_1}, \dots, e^m_{j_m})$, and multilinearity makes $\hat\Gamma(v_1 \otimes \cdots \otimes v_m)$ and $\Gamma(v_1, \dots, v_m)$ expand to the same sum. The determinant is the showcase: as a function of the three columns, $\det\colon \mathbf R^3 \times \mathbf R^3 \times \mathbf R^3 \to \mathbf R$ is trilinear, so it is a linear functional on the 27-dimensional space $\mathbf R^3 \otimes \mathbf R^3 \otimes \mathbf R^3$; its values on basis tensors form the Levi-Civita array $\varepsilon_{ijk} = \det(e_i, e_j, e_k)$, with six entries $\pm1$ and 21 zeros, and $\hat\Gamma(u \otimes v \otimes w) = \sum \varepsilon_{ijk}\, u_i v_j w_k$ is the permutation formula for the determinant (9.46).`,
      caption: String.raw`Drag $u$, $v$, $w$ in $\mathbf R^3$ (drag the background to rotate); the box they span has signed volume $\det(u, v, w)$, blue when positive and red when negative. Below, left: the array $\Gamma(e_i, e_j, e_k)$ — the matrix of $\hat\Gamma$ — as three $3\times3$ slices $k = 1, 2, 3$. Right: the array of $u \otimes v \otimes w$, cell $(i, j, k)$ holding $u_i v_j w_k$. Multiplying cell by cell and adding gives $\hat\Gamma(u \otimes v \otimes w)$, which matches $\Gamma(u, v, w)$. The trilinear map $\sum_i u_i v_i w_i$ (three nonzero cells) works too; $|\det|$ is not trilinear and its forced candidate fails.`,
      deps: ['ladr-9.90', 'ladr-9.79', 'ladr-9.88'],
      see: ['ladr-9.45', 'ladr-9.46'],
      tags: ['tensors', 'determinants', 'universal property'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Levi-Civita_symbol' },
      viz(v) {
        const M = v.M;
        const sel = v.select('$\\Gamma(u, v, w)$', [{ value: 'det', label: '$\\det(u, v, w)$' }, { value: 'tri', label: '$\\sum_i u_i v_i w_i$' }, { value: 'brk', label: '$|\\det(u, v, w)|$ (break)' }], 'det');
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.85], equal: true, axes: false, height: 290, full: true });
        const sc = v.scene3(S, { yaw: 0.55, pitch: 0.32, axis: 1.35, lim: 1.4 });
        const H = [[1.1, 0.1, 0.1], [0.2, 1.0, -0.15], [0.25, 0.3, 0.95]].map((p, k) => sc.handle(p, { color: ['blue', 'purple', 'teal'][k], label: `$${'uvw'[k]}$` }));
        const T = v.stage({ x: [-0.3, 16.3], y: [-1.75, 1.2], equal: true, axes: false, height: 170, full: true });
        const eps = (i, j, k) => (i === j || j === k || i === k ? 0 : ((j - i + 3) % 3 === 1 ? 1 : -1));
        let st = null;
        v.render(() => {
          const k0 = sel.value, [u, vv, w] = H.map((h) => h.p);
          const det = M.det(fromCols([u, vv, w]));
          const G = (a, b, c) => (k0 === 'det' ? M.det(fromCols([a, b, c])) : k0 === 'tri' ? a[0] * b[0] * c[0] + a[1] * b[1] * c[1] + a[2] * b[2] * c[2] : Math.abs(M.det(fromCols([a, b, c]))));
          const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
          const W3 = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].map((k) => G(E[i], E[j], E[k]))));
          const P3 = outer3(u, vv, w);
          let hat = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) hat += W3[i][j][k] * P3[i][j][k];
          const direct = G(u, vv, w), ok = Math.abs(hat - direct) < 1e-9;
          // ---- the box
          sc.begin();
          const col = det >= 0 ? 'blue' : 'red';
          box3(sc, u, vv, w, { fill: col, fillAlpha: 0.12 });
          H.forEach((h, q) => sc.arrow([0, 0, 0], h.p, { color: ['blue', 'purple', 'teal'][q], width: 2.8 }));
          sc.flush();
          S.corner(`det(u, v, w) = ${pn(det, 3)}`, 'tl', { color: col, weight: 700, size: 13 });
          // ---- slices: Γ(e_i, e_j, e_k) and u⊗v⊗w, slice k = fixed third index
          const c = 0.56;
          for (let k = 0; k < 3; k++) {
            const Wk = [0, 1, 2].map((i) => [0, 1, 2].map((j) => W3[i][j][k])), Pk = [0, 1, 2].map((i) => [0, 1, 2].map((j) => P3[i][j][k]));
            const g1 = grid(T, Wk, k * 1.95, 0.55, c, { scale: 1, dec: 0, size: 11.5, minPx: 18 });
            T.tex(`k = ${k + 1}`, g1.cx, -1.2, { size: 11.5, color: 'muted', baseline: 'top' });
            const g2 = grid(T, Pk, 7.1 + k * 1.95, 0.55, c, { scale: Math.max(0.15, 0.7 * maxAbs(P3)), numbers: false, alpha: 0.85 });
            T.tex(`k = ${k + 1}`, g2.cx, -1.2, { size: 11.5, color: 'muted', baseline: 'top' });
          }
          T.tex(k0 === 'det' ? '\\varepsilon_{ijk} = \\det(e_i, e_j, e_k)' : '\\Gamma(e_i, e_j, e_k)', 2.7, 0.65, { size: 13.5, baseline: 'bottom' });
          T.tex('u_i\\,v_j\\,w_k', 9.8, 0.65, { size: 13.5, baseline: 'bottom' });
          T.tex('\\odot', 6.35, -0.25, { size: 20 });
          T.tex(`\\textstyle\\sum = ${tn(hat, 3)}`, 14.35, 0.05, { size: 15, color: ok ? 'green' : 'red' });
          T.tex(`${ok ? '=' : '\\ne'} \\Gamma(u, v, w) = ${tn(direct, 3)}`, 14.35, -0.6, { size: 13, color: ok ? 'green' : 'red' });
          // antisymmetry check on a non-simple tensor
          const P3b = outer3(vv, u, w); let anti = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) anti += W3[i][j][k] * (P3[i][j][k] + P3b[i][j][k]);
          st = { k0, hat, direct, ok, anti, nz: W3.flat(2).filter((x) => Math.abs(x) > 1e-12).length };
        });
        v.readout(() => {
          if (!st) return '';
          const { k0, hat, direct, ok, anti, nz } = st;
          if (k0 === 'brk') return `$|\\det(u, v, w)| = ${tn(direct, 3)}$, but the forced candidate $\\sum |\\varepsilon_{ijk}|\\,u_iv_jw_k = ${tn(hat, 3)}$ ✗: $|\\det|$ is not trilinear ($|\\det(-u, v, w)| = |\\det(u, v, w)|$), so no linear functional on $\\mathbf R^3\\otimes\\mathbf R^3\\otimes\\mathbf R^3$ matches it.`;
          const tail = k0 === 'det' ? ` On $u\\otimes v\\otimes w + v\\otimes u\\otimes w$ (not a simple tensor) it gives $${tn(anti, 6)}$ — swapping two columns flips the sign.` : '';
          return `$\\hat\\Gamma(u\\otimes v\\otimes w) = ${tn(hat, 4)}$, $\\Gamma(u, v, w) = ${tn(direct, 4)}$ ${mark(ok)}. The matrix of $\\hat\\Gamma$ has ${nz} nonzero entries out of 27.${tail}`;
        });
      },
    },
  ],
};
