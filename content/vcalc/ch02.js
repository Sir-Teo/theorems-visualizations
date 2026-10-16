// Vector Calculus — Chapter 2: Differentiating scalar fields
// Part 1 (2.1–2.8): graphs and level sets, partial derivatives, differentiability, chain rule, gradient.
import {
  tn, tf, tup, add3, sub3, mul3, dot3, norm3, unit3, patch, arc3, hills, grad2, hess2, surf3, onSurf, trail, levelSegs, segLen, bisect, DEG, TAU,
} from './ch02.shared.js';

// a few graphs z = f(x, y) used by several items (world coordinates, |z| <= ~1.1 on [-1.2, 1.2]^2)
const SURF = {
  hills: { label: 'hills', f: hills },
  saddle: { label: 'saddle', f: (x, y) => 0.7 * (x * x - y * y) },
  bowl: { label: 'bowl', f: (x, y) => 0.75 * (x * x + y * y) - 0.4 },
  ripple: { label: 'ripples', f: (x, y) => 0.85 * Math.cos(3.2 * Math.hypot(x, y)) * Math.exp(-0.5 * (x * x + y * y)) },
};
const surfOptions = Object.entries(SURF).map(([value, s]) => ({ value, label: s.label }));
const R12 = [-1.2, 1.2];

export default {
  collection: 'vcalc',
  chapter: 2,
  title: 'Differentiating scalar fields',
  summary: String.raw`A function of several variables is drawn as a graph or as a family of level sets. Its derivative is the best linear approximation, encoded by the gradient, which points uphill, is perpendicular to level sets and gives every directional derivative. Second derivatives (the Hessian) classify critical points, and Lagrange multipliers find extrema on a constraint surface by matching gradients.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Graphs, level curves and level surfaces',
      statement: String.raw`A **scalar field** is a function $f:U\to\R$ on a set $U\subseteq\R^n$. For $n=2$ its **graph** is the surface $\{(x,y,f(x,y))\}\subset\R^3$, and for each real $c$ its **level set** $\{(x,y): f(x,y)=c\}$ is a **level curve**. For $n=3$ the level sets $\{f(x,y,z)=c\}$ are **level surfaces**; the graph would live in $\R^4$, so level sets are the only way to draw it.`,
      idea: String.raw`The level curve at height $c$ is what you get by slicing the graph with the horizontal plane $z=c$ and looking straight down, so a contour map is a stack of such slices flattened into the plane. Where the curves crowd together the graph is steep; where they are far apart it is flat. The same trick one dimension up turns a function of three variables into a family of surfaces.`,
      caption: String.raw`Slide the level $c$: the orange plane cuts the graph, and the cut is drawn on the map as the orange level curve (empty if the plane misses the surface). Switch the first control to the three-variable function $x^2+y^2-z^2$ and watch the level surface change type as $c$ crosses $0$.`,
      deps: ['vcalc-1.1'],
      refs: ['Marsden–Tromba §2.1'],
      tags: ['level sets', 'graphs', 'contours'],
      viz(v) {
        const mode = v.select('function', [...surfOptions, { value: 'g', label: '$x^2+y^2-z^2$' }], 'hills');
        const c = v.slider('level $c$', -1, 1, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.65, 1.7], equal: true, axes: false, height: 400, weight: 1.35 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.42, axis: 1.45, lim: 1.3 });
        const Q = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: 'box', gutter: true, height: 400, weight: 1, xlabel: 'x', ylabel: 'y', title: 'the level sets, seen from above' });
        const gfun = (x, y) => x * x - y * y; // slice y = 0 of g in the (x, z)-plane
        let st = {}, lastMode = null;
        const range = {};
        for (const [k, s] of Object.entries(SURF)) { let lo = 1e9, hi = -1e9; for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) { const z = s.f(-1.2 + 0.04 * i, -1.2 + 0.04 * j); lo = Math.min(lo, z); hi = Math.max(hi, z); } range[k] = [lo, hi]; }
        v.render(() => {
          const m = mode.value, cc = c.value;
          sc.begin();
          if (m !== 'g') {
            const f = SURF[m].f;
            surf3(sc, f, R12, R12, 24, { fill: 'accent' });
            const q = 1.25;
            sc.poly([[-q, -q, cc], [q, -q, cc], [q, q, cc], [-q, q, cc]], { fill: 'orange', fillAlpha: 0.1, color: 'orange' });
            const segs = levelSegs(f, R12, R12, cc, 90);
            for (const [p, r] of segs) sc.line([p[0], p[1], cc], [r[0], r[1], cc], { color: 'orange', width: 2.6, bias: -0.05 }, 1);
            st = { m, len: segLen(segs), n: segs.length };
          } else {
            const nu = 36, nv = 14;
            const z1 = 1.15;
            if (cc >= 0) {
              const P = (th, z) => { const r = Math.sqrt(cc + z * z); return [r * Math.cos(th), r * Math.sin(th), z]; };
              patch(sc, P, [0, TAU], [-z1, z1], nu, nv, { fill: 'orange', fillAlpha: 0.1 });
              for (let j = 0; j <= nv; j += 2) sc.path(trail((th) => P(th, -z1 + (2 * z1 * j) / nv), 0, TAU, 48), { color: 'orange', width: 1, alpha: 0.5 });
            } else {
              const t0 = Math.sqrt(-cc);
              for (const sg of [1, -1]) {
                const P = (th, t) => { const r = Math.sqrt(Math.max(0, t * t + cc)); return [r * Math.cos(th), r * Math.sin(th), sg * t]; };
                patch(sc, P, [0, TAU], [t0, 1.2], nu, 8, { fill: 'orange', fillAlpha: 0.1 });
                for (let j = 0; j <= 8; j += 2) sc.path(trail((th) => P(th, t0 + ((1.2 - t0) * j) / 8), 0, TAU, 48), { color: 'orange', width: 1, alpha: 0.5 });
              }
            }
            st = { m, cc };
          }
          sc.flush();
          if (m !== 'g') {
            const f = SURF[m].f;
            if (lastMode !== 'f') { Q.setLabels('x', 'y'); lastMode = 'f'; }
            Q.heat(f, { range: [-1, 1], cmap: 'theme-diverging', res: 3, key: m });
            Q.contour(f, Array.from({ length: 21 }, (_, i) => -1 + i * 0.1), { color: 'muted', alpha: 0.4, width: 1 });
            Q.contour(f, cc, { color: 'orange', width: 3, res: 160 });
          } else {
            if (lastMode !== 'g') { Q.setLabels('x', 'z'); lastMode = 'g'; }
            Q.heat(gfun, { range: [-1.5, 1.5], cmap: 'theme-diverging', res: 3, key: 'g' });
            Q.contour(gfun, Array.from({ length: 21 }, (_, i) => -1 + i * 0.1), { color: 'muted', alpha: 0.4, width: 1 });
            Q.contour(gfun, cc, { color: 'orange', width: 3, res: 160 });
          }
        });
        v.legend([['orange', 'the slice at height $c$'], ['muted', 'other level curves, step $0.1$']]);
        v.readout(() => {
          if (st.m === 'g') {
            const kind = Math.abs(st.cc) < 0.015 ? 'a **cone** (the surfaces change type here)' : st.cc > 0 ? 'a **one-sheeted hyperboloid** (one piece, a ring around the $z$-axis)' : 'a **two-sheeted hyperboloid** (two separate pieces, above and below)';
            return `$g(x,y,z)=x^2+y^2-z^2=${tf(st.cc, 2)}$ is ${kind}. The picture on the right is its cross-section $y=0$: $x^2-z^2=${tf(st.cc, 2)}$.`;
          }
          const [lo, hi] = range[st.m];
          return `$f$ takes values from $${tf(lo, 2)}$ to $${tf(hi, 2)}$ on the square. The level $c=${tf(c.value, 2)}$ ${st.n === 0 ? '**is not attained**: the plane misses the surface and the level set is empty.' : `is a curve of length about $${tf(st.len, 2)}$ (${st.n} sampled pieces); every point of it lies at height exactly $c$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Partial derivatives',
      statement: String.raw`For $f:U\to\R$ with $U\subseteq\R^2$ open, the **partial derivative** with respect to $x$ at $(x_0,y_0)$ is the ordinary derivative of the one-variable function $x\mapsto f(x,y_0)$ at $x_0$:
$$\frac{\partial f}{\partial x}(x_0,y_0)=\lim_{h\to0}\frac{f(x_0+h,y_0)-f(x_0,y_0)}{h},$$
when the limit exists; $\partial f/\partial y$ is defined the same way with $y$ varying and $x=x_0$ held fixed. For $n$ variables there are $n$ partials, one per coordinate axis.`,
      idea: String.raw`Freeze every variable but one and you are back in the one-variable calculus of Rudin's chapter 5 (the derivative as a limit of difference quotients), so the usual rules apply with the other variables treated as constants. Geometrically the plane $y=y_0$ slices the graph in a curve, and $f_x$ is the slope of that curve. Partials only see the two coordinate directions; what they do not see is the subject of the next items.`,
      caption: String.raw`Drag the gold point on the floor. The orange and green curves are the graph cut by the planes $y=y_0$ and $x=x_0$; their tangent lines have slopes $f_x$ and $f_y$, plotted flat on the right. Shrink the step $h$ and the secant slope (gold) converges to the tangent slope.`,
      deps: ['vcalc-2.1', 'pma-9.16'],
      refs: ['Marsden–Tromba §2.3'],
      tags: ['partial derivatives', 'slices'],
      viz(v) {
        const which = v.select('surface', surfOptions, 'hills');
        const hh = v.slider('step $h$', 0.01, 0.8, 0.35, { step: 0.01 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.65, 1.7], equal: true, axes: false, height: 400, weight: 1.35 });
        const sc = v.scene3(S, { yaw: -0.68, pitch: 0.38, axis: 1.45, lim: 1.25 });
        const A = v.stage({ x: [-1.2, 1.2], y: [-1.15, 1.2], axes: 'box', gutter: true, height: 400, weight: 0.75, minWidth: 240, xlabel: 'x', title: 'slice $y=y_0$: $x\\mapsto f(x,y_0)$' });
        const B = v.stage({ x: [-1.2, 1.2], y: [-1.15, 1.2], axes: 'box', gutter: true, height: 400, weight: 0.75, minWidth: 240, xlabel: 'y', title: 'slice $x=x_0$: $y\\mapsto f(x_0,y)$' });
        const P = sc.handle([0.3, 0.25, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'gold', lim: 1.15 });
        let st = {};
        v.render(() => {
          const f = SURF[which.value].f, x0 = P.p[0], y0 = P.p[1], z0 = f(x0, y0), h = hh.value;
          const [fx, fy] = grad2(f, x0, y0);
          const sx = (f(x0 + h, y0) - z0) / h, sy = (f(x0, y0 + h) - z0) / h;
          sc.begin();
          surf3(sc, f, R12, R12, 24, { fill: 'accent', a1: 0.22, wire: 0.2 });
          sc.poly([[-1.2, y0, -1.1], [1.2, y0, -1.1], [1.2, y0, 1.1], [-1.2, y0, 1.1]], { fill: 'orange', fillAlpha: 0.07, color: 'orange', alpha: 0.3 });
          sc.poly([[x0, -1.2, -1.1], [x0, 1.2, -1.1], [x0, 1.2, 1.1], [x0, -1.2, 1.1]], { fill: 'green', fillAlpha: 0.07, color: 'green', alpha: 0.3 });
          onSurf(sc, f, trail((t) => [t, y0], -1.2, 1.2, 64), { color: 'orange' });
          onSurf(sc, f, trail((t) => [x0, t], -1.2, 1.2, 64), { color: 'green' });
          sc.line([x0 - 0.5, y0, z0 - 0.5 * fx], [x0 + 0.5, y0, z0 + 0.5 * fx], { color: 'orange', width: 2.2, bias: -0.1 });
          sc.line([x0, y0 - 0.5, z0 - 0.5 * fy], [x0, y0 + 0.5, z0 + 0.5 * fy], { color: 'green', width: 2.2, bias: -0.1 });
          sc.line([x0, y0, z0], [x0 + h, y0, f(x0 + h, y0)], { color: 'gold', width: 1.8, dash: [4, 3] });
          sc.line([x0, y0, z0], [x0, y0 + h, f(x0, y0 + h)], { color: 'gold', width: 1.8, dash: [4, 3] });
          sc.line([x0, y0, 0], [x0, y0, z0], { color: 'muted', width: 1, dash: [3, 3] });
          sc.dot([x0, y0, z0], { color: 'gold', r: 5 });
          sc.flush();
          for (const [T, t0, g, sl, sec, col, fn] of [[A, x0, fx, sx, 'x', 'orange', (t) => f(t, y0)], [B, y0, fy, sy, 'y', 'green', (t) => f(x0, t)]]) {
            T.fn(fn, { color: col, width: 2.4 });
            T.line(t0 - 0.55, z0 - 0.55 * g, t0 + 0.55, z0 + 0.55 * g, { color: col, width: 1.4, alpha: 0.8, dash: [5, 4] });
            T.line(t0, z0, t0 + h, fn(t0 + h), { color: 'gold', width: 2.2 });
            T.dot(t0 + h, fn(t0 + h), { color: 'gold', r: 3.5 });
            T.dot(t0, z0, { color: 'gold', r: 5.5 });
          }
          st = { x0, y0, fx, fy, sx, sy, h };
        });
        v.legend([['orange', 'slice $y=y_0$ and its tangent'], ['green', 'slice $x=x_0$ and its tangent'], ['gold', 'secant over the step $h$']]);
        v.readout(() => `At $(x_0,y_0)=(${tf(st.x0, 2)},${tf(st.y0, 2)})$: $f_x=${tf(st.fx, 4)}$ and $f_y=${tf(st.fy, 4)}$.\nDifference quotients with $h=${tf(st.h, 2)}$: $\\dfrac{f(x_0+h,y_0)-f(x_0,y_0)}{h}=${tf(st.sx, 4)}$, $\\dfrac{f(x_0,y_0+h)-f(x_0,y_0)}{h}=${tf(st.sy, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Paradox',
      name: 'Partials exist but the function is discontinuous',
      statement: String.raw`Let $f(x,y)=\dfrac{xy}{x^2+y^2}$ for $(x,y)\neq(0,0)$ and $f(0,0)=0$. Both partial derivatives of $f$ exist at every point, including $f_x(0,0)=f_y(0,0)=0$, yet $f$ is not continuous at the origin: along the line $y=mx$ it has the constant value $m/(1+m^2)$, so $\lim_{(x,y)\to(0,0)}f$ does not exist.`,
      idea: String.raw`On both coordinate axes $f$ is identically $0$, so the one-variable difference quotients at the origin are all $0$ and the partials exist. But partials only look along two lines. On the line through the origin at angle $\varphi$ the function is constant, equal to $\tfrac12\sin2\varphi$, which takes every value in $[-\tfrac12,\tfrac12]$; a limit would have to be a single number. In one variable, differentiable implies continuous (Rudin 5.2); in several variables, having partials does not.`,
      caption: String.raw`Turn the angle $\varphi$ of the ray (red on the graph, which has a crease running up to the origin). Each ray carries its own constant value, plotted in the middle panel as a function of $\varphi$; only the two axis directions ($\varphi=0^\circ,90^\circ$) see the value $0$.`,
      deps: ['vcalc-2.2'],
      refs: ['Marsden–Tromba §2.3'],
      tags: ['continuity', 'counterexample', 'limits'],
      viz(v) {
        const phi = v.slider('ray angle $\\varphi$', 0, 180, 35, { step: 1, fmt: (x) => `${v.fix(x, 0)}°` });
        const f3 = (x, y) => (x === 0 && y === 0 ? 0 : (x * y) / (x * x + y * y));
        const g = (x, y) => 1.6 * f3(x, y);
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.7], equal: true, axes: false, height: 380, weight: 1.35 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.42, axis: 1.45, lim: 1.3 });
        const L = v.stage({ x: [0, 180], y: [-0.62, 0.62], axes: 'box', gutter: true, height: 380, weight: 0.8, minWidth: 220, xlabel: 'ray angle', xticks: [[0, '0°'], [45, '45°'], [90, '90°'], [135, '135°'], [180, '180°']], yticks: [-0.5, 0, 0.5], title: 'value of $f$ along the ray' });
        const Rr = v.stage({ x: [0, 1.2], y: [-0.62, 0.62], axes: 'box', gutter: true, height: 380, weight: 0.8, minWidth: 220, xlabel: 'distance $r$ from the origin', yticks: [-0.5, 0, 0.5], title: '$f$ on the ray vs $r$' });
        let st = {};
        v.render(() => {
          const p = phi.value * DEG, c = Math.cos(p), s = Math.sin(p);
          sc.begin();
          surf3(sc, g, R12, R12, 26, { fill: 'accent', a1: 0.25, wire: 0.22, zmax: 1.2 });
          onSurf(sc, g, [[-1.2, 0], [1.2, 0]], { color: 'green', width: 2.2 });
          onSurf(sc, g, [[0, -1.2], [0, 1.2]], { color: 'green', width: 2.2 });
          onSurf(sc, g, trail((r) => [r * c, r * s], 0, 1.2, 40), { color: 'red', width: 2.8 });
          sc.dot([0, 0, 0], { color: 'ink', hollow: true, r: 5 });
          sc.flush();
          const val = Math.sin(2 * p) / 2;
          L.fn((t) => Math.sin(2 * t * DEG) / 2, { color: 'muted', width: 1.8 });
          L.dot(0, 0, { color: 'green', r: 5 }); L.dot(90, 0, { color: 'green', r: 5 }); L.dot(180, 0, { color: 'green', r: 5 });
          L.vline(phi.value, { color: 'faint', dash: true });
          L.dot(phi.value, val, { color: 'red', r: 6.5 });
          Rr.hline(0, { color: 'faint' });
          Rr.line(0.0001, val, 1.2, val, { color: 'red', width: 2.8 });
          Rr.dot(0, val, { color: 'red', hollow: true, r: 6 });
          Rr.dot(0, 0, { color: 'ink', r: 5 });
          Rr.text('$f(0,0)=0$', 0.06, -0.12, { size: 12, color: 'ink' });
          st = { p, val, vals: [0.1, 0.01, 0.001].map((r) => f3(r * c, r * s)) };
        });
        v.legend([['red', 'the ray at angle $\\varphi$'], ['green', 'the two axes: $f\\equiv0$']]);
        v.readout(() => `Along this ray $f=\\tfrac12\\sin2\\varphi=${tf(st.val, 4)}$ at every distance: $f(0.1)=${tf(st.vals[0], 4)}$, $f(0.01)=${tf(st.vals[1], 4)}$, $f(0.001)=${tf(st.vals[2], 4)}$. The limit as $(x,y)\\to0$ would have to be $f(0,0)=0$, but different rays give every value in $[-\\tfrac12,\\tfrac12]$. Axes: $\\dfrac{f(h,0)-f(0,0)}{h}=\\dfrac{f(0,h)-f(0,0)}{h}=0$, so $f_x(0,0)=f_y(0,0)=0$.`);
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Differentiability and the tangent plane',
      statement: String.raw`A function $f:U\to\R$ ($U\subseteq\R^n$ open) is **differentiable** at $\mathbf a$ if there is a linear map $L:\R^n\to\R$ with
$$\lim_{\mathbf h\to\mathbf 0}\frac{f(\mathbf a+\mathbf h)-f(\mathbf a)-L(\mathbf h)}{|\mathbf h|}=0.$$
Then $L$ is unique, $L(\mathbf h)=\sum_i \partial_if(\mathbf a)\,h_i$, and the graph of $\mathbf x\mapsto f(\mathbf a)+L(\mathbf x-\mathbf a)$ is the **tangent plane** to the graph of $f$ at $\mathbf a$.`,
      idea: String.raw`This is Rudin's definition 9.11 specialised to scalar values: the increment equals a linear part plus an error that is $o(|\mathbf h|)$. Taking $\mathbf h=t\mathbf e_i$ shows that $L$ must have the partials as coefficients, which is why it is unique. Geometrically the surface looks like a plane under a strong enough microscope; at a cone's apex, or where the function is homogeneous of degree one but not linear, no zoom ever flattens it.`,
      caption: String.raw`Choose a function and drag the zoom $\delta$ down (the picture is rescaled by $1/\delta$ so it stays the same size). The smooth surface falls onto its orange tangent plane; the cone and the function $xy^2/(x^2+y^2)$ keep exactly the same shape at every scale. On the right, the largest error divided by $|\mathbf h|$ is plotted against $|\mathbf h|$.`,
      deps: ['vcalc-2.2', 'pma-9.11'],
      refs: ['Marsden–Tromba §2.3'],
      tags: ['differentiability', 'tangent plane', 'linearization'],
      viz(v) {
        const FN = {
          smooth: { label: 'smooth hills at $(0.2,0.1)$', f: hills, p: [0.2, 0.1], lin: true },
          cone: { label: 'cone $0.9\\sqrt{x^2+y^2}$ at its apex', f: (x, y) => 0.9 * Math.hypot(x, y), p: [0, 0], lin: false },
          xy2: { label: '$xy^2/(x^2+y^2)$ at $0$', f: (x, y) => (x === 0 && y === 0 ? 0 : (x * y * y) / (x * x + y * y)), p: [0, 0], lin: false },
        };
        const which = v.select('function', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const zoom = v.slider('zoom: window half-width $\\delta$', 0.001, 1, 0.6, { log: true, sig: 2 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.65, 1.7], equal: true, axes: false, height: 400, weight: 1.3 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.4, axis: 1.4, lim: 1.3, hint: true });
        const E = v.stage({ x: [1e-3, 1], y: [1e-9, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 260, xlabel: '$|\\mathbf h|$', title: 'worst error over $|\\mathbf h|$' });
        const dirs = Array.from({ length: 72 }, (_, i) => (i * TAU) / 72);
        const lin = (k) => { const o = FN[k]; return o.lin ? grad2(o.f, o.p[0], o.p[1]) : [0, 0]; };
        const ratio = {};
        const rs = Array.from({ length: 61 }, (_, i) => 10 ** (-3 + (3 * i) / 60));
        for (const k of Object.keys(FN)) {
          const o = FN[k], [fx, fy] = lin(k), f0 = o.f(o.p[0], o.p[1]);
          ratio[k] = rs.map((r) => [r, Math.max(...dirs.map((th) => Math.abs(o.f(o.p[0] + r * Math.cos(th), o.p[1] + r * Math.sin(th)) - f0 - r * (fx * Math.cos(th) + fy * Math.sin(th))) / r))]);
        }
        let st = {};
        v.render(() => {
          const o = FN[which.value], d = zoom.value, [x0, y0] = o.p, f0 = o.f(x0, y0), [fx, fy] = lin(which.value);
          const W = (u, w) => 0.8 * (o.f(x0 + d * u, y0 + d * w) - f0) / d;
          sc.begin();
          surf3(sc, W, [-1, 1], [-1, 1], 24, { fill: 'accent', a1: 0.3, wire: 0.25, zmax: 1.45 });
          const Lp = (u, w) => 0.8 * (fx * u + fy * w);
          sc.poly([[-1, -1, Lp(-1, -1)], [1, -1, Lp(1, -1)], [1, 1, Lp(1, 1)], [-1, 1, Lp(-1, 1)]], { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6, bias: 0.02 });
          sc.dot([0, 0, 0], { color: 'gold', r: 5 });
          sc.flush();
          for (const k of Object.keys(FN)) E.path(ratio[k], { color: k === which.value ? 'accent' : 'muted', width: k === which.value ? 2.6 : 1.2, alpha: k === which.value ? 1 : 0.5 });
          E.vline(d, { color: 'orange', dash: true });
          const e = ratio[which.value]; const cur = Math.max(...dirs.map((th) => Math.abs(o.f(x0 + d * Math.cos(th), y0 + d * Math.sin(th)) - f0 - d * (fx * Math.cos(th) + fy * Math.sin(th))) / d));
          E.dot(d, Math.max(cur, 1.2e-9), { color: 'orange', r: 5.5 });
          st = { cur, d, k: which.value, last: e[0][1] };
        });
        v.legend([['accent', 'surface (rescaled)'], ['orange', 'candidate tangent plane / current $\\delta$']]);
        v.readout(() => `At scale $\\delta=${st.d < 0.01 ? v.sci(st.d, 2) : tf(st.d, 3)}$ the largest of $|f(\\mathbf a+\\mathbf h)-f(\\mathbf a)-L(\\mathbf h)|/|\\mathbf h|$ over $|\\mathbf h|=\\delta$ is $${st.cur < 0.01 ? v.sci(st.cur, 2) : tf(st.cur, 3)}$. ${st.k === 'smooth' ? '**It tends to $0$ with $\\delta$: differentiable**, and the plane is the tangent plane.' : st.k === 'cone' ? '**It stays at $0.9$ for every $\\delta$: not differentiable** (no plane fits; the partials do not even exist there).' : '**It stays at $\\approx0.385$ for every $\\delta$: not differentiable**, although both partials exist and equal $0$.'}`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Continuous partials imply differentiability',
      statement: String.raw`Let $f$ be defined on an open set $U\subseteq\R^n$ and suppose all partial derivatives $\partial_if$ exist on $U$ and are continuous at $\mathbf a\in U$. Then $f$ is differentiable at $\mathbf a$ (and hence continuous, with $f(\mathbf a+\mathbf h)=f(\mathbf a)+\nabla f(\mathbf a)\cdot\mathbf h+o(|\mathbf h|)$). The converse is false: a function may be differentiable at a point where its partials are not continuous.`,
      idea: String.raw`Go from $\mathbf a$ to $\mathbf a+\mathbf h$ one coordinate at a time. Each leg is a one-variable move, so the mean value theorem (Rudin 5.10) gives $f$'s increment as $\partial_if$ at some intermediate point times $h_i$. Continuity of the partials at $\mathbf a$ makes those intermediate values close to $\partial_if(\mathbf a)$, so the sum differs from $\nabla f(\mathbf a)\cdot\mathbf h$ by $o(|\mathbf h|)$. Rudin proves this as 9.21.`,
      caption: String.raw`Pick a function and shrink the scale $s$. Left: the worst error $/|\mathbf h|$ against $|\mathbf h|$ for all three examples. Right: $f_x$ sampled on the circle of radius $s$ around the origin. For the $C^1$ function that circle of values collapses onto the number $f_x(0,0)$ and the error ratio goes to $0$; for the other two, $f_x$ keeps oscillating by about $\pm1$ at every scale, and the first of them ($xy^2/(x^2+y^2)$) is not even differentiable.`,
      deps: ['vcalc-2.4', 'pma-9.21'],
      refs: ['Marsden–Tromba §2.3'],
      tags: ['differentiability', 'continuity of partials'],
      viz(v) {
        const eps0 = 1e-300;
        const FN = {
          c1: { label: '$\\sin x+xy^2$ ($C^1$)', f: (x, y) => Math.sin(x) + x * y * y, fx: (x, y) => Math.cos(x) + y * y, Lx: 1, name: 'C1' },
          xy2: { label: '$xy^2/(x^2+y^2)$', f: (x, y) => (x === 0 && y === 0 ? 0 : (x * y * y) / (x * x + y * y)), fx: (x, y) => { const r2 = x * x + y * y + eps0; return (y * y * (y * y - x * x)) / (r2 * r2); }, Lx: 0, name: 'xy2' },
          osc: { label: '$(x^2+y^2)\\sin\\frac1{\\sqrt{x^2+y^2}}$', f: (x, y) => { const r = Math.hypot(x, y); return r === 0 ? 0 : r * r * Math.sin(1 / r); }, fx: (x, y) => { const r = Math.hypot(x, y) + eps0; return 2 * x * Math.sin(1 / r) - (x / r) * Math.cos(1 / r); }, Lx: 0, name: 'osc' },
        };
        const which = v.select('function', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'c1');
        const sl = v.slider('scale $s=|\\mathbf h|=\\rho$', 1e-4, 1, 0.3, { log: true, sig: 2 });
        const E = v.stage({ x: [1e-4, 1], y: [1e-9, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 260, xlabel: '$|\\mathbf h|$', title: 'worst error / $|\\mathbf h|$' });
        const Pn = v.stage({ x: [0, 360], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 260, xlabel: 'angle around the circle', xticks: [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°'], [360, '360°']], title: '$f_x$ on the circle of radius $s$' });
        const dirs = Array.from({ length: 90 }, (_, i) => (i * TAU) / 90);
        const rs = Array.from({ length: 61 }, (_, i) => 10 ** (-4 + (4 * i) / 60));
        const curves = {};
        for (const [k, o] of Object.entries(FN)) {
          curves[k] = rs.map((r) => [r, Math.max(1e-12, Math.max(...dirs.map((th) => Math.abs(o.f(r * Math.cos(th), r * Math.sin(th)) - r * o.Lx * Math.cos(th)) / r)))]);
        }
        let st = {};
        v.render(() => {
          const o = FN[which.value], s = sl.value;
          for (const k of Object.keys(FN)) E.path(curves[k], { color: k === which.value ? 'accent' : 'muted', width: k === which.value ? 2.6 : 1.2, alpha: k === which.value ? 1 : 0.5 });
          E.vline(s, { color: 'orange', dash: true });
          const ratio = Math.max(...dirs.map((th) => Math.abs(o.f(s * Math.cos(th), s * Math.sin(th)) - s * o.Lx * Math.cos(th)) / s));
          E.dot(s, Math.max(1e-9, ratio), { color: 'orange', r: 5.5 });
          Pn.hline(o.Lx, { color: 'green', width: 1.6, dash: true });
          Pn.fn((a) => o.fx(s * Math.cos(a * DEG), s * Math.sin(a * DEG)), { color: 'accent', width: 2.4, n: 360 });
          const vals = Array.from({ length: 180 }, (_, i) => o.fx(s * Math.cos((i * 2 * Math.PI) / 180), s * Math.sin((i * 2 * Math.PI) / 180)));
          st = { ratio, lo: Math.min(...vals), hi: Math.max(...vals), Lx: o.Lx, k: which.value };
        });
        v.legend([['accent', 'selected function'], ['green', '$f_x(0,0)$', { dash: true }], ['orange', 'current scale $s$']]);
        v.readout(() => `On the circle of radius $s$, $f_x$ ranges over $[${tf(st.lo, 3)},\\,${tf(st.hi, 3)}]$ while $f_x(0,0)=${tn(st.Lx)}$. Worst error$/|\\mathbf h|$ at $|\\mathbf h|=s$: $${st.ratio < 0.01 ? v.sci(st.ratio, 2) : tf(st.ratio, 3)}$.\n${st.k === 'c1' ? '**Partials continuous at $0$ (the band collapses onto $f_x(0,0)$): differentiable, ratio $\\to0$.**' : st.k === 'xy2' ? '**Partials discontinuous at $0$ and $f$ not differentiable** (ratio stays near $0.385$).' : '**Partials discontinuous at $0$, yet $f$ is differentiable** (ratio $\\le s$): the converse of the theorem fails.'}`);
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Chain rule in several variables',
      statement: String.raw`Let $\mathbf c:I\to\R^n$ be differentiable at $t_0$ and let $f$ be differentiable at $\mathbf c(t_0)$. Then $t\mapsto f(\mathbf c(t))$ is differentiable at $t_0$ and
$$\frac{d}{dt}f(\mathbf c(t))\Big|_{t_0}=\nabla f(\mathbf c(t_0))\cdot\mathbf c'(t_0)=\sum_i\frac{\partial f}{\partial x_i}\,\frac{dx_i}{dt}.$$`,
      idea: String.raw`Write $f(\mathbf c(t_0+h))-f(\mathbf c(t_0))=\nabla f\cdot(\mathbf c(t_0+h)-\mathbf c(t_0))+o(|\mathbf c(t_0+h)-\mathbf c(t_0)|)$ by differentiability of $f$, divide by $h$, and use $\mathbf c(t_0+h)-\mathbf c(t_0)=h\,\mathbf c'(t_0)+o(h)$. The linear approximation of $f$ composed with the linear approximation of $\mathbf c$ is the linear approximation of $f\circ\mathbf c$; this is Rudin's 9.15.`,
      caption: String.raw`Slide $t$ to walk along the path over a temperature map (red hot, blue cold). The rate of change you feel is computed twice: by a central finite difference with step $h$ (blue) and by $\nabla T\cdot\mathbf c'$ (orange). They coincide as $h\to0$; make $h$ large and the finite difference smears out.`,
      deps: ['vcalc-2.4', 'pma-9.15'],
      refs: ['Marsden–Tromba §2.5'],
      tags: ['chain rule', 'composition'],
      viz(v) {
        const T = (x, y) => 12 + 14 * hills(x, y) + 3 * x;
        const PATH = {
          circle: { label: 'circle', c: (t) => [0.1 + Math.cos(t), 0.75 * Math.sin(t)], d: (t) => [-Math.sin(t), 0.75 * Math.cos(t)] },
          eight: { label: 'figure eight', c: (t) => [1.05 * Math.sin(t), 0.75 * Math.sin(2 * t)], d: (t) => [1.05 * Math.cos(t), 1.5 * Math.cos(2 * t)] },
          spiral: { label: 'spiral', c: (t) => { const u = t / TAU, r = 1.15 * (1 - 0.75 * u), a = 2.2 * t; return [r * Math.cos(a), 0.9 * r * Math.sin(a)]; }, d: (t) => { const u = t / TAU, r = 1.15 * (1 - 0.75 * u), dr = (-1.15 * 0.75) / TAU, a = 2.2 * t; return [dr * Math.cos(a) - r * 2.2 * Math.sin(a), 0.9 * (dr * Math.sin(a) + r * 2.2 * Math.cos(a))]; } },
        };
        const which = v.select('path', Object.entries(PATH).map(([value, o]) => ({ value, label: o.label })), 'circle');
        const tt = v.slider('time $t$', 0, TAU, 1.0, { step: 0.01 });
        const hh = v.slider('finite-difference step $h$', 0.001, 1, 0.05, { log: true, sig: 2 });
        const Mp = v.stage({ x: [-1.45, 1.45], y: [-1.15, 1.15], equal: true, axes: 'box', gutter: true, height: 360, weight: 1.2, xlabel: 'x', ylabel: 'y', title: 'temperature $T(x,y)$ and the path' });
        const Tp = v.stage({ x: [0, TAU], y: [0, 30], axes: 'box', gutter: true, height: 360, weight: 0.85, minWidth: 230, xlabel: 't', xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], title: 'temperature felt, $T(\\mathbf c(t))$' });
        const Rp = v.stage({ x: [0, TAU], y: [-40, 40], axes: 'box', gutter: true, height: 360, weight: 0.85, minWidth: 230, xlabel: 't', xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], title: 'its rate of change' });
        let st = {};
        v.render(() => {
          const P = PATH[which.value], t = tt.value, h = hh.value;
          const [px, py] = P.c(t), g = grad2(T, px, py), cd = P.d(t), chain = g[0] * cd[0] + g[1] * cd[1];
          const fd = (tau) => (T(...P.c(tau + h)) - T(...P.c(tau - h))) / (2 * h);
          Mp.heat(T, { range: [3, 27], cmap: 'theme-diverging', res: 3, key: 'T' });
          Mp.contour(T, Array.from({ length: 12 }, (_, i) => 4 + 2 * i), { color: 'ink', alpha: 0.25, width: 1 });
          Mp.curve((s) => P.c(s), 0, TAU, { color: 'ink', width: 2, alpha: 0.7, n: 240 });
          Mp.curve((s) => P.c(s), 0, t, { color: 'gold', width: 3.4, n: 120 });
          Mp.arrow(px, py, px + 0.3 * cd[0], py + 0.3 * cd[1], { color: 'gold', width: 2.6 });
          Mp.arrow(px, py, px + 0.04 * g[0], py + 0.04 * g[1], { color: 'ink', width: 2.6 });
          Mp.dot(px, py, { color: 'gold', r: 6 });
          Mp.tex('\\nabla T', px + 0.04 * g[0], py + 0.04 * g[1], { color: 'ink', dx: 12, dy: -8, size: 14 });
          Mp.tex("\\mathbf c'", px + 0.3 * cd[0], py + 0.3 * cd[1], { color: 'gold', dx: 12, dy: 8, size: 14 });
          Tp.fn((s) => T(...P.c(s)), { color: 'muted', width: 2, n: 240 });
          Tp.fn((s) => T(...P.c(s)), { color: 'gold', width: 3.4, domain: [0, t], n: 120 });
          Tp.dot(t, T(px, py), { color: 'gold', r: 6 });
          Tp.line(t - 0.5, T(px, py) - 0.5 * chain, t + 0.5, T(px, py) + 0.5 * chain, { color: 'orange', width: 2 });
          Rp.hline(0, { color: 'faint' });
          Rp.fn(fd, { color: 'accent', width: 3, n: 300 });
          Rp.fn((s) => { const q = P.c(s), gg = grad2(T, q[0], q[1]), dd = P.d(s); return gg[0] * dd[0] + gg[1] * dd[1]; }, { color: 'orange', width: 1.8, n: 300, dash: [6, 4] });
          Rp.vline(t, { color: 'faint', dash: true });
          Rp.dot(t, chain, { color: 'orange', r: 6 });
          st = { g, cd, chain, fd: fd(t), h };
        });
        v.legend([['accent', 'finite difference $\\frac{T(\\mathbf c(t+h))-T(\\mathbf c(t-h))}{2h}$'], ['orange', '$\\nabla T\\cdot\\mathbf c\'$', { dash: true }]]);
        v.readout(() => `$\\nabla T=${tup(st.g, 2)}$, $\\mathbf c'(t)=${tup(st.cd, 2)}$, so $\\nabla T\\cdot\\mathbf c'=${tf(st.g[0] * st.cd[0], 3)}${st.g[1] * st.cd[1] < 0 ? '' : '+'}${tf(st.g[1] * st.cd[1], 3)}=${tf(st.chain, 4)}$ degrees per unit time.\nFinite difference with $h=${st.h < 0.01 ? v.sci(st.h, 2) : tf(st.h, 3)}$: $${tf(st.fd, 4)}$. Difference: $${v.sci(Math.abs(st.fd - st.chain) + 1e-16, 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Gradient and directional derivative',
      statement: String.raw`For $f$ differentiable at $\mathbf a$ and a unit vector $\mathbf u$, the **directional derivative** is $D_{\mathbf u}f(\mathbf a)=\lim_{t\to0}\bigl(f(\mathbf a+t\mathbf u)-f(\mathbf a)\bigr)/t$, and the **gradient** is the vector $\nabla f(\mathbf a)=(\partial_1f,\dots,\partial_nf)(\mathbf a)$. Then $D_{\mathbf u}f(\mathbf a)=\nabla f(\mathbf a)\cdot\mathbf u=|\nabla f(\mathbf a)|\cos\theta$, where $\theta$ is the angle between $\mathbf u$ and $\nabla f$. So $\nabla f$ points in the direction of steepest increase, and $|\nabla f|$ is that steepest rate.`,
      idea: String.raw`Apply the chain rule (2.6) to the line $t\mapsto\mathbf a+t\mathbf u$: its velocity is $\mathbf u$, so the rate is $\nabla f\cdot\mathbf u$. The dot-product formula of chapter 1 then gives $|\nabla f|\cos\theta$, which is largest at $\theta=0$, zero at $90^\circ$, and most negative at $180^\circ$. As $\mathbf u$ turns, the point $D_{\mathbf u}f\cdot\mathbf u$ traces a circle of diameter $|\nabla f|$ through the origin, by Thales' theorem.`,
      caption: String.raw`Drag the point on the contour map and turn the direction $\theta$. Right: the polar plot of $D_{\mathbf u}f$ as a function of $\mathbf u$ is a circle through the origin whose diameter is exactly the gradient (blue arrow); the sign flips when $\mathbf u$ points downhill.`,
      deps: ['vcalc-2.4', 'vcalc-1.2'],
      refs: ['Marsden–Tromba §2.6', 'Schey ch. IV'],
      tags: ['gradient', 'directional derivative'],
      viz(v) {
        const f = hills;
        const th = v.slider('direction $\\theta$', 0, 360, 40, { step: 1, fmt: (x) => `${v.fix(x, 0)}°` });
        const Mp = v.stage({ x: [-1.3, 1.3], y: [-1.15, 1.15], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.15, xlabel: 'x', ylabel: 'y', title: 'contour map' });
        const Pp = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'polar plot of $D_{\\mathbf u}f$' });
        const p = Mp.handle(0.1, -0.05, { color: 'gold', constrain: { x: [-1.25, 1.25], y: [-1.1, 1.1] } });
        let st = {};
        v.render(() => {
          const a = th.value * DEG, u = [Math.cos(a), Math.sin(a)], g = grad2(f, p.x, p.y), gn = Math.hypot(g[0], g[1]), D = g[0] * u[0] + g[1] * u[1];
          Mp.heat(f, { range: [-1, 1], cmap: 'theme-diverging', res: 3, key: 'h' });
          Mp.contour(f, Array.from({ length: 16 }, (_, i) => -0.5 + 0.1 * i), { color: 'ink', alpha: 0.3, width: 1 });
          Mp.contour(f, f(p.x, p.y), { color: 'orange', width: 2.4, res: 160 });
          if (gn > 1e-6) Mp.arrow(p.x, p.y, p.x + (0.4 * g[0]) / gn, p.y + (0.4 * g[1]) / gn, { color: 'accent', width: 3 });
          Mp.arrow(p.x, p.y, p.x + 0.4 * u[0], p.y + 0.4 * u[1], { color: D >= 0 ? 'green' : 'red', width: 3 });
          Mp.line(p.x - 0.6 * u[0], p.y - 0.6 * u[1], p.x + 0.6 * u[0], p.y + 0.6 * u[1], { color: D >= 0 ? 'green' : 'red', width: 1, dash: [4, 4] });
          const R = Math.max(0.05, 1.12 * gn);
          Pp.setView([-R, R], [-R, R]);
          Pp.polarGrid({ rings: [gn / 2, gn], spokes: 12, rmax: R * 1.0, angles: false, labels: false });
          Pp.curve((s) => { const d = g[0] * Math.cos(s) + g[1] * Math.sin(s); return [d * Math.cos(s), d * Math.sin(s)]; }, 0, TAU, { color: 'muted', width: 1.8, n: 200 });
          Pp.arrow(0, 0, g[0], g[1], { color: 'accent', width: 3 });
          Pp.line(D * u[0], D * u[1], g[0], g[1], { color: 'faint', width: 1, dash: [3, 3] });
          Pp.line(0, 0, D * u[0], D * u[1], { color: D >= 0 ? 'green' : 'red', width: 2.6 });
          Pp.dot(D * u[0], D * u[1], { color: D >= 0 ? 'green' : 'red', r: 6 });
          const h = 1e-4;
          st = { g, gn, D, fd: (f(p.x + h * u[0], p.y + h * u[1]) - f(p.x - h * u[0], p.y - h * u[1])) / (2 * h), ang: ((Math.atan2(g[1], g[0]) / DEG + 360) % 360) };
        });
        v.legend([['accent', '$\\nabla f$'], ['green', '$D_{\\mathbf u}f>0$ (uphill)'], ['red', '$D_{\\mathbf u}f<0$ (downhill)']]);
        v.readout(() => `$\\nabla f=${tup(st.g, 3)}$, $|\\nabla f|=${tf(st.gn, 3)}$, pointing at ${tf(st.ang, 0)}°. $\\nabla f\\cdot\\mathbf u=${tf(st.D, 4)}$; direct difference quotient $\\dfrac{f(\\mathbf a+t\\mathbf u)-f(\\mathbf a-t\\mathbf u)}{2t}=${tf(st.fd, 4)}$; $|\\nabla f|\\cos\\theta=${tf(st.gn * Math.cos((th.value - st.ang) * DEG), 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'The gradient is normal to level sets',
      statement: String.raw`Let $f$ be $C^1$ near $\mathbf a$ with $\nabla f(\mathbf a)\neq\mathbf 0$. Then the level set $\{f=f(\mathbf a)\}$ is, near $\mathbf a$, a smooth curve (surface) whose tangent line (plane) at $\mathbf a$ is perpendicular to $\nabla f(\mathbf a)$. Moreover, the distance between neighbouring level curves $f=c$ and $f=c+\Delta$ near $\mathbf a$ is about $\Delta/|\nabla f(\mathbf a)|$.`,
      idea: String.raw`If $\mathbf c(t)$ is any differentiable curve inside the level set, then $f(\mathbf c(t))$ is constant, so by the chain rule $\nabla f\cdot\mathbf c'=0$: every tangent vector to the level set is perpendicular to the gradient. That the level set really is a curve with a tangent line is the implicit function theorem (2.15). Because $D_{\mathbf u}f\le|\nabla f|$, one must move at least $\Delta/|\nabla f|$ to gain $\Delta$, and the gradient direction attains it.`,
      caption: String.raw`Drag the point. Left: contour map with the level through the point (orange). Right: a magnified view. The two points where the circle of radius $\varepsilon$ meets the level curve are found by bisection (no gradient used); the chord between them turns perpendicular to the blue gradient as $\varepsilon\to0$. The spacing slider $\Delta$ draws neighbouring levels $c\pm\Delta$.`,
      deps: ['vcalc-2.7', 'vcalc-2.6'],
      refs: ['Marsden–Tromba §2.6'],
      tags: ['gradient', 'level sets', 'orthogonality'],
      viz(v) {
        const f = hills;
        const eps = v.slider('circle radius $\\varepsilon$', 0.003, 0.35, 0.12, { log: true, sig: 2 });
        const dl = v.slider('level spacing $\\Delta$', 0.02, 0.2, 0.08, { step: 0.01 });
        const Mp = v.stage({ x: [-1.3, 1.3], y: [-1.15, 1.15], equal: true, axes: 'box', gutter: true, height: 400, weight: 1.15, xlabel: 'x', ylabel: 'y', title: 'drag the point' });
        const Z = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 400, weight: 1, minWidth: 260, title: 'magnified' });
        const p = Mp.handle(0.1, -0.1, { color: 'gold', constrain: { x: [-1.25, 1.25], y: [-1.1, 1.1] } });
        let st = {};
        v.render(() => {
          const c0 = f(p.x, p.y), g = grad2(f, p.x, p.y), gn = Math.hypot(g[0], g[1]), e = eps.value, D = dl.value;
          const gh = gn > 1e-9 ? [g[0] / gn, g[1] / gn] : [0, 0];
          const lv = [-3, -2, -1, 1, 2, 3].map((k) => c0 + k * D);
          Mp.heat(f, { range: [-1, 1], cmap: 'theme-diverging', res: 3, key: 'h' });
          Mp.contour(f, lv, { color: 'ink', alpha: 0.35, width: 1 });
          Mp.contour(f, c0, { color: 'orange', width: 2.6, res: 160 });
          Mp.circle(p.x, p.y, e, { color: 'gold', width: 1.2, dash: true });
          if (gn > 1e-6) Mp.arrow(p.x, p.y, p.x + 0.3 * gh[0], p.y + 0.3 * gh[1], { color: 'accent', width: 3 });
          // the two points of the level curve on the circle of radius eps (bisection; no gradient used)
          const G = (a) => f(p.x + e * Math.cos(a), p.y + e * Math.sin(a)) - c0;
          const roots = [];
          const NS = 720;
          for (let i = 0; i < NS; i++) { const a = (TAU * i) / NS, b = (TAU * (i + 1)) / NS; if (G(a) * G(b) < 0) roots.push(bisect(G, a, b)); }
          let q = null, ang = null;
          if (roots.length >= 2 && gn > 1e-4) {
            q = [roots[0], roots[roots.length > 2 ? Math.round(roots.length / 2) : 1]].map((a) => [p.x + e * Math.cos(a), p.y + e * Math.sin(a)]);
            const ch = [q[1][0] - q[0][0], q[1][1] - q[0][1]], cn = Math.hypot(...ch);
            const cos = Math.abs(ch[0] * gh[0] + ch[1] * gh[1]) / cn;
            ang = Math.acos(Math.min(1, cos)) / DEG;
            Mp.line(q[0][0], q[0][1], q[1][0], q[1][1], { color: 'red', width: 2 });
            Mp.dot(q[0][0], q[0][1], { color: 'red', r: 4 }); Mp.dot(q[1][0], q[1][1], { color: 'red', r: 4 });
          }
          // spacing: distance along the gradient direction to the level c0 + Delta
          let dist = null;
          if (gn > 1e-4) {
            const h = (t) => f(p.x + t * gh[0], p.y + t * gh[1]) - c0 - D;
            let t = 0, hi = 0; for (let k = 1; k <= 400; k++) { const tt = k * 0.005; if (h(tt) > 0) { hi = tt; break; } t = tt; }
            if (hi > 0) dist = bisect(h, t, hi);
          }
          Mp.dot(p.x, p.y, { color: 'gold', r: 6 });
          // magnified panel
          const R = Math.max(2.6 * e, gn > 1e-4 ? 1.7 * D / gn : 0, 0.02);
          Z.setView([p.x - R, p.x + R], [p.y - R, p.y + R]);
          Z.contour(f, lv.filter((_, i) => Math.abs([-3, -2, -1, 1, 2, 3][i]) <= 1), { color: 'ink', alpha: 0.45, width: 1.2, res: 200 });
          Z.contour(f, c0, { color: 'orange', width: 3, res: 200 });
          Z.circle(p.x, p.y, e, { color: 'gold', width: 1.2, dash: true });
          if (gn > 1e-6) {
            Z.arrow(p.x, p.y, p.x + 0.8 * R * gh[0], p.y + 0.8 * R * gh[1], { color: 'accent', width: 3 });
            if (dist != null) Z.dot(p.x + dist * gh[0], p.y + dist * gh[1], { color: 'ink', r: 4, hollow: true });
          }
          if (q) { Z.line(q[0][0], q[0][1], q[1][0], q[1][1], { color: 'red', width: 2.2 }); Z.dot(q[0][0], q[0][1], { color: 'red', r: 4.5 }); Z.dot(q[1][0], q[1][1], { color: 'red', r: 4.5 }); }
          Z.dot(p.x, p.y, { color: 'gold', r: 6 });
          st = { gn, ang, dist, D, e };
        });
        v.legend([['orange', 'level curve through the point'], ['accent', '$\\nabla f$'], ['red', 'chord between the two level points on the circle']]);
        v.readout(() => st.gn < 1e-3 ? 'At this point $\\nabla f\\approx\\mathbf 0$ (a critical point): the level set need not be a smooth curve here, and the theorem does not apply.'
          : `Angle between the chord and $\\nabla f$: ${st.ang == null ? 'no chord found' : `$${tf(st.ang, 3)}^\\circ$ (deviation from $90^\\circ$: $${tf(Math.abs(90 - st.ang), 3)}^\\circ$ at $\\varepsilon=${st.e < 0.01 ? v.sci(st.e, 2) : tf(st.e, 3)}$)`}.\nSpacing: the level $c+\\Delta$ is reached after distance $d=${st.dist == null ? '?' : tf(st.dist, 4)}$, so $\\Delta/d=${st.dist == null ? '?' : tf(st.D / st.dist, 4)}$ against $|\\nabla f|=${tf(st.gn, 4)}$.`);
      },
    },
  ],
};
