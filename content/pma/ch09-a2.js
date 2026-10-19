// Rudin, Principles of Mathematical Analysis — Chapter 9, part 2:
// the space L(R^n, R^m) and its norm, invertible operators, matrices, and the derivative (9.6–9.12).

const TAU = 2 * Math.PI;
/** m×2 matrix (rows) times a 2-vector. */
const mv = (A, x) => A.map((r) => r[0] * x[0] + r[1] * x[1]);
const mm = (A, B) => A.map((r) => [r[0] * B[0][0] + r[1] * B[1][0], r[0] * B[0][1] + r[1] * B[1][1]]);
const madd = (A, B, s = 1) => A.map((r, i) => r.map((x, j) => x + s * B[i][j]));
const rot = (t) => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
const inv2 = (A) => { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
const det = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
/** Singular value decomposition of an m×2 matrix: σ1 ≥ σ2 with right (v) and left (u) singular vectors. */
function svd(A) {
  let a = 0, b = 0, d = 0;
  for (const r of A) { a += r[0] * r[0]; b += r[0] * r[1]; d += r[1] * r[1]; }
  const tr = (a + d) / 2, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = tr + disc, l2 = Math.max(0, tr - disc);
  let v1 = Math.abs(b) > 1e-14 ? [l1 - d, b] : a >= d ? [1, 0] : [0, 1];
  const n = Math.hypot(...v1); v1 = [v1[0] / n, v1[1] / n];
  const v2 = [-v1[1], v1[0]];
  const s = [Math.sqrt(l1), Math.sqrt(l2)];
  const u = [v1, v2].map((vv, i) => (s[i] > 1e-12 ? mv(A, vv).map((x) => x / s[i]) : null));
  return { s, v: [v1, v2], u };
}
const opn = (A) => svd(A).s[0];
const frob = (A) => Math.sqrt(A.flat().reduce((t, x) => t + x * x, 0));
/** TeX for a matrix. */
function pm(A, d = 2) { return String.raw`\begin{pmatrix}` + A.map((r) => r.map((x) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d)).join('&')).join(String.raw`\\`) + String.raw`\end{pmatrix}`; }
/** Ellipse x ↦ c + A(cos t, sin t) as a polygon. */
const ell = (A, c = [0, 0], k = 1, n = 160) => Array.from({ length: n + 1 }, (_, i) => { const t = TAU * i / n; const p = mv(A, [Math.cos(t), Math.sin(t)]); return [c[0] + k * p[0], c[1] + k * p[1]]; });
/** Equal-aspect window centred at (cx, cy) with half-width hw on a non-equal stage. */
function fitEqual(S, cx, cy, hw) { const a = S.height / S.width; if (a > 1) S.setView([cx - hw, cx + hw], [cy - hw * a, cy + hw * a]); else S.setView([cx - hw / a, cx + hw / a], [cy - hw, cy + hw]); }
/** Arrow p→q with a KaTeX label just beyond the tip. */
function vecArrow(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.4, head: o.head ?? 9, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = (q[0] - p[0]) * S.scale, dy = (q[1] - p[1]) * S.scale, L = Math.hypot(dx, dy) || 1, off = o.off ?? 14;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 14, dx: (dx / L) * off + (o.dx || 0), dy: -(dy / L) * off + (o.dy || 0) });
  }
}

export default {
  collection: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6',
      kind: 'Definition',
      name: 'The space L(X,Y), products, and the operator norm',
      statement: String.raw`(a) $L(X,Y)$ is the set of all linear transformations of the vector space $X$ into the vector space $Y$, and $L(X)=L(X,X)$. With $(c_1A_1+c_2A_2)x=c_1A_1x+c_2A_2x$ it is itself a vector space.
(b) If $A\in L(X,Y)$ and $B\in L(Y,Z)$, their *product* is the composition $(BA)x=B(Ax)$; then $BA\in L(X,Z)$. In general $BA\neq AB$, even when both are defined.
(c) For $A\in L(\R^n,\R^m)$ the *norm* $\|A\|$ is the supremum of $|Ax|$ over all $x\in\R^n$ with $|x|\le1$. Then $|Ax|\le\|A\|\,|x|$ for every $x$, and if $\lambda$ is any number with $|Ax|\le\lambda|x|$ for all $x$, then $\|A\|\le\lambda$.`,
      idea: String.raw`$\|A\|$ is the largest factor by which $A$ stretches a vector: by homogeneity, $|Ax|=|x|\,|A(x/|x|)|\le\|A\|\,|x|$, and $\|A\|$ is the smallest constant with this property. For a $2\times2$ matrix the unit circle goes to an ellipse and $\|A\|$ is its longest semi-axis (the largest singular value).`,
      caption: String.raw`Drag the columns $Ae_1$, $Ae_2$ (which define $A$) and the point $x$ in the unit ball. The image of the unit ball is the blue ellipse; its longest semi-axis (green) is $\|A\|$, attained at the dashed direction in the domain. The lower panel graphs $|Ax|$ around the unit circle: $\|A\|$ is the maximum of this curve.`,
      deps: ['pma-9.4', 'pma-1.36'],
      see: ['rca-5.2', 'fa-1.2'],
      tags: ['operator norm', 'linear maps'],
      viz(v) {
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.3, 1.3], equal: true, height: 290, title: 'domain: the unit ball $|x|\\le1$' });
        const R = v.stage({ x: [-2.6, 2.6], y: [-2.25, 2.25], equal: true, height: 290, title: 'target: its image under $A$' });
        const P = v.stage({ x: [0, TAU], y: [0, 2.2], height: 150, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [TAU, '2π']], title: '$|A(\\cos\\theta,\\sin\\theta)|$ against $\\theta$' });
        const hx = L.handle(Math.cos(0.9) * 0.85, Math.sin(0.9) * 0.85, { color: 'gold', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1 ? [x / r, y / r] : [x, y]; } });
        const a1 = R.handle(1.5, 0.55, { color: 'blue', r: 6 });
        const a2 = R.handle(-0.2, 0.85, { color: 'orange', r: 6 });
        v.legend([['accent', 'image of the unit ball', { area: true }], ['green', 'longest semi-axis $=\\|A\\|$'], ['gold', '$x$ and $Ax$']]);
        let st = {};
        v.render(() => {
          const A = [[a1.x, a2.x], [a1.y, a2.y]];
          const { s, v: V, u: U } = svd(A);
          const nA = s[0];
          const x = [hx.x, hx.y], Ax = mv(A, x);
          // domain
          L.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.6 });
          L.line(-1.4 * V[0][0], -1.4 * V[0][1], 1.4 * V[0][0], 1.4 * V[0][1], { color: 'green', width: 1.4, dash: [5, 4] });
          L.dot(V[0][0], V[0][1], { color: 'green', r: 4 }); L.dot(-V[0][0], -V[0][1], { color: 'green', r: 4 });
          vecArrow(L, [0, 0], [1, 0], 'blue', 'e_1', { width: 1.8, alpha: 0.7 });
          vecArrow(L, [0, 0], [0, 1], 'orange', 'e_2', { width: 1.8, alpha: 0.7 });
          vecArrow(L, [0, 0], x, 'gold', null, { width: 2.6, head: 0 });
          L.tex('x', x[0], x[1], { color: 'gold', dx: 13, dy: -12 });
          // target
          const hw = Math.max(1.6, nA * 1.25, Math.hypot(a1.x, a1.y) * 1.15, Math.hypot(a2.x, a2.y) * 1.15);
          fitEqual(R, 0, 0, hw);
          R.circle(0, 0, nA, { color: 'green', width: 1.3, dash: [5, 4] });
          R.poly(ell(A), { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2 });
          if (U[0]) {
            const a = [nA * U[0][0], nA * U[0][1]];
            R.line(-a[0], -a[1], 0, 0, { color: 'green', width: 1.4, dash: [4, 3] });
            vecArrow(R, [0, 0], a, 'green', null, { width: 2.6 });
            R.tex('\\|A\\|', a[0] / 2, a[1] / 2, { color: 'green', size: 14, dx: -U[0][1] * 14, dy: -U[0][0] * 14 });
          }
          R.line(0, 0, a1.x, a1.y, { color: 'blue', width: 1.6, alpha: 0.7 }); R.line(0, 0, a2.x, a2.y, { color: 'orange', width: 1.6, alpha: 0.7 });
          R.tex('Ae_1', a1.x, a1.y, { color: 'blue', size: 13, dx: 8, dy: 15, align: 'left' });
          R.tex('Ae_2', a2.x, a2.y, { color: 'orange', size: 13, dx: -8, dy: -12, align: 'right' });
          vecArrow(R, [0, 0], Ax, 'gold', 'Ax', { width: 2.6 });
          // profile
          P.setView(null, [0, nA * 1.2]);
          P.fn((t) => Math.hypot(...mv(A, [Math.cos(t), Math.sin(t)])), { domain: [0, TAU], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.1 });
          P.hline(nA, { color: 'green', width: 1.6, dash: [6, 4] });
          P.text('‖A‖', 0.08, nA, { dy: -9, color: 'green', weight: 600 });
          const th = Math.atan2(x[1], x[0]), thp = th < 0 ? th + TAU : th;
          P.vline(thp, { color: 'gold', width: 1, dash: [3, 3] });
          P.dot(thp, Math.hypot(...mv(A, [Math.cos(th), Math.sin(th)])), { color: 'gold', r: 5 });
          st = { nA, x, Ax, s };
        });
        v.readout(() => {
          const { nA, x, Ax, s } = st; if (!s) return '';
          const nx = Math.hypot(...x);
          return `$|x| = ${v.fix(nx, 3)}$, $\\;|Ax| = ${v.fix(Math.hypot(...Ax), 3)} \\le \\|A\\|\\,|x| = ${v.fix(nA * nx, 3)}$. $\\;\\|A\\| = ${v.fix(nA, 3)}$ is the largest singular value; the smallest is $${v.fix(s[1], 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7',
      kind: 'Theorem',
      name: 'L(R^n, R^m) is a normed space; ‖BA‖ ≤ ‖B‖‖A‖',
      statement: String.raw`(a) If $A\in L(\R^n,\R^m)$, then $\|A\|<\infty$ and $A$ is a uniformly continuous map of $\R^n$ into $\R^m$.
(b) If $A,B\in L(\R^n,\R^m)$ and $c$ is a scalar, then $\|A+B\|\le\|A\|+\|B\|$ and $\|cA\|=|c|\,\|A\|$. With the distance $\|A-B\|$, $L(\R^n,\R^m)$ is a metric space.
(c) If $A\in L(\R^n,\R^m)$ and $B\in L(\R^m,\R^k)$, then $\|BA\|\le\|B\|\,\|A\|$.`,
      idea: String.raw`(a) If $|x|\le1$ then $x=\sum c_ie_i$ with every $|c_i|\le1$, so $|Ax|\le\sum|c_i|\,|Ae_i|\le\sum|Ae_i|$, a finite bound; then $|Ax-Ay|=|A(x-y)|\le\|A\|\,|x-y|$ gives uniform continuity. (b) $|(A+B)x|\le|Ax|+|Bx|\le(\|A\|+\|B\|)|x|$, and the metric axioms follow. (c) $|BAx|\le\|B\|\,|Ax|\le\|B\|\,\|A\|\,|x|$. Each time the last clause of Definition 9.6(c) converts a pointwise bound into a bound on the norm.`,
      caption: String.raw`Pick a part. In (c) the unit ball goes to $A$(ball) $\subset\|A\|\cdot$ball, then to $BA$(ball) $\subset B(\|A\|\cdot$ball$)\subset\|B\|\,\|A\|\cdot$ball; rotate $A$ with the slider and equality holds only when the long axis of $A$(ball) lines up with the direction that $B$ stretches most (purple). In (b) the green $(A+B)x$ is the chain $Ax$ then $Bx$. In (a) drag $x,y$: the image of the ball of radius $|x-y|$ stays inside the ball of radius $\|A\|\,|x-y|$, and the scatter of random pairs lies under the line of slope $\|A\|$.`,
      deps: ['pma-9.6', 'pma-9.1', 'pma-1.37', 'pma-4.18', 'pma-2.15'],
      see: ['rca-5.3', 'fa-1.17', 'fa-1.20'],
      tags: ['operator norm', 'metric spaces'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'prod', label: '(c) $\\|BA\\|\\le\\|B\\|\\|A\\|$' }, { value: 'sum', label: '(b) $\\|A+B\\|\\le\\|A\\|+\\|B\\|$' }, { value: 'lip', label: '(a) $|Ax-Ay|\\le\\|A\\||x-y|$' }], 'prod');
        const phi = v.slider('rotate the output of $A$ by $\\varphi$', -Math.PI, Math.PI, 0.5, { step: 0.01 });
        const P1 = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], height: 270, minWidth: 250, title: 'domain' });
        const P2 = v.stage({ x: [-2, 2], y: [-2, 2], height: 270, minWidth: 250 });
        const P3 = v.stage({ x: [-2, 2], y: [-2, 2], height: 270, minWidth: 250 });
        const hx = P1.handle(Math.cos(1.1), Math.sin(1.1), { color: 'gold', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const hp = P1.handle(-0.4, -0.2, { color: 'blue' });
        const hq = P1.handle(0.25, 0.25, { color: 'orange' });
        const A0 = mm(mm(rot(0.15), [[1.35, 0], [0, 0.55]]), rot(-0.35));
        const B = mm(mm(rot(-0.4), [[1.25, 0], [0, 0.4]]), rot(0.85));
        const rng = v.rng(7);
        const pairs = Array.from({ length: 220 }, () => { const r = Math.sqrt(rng()) * 2, t = rng() * TAU; return [r * Math.cos(t), r * Math.sin(t)]; });
        let st = {};
        v.render(() => {
          const m = mode.value;
          const A = mm(rot(phi.value), A0);
          const nA = opn(A), nB = opn(B);
          hx.visible = m !== 'lip'; hp.visible = hq.visible = m === 'lip';
          if (m !== 'lip') {
            fitEqual(P1, 0, 0, 1.35);
            P1.setTitle('domain: unit ball'); P1.circle(0, 0, 1, { fill: 'gray', fillAlpha: 0.12, color: 'ink', width: 1.4 });
            vecArrow(P1, [0, 0], [hx.x, hx.y], 'gold', null, { width: 2.4, head: 0 });
            P1.tex('x', hx.x, hx.y, { color: 'gold', dx: 13 * Math.sign(hx.x || 1), dy: -12 });
          }
          if (m === 'prod') {
            const BA = mm(B, A), nBA = opn(BA);
            const x = [hx.x, hx.y], Ax = mv(A, x), BAx = mv(BA, x);
            fitEqual(P2, 0, 0, nA * 1.2); P2.setTitle('$A$(ball) and radius $\\|A\\|$');
            const vb = svd(B).v[0], Lb = nA * 1.6;
            P2.line(-vb[0] * Lb, -vb[1] * Lb, vb[0] * Lb, vb[1] * Lb, { color: 'purple', width: 1.6, dash: [6, 4] });
            P2.circle(0, 0, nA, { color: 'accent', width: 1.2, dash: [4, 4] });
            P2.poly(ell(A), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
            vecArrow(P2, [0, 0], Ax, 'gold', 'Ax', { width: 2.2 });
            const R = nB * nA * 1.12; fitEqual(P3, 0, 0, R); P3.setTitle('$BA$(ball) $\\subset B(\\|A\\|\\cdot$ball$)$');
            P3.circle(0, 0, nB * nA, { color: 'red', width: 1.4, dash: [6, 4] });
            P3.poly(ell(B, [0, 0], nA), { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.4, dash: [4, 3] });
            P3.circle(0, 0, nBA, { color: 'green', width: 1.2, dash: [2, 3] });
            P3.poly(ell(BA), { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
            vecArrow(P3, [0, 0], BAx, 'gold', 'BAx', { width: 2.2 });
            v.legend([['accent', '$A$(ball)', { area: true }], ['purple', 'direction $B$ stretches most', { dash: true }], ['orange', '$B(\\|A\\|\\cdot$ball$)$', { area: true }], ['green', '$BA$(ball), radius $\\|BA\\|$', { area: true }], ['red', 'radius $\\|B\\|\\,\\|A\\|$', { dash: true }]]);
            st = { m, nA, nB, nBA };
          } else if (m === 'sum') {
            const S = madd(A, B), nS = opn(S);
            const x = [hx.x, hx.y], Ax = mv(A, x), Bx = mv(B, x), Sx = mv(S, x);
            const h2 = Math.max(nA, nB) * 1.2; fitEqual(P2, 0, 0, h2); P2.setTitle('$A$(ball) and $B$(ball)');
            P2.poly(ell(A), { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2 });
            P2.poly(ell(B), { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 2 });
            vecArrow(P2, [0, 0], Ax, 'accent', 'Ax', { width: 2.2 });
            vecArrow(P2, [0, 0], Bx, 'orange', 'Bx', { width: 2.2 });
            fitEqual(P3, 0, 0, (nA + nB) * 1.1); P3.setTitle('$(A+B)$(ball)');
            P3.circle(0, 0, nA + nB, { color: 'red', width: 1.4, dash: [6, 4] });
            P3.circle(0, 0, nS, { color: 'green', width: 1.2, dash: [2, 3] });
            P3.poly(ell(S), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2 });
            vecArrow(P3, [0, 0], Ax, 'accent', null, { width: 2 });
            vecArrow(P3, Ax, Sx, 'orange', null, { width: 2 });
            vecArrow(P3, [0, 0], Sx, 'green', '(A+B)x', { width: 2.4 });
            v.legend([['accent', '$A$(ball), $Ax$', { area: true }], ['orange', '$B$(ball), $Bx$', { area: true }], ['green', '$(A+B)$(ball), radius $\\|A+B\\|$', { area: true }], ['red', 'radius $\\|A\\|+\\|B\\|$', { dash: true }]]);
            st = { m, nA, nB, nS };
          } else {
            const p = [hp.x, hp.y], q = [hq.x, hq.y], d = M.dist(p, q);
            const Ap = mv(A, p), Aq = mv(A, q);
            fitEqual(P1, 0, 0, 1.35); P1.setTitle('domain: ball of radius $|x-y|$');
            P1.circle(p[0], p[1], d, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.4 });
            P1.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1.4, dash: [3, 3] });
            P1.tex('x', p[0], p[1], { color: 'blue', dx: -12, dy: 12 }); P1.tex('y', q[0], q[1], { color: 'orange', dx: 12, dy: -12 });
            fitEqual(P2, (Ap[0] + Aq[0]) / 2, (Ap[1] + Aq[1]) / 2, Math.max(0.6, nA * d * 1.35));
            P2.setTitle('its image under $A$');
            P2.circle(Ap[0], Ap[1], nA * d, { color: 'green', width: 1.6, dash: [6, 4], fill: 'green', fillAlpha: 0.06 });
            P2.poly(ell(A, Ap, d), { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.8 });
            P2.line(Ap[0], Ap[1], Aq[0], Aq[1], { color: 'muted', width: 1.4, dash: [3, 3] });
            P2.dot(Ap[0], Ap[1], { color: 'blue', r: 5.5 }); P2.dot(Aq[0], Aq[1], { color: 'orange', r: 5.5 });
            P2.tex('Ax', Ap[0], Ap[1], { color: 'blue', dx: -14, dy: 13 }); P2.tex('Ay', Aq[0], Aq[1], { color: 'orange', dx: 14, dy: -13 });
            const crude = Math.hypot(A[0][0], A[1][0]) + Math.hypot(A[0][1], A[1][1]);
            P3.setTitle('$|Ax-Ay|$ against $|x-y|$'); P3.setView([-0.1, 2.15], [-0.1 * crude * 2.15, crude * 2.15 * 1.02]);
            P3.line(0, 0, 3, 3 * crude, { color: 'muted', width: 1.4, dash: [5, 4] });
            P3.line(0, 0, 3, 3 * nA, { color: 'green', width: 2 });
            P3.dots(pairs.map((dd) => [Math.hypot(...dd), Math.hypot(...mv(A, dd))]), { color: 'accent', r: 2.4, alpha: 0.6 });
            P3.dot(d, Math.hypot(Aq[0] - Ap[0], Aq[1] - Ap[1]), { color: 'gold', r: 5.5 });
            P3.text('slope ‖A‖', 1.25, 1.25 * nA, { color: 'green', dx: -6, dy: -10, align: 'right', weight: 600, size: 11.5 });
            P3.text('slope Σ|Aeᵢ|', 1.05, 1.05 * crude, { color: 'muted', dx: -6, dy: -10, align: 'right', weight: 600, size: 11.5 });
            v.legend([['orange', 'ball about $x$ and its image', { area: true }], ['green', 'Lipschitz bound $\\|A\\|$'], ['muted', 'the cruder bound $\\sum_i|Ae_i|$ from the proof', { dash: true }], ['gold', 'the pair $(x,y)$', { dot: true }]]);
            st = { m, nA, d, gap: Math.hypot(Aq[0] - Ap[0], Aq[1] - Ap[1]), crude };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          if (s.m === 'prod') return `$\\|A\\| = ${v.fix(s.nA, 3)}$, $\\;\\|B\\| = ${v.fix(s.nB, 3)}$, $\\;\\|BA\\| = ${v.fix(s.nBA, 3)} \\le \\|B\\|\\,\\|A\\| = ${v.fix(s.nA * s.nB, 3)}$ (ratio $${v.fix(s.nBA / (s.nA * s.nB), 3)}$).`;
          if (s.m === 'sum') return `$\\|A+B\\| = ${v.fix(s.nS, 3)} \\le \\|A\\|+\\|B\\| = ${v.fix(s.nA + s.nB, 3)}$; so $d(A,B)=\\|A-B\\|$ satisfies the triangle inequality.`;
          return `$|Ax-Ay| = ${v.fix(s.gap, 3)} \\le \\|A\\|\\,|x-y| = ${v.fix(s.nA * s.d, 3)}$ $\\;(\\|A\\| = ${v.fix(s.nA, 3)} \\le \\sum_i|Ae_i| = ${v.fix(s.crude, 3)} < \\infty)$: one $\\delta=\\varepsilon/\\|A\\|$ works at every point.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.8
    {
      num: '9.8',
      kind: 'Theorem',
      name: 'Invertible operators form an open set',
      statement: String.raw`Let $\Omega$ be the set of all invertible linear operators on $\R^n$.
(a) If $A\in\Omega$, $B\in L(\R^n)$ and $\|B-A\|\cdot\|A^{-1}\|<1$, then $B\in\Omega$.
(b) $\Omega$ is an open subset of $L(\R^n)$, and the map $A\mapsto A^{-1}$ is continuous on $\Omega$.`,
      idea: String.raw`Put $\alpha=1/\|A^{-1}\|$ and $\beta=\|B-A\|<\alpha$. For every $x$, $\alpha|x|\le|Ax|\le|(A-B)x|+|Bx|\le\beta|x|+|Bx|$, so $|Bx|\ge(\alpha-\beta)|x|$: $B$ is one-to-one, hence invertible by 9.5. This holds on the whole ball $\|B-A\|<\alpha$, so $\Omega$ is open. Applying the same inequality to $x=B^{-1}y$ gives $\|B^{-1}\|\le1/(\alpha-\beta)$, and $B^{-1}-A^{-1}=B^{-1}(A-B)A^{-1}$ with 9.7(c) gives $\|B^{-1}-A^{-1}\|\le\beta/(\alpha(\alpha-\beta))\to0$ as $\beta\to0$.`,
      caption: String.raw`$A$ is fixed (blue ellipse = image of the unit circle; its shortest semi-axis is $\alpha=1/\|A^{-1}\|$). Drag the columns $Be_1$, $Be_2$ of $B$, or push $B$ along the worst direction with the slider. While $\beta=\|B-A\|<\alpha$ the orange ellipse $B$(circle) stays outside the green circle of radius $\alpha-\beta$, so $B$ is invertible. The right panel plots the two bounds from the proof against $\beta$, with the true values as dots; at $\beta=\alpha$ the worst-case $B$ becomes singular, so the radius $\alpha$ cannot be improved.`,
      deps: ['pma-9.7', 'pma-9.5', 'pma-9.6'],
      see: ['fa-10.7', 'fa-10.12'],
      tags: ['operator norm', 'invertibility', 'open sets'],
      viz(v) {
        const A = [[1.3, 0.6], [0.4, 0.75]];
        const SA = svd(A), alpha = SA.s[1], Ai = inv2(A);
        const u2 = SA.u[1], v2 = SA.v[1];
        const worst = [[u2[0] * v2[0], u2[0] * v2[1]], [u2[1] * v2[0], u2[1] * v2[1]]]; // ‖·‖ = 1
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.8, 1.8], equal: true, height: 320, title: 'images of the unit circle' });
        const R = v.stage({ x: [0, 1.45 * alpha], y: [0, 9], height: 320, axes: 'box', title: 'bounds from the proof against $\\beta=\\|B-A\\|$' });
        const E0 = [[0.25, -0.75], [0.7, 0.2]]; const nE0 = opn(E0);
        const B0 = madd(A, E0, 0.55 * alpha / nE0);
        const b1 = L.handle(B0[0][0], B0[1][0], { color: 'orange', r: 6.5 });
        const b2 = L.handle(B0[0][1], B0[1][1], { color: 'orange', r: 6.5 });
        const setB = (Bm) => { b1.set(Bm[0][0], Bm[1][0]); b2.set(Bm[0][1], Bm[1][1]); };
        v.slider('worst direction $B=A-\\beta u_2v_2^{T}$: $\\beta/\\alpha$', 0, 1.3, 0.55, { step: 0.01, onChange: (t) => setB(madd(A, worst, -t * alpha)) });
        v.button('$B = A$', () => setB(A));
        let st = {};
        v.render(() => {
          const B = [[b1.x, b2.x], [b1.y, b2.y]];
          const beta = opn(madd(B, A, -1));
          const SB = svd(B), dB = det(B), sing = Math.abs(dB) < 1e-9 || SB.s[1] < 1e-6;
          // left: ellipses
          L.circle(0, 0, alpha, { color: 'accent', width: 1, dash: [2, 3], alpha: 0.7 });
          if (beta < alpha) L.circle(0, 0, alpha - beta, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.6, dash: [5, 4] });
          L.poly(ell(A), { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.6 });
          L.line(0, 0, A[0][0], A[1][0], { color: 'accent', width: 1.2, alpha: 0.6 }); L.line(0, 0, A[0][1], A[1][1], { color: 'accent', width: 1.2, alpha: 0.6 });
          L.poly(ell(B), { fill: sing ? 'red' : 'orange', fillAlpha: 0.16, color: sing ? 'red' : 'orange', width: 2.2 });
          L.line(0, 0, b1.x, b1.y, { color: 'orange', width: 2 }); L.line(0, 0, b2.x, b2.y, { color: 'orange', width: 2 });
          L.tex('Be_1', b1.x, b1.y, { color: 'orange', size: 13, dx: 10, dy: 14, align: 'left' });
          L.tex('Be_2', b2.x, b2.y, { color: 'orange', size: 13, dx: -10, dy: -12, align: 'right' });
          if (beta < alpha) L.tex('\\alpha-\\beta', 0, -(alpha - beta), { color: 'green', size: 13, dy: 11 });
          L.corner(sing ? 'B is singular' : beta < alpha ? 'β < α: B invertible (guaranteed)' : 'β ≥ α: the theorem is silent', 'tl', { color: sing ? 'red' : beta < alpha ? 'green' : 'muted', weight: 600 });
          // right: bounds
          const Y = 9 * alpha / alpha; R.setView([0, 1.45 * alpha], [0, Math.max(3 / alpha, 6)]);
          R.vband(alpha, 2 * alpha, { color: 'red', alpha: 0.06 });
          R.vline(alpha, { color: 'red', width: 1.4, dash: [5, 4] });
          R.text('β = α = 1/‖A⁻¹‖', alpha, R.bounds.y[1], { color: 'red', dx: 6, dy: 12, align: 'left', weight: 600, size: 11.5 });
          R.fn((b) => 1 / (alpha - b), { domain: [0, alpha * 0.999], color: 'green', width: 2.2 });
          R.fn((b) => b / (alpha * (alpha - b)), { domain: [0, alpha * 0.999], color: 'purple', width: 2.2 });
          let nBi = null, dInv = null;
          if (!sing) {
            const Bi = inv2(B); nBi = opn(Bi); dInv = opn(madd(Bi, Ai, -1));
            R.vline(beta, { color: 'gold', width: 1, dash: [3, 3] });
            R.dot(beta, nBi, { color: 'green', r: 5.5 });
            R.dot(beta, dInv, { color: 'purple', r: 5.5 });
          } else R.vline(beta, { color: 'red', width: 1.6 });
          v.legend([['accent', '$A$(circle)', { area: true }], ['orange', '$B$(circle)', { area: true }], ['green', 'disc $|y|<\\alpha-\\beta$; bound $1/(\\alpha-\\beta)$ on $\\|B^{-1}\\|$'], ['purple', 'bound $\\beta/(\\alpha(\\alpha-\\beta))$ on $\\|B^{-1}-A^{-1}\\|$']]);
          st = { alpha, beta, sB: SB.s[1], nBi, dInv, sing, Y };
        });
        v.readout(() => {
          const s = st; if (s.alpha == null) return '';
          let t = `$\\alpha = 1/\\|A^{-1}\\| = ${v.fix(s.alpha, 3)}$, $\\;\\beta = \\|B-A\\| = ${v.fix(s.beta, 3)}$, $\\;\\beta\\,\\|A^{-1}\\| = ${v.fix(s.beta / s.alpha, 3)}$. `;
          if (s.sing) return t + '$B$ is singular — necessarily $\\beta\\ge\\alpha$.';
          t += `$\\min_{|x|=1}|Bx| = ${v.fix(s.sB, 3)}$`;
          if (s.beta < s.alpha) t += ` $\\ge \\alpha-\\beta = ${v.fix(s.alpha - s.beta, 3)}$; $\\;\\|B^{-1}\\| = ${v.fix(s.nBi, 3)} \\le ${v.fix(1 / (s.alpha - s.beta), 3)}$, $\\;\\|B^{-1}-A^{-1}\\| = ${v.fix(s.dInv, 3)} \\le ${v.fix(s.beta / (s.alpha * (s.alpha - s.beta)), 3)}$.`;
          else t += ' — here $B$ happens to be invertible, but nothing guarantees it.';
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 9.9
    {
      num: '9.9',
      kind: 'Definition',
      name: 'The matrix of a linear map; ‖A‖ ≤ (Σ aᵢⱼ²)^½',
      refs: ['Rudin, Principles of Mathematical Analysis, 3rd ed., Section 9.9, pp. 210–211'],
      statement: String.raw`Let $\{x_1,\dots,x_n\}$ and $\{y_1,\dots,y_m\}$ be bases of $X$ and $Y$. Each $A\in L(X,Y)$ determines numbers $a_{ij}$ by $Ax_j=\sum_{i=1}^m a_{ij}y_i$; the $m\times n$ array $[A]=(a_{ij})$ is the *matrix* of $A$ relative to these bases. The coordinates of $Ax_j$ form the $j$-th column, and if $x=\sum c_jx_j$ then $Ax=\sum_i\big(\sum_j a_{ij}c_j\big)y_i$. Conversely every $m\times n$ matrix defines a linear map, and $[BA]=[B][A]$.

For $A\in L(\R^n,\R^m)$ with the standard bases,
$$\|A\|\le\Big(\sum_{i,j}a_{ij}^2\Big)^{1/2}.$$
Consequently, if the entries $a_{ij}(p)$ are continuous functions on a metric space $S$, then $p\mapsto A_p$ is a continuous map of $S$ into $L(\R^n,\R^m)$.`,
      idea: String.raw`For $|x|\le1$ the Schwarz inequality (1.35) applied row by row gives $|Ax|^2=\sum_i\big(\sum_j a_{ij}c_j\big)^2\le\sum_i\sum_j a_{ij}^2\cdot\sum_j c_j^2\le\sum_{i,j}a_{ij}^2$. Applying this to $A_p-A_q$ shows $\|A_p-A_q\|$ is small when all entries are close. Conversely each $|a_{ij}|=|\langle Ae_j,e_i\rangle|\le\|A\|$, so the operator norm and the entries control each other.`,
      caption: String.raw`A map $A\in L(\R^2,\R^3)$: its matrix has the coordinates of $Ae_1$ and $Ae_2$ as columns (drag the 3D view to rotate). Drag $x$ in the unit disc: $Ax=x_1Ae_1+x_2Ae_2$. The image of the unit circle is a flat ellipse whose longest semi-axis is $\|A\|$. The slider moves the entries continuously along a path $A(t)$; the lower panel shows $\max|a_{ij}|\le\|A\|\le(\sum a_{ij}^2)^{1/2}$ along the whole path, and $\|A(t)\|$ varies continuously.`,
      deps: ['pma-9.4', 'pma-9.6', 'pma-1.35'],
      tags: ['matrices', 'operator norm'],
      viz(v) {
        const M = v.M;
        const P0 = [[1.15, 0.15], [0.25, 0.95], [0.55, -0.45]], Q0 = [[0.25, 1.05], [-0.7, 0.35], [0.95, 0.55]];
        const At = (t) => P0.map((r, i) => r.map((x, j) => (1 - t) * x + t * Q0[i][j] + 0.25 * Math.sin(Math.PI * t) * (i === j ? 1 : 0)));
        const D = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 300, minWidth: 230, weight: 0.8, title: 'domain $\\R^2$' });
        const S = v.stage3d({ range: 1.45, height: 300, yaw: 1.7, pitch: 0.72, axes: false, title: 'target $\\R^3$' });
        const P = v.stage({ x: [0, 1], y: [0, 2], height: 150, full: true, axes: 'box', xlabel: 't', title: 'along the path $A(t)$: $\\max_{i,j}|a_{ij}|$, $\\|A\\|$ and $(\\sum a_{ij}^2)^{1/2}$' });
        const hx = D.handle(0.62, 0.55, { color: 'gold', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1 ? [x / r, y / r] : [x, y]; } });
        const tt = v.slider('$t$', 0, 1, 0.3, { step: 0.005 });
        const ts = M.linspace(0, 1, 121);
        const prof = ts.map((t) => { const A = At(t); return [opn(A), frob(A), Math.max(...A.flat().map(Math.abs))]; });
        v.legend([['blue', '$Ae_1$ (column 1)'], ['orange', '$Ae_2$ (column 2)'], ['gold', '$x$, $Ax$'], ['green', '$\\|A\\|$'], ['purple', '$(\\sum a_{ij}^2)^{1/2}$'], ['muted', '$\\max|a_{ij}|$']]);
        let st = {};
        v.render(() => {
          const A = At(tt.value);
          const x = [hx.x, hx.y], Ax = mv(A, x);
          const c1 = A.map((r) => r[0]), c2 = A.map((r) => r[1]);
          const { s, v: V, u: U } = svd(A);
          // domain
          D.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.5 });
          D.line(-1.25 * V[0][0], -1.25 * V[0][1], 1.25 * V[0][0], 1.25 * V[0][1], { color: 'green', width: 1.2, dash: [5, 4] });
          vecArrow(D, [0, 0], [1, 0], 'blue', 'e_1', { width: 2 }); vecArrow(D, [0, 0], [0, 1], 'orange', 'e_2', { width: 2 });
          D.path([[0, 0], [x[0], 0], x], { color: 'muted', width: 1, dash: [3, 3] });
          D.line(0, 0, x[0], x[1], { color: 'gold', width: 2.4 }); D.tex('x', x[0], x[1], { color: 'gold', dx: 12, dy: -12 });
          // target (3D)
          for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) S.line(e.map((q) => -1.3 * q), e.map((q) => 1.3 * q), { color: 'faint', width: 1 });
          const E = Array.from({ length: 73 }, (_, i) => { const th = TAU * i / 72; return mv(A, [Math.cos(th), Math.sin(th)]); });
          S.poly(E, { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 1.6 });
          S.arrow([0, 0, 0], c1, { color: 'blue', width: 2.8 }); S.tex('Ae_1', M.vscale(c1, 1.18), { color: 'blue', size: 14 });
          S.arrow([0, 0, 0], c2, { color: 'orange', width: 2.8 }); S.tex('Ae_2', M.vscale(c2, 1.18), { color: 'orange', size: 14 });
          S.path([[0, 0, 0], M.vscale(c1, x[0]), Ax], { color: 'muted', width: 1.2, dash: [3, 3] });
          S.arrow([0, 0, 0], Ax, { color: 'gold', width: 2.6 }); S.tex('Ax', M.vscale(Ax, 1.15), { color: 'gold', size: 14 });
          if (U[0]) { const a = M.vscale(U[0], s[0]); S.line(M.vscale(a, -1), a, { color: 'green', width: 2.2 }); S.tex('\\|A\\|', M.vscale(a, 1.12), { color: 'green', size: 13 }); }
          // profile
          const top = Math.max(...prof.map((p) => p[1])) * 1.08, bot = Math.min(...prof.map((p) => p[2])) * 0.85; P.setView([0, 1], [bot, top]);
          P.path(ts.map((t, i) => [t, prof[i][1]]), { color: 'purple', width: 2 });
          P.path(ts.map((t, i) => [t, prof[i][0]]), { color: 'green', width: 2.4 });
          P.path(ts.map((t, i) => [t, prof[i][2]]), { color: 'muted', width: 1.6, dash: [5, 4] });
          P.vline(tt.value, { color: 'gold', width: 1, dash: [3, 3] });
          P.dot(tt.value, s[0], { color: 'green', r: 4.5 }); P.dot(tt.value, frob(A), { color: 'purple', r: 4.5 });
          st = { A, s, Ax };
        });
        v.readout(() => {
          const { A, s } = st; if (!A) return '';
          return `$[A] = ${pm(A)}$, $\\;\\max|a_{ij}| = ${v.fix(Math.max(...A.flat().map(Math.abs)), 3)} \\le \\|A\\| = ${v.fix(s[0], 3)} \\le \\big(\\sum a_{ij}^2\\big)^{1/2} = ${v.fix(frob(A), 3)} = \\sqrt{\\sigma_1^2+\\sigma_2^2}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.11
    {
      num: '9.11',
      kind: 'Definition',
      name: 'Differentiable map; the derivative f′(x)',
      statement: String.raw`Let $E\subset\R^n$ be open, $f$ a map of $E$ into $\R^m$, and $x\in E$. If there is a linear transformation $A\in L(\R^n,\R^m)$ such that
$$\lim_{h\to0}\frac{|f(x+h)-f(x)-Ah|}{|h|}=0,$$
then $f$ is *differentiable at* $x$ and we write $f'(x)=A$. If $f$ is differentiable at every point of $E$, then $f$ is *differentiable in* $E$, and $f'$ is a map of $E$ into $L(\R^n,\R^m)$.`,
      idea: String.raw`For $n=m=1$ this is the familiar derivative, read as "the linear map $h\mapsto f'(x)h$". In general, $f(x+h)=f(x)+f'(x)h+r(h)$ with a remainder that is small *compared with* $|h|$; so near $x$ the map $f$ looks, after rescaling by $1/|h|$, exactly like the linear map $f'(x)$. Differentiability implies continuity at $x$, and the derivative is unique (9.12).`,
      caption: String.raw`A nonlinear map $f:\R^2\to\R^2$. Drag $p$; the gold square $p+[-r,r]^2$ has a curved image (middle). The right panel rescales by $1/r$: the gold grid is $\frac1r\big(f(p+h)-f(p)\big)$ and the dashed blue grid is $\frac1r f'(p)h$. Shrink $r$ and the curved grid straightens onto the linear one; the lower panel plots the worst relative error $\max|f(p+h)-f(p)-f'(p)h|/|h|$ on the square, which tends to $0$.`,
      deps: ['pma-9.6', 'pma-5.1', 'pma-4.1'],
      see: ['pma-5.16', 'rca-10.2'],
      tags: ['derivative', 'linear approximation'],
      viz(v) {
        const M = v.M;
        const f = ([x, y]) => [x - 0.3 * y * y + 0.25 * x * y, y + 0.45 * Math.sin(1.6 * x)];
        const df = ([x, y]) => [[1 + 0.25 * y, -0.6 * y + 0.25 * x], [0.72 * Math.cos(1.6 * x), 1]];
        const D = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, height: 250, minWidth: 250, title: 'domain' });
        const T = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, height: 250, minWidth: 250, title: 'image under $f$' });
        const Z = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 250, minWidth: 250, title: 'zoom: divide by $r$' });
        const P = v.stage({ x: [-2.5, 0.25], y: [0, 1], height: 150, full: true, axes: 'box', xticks: [[-2, '0.01'], [-1, '0.1'], [0, '1']], xlabel: 'r', title: 'relative error $\\max_{h}|f(p+h)-f(p)-f\'(p)h|/|h|$ on the square, against $r$ (log scale)' });
        const hp = D.handle(0.7, 0.55, { color: 'accent', label: 'p' });
        const rS = v.slider('$r$', 0.004, 1.2, 0.7, { log: true, decimals: 3 });
        const N = 6;
        const err = (p, r) => {
          const A = df(p), fp = f(p); let mx = 0;
          for (let k = 0; k < 64; k++) { const t = TAU * k / 64; const c = Math.cos(t), s = Math.sin(t); const m = Math.max(Math.abs(c), Math.abs(s)); const h = [r * c / m, r * s / m]; const q = f([p[0] + h[0], p[1] + h[1]]), L = mv(A, h); mx = Math.max(mx, Math.hypot(q[0] - fp[0] - L[0], q[1] - fp[1] - L[1]) / Math.hypot(...h)); }
          return mx;
        };
        v.legend([['gold', 'square $p+[-r,r]^2$ and its image under $f$', { area: true }], ['accent', 'image under the linear map $f\'(p)$', { dash: true }], ['purple', 'relative error']]);
        let st = {};
        v.render(() => {
          const p = [hp.x, hp.y], r = rS.value, A = df(p), fp = f(p);
          // domain grid + square
          for (let k = -8; k <= 8; k++) { D.line(k / 4, -3, k / 4, 3, { color: 'grid', width: 1 }); D.line(-3, k / 4, 3, k / 4, { color: 'grid', width: 1 }); }
          D.rect(p[0] - r, p[1] - r, p[0] + r, p[1] + r, { fill: 'gold', fillAlpha: 0.25, color: 'gold', width: 1.6 });
          // global image
          for (let k = -6; k <= 6; k++) {
            T.curve((s) => f([k / 4, s]), -1.5, 1.5, { color: 'muted', width: 1, alpha: 0.3, n: 60 });
            T.curve((s) => f([s, k / 4]), -1.5, 1.5, { color: 'muted', width: 1, alpha: 0.3, n: 60 });
          }
          const sq = []; for (let i = 0; i <= 40; i++) sq.push([-1 + 2 * i / 40, -1]); for (let i = 0; i <= 40; i++) sq.push([1, -1 + 2 * i / 40]); for (let i = 0; i <= 40; i++) sq.push([1 - 2 * i / 40, 1]); for (let i = 0; i <= 40; i++) sq.push([-1, 1 - 2 * i / 40]);
          T.poly(sq.map(([a, b]) => f([p[0] + r * a, p[1] + r * b])), { fill: 'gold', fillAlpha: 0.25, color: 'gold', width: 1.6 });
          T.dot(fp[0], fp[1], { color: 'accent', r: 4, label: 'f(p)', labelPos: 'ne' });
          // zoom panel
          const nA = opn(A); fitEqual(Z, 0, 0, Math.max(1.2, nA * 1.45));
          for (let k = -N; k <= N; k++) {
            const u = k / N;
            Z.curve((s) => mv(A, [u, s]), -1, 1, { color: 'accent', width: 1.4, dash: [5, 4], n: 2 });
            Z.curve((s) => mv(A, [s, u]), -1, 1, { color: 'accent', width: 1.4, dash: [5, 4], n: 2 });
            Z.curve((s) => { const q = f([p[0] + r * u, p[1] + r * s]); return [(q[0] - fp[0]) / r, (q[1] - fp[1]) / r]; }, -1, 1, { color: 'gold', width: 1.6, n: 40 });
            Z.curve((s) => { const q = f([p[0] + r * s, p[1] + r * u]); return [(q[0] - fp[0]) / r, (q[1] - fp[1]) / r]; }, -1, 1, { color: 'gold', width: 1.6, n: 40 });
          }
          // error profile
          const ls = M.linspace(-2.5, 0.25, 70), es = ls.map((l) => err(p, 10 ** l));
          P.setView(null, [0, Math.max(0.05, Math.max(...es) * 1.15)]);
          P.path(ls.map((l, i) => [l, es[i]]), { color: 'purple', width: 2.4 });
          const e = err(p, r);
          P.vline(Math.log10(r), { color: 'gold', width: 1, dash: [3, 3] });
          P.dot(Math.log10(r), e, { color: 'gold', r: 5 });
          st = { A, e, r };
        });
        v.readout(() => {
          const { A, e, r } = st; if (!A) return '';
          return `$f'(p) = ${pm(A, 3)}$. At $r = ${v.fmt(r, 3)}$ the worst relative error on the square is $${v.fmt(e, 3)}$ — it shrinks in proportion to $r$, so the limit in the definition is $0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.12
    {
      num: '9.12',
      kind: 'Theorem',
      name: 'The derivative is unique',
      statement: String.raw`Let $E$, $f$ and $x$ be as in Definition 9.11. If the limit condition there holds both with $A=A_1$ and with $A=A_2$, then $A_1=A_2$.`,
      idea: String.raw`Put $B=A_1-A_2$. By the triangle inequality $|Bh|\le|f(x+h)-f(x)-A_1h|+|f(x+h)-f(x)-A_2h|$, so $|Bh|/|h|\to0$ as $h\to0$. But for fixed $h\neq0$ the ratio $|B(th)|/|th|$ does not depend on $t$; letting $t\to0$ forces $Bh=0$. Hence $B=0$. In short: a linear error is *scale invariant* along every ray, so it can only be $o(|h|)$ if it is zero.`,
      caption: String.raw`Here $f:\R^2\to\R$, so a candidate derivative is a row vector $a=(a_1,a_2)$; drag it in the right panel. The heat map shows the relative error $|f(p+h)-f(p)-a\cdot h|/|h|$ for $h$ in a square of half-width $r$. Only at $a=f'(p)$ (green; the handle snaps there) does the error fade to $0$ as $r$ shrinks; for any other $a$ the same pattern survives at every scale, because along the ray through $u$ it tends to $|(f'(p)-a)u|$ (dashed curve below).`,
      deps: ['pma-9.11'],
      tags: ['derivative', 'uniqueness'],
      viz(v) {
        const M = v.M;
        const f = (x, y) => Math.sin(1.3 * x) * Math.cos(y) + 0.35 * y * y + 0.3 * x;
        const p = [0.45, 0.6];
        const g = [1.3 * Math.cos(1.3 * p[0]) * Math.cos(p[1]) + 0.3, -Math.sin(1.3 * p[0]) * Math.sin(p[1]) + 0.7 * p[1]];
        const fp = f(...p);
        const H = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 290, title: 'relative error over $h\\in[-r,r]^2$' });
        const C = v.stage({ x: [-0.6, 2.6], y: [-1, 1.9], equal: true, height: 290, title: 'candidates $a=(a_1,a_2)$' });
        const B = v.stage({ x: [0, TAU], y: [0, 1.5], height: 150, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [TAU, '2π']], title: 'error at $h=ru_\\theta$ against the direction $\\theta$, and its limit $|(f\'(p)-a)u_\\theta|$' });
        const ha = C.handle(1.55, 0.95, { color: 'accent', label: 'a', constrain: (x, y) => (Math.hypot(x - g[0], y - g[1]) < 0.09 ? [g[0], g[1]] : [x, y]) });
        const rS = v.slider('$r$', 0.005, 1.2, 0.5, { log: true, decimals: 3 });
        const ratio = (a, h) => Math.abs(f(p[0] + h[0], p[1] + h[1]) - fp - a[0] * h[0] - a[1] * h[1]) / Math.hypot(...h);
        let st = {};
        v.render(() => {
          const a = [ha.x, ha.y], r = rS.value, exact = a[0] === g[0] && a[1] === g[1];
          H.setView([-r, r], [-r, r]);
          H.heat((x, y) => (x * x + y * y < 1e-18 ? NaN : ratio(a, [x, y])), { range: [0, 1.2], cmap: 'magma', res: 3, key: `${a}|${r}` });
          H.axes();
          H.setTitle(`relative error over $h\\in[-r,r]^2$, $\\;r = ${v.fmt(r, 3)}$`);
          // candidates
          for (let k = -2; k <= 6; k++) { C.line(k / 2, -2, k / 2, 3, { color: 'grid', width: 1 }); C.line(-2, k / 2, 4, k / 2, { color: 'grid', width: 1 }); }
          C.line(g[0], g[1], a[0], a[1], { color: 'red', width: 1.4, dash: [4, 4] });
          C.dot(g[0], g[1], { color: 'green', r: 6, label: "f'(p)", labelPos: 'sw' });
          // ray profile
          const th = M.linspace(0, TAU, 181);
          const prof = th.map((t) => ratio(a, [r * Math.cos(t), r * Math.sin(t)]));
          const lim = th.map((t) => Math.abs((g[0] - a[0]) * Math.cos(t) + (g[1] - a[1]) * Math.sin(t)));
          B.setView(null, [0, Math.max(0.25, ...prof, ...lim) * 1.12]);
          B.path(th.map((t, i) => [t, lim[i]]), { color: 'red', width: 1.6, dash: [6, 4] });
          B.path(th.map((t, i) => [t, prof[i]]), { color: 'purple', width: 2.4 });
          v.legend([['purple', 'error $|f(p+ru)-f(p)-a\\cdot ru|/r$'], ['red', 'its limit as $r\\to0$', { dash: true }], ['green', "the derivative $f'(p)$", { dot: true }]]);
          st = { a, r, mx: Math.max(...prof), lim: Math.hypot(g[0] - a[0], g[1] - a[1]), exact };
        });
        v.readout(() => {
          const s = st; if (!s.a) return '';
          const head = `$f'(p) = (${v.fix(g[0], 3)},\\ ${v.fix(g[1], 3)})$, $\\;a = (${v.fix(s.a[0], 3)},\\ ${v.fix(s.a[1], 3)})$. On the circle $|h| = ${v.fmt(s.r, 3)}$ the largest error is $${v.fmt(s.mx, 3)}$; `;
          return head + (s.lim < 1e-9 ? 'with the true derivative it tends to $0$ as $r\\to0$.' : `as $r\\to0$ it tends to $\\max_u|(f'(p)-a)u| = |f'(p)-a| = ${v.fix(s.lim, 3)} > 0$, so this $a$ fails the definition.`);
        });
      },
    },
  ],
};
