// Rudin, Functional Analysis — Chapter 2: Completeness (part 3: 2.13–2.17)

const LOG = [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100']];
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');

export default {
  book: 'fa',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Definition',
      name: 'The graph of a mapping',
      verify: true,
      statement: String.raw`If $f$ maps a set $X$ into a set $Y$, the **graph** of $f$ is the set $G=\{(x,f(x)):x\in X\}\subset X\times Y$. When $X$ and $Y$ are topological (vector) spaces, $X\times Y$ carries the product topology. For a linear map $\Lambda$ between vector spaces the graph $\{(x,\Lambda x)\}$ is a linear subspace of $X\times Y$.`,
      idea: String.raw`The graph turns a statement about a map into a statement about a subset of a product space. Continuity says more than closedness of the graph, and the closed graph theorem says that, for linear maps between F-spaces, the two coincide. If $X$ and $Y$ are F-spaces with invariant metrics $d_1,d_2$, then $d_1+d_2$ makes $X\times Y$ an F-space, and a closed subspace of it is again an F-space.`,
      deps: ['fa-1.6'],
      tags: ['closed graph'],
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Proposition',
      name: 'Continuous maps into Hausdorff spaces have closed graphs',
      statement: String.raw`If $X$ is a topological space, $Y$ is a Hausdorff space, and $f:X\to Y$ is continuous, then the graph $G$ of $f$ is closed in $X\times Y$.`,
      idea: String.raw`Take $(x_0,y_0)\notin G$, so $y_0\neq f(x_0)$. Because $Y$ is Hausdorff, $y_0$ and $f(x_0)$ have disjoint neighbourhoods $W$ and $U$; continuity gives a neighbourhood $V$ of $x_0$ with $f(V)\subset U$. Then $V\times W$ is a neighbourhood of $(x_0,y_0)$ that misses $G$. The converse fails: $1/x$ (with any value at $0$) has a closed graph but is not continuous — the closed graph theorem adds linearity and completeness to recover continuity.`,
      caption: String.raw`Drag $x_0$ (and approach from either side). The gold points $(x_n,f(x_n))$ come from a sequence $x_n\to x_0$. If they converge, the limit must lie on the graph for $G$ to be closed: always true for the continuous $f$; false at the jump, where $(0,1)$ is a limit point that is not on the graph. For $1/x$ the points escape to infinity, so there is nothing to check: the graph is closed although $f$ is discontinuous.`,
      deps: ['fa-2.13'],
      see: ['pma-4.8'],
      tags: ['closed graph', 'continuity'],
      viz(v) {
        const M = v.M;
        const FN = {
          cont: { label: '$x\\sin(4/x)$ (continuous)', f: (x) => (x === 0 ? 0 : x * Math.sin(4 / x)), x0: 0.35 },
          jump: { label: 'jump at $0$', f: (x) => (x > 0 ? 1 : -0.5), x0: 0 },
          inv: { label: '$1/x$, $f(0)=0$', f: (x) => (x === 0 ? 0 : 1 / x), x0: 0 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'jump', { onChange: (val) => { h.x = FN[val].x0; } });
        const side = v.select('approach', [{ value: 1, label: 'from the right' }, { value: -1, label: 'from the left' }], 1);
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.3], height: 330, axes: true, full: true, xlabel: 'x', ylabel: 'y', title: 'the graph $G\\subset\\R\\times\\R$ and a sequence $(x_n,f(x_n))$ with $x_n\\to x_0$' });
        const h = S.handle(FN.jump.x0, 0, { color: 'accent', constrain: (x) => [M.clamp(x, -2, 2), 0] });
        let info = {};
        v.render(() => {
          const F = FN[which.value], f = F.f, x0 = h.x, sg = side.value;
          // the graph
          if (which.value === 'jump') {
            S.line(-3, -0.5, 0, -0.5, { color: 'accent', width: 2.6 }); S.line(0, 1, 3, 1, { color: 'accent', width: 2.6 });
            S.dot(0, -0.5, { color: 'accent', r: 5 }); S.dot(0, 1, { color: 'accent', r: 5, hollow: true, width: 2 });
          } else S.fn(f, { color: 'accent', width: 2.4, n: 3000 });
          if (which.value !== 'jump') S.dot(0, f(0), { color: 'accent', r: 4.5 });
          // the sequence
          const xs = M.range(40, 1).map((n) => x0 + sg * 1.3 * Math.pow(0.8, n));
          const pts = xs.map((x) => [x, f(x)]);
          pts.forEach((p, i) => S.dot(p[0], p[1], { color: 'gold', r: 4.2 - 2.4 * i / 40, alpha: 1 - 0.6 * i / 40 }));
          S.vline(x0, { color: 'muted', width: 1, dash: [3, 3] });
          // does f(x_n) converge?
          const far = M.range(8, 113).map((n) => f(x0 + sg * 1.3 * Math.pow(0.8, n)));   // n = 113..120, |x_n - x_0| < 1e-11
          const tail = far;
          const spread = Math.max(...tail) - Math.min(...tail), ylim = tail[tail.length - 1];
          const conv = isFinite(ylim) && Math.abs(ylim) < 1e6 && spread < 1e-3;
          let status;
          if (!conv) { status = 'none'; S.corner('(xₙ, f(xₙ)) has no limit in ℝ²: nothing to check', 'tl', { color: 'muted', weight: 600 }); }
          else if (Math.abs(ylim - f(x0)) < 1e-3) { status = 'on'; S.dot(x0, ylim, { color: 'green', r: 7, hollow: true, width: 2.4 }); S.corner('limit (x₀, y) lies on G', 'tl', { color: 'green', weight: 600 }); }
          else { status = 'off'; S.dot(x0, ylim, { color: 'red', r: 7, hollow: true, width: 2.4 }); S.dot(x0, f(x0), { color: 'accent', r: 5 }); S.corner('limit (x₀, y) is NOT on G: G is not closed', 'tl', { color: 'red', weight: 600 }); }
          S.tex('x_0', x0, 0, { align: 'right', baseline: 'bottom', dx: -9, dy: -8, color: 'accent' });
          info = { status, x0, ylim, fx0: f(x0), which: which.value };
          v.legend([['accent', 'graph $G$'], ['gold', '$(x_n,f(x_n))$', { dot: true }], ['green', 'limit on $G$', { dot: true }], ['red', 'limit off $G$', { dot: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.status) return '';
          if (s.status === 'none') return `The points leave every bounded set (or keep oscillating), so they have no limit in $\\R\\times\\R$; closedness of $G$ only concerns sequences that do converge.` + (s.which === 'inv' ? ' The graph of $1/x$ is closed, yet $f$ is not continuous at $0$.' : '');
          if (s.status === 'on') return `$f(x_n)\\to ${v.fix(s.ylim, 3)} = f(x_0)$: the limit point is on the graph, as continuity guarantees.`;
          return `$f(x_n)\\to ${v.fix(s.ylim, 3)}$ but $f(x_0) = ${v.fix(s.fx0, 3)}$: the point $(x_0, ${v.fix(s.ylim, 2)})$ is in $\\overline G\\setminus G$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Closed graph theorem',
      statement: String.raw`Suppose
(a) $X$ and $Y$ are F-spaces,
(b) $\Lambda:X\to Y$ is linear, and
(c) the graph $G=\{(x,\Lambda x):x\in X\}$ is closed in $X\times Y$.
Then $\Lambda$ is continuous.`,
      idea: String.raw`$X\times Y$ is an F-space, and $G$ is a closed subspace, hence an F-space too. The projection $\pi_1:G\to X$, $(x,\Lambda x)\mapsto x$, is a continuous linear bijection between F-spaces, so its inverse is continuous by 2.12(b). Then $\Lambda=\pi_2\circ\pi_1^{-1}$ is continuous, with $\pi_2(x,y)=y$. Conversely a continuous $\Lambda$ has a closed graph by 2.14, so for linear maps between F-spaces "continuous" and "closed graph" are the same.`,
      caption: String.raw`$\Lambda=d/dx$ from $C^1[0,1]$ to $C[0,1]$, which has a closed graph: uniform limits $f_k\to f$, $f_k'\to g$ force $f'=g$. Test it on $f_n(x)=\sin(n\pi x)/\sqrt n$. With the sup norm on $C^1$ (not complete) $\norm{f_n}\to0$ while $\norm{f_n'}\to\infty$, so $\Lambda$ is unbounded and the theorem's completeness hypothesis is visibly needed. With the complete norm $\norm f_\infty+\norm{f'}_\infty$ every point of the bottom panel lies below the line $\norm{\Lambda f}=\norm f$, so $\Lambda$ is continuous.`,
      deps: ['fa-2.12', 'fa-2.13', 'fa-2.14', 'fa-1.8'],
      see: ['rca-5.10'],
      tags: ['closed graph', 'F-space'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const NK = 60;
        const nrm = v.select('norm on $X=C^1[0,1]$', [{ value: 'sup', label: '$\\|f\\|_\\infty$ (not complete)' }, { value: 'c1', label: '$\\|f\\|_\\infty+\\|f\'\\|_\\infty$ (complete)' }], 'sup');
        const nS = v.slider('$n$', 1, NK, 9, { int: true });
        const X = v.stage({ x: [0, 1], y: [-1.25, 1.25], height: 230, axes: 'box', xticks: [0.25, 0.5, 0.75, 1], title: '$f_n(x)=\\sin(n\\pi x)/\\sqrt n\\in X$' });
        const Y = v.stage({ x: [0, 1], y: [-26, 26], height: 230, axes: 'box', xticks: [0.25, 0.5, 0.75, 1], title: '$\\Lambda f_n=f_n\'\\in Y=C[0,1]$' });
        const P = v.stage({ x: [-1.05, 1.5], y: [-0.25, 1.55], height: 210, axes: 'box', full: true, xticks: LOG, yticks: LOG.slice(1), xlabel: '‖f‖ in X', title: 'the graph seen through norms: $(\\|f_k\\|_X,\\ \\|\\Lambda f_k\\|_Y)$ for $k\\le' + NK + '$ (log–log)' });
        const nX = (k, kind) => (kind === 'sup' ? 1 / Math.sqrt(k) : 1 / Math.sqrt(k) + PI * Math.sqrt(k));
        const nY = (k) => PI * Math.sqrt(k);
        let info = {};
        v.render(() => {
          const n = nS.value, kind = nrm.value;
          const f = (x) => Math.sin(n * PI * x) / Math.sqrt(n), df = (x) => PI * Math.sqrt(n) * Math.cos(n * PI * x);
          const a = 1 / Math.sqrt(n), b = PI * Math.sqrt(n);
          X.hband(-a, a, { color: 'accent', alpha: 0.1, edges: true });
          X.fn(f, { color: 'accent', width: 2.2, n: 1200 });
          X.corner(`‖fₙ‖ in X: ${v.fmt(nX(n, kind), 3)}`, 'tr', { color: 'accent', weight: 600 });
          Y.setView(null, [-1.15 * PI * Math.sqrt(NK), 1.15 * PI * Math.sqrt(NK)]);
          Y.hband(-b, b, { color: 'gold', alpha: 0.12, edges: true });
          Y.fn(df, { color: 'gold', width: 1.8, n: 1600 });
          Y.corner(`‖Λfₙ‖ = π√n = ${v.fmt(b, 3)}`, 'tr', { color: 'gold', weight: 600 });
          // norms panel
          const lg = Math.log10;
          P.line(-2, -2, 2, 2, { color: kind === 'sup' ? 'red' : 'green', width: 1.4, dash: [6, 4] });
          P.text('‖Λf‖ = ‖f‖', 0.02, 0, { align: 'left', baseline: 'top', dy: 6, color: kind === 'sup' ? 'red' : 'green', size: 11 });
          const pts = M.range(NK, 1).map((k) => [lg(nX(k, kind)), lg(nY(k))]);
          P.path(pts, { color: 'muted', width: 1, alpha: 0.5 });
          P.dots(pts, { color: kind === 'sup' ? 'red' : 'green', r: 2.8 });
          P.dot(pts[n - 1][0], pts[n - 1][1], { color: 'gold', r: 6, label: `f${sub(n)}`, labelPos: 'e' });
          P.corner(kind === 'sup' ? '‖Λfₙ‖/‖fₙ‖ = πn → ∞: Λ unbounded' : 'all points below the line: ‖Λ‖ ≤ 1', kind === 'sup' ? 'br' : 'tl', { color: kind === 'sup' ? 'red' : 'green', weight: 600 });
          info = { n, kind, ratio: nY(n) / nX(n, kind) };
          v.legend([['accent', '$f_n$ and $\\pm\\|f_n\\|_\\infty$'], ['gold', '$f_n\'$ and $\\pm\\|f_n\'\\|_\\infty$'], [kind === 'sup' ? 'red' : 'green', '$(\\|f_k\\|_X,\\|\\Lambda f_k\\|)$', { dot: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.kind) return '';
          if (s.kind === 'sup') return `$\\|\\Lambda f_n\\|/\\|f_n\\|_\\infty = \\pi n = ${v.fix(s.ratio, 2)}$. The graph of $d/dx$ is closed, yet $d/dx$ is unbounded: $(C^1,\\|\\cdot\\|_\\infty)$ is not an F-space, so the closed graph theorem does not apply.`;
          return `$\\|\\Lambda f_n\\|/\\|f_n\\|_{C^1} = ${v.fix(s.ratio, 3)} < 1$. With the complete norm, $X$ is a Banach space, the graph is still closed, and $\\Lambda$ is continuous with $\\|\\Lambda\\|\\le1$ — exactly as 2.15 predicts.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Definition',
      name: 'Bilinear and separately continuous mappings',
      verify: true,
      statement: String.raw`Let $X$, $Y$, $Z$ be vector spaces and $B:X\times Y\to Z$. For $x\in X$ and $y\in Y$ define $B_x:Y\to Z$ and $B^y:X\to Z$ by $B_x(y)=B(x,y)=B^y(x)$. $B$ is **bilinear** if every $B_x$ and every $B^y$ is linear. If $X,Y,Z$ are topological vector spaces, $B$ is **separately continuous** when every $B_x$ and every $B^y$ is continuous, and **continuous** when it is continuous for the product topology of $X\times Y$.`,
      idea: String.raw`Continuity implies separate continuity, but not conversely: $2xy/(x^2+y^2)$ is continuous in each variable separately and discontinuous at the origin. Bilinearity together with completeness of one factor closes this gap, which is the content of 2.17. Typical examples are products, inner products, convolution, and the evaluation pairing $(x,\Lambda)\mapsto\Lambda x$.`,
      deps: ['fa-1.6'],
      tags: ['bilinear'],
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Theorem',
      name: 'Separately continuous bilinear maps are jointly continuous',
      statement: String.raw`Let $B:X\times Y\to Z$ be bilinear and separately continuous, where $X$ is an F-space and $Y$, $Z$ are topological vector spaces. Then $B(x_n,y_n)\to B(x_0,y_0)$ in $Z$ whenever $x_n\to x_0$ in $X$ and $y_n\to y_0$ in $Y$. If $Y$ is metrizable, it follows that $B$ is continuous.`,
      idea: String.raw`Put $b_n(x)=B(x,y_n)$. Each $b_n:X\to Z$ is continuous and linear, and $b_n(x)\to B(x,y_0)$ for every $x$ because $B_x$ is continuous. On the F-space $X$ this makes $\{b_n\}$ equicontinuous (2.6). Now split
$$B(x_n,y_n)-B(x_0,y_0)=b_n(x_n-x_0)+B(x_0,y_n-y_0).$$
The second term tends to $0$ by continuity of $B_{x_0}$, and the first by equicontinuity, since $x_n-x_0\to0$. If $Y$ is metrizable, so is $X\times Y$, and sequential continuity is continuity.`,
      caption: String.raw`Pick a map and drag the direction $\theta$ along which $(x_n,y_n)\to(0,0)$; the right panel shows $|B(x_n,y_n)-B(0,0)|$. For $B(x,y)=xy$ on $\R\times\R$ the values go to $0$ along every path. The function $2xy/(x^2+y^2)$ is separately continuous but not bilinear, and stays equal to $\sin2\theta$. The bilinear $B(x,y)=\sum_kkx_ky_k$ on $c_{00}$ with the sup norm (not complete) is separately continuous, yet $x^{(n)}=y^{(n)}=e_n/\sqrt n\to0$ gives $B=1$ for every $n$.`,
      deps: ['fa-2.16', 'fa-2.6', 'fa-2.3'],
      tags: ['bilinear', 'equicontinuity'],
      viz(v) {
        const M = v.M;
        const NN = 24;
        const mode = v.select('$B$', [{ value: 'xy', label: '$xy$ on $\\R\\times\\R$' }, { value: 'sep', label: '$\\frac{2xy}{x^2+y^2}$ (not bilinear)' }, { value: 'c00', label: '$\\sum_k kx_ky_k$ on $c_{00}$' }], 'xy');
        const th = v.slider('direction $\\theta$ of the path', 0, Math.PI, 0.6, { step: 0.01, fmt: (x) => v.fix(x / Math.PI, 2) + 'π' });
        const nS = v.slider('$n$', 1, NN, 6, { int: true });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], axes: false, height: 330, title: 'values of $B$ near $(0,0)$ and the path $(x_n,y_n)$' });
        const R = v.stage({ x: [-0.8, NN + 0.7], y: [-0.08, 1.15], axes: 'box', height: 330, xticks: [1, 5, 10, 15, 20], title: '$|B(x_n,y_n)-B(0,0)|$' });
        const Bf = { xy: (x, y) => x * y, sep: (x, y) => (x === 0 && y === 0 ? 0 : (2 * x * y) / (x * x + y * y)) };
        let info = {};
        v.render(() => {
          const m = mode.value, t = th.value;
          let vals;
          if (m !== 'c00') {
            const k = L.height / L.width, hx = Math.max(1.1, 1.1 / k);
            L.setView([-hx, hx], [-hx * k, hx * k]);
            L.setTitle('values of $B$ near $(0,0)$ and the path $(x_n,y_n)$');
            const scale = m === 'xy' ? 0.6 : 1;
            L.heat((x, y) => Bf[m](x, y) / scale, { range: [-1, 1], cmap: 'diverging', res: 3, key: m, alpha: 0.7 });
            L.line(-2, 0, 2, 0, { color: 'faint', width: 1 }); L.line(0, -2, 0, 2, { color: 'faint', width: 1 });
            const pts = M.range(NN, 1).map((n) => { const r = Math.pow(0.85, n); return [r * Math.cos(t), r * Math.sin(t)]; });
            L.path([[0, 0], ...pts.slice().reverse()], { color: 'ink', width: 1, alpha: 0.5, dash: [3, 3] });
            pts.forEach((p, i) => L.dot(p[0], p[1], { color: 'gold', r: 4.5 - 3 * i / NN }));
            const pc = pts[nS.value - 1];
            L.dot(pc[0], pc[1], { color: 'gold', r: 7, hollow: true, width: 2.2 });
            L.dot(0, 0, { color: 'ink', r: 4, hollow: true, width: 2 });
            L.tex('x', 1.05, 0, { color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
            L.tex('y', 0, 1.05, { color: 'muted', align: 'left', dx: 4, baseline: 'top' });
            L.corner(m === 'xy' ? 'B(x, 0) = B(0, y) = 0 on the axes' : 'constant on each ray through 0', 'bl', { size: 11 });
            vals = pts.map((p) => Math.abs(Bf[m](p[0], p[1]) - 0));
          } else {
            // c00: show x^(n) = y^(n) = e_n / sqrt(n) for the current n = NN/2 and all coordinates up to NN
            L.setView([-0.5, NN + 0.5], [-0.12, 1.12]);
            L.setTitle('the vectors $x^{(n)}=y^{(n)}=e_n/\\sqrt n\\in c_{00}$');
            const n = nS.value;
            for (let k = 1; k <= NN; k++) L.line(k, 0, k, 0.012, { color: 'faint', width: 1 });
            for (let k = 1; k <= NN; k++) { const h = 1 / Math.sqrt(k); L.dot(k, h, { color: k === n ? 'gold' : 'faint', r: k === n ? 5.5 : 2.5 }); }
            L.line(n, 0, n, 1 / Math.sqrt(n), { color: 'gold', width: 6, cap: 'butt' });
            L.line(-1, 0, NN + 1, 0, { color: 'faint', width: 1 });
            L.corner(`x⁽ⁿ⁾ = y⁽ⁿ⁾ = eₙ/√n, n = ${n}: ‖·‖∞ = ${v.fmt(1 / Math.sqrt(n), 3)} → 0`, 'tl', { color: 'gold', weight: 600 });
            L.corner('grey dots: heights 1/√k of the later x⁽ᵏ⁾', 'bl', { size: 11 });
            vals = M.range(NN, 1).map(() => 1);
          }
          const ok = m === 'xy';
          R.bars(vals, { color: (val, i) => (i === nS.value - 1 ? 'gold' : ok ? 'green' : 'red'), fillAlpha: 0.8 });
          R.hline(0, { color: 'faint', width: 1 });
          R.corner(ok ? '→ 0 along every path: jointly continuous' : 'does not tend to 0', 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          info = { m, t, n: nS.value, val: vals[nS.value - 1] };
          v.legend(m === 'c00'
            ? [['gold', '$x^{(n)}=y^{(n)}$'], ['red', '$B(x^{(n)},y^{(n)})=n\\cdot\\frac1n=1$', { area: true }]]
            : [['red', '$B>0$', { area: true }], ['blue', '$B<0$', { area: true }], ['gold', '$(x_n,y_n)\\to(0,0)$', { dot: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.m) return '';
          if (s.m === 'xy') return `$|B(x_{${s.n}},y_{${s.n}})| = ${v.fmt(s.val, 3)}$, and $|x_ny_n|\\le r_n^2\\to0$: here $B(x_n,y_n)-B(0,0)=B(x_n,y_n)$ is split as $b_n(x_n-0)+B(0,y_n-0)$ and both terms vanish. $\\R$ is complete, as 2.17 requires.`;
          if (s.m === 'sep') return `Along this ray $B\\equiv\\sin2\\theta = ${v.fix(Math.sin(2 * s.t), 3)}$, but $B(0,0)=0$. Each $B(\\cdot,y)$ and $B(x,\\cdot)$ is continuous; without bilinearity that is not enough.`;
          return `$\\|x^{(n)}\\|_\\infty = ${v.fix(1 / Math.sqrt(s.n), 3)}\\to0$ yet $B(x^{(n)},y^{(n)})=1$. $B$ is bilinear and separately continuous ($B(\\cdot,y)$ is a finite sum for each fixed $y\\in c_{00}$), but $c_{00}$ is not complete: the maps $b_n=B(\\cdot,y^{(n)})$ have norms $\\sqrt n\\to\\infty$ and are not equicontinuous.`;
        });
      },
    },
  ],
};
