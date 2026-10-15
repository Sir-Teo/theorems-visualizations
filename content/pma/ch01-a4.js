// Rudin, Principles of Mathematical Analysis — Chapter 1 (part 4): absolute value, Schwarz inequality, Euclidean spaces

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const annulus = (rmin, rmax) => (x, y) => { const r = Math.hypot(x, y) || 1e-9; const t = Math.min(rmax, Math.max(rmin, r)) / r; return [x * t, y * t]; };

export default {
  collection: 'pma',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.33
    {
      num: '1.33',
      kind: 'Theorem',
      name: 'Properties of |z|; the triangle inequality',
      statement: String.raw`For complex numbers $z$ and $w$:
(a) $|z|>0$ unless $z=0$, and $|0|=0$;
(b) $|\bar z|=|z|$;
(c) $|zw|=|z|\,|w|$;
(d) $|\Re z|\le|z|$;
(e) $|z+w|\le|z|+|w|$ (the **triangle inequality**).`,
      idea: String.raw`(a) and (b) are immediate from $|z|^2=a^2+b^2$. For (c), $|zw|^2=(zw)(\overline{zw})=(z\bar z)(w\bar w)=|z|^2|w|^2$, and uniqueness of square roots (the corollary 1.21a) gives $|zw|=|z||w|$. (d) is $a^2\le a^2+b^2$. For (e), expand
$$|z+w|^2=(z+w)(\bar z+\bar w)=|z|^2+2\Re(z\bar w)+|w|^2,$$
then use $\Re(z\bar w)\le|z\bar w|=|z|\,|w|$ (by (d), (c), (b)) to get $|z+w|^2\le(|z|+|w|)^2$.`,
      caption: String.raw`Drag $z$ and $w$. Left: the triangle with sides $|z|$, $|w|$ and $|z+w|$. Right: the single number $z\bar w$. Its real part (purple, the projection onto the real axis) never exceeds its distance $|z\bar w|=|z|\,|w|$ from $0$ (green), and twice the red gap is exactly $(|z|+|w|)^2-|z+w|^2$. Point $z$ and $w$ the same way to close the gap: equality.`,
      deps: ['pma-1.32', 'pma-1.31', 'pma-1.21a'],
      tags: ['complex numbers', 'absolute value', 'inequalities'],
      viz(v) {
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.0, 2.0], equal: true, height: 360, grid: true, title: 'the triangle $0,\\ z,\\ z+w$' });
        const R = v.stage({ x: [-3.1, 3.1], y: [-3.1, 3.1], equal: true, height: 360, grid: true, title: 'the number $z\\bar w$' });
        const Z = L.handle(1.5, 0.3, { color: 'accent', label: 'z', constrain: annulus(0, 1.7) });
        const W = L.handle(0.4, 1.3, { color: 'orange', label: 'w', constrain: annulus(0, 1.7) });
        let st = {};
        v.render(() => {
          const z = new v.Cx(Z.x, Z.y), w = new v.Cx(W.x, W.y), S = z.add(w), p = z.mul(w.conj());
          const nz = z.abs(), nw = w.abs(), ns = S.abs();
          // left: triangle
          L.line(0, 0, w.re, w.im, { color: 'orange', width: 1.2, dash: [4, 4], alpha: 0.6 });
          L.poly([[0, 0], [z.re, z.im], [S.re, S.im]], { fill: 'green', fillAlpha: 0.08, stroke: false });
          L.arrow(0, 0, z.re, z.im, { color: 'accent', width: 2.4 });
          L.arrow(z.re, z.im, S.re, S.im, { color: 'orange', width: 2.4 });
          L.arrow(0, 0, S.re, S.im, { color: 'green', width: 2.8 });
          L.dot(S.re, S.im, { color: 'green', r: 5, label: 'z+w', labelPos: 'ne' });
          const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const lab = (a, b, t, col, side) => { const m = mid(a, b), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.tex(t, m[0] - side * dy / l * 0.3, m[1] + side * dx / l * 0.3, { color: col, size: 13 }); };
          const orient = Math.sign(z.re * S.im - z.im * S.re) || 1;
          lab([0, 0], [z.re, z.im], '|z|', 'accent', -orient);
          lab([z.re, z.im], [S.re, S.im], '|w|', 'orange', -orient);
          lab([0, 0], [S.re, S.im], '|z+w|', 'green', orient);
          L.dot(0, 0, { color: 'ink', r: 3 });
          // right: z w̄, its modulus and its real part
          const r = p.abs();
          R.circle(0, 0, r, { color: 'green', width: 1.4, dash: [5, 4] });
          R.line(0, 0, p.re, p.im, { color: 'purple', width: 1.6 });
          R.line(p.re, p.im, p.re, 0, { color: 'purple', width: 1.2, dash: [3, 3] });
          R.line(p.re, 0, r, 0, { color: 'red', width: 5, cap: 'butt', alpha: 0.75 });
          R.dot(p.re, p.im, { color: 'purple', r: 5.5, label: 'z\\bar w', tex: true, labelPos: p.im >= 0 ? 'ne' : 'se' });
          R.dot(p.re, 0, { color: 'purple', r: 5 });
          R.dot(r, 0, { color: 'green', r: 5 });
          R.tex('\\Re(z\\bar w)', p.re, 0, { dy: p.im >= 0 ? 16 : -16, color: 'purple', size: 13 });
          R.tex('|z\\bar w|', r, 0, { dy: p.im >= 0 ? 16 : -16, dx: 8, align: 'left', color: 'green', size: 13 });
          R.dot(0, 0, { color: 'ink', r: 3 });
          st = { nz, nw, ns, re: p.re, r, zw: z.mul(w).abs() };
          v.legend([['accent', '$z$'], ['orange', '$w$'], ['green', '$z+w$; circle $|z\\bar w|=|z||w|$'], ['purple', '$z\\bar w$ and its real part'], ['red', 'the gap $|z\\bar w|-\\Re(z\\bar w)\\ge0$']]);
        });
        v.readout(() => {
          const { nz, nw, ns, re, r, zw } = st, f = (t) => fx(t, 3);
          return `$|z+w|^2 = |z|^2 + 2\\Re(z\\bar w) + |w|^2 = ${f(nz * nz)} + ${f(2 * re)} + ${f(nw * nw)} = ${f(ns * ns)}$ $\\;\\le\\;$ $${f(nz * nz)} + ${f(2 * r)} + ${f(nw * nw)} = (|z|+|w|)^2 = ${f((nz + nw) ** 2)}$. So $|z+w| = ${f(ns)} \\le |z|+|w| = ${f(nz + nw)}$. Also (c): $|zw| = ${f(zw)} = |z|\\,|w|$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.35
    {
      num: '1.35',
      kind: 'Theorem',
      name: 'Schwarz inequality',
      statement: String.raw`If $a_1,\dots,a_n$ and $b_1,\dots,b_n$ are complex numbers, then
$$\Big|\sum_{j=1}^n a_j\bar b_j\Big|^2\le\sum_{j=1}^n|a_j|^2\,\sum_{j=1}^n|b_j|^2 .$$`,
      idea: String.raw`Put $A=\sum|a_j|^2$, $B=\sum|b_j|^2$, $C=\sum a_j\bar b_j$. If $B=0$ every $b_j$ is $0$ and both sides vanish. Otherwise expand a sum of squares:
$$0\le\sum_{j}|Ba_j-Cb_j|^2=B^2A-B|C|^2=B\,(AB-|C|^2),$$
and divide by $B>0$. Seen differently: among all multiples $\lambda b$, the one closest to $a$ is $\lambda=C/B$, and the remaining error $\sum_j|a_j-\lambda b_j|^2=(AB-|C|^2)/B$ cannot be negative.`,
      caption: String.raw`Right: drag the components $a_1,a_2,a_3$ (blue) and $b_1,b_2,b_3$ (orange) of two vectors in $\C^3$; hollow green points are the best approximations $\lambda^*b_j$. Left: the error $\sum_j|a_j-\lambda b_j|^2$ over the $\lambda$-plane (dark = small). Its lowest point is $\lambda^*=C/B$, where the error equals $(AB-|C|^2)/B\ge0$. Drag $\lambda$ to probe; press the button to make $a$ a multiple of $b$, and the minimum drops to $0$ — the case of equality.`,
      deps: ['pma-1.31', 'pma-1.33'],
      see: ['rca-3.5', 'rca-4.2'],
      tags: ['inequalities', 'complex numbers'],
      viz(v) {
        const Cx = v.Cx;
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 370, title: 'error $\\sum_j|a_j-\\lambda b_j|^2$ over the $\\lambda$-plane' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 370, grid: true, title: 'components $a_j$, $b_j$ in $\\C$' });
        const A0 = [[1.3, 0.9], [-0.5, 1.4], [0.6, -1.1]], B0 = [[1.5, -0.2], [0.3, 1.2], [-0.9, -0.6]];
        const ah = A0.map(([x, y], j) => R.handle(x, y, { color: 'accent', label: `a${j + 1}`, r: 6.5 }));
        const bh = B0.map(([x, y], j) => R.handle(x, y, { color: 'orange', label: `b${j + 1}`, r: 6.5 }));
        const lam = L.handle(0.4, 0.9, { color: 'gold', label: 'λ' });
        v.button('make $a$ a multiple of $b$', () => { const mu = new Cx(0.55, 0.45); bh.forEach((h, j) => { const q = new Cx(h.x, h.y).mul(mu); ah[j].x = v.M.clamp(q.re, -2.1, 2.1); ah[j].y = v.M.clamp(q.im, -2.1, 2.1); }); });
        v.button('reset', () => { A0.forEach(([x, y], j) => { ah[j].x = x; ah[j].y = y; }); B0.forEach(([x, y], j) => { bh[j].x = x; bh[j].y = y; }); });
        let st = {};
        v.render(() => {
          const a = ah.map((h) => new Cx(h.x, h.y)), b = bh.map((h) => new Cx(h.x, h.y));
          const A = a.reduce((s, z) => s + z.abs2(), 0), B = b.reduce((s, z) => s + z.abs2(), 0);
          const C = a.reduce((s, z, j) => s.add(z.mul(b[j].conj())), new Cx(0, 0));
          const err = (l) => a.reduce((s, z, j) => s + z.sub(l.mul(b[j])).abs2(), 0);
          const ok = B > 1e-12, ls = ok ? C.div(new Cx(B, 0)) : new Cx(0, 0);
          const span = Math.max(2.2, ls.abs() * 1.5);
          L.setView([-span, span], [-span, span]);
          const emin = ok ? err(ls) : A, emax = Math.max(emin + 1e-9, ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([s1, s2]) => err(new Cx(s1 * span, s2 * span))));
          const key = [...a, ...b].map((z) => z.re.toFixed(3) + ',' + z.im.toFixed(3)).join(';') + '|' + span.toFixed(3);
          L.raster((x, y) => {
            const e = err(new Cx(x, y)); const t = Math.sqrt((e - emin) / (emax - emin));
            const c = v.M.cmap(Math.min(1, t), 'viridis'); const g = Math.abs(v.M.fract(t * 8) - 0.5) * 2, k = 0.86 + 0.14 * Math.min(1, (1 - g) * 6); return [c[0] * k, c[1] * k, c[2] * k];
          }, { res: 3, key });
          L.hline(0, { color: 'panel', width: 1, alpha: 0.5 }); L.vline(0, { color: 'panel', width: 1, alpha: 0.5 });
          if (ok) {
            L.line(lam.x, lam.y, ls.re, ls.im, { color: 'panel', width: 1.5, dash: [4, 3] });
            L.dot(ls.re, ls.im, { color: 'green', r: 7, label: 'C/B', labelPos: 'se' });
          }
          // right: components and best approximations
          const l = new Cx(lam.x, lam.y);
          a.forEach((z, j) => {
            const q = ls.mul(b[j]);
            R.line(z.re, z.im, q.re, q.im, { color: 'green', width: 1.4, dash: [3, 3] });
            R.dot(q.re, q.im, { color: 'green', r: 5, hollow: true, width: 2 });
            const ql = l.mul(b[j]); R.dot(ql.re, ql.im, { color: 'gold', r: 3.5 });
          });
          R.dot(0, 0, { color: 'ink', r: 3 });
          st = { A, B, C, ls, emin, el: err(l), ok, lam: l };
          v.legend([['accent', '$a_j$', { dot: true }], ['orange', '$b_j$', { dot: true }], ['green', '$\\lambda^* b_j$ with $\\lambda^*=C/B$', { dot: true }], ['gold', '$\\lambda b_j$ for the probe $\\lambda$', { dot: true }]]);
        });
        v.readout(() => {
          const { A, B, C, emin, el, ok, lam } = st, f = (t) => v.fmt(t, 4);
          if (!ok) return 'All $b_j = 0$: both sides are $0$.';
          const C2 = C.abs2();
          return `$A = ${f(A)}$, $B = ${f(B)}$, $|C|^2 = ${f(C2)}$: $\\;|C|^2 \\le AB = ${f(A * B)}$, slack $AB-|C|^2 = ${f(A * B - C2)}$. Minimum error $(AB-|C|^2)/B = ${f(emin)}$; at your $\\lambda = ${lam.toString(2).replace('i', '\\,i')}$ the error is $${f(el)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.36
    {
      num: '1.36',
      kind: 'Definition',
      name: 'Euclidean space ℝᵏ',
      statement: String.raw`For a positive integer $k$, $\R^k$ is the set of ordered $k$-tuples $\mathbf x=(x_1,\dots,x_k)$ of real numbers, called points or vectors. With $\mathbf x+\mathbf y=(x_1+y_1,\dots,x_k+y_k)$ and $\alpha\mathbf x=(\alpha x_1,\dots,\alpha x_k)$ for real $\alpha$, $\R^k$ is a vector space over $\R$ with zero vector $\mathbf 0$. The **inner product** and **norm** are
$$\mathbf x\cdot\mathbf y=\sum_{i=1}^k x_iy_i,\qquad |\mathbf x|=(\mathbf x\cdot\mathbf x)^{1/2}=\Big(\sum_{i=1}^k x_i^2\Big)^{1/2},$$
and $\R^k$ with these structures is **Euclidean $k$-space**.`,
      idea: String.raw`For $k=1$ this is the real line with $|x|$ the usual absolute value; for $k=2$ it is the plane, and the norm agrees with the absolute value of the complex number $x_1+ix_2$. The algebraic properties of the norm are Theorem 1.37; they make $|\mathbf x-\mathbf y|$ a distance (Chapter 2).`,
      deps: ['pma-1.19'],
      tags: ['Euclidean space', 'vectors'],
    },

    // ------------------------------------------------------------------ 1.37
    {
      num: '1.37',
      kind: 'Theorem',
      name: 'Properties of the Euclidean norm',
      statement: String.raw`For $\mathbf x,\mathbf y,\mathbf z\in\R^k$ and real $\alpha$:
(a) $|\mathbf x|\ge0$;
(b) $|\mathbf x|=0$ only when $\mathbf x=\mathbf 0$;
(c) $|\alpha\mathbf x|=|\alpha|\,|\mathbf x|$;
(d) $|\mathbf x\cdot\mathbf y|\le|\mathbf x|\,|\mathbf y|$;
(e) $|\mathbf x+\mathbf y|\le|\mathbf x|+|\mathbf y|$;
(f) $|\mathbf x-\mathbf z|\le|\mathbf x-\mathbf y|+|\mathbf y-\mathbf z|$.`,
      idea: String.raw`(a)–(c) are immediate from the definition. (d) is the Schwarz inequality 1.35 with real numbers $a_j=x_j$, $b_j=y_j$. For (e), $|\mathbf x+\mathbf y|^2=|\mathbf x|^2+2\,\mathbf x\cdot\mathbf y+|\mathbf y|^2\le|\mathbf x|^2+2|\mathbf x||\mathbf y|+|\mathbf y|^2=(|\mathbf x|+|\mathbf y|)^2$ by (d). Finally (f) is (e) applied to $\mathbf x-\mathbf y$ and $\mathbf y-\mathbf z$. Properties (a), (b), (f) are what make $\R^k$ a metric space (Remark 1.38).`,
      caption: String.raw`Drag the bar tops to set the coordinates of $\mathbf x$ (blue) and $\mathbf y$ (orange), and change the dimension $k$. Whatever $k$ is, $\mathbf x$ and $\mathbf y$ span a plane, drawn on the right with true lengths and angle: the triangle $\mathbf 0,\mathbf x,\mathbf x+\mathbf y$ is (e), and the projection of $\mathbf y$ onto the line of $\mathbf x$ — signed length $\mathbf x\cdot\mathbf y/|\mathbf x|$ (purple) — never leaves the circle of radius $|\mathbf y|$, which is (d).`,
      deps: ['pma-1.36', 'pma-1.35'],
      see: ['pma-2.15', 'rca-4.2'],
      tags: ['Euclidean space', 'inequalities'],
      viz(v) {
        const KMAX = 10;
        const kS = v.slider('dimension $k$', 2, KMAX, 6, { int: true });
        const Bs = v.stage({ x: [0.3, 6.7], y: [-2.3, 2.3], height: 330, axes: 'box', xticks: v.M.range(KMAX, 1), weight: 1.35, title: 'coordinates of $\\mathbf x$ and $\\mathbf y$' });
        const P = v.stage({ x: [-1, 5], y: [-1, 4], equal: true, height: 330, grid: true, weight: 1, title: 'the plane spanned by $\\mathbf x$ and $\\mathbf y$' });
        const r = v.rng(7);
        const X0 = v.M.range(KMAX).map(() => Math.round(r.uniform(-1.6, 1.8) * 10) / 10), Y0 = v.M.range(KMAX).map(() => Math.round(r.uniform(-1.4, 1.8) * 10) / 10);
        const hx = X0.map((val, i) => Bs.handle(i + 1 - 0.17, val, { color: 'accent', r: 5.5, constrain: (x, y) => [i + 1 - 0.17, v.M.clamp(y, -2.1, 2.1)] }));
        const hy = Y0.map((val, i) => Bs.handle(i + 1 + 0.17, val, { color: 'orange', r: 5.5, constrain: (x, y) => [i + 1 + 0.17, v.M.clamp(y, -2.1, 2.1)] }));
        let st = {};
        v.render(() => {
          const k = kS.value;
          Bs.setView([0.4, k + 0.6], null);
          hx.forEach((h, i) => { h.visible = i < k; }); hy.forEach((h, i) => { h.visible = i < k; });
          const x = hx.slice(0, k).map((h) => h.y), y = hy.slice(0, k).map((h) => h.y);
          for (let i = 0; i < k; i++) {
            Bs.rect(i + 1 - 0.3, 0, i + 1 - 0.04, x[i], { fill: 'accent', fillAlpha: 0.55, stroke: false });
            Bs.rect(i + 1 + 0.04, 0, i + 1 + 0.3, y[i], { fill: 'orange', fillAlpha: 0.55, stroke: false });
          }
          Bs.hline(0, { color: 'faint', width: 1 });
          const nx = Math.max(1e-9, v.M.norm(x)), ny = Math.max(1e-9, v.M.norm(y)), d = v.M.dot(x, y);
          const c = v.M.clamp(d / (nx * ny), -1, 1), sn = Math.sqrt(1 - c * c);
          const X = [nx, 0], Y = [ny * c, ny * sn], S = [nx + ny * c, ny * sn], foot = [d / nx, 0];
          const xs = [0, nx, Y[0], S[0], -ny, ny], ys = [0, Y[1], S[1], ny];
          P.setView([Math.min(...xs) - 0.4, Math.max(...xs) + 0.4], [Math.min(-0.5, -ny * 0.3) - 0.2, Math.max(...ys) + 0.7]);
          P.circle(0, 0, ny, { color: 'orange', width: 1.2, dash: [5, 4], alpha: 0.6 });
          P.poly([[0, 0], X, S], { fill: 'green', fillAlpha: 0.08, stroke: false });
          P.line(0, 0, Y[0], Y[1], { color: 'orange', width: 1.4, dash: [4, 4], alpha: 0.7 });
          P.line(Y[0], Y[1], foot[0], 0, { color: 'purple', width: 1.2, dash: [3, 3] });
          P.line(0, 0, foot[0], 0, { color: 'purple', width: 5, cap: 'butt', alpha: 0.7 });
          P.arrow(0, 0, X[0], X[1], { color: 'accent', width: 2.6 });
          P.arrow(X[0], X[1], S[0], S[1], { color: 'orange', width: 2.6 });
          P.arrow(0, 0, S[0], S[1], { color: 'green', width: 2.8 });
          P.tex('\\mathbf x', X[0], X[1], { dy: 14, color: 'accent', size: 14 });
          P.tex('\\mathbf y', Y[0], Y[1], { dx: -10, align: 'right', color: 'orange', size: 14 });
          P.tex('\\mathbf x+\\mathbf y', S[0], S[1], { dy: -16, align: 'right', color: 'green', size: 14 });
          P.dot(foot[0], 0, { color: 'purple', r: 4.5 });
          P.dot(0, 0, { color: 'ink', r: 3 });
          st = { k, nx, ny, d, ns: Math.hypot(S[0], S[1]), ns2: v.M.norm(x.map((t, i) => t + y[i])) };
          v.legend([['accent', '$\\mathbf x$'], ['orange', '$\\mathbf y$; circle of radius $|\\mathbf y|$'], ['green', '$\\mathbf x+\\mathbf y$'], ['purple', 'projection, length $\\mathbf x\\cdot\\mathbf y/|\\mathbf x|$']]);
        });
        v.readout(() => {
          const { k, nx, ny, d, ns2 } = st, f = (t) => fx(t, 3);
          return `In $\\R^{${k}}$: $\\;\\mathbf x\\cdot\\mathbf y = ${f(d)}$, $\\;|\\mathbf x|\\,|\\mathbf y| = ${f(nx * ny)}$ — (d) holds; $\\;|\\mathbf x+\\mathbf y| = ${f(ns2)} \\le |\\mathbf x|+|\\mathbf y| = ${f(nx + ny)}$ — (e) holds. The angle between them is $${f(Math.acos(v.M.clamp(d / (nx * ny), -1, 1)) * 180 / Math.PI)}^\\circ$.`;
        });
      },
    },
  ],
};
