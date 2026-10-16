// Ordinary Differential Equations & Dynamical Systems — Chapter 2: Existence, uniqueness and dependence on data
import { flow, flowEnd, scalarFlow, cumInt, spline, sampleAt, PLANAR, norm2 } from './ch02.shared.js';

export default {
  collection: 'ode',
  chapter: 2,
  title: 'Existence, uniqueness and dependence on data',
  summary: String.raw`Rewriting an initial value problem as an integral equation turns it into a fixed-point problem, and when the vector field is Lipschitz in the state the Picard iteration is a contraction: a unique solution exists, at least for a short time. Without the Lipschitz condition, compactness (Peano's theorem) still gives existence but not uniqueness. Grönwall's inequality quantifies how fast two nearby solutions can separate, which yields continuous and differentiable dependence on initial data and parameters, and solutions can be continued until they leave every compact set.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Lipschitz continuity in the state variable',
      statement: String.raw`Let $U\subset\R\times\R^n$ be open and $f:U\to\R^n$. The map $f$ is *Lipschitz in the state variable $x$* on a set $K\subset U$ if there is a constant $L\ge0$ with
$$|f(t,x)-f(t,y)|\le L\,|x-y|\qquad\text{whenever }(t,x),(t,y)\in K.$$
It is *locally Lipschitz* if every point of $U$ has a neighbourhood on which this holds (with a constant that may change from point to point). In one dimension the inequality says: the graph of $x\mapsto f(t,x)$ lies, for every point $p$ on it, inside the double cone through $p$ of slopes $\pm L$. Continuously differentiable functions are locally Lipschitz, and $L=\sup|\partial_xf|$ works on convex sets; but Lipschitz functions need not be differentiable ($|x|$), and continuous ones need not be Lipschitz ($\sqrt{|x|}$ at $0$).`,
      idea: String.raw`The difference quotients $|f(x)-f(y)|/|x-y|$ are the slopes of chords of the graph; Lipschitz continuity says all chords have slope at most $L$. By the mean value theorem (Rudin 5.10) a bounded derivative on an interval gives such an $L$; conversely a cusp such as $\sqrt{|x|}$ has chords from the origin of slope $1/\sqrt{|y|}\to\infty$, so no finite $L$ exists. This is exactly the quantitative condition that makes the Picard map a contraction in the next items.`,
      caption: String.raw`Drag the point along the graph: the shaded double cone has slopes $\pm L$ (slide $L$). Where the graph leaves the cone it turns red. For $\sin 2x$ and $|x|$ a big enough $L$ keeps everything inside; for $x^2$ the cone must widen as the window grows; for $\sqrt{|x|}$ at the cusp no $L$ is enough.`,
      deps: ['pma-9.19'],
      refs: ['Teschl §2.2'],
      tags: ['lipschitz', 'regularity'],
      viz(v) {
        const FS = {
          sin: { label: '$\\sin 2x$', f: (x) => Math.sin(2 * x), note: 'differentiable, $|f\'|\\le2$' },
          abs: { label: '$|x|$', f: (x) => Math.abs(x), note: 'a corner, but slopes $\\pm1$' },
          sq: { label: '$x^2$', f: (x) => x * x, note: 'Lipschitz on bounded windows only' },
          sqrt: { label: '$\\sqrt{|x|}$', f: (x) => Math.sqrt(Math.abs(x)), note: 'infinite slope at the cusp' },
        };
        const which = v.select('$f(x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const L = v.slider('$L$', 0.2, 6, 1.5, { step: 0.05 });
        const s = v.stage({ x: [-2, 2], y: [-1.5, 3.5], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x', ylabel: 'f(x)', title: 'the cone of slope $L$ through a point of the graph' });
        const P = s.handle(0.4, FS.sin.f(0.4), { color: 'accent', label: 'p', labelPos: 'nw', constrain: (x) => { const xx = Math.max(-1.95, Math.min(1.95, x)); return [xx, FS[which.value].f(xx)]; } });
        v.legend([['accent', 'graph inside the cone'], ['red', 'graph outside the cone'], ['orange', 'cone of slope $\\pm L$']]);
        const maxSlope = (f, n) => { let m = 0; for (let i = 0; i < n; i++) { const a = -2 + (4 * i) / n, b = -2 + (4 * (i + 1)) / n; m = Math.max(m, Math.abs(f(b) - f(a)) / (b - a)); } return m; };
        let info = null;
        v.render(() => {
          const f = FS[which.value].f, p = P.x, fp = f(p), l = L.value;
          P.set(p, fp);
          const xl = -2.05, xr = 2.05;
          s.poly([[xl, fp + l * (p - xl)], [p, fp], [xr, fp + l * (xr - p)], [xr, fp - l * (xr - p)], [p, fp], [xl, fp - l * (p - xl)]], { fill: 'orange', fillAlpha: 0.16, stroke: false });
          s.line(xl, fp + l * (p - xl), xr, fp - l * (xr - p), { color: 'orange', width: 1.6 });
          s.line(xl, fp - l * (p - xl), xr, fp + l * (xr - p), { color: 'orange', width: 1.6 });
          const N = 800, bad = [];
          let cur = [];
          for (let i = 0; i <= N; i++) {
            const x = -2 + (4 * i) / N, y = f(x), out = Math.abs(y - fp) > l * Math.abs(x - p) + 1e-9;
            if (out) { cur.push([x, y]); } else if (cur.length) { bad.push(cur); cur = []; }
          }
          if (cur.length) bad.push(cur);
          s.fn(f, { color: 'accent', width: 2.6, domain: [-2, 2], n: 600 });
          for (const r of bad) if (r.length > 1) s.path(r, { color: 'red', width: 4 });
          s.dot(p, fp, { r: 5, color: 'accent' });
          // sup of chord slopes from p
          let q = 0;
          for (let i = 0; i <= 2000; i++) { const x = -2 + (4 * i) / 2000; if (Math.abs(x - p) > 1e-12) q = Math.max(q, Math.abs(f(x) - fp) / Math.abs(x - p)); }
          for (let k = 1; k <= 9; k++) for (const sg of [-1, 1]) { const x = p + sg * Math.pow(10, -k); if (x >= -2 && x <= 2) q = Math.max(q, Math.abs(f(x) - fp) / Math.abs(x - p)); }
          const g1 = maxSlope(f, 400), g2 = maxSlope(f, 6400);
          info = { q, g1, g2, l, out: bad.length > 0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { q, g1, g2, l, out } = info;
          const unb = g2 > 1.8 * g1;
          return `Steepest chord from $p$: $\\sup_y\\frac{|f(y)-f(p)|}{|y-p|}${unb && q > 20 ? '\\ge' : '='}${v.fix(q, 2)}$ — ${out ? 'bigger than' : 'at most'} $L=${v.fix(l, 2)}$, so the graph ${out ? 'leaves' : 'stays in'} the cone.\n` +
            (unb ? `On the whole window the chord slopes keep growing as the grid is refined ($${v.fix(g1, 1)}\\to${v.fix(g2, 1)}$): **no finite $L$ works**.` : `On the whole window the largest chord slope is $${v.fix(g2, 3)}$: $L\\ge${v.fix(g2, 2)}$ makes the cone contain the graph from every point.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Equivalence with an integral equation',
      statement: String.raw`Let $f:U\to\R^n$ be continuous, $(t_0,x_0)\in U$, and $\varphi:I\to\R^n$ continuous on an interval $I\ni t_0$ with graph in $U$. Then $\varphi$ is a ($C^1$) solution of the initial value problem $\dot x=f(t,x)$, $x(t_0)=x_0$, if and only if
$$\varphi(t)=x_0+\int_{t_0}^{t}f\big(s,\varphi(s)\big)\,ds\qquad(t\in I).$$`,
      idea: String.raw`If $\varphi$ solves the IVP, then $\varphi'=f(t,\varphi)$ is continuous, and the fundamental theorem of calculus (Rudin 6.21) integrates it from $t_0$. Conversely, if $\varphi$ is continuous the integrand $s\mapsto f(s,\varphi(s))$ is continuous, so the right-hand side is differentiable with derivative $f(t,\varphi(t))$ and takes the value $x_0$ at $t_0$. The point of the reformulation: the integral equation only needs *continuous* curves, and it exhibits solutions as fixed points of a map.`,
      caption: String.raw`Drag the four blue handles to deform the candidate curve $\varphi$ (blue). The orange curve is $\Phi(t)=x_0+\int_0^t f(s,\varphi(s))\,ds$ computed from it; the lower panel plots their gap and the residual $\dot\varphi-f(t,\varphi)$. They vanish together. "Apply the map" replaces $\varphi$ by $\Phi$ (one Picard step); "Snap" jumps to the true solution.`,
      deps: ['ode-1.1', 'pma-6.21'],
      refs: ['Teschl §2.2'],
      tags: ['integral equation', 'fixed point'],
      viz(v) {
        const T = 1.6;
        const FS = {
          lin: { label: '$x$', f: (t, x) => x },
          drv: { label: '$\\cos 3t - x$', f: (t, x) => Math.cos(3 * t) - x },
          sq: { label: '$x^2$', f: (t, x) => x * x },
        };
        const which = v.select('$\\dot x=f(t,x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const x0s = v.slider('$x_0$', 0.1, 1.2, 0.6, { step: 0.01 });
        const s = v.stage({ x: [0, T], y: [-1.2, 4.2], axes: 'box', gutter: true, height: 330, xlabel: 't', ylabel: 'x', title: 'a candidate curve and its image under the integral map', weight: 1.6 });
        const sg = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', gutter: true, height: 330, xlabel: 't', title: 'gap and residual', weight: 1, minWidth: 220 });
        const ts = [0.4, 0.8, 1.2, 1.6];
        const H = ts.map((t, i) => s.handle(t, 0.6 + 0.3 * (i + 1), { color: 'accent', constrain: (x, y) => [t, Math.max(-1.1, Math.min(4.1, y))] }));
        const X0 = s.handle(0, 0.6, { color: 'ink', label: '$x_0$', labelPos: 'ne', constrain: (x, y) => [0, Math.max(0.1, Math.min(1.2, y))] });
        X0.onDrag = () => x0s.set(X0.y);
        const exactOf = (E, x0) => scalarFlow(E.f, 0, x0, T, 400, 50);
        const snap = () => { const E = FS[which.value], ex = exactOf(E, x0s.value); ts.forEach((t, i) => H[i].set(t, sampleAt(ex, Math.min(t, ex[ex.length - 1][0])))); };
        const apply = () => {
          const E = FS[which.value], phi = curve(), N = 320, h = T / N, g = [];
          for (let i = 0; i <= N; i++) g.push(E.f(i * h, phi(i * h)));
          const Ph = cumInt(g, h, x0s.value);
          ts.forEach((t, i) => H[i].set(t, Ph[Math.round(t / h)]));
        };
        v.button('Apply the map (φ ← Φ)', apply);
        v.button('Snap to the true solution', snap);
        const curve = () => spline([0, ...ts], [x0s.value, ...H.map((h) => h.y)]);
        v.legend([['accent', 'candidate $\\varphi$'], ['orange', '$\\Phi=x_0+\\int f(s,\\varphi)\\,ds$'], ['green', 'true solution', { dash: true }], ['red', 'gap $\\varphi-\\Phi$'], ['purple', 'residual $\\dot\\varphi-f$']]);
        let info = null;
        v.render(() => {
          const E = FS[which.value], x0 = x0s.value;
          X0.set(0, x0);
          const phi = curve(), N = 320, h = T / N, g = [], pv = [], pts = [], res = [];
          for (let i = 0; i <= N; i++) { const t = i * h, p = phi(t); pv.push(p); g.push(E.f(t, p)); }
          const Ph = cumInt(g, h, x0);
          for (let i = 0; i <= N; i++) { pts.push([i * h, Ph[i]]); }
          const dd = 1e-4;
          for (let i = 0; i <= N; i++) { const t = i * h, dp = (phi(Math.min(T, t + dd)) - phi(Math.max(0, t - dd))) / (Math.min(T, t + dd) - Math.max(0, t - dd)); res.push([t, dp - g[i]]); }
          const ex = exactOf(E, x0);
          s.clip(() => {
            s.path(ex, { color: 'green', width: 2, dash: [6, 4] });
            s.path(pv.map((p, i) => [i * h, p]), { color: 'accent', width: 2.8 });
            s.path(pts, { color: 'orange', width: 2.6 });
            for (let i = 0; i <= N; i += 8) s.line(i * h, pv[i], i * h, Ph[i], { color: 'red', width: 1, alpha: 0.45 });
          });
          const gap = pv.map((p, i) => [i * h, p - Ph[i]]);
          let mg = 0, mr = 0;
          for (const [, q] of gap) mg = Math.max(mg, Math.abs(q));
          for (const [, q] of res) mr = Math.max(mr, Math.abs(q));
          const R = Math.max(0.25, Math.min(6, 1.2 * Math.max(mg, mr)));
          sg.setView([0, T], [-R, R]);
          sg.hline(0, { color: 'muted', width: 1 });
          sg.path(gap, { color: 'red', width: 2.4 });
          sg.path(res.slice(2, -2), { color: 'purple', width: 2 });
          info = { mg, mr, Ph, N };
        });
        v.readout(() => {
          if (!info) return '';
          return `$\\sup_t|\\varphi-\\Phi|=${v.fix(info.mg, 4)}$ and $\\sup_t|\\dot\\varphi-f(t,\\varphi)|=${v.fix(info.mr, 4)}$. The gap $g=\\varphi-\\Phi$ satisfies $g(0)=0$, $g'=\\dot\\varphi-f(t,\\varphi)$ (the purple curve is its derivative): $\\varphi$ is a fixed point of the map exactly when it solves the ODE.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Method',
      name: 'Picard iteration',
      statement: String.raw`To solve $\dot x=f(t,x)$, $x(t_0)=x_0$, start from the constant function $\varphi_0\equiv x_0$ and iterate
$$\varphi_{k+1}(t)=x_0+\int_{t_0}^{t}f\big(s,\varphi_k(s)\big)\,ds .$$
For $f$ continuous and Lipschitz in $x$ on a box around $(t_0,x_0)$, the iterates are continuous, stay in the box on a short interval $|t-t_0|\le\delta$, and converge uniformly to the solution, with
$$\sup_{|t-t_0|\le\delta}|\varphi_{k+1}-\varphi_k|\le M\,\frac{L^{k}\delta^{k+1}}{(k+1)!},$$
where $M=\sup|f|$ and $L$ is the Lipschitz constant on the box.`,
      idea: String.raw`Each application of the integral map (2.2) gains one factor $L|t-t_0|$ from the Lipschitz bound and one integration: $|\varphi_{k+1}-\varphi_k|(t)\le L\int|\varphi_k-\varphi_{k-1}|$, which by induction gives the bound $ML^k|t-t_0|^{k+1}/(k+1)!$. The factorials make $\sum\sup|\varphi_{k+1}-\varphi_k|$ converge for every $L$ and every interval (when $f$ is globally Lipschitz), so the iterates form a uniformly Cauchy sequence (Rudin 7.15) of continuous functions; the limit solves the integral equation.`,
      caption: String.raw`Choose an equation and raise $k$ to add iterates. For $\dot x=x$ they are exactly the Taylor polynomials of $e^t$. The right panel plots $\sup|\varphi_{k+1}-\varphi_k|$ on a log scale together with the factorial bound. For $\dot x=x^2$ (only locally Lipschitz) lengthen the interval past $t=1/x_0$: the iterates stop converging.`,
      deps: ['ode-2.2'],
      refs: ['Teschl §2.2'],
      tags: ['picard', 'iteration'],
      viz(v) {
        const FS = {
          lin: { label: '$\\dot x=x$', f: (t, x) => x, ex: (t, x0) => x0 * Math.exp(t) },
          tx: { label: '$\\dot x=tx$', f: (t, x) => t * x, ex: (t, x0) => x0 * Math.exp((t * t) / 2) },
          sq: { label: '$\\dot x=x^2$', f: (t, x) => x * x, ex: (t, x0) => x0 / (1 - x0 * t) },
        };
        const which = v.select('equation', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const kk = v.slider('number of iterations $k$', 0, 10, 3, { int: true });
        const x0s = v.slider('$x_0$', 0.2, 1.5, 1, { step: 0.01 });
        const Ts = v.slider('interval $[0,T]$', 0.3, 2.5, 1.4, { step: 0.01 });
        const KMAX = 12;
        const s = v.stage({ x: [0, 2.5], y: [0, 6], axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: 'Picard iterates $\\varphi_0,\\dots,\\varphi_k$', weight: 1.5 });
        const sd = v.stage({ x: [0, KMAX], y: [1e-9, 1e2], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'k', ylabel: 'sup distance', title: '$\\sup|\\varphi_{k+1}-\\varphi_k|$', weight: 1, minWidth: 240 });
        v.legend([['muted', 'earlier iterates'], ['accent', '$\\varphi_k$'], ['green', 'true solution', { dash: true }], ['orange', 'factorial bound $M L^k T^{k+1}/(k+1)!$']]);
        let info = null;
        v.render(() => {
          const E = FS[which.value], x0 = x0s.value, T = Ts.value, N = 300, h = T / N, k = kk.value;
          const its = [new Array(N + 1).fill(x0)];
          for (let j = 0; j < KMAX; j++) {
            const prev = its[j], g = prev.map((p, i) => E.f(i * h, p));
            its.push(cumInt(g, h, x0));
          }
          const dist = [];
          for (let j = 0; j < KMAX; j++) { let m = 0; for (let i = 0; i <= N; i++) m = Math.max(m, Math.abs(its[j + 1][i] - its[j][i])); dist.push(m); }
          // Lipschitz constant and sup|f| on the region swept by the first iterates
          let Lc = 0, M = 0;
          for (let j = 0; j <= Math.min(k + 1, KMAX); j++) for (let i = 0; i <= N; i += 3) { const x = its[j][i], t = i * h, d = 1e-5 * Math.max(1, Math.abs(x)); Lc = Math.max(Lc, Math.abs(E.f(t, x + d) - E.f(t, x - d)) / (2 * d)); M = Math.max(M, Math.abs(E.f(t, x))); }
          const ex = []; let exMax = T;
          for (let i = 0; i <= N; i++) { const t = i * h, y = E.ex(t, x0); if (!isFinite(y) || y < 0 || y > 40) { exMax = t; break; } ex.push([t, y]); }
          s.clip(() => {
            for (let j = 0; j < k; j++) s.path(its[j].map((p, i) => [i * h, p]), { color: 'muted', width: 1.3, alpha: 0.5 });
            s.path(ex, { color: 'green', width: 2, dash: [6, 4] });
            s.path(its[k].map((p, i) => [i * h, p]), { color: 'accent', width: 2.8 });
          });
          s.vline(T, { color: 'orange', width: 1, dash: [4, 4] });
          if (which.value === 'sq') s.vline(1 / x0, { color: 'red', width: 1.4, dash: [6, 4] });
          // distance plot
          const pts = dist.map((d, j) => [j, Math.max(d, 1e-9)]);
          sd.path(pts, { color: 'accent', width: 2 });
          dist.forEach((d, j) => sd.dot(j, Math.max(d, 1e-9), { r: j === k ? 6 : 3.5, color: j === k ? 'gold' : 'accent' }));
          const bd = []; let fac = 1;
          for (let j = 0; j < KMAX; j++) { if (j > 0) fac *= j; bd.push([j, Math.max(1e-9, M * Math.pow(Lc, j) * Math.pow(T, j + 1) / (fac * (j + 1)))]); }
          sd.path(bd, { color: 'orange', width: 2, dash: [5, 4] });
          let err = 0;
          for (const [t, y] of ex) { const i = Math.round(t / h); err = Math.max(err, Math.abs(its[k][i] - y)); }
          info = { err, exMax, Lc, M, d: dist[Math.min(k, KMAX - 1)], T, x0 };
        });
        v.readout(() => {
          if (!info) return '';
          const { err, Lc, M, d, T, x0 } = info;
          let r = `$k=${kk.value}$: $\\sup|\\varphi_k-x|=${v.sci(Math.max(err, 1e-16), 2)}$ on $[0,${v.fix(T, 2)}]$, $\\ \\sup|\\varphi_{k+1}-\\varphi_k|=${v.sci(Math.max(d, 1e-16), 2)}$; $M\\approx${v.fix(M, 2)}$, $L\\approx${v.fix(Lc, 2)}$ on the region swept by the iterates.`;
          if (which.value === 'sq' && T > 1 / x0) r += `\nThe true solution blows up at $t=1/x_0=${v.fix(1 / x0, 3)}$: beyond it no iterate can converge.`;
          if (which.value === 'lin') r += `\nHere $\\varphi_k(t)=x_0\\sum_{j\\le k}t^j/j!$.`;
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Picard–Lindelöf theorem',
      statement: String.raw`Let $f$ be continuous on the box $R=\{|t-t_0|\le a,\ |x-x_0|\le b\}\subset\R\times\R^n$ and Lipschitz in $x$ on $R$ with constant $L$. Put $M=\max_R|f|$ and $\delta=\min(a,b/M)$. Then the initial value problem $\dot x=f(t,x)$, $x(t_0)=x_0$ has exactly one solution on $[t_0-\delta,t_0+\delta]$. Equivalently, the Picard map $P\varphi=x_0+\int_{t_0}^tf(s,\varphi(s))\,ds$ is a contraction on the complete metric space $C([t_0-\delta,t_0+\delta])$ with the weighted norm $\|u\|_w=\sup_t e^{-2L|t-t_0|}|u(t)|$, with contraction factor $\tfrac12$.`,
      idea: String.raw`The weight $e^{-2L|t-t_0|}$ is chosen so that $\int_{t_0}^te^{2Ls}\,ds\le e^{2Lt}/(2L)$, which makes $\|P\varphi-P\psi\|_w\le L\cdot\frac1{2L}\|\varphi-\psi\|_w$: a contraction with factor $\tfrac12$, whatever the length of the interval. The weighted norm is equivalent to the sup norm, so the space of continuous curves (uniformly convergent sequences stay continuous, Rudin 7.15) is complete (Rudin 9.23: Banach fixed-point theorem), and the box condition $\delta\le b/M$ keeps $P$ inside the ball. The fixed point is the solution, and uniqueness is uniqueness of the fixed point.`,
      caption: String.raw`Drag the two blue handles on the left edge: two different constant initial guesses. Both are pushed through the Picard map $k$ times. The right panel plots their distance in the sup norm (it may grow at first if $LT>1$, then collapses factorially) and in the weighted norm (it shrinks by at least $\tfrac12$ every step, always). For $\dot x=x^2$ the Lipschitz constant is only local: make the interval long and the weighted ratio (measured with $L$ on the region the iterates visit) stops being tidy.`,
      deps: ['ode-2.3', 'ode-2.1', 'pma-9.23', 'pma-7.15'],
      refs: ['Teschl §2.2'],
      tags: ['contraction', 'existence'],
      viz(v) {
        const FS = {
          lin: { label: '$x$', f: (x) => x },
          sin: { label: '$2\\sin x$', f: (x) => 2 * Math.sin(x) },
          sq: { label: '$x^2$', f: (x) => x * x },
        };
        const which = v.select('$\\dot x=f(x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const Ts = v.slider('interval $[0,T]$', 0.2, 3, 1.5, { step: 0.01 });
        const kk = v.slider('iterations $k$', 0, 8, 2, { int: true });
        const KM = 9, TV = 3;
        const s = v.stage({ x: [-0.15, TV], y: [-2, 4], axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: '$P^k\\varphi_a$ and $P^k\\varphi_b$', weight: 1.5 });
        const sd = v.stage({ x: [0, KM], y: [1e-9, 1e3], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'k', ylabel: 'distance', title: 'distance of the images', weight: 1, minWidth: 240 });
        const A = s.handle(0, 2.4, { color: 'accent', label: '$\\varphi_a$', labelPos: 'ne', constrain: (x, y) => [0, Math.max(-1.9, Math.min(3.9, y))] });
        const B = s.handle(0, -1.0, { color: 'purple', label: '$\\varphi_b$', labelPos: 'ne', constrain: (x, y) => [0, Math.max(-1.9, Math.min(3.9, y))] });
        const x0 = 0.5;
        v.legend([['accent', '$P^k\\varphi_a$'], ['purple', '$P^k\\varphi_b$'], ['ink', 'sup norm', { dot: true }], ['green', 'weighted norm $e^{-2Lt}$', { dot: true }], ['orange', 'factor $\\tfrac12$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const f = FS[which.value].f, T = Ts.value, N = 300, h = T / N, k = kk.value;
          A.set(0, A.y); B.set(0, B.y);
          let a = new Array(N + 1).fill(A.y), b = new Array(N + 1).fill(B.y);
          const P = (u) => cumInt(u.map((p) => f(p)), h, x0);
          const pa = [a], pb = [b];
          for (let j = 0; j < KM; j++) { a = P(a); b = P(b); pa.push(a); pb.push(b); }
          // Lipschitz constant on the region visited by the first iterates
          let lo = Infinity, hi = -Infinity;
          for (let j = 0; j <= Math.min(KM, k + 1); j++) for (const arr of [pa[j], pb[j]]) for (const q of arr) { lo = Math.min(lo, q); hi = Math.max(hi, q); }
          let Lc = 0; for (let i = 0; i <= 400; i++) { const x = lo + ((hi - lo) * i) / 400, d = 1e-5; Lc = Math.max(Lc, Math.abs(f(x + d) - f(x - d)) / (2 * d)); }
          const w = (i) => Math.exp(-2 * Lc * i * h);
          const dS = [], dW = [];
          for (let j = 0; j <= KM; j++) { let m = 0, mw = 0; for (let i = 0; i <= N; i++) { const d = Math.abs(pa[j][i] - pb[j][i]); m = Math.max(m, d); mw = Math.max(mw, d * w(i)); } dS.push(m); dW.push(mw); }
          const tr = (u) => u.map((q, i) => [i * h, q]);
          s.clip(() => {
            if (k > 0) { s.path(tr(pa[0]), { color: 'accent', width: 1, alpha: 0.3 }); s.path(tr(pb[0]), { color: 'purple', width: 1, alpha: 0.3 }); }
            s.path(tr(pa[k]), { color: 'accent', width: 2.8 }); s.path(tr(pb[k]), { color: 'purple', width: 2.8 });
          });
          s.vline(T, { color: 'orange', width: 1.2, dash: [4, 4] });
          const fl = (arr) => arr.map((q, j) => [j, Math.max(q, 1e-9)]);
          sd.path(fl(dS), { color: 'ink', width: 1.8 }); sd.path(fl(dW), { color: 'green', width: 2.2 });
          dS.forEach((q, j) => sd.dot(j, Math.max(q, 1e-9), { r: j === k ? 6 : 3.2, color: 'ink' }));
          dW.forEach((q, j) => sd.dot(j, Math.max(q, 1e-9), { r: j === k ? 6 : 3.2, color: 'green' }));
          const half = []; for (let j = 0; j <= KM; j++) half.push([j, Math.max(1e-9, dW[0] * Math.pow(0.5, j))]);
          sd.path(half, { color: 'orange', width: 1.8, dash: [5, 4] });
          let rmax = 0; for (let j = 0; j < KM; j++) if (dW[j] > 1e-12) rmax = Math.max(rmax, dW[j + 1] / dW[j]);
          info = { Lc, rS: dS[0] > 0 ? dS[1] / dS[0] : 0, rmax, dS, dW, T };
        });
        v.readout(() => {
          if (!info) return '';
          const { Lc, rS, rmax, dS, dW, T } = info;
          return `$L\\approx${v.fix(Lc, 2)}$ on the region swept, $LT=${v.fix(Lc * T, 2)}$. Sup-norm distance: $${v.sci(dS[0], 2)}\\to${v.sci(dS[1], 2)}$ after one step (ratio $${v.fix(rS, 2)}$${Lc * T > 1 ? ', may exceed 1 for a long interval' : ''}). Weighted distance after $k=${kk.value}$ steps: $${v.sci(dW[kk.value], 2)}$; largest one-step ratio $${v.fix(rmax, 3)}\\le\\tfrac12$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Lemma',
      name: 'Grönwall’s inequality',
      statement: String.raw`Let $u,k:[0,T]\to[0,\infty)$ be continuous and $a\ge0$ a constant. If
$$u(t)\le a+\int_0^tk(s)\,u(s)\,ds\qquad\text{for all }t\in[0,T],$$
then
$$u(t)\le a\,\exp\Big(\int_0^tk(s)\,ds\Big)\qquad\text{for all }t\in[0,T].$$
Equality holds for $u(t)=a\,e^{\int_0^tk}$. (If $a$ is replaced by a nondecreasing function $\alpha(t)$ the bound becomes $\alpha(t)e^{\int_0^tk}$.)`,
      idea: String.raw`Write $R(t)=a+\int_0^tku$. Then $R'=ku\le kR$ (using $u\le R$ and $k\ge0$), so $(Re^{-\int k})'\le0$ and $R(t)\le R(0)e^{\int_0^tk}=ae^{\int_0^tk}$; finally $u\le R$. The inequality of the hypothesis turns an integral condition into a differential inequality for $R$, which integrates by the fundamental theorem of calculus (Rudin 6.21).`,
      caption: String.raw`Drag the five blue handles to draw a nonnegative function $u$. The orange curve is $a+\int_0^t ku$ and the green curve is the envelope $a\,e^{\int k}$. While blue stays below orange, it also stays below green. Push $u$ above orange (it turns red) and it can escape the envelope. "Extremal" puts $u$ on the envelope itself.`,
      deps: ['pma-6.21'],
      refs: ['Teschl §2.4'],
      tags: ['inequality', 'growth'],
      viz(v) {
        const T = 2.5, ts = [0, 0.625, 1.25, 1.875, 2.5];
        const KS = { const: { label: '$k$ constant', k: (t, k0) => k0, K: (t, k0) => k0 * t }, pulse: { label: '$k(t)=k_0(1+\\sin 3t)$', k: (t, k0) => k0 * (1 + Math.sin(3 * t)), K: (t, k0) => k0 * (t + (1 - Math.cos(3 * t)) / 3) } };
        const kind = v.select('coefficient', Object.entries(KS).map(([value, o]) => ({ value, label: o.label })), 'const');
        const a = v.slider('$a$', 0.2, 2, 1, { step: 0.01 });
        const k0 = v.slider('$k_0$', 0, 1.2, 0.7, { step: 0.01 });
        const s = v.stage({ x: [0, T], y: [0, 9], axes: 'box', gutter: true, height: 360, xlabel: 't', title: '$u$, the integral bound, and the exponential envelope' });
        const env = (t) => a.value * Math.exp(KS[kind.value].K(t, k0.value));
        const H = ts.map((t, i) => s.handle(t, 0.6 * env(t), { color: 'accent', constrain: (x, y) => [t, Math.max(0, Math.min(8.8, y))] }));
        const place = (fr) => ts.forEach((t, i) => H[i].set(t, fr * env(t)));
        v.button('Extremal: $u=a\\,e^{\\int k}$', () => place(1));
        v.button('Reset (60% of envelope)', () => place(0.6));
        v.legend([['accent', '$u$'], ['orange', '$a+\\int_0^t ku$'], ['green', '$a\\,e^{\\int_0^t k}$'], ['red', 'hypothesis violated']]);
        let info = null;
        v.render(() => {
          const N = 250, h = T / N, K = KS[kind.value], kv = (t) => K.k(t, k0.value);
          const u = spline(ts, H.map((q) => q.y)), U = [], g = [];
          for (let i = 0; i <= N; i++) { const t = i * h, q = Math.max(0, u(t)); U.push(q); g.push(kv(t) * q); }
          const R = cumInt(g, h, a.value);
          const pe = [], pu = [], pr = [], badRuns = []; let cur = [], viol = -Infinity, over = -Infinity;
          for (let i = 0; i <= N; i++) {
            const t = i * h, e = env(t); pe.push([t, e]); pu.push([t, U[i]]); pr.push([t, R[i]]);
            viol = Math.max(viol, U[i] - R[i]); over = Math.max(over, U[i] - e);
            if (U[i] > R[i] + 2e-3 * a.value) cur.push([t, U[i]]); else if (cur.length) { badRuns.push(cur); cur = []; }
          }
          if (cur.length) badRuns.push(cur);
          s.clip(() => {
            s.between((t) => env(t), () => 0, 0, T, { fill: 'green', fillAlpha: 0.06 });
            s.path(pe, { color: 'green', width: 2.6 });
            s.path(pr, { color: 'orange', width: 2.2 });
            s.path(pu, { color: 'accent', width: 2.8 });
            for (const r of badRuns) if (r.length > 1) s.path(r, { color: 'red', width: 4.5 });
          });
          info = { viol, over, hyp: viol <= 2e-3 * a.value };
        });
        v.readout(() => {
          if (!info) return '';
          const { viol, over, hyp } = info;
          return `Hypothesis $u\\le a+\\int ku$: ${hyp ? 'holds everywhere' : `**fails** (largest excess $${v.fix(viol, 3)}$)`}. Conclusion $u\\le ae^{\\int k}$: ${over <= 1e-3 ? 'holds' : '**fails**'} (largest $u-\\text{envelope}$ is $${v.fix(over, 3)}$).${hyp && over > 1e-3 ? ' (numerical slack)' : ''}${!hyp && over <= 1e-3 ? ' The conclusion can hold by luck; only the hypothesis implies it.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Continuous dependence on initial conditions',
      statement: String.raw`Let $f$ be continuous and Lipschitz in $x$ with constant $L$ on a convex region containing the graphs of two solutions $\varphi,\psi$ of $\dot x=f(t,x)$ on $[t_0,t_1]$. Then
$$|\varphi(t)-\psi(t)|\le|\varphi(t_0)-\psi(t_0)|\,e^{L(t-t_0)}\qquad(t_0\le t\le t_1).$$
Consequently the solution depends continuously on the initial data: for every $\varepsilon>0$ there is $\eta>0$ such that $|x_0-y_0|<\eta$ implies $|\varphi(t;x_0)-\varphi(t;y_0)|<\varepsilon$ throughout $[t_0,t_1]$, and the flow map $x_0\mapsto\varphi(t;x_0)$ is Lipschitz with constant $e^{L|t-t_0|}$.`,
      idea: String.raw`Subtract the two integral equations (2.2): $u(t)=|\varphi(t)-\psi(t)|$ satisfies $u(t)\le u(t_0)+\int_{t_0}^tL\,u(s)\,ds$ by the Lipschitz bound. Grönwall's inequality (2.5) with $a=u(t_0)$ and $k=L$ gives the exponential bound at once. The constant $L$ is a worst-case rate: a real pair of solutions typically separates more slowly, and can even converge.`,
      caption: String.raw`Drag the two points on the phase plane: they are the initial states of two solutions. The right panel plots their separation on a log scale against the Grönwall bound $|\Delta x_0|e^{Lt}$, which it never crosses ($L$ is measured as the largest operator norm of $Df$ on the region the two trajectories occupy). Move the points together and the bound tightens; watch the pendulum separation shrink (damping) while the bound keeps growing.`,
      deps: ['ode-2.4', 'ode-2.5'],
      refs: ['Teschl §2.4'],
      tags: ['continuous dependence', 'stability'],
      viz(v) {
        const which = v.select('system', Object.entries(PLANAR).map(([value, o]) => ({ value, label: o.label })), 'pend');
        const Ts = v.slider('time horizon $T$', 1, 10, 6, { step: 0.1 });
        const s = v.stage({ x: PLANAR.pend.view[0], y: PLANAR.pend.view[1], axes: 'box', gutter: true, height: 340, xlabel: 'x', ylabel: 'y', title: 'two solutions in the phase plane', weight: 1.2 });
        const sd = v.stage({ x: [0, 10], y: [1e-5, 1e4], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'distance', title: 'separation versus Grönwall bound', weight: 1.2, minWidth: 260 });
        const A = s.handle(1.2, 0.4, { color: 'accent', label: '$x_0$', labelPos: 'nw' });
        const B = s.handle(1.4, 0.4, { color: 'purple', label: '$y_0$', labelPos: 'ne' });
        let lastSys = 'pend';
        v.legend([['accent', 'solution from $x_0$'], ['purple', 'solution from $y_0$'], ['ink', '$|\\varphi-\\psi|$'], ['red', '$|x_0-y_0|e^{Lt}$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const S = PLANAR[which.value];
          if (which.value !== lastSys) { lastSys = which.value; s.setView(S.view[0], S.view[1]); const [x, y] = S.start; A.set(x, y); B.set(x + 0.15, y); }
          const T = Ts.value, N = Math.round(T * 60), pa = flow(S.F, 0, [A.x, A.y], T, N), pb = flow(S.F, 0, [B.x, B.y], T, N);
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const P of [pa, pb]) for (const [, z] of P) { x0 = Math.min(x0, z[0]); x1 = Math.max(x1, z[0]); y0 = Math.min(y0, z[1]); y1 = Math.max(y1, z[1]); }
          let L = 0; for (let i = 0; i <= 14; i++) for (let j = 0; j <= 14; j++) L = Math.max(L, norm2(S.J(x0 + ((x1 - x0) * i) / 14, y0 + ((y1 - y0) * j) / 14)));
          s.path(pa.map(([, z]) => z), { color: 'accent', width: 2.4 }); s.path(pb.map(([, z]) => z), { color: 'purple', width: 2.4 });
          s.rect(x0, y0, x1, y1, { color: 'muted', width: 1, dash: [4, 4], fill: false });
          s.dot(pa[pa.length - 1][1][0], pa[pa.length - 1][1][1], { r: 4, color: 'accent', hollow: true }); s.dot(pb[pb.length - 1][1][0], pb[pb.length - 1][1][1], { r: 4, color: 'purple', hollow: true });
          const d0 = Math.hypot(A.x - B.x, A.y - B.y), sep = [], bd = []; let worst = 0;
          for (let i = 0; i <= N; i++) { const t = pa[i][0], d = Math.hypot(pa[i][1][0] - pb[i][1][0], pa[i][1][1] - pb[i][1][1]), b = d0 * Math.exp(L * t); sep.push([t, Math.max(d, 1e-9)]); bd.push([t, b]); if (b > 0 && t > 0.1 * T) worst = Math.max(worst, d / b); }
          sd.setView([0, T], [1e-5, 1e4]);
          sd.path(bd, { color: 'red', width: 2, dash: [6, 4] }); sd.path(sep, { color: 'ink', width: 2.6 });
          info = { L, d0, worst, dT: sep[N][1], T };
        });
        v.readout(() => {
          if (!info) return '';
          const { L, d0, worst, dT, T } = info;
          return `$L=${v.fix(L, 3)}$ (largest $\\|Df\\|$ on the dashed box). $|\\Delta x_0|=${v.fix(d0, 3)}$; at $T=${v.fix(T, 1)}$ the separation is $${v.fix(dT, 4)}$ against the bound $${v.sci(d0 * Math.exp(L * T), 2)}$. Largest ratio separation/bound over $[0.1T,T]$: $${v.fix(worst, 4)}\\le1$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Differentiable dependence and the variational equation',
      statement: String.raw`Let $f$ be $C^1$ on an open set $U$ and let $\varphi(t;\xi)$ denote the solution of $\dot x=f(t,x)$, $x(t_0)=\xi$. Then $\varphi$ is $C^1$ in $(t,\xi)$ on its (open) domain, and the derivative $\Phi(t)=\partial_\xi\varphi(t;\xi)$ is the solution of the *variational equation*
$$\dot\Phi=D_xf\big(t,\varphi(t;\xi)\big)\,\Phi,\qquad\Phi(t_0)=I.$$
Thus for small $h$, $\varphi(t;\xi+h)=\varphi(t;\xi)+\Phi(t)h+o(|h|)$: the flow carries a small round cluster of initial states to an approximate ellipse $\Phi(t)\cdot\{\text{cluster}\}$.`,
      idea: String.raw`Differentiate formally the integral equation (2.2) in $\xi$ to see where the variational equation comes from. To make it rigorous, solve the variational equation along $\varphi$, and show that the difference $\varphi(t;\xi+h)-\varphi(t;\xi)-\Phi(t)h$ obeys a linear integral inequality with a small forcing term $o(|h|)$ from the differentiability of $f$; Grönwall (2.5) with the continuity estimate (2.6) bounds it by $o(|h|)e^{Lt}$. The matrix $\Phi$ records how the flow stretches and rotates a neighbourhood of the orbit.`,
      caption: String.raw`Drag the start point (left) and set the cluster size $r$ and time $T$. The middle panel shows the cluster at time $T$ in units of $r$: the blue ring is the true image of a small circle, the orange ellipse is its prediction $\Phi(T)\cdot$circle from the variational equation. Shrink $r$ and they merge; the right panel shows that the mismatch, divided by $r$, scales like $r$ (the $o(|h|)$ term).`,
      deps: ['ode-2.6', 'pma-9.42'],
      refs: ['Teschl §2.4'],
      tags: ['variational equation', 'flow'],
      viz(v) {
        const which = v.select('system', Object.entries(PLANAR).map(([value, o]) => ({ value, label: o.label })), 'vdp');
        const rs = v.slider('cluster radius $r$', 0.003, 0.8, 0.15, { log: true });
        const Ts = v.slider('time $T$', 0.2, 6, 2.5, { step: 0.05 });
        const s = v.stage({ x: PLANAR.vdp.view[0], y: PLANAR.vdp.view[1], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'y', title: 'orbit from $\\xi$', weight: 1 });
        const sn = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 320, title: 'cluster at time $T$ (in units of $r$)', weight: 1, minWidth: 230 });
        const se = v.stage({ x: [1e-3, 1], y: [1e-6, 1e1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'r', ylabel: 'mismatch / r', title: 'how fast the linear prediction improves', weight: 1, minWidth: 230 });
        const P0 = s.handle(0.6, 0.3, { color: 'accent', label: '$\\xi$', labelPos: 'nw' });
        let lastSys = 'vdp';
        const NR = 28, ring = [];
        for (let i = 0; i < NR; i++) ring.push([Math.cos((2 * Math.PI * i) / NR), Math.sin((2 * Math.PI * i) / NR)]);
        const aug = (S) => (t, z) => { const f = S.F(t, [z[0], z[1]]), J = S.J(z[0], z[1]); return [f[0], f[1], J[0][0] * z[2] + J[0][1] * z[3], J[1][0] * z[2] + J[1][1] * z[3], J[0][0] * z[4] + J[0][1] * z[5], J[1][0] * z[4] + J[1][1] * z[5]]; };
        v.legend([['accent', 'orbit'], ['blue', 'true image of the circle'], ['orange', 'prediction $\\Phi\\cdot$circle'], ['muted', 'initial circle', { dash: true }]]);
        let info = null, cache = { key: '', pts: [] };
        v.render(() => {
          const S = PLANAR[which.value];
          if (which.value !== lastSys) { lastSys = which.value; s.setView(S.view[0], S.view[1]); P0.set(S.start[0], S.start[1]); }
          const T = Ts.value, r = rs.value, xi = [P0.x, P0.y];
          const E = flowEnd(aug(S), 0, [xi[0], xi[1], 1, 0, 0, 1], T, Math.max(80, Math.round(T * 50)));
          const Phi = [[E[2], E[4]], [E[3], E[5]]], xT = [E[0], E[1]];
          const orb = flow(S.F, 0, xi, T, Math.round(T * 50));
          s.path(orb.map(([, z]) => z), { color: 'accent', width: 2.4 });
          s.dot(xi[0], xi[1], { r: 5, color: 'accent' }); s.dot(xT[0], xT[1], { r: 4, color: 'gold' });
          const img = (rr) => ring.map(([c, sn]) => { const z = flowEnd(S.F, 0, [xi[0] + rr * c, xi[1] + rr * sn], T, Math.max(60, Math.round(T * 40))); return [z[0] - xT[0], z[1] - xT[1]]; });
          const pred = (rr) => ring.map(([c, sn]) => [rr * (Phi[0][0] * c + Phi[0][1] * sn), rr * (Phi[1][0] * c + Phi[1][1] * sn)]);
          const act = img(r), prd = pred(r);
          let ext = 1; for (const [a, b] of prd) ext = Math.max(ext, Math.abs(a) / r, Math.abs(b) / r);
          ext = Math.min(ext * 1.25, 400); sn.setView([-ext, ext], [-ext, ext]);
          const circ = ring.map(([c, sn2]) => [c, sn2]); circ.push(circ[0]);
          sn.path(circ, { color: 'muted', width: 1.2, dash: [4, 4] });
          const pp = prd.map(([a, b]) => [a / r, b / r]); pp.push(pp[0]);
          const aa = act.map(([a, b]) => [a / r, b / r]); aa.push(aa[0]);
          sn.path(pp, { color: 'orange', width: 3 }); sn.path(aa, { color: 'blue', width: 2 });
          sn.dots(aa.slice(0, -1), { r: 2.6, color: 'blue' });
          let mism = 0; for (let i = 0; i < NR; i++) mism = Math.max(mism, Math.hypot(act[i][0] - prd[i][0], act[i][1] - prd[i][1]));
          // error curve
          const key = `${which.value}|${xi[0].toFixed(3)}|${xi[1].toFixed(3)}|${T.toFixed(2)}`;
          if (cache.key !== key) {
            const pts = [];
            for (let j = 0; j < 9; j++) {
              const rr = Math.pow(10, -3 + (3 * j) / 8);
              let m = 0; for (let i = 0; i < 12; i++) { const c = ring[i * 2][0], s2 = ring[i * 2][1], z = flowEnd(S.F, 0, [xi[0] + rr * c, xi[1] + rr * s2], T, Math.max(60, Math.round(T * 40))); const pr = [Phi[0][0] * c + Phi[0][1] * s2, Phi[1][0] * c + Phi[1][1] * s2]; m = Math.max(m, Math.hypot(z[0] - xT[0] - rr * pr[0], z[1] - xT[1] - rr * pr[1])); }
              pts.push([rr, Math.max(m / rr, 1e-6)]);
            }
            cache = { key, pts };
          }
          se.path(cache.pts, { color: 'accent', width: 2.4 }); cache.pts.forEach(([x, y]) => se.dot(x, y, { r: 3, color: 'accent' }));
          se.path([[1e-3, 1e-3 * 0.6], [1, 0.6]], { color: 'muted', width: 1.4, dash: [5, 4] });
          se.tex('\\text{slope }1', 0.02, 4e-4, { color: 'muted' });
          se.dot(r, Math.max(mism / r, 1e-6), { r: 6, color: 'gold' });
          info = { Phi, det: Phi[0][0] * Phi[1][1] - Phi[0][1] * Phi[1][0], mism, r };
        });
        v.readout(() => {
          if (!info) return '';
          const { Phi, det, mism, r } = info;
          return `$\\Phi(T)=\\begin{pmatrix}${v.fix(Phi[0][0], 3)}&${v.fix(Phi[0][1], 3)}\\\\${v.fix(Phi[1][0], 3)}&${v.fix(Phi[1][1], 3)}\\end{pmatrix}$, $\\det\\Phi=${v.fix(det, 3)}$ (area ratio). Largest distance between the true image and the ellipse: $${v.sci(Math.max(mism, 1e-12), 2)}=${v.fix(mism / r, 4)}\\,r$ — it is $o(r)$, not $O(r)$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Dependence on parameters',
      statement: String.raw`Let $f(t,x,\mu)$ be $C^1$ in $(t,x,\mu)$ on an open set, and $\varphi(t;\mu)$ the solution of $\dot x=f(t,x,\mu)$, $x(t_0)=\xi(\mu)$ with $\xi$ of class $C^1$. Then $\varphi$ is $C^1$ in $(t,\mu)$ on its domain, and $s(t)=\partial_\mu\varphi(t;\mu)$ solves the *sensitivity equation*
$$\dot s=D_xf\big(t,\varphi,\mu\big)\,s+\partial_\mu f\big(t,\varphi,\mu\big),\qquad s(t_0)=\xi'(\mu).$$
In particular the endpoint $\mu\mapsto\varphi(T;\mu)$ is a smooth curve whose slope is $s(T)$.`,
      idea: String.raw`Treat $\mu$ as an extra state variable with $\dot\mu=0$: the augmented system $(x,\mu)$ has initial data $(\xi(\mu),\mu)$ and is $C^1$, so the differentiability theorem for initial conditions (2.7) applies. The $\mu$-column of its variational equation is exactly the sensitivity equation: the first term transports the existing sensitivity (the variational equation) and the second feeds in new sensitivity from the explicit dependence of the field on $\mu$.`,
      caption: String.raw`Drag the gold point along the endpoint curve $x(T;\mu)$ (right) to choose $\mu$. Its tangent slope is $s(T)$ from the sensitivity equation (orange); the grey secant uses two actual solutions $\mu\pm h$. The left panels compare the sensitivity $s(t)$ with the finite-difference quotient for all $t\le T$ and show the neighbouring solutions.`,
      deps: ['ode-2.7'],
      refs: ['Teschl §2.4'],
      tags: ['parameters', 'sensitivity'],
      viz(v) {
        const SYS = {
          vdp: { label: 'Van der Pol', F: (t, z, m) => [z[1], m * (1 - z[0] * z[0]) * z[1] - z[0]], J: (z, m) => [[0, 1], [-2 * m * z[0] * z[1] - 1, m * (1 - z[0] * z[0])]], Fm: (z) => [0, (1 - z[0] * z[0]) * z[1]], x0: [1, 0], range: [0, 3], tex: String.raw`\ddot x=\mu(1-x^2)\dot x-x`, Ty: [-3.2, 3.2] },
          damp: { label: 'damped pendulum', F: (t, z, m) => [z[1], -Math.sin(z[0]) - m * z[1]], J: (z, m) => [[0, 1], [-Math.cos(z[0]), -m]], Fm: (z) => [0, -z[1]], x0: [2.4, 0], range: [0, 2], tex: String.raw`\ddot x=-\sin x-\mu\dot x`, Ty: [-3, 3] },
        };
        const which = v.select('system', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'vdp');
        const Ts = v.slider('time $T$', 1, 10, 5, { step: 0.05 });
        const hs = v.slider('secant step $h$', 0.01, 0.4, 0.1, { step: 0.01 });
        const s1 = v.stage({ x: [0, 10], y: [-3.2, 3.2], axes: 'box', gutter: true, height: 320, xlabel: 't', ylabel: 'x', title: 'solutions $x(t;\\mu)$', weight: 1, minWidth: 240 });
        const s2 = v.stage({ x: [0, 10], y: [-6, 6], axes: 'box', gutter: true, height: 320, xlabel: 't', ylabel: 's', title: 'sensitivity $s=\\partial_\\mu x$', weight: 1, minWidth: 240 });
        const s3 = v.stage({ x: [0, 3], y: [-3, 3], axes: 'box', gutter: true, height: 320, xlabel: 'μ', ylabel: 'x(T;μ)', title: 'endpoint as a function of $\\mu$', weight: 1.1, minWidth: 250 });
        let curve = [], curveKey = '';
        const evalCurve = (S, T) => { const N = 100, pts = []; for (let i = 0; i <= N; i++) { const m = S.range[0] + ((S.range[1] - S.range[0]) * i) / N; pts.push([m, flowEnd((t, z) => S.F(t, z, m), 0, S.x0, T, Math.round(T * 40))[0]]); } return pts; };
        let lastSys = 'vdp';
        const G = s3.handle(1.5, 0, { color: 'gold', r: 8, label: '$\\mu$', labelPos: 'n', constrain: (x) => { const m = Math.max(SYS[which.value].range[0], Math.min(SYS[which.value].range[1], x)); return [m, curve.length ? sampleAt(curve, m) : 0]; } });
        v.legend([['accent', '$x(t;\\mu)$'], ['muted', '$x(t;\\mu\\pm h)$'], ['orange', '$s(t)$ from the sensitivity equation'], ['ink', 'finite difference']]);
        let info = null;
        v.render(() => {
          const S = SYS[which.value], T = Ts.value, h = hs.value;
          if (which.value !== lastSys) { lastSys = which.value; s3.setView(S.range, S.Ty); s1.setView([0, 10], S.Ty); G.set((S.range[0] + S.range[1]) / 2, 0); }
          const key = `${which.value}|${T.toFixed(2)}`;
          if (key !== curveKey) { curveKey = key; curve = evalCurve(S, T); }
          const mu = G.x; G.set(mu, sampleAt(curve, mu));
          const N = Math.round(T * 50);
          const AUG = (m) => (t, z) => { const f = S.F(t, [z[0], z[1]], m), J = S.J([z[0], z[1]], m), fm = S.Fm([z[0], z[1]]); return [f[0], f[1], J[0][0] * z[2] + J[0][1] * z[3] + fm[0], J[1][0] * z[2] + J[1][1] * z[3] + fm[1]]; };
          const main = flow(AUG(mu), 0, [S.x0[0], S.x0[1], 0, 0], T, N);
          const lo = flow((t, z) => S.F(t, z, mu - h), 0, S.x0, T, N), hi = flow((t, z) => S.F(t, z, mu + h), 0, S.x0, T, N);
          s1.setView([0, T], S.Ty); 
          s1.path(lo.map(([t, z]) => [t, z[0]]), { color: 'muted', width: 1.6 }); s1.path(hi.map(([t, z]) => [t, z[0]]), { color: 'muted', width: 1.6 });
          s1.path(main.map(([t, z]) => [t, z[0]]), { color: 'accent', width: 2.8 });
          const fd = lo.map(([t], i) => [t, (hi[i][1][0] - lo[i][1][0]) / (2 * h)]);
          { let m = 0.3; for (const [, z] of main) m = Math.max(m, Math.abs(z[2])); for (const [, z] of fd) m = Math.max(m, Math.abs(z)); s2.setView([0, T], [-1.2 * m, 1.2 * m]); }
          s2.hline(0, { color: 'muted', width: 1 });
          s2.path(fd, { color: 'ink', width: 3, alpha: 0.7 });
          s2.path(main.map(([t, z]) => [t, z[2]]), { color: 'orange', width: 2.2 });
          const slope = main[N][1][2], sec = (hi[N][1][0] - lo[N][1][0]) / (2 * h);
          s3.path(curve, { color: 'accent', width: 2.6 });
          const w = (S.range[1] - S.range[0]) * 0.18;
          s3.line(mu - w, G.y - slope * w, mu + w, G.y + slope * w, { color: 'orange', width: 2.6 });
          s3.line(mu - h, lo[N][1][0], mu + h, hi[N][1][0], { color: 'ink', width: 1.6, alpha: 0.7 });
          s3.dot(mu - h, lo[N][1][0], { r: 3.5, color: 'muted' }); s3.dot(mu + h, hi[N][1][0], { r: 3.5, color: 'muted' });
          info = { mu, slope, sec, T };
        });
        v.readout(() => {
          if (!info) return '';
          const { mu, slope, sec, T } = info;
          return `$\\mu=${v.fix(mu, 3)}$, $T=${v.fix(T, 2)}$: sensitivity equation gives $\\partial_\\mu x(T;\\mu)=${v.fix(slope, 4)}$; the secant of two real solutions gives $${v.fix(sec, 4)}$ (difference $${v.sci(Math.max(Math.abs(slope - sec), 1e-12), 2)}$, shrinking like $h^2$).`;
        });
      },
    },
  ],
};
