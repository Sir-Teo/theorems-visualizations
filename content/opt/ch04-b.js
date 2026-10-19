// Optimization — Chapter 4: Convex optimization problems (items 4.8–4.14; 4.1–4.7 in ch04.js)
import {
  clamp, mulberry, chordTest, chordTest2, levelsOf, memo, rgbA, lp2, solveSmall, f3, linspace, discPoly,
} from './ch04.shared.js';

export default {
  collection: 'opt',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Markowitz portfolio optimization',
      statement: String.raw`A portfolio is a vector of weights $w\in\R^n$ with $\mathbf 1^{\mathsf T}w=1$, with expected return $\mu^{\mathsf T}w$ and variance $w^{\mathsf T}\Sigma w$ ($\Sigma\succeq0$ the covariance matrix of the asset returns). **Mean–variance optimization** minimizes risk for a required return $r$:
$$\min_w\ w^{\mathsf T}\Sigma w\quad\text{s.t.}\quad\mu^{\mathsf T}w=r,\ \ \mathbf 1^{\mathsf T}w=1\ \ (\text{and optionally }w\succeq0\text{ for no short sales}),$$
a convex quadratic program (opt-4.7). The pairs (standard deviation, return) of the optimal portfolios, traced out as $r$ varies, form the **efficient frontier**: a hyperbola branch in the $(\sigma,\mu)$-plane when shorting is allowed, and a curve bent by the constraints $w\succeq0$ when it is not. Every attainable portfolio lies on or to the right of the frontier.`,
      idea: String.raw`For fixed $r$ the problem is a strictly convex QP (when $\Sigma\succ0$), so its minimizer is unique and, for equality constraints only, is the solution of one linear (KKT) system. As $r$ varies, the minimal variance is a convex quadratic function of $r$, which is why $(\sigma,\mu)$ traces a hyperbola. Adding $w\succeq0$ shrinks the feasible set to a simplex, so the variance can only rise and the frontier moves to the right, bending where assets drop out of the portfolio (active constraints $w_i=0$). The model is Markowitz's: risk is variance, and return and covariance are taken as known.`,
      caption: String.raw`Three assets with model volatilities $8\%,15\%,25\%$; drag the return sliders and the common correlation $\rho$. Grey dots are 1500 random fully-invested long-only portfolios: they all lie to the right of the computed frontier. The **blue** curve is the frontier with short sales allowed, the **orange** curve the long-only frontier; the toggle selects which one the gold portfolio follows when you move the target return. The right panel shows its weights (negative = short). The numbers are made-up model inputs, not market data.`,
      scope: String.raw`Model inputs ($\mu$, $\sigma$, $\rho$) are invented for illustration. Mean–variance efficiency assumes known moments, a single period and variance as the measure of risk.`,
      credit: 'Markowitz, 1952 (Portfolio Selection, Journal of Finance 7(1), 77–91)',
      deps: ['opt-4.7'],
      refs: ['Boyd–Vandenberghe §4.4'],
      tags: ['portfolio', 'efficient frontier', 'quadratic program'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory', doi: 'https://doi.org/10.2307/2975974' },
      viz(v) {
        const SIG = [0.08, 0.15, 0.25], NAME = ['A', 'B', 'C'];
        const mu = [0.04, 0.08, 0.12].map((m, i) => v.slider(`return $\\mu_${NAME[i]}$`, 0.0, 0.2, m, { step: 0.0025 }));
        const rho = v.slider('correlation $\\rho$', -0.4, 0.9, 0.2, { step: 0.01 });
        const noShort = v.toggle('forbid short sales', false);
        const tS = v.slider('target return $r$', 0.0, 0.2, 0.08, { step: 0.0005 });
        const S = v.stage({ x: [0, 0.34], y: [-0.01, 0.18], axes: 'box', gutter: true, grid: true, height: 400, title: 'risk–return plane', xlabel: 'risk $\\sigma$', ylabel: 'return $\\mu$' });
        const W = v.stage({ x: [0, 4], y: [-1.5, 2.5], axes: 'box', gutter: true, grid: true, height: 400, title: 'weights of the gold portfolio', xticks: [[1, 'A'], [2, 'B'], [3, 'C']] });
        const solveSupport = (Sg, m, r, supp) => {
          const k = supp.length;
          if (k === 1) return Math.abs(m[supp[0]] - r) < 1e-12 ? [supp[0], 1] : null;
          if (k === 2) {
            const [a, b] = supp, d = m[b] - m[a]; if (Math.abs(d) < 1e-12) return null;
            const wb = (r - m[a]) / d; return [a, b, 1 - wb, wb];
          }
          const A = []; const rhs = [];
          for (let i = 0; i < 3; i++) A.push([2 * Sg[i][0], 2 * Sg[i][1], 2 * Sg[i][2], 1, m[i]]), rhs.push(0);
          A.push([1, 1, 1, 0, 0]); rhs.push(1); A.push([m[0], m[1], m[2], 0, 0]); rhs.push(r);
          const z = solveSmall(A, rhs); return z ? [0, 1, 2, z[0], z[1], z[2]] : null;
        };
        const portfolio = (Sg, m, r, long) => {
          const subsets = long ? [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]] : [[0, 1, 2]];
          let best = null;
          for (const sp of subsets) {
            const sol = solveSupport(Sg, m, r, sp); if (!sol) continue;
            const w = [0, 0, 0];
            if (sp.length === 1) w[sol[0]] = 1; else if (sp.length === 2) { w[sol[0]] = sol[2]; w[sol[1]] = sol[3]; } else { w[0] = sol[3]; w[1] = sol[4]; w[2] = sol[5]; }
            if (long && w.some((x) => x < -1e-9)) continue;
            let va = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) va += w[i] * Sg[i][j] * w[j];
            if (!best || va < best.var - 1e-14) best = { w, var: va };
          }
          return best;
        };
        const mc = memo();
        let info = {};
        v.render(() => {
          const m = mu.map((s) => s.value), rh = rho.value;
          const Sg = SIG.map((a, i) => SIG.map((b, j) => (i === j ? a * a : rh * a * b)));
          const key = [...m, rh].join('|');
          const C = mc(key, () => {
            const lo = Math.min(...m), hi = Math.max(...m);
            const fr = (long) => { const pts = []; for (let k = 0; k <= 160; k++) { const r = long ? lo + ((hi - lo) * k) / 160 : lo - 0.35 * (hi - lo) + (1.7 * (hi - lo) * k) / 160; const p = portfolio(Sg, m, r, long); if (p) pts.push([Math.sqrt(p.var), r]); } return pts; };
            const Fs = fr(false), Fl = fr(true);
            const r = mulberry(5); const cloud = []; let viol = 0;
            for (let k = 0; k < 1500; k++) {
              const a = -Math.log(1 - r()), b = -Math.log(1 - r()), c = -Math.log(1 - r()), t = a + b + c, w = [a / t, b / t, c / t];
              let va = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) va += w[i] * Sg[i][j] * w[j];
              const ret = w[0] * m[0] + w[1] * m[1] + w[2] * m[2], p = portfolio(Sg, m, ret, true), p2 = portfolio(Sg, m, ret, false);
              if (p && Math.sqrt(va) < Math.sqrt(p.var) - 1e-9) viol++;
              if (p2 && Math.sqrt(va) < Math.sqrt(p2.var) - 1e-9) viol++;
              cloud.push([Math.sqrt(va), ret]);
            }
            return { Fs, Fl, cloud, viol };
          });
          S.dots(C.cloud, { r: 1.6, color: 'muted', alpha: 0.45 });
          S.path(C.Fs, { color: 'blue', width: noShort.value ? 1.6 : 3, alpha: noShort.value ? 0.6 : 1 });
          S.path(C.Fl, { color: 'orange', width: noShort.value ? 3 : 1.6, alpha: noShort.value ? 1 : 0.6 });
          SIG.forEach((sg, i) => S.dot(sg, m[i], { r: 5, color: 'ink', label: NAME[i], labelPos: 'ne' }));
          const p = portfolio(Sg, m, tS.value, noShort.value);
          let sd = null;
          if (p) { sd = Math.sqrt(p.var); S.dot(sd, tS.value, { r: 7, color: 'gold' }); }
          W.bars(p ? p.w : [0, 0, 0], { x0: 1, dx: 1, color: (val) => (val < -1e-9 ? 'red' : 'accent') });
          W.hline(0, { color: 'ink', alpha: 0.6 });
          info = { p, sd, viol: C.viol, long: noShort.value };
        });
        v.legend([['blue', 'frontier, shorting allowed'], ['orange', 'frontier, long only'], ['muted', 'random long-only portfolios', { dot: true }], ['gold', 'chosen portfolio', { dot: true }]]);
        v.readout(() => {
          const { p, sd, viol, long } = info;
          if (!p) return `No ${long ? 'long-only ' : ''}portfolio attains that return: pick $r$ between the smallest and largest $\\mu_i$.`;
          return `$r=${f3(v, tS.value, 4)}$ needs weights $(${p.w.map((x) => f3(v, x, 2)).join(',\\ ')})$ with risk $\\sigma=${f3(v, sd, 4)}$ (${long ? 'long-only' : 'shorting allowed'}). Random portfolios to the left of either frontier: **${viol}** of 1500.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Second-order cone programs',
      statement: String.raw`A **second-order cone program** (SOCP) minimizes a linear function subject to second-order cone constraints:
$$\min_x\ f^{\mathsf T}x\quad\text{s.t.}\quad\norm{A_ix+b_i}_2\le c_i^{\mathsf T}x+d_i\ (i=1,\dots,m),\quad Fx=g .$$
Each constraint says that the affine image $(A_ix+b_i,\ c_i^{\mathsf T}x+d_i)$ lies in the **second-order (Lorentz) cone** $\mathcal Q=\{(y,t):\norm y_2\le t\}$, which is convex (it is a sublevel set of a norm, opt-2.5). So an SOCP is a convex problem; it contains LP ($A_i=0$), convex QP and QCQP, and its feasible sets are intersections of ellipsoids, paraboloids and hyperboloid branches. For a single constraint in the plane, $\norm{y}\le c^{\mathsf T}y+d$ is bounded by an ellipse if $\norm c<1$, a parabola if $\norm c=1$ and one branch of a hyperbola if $\norm c>1$.`,
      idea: String.raw`The cone $\mathcal Q$ is the epigraph of the norm $y\mapsto\norm y_2$; pulling it back by the affine map $x\mapsto(A x+b,\ c^{\mathsf T}x+d)$ preserves convexity (opt-2.5). Slicing the cone with a plane gives the classical conic sections, which explains the three shapes of the feasible set: the plane $t=c^{\mathsf T}y+d$ cuts every generator of the cone when its slope $\norm c$ is below that of the cone (ellipse), is parallel to one generator when $\norm c=1$ (parabola) and cuts both nappes when $\norm c>1$ (hyperbola; the constraint selects the upper nappe).`,
      caption: String.raw`**Left:** the cone $\norm{(x_1,qx_2)}\le t$ (drag to rotate) cut by the plane $t=a_1x_1+a_2x_2+b$; the red curve is the intersection. **Right:** the feasible set of the constraint $\norm{(x_1,qx_2)}\le a^{\mathsf T}x+b$ in the $x$-plane: an ellipse, parabola or hyperbola branch depending on the plane's steepness $\norm{(a_1,a_2/q)}$ compared with $1$. The gold dot minimizes the linear objective in the direction $\varphi$ over the feasible set (found by walking the boundary); when the recession cone contains a descent direction the problem is flagged **unbounded**.`,
      deps: ['opt-4.7', 'opt-2.3'],
      refs: ['Boyd–Vandenberghe §4.4'],
      tags: ['second-order cone', 'conic program'],
      credit: 'Lobo, Vandenberghe, Boyd & Lebret, 1998 (Applications of second-order cone programming, Linear Algebra Appl. 284)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Second-order_cone_programming' },
      viz(v) {
        const a1 = v.slider('slope $a_1$', -1.6, 1.6, 0.35, { step: 0.01 });
        const a2 = v.slider('slope $a_2$', -1.6, 1.6, 0.2, { step: 0.01 });
        const bS = v.slider('offset $b$', 0.2, 3, 1.6, { step: 0.01 });
        const qS = v.slider('anisotropy $q$', 0.5, 2.5, 1, { step: 0.01 });
        const phi = v.slider('objective direction $\\varphi$ (degrees)', 0, 359, 200, { step: 1, int: true });
        const S3 = v.stage3d({ range: 3.2, height: 400, yaw: -0.65, pitch: 0.45, axes: false, title: 'cone $\\norm{(x_1,qx_2)}\\le t$ and the plane' });
        const S = v.stage({ x: [-6, 6], y: [-4.5, 4.5], equal: true, axes: 'box', gutter: true, grid: true, height: 400, title: 'feasible set in the $x$-plane', xlabel: '$x_1$', ylabel: '$x_2$' });
        let info = {};
        v.render(() => {
          const A1 = a1.value, A2 = a2.value, b = bS.value, q = qS.value;
          const c = [A1, A2 / q]; // in y = (x1, q x2) coordinates: ||y|| <= c.y + b
          const cn = Math.hypot(c[0], c[1]);
          const g = (x, y) => Math.hypot(x, q * y) - (A1 * x + A2 * y + b);
          S.raster((x, y) => (g(x, y) <= 0 ? rgbA(v, 'accent', 55) : null), { res: 3, key: `${A1}|${A2}|${b}|${q}` });
          // boundary by polar shooting in y-space: rho = b / (1 - c.u)
          const bd = [];
          for (let k = 0; k < 720; k++) { const th = (2 * Math.PI * k) / 720, u = [Math.cos(th), Math.sin(th)], den = 1 - c[0] * u[0] - c[1] * u[1], rho = b / den; if (rho > 0 && rho < 60 && Math.abs(den) > 1e-6) bd.push({ th, u, rho, x: [rho * u[0], (rho * u[1]) / q], t: rho }); else bd.push(null); }
          // 3D
          const R = 3.4;
          S3.surface((rho, th) => [rho * Math.cos(th), (rho * Math.sin(th)) / q, rho], [0, R], [0, 2 * Math.PI], { n: 26, color: 'accent', alpha: 0.18, wire: true });
          const plane = (x1, x2) => [x1, x2, A1 * x1 + A2 * x2 + b];
          S3.surface((x1, x2) => plane(x1, x2), [-3, 3], [-3, 3], { n: 8, color: 'orange', alpha: 0.2, wire: true });
          let seg = [];
          bd.forEach((p) => { if (p && Math.abs(p.x[0]) < 3.4 && Math.abs(p.x[1]) < 3.4 && p.t < 4.6) seg.push([p.x[0], p.x[1], p.t]); else { if (seg.length > 1) S3.path(seg, { color: 'red', width: 3 }); seg = []; } });
          if (seg.length > 1) S3.path(seg, { color: 'red', width: 3 });
          S3.arrow([0, 0, 0], [0, 0, 4], { color: 'muted' });
          // 2D boundary
          let seg2 = [];
          bd.forEach((p) => { if (p) seg2.push([p.x[0], p.x[1]]); else { if (seg2.length > 1) S.path(seg2, { color: 'red', width: 2.6 }); seg2 = []; } });
          if (seg2.length > 1) S.path(seg2, { color: 'red', width: 2.6 });
          const kind = Math.abs(cn - 1) < 0.02 ? 'parabola' : cn < 1 ? 'ellipse' : 'hyperbola branch';
          // objective: minimize p.x with p = (cos, sin)
          const ph = (phi.value * Math.PI) / 180, p = [Math.cos(ph), Math.sin(ph)];
          let unb = false;
          for (let k = 0; k < 720; k++) { const th = (2 * Math.PI * k) / 720, u = [Math.cos(th), Math.sin(th)]; if (c[0] * u[0] + c[1] * u[1] >= 1 - 1e-9) { const dx = [u[0], u[1] / q]; if (p[0] * dx[0] + p[1] * dx[1] < -1e-9) unb = true; } }
          let best = null;
          if (!unb) for (const pt of bd) { if (!pt) continue; const val = p[0] * pt.x[0] + p[1] * pt.x[1]; if (!best || val < best.val) best = { val, x: pt.x }; }
          S.arrow(0, 0, -1.5 * p[0], -1.5 * p[1], { color: 'gold', width: 2.6 });
          if (best) { S.dot(best.x[0], best.x[1], { r: 7, color: 'gold' }); S3.dot([best.x[0], best.x[1], Math.hypot(best.x[0], q * best.x[1])], { r: 6 }); }
          info = { kind, cn, best, unb, b };
        });
        v.legend([['accent', 'feasible set $\\norm{Ax}\\le a^{\\mathsf T}x+b$', { area: true }], ['red', 'boundary = cone ∩ plane'], ['gold', 'minimizer of the linear objective', { dot: true }]]);
        v.readout(() => {
          const { kind, cn, best, unb } = info;
          return `Steepness $\\norm{(a_1,a_2/q)}=${f3(v, cn, 3)}$ → the feasible set is bounded by a **${kind}**. ${unb ? 'The objective is **unbounded below** (a recession direction decreases it).' : best ? `Optimal value $${f3(v, best.val)}$ at $x=(${f3(v, best.x[0], 2)},${f3(v, best.x[1], 2)})$, on the boundary.` : 'Empty or degenerate.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Robust linear programming',
      statement: String.raw`Suppose the data of the constraint $a_i^{\mathsf T}x\le b_i$ are only known to lie in an ellipsoid, $a_i\in\mathcal E_i=\{\bar a_i+P_iu:\norm u_2\le1\}$. The **robust LP**
$$\min_x\ c^{\mathsf T}x\quad\text{s.t.}\quad a_i^{\mathsf T}x\le b_i\ \ \text{for all }a_i\in\mathcal E_i,\ i=1,\dots,m,$$
asks the constraints to hold for every admissible $a_i$. Since $\sup_{a\in\mathcal E_i}a^{\mathsf T}x=\bar a_i^{\mathsf T}x+\norm{P_i^{\mathsf T}x}_2$, it is equivalent to the second-order cone program
$$\min_x\ c^{\mathsf T}x\quad\text{s.t.}\quad \bar a_i^{\mathsf T}x+\norm{P_i^{\mathsf T}x}_2\le b_i,\ \ i=1,\dots,m .$$
The robust feasible set is contained in the nominal polyhedron, and the loss in optimal value is the *price of robustness*.`,
      idea: String.raw`A constraint that must hold for all $a$ in a set holds iff it holds for the worst $a$, and the worst case of a linear function over an ellipsoid is a support function: by Cauchy–Schwarz $\sup_{\norm u\le1}(P^{\mathsf T}x)^{\mathsf T}u=\norm{P^{\mathsf T}x}_2$. This turns infinitely many linear constraints into one second-order cone constraint (opt-4.9). The extra term $\norm{P_i^{\mathsf T}x}_2$ is a norm penalty that pushes $x$ away from boundaries that are sensitive to the uncertain coefficient, so the feasible set shrinks and rounds off.`,
      caption: String.raw`Six constraints $a_i^{\mathsf T}x\le1$ with nominal normals $\bar a_i$ and uncertainty balls of radius $\rho$ (so $P_i=\rho I$). Slide $\rho$: the dashed polygon is the nominal feasible set and the shaded region is the robust set $\bar a_i^{\mathsf T}x+\rho\norm x\le1$, which shrinks and loses its corners. The objective is $\max c^{\mathsf T}x$ in direction $\varphi$. Faint lines are 4 random draws of each uncertain constraint. For 2000 random realizations of **all** data, the percentage violated by the nominal optimum (red) and by the best robust-feasible grid point (green) is read out. The grid search estimates the robust optimum and price of robustness; the coefficients are illustrative.`,
      scope: String.raw`Ball-shaped (ellipsoidal) uncertainty in each constraint row independently, and a worst-case, not probabilistic, guarantee.`,
      credit: 'Ben-Tal & Nemirovski; El Ghaoui & Lebret',
      deps: ['opt-4.9'],
      refs: ['Boyd–Vandenberghe §4.4'],
      tags: ['robust optimization', 'second-order cone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robust_optimization', doi: 'https://doi.org/10.1287/moor.23.4.769' },
      viz(v) {
        const rho = v.slider('uncertainty radius $\\rho$', 0, 0.6, 0.25, { step: 0.005 });
        const phi = v.slider('objective direction $\\varphi$ (degrees)', 0, 359, 35, { step: 1, int: true });
        const AB = [[1, 0.1], [0.4, 1], [-0.7, 0.8], [-0.9, -0.5], [0.3, -1], [0.9, -0.5]];
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 420, title: 'nominal and robust feasible sets' });
        const mc = memo();
        let info = {};
        v.render(() => {
          const rh = rho.value, ph = (phi.value * Math.PI) / 180, c = [Math.cos(ph), Math.sin(ph)];
          const hs = AB.map((a) => ({ nx: a[0], ny: a[1], c: 1 }));
          const nom = lp2([-c[0], -c[1]], hs, 6);
          const robOK = (x, y) => AB.every((a) => a[0] * x + a[1] * y + rh * Math.hypot(x, y) <= 1);
          const R = mc(`${rh}|${phi.value}`, () => {
            let best = -Infinity, bx = null;
            for (let i = 0; i <= 440; i++) for (let j = 0; j <= 400; j++) { const x = -2.2 + (4.4 * i) / 440, y = -2 + (4 * j) / 400; if (robOK(x, y)) { const val = c[0] * x + c[1] * y; if (val > best) { best = val; bx = [x, y]; } } }
            const r = mulberry(21); let vn = 0, vr = 0; const N = 2000;
            for (let k = 0; k < N; k++) {
              const draws = AB.map((a) => { const t = r() * 2 * Math.PI, rr = rh * Math.sqrt(r()); return [a[0] + rr * Math.cos(t), a[1] + rr * Math.sin(t)]; });
              const bad = (x) => x && draws.some((a) => a[0] * x[0] + a[1] * x[1] > 1 + 1e-9);
              if (bad(nom.status === 'optimal' ? nom.x : null)) vn++; if (bad(bx)) vr++;
            }
            return { best, bx, vn: vn / N, vr: vr / N };
          });
          S.raster((x, y) => (robOK(x, y) ? rgbA(v, 'green', 56) : null), { res: 3, key: `rob|${rh}` });
          S.poly(nom.poly, { fill: false, color: 'ink', width: 1.8, dash: true });
          const r2 = mulberry(3);
          AB.forEach((a, i) => {
            for (let k = 0; k < 4; k++) { const t = r2() * 2 * Math.PI, rr = rh * Math.sqrt(r2()), A = [a[0] + rr * Math.cos(t), a[1] + rr * Math.sin(t)], n = Math.hypot(...A), q = [A[0] / n / n, A[1] / n / n], d = [-A[1] / n, A[0] / n]; S.line(q[0] - 9 * d[0], q[1] - 9 * d[1], q[0] + 9 * d[0], q[1] + 9 * d[1], { color: 'muted', width: 1, alpha: 0.22 }); }
          });
          S.arrow(0, 0, 0.8 * c[0], 0.8 * c[1], { color: 'gold', width: 2.6 });
          if (nom.status === 'optimal') S.dot(nom.x[0], nom.x[1], { r: 7, color: 'red', hollow: true, width: 2.4 });
          if (R.bx) S.dot(R.bx[0], R.bx[1], { r: 7, color: 'green' });
          info = { nom, R, c };
        });
        v.legend([['green', 'robust feasible set', { area: true }], ['ink', 'nominal polygon', { dash: true }], ['red', 'nominal optimum', { dot: true }], ['green', 'best robust-feasible grid point', { dot: true }]]);
        v.readout(() => {
          const { nom, R, c } = info;
          const nv = nom.status === 'optimal' ? c[0] * nom.x[0] + c[1] * nom.x[1] : NaN;
          return `Nominal optimum $c^{\\mathsf T}x=${f3(v, nv)}$, robust grid best $${f3(v, R.best)}$ (estimated price of robustness $${f3(v, nv - R.best)}$).\nSampled realizations of the uncertain data violated: nominal optimum **${f3(v, 100 * R.vn, 1)}%**, robust grid point **${f3(v, 100 * R.vr, 1)}%**.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Definition',
      name: 'Geometric programs',
      statement: String.raw`A **monomial** is $g(x)=c\,x_1^{a_1}\cdots x_n^{a_n}$ with $c>0$, $a_i\in\R$, on $x\succ0$; a **posynomial** is a sum of monomials. A **geometric program** (GP) is
$$\min\ f_0(x)\quad\text{s.t.}\quad f_i(x)\le1\ (i=1,\dots,m),\quad g_j(x)=1\ (j=1,\dots,p),\qquad x\succ0,$$
with $f_i$ posynomials and $g_j$ monomials. It is generally not convex in $x$, but under $x_i=e^{y_i}$ a monomial becomes $\exp(a^{\mathsf T}y+\log c)$ and a posynomial $\sum_k\exp(a_k^{\mathsf T}y+b_k)$; taking logarithms, $\log f_i(e^y)$ is a log-sum-exp of affine functions, hence **convex**, and monomial equalities become affine equalities. So every GP is equivalent to a convex problem in $y$.`,
      idea: String.raw`Log-sum-exp is convex (it is the log of a sum of exponentials of affine maps; opt-3.10 supplies the log-convexity of such sums), and a pointwise composition with the affine map $y\mapsto a_k^{\mathsf T}y+b_k$ preserves convexity (opt-3.6). The constraint $f_i(e^y)\le1$ becomes $\log f_i(e^y)\le0$, a sublevel set of a convex function; the objective $\log f_0(e^y)$ has the same minimizers as $f_0$ because $\log$ is increasing. The change of variables is a homeomorphism of the positive orthant onto $\R^n$, so nothing is lost.`,
      caption: String.raw`Choose a design: minimize $f_0=1/w+2/h$ (heat loss of a panel of width $w$ and height $h$) subject to the posynomial constraint $wh+\tfrac12w^2\le A$ and the aspect-ratio bounds $\tfrac1\gamma\le w/h\le\gamma$. **Left:** the problem in the original variables: the feasible set is *not* convex (the chord test finds violating chords; it is bounded by a curve bending the wrong way). **Right:** after $w=e^u,\ h=e^v$ the feasible set is convex and the objective $\log f_0$ is convex; the chord tests pass. The optimum found on a grid in the $(u,v)$-plane maps to the same point on the left. The design problem is illustrative.`,
      credit: 'Duffin, Peterson & Zener',
      deps: ['opt-4.1', 'opt-3.10'],
      refs: ['Boyd–Vandenberghe §4.5'],
      tags: ['geometric program', 'posynomial', 'change of variables'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geometric_programming' },
      viz(v) {
        const AS = v.slider('area budget $A$', 1, 12, 5, { step: 0.05 });
        const GS = v.slider('aspect bound $\\gamma$', 1.2, 8, 6, { step: 0.05 });
        const L = v.stage({ x: [0, 6], y: [0, 6], equal: true, axes: 'box', gutter: true, height: 380, title: 'original variables $(w,h)$', xlabel: '$w$', ylabel: '$h$' });
        const R = v.stage({ x: [-2.5, 2.2], y: [-2.5, 2.2], equal: true, axes: 'box', gutter: true, height: 380, title: 'log variables $(u,v)=(\\log w,\\log h)$', xlabel: '$u$', ylabel: '$v$' });
        const f0 = (w, h) => 1 / w + 2 / h;
        const mc = memo();
        let info = {};
        v.render(() => {
          const A = AS.value, g = GS.value;
          const feas = (w, h) => w > 0 && h > 0 && w * h + 0.5 * w * w <= A && w / h <= g && h / w <= g;
          const feasUV = (u, vv) => feas(Math.exp(u), Math.exp(vv));
          const K = mc(`${A}|${g}`, () => {
            const t1 = chordTest(feas, [0.02, 0.02, 6, 6], { seed: 2, tries: 20000 });
            const t2 = chordTest(feasUV, [-2.5, -2.5, 2.2, 2.2], { seed: 2, tries: 20000 });
            const lf = (u, vv) => Math.log(f0(Math.exp(u), Math.exp(vv)));
            const c1 = chordTest2((w, h) => Math.log(f0(Math.exp(w), Math.exp(h))), [-2.5, -2.5, 2.2, 2.2], { seed: 6 });
            let best = Infinity, bu = 0, bv = 0;
            for (let i = 0; i <= 940; i++) for (let j = 0; j <= 940; j++) { const u = -2.5 + (4.7 * i) / 940, vv = -2.5 + (4.7 * j) / 940; if (feasUV(u, vv)) { const val = lf(u, vv); if (val < best) { best = val; bu = u; bv = vv; } } }
            return { t1, t2, c1, best, bu, bv };
          });
          L.raster((w, h) => (feas(w, h) ? rgbA(v, 'accent', 55) : null), { res: 3, key: `L|${A}|${g}` });
          R.raster((u, vv) => (feasUV(u, vv) ? rgbA(v, 'accent', 55) : null), { res: 3, key: `R|${A}|${g}` });
          L.clip(() => L.contour((w, h) => f0(Math.max(w, 1e-3), Math.max(h, 1e-3)), [0.5, 0.8, 1.2, 1.8, 2.8, 4.5], { color: 'ink', alpha: 0.3, width: 1, res: 120 }));
          R.clip(() => R.contour((u, vv) => Math.log(f0(Math.exp(u), Math.exp(vv))), [-0.4, -0.1, 0.2, 0.5, 0.9, 1.4, 2], { color: 'ink', alpha: 0.3, width: 1, res: 120 }));
          if (K.best < Infinity) {
            R.dot(K.bu, K.bv, { r: 7, color: 'green' });
            L.dot(Math.exp(K.bu), Math.exp(K.bv), { r: 7, color: 'green' });
          }
          info = K;
        });
        v.legend([['accent', 'feasible set', { area: true }], ['ink', 'level sets of the objective'], ['green', 'best feasible grid point', { dot: true }]]);
        v.readout(() => {
          const K = info; const yn = (t) => (t.bad === 0 ? '✓ passes' : `✗ ${t.bad}/${t.tested} chords leave the set`);
          return `Chord test on the feasible set — original $(w,h)$: ${K.t1.m < 12 ? 'empty' : yn(K.t1)}; log variables $(u,v)$: ${K.t2.m < 12 ? 'empty' : yn(K.t2)}. Objective $\\log f_0(e^y)$ chord test: ${K.c1.bad === 0 ? 'no sampled violation (consistent with analytic convexity)' : 'sampled violation'}.\n${K.best < Infinity ? `Grid best: $w=${f3(v, Math.exp(K.bu))}$, $h=${f3(v, Math.exp(K.bv))}$, $f_0=${f3(v, Math.exp(K.best))}$.` : 'Infeasible.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Definition',
      name: 'Semidefinite programs',
      statement: String.raw`A **semidefinite program** (SDP) minimizes a linear function over a **spectrahedron**, the solution set of a linear matrix inequality (LMI):
$$\min_x\ c^{\mathsf T}x\quad\text{s.t.}\quad F(x)=F_0+x_1F_1+\dots+x_nF_n\ \succeq\ 0,\quad Ax=b,$$
with $F_i$ symmetric matrices. The constraint is the preimage of the positive semidefinite cone (opt-2.4) under an affine map, hence convex, but unlike a polyhedron its boundary can be curved. A finite family of LMIs is a single LMI (block-diagonal matrices), and LPs, convex QCQPs and SOCPs are special cases; a $2\times2$ block $\left[\begin{smallmatrix}t+s&r\\r&t-s\end{smallmatrix}\right]\succeq0$ is exactly $\norm{(s,r)}\le t$, so a second-order cone constraint is a $2\times2$ LMI. At an optimum of an SDP the matrix $F(x^\star)$ is typically singular (the eigenvalue constraint is tight).`,
      idea: String.raw`A symmetric matrix is positive semidefinite iff all its eigenvalues are nonnegative, iff $z^{\mathsf T}F(x)z\ge0$ for every $z$; each such inequality is a half-space in $x$ (affine in $x$ for fixed $z$), so the feasible set is an intersection of infinitely many half-spaces — convex, with curved boundary where the smallest eigenvalue crosses zero. Block-diagonal LMIs make the intersection of several spectrahedra a spectrahedron, and the $2\times2$ blocks used here recover discs (second-order cone slices). Strict feasibility ($F(x)\succ0$ for some $x$) is the SDP analogue of Slater's condition and underlies duality and interior-point methods.`,
      caption: String.raw`Choose a spectrahedron: a disc ($2\times2$ LMI), a disc cut by two half-planes ($2\times2$ plus $1\times1$ blocks) or an intersection of three discs (three $2\times2$ blocks), each assembled into one block-diagonal LMI. Drag the point $x$ (white): the right panel shows the eigenvalues of $F(x)$, green when all are $\ge0$. The shading is the feasible set $\{\lambda_{\min}(F(x))\ge0\}$; the gold dot minimizes $c^{\mathsf T}x$ (direction $\varphi$) over it, estimated by a nested grid search. The readout reports the numerical smallest eigenvalue at that grid point; it need not be exactly zero. The examples are chosen to look like polygons with some sides curved.`,
      deps: ['opt-4.9', 'opt-2.4'],
      refs: ['Boyd–Vandenberghe §4.6'],
      tags: ['semidefinite program', 'LMI', 'spectrahedron'],
      credit: 'Nesterov & Nemirovski; Alizadeh',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Semidefinite_programming' },
      viz(v) {
        // each block: {n, F: (x1, x2) => symmetric matrix as rows}
        const disc = (cx, cy, r) => ({ F: (x, y) => [[r + (x - cx), y - cy], [y - cy, r - (x - cx)]], name: `disc ${r}` });
        const lin = (a, b, c) => ({ F: (x, y) => [[c - a * x - b * y]], name: 'half-plane' });
        const SETS = {
          disc: { label: 'disc', blocks: [disc(0, 0, 1.5)] },
          cut: { label: 'disc and two cuts', blocks: [disc(0, 0, 1.6), lin(1, 0, 0.9), lin(-0.6, -1, 1.1)] },
          three: { label: 'three discs', blocks: [disc(0.5, 0.0, 1.9), disc(-0.3, 0.65, 1.9), disc(-0.3, -0.65, 1.9)] },
        };
        const sel = v.select('LMI', Object.entries(SETS).map(([k, o]) => ({ value: k, label: o.label })), 'cut');
        const phi = v.slider('objective direction $\\varphi$ (degrees)', 0, 359, 30, { step: 1, int: true });
        const S = v.stage({ x: [-3, 3], y: [-2.5, 2.5], equal: true, axes: 'box', gutter: true, height: 400, title: 'spectrahedron $\\{x:F(x)\\succeq0\\}$' });
        const E = v.stage({ x: [0, 8], y: [-1.5, 3.5], axes: 'box', gutter: true, grid: true, height: 400, title: 'eigenvalues of $F(x)$' });
        const X = S.handle(0.2, 0.3, { color: 'ink', r: 7, label: 'x', labelPos: 'ne', constrain: { x: [-2.9, 2.9], y: [-2.4, 2.4] } });
        const eig = (F) => { const n = F.length; if (n === 1) return [F[0][0]]; const e = v.M.eigSym(F); return e.values.slice().sort((a, b) => a - b); };
        const eigsAll = (bl, x, y) => bl.flatMap((b) => eig(b.F(x, y)));
        const lmin = (bl, x, y) => Math.min(...eigsAll(bl, x, y));
        const mc = memo();
        let info = {};
        v.render(() => {
          const bl = SETS[sel.value].blocks, ph = (phi.value * Math.PI) / 180, c = [Math.cos(ph), Math.sin(ph)];
          S.raster((x, y) => { const m = lmin(bl, x, y); return m >= 0 ? rgbA(v, 'accent', 55) : null; }, { res: 3, key: 'S|' + sel.value });
          const opt = mc(`${sel.value}|${phi.value}`, () => {
            let best = null, cx = 0, cy = 0, h = 0.02, x0 = -3, x1 = 3, y0 = -2.5, y1 = 2.5;
            for (let round = 0; round < 3; round++) {
              best = null; const nx = Math.round((x1 - x0) / h), ny = Math.round((y1 - y0) / h);
              for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) { const x = x0 + i * h, y = y0 + j * h; if (lmin(bl, x, y) >= 0) { const val = c[0] * x + c[1] * y; if (!best || val < best.val) best = { x, y, val }; } }
              if (!best) break;
              x0 = best.x - 2 * h; x1 = best.x + 2 * h; y0 = best.y - 2 * h; y1 = best.y + 2 * h; h /= 8;
            }
            return best;
          });
          S.contour((x, y) => lmin(bl, x, y), [0], { color: 'accent', width: 2.6, res: 160 });
          S.arrow(0, 0, -0.9 * c[0], -0.9 * c[1], { color: 'gold', width: 2.4 });
          if (opt) {
            const d = [-c[1], c[0]];
            S.line(opt.x - 6 * d[0], opt.y - 6 * d[1], opt.x + 6 * d[0], opt.y + 6 * d[1], { color: 'gold', width: 1.4, dash: true });
            S.dot(opt.x, opt.y, { r: 7, color: 'gold' });
          }
          const ev = eigsAll(bl, X.x, X.y);
          E.setView([0, ev.length + 1], [Math.min(-1, ...ev) * 1.1, Math.max(3, ...ev) * 1.05]);
          E.bars(ev, { x0: 1, dx: 1, color: (val) => (val >= 0 ? 'green' : 'red') });
          E.hline(0, { color: 'ink', width: 1.6 });
          info = { opt, ok: Math.min(...ev) >= 0, lm: Math.min(...ev), optEv: opt ? lmin(bl, opt.x, opt.y) : NaN, ev };
        });
        v.legend([['accent', 'feasible set', { area: true }], ['gold', 'objective direction, level line, minimizer']]);
        v.readout(() => {
          const { opt, ok, lm, optEv } = info;
          return `At the white point $\\lambda_{\\min}(F(x))=${f3(v, lm)}$: ${ok ? '**feasible**' : '**infeasible**'}.\n${opt ? `Grid estimate $x^\\star=(${f3(v, opt.x, 3)},${f3(v, opt.y, 3)})$, $c^{\\mathsf T}x^\\star=${f3(v, opt.val)}$, $\\lambda_{\\min}(F(x^\\star))=${f3(v, optEv, 4)}$ (numerical feasibility residual).` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Definition',
      name: 'Pareto optimality and scalarization',
      statement: String.raw`A **multicriterion** (vector) problem minimizes $F(x)=(f_1(x),\dots,f_q(x))$ over a feasible set $X$. A feasible $x$ is **Pareto optimal** if no feasible $x'$ has $f_i(x')\le f_i(x)$ for all $i$ with strict inequality for some $i$; the set of attainable Pareto optimal values $F(x)$ is the **Pareto frontier** (optimal trade-off curve). **Scalarization** minimizes a weighted sum $\sum_i\lambda_if_i(x)$ with $\lambda\succ0$: every minimizer is Pareto optimal. For a **convex** problem ($f_i$ convex, $X$ convex) the converse holds: every Pareto optimal point minimizes $\sum\lambda_if_i$ for some $\lambda\succeq0$, $\lambda\ne0$. For non-convex problems some Pareto optimal points can never be reached by scalarization.`,
      idea: String.raw`Consider the set $\mathcal A=\{F(x)+r:\ x\in X,\ r\succeq0\}$ of values dominated by attainable ones. A minimizer of $\lambda^{\mathsf T}u$ over $\mathcal A$ is a point where the hyperplane $\lambda^{\mathsf T}u=\text{const}$ supports $\mathcal A$ (opt-2.8). When the $f_i$ and $X$ are convex, $\mathcal A$ is convex, so by the supporting hyperplane theorem every boundary point — every Pareto optimal value — has a supporting hyperplane, i.e. is reached by some weight $\lambda$. If $\mathcal A$ is not convex, points in its dented part have no supporting hyperplane and scalarization jumps over them.`,
      caption: String.raw`Two costs $f=(x_1,x_2)$ are minimized together over a set of designs $x\in X\subset\R^2$ (so the design plane and the objective plane coincide). In the **disc** setting $X$ is convex; in the **ring** setting $X=\{x\succeq0:1\le\norm x\le1.5\}$ is not. **Left:** the set $X$ with its Pareto frontier in green (the lower-left boundary), the minimizer of $\lambda f_1+(1-\lambda)f_2$ in gold and its supporting line of slope $-\lambda/(1-\lambda)$. **Right:** the values $f_1$ (blue) and $f_2$ (orange) of the weighted-sum minimizer as $\lambda$ sweeps from 0 to 1: it slides continuously along a convex frontier but **jumps** across the frontier of the ring, whose interior points no weight reaches (red). The computation uses a 0.01 design grid and 300 sampled weights; the readout counts frontier grid points within 0.012 of a sampled weighted-sum minimum. This tolerance is a visual approximation, not a certificate of exact support.`,
      credit: 'Pareto; weighted-sum scalarization',
      deps: ['opt-4.1'],
      refs: ['Boyd–Vandenberghe §4.7'],
      tags: ['Pareto', 'scalarization', 'multicriterion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pareto_efficiency' },
      viz(v) {
        const mode = v.select('design set $X$', [{ value: 'disc', label: 'disc (convex)' }, { value: 'ring', label: 'ring (non-convex)' }], 'disc');
        const lam = v.slider('weight $\\lambda$ on $f_1$', 0.01, 0.99, 0.5, { step: 0.005 });
        const R = v.stage({ x: [0, 3.2], y: [0, 3.2], equal: true, axes: 'box', gutter: true, grid: true, height: 380, title: 'designs = objective values $(f_1,f_2)$', xlabel: '$f_1=x_1$', ylabel: '$f_2=x_2$' });
        const T = v.stage({ x: [0, 1], y: [0, 3.2], axes: 'box', gutter: true, grid: true, height: 380, title: 'minimizer vs $\\lambda$: $f_1$ (blue), $f_2$ (orange)', xlabel: '$\\lambda$' });
        const SETS = {
          disc: (x, y) => (x - 1.9) ** 2 + (y - 1.6) ** 2 <= 1.3 ** 2,
          ring: (x, y) => x >= 0 && y >= 0 && x * x + y * y >= 1 && x * x + y * y <= 2.25,
        };
        const F = (p) => [p[0], p[1]];
        const mc = memo();
        let info = {};
        v.render(() => {
          const K = mc(mode.value, () => {
            const pts = [];
            for (let i = 0; i <= 320; i++) for (let j = 0; j <= 320; j++) { const x = (3.2 * i) / 320, y = (3.2 * j) / 320; if (SETS[mode.value](x, y)) pts.push([x, y]); }
            const V = pts.map(F);
            const ord = V.map((_, i) => i).sort((i, j) => V[i][0] - V[j][0] || V[i][1] - V[j][1]);
            const par = []; let best = Infinity;
            for (const i of ord) if (V[i][1] < best - 1e-12) { par.push(i); best = V[i][1]; }
            const lams = Array.from({ length: 300 }, (_, k) => 0.003 + (0.994 * k) / 299);
            const arg = lams.map((l) => { let bi = 0, bv = Infinity; V.forEach((u, i) => { const val = l * u[0] + (1 - l) * u[1]; if (val < bv) { bv = val; bi = i; } }); return bi; });
            const mins = lams.map((l, k) => l * V[arg[k]][0] + (1 - l) * V[arg[k]][1]);
            const sup = par.map((i) => lams.some((l, k) => l * V[i][0] + (1 - l) * V[i][1] <= mins[k] + 0.012));
            return { pts, V, par, sup, lams, arg, frac: sup.filter(Boolean).length / par.length };
          });
          const l = lam.value; let bi = 0, bv = Infinity;
          K.V.forEach((u, i) => { const val = l * u[0] + (1 - l) * u[1]; if (val < bv) { bv = val; bi = i; } });
          R.raster((x, y) => (SETS[mode.value](x, y) ? rgbA(v, 'accent', 50) : null), { res: 3, key: 'L|' + mode.value });
          R.path(K.par.map((i) => K.V[i]), { color: 'green', width: 2.6 });
          K.par.forEach((i, k) => { if (!K.sup[k]) R.dot(K.V[i][0], K.V[i][1], { r: 2.2, color: 'red' }); });
          const u = K.V[bi], d = [-(1 - l), l];
          R.line(u[0] - 30 * d[0], u[1] - 30 * d[1], u[0] + 30 * d[0], u[1] + 30 * d[1], { color: 'gold', width: 1.6, dash: true });
          R.dot(u[0], u[1], { r: 7, color: 'gold' });
          T.path(K.lams.map((x, k) => [x, K.V[K.arg[k]][0]]), { color: 'accent', width: 2.2 });
          T.path(K.lams.map((x, k) => [x, K.V[K.arg[k]][1]]), { color: 'orange', width: 2.2 });
          T.dot(l, u[0], { r: 6, color: 'gold' });
          info = { frac: K.frac, np: K.par.length, u, cv: mode.value === 'disc' };
        });
        v.legend([['green', 'Pareto optimal designs / frontier'], ['red', 'grid frontier outside sampled support tolerance', { dot: true }], ['gold', 'weighted-sum minimizer', { dot: true }]]);
        v.readout(() => {
          const { frac, np, u, cv } = info;
          return `Grid weighted-sum minimizer: $(f_1,f_2)=(${f3(v, u[0], 2)},${f3(v, u[1], 2)})$. The frontier has ${np} grid points; **${f3(v, 100 * frac, 0)}%** are within 0.012 of a sampled weighted-sum minimum. ${cv ? 'For the continuous convex disc, the theorem guarantees support of every Pareto point.' : 'For the continuous ring, only the two ends of the inner arc minimize a strictly positive weighted sum.'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Invention',
      name: 'Disciplined convex programming and modelling languages',
      statement: String.raw`**Disciplined convex programming** (DCP) is a set of rules for building expressions whose convexity can be verified mechanically. Every expression is a tree of **atoms** (functions with known curvature, domains and, per argument, known monotonicity on the argument ranges) applied to variables. The **composition rule**: $h(g_1,\dots,g_k)$ is convex if $h$ is convex and for each $i$ either $h$ is nondecreasing in its $i$-th argument and $g_i$ is convex, or $h$ is nonincreasing in it and $g_i$ is concave, or $g_i$ is affine (and analogously for concave). Expressions that follow the rules are certified convex (or concave, or affine); a program built from them is accepted as convex. The rules are **sufficient, not necessary**: $\sqrt{x^2}$ equals $|x|$ for $x\ge0$, but the rules reject it. DCP modelling systems verify these rules and translate supported atoms into solver-compatible representations.`,
      idea: String.raw`The composition rule is the chain rule for convexity (opt-3.6): for $f=h\circ g$ with $g$ a scalar function, $f''=h'(g)g''+h''(g)(g')^2$, which is $\ge0$ when $h''\ge0$ and $h'g''\ge0$ — exactly "$h$ increasing with $g$ convex or $h$ decreasing with $g$ concave". Applying this recursively along the tree, with the curvature and sign of each node computed bottom-up, certifies the whole expression in time linear in its size. Graph implementations represent convex atoms by epigraph constraints and concave atoms by hypograph constraints (opt-4.3). Expanding these representations produces an equivalent problem supported by the chosen solver; general atoms need not reduce to SOCP or SDP.`,
      caption: String.raw`Pick a classic expression or build one yourself: start from a variable and wrap the current expression in an atom. The tree shows each node's curvature computed by the rules (blue convex, orange concave, grey affine, red rejected). The verdict is the **DCP verdict**; below it is a numerical chord test of the actual function on $x,y\in[0.2,4]$. Where they differ — e.g. $\log(e^x)=x$ or $\sqrt{x^2}$ — the rules are conservative: the function is convex (even affine), but the expression is not written in a form DCP can certify.`,
      scope: String.raw`Variables are positive ($x,y\ge0.2$ in the numerical test); composed arguments must still satisfy each atom’s domain. Invalid sample evaluations are omitted from the chord test; the atom set shown is a small fragment of CVX/CVXPY's.`,
      credit: 'Grant, Boyd & Ye, 2006, Disciplined convex programming',
      deps: ['opt-3.6', 'opt-4.12'],
      refs: ['Grant–Boyd–Ye, Disciplined convex programming (2006), §§6.4, 10'],
      tags: ['DCP', 'modelling language', 'composition rules'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Disciplined_convex_programming', website: 'https://www.cvxpy.org/tutorial/dcp/' },
      viz(v) {
        // atoms: curv ('convex'|'concave'|'affine'), mono per arg: 'inc' | 'dec' | 'sgn' (inc on nonneg, dec on nonpos), sign of result
        const AT = {
          square: { n: 1, curv: 'convex', mono: ['sgn'], f: (a) => a * a, sign: () => 'nn', tex: (a) => `(${a})^2` },
          abs: { n: 1, curv: 'convex', mono: ['sgn'], f: (a) => Math.abs(a), sign: () => 'nn', tex: (a) => `|${a}|` },
          exp: { n: 1, curv: 'convex', mono: ['inc'], f: Math.exp, sign: () => 'nn', tex: (a) => `e^{${a}}` },
          inv: { n: 1, curv: 'convex', mono: ['dec'], f: (a) => (a > 0 ? 1 / a : NaN), sign: () => 'nn', tex: (a) => `1/${a}`, needsPos: true },
          log: { n: 1, curv: 'concave', mono: ['inc'], f: (a) => (a > 0 ? Math.log(a) : NaN), sign: () => 'unk', tex: (a) => `\\log(${a})` },
          sqrt: { n: 1, curv: 'concave', mono: ['inc'], f: (a) => (a >= 0 ? Math.sqrt(a) : NaN), sign: () => 'nn', tex: (a) => `\\sqrt{${a}}` },
          neg: { n: 1, curv: 'affine', mono: ['dec'], f: (a) => -a, sign: (s) => (s[0] === 'nn' ? 'np' : s[0] === 'np' ? 'nn' : 'unk'), tex: (a) => `-${a}` },
          add: { n: 2, curv: 'affine', mono: ['inc', 'inc'], f: (a, b) => a + b, sign: (s) => (s[0] === 'nn' && s[1] === 'nn' ? 'nn' : s[0] === 'np' && s[1] === 'np' ? 'np' : 'unk'), tex: (a, b) => `${a}+${b}` },
          max: { n: 2, curv: 'convex', mono: ['inc', 'inc'], f: Math.max, sign: (s) => (s.includes('nn') ? 'nn' : s[0] === 'np' && s[1] === 'np' ? 'np' : 'unk'), tex: (a, b) => `\\max(${a},${b})` },
          min: { n: 2, curv: 'concave', mono: ['inc', 'inc'], f: Math.min, sign: (s) => (s[0] === 'nn' && s[1] === 'nn' ? 'nn' : 'unk'), tex: (a, b) => `\\min(${a},${b})` },
          norm: { n: 2, curv: 'convex', mono: ['sgn', 'sgn'], f: Math.hypot, sign: () => 'nn', tex: (a, b) => `\\|(${a},${b})\\|` },
        };
        const V = (nm) => ({ op: nm });
        const ap = (op, ...args) => ({ op, args });
        const PRE = {
          'x': V('x'),
          'x²+y²': ap('add', ap('square', V('x')), ap('square', V('y'))),
          'log(eˣ)': ap('log', ap('exp', V('x'))),
          '√(x²)': ap('sqrt', ap('square', V('x'))),
          'eˣ+log y': ap('add', ap('exp', V('x')), ap('log', V('y'))),
          'max(x², eʸ)': ap('max', ap('square', V('x')), ap('exp', V('y'))),
          '−x²': ap('neg', ap('square', V('x'))),
          'x⁴': ap('square', ap('square', V('x'))),
          'log x + √y': ap('add', ap('log', V('x')), ap('sqrt', V('y'))),
          'log(x)²': ap('square', ap('log', V('x'))),
          '1/(x+y)': ap('inv', ap('add', V('x'), V('y'))),
        };
        const names = Object.keys(PRE);
        const sel = v.select('example', names.map((n) => ({ value: n, label: n })), 'log(eˣ)');
        let E = PRE[sel.value];
        const hist = [];
        const setE = (e) => { hist.push(E); E = e; v.invalidate(); };
        sel.set(sel.value);
        const prevSel = { v: sel.value };
        const bar = (label, fn) => v.button(label, fn);
        ['square', 'abs', 'exp', 'log', 'sqrt', 'neg', 'inv'].forEach((op) => bar(`${op}(·)`, () => setE(ap(op, E))));
        ['add', 'max', 'min', 'norm'].forEach((op) => { bar(`${op}(·, x)`, () => setE(ap(op, E, V('x')))); bar(`${op}(·, y)`, () => setE(ap(op, E, V('y')))); });
        v.button('undo', () => { if (hist.length) { E = hist.pop(); v.invalidate(); } });
        // analysis
        const ana = (e) => {
          if (!e.args) return { e, convex: true, concave: true, sign: 'nn', kids: [], str: e.op, val: (x, y) => (e.op === 'x' ? x : y), name: e.op };
          const at = AT[e.op], kids = e.args.map(ana);
          const cond = (isConvexOuter) => kids.every((k, i) => {
            const aff = k.convex && k.concave; if (aff) return true;
            let m = at.mono[i]; if (m === 'sgn') m = k.sign === 'nn' ? 'inc' : k.sign === 'np' ? 'dec' : null;
            if (m === 'inc') return isConvexOuter ? k.convex : k.concave;
            if (m === 'dec') return isConvexOuter ? k.concave : k.convex;
            return false;
          });
          const convex = (at.curv === 'convex' || at.curv === 'affine') && cond(true);
          const concave = (at.curv === 'concave' || at.curv === 'affine') && cond(false);
          const posOK = !at.needsPos || kids.every((k) => k.sign === 'nn');
          return { e, convex: convex && posOK, concave: concave && posOK, sign: at.sign(kids.map((k) => k.sign)), kids, name: e.op, str: at.tex(...kids.map((k) => k.str)), val: (x, y) => at.f(...kids.map((k) => k.val(x, y))) };
        };
        const S = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, title: 'expression tree with inferred curvature' });
        const pos = (a) => a;
        let info = {};
        v.render(() => {
          if (sel.value !== prevSel.v) { prevSel.v = sel.value; hist.length = 0; E = PRE[sel.value]; }
          const A = ana(E);
          // layout
          let leaf = 0; const depthMax = (n) => (n.kids.length ? 1 + Math.max(...n.kids.map(depthMax)) : 0);
          const D = depthMax(A);
          const lay = (n, d) => { if (!n.kids.length) { n.px = leaf++; } else { n.kids.forEach((k) => lay(k, d + 1)); n.px = n.kids.reduce((s, k) => s + k.px, 0) / n.kids.length; } n.d = d; };
          lay(A, 0);
          const nl = Math.max(1, leaf), X = (p) => (nl === 1 ? 5 : 1.2 + (7.6 * p) / (nl - 1)), Y = (d) => 5.2 - (D === 0 ? 0 : (4.2 * d) / D);
          const col = (n) => (n.convex && n.concave ? 'muted' : n.convex ? 'blue' : n.concave ? 'orange' : 'red');
          const lab = (n) => (n.convex && n.concave ? 'affine' : n.convex ? 'convex' : n.concave ? 'concave' : 'rejected');
          const draw = (n) => {
            n.kids.forEach((k) => { S.segment([X(n.px), Y(n.d)], [X(k.px), Y(k.d)], { color: 'muted', width: 1.4 }); draw(k); });
            S.dot(X(n.px), Y(n.d), { r: 15, color: col(n) });
            S.text(n.kids.length ? n.name : n.name, X(n.px), Y(n.d), { size: 12, color: 'panel', align: 'center', baseline: 'middle' });
            S.text(lab(n), X(n.px), Y(n.d) - 0.5, { size: 11, color: col(n), align: 'center' });
          };
          draw(A);
          // numeric chord test on [0.2,4]^2
          const f = (x, y) => A.val(x, y);
          const cc = chordTest2(f, [0.2, 0.2, 4, 4], { seed: 9, n: 2500 });
          const nf = chordTest2((x, y) => -f(x, y), [0.2, 0.2, 4, 4], { seed: 9, n: 2500 });
          const numerics = cc.tested < 100 ? 'undefined' : cc.bad === 0 && nf.bad === 0 ? 'affine' : cc.bad === 0 ? 'convex' : nf.bad === 0 ? 'concave' : 'neither';
          info = { A, dcp: lab(A), numerics, str: A.str };
        });
        v.readout(() => {
          const { dcp, numerics, str } = info;
          const dcpWord = dcp === 'rejected' ? 'neither (rejected)' : dcp;
          const agree = dcp === numerics || (dcp === 'affine' && false);
          const flag = dcp === 'rejected' && numerics !== 'neither' && numerics !== 'undefined' ? ' — the sampled chords suggest ' + numerics + ' behaviour; sampling alone does not prove it.' : dcp !== 'rejected' && dcp !== numerics && !(dcp === 'convex' && numerics === 'affine') && !(dcp === 'concave' && numerics === 'affine') ? ' — check the numerics.' : '.';
          return `$f(x,y)=${str}$\nDCP verdict: **${dcpWord}**. Sampled chord classification on $[0.2,4]^2$: **${numerics}**${flag}`;
        });
      },
    },
  ],
};
