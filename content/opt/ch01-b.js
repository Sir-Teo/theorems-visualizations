// Optimization — Chapter 1: Optimization problems and optimality (items 1.6–1.10; 1.1–1.5 in ch01.js)
import {
  clamp, gradNum, hessNum, eig2, descend, landScale, drawLand, landscape, EX, fx, fv,
  memo1, analyze, nearest, gridMin, clipHalf,
} from './ch01.shared.js';

export default {
  collection: 'opt',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'Least squares as an optimization problem',
      credit: 'Legendre, 1805; Gauss, 1809 (claimed use from 1795)',
      statement: String.raw`Given a matrix $A\in\R^{m\times n}$ and data $b\in\R^m$, the **least-squares problem** is
$$\text{minimize } f(x)=\norm{Ax-b}_2^2=\sum_{i=1}^m (a_i^{\mathsf T}x-b_i)^2 ,$$
an unconstrained problem with a convex quadratic objective. Its minimizers are exactly the solutions of the **normal equations** $A^{\mathsf T}Ax=A^{\mathsf T}b$, equivalently $\nabla f(x)=2A^{\mathsf T}(Ax-b)=0$: the residual $Ax-b$ is orthogonal to every column of $A$. If $A$ has full column rank the minimizer $x^\star=(A^{\mathsf T}A)^{-1}A^{\mathsf T}b$ is unique. Fitting a line $y\approx a+bx$ to points $(x_i,y_i)$ is the case $x=(a,b)$ with rows $(1,x_i)$.`,
      idea: String.raw`The objective is a quadratic, $f(x)=x^{\mathsf T}A^{\mathsf T}Ax-2b^{\mathsf T}Ax+\norm b^2$, so its gradient is linear and the first-order condition (opt-1.4) is a linear system, the normal equations. The Hessian $2A^{\mathsf T}A$ is positive semidefinite (and definite for full column rank), so by the second-order condition (opt-1.5) the stationary point is a strict minimum, and in fact a global one since the surface is a bowl. Geometrically $Ax^\star$ is the orthogonal projection of $b$ onto the column space of $A$ (nla-2.9).`,
      caption: String.raw`Drag the gold data points, the two blue ends of the line on the left, or the point $(a,b)$ on the right: they are the same object seen in two spaces. Left: the line and the squares of the residuals. Right: the sum of squared residuals $\mathrm{SSR}(a,b)$ as a contour map, a bowl whose bottom (green) is the normal-equations solution; the long diagonal valley is because intercept and slope trade off against each other. Switch the loss to **absolute value** ($\ell^1$): the surface becomes a piecewise-linear bowl with creases, and the minimizer passes through two data points. Press *outlier* to see how much more a squared loss is pulled.`,
      deps: ['opt-1.4', 'nla-2.9'],
      refs: ['Boyd–Vandenberghe §1.2'],
      tags: ['least squares', 'normal equations', 'quadratic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Least_squares' },
      viz(v) {
        const X0 = [1, 2, 3.5, 5, 6.5, 8, 9], Y0 = [1.7, 3.3, 3.4, 5.4, 5.8, 7.9, 8.1];
        const lossS = v.select('loss', [{ value: 'sq', label: 'squares $\\sum r_i^2$' }, { value: 'abs', label: 'absolute $\\sum|r_i|$' }], 'sq');
        const view2 = { x: [-5, 9], y: [-0.6, 2.4] };
        const s = v.stage({ x: [-0.6, 10.6], y: [-1.6, 10], equal: true, axes: 'box', gutter: true, height: 390, xlabel: '$x$', ylabel: '$y$', title: 'data, line and residuals', weight: 1 });
        const s2 = v.stage({ ...view2, axes: 'box', gutter: true, height: 390, xlabel: 'intercept $a$', ylabel: 'slope $b$', title: 'loss surface over (a, b)', weight: 1 });
        const pts = X0.map((x, i) => s.handle(x, Y0[i], { color: 'gold', r: 6.5, constrain: { x: [0, 10], y: [-0.5, 9.8] } }));
        let a = 0.2, b = 0.95;
        const L1 = s.handle(0, a, { color: 'accent', r: 7, constrain: 'y' });
        const L2 = s.handle(10, a + 10 * b, { color: 'accent', r: 7, constrain: 'y' });
        const q = s2.handle(a, b, { color: 'accent', r: 8, label: '(a, b)', labelPos: 'ne' });
        const fromLine = () => { b = (L2.y - L1.y) / (L2.x - L1.x); a = L1.y - b * L1.x; q.set(a, b); };
        L1.onDrag = L2.onDrag = fromLine;
        q.onDrag = () => { a = q.x; b = q.y; L1.set(0, a); L2.set(10, a + 10 * b); };
        v.button('outlier', () => { const h = pts[6]; h.set(h.x, 0.5); });
        v.button('reset data', () => pts.forEach((h, i) => h.set(X0[i], Y0[i])));
        let info = null;
        v.render(() => {
          const xs = pts.map((h) => h.x), ys = pts.map((h) => h.y), n = xs.length, sq = lossS.value === 'sq';
          const loss = (A, B) => { let t = 0; for (let i = 0; i < n; i++) { const r = ys[i] - A - B * xs[i]; t += sq ? r * r : Math.abs(r); } return t; };
          // least-squares solution by the normal equations
          let sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] ** 2; sxy += xs[i] * ys[i]; }
          const den = n * sxx - sx * sx, bLS = den > 1e-12 ? (n * sxy - sx * sy) / den : 0, aLS = (sy - bLS * sx) / n;
          let aO = aLS, bO = bLS;
          if (!sq) { // exact ℓ¹ optimum passes through two data points
            let best = Infinity;
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(xs[j] - xs[i]) > 1e-9) {
              const bb = (ys[j] - ys[i]) / (xs[j] - xs[i]), aa = ys[i] - bb * xs[i], l = loss(aa, bb);
              if (l < best) { best = l; aO = aa; bO = bb; }
            }
          }
          const key = [...xs, ...ys].map((t) => t.toFixed(3)).join(',') + lossS.value;
          drawLand(s2, loss, view2, key, { levels: 12 });
          s2.dot(aO, bO, { r: 7, color: 'green' }); s2.tex('\\text{minimum}', aO, bO, { color: 'green', dx: 8, dy: 18, size: 13, align: 'left' });
          // left panel
          s.line(0, aO, 10, aO + 10 * bO, { color: 'green', width: 1.8, dash: [6, 4] });
          s.line(-1, a - b, 11, a + 11 * b, { color: 'accent', width: 2.6 });
          let ssr = 0;
          for (let i = 0; i < n; i++) {
            const yh = a + b * xs[i], r = ys[i] - yh; ssr += sq ? r * r : Math.abs(r);
            if (sq) { const side = Math.abs(r), x1 = xs[i] + side > 10.4 ? xs[i] - side : xs[i] + side; s.rect(xs[i], Math.min(ys[i], yh), x1, Math.max(ys[i], yh), { fill: 'red', fillAlpha: 0.13, color: 'red', width: 1 }); }
            s.segment([xs[i], ys[i]], [xs[i], yh], { color: 'red', width: 1.6 });
          }
          v.legend([['accent', 'your line'], ['green', 'minimizer of the loss', { dash: true }], ['red', sq ? 'residuals and their squares' : 'residuals']]);
          let g0 = 0, g1 = 0; for (let i = 0; i < n; i++) { const r = ys[i] - a - b * xs[i]; g0 -= 2 * r; g1 -= 2 * r * xs[i]; }
          let sr = 0, sxr = 0; for (let i = 0; i < n; i++) { const r = ys[i] - aO - bO * xs[i]; sr += r; sxr += xs[i] * r; }
          info = { sq, ssr, ssrMin: loss(aO, bO), aO, bO, aLS, bLS, g: Math.hypot(g0, g1), sr, sxr, a, b };
        });
        v.readout(() => {
          if (!info) return '';
          const { sq, ssr, ssrMin, aO, bO, aLS, bLS, g, sr, sxr, a, b } = info;
          let s = String.raw`line $y=${v.fix(a, 2)}+${v.fix(b, 2)}\,x$ has ${sq ? 'SSR' : 'total absolute residual'} $=${v.fix(ssr, 3)}$; the minimum is $${v.fix(ssrMin, 3)}$ at $(a,b)=(${v.fix(aO, 3)},${v.fix(bO, 3)})$`;
          if (sq) s += String.raw` · normal equations $(A^{\mathsf T}A)x=A^{\mathsf T}y$ give $(${v.fix(aLS, 3)},${v.fix(bLS, 3)})$ — the bottom of the bowl ✓ · at the minimum $\sum r_i=${v.sci(Math.abs(sr) + 1e-300, 1)}$ and $\sum x_ir_i=${v.sci(Math.abs(sxr) + 1e-300, 1)}$ (both 0: the residual is orthogonal to the columns $1$ and $x$) · $\norm{\nabla\mathrm{SSR}}$ at your line $=${v.fix(g, 2)}$`;
          else s += String.raw` · for the $\ell^1$ loss the optimum passes through two data points and the surface has creases, so there is no gradient equation there (the least-squares line would be $(${v.fix(aLS, 2)},${v.fix(bLS, 2)})$)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Linear programming',
      credit: 'Kantorovich, 1939; Dantzig, 1947',
      statement: String.raw`A **linear program** minimizes a linear function over a polyhedron:
$$\text{minimize } c^{\mathsf T}x\quad\text{subject to}\quad Ax\le b ,$$
with $c\in\R^n$, $A\in\R^{m\times n}$, $b\in\R^m$ (equality constraints and sign constraints are special cases). The feasible set is a polyhedron, an intersection of half-spaces. Exactly one of three things happens: the LP is **infeasible**, it is **unbounded** ($p^\star=-\infty$), or it has an optimal point. If the polyhedron has a vertex (e.g. it lies in the nonnegative orthant) and the LP has a solution, then some **vertex** is optimal; the optimal set is a vertex, or a whole face (an edge in the plane) when $c$ is orthogonal to it.`,
      idea: String.raw`Level sets $\{c^{\mathsf T}x=t\}$ are parallel hyperplanes, and $c^{\mathsf T}x$ has no stationary point (its gradient $c\ne0$ never vanishes, opt-1.4), so a minimizer cannot be interior to the polyhedron. Sliding the hyperplane in direction $-c$ until it last touches the polyhedron, it touches at a face; if $c$ is not orthogonal to an edge, only at a vertex. Vertex enumeration is exactly what the simplex method organizes (opt-6.3). The feasible set here is a polygon cut from the plane by half-planes, the cheapest instance of the picture.`,
      caption: String.raw`Each blue line is a constraint $g_i(x)\le0$: drag its anchor to move it and drag the tip of its short arrow (the outward normal) to rotate it; *add constraint* cuts the polygon again. Drag the orange tip of $c$ to change the objective. The gold line is the level line $c^{\mathsf T}x=t$ (slider $t$, from the lowest to the highest value on the polygon), and the gold area is the part of the polygon already swept. Choose *minimize* or *maximize* and press *sweep to optimum*: the line last touches the polygon at a **vertex**, or along a whole **edge** when $c$ is perpendicular to it (rotate $c$ to find it). Squeeze the polygon to nothing for an infeasible LP, or push a constraint away so the polygon reaches the window edge: unbounded.`,
      deps: ['opt-1.1'],
      refs: ['Boyd–Vandenberghe §1.2'],
      tags: ['linear programming', 'polyhedron', 'vertex'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_programming' },
      viz(v) {
        const BX = 4.2, BY = 3.2, NMAX = 7;
        const dirS = v.select('objective', [{ value: 'min', label: 'minimize' }, { value: 'max', label: 'maximize' }], 'min');
        const uS = v.slider('level $t$ (from lowest to highest vertex value)', 0, 1, 0.45, { step: 0.005 });
        const s = v.stage({ x: [-4.6, 4.6], y: [-3.5, 3.5], equal: true, axes: 'box', gutter: true, height: 420, xlabel: '$x_1$', ylabel: '$x_2$', title: 'polygon from half-planes and the sweeping level line' });
        const init = [];
        for (let k = 0; k < 5; k++) { const th = Math.PI / 2 + (2 * Math.PI * k) / 5, r = 2.3; init.push([r * Math.cos(th), r * Math.sin(th), th]); }
        init.push([1.5 * Math.cos(0.95), 1.5 * Math.sin(0.95), 0.95], [1.7 * Math.cos(3.5), 1.7 * Math.sin(3.5), 3.5]);
        const AH = [], TH = [];
        for (let i = 0; i < NMAX; i++) {
          const [x, y, th] = init[i];
          AH.push(s.handle(x, y, { color: 'accent', r: 6 }));
          TH.push(s.handle(x + 0.8 * Math.cos(th), y + 0.8 * Math.sin(th), { color: 'accent', r: 4.5 }));
        }
        const cH = s.handle(1.1, 0.75, { color: 'orange', r: 8, label: '$c$', labelPos: 'ne' });
        let nAct = 5;
        v.button('add constraint', () => { if (nAct < NMAX) nAct++; });
        v.button('remove constraint', () => { if (nAct > 0) nAct--; });
        v.button('sweep to optimum', () => uS.set(dirS.value === 'min' ? 0 : 1));
        const rng = v.rng(11);
        const U = Array.from({ length: 5000 }, () => [rng(), rng()]);
        let info = null;
        v.render(() => {
          AH.forEach((h, i) => { h.visible = i < nAct; TH[i].visible = i < nAct; });
          const cx = cH.x, cy = cH.y, cn = Math.hypot(cx, cy) || 1, sg = dirS.value === 'min' ? 1 : -1;
          let poly = [[-BX, -BY], [BX, -BY], [BX, BY], [-BX, BY]];
          const cons = [];
          for (let i = 0; i < nAct; i++) {
            const nx = TH[i].x - AH[i].x, ny = TH[i].y - AH[i].y, nl = Math.hypot(nx, ny) || 1e-9;
            cons.push({ i, nx, ny, nl, c: nx * AH[i].x + ny * AH[i].y });
            poly = clipHalf(poly, nx, ny, nx * AH[i].x + ny * AH[i].y);
          }
          // window box
          s.rect(-BX, -BY, BX, BY, { color: 'faint', fill: false, stroke: true, width: 1 });
          let area = 0; for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length]; area += P[0] * Q[1] - Q[0] * P[1]; } area = Math.abs(area) / 2;
          for (const k of cons) {
            const dx = -k.ny / k.nl, dy = k.nx / k.nl, ax = AH[k.i].x, ay = AH[k.i].y;
            s.line(ax - 30 * dx, ay - 30 * dy, ax + 30 * dx, ay + 30 * dy, { color: 'accent', width: 1.8 });
            s.arrow(ax, ay, TH[k.i].x, TH[k.i].y, { color: 'accent', width: 2 });
            s.tex(`g_${k.i + 1}`, TH[k.i].x, TH[k.i].y, { color: 'accent', dx: 11, dy: -9, size: 13 });
          }
          s.arrow(0, 0, cx, cy, { color: 'orange', width: 2.4 });
          if (area < 1e-6 || poly.length < 3) {
            info = { feasible: false };
            v.legend([['accent', 'constraints $g_i\\le0$'], ['orange', 'objective vector $c$']]);
            s.corner('infeasible: the half-planes have no common point', 'tl', { plate: true, color: 'red' });
            return;
          }
          const vals = poly.map((P) => cx * P[0] + cy * P[1]), vmin = Math.min(...vals), vmax = Math.max(...vals);
          const t = vmin + uS.value * (vmax - vmin), best = sg === 1 ? vmin : vmax;
          s.poly(poly, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2 });
          const sweep = clipHalf(poly, sg * cx, sg * cy, sg * t);
          if (sweep.length >= 3) s.poly(sweep, { fill: 'gold', fillAlpha: 0.42, stroke: false });
          for (let k = -6; k <= 6; k++) { const tt = (k * (vmax - vmin)) / 8 + vmin; s.line(tt * cx / cn ** 2 - 30 * cy / cn, tt * cy / cn ** 2 + 30 * cx / cn, tt * cx / cn ** 2 + 30 * cy / cn, tt * cy / cn ** 2 - 30 * cx / cn, { color: 'ink', alpha: 0.12, width: 1 }); }
          s.line(t * cx / cn ** 2 - 30 * cy / cn, t * cy / cn ** 2 + 30 * cx / cn, t * cx / cn ** 2 + 30 * cy / cn, t * cy / cn ** 2 - 30 * cx / cn, { color: 'gold', width: 2.8 });
          const optIdx = vals.map((q, i) => (Math.abs(q - best) < 1e-7 * Math.max(1, Math.abs(best)) ? i : -1)).filter((i) => i >= 0);
          const opt = optIdx.map((i) => poly[i]);
          for (const P of poly) s.dot(P[0], P[1], { r: 3.5, color: 'ink' });
          if (opt.length >= 2) s.line(opt[0][0], opt[0][1], opt[1][0], opt[1][1], { color: 'green', width: 6 });
          for (const P of opt) s.dot(P[0], P[1], { r: 7, color: 'green' });
          const unb = opt.some((P) => Math.abs(Math.abs(P[0]) - BX) < 1e-6 || Math.abs(Math.abs(P[1]) - BY) < 1e-6);
          // active constraints at the optimal vertex
          const act = opt.length === 1 ? cons.filter((k) => Math.abs(k.nx * opt[0][0] + k.ny * opt[0][1] - k.c) / k.nl < 1e-6).map((k) => 'g' + (k.i + 1)) : [];
          // interior sampling: fan triangulation of the polygon
          const tris = [], ar = []; let tot = 0;
          for (let k = 1; k < poly.length - 1; k++) { const P = poly[0], Q = poly[k], R = poly[k + 1], a2 = Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2; tris.push([P, Q, R]); tot += a2; ar.push(tot); }
          let bestS = Infinity;
          for (const [u1, u2] of U) {
            const w = u1 * tot; let ti = 0; while (ar[ti] < w) ti++;
            const [P, Q, R] = tris[ti], r1 = Math.sqrt(u2), r2 = (w - (ti ? ar[ti - 1] : 0)) / ((ti ? ar[ti] - ar[ti - 1] : ar[0]) || 1);
            const x = (1 - r1) * P[0] + r1 * (1 - r2) * Q[0] + r1 * r2 * R[0], y = (1 - r1) * P[1] + r1 * (1 - r2) * Q[1] + r1 * r2 * R[1];
            const val = sg * (cx * x + cy * y); if (val < bestS) bestS = val;
          }
          v.legend([['accent', 'constraint $g_i\\le0$ and its outward normal'], ['green', 'feasible polygon', { area: true }], ['gold', 'swept part of the polygon', { area: true }], ['orange', 'objective vector $c$'], ['green', 'optimal vertex / edge', { dot: true }]]);
          info = { feasible: true, best, bestS: sg * bestS, nv: poly.length, opt, unb, act, t, sg, vmin, vmax };
        });
        v.readout(() => {
          if (!info) return '';
          if (!info.feasible) return String.raw`The constraints leave no feasible point: the LP is **infeasible** ($p^\star=+\infty$). Drag a constraint back or remove one.`;
          const { best, bestS, nv, opt, unb, act, t, sg } = info;
          const kind = dirS.value === 'min' ? 'minimum' : 'maximum';
          let s = String.raw`polygon with ${nv} vertices · level line $c^{\mathsf T}x=${v.fix(t, 3)}$ · optimal value (${kind}) $=${v.fix(best, 4)}$`;
          if (unb) s += String.raw` — attained only on the window edge: the LP is **unbounded** in this direction (the polygon would continue)`;
          else if (opt.length >= 2) s += String.raw` along a whole **edge** from ${fv(v, opt[0])} to ${fv(v, opt[1])}: $c$ is perpendicular to it`;
          else s += String.raw` at the **vertex** ${fv(v, opt[0], 3)}${act.length ? `, where ${act.join(' and ')} are active` : ''}`;
          s += '\n' + String.raw`brute-force check: the best of 5,000 random interior points has value ${v.fix(bestS, 4)}, never ${sg === 1 ? 'below' : 'above'} the vertex value ${v.fix(best, 4)}${Math.abs(bestS - best) < 0.02 * (info.vmax - info.vmin + 1e-9) ? ' and already very close to it' : ''} ✓`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Phenomenon',
      name: 'Nonconvex landscapes trap local search',
      statement: String.raw`For a nonconvex objective, a descent method started at $x_0$ converges (when it converges at all) to a **local** minimizer determined by the **basin of attraction** of $x_0$: the set of starting points whose descent path ends there. If $f$ has many local minima with different values, the basins of the poor ones typically fill most of the space, so a single run from a random start usually ends at a point that is not globally optimal, and nothing in the local information (a vanishing gradient, a positive definite Hessian) reveals that a better minimum exists elsewhere. Restarting from $k$ independent random points succeeds with probability $1-(1-q)^k$ if a fraction $q$ of starts lands in a global basin; for convex problems $q=1$ (opt-3.11).`,
      idea: String.raw`Local descent only ever uses $\nabla f$ (opt-1.4) near the current point, so it cannot distinguish a global from a local minimizer (opt-1.3): both have $\nabla f=0$ and a positive definite Hessian (opt-1.5). Which one a run finds is decided by the ridge lines (stable manifolds of saddle points) that separate the basins. A typical landscape has far more basins around poor minima than around the global one, and the fractions are not predictable from the local geometry.`,
      caption: String.raw`The shaded map colours each starting point by where gradient descent (with backtracking) ends: **green** where it reaches a global minimizer, **orange** (two tones, to show the basin borders) for the other local minima. Dots are the random starts (green: success, red: trapped). Click anywhere to draw one descent path. The histogram on the right counts the final values of the runs; the leftmost bar is the global value. Try *Rastrigin*, whose 81 local minima make success rare, then the *convex* example, where every run reaches the same minimum. Retype $f$ to try your own function.`,
      deps: ['opt-1.3'],
      refs: ['Boyd–Vandenberghe §1.4'],
      tags: ['local minima', 'basin of attraction', 'nonconvex'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Local_search_(optimization)' },
      viz(v) {
        const PRE = [
          { key: 'rugged', label: 'rugged bowl', src: '0.08*(x^2+y^2)-cos(2*x)*cos(2*y)', view: { x: [-6, 6], y: [-4.5, 4.5] } },
          { key: 'rast', label: 'Rastrigin', src: '20+x^2+y^2-10*(cos(2*pi*x)+cos(2*pi*y))', view: { x: [-4.5, 4.5], y: [-3.4, 3.4] } },
          { key: 'camel', label: 'six-hump camel', src: '(4-2.1*x^2+x^4/3)*x^2+x*y+(-4+4*y^2)*y^2', view: { x: [-3, 3], y: [-2, 2] } },
          { key: 'convex', label: 'convex', src: '0.5*((x-1)^2+3*(y+0.5)^2+x*y)', view: { x: [-4, 4], y: [-3, 3] } },
        ];
        let seed = 1, traj = null;
        const L = landscape(v, PRE, 'rugged', { onChange: (cur) => { s.setView(cur.view.x, cur.view.y); traj = null; } });
        const nS = v.slider('number of random starts', 10, 400, 150, { int: true });
        v.button('resample starts', () => { seed++; });
        const s = v.stage({ x: L.view.x, y: L.view.y, equal: true, axes: 'box', gutter: true, height: 400, xlabel: '$x$', ylabel: '$y$', title: 'basins of attraction of gradient descent', weight: 1.25 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'final value $f(x_{\\mathrm{end}})$', ylabel: 'number of runs', title: 'where the runs end', weight: 0.75, minWidth: 250 });
        s.onClick((x, y) => { traj = descend(L.f, x, y, { keep: true, maxIt: 400 }).path; });
        const mem = memo1();
        const compute = () => {
          const f = L.f, view = L.view, W = view.x[1] - view.x[0], tol = 0.03 * W, cl = [];
          const run = (x, y) => {
            const d = descend(f, x, y, { maxIt: 250 });
            if (!Number.isFinite(d.f) || Math.abs(d.x) > 3 * Math.max(Math.abs(view.x[0]), Math.abs(view.x[1])) || Math.abs(d.y) > 3 * Math.max(Math.abs(view.y[0]), Math.abs(view.y[1]))) return { id: -1, f: NaN };
            let id = cl.findIndex((c) => Math.hypot(c.x - d.x, c.y - d.y) < tol);
            if (id < 0) { cl.push({ x: d.x, y: d.y, f: d.f }); id = cl.length - 1; } else if (d.f < cl[id].f) { cl[id].x = d.x; cl[id].y = d.y; cl[id].f = d.f; }
            return { id, f: d.f };
          };
          const GX = 44, GY = 32, grid = new Int16Array(GX * GY);
          for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) grid[j * GX + i] = run(view.x[0] + ((i + 0.5) / GX) * W, view.y[0] + ((j + 0.5) / GY) * (view.y[1] - view.y[0])).id;
          const r = v.rng(1000 + seed), starts = [];
          for (let k = 0; k < 400; k++) { const x = r.uniform(view.x[0], view.x[1]), y = r.uniform(view.y[0], view.y[1]); starts.push({ x, y, ...run(x, y) }); }
          const fmin = Math.min(...cl.map((c) => c.f)), sc = landScale(f, view.x, view.y), gtol = 1e-4 + 2e-3 * sc.scale;
          cl.forEach((c) => { c.glob = c.f <= fmin + gtol; });
          return { cl, grid, GX, GY, starts, fmin, view };
        };
        let info = null;
        v.render(() => {
          const f = L.f, view = L.view, C = mem(L.key + '|' + seed, compute), N = nS.value;
          const sc = landScale(f, view.x, view.y), W = view.x[1] - view.x[0], Hh = view.y[1] - view.y[0];
          const g = v.rgb('green').slice(0, 3), o = v.rgb('orange').slice(0, 3);
          s.raster((x, y) => {
            const i = Math.min(C.GX - 1, Math.max(0, Math.floor(((x - view.x[0]) / W) * C.GX))), j = Math.min(C.GY - 1, Math.max(0, Math.floor(((y - view.y[0]) / Hh) * C.GY))), id = C.grid[j * C.GX + i];
            if (id < 0) return null;
            return C.cl[id].glob ? [...g, 120] : [...o, id % 2 ? 50 : 100];
          }, { res: 3, key: 'B|' + L.key + '|' + seed });
          const lv = []; for (let k = 1; k <= 14; k++) lv.push(sc.level(k, 14));
          s.clip(() => s.contour(f, lv, { color: 'ink', alpha: 0.3, width: 1, res: 110 }), view.x, view.y);
          for (const c of C.cl) s.dot(c.x, c.y, { r: c.glob ? 6 : 3.5, color: c.glob ? 'green' : 'red', hollow: true, width: 2 });
          let ok = 0, tot = 0; const vals = [], gv = [];
          for (let k = 0; k < N; k++) {
            const st = C.starts[k]; if (st.id < 0) continue; tot++;
            const gl = C.cl[st.id].glob; if (gl) ok++;
            s.dot(st.x, st.y, { r: 2.6, color: gl ? 'green' : 'red' });
            vals.push(st.f); if (gl) gv.push(st.f);
          }
          if (traj) { s.path(traj, { color: 'gold', width: 2.4 }); s.dot(traj[0][0], traj[0][1], { r: 4.5, color: 'gold' }); }
          // histogram of final values
          const hi = vals.length ? Math.max(...vals) : C.fmin + 1, lo = C.fmin - 0.02 * (hi - C.fmin + 1e-9), nb = 20;
          const rng = [lo, hi + 1e-9 + 0.02 * (hi - lo)], H1 = v.M.histogram(vals, { bins: nb, range: rng }), H2 = v.M.histogram(gv, { bins: nb, range: rng });
          s2.setView(rng, [0, Math.max(1, ...H1.counts) * 1.18]);
          s2.hist({ edges: H1.edges, counts: H1.counts }, { color: 'orange', fillAlpha: 0.4, outline: true });
          s2.hist({ edges: H2.edges, counts: H2.counts }, { color: 'green', fillAlpha: 0.55, outline: true });
          s2.vline(C.fmin, { color: 'green', width: 1.5, dash: [4, 3] });
          v.legend([['green', 'global basin / successful run', { area: true }], ['orange', 'other basins / trapped run', { area: true }], ['gold', 'your clicked path']]);
          const nglob = C.cl.filter((c) => c.glob).length, area = C.grid.reduce((a, id) => a + (id >= 0 && C.cl[id].glob ? 1 : 0), 0) / C.grid.length;
          info = { ok, tot, K: C.cl.length, nglob, fmin: C.fmin, q: tot ? ok / tot : 0, area };
        });
        v.readout(() => {
          if (!info) return '';
          const { ok, tot, K, nglob, fmin, q, area } = info, bk = (k) => v.fix(100 * (1 - (1 - q) ** k), 0);
          return String.raw`**${K}** distinct local minima found (best value $${v.fix(fmin, 3)}$, reached from ${nglob} ${nglob === 1 ? 'basin' : 'basins'}) · of ${tot} runs **${ok}** (${v.fix(100 * q, 0)}%) reached the global value; the global basin covers ${v.fix(100 * area, 0)}% of the window` +
            '\n' + String.raw`a single run therefore ends in a non-global minimum ${v.fix(100 * (1 - q), 0)}% of the time; restarting $k$ times succeeds with probability $1-(1-q)^k$: $k=5$ → ${bk(5)}%, $k=20$ → ${bk(20)}%, $k=100$ → ${bk(100)}%` +
            (K === 1 ? ' · only one minimum: this landscape cannot trap a descent method (compare opt-3.11)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Lagrange multipliers for equality constraints',
      credit: 'Lagrange, 1788 (Mécanique analytique)',
      statement: String.raw`Let $f,h_1,\dots,h_p:\R^n\to\R$ be continuously differentiable and let $x^\star$ be a local minimizer of $f$ subject to $h_1(x)=\dots=h_p(x)=0$. If the gradients $\nabla h_1(x^\star),\dots,\nabla h_p(x^\star)$ are linearly independent (a **constraint qualification**), then there are numbers $\lambda_1^\star,\dots,\lambda_p^\star$, the **Lagrange multipliers**, with
$$\nabla f(x^\star)=\sum_{j=1}^p\lambda_j^\star\nabla h_j(x^\star),\qquad\text{i.e.}\qquad\nabla_x\mathcal L(x^\star,\lambda^\star)=0\ \text{ for }\ \mathcal L(x,\lambda)=f(x)-\sum_j\lambda_jh_j(x).$$
For one constraint: at a constrained extremum the level curve of $f$ is tangent to the constraint curve, so $\nabla f$ and $\nabla h$ are parallel, and $\lambda=\nabla f\cdot\nabla h/\norm{\nabla h}^2$. The condition is necessary only: constrained maximizers and saddles satisfy it too, and it can fail where the constraint gradients are dependent.`,
      idea: String.raw`With independent gradients, the implicit function theorem (vcalc-2.14) shows that near $x^\star$ the constraint set is a smooth manifold whose tangent space is $\{d:\nabla h_j(x^\star)^{\mathsf T}d=0\ \forall j\}$. Along any smooth curve in the manifold through $x^\star$, $f$ has a minimum at $x^\star$, so its derivative there, $\nabla f(x^\star)^{\mathsf T}d$, vanishes (opt-1.4 in one variable). Hence $\nabla f(x^\star)$ is orthogonal to the whole tangent space, and the orthogonal complement of $\ker Dh$ is the span of the $\nabla h_j$: that span is where $\nabla f$ must lie.`,
      caption: String.raw`Choose a constraint curve and retype the objective. Drag the gold point along the curve (it snaps to the constrained stationary points). Blue is $\nabla f$, split into its component normal to the curve (orange, the multiplier times $\nabla h$) and its component along the curve (green). The gold curve is the level set of $f$ through the point. At a constrained stationary point the green component vanishes, the level set is tangent to the curve, and $\nabla f=\lambda\nabla h$. The right panel is $f$ along the curve: its stationary points (green minima, red maxima) are exactly the places the multiplier rule finds.`,
      deps: ['opt-1.4', 'vcalc-2.14'],
      refs: ['Nocedal–Wright ch. 12'],
      tags: ['Lagrange multiplier', 'equality constraint', 'tangency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lagrange_multiplier' },
      viz(v) {
        const view = { x: [-3.6, 3.6], y: [-2.8, 2.8] };
        const TAU = 2 * Math.PI, a2 = Math.sqrt(2.5);
        const CURVES = {
          circle: { label: 'circle', h: (x, y) => x * x + y * y - 2.25, g: (t) => [1.5 * Math.cos(t), 1.5 * Math.sin(t)], t0: 0, t1: TAU, closed: true },
          ellipse: { label: 'ellipse', h: (x, y) => x * x / 4 + y * y / 1.21 - 1, g: (t) => [2 * Math.cos(t), 1.1 * Math.sin(t)], t0: 0, t1: TAU, closed: true },
          lemn: { label: 'figure eight', h: (x, y) => (x * x + y * y) ** 2 - 2.5 * (x * x - y * y), g: (t) => [(a2 * Math.cos(t)) / (1 + Math.sin(t) ** 2), (a2 * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2)], t0: 0, t1: TAU, closed: true },
          line: { label: 'line', h: (x, y) => x + y - 0.5, g: (t) => [t, 0.5 - t], t0: -2.3, t1: 3.3, closed: false },
          parab: { label: 'parabola', h: (x, y) => y - x * x + 1, g: (t) => [t, t * t - 1], t0: -1.95, t1: 1.95, closed: false },
        };
        const curS = v.select('constraint $h(x,y)=0$', Object.entries(CURVES).map(([k, c]) => ({ value: k, label: c.label })), 'circle');
        const PRE = [
          { key: 'dist', label: 'distance to a point', src: '(x-2.2)^2+(y-1)^2', view },
          { key: 'prod', label: '$xy$', src: 'x*y', view },
          { key: 'lin', label: 'linear', src: 'x+0.5*y', view },
          { ...EX.bowl, view },
          { ...EX.egg, view },
        ];
        const an = memo1(), cm = memo1();
        const L = landscape(v, PRE, 'dist', { width: 280 });
        const s = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 410, xlabel: '$x$', ylabel: '$y$', title: 'objective, constraint curve and gradients', weight: 1.15 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 410, xlabel: 'position $t$ along the curve', ylabel: '$f$ on the curve', title: 'f restricted to the constraint', weight: 0.85, minWidth: 250 });
        const proj = (C, x, y) => {
          for (let i = 0; i < 14; i++) { const hh = C.h(x, y), g = gradNum(C.h, x, y), gg = g[0] * g[0] + g[1] * g[1]; if (gg < 1e-12) break; x -= (hh * g[0]) / gg; y -= (hh * g[1]) / gg; }
          return [x, y];
        };
        const crits = () => cm(L.key + '|' + curS.value, () => {
          const C = CURVES[curS.value], f = L.f, N = 1600, dt = (C.t1 - C.t0) / N, ph = (t) => { const [x, y] = C.g(t); return f(x, y); };
          const D = (t) => (ph(t + 1e-5) - ph(t - 1e-5)), out = [];
          const m = C.closed ? N : N - 1;
          for (let i = 0; i < m; i++) {
            const t = C.t0 + i * dt + (C.closed ? 0 : dt * 0.5);
            let ta = t, tb = t + dt; const da = D(ta), db = D(tb);
            if (!(Number.isFinite(da) && Number.isFinite(db)) || da * db > 0 || (da === 0 && db === 0)) continue;
            for (let k = 0; k < 50; k++) { const tm = (ta + tb) / 2; if (D(ta) * D(tm) <= 0) tb = tm; else ta = tm; }
            const tc = (ta + tb) / 2, [x, y] = C.g(tc), e = 1e-3 * (C.t1 - C.t0), type = ph(tc - e) > ph(tc) && ph(tc + e) > ph(tc) ? 'min' : ph(tc - e) < ph(tc) && ph(tc + e) < ph(tc) ? 'max' : 'flat';
            const gf = gradNum(f, x, y), gh = gradNum(C.h, x, y), lam = (gf[0] * gh[0] + gf[1] * gh[1]) / (gh[0] ** 2 + gh[1] ** 2 || 1);
            if (type !== 'flat' && !out.some((o) => Math.hypot(o.x - x, o.y - y) < 1e-3)) out.push({ t: tc, x, y, f: f(x, y), type, lam });
          }
          const samples = []; for (let i = 0; i <= 600; i++) { const t = C.t0 + ((C.t1 - C.t0) * i) / 600, [x, y] = C.g(t); samples.push([t, f(x, y), x, y]); }
          return { out, samples };
        });
        const p = s.handle(1.1, 1.0, {
          color: 'gold', r: 8, label: '$p$', labelPos: 'ne',
          constrain: (x, y) => {
            const C = CURVES[curS.value], [px, py] = proj(C, x, y), W = view.x[1] - view.x[0];
            const q = nearest(crits().out, px, py);
            return q && Math.hypot(q.x - px, q.y - py) < 0.025 * W ? [q.x, q.y] : [px, py];
          },
        });
        let info = null;
        v.render(() => {
          const C = CURVES[curS.value], f = L.f, W = view.x[1] - view.x[0], A = an(L.key, () => analyze(f, view));
          // keep the point on the curve after a change of curve
          const [px0, py0] = proj(C, p.x, p.y); if (Math.hypot(px0 - p.x, py0 - p.y) > 1e-9) p.set(px0, py0);
          drawLand(s, f, view, L.key + '|L');
          const R = crits(), x = p.x, y = p.y, fp = f(x, y);
          s.contour(f, [fp], { color: 'gold', width: 2.6, res: 200 });
          s.curve(C.g, C.t0, C.t1, { color: 'ink', width: 3.2, n: 500 });
          for (const c of R.out) { s.dot(c.x, c.y, { r: 5.5, color: c.type === 'min' ? 'green' : 'red', hollow: true, width: 2.4 }); }
          const gf = gradNum(f, x, y), gh = gradNum(C.h, x, y), nh = Math.hypot(gh[0], gh[1]) || 1e-12, nx = gh[0] / nh, ny = gh[1] / nh;
          const gn = Math.hypot(gf[0], gf[1]), lam = (gf[0] * gh[0] + gf[1] * gh[1]) / (nh * nh);
          const along = gf[0] * -ny + gf[1] * nx, normal = gf[0] * nx + gf[1] * ny;
          const Lf = 0.22 * W * Math.tanh(gn / (1.5 * A.gs)), k = gn > 1e-12 ? Lf / gn : 0;
          s.arrow(x, y, x + 0.2 * W * nx, y + 0.2 * W * ny, { color: 'orange', width: 1.6, alpha: 0.55 });
          s.arrow(x, y, x + k * normal * nx, y + k * normal * ny, { color: 'orange', width: 3.2 });
          s.arrow(x, y, x + k * along * -ny, y + k * along * nx, { color: 'green', width: 3.2 });
          s.arrow(x, y, x + k * gf[0], y + k * gf[1], { color: 'accent', width: 2.2 });
          s.dot(x, y, { r: 3, color: 'ink' });
          // right panel
          const S = R.samples, ys = S.map((q) => q[1]).filter(Number.isFinite), lo = Math.min(...ys), hi = Math.max(...ys), pd = 0.1 * (hi - lo || 1);
          s2.setView([C.t0, C.t1], [lo - pd, hi + pd]);
          s2.path(S.map((q) => [q[0], q[1]]), { color: 'accent', width: 2.8 });
          for (const c of R.out) s2.dot(c.t, c.f, { r: 5.5, color: c.type === 'min' ? 'green' : 'red' });
          let bi = 0, bd = Infinity; S.forEach((q, i) => { const d = Math.hypot(q[2] - x, q[3] - y); if (d < bd) { bd = d; bi = i; } });
          s2.dot(S[bi][0], fp, { r: 7, color: 'gold' });
          v.legend([['accent', '$\\nabla f$'], ['orange', 'component normal to the curve ($=\\lambda\\nabla h$)'], ['green', 'component along the curve'], ['gold', 'level set of $f$ through $p$'], ['green', 'constrained minimum', { dot: true }], ['red', 'constrained maximum', { dot: true }]]);
          info = { lam, along, normal, gn, fp, R, fminS: lo, atCrit: Math.abs(along) < 1e-6 * Math.max(1, gn) };
        });
        v.readout(() => {
          if (!info) return '';
          const { lam, along, gn, fp, R, fminS, atCrit } = info;
          let s = String.raw`at $p$: $\norm{\nabla f}=${v.fix(gn, 3)}$, component of $\nabla f$ along the curve $=${v.fix(along, 4)}$, multiplier $\lambda=\nabla f\cdot\nabla h/\norm{\nabla h}^2=${v.fix(lam, 3)}$, $f(p)=${v.fix(fp, 3)}$`;
          s += atCrit ? String.raw` → **$\nabla f=\lambda\nabla h$ holds**: $p$ is a constrained stationary point` : String.raw` → $\nabla f\not\parallel\nabla h$, so $p$ is not a constrained optimum: sliding along the curve changes $f$`;
          const list = R.out.map((c) => `${c.type === 'min' ? 'min' : 'max'} ${v.fix(c.f, 3)} ($\\lambda=${v.fix(c.lam, 2)}$)`).join(', ');
          s += '\n' + String.raw`stationary points of $f$ on the curve found by scanning: ${R.out.length ? list : 'none (an open curve, whose extremes are its end points)'} · smallest sampled value of $f$ on the curve ${v.fix(fminS, 3)}${R.out.filter((c) => c.type === 'min').length ? ` vs smallest multiplier solution ${v.fix(Math.min(...R.out.filter((c) => c.type === 'min').map((c) => c.f)), 3)}` : ''}`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Ill-conditioned Hessians and narrow valleys',
      credit: 'Rosenbrock, 1960 (the banana function)',
      statement: String.raw`At a nondegenerate minimizer $x^\star$ the Hessian $H=\nabla^2f(x^\star)$ is positive definite with eigenvalues $\lambda_{\min}\le\dots\le\lambda_{\max}$, and its **condition number** is $\kappa=\lambda_{\max}/\lambda_{\min}$. Near $x^\star$ the sublevel sets are approximately ellipsoids $\{\tfrac12 d^{\mathsf T}Hd\le\varepsilon\}$ with semi-axes $\sqrt{2\varepsilon/\lambda_i}$, so their longest-to-shortest axis ratio is $\sqrt\kappa$: for large $\kappa$ the minimizer lies at the bottom of a long, narrow valley. The gradient $-\nabla f$ then points almost across the valley instead of along it, and the angle between $-\nabla f$ and the direction to the minimizer tends to $90^\circ$ as $\kappa\to\infty$. Rosenbrock's function $(1-x)^2+100(y-x^2)^2$ has a curved valley with $\kappa\approx2.5\times10^3$ at its minimizer $(1,1)$.`,
      idea: String.raw`In the eigenbasis of $H$ the quadratic model separates into independent parabolas $\tfrac12\lambda_i t_i^2$ (opt-1.5), one per eigen-direction: curvature $\lambda_{\max}$ across the valley, $\lambda_{\min}$ along it. Sublevel sets are as wide as $1/\sqrt{\lambda_i}$, hence the aspect ratio $\sqrt\kappa$. The gradient is $H(x-x^\star)=\sum\lambda_i t_i e_i$: the stiff component is amplified by $\lambda_{\max}$ and the flat one only by $\lambda_{\min}$, so for a point in the valley $-\nabla f$ is dominated by the cross-valley direction and aims past the minimizer. This is why conditioning controls the speed of every first-order method (opt-7.5).`,
      caption: String.raw`**Quadratic:** slide the condition number $\kappa$ from 1 to $10^4$ and rotate the valley. The level sets stretch into ever thinner ellipses (at $\kappa=10^4$ they are a hundred times longer than wide). Drag the gold point: the green arrow is $-\nabla f$, the dashed arrow points straight at the minimizer (Newton's direction), and their angle opens toward $90^\circ$. Turn on *steepest descent* to see exact-line-search iterates zigzag across the valley. **Rosenbrock:** the valley bends, and the Hessian eigenvalue ratio at $(1,1)$ is read out. Right: $f$ along the Hessian eigen-directions through the minimizer: one very steep parabola, one very flat.`,
      deps: ['opt-1.5', 'nla-3.2'],
      refs: ['Nocedal–Wright ch. 2'],
      tags: ['condition number', 'Hessian', 'valley'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rosenbrock_function' },
      viz(v) {
        const modeS = v.select('function', [{ value: 'quad', label: 'quadratic with condition number $\\kappa$' }, { value: 'rosen', label: 'Rosenbrock' }], 'quad', { onChange: () => sync() });
        const kS = v.slider('condition number $\\kappa$', 1, 1e4, 100, { log: true, sig: 3 });
        const tS = v.slider('valley angle (degrees)', 0, 180, 35, { step: 1 });
        const gdT = v.toggle('steepest descent iterates (exact line search, preview of opt-7.6)', true);
        const VQ = { x: [-3.2, 3.2], y: [-2.4, 2.4] }, VR = { x: [-2, 2], y: [-1, 3] };
        const s = v.stage({ ...VQ, equal: true, axes: 'box', gutter: true, height: 410, xlabel: '$x$', ylabel: '$y$', title: 'level sets near the minimizer', weight: 1.15 });
        const s2 = v.stage({ x: [-1, 1], y: [0, 2], axes: 'box', gutter: true, height: 410, xlabel: 'distance $t$ from the minimizer', ylabel: '$f(x^\\star+t\\,e_i)-f^\\star$', title: 'stiff and flat directions', weight: 0.85, minWidth: 250 });
        const sync = () => { const q = modeS.value === 'quad'; kS.el.hidden = !q; tS.el.hidden = !q; s.setView(...(q ? [VQ.x, VQ.y] : [VR.x, VR.y])); p.set(...(q ? [1.4, 0.9] : [-1.0, 1.4])); };
        const p = s.handle(1.4, 0.9, {
          color: 'gold', r: 8, label: '$p$', labelPos: 'ne',
          constrain: (x, y) => { const V = modeS.value === 'quad' ? VQ : VR; return [clamp(x, V.x[0], V.x[1]), clamp(y, V.y[0], V.y[1])]; },
        });
        const mem = memo1();
        v.render(() => {
          const quad = modeS.value === 'quad', view = quad ? VQ : VR, kap = kS.value, th = (tS.value * Math.PI) / 180;
          const c = Math.cos(th), sn = Math.sin(th);
          const Hq = [[c * c + kap * sn * sn, (1 - kap) * c * sn], [(1 - kap) * c * sn, sn * sn + kap * c * c]]; // λ_min = 1 along angle θ, λ_max = κ across
          const f = quad ? (x, y) => 0.5 * (x * (Hq[0][0] * x + Hq[0][1] * y) + y * (Hq[1][0] * x + Hq[1][1] * y)) : (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2;
          const xs = quad ? [0, 0] : [1, 1], key = quad ? `q|${kap.toFixed(2)}|${tS.value}` : 'r';
          // colour scale and levels: quadratic levels chosen so the longest axis fills the window
          let sc;
          if (quad) {
            s.heat((x, y) => 1 - Math.exp(-f(x, y) / 1.6), { range: [0, 1], cmap: 'theme', color: 'accent', res: 3, key: 'H|' + key, rect: [view.x[0], view.y[0], view.x[1], view.y[1]] });
            const lv = [0.05, 0.2, 0.45, 0.8, 1.25, 1.8, 2.45, 3.2, 4.05]; s.clip(() => s.contour(f, lv, { color: 'ink', alpha: 0.5, width: 1.2, res: 200 }), view.x, view.y);
          } else { sc = drawLand(s, f, view, key, { levels: 16 }); }
          const E = eig2(quad ? Hq : hessNum(f, 1, 1, 1e-3)), lmin = E.l1, lmax = E.l2;
          // eigen-axes at the minimizer
          for (const [vec, col] of [[E.v1, 'green'], [E.v2, 'red']]) s.line(xs[0] - 5 * vec[0], xs[1] - 5 * vec[1], xs[0] + 5 * vec[0], xs[1] + 5 * vec[1], { color: col, width: 1.2, alpha: 0.55, dash: [5, 4] });
          s.dot(xs[0], xs[1], { r: 6, color: 'green' }); s.tex('x^\\star', xs[0], xs[1], { color: 'green', dx: 14, dy: 14, size: 15 });
          // gradient vs Newton direction at p
          const x = p.x, y = p.y, g = gradNum(f, x, y), gn = Math.hypot(g[0], g[1]);
          const H = quad ? Hq : hessNum(f, x, y, 1e-3), det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
          const W = view.x[1] - view.x[0], Ln = 0.18 * W;
          let angle = NaN;
          if (gn > 1e-9) {
            s.arrow(x, y, x - (Ln * g[0]) / gn, y - (Ln * g[1]) / gn, { color: 'green', width: 3 });
            const tx = xs[0] - x, ty = xs[1] - y, tl = Math.hypot(tx, ty);
            if (tl > 1e-9) {
              s.arrow(x, y, x + (Ln * tx) / tl, y + (Ln * ty) / tl, { color: 'ink', width: 2, dash: [5, 4] });
              angle = (Math.acos(clamp((-g[0] * tx - g[1] * ty) / (gn * tl), -1, 1)) * 180) / Math.PI;
            }
          }
          let iters = null;
          if (gdT.value) {
            const path = [[x, y]]; let cx = x, cy = y, steps = 0, f0 = f(x, y), reach = null;
            const Hs = quad ? Hq : null;
            for (let k = 0; k < (quad ? 20000 : 60); k++) {
              const gg = gradNum(f, cx, cy, 1e-6), g2 = gg[0] * gg[0] + gg[1] * gg[1]; if (g2 < 1e-24) break;
              let tt;
              if (quad) tt = g2 / (gg[0] * (Hs[0][0] * gg[0] + Hs[0][1] * gg[1]) + gg[1] * (Hs[1][0] * gg[0] + Hs[1][1] * gg[1]));
              else { let a = 0, b = 0.05; for (let q = 0; q < 40; q++) { const m1 = (2 * a + b) / 3, m2 = (a + 2 * b) / 3; if (f(cx - m1 * gg[0], cy - m1 * gg[1]) < f(cx - m2 * gg[0], cy - m2 * gg[1])) b = m2; else a = m1; } tt = (a + b) / 2; }
              cx -= tt * gg[0]; cy -= tt * gg[1]; steps++; if (path.length < 40) path.push([cx, cy]);
              if (reach === null && f(cx, cy) < 1e-6 * f0) reach = steps;
              if (quad && reach !== null) break;
            }
            s.path(path, { color: 'gold', width: 2 }); s.dots(path.slice(1), { r: 2.5, color: 'gold' });
            iters = quad ? reach : null;
          }
          // right panel: slices through the minimizer along the Hessian eigenvectors
          const T = 1, level = 1.5; s2.setView([-T, T], [0, 2.2]);
          s2.hline(level, { color: 'faint', width: 1, dash: [4, 4] });
          const sl = (vec) => (t) => f(xs[0] + t * vec[0], xs[1] + t * vec[1]) - f(xs[0], xs[1]);
          s2.fn(sl(E.v2), { domain: [-T, T], color: 'red', width: 2.8, n: 400 });
          s2.fn(sl(E.v1), { domain: [-T, T], color: 'green', width: 2.8, n: 400 });
          const wmax = Math.sqrt((2 * level) / lmax), wmin = Math.sqrt((2 * level) / lmin);
          s2.interval(-Math.min(wmax, T), Math.min(wmax, T), 0.06, { color: 'red' }); s2.interval(-Math.min(wmin, T), Math.min(wmin, T), 0.16, { color: 'green' });
          v.legend([['green', 'flat direction $e_{\\min}$, curvature $\\lambda_{\\min}$'], ['red', 'stiff direction $e_{\\max}$, curvature $\\lambda_{\\max}$'], ['green', '$-\\nabla f$ at $p$'], ['ink', 'direction to the minimizer', { dash: true }], ['gold', 'steepest-descent iterates']]);
          info = { quad, kap: lmax / lmin, lmin, lmax, angle, iters, det, kappaEff: (() => { const e = eig2(H); return e.l1 > 0 ? e.l2 / e.l1 : NaN; })(), gn };
        });
        v.readout(() => {
          if (!info) return '';
          const { quad, kap, lmin, lmax, angle, iters, kappaEff } = info;
          let s = String.raw`Hessian at the minimizer: $\lambda_{\min}=${v.fix(lmin, 3)}$, $\lambda_{\max}=${v.fix(lmax, 2)}$, condition number $\kappa=${v.fix(kap, kap < 100 ? 2 : 0)}$ → level sets are ellipses with axis ratio $\sqrt\kappa=${v.fix(Math.sqrt(kap), 1)}$`;
          if (Number.isFinite(angle)) s += String.raw` · at $p$ the angle between $-\nabla f$ and the direction to $x^\star$ is $${v.fix(angle, 1)}^\circ$`;
          if (!quad) s += String.raw` · the local ratio $\lambda_{\max}/\lambda_{\min}$ at $p$ is ${Number.isFinite(kappaEff) ? v.fix(kappaEff, 0) : 'undefined (the Hessian at $p$ is not positive definite)'}`;
          if (quad && iters !== null) s += '\n' + String.raw`steepest descent with exact line search needs **${iters}** steps to cut $f$ by a factor $10^6$ from $p$; its guaranteed contraction of $f-f^\star$ per step is $\big(\tfrac{\kappa-1}{\kappa+1}\big)^2=${v.fix(((kap - 1) / (kap + 1)) ** 2, 4)}$ (a worst case that is attained for starts on the unlucky diagonal)`;
          return s;
        });
        sync();
      },
    },
  ],
};
