// Numerical Linear Algebra — Chapter 2: QR factorization and least squares
// Part 2 (this file): 2.8–2.15 — the least squares problem, normal equations, QR and SVD solvers, polynomial fitting,
// Tikhonov regularization, total least squares, rank-revealing QR. Part 1 (2.1–2.7) is in ch02.js.
import {
  nm, nmc, matT, vecT, dot, add, sub, scl, len, unit, mv, mm, tp, fro, msub, TAU, sciT,
  cols, fromCols, cross, normalEq, backSub, householderQR, planeBasis, circ3, rightAngle3, gramSchmidt,
} from './ch02.shared.js';

const CC = ['blue', 'purple', 'teal'];

export default {
  collection: 'nla',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Linear least squares problems',
      statement: String.raw`Given $A\in\mathbb R^{m\times n}$ with $m>n$ and $b\in\mathbb R^m$ (an overdetermined system $Ax=b$ with, in general, no solution), the **linear least squares problem** is to find $x\in\mathbb R^n$ minimising the residual norm $\|b-Ax\|_2$. If $A$ has full column rank the minimiser $\hat x$ is unique. Geometrically $A\hat x$ is the point of $\operatorname{range}A$ closest to $b$, namely the orthogonal projection $Pb$ of $b$ onto $\operatorname{range}A$, and the residual $r=b-A\hat x$ is perpendicular to $\operatorname{range}A$.`,
      idea: String.raw`Minimising a distance to a subspace is the closest-point problem: by Pythagoras, for any $p$ in the subspace, $\|b-p\|^2=\|b-Pb\|^2+\|Pb-p\|^2$, which is smallest exactly at $p=Pb$ (the orthogonal projector of 2.1). Because $A$ has independent columns, $Pb=A\hat x$ for a unique $\hat x$. All the methods of this chapter are different ways of computing that projection.`,
      caption: String.raw`Drag $a_1,a_2$ (they span the green plane), the target $b$ (gold) and the candidate $p=Ax$ (orange, confined to the plane). The red residual from the foot $A\hat x$ to $b$ always meets the plane at a right angle. Move $p$ away from the foot: $\|b-p\|^2$ grows by exactly $\|p-A\hat x\|^2$ (the readout checks Pythagoras), so the foot is the unique minimiser.`,
      deps: ['nla-2.1'],
      credit: 'Legendre, 1805; Gauss, 1809 (published method of least squares)',
      tags: ['least-squares', 'projection'],
      refs: ['Trefethen–Bau Lec. 11'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.85, 1.85], equal: true, axes: false, height: 440, full: true });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.32, axis: 1.7, lim: 1.7, hint: false });
        const a1 = sc.handle([1.2, 0.2, 0.2], { color: 'blue', label: 'a₁' }), a2 = sc.handle([0.2, 1.0, 0.45], { color: 'purple', label: 'a₂' });
        const projOnto = (B, x) => add(scl(B[0], dot(B[0], x)), scl(B[1], dot(B[1], x)));
        const basis = () => planeBasis(a1.p, a2.p);
        const b = sc.handle([0.6, 0.5, 1.3], { color: 'gold', label: 'b' });
        const p = sc.handle([0.7, 0.2, 0.2], { color: 'orange', label: 'p = Ax', snap: (q) => { const B = basis(); return B ? projOnto(B, q) : q; } });
        let st = null;
        v.render(() => {
          const B = basis();
          if (!B) { S.corner('a₁, a₂ are parallel: no plane', 'tl', { color: 'red', weight: 700 }); st = null; return; }
          p.set(projOnto(B, p.p));
          const A = [a1.p, a2.p], At = A, Am = fromCols(A), foot = projOnto(B, b.p), r = sub(b.p, foot);
          const x = M.lstsq(Am, b.p), pp = p.p;
          sc.begin();
          sc.disc(B[0], B[1], 1.7, { fill: 'green', color: 'green', fillAlpha: 0.1, grid: true });
          sc.arrow([0, 0, 0], a1.p, { color: 'blue', width: 2.6 }); sc.arrow([0, 0, 0], a2.p, { color: 'purple', width: 2.6 });
          sc.line(b.p, pp, { color: 'orange', width: 1.4, dash: true });
          sc.arrow(foot, b.p, { color: 'red', width: 3.4 });
          const rn = len(r);
          if (rn > 0.05) { const d1 = len(sub(pp, foot)) > 0.05 ? unit(sub(pp, foot)) : B[0]; sc.path(rightAngle3(foot, d1, unit(r), 0.13), { color: 'red', width: 1.6 }); }
          sc.arrow([0, 0, 0], b.p, { color: 'gold', width: 1.6, alpha: 0.5 });
          sc.dot(foot, { color: 'green', r: 6 }); sc.tex('A\\hat x', foot, { color: 'green', size: 14, dx: -22, dy: 14 });
          sc.tex('r', add(foot, scl(r, 0.5)), { color: 'red', size: 15, dx: 12 });
          sc.flush();
          const dp = sub(pp, foot);
          st = { x, rn, ortho: Math.max(Math.abs(dot(a1.p, r)), Math.abs(dot(a2.p, r))), lhs: dot(sub(b.p, pp), sub(b.p, pp)), rhs: rn * rn + dot(dp, dp), dist: len(dp) };
        });
        v.legend([['blue', '$a_1$'], ['purple', '$a_2$'], ['gold', '$b$'], ['red', 'residual $r$'], ['green', 'range $A$', { area: true }], ['orange', 'candidate $p=Ax$']]);
        v.readout(() => st ? `$\\hat x=${vecT(st.x, 3)}$, $\\|r\\|=${nm(st.rn, 4)}$, and $a_1^{\\top}r,\\,a_2^{\\top}r$ are both $0$ (largest $|a_j^{\\top}r|=${sciT(st.ortho)}$).\nPythagoras for the candidate: $\\|b-p\\|^2=${nm(st.lhs, 4)}=\\|r\\|^2+\\|p-A\\hat x\\|^2=${nm(st.rhs, 4)}$; the excess over the minimum is $\\|p-A\\hat x\\|^2=${nm(st.dist * st.dist, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Normal equations',
      statement: String.raw`Let $A\in\mathbb R^{m\times n}$ and $b\in\mathbb R^m$. A vector $\hat x$ minimises $\|b-Ax\|_2$ if and only if the residual is orthogonal to the range of $A$, i.e. if and only if
$$A^{\top}A\,\hat x=A^{\top}b .$$
These *normal equations* always have a solution; it is unique exactly when $A$ has full column rank, in which case $A^{\top}A$ is symmetric positive definite and $\hat x=(A^{\top}A)^{-1}A^{\top}b$.`,
      idea: String.raw`Differentiating $f(x)=\|b-Ax\|^2$ gives $\nabla f=2A^{\top}(Ax-b)$, and $f$ is convex (a quadratic with Hessian $2A^{\top}A\succeq0$), so a stationary point is a global minimum; $A^{\top}(b-Ax)=0$ says that the residual is perpendicular to every column, the geometric condition of 2.8. If $A^{\top}Ax=0$ then $\|Ax\|^2=x^{\top}A^{\top}Ax=0$, so $A^{\top}A$ is invertible iff $A$ has trivial null space (full rank).`,
      caption: String.raw`The plane is the space of coefficient vectors $x=(x_1,x_2)$ for $A=(a_1\ a_2)$, with contours of $\|b-Ax\|^2$ (ellipses). Each normal equation $a_j^{\top}(b-Ax)=0$ is a straight line; they cross at the minimiser $\hat x$ (green). Drag the candidate $x$ (gold): the bars show the inner products $a_j^{\top}r$ of the current residual with the columns, which vanish only at $\hat x$, and the arrow is the gradient (it points uphill, towards bigger residual). Reduce the angle between the columns to stretch the ellipses: the problem becomes ill-conditioned.`,
      deps: ['nla-2.8', 'rca-4.10'],
      tags: ['normal-equations', 'least-squares'],
      refs: ['Trefethen–Bau Lec. 11'],
      viz(v) {
        const M = v.M;
        const X = v.stage({ x: [-3, 4.4], y: [-3, 4.4], equal: true, axes: true, height: 400, minWidth: 340, title: 'coefficient plane: contours of $\\|b-Ax\\|^2$' });
        const B = v.stage({ x: [0, 3], y: [-3.4, 3.4], axes: 'box', gutter: true, height: 400, minWidth: 220, xlabel: '', ylabel: 'inner product', xticks: [[1, '$a_1^{\\top}r$'], [2, '$a_2^{\\top}r$']], title: 'residual against each column' });
        const ph = v.slider('angle between the columns', 12, 90, 50, { step: 1, fmt: (x) => `${v.fix(x, 0)}°` });
        const xh = X.handle(2.2, -0.6, { color: 'gold', label: 'x' });
        const bv = [1.0, 0.9, 0.7];
        let st = null;
        v.render(() => {
          const t = (ph.value * Math.PI) / 180, A = [[1, Math.cos(t)], [0, Math.sin(t)], [0, 0]], Ac = [[1, 0, 0], [Math.cos(t), Math.sin(t), 0]];
          const xs = M.lstsq(A, bv), f = (x, y) => { const r = sub(bv, mv(A, [x, y])); return dot(r, r); };
          const fm = f(xs[0], xs[1]);
          X.clip(() => {
            X.contour(f, [0.1, 0.4, 1, 2.2, 4, 7, 12, 20, 32].map((l) => fm + l), { color: 'accent', width: 1.3, alpha: 0.55, res: 160 });
            // the two normal-equation lines: a_j . (b - A x) = 0
            const G = mm(tp(A), A), g = mv(tp(A), bv);
            [0, 1].forEach((j) => {
              const nrm = G[j], rhs = g[j], dir = [-nrm[1], nrm[0]], x0 = scl(nrm, rhs / dot(nrm, nrm));
              X.line(x0[0] - 12 * dir[0], x0[1] - 12 * dir[1], x0[0] + 12 * dir[0], x0[1] + 12 * dir[1], { color: ['blue', 'purple'][j], width: 2, alpha: 0.85 });
            });
          });
          X.dot(xs[0], xs[1], { color: 'green', r: 7, label: 'x̂', labelPos: 'ne' });
          const x = [xh.x, xh.y], r = sub(bv, mv(A, x)), g2 = scl(mv(tp(A), r), -2), gn = len(g2);
          if (gn > 1e-6) { const k = Math.min(1.4, gn) / gn * 0.6; X.arrow(x[0], x[1], x[0] + g2[0] * k, x[1] + g2[1] * k, { color: 'red', width: 2.4 }); }
          const ip = [dot(A.map((r) => r[0]), r), dot(A.map((r) => r[1]), r)];
          B.bars(ip, { x0: 1, dx: 1, color: (val, i) => (Math.abs(val) < 0.02 ? 'green' : ['blue', 'purple'][i]) });
          B.hline(0, { color: 'muted', width: 1 });
          B.text(`‖r‖ = ${nmc(len(r), 3)}`, 1.5, 3.0, { align: 'center', color: 'ink', size: 14 });
          const cond = M.svd(A).S;
          st = { xs, ip, rn: len(r), rmin: Math.sqrt(fm), ne: len(sub(mv(mm(tp(A), A), xs), mv(tp(A), bv))), kappa: cond[0] / cond[1], A, gn };
        });
        v.legend([['accent', 'contours of $\\|b-Ax\\|^2$'], ['blue', '$a_1^{\\top}(b-Ax)=0$'], ['purple', '$a_2^{\\top}(b-Ax)=0$'], ['red', 'gradient'], ['green', '$\\hat x$']]);
        v.readout(() => st ? `$\\hat x=${vecT(st.xs, 3)}$ solves $A^{\\top}A\\hat x=A^{\\top}b$ (error $${sciT(st.ne)}$); $\\min\\|r\\|=${nm(st.rmin, 4)}$, at your $x$: $\\|r\\|=${nm(st.rn, 4)}$.\nInner products with the columns at $x$: $a_1^{\\top}r=${nm(st.ip[0], 3)}$, $a_2^{\\top}r=${nm(st.ip[1], 3)}$; $\\kappa(A)=${nm(st.kappa, 2)}$ (the ellipses' axis ratio is $\\kappa$).` : '');
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Least squares via QR',
      statement: String.raw`If $A\in\mathbb R^{m\times n}$ has full column rank and $A=\hat Q\hat R$ is a reduced QR factorization, then the least squares solution is the solution of the triangular system
$$\hat R\,\hat x=\hat Q^{\top}b,$$
found by back-substitution. The residual is $r=b-\hat Q\hat Q^{\top}b$ and $\|r\|^2=\|b\|^2-\|\hat Q^{\top}b\|^2$. With Householder QR the cost is $2mn^2-\tfrac23n^3$ flops and the method is backward stable; its accuracy is governed by $\kappa(A)$ (and by $\kappa(A)^2\tan\theta$ for large residuals), not by $\kappa(A)^2$ as for the normal equations.`,
      idea: String.raw`$\hat Q\hat Q^{\top}$ is the orthogonal projector onto $\operatorname{range}A=\operatorname{range}\hat Q$, so $A\hat x=\hat Q\hat Q^{\top}b$ means $\hat Q\hat R\hat x=\hat Q\hat Q^{\top}b$; multiplying by $\hat Q^{\top}$ (and using $\hat Q^{\top}\hat Q=I$) cancels $\hat Q$ and leaves $\hat R\hat x=\hat Q^{\top}b$. Equivalently the normal equations $\hat R^{\top}\hat R\hat x=\hat R^{\top}\hat Q^{\top}b$ factor through the invertible $\hat R^{\top}$ — but without ever forming $A^{\top}A$ and squaring the condition number.`,
      caption: String.raw`Fit a polynomial of the chosen degree to the 12 data points. Step through: form the Vandermonde matrix, compute $\hat R$ (Householder QR), form $c=\hat Q^{\top}b$, then back-substitute from the last unknown up (highlighted row), and finally compare with the normal equations solved by Cholesky. Raise the degree: the two answers separate as $\kappa(A)$ grows, QR following the SVD reference far longer.`,
      deps: ['nla-2.9', 'nla-2.6'],
      tags: ['qr', 'least-squares'],
      refs: ['Trefethen–Bau Lec. 11'],
      viz(v) {
        const M = v.M;
        const m = 12, ts = Array.from({ length: m }, (_, i) => i / (m - 1)), ys = ts.map((t, i) => Math.sin(2.6 * t) + 0.5 * t + 0.12 * Math.sin(37 * i + 1));
        const S = v.stage({ x: [-0.05, 1.05], y: [-0.3, 1.5], axes: 'box', gutter: true, height: 340, minWidth: 320, xlabel: 't', ylabel: 'y', title: 'the data and the fitted polynomial' });
        const Tt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 360, title: '$\\hat R\\ |\\ c\\ |\\ \\hat x$' });
        const deg = v.slider('degree', 1, 9, 3, { int: true, onChange: () => Sx.reset(undefined, { at: 'start' }) });
        const solve = () => {
          const n = deg.value + 1, A = ts.map((t) => Array.from({ length: n }, (_, k) => t ** k));
          const { Q, R } = M.qr(A, { thin: true }), c = mv(tp(Q), ys), xq = backSub(R, c);
          const xs = M.lstsq(A, ys), xn = normalEq(M, A, ys);
          return { n, A, R, c, xq, xs, xn, kappa: M.svd(A).S[0] / M.svd(A).S.at(-1) };
        };
        let D = solve();
        const frames = () => {
          D = solve();
          const n = D.n, fr = [
            { k: 0, note: String.raw`Form the $12\times${n}$ Vandermonde matrix $A$ and the data vector $b$.` },
            { k: 1, note: String.raw`Householder QR: $A=\hat Q\hat R$; $\hat R$ is upper triangular (shown in the table).` },
            { k: 2, note: String.raw`Form $c=\hat Q^{\top}b$ (first $n$ entries of the rotated data).` },
          ];
          for (let i = n - 1; i >= 0; i--) fr.push({ k: 3, row: i, note: `Back-substitution: $x_${i} = (c_${i}${i < n - 1 ? ' - \\sum_{j>' + i + '}r_{' + i + 'j}x_j' : ''})/r_{${i}${i}}$.` });
          fr.push({ k: 4, note: String.raw`Done: compare with the normal equations and the SVD solution (readout).` });
          return fr;
        };
        const Sx = v.steps({ frames, still: 3, code: ['form A, b', 'A = Q̂ R̂', 'c ← Q̂ᵀ b', 'for i = n … 1', '  x_i ← (c_i − Σ_{j>i} r_ij x_j) / r_ii'] });
        const T = v.table(Tt, { rows: 4, cols: 6, square: false, cellAspect: 1.4, maxCell: 54, size: 11 });
        v.render(() => {
          const f = Sx.frame, n = D.n;
          const ev = (x, t) => x.reduce((s, c, k) => s + c * t ** k, 0);
          S.dots(ts.map((t, i) => [t, ys[i]]), { r: 4, color: 'muted' });
          if (f.k >= 4) {
            S.fn((t) => ev(D.xs, t), { color: 'faint', width: 1.2, domain: [0, 1] });
            S.fn((t) => ev(D.xq, t), { color: 'accent', width: 2.6, domain: [0, 1] });
            if (D.xn) S.fn((t) => ev(D.xn, t), { color: 'red', width: 1.8, dash: true, domain: [0, 1] });
          } else if (f.k === 3) {
            S.text('solving for the coefficients…', 0.5, 1.35, { align: 'center', color: 'muted', size: 13 });
          }
          const done = (i) => f.k === 3 ? i >= f.row : f.k >= 4;
          T.draw({
            rows: n, cols: n + 2,
            value: (i, j) => {
              if (j < n) return f.k >= 1 && j >= i ? D.R[i][j] : null;
              if (j === n) return f.k >= 2 ? D.c[i] : null;
              return done(i) ? D.xq[i] : null;
            },
            format: (x) => (x == null ? '' : Math.abs(x) >= 100 || (Math.abs(x) < 0.01 && x !== 0) ? x.toExponential(1).replace('e', '·10^').replace('-', '−') : nmc(x, 2)),
            colLabels: (j) => (j < n ? `$\\hat R_{\\cdot${j}}$` : j === n ? '$c$' : '$\\hat x$'),
            rowLabels: (i) => `$${i}$`,
            fill: (i, j) => (j === n + 1 && done(i) && f.k === 3 && i === f.row ? ['gold', 0.4] : j > n ? ['green', 0.1] : j === n ? ['blue', 0.07] : null),
            highlight: f.k === 3 ? [[f.row, n + 1, 'gold']] : [],
            size: 11,
          });
        });
        v.legend([['accent', 'QR solution'], ['red', 'normal equations (Cholesky)', { dash: true }], ['faint', 'SVD reference']]);
        v.readout(() => {
          const relq = len(sub(D.xq, D.xs)) / len(D.xs), reln = D.xn ? len(sub(D.xn, D.xs)) / len(D.xs) : null;
          return `$\\kappa(A)=${v.sci(D.kappa, 2)}$. Relative difference from the SVD reference: QR $${sciT(relq)}$, normal equations ${reln == null ? 'failed ($A^{\\top}A$ not numerically positive definite)' : `$${sciT(reln)}$`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Method',
      name: 'Least squares via the SVD and the pseudoinverse',
      statement: String.raw`Let $A=U\Sigma V^{\top}$ be a thin SVD with $r=\operatorname{rank}A$ nonzero singular values. Among all minimisers of $\|b-Ax\|_2$ (a whole affine set $\hat x+\operatorname{null}A$ when $r<n$) the one of smallest norm is
$$x^{+}=A^{+}b=V\Sigma^{+}U^{\top}b=\sum_{i=1}^{r}\frac{u_i^{\top}b}{\sigma_i}\,v_i ,$$
where $A^{+}=V\Sigma^{+}U^{\top}$ is the Moore–Penrose pseudoinverse, with $\Sigma^{+}$ inverting the nonzero singular values. It lies in $\operatorname{range}A^{\top}=(\operatorname{null}A)^{\perp}$. Computed with a tolerance (singular values $\le\tau$ treated as zero) it also gives a stable answer for numerically rank-deficient $A$.`,
      idea: String.raw`Rotate coordinates by $V$ in the domain and $U$ in the range: the problem becomes $\min\sum_i(\sigma_iy_i-\beta_i)^2$ with $y=V^{\top}x$, $\beta=U^{\top}b$ (plus a constant), which decouples. Each $y_i=\beta_i/\sigma_i$ if $\sigma_i>0$, and is free if $\sigma_i=0$; the free directions are $\operatorname{null}A$, and $\|x\|=\|y\|$ is smallest by setting them to $0$. The formula uses the SVD of 1.6–1.7 and the projection facts of 2.1; the tolerance $\tau$ makes the discontinuous $A\mapsto A^{+}$ usable.`,
      caption: String.raw`A $2\times2$ matrix $A=U\,\mathrm{diag}(2,\sigma_2)V^{\top}$. Left: the coefficient plane with contours of $\|b-Ax\|^2$; right: the range plane with the target $b$ (drag it) and the closest point $Ax^{+}$. At $\sigma_2=0$ the valley is a whole line of minimisers (green) and $x^{+}$ (gold) is the point of it closest to the origin. Raise $\sigma_2$ slightly: the true minimiser (red) shoots far away along $v_2$, yet the truncated solution with $\tau=0.1$ stays put.`,
      deps: ['nla-2.9', 'nla-1.7', 'ladr-6.70'],
      credit: 'E. H. Moore, 1920; R. Penrose, 1955 (pseudoinverse)',
      tags: ['pseudoinverse', 'svd', 'least-squares'],
      refs: ['Trefethen–Bau Lec. 11'],
      viz(v) {
        const M = v.M;
        const X = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: true, height: 380, minWidth: 330, title: 'coefficient plane $x$' });
        const Bs = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: true, height: 380, minWidth: 330, title: 'range plane $b$' });
        const s2 = v.slider('$\\sigma_2$', 0, 1, 0, { step: 0.005 });
        const tau = v.slider('truncation $\\tau$', 0.01, 1, 0.1, { log: true, sig: 2 });
        const bh = Bs.handle(1.6, 1.3, { color: 'gold', label: 'b' });
        const tu = 0.55, tv = -0.35;
        const Ur = [[Math.cos(tu), -Math.sin(tu)], [Math.sin(tu), Math.cos(tu)]], Vr = [[Math.cos(tv), -Math.sin(tv)], [Math.sin(tv), Math.cos(tv)]];
        let st = null;
        v.render(() => {
          const sg = [2, s2.value], U = Ur, V = Vr, ucol = [[U[0][0], U[1][0]], [U[0][1], U[1][1]]], vcol = [[V[0][0], V[1][0]], [V[0][1], V[1][1]]];
          const Am = [0, 1].map((i) => [0, 1].map((j) => sg[0] * U[i][0] * V[j][0] + sg[1] * U[i][1] * V[j][1]));
          const b = [bh.x, bh.y], beta = [dot(ucol[0], b), dot(ucol[1], b)];
          const solveT = (t) => { let x = [0, 0]; sg.forEach((s, i) => { if (s > t) x = add(x, scl(vcol[i], beta[i] / s)); }); return x; };
          const xp = solveT(tau.value), xexact = s2.value > 1e-9 ? solveT(0) : xp;
          const f = (x, y) => { const r = sub(b, mv(Am, [x, y])); return dot(r, r); };
          X.clip(() => {
            X.heat((x, y) => Math.log10(f(x, y) + 0.02), { range: [-1.6, 1.5], cmap: 'theme', res: 4, key: `${s2.value}|${b[0]}|${b[1]}` });
            X.contour(f, [0.05, 0.3, 1, 2.5, 5, 10, 20], { color: 'accent', width: 1, alpha: 0.4 });
            if (s2.value < 1e-9) X.line(xp[0] - 9 * vcol[1][0], xp[1] - 9 * vcol[1][1], xp[0] + 9 * vcol[1][0], xp[1] + 9 * vcol[1][1], { color: 'green', width: 3 });
          });
          X.axes();
          X.arrow(0, 0, vcol[0][0] * 1.3, vcol[0][1] * 1.3, { color: 'blue', width: 2.2 }); X.tex('v_1', vcol[0][0] * 1.45, vcol[0][1] * 1.45, { color: 'blue', size: 14 });
          X.arrow(0, 0, vcol[1][0] * 1.3, vcol[1][1] * 1.3, { color: 'purple', width: 2.2 }); X.tex('v_2', vcol[1][0] * 1.45, vcol[1][1] * 1.45, { color: 'purple', size: 14 });
          X.circle(0, 0, len(xp), { color: 'gold', width: 1.4, dash: true });
          if (len(sub(xexact, xp)) > 1e-6 && len(xexact) < 40) X.dot(xexact[0], xexact[1], { color: 'red', r: 6, label: 'exact minimiser', labelPos: 'n' });
          X.dot(xp[0], xp[1], { color: 'gold', r: 7, label: 'x⁺', labelPos: 'ne' });
          // range plane
          const Ax = mv(Am, xp);
          Bs.poly(Array.from({ length: 97 }, (_, k) => mv(Am, [Math.cos((TAU * k) / 96), Math.sin((TAU * k) / 96)])), { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1.4 });
          Bs.arrow(0, 0, ucol[0][0] * sg[0], ucol[0][1] * sg[0], { color: 'blue', width: 2.2 });
          Bs.line(b[0], b[1], Ax[0], Ax[1], { color: 'red', width: 2, dash: true });
          Bs.dot(Ax[0], Ax[1], { color: 'gold', r: 6, label: 'Ax⁺', labelPos: 'se' });
          st = { sg, xp, xexact, rn: len(sub(b, Ax)), nx: len(xp), perp: s2.value < 1e-9 ? Math.abs(dot(xp, vcol[1])) : null, rankT: sg.filter((s) => s > tau.value).length };
        });
        v.legend([['blue', '$v_1$'], ['purple', '$v_2$'], ['gold', '$x^{+}$ (truncated)'], ['red', 'exact minimiser'], ['green', 'minimisers / image of unit disc']]);
        v.readout(() => st ? `$\\sigma=(${nm(st.sg[0], 2)},\\,${nm(st.sg[1], 3)})$; $\\tau=${nm(tau.value, 3)}$ keeps ${st.rankT} singular value${st.rankT === 1 ? '' : 's'}. $x^{+}=${vecT(st.xp, 3)}$, $\\|x^{+}\\|=${nm(st.nx, 3)}$, residual $\\|b-Ax^{+}\\|=${nm(st.rn, 3)}$.${st.perp != null ? `\nWith $\\sigma_2=0$ every point of the green line has the same residual; $x^{+}\\perp\\operatorname{null}A=\\operatorname{span}(v_2)$ (inner product $${sciT(st.perp)}$), so it is the shortest.` : `\nThe exact minimiser has norm $${nm(len(st.xexact), 2)}$: dividing by a small $\\sigma_2$ amplifies the component $u_2^{\\top}b$.`}` : '');
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Model',
      name: 'Polynomial data fitting',
      statement: String.raw`Given data $(t_i,y_i)$, $i=1,\dots,m$, with distinct nodes, the degree-$d$ polynomial $p(t)=\sum_{k=0}^dx_kt^k$ that minimises $\sum_i(p(t_i)-y_i)^2$ solves the least squares problem with the Vandermonde matrix $A_{ik}=t_i^k$ ($m\times(d+1)$, full column rank when $d<m$). The residual $\|y-Ax\|$ is non-increasing in $d$ and reaches $0$ at $d=m-1$, where $p$ interpolates the data; the fit to the underlying function does not improve forever.`,
      idea: String.raw`The model spaces are nested, so the minimum over a larger space cannot be bigger, and at $d=m-1$ the square Vandermonde matrix is invertible (a polynomial of degree $m-1$ is determined by $m$ values), so the data are matched exactly — together with their noise. High-degree fits through noisy data oscillate between the nodes (the Runge phenomenon of interpolation plus noise amplification, with $\kappa(A)$ growing quickly) which is why a low-residual fit is not a good fit; the system is solved by QR (2.10) rather than by the normal equations.`,
      caption: String.raw`Drag the data points up and down (their abscissae are fixed), choose the degree, and watch the fit (blue) against the curve the noisy data were sampled from (dashed grey). On the right, the residual norm falls monotonically to $0$ at degree $11$, while the error against the underlying function (orange) first falls and then explodes. **Resample** draws new noise.`,
      deps: ['nla-2.10'],
      credit: 'Gauss and Legendre; the Vandermonde setting is classical',
      tags: ['least-squares', 'fitting', 'overfitting'],
      refs: ['Trefethen–Bau Lec. 11'],
      viz(v) {
        const M = v.M;
        const m = 12, xs = Array.from({ length: m }, (_, i) => -1 + (2 * i) / (m - 1)), truth = (x) => Math.sin(2.4 * x) + 0.3 * x;
        const S = v.stage({ x: [-1.15, 1.15], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 400, minWidth: 340, xlabel: 't', ylabel: 'y', title: 'data and the least squares polynomial' });
        const R = v.stage({ x: [-0.3, 11.5], y: [1e-4, 20], ylog: true, axes: 'box', gutter: true, height: 400, minWidth: 300, xlabel: 'degree d', ylabel: 'norm', title: 'residual and error against the truth' });
        const deg = v.slider('degree $d$', 0, 11, 3, { int: true });
        let seed = 4;
        const noise = () => { const r = v.rng(seed); return xs.map(() => 0.25 * r.normal()); };
        let nz = noise();
        const H = xs.map((x, i) => S.handle(x, truth(x) + nz[i], { color: 'gold', r: 6, constrain: 'y' }));
        v.button('Resample', () => { seed++; nz = noise(); H.forEach((h, i) => h.set(xs[i], truth(xs[i]) + nz[i])); });
        let st = null;
        v.render(() => {
          const y = H.map((h) => h.y), tt = Array.from({ length: 121 }, (_, k) => -1 + k / 60);
          const fit = (d) => { const A = xs.map((t) => Array.from({ length: d + 1 }, (_, k) => t ** k)), { Q, R: Rm } = M.qr(A, { thin: true }); return backSub(Rm, mv(tp(Q), y)); };
          const ev = (c, t) => c.reduce((s, a, k) => s + a * t ** k, 0);
          const all = Array.from({ length: m }, (_, d) => { const c = fit(d); return { res: Math.hypot(...xs.map((t, i) => ev(c, t) - y[i])), err: Math.sqrt(tt.reduce((s, t) => s + (ev(c, t) - truth(t)) ** 2, 0) / tt.length) }; });
          const c = fit(deg.value);
          S.fn(truth, { color: 'muted', width: 1.4, dash: true, domain: [-1, 1] });
          S.fn((t) => ev(c, t), { color: 'accent', width: 2.8, domain: [-1, 1] });
          xs.forEach((t, i) => S.line(t, y[i], t, ev(c, t), { color: 'red', width: 1.2, alpha: 0.7 }));
          const fl = (x) => Math.max(1.5e-4, x);
          R.path(all.map((a, d) => [d, fl(a.res)]), { color: 'blue', width: 2.2 }); R.path(all.map((a, d) => [d, fl(a.err)]), { color: 'orange', width: 2.2 });
          R.dots(all.map((a, d) => [d, fl(a.res)]), { r: 3.5, color: 'blue' }); R.dots(all.map((a, d) => [d, fl(a.err)]), { r: 3.5, color: 'orange' });
          R.vline(deg.value, { color: 'gold', width: 1.6, alpha: 0.8 });
          st = { res: all[deg.value].res, err: all[deg.value].err, best: all.reduce((b, a, d) => (a.err < all[b].err ? d : b), 0), kappa: (() => { const s = M.svd(xs.map((t) => Array.from({ length: deg.value + 1 }, (_, k) => t ** k))).S; return s[0] / s.at(-1); })() };
        });
        v.legend([['accent', 'fit'], ['muted', 'underlying function', { dash: true }], ['red', 'residuals'], ['blue', '$\\|y-Ax\\|$'], ['orange', 'RMS error against the truth']]);
        v.readout(() => st ? `Degree $${deg.value}$: residual $\\|y-Ax\\|=${nm(st.res, 4)}$${deg.value === 11 ? ' ($=0$: interpolation)' : ''}, RMS error against the underlying function $${nm(st.err, 3)}$, $\\kappa(A)=${v.sci(st.kappa, 2)}$. The truth is approximated best at degree $${st.best}$ — not where the residual is smallest.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Method',
      name: 'Tikhonov regularization (ridge regression)',
      statement: String.raw`For $A\in\mathbb R^{m\times n}$, $b\in\mathbb R^m$ and a parameter $\lambda>0$, the Tikhonov (ridge) solution is the unique minimiser of $\|b-Ax\|_2^2+\lambda^2\|x\|_2^2$; it solves $(A^{\top}A+\lambda^2I)x_\lambda=A^{\top}b$ — equivalently the least squares problem for the stacked matrix $\binom{A}{\lambda I}$ — and with $A=U\Sigma V^{\top}$,
$$x_\lambda=\sum_i\frac{\sigma_i}{\sigma_i^2+\lambda^2}(u_i^{\top}b)\,v_i=\sum_i f_i\,\frac{u_i^{\top}b}{\sigma_i}\,v_i,\qquad f_i=\frac{\sigma_i^2}{\sigma_i^2+\lambda^2}.$$
The *filter factors* $f_i$ keep components with $\sigma_i\gg\lambda$ and damp those with $\sigma_i\ll\lambda$. As $\lambda\to0$, $x_\lambda\to A^{+}b$ (2.11); as $\lambda\to\infty$, $x_\lambda\to0$. The curve $(\|Ax_\lambda-b\|,\|x_\lambda\|)$ is the *L-curve*.`,
      idea: String.raw`In the SVD basis (2.11) the penalised problem decouples into scalar problems $\min(\sigma_iy_i-\beta_i)^2+\lambda^2y_i^2$ with solution $y_i=\sigma_i\beta_i/(\sigma_i^2+\lambda^2)$. For an ill-posed problem (singular values decaying to $0$) the unregularised solution divides noisy $\beta_i$ by tiny $\sigma_i$ and is dominated by noise; the penalty cuts exactly those terms. Increasing $\lambda$ trades a larger residual for a smaller solution norm; the corner of the L-curve is a popular balance.`,
      caption: String.raw`Deblurring: $b=Ax_{\rm true}+{\rm noise}$ where $A$ is a Gaussian blur of a piecewise signal on $40$ points. Left: the true signal (grey), the data (dots), the unregularised solution (red, off the chart: noise amplified by $1/\sigma_{\min}$) and the Tikhonov solution (blue). Right: the L-curve with your $\lambda$ as the gold dot and its corner in green. Slide $\lambda$ from tiny (noise explodes) to large (oversmoothed) and try more or less noise.`,
      deps: ['nla-2.11'],
      credit: 'A. N. Tikhonov, 1943–63; D. L. Phillips, 1962; Hoerl & Kennard, 1970 (ridge regression)',
      tags: ['regularization', 'ill-posed', 'ridge'],
      refs: ['Golub–Van Loan ch. 6'],
      viz(v) {
        const M = v.M, n = 40, h = 1 / (n - 1), tt = Array.from({ length: n }, (_, i) => i * h);
        const Sg = v.stage({ x: [0, 1], y: [-0.4, 1.7], axes: 'box', gutter: true, height: 360, minWidth: 340, xlabel: 't', ylabel: 'signal', title: 'reconstruction' });
        const Lc = v.stage({ x: [1e-3, 1e1], y: [1, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, minWidth: 300, xlabel: 'residual ‖Ax_λ − b‖', ylabel: 'solution norm ‖x_λ‖', title: 'the L-curve' });
        const noise = v.slider('noise level', 1e-4, 1e-1, 1e-2, { log: true, sig: 2, onChange: () => { cache = null; } });
        const lam = v.slider('$\\lambda$', 1e-5, 1, 2e-3, { log: true, sig: 2 });
        let seed = 2;
        v.button('New noise', () => { seed++; cache = null; });
        v.button('Go to the corner', () => { if (cache?.corner) lam.set(cache.corner); });
        const w = 0.05;
        const A = tt.map((ti) => { const row = tt.map((tj) => Math.exp(-((ti - tj) ** 2) / (2 * w * w))); const s = row.reduce((a, b) => a + b, 0); return row.map((x) => x / s); });
        const xt = tt.map((t) => (t > 0.15 && t < 0.4 ? 1 : 0) + (t > 0.55 && t < 0.85 ? 1.2 * (1 - Math.abs(t - 0.7) / 0.15) : 0));
        const { U, S: sg, V } = M.svd(A);
        let cache = null;
        const prep = () => {
          const r = v.rng(seed), nz = tt.map(() => noise.value * r.normal()), b = add(mv(A, xt), nz), beta = U[0].map((_, k) => dot(U.map((row) => row[k]), b));
          const solve = (l) => { const x = new Array(n).fill(0); sg.forEach((s, k) => { const c = (s / (s * s + l * l)) * beta[k]; for (let i = 0; i < n; i++) x[i] += c * V[i][k]; }); return x; };
          const res = (x) => len(sub(mv(A, x), b));
          const ls = Array.from({ length: 81 }, (_, i) => 10 ** (-6 + (6 * i) / 80));
          const pts = ls.map((l) => { const x = solve(l); return [res(x), len(x)]; });
          // corner: maximum curvature of the log-log curve
          const P = pts.map(([a, c]) => [Math.log10(Math.max(a, 1e-12)), Math.log10(c)]);
          let best = 0, bi = 40;
          for (let i = 2; i < P.length - 2; i++) {
            const d1 = [(P[i + 1][0] - P[i - 1][0]) / 2, (P[i + 1][1] - P[i - 1][1]) / 2], d2 = [P[i + 1][0] - 2 * P[i][0] + P[i - 1][0], P[i + 1][1] - 2 * P[i][1] + P[i - 1][1]];
            const k = Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) / Math.max(1e-12, (d1[0] ** 2 + d1[1] ** 2) ** 1.5);
            if (k > best) { best = k; bi = i; }
          }
          cache = { b, beta, solve, res, ls, pts, corner: ls[bi], cornerPt: pts[bi] };
        };
        let st = null;
        v.render(() => {
          if (!cache) prep();
          const { b, solve, res } = cache, x = solve(lam.value), x0 = solve(1e-9);
          Sg.path(tt.map((t, i) => [t, xt[i]]), { color: 'muted', width: 2.6 });
          Sg.path(tt.map((t, i) => [t, x0[i]]), { color: 'red', width: 1.4, alpha: 0.7 });
          Sg.dots(tt.map((t, i) => [t, b[i]]), { r: 2.6, color: 'ink' });
          Sg.path(tt.map((t, i) => [t, x[i]]), { color: 'accent', width: 3 });
          Lc.path(cache.pts.map(([a, c]) => [Math.max(a, 1.1e-3), c]), { color: 'blue', width: 2.2 });
          Lc.dot(Math.max(cache.cornerPt[0], 1.1e-3), cache.cornerPt[1], { color: 'green', r: 6, label: 'corner', labelPos: 'ne' });
          Lc.dot(Math.max(res(x), 1.1e-3), len(x), { color: 'gold', r: 7 });
          st = { rn: res(x), xn: len(x), err: len(sub(x, xt)) / len(xt), err0: len(sub(x0, xt)) / len(xt), noiseN: len(sub(b, mv(A, xt))), f: sg.map((s) => (s * s) / (s * s + lam.value ** 2)) };
        });
        v.legend([['muted', 'true signal'], ['ink', 'blurred data $b$', { dot: true }], ['red', '$\\lambda\\to0$ (unregularised)'], ['accent', '$x_\\lambda$'], ['green', 'L-curve corner', { dot: true }]]);
        v.readout(() => st ? `$\\lambda=${v.sci(lam.value, 2)}$: residual $\\|Ax_\\lambda-b\\|=${nm(st.rn, 4)}$ (the noise itself has norm $${nm(st.noiseN, 4)}$), $\\|x_\\lambda\\|=${nm(st.xn, 3)}$, relative error $${nm(st.err, 3)}$ — unregularised: $${st.err0 > 1e3 ? v.sci(st.err0, 1) : nm(st.err0, 2)}$. Filter factors: $f_1=${nm(st.f[0], 3)}$, $f_{10}=${nm(st.f[9], 3)}$, $f_{20}=${v.sci(Math.max(st.f[19], 1e-30), 1)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Method',
      name: 'Total least squares',
      statement: String.raw`When both $A$ and $b$ are noisy, **total least squares** finds the smallest perturbation $[E\ |\ r]$ in Frobenius norm such that $(A+E)x=b+r$ is consistent: minimise $\|[E\ r]\|_F$ subject to $b+r\in\operatorname{range}(A+E)$. If $\sigma_{n+1}$, the smallest singular value of $[A\ b]$, is simple and $\sigma_n(A)>\sigma_{n+1}$, the solution is $x_{\rm TLS}=-v_{1:n}/v_{n+1}$ for the corresponding right singular vector $v$ of $[A\ b]$, and the minimum of $\|[E\ r]\|_F$ is $\sigma_{n+1}$ (Eckart–Young, 1.8). For a straight line fitted to points $(x_i,y_i)$ it is the line minimising the sum of squared **perpendicular** distances; ordinary least squares minimises the vertical ones.`,
      idea: String.raw`The condition $(A+E)x=b+r$ says that $[A+E\ \ b+r]$ has the vector $(x,-1)$ in its null space, i.e. is rank-deficient; the nearest rank-deficient matrix to $[A\ b]$ is the truncated SVD of Eckart–Young (1.8), obtained by deleting $\sigma_{n+1}$, and its null vector gives $x$. For the line, the points are centred and the line is the first principal axis (direction of the dominant right singular vector), the orthogonal-regression line. Ordinary least squares is asymmetric (regressing $y$ on $x$ differs from $x$ on $y$); total least squares treats both coordinates alike.`,
      caption: String.raw`Drag the eight points. The orange line is ordinary least squares with its vertical residuals; the green line is total least squares with its perpendicular residuals. Switch between regressing $y$ on $x$ and $x$ on $y$: the OLS line changes (two different lines through the centroid), the TLS line does not. Scatter the points widely in $y$ only and the lines nearly agree; put noise in $x$ as well and OLS flattens ("attenuation").`,
      deps: ['nla-2.11', 'nla-1.8'],
      credit: 'R. J. Adcock, 1877 (orthogonal regression); G. H. Golub & C. F. Van Loan, 1980 (the SVD formulation)',
      tags: ['total-least-squares', 'errors-in-variables'],
      refs: ['Golub–Van Loan ch. 6'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-0.5, 7.5], y: [-0.5, 5.5], equal: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'x', ylabel: 'y' });
        const P0 = [[0.8, 0.9], [1.5, 1.9], [2.3, 1.6], [3.0, 2.9], [3.9, 2.4], [4.6, 3.8], [5.5, 3.5], [6.3, 4.6]];
        const H = P0.map((p, i) => S.handle(p[0], p[1], { color: 'gold', r: 6 }));
        const which = v.select('OLS regresses', [{ value: 'yx', label: '$y$ on $x$' }, { value: 'xy', label: '$x$ on $y$' }], 'yx');
        let st = null;
        v.render(() => {
          const pts = H.map((h) => [h.x, h.y]), n = pts.length, cx = M.mean(pts.map((p) => p[0])), cy = M.mean(pts.map((p) => p[1]));
          const C = pts.map((p) => [p[0] - cx, p[1] - cy]), sxx = dot(C.map((p) => p[0]), C.map((p) => p[0])), syy = dot(C.map((p) => p[1]), C.map((p) => p[1])), sxy = dot(C.map((p) => p[0]), C.map((p) => p[1]));
          const sv = M.svd(C), d = [sv.V[0][0], sv.V[1][0]];                  // dominant right singular vector = TLS direction
          // OLS direction
          const dO = which.value === 'yx' ? unit([sxx || 1e-12, sxy]) : unit([sxy, syy || 1e-12]);
          const line = (dir, col, w, dash) => S.clip(() => S.line(cx - 14 * dir[0], cy - 14 * dir[1], cx + 14 * dir[0], cy + 14 * dir[1], { color: col, width: w, dash }));
          line(dO, 'orange', 2.6); line(d, 'green', 2.6);
          const perpD = (p, dir) => { const t = dot(sub(p, [cx, cy]), dir); return add([cx, cy], scl(dir, t)); };
          pts.forEach((p) => {
            const f = perpD(p, d); S.line(p[0], p[1], f[0], f[1], { color: 'green', width: 1.4, alpha: 0.8 });
            // OLS residual: vertical (y on x) or horizontal (x on y)
            const o = which.value === 'yx' ? [p[0], cy + (dO[1] / (dO[0] || 1e-12)) * (p[0] - cx)] : [cx + (dO[0] / (dO[1] || 1e-12)) * (p[1] - cy), p[1]];
            S.line(p[0], p[1], o[0], o[1], { color: 'orange', width: 1.4, alpha: 0.8 });
          });
          S.dot(cx, cy, { r: 4, color: 'ink', label: 'centroid', labelPos: 'se' });
          const sse = (dir, kind) => C.reduce((s, p) => {
            if (kind === 'perp') { const q = dot(p, dir); return s + dot(p, p) - q * q; }
            if (kind === 'v') { const m = dir[1] / (dir[0] || 1e-12); return s + (p[1] - m * p[0]) ** 2; }
            const m = dir[0] / (dir[1] || 1e-12); return s + (p[0] - m * p[1]) ** 2;
          }, 0);
          const kind = which.value === 'yx' ? 'v' : 'h';
          st = { sl: d[1] / d[0], slO: dO[1] / dO[0], perpT: sse(d, 'perp'), perpO: sse(dO, 'perp'), olsO: sse(dO, kind), olsT: sse(d, kind), s2: sv.S[1] ** 2, dirT: d };
        });
        v.legend([['orange', 'ordinary least squares'], ['green', 'total least squares']]);
        v.readout(() => st ? `Slopes: OLS $${nm(st.slO, 3)}$ (${which.value === 'yx' ? 'vertical' : 'horizontal'} offsets), TLS $${nm(st.sl, 3)}$.\nSum of squared perpendicular distances: TLS $${nm(st.perpT, 3)}$ $=\\sigma_{\\min}^2$ of the centred data (${nm(st.s2, 3)}), OLS line $${nm(st.perpO, 3)}$ (never smaller). Sum of squared ${which.value === 'yx' ? 'vertical' : 'horizontal'} offsets: OLS $${nm(st.olsO, 3)}$ (the minimum), TLS line $${nm(st.olsT, 3)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Algorithm',
      name: 'Rank-revealing QR with column pivoting',
      statement: String.raw`QR with column pivoting (Businger–Golub) computes $AP=QR$ with a permutation $P$ chosen greedily: at step $k$ the remaining column of largest norm is swapped into position $k$ before it is zeroed by a Householder reflector. The diagonal then satisfies $|r_{11}|\ge|r_{22}|\ge\cdots\ge|r_{nn}|$. Since $\sigma_{\min}(A)\le|r_{nn}|$ (the $(n,n)$ entry of $R^{-1}$ is $1/r_{nn}$), a tiny $r_{kk}$ certifies near rank-deficiency, and in practice $|r_{kk}|$ tracks $\sigma_k$ closely, so the rank is read off the diagonal at a fraction of the cost of an SVD. The converse is not guaranteed: for special matrices (Kahan's example) the diagonal stays large while $\sigma_n$ is exponentially small.`,
      idea: String.raw`Choosing the largest remaining column makes each Householder step peel off as much of the matrix as possible, so the energy is concentrated in the leading rows of $R$: if $A$ has numerical rank $r$, the trailing block $R_{22}$ is tiny and $r_{kk}$, $k>r$, are small. The method uses the reflectors of 2.6 with one extra search per step. A lower bound on $\sigma_k$ in terms of $|r_{kk}|$ can fail by a factor growing like $2^{n}$; Kahan's matrix (unit upper-triangular with $-c$ above the diagonal, rows scaled by $s^{i-1}$) is already in pivoted form, so pivoting does nothing, and yet it has a tiny singular value.`,
      caption: String.raw`Plot of $\log_{10}$ of the singular values $\sigma_k$ (grey) and of the diagonal $|r_{kk}|$ without pivoting (red) and with column pivoting (green). Case **low rank + noise**: the matrix has $5$ large singular values and a noise floor; unpivoted QR shows no gap, pivoted QR reproduces the singular values to within a small factor. Case **Kahan**: the diagonal of pivoted QR decays gently while $\sigma_n$ is far below it — the known counterexample. Slide the tolerance to read off the rank each way.`,
      deps: ['nla-2.6'],
      credit: 'P. Businger & G. H. Golub, 1965; W. Kahan, 1966 (the example)',
      tags: ['qr', 'pivoting', 'rank'],
      refs: ['Golub–Van Loan ch. 5'],
      viz(v) {
        const M = v.M, n = 20;
        const S = v.stage({ x: [0.5, n + 0.5], y: [1e-17, 20], ylog: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'column index k', ylabel: 'size' });
        const kind = v.select('matrix', [{ value: 'low', label: 'low rank + noise' }, { value: 'kahan', label: 'Kahan matrix' }], 'low');
        const floorS = v.slider('noise floor', 1e-12, 1e-2, 1e-8, { log: true, sig: 2 });
        const th = v.slider('Kahan $\\theta$', 0.2, 1.4, 0.9, { step: 0.01 });
        const tol = v.slider('rank tolerance $\\tau$', 1e-14, 1, 1e-6, { log: true, sig: 1 });
        let cacheKey = '', cache = null;
        const build = () => {
          if (kind.value === 'low') {
            const r = v.rng(3), m = 30, Un = M.qr(Array.from({ length: m }, () => Array.from({ length: n }, () => r.normal())), { thin: true }).Q, Vn = M.qr(Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()))).Q;
            const sg = Array.from({ length: n }, (_, i) => (i < 5 ? 2 ** (-i * 0.7) : floorS.value * (1 - 0.04 * i)));
            return Un.map((ur) => Vn.map((_, c) => ur.reduce((s, x, j) => s + x * sg[j] * Vn[c][j], 0)));
          }
          const s = Math.sin(th.value), c = Math.cos(th.value);
          return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (s ** i) * (i === j ? 1 : j > i ? -c : 0) * (1 - 1e-9 * j)));
        };
        const run = () => {
          const key = `${kind.value}|${floorS.value}|${th.value}`;
          if (key === cacheKey) return;
          const A = build(), sg = M.svd(A).S, plain = householderQR(A), piv = householderQR(A, { pivot: true });
          const d = (R) => R.slice(0, n).map((r, i) => Math.abs(r[i]));
          cache = { sg, rp: d(plain.R), rv: d(piv.R), swaps: piv.perm.filter((p, i) => p !== i).length }; cacheKey = key;
        };
        th.el.hidden = true;
        const upd = () => { floorS.el.hidden = kind.value !== 'low'; th.el.hidden = kind.value !== 'kahan'; };
        v.render(() => {
          upd(); run();
          const fl = (x) => Math.max(1e-17, x), ks = Array.from({ length: n }, (_, i) => i + 1);
          S.hline(tol.value, { color: 'gold', width: 1.6, dash: true });
          S.path(ks.map((k, i) => [k, fl(cache.sg[i])]), { color: 'muted', width: 2.6 }); S.dots(ks.map((k, i) => [k, fl(cache.sg[i])]), { r: 4, color: 'muted' });
          S.path(ks.map((k, i) => [k, fl(cache.rp[i])]), { color: 'red', width: 2, alpha: 0.9 }); S.dots(ks.map((k, i) => [k, fl(cache.rp[i])]), { r: 3, color: 'red' });
          S.path(ks.map((k, i) => [k, fl(cache.rv[i])]), { color: 'green', width: 2.6 }); S.dots(ks.map((k, i) => [k, fl(cache.rv[i])]), { r: 3.5, color: 'green' });
        });
        v.legend([['muted', 'singular values $\\sigma_k$'], ['red', '$|r_{kk}|$, no pivoting'], ['green', '$|r_{kk}|$, column pivoting'], ['gold', 'tolerance $\\tau$', { dash: true }]]);
        v.readout(() => {
          if (!cache) return '';
          const cnt = (a) => a.filter((x) => x > tol.value).length, nn = cache.rv[n - 1];
          return `Numerical rank at $\\tau=${v.sci(tol.value, 1)}$: from the singular values **${cnt(cache.sg)}**, from pivoted $|r_{kk}|$ **${cnt(cache.rv)}**, from unpivoted **${cnt(cache.rp)}**. Last column: $|r_{nn}|=${v.sci(Math.max(nn, 1e-300), 2)}$ versus $\\sigma_n=${v.sci(Math.max(cache.sg[n - 1], 1e-300), 2)}$ — always $\\sigma_n\\le|r_{nn}|$${cache.sg[n - 1] < 1e-3 * nn ? ', here by a factor ' + v.sci(nn / cache.sg[n - 1], 1) : ''}. Column swaps made: ${cache.swaps}.`;
        });
      },
    },
  ],
};
