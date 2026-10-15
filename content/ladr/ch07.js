// Sheldon Axler, Linear Algebra Done Right (4th ed.) — Chapter 7: Operators on Inner Product Spaces
// Part 1 (this file): items 7.1–7.22 — the adjoint, self-adjoint operators, normal operators.
// The rest of the chapter lives in ch07-b.js (7.23–7.55), ch07-c.js (7.56–7.82) and ch07-d.js (7.86–7.111).

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;

/** Number for TeX: d decimals, trailing zeros trimmed, never "-0". */
function nm(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const t = Number(x.toFixed(d));
  return t === 0 ? '0' : String(t);
}
/** Same, with a typographic minus (canvas text). */
const nmc = (x, d = 2) => nm(x, d).replace('-', '−');
/** a + bi as TeX. */
function cxT(re, im, d = 2) {
  const a = Number(re.toFixed(d)), b = Number(im.toFixed(d));
  if (b === 0) return nm(a, d);
  const bb = Math.abs(b) === 1 ? '' : nm(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bb}i`;
  return `${nm(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
const czT = (z, d = 2) => cxT(z[0], z[1], d);
/** Complex number as canvas text. */
const czS = (z, d = 2) => czT(z, d).replace(/ /g, '').replace(/-/g, '−');
const matT = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => nm(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const rowT = (u, d = 2) => `(${u.map((x) => nm(x, d)).join(',\\ ')})`;
const cmatT = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((z) => czT(z, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const crowT = (x, d = 2) => `(${x.map((z) => czT(z, d)).join(',\\ ')})`;

// real vectors and matrices (matrices are lists of rows)
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => scl(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const tp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const col = (A, j) => A.map((r) => r[j]);
/** Orthonormal pair spanning span(a, b) (second entry null when they are parallel). */
function onb(a, b) { const e = unit(a), w = sub(b, scl(e, dot(b, e))); return [e, len(w) < 1e-9 ? null : unit(w)]; }
function inv2(A) { const [[a, b], [c, d]] = A, D = a * d - b * c; return [[d / D, -b / D], [-c / D, a / D]]; }
/** Eigen-data of a real 2×2 matrix. */
function eig2x2(A) {
  const [[a, b], [c, d]] = A, tr = a + d, det = a * d - b * c, disc = (tr * tr) / 4 - det;
  if (disc >= -1e-12) { const s = Math.sqrt(Math.max(0, disc)); return { real: true, l: s < 1e-6 ? [tr / 2] : [tr / 2 + s, tr / 2 - s], tr, det }; }
  return { real: false, re: tr / 2, im: Math.sqrt(-disc), tr, det };
}
/** Unit eigenvector of the 2×2 matrix A for the real eigenvalue l (null when A = lI). */
function evec2(A, l) {
  const [[a, b], [c, d]] = A, x = [b, l - a], y = [l - d, c];
  const u = len(x) >= len(y) ? x : y, r = len(u);
  return r < 1e-9 ? null : [u[0] / r, u[1] / r];
}

// complex numbers [re, im] and complex matrices (lists of rows of complex numbers)
const cadd = (z, w) => [z[0] + w[0], z[1] + w[1]];
const csub = (z, w) => [z[0] - w[0], z[1] - w[1]];
const cmul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
const cconj = (z) => [z[0], -z[1]];
const cabs = (z) => Math.hypot(z[0], z[1]);
const csc = (z, k) => [z[0] * k, z[1] * k];
function cdiv(z, w) { const d = w[0] * w[0] + w[1] * w[1]; return [(z[0] * w[0] + z[1] * w[1]) / d, (z[1] * w[0] - z[0] * w[1]) / d]; }
function csqrt(z) { const r = cabs(z), a = Math.sqrt(Math.max(0, (r + z[0]) / 2)), b = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [a, z[1] < 0 ? -b : b]; }
const toC = (A) => A.map((r) => r.map((x) => [x, 0]));
const cMM = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, z, k) => cadd(s, cmul(z, B[k][j])), [0, 0])));
const cMV = (A, x) => A.map((r) => r.reduce((s, z, k) => cadd(s, cmul(z, x[k])), [0, 0]));
const cStar = (A) => A[0].map((_, j) => A.map((r) => cconj(r[j])));
const cMadd = (A, B) => A.map((r, i) => r.map((z, j) => cadd(z, B[i][j])));
const cMsub = (A, B) => A.map((r, i) => r.map((z, j) => csub(z, B[i][j])));
const cMsc = (A, l) => A.map((r) => r.map((z) => cmul(z, l)));
const cFro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
/** ⟨x, y⟩ = Σ x_k ȳ_k: linear in the first slot, conjugate-linear in the second. */
const cIP = (x, y) => x.reduce((s, z, k) => cadd(s, cmul(z, cconj(y[k]))), [0, 0]);
const cNorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cdet2 = (A) => csub(cmul(A[0][0], A[1][1]), cmul(A[0][1], A[1][0]));
function cInv2(A) { const D = cdet2(A); return [[cdiv(A[1][1], D), cdiv(csc(A[0][1], -1), D)], [cdiv(csc(A[1][0], -1), D), cdiv(A[0][0], D)]]; }
/** Eigenvalues and unit eigenvectors (null when T − λI = 0) of a complex 2×2 matrix. */
function cEig2(A) {
  const [[a, b], [c, d]] = A, h = csc(cadd(a, d), 0.5), D = csqrt(csub(cmul(h, h), cdet2(A)));
  const ls = [cadd(h, D), csub(h, D)];
  const vecs = ls.map((l) => {
    const x = [b, csub(l, a)], y = [csub(l, d), c], u = cNorm(x) >= cNorm(y) ? x : y, r = cNorm(u);
    return r < 1e-10 ? null : u.map((z) => csc(z, 1 / r));
  });
  return { ls, vecs };
}
/** Eigenvalues (descending) of a Hermitian 2×2 matrix. */
function hermEig(H) { const p = H[0][0][0], r = H[1][1][0], q = H[0][1], m = (p + r) / 2, s = Math.hypot((p - r) / 2, cabs(q)); return [m + s, m - s]; }

// ---------- drawing helpers ----------
/** TeX label just beyond the tip of the vector p (from the origin). */
function tip(S, tex, p, color, { off = 15, size = 15 } = {}) {
  const r = Math.hypot(p[0], p[1]) || 1;
  S.tex(tex, p[0], p[1], { color, size, dx: (off * p[0]) / r, dy: (-off * p[1]) / r });
}
/** Right-angle mark at 0 between unit vectors u and w. */
function rightMark(S, u, w, r, color = 'ink') { S.path([scl(u, r), add(scl(u, r), scl(w, r)), scl(w, r)], { color, width: 1.4 }); }
/** Arc at 0 from unit vector u to unit vector w (the short way), with a degree label. */
function angleArc(S, u, w, r, color, label) {
  const a0 = Math.atan2(u[1], u[0]); let d = Math.atan2(w[1], w[0]) - a0;
  while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  const pts = []; for (let k = 0; k <= 24; k++) { const t = a0 + (d * k) / 24; pts.push([r * Math.cos(t), r * Math.sin(t)]); }
  S.path(pts, { color, width: 1.8 });
  if (label) { const t = a0 + d / 2; S.text(label, (r + 0.22) * Math.cos(t), (r + 0.22) * Math.sin(t), { color, size: 12, align: 'center', weight: 700 }); }
}
/** Image under A of the unit circle, as a closed list of points. */
function ellPts(A, n = 120) { const pts = []; for (let k = 0; k <= n; k++) { const t = (TAU * k) / n; pts.push(mv(A, [Math.cos(t), Math.sin(t)])); } return pts; }
/** Unit circle (dashed) and its image ellipse under A. */
function drawEllipse(S, A, st = {}) {
  S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
  S.path(ellPts(A), { close: true, fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.6, ...st });
}
/** A square real matrix drawn as a tile of shaded cells (blue > 0, red < 0) with its entries. */
function drawTile(S, B, x0, y0, w, { frame = 'muted' } = {}) {
  const n = B.length, cw = w / n, mx = Math.max(1e-9, ...B.flat().map(Math.abs));
  const size = Math.max(8, Math.min(14, Math.abs(S.X(cw) - S.X(0)) * 0.27));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = Math.abs(B[i][j]) < 1e-9 ? 0 : B[i][j], x = x0 + j * cw, y = y0 + w - (i + 1) * cw;
    if (b) S.rect(x, y, x + cw, y + cw, { fill: b > 0 ? 'blue' : 'red', fillAlpha: 0.07 + (0.3 * Math.abs(b)) / mx, stroke: false });
    S.text(nmc(b, 2), x + cw / 2, y + cw / 2, { size, align: 'center', baseline: 'middle', color: b ? 'ink' : 'faint' });
  }
  S.rect(x0, y0, x0 + w, y0 + w, { color: frame, width: frame === 'muted' ? 1.1 : 2.6 });
}
/** A complex matrix drawn as a grid of little copies of C, each entry an arrow (radius of the guide circle ↔ |z| = sc). */
function phasorTile(S, A, x0, y0, w, { frame = 'muted', sc = 1, color = 'accent' } = {}) {
  const m = A.length, n = A[0].length, cw = w / n, R = 0.38 * cw, k = R / sc;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const cx = x0 + (j + 0.5) * cw, cy = y0 + (m - i - 0.5) * cw, z = A[i][j];
    S.circle(cx, cy, R, { color: 'faint', width: 1, alpha: 0.6 });
    S.line(cx - R, cy, cx + R, cy, { color: 'faint', width: 0.8, alpha: 0.5 });
    S.line(cx, cy - R, cx, cy + R, { color: 'faint', width: 0.8, alpha: 0.5 });
    S.arrow(cx, cy, cx + z[0] * k, cy + z[1] * k, { color, width: 2, head: 7 });
  }
  S.rect(x0, y0, x0 + n * cw, y0 + m * cw, { color: frame, width: frame === 'muted' ? 1.1 : 2.6 });
}
/** Level lines {x : n·x = kδ} of the linear functional x ↦ n·x. */
function levels(S, n, delta, color, { K = 30, alpha = 0.3 } = {}) {
  const r = len(n); if (r < 1e-9 || delta < 1e-9) return;
  const d = [-n[1] / r, n[0] / r], kmax = Math.min(K, Math.ceil((4 * r) / delta));
  for (let k = -kmax; k <= kmax; k++) {
    const p = scl(n, (k * delta) / (r * r));
    S.line(p[0] - 7 * d[0], p[1] - 7 * d[1], p[0] + 7 * d[0], p[1] + 7 * d[1], { color, width: k ? 1 : 1.6, alpha: k ? alpha : 0.6 });
  }
}
/** The level line of x ↦ n·x through the point p. */
function levelAt(S, n, p, st) { const r = len(n); if (r < 1e-9) return; const d = [-n[1] / r, n[0] / r]; S.line(p[0] - 7 * d[0], p[1] - 7 * d[1], p[0] + 7 * d[0], p[1] + 7 * d[1], st); }
/** The unit "circle" {x : x₁² + c x₂² = 1} of a weighted inner product. */
function unitEllipse(S, c) {
  const pts = []; for (let k = 0; k <= 96; k++) { const t = (TAU * k) / 96; pts.push([Math.cos(t), Math.sin(t) / Math.sqrt(c)]); }
  S.path(pts, { color: 'muted', width: 1, dash: [4, 4] });
}
/** Boundary of the numerical range {⟨Tx, x⟩ : ‖x‖ = 1} of a complex 2×2 matrix, from its support function. */
function numRange(T, n = 160) {
  const Ts = cStar(T), out = [];
  for (let k = 0; k < n; k++) {
    const th = (TAU * k) / n, e = [Math.cos(th), -Math.sin(th)];
    const H = cMsc(cMadd(cMsc(T, e), cMsc(Ts, cconj(e))), [0.5, 0]);
    const p = H[0][0][0], r = H[1][1][0], q = H[0][1], mu = (p + r) / 2 + Math.hypot((p - r) / 2, cabs(q));
    let x = [q, [mu - p, 0]];
    if (cNorm(x) < 1e-12) x = [[mu - r, 0], cconj(q)];
    if (cNorm(x) < 1e-12) x = [[1, 0], [0, 0]];
    const r0 = cNorm(x); x = x.map((z) => csc(z, 1 / r0));
    out.push(cIP(cMV(T, x), x));
  }
  return out;
}

export default {
  collection: 'ladr',
  chapter: 7,
  title: 'Operators on Inner Product Spaces',
  summary: String.raw`The adjoint ties a linear map to the inner products on its two sides, and through it the chapter singles out self-adjoint and normal operators — exactly the operators that the real and complex spectral theorems diagonalize in an orthonormal basis. Positive operators and their square roots, isometries and unitary operators follow, together with the QR and Cholesky factorizations of matrices. Singular values then carry the spectral picture over to arbitrary linear maps through the singular value decomposition, whose consequences include the operator norm, best low-rank approximation, the polar decomposition, and a precise account of how an operator distorts balls, boxes and volume.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'Adjoint T*',
      statement: String.raw`Let $V$ and $W$ be finite-dimensional inner product spaces over $\mathbf F$ and $T \in \mathcal L(V, W)$. The **adjoint** of $T$ is the function $T^* \colon W \to V$ determined by
$$\langle Tv, w\rangle = \langle v, T^*w\rangle \qquad\text{for every } v \in V \text{ and every } w \in W.$$
The inner product on the left is that of $W$, the one on the right that of $V$.`,
      idea: String.raw`Fix $w \in W$. The map $v \mapsto \langle Tv, w\rangle$ is a linear functional on $V$, so by the Riesz representation theorem (6.42) there is exactly one vector of $V$ whose inner product with every $v$ reproduces it; that vector is called $T^*w$. So $T^*$ exists and is unique — but it depends on the inner products. For the dot product on $\mathbf R^n$ its matrix is the transpose of the matrix of $T$; for a weighted inner product $\langle x, y\rangle = x^{t}Gy$ it is $G^{-1}T^{t}G$.`,
      caption: String.raw`Drag $v$ (gold, left) and $w$ (purple, right). On the right, the purple lines are the levels of $y \mapsto \langle y, w\rangle$ in $W$; on the left are their pull-backs by $T$, the levels of $x \mapsto \langle Tx, w\rangle$. The green $T^*w$ is the one vector whose own level lines are exactly these, so $v$ and $Tv$ always sit on matching levels (gold). Change the weight $c$ of the inner product (its unit ball is the dashed ellipse): the plain transpose $T^{t}w$ (red) has the wrong level line through $v$ (red dashed), and only at $c = 1$ does it agree with $T^*w$.`,
      deps: ['ladr-6.42'],
      see: ['fa-12.9'],
      tags: ['adjoint'],
      viz(v) {
        const PRE = { a: [[1, 0.7], [-0.3, 0.8]], b: [[0.5, 1.1], [0.9, -0.4]], c: [[0.6, 0.9], [0.3, 0.45]] };
        const which = v.select('$T$', [{ value: 'a', label: 'invertible' }, { value: 'b', label: 'reverses orientation' }, { value: 'c', label: 'rank one' }], 'a');
        const cs = v.slider('weight $c$ in $\\langle x, y\\rangle = x_1y_1 + c\\,x_2y_2$', 0.25, 4, 2.5, { step: 0.05 });
        const opt = { x: [-2.4, 2.4], y: [-2.1, 2.1], equal: true, height: 360 };
        const L = v.stage({ ...opt, title: 'in $V$: levels of $x \\mapsto \\langle Tx, w\\rangle$' });
        const R = v.stage({ ...opt, title: 'in $W$: levels of $y \\mapsto \\langle y, w\\rangle$' });
        const vh = L.handle(1.1, 0.6, { color: 'gold', label: 'v' });
        const wh = R.handle(-1, 0.55, { color: 'purple', label: 'w' });
        let st = null;
        v.render(() => {
          const T = PRE[which.value], c = cs.value, G = [[1, 0], [0, c]], Gi = [[1, 0], [0, 1 / c]];
          const ip = (x, y) => x[0] * y[0] + c * x[1] * y[1];
          const Ts = mm(mm(Gi, tp(T)), G), Tt = tp(T);
          const x = [vh.x, vh.y], w = [wh.x, wh.y], Tx = mv(T, x), Tsw = mv(Ts, w), Ttw = mv(Tt, w);
          const nR = mv(G, w), nL = mv(G, Tsw), nN = mv(G, Ttw), delta = 0.5 * len(nR);
          unitEllipse(L, c); unitEllipse(R, c);
          levels(L, nL, delta, 'purple'); levels(R, nR, delta, 'purple');
          const s = ip(Tx, w), naive = ip(x, Ttw), off = len(sub(Ttw, Tsw)) > 1e-3;
          levelAt(L, nL, x, { color: 'gold', width: 2.2 });
          levelAt(R, nR, Tx, { color: 'gold', width: 2.2 });
          if (off) {
            levelAt(L, nN, x, { color: 'red', width: 1.6, dash: [6, 5] });
            L.arrow(0, 0, Ttw[0], Ttw[1], { color: 'red', width: 2, dash: [6, 4] }); tip(L, 'T^{t}w', Ttw, 'red', { size: 14 });
          }
          L.arrow(0, 0, Tsw[0], Tsw[1], { color: 'green', width: 2.8 }); tip(L, 'T^*w', Tsw, 'green');
          L.arrow(0, 0, x[0], x[1], { color: 'gold', width: 2.2 });
          R.arrow(0, 0, w[0], w[1], { color: 'purple', width: 2.2 });
          R.arrow(0, 0, Tx[0], Tx[1], { color: 'accent', width: 2.8 }); tip(R, 'Tv', Tx, 'accent');
          L.corner(`⟨v, T*w⟩ = ${nmc(s, 3)}`, 'tl', { color: 'gold', weight: 700 });
          if (off) L.corner(`⟨v, Tᵗw⟩ = ${nmc(naive, 3)}`, 'bl', { color: 'red', weight: 700 });
          R.corner(`⟨Tv, w⟩ = ${nmc(s, 3)}`, 'tl', { color: 'gold', weight: 700 });
          st = { s, naive, off, Ts, Tt, G, c };
          v.legend([['gold', '$v$ and its level'], ['accent', '$Tv$'], ['purple', '$w$, level lines'], ['green', '$T^*w$'], ['red', 'transpose $T^{t}w$']]);
        });
        v.readout(() => st && `$\\langle Tv, w\\rangle = ${nm(st.s, 3)} = \\langle v, T^*w\\rangle$ with $T^* = G^{-1}T^{t}G = ${matT(st.Ts)}$, where $G = ${matT(st.G)}$ is the matrix of the inner product. ` + (st.off ? `The plain transpose $T^{t} = ${matT(st.Tt)}$ would give $\\langle v, T^{t}w\\rangle = ${nm(st.naive, 3)}$ — wrong, because $c \\ne 1$.` : `Here $c = 1$, so $G = I$ and $T^* = T^{t}$: for the dot product the adjoint is the transpose.`));
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Theorem',
      name: 'The adjoint of a linear map is linear',
      statement: String.raw`If $T \in \mathcal L(V, W)$, then $T^* \in \mathcal L(W, V)$: for all $w, w_1, w_2 \in W$ and $\lambda \in \mathbf F$,
$$T^*(w_1 + w_2) = T^*w_1 + T^*w_2 \qquad\text{and}\qquad T^*(\lambda w) = \lambda\, T^*w.$$`,
      idea: String.raw`Test the candidate against the defining identity. For every $v$, $\langle Tv, w_1 + w_2\rangle = \langle Tv, w_1\rangle + \langle Tv, w_2\rangle = \langle v, T^*w_1 + T^*w_2\rangle$, so $T^*w_1 + T^*w_2$ represents the functional $v \mapsto \langle Tv, w_1 + w_2\rangle$; by the uniqueness in the Riesz representation theorem it *is* $T^*(w_1 + w_2)$. For scalars, $\langle Tv, \lambda w\rangle = \bar\lambda\langle v, T^*w\rangle = \langle v, \lambda T^*w\rangle$: the two complex conjugations cancel, so $T^*(\lambda w) = \lambda T^*w$ even over $\mathbf C$.`,
      caption: String.raw`Drag $w_1$ and $w_2$ in $W = \mathbf R^2$ (left). On the right each $T^*w$ is computed from scratch by the defining identity — its $j$-th coordinate is $\langle Te_j, w\rangle$ — and drawn in $V = \mathbf R^3$ (drag the background to rotate). The green $T^*(w_1 + w_2)$ always lands in the hollow ring at the far corner of the parallelogram of $T^*w_1$ and $T^*w_2$; in the homogeneity view $T^*(\lambda w_1)$ lands on $\lambda T^*w_1$. Every $T^*w$ stays in the blue plane (a line for rank one): the range of $T^*$. Move the gold $v$ to test the identity in the readout.`,
      deps: ['ladr-7.1'],
      tags: ['adjoint'],
      viz(v) {
        const PRE = { a: [[0.7, 0.3, -0.35], [0.15, 0.75, 0.5]], b: [[0.6, -0.4, 0.3], [0.3, -0.2, 0.15]] };
        const which = v.select('$T \\colon \\mathbf R^3 \\to \\mathbf R^2$', [{ value: 'a', label: 'rank 2' }, { value: 'b', label: 'rank 1' }], 'a');
        const mode = v.select('check', [{ value: 'sum', label: 'additivity' }, { value: 'scal', label: 'homogeneity' }], 'sum');
        const lam = v.slider('$\\lambda$', -1.5, 1.5, -1.2, { step: 0.05 });
        const W = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, height: 380, weight: 0.85, title: 'in $W = \\mathbf R^2$' });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, axes: false, height: 380, weight: 1.15, title: 'in $V = \\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.3, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const disc = (x, y) => { const r = Math.hypot(x, y), m = 1.3; return r > m ? [(x * m) / r, (y * m) / r] : [x, y]; };
        const w1 = W.handle(1.1, 0.35, { color: 'teal', label: 'w₁', constrain: disc });
        const w2 = W.handle(-0.2, 1.05, { color: 'pink', label: 'w₂', constrain: disc });
        const vp = sc.handle([0.7, -0.9, 0.8], { color: 'gold', label: 'v' });
        const adj = (T, w) => [0, 1, 2].map((j) => T[0][j] * w[0] + T[1][j] * w[1]); // j-th coordinate = ⟨T e_j, w⟩
        let st = null;
        v.render(() => {
          const T = PRE[which.value], a = [w1.x, w1.y], b = [w2.x, w2.y], sum = mode.value === 'sum', l = lam.value;
          lam.el.hidden = sum; w2.visible = sum;
          let wc;
          if (sum) {
            wc = add(a, b);
            W.poly([[0, 0], a, wc, b], { fill: 'green', fillAlpha: 0.06, color: 'muted', width: 1, dash: [4, 4] });
            W.arrow(0, 0, b[0], b[1], { color: 'pink', width: 2.2 });
            W.arrow(0, 0, wc[0], wc[1], { color: 'green', width: 2.6 }); tip(W, 'w_1 + w_2', wc, 'green', { off: 26 });
          } else {
            wc = scl(a, l);
            W.line(-3 * a[0], -3 * a[1], 3 * a[0], 3 * a[1], { color: 'faint', width: 1 });
            W.arrow(0, 0, wc[0], wc[1], { color: 'green', width: 2.6 }); tip(W, '\\lambda w_1', wc, 'green', { off: 20 });
          }
          W.arrow(0, 0, a[0], a[1], { color: 'teal', width: 2.2 });
          sc.begin();
          const rk = v.M.rank(T, 1e-9);
          if (rk === 2) { const [e, f] = onb(T[0], T[1]); sc.disc(e, f, 1.5, { fill: 'accent', fillAlpha: 0.06, color: 'accent', alpha: 0.35, grid: true }); }
          else { const e = unit(T[0]); sc.line(scl(e, -2), scl(e, 2), { color: 'accent', width: 2, alpha: 0.5 }); }
          const A = adj(T, a), out = adj(T, wc);
          let pred;
          if (sum) {
            const B = adj(T, b); pred = add(A, B);
            sc.line(A, pred, { color: 'muted', dash: [4, 4], width: 1.2 }); sc.line(B, pred, { color: 'muted', dash: [4, 4], width: 1.2 });
            sc.arrow([0, 0, 0], B, { color: 'pink' }); sc.tex('T^*w_2', B, { color: 'pink', dx: 12, dy: -10, size: 14 });
          } else pred = scl(A, l);
          sc.arrow([0, 0, 0], A, { color: 'teal' }); sc.tex('T^*w_1', A, { color: 'teal', dx: 14, dy: 10, size: 14 });
          sc.dot(pred, { r: 9, color: 'green', hollow: true });
          sc.arrow([0, 0, 0], out, { color: 'green', width: 3 });
          sc.tex(sum ? 'T^*(w_1 + w_2)' : 'T^*(\\lambda w_1)', out, { color: 'green', dx: 0, dy: -20, size: 14 });
          sc.arrow([0, 0, 0], vp.p, { color: 'gold', width: 2 });
          sc.flush();
          const x = vp.p, Tx = mv(T, x);
          st = { sum, out, pred, gap: len(sub(out, pred)), lhs: dot(Tx, wc), rhs: dot(x, pred), l };
          v.legend([['teal', '$w_1$, $T^*w_1$'], ...(sum ? [['pink', '$w_2$, $T^*w_2$']] : []), ['green', sum ? '$w_1 + w_2$ and $T^*(w_1 + w_2)$' : '$\\lambda w_1$ and $T^*(\\lambda w_1)$'], ['accent', '$\\operatorname{range} T^*$'], ['gold', 'test vector $v$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const w = st.sum ? 'w_1 + w_2' : '\\lambda w_1', p = st.sum ? 'T^*w_1 + T^*w_2' : '\\lambda T^*w_1';
          return `$T^*(${w}) = \\big(\\langle Te_1, ${w}\\rangle, \\langle Te_2, ${w}\\rangle, \\langle Te_3, ${w}\\rangle\\big) = ${rowT(st.out)}$ and $${p} = ${rowT(st.pred)}$: the difference has length $${nm(st.gap, 6)}$. For the gold $v$, $\\langle Tv, ${w}\\rangle = ${nm(st.lhs, 3)} = \\langle v, ${p}\\rangle$ — true for every $v$, which is why the two vectors must coincide.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Theorem',
      name: 'Properties of the adjoint',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $(S + T)^* = S^* + T^*$ for all $S \in \mathcal L(V, W)$;
(b) $(\lambda T)^* = \bar\lambda T^*$ for all $\lambda \in \mathbf F$;
(c) $(T^*)^* = T$;
(d) $(ST)^* = T^*S^*$ for all $S \in \mathcal L(W, U)$, where $U$ is a finite-dimensional inner product space over $\mathbf F$;
(e) $I^* = I$, where $I$ is the identity operator on $V$;
(f) if $T$ is invertible, then $T^*$ is invertible and $(T^*)^{-1} = (T^{-1})^*$.`,
      idea: String.raw`Each identity comes from moving operators across the inner product with the defining identity and then invoking uniqueness. For (d): $\langle STv, u\rangle = \langle Tv, S^*u\rangle = \langle v, T^*S^*u\rangle$ — first $S$ crosses, then $T$, so the order reverses. In (b) the scalar leaves the second slot conjugated. For (c), $\langle T^*w, v\rangle = \overline{\langle v, T^*w\rangle} = \overline{\langle Tv, w\rangle} = \langle w, Tv\rangle$. Then (f) follows from (d) and (e) applied to $T^{-1}T = I$ and $TT^{-1} = I$. Because of (b), $T \mapsto T^*$ is linear when $\mathbf F = \mathbf R$ but only conjugate-linear when $\mathbf F = \mathbf C$.`,
      caption: String.raw`Random complex $2 \times 2$ matrices $S, T$ and vectors $v, u \in \mathbf C^2$ (press the button for new ones). Left: the two sides of the chosen identity, paired with vectors, are complex numbers — the green rings land exactly on top of each other, while the tempting wrong version (red) lands elsewhere. Right: the matrices themselves, each entry an arrow in its own small copy of $\mathbf C$. For $(\lambda T)^*$, drag $\lambda$: multiplying by $\lambda$ rotates and scales, and the red $\lambda T^*$ turns the wrong way round the dashed circle.`,
      deps: ['ladr-7.1', 'ladr-7.4'],
      tags: ['adjoint'],
      viz(v) {
        let seed = 4;
        const mode = v.select('identity', [{ value: 'd', label: '$(ST)^* = T^*S^*$' }, { value: 'b', label: '$(\\lambda T)^* = \\bar\\lambda T^*$' }, { value: 'c', label: '$(T^*)^* = T$, $(T^{-1})^* = (T^*)^{-1}$' }], 'd');
        v.button('New random $S, T, v, u$', () => { seed += 1; });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, weight: 0.95, title: 'both sides, paired with $v$ and $u$, in $\\mathbf C$' });
        const Q = v.stage({ x: [-0.15, 3.75], y: [-0.6, 1.6], equal: true, axes: false, height: 360, weight: 1.15 });
        const lh = P.handle(0.75, 0.9, { color: 'gold', label: 'λ' });
        const gen = () => {
          const r = v.rng(seed), ce = () => [r.uniform(-1, 1), r.uniform(-1, 1)];
          const mat = () => { for (let i = 0; i < 50; i++) { const A = [[ce(), ce()], [ce(), ce()]]; if (cabs(cdet2(A)) > 0.4) return A; } return [[[1, 0], [0, 0]], [[0, 0], [1, 0]]]; };
          const vec = () => { const x = [ce(), ce()], n = cNorm(x); return x.map((z) => csc(z, 1.1 / n)); };
          return { S: mat(), T: mat(), x: vec(), u: vec() };
        };
        const rings = (z, color, n = 3) => { [12, 8, 4.5].slice(0, n).forEach((r, i) => P.dot(z[0], z[1], { r, color, hollow: i < n - 1 })); };
        let st = null;
        v.render(() => {
          const { S, T, x, u } = gen(), m = mode.value, Ss = cStar(S), Tt = cStar(T);
          lh.visible = m === 'b';
          let pts = [], tiles = [], eqs = [], txt = {}, chain = null, lg = [];
          if (m === 'd') {
            const z1 = cIP(cMV(cMM(S, T), x), u), z2 = cIP(cMV(T, x), cMV(Ss, u)), z3 = cIP(x, cMV(cMM(Tt, Ss), u)), zr = cIP(x, cMV(cMM(Ss, Tt), u));
            pts = [z1, zr];
            const A = cStar(cMM(S, T)), B = cMM(Tt, Ss), C = cMM(Ss, Tt);
            tiles = [[A, '(ST)^*', 'green'], [B, 'T^*S^*', 'green'], [C, 'S^*T^*', 'red']]; eqs = ['=', '\\neq'];
            txt = { z1, z3, zr, A, B, C, e1: cFro(cMsub(A, B)), e2: cFro(cMsub(A, C)) };
            P.setView(...view(pts));
            rings(z1, 'green');
            lab(P, z1, '\\langle v, T^*S^*u\\rangle', 'green');
            P.dot(zr[0], zr[1], { r: 5, color: 'red' }); lab(P, zr, '\\langle v, S^*T^*u\\rangle', 'red');
            chain = ['\\langle STv, u\\rangle = \\langle Tv, S^*u\\rangle = \\langle v, T^*S^*u\\rangle', 'green'];
            lg = [['green', 'both sides: $\\langle STv, u\\rangle = \\langle v, T^*S^*u\\rangle$', { dot: true }], ['red', 'wrong order: $\\langle v, S^*T^*u\\rangle$', { dot: true }]];
          } else if (m === 'b') {
            const l = [lh.x, lh.y], z0 = cIP(cMV(T, x), u), z1 = cIP(cMV(cMsc(T, l), x), u), z2 = cIP(x, cMV(cMsc(Tt, cconj(l)), u)), zr = cIP(x, cMV(cMsc(Tt, l), u));
            pts = [z0, z1, zr, l];
            const A = cStar(cMsc(T, l)), B = cMsc(Tt, cconj(l)), C = cMsc(Tt, l);
            tiles = [[A, '(\\lambda T)^*', 'green'], [B, '\\bar\\lambda T^*', 'green'], [C, '\\lambda T^*', 'red']]; eqs = ['=', '\\neq'];
            txt = { l, z0, z1, z2, zr, e1: cFro(cMsub(A, B)), e2: cFro(cMsub(A, C)) };
            P.setView(...view(pts));
            P.circle(0, 0, cabs(z1), { color: 'muted', dash: [4, 4], width: 1 });
            P.dot(z0[0], z0[1], { r: 4.5, color: 'muted' }); lab(P, z0, '\\langle Tv, u\\rangle', 'muted');
            rings(z1, 'green', 2); lab(P, z1, '\\langle v, \\bar\\lambda T^*u\\rangle', 'green');
            P.dot(zr[0], zr[1], { r: 5, color: 'red' }); lab(P, zr, '\\langle v, \\lambda T^*u\\rangle', 'red');
            chain = ['\\langle (\\lambda T)v, u\\rangle = \\lambda\\langle Tv, u\\rangle = \\langle v, \\bar\\lambda T^*u\\rangle', 'green'];
            lg = [['green', 'both sides: $\\langle (\\lambda T)v, u\\rangle = \\langle v, \\bar\\lambda T^*u\\rangle$', { dot: true }], ['red', 'wrong: $\\langle v, \\lambda T^*u\\rangle$', { dot: true }], ['gold', '$\\lambda$ (drag)', { dot: true }]];
          } else {
            const Ti = cInv2(T), z1 = cIP(cMV(Tt, u), x), z2 = cIP(u, cMV(T, x)), z3 = cIP(cMV(Ti, x), u), z4 = cIP(x, cMV(cInv2(Tt), u));
            pts = [z1, z3];
            const A = cStar(Tt), B = cStar(Ti), C = cInv2(Tt);
            tiles = [[A, '(T^*)^*', 'green'], [T, 'T', 'green'], [B, '(T^{-1})^*', 'teal'], [C, '(T^*)^{-1}', 'teal']]; eqs = ['=', null, '='];
            txt = { z1, z2, z3, z4, e1: cFro(cMsub(A, T)), e2: cFro(cMsub(B, C)) };
            P.setView(...view(pts));
            rings(z1, 'green', 2); lab(P, z1, '\\langle u, Tv\\rangle', 'green');
            rings(z3, 'teal', 2); lab(P, z3, '\\langle v, (T^*)^{-1}u\\rangle', 'teal');
            chain = ['\\langle T^*u, v\\rangle = \\langle u, Tv\\rangle, \\quad \\langle T^{-1}v, u\\rangle = \\langle v, (T^*)^{-1}u\\rangle', 'ink'];
            lg = [['green', '$\\langle T^*u, v\\rangle = \\langle u, Tv\\rangle$', { dot: true }], ['teal', '$\\langle T^{-1}v, u\\rangle = \\langle v, (T^*)^{-1}u\\rangle$', { dot: true }]];
          }
          // the matrices
          const n = tiles.length, gap = n === 4 ? 0.25 : 0.3, xs = tiles.map((_, i) => i * (1 + gap) + (n === 4 && i >= 2 ? 0.25 : 0));
          Q.setView([-0.15, xs[n - 1] + 1.15], [-0.6, 1.6]);
          Q.tex(chain[0], (xs[n - 1] + 1) / 2, 1.42, { size: 14, color: chain[1] });
          v.legend(lg);
          const sc = Math.max(1e-9, ...tiles.flatMap((t) => t[0].flat().map(cabs)));
          tiles.forEach(([A, name, c], i) => {
            phasorTile(Q, A, xs[i], 0.1, 1, { frame: c, sc, color: c === 'red' ? 'red' : 'accent' });
            Q.tex(name, xs[i] + 0.5, -0.02, { baseline: 'top', size: 16, color: c === 'red' ? 'red' : 'ink' });
          });
          eqs.forEach((e, i) => { if (e) Q.tex(e, xs[i] + 1 + (xs[i + 1] - xs[i] - 1) / 2, 0.6, { size: 20, color: e === '=' ? 'green' : 'red' }); });
          st = { m, ...txt, S, T };
        });
        function view(pts) { const r = Math.max(1, ...pts.map(cabs)) * 1.45; return [[-r, r], [-r, r]]; }
        function lab(S, z, tex, color) { const right = z[0] > 0; S.tex(tex, z[0], z[1], { color, size: 13, align: right ? 'right' : 'left', dx: right ? -16 : 16, dy: z[1] > 0 ? -14 : 14 }); }
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'd') return `$S = ${cmatT(st.S)},\\ T = ${cmatT(st.T)}$. Then $\\|(ST)^* - T^*S^*\\| = ${nm(st.e1, 6)}$ but $\\|(ST)^* - S^*T^*\\| = ${nm(st.e2, 3)}$; paired with $v, u$ both sides give $${czT(st.z1, 3)}$, the wrong order gives $${czT(st.zr, 3)}$. To carry $ST$ across, $S$ crosses first and $T$ second, so the order reverses.`;
          if (st.m === 'b') return `$\\lambda = ${czT(st.l)}$: $\\|(\\lambda T)^* - \\bar\\lambda T^*\\| = ${nm(st.e1, 6)}$, while $\\|(\\lambda T)^* - \\lambda T^*\\| = ${nm(st.e2, 3)}$. Paired with $v, u$: $\\lambda\\langle Tv, u\\rangle = ${czT(st.z1, 3)}$ on both sides, against $\\bar\\lambda\\langle Tv, u\\rangle = ${czT(st.zr, 3)}$ for the wrong version — they agree only when $\\lambda$ is real.`;
          return `$\\|(T^*)^* - T\\| = ${nm(st.e1, 6)}$ and $\\|(T^{-1})^* - (T^*)^{-1}\\| = ${nm(st.e2, 6)}$. Paired with vectors: $\\langle T^*u, v\\rangle = ${czT(st.z1, 3)} = \\langle u, Tv\\rangle$ and $\\langle T^{-1}v, u\\rangle = ${czT(st.z3, 3)} = \\langle v, (T^*)^{-1}u\\rangle$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Theorem',
      name: 'Null space and range of T*',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $\operatorname{null} T^* = (\operatorname{range} T)^\perp$;
(b) $\operatorname{range} T^* = (\operatorname{null} T)^\perp$;
(c) $\operatorname{null} T = (\operatorname{range} T^*)^\perp$;
(d) $\operatorname{range} T = (\operatorname{null} T^*)^\perp$.`,
      idea: String.raw`(a) is a chain of equivalences: $T^*w = 0 \iff \langle v, T^*w\rangle = 0$ for all $v \iff \langle Tv, w\rangle = 0$ for all $v \iff w \perp \operatorname{range} T$. Taking orthogonal complements in (a) and using $(U^\perp)^\perp = U$ (6.52) gives (d). Replacing $T$ by $T^*$ — allowed because $(T^*)^* = T$ (7.5) — turns (a) into (c) and (d) into (b). So $W = \operatorname{range} T \oplus \operatorname{null} T^*$ and $V = \operatorname{range} T^* \oplus \operatorname{null} T$, both orthogonal decompositions.`,
      caption: String.raw`$T \colon \mathbf R^2 \to \mathbf R^3$ has columns $Te_1$, $Te_2$ — drag them in the 3D view (drag the background to rotate). Its range (blue) and $\operatorname{null} T^*$ (green), computed independently, are always perpendicular complements; snap $Te_2$ onto the line of $Te_1$ (or pick rank 1) and the plane and the line trade places. The gold $w$ splits into a part in $\operatorname{range} T$ and a part (green dashed) that $T^*$ kills, so $T^*w$ (right) sees only the first. In $V$, $\operatorname{range} T^*$ (orange) and $\operatorname{null} T$ (red) are perpendicular too.`,
      deps: ['ladr-7.1', 'ladr-6.52', 'ladr-7.5', 'ladr-6.46'],
      see: ['fa-12.10'],
      tags: ['adjoint'],
      viz(v) {
        const M = v.M;
        const PRE = { r2: [[1.1, 0.15, 0.35], [0.1, 0.95, -0.55]], r1: [[1.0, 0.3, 0.5], [-0.7, -0.21, -0.35]] };
        v.select('$T$', [{ value: 'r2', label: 'rank 2' }, { value: 'r1', label: 'rank 1' }], 'r2', { onChange: (k) => { c1.set(PRE[k][0]); c2.set(PRE[k][1]); } });
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, weight: 1.3, title: 'in $W = \\mathbf R^3$: $\\operatorname{range} T$ and $\\operatorname{null} T^*$' });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 400, weight: 0.9, title: 'in $V = \\mathbf R^2$' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.36, axis: 1.4, lim: 1.4 });
        const snapLine = (d, deg) => (p) => { if (!d || len(p) < 1e-6 || len(d) < 1e-6) return p; const c = dot(p, d) / (len(p) * len(d)); return Math.abs(c) > Math.cos(deg / DEG) ? scl(d, (Math.sign(c) * len(p)) / len(d)) : p; };
        const c1 = sc.handle(PRE.r2[0], { color: 'teal', label: 'Te₁' });
        const c2 = sc.handle(PRE.r2[1], { color: 'pink', label: 'Te₂', snap: (p) => snapLine(c1.p, 5)(p) });
        let nullDir = null;
        const wh = sc.handle([0.9, 0.7, 0.8], { color: 'gold', label: 'w', snap: (p) => snapLine(nullDir, 6)(p) });
        let st = null;
        v.render(() => {
          const a = c1.p, b = c2.p, T = [0, 1, 2].map((i) => [a[i], b[i]]), Ts = tp(T), w = wh.p;
          const rk = M.rank(T, 1e-6), nTs = M.nullspace(Ts, 1e-6), nT = M.nullspace(T, 1e-6);
          const ran = rk === 2 ? onb(a, b) : rk === 1 ? [unit(len(a) > len(b) ? a : b)] : [];
          const Pw = ran.reduce((s, e) => add(s, scl(e, dot(w, e))), [0, 0, 0]), perp = sub(w, Pw);
          nullDir = rk === 2 ? nTs[0] : null;
          sc.begin();
          if (rk === 2) {
            sc.disc(ran[0], ran[1], 1.5, { fill: 'accent', fillAlpha: 0.12, color: 'accent', grid: true });
            const n = nTs[0];
            sc.line(scl(n, -1.55), scl(n, 1.55), { color: 'green', width: 3.2 });
            sc.path([scl(n, 0.2), add(scl(n, 0.2), scl(ran[0], 0.2)), scl(ran[0], 0.2)], { color: 'ink', width: 1.2 });
            sc.tex('\\operatorname{null} T^*', scl(n, 1.55), { color: 'green', dx: 34, dy: 0, size: 14 });
            sc.tex('\\operatorname{range} T', scl(ran[1], -1.45), { color: 'accent', size: 14 });
          } else if (rk === 1) {
            const e = ran[0];
            sc.disc(nTs[0], nTs[1], 1.5, { fill: 'green', fillAlpha: 0.12, color: 'green', grid: true });
            sc.line(scl(e, -1.8), scl(e, 1.8), { color: 'accent', width: 3.2 });
            sc.tex('\\operatorname{null} T^*', scl(nTs[1], -1.4), { color: 'green', size: 14 });
            sc.tex('\\operatorname{range} T', scl(e, 1.85), { color: 'accent', dx: 10, dy: -10, size: 14 });
          }
          sc.arrow([0, 0, 0], a, { color: 'teal' }); sc.arrow([0, 0, 0], b, { color: 'pink' });
          if (len(perp) > 1e-6 && ran.length) sc.line(w, Pw, { color: 'green', dash: [4, 3], width: 1.8 });
          sc.dot(Pw, { r: 4, color: 'accent' });
          sc.arrow([0, 0, 0], w, { color: 'gold', width: 2.4 });
          sc.flush();
          // V = R²
          const Tsw = mv(Ts, w);
          if (nT.length === 0) {
            P.rect(-5, -5, 5, 5, { fill: 'orange', fillAlpha: 0.08, stroke: false });
            P.dot(0, 0, { r: 5, color: 'red' });
            P.corner('range T* = ℝ²  ·  null T = {0}', 'bl', { color: 'orange', weight: 700 });
          } else if (nT.length === 1) {
            const n = nT[0], r = [-n[1], n[0]];
            P.line(-4 * r[0], -4 * r[1], 4 * r[0], 4 * r[1], { color: 'orange', width: 3 });
            P.line(-4 * n[0], -4 * n[1], 4 * n[0], 4 * n[1], { color: 'red', width: 3 });
            rightMark(P, n, r, 0.18);
            P.tex('\\operatorname{range} T^*', 1.45 * r[0], 1.45 * r[1], { color: 'orange', size: 14, dy: -14 });
            P.tex('\\operatorname{null} T', 1.45 * n[0], 1.45 * n[1], { color: 'red', size: 14, dy: -14 });
            P.corner('range T* ⊥ null T', 'tl', { color: 'orange', weight: 700 });
          }
          P.arrow(0, 0, Tsw[0], Tsw[1], { color: 'gold', width: 2.6 }); tip(P, 'T^*w', Tsw, 'gold');
          st = { rk, Tsw, kill: mv(Ts, perp), Tpw: mv(Ts, Pw) };
          v.legend([['accent', '$\\operatorname{range} T$'], ['green', '$\\operatorname{null} T^*$'], ['orange', '$\\operatorname{range} T^*$'], ['red', '$\\operatorname{null} T$'], ['gold', '$w$ and $T^*w$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const d = st.rk === 2 ? `$\\dim \\operatorname{range} T = 2$, so $\\operatorname{null} T^* = (\\operatorname{range} T)^\\perp$ is a line ($3 - 2 = 1$) and $\\operatorname{range} T^* = (\\operatorname{null} T)^\\perp = \\mathbf R^2$.` : st.rk === 1 ? `$\\dim \\operatorname{range} T = 1$, so $\\operatorname{null} T^*$ is the plane perpendicular to it, and in $V$ the lines $\\operatorname{range} T^*$ and $\\operatorname{null} T$ are perpendicular.` : '$T = 0$.';
          return d + ` Split $w = Pw + (w - Pw)$ along $\\operatorname{range} T \\oplus \\operatorname{null} T^*$: $T^*(w - Pw) = ${rowT(st.kill, 4)}$, so $T^*w = T^*(Pw) = ${rowT(st.Tsw)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Definition',
      name: 'Conjugate transpose A*',
      statement: String.raw`The **conjugate transpose** of an $m$-by-$n$ matrix $A$ is the $n$-by-$m$ matrix $A^*$ obtained by interchanging rows and columns and then replacing each entry by its complex conjugate:
$$(A^*)_{j,k} = \overline{A_{k,j}} \qquad (1 \le j \le n,\ 1 \le k \le m).$$
If every entry of $A$ is real, $A^*$ is just the transpose $A^{t}$.`,
      idea: String.raw`Two independent operations happen at once: transposition moves the entry in row $k$, column $j$ to row $j$, column $k$ — a reflection of the array across its main diagonal — and conjugation reflects each entry across the real axis of $\mathbf C$. Both undo themselves, so $(A^*)^* = A$. The point of the definition is 7.9: with respect to orthonormal bases, the matrix of the adjoint $T^*$ is exactly the conjugate transpose of the matrix of $T$.`,
      caption: String.raw`Drag the arrow tips to edit the $2 \times 3$ matrix $A$ (left): each entry is an arrow in its own small copy of $\mathbf C$. Press play to send copies flying to $A^*$ (right): the entry in row $k$, column $j$ lands in row $j$, column $k$ — the colours let you follow each one, and the dashed lines are the main diagonals — and on the way it flips across its real axis, so its imaginary part changes sign. Choose real entries and $A^*$ is the plain transpose.`,
      deps: ['ladr-3.54', 'ladr-4.2'],
      tags: ['adjoint', 'matrices'],
      viz(v) {
        const M = v.M, COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        const A0 = [[[1, 0.8], [-0.6, 1.1], [0.9, -0.5]], [[0.4, -1.1], [1.2, 0], [-0.8, -0.7]]];
        const RR = 0.35, SC = 1.5, src = (k, j) => [0.6 + j, 2.5 - k], dst = (j, k) => [4.5 + k, 2.5 - j];
        const kind = v.select('entries', [{ value: 'c', label: 'complex' }, { value: 'r', label: 'real (then $A^* = A^{t}$)' }], 'c', { onChange: (k) => { if (k === 'r') H.forEach((h) => h.set(h.x, h.c[1])); } });
        let rs = 5;
        v.button('Random entries', () => { const r = v.rng(rs++); H.forEach((h) => { const re = Math.round(r.uniform(-1.3, 1.3) * 10) / 10, im = kind.value === 'r' ? 0 : Math.round(r.uniform(-1.3, 1.3) * 10) / 10; h.set(h.c[0] + (re * RR) / SC, h.c[1] + (im * RR) / SC); }); });
        const S = v.stage({ x: [-0.15, 6.15], y: [-0.2, 3.45], equal: true, axes: false, height: 380 });
        const H = [];
        for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
          const c = src(k, j), z = A0[k][j];
          const h = S.handle(c[0] + (z[0] * RR) / SC, c[1] + (z[1] * RR) / SC, {
            color: COLS[3 * k + j], r: 6, constrain: (x, y) => {
              let dx = x - c[0], dy = kind.value === 'r' ? 0 : y - c[1]; const r = Math.hypot(dx, dy), m = RR * 1.1;
              if (r > m) { dx *= m / r; dy *= m / r; }
              const q = RR / SC / 10;
              return [c[0] + Math.round(dx / q) * q, c[1] + Math.round(dy / q) * q];
            },
          });
          h.c = c; H.push(h);
        }
        const entry = (h) => [((h.x - h.c[0]) * SC) / RR, ((h.y - h.c[1]) * SC) / RR];
        const cell = (p, z, color, { text = true, guide = 'faint' } = {}) => {
          S.circle(p[0], p[1], RR, { color: guide, width: 1, alpha: 0.7 });
          S.line(p[0] - RR, p[1], p[0] + RR, p[1], { color: guide, width: 0.8, alpha: 0.6 });
          S.line(p[0], p[1] - RR, p[0], p[1] + RR, { color: guide, width: 0.8, alpha: 0.6 });
          S.arrow(p[0], p[1], p[0] + (z[0] * RR) / SC, p[1] + (z[1] * RR) / SC, { color, width: 2.4, head: 8 });
          if (text) S.text(czS(z, 1), p[0], p[1] - RR - 0.07, { size: 11, align: 'center', color: 'muted' });
        };
        const brackets = (x0, y0, x1, y1) => {
          S.path([[x0 + 0.1, y1], [x0, y1], [x0, y0], [x0 + 0.1, y0]], { color: 'ink', width: 2 });
          S.path([[x1 - 0.1, y1], [x1, y1], [x1, y0], [x1 - 0.1, y0]], { color: 'ink', width: 2 });
        };
        let st = null;
        v.animate((t) => {
          const s = M.smoothstep((t - 0.5) / 2.2), A = [[0, 1, 2].map((j) => entry(H[j])), [0, 1, 2].map((j) => entry(H[3 + j]))];
          brackets(0.08, 1.02, 3.12, 2.98); brackets(3.98, 0.02, 6.02, 2.98);
          S.tex('A', 1.6, 3.22, { size: 18 }); S.tex('A^*', 5, 3.22, { size: 18 });
          S.line(0.2, 2.9, 2, 1.1, { color: 'muted', dash: [3, 4], width: 1 });
          S.line(4.1, 2.9, 5.9, 1.1, { color: 'muted', dash: [3, 4], width: 1 });
          for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
            const z = A[k][j], c = COLS[3 * k + j], p0 = src(k, j), p1 = dst(j, k);
            cell(p0, z, c);
            if (s < 0.999) S.circle(p1[0], p1[1], RR, { color: 'faint', width: 1, dash: [3, 3] });
          }
          for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
            const z = A[k][j], p0 = src(k, j), p1 = dst(j, k), p = [p0[0] + (p1[0] - p0[0]) * s, p0[1] + (p1[1] - p0[1]) * s + 0.45 * Math.sin(Math.PI * s)];
            if (s > 0.001) cell(p, [z[0], (1 - 2 * s) * z[1]], COLS[3 * k + j], { text: s >= 0.999, guide: s >= 0.999 ? 'faint' : 'muted' });
          }
          if (s < 0.999) S.corner(s < 0.001 ? 'press play to form A*' : 'transposing and conjugating…', 'br', { color: 'muted' });
          st = { A, As: [0, 1, 2].map((j) => [0, 1].map((k) => cconj(A[k][j]))) };
        }, { period: 4.2, autoplay: false });
        v.t = 3.6;
        v.readout(() => st && `$A = ${cmatT(st.A, 1)}, \\qquad A^* = ${cmatT(st.As, 1)}$. For example $(A^*)_{3,1} = \\overline{A_{1,3}} = \\overline{${czT(st.A[0][2], 1)}} = ${czT(st.As[2][0], 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Theorem',
      name: 'Matrix of T* is the conjugate transpose of ℳ(T)',
      statement: String.raw`Let $T \in \mathcal L(V, W)$, let $e_1, \dots, e_n$ be an orthonormal basis of $V$ and $f_1, \dots, f_m$ an orthonormal basis of $W$. Then
$$\mathcal M\big(T^*, (f_1, \dots, f_m), (e_1, \dots, e_n)\big) = \Big(\mathcal M\big(T, (e_1, \dots, e_n), (f_1, \dots, f_m)\big)\Big)^*.$$
For bases that are not orthonormal the equality can fail.`,
      idea: String.raw`In an orthonormal basis, coordinates are inner products (6.30): $Te_k = \sum_j \langle Te_k, f_j\rangle f_j$, so the $(j,k)$ entry of $\mathcal M(T)$ is $\langle Te_k, f_j\rangle$. The same for $T^*$ makes the $(j,k)$ entry of $\mathcal M(T^*)$ equal to $\langle T^*f_k, e_j\rangle = \langle f_k, Te_j\rangle = \overline{\langle Te_j, f_k\rangle}$, the conjugate of the $(k,j)$ entry of $\mathcal M(T)$. In a general basis coordinates are no longer inner products, and instead $\mathcal M(T^*) = G^{-1}\mathcal M(T)^*G$ with $G$ the Gram matrix of the basis — equal to $I$ exactly when the basis is orthonormal.`,
      caption: String.raw`Drag the basis vectors $e_1$ (teal) and $e_2$ (pink) of $\mathbf R^2$; they snap to unit length and to a right angle. Right: the Gram matrix $\big(\langle e_k, e_j\rangle\big)$, the honestly computed $\mathcal M(T^*)$, and $\mathcal M(T)^*$; the last two agree (green) exactly when the Gram matrix is $I$. Left: the coordinates of $Te_1$ along the skewed grid (blue dashed) are what $\mathcal M(T)$ records, the dotted red feet are the inner products $\langle Te_1, e_j\rangle$ the proof uses — they match only for an orthonormal basis. The buttons skew the basis or straighten it by Gram–Schmidt.`,
      deps: ['ladr-7.7', 'ladr-6.30', 'ladr-7.1', 'ladr-3.31'],
      tags: ['adjoint', 'matrices'],
      viz(v) {
        const PRE = { a: [[1, 0.9], [0, 0.5]], b: [[0.2, -1], [0.8, 0.7]] };
        const which = v.select('$T$', [{ value: 'a', label: 'upper-triangular' }, { value: 'b', label: 'rotation-like' }], 'a');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 1.9], equal: true, height: 380, title: 'a basis $e_1, e_2$ of $\\mathbf R^2$ (dot product)' });
        const Tl = v.stage({ x: [-0.15, 3.85], y: [-0.75, 1.35], equal: true, axes: false, height: 380, weight: 1.05 });
        const snapU = (x, y) => { const r = Math.hypot(x, y); return Math.abs(r - 1) < 0.07 && r > 0 ? [x / r, y / r] : [x, y]; };
        const e1 = S.handle(Math.cos(0.35), Math.sin(0.35), { color: 'teal', label: 'e₁', constrain: snapU });
        const e2 = S.handle(-Math.sin(0.35), Math.cos(0.35), {
          color: 'pink', label: 'e₂', constrain: (x, y) => {
            const u = unit([e1.x, e1.y]);
            for (const sg of [1, -1]) { const p = [-sg * u[1], sg * u[0]]; if (Math.hypot(x - p[0], y - p[1]) < 0.09) return p; }
            return snapU(x, y);
          },
        });
        v.button('Gram–Schmidt', () => { const u = unit([e1.x, e1.y]), b = [e2.x, e2.y], w = unit(sub(b, scl(u, dot(b, u)))); e1.set(u[0], u[1]); e2.set(w[0], w[1]); });
        v.button('Skew the basis', () => { e1.set(1.1, 0.2); e2.set(0.55, 0.85); });
        let st = null;
        v.render(() => {
          const T = PRE[which.value], a = [e1.x, e1.y], b = [e2.x, e2.y], dt = det2(a, b);
          for (let i = -4; i <= 4; i++) {
            S.line(i * a[0] - 6 * b[0], i * a[1] - 6 * b[1], i * a[0] + 6 * b[0], i * a[1] + 6 * b[1], { color: 'faint', width: 0.8, alpha: 0.5 });
            S.line(i * b[0] - 6 * a[0], i * b[1] - 6 * a[1], i * b[0] + 6 * a[0], i * b[1] + 6 * a[1], { color: 'faint', width: 0.8, alpha: 0.5 });
          }
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          if (Math.abs(dt) < 0.05) { S.corner('not a basis', 'tl', { color: 'red', weight: 700 }); st = null; return; }
          const B = [[a[0], b[0]], [a[1], b[1]]], Bi = inv2(B), MT = mm(mm(Bi, T), B), MTs = mm(mm(Bi, tp(T)), B), MTst = tp(MT), G = mm(tp(B), B);
          const ortho = fro(msub(G, eye(2))) < 1e-6, eq = fro(msub(MTs, MTst)) < 1e-6;
          const Te = mv(T, a), [p, q] = col(MT, 0), A1 = scl(a, p), B1 = scl(b, q);
          S.line(Te[0], Te[1], A1[0], A1[1], { color: 'accent', dash: [5, 4], width: 1.4 });
          S.line(Te[0], Te[1], B1[0], B1[1], { color: 'accent', dash: [5, 4], width: 1.4 });
          S.dot(A1[0], A1[1], { r: 5, color: 'accent', hollow: true }); S.dot(B1[0], B1[1], { r: 5, color: 'accent', hollow: true });
          const fa = scl(a, dot(Te, a) / dot(a, a)), fb = scl(b, dot(Te, b) / dot(b, b));
          S.line(Te[0], Te[1], fa[0], fa[1], { color: 'red', dash: [2, 3], width: 1.6 });
          S.line(Te[0], Te[1], fb[0], fb[1], { color: 'red', dash: [2, 3], width: 1.6 });
          S.dot(fa[0], fa[1], { r: 3.5, color: 'red' }); S.dot(fb[0], fb[1], { r: 3.5, color: 'red' });
          S.arrow(0, 0, Te[0], Te[1], { color: 'accent', width: 2.6 }); tip(S, 'Te_1', Te, 'accent');
          S.arrow(0, 0, a[0], a[1], { color: 'teal', width: 2.4 }); S.arrow(0, 0, b[0], b[1], { color: 'pink', width: 2.4 });
          S.corner(ortho ? 'orthonormal basis' : 'not orthonormal', 'tl', { color: ortho ? 'green' : 'red', weight: 700 });
          drawTile(Tl, G, 0, 0.15, 1, { frame: ortho ? 'green' : 'muted' });
          drawTile(Tl, MTs, 1.4, 0.15, 1, { frame: eq ? 'green' : 'red' });
          drawTile(Tl, MTst, 2.75, 0.15, 1, { frame: eq ? 'green' : 'red' });
          Tl.tex(eq ? '=' : '\\neq', 2.575, 0.65, { size: 22, color: eq ? 'green' : 'red' });
          Tl.tex('\\big(\\langle e_k, e_j\\rangle\\big)', 0.5, 0.05, { baseline: 'top', size: 14 });
          Tl.tex('\\mathcal M(T^*)', 1.9, 0.05, { baseline: 'top', size: 15 });
          Tl.tex('\\mathcal M(T)^*', 3.25, 0.05, { baseline: 'top', size: 15 });
          Tl.tex('\\text{Gram matrix } G', 0.5, 1.28, { size: 13, color: 'muted' });
          Tl.tex('\\mathcal M(T^*) = G^{-1}\\mathcal M(T)^*G', 2.575, 1.28, { size: 13, color: 'muted' });
          st = { MT, MTs, MTst, G, ortho, eq };
          v.legend([['teal', '$e_1$'], ['pink', '$e_2$'], ['accent', '$Te_1$ and its coordinates'], ['red', 'inner products $\\langle Te_1, e_j\\rangle$']]);
        });
        v.readout(() => st && `$\\mathcal M(T) = ${matT(st.MT)}$, $\\mathcal M(T^*) = ${matT(st.MTs)}$, $\\mathcal M(T)^* = ${matT(st.MTst)}$ — ` + (st.eq ? `equal, as 7.9 promises for an orthonormal basis.` : `different: the basis has Gram matrix $G = ${matT(st.G)} \\ne I$, and $\\mathcal M(T^*) = G^{-1}\\mathcal M(T)^*G$ instead.`));
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Definition',
      name: 'Self-adjoint operator',
      statement: String.raw`An operator $T \in \mathcal L(V)$ is **self-adjoint** if $T = T^*$, that is, if
$$\langle Tv, w\rangle = \langle v, Tw\rangle \qquad\text{for all } v, w \in V.$$
By 7.9, $T$ is self-adjoint exactly when its matrix with respect to an orthonormal basis equals its own conjugate transpose: a symmetric matrix when $\mathbf F = \mathbf R$, a Hermitian matrix when $\mathbf F = \mathbf C$.`,
      idea: String.raw`Among operators, the self-adjoint ones play the part that real numbers ($z = \bar z$) play among complex numbers. The payoff, developed through the chapter, is geometric: a self-adjoint operator has real eigenvalues (7.12) and eigenvectors for distinct eigenvalues are orthogonal (7.22), so it simply stretches space along perpendicular axes — the real spectral theorem (7.29). A non-symmetric real matrix may also have real eigenvalues, but then its eigen-directions are skewed.`,
      caption: String.raw`Drag $Te_1$ (teal) and $Te_2$ (pink). In self-adjoint mode the two dashed off-diagonal entries are locked together, $\langle Te_1, e_2\rangle = \langle e_1, Te_2\rangle$; the eigen-directions (green) then always meet at a right angle and lie along the axes of the image ellipse (dotted purple), so $T$ stretches by $\lambda_1$ and $\lambda_2$ along perpendicular axes. Switch to *not self-adjoint*: the entries come unlocked, and the eigen-directions (orange) skew away from the ellipse axes — or vanish altogether.`,
      deps: ['ladr-7.1', 'ladr-5.1'],
      tags: ['self-adjoint'],
      viz(v) {
        const SYM = [[1.3, 0.5], [0.5, -0.6]], NON = [[1.2, 0.9], [0, -0.7]];
        const mode = v.select('$T$', [{ value: 'sa', label: 'self-adjoint: $T = T^*$' }, { value: 'free', label: 'not self-adjoint' }], 'sa', { onChange: (m) => C.set(m === 'sa' ? SYM : NON) });
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.9, 1.9], equal: true, height: 400 });
        const snap = (x, y) => [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
        const h1 = S.handle(SYM[0][0], SYM[1][0], { color: 'teal', label: 'Te₁', constrain: snap });
        const h2 = S.handle(SYM[0][1], SYM[1][1], { color: 'pink', label: 'Te₂', constrain: snap });
        h1.onDrag = () => { if (mode.value === 'sa') h2.x = h1.y; };
        h2.onDrag = () => { if (mode.value === 'sa') h1.y = h2.x; };
        const C = { get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
        let st = null;
        v.render(() => {
          const A = C.A, sa = Math.abs(A[0][1] - A[1][0]) < 1e-9;
          drawEllipse(S, A);
          const sv = v.M.svd(A);
          for (let k = 0; k < 2; k++) { const u = col(sv.U, k), s = sv.S[k]; S.line(-s * u[0], -s * u[1], s * u[0], s * u[1], { color: 'purple', width: 1.6, dash: [2, 4] }); }
          const e = eig2x2(A); let ang = null, ls = null;
          if (e.real && e.l.length === 2) {
            const us = e.l.map((l) => evec2(A, l));
            if (us[0] && us[1]) {
              if (dot(us[0], us[1]) < 0) us[1] = scl(us[1], -1);
              ang = Math.acos(Math.min(1, Math.abs(dot(us[0], us[1])))) * DEG; ls = e.l;
              const perp = Math.abs(ang - 90) < 1e-6, c = perp ? 'green' : 'orange';
              us.forEach((u, i) => {
                S.line(-3 * u[0], -3 * u[1], 3 * u[0], 3 * u[1], { color: c, width: 1.2, alpha: 0.55 });
                const p = scl(u, e.l[i]); S.arrow(0, 0, p[0], p[1], { color: c, width: 2.6 });
                const r = Math.min(2.2, 1.55 / Math.max(Math.abs(u[1]), 1e-9)), q = scl(u, -r * Math.sign((i ? u[1] : u[0]) || 1));
                S.tex(`\\lambda_${i + 1} = ${nm(e.l[i])}`, q[0], q[1], { color: c, size: 14, dy: -14 });
              });
              if (perp) rightMark(S, us[0], us[1], 0.17, 'green'); else angleArc(S, us[0], us[1], 0.32, 'orange', `${nm(ang, 0)}°`);
            }
          }
          S.line(h1.x, 0, h1.x, h1.y, { color: 'teal', width: 1.4, dash: [4, 3] });
          S.line(0, h2.y, h2.x, h2.y, { color: 'pink', width: 1.4, dash: [4, 3] });
          S.text(nmc(h1.y), h1.x, h1.y / 2, { size: 12, color: 'teal', dx: 7, align: 'left', weight: 700 });
          S.text(nmc(h2.x), h2.x / 2, h2.y, { size: 12, color: 'pink', dy: h2.y >= 0 ? -10 : 10, align: 'center', weight: 700 });
          S.arrow(0, 0, h1.x, h1.y, { color: 'teal', width: 2 }); S.arrow(0, 0, h2.x, h2.y, { color: 'pink', width: 2 });
          S.corner(sa ? 'T = T*: eigen-axes perpendicular' : ang !== null ? `T ≠ T*: eigen-axes meet at ${nm(ang, 1)}°` : 'T ≠ T*: no real eigen-directions', 'tl', { color: sa ? 'green' : 'orange', weight: 700 });
          st = { A, sa, ang, ls };
          v.legend([['accent', 'image of the unit circle'], [sa ? 'green' : 'orange', 'eigen-directions, $\\lambda_k u_k$'], ['purple', 'axes of the ellipse', { dash: true }], ['teal', '$\\langle Te_1, e_2\\rangle$', { dash: true }], ['pink', '$\\langle e_1, Te_2\\rangle$', { dash: true }]]);
        });
        v.readout(() => st && `$T = ${matT(st.A)},\\ T^* = ${matT(tp(st.A))}$; $\\langle Te_1, e_2\\rangle = ${nm(st.A[1][0])}$ and $\\langle e_1, Te_2\\rangle = ${nm(st.A[0][1])}$ — ` + (st.sa ? `equal, so $T = T^*$. Eigenvalues $${nm(st.ls ? st.ls[0] : st.A[0][0], 3)}$ and $${nm(st.ls ? st.ls[1] : st.A[1][1], 3)}$, eigenvectors at exactly $90^\\circ$.` : st.ang !== null ? `different, so $T \\ne T^*$; it still has real eigenvalues $${nm(st.ls[0], 3)}, ${nm(st.ls[1], 3)}$, but its eigenvectors meet at $${nm(st.ang, 1)}^\\circ$.` : `different, so $T \\ne T^*$, and this $T$ has no real eigenvalues at all.`));
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Theorem',
      name: 'Eigenvalues of self-adjoint operators are real',
      statement: String.raw`Every eigenvalue of a self-adjoint operator is real.`,
      idea: String.raw`If $Tv = \lambda v$ with $v \ne 0$, then $\lambda\|v\|^2 = \langle Tv, v\rangle = \langle v, Tv\rangle = \bar\lambda\|v\|^2$, the middle step being self-adjointness; so $\lambda = \bar\lambda$. Over $\mathbf R$ this is automatic, so the content lies in complex (Hermitian) matrices: for $\begin{pmatrix} a & b\\ \bar b & d\end{pmatrix}$ with $a, d$ real, the characteristic polynomial has discriminant $(a - d)^2 + 4|b|^2 \ge 0$. Without the conjugate symmetry the middle step fails and eigenvalues leave the real line.`,
      caption: String.raw`Drag the entry $T_{12}$ anywhere in $\mathbf C$ (left) and set the real diagonal entries with the sliders. While the Hermitian switch is on, $T_{21}$ is forced to be the mirror image $\overline{T_{12}}$, and the eigenvalues (right, with gold trails) never leave the real axis however you drag. Switch it off and drag $T_{21}$ on its own: the eigenvalues lift off into the complex plane.`,
      deps: ['ladr-7.10', 'ladr-5.5'],
      tags: ['self-adjoint', 'eigenvalues'],
      credit: 'Cauchy (real symmetric matrices, 1829); Hermite (1855)',
      viz(v) {
        const trail = [];
        const herm = v.toggle('Hermitian: $T_{21} = \\overline{T_{12}}$', true, { onChange: (on) => { trail.length = 0; if (!on) { const r = 0.9, c = Math.cos(1.05), sn = Math.sin(1.05); ch.set(r * (bh.x * c + bh.y * sn), r * (bh.x * sn - bh.y * c)); } } });
        const a = v.slider('$T_{11}$ (real)', -1.5, 1.5, 0.8, { step: 0.05 });
        const d = v.slider('$T_{22}$ (real)', -1.5, 1.5, -0.4, { step: 0.05 });
        const E = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, weight: 0.85, title: 'off-diagonal entries in $\\mathbf C$' });
        const L = v.stage({ x: [-3, 3], y: [-1.8, 1.8], equal: true, height: 340, weight: 1.15, title: 'eigenvalues of $T$ in $\\mathbf C$' });
        const bh = E.handle(0.6, 0.8, { color: 'accent', label: 'T₁₂' });
        const ch = E.handle(0.15, -0.2, { color: 'purple', label: 'T₂₁' });
        // a sample sweep of T₁₂ (honestly computed) so that the trail shows from the start
        for (let k = 0; k <= 160; k++) { const r = 0.15 + (1.1 * k) / 160, t = 0.21 * k, b = [r * Math.cos(t), r * Math.sin(t)]; for (const l of cEig2([[[0.8, 0], b], [cconj(b), [-0.4, 0]]]).ls) trail.push([l[0], l[1]]); }
        let st = null;
        v.render(() => {
          const H = herm.value; ch.visible = !H;
          const b = [bh.x, bh.y], c = H ? [bh.x, -bh.y] : [ch.x, ch.y], T = [[[a.value, 0], b], [c, [d.value, 0]]];
          E.circle(0, 0, 1, { color: 'faint', dash: [3, 4], width: 1 });
          if (H) {
            E.line(b[0], b[1], c[0], c[1], { color: 'purple', dash: [4, 4], width: 1.2 });
            E.dot(c[0], c[1], { r: 6, color: 'purple', hollow: true });
            E.tex('T_{21} = \\overline{T_{12}}', c[0], c[1], { color: 'purple', size: 14, dy: c[1] <= 0 ? 20 : -20 });
          }
          E.arrow(0, 0, b[0], b[1], { color: 'accent', width: 2 }); E.arrow(0, 0, c[0], c[1], { color: 'purple', width: 2 });
          const { ls, vecs } = cEig2(T);
          for (const l of ls) { const last = trail[trail.length - 1]; if (!last || Math.hypot(last[0] - l[0], last[1] - l[1]) > 0.004) trail.push([l[0], l[1]]); }
          if (trail.length > 800) trail.splice(0, trail.length - 800);
          L.line(-5, 0, 5, 0, { color: 'green', width: 4, alpha: 0.35 });
          L.dots(trail, { r: 1.6, color: 'gold', alpha: 0.55 });
          const real = ls.every((l) => Math.abs(l[1]) < 1e-9);
          ls.forEach((l, i) => {
            const ok = Math.abs(l[1]) < 1e-9;
            L.dot(l[0], l[1], { r: 6, color: ok ? 'green' : 'red' });
            L.text(`λ${i ? '₂' : '₁'} = ${czS(ok ? [l[0], 0] : l)}`, l[0], l[1], { size: 12, color: ok ? 'green' : 'red', align: 'center', dy: ok ? (i ? 30 : -16) : l[1] > 0 ? -16 : 16, weight: 700 });
          });
          L.corner(real ? 'eigenvalues on the real axis' : 'eigenvalues off the real axis', 'tl', { color: real ? 'green' : 'red', weight: 700 });
          const u = vecs[0] || [[1, 0], [0, 0]], Tu = cMV(T, u), Tsu = cMV(cStar(T), u);
          st = { H, T, ls, q1: cIP(Tu, u), q2: cIP(u, Tsu), q3: cIP(u, Tu) };
          v.legend([['accent', '$T_{12}$'], ['purple', '$T_{21}$'], ['green', 'real eigenvalue'], ['red', 'non-real eigenvalue'], ['gold', 'trail']]);
        });
        v.readout(() => {
          if (!st) return '';
          const l = st.ls[0];
          return `$T = ${cmatT(st.T)}$, eigenvalues $${czT(st.ls[0], 3)}$ and $${czT(st.ls[1], 3)}$. For a unit eigenvector $v$ of $\\lambda_1$: $\\lambda_1 = \\langle Tv, v\\rangle = \\langle v, T^*v\\rangle = ${czT(st.q2, 3)}$, while $\\langle v, Tv\\rangle = \\bar\\lambda_1 = ${czT(st.q3, 3)}$. ` + (st.H ? `Since $T = T^*$ these are the same number, so $\\lambda_1 = \\bar\\lambda_1$ is real.` : `Now $T^*v \\ne Tv$, the link $\\langle v, T^*v\\rangle = \\langle v, Tv\\rangle$ breaks, and $\\lambda_1$ ${Math.abs(l[1]) < 1e-9 ? 'happens to be real here' : 'is not real'}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Theorem',
      name: 'Over C, Tv ⊥ v for all v ⟹ T = 0',
      statement: String.raw`Suppose $V$ is a complex inner product space and $T \in \mathcal L(V)$. Then
$$\langle Tv, v\rangle = 0 \text{ for every } v \in V \iff T = 0.$$
The analogue for real inner product spaces is false: the rotation of $\mathbf R^2$ by $90^\circ$ has $Tv \perp v$ for every $v \in \mathbf R^2$.`,
      idea: String.raw`Over $\mathbf C$ every value $\langle Tu, w\rangle$ can be recovered from the quadratic form $q(x) = \langle Tx, x\rangle$ by the polarization identity
$$\langle Tu, w\rangle = \tfrac14\big[q(u+w) - q(u-w)\big] + \tfrac i4\big[q(u+iw) - q(u-iw)\big],$$
checked by expanding the right side. So if $q \equiv 0$, then $\langle Tu, w\rangle = 0$ for all $u, w$, and $w = Tu$ gives $Tu = 0$. Over $\mathbf R$ the vectors $u \pm iw$ are not available, and the real half of the identity alone cannot see a rotation.`,
      caption: String.raw`$T$ is the quarter turn $kJ$ (or $k$ times a shear) acting on $\mathbf C^2$. Right: a map of all unit vectors $v = (\cos\alpha, e^{i\varphi}\sin\alpha)$ (every unit vector, up to a phase that does not change $\langle Tv, v\rangle$), shaded by $|\langle Tv, v\rangle|$; along the dashed green lines $v$ is real, and there the quarter turn gives $0$. Drag $v$ off them and $\langle Tv, v\rangle \ne 0$; left, its real part $x$ and imaginary part $y$, whose cross term $\langle Ty, x\rangle$ (red) produces the value. The four dots are the vectors of the polarization identity. Only $k = 0$ blanks the whole map.`,
      deps: ['ladr-6.6'],
      see: ['fa-12.7'],
      tags: ['self-adjoint'],
      viz(v) {
        const which = v.select('$T$', [{ value: 'rot', label: 'quarter turn $kJ$' }, { value: 'shear', label: '$k$ × shear' }], 'rot');
        const K = v.slider('$k$', -1.5, 1.5, 1, { step: 0.05 });
        const Rr = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, weight: 0.85, title: '$v = x + iy$ with $x, y \\in \\mathbf R^2$' });
        const Ch = v.stage({ x: [-16, 376], y: [-7, 97], height: 340, weight: 1.25, xlabel: 'φ (degrees)', ylabel: 'α', xticks: [0, 90, 180, 270, 360], yticks: [0, 45, 90], title: '$|\\langle Tv, v\\rangle|$ for $v = (\\cos\\alpha,\\ e^{i\\varphi}\\sin\\alpha)$' });
        const vh = Ch.handle(125, 62, { color: 'gold', label: 'v', constrain: { x: [0, 360], y: [0, 90] } });
        v.button('make $v$ real', () => vh.set(vh.x < 90 || vh.x > 270 ? 0 : 180, vh.y));
        v.button('$v = (1, i)/\\sqrt2$', () => vh.set(90, 45));
        const Tof = () => { const k = K.value; return which.value === 'rot' ? [[0, -k], [k, 0]] : [[0, k], [0, 0]]; };
        const vec = (phi, al) => { const a = al / DEG, f = phi / DEG; return [[Math.cos(a), 0], [Math.cos(f) * Math.sin(a), Math.sin(f) * Math.sin(a)]]; };
        const q = (Tc, x) => cIP(cMV(Tc, x), x);
        let st = null;
        v.render(() => {
          const T = Tof(), Tc = toC(T), nT = v.M.svd(T).S[0], purple = v.rgb('purple');
          Ch.raster((phi, al) => { if (phi < 0 || phi > 360 || al < 0 || al > 90) return null; const z = cabs(q(Tc, vec(phi, al))) / (nT || 1); return nT < 1e-9 ? null : [purple[0], purple[1], purple[2], Math.round(215 * Math.min(1, z))]; }, { key: `${which.value}|${K.value}`, res: 3 });
          Ch.axes();
          for (const x of [0, 180, 360]) Ch.line(x, 0, x, 90, { color: 'green', dash: [5, 4], width: 1.6 });
          for (const y of [0, 90]) Ch.line(0, y, 360, y, { color: 'green', dash: [5, 4], width: 1.6 });
          Ch.text('real v', 180, 84, { color: 'green', size: 11, dx: 6, align: 'left', weight: 700 });
          [[0, 'e₁+e₂'], [90, 'e₁+ie₂'], [180, 'e₁−e₂'], [270, 'e₁−ie₂']].forEach(([x, s]) => { Ch.dot(x, 45, { r: 4.5, color: 'ink', hollow: true }); Ch.text(s, x, 45, { size: 11, dy: -13, align: x === 0 ? 'left' : x === 360 ? 'right' : 'center', color: 'ink' }); });
          const x = vec(vh.x, vh.y), z = q(Tc, x);
          const re = x.map((c) => c[0]), im = x.map((c) => c[1]), Tre = mv(T, re), Tim = mv(T, im);
          Rr.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          Rr.arrow(0, 0, Tre[0], Tre[1], { color: 'gold', width: 1.4, dash: [5, 4], alpha: 0.8 });
          Rr.arrow(0, 0, Tim[0], Tim[1], { color: 'orange', width: 1.4, dash: [5, 4], alpha: 0.8 });
          if (len(re) > 1e-6) { const f = scl(re, dot(Tim, re) / dot(re, re)); Rr.line(Tim[0], Tim[1], f[0], f[1], { color: 'red', dash: [2, 3], width: 1.2 }); Rr.line(0, 0, f[0], f[1], { color: 'red', width: 4, alpha: 0.75 }); }
          Rr.arrow(0, 0, re[0], re[1], { color: 'gold', width: 2.6 }); tip(Rr, 'x', re, 'gold');
          if (len(im) > 0.02) { Rr.arrow(0, 0, im[0], im[1], { color: 'orange', width: 2.6 }); tip(Rr, 'y', im, 'orange'); }
          if (len(Tre) > 0.05) tip(Rr, 'Tx', Tre, 'gold', { size: 13 });
          if (len(Tim) > 0.05) tip(Rr, 'Ty', Tim, 'orange', { size: 13 });
          Rr.corner(`⟨Tv, v⟩ = ${czS(z, 3)}`, 'tl', { color: cabs(z) < 1e-9 ? 'green' : 'purple', weight: 700 });
          const e1 = [[1, 0], [0, 0]], e2 = [[0, 0], [1, 0]], ie2 = [[0, 0], [0, 1]];
          const q1 = q(Tc, [cadd(e1[0], e2[0]), cadd(e1[1], e2[1])]), q2 = q(Tc, [csub(e1[0], e2[0]), csub(e1[1], e2[1])]);
          const q3 = q(Tc, [cadd(e1[0], ie2[0]), cadd(e1[1], ie2[1])]), q4 = q(Tc, [csub(e1[0], ie2[0]), csub(e1[1], ie2[1])]);
          const realHalf = csc(csub(q1, q2), 0.25), rhs = cadd(realHalf, cmul([0, 0.25], csub(q3, q4)));
          st = { x, z, q1, q2, q3, q4, realHalf, rhs, lhs: cIP(cMV(Tc, e1), e2), k: K.value, rot: which.value === 'rot', Txy: dot(Tim, re), Tyx: dot(Tre, im), qx: dot(Tre, re), qy: dot(Tim, im) };
          v.legend([['gold', '$x = \\operatorname{Re} v$, $Tx$'], ['orange', '$y = \\operatorname{Im} v$, $Ty$'], ['red', 'part of $Ty$ along $x$'], ['purple', '$|\\langle Tv, v\\rangle|$', { area: true }], ['green', 'real $v$', { dash: true }]]);
        });
        v.readout(() => st && `$v = ${crowT(st.x)}$: $\\langle Tv, v\\rangle = \\langle Tx, x\\rangle + \\langle Ty, y\\rangle + i\\big(\\langle Ty, x\\rangle - \\langle Tx, y\\rangle\\big) = ${nm(st.qx, 3)} + ${nm(st.qy, 3)} + i(${nm(st.Txy, 3)} - (${nm(st.Tyx, 3)})) = ${czT(st.z, 3)}$. Polarization with $u = e_1$, $w = e_2$: $\\langle Tu, w\\rangle = \\tfrac14\\big[(${czT(st.q1)}) - (${czT(st.q2)})\\big] + \\tfrac i4\\big[(${czT(st.q3)}) - (${czT(st.q4)})\\big] = ${czT(st.rhs, 3)}$, and indeed $\\langle Te_1, e_2\\rangle = ${czT(st.lhs, 3)}$. Real vectors alone supply only the first bracket, $${czT(st.realHalf, 3)}$` + (st.rot && Math.abs(st.k) > 1e-9 ? ': zero, so over $\\mathbf R$ the quarter turn is invisible to the form.' : '.'));
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Theorem',
      name: 'Over C, ⟨Tv, v⟩ real for all v ⟺ T self-adjoint',
      statement: String.raw`Suppose $V$ is a complex inner product space and $T \in \mathcal L(V)$. Then
$$T \text{ is self-adjoint} \iff \langle Tv, v\rangle \in \mathbf R \text{ for every } v \in V.$$
This fails for real inner product spaces, where every $\langle Tv, v\rangle$ is real whether or not $T$ is self-adjoint.`,
      idea: String.raw`For every $v$, $\langle T^*v, v\rangle = \langle v, Tv\rangle = \overline{\langle Tv, v\rangle}$, so $\langle (T - T^*)v, v\rangle = \langle Tv, v\rangle - \overline{\langle Tv, v\rangle} = 2i\operatorname{Im}\langle Tv, v\rangle$. By 7.13 applied to $T - T^*$, this vanishes for all $v$ exactly when $T = T^*$. More quantitatively, $\operatorname{Im}\langle Tv, v\rangle = \langle Kv, v\rangle$ with $K = (T - T^*)/2i$ self-adjoint, so over unit vectors the imaginary parts fill the interval between the least and the greatest eigenvalue of $K$.`,
      caption: String.raw`The gold point is $\langle Tv, v\rangle$ for a unit vector $v \in \mathbf C^2$ that wanders over the whole unit sphere; the small dots, one for each vector of a grid on the sphere, fill the shaded region of all such values (for a $2 \times 2$ matrix an elliptical disc whose foci are the eigenvalues, drawn as hollow dots). The red band is the range of imaginary parts. Slide the non-Hermitian part $\varepsilon$ to $0$: $T$ becomes self-adjoint, the band closes, and the whole region collapses onto a segment of the real axis.`,
      deps: ['ladr-7.13', 'ladr-7.10'],
      tags: ['self-adjoint'],
      viz(v) {
        const HS = { a: [[[1.1, 0], [0.4, 0.5]], [[0.4, -0.5], [-0.8, 0]]], b: [[[0.3, 0], [0.9, 0]], [[0.9, 0], [-0.5, 0]]] };
        const N = [[[0.1, 0.5], [0.9, 0.2]], [[-0.4, 0.1], [0, -0.6]]];
        const which = v.select('Hermitian part $H$', [{ value: 'a', label: 'complex $H$' }, { value: 'b', label: 'real symmetric $H$' }], 'a');
        const eps = v.slider('non-Hermitian part $\\varepsilon$ in $T = H + \\varepsilon N$', 0, 1, 0.6, { step: 0.01 });
        const P = v.stage({ x: [-2.2, 2.2], y: [-1.3, 1.3], equal: true, height: 320, title: '$\\langle Tv, v\\rangle$ for unit vectors $v \\in \\mathbf C^2$' });
        const vec = (t) => { const a = (Math.PI / 4) * (1 - Math.cos(0.73 * t)), f = 1.9 * t; return [[Math.cos(a), 0], [Math.cos(f) * Math.sin(a), Math.sin(f) * Math.sin(a)]]; };
        let st = null;
        v.animate((t) => {
          const e = eps.value, T = cMadd(HS[which.value], cMsc(N, [e, 0])), Ts = cStar(T), herm = e < 1e-9;
          const K = cMsc(cMsub(T, Ts), [0, -0.5]), [kmax, kmin] = hermEig(K);
          if (!herm) P.hband(kmin, kmax, { color: 'red', alpha: 0.07, edges: true });
          P.hline(0, { color: 'green', width: 1.6, alpha: 0.6 });
          const bd = numRange(T);
          if (herm) { const [l1, l2] = hermEig(T); P.line(l2, 0, l1, 0, { color: 'green', width: 6, alpha: 0.8 }); }
          else P.poly(bd, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.6 });
          const cloud = []; for (let i = 0; i <= 12; i++) for (let j = 0; j < 24; j++) { const a = (Math.PI / 2) * (i / 12), f = (TAU * j) / 24, x = [[Math.cos(a), 0], [Math.cos(f) * Math.sin(a), Math.sin(f) * Math.sin(a)]]; cloud.push(cIP(cMV(T, x), x)); }
          P.dots(cloud, { r: 1.7, color: herm ? 'green' : 'accent', alpha: 0.45 });
          const tr = []; for (let k = 0; k <= 360; k++) { const x = vec(t - 12 + (12 * k) / 360); tr.push(cIP(cMV(T, x), x)); }
          P.path(tr, { color: 'gold', width: 1.4, alpha: 0.55 });
          const { ls } = cEig2(T);
          ls.forEach((l) => P.dot(l[0], l[1], { r: 4.5, color: 'ink', hollow: true }));
          const x = vec(t), z = cIP(cMV(T, x), x);
          P.dot(z[0], z[1], { r: 6, color: 'gold' });
          P.corner(herm ? 'T = T*: every ⟨Tv, v⟩ is real' : `Im⟨Tv, v⟩ ranges over [${nmc(kmin)}, ${nmc(kmax)}]`, 'tl', { color: herm ? 'green' : 'red', weight: 700 });
          st = { T, z, kmin, kmax, herm, x, gap: cFro(cMsub(T, Ts)) };
          v.legend([['gold', '$\\langle Tv, v\\rangle$ and its trail'], [herm ? 'green' : 'accent', 'all values $\\langle Tv, v\\rangle$', { area: true }], ['ink', 'eigenvalues', { dot: true }], ['red', 'range of imaginary parts', { area: true }]]);
        }, { period: 60 });
        v.readout(() => st && `$T = ${cmatT(st.T)}$, $\\|T - T^*\\| = ${nm(st.gap, 3)}$. Now $v = ${crowT(st.x)}$ gives $\\langle Tv, v\\rangle = ${czT(st.z, 3)}$. ` + (st.herm ? `$T$ is self-adjoint, so every value is real: the region is the segment between the eigenvalues.` : `$\\operatorname{Im}\\langle Tv, v\\rangle = \\langle Kv, v\\rangle$ with $K = \\tfrac{1}{2i}(T - T^*)$, whose eigenvalues $${nm(st.kmin, 3)}$ and $${nm(st.kmax, 3)}$ bound the imaginary parts; they are not all $0$, so $T \\ne T^*$.`));
      },
    },
    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Theorem',
      name: 'Self-adjoint and ⟨Tv, v⟩ = 0 for all v ⟹ T = 0',
      statement: String.raw`Suppose $T$ is a self-adjoint operator on $V$ (real or complex). Then
$$\langle Tv, v\rangle = 0 \text{ for every } v \in V \iff T = 0.$$`,
      idea: String.raw`Over $\mathbf C$ this is 7.13, which does not even need self-adjointness. Over $\mathbf R$, self-adjointness gives $\langle Tw, u\rangle = \langle w, Tu\rangle = \langle Tu, w\rangle$, and with it the real polarization identity $\langle Tu, w\rangle = \tfrac14\big[\langle T(u+w), u+w\rangle - \langle T(u-w), u-w\rangle\big]$. If the form vanishes, so does every $\langle Tu, w\rangle$, and $w = Tu$ forces $Tu = 0$. Geometrically the form sees only the symmetric part of $T$: a skew part pushes every unit vector sideways and contributes nothing.`,
      caption: String.raw`$T$ is the symmetric matrix with entries $a, b, d$ plus a skew part $k$. Left: at points $v$ of the unit circle, $Tv$ (grey arrows, half scale) and its radial component $\langle Tv, v\rangle v$ — blue outward, red inward; the coloured curve hugs the circle (green) exactly where the form vanishes. Right: $q(\theta) = \langle Tv, v\rangle$ against the dashed levels $\pm\|T\|$. For self-adjoint $T$ the curve reaches $\pm\|T\|$, so $q \equiv 0$ forces $T = 0$. Pick the quarter turn: $q \equiv 0$ although $\|T\| = |k|$.`,
      deps: ['ladr-7.13', 'ladr-7.10'],
      tags: ['self-adjoint'],
      viz(v) {
        const PRE = { sa: [0.9, 0.5, -0.4, 0], rot: [0, 0, 0, 1], mix: [0.3, 0.2, 0.1, 0.9] };
        v.select('preset', [{ value: 'sa', label: 'self-adjoint' }, { value: 'rot', label: 'quarter turn' }, { value: 'mix', label: 'self-adjoint + skew' }], 'sa', { onChange: (k) => { const p = PRE[k]; A.set(p[0]); B.set(p[1]); D.set(p[2]); K.set(p[3]); } });
        const A = v.slider('$a$', -1.2, 1.2, 0.9, { step: 0.05 }), B = v.slider('$b$', -1.2, 1.2, 0.5, { step: 0.05 });
        const D = v.slider('$d$', -1.2, 1.2, -0.4, { step: 0.05 }), K = v.slider('skew part $k$', -1.2, 1.2, 0, { step: 0.05 });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, title: '$T = \\begin{pmatrix} a & b - k\\\\ b + k & d\\end{pmatrix}$ on the unit circle' });
        const G = v.stage({ x: [0, 180], y: [-1.8, 1.8], height: 360, xlabel: 'θ (degrees)', xticks: [0, 45, 90, 135, 180], title: '$q(\\theta) = \\langle Tv, v\\rangle$, $v = (\\cos\\theta, \\sin\\theta)$' });
        let st = null;
        v.render(() => {
          const a = A.value, b = B.value, d = D.value, k = K.value, T = [[a, b - k], [b + k, d]];
          const q = (t) => { const u = [Math.cos(t), Math.sin(t)]; return dot(mv(T, u), u); };
          const nT = v.M.svd(T).S[0];
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          for (let i = 0; i < 24; i++) {
            const t = (TAU * i) / 24, p = [Math.cos(t), Math.sin(t)], Tp = scl(mv(T, p), 0.5), r = dot(Tp, p);
            S.arrow(p[0], p[1], p[0] + Tp[0], p[1] + Tp[1], { color: 'muted', width: 1.2, alpha: 0.55, head: 6 });
            if (Math.abs(r) > 1e-9) S.line(p[0], p[1], p[0] + r * p[0], p[1] + r * p[1], { color: r > 0 ? 'blue' : 'red', width: 3.2 });
          }
          let prev = null, maxq = 0;
          for (let i = 0; i <= 240; i++) {
            const t = (TAU * i) / 240, qt = q(t), r = 1 + 0.5 * qt, p = [r * Math.cos(t), r * Math.sin(t)];
            maxq = Math.max(maxq, Math.abs(qt));
            if (prev) { const qm = q(t - TAU / 480); S.line(prev[0], prev[1], p[0], p[1], { color: Math.abs(qm) < 1e-9 ? 'green' : qm > 0 ? 'blue' : 'red', width: 2.2 }); }
            prev = p;
          }
          const zero = nT < 1e-9, flat = maxq < 1e-9;
          S.corner(zero ? 'T = 0, so q ≡ 0' : flat ? 'q ≡ 0, yet T ≠ 0' : `max |q| = ${nmc(maxq, 3)}`, 'tl', { color: zero ? 'green' : flat ? 'red' : 'ink', weight: 700 });
          if (nT > 1e-9) { G.hline(nT, { color: 'orange', dash: [6, 4], width: 1.4 }); G.hline(-nT, { color: 'orange', dash: [6, 4], width: 1.4 }); G.text('‖T‖', 178, nT, { color: 'orange', size: 12, align: 'right', dy: -9, weight: 700 }); }
          G.fn((x) => len(mv(T, [Math.cos(x / DEG), Math.sin(x / DEG)])), { color: 'muted', width: 1.4 });
          G.fn((x) => q(x / DEG), { color: 'purple', width: 2.6 });
          G.corner(Math.abs(k) < 1e-9 ? 'self-adjoint: max |q| = ‖T‖' : 'skew part present: max |q| < ‖T‖', 'tr', { color: Math.abs(k) < 1e-9 ? 'green' : 'red', weight: 700 });
          st = { T, maxq, nT, b, k };
          v.legend([['purple', '$q(\\theta) = \\langle Tv, v\\rangle$'], ['muted', '$\\|Tv\\|$'], ['orange', '$\\pm\\|T\\|$', { dash: true }], ['blue', 'radial part outward'], ['red', 'radial part inward']]);
        });
        v.readout(() => st && `$T = ${matT(st.T)}$: $\\max_{\\|v\\| = 1}|\\langle Tv, v\\rangle| = ${nm(st.maxq, 3)}$ and $\\|T\\| = ${nm(st.nT, 3)}$. The real polarization identity gives $\\tfrac14\\big[q(e_1 + e_2) - q(e_1 - e_2)\\big] = ${nm(st.b, 3)}$, against $\\langle Te_1, e_2\\rangle = ${nm(st.b + st.k, 3)}$ — ` + (Math.abs(st.k) < 1e-9 ? `equal, because $T$ is self-adjoint; so the form determines $T$.` : `unequal: the skew part $k$ is invisible to the form, which is why the theorem needs $T = T^*$.`));
      },
    },
    // ------------------------------------------------------------------ 7.18
    {
      num: '7.18',
      kind: 'Definition',
      name: 'Normal operator',
      statement: String.raw`An operator $T \in \mathcal L(V)$ is **normal** if it commutes with its adjoint:
$$TT^* = T^*T.$$`,
      idea: String.raw`Every self-adjoint operator is normal, but so is, for instance, $\begin{pmatrix} 2 & -3\\ 3 & 2\end{pmatrix}$, for which $TT^* = T^*T = 13I$ although $T \ne T^*$. For a real $2 \times 2$ matrix $\begin{pmatrix} a & b\\ c & d\end{pmatrix}$ one computes $TT^* - T^*T = \begin{pmatrix} b^2 - c^2 & (a - d)(c - b)\\ (a - d)(c - b) & c^2 - b^2\end{pmatrix}$, so $T$ is normal exactly when $b = c$ (symmetric) or when $b = -c$ and $a = d$ (a rotation followed by a scaling). Normal operators turn out to be precisely the ones the complex spectral theorem (7.31) diagonalizes in an orthonormal basis.`,
      caption: String.raw`Drag the gold point $(b, c) = (T_{12}, T_{21})$ over the map of $\|TT^* - T^*T\|$ (deeper red = farther from normal), and set the diagonal with the sliders. The normal matrices live on the green lines: the diagonal $b = c$ (symmetric) always, the anti-diagonal $b = -c$ (rotation-scaling) only when $a = d$ — move one slider and that line fades. The point snaps onto them. Right: $TT^*$, $T^*T$ and their difference, framed green when it vanishes.`,
      deps: ['ladr-7.1', 'ladr-5.71'],
      tags: ['normal'],
      credit: 'Otto Toeplitz, 1918',
      viz(v) {
        const PRE = { shear: [0.8, 0.8, 1, 0], rot: [0.5, 0.5, -1.1, 1.1], sym: [1, -0.5, 0.7, 0.7], skew: [0, 0, -1.2, 1.2] };
        v.select('preset', [{ value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotation-scaling' }, { value: 'sym', label: 'symmetric' }, { value: 'skew', label: 'skew' }], 'shear', { onChange: (k) => { const p = PRE[k]; Ad.set(p[0]); Dd.set(p[1]); bh.set(p[2], p[3]); } });
        const Ad = v.slider('$a = T_{11}$', -1.5, 1.5, 0.8, { step: 0.1 }), Dd = v.slider('$d = T_{22}$', -1.5, 1.5, 0.8, { step: 0.1 });
        const P = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, height: 360, xlabel: 'b', ylabel: 'c', title: '$\\|TT^* - T^*T\\|$ over $(b, c) = (T_{12}, T_{21})$' });
        const Q = v.stage({ x: [-0.15, 3.75], y: [-0.75, 1.65], equal: true, axes: false, height: 360, weight: 1.05 });
        const eqAD = () => Math.abs(Ad.value - Dd.value) < 1e-6;
        const bh = P.handle(1, 0, {
          color: 'gold', label: 'T', constrain: (x, y) => {
            if (Math.abs(x - y) < 0.08) { const m = Math.round(((x + y) / 2) * 20) / 20; return [m, m]; }
            if (eqAD() && Math.abs(x + y) < 0.08) { const m = Math.round(((x - y) / 2) * 20) / 20; return [m, -m]; }
            return [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
          },
        });
        let st = null;
        v.render(() => {
          const a = Ad.value, d = Dd.value, b = bh.x, c = bh.y, T = [[a, b], [c, d]], Ts = tp(T), red = v.rgb('red');
          P.raster((x, y) => { const f = Math.sqrt(2 * (x * x - y * y) ** 2 + 2 * (a - d) ** 2 * (x - y) ** 2); return [red[0], red[1], red[2], Math.round(150 * Math.pow(Math.min(1, f / 3), 0.6))]; }, { key: `${a.toFixed(2)}|${d.toFixed(2)}`, res: 3 });
          P.axes();
          P.line(-3, -3, 3, 3, { color: 'green', width: 2.6 });
          P.tex('b = c\\ \\text{(symmetric)}', 0.3, 1.62, { color: 'green', size: 13, align: 'left' });
          if (eqAD()) { P.line(-3, 3, 3, -3, { color: 'green', width: 2.6 }); P.tex('b = -c\\ \\text{and}\\ a = d', 0.3, -1.62, { color: 'green', size: 13, align: 'left' }); }
          else { P.line(-3, 3, 3, -3, { color: 'muted', width: 1.2, dash: [5, 5] }); P.tex('b = -c\\ \\text{needs}\\ a = d', 0.3, -1.62, { color: 'muted', size: 13, align: 'left' }); }
          const C1 = mm(T, Ts), C2 = mm(Ts, T), Cm = msub(C1, C2), gap = fro(Cm), normal = gap < 1e-9;
          Q.text(normal ? 'normal: TT* = T*T' : `not normal: ‖TT* − T*T‖ = ${nmc(gap)}`, 1.8, -0.5, { size: 14, align: 'center', color: normal ? 'green' : 'red', weight: 700 });
          drawTile(Q, C1, 0, 0.15, 1); drawTile(Q, C2, 1.35, 0.15, 1); drawTile(Q, Cm, 2.7, 0.15, 1, { frame: normal ? 'green' : 'red' });
          Q.tex('-', 1.175, 0.65, { size: 22 }); Q.tex('=', 2.525, 0.65, { size: 22, color: normal ? 'green' : 'red' });
          Q.tex('TT^*', 0.5, 0.05, { baseline: 'top', size: 15 }); Q.tex('T^*T', 1.85, 0.05, { baseline: 'top', size: 15 }); Q.tex('TT^* - T^*T', 3.2, 0.05, { baseline: 'top', size: 15 });
          Q.tex(`T = ${matT(T, 2)}`, 1.8, 1.45, { size: 14, color: 'muted' });
          st = { T, gap, normal, kind: normal ? (Math.abs(b - c) < 1e-9 ? 'sym' : 'rot') : null };
        });
        v.readout(() => st && `$T = ${matT(st.T)}$, $T^* = ${matT(tp(st.T))}$, $\\|TT^* - T^*T\\| = ${nm(st.gap, 3)}$: ` + (st.kind === 'sym' ? `$T$ is symmetric, hence self-adjoint, hence normal.` : st.kind === 'rot' ? `$T = aI + cJ$ with $J$ the quarter turn — normal although $T \\ne T^*$ (unless $c = 0$).` : `$T$ does not commute with $T^*$, so it is not normal.`));
      },
    },
    // ------------------------------------------------------------------ 7.20
    {
      num: '7.20',
      kind: 'Theorem',
      name: 'Normal ⟺ ‖Tv‖ = ‖T*v‖ for all v',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then
$$T \text{ is normal} \iff \|Tv\| = \|T^*v\| \text{ for every } v \in V.$$`,
      idea: String.raw`$\|Tv\|^2 - \|T^*v\|^2 = \langle T^*Tv, v\rangle - \langle TT^*v, v\rangle = \langle (T^*T - TT^*)v, v\rangle$. The operator $T^*T - TT^*$ is self-adjoint, so by 7.16 its quadratic form vanishes identically exactly when it is $0$ — that is, exactly when $T$ is normal. Geometrically: $T$ and $T^*$ stretch every vector by the same factor, so they carry the unit circle onto the same ellipse, though they may run around it differently.`,
      caption: String.raw`The unit vector $v$ (gold) runs round the circle while $Tv$ (blue) and $T^*v$ (orange, dashed) trace their images. For a normal $T$ both tips always lie on one dotted circle about $0$, the two traces cover the same ellipse, and on the right the graphs of $\|Tv\|$ and $\|T^*v\|$ coincide. Choose the shear, or add a shear $s$ to a normal matrix: the norms separate (red gap) and the images become two different ellipses.`,
      deps: ['ladr-7.18', 'ladr-7.16'],
      see: ['fa-12.11'],
      tags: ['normal'],
      viz(v) {
        const PRE = { rs: [[0.9, -1.2], [1.2, 0.9]], sym: [[1.3, 0.6], [0.6, 0.1]], shear: [[0.8, 1.2], [0, 0.8]] };
        const pre = v.select('$T_0$', [{ value: 'rs', label: 'rotation-scaling' }, { value: 'sym', label: 'symmetric' }, { value: 'shear', label: 'shear' }], 'rs');
        const sh = v.slider('add shear $s$ to $T_{12}$', -1, 1, 0, { step: 0.05 });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, height: 360 });
        const G = v.stage({ x: [0, 360], y: [0, 2.6], height: 360, xlabel: 'θ (degrees)', xticks: [0, 90, 180, 270, 360], title: '$\\|Tv\\|$ and $\\|T^*v\\|$ for $v = (\\cos\\theta, \\sin\\theta)$' });
        let st = null;
        v.animate((t) => {
          const T = PRE[pre.value].map((r) => r.slice()); T[0][1] += sh.value;
          const Ts = tp(T), th = ((t % 8) / 8) * TAU, vv = [Math.cos(th), Math.sin(th)], Tv = mv(T, vv), Tsv = mv(Ts, vv);
          const fT = ellPts(T, 180), fS = ellPts(Ts, 180), n = Math.max(1, Math.round((th / TAU) * 180));
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(fT, { close: true, color: 'accent', width: 1, alpha: 0.3 });
          S.path(fS, { close: true, color: 'orange', width: 1, alpha: 0.35, dash: [5, 4] });
          S.path(fT.slice(0, n + 1), { color: 'accent', width: 2.6 });
          S.path(fS.slice(0, n + 1), { color: 'orange', width: 2.6, dash: [7, 5] });
          S.circle(0, 0, len(Tv), { color: 'accent', width: 1.2, dash: [2, 3], alpha: 0.7 });
          S.circle(0, 0, len(Tsv), { color: 'orange', width: 1.2, dash: [2, 3], alpha: 0.7 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 }); tip(S, 'v', vv, 'gold', { size: 14 });
          S.arrow(0, 0, Tv[0], Tv[1], { color: 'accent', width: 2.6 }); tip(S, 'Tv', Tv, 'accent');
          S.arrow(0, 0, Tsv[0], Tsv[1], { color: 'orange', width: 2.6, dash: [6, 4] }); tip(S, 'T^*v', Tsv, 'orange');
          const fn = (A) => (x) => len(mv(A, [Math.cos(x / DEG), Math.sin(x / DEG)]));
          G.between(fn(T), fn(Ts), 0, 360, { fill: 'red', fillAlpha: 0.22 });
          G.fn(fn(T), { color: 'accent', width: 2.6 }); G.fn(fn(Ts), { color: 'orange', width: 2.6, dash: [7, 5] });
          G.vline(th * DEG, { color: 'gold', width: 1.4 });
          G.dot(th * DEG, len(Tv), { r: 4.5, color: 'accent' }); G.dot(th * DEG, len(Tsv), { r: 4.5, color: 'orange' });
          let gap = 0; for (let k = 0; k < 360; k += 2) gap = Math.max(gap, Math.abs(fn(T)(k) - fn(Ts)(k)));
          const comm = fro(msub(mm(Ts, T), mm(T, Ts))), normal = comm < 1e-9;
          S.corner(normal ? 'normal: ‖Tv‖ = ‖T*v‖ for every v' : `not normal: gap up to ${nmc(gap, 3)}`, 'tl', { color: normal ? 'green' : 'red', weight: 700 });
          const form = dot(mv(msub(mm(Ts, T), mm(T, Ts)), vv), vv);
          st = { T, th, a: len(Tv), b: len(Tsv), gap, comm, form, normal };
          v.legend([['gold', '$v$'], ['accent', '$Tv$ and $\\|Tv\\|$'], ['orange', '$T^*v$ and $\\|T^*v\\|$', { dash: true }], ['red', 'gap', { area: true }]]);
        }, { period: 8 });
        v.readout(() => st && `$T = ${matT(st.T)}$, $\\theta = ${nm(st.th * DEG, 0)}^\\circ$: $\\|Tv\\| = ${nm(st.a, 3)}$, $\\|T^*v\\| = ${nm(st.b, 3)}$, and $\\|Tv\\|^2 - \\|T^*v\\|^2 = \\langle (T^*T - TT^*)v, v\\rangle = ${nm(st.form, 3)}$. Over the whole circle the gap is at most $${nm(st.gap, 3)}$, and $\\|T^*T - TT^*\\| = ${nm(st.comm, 3)}$ — ` + (st.normal ? 'both zero: $T$ is normal.' : 'both nonzero: $T$ is not normal.'));
      },
    },
    // ------------------------------------------------------------------ 7.21
    {
      num: '7.21',
      kind: 'Theorem',
      name: 'Range, null space and eigenvectors of a normal operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is normal. Then
(a) $\operatorname{null} T = \operatorname{null} T^*$;
(b) $\operatorname{range} T = \operatorname{range} T^*$;
(c) $V = \operatorname{null} T \oplus \operatorname{range} T$ (and the two summands are orthogonal);
(d) $T - \lambda I$ is normal for every $\lambda \in \mathbf F$;
(e) if $v \in V$ and $\lambda \in \mathbf F$, then $Tv = \lambda v$ if and only if $T^*v = \bar\lambda v$.`,
      idea: String.raw`(a) $\|Tv\| = \|T^*v\|$ (7.20), so one vanishes exactly when the other does. (b) By 7.6, $\operatorname{range} T = (\operatorname{null} T^*)^\perp = (\operatorname{null} T)^\perp = \operatorname{range} T^*$. (c) $V = \operatorname{null} T \oplus (\operatorname{null} T)^\perp$ (6.49), and the complement is $\operatorname{range} T^* = \operatorname{range} T$. (d) Expanding, $(T - \lambda I)(T - \lambda I)^*$ and $(T - \lambda I)^*(T - \lambda I)$ both equal $TT^* - \bar\lambda T - \lambda T^* + |\lambda|^2 I$. (e) Apply (a) to the normal operator $T - \lambda I$, whose adjoint is $T^* - \bar\lambda I$.`,
      caption: String.raw`$T$ acts on $\mathbf R^3$ as a rotation-and-scaling of the blue plane and kills the red line; drag the background to rotate the view. While the non-normal part $s$ is $0$, $T$ is normal: $\operatorname{null} T$ (red) coincides with $\operatorname{null} T^*$ (green dashed), $\operatorname{range} T$ (blue) with $\operatorname{range} T^*$ (orange ring), and line and plane are perpendicular. For $w$ in the plane, $Tw$ and $T^*w$ are mirror images about $w$ — the real shadow of (e) for the complex eigenvalues $0.6 \pm 0.9i$. Raise $s$: the null spaces split, the ranges tilt apart, and the angle between $\operatorname{null} T$ and $\operatorname{range} T$ drops below $90^\circ$. Drag $w$ (it snaps onto $\operatorname{null} T$) to compare $\|Tw\|$ and $\|T^*w\|$.`,
      deps: ['ladr-7.20', 'ladr-7.6', 'ladr-6.49'],
      tags: ['normal'],
      viz(v) {
        const M = v.M, a = 0.6, b = 0.9;
        const q3 = unit([0.3, 0.25, 1]), q1 = unit(cross(q3, [0, 0, 1])), q2 = cross(q3, q1), Qm = [0, 1, 2].map((i) => [q1[i], q2[i], q3[i]]);
        const sl = v.slider('non-normal part $s$', 0, 1.5, 0, { step: 0.05 });
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.35, axis: 1.5, lim: 1.4 });
        let nul = q3;
        const ez0 = [Math.sin(-0.5) * Math.cos(0.35), Math.cos(-0.5) * Math.cos(0.35), -Math.sin(0.35)], mjr = unit(cross(q3, ez0)); // the plane's long axis on screen
        const wh = sc.handle(scl(mjr, 1.0), { color: 'gold', label: 'w', snap: (p) => { const r = len(p); if (r < 1e-6) return p; const c = dot(p, nul) / r; return Math.abs(c) > Math.cos(7 / DEG) ? scl(nul, Math.sign(c) * r) : p; } });
        const ring = (e, f, r, st) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = (TAU * k) / 60; pts.push(add(scl(e, r * Math.cos(t)), scl(f, r * Math.sin(t)))); } sc.path(pts, st); };
        let st = null;
        v.render(() => {
          const s = sl.value, N = [[a, -b, s], [b, a, 0], [0, 0, 0]], T = mm(mm(Qm, N), tp(Qm)), Ts = tp(T);
          const nT = M.nullspace(T, 1e-9)[0], nTs = M.nullspace(Ts, 1e-9)[0];
          nul = nT;
          const U1 = M.svd(T).U, U2 = M.svd(Ts).U, rT = [col(U1, 0), col(U1, 1)], rS = [col(U2, 0), col(U2, 1)];
          const nrm = unit(cross(rT[0], rT[1])), ang = Math.asin(Math.min(1, Math.abs(dot(nT, nrm)))) * DEG;
          const w = wh.p, Tw = mv(T, w), Tsw = mv(Ts, w);
          sc.begin();
          sc.disc(rT[0], rT[1], 1.5, { fill: 'accent', fillAlpha: 0.12, color: 'accent', grid: true });
          ring(rS[0], rS[1], 1.5, { color: 'orange', width: 2, dash: [6, 4] });
          sc.line(scl(nT, -1.4), scl(nT, 1.4), { color: 'red', width: 3.4 });
          sc.line(scl(nTs, -1.4), scl(nTs, 1.4), { color: 'green', width: 2, dash: [6, 4], top: true });
          sc.tex('\\operatorname{null} T', scl(nT, 1.4), { color: 'red', size: 14, dx: 34, dy: 0 });
          sc.tex('\\operatorname{null} T^*', scl(nTs, -1.4), { color: 'green', size: 14, dx: 38, dy: 0 });
          sc.tex('\\operatorname{range} T', scl(unit(sub(mjr, scl(nrm, dot(mjr, nrm)))), -1.2), { color: 'accent', size: 14, dy: -12 });
          sc.arrow([0, 0, 0], Tw, { color: 'accent', width: 2.4 }); sc.tex('Tw', Tw, { color: 'accent', size: 14, dx: 12, dy: -8 });
          sc.arrow([0, 0, 0], Tsw, { color: 'orange', width: 2.4 }); sc.tex('T^*w', Tsw, { color: 'orange', size: 14, dx: 14, dy: 8 });
          sc.arrow([0, 0, 0], w, { color: 'gold', width: 2.4 });
          sc.flush();
          const comm = fro(msub(mm(T, Ts), mm(Ts, T))), normal = comm < 1e-9;
          S.corner(normal ? 'normal: null T ⊥ range T' : `not normal: null T at ${nm(ang, 1)}° to range T`, 'tl', { color: normal ? 'green' : 'red', weight: 700 });
          st = { comm, normal, ang, nullAng: Math.acos(Math.min(1, Math.abs(dot(nT, nTs)))) * DEG, ranAng: Math.acos(Math.min(1, Math.abs(dot(nrm, unit(cross(rS[0], rS[1])))))) * DEG, a: len(Tw), b: len(Tsw) };
          v.legend([['accent', '$\\operatorname{range} T$, $Tw$'], ['orange', '$\\operatorname{range} T^*$, $T^*w$', { dash: true }], ['red', '$\\operatorname{null} T$'], ['green', '$\\operatorname{null} T^*$', { dash: true }], ['gold', '$w$']]);
        });
        v.readout(() => st && `$\\|TT^* - T^*T\\| = ${nm(st.comm, 3)}$. (a) $\\operatorname{null} T$ and $\\operatorname{null} T^*$ meet at $${nm(st.nullAng, 1)}^\\circ$; (b) $\\operatorname{range} T$ and $\\operatorname{range} T^*$ are tilted $${nm(st.ranAng, 1)}^\\circ$ apart; (c) $\\operatorname{null} T$ makes $${nm(st.ang, 1)}^\\circ$ with $\\operatorname{range} T$. For the gold $w$: $\\|Tw\\| = ${nm(st.a, 3)}$, $\\|T^*w\\| = ${nm(st.b, 3)}$` + (st.normal ? ' — equal, as 7.20 requires, which is what drives (a)–(c).' : ' — different in general: $T$ is no longer normal.'));
      },
    },
    // ------------------------------------------------------------------ 7.22
    {
      num: '7.22',
      kind: 'Theorem',
      name: 'Orthogonal eigenvectors for normal operators',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is normal. Then eigenvectors of $T$ corresponding to distinct eigenvalues are orthogonal.`,
      idea: String.raw`Let $Tu = \alpha u$ and $Tv = \beta v$ with $\alpha \ne \beta$. By 7.21(e), normality gives $T^*v = \bar\beta v$, so
$$(\alpha - \beta)\langle u, v\rangle = \langle \alpha u, v\rangle - \langle u, \bar\beta v\rangle = \langle Tu, v\rangle - \langle u, T^*v\rangle = 0,$$
hence $\langle u, v\rangle = 0$. Without normality $T^*v$ need not be $\bar\beta v$: for $\begin{pmatrix}\alpha & s\\ 0 & \beta\end{pmatrix}$ the eigenvectors make an angle whose cosine is $|s|/\sqrt{|s|^2 + |\alpha - \beta|^2}$, which tends to $1$ — parallel — as the eigenvalues merge.`,
      caption: String.raw`$T = U\begin{pmatrix}\alpha & s\\ 0 & \beta\end{pmatrix}U^*$ with $U$ unitary: drag the eigenvalues $\alpha$ and $\beta$ anywhere in $\mathbf C$ and turn the eigenbasis with $\theta$. With $s = 0$, $T$ is normal: the two terms of $\langle u, v\rangle = u_1\overline{v_1} + u_2\overline{v_2}$ (middle) cancel exactly and the dial reads $90^\circ$, wherever $\alpha$ and $\beta$ go — off the real axis too, where $T$ is normal but not self-adjoint. Raise $s$: the sum no longer closes up and the angle shrinks, fastest when $\alpha$ and $\beta$ are close.`,
      deps: ['ladr-7.21', 'ladr-5.8'],
      tags: ['normal', 'eigenvalues'],
      viz(v) {
        const PSI = 0.9;
        const sh = v.slider('non-normal part $s$', 0, 1.2, 0, { step: 0.02 });
        const th = v.slider('eigenbasis angle $\\theta$', 0, 180, 35, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const E = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.5], equal: true, height: 320, weight: 1.15, title: 'eigenvalues $\\alpha, \\beta$ in $\\mathbf C$ (drag)' });
        const P = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, weight: 1, title: '$\\langle u, v\\rangle = u_1\\overline{v_1} + u_2\\overline{v_2}$' });
        const D = v.stage({ x: [-0.2, 1.25], y: [-0.4, 1.2], equal: true, axes: false, height: 320, weight: 0.75, title: 'angle between $u$ and $v$' });
        const snapR = (x, y) => [x, Math.abs(y) < 0.06 ? 0 : y];
        const ah = E.handle(1.1, 0.7, { color: 'accent', label: 'α', constrain: snapR });
        const bh = E.handle(-0.8, -0.35, { color: 'orange', label: 'β', constrain: snapR });
        const phase = (x, i) => { const r = cabs(x[i]); return r < 1e-9 ? x : x.map((z) => cmul(z, [x[i][0] / r, -x[i][1] / r])); };
        let st = null;
        v.render(() => {
          const al = [ah.x, ah.y], be = [bh.x, bh.y], s = sh.value, t = th.value / DEG, ph = [Math.cos(PSI), Math.sin(PSI)];
          const U = [[[Math.cos(t), 0], [-Math.sin(t), 0]], [cmul(ph, [Math.sin(t), 0]), cmul(ph, [Math.cos(t), 0])]];
          const T = cMM(cMM(U, [[al, [s, 0]], [[0, 0], be]]), cStar(U)), Ts = cStar(T), gapAB = cabs(csub(al, be));
          E.line(al[0], al[1], be[0], be[1], { color: 'muted', dash: [4, 4], width: 1.2 });
          E.text(`|α − β| = ${nmc(gapAB)}`, (al[0] + be[0]) / 2, (al[1] + be[1]) / 2, { size: 12, color: 'muted', dy: -12, align: 'center' });
          const normal = s < 1e-9, self = normal && Math.abs(al[1]) < 1e-9 && Math.abs(be[1]) < 1e-9;
          E.corner(self ? 'normal and self-adjoint' : normal ? 'normal, not self-adjoint' : 'not normal', 'tl', { color: normal ? 'green' : 'red', weight: 700 });
          if (gapAB < 0.03) {
            P.corner('α = β: the theorem needs distinct eigenvalues', 'tl', { color: 'muted', weight: 700 });
            D.corner('—', 'tl'); st = null; return;
          }
          const { ls, vecs } = cEig2(T), iA = cabs(csub(ls[0], al)) <= cabs(csub(ls[1], al)) ? 0 : 1;
          const u = phase(vecs[iA], 0), w = phase(vecs[1 - iA], 1);
          const p1 = cmul(u[0], cconj(w[0])), p2 = cmul(u[1], cconj(w[1])), z = cadd(p1, p2), orth = cabs(z) < 1e-9;
          P.circle(0, 0, 1, { color: 'faint', dash: [3, 4], width: 1 });
          const nrm = unit([-p2[1], p2[0]]), o = cabs(p2) > 1e-9 ? scl(nrm, 0.035) : [0, 0];
          P.arrow(0, 0, p1[0], p1[1], { color: 'teal', width: 2.8 });
          P.arrow(p1[0] + o[0], p1[1] + o[1], z[0] + o[0], z[1] + o[1], { color: 'pink', width: 2.4 });
          tip(P, 'u_1\\overline{v_1}', p1, 'teal', { size: 14, off: 22 });
          P.tex('u_2\\overline{v_2}', p1[0] + p2[0] / 2 + 6 * nrm[0] * 0.06, p1[1] + p2[1] / 2, { color: 'pink', size: 14, dx: 22 * nrm[0], dy: -22 * nrm[1] });
          if (orth) P.dot(0, 0, { r: 8, color: 'green', hollow: true });
          else { P.arrow(0, 0, z[0], z[1], { color: 'red', width: 2, dash: [5, 4] }); P.dot(z[0], z[1], { r: 5, color: 'red' }); }
          P.corner(orth ? 'the terms cancel: u ⊥ v' : `|⟨u, v⟩| = ${nmc(cabs(z), 3)}`, 'bl', { color: orth ? 'green' : 'red', weight: 700 });
          const ang = Math.acos(Math.min(1, cabs(z))) * DEG, ok = Math.abs(ang - 90) < 1e-6, ar = [];
          for (let k = 0; k <= 30; k++) { const a = ((90 * k) / 30) / DEG; ar.push([Math.cos(a), Math.sin(a)]); }
          D.path(ar, { color: 'faint', width: 1.2 });
          for (let g = 0; g <= 90; g += 15) { const a = g / DEG; D.line(0.92 * Math.cos(a), 0.92 * Math.sin(a), Math.cos(a), Math.sin(a), { color: 'faint', width: 1 }); if (g % 30 === 0) D.text(`${g}°`, 1.1 * Math.cos(a), 1.1 * Math.sin(a), { size: 10, color: 'muted', align: 'center' }); }
          const sec = [[0, 0]]; for (let k = 0; k <= 30; k++) { const a = ((ang * k) / 30) / DEG; sec.push([0.75 * Math.cos(a), 0.75 * Math.sin(a)]); }
          D.poly(sec, { fill: ok ? 'green' : 'red', fillAlpha: 0.15, stroke: false });
          D.arrow(0, 0, 0.95, 0, { color: 'accent', width: 2.6 }); D.tex('u', 0.95, 0, { color: 'accent', dy: 14, size: 14 });
          const va = ang / DEG; D.arrow(0, 0, 0.95 * Math.cos(va), 0.95 * Math.sin(va), { color: 'orange', width: 2.6 }); D.tex('v', 0.95 * Math.cos(va), 0.95 * Math.sin(va), { color: 'orange', dx: -12, dy: -8, size: 14 });
          if (ok) rightMark(D, [1, 0], [0, 1], 0.14, 'green');
          D.text(`${nm(ang, 1)}°`, 0.5, -0.24, { size: 20, color: ok ? 'green' : 'red', align: 'center', weight: 700 });
          const r = cMV(Ts, w), dev = [csub(r[0], cmul(cconj(be), w[0])), csub(r[1], cmul(cconj(be), w[1]))];
          st = { T, u, w, z, lhs: cmul(csub(al, be), z), dev: cNorm(dev), ang, normal, pred: s / Math.hypot(s, gapAB) };
          v.legend([['teal', '$u_1\\overline{v_1}$'], ['pink', '$u_2\\overline{v_2}$'], ['red', 'the sum $\\langle u, v\\rangle$']]);
        });
        v.readout(() => st && `$T = ${cmatT(st.T)}$ has unit eigenvectors $u = ${crowT(st.u)}$ for $\\alpha$ and $v = ${crowT(st.w)}$ for $\\beta$, with $\\langle u, v\\rangle = ${czT(st.z, 3)}$. The proof's quantity: $(\\alpha - \\beta)\\langle u, v\\rangle = \\langle u, T^*v - \\bar\\beta v\\rangle = ${czT(st.lhs, 3)}$, where $\\|T^*v - \\bar\\beta v\\| = ${nm(st.dev, 3)}$` + (st.normal ? ` — zero because $T$ is normal (7.21(e)), so $u \\perp v$.` : ` — not zero, since $T$ is not normal; the angle obeys $\\cos\\angle(u, v) = |s|/\\sqrt{|s|^2 + |\\alpha - \\beta|^2} = ${nm(st.pred, 3)}$.`));
      },
    },
  ],
};
