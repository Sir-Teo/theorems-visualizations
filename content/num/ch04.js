// Numerical Analysis — Chapter 4: Approximation: best, near-best and rational (items 4.1–4.5; the rest in ch04-b/-c/-d.js)
import { lg, sci, tsci, clamp, linspace, chebPts, chebInterp, chebCoef, clenshaw, supDiff, baryW, bary } from './ch04.shared.js';
import { stepChebInterp } from './numerical-source-audit.shared.js';

const FLOOR = 1e-17;
const lgt = (x) => Math.max(x, FLOOR);

export default {
  collection: 'num',
  chapter: 4,
  title: 'Approximation: best, near-best and rational',
  summary: String.raw`Weierstrass guarantees that polynomials can approximate any continuous function, and smoothness decides how fast: algebraically for $k$ derivatives, geometrically for analytic functions, with a rate set by the Bernstein ellipse. The best approximation in the sup norm is characterized by equioscillation and computed by Remez’s algorithm, but Chebyshev interpolants are nearly as good at a fraction of the cost. Least squares leads to orthogonal polynomials, and rational functions capture poles and singularities that defeat polynomials.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Weierstrass approximation theorem',
      statement: String.raw`Let $f$ be a continuous real function on a closed bounded interval $[a,b]$. For every $\varepsilon>0$ there is a polynomial $p$ with $\max_{[a,b]}|f-p|<\varepsilon$. Equivalently, polynomials are dense in $C[a,b]$ in the sup norm. Continuity cannot be dropped: a function with a jump is not a uniform limit of polynomials, since uniform limits of continuous functions are continuous.`,
      idea: String.raw`Weierstrass’s original argument convolves $f$ with a narrowing Gaussian (an entire function, hence a locally uniform limit of its Taylor polynomials). Bernstein (4.2) gave a constructive proof with a probabilistic flavour, and the Stone–Weierstrass theorem generalizes it. Uniform continuity on the compact interval (the Heine–Cantor theorem) makes the smoothing error uniform, which is why the interval must be closed and bounded; see also pma-7.26.`,
      caption: String.raw`Pick a continuous function and a tolerance $\varepsilon$; the page searches for the smallest degree at which the Chebyshev interpolant (a particular polynomial, not the best one) stays inside the blue band $f\pm\varepsilon$. The right panel shows its sup error against the degree. Choose the *jump* function and the error stalls at $1$ however large the degree — the hypothesis of continuity is really needed.`,
      deps: ['pma-7.26'],
      refs: ['Trefethen ATAP ch. 6'],
      credit: 'Weierstrass, 1885',
      scope: String.raw`Continuous $f$ on a compact interval; the polynomial degree needed may be enormous for rough $f$ (the Weierstrass-type function below needs degree $\sim100$ for $\varepsilon=0.02$).`,
      tags: ['approximation', 'density'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stone%E2%80%93Weierstrass_theorem' },
      viz(v) {
        const FUN = {
          abs: { f: (x) => Math.abs(x - 0.25), name: '$|x-\\tfrac14|$' },
          zig: { f: (x) => { const u = ((3 * x + 3) % 2 + 2) % 2; return 0.5 * Math.abs(u - 1) * 2 - 0.5; }, name: 'zigzag' },
          wei: { f: (x) => { let s = 0; for (let k = 0; k < 4; k++) s += Math.pow(0.5, k) * Math.cos(Math.pow(3, k) * Math.PI * x); return s / 1.5; }, name: 'Weierstrass-type' },
          jump: { f: (x) => (x < 0.1 ? -1 : 1), name: 'jump (not continuous)' },
        };
        const sel = v.select('function', Object.entries(FUN).map(([value, o]) => ({ value, label: o.name })), 'abs');
        const eps = v.slider('tolerance $\\varepsilon$', 0.005, 0.5, 0.1, { log: true, sig: 2 });
        const s = v.stage({ x: [-1, 1], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: 'function, band, polynomial' });
        const e = v.stage({ x: [1, 400], y: [1e-3, 2], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 330, title: 'sup error of the interpolant' });
        const NS = []; for (let n = 1; n <= 400; n = Math.max(n + 1, Math.round(n * 1.1))) NS.push(n);
        const cache = {};
        const errs = (k) => cache[k] || (cache[k] = NS.map((n) => supDiff(FUN[k].f, chebInterp(FUN[k].f, n), 900)));
        let info = {};
        v.legend([['ink', '$f$'], ['accent', 'interpolant $p_n$'], ['blue', 'band $f\\pm\\varepsilon$', { area: true }]]);
        v.render(() => {
          const k = sel.value, f = FUN[k].f, E = errs(k);
          let idx = E.findIndex((x) => x < eps.value);
          const n = idx < 0 ? null : NS[idx];
          const p = n ? chebInterp(f, n) : chebInterp(f, 60);
          s.between((x) => f(x) - eps.value, (x) => f(x) + eps.value, -1, 1, { fill: 'blue', fillAlpha: 0.18 });
          s.fn(f, { color: 'ink', width: 1.4, n: 1200 });
          s.clip(() => s.fn(p, { color: 'accent', width: 2, n: 1200 }));
          e.path(NS.map((m, i) => [m, lgt(E[i])]), { color: 'accent', width: 2 });
          e.hline(eps.value, { color: 'blue', dash: true });
          if (n) e.dot(n, E[idx], { color: 'green', r: 5, label: `n = ${n}`, labelPos: 'ne' });
          info = { n, err: n ? E[idx] : E[E.length - 1], k };
        });
        v.readout(() => info.n
          ? `smallest tested degree with sup error $<\\varepsilon$: $n=${info.n}$ (sup error $${v.fix(info.err, 4)}$)`
          : `no degree up to $400$ reaches $\\varepsilon$: the sup error stalls at $${v.fix(info.err, 3)}$` + (info.k === 'jump' ? ' — a jump of height $2$ forces error $\\ge1$ for every polynomial' : ''));
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Bernstein polynomials',
      statement: String.raw`For $f:[0,1]\to\R$ and $n\ge1$ the **Bernstein polynomial** is
$$B_n f(x)=\sum_{k=0}^n f\!\left(\tfrac kn\right)\binom nk x^k(1-x)^{n-k}.$$
It is the expected value of $f(S_n/n)$ where $S_n\sim\mathrm{Bin}(n,x)$. For continuous $f$, $B_nf\to f$ uniformly (a proof of 4.1). For $f\in C^2$ the convergence is exactly of order $1/n$: $B_nf(x)-f(x)\approx x(1-x)f''(x)/(2n)$.`,
      idea: String.raw`$S_n/n$ concentrates around $x$ with standard deviation $\sqrt{x(1-x)/n}$ (the law of large numbers, Chebyshev’s inequality), so averaging $f$ against it recovers $f(x)$; uniform continuity makes the estimate uniform. A second-order Taylor expansion of $f$ around $x$ gives the leading error $\tfrac12f''(x)\mathrm{Var}(S_n/n)=x(1-x)f''(x)/(2n)$ (Voronovskaya). The averaging is also why the method preserves monotonicity and convexity — and why it is hopelessly slow compared with interpolation.`,
      caption: String.raw`Drag the six gold points to draw a function (or pick a smooth one) and slide the degree $n$; $B_nf$ is drawn in blue. On the right the sup errors for $n=1\ldots400$ appear on log–log axes: Bernstein decays like $1/n$ (even for smooth $f$) while the Chebyshev interpolant of the same degree (green) is far better; the grey line has slope $-1$.`,
      deps: ['num-4.1'],
      refs: ['Trefethen ATAP ch. 6'],
      credit: 'Bernstein, 1912',
      tags: ['approximation', 'bernstein'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bernstein_polynomial' },
      viz(v) {
        const sel = v.select('function', [{ value: 'draw', label: 'drawn' }, { value: 'sin', label: '$\\sin 2\\pi x$' }, { value: 'smooth', label: '$e^{-6(x-.4)^2}$' }], 'draw');
        const nn = v.slider('degree $n$', 1, 400, 12, { int: true, log: true });
        const s = v.stage({ x: [0, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: 'function and $B_nf$' });
        const e = v.stage({ x: [1, 400], y: [1e-6, 3], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 330, title: 'sup error' });
        const X0 = [0, 0.2, 0.4, 0.6, 0.8, 1], Y0 = [0.2, 0.9, -0.4, -1.0, 0.3, 0.6];
        const H = X0.map((x, i) => s.handle(x, Y0[i], { color: 'gold', constrain: 'y', r: 6 }));
        const bern = (f, n, x) => { // stable Bernstein via a running binomial pmf
          const lx = Math.log(Math.max(x, 1e-300)), l1 = Math.log(Math.max(1 - x, 1e-300));
          let lg2 = 0, sum = 0; const lf = [0]; for (let k = 1; k <= n; k++) lf.push(lf[k - 1] + Math.log(k));
          for (let k = 0; k <= n; k++) { lg2 = lf[n] - lf[k] - lf[n - k] + (k ? k * lx : 0) + (n - k ? (n - k) * l1 : 0); sum += f(k / n) * Math.exp(lg2); }
          return sum;
        };
        const NS = []; for (let n = 1; n <= 400; n = Math.max(n + 1, Math.round(n * 1.25))) NS.push(n);
        let info = {};
        v.legend([['ink', '$f$'], ['accent', '$B_nf$ and its error'], ['green', 'Chebyshev interpolant error'], ['muted', 'slope $-1$', { dash: true }]]);
        v.render(() => {
          H.forEach((h) => { h.visible = sel.value === 'draw'; });
          let f;
          if (sel.value === 'draw') { const ys = H.map((h) => h.y); f = (x) => { const t = clamp(x, 0, 1) * 5, i = Math.min(4, Math.floor(t)); return ys[i] + (ys[i + 1] - ys[i]) * (t - i); }; }
          else if (sel.value === 'sin') f = (x) => Math.sin(2 * Math.PI * x);
          else f = (x) => Math.exp(-6 * (x - 0.4) ** 2);
          const grid = linspace(0, 1, 161), n = nn.value;
          s.fn(f, { color: 'ink', width: 1.6, n: 300 });
          s.fn((x) => bern(f, n, x), { color: 'accent', width: 2.4, n: 160 });
          const fm = (x) => f((x + 1) / 2);
          const eb = NS.map((m) => Math.max(...grid.map((x) => Math.abs(f(x) - bern(f, m, x)))));
          const ec = NS.filter((m) => m <= 200).map((m) => { const p = chebInterp(fm, m); return Math.max(...grid.map((x) => Math.abs(f(x) - p(2 * x - 1)))); });
          e.path(NS.map((m, i) => [m, lgt(eb[i])]), { color: 'accent', width: 2 });
          e.path(NS.filter((m) => m <= 200).map((m, i) => [m, lgt(ec[i])]), { color: 'green', width: 2 });
          e.path([[1, 1.5], [400, 1.5 / 400]], { color: 'muted', dash: true });
          const cur = Math.max(...grid.map((x) => Math.abs(f(x) - bern(f, n, x))));
          e.vline(n, { color: 'gold', alpha: 0.6 });
          e.dot(n, lgt(cur), { color: 'gold', r: 4 });
          info = { n, cur, slope: Math.log(eb[NS.length - 1] / eb[NS.length - 6]) / Math.log(NS[NS.length - 1] / NS[NS.length - 6]) };
        });
        v.readout(() => `$n=${info.n}$: $\\|f-B_nf\\|_\\infty=${v.fix(info.cur, 4)}$; log–log slope of the Bernstein error over the last decade $\\approx${v.fix(info.slope, 2)}$` + (sel.value === 'draw' ? ' (kinks make it slower, $\\sim n^{-1/2}$)' : ' (expected $-1$)'));
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Convergence for differentiable functions',
      statement: String.raw`Let $f=\sum a_kT_k$ be the Chebyshev series on $[-1,1]$. If $f,f',\dots,f^{(\nu-1)}$ are absolutely continuous and $f^{(\nu)}$ has bounded variation $V$, then $|a_k|\le \dfrac{2V}{\pi k(k-1)\cdots(k-\nu)}=O(k^{-\nu-1})$, the best polynomial approximation error satisfies $E_n(f)=O(n^{-\nu})$, and so does the error of the degree-$n$ Chebyshev interpolant. For instance $|x|^\alpha$ has $\nu\approx\alpha$ and coefficients decaying like $k^{-\alpha-1}$. The rate is algebraic, no better in general.`,
      idea: String.raw`Write $a_k=\frac2\pi\int_0^\pi f(\cos\theta)\cos k\theta\,d\theta$ and integrate by parts $\nu+1$ times; each pass gains a factor $1/k$ until the last derivative, which is only of bounded variation. The error of the truncated series is controlled by the tail $\sum_{k>n}|a_k|$, and the interpolant differs from the truncation only by aliasing of those same tails (3.16), costing at most a constant factor. See 3.7 for the Chebyshev polynomials.`,
      caption: String.raw`Left: Chebyshev coefficients $|a_k|$ of $|x|^\alpha$ (move $\alpha$), of a $C^\infty$ bump and of $1/(1+4x^2)$ on log–log axes; the grey line is the predicted slope $-(\alpha+1)$. Right: the sup error of the degree-$n$ interpolant, slope $-\alpha$. The bump is infinitely differentiable but its coefficients bend below every straight line (they decay like $e^{-c\sqrt k}$).`,
      deps: ['num-3.7', 'num-4.1'],
      refs: ['Trefethen ATAP ch. 7'],
      credit: 'Jackson, 1911; Bernstein, 1912',
      scope: String.raw`Constants depend on $V$; the smooth-but-not-analytic bump shows that "infinitely differentiable" gives faster-than-algebraic but still sub-geometric convergence.`,
      tags: ['approximation', 'chebyshev', 'smoothness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jackson%27s_inequality' },
      viz(v) {
        const kind = v.select('function', [{ value: 'pow', label: '$|x|^\\alpha$' }, { value: 'bump', label: 'bump $e^{-1/(1-x^2)}$' }, { value: 'an', label: '$1/(1+4x^2)$' }], 'pow');
        const al = v.slider('$\\alpha$', 0.5, 7, 3, { step: 0.5 });
        const a = v.stage({ x: [1, 300], y: [1e-12, 3], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'k', height: 340, title: 'Chebyshev coefficients $|a_k|$' });
        const b = v.stage({ x: [1, 100], y: [1e-12, 3], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 340, title: 'sup error of the interpolant' });
        const cache = {};
        let info = {};
        v.legend([['accent', 'coefficients / error'], ['muted', 'predicted slope', { dash: true }]]);
        const FN = { pow: (al) => (x) => Math.pow(Math.abs(x), al), bump: () => (x) => (Math.abs(x) >= 1 ? 0 : Math.exp(-1 / (1 - x * x))), an: () => (x) => 1 / (1 + 4 * x * x) };
        v.render(() => {
          const key = kind.value + (kind.value === 'pow' ? al.value : '');
          al.el.hidden = kind.value !== 'pow';
          if (!cache[key]) {
            const f = FN[kind.value](al.value), c = chebCoef(f, 700);
            const NS = []; for (let n = 2; n <= 100; n = Math.max(n + 1, Math.round(n * 1.12))) NS.push(n);
            cache[key] = { c, NS, err: NS.map((n) => supDiff(f, chebInterp(f, n), 1500)) };
          }
          const { c, NS, err } = cache[key];
          const pts = []; for (let k = 1; k <= 300; k++) pts.push([k, lgt(Math.abs(c[k]))]);
          a.dots(pts.filter((p) => p[1] > FLOOR * 2), { color: 'accent', r: 2 });
          b.path(NS.map((n, i) => [n, lgt(err[i])]), { color: 'accent', width: 2 });
          // fitted slope on even k in [12, 150] (or all k) of envelope
          let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
          for (let k = 12; k <= 150; k++) { const env = Math.max(Math.abs(c[k]), Math.abs(c[k + 1] || 0)); if (env < 1e-15) continue; const x = Math.log(k), y = Math.log(env); sx += x; sy += y; sxx += x * x; sxy += x * y; m++; }
          const slope = m > 5 ? (m * sxy - sx * sy) / (m * sxx - sx * sx) : NaN;
          let sx2 = 0, sy2 = 0, sxx2 = 0, sxy2 = 0, m2 = 0;
          NS.forEach((n, i) => { if (n >= 8 && err[i] > 1e-13) { const x = Math.log(n), y = Math.log(err[i]); sx2 += x; sy2 += y; sxx2 += x * x; sxy2 += x * y; m2++; } });
          const slope2 = m2 > 3 ? (m2 * sxy2 - sx2 * sy2) / (m2 * sxx2 - sx2 * sx2) : NaN;
          if (kind.value === 'pow') {
            const A = al.value; const c0 = Math.abs(c[40]) || 1e-3;
            a.path([[10, c0 * Math.pow(10 / 40, -(A + 1))], [300, c0 * Math.pow(300 / 40, -(A + 1))]], { color: 'muted', dash: true });
            const e0 = err[NS.findIndex((n) => n >= 20)] || 1e-2;
            b.path([[10, e0 * Math.pow(10 / 20, -A)], [100, e0 * Math.pow(100 / 20, -A)]], { color: 'muted', dash: true });
          }
          info = { slope, slope2, A: al.value, kind: kind.value };
        });
        v.readout(() => info.kind === 'pow'
          ? `$f=|x|^{${info.A}}$: fitted slope of $|a_k|$: $${v.fix(info.slope, 2)}$ (theory $-(\\alpha+1)=${v.fix(-(info.A + 1), 1)}$); interpolation error slope $${v.fix(info.slope2, 2)}$ (theory $-\\alpha$)` + (info.A % 2 === 0 ? '\n$\\alpha$ is an even integer: $f$ is a polynomial and the coefficients vanish (floor $10^{-17}$)' : '')
          : info.kind === 'bump' ? `$C^\\infty$ bump: the log–log slope is not constant (local fit $${v.fix(info.slope, 1)}$ and steepening) — faster than every power, slower than geometric`
            : `analytic function: the log–log plot drops ever more steeply — geometric decay (see 4.4)`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Geometric convergence for analytic functions',
      statement: String.raw`The **Bernstein ellipse** $E_\rho$ ($\rho>1$) is the ellipse in $\C$ with foci $\pm1$ and semi-axes summing to $\rho$, i.e. the image of the circle $|z|=\rho$ under $z\mapsto\frac12(z+z^{-1})$. If $f$ is analytic in the open ellipse $E_\rho$ and $|f|\le M$ there, then $|a_k|\le2M\rho^{-k}$, the best approximation error is $E_n(f)\le \dfrac{2M\rho^{-n}}{\rho-1}$ and the Chebyshev interpolant satisfies $\|f-p_n\|\le\dfrac{4M\rho^{-n}}{\rho-1}$. The largest usable $\rho$ is set by the singularity of $f$ nearest to $[-1,1]$ in the sense of these ellipses.`,
      idea: String.raw`With $x=\frac12(z+z^{-1})$ the Chebyshev coefficients become Laurent coefficients of $f(\tfrac12(z+z^{-1}))$, which is analytic in the annulus $\rho^{-1}<|z|<\rho$; Cauchy’s estimate on $|z|=\rho$ gives $|a_k|\le2M\rho^{-k}$ (contour integral, as in 3.13). Summing the geometric tail bounds the truncation error, and the interpolant adds an aliasing term of the same size. The ellipse, not a disc, is the natural region because Chebyshev points are the projection of equispaced points on a circle.`,
      caption: String.raw`Drag the pole $p$ (its conjugate is the mirror image); the Bernstein ellipse through it is drawn and $\rho=|p+\sqrt{p^2-1}|$ is read off. Right: the Chebyshev coefficients and interpolation error on a semilog scale follow $\rho^{-n}$ (grey). Move the pole toward the interval and the ellipse shrinks; with the entire function $e^{x}$ nothing limits $\rho$ and the decay is superexponential.`,
      deps: ['num-4.3', 'num-3.13'],
      refs: ['Trefethen ATAP ch. 8'],
      credit: 'Bernstein, 1912–1914',
      scope: String.raw`Analyticity in a Bernstein ellipse; the constants $M$ blow up as $\rho$ approaches the distance to the nearest singularity.`,
      tags: ['approximation', 'analytic', 'ellipse'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bernstein_inequality_(mathematical_analysis)' },
      viz(v) {
        const kind = v.select('function', [{ value: 'pole', label: 'poles at $p,\\bar p$' }, { value: 'ent', label: 'entire: $e^{x}$' }], 'pole');
        const s = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, axes: true, height: 340, title: 'complex plane', full: false });
        const e = v.stage({ x: [0, 60], y: [1e-14, 20], ylog: true, axes: 'box', gutter: true, xlabel: 'n', height: 340, title: '$|a_n|$ and interpolation error' });
        const P = s.handle(0.9, 0.7, { color: 'red', r: 7, constrain: { x: [-2.9, 2.9], y: [0.04, 2.1] }, label: 'p', labelPos: 'ne' });
        const rho = (px, py) => { // |z + sqrt(z^2-1)| with the root of modulus > 1
          const re = px * px - py * py - 1, im = 2 * px * py, r = Math.hypot(re, im), sr = Math.sqrt((r + re) / 2), si = (im < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (r - re) / 2));
          return Math.max(Math.hypot(px + sr, py + si), Math.hypot(px - sr, py - si));
        };
        let info = {};
        v.legend([['accent', '$|a_n|$ (envelope)'], ['green', 'interpolation error'], ['muted', '$\\rho^{-n}$', { dash: true }]]);
        v.render(() => {
          P.visible = kind.value === 'pole';
          s.hline(0, { color: 'faint' }); s.segment([-1, 0], [1, 0], { color: 'ink', width: 3 });
          let f, r = Infinity;
          if (kind.value === 'pole') {
            const px = P.x, py = P.y; r = rho(px, py);
            f = (x) => { const d1 = (x - px) ** 2 + py * py; return 2 * (x - px) / d1; };
            for (const q of [1.5, 2, 3, 5]) if (q < r) s.curve((t) => [0.5 * (q + 1 / q) * Math.cos(t), 0.5 * (q - 1 / q) * Math.sin(t)], 0, 2 * Math.PI, { color: 'faint', width: 1 });
            s.curve((t) => [0.5 * (r + 1 / r) * Math.cos(t), 0.5 * (r - 1 / r) * Math.sin(t)], 0, 2 * Math.PI, { color: 'orange', width: 2.2 });
            s.dot(px, py, { color: 'red', r: 5 }); s.dot(px, -py, { color: 'red', r: 5 });
          } else f = Math.exp;
          const c = chebCoef(f, 400);
          const pts = []; for (let k = 0; k <= 60; k++) { const env = Math.max(Math.abs(c[k]), Math.abs(c[k + 1] || 0), Math.abs(c[k + 2] || 0)); pts.push([k, lgt(env)]); }
          e.path(pts, { color: 'accent', width: 2 });
          const NS = []; for (let n = 1; n <= 60; n += 1) NS.push(n);
          const err = NS.map((n) => supDiff(f, chebInterp(f, n), 700));
          e.path(NS.map((n, i) => [n, lgt(err[i])]), { color: 'green', width: 2 });
          if (r < 1e6) { const c0 = pts[15][1] * Math.pow(r, 15); e.path([[0, c0], [60, c0 * Math.pow(r, -60)]], { color: 'muted', dash: true }); }
          let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
          for (let k = 8; k <= 40; k++) { if (pts[k][1] < 1e-13) continue; sx += k; sy += Math.log(pts[k][1]); sxx += k * k; sxy += k * Math.log(pts[k][1]); m++; }
          info = { r, fit: m > 5 ? Math.exp(-(m * sxy - sx * sy) / (m * sxx - sx * sx)) : NaN };
        });
        v.readout(() => kind.value === 'pole'
          ? `$\\rho=${v.fix(info.r, 4)}$; measured decay factor per degree (from the coefficients) $\\approx${v.fix(info.fit, 4)}$. Each extra degree gains $\\log_{10}\\rho=${v.fix(Math.log10(info.r), 3)}$ digits.`
          : `entire function: no pole limits $\\rho$; the coefficients $\\sim1/(2^{n-1}n!)$ fall faster than any geometric rate until rounding (about $10^{-16}$).`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Phenomenon',
      name: 'Gibbs phenomenon for polynomial approximation',
      statement: String.raw`Let $f$ have a jump discontinuity in the interior of $[-1,1]$ and be smooth elsewhere. Neither a truncated Chebyshev series nor a Chebyshev interpolant can converge uniformly to this discontinuous $f$. The series has a limiting overshoot near the jump of $\frac1\pi\int_0^\pi\frac{\sin t}t\,dt-\frac12\approx0.0895$ of the jump (about $9\%$), in a region narrowing like $1/n$; away from the jump the series converges pointwise. Interpolation also exhibits persistent ringing, whose amplitude depends on how the jump lies relative to its nodes. For a smooth step ($\tanh$) the overshoot dies out once $n$ resolves the transition.`,
      idea: String.raw`With $x=\cos\theta$ the Chebyshev series of $f$ is the cosine (Fourier) series of $f(\cos\theta)$, which has a jump at $\theta_0=\arccos x_0$; near the jump the partial sums behave like the Fourier partial sums of a step, i.e. the sine integral $\mathrm{Si}$, whose maximum $\mathrm{Si}(\pi)$ gives the 9%. Convergence in sup norm fails because the limit is discontinuous (4.1), so some defect must stay; Gibbs shows what it looks like. For $\operatorname{sign}(x)$, the interpolation limit depends on parity and the value assigned at the jump: ATAP reports amplitudes about $1.28228$ for odd $n$ and $1.06578$ for even $n$ with $f(0)=0$, i.e. about $14.11\%$ and $3.29\%$ of the height-two jump. A shifted jump need not have a single limiting interpolation overshoot as its location moves relative to the nodes.`,
      caption: String.raw`Choose the step and slide the degree $n$. Top: $p_n$ and a zoom on the jump (windows shrink like $1/n$) with the lines $1$ and $1.179$ ($=1+2\cdot0.0895$ for a unit step of height $2$). Right: sampled overshoot as a fraction of height $2$. The interpolant is split into even and odd degrees: the centered jump has different parity limits; the shifted jump also depends on its position between nodes. Negative values are clipped to zero (no measured overshoot).`,
      deps: ['num-4.3', 'sig-4.4'],
      refs: ['Trefethen ATAP ch. 9, Theorems 9.1–9.2'],
      credit: 'Wilbraham, 1848; Gibbs, 1898–99',
      scope: String.raw`The 8.95% constant is the limiting partial-sum overshoot, not a universal interpolation constant. ATAP Theorem 9.1 states the centered interpolation parity limits while explicitly noting the incomplete published proof history. The smooth tanh example has no jump: height 2 is only a comparison scale.`,
      tags: ['approximation', 'gibbs', 'discontinuity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs_phenomenon' },
      viz(v) {
        const kind = v.select('function', [{ value: 'c0', label: 'sign$(x)$' }, { value: 'c4', label: 'sign$(x-0.4)$' }, { value: 'tanh', label: '$\\tanh(40x)$ (smooth)' }], 'c0');
        const nn = v.slider('degree $n$', 4, 200, 30, { int: true });
        const s = v.stage({ x: [-1, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$f$ and $p_n$' });
        const z = v.stage({ x: [-0.3, 0.3], y: [0.7, 1.35], axes: 'box', gutter: true, xlabel: 'x − jump', height: 300, title: 'zoom at the jump' });
        const g = v.stage({ x: [4, 200], y: [0, 0.2], xlog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 300, title: 'overshoot / jump height' });
        const th = (c) => Math.acos(c);
        const cache = {};
        const spec = (k) => {
          const c0 = k === 'c4' ? 0.4 : 0;
          if (k === 'tanh') { const f = (x) => Math.tanh(40 * x); return { f, c: chebCoef(f, 1200), c0 }; }
          const t0 = th(c0), a = [(2 * t0 - Math.PI) / Math.PI]; for (let j = 1; j <= 400; j++) a.push(4 * Math.sin(j * t0) / (Math.PI * j));
          const f = (x) => (x > c0 ? 1 : x < c0 ? -1 : 0);
          return { f, c: a, c0 };
        };
        const over = (S, n) => { let m = -9; for (let i = 0; i <= 1200; i++) { const x = S.c0 + (i / 1200 - 0.02) * Math.min(0.9, 14 / n) * 1; if (x < -1 || x > 1) continue; const val = S.ser(n, x); m = Math.max(m, val); } return Math.max(0, (m - 1) / 2); };
        let info = {};
        v.legend([['ink', '$f$'], ['accent', 'interpolant $p_n$'], ['orange', 'truncated series $S_n$'], ['purple', 'interpolant, even degree']]);
        v.render(() => {
          const k = kind.value;
          const S = cache[k] || (cache[k] = spec(k));
          S.ser = (n, x) => clenshaw(S.c, x, n);
          const n = nn.value, pI = k === 'tanh' ? chebInterp(S.f, n) : stepChebInterp(S.c0, n);
          const stepPt = S.c0;
          s.fn(S.f, { color: 'ink', width: 1.2, n: 600 });
          s.clip(() => s.fn(pI, { color: 'accent', width: 1.8, n: 800 }));
          z.setView([-Math.min(0.3, 9 / n), Math.min(0.3, 9 / n)], [0.7, 1.35]);
          z.clip(() => { z.fn((x) => S.f(stepPt + x), { color: 'ink', width: 1.2, n: 800 });
          z.fn((x) => S.ser(n, stepPt + x), { color: 'orange', width: 1.6, n: 800 });
          z.fn((x) => pI(stepPt + x), { color: 'accent', width: 1.8, n: 800 });
          });
          z.hline(1, { color: 'faint' }); z.hline(1.179, { color: 'green', dash: true });
          if (!S.curve) {
            S.curve = [];
            for (let m = 4; m <= 200; m = Math.max(m + 2, Math.round(m * 1.2))) {
              const pm = k === 'tanh' ? chebInterp(S.f, m) : stepChebInterp(S.c0, m); let mi = -9; for (let i = 0; i <= 1500; i++) { const x = S.c0 + (i / 1500 - 0.02) * Math.min(0.9, 14 / m); if (x > -1 && x < 1) mi = Math.max(mi, pm(x)); }
              S.curve.push([m, over(S, m), Math.max(0, (mi - 1) / 2)]);
            }
          }
          g.path(S.curve.map((r) => [r[0], r[1]]), { color: 'orange', width: 2 });
          for (const parity of [0,1]) g.path(S.curve.filter(r => r[0]%2===parity).map(r=>[r[0],r[2]]), {color: parity ? 'accent' : 'purple', width:2});
          g.hline(0.0895, { color: 'green', dash: true });
          g.vline(n, { color: 'gold', alpha: 0.6 });
          let mi = -9; for (let i = 0; i <= 2000; i++) { const x = S.c0 + (i / 2000 - 0.02) * Math.min(0.9, 14 / n); if (x > -1 && x < 1) mi = Math.max(mi, pI(x)); }
          info = { ov: over(S, n), ovI: Math.max(0, (mi - 1) / 2), n, k };
        });
        v.readout(() => `$n=${info.n}$: overshoot above the upper plateau — truncated series $${v.fix(100 * info.ov, 2)}\\%$ of the jump, interpolant $${v.fix(100 * info.ovI, 2)}\\%$; the classical value for the series is $8.95\\%$` + (info.k === 'tanh' ? '\nSmooth tanh: height 2 is a comparison scale, not a jump; the overshoot tends to zero when resolved.' : info.k === 'c0' ? `\nCentered step, ${info.n%2 ? 'odd' : 'even'} degree: interpolation limit is about ${info.n%2 ? '14.11' : '3.29'}% (midpoint value zero).` : '\nShifted jump: interpolation overshoot depends on the jump position relative to the nodes.'));
      },
    },
  ],
};
