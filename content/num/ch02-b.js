// Numerical Analysis — Chapter 2: Solving nonlinear equations (items 2.10–2.18)
import { lg, sci, tsci, clamp, bisectRoot, newtonSeq, secantSeq, lastOrder, solve2, norm2, inv2, nrm, SYS, nearestRoot, newtonSys } from './ch02.shared.js';

const SYSOPTS = Object.values(SYS).map((S) => ({ value: S.key, label: S.name }));

/** Dekker–Brent style hybrid (the classic zeroin/zbrent logic), recording what kind of step each iteration was. */
function brentTrace(f, a, b, maxIt) {
  let fa = f(a), fb = f(b), c = b, fc = fb, d = 0, e = 0; const steps = [];
  for (let it = 0; it < maxIt; it++) {
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) { c = a; fc = fa; e = d = b - a; }
    if (Math.abs(fc) < Math.abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
    const tol1 = 2 * 2.2e-16 * Math.abs(b) + 1e-15, xm = 0.5 * (c - b);
    if (Math.abs(xm) <= tol1 || fb === 0) break;
    let type = 'bisect';
    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      let p, q, r; const s = fb / fa;
      if (a === c) { p = 2 * xm * s; q = 1 - s; } else { q = fa / fc; r = fb / fc; p = s * (2 * xm * q * (q - r) - (b - a) * (r - 1)); q = (q - 1) * (r - 1) * (s - 1); }
      if (p > 0) q = -q; p = Math.abs(p);
      const min1 = 3 * xm * q - Math.abs(tol1 * q), min2 = Math.abs(e * q);
      if (2 * p < Math.min(min1, min2)) { e = d; d = p / q; type = a === c ? 'secant' : 'interp'; } else { d = xm; e = d; }
    } else { d = xm; e = d; }
    a = b; fa = fb;
    if (Math.abs(d) > tol1) b += d; else b += xm > 0 ? tol1 : -tol1;
    fb = f(b);
    const other = (fb > 0 && fc > 0) || (fb < 0 && fc < 0) ? a : c;
    steps.push({ x: b, fx: fb, type, len: Math.abs(b - other), lo: Math.min(b, other), hi: Math.max(b, other) });
  }
  return steps;
}
const regulaFalsi = (f, a, b, n) => { let fa = f(a), fb = f(b); const out = []; for (let i = 0; i < n; i++) { const c = (a * fb - b * fa) / (fb - fa), fc = f(c); out.push(c); if (fc === 0) break; if (fa * fc < 0) { b = c; fb = fc; } else { a = c; fa = fc; } } return out; };

export default {
  collection: 'num',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Algorithm',
      name: 'Safeguarded methods (Brent’s method)',
      statement: String.raw`A **safeguarded** root finder keeps a bracket $[a,b]$ with $f(a)f(b)<0$ at all times and proposes the next point by a fast interpolation formula (secant or inverse quadratic interpolation). The proposal is accepted only if it lies inside the bracket and reduces the step sufficiently quickly; otherwise a bisection step is taken. The bracket therefore never grows, the worst case is a small multiple of the bisection count, and on smooth functions the speed is that of the secant method (order about $1.84$ for inverse quadratic interpolation). Brent's method is the standard implementation.`,
      idea: String.raw`Bisection (2.1) is slow but cannot fail; the secant method (2.9) is fast but may leave the bracket or stagnate. Combining them keeps the guarantee of the first and the speed of the second: each accepted interpolation step is good, and each rejected one is replaced by a step that provably halves the bracket within a few iterations. The classical false-position rule, which always interpolates inside the bracket but never bisects, can stall with one end fixed forever on a convex function — the standard reason a safeguard is needed.`,
      caption: String.raw`The curve shows the iterates of a Dekker–Brent style hybrid (the structure of the standard algorithm): green for interpolation steps, orange for bisection steps. Drag $a$ and $b$ and choose a function; on the right the error is compared with plain bisection and with false position, which stalls on the convex $x^9$. The slider limits the number of function evaluations shown.`,
      deps: ['num-2.1', 'num-2.9'],
      refs: ['Süli–Mayers ch. 1'],
      credit: 'Dekker, 1969; Brent, 1971 (book 1973)',
      scope: String.raw`Requires a sign-changing bracket and continuity. The code here is the textbook logic of the algorithm written from memory of its published structure, not a port of any particular library.`,
      tags: ['root finding', 'Brent', 'hybrid'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brent%27s_method' },
      viz(v) {
        const CASES = {
          smooth: { f: (x) => Math.cos(x) - x, xr: [-1, 3], yr: [-2.8, 2], br: [0, 1.5] },
          convex: { f: (x) => x ** 9 - 0.1, xr: [-0.3, 1.5], yr: [-0.5, 2], br: [0, 1.4] },
          cbrt: { f: (x) => Math.cbrt(x - 0.3), xr: [-1, 2], yr: [-1.4, 1.4], br: [-0.9, 1.8] },
          steep: { f: (x) => Math.tanh(40 * (x - 0.3)), xr: [-1, 2], yr: [-1.5, 1.5], br: [-0.9, 1.8] },
        };
        let C = CASES.convex;
        const sel = v.select('function', [{ value: 'smooth', label: '$\\cos x-x$' }, { value: 'convex', label: '$x^9-0.1$' }, { value: 'cbrt', label: '$\\sqrt[3]{x-0.3}$' }, { value: 'steep', label: '$\\tanh 40(x-0.3)$' }], 'convex', { onChange: (k) => { C = CASES[k]; s.setView(C.xr, C.yr); ha.set(C.br[0], 0); hb.set(C.br[1], 0); } });
        const n = v.slider('evaluations', 1, 40, 14, { int: true });
        const s = v.stage({ x: C.xr, y: C.yr, axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'hybrid steps' });
        const e = v.stage({ x: [0, 40], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'function evaluations', ylabel: 'log₁₀ error', height: 320, title: 'error of the best iterate' });
        const ha = s.handle(C.br[0], 0, { color: 'orange', label: 'a', constrain: 'x' });
        const hb = s.handle(C.br[1], 0, { color: 'orange', label: 'b', constrain: 'x', labelPos: 'ne' });
        v.legend([['green', 'interpolation step'], ['orange', 'bisection step'], ['purple', 'bisection'], ['red', 'false position'], ['accent', 'hybrid']]);
        let info = {};
        v.render(() => {
          const lo = Math.min(ha.x, hb.x), hi = Math.max(ha.x, hb.x), f = C.f;
          s.hline(0, { color: 'faint' }); s.fn(f, { color: 'ink', width: 2 });
          if (!(f(lo) * f(hi) < 0)) { s.corner('no sign change: no bracket', 'tl', { color: 'red' }); info = null; return; }
          const r = bisectRoot(f, lo, hi), N = n.value;
          const st = brentTrace(f, lo, hi, 60).slice(0, N);
          const last = st[st.length - 1];
          if (last) s.vband(last.lo, last.hi, { color: 'green', alpha: 0.15 });
          st.forEach((q, k) => { s.dot(q.x, q.fx, { r: 4.5, color: q.type === 'bisect' ? 'orange' : 'green' }); if (k < 9) s.text(String(k + 1), q.x, q.fx, { size: 10, dy: -11, color: 'muted' }); });
          s.dot(r, 0, { color: 'green', hollow: true, r: 6 });
          const E = (xs) => xs.map((x) => [0, lg(Math.abs(x - r))]);
          const brent = [lg(Math.abs((lo + hi) / 2 - r)), ...st.map((q) => lg(Math.abs(q.x - r)))];
          const bis = []; { let a = lo, b = hi; for (let k = 0; k < 41; k++) { const c = (a + b) / 2; bis.push(lg(Math.abs(c - r))); if (f(a) * f(c) <= 0) b = c; else a = c; } }
          const rf = regulaFalsi(f, lo, hi, 40).map((x) => lg(Math.abs(x - r)));
          const clampPts = (arr) => arr.map((y, k) => [k, Math.max(y, -16.3)]);
          e.path(clampPts(bis), { color: 'purple', alpha: 0.7 }); e.path(clampPts(rf), { color: 'red', alpha: 0.7 }); e.path(clampPts(brent), { color: 'accent', width: 2 }); e.dots(clampPts(brent), { color: 'accent', r: 3 });
          const nb = st.filter((q) => q.type === 'bisect').length;
          info = { nb, ni: st.length - nb, len: last ? last.len : hi - lo, err: Math.abs((last ? last.x : (lo + hi) / 2) - r), len0: hi - lo };
        });
        v.readout(() => info ? `${info.ni} interpolation steps, ${info.nb} bisection steps; bracket length $${tsci(info.len0)}\\to${tsci(info.len)}$ (never larger), error of best point $${tsci(info.err, 2)}$` : 'No sign change: no bracket to safeguard.');
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Method',
      name: 'Aitken’s Δ² acceleration',
      statement: String.raw`Given a sequence $x_n$ converging linearly, $x_{n+1}-x^*\approx\rho(x_n-x^*)$, form
$$\hat x_n=x_n-\frac{(x_{n+1}-x_n)^2}{x_{n+2}-2x_{n+1}+x_n}.$$
If $x_n-x^*=\rho^n c$ exactly then $\hat x_n=x^*$; for a fixed-point sequence $x_{n+1}=g(x_n)$ with $0<|g'(x^*)|<1$ the sequence $\hat x_n$ converges to $x^*$ faster than $x_n$: $(\hat x_n-x^*)/(x_n-x^*)\to0$. Applying the formula and restarting the iteration from $\hat x_n$ each time is Steffensen's method, which converges quadratically without a derivative.`,
      idea: String.raw`Linear convergence means the errors are close to a geometric sequence, and the three consecutive terms determine the geometric progression: the formula extrapolates it to its limit, exactly like summing $\sum\rho^k$ from three partial sums. Geometrically, the chord through $(x_n,x_{n+1})$ and $(x_{n+1},x_{n+2})$ on the graph of $g$ meets the diagonal $y=x$ at $\hat x_n$: the chord replaces $g$ by its linearisation and solves the linear fixed-point problem exactly (the idea behind 2.2).`,
      caption: String.raw`Left: the cobweb of $g$ with the chord through two consecutive points of the orbit; where it meets the diagonal is $\hat x_k$. Slide $k$ to move the triple. Right: the errors of $x_n$, of Aitken's $\hat x_n$ and of Steffensen's restarted iteration. Rounding noise limits what can be seen below $10^{-15}$ (and $\Delta^2x$ becomes $0/0$).`,
      deps: ['num-2.2'],
      refs: ['Süli–Mayers ch. 1'],
      credit: 'Aitken, 1926; Steffensen, 1933',
      tags: ['acceleration', 'extrapolation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Aitken%27s_delta-squared_process' },
      viz(v) {
        const G = {
          cos: { g: Math.cos, tex: '\\cos x', x0: 1 },
          exp: { g: (x) => Math.exp(-x), tex: 'e^{-x}', x0: 1 },
          sqrt: { g: (x) => Math.sqrt(2 + x), tex: '\\sqrt{2+x}', x0: 0.2 },
          sin: { g: (x) => 0.9 * Math.sin(x) + 0.2 * x * 0 + 0.1, tex: '0.9\\sin x+0.1', x0: 1.5 },
        };
        for (const o of Object.values(G)) o.xs = bisectRoot((x) => o.g(x) - x, -1, 3);
        let g = G.cos;
        const sel = v.select('map $g$', Object.entries(G).map(([k, o]) => ({ value: k, label: `$${o.tex}$` })), 'cos', { onChange: (k) => { g = G[k]; x0.set(g.x0); const W = 0.8; s.setView([g.xs - W, g.xs + W], [g.xs - W, g.xs + W]); } });
        const x0 = v.slider('start $x_0$', -0.5, 2.5, 1, { step: 0.01 });
        const k = v.slider('triple $k$', 0, 12, 2, { int: true });
        const s = v.stage({ x: [-0.1, 1.5], y: [-0.1, 1.5], equal: true, axes: 'box', gutter: true, xlabel: 'x', height: 340, title: 'the chord through two orbit points' });
        const e = v.stage({ x: [0, 14], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₁₀ error', height: 340, title: 'plain, Aitken, Steffensen' });
        v.legend([['accent', '$x_n$'], ['green', 'Aitken $\\hat x_n$'], ['gold', 'Steffensen']]);
        let info = {};
        const aitken = (a, b, c) => { const den = c - 2 * b + a; return den === 0 ? c : a - (b - a) ** 2 / den; };
        v.render(() => {
          const xs = [x0.value]; for (let i = 0; i < 16; i++) xs.push(g.g(xs[i]));
          const W = 0.8; s.setView([g.xs - W, g.xs + W], [g.xs - W, g.xs + W]);
          s.line(g.xs - W, g.xs - W, g.xs + W, g.xs + W, { color: 'faint' });
          s.fn(g.g, { color: 'ink', width: 2, domain: [g.xs - W, g.xs + W] });
          const pts = [[xs[0], xs[0]]]; for (let i = 0; i < 8; i++) pts.push([xs[i], xs[i + 1]], [xs[i + 1], xs[i + 1]]);
          s.path(pts, { color: 'accent', width: 1, alpha: 0.7 });
          const kk = Math.min(k.value, 12), a = xs[kk], b = xs[kk + 1], c = xs[kk + 2], xh = aitken(a, b, c);
          if (b !== a) { const slope = (c - b) / (b - a); s.fn((x) => b + slope * (x - a), { color: 'green', width: 1.6, domain: [g.xs - W, g.xs + W] }); }
          s.dot(a, b, { color: 'gold', r: 4 }); s.dot(b, c, { color: 'gold', r: 4 }); s.dot(xh, xh, { color: 'green', r: 6, hollow: true, label: 'x̂', labelPos: 'se' });
          s.dot(g.xs, g.xs, { color: 'ink', r: 3 });
          const E1 = xs.map((x) => Math.abs(x - g.xs)), Ea = [];
          for (let i = 0; i + 2 < xs.length; i++) { const q = Math.abs(aitken(xs[i], xs[i + 1], xs[i + 2]) - g.xs); Ea.push(q); }
          const Es = []; { let y = x0.value; Es.push(Math.abs(y - g.xs)); for (let i = 0; i < 6; i++) { const z1 = g.g(y), z2 = g.g(z1); y = aitken(y, z1, z2); if (!isFinite(y)) break; Es.push(Math.abs(y - g.xs)); } }
          const P = (arr, step = 1) => arr.map((q, i) => [i * step, Math.max(lg(q), -16.3)]);
          e.path(P(E1), { color: 'accent', alpha: 0.7 }); e.dots(P(E1), { color: 'accent', r: 3 });
          e.path(P(Ea), { color: 'green', alpha: 0.7 }); e.dots(P(Ea), { color: 'green', r: 3 });
          e.path(P(Es), { color: 'gold', alpha: 0.7 }); e.dots(P(Es), { color: 'gold', r: 3 });
          info = { xh, err: Math.abs(xh - g.xs), plain: E1[kk + 2], rho: (g.g(g.xs + 1e-6) - g.g(g.xs - 1e-6)) / 2e-6 };
        });
        v.readout(() => `$g'(x^*)\\approx${v.fix(info.rho, 3)}$. Triple $k=${k.value}$: $x_{k+2}$ has error $${tsci(info.plain, 2)}$, the Aitken value $\\hat x_k=${v.fix(info.xh, 10)}$ has error $${tsci(info.err, 2)}$ — about ${info.err > 0 ? v.fmt(info.plain / info.err, 2) : '∞'} times smaller from the same three iterates`);
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Contraction mapping theorem in ℝⁿ',
      statement: String.raw`Let $D\subset\mathbb R^n$ be closed and let $g:D\to D$ satisfy $\|g(x)-g(y)\|\le L\|x-y\|$ for all $x,y\in D$ with $L<1$. Then $g$ has exactly one fixed point $x^*\in D$, and for every $x_0\in D$ the iterates $x_{k+1}=g(x_k)$ converge to it with
$$\|x_k-x^*\|\le\frac{L^k}{1-L}\|x_1-x_0\|.$$
On a convex $D$, $L=\sup_D\|g'(x)\|$ (the operator norm of the Jacobian) is a valid constant.`,
      idea: String.raw`Distances between orbits shrink by $L$ at each step, so $(x_k)$ is Cauchy (summing the geometric series $\sum L^j\|x_1-x_0\|$), and $\mathbb R^n$ is complete (nla-1.4 supplies the norm; pma-9.23 is the proof for metric spaces). The limit is a fixed point by continuity and unique because two fixed points would be at distance $\le L$ times themselves. Self-mapping, $g(D)\subset D$, is part of the hypotheses: it is what stops the orbit from leaving the region where the contraction estimate holds.`,
      caption: String.raw`The map is $g(p)=c\,(0.3R_{35^\circ}p+0.25(\sin y,\cos x))+t$ on the square $D=[-2,2]^2$ (grey). Dots are a $7\times7$ grid of starts; the slider $k$ shows them after $k$ iterations, with the image of the square's boundary in green. Raise $c$ until the numerically computed $L=\sup\|g'\|$ exceeds $1$ or the image leaves the square: the hypotheses fail and the points no longer necessarily collapse.`,
      deps: ['pma-9.23', 'nla-1.4'],
      refs: ['Süli–Mayers ch. 4'],
      credit: 'Banach, 1922',
      scope: String.raw`Complete metric space and Lipschitz constant $L<1$ on a set mapped into itself; $L$ here is estimated by sampling $\|g'\|_2$ on a $41\times41$ grid, so it is a numerical estimate, not a proof.`,
      tags: ['contraction', 'fixed point', 'Banach'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Banach_fixed-point_theorem' },
      viz(v) {
        const c = v.slider('scale $c$', 0.3, 3.2, 1, { step: 0.01 });
        const k = v.slider('iterations $k$', 0, 14, 1, { int: true });
        const s = v.stage({ x: [-2.5, 2.5], y: [-2.4, 2.4], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', height: 420, title: 'a grid of starts under $g^k$' });
        const co = Math.cos(35 * Math.PI / 180), si = Math.sin(35 * Math.PI / 180), T = [0.3, -0.2];
        const gmap = (C) => ([x, y]) => [C * (0.3 * (co * x - si * y) + 0.25 * Math.sin(y)) + T[0], C * (0.3 * (si * x + co * y) + 0.25 * Math.cos(x)) + T[1]];
        const Jac = (C, [x, y]) => [[C * 0.3 * co, C * (-0.3 * si + 0.25 * Math.cos(y))], [C * (0.3 * si - 0.25 * Math.sin(x)), C * 0.3 * co]];
        let info = {};
        v.legend([['green', 'image of the boundary of $D$'], ['gold', 'grid of starts'], ['red', 'fixed point']]);
        v.render(() => {
          const C = c.value, g = gmap(C), D = 2;
          s.rect(-D, -D, D, D, { fill: 'faint', fillAlpha: 0.12, color: 'faint' });
          let L = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) L = Math.max(L, norm2(Jac(C, [-D + 4 * i / 40, -D + 4 * j / 40])));
          const bd = []; for (let i = 0; i < 80; i++) { const t = (i % 20) / 20 * 4 - 2, side = Math.floor(i / 20); bd.push(side === 0 ? [t, -D] : side === 1 ? [D, t] : side === 2 ? [-t, D] : [-D, -t]); }
          bd.push(bd[0]);
          let cur = bd; let selfMap = true;
          for (let j = 0; j <= k.value; j++) {
            if (j > 0) cur = cur.map(g);
            if (j === 1) for (const p of cur) if (Math.abs(p[0]) > D || Math.abs(p[1]) > D) selfMap = false;
            if (j === k.value || j <= 4) s.path(cur, { color: 'green', width: j === k.value ? 2 : 1, alpha: j === k.value ? 1 : 0.35 });
          }
          let p = [0, 0]; for (let j = 0; j < 400; j++) { const q = g(p); if (!isFinite(q[0]) || Math.abs(q[0]) > 1e6) break; p = q; }
          const fixOK = nrm([g(p)[0] - p[0], g(p)[1] - p[1]]) < 1e-9;
          let worst = 0; const gp = [];
          for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { let q = [-D + 4 * i / 6, -D + 4 * j / 6]; for (let m = 0; m < k.value; m++) q = g(q); gp.push(q); if (fixOK) worst = Math.max(worst, Math.hypot(q[0] - p[0], q[1] - p[1])); }
          s.dots(gp.filter((q) => Math.abs(q[0]) < 50), { color: 'gold', r: 3 });
          if (fixOK) s.dot(p[0], p[1], { color: 'red', r: 5, hollow: true });
          info = { L, selfMap, fixOK, worst, p };
        });
        v.readout(() => `$L=\\sup\\|g'\\|_2\\approx${v.fix(info.L, 3)}$ ${info.L < 1 ? '(< 1: contraction)' : '(≥ 1: not a contraction on $D$)'}; $g(D)\\subset D$: ${info.selfMap ? 'yes' : '**no**'}\n` + (info.fixOK ? `fixed point $(${v.fix(info.p[0], 4)},${v.fix(info.p[1], 4)})$; after $k=${k.value}$ steps the farthest start is $${v.fix(info.worst, 4)}$ from it (bound $L^k\\cdot\\mathrm{diam}=${v.fix(info.L ** k.value * 4 * Math.SQRT2, 4)}$)` : 'the iteration from the origin does not settle on a fixed point'));
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Algorithm',
      name: 'Newton’s method for systems',
      statement: String.raw`To solve $F(x)=0$ with $F:\mathbb R^n\to\mathbb R^n$ differentiable, solve the linearised system at the current point and move there:
$$J(x_k)\,s_k=-F(x_k),\qquad x_{k+1}=x_k+s_k,$$
where $J=F'$ is the Jacobian matrix. If $F\in C^2$, $F(x^*)=0$ and $J(x^*)$ is invertible, the iteration converges quadratically from every start close enough to $x^*$: $\|x_{k+1}-x^*\|\le C\|x_k-x^*\|^2$.`,
      idea: String.raw`Each component $F_i$ is replaced by its tangent plane (the derivative of pma-9.17), and the next iterate is where the $n$ tangent planes meet, which is a linear system solved by elimination (nla-4.3). The error analysis of 2.5 carries over with $f'$ replaced by $J^{-1}$ and $f''$ by the second derivative of $F$ as a bilinear map, so the order is two. Each step costs one Jacobian and one linear solve — the cost that quasi-Newton methods (2.15) try to avoid.`,
      caption: String.raw`Two curves $F_1=0$ (blue) and $F_2=0$ (orange). Drag the start and step: at each iterate the two curves are replaced by their tangent lines, and the next iterate is where those lines cross. The right panel plots the distance to the nearest root, which squares at each step. Start near a point where the two tangents are nearly parallel (singular Jacobian) and the step flies away.`,
      deps: ['num-2.5', 'pma-9.17', 'nla-4.3'],
      refs: ['Süli–Mayers ch. 4'],
      scope: String.raw`Needs an invertible Jacobian at the root and a good enough start; far from a root the iteration may jump between solutions or diverge (see damping in 2.16).`,
      tags: ['Newton', 'systems', 'Jacobian'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Newton%27s_method#k_variables,_k_equations' },
      viz(v) {
        let S = SYS.hyp;
        const sel = v.select('system', SYSOPTS, 'hyp', { onChange: (k) => { S = SYS[k]; s.setView(S.view[0], S.view[1]); h.set(...S.x0); } });
        const n = v.slider('steps', 0, 8, 3, { int: true });
        const s = v.stage({ x: S.view[0], y: S.view[1], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', height: 400, title: 'tangent lines and their crossing' });
        const e = v.stage({ x: [0, 8], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'step k', ylabel: 'log₁₀ distance to a root', height: 400, title: 'quadratic convergence' });
        const h = s.handle(S.x0[0], S.x0[1], { color: 'gold', label: 'x₀' });
        v.legend([['accent', '$F_1=0$'], ['orange', '$F_2=0$'], ['gold', 'iterates']]);
        let pts = [];
        v.render(() => {
          s.clip(() => { s.contour((x, y) => S.F([x, y])[0], [0], { color: 'accent', width: 2, res: 110 }); s.contour((x, y) => S.F([x, y])[1], [0], { color: 'orange', width: 2, res: 110 }); });
          pts = newtonSys(S, [h.x, h.y], n.value);
          pts.forEach((p, k) => {
            if (k + 1 >= pts.length) return;
            const F = S.F(p), J = S.J(p), last = k + 2 >= pts.length;
            for (let i = 0; i < 2; i++) {
              const g = J[i], gg = g[0] ** 2 + g[1] ** 2; if (!gg) continue;
              const b = [p[0] - F[i] * g[0] / gg, p[1] - F[i] * g[1] / gg], d = [-g[1] / Math.sqrt(gg), g[0] / Math.sqrt(gg)];
              s.clip(() => s.segment([b[0] - 8 * d[0], b[1] - 8 * d[1]], [b[0] + 8 * d[0], b[1] + 8 * d[1]], { color: i ? 'orange' : 'accent', dash: true, width: 1.2, alpha: last ? 1 : 0.35 }));
            }
          });
          s.path(pts, { color: 'gold', width: 1.4 });
          pts.forEach((p, k) => s.dot(p[0], p[1], { color: k === 0 ? 'gold' : 'ink', r: 3.5 }));
          S.roots.forEach((r) => s.dot(r[0], r[1], { color: 'green', hollow: true, r: 6 }));
          const E = pts.map((p) => nearestRoot(S, p));
          e.dots(E.map((q, k) => [k, Math.max(lg(q), -16.3)]), { color: 'gold', r: 4 }); e.path(E.map((q, k) => [k, Math.max(lg(q), -16.3)]), { color: 'gold', alpha: 0.6 });
        });
        v.readout(() => { const F = S.F(pts[pts.length - 1]); const d = pts.map((p) => nearestRoot(S, p)); return `$${S.texF}$ (${S.roots.length} real solutions)\n$x_{${pts.length - 1}}=(${v.fix(pts[pts.length - 1][0], 8)},\\,${v.fix(pts[pts.length - 1][1], 8)})$, residual $\\|F\\|=${tsci(nrm(F), 2)}$` + (d.length > 2 && d[d.length - 2] > 1e-8 ? `, last two distances $${tsci(d[d.length - 2], 2)}\\to${tsci(d[d.length - 1], 2)}$` : ''); });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Newton–Kantorovich theorem',
      statement: String.raw`Let $F:\mathbb R^n\to\mathbb R^n$ be differentiable with $\|F'(x)-F'(y)\|\le K\|x-y\|$, and suppose at a start $x_0$ that $F'(x_0)$ is invertible with $\|F'(x_0)^{-1}\|\le\beta$ and $\|F'(x_0)^{-1}F(x_0)\|\le\eta$. If
$$h=\beta K\eta\le\tfrac12,$$
then $F$ has a root $x^*$ with $\|x^*-x_0\|\le r=\dfrac{1-\sqrt{1-2h}}{\beta K}$, Newton's iterates stay in that ball, converge to $x^*$ (quadratically when $h<\tfrac12$), and the root is unique in a slightly larger ball.`,
      idea: String.raw`The theorem proves existence of a root without assuming one: everything is computed at $x_0$. It compares Newton's iteration with the scalar Newton iteration for the quadratic $\tfrac{K}{2}t^2-t/\beta+\eta/\beta$ (a *majorant*), whose first root is $r$: the scalar iterates $t_k$ increase to $r$ and dominate the step lengths $\|x_{k+1}-x_k\|$, so the sequence is Cauchy. The condition $h\le\tfrac12$ is exactly the discriminant condition for that quadratic to have a real root.`,
      caption: String.raw`System: $x^2+y^2=4$, $xy=1$, for which $J(x)-J(y)$ has operator norm at most $\sqrt5\,\|x-y\|$, so $K=\sqrt5$ is a valid global constant. The green region is the set of starts passing the test $h\le\frac12$. Drag $x_0$ into it: the ball of radius $r$ (orange) appears, contains a root (green circle), and the Newton iterates stay inside it. Outside the region the test is silent, though Newton may still converge.`,
      deps: ['num-2.13'],
      refs: ['Süli–Mayers ch. 4'],
      credit: 'Kantorovich, 1948',
      scope: String.raw`The test is sufficient, not necessary: it is typically pessimistic. Norms are Euclidean; $K=\sqrt5$ is a rigorous bound for this particular quadratic system.`,
      tags: ['Newton', 'Kantorovich', 'existence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kantorovich_theorem' },
      viz(v) {
        const S = SYS.hyp, K = S.K;
        const hOf = (p) => { const Ji = inv2(S.J(p)); if (!Ji) return Infinity; const F = S.F(p), beta = norm2(Ji), eta = nrm([Ji[0][0] * F[0] + Ji[0][1] * F[1], Ji[1][0] * F[0] + Ji[1][1] * F[1]]); return beta * K * eta; };
        const s = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', height: 440, title: 'starts that pass the Kantorovich test' });
        const h0 = s.handle(2.1, 0.6, { color: 'gold', label: 'x₀' });
        v.legend([['green', 'region $h\\le\\frac12$'], ['orange', 'ball of radius $r$'], ['gold', 'Newton iterates'], ['green', 'roots', { dot: true }]]);
        let info = {};
        v.render(() => {
          const gc = v.ramp(0.45, 'green');
          s.raster((x, y) => (hOf([x, y]) <= 0.5 ? gc : null), { key: 'kant|' + gc.join(), id: 'kant', res: 4 });
          s.clip(() => { s.contour((x, y) => S.F([x, y])[0], [0], { color: 'accent', width: 1.4, alpha: 0.7, res: 100 }); s.contour((x, y) => S.F([x, y])[1], [0], { color: 'accent', width: 1.4, alpha: 0.7, res: 100 }); });
          const p0 = [h0.x, h0.y], H = hOf(p0), Ji = inv2(S.J(p0));
          let r = null, inside = null, lim = null;
          const pts = newtonSys(S, p0, 10);
          if (H <= 0.5) {
            const F = S.F(p0), beta = norm2(Ji); r = (1 - Math.sqrt(1 - 2 * H)) / (beta * K);
            s.circle(p0[0], p0[1], r, { color: 'orange', fill: 'orange', fillAlpha: 0.12, width: 2 });
            lim = pts[pts.length - 1]; inside = pts.every((q) => Math.hypot(q[0] - p0[0], q[1] - p0[1]) <= r * (1 + 1e-9));
          }
          s.path(pts, { color: 'gold', width: 1.4 }); pts.forEach((q, k) => s.dot(q[0], q[1], { color: k ? 'ink' : 'gold', r: k ? 3 : 4.5 }));
          S.roots.forEach((q) => s.dot(q[0], q[1], { color: 'green', hollow: true, r: 6 }));
          info = { H, r, inside, dist: lim ? Math.hypot(lim[0] - p0[0], lim[1] - p0[1]) : null, beta: Ji ? norm2(Ji) : NaN };
        });
        v.readout(() => `$\\beta=${v.fix(info.beta, 3)}$, $K=\\sqrt5=${v.fix(K, 3)}$, $h=\\beta K\\eta=${v.fix(info.H, 3)}$ → ` + (info.H <= 0.5 ? `**test passed**: root within $r=${v.fix(info.r, 3)}$; Newton limit at distance $${v.fix(info.dist, 3)}$, iterates ${info.inside ? 'all inside' : 'not all inside'} the ball` : '**test not passed** (the theorem says nothing)'));
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Algorithm',
      name: 'Broyden’s quasi-Newton method',
      statement: String.raw`Broyden's method solves $F(x)=0$ using an approximate Jacobian $B_k$ updated after each step by the smallest rank-one change that satisfies the **secant equation**:
$$s_k=-B_k^{-1}F(x_k),\quad x_{k+1}=x_k+s_k,\quad y_k=F(x_{k+1})-F(x_k),\quad B_{k+1}=B_k+\frac{(y_k-B_ks_k)\,s_k^{\mathsf T}}{s_k^{\mathsf T}s_k}.$$
Under Newton-type hypotheses and a good enough start and $B_0$, the iteration converges superlinearly: $\|x_{k+1}-x^*\|/\|x_k-x^*\|\to0$, although the order is below $2$.`,
      idea: String.raw`The update is the secant method (2.9) in several variables: the one-dimensional slope $(f_{k+1}-f_k)/(x_{k+1}-x_k)$ becomes a matrix that must map $s_k$ to $y_k$. Of the many matrices that do so, Broyden's is the closest to $B_k$ in Frobenius norm. It need not converge to the true Jacobian, but it becomes correct *along the directions the iteration actually uses*, which is exactly what superlinear convergence needs (the Dennis–Moré condition). Each step costs one evaluation of $F$ and no Jacobian.`,
      caption: String.raw`Drag the start and choose a system. Newton's path (blue) and Broyden's path (gold) are drawn on the plane; on the right the distances to the nearest root. Toggle $B_0=I$ to start from a bad matrix and watch the convergence slow down before it speeds up. The readout shows how far $B_k$ is from the true Jacobian: it does not go to zero — the update only learns the Jacobian along the steps taken.`,
      deps: ['num-2.13', 'num-2.9'],
      refs: ['Süli–Mayers ch. 4'],
      credit: 'Broyden, 1965',
      scope: String.raw`Local convergence only; the update can break down if $s_k^{\mathsf T}s_k$ or $\det B_k$ vanishes. Here the first matrix $B_0$ is the exact Jacobian at $x_0$ unless toggled.`,
      tags: ['Broyden', 'quasi-Newton'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Broyden%27s_method' },
      viz(v) {
        let S = SYS.hyp;
        const sel = v.select('system', SYSOPTS, 'hyp', { onChange: (k) => { S = SYS[k]; s.setView(S.view[0], S.view[1]); h.set(...S.x0); } });
        const n = v.slider('steps', 0, 14, 8, { int: true });
        const ident = v.toggle('start with $B_0=I$', false);
        const s = v.stage({ x: S.view[0], y: S.view[1], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', height: 400, title: 'Newton and Broyden paths' });
        const e = v.stage({ x: [0, 14], y: [-16, 1], axes: 'box', gutter: true, xlabel: 'step k', ylabel: 'log₁₀ distance to a root', height: 400, title: 'convergence' });
        const h = s.handle(S.x0[0], S.x0[1], { color: 'gold', label: 'x₀' });
        v.legend([['accent', 'Newton'], ['gold', 'Broyden']]);
        let info = {};
        function broyden(p0, N, useI) {
          let B = useI ? [[1, 0], [0, 1]] : S.J(p0).map((r) => r.slice()), p = p0; const pts = [p], Bs = [B];
          for (let k = 0; k < N; k++) {
            const F = S.F(p), d = solve2(B, F); if (!d) break;
            const sx = [-d[0], -d[1]], q = [p[0] + sx[0], p[1] + sx[1]]; if (!isFinite(q[0]) || Math.abs(q[0]) > 1e6) break;
            const Fq = S.F(q), y = [Fq[0] - F[0], Fq[1] - F[1]], Bs_ = [B[0][0] * sx[0] + B[0][1] * sx[1], B[1][0] * sx[0] + B[1][1] * sx[1]], ss = sx[0] ** 2 + sx[1] ** 2;
            if (ss === 0) break;
            B = B.map((row, i) => row.map((val, j) => val + ((y[i] - Bs_[i]) * sx[j]) / ss));
            p = q; pts.push(p); Bs.push(B);
          }
          return { pts, Bs };
        }
        v.render(() => {
          s.clip(() => { s.contour((x, y) => S.F([x, y])[0], [0], { color: 'faint', width: 1.4, res: 100 }); s.contour((x, y) => S.F([x, y])[1], [0], { color: 'faint', width: 1.4, res: 100 }); });
          const pn = newtonSys(S, [h.x, h.y], n.value), { pts: pb, Bs } = broyden([h.x, h.y], n.value, ident.value);
          s.path(pn, { color: 'accent', width: 1.4 }); pn.forEach((p) => s.dot(p[0], p[1], { color: 'accent', r: 3 }));
          s.path(pb, { color: 'gold', width: 1.8 }); pb.forEach((p, k) => s.dot(p[0], p[1], { color: 'gold', r: k ? 3.5 : 5 }));
          S.roots.forEach((q) => s.dot(q[0], q[1], { color: 'green', hollow: true, r: 6 }));
          const En = pn.map((p) => nearestRoot(S, p)), Eb = pb.map((p) => nearestRoot(S, p));
          const P = (A) => A.map((q, k) => [k, Math.max(lg(q), -16.3)]);
          e.path(P(En), { color: 'accent', alpha: 0.7 }); e.dots(P(En), { color: 'accent', r: 3 }); e.path(P(Eb), { color: 'gold', alpha: 0.8 }); e.dots(P(Eb), { color: 'gold', r: 3.5 });
          const k = pb.length - 1, Jt = S.J(pb[k]), Bk = Bs[k];
          const dB = Math.hypot(Bk[0][0] - Jt[0][0], Bk[0][1] - Jt[0][1], Bk[1][0] - Jt[1][0], Bk[1][1] - Jt[1][1]);
          const rat = []; for (let i = 1; i < Eb.length; i++) if (Eb[i - 1] > 1e-12) rat.push(Eb[i] / Eb[i - 1]);
          info = { dB, rat, k, Eb, En };
        });
        v.readout(() => `after ${info.k} Broyden steps: distance to root $${tsci(info.Eb[info.k], 2)}$ (Newton after the same count: $${tsci(info.En[info.En.length - 1], 2)}$)\nratios $e_{k+1}/e_k$: ${info.rat.slice(0, 9).map((q) => v.fix(q, 3)).join(', ')} — decreasing toward 0: superlinear\n$\\|B_k-J(x_k)\\|_F=${tsci(info.dB, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Method',
      name: 'Damped Newton and line search',
      statement: String.raw`Far from a root the full Newton step $s_k=-J(x_k)^{-1}F(x_k)$ may increase $\|F\|$ or fly off. **Damped Newton** takes $x_{k+1}=x_k+\alpha_ks_k$ with $\alpha_k=2^{-j}$, the first $j=0,1,2,\dots$ for which the merit function $\varphi=\tfrac12\|F\|^2$ decreases sufficiently: $\varphi(x_k+\alpha s_k)\le(1-2c\alpha)\varphi(x_k)$ with a small $c$ (here $10^{-4}$). Since $s_k$ is a descent direction for $\varphi$, such an $\alpha$ always exists unless $F(x_k)=0$ or $J$ is singular, and near a root $\alpha=1$ is accepted, so quadratic convergence is kept.`,
      idea: String.raw`The Newton step is the minimiser of the linear model of $F$, and $\nabla\varphi=J^{\mathsf T}F$ gives $\nabla\varphi^{\mathsf T}s=-\|F\|^2<0$, so $s$ points downhill in $\varphi$: a short enough step must reduce $\varphi$ (this is the derivative at $\alpha=0$). Halving until the Armijo test passes is the cheapest way to find one. Once $x_k$ is inside the region of 2.5/2.14 the full step already passes the test, so damping costs nothing there. What damping cannot cure is a singular Jacobian: the iterates can stall in a local minimum of $\varphi$.`,
      caption: String.raw`The colours are $\log_{10}\|F\|$. Red path: full Newton steps from the handle; green path: damped steps. Use the slider to inspect the trial steps taken at iteration $j$ of the damped method: dots along the Newton direction at $\alpha=1,\frac12,\frac14,\dots$ — red rings are rejected, the gold dot is accepted. Drag the start to find places where full Newton wanders for many steps.`,
      deps: ['num-2.13'],
      refs: ['Süli–Mayers ch. 4'],
      scope: String.raw`Globalisation by backtracking on $\tfrac12\|F\|^2$ can stall at a point with $J^{\mathsf T}F=0$ and $F\ne0$ (a local minimum of the merit function that is not a root).`,
      tags: ['Newton', 'line search', 'globalisation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backtracking_line_search' },
      viz(v) {
        let S = SYS.sine;
        const sel = v.select('system', SYSOPTS, 'sine', { onChange: (k) => { S = SYS[k]; s.setView(S.view[0], S.view[1]); h.set(...START[k]); } });
        const START = { hyp: [-0.35, 0.25], sine: [-0.7, 0.5] };
        const j = v.slider('inspect step $j$', 0, 8, 0, { int: true });
        const s = v.stage({ x: S.view[0], y: S.view[1], equal: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', height: 430, title: 'full versus damped Newton' });
        const e = v.stage({ x: [0, 25], y: [-16, 3], axes: 'box', gutter: true, xlabel: 'iteration', ylabel: 'log₁₀‖F‖', height: 430, title: 'residual' });
        const h = s.handle(START.sine[0], START.sine[1], { color: 'ink', label: 'x₀' });
        v.legend([['red', 'full Newton'], ['green', 'damped Newton'], ['red', 'rejected trial', { dot: true }], ['gold', 'accepted trial', { dot: true }]]);
        let info = {};
        v.render(() => {
          s.heat((x, y) => { const F = S.F([x, y]); return lg(Math.hypot(F[0], F[1])); }, { range: [-1.5, 1.8], cmap: 'theme', res: 4, key: 'res|' + S.key + '|' + s.width });
          s.clip(() => { s.contour((x, y) => S.F([x, y])[0], [0], { color: 'ink', width: 1, alpha: 0.5, res: 100 }); s.contour((x, y) => S.F([x, y])[1], [0], { color: 'ink', width: 1, alpha: 0.5, res: 100 }); });
          const p0 = [h.x, h.y], full = newtonSys(S, p0, 25), damp = newtonSys(S, p0, 25, true);
          s.clip(() => { s.path(full.slice(0, 14), { color: 'red', width: 1.3, alpha: 0.9 }); s.path(damp, { color: 'green', width: 2 }); });
          full.slice(0, 14).forEach((p) => s.dot(p[0], p[1], { color: 'red', r: 2.5 })); damp.forEach((p) => s.dot(p[0], p[1], { color: 'green', r: 3 }));
          const q = damp[Math.min(j.value, damp.length - 1)], F = S.F(q), d = solve2(S.J(q), F);
          const trials = [];
          if (d) { const f0 = F[0] ** 2 + F[1] ** 2; let a = 1, acc = false; for (let t = 0; t < 12 && !acc; t++, a /= 2) { const r = [q[0] - a * d[0], q[1] - a * d[1]], Fr = S.F(r), f1 = Fr[0] ** 2 + Fr[1] ** 2; acc = f1 <= (1 - 2e-4 * a) * f0; trials.push({ a, r, acc, f1: Math.sqrt(f1) }); }
            s.clip(() => s.segment(q, [q[0] - d[0], q[1] - d[1]], { color: 'ink', dash: true, alpha: 0.7 }));
            trials.forEach((tr) => s.dot(tr.r[0], tr.r[1], { r: tr.acc ? 6 : 4, color: tr.acc ? 'gold' : 'red', hollow: !tr.acc }));
          }
          s.dot(q[0], q[1], { color: 'ink', r: 5, hollow: true });
          S.roots.forEach((r) => s.dot(r[0], r[1], { color: 'green', hollow: true, r: 6 }));
          const R = (A) => A.map((p, k) => [k, Math.max(Math.min(lg(nrm(S.F(p))), 2.8), -16.3)]);
          e.path(R(full), { color: 'red', alpha: 0.8 }); e.dots(R(full), { color: 'red', r: 3 }); e.path(R(damp), { color: 'green' }); e.dots(R(damp), { color: 'green', r: 3.5 });
          info = { trials, q, full, damp, d };
        });
        v.readout(() => `damped: ${info.damp.length - 1} steps, final $\\|F\\|=${tsci(nrm(S.F(info.damp[info.damp.length - 1])), 2)}$; full Newton after 25 steps: $\\|F\\|=${tsci(nrm(S.F(info.full[info.full.length - 1])), 2)}$ (${info.full.length - 1} steps taken)\nat step ${j.value}: ` + (info.trials.length ? info.trials.map((t) => `$\\alpha=${t.a >= 1 ? 1 : '2^{-' + Math.round(-Math.log2(t.a)) + '}'}$: $\\|F\\|=${v.fix(t.f1, 3)}$${t.acc ? ' **accepted**' : ''}`).join('; ') : 'Jacobian singular here'));
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Method',
      name: 'Homotopy continuation',
      statement: String.raw`To solve a hard system $F(x)=0$, connect it to an easy system $G(x)=0$ with known roots by a **homotopy** $H(x,t)=(1-t)G(x)+tF(x)$, and follow each solution curve of $H(x,t)=0$ from $t=0$ to $t=1$ by a predictor–corrector method: predict with the tangent $dx/dt=-H_x^{-1}H_t$, correct with Newton's method (2.13) in $x$ at fixed $t$. Where $H_x$ becomes singular the curve has a turning point in $t$; parametrising the curve by arclength instead of $t$ passes through it.`,
      idea: String.raw`By the implicit function theorem each solution of $H(x,t)=0$ with $H_x$ invertible continues as a smooth curve $x(t)$, whose derivative is exactly the tangent used as predictor; Newton then only has to fix a small error, so the iteration is robust where Newton from a distant start is not. The curve $\{H=0\}$ in the $(x,t)$ plane is a one-dimensional manifold, and a fold is only a fold of its *projection* onto the $t$-axis: following it as a curve in $(x,t)$ (pseudo-arclength) goes straight through. This is a numerical use of the ODE $dx/dt=-H_x^{-1}H_t$ (ode-2.8).`,
      caption: String.raw`Here $G(x)=x^3-x$ (roots $-1,0,1$), $F(x)=x^3-3x+c$, $H=x^3-(1+2t)x+tc$. The grey curve is the true solution set $H=0$; the coloured paths are tracked from the three starts. Slide $c$ above $2$: $F$ has only one real root, so two of the tracked paths meet at a fold. With **natural** parameter $t$ the path stops at the fold (red dot); with **arclength** it turns back and returns to $t=0$ — the real path cannot reach $t=1$ there; in the complex plane it continues.`,
      deps: ['num-2.13', 'ode-2.8'],
      refs: ['Süli–Mayers ch. 4'],
      scope: String.raw`Real paths only; to find all roots of a polynomial system, practical solvers follow complex paths with a random complex constant $\gamma$ in $H=(1-t)\gamma G+tF$, which avoids folds with probability one.`,
      tags: ['homotopy', 'continuation', 'predictor-corrector'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Numerical_continuation' },
      viz(v) {
        const c = v.slider('constant $c$', -3, 3, 2.4, { step: 0.01 });
        const arc = v.toggle('pseudo-arclength', true);
        const s = v.stage({ x: [0, 1], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'x', height: 420, title: 'solution curves of $H(x,t)=0$', full: true });
        v.legend([['muted', 'all real solutions'], ['accent', 'path from $-1$'], ['orange', 'path from $0$'], ['teal', 'path from $1$'], ['red', 'fold', { dot: true }]]);
        let report = [];
        v.render(() => {
          const C = c.value, H = (t, x) => x ** 3 - (1 + 2 * t) * x + t * C, Hx = (t, x) => 3 * x * x - (1 + 2 * t), Ht = (t, x) => -2 * x + C;
          s.contour((t, x) => H(t, x), [0], { color: 'muted', width: 6, alpha: 0.25, res: 160 });
          const cols = ['accent', 'orange', 'teal']; report = [];
          [-1, 0, 1].forEach((x0, idx) => {
            let t = 0, x = x0, dir = 1; const pts = [[t, x]], folds = []; let status = '';
            if (!arc.value) {
              const dt = 0.005;
              while (t < 1 - 1e-12) {
                const hx = Hx(t, x); if (Math.abs(hx) < 0.05) { status = `stops at the fold, $t\\approx${v.fix(t, 3)}$`; folds.push([t, x]); break; }
                const tn = Math.min(1, t + dt); let xn = x - (Ht(t, x) / hx) * (tn - t);
                for (let i = 0; i < 6; i++) xn -= H(tn, xn) / Hx(tn, xn);
                if (!isFinite(xn) || Math.abs(xn - x) > 0.3) { status = `loses the path near $t\\approx${v.fix(t, 3)}$`; folds.push([t, x]); break; }
                t = tn; x = xn; pts.push([t, x]);
              }
              if (!status) status = `reaches $t=1$ at $x=${v.fix(x, 4)}$`;
            } else {
              let tau = [Hx(t, x), -Ht(t, x)]; { const nn = Math.hypot(tau[0], tau[1]); tau = [tau[0] / nn, tau[1] / nn]; if (tau[0] < 0) tau = [-tau[0], -tau[1]]; }
              const ds = 0.01; let prevHx = Hx(t, x);
              for (let it = 0; it < 4000; it++) {
                let zt = t + ds * tau[0], zx = x + ds * tau[1];
                for (let i = 0; i < 8; i++) { const hh = H(zt, zx), a = Ht(zt, zx), b = Hx(zt, zx), det = a * tau[1] - b * tau[0]; if (!det) break; const rhs2 = -(tau[0] * (zt - (t + ds * tau[0])) + tau[1] * (zx - (x + ds * tau[1]))); const dt_ = (-hh * tau[1] - b * rhs2) / det, dx_ = (a * rhs2 + hh * tau[0]) / det; zt += dt_; zx += dx_; if (Math.abs(dt_) + Math.abs(dx_) < 1e-13) break; }
                let nt = [Hx(zt, zx), -Ht(zt, zx)]; { const nn = Math.hypot(nt[0], nt[1]); nt = [nt[0] / nn, nt[1] / nn]; if (nt[0] * tau[0] + nt[1] * tau[1] < 0) nt = [-nt[0], -nt[1]]; }
                const hx = Hx(zt, zx); if (prevHx * hx < 0) folds.push([zt, zx]); prevHx = hx;
                if (zt >= 1) { const f = (1 - t) / (zt - t); pts.push([1, x + f * (zx - x)]); t = 1; x = pts[pts.length - 1][1]; break; }
                if (zt < 0 || Math.abs(zx) > 4) { pts.push([Math.max(zt, 0), zx]); t = Math.max(zt, 0); x = zx; break; }
                t = zt; x = zx; tau = nt; pts.push([t, x]);
              }
              status = t >= 1 - 1e-9 ? `reaches $t=1$ at $x=${v.fix(x, 4)}$` : `**turns back** and returns to $t=0$ at $x=${v.fix(x, 3)}$ (another start)`;
            }
            s.path(pts, { color: cols[idx], width: [2.4, 5, 1.8][idx] }); s.dots(pts.filter((_, i) => i % 20 === 0), { color: cols[idx], r: 2 });
            folds.forEach(([ft, fx]) => s.dot(ft, fx, { color: 'red', r: 6 }));
            s.dot(0, x0, { color: cols[idx], r: 5 });
            report.push(status);
          });
        });
        v.readout(() => `$F(x)=x^3-3x+c$ has ${Math.abs(c.value) < 2 ? 'three' : 'one'} real root(s) ($|c|${Math.abs(c.value) < 2 ? '<' : '>'}2$)\n` + ['$-1$', '$0$', '$+1$'].map((nm, i) => `path from ${nm}: ${report[i]}`).join('; '));
      },
    },
    // ------------------------------------------------------------------ 2.18
    {
      num: '2.18',
      kind: 'Algorithm',
      name: 'Polynomial roots as eigenvalues (companion matrices)',
      statement: String.raw`The roots of the monic polynomial $p(x)=x^n+a_{n-1}x^{n-1}+\dots+a_0$ are exactly the eigenvalues of its **companion matrix** (ones on the subdiagonal, last column $-a_0,\dots,-a_{n-1}$), because $\det(xI-C)=p(x)$. Numerical libraries therefore find polynomial roots by running the QR eigenvalue algorithm on $C$. The roots can be extremely sensitive to the coefficients: a relative perturbation $\varepsilon$ of one coefficient may move a root by far more than $\varepsilon$, however stable the eigenvalue algorithm is.`,
      idea: String.raw`Expanding $\det(xI-C)$ along the last column gives $p$, so the characteristic polynomial of $C$ is $p$ (nla-5.8 and nla-6.9: eigenvalues by Hessenberg reduction and shifted QR, and $C$ is already Hessenberg). Backward stability of QR means the computed eigenvalues are exact for a slightly perturbed matrix, and Trefethen's Chebyshev *colleague* matrix does the same in a well-conditioned basis for polynomials on $[-1,1]$. The sensitivity is not the algorithm's fault: in Wilkinson's example the root condition number $\sum|a_j||x|^j/(|x|\,|p'(x)|)$ is enormous, so the problem itself is ill-conditioned.`,
      caption: String.raw`Choose Wilkinson's polynomial $\prod_{j=1}^n(x-j)$ (true roots in green), a random polynomial, or type your own coefficients (highest degree first). Blue dots are the eigenvalues of the companion matrix; gold dots are the same roots after Newton polishing on the computed coefficients. Increase the perturbation of the $x^{n-1}$ coefficient: for $n=20$ a relative change of about $10^{-9}$ already sends roots into the complex plane. Even $\varepsilon=0$ shows an effect, because the exact integer coefficients are rounded to doubles.`,
      deps: ['nla-6.9', 'nla-5.8'],
      refs: ['Trefethen ATAP ch. 18'],
      credit: 'Wilkinson, 1959 (the "perfidious polynomial")',
      scope: String.raw`Computed in double precision with this library's Hessenberg–QR routine; the exact coefficients of Wilkinson's polynomial are formed in exact integer arithmetic and then rounded.`,
      tags: ['polynomial roots', 'companion matrix', 'conditioning'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Companion_matrix' },
      viz(v) {
        const preset = v.select('polynomial', [{ value: 'wilk', label: 'Wilkinson' }, { value: 'rand', label: 'random' }, { value: 'custom', label: 'custom' }], 'wilk', {});
        const n = v.slider('degree $n$', 3, 20, 20, { int: true });
        const lgE = v.slider('perturbation $\\log_{10}\\varepsilon$', -17, -3, -9, { step: 0.1 });
        const seed = v.slider('random seed', 1, 30, 3, { int: true });
        const inp = v.input('coefficients', '1, 0, -3, 1', { width: 220, placeholder: 'highest degree first' });
        const s = v.stage({ x: [0, 22], y: [-6, 6], equal: true, axes: 'box', gutter: true, xlabel: 'Re', ylabel: 'Im', height: 400, title: 'roots in the complex plane', full: true });
        v.legend([['accent', 'eigenvalues of $C$'], ['gold', 'after Newton polishing'], ['green', 'true roots', { dot: true }]]);
        let info = {};
        const evalP = (co, z) => { let re = co[0], im = 0; for (let i = 1; i < co.length; i++) { const t = re * z[0] - im * z[1] + co[i]; im = re * z[1] + im * z[0]; re = t; } return [re, im]; };
        const evalDP = (co, z) => { let pr = co[0], pi = 0, dr = 0, di = 0; for (let i = 1; i < co.length; i++) { const ndr = dr * z[0] - di * z[1] + pr, ndi = dr * z[1] + di * z[0] + pi, t = pr * z[0] - pi * z[1] + co[i]; pi = pr * z[1] + pi * z[0]; pr = t; dr = ndr; di = ndi; } return [[pr, pi], [dr, di]]; };
        v.render(() => {
          const mode = preset.value; seed.el.hidden = mode !== 'rand'; inp.el.hidden = mode !== 'custom'; n.el.hidden = mode === 'custom';
          let co, truth = null, N;
          if (mode === 'wilk') {
            N = n.value; let c = [1n]; for (let j = 1; j <= N; j++) { const d = BigInt(j), nc = new Array(c.length + 1).fill(0n); for (let i = 0; i < c.length; i++) { nc[i] += c[i]; nc[i + 1] -= d * c[i]; } c = nc; }
            co = c.map(Number); truth = Array.from({ length: N }, (_, i) => [i + 1, 0]);
            co[1] *= 1 + Math.pow(10, lgE.value);
          } else if (mode === 'rand') { N = n.value; const r = v.rng(seed.value); co = [1, ...Array.from({ length: N }, () => r.normal())]; }
          else { co = (inp.value || '').split(/[,\s]+/).filter(Boolean).map(Number); if (co.length < 2 || co.some((q) => !isFinite(q)) || co[0] === 0) co = [1, 0, -3, 1]; const a0 = co[0]; co = co.map((q) => q / a0); N = co.length - 1; }
          const C = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (j === N - 1 ? -co[N - i] : i === j + 1 ? 1 : 0)));
          const ev = v.M.eig(C).values.map((z) => [z.re, z.im]);
          const pol = ev.map((z0) => { let z = z0.slice(); for (let it = 0; it < 6; it++) { const [[pr, pi], [dr, di]] = evalDP(co, z), den = dr * dr + di * di; if (!den) break; const nz = [z[0] - (pr * dr + pi * di) / den, z[1] - (pi * dr - pr * di) / den]; if (!isFinite(nz[0])) break; z = nz; } return z; });
          const all = [...ev, ...(truth || [])]; const xmin = Math.min(...all.map((z) => z[0])), xmax = Math.max(...all.map((z) => z[0])), ym = Math.max(1, ...all.map((z) => Math.abs(z[1])));
          const pad = 0.1 * Math.max(xmax - xmin, 2 * ym, 2); s.setView([xmin - pad, xmax + pad], [-ym - pad, ym + pad]);
          if (truth) s.dots(truth, { color: 'green', r: 7, hollow: true });
          s.dots(ev, { color: 'accent', r: 4.5 }); s.dots(pol, { color: 'gold', r: 2.5 });
          let maxErr = null, maxIm = 0; for (const z of ev) maxIm = Math.max(maxIm, Math.abs(z[1]));
          if (truth) { maxErr = 0; for (const z of ev) { let b = Infinity; for (const t of truth) b = Math.min(b, Math.hypot(z[0] - t[0], z[1] - t[1])); maxErr = Math.max(maxErr, b); } }
          const res = (A) => Math.max(...A.map((z) => nrm(evalP(co, z)) / (A.reduce((m, q) => Math.max(m, Math.hypot(q[0], q[1])), 1) ** N)));
          info = { N, maxErr, maxIm, resE: res(ev), resP: res(pol) };
        });
        v.readout(() => `degree ${info.N}: ` + (info.maxErr !== null ? `worst distance from a computed root to the true root: $${tsci(info.maxErr, 2)}$; ` : '') + `largest $|\\mathrm{Im}|$ among the computed roots: $${tsci(info.maxIm, 2)}$\nscaled residual $|p(z)|/\\max(1,|z|)^n$: eigenvalues $${tsci(info.resE, 2)}$, after polishing $${tsci(info.resP, 2)}$ — the residual is tiny even when the roots are far off: the problem, not the algorithm, is ill-conditioned`);
      },
    },
  ],
};
