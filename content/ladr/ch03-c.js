// Linear Algebra Done Right — Chapter 3: Linear Maps
// Part 3 (3.71–3.103): ℒ(V,W) ≅ F^{m,n}, matrices of vectors, change of basis, products and quotients.
// Parts 1, 2, 4 are ch03.js (3.1–3.35), ch03-b.js (3.38–3.70) and ch03-d.js (3.105–3.133).

// =====================================================================================================
// Shared helpers: 2×2 linear algebra on plain arrays (matrices are arrays of rows), skewed coordinate
// grids, an F-shaped test picture (chiral, so reflections show), small 3-vector tools and TeX formatting.
// =====================================================================================================
const mv2 = (A, x) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
const mm2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const inv2 = (A) => { const d = det2(A); return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
const cols2 = (a, b) => [[a[0], b[0]], [a[1], b[1]]];
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const sc2 = (a, k) => [a[0] * k, a[1] * k];
const hp = (h) => [h.x, h.y];
const isBasis2 = (a, b) => Math.abs(det2(cols2(a, b))) > 0.05 * Math.max(0.2, Math.hypot(...a) * Math.hypot(...b));
/** Coordinates of x in the basis b1, b2 (solve c1 b1 + c2 b2 = x). */
const coords2 = (b1, b2, x) => mv2(inv2(cols2(b1, b2)), x);
/** Matrix, w.r.t. bases with basis matrices B (domain) and C (codomain), of the map whose standard matrix is A. */
const matIn = (A, B, C) => mm2(inv2(C), mm2(A, B));
const maxDiff = (A, B) => Math.max(...A.flat().map((x, i) => Math.abs(x - B.flat()[i])));
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const O3 = [0, 0, 0];
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors (numerically) in the span so far are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) w = sub3(w, mul3(e, dot3(w, e)));
    const l = len3(w); if (l > tol * Math.max(1, len3(x))) B.push(mul3(w, 1 / l));
  }
  return B;
}
const proj3 = (x, B) => B.reduce((s, e) => add3(s, mul3(e, dot3(x, e))), [0, 0, 0]);
/** Orthonormal basis of the orthogonal complement of span(B) in R^3 (B orthonormal). */
const perp3 = (B) => orth([...B, [1, 0, 0], [0, 1, 0], [0, 0, 1]]).slice(B.length);

const tn = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
const bm = (A, d = 2) => '\\begin{bmatrix}' + A.map((r) => r.map((x) => tn(x, d)).join('&')).join('\\\\') + '\\end{bmatrix}';
const bc = (x, d = 2) => bm(x.map((t) => [t]), d);
const vt = (x, d = 2) => `(${x.map((t) => tn(t, d)).join(',\\,')})`;

/** F-shaped test picture (in the first quadrant). */
const FSH = [[0.15, 0.1], [0.45, 0.1], [0.45, 0.6], [0.85, 0.6], [0.85, 0.86], [0.45, 0.86], [0.45, 1.12], [1.05, 1.12], [1.05, 1.4], [0.15, 1.4]];
/** Grid of lines c·b1 + t·b2 and t·b1 + c·b2 (integer c) — the coordinate grid of the basis b1, b2. */
function skewGrid(s, b1, b2, st = {}) {
  if (!isBasis2(b1, b2)) return;
  const n = st.n ?? 7, color = st.color || 'faint';
  for (let k = -n; k <= n; k++) {
    const a = k === 0 ? (st.axisAlpha ?? 0.55) : (st.alpha ?? 0.22), w = k === 0 ? 1.3 : 0.8;
    s.line(k * b1[0] - n * b2[0], k * b1[1] - n * b2[1], k * b1[0] + n * b2[0], k * b1[1] + n * b2[1], { color, width: w, alpha: a });
    s.line(k * b2[0] - n * b1[0], k * b2[1] - n * b1[1], k * b2[0] + n * b1[0], k * b2[1] + n * b1[1], { color, width: w, alpha: a });
  }
}
/** Arrow from the origin (or from `from`) with a TeX label just beyond its tip. */
function arr(s, p, color, label, st = {}) {
  const o = st.from || [0, 0];
  s.arrow(o[0], o[1], o[0] + p[0], o[1] + p[1], { color, width: st.width ?? 2.4, alpha: st.alpha, dash: st.dash, head: st.head });
  if (label) {
    const l = Math.hypot(p[0], p[1]), off = st.off ?? 0.3, q = l > 1e-6 ? [p[0] / l, p[1] / l] : [0, 1];
    s.tex(label, o[0] + p[0] + q[0] * off, o[1] + p[1] + q[1] * off, { color, align: 'center', baseline: 'middle', size: st.size ?? 15 });
  }
}
/** Two-step path 0 → c1·b1 → c1·b1 + c2·b2 drawn as coloured arrows, with dots at the whole steps. */
function stepPath(s, c, b1, b2, col1, col2, st = {}) {
  const p1 = sc2(b1, c[0]), p2 = add2(p1, sc2(b2, c[1]));
  s.arrow(0, 0, p1[0], p1[1], { color: col1, width: st.width ?? 3, dash: st.dash, alpha: st.alpha ?? 0.9, head: 8 });
  s.arrow(p1[0], p1[1], p2[0], p2[1], { color: col2, width: st.width ?? 3, dash: st.dash, alpha: st.alpha ?? 0.9, head: 8 });
  if (st.ticks !== false) {
    for (let k = 1; k <= Math.floor(Math.abs(c[0]) + 1e-9); k++) { const q = sc2(b1, k * Math.sign(c[0])); s.dot(q[0], q[1], { r: 2.6, color: col1 }); }
    for (let k = 1; k <= Math.floor(Math.abs(c[1]) + 1e-9); k++) { const q = add2(p1, sc2(b2, k * Math.sign(c[1]))); s.dot(q[0], q[1], { r: 2.6, color: col2 }); }
  }
  return p2;
}
/** Fibonacci points on the unit sphere. */
const SPHERE = Array.from({ length: 180 }, (_, i) => {
  const z = 1 - (2 * i + 1) / 180, r = Math.sqrt(1 - z * z), t = i * 2.399963229728653;
  return [r * Math.cos(t), r * Math.sin(t), z];
});
/** Draw a subspace of R^3 given by an orthonormal basis B in a scene3 (dot, line, disc or box). */
function drawSub(sc, B, color, st = {}) {
  const r = st.r ?? 1.55;
  if (B.length === 0) sc.dot(O3, { r: 6, color });
  else if (B.length === 1) sc.line(mul3(B[0], -r), mul3(B[0], r), { color, width: st.width ?? 4, alpha: st.alpha ?? 0.6 }, 12);
  else if (B.length === 2) sc.disc(B[0], B[1], r, { fill: color, color, fillAlpha: st.fillAlpha ?? 0.12, alpha: 0.5, grid: st.grid ?? true });
  else cubeEdges(sc, 1.25, color);
}
function cubeEdges(sc, a, color, c = O3) {
  const V = [];
  for (const x of [-a, a]) for (const y of [-a, a]) for (const z of [-a, a]) V.push(add3(c, [x, y, z]));
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const d = [0, 1, 2].filter((k) => V[i][k] !== V[j][k]).length;
    if (d === 1) sc.line(V[i], V[j], { color, width: 1.4, alpha: 0.55 }, 4);
  }
}
const SUBS = ['₁', '₂', '₃', '₄'];

export default {
  collection: 'ladr',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.71
    {
      num: '3.71',
      kind: 'Theorem',
      name: String.raw`ℒ(V, W) and $\mathbf F^{m,n}$ are isomorphic`,
      statement: String.raw`Suppose $v_1,\dots,v_n$ is a basis of $V$ and $w_1,\dots,w_m$ is a basis of $W$. Then the map
$$\mathcal M:\mathcal L(V,W)\to\mathbf F^{m,n},\qquad T\mapsto\mathcal M(T),$$
sending each linear map to its matrix with respect to these bases, is an isomorphism.`,
      idea: String.raw`$\mathcal M$ is linear because the matrix of a sum is the sum of the matrices (3.35) and the matrix of $\lambda T$ is $\lambda\mathcal M(T)$ (3.38). It is injective: $\mathcal M(T)=0$ says $Tv_k=0$ for every $k$, and a linear map that vanishes on a basis is $0$ (3.4), so $\operatorname{null}\mathcal M=\{0\}$ (3.15). It is surjective: for any $A\in\mathbf F^{m,n}$, 3.4 gives a linear map with $Tv_k=\sum_j A_{j,k}w_j$, whose matrix is $A$. A linear bijection is an isomorphism.`,
      caption: String.raw`Here $\mathcal L(\mathbf R^2,\mathbf R^3)\cong\mathbf F^{3,2}$ with the standard bases. Drag the tips $Tv_1$, $Tv_2$ in $\mathbf R^3$ (drag the background to rotate): the columns of the matrix follow. Pick a matrix from the menu: the map appears, carrying the F-shaped picture of $\mathbf R^2$ onto its image. Drag $x$ to see $Tx=x_1Tv_1+x_2Tv_2$. Choose the zero matrix: only the zero map has it.`,
      deps: ['ladr-3.31', 'ladr-3.4', 'ladr-3.15', 'ladr-3.35', 'ladr-3.38'],
      tags: ['matrices', 'isomorphism'],
      viz(v) {
        const sD = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 300, minWidth: 220, title: String.raw`$V=\mathbf R^2$, basis $v_1,v_2$` });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 170, weight: 0.65, title: String.raw`$\mathcal M(T)\in\mathbf F^{3,2}$` });
        const sW = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, minWidth: 250, title: String.raw`$W=\mathbf R^3$` });
        const sc = v.scene3(sW, { yaw: -0.75, pitch: 0.38, axis: 1.6, lim: 1.6 });
        const PRE = {
          tilt: [[1, 0], [0, 1], [0.6, -0.5]], swap: [[0, -1], [1.2, 0], [0, 0.8]],
          rank1: [[1, 0.5], [0.6, 0.3], [0.4, 0.2]], zero: [[0, 0], [0, 0], [0, 0]],
        };
        const h1 = sc.handle([1, 0, 0.6], { color: 'blue', label: 'Tv₁' });
        const h2 = sc.handle([0, 1, -0.5], { color: 'orange', label: 'Tv₂' });
        const x = sD.handle(0.9, 0.55, { color: 'gold', label: 'x' });
        v.select('matrix', [{ value: 'tilt', label: 'tilted plane' }, { value: 'swap', label: 'turn and lift' }, { value: 'rank1', label: 'rank 1' }, { value: 'zero', label: 'zero' }], 'tilt', {
          onChange: (k) => { h1.set(PRE[k].map((r) => r[0])); h2.set(PRE[k].map((r) => r[1])); },
        });
        const T = v.table(sM, { rows: 3, cols: 2, maxCell: 56, size: 15, rowLabels: ['$w_1$', '$w_2$', '$w_3$'], colLabels: ['$Tv_1$', '$Tv_2$'], colLabelColor: (j) => (j ? 'orange' : 'blue') });
        let A = PRE.tilt;
        v.render(() => {
          const c1 = h1.p, c2 = h2.p; A = [0, 1, 2].map((i) => [c1[i], c2[i]]);
          const im = (p) => add3(mul3(c1, p[0]), mul3(c2, p[1])), X = hp(x);
          // V
          sD.poly(FSH, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 1.2 });
          arr(sD, [1, 0], 'blue', 'v_1', { off: 0.22 }); arr(sD, [0, 1], 'orange', 'v_2', { off: 0.22 });
          sD.line(0, 0, X[0], 0, { color: 'blue', dash: [3, 3], alpha: 0.7 }); sD.line(X[0], 0, X[0], X[1], { color: 'orange', dash: [3, 3], alpha: 0.7 });
          sD.arrow(0, 0, X[0], X[1], { color: 'gold', width: 2.6 });
          // matrix
          T.draw({ value: (i, j) => A[i][j], format: 2, fill: (i, j) => [j ? 'orange' : 'blue', 0.14] });
          // W
          sc.begin();
          for (let k = -2; k <= 2; k++) {
            sc.line(im([k / 2, -1]), im([k / 2, 1]), { color: 'muted', width: 0.8, alpha: 0.3 }, 4);
            sc.line(im([-1, k / 2]), im([1, k / 2]), { color: 'muted', width: 0.8, alpha: 0.3 }, 4);
          }
          sc.poly(FSH.map(im), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.2 });
          sc.arrow(O3, c1, { color: 'blue' }); sc.arrow(O3, c2, { color: 'orange' });
          const p1 = mul3(c1, X[0]), Tx = im(X);
          sc.line(O3, p1, { color: 'blue', dash: [3, 3], alpha: 0.8 }, 1); sc.line(p1, Tx, { color: 'orange', dash: [3, 3], alpha: 0.8 }, 1);
          sc.arrow(O3, Tx, { color: 'gold', width: 2.6 }); sc.tex('Tx', mul3(Tx, 1.12), { color: 'gold', align: 'center', baseline: 'middle' });
          sc.flush();
        });
        v.readout(() => {
          const X = hp(x), Tx = [0, 1, 2].map((i) => A[i][0] * X[0] + A[i][1] * X[1]);
          const zero = A.flat().every((t) => Math.abs(t) < 1e-9);
          return String.raw`$\mathcal M(T)=${bm(A)}$ holds exactly the coordinates of $Tv_1, Tv_2$ — six numbers, and any six numbers define one linear map (3.4). $Tx=${tn(X[0])}\,Tv_1+${tn(X[1])}\,Tv_2=${vt(Tx)}$.` +
            (zero ? ' The zero matrix belongs to the zero map alone: $\\operatorname{null}\\mathcal M=\\{0\\}$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.72
    {
      num: '3.72',
      kind: 'Corollary',
      name: 'dim ℒ(V, W) = (dim V)(dim W)',
      statement: String.raw`If $V$ and $W$ are finite-dimensional, then $\mathcal L(V,W)$ is finite-dimensional and
$$\dim\mathcal L(V,W)=(\dim V)(\dim W).$$`,
      idea: String.raw`Fix bases. By 3.71, $\mathcal L(V,W)$ is isomorphic to $\mathbf F^{m,n}$ with $m=\dim W$, $n=\dim V$; isomorphic spaces have equal dimension (3.70), and $\dim\mathbf F^{m,n}=mn$ (3.40). Concretely, a basis of $\mathcal L(V,W)$ is given by the $mn$ maps $E_{j,k}$ sending $v_k$ to $w_j$ and every other $v_i$ to $0$; the matrix of $E_{j,k}$ has a single $1$, in row $j$ and column $k$.`,
      caption: String.raw`Choose $\dim V$ and $\dim W$. Click a cell of the grid to see the elementary map $E_{j,k}$: a single arrow $v_k\to w_j$, every other basis vector going to $0$. Switch to a general $T$ (or press Resample): its arrows are weighted by the matrix entries, and it decomposes as $\sum a_{j,k}E_{j,k}$ — the coefficients are computed by solving a linear system, and they are exactly the entries.`,
      deps: ['ladr-3.71', 'ladr-3.70', 'ladr-3.40'],
      tags: ['linear maps', 'dimension'],
      verify: true,
      viz(v) {
        const M = v.M;
        const n = v.slider(String.raw`$n=\dim V$`, 1, 4, 3, { int: true });
        const m = v.slider(String.raw`$m=\dim W$`, 1, 4, 2, { int: true });
        const mode = v.select('show', [{ value: 'E', label: 'one $E_{j,k}$' }, { value: 'T', label: 'a general $T$' }], 'E');
        let seed = 3, sel = [1, 2];
        v.button('Resample', () => { seed++; mode.set('T'); });
        const sG = v.stage({ x: [-0.9, 3.9], y: [-0.35, 4.35], axes: false, height: 320, minWidth: 260, title: 'basis of $V$ → basis of $W$' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, minWidth: 240, title: 'the $m\\times n$ grid of entries (click a cell)' });
        const T = v.table(sT, { rows: 2, cols: 3, maxCell: 54, size: 15 });
        sT.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { sel = [c.i, c.j]; mode.set('E'); } });
        let info = null;
        v.render(() => {
          const N = n.value, Mm = m.value; sel = [Math.min(sel[0], Mm - 1), Math.min(sel[1], N - 1)];
          const r = M.rng(seed), a = Array.from({ length: Mm }, () => Array.from({ length: N }, () => Math.round(r.uniform(-2, 2) * 2) / 2 || 0.5));
          const E = mode.value === 'E', ent = (j, k) => (E ? (j === sel[0] && k === sel[1] ? 1 : 0) : a[j][k]);
          const yv = (k, K) => (K === 1 ? 2 : 3.6 - (3.2 * k) / (K - 1));
          for (let k = 0; k < N; k++) for (let j = 0; j < Mm; j++) {
            const e = ent(j, k); if (!e) continue;
            sG.arrow(0.18, yv(k, N), 2.82, yv(j, Mm), { color: E ? 'green' : e > 0 ? 'blue' : 'red', width: E ? 3.2 : 0.8 + 1.1 * Math.abs(e), alpha: E ? 1 : 0.75, head: 9 });
          }
          for (let k = 0; k < N; k++) {
            sG.dot(0, yv(k, N), { r: 6, color: 'purple' }); sG.tex(`v_${k + 1}`, -0.25, yv(k, N), { color: 'purple', align: 'right', baseline: 'middle' });
            if (E && k !== sel[1]) sG.text('↦ 0', 0.42, yv(k, N) + 0.22, { color: 'muted', size: 12 });
          }
          for (let j = 0; j < Mm; j++) { sG.dot(3, yv(j, Mm), { r: 6, color: 'teal' }); sG.tex(`w_${j + 1}`, 3.25, yv(j, Mm), { color: 'teal', align: 'left', baseline: 'middle' }); }
          T.draw({
            rows: Mm, cols: N, value: (i, j) => ent(i, j), format: (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1)).replace('-', '−'),
            rowLabels: (i) => `$w_${i + 1}$`, colLabels: (j) => `$v_${j + 1}$`,
            fill: (i, j) => (E ? (i === sel[0] && j === sel[1] ? ['green', 0.3] : null) : [a[i][j] > 0 ? 'blue' : 'red', 0.08 + 0.1 * Math.abs(a[i][j])]),
            textColor: (i, j) => (ent(i, j) ? 'ink' : 'faint'), highlight: E ? [sel] : [],
          });
          // honest check: the mn flattened E_{j,k} are independent, and T's coordinates in them solve a linear system
          const basis = []; for (let j = 0; j < Mm; j++) for (let k = 0; k < N; k++) basis.push(Array.from({ length: Mm * N }, (_, q) => (q === j * N + k ? 1 : 0)));
          const B = basis[0].map((_, q) => basis.map((b) => b[q])), flat = a.flat();
          const coef = M.solve(B, flat), res = Math.max(...coef.map((c, q) => Math.abs(c - flat[q])));
          info = { N, Mm, rank: M.rank(B), res, E };
        });
        v.readout(() => {
          if (!info) return '';
          const { N, Mm, rank, res, E } = info;
          return String.raw`$\dim\mathcal L(V,W)=(\dim V)(\dim W)=${N}\cdot${Mm}=${N * Mm}$: the ${N * Mm} maps $E_{j,k}$ are linearly independent (rank of their matrices, flattened: ${rank}) and span. ` +
            (E ? String.raw`$E_{${sel[0] + 1},${sel[1] + 1}}$ sends $v_{${sel[1] + 1}}\mapsto w_{${sel[0] + 1}}$ and the other $v_i\mapsto 0$.` : String.raw`$T=\sum a_{j,k}E_{j,k}$ with coefficients = matrix entries (largest discrepancy ${v.sci(res + 1e-17, 1)}$).`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.73
    {
      num: '3.73',
      kind: 'Definition',
      name: 'Matrix of a vector',
      statement: String.raw`Suppose $v\in V$ and $v_1,\dots,v_n$ is a basis of $V$. The **matrix of $v$** with respect to this basis is the $n\times1$ column
$$\mathcal M(v)=\begin{bmatrix}b_1\\ \vdots\\ b_n\end{bmatrix},\qquad\text{where } v=b_1v_1+\cdots+b_nv_n .$$`,
      idea: String.raw`Because $v_1,\dots,v_n$ is a basis, every $v$ is a linear combination of it in exactly one way (2.28), so the column is well defined. The map $v\mapsto\mathcal M(v)$ is an isomorphism $V\to\mathbf F^{n,1}$: it turns abstract vectors into lists of numbers, but the numbers depend on the basis chosen.`,
      caption: String.raw`Drag the basis vectors $v_1$, $v_2$ (blue, teal) to skew the coordinate grid, and drag $v$ (gold). $\mathcal M(v)$ counts the steps: go $b_1$ times along $v_1$, then $b_2$ times along $v_2$ (dots mark whole steps). The same arrow has different columns in different bases. Make $v_1$ and $v_2$ parallel: they are no longer a basis and the column is undefined.`,
      deps: ['ladr-2.28'],
      tags: ['matrices', 'bases'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 360 });
        const b1 = s.handle(1.1, 0.35, { color: 'blue', label: 'v₁' }), b2 = s.handle(0.45, 0.95, { color: 'teal', label: 'v₂' });
        const x = s.handle(2.1, 1.55, { color: 'gold', label: 'v' });
        v.button('standard basis', () => { b1.set(1, 0); b2.set(0, 1); });
        v.button('skewed basis', () => { b1.set(1.1, 0.35); b2.set(0.45, 0.95); });
        v.render(() => {
          const B1 = hp(b1), B2 = hp(b2), X = hp(x), ok = isBasis2(B1, B2);
          skewGrid(s, B1, B2, { color: 'blue', n: 9 });
          if (ok) stepPath(s, coords2(B1, B2, X), B1, B2, 'blue', 'teal', { width: 3.2 });
          s.arrow(0, 0, X[0], X[1], { color: 'gold', width: 2.2, alpha: 0.85 });
          arr(s, B1, 'blue', null, { width: 2.8 }); arr(s, B2, 'teal', null, { width: 2.8 });
          if (ok) {
            const c = coords2(B1, B2, X);
            s.tex(String.raw`\mathcal M(v)=${bc(c)}`, s.bounds.x[0], s.bounds.y[1] - 0.1, { color: 'ink', align: 'left', baseline: 'top', size: 17, dx: 10 });
          } else s.corner('v₁, v₂ are parallel: not a basis, no unique column', 'tl', { color: 'red', weight: 600 });
        });
        v.readout(() => {
          const B1 = hp(b1), B2 = hp(b2), X = hp(x);
          if (!isBasis2(B1, B2)) return String.raw`$v_1,v_2$ is linearly dependent: some vectors have no expression $b_1v_1+b_2v_2$ and the others have infinitely many.`;
          const c = coords2(B1, B2, X);
          return String.raw`$v=${tn(c[0])}\,v_1+${tn(c[1])}\,v_2$, so $\mathcal M(v)=${bc(c)}$; in the standard basis the same vector has column $${bc(X)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.75
    {
      num: '3.75',
      kind: 'Theorem',
      name: 'Column k of ℳ(T) equals ℳ(Tvₖ)',
      statement: String.raw`Suppose $T\in\mathcal L(V,W)$, $v_1,\dots,v_n$ is a basis of $V$ and $w_1,\dots,w_m$ is a basis of $W$. For each $k=1,\dots,n$, the $k$-th column of $\mathcal M(T)$ equals $\mathcal M(Tv_k)$:
$$\mathcal M(T)_{\cdot,k}=\mathcal M(Tv_k).$$`,
      idea: String.raw`By the definition of $\mathcal M(T)$ (3.31), its $k$-th column lists the numbers $A_{1,k},\dots,A_{m,k}$ with $Tv_k=A_{1,k}w_1+\cdots+A_{m,k}w_m$. By the definition of the matrix of a vector (3.73), those same numbers form $\mathcal M(Tv_k)$. The theorem is the definition read in two ways.`,
      caption: String.raw`An animation: $v_k$ is carried by $T$ to $Tv_k$ (green), $Tv_k$ is split along the codomain basis $w_1$, $w_2$ (orange, pink), and the two coefficients fly into column $k$ of $\mathcal M(T)$. Drag the domain basis $v_1$, $v_2$ or the codomain basis $w_1$, $w_2$ while it plays, or change $T$: the column always equals the coordinates of $Tv_k$.`,
      deps: ['ladr-3.31', 'ladr-3.73'],
      tags: ['matrices'],
      viz(v) {
        const s = v.stage({ x: [-2.6, 6.3], y: [-2.2, 2.3], equal: true, axes: false, height: 360 });
        const OPS = { shear: [[1, 0.8], [0, 1]], rot: [[0.55, -0.85], [0.85, 0.55]], proj: [[0.8, 0.4], [0.4, 0.2]] };
        const op = v.select('$T$', [{ value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotate & scale' }, { value: 'proj', label: 'projection' }], 'shear');
        const v1 = s.handle(1.1, 0.25, { color: 'blue', label: 'v₁' }), v2 = s.handle(-0.35, 0.95, { color: 'teal', label: 'v₂' });
        const w1 = s.handle(0.95, -0.5, { color: 'orange', label: 'w₁' }), w2 = s.handle(0.4, 1.05, { color: 'pink', label: 'w₂' });
        const T = v.table(s, { rows: 2, cols: 2, region: [3.3, -1.9, 6.2, 1.3], maxCell: 62, size: 16, rowLabels: ['$w_1$', '$w_2$'], colLabels: ['$k=1$', '$k=2$'] });
        let st = null;
        v.animate((t) => {
          const A = OPS[op.value], V1 = hp(v1), V2 = hp(v2), W1 = hp(w1), W2 = hp(w2);
          const okW = isBasis2(W1, W2), okV = isBasis2(V1, V2);
          s.line(-2.5, 0, 2.5, 0, { color: 'faint' }); s.line(0, -2.1, 0, 2.1, { color: 'faint' });
          skewGrid(s, W1, W2, { color: 'orange', n: 6, alpha: 0.13, axisAlpha: 0.3 });
          arr(s, V1, 'blue', null); arr(s, V2, 'teal', null); arr(s, W1, 'orange', null); arr(s, W2, 'pink', null);
          if (!okW || !okV) { s.corner('the vᵢ or the wⱼ are not a basis', 'tl', { color: 'red', weight: 600 }); st = null; return; }
          const MT = matIn(A, cols2(V1, V2), cols2(W1, W2));
          const k = t % 8 < 4 ? 0 : 1, tau = t % 4, vk = k ? V2 : V1, Tvk = mv2(A, vk), c = [MT[0][k], MT[1][k]];
          const e1 = smooth(tau / 0.9), p = add2(sc2(vk, 1 - e1), sc2(Tvk, e1));
          s.arrow(0, 0, vk[0], vk[1], { color: k ? 'teal' : 'blue', width: 5, alpha: 0.35 });
          s.tex(`v_${k + 1}`, vk[0] * 0.5 - 0.18 * vk[1] / Math.hypot(...vk), vk[1] * 0.5 + 0.18 * vk[0] / Math.hypot(...vk), { color: k ? 'teal' : 'blue', align: 'center', baseline: 'middle' });
          const e2 = smooth((tau - 1) / 0.9);
          const q1 = sc2(W1, c[0] * e2), q2 = add2(q1, sc2(W2, c[1] * e2));
          if (tau > 1) {
            s.arrow(0, 0, q1[0], q1[1], { color: 'orange', width: 3.4, head: 8 });
            s.arrow(q1[0], q1[1], q2[0], q2[1], { color: 'pink', width: 3.4, head: 8 });
          }
          s.arrow(0, 0, p[0], p[1], { color: 'green', width: 2.6 });
          s.tex(tau < 0.9 ? `T` : `Tv_${k + 1}`, p[0] * 1.12 + 0.12, p[1] * 1.12 + 0.12, { color: 'green', align: 'center', baseline: 'middle' });
          const e3 = smooth((tau - 2.1) / 0.8);
          T.draw({
            value: (i, j) => (j === k && tau < 2.9 ? null : MT[i][j]), format: 2, activeCol: k, activeColor: 'green',
            textColor: (i, j) => (j === k ? 'ink' : 'muted'), fill: (i, j) => (j === k && tau >= 2.9 ? ['green', 0.22] : null),
          });
          s.tex(String.raw`\mathcal M(T)`, 4.55 + 0.25, 1.85, { color: 'ink', align: 'center', baseline: 'middle', size: 17 });
          if (tau > 1.6 && tau < 2.9) {
            const src = [sc2(W1, c[0] * 0.5), add2(sc2(W1, c[0]), sc2(W2, c[1] * 0.5))];
            for (let i = 0; i < 2; i++) {
              const tg = T.cellCenter(i, k), P = add2(sc2(src[i], 1 - e3), sc2(tg, e3));
              s.tex(tn(c[i]), P[0], P[1], { color: i ? 'pink' : 'orange', align: 'center', baseline: 'middle', size: 16 });
            }
          }
          st = { k, c, MT };
        }, { period: 8, autoplay: true });
        v.readout(() => {
          if (!st) return 'Restore bases to see the matrix.';
          const { k, c, MT } = st;
          return String.raw`$Tv_${k + 1}=${tn(c[0])}\,w_1+${tn(c[1])}\,w_2$, so $\mathcal M(Tv_${k + 1})=${bc(c)}$ — column ${k + 1} of $\mathcal M(T)=${bm(MT)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.76
    {
      num: '3.76',
      kind: 'Theorem',
      name: 'Linear maps act like matrix multiplication',
      statement: String.raw`Suppose $T\in\mathcal L(V,W)$ and $v\in V$. If $v_1,\dots,v_n$ is a basis of $V$ and $w_1,\dots,w_m$ is a basis of $W$, then
$$\mathcal M(Tv)=\mathcal M(T)\,\mathcal M(v).$$`,
      idea: String.raw`Write $v=b_1v_1+\cdots+b_nv_n$. Linearity gives $Tv=b_1Tv_1+\cdots+b_nTv_n$, and taking matrices (which is linear) gives $\mathcal M(Tv)=b_1\mathcal M(Tv_1)+\cdots+b_n\mathcal M(Tv_n)$. By 3.75 the $\mathcal M(Tv_k)$ are the columns of $\mathcal M(T)$, and a linear combination of columns with coefficients $b_k$ is exactly the product $\mathcal M(T)\mathcal M(v)$ (3.50).`,
      caption: String.raw`Left: the domain with basis $v_1,v_2$ and its grid; drag $x$ (gold) and the basis vectors. Right: the codomain with basis $w_1,w_2$ (drag them too) and $Tx$ (green). The orange–pink steps on the right are drawn from the product $\mathcal M(T)\mathcal M(x)$ alone — and they always land exactly on $Tx$.`,
      deps: ['ladr-3.75', 'ladr-3.50', 'ladr-3.73'],
      tags: ['matrices'],
      viz(v) {
        const OPS = { a: [[0.8, -0.7], [0.5, 0.9]], b: [[1.2, 0.3], [0.2, 0.5]], c: [[0, -1], [1, 0]] };
        const op = v.select('$T$', [{ value: 'a', label: 'rotate & stretch' }, { value: 'b', label: 'squash' }, { value: 'c', label: 'quarter turn' }], 'a');
        const mk = (title) => v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 330, minWidth: 260, title });
        const sV = mk(String.raw`$V$, basis $v_1,v_2$`), sW = mk(String.raw`$W$, basis $w_1,w_2$`);
        const v1 = sV.handle(1, 0.3, { color: 'blue', label: 'v₁' }), v2 = sV.handle(0.2, 0.9, { color: 'teal', label: 'v₂' });
        const x = sV.handle(1.4, 1.2, { color: 'gold', label: 'x' });
        const w1 = sW.handle(0.8, -0.4, { color: 'orange', label: 'w₁' }), w2 = sW.handle(0.5, 0.9, { color: 'pink', label: 'w₂' });
        let st = null;
        v.render(() => {
          const A = OPS[op.value], V1 = hp(v1), V2 = hp(v2), W1 = hp(w1), W2 = hp(w2), X = hp(x), Tx = mv2(A, X);
          skewGrid(sV, V1, V2, { color: 'blue', n: 8, alpha: 0.16 }); skewGrid(sW, W1, W2, { color: 'orange', n: 8, alpha: 0.16 });
          const ok = isBasis2(V1, V2) && isBasis2(W1, W2);
          if (ok) {
            const MT = matIn(A, cols2(V1, V2), cols2(W1, W2)), mx = coords2(V1, V2, X), prod = mv2(MT, mx), mTx = coords2(W1, W2, Tx);
            stepPath(sV, mx, V1, V2, 'blue', 'teal', { width: 2.6, alpha: 0.75 });
            stepPath(sW, prod, W1, W2, 'orange', 'pink', { width: 3.6, alpha: 0.75 });
            sV.tex(String.raw`\mathcal M(x)=${bc(mx)}`, -2.4, 2.4, { align: 'left', baseline: 'top', size: 15, color: 'ink' });
            sW.tex(String.raw`\mathcal M(T)\mathcal M(x)=${bc(prod)}`, -2.4, 2.4, { align: 'left', baseline: 'top', size: 15, color: 'ink' });
            st = { MT, mx, prod, mTx };
          } else { st = null; sW.corner('not a basis', 'tl', { color: 'red', weight: 600 }); }
          arr(sV, V1, 'blue', null); arr(sV, V2, 'teal', null); arr(sW, W1, 'orange', null); arr(sW, W2, 'pink', null);
          sV.arrow(0, 0, X[0], X[1], { color: 'gold', width: 2.4 });
          arr(sW, Tx, 'green', 'Tx', { width: 2.4 }); sW.dot(Tx[0], Tx[1], { r: 4, color: 'green' });
        });
        v.readout(() => {
          if (!st) return 'Choose bases (the basis vectors must not be parallel).';
          const { MT, mx, prod, mTx } = st;
          return String.raw`$\mathcal M(T)\,\mathcal M(x)=${bm(MT)}${bc(mx)}=${bc(prod)}$, and solving $Tx=c_1w_1+c_2w_2$ directly gives $\mathcal M(Tx)=${bc(mTx)}$ — the same column.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.78
    {
      num: '3.78',
      kind: 'Theorem',
      name: 'dim range T equals column rank of ℳ(T)',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Then $\dim\operatorname{range}T$ equals the column rank of $\mathcal M(T)$ (with respect to any bases of $V$ and $W$).`,
      idea: String.raw`$\operatorname{range}T=\operatorname{span}(Tv_1,\dots,Tv_n)$. The map $w\mapsto\mathcal M(w)$ is an isomorphism $W\to\mathbf F^{m,1}$ (3.69), so it preserves dimensions of subspaces; it carries $\operatorname{span}(Tv_1,\dots,Tv_n)$ onto $\operatorname{span}(\mathcal M(Tv_1),\dots,\mathcal M(Tv_n))$, which is the span of the columns of $\mathcal M(T)$ by 3.75. The dimension of that span is the column rank (3.52).`,
      caption: String.raw`A map $T:\mathbf R^3\to\mathbf R^3$ is set by the images of the standard basis — drag the column tips (a tip near the span of the others snaps into it), or pick a rank. Gold dots: the image of the unit sphere, i.e. the actual set $T(S^2)\subseteq\operatorname{range}T$; green: the range (point, line, plane or all of space). The dimension of the range is measured from the gold cloud, the column rank from the pivots of the matrix — they always agree.`,
      deps: ['ladr-3.52', 'ladr-3.75', 'ladr-3.69'],
      tags: ['rank'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, minWidth: 320, weight: 1.6 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.33, axis: 1.6, lim: 1.5 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 210, title: String.raw`$\mathcal M(T)$, pivot columns green` });
        const TB = v.table(sM, { rows: 3, cols: 3, maxCell: 54, size: 14, colLabels: ['$Te_1$', '$Te_2$', '$Te_3$'], colLabelColor: (j) => ['blue', 'orange', 'purple'][j] });
        const C = ['blue', 'orange', 'purple'];
        const PRE = {
          3: [[1.2, 0.25, -0.1], [0.2, 1.1, 0.3], [-0.2, -0.3, 1.0]],
          2: [[1.2, 0.25, -0.1], [0.2, 1.1, 0.3], [0.7, 0.68, 0.05]],
          1: [[1.0, 0.5, 0.3], [-0.6, -0.3, -0.18], [0.4, 0.2, 0.12]],
          0: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        };
        const H = [];
        const snap = (p, i) => {
          if (len3(p) < 0.14) return O3.slice();
          const oth = H.filter((_, j) => j !== i).map((h) => h.p).filter((o) => len3(o) > 0.1);
          for (const o of oth) { const e = unit3(o), q = mul3(e, dot3(p, e)); if (len3(sub3(p, q)) < 0.12) return q; }
          const B = orth(oth);
          if (B.length === 2) { const q = proj3(p, B); if (len3(sub3(p, q)) < 0.12) return q; }
          return p;
        };
        PRE[3].forEach((c, i) => H.push(sc.handle(c, { color: C[i], label: `Te${SUBS[i]}`, snap: (p) => snap(p, i) })));
        v.select('preset', [{ value: '3', label: 'rank 3' }, { value: '2', label: 'rank 2' }, { value: '1', label: 'rank 1' }, { value: '0', label: 'rank 0' }], '3', {
          onChange: (k) => PRE[k].forEach((c, i) => H[i].set(c)),
        });
        let st = null;
        v.render(() => {
          const cols = H.map((h) => h.p), A = [0, 1, 2].map((r) => cols.map((c) => c[r]));
          const piv = M.rref(A, 1e-9).pivots;
          const img = SPHERE.map((p) => M.matVec(A, p)), R = orth(img, 1e-6), Rc = orth(cols, 1e-7);
          sc.begin();
          if (Rc.length === 3) cubeEdges(sc, 1.3, 'green');
          else drawSub(sc, Rc, 'green', { r: 1.65, fillAlpha: 0.13, width: 6, alpha: 0.5 });
          sc.dots(img, { r: 1.7, color: 'gold' });
          cols.forEach((c, i) => { if (len3(c) > 1e-9) sc.arrow(O3, c, { color: C[i] }); });
          sc.flush();
          const shape = ['the point $\\{0\\}$', 'a line', 'a plane', 'all of $\\mathbf R^3$'][R.length];
          S.corner(`dim range T = ${R.length}   ·   column rank = ${piv.length}`, 'tl', { color: R.length === piv.length ? 'green' : 'red', weight: 700, size: 13 });
          TB.draw({ value: (i, j) => A[i][j], format: 2, fill: (i, j) => (piv.includes(j) ? ['green', 0.16] : null) });
          st = { d: R.length, r: piv.length, shape };
        });
        v.readout(() => st && String.raw`$\operatorname{range}T$ is ${st.shape}: the image of the sphere spans a space of dimension ${st.d}. Row reduction of $\mathcal M(T)$ finds ${st.r} pivot column${st.r === 1 ? '' : 's'}, so the column rank is ${st.r}. ${st.d === st.r ? 'Equal, as the theorem says.' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.81
    {
      num: '3.81',
      kind: 'Theorem',
      name: 'Matrix of product of linear maps (three bases)',
      statement: String.raw`Suppose $T\in\mathcal L(U,V)$ and $S\in\mathcal L(V,W)$. If $u_1,\dots,u_m$ is a basis of $U$, $v_1,\dots,v_n$ is a basis of $V$, and $w_1,\dots,w_p$ is a basis of $W$, then
$$\mathcal M\big(ST,(u_1,\dots,u_m),(w_1,\dots,w_p)\big)=\mathcal M\big(S,(v_1,\dots,v_n),(w_1,\dots,w_p)\big)\,\mathcal M\big(T,(u_1,\dots,u_m),(v_1,\dots,v_n)\big).$$`,
      idea: String.raw`This is 3.43 with the bases written out. The $k$-th column of the right side is $\mathcal M(S)$ times the $k$-th column of $\mathcal M(T)$, i.e. $\mathcal M(S)\mathcal M(Tu_k)=\mathcal M(S(Tu_k))$ by 3.76 — the $w$-coordinates of $(ST)u_k$, which is the $k$-th column of the left side. The middle basis $v$ appears in both factors and cancels.`,
      caption: String.raw`Three copies of $\mathbf R^2$ with their own bases: $x\in U$ (drag it), $Tx\in V$, $STx\in W$. Drag the middle basis $v_1,v_2$: both $\mathcal M(T)$ and $\mathcal M(S)$ change, but their product never does — it always equals $\mathcal M(ST)$, computed separately by expressing $STu_k$ in the basis $w$. Drag $w_1,w_2$ to change all three.`,
      deps: ['ladr-3.43', 'ladr-3.76'],
      tags: ['matrices'],
      viz(v) {
        const At = [[0.9, -0.55], [0.45, 0.8]], As = [[1, 0.6], [-0.25, 0.85]];
        const U1 = [1, 0.2], U2 = [0.25, 0.95];
        const mk = (title) => v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 280, minWidth: 230, title });
        const sU = mk(String.raw`$U$, basis $u$ $\;\xrightarrow{\;T\;}$`), sV = mk(String.raw`$V$, basis $v$ $\;\xrightarrow{\;S\;}$`), sW = mk(String.raw`$W$, basis $w$`);
        const x = sU.handle(1.2, 0.9, { color: 'gold', label: 'x' });
        const v1 = sV.handle(1, -0.3, { color: 'blue', label: 'v₁' }), v2 = sV.handle(0.3, 1, { color: 'orange', label: 'v₂' });
        const w1 = sW.handle(0.9, 0.35, { color: 'blue', label: 'w₁' }), w2 = sW.handle(-0.4, 0.9, { color: 'orange', label: 'w₂' });
        let st = null;
        v.render(() => {
          const X = hp(x), V1 = hp(v1), V2 = hp(v2), W1 = hp(w1), W2 = hp(w2), Tx = mv2(At, X), STx = mv2(As, Tx);
          const panels = [[sU, U1, U2, X, 'x', 'u'], [sV, V1, V2, Tx, 'Tx', 'v'], [sW, W1, W2, STx, 'STx', 'w']];
          let ok = true;
          for (const [s, b1, b2, p, name, bn] of panels) {
            skewGrid(s, b1, b2, { color: 'muted', n: 7, alpha: 0.16 });
            arr(s, b1, 'blue', s === sU ? 'u_1' : null, { off: 0.25 }); arr(s, b2, 'orange', s === sU ? 'u_2' : null, { off: 0.25 });
            arr(s, p, 'gold', name, { width: 2.6 });
            if (isBasis2(b1, b2)) s.tex(String.raw`${bc(coords2(b1, b2, p))}_{${bn}}`, -2.25, 2.25, { align: 'left', baseline: 'top', size: 14, color: 'ink' });
            else { ok = false; s.corner('not a basis', 'tl', { color: 'red', weight: 600 }); }
          }
          if (!ok) { st = null; return; }
          const Bu = cols2(U1, U2), Bv = cols2(V1, V2), Bw = cols2(W1, W2);
          const MT = matIn(At, Bu, Bv), MS = matIn(As, Bv, Bw), prod = mm2(MS, MT);
          const STu = [mv2(As, mv2(At, U1)), mv2(As, mv2(At, U2))].map((q) => coords2(W1, W2, q));
          const direct = [[STu[0][0], STu[1][0]], [STu[0][1], STu[1][1]]];
          st = { MT, MS, prod, direct };
        });
        v.readout(() => {
          if (!st) return 'Every panel needs a basis.';
          const { MT, MS, prod, direct } = st;
          return String.raw`$\mathcal M(S)\,\mathcal M(T)=${bm(MS)}${bm(MT)}=${bm(prod)}$ and, directly from $STu_1, STu_2$ in the basis $w$: $\mathcal M(ST)=${bm(direct)}$ (difference ${v.sci(maxDiff(prod, direct) + 1e-17, 1)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.82
    {
      num: '3.82',
      kind: 'Theorem',
      name: 'Matrix of identity operator with respect to two bases',
      statement: String.raw`Suppose $u_1,\dots,u_n$ and $v_1,\dots,v_n$ are bases of $V$. Then the matrices
$$\mathcal M\big(I,(u_1,\dots,u_n),(v_1,\dots,v_n)\big)\quad\text{and}\quad\mathcal M\big(I,(v_1,\dots,v_n),(u_1,\dots,u_n)\big)$$
are invertible, and each is the inverse of the other.`,
      idea: String.raw`Apply 3.81 to $I=I\cdot I$ with the bases $u,v,u$: $\mathcal M(I,(v),(u))\,\mathcal M(I,(u),(v))=\mathcal M(I,(u),(u))=I$, the identity matrix. Interchanging the roles of the two bases gives the product in the other order. So $\mathcal M(I,(u),(v))$ converts $u$-coordinates into $v$-coordinates, and the reverse conversion undoes it.`,
      caption: String.raw`Two bases of the same plane: $u$ (blue grid) and $v$ (orange grid) — drag any of the four basis vectors. The gold vector $x$ has a column in each basis (the two step paths). $\mathcal M(I,(u),(v))$, whose columns are the $v$-coordinates of $u_1,u_2$, converts the first column into the second; the reverse converter is its inverse, and their product is the identity.`,
      deps: ['ladr-3.81'],
      tags: ['change of basis'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 370, minWidth: 330, weight: 1.6 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, minWidth: 230 });
        const u1 = s.handle(1, 0, { color: 'blue', label: 'u₁' }), u2 = s.handle(0.3, 0.9, { color: 'teal', label: 'u₂' });
        const v1 = s.handle(0.8, -0.6, { color: 'orange', label: 'v₁' }), v2 = s.handle(0.7, 0.75, { color: 'pink', label: 'v₂' });
        const x = s.handle(1.8, 1.3, { color: 'gold', label: 'x' });
        const tb = (y0, y1) => v.table(sM, { rows: 2, cols: 2, region: [0.48, y0, 1, y1], maxCell: 46, size: 14 });
        const T1 = tb(0.68, 0.98), T2 = tb(0.36, 0.66), T3 = tb(0.04, 0.34);
        let st = null;
        v.render(() => {
          const U1 = hp(u1), U2 = hp(u2), V1 = hp(v1), V2 = hp(v2), X = hp(x);
          skewGrid(s, U1, U2, { color: 'blue', n: 9, alpha: 0.15 }); skewGrid(s, V1, V2, { color: 'orange', n: 9, alpha: 0.15 });
          const ok = isBasis2(U1, U2) && isBasis2(V1, V2);
          if (ok) {
            const cu = coords2(U1, U2, X), cv = coords2(V1, V2, X);
            stepPath(s, cu, U1, U2, 'blue', 'teal', { width: 2.6, alpha: 0.7, ticks: false });
            stepPath(s, cv, V1, V2, 'orange', 'pink', { width: 2.6, alpha: 0.7, ticks: false });
            const Cuv = mm2(inv2(cols2(V1, V2)), cols2(U1, U2)), Cvu = mm2(inv2(cols2(U1, U2)), cols2(V1, V2)), P = mm2(Cuv, Cvu);
            T1.draw({ value: (i, j) => Cuv[i][j], format: 2, fill: () => ['orange', 0.1] });
            T2.draw({ value: (i, j) => Cvu[i][j], format: 2, fill: () => ['blue', 0.1] });
            T3.draw({ value: (i, j) => P[i][j], format: 2, fill: (i, j) => ['green', i === j ? 0.3 : 0.1] });
            const lab = (t, y) => sM.tex(t, 0.02, y, { align: 'left', baseline: 'middle', size: 14, color: 'ink' });
            lab(String.raw`\mathcal M(I,(u),(v))`, 0.83); lab(String.raw`\mathcal M(I,(v),(u))`, 0.51); lab(String.raw`\text{their product}`, 0.19);
            st = { cu, cv, Cuv };
          } else { st = null; s.corner('one of the lists is not a basis', 'tl', { color: 'red', weight: 600 }); }
          [[U1, 'blue'], [U2, 'teal'], [V1, 'orange'], [V2, 'pink']].forEach(([p, c]) => arr(s, p, c, null, { width: 2.6 }));
          s.arrow(0, 0, X[0], X[1], { color: 'gold', width: 2.4 });
        });
        v.readout(() => {
          if (!st) return 'Both lists must be bases (no two parallel vectors).';
          const { cu, cv, Cuv } = st;
          return String.raw`$\mathcal M(I,(u),(v))\,\mathcal M(x,(u))=${bm(Cuv)}${bc(cu)}=${bc(mv2(Cuv, cu))}=\mathcal M(x,(v))$ (the $v$-coordinates, computed directly: $${bc(cv)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.84
    {
      num: '3.84',
      kind: 'Theorem',
      name: 'Change-of-basis formula',
      statement: String.raw`Suppose $T\in\mathcal L(V)$ and $u_1,\dots,u_n$ and $v_1,\dots,v_n$ are bases of $V$. Let
$$A=\mathcal M\big(T,(u_1,\dots,u_n)\big),\quad B=\mathcal M\big(T,(v_1,\dots,v_n)\big),\quad C=\mathcal M\big(I,(u_1,\dots,u_n),(v_1,\dots,v_n)\big).$$
Then $A=C^{-1}BC$.`,
      idea: String.raw`Write $T=I\,T\,I$ and apply 3.81 twice, routing through the basis $v$: $\mathcal M(T,(u))=\mathcal M(I,(v),(u))\,\mathcal M(T,(v))\,\mathcal M(I,(u),(v))$. The outer factors are $C^{-1}$ and $C$ by 3.82. In words: convert $u$-coordinates to $v$-coordinates, apply $T$ there, convert back.`,
      caption: String.raw`Left: the plane with the standard basis $u$ and the operator acting on the F-picture (it plays back and forth); the orange grid is a second basis $v$ — drag $v_1$, $v_2$. Right: the same vectors written in $v$-coordinates, where $T$ acts by $B$. The two pictures look different but describe one map: the F sits on the orange grid on the left exactly as it sits on the coordinate grid on the right. $C^{-1}BC$ is recomputed live and always equals $A$.`,
      deps: ['ladr-3.81', 'ladr-3.82'],
      tags: ['change of basis'],
      viz(v) {
        const OPS = { shear: [[1, 0.9], [0, 1]], rot: [[0, -1], [1, 0]], refl: [[1, 0], [0, -1]], stretch: [[1.6, 0], [0, 0.6]] };
        const op = v.select('$T$', [{ value: 'shear', label: 'shear' }, { value: 'rot', label: 'quarter turn' }, { value: 'refl', label: 'reflection' }, { value: 'stretch', label: 'stretch' }], 'shear');
        const mk = (title) => v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 330, minWidth: 260, title });
        const sV = mk(String.raw`$V$ in the standard basis $u$: $A$`), sC = mk(String.raw`$v$-coordinates: $B=\mathcal M(T,(v))$`);
        const v1 = sV.handle(0.9, 0.45, { color: 'orange', label: 'v₁' }), v2 = sV.handle(-0.35, 0.8, { color: 'pink', label: 'v₂' });
        let st = null;
        v.animate((t) => {
          const A = OPS[op.value], V1 = hp(v1), V2 = hp(v2), e = smooth(0.5 - 0.5 * Math.cos((Math.PI * t) / 2) - 0.0);
          skewGrid(sV, V1, V2, { color: 'orange', n: 9, alpha: 0.2 });
          arr(sV, V1, 'orange', null, { width: 2.6 }); arr(sV, V2, 'pink', null, { width: 2.6 });
          if (!isBasis2(V1, V2)) { st = null; sV.corner('v₁, v₂ not a basis', 'tl', { color: 'red', weight: 600 }); return; }
          const Bv = cols2(V1, V2), C = inv2(Bv), B = mm2(C, mm2(A, Bv)), back = mm2(inv2(C), mm2(B, C));
          const mor = (Mx) => FSH.map((p) => { const q = mv2(Mx, p); return add2(sc2(p, 1 - e), sc2(q, e)); });
          // V: the F, its image, the morph
          sV.poly(FSH, { color: 'muted', fill: false, width: 1, dash: [3, 3] });
          sV.poly(FSH.map((p) => mv2(A, p)), { color: 'green', fill: false, width: 1.2, dash: [5, 3] });
          sV.poly(mor(A), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.6 });
          // coordinates: the same, read in basis v
          for (let k = -6; k <= 6; k++) { sC.line(k, -6, k, 6, { color: 'orange', width: k ? 0.8 : 1.3, alpha: k ? 0.2 : 0.55 }); sC.line(-6, k, 6, k, { color: 'orange', width: k ? 0.8 : 1.3, alpha: k ? 0.2 : 0.55 }); }
          const Fc = FSH.map((p) => mv2(C, p));
          sC.poly(Fc, { color: 'muted', fill: false, width: 1, dash: [3, 3] });
          sC.poly(Fc.map((p) => mv2(B, p)), { color: 'green', fill: false, width: 1.2, dash: [5, 3] });
          sC.poly(Fc.map((p) => add2(sc2(p, 1 - e), sc2(mv2(B, p), e))), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.6 });
          arr(sC, [1, 0], 'orange', String.raw`\mathcal M(v_1)`, { off: 0.42, size: 13 }); arr(sC, [0, 1], 'pink', String.raw`\mathcal M(v_2)`, { off: 0.3, size: 13 });
          sV.tex(String.raw`A=${bm(A)}`, -2.5, 2.5, { align: 'left', baseline: 'top', size: 14, color: 'ink' });
          sC.tex(String.raw`B=${bm(B)}`, -2.5, 2.5, { align: 'left', baseline: 'top', size: 14, color: 'ink' });
          st = { A, B, C, back };
        }, { period: 4, autoplay: true });
        v.legend([['muted', 'the F', { dash: true }], ['green', 'its image under $T$', { dash: true }], ['accent', '$T$ being applied', { area: true }]]);
        v.readout(() => {
          if (!st) return 'Choose a basis $v$.';
          const { A, B, C, back } = st;
          return String.raw`$C=\mathcal M(I,(u),(v))=${bm(C)}$, $\;C^{-1}BC=${bm(back)}=A$ (difference ${v.sci(maxDiff(back, A) + 1e-17, 1)}). $A$ and $B$ are different matrices of the same operator.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.86
    {
      num: '3.86',
      kind: 'Theorem',
      name: 'Matrix of inverse equals inverse of matrix',
      statement: String.raw`Suppose $v_1,\dots,v_n$ is a basis of $V$ and $T\in\mathcal L(V)$ is invertible. Then $\mathcal M(T^{-1})=\big(\mathcal M(T)\big)^{-1}$, both matrices taken with respect to $v_1,\dots,v_n$.`,
      idea: String.raw`By 3.81, $\mathcal M(T^{-1})\,\mathcal M(T)=\mathcal M(T^{-1}T)=\mathcal M(I)=I$, and likewise $\mathcal M(T)\,\mathcal M(T^{-1})=I$. So $\mathcal M(T^{-1})$ is a two-sided inverse of $\mathcal M(T)$; inverses are unique (the matrix version of 3.60).`,
      caption: String.raw`$T$ (orange F) is applied to the blue F, and $T^{-1}$ brings it back exactly (green dashed). Drag the basis $v_1$, $v_2$: the matrices change but $\mathcal M(T^{-1})$ — computed from the map $T^{-1}$ itself — always equals the inverse of the matrix $\mathcal M(T)$. Slide the second stretch factor through $0$: $T$ flattens the picture onto a line, nothing can undo it, and $\mathcal M(T)$ has no inverse.`,
      deps: ['ladr-3.81', 'ladr-3.59'],
      tags: ['invertibility', 'matrices'],
      viz(v) {
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.4, 2.4], equal: true, height: 350, minWidth: 320, weight: 1.5 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, minWidth: 230 });
        const lam = v.slider(String.raw`second stretch factor $\lambda$ of $T$`, -1.4, 1.4, 0.6, { step: 0.01 });
        const P = [[1, 0.65], [-0.35, 1]];
        const v1 = s.handle(1, 0.2, { color: 'orange', label: 'v₁' }), v2 = s.handle(0.3, 1, { color: 'pink', label: 'v₂' });
        const tb = (y0, y1) => v.table(sM, { rows: 2, cols: 2, region: [0.5, y0, 1, y1], maxCell: 44, size: 14 });
        const T1 = tb(0.68, 0.98), T2 = tb(0.36, 0.66), T3 = tb(0.04, 0.34);
        let st = null;
        v.render(() => {
          const A = mm2(P, mm2([[1.35, 0], [0, lam.value]], inv2(P))), V1 = hp(v1), V2 = hp(v2), d = det2(A);
          skewGrid(s, V1, V2, { color: 'orange', n: 9, alpha: 0.15 });
          s.poly(FSH, { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1.4 });
          const TF = FSH.map((p) => mv2(A, p));
          s.poly(TF, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1.4 });
          arr(s, V1, 'orange', null, { width: 2.6 }); arr(s, V2, 'pink', null, { width: 2.6 });
          s.tex('F', 0.3, 0.75, { color: 'blue', size: 14 }); s.tex('T(F)', mv2(A, [0.6, 1.3])[0] + 0.25, mv2(A, [0.6, 1.3])[1] + 0.2, { color: 'orange', size: 14 });
          const lab = (t, y) => sM.tex(t, 0.02, y, { align: 'left', baseline: 'middle', size: 14, color: 'ink' });
          if (!isBasis2(V1, V2)) { st = null; s.corner('v₁, v₂ not a basis', 'tl', { color: 'red', weight: 600 }); return; }
          const Bv = cols2(V1, V2), MT = matIn(A, Bv, Bv);
          T1.draw({ value: (i, j) => MT[i][j], format: 2, fill: () => ['orange', 0.1] }); lab(String.raw`\mathcal M(T)`, 0.83);
          if (Math.abs(d) < 1e-6) {
            s.corner('T is not invertible: T(F) lies on a line', 'tl', { color: 'red', weight: 600 });
            T2.draw({ value: () => '—', fill: () => ['red', 0.1] }); lab(String.raw`\mathcal M(T)^{-1}`, 0.51);
            sM.text('det = 0: no inverse', 0.5, 0.19, { color: 'red', align: 'center', size: 13 });
            st = { sing: true, MT }; return;
          }
          const Ai = inv2(A), back = TF.map((p) => mv2(Ai, p));
          s.poly(back, { color: 'green', fill: false, width: 2, dash: [6, 4] });
          const MTi = matIn(Ai, Bv, Bv), MTinv = inv2(MT), Pr = mm2(MT, MTi);
          T2.draw({ value: (i, j) => MTi[i][j], format: 2, fill: () => ['green', 0.1] }); lab(String.raw`\mathcal M(T^{-1})`, 0.51);
          T3.draw({ value: (i, j) => Pr[i][j], format: 2, fill: (i, j) => ['green', i === j ? 0.3 : 0.08] }); lab(String.raw`\mathcal M(T)\mathcal M(T^{-1})`, 0.19);
          st = { MT, MTi, MTinv, d };
        });
        v.legend([['blue', 'F', { area: true }], ['orange', '$T(F)$', { area: true }], ['green', '$T^{-1}(T(F))$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.sing) return String.raw`$\lambda=0$: $\det\mathcal M(T)=0$, $T$ is not injective, and neither $T^{-1}$ nor $\mathcal M(T)^{-1}$ exists.`;
          const { MTi, MTinv } = st;
          return String.raw`$\mathcal M(T^{-1})=${bm(MTi)}$ (from the map $T^{-1}$) and $\mathcal M(T)^{-1}=${bm(MTinv)}$ (inverting the matrix): difference ${v.sci(maxDiff(MTi, MTinv) + 1e-17, 1)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.87
    {
      num: '3.87',
      kind: 'Definition',
      name: 'Product of vector spaces',
      statement: String.raw`Suppose $V_1,\dots,V_m$ are vector spaces over $\mathbf F$. The **product** $V_1\times\cdots\times V_m$ is the set of all lists $(v_1,\dots,v_m)$ with $v_k\in V_k$, with the componentwise operations
$$(u_1,\dots,u_m)+(v_1,\dots,v_m)=(u_1+v_1,\dots,u_m+v_m),\qquad\lambda(v_1,\dots,v_m)=(\lambda v_1,\dots,\lambda v_m).$$`,
      idea: String.raw`Each component lives in its own space and is added and scaled there, independently of the others. For $\mathbf R^2\times\mathbf R$ an element is a pair (an arrow in the plane, a number); stacking the coordinates turns it into a point $(x,y,t)$ of $\mathbf R^3$, and the componentwise operations become the usual ones of $\mathbf R^3$.`,
      caption: String.raw`An element of $\mathbf R^2\times\mathbf R$ is a pair: drag the arrows $a$, $b$ in the plane and the points $a$, $b$ on the number line. The animation adds (or scales) componentwise: $b$ slides to the tip of $a$ in each component separately. On the right the same pairs stacked as points $(x,y,t)\in\mathbf R^3$: the result is the ordinary vector sum there.`,
      deps: ['ladr-1.20'],
      tags: ['products'],
      viz(v) {
        const op = v.select('operation', [{ value: 'add', label: '$a+b$' }, { value: 'scale', label: '$\\lambda a$' }], 'add');
        const lam = v.slider('$\\lambda$', -2, 2, 1.6, { step: 0.05 });
        const sP = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 300, minWidth: 250, title: String.raw`first component, in $\mathbf R^2$` });
        const sS = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, minWidth: 250, title: String.raw`stacked: $(x,y,t)\in\mathbf R^3$` });
        const sc = v.scene3(sS, { yaw: -0.65, pitch: 0.3, axis: 1.7, lim: 2.2, labels: ['x', 'y', 't'] });
        const sL = v.stage({ x: [-3.2, 3.2], y: [-0.55, 0.55], height: 100, full: true, yticks: [], title: String.raw`second component, in $\mathbf R$` });
        const a1 = sP.handle(1.1, 0.5, { color: 'blue', label: 'a' }), b1 = sP.handle(-0.3, 1.1, { color: 'orange', label: 'b' });
        const a2 = sL.handle(0.9, 0.22, { color: 'blue', label: 'a', constrain: 'x' }), b2 = sL.handle(0.6, -0.22, { color: 'orange', label: 'b', constrain: 'x' });
        let st = null;
        v.animate((t) => {
          const e = smooth(((t % 4) - 0.4) / 1.6), add = op.value === 'add', L = lam.value;
          const A1 = hp(a1), B1 = hp(b1), A2 = a2.x, B2 = b2.x;
          const R1 = add ? add2(A1, B1) : sc2(A1, L), R2 = add ? A2 + B2 : L * A2;
          // plane component
          arr(sP, A1, 'blue', null, { width: 2.6 });
          if (add) {
            arr(sP, B1, 'orange', null, { width: 2.6 });
            const o = sc2(A1, e); sP.arrow(o[0], o[1], o[0] + B1[0], o[1] + B1[1], { color: 'orange', width: 2, dash: [5, 3] });
          } else sP.arrow(0, 0, A1[0] * (1 - e + e * L), A1[1] * (1 - e + e * L), { color: 'gold', width: 3 });
          if (e > 0.98) arr(sP, R1, 'green', add ? 'a+b' : '\\lambda a', { width: 3 });
          // line component
          sL.arrow(0, 0.22, A2, 0.22, { color: 'blue', width: 2.4, head: 8 });
          if (add) {
            sL.arrow(0, -0.22, B2, -0.22, { color: 'orange', width: 2.4, head: 8 });
            sL.arrow(A2 * e, -0.05, A2 * e + B2, -0.05, { color: 'orange', width: 1.8, dash: [5, 3], head: 7 });
          } else sL.arrow(0, -0.05, A2 * (1 - e + e * L), -0.05, { color: 'gold', width: 2.6, head: 8 });
          if (e > 0.98) { sL.dot(R2, -0.05, { r: 5, color: 'green' }); sL.tex(add ? 'a+b' : '\\lambda a', R2, -0.38, { color: 'green', align: 'center', size: 13 }); }
          // stacked
          const P = (u, s) => [u[0], u[1], s];
          sc.begin();
          sc.poly([[-1.6, -1.6, 0], [1.6, -1.6, 0], [1.6, 1.6, 0], [-1.6, 1.6, 0]], { fill: 'muted', fillAlpha: 0.05, color: 'muted', alpha: 0.25 });
          const pts = [[A1, A2, 'blue', 'a'], ...(add ? [[B1, B2, 'orange', 'b']] : []), ...(e > 0.98 ? [[R1, R2, 'green', add ? 'a+b' : '\\lambda a']] : [])];
          for (const [u, s, c, l] of pts) {
            sc.line(P(u, 0), P(u, s), { color: c, dash: [3, 3], alpha: 0.7 }, 1); sc.line(O3, P(u, 0), { color: c, alpha: 0.4, width: 1 }, 1);
            sc.arrow(O3, P(u, s), { color: c, width: 2.4 }); sc.tex(l, mul3(P(u, s), 1.12), { color: c, align: 'center', baseline: 'middle', size: 14 });
          }
          if (add) { const o = mul3(P(A1, A2), e); sc.arrow(o, add3(o, P(B1, B2)), { color: 'orange', width: 1.8, dash: [5, 3] }); }
          sc.flush();
          st = { A1, A2, B1, B2, R1, R2, add, L };
        }, { period: 4, autoplay: true });
        v.readout(() => {
          if (!st) return '';
          const { A1, A2, B1, B2, R1, R2, add, L } = st;
          return add
            ? String.raw`$a=(${vt(A1)},\,${tn(A2)})$, $b=(${vt(B1)},\,${tn(B2)})$, so $a+b=(${vt(R1)},\,${tn(R2)})$: plane parts add in $\mathbf R^2$, number parts in $\mathbf R$; stacked, $(${tn(R1[0])},${tn(R1[1])},${tn(R2)})$ is the sum in $\mathbf R^3$.`
            : String.raw`$\lambda a=${tn(L)}\cdot(${vt(A1)},\,${tn(A2)})=(${vt(R1)},\,${tn(R2)})$: each component is scaled in its own space.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.89
    {
      num: '3.89',
      kind: 'Theorem',
      name: 'Product of vector spaces is a vector space',
      statement: String.raw`If $V_1,\dots,V_m$ are vector spaces over $\mathbf F$, then $V_1\times\cdots\times V_m$, with the componentwise addition and scalar multiplication of 3.87, is a vector space over $\mathbf F$. Its additive identity is $(0,\dots,0)$ and the additive inverse of $(v_1,\dots,v_m)$ is $(-v_1,\dots,-v_m)$.`,
      idea: String.raw`Each axiom of 1.20, written out for lists, splits into the same axiom in every component, where it holds because each $V_k$ is a vector space. For example $(u_k)+(v_k)=(u_k+v_k)=(v_k+u_k)=(v_k)+(u_k)$ uses commutativity in each $V_k$ separately.`,
      caption: String.raw`Elements of $\mathcal P_1(\mathbf R)\times\mathbf R^2$ are pairs (a line graph, an arrow). Pick an axiom: its left side is drawn solid green, its right side dashed blue, each computed separately and componentwise. Drag the gold pair $u$ (two handles on its graph, one on its arrow) or resample $v$, $w$ and the scalars — the two sides always coincide in both components.`,
      deps: ['ladr-3.87'],
      tags: ['products'],
      viz(v) {
        const sP = v.stage({ x: [-2, 2], y: [-3, 3], height: 300, minWidth: 250, title: String.raw`first component, in $\mathcal P_1(\mathbf R)$` });
        const sA = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 300, minWidth: 250, title: String.raw`second component, in $\mathbf R^2$` });
        const AX = [
          ['comm', 'u+v=v+u'], ['assoc', '(u+v)+w=u+(v+w)'], ['zero', 'u+0=u'], ['inv', 'u+(-u)=0'],
          ['one', '1u=u'], ['mult', '(ab)u=a(bu)'], ['dist1', 'a(u+v)=au+av'], ['dist2', '(a+b)u=au+bu'],
        ];
        const ax = v.select('axiom', AX.map(([value, t]) => ({ value, label: `$${t}$` })), 'dist1');
        let seed = 7;
        v.button('Resample', () => seed++);
        const p0 = sP.handle(-1, 0.4, { color: 'gold', constrain: 'y', label: 'u' }), p1 = sP.handle(1, 1.6, { color: 'gold', constrain: 'y' });
        const ua = sA.handle(1.2, 0.6, { color: 'gold', label: 'u' });
        const add = (e, f) => ({ p: [e.p[0] + f.p[0], e.p[1] + f.p[1]], a: add2(e.a, f.a) });
        const mul = (k, e) => ({ p: [k * e.p[0], k * e.p[1]], a: sc2(e.a, k) });
        const Z = { p: [0, 0], a: [0, 0] };
        let st = null;
        v.render(() => {
          const r = v.M.rng(seed), rnd = () => ({ p: [r.uniform(-1.2, 1.2), r.uniform(-1, 1)], a: [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5)] });
          const u = { p: [(p0.y + p1.y) / 2, (p1.y - p0.y) / 2], a: hp(ua) }, vv = rnd(), w = rnd(), a = Math.round(r.uniform(-1.5, 1.8) * 10) / 10, b = Math.round(r.uniform(-1.5, 1.5) * 10) / 10;
          const k = ax.value;
          const sides = {
            comm: [add(u, vv), add(vv, u), [vv]], assoc: [add(add(u, vv), w), add(u, add(vv, w)), [vv, w]], zero: [add(u, Z), u, []],
            inv: [add(u, mul(-1, u)), Z, []], one: [mul(1, u), u, []], mult: [mul(a * b, u), mul(a, mul(b, u)), []],
            dist1: [mul(a, add(u, vv)), add(mul(a, u), mul(a, vv)), [vv]], dist2: [mul(a + b, u), add(mul(a, u), mul(b, u)), []],
          }[k];
          const [L, R, extra] = sides;
          const cols = ['purple', 'teal'];
          extra.forEach((e, i) => { sP.fn((x) => e.p[0] + e.p[1] * x, { color: cols[i], width: 1.4, alpha: 0.7 }); arr(sA, e.a, cols[i], i ? 'w' : 'v', { width: 1.8, alpha: 0.7 }); });
          sP.fn((x) => u.p[0] + u.p[1] * x, { color: 'gold', width: 1.6, alpha: 0.8 });
          sA.arrow(0, 0, u.a[0], u.a[1], { color: 'gold', width: 1.8, alpha: 0.8 });
          sP.fn((x) => L.p[0] + L.p[1] * x, { color: 'green', width: 5, alpha: 0.55 });
          sP.fn((x) => R.p[0] + R.p[1] * x, { color: 'accent', width: 2, dash: [6, 4] });
          sA.arrow(0, 0, L.a[0], L.a[1], { color: 'green', width: 5.5, alpha: 0.5, head: 13 });
          sA.arrow(0, 0, R.a[0], R.a[1], { color: 'accent', width: 2, dash: [6, 4] });
          const diff = Math.max(Math.abs(L.p[0] - R.p[0]), Math.abs(L.p[1] - R.p[1]), Math.abs(L.a[0] - R.a[0]), Math.abs(L.a[1] - R.a[1]));
          st = { L, R, diff, a, b, t: AX.find((q) => q[0] === k)[1] };
        });
        v.legend([['gold', '$u$'], ['purple', '$v$'], ['teal', '$w$'], ['green', 'left side'], ['accent', 'right side', { dash: true }]]);
        const ptex = (e) => String.raw`${tn(e.p[0])}${e.p[1] < 0 ? '-' : '+'}${tn(Math.abs(e.p[1]))}x`;
        v.readout(() => {
          if (!st) return '';
          const { L, R, diff, a, b, t } = st;
          return String.raw`$${t}$ with $a=${tn(a, 1)}$, $b=${tn(b, 1)}$: left side $=(${ptex(L)},\,${vt(L.a)})$, right side $=(${ptex(R)},\,${vt(R.a)})$; largest difference ${v.sci(diff + 1e-17, 1)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.92
    {
      num: '3.92',
      kind: 'Theorem',
      name: 'Dimension of a product is the sum of dimensions',
      statement: String.raw`Suppose $V_1,\dots,V_m$ are finite-dimensional vector spaces. Then $V_1\times\cdots\times V_m$ is finite-dimensional and
$$\dim(V_1\times\cdots\times V_m)=\dim V_1+\cdots+\dim V_m.$$`,
      idea: String.raw`Choose a basis of each $V_k$. Pad each basis vector with zeros in the other slots: a basis vector $b$ of $V_k$ becomes $(0,\dots,0,b,0,\dots,0)$. The resulting list, of length $\dim V_1+\cdots+\dim V_m$, spans the product (split any element into its components and expand each) and is linearly independent (a combination that vanishes vanishes in every slot, where the original bases are independent). So it is a basis (2.35 counts it).`,
      caption: String.raw`Choose up to three factors. Each row of the table is a padded basis vector of the product; the columns are the stacked coordinates, coloured by factor. The rows form a block-diagonal pattern of $1$s, so they are independent — their rank is computed live — and the dimension counters add up. Press Random element to expand an element of the product in this basis: its coefficients are just its stacked coordinates.`,
      deps: ['ladr-3.87', 'ladr-2.35'],
      tags: ['products', 'dimension'],
      viz(v) {
        const FAC = {
          none: { tex: '', b: [] }, R: { tex: '\\mathbf R', b: ['1'] }, R2: { tex: '\\mathbf R^2', b: ['e_1', 'e_2'] }, R3: { tex: '\\mathbf R^3', b: ['e_1', 'e_2', 'e_3'] },
          P1: { tex: '\\mathcal P_1', b: ['1', 'x'] }, P2: { tex: '\\mathcal P_2', b: ['1', 'x', 'x^2'] },
        };
        const opts = (none) => [...(none ? [{ value: 'none', label: '—' }] : []), { value: 'R', label: '$\\mathbf R$' }, { value: 'R2', label: '$\\mathbf R^2$' }, { value: 'R3', label: '$\\mathbf R^3$' }, { value: 'P1', label: '$\\mathcal P_1(\\mathbf R)$' }, { value: 'P2', label: '$\\mathcal P_2(\\mathbf R)$' }];
        const f1 = v.select('$V_1$', opts(false), 'R2'), f2 = v.select('$V_2$', opts(false), 'P1'), f3 = v.select('$V_3$', opts(true), 'none');
        let seed = 0;
        v.button('Random element', () => { seed++; });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420 });
        const T = v.table(s, { rows: 4, cols: 4, maxCell: 46, minCell: 22, size: 13, labelSize: 12, region: [0, 0, 1, 0.9] });
        const COL = ['blue', 'orange', 'purple'];
        let st = null;
        v.render(() => {
          const fs = [f1.value, f2.value, f3.value].map((k) => FAC[k]).filter((f) => f.b.length);
          const slots = []; fs.forEach((f, k) => f.b.forEach((name) => slots.push({ k, name })));
          const D = slots.length, m = fs.length;
          const rowTex = (i) => { const { k, name } = slots[i]; return '$(' + fs.map((_, q) => (q === k ? name : '0')).join(',') + ')$'; };
          const r = v.M.rng(seed + 1), el = slots.map(() => Math.round(r.uniform(-3, 3)));
          const rows = D + (seed ? 1 : 0);
          T.draw({
            rows, cols: D, value: (i, j) => (i < D ? (i === j ? 1 : 0) : el[j]),
            rowLabels: (i) => (i < D ? rowTex(i) : 'element'), colLabels: (j) => `$${slots[j].name}$`,
            colLabelColor: (j) => COL[slots[j].k], rowLabelColor: (i) => (i < D ? COL[slots[i].k] : 'gold'),
            fill: (i, j) => (i < D ? (slots[i].k === slots[j].k ? [COL[slots[i].k], i === j ? 0.32 : 0.1] : null) : ['gold', 0.18]),
            textColor: (i, j) => (i < D && i !== j ? 'faint' : 'ink'), weight: (i, j) => (i === j || i >= D ? 700 : 400),
          });
          const dims = fs.map((f) => f.b.length), M = slots.map((_, i) => slots.map((__, j) => (i === j ? 1 : 0)));
          const name = fs.map((f) => f.tex + (f.tex[0] === '\\' && f.tex.includes('P') ? '(\\mathbf R)' : '')).join('\\times ');
          s.tex(String.raw`\dim(${name}) = ${dims.join('+')} = ${D}`, 0.5, 0.96, { align: 'center', baseline: 'middle', size: 17, color: 'ink' });
          st = { dims, D, rank: v.M.rank(M), el, slots, fs, m, name };
        });
        v.readout(() => {
          if (!st) return '';
          const { dims, D, rank, el, slots, fs, name } = st;
          let s = String.raw`The ${D} padded basis vectors are independent (rank ${rank}) and span, so $\dim(${name})=${dims.join('+')}=${D}$.`;
          if (seed) {
            const comp = fs.map((f, k) => {
              const cs = slots.map((q, j) => [q, el[j]]).filter(([q]) => q.k === k);
              const nm = f.tex.startsWith('\\mathcal');
              return nm ? cs.map(([q, c]) => `${c}${q.name === '1' ? '' : q.name}`).join('+').replace(/\+-/g, '-') : `(${cs.map(([, c]) => c).join(',')})`;
            });
            s += String.raw` The element $(${comp.join(',\\;')})$ has coefficients $${el.join(',\\,')}$ — its stacked coordinates.`;
          }
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 3.93
    {
      num: '3.93',
      kind: 'Theorem',
      name: 'Products and direct sums',
      statement: String.raw`Suppose $V_1,\dots,V_m$ are subspaces of $V$. Define the linear map $\Gamma:V_1\times\cdots\times V_m\to V_1+\cdots+V_m$ by
$$\Gamma(v_1,\dots,v_m)=v_1+\cdots+v_m.$$
Then $V_1+\cdots+V_m$ is a direct sum if and only if $\Gamma$ is injective.`,
      idea: String.raw`$\Gamma$ is linear and, by the definition of the sum, surjective. It is injective exactly when $\operatorname{null}\Gamma=\{0\}$ (3.15), i.e. when $v_1+\cdots+v_m=0$ with $v_k\in V_k$ forces every $v_k=0$ — which is the criterion 1.45 for the sum to be direct. A nonzero null vector of $\Gamma$ is a closed loop $v_1,v_2,\dots,v_m$ of vectors, one from each $V_k$, adding to $0$.`,
      caption: String.raw`Left: three lines $V_k=\operatorname{span}(a_k)$ in $\mathbf R^3$ (drag the tips; $a_3$ snaps into the plane of $a_1,a_2$ when close). Right: the product $V_1\times V_2\times V_3$, an element being a triple $(t_1a_1,t_2a_2,t_3a_3)$, i.e. a point $t$. Drag $t$: its image $\Gamma(t)$ is drawn on the left as a path of three arrows. When the lines are coplanar the sum is not direct: $\operatorname{null}\Gamma$ appears as a red line on the right, and for $t$ on it (it snaps) the path closes up at $0$.`,
      deps: ['ladr-3.87', 'ladr-3.15', 'ladr-1.45'],
      tags: ['products', 'direct sums'],
      viz(v) {
        const M = v.M;
        const S1 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, minWidth: 270, title: String.raw`$V=\mathbf R^3$, $V_k=\operatorname{span}(a_k)$` });
        const S2 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, minWidth: 270, title: String.raw`$V_1\times V_2\times V_3$: points $t=(t_1,t_2,t_3)$` });
        const sc1 = v.scene3(S1, { yaw: -0.6, pitch: 0.32, axis: 1.5, lim: 1.5 });
        const sc2_ = v.scene3(S2, { yaw: -0.6, pitch: 0.32, axis: 1.5, lim: 1.5, labels: ['t₁', 't₂', 't₃'], hint: false });
        const C = ['blue', 'orange', 'purple'];
        const PRE = { direct: [[1.1, 0.1, -0.1], [0.2, 1.1, 0.1], [0.1, 0.3, 1.1]], plane: [[1.1, 0.1, -0.1], [0.2, 1.1, 0.1], [0.8, -0.6, -0.12]] };
        const H = [];
        const big = (p) => (len3(p) < 0.35 ? mul3(unit3(p.some((q) => q) ? p : [1, 0, 0]), 0.35) : p);
        const snapA = (p, i) => {
          p = big(p);
          if (i === 2) { const B = orth([H[0].p, H[1].p]); if (B.length === 2) { const q = proj3(p, B); if (len3(sub3(p, q)) < 0.13) return big(q); } }
          if (i === 1) { const e = unit3(H[0].p), q = mul3(e, dot3(p, e)); if (len3(sub3(p, q)) < 0.1) return big(q); }
          return p;
        };
        PRE.direct.forEach((p, i) => H.push(sc1.handle(p, { color: C[i], label: `a${SUBS[i]}`, snap: (q) => snapA(q, i) })));
        let ker = [];
        const th = sc2_.handle([0.9, 0.6, -0.5], {
          color: 'gold', label: 't',
          snap: (p) => { if (ker.length === 1) { const q = mul3(ker[0], dot3(p, ker[0])); if (len3(sub3(p, q)) < 0.18) return q; } return p; },
        });
        v.select('lines', [{ value: 'direct', label: 'independent' }, { value: 'plane', label: 'coplanar' }], 'direct', { onChange: (k) => PRE[k].forEach((p, i) => H[i].set(p)) });
        let st = null;
        v.render(() => {
          const a = H.map((h) => h.p), A = [0, 1, 2].map((r) => a.map((c) => c[r])), t = th.p;
          ker = M.nullspace(A, 1e-7);
          const G = M.matVec(A, t);
          sc1.begin();
          a.forEach((c, i) => { const e = unit3(c); sc1.line(mul3(e, -1.7), mul3(e, 1.7), { color: C[i], width: 3, alpha: 0.35 }, 10); sc1.arrow(O3, c, { color: C[i], width: 1.6, alpha: 0.6 }); });
          let p = O3.slice();
          a.forEach((c, i) => { const q = add3(p, mul3(c, t[i])); sc1.arrow(p, q, { color: C[i], width: 3.2 }); p = q; });
          if (len3(G) > 0.03) sc1.arrow(O3, G, { color: 'green', width: 2.4 });
          sc1.dot(G, { r: 5, color: len3(G) < 1e-6 ? 'red' : 'green' });
          if (ker.length) {
            const k = ker[0], s = 1.3 / Math.max(...a.map((c, i) => len3(c) * Math.abs(k[i])), 1e-9) * 0.6;
            let q = O3.slice(); a.forEach((c, i) => { const r = add3(q, mul3(c, k[i] * s)); sc1.line(q, r, { color: 'red', width: 1.6, dash: [4, 3] }, 1); q = r; });
          }
          sc1.flush();
          S1.corner(ker.length ? 'not direct: null Γ ≠ {0}' : 'direct: Γ is injective', 'tl', { color: ker.length ? 'red' : 'green', weight: 700 });
          sc2_.begin();
          if (ker.length === 1) sc2_.line(mul3(ker[0], -1.9), mul3(ker[0], 1.9), { color: 'red', width: 4, alpha: 0.7 }, 12);
          else if (ker.length === 2) sc2_.disc(ker[0], ker[1], 1.6, { fill: 'red', color: 'red', fillAlpha: 0.12 });
          sc2_.dot(O3, { r: 4, color: 'ink' });
          sc2_.line([t[0], 0, 0], [t[0], t[1], 0], { color: 'faint', dash: [3, 3] }, 1); sc2_.line([t[0], t[1], 0], t, { color: 'faint', dash: [3, 3] }, 1);
          sc2_.arrow(O3, t, { color: 'gold', width: 2.4 });
          sc2_.flush();
          st = { G, t, ker };
        });
        v.legend([['green', '$\\Gamma(t)=t_1a_1+t_2a_2+t_3a_3$'], ['red', '$\\operatorname{null}\\Gamma$ (a closed loop)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { G, t, ker } = st;
          const head = String.raw`$\Gamma(t)=${tn(t[0])}a_1+${tn(t[1])}a_2+${tn(t[2])}a_3=${vt(G)}$. `;
          if (!ker.length) return head + String.raw`$\operatorname{null}\Gamma=\{0\}$: the only way to reach $0$ is $t=0$, so $\Gamma$ is injective and $V_1+V_2+V_3$ is direct.`;
          const k = ker[0];
          return head + String.raw`$\Gamma(${vt(k)})=0$ although $(${tn(k[0])}a_1,${tn(k[1])}a_2,${tn(k[2])}a_3)\ne0$: $\Gamma$ is not injective and the sum is not direct.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.94
    {
      num: '3.94',
      kind: 'Theorem',
      name: 'A sum is direct iff dimensions add up',
      statement: String.raw`Suppose $V$ is finite-dimensional and $V_1,\dots,V_m$ are subspaces of $V$. Then $V_1+\cdots+V_m$ is a direct sum if and only if
$$\dim(V_1+\cdots+V_m)=\dim V_1+\cdots+\dim V_m .$$`,
      idea: String.raw`The map $\Gamma$ of 3.93 is surjective onto $V_1+\cdots+V_m$, so the fundamental theorem of linear maps (3.21) gives $\dim(V_1\times\cdots\times V_m)=\dim\operatorname{null}\Gamma+\dim(V_1+\cdots+V_m)$. The left side is $\dim V_1+\cdots+\dim V_m$ by 3.92. So the dimensions add up exactly when $\operatorname{null}\Gamma=\{0\}$, i.e. (3.93) exactly when the sum is direct. The deficit is the dimension of $\operatorname{null}\Gamma$.`,
      caption: String.raw`Choose each $V_k$: $\{0\}$, a line (drag its direction) or a plane (drag its normal, the short dashed arrow). Directions snap into nearby planes and normals snap to nearby configurations so that special positions are easy to reach. The bars compare $\sum\dim V_k$ (stacked) with $\dim(V_1+V_2+V_3)$: the light turns green exactly when they agree. Two planes in $\mathbf R^3$ can never be direct; a line inside a plane neither.`,
      deps: ['ladr-3.93', 'ladr-3.21', 'ladr-3.92'],
      tags: ['direct sums', 'dimension'],
      viz(v) {
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, minWidth: 300, weight: 1.6 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.36, axis: 1.5, lim: 1.4 });
        const sB = v.stage({ x: [-0.3, 3.3], y: [-0.7, 4.6], axes: false, height: 380, minWidth: 200, title: 'dimensions' });
        const C = ['blue', 'orange', 'purple'];
        const TY = [['0', '$\\{0\\}$'], ['1', 'line'], ['2', 'plane']].map(([value, label]) => ({ value, label }));
        const ty = [v.select('$V_1$', TY, '2'), v.select('$V_2$', TY, '1'), v.select('$V_3$', TY, '1')];
        const H = [];
        const basisOf = (i) => {
          const k = +ty[i].value, p = unit3(H[i].p);
          return k === 0 ? [] : k === 1 ? [p] : perp3([p]);
        };
        const snap = (q, i) => {
          if (len3(q) < 0.3) q = mul3(unit3(q.some((x) => x) ? q : [0, 0, 1]), 0.3);
          const n = unit3(q), L = len3(q), k = +ty[i].value;
          for (let j = 0; j < 3; j++) {
            if (j === i || ty[j].value === '0') continue;
            const kj = +ty[j].value, o = unit3(H[j].p);
            if (k === kj) { const c = dot3(n, o); if (Math.abs(Math.abs(c) - 1) < 0.012) return mul3(o, Math.sign(c) * L); }
            if (k !== kj) { const c = dot3(n, o); if (Math.abs(c) < 0.11) return mul3(unit3(sub3(n, mul3(o, c))), L); }
          }
          return q;
        };
        [[0.15, 0.2, 1], [1, 0.3, 0.5], [-0.4, 1, 0.35]].forEach((p, i) => H.push(sc.handle(p, { color: C[i], label: `${['n', 'a', 'a'][i]}${SUBS[i]}`, snap: (q) => snap(q, i) })));
        let st = null;
        v.render(() => {
          const Bs = [0, 1, 2].map(basisOf), dims = Bs.map((b) => b.length), sum = orth(Bs.flat()), ds = sum.length, tot = dims[0] + dims[1] + dims[2];
          sc.begin();
          Bs.forEach((B, i) => {
            const k = dims[i]; H[i].h.visible = k > 0; H[i].h.label = k === 2 ? `n${SUBS[i]}` : `a${SUBS[i]}`;
            if (k === 2) { sc.disc(B[0], B[1], 1.35, { fill: C[i], color: C[i], fillAlpha: 0.12, alpha: 0.6, grid: true }); sc.line(O3, H[i].p, { color: C[i], dash: [3, 3], width: 1.4 }, 1); }
            if (k === 1) { sc.line(mul3(B[0], -1.6), mul3(B[0], 1.6), { color: C[i], width: 4, alpha: 0.65 }, 12); }
          });
          sc.dot(O3, { r: 3.5, color: 'ink' });
          if (ds === 3) cubeEdges(sc, 1.25, 'green');
          sc.flush();
          const ok = ds === tot;
          S.corner(ok ? '● direct sum' : '● not direct', 'tl', { color: ok ? 'green' : 'red', weight: 700, size: 14 });
          // bars
          for (let k = 0; k <= 6; k++) { sB.line(0.2, k * 0.6, 3.1, k * 0.6, { color: 'grid', width: 1 }); sB.text(String(k), 0.05, k * 0.6, { color: 'muted', size: 11, align: 'right', baseline: 'middle' }); }
          let y = 0;
          dims.forEach((d, i) => { if (d) { sB.rect(0.5, y, 1.4, y + d * 0.6, { fill: C[i], fillAlpha: 0.55, color: C[i] }); sB.text(`dim V${SUBS[i]}`, 0.95, y + d * 0.3, { color: 'ink', size: 11, align: 'center', baseline: 'middle' }); } y += d * 0.6; });
          sB.rect(1.9, 0, 2.8, ds * 0.6, { fill: ok ? 'green' : 'red', fillAlpha: 0.5, color: ok ? 'green' : 'red' });
          sB.tex('\\textstyle\\sum\\dim V_k', 0.95, -0.35, { align: 'center', size: 12, color: 'ink' });
          sB.tex('\\dim\\textstyle\\sum V_k', 2.35, -0.35, { align: 'center', size: 12, color: 'ink' });
          st = { dims, ds, tot, ok };
        });
        v.readout(() => {
          if (!st) return '';
          const { dims, ds, tot, ok } = st;
          return String.raw`$\dim V_1+\dim V_2+\dim V_3=${dims.join('+')}=${tot}$ and $\dim(V_1+V_2+V_3)=${ds}$. ` + (ok
            ? 'They agree: the sum is direct.'
            : String.raw`The deficit ${tot - ds} $=\dim\operatorname{null}\Gamma$: some nonzero choice of $v_k\in V_k$ adds to $0$, so the sum is not direct.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.99
    {
      num: '3.99',
      kind: 'Definition',
      name: 'Quotient space V/U',
      statement: String.raw`Suppose $U$ is a subspace of $V$. For $v\in V$, the **translate** $v+U=\{v+u:u\in U\}$. The **quotient space** $V/U$ is the set of all translates of $U$:
$$V/U=\{v+U:\ v\in V\}.$$`,
      idea: String.raw`Each translate is a copy of $U$ shifted off the origin — a line or plane parallel to $U$ (an affine subset). Different $v$ can name the same translate: $v+U=v'+U$ when $v'-v\in U$. So an element of $V/U$ is a whole parallel copy of $U$, and it can be recorded by where it crosses a fixed complement of $U$.`,
      caption: String.raw`$V=\mathbf R^3$; choose $U$ (blue). Drag $v$ (orange): the translate $v+U$ moves with it, one of the family of parallel copies (faint). Moving $v$ *along* $U$ changes $v$ but not $v+U$ — watch the green crossing point with the complement (dashed green), which labels the element of $V/U$. With $U=\{0\}$ the translates are points; with $U=\mathbf R^3$ there is only one.`,
      deps: ['ladr-1.33'],
      tags: ['quotients'],
      viz(v) {
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 400, minWidth: 320 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.42, axis: 1.5, lim: 1.4 });
        const kind = v.select('$U$', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: 'a line' }, { value: '2', label: 'a plane' }, { value: '3', label: '$\\mathbf R^3$' }], '1');
        const UB = { 0: [], 1: [unit3([1, 0.5, 0.35])], 2: orth([[1, 0, 0.12], [0.15, 1, -0.1]]), 3: orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) };
        const vh = sc.handle([0.3, -0.7, 0.8], { color: 'orange', label: 'v' });
        let st = null;
        v.render(() => {
          const k = +kind.value, B = UB[k], W = perp3(B), p = vh.p, c = proj3(p, W);
          sc.begin();
          // the complement (where translates are recorded)
          if (W.length === 1) sc.line(mul3(W[0], -1.7), mul3(W[0], 1.7), { color: 'green', dash: [5, 4], width: 1.6 }, 1);
          if (W.length === 2) sc.disc(W[0], W[1], 1.5, { fill: 'green', color: 'green', fillAlpha: 0.04, alpha: 0.4, grid: false });
          // family of parallel translates
          const offs = W.length === 1 ? [-1.1, -0.55, 0.55, 1.1].map((s) => mul3(W[0], s))
            : W.length === 2 ? [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 1.2], [1.2, 0], [0, -1.2], [-1.2, 0]].map(([a, b]) => add3(mul3(W[0], a * 0.8), mul3(W[1], b * 0.8))) : [];
          if (k === 1) offs.forEach((o) => sc.line(add3(o, mul3(B[0], -1.5)), add3(o, mul3(B[0], 1.5)), { color: 'orange', width: 1, alpha: 0.28 }, 6));
          if (k === 2) offs.forEach((o) => sc.disc(B[0], B[1], 1.15, { fill: 'orange', color: 'orange', fillAlpha: 0.03, alpha: 0.25 }, o));
          if (k === 0) { const r = v.M.rng(2); for (let i = 0; i < 40; i++) sc.dot([r.uniform(-1.3, 1.3), r.uniform(-1.3, 1.3), r.uniform(-1.3, 1.3)], { r: 1.6, color: 'orange', alpha: 0.35, top: false }); }
          // U and v + U
          if (k < 3) drawSub(sc, B, 'blue', { r: 1.45, width: 4, fillAlpha: 0.12 });
          if (k === 1) sc.line(add3(c, mul3(B[0], -1.7)), add3(c, mul3(B[0], 1.7)), { color: 'orange', width: 4, alpha: 0.85 }, 12);
          if (k === 2) sc.disc(B[0], B[1], 1.45, { fill: 'orange', color: 'orange', fillAlpha: 0.16, alpha: 0.8, grid: true }, c);
          if (k === 3) cubeEdges(sc, 1.3, 'orange');
          sc.arrow(O3, p, { color: 'orange', width: 2 });
          if (k === 1 || k === 2) {
            for (const s of [-0.8, 0.8]) { const q = add3(p, mul3(B[0], s)); sc.dot(q, { r: 3.5, color: 'orange' }); }
            sc.dot(c, { r: 6, color: 'green' });
            sc.line(p, c, { color: 'muted', dash: [2, 3], width: 1 }, 1);
          }
          sc.flush();
          st = { k, p, c };
        });
        v.legend([['blue', '$U$'], ['orange', '$v+U$'], ['green', 'complement: one crossing per translate', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, p, c } = st;
          if (k === 0) return String.raw`$U=\{0\}$: $v+U=\{v\}=\{${vt(p)}\}$ — every vector is its own translate, and $V/U$ is a copy of $V$.`;
          if (k === 3) return String.raw`$U=\mathbf R^3$: $v+U=\mathbf R^3$ for every $v$, so $V/U$ has a single element.`;
          return String.raw`$v=${vt(p)}$ and $v+U=c+U$ with $c=${vt(c)}$ on the complement (the small dots $v\pm0.8u$ name the same translate). Slide $v$ parallel to $U$: $c$ does not move.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.101
    {
      num: '3.101',
      kind: 'Theorem',
      name: 'Two translates of a subspace are equal or disjoint',
      statement: String.raw`Suppose $U$ is a subspace of $V$ and $v,w\in V$. Then the following are equivalent:
(a) $v-w\in U$;
(b) $v+U=w+U$;
(c) $(v+U)\cap(w+U)\ne\varnothing$.`,
      idea: String.raw`(a)⇒(b): if $v-w\in U$, then $v+u=w+\big((v-w)+u\big)\in w+U$ for each $u\in U$, so $v+U\subseteq w+U$, and symmetrically. (b)⇒(c): translates are never empty ($v\in v+U$). (c)⇒(a): if $v+u_1=w+u_2$ then $v-w=u_2-u_1\in U$ because $U$ is closed under subtraction (1.34). So translates of $U$ partition $V$.`,
      caption: String.raw`$U$ is the blue line (drag $u$ to turn it). Drag $v$ and $w$: the lines $v+U$ (orange) and $w+U$ (purple) are parallel. The gold arrow is $v-w$, also copied at the origin. The three conditions are tested separately and always light up together: either $v-w$ lies on $U$ and the lines coincide (green — $w$ snaps onto $v+U$ when close), or they are disjoint parallels at a positive distance.`,
      deps: ['ladr-3.99', 'ladr-1.34'],
      tags: ['quotients'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380 });
        const uh = s.handle(1.3, 0.5, { color: 'blue', label: 'u' });
        const vh = s.handle(-0.9, 1.1, { color: 'orange', label: 'v' });
        const wh = s.handle(1.1, -0.7, {
          color: 'purple', label: 'w',
          constrain: (x, y) => {
            const u = hp(uh), l = Math.hypot(...u); if (l < 1e-6) return [x, y];
            const e = [u[0] / l, u[1] / l], d = sub2([x, y], hp(vh)), off = d[0] * e[1] - d[1] * e[0];
            return Math.abs(off) < 0.12 ? add2(hp(vh), sc2(e, d[0] * e[0] + d[1] * e[1])) : [x, y];
          },
        });
        let st = null;
        v.render(() => {
          const u = hp(uh), V = hp(vh), W = hp(wh), l = Math.hypot(...u);
          if (l < 0.05) { s.corner('u = 0: U = {0}', 'tl', { color: 'muted' }); }
          const e = l > 1e-9 ? [u[0] / l, u[1] / l] : [1, 0], L = 9;
          const d = sub2(V, W), off = (d[0] * e[1] - d[1] * e[0]);
          // (a) v−w ∈ U: is v−w a multiple of u?   (b) equal sets: does w+U contain both v and v+u?   (c) intersect: solve v + s u = w + t u
          const tol = 1e-9 * (1 + Math.hypot(...d));
          const a = Math.abs(off) <= tol;
          const onW = (P) => Math.abs((P[0] - W[0]) * e[1] - (P[1] - W[1]) * e[0]) <= tol;
          const b = onW(V) && onW(add2(V, u));
          const Mx = [[u[0], -u[0]], [u[1], -u[1]]], rhs = sub2(W, V), sol = v.M.lstsq(Mx, rhs), res = Math.hypot(...sub2(mv2(Mx, sol), rhs));
          const c = res <= 1e-7 * (1 + Math.hypot(...rhs));
          s.line(-L * e[0], -L * e[1], L * e[0], L * e[1], { color: 'blue', width: 2.5, alpha: 0.8 });
          if (a) s.line(V[0] - L * e[0], V[1] - L * e[1], V[0] + L * e[0], V[1] + L * e[1], { color: 'green', width: 5, alpha: 0.7 });
          else {
            s.line(V[0] - L * e[0], V[1] - L * e[1], V[0] + L * e[0], V[1] + L * e[1], { color: 'orange', width: 2.5 });
            s.line(W[0] - L * e[0], W[1] - L * e[1], W[0] + L * e[0], W[1] + L * e[1], { color: 'purple', width: 2.5 });
            const f = add2(W, sc2(e, d[0] * e[0] + d[1] * e[1]));
            s.measure(f[0], f[1], V[0], V[1], `${v.fix(Math.abs(off), 2)}`);
          }
          s.arrow(W[0], W[1], V[0], V[1], { color: 'gold', width: 2, dash: [5, 3] });
          s.arrow(0, 0, d[0], d[1], { color: 'gold', width: 2.4 });
          s.tex('v-w', d[0] * 1.08 + 0.2, d[1] * 1.08 + 0.15, { color: 'gold', size: 14 });
          s.arrow(0, 0, u[0], u[1], { color: 'blue', width: 2.4 });
          const lamp = (ok, t) => `${ok ? '●' : '○'} ${t}`;
          s.corner(lamp(a, 'v − w ∈ U'), 'tl', { color: a ? 'green' : 'red', weight: 600 });
          s.textPx(lamp(b, 'v + U = w + U'), 10, 38, { color: b ? 'green' : 'red', weight: 600, size: 12 });
          s.textPx(lamp(c, '(v + U) ∩ (w + U) ≠ ∅'), 10, 56, { color: c ? 'green' : 'red', weight: 600, size: 12 });
          st = { a, b, c, dist: Math.abs(off) };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, c, dist } = st;
          return a && b && c ? String.raw`All three hold: $v-w\in U$, the translates are the same line, and of course they meet.`
            : !a && !b && !c ? String.raw`All three fail: $v-w\notin U$, and $v+U$, $w+U$ are distinct parallel lines at distance ${v.fix(dist, 3)} — disjoint.`
              : 'The conditions disagree (this should never happen).';
        });
      },
    },
    // ------------------------------------------------------------------ 3.103
    {
      num: '3.103',
      kind: 'Theorem',
      name: 'Quotient space is a vector space',
      statement: String.raw`Suppose $U$ is a subspace of $V$. Then $V/U$, with the operations
$$(v+U)+(w+U)=(v+w)+U,\qquad\lambda(v+U)=(\lambda v)+U,$$
is a vector space. Its additive identity is $0+U=U$ and the additive inverse of $v+U$ is $(-v)+U$.`,
      idea: String.raw`The real issue is that the operations are *well defined*: a translate has many names. If $v+U=v'+U$ and $w+U=w'+U$, then $v-v'$ and $w-w'$ lie in $U$ (3.101), hence so do $(v+w)-(v'+w')$ and $\lambda v-\lambda v'$, so $(v+w)+U=(v'+w')+U$ and $\lambda v+U=\lambda v'+U$ — by 3.101 again. Once the operations make sense, each axiom for $V/U$ follows from the same axiom in $V$.`,
      caption: String.raw`$U$ is the blue line; the classes $v+U$ (orange) and $w+U$ (purple) are set by the handles $v$, $w$. The representatives $v'$, $w'$ (dots) keep sliding along their lines on their own; their sum $v'+w'$ (green dot, with its trail) never leaves the single line $(v+w)+U$. Switch to scalar multiplication: $\lambda v'$ stays on $\lambda v+U$. The numbers on the right are the signed offsets across $U$, which add and scale like real numbers.`,
      deps: ['ladr-3.101'],
      tags: ['quotients'],
      viz(v) {
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.6, 2.6], equal: true, height: 380 });
        const op = v.select('operation', [{ value: 'add', label: '$(v+U)+(w+U)$' }, { value: 'scale', label: '$\\lambda(v+U)$' }], 'add');
        const lam = v.slider('$\\lambda$', -2, 2, 1.5, { step: 0.05 });
        const e = [Math.cos(0.38), Math.sin(0.38)], nrm = [-e[1], e[0]];
        const vh = s.handle(-0.6, 0.6, { color: 'orange', label: 'v' }), wh = s.handle(0.4, -1.2, { color: 'purple', label: 'w' });
        const off = (p) => p[0] * nrm[0] + p[1] * nrm[1];
        let trail = [], lastKey = '', st = null;
        v.animate((t) => {
          const V = hp(vh), W = hp(wh), add = op.value === 'add', L = lam.value;
          const key = [V, W, add, L].join();
          if (key !== lastKey) { trail = []; lastKey = key; }
          const s1 = 1.5 * Math.sin(0.9 * t), s2 = 1.2 * Math.sin(1.4 * t + 1);
          const Vp = add2(V, sc2(e, s1)), Wp = add2(W, sc2(e, s2));
          const R = add ? add2(Vp, Wp) : sc2(Vp, L), Rc = add ? add2(V, W) : sc2(V, L);
          trail.push(R); if (trail.length > 160) trail.shift();
          const line = (P, st2) => s.line(P[0] - 9 * e[0], P[1] - 9 * e[1], P[0] + 9 * e[0], P[1] + 9 * e[1], st2);
          line([0, 0], { color: 'blue', width: 2, alpha: 0.7 });
          line(V, { color: 'orange', width: 2.2 });
          if (add) line(W, { color: 'purple', width: 2.2 });
          line(Rc, { color: 'green', width: 4.5, alpha: 0.55 });
          s.path(trail, { color: 'green', width: 2, alpha: 0.8 });
          s.arrow(0, 0, Vp[0], Vp[1], { color: 'orange', width: 1.6, alpha: 0.8 });
          if (add) { s.arrow(0, 0, Wp[0], Wp[1], { color: 'purple', width: 1.6, alpha: 0.8 }); s.line(Vp[0], Vp[1], R[0], R[1], { color: 'purple', dash: [4, 3], alpha: 0.7 }); s.line(Wp[0], Wp[1], R[0], R[1], { color: 'orange', dash: [4, 3], alpha: 0.7 }); }
          s.dot(Vp[0], Vp[1], { r: 5, color: 'orange', label: "v'", labelPos: 'nw' });
          if (add) s.dot(Wp[0], Wp[1], { r: 5, color: 'purple', label: "w'", labelPos: 'se' });
          s.dot(R[0], R[1], { r: 6, color: 'green', label: add ? "v'+w'" : "λv'", labelPos: 'ne' });
          // offsets on the right edge
          const xr = s.bounds.x[1] - 0.1;
          const tag = (p, c, txt) => { const y = p[1] + (xr - p[0]) * e[1] / e[0]; s.text(txt, xr, y + 0.08, { color: c, align: 'right', size: 12, baseline: 'bottom', weight: 600 }); };
          tag(V, 'orange', `${v.fix(off(V), 2)}`); if (add) tag(W, 'purple', `${v.fix(off(W), 2)}`); tag(Rc, 'green', `${v.fix(off(Rc), 2)}`);
          st = { oV: off(V), oW: off(W), oR: off(R), add, L };
        }, { period: 60, autoplay: true });
        v.legend([['blue', '$U$'], ['orange', '$v+U$'], ['purple', '$w+U$'], ['green', 'the result class']]);
        v.readout(() => {
          if (!st) return '';
          const { oV, oW, oR, add, L } = st;
          return add ? String.raw`Offsets across $U$: $${tn(oV)}+${tn(oW)}=${tn(oV + oW)}$, and the moving sum $v'+w'$ has offset ${v.fix(oR, 3)} at every instant — the class $(v'+w')+U$ does not depend on the representatives.`
            : String.raw`Offsets: $${tn(L)}\cdot${tn(oV)}=${tn(L * oV)}$, and $\lambda v'$ has offset ${v.fix(oR, 3)} at every instant.`;
        });
      },
    },
  ],
};
