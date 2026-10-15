// Rudin, Real and Complex Analysis — Chapter 4: Elementary Hilbert Space Theory
// Part 1: inner products, Schwarz, triangle inequality, Hilbert spaces, continuity (4.1–4.9).

const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** bilinear form y^T A x on R^2 */
const formA = (A, x, y) => y[0] * (A[0][0] * x[0] + A[0][1] * x[1]) + y[1] * (A[1][0] * x[0] + A[1][1] * x[1]);
/** small right-angle marker at p between unit directions u and w (data units) */
function rightAngle(S, p, u, w, size, st = {}) {
  const a = [p[0] + u[0] * size, p[1] + u[1] * size];
  const b = [p[0] + (u[0] + w[0]) * size, p[1] + (u[1] + w[1]) * size];
  const c = [p[0] + w[0] * size, p[1] + w[1] * size];
  S.path([a, b, c], { color: 'muted', width: 1.2, ...st });
}

export default {
  collection: 'rca',
  chapter: 4,
  title: 'Elementary Hilbert Space Theory',
  summary: String.raw`An inner product makes a vector space look like Euclidean space: lengths, angles and orthogonality. From the Schwarz inequality Rudin builds the closest-point theorem for closed convex sets, orthogonal projections onto closed subspaces and the representation of every bounded linear functional as $x\mapsto(x,y)$. Orthonormal sets give Fourier coefficients; Bessel's inequality, the Riesz–Fischer theorem and Parseval's identity identify every Hilbert space with some $\ell^2(A)$, once the Hausdorff maximality theorem supplies maximal orthonormal sets. The chapter ends by proving the trigonometric system complete in $L^2(T)$, which yields the classical theory of Fourier series in $L^2$.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Inner product space',
      statement: String.raw`An *inner product space* (or unitary space) is a complex vector space $H$ together with a rule assigning to each ordered pair $x,y\in H$ a complex number $(x,y)$, the inner product, such that for all $x,y,z\in H$ and all scalars $\alpha$:
(a) $(y,x)=\overline{(x,y)}$;
(b) $(x+y,z)=(x,z)+(y,z)$;
(c) $(\alpha x,y)=\alpha\,(x,y)$;
(d) $(x,x)\ge 0$;
(e) $(x,x)=0$ only for $x=0$.
The *norm* of $x$ is $\|x\|=(x,x)^{1/2}$. Consequences: $(x,\alpha y)=\bar\alpha(x,y)$, $(x,y+z)=(x,y)+(x,z)$ and $\|\alpha x\|=|\alpha|\,\|x\|$.`,
      idea: String.raw`The axioms abstract the dot product of $\C^n$, $(x,y)=\sum x_j\bar y_j$. Axioms (a)–(c) make $(x,y)$ linear in $x$ and conjugate-linear in $y$; (d) and (e) are what turn $(x,x)^{1/2}$ into a genuine length, and every geometric result of the chapter (Schwarz, parallelogram law, closest points) depends on them.`,
      caption: String.raw`A real two-dimensional model: each symmetric matrix $A$ defines $(x,y)=y^{\mathsf T}Ax$ on $\R^2$. Drag $x$ and $y$. For positive definite $A$ the unit sphere is an ellipse, and $y^\perp$ is a line that need not look perpendicular to $y$. The last two choices break the positivity axioms: a nonzero vector of length $0$ appears (e), or $(z,z)$ turns negative in the red cones (d).`,
      deps: [],
      see: ['pma-1.35'],
      tags: ['inner product'],
      viz(v) {
        const M = v.M;
        const FORMS = {
          std: { label: 'dot product', A: [[1, 0], [0, 1]] },
          wt: { label: '$A>0$', A: [[1.5, 0.6], [0.6, 0.7]] },
          deg: { label: 'degenerate', A: [[0.8, 0.4], [0.4, 0.2]] },
          ind: { label: 'indefinite', A: [[1, 0.35], [0.35, -0.5]] },
        };
        const which = v.select('$A$', Object.entries(FORMS).map(([value, F]) => ({ value, label: F.label })), 'wt');
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.75, 1.75], equal: true, height: 360 });
        const hx = S.handle(1.3, -0.35, { color: 'accent', label: 'x' });
        const hy = S.handle(-0.55, 1.05, { color: 'purple', label: 'y' });
        const red = v.rgb('red');
        let st = {};
        v.render(() => {
          const A = FORMS[which.value].A;
          const q = (z) => formA(A, z, z);
          // region where (z,z) < 0
          S.raster((x, y) => (q([x, y]) < -1e-9 ? [red[0], red[1], red[2], 46] : null), { key: which.value, res: 3 });
          // null directions
          const nulls = [];
          const [a, b, d] = [A[0][0], A[0][1], A[1][1]];
          const { values, vectors } = M.eigSym2(A);
          if (Math.abs(values[1]) < 1e-9) nulls.push(vectors[1]);
          else if (values[1] < 0 && Math.abs(d) > 1e-12) {
            const disc = b * b - a * d;
            for (const s of [-1, 1]) nulls.push(M.normalize([1, (-b + s * Math.sqrt(disc)) / d]));
          }
          for (const n of nulls) S.line(-6 * n[0], -6 * n[1], 6 * n[0], 6 * n[1], { color: 'red', width: 1.6, dash: [5, 4] });
          // unit sphere {(z,z)=1} in polar form
          const pts = [];
          for (let i = 0; i <= 1440; i++) {
            const t = M.TAU * i / 1440, u = [Math.cos(t), Math.sin(t)], qq = q(u);
            pts.push(qq > 0.004 ? [u[0] / Math.sqrt(qq), u[1] / Math.sqrt(qq)] : null);
          }
          S.path(pts, { color: 'accent', width: 2.4 });
          // y-perp line: z with (z,y) = 0  <=>  z . (A y) = 0
          const x = [hx.x, hx.y], y = [hy.x, hy.y];
          const Ay = [a * y[0] + b * y[1], b * y[0] + d * y[1]];
          const nAy = Math.hypot(Ay[0], Ay[1]);
          if (nAy > 1e-9) {
            const dir = [-Ay[1] / nAy, Ay[0] / nAy];
            S.line(-6 * dir[0], -6 * dir[1], 6 * dir[0], 6 * dir[1], { color: 'purple', width: 1.5, dash: [7, 5] });
            const lp = dir[1] > 0 ? dir : [-dir[0], -dir[1]];
            S.tex('y^{\\perp}', lp[0] * 1.65, lp[1] * 1.65, { color: 'purple', dx: 14 });
          }
          // projection of x on y in this inner product
          const yy = q(y), xy = formA(A, x, y);
          if (yy > 1e-6) {
            const p = [y[0] * xy / yy, y[1] * xy / yy];
            S.line(-6 * y[0], -6 * y[1], 6 * y[0], 6 * y[1], { color: 'faint', width: 1 });
            S.line(x[0], x[1], p[0], p[1], { color: 'muted', width: 1.4, dash: [3, 3] });
            S.dot(p[0], p[1], { color: 'muted', r: 3.5 });
          }
          S.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.4 });
          S.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2.4 });
          S.dot(0, 0, { color: 'ink', r: 3 });
          const ok = which.value === 'std' || which.value === 'wt';
          S.corner(ok ? 'axioms (a)–(e) hold' : which.value === 'deg' ? 'axiom (e) fails on the red line' : 'axiom (d) fails in the red cones', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          v.legend([['accent', 'unit sphere $\\{z:(z,z)=1\\}$'], ['purple', '$y^{\\perp}=\\{z:(z,y)=0\\}$', { dash: true }], ['red', '$(z,z)\\le 0$, $z\\ne 0$', { area: true }]]);
          st = { xy, yx: formA(A, y, x), xx: q(x), yy, ok, null: nulls[0] };
        });
        v.readout(() => {
          const s = st; if (!s.xy && s.xy !== 0) return '';
          const base = `$(x,y) = ${v.fix(s.xy, 3)} = (y,x)$, $\\;(x,x) = ${v.fix(s.xx, 3)}$, $\\;(y,y) = ${v.fix(s.yy, 3)}$`;
          if (s.ok) return `${base} — so $\\|x\\| = ${v.fix(Math.sqrt(s.xx), 3)}$.`;
          if (which.value === 'deg') return `${base} — but $z = (${v.fix(s.null[0], 2)}, ${v.fix(s.null[1], 2)}) \\ne 0$ has $(z,z) = 0$: not an inner product.`;
          return `${base} — negative values of $(z,z)$ occur, so $(z,z)^{1/2}$ is no length.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Schwarz inequality',
      statement: String.raw`In every inner product space,
$$|(x,y)|\le\|x\|\,\|y\|\qquad(x,y\in H).$$`,
      idea: String.raw`Put $A=\|x\|^2$, $B=|(x,y)|$, $C=\|y\|^2$ and choose $\alpha$ with $|\alpha|=1$ and $\alpha(y,x)=B$. For every real $r$, axiom (d) gives $0\le\|x-r\alpha y\|^2=A-2Br+Cr^2$. A real quadratic that never goes negative has nonpositive discriminant, so $B^2\le AC$ (if $C=0$ the linear function $A-2Br$ is nonnegative for all $r$, forcing $B=0$).`,
      caption: String.raw`Left: drag $x$, $y$ and the gold point $\lambda y$ along the line through $y$. Right: $\varphi(\lambda)=\|x-\lambda y\|^2=\|x\|^2-2\lambda(x,y)+\lambda^2\|y\|^2$ is the squared distance from $x$ to $\lambda y$. It never dips below $0$, so its discriminant is $\le0$ — exactly the Schwarz inequality; the minimum sits at the foot of the perpendicular. The Minkowski form $x_1y_1-x_2y_2$ violates axiom (d): the parabola crosses into the red zone and the inequality fails.`,
      deps: ['rca-4.1'],
      see: ['pma-1.35', 'rca-3.5'],
      tags: ['inequality', 'inner product'],
      viz(v) {
        const M = v.M;
        const mode = v.select('form', [{ value: 'euc', label: 'inner product $x_1y_1+x_2y_2$' }, { value: 'mink', label: 'Minkowski $x_1y_1-x_2y_2$ (fails (d))' }], 'euc');
        const L = v.stage({ x: [-2.4, 2.4], y: [-1.8, 1.8], equal: true, height: 340, title: 'the plane: $x$, $y$ and the points $\\lambda y$' });
        const R = v.stage({ x: [-1, 3], y: [-0.5, 5], height: 340, axes: true, xlabel: 'λ', title: '$\\varphi(\\lambda)=(x-\\lambda y,\\,x-\\lambda y)$' });
        const hx = L.handle(1.3, 1.0, { color: 'accent', label: 'x' });
        const hy = L.handle(1.4, -0.35, { color: 'purple', label: 'y', constrain: (x, y) => { const n = Math.hypot(x, y); return n < 0.45 ? [x / n * 0.45, y / n * 0.45] : [x, y]; } });
        let lam = 0.35;
        const hl = L.handle(lam * hy.x, lam * hy.y, {
          color: 'gold', r: 6,
          constrain: (px, py) => { const yv = [hy.x, hy.y]; lam = dot2([px, py], yv) / dot2(yv, yv); return [lam * yv[0], lam * yv[1]]; },
        });
        let st = {};
        v.render(() => {
          const mink = mode.value === 'mink';
          const ip = mink ? (a, b) => a[0] * b[0] - a[1] * b[1] : dot2;
          const x = [hx.x, hx.y], y = [hy.x, hy.y];
          hl.x = lam * y[0]; hl.y = lam * y[1];
          const A = ip(x, x), B = ip(x, y), C = ip(y, y);
          const phi = (t) => A - 2 * B * t + C * t * t;
          // ----- left panel
          if (mink) { L.line(-5, -5, 5, 5, { color: 'red', width: 1.2, dash: [5, 4], alpha: 0.7 }); L.line(-5, 5, 5, -5, { color: 'red', width: 1.2, dash: [5, 4], alpha: 0.7 }); }
          L.line(-8 * y[0], -8 * y[1], 8 * y[0], 8 * y[1], { color: 'faint', width: 1.2 });
          const q = [lam * y[0], lam * y[1]];
          const pq = phi(lam);
          L.line(x[0], x[1], q[0], q[1], { color: pq < 0 ? 'red' : 'gold', width: 2.2 });
          if (!mink) {
            const l0 = B / C, p = [l0 * y[0], l0 * y[1]];
            L.line(x[0], x[1], p[0], p[1], { color: 'green', width: 1.6, dash: [4, 3] });
            const uy = M.normalize(y), r = M.vsub(x, p), nr = Math.hypot(r[0], r[1]);
            if (nr > 0.08) rightAngle(L, p, M.vscale(uy, Math.sign(-l0 || 1) * 1), M.vscale(r, 1 / nr), 0.13);
            L.dot(p[0], p[1], { color: 'green', r: 4 });
            L.tex('\\lambda_0 y', p[0], p[1], { color: 'green', dx: -6, dy: 8, align: 'right', baseline: 'top', size: 14 });
          }
          L.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2.4 });
          L.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // ----- right panel: view
          const lam0 = Math.abs(C) > 1e-6 ? B / C : 0;
          const w = Math.max(1.3, Math.abs(lam - lam0) + 0.35);
          let lo = Math.min(lam0 - w, -0.3), hi = Math.max(lam0 + w, 0.3);
          if (mink) { lo = Math.min(-2.5, lam - 0.4); hi = Math.max(2.5, lam + 0.4); }
          let ymin = 0, ymax = 0.5;
          for (let i = 0; i <= 200; i++) { const f = phi(lo + (hi - lo) * i / 200); ymin = Math.min(ymin, f); ymax = Math.max(ymax, f); }
          ymax = Math.min(ymax, Math.max(A, 1) * 6); ymin = Math.max(ymin, -Math.max(A, 1) * 6);
          const pad = (ymax - ymin) * 0.1;
          R.setView([lo, hi], [Math.min(ymin - pad, -0.2 * ymax), ymax + pad]);
          R.hband(ymin - 10 * pad - 100, 0, { color: 'red', alpha: 0.1 });
          R.fn(phi, { color: 'accent', width: 2.6 });
          if (!mink || C > 1e-6) {
            const mn = phi(lam0);
            R.dot(lam0, mn, { color: mn < -1e-9 ? 'red' : 'green', r: 5.5 });
            R.tex(mn < -1e-9 ? '\\min\\varphi<0' : '\\min\\varphi\\ge 0', lam0, mn, { color: mn < -1e-9 ? 'red' : 'green', baseline: mn < -1e-9 ? 'bottom' : 'top', dy: mn < -1e-9 ? -9 : 9, size: 14 });
          }
          R.line(lam, 0, lam, pq, { color: 'gold', width: 1.2, dash: [3, 3] });
          R.dot(lam, pq, { color: 'gold', r: 5 });
          st = { A, B, C, mink, lam, pq };
        });
        v.readout(() => {
          const s = st; if (s.A == null) return '';
          if (!s.mink) return `$|(x,y)| = ${v.fix(Math.abs(s.B), 3)} \\le \\|x\\|\\,\\|y\\| = ${v.fix(Math.sqrt(s.A * s.C), 3)}$; $\\;$ discriminant $4\\big((x,y)^2-\\|x\\|^2\\|y\\|^2\\big) = ${v.fix(4 * (s.B * s.B - s.A * s.C), 3)} \\le 0$; $\\;\\varphi(\\lambda) = ${v.fix(s.pq, 3)}$ at the gold point.`;
          const fails = s.B * s.B > s.A * s.C + 1e-9;
          return `$(x,y)^2 = ${v.fix(s.B * s.B, 3)}$ versus $(x,x)(y,y) = ${v.fix(s.A * s.C, 3)}$ — ` + (fails ? '**the inequality fails**: without axiom (d) the quadratic can go negative.' : 'holds here, but drag $x$ and $y$ inside the same pair of red cones and it fails.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Triangle inequality',
      statement: String.raw`For all $x,y$ in an inner product space $H$,
$$\|x+y\|\le\|x\|+\|y\| .$$
Consequently $d(x,y)=\|x-y\|$ is a metric on $H$: it satisfies $d(x,z)\le d(x,y)+d(y,z)$, and $H$ becomes a metric space.`,
      idea: String.raw`Expand: $\|x+y\|^2=\|x\|^2+(x,y)+(y,x)+\|y\|^2=\|x\|^2+2\Re(x,y)+\|y\|^2$. By the Schwarz inequality (4.2), $2\Re(x,y)\le2|(x,y)|\le2\|x\|\|y\|$, so the right side is at most $(\|x\|+\|y\|)^2$. Replacing $x,y$ by $x-y$, $y-z$ gives the metric triangle inequality.`,
      caption: String.raw`Drag $x$ and $y$. The bars expand $\|x+y\|^2$ and $(\|x\|+\|y\|)^2$ term by term: the only difference is the gold middle term, $2\Re(x,y)$ versus $2\|x\|\|y\|$, and Schwarz says the first never exceeds the second. Equality — zero slack — happens only when $y$ points in the same direction as $x$.`,
      deps: ['rca-4.2'],
      see: ['pma-1.37', 'rca-3.5'],
      tags: ['inequality', 'metric'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.2, 3.4], y: [-1.6, 2.4], equal: true, height: 330, minWidth: 300, title: 'the vectors $x$, $y$ and $x+y$' });
        const R = v.stage({ x: [-1, 10], y: [0, 3], height: 330, axes: false, minWidth: 300, title: 'the two squares, term by term' });
        const hx = L.handle(1.6, 0.5, { color: 'accent', label: 'x' });
        const hy = L.handle(0.4, 1.3, { color: 'purple', label: 'y', labelPos: 'nw' });
        let st = {};
        v.render(() => {
          const x = [hx.x, hx.y], y = [hy.x, hy.y], s = M.vadd(x, y);
          const nx = Math.hypot(...x), ny = Math.hypot(...y), ns = Math.hypot(...s), ip = dot2(x, y);
          // parallelogram
          L.poly([[0, 0], x, s, y], { fill: 'green', fillAlpha: 0.06, color: 'faint', width: 1 });
          L.arrow(x[0], x[1], s[0], s[1], { color: 'purple', width: 1.6, dash: [5, 4], alpha: 0.75 });
          L.arrow(0, 0, s[0], s[1], { color: 'green', width: 2.6 });
          L.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.4 });
          L.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          L.tex('x+y', s[0], s[1], { color: 'green', dx: 8, dy: -10, align: 'left' });
          // bars
          const a = nx * nx, c = ny * ny, T1 = ns * ns, T2 = (nx + ny) ** 2;
          const T = Math.max(T2, 0.6);
          R.setView([-0.1 * T, 1.08 * T], [0, 3]);
          const h = 0.42;
          const row = (yc, mid, lab, midLab) => {
            R.rect(0, yc - h / 2, a, yc + h / 2, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.2 });
            const m0 = a, m1 = a + mid;
            R.rect(Math.min(m0, m1), yc - h / 2 - 0.06, Math.max(m0, m1), yc + h / 2 + 0.06, { fill: 'gold', fillAlpha: mid < 0 ? 0.18 : 0.4, color: 'gold', width: 1.4, dash: mid < 0 ? [4, 3] : null });
            R.rect(m1, yc - h / 2, m1 + c, yc + h / 2, { fill: 'purple', fillAlpha: 0.3, color: 'purple', width: 1.2 });
            const tot = a + mid + c;
            R.line(tot, yc - 0.42, tot, yc + 0.42, { color: 'ink', width: 2 });
            R.tex(lab, 0, yc + h / 2 + 0.1, { align: 'left', baseline: 'bottom', size: 14 });
            const px = R.scale;
            if (Math.abs(mid) * px > 46) R.tex(midLab, (m0 + m1) / 2, yc - h / 2 - 0.1, { color: 'gold', baseline: 'top', size: 13 });
            if (a * px > 38) R.tex('\\|x\\|^2', a / 2, yc, { color: 'ink', size: 14 });
            if (c * px > 38) R.tex('\\|y\\|^2', m1 + c / 2, yc, { color: 'ink', size: 14 });
            return tot;
          };
          row(2.15, 2 * ip, '\\|x+y\\|^2', '2\\Re(x,y)');
          row(0.75, 2 * nx * ny, '(\\|x\\|+\\|y\\|)^2', '2\\|x\\|\\|y\\|');
          R.line(T1, 2.15 - 0.42, T1, 0.75 + 0.42, { color: 'muted', width: 1, dash: [3, 3] });
          if ((T2 - T1) * R.scale > 18) { R.measure(T1, 1.45, T2, 1.45, '', { color: 'red' }); R.text('gap', (T1 + T2) / 2, 1.45, { color: 'red', dy: -11, align: 'center', size: 11.5 }); }
          st = { nx, ny, ns, ip };
        });
        v.readout(() => {
          const s = st; if (s.nx == null) return '';
          return `$\\|x+y\\| = ${v.fix(s.ns, 3)} \\;\\le\\; \\|x\\|+\\|y\\| = ${v.fix(s.nx + s.ny, 3)}$; $\\;$ slack $= ${v.fix(s.nx + s.ny - s.ns, 3)}$, $\\;2(x,y) = ${v.fix(2 * s.ip, 3)} \\le 2\\|x\\|\\|y\\| = ${v.fix(2 * s.nx * s.ny, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Hilbert space',
      statement: String.raw`An inner product space $H$ is a *Hilbert space* if it is complete in the metric $d(x,y)=\|x-y\|$ of 4.3, i.e. every Cauchy sequence in $H$ converges to a point of $H$.`,
      idea: String.raw`Completeness is what makes limits available: minimizing sequences in the closest-point theorem (4.10) and partial sums $\sum\hat x(\alpha)u_\alpha$ (4.17) converge only because $H$ is complete. The prototype is $L^2(\mu)$, complete by 3.11; finite-dimensional spaces $\C^n$ and $\ell^2$ are special cases.`,
      caption: String.raw`The ramps $g_n(t)=\max(-1,\min(1,nt))$ are continuous on $[-1,1]$. Choose $n$ and $m$: the shaded area shows $|g_n-g_m|$, and $\|g_n-g_m\|_2\to0$ — a Cauchy sequence in the inner product $\int f\bar g$. Its only possible limit is $\operatorname{sgn}t$, which is not continuous; the uniform distance stays $1$. So $C[-1,1]$ is an inner product space but not a Hilbert space; inside $L^2[-1,1]$ the limit exists.`,
      deps: ['rca-4.3'],
      see: ['pma-3.12', 'rca-3.11'],
      tags: ['completeness', 'Hilbert space'],
      viz(v) {
        const M = v.M;
        const space = v.select('space', [{ value: 'C', label: '$C[-1,1]$' }, { value: 'L2', label: '$L^2[-1,1]$' }], 'C');
        const n = v.slider('$n$', 1, 60, 4, { int: true });
        const m = v.slider('$m$', 1, 60, 12, { int: true });
        const T = v.stage({ x: [-1.16, 1.06], y: [-1.3, 1.3], height: 280, full: true, axes: 'box', yticks: [-1, 0, 1] });
        const B = v.stage({ x: [-3, 62], y: [-0.05, 1.12], height: 200, axes: 'box', full: true, yticks: [0, 0.5, 1], xticks: [1, 10, 20, 30, 40, 50, 60], title: 'distances as $N$ grows' });
        const g = (k) => (t) => M.clamp(k * t, -1, 1);
        const l2 = (f, h) => Math.sqrt(M.integrate((t) => (f(t) - h(t)) ** 2, -1, 1, 3000));
        let st = {};
        v.render(() => {
          const gn = g(n.value), gm = g(m.value), inL2 = space.value === 'L2';
          T.between(gn, gm, -1, 1, { fill: 'orange', fillAlpha: 0.25, n: 600 });
          T.line(-1, 0, 1, 0, { color: 'faint', width: 1 });
          T.fn(gm, { color: 'orange', width: 2.2, n: 800, domain: [-1, 1] });
          T.fn(gn, { color: 'gold', width: 2.6, n: 800, domain: [-1, 1] });
          const lc = inL2 ? 'green' : 'red';
          T.line(-1, -1, 0, -1, { color: lc, width: 2.4, dash: [7, 6] });
          T.line(0, 1, 1, 1, { color: lc, width: 2.4, dash: [7, 6] });
          T.dot(0, -1, { color: lc, hollow: true, r: 4.5 });
          T.dot(0, 1, { color: lc, hollow: true, r: 4.5 });
          T.dot(0, 0, { color: lc, r: 4 });
          T.tex('g_n', 1 / n.value + 0.02, 0.62, { color: 'gold', align: 'left' });
          T.tex('\\operatorname{sgn}', 0.62, 1.12, { color: inL2 ? 'green' : 'red' });
          T.corner(inL2 ? 'limit sgn ∈ L²[−1,1] — the sequence converges' : 'limit sgn ∉ C[−1,1] — Cauchy but not convergent', 'tl', { color: inL2 ? 'green' : 'red', weight: 600 });
          // bottom: distances vs N
          B.line(1, 1, 60, 1, { color: 'red', width: 2, alpha: 0.8 });
          B.path(M.range(60, 1).map((N) => [N, Math.sqrt(2 / (3 * N))]), { color: 'green', width: 2 });
          B.dots(M.range(60, 1).map((N) => [N, Math.sqrt(2 / (3 * N))]), { color: 'green', r: 2.4 });
          B.path(M.range(60, 1).map((N) => [N, l2(gn, g(N))]), { color: 'orange', width: 2 });
          B.vline(n.value, { color: 'gold', width: 1.2, dash: [3, 3] });
          B.tex('\\|g_N-\\operatorname{sgn}\\|_\\infty=1', 60, 1, { color: 'red', align: 'right', baseline: 'top', dy: 6, size: 13 });
          B.tex('\\|g_N-\\operatorname{sgn}\\|_2\\to0', 60, Math.sqrt(2 / 180), { color: 'green', align: 'right', baseline: 'bottom', dy: -6, size: 13 });
          B.tex('\\|g_n-g_N\\|_2', 60, l2(gn, g(60)), { color: 'orange', align: 'right', baseline: 'bottom', dy: -6, size: 13 });
          B.tex('N', 61.5, -0.05, { color: 'muted', align: 'right', baseline: 'bottom', dy: -2, size: 13 });
          const dnm = l2(gn, gm);
          B.dot(m.value, dnm, { color: 'orange', r: 5.5 });
          v.legend([['gold', '$g_n$'], ['orange', '$g_m$ and $|g_n-g_m|$'], [inL2 ? 'green' : 'red', '$\\operatorname{sgn}t$', { dash: true }]]);
          st = { dnm, dn: Math.sqrt(2 / (3 * n.value)), inL2 };
        });
        v.readout(() => {
          const s = st; if (s.dnm == null) return '';
          return `$\\|g_n-g_m\\|_2 = ${v.fix(s.dnm, 4)}$, $\\;\\|g_n-\\operatorname{sgn}\\|_2 = \\sqrt{2/(3n)} = ${v.fix(s.dn, 4)}$, but $\\sup_t|g_n(t)-\\operatorname{sgn}t| = 1$. ` + (s.inL2 ? 'In $L^2$ the Cauchy sequence has a limit (3.11).' : 'No continuous function is the limit: $C[-1,1]$ is incomplete.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Inner product and norm are continuous',
      statement: String.raw`Let $H$ be an inner product space and fix $y\in H$. Then the maps
$$x\mapsto(x,y),\qquad x\mapsto(y,x),\qquad x\mapsto\|x\|$$
are continuous on $H$; in fact $|(x_1,y)-(x_2,y)|\le\|x_1-x_2\|\,\|y\|$ and $\big|\|x_1\|-\|x_2\|\big|\le\|x_1-x_2\|$.`,
      idea: String.raw`By linearity and Schwarz (4.2), $|(x_1,y)-(x_2,y)|=|(x_1-x_2,y)|\le\|x_1-x_2\|\|y\|$, a Lipschitz bound; the second map is the complex conjugate of the first. The triangle inequality (4.3) gives $\|x_1\|\le\|x_1-x_2\|+\|x_2\|$ and the same with the roles exchanged.`,
      caption: String.raw`Drag $x$, $y$ and change the radius $\delta$. The lines are level sets of $z\mapsto(z,y)$, crowded together in proportion to $\|y\|$; the ball $B(x,\delta)$ always fits inside the orange slab where $(z,y)$ differs from $(x,y)$ by at most $\delta\|y\|$, and inside the teal annulus where $\|z\|$ differs from $\|x\|$ by at most $\delta$. The right panel compares the actual ranges over the ball (sampled) with these bounds.`,
      deps: ['rca-4.2', 'rca-4.3'],
      tags: ['continuity', 'inner product'],
      viz(v) {
        const M = v.M;
        const dl = v.slider('$\\delta$', 0.05, 0.8, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-2.8, 2.8], y: [-2.1, 2.1], equal: true, height: 350, minWidth: 300, title: 'level lines of $z\\mapsto(z,y)$ and the ball $B(x,\\delta)$' });
        const R = v.stage({ x: [-2.6, 2.6], y: [0, 2.2], height: 350, axes: false, minWidth: 300, title: 'ranges over the ball $B(x,\\delta)$' });
        const hx = L.handle(1.0, 0.7, { color: 'accent', label: 'x' });
        const hy = L.handle(0.9, -0.9, { color: 'purple', label: 'y', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.3 ? [x / r * 0.3, y / r * 0.3] : r > 2.4 ? [x / r * 2.4, y / r * 2.4] : [x, y]; } });
        let st = {};
        v.render(() => {
          const x = [hx.x, hx.y], y = [hy.x, hy.y], d = dl.value;
          const ny = Math.hypot(...y), u = [y[0] / ny, y[1] / ny], t = [-u[1], u[0]];
          const val = dot2(x, y), nx = Math.hypot(...x);
          // annulus for the norm
          L.rings([M.range(181).map((i) => [(nx + d) * Math.cos(i * M.TAU / 180), (nx + d) * Math.sin(i * M.TAU / 180)]),
            M.range(181).map((i) => [Math.max(0, nx - d) * Math.cos(i * M.TAU / 180), Math.max(0, nx - d) * Math.sin(i * M.TAU / 180)])], { fill: 'teal', fillAlpha: 0.1, evenodd: true, stroke: false });
          L.circle(0, 0, nx + d, { color: 'teal', width: 1, dash: [4, 4] });
          if (nx > d) L.circle(0, 0, nx - d, { color: 'teal', width: 1, dash: [4, 4] });
          // level lines of (z,y): spacing 0.4 in value -> 0.4/|y| in distance
          const step = 0.4;
          for (let k = -30; k <= 30; k++) {
            const c = k * step, p = M.vscale(u, c / ny);
            L.line(p[0] - t[0] * 9, p[1] - t[1] * 9, p[0] + t[0] * 9, p[1] + t[1] * 9, { color: k === 0 ? 'muted' : 'faint', width: k === 0 ? 1.4 : 1 });
          }
          // slab (x,y) ± δ|y|
          const lo = M.vscale(u, (val - d * ny) / ny), hi = M.vscale(u, (val + d * ny) / ny);
          L.poly([M.vadd(lo, M.vscale(t, 9)), M.vadd(hi, M.vscale(t, 9)), M.vadd(hi, M.vscale(t, -9)), M.vadd(lo, M.vscale(t, -9))], { fill: 'orange', fillAlpha: 0.16, stroke: false });
          for (const p of [lo, hi]) L.line(p[0] - t[0] * 9, p[1] - t[1] * 9, p[0] + t[0] * 9, p[1] + t[1] * 9, { color: 'orange', width: 1.4, dash: [5, 4] });
          L.circle(x[0], x[1], d, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.8 });
          L.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // sampled ranges over the ball
          let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
          for (let i = 0; i < 360; i++) for (const r of [d, d * 0.5]) {
            const z = [x[0] + r * Math.cos(i * M.TAU / 360), x[1] + r * Math.sin(i * M.TAU / 360)];
            const f = dot2(z, y) - val, g = Math.hypot(...z) - nx;
            a0 = Math.min(a0, f); a1 = Math.max(a1, f); b0 = Math.min(b0, g); b1 = Math.max(b1, g);
          }
          const span = Math.max(1, d * ny * 1.3, d * 1.3);
          R.setView([-span, span], [0, 2.2]);
          const bar = (yc, lo2, hi2, bnd, col, lab, bndLab) => {
            R.line(-span * 2, yc, span * 2, yc, { color: 'faint', width: 1 });
            R.rect(-bnd, yc - 0.17, bnd, yc + 0.17, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.2, dash: [4, 3] });
            R.line(lo2, yc, hi2, yc, { color: col, width: 7, cap: 'butt' });
            R.dot(0, yc, { color: 'ink', r: 3 });
            R.tex(lab, -span * 0.95, yc + 0.42, { align: 'left', size: 13.5 });
            R.tex(bndLab[0], -bnd, yc - 0.17, { color: 'orange', baseline: 'top', dy: 4, size: 12.5 });
            R.tex(bndLab[1], bnd, yc - 0.17, { color: 'orange', baseline: 'top', dy: 4, size: 12.5 });
          };
          bar(1.45, a0, a1, d * ny, 'accent', '(z,y)-(x,y)', ['-\\delta\\|y\\|', '\\delta\\|y\\|']);
          bar(0.45, b0, b1, d, 'teal', '\\|z\\|-\\|x\\|', ['-\\delta', '\\delta']);
          v.legend([['accent', 'ball $B(x,\\delta)$', { area: true }], ['orange', 'slab $|(z,y)-(x,y)|\\le\\delta\\|y\\|$', { area: true }], ['teal', 'annulus $|\\|z\\|-\\|x\\||\\le\\delta$', { area: true }]]);
          st = { a0, a1, b0, b1, d, ny };
        });
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          return `over the ball: $\\max|(z,y)-(x,y)| = ${v.fix(Math.max(-s.a0, s.a1), 3)} \\le \\delta\\|y\\| = ${v.fix(s.d * s.ny, 3)}$ and $\\max\\big|\\|z\\|-\\|x\\|\\big| = ${v.fix(Math.max(-s.b0, s.b1), 3)} \\le \\delta = ${v.fix(s.d, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Subspaces and closed subspaces',
      statement: String.raw`A subset $M$ of a vector space $V$ is a *subspace* if it is itself a vector space under the operations of $V$, i.e. $x+y\in M$ and $\alpha x\in M$ whenever $x,y\in M$ and $\alpha$ is a scalar. If $V$ carries a metric (for instance $V=H$ an inner product space), a subspace that is a closed set is a *closed subspace*. The closure of a subspace of $H$ is again a (closed) subspace.`,
      idea: String.raw`Closedness is the extra hypothesis that makes the projection theorem (4.11) work in infinite dimensions. Finite-dimensional subspaces are automatically closed, but e.g. the polynomials form a non-closed subspace of $L^2[0,1]$. The closure claim follows from continuity of addition and scalar multiplication in the norm.`,
      deps: ['rca-4.4'],
      tags: ['subspace'],
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Convex sets',
      statement: String.raw`A subset $E$ of a vector space is *convex* if $(1-t)x+ty\in E$ whenever $x,y\in E$ and $0<t<1$; that is, $E$ contains every segment joining two of its points. Every subspace is convex, and every translate $E+x$ of a convex set $E$ is convex.`,
      idea: String.raw`Convexity is exactly what is needed in 4.10: the midpoint of two near-minimizers stays in the set, and the parallelogram law then forces the two to be close.`,
      deps: ['rca-4.1'],
      see: ['fa-3.4'],
      tags: ['convexity'],
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Orthogonality and orthogonal complements',
      statement: String.raw`Vectors $x,y$ of an inner product space $H$ are *orthogonal*, $x\perp y$, if $(x,y)=0$ (then also $y\perp x$). For $x\in H$ let $x^\perp=\{y\in H:(x,y)=0\}$, and for a subspace $M$ let $M^\perp=\{y\in H: (x,y)=0\text{ for all }x\in M\}$. Each $x^\perp$ is a closed subspace of $H$, being the null space of the continuous linear functional $y\mapsto(y,x)$, and $M^\perp=\bigcap_{x\in M}x^\perp$ is therefore also a closed subspace.`,
      idea: String.raw`Continuity of $y\mapsto(y,x)$ (4.6) makes its null space closed, and an intersection of closed subspaces is a closed subspace. Note that $M^\perp$ is closed even when $M$ is not; and $M\cap M^\perp=\{0\}$ because $(x,x)=0$ forces $x=0$.`,
      deps: ['rca-4.1', 'rca-4.6', 'rca-4.7'],
      tags: ['orthogonality'],
    },
  ],
};
