// Rudin, Functional Analysis — Chapter 1, part 4: boundedness and continuity, seminorms and
// Minkowski functionals (1.30–1.36).

const TAU = 2 * Math.PI;
function circlePoly(cx, cy, r, n = 96) { const out = []; for (let i = 0; i < n; i++) { const t = TAU * i / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return out; }
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function rayExit(poly, ux, uy) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], ay = poly[j][1], ex = poly[i][0] - ax, ey = poly[i][1] - ay;
    const den = ux * ey - uy * ex; if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ey - ay * ex) / den, s = (ax * uy - ay * ux) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9 && t > 1e-12 && t < best) best = t;
  }
  return best;
}
/** Minkowski functional of a polygon that is star-shaped about an interior point 0. */
function gauge(poly, x, y) { const r = Math.hypot(x, y); if (r < 1e-15) return 0; return r / rayExit(poly, x / r, y / r); }
/** Closed examples: polygon star-shaped about interior 0, disk tangent at 0,
 * or the horizontal segment [−halfLength, halfLength]. */
export function exampleSetGauge(shape, x, y) {
  const r2 = x * x + y * y;
  if (r2 === 0) return 0;
  if (shape.poly) return gauge(shape.poly, x, y);
  if (shape.tangentDiskRadius) return x > 0 ? r2 / (2 * shape.tangentDiskRadius * x) : Infinity;
  return y === 0 ? Math.abs(x) / shape.halfLength : Infinity;
}
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const byAngle = (pts) => pts.slice().sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));

export default {
  collection: 'fa',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.30
    {
      num: '1.30',
      kind: 'Theorem',
      name: 'Bounded sets via null sequences of scalars',
      statement: String.raw`For a subset $E$ of a topological vector space $X$ the following are equivalent:
(a) $E$ is bounded;
(b) whenever $x_n\in E$ and $\alpha_n$ are scalars with $\alpha_n\to0$, we have $\alpha_nx_n\to0$.`,
      idea: String.raw`(a)⇒(b): given a balanced neighbourhood $V$ of $0$, $E\subset tV$ for some $t$, so $\alpha_nx_n\in V$ as soon as $\abs{\alpha_n}t<1$. (b)⇒(a): if $E$ is not bounded, some $V$ and some $r_n\to\infty$ admit $x_n\in E$ with $x_n\notin r_nV$; with $\alpha_n=1/r_n$ the points $\alpha_nx_n$ never enter $V$.`,
      caption: String.raw`Choose a set $E$ and a null sequence $\alpha_n$. Left: points $x_n\in E$ (gold) and the scaled points $\alpha_nx_n$ (green, or red when they do not settle at $0$). Right: $\norm{\alpha_nx_n}$ against $n$. For the bounded blob any choice of $x_n$ works, with $\norm{\alpha_nx_n}\le\abs{\alpha_n}\sup_E\norm x$ (dashed). For the unbounded region an adversary picks $x_n$ on the parabola with $\norm{x_n}=1.5/\abs{\alpha_n}$, and $\alpha_nx_n$ stays on the circle of radius $1.5$.`,
      deps: ['fa-1.6', 'fa-1.14'],
      tags: ['boundedness', 'sequences'],
      viz(v) {
        const M = v.M;
        const Esel = v.select('$E$', [{ value: 'blob', label: 'bounded blob' }, { value: 'par', label: 'unbounded region' }], 'blob');
        const Asel = v.select('$\\alpha_n$', [{ value: 'n', label: '$1/n$' }, { value: 'sqrt', label: '$1/\\sqrt n$' }, { value: 'log', label: '$1/\\log(n+1)$' }], 'sqrt');
        const nS = v.slider('$n$ up to', 5, 80, 40, { int: true });
        const L = v.stage({ x: [-2.6, 2.6], y: [-1.6, 2.4], equal: true, height: 330, ticks: false, title: '$x_n\\in E$ and $\\alpha_nx_n$' });
        const R = v.stage({ x: [0, 81], y: [0, 2.2], height: 330, axes: 'box', xlabel: 'n', title: '$\\|\\alpha_nx_n\\|$' });
        const blob = M.blob(0.9, 0.9, 0.9, 12, 0.3, 120);
        const rng = M.rng(3); const pts = []; while (pts.length < 80) { const p = [rng.uniform(-0.4, 2.2), rng.uniform(-0.4, 2.2)]; if (inPoly(p[0], p[1], blob)) pts.push(p); }
        const al = { n: (n) => 1 / n, sqrt: (n) => 1 / Math.sqrt(n), log: (n) => 1 / Math.log(n + 1) };
        const par = (t) => [t, 0.35 * t * t - 0.6];
        let st = {};
        v.render(() => {
          const A = al[Asel.value], N = nS.value, bounded = Esel.value === 'blob';
          const xs = [];
          if (bounded) for (let n = 1; n <= N; n++) xs.push(pts[n - 1]);
          else for (let n = 1; n <= N; n++) {
            const target = 1.5 / A(n), sg = n % 2 ? 1 : -1;
            const t = M.bisect((t) => Math.hypot(...par(t)) - target, 0.0, 1e4);
            xs.push(par(sg * t));
          }
          if (bounded) L.poly(blob, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.8 });
          else {
            const pr = []; for (let i = 0; i <= 200; i++) pr.push(par(-6 + 12 * i / 200));
            L.poly(pr.concat([[6, 30], [-6, 30]]), { fill: 'blue', fillAlpha: 0.12, stroke: false });
            L.path(pr, { color: 'blue', width: 1.8 });
            L.circle(0, 0, 1.5, { color: 'red', width: 1, dash: [4, 4] });
          }
          L.tex('E', bounded ? 0.9 : -1.9, bounded ? 0.95 : 1.9, { color: 'blue', size: 17 });
          const sc = xs.map((x, i) => [A(i + 1) * x[0], A(i + 1) * x[1]]);
          L.dots(xs, { color: 'gold', r: 2.8 });
          for (let i = 0; i < xs.length; i++) L.line(xs[i][0], xs[i][1], sc[i][0], sc[i][1], { color: 'faint', width: 0.6, alpha: 0.5 });
          L.dots(sc, { color: bounded ? 'green' : 'red', r: 3.2 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // chart
          const norms = sc.map((p, i) => [i + 1, Math.hypot(p[0], p[1])]);
          const supE = Math.max(...blob.map((p) => Math.hypot(p[0], p[1])));
          if (bounded) R.fn((n) => A(n) * supE, { domain: [1, 80], color: 'green', width: 1.2, dash: [5, 4] });
          R.path(norms, { color: bounded ? 'green' : 'red', width: 1.6 });
          R.dots(norms, { color: bounded ? 'green' : 'red', r: 2.6 });
          st = { bounded, last: norms[norms.length - 1][1], N };
        });
        v.legend([['gold', '$x_n\\in E$', { dot: true }], ['green', '$\\alpha_nx_n\\to0$', { dot: true }], ['red', '$\\alpha_nx_n\\not\\to0$', { dot: true }]]);
        v.readout(() => st.bounded ? `$\\|\\alpha_{${st.N}}x_{${st.N}}\\| = ${v.fix(st.last, 3)}$, squeezed to $0$ by $|\\alpha_n|\\sup_E\\|x\\|$: $E$ is bounded and (b) holds.` : `$\\|\\alpha_nx_n\\| = 1.5$ for every $n$, although $\\alpha_n\\to0$: (b) fails, so $E$ is not bounded.`);
      },
    },
    // ------------------------------------------------------------------ 1.31
    {
      num: '1.31',
      kind: 'Definition',
      name: 'Bounded linear transformations',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces. A linear map $\Lambda:X\to Y$ is **bounded** if it maps bounded subsets of $X$ to bounded subsets of $Y$. When $X$ and $Y$ are normed, this agrees with the familiar condition $\sup\{\norm{\Lambda x}:\norm x\le1\}<\infty$.`,
      idea: String.raw`Boundedness and continuity are different notions in general topological vector spaces: continuity always implies boundedness, and 1.32 shows that the converse holds when $X$ is metrizable (so in particular for normed spaces), but not in general.`,
      deps: ['fa-1.6'],
      see: ['rca-5.3'],
      tags: ['linear maps', 'boundedness'],
    },
    // ------------------------------------------------------------------ 1.32
    {
      num: '1.32',
      kind: 'Theorem',
      name: 'Bounded vs continuous linear maps',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces and $\Lambda:X\to Y$ linear. Consider
(a) $\Lambda$ is continuous;
(b) $\Lambda$ is bounded;
(c) if $x_n\to0$, then $\{\Lambda x_n\}$ is bounded;
(d) if $x_n\to0$, then $\Lambda x_n\to0$.
Then (a)⇒(b)⇒(c). If $X$ is metrizable, also (c)⇒(d)⇒(a), so all four are equivalent.`,
      idea: String.raw`(a)⇒(b): if $E\subset tV$ with $\Lambda(V)\subset W$, then $\Lambda E\subset tW$. (b)⇒(c): a convergent sequence is bounded (1.30). For metrizable $X$, (c)⇒(d) is the trick of 1.28: pick $\gamma_n\to\infty$ with $\gamma_nx_n\to0$; then $\Lambda x_n=\gamma_n^{-1}\Lambda(\gamma_nx_n)$ is a bounded set times a null sequence, hence $\to0$ by 1.30. (d)⇒(a) because continuity is sequential in metric spaces.`,
      caption: String.raw`$X$ = polynomials on $[0,1]$ with the sup norm (metrizable), $x_n(t)=t^n/n\to0$. For $\Lambda=d/dt$ the images $\Lambda x_n=t^{n-1}$ stay bounded but do not tend to $0$, so (d) fails. Turn on the rescaling $\gamma_n=\sqrt n$ from 1.28: still $\gamma_nx_n\to0$, but now $\norm{\Lambda(\gamma_nx_n)}=\sqrt n\to\infty$ — (c), and with it (b) and (a), fail too. The integration operator $\Lambda f=\int_0^tf$ passes every test.`,
      deps: ['fa-1.31', 'fa-1.30', 'fa-1.28', 'fa-1.17', 'fa-1.24'],
      see: ['rca-5.3'],
      tags: ['linear maps', 'boundedness', 'continuity'],
      viz(v) {
        const op = v.select('$\\Lambda$', [{ value: 'D', label: '$d/dt$' }, { value: 'I', label: '$f\\mapsto\\int_0^t f$' }], 'D');
        const resc = v.toggle('rescale by $\\gamma_n=\\sqrt n$', false);
        const nS = v.slider('$n$', 1, 60, 12, { int: true });
        const L = v.stage({ x: [0, 1], y: [-0.05, 1.05], height: 260, axes: 'box', title: 'inputs $x_k$ (or $\\gamma_kx_k$), $k\\le n$' });
        const R = v.stage({ x: [0, 1], y: [-0.2, 8.5], height: 260, axes: 'box', title: 'outputs $\\Lambda x_k$' });
        const C = v.stage({ x: [0, 61], y: [-2.2, 1.2], height: 170, full: true, axes: 'box', xlabel: 'k', yticks: [[-2, '10⁻²'], [-1, '10⁻¹'], [0, '1'], [1, '10']], title: '$\\log_{10}$ of the norms: input (blue) and output (orange)' });
        let st = {};
        v.render(() => {
          const n = nS.value, g = resc.value ? (k) => Math.sqrt(k) : () => 1, D = op.value === 'D';
          const inp = (k) => (t) => g(k) * Math.pow(t, k) / k;
          const out = (k) => D ? (t) => g(k) * Math.pow(t, k - 1) : (t) => g(k) * Math.pow(t, k + 1) / (k * (k + 1));
          const outN = (k) => D ? g(k) : g(k) / (k * (k + 1));
          const inN = (k) => g(k) / k;
          const top = Math.max(1.05, ...Array.from({ length: n }, (_, i) => outN(i + 1))) * 1.08;
          R.setView(null, [-0.05 * top, top]);
          L.setView(null, [-0.05, Math.max(1.05, inN(1) * 1.1)]);
          for (let k = 1; k <= n; k++) { const last = k === n; L.fn(inp(k), { color: last ? 'blue' : 'faint', width: last ? 2.6 : 1 }); R.fn(out(k), { color: last ? 'orange' : 'faint', width: last ? 2.6 : 1 }); }
          const pin = [], pout = [];
          for (let k = 1; k <= 60; k++) { pin.push([k, Math.log10(inN(k))]); pout.push([k, Math.log10(outN(k))]); }
          C.setView(null, [Math.min(-2.2, Math.min(...pout.map((p) => p[1])) - 0.2), Math.max(1.2, Math.max(...pout.map((p) => p[1])) + 0.2)]);
          C.hline(0, { color: 'faint', dash: [3, 3], width: 1 });
          C.path(pin, { color: 'blue', width: 2 }); C.path(pout, { color: 'orange', width: 2 });
          C.dot(n, Math.log10(inN(n)), { color: 'blue', r: 4.5 }); C.dot(n, Math.log10(outN(n)), { color: 'orange', r: 4.5 });
          st = { D, r: resc.value, n, inN: inN(n), outN: outN(n) };
        });
        v.legend([['blue', 'inputs'], ['orange', 'outputs $\\Lambda(\\cdot)$']]);
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          const head = `$\\|${s.r ? '\\gamma_nx_n' : 'x_n'}\\|_\\infty = ${v.fmt(s.inN, 3)}$, $\\|\\Lambda(${s.r ? '\\gamma_nx_n' : 'x_n'})\\|_\\infty = ${v.fmt(s.outN, 3)}$. `;
          if (!s.D) return head + 'Integration is bounded ($\\|\\Lambda f\\|\\le\\|f\\|$): every null sequence is mapped to a null sequence.';
          return head + (s.r ? 'The inputs still tend to $0$ but the outputs are unbounded: $d/dt$ is neither bounded nor continuous.' : 'Outputs stay at norm $1$: bounded, but not tending to $0$ — (d) already fails.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.33
    {
      num: '1.33',
      kind: 'Definition',
      name: 'Seminorms, absorbing sets, Minkowski functionals',
      statement: String.raw`A **seminorm** on a vector space $X$ is a function $p:X\to\R$ with $p(x+y)\le p(x)+p(y)$ and $p(\alpha x)=\abs\alpha\,p(x)$. A family $\mathscr P$ of seminorms is **separating** if for each $x\ne0$ some $p\in\mathscr P$ has $p(x)\ne0$.
A set $A\subset X$ is **absorbing** if every $x\in X$ lies in $tA$ for some $t=t(x)>0$. For a convex absorbing $A$, its **Minkowski functional** is
$$\mu_A(x)=\inf\{t>0:\ t^{-1}x\in A\}\qquad(x\in X).$$`,
      idea: String.raw`$\mu_A(x)$ measures how far $A$ must be dilated to reach $x$; the absorbing property makes this finite. Every balanced neighbourhood of $0$ in a TVS is absorbing (1.15(a)), so convex balanced neighbourhoods give seminorms (1.35, 1.36), and seminorms give convex balanced neighbourhoods (1.34) — the two descriptions of local convexity.`,
      caption: String.raw`Choose a closed set $A$ and drag $x$. For nonzero $x$ on a ray meeting $A$ beyond $0$, the dashed copy is the smallest dilate $tA$ that reaches $x$: $t=\mu_A(x)$, and every larger dilate contains $x$ too. At $x=0$ the infimum is 0 and every $t>0$ works; $x/\mu_A(x)$ is then undefined and is not plotted. The star illustrates the same radial gauge without convexity. A horizontal segment absorbs only its own line, and a disc tangent to $0$ misses the opposite half-plane. The handle snaps to the origin and, in segment mode, to the horizontal axis. Values are rounded in the readout.`,
      deps: ['fa-1.4'],
      tags: ['seminorms', 'Minkowski functional'],
      viz(v) {
        const SH = {
          pent: { label: 'convex pentagon', poly: [[1.3, 0.1], [0.4, 1.0], [-0.9, 0.7], [-0.8, -0.6], [0.5, -0.9]], abs: true },
          star: { label: 'star (not convex)', poly: Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 0.4 : 1.15, t = k * Math.PI / 5 + 0.3; return [r * Math.cos(t), r * Math.sin(t)]; }), abs: true },
          tang: { label: '$0$ on the boundary', tangentDiskRadius: 0.75, abs: false },
          seg: { label: 'segment', halfLength: 1.2, abs: false },
        };
        const which = v.select('$A$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'pent');
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.9, 1.9], equal: true, height: 360, ticks: false });
        const hx = S.handle(1.7, 1.15, { color: 'accent', label: 'x', constrain: (x, y) => Math.hypot(x, y) < 0.05 ? [0, 0] : which.value === 'seg' && Math.abs(y) < 0.05 ? [x, 0] : [x, y] });
        let st = {};
        v.render(() => {
          const sh = SH[which.value], x = [hx.x, hx.y], r = Math.hypot(...x), u = r > 0 ? [x[0] / r, x[1] / r] : [0, 0];
          const mu = exampleSetGauge(sh, ...x), smax = Number.isFinite(mu) && mu > 0 ? r / mu : 0;
          if (sh.poly) S.poly(sh.poly, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          else if (sh.tangentDiskRadius) S.circle(sh.tangentDiskRadius, 0, sh.tangentDiskRadius, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          else S.line(-sh.halfLength, 0, sh.halfLength, 0, { color: 'blue', width: 4 });
          if (r > 0) S.line(0, 0, u[0] * 8, u[1] * 8, { color: 'faint', width: 1, dash: [3, 4] });
          if (r === 0) S.corner('x = 0: every t > 0 works; μ_A(0) = 0', 'tl', { color: 'green', weight: 600 });
          else if (Number.isFinite(mu)) {
            if (sh.poly) S.poly(sh.poly.map(([a, b]) => [mu * a, mu * b]), { color: 'orange', width: 1.8, dash: [6, 4] });
            else if (sh.tangentDiskRadius) S.circle(mu * sh.tangentDiskRadius, 0, mu * sh.tangentDiskRadius, { color: 'orange', width: 1.8, dash: [6, 4] });
            else S.line(-sh.halfLength * mu, 0, sh.halfLength * mu, 0, { color: 'orange', width: 2, dash: [6, 4] });
            S.dot(smax * u[0], smax * u[1], { color: 'blue', r: 4, label: 'x/μ', labelPos: 'se', labelSize: 13 });
            S.corner('closed A: x ∈ tA for t ≥ μ_A(x)', 'tl', { color: 'green', weight: 600 });
          } else S.corner('no t > 0 with x ∈ tA', 'tl', { color: 'red', weight: 600 });
          S.dot(0, 0, { color: 'ink', r: 3 });
          S.tex('A', sh.poly ? 0.2 : 0.9, sh.poly ? -0.3 : -0.25, { color: 'blue', size: 17 });
          st = { mu, abs: sh.abs };
        });
        v.legend([['blue', '$A$', { area: true }], ['orange', '$\\mu_A(x)\\,A$', { dash: true }]]);
        v.readout(() => `$\\mu_A(x) = ${isFinite(st.mu) ? v.fix(st.mu, 3) : '\\infty'}$. ` + (st.abs ? '$A$ is absorbing: every ray from $0$ starts out inside $A$.' : '$A$ is **not** absorbing — some rays meet $A$ only at $0$ (or not at all), and there $\\mu_A=\\infty$.'));
      },
    },
    // ------------------------------------------------------------------ 1.34
    {
      num: '1.34',
      kind: 'Theorem',
      name: 'Elementary properties of seminorms',
      statement: String.raw`Let $p$ be a seminorm on a vector space $X$. Then
(a) $p(0)=0$;
(b) $\abs{p(x)-p(y)}\le p(x-y)$;
(c) $p(x)\ge0$;
(d) $\{x:p(x)=0\}$ is a subspace of $X$;
(e) the set $B=\{x:p(x)<1\}$ is convex, balanced and absorbing, and $p=\mu_B$.`,
      idea: String.raw`(a) take $\alpha=0$. (b) is the triangle inequality applied to $x=(x-y)+y$ and symmetrically. (c) follows from (b) with $y=0$. (d) the zero set is closed under sums and scalar multiples by subadditivity and homogeneity. (e) convexity and balance come from the two axioms; $x\in tB$ iff $p(x)<t$, which gives absorption and $\mu_B=p$.`,
      caption: String.raw`A seminorm on $\R^2$: $p(x)=\sqrt{\ip{x}{u}^2+\lambda\ip{x}{u^\perp}^2}$. Rotate it and lower $\lambda$ to $0$: the unit ball $B=\{p<1\}$ (shaded) stretches from an ellipse to an unbounded strip, and the zero set $\{p=0\}$ (black) grows from $\{0\}$ to a line — a subspace, as (d) says. Drag $x$ and $y$ to test (b); the readout recomputes $\mu_B$ from $B$ by bisection and finds it equal to $p$.`,
      deps: ['fa-1.33'],
      tags: ['seminorms'],
      viz(v) {
        const th = v.slider('direction $u$', 0, 3.14, 0.5, { step: 0.01, fmt: (x) => `${Math.round(x * 180 / Math.PI)}°` });
        const lam = v.slider('$\\lambda$', 0, 1, 0.12, { step: 0.01 });
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 360, ticks: false });
        const hx = S.handle(1.2, 0.95, { color: 'accent', label: 'x' });
        const hy = S.handle(-0.5, 0.75, { color: 'purple', label: 'y' });
        let st = {};
        v.render(() => {
          const a = th.value, u = [Math.cos(a), Math.sin(a)], w = [-u[1], u[0]], l = lam.value;
          const p = (x, y) => Math.sqrt((x * u[0] + y * u[1]) ** 2 + l * (x * w[0] + y * w[1]) ** 2);
          const bnd = (c) => { const pts = []; for (let i = 0; i < 240; i++) { const t = TAU * i / 240; const sx = c * Math.cos(t), sy = (l > 1e-6 ? c / Math.sqrt(l) : 50) * Math.sin(t); pts.push([sx * u[0] + sy * w[0], sx * u[1] + sy * w[1]]); } return pts; };
          for (const c of [2, 1.5, 0.5]) S.poly(bnd(c), { color: 'accent', width: 0.9, alpha: 0.45 });
          S.poly(bnd(1), { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2 });
          if (l < 1e-6) S.line(-w[0] * 9, -w[1] * 9, w[0] * 9, w[1] * 9, { color: 'ink', width: 2.6 });
          else S.dot(0, 0, { color: 'ink', r: 4 });
          S.tex(l < 1e-6 ? '\\{p=0\\}' : '\\{p=0\\}=\\{0\\}', l < 1e-6 ? w[0] * 1.6 : 0, l < 1e-6 ? w[1] * 1.6 : 0, { color: 'ink', dx: 14, dy: l < 1e-6 ? 0 : 16, align: 'left', size: 14 });
          S.arrow(hy.x, hy.y, hx.x, hx.y, { color: 'gold', width: 1.8, head: 8 });
          S.tex('x-y', (hx.x + hy.x) / 2, (hx.y + hy.y) / 2, { color: 'gold', dy: -12, size: 13 });
          const px = p(hx.x, hx.y), py = p(hy.x, hy.y), pd = p(hx.x - hy.x, hx.y - hy.y);
          // μ_B(x) by bisection on t: x/t ∈ B
          let lo = 0, hi = 50; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (p(hx.x / m, hx.y / m) < 1) hi = m; else lo = m; }
          st = { px, py, pd, mu: hi, deg: l < 1e-6 };
        });
        v.legend([['accent', '$B=\\{p<1\\}$ and level sets $p=\\tfrac12,\\tfrac32,2$', { area: true }], ['ink', 'zero set $\\{p=0\\}$']]);
        v.readout(() => {
          const s = st; if (s.px == null) return '';
          return `(b) $|p(x)-p(y)| = ${v.fix(Math.abs(s.px - s.py), 3)} \\le p(x-y) = ${v.fix(s.pd, 3)}$. (e) $p(x) = ${v.fix(s.px, 4)}$, $\\mu_B(x) = ${v.fix(s.mu, 4)}$.` + (s.deg ? ' Now $p$ vanishes on a line: a seminorm that is not a norm.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.35
    {
      num: '1.35',
      kind: 'Theorem',
      name: 'The Minkowski functional of a convex absorbing set',
      statement: String.raw`Let $A$ be a convex absorbing set in a vector space $X$. Then
(a) $\mu_A(x+y)\le\mu_A(x)+\mu_A(y)$;
(b) $\mu_A(tx)=t\,\mu_A(x)$ for $t\ge0$;
(c) $\mu_A$ is a seminorm if $A$ is also balanced;
(d) if $B=\{x:\mu_A(x)<1\}$ and $C=\{x:\mu_A(x)\le1\}$, then $B\subset A\subset C$ and $\mu_B=\mu_A=\mu_C$.`,
      idea: String.raw`For (a), if $x\in sA$ and $y\in tA$, convexity gives $x+y\in(s+t)A$, because $\frac{x+y}{s+t}=\frac{s}{s+t}\frac xs+\frac t{s+t}\frac yt$. Homogeneity (b) is immediate from the definition; balance adds $\mu_A(\alpha x)=\abs\alpha\mu_A(x)$. For (d), convexity and $0\in A$ show that $x\in A$ whenever $\mu_A(x)<1$, and the three sets have the same dilates up to boundary points.`,
      caption: String.raw`Drag the vertices of $A$ (blue) and the points $x,y$. The level curves $\mu_A=\tfrac12,1,\tfrac32,2$ are dilates of $\partial A$, and the shading darkens as $\mu_A$ grows. While $A$ is convex, $\mu_A(x+y)\le\mu_A(x)+\mu_A(y)$ wherever you put $x$ and $y$. Untick convexity (the polygon is then star-shaped but not convex): the red witnesses $x',y'$ — two boundary points whose sum lies beyond the level curve $2$ — break subadditivity. With an asymmetric $A$, $\mu_A(-x)\ne\mu_A(x)$: a sublinear functional, not a seminorm.`,
      deps: ['fa-1.33'],
      tags: ['Minkowski functional', 'convexity'],
      viz(v) {
        const conv = v.toggle('use the convex hull of the vertices', true);
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 380, ticks: false });
        const init = [[1.25, 0.15], [0.35, 1.05], [-0.95, 0.6], [-1.05, -0.45], [-0.1, -0.3], [0.95, -0.85]];
        const H = init.map(([x, y]) => S.handle(x, y, { color: 'blue', r: 6 }));
        const hx = S.handle(1.35, 0.95, { color: 'accent', label: 'x' });
        const hy = S.handle(1.45, -0.7, { color: 'purple', label: 'y' });
        let st = {};
        v.render(() => {
          const V = H.map((h) => [h.x, h.y]);
          const A = conv.value ? hull(V) : byAngle(V);
          if (!inPoly(0, 0, A)) { S.poly(A, { color: 'red', width: 2 }); S.corner('keep 0 inside A (A must be absorbing)', 'tl', { color: 'red', weight: 600 }); st = {}; return; }
          const mu = (x, y) => gauge(A, x, y);
          const ac = v.rgb('accent'), bg = v.rgb('panel');
          S.raster((x, y) => { const m = mu(x, y); const a = Math.min(0.3, 0.1 * m); return [ac[0] * a + bg[0] * (1 - a), ac[1] * a + bg[1] * (1 - a), ac[2] * a + bg[2] * (1 - a), 255]; }, { res: 3, key: `${A.flat().join()}|${ac}|${bg}` });
          for (const c of [0.5, 1.5, 2]) S.poly(A.map(([a, b]) => [c * a, c * b]), { color: 'accent', width: 1, alpha: 0.6, dash: c === 2 ? [5, 4] : null });
          S.poly(A, { color: 'blue', width: 2.2 });
          S.text('μ = 2', 2 * A[0][0], 2 * A[0][1], { color: 'accent', size: 11.5, dx: 8 });
          const sx = hx.x + hy.x, sy = hx.y + hy.y;
          S.line(hx.x, hx.y, sx, sy, { color: 'faint', dash: [3, 4], width: 1.1 });
          S.line(hy.x, hy.y, sx, sy, { color: 'faint', dash: [3, 4], width: 1.1 });
          const mx = mu(hx.x, hx.y), my = mu(hy.x, hy.y), ms = mu(sx, sy);
          S.dot(sx, sy, { color: ms <= mx + my + 1e-9 ? 'green' : 'red', r: 5, label: 'x+y', labelPos: 'ne' });
          // search for a violation of subadditivity among boundary points
          let worst = 0, wit = null;
          if (!conv.value) {
            const bd = []; for (let i = 0; i < A.length; i++) { const a = A[i], b = A[(i + 1) % A.length]; for (let k = 0; k < 12; k++) bd.push([a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12]); }
            for (const p of bd) for (const q of bd) { const g = mu(p[0] + q[0], p[1] + q[1]) - 2; if (g > worst) { worst = g; wit = [p, q]; } }
            if (wit && worst > 1e-6) {
              const [p, q] = wit;
              S.line(p[0], p[1], p[0] + q[0], p[1] + q[1], { color: 'red', width: 1.2, dash: [3, 3] });
              S.line(q[0], q[1], p[0] + q[0], p[1] + q[1], { color: 'red', width: 1.2, dash: [3, 3] });
              S.dot(p[0], p[1], { color: 'red', r: 4, label: "x'", labelPos: 'nw' }); S.dot(q[0], q[1], { color: 'red', r: 4, label: "y'", labelPos: 'sw' });
              S.dot(p[0] + q[0], p[1] + q[1], { color: 'red', r: 5, hollow: true, width: 2.4 });
            }
          }
          S.dot(0, 0, { color: 'ink', r: 3 });
          st = { mx, my, ms, mneg: mu(-hx.x, -hx.y), worst, conv: conv.value };
        });
        v.legend([['blue', '$\\partial A$ ($\\mu_A=1$)'], ['accent', 'level sets $\\mu_A=\\tfrac12,\\tfrac32,2$'], ['red', 'subadditivity fails', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.mx == null) return 'Drag the vertices so that $0$ is inside $A$.';
          const ok = s.ms <= s.mx + s.my + 1e-9;
          let out = `$\\mu_A(x)=${v.fix(s.mx, 3)}$, $\\mu_A(y)=${v.fix(s.my, 3)}$, $\\mu_A(x+y)=${v.fix(s.ms, 3)} ${ok ? '\\le' : '>'} ${v.fix(s.mx + s.my, 3)}$; $\\;\\mu_A(-x)=${v.fix(s.mneg, 3)}$.`;
          if (!s.conv && s.worst > 1e-6) out += ` Non-convex $A$: $\\mu_A(x'+y') = ${v.fix(2 + s.worst, 3)} > 2 = \\mu_A(x')+\\mu_A(y')$.`;
          return out;
        });
      },
    },
    // ------------------------------------------------------------------ 1.36
    {
      num: '1.36',
      kind: 'Theorem',
      name: 'Convex balanced local bases give continuous seminorms',
      statement: String.raw`Let $\mathscr B$ be a convex balanced local base in a topological vector space $X$, and let $\mu_V$ be the Minkowski functional of $V\in\mathscr B$. Then
(a) $V=\{x\in X:\mu_V(x)<1\}$ for every $V\in\mathscr B$, and
(b) $\{\mu_V:V\in\mathscr B\}$ is a separating family of continuous seminorms on $X$.`,
      idea: String.raw`Each $V$ is open, convex, balanced and (1.15(a)) absorbing, so $\mu_V$ is a seminorm (1.35). If $x\in V$, openness gives $(1+r)x\in V$ for small $r>0$, so $\mu_V(x)<1$; with 1.35(d) this proves (a). Continuity: $\abs{\mu_V(x)-\mu_V(y)}\le\mu_V(x-y)<\eps$ when $x-y\in\eps V$. Separation: if $x\ne0$, some $V$ misses $x$ (Hausdorff), and then $\mu_V(x)\ge1$.`,
      caption: String.raw`Left: a convex balanced neighbourhood $V$ (drag a vertex; its mirror image follows) and the neighbourhood $x+\eps V$ of a point $x$, on which $\mu_V$ varies by less than $\eps$ — continuity. Right: the graph of $\mu_V$ is a convex cone whose slice at height $1$ is $\partial V$. Choose the unbounded strip: $\mu_V$ vanishes on a whole line, so this single seminorm does not separate points; a second strip in another direction would.`,
      deps: ['fa-1.35', 'fa-1.34', 'fa-1.14a', 'fa-1.15'],
      tags: ['seminorms', 'local convexity'],
      viz(v) {
        const kind = v.select('$V$', [{ value: 'hex', label: 'hexagon' }, { value: 'strip', label: 'strip (unbounded)' }], 'hex');
        const eps = v.slider('$\\varepsilon$', 0.05, 0.6, 0.25, { step: 0.01 });
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, title: '$V$, and $x+\\varepsilon V$' });
        const D = v.stage3d({ range: 2.1, height: 340, yaw: -0.6, pitch: 0.55, labels: ['', '', 'μ'], title: 'graph of $\\mu_V$ (cone over $\\partial V$)' });
        const h1 = L.handle(1.1, 0.25, { color: 'blue', r: 6 });
        const h2 = L.handle(0.45, 0.85, { color: 'blue', r: 6 });
        const h3 = L.handle(-0.6, 0.7, { color: 'blue', r: 6 });
        const hx = L.handle(0.9, -0.95, { color: 'accent', label: 'x' });
        const W = 0.55;
        let st = {};
        v.render(() => {
          const strip = kind.value === 'strip';
          h1.visible = h2.visible = h3.visible = !strip;
          let mu, Vpoly;
          if (strip) { mu = (x, y) => Math.abs(y) / W; Vpoly = [[-9, -W], [9, -W], [9, W], [-9, W]]; }
          else {
            const P = [[h1.x, h1.y], [h2.x, h2.y], [h3.x, h3.y]]; Vpoly = hull(P.concat(P.map(([a, b]) => [-a, -b])));
            if (!inPoly(0, 0, Vpoly)) Vpoly = circlePoly(0, 0, 0.5, 60);
            mu = (x, y) => gauge(Vpoly, x, y);
          }
          L.poly(Vpoly, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 2 });
          L.tex('V', 0, 0, { color: 'blue', dx: 12, dy: 12 });
          const e = eps.value, xs = Vpoly.map(([a, b]) => [hx.x + e * a, hx.y + e * b]);
          L.poly(xs, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.8 });
          if (strip) L.line(-9, 0, 9, 0, { color: 'red', width: 2.2 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          let dev = 0; const m0 = mu(hx.x, hx.y);
          for (let i = 0; i < 60; i++) for (let j = 1; j <= 4; j++) { const t = TAU * i / 60; const q = strip ? [Math.cos(t) * 9 * j / 4, Math.sin(t) * W * j / 4] : null; let p; if (strip) p = q; else { const r = rayExit(Vpoly, Math.cos(t), Math.sin(t)) * j / 4 * 0.999; p = [r * Math.cos(t), r * Math.sin(t)]; } dev = Math.max(dev, Math.abs(mu(hx.x + e * p[0], hx.y + e * p[1]) - m0)); }
          // 3D cone
          const rho = (t) => strip ? (Math.abs(Math.sin(t)) > 1e-6 ? W / Math.abs(Math.sin(t)) : 1e9) : rayExit(Vpoly, Math.cos(t), Math.sin(t));
          D.surface((s, t) => { const r = s * Math.min(2.0, 1.6 * rho(t)); return [r * Math.cos(t), r * Math.sin(t), r / rho(t)]; }, [0, 1], [0, TAU], { nu: 8, nv: 72, color: 'accent', alpha: 0.5 });
          const ring = []; for (let i = 0; i <= 120; i++) { const t = TAU * i / 120, r = Math.min(2.0, rho(t)); ring.push([r * Math.cos(t), r * Math.sin(t), r / rho(t)]); }
          D.path(ring, { color: 'orange', width: 3, bias: -0.5 });
          D.path(ring.map(([a, b]) => [a, b, 0]), { color: 'blue', width: 1.2, alpha: 0.6 });
          if (strip) D.line([-1.9, 0, 0], [1.9, 0, 0], { color: 'red', width: 3, bias: -0.3 });
          st = { dev, e, m0, strip };
        });
        v.legend([['blue', '$V=\\{\\mu_V<1\\}$', { area: true }], ['orange', '$x+\\varepsilon V$', { area: true }], ['red', 'zero set of $\\mu_V$ (strip only)']]);
        v.readout(() => `$\\mu_V(x) = ${v.fix(st.m0, 3)}$; on $x+\\varepsilon V$: $\\max|\\mu_V-\\mu_V(x)| = ${v.fix(st.dev, 3)} \\le \\varepsilon = ${v.fix(st.e, 2)}$.` + (st.strip ? ' This $\\mu_V$ vanishes on the horizontal axis — alone it does not separate points.' : ' Since $V$ is bounded, $\\mu_V(x)>0$ for every $x\\ne0$.'));
      },
    },
  ],
};
