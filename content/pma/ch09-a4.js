// Rudin, Principles of Mathematical Analysis — Chapter 9, part 4:
// continuously differentiable maps and the contraction principle (9.20–9.23).

const TAU = 2 * Math.PI;
function fitEqual(S, cx, cy, hw) { const a = S.height / S.width; if (a > 1) S.setView([cx - hw, cx + hw], [cy - hw * a, cy + hw * a]); else S.setView([cx - hw / a, cx + hw / a], [cy - hw, cy + hw]); }
/** Largest singular value of a 2×2 matrix. */
function sig1(A) {
  const a = A[0][0] ** 2 + A[1][0] ** 2, b = A[0][0] * A[0][1] + A[1][0] * A[1][1], d = A[0][1] ** 2 + A[1][1] ** 2;
  return Math.sqrt((a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + b * b));
}
/** Two self-maps of the square X = [-1,1]^2 with their Jacobians: a contraction and a map that stretches near 0. */
const MAPS = {
  con: {
    phi: ([x, y]) => [0.5 * Math.sin(x + 0.5 * y) + 0.2, 0.45 * Math.cos(x) - 0.3 * y],
    J: ([x, y]) => { const c = Math.cos(x + 0.5 * y); return [[0.5 * c, 0.25 * c], [-0.45 * Math.sin(x), -0.3]]; },
  },
  str: {
    phi: ([x, y]) => [0.95 * Math.sin(1.4 * x), 0.5 * y + 0.3 * x * x],
    J: ([x]) => [[1.33 * Math.cos(1.4 * x), 0], [0.6 * x, 0.5]],
  },
};
/** sup over X of ‖φ'(x)‖ (grid search). By 9.19 this bounds every ratio d(φx,φy)/d(x,y) on the convex set X. */
// For the contraction, a 1% margin over the fine-grid maximum makes c a guaranteed upper bound; the stretching map attains its sup 1.33 at the grid point x = 0.
for (const [k, m] of Object.entries(MAPS)) { let c = 0; for (let i = 0; i <= 200; i++) for (let j = 0; j <= 200; j++) c = Math.max(c, sig1(m.J([-1 + i / 100, -1 + j / 100]))); m.c = k === 'con' ? c * 1.01 : c; }
/** Boundary of the square, for drawing its image. */
const SQ = (() => { const p = []; const n = 60; for (let i = 0; i < n; i++) p.push([-1 + 2 * i / n, -1]); for (let i = 0; i < n; i++) p.push([1, -1 + 2 * i / n]); for (let i = 0; i < n; i++) p.push([1 - 2 * i / n, 1]); for (let i = 0; i < n; i++) p.push([-1, 1 - 2 * i / n]); return p; })();

export default {
  collection: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.20
    {
      num: '9.20',
      kind: 'Definition',
      name: "Continuously differentiable maps; the class C′(E)",
      statement: String.raw`A differentiable map $f$ of an open set $E\subset\R^n$ into $\R^m$ is *continuously differentiable* in $E$ if $f'$ is a continuous map of $E$ into the metric space $L(\R^n,\R^m)$ of 9.7: for every $x\in E$ and $\eps>0$ there is $\delta>0$ such that
$$\|f'(y)-f'(x)\|<\eps\qquad\text{whenever } y\in E,\ |y-x|<\delta.$$
One then calls $f$ a $\mathscr C'$-*mapping* and writes $f\in\mathscr C'(E)$.`,
      idea: String.raw`Differentiability at every point is weaker than this: the derivative may exist everywhere and still oscillate wildly. The standard example is $\varphi(|x|)$ with $\varphi(r)=r^2\sin(1/r)$: it is differentiable at $0$ with $f'(0)=0$ since $|f(h)|\le|h|^2$, but near $0$ the gradient contains the term $-\cos(1/|x|)$, which has no limit. With $r^3\sin(1/r)$ the extra factor of $r$ kills the oscillation and $f\in\mathscr C'$. The class $\mathscr C'$ is what the inverse and implicit function theorems require.`,
      caption: String.raw`Two radial functions $f(x)=\varphi(|x|)$, both differentiable everywhere with $f'(0)=0$. The heat map shows $\|f'(y)\|=|\nabla f(y)|$ near $0$, and the right panel graphs $D_1f(t,0)$. Zoom in with the slider and drag $y$ toward $0$: for $r^3\sin(1/r)$ the derivative fades to $f'(0)=0$; for $r^2\sin(1/r)$ it keeps oscillating between about $\pm1$ at every scale, so $f'$ is not continuous at $0$ and $f\notin\mathscr C'$.`,
      deps: ['pma-9.11', 'pma-9.7', 'pma-4.5'],
      tags: ['continuously differentiable', 'derivative'],
      viz(v) {
        const PH = {
          c1: { label: '$r^3\\sin(1/r)$: in $\\mathscr C\'$', dphi: (r) => 3 * r * r * Math.sin(1 / r) - r * Math.cos(1 / r) },
          d: { label: '$r^2\\sin(1/r)$: not in $\\mathscr C\'$', dphi: (r) => 2 * r * Math.sin(1 / r) - Math.cos(1 / r) },
        };
        const which = v.select('', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'd');
        const zoom = v.slider('window half-width $w$', 0.01, 0.5, 0.25, { log: true, decimals: 3 });
        const H = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 300, title: '$\\|f\'(y)\\|$ near $0$' });
        const G = v.stage({ x: [-1, 1], y: [-1.2, 1.2], height: 300, axes: true, title: '$D_1f(t,0)$ for $|t|\\le w$' });
        let yf = [0.55, 0.35];
        const hy = H.handle(0.55 * 0.25, 0.35 * 0.25, { color: 'gold', label: 'y', onDrag: (h) => { const w = zoom.value; yf = [h.x / w, h.y / w]; } });
        v.legend([['green', "$f'(0)=0$", { dot: true }], ['gold', 'the point $y$', { dot: true }], ['accent', '$D_1f(t,0)$']]);
        const grad = (D, x, y) => { const r = Math.hypot(x, y); if (r === 0) return [0, 0]; const d = D.dphi(r); return [d * x / r, d * y / r]; };
        let st = {};
        v.render(() => {
          const D = PH[which.value], w = zoom.value;
          H.setView([-w, w], [-w, w]);
          hy.x = yf[0] * w; hy.y = yf[1] * w;
          H.heat((x, y) => Math.hypot(...grad(D, x, y)), { range: [0, 1.05], cmap: 'viridis', res: 2, key: `${which.value}|${w}` });
          H.axes();
          H.dot(0, 0, { color: 'green', r: 5 });
          const yy = [hy.x, hy.y], gy = grad(D, ...yy);
          H.line(0, 0, yy[0], yy[1], { color: 'gold', width: 1.4, dash: [3, 3] });
          // graph of D1 f along the axis
          G.setView([-w, w], [-1.25, 1.25]);
          G.fn((t) => (t === 0 ? NaN : D.dphi(Math.abs(t)) * Math.sign(t)), { domain: [-w, w], n: 3000, color: 'accent', width: 1.6, connect: true });
          G.dot(0, 0, { color: 'green', r: 5.5 });
          G.vline(Math.hypot(...yy) * Math.sign(yy[0] || 1), { color: 'gold', width: 1, dash: [3, 3] });
          st = { ny: Math.hypot(...yy), nd: Math.hypot(...gy), key: which.value, w };
        });
        v.readout(() => {
          const s = st; if (s.ny == null) return '';
          return `$|y| = ${v.fmt(s.ny, 3)}$, $\\;\\|f'(y)-f'(0)\\| = |\\nabla f(y)| = ${v.fmt(s.nd, 3)}$. ` + (s.key === 'd' ? 'However small $|y|$ is, points with $\\|f\'(y)\\|\\approx1$ remain nearby: $f\'$ is discontinuous at $0$.' : 'It is at most $3|y|^2+|y|$, which tends to $0$: $f\'$ is continuous at $0$.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.21
    {
      num: '9.21',
      kind: 'Theorem',
      name: "C′ ⇔ the partial derivatives exist and are continuous",
      statement: String.raw`Let $f$ map an open set $E\subset\R^n$ into $\R^m$. Then $f\in\mathscr C'(E)$ if and only if every partial derivative $D_jf_i$ ($1\le i\le m$, $1\le j\le n$) exists and is continuous on $E$.`,
      idea: String.raw`If $f\in\mathscr C'$, then $D_jf_i(x)=\langle f'(x)e_j,u_i\rangle$ by 9.17, so $|D_jf_i(y)-D_jf_i(x)|\le\|f'(y)-f'(x)\|$. Conversely it suffices to treat $m=1$. Walk from $x$ to $x+h$ along the coordinate directions; on the $j$-th leg the one-variable mean value theorem (5.10) gives $f$'s increment as $h_jD_jf(\xi_j)$ for some $\xi_j$ on that leg. Continuity of the partials makes each $D_jf(\xi_j)$ close to $D_jf(x)$, so $f(x+h)-f(x)-\sum_jh_jD_jf(x)=o(|h|)$; thus $f'(x)$ exists, its matrix is $(D_jf_i(x))$, and the bound $\|A\|\le(\sum a_{ij}^2)^{1/2}$ of 9.9 turns continuity of the entries into continuity of $f'$.`,
      caption: String.raw`Drag $x$ and $x+h$. The path goes first along $e_1$ (blue) then along $e_2$ (orange); the purple points $\xi_1,\xi_2$ are where the one-variable mean value theorem applies, so that $f(x+h)-f(x)=h_1D_1f(\xi_1)+h_2D_2f(\xi_2)$ exactly. The right panel shows the relative error $|f(x+sh/|h|)-f(x)-s\nabla f(x)\cdot h/|h||/s$ as $s\to0$. With continuous partials it tends to $0$. For $x^2y/(x^2+y^2)$ at $x=0$ the partials exist but jump, $D_2f(\xi_2)$ never approaches $D_2f(0)=0$, and the error stays put: no derivative.`,
      deps: ['pma-9.20', 'pma-9.17', 'pma-9.9', 'pma-5.10'],
      see: ['pma-9.16'],
      tags: ['continuously differentiable', 'partial derivatives', 'mean value theorem'],
      viz(v) {
        const FN = {
          smooth: { label: 'continuous partials', f: (x, y) => Math.sin(1.3 * x) * Math.cos(0.9 * y) + 0.35 * x * y, x: [-0.6, -0.35], q: [0.75, 0.6], range: 1.3 },
          bad: { label: '$x^2y/(x^2+y^2)$ at $0$', f: (x, y) => (x === 0 && y === 0 ? 0 : (x * x * y) / (x * x + y * y)), x: [0, 0], q: [0.85, 0.7], range: 1 },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 330, title: '$f$ and the coordinate path from $x$ to $x+h$' });
        const R = v.stage({ x: [-3, 0.2], y: [0, 0.5], height: 330, axes: 'box', xticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [0, '1']], xlabel: 's', title: 'relative error along the direction of $h$, against $s$ (log scale)' });
        const hx = L.handle(-0.6, -0.35, { color: 'accent', label: 'x', labelPos: 'sw', constrain: (x, y) => (which.value === 'bad' && Math.hypot(x, y) < 0.08 ? [0, 0] : [x, y]) });
        const hq = L.handle(0.75, 0.6, { color: 'gold', label: 'x+h' });
        const pd = (f, x, y, j, e = 1e-6) => (j === 0 ? (f(x + e, y) - f(x - e, y)) / (2 * e) : (f(x, y + e) - f(x, y - e)) / (2 * e));
        // first sign change of q on (0,1), refined by bisection
        const root = (q) => { let p = q(1e-4); if (Math.abs(p) < 1e-12) return 1e-4; for (let i = 1; i <= 300; i++) { const t = i / 300 * 0.9998 + 1e-4, c = q(t); if (p * c <= 0) { let lo = (i - 1) / 300 * 0.9998 + 1e-4, hi = t; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (q(lo) * q(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; } p = c; } return 0.5; };
        let last = null, st = {};
        v.render(() => {
          const F = FN[which.value], f = F.f;
          if (last !== which.value) { last = which.value; hx.set(...F.x); hq.set(...F.q); }
          const x = [hx.x, hx.y], q = [hq.x, hq.y], h = [q[0] - x[0], q[1] - x[1]], c = [q[0], x[1]];
          const K = F.range;
          L.raster((a, b) => { const col = v.M.cmap(0.5 + 0.5 * f(a, b) / K, 'diverging'); return [col[0], col[1], col[2], 170]; }, { key: which.value, res: 2 });
          // mean value points on the two legs
          const d1 = f(c[0], c[1]) - f(x[0], x[1]), d2 = f(q[0], q[1]) - f(c[0], c[1]);
          const t1 = Math.abs(h[0]) < 1e-9 ? 0.5 : root((t) => pd(f, x[0] + t * h[0], x[1], 0) * h[0] - d1);
          const t2 = Math.abs(h[1]) < 1e-9 ? 0.5 : root((t) => pd(f, c[0], c[1] + t * h[1], 1) * h[1] - d2);
          const xi1 = [x[0] + t1 * h[0], x[1]], xi2 = [c[0], c[1] + t2 * h[1]];
          L.arrow(x[0], x[1], c[0], c[1], { color: 'blue', width: 3, head: 10 });
          L.arrow(c[0], c[1], q[0], q[1], { color: 'orange', width: 3, head: 10 });
          L.line(x[0], x[1], q[0], q[1], { color: 'ink', width: 1.2, dash: [4, 4] });
          L.dot(xi1[0], xi1[1], { color: 'purple', r: 5, label: 'ξ₁', labelPos: 'se' });
          L.dot(xi2[0], xi2[1], { color: 'purple', r: 5, label: 'ξ₂', labelPos: 'e' });
          // error profile along the direction of h
          const nh = Math.hypot(...h) || 1e-9, u = [h[0] / nh, h[1] / nh];
          const g0 = [pd(f, x[0], x[1], 0), pd(f, x[0], x[1], 1)], fx = f(x[0], x[1]);
          const ratio = (s) => Math.abs(f(x[0] + s * u[0], x[1] + s * u[1]) - fx - s * (g0[0] * u[0] + g0[1] * u[1])) / s;
          const ls = v.M.linspace(-3, 0.2, 120), rs = ls.map((l) => ratio(10 ** l));
          R.setView([-3, 0.2], [0, Math.max(0.05, Math.max(...rs) * 1.2)]);
          R.path(ls.map((l, i) => [l, rs[i]]), { color: 'purple', width: 2.4 });
          const lh = Math.log10(nh);
          if (lh >= -3 && lh <= 0.2) { R.vline(lh, { color: 'gold', width: 1, dash: [3, 3] }); R.dot(lh, ratio(nh), { color: 'gold', r: 5 }); }
          const a1 = pd(f, ...xi1, 0), a2 = pd(f, ...xi2, 1);
          v.legend([['blue', 'leg along $e_1$'], ['orange', 'leg along $e_2$'], ['purple', 'mean value points $\\xi_j$; relative error']]);
          st = { g0, a1, a2, h, d: d1 + d2, lin: h[0] * g0[0] + h[1] * g0[1], small: rs[0] };
        });
        v.readout(() => {
          const s = st; if (!s.g0) return '';
          return `$D_1f(\\xi_1) = ${v.fix(s.a1, 3)}$ vs $D_1f(x) = ${v.fix(s.g0[0], 3)}$; $\\;D_2f(\\xi_2) = ${v.fix(s.a2, 3)}$ vs $D_2f(x) = ${v.fix(s.g0[1], 3)}$. $\\;f(x+h)-f(x) = ${v.fix(s.d, 4)} = h_1D_1f(\\xi_1)+h_2D_2f(\\xi_2)$, while $h_1D_1f(x)+h_2D_2f(x) = ${v.fix(s.lin, 4)}$. Relative error at $s=0.001$: $${v.fmt(s.small, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.22
    {
      num: '9.22',
      kind: 'Definition',
      name: 'Contraction of a metric space',
      statement: String.raw`Let $X$ be a metric space with metric $d$. A map $\varphi$ of $X$ into $X$ is a *contraction* of $X$ into $X$ if there is a number $c<1$ such that
$$d(\varphi(x),\varphi(y))\le c\,d(x,y)\qquad\text{for all }x,y\in X.$$`,
      idea: String.raw`A contraction shrinks *every* distance by at least the fixed factor $c$; in particular it is uniformly continuous. On a convex subset of $\R^n$ the mean value inequality 9.19 gives a practical test: if $\|\varphi'(x)\|\le c<1$ throughout, then $\varphi$ is a contraction with constant $c$. A single point where $\|\varphi'\|>1$ spoils it, because nearby pairs are then stretched.`,
      caption: String.raw`$X=[-1,1]^2$. The left panel colours each point by the local stretch $\|\varphi'(x)\|$ (the red curve marks $\|\varphi'\|=1$); the right panel shows $\varphi(X)$ inside $X$. Drag $x$ and $y$ and compare $d(\varphi x,\varphi y)$ with $d(x,y)$. For the first map $\sup\|\varphi'\|=c<1$, so every ratio is at most $c$. The second map also sends $X$ into $X$, but near the centre it stretches by up to $1.33$: put $x,y$ close together there and the ratio exceeds $1$.`,
      deps: ['pma-2.15'],
      see: ['pma-9.19', 'pma-9.23'],
      tags: ['contraction', 'metric spaces'],
      viz(v) {
        const which = v.select('', [{ value: 'con', label: 'a contraction' }, { value: 'str', label: 'not a contraction' }], 'con');
        const L = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, title: 'local stretch $\\|\\varphi\'(x)\\|$ on $X$' });
        const R = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, title: '$\\varphi(X)\\subset X$' });
        const cl = { x: [-1, 1], y: [-1, 1] };
        const hx = L.handle(-0.55, -0.35, { color: 'blue', label: 'x', labelPos: 'sw', constrain: cl });
        const hy = L.handle(0.45, 0.5, { color: 'orange', label: 'y', constrain: cl });
        let st = {}, last = null;
        v.render(() => {
          const Mp = MAPS[which.value], phi = Mp.phi;
          if (last !== which.value) { last = which.value; if (which.value === 'str') { hx.set(-0.2, -0.12); hy.set(0.18, 0.1); } else { hx.set(-0.55, -0.35); hy.set(0.45, 0.5); } }
          L.raster((a, b) => { if (Math.abs(a) > 1 || Math.abs(b) > 1) return null; const s = sig1(Mp.J([a, b])); if (Math.abs(s - 1) < 0.012) return v.rgb('red').slice(0, 3); return v.M.cmap(s / 1.5, 'viridis').concat(150); }, { key: which.value, res: 2 });
          L.rect(-1, -1, 1, 1, { color: 'ink', width: 1.4 });
          L.corner(Mp.c < 1 ? `‖φ′‖ ≤ c = ${v.fix(Mp.c, 3)}` : `sup ‖φ′‖ = ${v.fix(Mp.c, 3)}`, 'tl', { color: Mp.c < 1 ? 'green' : 'red', weight: 600 });
          const x = [hx.x, hx.y], y = [hy.x, hy.y];
          L.line(x[0], x[1], y[0], y[1], { color: 'panel', width: 2.4 });
          // image of X
          R.rect(-1, -1, 1, 1, { color: 'ink', width: 1.4, fill: 'gray', fillAlpha: 0.06 });
          for (let k = -4; k <= 4; k++) {
            R.curve((s) => phi([k / 4, s]), -1, 1, { color: 'accent', width: 0.8, alpha: 0.35, n: 40 });
            R.curve((s) => phi([s, k / 4]), -1, 1, { color: 'accent', width: 0.8, alpha: 0.35, n: 40 });
          }
          R.poly(SQ.map(phi), { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.8 });
          const px = phi(x), py = phi(y);
          R.line(x[0], x[1], y[0], y[1], { color: 'muted', width: 1.2, dash: [4, 4] });
          R.dot(x[0], x[1], { color: 'blue', r: 3, alpha: 0.5 }); R.dot(y[0], y[1], { color: 'orange', r: 3, alpha: 0.5 });
          R.line(px[0], px[1], py[0], py[1], { color: 'ink', width: 2 });
          R.dot(px[0], px[1], { color: 'blue', r: 5.5, label: 'φ(x)', labelPos: 'sw' });
          R.dot(py[0], py[1], { color: 'orange', r: 5.5, label: 'φ(y)', labelPos: 'ne' });
          const dxy = Math.hypot(x[0] - y[0], x[1] - y[1]), dp = Math.hypot(px[0] - py[0], px[1] - py[1]);
          const ratio = dxy > 1e-9 ? dp / dxy : 0;
          R.corner(`ratio ${v.fix(ratio, 3)}`, 'tl', { color: ratio < 1 ? 'green' : 'red', weight: 600 });
          v.legend([['green', 'stretch $\\|\\varphi\'\\|$ (viridis: dark small, yellow large)', { area: true }], ['red', '$\\|\\varphi\'(x)\\|=1$'], ['accent', '$\\varphi(X)$ and the image grid', { area: true }]]);
          st = { ratio, dxy, dp, c: Mp.c, key: which.value };
        });
        v.readout(() => {
          const s = st; if (s.c == null) return '';
          return `$d(\\varphi x,\\varphi y) = ${v.fix(s.dp, 3)}$, $\\;d(x,y) = ${v.fix(s.dxy, 3)}$, ratio $${v.fix(s.ratio, 3)}$; $\\;` + (s.c < 1 ? `\\sup_X\\|\\varphi'\\| \\le c = ${v.fix(s.c, 3)} < 1$, so by 9.19 every ratio is at most $c$: a contraction.` : `\\sup_X\\|\\varphi'\\| = ${v.fix(s.c, 3)} > 1$: pairs near the centre are pulled apart, so no $c<1$ works.`);
        });
      },
    },
    // ------------------------------------------------------------------ 9.23
    {
      num: '9.23',
      kind: 'Theorem',
      name: 'Contraction principle (Banach fixed point theorem)',
      statement: String.raw`If $X$ is a complete metric space and $\varphi$ is a contraction of $X$ into $X$, then there is one and only one $x\in X$ with $\varphi(x)=x$.`,
      idea: String.raw`Uniqueness: if $\varphi(x)=x$ and $\varphi(y)=y$ then $d(x,y)\le c\,d(x,y)$, so $d(x,y)=0$. Existence: start anywhere and iterate, $x_{n+1}=\varphi(x_n)$. Then $d(x_{n+1},x_n)\le c^n d(x_1,x_0)$, and summing the geometric series (3.26) gives $d(x_n,x_m)\le\frac{c^n}{1-c}\,d(x_1,x_0)$ for $n<m$, so $\{x_n\}$ is Cauchy. Completeness supplies a limit $x$, and continuity of $\varphi$ gives $\varphi(x)=\lim x_{n+1}=x$. Both hypotheses matter: on $(0,1]$ the map $x/2$ has no fixed point, and $t+1/t$ on $[1,\infty)$ shrinks every distance but has no uniform $c<1$ and no fixed point.`,
      caption: String.raw`Choose a space and a map, drag the starting point $x_0$ and set the number of steps $n$. The right panel plots $\log_{10}$ of the step lengths $d(x_{k+1},x_k)$ (gold) and of the errors $d(x_k,x^*)$ (green dots) against $k$, with the a priori bound $c^k d(x_1,x_0)/(1-c)$ from the proof (dashed): geometric decay, i.e. straight lines of slope $\log_{10}c$. In the plane the dashed circle about $x_n$ has that radius and always contains $x^*$. The last two examples break completeness and the condition $c<1$.`,
      deps: ['pma-9.22', 'pma-3.12', 'pma-3.8', 'pma-3.26'],
      see: ['pma-9.24'],
      tags: ['contraction', 'fixed points', 'completeness'],
      viz(v) {
        const M = v.M;
        const MODES = {
          plane: { label: '$\\varphi$ on $[-1,1]^2$' },
          cos: { label: '$\\cos x$ on $[0,1]$', phi: Math.cos, lo: 0, hi: 1, c: Math.sin(1), x0: 0.08, view: [0.5, 0.5, 0.62] },
          half: { label: '$x/2$ on $(0,1]$', phi: (x) => x / 2, lo: 1e-9, hi: 1, c: 0.5, x0: 0.9, view: [0.5, 0.5, 0.62] },
          shift: { label: '$x+1/x$ on $[1,\\infty)$', phi: (x) => x + 1 / x, lo: 1, hi: 8, c: 1, x0: 1.3, view: [5, 5, 4.4] },
        };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'plane');
        const nS = v.slider('steps $n$', 0, 30, 8, { int: true });
        const L = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], height: 330, title: 'iterates $x_{k+1}=\\varphi(x_k)$' });
        const R = v.stage({ x: [-0.5, 30.5], y: [-10, 1], height: 330, axes: 'box', xlabel: 'k', yticks: [[0, '1'], [-2, '10⁻²'], [-4, '10⁻⁴'], [-6, '10⁻⁶'], [-8, '10⁻⁸'], [-10, '10⁻¹⁰']], title: 'distances on a log scale' });
        const h0 = L.handle(-0.8, 0.85, {
          color: 'accent', label: 'x₀',
          constrain: (x, y) => { const Md = MODES[mode.value]; if (mode.value === 'plane') return [M.clamp(x, -1, 1), M.clamp(y, -1, 1)]; const t = M.clamp((x + y) / 2, Math.max(Md.lo, Md.lo + 0.01), Md.hi); return [t, t]; },
        });
        const con = MAPS.con;
        let last = null, st = {};
        v.render(() => {
          const key = mode.value, Md = MODES[key], n = nS.value;
          if (key === 'plane') fitEqual(L, 0, 0, 1.15); else fitEqual(L, Md.view[0], Md.view[1], Md.view[2]);
          if (last !== key) { last = key; if (key === 'plane') h0.set(-0.8, 0.85); else h0.set(Md.x0, Md.x0); }
          const N = 30;
          let xs, dist, c, xstar = null;
          if (key === 'plane') {
            c = con.c; xs = [[h0.x, h0.y]];
            for (let k = 0; k < N; k++) xs.push(con.phi(xs[k]));
            xstar = [0, 0]; let z = [0, 0]; for (let k = 0; k < 400; k++) z = con.phi(z); xstar = z;
            dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
            // picture
            L.rect(-1, -1, 1, 1, { color: 'ink', width: 1.4, fill: 'gray', fillAlpha: 0.05 });
            L.poly(SQ.map(con.phi), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1, alpha: 0.6 });
            L.path(xs.slice(0, n + 1), { color: 'gold', width: 1.6 });
            xs.slice(1, n + 1).forEach((p, k) => L.dot(p[0], p[1], { color: 'gold', r: 3.4, alpha: 0.5 + 0.5 * (k + 1) / (n + 1) }));
            const rad = c ** n * dist(xs[1], xs[0]) / (1 - c);
            L.circle(xs[n][0], xs[n][1], rad, { color: 'green', width: 1.4, dash: [5, 4], fill: 'green', fillAlpha: 0.05 });
            L.dot(xs[n][0], xs[n][1], { color: 'gold', r: 5.5, label: `x${String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('')}`, labelPos: 'ne' });
            L.dot(xstar[0], xstar[1], { color: 'green', r: 5, label: 'x*', labelPos: 'sw' });
          } else {
            const phi = Md.phi; c = Md.c; xs = [h0.x];
            for (let k = 0; k < N; k++) xs.push(phi(xs[k]));
            if (key === 'cos') { let z = 0.7; for (let k = 0; k < 200; k++) z = Math.cos(z); xstar = z; }
            dist = (p, q) => Math.abs(p - q);
            const [cx, cy, hw] = Md.view;
            L.line(cx - 3 * hw, cy - 3 * hw, cx + 3 * hw, cy + 3 * hw, { color: 'muted', width: 1.2, dash: [5, 4] });
            L.rect(Md.lo, Md.lo, Md.hi, Md.hi, { color: 'grid', width: 1 });
            L.fn(phi, { domain: [Md.lo, key === 'shift' ? 20 : Md.hi], color: 'accent', width: 2.4 });
            if (key === 'half') { L.dot(0, 0, { color: 'red', r: 5, hollow: true, label: '0 ∉ X', labelPos: 'se', math: false }); }
            // cobweb
            const web = [[xs[0], xs[0]]];
            for (let k = 0; k < n; k++) { web.push([xs[k], xs[k + 1]]); web.push([xs[k + 1], xs[k + 1]]); }
            L.path(web, { color: 'gold', width: 1.5 });
            L.dot(xs[n], xs[n], { color: 'gold', r: 5 });
            if (xstar != null) L.dot(xstar, xstar, { color: 'green', r: 5, label: 'x*', labelPos: 'se' });
            const yb = cy - hw * 0.96;
            if (key === 'shift') { L.arrow(Md.lo, yb, cx + hw * 1.6, yb, { color: 'teal', width: 3, head: 9 }); L.dot(Md.lo, yb, { color: 'teal', r: 3.5 }); }
            else L.interval(Md.lo, Md.hi, yb, { color: 'teal', width: 3, r: 3.5, open: [key === 'half', false] });
            L.text('X', key === 'shift' ? cx + hw * 0.4 : (Md.lo + Md.hi) / 2, yb, { color: 'teal', dy: -11, math: true, align: 'center' });
          }
          // right panel: log distances
          const lg = (x) => Math.log10(Math.max(x, 1e-12));
          const steps = Array.from({ length: N }, (_, k) => dist(xs[k + 1], xs[k]));
          const d10 = steps[0];
          if (c < 1 && d10 > 0) {
            R.line(0, lg(d10 / (1 - c)), 30, lg(d10 / (1 - c)) + 30 * Math.log10(c), { color: 'green', width: 1.6, dash: [6, 4] });
            R.line(0, lg(d10), 30, lg(d10) + 30 * Math.log10(c), { color: 'gold', width: 1.2, dash: [2, 4] });
          }
          R.vline(n, { color: 'muted', width: 1, dash: [3, 3] });
          steps.forEach((s, k) => R.dot(k, lg(s), { color: 'gold', r: k < n ? 4 : 2.5, alpha: k < n ? 1 : 0.4 }));
          if (xstar != null) xs.forEach((p, k) => R.dot(k, lg(dist(p, xstar)), { color: 'green', r: k <= n ? 3.5 : 2.2, alpha: k <= n ? 1 : 0.4 }));
          if (key === 'half') xs.forEach((p, k) => R.dot(k, lg(p), { color: 'red', r: k <= n ? 3.5 : 2.2, alpha: k <= n ? 1 : 0.4 }));
          const leg = [['gold', 'step $d(x_{k+1},x_k)$', { dot: true }]];
          if (xstar != null) leg.push(['green', 'error $d(x_k,x^*)$', { dot: true }]);
          if (key === 'half') leg.push(['red', 'distance to $0\\notin X$', { dot: true }]);
          if (c < 1) leg.push(['green', 'bound $c^kd(x_1,x_0)/(1-c)$ on $d(x_k,\\lim x_j)$', { dash: true }], ['gold', '$c^kd(x_1,x_0)$', { dash: true }]);
          v.legend(leg);
          st = { key, n, c, xn: xs[n], xstar, step: steps[Math.max(0, n - 1)], err: xstar != null ? dist(xs[n], xstar) : null, bound: c < 1 ? c ** n * d10 / (1 - c) : null };
        });
        v.readout(() => {
          const s = st; if (!s.key) return '';
          if (s.key === 'plane' || s.key === 'cos') return `$c = ${v.fix(s.c, 3)}$: after $n=${s.n}$ steps $d(x_n,x^*) = ${v.fmt(s.err, 3)} \\le c^n d(x_1,x_0)/(1-c) = ${v.fmt(s.bound, 3)}$. The fixed point ${s.key === 'cos' ? `$x^*=${v.fix(s.xstar, 6)}$ solves $\\cos x = x$` : `$x^*=(${v.fix(s.xstar[0], 4)},\\ ${v.fix(s.xstar[1], 4)})$`} and does not depend on $x_0$.`;
          if (s.key === 'half') return `$c=\\tfrac12$ and the iterates are Cauchy ($x_n = ${v.fmt(s.xn, 3)}$), but their limit $0$ is not in $X=(0,1]$: $X$ is not complete and $\\varphi$ has no fixed point.`;
          return `$|\\varphi(x)-\\varphi(y)| = |x-y|\\,(1-\\tfrac1{xy}) < |x-y|$, yet the ratio tends to $1$, so there is no $c<1$. The steps $1/x_k$ shrink too slowly to sum: $x_n = ${v.fmt(s.xn, 4)}\\to\\infty$ and there is no fixed point.`;
        });
      },
    },
  ],
};
