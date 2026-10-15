// Rudin, Real and Complex Analysis — Chapter 5: Examples of Banach Space Techniques
// Part 1: Banach spaces and Baire's theorem (5.1–5.7). Later parts: ch05-a2.js … ch05-a5.js.

const P_OPTS = [
  { value: '1', label: '$p=1$' },
  { value: '2', label: '$p=2$' },
  { value: 'inf', label: '$p=\\infty$' },
];
const pOf = (s) => (s === 'inf' ? Infinity : +s);

// Baire construction (5.6): E_n = a family of parallel lines {x : <x,u_n> ∈ o_n + s_n Z}.
function lineFamily(n) {
  const th = 0.35 + n * 2.39996323;
  const s = 0.34 * Math.pow(0.47, n - 1);
  const o = (((n * 0.6180339887) % 1) + 1) % 1 * s;
  return { u: [Math.cos(th), Math.sin(th)], t: [-Math.sin(th), Math.cos(th)], s, o };
}
// distance from the coordinate tau to the lattice o + sZ
const latticeDist = (tau, F) => { const r = (((tau - F.o) % F.s) + F.s) % F.s; return Math.min(r, F.s - r); };
// one step of the proof: inside the ball (c, r) pick a closed ball that misses the family F
function baireStep(c, r, F) {
  const tau = c[0] * F.u[0] + c[1] * F.u[1];
  const k = Math.floor((tau - F.o) / F.s);
  const mids = [F.o + F.s * (k - 0.5), F.o + F.s * (k + 0.5), F.o + F.s * (k + 1.5)];
  let best = null;
  for (const m of mids) if (Math.abs(m - tau) <= r / 2 && (best == null || Math.abs(m - tau) < Math.abs(best - tau))) best = m;
  let tau2;
  if (best != null) tau2 = best;
  else { const rr = (((tau - F.o) % F.s) + F.s) % F.s; tau2 = rr < F.s / 2 ? tau + r / 2 : tau - r / 2; }
  const c2 = [c[0] + (tau2 - tau) * F.u[0], c[1] + (tau2 - tau) * F.u[1]];
  const d = latticeDist(tau2, F);
  return { c: c2, r: Math.min(0.45 * r, 0.8 * d), d };
}

export default {
  collection: 'rca',
  chapter: 5,
  title: 'Examples of Banach Space Techniques',
  summary: String.raw`What completeness buys. Baire's theorem — a complete metric space is never a countable union of nowhere dense sets — yields the uniform boundedness principle and the open mapping theorem, and these settle two concrete questions about Fourier series: some continuous functions have divergent Fourier series, and the Fourier coefficients of $L^1$ functions do not fill out $c_0$. The Hahn–Banach theorem then supplies enough bounded linear functionals to detect closures and norms, and the chapter ends by deriving the Poisson integral of the disc from nothing more than the maximum modulus property, Hahn–Banach and the Riesz representation theorem.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Definition',
      name: 'Normed linear space; Banach space',
      credit: 'Banach, 1922',
      statement: String.raw`A **normed linear space** is a complex (or real) vector space $X$ together with a function $x\mapsto\norm{x}\in[0,\infty)$ such that for all $x,y\in X$ and scalars $\alpha$:
(a) $\norm{x+y}\le\norm{x}+\norm{y}$;
(b) $\norm{\alpha x}=\abs{\alpha}\,\norm{x}$;
(c) $\norm{x}=0$ only when $x=0$.
Then $d(x,y)=\norm{x-y}$ is a metric on $X$. If $X$ is complete in this metric (every Cauchy sequence converges), $X$ is called a **Banach space**. Hilbert spaces, $L^p(\mu)$ for $1\le p\le\infty$, and $C_0(X)$ with the supremum norm are Banach spaces.`,
      idea: String.raw`Homogeneity (b) makes the whole space a scaled copy of the closed unit ball $\{\norm{x}\le1\}$, and given (b) the triangle inequality (a) is equivalent to that ball being convex: $\frac{x+y}{\norm{x}+\norm{y}}$ is a convex combination of the unit vectors $x/\norm{x}$ and $y/\norm{y}$. Completeness is the extra hypothesis that every Baire-category argument of this chapter needs.`,
      caption: String.raw`Drag $x$ and $y$ and change $p$. The shaded region is the unit ball of $\norm{\cdot}_p$ on $\R^2$; the marked point $\frac{x+y}{\norm{x}+\norm{y}}$ lies on the chord between $x/\norm{x}$ and $y/\norm{y}$, and the triangle inequality holds exactly when it stays inside the ball. For $p=\tfrac12$ the ball is not convex and the inequality fails.`,
      deps: ['pma-3.12'],
      see: ['pma-3.11', 'fa-1.2'],
      tags: ['Banach space', 'norm'],
      viz(v) {
        const M = v.M;
        const sel = v.select('$\\|\\cdot\\|_p$ on $\\R^2$', [
          { value: '0.5', label: '$p=\\tfrac12$' }, { value: '1', label: '$p=1$' }, { value: '1.5', label: '$p=\\tfrac32$' },
          { value: '2', label: '$p=2$' }, { value: '4', label: '$p=4$' }, { value: 'inf', label: '$p=\\infty$' },
        ], '2');
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.55, 2.05], equal: true, height: 380, weight: 2.2, title: 'unit ball of $\\|\\cdot\\|_p$ and the vectors $x$, $y$, $x+y$' });
        const B = v.stage({ x: [0.3, 2.7], y: [0, 3], height: 528, axes: 'box', weight: 1, minWidth: 170, xticks: [], title: 'triangle inequality' });
        const hx = S.handle(1.15, 0.12, { color: 'blue', label: 'x' });
        const hy = S.handle(-0.4, 0.95, { color: 'purple', label: 'y' });
        let st = null;
        v.render(() => {
          const p = pOf(sel.value);
          const N = (a) => M.norm(a, p);
          const x = [hx.x, hx.y], y = [hy.x, hy.y], s = [x[0] + y[0], x[1] + y[1]];
          const nx = N(x), ny = N(y), ns = N(s);
          const ok = ns <= nx + ny + 1e-9;
          const ball = M.unitBall(p, 480);
          S.poly(ball, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.8 });
          S.path([[0, 0], x, s, y, [0, 0]], { color: 'faint', width: 1.2, dash: [4, 4] });
          S.arrow(0, 0, x[0], x[1], { color: 'blue', width: 2 });
          S.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2 });
          S.arrow(0, 0, s[0], s[1], { color: ok ? 'green' : 'red', width: 2.6 });
          S.tex('x+y', s[0], s[1], { color: ok ? 'green' : 'red', align: 'left', baseline: 'bottom', dx: 6, dy: -4 });
          if (nx > 1e-6 && ny > 1e-6) {
            const xu = [x[0] / nx, x[1] / nx], yu = [y[0] / ny, y[1] / ny];
            const m = [s[0] / (nx + ny), s[1] / (nx + ny)];
            S.line(xu[0], xu[1], yu[0], yu[1], { color: 'orange', width: 1.8, dash: [5, 3] });
            S.dot(xu[0], xu[1], { color: 'blue', r: 3.5 });
            S.dot(yu[0], yu[1], { color: 'purple', r: 3.5 });
            S.dot(m[0], m[1], { color: ok ? 'green' : 'red', r: 5.5 });
          }
          S.tex('\\{\\|z\\|_p\\le 1\\}', -1.2, -1.25, { color: 'accent', size: 14, align: 'right' });
          S.corner(p < 1 ? 'p < 1: ball not convex — not a norm' : 'p ≥ 1: convex ball — a norm', 'tl', { color: p < 1 ? 'red' : 'green', weight: 600 });
          // bars: ||x|| + ||y|| stacked against ||x+y||
          const top = Math.max(nx + ny, ns);
          B.setView(null, [0, Math.max(1, top * 1.25)]);
          B.rect(0.7, 0, 1.3, nx, { fill: 'blue', fillAlpha: 0.7, stroke: false });
          B.rect(0.7, nx, 1.3, nx + ny, { fill: 'purple', fillAlpha: 0.7, stroke: false });
          B.rect(1.7, 0, 2.3, ns, { fill: ok ? 'green' : 'red', fillAlpha: 0.75, stroke: false });
          B.hline(nx + ny, { color: 'ink', width: 1, dash: [4, 4] });
          B.tex('\\|x\\|', 1, nx / 2, { color: 'ink', size: 13 });
          B.tex('\\|y\\|', 1, nx + ny / 2, { color: 'ink', size: 13 });
          B.tex('\\|x\\|+\\|y\\|', 1, nx + ny, { color: 'ink', baseline: 'bottom', dy: -5, size: 14 });
          B.tex('\\|x+y\\|', 2, ns, { color: ok ? 'green' : 'red', baseline: 'bottom', dy: -5, size: 14 });
          st = { nx, ny, ns, ok };
        });
        v.legend([['accent', 'unit ball', { area: true }], ['orange', 'chord from $x/\\|x\\|$ to $y/\\|y\\|$', { dash: true }], ['green', '$\\frac{x+y}{\\|x\\|+\\|y\\|}$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$\\|x\\| = ${v.fix(st.nx, 3)}$, $\\;\\|y\\| = ${v.fix(st.ny, 3)}$, $\\;\\|x+y\\| = ${v.fix(st.ns, 3)} ${st.ok ? '\\le' : '>'} ${v.fix(st.nx + st.ny, 3)} = \\|x\\|+\\|y\\|$` + (st.ok ? '' : ' — the triangle inequality fails.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Definition',
      name: 'Bounded linear transformation and its norm',
      statement: String.raw`Let $X$ and $Y$ be normed linear spaces and $\Lambda:X\to Y$ linear. Its **norm** is
$$\norm{\Lambda}=\sup\{\norm{\Lambda x}:x\in X,\ \norm{x}\le1\}.$$
If $\norm{\Lambda}<\infty$, $\Lambda$ is a **bounded linear transformation**; then $\norm{\Lambda x}\le\norm{\Lambda}\,\norm{x}$ for all $x$, i.e. $\Lambda$ maps the closed unit ball of $X$ into the closed ball of radius $\norm{\Lambda}$ in $Y$. When $Y$ is the scalar field, $\Lambda$ is a **bounded linear functional**.`,
      idea: String.raw`$\norm{\Lambda}$ is the smallest $M$ with $\norm{\Lambda x}\le M\norm{x}$ for every $x$: by homogeneity it is enough to test unit vectors. The bounded linear functionals on $X$ form the dual space, itself a normed space under this norm.`,
      caption: String.raw`A $2\times2$ matrix acts on $\R^2$ with the $\ell^p$ norm on both sides. Drag the images $\Lambda e_1$, $\Lambda e_2$ (right) and the vector $x$ (left). The image of the unit ball is the blue region; the orange circle of radius $\norm{\Lambda}$ is the smallest ball about $0$ containing it, touching at $\Lambda u^*$ where $u^*$ is a maximising unit vector.`,
      deps: ['rca-5.1'],
      see: ['fa-1.32', 'fa-4.1'],
      tags: ['operator norm', 'linear functional'],
      viz(v) {
        const M = v.M;
        const sel = v.select('norm on $\\R^2$', P_OPTS, '1');
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, height: 320, title: 'domain: unit ball of $X$' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 320, title: 'target: $\\Lambda(\\text{unit ball})$ and radius $\\|\\Lambda\\|$' });
        const xh = L.handle(0.55, 0.42, { color: 'gold', label: 'x' });
        const c1 = R.handle(1.25, 0.35, { color: 'blue' });
        const c2 = R.handle(-0.45, 0.95, { color: 'purple' });
        let st = null;
        v.render(() => {
          const p = pOf(sel.value);
          const A = [[c1.x, c2.x], [c1.y, c2.y]];
          const N = (a) => M.norm(a, p);
          let op;
          if (p === 1) op = Math.max(Math.abs(A[0][0]) + Math.abs(A[1][0]), Math.abs(A[0][1]) + Math.abs(A[1][1]));
          else if (p === Infinity) op = Math.max(Math.abs(A[0][0]) + Math.abs(A[0][1]), Math.abs(A[1][0]) + Math.abs(A[1][1]));
          else op = M.svd2(A)[0];
          const ball = M.unitBall(p, 720);
          const img = ball.map((u) => M.matVec(A, u));
          const k = M.argmax(img, (w) => N(w));
          const us = ball[k], ws = img[k];
          // domain
          L.poly(ball, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.6 });
          L.arrow(0, 0, 1, 0, { color: 'blue', width: 1.6, head: 7 });
          L.arrow(0, 0, 0, 1, { color: 'purple', width: 1.6, head: 7 });
          L.tex('e_1', 1, 0, { color: 'blue', align: 'right', baseline: 'top', dx: -6, dy: 5 });
          L.tex('e_2', 0, 1, { color: 'purple', align: 'right', baseline: 'top', dx: -6, dy: 4 });
          L.arrow(0, 0, us[0], us[1], { color: 'orange', width: 1.6, head: 7 });
          L.dot(us[0], us[1], { color: 'orange', r: 4.5, label: 'u*', labelPos: us[0] >= 0 ? 'ne' : 'nw' });
          // target
          R.ball(0, 0, op, { p, fill: 'orange', fillAlpha: 0.07, color: 'orange', width: 1.6, dash: [6, 4] });
          R.poly(img, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 1.8 });
          R.arrow(0, 0, c1.x, c1.y, { color: 'blue', width: 1.6 });
          R.arrow(0, 0, c2.x, c2.y, { color: 'purple', width: 1.6 });
          R.tex('\\Lambda e_1', c1.x, c1.y, { color: 'blue', align: 'left', baseline: 'bottom', dx: 8, dy: -6 });
          R.tex('\\Lambda e_2', c2.x, c2.y, { color: 'purple', align: 'right', baseline: 'bottom', dx: -8, dy: -6 });
          R.dot(ws[0], ws[1], { color: 'orange', r: 5, label: 'Λu*', labelPos: ws[0] >= 0 ? 'se' : 'sw' });
          const lx = M.matVec(A, [xh.x, xh.y]);
          R.arrow(0, 0, lx[0], lx[1], { color: 'gold', width: 2 });
          R.dot(lx[0], lx[1], { color: 'gold', r: 4.5, label: 'Λx', labelPos: 'ne' });
          L.arrow(0, 0, xh.x, xh.y, { color: 'gold', width: 2 });
          st = { op, nx: N([xh.x, xh.y]), nlx: N(lx), A };
        });
        v.readout(() => {
          if (!st) return '';
          const a = st.A;
          return `$\\Lambda = \\begin{pmatrix} ${v.fix(a[0][0], 2)} & ${v.fix(a[0][1], 2)} \\\\ ${v.fix(a[1][0], 2)} & ${v.fix(a[1][1], 2)} \\end{pmatrix}$, $\\;\\|\\Lambda\\| = ${v.fix(st.op, 3)}$, $\\;\\|\\Lambda x\\| = ${v.fix(st.nlx, 3)} \\le \\|\\Lambda\\|\\,\\|x\\| = ${v.fix(st.op * st.nx, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Theorem',
      name: 'Bounded ⇔ continuous for linear maps',
      statement: String.raw`Let $\Lambda$ be a linear transformation of a normed linear space $X$ into a normed linear space $Y$. The following are equivalent:
(a) $\Lambda$ is bounded;
(b) $\Lambda$ is continuous;
(c) $\Lambda$ is continuous at one point of $X$.`,
      idea: String.raw`(a)⇒(b): $\norm{\Lambda x_1-\Lambda x_2}\le\norm{\Lambda}\norm{x_1-x_2}$, so $\Lambda$ is even Lipschitz. (b)⇒(c) is trivial. (c)⇒(a): linearity transports continuity at $x_0$ to continuity at $0$, since $\Lambda(x_0+h)-\Lambda x_0=\Lambda h$; a ball $\norm{h}\le\delta$ is then mapped into the unit ball, and scaling gives $\norm{\Lambda}\le1/\delta$.`,
      caption: String.raw`$X$ is $C^1[0,1]$ with the sup norm (completeness is not needed here). The functions $f_n=g+h_n$, $h_n(x)=\sin(n^2x)/n$, converge uniformly to $g$. For $\Lambda f=\int_0^1 f$ the values $\Lambda f_n$ converge to $\Lambda g$; for $\Lambda f=f'(0)$ they run off to infinity — the steep tangent at $0$ — and this happens at every base point $g$, exactly as (c)⇒(b) predicts.`,
      deps: ['rca-5.2'],
      see: ['fa-1.32'],
      tags: ['continuity', 'linear functional'],
      viz(v) {
        const mode = v.select('', [{ value: 'int', label: '$\\Lambda f=\\int_0^1 f$' }, { value: 'der', label: "$\\Lambda f=f'(0)$" }], 'der');
        const base = v.select('$g$', [{ value: 'zero', label: '$0$' }, { value: 'bump', label: 'bump' }, { value: 'wave', label: 'wave' }], 'bump');
        const nS = v.slider('$n$', 1, 14, 8, { int: true });
        const G = {
          zero: { f: () => 0, d: () => 0 },
          bump: { f: (x) => 0.7 * Math.exp(-(((x - 0.55) / 0.2) ** 2)) + 0.1, d: (x) => 0.7 * Math.exp(-(((x - 0.55) / 0.2) ** 2)) * (-2 * (x - 0.55) / 0.04) },
          wave: { f: (x) => 0.35 * Math.sin(2 * Math.PI * x) + 0.35, d: (x) => 0.35 * 2 * Math.PI * Math.cos(2 * Math.PI * x) },
        };
        const top = v.stage({ x: [-0.03, 1.03], y: [-1.05, 1.55], height: 260, full: true, axes: 'box', title: '$f_n=g+h_n$ inside the band $\\|f-g\\|_\\infty\\le 1/n$' });
        const bot = v.stage({ x: [0.3, 14.7], y: [0, 1], height: 190, full: true, axes: 'box', title: '$|\\Lambda f_k-\\Lambda g| = |\\Lambda h_k|$ for $k=1,\\dots,n$' });
        const Lh = (m, k) => (m === 'int' ? (1 - Math.cos(k * k)) / (k * k * k) : k);
        let st = null;
        v.render(() => {
          const m = mode.value, g = G[base.value], n = nS.value;
          const h = (x) => Math.sin(n * n * x) / n;
          const f = (x) => g.f(x) + h(x);
          const gs = v.M.linspace(0, 1, 101).map(g.f);
          const yTop = Math.max(...gs) + 1 / n + 0.18;
          top.setView(null, [Math.min(...gs) - 1 / n - 0.12, yTop]);
          top.between((x) => g.f(x) + 1 / n, (x) => g.f(x) - 1 / n, 0, 1, { fill: 'accent', fillAlpha: 0.12 });
          top.fn((x) => g.f(x) + 1 / n, { domain: [0, 1], color: 'accent', width: 1, dash: [4, 4] });
          top.fn((x) => g.f(x) - 1 / n, { domain: [0, 1], color: 'accent', width: 1, dash: [4, 4] });
          top.fn(g.f, { domain: [0, 1], color: 'ink', width: 2.4 });
          top.fn(f, { domain: [0, 1], color: 'gold', width: 1.8, n: 2400 });
          if (m === 'der') {
            const sl = g.d(0) + n, x1 = Math.min(0.12, 0.7 * (yTop - f(0)) / Math.abs(sl));
            top.line(0, f(0), x1, f(0) + sl * x1, { color: 'red', width: 2.4 });
            top.tex(`f_n'(0) = ${v.fmt(sl, 3)}`, x1, f(0) + sl * x1, { color: 'red', align: 'left', dx: 6, size: 14 });
          } else {
            top.fn(f, { domain: [0, 1], fill: 'gold', fillAlpha: 0.1, base: 0, stroke: false, color: 'gold' });
          }
          top.tex('g', 0.97, g.f(0.97), { color: 'ink', align: 'left', dx: 6 });
          top.tex('f_n', 0.3, f(0.3) + 0.2, { color: 'gold' });
          const vals = [];
          for (let k = 1; k <= n; k++) vals.push(Math.abs(Lh(m, k)));
          const ymax = m === 'der' ? 15.5 : 1.1;
          bot.setView(null, [-0.13 * ymax, ymax]);
          bot.bars(vals, { color: m === 'der' ? 'red' : 'green' });
          if (m === 'int') {
            bot.fn((k) => 1 / k, { domain: [0.6, 14.7], color: 'accent', width: 1.6, dash: [5, 4] });
            bot.text('bound ‖Λ‖·‖h_k‖ = 1/k', 3.2, 0.42, { color: 'accent', size: 12 });
          } else {
            bot.fn((k) => 1 / k, { domain: [0.6, 14.7], color: 'accent', width: 1.6, dash: [5, 4] });
            bot.text('‖h_k‖ = 1/k → 0', 11.2, 2.0, { color: 'accent', size: 12 });
          }
          bot.corner(m === 'der' ? 'unbounded: ‖Λ‖ = ∞, discontinuous everywhere' : 'bounded: ‖Λ‖ = 1, continuous', 'tl', { color: m === 'der' ? 'red' : 'green', weight: 600 });
          st = { m, n, d: Lh(m, n) };
        });
        v.legend([['ink', 'base point $g$'], ['gold', '$f_n=g+h_n$'], ['accent', 'band of radius $1/n$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$\\|f_n-g\\|_\\infty = 1/n = ${v.fix(1 / st.n, 3)}$, $\\quad\\Lambda f_n-\\Lambda g = \\Lambda h_n = ${v.fmt(st.d, 4)}$` +
            (st.m === 'der' ? ' — grows like $n$, so $\\Lambda$ is not continuous at $g$.' : ' — at most $1/n$, so $\\Lambda f_n\\to\\Lambda g$.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Theorem',
      name: "Baire's theorem",
      credit: 'Baire, 1899',
      statement: String.raw`If $X$ is a complete metric space, then the intersection of every countable collection of dense open subsets of $X$ is dense in $X$.`,
      idea: String.raw`Let $V_1,V_2,\dots$ be dense and open and let $W\ne\emptyset$ be open. Since $V_1$ is dense, $W\cap V_1$ is a nonempty open set and contains a closed ball $\bar B_1$ of radius $<1$; inductively choose $\bar B_n\subset B_{n-1}\cap V_n$ with radius $<1/n$. The centres form a Cauchy sequence; completeness gives a limit $x$, which lies in every $\bar B_n$, hence in $W\cap\bigcap_n V_n$.`,
      caption: String.raw`Here $X=\R^2$ and $V_n$ is the complement of $E_n$, a family of parallel lines (closed, nowhere dense; each $E_n$ is drawn only inside the ball where it matters). Drag the open set $W$ and step $N$: each new closed ball sits inside the previous one and misses $E_N$. The right panel zooms into the last step. The shrinking balls close down on a point of $W$ that avoids every $E_n$, although $\bigcup_n E_n$ is dense.`,
      deps: ['pma-3.12', 'pma-3.11'],
      see: ['fa-2.2', 'pma-3.10'],
      tags: ['Baire category', 'completeness'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-1.55, 1.55], y: [-1.12, 1.12], equal: true, height: 340, axes: false, title: '$W$ and the nested balls $\\bar B_1\\supset\\bar B_2\\supset\\cdots$' });
        const Z = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, axes: false, title: 'zoom into $B_{N-1}$: choosing $\\bar B_N$ off $E_N$' });
        const w = L.handle(-0.2, 0.05, { color: 'blue', r: 5.5 });
        const rho = v.slider('radius of $W$', 0.3, 1.05, 0.95, { step: 0.01 });
        const NS = v.slider('step $N$', 1, 10, 4, { int: true });
        let st = null;
        // draw the lines of family F clipped to the disc (c, r)
        const chords = (S, F, c, r, style) => {
          const tau = c[0] * F.u[0] + c[1] * F.u[1];
          const k0 = Math.ceil((tau - r - F.o) / F.s), k1 = Math.floor((tau + r - F.o) / F.s);
          for (let k = k0; k <= k1 && k - k0 < 400; k++) {
            const a = F.o + F.s * k - tau, hl = Math.sqrt(Math.max(0, r * r - a * a));
            const p = [c[0] + a * F.u[0], c[1] + a * F.u[1]];
            S.line(p[0] - hl * F.t[0], p[1] - hl * F.t[1], p[0] + hl * F.t[0], p[1] + hl * F.t[1], style);
          }
        };
        v.render(() => {
          const N = NS.value;
          const balls = [{ c: [w.x, w.y], r: rho.value }];
          for (let n = 1; n <= N; n++) { const b = balls[n - 1]; balls.push(baireStep(b.c, b.r, lineFamily(n))); }
          const xs = balls[N].c;
          // left panel
          L.circle(w.x, w.y, rho.value, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.8 });
          for (let n = 1; n <= N; n++) chords(L, lineFamily(n), balls[n - 1].c, balls[n - 1].r, { color: n === N ? 'red' : 'muted', width: n === N ? 1.3 : 0.9, alpha: n === N ? 0.85 : 0.55 });
          for (let n = 1; n <= N; n++) L.circle(balls[n].c[0], balls[n].c[1], balls[n].r, { color: n === N ? 'green' : 'orange', width: n === N ? 2.2 : 1.5, fill: n === N ? 'green' : null, fillAlpha: 0.15 });
          L.dot(xs[0], xs[1], { color: 'green', r: 3 });
          const b1 = balls[1];
          L.tex('\\bar B_1', b1.c[0] - b1.r * 0.75, b1.c[1] + b1.r * 0.75, { color: 'orange', align: 'right', baseline: 'bottom', size: 14 });
          L.tex('W', w.x + rho.value * 0.74, w.y + rho.value * 0.74, { color: 'blue', align: 'left', baseline: 'bottom', size: 16 });
          // zoom panel on B_{N-1}
          const P = balls[N - 1], Q = balls[N];
          Z.setView([P.c[0] - 1.12 * P.r, P.c[0] + 1.12 * P.r], [P.c[1] - 1.12 * P.r, P.c[1] + 1.12 * P.r]);
          Z.circle(P.c[0], P.c[1], P.r, { color: N === 1 ? 'blue' : 'orange', width: 2, fill: N === 1 ? 'blue' : 'orange', fillAlpha: 0.06 });
          chords(Z, lineFamily(N), P.c, 1.6 * P.r, { color: 'red', width: 1.3, alpha: 0.8 });
          Z.circle(Q.c[0], Q.c[1], Q.r, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.18 });
          Z.arrow(P.c[0], P.c[1], Q.c[0], Q.c[1], { color: 'ink', width: 1.4, head: 7 });
          Z.dot(P.c[0], P.c[1], { color: 'ink', r: 3 });
          Z.tex(N === 1 ? 'W' : `B_{${N - 1}}`, P.c[0] - 0.72 * P.r, P.c[1] + 0.72 * P.r, { color: N === 1 ? 'blue' : 'orange', align: 'right', baseline: 'bottom', size: 15 });
          Z.tex(`\\bar B_{${N}}`, Q.c[0], Q.c[1] - Q.r, { color: 'green', baseline: 'top', dy: 4, size: 15 });
          Z.tex(`E_{${N}}`, P.c[0] + 1.02 * P.r, P.c[1] - 1.0 * P.r, { color: 'red', align: 'right', baseline: 'bottom', size: 15 });
          // distances of the limit candidate to every family
          let dmin = Infinity;
          for (let n = 1; n <= N; n++) { const F = lineFamily(n); dmin = Math.min(dmin, latticeDist(xs[0] * F.u[0] + xs[1] * F.u[1], F)); }
          st = { N, r: Q.r, xs, dmin, inW: M.dist(xs, [w.x, w.y]) < rho.value };
        });
        v.legend([['blue', 'open set $W$', { area: true }], ['red', '$E_N$ (closed, nowhere dense)'], ['orange', 'earlier balls'], ['green', '$\\bar B_N\\subset B_{N-1}\\cap V_N$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `radius of $\\bar B_{${st.N}}$: $${v.fmt(st.r, 3)}$; its centre $(${v.fix(st.xs[0], 4)},\\,${v.fix(st.xs[1], 4)})$ lies in $W$ and at distance $\\ge ${v.fmt(st.dmin, 3)} > 0$ from $E_1\\cup\\dots\\cup E_{${st.N}}$. Completeness makes the centres converge.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Definition',
      name: 'Nowhere dense sets, category, dense Gδ',
      credit: 'Baire, 1899',
      statement: String.raw`Let $X$ be a metric space. A set $E\subset X$ is **nowhere dense** if its closure contains no nonempty open set. A countable union of nowhere dense sets is **of the first category** in $X$; every other subset is **of the second category**. A **$G_\delta$** is a countable intersection of open sets. In this language Baire's theorem says: in a complete metric space the complement of a set of the first category is dense, a countable intersection of dense $G_\delta$'s is again a dense $G_\delta$, and the space itself is of the second category.`,
      idea: String.raw`$E$ is nowhere dense exactly when $X\setminus\bar E$ is a dense open set, so complements of first-category sets contain countable intersections of dense open sets — the sets Baire's theorem controls. Category and measure are independent notions of size: a dense $G_\delta$ can have measure zero.`,
      caption: String.raw`On $[0,1]$, $V_n$ is a union of open intervals centred at the rationals $q_k$ (radius $\eps_n/k^{1.2}$; each pixel column is shaded by the fraction of it the set covers). Each $V_n$ is open and dense, yet its total length is tiny; the bottom row shows $V_1\cap\dots\cap V_N$. The limit $G=\bigcap V_n$ is a dense $G_\delta$ of measure $0$ — topologically large, metrically negligible. Drag the window to zoom.`,
      deps: ['rca-5.6'],
      see: ['fa-2.1', 'fa-2.2'],
      verify: true,
      tags: ['Baire category', 'G-delta'],
      viz(v) {
        // rationals in [0,1] ordered by denominator
        const Q = [];
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        for (let d = 1; d <= 70; d++) for (let a = 0; a <= d; a++) if (gcd(a, d) === 1) Q.push(a / d);
        const NS = v.slider('$N$', 1, 6, 4, { int: true });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.6, 7.45], height: 230, full: true, axes: false, title: 'the dense open sets $V_n$ on $[0,1]$' });
        const zoom = v.stage({ x: [0, 1], y: [-0.6, 7.45], height: 230, full: true, axes: false, title: 'zoom into the orange window' });
        const hz = top.handle(0.4142, -0.35, { color: 'orange', r: 6, constrain: (x) => [Math.min(0.98, Math.max(0.02, x)), -0.35] });
        const eps = (n) => 0.04 * Math.pow(0.35, n - 1);
        const ivals = (n) => Q.map((q, k) => [q - eps(n) / Math.pow(k + 1, 1.2), q + eps(n) / Math.pow(k + 1, 1.2)]);
        // union length of a list of intervals within [0,1]
        const unionLen = (I) => {
          const J = I.map(([a, b]) => [Math.max(0, a), Math.min(1, b)]).filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
          let tot = 0, cur = null;
          for (const [a, b] of J) { if (!cur || a > cur[1]) { if (cur) tot += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); }
          if (cur) tot += cur[1] - cur[0];
          return tot;
        };
        const intersect = (A, B) => {
          const out = []; let i = 0, j = 0;
          while (i < A.length && j < B.length) {
            const lo = Math.max(A[i][0], B[j][0]), hi = Math.min(A[i][1], B[j][1]);
            if (hi > lo) out.push([lo, hi]);
            if (A[i][1] < B[j][1]) i++; else j++;
          }
          return out;
        };
        const merge = (I) => {
          const J = I.slice().sort((p, q) => p[0] - q[0]); const out = [];
          for (const [a, b] of J) { if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }
          return out;
        };
        let st = null;
        // honest rendering: each pixel column is shaded by the fraction of it covered by the set
        const coverRow = (S, I, x0, x1, y, hh, color) => {
          const W = Math.max(1, Math.round(S.width)), dx = (x1 - x0) / W, cov = new Float32Array(W);
          for (const [a, b] of I) {
            if (b <= x0 || a >= x1) continue;
            const lo = Math.max(a, x0), hi = Math.min(b, x1);
            const i0 = Math.max(0, Math.floor((lo - x0) / dx)), i1 = Math.min(W - 1, Math.floor((hi - x0) / dx));
            for (let i = i0; i <= i1; i++) { const cl = x0 + i * dx; cov[i] += Math.max(0, Math.min(hi, cl + dx) - Math.max(lo, cl)) / dx; }
          }
          const ctx = S.ctx, Y0 = S.Y(y + hh), Y1 = S.Y(y - hh), LEV = 12;
          const buckets = Array.from({ length: LEV + 1 }, () => []);
          for (let i = 0; i < W; i++) if (cov[i] > 0) buckets[Math.min(LEV, Math.ceil(Math.min(1, cov[i]) * LEV))].push(i);
          buckets.forEach((cols, lev) => {
            if (!cols.length) return;
            ctx.beginPath();
            for (const i of cols) { const X0 = S.X(x0 + i * dx); ctx.rect(X0, Y0, Math.max(1, S.X(x0 + (i + 1) * dx) - X0), Y1 - Y0); }
            ctx.fillStyle = v.color(color, 0.1 + 0.85 * lev / LEV); ctx.fill();
          });
        };
        const rowY = (i, N) => 6.4 - i * (5.2 / Math.max(N, 1));
        const drawRows = (S, rows, inter, N, x0, x1, lens) => {
          rows.forEach((I, i) => {
            const y = rowY(i, N);
            S.line(x0, y, x1, y, { color: 'faint', width: 1 });
            coverRow(S, I, x0, x1, y, 0.24, 'accent');
            S.tex(`V_${i + 1}`, x0, y + 0.24, { color: 'accent', align: 'left', baseline: 'bottom', dx: 4, dy: -1, size: 13 });
            if (lens) S.tex(`m(V_${i + 1}) = ${v.fmt(lens[i], 3)}`, x1, y + 0.24, { color: 'muted', align: 'right', baseline: 'bottom', dx: -6, dy: -1, size: 12 });
          });
          const y = 0.45;
          S.line(x0, y, x1, y, { color: 'faint', width: 1 });
          coverRow(S, inter, x0, x1, y, 0.26, 'green');
          S.tex(`V_1\\cap\\dots\\cap V_{${N}}`, x0, y + 0.26, { color: 'green', align: 'left', baseline: 'bottom', dx: 4, dy: -1, size: 13 });
        };
        v.render(() => {
          const N = NS.value;
          const rows = []; let inter = null;
          for (let n = 1; n <= N; n++) { const I = merge(ivals(n)); rows.push(I); inter = inter ? merge(intersect(inter, I)) : I; }
          const lens = rows.map(unionLen);
          drawRows(top, rows, inter, N, 0, 1, lens);
          const hw = 0.02, a = hz.x - hw, b = hz.x + hw;
          top.rect(a, -0.55, b, 7.1, { color: 'orange', width: 1.4, fill: 'orange', fillAlpha: 0.08 });
          zoom.setView([a, b], null);
          drawRows(zoom, rows, inter, N, a, b, null);
          // rationals inside the zoom window
          const qs = Q.filter((q) => q >= a && q <= b);
          zoom.dots(qs.map((q) => [q, -0.3]), { r: 2, color: 'ink' });
          zoom.text('rationals p/q, q ≤ 70', a, -0.3, { dx: 4, dy: -11, size: 11, color: 'muted' });
          st = { N, lenI: unionLen(inter), qs: qs.length, a, b };
        });
        v.legend([['accent', '$V_n$ (open, dense)', { area: true }], ['green', '$V_1\\cap\\dots\\cap V_N$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$m(V_1\\cap\\dots\\cap V_{${st.N}}) = ${v.fmt(st.lenI, 3)}$, yet every $V_n$ contains all ${st.qs} rationals visible in the window $[${v.fix(st.a, 3)}, ${v.fix(st.b, 3)}]$. With all rationals enumerated, $\\bigcap_n V_n$ is a dense $G_\\delta$ of measure $0$.`;
        });
      },
    },
  ],
};
