// Rudin, Principles of Mathematical Analysis — Chapter 5: Differentiation
// Part 1: 5.1–5.9 (derivative, algebra, chain rule, local extrema, Cauchy's mean value theorem).
// Part 2 (ch05-a2.js): 5.10–5.19.

/** Roots of F in (a,b): sign changes on an n-cell grid, refined by bisection. */
function roots(F, a, b, n = 400) {
  const out = [];
  let x0 = a, f0 = F(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + (b - a) * i / n, f1 = F(x1);
    if (isFinite(f0) && isFinite(f1) && f0 * f1 < 0) {
      let lo = x0, hi = x1, flo = f0;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = F(m); if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m; }
      out.push((lo + hi) / 2);
    } else if (f1 === 0 && i < n) out.push(x1);
    x0 = x1; f0 = f1;
  }
  return out;
}

/** Draw y = f(x) on [A,B] as separate pieces split at the points in `cuts` (for honest jumps). */
function pieces(S, f, A, B, cuts, st) {
  const pts = [A, ...cuts.filter((c) => c > A && c < B), B];
  for (let i = 0; i + 1 < pts.length; i++) S.fn(f, { ...st, domain: [pts[i] + (i ? 1e-9 : 0), pts[i + 1] - (i + 2 < pts.length ? 1e-9 : 0)] });
}

/** Robust y-range of a list of numbers (quantiles), padded. */
function yRange(vals, q = 0.02, pad = 0.12, minSpan = 0.5) {
  const s = vals.filter(isFinite).sort((p, r) => p - r);
  if (!s.length) return [-1, 1];
  let lo = s[Math.floor(q * (s.length - 1))], hi = s[Math.ceil((1 - q) * (s.length - 1))];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

export default {
  book: 'pma',
  chapter: 5,
  title: 'Differentiation',
  summary: String.raw`Derivatives of real functions of one real variable: the derivative as a limit of difference quotients, its algebra and the chain rule. The heart of the chapter is the mean value theorem, reached through the observation that an interior extremum has zero derivative and through Cauchy's two-function version; it then drives the monotonicity test, Darboux's intermediate value property of derivatives, L'Hospital's rule and Taylor's theorem with remainder. A final section on vector-valued functions shows that the mean value *equality* breaks down in $\R^k$ while an inequality survives.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Definition',
      name: 'The derivative',
      statement: String.raw`Let $f$ be a real function on $[a,b]$. For each $x\in[a,b]$ form the difference quotient
$$\varphi(t)=\frac{f(t)-f(x)}{t-x}\qquad(a<t<b,\ t\neq x),$$
and set $f'(x)=\lim_{t\to x}\varphi(t)$ whenever this limit exists in the sense of Definition 4.1. The function $f'$, defined at exactly those points where the limit exists, is the *derivative* of $f$; at such points $f$ is *differentiable*, and $f$ is differentiable on $E\subset[a,b]$ if $f'(x)$ exists for every $x\in E$. Taking only $t>x$ or only $t<x$ gives the right- and left-hand derivatives; at the endpoints $a$ and $b$ the derivative is automatically one-sided.`,
      idea: String.raw`The secant slope $\varphi(t)$ is defined on a punctured neighbourhood of $x$, so its limit at $x$ makes sense even though $\varphi(x)$ itself is $0/0$. Geometrically $f'(x)$ is the slope that the secants through $(x,f(x))$ settle on — the slope of the tangent line.`,
      caption: String.raw`Drag $x$ and $t$ along the graph. The gold secant has slope $\varphi(t)$; the lower panel plots $\varphi$ as a function of $t$, with a hole at $t=x$. The derivative is the value that fills the hole (green). For $|x|$ at $0$ the two sides of the hole disagree, and for the cube root $x^{1/3}$ at $0$ the quotient escapes to $+\infty$: no derivative in either case.`,
      deps: ['pma-4.1'],
      see: ['pma-9.11', 'rca-10.2'],
      tags: ['derivative', 'limits'],
      viz(v) {
        const M = v.M, A = -1.8, B = 1.8;
        const FN = {
          cub: { label: '$x^3-2x$', f: (x) => x ** 3 - 2 * x, d: (x) => 3 * x * x - 2, y: [-2.7, 2.7], snap: [], x0: 0.55, t0: 1.45 },
          abs: { label: '$|x|$', f: (x) => Math.abs(x), d: (x) => (x ? Math.sign(x) : NaN), y: [-0.55, 1.95], snap: [0], x0: 0, t0: 0.9 },
          cbrt: { label: '$\\sqrt[3]{x}$', f: (x) => Math.cbrt(x), d: (x) => (x ? 1 / (3 * Math.cbrt(x * x)) : Infinity), y: [-1.45, 1.45], snap: [0], x0: 0, t0: 0.9 },
        };
        const which = v.select('$f(x)=$', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'cub');
        const F = () => FN[which.value];
        const top = v.stage({ x: [A - 0.12, B + 0.12], y: FN.cub.y, height: 290, full: true });
        const bot = v.stage({ x: [A - 0.12, B + 0.12], y: [-3, 8], height: 200, full: true, title: 'the difference quotient $\\varphi(t)=\\frac{f(t)-f(x)}{t-x}$ as a function of $t$' });
        const onCurve = (snap) => (X) => {
          X = M.clamp(X, A, B);
          if (snap) for (const s of F().snap) if (Math.abs(X - s) < 0.08) X = s;
          return [X, F().f(X)];
        };
        const hx = top.handle(0.55, 0, { color: 'accent', label: 'x', constrain: onCurve(true) });
        const ht = top.handle(1.45, 0, { color: 'gold', label: 't', constrain: onCurve(false) });
        hx.labelPos = 'nw'; ht.labelPos = 'nw';
        let last = null, st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (last !== which.value) { last = which.value; top.setView(null, G.y); hx.x = G.x0; ht.x = G.t0; }
          hx.y = f(hx.x); ht.y = f(ht.x);
          const x = hx.x, t = ht.x, fx = f(x), d = G.d(x);
          const phi = (s) => (s === x ? NaN : (f(s) - fx) / (s - x));
          // top: graph, tangent, secant
          if (isFinite(d)) top.line(x - 6, fx - 6 * d, x + 6, fx + 6 * d, { color: 'green', width: 1.8, dash: [7, 5] });
          else if (d === Infinity) top.vline(x, { color: 'green', width: 1.8, dash: [7, 5] });
          top.fn(f, { domain: [A, B], color: 'ink', width: 2.4 });
          const m = phi(t);
          if (isFinite(m)) top.line(x - 6, fx - 6 * m, x + 6, fx + 6 * m, { color: 'gold', width: 2 });
          top.line(t, fx, t, f(t), { color: 'gold', width: 1.2, dash: [3, 3] });
          top.line(x, fx, t, fx, { color: 'gold', width: 1.2, dash: [3, 3] });
          // bottom: φ(t)
          const ts = M.linspace(A, B, 241).filter((s) => Math.abs(s - x) > 1e-6);
          const [lo, hi] = yRange(ts.map(phi).concat(isFinite(d) ? [d] : []), 0.03);
          bot.setView(null, [Math.max(lo, -4), Math.min(hi, 6.5)]);
          bot.vline(x, { color: 'accent', width: 1, dash: [2, 4], alpha: 0.6 });
          if (isFinite(d)) bot.hline(d, { color: 'green', width: 1.4, dash: [7, 5] });
          bot.fn(phi, { domain: [A, x - 1e-7], color: 'accent', width: 2.4 });
          bot.fn(phi, { domain: [x + 1e-7, B], color: 'accent', width: 2.4 });
          if (isFinite(d)) bot.dot(x, d, { hollow: true, color: 'green', r: 5.5, width: 2.4, label: `f′(x) = ${v.fmt(d, 3)}`, labelPos: 'se', math: false });
          else if (d === Infinity) { bot.arrow(x, bot.bounds.y[1] - (bot.bounds.y[1] - bot.bounds.y[0]) * 0.3, x, bot.bounds.y[1] - 0.02, { color: 'red', width: 2 }); bot.corner('φ(t) → +∞ as t → x: no derivative', 'tl', { color: 'red', weight: 600 }); }
          else {
            const l = (f(x - 1e-7) - fx) / -1e-7, r = (f(x + 1e-7) - fx) / 1e-7;
            bot.dot(x, l, { hollow: true, color: 'red', r: 5, width: 2.2, label: 'limit from the left', labelPos: 'nw', math: false });
            bot.dot(x, r, { hollow: true, color: 'red', r: 5, width: 2.2, label: 'limit from the right', labelPos: 'se', math: false });
            bot.corner('left and right limits differ: no derivative', 'tl', { color: 'red', weight: 600 });
          }
          if (isFinite(m)) bot.dot(t, m, { color: 'gold', r: 5 });
          v.legend([['ink', '$y=f(x)$'], ['gold', 'secant through $x$ and $t$'], ['green', 'tangent (slope $f\'(x)$)', { dash: true }], ['accent', '$\\varphi(t)$']]);
          st = { x, t, m, d };
        });
        v.readout(() => {
          const { x, t, m, d } = st; if (x == null) return '';
          const tail = isFinite(d) ? `$\\;\\to\\; f'(x) = ${v.fmt(d, 4)}$ as $t\\to x$` : d === Infinity ? ' — unbounded as $t\\to x$' : ' — the one-sided limits are $-1$ and $+1$';
          return `$x = ${v.fix(x, 3)},\\; t - x = ${v.fix(t - x, 3)},\\; \\varphi(t) = ${isFinite(m) ? v.fmt(m, 4) : '\\text{undefined}'}$` + tail;
        });
      },
    },

    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Theorem',
      name: 'Differentiability implies continuity',
      statement: String.raw`Let $f$ be defined on $[a,b]$. If $f$ is differentiable at a point $x\in[a,b]$, then $f$ is continuous at $x$.`,
      idea: String.raw`For $t\ne x$ write $f(t)-f(x)=\varphi(t)\,(t-x)$. As $t\to x$ the first factor tends to the finite number $f'(x)$ and the second to $0$, so the product tends to $0$ by Theorem 4.4, i.e. $f(t)\to f(x)$, which is continuity at $x$ (4.6). Quantitatively, near $x$ the graph is trapped in a double cone $|f(t)-f(x)|\le(|f'(x)|+1)|t-x|$. The converse is false: $\sqrt{|x|}$ is continuous at $0$ but not differentiable there.`,
      caption: String.raw`Drag $x$ along the graph and shrink the zoom half-width $h$. At a point of differentiability the zoomed graph is caught in the green double cone $|f(t)-f(x)|\le(|f'(x)|+1)|t-x|$, so the oscillation $\omega(h)$ in the bottom panel goes to $0$ at least linearly. At a jump ($x$ snaps to $c$) the graph escapes and $\omega(h)$ never drops below the jump; the cusp $|x-c|^{1/2}$ is continuous yet escapes every cone — the converse fails.`,
      deps: ['pma-5.1', 'pma-4.4', 'pma-4.6'],
      tags: ['derivative', 'continuity'],
      viz(v) {
        const M = v.M, A = -1.5, B = 1.5, c = 0.4;
        const FN = {
          smooth: { label: 'differentiable', f: (x) => Math.sin(1.7 * x) + 0.25 * x * x - 0.2, cuts: [] },
          jump: { label: 'jump at $c$', f: (x) => 0.45 * x + (x >= c ? 0.7 : 0) - 0.35, cuts: [c] },
          cusp: { label: 'cusp $|x-c|^{1/2}$', f: (x) => 0.9 * Math.sqrt(Math.abs(x - c)) - 0.4, cuts: [] },
        };
        const which = v.select('', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'smooth');
        const hs = v.slider('zoom half-width $h$', 0.004, 0.8, 0.15, { log: true, fmt: (x) => v.fmt(x, 2) });
        const F = () => FN[which.value];
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.6], height: 290, title: 'graph of $f$ (box = zoom window)' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], height: 290, axes: false, title: 'zoom on $|t-x|\\le h$' });
        const W = v.stage({ x: [0, 0.82], y: [0, 1], height: 170, full: true, axes: 'box', title: 'oscillation $\\omega(h)=\\sup_{|t-x|\\le h}|f(t)-f(x)|$; continuity at $x$ means $\\omega(h)\\to0$' });
        const p = L.handle(-0.45, 0, { color: 'accent', label: 'x', constrain: (X) => { X = M.clamp(X, A, B); if (which.value !== 'smooth' && Math.abs(X - c) < 0.09) X = c; return [X, F().f(X)]; } });
        let last = null, st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (last !== which.value) { last = which.value; p.x = which.value === 'smooth' ? -0.45 : c; }
          p.y = f(p.x);
          const x = p.x, fx = f(x), h = hs.value;
          const special = which.value !== 'smooth' && x === c;
          const d = special ? NaN : M.deriv(f, x, 1e-6);
          const C = special ? 1.2 : Math.abs(d) + 1;
          const ft = (t) => f(M.clamp(t, A, B));
          // overview
          const yh = 1.45 * C * h;
          pieces(L, f, A, B, G.cuts, { color: 'ink', width: 2.2 });
          if (G.cuts.length) { L.dot(c, f(c - 1e-9), { hollow: true, color: 'ink', r: 4 }); L.dot(c, f(c), { color: 'ink', r: 4 }); }
          L.rect(x - 1.15 * h, fx - yh, x + 1.15 * h, fx + yh, { color: 'orange', width: 1.6, fill: 'orange', fillAlpha: 0.1 });
          if (G.cuts.length || which.value === 'cusp') L.text('c', c, L.bounds.y[0], { dy: -10, align: 'center', color: 'muted', math: true });
          // zoom
          R.setView([x - 1.15 * h, x + 1.15 * h], [fx - yh, fx + yh]);
          const w = 2 * h;
          R.poly([[x, fx], [x - w, fx + C * w], [x - w, fx - C * w]], { fill: 'green', fillAlpha: 0.12, stroke: false });
          R.poly([[x, fx], [x + w, fx + C * w], [x + w, fx - C * w]], { fill: 'green', fillAlpha: 0.12, stroke: false });
          for (const s of [1, -1]) R.line(x - w, fx - s * C * w, x + w, fx + s * C * w, { color: 'green', width: 1.3, dash: [6, 4] });
          R.hline(fx, { color: 'faint', width: 1 }); R.vline(x, { color: 'faint', width: 1 });
          pieces(R, f, x - 1.3 * h, x + 1.3 * h, G.cuts, { color: 'accent', width: 2.6 });
          if (special && G.cuts.length) R.dot(c, f(c - 1e-9), { hollow: true, color: 'accent', r: 4.5 });
          R.dot(x, fx, { color: 'accent', r: 5 });
          // is the graph inside the cone on |t-x| <= h ?
          let inside = true;
          for (const s of M.linspace(-h, h, 161)) { if (!s) continue; const t = x + s; if (t < A || t > B) continue; if (Math.abs(f(t) - fx) > C * Math.abs(s) + 1e-12) { inside = false; break; } }
          if (special && which.value === 'jump') {
            R.corner('jump: the gap never closes — not continuous', 'tl', { color: 'red', weight: 600 });
            const xa = x - 0.6 * h, yb = R.bounds.y[0], hgt = R.bounds.y[1] - yb;
            R.arrow(xa, yb + 0.32 * hgt, xa, yb + 0.04 * hgt, { color: 'red', width: 2 });
            R.text(`left branch ${v.fix(fx - f(c - 1e-9), 2)} lower`, xa, yb + 0.36 * hgt, { align: 'center', baseline: 'bottom', color: 'red', size: 11.5 });
          }
          else if (special) R.corner('continuous, but escapes every cone', 'tl', { color: 'orange', weight: 600 });
          else R.corner(inside ? 'graph trapped in the cone' : 'graph leaves the cone: shrink h', 'tl', { color: inside ? 'green' : 'muted', weight: 600 });
          // oscillation
          const omega = (r) => { let mx = 0; for (const s of M.linspace(-r, r, 81)) mx = Math.max(mx, Math.abs(ft(x + s) - fx)); return mx; };
          const hsx = M.linspace(0.002, 0.8, 140), om = hsx.map(omega);
          const top = Math.max(...om) * 1.12 || 1;
          W.setView(null, [0, top]);
          if (!special) W.fn((r) => C * r, { domain: [0, 0.82], color: 'green', width: 1.4, dash: [6, 4] });
          const jumpHere = special && which.value === 'jump';
          W.path([...(jumpHere ? [] : [[0, 0]]), ...hsx.map((r, i) => [r, om[i]])], { color: 'accent', width: 2.4 });
          if (jumpHere) { W.dot(0, 0, { color: 'accent', r: 4.5 }); W.dot(0, om[0], { color: 'accent', r: 4.5, hollow: true, width: 2 }); }
          const oh = omega(h);
          W.vline(h, { color: 'orange', width: 1.2, dash: [3, 3] });
          W.dot(h, oh, { color: 'orange', r: 5 });
          if (!special) { const xl = Math.min(0.78, top * 0.8 / C); W.text(`C·h,  C = |f′(x)| + 1`, xl, C * xl, { align: 'right', baseline: 'bottom', color: 'green', dx: -4, dy: -6, size: 11.5 }); }
          v.legend([['ink', '$y=f(x)$'], ['green', 'cone $|f(t)-f(x)|\\le C|t-x|$', { area: true }], ['orange', 'zoom window / current $h$', { area: true }], ['accent', '$\\omega(h)$']]);
          st = { x, h, oh, C, special, d };
        });
        v.readout(() => {
          const s = st; if (s.x == null) return '';
          const base = `$x = ${v.fix(s.x, 3)},\\; h = ${v.fmt(s.h, 3)},\\; \\omega(h) = ${v.fmt(s.oh, 3)}$`;
          if (s.special && which.value === 'jump') return base + ' — stays near the jump size $0.7$ however small $h$ is.';
          if (s.special) return base + ' $\\approx 0.9\\sqrt{h}$: tends to $0$, but slower than any $C\\,h$.';
          return base + ` $\\le C h = ${v.fmt(s.C * s.h, 3)}$ for small $h$, with $f'(x) = ${v.fmt(s.d, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Theorem',
      name: 'Sum, product and quotient rules',
      statement: String.raw`Let $f$ and $g$ be defined on $[a,b]$ and differentiable at a point $x\in[a,b]$. Then $f+g$ and $fg$ are differentiable at $x$, and so is $f/g$ provided $g(x)\neq0$; moreover
(a) $(f+g)'(x)=f'(x)+g'(x)$;
(b) $(fg)'(x)=f'(x)\,g(x)+f(x)\,g'(x)$;
(c) $\left(\dfrac fg\right)'(x)=\dfrac{g(x)\,f'(x)-g'(x)\,f(x)}{g(x)^2}$.`,
      idea: String.raw`(a) follows from the sum rule for limits (4.4). For (b) split the increment of the product as $f(t)g(t)-f(x)g(x)=f(t)\,[g(t)-g(x)]+g(x)\,[f(t)-f(x)]$, divide by $t-x$, and use $f(t)\to f(x)$, which is Theorem 5.2. For (c) put the increment of $f/g$ over the common denominator $g(t)g(x)$; by 5.2 again it tends to $g(x)^2\neq0$.`,
      caption: String.raw`Choose a rule, drag $x$ and shrink $\Delta t=t-x$. The right panel turns each operation into geometry: for $f+g$ two stacked lengths, for $fg$ the area of an $f\times g$ rectangle — it grows by the strips $g\,\Delta f$ and $f\,\Delta g$ plus a corner $\Delta f\,\Delta g$ that is of second order and drops out of the quotient — and for $f/g$ the width of a rectangle of area $f$ and height $g$. The readout compares the difference quotient with the formula.`,
      deps: ['pma-5.1', 'pma-5.2', 'pma-4.4'],
      tags: ['derivative', 'algebra'],
      viz(v) {
        const M = v.M;
        const f = (x) => 0.35 + 0.42 * x + 0.1 * Math.sin(2 * x), df = (x) => 0.42 + 0.2 * Math.cos(2 * x);
        const g = (x) => 0.3 + 0.3 * x + 0.08 * Math.cos(1.7 * x), dg = (x) => 0.3 - 0.136 * Math.sin(1.7 * x);
        const RULES = {
          sum: { label: '(a) $f+g$', h: (x) => f(x) + g(x), y: [-0.22, 2.95] },
          prod: { label: '(b) $fg$', h: (x) => f(x) * g(x), y: [-0.18, 2.05] },
          quot: { label: '(c) $f/g$', h: (x) => f(x) / g(x), y: [-0.18, 1.75] },
        };
        const rule = v.select('', Object.entries(RULES).map(([value, R]) => ({ value, label: R.label })), 'prod');
        const dt = v.slider('$\\Delta t = t-x$', 0.004, 0.9, 0.5, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-0.08, 3.08], y: [-0.18, 1.9], height: 320, title: 'graphs of $f$, $g$ and the combination' });
        const R = v.stage({ x: [-0.3, 2.3], y: [-0.25, 1.85], equal: true, height: 320, axes: false, title: 'the increment from $x$ to $t$, geometrically' });
        const hx = L.handle(0.9, 0, { color: 'ink', label: 'x', constrain: (X) => [M.clamp(X, 0.05, 2.15), 0] });
        let st = {};
        v.render(() => {
          const Rr = RULES[rule.value], x = hx.x, t = x + dt.value;
          L.setView(null, Rr.y);
          L.vband(x, t, { color: 'orange', alpha: 0.1 });
          L.vline(x, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 }); L.vline(t, { color: 'orange', width: 1, dash: [3, 4] });
          L.fn(f, { color: 'accent', width: 2.2 }); L.fn(g, { color: 'purple', width: 2.2 }); L.fn(Rr.h, { color: 'green', width: 2.8 });
          for (const [fn, col] of [[f, 'accent'], [g, 'purple'], [Rr.h, 'green']]) { L.dot(x, fn(x), { color: col, r: 4 }); L.dot(t, fn(t), { color: col, r: 3.5, hollow: true }); }
          L.text('t', t, L.bounds.y[0], { dy: -12, dx: 6, color: 'orange', math: true });
          const lg = [['accent', '$f$'], ['purple', '$g$'], ['green', Rr.label.replace(/^\(.\) /, '')]];
          if (rule.value === 'prod') lg.push(['accent', 'strip $g(x)\\,\\Delta f$', { area: true }], ['purple', 'strip $f(x)\\,\\Delta g$', { area: true }], ['red', 'corner $\\Delta f\\,\\Delta g$', { area: true }]);
          else lg.push(['orange', '$[x,t]$', { area: true }]);
          v.legend(lg);
          const fx = f(x), gx = g(x), ftt = f(t), gt = g(t), Df = ftt - fx, Dg = gt - gx;
          if (rule.value === 'prod') {
            { const X1 = Math.max(fx, ftt), Y1 = Math.max(gx, gt); R.setView([-0.3 * X1, 1.12 * X1], [-0.2 * Y1, 1.12 * Y1]); }
            R.rect(0, 0, fx, gx, { fill: 'gray', fillAlpha: 0.14, color: 'ink', width: 1.6 });
            R.rect(fx, 0, ftt, gx, { fill: 'accent', fillAlpha: 0.4, stroke: false });
            R.rect(0, gx, fx, gt, { fill: 'purple', fillAlpha: 0.36, stroke: false });
            R.rect(fx, gx, ftt, gt, { fill: 'red', fillAlpha: 0.6, stroke: false });
            R.rect(0, 0, ftt, gt, { color: 'ink', width: 1.2, dash: [5, 4] });
            R.tex('f(x)\\,g(x)', fx / 2, gx / 2, { color: 'ink', size: 16 });
            if (Math.abs(R.X(ftt) - R.X(fx)) > 46) R.tex('g\\,\\Delta f', (fx + ftt) / 2, gx / 2, { color: 'accent', size: 14 });
            if (Math.abs(R.Y(gt) - R.Y(gx)) > 20) R.tex('f\\,\\Delta g', fx / 2, (gx + gt) / 2, { color: 'purple', size: 14 });
            R.tex('f(x)', fx / 2, 0, { baseline: 'top', dy: 5, color: 'accent', size: 13 });
            R.tex('g(x)', 0, gx / 2, { align: 'right', dx: -6, color: 'purple', size: 13 });
            R.tex('\\Delta f', (fx + ftt) / 2, 0, { baseline: 'top', dy: 5, color: 'accent', size: 12 });
            R.tex('\\Delta g', 0, (gx + gt) / 2, { align: 'right', dx: -6, color: 'purple', size: 12 });
          } else if (rule.value === 'sum') {
            { const Y1 = Math.max(fx + gx, ftt + gt); R.setView([0.1, 2.5], [-0.14 * Y1, 1.08 * Y1]); }
            const bar = (X, a, b, col, alpha, dash) => R.rect(X - 0.28, a, X + 0.28, b, { fill: col, fillAlpha: alpha, color: col, width: 1.4, dash });
            bar(0.6, 0, fx, 'accent', 0.3); bar(0.6, fx, fx + gx, 'purple', 0.3);
            bar(1.6, 0, ftt, 'accent', 0.14, [4, 3]); bar(1.6, ftt, ftt + gt, 'purple', 0.14, [4, 3]);
            R.tex('f(x)', 0.6, fx / 2, { color: 'accent', size: 14 }); R.tex('g(x)', 0.6, fx + gx / 2, { color: 'purple', size: 14 });
            R.tex('f(t)', 1.6, ftt / 2, { color: 'accent', size: 14 }); R.tex('g(t)', 1.6, ftt + gt / 2, { color: 'purple', size: 14 });
            R.line(0.88, fx + gx, 1.32, fx + gx, { color: 'faint', width: 1, dash: [2, 3] });
            R.measure(2.05, fx + gx, 2.05, ftt + gt, null, { color: 'green' });
            R.tex('\\Delta f+\\Delta g', 2.12, (fx + gx + ftt + gt) / 2, { align: 'left', color: 'green', size: 13 });
            R.text('at x', 0.6, 0, { dy: 12, align: 'center', color: 'muted' }); R.text('at t', 1.6, 0, { dy: 12, align: 'center', color: 'muted' });
          } else {
            const qx = fx / gx, qt = ftt / gt;
            { const X1 = Math.max(qx, qt), Y1 = Math.max(gx, gt); R.setView([-0.3 * X1, 1.12 * X1], [-0.32 * Y1, 1.32 * Y1]); }
            R.rect(0, 0, qx, gx, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 1.6 });
            R.rect(0, 0, qt, gt, { color: 'ink', width: 1.3, dash: [5, 4] });
            R.tex('\\text{area } f(x)', qx / 2, gx / 2, { color: 'accent', size: 15 });
            const yb = -0.1 * Math.max(gx, gt);
            R.measure(0, yb, qx, yb, null, { color: 'green' });
            R.tex('f(x)/g(x)', qx / 2, yb, { baseline: 'top', dy: 4, color: 'green', size: 13 });
            R.tex('g(x)', 0, gx / 2, { align: 'right', dx: -6, color: 'purple', size: 13 });
            R.line(qx, gx, qx, R.bounds.y[1], { color: 'green', width: 1, dash: [2, 3] }); R.line(qt, gt, qt, R.bounds.y[1], { color: 'green', width: 1, dash: [2, 3] });
            const yq = 1.14 * Math.max(gx, gt);
            R.measure(qx, yq, qt, yq, null, { color: 'green' });
            if (Math.abs(R.X(qt) - R.X(qx)) > 70) R.tex('\\Delta(f/g)', (qx + qt) / 2, yq, { baseline: 'bottom', dy: -5, color: 'green', size: 13 });
            else R.tex('\\Delta(f/g)', Math.max(qx, qt), yq, { align: 'right', baseline: 'bottom', dx: -4, dy: -5, color: 'green', size: 13 });
          }
          st = { x, t, fx, gx, ftt, gt, Df, Dg };
        });
        v.readout(() => {
          const s = st; if (s.x == null) return '';
          const D = s.t - s.x, F = (z) => v.fmt(z, 4), x = s.x;
          if (rule.value === 'sum') return `$\\dfrac{\\Delta(f+g)}{\\Delta t} = \\dfrac{\\Delta f}{\\Delta t}+\\dfrac{\\Delta g}{\\Delta t} = ${F(s.Df / D)} + ${F(s.Dg / D)} = ${F((s.Df + s.Dg) / D)}\\;\\longrightarrow\\; f'(x)+g'(x) = ${F(df(x) + dg(x))}$`;
          if (rule.value === 'prod') return `$\\dfrac{\\Delta(fg)}{\\Delta t} = \\underbrace{g(x)\\dfrac{\\Delta f}{\\Delta t}}_{${F(s.gx * s.Df / D)}} + \\underbrace{f(x)\\dfrac{\\Delta g}{\\Delta t}}_{${F(s.fx * s.Dg / D)}} + \\underbrace{\\dfrac{\\Delta f\\,\\Delta g}{\\Delta t}}_{${F(s.Df * s.Dg / D)}} = ${F((s.ftt * s.gt - s.fx * s.gx) / D)}\\;\\longrightarrow\\; f'g+fg' = ${F(df(x) * s.gx + s.fx * dg(x))}$`;
          return `$\\dfrac{\\Delta(f/g)}{\\Delta t} = \\dfrac{g(x)\\,\\Delta f/\\Delta t-f(x)\\,\\Delta g/\\Delta t}{g(t)\\,g(x)} = ${F((s.ftt / s.gt - s.fx / s.gx) / D)}\\;\\longrightarrow\\; \\dfrac{gf'-fg'}{g^2} = ${F((s.gx * df(x) - dg(x) * s.fx) / s.gx ** 2)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Theorem',
      name: 'Chain rule',
      statement: String.raw`Let $f$ be continuous on $[a,b]$ and differentiable at a point $x\in[a,b]$; let $g$ be defined on an interval $I$ containing the range of $f$ and differentiable at the point $f(x)$. Then $h(t)=g(f(t))$ $(a\le t\le b)$ is differentiable at $x$, and
$$h'(x)=g'(f(x))\,f'(x).$$`,
      idea: String.raw`Dividing by $f(t)-f(x)$ is not allowed, since it may vanish for $t$ near $x$. Instead encode both derivatives with error terms: $f(t)-f(x)=(t-x)\,[f'(x)+u(t)]$ and $g(s)-g(y)=(s-y)\,[g'(y)+v(s)]$ with $y=f(x)$ and $u(t)\to0$, $v(s)\to0$. Substituting $s=f(t)$ gives $h(t)-h(x)=(t-x)\,[f'(x)+u(t)]\,[g'(y)+v(f(t))]$; continuity of $f$ makes $v(f(t))\to0$ (4.7), and the limit rules (4.4) finish.`,
      caption: String.raw`Drag $x$ along the graph of $h=g\circ f$ and shrink $\delta$. The mapping diagram carries $11$ points of $[x-\delta,x+\delta]$ (top line) through $f$ (middle line) and then $g$ (bottom line); every line is magnified about its own centre by the same factor. As $\delta\to0$ the stretch factors become $f'(x)$ and $g'(f(x))$ and the total stretch is their product; crossing lines mean a negative factor. Where $f'(x)=0$ or $g'(f(x))=0$ the image collapses to a point.`,
      deps: ['pma-5.1', 'pma-4.4', 'pma-4.7'],
      see: ['pma-9.15'],
      tags: ['derivative', 'chain rule'],
      viz(v) {
        const M = v.M;
        const PAIRS = {
          p1: { label: '$f(t)=1.2\\sin 1.3t,\\ g(y)=y^2-0.6y$', f: (t) => 1.2 * Math.sin(1.3 * t), df: (t) => 1.56 * Math.cos(1.3 * t), g: (y) => y * y - 0.6 * y, dg: (y) => 2 * y - 0.6, T: [-2, 2], y: [-0.4, 2.3] },
          p2: { label: '$f(t)=t^2-1,\\ g(y)=\\sin 1.5y$', f: (t) => t * t - 1, df: (t) => 2 * t, g: (y) => Math.sin(1.5 * y), dg: (y) => 1.5 * Math.cos(1.5 * y), T: [-1.8, 1.8], y: [-1.25, 1.25] },
        };
        const pair = v.select('', Object.entries(PAIRS).map(([value, P]) => ({ value, label: P.label })), 'p1');
        const del = v.slider('$\\delta$', 0.003, 0.6, 0.25, { log: true, fmt: (x) => v.fmt(x, 2) });
        const P = () => PAIRS[pair.value];
        const L = v.stage({ x: [-2.1, 2.1], y: [-0.4, 2.3], height: 340, title: 'graph of $h=g\\circ f$' });
        const R = v.stage({ x: [-1.75, 2.45], y: [-0.4, 2.4], height: 340, axes: false, title: 'mapping diagram (each line magnified)' });
        const hx = L.handle(0.5, 0, { color: 'accent', label: 'x', constrain: (X) => { const Q = P(); X = M.clamp(X, Q.T[0], Q.T[1]); return [X, Q.g(Q.f(X))]; } });
        let last = null, st = {};
        v.render(() => {
          const Q = P(), h = (t) => Q.g(Q.f(t));
          if (last !== pair.value) { last = pair.value; L.setView([Q.T[0] - 0.1, Q.T[1] + 0.1], Q.y); hx.x = 0.5; }
          hx.y = h(hx.x);
          const x = hx.x, d = del.value, y0 = Q.f(x), z0 = Q.g(y0);
          const f1 = Q.df(x), g1 = Q.dg(y0), h1 = f1 * g1;
          // left: graph and tangent
          L.line(x - 5, z0 - 5 * h1, x + 5, z0 + 5 * h1, { color: 'green', width: 1.6, dash: [7, 5] });
          L.vband(x - d, x + d, { color: 'orange', alpha: 0.14 });
          L.fn(h, { domain: Q.T, color: 'ink', width: 2.4 });
          // right: mapping diagram
          const scale = 1 / (1.15 * d * Math.max(1, Math.abs(f1), Math.abs(h1)));
          const lines = [[2, x, 't', 'accent'], [1, y0, 'y = f(t)', 'orange'], [0, z0, 'z = g(y)', 'green']];
          for (const [Y, c0, name, col] of lines) {
            R.line(-1.2, Y, 1.2, Y, { color: 'faint', width: 1.4 });
            for (let k = -4; k <= 4; k++) R.line(k * 0.3, Y - 0.035, k * 0.3, Y + 0.035, { color: 'faint', width: 1 });
            R.line(0, Y - 0.07, 0, Y + 0.07, { color: 'muted', width: 1.6 });
            R.text(name, -1.72, Y + 0.13, { color: col, math: true, size: 15 });
            R.text(`centre ${v.fix(c0, 2)}`, -1.72, Y - 0.13, { color: 'muted', size: 11 });
          }
          const N = 11, ss = M.linspace(x - d, x + d, N);
          const U = ss.map((s) => { const y = Q.f(s), z = Q.g(y); return [(s - x) * scale, (y - y0) * scale, (z - z0) * scale]; });
          for (let i = 0; i < N; i++) {
            const a = i / (N - 1), col = v.mix(v.color('gold'), v.color('purple'), a);
            R.line(U[i][0], 2, U[i][1], 1, { color: col, width: 1.3, alpha: 0.85 });
            R.line(U[i][1], 1, U[i][2], 0, { color: col, width: 1.3, alpha: 0.85 });
          }
          const seg = (Y, vals, col) => R.line(Math.min(...vals), Y, Math.max(...vals), Y, { color: col, width: 6, alpha: 0.5, cap: 'butt' });
          seg(2, U.map((u) => u[0]), 'accent'); seg(1, U.map((u) => u[1]), 'orange'); seg(0, U.map((u) => u[2]), 'green');
          for (let i = 0; i < N; i++) {
            const col = v.mix(v.color('gold'), v.color('purple'), i / (N - 1));
            R.dot(U[i][0], 2, { color: col, r: 3.2 }); R.dot(U[i][1], 1, { color: col, r: 3.2 }); R.dot(U[i][2], 0, { color: col, r: 3.2 });
          }
          R.arrow(1.42, 1.9, 1.42, 1.1, { color: 'orange', width: 1.4, head: 7 });
          R.arrow(1.42, 0.9, 1.42, 0.1, { color: 'green', width: 1.4, head: 7 });
          R.text('stretch', 1.52, 2.2, { color: 'muted', align: 'left', size: 11 });
          R.text(`× ${v.fmt(f1, 3)}`, 1.52, 1.62, { color: 'orange', align: 'left', size: 12.5, weight: 600 });
          R.text('f′(x)', 1.52, 1.38, { color: 'orange', align: 'left', size: 11 });
          R.text(`× ${v.fmt(g1, 3)}`, 1.52, 0.62, { color: 'green', align: 'left', size: 12.5, weight: 600 });
          R.text('g′(f(x))', 1.52, 0.38, { color: 'green', align: 'left', size: 11 });
          R.text(`total × ${v.fmt(h1, 3)}`, 1.52, -0.22, { color: 'ink', align: 'left', size: 12, weight: 600 });
          v.legend([['ink', '$y=h(t)$'], ['green', 'tangent, slope $g\'(f(x))\\,f\'(x)$', { dash: true }], ['orange', '$[x-\\delta,\\,x+\\delta]$', { area: true }], ['gold', 'sample points $t_i\\mapsto f(t_i)\\mapsto g(f(t_i))$']]);
          const sa = x - d, sb = x + d, Dy = Q.f(sb) - Q.f(sa), Dz = h(sb) - h(sa);
          st = { d, Dy, Dz, f1, g1, h1 };
        });
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          const q2 = Math.abs(s.Dy) > 1e-13 ? v.fmt(s.Dz / s.Dy, 4) : '\\text{undefined } (\\Delta y=0)';
          return `$\\dfrac{\\Delta y}{\\Delta t} = ${v.fmt(s.Dy / (2 * s.d), 4)}\\ (\\to f'(x) = ${v.fmt(s.f1, 4)}),\\quad \\dfrac{\\Delta z}{\\Delta y} = ${q2}\\ (\\to g'(f(x)) = ${v.fmt(s.g1, 4)}),\\quad \\dfrac{\\Delta z}{\\Delta t} = ${v.fmt(s.Dz / (2 * s.d), 4)}\\ (\\to h'(x) = ${v.fmt(s.h1, 4)})$`;
        });
      },
    },

    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Definition',
      name: 'Local maximum and local minimum',
      statement: String.raw`Let $f$ be a real function on a metric space $X$. Then $f$ has a *local maximum* at $p\in X$ if there is a $\delta>0$ such that $f(q)\le f(p)$ for every $q\in X$ with $d(p,q)<\delta$. It has a *local minimum* at $p$ if, for some $\delta>0$, $f(q)\ge f(p)$ whenever $d(p,q)<\delta$.`,
      idea: String.raw`Only a neighbourhood of $p$ is compared with $p$: a local maximum need not be a global one, and the admissible $\delta$ may be tiny. Theorem 5.8 turns this one-sided comparison into the vanishing of the derivative.`,
      caption: String.raw`A landscape $f$ on $X=\R^2$ (contour lines every $0.1$; blue high, orange low). Drag $p$ and change $\delta$: the ball $B(p,\delta)$ turns green when $f(q)\le f(p)$ for every $q$ in it, and otherwise the red point $q$ beats $p$. The handle snaps onto the three local maxima; the readout reports the largest $\delta$ that works.`,
      deps: ['pma-2.18'],
      tags: ['extrema', 'metric spaces'],
      viz(v) {
        const M = v.M;
        const BUMPS = [[-1.6, 0.55, 1.0, 0.62], [0.45, -0.55, 0.78, 0.55], [1.75, 0.85, 0.55, 0.42], [0.05, 1.05, -0.65, 0.5], [-0.75, -1.1, -0.55, 0.6], [2.2, -1.1, -0.35, 0.5]];
        const f = (x, y) => { let s = 0; for (const [cx, cy, a, w] of BUMPS) s += a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * w * w)); return s; };
        // local maxima by gradient ascent from the positive bumps
        const grad = (x, y, e = 1e-5) => [(f(x + e, y) - f(x - e, y)) / (2 * e), (f(x, y + e) - f(x, y - e)) / (2 * e)];
        const maxima = BUMPS.filter((b) => b[2] > 0).map(([x, y]) => { for (let k = 0; k < 4000; k++) { const [gx, gy] = grad(x, y); x += 0.05 * gx; y += 0.05 * gy; } return [x, y]; });
        const S = v.stage({ x: [-3.1, 3.1], y: [-2.05, 2.05], equal: true, height: 380, axes: false });
        const dl = v.slider('$\\delta$', 0.05, 1.6, 0.45, { step: 0.01 });
        const p = S.handle(-0.6, 0.15, { color: 'ink', label: 'p', constrain: (x, y) => { for (const m of maxima) if (Math.hypot(x - m[0], y - m[1]) < 0.16) return m.slice(); return [x, y]; } });
        const maxOnBall = (cx, cy, r) => {
          let best = -Infinity, at = null;
          for (let i = 1; i <= 16; i++) { const rr = r * i / 16, n = 8 + 4 * i; for (let k = 0; k < n; k++) { const a = M.TAU * k / n, x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a), z = f(x, y); if (z > best) { best = z; at = [x, y]; } } }
          return { best, at };
        };
        let st = {};
        v.render(() => {
          const pan = v.rgb('panel'), hi = v.rgb('accent'), lo = v.rgb('orange'), ink = v.rgb('ink');
          const pix = 2 * (S.bounds.x[1] - S.bounds.x[0]) / S.width;   // data size of one raster cell
          S.raster((x, y) => {
            let z = 0, gx = 0, gy = 0;
            for (const [cx, cy, a, w] of BUMPS) { const e = a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * w * w)); z += e; gx -= e * (x - cx) / (w * w); gy -= e * (y - cy) / (w * w); }
            const t = Math.min(1, Math.abs(z) / 1.0) * 0.7, c = z >= 0 ? hi : lo;
            let col = [0, 1, 2].map((i) => pan[i] + (c[i] - pan[i]) * t);
            const q = z / 0.1, k = Math.round(q), dd = Math.abs(q - k), half = 0.6 * Math.hypot(gx, gy) * pix / 0.1;
            if (k !== 0 && dd < half) col = col.map((cc, i) => cc + (ink[i] - cc) * 0.2);
            return col;
          }, { key: v.color('panel') + v.color('accent'), res: 2 });
          for (const m of maxima) S.dot(m[0], m[1], { color: 'green', r: 3, alpha: 0.8 });
          const fp = f(p.x, p.y), r = dl.value;
          const { best, at } = maxOnBall(p.x, p.y, r);
          const ok = best <= fp + 1e-9;
          S.circle(p.x, p.y, r, { color: ok ? 'green' : 'red', width: 2.2, fill: ok ? 'green' : 'red', fillAlpha: 0.1 });
          S.measure(p.x, p.y, p.x + r * Math.cos(-0.6), p.y + r * Math.sin(-0.6), 'δ', { color: ok ? 'green' : 'red', offset: 11 });
          if (!ok) { S.line(p.x, p.y, at[0], at[1], { color: 'red', width: 1.2, dash: [3, 3] }); S.dot(at[0], at[1], { color: 'red', r: 5, label: 'q', labelPos: 'ne' }); }
          // largest admissible δ
          let dstar = 0;
          for (let rr = 0.01; rr <= 3; rr += 0.01) { let bad = false; for (let k = 0; k < 72; k++) { const a = M.TAU * k / 72; if (f(p.x + rr * Math.cos(a), p.y + rr * Math.sin(a)) > fp + 1e-9) { bad = true; break; } } if (bad) break; dstar = rr; }
          S.corner(ok ? `f(q) ≤ f(p) on all of B(p, δ)` : `f(q) = ${v.fix(best, 3)} > f(p) = ${v.fix(fp, 3)}`, 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { fp, ok, dstar, r };
        });
        v.legend([['green', 'ball $B(p,\\delta)$ where $f\\le f(p)$', { area: true }], ['red', 'a point $q$ with $f(q)>f(p)$', { dot: true }], ['green', 'local maxima', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.fp == null) return '';
          return `$f(p) = ${v.fix(s.fp, 4)}$. ` + (s.dstar > 0.005 ? `$p$ is a local maximum: every $\\delta \\le ${v.fix(s.dstar, 2)}$ works.` : 'Every ball about $p$, however small, contains points with larger values: $p$ is **not** a local maximum.');
        });
      },
    },

    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Theorem',
      name: 'Interior extrema have zero derivative',
      statement: String.raw`Let $f$ be defined on $[a,b]$. If $f$ has a local maximum at a point $x\in(a,b)$ and $f'(x)$ exists, then $f'(x)=0$. The same conclusion holds at a local minimum.`,
      idea: String.raw`Choose $\delta$ as in Definition 5.7 with $a<x-\delta<x+\delta<b$. For $x-\delta<t<x$ the quotient $\frac{f(t)-f(x)}{t-x}$ has a numerator $\le0$ and a negative denominator, so it is $\ge0$; for $x<t<x+\delta$ it is $\le0$. Letting $t\to x$ from the left and from the right gives $f'(x)\ge0$ and $f'(x)\le0$.`,
      caption: String.raw`Drag $x$ along the graph (it snaps to the extrema) and move the offset $h$. At a local maximum the left secants (teal) slope up and the right secants (purple) slope down, so in the lower panel the quotients $\varphi(t)$ are confined to the green quadrants and squeezed to $0$. Break the hypotheses: at the kink $f'(x)$ does not exist, and at the endpoint maximum $x=b$ only left quotients are available, so $f'(b)\ne0$ is possible.`,
      deps: ['pma-5.7', 'pma-5.1'],
      tags: ['extrema', 'derivative'],
      viz(v) {
        const M = v.M, A = 0, B = 4;
        const FN = {
          smooth: { label: 'smooth', f: (x) => 0.9 * Math.sin(1.4 * x - 0.3) + 0.15 * x + 0.6, kinks: [], x0: null },
          kink: { label: 'kink', f: (x) => 1.25 - 0.9 * Math.abs(x - 1.6) + 0.25 * Math.sin(2 * x), kinks: [1.6], x0: 1.6 },
          end: { label: 'maximum at $b$', f: (x) => 0.25 * x + 0.35 * Math.sin(1.2 * x) + 0.3, kinks: [], x0: B },
        };
        const which = v.select('', Object.entries(FN).map(([value, F]) => ({ value, label: F.label })), 'smooth');
        const hs = v.slider('offset $h$', 0.01, 1.2, 0.6, { log: true, fmt: (x) => v.fmt(x, 2) });
        const F = () => FN[which.value];
        const top = v.stage({ x: [-0.1, 4.25], y: [-0.5, 2], height: 270, full: true });
        const bot = v.stage({ x: [-0.1, 4.25], y: [-2, 2], height: 200, full: true, title: 'difference quotients $\\varphi(t)=\\frac{f(t)-f(x)}{t-x}$' });
        const snaps = {};
        for (const [k, G] of Object.entries(FN)) snaps[k] = [...roots((x) => M.deriv(G.f, x, 1e-6), A + 0.02, B - 0.02, 400).filter((r) => !G.kinks.some((c) => Math.abs(r - c) < 0.02)), ...G.kinks, ...(k === 'end' ? [B] : [])];
        const hx = top.handle(1, 0, { color: 'accent', label: 'x', constrain: (X) => { X = M.clamp(X, A, B); for (const s of snaps[which.value]) if (Math.abs(X - s) < 0.09) X = s; return [X, F().f(X)]; } });
        hx.labelPos = 'n';
        let last = null, st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (last !== which.value) { last = which.value; hx.x = G.x0 ?? snaps.smooth[0]; }
          hx.y = f(hx.x);
          const x = hx.x, fx = f(x), h = hs.value;
          const phi = (t) => (f(t) - fx) / (t - x);
          // classify
          const near = M.linspace(Math.max(A, x - 0.06), Math.min(B, x + 0.06), 61).filter((t) => t !== x);
          const isMax = near.every((t) => f(t) <= fx + 1e-12), isMin = near.every((t) => f(t) >= fx - 1e-12);
          const kink = G.kinks.includes(x), endpoint = x === A || x === B;
          // top
          top.vline(A, { color: 'faint', width: 1, dash: [2, 3] }); top.vline(B, { color: 'faint', width: 1, dash: [2, 3] });
          top.text('a', A, top.bounds.y[0], { dy: -10, dx: 6, color: 'muted', math: true }); top.text('b', B, top.bounds.y[0], { dy: -10, dx: 6, color: 'muted', math: true });
          top.fn(f, { domain: [A, B], color: 'ink', width: 2.4 });
          const tl = x - h, tr = x + h;
          if (tl >= A) { const m = phi(tl); top.line(tl - 0.25, f(tl) - 0.25 * m, x + 0.25, fx + 0.25 * m, { color: 'teal', width: 2 }); top.dot(tl, f(tl), { color: 'teal', r: 4.5 }); }
          if (tr <= B) { const m = phi(tr); top.line(x - 0.25, fx - 0.25 * m, tr + 0.25, f(tr) + 0.25 * m, { color: 'purple', width: 2 }); top.dot(tr, f(tr), { color: 'purple', r: 4.5 }); }
          if (isMax || isMin) top.hline(fx, { color: 'green', width: 1.2, dash: [6, 4], alpha: 0.8 });
          // bottom
          const ys = M.linspace(A, B, 200).filter((t) => Math.abs(t - x) > 1e-3).map(phi);
          const [lo, hi] = yRange(ys, 0.02, 0.15, 1.2);
          bot.setView(null, [Math.min(lo, -0.4), Math.max(hi, 0.4)]);
          if (isMax || isMin) {
            const s = isMax ? 1 : -1, Y = 50;
            bot.rect(-5, 0, x, s * Y, { fill: 'green', fillAlpha: 0.1, stroke: false });
            bot.rect(x, 0, 10, -s * Y, { fill: 'green', fillAlpha: 0.1, stroke: false });
          }
          bot.vline(x, { color: 'accent', width: 1, dash: [2, 4], alpha: 0.7 });
          if (x > A) bot.fn(phi, { domain: [A, x - 1e-6], color: 'teal', width: 2.4 });
          if (x < B) bot.fn(phi, { domain: [x + 1e-6, B], color: 'purple', width: 2.4 });
          if (tl >= A) bot.dot(tl, phi(tl), { color: 'teal', r: 4.5 });
          if (tr <= B) bot.dot(tr, phi(tr), { color: 'purple', r: 4.5 });
          const lq = x > A ? phi(x - 1e-6) : NaN, rq = x < B ? phi(x + 1e-6) : NaN;
          if (kink) { bot.dot(x, lq, { hollow: true, color: 'red', r: 5, width: 2.2 }); bot.dot(x, rq, { hollow: true, color: 'red', r: 5, width: 2.2 }); bot.corner('one-sided limits differ: f′(x) does not exist', 'tr', { color: 'red', weight: 600 }); }
          else if (endpoint) { bot.dot(x, lq, { hollow: true, color: 'orange', r: 5.5, width: 2.4 }); bot.corner(`x = b: only t < x, so f′(b) = ${v.fmt(lq, 3)} ≥ 0 is allowed`, 'tl', { color: 'orange', weight: 600 }); }
          else if (isMax || isMin) { bot.dot(x, 0, { hollow: true, color: 'green', r: 5.5, width: 2.4 }); bot.corner(`${isMax ? 'local max' : 'local min'}: quotients squeezed to 0, so f′(x) = 0`, 'tr', { color: 'green', weight: 600 }); }
          else bot.dot(x, (lq + rq) / 2, { hollow: true, color: 'accent', r: 5, width: 2.2 });
          v.legend([['ink', '$y=f(x)$'], ['teal', 'left: $t<x$'], ['purple', 'right: $t>x$'], ['green', 'sign pattern forced at an extremum', { area: true }]]);
          st = { x, fx, isMax, isMin, kink, endpoint, lq, rq };
        });
        v.readout(() => {
          const s = st; if (s.x == null) return '';
          const kind = s.isMax ? 'a local maximum' : s.isMin ? 'a local minimum' : 'not a local extremum';
          let tail;
          if (s.kink) tail = `, but the left and right quotients tend to $${v.fmt(s.lq, 3)}$ and $${v.fmt(s.rq, 3)}$: no derivative, so 5.8 says nothing.`;
          else if (s.endpoint) tail = ` of $f$ on $[a,b]$, but $b\\notin(a,b)$: the left quotients only give $f'(b) = ${v.fmt(s.lq, 3)} \\ge 0$.`;
          else if (s.isMax || s.isMin) tail = `: left quotients $${s.isMax ? '\\ge' : '\\le'} 0$, right quotients $${s.isMax ? '\\le' : '\\ge'} 0$, hence $f'(x) = ${v.fix(Math.abs((s.lq + s.rq) / 2) < 5e-6 ? 0 : (s.lq + s.rq) / 2, 4)}$.`;
          else tail = `; here $f'(x) = ${v.fmt((s.lq + s.rq) / 2, 3)}$ and the quotients on both sides share its sign.`;
          return `$x = ${v.fix(s.x, 3)}$ is ${kind}` + tail;
        });
      },
    },

    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Theorem',
      name: "Generalized mean value theorem (Cauchy's form)",
      statement: String.raw`Let $f$ and $g$ be continuous real functions on $[a,b]$ that are differentiable in $(a,b)$. Then there is a point $x\in(a,b)$ at which
$$[f(b)-f(a)]\,g'(x)=[g(b)-g(a)]\,f'(x).$$
No differentiability is required at the endpoints.`,
      idea: String.raw`Put $h(t)=[f(b)-f(a)]\,g(t)-[g(b)-g(a)]\,f(t)$. Expanding shows $h(a)=f(b)g(a)-f(a)g(b)=h(b)$. If $h$ is constant every $x$ works. Otherwise $h$, continuous on the compact interval, attains a maximum or minimum at some interior point (4.16, using $h(a)=h(b)$), and there $h'(x)=0$ by Theorem 5.8 — which is exactly the claimed identity. Geometrically: the curve $t\mapsto(g(t),f(t))$ has a tangent parallel to its chord.`,
      caption: String.raw`Drag the four control points shaping the curve $t\mapsto(g(t),f(t))$, $a\le t\le b$. The green tangents are parallel to the dashed chord; they occur exactly where the auxiliary function $h$ (right) has horizontal tangents, and $h(a)=h(b)$ guarantees at least one. Switch to the polygonal curve: $f$ and $g$ are not differentiable at the corners, $h$ peaks at a corner, and no parallel tangent need exist.`,
      deps: ['pma-5.8', 'pma-4.16', 'pma-5.3'],
      tags: ['mean value theorem', 'derivative'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'bez', label: 'smooth curve' }, { value: 'poly', label: 'polygonal curve (corners)' }], 'bez');
        const L = v.stage({ x: [-0.2, 3.2], y: [-0.55, 2.35], equal: true, height: 340, title: 'the curve $t\\mapsto(g(t),\\,f(t))$', xlabel: 'g', ylabel: 'f' });
        const R = v.stage({ x: [-0.12, 1.06], y: [-1, 1], height: 340, axes: 'box', title: '$h(t)=[f(b)-f(a)]\\,g(t)-[g(b)-g(a)]\\,f(t)$', xticks: [[0, 'a'], [0.5, ''], [1, 'b']] });
        const P = [[0.25, 0.2], [0.55, 2.2], [2.55, -0.45], [2.9, 1.55]].map(([x, y], i) => L.handle(x, y, { color: i === 0 || i === 3 ? 'accent' : 'gray', r: i === 0 || i === 3 ? 7 : 6 }));
        P[0].label = 'a'; P[3].label = 'b'; P[0].labelPos = 'sw'; P[3].labelPos = 'ne';
        let st = {};
        const gamma = (t) => {
          const Q = P.map((h) => [h.x, h.y]);
          if (mode.value === 'poly') { const s = M.clamp(t, 0, 1) * 3, i = Math.min(2, Math.floor(s)), u = s - i; return M.vlerp(Q[i], Q[i + 1], u); }
          const u = 1 - t; return [0, 1].map((k) => u * u * u * Q[0][k] + 3 * u * u * t * Q[1][k] + 3 * u * t * t * Q[2][k] + t * t * t * Q[3][k]);
        };
        const dgamma = (t) => {
          const Q = P.map((h) => [h.x, h.y]);
          if (mode.value === 'poly') { const i = Math.min(2, Math.floor(M.clamp(t, 0, 1) * 3)); return M.vscale(M.vsub(Q[i + 1], Q[i]), 3); }
          const u = 1 - t; return [0, 1].map((k) => 3 * (u * u * (Q[1][k] - Q[0][k]) + 2 * u * t * (Q[2][k] - Q[1][k]) + t * t * (Q[3][k] - Q[2][k])));
        };
        v.render(() => {
          const A = gamma(0), Bp = gamma(1), Dg = Bp[0] - A[0], Df = Bp[1] - A[1];
          const hfun = (t) => { const p = gamma(t); return Df * p[0] - Dg * p[1]; };
          const hp = (t) => { const d = dgamma(t); return Df * d[0] - Dg * d[1]; };
          const smooth = mode.value === 'bez';
          // left
          if (smooth) L.path(P.map((h) => [h.x, h.y]), { color: 'faint', width: 1, dash: [3, 4] });
          L.line(A[0], A[1], Bp[0], Bp[1], { color: 'accent', width: 1.8, dash: [7, 5] });
          L.curve(gamma, 0, 1, { color: 'ink', width: 2.6, n: 300 });
          const xs = smooth ? roots(hp, 0.0005, 0.9995, 600) : [];
          const len = Math.hypot(Dg, Df) || 1, u = [Dg / len, Df / len];
          for (const x of xs) {
            const p = gamma(x), d = dgamma(x);
            L.line(p[0] - 9 * u[0], p[1] - 9 * u[1], p[0] + 9 * u[0], p[1] + 9 * u[1], { color: 'green', width: 1.6, alpha: 0.85 });
            const dl = Math.hypot(...d) || 1;
            L.arrow(p[0], p[1], p[0] + 0.45 * d[0] / dl, p[1] + 0.45 * d[1] / dl, { color: 'green', width: 2.2, head: 8 });
            L.dot(p[0], p[1], { color: 'green', r: 5 });
          }
          // the proof's x: extremum of h
          const ts = M.linspace(0, 1, 601), hv = ts.map(hfun), h0 = hv[0];
          const k = M.argmax(hv, (y) => Math.abs(y - h0)), xstar = ts[k];
          if (!smooth) { const p = gamma(xstar); L.dot(p[0], p[1], { color: 'red', r: 12, hollow: true, width: 2.4, label: 'extremum of h at a corner', labelPos: 'e', math: false }); }
          // right
          const [lo, hi] = yRange(hv, 0, 0.18, 0.2);
          R.setView(null, [lo, hi]);
          R.hline(h0, { color: 'accent', width: 1.3, dash: [7, 5] });
          R.path(ts.map((t, i) => [t, hv[i]]), { color: 'ink', width: 2.4 });
          R.dot(0, h0, { color: 'accent', r: 4.5 }); R.dot(1, hv[600], { color: 'accent', r: 4.5 });
          for (const x of xs) { const y = hfun(x); R.line(x - 0.12, y, x + 0.12, y, { color: 'green', width: 2.2 }); R.dot(x, y, { color: 'green', r: 4.5 }); }
          if (!smooth) R.dot(xstar, hv[k], { color: 'red', r: 5.5 });
          R.text('h(a) = h(b)', 0.03, h0, { dy: hv[12] > h0 ? 13 : -13, align: 'left', color: 'accent', size: 11.5 });
          v.legend([['ink', 'curve / $h$'], ['accent', 'chord, and the level $h(a)=h(b)$', { dash: true }], ['green', 'tangent parallel to the chord, $h\'(x)=0$']]);
          // pick the root closest to the extremum for the readout
          const xr = xs.length ? xs[M.argmin(xs, (x) => Math.abs(x - xstar))] : null;
          st = { Dg, Df, xr, n: xs.length, smooth, xstar };
        });
        v.readout(() => {
          const s = st; if (s.Dg == null) return '';
          if (!s.smooth) return `Polygonal curve: $h$ is piecewise linear and attains its extreme value at the corner $t = ${v.fix(s.xstar, 3)}$, where $f'$ and $g'$ do not exist — the hypothesis "differentiable in $(a,b)$" fails, and with it the conclusion (generically no tangent is parallel to the chord).`;
          if (s.xr == null) return 'The control points are degenerate.';
          const d = dgamma(s.xr);
          return `${s.n} point${s.n > 1 ? 's' : ''} with $h'(x)=0$. At $x = ${v.fix(s.xr, 4)}$: $\\;[f(b)-f(a)]\\,g'(x) = ${v.fmt(s.Df * d[0], 4)}$, $\\;[g(b)-g(a)]\\,f'(x) = ${v.fmt(s.Dg * d[1], 4)}$.`;
        });
      },
    },
  ],
};
