// Rudin, Functional Analysis — Chapter 1, part 5: topologies from seminorms, normability,
// quotient spaces (1.37–1.43).

const TAU = 2 * Math.PI;
const bump = (x) => (Math.abs(x) < 1 ? Math.E * Math.exp(-1 / (1 - x * x)) : 0); // max 1 at 0
const pnorm = (x, y, p) => p === Infinity ? Math.max(Math.abs(x), Math.abs(y)) : Math.pow(Math.abs(x) ** p + Math.abs(y) ** p, 1 / p);
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const unitBall = (p, n = 240) => Array.from({ length: n }, (_, i) => { const t = TAU * i / n, c = Math.cos(t), s = Math.sin(t); const r = 1 / pnorm(c, s, p); return [r * c, r * s]; });

export default {
  collection: 'fa',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.37
    {
      num: '1.37',
      kind: 'Theorem',
      name: 'A separating family of seminorms defines a locally convex topology',
      statement: String.raw`Let $\mathscr P$ be a separating family of seminorms on a vector space $X$. For $p\in\mathscr P$ and $n\in\N$ put $V(p,n)=\{x:p(x)<1/n\}$, and let $\mathscr B$ be the collection of all finite intersections of the sets $V(p,n)$. Then $\mathscr B$ is a convex balanced local base for a topology $\tau$ which makes $X$ a locally convex space, and
(a) every $p\in\mathscr P$ is continuous, and
(b) a set $E\subset X$ is bounded if and only if every $p\in\mathscr P$ is bounded on $E$.`,
      idea: String.raw`Declare a set open when it is a union of translates of members of $\mathscr B$. Each $V(p,n)$ is convex and balanced (1.34), and $\tfrac12 V+\tfrac12V\subset V$ gives continuity of addition; separation makes points closed. Continuity of $p$ follows from $\abs{p(x)-p(y)}\le p(x-y)$. For (b), if $p\le M$ on $E$ for every $p$ involved in $W=\bigcap_{i\le m}V(p_i,n_i)$, then $E\subset tW$ for $t>M\max n_i$; the converse uses that each $V(p,1)$ is a neighbourhood of $0$.`,
      caption: String.raw`$X=C(\R)$ with the separating seminorms $p_k(f)=\sup_{\abs x\le k}\abs{f(x)}$. The shaded window is $[-k,k]$ and the dashed tube is $\{\abs f\le\sup_E p_k\}$ there. Choose a set $E$ (seven members shown). The bars give $\sup_{f\in E}p_k(f)$ for each $k$: the marching bumps $f_j=j\,\phi(x-j)$ are bounded in $C(\R)$ even though their sup norms grow without bound, because each fixed window sees only finitely many of them; the bumps growing at $0$ are not.`,
      deps: ['fa-1.33', 'fa-1.34', 'fa-1.8'],
      tags: ['seminorms', 'local convexity', 'boundedness'],
      viz(v) {
        const SETS = {
          march: { label: 'bumps marching to $\\infty$', f: (j) => (x) => j * bump(x - j), sup: (k) => k, bounded: true },
          grow: { label: 'bumps growing at $0$', f: (j) => (x) => j * bump(x), sup: () => Infinity, bounded: false },
          sin: { label: '$\\sin(jx)$', f: (j) => (x) => Math.sin(j * x), sup: () => 1, bounded: true },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'march');
        const kS = v.slider('window $k$', 1, 6, 3, { int: true });
        const T = v.stage({ x: [-6.6, 7.6], y: [-1.4, 8], height: 300, axes: true, full: true, title: 'members $f_1,\\dots,f_7$ of $E$ and the window of $p_k$' });
        const B = v.stage({ x: [0.3, 6.7], y: [0, 8], height: 170, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6], title: '$\\sup_{f\\in E}p_k(f)$ for $k=1,\\dots,6$' });
        let st = {};
        v.render(() => {
          const E = SETS[which.value], k = kS.value;
          T.vband(-k, k, { color: 'orange', alpha: 0.1, edges: true });
          const sk = E.sup(k);
          if (isFinite(sk)) T.rect(-k, -sk, k, sk, { color: 'orange', width: 1.6, dash: [6, 4] });
          const cols = ['blue', 'purple', 'teal', 'pink', 'gold', 'green', 'red'];
          for (let j = 1; j <= 7; j++) T.fn(E.f(j), { color: cols[j - 1], width: 1.8, n: 900 });
          T.tex('[-k,k]', 0, T.bounds.y[1], { color: 'orange', baseline: 'top', dy: 6, size: 14 });
          const vals = [1, 2, 3, 4, 5, 6].map((kk) => E.sup(kk));
          vals.forEach((s, i) => {
            const kk = i + 1, h = isFinite(s) ? s : 7.6;
            B.rect(kk - 0.3, 0, kk + 0.3, h, { fill: isFinite(s) ? (kk === k ? 'orange' : 'accent') : 'red', fillAlpha: 0.75, stroke: false });
            if (!isFinite(s)) B.text('∞', kk, 7.6, { align: 'center', baseline: 'bottom', color: 'red', size: 14, dy: -2 });
          });
          st = { E, k, sk };
        });
        v.readout(() => {
          const { E, k, sk } = st; if (!E) return '';
          if (!E.bounded) return `$p_1(f_j)=j\\to\\infty$: a single seminorm is unbounded on $E$, so by (b) $E$ is not bounded.`;
          return `$\\sup_E p_${k} = ${sk}$, finite for every $k$ — so $E$ is bounded by (b)` + (which.value === 'march' ? ', although $\\sup_x|f_j(x)| = j\\to\\infty$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.39
    {
      num: '1.39',
      kind: 'Theorem',
      name: "Kolmogorov's normability criterion",
      statement: String.raw`A topological vector space $X$ is normable if and only if its origin has a convex bounded neighbourhood.`,
      idea: String.raw`A norm ball is convex and bounded. Conversely, if $V$ is a convex bounded neighbourhood of $0$, it contains a convex balanced neighbourhood $U$ (1.14), still bounded. Put $\norm x=\mu_U(x)$: it is a seminorm (1.35), the sets $rU$ are its balls and form a local base by 1.15(c), and it is a norm because $U$ bounded forces $\mu_U(x)>0$ for $x\ne0$ (the space is Hausdorff).`,
      caption: String.raw`Left: in $\R^2$ the quasi-ball $B_p=\{\abs{x_1}^p+\abs{x_2}^p<1\}$ is not convex when $p<1$, but its convex hull (dashed) is still bounded, so its gauge is a norm — here the $\ell^1$ norm. Right: in $L^p[0,1]$ with $0<p<1$ the analogous hull is unbounded. The $n$ functions $f_k=n^{1/p}\mathbf 1_{[(k-1)/n,\,k/n]}$ all have $\Delta(f_k)=\int\abs{f_k}^p=1$, yet their average, the constant $n^{1/p-1}$, has $\Delta=n^{1-p}\to\infty$: no convex neighbourhood of $0$ is bounded, and $L^p$ is not normable. Push $p$ to $1$ and the effect disappears.`,
      deps: ['fa-1.35', 'fa-1.14', 'fa-1.15', 'fa-1.8'],
      see: ['rca-3.5'],
      tags: ['normability', 'convexity', 'local boundedness'],
      viz(v) {
        const pS = v.slider('$p$', 0.25, 2, 0.5, { step: 0.01 });
        const nS = v.slider('$n$ (right)', 1, 24, 6, { int: true });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.3, 1.3], equal: true, height: 320, ticks: false, title: '$\\R^2$: $B_p$ and its convex hull' });
        const R = v.stage({ x: [0, 1], y: [0, 10], height: 320, axes: 'box', title: '$L^p[0,1]$: the $f_k$ and their average $g$' });
        let st = {};
        v.render(() => {
          const p = pS.value, n = nS.value;
          const ball = unitBall(p, 360), H = hull(ball);
          L.poly(H, { color: 'green', width: 1.8, dash: [6, 4], fill: 'green', fillAlpha: 0.06 });
          L.poly(ball, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          L.tex('B_p', 0.25, 0.2, { color: 'accent', size: 15 });
          L.tex('\\operatorname{co}B_p', 0.62, 0.62, { color: 'green', size: 14, align: 'left' });
          // right: f_k and their average
          const hgt = Math.pow(n, 1 / p), g = Math.pow(n, 1 / p - 1);
          R.setView([0, 1], [0, Math.max(1.5, hgt) * 1.12]);
          const cols = ['blue', 'purple', 'teal', 'pink'];
          for (let k = 0; k < n; k++) { R.rect(k / n, 0, (k + 1) / n, hgt, { fill: cols[k % 4], fillAlpha: 0.35, color: cols[k % 4], width: 1 }); if (n <= 12) R.text('f' + String(k + 1).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join(''), (k + 0.5) / n, hgt, { align: 'center', baseline: 'bottom', dy: -3, size: 12, color: cols[k % 4] }); }
          R.hline(g, { color: 'green', width: 3 });
          R.text(`g = average, height ${v.fmt(g, 3)}`, 0.98, g, { color: 'green', align: 'right', baseline: 'bottom', dy: -4, size: 12 });
          st = { p, n, hgt, g, Dg: Math.pow(n, 1 - p), convex: p >= 1 };
        });
        v.legend([['accent', '$B_p$', { area: true }], ['green', 'convex hull / average $g$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.p == null) return '';
          return `Left: $B_p$ is ${s.convex ? 'convex' : 'not convex'}; its hull is bounded, so $\\R^2$ is normable. Right: $\\Delta(f_k)=1$ for each $k$, $\\Delta(g) = n^{1-p} = ${v.fmt(s.Dg, 4)}$` + (s.p < 1 ? ' — unbounded as $n\\to\\infty$: convex combinations escape every ball.' : ' — at $p\\ge1$ averaging no longer inflates $\\Delta$, and $\\Delta^{1/p}$ is a norm.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.40
    {
      num: '1.40',
      kind: 'Definition',
      name: 'Quotient spaces',
      statement: String.raw`Let $N$ be a subspace of a vector space $X$. For $x\in X$ let $\pi(x)=x+N$ be the coset of $N$ containing $x$. The cosets form a vector space $X/N$ under $(x+N)+(y+N)=(x+y)+N$ and $\alpha(x+N)=\alpha x+N$; its zero is $N$, and the **quotient map** $\pi:X\to X/N$ is linear with null space $N$. If $\tau$ is a vector topology on $X$, the **quotient topology** $\tau_N$ consists of all $E\subset X/N$ with $\pi^{-1}(E)\in\tau$. If $X$ is normed, $\norm{\pi x}=\inf\{\norm{x-y}:y\in N\}$ is the **quotient norm**.`,
      idea: String.raw`The quotient collapses each coset to a point, so linear algebra on $X/N$ is linear algebra on $X$ "modulo $N$". The quotient topology is the finest topology making $\pi$ continuous; 1.41 shows it is a vector topology when $N$ is closed.`,
      caption: String.raw`$X=\R^2$ and $N$ a line through $0$ (drag its direction). Each coset $x+N$ is a parallel line; the quotient $X/N$ is drawn as the perpendicular axis, where $\pi(x)$ is the point at which $x+N$ crosses it, and the quotient norm is the distance from $x$ to $N$. Drag $x$ and $y$: the coset of $x+y$ lands at $\pi(x)+\pi(y)$.`,
      deps: ['fa-1.6'],
      tags: ['quotient spaces'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 360, ticks: false });
        const hn = S.handle(1.6, 0.55, { color: 'ink', label: 'N', r: 6 });
        const hx = S.handle(-0.4, 1.1, { color: 'blue', label: 'x' });
        const hy = S.handle(1.0, -0.4, { color: 'purple', label: 'y' });
        let st = {};
        v.render(() => {
          const L = Math.hypot(hn.x, hn.y) || 1, u = [hn.x / L, hn.y / L], w = [-u[1], u[0]];
          for (let k = -8; k <= 8; k++) { const c = k * 0.4; S.line(c * w[0] - 9 * u[0], c * w[1] - 9 * u[1], c * w[0] + 9 * u[0], c * w[1] + 9 * u[1], { color: 'grid', width: 1 }); }
          S.line(-9 * u[0], -9 * u[1], 9 * u[0], 9 * u[1], { color: 'ink', width: 2.4 });
          S.line(-9 * w[0], -9 * w[1], 9 * w[0], 9 * w[1], { color: 'green', width: 2 });
          S.tex('X/N', 1.75 * w[0], 1.75 * w[1], { color: 'green', dx: 22, size: 15 });
          const pr = (x, y) => x * w[0] + y * w[1];
          const pts = [[hx.x, hx.y, 'blue', 'x'], [hy.x, hy.y, 'purple', 'y'], [hx.x + hy.x, hx.y + hy.y, 'gold', 'x+y']];
          for (const [x, y, c, lab] of pts) {
            S.line(x - 9 * u[0], y - 9 * u[1], x + 9 * u[0], y + 9 * u[1], { color: c, width: 1.6, alpha: 0.75 });
            const t = pr(x, y);
            S.line(x, y, t * w[0], t * w[1], { color: c, width: 1, dash: [3, 3] });
            S.dot(t * w[0], t * w[1], { color: c, r: 5, label: `π(${lab})`, labelPos: 'w', labelSize: 13 });
          }
          S.dot(hx.x + hy.x, hx.y + hy.y, { color: 'gold', r: 4 });
          S.dot(0, 0, { color: 'ink', r: 3 });
          st = { a: pr(hx.x, hx.y), b: pr(hy.x, hy.y), c: pr(hx.x + hy.x, hx.y + hy.y) };
        });
        v.legend([['ink', '$N$'], ['green', 'the quotient line $X/N$'], ['blue', 'cosets $x+N$, $y+N$, $(x+y)+N$']]);
        v.readout(() => `Coordinates on $X/N$: $\\pi(x) = ${v.fix(st.a, 3)}$, $\\pi(y) = ${v.fix(st.b, 3)}$, $\\pi(x+y) = ${v.fix(st.c, 3)} = \\pi(x)+\\pi(y)$; $\\;\\|\\pi x\\| = \\operatorname{dist}(x,N) = ${v.fix(Math.abs(st.a), 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 1.41
    {
      num: '1.41',
      kind: 'Theorem',
      name: 'Quotients by closed subspaces',
      statement: String.raw`Let $N$ be a closed subspace of a topological vector space $X$, with topology $\tau$, and give $X/N$ the quotient topology $\tau_N$.
(a) $\tau_N$ is a vector topology on $X/N$, and the quotient map $\pi:X\to X/N$ is linear, continuous and open.
(b) If $\mathscr B$ is a local base for $\tau$, then $\{\pi(V):V\in\mathscr B\}$ is a local base for $\tau_N$.
(c) Each of the following properties passes from $X$ to $X/N$: local convexity, local boundedness, metrizability, normability.
(d) If $X$ is an F-space, a Fréchet space or a Banach space, so is $X/N$.`,
      idea: String.raw`Openness: $\pi^{-1}(\pi(V))=V+N$ is a union of translates of $V$. Points are closed because $\pi^{-1}(\pi x)=x+N$ is closed — this is where closedness of $N$ is used. Continuity of the operations descends from $X$ via open neighbourhoods $\pi(V)$. For (c) and (d) one transports the structure: $\pi$ of a convex or bounded set is convex or bounded, and an invariant metric $d$ induces $\rho(\pi x,\pi y)=\inf_{z\in N}d(x-y,z)$, complete when $d$ is.`,
      caption: String.raw`$X=\R^2$, $N$ the line at the chosen angle, $X/N$ the green axis. Drag the open disc $E$: its image $\pi(E)$ (its shadow along $N$) is an open interval — $\pi$ is open, and images of the local base of discs form the local base of intervals. Switch to the closed set $E=\{(t,1/t):t>0\}$ with $N$ horizontal: its image is $(0,\infty)$, which is not closed — $\pi$ is open, but not a closed map.`,
      deps: ['fa-1.40', 'fa-1.24', 'fa-1.8'],
      tags: ['quotient spaces', 'open maps'],
      viz(v) {
        const Esel = v.select('$E$', [{ value: 'disc', label: 'open disc' }, { value: 'hyp', label: 'closed set $\\{(t,1/t)\\}$' }], 'disc');
        const th = v.slider('angle of $N$', -1.2, 1.2, 0.35, { step: 0.01, fmt: (x) => `${Math.round(x * 180 / Math.PI)}°` });
        const rS = v.slider('radius of $E$', 0.15, 1.2, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-3, 4], y: [-2, 2.6], equal: true, height: 360, ticks: false });
        const hc = S.handle(1.4, 0.9, { color: 'blue', label: 'E' });
        let st = {};
        v.render(() => {
          const a = Esel.value === 'hyp' ? 0 : th.value, u = [Math.cos(a), Math.sin(a)], w = [-u[1], u[0]];
          hc.visible = Esel.value === 'disc';
          S.line(-9 * u[0], -9 * u[1], 9 * u[0], 9 * u[1], { color: 'ink', width: 2.2 });
          S.line(-9 * w[0], -9 * w[1], 9 * w[0], 9 * w[1], { color: 'green', width: 1.6 });
          S.tex('N', 2.7 * u[0], 2.7 * u[1], { color: 'ink', dy: -12 });
          S.tex('X/N', -1.85 * w[0], -1.85 * w[1], { color: 'green', dx: 22 });
          const pr = (x, y) => x * w[0] + y * w[1];
          if (Esel.value === 'disc') {
            const r = rS.value, c = [hc.x, hc.y], t0 = pr(...c);
            S.circle(c[0], c[1], r, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 1.8, dash: [5, 4] });
            for (const s of [-1, 1]) { const q = [c[0] + s * r * w[0], c[1] + s * r * w[1]]; const t = pr(...q); S.line(q[0], q[1], t * w[0], t * w[1], { color: 'faint', width: 1, dash: [3, 3] }); }
            const A = [(t0 - r) * w[0], (t0 - r) * w[1]], B = [(t0 + r) * w[0], (t0 + r) * w[1]];
            S.line(A[0], A[1], B[0], B[1], { color: 'green', width: 6, cap: 'butt' });
            S.dot(A[0], A[1], { hollow: true, color: 'green', r: 5 }); S.dot(B[0], B[1], { hollow: true, color: 'green', r: 5 });
            st = { disc: true, lo: t0 - r, hi: t0 + r };
          } else {
            S.fn((x) => 1 / x, { domain: [0.12, 30], color: 'blue', width: 2.4 });
            S.tex('E', 0.55, 2.2, { color: 'blue', size: 16 });
            for (const t of [0.4, 0.7, 1.2, 2, 3.2]) S.line(t, 1 / t, 0, 1 / t, { color: 'faint', width: 1, dash: [3, 3] });
            S.line(0, 0.02, 0, 9, { color: 'green', width: 6, cap: 'butt' });
            S.dot(0, 0, { hollow: true, color: 'red', r: 6, width: 2.4, label: '0 ∉ π(E)', labelPos: 'e', math: false, labelSize: 12 });
            st = { disc: false };
          }
          S.dot(0, 0, { color: 'ink', r: 2.5 });
        });
        v.legend([['blue', '$E\\subset X$', { area: true }], ['green', '$\\pi(E)\\subset X/N$']]);
        v.readout(() => st.disc ? `$\\pi(E) = (${v.fix(st.lo, 3)},\\ ${v.fix(st.hi, 3)})$: an open interval. Every open set is a union of such discs, so $\\pi$ maps open sets to open sets.` : '$E$ is closed in $\\R^2$, but $\\pi(E) = (0,\\infty)$ is not closed in $X/N$: the quotient map is open, not closed.');
      },
    },
    // ------------------------------------------------------------------ 1.42
    {
      num: '1.42',
      kind: 'Theorem',
      name: 'Seminorms on quotient spaces',
      statement: String.raw`Let $N$ be a subspace of a vector space $X$, $p$ a seminorm on $X$, and define
$$q(\pi x)=\inf\{p(x+y):y\in N\}.$$
Then $q$ is a well-defined seminorm on $X/N$, and $\{u\in X/N:q(u)<1\}=\pi(\{x\in X:p(x)<1\})$.`,
      idea: String.raw`$q$ depends only on the coset, and its subadditivity comes from adding near-minimizers: $p(x+y_1)+p(x'+y_2)\ge p(x+x'+y_1+y_2)\ge q(\pi(x+x'))$. Homogeneity is clear. If $q(\pi x)<1$ some $x+y$ with $y\in N$ has $p<1$, so $\pi x=\pi(x+y)$ is the image of a point of the unit ball; the converse is immediate.`,
      caption: String.raw`$X=\R^2$ with a norm $p$ (choose its unit ball), $N$ a line through $0$. Drag $x$: along the coset $x+N$ the point minimizing $p$ (green) realises $q(\pi x)$, and the dashed ball through it touches the coset. The shadow of the unit ball $\{p<1\}$ along $N$ (green bar on the quotient axis) is exactly $\{q<1\}$; $\pi x$ lies in it precisely when the coset meets the ball.`,
      deps: ['fa-1.40', 'fa-1.34'],
      verify: true,
      tags: ['quotient spaces', 'seminorms'],
      viz(v) {
        const P = v.select('$p$', [{ value: 1, label: '$\\ell^1$' }, { value: 2, label: '$\\ell^2$' }, { value: Infinity, label: '$\\ell^\\infty$' }], 1);
        const th = v.slider('angle of $N$', 0, 3.14, 0.45, { step: 0.01, fmt: (x) => `${Math.round(x * 180 / Math.PI)}°` });
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 360, ticks: false });
        const hx = S.handle(1.15, 1.15, { color: 'blue', label: 'x' });
        let st = {};
        v.render(() => {
          const p = P.value, a = th.value, u = [Math.cos(a), Math.sin(a)], w = [-u[1], u[0]];
          const ball = unitBall(p, 240);
          S.line(-9 * u[0], -9 * u[1], 9 * u[0], 9 * u[1], { color: 'ink', width: 2 });
          S.line(-9 * w[0], -9 * w[1], 9 * w[0], 9 * w[1], { color: 'green', width: 1.4, alpha: 0.7 });
          S.poly(ball, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2 });
          // shadow of the ball on X/N
          const sh = ball.map(([x, y]) => x * w[0] + y * w[1]); const lo = Math.min(...sh), hi = Math.max(...sh);
          S.line(lo * w[0], lo * w[1], hi * w[0], hi * w[1], { color: 'green', width: 6, cap: 'butt' });
          // coset and minimiser
          const f = (s) => pnorm(hx.x + s * u[0], hx.y + s * u[1], p);
          let L = -8, H = 8; for (let i = 0; i < 80; i++) { const m1 = L + (H - L) / 3, m2 = H - (H - L) / 3; if (f(m1) < f(m2)) H = m2; else L = m1; }
          const s0 = (L + H) / 2, q = f(s0), mpt = [hx.x + s0 * u[0], hx.y + s0 * u[1]];
          S.line(hx.x - 9 * u[0], hx.y - 9 * u[1], hx.x + 9 * u[0], hx.y + 9 * u[1], { color: 'blue', width: 1.6 });
          S.poly(ball.map(([x, y]) => [q * x, q * y]), { color: 'orange', width: 1.6, dash: [6, 4] });
          S.dot(mpt[0], mpt[1], { color: 'green', r: 5.5, label: 'argmin p', labelPos: 'se', math: false, labelSize: 12 });
          const t = hx.x * w[0] + hx.y * w[1];
          S.dot(t * w[0], t * w[1], { color: 'blue', r: 4.5, label: 'πx', labelPos: 'w' });
          S.tex('x+N', hx.x - 1.7 * u[0], hx.y - 1.7 * u[1], { color: 'blue', dy: -14, size: 14 });
          S.dot(0, 0, { color: 'ink', r: 2.5 });
          st = { q, px: pnorm(hx.x, hx.y, p), inside: q < 1 };
        });
        v.legend([['accent', '$\\{p<1\\}$', { area: true }], ['orange', 'ball of radius $q(\\pi x)$', { dash: true }], ['green', '$\\{q<1\\}=\\pi\\{p<1\\}$']]);
        v.readout(() => `$p(x) = ${v.fix(st.px, 3)}$, $\\;q(\\pi x) = \\min_{y\\in N}p(x+y) = ${v.fix(st.q, 3)}$ — ` + (st.inside ? 'the coset meets the unit ball, and $\\pi x$ lies in the green bar.' : 'the coset misses the unit ball, and $\\pi x$ lies outside the green bar.'));
      },
    },
    // ------------------------------------------------------------------ 1.43
    {
      num: '1.43',
      kind: 'Theorem',
      name: 'Closed plus finite-dimensional is closed',
      statement: String.raw`Let $N$ and $F$ be subspaces of a topological vector space $X$. If $N$ is closed and $F$ has finite dimension, then $N+F$ is closed.`,
      idea: String.raw`Let $\pi:X\to X/N$ be the quotient map; $X/N$ is a TVS because $N$ is closed (1.41). The image $\pi(F)$ is a finite-dimensional subspace of $X/N$, hence closed (1.21). Since $\pi$ is continuous, $N+F=\pi^{-1}(\pi(F))$ is closed.`,
      caption: String.raw`In $X=\ell^2$ let $N$ be the closed span of the even basis vectors $e_2,e_4,\dots$ (blue outlines). With an infinite-dimensional closed $M=\overline{\operatorname{span}}\{e_{2n}+e_{2n+1}/n\}$ the sum fails: $y_k=\sum_{n\le k}\big[(e_{2n}+\tfrac{e_{2n+1}}n)-e_{2n}\big]\in N+M$ converges to $y=\sum e_{2n+1}/n$, yet the two pieces have norms $\sim\sqrt k$ and $y\notin N+M$. With a one-dimensional $F$ the pieces of a convergent sequence $z_k=a_k+t_kf$ stay bounded and converge, as the quotient argument predicts.`,
      deps: ['fa-1.41', 'fa-1.21'],
      verify: true,
      tags: ['closed subspaces', 'quotient spaces', 'finite dimension'],
      viz(v) {
        const mode = v.select('second summand', [{ value: 'M', label: 'infinite-dim. $M$' }, { value: 'F', label: '$F=\\operatorname{span}\\{f\\}$' }], 'M');
        const kS = v.slider('$k$', 1, 30, 10, { int: true });
        const T = v.stage({ x: [0.3, 40.7], y: [-1.2, 1.25], height: 230, full: true, axes: 'box', xticks: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38], title: 'coordinates of the sum (bars) and of its two pieces (outlines)' });
        const C = v.stage({ x: [0, 31], y: [0, 6], height: 200, full: true, axes: 'box', xlabel: 'k', title: 'norms against $k$' });
        const K = 20; // coordinates 1..40
        const f = Array.from({ length: 41 }, (_, i) => (i >= 1 && i % 2 === 1 ? 1 / ((i + 1) / 2) ** 2 : 0)); // f = Σ e_{2n+1}/n² (odd coords)
        let st = {};
        v.render(() => {
          const k = kS.value, isM = mode.value === 'M';
          const a = new Array(41).fill(0), b = new Array(41).fill(0);
          if (isM) { for (let n = 1; n <= Math.min(k, K); n++) { a[2 * n] = -1; b[2 * n] = 1; if (2 * n + 1 <= 40) b[2 * n + 1] = 1 / n; } }
          else { const t = 1 + 1 / k; for (let n = 1; n <= K; n++) a[2 * n] = n <= k ? 1 / n : 0; for (let i = 1; i <= 40; i++) b[i] = t * f[i]; }
          const sum = a.map((x, i) => x + b[i]);
          for (let i = 1; i <= 40; i++) {
            if (sum[i]) T.rect(i - 0.35, 0, i + 0.35, sum[i], { fill: i % 2 ? 'gold' : 'blue', fillAlpha: 0.75, stroke: false });
            if (a[i]) T.rect(i - 0.42, 0, i + 0.42, a[i], { color: 'blue', width: 1.2, dash: [3, 2] });
            if (b[i] && i % 2 === 0) T.rect(i - 0.42, 0, i + 0.42, b[i], { color: isM ? 'red' : 'green', width: 1.2, dash: [3, 2] });
          }
          T.hline(0, { color: 'faint', width: 1 });
          // norms chart over k
          const rows = [];
          for (let kk = 1; kk <= 30; kk++) {
            let na, nb, err;
            if (isM) { na = Math.sqrt(kk); let s = 0; for (let n = 1; n <= kk; n++) s += 1 + 1 / (n * n); nb = Math.sqrt(s); let e = 0; for (let n = kk + 1; n <= 4000; n++) e += 1 / (n * n); err = Math.sqrt(e); }
            else { let s = 0; for (let n = 1; n <= kk; n++) s += 1 / (n * n); na = Math.sqrt(s); const nf = Math.sqrt(f.reduce((x, y) => x + y * y, 0)); nb = (1 + 1 / kk) * nf; let e = 0; for (let n = kk + 1; n <= 4000; n++) e += 1 / (n * n); err = Math.sqrt(e + (nf / kk) ** 2); }
            rows.push([kk, na, nb, err]);
          }
          C.setView(null, [0, Math.max(2, ...rows.map((r) => Math.max(r[1], r[2]))) * 1.1]);
          C.path(rows.map((r) => [r[0], r[1]]), { color: 'blue', width: 2.2 });
          C.path(rows.map((r) => [r[0], r[2]]), { color: isM ? 'red' : 'green', width: 2.2 });
          C.path(rows.map((r) => [r[0], r[3]]), { color: 'gold', width: 2.2, dash: [5, 4] });
          const r = rows[k - 1];
          C.dot(k, r[1], { color: 'blue', r: 4 }); C.dot(k, r[2], { color: isM ? 'red' : 'green', r: 4 }); C.dot(k, r[3], { color: 'gold', r: 4 });
          st = { isM, k, na: r[1], nb: r[2], err: r[3] };
          v.legend([['gold', isM ? 'sum $y_k$; dashed: $\\|y-y_k\\|$' : 'sum $z_k$; dashed: $\\|z-z_k\\|$', { area: true }], ['blue', 'piece in $N$'], [isM ? 'red' : 'green', isM ? 'piece in $M$' : 'piece in $F$']]);
        });
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          if (s.isM) return `$\\|y-y_{${s.k}}\\| = ${v.fix(s.err, 3)}\\to0$, while the pieces have norms $${v.fix(s.na, 2)}$ and $${v.fix(s.nb, 2)}$ (both $\\sim\\sqrt k$). Writing $y=a+b$ with $b=\\sum\\beta_n(e_{2n}+e_{2n+1}/n)$ forces $\\beta_n=1$, which is not in $\\ell^2$: $y\\in\\overline{N+M}\\setminus(N+M)$.`;
          return `$\\|z-z_{${s.k}}\\| = ${v.fix(s.err, 3)}\\to0$ and the pieces converge (norms $${v.fix(s.na, 3)}$ and $${v.fix(s.nb, 3)}$): the limit $\\sum e_{2n}/n + f$ lies in $N+F$.`;
        });
      },
    },
  ],
};
