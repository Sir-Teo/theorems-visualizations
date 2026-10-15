// Rudin, Principles of Mathematical Analysis — Chapter 8 (part 3): Fourier series (8.11–8.16).

const PI = Math.PI, TAU = 2 * Math.PI;
/** Reduce x to [-π, π). */
const wrap = (x) => x - TAU * Math.floor((x + PI) / TAU);
const PI_TICKS = [[-PI, '−π'], [-PI / 2, '−π/2'], [PI / 2, 'π/2'], [PI, 'π']];
/** A number as TeX (scientific notation as m×10^e when very small or large). */
function texNum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a));
  return `${(x / 10 ** e).toFixed(Math.max(0, d - 1))}\\times10^{${e}}`;
}
/** Midpoint rule on [a,b] (robust for functions with jumps). */
function mid(f, a, b, n = 4000) { const h = (b - a) / n; let s = 0; for (let j = 0; j < n; j++) s += f(a + (j + 0.5) * h); return s * h; }
/** Midpoint nodes and weights on [-π, π], split at the given breakpoints (jumps of f) so every piece is smooth. */
function nodes(K, breaks = [-PI, PI]) {
  const xs = [], ws = [];
  for (let p = 0; p + 1 < breaks.length; p++) {
    const a = breaks[p], b = breaks[p + 1], n = Math.max(8, Math.round((K * (b - a)) / TAU)), h = (b - a) / n;
    for (let j = 0; j < n; j++) { xs.push(a + (j + 0.5) * h); ws.push(h); }
  }
  return { xs, ws };
}
/** ∫_{-π}^{π} g by the midpoint rule on the pieces between breakpoints. */
function midP(g, breaks, K = 4000) { const { xs, ws } = nodes(K, breaks); let s = 0; for (let j = 0; j < xs.length; j++) s += ws[j] * g(xs[j]); return s; }
/** Complex Fourier coefficients c_n = (1/2π)∫_{-π}^{π} f e^{-inx}, n = -N..N, as [re, im] (midpoint rule, ~K nodes, split at breaks). */
function fcoeffs(f, N, K = 4096, breaks) {
  const { xs, ws } = nodes(K, breaks), fs = xs.map(f), out = [];
  for (let n = -N; n <= N; n++) { let re = 0, im = 0; for (let j = 0; j < xs.length; j++) { const w = fs[j] * ws[j]; re += w * Math.cos(n * xs[j]); im -= w * Math.sin(n * xs[j]); } out.push([re / TAU, im / TAU]); }
  return out;
}
/** Real part of Σ_{|n|≤N} w_n c_n e^{inx} for a coefficient list from fcoeffs (w = Fejér weights if fejer). */
function fsum(c, x, N, fejer = false) {
  const M0 = (c.length - 1) / 2; let s = 0;
  for (let n = -N; n <= N; n++) { const [a, b] = c[n + M0], w = fejer ? 1 - Math.abs(n) / (N + 1) : 1; s += w * (a * Math.cos(n * x) - b * Math.sin(n * x)); }
  return s;
}
/** Dirichlet kernel D_N(x) = sin((N+1/2)x)/sin(x/2). */
const dirichlet = (N, x) => { const s = Math.sin(x / 2); return Math.abs(s) < 1e-12 ? 2 * N + 1 : Math.sin((N + 0.5) * x) / s; };

export default {
  collection: 'pma',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11',
      kind: 'Theorem',
      name: 'Partial Fourier sums are the best mean-square approximations',
      statement: String.raw`Let $\{\phi_n\}$ be orthonormal on $[a,b]$ and let $s_n=\sum_{m=1}^n c_m\phi_m$ be the $n$-th partial sum of the Fourier series of $f$. If $t_n=\sum_{m=1}^n\gamma_m\phi_m$ is any other combination of $\phi_1,\dots,\phi_n$, then
$$\int_a^b|f-s_n|^2\,dx\le\int_a^b|f-t_n|^2\,dx,$$
with equality only when $\gamma_m=c_m$ for $m=1,\dots,n$.`,
      idea: String.raw`Expand the square using orthonormality: $\int|f-t_n|^2=\int|f|^2-\sum_{m\le n}|c_m|^2+\sum_{m\le n}|\gamma_m-c_m|^2$. Only the last sum depends on the $\gamma_m$, and it vanishes exactly when $\gamma_m=c_m$. Geometrically, $s_n$ is the orthogonal projection of $f$ onto the span of $\phi_1,\dots,\phi_n$.`,
      caption: String.raw`Here $n=2$ with $\phi_1=\frac{\sin x}{\sqrt\pi}$, $\phi_2=\frac{\sin 2x}{\sqrt\pi}$ on $[-\pi,\pi]$. Drag $\gamma=(\gamma_1,\gamma_2)$ on the right: the colour is the error $\int|f-t_2|^2$, a paraboloid whose level sets are circles about the Fourier coefficients $c=(c_1,c_2)$ (green). Left: $f$, your $t_2$ (gold, error shaded) and $s_2$ (green). The readout checks the Pythagorean identity numerically.`,
      deps: ['pma-8.10'],
      see: ['rca-4.14'],
      tags: ['Fourier series', 'least squares'],
      viz(v) {
        const SQ = Math.sqrt(PI);
        const FN = {
          saw: { label: '$f(x)=x$', f: (x) => x },
          sq: { label: '$f(x)=\\operatorname{sgn}x$', f: (x) => (x >= 0 ? 1 : -1) },
          cub: { label: '$f(x)=x(\\pi-|x|)$', f: (x) => x * (PI - Math.abs(x)) },
        };
        const phi = [(x) => Math.sin(x) / SQ, (x) => Math.sin(2 * x) / SQ];
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'saw');
        const L = v.stage({ x: [-PI, PI], y: [-3.6, 3.6], height: 330, xlabel: 'x', xticks: PI_TICKS, title: '$f$, your $t_2=\\gamma_1\\phi_1+\\gamma_2\\phi_2$ and the Fourier sum $s_2$' });
        const Cp = v.stage({ x: [-1, 5], y: [-3, 3], equal: true, height: 330, title: 'the error $\\int|f-t_2|^2$ over the $(\\gamma_1,\\gamma_2)$-plane' });
        const g = Cp.handle(2, 0.5, { color: 'gold', label: 'γ' });
        const cache = {};
        let last = null, st = null;
        v.render(() => {
          const key = which.value, f = FN[key].f;
          if (!cache[key]) {
            const c = phi.map((p) => mid((x) => f(x) * p(x), -PI, PI));
            const nf = mid((x) => f(x) ** 2, -PI, PI);
            cache[key] = { c, nf, Es: nf - c[0] ** 2 - c[1] ** 2 };
          }
          const { c, nf, Es } = cache[key];
          if (last !== key) { last = key; Cp.setView([c[0] - 3.4, c[0] + 3.4], [c[1] - 2.6, c[1] + 2.6]); g.set(c[0] - 1.6, c[1] + 1.1); }
          const t = (x) => g.x * phi[0](x) + g.y * phi[1](x), s = (x) => c[0] * phi[0](x) + c[1] * phi[1](x);
          const yr = key === 'sq' ? [-1.8, 1.8] : key === 'cub' ? [-3.4, 3.4] : [-3.6, 3.6];
          L.setView(null, yr);
          // left
          L.between(f, t, -PI, PI, { fill: 'gold', fillAlpha: 0.22, n: 600 });
          L.fn(f, { color: 'ink', width: 2.4 });
          L.fn(s, { color: 'green', width: 2.2, dash: [7, 4] });
          L.fn(t, { color: 'gold', width: 2.4 });
          // right: error surface as a heat map with circular level sets
          const lo = Es, hi = Es + 8;
          Cp.heat((x, y) => Es + (x - c[0]) ** 2 + (y - c[1]) ** 2, { range: [lo, hi], cmap: 'viridis', key, res: 3, alpha: 0.55 });
          for (let r = 0.5; r < 4; r += 0.5) Cp.circle(c[0], c[1], r, { color: 'panel', width: r % 1 === 0 ? 1.4 : 0.8, alpha: 0.85 });
          Cp.text(`error ${v.fmt(Es + 1, 3)}`, c[0] + 1 / Math.SQRT2, c[1] + 1 / Math.SQRT2, { color: 'ink', size: 10.5, dx: 4, dy: -4 });
          Cp.line(g.x, g.y, c[0], c[1], { color: 'ink', width: 1.4, dash: [4, 3] });
          Cp.dot(c[0], c[1], { color: 'green', r: 6, label: 'c = (c₁, c₂)', labelPos: 'se', labelColor: 'ink' });
          const Et = mid((x) => (f(x) - t(x)) ** 2, -PI, PI);
          const Es2 = mid((x) => (f(x) - s(x)) ** 2, -PI, PI);
          st = { Et, Es: Es2, d2: (g.x - c[0]) ** 2 + (g.y - c[1]) ** 2, c, g: [g.x, g.y], nf };
          v.legend([['ink', '$f$'], ['gold', '$t_2$ (your coefficients)'], ['green', '$s_2$ (Fourier coefficients)', { dash: true }], ['gold', '$f-t_2$', { area: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          return `$\\gamma=(${v.fix(st.g[0], 3)},\\,${v.fix(st.g[1], 3)})$, $c=(${v.fix(st.c[0], 3)},\\,${v.fix(st.c[1], 3)})$: $\\int|f-t_2|^2=${v.fix(st.Et, 4)}$ $=\\int|f-s_2|^2+\\sum|\\gamma_m-c_m|^2=${v.fix(st.Es, 4)}+${v.fix(st.d2, 4)}$. The minimum $${v.fix(st.Es, 4)}$ is attained only at $\\gamma=c$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.12
    {
      num: '8.12',
      kind: 'Theorem',
      name: "Bessel's inequality",
      statement: String.raw`If $\{\phi_n\}$ is orthonormal on $[a,b]$ and $f(x)\sim\sum_{n=1}^\infty c_n\phi_n(x)$, then
$$\sum_{n=1}^{\infty}|c_n|^2\le\int_a^b|f(x)|^2\,dx .$$
In particular $c_n\to0$.`,
      idea: String.raw`Take $\gamma_m=c_m$ in the identity behind 8.11: $0\le\int|f-s_n|^2=\int|f|^2-\sum_{m\le n}|c_m|^2$. So every partial sum of $\sum|c_m|^2$ is bounded by $\int|f|^2$; the series converges, and its terms tend to $0$.`,
      caption: String.raw`Left: the "energies" $|c_n|^2$ of $f$ along an orthonormal system. Right: their running total against $\int|f|^2$ (black line). With the incomplete system of sines the total stalls strictly below — the missing energy (red) is that of the even part of $f$ — while for the full trigonometric system nothing is missing (this is Parseval, 8.16). Either way the bars shrink: $c_n\to0$.`,
      deps: ['pma-8.11', 'pma-8.10'],
      see: ['rca-4.17'],
      tags: ['Fourier series', 'Bessel inequality'],
      viz(v) {
        const M = v.M;
        const FN = {
          lin: { label: '$x+1$', f: (x) => x + 1, br: [-PI, PI] },
          ind: { label: '$\\chi_{[0,2]}$', f: (x) => (x >= 0 && x <= 2 ? 1 : 0), br: [-PI, 0, 2, PI] },
          odd: { label: '$x$ (odd)', f: (x) => x, br: [-PI, PI] },
        };
        const SYS = { sin: 'sines $\\frac{\\sin nx}{\\sqrt\\pi}$, $n\\ge1$', trig: 'all of $\\frac{e^{inx}}{\\sqrt{2\\pi}}$, $n\\in\\mathbb{Z}$' };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const sys = v.select('system', Object.entries(SYS).map(([value, label]) => ({ value, label })), 'sin');
        const nS = v.slider('number of terms $N$', 1, 41, 15, { int: true });
        const A = v.stage({ x: [0.3, 41.7], y: [0, 4], height: 300, axes: 'box', xlabel: 'k', title: '$|c_k|^2$ for the $k$-th function of the system' });
        const B = v.stage({ x: [0, 42], y: [0, 30], height: 300, axes: 'box', xlabel: 'N', title: 'running total $\\sum_{k\\le N}|c_k|^2$ against $\\int|f|^2$' });
        const cache = {}, LONG = 400;
        function data(fk, sk) {
          const id = fk + sk; if (cache[id]) return cache[id];
          const f = FN[fk].f, K = 41;
          let cs = [], labels = [];
          if (sk === 'sin') {
            for (let n = 1; n <= LONG; n++) { cs.push(mid((x) => f(x) * Math.sin(n * x), -PI, PI) / Math.sqrt(PI)); labels.push(n); }
          } else {
            const H = LONG / 2, c = fcoeffs(f, H, 8192, FN[fk].br);   // coefficient w.r.t. e^{inx}/√(2π) is √(2π)·c_n
            const order = [0]; for (let n = 1; n <= H; n++) order.push(n, -n);
            cs = order.map((n) => Math.sqrt(TAU) * Math.hypot(...c[n + H])); labels = order;
          }
          const e = cs.map((x) => x * x), cum = M.partialSums((k) => e[k], e.length);
          const nf = midP((x) => f(x) ** 2, FN[fk].br);
          const limit = cum[cum.length - 1];   // running total after LONG terms, computed
          return (cache[id] = { e: e.slice(0, K), cum: cum.slice(0, K), nf, limit, labels });
        }
        let st = null;
        v.render(() => {
          const D = data(which.value, sys.value), N = nS.value;
          const emax = Math.max(...D.e);
          A.setView(null, [0, emax * 1.15]);
          A.bars(D.e, { x0: 1, color: (_, i) => (i < N ? 'blue' : 'faint'), barWidth: 0.72 });
          if (sys.value === 'trig') for (let k = 1; k <= Math.min(N, 9); k++) A.text(String(D.labels[k - 1]).replace('-', '−'), k, D.e[k - 1], { align: 'center', baseline: 'bottom', dy: -3, size: 9.5, color: 'muted' });
          A.corner(sys.value === 'trig' ? 'k ↦ n = 0, 1, −1, 2, −2, …' : 'k = n', 'tr');
          B.setView(null, [0, D.nf * 1.18]);
          const gapBig = D.nf - D.limit > 0.01 * D.nf;
          if (gapBig) B.hband(D.limit, D.nf, { color: 'red', alpha: 0.13 });
          B.hline(D.nf, { color: 'ink', width: 1.8 });
          B.text('∫|f|²', 41.5, D.nf, { align: 'right', baseline: 'bottom', dy: -3, color: 'ink', size: 12, weight: 600 });
          B.hline(D.limit, { color: 'green', dash: [6, 4], width: 1.5 });
          if (gapBig) B.text('missing energy', 41.5, (D.nf + D.limit) / 2, { align: 'right', color: 'red', size: 11.5, weight: 600 });
          const pts = D.cum.map((y, k) => [k + 1, y]);
          B.path([[0, 0], ...pts], { color: 'blue', width: 2.2 });
          B.dots(pts.slice(0, N), { color: 'blue', r: 2.6 });
          B.dot(N, D.cum[N - 1], { color: 'gold', r: 5.5 });
          st = { N, cum: D.cum[N - 1], nf: D.nf, limit: D.limit, last: D.e[N - 1], sys: sys.value };
          v.legend([['blue', '$|c_k|^2$, $k\\le N$', { area: true }], ['blue', '$\\sum_{k\\le N}|c_k|^2$'], ['green', 'running total after 400 terms', { dash: true }], ['ink', '$\\int|f|^2$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const g = st.nf - st.limit;
          return `$\\sum_{k\\le ${st.N}}|c_k|^2=${v.fix(st.cum, 4)}\\le\\int_{-\\pi}^{\\pi}|f|^2=${v.fix(st.nf, 4)}$; after $400$ terms the total is $${v.fix(st.limit, 4)}$` + (g > 0.01 * st.nf ? `, still short by $${v.fix(g, 4)}$: a strict inequality.` : ` and still creeping up (short by $${texNum(g)}$).`) + ` Latest term $|c_{${st.N}}|^2=${texNum(st.last)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.13
    {
      num: '8.13',
      kind: 'Definition',
      name: 'Partial sums of Fourier series and the Dirichlet kernel',
      statement: String.raw`For $f$ of period $2\pi$, Riemann-integrable on $[-\pi,\pi]$, let $c_n=\frac1{2\pi}\int_{-\pi}^{\pi}f(t)e^{-int}\,dt$ and let $s_N(f;x)=\sum_{n=-N}^{N}c_ne^{inx}$ be the $N$-th partial sum of its Fourier series. The **Dirichlet kernel** is
$$D_N(x)=\sum_{n=-N}^{N}e^{inx}=\frac{\sin\bigl(N+\frac12\bigr)x}{\sin(x/2)},$$
and substituting the formula for $c_n$ gives
$$s_N(f;x)=\frac1{2\pi}\int_{-\pi}^{\pi}f(x-t)\,D_N(t)\,dt .$$
Moreover $\frac1{2\pi}\int_{-\pi}^{\pi}D_N=1$, and Bessel's inequality takes the form $\frac1{2\pi}\int_{-\pi}^{\pi}|s_N(f)|^2=\sum_{|n|\le N}|c_n|^2\le\frac1{2\pi}\int_{-\pi}^{\pi}|f|^2$.`,
      idea: String.raw`Multiply $D_N$ by $e^{ix/2}-e^{-ix/2}=2i\sin(x/2)$: the sum telescopes to $e^{i(N+\frac12)x}-e^{-i(N+\frac12)x}$, giving the closed form. The integral formula is just $\sum_n c_ne^{inx}$ with $c_n$ written out, followed by the change of variable $t\mapsto x-t$ (allowed by periodicity).`,
      caption: String.raw`Left: $D_N$ in closed form (blue) and as the geometric sum $\sum_{|n|\le N}e^{inx}$ (gold dots) — they agree; the faint curves are the envelope $\pm1/|\sin(x/2)|$, and the area under $D_N/2\pi$ is always $1$. Right: $s_N(f;x)$ computed from the coefficients (gold) and from the convolution with $D_N$ (green dots).`,
      deps: ['pma-8.9', 'pma-8.10'],
      verify: true,
      tags: ['Fourier series', 'Dirichlet kernel'],
      viz(v) {
        const M = v.M;
        const FN = { saw: { label: 'sawtooth $x$', f: (x) => wrap(x) }, sq: { label: 'square wave', f: (x) => (wrap(x) >= 0 ? 1 : -1) } };
        const nS = v.slider('$N$', 0, 16, 5, { int: true });
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'saw');
        const L = v.stage({ x: [-PI, PI], y: [-4, 12], height: 320, xticks: PI_TICKS, title: '$D_N(x)=\\frac{\\sin(N+1/2)x}{\\sin(x/2)}$' });
        const R = v.stage({ x: [-PI, PI], y: [-4, 4], height: 320, xticks: PI_TICKS, title: '$s_N(f;x)$ two ways' });
        const cache = {};
        let st = null;
        v.render(() => {
          const N = nS.value, key = which.value, f = FN[key].f;
          L.setView(null, [-0.32 * (2 * N + 1) - 1, 2 * N + 2.5]);
          const env = (x) => 1 / Math.abs(Math.sin(x / 2));
          L.fn(env, { color: 'faint', width: 1.2, dash: [4, 4] }); L.fn((x) => -env(x), { color: 'faint', width: 1.2, dash: [4, 4] });
          L.fn((x) => dirichlet(N, x), { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12, n: 900 });
          const dots = M.linspace(-PI, PI, 41).map((x) => { let s = 0; for (let n = -N; n <= N; n++) s += Math.cos(n * x); return [x, s]; });
          L.dots(dots, { color: 'gold', r: 3 });
          L.dot(0, 2 * N + 1, { color: 'blue', r: 4, label: `2N+1 = ${2 * N + 1}`, labelPos: 'e', labelColor: 'blue' });
          const area = mid((x) => dirichlet(N, x), -PI, PI, 6000) / TAU;
          // right: partial sum via coefficients and via convolution
          if (!cache[key]) cache[key] = fcoeffs(f, 16, 4096);
          const c = cache[key];
          R.setView(null, key === 'saw' ? [-4.2, 4.2] : [-1.7, 1.7]);
          R.fn(f, { color: 'ink', width: 2 });
          R.fn((x) => fsum(c, x, N), { color: 'gold', width: 2.4 });
          const conv = M.linspace(-PI + 0.15, PI - 0.15, 19).map((x) => [x, mid((t) => f(x - t) * dirichlet(N, t), x - PI, x + PI, 4000) / TAU]);   // window shifted so the jump of f(x−t) sits at the ends
          R.dots(conv, { color: 'green', r: 3.6 });
          let dev = 0; for (const [x, y] of conv) dev = Math.max(dev, Math.abs(y - fsum(c, x, N)));
          st = { N, area, dev };
          v.legend([['blue', '$D_N$ (closed form)'], ['gold', '$\\sum_{|n|\\le N}e^{inx}$, and $\\sum_{|n|\\le N}c_ne^{inx}$', { dot: true }], ['green', '$\\frac1{2\\pi}\\int f(x-t)D_N(t)\\,dt$', { dot: true }], ['ink', '$f$']]);
        });
        v.readout(() => st && `$N=${st.N}$: $\\frac1{2\\pi}\\int_{-\\pi}^{\\pi}D_N=${v.fix(st.area, 6)}$; the two computations of $s_N(f;x)$ differ by at most $${texNum(st.dev, 2)}$ at the sample points.`);
      },
    },
    // ------------------------------------------------------------------ 8.14
    {
      num: '8.14',
      kind: 'Theorem',
      name: 'Pointwise convergence where $f$ is Lipschitz',
      statement: String.raw`Let $f$ have period $2\pi$ and be Riemann-integrable on $[-\pi,\pi]$. If at some point $x$ there are constants $\delta>0$ and $M<\infty$ with
$$|f(x+t)-f(x)|\le M|t|\qquad\text{for all }t\in(-\delta,\delta),$$
then $\lim_{N\to\infty}s_N(f;x)=f(x)$.`,
      idea: String.raw`Since $\frac1{2\pi}\int D_N=1$, $s_N(f;x)-f(x)=\frac1{2\pi}\int_{-\pi}^{\pi}g(t)\sin\bigl(N+\tfrac12\bigr)t\,dt$ with $g(t)=\frac{f(x-t)-f(x)}{\sin(t/2)}$. The Lipschitz condition keeps $g$ bounded near $0$, so $g$ is Riemann-integrable. Expanding $\sin(N+\frac12)t$ splits the integral into Fourier coefficients of $g(t)\cos(t/2)$ and $g(t)\sin(t/2)$, which tend to $0$ by Bessel's inequality (8.12).`,
      caption: String.raw`Drag $x$ along the graph and raise $N$. Bottom left: the difference quotient $|f(x+t)-f(x)|/|t|$ on $0<|t|<1$; the hypothesis asks that it stay bounded. Bottom right: $s_N(f;x)$ against $N$. At the jump of the square wave (where $f(0)=1$) the quotient blows up and $s_N(f;0)\to0\ne f(0)$; at the cusp of $\sqrt{|x|}$ it also blows up, yet the series still converges there — the condition is sufficient, not necessary.`,
      deps: ['pma-8.13', 'pma-8.12'],
      tags: ['Fourier series', 'pointwise convergence'],
      viz(v) {
        const M = v.M;
        const NMAX = 60;
        const FN = {
          sq: { label: 'square wave', f: (x) => (wrap(x) >= 0 ? 1 : -1), y: [-1.7, 1.7], x0: 0.6 },
          tri: { label: '$|x|$', f: (x) => Math.abs(wrap(x)), y: [-0.4, 3.6], x0: 0 },
          root: { label: '$\\sqrt{|x|}$', f: (x) => Math.sqrt(Math.abs(wrap(x))), y: [-0.3, 2.1], x0: 0 },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const nS = v.slider('$N$', 1, NMAX, 12, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-1.7, 1.7], height: 250, full: true, xticks: PI_TICKS, title: '$f$ and $s_N(f)$' });
        const Q = v.stage({ x: [-1, 1], y: [0, 6], height: 220, axes: 'box', xlabel: 't', title: 'difference quotient $|f(x+t)-f(x)|/|t|$' });
        const S = v.stage({ x: [0, NMAX + 1], y: [-1.5, 1.5], height: 220, axes: 'box', xlabel: 'N', title: '$s_N(f;x)$ against $N$' });
        const hx = T.handle(0.6, 1, { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, -PI, PI - 1e-9); return [xx, FN[which.value].f(xx)]; } });
        const cache = {};
        let last = null, st = null;
        v.render(() => {
          const key = which.value, o = FN[key], f = o.f, N = nS.value;
          if (!cache[key]) cache[key] = fcoeffs(f, NMAX, 8192);
          const c = cache[key];
          if (last !== key) { last = key; T.setView(null, o.y); hx.x = o.x0; }
          const x = hx.x, fx = f(x); hx.y = fx;
          T.fn(f, { color: 'ink', width: 2.2, n: 1200 });
          T.fn((u) => fsum(c, u, N), { color: 'gold', width: 2, n: 1200 });
          T.vline(x, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.6 });
          const sx = fsum(c, x, N);
          T.dot(x, sx, { color: 'gold', r: 5 });
          // difference quotient on 0 < |t| < 1
          const ts = [...M.linspace(-1, -1e-4, 400), ...M.linspace(1e-4, 1, 400)];
          let Mq = 0; const qs = ts.map((t) => { const q = Math.abs(f(x + t) - fx) / Math.abs(t); Mq = Math.max(Mq, q); return [t, q]; });
          // the hypothesis concerns t → 0: judge boundedness on the innermost samples 1e-4 ≤ |t| ≤ 1e-3 only
          let Minner = 0; for (const [t, q] of qs) if (Math.abs(t) <= 1e-3) Minner = Math.max(Minner, q);
          const ok = Minner < 40, shown = ok && Mq < 40;
          const qTop = shown ? Math.max(1.5, Mq * 1.3) : 8; Q.setView(null, [-0.07 * qTop, qTop]);
          Q.path(qs.slice(0, 400), { color: ok ? 'blue' : 'red', width: 2.2 });
          Q.path(qs.slice(400), { color: ok ? 'blue' : 'red', width: 2.2 });
          if (shown) { Q.hline(Mq, { color: 'green', dash: [6, 4], width: 1.4 }); Q.text(`M = ${v.fmt(Mq, 3)}`, -0.95, Mq, { align: 'left', baseline: 'bottom', dy: -3, color: 'green', size: 12, weight: 600 }); }
          Q.corner(ok ? (shown ? 'bounded: the hypothesis holds' : 'bounded for small |t| (take δ smaller): the hypothesis holds') : 'unbounded as t → 0: the hypothesis fails', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          // s_N(f;x) against N
          const seq = M.range(NMAX, 1).map((n) => [n, fsum(c, x, n)]);
          const ys = seq.map((p) => p[1]).concat([fx]);
          const lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max(0.15, (hi - lo) * 0.18);
          S.setView(null, [lo - pad, hi + pad]);
          S.hline(fx, { color: 'green', dash: [6, 4], width: 1.6 });
          S.text('f(x)', NMAX, fx, { align: 'right', baseline: 'bottom', dy: -3, color: 'green', math: true });
          S.path(seq, { color: 'gold', width: 1.4, alpha: 0.7 });
          S.dots(seq, { color: 'gold', r: 2.3 });
          S.dot(N, sx, { color: 'gold', r: 5.5 });
          const tail = Math.abs(fsum(c, x, NMAX) - fx);
          st = { x, fx, sx, N, ok, Mq, tail };
          v.legend([['ink', '$f$'], ['gold', '$s_N(f)$'], ['green', '$f(x)$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { x, fx, sx, N, ok, tail } = st;
          return `$x=${v.fix(x, 3)}$, $f(x)=${v.fix(fx, 4)}$, $s_{${N}}(f;x)=${v.fix(sx, 4)}$, $|s_{${NMAX}}(f;x)-f(x)|=${texNum(tail)}$. ` + (ok ? 'The quotient is bounded near $t=0$, so the theorem guarantees $s_N(f;x)\\to f(x)$.' : 'The quotient is unbounded, so the theorem says nothing at this point.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.14a
    {
      num: '8.14a',
      kind: 'Corollary',
      name: 'Localization: only the behaviour near $x$ matters',
      statement: String.raw`If $f(x)=0$ for all $x$ in some segment $J$, then $\lim_{N\to\infty}s_N(f;x)=0$ for every $x\in J$. Equivalently, if $f=g$ on a neighbourhood of a point $x$, then $s_N(f;x)-s_N(g;x)=s_N(f-g;x)\to0$.`,
      idea: String.raw`At an interior point $x$ of $J$, $f$ vanishes on a neighbourhood of $x$, so $|f(x+t)-f(x)|=0\le M|t|$ for small $|t|$, and Theorem 8.14 gives $s_N(f;x)\to f(x)=0$. (At an endpoint of $J$ the one-sided version of the same estimate works.) Convergence of a Fourier series at $x$ thus depends only on $f$ near $x$, even though every coefficient $c_n$ involves all of $f$.`,
      caption: String.raw`$f$ (blue) and $g$ (purple) agree on the green segment $J=[-1,1]$ but differ wildly outside it, so all their Fourier coefficients differ. Raise $N$: below, the difference $s_N(f)-s_N(g)=s_N(f-g)$ flattens to $0$ on $J$, while outside $J$ it follows $f-g$.`,
      deps: ['pma-8.14'],
      tags: ['Fourier series', 'localization'],
      viz(v) {
        const M = v.M;
        const NMAX = 80;
        const f = (x) => Math.cos(wrap(x)) * 0.8 + 0.2 * wrap(x);
        const h = (x) => { const u = wrap(x); return u > 1 ? 1.6 * Math.sin(3 * u) + 0.8 : u < -1 ? -1.2 : 0; };
        const g = (x) => f(x) + h(x);
        const nS = v.slider('$N$', 1, NMAX, 10, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-2.6, 3.2], height: 260, full: true, xticks: PI_TICKS, title: '$f$, $g$ and their partial sums' });
        const B = v.stage({ x: [-PI, PI], y: [-2.2, 2.6], height: 220, full: true, xticks: PI_TICKS, title: '$s_N(f)-s_N(g)=s_N(f-g)$' });
        const cf = fcoeffs(f, NMAX, 8192), cg = fcoeffs(g, NMAX, 8192), ch = fcoeffs(h, NMAX, 8192);
        let st = null;
        v.render(() => {
          const N = nS.value;
          for (const S of [T, B]) S.vband(-1, 1, { color: 'green', alpha: 0.1, edges: true });
          T.fn(g, { color: 'purple', width: 1.6, alpha: 0.55, n: 1200 });
          T.fn(f, { color: 'blue', width: 1.6, alpha: 0.55, n: 1200 });
          T.fn((x) => fsum(cg, x, N), { color: 'purple', width: 2.2, n: 1200 });
          T.fn((x) => fsum(cf, x, N), { color: 'blue', width: 2.2, n: 1200 });
          T.text('J', 0.5, 2.9, { align: 'center', color: 'green', size: 16, math: true });
          B.fn(h, { color: 'muted', width: 1.4, dash: [5, 4], n: 1200 });
          B.fn((x) => fsum(ch, x, N), { color: 'gold', width: 2.4, n: 1200 });
          B.hline(0, { color: 'faint', width: 1 });
          let sup = 0; for (const x of M.linspace(-0.7, 0.7, 141)) sup = Math.max(sup, Math.abs(fsum(ch, x, N)));
          B.corner(`sup over [−0.7, 0.7]: ${v.fmt(sup, 3)}`, 'tl', { color: 'green', weight: 600 });
          st = { N, sup, at0: fsum(cf, 0, N) - fsum(cg, 0, N), c1: Math.hypot(cf[NMAX + 1][0] - cg[NMAX + 1][0], cf[NMAX + 1][1] - cg[NMAX + 1][1]) };
          v.legend([['blue', '$f$, $s_N(f)$'], ['purple', '$g$, $s_N(g)$'], ['green', '$J$ (where $f=g$)', { area: true }], ['gold', '$s_N(f-g)$'], ['muted', '$f-g$', { dash: true }]]);
        });
        v.readout(() => st && `$N=${st.N}$: $s_N(f;0)-s_N(g;0)=${texNum(st.at0)}$ and $\\sup_{|x|\\le0.7}|s_N(f-g;x)|=${texNum(st.sup)}$, although already the first coefficients differ: $|c_1(f)-c_1(g)|=${v.fix(st.c1, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 8.15
    {
      num: '8.15',
      kind: 'Theorem',
      name: 'Trigonometric polynomials are uniformly dense',
      statement: String.raw`If $f$ is continuous with period $2\pi$ and $\eps>0$, then there is a trigonometric polynomial $P$ with $|P(x)-f(x)|<\eps$ for all real $x$.`,
      idea: String.raw`A $2\pi$-periodic function is a function on the unit circle $T$ via $x\mapsto e^{ix}$. Trigonometric polynomials form a self-adjoint algebra of continuous functions on the compact set $T$ that separates points and vanishes at no point, so the complex Stone–Weierstrass theorem (7.33) makes it dense in $\mathscr C(T)$ in the uniform metric. (A constructive choice of $P$ is the Fejér mean $\sigma_N$, used in the picture.)`,
      caption: String.raw`Drag the six knots to shape a continuous periodic $f$ (the ends are glued: $f(-\pi)=f(\pi)$), and pick $\eps$. The green curve is a trigonometric polynomial — the Fejér mean $\sigma_N$ with the first $N$ found for which it lies inside the blue $\eps$-band. Right: the same functions wrapped onto the circle $T$, the compact space on which Stone–Weierstrass is applied.`,
      deps: ['pma-7.33', 'pma-8.9'],
      see: ['rca-4.25'],
      tags: ['Fourier series', 'approximation'],
      viz(v) {
        const M = v.M;
        const K = 6, XS = M.range(K).map((k) => -PI + (TAU * k) / K);
        const L = v.stage({ x: [-PI, PI], y: [-2.2, 2.2], height: 320, xticks: PI_TICKS, title: '$f$, its $\\varepsilon$-band and a trigonometric polynomial $P$' });
        const C = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 320, title: 'the same, on the circle $T$: radius $1.4+0.35\\,f$' });
        const init = [0.4, 1.3, -0.2, -1.1, 0.9, -0.6];
        const hs = XS.map((x, k) => L.handle(x, init[k], { color: 'blue', r: 6.5, constrain: (_, y) => [x, M.clamp(y, -1.9, 1.9)] }));
        const eps = v.slider('$\\varepsilon$', 0.03, 0.6, 0.15, { step: 0.01 });
        const f = (x) => { const u = (wrap(x) + PI) / (TAU / K); const k = Math.floor(u) % K, t = u - Math.floor(u); return hs[k].y * (1 - t) + hs[(k + 1) % K].y * t; };
        let st = null, lastKey = '', coef = null;
        const NMAX = 160, xsS = M.linspace(-PI, PI, 361);
        const supErr = (N) => { let m = 0; for (const x of xsS) m = Math.max(m, Math.abs(fsum(coef, x, N, true) - f(x))); return m; };
        v.render(() => {
          const key = hs.map((h) => h.y.toFixed(4)).join(',');
          if (key !== lastKey) { lastKey = key; coef = fcoeffs(f, NMAX, 2048); }
          const e = eps.value;
          // find the first N (coarse grid, then refine) with sup|σ_N − f| < ε
          let found = null; const grid = [1, 2, 3, 4, 6, 8, 11, 15, 20, 27, 36, 48, 64, 85, 112, 140, NMAX];
          let prev = 0;
          for (const N of grid) { if (supErr(N) < e) { found = N; break; } prev = N; }
          if (found) { let lo = prev, hi = found; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (supErr(m) < e) hi = m; else lo = m; } found = hi; }
          const N = found ?? NMAX, err = supErr(N);
          L.between((x) => f(x) - e, (x) => f(x) + e, -PI, PI, { fill: 'blue', fillAlpha: 0.15, n: 400 });
          L.fn(f, { color: 'ink', width: 2.2 });
          L.fn((x) => fsum(coef, x, N, true), { color: 'green', width: 2.4 });
          // circle picture
          const rad = (y) => 1.4 + 0.35 * y;
          C.circle(0, 0, 1.4, { color: 'faint', width: 1, dash: [3, 4] });
          C.curve((t) => [rad(f(t) + e) * Math.cos(t), rad(f(t) + e) * Math.sin(t)], -PI, PI, { color: 'blue', width: 1, alpha: 0.5, n: 360 });
          C.curve((t) => [rad(f(t) - e) * Math.cos(t), rad(f(t) - e) * Math.sin(t)], -PI, PI, { color: 'blue', width: 1, alpha: 0.5, n: 360 });
          C.curve((t) => [rad(f(t)) * Math.cos(t), rad(f(t)) * Math.sin(t)], -PI, PI, { color: 'ink', width: 2.2, n: 360 });
          C.curve((t) => { const y = fsum(coef, t, N, true); return [rad(y) * Math.cos(t), rad(y) * Math.sin(t)]; }, -PI, PI, { color: 'green', width: 2.2, n: 360 });
          XS.forEach((x, k) => C.dot(rad(hs[k].y) * Math.cos(x), rad(hs[k].y) * Math.sin(x), { color: 'blue', r: 3.5 }));
          C.text('x = ±π', -2.15, 0, { color: 'muted', size: 11, align: 'left' });
          st = { N, err, e, found: !!found };
          v.legend([['ink', '$f$ (continuous, periodic)'], ['blue', '$\\varepsilon$-band', { area: true }], ['green', 'trigonometric polynomial $P=\\sigma_N(f)$']]);
        });
        v.readout(() => st && (st.found ? `$P=\\sigma_{${st.N}}(f)$ has degree $${st.N}$ and $\\sup_x|P(x)-f(x)|=${v.fix(st.err, 4)}<\\varepsilon=${v.fix(st.e, 2)}$.` : `Even $N=${st.N}$ gives $\\sup|P-f|=${v.fix(st.err, 4)}$; increase $\\varepsilon$ (a larger degree would be needed).`));
      },
    },
    // ------------------------------------------------------------------ 8.16
    {
      num: '8.16',
      kind: 'Theorem',
      name: "Parseval's theorem",
      statement: String.raw`Let $f$ and $g$ be Riemann-integrable with period $2\pi$, with $f(x)\sim\sum c_ne^{inx}$ and $g(x)\sim\sum\gamma_ne^{inx}$. Then
$$\lim_{N\to\infty}\frac1{2\pi}\int_{-\pi}^{\pi}|f(x)-s_N(f;x)|^2dx=0,$$
$$\frac1{2\pi}\int_{-\pi}^{\pi}f(x)\overline{g(x)}\,dx=\sum_{n=-\infty}^{\infty}c_n\overline{\gamma_n},\qquad\frac1{2\pi}\int_{-\pi}^{\pi}|f(x)|^2dx=\sum_{n=-\infty}^{\infty}|c_n|^2 .$$`,
      idea: String.raw`Given $\eps>0$, choose a continuous periodic $h$ with $\|f-h\|_2<\eps$ (step functions can be smoothed), then a trigonometric polynomial $P$ with $|h-P|<\eps$ everywhere (8.15). For $N\ge\deg P$, 8.11 gives $\|h-s_N(h)\|_2\le\|h-P\|_2<\eps$, and Bessel's inequality bounds $\|s_N(h)-s_N(f)\|_2\le\|h-f\|_2$; the triangle inequality yields $\|f-s_N(f)\|_2<3\eps$. The two identities follow by letting $N\to\infty$ in $\frac1{2\pi}\int s_N(f)\bar g=\sum_{|n|\le N}c_n\bar\gamma_n$ and using the Schwarz inequality.`,
      caption: String.raw`Choose $f$ and raise $N$. Top: $f$, $s_N(f)$ and the error shaded. Bottom left: the coefficient energies $|c_n|^2$, $|n|\le N$ in blue. Bottom right: the captured energy $\sum_{|n|\le N}|c_n|^2$ climbs to $\frac1{2\pi}\int|f|^2$ while the mean-square error falls to $0$ — even for discontinuous $f$, where $s_N(f)$ never converges uniformly. For $f(x)=x$ this is $\sum 1/n^2=\pi^2/6$.`,
      deps: ['pma-8.15', 'pma-8.11', 'pma-8.12', 'pma-8.13'],
      see: ['rca-4.18', 'rca-4.26'],
      tags: ['Fourier series', 'Parseval'],
      viz(v) {
        const M = v.M;
        const NMAX = 40;
        const FN = {
          saw: { label: 'sawtooth $x$', f: (x) => wrap(x), y: [-4.2, 4.2], br: [-PI, PI] },
          sq: { label: 'square wave', f: (x) => (wrap(x) >= 0 ? 1 : -1), y: [-1.7, 1.7], br: [-PI, 0, PI] },
          ind: { label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(wrap(x)) <= 1 ? 1 : 0), y: [-0.5, 1.5], br: [-PI, -1, 1, PI] },
          tri: { label: '$|x|$', f: (x) => Math.abs(wrap(x)), y: [-0.4, 3.6], br: [-PI, 0, PI] },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'saw');
        const nS = v.slider('$N$', 0, NMAX, 4, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-4.2, 4.2], height: 240, full: true, xticks: PI_TICKS, title: '$f$ and $s_N(f)$, error shaded' });
        const Bc = v.stage({ x: [-20.8, 20.8], y: [0, 1], height: 220, axes: 'box', xlabel: 'n', title: '$|c_n|^2$' });
        const En = v.stage({ x: [-0.5, NMAX + 0.5], y: [0, 1], height: 220, axes: 'box', xlabel: 'N', title: 'captured energy and mean-square error' });
        const cache = {};
        function data(key) {
          if (cache[key]) return cache[key];
          const f = FN[key].f, br = FN[key].br, c = fcoeffs(f, NMAX, 8192, br), e = c.map(([a, b]) => a * a + b * b);
          const tot = midP((x) => f(x) ** 2, br, 8000) / TAU;
          const cap = M.range(NMAX + 1).map((N) => { let s = 0; for (let n = -N; n <= N; n++) s += e[n + NMAX]; return s; });
          const mse = M.range(NMAX + 1).map((N) => midP((x) => (f(x) - fsum(c, x, N)) ** 2, br, 3000) / TAU);
          return (cache[key] = { c, e, tot, cap, mse });
        }
        let last = null, st = null;
        v.render(() => {
          const key = which.value, o = FN[key], f = o.f, N = nS.value, D = data(key);
          if (last !== key) { last = key; T.setView(null, o.y); }
          const sN = (x) => fsum(D.c, x, N);
          T.between(f, sN, -PI, PI, { fill: 'red', fillAlpha: 0.18, n: 800 });
          T.fn(f, { color: 'ink', width: 2.2, n: 1200 });
          T.fn(sN, { color: 'gold', width: 2.2, n: 1200 });
          // coefficient bars
          const emax = Math.max(...D.e.slice(NMAX - 20, NMAX + 21));
          Bc.setView(null, [0, emax * 1.12]);
          Bc.bars(D.e.slice(NMAX - 20, NMAX + 21), { x0: -20, color: (_, i) => (Math.abs(i - 20) <= N ? 'blue' : 'faint'), barWidth: 0.7 });
          // energy panel
          En.setView(null, [0, D.tot * 1.15]);
          En.hline(D.tot, { color: 'green', width: 1.8, dash: [6, 4] });
          En.text('(1/2π)∫|f|²', NMAX, D.tot, { align: 'right', baseline: 'bottom', dy: -3, color: 'green', size: 11.5, weight: 600 });
          En.path(D.cap.map((y, k) => [k, y]), { color: 'blue', width: 2.2 });
          En.path(D.mse.map((y, k) => [k, y]), { color: 'red', width: 2.2 });
          En.dot(N, D.cap[N], { color: 'blue', r: 5 }); En.dot(N, D.mse[N], { color: 'red', r: 5 });
          En.vline(N, { color: 'gold', width: 1.2 });
          const basel = key === 'saw' ? M.partialSums((k) => 1 / (k + 1) ** 2, Math.max(1, N))[Math.max(1, N) - 1] : null;
          st = { N, tot: D.tot, cap: D.cap[N], mse: D.mse[N], basel };
          v.legend([['ink', '$f$'], ['gold', '$s_N(f)$'], ['red', 'mean-square error $\\frac1{2\\pi}\\int|f-s_N|^2$'], ['blue', '$\\sum_{|n|\\le N}|c_n|^2$'], ['green', '$\\frac1{2\\pi}\\int|f|^2$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const s = `$N=${st.N}$: $\\sum_{|n|\\le N}|c_n|^2=${v.fix(st.cap, 4)}$, $\\frac1{2\\pi}\\int|f-s_N|^2=${v.fix(st.mse, 4)}$, sum $=${v.fix(st.cap + st.mse, 4)}$ $=\\frac1{2\\pi}\\int|f|^2=${v.fix(st.tot, 4)}$.`;
          return st.basel != null ? s + ` For $f(x)=x$, $c_n=\\frac{i(-1)^n}{n}$, so this reads $2\\sum_{n\\le N}\\frac1{n^2}\\to\\frac{\\pi^2}{3}$: $\\sum_{n\\le ${Math.max(1, st.N)}}\\frac1{n^2}=${v.fix(st.basel, 5)}$ vs $\\frac{\\pi^2}6=${v.fix(PI * PI / 6, 5)}$.` : s;
        });
      },
    },
  ],
};
