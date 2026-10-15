// Linear Algebra Done Right — Chapter 3: Linear Maps
// Part 1 (this file, 3.1–3.35): linear maps and ℒ(V, W), products, null space and range, the fundamental theorem
// of linear maps, linear systems, and the matrix of a linear map. Parts ch03-b.js … ch03-d.js carry 3.38–3.133.

// =====================================================================================================
// Shared helpers (vectors are plain arrays of any length; matrices are arrays of rows).
// =====================================================================================================
const CLR = ['blue', 'teal', 'green', 'gold', 'orange', 'red', 'pink', 'purple'];
const tn = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
const mtex = (A, d = 2) => String.raw`\begin{pmatrix}` + A.map((r) => r.map((x) => tn(x, d)).join('&')).join(String.raw`\\`) + String.raw`\end{pmatrix}`;
const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const ofCols = (...cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const colOf = (A, j) => A.map((r) => r[j]);
const mdiff = (A, B) => Math.max(...A.flatMap((r, i) => r.map((x, j) => Math.abs(x - B[i][j]))));
const len = (p) => Math.hypot(...p);
const add = (p, q) => p.map((x, i) => x + q[i]);
const sub = (p, q) => p.map((x, i) => x - q[i]);
const scl = (p, k) => p.map((x) => x * k);
const dot = (p, q) => p.reduce((s, x, i) => s + x * q[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (p) => { const l = len(p); return l > 1e-12 ? scl(p, 1 / l) : p.map(() => 0); };
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const O3 = [0, 0, 0];
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) w = sub(w, scl(e, dot(w, e)));
    const l = len(w); if (l > tol * Math.max(1, len(x))) B.push(scl(w, 1 / l));
  }
  return B;
}
const proj = (x, B) => B.reduce((s, e) => add(s, scl(e, dot(x, e))), x.map(() => 0));
/** Orthonormal basis a, b of the plane ⟂ n in ℝ³. */
function perpBasis(n) { const u = unit(n), t = Math.abs(u[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0], a = unit(sub(t, scl(u, dot(t, u)))); return [a, cross(u, a)]; }
/** Orthonormal basis of the column space of A (via the SVD of v.M). */
function colBasis(M, A, tol = 1e-6) { const { U, S } = M.svd(A); return S.map((s, k) => (s > tol ? U.map((r) => r[k]) : null)).filter(Boolean); }
/** Snap p to 0, onto the line through another vector, or into the span of all the others, when within tol. */
function snapTo(p, others, tol = 0.12) {
  if (len(p) < tol) return p.map(() => 0);
  const cands = others.filter((o) => len(o) > 1e-9).map((o) => [o]);
  if (others.length > 1) cands.push(others);
  for (const vs of cands) { const B = orth(vs); if (B.length && B.length < p.length) { const q = proj(p, B); if (len(sub(p, q)) < tol) return q; } }
  return p;
}
/** Keep a dragged 2D point inside the disc of radius r. */
const disc = (r) => (x, y) => { const n = Math.hypot(x, y); return n > r ? [(x * r) / n, (y * r) / n] : [x, y]; };
/** Arrow p → q on a 2D stage with an optional KaTeX label just beyond the tip. */
function arrow2(S, p, q, color, label, o = {}) {
  if (len(sub(q, p)) > 1e-9) S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.6, head: o.head ?? 10, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = S.X(q[0]) - S.X(p[0]), dy = S.Y(q[1]) - S.Y(p[1]), L = Math.hypot(dx, dy) || 1, off = o.off ?? 15;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 15, dx: (dx / L) * off + (o.dx || 0), dy: (dy / L) * off + (o.dy || 0) });
  }
}
/** Image under f of the square grid of lines x = k·step, y = k·step (|x|, |y| ≤ R); straight segments when lin. */
function gridImg(S, f, o = {}) {
  const R = o.R ?? 2.4, st = o.step ?? 0.4, n = o.lin ? 1 : 48, K = Math.round(R / st);
  for (let k = -K; k <= K; k++) for (const dir of [0, 1]) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const s = -R + (2 * R * i) / n; pts.push(f(dir ? [k * st, s] : [s, k * st])); }
    S.path(pts, { color: k === 0 ? (o.axis ?? 'muted') : (o.color ?? 'accent'), width: k === 0 ? 1.6 : 1, alpha: k === 0 ? 0.8 : (o.alpha ?? 0.25) });
  }
}
/** The lines k·a + ℝb and k·b + ℝa: the coordinate grid of the basis a, b. */
function lattice(S, a, b, o = {}) {
  const dt = Math.abs(det2(a, b)); if (dt < 1e-6) return;
  for (const [p, q] of [[a, b], [b, a]]) {
    const T = 9 / Math.max(len(q), 1e-6), N = Math.min(30, Math.ceil((6 * len(q)) / dt));
    for (let k = -N; k <= N; k++) S.line(p[0] * k - q[0] * T, p[1] * k - q[1] * T, p[0] * k + q[0] * T, p[1] * k + q[1] * T, { color: o.color ?? 'accent', width: k ? 1 : 1.5, alpha: k ? (o.alpha ?? 0.2) : 0.5 });
  }
}
// A small house (asymmetric: chimney on the right, window on the left), so reflections and shears are visible.
const HOUSE = [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.2], [0.42, 0.365], [0.42, 0.62], [0.3, 0.62], [0.3, 0.475], [0, 0.75], [-0.6, 0.2]];
const WINDOW = [[-0.42, -0.2], [-0.14, -0.2], [-0.14, 0.08], [-0.42, 0.08]];
const DOOR = [[0.1, -0.6], [0.34, -0.6], [0.34, -0.12], [0.1, -0.12]];
function house(S, f, o = {}) {
  const c = o.color ?? 'accent', a = o.alpha ?? 1;
  S.poly(HOUSE.map(f), { fill: o.dash ? false : c, fillAlpha: (o.fillAlpha ?? 0.2) * a, color: c, width: o.width ?? 2, alpha: a, dash: o.dash });
  if (o.dash) return;
  S.poly(WINDOW.map(f), { fill: 'gold', fillAlpha: 0.55 * a, color: c, width: 1, alpha: a });
  S.poly(DOOR.map(f), { fill: c, fillAlpha: 0.5 * a, color: c, width: 1, alpha: a });
}
/** A matrix drawn at pixel (X, Y) of a stage, column j in colour colors[j]; returns the x pixel after it. */
function matPx(S, X, Y, A, o = {}) {
  const d = o.d ?? 2, m = A.length, n = A[0].length, cw = o.cw ?? 46, rh = o.rh ?? 21, size = o.size ?? 14, H = m * rh, w = n * cw + 6;
  let x = X;
  if (o.label) { S.texPx(o.label, x, Y + H / 2, { align: 'left', size, color: o.labelColor ?? 'ink' }); x += o.labelW ?? 60; }
  const br = (bx, s) => S.path([S.inv(bx + 5 * s, Y), S.inv(bx, Y), S.inv(bx, Y + H), S.inv(bx + 5 * s, Y + H)], { color: 'muted', width: 1.4 });
  br(x, 1); br(x + w, -1);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) S.texPx(tn(A[i][j], d), x + 3 + (j + 0.5) * cw, Y + (i + 0.5) * rh, { size, color: (o.colors && o.colors[j]) || 'ink' });
  return x + w + 8;
}
// ---------- 3D (on v.scene3) ----------
/** Draw a subspace of ℝ³ with orthonormal basis B (the origin, a line, a disc, or all of ℝ³ as a tinted cube), centred at c. */
function drawSub(sc, B, color, o = {}) {
  const r = o.r ?? 1.45, c = o.c ?? O3;
  if (B.length === 0) sc.dot(c, { r: 6, color });
  else if (B.length === 1) sc.line(add(c, scl(B[0], -r)), add(c, scl(B[0], r)), { color, width: o.width ?? 4, alpha: o.alpha ?? 0.85, dash: o.dash }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], r, { fill: color, fillAlpha: o.fillAlpha ?? 0.16, color, grid: o.grid ?? true }, c);
  else cubeFaces(sc, r * 0.72, color);
}
function cubeVerts(h) { const V = []; for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) V.push([x, y, z]); return V; }
function cubeEdges(sc, h, st) {
  const V = cubeVerts(h);
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (V[i].filter((c, k) => c !== V[j][k]).length === 1) sc.line(V[i], V[j], st, 6);
}
function cubeFaces(sc, h, color) {
  for (let k = 0; k < 3; k++) for (const s of [-h, h]) {
    const q = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([a, b]) => { const p = [0, 0, 0]; p[k] = s; p[(k + 1) % 3] = a; p[(k + 2) % 3] = b; return p; });
    sc.poly(q, { fill: color, fillAlpha: 0.06, color, alpha: 0.35, width: 1 });
  }
}
/** Parameter interval [a, b] for which c + t·d stays in the box [−h, h]³. */
function clipBox(c, d, h) {
  let a = -Infinity, b = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-12) { if (Math.abs(c[i]) > h) return [1, 0]; continue; }
    const t1 = (-h - c[i]) / d[i], t2 = (h - c[i]) / d[i];
    a = Math.max(a, Math.min(t1, t2)); b = Math.min(b, Math.max(t1, t2));
  }
  return [a, b];
}
/** Arrow in a scene with a KaTeX label just past its tip. */
function arrow3(sc, p, q, color, label, o = {}) {
  if (len(sub(q, p)) > 1e-9) sc.arrow(p, q, { color, width: o.width ?? 2.6, alpha: o.alpha, dash: o.dash });
  if (label) {
    const A = sc.P(p), B = sc.P(q), S = o.S, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, off = o.off ?? 16;
    const k = S ? 1 / S.scale : 0;
    sc.tex(label, q, { color, size: o.size ?? 14, dx: k ? (dx / L) * off : 10, dy: k ? -(dy / L) * off : -10 });
  }
}
/** Keep a scene3 handle inside span(B) (B orthonormal): on the line, in the plane, or free. */
function fitHandle(H, B, def) {
  if (B.length >= 3) { H.mode = 'free'; return; }
  if (B.length === 0) { H.mode = 'line'; H.d = [1e-9, 0, 0]; H.t = 0; H.p = [0, 0, 0]; return; }
  if (B.length === 1) {
    if (H.mode !== 'line' || len(H.d) < 1e-6) H.t = dot(H.p, B[0]) || def;
    else if (dot(H.d, B[0]) < 0) H.t = -H.t;
    H.mode = 'line'; H.d = B[0];
    return;
  }
  H.mode = 'plane'; H.a = B[0]; H.b = B[1];
  const q = proj(H.p, B); H.p = len(q) > 0.05 ? q : scl(B[0], def);
}
/** "e₁, e₂, e₃"-coloured arrows of the standard basis in a scene (short, faint). */
function basis3(sc, cols = ['orange', 'orange', 'orange'], labs = ['e_1', 'e_2', 'e_3'], k = 0.6) {
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => { sc.arrow(O3, scl(e, k), { color: cols[i], width: 1.8, alpha: 0.7, head: 7 }); sc.tex(labs[i], scl(e, k + 0.16), { color: cols[i], size: 12 }); });
}
/** TeX for a linear form Σ a_k x_k. */
function formTeX(a, d = 2, x = 'x') {
  let s = '';
  a.forEach((c, i) => { if (Math.abs(c) < 0.5 * 10 ** -d) return; const m = Math.abs(c).toFixed(d); s += (s ? (c < 0 ? ' - ' : ' + ') : c < 0 ? '-' : '') + m + `${x}_${i + 1}`; });
  return s || '0';
}

export default {
  collection: 'ladr',
  chapter: 3,
  title: 'Linear Maps',
  summary: String.raw`Linear maps are the main characters of the book. A linear map is pinned down by its values on a basis, and its null space and range obey the fundamental theorem $\dim V=\dim\operatorname{null}T+\dim\operatorname{range}T$, which at once settles basic questions about systems of linear equations. Matrices record a map relative to chosen bases, and matrix multiplication is defined so that it mirrors composition; this leads to the column–row factorization, rank, invertibility, isomorphism by dimension and the change-of-basis formula. The last sections build new spaces — products, quotients and duals — and show that the dual map has the transposed matrix, which gives a second proof that row rank equals column rank.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Linear map',
      statement: String.raw`Let $V$ and $W$ be vector spaces over $\mathbf F$. A **linear map** from $V$ to $W$ is a function $T\colon V\to W$ that is
(a) *additive*: $T(u+v)=Tu+Tv$ for all $u,v\in V$;
(b) *homogeneous*: $T(\lambda v)=\lambda(Tv)$ for all $\lambda\in\mathbf F$ and $v\in V$.

The set of all linear maps from $V$ to $W$ is written $\mathcal L(V,W)$, and $\mathcal L(V)=\mathcal L(V,V)$. For linear maps one usually writes $Tv$ instead of $T(v)$.`,
      idea: String.raw`Linearity says that $T$ respects the two operations that make $V$ a vector space, so it is enough to know $T$ on a few vectors to know it everywhere. Geometrically, on $\R^2$ a linear map sends the square grid to a grid of congruent parallelograms: lines stay lines, evenly spaced points stay evenly spaced, and $0$ stays put. Examples: the zero map, the identity, differentiation and integration on polynomials, multiplication by $x^2$, the backward shift on $\mathbf F^\infty$, and every map $\mathbf F^n\to\mathbf F^m$ of the form $x\mapsto Ax$.`,
      caption: String.raw`Drag the orange images $Te_1, Te_2$ to choose $T$, and drag $u$, $v$ and $\lambda$. For a linear map, $T(u+v)$ lands exactly on the corner $Tu+Tv$ of the parallelogram and $T(\lambda v)$ on $\lambda Tv$. Switch to the nonlinear twist (which still fixes $0$): the grid bends and both identities fail — the red gaps.`,
      deps: ['ladr-1.20'],
      see: ['pma-9.4'],
      tags: ['linear maps'],
      viz(v) {
        const mode = v.select('', [{ value: 'lin', label: 'linear: $x\\mapsto Ax$' }, { value: 'warp', label: 'nonlinear: $x\\mapsto A\\,\\mathrm{twist}(x)$' }], 'lin');
        const lam = v.slider('$\\lambda$', -2, 2, 1.6, { step: 0.05 });
        const D = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 340, title: 'domain $V=\\R^2$' });
        const W = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 340, title: 'target $W=\\R^2$' });
        const u = D.handle(1.0, -0.6, { color: 'blue', label: 'u', constrain: disc(1.25) });
        const w = D.handle(-0.2, 0.9, { color: 'purple', label: 'v', constrain: disc(1.25) });
        const c1 = W.handle(1.15, 0.3, { color: 'orange', label: 'Te₁', constrain: disc(1.5) });
        const c2 = W.handle(-0.4, 0.95, { color: 'orange', label: 'Te₂', constrain: disc(1.5) });
        const twist = (p) => { const a = 0.25 * (p[0] * p[0] + p[1] * p[1]), c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1]]; };
        let res = { e1: 0, e2: 0, lin: true };
        v.legend([['blue', '$u,\\ Tu$'], ['purple', '$v,\\ Tv$'], ['green', 'sum'], ['gold', 'scalar multiple']]);
        v.render(() => {
          const A = [[c1.x, c2.x], [c1.y, c2.y]], lin = mode.value === 'lin';
          const T = lin ? (p) => mv(A, p) : (p) => mv(A, twist(p));
          const U = [u.x, u.y], V = [w.x, w.y], l = lam.value, UV = add(U, V), LV = scl(V, l);
          gridImg(D, (p) => p, { lin: true, R: 2, color: 'muted', alpha: 0.22 });
          D.poly([[0, 0], U, UV, V], { fill: 'green', fillAlpha: 0.07, stroke: false });
          D.line(U[0], U[1], UV[0], UV[1], { color: 'purple', dash: [4, 4], alpha: 0.6 }); D.line(V[0], V[1], UV[0], UV[1], { color: 'blue', dash: [4, 4], alpha: 0.6 });
          arrow2(D, [0, 0], LV, 'gold', '\\lambda v', { width: 2 });
          arrow2(D, [0, 0], UV, 'green', 'u+v'); arrow2(D, [0, 0], U, 'blue'); arrow2(D, [0, 0], V, 'purple');
          gridImg(W, T, { lin, R: 2, color: 'accent', alpha: 0.3 });
          arrow2(W, [0, 0], [c1.x, c1.y], 'orange', null, { width: 1.5, alpha: 0.6 }); arrow2(W, [0, 0], [c2.x, c2.y], 'orange', null, { width: 1.5, alpha: 0.6 });
          const TU = T(U), TV = T(V), TUV = T(UV), S = add(TU, TV), TLV = T(LV), LTV = scl(TV, l);
          W.poly([[0, 0], TU, S, TV], { fill: 'green', fillAlpha: 0.07, stroke: false });
          W.line(TU[0], TU[1], S[0], S[1], { color: 'purple', dash: [4, 4], alpha: 0.6 }); W.line(TV[0], TV[1], S[0], S[1], { color: 'blue', dash: [4, 4], alpha: 0.6 });
          const e1 = len(sub(TUV, S)), e2 = len(sub(TLV, LTV));
          arrow2(W, [0, 0], LTV, 'gold', e2 < 0.01 ? 'T(\\lambda v)=\\lambda Tv' : '\\lambda Tv', { width: 2, size: 14, off: 22 });
          arrow2(W, [0, 0], S, 'green', e1 < 0.01 ? 'T(u+v)=Tu+Tv' : 'Tu+Tv', { size: 14, off: 26 });
          arrow2(W, [0, 0], TU, 'blue', 'Tu'); arrow2(W, [0, 0], TV, 'purple', 'Tv');
          if (e1 >= 0.01) { W.line(S[0], S[1], TUV[0], TUV[1], { color: 'red', width: 2.5 }); W.dot(TUV[0], TUV[1], { r: 5, color: 'red', label: 'T(u+v)', labelPos: 'e' }); }
          if (e2 >= 0.01) { W.line(LTV[0], LTV[1], TLV[0], TLV[1], { color: 'red', width: 2.5 }); W.dot(TLV[0], TLV[1], { r: 5, color: 'red', label: 'T(λv)', labelPos: 'w' }); }
          res = { e1, e2, lin };
        });
        v.readout(() => {
          const s = String.raw`$\lVert T(u+v)-(Tu+Tv)\rVert = ${tn(res.e1, 3)}$, $\ \lVert T(\lambda v)-\lambda\,Tv\rVert = ${tn(res.e2, 3)}$ — `;
          return s + (res.lin ? 'additive and homogeneous: $T$ is linear, and the grid goes to an evenly spaced grid of parallelograms.' : 'the twist fixes $0$, but it is neither additive nor homogeneous, so it is **not** a linear map.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Lemma',
      name: 'Linear map lemma',
      statement: String.raw`Suppose $v_1,\dots,v_n$ is a basis of $V$ and $w_1,\dots,w_n\in W$ are arbitrary. Then there is a **unique** linear map $T\colon V\to W$ with
$$Tv_k=w_k\quad\text{for each } k=1,\dots,n.$$`,
      idea: String.raw`*Existence:* every $v\in V$ is $c_1v_1+\dots+c_nv_n$ for exactly one list of scalars (criterion for a basis, 2.28), so $T(c_1v_1+\dots+c_nv_n)=c_1w_1+\dots+c_nw_n$ is a well-defined function; coordinates add and scale, so $T$ is linear. *Uniqueness:* any linear $T$ with $Tv_k=w_k$ must, by homogeneity and additivity, send $c_1v_1+\dots+c_nv_n$ to $c_1w_1+\dots+c_nw_n$. The images of the basis vectors may be chosen completely freely.`,
      caption: String.raw`Drag the basis $v_1, v_2$ (its coordinate grid follows) and the targets $w_1, w_2$ anywhere: the unique $T$ carries the whole grid, the house and the point $x=c_1v_1+c_2v_2$ to $Tx=c_1w_1+c_2w_2$. Line $v_2$ up with $v_1$ (it snaps) to break "basis": then $T$ is either impossible or not unique.`,
      deps: ['ladr-3.1', 'ladr-2.28'],
      tags: ['linear maps', 'bases'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 340, title: 'domain: a basis $v_1,v_2$ and a point $x$' });
        const W = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 340, title: 'target: any $w_1,w_2$, and $Tx$' });
        let v1, v2;
        v1 = D.handle(1.0, 0.25, { color: 'blue', label: 'v₁', constrain: (x, y) => snapTo(disc(1.5)(x, y), [[v2.x, v2.y]], 0.1) });
        v2 = D.handle(0.35, 0.95, { color: 'purple', label: 'v₂', constrain: (x, y) => snapTo(disc(1.5)(x, y), [[v1.x, v1.y]], 0.1) });
        const xh = D.handle(-1.1, -0.75, { color: 'gold', label: 'x', constrain: disc(1.9) });
        const w1 = W.handle(1.3, -0.5, { color: 'blue', label: 'w₁', constrain: disc(1.7) });
        const w2 = W.handle(0.7, 1.15, { color: 'purple', label: 'w₂', constrain: disc(1.7) });
        let info = {};
        v.render(() => {
          const a = [v1.x, v1.y], b = [v2.x, v2.y], A = [w1.x, w1.y], B = [w2.x, w2.y], X = [xh.x, xh.y];
          const dt = det2(a, b), ok = Math.abs(dt) > 1e-6;
          if (ok) {
            const c = M.solve(ofCols(a, b), X), Tm = mm(ofCols(A, B), M.inverse(ofCols(a, b))), T = (p) => mv(Tm, p), TX = T(X);
            lattice(D, a, b, { color: 'accent', alpha: 0.18 });
            lattice(W, A, B, { color: 'accent', alpha: 0.18 });
            house(D, (p) => p, { color: 'accent' });
            house(W, T, { color: 'accent' });
            const ca = scl(a, c[0]), cA = scl(A, c[0]);
            D.path([[0, 0], ca, X], { color: 'gold', dash: [5, 4], width: 1.6 });
            W.path([[0, 0], cA, TX], { color: 'gold', dash: [5, 4], width: 1.6 });
            arrow2(D, [0, 0], X, 'gold'); arrow2(W, [0, 0], TX, 'gold', 'Tx');
            info = { ok, c, Tm, TX };
          } else {
            // v₂ = k v₁ (or a zero vector): the list is dependent
            D.line(-a[0] * 9, -a[1] * 9, a[0] * 9, a[1] * 9, { color: 'red', width: 2, alpha: 0.6 });
            const k = len(a) > 1e-9 ? dot(b, a) / dot(a, a) : null;
            const cons = k != null && len(sub(B, scl(A, k))) < 0.06;
            D.corner('v₁, v₂ is not a basis', 'tl', { color: 'red' });
            W.corner(cons ? 'consistent targets: such T exist, but are not unique' : 'Tv₂ = k·Tv₁ is forced, but w₂ ≠ k·w₁: no such T', 'tl', { color: 'red' });
            arrow2(D, [0, 0], X, 'gold');
            info = { ok, cons };
          }
          arrow2(D, [0, 0], a, 'blue'); arrow2(D, [0, 0], b, 'purple');
          arrow2(W, [0, 0], A, 'blue'); arrow2(W, [0, 0], B, 'purple');
        });
        v.readout(() => {
          if (!info.ok) return String.raw`$v_1, v_2$ are linearly dependent, so coordinates are not unique and the lemma does not apply: ` + (info.cons ? 'many linear maps satisfy $Tv_k=w_k$.' : 'no linear map satisfies $Tv_k=w_k$.');
          const { c, Tm, TX } = info;
          return String.raw`$x = ${tn(c[0])}\,v_1 ${c[1] < 0 ? '-' : '+'} ${tn(Math.abs(c[1]))}\,v_2$, so necessarily $Tx = ${tn(c[0])}\,w_1 ${c[1] < 0 ? '-' : '+'} ${tn(Math.abs(c[1]))}\,w_2 = ${vtex(TX)}$. In standard coordinates the unique $T$ is $[\,w_1\ w_2\,][\,v_1\ v_2\,]^{-1} = ${mtex(Tm)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'ℒ(V, W) is a vector space',
      statement: String.raw`For $S,T\in\mathcal L(V,W)$ and $\lambda\in\mathbf F$ define the sum and scalar multiple pointwise:
$$(S+T)(v)=Sv+Tv,\qquad(\lambda T)(v)=\lambda(Tv)\qquad(v\in V).$$
Then $S+T$ and $\lambda T$ are again linear, and with these operations $\mathcal L(V,W)$ is a vector space. Its additive identity is the zero map $0\colon v\mapsto 0$.`,
      idea: String.raw`First check that $S+T$ and $\lambda T$ are linear: e.g. $(S+T)(u+v)=Su+Sv+Tu+Tv=(S+T)u+(S+T)v$, using additivity of $S$ and $T$ and the rules of $W$. Then every vector-space axiom (1.20) for $\mathcal L(V,W)$ is checked at each $v$ separately, where it is an axiom of $W$. So linear maps can themselves be added and scaled like vectors.`,
      caption: String.raw`Drag the images of $e_1, e_2$ under $S$ (blue) and $T$ (orange), and the sliders $a, b$. The right panel shows $aS+bT$: its column $(aS+bT)e_k$ is built as $a\,Se_k$ followed by $b\,Te_k$, and the house is again sent to a parallelogram-grid picture — a linear map. Set $a=b=0$ for the zero map.`,
      deps: ['ladr-3.1', 'ladr-1.20'],
      tags: ['linear maps'],
      viz(v) {
        const a = v.slider('$a$', -2, 2, 1, { step: 0.05 }), b = v.slider('$b$', -2, 2, 0.6, { step: 0.05 });
        const opt = { x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 290, minWidth: 220 };
        const P1 = v.stage({ ...opt, title: '$S$' }), P2 = v.stage({ ...opt, title: '$T$' }), P3 = v.stage({ ...opt, title: '$aS+bT$' });
        const s1 = P1.handle(1.0, 0.3, { color: 'blue', label: 'Se₁', constrain: disc(1.4) }), s2 = P1.handle(-0.2, 0.9, { color: 'blue', label: 'Se₂', constrain: disc(1.4) });
        const t1 = P2.handle(0.7, -0.6, { color: 'orange', label: 'Te₁', constrain: disc(1.4) }), t2 = P2.handle(0.6, 0.8, { color: 'orange', label: 'Te₂', constrain: disc(1.4) });
        let C = [[1, 0], [0, 1]];
        v.render(() => {
          const Sm = [[s1.x, s2.x], [s1.y, s2.y]], Tm = [[t1.x, t2.x], [t1.y, t2.y]], A = a.value, B = b.value;
          C = Sm.map((r, i) => r.map((x, j) => A * x + B * Tm[i][j]));
          const pane = (P, Mx, col) => { gridImg(P, (p) => mv(Mx, p), { lin: true, R: 2, step: 0.5, color: col, alpha: 0.25 }); house(P, (p) => mv(Mx, p), { color: col }); };
          pane(P1, Sm, 'blue'); pane(P2, Tm, 'orange'); pane(P3, C, 'green');
          for (const [P, h] of [[P1, s1], [P1, s2], [P2, t1], [P2, t2]]) arrow2(P, [0, 0], [h.x, h.y], P === P1 ? 'blue' : 'orange', null, { width: 2 });
          [0, 1].forEach((k) => {
            const sa = scl(colOf(Sm, k), A), tb = scl(colOf(Tm, k), B), ck = colOf(C, k), al = k ? 0.75 : 1;
            arrow2(P3, [0, 0], sa, 'blue', null, { width: 2, alpha: al }); arrow2(P3, sa, ck, 'orange', null, { width: 2, alpha: al });
            arrow2(P3, [0, 0], ck, 'green', null, { width: 2.6 });
            P3.tex(`(aS+bT)e_${k + 1}`, ck[0], ck[1], { color: 'green', size: 13, dy: k ? -16 : 18 });
          });
          if (Math.abs(A) + Math.abs(B) < 1e-9) P3.corner('the zero map', 'tl', { color: 'green' });
        });
        v.readout(() => {
          const Sm = [[s1.x, s2.x], [s1.y, s2.y]], Tm = [[t1.x, t2.x], [t1.y, t2.y]];
          return String.raw`$${tn(a.value)}\,${mtex(Sm)} ${b.value < 0 ? '-' : '+'} ${tn(Math.abs(b.value))}\,${mtex(Tm)} = ${mtex(C)}$ — the combination $aS+bT$ acts by this matrix, so it is again linear: grid lines stay straight and evenly spaced` + (Math.abs(a.value) + Math.abs(b.value) < 1e-9 ? ', and here it is the zero map, the additive identity of $\\mathcal L(V,W)$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Algebraic properties of products of linear maps',
      statement: String.raw`For $T\in\mathcal L(U,V)$ and $S\in\mathcal L(V,W)$ the **product** $ST\in\mathcal L(U,W)$ is the composition $(ST)(u)=S(Tu)$. Whenever the products make sense:
(a) *associativity*: $(T_1T_2)T_3=T_1(T_2T_3)$;
(b) *identity*: $TI=IT=T$ for $T\in\mathcal L(V,W)$ (the first $I$ is the identity on $V$, the second on $W$);
(c) *distributivity*: $(S_1+S_2)T=S_1T+S_2T$ and $S(T_1+T_2)=ST_1+ST_2$.

Multiplication is in general **not** commutative: $ST$ and $TS$ can differ even when both are defined.`,
      idea: String.raw`All three are statements about functions, checked at a single vector: both sides of (a) send $u$ to $T_1(T_2(T_3u))$, so the grouping is irrelevant; (b) is immediate; and (c) uses the pointwise definition of the sum (3.6), with linearity of $S$ for the second identity. Commutativity fails because applying "first rotate, then shear" is a different motion from "first shear, then rotate".`,
      caption: String.raw`Left: the gold house undergoes $D$ (stretch), then $H$ (shear), then $R$ (rotation), leaving the faint ghosts $Dx$ and $HDx$ — whether you group it as $(RH)D$ or $R(HD)$ the result is the same green house. Right: pick another order of the same three maps and move the sliders. It usually lands elsewhere (red); the dashed outline is the left result.`,
      deps: ['ladr-3.1', 'ladr-3.6'],
      tags: ['linear maps', 'composition'],
      viz(v) {
        const M = v.M;
        const ord = v.select('right panel', ['HRD', 'RDH', 'DRH', 'HDR', 'DHR', 'RHD'].map((s) => ({ value: s, label: `$${s}$` })), 'HRD');
        const th = v.slider('rotation $R$ (°)', -180, 180, 55, { step: 1 }), kk = v.slider('shear $H$', -1.5, 1.5, 0.8, { step: 0.05 }), ss = v.slider('stretch $D$', 0.4, 2, 1.6, { step: 0.05 });
        const opt = { x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 330 };
        const P1 = v.stage({ ...opt, title: '$RHD$: first $D$, then $H$, then $R$' }), P2 = v.stage({ ...opt, title: 'the chosen order' });
        const mats = () => {
          const t = (th.value * Math.PI) / 180;
          return { R: [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]], H: [[1, kk.value], [0, 1]], D: [[ss.value, 0], [0, 1]] };
        };
        const prod = (word, m) => word.split('').reduce((P, ch) => mm(P, m[ch]), [[1, 0], [0, 1]]);
        let info = {};
        const run = (P, word, m, s, final, ref) => {
          gridImg(P, (p) => p, { lin: true, R: 2.8, step: 0.4, color: 'muted', alpha: 0.18 });
          const steps = word.split('').reverse(), Ms = [[[1, 0], [0, 1]]]; // the rightmost factor acts first
          for (let i = 0; i < 3; i++) Ms.push(mm(m[steps[i]], Ms[i]));
          house(P, (p) => p, { color: 'muted', alpha: 0.35, fillAlpha: 0.1 });
          let lab = 'x';
          for (let i = 1; i <= 2; i++) {
            lab = steps[i - 1] + lab;
            house(P, (p) => mv(Ms[i], p), { color: 'muted', alpha: 0.5, fillAlpha: 0.06 });
            const top = mv(Ms[i], [0, 0.75]); P.tex(lab, top[0], top[1], { color: 'muted', size: 12, dy: -10 });
          }
          if (ref) house(P, (p) => mv(ref, p), { color: 'green', dash: [5, 4], width: 1.6 });
          house(P, (p) => mv(Ms[3], p), { color: final });
          if (s < 3) {
            const k = Math.floor(s), f = M.smoothstep(s - k), Q = Ms[k].map((r, a) => r.map((x, b) => x + (Ms[k + 1][a][b] - x) * f));
            P.poly(HOUSE.map((p) => mv(Q, p)), { color: 'gold', width: 2.5, fill: 'gold', fillAlpha: 0.12 });
          }
        };
        v.animate((t) => {
          const m = mats(), s = Math.min(3, Math.max(0, (t - 0.5) / 1.3));
          const L = prod('RHD', m), Rt = prod(ord.value, m), same = mdiff(L, Rt) < 1e-9;
          run(P1, 'RHD', m, s, 'green');
          run(P2, ord.value, m, s, same ? 'green' : 'red', L);
          P2.setTitle(`$${ord.value}$: first $${ord.value[2]}$, then $${ord.value[1]}$, then $${ord.value[0]}$`);
          info = { m, L, Rt, same, a: mdiff(mm(mm(m.R, m.H), m.D), mm(m.R, mm(m.H, m.D))) };
        }, { period: 6, still: 1.6 });
        v.readout(() => {
          const { L, Rt, same, a } = info; if (!L) return '';
          return String.raw`$(RH)D = R(HD) = ${mtex(L)}$ (difference $${v.sci(a, 1)}$: associativity). $\ ${ord.value} = ${mtex(Rt)}$ — ` + (same ? (ord.value === 'RHD' ? 'the same word.' : 'equal: for these settings the factors happen to commute.') : '**different**: the order of the factors matters.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Linear maps take 0 to 0',
      statement: String.raw`If $T\in\mathcal L(V,W)$, then $T(0)=0$.`,
      idea: String.raw`By additivity, $T(0)=T(0+0)=T(0)+T(0)$. Adding the additive inverse of $T(0)$ to both sides (in $W$) leaves $0=T(0)$. So the origin is pinned: a map like $x\mapsto Ax+b$ with $b\ne0$ (an affine map) moves it and therefore cannot be linear — it is exactly the additivity identity at $u=v=0$ that it violates.`,
      caption: String.raw`The animation morphs the plane from the identity to the map. For $x\mapsto Ax$ the origin never moves however you drag $Ae_1, Ae_2$. Switch to the affine map and drag $b$: the origin travels (gold path) to $T(0)=b$, while additivity would demand $T(0+0)=T(0)+T(0)=2b$.`,
      deps: ['ladr-3.1'],
      tags: ['linear maps'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'lin', label: 'linear $x\\mapsto Ax$' }, { value: 'aff', label: 'affine $x\\mapsto Ax+b$' }], 'aff');
        const S = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, axes: false, height: 360 });
        const c1 = S.handle(1.2, 0.3, { color: 'orange', label: 'Ae₁', constrain: disc(1.6) }), c2 = S.handle(-0.3, 0.9, { color: 'orange', label: 'Ae₂', constrain: disc(1.6) });
        const bh = S.handle(0.75, -0.75, { color: 'red', label: 'b', labelPos: 'sw', constrain: disc(1.2) });
        let info = {};
        v.legend([['muted', 'the original grid'], ['accent', 'its image (morphing)'], ['gold', 'path of the origin'], ['red', '$T(0)+T(0)$']]);
        v.animate((t) => {
          const aff = mode.value === 'aff'; bh.visible = aff;
          const A = [[c1.x, c2.x], [c1.y, c2.y]], b = aff ? [bh.x, bh.y] : [0, 0];
          const ph = (t % 5) / 5, s = M.smoothstep(M.clamp(ph < 0.5 ? ph * 2.6 : (1 - ph) * 2.6, 0, 1));
          const As = [[1 + s * (A[0][0] - 1), s * A[0][1]], [s * A[1][0], 1 + s * (A[1][1] - 1)]], bs = scl(b, s);
          const f = (p) => add(mv(As, p), bs);
          gridImg(S, (p) => p, { lin: true, R: 6, step: 0.4, color: 'muted', alpha: 0.15 });
          gridImg(S, f, { lin: true, R: 4.4, step: 0.4, color: 'accent', alpha: 0.32, axis: 'accent' });
          arrow2(S, [0, 0], [c1.x, c1.y], 'orange', null, { width: 1.6, alpha: 0.6, dash: [5, 4] }); arrow2(S, [0, 0], [c2.x, c2.y], 'orange', null, { width: 1.6, alpha: 0.6, dash: [5, 4] });
          S.dot(0, 0, { r: 4, color: 'ink' }); S.tex('0', 0, 0, { color: 'ink', size: 13, dx: -10, dy: 12 });
          if (aff && len(b) > 1e-6) {
            S.line(0, 0, bs[0], bs[1], { color: 'gold', width: 4, alpha: 0.6 });
            arrow2(S, b, scl(b, 2), 'red', null, { width: 2, dash: [5, 4] });
            S.dot(2 * b[0], 2 * b[1], { r: 6, color: 'red', hollow: true }); S.tex('T(0)+T(0)=2b', 2 * b[0], 2 * b[1], { color: 'red', size: 13, dx: 8, dy: -16, align: 'left' });
            S.dot(b[0], b[1], { r: 11, color: 'gold', hollow: true }); S.tex('T(0)=T(0+0)=b', b[0], b[1], { color: 'gold', size: 13, dx: 14, dy: 14, align: 'left' });
            S.dot(bs[0], bs[1], { r: 5, color: 'gold' });
          } else { S.dot(0, 0, { r: 10, color: 'green', hollow: true }); S.tex('T(0)=0', 0, 0, { color: 'green', size: 14, dx: 16, dy: -16, align: 'left' }); }
          info = { aff, b };
        }, { period: 5, still: 1.9 });
        v.readout(() => {
          if (!info.b) return '';
          if (!info.aff) return String.raw`$T(0) = A\,0 = (0,\,0)$: whatever the matrix, $T(0)=T(0)+T(0)$ forces $T(0)=0$ — the origin stays pinned while the rest of the plane moves.`;
          const b = info.b, n = len(b);
          return String.raw`$T(0)=b=${vtex(b)}$, but $T(0)+T(0)=${vtex(scl(b, 2))}$; additivity at $u=v=0$ would need these equal. ` + (n < 1e-6 ? 'With $b=0$ the map is linear again.' : String.raw`They differ by $\lVert b\rVert = ${tn(n)}$, so $x\mapsto Ax+b$ is **not** linear.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Null space',
      statement: String.raw`For $T\in\mathcal L(V,W)$, the **null space** of $T$ is the subset of $V$ that $T$ sends to $0$:
$$\operatorname{null}T=\{v\in V: Tv=0\}.$$
Examples: the null space of the zero map is all of $V$; the null space of differentiation on $\mathcal P(\R)$ is the set of constant polynomials; the null space of the backward shift on $\mathbf F^\infty$ is $\{(a,0,0,\dots):a\in\mathbf F\}$.`,
      idea: String.raw`The null space (also called the *kernel*) records everything $T$ forgets. For a matrix map $x\mapsto Ax$ it is the solution set of the homogeneous system $Ax=0$. A map $\R^3\to\R^2$ must forget something: its null space is at least a line.`,
      caption: String.raw`Drag the images $Te_1, Te_2, Te_3$ in the right panel; they snap onto a common line (or to $0$) when close. The red null space in $\R^3$ follows: the red handle can slide only inside it, and its image $Tn$ never leaves $0$; the free blue $x$ shows an ordinary image. Make all three images collinear to get a null plane.`,
      deps: ['ladr-3.1'],
      tags: ['null space'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'domain $\\R^3$' });
        const W = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 350, title: 'target $\\R^2$' });
        const sc = v.scene3(D, { yaw: -0.55, pitch: 0.32 });
        const th = [];
        [[1.0, 0.35], [0.25, 1.0], [1.25, 1.35]].forEach((p, k) => th.push(W.handle(p[0], p[1], { color: 'orange', label: `Te${'₁₂₃'[k]}`, constrain: (x, y) => snapTo(disc(1.8)(x, y), th.filter((_, j) => j !== k).map((h) => [h.x, h.y]), 0.12) })));
        const n = sc.handle(scl([1, 1, -1], -0.9 / Math.sqrt(3)), { mode: 'line', d: unit([1, 1, -1]), color: 'red', label: 'n' });
        const x = sc.handle([0.5, -0.9, -0.5], { color: 'blue', label: 'x' });
        let info = {};
        v.render(() => {
          const A = [[th[0].x, th[1].x, th[2].x], [th[0].y, th[1].y, th[2].y]];
          const B = M.nullspace(A, 1e-6);
          fitHandle(n, B, 0.8);
          sc.begin();
          basis3(sc);
          drawSub(sc, B, 'red', { r: 1.5, width: 4 });
          if (B.length < 3) sc.tex('\\operatorname{null}T', scl(B[0], 1.5 * Math.sign(dot(B[0], [0, 0, 1]) || 1)), { color: 'red', size: 14, dx: 26 });
          arrow3(sc, O3, n.p, 'red', null); arrow3(sc, O3, x.p, 'blue', null);
          sc.flush();
          th.forEach((h, k) => arrow2(W, [0, 0], [h.x, h.y], 'orange', null, { width: 2 }));
          const Tx = mv(A, x.p), Tn = mv(A, n.p);
          arrow2(W, [0, 0], Tx, 'blue', 'Tx');
          W.dot(Tn[0], Tn[1], { r: 6, color: 'red' }); W.tex('Tn=0', Tn[0], Tn[1], { color: 'red', size: 14, dx: -30, dy: 16 });
          info = { A, B, Tn, Tx };
        });
        v.readout(() => {
          const { A, B, Tn, Tx } = info; if (!A) return '';
          const sp = B.length === 3 ? '\\R^3' : String.raw`\operatorname{span}\{${B.map((b) => vtex(b)).join(',\,')}\}`;
          return String.raw`$T = ${mtex(A)}$, $\ \operatorname{null}T = ${sp}$ (dimension ${B.length}). $Tn = ${vtex(Tn, 3)}$ for every $n$ on the red set, while $Tx = ${vtex(Tx)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'The null space is a subspace',
      statement: String.raw`If $T\in\mathcal L(V,W)$, then $\operatorname{null}T$ is a subspace of $V$.`,
      idea: String.raw`Check the three conditions of 1.34. $T(0)=0$ (3.10), so $0\in\operatorname{null}T$. If $Tu=Tw=0$ then $T(u+w)=Tu+Tw=0$ by additivity, and $T(\lambda u)=\lambda Tu=0$ by homogeneity. In contrast, a level set $\{v: Tv=c\}$ with $c\ne0$ is not a subspace: it misses $0$ and $T(u+w)=2c$.`,
      caption: String.raw`Here $T\colon\R^3\to\R$ is $Tx=a\cdot x$; drag the orange coefficient vector $a$ to tilt the plane $\{Tx=c\}$. Drag $u$ and $w$ (they stay on it) and $\lambda$: with $c=0$ (the null space) $u+w$ and $\lambda u$ stay on the plane (green). Move $c$ off $0$ and they fly off it (red).`,
      deps: ['ladr-3.11', 'ladr-3.10', 'ladr-1.34'],
      tags: ['null space', 'subspaces'],
      viz(v) {
        const cs = v.slider('level $c$', -1, 1, 0, { step: 0.02 }), lam = v.slider('$\\lambda$', -1.6, 1.6, -1.2, { step: 0.05 });
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 1.9], equal: true, axes: false, height: 400, full: true });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.38 });
        const ah = sc.handle([0.25, -0.3, 1.0], { color: 'orange', label: 'a', snap: (p) => (len(p) < 0.4 ? scl(unit(len(p) > 1e-6 ? p : [0, 0, 1]), 0.4) : p) });
        const onPlane = (p) => { const nh = unit(ah.p), k = cs.value / len(ah.p); return sub(p, scl(nh, dot(p, nh) - k)); };
        const u = sc.handle([0.9, 0.3, 0], { color: 'blue', label: 'u', snap: onPlane }), w = sc.handle([-0.2, 0.9, 0], { color: 'purple', label: 'w', snap: onPlane });
        let info = {};
        v.legend([['accent', '$\\{x: Tx = c\\}$', { area: true }], ['green', 'still in the set'], ['red', 'left the set']]);
        v.render(() => {
          u.p = onPlane(u.p); w.p = onPlane(w.p);
          const a = ah.p, c = cs.value, T = (p) => dot(a, p), nh = unit(a), [e1, e2] = perpBasis(a), ctr = scl(nh, c / len(a));
          const U = u.p, Wv = w.p, UW = add(U, Wv), LU = scl(U, lam.value), ok = (p) => Math.abs(T(p) - c) < 1e-6;
          sc.begin();
          sc.disc(e1, e2, 1.45, { fill: 'accent', fillAlpha: 0.14, color: 'accent', grid: true }, ctr);
          sc.path([U, UW, Wv], { color: 'muted', dash: [4, 4], width: 1.2 });
          arrow3(sc, O3, a, 'orange', null, { width: 2 });
          arrow3(sc, O3, U, 'blue', null); arrow3(sc, O3, Wv, 'purple', null);
          arrow3(sc, O3, UW, ok(UW) ? 'green' : 'red', 'u+w', { S }); arrow3(sc, O3, LU, ok(LU) ? 'green' : 'red', '\\lambda u', { S });
          sc.dot(O3, { r: 5.5, color: ok(O3) ? 'green' : 'red' });
          sc.flush();
          S.corner(Math.abs(c) < 1e-9 ? 'c = 0: the plane is null T, a subspace' : 'c ≠ 0: this level set is not a subspace', 'tl', { color: Math.abs(c) < 1e-9 ? 'green' : 'red' });
          info = { a, c, Tu: T(U), Tw: T(Wv), Tuw: T(UW), Tlu: T(LU) };
        });
        v.readout(() => {
          const { a, c, Tu, Tw, Tuw, Tlu } = info; if (!a) return '';
          return String.raw`$Tx = ${formTeX(a)}$. $\ Tu = ${tn(Tu)}$, $Tw = ${tn(Tw)}$, $T(u+w) = Tu+Tw = ${tn(Tuw)}$, $T(\lambda u) = \lambda\,Tu = ${tn(Tlu)}$, $T(0) = 0$. ` + (Math.abs(c) < 1e-9 ? 'All are $0$: the null space contains $0$ and is closed under addition and scalar multiplication.' : String.raw`The set needs the value $${tn(c)}$, but sums give $2c$ and $0$ gives $0$: not a subspace.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Definition',
      name: 'Injective',
      statement: String.raw`A function $T\colon V\to W$ is **injective** if $Tu=Tv$ implies $u=v$; equivalently, distinct inputs always have distinct outputs: $u\ne v\Rightarrow Tu\ne Tv$.`,
      idea: String.raw`Injective means no information is lost: from the output one can recover the input. For a linear map of $\R^2$ given by a $2\times2$ matrix this fails exactly when the matrix squashes the plane onto a line or a point — then whole lines of inputs pile up on single outputs.`,
      caption: String.raw`Drag $Te_1, Te_2$; the coloured dots are sent to the right panel. While the parallelogram they span has area, every dot keeps its own place. Line $Te_2$ up with $Te_1$ (it snaps) and the picture collapses onto a line; then press the button: $q$ jumps to a point $\ne p$ with the same image.`,
      deps: ['ladr-3.1'],
      tags: ['linear maps'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 330, title: 'domain' });
        const W = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 330, title: 'target' });
        let c1, c2;
        c1 = W.handle(1.1, 0.4, { color: 'orange', label: 'Te₁', constrain: (x, y) => snapTo(disc(1.4)(x, y), [[c2.x, c2.y]], 0.1) });
        c2 = W.handle(-0.5, 0.9, { color: 'orange', label: 'Te₂', constrain: (x, y) => snapTo(disc(1.4)(x, y), [[c1.x, c1.y]], 0.1) });
        const p = D.handle(0.7, 0.55, { color: 'blue', label: 'p', constrain: disc(1.6) }), q = D.handle(-0.8, -0.4, { color: 'purple', label: 'q', constrain: disc(1.6) });
        const cloud = [];
        for (let i = 1; i <= 4; i++) for (let k = 0; k < 32; k++) { const t = (2 * Math.PI * k) / 32 + i * 0.1, r = 0.27 * i; cloud.push({ p: [r * Math.cos(t), r * Math.sin(t)], c: CLR[Math.floor(k / 4)] }); }
        let info = {};
        v.button('send $q$ onto a point with $Tq=Tp$', () => {
          const A = [[c1.x, c2.x], [c1.y, c2.y]], N = M.nullspace(A, 1e-6);
          if (!N.length) return;
          const d = N[0], P = [p.x, p.y];
          let t = 0.9; if (len(add(P, scl(d, t))) > 1.6) t = -0.9;
          q.set(...add(P, scl(d, t)));
        });
        v.render(() => {
          const A = [[c1.x, c2.x], [c1.y, c2.y]], dt = det2(colOf(A, 0), colOf(A, 1));
          for (const S of [D, W]) { S.line(-9, 0, 9, 0, { color: 'faint', width: 1 }); S.line(0, -9, 0, 9, { color: 'faint', width: 1 }); }
          W.poly([[0, 0], colOf(A, 0), add(colOf(A, 0), colOf(A, 1)), colOf(A, 1)], { fill: 'orange', fillAlpha: 0.1, color: 'orange', alpha: 0.4, width: 1 });
          for (const o of cloud) { D.dot(o.p[0], o.p[1], { r: 2.6, color: o.c }); const y = mv(A, o.p); W.dot(y[0], y[1], { r: 2.6, color: o.c }); }
          const P = [p.x, p.y], Q = [q.x, q.y], TP = mv(A, P), TQ = mv(A, Q), gap = len(sub(TP, TQ)), far = len(sub(P, Q));
          const hit = gap < 0.02 && far > 0.05;
          if (hit) D.line(P[0], P[1], Q[0], Q[1], { color: 'red', width: 2, dash: [5, 4] });
          W.dot(TP[0], TP[1], { r: 6, color: 'blue', label: 'Tp', labelPos: 'ne' }); W.dot(TQ[0], TQ[1], { r: 6, color: 'purple', label: hit ? '' : 'Tq', labelPos: 'sw' });
          if (hit) { W.dot(TP[0], TP[1], { r: 12, color: 'red', hollow: true }); W.tex('Tp=Tq', TP[0], TP[1], { color: 'red', size: 14, dy: 24 }); }
          W.corner(Math.abs(dt) > 1e-9 ? 'area ≠ 0: injective' : 'squashed onto a line: not injective', 'tl', { color: Math.abs(dt) > 1e-9 ? 'green' : 'red' });
          info = { A, dt, gap, far, hit };
        });
        v.readout(() => {
          const { A, dt, gap, far, hit } = info; if (!A) return '';
          return String.raw`$\det ${mtex(A)} = ${tn(dt, 3)}$. $\ \lVert p-q\rVert = ${tn(far)}$, $\lVert Tp-Tq\rVert = ${tn(gap, 3)}$. ` + (hit ? '**Collision**: $Tp=Tq$ although $p\\ne q$, so $T$ is not injective.' : Math.abs(dt) > 1e-9 ? 'Distinct points keep distinct images — try to make them collide: you cannot, unless the determinant is $0$.' : 'The map is not injective: press the button to exhibit a collision.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Theorem',
      name: 'Injectivity ⟺ null space equals {0}',
      statement: String.raw`Let $T\in\mathcal L(V,W)$. Then $T$ is injective if and only if $\operatorname{null}T=\{0\}$.`,
      idea: String.raw`If $T$ is injective and $Tv=0=T(0)$ (3.10), then $v=0$. Conversely, if $\operatorname{null}T=\{0\}$ and $Tu=Tv$, then $T(u-v)=Tu-Tv=0$, so $u-v\in\operatorname{null}T$ and $u=v$. The picture behind it: the inputs with the same image as $u$ form the translate $u+\operatorname{null}T$, so all these "fibres" are copies of the null space — single points exactly when the null space is $\{0\}$.`,
      caption: String.raw`Each coloured line on the left is a fibre $u+\operatorname{null}T$; the whole line goes to the dot of the same colour. Drag $u$ and $v$: $Tu=Tv$ happens exactly when $u-v$ (dashed) is parallel to the red null space. Pull $Te_2$ off the line through $Te_1$: the null space shrinks to $\{0\}$ and the fibres become single points.`,
      deps: ['ladr-3.14', 'ladr-3.11', 'ladr-3.10'],
      tags: ['null space', 'linear maps'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 330, title: 'domain: the fibres $u+\\operatorname{null}T$' });
        const W = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 330, title: 'target' });
        let c1, c2;
        c1 = W.handle(1.0, 0.5, { color: 'orange', label: 'Te₁', constrain: (x, y) => snapTo(disc(1.4)(x, y), [[c2.x, c2.y]], 0.12) });
        c2 = W.handle(-0.6, -0.3, { color: 'orange', label: 'Te₂', constrain: (x, y) => snapTo(disc(1.4)(x, y), [[c1.x, c1.y]], 0.12) });
        const u = D.handle(1.3, -1.0, { color: 'blue', label: 'u', constrain: disc(1.9) }), w = D.handle(-0.8, 1.3, { color: 'purple', label: 'v', constrain: disc(1.9) });
        v.button('put $v$ on the fibre of $u$', () => {
          const N = M.nullspace([[c1.x, c2.x], [c1.y, c2.y]], 1e-6); if (!N.length) return;
          const U = [u.x, u.y], d = N[0].length === 2 ? N[0] : [1, 0]; let t = 1.1; if (len(add(U, scl(d, t))) > 1.9) t = -1.1;
          w.set(...add(U, scl(d, t)));
        });
        let info = {};
        v.render(() => {
          const A = [[c1.x, c2.x], [c1.y, c2.y]], N = M.nullspace(A, 1e-6), U = [u.x, u.y], V = [w.x, w.y];
          if (N.length === 1) {
            const d = N[0], m = [-d[1], d[0]];
            for (let k = -6; k <= 6; k++) {
              const base = scl(m, 0.36 * k), col = k === 0 ? 'red' : CLR[(k + 8) % 8], y = mv(A, base);
              D.line(base[0] - 5 * d[0], base[1] - 5 * d[1], base[0] + 5 * d[0], base[1] + 5 * d[1], { color: col, width: k === 0 ? 3.5 : 1.6, alpha: k === 0 ? 0.9 : 0.55 });
              W.dot(y[0], y[1], { r: k === 0 ? 6 : 4, color: col });
            }
            const r = colOf(A, len(colOf(A, 0)) > 1e-9 ? 0 : 1);
            W.line(-r[0] * 9, -r[1] * 9, r[0] * 9, r[1] * 9, { color: 'muted', width: 1, alpha: 0.5 });
            D.line(U[0] - 5 * d[0], U[1] - 5 * d[1], U[0] + 5 * d[0], U[1] + 5 * d[1], { color: 'blue', width: 2.5, dash: [6, 4] });
            D.tex('\\operatorname{null}T', 1.7 * d[0] * Math.sign(d[1] || 1), 1.7 * Math.abs(d[1]) + 0.05, { color: 'red', size: 13, dx: 16 });
          } else if (N.length === 2) {
            D.rect(-2.2, -2.2, 2.2, 2.2, { fill: 'red', fillAlpha: 0.08, stroke: false });
            D.corner('null T = ℝ²: everything goes to 0', 'tl', { color: 'red' });
          } else {
            for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const p = [0.55 * i, 0.55 * j], y = mv(A, p), col = CLR[(i + j + 8) % 8]; D.dot(p[0], p[1], { r: 3.5, color: col }); W.dot(y[0], y[1], { r: 3.5, color: col }); }
            D.dot(0, 0, { r: 6, color: 'red' });
            D.corner('null T = {0}: every fibre is a single point', 'tl', { color: 'green' });
          }
          arrow2(D, V, U, 'muted', 'u-v', { width: 1.6, dash: [5, 4], size: 13 });
          arrow2(D, [0, 0], U, 'blue'); arrow2(D, [0, 0], V, 'purple');
          const TU = mv(A, U), TV = mv(A, V), same = len(sub(TU, TV)) < 1e-6;
          arrow2(W, [0, 0], TV, 'purple', same ? null : 'Tv'); arrow2(W, [0, 0], TU, 'blue', same ? 'Tu=Tv' : 'Tu');
          info = { A, N, same, d: sub(U, V), T: mv(A, sub(U, V)) };
        });
        v.readout(() => {
          const { A, N, same, d, T } = info; if (!A) return '';
          const nul = N.length === 0 ? '\\{0\\}' : N.length === 2 ? '\\R^2' : String.raw`\operatorname{span}\{${vtex(N[0])}\}`;
          return String.raw`$\operatorname{null}T = ${nul}$. $\ T(u-v) = Tu-Tv = ${vtex(T, 3)}$ ` + (same ? '$=0$: $u-v\\in\\operatorname{null}T$, and indeed $Tu=Tv$ with $u\\ne v$ — not injective.' : '$\\ne 0$, so $Tu\\ne Tv$.') + (N.length ? '' : ' With $\\operatorname{null}T=\\{0\\}$ this always happens: $T$ is injective.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Definition',
      name: 'Range',
      statement: String.raw`For a function $T\colon V\to W$, the **range** of $T$ is the set of all outputs:
$$\operatorname{range}T=\{Tv: v\in V\}\subseteq W.$$
Examples: the range of the zero map is $\{0\}$; the range of differentiation $\mathcal P(\R)\to\mathcal P(\R)$ is all of $\mathcal P(\R)$, since every polynomial has an antiderivative.`,
      idea: String.raw`The range (also called the *image*) is what $T$ can reach. For $x\mapsto Ax$ it is the span of the columns of $A$, since $Ax=x_1(\text{column }1)+\dots+x_n(\text{column }n)$. Deciding whether $y$ lies in the range is the same as deciding whether $Ax=y$ has a solution.`,
      caption: String.raw`A $3\times2$ matrix sends the plane into space; drag its columns $Te_1, Te_2$ (orange). The range is the green plane through $0$. Drag the gold target $y$: it snaps onto the plane when close and turns green, and its preimage appears on the left. Off the plane, no $x$ reaches it.`,
      deps: ['ladr-3.1'],
      tags: ['range'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 350, title: 'domain $\\R^2$' });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'target $\\R^3$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.35 });
        let t1, t2;
        t1 = sc.handle([1.0, 0.2, -0.3], { color: 'orange', label: 'Te₁', snap: (p) => snapTo(p, [t2.p], 0.1) });
        t2 = sc.handle([0.2, 0.9, 0.5], { color: 'orange', label: 'Te₂', snap: (p) => snapTo(p, [t1.p], 0.1) });
        const rng = () => colBasis(M, ofCols(t1.p, t2.p));
        const y = sc.handle(add(scl([1.0, 0.2, -0.3], -0.5), scl([0.2, 0.9, 0.5], 1.1)), { color: 'gold', label: 'y', snap: (p) => { const B = rng(); const q = proj(p, B); return len(sub(p, q)) < 0.12 ? q : p; } });
        const xh = D.handle(1.0, 0.6, { color: 'blue', label: 'x', constrain: disc(1.6) });
        let info = {};
        v.render(() => {
          const A = ofCols(t1.p, t2.p), B = colBasis(M, A), X = [xh.x, xh.y], TX = mv(A, X);
          const yp = proj(y.p, B), gap = len(sub(y.p, yp)), inR = gap < 1e-6;
          sc.begin();
          drawSub(sc, B, 'green', { r: 1.5 });
          if (!inR) sc.line(y.p, yp, { color: 'red', width: 2, dash: [4, 4] }, 1);
          arrow3(sc, O3, t1.p, 'orange', null, { width: 2 }); arrow3(sc, O3, t2.p, 'orange', null, { width: 2 });
          arrow3(sc, O3, TX, 'blue', 'Tx', { S });
          sc.dot(y.p, { r: 11, color: inR ? 'green' : 'red', hollow: true });
          sc.flush();
          D.line(-3, 0, 3, 0, { color: 'faint' }); D.line(0, -3, 0, 3, { color: 'faint' });
          arrow2(D, [0, 0], [1, 0], 'orange', 'e_1', { width: 1.8, size: 13 }); arrow2(D, [0, 0], [0, 1], 'orange', 'e_2', { width: 1.8, size: 13 });
          arrow2(D, [0, 0], X, 'blue');
          let pre = null;
          if (inR) {
            pre = M.lstsq(A, y.p); const N = M.nullspace(A, 1e-6);
            if (N.length === 1) D.line(pre[0] - 6 * N[0][0], pre[1] - 6 * N[0][1], pre[0] + 6 * N[0][0], pre[1] + 6 * N[0][1], { color: 'green', width: 2.5, dash: [6, 4] });
            D.dot(pre[0], pre[1], { r: 8, color: 'green', hollow: true }); D.tex('Tx=y', pre[0], pre[1], { color: 'green', size: 14, dy: 20 });
          } else D.corner('no x with Tx = y', 'tl', { color: 'red' });
          info = { A, B, gap, inR, pre };
        });
        v.readout(() => {
          const { A, B, gap, inR, pre } = info; if (!A) return '';
          return String.raw`$\operatorname{range}T = \operatorname{span}(Te_1,Te_2)$ has dimension ${B.length}. $\ y = ${vtex(y.p)}$ is at distance $${tn(gap, 3)}$ from it: ` + (inR ? String.raw`$y\in\operatorname{range}T$, e.g. $y = T${vtex(pre)}$.` : '$y\\notin\\operatorname{range}T$.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Theorem',
      name: 'The range is a subspace',
      statement: String.raw`If $T\in\mathcal L(V,W)$, then $\operatorname{range}T$ is a subspace of $W$.`,
      idea: String.raw`Again check 1.34. $0=T(0)\in\operatorname{range}T$ by 3.10. If $w_1=Tv_1$ and $w_2=Tv_2$, then $w_1+w_2=T(v_1+v_2)$ by additivity, and $\lambda w_1=T(\lambda v_1)$ by homogeneity, so both are outputs too. For an affine map $x\mapsto Ax+b$ with $b\notin\operatorname{range}A$ the set of outputs is a plane that misses $0$, and sums of outputs fall off it.`,
      caption: String.raw`Drag $v_1, v_2$ in the domain (left) and $\lambda$. On the right, $Tv_1+Tv_2$ (the parallelogram corner) is exactly $T(v_1+v_2)$ and $\lambda Tv_1$ is $T(\lambda v_1)$: they never leave the green range. Choose rank 1 for a range line; choose the affine map to see sums of outputs fall off the set of outputs.`,
      deps: ['ladr-3.16', 'ladr-3.10', 'ladr-1.34'],
      tags: ['range', 'subspaces'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'r2', label: 'rank 2' }, { value: 'r1', label: 'rank 1' }, { value: 'aff', label: 'affine $x\\mapsto Ax+b$' }], 'r2');
        const lam = v.slider('$\\lambda$', -1.5, 1.5, -0.8, { step: 0.05 });
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'domain $\\R^3$' });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'target $\\R^3$' });
        const scD = v.scene3(D, { yaw: -0.6, pitch: 0.33 }), scW = v.scene3(S, { yaw: -0.6, pitch: 0.33 });
        const v1 = scD.handle([0.9, 0.1, 0.4], { color: 'blue', label: 'v₁', lim: 1.2 }), v2 = scD.handle([-0.2, 0.8, 0.5], { color: 'purple', label: 'v₂', lim: 1.2 });
        const c1 = [0.8, 0.15, -0.3], c2 = [0.25, 0.7, 0.45], A2 = ofCols(c1, c2, sub(c1, scl(c2, 0.8)));
        const A1 = [[0.6], [0.5], [0.35]].map((r) => [r[0], -0.7 * r[0], 0.9 * r[0]]), b = [0.35, -0.55, 0.75];
        let info = {};
        v.render(() => {
          const aff = mode.value === 'aff', A = mode.value === 'r1' ? A1 : A2, bb = aff ? b : O3, T = (p) => add(mv(A, p), bb);
          const B = colBasis(M, A), N = M.nullspace(A, 1e-6), V1 = v1.p, V2 = v2.p, L = lam.value;
          const imgDist = (p) => len(sub(sub(p, bb), proj(sub(p, bb), B)));
          scD.begin();
          drawSub(scD, N, 'red', { r: 1.4, width: 2.5, alpha: 0.5, fillAlpha: 0.08, grid: false });
          scD.path([V1, add(V1, V2), V2], { color: 'muted', dash: [4, 4], width: 1.2 });
          arrow3(scD, O3, add(V1, V2), 'green', 'v_1+v_2', { S: D }); arrow3(scD, O3, scl(V1, L), 'gold', '\\lambda v_1', { S: D });
          arrow3(scD, O3, V1, 'blue', null); arrow3(scD, O3, V2, 'purple', null);
          scD.flush();
          const TV1 = T(V1), TV2 = T(V2), sum = add(TV1, TV2), Tsum = T(add(V1, V2)), lt = scl(TV1, L), Tl = T(scl(V1, L));
          const sOK = len(sub(sum, Tsum)) < 1e-6, lOK = len(sub(lt, Tl)) < 1e-6;
          scW.begin();
          drawSub(scW, B, aff ? 'orange' : 'green', { r: 1.5, c: bb });
          scW.path([TV1, sum, TV2], { color: 'muted', dash: [4, 4], width: 1.2 });
          arrow3(scW, O3, TV1, 'blue', 'Tv_1', { S }); arrow3(scW, O3, TV2, 'purple', 'Tv_2', { S });
          arrow3(scW, O3, sum, sOK ? 'green' : 'red', sOK ? 'Tv_1+Tv_2=T(v_1+v_2)' : 'Tv_1+Tv_2', { S, size: 13 });
          arrow3(scW, O3, lt, lOK ? 'gold' : 'red', lOK ? '\\lambda Tv_1' : '\\lambda Tv_1', { S, size: 13 });
          if (!sOK) { scW.dot(Tsum, { r: 5, color: 'green' }); scW.tex('T(v_1+v_2)', Tsum, { color: 'green', size: 13, dy: 16 }); }
          scW.dot(O3, { r: 5, color: imgDist(O3) < 1e-6 ? 'green' : 'red' });
          scW.flush();
          info = { aff, B, dSum: imgDist(sum), dL: imgDist(lt), d0: imgDist(O3) };
        });
        v.readout(() => {
          const { aff, B, dSum, dL, d0 } = info; if (!B) return '';
          if (!aff) return String.raw`$\operatorname{range}T$ is a ${B.length === 2 ? 'plane' : 'line'} through $0$. Distance from the range: $Tv_1+Tv_2$: $${tn(dSum, 3)}$, $\ \lambda Tv_1$: $${tn(dL, 3)}$, $\ 0$: $${tn(d0, 3)}$ — closed under both operations, as linearity forces.`;
          return String.raw`The outputs of $x\mapsto Ax+b$ form the orange plane, which misses $0$ (distance $${tn(d0)}$). $Tv_1+Tv_2$ is at distance $${tn(dSum)}$ from it and $\lambda Tv_1$ at $${tn(dL)}$: the set of outputs is **not** a subspace.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Definition',
      name: 'Surjective',
      statement: String.raw`A function $T\colon V\to W$ is **surjective** if its range is all of $W$, i.e. every $w\in W$ equals $Tv$ for some $v\in V$.`,
      idea: String.raw`Whether a map is surjective depends on the target: differentiation $\mathcal P_5(\R)\to\mathcal P_5(\R)$ is not surjective (it never produces $x^5$), but as a map $\mathcal P_5(\R)\to\mathcal P_4(\R)$ it is. For $x\mapsto Ax$ from $\R^3$ to $\R^2$, surjectivity means that the three columns span the plane, i.e. the rank is $2$.`,
      caption: String.raw`Choose a rank, or drag the columns $Te_1, Te_2, Te_3$ yourself (they snap onto a common line or to $0$). The gold dots are images of random inputs: they fill the green range — the whole plane, a line, or a point. Drag $y$: when it is reachable, its preimage $\{x: Tx=y\}$ (a line or a plane) appears in $\R^3$ on the left.`,
      deps: ['ladr-3.16'],
      tags: ['range'],
      viz(v) {
        const M = v.M;
        const P = { r2: [[1, 0.3], [0.3, 1], [-0.6, 0.5]], r1: [[1, 0.5], [-0.6, -0.3], [0.4, 0.2]], r0: [[0, 0], [0, 0], [0, 0]] };
        const pre = v.select('preset', [{ value: 'r2', label: 'rank 2' }, { value: 'r1', label: 'rank 1' }, { value: 'r0', label: 'rank 0' }], 'r2', { onChange: (k) => P[k].forEach((p, i) => th[i].set(p[0], p[1])) });
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'domain $\\R^3$: $\\{x : Tx=y\\}$' });
        const W = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 350, title: 'target $\\R^2$' });
        const sc = v.scene3(D, { yaw: -0.6, pitch: 0.33 });
        const th = [];
        P.r2.forEach((p, k) => th.push(W.handle(p[0], p[1], { color: 'orange', label: `Te${'₁₂₃'[k]}`, constrain: (x, y) => snapTo(disc(1.4)(x, y), th.filter((_, j) => j !== k).map((h) => [h.x, h.y]), 0.12) })));
        const yh = W.handle(-0.9, 1.1, { color: 'gold', label: 'y', constrain: (x, y) => {
          const A = [[th[0].x, th[1].x, th[2].x], [th[0].y, th[1].y, th[2].y]], B = colBasis(M, A);
          if (B.length === 1) { const q = proj([x, y], B); if (len(sub([x, y], q)) < 0.15) return q; }
          if (B.length === 0 && Math.hypot(x, y) < 0.15) return [0, 0];
          return [x, y];
        } });
        const r = v.rng(3), samples = Array.from({ length: 90 }, () => [r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)]);
        let info = {};
        v.render(() => {
          void pre;
          const A = [[th[0].x, th[1].x, th[2].x], [th[0].y, th[1].y, th[2].y]], B = colBasis(M, A), N = M.nullspace(A, 1e-6), Y = [yh.x, yh.y];
          const inR = len(sub(Y, proj(Y, B))) < 1e-6;
          if (B.length === 2) W.rect(W.bounds.x[0], W.bounds.y[0], W.bounds.x[1], W.bounds.y[1], { fill: 'green', fillAlpha: 0.1, stroke: false });
          else if (B.length === 1) W.line(-B[0][0] * 9, -B[0][1] * 9, B[0][0] * 9, B[0][1] * 9, { color: 'green', width: 6, alpha: 0.4 });
          else W.dot(0, 0, { r: 9, color: 'green' });
          for (const s of samples) { const q = mv(A, s); W.dot(q[0], q[1], { r: 2.3, color: 'gold', alpha: 0.8 }); }
          th.forEach((h) => arrow2(W, [0, 0], [h.x, h.y], 'orange', null, { width: 2 }));
          W.dot(Y[0], Y[1], { r: 12, color: inR ? 'green' : 'red', hollow: true });
          W.corner(B.length === 2 ? 'range T = ℝ²: surjective' : `range T is a ${B.length ? 'line' : 'point'}: not surjective`, 'tl', { color: B.length === 2 ? 'green' : 'red' });
          sc.begin();
          cubeEdges(sc, 1, { color: 'faint', width: 1 });
          if (inR) {
            const x0 = M.lstsq(A, Y);
            if (N.length === 1) { const [a, b] = clipBox(x0, N[0], 1.45); if (a < b) sc.line(add(x0, scl(N[0], a)), add(x0, scl(N[0], b)), { color: 'green', width: 3.5 }, 16); }
            else drawSub(sc, N, 'green', { c: x0, r: N.length === 3 ? 1.4 : 1.3 });
            sc.dot(x0, { r: 5, color: 'green' });
          } else sc.tex('\\text{empty: no } x \\text{ reaches } y', [0, 0, 1.55], { color: 'red', size: 14 });
          sc.dots(samples, { r: 1.8, color: 'gold' });
          sc.flush();
          info = { A, B, N, inR, Y };
        });
        v.readout(() => {
          const { A, B, N, inR, Y } = info; if (!A) return '';
          return String.raw`$T = ${mtex(A)}$ has range of dimension ${B.length}` + (B.length === 2 ? ' = $\\dim\\R^2$: $T$ is surjective.' : ' < 2: $T$ is not surjective.') + String.raw` $\ y=${vtex(Y)}$ ` + (inR ? String.raw`is reached; its preimage is a translate of $\operatorname{null}T$ (dimension ${N.length}).` : 'is not in the range.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.21
    {
      num: '3.21',
      kind: 'Theorem',
      name: 'Fundamental theorem of linear maps',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T\in\mathcal L(V,W)$. Then $\operatorname{range}T$ is finite-dimensional and
$$\dim V=\dim\operatorname{null}T+\dim\operatorname{range}T.$$`,
      idea: String.raw`$\operatorname{null}T$ is a subspace of $V$ (3.13), so it has a basis $u_1,\dots,u_m$, which extends to a basis $u_1,\dots,u_m,v_1,\dots,v_n$ of $V$ (2.32). Then $Tv_1,\dots,Tv_n$ is a basis of $\operatorname{range}T$: it spans because $Tu_k=0$, and it is independent because $\sum c_jTv_j=0$ puts $\sum c_jv_j$ in $\operatorname{null}T=\operatorname{span}(u_k)$, which the basis forbids unless all $c_j=0$. Counting, $\dim V=m+n$.`,
      caption: String.raw`Drag the columns $Te_1, Te_2, Te_3$ of a $3\times3$ matrix in the right panel (or pick a rank); they snap into a plane, onto a line or to $0$. Left: a basis of the red null space, extended by blue vectors to a basis of $\R^3$. Right: the images of the blue vectors (green) form a basis of the range. The blocks count $\dim\operatorname{null}T+\dim\operatorname{range}T=3$.`,
      deps: ['ladr-3.11', 'ladr-3.16', 'ladr-3.13', 'ladr-2.32', 'ladr-2.35'],
      see: ['pma-9.30'],
      tags: ['linear maps', 'dimension'],
      viz(v) {
        const M = v.M;
        const P = { r3: [[1, 0.2, -0.2], [0.1, 0.9, 0.3], [-0.2, 0.3, 1]], r2: [[1, 0.2, -0.2], [0.1, 0.9, 0.3], [0.68, 0.84, 0.12]], r1: [[0.8, 0.4, 0.5], [-0.56, -0.28, -0.35], [0.36, 0.18, 0.225]], r0: [O3, O3, O3] };
        v.select('preset', ['r3', 'r2', 'r1', 'r0'].map((k) => ({ value: k, label: `rank ${k[1]}` })), 'r2', { onChange: (k) => P[k].forEach((p, i) => th[i].set(p)) });
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, title: 'domain: null space + extension' });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, title: 'target: range' });
        const scD = v.scene3(D, { yaw: -0.6, pitch: 0.33 }), scW = v.scene3(S, { yaw: -0.6, pitch: 0.33 });
        const th = [];
        P.r2.forEach((p, k) => th.push(scW.handle(p, { color: 'orange', label: `Te${'₁₂₃'[k]}`, snap: (q) => snapTo(q, th.filter((_, j) => j !== k).map((h) => h.p), 0.12) })));
        let info = {};
        v.render(() => {
          const A = ofCols(th[0].p, th[1].p, th[2].p), N = M.nullspace(A, 1e-6), R = colBasis(M, A), X = colBasis(M, M.transpose(A));
          scD.begin();
          drawSub(scD, N, 'red', { r: 1.4 });
          N.forEach((u, k) => arrow3(scD, O3, u, 'red', `u_${k + 1}`, { S: D }));
          X.forEach((x, k) => arrow3(scD, O3, x, 'blue', `v_${k + 1}`, { S: D }));
          scD.flush();
          scW.begin();
          drawSub(scW, R, 'green', { r: 1.45 });
          th.forEach((h) => arrow3(scW, O3, h.p, 'orange', null, { width: 1.8, alpha: 0.7 }));
          X.forEach((x, k) => arrow3(scW, O3, mv(A, x), 'green', `Tv_${k + 1}`, { S }));
          scW.flush();
          // the count: one block per basis vector of V
          const w = 0.34;
          for (let k = 0; k < 3; k++) { const isN = k < N.length; D.rect(-1.9 + k * (w + 0.05), -1.92, -1.9 + k * (w + 0.05) + w, -1.66, { fill: isN ? 'red' : 'blue', fillAlpha: 0.55, color: isN ? 'red' : 'blue' }); }
          D.tex(String.raw`${N.length}+${R.length}=3`, -1.9 + 3 * (w + 0.05) + 0.1, -1.79, { align: 'left', size: 14, color: 'ink' });
          info = { A, N, R };
        });
        v.readout(() => {
          const { A, N, R } = info; if (!A) return '';
          const { R: E, pivots } = M.rref(A, 1e-6);
          return String.raw`$T = ${mtex(A)}$, $\ \operatorname{rref} = ${mtex(E)}$ (pivots in column${pivots.length === 1 ? '' : 's'} ${pivots.length ? pivots.map((p) => p + 1).join(', ') : '—'}). $\dim\operatorname{null}T + \dim\operatorname{range}T = ${N.length} + ${R.length} = 3 = \dim\R^3$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.22
    {
      num: '3.22',
      kind: 'Theorem',
      name: 'Map to a lower-dimensional space is not injective',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional with $\dim V>\dim W$. Then no linear map from $V$ to $W$ is injective.`,
      idea: String.raw`For $T\in\mathcal L(V,W)$, the fundamental theorem (3.21) gives $\dim\operatorname{null}T=\dim V-\dim\operatorname{range}T\ge\dim V-\dim W>0$, because $\operatorname{range}T\subseteq W$ has dimension at most $\dim W$ (2.37). So $\operatorname{null}T\ne\{0\}$, and $T$ is not injective by 3.15.`,
      caption: String.raw`Try to make $T\colon\R^3\to\R^2$ injective by dragging $Te_1,Te_2,Te_3$: the cube is flattened onto the blue hexagon, and a red line of vectors always crushes to $0$. The gold point $x$ shares its image with its whole dashed fibre. Switch to $\R^2\to\R^2$ (now $\dim V=\dim W$) and the red line can disappear.`,
      deps: ['ladr-3.21', 'ladr-2.37', 'ladr-3.15'],
      tags: ['linear maps', 'dimension'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: '3', label: '$T\\colon\\R^3\\to\\R^2$' }, { value: '2', label: '$T\\colon\\R^2\\to\\R^2$' }], '3');
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'domain' });
        const W = v.stage({ x: [-3.1, 3.1], y: [-3.1, 3.1], equal: true, height: 350, title: 'target $\\R^2$' });
        const sc = v.scene3(D, { yaw: -0.6, pitch: 0.33 });
        const th = [[1.0, 0.2], [0.3, 0.9], [-0.7, 0.6]].map((p, k) => W.handle(p[0], p[1], { color: 'orange', label: `Te${'₁₂₃'[k]}`, constrain: disc(1.2) }));
        const x = sc.handle([-0.6, -0.9, 0.2], { color: 'gold', label: 'x', lim: 1 });
        let info = {};
        v.render(() => {
          const three = mode.value === '3'; th[2].visible = three;
          if (three) x.mode = 'free'; else { x.mode = 'plane'; x.a = [1, 0, 0]; x.b = [0, 1, 0]; x.p = [x.p[0], x.p[1], 0]; }
          const A = three ? [[th[0].x, th[1].x, th[2].x], [th[0].y, th[1].y, th[2].y]] : [[th[0].x, th[1].x, 0], [th[0].y, th[1].y, 0]];
          const N = three ? M.nullspace(A, 1e-6) : M.nullspace([[th[0].x, th[1].x], [th[0].y, th[1].y]], 1e-6).map((n) => [n[0], n[1], 0]);
          const verts = three ? cubeVerts(1) : [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]];
          const img = M.hull(verts.map((p) => mv(A, p)));
          sc.begin();
          if (three) cubeEdges(sc, 1, { color: 'blue', width: 1.2, alpha: 0.55 });
          else sc.poly(verts, { fill: 'blue', fillAlpha: 0.1, color: 'blue', alpha: 0.6 });
          if (N.length === 1) {
            const d = N[0], tm = 1 / Math.max(...d.map(Math.abs));
            sc.line(scl(d, -1.6), scl(d, 1.6), { color: 'red', width: 3.5, alpha: 0.85 }, 16);
            for (let k = -4; k <= 4; k++) sc.dot(scl(d, (k / 4) * tm), { r: 3.5, color: 'red' });
            sc.line(add(x.p, scl(d, -1.4)), add(x.p, scl(d, 1.4)), { color: 'gold', width: 2, dash: [5, 4] }, 1);
          } else if (N.length >= 2) drawSub(sc, N, 'red', { r: 1.3 });
          sc.flush();
          W.poly(img, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.5 });
          (three ? th : th.slice(0, 2)).forEach((h) => arrow2(W, [0, 0], [h.x, h.y], 'orange', null, { width: 2 }));
          const Tx = mv(A, x.p);
          W.dot(Tx[0], Tx[1], { r: 6, color: 'gold' }); W.tex(N.length ? 'T(x+\\operatorname{null}T)' : 'Tx', Tx[0], Tx[1], { color: 'gold', size: 13, dy: 18 });
          if (N.length) { W.dot(0, 0, { r: 6, color: 'red' }); W.tex('T(\\operatorname{null}T)=0', 0, 0, { color: 'red', size: 13, dx: 12, dy: 16, align: 'left' }); }
          info = { three, N, rank: colBasis(M, A).length };
        });
        v.readout(() => {
          const { three, N, rank } = info; if (!N) return '';
          if (three) return String.raw`$\dim\operatorname{null}T = 3 - \dim\operatorname{range}T = 3 - ${rank} = ${N.length} \ge 3-2 = 1$: some nonzero vector always goes to $0$, so $T$ is never injective.`;
          return String.raw`Now $\dim V = \dim W = 2$ and $\dim\operatorname{null}T = 2 - ${rank} = ${N.length}$: ` + (N.length ? 'this $T$ happens to be singular.' : 'the null space is $\\{0\\}$ and $T$ is injective — the hypothesis $\\dim V>\\dim W$ was essential.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.24
    {
      num: '3.24',
      kind: 'Theorem',
      name: 'Map to a higher-dimensional space is not surjective',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional with $\dim V<\dim W$. Then no linear map from $V$ to $W$ is surjective.`,
      idea: String.raw`For $T\in\mathcal L(V,W)$, the fundamental theorem (3.21) gives $\dim\operatorname{range}T=\dim V-\dim\operatorname{null}T\le\dim V<\dim W$. A subspace of $W$ of smaller dimension cannot be all of $W$, so $\operatorname{range}T\ne W$.`,
      caption: String.raw`Drag the columns $Te_1, Te_2$: the image of the plane (grid and house) is at most the green plane in $\R^3$. Drag the gold target $y$ off it: the best possible input $\hat x$ (left) still misses by the red gap, and the red normal direction is never reached. Switch to $\R^2\to\R^2$ (everything confined to the floor) and every $y$ is hit.`,
      deps: ['ladr-3.21', 'ladr-3.19'],
      tags: ['linear maps', 'dimension'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: '3', label: '$T\\colon\\R^2\\to\\R^3$' }, { value: '2', label: '$T\\colon\\R^2\\to\\R^2$ (the floor)' }], '3');
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'domain $\\R^2$' });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: 'target' });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.4 });
        const t1 = sc.handle([1.0, 0.1, 0.3], { color: 'orange', label: 'Te₁' }), t2 = sc.handle([-0.1, 0.85, 0.45], { color: 'orange', label: 'Te₂' });
        const y = sc.handle([-0.6, 0.4, 1.0], { color: 'gold', label: 'y' });
        let info = {}, last = null;
        v.render(() => {
          const two = mode.value === '2';
          if (two !== last) {
            last = two;
            for (const h of [t1, t2, y]) { if (two) { h.mode = 'plane'; h.a = [1, 0, 0]; h.b = [0, 1, 0]; h.p = [h.p[0], h.p[1], 0]; } else h.mode = 'free'; }
            if (!two) { t1.p = [1.0, 0.1, 0.3]; t2.p = [-0.1, 0.85, 0.45]; y.p = [-0.6, 0.4, 1.0]; }
          }
          const A = ofCols(t1.p, t2.p), B = colBasis(M, A), xh = M.lstsq(A, y.p), Tx = mv(A, xh), gap = len(sub(y.p, Tx));
          sc.begin();
          if (two) sc.poly([[-1.5, -1.5, 0], [1.5, -1.5, 0], [1.5, 1.5, 0], [-1.5, 1.5, 0]], { fill: 'muted', fillAlpha: 0.06, color: 'muted', alpha: 0.3 });
          drawSub(sc, B, 'green', { r: 1.5, grid: false });
          for (let k = -2; k <= 2; k++) { sc.line(mv(A, [k * 0.5, -1.2]), mv(A, [k * 0.5, 1.2]), { color: 'green', width: 1, alpha: 0.45 }, 4); sc.line(mv(A, [-1.2, k * 0.5]), mv(A, [1.2, k * 0.5]), { color: 'green', width: 1, alpha: 0.45 }, 4); }
          sc.poly(HOUSE.map((p) => mv(A, p)), { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.5 });
          if (B.length === 2 && !two) { const n = unit(cross(B[0], B[1])); sc.line(scl(n, -1.5), scl(n, 1.5), { color: 'red', width: 1.5, dash: [6, 5], alpha: 0.7 }, 1); }
          arrow3(sc, O3, t1.p, 'orange', null, { width: 2 }); arrow3(sc, O3, t2.p, 'orange', null, { width: 2 });
          if (gap > 1e-6) { sc.line(Tx, y.p, { color: 'red', width: 3 }, 1); sc.dot(Tx, { r: 5, color: 'green' }); sc.tex('T\\hat x', Tx, { color: 'green', size: 13, dx: 16, dy: 10 }); }
          sc.dot(y.p, { r: 11, color: gap > 1e-6 ? 'red' : 'green', hollow: true });
          sc.flush();
          gridImg(D, (p) => p, { lin: true, R: 2, step: 0.5, color: 'muted', alpha: 0.2 });
          house(D, (p) => p, { color: 'accent' });
          arrow2(D, [0, 0], [1, 0], 'orange', 'e_1', { width: 1.8, size: 13 }); arrow2(D, [0, 0], [0, 1], 'orange', 'e_2', { width: 1.8, size: 13 });
          const xc = [M.clamp(xh[0], -1.9, 1.9), M.clamp(xh[1], -1.9, 1.9)];
          D.dot(xc[0], xc[1], { r: 7, color: gap > 1e-6 ? 'red' : 'green', hollow: true }); D.tex('\\hat x', xc[0], xc[1], { color: gap > 1e-6 ? 'red' : 'green', size: 15, dx: -16, dy: -14 });
          info = { two, rank: B.length, gap };
        });
        v.readout(() => {
          const { two, rank, gap } = info; if (rank == null) return '';
          if (two) return String.raw`Now $\dim V=\dim W=2$: $\dim\operatorname{range}T = ${rank}$` + (rank === 2 ? ', so every $y$ on the floor is hit exactly (gap $0$).' : ' — this $T$ is singular, but most choices are onto.');
          return String.raw`$\dim\operatorname{range}T = ${rank} \le \dim\R^2 = 2 < 3$. The best input $\hat x$ (least squares) leaves the gap $\lVert y-T\hat x\rVert = ${tn(gap, 3)}$` + (gap > 1e-6 ? ': $y\\notin\\operatorname{range}T$.' : ' — this $y$ happens to lie in the range, but almost no $y$ does.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.26
    {
      num: '3.26',
      kind: 'Theorem',
      name: 'Homogeneous system with more variables than equations',
      statement: String.raw`A homogeneous system of linear equations
$$\sum_{k=1}^{n}A_{j,k}x_k=0\qquad(j=1,\dots,m)$$
with more variables than equations ($n>m$) has a solution $(x_1,\dots,x_n)\ne0$.`,
      idea: String.raw`Define $T\colon\mathbf F^n\to\mathbf F^m$ by $T(x_1,\dots,x_n)=\bigl(\sum_kA_{1,k}x_k,\dots,\sum_kA_{m,k}x_k\bigr)$. The solutions are exactly $\operatorname{null}T$. Since $n>m$, Theorem 3.22 says $T$ is not injective, so $\operatorname{null}T\ne\{0\}$ (3.15).`,
      caption: String.raw`Each equation $a_j\cdot x=0$ is a plane through $0$ perpendicular to its coefficient vector $a_j$; drag $a_1, a_2$. Two planes through $0$ in $\R^3$ always share at least a line (green) — a nonzero solution. Turn on a third equation: now $n=m$, and typically the only common point is $0$.`,
      deps: ['ladr-3.22'],
      tags: ['linear equations'],
      viz(v) {
        const M = v.M;
        const third = v.toggle('third equation (then $n=m=3$)', false);
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 1.9], equal: true, axes: false, height: 400, full: true });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.36 });
        const cols = ['blue', 'purple', 'teal'], hs = [];
        [[0.3, -0.5, 0.9], [0.9, 0.5, 0.3], [-0.3, 1.0, 0.3]].forEach((p, k) => hs.push(sc.handle(p, { color: cols[k], label: `a${'₁₂₃'[k]}`, snap: (q) => { const r = snapTo(q, hs.filter((_, j) => j !== k && (j < 2 || third.value)).map((h) => h.p), 0.1); return len(r) < 0.3 ? q : r; } })));
        let info = {};
        v.render(() => {
          const m = third.value ? 3 : 2; hs[2].h.visible = third.value;
          const A = hs.slice(0, m).map((h) => h.p), N = M.nullspace(A, 1e-6);
          sc.begin();
          A.forEach((a, k) => { const [e1, e2] = perpBasis(a); sc.disc(e1, e2, 1.3, { fill: cols[k], fillAlpha: 0.1, color: cols[k], grid: false }); arrow3(sc, O3, a, cols[k], null, { width: 2 }); });
          drawSub(sc, N, 'green', { r: 1.6, width: 4.5, fillAlpha: 0.12 });
          if (N.length) arrow3(sc, O3, scl(N[0], 1.15), 'green', 'x', { S, width: 3 });
          sc.flush();
          info = { A, N };
        });
        v.readout(() => {
          const { A, N } = info; if (!A) return '';
          const sys = String.raw`\begin{aligned}` + A.map((a) => `${formTeX(a)} &= 0`).join(String.raw`\\`) + String.raw`\end{aligned}`;
          if (!N.length) return String.raw`$${sys}$ $\quad$ ${A.length} equations in 3 unknowns, and the planes meet only at $0$: the only solution is $x=0$ (now $n=m$, so 3.26 promises nothing).`;
          const x = scl(N[0], 1.15), res = A.map((a) => tn(dot(a, x), 3)).join(',\\ ');
          return String.raw`$${sys}$ $\quad$ ${A.length} equations, 3 unknowns: the solution set has dimension ${N.length}. A nonzero solution: $x = ${vtex(x)}$, which gives $${res}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.28
    {
      num: '3.28',
      kind: 'Theorem',
      name: 'System with more equations than variables',
      statement: String.raw`An inhomogeneous system of linear equations
$$\sum_{k=1}^{n}A_{j,k}x_k=c_j\qquad(j=1,\dots,m)$$
with more equations than variables ($m>n$) has **no** solution for some choice of the constant terms $c_1,\dots,c_m\in\mathbf F$.`,
      idea: String.raw`With $T\colon\mathbf F^n\to\mathbf F^m$ as in 3.26, the system is solvable exactly when $(c_1,\dots,c_m)\in\operatorname{range}T$. Since $n<m$, Theorem 3.24 says $T$ is not surjective, so some $c$ lies outside the range. In fact the solvable $c$ form a subspace of dimension at most $n$ — for three equations in two unknowns, at most a plane in $\R^3$.`,
      caption: String.raw`Three lines $a_j\cdot x=c_j$ in the plane: drag a line's handle to slide it parallel (changing $c_j$), or drag $c$ itself in $\R^3$ on the right. The three lines pass through one point (green) exactly when $c$ lies on the green plane $\operatorname{range}T$ — it snaps there when close. Everywhere else the lines form a red triangle: no solution.`,
      deps: ['ladr-3.24'],
      tags: ['linear equations'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 360, title: 'three equations in $x=(x_1,x_2)$' });
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, title: 'the constant terms $c\\in\\R^3$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.33, labels: ['c₁', 'c₂', 'c₃'] });
        const A = [[1, 0.25], [-0.35, 1], [0.75, 0.7]], cols = ['blue', 'purple', 'teal'];
        const R = colBasis(M, A);
        let c = [0.525, 0.325, 1.0], lastC = c.slice();
        const foot = (k, ck) => scl(A[k], ck / dot(A[k], A[k]));
        const hs = A.map((a, k) => { const f = foot(k, c[k]); return L.handle(f[0], f[1], { color: cols[k], constrain: (x, y) => { const t = M.clamp(dot([x, y], a) / dot(a, a), -1.45 / len(a), 1.45 / len(a)); return scl(a, t); } }); });
        const ch = sc.handle(c, { color: 'gold', label: 'c', snap: (p) => { const q = proj(p, R); return len(sub(p, q)) < 0.12 ? q : p; } });
        let info = {};
        v.render(() => {
          const cL = hs.map((h, k) => dot([h.x, h.y], A[k]));
          if (cL.some((x, i) => Math.abs(x - lastC[i]) > 1e-9)) { c = cL; ch.p = c.slice(); }
          else if (ch.p.some((x, i) => Math.abs(x - lastC[i]) > 1e-9)) { c = ch.p.slice(); hs.forEach((h, k) => { const f = foot(k, c[k]); h.x = f[0]; h.y = f[1]; }); }
          lastC = c.slice();
          const xh = M.lstsq(A, c), gap = len(sub(mv(A, xh), c)), ok = gap < 1e-6;
          const pts = [];
          for (const [i, j] of [[0, 1], [1, 2], [0, 2]]) pts.push(M.solve([A[i], A[j]], [c[i], c[j]]));
          if (!ok) L.poly(pts, { fill: 'red', fillAlpha: 0.18, color: 'red', width: 1, alpha: 0.6 });
          A.forEach((a, k) => {
            const f = foot(k, c[k]), d = unit([-a[1], a[0]]);
            L.line(f[0] - 6 * d[0], f[1] - 6 * d[1], f[0] + 6 * d[0], f[1] + 6 * d[1], { color: cols[k], width: 2.4 });
            L.line(0, 0, f[0], f[1], { color: cols[k], width: 1, dash: [3, 4], alpha: 0.6 });
          });
          if (ok) { L.dot(xh[0], xh[1], { r: 7, color: 'green' }); L.tex('x', xh[0], xh[1], { color: 'green', size: 15, dx: 12, dy: -12 }); }
          sc.begin();
          drawSub(sc, R, 'green', { r: 1.5 });
          if (!ok) { const q = proj(c, R); sc.line(c, q, { color: 'red', width: 2, dash: [4, 4] }, 1); }
          arrow3(sc, O3, c, ok ? 'green' : 'red', null, { width: 2.2 });
          sc.flush();
          info = { c, gap, ok, xh };
        });
        v.readout(() => {
          const { c, gap, ok, xh } = info; if (!c) return '';
          const sys = String.raw`\begin{aligned}` + A.map((a, k) => `${formTeX(a)} &= ${tn(c[k])}`).join(String.raw`\\`) + String.raw`\end{aligned}`;
          return String.raw`$${sys}$ $\quad$ ` + (ok ? String.raw`$c\in\operatorname{range}T$: the unique solution is $x = ${vtex(xh)}$.` : String.raw`$c$ is at distance $${tn(gap, 3)}$ from the plane $\operatorname{range}T$: **no solution**. Only the $c$ on a plane in $\R^3$ are solvable.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.31
    {
      num: '3.31',
      kind: 'Definition',
      name: 'Matrix of a linear map',
      statement: String.raw`Suppose $T\in\mathcal L(V,W)$, $v_1,\dots,v_n$ is a basis of $V$ and $w_1,\dots,w_m$ is a basis of $W$. The **matrix of $T$** with respect to these bases is the $m$-by-$n$ matrix $\mathcal M(T)$ whose entries $A_{j,k}$ are defined by
$$Tv_k=A_{1,k}w_1+\dots+A_{m,k}w_m\qquad(k=1,\dots,n).$$
So column $k$ of $\mathcal M(T)$ lists the coordinates of $Tv_k$ in the basis $w_1,\dots,w_m$. When the bases are not clear from context one writes $\mathcal M\bigl(T,(v_1,\dots,v_n),(w_1,\dots,w_m)\bigr)$.`,
      idea: String.raw`By the linear map lemma (3.4), $T$ is determined by $Tv_1,\dots,Tv_n$, and each $Tv_k$ is determined by its coordinates in the basis of $W$ (2.28). So the $mn$ numbers of $\mathcal M(T)$ capture $T$ completely — but they depend on the chosen bases: the same map has many matrices.`,
      caption: String.raw`Drag $Tv_1, Tv_2$ to change $T$: column $k$ of $\mathcal M(T)$ is read off from the dashed path along $w_1$ and $w_2$ to $Tv_k$. Drag the target basis $w_1, w_2$: the map stays the same (the house does not move) but the matrix changes. Dragging $v_1, v_2$ also keeps $T$ and moves $Tv_k$ with them.`,
      deps: ['ladr-3.1', 'ladr-2.26', 'ladr-3.4'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 350, title: 'domain: basis $v_1,v_2$' });
        const W = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 350, title: 'target: basis $w_1,w_2$' });
        let A = [[0.9, -0.55], [0.35, 0.8]];
        const v1 = D.handle(1, 0, { color: 'blue', label: 'v₁', constrain: disc(1.4) }), v2 = D.handle(0.45, 0.9, { color: 'purple', label: 'v₂', constrain: disc(1.4) });
        const w1 = W.handle(1.1, -0.35, { color: 'teal', label: 'w₁', constrain: disc(1.5) }), w2 = W.handle(0.5, 1.0, { color: 'pink', label: 'w₂', constrain: disc(1.5) });
        const T1 = mv(A, [1, 0]), T2 = mv(A, [0.45, 0.9]);
        const h1 = W.handle(T1[0], T1[1], { color: 'blue', label: 'Tv₁', constrain: disc(2.2) }), h2 = W.handle(T2[0], T2[1], { color: 'purple', label: 'Tv₂', constrain: disc(2.2) });
        let last = [T1, T2], info = {};
        v.render(() => {
          const a = [v1.x, v1.y], b = [v2.x, v2.y], Vm = ofCols(a, b), okV = Math.abs(det2(a, b)) > 1e-3;
          const cur = [[h1.x, h1.y], [h2.x, h2.y]];
          const moved = cur.some((p, k) => len(sub(p, last[k])) > 1e-9);
          if (moved && okV) A = mm(ofCols(cur[0], cur[1]), M.inverse(Vm));
          else { const t1 = mv(A, a), t2 = mv(A, b); h1.x = t1[0]; h1.y = t1[1]; h2.x = t2[0]; h2.y = t2[1]; }
          last = [[h1.x, h1.y], [h2.x, h2.y]];
          const p = [w1.x, w1.y], q = [w2.x, w2.y], Wm = ofCols(p, q), okW = Math.abs(det2(p, q)) > 1e-3;
          lattice(D, a, b, { color: 'accent', alpha: 0.15 }); lattice(W, p, q, { color: 'teal', alpha: 0.2 });
          house(D, (x) => x, { color: 'accent' }); house(W, (x) => mv(A, x), { color: 'accent' });
          arrow2(D, [0, 0], a, 'blue'); arrow2(D, [0, 0], b, 'purple');
          arrow2(W, [0, 0], p, 'teal'); arrow2(W, [0, 0], q, 'pink');
          let Mt = null;
          if (okW) {
            Mt = ofCols(M.solve(Wm, last[0]), M.solve(Wm, last[1]));
            [0, 1].forEach((k) => { const c = colOf(Mt, k), m1 = scl(p, c[0]), col = k ? 'purple' : 'blue'; W.path([[0, 0], m1, last[k]], { color: col, dash: [5, 4], width: 1.6, alpha: 0.85 }); });
            matPx(W, 10, 10, Mt, { label: '\\mathcal M(T)=', labelW: 74, colors: ['blue', 'purple'] });
          } else W.corner('w₁, w₂ is not a basis', 'tl', { color: 'red' });
          arrow2(W, [0, 0], last[0], 'blue', null); arrow2(W, [0, 0], last[1], 'purple', null);
          info = { Mt, A };
        });
        v.readout(() => {
          const { Mt, A: S } = info; if (!S) return '';
          if (!Mt) return 'Choose $w_1,w_2$ linearly independent to read off coordinates.';
          const col = (k) => String.raw`Tv_${k + 1} = ${tn(Mt[0][k])}\,w_1 ${Mt[1][k] < 0 ? '-' : '+'} ${tn(Math.abs(Mt[1][k]))}\,w_2`;
          return String.raw`$${col(0)}$, $\ ${col(1)}$, so $\mathcal M\bigl(T,(v_1,v_2),(w_1,w_2)\bigr) = ${mtex(Mt)}$. The same $T$ in the standard bases has matrix $${mtex(S)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.35
    {
      num: '3.35',
      kind: 'Theorem',
      name: 'Matrix of the sum of linear maps',
      statement: String.raw`Suppose $S,T\in\mathcal L(V,W)$. Then, with respect to the same bases $v_1,\dots,v_n$ of $V$ and $w_1,\dots,w_m$ of $W$,
$$\mathcal M(S+T)=\mathcal M(S)+\mathcal M(T).$$`,
      idea: String.raw`Column $k$ of $\mathcal M(S+T)$ holds the coordinates of $(S+T)v_k=Sv_k+Tv_k$ (definition of the sum, 3.6). If $Sv_k=\sum_jA_{j,k}w_j$ and $Tv_k=\sum_jC_{j,k}w_j$, then $Sv_k+Tv_k=\sum_j(A_{j,k}+C_{j,k})w_j$, and by uniqueness of coordinates (2.28) these are its coordinates. So matrices add entry by entry, exactly like the maps.`,
      caption: String.raw`The domain basis is $e_1,e_2$; drag $Se_k$ (blue), $Te_k$ (orange) and the target basis $w_1,w_2$. The green $(S+T)e_k$ is the parallelogram sum, and its dashed coordinate path along $w_1,w_2$ gives column $k$ of $\mathcal M(S+T)$ — the readout compares it with $\mathcal M(S)+\mathcal M(T)$. The right panel shows the three maps acting on the house.`,
      deps: ['ladr-3.31', 'ladr-3.6'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const W = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 360, title: 'columns: $(S+T)e_k = Se_k + Te_k$' });
        const H = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 360, title: 'the maps $S$, $T$, $S+T$ on a house' });
        const w1 = W.handle(0.3, -1.0, { color: 'teal', label: 'w₁', constrain: disc(1.5) }), w2 = W.handle(-0.9, 0.3, { color: 'pink', label: 'w₂', constrain: disc(1.5) });
        const s1 = W.handle(0.8, 0.3, { color: 'blue', label: 'Se₁', constrain: disc(1.3) }), s2 = W.handle(-0.3, 0.8, { color: 'blue', label: 'Se₂', constrain: disc(1.3) });
        const t1 = W.handle(0.4, -0.5, { color: 'orange', label: 'Te₁', constrain: disc(1.3) }), t2 = W.handle(0.5, 0.6, { color: 'orange', label: 'Te₂', constrain: disc(1.3) });
        let info = {};
        v.legend([['blue', '$S$'], ['orange', '$T$'], ['green', '$S+T$'], ['teal', 'basis $w_1, w_2$ of $W$']]);
        v.render(() => {
          const p = [w1.x, w1.y], q = [w2.x, w2.y], Wm = ofCols(p, q), okW = Math.abs(det2(p, q)) > 1e-3;
          const Sc = [[s1.x, s1.y], [s2.x, s2.y]], Tc = [[t1.x, t1.y], [t2.x, t2.y]], Uc = [add(Sc[0], Tc[0]), add(Sc[1], Tc[1])];
          lattice(W, p, q, { color: 'teal', alpha: 0.18 });
          arrow2(W, [0, 0], p, 'teal'); arrow2(W, [0, 0], q, 'pink');
          [0, 1].forEach((k) => {
            const s = Sc[k], t = Tc[k], u = Uc[k];
            W.path([s, u, t], { color: 'muted', dash: [4, 4], width: 1.2 });
            if (okW) { const c = M.solve(Wm, u); W.path([[0, 0], scl(p, c[0]), u], { color: 'green', dash: [5, 4], width: 1.6, alpha: 0.8 }); }
            arrow2(W, [0, 0], s, 'blue', null, { width: 2.2 }); arrow2(W, [0, 0], t, 'orange', null, { width: 2.2 });
            arrow2(W, [0, 0], u, 'green', `(S+T)e_${k + 1}`, { size: 13 });
          });
          const Sm = ofCols(...Sc), Tm = ofCols(...Tc), Um = ofCols(...Uc);
          gridImg(H, (x) => x, { lin: true, R: 3, step: 0.5, color: 'muted', alpha: 0.15 });
          house(H, (x) => mv(Sm, x), { color: 'blue', alpha: 0.8 }); house(H, (x) => mv(Tm, x), { color: 'orange', alpha: 0.8 }); house(H, (x) => mv(Um, x), { color: 'green' });
          if (!okW) { W.corner('w₁, w₂ is not a basis', 'tl', { color: 'red' }); info = {}; return; }
          const Wi = M.inverse(Wm), MS = mm(Wi, Sm), MT = mm(Wi, Tm), MU = ofCols(M.solve(Wm, Uc[0]), M.solve(Wm, Uc[1]));
          info = { MS, MT, MU, sum: MS.map((r, i) => r.map((x, j) => x + MT[i][j])) };
        });
        v.readout(() => {
          const { MS, MT, MU, sum } = info; if (!MS) return 'Choose $w_1, w_2$ linearly independent.';
          return String.raw`$\mathcal M(S)+\mathcal M(T) = ${mtex(MS)} + ${mtex(MT)} = ${mtex(sum)}$, and reading off the coordinates of $(S+T)e_1,(S+T)e_2$ directly gives $\mathcal M(S+T) = ${mtex(MU)}$ (largest difference $${v.sci(mdiff(sum, MU), 1)}$).`;
        });
      },
    },
  ],
};
