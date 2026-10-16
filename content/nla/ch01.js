// Numerical Linear Algebra — Chapter 1: Matrices, norms and the SVD
// Part 1 (this file): 1.1–1.5 — matrices as maps, orthogonal matrices, vector and matrix norms.
// The rest of the chapter is in ch01-b.js (1.7–1.11); 1.6 (SVD) and 1.12 (Strassen) are cross-listed from other collections.
import {
  nm, nmc, matT, vecT, dot, add, sub, scl, len, unit, mv, mm, tp, eye, fro, msub, maxAbs, rot, norm1, normInf, svd22, ellPts, spherePts, pnorm,
  colHandles, drawTile, arcPts, angDeg, TAU,
} from './ch01.shared.js';

export default {
  collection: 'nla',
  chapter: 1,
  title: 'Matrices, norms and the SVD',
  summary: String.raw`Numerical linear algebra starts by viewing a matrix as a map and asking how much it can stretch a vector. Norms measure that stretching, unitary matrices preserve it, and the singular value decomposition says every matrix maps the unit sphere to a hyperellipsoid whose semi-axes are the singular values. The SVD reveals rank, range and norms at a glance, and truncating it gives the best low-rank approximation — the idea behind compression and principal components.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Matrix–vector products as combinations of columns',
      statement: String.raw`Let $A$ be an $m\times n$ matrix with columns $a_1,\dots,a_n\in\mathbb R^m$ and let $x\in\mathbb R^n$. The product $b = Ax$ is the vector with entries $b_i=\sum_j a_{ij}x_j$, and it is the linear combination of the columns of $A$ whose coefficients are the entries of $x$:
$$Ax = x_1a_1 + x_2a_2+\cdots+x_na_n .$$
Hence the set of all products, the range of $A$, is the span of the columns; $Ax$ always lies in it, and it is a proper subspace exactly when the columns are linearly dependent (rank $<m$).`,
      idea: String.raw`Both descriptions are the same sum written two ways: reading the formula $b_i=\sum_j a_{ij}x_j$ one row at a time gives $m$ inner products, reading it one column at a time gives $n$ scaled copies of the columns added up. The second reading is the one numerical linear algebra lives on: it says "$Ax = b$" asks for the coordinates of $b$ in the (possibly dependent) system of columns, and it explains why the range, rank and conditioning are properties of the column geometry (the pictures of the whole chapter).`,
      caption: String.raw`Drag the three column handles $a_1,a_2,a_3$ (and rotate the scene by dragging the background); set the coefficients $x_j$ with the sliders. The coloured arrows laid tip to tail are $x_1a_1$, $x_2a_2$, $x_3a_3$, and the gold arrow, from the origin to the end of the chain, is $Ax$. Switch to rank 2, where $a_3$ is forced to be a combination of $a_1,a_2$: the range collapses to a plane (green) and $Ax$ stays in it however you choose $x$.`,
      deps: ['pma-9.9'],
      tags: ['matrices', 'range'],
      refs: ['Trefethen–Bau Lec. 1'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.4, 3.4], y: [-2.7, 2.7], equal: true, axes: false, height: 440, full: true });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 2.6, lim: 1.5 });
        const CC = ['blue', 'purple', 'teal'], SUB = '₁₂₃';
        const C0 = [[1, 0.15, 0.1], [-0.25, 1, 0.3], [0.2, -0.35, 1]];
        const comb = () => add(scl(H[0].p, 0.6), scl(H[1].p, -0.5));
        const keep = () => { if (mode.value === 'r2') H[2].set(comb()); };
        const mode = v.select('', [{ value: 'full', label: 'three independent columns' }, { value: 'r2', label: 'rank 2: $a_3 = 0.6a_1 - 0.5a_2$' }], 'full', {
          onChange: (k) => { H[2].visible = k === 'full'; if (k === 'full') H[2].set(C0[2]); else keep(); },
        });
        const H = C0.map((c, k) => sc.handle(c, { color: CC[k], label: `a${SUB[k]}`, onDrag: keep }));
        const X = [1, 2, 3].map((k, i) => v.slider(`$x_${k}$`, -1.5, 1.5, [1, 0.8, -0.6][i], { step: 0.05 }));
        let st = null;
        v.render(() => {
          const cols = H.map((h) => h.p), A = [0, 1, 2].map((i) => cols.map((c) => c[i]));
          const x = X.map((s) => s.value), Ax = mv(A, x);
          const pts = [[0, 0, 0]];
          cols.forEach((c, k) => pts.push(add(pts[k], scl(c, x[k]))));
          const rank = M.rank(A, 1e-6);
          sc.begin();
          if (rank === 2) {
            const { U } = M.svd(A);
            sc.disc(U.map((r) => r[0]), U.map((r) => r[1]), 2.3, { fill: 'green', color: 'green', fillAlpha: 0.1, grid: true });
          }
          cols.forEach((c, k) => sc.arrow([0, 0, 0], c, { color: CC[k], width: 1.6, alpha: 0.4 }));
          cols.forEach((c, k) => {
            if (Math.hypot(...scl(c, x[k])) > 1e-3) sc.arrow(pts[k], pts[k + 1], { color: CC[k], width: 3.4 });
            const mid = add(pts[k], scl(c, x[k] / 2));
            sc.tex(`x_${k + 1}a_${k + 1}`, add(mid, [0.08, 0.08, 0.08]), { color: CC[k], size: 13 });
          });
          sc.line([0, 0, 0], Ax, { color: 'gold', width: 0.8, dash: true });
          sc.arrow([0, 0, 0], Ax, { color: 'gold', width: 4 });
          sc.dot(Ax, { color: 'gold', r: 5 });
          sc.tex('Ax', Ax, { color: 'gold', size: 15, dx: 14, dy: -12 });
          sc.flush();
          S.corner(rank === 3 ? 'rank 3: the range is all of ℝ³' : rank === 2 ? 'rank 2: the range is a plane' : `rank ${rank}`, 'tl', { color: rank === 3 ? 'muted' : 'green', weight: 700 });
          let dist = 0;
          if (rank === 2) { const n = unit([cols[0][1] * cols[1][2] - cols[0][2] * cols[1][1], cols[0][2] * cols[1][0] - cols[0][0] * cols[1][2], cols[0][0] * cols[1][1] - cols[0][1] * cols[1][0]]); dist = Math.abs(dot(n, Ax)); }
          const viaRows = A.map((r) => dot(r, x));
          st = { A, x, Ax, rank, dist, diff: Math.max(...Ax.map((t, i) => Math.abs(t - viaRows[i]))) };
        });
        v.legend([['blue', '$x_1a_1$'], ['purple', '$x_2a_2$'], ['teal', '$x_3a_3$'], ['gold', '$Ax$'], ['green', 'range (rank 2)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { A, x, Ax, rank, dist, diff } = st;
          return `$A = ${matT(A)}$, $x = ${vecT(x)}$ gives $Ax = x_1a_1+x_2a_2+x_3a_3 = ${vecT(Ax)}$.\nBuilt row by row, $b_i = \\sum_j a_{ij}x_j$, the same vector (difference $${diff < 1e-15 ? '0' : v.sci(diff, 1)}$). $\\operatorname{rank}A = ${rank}$${rank === 2 ? `; distance from $Ax$ to the range plane: $${dist < 1e-12 ? '0' : v.sci(dist, 1)}$` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Orthogonal and unitary matrices',
      statement: String.raw`A real square matrix $Q$ is **orthogonal** if $Q^{\top}Q=I$, that is, if its columns $q_1,\dots,q_n$ are orthonormal ($q_i^{\top}q_j=\delta_{ij}$); a complex square matrix $Q$ is **unitary** if $Q^*Q=I$, with $Q^*$ the conjugate transpose. Then $Q^{-1}=Q^*$, $QQ^*=I$ as well, and $Q$ preserves inner products, lengths and angles: $(Qx)^*(Qy)=x^*y$, $\|Qx\|_2=\|x\|_2$. In the plane the orthogonal matrices are the rotations and the reflections.`,
      idea: String.raw`Entry $(i,j)$ of $Q^{\top}Q$ is the inner product $q_i^{\top}q_j$, so $Q^{\top}Q=I$ says literally that the columns are orthonormal. A square matrix with a left inverse is invertible, so the left inverse $Q^{\top}$ is also a right inverse. Preserving inner products follows from $(Qx)^{\top}(Qy)=x^{\top}Q^{\top}Qy=x^{\top}y$; lengths and angles are built from inner products. Numerically this is why orthogonal transformations are the safe tools: they cannot amplify errors.`,
      caption: String.raw`Drag the columns $q_1,q_2$ of $Q$ in the middle panel (they snap to unit length and to right angles when close), or pick a preset. Drag the vectors $u$ and $w$ in the left panel: the middle panel shows $Qu$, $Qw$. The right panel shows the Gram matrix $Q^{\top}Q$ and its defect $Q^{\top}Q-I$. The lengths and the angle agree before and after exactly when the defect is $0$; for any other matrix the unit circle becomes a genuine ellipse.`,
      deps: ['ladr-6.27', 'ladr-7.54'],
      tags: ['orthogonality', 'matrices'],
      refs: ['Trefethen–Bau Lec. 2'],
      viz(v) {
        const D = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 340, minWidth: 260, title: 'domain: vectors $u,w$' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 340, minWidth: 260, title: 'range: columns of $Q$, images $Qu,Qw$' });
        const T = v.stage({ x: [0, 2.2], y: [0, 1.5], equal: true, axes: false, height: 340, minWidth: 240, title: 'the Gram matrix' });
        const th = 0.6, c = Math.cos(th), s = Math.sin(th);
        const PRE = { rot: [[c, -s], [s, c]], refl: [[c, s], [s, -c]], scale: [[1.3, -s], [0.5, c]], shear: [[1, 0.5], [0, 1]], perm: [[0, 1], [1, 0]] };
        v.select('', [{ value: 'rot', label: 'rotation' }, { value: 'refl', label: 'reflection' }, { value: 'perm', label: 'swap' }, { value: 'scale', label: 'skewed, long $q_1$' }, { value: 'shear', label: 'shear' }], 'scale', { onChange: (k) => H.set(PRE[k]) });
        const g = 0.05, rnd = (t) => Math.round(t / g) * g;
        const k1 = (x, y) => { let p = [rnd(x), rnd(y)]; const L = len(p); if (Math.abs(L - 1) < 0.07) p = scl(p, 1 / L); return p; };
        const k2 = (x, y) => {
          let p = [rnd(x), rnd(y)]; const a = [H.h1.x, H.h1.y], La = len(a);
          if (La > 0.2 && len(p) > 0.2 && Math.abs(dot(p, a)) / (La * len(p)) < 0.07) p = sub(p, scl(a, dot(p, a) / (La * La)));
          const L = len(p); if (Math.abs(L - 1) < 0.07) p = scl(p, 1 / L);
          return p;
        };
        const H = colHandles(R, PRE.scale, { l1: 'q₁', l2: 'q₂', k1, k2 });
        const uh = D.handle(1.3, 0.5, { color: 'gold', label: 'u' }), wh = D.handle(-0.7, 1.4, { color: 'orange', label: 'w' });
        let st = null;
        v.render(() => {
          const Q = H.A, G = mm(tp(Q), Q), Dm = msub(G, eye(2)), dev = maxAbs(Dm), ok = dev < 6e-3;
          const u = [uh.x, uh.y], w = [wh.x, wh.y], Qu = mv(Q, u), Qw = mv(Q, w);
          D.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          D.arrow(0, 0, 1, 0, { color: 'teal', width: 2 }); D.arrow(0, 0, 0, 1, { color: 'pink', width: 2 });
          D.arrow(0, 0, u[0], u[1], { color: 'gold', width: 2.6 }); D.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.6 });
          D.path(arcPts(u, w, 0.45), { color: 'ink', width: 1.6 });
          R.path(ellPts(Q), { fill: ok ? 'green' : 'accent', fillAlpha: 0.1, color: ok ? 'green' : 'accent', width: 1.8 });
          R.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          R.arrow(0, 0, H.h1.x, H.h1.y, { color: 'teal', width: 2.4 }); R.arrow(0, 0, H.h2.x, H.h2.y, { color: 'pink', width: 2.4 });
          R.arrow(0, 0, Qu[0], Qu[1], { color: 'gold', width: 2.6 }); R.arrow(0, 0, Qw[0], Qw[1], { color: 'orange', width: 2.6 });
          if (len(Qu) > 0.05 && len(Qw) > 0.05) R.path(arcPts(Qu, Qw, 0.45), { color: 'ink', width: 1.6 });
          R.tex('Qu', Qu[0], Qu[1], { color: 'gold', size: 14, dx: 12, dy: -12 }); R.tex('Qw', Qw[0], Qw[1], { color: 'orange', size: 14, dx: 12, dy: -12 });
          T.text('Q^T Q', 0.55, 1.42, { math: true, align: 'center', size: 14, color: 'muted' });
          T.text('Q^T Q − I', 1.65, 1.42, { math: true, align: 'center', size: 14, color: 'muted' });
          drawTile(T, G, 0.05, 0.3, 1.0, 1.0, { frame: ok ? 'green' : 'red' });
          drawTile(T, Dm, 1.15, 0.3, 1.0, 1.0, { frame: ok ? 'green' : 'red' });
          T.text(ok ? 'columns orthonormal' : 'columns not orthonormal', 1.1, 0.12, { align: 'center', size: 13, color: ok ? 'green' : 'red', weight: 700 });
          st = { Q, ok, dev, u, w, Qu, Qw, det: Q[0][0] * Q[1][1] - Q[0][1] * Q[1][0] };
        });
        v.legend([['gold', '$u\\mapsto Qu$'], ['orange', '$w\\mapsto Qw$'], ['muted', 'unit circle', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ok, dev, u, w, Qu, Qw, det } = st;
          return `$\\|u\\| = ${nm(len(u), 3)}$, $\\|Qu\\| = ${nm(len(Qu), 3)}$; $\\|w\\| = ${nm(len(w), 3)}$, $\\|Qw\\| = ${nm(len(Qw), 3)}$; angle$(u,w) = ${nm(angDeg(u, w), 1)}^\\circ$, angle$(Qu,Qw) = ${nm(angDeg(Qu, Qw), 1)}^\\circ$.\n$\\max|Q^{\\top}Q-I|_{ij} = ${nm(dev, 3)}$, $\\det Q = ${nm(det, 3)}$ — ${ok ? `**orthogonal** (${det > 0 ? 'a rotation' : 'a reflection'})` : '**not orthogonal**: lengths and angles are not preserved'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Vector norms',
      statement: String.raw`A **norm** on $\mathbb R^n$ (or $\mathbb C^n$) is a function $\|\cdot\|$ with $\|x\|\ge 0$ and $\|x\|=0\iff x=0$; $\|\alpha x\|=|\alpha|\,\|x\|$; and the triangle inequality $\|x+y\|\le\|x\|+\|y\|$. The $p$-norms $\|x\|_p=(\sum|x_i|^p)^{1/p}$, $1\le p<\infty$, and $\|x\|_\infty=\max_i|x_i|$ are norms; $\|x\|_1\ge\|x\|_2\ge\|x\|_\infty$ and all norms on $\mathbb R^n$ are equivalent, for instance $\|x\|_\infty\le\|x\|_2\le\|x\|_1\le\sqrt n\,\|x\|_2\le n\,\|x\|_\infty$. For $0<p<1$ the same formula is not a norm: its unit ball is not convex and the triangle inequality fails.`,
      idea: String.raw`The unit ball $\{x:\|x\|\le1\}$ of a norm is convex, symmetric about $0$ and bounded, and conversely every such set is the unit ball of a norm; the triangle inequality is exactly convexity. For $p\ge1$ Minkowski's inequality gives the triangle inequality for $\|\cdot\|_p$. Equivalence of norms follows by comparing balls: each ball is squeezed between two scaled copies of another. For $0<p<1$ the ball $|x|^p+|y|^p\le1$ has inward-bending sides, and $e_1,e_2$ break the triangle inequality: $\|e_1+e_2\|_p=2^{1/p}>2$.`,
      caption: String.raw`Drag the vector $x$ in the left panel and move the slider for $p$ (down to $p<1$ to leave the world of norms). The shaded set is the unit ball of $\|\cdot\|_p$; the dashed curves are the $1$-, $2$- and $\infty$-balls. The dashed ball through $x$ has radius $\|x\|_p$. On the right, $p\mapsto\|x\|_p$ falls from $\|x\|_1$ to $\|x\|_\infty$ as $p$ grows from $1$.`,
      deps: ['ladr-6.7'],
      tags: ['norms'],
      credit: 'Minkowski, 1896 (the inequality); Hölder, 1889',
      refs: ['Trefethen–Bau Lec. 3'],
      viz(v) {
        const B = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 360, minWidth: 280, title: 'unit balls in $\\mathbb R^2$' });
        const F = v.stage({ x: [0.25, 60], y: [0, 3], xlog: true, axes: 'box', gutter: true, height: 360, minWidth: 280, xlabel: 'p', ylabel: '‖x‖ₚ', title: '$p\\mapsto\\|x\\|_p$' });
        const P = v.slider('$p$', 0.3, 30, 2, { log: true, sig: 2 });
        const xh = B.handle(1.3, 0.7, { color: 'gold', label: 'x' });
        v.render(() => {
          const p = P.value, x = [xh.x, xh.y], np = pnorm(x, p), n1 = pnorm(x, 1), n2 = pnorm(x, 2), ni = pnorm(x, Infinity);
          const isNorm = p >= 1;
          B.path(spherePts(1), { color: 'muted', dash: [4, 4], width: 1.1, alpha: 0.8 });
          B.path(spherePts(2), { color: 'muted', dash: [4, 4], width: 1.1, alpha: 0.8 });
          B.path(spherePts(Infinity), { color: 'muted', dash: [4, 4], width: 1.1, alpha: 0.8 });
          B.path(spherePts(p), { fill: isNorm ? 'accent' : 'red', fillAlpha: 0.14, color: isNorm ? 'accent' : 'red', width: 2.4 });
          if (np > 1e-6) B.path(spherePts(p).map((q) => scl(q, np)), { color: 'gold', width: 1.2, dash: [3, 3] });
          B.arrow(0, 0, x[0], x[1], { color: 'gold', width: 2.6 });
          if (!isNorm) { B.arrow(0, 0, 1, 0, { color: 'red', width: 1.8 }); B.arrow(1, 0, 1, 1, { color: 'red', width: 1.8 }); B.dot(1, 1, { color: 'red', r: 4 }); }
          B.corner(isNorm ? `‖·‖${p === Infinity ? '∞' : 'ₚ'} is a norm: the ball is convex` : 'p < 1: not convex, not a norm', 'tl', { color: isNorm ? 'muted' : 'red', weight: 700 });
          // right panel
          F.fn((q) => pnorm(x, q), { color: 'accent', width: 2.4, domain: [0.25, 60], n: 240 });
          F.hline(ni, { color: 'green', dash: [5, 4], width: 1.4 });
          F.tex('\\|x\\|_\\infty', 35, ni, { color: 'green', size: 13, dy: -12 });
          F.dot(1, n1, { color: 'blue', r: 4.5, label: '‖x‖₁', labelPos: 'ne' });
          F.dot(2, n2, { color: 'purple', r: 4.5, label: '‖x‖₂', labelPos: 'ne' });
          F.dot(p, np, { color: 'gold', r: 6 });
          F.vline(p, { color: 'gold', dash: [3, 3], width: 1 });
        });
        v.readout(() => {
          const p = P.value, x = [xh.x, xh.y], n1 = pnorm(x, 1), n2 = pnorm(x, 2), ni = pnorm(x, Infinity), np = pnorm(x, p);
          const chain = `$\\|x\\|_\\infty = ${nm(ni, 3)} \\le \\|x\\|_2 = ${nm(n2, 3)} \\le \\|x\\|_1 = ${nm(n1, 3)}$; $\\|x\\|_1/\\|x\\|_2 = ${nm(n1 / n2, 3)} \\le \\sqrt2$, $\\|x\\|_2/\\|x\\|_\\infty = ${nm(n2 / ni, 3)} \\le \\sqrt2$.`;
          const here = p >= 1 ? `$\\|x\\|_{${nm(p, 2)}} = ${nm(np, 3)}$.` : `$\\|e_1+e_2\\|_{${nm(p, 2)}} = 2^{1/p} = ${nm(2 ** (1 / p), 3)} > 2 = \\|e_1\\|_p+\\|e_2\\|_p$: the triangle inequality fails.`;
          return `${chain}\n${here}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Induced matrix norms',
      statement: String.raw`Given vector norms on $\mathbb R^n$ and $\mathbb R^m$, the **induced (operator) norm** of an $m\times n$ matrix $A$ is
$$\|A\|=\sup_{x\ne0}\frac{\|Ax\|}{\|x\|}=\max_{\|x\|=1}\|Ax\| ,$$
the smallest $C$ with $\|Ax\|\le C\|x\|$ for all $x$: it is the radius of the smallest ball (in the target norm) containing the image of the unit ball. It is a norm on matrices and satisfies $\|AB\|\le\|A\|\|B\|$. For the usual norms: $\|A\|_1$ is the largest absolute column sum, $\|A\|_\infty$ the largest absolute row sum, and $\|A\|_2=\sigma_1(A)$, the largest singular value.`,
      idea: String.raw`Homogeneity lets us restrict to the unit sphere, where the continuous function $x\mapsto\|Ax\|$ attains its maximum (compactness). For $p=1$ the ball is the convex hull of $\pm e_j$, so the maximum of the convex function $\|Ax\|_1$ sits at a vertex, i.e. at $\|Ae_j\|_1$ = a column sum; for $p=\infty$ the maximum of $\max_i|a_i^{\top}x|$ is $\max_i\|a_i\|_1$, a row sum. For $p=2$ the maximum of $\|Ax\|^2=x^{\top}A^{\top}Ax$ over the unit sphere is the top eigenvalue of $A^{\top}A$, i.e. $\sigma_1^2$.`,
      caption: String.raw`Choose the vector norm; drag the columns $a_1=Ae_1$, $a_2=Ae_2$ of $A$ in the right panel, and the gold point $x$ round the unit sphere in the left panel. The right panel shows the image of the unit sphere, $Ax$, and the dashed sphere of radius $\|A\|$: it touches the image exactly at the maximizer $Ax_*$ found by a brute-force search over $721$ boundary points. The closed formulas (column sum, row sum, $\sigma_1$) must reproduce that number.`,
      deps: ['nla-1.3', 'ladr-7.86', 'pma-9.6'],
      tags: ['norms', 'operators'],
      refs: ['Trefethen–Bau Lec. 3'],
      viz(v) {
        const NS = [{ value: 1, label: '$\\ell^1$' }, { value: 2, label: '$\\ell^2$' }, { value: Infinity, label: '$\\ell^\\infty$' }];
        const which = v.select('norm', NS, 2, { onChange: (p) => { const q = [Math.cos(0.45), Math.sin(0.45)], nn = pnorm(q, p); xh.set(q[0] / nn, q[1] / nn); } });
        const D = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, height: 360, minWidth: 270, title: 'domain: the unit sphere and $x$' });
        const R = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 360, minWidth: 300, title: 'range: image of the sphere, $Ax$' });
        const xh = D.handle(0.9, 0.4, { color: 'gold', label: 'x', constrain: (x, y) => { const q = [x, y], nn = pnorm(q, which.value); return nn < 1e-9 ? [1, 0] : [x / nn, y / nn]; } });
        const H = colHandles(R, [[1.2, 0.8], [-0.6, 1.0]], { l1: 'Ae₁', l2: 'Ae₂' });
        let st = null;
        v.render(() => {
          const p = which.value, A = H.A, sph = spherePts(p, 720);
          let best = -1, bi = 0;
          const ims = sph.map((q, i) => { const y = mv(A, q); const nn = pnorm(y, p); if (nn > best) { best = nn; bi = i; } return y; });
          const formula = p === 1 ? norm1(A) : p === Infinity ? normInf(A) : svd22(A).s[0];
          const x = [xh.x, xh.y], Ax = mv(A, x);
          D.path(sph, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2 });
          D.arrow(0, 0, x[0], x[1], { color: 'gold', width: 2.4 });
          D.dot(sph[bi][0], sph[bi][1], { color: 'green', r: 6, label: 'x*', labelPos: 'ne' });
          D.dot(-sph[bi][0], -sph[bi][1], { color: 'green', r: 4, hollow: true });
          R.path(spherePts(p, 360).map((q) => scl(q, best)), { color: 'green', dash: [5, 4], width: 1.6 });
          R.path(ims, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          R.arrow(0, 0, H.h1.x, H.h1.y, { color: 'teal', width: 2 }); R.arrow(0, 0, H.h2.x, H.h2.y, { color: 'pink', width: 2 });
          R.arrow(0, 0, Ax[0], Ax[1], { color: 'gold', width: 2.6 });
          R.dot(ims[bi][0], ims[bi][1], { color: 'green', r: 6, label: 'Ax*', labelPos: 'ne' });
          st = { A, p, best, formula, nx: pnorm(Ax, p), x, sv: svd22(A).s };
        });
        v.legend([['accent', 'unit sphere / its image'], ['green', 'sphere of radius $\\|A\\|$', { dash: true }], ['gold', '$x$ and $Ax$']]);
        v.readout(() => {
          if (!st) return '';
          const { A, p, best, formula, nx, x } = st;
          const nameP = p === Infinity ? '\\infty' : String(p), f = p === 1 ? 'largest column sum' : p === Infinity ? 'largest row sum' : '\\sigma_1';
          return `$A = ${matT(A)}$. For this $x$: $\\|Ax\\|_{${nameP}}/\\|x\\|_{${nameP}} = ${nm(nx / pnorm(x, p), 3)}$. Search: $\\max_{\\|x\\|=1}\\|Ax\\|_{${nameP}} = ${nm(best, 4)}$; formula (${f.startsWith('\\') ? '$' + f + '$' : f}): $${nm(formula, 4)}$ — difference $${nm(Math.abs(best - formula), 4)}$ (search resolution).\n$\\|A\\|_1 = ${nm(norm1(A), 3)}$, $\\|A\\|_2 = ${nm(st.sv[0], 3)}$, $\\|A\\|_\\infty = ${nm(normInf(A), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Frobenius norm and unitary invariance',
      statement: String.raw`The Frobenius norm of $A\in\mathbb C^{m\times n}$ is $\|A\|_F=\big(\sum_{i,j}|a_{ij}|^2\big)^{1/2}=\sqrt{\operatorname{tr}(A^*A)}$; it is the Euclidean norm of $A$ read as a vector in $\mathbb C^{mn}$. If $Q\in\mathbb C^{m\times m}$ and $Z\in\mathbb C^{n\times n}$ are unitary, then
$$\|QAZ\|_2=\|A\|_2,\qquad \|QAZ\|_F=\|A\|_F .$$
The induced norms $\|\cdot\|_1$ and $\|\cdot\|_\infty$ do **not** have this invariance.`,
      idea: String.raw`For the 2-norm, $\|QAZx\|_2=\|AZx\|_2$ because $Q$ preserves lengths (1.2), and $Z$ maps the unit sphere of $\mathbb C^n$ onto itself, so the supremum over $x$ does not change. For the Frobenius norm, $\|A\|_F^2$ is the sum of the squared lengths of the columns; $Q$ preserves each, so $\|QA\|_F=\|A\|_F$; and $\|AZ\|_F=\|(AZ)^*\|_F=\|Z^*A^*\|_F=\|A^*\|_F=\|A\|_F$ by the same argument applied to rows. Column sums and row sums, by contrast, depend on the coordinate axes that a rotation moves.`,
      caption: String.raw`Drag the columns of $A$ (blue arrows) and turn the knobs: $\theta$ rotates the range ($Q$), $\varphi$ the domain ($Z$); the toggle makes $Z$ a reflection; the button draws a fresh random pair. The matrix $B=QAZ$ has completely different entries (tiles on the right), but its ellipse is the blue one rotated, and the $2$-norm and Frobenius bars are the same for $A$ and $B$. The $1$- and $\infty$-norm bars move.`,
      deps: ['nla-1.4', 'nla-1.2'],
      tags: ['norms', 'invariance'],
      credit: 'F. G. Frobenius (the norm bears his name)',
      refs: ['Trefethen–Bau Lec. 3'],
      viz(v) {
        const E = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, height: 360, minWidth: 270, title: 'unit circle under $A$ and under $B=QAZ$' });
        const Nb = v.stage({ x: [0, 4.4], y: [0, 3.6], axes: false, height: 360, minWidth: 270, title: 'four norms of $A$ and $B$' });
        const Tl = v.stage({ x: [0, 4.4], y: [0, 3.6], equal: true, axes: false, height: 360, minWidth: 250, title: 'entries of $A$ and $B$' });
        const th = v.slider('$\\theta$ ($Q$)', -3.14, 3.14, 0.9, { step: 0.02 });
        const ph = v.slider('$\\varphi$ ($Z$)', -3.14, 3.14, -0.7, { step: 0.02 });
        const refl = v.toggle('$Z$ a reflection', false);
        const rng = v.rng(5);
        v.button('Random $Q,Z$', () => { th.set((rng() - 0.5) * 6.28); ph.set((rng() - 0.5) * 6.28); });
        const H = colHandles(E, [[1.6, 0.4], [-0.3, 0.9]], { l1: 'a₁', l2: 'a₂', c1: 'blue', c2: 'blue' });
        let st = null;
        v.render(() => {
          const A = H.A, Z0 = rot(ph.value), Z = refl.value ? mm(Z0, [[1, 0], [0, -1]]) : Z0, Q = rot(th.value);
          const Bm = mm(Q, mm(A, Z));
          const sA = svd22(A).s, sB = svd22(Bm).s;
          const nA = [norm1(A), sA[0], fro(A), normInf(A)], nB = [norm1(Bm), sB[0], fro(Bm), normInf(Bm)];
          E.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          E.path(ellPts(A), { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 2 });
          E.path(ellPts(Bm), { color: 'orange', width: 2.2, dash: [6, 4] });
          E.arrow(0, 0, H.h1.x, H.h1.y, { color: 'blue', width: 2 }); E.arrow(0, 0, H.h2.x, H.h2.y, { color: 'blue', width: 2 });
          // bars
          const labs = ['‖·‖₁', '‖·‖₂', '‖·‖_F', '‖·‖∞'], ymax = Math.max(1, ...nA, ...nB) * 1.12, sy = 3.0 / ymax;
          labs.forEach((lb, i) => {
            const x0 = 0.35 + i * 1.02;
            const inv = i === 1 || i === 2;
            Nb.rect(x0, 0.4, x0 + 0.4, 0.4 + nA[i] * sy, { fill: 'blue', fillAlpha: 0.55, stroke: false });
            Nb.rect(x0 + 0.42, 0.4, x0 + 0.82, 0.4 + nB[i] * sy, { fill: 'orange', fillAlpha: 0.55, stroke: false });
            Nb.text(nmc(nA[i], 2), x0 + 0.2, 0.4 + nA[i] * sy + 0.14, { size: 11, align: 'center', color: 'blue' });
            Nb.text(nmc(nB[i], 2), x0 + 0.62, 0.4 + nB[i] * sy + 0.14, { size: 11, align: 'center', color: 'orange' });
            Nb.text(lb, x0 + 0.41, 0.17, { size: 12.5, align: 'center', color: inv ? 'green' : 'muted', weight: inv ? 700 : 400 });
          });
          Nb.line(0.2, 0.4, 4.3, 0.4, { color: 'faint', width: 1 });
          drawTile(Tl, A, 0.1, 0.5, 1.9, 1.9, { frame: 'blue' });
          drawTile(Tl, Bm, 2.35, 0.5, 1.9, 1.9, { frame: 'orange' });
          Tl.text('A', 1.05, 2.75, { math: true, align: 'center', size: 15, color: 'blue' });
          Tl.text('B = QAZ', 3.3, 2.75, { math: true, align: 'center', size: 15, color: 'orange' });
          st = { A, Bm, nA, nB, sA, sB };
        });
        v.legend([['blue', '$A$'], ['orange', '$B=QAZ$'], ['green', 'invariant norms']]);
        v.readout(() => {
          if (!st) return '';
          const { A, Bm, nA, nB, sA } = st;
          const sumsq = A.flat().reduce((s, x) => s + x * x, 0);
          return `$\\|A\\|_2 = ${nm(nA[1], 4)}$, $\\|B\\|_2 = ${nm(nB[1], 4)}$; $\\|A\\|_F = ${nm(nA[2], 4)}$, $\\|B\\|_F = ${nm(nB[2], 4)}$ (differences $${nm(Math.abs(nA[1] - nB[1]), 6)}$, $${nm(Math.abs(nA[2] - nB[2]), 6)}$).\n$\\|A\\|_F^2 = \\sum a_{ij}^2 = ${nm(sumsq, 3)} = \\sigma_1^2+\\sigma_2^2 = ${nm(sA[0] ** 2 + sA[1] ** 2, 3)}$. But $\\|A\\|_1 = ${nm(nA[0], 3)}$ vs $\\|B\\|_1 = ${nm(nB[0], 3)}$ and $\\|A\\|_\\infty = ${nm(nA[3], 3)}$ vs $\\|B\\|_\\infty = ${nm(nB[3], 3)}$.`;
        });
      },
    },
  ],
};
