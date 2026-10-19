// Optimization — Chapter 3: Convex functions (items 3.1–3.7; 3.8–3.13 in ch03-b.js)
//
// House style: convexity of a function is *tested* in the picture (a seeded chord test on the graph, the epigraph or
// a sublevel set of whatever function the reader is looking at), so a non-convex variant fails visibly; conjugates
// and envelopes are computed by brute force on a grid and compared with closed forms where those exist.
import {
  clamp, mulberry, hull, chordTest, chordTest1, chordTest2, grad2, hess2, eigs2, conjugateOnGrid, linspace, pwl,
  memo, rgbA, descend, d1, levelsOf,
} from './ch03.shared.js';

/** Test functions of one variable on [-3, 3] (y-range about [-1, 7]). */
const P1 = [
  { key: 'sq', label: '$x^2$', f: (x) => (x * x) / 1.5 },
  { key: 'abs', label: '$|x|$', f: (x) => 1.2 * Math.abs(x) },
  { key: 'exp', label: '$e^{x}$', f: (x) => Math.exp(x / 1.6) },
  { key: 'well', label: 'double well', f: (x) => x ** 4 / 12 - x * x / 1.2 + 2 },
  { key: 'wave', label: '$\\sin$ wave', f: (x) => 0.5 * x + Math.sin(1.6 * x) + 2 },
];
const fmt = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

/** Exact input ranges on the displayed convex domain [-3,3], for item 3.6. */
export const convexOperationInputs = {
  sq: { label: '$x^2/2$', f: (x) => (x * x) / 2, convex: true, range: [0, 4.5] },
  abs: { label: '$|x-1|$', f: (x) => Math.abs(x - 1), convex: true, range: [0, 4] },
  exp: { label: '$e^{x/1.5}$', f: (x) => Math.exp(x / 1.5), convex: true, range: [Math.exp(-2), Math.exp(2)] },
  conc: { label: 'concave $2-x^2/3$', f: (x) => 2 - (x * x) / 3, convex: false, range: [-1, 2] },
};
export const convexOperationOuters = {
  exp: (t) => Math.exp(t / 2),
  sq: (t) => t * t,
  sqrt: (t) => Math.sqrt(Math.max(0, t + 3)),
};
/** Sufficient convex/nondecreasing composition rule; failure gives no conclusion. */
export function convexCompositionRule(inner, outer) {
  const input = convexOperationInputs[inner];
  if (!input || !convexOperationOuters[outer]) throw new RangeError('Unknown composition choice');
  if (!input.convex) return { applies: false, why: '$f_1$ is not convex: this sufficient rule gives no conclusion' };
  if (outer === 'sqrt') return { applies: false, why: '$g$ is concave on the displayed range: this sufficient rule gives no conclusion' };
  if (outer === 'sq' && input.range[0] < 0) return { applies: false, why: '$t^2$ is not nondecreasing on the range of $f_1$: this sufficient rule gives no conclusion' };
  return { applies: true, why: outer === 'sq'
    ? '$t^2$ is convex and nondecreasing on the **nonnegative range** of convex $f_1$: the composition rule applies'
    : '$g$ is convex and nondecreasing and $f_1$ is convex: the composition rule applies' };
}

export default {
  collection: 'opt',
  chapter: 3,
  title: 'Convex functions',
  summary: String.raw`A function is convex when its graph lies below its chords, equivalently when its epigraph is a convex set. For differentiable functions this means tangent planes are global underestimators, and for twice differentiable ones a positive semidefinite Hessian. Convexity survives sums, maxima and suitable compositions, the conjugate function packages a convex function by its supporting hyperplanes, and the decisive consequence is that every local minimum is global.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Convex functions and epigraphs',
      statement: String.raw`Let $C\subseteq\R^n$ be convex. A function $f:C\to\R$ is **convex** if $f(\theta x+(1-\theta)y)\le\theta f(x)+(1-\theta)f(y)$ for all $x,y\in C$ and $\theta\in[0,1]$: every chord lies on or above the graph. It is **strictly convex** if the inequality is strict for $x\ne y$ and $0<\theta<1$, and **concave** if $-f$ is convex. The **epigraph** of $f$ is the set $\operatorname{epi}f=\{(x,t)\in C\times\R:\ t\ge f(x)\}$, and $f$ is convex **if and only if** $\operatorname{epi}f$ is a convex subset of $\R^{n+1}$. (Extended-valued functions with $f=+\infty$ off a convex set are included via the same epigraph.)`,
      idea: String.raw`Take two points $(x,s),(y,t)$ of the epigraph, so $s\ge f(x)$ and $t\ge f(y)$. Their convex combination is $(\theta x+(1-\theta)y,\ \theta s+(1-\theta)t)$, which lies in the epigraph precisely when $f(\theta x+(1-\theta)y)\le\theta s+(1-\theta)t$. Letting $s=f(x)$, $t=f(y)$ gives the chord inequality, and conversely the chord inequality gives the bound for all larger $s,t$. So convexity of a function is convexity of a set (opt-2.1) one dimension up, and every fact about convex sets transfers.`,
      caption: String.raw`Pick a function, or choose *draw it* and drag the orange knots to sketch a piecewise-linear graph. Drag the endpoints $a,b$ along the graph: the chord is green when the graph stays under it and red (with the offending sliver shaded) when it pokes above. The dashed red chord is the worst of 1500 random chords. **Right:** the same function's epigraph, tested the same way as a set in the plane (opt-2.1): the function-chord count and the epigraph-chord count vanish together, since they are the same test.`,
      credit: 'Jensen, 1905–1906 (the chord definition and its use for inequalities)',
      deps: ['rca-3.1', 'opt-2.1'],
      refs: ['Boyd–Vandenberghe §3.1'],
      tags: ['convex function', 'epigraph'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function' },
      viz(v) {
        const sel = v.select('function', [...P1.map((p) => ({ value: p.key, label: p.label })), { value: 'knots', label: 'draw it' }], 'well');
        const L = v.stage({ x: [-3.2, 3.2], y: [-1.5, 7], axes: 'box', gutter: true, grid: true, height: 360, title: 'graph and chord' });
        const E = v.stage({ x: [-3.2, 3.2], y: [-1.5, 7], axes: 'box', gutter: true, grid: true, height: 360, title: 'epigraph' });
        const K = [-3, -1.8, -0.6, 0.6, 1.8, 3].map((x0) => L.handle(x0, (x0 * x0) / 1.5, { color: 'orange', r: 6, constrain: (x, y) => [x0, clamp(y, -1, 6.8)] }));
        let F = (x) => x;
        const A = L.handle(-2.2, 0, { color: 'accent', label: 'a', labelPos: 'nw', constrain: (x) => [clamp(x, -3, 3), F(clamp(x, -3, 3))] });
        const B = L.handle(1.9, 0, { color: 'accent', label: 'b', labelPos: 'ne', constrain: (x) => [clamp(x, -3, 3), F(clamp(x, -3, 3))] });
        const mt = memo(), me = memo();
        let info = {};
        v.render(() => {
          const knots = sel.value === 'knots';
          K.forEach((h) => { h.visible = knots; });
          F = knots ? pwl(K.map((h) => [h.x, h.y])) : P1.find((p) => p.key === sel.value).f;
          const key = knots ? 'k' + K.map((h) => h.y.toFixed(2)).join(',') : sel.value;
          A.set(A.x, F(A.x)); B.set(B.x, F(B.x));
          const ct = mt(key, () => chordTest1(F, -3, 3));
          const ep = me(key, () => chordTest((x, t) => t >= F(x), [-3, -1.5, 3, 7], { seed: 9 }));
          L.fn(F, { domain: [-3, 3], color: 'accent', width: 2.6, n: 300 });
          if (ct.chord) {
            const [x, y, t] = ct.chord;
            L.segment([x, F(x)], [y, F(y)], { color: 'red', width: 1.4, alpha: 0.6, dash: true });
            L.dot(t * x + (1 - t) * y, F(t * x + (1 - t) * y), { r: 4, color: 'red' });
          }
          const a = Math.min(A.x, B.x), b = Math.max(A.x, B.x), fa = F(a), fb = F(b), ch = (x) => fa + ((fb - fa) * (x - a)) / (b - a || 1);
          let ex = 0; for (let i = 0; i <= 160; i++) { const x = a + ((b - a) * i) / 160; ex = Math.max(ex, F(x) - ch(x)); }
          const ok = ex <= 1e-9;
          L.between(F, ch, a, b, { fill: ok ? 'green' : 'red', fillAlpha: 0.16, stroke: false });
          L.segment([a, fa], [b, fb], { color: ok ? 'green' : 'red', width: 3.4 });
          // epigraph
          E.raster((x, t) => (t >= F(x) ? rgbA(v, 'accent', 60) : null), { res: 3, key: 'epi|' + key });
          E.fn(F, { domain: [-3, 3], color: 'accent', width: 2.2, n: 300 });
          E.segment([a, fa], [b, fb], { color: ok ? 'green' : 'red', width: 3.4 });
          E.dot(a, fa, { r: 5, color: 'accent' }); E.dot(b, fb, { r: 5, color: 'accent' });
          if (ep.worst) E.segment(ep.worst[0], ep.worst[1], { color: 'red', width: 1.4, alpha: 0.6, dash: true });
          info = { ct, ep, ex, ok };
        });
        v.readout(() => {
          const { ct, ep, ex, ok } = info;
          const verdict = ct.bad === 0 && ep.bad === 0 ? 'no chord breaks: consistent with **convex**' : '**not convex**: some chords lie below the graph';
          return `Chord $[a,b]$: ${ok ? 'the graph stays below it' : `the graph pokes above it by up to $${fmt(v, ex)}$`}.\nSampled chord inequalities violated (function test): **${ct.bad}** of ${ct.tested}; epigraph chords leaving the epigraph: **${ep.bad}** of ${ep.tested} (${verdict}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'First-order condition: tangents underestimate',
      statement: String.raw`Let $f$ be differentiable on an open convex set $C\subseteq\R^n$. Then $f$ is convex if and only if
$$f(y)\ \ge\ f(x)+\nabla f(x)^{\mathsf T}(y-x)\qquad\text{for all }x,y\in C:$$
the tangent plane at any point is a global underestimator. In particular, if $f$ is convex and $\nabla f(x)=0$, then $f(y)\ge f(x)$ for all $y$, so $x$ is a **global** minimizer; a stationary point of a convex function needs no second-order check.`,
      idea: String.raw`If $f$ is convex then for $t\in(0,1]$ the chord inequality gives $f(x+t(y-x))\le f(x)+t\,(f(y)-f(x))$; dividing by $t$ and letting $t\to0$ turns the left side into the directional derivative $\nabla f(x)^{\mathsf T}(y-x)$ (differentiability, as in the mean value theorem pma-5.10 applied along the segment). Conversely, apply the tangent inequality at the point $z=\theta x+(1-\theta)y$ to both $x$ and $y$ and average with weights $\theta,1-\theta$: the gradient terms cancel and the chord inequality remains.`,
      caption: String.raw`Drag the point $p$ on the contour map. The heat map is the **gap** $f(z)-\big(f(p)+\nabla f(p)^{\mathsf T}(z-p)\big)$ between the surface and its tangent plane: blue where the plane lies below, red where it pokes above the surface. For the convex examples there is no red anywhere, whatever $p$; for the non-convex ones red appears. The right panel slices the surface through $p$ along the direction $\varphi$ and draws the tangent line. *Go to the minimizer* runs gradient descent: for a convex $f$ the gradient vanishes there and the whole map turns blue.`,
      deps: ['opt-3.1', 'pma-5.10'],
      refs: ['Boyd–Vandenberghe §3.1'],
      tags: ['gradient', 'tangent plane', 'first-order condition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function#Properties' },
      viz(v) {
        const FS = {
          lse: { label: 'log-sum-exp', f: (x, y) => Math.log(Math.exp(x) + Math.exp(y) + Math.exp(-x - y)), view: { x: [-2.6, 2.6], y: [-2.1, 2.1] } },
          quad: { label: 'tilted bowl', f: (x, y) => x * x + 0.5 * y * y + 0.6 * x * y + 0.4 * x, view: { x: [-2.6, 2.6], y: [-2.1, 2.1] } },
          quart: { label: '$\\tfrac14x^4+y^2$', f: (x, y) => x ** 4 / 4 + y * y, view: { x: [-2.6, 2.6], y: [-2.1, 2.1] } },
          dwell: { label: 'double well', f: (x, y) => (x * x - 1) ** 2 + 0.5 * y * y, view: { x: [-2.6, 2.6], y: [-2.1, 2.1] } },
          wave: { label: 'egg crate', f: (x, y) => 0.25 * (x * x + y * y) + Math.sin(x) * Math.cos(y), view: { x: [-2.6, 2.6], y: [-2.1, 2.1] } },
        };
        const sel = v.select('function', Object.entries(FS).map(([k, o]) => ({ value: k, label: o.label })), 'lse');
        const ph = v.slider('slice direction $\\varphi$ (degrees)', 0, 180, 30, { step: 1, int: true });
        const view = FS.lse.view;
        const S = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 360, title: 'contours of $f$ and the tangent-plane gap' });
        const R = v.stage({ x: [-3, 3], y: [-1, 7], axes: 'box', gutter: true, grid: true, height: 360, title: 'slice through $p$' });
        const P = S.handle(1.0, 0.6, { color: 'gold', label: 'p', labelPos: 'ne', constrain: { x: view.x, y: view.y } });
        v.button('go to the minimizer', () => {
          const f = FS[sel.value].f, r = descend(f, P.x, P.y, { iters: 800, box: [view.x[0], view.y[0], view.x[1], view.y[1]] });
          P.set(r.x, r.y);
        });
        let info = {};
        v.render(() => {
          const O = FS[sel.value], f = O.f, p = [P.x, P.y], f0 = f(p[0], p[1]), g = grad2(f, p[0], p[1]);
          const gap = (x, y) => f(x, y) - f0 - g[0] * (x - p[0]) - g[1] * (y - p[1]);
          const sc = 1.0;
          S.raster((x, y) => { const t = clamp(gap(x, y) / sc, -1, 1); return [...v.diverge(t, 'red', 'blue').map(Math.round), 255 * (0.1 + 0.6 * Math.sqrt(Math.abs(t)))]; }, { res: 3, key: `gap|${sel.value}|${p[0].toFixed(3)}|${p[1].toFixed(3)}` });
          S.clip(() => S.contour(f, levelsOf(f, view.x[0], view.x[1], view.y[0], view.y[1], 12), { color: 'ink', alpha: 0.45, width: 1, res: 100 }));
          S.arrow(p[0], p[1], p[0] - 0.5 * g[0] / (Math.hypot(...g) + 1) * 2, p[1] - 0.5 * g[1] / (Math.hypot(...g) + 1) * 2, { color: 'green', width: 2.2 });
          // global gap minimum over the window
          let mn = Infinity, am = null;
          for (let j = 0; j <= 50; j++) for (let i = 0; i <= 70; i++) {
            const x = view.x[0] + (i / 70) * (view.x[1] - view.x[0]), y = view.y[0] + (j / 50) * (view.y[1] - view.y[0]), e = gap(x, y);
            if (e < mn) { mn = e; am = [x, y]; }
          }
          if (mn < -1e-6) S.dot(am[0], am[1], { r: 5, color: 'red', hollow: true, width: 2 });
          // slice
          const th = (ph.value * Math.PI) / 180, u = [Math.cos(th), Math.sin(th)];
          const sl = (t) => f(p[0] + t * u[0], p[1] + t * u[1]), sl0 = g[0] * u[0] + g[1] * u[1];
          R.setView([-3, 3], [Math.min(f0 - 1, -0.5), Math.max(f0 + 4, 5)]);
          R.fn(sl, { color: 'accent', width: 2.6, n: 300 });
          R.line(-3, f0 - 3 * sl0, 3, f0 + 3 * sl0, { color: 'green', width: 2 });
          const bad = []; for (let i = 0; i <= 120; i++) { const t = -3 + (6 * i) / 120; if (sl(t) < f0 + sl0 * t - 1e-9) bad.push(t); }
          bad.forEach((t) => R.dot(t, sl(t), { r: 2.5, color: 'red' }));
          R.dot(0, f0, { r: 6, color: 'gold' });
          info = { g, mn, f0, gn: Math.hypot(...g) };
        });
        v.legend([['green', 'tangent plane / line'], ['red', 'where the tangent is above $f$']]);
        v.readout(() => {
          const { gn, mn } = info;
          return `$\\|\\nabla f(p)\\|=${fmt(v, gn)}$. Smallest gap on the window: $${fmt(v, mn)}$ — ${mn >= -1e-6 ? 'the tangent plane is below the surface **everywhere**' + (gn < 0.02 ? ', and $\\nabla f(p)\\approx0$, so $p$ is a global minimizer' : '') : 'the tangent plane **crosses** the surface (red ring), so $f$ is not convex'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Second-order condition: positive semidefinite Hessian',
      statement: String.raw`Let $f$ be twice continuously differentiable on an open convex set $C\subseteq\R^n$. Then $f$ is convex on $C$ if and only if $\nabla^2f(x)\succeq0$ for every $x\in C$, i.e. every eigenvalue of the Hessian is nonnegative. If $\nabla^2f(x)\succ0$ for all $x\in C$, then $f$ is strictly convex (the converse fails: $x^4$ is strictly convex with $f''(0)=0$). For a function of one variable the condition is $f''\ge0$.`,
      idea: String.raw`Restrict $f$ to a line, $\varphi(t)=f(x+tv)$: convexity of $f$ is convexity of every such $\varphi$, and $\varphi''(t)=v^{\mathsf T}\nabla^2f(x+tv)\,v$. A twice differentiable function of one variable is convex exactly when its derivative is nondecreasing, i.e. $\varphi''\ge0$ (by the first-order condition opt-3.2 or the mean value theorem). So convexity holds iff $v^{\mathsf T}\nabla^2f(x)v\ge0$ for all $x$ and all directions $v$, which is positive semidefiniteness (ladr-7.38 characterizes positive operators by their eigenvalues).`,
      caption: String.raw`The colour is the **smallest Hessian eigenvalue** $\lambda_{\min}(\nabla^2f)$ at each point, computed numerically: blue is positive (locally convex), red negative. Pick an example or type your own $f(x,y)$. Drag $p$: its eigen-directions are drawn, and the right panel shows $f$ along each of them with the parabola of curvature $\lambda_i$. The theorem says the chord test must pass exactly when no red appears: the number of violated sampled chord inequalities (on the window) is reported beside the fraction of red area.`,
      deps: ['opt-3.2', 'ladr-7.38'],
      refs: ['Boyd–Vandenberghe §3.1'],
      tags: ['Hessian', 'second-order condition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function#Properties' },
      viz(v) {
        const PRE = [
          { key: 'lse', label: 'log-sum-exp', src: 'log(exp(x)+exp(y)+exp(-x-y))' },
          { key: 'q4', label: '$x^4+y^2$', src: 'x^4+y^2' },
          { key: 'sad', label: '$x^2+y^2-2.5xy$', src: 'x^2+y^2-2.5*x*y' },
          { key: 'well', label: '$x^4-x^2+y^2$', src: 'x^4-x^2+y^2' },
          { key: 'exy', label: '$e^{xy}$', src: 'exp(x*y)' },
          { key: 'soft', label: '$\\sqrt{1+x^2+y^2}$', src: 'sqrt(1+x^2+y^2)' },
        ];
        const view = { x: [-2, 2], y: [-1.6, 1.6] };
        const inp = v.input('$f(x,y)=$', PRE[0].src, { vars: ['x', 'y'], width: 260 });
        const sel = v.select('example', PRE.map((p) => ({ value: p.key, label: p.label })), 'lse', { onChange: (k) => inp.set(PRE.find((p) => p.key === k).src) });
        const S = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 360, title: '$\\lambda_{\\min}(\\nabla^2 f)$ and contours' });
        const R = v.stage({ x: [-1.5, 1.5], y: [-0.5, 4], axes: 'box', gutter: true, grid: true, height: 360, title: '$f$ along the two eigen-directions of $p$' });
        const P = S.handle(0.5, 0.3, { color: 'gold', label: 'p', labelPos: 'ne', constrain: { x: view.x, y: view.y } });
        const mt = memo();
        let info = {};
        v.render(() => {
          const f = (x, y) => { const g = inp.fn; return g ? g(x, y) : NaN; };
          const key = inp.value;
          const lm = (x, y) => eigs2(hess2(f, x, y, 2e-3)).l1;
          const sc = mt(key, () => {
            let neg = 0, tot = 0, mn = Infinity;
            for (let j = 0; j <= 40; j++) for (let i = 0; i <= 56; i++) {
              const l = lm(view.x[0] + (i / 56) * 4, view.y[0] + (j / 40) * 3.2);
              if (!Number.isFinite(l)) continue; tot++; mn = Math.min(mn, l); if (l < -1e-6) neg++;
            }
            return { frac: tot ? neg / tot : 0, mn, ct: chordTest2(f, [-2, -1.6, 2, 1.6]) };
          });
          S.raster((x, y) => { const l = lm(x, y); if (!Number.isFinite(l)) return null; const t = clamp(l / 2, -1, 1); return [...v.diverge(t, 'red', 'blue').map(Math.round), 255 * (0.15 + 0.6 * Math.sqrt(Math.abs(t)))]; }, { res: 4, key: 'lmin|' + key });
          S.clip(() => S.contour(f, levelsOf(f, view.x[0], view.x[1], view.y[0], view.y[1], 12), { color: 'ink', alpha: 0.45, width: 1, res: 100 }));
          const H = hess2(f, P.x, P.y, 2e-3), E = eigs2(H), c = [P.x, P.y];
          [[E.l1, E.v1], [E.l2, E.v2]].forEach(([l, w]) => S.arrow(c[0], c[1], c[0] + 0.5 * w[0], c[1] + 0.5 * w[1], { color: l >= 0 ? 'blue' : 'red', width: 2.4 }));
          const f0 = f(c[0], c[1]);
          R.setView([-1.5, 1.5], [f0 - 1.5, f0 + 3]);
          [[E.l1, E.v1, 'orange'], [E.l2, E.v2, 'teal']].forEach(([l, w, col]) => {
            R.fn((t) => f(c[0] + t * w[0], c[1] + t * w[1]), { color: col, width: 2.4, n: 200 });
            R.fn((t) => f0 + 0.5 * l * t * t, { color: col, width: 1.2, dash: true, n: 100 });
          });
          R.dot(0, f0, { r: 5, color: 'gold' });
          info = { E, sc };
        });
        v.legend([['orange', 'along $v_1$ ($\\lambda_{\\min}$)'], ['teal', 'along $v_2$ ($\\lambda_{\\max}$)'], ['ink', 'dashed: $\\tfrac12\\lambda t^2$ model', { dash: true }]]);
        v.readout(() => {
          const { E, sc } = info;
          return `At $p$: $\\lambda_{\\min}=${fmt(v, E.l1)}$, $\\lambda_{\\max}=${fmt(v, E.l2)}$ (${E.l1 >= 0 ? 'positive semidefinite here' : 'indefinite here'}). On the window, $\\min\\lambda_{\\min}=${fmt(v, sc.mn)}$ and **${v.fix(100 * sc.frac, 0)}%** of the area is red.\nSampled chord inequalities violated: **${sc.ct.bad}** of ${sc.ct.tested} — ${sc.ct.bad === 0 && sc.frac === 0 ? 'convex on the window, as the theorem says' : sc.ct.bad > 0 && sc.frac > 0 ? 'not convex, as the red region predicts' : 'compare with the red area'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Jensen’s inequality',
      statement: String.raw`Let $f$ be convex on a convex set $C$, let $x_1,\dots,x_k\in C$ and let $\theta_i\ge0$ with $\sum_i\theta_i=1$. Then
$$f\Big(\sum_{i=1}^k\theta_ix_i\Big)\ \le\ \sum_{i=1}^k\theta_if(x_i).$$
More generally $f(\mathbb E\,X)\le\mathbb E f(X)$ for a random variable $X$ with values in $C$ whenever both expectations exist (the integral form is rca-3.3). For a strictly convex $f$ equality holds only when $X$ is almost surely constant; for a concave $f$ the inequality reverses.`,
      idea: String.raw`For $k=2$ the inequality is the definition of convexity (opt-3.1). For $k$ points use induction: write $\sum_{i\le k}\theta_ix_i=\theta_kx_k+(1-\theta_k)\,y$ with $y=\sum_{i<k}\frac{\theta_i}{1-\theta_k}x_i$, apply the two-point inequality, then the induction hypothesis to $y$. Geometrically, the weighted centre of mass of points on the graph lies in their convex hull, which lies in the epigraph; that centre sits above the graph at the abscissa $\bar x$.`,
      caption: String.raw`Drag the $k$ points along the graph; dot area is proportional to the weight $\theta_i$ (change them with the *tilt*). The gold point is the weighted centre of mass $\big(\bar x,\sum\theta_if(x_i)\big)$ and the green point is $\big(\bar x,f(\bar x)\big)$ on the graph; the vertical bar is the Jensen gap. **Right:** shrink or stretch the cloud about $\bar x$ by a factor $\lambda$: the gap is $0$ at $\lambda=0$ and nonnegative everywhere for a convex $f$. Switch to the sine wave or to a concave function and the gap goes negative.`,
      credit: 'Jensen, 1906',
      deps: ['opt-3.1', 'rca-3.3'],
      refs: ['Boyd–Vandenberghe §3.1'],
      tags: ['Jensen', 'inequality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jensen%27s_inequality' },
      viz(v) {
        const FS = [
          { key: 'sq', label: '$x^2$', f: (x) => (x * x) / 1.5 },
          { key: 'exp', label: '$e^{x}$', f: (x) => Math.exp(x / 1.6) },
          { key: 'abs', label: '$|x|$', f: (x) => 1.2 * Math.abs(x) },
          { key: 'wave', label: 'sine wave', f: (x) => 0.5 * x + Math.sin(1.6 * x) + 2 },
          { key: 'conc', label: 'concave $5-x^2/2$', f: (x) => 5 - (x * x) / 2 },
        ];
        const sel = v.select('function', FS.map((p) => ({ value: p.key, label: p.label })), 'exp');
        const kS = v.slider('points $k$', 2, 5, 4, { step: 1, int: true });
        const tilt = v.slider('weight tilt', -2, 2, 0.8, { step: 0.05 });
        const L = v.stage({ x: [-3.2, 3.2], y: [-1.5, 7], axes: 'box', gutter: true, grid: true, height: 360, title: 'points on the graph and their centre of mass' });
        const R = v.stage({ x: [0, 2], y: [-1, 2], axes: 'box', gutter: true, grid: true, height: 360, title: 'Jensen gap as the cloud is rescaled', xlabel: '$\\lambda$' });
        let F = FS[0].f;
        const x0 = [-2.3, -0.7, 0.8, 2.2, 1.6];
        const H = x0.map((x, i) => L.handle(x, 0, { color: 'accent', r: 6, constrain: (px) => [clamp(px, -3, 3), F(clamp(px, -3, 3))] }));
        let info = {};
        v.render(() => {
          F = FS.find((p) => p.key === sel.value).f;
          const k = kS.value;
          H.forEach((h, i) => { h.visible = i < k; h.set(h.x, F(h.x)); });
          const xs = H.slice(0, k).map((h) => h.x);
          const raw = xs.map((_, i) => Math.exp(tilt.value * (i - (k - 1) / 2) / ((k - 1) / 2 || 1)));
          const Z = raw.reduce((a, b) => a + b, 0), th = raw.map((r) => r / Z);
          const xb = xs.reduce((a, x, i) => a + th[i] * x, 0), lhs = F(xb), rhs = xs.reduce((a, x, i) => a + th[i] * F(x), 0);
          L.fn(F, { domain: [-3, 3], color: 'accent', width: 2.6, n: 300 });
          const pts = xs.map((x) => [x, F(x)]);
          if (k >= 3) L.poly(hull(pts), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.2 });
          else L.segment(pts[0], pts[1], { color: 'orange', width: 2 });
          pts.forEach((p, i) => L.dot(p[0], p[1], { r: 3 + 14 * Math.sqrt(th[i]), color: 'accent', alpha: 0.5 }));
          L.segment([xb, lhs], [xb, rhs], { color: rhs >= lhs ? 'green' : 'red', width: 3.2 });
          L.dot(xb, lhs, { r: 6, color: 'green', label: '$f(\\bar x)$', labelPos: 'se' });
          L.dot(xb, rhs, { r: 7, color: 'gold', label: '$\\sum\\theta_if(x_i)$', labelPos: 'nw' });
          // rescaling curve
          let lmax = 2; xs.forEach((x) => { const d = x - xb; if (Math.abs(d) > 1e-9) lmax = Math.min(lmax, ((d > 0 ? 3 - xb : xb + 3) / Math.abs(d))); });
          const J = (lam) => xs.reduce((a, x, i) => a + th[i] * F(xb + lam * (x - xb)), 0) - F(xb);
          let jmin = 0, jmax = 0.1; for (let i = 0; i <= 80; i++) { const j = J((lmax * i) / 80); jmin = Math.min(jmin, j); jmax = Math.max(jmax, j); }
          R.setView([0, Math.max(lmax, 0.2)], [jmin - 0.1 * (jmax - jmin) - 0.05, jmax * 1.1 + 0.05]);
          R.hline(0, { color: 'ink', width: 1.2 });
          R.fn(J, { domain: [0, Math.max(lmax, 0.01)], color: 'purple', width: 2.4, n: 160 });
          R.dot(1, J(1), { r: 6, color: 'gold' });
          info = { xb, lhs, rhs, th, gapMin: jmin };
        });
        v.readout(() => {
          const { xb, lhs, rhs, th, gapMin } = info;
          return `$\\bar x=\\sum\\theta_ix_i=${fmt(v, xb)}$, weights $(${th.map((t) => v.fix(t, 2)).join(',\\ ')})$.\n$f(\\bar x)=${fmt(v, lhs)}$ ${lhs <= rhs + 1e-12 ? '$\\le$' : '$>$'} $\\sum\\theta_if(x_i)=${fmt(v, rhs)}$; gap $=${fmt(v, rhs - lhs)}$. Over the rescaling the gap's minimum is $${fmt(v, gapMin)}$${gapMin < -1e-9 ? ' — negative, so $f$ is not convex' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Sublevel sets of convex functions are convex',
      statement: String.raw`If $f:C\to\R$ is convex, then every sublevel set $\{x\in C: f(x)\le\alpha\}$, $\alpha\in\R$, is convex (possibly empty). The converse is false: a function all of whose sublevel sets are convex need not be convex. (Such functions are *quasiconvex*, opt-3.9; $x\mapsto\sqrt{\|x\|}$ is an example.) Likewise the superlevel sets of a concave function are convex.`,
      idea: String.raw`Take $x,y$ with $f(x)\le\alpha$ and $f(y)\le\alpha$. By convexity $f(\theta x+(1-\theta)y)\le\theta f(x)+(1-\theta)f(y)\le\alpha$, so the combination stays in the set. Said with epigraphs (opt-3.1): the sublevel set is the slice of the convex epigraph by the horizontal hyperplane $t=\alpha$, and a slice of a convex set is convex. The converse fails because the slices can all be convex while the cap of the graph bends the wrong way, as for $\sqrt{r}$.`,
      caption: String.raw`Slide the level $\alpha$; the shaded region is $\{f\le\alpha\}$ and the contours are the boundaries of all of them. For each function the page tests twice by chord tests: the sublevel set at the current $\alpha$ and also at 12 levels across the range, and the function itself. **$\sqrt r$** is the instructive case: all 12 sublevel sets pass, yet $f$ fails — the converse of the theorem is false. **Ring** $(r-2)^2$ has annular sublevel sets that fail. The right panel is the profile along the $x$-axis with the level line.`,
      deps: ['opt-3.1'],
      refs: ['Boyd–Vandenberghe §3.1'],
      tags: ['sublevel set', 'quasiconvex'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Level_set#Sublevel_and_superlevel_sets' },
      viz(v) {
        const view = { x: [-3, 3], y: [-2.4, 2.4] };
        const FS = {
          bowl: { label: 'tilted bowl', f: (x, y) => 0.5 * x * x + 0.3 * y * y + 0.4 * x * y, amax: 8 },
          lse: { label: 'log-sum-exp', f: (x, y) => Math.log(Math.exp(x) + Math.exp(y) + Math.exp(-x - y)), amax: 5 },
          sqrt: { label: '$\\sqrt r$', f: (x, y) => Math.sqrt(Math.hypot(x, y / 0.8)), amax: 2 },
          ring: { label: 'ring $(r-2)^2$', f: (x, y) => (Math.hypot(x, y) - 2) ** 2, amax: 4 },
        };
        const sel = v.select('function', Object.entries(FS).map(([k, o]) => ({ value: k, label: o.label })), 'sqrt');
        const al = v.slider('level $\\alpha$', 0.05, 4, 1.2, { step: 0.01 });
        const S = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 360, title: 'sublevel set $\\{f\\le\\alpha\\}$' });
        const R = v.stage({ x: [-3, 3], y: [-0.3, 4], axes: 'box', gutter: true, grid: true, height: 360, title: '$f(x,0)$ and the level' });
        const mt = memo(), mc = memo();
        let info = {};
        v.render(() => {
          const O = FS[sel.value], f = O.f, a = al.value;
          const fl = mt(sel.value, () => {
            const lv = Array.from({ length: 12 }, (_, i) => 0.15 + ((O.amax - 0.15) * i) / 11);
            const ok = lv.map((l) => chordTest((x, y) => f(x, y) <= l, [-3, -2.4, 3, 2.4], { seed: 3 }));
            return { ok: ok.filter((c) => c.m >= 12 && c.bad === 0).length, tot: ok.filter((c) => c.m >= 12).length, fct: chordTest2(f, [-3, -2.4, 3, 2.4]) };
          });
          const cur = mc(sel.value + '|' + a.toFixed(3), () => chordTest((x, y) => f(x, y) <= a, [-3, -2.4, 3, 2.4], { seed: 8 }));
          S.raster((x, y) => (f(x, y) <= a ? rgbA(v, cur.bad ? 'red' : 'accent', 70) : null), { res: 3, key: `sub|${sel.value}|${a.toFixed(3)}|${cur.bad}` });
          S.clip(() => S.contour(f, levelsOf(f, -3, 3, -2.4, 2.4, 10), { color: 'ink', alpha: 0.3, width: 1, res: 100 }));
          S.clip(() => S.contour(f, [a], { color: cur.bad ? 'red' : 'accent', width: 2.6, res: 160 }));
          if (cur.worst) S.segment(cur.worst[0], cur.worst[1], { color: 'red', width: 1.4, dash: true });
          R.fn((x) => f(x, 0), { color: 'accent', width: 2.6, n: 300 });
          R.hline(a, { color: 'orange', width: 1.6 });
          // sublevel interval on the x-axis
          let run = null; const iv = [];
          for (let i = 0; i <= 600; i++) { const x = -3 + (6 * i) / 600, ok = f(x, 0) <= a; if (ok && !run) run = x; if ((!ok || i === 600) && run !== null) { iv.push([run, x]); run = null; } }
          iv.forEach(([p, q]) => R.segment([p, 0], [q, 0], { color: 'green', width: 5 }));
          info = { cur, fl };
        });
        v.readout(() => {
          const { cur, fl } = info;
          const f3 = fl.fct.bad === 0;
          return `Sublevel set at $\\alpha$: ${cur.m < 12 ? 'empty or too small to test' : cur.bad === 0 ? '**convex** (no chord leaves it)' : `**not convex**: ${cur.bad} of ${cur.tested} chords leave it`}. Across 12 levels (${fl.tot} of them non-empty), **${fl.ok}** sublevel sets are convex.\nChord test on $f$ itself: **${fl.fct.bad}** of ${fl.fct.tested} sampled chord inequalities violated — ${f3 ? '$f$ is convex, so every sublevel set had to pass' : fl.ok === fl.tot ? '$f$ is **not** convex although every sublevel set is: the converse fails' : '$f$ is not convex'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Operations that preserve convex functions',
      statement: String.raw`Let $f,f_1,f_2,\dots$ be convex. Then the following are convex: (a) nonnegative combinations $\alpha_1f_1+\alpha_2f_2$ with $\alpha_i\ge0$; (b) the pointwise maximum $\max(f_1,f_2)$ and more generally the pointwise supremum $\sup_{a\in\mathcal A}f_a$ of any family (finite where it is finite); (c) the composition with an affine map, $x\mapsto f(Ax+b)$; (d) the composition $g\circ f$ with $g$ convex and nondecreasing on an interval containing the range of $f$, and $f$ convex (scalar $f$). In general $-f$, differences $f_1-f_2$, minima $\min(f_1,f_2)$ and compositions with a decreasing or non-monotone $g$ need not be convex.`,
      idea: String.raw`Each rule is a one-line check of the chord inequality (opt-3.1). For (a), add the inequalities. For (b), apply the chord inequality to each $f_a$ and then take the supremum on both sides. For (c), $x\mapsto Ax+b$ commutes with convex combinations. For (d), $g(f(\theta x+(1-\theta)y))\le g(\theta f(x)+(1-\theta)f(y))\le\theta g(f(x))+(1-\theta)g(f(y))$, using first that $g$ is nondecreasing and then that it is convex. Sublevel sets and epigraphs give the same results geometrically: the epigraph of a maximum is an intersection of epigraphs (opt-2.5).`,
      caption: String.raw`Choose $f_1,f_2$ (including a concave one) and an operation. The dashed graphs are the inputs, the heavy curve is the result, and a chord test of 1500 chords is run on **each** of them; the readout states whether the rule's hypotheses hold and whether the test agrees. Slide the weights $\alpha,\beta$ negative, take a **minimum**, or compose with a non-monotone $g$, and the conclusion can fail. The composition rule only needs $g$ to be convex and nondecreasing on the range of $f_1$. *Supremum of tangents* draws the tangent lines of $f_1$ at $m$ points and their maximum: a convex piecewise-linear function that hugs $f_1$ from below.`,
      deps: ['opt-3.1'],
      refs: ['Boyd–Vandenberghe §3.2'],
      tags: ['composition', 'pointwise maximum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function#Operations_that_preserve_convexity' },
      viz(v) {
        const BASE = convexOperationInputs;
        const opts = Object.entries(BASE).map(([k, o]) => ({ value: k, label: o.label }));
        const s1 = v.select('$f_1$', opts, 'sq'), s2 = v.select('$f_2$', opts, 'abs');
        const op = v.select('operation', [
          { value: 'sum', label: '$\\alpha f_1+\\beta f_2$' }, { value: 'max', label: '$\\max(f_1,f_2)$' }, { value: 'min', label: '$\\min(f_1,f_2)$' },
          { value: 'aff', label: '$f_1(ax+b)$' }, { value: 'tan', label: 'sup of tangents' }, { value: 'comp', label: '$g\\circ f_1$' },
        ], 'sum');
        const gS = v.select('$g$', [{ value: 'exp', label: '$e^{t/2}$' }, { value: 'sq', label: '$t^2$' }, { value: 'sqrt', label: '$\\sqrt{t+3}$' }], 'exp');
        const alpha = v.slider('$\\alpha$', -1.5, 2, 1, { step: 0.05 }), beta = v.slider('$\\beta$', -1.5, 2, 1, { step: 0.05 });
        const aS = v.slider('$a$', -2, 2, 1.5, { step: 0.05 }), bS = v.slider('$b$', -2, 2, 0.5, { step: 0.05 });
        const mS = v.slider('tangent points $m$', 1, 8, 3, { step: 1, int: true });
        const S = v.stage({ x: [-3, 3], y: [-3, 7], axes: 'box', gutter: true, grid: true, height: 380, title: 'inputs (dashed) and result' });
        let info = {};
        v.render(() => {
          const f1 = BASE[s1.value].f, f2 = BASE[s2.value].f, o = op.value;
          alpha.el.hidden = beta.el.hidden = o !== 'sum'; s2.el && (s2.el.hidden = o === 'aff' || o === 'tan' || o === 'comp');
          aS.el.hidden = bS.el.hidden = o !== 'aff'; mS.el.hidden = o !== 'tan'; gS.el.hidden = o !== 'comp';
          const g = convexOperationOuters[gS.value];
          let h, hyp, rule;
          if (o === 'sum') { h = (x) => alpha.value * f1(x) + beta.value * f2(x); hyp = alpha.value >= 0 && beta.value >= 0; rule = 'nonnegative weights'; }
          else if (o === 'max') { h = (x) => Math.max(f1(x), f2(x)); hyp = null; rule = 'maximum'; }
          else if (o === 'min') { h = (x) => Math.min(f1(x), f2(x)); hyp = false; rule = 'minimum (no rule)'; }
          else if (o === 'aff') { h = (x) => f1(aS.value * x + bS.value); hyp = null; rule = 'affine substitution'; }
          else if (o === 'tan') {
            const m = mS.value, ts = linspace(-2.4, 2.4, Math.max(2, m)).map((t) => (m === 1 ? 0 : t));
            h = (x) => Math.max(...ts.map((t) => f1(t) + d1(f1, t) * (x - t))); hyp = null; rule = 'supremum of affine functions';
          } else { h = (x) => g(f1(x)); hyp = null; rule = 'composition'; }
          const c1 = chordTest1(f1, -3, 3), c2 = chordTest1(f2, -3, 3), ch = chordTest1(h, -3, 3);
          const conv1 = c1.bad === 0, conv2 = c2.bad === 0;
          S.fn(f1, { color: 'teal', width: 1.4, dash: true, n: 200 });
          if (o !== 'aff' && o !== 'tan' && o !== 'comp') S.fn(f2, { color: 'orange', width: 1.4, dash: true, n: 200 });
          if (o === 'tan') { const m = mS.value, ts = linspace(-2.4, 2.4, Math.max(2, m)).map((t) => (m === 1 ? 0 : t)); ts.forEach((t) => { S.line(-3, f1(t) + d1(f1, t) * (-3 - t), 3, f1(t) + d1(f1, t) * (3 - t), { color: 'purple', width: 1, alpha: 0.6 }); S.dot(t, f1(t), { r: 3, color: 'purple' }); }); }
          S.fn(h, { color: ch.bad === 0 ? 'green' : 'red', width: 3, n: 300 });
          if (ch.chord) { const [x, y] = ch.chord; S.segment([x, h(x)], [y, h(y)], { color: 'red', width: 1.4, dash: true, alpha: 0.7 }); }
          // rule applicability
          let applies, why;
          if (o === 'sum') { applies = hyp && conv1 && conv2; why = hyp ? (conv1 && conv2 ? 'both inputs convex and $\\alpha,\\beta\\ge0$: the rule applies' : 'an input is not convex: no conclusion') : '$\\alpha$ or $\\beta$ is negative: no conclusion'; }
          else if (o === 'max') { applies = conv1 && conv2; why = applies ? 'both inputs convex: the maximum is convex' : 'an input is not convex: no conclusion'; }
          else if (o === 'min') { applies = false; why = 'no rule: a minimum of convex functions is generally not convex'; }
          else if (o === 'aff') { applies = conv1; why = conv1 ? '$f_1$ convex: convex after an affine change of variable' : '$f_1$ not convex: no conclusion'; }
          else if (o === 'tan') { applies = conv1; why = 'a maximum of affine (hence convex) functions, always convex'; applies = true; }
          else { ({ applies, why } = convexCompositionRule(s1.value, gS.value)); }
          info = { ch, applies, why, rule };
        });
        v.readout(() => {
          const { ch, applies, why } = info;
          const conclusion = ch.bad > 0 ? 'not convex: a sampled chord violates convexity'
            : applies ? 'convex by the stated rule; no sampled violations'
              : 'no sampled violations; the sufficient rule gives no conclusion';
          return `${why}.\nChord test on the result: **${ch.bad}** of ${ch.tested} sampled chord inequalities violated — ${conclusion}${applies && ch.bad > 0 ? ' (unexpected: the hypotheses of the rule hold, so check the inputs)' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'The conjugate function',
      statement: String.raw`For $f:\R^n\to\R\cup\{+\infty\}$, the **conjugate** (Legendre–Fenchel transform) is
$$f^*(y)=\sup_{x}\big(y^{\mathsf T}x-f(x)\big),$$
with values in $\R\cup\{+\infty\}$, defined on the set of slopes $y$ for which the supremum is finite. The function $f^*$ is **always convex and lower semicontinuous**, whether or not $f$ is, since it is a pointwise supremum of the affine functions $y\mapsto x^{\mathsf T}y-f(x)$. Examples: $f=\tfrac12x^2\Rightarrow f^*=\tfrac12y^2$; $f=e^x\Rightarrow f^*(y)=y\ln y-y$ for $y>0$, $f^*(0)=0$ and $+\infty$ for $y<0$; $f=|x|\Rightarrow f^*=0$ on $[-1,1]$ and $+\infty$ outside; $f=\tfrac14x^4\Rightarrow f^*=\tfrac34|y|^{4/3}$.`,
      idea: String.raw`Fix a slope $y$ and look at the line $x\mapsto yx$ through the origin: the largest vertical gap $yx-f(x)$ between this line and the graph is $f^*(y)$. Sliding the line down by that amount gives the line $yx-f^*(y)$, which lies below the graph and touches it where the gap was largest, so $-f^*(y)$ is the intercept of the supporting line of slope $y$. The conjugate therefore encodes $f$ by the intercepts of its supporting lines, indexed by slope. As a supremum of affine functions of $y$ it is convex (opt-3.6(b)). For smooth strictly convex $f$ it is the classical Legendre transform (pde-8.11), with $f^{*\prime}=(f')^{-1}$.`,
      caption: String.raw`Pick $f$ and slide the slope $y$. **Left:** the dashed line $x\mapsto yx$ and the point $x^{*}$ where the gap $yx-f(x)$ is largest; the bar is $f^*(y)$, and the green line $yx-f^*(y)$ is the supporting line of slope $y$ (it touches the graph at $x^{*}$). **Right:** the conjugate $f^*$ computed on a grid and plotted for every $y$; where the maximizer runs off the grid's end the supremum is $+\infty$ and the curve stops. Try the double well: $f$ is not convex, yet $f^*$ is. The readout compares the grid value with the closed form.`,
      credit: 'Fenchel, 1949 (conjugate convex functions); Young, 1912 (the one-variable inequality)',
      deps: ['opt-3.1', 'pde-8.11'],
      refs: ['Boyd–Vandenberghe §3.3'],
      tags: ['conjugate', 'Legendre–Fenchel'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_conjugate' },
      viz(v) {
        const PF = {
          quad: { label: '$x^2/2$', f: (x) => x * x / 2, c: (y) => y * y / 2 },
          exp: { label: '$e^x$', f: (x) => Math.exp(x), c: (y) => (y > 0 ? y * Math.log(y) - y : y === 0 ? 0 : Infinity) },
          abs: { label: '$|x|$', f: (x) => Math.abs(x), c: (y) => (Math.abs(y) <= 1 ? 0 : Infinity) },
          quart: { label: '$x^4/4$', f: (x) => x ** 4 / 4, c: (y) => 0.75 * Math.abs(y) ** (4 / 3) },
          well: { label: 'double well', f: (x) => (x * x - 1) ** 2 / 2, c: null },
        };
        const sel = v.select('function $f$', Object.entries(PF).map(([k, o]) => ({ value: k, label: o.label })), 'quart');
        const yS = v.slider('slope $y$', -4, 4, 1.5, { step: 0.01 });
        const L = v.stage({ x: [-4, 4], y: [-3, 8], axes: 'box', gutter: true, grid: true, height: 380, title: '$f$, the line $yx$ and the largest gap' });
        const R = v.stage({ x: [-4, 4], y: [-3, 8], axes: 'box', gutter: true, grid: true, height: 380, title: 'the conjugate $f^*(y)$', xlabel: '$y$' });
        const XS = linspace(-5, 5, 1201), YS = linspace(-4, 4, 321);
        const mc = memo();
        let info = {};
        v.render(() => {
          const O = PF[sel.value], f = O.f;
          const C = mc(sel.value, () => { const fs = XS.map(f); return conjugateOnGrid(XS, fs, YS); });
          const y = yS.value, j = Math.round(((y + 4) / 8) * 320), cv = C.conj[j], ai = C.arg[j], inf = ai === 0 || ai === XS.length - 1;
          L.fn(f, { domain: [-4, 4], color: 'accent', width: 2.6, n: 300 });
          L.line(-4, -4 * y, 4, 4 * y, { color: 'muted', width: 1.4, dash: true });
          if (!inf) {
            const xs = XS[ai];
            L.line(-4, -4 * y - cv, 4, 4 * y - cv, { color: 'green', width: 2.4 });
            L.segment([xs, f(xs)], [xs, y * xs], { color: 'orange', width: 4 });
            L.dot(xs, f(xs), { r: 6, color: 'gold', label: '$x^*$', labelPos: 'nw' });
          } else L.corner('sup not attained: $f^*(y)=+\\infty$', 'tl', { color: 'red' });
          const pts = []; YS.forEach((yy, i) => { const e = C.arg[i] === 0 || C.arg[i] === XS.length - 1; pts.push(e ? null : [yy, C.conj[i]]); });
          R.path(pts, { color: 'purple', width: 2.6 });
          if (!inf) R.dot(y, cv, { r: 6, color: 'gold' });
          else R.vline(y, { color: 'red', width: 1.6, dash: true });
          if (O.c) { const cp = []; YS.forEach((yy) => { const c = O.c(yy); cp.push(Number.isFinite(c) ? [yy, c] : null); }); R.path(cp, { color: 'ink', width: 1, dash: true, alpha: 0.7 }); }
          // convexity of f* on its finite part
          const fin = YS.map((yy, i) => (C.arg[i] === 0 || C.arg[i] === XS.length - 1 ? null : C.conj[i]));
          let worst = 0; for (let i = 1; i < YS.length - 1; i++) if (fin[i - 1] !== null && fin[i] !== null && fin[i + 1] !== null) worst = Math.max(worst, fin[i] - (fin[i - 1] + fin[i + 1]) / 2);
          info = { y, cv, inf, closed: O.c ? O.c(y) : null, worst, xs: inf ? null : XS[ai] };
        });
        v.readout(() => {
          const { y, cv, inf, closed, worst, xs } = info;
          if (inf) return `At $y=${fmt(v, y, 2)}$ the supremum runs off the grid: $f^*(y)=+\\infty$ (the gap $yx-f(x)$ grows without bound).`;
          return `$y=${fmt(v, y, 2)}$: maximal gap at $x^*=${fmt(v, xs, 2)}$, $f^*(y)\\approx${fmt(v, cv)}$${closed !== null && Number.isFinite(closed) ? `; closed form $${fmt(v, closed)}$` : ''}.\nLargest violation of midpoint convexity of the computed $f^*$ along the grid: $${v.sci(Math.max(worst, 0), 2)}$ (zero up to rounding: $f^*$ is convex).`;
        });
      },
    },
  ],
};
