// Rudin, Functional Analysis — Chapter 12: Bounded Operators on a Hilbert Space

// ---------------------------------------------------------------- helpers: complex scalars [re, im] and small complex matrices
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cConj = (a) => [a[0], -a[1]];
const cScale = (a, k) => [a[0] * k, a[1] * k];
const cAbs = (a) => Math.hypot(a[0], a[1]);
const cSqrt = (a) => { const r = cAbs(a); const re = Math.sqrt(Math.max(0, (r + a[0]) / 2)); let im = Math.sqrt(Math.max(0, (r - a[0]) / 2)); if (a[1] < 0) im = -im; return [re, im]; };
const cPow = (k) => [[1, 0], [0, 1], [-1, 0], [0, -1]][((k % 4) + 4) % 4]; // i^k
/** (x, y) = Σ x_i conj(y_i): linear in x, conjugate-linear in y (Rudin's convention). */
const ipC = (x, y) => x.reduce((s, xi, i) => cAdd(s, cMul(xi, cConj(y[i]))), [0, 0]);
const applyC = (A, x) => A.map((row) => row.reduce((s, a, j) => cAdd(s, cMul(a, x[j])), [0, 0]));
const realC = (R) => R.map((row) => row.map((x) => [x, 0]));
const vecC = (re, im) => re.map((x, i) => [x, im ? im[i] : 0]);
/** Eigenvalues of a complex 2×2 matrix. */
function eigC2(A) {
  const tr = cAdd(A[0][0], A[1][1]), det = cSub(cMul(A[0][0], A[1][1]), cMul(A[0][1], A[1][0]));
  const d = cSqrt(cSub(cScale(cMul(tr, tr), 0.25), det)), h = cScale(tr, 0.5);
  return [cAdd(h, d), cSub(h, d)];
}
/** Numerical range of a 2×2 matrix (elliptical range theorem): boundary points of the ellipse with foci λ₁, λ₂. */
function numRangeC2(A, n = 120) {
  const [l1, l2] = eigC2(A);
  const fro = A.flat().reduce((s, a) => s + a[0] * a[0] + a[1] * a[1], 0);
  const b = Math.sqrt(Math.max(0, fro - cAbs(l1) ** 2 - cAbs(l2) ** 2));
  const d = cSub(l1, l2), dl = cAbs(d);
  const u = dl > 1e-12 ? [d[0] / dl, d[1] / dl] : [1, 0];
  const a = Math.sqrt(b * b + dl * dl) / 2, bb = b / 2, c = cScale(cAdd(l1, l2), 0.5);
  const pts = [];
  for (let k = 0; k <= n; k++) { const t = (2 * Math.PI * k) / n; pts.push([c[0] + a * Math.cos(t) * u[0] - bb * Math.sin(t) * u[1], c[1] + a * Math.cos(t) * u[1] + bb * Math.sin(t) * u[0]]); }
  return { pts, l1, l2, a, b: bb };
}

// ---------------------------------------------------------------- helpers: L²[0,1] on a grid (Simpson weights)
function l2Grid(n = 600) {
  const ts = [], ws = [], h = 1 / n;
  for (let i = 0; i <= n; i++) { ts.push(i * h); ws.push((h / 3) * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2)); }
  const ip = (f, g) => f.reduce((s, fi, i) => s + ws[i] * fi * g[i], 0);
  return { ts, ws, ip, norm: (f) => Math.sqrt(Math.max(0, ip(f, f))) };
}
/** Orthonormal shifted Legendre polynomials on [0,1]. */
function legendre01(k, t) {
  const x = 2 * t - 1; let p0 = 1, p1 = x;
  if (k === 0) return 1;
  for (let j = 1; j < k; j++) { const p2 = ((2 * j + 1) * x * p1 - j * p0) / (j + 1); p0 = p1; p1 = p2; }
  return Math.sqrt(2 * k + 1) * p1;
}
const rot2 = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];

export default {
  book: 'fa',
  chapter: 12,
  title: 'Bounded Operators on a Hilbert Space',
  summary: String.raw`This is the chapter the whole book has been heading for. After recalling the geometry of Hilbert space (orthogonal projections, the Riesz representation, orthonormal bases), Rudin shows that $B(H)$ is a $B^*$-algebra under $T\mapsto T^*$, singles out normal, self-adjoint and unitary operators and projections, and proves the Fuglede–Putnam–Rosenblum commutativity theorem. Resolutions of the identity — projection-valued measures $E$ — then turn the commutative Gelfand–Naimark theorem into the spectral theorem $T=\int\lambda\,dE(\lambda)$ for every normal operator, with a Borel functional calculus $f(T)=\int f\,dE$. Its consequences fill the rest: eigenvalues are the atoms of $E$, positive operators have unique positive square roots, invertible operators have polar decompositions $T=UP$, the invertible group of $B(H)$ is connected, every $B^*$-algebra is an algebra of Hilbert-space operators (Gelfand–Naimark), and the averages of the powers of a contraction converge (the mean ergodic theorem).`,
  items: [
    // ------------------------------------------------------------------ basic facts
    {
      num: '12.1',
      kind: 'Definition',
      name: 'Inner product spaces and Hilbert spaces',
      statement: String.raw`A complex vector space $H$ is an **inner product space** if to every ordered pair $x,y\in H$ there is assigned a complex number $(x,y)$ such that $(y,x)=\overline{(x,y)}$, $(x+y,z)=(x,z)+(y,z)$, $(\alpha x,y)=\alpha(x,y)$, $(x,x)\ge0$, and $(x,x)=0$ only for $x=0$.

Then $\|x\|=(x,x)^{1/2}$ is a norm, by the Schwarz inequality $|(x,y)|\le\|x\|\,\|y\|$. If $H$ is complete in this norm it is a **Hilbert space**. Two vectors are orthogonal, $x\perp y$, when $(x,y)=0$; $M^\perp$ is the set of vectors orthogonal to every vector of $M$.`,
      idea: String.raw`An inner-product norm is recognisable from the norm alone: it satisfies the parallelogram law $\|x+y\|^2+\|x-y\|^2=2\|x\|^2+2\|y\|^2$, and the inner product is recovered by polarization, $4(x,y)=\sum_{k=0}^3 i^k\|x+i^ky\|^2$. Everything in this chapter — orthogonal projections, adjoints, the spectral theorem — rests on this extra rigidity, which general Banach spaces lack.`,
      caption: String.raw`Drag $x$ and $y$ and choose a norm on $\R^2$. The lower panel turns $y$ through all directions (keeping $\|y\|$) and plots the failure of the parallelogram law. Only the $\ell^2$ norm makes it vanish identically, and only then is the polarization formula an inner product.`,
      deps: ['fa-1.2'],
      see: ['rca-4.1', 'rca-4.4'],
      tags: ['Hilbert space', 'inner product'],
      verify: true,
      viz(v) {
        const M = v.M;
        const PV = { 1: 1, 1.5: 1.5, 2: 2, 4: 4, inf: Infinity };
        const pSel = v.select('norm on $\\R^2$', [{ value: '1', label: '$\\ell^1$' }, { value: '1.5', label: '$\\ell^{3/2}$' }, { value: '2', label: '$\\ell^2$' }, { value: '4', label: '$\\ell^4$' }, { value: 'inf', label: '$\\ell^\\infty$' }], '1.5');
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.6, 2.0], equal: true, height: 340, axes: true, title: 'parallelogram on $x,y$ and the unit ball' });
        const B = v.stage({ x: [0, 360], y: [-1, 1], height: 340, axes: 'box', xticks: [0, 90, 180, 270, 360], xlabel: 'direction of y (degrees)', title: 'defect $\\|x+y\\|^2+\\|x-y\\|^2-2\\|x\\|^2-2\\|y\\|^2$' });
        const x = S.handle(1.15, 0.2, { color: 'blue', label: 'x' });
        const y = S.handle(0.3, 0.95, { color: 'red', label: 'y', labelPos: 'nw' });
        let st = {};
        v.render(() => {
          const p = PV[pSel.value];
          const n = (a) => M.norm(a, p);
          const X = [x.x, x.y], Y = [y.x, y.y];
          const defect = (a, b) => n(M.vadd(a, b)) ** 2 + n(M.vsub(a, b)) ** 2 - 2 * n(a) ** 2 - 2 * n(b) ** 2;
          S.ball(0, 0, 1, { p, fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.4 });
          const s = M.vadd(X, Y);
          S.poly([[0, 0], X, s, Y], { fill: 'gold', fillAlpha: 0.1, color: 'faint', width: 1 });
          S.arrow(0, 0, s[0], s[1], { color: 'green', width: 2.2 });
          S.arrow(Y[0], Y[1], X[0], X[1], { color: 'orange', width: 2.2 });
          S.arrow(0, 0, X[0], X[1], { color: 'blue', width: 2.2 });
          S.arrow(0, 0, Y[0], Y[1], { color: 'red', width: 2.2 });
          S.tex('x+y', s[0], s[1], { color: 'green', dx: 16, dy: -8 });
          const mid = M.vlerp(X, Y, 0.5);
          S.tex('x-y', mid[0], mid[1], { color: 'orange', dx: 22, dy: 6 });
          // defect as y turns
          const r = n(Y), angs = M.linspace(0, 360, 241);
          const vals = angs.map((a) => { const u = [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]; return defect(X, M.vscale(u, r / n(u))); });
          const hi = Math.max(0.25, ...vals.map(Math.abs)) * 1.2;
          B.setView(null, [-hi, hi]);
          B.hline(0, { color: 'green', width: 1.4, dash: [5, 4] });
          B.path(angs.map((a, i) => [a, vals[i]]), { color: p === 2 ? 'green' : 'red', width: 2.2 });
          let ay = (Math.atan2(Y[1], Y[0]) * 180) / Math.PI; if (ay < 0) ay += 360;
          const d = defect(X, Y);
          B.dot(ay, d, { color: 'red', r: 5 });
          B.corner(p === 2 ? 'ℓ²: the law holds for every pair' : 'the law fails: no inner product gives this norm', 'tl', { color: p === 2 ? 'green' : 'red', weight: 600 });
          const pol = (n(s) ** 2 - n(M.vsub(X, Y)) ** 2) / 4;
          st = { d, pol, dotp: M.dot(X, Y), p };
          v.legend([['blue', '$x$'], ['red', '$y$'], ['green', '$x+y$'], ['orange', '$x-y$'], ['accent', 'unit ball', { area: true }]]);
        });
        v.readout(() => `defect $= ${v.fix(st.d, 4)}$; $\\;\\tfrac14\\big(\\|x+y\\|^2-\\|x-y\\|^2\\big) = ${v.fix(st.pol, 4)}$ ` + (st.p === 2 ? `$= x_1y_1+x_2y_2$ — the norm comes from an inner product.` : `vs. $x_1y_1+x_2y_2=${v.fix(st.dotp, 4)}$: the polarization formula is not bilinear here, so this Banach space is not a Hilbert space.`));
      },
    },
    {
      num: '12.2',
      kind: 'Theorem',
      name: 'Closest points and orthogonal decomposition',
      statement: String.raw`Let $H$ be a Hilbert space.
(a) Every nonempty closed convex set $E\subset H$ contains a unique element of smallest norm; consequently every $x\in H$ has a unique closest point in $E$.
(b) If $M$ is a closed subspace of $H$, then $H=M\oplus M^\perp$: each $x$ is uniquely $x=Px+(x-Px)$ with $Px\in M$, $x-Px\in M^\perp$, and $Px$ is the point of $M$ nearest to $x$. The map $P$ is the orthogonal projection of $H$ onto $M$, and $\|x\|^2=\|Px\|^2+\|x-Px\|^2$.`,
      idea: String.raw`For (a), take $x_n\in E$ with $\|x_n\|\to d=\inf_E\|\cdot\|$. The parallelogram law applied to $x_n,x_m$ and convexity ($\tfrac12(x_n+x_m)\in E$) give $\|x_n-x_m\|^2\le 2\|x_n\|^2+2\|x_m\|^2-4d^2\to0$; completeness gives a limit, and the same inequality gives uniqueness. For (b), apply (a) to $x-M$; a first-variation argument shows the minimiser's error is orthogonal to $M$.`,
      caption: String.raw`$H=L^2[0,1]$. In **subspace** mode $M$ = polynomials of degree $<n$: the blue curve is the nearest point $Px$, and the bars show that the error $x-Px$ is orthogonal to the first $n$ Legendre polynomials (red bars vanish) but not to the next ones. In **convex** mode $E=\{f:|f|\le c\}$ and the nearest point is the clipped function; the lower panel shows that moving from it toward another member of $E$ only increases the distance.`,
      deps: ['fa-12.1'],
      see: ['rca-4.10', 'rca-4.11'],
      tags: ['Hilbert space', 'projections', 'convexity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const G = l2Grid(600);
        const FX = {
          kink: { label: '$|t-0.35|+0.3\\sin 9t$', f: (t) => Math.abs(t - 0.35) + 0.3 * Math.sin(9 * t) },
          step: { label: 'a step', f: (t) => (t > 0.62 ? 0.9 : -0.25) + 0.15 * t },
          wave: { label: '$\\sin 2\\pi t+0.4\\cos 11t$', f: (t) => Math.sin(2 * Math.PI * t) + 0.4 * Math.cos(11 * t) },
        };
        const mode = v.select('', [{ value: 'sub', label: 'closed subspace $M$' }, { value: 'cvx', label: 'closed convex set $E$' }], 'sub');
        const which = v.select('$x=$', Object.entries(FX).map(([value, o]) => ({ value, label: o.label })), 'kink');
        const nS = v.slider('$n=\\dim M$', 1, 8, 3, { int: true });
        const cS = v.slider('$c$', 0.1, 1, 0.45, { step: 0.01 });
        const top = v.stage({ x: [-0.02, 1.02], y: [-1.5, 1.5], height: 270, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const bot = v.stage({ x: [-0.6, 9.6], y: [-0.5, 0.5], height: 170, full: true, axes: 'box' });
        const P = M.range(10).map((k) => G.ts.map((t) => legendre01(k, t)));
        let st = {};
        v.render(() => {
          const X = G.ts.map(FX[which.value].f);
          nS.el.hidden = mode.value !== 'sub'; cS.el.hidden = mode.value !== 'cvx';
          const lo = Math.min(...X), hi = Math.max(...X), pad = 0.25 * (hi - lo) + 0.1;
          top.setView(null, [Math.min(lo, -0.2) - pad, hi + pad]);
          let PX;
          if (mode.value === 'sub') {
            const n = nS.value, c = M.range(n).map((k) => G.ip(X, P[k]));
            PX = G.ts.map((_, i) => M.sum(c, (ck, k) => ck * P[k][i]));
            const R = X.map((x, i) => x - PX[i]);
            const cx = M.range(10).map((k) => G.ip(X, P[k])), cr = M.range(10).map((k) => G.ip(R, P[k]));
            const m = Math.max(0.1, ...cx.map(Math.abs)) * 1.15;
            bot.setView([-0.6, 9.6], [-m, m]);
            bot.setTicks(M.range(10).map((k) => [k, `p${k}`]), null);
            bot.setTitle('$(x,p_k)$ (grey) and $(x-Px,\\,p_k)$ (red) for the Legendre polynomials $p_k$');
            bot.bars(cx, { x0: -0.17, dx: 1, color: 'faint', barWidth: 0.3 });
            bot.bars(cr, { x0: 0.17, dx: 1, color: (_, k) => (k < n ? 'green' : 'red'), barWidth: 0.3 });
            bot.vband(-0.5, n - 0.5, { color: 'green', alpha: 0.07 });
            bot.hline(0, { color: 'muted', width: 1 });
            const nx = G.norm(X), np = G.norm(PX), nr = G.norm(R);
            st = { mode: 'sub', n, nx, np, nr, orth: Math.max(...cr.slice(0, n).map(Math.abs)) };
          } else {
            const c = cS.value;
            PX = X.map((x) => M.clamp(x, -c, c));
            top.hband(-c, c, { color: 'orange', alpha: 0.1, edges: true });
            top.tex('E=\\{|f|\\le c\\}', 0.02, c, { color: 'orange', align: 'left', baseline: 'bottom', dy: -3, size: 13 });
            // distance along the segment from PX to another element g of E
            const gs = { zero: X.map(() => 0), flip: X.map((x, i) => -PX[i] * 0.5 + 0.3 * c * Math.sin(7 * G.ts[i])) };
            const ss = M.linspace(0, 1, 101);
            const dist = (g) => ss.map((s) => G.norm(X.map((x, i) => x - ((1 - s) * PX[i] + s * g[i]))));
            const d0 = dist(gs.zero), d1 = dist(gs.flip);
            const lo2 = Math.min(...d0, ...d1), hi2 = Math.max(...d0, ...d1);
            bot.setView([-0.04, 1.04], [lo2 - 0.1 * (hi2 - lo2) - 0.01, hi2 + 0.15 * (hi2 - lo2) + 0.01]);
            bot.setTicks([0, 0.25, 0.5, 0.75, 1], null);
            bot.setTitle('$\\|x-((1-s)Px+s\\,g)\\|$ along segments from the nearest point $Px$ to two other $g\\in E$');
            bot.path(ss.map((s, i) => [s, d0[i]]), { color: 'orange', width: 2 });
            bot.path(ss.map((s, i) => [s, d1[i]]), { color: 'purple', width: 2 });
            bot.dot(0, d0[0], { color: 'green', r: 5.5, label: 'Px', labelPos: 'e' });
            st = { mode: 'cvx', d: d0[0], c };
          }
          top.between((t) => FX[which.value].f(t), (t) => { const i = Math.round(t * 600); return PX[Math.min(600, Math.max(0, i))]; }, 0, 1, { fill: 'red', fillAlpha: 0.12 });
          top.path(G.ts.map((t, i) => [t, X[i]]), { color: 'ink', width: 2.2 });
          top.path(G.ts.map((t, i) => [t, PX[i]]), { color: 'blue', width: 2.4 });
          v.legend(mode.value === 'sub'
            ? [['ink', '$x$'], ['blue', '$Px\\in M$ (nearest point)'], ['red', 'error $x-Px\\perp M$', { area: true }]]
            : [['ink', '$x$'], ['blue', 'nearest point of $E$'], ['orange', '$E=\\{f: |f|\\le c\\}$', { area: true }], ['purple', 'segment to another $g\\in E$']]);
        });
        v.readout(() => st.mode === 'sub'
          ? `$\\max_{k<${st.n}}|(x-Px,p_k)| = ${v.sci(st.orth + 1e-17, 1)}$; $\\;\\|x\\|^2=${v.fix(st.nx ** 2, 4)}$ and $\\|Px\\|^2+\\|x-Px\\|^2 = ${v.fix(st.np ** 2, 4)}+${v.fix(st.nr ** 2, 4)} = ${v.fix(st.np ** 2 + st.nr ** 2, 4)}$ (Pythagoras).`
          : `$\\operatorname{dist}(x,E)=${v.fix(st.d, 4)}$ is attained only at the clipped function: both segments rise as soon as $s>0$ — strict convexity of $\\|\\cdot\\|^2$, i.e. the parallelogram law, forbids a second minimiser.`);
      },
    },
    {
      num: '12.3',
      kind: 'Theorem',
      name: 'Riesz representation: H* is H',
      statement: String.raw`For each $y\in H$ the functional $\Lambda_y x=(x,y)$ is bounded with $\|\Lambda_y\|=\|y\|$. Conversely every bounded linear functional $\Lambda$ on $H$ equals $\Lambda_y$ for exactly one $y\in H$. The map $y\mapsto\Lambda_y$ is thus a conjugate-linear isometry of $H$ onto $H^*$.`,
      idea: String.raw`Schwarz gives $\|\Lambda_y\|\le\|y\|$ and $x=y$ gives equality. For the converse, if $\Lambda\ne0$ its null space $N$ is a closed proper subspace, so by the orthogonal decomposition there is a unit vector $z\perp N$. Since $(\Lambda x)z-(\Lambda z)x\in N$, taking inner products with $z$ yields $\Lambda x=(x,y)$ with $y=\overline{\Lambda z}\,z$.`,
      caption: String.raw`$H=L^2[0,1]$ (real-valued, for the picture). Choose a functional and watch its representer $y$ (green). The function $x$ splits as a multiple of $y$ plus a part $z$ in the null space of $\Lambda$; the readout checks $\Lambda x=(x,y)$ and $\Lambda z=0$. For the local average, shrink $h$: $\|\Lambda\|=\|y\|=1/\sqrt{2h}$ blows up, which is why evaluation at a point has no representer in $L^2$.`,
      deps: ['fa-12.2'],
      see: ['rca-4.12'],
      tags: ['Hilbert space', 'duality'],
      verify: true,
      viz(v) {
        const M = v.M;
        const G = l2Grid(800);
        const which = v.select('$\\Lambda x=$', [
          { value: 'avg', label: '$\\frac1{2h}\\int_{a-h}^{a+h}x$' },
          { value: 'mom', label: '$\\int_0^1 (3t^2-1)\\,x(t)\\,dt$' },
          { value: 'diff', label: '$\\int_0^{1/2}x-\\int_{1/2}^1x$' },
        ], 'avg');
        const hS = v.slider('$h$', 0.01, 0.25, 0.08, { step: 0.005 });
        const S = v.stage({ x: [-0.02, 1.02], y: [-2, 3], height: 360, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const a = S.handle(0.55, 0, { color: 'green', constrain: (px) => [M.clamp(px, 0.27, 0.73), S.bounds.y[0] + 0.02 * (S.bounds.y[1] - S.bounds.y[0])] });
        const xf = (t) => 0.7 + 0.6 * Math.sin(5 * t) - 0.5 * t * t;
        let st = {};
        v.render(() => {
          const mode = which.value, h = hS.value;
          hS.el.hidden = mode !== 'avg'; a.visible = mode === 'avg';
          let yf, lam;
          if (mode === 'avg') { const c = a.x; yf = (t) => (Math.abs(t - c) <= h ? 1 / (2 * h) : 0); lam = M.integrate(xf, c - h, c + h, 400) / (2 * h); }
          else if (mode === 'mom') { yf = (t) => 3 * t * t - 1; lam = M.integrate((t) => (3 * t * t - 1) * xf(t), 0, 1, 400); }
          else { yf = (t) => (t < 0.5 ? 1 : -1); lam = M.integrate(xf, 0, 0.5, 400) - M.integrate(xf, 0.5, 1, 400); }
          const X = G.ts.map(xf);
          // representer on a fine grid: integrate exactly piecewise for the box
          const Y = G.ts.map(yf);
          const ny2 = mode === 'avg' ? 1 / (2 * h) : mode === 'mom' ? M.integrate((t) => (3 * t * t - 1) ** 2, 0, 1, 400) : 1;
          const coef = lam / ny2;
          const Z = X.map((x, i) => x - coef * Y[i]);
          const zf = (t) => xf(t) - coef * yf(t);
          const lamZ = mode === 'avg' ? M.integrate(zf, a.x - h, a.x + h, 400) / (2 * h) : mode === 'mom' ? M.integrate((t) => (3 * t * t - 1) * zf(t), 0, 1, 400) : M.integrate(zf, 0, 0.5, 400) - M.integrate(zf, 0.5, 1, 400);
          const ymax = Math.max(...Y), ymin = Math.min(...Y);
          const top = Math.max(2.2, Math.min(ymax * 1.12, 26)), bottom = Math.min(-1.6, ymin * 1.2, Math.min(...Z) - 0.3);
          S.setView(null, [bottom, top]);
          S.path(G.ts.map((t, i) => [t, Y[i]]).concat([[1, 0], [0, 0]]), { fill: 'green', fillAlpha: 0.14, stroke: false, close: true });
          S.path(G.ts.map((t, i) => [t, Y[i]]), { color: 'green', width: 2.2 });
          S.path(G.ts.map((t, i) => [t, Z[i]]), { color: 'orange', width: 2, dash: [6, 4] });
          S.path(G.ts.map((t, i) => [t, X[i]]), { color: 'ink', width: 2.4 });
          S.hline(0, { color: 'muted', width: 1 });
          if (mode === 'avg' && ymax > top) S.text(`y = 1/(2h) = ${v.fmt(ymax, 3)} (off scale)`, a.x, top, { align: 'center', baseline: 'top', dy: 6, color: 'green', size: 12 });
          st = { lam, ip: G.ip(X, Y), lamZ, ny: Math.sqrt(ny2), mode, h };
          v.legend([['ink', '$x$'], ['green', 'representer $y$', { area: true }], ['orange', '$z = x-\\frac{\\Lambda x}{\\|y\\|^2}\\,y\\in\\mathscr N(\\Lambda)$', { dash: true }]]);
        });
        v.readout(() => `$\\Lambda x = ${v.fix(st.lam, 4)}$, $\\;(x,y) = ${v.fix(st.ip, 4)}$, $\\;\\Lambda z = ${v.fix(st.lamZ + 0, 4)}$, $\\;\\|\\Lambda\\| = \\|y\\| = ${v.fix(st.ny, 3)}$` + (st.mode === 'avg' ? ` $=1/\\sqrt{2h}\\to\\infty$ as $h\\to0$: $x\\mapsto x(a)$ is not bounded on $L^2$.` : '.'));
      },
    },
    {
      num: '12.4',
      kind: 'Theorem',
      name: 'Orthonormal bases and Parseval’s identity',
      statement: String.raw`Every orthonormal set in $H$ is contained in a maximal one. If $\{u_\alpha\}_{\alpha\in A}$ is a maximal orthonormal set (an orthonormal basis), then for every $x\in H$
$$x=\sum_\alpha (x,u_\alpha)\,u_\alpha\qquad\text{and}\qquad \|x\|^2=\sum_\alpha|(x,u_\alpha)|^2,$$
only countably many coefficients being nonzero; $x\mapsto\{(x,u_\alpha)\}$ is an isometry of $H$ onto $\ell^2(A)$.`,
      idea: String.raw`Zorn's (or Hausdorff's) maximality principle produces a maximal orthonormal set. For any finite set $F$ of indices, the projection onto $\operatorname{span}\{u_\alpha:\alpha\in F\}$ is $\sum_F(x,u_\alpha)u_\alpha$, which gives Bessel's inequality $\sum|(x,u_\alpha)|^2\le\|x\|^2$; the series therefore converges, and $x$ minus its sum is orthogonal to every $u_\alpha$, hence $0$ by maximality.`,
      caption: String.raw`The Haar system is an orthonormal basis of $L^2[0,1]$. Increase the number $n$ of basis vectors used: the blue step function is the projection of $f$ onto their span, the bars are $|(f,u_k)|^2$, and the green running total climbs to $\|f\|^2$ (Bessel's inequality becoming Parseval's identity).`,
      deps: ['fa-12.2'],
      see: ['rca-4.18', 'rca-4.22'],
      tags: ['Hilbert space', 'orthonormal bases'],
      verify: true,
      viz(v) {
        const M = v.M;
        const NG = 4096, ts = M.range(NG).map((i) => (i + 0.5) / NG);
        const FS = {
          bump: { label: 'smooth bump', f: (t) => Math.exp(-(((t - 0.42) / 0.16) ** 2)) + 0.25 * t },
          step: { label: 'step at $1/3$', f: (t) => (t < 1 / 3 ? 0.9 : -0.3) },
          saw: { label: 'sawtooth', f: (t) => ((3 * t) % 1) - 0.5 + 0.4 * t },
        };
        const which = v.select('$f=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const nS = v.slider('basis vectors used $n$', 1, 64, 6, { int: true });
        const top = v.stage({ x: [-0.02, 1.02], y: [-1, 1.4], height: 260, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const bot = v.stage({ x: [0, 65], y: [0, 1], height: 180, full: true, axes: 'box', title: 'coefficients $|(f,u_k)|^2$ and the running total $\\sum_{k\\le n}|(f,u_k)|^2$' });
        // Haar basis u_0 = 1, then u_{2^j+k} = h_{j,k}
        const haar = (m, t) => {
          if (m === 0) return 1;
          const j = Math.floor(Math.log2(m)), k = m - 2 ** j, L = 2 ** -j, a = k * L;
          if (t < a || t >= a + L) return 0;
          return (t < a + L / 2 ? 1 : -1) * 2 ** (j / 2);
        };
        const cache = {};
        const coeffs = (key) => {
          if (cache[key]) return cache[key];
          const F = ts.map(FS[key].f);
          const c = M.range(64).map((m) => F.reduce((s, f, i) => s + f * haar(m, ts[i]), 0) / NG);
          return (cache[key] = { F, c, n2: F.reduce((s, f) => s + f * f, 0) / NG });
        };
        let st = {};
        v.render(() => {
          const { F, c, n2 } = coeffs(which.value), n = nS.value;
          const lo = Math.min(...F), hi = Math.max(...F);
          top.setView(null, [lo - 0.25, hi + 0.3]);
          const SF = (t) => M.sum(c.slice(0, n), (ck, m) => ck * haar(m, t));
          const xs = M.linspace(0, 0.99999, 1025);
          top.between((t) => FS[which.value].f(t), SF, 0, 0.99999, { fill: 'red', fillAlpha: 0.12, n: 1024 });
          top.fn(FS[which.value].f, { domain: [0, 1], color: 'ink', width: 2.2, n: 600 });
          top.path(xs.map((t) => [t, SF(t)]), { color: 'blue', width: 2.4 });
          // newest basis vector, scaled, for orientation
          const m = n - 1, sc = 0.25 / Math.max(1, 2 ** (Math.floor(Math.log2(Math.max(1, m))) / 2));
          top.path(xs.map((t) => [t, lo - 0.12 + sc * haar(m, t)]), { color: 'gold', width: 1.6 });
          const sq = c.map((x) => x * x), cum = []; sq.reduce((s, x, i) => (cum[i] = s + x), 0);
          bot.setView([0, 65], [0, n2 * 1.15]);
          bot.bars(sq, { x0: 1, dx: 1, color: (_, i) => (i < n ? 'blue' : 'faint'), barWidth: 0.7 });
          bot.path(cum.map((s, i) => [i + 1, s]), { color: 'green', width: 2 });
          bot.hline(n2, { color: 'green', dash: [6, 4], width: 1.4 });
          bot.text('‖f‖²', 64.5, n2, { align: 'right', dy: -9, color: 'green', size: 12 });
          bot.dot(n, cum[n - 1], { color: 'green', r: 5 });
          st = { n, sum: cum[n - 1], n2 };
          v.legend([['ink', '$f$'], ['blue', '$\\sum_{k\\le n}(f,u_k)u_k$'], ['gold', 'newest Haar function $u_n$ (scaled)'], ['green', 'running total of $|(f,u_k)|^2$']]);
        });
        v.readout(() => `$\\sum_{k\\le ${st.n}}|(f,u_k)|^2 = ${v.fix(st.sum, 5)}\\le\\|f\\|^2 = ${v.fix(st.n2, 5)}$; $\\;\\|f-\\sum_{k\\le ${st.n}}(f,u_k)u_k\\|^2 = ${v.fix(st.n2 - st.sum, 5)}$.`);
      },
    },
    // ------------------------------------------------------------------ bounded operators
    {
      num: '12.7',
      kind: 'Theorem',
      name: 'An operator with (Tx, x) = 0 for all x is zero',
      statement: String.raw`If $T\in B(H)$ and $(Tx,x)=0$ for every $x\in H$, then $T=0$.`,
      idea: String.raw`The polarization identity $4(Tx,y)=\sum_{k=0}^3 i^k\,\big(T(x+i^ky),\,x+i^ky\big)$ expresses every $(Tx,y)$ through values of the quadratic form $z\mapsto(Tz,z)$; if they all vanish then $(Tx,y)=0$ for all $x,y$, so $Tx=0$. The complex scalars are essential: the rotation of $\R^2$ by $90^\circ$ satisfies $(Tx,x)=0$ for every real $x$. Quantitatively, polarization gives $\|T\|\le 2\sup_{\|x\|=1}|(Tx,x)|$.`,
      caption: String.raw`Left: real vectors $x$ on the unit circle, with $Tx$ and its component along $x$, whose signed length is $(Tx,x)$. Right: the numerical range $W(T)=\{(Tz,z):z\in\C^2,\|z\|=1\}$ (shaded ellipse, gold samples); real vectors only reach the blue segment. Turn the phase $\varphi$ of the second coordinate of $z$ to leave the real line. For the rotation $J$ the blue segment is the single point $0$, but $W(J)=[-i,i]$ — complex vectors detect $J\ne0$.`,
      deps: ['fa-12.1'],
      tags: ['operators', 'numerical range'],
      verify: true,
      viz(v) {
        const M = v.M;
        const TS = {
          J: { label: 'rotation $J$', T: [[0, -1], [1, 0]] },
          N: { label: 'nilpotent $\\left(\\begin{smallmatrix}0&1\\\\0&0\\end{smallmatrix}\\right)$', T: [[0, 1], [0, 0]] },
          G: { label: 'general', T: [[0.55, 1.1], [-0.6, -0.35]] },
        };
        const which = v.select('$T=$', Object.entries(TS).map(([value, o]) => ({ value, label: o.label })), 'J');
        const phi = v.slider('phase $\\varphi$ of $z_2$', 0, 2 * Math.PI, 1.1, { step: 0.01 });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.6, 1.6], equal: true, height: 340, title: 'real vectors: $(Tx,x)$ is the component of $Tx$ along $x$' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 340, title: '$W(T)$ in $\\C$; $z=(\\cos\\theta,\\,e^{i\\varphi}\\sin\\theta)$' });
        const xh = L.handle(Math.cos(0.7), Math.sin(0.7), { color: 'blue', label: 'x', constrain: (px, py) => { const r = Math.hypot(px, py) || 1; return [px / r, py / r]; } });
        let st = {};
        v.render(() => {
          const T = TS[which.value].T, TC = realC(T);
          const th = Math.atan2(xh.y, xh.x), X = [Math.cos(th), Math.sin(th)];
          const TX = M.matVec(T, X), q = M.dot(TX, X);
          L.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          L.line(-1.7 * X[0], -1.7 * X[1], 1.7 * X[0], 1.7 * X[1], { color: 'grid', width: 1 });
          L.line(TX[0], TX[1], q * X[0], q * X[1], { color: 'muted', width: 1, dash: [3, 3] });
          L.arrow(0, 0, TX[0], TX[1], { color: 'orange', width: 2.4 });
          L.tex('Tx', TX[0], TX[1], { color: 'orange', dx: 14, dy: -10 });
          if (Math.abs(q) > 0.02) L.arrow(0, 0, q * X[0], q * X[1], { color: 'blue', width: 4, alpha: 0.6 });
          L.dot(q * X[0], q * X[1], { color: 'blue', r: 4 });
          L.corner(`(Tx, x) = ${v.fix(q, 3)}`, 'bl', { color: 'blue', weight: 600 });
          // right: numerical range
          const W = numRangeC2(TC);
          R.poly(W.pts, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.6 });
          const samp = [];
          for (let i = 0; i <= 24; i++) for (let j = 0; j < 36; j++) {
            const a = (i / 24) * (Math.PI / 2), f = (j / 36) * 2 * Math.PI;
            const z = [[Math.cos(a), 0], [Math.sin(a) * Math.cos(f), Math.sin(a) * Math.sin(f)]];
            samp.push(ipC(applyC(TC, z), z));
          }
          R.dots(samp, { color: 'gold', r: 1.8, alpha: 0.75 });
          // real-vector values: a segment on the real axis
          const Sym = [[T[0][0], (T[0][1] + T[1][0]) / 2], [(T[0][1] + T[1][0]) / 2, T[1][1]]];
          const ev = M.eigSym2(Sym).values;
          if (ev[0] - ev[1] > 1e-6) R.line(ev[1], 0, ev[0], 0, { color: 'blue', width: 5 }); else R.dot(ev[0], 0, { color: 'blue', r: 6 });
          const z = [[Math.cos(th), 0], [Math.sin(th) * Math.cos(phi.value), Math.sin(th) * Math.sin(phi.value)]];
          const w = ipC(applyC(TC, z), z);
          R.dot(w[0], w[1], { color: 'red', r: 6, label: '(Tz,z)', labelPos: 'ne' });
          R.dot(W.l1[0], W.l1[1], { color: 'ink', r: 3.5 }); R.dot(W.l2[0], W.l2[1], { color: 'ink', r: 3.5 });
          const wmax = Math.max(...samp.map(cAbs));
          st = { q, w, wmax, nT: M.svd2(T)[0], J: which.value === 'J' };
          v.legend([['accent', 'numerical range $W(T)$', { area: true }], ['gold', 'samples $(Tz,z)$', { dot: true }], ['blue', 'values on real unit vectors'], ['red', 'current complex $z$', { dot: true }], ['ink', 'eigenvalues (foci)', { dot: true }]]);
        });
        v.readout(() => `$(Tz,z) = ${v.fix(st.w[0], 3)} ${st.w[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(st.w[1]), 3)}\\,i$; $\\;w(T)=\\sup|(Tz,z)| = ${v.fix(st.wmax, 3)}$, $\\;\\|T\\| = ${v.fix(st.nT, 3)}\\le 2w(T) = ${v.fix(2 * st.wmax, 3)}$.` + (st.J ? ' For $J$, every real $x$ gives $0$, yet $W(J)\\neq\\{0\\}$.' : ''));
      },
    },
    {
      num: '12.7a',
      kind: 'Corollary',
      name: 'Operators are determined by their quadratic forms',
      statement: String.raw`If $S,T\in B(H)$ and $(Sx,x)=(Tx,x)$ for every $x\in H$, then $S=T$. In particular, $T$ is self-adjoint as soon as $(Tx,x)$ is real for every $x$.`,
      idea: String.raw`Apply 12.7 to $S-T$. Concretely, the polarization identity rebuilds every $(Tx,y)$ from four values of the quadratic form, at $x+y$, $x+iy$, $x-y$, $x-iy$; equal forms give equal rebuilds. For the second claim compare $T$ with $T^*$: $(T^*x,x)=\overline{(Tx,x)}$.`,
      caption: String.raw`The four terms $\tfrac14 i^k(T(x+i^ky),x+i^ky)$ are drawn head to tail in $\C$; their sum is $(Tx,y)$. The red chain does the same for $S=T+cJ$. Because $x,y$ are real, the terms $k=0,2$ (real vectors) agree for $S$ and $T$; the difference comes only from the complex vectors $x\pm iy$. Set $c=0$ and the chains coincide.`,
      deps: ['fa-12.7'],
      tags: ['operators', 'polarization'],
      verify: true,
      viz(v) {
        const M = v.M;
        const cS = v.slider('$c$ in $S=T+cJ$', -1, 1, 0.55, { step: 0.01 });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, height: 340, title: 'real vectors $x$, $y$' });
        const R = v.stage({ x: [-1.2, 1.4], y: [-1.1, 1.2], equal: true, height: 340, title: 'polarization: $\\sum_k \\tfrac14 i^k\\,(T(x+i^ky),x+i^ky) = (Tx,y)$' });
        const x = L.handle(1, 0.15, { color: 'blue', label: 'x' });
        const y = L.handle(-0.2, 0.9, { color: 'red', label: 'y', labelPos: 'nw' });
        const T = [[0.7, 0.45], [-0.15, 0.35]], J = [[0, -1], [1, 0]];
        let st = {};
        const chain = (A, X, Y) => {
          const AC = realC(A); let s = [0, 0]; const pts = [[0, 0]], terms = [];
          for (let k = 0; k < 4; k++) {
            const ik = cPow(k);
            const z = [cAdd([X[0], 0], cMul(ik, [Y[0], 0])), cAdd([X[1], 0], cMul(ik, [Y[1], 0]))];
            const q = ipC(applyC(AC, z), z), t = cScale(cMul(ik, q), 0.25);
            terms.push(t); s = cAdd(s, t); pts.push(s.slice());
          }
          return { pts, terms, sum: s };
        };
        v.render(() => {
          const c = cS.value, S = [[T[0][0], T[0][1] - c], [T[1][0] + c, T[1][1]]];
          const X = [x.x, x.y], Y = [y.x, y.y];
          L.circle(0, 0, 1, { color: 'faint', width: 1 });
          L.arrow(0, 0, X[0], X[1], { color: 'blue', width: 2.2 });
          L.arrow(0, 0, Y[0], Y[1], { color: 'red', width: 2.2 });
          const ct = chain(T, X, Y), cs = chain(S, X, Y);
          const all = ct.pts.concat(cs.pts), mx = Math.max(0.6, ...all.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))) * 1.25;
          R.setView([-mx, mx], [-mx * 0.85, mx * 0.85]);
          const cols = ['green', 'purple', 'green', 'purple'];
          for (let k = 0; k < 4; k++) {
            const a = ct.pts[k], b = ct.pts[k + 1];
            R.arrow(a[0], a[1], b[0], b[1], { color: 'blue', width: 2.6, head: 10 });
            const a2 = cs.pts[k], b2 = cs.pts[k + 1];
            R.arrow(a2[0], a2[1], b2[0], b2[1], { color: 'red', width: 1.8, dash: [5, 4], head: 9 });
            const m = M.vlerp(a, b, 0.5);
            if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.08 * mx) R.text(`k=${k}`, m[0], m[1], { color: cols[k], size: 11, dx: 8, dy: -8 });
          }
          R.dot(0, 0, { color: 'muted', r: 3.5 });
          R.dot(ct.sum[0], ct.sum[1], { color: 'blue', r: 6, label: '(Tx,y)', labelPos: 'e' });
          R.dot(cs.sum[0], cs.sum[1], { color: 'red', r: 6, hollow: true, label: '(Sx,y)', labelPos: 'w' });
          st = { ct, cs, c, d02: Math.max(cAbs(cSub(ct.terms[0], cs.terms[0])), cAbs(cSub(ct.terms[2], cs.terms[2]))), d13: Math.max(cAbs(cSub(ct.terms[1], cs.terms[1])), cAbs(cSub(ct.terms[3], cs.terms[3]))) };
          v.legend([['blue', 'terms for $T$'], ['red', 'terms for $S=T+cJ$', { dash: true }]]);
        });
        v.readout(() => `$(Tx,y) = ${v.fix(st.ct.sum[0], 3)}$, $\\;(Sx,y) = ${v.fix(st.cs.sum[0], 3)}$. Terms $k=0,2$ (real vectors $x\\pm y$) differ by $${v.fix(st.d02, 4)}$; terms $k=1,3$ (complex vectors $x\\pm iy$) differ by $${v.fix(st.d13, 4)}$.` + (Math.abs(st.c) < 0.005 ? ' Equal quadratic forms ⇒ equal operators.' : ' The quadratic forms of $S$ and $T$ agree on real vectors only — so $S\\neq T$ is no contradiction.'));
      },
    },
    {
      num: '12.8',
      kind: 'Theorem',
      name: 'Bounded sesquilinear forms come from operators',
      statement: String.raw`Let $f:H\times H\to\C$ be linear in its first and conjugate-linear in its second variable, and bounded: $M=\sup\{|f(x,y)|:\|x\|=\|y\|=1\}<\infty$. Then there is exactly one $S\in B(H)$ with
$$f(x,y)=(x,Sy)\qquad(x,y\in H),$$
and $\|S\|=M$.`,
      idea: String.raw`For fixed $y$, $x\mapsto f(x,y)$ is a bounded linear functional, so by the Riesz representation it equals $(x,Sy)$ for a unique vector $Sy$. Uniqueness and the sesquilinearity of $f$ force $y\mapsto Sy$ to be linear, and $|(x,Sy)|\le M\|x\|\|y\|$ gives $\|S\|\le M$; the reverse inequality is Schwarz.`,
      caption: String.raw`A real picture of the statement, on $\R^2$. Drag $y$: the faint parallel lines are the level sets of the functional $x\mapsto f(x,y)$, and the green arrow is its Riesz representer $Sy$, perpendicular to them. As $y$ runs over the unit circle, $Sy$ traces the orange ellipse — the image of the circle under one linear map $S$ — whose long semi-axis is $\|S\|=M$. Drag the probe $x$ to check $f(x,y)=(x,Sy)$.`,
      deps: ['fa-12.3'],
      tags: ['operators', 'sesquilinear forms'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FORMS = {
          a: { label: '$2x_1y_1+x_2y_2$', B: [[2, 0], [0, 1]] },
          b: { label: '$x_1y_1+x_1y_2+0.6\\,x_2y_2$', B: [[1, 1], [0, 0.6]] },
          c: { label: '$1.4x_1y_2-0.8x_2y_1+0.3x_2y_2$', B: [[0, 1.4], [-0.8, 0.3]] },
        };
        const which = v.select('$f(x,y)=$', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'b');
        const S = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, height: 400, axes: true });
        const y = S.handle(0.6, 0.8, { color: 'blue', label: 'y' });
        const x = S.handle(-1.3, 0.9, { color: 'gold', label: 'x', labelPos: 'nw' });
        let st = {};
        v.render(() => {
          const B = FORMS[which.value].B; // f(x,y) = Σ B_ij x_i y_j  ⇒  S = B
          const f = (X, Y) => X[0] * (B[0][0] * Y[0] + B[0][1] * Y[1]) + X[1] * (B[1][0] * Y[0] + B[1][1] * Y[1]);
          const Y = [y.x, y.y], X = [x.x, x.y];
          const Sy = M.matVec(B, Y), ns = M.norm(Sy);
          if (ns > 1e-6) {
            const n = M.vscale(Sy, 1 / ns), t = [-n[1], n[0]];
            for (let k = -12; k <= 12; k++) {
              const c = (k * 0.4) / ns, p = M.vscale(n, c);
              S.line(p[0] - t[0] * 9, p[1] - t[1] * 9, p[0] + t[0] * 9, p[1] + t[1] * 9, { color: k === 0 ? 'muted' : 'faint', width: k === 0 ? 1.4 : 1, alpha: k === 0 ? 1 : 0.55 });
            }
            // the level line through x
            const cx = M.dot(X, n), p = M.vscale(n, cx);
            S.line(p[0] - t[0] * 9, p[1] - t[1] * 9, p[0] + t[0] * 9, p[1] + t[1] * 9, { color: 'gold', width: 1.4, dash: [5, 4] });
          }
          S.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [3, 3] });
          S.curve((s) => M.matVec(B, [Math.cos(s), Math.sin(s)]), 0, 2 * Math.PI, { color: 'orange', width: 2, n: 160 });
          const sv = M.svd2(B);
          S.arrow(0, 0, Y[0], Y[1], { color: 'blue', width: 2 });
          S.arrow(0, 0, Sy[0], Sy[1], { color: 'green', width: 3 });
          S.tex('Sy', Sy[0], Sy[1], { color: 'green', dx: 16, dy: -10 });
          // M by brute force
          let Mx = 0; for (let i = 0; i < 90; i++) for (let j = 0; j < 90; j++) { const a = (i / 90) * 2 * Math.PI, b = (j / 90) * 2 * Math.PI; Mx = Math.max(Mx, Math.abs(f([Math.cos(a), Math.sin(a)], [Math.cos(b), Math.sin(b)]))); }
          st = { fxy: f(X, Y), ip: M.dot(X, Sy), Mx, nS: sv[0] };
          v.legend([['blue', '$y$'], ['green', 'representer $Sy$'], ['faint', 'level sets of $x\\mapsto f(x,y)$'], ['orange', '$\\{Sy:\\|y\\|=1\\}$']]);
        });
        v.readout(() => `$f(x,y) = ${v.fix(st.fxy, 4)}$ and $(x,Sy) = ${v.fix(st.ip, 4)}$; $\\;M=\\sup|f| \\approx ${v.fix(st.Mx, 4)}$ (grid search) and $\\|S\\| = ${v.fix(st.nS, 4)}$.`);
      },
    },
    {
      num: '12.9',
      kind: 'Theorem',
      name: 'The adjoint; B(H) is a B*-algebra',
      statement: String.raw`For every $T\in B(H)$ there is a unique $T^*\in B(H)$, the **adjoint** of $T$, such that
$$(Tx,y)=(x,T^*y)\qquad(x,y\in H).$$
The map $T\mapsto T^*$ is an involution on $B(H)$: $(S+T)^*=S^*+T^*$, $(\alpha T)^*=\bar\alpha T^*$, $(ST)^*=T^*S^*$, $T^{**}=T$; moreover $\|T^*\|=\|T\|$ and $\|T^*T\|=\|T\|^2$. Thus $B(H)$ is a $B^*$-algebra.`,
      idea: String.raw`$(x,y)\mapsto(Tx,y)$ is a bounded sesquilinear form, so 12.8 produces $T^*$. The algebraic rules follow from uniqueness. For the $B^*$ identity, $\|Tx\|^2=(T^*Tx,x)\le\|T^*T\|\,\|x\|^2$ gives $\|T\|^2\le\|T^*T\|\le\|T^*\|\|T\|$, so $\|T\|\le\|T^*\|$, and by symmetry equality throughout. (Under the identification $H^*=H$ this $T^*$ is the Banach-space adjoint of 4.10.)`,
      caption: String.raw`On $\R^2$ the adjoint is the transpose. Left: drag $x$ and $y$; the readout confirms $(Tx,y)=(x,T^*y)$. Right: drag the columns $Te_1$, $Te_2$. The images of the unit circle under $T$ and $T^*$ are different ellipses with the same semi-axes, so $\|T\|=\|T^*\|$; the image under $T^*T$ (green) reaches exactly the circle of radius $\|T\|^2$.`,
      deps: ['fa-12.8', 'fa-4.10'],
      see: ['fa-11.14'],
      tags: ['adjoint', 'B*-algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.1, 2.1], y: [-2, 2], equal: true, height: 360, title: 'the defining identity $(Tx,y)=(x,T^*y)$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-2.3, 2.3], equal: true, height: 360, title: 'images of the unit circle' });
        const c1 = R.handle(1.1, 0.35, { color: 'ink', label: 'Te₁', r: 6 });
        const c2 = R.handle(-0.55, 0.75, { color: 'ink', label: 'Te₂', r: 6, labelPos: 'nw' });
        const x = L.handle(0.9, -0.4, { color: 'blue', label: 'x' });
        const y = L.handle(0.3, 1.0, { color: 'red', label: 'y', labelPos: 'nw' });
        let st = {};
        const axes = (S, A, col) => {
          const { values, vectors } = M.eigSym2(M.matMul(A, M.transpose(A)));
          values.forEach((l, i) => { const s = Math.sqrt(Math.max(0, l)), u = vectors[i]; S.line(-s * u[0], -s * u[1], s * u[0], s * u[1], { color: col, width: 1, dash: [3, 3] }); });
        };
        v.render(() => {
          const T = [[c1.x, c2.x], [c1.y, c2.y]], Ts = M.transpose(T), TT = M.matMul(Ts, T);
          const X = [x.x, x.y], Y = [y.x, y.y], TX = M.matVec(T, X), TsY = M.matVec(Ts, Y);
          L.circle(0, 0, 1, { color: 'faint', width: 1 });
          L.arrow(0, 0, X[0], X[1], { color: 'blue', width: 2 });
          L.arrow(0, 0, Y[0], Y[1], { color: 'red', width: 2 });
          L.arrow(0, 0, TX[0], TX[1], { color: 'blue', width: 2.6, alpha: 0.55 });
          L.arrow(0, 0, TsY[0], TsY[1], { color: 'red', width: 2.6, alpha: 0.55 });
          L.tex('Tx', TX[0], TX[1], { color: 'blue', dx: 14, dy: 10 });
          L.tex('T^*y', TsY[0], TsY[1], { color: 'red', dx: 18, dy: -10 });
          const sv = M.svd2(T), n = sv[0];
          R.circle(0, 0, 1, { color: 'faint', width: 1 });
          R.circle(0, 0, n, { color: 'blue', width: 1, dash: [2, 4] });
          R.circle(0, 0, n * n, { color: 'green', width: 1, dash: [2, 4] });
          R.curve((s) => M.matVec(TT, [Math.cos(s), Math.sin(s)]), 0, 2 * Math.PI, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.06 });
          R.curve((s) => M.matVec(T, [Math.cos(s), Math.sin(s)]), 0, 2 * Math.PI, { color: 'blue', width: 2.4 });
          R.curve((s) => M.matVec(Ts, [Math.cos(s), Math.sin(s)]), 0, 2 * Math.PI, { color: 'red', width: 2.2, dash: [6, 4] });
          axes(R, T, 'blue'); axes(R, Ts, 'red');
          R.line(0, 0, c1.x, c1.y, { color: 'ink', width: 1.2 }); R.line(0, 0, c2.x, c2.y, { color: 'ink', width: 1.2 });
          const big = Math.max(2.3, n * n * 1.08, n * 1.15);
          R.setView([-big, big], [-big, big]);
          st = { a: M.dot(TX, Y), b: M.dot(X, TsY), n, ns: M.svd2(Ts)[0], ntt: M.svd2(TT)[0] };
          v.legend([['blue', '$T(\\text{circle})$'], ['red', '$T^*(\\text{circle})$', { dash: true }], ['green', '$T^*T(\\text{circle})$']]);
        });
        v.readout(() => `$(Tx,y) = ${v.fix(st.a, 4)} = (x,T^*y) = ${v.fix(st.b, 4)}$; $\\;\\|T\\| = ${v.fix(st.n, 4)}$, $\\|T^*\\| = ${v.fix(st.ns, 4)}$, $\\;\\|T^*T\\| = ${v.fix(st.ntt, 4)} = \\|T\\|^2 = ${v.fix(st.n * st.n, 4)}$.`);
      },
    },
  ],
};
