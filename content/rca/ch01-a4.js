// Rudin, Real and Complex Analysis — Chapter 1, part 4: integration of complex functions,
// dominated convergence, sets of measure zero and completion.

/** Midpoint-rule integral on [a,b] with n cells (robust for discontinuous integrands). */
function mid(f, a, b, n = 4000) { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }

export default {
  collection: 'rca',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.30
    {
      num: '1.30',
      kind: 'Definition',
      name: 'The space L¹(μ)',
      statement: String.raw`$L^1(\mu)$ is the collection of all complex measurable functions $f$ on $X$ with
$$\int_X|f|\,d\mu<\infty .$$
Its members are the **Lebesgue integrable** (or summable) functions with respect to $\mu$. ($|f|$ is measurable by 1.9, so the integral makes sense.)`,
      idea: String.raw`Integrability is a size condition on $|f|$ alone, and it can fail in two ways: a singularity that is too strong, or a tail that is too heavy. The model cases are the powers $x^{-p}$: on $(0,1]$ they are in $L^1$ iff $p<1$, on $[1,\infty)$ iff $p>1$.`,
      caption: String.raw`Choose a domain and slide the exponent $p$. The upper panel shades $x^{-p}$ over the truncated domain $[\varepsilon,1]$ or $[1,R]$; the lower panel follows the truncated integral as the cut-off is removed. It levels off exactly when $x^{-p}\in L^1$.`,
      deps: ['rca-1.23', 'rca-1.9'],
      tags: ['L1', 'definitions'],
      viz(v) {
        const M = v.M;
        const dom = v.select('', [{ value: 'near0', label: 'on $(0,1]$' }, { value: 'tail', label: 'on $[1,\\infty)$' }], 'near0');
        const pS = v.slider('$p$', 0.2, 2, 0.6, { step: 0.01 });
        const T = v.stage({ x: [0, 1], y: [0, 6], height: 230, axes: 'box', full: true, title: ' ' });
        const B = v.stage({ x: [0, 6], y: [0, 6], height: 190, axes: 'box', full: true, title: ' ' });
        const F = (p, a, b) => (Math.abs(p - 1) < 1e-9 ? Math.log(b / a) : (b ** (1 - p) - a ** (1 - p)) / (1 - p));
        let st = null;
        v.render(() => {
          const p = pS.value, near = dom.value === 'near0';
          if (near) {
            T.setView([0, 1.02], [-0.3, 6]); T.setTitle(`$x^{-p}$ on $[\\varepsilon,1]$`);
            B.setView([0, 7.2], [-0.4, 8]); B.setTitle('$\\int_\\varepsilon^1 x^{-p}\\,dx$ against $\\log_{10}(1/\\varepsilon)$');
            const eps = 1e-3;
            T.fn((x) => x ** -p, { domain: [eps, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2 });
            const pts = M.linspace(0, 7, 200).map((t) => [t, F(p, 10 ** -t, 1)]);
            B.path(pts.map(([t, y]) => [t, Math.min(y, 8.2)]), { color: 'accent', width: 2.4 });
            const lim = p < 1 ? 1 / (1 - p) : Infinity;
            if (isFinite(lim) && lim < 8) B.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] });
            st = { near, p, lim, v6: F(p, 1e-7, 1) };
          } else {
            T.setView([0, 40], [-0.05, 1.05]); T.setTitle('$x^{-p}$ on $[1,R]$');
            B.setView([0, 7.2], [-0.4, 8]); B.setTitle('$\\int_1^R x^{-p}\\,dx$ against $\\log_{10}R$');
            T.fn((x) => x ** -p, { domain: [1, 40], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2 });
            const pts = M.linspace(0, 7, 200).map((t) => [t, F(p, 1, 10 ** t)]);
            B.path(pts.map(([t, y]) => [t, Math.min(y, 8.2)]), { color: 'accent', width: 2.4 });
            const lim = p > 1 ? 1 / (p - 1) : Infinity;
            if (isFinite(lim) && lim < 8) B.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] });
            st = { near, p, lim, v6: F(p, 1, 1e7) };
          }
          v.legend([['accent', '$x^{-p}$ and its truncated integrals'], ['green', 'the limit, when finite', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const inL1 = isFinite(s.lim);
          return `$p=${v.fix(s.p, 2)}$: truncated integral at cut-off $10^{-7}$ resp. $10^{7}$ is $${v.fix(s.v6, 2)}$; ` + (inL1 ? `limit $${v.fix(s.lim, 3)}$, so $x^{-p}\\in L^1$.` : `it grows without bound, so $x^{-p}\\notin L^1$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.31
    {
      num: '1.31',
      kind: 'Definition',
      name: 'The integral of a complex function',
      statement: String.raw`If $f=u+iv$ with $u,v$ real measurable and $f\in L^1(\mu)$, then for every measurable $E$
$$\int_E f\,d\mu=\int_E u^+\,d\mu-\int_E u^-\,d\mu+i\int_E v^+\,d\mu-i\int_E v^-\,d\mu .$$
All four integrals are finite because $u^\pm,v^\pm\le|f|$. The same formula defines $\int_E f\,d\mu$ for measurable $f:X\to[-\infty,\infty]$ whenever at least one of $\int_E f^+$, $\int_E f^-$ is finite; the value may then be $\pm\infty$.`,
      idea: String.raw`Split $f$ into four nonnegative pieces, integrate each with the positive theory of 1.23, and recombine; the minimality of $u^\pm,v^\pm$ (1.15) makes the result independent of how $f$ is decomposed (this is what 1.32 checks).`,
      deps: ['rca-1.30', 'rca-1.14a', 'rca-1.23'],
      tags: ['integral', 'definitions'],
    },
    // ------------------------------------------------------------------ 1.32
    {
      num: '1.32',
      kind: 'Theorem',
      name: 'The integral is linear on L¹(μ)',
      statement: String.raw`If $f,g\in L^1(\mu)$ and $\alpha,\beta\in\C$, then $\alpha f+\beta g\in L^1(\mu)$ and
$$\int_X(\alpha f+\beta g)\,d\mu=\alpha\int_X f\,d\mu+\beta\int_X g\,d\mu .$$`,
      idea: String.raw`$|\alpha f+\beta g|\le|\alpha||f|+|\beta||g|$ gives integrability (1.24, 1.27). For real $f,g$ and $h=f+g$, the identity $h^+-h^-=f^+-f^-+g^+-g^-$ rearranges to $h^++f^-+g^-=h^-+f^++g^+$ — sums of **nonnegative** functions, which may be integrated term by term (1.27); since everything is finite, move terms back across. Scalars are handled separately: $\alpha\ge0$ by 1.24(c), $\alpha=-1$ by swapping $u^\pm$, and $\alpha=i$ by swapping real and imaginary parts.`,
      caption: String.raw`Real $f$ (blue) and $g$ (orange) on $[0,1]$; drag the handle to move $g$ and slide $\alpha$. Below, with $h=f+\alpha g$, the stack $h^++f^-+(\alpha g)^-$ is drawn upward and $h^-+f^++(\alpha g)^+$ downward: they are mirror images at every $x$, which is the identity the proof integrates.`,
      deps: ['rca-1.31', 'rca-1.15', 'rca-1.27', 'rca-1.24'],
      tags: ['integral', 'L1'],
      viz(v) {
        const M = v.M;
        const aS = v.slider('$\\alpha$', -2, 2, 1, { step: 0.05 });
        const T = v.stage({ x: [-0.02, 1.02], y: [-2.2, 2.2], height: 230, full: true, title: '$f$, $\\alpha g$ and $h=f+\\alpha g$' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-4.2, 4.2], height: 260, full: true, title: 'up: $h^++f^-+(\\alpha g)^-$ $\\quad$ down: $h^-+f^++(\\alpha g)^+$' });
        const f = (x) => 1.1 * Math.sin(2 * Math.PI * x) + 0.2;
        const hg = T.handle(0.75, 0.5, { color: 'orange', label: 'g', constrain: (x, y) => [0.75, M.clamp(y, -1.6, 1.6)] });
        const pos = (t) => Math.max(t, 0), neg = (t) => Math.max(-t, 0);
        let st = null;
        v.render(() => {
          const al = aS.value, c0 = hg.y - 0.8 * Math.cos(9 * 0.75);
          const g = (x) => c0 + 0.8 * Math.cos(9 * x);
          const ag = (x) => al * g(x), h = (x) => f(x) + ag(x);
          T.fn(f, { domain: [0, 1], color: 'blue', width: 2.2 });
          T.fn(g, { domain: [0, 1], color: 'orange', width: 1.3, dash: [4, 4] });
          T.fn(ag, { domain: [0, 1], color: 'orange', width: 2.2 });
          T.fn(h, { domain: [0, 1], color: 'green', width: 2.6 });
          // mirrored stacks
          const up = [(x) => pos(h(x)), (x) => neg(f(x)), (x) => neg(ag(x))];
          const dn = [(x) => neg(h(x)), (x) => pos(f(x)), (x) => pos(ag(x))];
          const cols = ['green', 'blue', 'orange'];
          const stack = (arr, sign) => {
            let acc = () => 0;
            arr.forEach((fn, i) => { const lo = acc; const hi = (x) => lo(x) + fn(x); B.between((x) => sign * hi(x), (x) => sign * lo(x), 0, 1, { fill: cols[i], fillAlpha: 0.4, n: 500 }); acc = hi; });
            return acc;
          };
          const U = stack(up, 1), D = stack(dn, -1);
          B.fn(U, { domain: [0, 1], color: 'ink', width: 1.4 });
          B.fn((x) => -D(x), { domain: [0, 1], color: 'ink', width: 1.4 });
          B.hline(0, { color: 'faint', width: 1 });
          { const m = Math.max(...M.linspace(0, 1, 201).map(U)) * 1.15; B.setView(null, [-m, m]); }
          const I = (fn) => mid(fn, 0, 1, 4000);
          const If = I(f), Ig = I(g), Ih = I(h);
          const err = Math.max(...M.linspace(0, 1, 801).map((x) => Math.abs(U(x) - D(x))));
          v.legend([['blue', '$f$, $f^{\\pm}$'], ['orange', '$\\alpha g$, $(\\alpha g)^{\\pm}$'], ['green', '$h=f+\\alpha g$, $h^{\\pm}$']]);
          st = { al, If, Ig, Ih, err };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int h=${v.fix(s.Ih, 4)}$ and $\\int f+\\alpha\\int g=${v.fix(s.If, 4)}+(${v.fix(s.al, 2)})(${v.fix(s.Ig, 4)})=${v.fix(s.If + s.al * s.Ig, 4)}$; $\\;\\max_x|\\text{up}-\\text{down}|=${v.fix(s.err, 6)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.33
    {
      num: '1.33',
      kind: 'Theorem',
      name: 'The triangle inequality for integrals',
      statement: String.raw`If $f\in L^1(\mu)$, then
$$\Big|\int_X f\,d\mu\Big|\le\int_X|f|\,d\mu .$$`,
      idea: String.raw`Let $z=\int f$ and choose $\alpha\in\C$ with $|\alpha|=1$ and $\alpha z=|z|$. Then $|z|=\int\alpha f$ is real, so it equals $\int\Re(\alpha f)$, and $\Re(\alpha f)\le|\alpha f|=|f|$ pointwise; integrate (1.24, 1.32).`,
      caption: String.raw`The integral of a complex $f$ on $[0,1]$ as a chain of tiny vectors $f(x)\,dx$ laid head to tail: its endpoint is $\int f$, its total length is $\int|f|$, so the endpoint never leaves the dashed circle of radius $\int|f|$. Slide the phase spread: with constant phase the chain is straight and equality holds. The lower panel shows $\Re(\alpha f)\le|f|$ for the rotation $\alpha$ that makes $\int\alpha f$ real.`,
      deps: ['rca-1.32', 'rca-1.31', 'rca-1.24'],
      tags: ['integral', 'inequalities'],
      viz(v) {
        const M = v.M, N = 90;
        const kS = v.slider('phase spread $\\kappa$', 0, 3, 1.2, { step: 0.01 });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, ticks: false, title: 'the chain of $f(x)\\,dx$ in $\\C$' });
        const R = v.stage({ x: [-0.02, 1.02], y: [-1.6, 1.6], height: 340, title: '$|f|$ and $\\Re(\\alpha f)$ on $[0,1]$' });
        const r = (x) => 0.7 + 0.5 * Math.sin(3 * x + 0.5);
        const th = (x) => 4 * (x - 0.3) ** 2 * 3 + Math.sin(5 * x);
        let st = null;
        v.render(() => {
          const k = kS.value;
          const f = (x) => [r(x) * Math.cos(k * th(x) + 0.6), r(x) * Math.sin(k * th(x) + 0.6)];
          const pts = [[0, 0]]; let zx = 0, zy = 0, L1 = 0;
          for (let i = 0; i < N; i++) { const [a, b] = f((i + 0.5) / N); zx += a / N; zy += b / N; L1 += Math.hypot(a, b) / N; pts.push([zx, zy]); }
          L.circle(0, 0, L1, { color: 'muted', width: 1.4, dash: [5, 4] });
          L.path(pts, { color: 'gold', width: 2.4 });
          pts.forEach((p, i) => { if (i % 10 === 0 && i < N) L.dot(p[0], p[1], { color: 'gold', r: 2.2 }); });
          L.arrow(0, 0, zx, zy, { color: 'accent', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          L.tex('\\int f', zx, zy, { color: 'accent', dx: zx >= 0 ? 16 : -16, dy: -10, size: 15 });
          L.tex('\\text{radius }\\int|f|', L1 * Math.cos(2.3), L1 * Math.sin(2.3), { color: 'muted', size: 13, dx: -6, dy: -10, align: 'right' });
          const z = Math.hypot(zx, zy), ar = z > 1e-9 ? [zx / z, -zy / z] : [1, 0];
          const reAf = (x) => { const [a, b] = f(x); return ar[0] * a - ar[1] * b; };
          R.fn((x) => Math.hypot(...f(x)), { domain: [0, 1], color: 'ink', width: 2.2 });
          R.fn(reAf, { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.18 });
          R.between((x) => Math.hypot(...f(x)), reAf, 0, 1, { fill: 'red', fillAlpha: 0.1 });
          v.legend([['gold', 'the chain $\\sum f(x_i)\\Delta x$'], ['accent', '$\\int f$, and $\\Re(\\alpha f)$', { area: true }], ['ink', '$|f|$'], ['red', 'the slack $|f|-\\Re(\\alpha f)$', { area: true }]]);
          st = { z, L1 };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\left|\\int f\\right|=${v.fix(s.z, 4)}\\ \\le\\ \\int|f|=${v.fix(s.L1, 4)}$ (ratio $${v.fix(s.z / s.L1, 4)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.34
    {
      num: '1.34',
      kind: 'Theorem',
      name: "Lebesgue's dominated convergence theorem",
      statement: String.raw`Let $\{f_n\}$ be complex measurable functions on $X$ such that $f(x)=\lim_{n\to\infty}f_n(x)$ exists for every $x\in X$. If there is $g\in L^1(\mu)$ with
$$|f_n(x)|\le g(x)\qquad(n=1,2,3,\ldots;\ x\in X),$$
then $f\in L^1(\mu)$,
$$\lim_{n\to\infty}\int_X|f_n-f|\,d\mu=0,\qquad\text{and}\qquad\lim_{n\to\infty}\int_X f_n\,d\mu=\int_X f\,d\mu .$$`,
      idea: String.raw`$|f|\le g$, so $f\in L^1$. Apply Fatou's lemma (1.28) to the nonnegative functions $2g-|f_n-f|$: since they tend to $2g$, one gets $\int2g\le\int2g-\limsup\int|f_n-f|$, and subtracting the finite number $\int2g$ leaves $\limsup\int|f_n-f|\le0$. The last claim follows from 1.33.`,
      caption: String.raw`Top: $|f_n|$ (blue), the limit $f$ (green dashed) and the dominating function $g$ (orange) — in the first example $g=\frac{1}{2\sqrt x}$ is unbounded but integrable. Bottom: $\int|f_n-f|$ against $n$. In the last example no integrable $g$ exists: the least majorant $\sup_k|f_k|\approx\frac1x$ (orange dashed) has infinite integral, and $\int|f_n-f|$ stays at $1$.`,
      deps: ['rca-1.28', 'rca-1.33', 'rca-1.32', 'rca-1.14a'],
      see: ['pma-11.32'],
      tags: ['convergence theorems', 'L1'],
      viz(v) {
        const M = v.M, NB = 40;
        const EX = {
          sing: { label: '$\\frac{1-e^{-nx}}{2\\sqrt x}$, $g=\\frac{1}{2\\sqrt x}$', f: (n, x) => (1 - Math.exp(-n * x)) / (2 * Math.sqrt(x)), lim: (x) => 1 / (2 * Math.sqrt(x)), g: (x) => 1 / (2 * Math.sqrt(x)), Ig: 1, y: [-0.15, 4.2], err: (n) => mid((t) => Math.exp(-n * t * t), 0, 1, 4000) }, // ∫ e^{-nx}/(2√x) dx with x = t²
          osc: { label: '$(1+\\frac1n)\\sin(2\\pi x+\\frac3n)$, $g=2$', f: (n, x) => (1 + 1 / n) * Math.sin(2 * Math.PI * x + 3 / n), lim: (x) => Math.sin(2 * Math.PI * x), g: () => 2, Ig: 2, y: [-2.3, 2.3] },
          bad: { label: 'no integrable $g$: $n\\chi_{(0,1/n)}$', f: (n, x) => (x > 0 && x < 1 / n ? n : 0), lim: () => 0, g: null, Ig: Infinity, y: [-0.4, 12], bad: true },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'sing');
        const nS = v.slider('$n$', 1, NB, 4, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.15, 4.2], height: 300, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: ' ' });
        const B = v.stage({ x: [0, NB + 1], y: [0, 1.2], height: 170, axes: 'box', full: true, xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], title: '$\\int_X|f_n-f|\\,d\\mu$' });
        const cache = {};
        const errOf = (key, n) => { const Q = EX[key]; if (Q.err) return cache[key + n] ??= Q.err(n); if (Q.bad) return 1; return cache[key + n] ??= mid((x) => Math.abs(Q.f(n, x) - Q.lim(x)), 0, 1, 3000); };
        let st = null;
        v.render(() => {
          const Q = EX[which.value], n = nS.value;
          T.setView(null, Q.y);
          T.setTitle(Q.bad ? '$|f_n|$, $f=0$, and the least majorant $\\sup_{k\\le n}|f_k|$' : '$|f_n|\\le g$ everywhere, $f_n\\to f$ pointwise');
          if (Q.g) T.fn(Q.g, { domain: [1e-4, 1], color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.08 });
          if (Q.bad) {
            const G = (x) => { let m = 0; for (let k = 1; k <= n; k++) m = Math.max(m, Q.f(k, x)); return m; };
            T.fn(G, { domain: [1e-4, 1], color: 'orange', width: 1.8, dash: [5, 4], n: 2400 });
            T.fn((x) => 1 / x, { domain: [0.08, 1], color: 'orange', width: 1, alpha: 0.5 });
          }
          if (which.value === 'osc') T.fn((x) => -2, { domain: [0, 1], color: 'orange', width: 2 });
          T.fn(Q.lim, { domain: [1e-4, 1], color: 'green', width: 2, dash: [6, 4] });
          T.fn((x) => (which.value === 'osc' ? Q.f(n, x) : Math.abs(Q.f(n, x))), { domain: [1e-4, 1], color: 'accent', width: 2.4, connect: Q.bad, n: 2400 });
          const vals = M.range(NB, 1).map((k) => errOf(which.value, k));
          const ymax = Math.max(...vals) * 1.2;
          B.setView(null, [-0.1 * ymax, ymax]);
          B.bars(vals, { color: (val, i) => (i + 1 === n ? (Q.bad ? 'red' : 'accent') : 'faint'), fillAlpha: 0.8 });
          v.legend(Q.bad ? [['accent', '$f_n$'], ['green', '$f=\\lim f_n=0$', { dash: true }], ['orange', 'least majorant $\\sup_k f_k$ — not integrable', { dash: true }]]
            : [['accent', which.value === 'osc' ? '$f_n$' : '$|f_n|$'], ['green', '$f=\\lim f_n$', { dash: true }], ['orange', which.value === 'osc' ? '$\\pm g$' : '$g$', { area: true }]]);
          const Gint = Q.bad ? M.range(n, 1).reduce((s, k) => s + 1 / k, 0) : Q.Ig; // ∫ max_{k≤n} kχ_(0,1/k) = 1 + 1/2 + … + 1/n
          st = { n, e: vals[n - 1], bad: Q.bad, Gint };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.bad) return `$\\int|f_{${s.n}}-f|=1$ for every $n$. The least majorant of $f_1,\\dots,f_{${s.n}}$ has integral $${v.fix(s.Gint, 3)}\\approx\\log ${s.n}$, unbounded in $n$: no $g\\in L^1$ dominates.`;
          return `$\\int|f_{${s.n}}-f|=${v.fix(s.e, 4)}\\to0$, with $\\int g=${v.fix(s.Gint, 3)}<\\infty$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.35
    {
      num: '1.35',
      kind: 'Definition',
      name: 'Almost everywhere',
      statement: String.raw`Let $(X,\mathfrak M,\mu)$ be a measure space and $E\in\mathfrak M$. A property $P$ holds **almost everywhere on $E$** (a.e. $[\mu]$) if there is $N\in\mathfrak M$ with $N\subset E$, $\mu(N)=0$, such that $P$ holds at every point of $E-N$. For measurable $f,g$, write $f\sim g$ if $\mu(\{x:f(x)\ne g(x)\})=0$, i.e. $f=g$ a.e. This is an equivalence relation, and $f\sim g$ implies $\int_E f\,d\mu=\int_E g\,d\mu$ for every $E\in\mathfrak M$.`,
      idea: String.raw`Transitivity: if $f=g$ off $N_1$ and $g=h$ off $N_2$, then $f=h$ off $N_1\cup N_2$, still a null set. For the integrals, split $E=(E-N)\cup(E\cap N)$: the two functions agree on the first piece and the second contributes $0$ by 1.24(e).`,
      deps: ['rca-1.18', 'rca-1.24'],
      tags: ['measure zero', 'definitions'],
    },
    // ------------------------------------------------------------------ 1.36
    {
      num: '1.36',
      kind: 'Theorem',
      name: 'Completion of a measure space',
      statement: String.raw`Let $(X,\mathfrak M,\mu)$ be a measure space, and let $\mathfrak M^*$ be the collection of all $E\subset X$ for which there are $A,B\in\mathfrak M$ with $A\subset E\subset B$ and $\mu(B-A)=0$; for such $E$ put $\mu(E)=\mu(A)$. Then $\mathfrak M^*$ is a σ-algebra and $\mu$ is a well-defined measure on $\mathfrak M^*$. This extended measure is **complete**: every subset of a null set is measurable.`,
      idea: String.raw`$\mu(A)$ does not depend on the choice: if also $A_1\subset E\subset B_1$, then $A-A_1\subset B_1-A_1$ has measure $0$, so $\mu(A)=\mu(A\cap A_1)=\mu(A_1)$. Complements: $B^c\subset E^c\subset A^c$ with $A^c-B^c=B-A$. Countable unions: $\bigcup A_i\subset\bigcup E_i\subset\bigcup B_i$ and $\bigcup B_i-\bigcup A_i\subset\bigcup(B_i-A_i)$, a null set. Countable additivity on $\mathfrak M^*$ is inherited from the $A_i$.`,
      caption: String.raw`$\mathfrak M$ is generated by nine rectangular atoms; two of them (hatched) have measure $0$. Paint a set $E$ on the fine grid (drag; dragging from a painted cell erases). $A$ (green) is the union of atoms inside $E$, $B$ the union of atoms meeting $E$. $E\in\mathfrak M^*$ exactly when every atom that $E$ only partly covers is a null atom — then $\mu(E)=\mu(A)$. Atoms of positive measure that are only partly covered are outlined in red.`,
      deps: ['rca-1.18', 'rca-1.35', 'rca-1.19'],
      tags: ['completion', 'measure zero'],
      viz(v) {
        const M = v.M, G = 24;
        const XC = [0, 7, 15, 24], YC = [0, 8, 17, 24];
        const NULLS = new Set(['1,1', '2,0']);
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.02], equal: true, axes: false, height: 400 });
        let E = new Set();
        const setEx = (good) => {
          E = new Set();
          for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const whole = i < 7 && j < 8;                                              // a whole atom of positive measure
            const tri = i >= 7 && i < 15 && j >= 8 && j < 17 && (i - 7) + (j - 8) < 10; // part of the null centre atom
            const stripes = i >= 15 && j < 8 && (i + j) % 3 !== 0;                     // part of the other null atom
            const half = !good && i < 4 && j >= 8 && j < 13;                           // part of a positive atom
            if (whole || tri || stripes || half) E.add(i + ',' + j);
          }
        };
        setEx(true);
        v.button('Example: $E\\in\\mathfrak M^*$', () => setEx(true));
        v.button('Example: $E\\notin\\mathfrak M^*$', () => setEx(false));
        v.button('Clear', () => { E = new Set(); });
        let paint = true;
        const cellAt = (x, y) => { const i = Math.floor(x * G), j = Math.floor(y * G); return i >= 0 && i < G && j >= 0 && j < G ? i + ',' + j : null; };
        S.onDrag((x, y, phase) => {
          const c = cellAt(x, y); if (!c) return;
          if (phase === 'start') paint = !E.has(c);
          if (paint) E.add(c); else E.delete(c);
        });
        const atomOf = (i, j) => { let a = 0, b = 0; while (i >= XC[a + 1]) a++; while (j >= YC[b + 1]) b++; return [a, b]; };
        let st = null;
        v.render(() => {
          const atoms = [];
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
            const x0 = XC[a] / G, x1 = XC[a + 1] / G, y0 = YC[b] / G, y1 = YC[b + 1] / G;
            const nul = NULLS.has(a + ',' + b);
            atoms.push({ a, b, x0, x1, y0, y1, nul, mass: nul ? 0 : (x1 - x0) * (y1 - y0), cells: (XC[a + 1] - XC[a]) * (YC[b + 1] - YC[b]), hit: 0 });
          }
          const atomIdx = (a, b) => a * 3 + b;
          for (const c of E) { const [i, j] = c.split(',').map(Number); const [a, b] = atomOf(i, j); atoms[atomIdx(a, b)].hit++; }
          // atoms
          for (const at of atoms) {
            S.rect(at.x0, at.y0, at.x1, at.y1, { fill: at.nul ? 'gray' : 'blue', fillAlpha: at.nul ? 0.06 : 0.07, stroke: false });
            if (at.nul) for (let t = -1; t <= 1; t += 0.035) {
              // hatch lines x - y = t clipped to the atom
              const xa = Math.max(at.x0, at.y0 + t), xb = Math.min(at.x1, at.y1 + t);
              if (xb > xa) S.line(xa, xa - t, xb, xb - t, { color: 'gray', width: 0.8, alpha: 0.45 });
            }
          }
          // E cells
          for (const c of E) { const [i, j] = c.split(',').map(Number); S.rect(i / G, j / G, (i + 1) / G, (j + 1) / G, { fill: 'accent', fillAlpha: 0.55, stroke: false }); }
          for (let k = 0; k <= G; k++) { S.line(k / G, 0, k / G, 1, { color: 'grid', width: 0.6 }); S.line(0, k / G, 1, k / G, { color: 'grid', width: 0.6 }); }
          let muA = 0, muB = 0; const bad = [];
          for (const at of atoms) {
            const full = at.hit === at.cells, some = at.hit > 0;
            if (full) muA += at.mass;
            if (some) muB += at.mass;
            if (full) S.rect(at.x0, at.y0, at.x1, at.y1, { color: 'green', width: 3 });
            else if (some && !at.nul) { S.rect(at.x0, at.y0, at.x1, at.y1, { color: 'red', width: 3 }); bad.push(at); }
            else S.rect(at.x0, at.y0, at.x1, at.y1, { color: 'ink', width: 1.4, alpha: 0.6 });
            S.text(at.nul ? 'μ = 0' : `μ = ${v.fix(at.mass, 3)}`, (at.x0 + at.x1) / 2, (at.y0 + at.y1) / 2, { color: at.nul ? 'muted' : 'ink', size: 12, align: 'center', weight: 600 });
          }
          v.legend([['accent', 'the painted set $E$', { area: true }], ['green', 'atoms in $A$ (inside $E$)'], ['red', 'positive atoms only partly in $E$'], ['gray', 'null atoms', { area: true }]]);
          st = { ok: bad.length === 0, muA, muB, nbad: bad.length, empty: E.size === 0 };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.ok) return `$\\mu(A)=${v.fix(s.muA, 4)}=\\mu(B)$, so $\\mu(B-A)=0$: $\\ E\\in\\mathfrak M^*$ with $\\mu(E)=${v.fix(s.muA, 4)}$` + (s.empty ? '.' : ' — even though $E$ itself is not a union of atoms.');
          return `$\\mu(A)=${v.fix(s.muA, 4)}<\\mu(B)=${v.fix(s.muB, 4)}$: ${s.nbad} atom${s.nbad > 1 ? 's' : ''} of positive measure ${s.nbad > 1 ? 'are' : 'is'} cut, so no admissible $A\\subset E\\subset B$ exists and $E\\notin\\mathfrak M^*$.`;
        });
      },
    },
  ],
};
