// Numerical Analysis — Chapter 3: Polynomial interpolation (items 3.1–3.9; 3.10–3.17 in ch03-b.js)
import { tsci, sci, lg, clamp, linspace, equiPts, chebPts, nodesOf, baryW, chebW, bary, lagr, divdiff, newtonEval, omega, solveGE, T, chebCoeffs } from './ch03.shared.js';

const COL = ['accent', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold', 'blue'];
const NODEOPTS = [{ value: 'equi', label: 'equispaced' }, { value: 'cheb', label: 'Chebyshev' }];
/** Barycentric interpolant of values ys at nodes xs as a function. */
const interp = (xs, ys) => { const w = baryW(xs); return (x) => bary(xs, w, ys, x); };

export default {
  collection: 'num',
  chapter: 3,
  title: 'Polynomial interpolation',
  summary: String.raw`Through $n+1$ points passes exactly one polynomial of degree $n$, and the error formula says how well it matches a smooth function: the answer depends on the node polynomial. Equispaced nodes are a trap — Runge’s example diverges and the Lebesgue constant grows exponentially — while Chebyshev points cluster at the ends, minimize the node polynomial and give a Lebesgue constant growing only logarithmically. The barycentric formula makes interpolation in Chebyshev points fast and stable, and potential theory explains which functions converge.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Existence and uniqueness of the interpolating polynomial',
      statement: String.raw`Let $x_0,\dots,x_n$ be $n+1$ **distinct** real (or complex) numbers and $y_0,\dots,y_n$ arbitrary values. Then there is exactly one polynomial $p$ of degree at most $n$ with $p(x_j)=y_j$ for all $j$. In the monomial basis the coefficients solve the Vandermonde system $Va=y$, whose determinant is $\prod_{i<j}(x_j-x_i)$, nonzero exactly when the nodes are distinct.`,
      idea: String.raw`Uniqueness: the difference of two interpolants has degree $\le n$ and $n+1$ zeros, so it is the zero polynomial. Existence then follows by linear algebra: the map $a\mapsto (p(x_j))_j$ from coefficient vectors to data is a square matrix with trivial kernel, hence invertible. That matrix is the Vandermonde matrix, whose determinant (ladr-9.67) is the product of all node differences — it vanishes precisely when two nodes collide, which is the only way the problem can fail.`,
      caption: String.raw`Drag the gold points (change $n+1$ with the slider); the unique polynomial of degree $\le n$ through them is redrawn. The slider $c$ adds $c\,\omega(x)$ with $\omega=\prod(x-x_j)$: the orange curve still passes through every point, but it has degree $n+1$ — uniqueness needs the degree bound. Drag two points to the same abscissa and the Vandermonde determinant in the readout goes to $0$ and the interpolant ceases to exist.`,
      deps: ['ladr-9.67'],
      refs: ['Süli–Mayers ch. 6'],
      scope: String.raw`Nodes must be distinct; the values are arbitrary. The degree bound $\le n$ is what makes the interpolant unique.`,
      tags: ['interpolation', 'vandermonde'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polynomial_interpolation' },
      viz(v) {
        const m = v.slider('points $n+1$', 2, 7, 5, { int: true });
        const c = v.slider('extra term $c$', -1, 1, 0, { step: 0.01 });
        const s = v.stage({ x: [-1.6, 1.6], y: [-3, 3], axes: 'box', gutter: true, xlabel: 'x', height: 360, title: 'the interpolating polynomial' });
        const X0 = [-1.3, -0.8, -0.3, 0.15, 0.6, 1.0, 1.4], Y0 = [0.5, -1, 0.8, 1.5, -0.5, 0.3, -1.2];
        const H = X0.map((x, i) => s.handle(x, Y0[i], { color: 'gold' }));
        let info = {};
        v.legend([['accent', '$p$, degree $\\le n$'], ['orange', '$p+c\\,\\omega$, degree $n+1$', { dash: true }]]);
        v.render(() => {
          const k = m.value; H.forEach((h, i) => { h.visible = i < k; });
          const P = H.slice(0, k), xs = P.map((h) => h.x), ys = P.map((h) => h.y);
          let det = 1, gap = Infinity;
          for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { det *= xs[j] - xs[i]; gap = Math.min(gap, Math.abs(xs[j] - xs[i])); }
          info = { det, k, gap };
          if (gap < 2e-3) { s.corner('two nodes coincide: $\\det V=0$, no interpolant', 'tl', { color: 'red' }); return; }
          const p = interp(xs, ys);
          s.clip(() => {
            if (Math.abs(c.value) > 1e-9) s.fn((x) => p(x) + c.value * omega(xs, x), { color: 'orange', dash: true, width: 1.6 });
            s.fn(p, { color: 'accent', width: 2.4 });
          });
          xs.forEach((x, i) => s.vline(x, { color: 'faint', alpha: 0.4 }));
        });
        v.readout(() => `$n+1=${info.k}$ nodes, $\\det V=\\prod_{i<j}(x_j-x_i)=${tsci(info.det, 3)}$, closest pair at distance $${v.fix(info.gap, 3)}$\n` + (info.gap < 2e-3 ? '**the Vandermonde matrix is singular**' : 'a unique polynomial of degree $\\le n$ passes through all the points'));
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Lagrange form of the interpolant',
      statement: String.raw`For distinct nodes $x_0,\dots,x_n$ the **Lagrange basis polynomials** are
$$\ell_j(x)=\prod_{k\ne j}\frac{x-x_k}{x_j-x_k},\qquad \ell_j(x_i)=\delta_{ij},$$
and the interpolant of data $y_j$ is $p(x)=\sum_{j=0}^n y_j\,\ell_j(x)$. In particular $\sum_j\ell_j\equiv1$ (interpolate the constant $1$).`,
      idea: String.raw`Each $\ell_j$ has degree $n$ and is built to vanish at every node but $x_j$, where it is $1$, so $\sum y_j\ell_j$ matches the data; by uniqueness (3.1) it is *the* interpolant. The form needs no linear solve: the data enter linearly and the basis depends only on the nodes, which is why the same $\ell_j$ serve every right-hand side — and why the size of the $\ell_j$ (the Lebesgue constant, 3.10) controls how data errors are amplified.`,
      caption: String.raw`Left: the basis polynomials, each equal to $1$ at its own node (dot) and $0$ at the others. Right: the terms $y_j\ell_j$ (thin) and their running sum; slide $k$ to add the terms one at a time and watch the sum become the interpolant. Drag the gold data values vertically, switch node families, and notice that the equispaced basis functions grow large near the ends.`,
      deps: ['num-3.1'],
      refs: ['Süli–Mayers ch. 6'],
      credit: 'Waring 1779, Euler 1783, Lagrange 1795 (the formula is named after Lagrange)',
      tags: ['interpolation', 'lagrange'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lagrange_polynomial' },
      viz(v) {
        const kind = v.select('nodes', NODEOPTS, 'equi');
        const nn = v.slider('degree $n$', 2, 8, 5, { int: true });
        const kk = v.slider('terms added $k$', 1, 9, 9, { int: true });
        const sa = v.stage({ x: [-1.05, 1.05], y: [-1.6, 2.6], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: 'basis polynomials $\\ell_j$' });
        const sb = v.stage({ x: [-1.05, 1.05], y: [-2, 2], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: 'terms $y_j\\ell_j$ and partial sum' });
        const Y0 = [0.4, -0.6, 1.0, 0.2, -0.8, 0.7, -0.3, 0.9, -0.5];
        const H = Y0.map((y, i) => sb.handle(0, y, { color: 'gold' }));
        let info = {};
        v.render(() => {
          const n = nn.value, xs = nodesOf(kind.value, n), w = baryW(xs), N = n + 1, K = Math.min(kk.value, N);
          H.forEach((h, i) => { h.visible = i < N; if (i < N) h.set(xs[i], h.y); });
          const ys = H.slice(0, N).map((h) => h.y);
          sa.hline(1, { color: 'faint' });
          for (let j = 0; j < N; j++) { sa.fn((x) => lagr(xs, w, j, x), { color: COL[j % 9], width: 1.6, alpha: 0.9 }); sa.dot(xs[j], 1, { color: COL[j % 9], r: 3.5 }); sa.dot(xs[j], 0, { color: COL[j % 9], r: 3, hollow: true }); }
          for (let j = 0; j < N; j++) sb.fn((x) => ys[j] * lagr(xs, w, j, x), { color: COL[j % 9], width: 1, alpha: j < K ? 0.7 : 0.15 });
          const part = (x) => { let t = 0; for (let j = 0; j < K; j++) t += ys[j] * lagr(xs, w, j, x); return t; };
          sb.clip(() => sb.fn(part, { color: 'ink', width: 2.6 }));
          let dev = 0, sumdev = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) dev = Math.max(dev, Math.abs(lagr(xs, w, j, xs[i]) - (i === j ? 1 : 0)));
          for (let t = -1; t <= 1; t += 0.05) { let q = 0; for (let j = 0; j < N; j++) q += lagr(xs, w, j, t); sumdev = Math.max(sumdev, Math.abs(q - 1)); }
          info = { dev, sumdev, K, N, ymax: Math.max(...xs.map((x, j) => 0)) };
        });
        v.readout(() => `${info.N} basis polynomials: $\\max|\\ell_j(x_i)-\\delta_{ij}|=${info.dev < 1e-14 ? '0 (to rounding)' : tsci(info.dev, 2)}$, $\\max_x|\\sum_j\\ell_j-1|=${tsci(info.sumdev + 1e-30, 2)}$\n` + (info.K === info.N ? 'all terms added: the black curve is the interpolant (passes through the gold points)' : `${info.K} of ${info.N} terms added`));
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Algorithm',
      name: 'Newton divided differences',
      statement: String.raw`For nodes $x_0,x_1,\dots$ and values $y_j=f(x_j)$ define divided differences by $f[x_i]=y_i$ and
$$f[x_i,\dots,x_{i+k}]=\frac{f[x_{i+1},\dots,x_{i+k}]-f[x_i,\dots,x_{i+k-1}]}{x_{i+k}-x_i}.$$
Then the interpolant through the first $k+1$ nodes is the **Newton form**
$$p_k(x)=\sum_{m=0}^{k}f[x_0,\dots,x_m]\prod_{j<m}(x-x_j),$$
so $p_k=p_{k-1}+f[x_0,\dots,x_k]\,\omega_k(x)$, with $\omega_k=\prod_{j<k}(x-x_j)$: adding a node adds one term.`,
      idea: String.raw`The new term $c\,\omega_k$ already vanishes at $x_0,\dots,x_{k-1}$, so it cannot disturb the old interpolation conditions; the constant $c$ is fixed by demanding $p_k(x_k)=y_k$, and comparing leading coefficients with the Lagrange form (3.2) identifies $c$ as the divided difference. The recursion needs only $O(n^2)$ subtractions, and a new node costs one extra table row — the reason Newton's form is the practical way to build an interpolant incrementally.`,
      caption: String.raw`Drag the gold data values; use $k$ to add nodes one at a time. The triangle shows the divided-difference table (the orange cell is the new coefficient). On the left the black curve is $p_k$, the dashed curve is the old $p_{k-1}$ and the orange curve is the single correction term $c_k\omega_k$ that turns one into the other.`,
      deps: ['num-3.1'],
      refs: ['Süli–Mayers ch. 6'],
      credit: 'Newton, 17th century (Principia, Book III Lemma V, 1687); the divided-difference notation is later',
      tags: ['interpolation', 'newton'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Divided_differences' },
      viz(v) {
        const kk = v.slider('nodes used $k+1$', 1, 6, 4, { int: true });
        const s = v.stage({ x: [-1.9, 2.4], y: [-3, 3], axes: 'box', gutter: true, xlabel: 'x', height: 360, title: 'Newton form: one term per node' });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'rows $x_i$, columns $m$: the entry $f[x_i,\\dots,x_{i+m}]$' });
        const X = [-1.5, -0.7, 0.1, 0.9, 1.5, 2.1], Y0 = [0.8, -1.2, 0.6, 1.8, -0.4, 1.0];
        const H = X.map((x, i) => s.handle(x, Y0[i], { color: 'gold' }));
        const T0 = v.table(t, { rows: 6, cols: 6, square: false, maxCell: 70, cellAspect: 1.15, size: 13, rowLabels: (i) => `$${X[i]}$`, colLabels: (j) => `$${j}$`, cornerLabel: '$x_i\\backslash m$', format: 2 });
        let info = {};
        v.legend([['ink', '$p_k$'], ['faint', '$p_{k-1}$', { dash: true }], ['orange', 'new term $c_k\\omega_k$']]);
        v.render(() => {
          const N = kk.value, xs = X.slice(0, N), ys = H.slice(0, N).map((h) => h.y);
          H.forEach((h, i) => { h.set(X[i], h.y); h.visible = true; });
          const full = divdiff(X, H.map((h) => h.y)), { c } = divdiff(xs, ys);
                    X.forEach((x, i) => { if (i >= N) s.vline(x, { color: 'faint', alpha: 0.25 }); });
          s.clip(() => {
            if (N >= 2) {
              s.fn((x) => newtonEval(xs, c, x, N - 1), { color: 'faint', dash: true, width: 1.6 });
              s.fn((x) => c[N - 1] * omega(xs.slice(0, N - 1), x), { color: 'orange', width: 1.8 });
            }
            s.fn((x) => newtonEval(xs, c, x, N), { color: 'ink', width: 2.6 });
          });
          T0.draw({
            value: (i, j) => (i + j < N ? full.T[j][i] : null),
            fill: (i, j) => (i + j < N ? (i === 0 && j === N - 1 ? ['orange', 0.45] : i === 0 ? ['accent', 0.22] : null) : null),
            highlight: [[0, N - 1, 'orange']],
          });
          let miss = 0; for (let i = 0; i < N; i++) miss = Math.max(miss, Math.abs(newtonEval(xs, c, xs[i], N) - ys[i]));
          let diff = 0; if (N >= 2) for (let x = -1.5; x <= 2.1; x += 0.1) diff = Math.max(diff, Math.abs(newtonEval(xs, c, x, N) - newtonEval(xs, c, x, N - 1) - c[N - 1] * omega(xs.slice(0, N - 1), x)));
          info = { ck: c[N - 1], N, miss, diff };
        });
        v.readout(() => `$k=${info.N - 1}$: new coefficient $c_k=f[x_0,\\dots,x_k]=${v.fix(info.ck, 4)}$\n$\\max_i|p_k(x_i)-y_i|=${tsci(info.miss + 1e-30, 2)}$, $\\max|p_k-p_{k-1}-c_k\\omega_k|=${tsci(info.diff + 1e-30, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Interpolation error formula',
      statement: String.raw`Let $f\in C^{n+1}[a,b]$ and let $p$ be its interpolant of degree $\le n$ at distinct nodes $x_0,\dots,x_n\in[a,b]$. For every $x\in[a,b]$ there is a point $\xi=\xi(x)$ in the smallest interval containing $x,x_0,\dots,x_n$ with
$$f(x)-p(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}\,\omega(x),\qquad \omega(x)=\prod_{j=0}^n(x-x_j).$$
Hence $|f(x)-p(x)|\le \dfrac{\max|f^{(n+1)}|}{(n+1)!}\,|\omega(x)|$.`,
      idea: String.raw`Fix $x$ off the nodes and set $g(t)=f(t)-p(t)-\lambda\,\omega(t)$ with $\lambda$ chosen so $g(x)=0$. Then $g$ has $n+2$ zeros ($x$ and the nodes), and repeated use of Rolle's theorem (the mean value theorem, pma-5.10) gives a zero $\xi$ of $g^{(n+1)}=f^{(n+1)}-\lambda(n+1)!$. Solving for $\lambda$ gives the formula. The factor $\omega$ depends only on the nodes — which is why where you place them matters (3.5, 3.8).`,
      caption: String.raw`Choose a function, the degree $n$ and the node family. Top: $f$, its interpolant and the nodes. Bottom: the true error $f-p$ (blue) inside the envelope $\pm M|\omega(x)|/(n+1)!$ (orange), $M=\max|f^{(n+1)}|$; the envelope has the shape of the node polynomial. Drag the gold marker: the readout shows $f^{(n+1)}(\xi)=(n+1)!\,(f-p)/\omega$, which always lands inside the range of $f^{(n+1)}$ on the interval.`,
      deps: ['num-3.2', 'pma-5.10'],
      refs: ['Süli–Mayers ch. 6'],
      tags: ['interpolation', 'error'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polynomial_interpolation#Interpolation_error' },
      viz(v) {
        const FN = {
          sin: { tex: '\\sin 2x', f: (x) => Math.sin(2 * x), d: (k, x) => 2 ** k * Math.sin(2 * x + k * Math.PI / 2) },
          exp: { tex: 'e^{x}', f: Math.exp, d: (k, x) => Math.exp(x) },
          cos: { tex: '\\cos 3x', f: (x) => Math.cos(3 * x), d: (k, x) => 3 ** k * Math.cos(3 * x + k * Math.PI / 2) },
          log: { tex: '\\ln(1.5+x)', f: (x) => Math.log(1.5 + x), d: (k, x) => { let f = 1; for (let i = 2; i < k; i++) f *= i; return (k % 2 ? 1 : -1) * f / (1.5 + x) ** k; } },
        };
        const fsel = v.select('function', Object.entries(FN).map(([k, F]) => ({ value: k, label: `$${F.tex}$` })), 'sin');
        const kind = v.select('nodes', NODEOPTS, 'equi');
        const nn = v.slider('degree $n$', 1, 10, 4, { int: true });
        const s = v.stage({ x: [-1, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'x', height: 250, title: '$f$ and its interpolant' });
        const e = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 250, title: 'error against envelope' });
        const th = e.handle(0.35, 0, { color: 'gold', constrain: 'x', label: 't' });
        let info = {};
        v.legend([['accent', '$f-p$'], ['orange', '$\\pm M|\\omega|/(n+1)!$', { dash: true }]]);
        v.render(() => {
          const F = FN[fsel.value], n = nn.value, xs = nodesOf(kind.value, n), p = interp(xs, xs.map(F.f));
          let M = 0, lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 400; i++) { const x = -1 + i / 200, d = F.d(n + 1, x); M = Math.max(M, Math.abs(d)); lo = Math.min(lo, d); hi = Math.max(hi, d); }
          let fac = 1; for (let i = 2; i <= n + 1; i++) fac *= i;
          const bound = (x) => M * Math.abs(omega(xs, x)) / fac;
          let ymax = 0; for (let i = 0; i <= 200; i++) ymax = Math.max(ymax, bound(-1 + i / 100));
          ymax = Math.max(ymax, 1e-12) * 1.25;
          const ys = linspace(-1, 1, 3).map(F.f), fm = [-1, 1].map(F.f);
          s.setView([-1, 1], [Math.min(-1.2, ...ys) - 0.15, Math.max(1.2, ...ys) + 0.15]);
          s.fn(F.f, { color: 'ink', width: 1.6 });
          s.fn(p, { color: 'accent', width: 2.2 });
          xs.forEach((x) => s.dot(x, F.f(x), { color: 'gold', r: 3.5 }));
          e.setView([-1, 1], [-ymax, ymax]);
          e.hline(0, { color: 'faint' });
          e.fn(bound, { color: 'orange', dash: true, width: 1.5 }); e.fn((x) => -bound(x), { color: 'orange', dash: true, width: 1.5 });
          e.fn((x) => F.f(x) - p(x), { color: 'accent', width: 2.2 });
          xs.forEach((x) => e.dot(x, 0, { color: 'gold', r: 3, hollow: true }));
          const t = th.x, om = omega(xs, t), er = F.f(t) - p(t);
          e.dot(t, er, { color: 'gold', r: 4.5 });
          info = { M, n, xi: Math.abs(om) > 1e-12 ? er * fac / om : null, lo, hi, maxerr: (() => { let m = 0; for (let i = 0; i <= 400; i++) { const x = -1 + i / 200; m = Math.max(m, Math.abs(F.f(x) - p(x))); } return m; })(), maxbound: ymax / 1.25 };
        });
        v.readout(() => `$M=\\max|f^{(${info.n + 1})}|=${tsci(info.M, 3)}$; $\\max|f-p|=${tsci(info.maxerr, 3)}\\le\\max$ envelope $${tsci(info.maxbound, 3)}$\n` + (info.xi === null ? 'marker sits on a node: $f-p=0$' : `at the marker: $(n+1)!\\,(f-p)/\\omega=${v.fix(info.xi, 4)}=f^{(${info.n + 1})}(\\xi)$, and $f^{(${info.n + 1})}$ ranges over $[${v.fix(info.lo, 3)},\\,${v.fix(info.hi, 3)}]$`));
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Phenomenon',
      name: 'Runge phenomenon',
      statement: String.raw`Interpolating $f(x)=1/(1+25x^2)$ on $[-1,1]$ in $n+1$ equispaced nodes does **not** converge as $n\to\infty$: the interpolants stay good near the middle of the interval but oscillate with growing amplitude near the ends, and $\max_{[-1,1]}|f-p_n|\to\infty$ exponentially. Interpolating the same $f$ in Chebyshev points converges geometrically. The cause is the pair of complex poles of $f$ at $\pm i/5$, not any lack of smoothness on the real line.`,
      idea: String.raw`By the error formula (3.4) the error is controlled by $|\omega(x)|$ and by high derivatives of $f$. For equispaced nodes $|\omega|$ is tiny in the middle but much larger near the ends, and $f^{(n+1)}$ of a function with nearby poles grows factorially — their balance fails near the ends. The Hermite formula and potential theory (3.13, 3.14) make this exact: convergence holds only inside a level curve of the node potential, which for equispaced nodes reaches out to about $|x|<0.726$ before the poles at $\pm i/5$ intervene (Runge's own computation, 3.17).`,
      caption: String.raw`Raise $n$: the red equispaced interpolant fits well in the middle but swings wildly near $\pm1$ (the view is clipped; the readout gives the true peak), while the green Chebyshev interpolant converges. On the right the maximum error over $[-1,1]$, computed for every $n\le60$ on a log scale, falls for Chebyshev points and rises for equispaced ones after $n\approx8$.`,
      deps: ['num-3.4'],
      refs: ['Trefethen ATAP ch. 13'],
      credit: 'Runge, 1901',
      scope: String.raw`Observed for the function $1/(1+25x^2)$ and, more generally, for analytic functions with singularities near the interval in the complex plane; equispaced nodes only.`,
      tags: ['interpolation', 'runge', 'divergence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Runge%27s_phenomenon' },
      viz(v) {
        const f = (x) => 1 / (1 + 25 * x * x);
        const show = v.select('show', [{ value: 'both', label: 'both' }, { value: 'equi', label: 'equispaced' }, { value: 'cheb', label: 'Chebyshev' }], 'both');
        const nn = v.slider('degree $n$', 2, 60, 12, { int: true });
        const s = v.stage({ x: [-1, 1], y: [-0.6, 1.4], axes: 'box', gutter: true, xlabel: 'x', height: 340, title: '$f(x)=1/(1+25x^2)$ and interpolants' });
        const e = v.stage({ x: [0, 60], y: [1e-8, 1e12], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', ylabel: 'max |f − pₙ|', height: 340, title: 'maximum error' });
        const eq = [], ch = [];
        for (let n = 1; n <= 60; n++) { const a = equiPts(n), b = chebPts(n); eq.push(maxErr(f, a, baryW(a))); ch.push(maxErr(f, b, chebW(n))); }
        function maxErr(g, xs, w) { const ys = xs.map(g); let m = 0; for (let i = 0; i <= 800; i++) { const x = -1 + i / 400; m = Math.max(m, Math.abs(g(x) - bary(xs, w, ys, x))); } return m; }
        let info = {};
        v.legend([['ink', '$f$'], ['red', 'equispaced'], ['green', 'Chebyshev']]);
        v.render(() => {
          const n = nn.value, a = equiPts(n), b = chebPts(n);
          s.fn(f, { color: 'ink', width: 1.6 });
          if (show.value !== 'cheb') s.fn(interp(a, a.map(f)), { color: 'red', width: 2 });
          if (show.value !== 'equi') s.fn(interp(b, b.map(f)), { color: 'green', width: 2 });
          if (show.value !== 'cheb') a.forEach((x) => s.dot(x, f(x), { color: 'red', r: 2.5 }));
          if (show.value !== 'equi') b.forEach((x) => s.dot(x, f(x), { color: 'green', r: 2.5 }));
          e.path(eq.map((y, i) => [i + 1, y]), { color: 'red', width: 1.8 }); e.path(ch.map((y, i) => [i + 1, y]), { color: 'green', width: 1.8 });
          e.dot(n, eq[n - 1], { color: 'red', r: 4.5 }); e.dot(n, ch[n - 1], { color: 'green', r: 4.5 });
          e.vline(n, { color: 'faint' });
          const pa = interp(a, a.map(f)); let pk = 0; for (let i = 0; i <= 400; i++) pk = Math.max(pk, Math.abs(pa(-1 + i / 200)));
          info = { n, ee: eq[n - 1], ec: ch[n - 1], pk };
        });
        v.readout(() => `$n=${info.n}$: equispaced $\\max|f-p|=${tsci(info.ee, 3)}$ (peak of $|p|$: ${v.fmt(info.pk, 3)}); Chebyshev $\\max|f-p|=${tsci(info.ec, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Chebyshev points',
      statement: String.raw`The **Chebyshev points** (of the second kind) of order $n$ are
$$x_j=\cos\frac{j\pi}{n},\qquad j=0,1,\dots,n,$$
the projections onto $[-1,1]$ of $n+1$ equally spaced points of the upper unit semicircle. They cluster quadratically at the ends: their asymptotic density is $\dfrac{1}{\pi\sqrt{1-x^2}}$, and the gap next to $\pm1$ is about $\pi^2/(2n^2)$ instead of $2/n$.`,
      idea: String.raw`Equal steps in the angle $\theta$ become unequal steps in $x=\cos\theta$, since $dx=-\sin\theta\,d\theta$: where the circle is nearly vertical (near $x=\pm1$) many angles share a short stretch of the axis. Equivalently the points are the extrema of $T_n$ (3.7), and their density is the arcsine density, the equilibrium measure of the interval used in potential theory (3.14). This clustering is exactly what tames the node polynomial near the ends (3.8, 3.11).`,
      caption: String.raw`Raise $n$: the gold points on the axis are the vertical projections of equally spaced points on the semicircle. On the right the histogram of the points follows the density $1/(\pi\sqrt{1-x^2})$ (orange curve), and the faint curve is what equispaced points would give (a constant $1/2$). Switch to the zeros of $T_{n+1}$ to see the other common choice, with the same density.`,
      deps: ['num-3.1'],
      refs: ['Trefethen ATAP ch. 2'],
      tags: ['chebyshev', 'nodes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chebyshev_nodes' },
      viz(v) {
        const nn = v.slider('$n$', 2, 60, 12, { int: true });
        const kind = v.select('points', [{ value: 'ext', label: 'extrema $\\cos(j\\pi/n)$' }, { value: 'zero', label: 'zeros of $T_{n+1}$' }], 'ext');
        const s = v.stage({ x: [-1.2, 1.2], y: [-0.25, 1.15], equal: true, axes: false, height: 300, title: 'project the semicircle' });
        const h = v.stage({ x: [-1, 1], y: [0, 3], axes: 'box', gutter: true, xlabel: 'x', ylabel: 'density', height: 300, title: 'where the points sit' });
        let info = {};
        v.legend([['orange', '$1/(\\pi\\sqrt{1-x^2})$'], ['faint', 'equispaced density $1/2$', { dash: true }]]);
        v.render(() => {
          const n = nn.value, ang = Array.from({ length: n + 1 }, (_, j) => (kind.value === 'ext' ? j * Math.PI / n : (2 * j + 1) * Math.PI / (2 * n + 2)));
          s.curve((t) => [Math.cos(t), Math.sin(t)], 0, Math.PI, { color: 'ink', width: 1.6 });
          s.line(-1.1, 0, 1.1, 0, { color: 'muted' });
          ang.forEach((t, j) => { s.line(Math.cos(t), Math.sin(t), Math.cos(t), 0, { color: 'faint', alpha: 0.7 }); s.dot(Math.cos(t), Math.sin(t), { color: 'accent', r: n > 30 ? 2 : 3 }); s.dot(Math.cos(t), 0, { color: 'gold', r: n > 30 ? 2.5 : 3.8 }); });
          const xs = ang.map(Math.cos);
          h.hist(xs, { bins: 16, range: [-1, 1], density: true, color: 'accent', fillAlpha: 0.3 });
          h.fn((x) => 1 / (Math.PI * Math.sqrt(Math.max(1e-6, 1 - x * x))), { color: 'orange', width: 2, domain: [-0.995, 0.995] });
          h.hline(0.5, { color: 'faint', dash: true });
          const sorted = xs.slice().sort((a, b) => a - b);
          info = { n, gap: sorted[1] - sorted[0], asym: Math.PI ** 2 / (2 * n * n), mid: sorted[Math.floor(n / 2) + 1] - sorted[Math.floor(n / 2)] };
        });
        v.readout(() => `end gap $=${v.fmt(info.gap, 4)}$ (equispaced: $2/n=${v.fmt(2 / info.n, 4)}$; $\\pi^2/2n^2=${v.fmt(info.asym, 4)}$), central gap $\\approx${v.fmt(info.mid, 4)}$ $\\approx\\pi/n$`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Chebyshev polynomials',
      statement: String.raw`The Chebyshev polynomial of degree $n$ is $T_n(x)=\cos(n\arccos x)$ on $[-1,1]$, i.e. $T_n(\cos\theta)=\cos n\theta$. It is a polynomial of degree $n$ with leading coefficient $2^{n-1}$ ($n\ge1$), satisfying $T_0=1$, $T_1=x$, $T_{n+1}=2xT_n-T_{n-1}$. On $[-1,1]$ it has $n$ simple zeros $\cos\frac{(2k-1)\pi}{2n}$ and $n+1$ extrema $T_n(\cos\frac{k\pi}{n})=(-1)^k$ at the Chebyshev points.`,
      idea: String.raw`The identity $\cos(n+1)\theta+\cos(n-1)\theta=2\cos\theta\cos n\theta$ is the three-term recurrence in disguise, and it shows by induction that $\cos n\theta$ is a polynomial in $\cos\theta$. Because $\cos$ is $2\pi$-periodic and even (periodicity of the circle functions, pma-8.7), $\cos n\theta$ oscillates exactly $n$ half-waves on $[0,\pi]$, hitting $\pm1$ alternately at $\theta=k\pi/n$ — the Chebyshev points of 3.6.`,
      caption: String.raw`Left: the cosine wave $\cos n\theta$ on $[0,\pi]$; drag the gold handle $\theta$. Right: the same value is $T_n(x)$ at $x=\cos\theta$ (the gold point moves along the polynomial). Dots mark the $n+1$ extrema at $\pm1$, sitting exactly at the Chebyshev points. Tick "all $T_0..T_n$" to see the whole family, and compare the recurrence with the cosine formula in the readout.`,
      deps: ['num-3.6', 'pma-8.7'],
      refs: ['Trefethen ATAP ch. 3'],
      credit: 'P. L. Chebyshev, 1850s (first used in his work on linkages, published 1854)',
      tags: ['chebyshev', 'orthogonal polynomials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chebyshev_polynomials' },
      viz(v) {
        const nn = v.slider('degree $n$', 0, 12, 6, { int: true });
        const fam = v.toggle('show all $T_0,\\dots,T_n$', false);
        const a = v.stage({ x: [0, Math.PI], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: 'θ', height: 300, xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: '$\\cos n\\theta$' });
        const b = v.stage({ x: [-1, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$T_n(x)$' });
        const ht = a.handle(1.0, 0, { color: 'gold', constrain: 'x', label: 'θ' });
        let info = {};
        v.render(() => {
          const n = nn.value, th = ht.x, x = Math.cos(th);
          a.hline(1, { color: 'faint' }); a.hline(-1, { color: 'faint' });
          a.fn((t) => Math.cos(n * t), { color: 'accent', width: 2.2 });
          for (let k = 0; k <= n; k++) a.dot(n ? k * Math.PI / n : 0, Math.cos(k * Math.PI), { color: 'green', r: 3.5 });
          a.vline(th, { color: 'gold', alpha: 0.5 }); a.dot(th, Math.cos(n * th), { color: 'gold', r: 5 });
          b.hline(1, { color: 'faint' }); b.hline(-1, { color: 'faint' });
          if (fam.value) for (let m = 0; m < n; m++) b.fn((t) => T(m, t), { color: COL[m % 9], width: 1, alpha: 0.55 });
          b.fn((t) => T(n, t), { color: 'accent', width: 2.4 });
          for (let k = 0; k <= n; k++) b.dot(n ? Math.cos(k * Math.PI / n) : 0, Math.cos(k * Math.PI), { color: 'green', r: 3.5 });
          b.vline(x, { color: 'gold', alpha: 0.5 }); b.dot(x, T(n, x), { color: 'gold', r: 5 });
          let lead = 2 ** Math.max(n - 1, 0); info = { n, x, rec: T(n, x), cosv: Math.cos(n * th), lead };
        });
        v.readout(() => `$x=\\cos\\theta=${v.fix(info.x, 4)}$: recurrence gives $T_${info.n}(x)=${v.fix(info.rec, 8)}$, formula $\\cos n\\theta=${v.fix(info.cosv, 8)}$ (difference $${tsci(Math.abs(info.rec - info.cosv) + 1e-30, 2)}$)\n$T_${info.n}$ has leading coefficient $${info.lead}$ and $${info.n + 1}$ extrema equal to $\\pm1$ (green)`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Minimax property of Chebyshev polynomials',
      statement: String.raw`Among all **monic** polynomials $q$ of degree $n\ge1$, the scaled Chebyshev polynomial $2^{1-n}T_n$ has the smallest sup norm on $[-1,1]$:
$$\|q\|_\infty\ \ge\ 2^{1-n}\quad\text{for every monic }q,\qquad\text{with equality iff }q=2^{1-n}T_n.$$
Equivalently, among all choices of $n$ nodes the node polynomial $\omega(x)=\prod(x-x_j)$ is smallest in the max norm when the nodes are the zeros of $T_n$.`,
      idea: String.raw`$2^{1-n}T_n$ is monic and equioscillates: it takes the values $\pm2^{1-n}$ alternately at the $n+1$ Chebyshev points. If some monic $q$ were strictly smaller in norm, then $2^{1-n}T_n-q$ would have degree $\le n-1$ yet change sign between each pair of consecutive extrema, hence have $n$ zeros — impossible unless it vanishes identically. Combined with the error formula (3.4), choosing the zeros of $T_n$ as nodes minimises the worst-case factor $\max|\omega|$.`,
      caption: String.raw`Drag the orange roots of a monic polynomial of degree $n$ (the vertical scale adapts to the polynomial on $[-1,1]$; the grey zones lie outside the interval). The readout gives $\|q\|_\infty$ on $[-1,1]$, which can never fall below $2^{1-n}$ (green band). Press the button to snap the roots to the zeros of $T_n$: the curve then touches the band $n+1$ times with alternating signs; moving any root breaks the equioscillation and raises the norm.`,
      deps: ['num-3.7'],
      refs: ['Süli–Mayers ch. 8'],
      credit: 'P. L. Chebyshev, 1850s',
      tags: ['chebyshev', 'minimax'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chebyshev_polynomials#Minimal_%E2%88%9E-norm' },
      viz(v) {
        const nn = v.slider('degree $n$', 2, 6, 4, { int: true, onChange: () => reset() });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 340, title: 'monic polynomial $q(x)=\\prod(x-r_j)$' });
        const H = Array.from({ length: 6 }, (_, i) => s.handle(0, 0, { color: 'orange', constrain: 'x' }));
        function reset(cheb = false) { const n = nn.value; for (let i = 0; i < 6; i++) { const x = cheb ? -Math.cos((2 * i + 1) * Math.PI / (2 * n)) : -0.8 + 1.6 * i / (n - 1); H[i].set(i < n ? x : 0, 0); } }
        reset();
        v.button('snap to zeros of $T_n$', () => reset(true));
        v.button('equispaced roots', () => reset(false));
        let info = {};
        v.legend([['accent', '$q$'], ['green', '$\\pm2^{1-n}$', { dash: true }]]);
        v.render(() => {
          const n = nn.value; H.forEach((h, i) => { h.visible = i < n; });
          const r = H.slice(0, n).map((h) => h.x), q = (x) => omega(r, x), B = 2 ** (1 - n);
          let nm = 0; const M = 1600, vals = [];
          for (let i = 0; i <= M; i++) { const y = q(-1 + 2 * i / M); vals.push(y); nm = Math.max(nm, Math.abs(y)); }
          const Y = Math.max(nm, B) * 1.35 + 1e-9;
          s.setView([-1.3, 1.3], [-Y, Y]);
          s.vband(-1.3, -1, { color: 'faint', alpha: 0.15 }); s.vband(1, 1.3, { color: 'faint', alpha: 0.15 });
          s.hline(B, { color: 'green', dash: true, width: 1.5 }); s.hline(-B, { color: 'green', dash: true, width: 1.5 });
          s.hline(0, { color: 'faint' });
          s.fn(q, { color: 'accent', width: 2.4, domain: [-1.3, 1.3] });
          r.forEach((x) => s.dot(x, 0, { color: 'orange', r: 0.1, alpha: 0 }));
          let cnt = 0, last = 0;
          for (let i = 0; i <= M; i++) {
            const y = Math.abs(vals[i]), l = i > 0 ? Math.abs(vals[i - 1]) : -1, r = i < M ? Math.abs(vals[i + 1]) : -1;
            if (y >= nm * (1 - 2e-3) && y >= l && y >= r) { const sg = Math.sign(vals[i]); if (sg !== last) { cnt++; last = sg; s.dot(-1 + 2 * i / M, vals[i], { color: 'gold', r: 4 }); } }
          }
          info = { nm, B, n, cnt };
        });
        v.readout(() => `$\\|q\\|_\\infty=${tsci(info.nm, 4)}$ versus the bound $2^{1-n}=${tsci(info.B, 4)}$: ratio $${v.fix(info.nm / info.B, 4)}\\ge1$\n` + (info.nm / info.B < 1.002 ? '**equality: the roots are the zeros of $T_n$ and $q$ equioscillates**' : `the norm is attained at ${info.cnt} alternating extrema; equality needs $n+1$ of them`));
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Algorithm',
      name: 'Barycentric interpolation formula',
      statement: String.raw`With weights $w_j=1/\prod_{k\ne j}(x_j-x_k)$ the interpolant of $y_j$ at distinct nodes is
$$p(x)=\frac{\displaystyle\sum_{j=0}^n \frac{w_j}{x-x_j}\,y_j}{\displaystyle\sum_{j=0}^n\frac{w_j}{x-x_j}}\qquad(x\ne x_j),$$
evaluated in $O(n)$ operations per point after $O(n^2)$ work for the weights. For Chebyshev points $w_j=(-1)^j$, halved at the two end nodes, so the weights are free. For Chebyshev points the evaluation on $[-1,1]$ is numerically stable for any $n$; the monomial route (solve the Vandermonde system, then Horner) is not.`,
      idea: String.raw`Write $p=\omega(x)\sum_j \frac{w_j y_j}{x-x_j}$ (the Lagrange form with the common factor $\omega$ pulled out) and divide by the same formula for the constant $1$: $\omega$ cancels, leaving the quotient above. In floating point the quotient is forward stable when the Lebesgue constant is small (3.11), as it is for Chebyshev points (Higham, 2004). Solving for monomial coefficients is a different matter: the Vandermonde matrix is exponentially ill-conditioned (the condition number of a problem, nla-3.1), so unless the data are very smooth the computed coefficients, and the polynomial built from them, are wrong in many digits.`,
      caption: String.raw`Interpolate in $n+1$ Chebyshev points two ways and compare with a third, independent stable evaluation (the Chebyshev series evaluated by Clenshaw's recurrence). Green: the barycentric formula agrees with the series to about $10^{-15}$. Red: the monomial route (Gaussian elimination on the Vandermonde matrix, then Horner) drifts away from both — for $|x|$, the step and Runge's function by many orders of magnitude, while for the very smooth $e^x$ the error hides because the high coefficients are negligible. Right: the pointwise disagreement at the chosen $n$.`,
      deps: ['num-3.2', 'num-3.6', 'nla-3.1'],
      refs: ['Trefethen ATAP ch. 5'],
      credit: 'Berrut & Trefethen, SIAM Review 46 (2004), advocated the formula; Higham, IMA J. Numer. Anal. 24 (2004), analysed its stability',
      tags: ['barycentric', 'stability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lagrange_polynomial#Barycentric_form' },
      viz(v) {
        const FN = { exp: { tex: 'e^{x}', f: Math.exp }, runge: { tex: '\\tfrac{1}{1+25x^2}', f: (x) => 1 / (1 + 25 * x * x) }, abs: { tex: '|x|', f: Math.abs }, step: { tex: '\\mathrm{sgn}(x+0.1)', f: (x) => Math.sign(x + 0.1) } };
        const fsel = v.select('data from', Object.entries(FN).map(([k, F]) => ({ value: k, label: `$${F.tex}$` })), 'abs');
        const nn = v.slider('degree $n$', 4, 70, 40, { int: true });
        const a = v.stage({ x: [0, 70], y: [1e-17, 1e3], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', ylabel: 'max disagreement', height: 320, title: 'two stable evaluations versus the monomial route' });
        const b = v.stage({ x: [-1, 1], y: [1e-17, 1e3], ylog: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'disagreement', height: 320, title: 'pointwise at degree n' });
        const cache = {};
        const clenshaw = (c, x) => { let b1 = 0, b2 = 0; for (let k = c.length - 1; k >= 1; k--) { const t = 2 * x * b1 - b2 + c[k]; b2 = b1; b1 = t; } return x * b1 - b2 + c[0]; };
        function trio(f, n) {
          const xs = chebPts(n), ys = xs.map(f), w = chebW(n), ca = chebCoeffs(ys);
          const A = xs.map((x) => { const r = []; let p = 1; for (let k = 0; k <= n; k++) { r.push(p); p *= x; } return r; }), c = solveGE(A, ys);
          return { xs, ys, w, ca, c };
        }
        function run(key) {
          if (cache[key]) return cache[key];
          const f = FN[key].f, out = { bar: [], van: [] };
          for (let n = 1; n <= 70; n++) {
            const { xs, ys, w, ca, c } = trio(f, n); let eb = 0, ev = 0;
            for (let i = 0; i <= 200; i++) {
              const x = -1 + i / 100, pb = bary(xs, w, ys, x), cs = clenshaw(ca, x); eb = Math.max(eb, Math.abs(pb - cs));
              if (c) { let h = 0; for (let k = n; k >= 0; k--) h = h * x + c[k]; ev = Math.max(ev, Math.abs(h - pb)); } else ev = Infinity;
            }
            out.bar.push(eb); out.van.push(ev);
          }
          return (cache[key] = out);
        }
        let info = {};
        v.legend([['green', 'barycentric − Chebyshev series'], ['red', 'Vandermonde+Horner − barycentric']]);
        v.render(() => {
          const key = fsel.value, f = FN[key].f, R = run(key), n = nn.value;
          const fl = (y) => Math.max(y, 1e-17);
          a.path(R.bar.map((y, i) => [i + 1, fl(y)]), { color: 'green', width: 2 }); a.path(R.van.map((y, i) => [i + 1, fl(y)]), { color: 'red', width: 2 });
          a.hline(2.2e-16, { color: 'faint', dash: true }); a.vline(n, { color: 'faint' });
          a.dot(n, fl(R.bar[n - 1]), { color: 'green', r: 4.5 }); a.dot(n, fl(R.van[n - 1]), { color: 'red', r: 4.5 });
          const { xs, ys, w, ca, c } = trio(f, n), pb = [], pv = [];
          for (let i = 0; i <= 300; i++) { const x = -1 + i / 150, q = bary(xs, w, ys, x); pb.push([x, fl(Math.abs(q - clenshaw(ca, x)))]); if (c) { let h = 0; for (let k = n; k >= 0; k--) h = h * x + c[k]; pv.push([x, fl(Math.abs(h - q))]); } }
          b.path(pv, { color: 'red', width: 1.3 }); b.path(pb, { color: 'green', width: 1.3 });
          info = { n, eb: R.bar[n - 1], ev: R.van[n - 1] };
        });
        v.readout(() => `$n=${info.n}$: barycentric versus Chebyshev series $${tsci(info.eb, 2)}$; Vandermonde route versus barycentric $${tsci(info.ev, 2)}$\n(dashed line: machine epsilon $2.2\\times10^{-16}$; differences below $10^{-17}$ are drawn on the floor)`);
      },
    },
  ],
};
