// Rudin, Real and Complex Analysis — Chapter 8 (part 3): convolutions and distribution functions

// ---------------------------------------------------------------- helpers
/** Composite 3-point Gauss–Legendre rule on [a,b] with n panels (never evaluates the endpoints). */
const GX = [-Math.sqrt(0.6), 0, Math.sqrt(0.6)], GW = [5 / 9, 8 / 9, 5 / 9];
function gauss(F, a, b, n = 12) {
  if (!(b > a)) return 0;
  const h = (b - a) / n; let s = 0;
  for (let i = 0; i < n; i++) { const c = a + (i + 0.5) * h; for (let k = 0; k < 3; k++) s += GW[k] * F(c + 0.5 * h * GX[k]); }
  return 0.5 * h * s;
}
/**
 * ∫_A^B F(y) dy for a piecewise-smooth F whose kinks, jumps and integrable |y − c|^{-1/2}
 * singularities lie in `breaks`. Each piece is split in two and integrated with the substitution
 * y = a + s² (resp. y = b − s²), which removes inverse-square-root singularities at the ends.
 */
function pieceInt(F, A, B, breaks = [], n = 10) {
  const pts = [A, ...breaks.filter((c) => c > A && c < B), B].sort((p, q) => p - q);
  let tot = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1]; if (b - a < 1e-12) continue;
    const m = (a + b) / 2;
    tot += gauss((s) => 2 * s * F(a + s * s), 0, Math.sqrt(m - a), n);
    tot += gauss((s) => 2 * s * F(b - s * s), 0, Math.sqrt(b - m), n);
  }
  return tot;
}
const box = (a, b, hgt = 1) => (t) => (t >= a && t <= b ? hgt : 0);

export default {
  collection: 'rca',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ convolutions
    {
      num: '8.13',
      kind: 'Definition',
      name: 'Convolution on the line',
      statement: String.raw`For measurable functions $f$ and $g$ on $\R$ (Lebesgue measure $m$), the **convolution** $f*g$ is
$$(f*g)(x)=\int_{-\infty}^{\infty}f(x-y)\,g(y)\,dy$$
at every $x$ for which $\int|f(x-y)g(y)|\,dy<\infty$. The substitution $y\mapsto x-y$ shows that $f*g=g*f$ wherever either side is defined.`,
      idea: String.raw`To compute $(f*g)(x)$, reflect $f$, slide the reflected copy so that its origin sits at $x$, multiply by $g$, and take the area. So $f*g$ is a moving weighted average of $g$ with weights given by $f$, which is why convolution smooths: a box convolved with a box is a tent, and a jump convolved with a narrow bump becomes a smooth ramp. For measurability one replaces $f,g$ by Borel functions equal to them a.e.; then $(x,y)\mapsto f(x-y)g(y)$ is Borel on $\R^2$ and the Fubini theorem can be applied, as in 8.14.`,
      caption: String.raw`Top: $g(y)$ (blue), the reflected and shifted copy $y\mapsto f(x-y)$ (orange), and their product (green), whose area is $(f*g)(x)$. Bottom: the graph of $f*g$, traced as $x$ moves. Play the animation or pause and drag $x$. The second example shows the reflection (a one-sided $f$ appears backwards); the third shows smoothing — a ragged step function convolved with a narrow bump.`,
      deps: ['rca-2.20', 'rca-1.30'],
      see: ['fa-6.30'],
      tags: ['convolution'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Sections 8.13–8.14, pp. 170–171'],
      viz(v) {
        const M = v.M;
        const ragged = (t) => (t < -1.4 || t > 1.4 ? 0 : t < -0.7 ? 0.5 : t < -0.2 ? 1 : t < 0.15 ? 0.3 : t < 0.6 ? 1.1 : t < 1 ? 0.65 : 0.2);
        const PAIRS = {
          box: { label: 'box $*$ box', f: box(-0.5, 0.5), g: box(-0.8, 0.8, 0.8), fb: [-0.5, 0.5], gb: [-0.8, 0.8] },
          flip: { label: 'one-sided $*$ box', f: (t) => (t >= 0 && t <= 1.6 ? 2 * Math.exp(-2 * t) : 0), g: box(-0.6, 0.6, 0.8), fb: [0, 1.6], gb: [-0.6, 0.6] },
          smooth: { label: 'bump $*$ ragged', f: (t) => Math.exp(-((t / 0.16) ** 2) / 2) / (0.16 * Math.sqrt(2 * Math.PI)), g: ragged, fb: [-0.8, 0.8], gb: [-1.4, -0.7, -0.2, 0.15, 0.6, 1, 1.4] },
        };
        const which = v.select('', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'flip');
        const T = v.stage({ x: [-3, 3], y: [-0.15, 2.2], height: 250, full: true, xlabel: 'y', title: '$g(y)$, $f(x-y)$ and the product $f(x-y)\\,g(y)$' });
        const B = v.stage({ x: [-3, 3], y: [-0.15, 1], height: 190, full: true, xlabel: 'x', title: '$(f*g)(x)$' });
        const xh = B.handle(-1.5, 0, { color: 'gold', label: 'x', constrain: (x) => [M.clamp(x, -2.9, 2.9), 0] });
        xh.onDrag = () => v.pause();
        let cache = { key: null }, st = {};
        const conv = (P, x) => { const br = [...P.gb, ...P.fb.map((c) => x - c)]; return pieceInt((y) => P.f(x - y) * P.g(y), -3.5, 3.5, br, 6); };
        v.animate((t) => {
          const key = which.value, P = PAIRS[key];
          if (cache.key !== key) {
            const xs = M.linspace(-3, 3, 361), hs = xs.map((x) => conv(P, x));
            const fmax = Math.max(...M.linspace(-3, 3, 600).map(P.f)), gmax = Math.max(...M.linspace(-3, 3, 600).map(P.g));
            const us = M.linspace(-3, 3, 600);
            cache = { key, xs, hs, top: Math.max(fmax, gmax), hmax: Math.max(...hs), fArg: us[M.argmax(us.map(P.f))] };
            T.setView(null, [-0.12 * cache.top, cache.top * 1.15]); B.setView(null, [-0.15 * cache.hmax, cache.hmax * 1.25]);
          }
          if (v.playing) xh.x = -2.9 + 5.8 * (((t + 4) % 9) / 9);
          const x = xh.x, C = cache;
          // top panel
          T.fn(P.g, { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.1, n: 1200 });
          T.fn((y) => P.f(x - y) * P.g(y), { color: 'green', width: 1.5, fill: 'green', fillAlpha: 0.35, n: 1200 });
          T.fn((y) => P.f(x - y), { color: 'orange', width: 2.4, n: 1200 });
          T.vline(x, { color: 'gold', width: 1.2, dash: [4, 4] });
          const g0 = P.gb[0] + 0.02;
          T.tex('g', g0, P.g(g0), { color: 'blue', align: 'right', baseline: 'bottom', dx: -5, dy: -2 });
          const u = C.fArg; T.tex('f(x-y)', x - u, P.f(u), { color: 'orange', align: 'right', baseline: 'bottom', dx: -8, dy: -4, size: 14 });
          // bottom panel
          B.path(C.xs.map((s, i) => [s, C.hs[i]]), { color: 'faint', width: 2 });
          const k = C.xs.findIndex((s) => s > x);
          const upto = C.xs.slice(0, k < 0 ? C.xs.length : k).map((s, i) => [s, C.hs[i]]);
          const hx = conv(P, x);
          B.path([...upto, [x, hx]], { color: 'green', width: 2.6 });
          B.vline(x, { color: 'gold', width: 1.2, dash: [4, 4] });
          B.dot(x, hx, { color: 'green', r: 5 });
          st = { x, hx };
        }, { period: 9 });
        v.legend([['blue', '$g(y)$'], ['orange', '$f(x-y)$'], ['green', 'product; its area is $(f*g)(x)$', { area: true }]]);
        v.readout(() => `$x=${v.fix(st.x ?? 0, 2)}$: $\\;(f*g)(x)=\\int f(x-y)\\,g(y)\\,dy=${v.fix(st.hx ?? 0, 4)}$ — the green area in the top panel.`);
      },
    },
    {
      num: '8.14',
      kind: 'Theorem',
      name: 'Convolution of L¹ functions',
      statement: String.raw`Suppose $f\in L^1(\R)$ and $g\in L^1(\R)$. Then $\int_{-\infty}^\infty|f(x-y)g(y)|\,dy<\infty$ for almost every $x$. For these $x$ put
$$h(x)=\int_{-\infty}^\infty f(x-y)\,g(y)\,dy .$$
Then $h\in L^1(\R)$ and $\|h\|_1\le\|f\|_1\,\|g\|_1$, where $\|f\|_1=\int|f(x)|\,dx$. This $h$ is the convolution $f*g$.`,
      idea: String.raw`Choose Borel functions equal to $f$ and $g$ a.e.; then $F(x,y)=f(x-y)g(y)$ is Borel on $\R^2$. Integrate $|F|$ over $x$ first: by translation invariance of Lebesgue measure, $\int|f(x-y)|\,dx=\|f\|_1$ for every $y$, so $\iint|F|=\|f\|_1\|g\|_1<\infty$ (Fubini 8.8(a)). Integrating in the other order, the inner integral $\int|F(x,y)|\,dy$ must then be finite for a.e. $x$, and $|h(x)|\le\int|F(x,y)|\,dy$ integrates to at most $\|f\|_1\|g\|_1$. Equality holds when $f,g\ge0$.`,
      caption: String.raw`The heat map is $F(x,y)=f(x-y)\,g(y)$ on the plane (red $>0$, blue $<0$); its support is a sheared strip. Drag the gold point. Below: $h(x)=\int F(x,y)\,dy=(f*g)(x)$ (green) and $\int|F(x,y)|\,dy$ (dashed). Right: $\int|F(x,y)|\,dx=\|f\|_1|g(y)|$. Both marginals of $|F|$ have total area $\|f\|_1\|g\|_1$. With signs, cancellation makes $\|f*g\|_1$ strictly smaller; with $f=g=|t|^{-1/2}$ near $0$ the convolution is infinite at $x=0$ — finite only almost everywhere.`,
      deps: ['rca-8.13', 'rca-8.8', 'rca-8.11', 'rca-2.20'],
      see: ['rca-9.2', 'fa-6.30'],
      tags: ['convolution', 'Fubini', 'L¹'],
      viz(v) {
        const M = v.M;
        const sq = (t) => (Math.abs(t) < 1 && t !== 0 ? 0.25 / Math.sqrt(Math.abs(t)) : 0);
        const PAIRS = {
          pos: { label: '$f,g\\ge0$', f: (t) => Math.max(0, 1 - Math.abs(t)), g: box(-1.2, 0.9, 0.6), fb: [-1, 0, 1], gb: [-1.2, 0.9] },
          sgn: { label: 'signed $f$', f: (t) => (Math.abs(t) < 1 ? 1.3 * Math.sin(3.2 * t) * (1 - t * t) : 0), g: (t) => (t > -1.2 && t < 1.2 ? 0.6 + 0.25 * Math.sin(2 * t) : 0), fb: [-1, 1], gb: [-1.2, 1.2] },
          sing: { label: '$f=g=\\tfrac14|t|^{-1/2}\\chi_{(-1,1)}$', f: sq, g: sq, fb: [-1, 0, 1], gb: [-1, 0, 1] },
        };
        const which = v.select('', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'sgn');
        const L = 2.5, PY0 = -4.4, PH = 1.5, PX0 = 2.85, PW = 1.5;
        const S = v.stage({ x: [-2.75, 4.5], y: [-4.55, 2.7], equal: true, height: 540, axes: false });
        const gh = S.handle(0.6, 0.35, { color: 'gold', constrain: { x: [-L, L], y: [-L, L] } });
        let cache = { key: null }, st = {};
        function prepare(key) {
          const P = PAIRS[key];
          const xs = M.linspace(-L, L, 251);
          const brY = (x) => [...P.gb, ...P.fb.map((c) => x - c)];
          const h = xs.map((x) => pieceInt((y) => P.f(x - y) * P.g(y), -L - 0.5, L + 0.5, brY(x)));
          const ha = xs.map((x) => pieceInt((y) => Math.abs(P.f(x - y) * P.g(y)), -L - 0.5, L + 0.5, brY(x)));
          const gx = xs.map((y) => pieceInt((x) => Math.abs(P.f(x - y) * P.g(y)), -L - 0.5, L + 0.5, P.fb.map((c) => y + c)));
          if (key === 'sing') xs.forEach((x, i) => { if (Math.abs(x) < 1e-9) h[i] = ha[i] = Infinity; });
          const nf = pieceInt((t) => Math.abs(P.f(t)), -3, 3, P.fb), ng = pieceInt((t) => Math.abs(P.g(t)), -3, 3, P.gb);
          // ‖h‖₁ by the trapezoid rule on the grid (the log singularity of the last example is integrable)
          let nh = 0; for (let i = 0; i + 1 < xs.length; i++) { const a = Math.abs(h[i]), b = Math.abs(h[i + 1]); nh += (isFinite(a) && isFinite(b) ? 0.5 * (a + b) : isFinite(a) ? a : b) * (xs[i + 1] - xs[i]); }
          const finite = (a) => a.filter((z) => isFinite(z));
          const top = Math.max(...finite(ha), ...finite(gx)) * 1.05;
          let Fmax = 0; for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) { const z = Math.abs(P.f(-L + (5 * i) / 59 - (-L + (5 * j) / 59)) * P.g(-L + (5 * j) / 59)); if (isFinite(z)) Fmax = Math.max(Fmax, z); }
          return { key, xs, h, ha, gx, nf, ng, nh, top: key === 'sing' ? 1.6 : top, Fmax: key === 'sing' ? 0.25 : Fmax };
        }
        v.render(() => {
          const key = which.value, P = PAIRS[key];
          if (cache.key !== key) cache = prepare(key);
          const C = cache;
          S.raster((x, y) => {
            if (Math.abs(x) > L || Math.abs(y) > L) return null;
            const z = P.f(x - y) * P.g(y);
            if (!z) return v.rgb('panel');
            return M.cmap(0.5 + 0.5 * Math.max(-1, Math.min(1, z / C.Fmax)), 'diverging');
          }, { key: key + v.rgb('panel'), res: 2 });
          S.rect(-L, -L, L, L, { color: 'faint', width: 1.2 });
          S.text('x', L + 0.05, -L, { size: 14, color: 'muted', math: true, align: 'left' });
          S.text('y', -L, L + 0.06, { size: 14, color: 'muted', math: true, align: 'center', baseline: 'bottom' });
          // bottom marginal: h and ∫|F| dy
          const k = PH * (key === 'sgn' ? 0.5 : 0.85) / C.top, by = key === 'sgn' ? PY0 + PH * 0.42 : PY0 + 0.05;
          S.line(-L, by, L, by, { color: 'muted', width: 1 });
          const clip = (z) => Math.max(PY0 - 0.1, Math.min(PY0 + PH + 0.1, z));
          S.path(C.xs.map((x, i) => [x, clip(by + k * C.ha[i])]), { color: 'ink', width: 1.4, dash: [5, 4] });
          S.path([[-L, by], ...C.xs.map((x, i) => [x, clip(by + k * C.h[i])]), [L, by]], { fill: 'green', fillAlpha: 0.22, stroke: false, close: true });
          S.path(C.xs.map((x, i) => [x, clip(by + k * C.h[i])]), { color: 'green', width: 2.2 });
          S.tex('h=f*g', -L, PY0 + PH + 0.05, { color: 'green', align: 'left', baseline: 'bottom', size: 13 });
          // right marginal: ∫|F| dx = ‖f‖₁ |g(y)|
          S.line(PX0, -L, PX0, L, { color: 'muted', width: 1 });
          S.path([[PX0, -L], ...C.xs.map((y, i) => [PX0 + Math.min(PW, k * C.gx[i]), y]), [PX0, L]], { fill: 'orange', fillAlpha: 0.22, stroke: false, close: true });
          S.path(C.xs.map((y, i) => [PX0 + Math.min(PW, k * C.gx[i]), y]), { color: 'orange', width: 2 });
          S.tex('\\int|F|\\,dx=\\|f\\|_1|g(y)|', PX0, -L - 0.1, { color: 'orange', align: 'left', baseline: 'top', size: 12 });
          // crosshair
          const x = gh.x, y = gh.y;
          S.line(x, PY0, x, L, { color: 'green', width: 1.1, dash: [4, 4] });
          S.line(-L, y, PX0 + PW, y, { color: 'orange', width: 1.1, dash: [4, 4] });
          const hx = pieceInt((s) => P.f(x - s) * P.g(s), -L - 0.5, L + 0.5, [...P.gb, ...P.fb.map((c) => x - c)]);
          const gy = Math.abs(P.g(y)) * C.nf;
          if (isFinite(hx)) S.dot(x, clip(by + k * hx), { color: 'green', r: 5 });
          if (isFinite(gy)) S.dot(PX0 + Math.min(PW, k * gy), y, { color: 'orange', r: 5 });
          if (key === 'sing') { S.dot(0, PY0 + PH + 0.08, { color: 'red', r: 4 }); S.tex('h(0)=\\infty', 0.1, PY0 + PH + 0.08, { color: 'red', align: 'left', size: 12 }); }
          st = { C, hx };
        });
        v.legend([['green', '$h(x)=\\int F(x,y)\\,dy$', { area: true }], ['ink', '$\\int|F(x,y)|\\,dy$', { dash: true }], ['orange', '$\\int|F(x,y)|\\,dx$', { area: true }]]);
        v.readout(() => {
          const C = st.C; if (!C) return '';
          const prod = C.nf * C.ng;
          return `$\\|f\\|_1=${v.fix(C.nf, 3)}$, $\\|g\\|_1=${v.fix(C.ng, 3)}$, $\\|f\\|_1\\|g\\|_1=${v.fix(prod, 3)}$, $\\;\\|f*g\\|_1=${v.fix(C.nh, 3)}$` + (C.key === 'sgn' ? ' — strictly smaller, because $f(x-y)g(y)$ changes sign and cancels.' : C.key === 'pos' ? ' — equality, since $f,g\\ge0$.' : ' (up to grid error) — equality since $f,g\\ge0$, although $h(0)=\\int\\frac{dy}{16|y|}=\\infty$.');
        });
      },
    },
    // ------------------------------------------------------------------ distribution functions
    {
      num: '8.15',
      kind: 'Definition',
      name: 'Distribution function',
      statement: String.raw`Let $f$ be a complex measurable function on a positive σ-finite measure space $(X,\mathfrak M,\mu)$. The **distribution function** of $f$ is the function on $[0,\infty)$ that assigns to each $t\ge0$ the number
$$\mu\{|f|>t\}=\mu(\{x\in X:|f(x)|>t\}).$$
It is nonincreasing and right-continuous in $t$.`,
      idea: String.raw`The distribution function records how much of $X$ lies above each height, forgetting *where*. Two functions with the same distribution function — for instance $f$ and its decreasing rearrangement $f^*$ — have the same integrals $\int\varphi(|f|)\,d\mu$ for every reasonable $\varphi$, by Theorem 8.16. Monotonicity is clear; right-continuity follows from $\{|f|>t\}=\bigcup_n\{|f|>t+1/n\}$ and continuity of measures from below (1.19).`,
      caption: String.raw`$X=[0,1]$ with Lebesgue measure. Drag the level $t$ (gold handle on the right edge). The green segments are the set $\{|f|>t\}$, whose length is plotted on the right as a function of $t$. The dashed purple curve is the decreasing rearrangement $f^*$ (toggle it off to compare): it has exactly the same distribution function, but for $f^*$ the set $\{f^*>t\}$ is the single interval $[0,\mu\{|f|>t\})$ (purple bar).`,
      deps: ['rca-1.18', 'rca-1.19'],
      tags: ['distribution function', 'measure'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 8.15, p. 172'],
      viz(v) {
        const M = v.M;
        const FN = {
          bumps: { label: 'smooth', f: (x) => 0.25 + 0.75 * Math.exp(-(((x - 0.25) / 0.09) ** 2)) + 0.5 * Math.exp(-(((x - 0.7) / 0.14) ** 2)) + 0.15 * Math.sin(14 * x), T: 1.3 },
          steps: { label: 'step function', f: (x) => [0.35, 1.05, 0.6, 0.05, 0.85][Math.min(4, Math.floor(x * 5))], T: 1.3 },
          spike: { label: '$\\tfrac14 x^{-1/2}$ (unbounded)', f: (x) => 0.25 / Math.sqrt(Math.max(x, 1e-12)), T: 2.6 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const rear = v.toggle('show the rearrangement $f^*$', true);
        const L = v.stage({ x: [-0.12, 1.1], y: [-0.12, 1.4], height: 330, axes: true, xlabel: 'x', xticks: [0.2, 0.4, 0.6, 0.8, 1], title: 'the graph of $|f|$ on $X=[0,1]$' });
        const R = v.stage({ x: [-0.05, 1.4], y: [-0.06, 1.1], height: 330, axes: 'box', xlabel: 't', title: 'distribution function $t\\mapsto\\mu\\{|f|>t\\}$' });
        const th = L.handle(1.05, 0.55, { color: 'gold', label: 't', labelPos: 'n', constrain: (x, y) => [1.05, M.clamp(y, 0.001, FN[which.value].T)] });
        const N = 4000;
        let cache = { key: null }, st = {};
        v.render(() => {
          const key = which.value, F = FN[key];
          if (cache.key !== key) {
            const vals = Array.from({ length: N }, (_, i) => Math.abs(F.f((i + 0.5) / N)));
            const sorted = vals.slice().sort((a, b) => b - a);
            const ts = M.linspace(0, F.T, 500);
            const lam = (t) => { let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] > t) lo = m + 1; else hi = m; } return lo / N; };
            cache = { key, vals, sorted, ts, lam, ls: ts.map(lam) };
            L.setView(null, [-0.1 * F.T, F.T * 1.1]); R.setView([-0.04 * F.T, F.T * 1.04], null);
            th.y = Math.min(th.y, F.T * 0.9);
          }
          const C = cache, t = th.y, lt = C.lam(t);
          // left
          L.hband(t, F.T * 2, { color: 'gold', alpha: 0.06 });
          L.hline(t, { color: 'gold', width: 1.4, dash: [5, 4] });
          L.fn((x) => Math.abs(F.f(x)), { domain: [0.0005, 1], color: 'ink', width: 2, n: 1600 });
          L.fn((x) => (Math.abs(F.f(x)) > t ? Math.abs(F.f(x)) : NaN), { domain: [0.0005, 1], color: 'accent', width: 3.2, n: 1600 });
          // the set {|f| > t} as intervals on the axis
          const base = 0; let start = null;
          for (let i = 0; i <= N; i++) {
            const inside = i < N && C.vals[i] > t;
            if (inside && start == null) start = i / N;
            if (!inside && start != null) { L.line(start, base, i / N, base, { color: 'green', width: 6, cap: 'butt' }); start = null; }
          }
          if (rear.value) L.path(C.sorted.filter((_, i) => i % 4 === 0).map((z, i) => [(4 * i + 0.5) / N, Math.min(z, F.T * 1.1)]), { color: 'purple', width: 2, dash: [6, 4] });
          if (rear.value) L.line(0, 0.035 * F.T, lt, 0.035 * F.T, { color: 'purple', width: 3, cap: 'butt' });
          // right
          R.path(C.ts.map((s, i) => [s, C.ls[i]]), { color: 'green', width: 2.4 });
          R.line(t, 0, t, lt, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.line(0, lt, t, lt, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(t, lt, { color: 'green', r: 5.5 });
          st = { t, lt };
        });
        v.legend([['ink', '$|f|$'], ['green', '$\\{|f|>t\\}$ and its measure'], ['purple', 'decreasing rearrangement $f^*$', { dash: true }]]);
        v.readout(() => `$t=${v.fix(st.t, 3)}$: $\\;\\mu\\{|f|>t\\}=${v.fix(st.lt, 4)}$` + (which.value === 'spike' ? ` (exactly $\\min(1,\\tfrac{1}{16t^2})=${v.fix(Math.min(1, 1 / (16 * st.t * st.t)), 4)}$)` : '') + (rear.value ? ` $=\\mu\\{f^*>t\\}$ — the purple bar $[0,${v.fix(st.lt, 3)})$.` : '.'));
      },
    },
    {
      num: '8.16',
      kind: 'Theorem',
      name: 'Integrals from the distribution function (layer cake)',
      statement: String.raw`Let $f$ be a complex measurable function on a positive σ-finite measure space $(X,\mathfrak M,\mu)$, and let $\varphi:[0,\infty]\to[0,\infty]$ be monotonic, absolutely continuous on $[0,T]$ for every $T<\infty$, with $\varphi(0)=0$ and $\varphi(t)\to\varphi(\infty)$ as $t\to\infty$. Then
$$\int_X(\varphi\circ|f|)\,d\mu=\int_0^\infty\mu\{|f|>t\}\,\varphi'(t)\,dt .$$
In particular, for $0<p<\infty$, $\displaystyle\int_X|f|^p\,d\mu=p\int_0^\infty t^{p-1}\mu\{|f|>t\}\,dt$.`,
      idea: String.raw`Let $E=\{(x,t)\in X\times[0,\infty):|f(x)|>t\}$, the region under the graph of $|f|$. Approximating $|f|$ by simple functions (1.17) shows $E$ is product-measurable. Integrate $\chi_E(x,t)\varphi'(t)$ over $X\times[0,\infty)$ in both orders (Fubini 8.8): slicing at fixed $t$ gives $\varphi'(t)\,\mu\{|f|>t\}$; slicing at fixed $x$ gives $\int_0^{|f(x)|}\varphi'(t)\,dt=\varphi(|f(x)|)$, by the fundamental theorem of calculus for absolutely continuous functions. (If $\mu\{|f|>t\}<\infty$ for all $t>0$, the set $\{f\neq0\}$ is $\sigma$-finite, so Fubini applies.)`,
      caption: String.raw`$X=[0,1]$. The shaded region is $E=\{(x,t):t<|f(x)|\}$, darker where the weight $\varphi'(t)$ is larger. Slice it vertically: each slice contributes $\varphi(|f(x)|)$. Slice it horizontally: each contributes $\varphi'(t)\,\mu\{|f|>t\}$. The right panel accumulates the chosen slices as the sweep moves; both totals agree. Change $\varphi$ (and $p$ for $t^p$).`,
      deps: ['rca-8.15', 'rca-8.8', 'rca-1.17', 'rca-7.20'],
      tags: ['distribution function', 'Fubini', 'Lᵖ'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 8.16 and complete proof, pp. 172–173'],
      viz(v) {
        const M = v.M;
        const FN = {
          bumps: { label: 'smooth $f$', f: (x) => 0.2 + 0.85 * Math.exp(-(((x - 0.28) / 0.1) ** 2)) + 0.55 * Math.exp(-(((x - 0.72) / 0.13) ** 2)) },
          steps: { label: 'step $f$', f: (x) => [0.4, 1.1, 0.7, 0.15, 0.9][Math.min(4, Math.floor(x * 5))] },
        };
        const PHI = {
          pow: { label: '$t^p$', phi: (t, p) => Math.pow(t, p), dphi: (t, p) => p * Math.pow(t, p - 1) },
          log: { label: '$\\log(1+t)$', phi: (t) => Math.log1p(t), dphi: (t) => 1 / (1 + t) },
          cap: { label: '$\\min(t,\\tfrac12)$', phi: (t) => Math.min(t, 0.5), dphi: (t) => (t < 0.5 ? 1 : 0) },
        };
        const fS = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const pS = v.select('$\\varphi(t)=$', Object.entries(PHI).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const pp = v.slider('$p$', 0.5, 4, 2, { step: 0.05 });
        const mode = v.select('slice', [{ value: 'v', label: 'vertically ($x$ fixed)' }, { value: 'h', label: 'horizontally ($t$ fixed)' }], 'h');
        const TM = 1.25;
        const L = v.stage({ x: [-0.03, 1.03], y: [-0.08, TM + 0.1], height: 330, axes: 'box', xlabel: 'x', ylabel: 't', xticks: [0.2, 0.4, 0.6, 0.8], title: '$E=\\{(x,t):\\ t<|f(x)|\\}\\subset X\\times[0,\\infty)$' });
        const R = v.stage({ x: [-0.03, 1.03], y: [-0.05, 1], height: 330, axes: 'box', xlabel: 't' });
        const N = 2000;
        let cache = { key: null }, st = {};
        function prepare(key) {
          const F = FN[fS.value], P = PHI[pS.value], p = pp.value;
          const phi = (t) => P.phi(t, p), dphi = (t) => P.dphi(t, p);
          const vals = Array.from({ length: N }, (_, i) => Math.abs(F.f((i + 0.5) / N))).sort((a, b) => b - a);
          const lam = (t) => { let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m] > t) lo = m + 1; else hi = m; } return lo / N; };
          // left-hand side: ∫ φ(|f(x)|) dx by Simpson in x (fine grid)
          const lhs = M.integrate((x) => phi(Math.abs(F.f(x))), 0, 1, 4000);
          // right-hand side: Σ over t-cells of [φ(t_{j+1}) − φ(t_j)] · μ{|f| > t_mid}  (exact in φ', midpoint in μ)
          const nt = 3000, ts = M.linspace(0, TM, nt + 1);
          const cum = [0]; for (let j = 0; j < nt; j++) cum.push(cum[j] + (phi(ts[j + 1]) - phi(ts[j])) * lam((ts[j] + ts[j + 1]) / 2));
          const xs = M.linspace(0, 1, 501), vx = xs.map((x) => phi(Math.abs(F.f(x))));
          const cumx = [0]; for (let i = 0; i + 1 < xs.length; i++) cumx.push(cumx[i] + 0.5 * (vx[i] + vx[i + 1]) * (xs[i + 1] - xs[i]));
          const tg = M.linspace(0.002, TM, 400), wt = tg.map((t) => dphi(t) * lam(t));
          const wmax = Math.max(...tg.slice(10).map(dphi));
          return { key, F, phi, dphi, lam, lhs, rhs: cum[nt], ts, cum, xs, vx, cumx, tg, wt, wmax };
        }
        v.animate((time) => {
          pp.el.hidden = pS.value !== 'pow';
          const key = `${fS.value}|${pS.value}|${pS.value === 'pow' ? pp.value : ''}`;
          if (cache.key !== key) cache = prepare(key);
          const C = cache, F = C.F, vert = mode.value === 'v';
          const s = ((time + 4.6) % 8) / 8;
          // left: the region E, shaded by φ'(t)
          const ac = v.rgb('accent'), pan = v.rgb('panel');
          L.raster((x, t) => {
            if (x < 0 || x > 1 || t < 0 || t >= Math.abs(F.f(x))) return null;
            const w = Math.min(1, C.dphi(Math.max(t, 1e-4)) / C.wmax), a = 0.12 + 0.6 * w;
            return [pan[0] + (ac[0] - pan[0]) * a, pan[1] + (ac[1] - pan[1]) * a, pan[2] + (ac[2] - pan[2]) * a];
          }, { key: key + pan, res: 2 });
          L.fn((x) => Math.abs(F.f(x)), { domain: [0, 1], color: 'accent', width: 2, n: 800 });
          if (vert) {
            const x = s, fx = Math.abs(F.f(x));
            L.vband(0, x, { color: 'gold', alpha: 0.08 });
            L.line(x, 0, x, fx, { color: 'gold', width: 4, cap: 'butt' });
            L.tex('\\varphi(|f(x)|)=\\int_0^{|f(x)|}\\varphi\'(t)\\,dt', x, TM + 0.05, { color: 'gold', align: x > 0.55 ? 'right' : 'left', baseline: 'top', dx: x > 0.55 ? -4 : 4, size: 12 });
            L.line(x, fx, x, TM, { color: 'gold', width: 1, dash: [2, 3] });
          } else {
            const t = s * TM;
            L.hband(0, t, { color: 'gold', alpha: 0.08 });
            let start = null;
            for (let i = 0; i <= 400; i++) {
              const x = i / 400, inside = i < 400 && Math.abs(F.f((i + 0.5) / 400)) > t;
              if (inside && start == null) start = x;
              if (!inside && start != null) { L.line(start, t, x, t, { color: 'gold', width: 4, cap: 'butt' }); start = null; }
            }
            L.hline(t, { color: 'gold', width: 1, dash: [3, 4] });
          }
          // right: the accumulating integrand
          let part;
          if (vert) {
            const top = Math.max(...C.vx) * 1.15;
            R.setView([-0.03, 1.03], [-0.05 * top, top]); R.setTicks([0.2, 0.4, 0.6, 0.8], null);
            R.setTitle('vertical slices: $x\\mapsto\\varphi(|f(x)|)$'); R.o.xlabel = 'x';
            const k = Math.min(C.xs.length - 1, Math.round(s * (C.xs.length - 1)));
            R.path([[0, 0], ...C.xs.slice(0, k + 1).map((x, i) => [x, C.vx[i]]), [C.xs[k], 0]], { fill: 'green', fillAlpha: 0.3, stroke: false, close: true });
            R.path(C.xs.map((x, i) => [x, C.vx[i]]), { color: 'purple', width: 2.2 });
            R.vline(s, { color: 'gold', width: 1.2, dash: [4, 4] });
            part = C.cumx[k];
          } else {
            const top = Math.max(...C.wt.slice(4)) * 1.2;
            R.setView([-0.03 * TM, TM * 1.03], [-0.05 * top, top]); R.setTicks(null, null);
            R.setTitle('horizontal slices: $t\\mapsto\\varphi\'(t)\\,\\mu\\{|f|>t\\}$'); R.o.xlabel = 't';
            const t = s * TM, k = C.tg.findIndex((u) => u > t);
            const kk = k < 0 ? C.tg.length : k;
            R.path([[C.tg[0], 0], ...C.tg.slice(0, kk).map((u, i) => [u, Math.min(top, C.wt[i])]), [C.tg[Math.max(0, kk - 1)], 0]], { fill: 'green', fillAlpha: 0.3, stroke: false, close: true });
            R.path(C.tg.map((u, i) => [u, Math.min(top * 1.1, C.wt[i])]), { color: 'orange', width: 2.2 });
            R.vline(t, { color: 'gold', width: 1.2, dash: [4, 4] });
            const j = Math.min(C.ts.length - 1, Math.round((t / TM) * (C.ts.length - 1)));
            part = C.cum[j];
          }
          R.corner(`accumulated: ${v.fix(part, 4)}`, 'tr', { color: 'green', weight: 600 });
          st = { C, part };
        }, { period: 8 });
        v.legend([['accent', 'region $E$, shaded by the weight $\\varphi\'(t)$', { area: true }], ['gold', 'current slice'], ['green', 'accumulated integral', { area: true }]]);
        v.readout(() => {
          const C = st.C; if (!C) return '';
          const name = pS.value === 'pow' ? `|f|^{${v.fix(pp.value, 2)}}` : pS.value === 'log' ? '\\log(1+|f|)' : '\\min(|f|,\\tfrac12)';
          return `$\\int_0^1 ${name}\\,dx=${v.fix(C.lhs, 4)}$ (vertical slices) and $\\int_0^\\infty\\varphi'(t)\\,\\mu\\{|f|>t\\}\\,dt=${v.fix(C.rhs, 4)}$ (horizontal slices).`;
        });
      },
    },
  ],
};
