// Numerical Analysis — Chapter 2: Solving nonlinear equations (items 2.1–2.9; 2.10–2.18 in ch02-b.js)
import { lg, sci, tsci, clamp, bisectRoot, newtonSeq, secantSeq, lastOrder, FUN } from './ch02.shared.js';

const FUNOPTS = Object.values(FUN).map((f) => ({ value: f.key, label: `$${f.tex}$` }));

export default {
  collection: 'num',
  chapter: 2,
  title: 'Solving nonlinear equations',
  summary: String.raw`Root finding is the oldest numerical problem. Bisection is slow but certain; fixed-point iteration converges when the map is a contraction; Newton’s method doubles the number of correct digits per step once close, but can cycle, diverge or wander into fractal basin boundaries. The secant method trades derivatives for slightly slower convergence, safeguarded methods combine speed with certainty, and in several variables Newton’s method, quasi-Newton updates and continuation take over.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Algorithm',
      name: 'Bisection method',
      statement: String.raw`Let $f$ be continuous on $[a,b]$ with $f(a)f(b)<0$. Set $[a_0,b_0]=[a,b]$ and for $n\ge0$ let $c_n=\tfrac12(a_n+b_n)$; keep the half $[a_n,c_n]$ or $[c_n,b_n]$ on which $f$ still changes sign. Then every bracket contains a root $x^*$, the brackets nest down to a single root, and
$$|c_n-x^*|\le \frac{b-a}{2^{\,n+1}}.$$
Each step costs one evaluation of $f$ and gains exactly one binary digit.`,
      idea: String.raw`The intermediate value theorem (from continuity of $f$) guarantees a root in every bracket that keeps a sign change, and each bracket has half the length of the last, so the nested intervals shrink to one point, which must be a root by continuity. The bound is just the length of the bracket: the midpoint cannot be farther than half of it from any point of it. The guarantee needs nothing but continuity and a sign change — no derivative, no smoothness — which is why bisection is the method of last resort.`,
      caption: String.raw`Drag the orange handles $a$ and $b$ along the axis, pick a function and step $n$ through the halvings; the shaded band is the current bracket. On the right the dashed line is the bound $(b-a)/2^{n+1}$ and the dots are the true error of the midpoint: the bound is never violated, though the true error may be far smaller by luck. Drag $a$ and $b$ to the same side of a root to lose the bracket.`,
      deps: ['pma-4.23'],
      refs: ['Süli–Mayers ch. 1'],
      credit: 'Bolzano, 1817 (the argument behind the intermediate value theorem)',
      scope: String.raw`Needs only continuity and a sign change on $[a,b]$; an even number of roots in the bracket is invisible to it, and it finds one of the roots, not a chosen one.`,
      tags: ['root finding', 'bisection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bisection_method' },
      viz(v) {
        let F = FUN.cosx;
        const BR = { cosx: [0, 1.5], cubic: [0, 3], exp: [0, 2.5] };
        const sel = v.select('function', FUNOPTS, 'cosx', { onChange: (k) => { F = FUN[k]; s.setView(F.xr, F.yr); ha.set(BR[k][0], 0); hb.set(BR[k][1], 0); } });
        const n = v.slider('steps $n$', 0, 45, 5, { int: true });
        const s = v.stage({ x: F.xr, y: F.yr, axes: 'box', gutter: true, xlabel: 'x', height: 300, title: 'the bracket $[a_n,b_n]$' });
        const e = v.stage({ x: [0, 45], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'step n', ylabel: 'log₁₀ error', height: 300, title: 'error versus bound' });
        const ha = s.handle(BR.cosx[0], 0, { color: 'orange', label: 'a', constrain: 'x' });
        const hb = s.handle(BR.cosx[1], 0, { color: 'orange', label: 'b', constrain: 'x', labelPos: 'ne' });
        let info = null;
        v.legend([['ink', 'f'], ['gold', 'true error of $c_n$'], ['orange', 'bound $(b-a)/2^{n+1}$', { dash: true }]]);
        v.render(() => {
          const lo = Math.min(ha.x, hb.x), hi = Math.max(ha.x, hb.x), f = F.f;
          s.hline(0, { color: 'faint' });
          s.fn(f, { color: 'ink', width: 2 });
          if (!(f(lo) * f(hi) < 0)) { s.corner('no sign change on [a, b]: no guarantee', 'tl', { color: 'red' }); info = null; return; }
          const r = bisectRoot(f, lo, hi);
          let a = lo, b = hi, fa = f(a); const hist = [[a, b]];
          for (let k = 0; k < n.value; k++) { const c = (a + b) / 2, fc = f(c); if (fa * fc <= 0) b = c; else { a = c; fa = fc; } hist.push([a, b]); }
          for (const [p, q] of hist) { s.vline(p, { color: 'faint', alpha: 0.5 }); s.vline(q, { color: 'faint', alpha: 0.5 }); }
          s.vband(a, b, { color: 'green', alpha: 0.18 });
          hist.forEach(([p, q], k) => { const c = (p + q) / 2; if (k > 0 || true) s.dot(c, f(c), { r: k === hist.length - 1 ? 5 : 3, color: 'gold' }); });
          s.dot(r, 0, { color: 'green', r: 5, hollow: true });
          const err = hist.map(([p, q]) => lg(Math.abs((p + q) / 2 - r))), bound = (k) => lg((hi - lo) / 2 ** (k + 1));
          e.fn((k) => bound(k), { color: 'orange', dash: true, domain: [0, 45] });
          e.dots(err.map((y, k) => [k, Math.max(y, -15.8)]), { color: 'gold', r: 3.5 });
          e.vline(n.value, { color: 'faint' });
          info = { L: b - a, c: (a + b) / 2, err: Math.abs((a + b) / 2 - r), bound: (hi - lo) / 2 ** (n.value + 1), r };
        });
        v.readout(() => info ? `$n=${n.value}$: bracket length $${tsci(info.L)}$, midpoint $c_n=${v.fix(info.c, 10)}$\n bound $${tsci(info.bound)}$ $\\ge$ true error $${tsci(info.err)}$ (root $x^*\\approx${v.fix(info.r, 10)}$)` : 'No sign change: the intermediate value theorem promises nothing here.');
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Convergence of fixed-point iteration',
      statement: String.raw`Let $g$ be continuously differentiable near a fixed point $x^*=g(x^*)$. If $|g'(x^*)|<1$ then there is $\delta>0$ such that for every $x_0$ with $|x_0-x^*|\le\delta$ the iteration $x_{n+1}=g(x_n)$ stays in that interval and converges to $x^*$, with
$$\lim_{n\to\infty}\frac{x_{n+1}-x^*}{x_n-x^*}=g'(x^*).$$
So the error shrinks geometrically at rate $|g'(x^*)|$. If $|g'(x^*)|>1$ the fixed point repels every nearby start other than $x^*$ itself.`,
      idea: String.raw`By the mean value theorem (pma-5.10) $x_{n+1}-x^*=g(x_n)-g(x^*)=g'(\xi_n)(x_n-x^*)$ with $\xi_n$ between $x_n$ and $x^*$. Continuity of $g'$ keeps $|g'|\le q<1$ on a small interval around $x^*$, so each step multiplies the error by at most $q$ and the iterates never leave the interval: this is the contraction idea of pma-9.23 in one dimension. As $\xi_n\to x^*$ the multiplier tends to $g'(x^*)$, giving the exact rate.`,
      caption: String.raw`The map is $g(x)=a\,x(1-x)$ with fixed point $x^*=1-1/a$ and $g'(x^*)=2-a$. Drag the start $x_0$ and the slider $a$. The cobweb follows $x\to g(x)\to$ diagonal; the dashed orange line is the tangent at $x^*$. On the right the dots are $\log_{10}|x_n-x^*|$ and the line is the prediction with slope $\log_{10}|g'(x^*)|$. Push $a$ above $3$ so that $|g'(x^*)|>1$ and watch the iterates leave.`,
      deps: ['pma-9.23', 'pma-5.10'],
      refs: ['Süli–Mayers ch. 1'],
      scope: String.raw`Local statement: it needs $g\in C^1$ and a start close enough to $x^*$. The case $|g'(x^*)|=1$ is undecided by the derivative alone.`,
      tags: ['fixed point', 'iteration'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fixed-point_iteration' },
      viz(v) {
        const a = v.slider('$a$', 1.2, 3.9, 1.8, { step: 0.01 });
        const N = v.slider('steps', 1, 40, 14, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, xlabel: 'x', height: 340, title: 'cobweb for $g(x)=ax(1-x)$' });
        const e = v.stage({ x: [0, 40], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₁₀|xₙ − x*|', height: 340, title: 'error' });
        const h0 = s.handle(0.15, 0, { color: 'gold', label: 'x₀', constrain: 'x' });
        let info = {};
        v.legend([['ink', '$g$'], ['faint', '$y=x$'], ['gold', 'orbit'], ['orange', 'tangent at $x^*$', { dash: true }]]);
        v.render(() => {
          const A = a.value, g = (x) => A * x * (1 - x), xs = 1 - 1 / A, d = 2 - A;
          s.line(0, 0, 1, 1, { color: 'faint' });
          s.fn(g, { color: 'ink', width: 2 });
          s.fn((x) => xs + d * (x - xs), { color: 'orange', dash: true, domain: [Math.max(0, xs - 0.3), Math.min(1, xs + 0.3)] });
          const pts = [[h0.x, 0]]; let x = h0.x; const xsq = [x];
          for (let k = 0; k < N.value; k++) { const y = g(x); pts.push([x, y], [y, y]); x = y; xsq.push(x); }
          s.path(pts, { color: 'gold', width: 1.4 });
          s.dot(xs, xs, { color: 'green', r: 5, hollow: true });
          const errs = xsq.map((q) => Math.abs(q - xs));
          e.dots(errs.map((q, k) => [k, Math.max(lg(q), -16.5)]), { color: 'gold', r: 3.5 });
          if (Math.abs(d) > 1e-6 && errs[0] > 0) e.fn((k) => lg(errs[0]) + k * Math.log10(Math.abs(d)), { color: 'orange', dash: true, domain: [0, N.value] });
          let ratio = null; const m = errs.length; if (m >= 3 && errs[m - 2] > 1e-12 && errs[m - 2] < 0.2) ratio = errs[m - 1] / errs[m - 2];
          info = { xs, d, ratio, last: x };
        });
        v.readout(() => `$x^*=${v.fix(info.xs, 5)}$, $g'(x^*)=2-a=${v.fix(info.d, 3)}$ → ${Math.abs(info.d) < 1 ? '**attracting**' : Math.abs(info.d) > 1 ? '**repelling**' : 'neutral'}\n` + (info.ratio !== null ? `measured $e_{n+1}/e_n=${v.fix(info.ratio, 4)}$ (theory $${v.fix(info.d, 4)}$ up to sign)` : `$x_n=${v.fix(info.last, 5)}$ after ${N.value} steps (no clean ratio: the orbit is not converging to $x^*$)`));
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Order and rate of convergence',
      statement: String.raw`A sequence $x_n\to x^*$ with errors $e_n=|x_n-x^*|$ converges with **order** $p\ge1$ and **asymptotic constant** $C>0$ if
$$\lim_{n\to\infty}\frac{e_{n+1}}{e_n^{\,p}}=C .$$
For $p=1$ one also needs $C<1$ (linear convergence with rate $C$); $p=2$ is quadratic; $1<p<2$ is superlinear. Each step multiplies the number of correct digits by $p$ (for $p>1$) or adds $-\log_{10}C$ digits (for $p=1$).`,
      idea: String.raw`Taking logarithms, $\log e_{n+1}\approx p\log e_n+\log C$: on log–log axes the pairs $(e_n,e_{n+1})$ lie on a straight line whose slope is the order. Linear convergence is the family of lines of slope one whose offset is the rate; quadratic convergence is a parabola in the error. Bisection, the contraction iteration of 2.2, the secant method and Newton's method (next items) occupy the orders $1,1,\tfrac{1+\sqrt5}2\approx1.618$ and $2$.`,
      caption: String.raw`Each method is run on $x^2-2$ and every consecutive pair of errors $(e_n,e_{n+1})$ is plotted on log–log axes; the dashed guides have slope $1$, $1.618$ and $2$ (all through $(1,1)$). Drag the start $x_0$ (Newton, secant) and the constant $c$ in $g(x)=x-(x^2-2)/c$ whose rate is $|1-2\sqrt2/c|$. The readout estimates the order from the last three errors.`,
      deps: ['num-2.2'],
      refs: ['Süli–Mayers ch. 1'],
      tags: ['convergence', 'order'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rate_of_convergence' },
      viz(v) {
        const R = Math.SQRT2, f = (x) => x * x - 2;
        const x0 = v.slider('start $x_0$', 1.1, 3, 2, { step: 0.01 });
        const cc = v.slider('$c$ in $g$', 3.5, 9, 6, { step: 0.05 });
        const s = v.stage({ x: [1e-16, 1], y: [1e-16, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'eₙ', ylabel: 'eₙ₊₁', height: 420, title: 'error in step $n{+}1$ against error in step $n$' });
        const COL = { bis: 'purple', fix: 'teal', sec: 'gold', new: 'accent' };
        v.legend([[COL.bis, 'bisection'], [COL.fix, 'fixed point $g$'], [COL.sec, 'secant'], [COL.new, 'Newton'], ['faint', 'slopes 1, 1.618, 2', { dash: true }]]);
        let orders = {};
        v.render(() => {
          for (const p of [1, 1.618, 2]) s.fn((x) => x ** p, { color: 'faint', dash: true, domain: [1e-16, 1] });
          s.text('slope 1', 3e-14, 4e-15, { size: 11, color: 'muted' }); s.text('1.618', 1e-9, 6e-16, { size: 11, color: 'muted' }); s.text('2', 3e-7, 1e-15, { size: 11, color: 'muted' });
          const seqs = {};
          { let a = 1, b = 2; const E = []; for (let k = 0; k < 60; k++) { const c = (a + b) / 2; E.push(Math.abs(c - R)); if (f(a) * f(c) <= 0) b = c; else a = c; } seqs.bis = E; }
          { let x = x0.value; const E = [Math.abs(x - R)]; for (let k = 0; k < 60; k++) { x = x - f(x) / cc.value; E.push(Math.abs(x - R)); } seqs.fix = E; }
          seqs.sec = secantSeq(f, x0.value, x0.value + 0.4, 12).map((x) => Math.abs(x - R));
          seqs.new = newtonSeq(f, (x) => 2 * x, x0.value, 12).map((x) => Math.abs(x - R));
          orders = {};
          for (const key of Object.keys(seqs)) {
            const E = seqs[key], pts = [];
            for (let i = 0; i + 1 < E.length; i++) if (E[i] > 3e-16 && E[i + 1] > 3e-16 && E[i] < 1.5) pts.push([E[i], E[i + 1]]);
            s.path(pts, { color: COL[key], width: 1, alpha: 0.6 }); s.dots(pts, { color: COL[key], r: 3.5 });
            orders[key] = lastOrder(E, 1e-15);
          }
        });
        const o = (k) => (orders[k] === null || orders[k] === undefined ? '—' : v.fix(orders[k], 2));
        v.readout(() => `estimated order from the last three errors: bisection ${o('bis')} (erratic; its bound halves), fixed point ${o('fix')}, secant ${o('sec')}, Newton ${o('new')}\n$g'(\\sqrt2)=1-2\\sqrt2/c=${v.fix(1 - 2 * R / cc.value, 3)}$; ratios $e_{n+1}/e_n^p$ settle at the asymptotic constant $C$ (Newton: $1/(2\\sqrt2)=0.354$).`);
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Algorithm',
      name: 'Newton’s method',
      statement: String.raw`To solve $f(x)=0$ for a differentiable $f$, replace $f$ at the current iterate by its tangent line and take the tangent's zero as the next iterate:
$$x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)} .$$
It is the fixed-point iteration for $g(x)=x-f(x)/f'(x)$, and $g'(x^*)=0$ at a simple root. Near a simple root the number of correct digits roughly doubles at each step; far from a root the method may do anything (2.6).`,
      idea: String.raw`Linearising $f(x)\approx f(x_n)+f'(x_n)(x-x_n)$ and solving for the zero is exactly one step. Written as a fixed-point iteration, the derivative of the iteration map is $g'=f f''/f'^2$, which vanishes at a simple root; by 2.3 the order is then at least two. Differentiability (pma-5.15) is what makes the tangent a good local model.`,
      caption: String.raw`Drag the start $x_0$ along the axis and increase the step count: each step drops vertically to the curve and slides down the tangent (gold) to the axis. The bars on the right count correct decimal digits $-\log_{10}|x_n-x^*|$; once the iteration is close they roughly double from bar to bar.`,
      deps: ['num-2.3', 'pma-5.15'],
      refs: ['Süli–Mayers ch. 1'],
      credit: 'Newton, c. 1669 (for polynomials); Raphson, 1690; the calculus form with derivatives is due to Simpson, 1740',
      tags: ['Newton', 'root finding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton%27s_method' },
      viz(v) {
        let F = FUN.cosx;
        const sel = v.select('function', FUNOPTS, 'cosx', { onChange: (k) => { F = FUN[k]; s.setView(F.xr, F.yr); h.set(F.x0, 0); } });
        const n = v.slider('steps', 0, 8, 3, { int: true });
        const s = v.stage({ x: F.xr, y: F.yr, axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'tangent steps' });
        const d = v.stage({ x: [-0.5, 8.5], y: [0, 17], axes: 'box', gutter: true, xlabel: 'step n', ylabel: 'correct digits', height: 320, title: 'digits of accuracy' });
        const h = s.handle(F.x0, 0, { color: 'gold', label: 'x₀', constrain: 'x' });
        let rows = [];
        v.render(() => {
          const xs = newtonSeq(F.f, F.df, h.x, n.value);
          s.hline(0, { color: 'faint' }); s.fn(F.f, { color: 'ink', width: 2 });
          for (let k = 0; k + 1 < xs.length; k++) {
            s.segment([xs[k], 0], [xs[k], F.f(xs[k])], { color: 'faint', dash: true });
            s.segment([xs[k], F.f(xs[k])], [xs[k + 1], 0], { color: 'gold', width: 1.8 });
          }
          xs.forEach((x, k) => s.dot(x, 0, { color: k === 0 ? 'gold' : 'orange', r: 3.5, label: k > 0 && k < 5 ? `x${'₀₁₂₃₄₅₆₇₈'[k]}` : undefined, labelPos: 'n' }));
          s.dot(F.root, 0, { color: 'green', hollow: true, r: 6 });
          const dig = xs.map((x) => clamp(-lg(Math.abs(x - F.root)), 0, 16.5));
          d.bars(dig, { x0: 0, color: (val, i) => (val > 15.5 ? 'green' : 'accent') });
          rows = xs.map((x, k) => [k, x, Math.abs(x - F.root)]);
        });
        v.readout(() => rows.slice(0, 9).map(([k, x, e]) => `$x_{${k}}=${v.fix(x, 12)}$,  error $${tsci(e, 2)}$`).join('\n') + `\n(root $x^*=${v.fix(F.root, 12)}$)`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Local quadratic convergence of Newton’s method',
      statement: String.raw`Let $f\in C^2$ near a simple root $x^*$ ($f(x^*)=0$, $f'(x^*)\ne0$). On an interval $I_\rho=[x^*-\rho,x^*+\rho]$ let $m=\min_{I_\rho}|f'|>0$ and $M=\max_{I_\rho}|f''|$, and put $K=M/(2m)$. If $K\rho<1$, then Newton's method started at any $x_0\in I_\rho$ stays in $I_\rho$, converges to $x^*$, and
$$|x_{n+1}-x^*|\le K\,|x_n-x^*|^2,\qquad \frac{x_{n+1}-x^*}{(x_n-x^*)^2}\longrightarrow\frac{f''(x^*)}{2f'(x^*)}.$$`,
      idea: String.raw`Taylor's theorem about $x_n$ gives $0=f(x^*)=f(x_n)+f'(x_n)(x^*-x_n)+\tfrac12f''(\xi)(x^*-x_n)^2$. Dividing by $f'(x_n)$ and rearranging, $x_{n+1}-x^*=\frac{f''(\xi)}{2f'(x_n)}(x_n-x^*)^2$, which gives the bound with $K=M/2m$. If $e_0<1/K$ then $Ke_{n+1}\le(Ke_n)^2$, so $Ke_n\le(Ke_0)^{2^n}$: the squaring is what makes the digits double.`,
      caption: String.raw`The green band is the interval $I_\rho$ with $K(\rho)\rho<1$ guaranteed by the theorem, computed from $m$ and $M$ on the interval. Drag $x_0$ in or out of it. The right panel shows $e_{n+1}/e_n^2$ at each step (dots) against the limit $f''(x^*)/2f'(x^*)$ (line); the bound $K$ is the dashed line above it. Starting outside the band is not forbidden, only unguaranteed.`,
      deps: ['num-2.4'],
      refs: ['Süli–Mayers ch. 1'],
      scope: String.raw`Needs a simple root and $f\in C^2$ nearby; the guaranteed region $\rho$ here is the largest radius for which $K(\rho)\rho<1$, found by scanning, and is typically much smaller than the true basin.`,
      tags: ['Newton', 'quadratic convergence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton%27s_method#Proof_of_quadratic_convergence_for_Newton\'s_iterative_method' },
      viz(v) {
        let F = FUN.cosx;
        const sel = v.select('function', FUNOPTS, 'cosx', { onChange: (k) => { F = FUN[k]; s.setView(F.xr, F.yr); h.set(F.x0, 0); } });
        const n = v.slider('steps', 1, 6, 4, { int: true });
        const s = v.stage({ x: F.xr, y: F.yr, axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'guaranteed region' });
        const q = v.stage({ x: [-0.5, 6.5], y: [0, 1], axes: 'box', gutter: true, xlabel: 'step n', ylabel: 'eₙ₊₁ / eₙ²', height: 320, title: 'quadratic error constant' });
        const h = s.handle(F.x0, 0, { color: 'gold', label: 'x₀', constrain: 'x' });
        let info = {};
        v.legend([['green', 'guaranteed interval'], ['gold', '$e_{n+1}/e_n^2$'], ['green', '$f\'\'/2f\'$ at $x^*$', { dash: true }], ['red', 'bound $K$', { dash: true }]]);
        v.render(() => {
          const r = F.root, Kof = (rho) => { let m = Infinity, M = 0; for (let i = 0; i <= 200; i++) { const x = r - rho + 2 * rho * i / 200; m = Math.min(m, Math.abs(F.df(x))); M = Math.max(M, Math.abs(F.d2(x))); } return m > 1e-9 ? M / (2 * m) : Infinity; };
          let rho = 0; for (let t = 0.002; t < 3; t += 0.002) { if (Kof(t) * t < 1) rho = t; else break; }
          const K = Kof(Math.max(rho, 0.002)), lim = Math.abs(F.d2(r) / (2 * F.df(r)));
          s.hline(0, { color: 'faint' }); s.vband(r - rho, r + rho, { color: 'green', alpha: 0.2 });
          s.fn(F.f, { color: 'ink', width: 2 });
          const xs = newtonSeq(F.f, F.df, h.x, n.value);
          xs.forEach((x, k) => s.dot(x, 0, { color: k === 0 ? 'gold' : 'orange', r: 3.5 }));
          s.dot(r, 0, { color: 'green', hollow: true, r: 6 });
          const errs = xs.map((x) => Math.abs(x - r)), pts = [];
          for (let k = 0; k + 1 < errs.length; k++) if (errs[k] > 1e-7 && errs[k + 1] > 1e-14) pts.push([k, errs[k + 1] / errs[k] ** 2]);
          const top = Math.max(1.2 * K, 1.3 * lim, 0.5); q.setView([-0.5, 6.5], [0, top]);
          q.hline(lim, { color: 'green', dash: true }); q.hline(K, { color: 'red', dash: true });
          q.dots(pts.filter((p) => p[1] <= top * 1.5), { color: 'gold', r: 4 });
          info = { rho, K, lim, inside: Math.abs(h.x - r) <= rho, pts, e0: errs[0] };
        });
        v.readout(() => `guaranteed radius $\\rho=${v.fix(info.rho, 3)}$ with $K=${v.fix(info.K, 3)}$; $f''(x^*)/2f'(x^*)=${v.fix(info.lim, 4)}$\n$x_0$ is ${info.inside ? '**inside**: convergence is guaranteed and $e_{n+1}\\le Ke_n^2$ holds at every step' : '**outside** the guaranteed band: the theorem is silent (it may still converge)'}\n` + info.pts.map(([k, r]) => `$e_{${k + 1}}/e_{${k}}^2=${v.fix(r, 4)}$`).join(', '));
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Paradox',
      name: 'Newton’s method can cycle or diverge',
      statement: String.raw`Newton's local quadratic convergence (2.5) is only local. For $f(x)=x^3-2x+2$ the start $x_0=0$ gives $x_1=1$, $x_2=0,\dots$: an attracting 2-cycle with no root in sight. For $f(x)=\sqrt[3]{x}$ every step is $x_{n+1}=-2x_n$, so the distance to the root $0$ doubles each time. For $f(x)=\arctan x$ the method converges if $|x_0|<x_c\approx1.39$, cycles when $|x_0|=x_c$ and diverges beyond it.`,
      idea: String.raw`The derivation of 2.5 needs $f'$ bounded away from $0$ and $f''$ bounded near the root; away from the root nothing prevents a tangent from landing farther from the root than where it started. For $x^3-2x+2$ the tangents at $0$ and $1$ hit the axis at each other's foot. For $\sqrt[3]{x}$ the curve is so steep at $0$ (infinite slope, not a simple root in the $C^2$ sense) that the tangent overshoots by a factor $2$. For $\arctan$ the tangent flattens as $|x|$ grows, so the step $(1+x^2)\arctan x$ grows faster than $|x|$ once $|x|>x_c$, where $x_c$ solves $2x=(1+x^2)\arctan x$.`,
      caption: String.raw`Choose a function and drag the start $x_0$; the gold zig-zag shows each tangent step. The right panel plots $x_n$ against $n$. For the cubic, start near $0$ to enter the 2-cycle and then move away until the cycle breaks and the method finds the real root $-1.77$. For $\arctan$, drag across $\pm x_c$ and watch convergence turn into divergence.`,
      deps: ['num-2.4'],
      refs: ['Süli–Mayers ch. 1'],
      scope: String.raw`These are specific textbook counterexamples; the first one is an open set of starts (the 2-cycle is attracting), so it is not a measure-zero accident.`,
      tags: ['Newton', 'divergence', 'cycles'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton%27s_method#Failure_of_the_method_to_converge_to_the_root' },
      viz(v) {
        const CASES = {
          cubic: { f: (x) => x ** 3 - 2 * x + 2, df: (x) => 3 * x * x - 2, xr: [-2.6, 2.4], yr: [-4, 6], x0: 0, root: -1.7693 },
          cbrt: { f: (x) => Math.cbrt(x), df: (x) => 1 / (3 * Math.cbrt(x) ** 2), xr: [-4, 4], yr: [-2, 2], x0: 0.5, root: 0 },
          atan: { f: (x) => Math.atan(x), df: (x) => 1 / (1 + x * x), xr: [-6, 6], yr: [-1.8, 1.8], x0: 1.2, root: 0 },
        };
        const xc = bisectRoot((x) => 2 * x - (1 + x * x) * Math.atan(x), 1, 2);
        let C = CASES.cubic;
        const sel = v.select('function', [{ value: 'cubic', label: '$x^3-2x+2$' }, { value: 'cbrt', label: '$\\sqrt[3]{x}$' }, { value: 'atan', label: '$\\arctan x$' }], 'cubic', { onChange: (k) => { C = CASES[k]; s.setView(C.xr, C.yr); h.set(C.x0, 0); } });
        const n = v.slider('steps', 1, 14, 8, { int: true });
        const s = v.stage({ x: C.xr, y: C.yr, axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'tangent steps' });
        const t = v.stage({ x: [0, 14], y: [-6, 6], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'xₙ', height: 320, title: 'the iterates' });
        const h = s.handle(0, 0, { color: 'gold', label: 'x₀', constrain: 'x' });
        let xs = [];
        v.render(() => {
          xs = newtonSeq(C.f, C.df, h.x, n.value);
          s.hline(0, { color: 'faint' }); s.fn(C.f, { color: 'ink', width: 2 });
          for (let k = 0; k + 1 < xs.length; k++) {
            s.segment([xs[k], 0], [xs[k], C.f(xs[k])], { color: 'faint', dash: true });
            s.segment([xs[k], C.f(xs[k])], [xs[k + 1], 0], { color: 'gold', width: 1.8 });
          }
          if (C === CASES.atan) { s.vline(xc, { color: 'red', dash: true }); s.vline(-xc, { color: 'red', dash: true }); }
          s.dot(C.root, 0, { color: 'green', hollow: true, r: 6 });
          const R = C === CASES.cbrt ? 6 : C === CASES.atan ? 8 : 4;
          t.setView([0, 14], [-R, R]); t.hline(C.root, { color: 'green', dash: true });
          t.path(xs.map((x, k) => [k, x]), { color: 'gold', width: 1.4 }); t.dots(xs.map((x, k) => [k, x]), { color: 'gold', r: 3.5 });
        });
        v.readout(() => `$x_0=${v.fix(h.x, 3)}$ → ` + xs.slice(0, 9).map((x) => v.fix(x, 3)).join(', ') + (xs.length > 9 ? ', …' : '') + `\nfor $\\arctan$: critical start $x_c=${v.fix(xc, 5)}$ (solves $2x=(1+x^2)\\arctan x$)`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Newton basins of attraction are fractal',
      statement: String.raw`Apply Newton's method to a complex polynomial such as $z^3-1$ and colour each start $z_0\in\mathbb C$ by the root it converges to. The three basins of attraction are open, each is connected-looking near its root, and yet they share one common boundary, the Julia set of the Newton map; at *every* point of that boundary all three colours occur arbitrarily close by. The boundary is a fractal, so tiny changes of $z_0$ near it change the outcome, and the method is unpredictable there.`,
      idea: String.raw`The Newton map $N(z)=z-p(z)/p'(z)$ is a rational function; its roots are superattracting fixed points. The basin of each root is an open set invariant under $N$, and by Montel's theorem (complex analysis) the boundary of each basin equals the boundary of every other — the Julia set — which is why one point of the boundary touches all basins. Real Newton in 2.6 is the one-dimensional trace of this picture.`,
      caption: String.raw`Colours are the root each start converges to; brightness shows how many steps it needed (dark: slow). **Click** to zoom in on a point, **shift-click** to zoom out; the self-similar spirals never resolve into smooth boundaries. Drag the white handle to see one start's Newton orbit. Switch to $z^3-2z+2$: now a region converges to no root at all (grey), caught in an attracting 2-cycle $0\leftrightarrow1$.`,
      deps: ['num-2.4', 'ode-11.1'],
      refs: ['Süli–Mayers ch. 1'],
      credit: 'Cayley posed the problem of the basins of Newton\'s method in 1879; the fractal picture was developed by Peitgen, Saupe and others in the 1980s',
      scope: String.raw`Computed in double precision with at most 60 iterations per pixel; very deep zooms (below about $10^{-12}$) run out of resolution.`,
      tags: ['Newton', 'fractals', 'complex dynamics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton_fractal' },
      viz(v) {
        let fam = 'pow', view = { cx: 0, cy: 0, h: 2 };
        const famSel = v.select('polynomial', [{ value: 'pow', label: '$z^n-1$' }, { value: 'cyc', label: '$z^3-2z+2$' }], 'pow', { onChange: (k) => { fam = k; view = { cx: 0, cy: 0, h: 2 }; } });
        const nn = v.slider('degree $n$', 2, 6, 3, { int: true });
        v.button('reset view', () => { view = { cx: 0, cy: 0, h: 2 }; });
        v.button('zoom ×6 at 0', () => { view = { cx: 0, cy: 0, h: view.h / 6 }; });
        const s = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, axes: false, height: 440, title: 'basins of Newton\'s method', full: true });
        const h = s.handle(0.3, 0.4, { color: 'ink', r: 6 });
        // roots of z^3 - 2z + 2
        const cubicRoots = [[-1.7693, 0], [0.88465, 0.58974], [0.88465, -0.58974]].map(([a, b]) => { let z = [a, b]; for (let i = 0; i < 40; i++) { const [x, y] = z, f = [x * x * x - 3 * x * y * y - 2 * x + 2, 3 * x * x * y - y * y * y - 2 * y], d = [3 * (x * x - y * y) - 2, 6 * x * y], den = d[0] * d[0] + d[1] * d[1]; z = [x - (f[0] * d[0] + f[1] * d[1]) / den, y - (f[1] * d[0] - f[0] * d[1]) / den]; } return z; });
        s.onClick((x, y, mod) => { view = { cx: x, cy: y, h: mod && mod.shift ? view.h * 2 : view.h / 2 }; });
        function stepFn(z0x, z0y) {
          if (fam === 'pow') { // z - (z^n-1)/(n z^(n-1))
            const N = nn.value; let px = 1, py = 0; // z^(n-1)
            for (let i = 0; i < N - 1; i++) { const t = px * z0x - py * z0y; py = px * z0y + py * z0x; px = t; }
            const zx = px * z0x - py * z0y, zy = px * z0y + py * z0x, fx = zx - 1, fy = zy, dx = N * px, dy = N * py, den = dx * dx + dy * dy;
            if (den === 0) return null; return [z0x - (fx * dx + fy * dy) / den, z0y - (fy * dx - fx * dy) / den];
          }
          const x = z0x, y = z0y, fx = x * x * x - 3 * x * y * y - 2 * x + 2, fy = 3 * x * x * y - y * y * y - 2 * y, dx = 3 * (x * x - y * y) - 2, dy = 6 * x * y, den = dx * dx + dy * dy;
          if (den === 0) return null; return [x - (fx * dx + fy * dy) / den, y - (fy * dx - fx * dy) / den];
        }
        const NAMES = ['blue', 'orange', 'green', 'red', 'purple', 'teal'];
        function classify(x, y) {
          let it = 0, z = [x, y];
          for (; it < 60; it++) {
            const w = stepFn(z[0], z[1]); if (!w) return [-1, it];
            const dd = Math.hypot(w[0] - z[0], w[1] - z[1]); z = w;
            if (!isFinite(z[0]) || Math.abs(z[0]) > 1e8) return [-1, it];
            if (dd < 1e-9) break;
          }
          if (it >= 60) return [-1, it];
          if (fam === 'pow') { const N = nn.value, k = ((Math.round(Math.atan2(z[1], z[0]) * N / (2 * Math.PI)) % N) + N) % N; return [k, it]; }
          let b = 0, bd = Infinity; cubicRoots.forEach((r, i) => { const d = Math.hypot(z[0] - r[0], z[1] - r[1]); if (d < bd) { bd = d; b = i; } });
          return [b, it];
        }
        let shades = [];
        v.render(() => {
          s.setView([view.cx - view.h * 1.5, view.cx + view.h * 1.5], [view.cy - view.h, view.cy + view.h]);
          const nr = fam === 'pow' ? nn.value : 3;
          shades = []; for (let k = 0; k < nr; k++) { const row = []; for (let j = 0; j < 12; j++) row.push(v.ramp(0.92 - 0.55 * j / 11, NAMES[k % 6])); shades.push(row); }
          const dark = v.ramp(0.35, 'ink');
          s.raster((x, y) => { const [k, it] = classify(x, y); if (k < 0) return dark; return shades[k][Math.min(11, Math.floor(it / 3))]; }, { key: `${fam}|${nn.value}|${view.cx}|${view.cy}|${view.h}|${s.width}|${v.ramp(0.5, 'blue').join()}`, id: 'basin', res: 3 });
          let z = [h.x, h.y]; const pts = [z];
          for (let k = 0; k < 10; k++) { const w = stepFn(z[0], z[1]); if (!w || !isFinite(w[0]) || Math.abs(w[0]) > 1e6) break; z = w; pts.push(z); }
          s.path(pts, { color: 'ink', width: 1.4 }); s.dots(pts.slice(1), { color: 'ink', r: 2.5 });
          const roots = fam === 'pow' ? Array.from({ length: nr }, (_, k) => [Math.cos(2 * Math.PI * k / nr), Math.sin(2 * Math.PI * k / nr)]) : cubicRoots;
          roots.forEach(([a, b]) => s.dot(a, b, { r: 5, color: 'ink', hollow: true }));
          s.corner(`view width ${v.fmt(6 * view.h / 2, 3)}`, 'br', { color: 'muted', plate: true });
        });
        v.readout(() => { const c = classify(h.x, h.y); return `start $z_0=${v.fix(h.x, 4)}${h.y < 0 ? '-' : '+'}${v.fix(Math.abs(h.y), 4)}i$ → ${c[0] < 0 ? '**no convergence** within 60 steps' : `root number ${c[0] + 1} after ${c[1]} steps`}`; });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'Multiple roots slow Newton to linear convergence',
      statement: String.raw`If $x^*$ is a root of multiplicity $m\ge2$, i.e. $f(x)=(x-x^*)^m g(x)$ with $g(x^*)\ne0$, then Newton's method converges to it only linearly:
$$\frac{x_{n+1}-x^*}{x_n-x^*}\longrightarrow\frac{m-1}{m}.$$
The modified iteration $x_{n+1}=x_n-m\,f(x_n)/f'(x_n)$ restores quadratic convergence (when $m$ is known).`,
      idea: String.raw`With $f=(x-x^*)^m g$ one finds $f/f'=\dfrac{(x-x^*)g}{m g+(x-x^*)g'}$, so the Newton map is $N(x)=x-\tfrac1m(x-x^*)+O((x-x^*)^2)$ and $N'(x^*)=1-\tfrac1m$, which is not zero. The principle of 2.2 gives linear convergence with exactly this rate; the factor $m$ in the modified step makes $N'(x^*)=0$ and brings back the quadratic order of 2.5. Both iterations are drawn in the cobweb as the one-dimensional maps they are.`,
      caption: String.raw`The function is $f(x)=(x-1)^m(x+2)$. Slide the multiplicity $m$ and toggle the modified step. The left panel is the cobweb of the iteration map $x\mapsto N(x)$ near the root (slope of the map at $1$ is the rate $(m-1)/m$); the right panel shows the error history against the predicted straight line.`,
      deps: ['num-2.5'],
      refs: ['Süli–Mayers ch. 1'],
      scope: String.raw`Requires the multiplicity to be known for the modified step; with an unknown $m$ one applies Newton to $f/f'$, which has a simple root but needs $f''$.`,
      tags: ['Newton', 'multiple roots'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton%27s_method#Slow_convergence_for_roots_of_multiplicity_greater_than_1' },
      viz(v) {
        const m = v.slider('multiplicity $m$', 1, 6, 3, { int: true });
        const mod = v.toggle('modified step $m f/f\'$', false);
        const x0 = v.slider('start $x_0$', 1.2, 2.6, 2.2, { step: 0.01 });
        const s = v.stage({ x: [0.2, 2.8], y: [0.2, 2.8], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'N(x)', height: 340, title: 'the iteration map $N(x)$' });
        const e = v.stage({ x: [0, 40], y: [-16, 0.5], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₁₀ eₙ', height: 340, title: 'error history' });
        v.legend([['ink', 'Newton $N$'], ['teal', 'modified $N_m$'], ['gold', 'orbit'], ['orange', 'predicted slope $\\log_{10}\\frac{m-1}{m}$', { dash: true }]]);
        let info = {};
        const step = (x, M, k) => x - k * (x - 1) * (x + 2) / (M * (x + 2) + (x - 1));
        v.render(() => {
          const M = m.value, k = mod.value ? M : 1;
          s.line(0.2, 0.2, 2.8, 2.8, { color: 'faint' });
          s.fn((x) => step(x, M, 1), { color: 'ink', width: 2, domain: [0.2, 2.8] });
          s.fn((x) => step(x, M, M), { color: 'teal', width: 2, domain: [0.2, 2.8] });
          let x = x0.value; const pts = [[x, 0.2]], errs = [Math.abs(x - 1)];
          for (let i = 0; i < 40; i++) { const y = step(x, M, k); pts.push([x, y], [y, y]); x = y; errs.push(Math.abs(x - 1)); if (!(errs[errs.length - 1] > 0)) break; }
          s.path(pts.slice(0, 24), { color: 'gold', width: 1.4 });
          s.dot(1, 1, { color: 'green', hollow: true, r: 6 });
          const ys = errs.map((q, i) => [i, Math.max(lg(q), -16.4)]);
          e.dots(ys, { color: mod.value ? 'teal' : 'ink', r: 3.5 });
          if (!mod.value && M > 1) e.fn((i) => lg(errs[0]) + i * Math.log10((M - 1) / M), { color: 'orange', dash: true, domain: [0, 40] });
          if (!mod.value && M === 1) e.text('m = 1: simple root, quadratic', 20, -3, { color: 'muted' });
          let rat = null; for (let i = errs.length - 1; i >= 1; i--) if (errs[i - 1] > 1e-9 && errs[i - 1] < 1e-3) { rat = errs[i] / errs[i - 1]; break; }
          info = { M, rat, mod: mod.value, e: errs };
        });
        v.readout(() => `$m=${info.M}$: ${info.mod ? 'modified' : 'plain'} Newton. ` + (info.rat === null ? `error after ${info.e.length - 1} steps: $${tsci(info.e[info.e.length - 1], 2)}$` : `measured $e_{n+1}/e_n=${v.fix(info.rat, 4)}$` + (info.mod ? ' (the ratio keeps shrinking: quadratic)' : `; predicted $(m-1)/m=${v.fix((info.M - 1) / info.M, 4)}$`)) + `\nplain Newton needs about $${info.M > 1 ? Math.ceil(16 / -Math.log10((info.M - 1) / info.M)) : '5'}$ steps for 16 digits`);
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Algorithm',
      name: 'Secant method',
      statement: String.raw`Given two starting values $x_0,x_1$, define
$$x_{n+1}=x_n-f(x_n)\,\frac{x_n-x_{n-1}}{f(x_n)-f(x_{n-1})},$$
the zero of the chord through the last two points of the graph. No derivative is needed. For a simple root and $f\in C^2$ nearby it converges, from close enough starts, with order $p=\tfrac{1+\sqrt5}{2}\approx1.618$, the positive root of $p^2=p+1$.`,
      idea: String.raw`The error obeys $e_{n+1}\approx\dfrac{f''(x^*)}{2f'(x^*)}\,e_n\,e_{n-1}$ (the chord's error is the product of the two earlier errors times the Newton constant). Seeking $e_{n+1}\sim e_n^p$ and $e_n\sim e_{n-1}^p$ gives $p=1+1/p$, the golden ratio. Per evaluation of $f$ the secant method gains $1.618$ in order, while Newton gains $2$ per step but spends two evaluations ($f$ and $f'$): $\sqrt2=1.414<1.618$, so the secant method is often cheaper overall.`,
      caption: String.raw`Drag the two starting values $x_0,x_1$ (orange and gold handles) and step through the iteration: each chord (gold) through the last two points crosses the axis at the next iterate. On the right the secant errors (gold) are compared with Newton from $x_1$ (blue); the readout estimates the secant order from the last three errors and compares it with $1.618$.`,
      deps: ['num-2.4'],
      refs: ['Süli–Mayers ch. 1'],
      tags: ['secant', 'root finding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Secant_method' },
      viz(v) {
        let F = FUN.cosx;
        const sel = v.select('function', FUNOPTS, 'cosx', { onChange: (k) => { F = FUN[k]; s.setView(F.xr, F.yr); h0.set(F.x0, 0); h1.set(F.x0 - 0.5, 0); } });
        const n = v.slider('steps', 0, 9, 4, { int: true });
        const s = v.stage({ x: F.xr, y: F.yr, axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'chords' });
        const e = v.stage({ x: [0, 10], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₁₀ error', height: 320, title: 'secant versus Newton' });
        const h0 = s.handle(F.x0, 0, { color: 'orange', label: 'x₀', constrain: 'x' });
        const h1 = s.handle(F.x0 - 0.5, 0, { color: 'gold', label: 'x₁', constrain: 'x', labelPos: 'ne' });
        v.legend([['gold', 'secant'], ['accent', 'Newton from $x_1$']]);
        let info = {};
        v.render(() => {
          const xs = secantSeq(F.f, h0.x, h1.x, n.value);
          s.hline(0, { color: 'faint' }); s.fn(F.f, { color: 'ink', width: 2 });
          for (let k = 1; k + 1 < xs.length; k++) {
            const a = xs[k - 1], b = xs[k], c = xs[k + 1];
            s.segment([a, F.f(a)], [c, 0], { color: 'gold', width: 1.6, alpha: 0.5 + 0.5 * k / xs.length });
            s.segment([c, 0], [c, F.f(c)], { color: 'faint', dash: true });
          }
          s.dot(xs[0], F.f(xs[0]), { color: 'orange', r: 4 }); s.dot(xs[1], F.f(xs[1]), { color: 'gold', r: 4 });
          xs.forEach((x, k) => { if (k > 1) s.dot(x, 0, { color: 'gold', r: 3.5 }); });
          s.dot(F.root, 0, { color: 'green', hollow: true, r: 6 });
          const E = xs.map((x) => Math.abs(x - F.root)), Nw = newtonSeq(F.f, F.df, h1.x, 9).map((x) => Math.abs(x - F.root));
          e.dots(E.map((q, k) => [k, Math.max(lg(q), -16.4)]), { color: 'gold', r: 3.5 }); e.path(E.map((q, k) => [k, Math.max(lg(q), -16.4)]), { color: 'gold' });
          e.dots(Nw.map((q, k) => [k, Math.max(lg(q), -16.4)]), { color: 'accent', r: 3 }); e.path(Nw.map((q, k) => [k, Math.max(lg(q), -16.4)]), { color: 'accent', alpha: 0.6 });
          info = { p: lastOrder(E, 1e-14), E };
        });
        v.readout(() => `$e_n$: ` + info.E.slice(0, 8).map((q) => `$${tsci(q, 2)}$`).join(', ') + `\n` + (info.p === null ? 'order: converged too fast (or not yet close) to estimate' : `estimated order $p\\approx${v.fix(info.p, 2)}$ (theory: $(1+\\sqrt5)/2=1.618$)`));
      },
    },
  ],
};
