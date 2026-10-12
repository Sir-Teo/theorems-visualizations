// Rudin, Principles of Mathematical Analysis — Chapter 7 (part b2): 7.26–7.33
// The Weierstrass approximation theorem, algebras of functions and the Stone–Weierstrass
// theorem (real and complex). The chapter title lives in ch07.js.

/** log k! for k = 0..400 (for numerically stable Bernstein weights). */
const LOGFACT = (() => { const a = [0]; for (let k = 1; k <= 400; k++) a[k] = a[k - 1] + Math.log(k); return a; })();
/** Bernstein polynomial B_n(g) on [0,1] evaluated at s. */
function bernstein(g, n, s) {
  if (s <= 0) return g(0);
  if (s >= 1) return g(1);
  const ls = Math.log(s), l1 = Math.log(1 - s); let sum = 0;
  for (let k = 0; k <= n; k++) sum += g(k / n) * Math.exp(LOGFACT[n] - LOGFACT[k] - LOGFACT[n - k] + k * ls + (n - k) * l1);
  return sum;
}
/** Runs of indices i where pred(i) holds, as [[i0, i1], ...]. */
function runs(n, pred) {
  const out = []; let start = -1;
  for (let i = 0; i < n; i++) { if (pred(i)) { if (start < 0) start = i; } else if (start >= 0) { out.push([start, i - 1]); start = -1; } }
  if (start >= 0) out.push([start, n - 1]);
  return out;
}

export default {
  book: 'pma',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.26
    {
      num: '7.26',
      kind: 'Theorem',
      name: 'Weierstrass approximation theorem',
      statement: String.raw`Let $f$ be a continuous complex function on $[a,b]$. Then there are polynomials $P_n$ with $P_n(x)\to f(x)$ uniformly on $[a,b]$. If $f$ is real-valued, the $P_n$ can be chosen with real coefficients.`,
      idea: String.raw`By an affine change of variable, and by subtracting the linear polynomial $f(0)+x\,(f(1)-f(0))$, we may take $[a,b]=[0,1]$ and $f(0)=f(1)=0$; extend $f$ by $0$ outside $[0,1]$. Let $Q_n(x)=c_n(1-x^2)^n$ be normalised to have integral $1$ over $[-1,1]$ (the Landau kernels). Then
$$P_n(x)=\int_{-1}^{1}f(x+t)\,Q_n(t)\,dt=\int_0^1 f(t)\,Q_n(t-x)\,dt$$
is visibly a polynomial in $x$. Since $c_n<\sqrt n$, one gets $Q_n\le\sqrt n\,(1-\delta^2)^n$ on $\delta\le|x|\le1$, so the mass of $Q_n$ crowds into $(-\delta,\delta)$. Uniform continuity of $f$ (4.19) bounds the contribution of $|t|<\delta$ by $\eps/2$, and the tails contribute at most $4M\sqrt n(1-\delta^2)^n\to0$.`,
      caption: String.raw`Pick $f$ (each satisfies $f(0)=f(1)=0$) and the degree parameter $n$. Top: $f$ and the polynomial $P_n$, computed by honest quadrature of the integral. Drag the gold point: $P_n(x)$ is an average of $f$ weighted by the orange kernel $Q_n(t-x)$. Lower left: the kernel, with the mass beyond the draggable $\delta$ shaded and compared with Rudin's bound. Lower right: the uniform error against $n$ — it tends to $0$ even for the nowhere differentiable function of 7.18, though very slowly, since that function is so rough.`,
      deps: ['pma-4.19', 'pma-6.12', 'pma-7.9'],
      see: ['rca-4.25', 'rca-20.5'],
      tags: ['approximation', 'polynomials', 'uniform convergence'],
      viz(v) {
        const M = v.M, G = 500;
        const phi = (x) => Math.abs(x - 2 * Math.round(x / 2));
        const W = (x) => { let s = 0, a = 1, b = 1; for (let n = 0; n <= 7; n++) { s += a * phi(b * x); a *= 0.75; b *= 4; } return s; };
        const FN = {
          tent: { label: 'tent', f: (x) => 0.9 * Math.min(x / 0.35, (1 - x) / 0.65) },
          ramp: { label: 'steep ramp', f: (x) => 0.85 * M.clamp((x - 0.46) / 0.06, 0, 1) - 0.85 * x },
          rough: { label: 'rough (from 7.18)', f: (x) => 0.32 * (W(x) - x) },
        };
        const NS = [1, 2, 3, 4, 6, 8, 11, 16, 22, 32, 45, 64, 90, 128, 180, 256, 360, 500, 700, 1000];
        const fsel = v.select('$f$:', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'tent');
        const nsl = v.slider('$n$', 1, 1000, 20, { log: true, int: true });
        const ts = M.linspace(0, 1, G + 1);
        const Lg = Float64Array.from({ length: G + 1 }, (_, d) => (d < G ? Math.log(1 - (d / G) ** 2) : -Infinity));
        const In = (n) => { let I = 2; for (let k = 1; k <= n; k++) I *= (2 * k) / (2 * k + 1); return I; }; // ∫(1-t²)^n over [-1,1]
        function approx(fv, n) {
          const c = 1 / In(n);
          const K = Float64Array.from(Lg, (l) => c * Math.exp(n * l));
          const P = new Float64Array(G + 1);
          for (let i = 0; i <= G; i++) {
            let s = 0.5 * (fv[0] * K[i] + fv[G] * K[G - i]);
            for (let j = 1; j < G; j++) s += fv[j] * K[Math.abs(j - i)];
            P[i] = s / G;
          }
          return P;
        }
        const errOf = (P, fv) => { let e = 0; for (let i = 0; i <= G; i++) e = Math.max(e, Math.abs(P[i] - fv[i])); return e; };
        let cache = {};
        function data() {
          const key = fsel.value;
          if (cache.key !== key) {
            const fv = Float64Array.from(ts, FN[key].f);
            cache = { key, fv, P: new Map(), lo: Math.min(...fv), hi: Math.max(...fv) };
            cache.curve = NS.map((n) => { const P = approx(fv, n); cache.P.set(n, P); return [Math.log10(n), Math.log10(errOf(P, fv))]; });
          }
          const n = nsl.value;
          if (!cache.P.has(n)) cache.P.set(n, approx(cache.fv, n));
          return { ...cache, Pn: cache.P.get(n), n };
        }
        const A = v.stage({ x: [-0.04, 1.04], y: [-0.5, 1.05], height: 240, full: true, title: '$f$ and the polynomial $P_n(x)=\\int_0^1 f(t)\\,Q_n(t-x)\\,dt$' });
        const Wst = v.stage({ x: [-0.04, 1.04], y: [-0.08, 1.15], height: 80, full: true, axes: false, title: 'the weight $t\\mapsto Q_n(t-x)$ that $P_n(x)$ uses at the gold point $x$' });
        const Kst = v.stage({ x: [-1.06, 1.06], y: [-0.4, 5], height: 220, title: 'kernel $Q_n(t)=c_n(1-t^2)^n$; mass in $|t|\\ge\\delta$ shaded' });
        const Est = v.stage({ x: [-0.15, 3.12], y: [-3.2, 0.2], height: 220, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], yticks: [[0, '1'], [-1, '0.1'], [-2, '0.01'], [-3, '0.001']], title: 'uniform error $\\|P_n-f\\|$ against $n$ (log–log)' });
        const interp = (arr, x) => { const u = M.clamp(x, 0, 1) * G, i = Math.min(G - 1, Math.floor(u)), r = u - i; return arr[i] * (1 - r) + arr[i + 1] * r; };
        let cur = null;
        const hx = A.handle(0.62, 0.5, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0, 1); return [xx, cur ? interp(cur.Pn, xx) : 0]; } });
        const hd = Kst.handle(0.3, 0, { color: 'orange', label: 'δ', constrain: (x) => [M.clamp(x, 0.03, 0.95), 0] });
        let st = null;
        v.render(() => {
          const D = data(); cur = D;
          const n = D.n, fv = D.fv, Pn = D.Pn;
          // --- top panel
          A.setView(null, [D.lo - 0.12, D.hi + 0.14]);
          hx.y = interp(Pn, hx.x);
          const c = 1 / In(n), Q = (u) => (Math.abs(u) < 1 ? c * Math.pow(1 - u * u, n) : 0);
          const Qmax = c;
          Wst.hline(0, { color: 'faint', width: 1 });
          Wst.fn((t) => Q(t - hx.x) / Qmax, { domain: [0, 1], color: 'orange', width: 1.6, fill: 'orange', fillAlpha: 0.22, n: 600 });
          Wst.vline(hx.x, { color: 'gold', width: 1.2, dash: [3, 3] });
          A.path(ts.map((t, i) => [t, fv[i]]), { color: 'ink', width: 2 });
          A.path(ts.map((t, i) => [t, Pn[i]]), { color: 'accent', width: 2.6 });
          const fx = FN[fsel.value].f(hx.x);
          A.line(hx.x, fx, hx.x, hx.y, { color: 'red', width: 2 });
          A.dot(hx.x, fx, { color: 'ink', r: 3.5 });
          // --- kernel panel
          const dl = hd.x;
          Kst.setView(null, [-0.15 * Qmax * 1.12, Qmax * 1.12]);
          hd.y = 0;
          Kst.fn(Q, { domain: [-1, -dl], fill: 'red', fillAlpha: 0.3, stroke: false, n: 300 });
          Kst.fn(Q, { domain: [dl, 1], fill: 'red', fillAlpha: 0.3, stroke: false, n: 300 });
          Kst.fn(Q, { domain: [-1, 1], color: 'orange', width: 2.2, n: 800 });
          const rb = Math.sqrt(n) * Math.pow(1 - dl * dl, n);
          if (rb < Qmax * 1.1) Kst.line(dl, rb, 1, rb, { color: 'red', width: 1.4, dash: [4, 3] });
          Kst.vline(-dl, { color: 'orange', width: 1, dash: [3, 3] }); Kst.vline(dl, { color: 'orange', width: 1, dash: [3, 3] });
          const tail = 2 * (0.5 - M.integrate((t) => Q(t), 0, dl, 2000));
          // --- error panel
          Est.path(D.curve, { color: 'accent', width: 2 });
          Est.dots(D.curve, { color: 'accent', r: 3 });
          const err = errOf(Pn, fv);
          Est.dot(Math.log10(n), Math.log10(err), { color: 'gold', r: 6 });
          st = { n, err, dl, tail: Math.max(0, tail), bound: 2 * rb, x: hx.x, px: hx.y, fx };
        });
        v.legend([['ink', '$f$'], ['accent', '$P_n$ (degree $\\le 2n$)'], ['orange', 'Landau kernel $Q_n$', { area: true }], ['red', 'tail mass / Rudin bound $\\sqrt n(1-\\delta^2)^n$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$n=${s.n}$: $\\|P_n-f\\|=${v.fmt(s.err, 3)}$; at $x=${v.fix(s.x, 3)}$: $P_n(x)=${v.fix(s.px, 3)}$, $f(x)=${v.fix(s.fx, 3)}$. Tail mass beyond $\\delta=${v.fix(s.dl, 2)}$: $${v.fmt(s.tail, 3)}\\le 2\\sqrt n(1-\\delta^2)^n=${v.fmt(s.bound, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.27
    {
      num: '7.27',
      kind: 'Corollary',
      name: 'Polynomials vanishing at 0 that approximate |x|',
      statement: String.raw`For every $a>0$ there are real polynomials $P_n$ with $P_n(0)=0$ for all $n$ and $P_n(x)\to|x|$ uniformly on $[-a,a]$.`,
      idea: String.raw`Theorem 7.26 applied to $|x|$ on $[-a,a]$ gives real polynomials $P_n^*\to|x|$ uniformly; in particular $P_n^*(0)\to0$. Then $P_n=P_n^*-P_n^*(0)$ still converges uniformly to $|x|$ and has no constant term. That is exactly what Step 1 of 7.32 needs: for $f$ in an algebra $\mathscr A$ (which need not contain constants), $P_n\circ f$ is built from $f$ by sums, products and scalar multiples alone, and it converges uniformly to $|f|$.`,
      caption: String.raw`Left: $|x|$ on $[-a,a]$, an approximating sequence $P_n^*$ (here the Bernstein polynomials of $|x|$, one admissible choice from 7.26) and the shifted $P_n=P_n^*-P_n^*(0)$, which passes through the origin. Right: the same polynomials composed with a function $f$, taking $a=\|f\|$. Every $P_n\circ f$ lies in any algebra containing $f$, and it converges uniformly to $|f|$. Raise $n$ and watch both errors shrink.`,
      deps: ['pma-7.26'],
      tags: ['approximation', 'polynomials'],
      viz(v) {
        const M = v.M;
        const nsl = v.slider('degree $n$', 1, 160, 10, { int: true, log: true });
        const asl = v.slider('$a$', 0.5, 2, 1, { step: 0.05 });
        const A = v.stage({ x: [-1.1, 1.1], y: [-0.2, 1.1], height: 290, title: 'on $[-a,a]$: $|x|$, $P_n^*$ and $P_n=P_n^*-P_n^*(0)$' });
        const B = v.stage({ x: [-0.03, 1.03], y: [-1.3, 1.75], height: 290, title: 'composition: $P_n\\circ f\\to|f|$ with $a=\\|f\\|$' });
        const Pstar = (x, n, a) => bernstein((s) => Math.abs(a * (2 * s - 1)), n, (x + a) / (2 * a));
        const f = (x) => Math.sin(2 * Math.PI * x) * (0.7 + 0.5 * x) + 0.25 * Math.sin(7 * x);
        const xsB = M.linspace(0, 1, 400), fB = xsB.map(f), aB = Math.max(...fB.map(Math.abs));
        let st = null;
        v.render(() => {
          const n = nsl.value, a = asl.value;
          A.setView([-1.1 * a, 1.1 * a], [-0.22 * a, 1.12 * a]);
          const p0 = Pstar(0, n, a);
          const xs = M.linspace(-a, a, 401);
          const Ps = xs.map((x) => Pstar(x, n, a)), Pn = Ps.map((y) => y - p0);
          A.vband(-a, a, { color: 'faint', alpha: 0.08 });
          A.path(xs.map((x) => [x, Math.abs(x)]), { color: 'ink', width: 2 });
          A.path(xs.map((x, i) => [x, Ps[i]]), { color: 'orange', width: 1.8, dash: [6, 4] });
          A.path(xs.map((x, i) => [x, Pn[i]]), { color: 'accent', width: 2.6 });
          A.line(0, 0, 0, p0, { color: 'orange', width: 1.4, dash: [2, 3] });
          A.dot(0, p0, { color: 'orange', r: 4.5, label: 'P*ₙ(0)', labelPos: 'n', math: false, labelSize: 12 });
          A.dot(0, 0, { color: 'accent', r: 5, label: 'Pₙ(0) = 0', labelPos: 's', math: false, labelSize: 12 });
          const errA = Math.max(...xs.map((x, i) => Math.abs(Pn[i] - Math.abs(x))));
          // composition panel
          const pB = Pstar(0, n, aB);
          const comp = fB.map((y) => Pstar(y, n, aB) - pB);
          B.path(xsB.map((x, i) => [x, fB[i]]), { color: 'purple', width: 1.4, alpha: 0.8 });
          B.path(xsB.map((x, i) => [x, Math.abs(fB[i])]), { color: 'ink', width: 2 });
          B.path(xsB.map((x, i) => [x, comp[i]]), { color: 'green', width: 2.6 });
          const errB = Math.max(...comp.map((y, i) => Math.abs(y - Math.abs(fB[i]))));
          B.corner(`‖Pₙ∘f − |f|‖ = ${v.fmt(errB, 3)}`, 'tr', { color: 'green', weight: 600 });
          A.corner(`‖Pₙ − |x|‖ = ${v.fmt(errA, 3)}`, 'tl', { color: 'accent', weight: 600 });
          st = { n, a, p0, errA, errB, aB };
        });
        v.legend([['ink', '$|x|$, $|f|$'], ['orange', '$P_n^*$ (Bernstein)', { dash: true }], ['accent', '$P_n=P_n^*-P_n^*(0)$'], ['purple', '$f$'], ['green', '$P_n\\circ f$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$n=${s.n}$: on $[-${v.fix(s.a, 2)},${v.fix(s.a, 2)}]$, $\\|P_n-|x|\\|=${v.fmt(s.errA, 3)}$, $P_n^*(0)=${v.fmt(s.p0, 3)}\\to0$; for $\\|f\\|=${v.fix(s.aB, 3)}$, $\\|P_n\\circ f-|f|\\|=${v.fmt(s.errB, 3)}$, which never exceeds the error of $P_n$ on $[-\\|f\\|,\\|f\\|]$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.28
    {
      num: '7.28',
      kind: 'Definition',
      name: 'Algebras of functions; uniform closure',
      statement: String.raw`A family $\mathscr A$ of complex functions on a set $E$ is an **algebra** if $f+g\in\mathscr A$, $fg\in\mathscr A$ and $cf\in\mathscr A$ whenever $f,g\in\mathscr A$ and $c$ is a complex constant. (For an algebra of real functions, only real $c$ are required.) $\mathscr A$ is **uniformly closed** if every function on $E$ that is the uniform limit of a sequence from $\mathscr A$ itself belongs to $\mathscr A$. The set $\mathscr B$ of all such uniform limits is the **uniform closure** of $\mathscr A$.`,
      idea: String.raw`The polynomials on $[a,b]$ form an algebra, and the Weierstrass theorem (7.26) says precisely that its uniform closure is the set of all continuous functions on $[a,b]$. In the metric space of bounded functions with the sup-distance (7.14), the uniform closure is the topological closure. Note that an algebra need not contain the constants — the polynomials with zero constant term form an algebra.`,
      deps: ['pma-7.7'],
      tags: ['algebras', 'uniform convergence'],
    },

    // ------------------------------------------------------------------ 7.29
    {
      num: '7.29',
      kind: 'Theorem',
      name: 'The uniform closure of an algebra is an algebra',
      statement: String.raw`Let $\mathscr B$ be the uniform closure of an algebra $\mathscr A$ of bounded functions. Then $\mathscr B$ is a uniformly closed algebra.`,
      idea: String.raw`If $f_n\to f$ and $g_n\to g$ uniformly with $f_n,g_n\in\mathscr A$, then $f_n+g_n\to f+g$ and $cf_n\to cf$ uniformly. For products,
$$\|f_ng_n-fg\|\le\|f_n\|\,\|g_n-g\|+\|g\|\,\|f_n-f\|,$$
and boundedness keeps $\|f_n\|$ and $\|g\|$ finite (and $\|f_n\|$ bounded in $n$). Hence $\mathscr B$ is an algebra. It is uniformly closed because it is the closure of $\mathscr A$ in the sup-metric, and closures are closed (2.27).`,
      caption: String.raw`**Bounded case:** $f=e^x$ and $g=\cos 3x$ on $[-1,1]$ lie in the closure of the polynomials, approximated by their Taylor polynomials $f_n, g_n$. The product $f_ng_n$ converges uniformly to $fg$, and the bars stay under the product estimate. **Unbounded case:** on $(0,1]$, $f_n=1/x+1/n\to1/x$ uniformly, but $f_n^2-1/x^2=2/(nx)+1/n^2$ is unbounded. Products need not converge uniformly, and this is why the theorem assumes bounded functions.`,
      deps: ['pma-7.28', 'pma-2.27', 'pma-7.14'],
      tags: ['algebras', 'uniform convergence'],
      viz(v) {
        const M = v.M, NM = 14;
        const mode = v.select('', [{ value: 'b', label: 'bounded: $e^x,\\ \\cos 3x$ on $[-1,1]$' }, { value: 'u', label: 'unbounded: $1/x$ on $(0,1]$' }], 'b');
        const nsl = v.slider('$n$', 1, NM, 4, { int: true });
        const A = v.stage({ x: [-1.05, 1.05], y: [-3, 3], height: 280, full: true, title: 'the product $fg$ and its approximation $f_ng_n$' });
        const B = v.stage({ x: [0.3, NM + 0.7], y: [-5, 1.3], height: 220, axes: 'box', full: true, xticks: M.range(NM, 1), yticks: [[1, '10'], [0, '1'], [-1, '0.1'], [-2, '10⁻²'], [-3, '10⁻³'], [-4, '10⁻⁴'], [-5, '10⁻⁵']], title: 'sup-norm errors against $n$ (log scale)' });
        const taylorExp = (x, n) => { let s = 0, t = 1; for (let k = 0; k <= n; k++) { s += t; t *= x / (k + 1); } return s; };
        const taylorCos3 = (x, n) => { let s = 0, t = 1; const y = 3 * x; for (let j = 0; 2 * j <= n; j++) { s += t; t *= -(y * y) / ((2 * j + 1) * (2 * j + 2)); } return s; };
        const xsB = M.linspace(-1, 1, 801), xsU = M.linspace(0.004, 1, 800);
        const sup = (arr) => Math.max(...arr.map(Math.abs));
        const tab = M.range(NM, 1).map((n) => {
          const f = xsB.map(Math.exp), g = xsB.map((x) => Math.cos(3 * x));
          const fn = xsB.map((x) => taylorExp(x, n)), gn = xsB.map((x) => taylorCos3(x, n));
          return {
            ef: sup(fn.map((y, i) => y - f[i])), eg: sup(gn.map((y, i) => y - g[i])),
            ep: sup(fn.map((y, i) => y * gn[i] - f[i] * g[i])),
            bound: sup(fn) * sup(gn.map((y, i) => y - g[i])) + sup(g) * sup(fn.map((y, i) => y - f[i])),
          };
        });
        const lg = (y) => Math.max(-5.2, Math.log10(Math.max(y, 1e-12)));
        let st = null;
        v.render(() => {
          const n = nsl.value;
          if (mode.value === 'b') {
            A.setView([-1.05, 1.05], [-3, 3]);
            A.fn(Math.exp, { color: 'purple', width: 1.2, alpha: 0.6, domain: [-1, 1] });
            A.fn((x) => Math.cos(3 * x), { color: 'teal', width: 1.2, alpha: 0.6, domain: [-1, 1] });
            A.fn((x) => Math.exp(x) * Math.cos(3 * x), { color: 'ink', width: 2.2, domain: [-1, 1] });
            A.fn((x) => taylorExp(x, n) * taylorCos3(x, n), { color: 'accent', width: 2.6, domain: [-1, 1] });
            const T = tab[n - 1];
            A.corner(`‖fₙgₙ − fg‖ = ${v.fmt(T.ep, 3)}`, 'tl', { color: 'green', weight: 600 });
            B.setView(null, [-5.95, 1.3]);
            tab.forEach((r, i) => B.rect(i + 0.7, -5.45, i + 1.3, lg(r.ep), { fill: 'green', fillAlpha: i === n - 1 ? 0.85 : 0.4, stroke: false }));
            const bnd = tab.map((r, i) => [i + 1, lg(r.bound)]);
            B.path(bnd, { color: 'orange', width: 1.8, dash: [6, 4] }); B.dots(bnd, { color: 'orange', r: 3 });
            const inp = tab.map((r, i) => [i + 1, lg(r.ef + r.eg)]);
            B.path(inp, { color: 'accent', width: 1.4 }); B.dots(inp, { color: 'accent', r: 3 });
            st = { m: 'b', n, ...T };
            v.legend([['purple', '$f=e^x$'], ['teal', '$g=\\cos3x$'], ['ink', '$fg$'], ['accent', '$f_ng_n$; dots: $\\|f_n-f\\|+\\|g_n-g\\|$'], ['green', '$\\|f_ng_n-fg\\|$', { area: true }], ['orange', 'bound $\\|f_n\\|\\|g_n-g\\|+\\|g\\|\\|f_n-f\\|$', { dash: true }]]);
          } else {
            A.setView([-0.02, 1.02], [-4, 64]);
            A.fn((x) => 1 / (x * x), { color: 'ink', width: 2.2, domain: [0.05, 1] });
            A.fn((x) => (1 / x + 1 / n) ** 2, { color: 'red', width: 2.6, domain: [0.05, 1] });
            A.between((x) => (1 / x + 1 / n) ** 2, (x) => 1 / (x * x), 0.12, 1, { fill: 'red', fillAlpha: 0.15 });
            A.corner(`gap at x: 2/(${n}x) + 1/${n * n} → ∞ as x → 0`, 'tr', { color: 'red', weight: 600 });
            B.setView(null, [-1.85, 1.3]);
            for (let i = 0; i < NM; i++) {
              B.rect(i + 0.7, -1.6, i + 1.3, 1.3, { fill: 'red', fillAlpha: i === n - 1 ? 0.6 : 0.22, stroke: false });
              B.text('∞', i + 1, 1.05, { align: 'center', color: 'red', size: 13, weight: 700 });
            }
            const inp = M.range(NM, 1).map((k) => [k, Math.log10(1 / k)]);
            B.path(inp, { color: 'accent', width: 1.6 }); B.dots(inp, { color: 'accent', r: 3.5 });
            st = { m: 'u', n };
            v.legend([['ink', '$f^2=1/x^2$'], ['red', '$f_n^2=(1/x+1/n)^2$; bars: $\\|f_n^2-f^2\\|=\\infty$'], ['accent', '$\\|f_n-f\\|=1/n$']]);
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.m === 'b') return `$n=${s.n}$: $\\|f_n-f\\|=${v.fmt(s.ef, 3)}$, $\\|g_n-g\\|=${v.fmt(s.eg, 3)}$, $\\;\\|f_ng_n-fg\\|=${v.fmt(s.ep, 3)}\\le${v.fmt(s.bound, 3)}$ — so $fg$ is again a uniform limit of polynomials.`;
          return `$n=${s.n}$: $\\|f_n-f\\|=1/${s.n}$, yet $\\sup_{(0,1]}|f_n^2-f^2|=\\infty$ — without boundedness the closure need not be closed under products.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.30
    {
      num: '7.30',
      kind: 'Definition',
      name: 'Separating points; vanishing at no point',
      statement: String.raw`Let $\mathscr A$ be a family of functions on a set $E$.
(a) $\mathscr A$ **separates points** on $E$ if for every pair of distinct points $x_1,x_2\in E$ some $f\in\mathscr A$ has $f(x_1)\neq f(x_2)$.
(b) $\mathscr A$ **vanishes at no point** of $E$ if for every $x\in E$ some $g\in\mathscr A$ has $g(x)\ne0$.`,
      idea: String.raw`The polynomials on $\R$ have both properties. The even polynomials on $[-1,1]$ cannot separate $x$ from $-x$, and the polynomials with zero constant term all vanish at $0$. These are exactly the two obstructions that the Stone–Weierstrass theorem (7.32) rules out: every uniform limit of members of $\mathscr A$ inherits $f(x_1)=f(x_2)$ at pairs that $\mathscr A$ cannot separate, and $f(x)=0$ wherever all of $\mathscr A$ vanishes.`,
      caption: String.raw`Each algebra is generated by the functions on the right; if every generator takes the same value at $x_1$ and $x_2$ (or vanishes at $x$), so does every member of the algebra. Drag the point $(x_1,x_2)$ in the square. Red marks the pairs the algebra cannot separate — the anti-diagonal $x_2=-x_1$ for even polynomials, where the handle snaps. Red circles on the right mark points where the whole algebra vanishes.`,
      deps: ['pma-7.28'],
      tags: ['algebras', 'Stone–Weierstrass'],
      viz(v) {
        const M = v.M;
        const ALG = {
          poly: { label: 'all polynomials', gens: [['1', () => 1], ['x', (x) => x]], even: false, zero: false },
          even: { label: 'even polynomials', gens: [['1', () => 1], ['x^2', (x) => x * x]], even: true, zero: false },
          zero: { label: '$p(0)=0$', gens: [['x', (x) => x]], even: false, zero: true },
          even0: { label: 'even, $p(0)=0$', gens: [['x^2', (x) => x * x]], even: true, zero: true },
        };
        const alg = v.select('$\\mathscr A$:', Object.entries(ALG).map(([value, o]) => ({ value, label: o.label })), 'even');
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 320, title: 'pairs $(x_1,x_2)\\in[-1,1]^2$', xlabel: 'x₁', ylabel: 'x₂' });
        const R = v.stage({ x: [-1.12, 1.12], y: [-1.2, 1.3], height: 320, title: 'the generators of $\\mathscr A$ at $x_1$ (blue) and $x_2$ (orange)' });
        const P = L.handle(0.55, -0.55, { color: 'gold', label: '(x₁, x₂)', constrain: (x, y) => {
          x = M.clamp(x, -1, 1); y = M.clamp(y, -1, 1);
          if (ALG[alg.value].even && Math.abs(x + y) < 0.06) y = -x;
          return [x, y];
        } });
        const GC = ['teal', 'purple'];
        let st = null;
        v.render(() => {
          const A = ALG[alg.value], x1 = P.x, x2 = P.y;
          // left: the square of pairs
          L.rect(-1, -1, 1, 1, { fill: 'green', fillAlpha: 0.07, color: 'faint', width: 1 });
          L.line(-1, -1, 1, 1, { color: 'muted', width: 1.2, dash: [4, 4] });
          L.text('x₁ = x₂ (not a pair)', 0.97, 0.18, { align: 'right', color: 'muted', size: 11 });
          if (A.even) { L.line(-1, 1, 1, -1, { color: 'red', width: 4, alpha: 0.75 }); L.text('x₂ = −x₁: not separated', -0.95, -0.3, { color: 'red', size: 11.5, weight: 600 }); }
          if (A.zero) { L.dot(0, 0, { color: 'red', r: 6, hollow: true, width: 2.2 }); }
          L.line(x1, -1, x1, x2, { color: 'accent', width: 1, dash: [3, 3] });
          L.line(-1, x2, x1, x2, { color: 'orange', width: 1, dash: [3, 3] });
          // right: generators
          R.vline(x1, { color: 'accent', width: 1.4, dash: [4, 3] });
          R.vline(x2, { color: 'orange', width: 1.4, dash: [4, 3] });
          let sep = false;
          A.gens.forEach(([name, g], i) => {
            const col = GC[i % 2];
            R.fn(g, { domain: [-1, 1], color: col, width: 2.2 });
            const y1 = g(x1), y2 = g(x2), same = Math.abs(y1 - y2) < 1e-9;
            if (!same) sep = true;
            R.line(Math.min(x1, x2), y1, Math.max(x1, x2), y1, { color: same ? 'red' : col, width: same ? 2.2 : 1, dash: same ? null : [2, 3], alpha: 0.85 });
            R.dot(x1, y1, { color: 'accent', r: 5 }); R.dot(x2, y2, { color: 'orange', r: 5 });
            const xl = name === '1' ? -0.35 : 0.72;
            R.tex(name, xl, g(xl), { color: col, align: 'right', baseline: 'bottom', dx: -4, dy: -4 });
          });
          if (A.zero) { R.dot(0, 0, { color: 'red', r: 8, hollow: true, width: 2.4 }); R.text('all of 𝒜 vanishes at 0', 0.08, -0.32, { color: 'red', size: 11.5, weight: 600 }); }
          const pair = Math.abs(x1 - x2) > 1e-9;
          st = { x1, x2, sep, pair, A };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const pt = `$x_1=${v.fix(s.x1, 2)}$, $x_2=${v.fix(s.x2, 2)}$: `;
          const a = !s.pair ? 'the two points coincide.' : s.sep ? 'some generator takes different values, so $\\mathscr A$ **separates** them.' : 'every generator agrees there, hence so does every member of $\\mathscr A$ — **not separated**.';
          const b = s.A.zero ? ' Every member vanishes at $0$, so $\\mathscr A$ **vanishes** at $0$.' : ' The constant $1\\in\\mathscr A$, so $\\mathscr A$ vanishes at no point.';
          return pt + a + b;
        });
      },
    },

    // ------------------------------------------------------------------ 7.31
    {
      num: '7.31',
      kind: 'Theorem',
      name: 'Two-point interpolation in an algebra',
      statement: String.raw`Let $\mathscr A$ be an algebra of functions on a set $E$ that separates points on $E$ and vanishes at no point of $E$. If $x_1,x_2$ are distinct points of $E$ and $c_1,c_2$ are constants (real, if $\mathscr A$ is a real algebra), then some $f\in\mathscr A$ satisfies $f(x_1)=c_1$ and $f(x_2)=c_2$.`,
      idea: String.raw`Choose $g,h,k\in\mathscr A$ with $g(x_1)\ne g(x_2)$, $h(x_1)\ne0$ and $k(x_2)\ne0$, and form
$$u=gk-g(x_1)\,k,\qquad v=gh-g(x_2)\,h .$$
Only products and scalar multiples are used, so $u,v\in\mathscr A$ even if $\mathscr A$ has no constants. Now $u(x_1)=0\ne u(x_2)$ and $v(x_2)=0\ne v(x_1)$, so
$$f=\frac{c_1\,v}{v(x_1)}+\frac{c_2\,u}{u(x_2)}$$
takes the prescribed values — a Lagrange-style interpolation inside $\mathscr A$.`,
      caption: String.raw`Drag the two target points $(x_1,c_1)$ and $(x_2,c_2)$. The orange and purple curves are $u/u(x_2)$ and $v/v(x_1)$, which equal $1$ at one point and $0$ at the other; the green $f$ is their combination and passes through both targets. Neither of the first two algebras contains the constants. The last two break a hypothesis: the even polynomials cannot handle $x_2=-x_1$, and the polynomials vanishing at $0$ cannot prescribe a nonzero value at $0$. Both handles snap to these bad positions.`,
      deps: ['pma-7.30', 'pma-7.28'],
      tags: ['algebras', 'interpolation', 'Stone–Weierstrass'],
      viz(v) {
        const M = v.M;
        const ALG = {
          p0: { label: '$p(0)=0$ on $[\\tfrac14,2]$', K: [0.25, 2], y: [-2.2, 2.4], gens: [['x', (x) => x]], P: [[0.7, 1.3], [1.55, -0.8]] },
          exp: { label: 'polys in $e^{x}$, no constant', K: [-1, 1], y: [-2.2, 2.4], gens: [['e^{x}', (x) => Math.exp(x)]], P: [[-0.5, 1.4], [0.55, -0.9]] },
          even: { label: 'even polys on $[-1,1]$', K: [-1, 1], y: [-2.2, 2.4], gens: [['1', () => 1], ['x^2', (x) => x * x]], P: [[-0.3, 1.2], [0.75, -0.7]], snap: 'even' },
          zero: { label: '$p(0)=0$ on $[-1,1]$', K: [-1, 1], y: [-2.2, 2.4], gens: [['x', (x) => x]], P: [[-0.6, 1.0], [0.4, -0.9]], snap: 'zero' },
        };
        const alg = v.select('$\\mathscr A$:', Object.entries(ALG).map(([value, o]) => ({ value, label: o.label })), 'p0');
        const S = v.stage({ x: [0, 2.2], y: [-2.2, 2.4], height: 360, full: true, title: 'interpolating $c_1$ at $x_1$ and $c_2$ at $x_2$ inside $\\mathscr A$' });
        let P1, P2;
        const cons = (which) => (x, y) => {
          const A = ALG[alg.value];
          x = M.clamp(x, A.K[0], A.K[1]); y = M.clamp(y, A.y[0] + 0.1, A.y[1] - 0.1);
          if (A.snap === 'zero' && Math.abs(x) < 0.05) x = 0;
          if (A.snap === 'even') { const o = which === 1 ? P2 : P1; if (Math.abs(x + o.x) < 0.05) x = -o.x; }
          return [x, y];
        };
        P1 = S.handle(0.7, 1.3, { color: 'accent', label: '(x₁, c₁)', constrain: cons(1) });
        P2 = S.handle(1.55, -0.8, { color: 'orange', label: '(x₂, c₂)', constrain: cons(2) });
        let last = null, st = null;
        v.render(() => {
          const A = ALG[alg.value];
          if (last !== alg.value) {
            last = alg.value;
            const pad = (A.K[1] - A.K[0]) * 0.05;
            S.setView([A.K[0] - pad, A.K[1] + pad], A.y);
            P1.x = A.P[0][0]; P1.y = A.P[0][1]; P2.x = A.P[1][0]; P2.y = A.P[1][1];
          }
          const x1 = P1.x, c1 = P1.y, x2 = P2.x, c2 = P2.y;
          S.vband(A.K[0], A.K[1], { color: 'faint', alpha: 0.07 });
          S.hline(0, { color: 'faint', width: 1 }); S.hline(1, { color: 'faint', width: 1, dash: [2, 4] });
          const G = A.gens;
          const best = (score) => G[M.argmax(G, ([, g]) => score(g))];
          const [gn, g] = best((q) => Math.abs(q(x1) - q(x2)));
          const [hn, h] = best((q) => Math.abs(q(x1)));
          const [kn, k] = best((q) => Math.abs(q(x2)));
          const dg = g(x1) - g(x2), h1 = h(x1), k2 = k(x2);
          let fail = null;
          if (Math.abs(x1 - x2) < 1e-9) fail = 'same';
          else if (Math.abs(dg) < 1e-9) fail = 'sep';
          else if (Math.abs(h1) < 1e-9 || Math.abs(k2) < 1e-9) fail = 'van';
          let f = null;
          if (!fail) {
            const U = (t) => ((g(t) - g(x1)) * k(t)) / ((g(x2) - g(x1)) * k2);
            const V = (t) => ((g(t) - g(x2)) * h(t)) / (dg * h1);
            f = (t) => c1 * V(t) + c2 * U(t);
            S.fn(U, { domain: A.K, color: 'orange', width: 1.6, dash: [6, 4] });
            S.fn(V, { domain: A.K, color: 'purple', width: 1.6, dash: [6, 4] });
            S.fn(f, { domain: A.K, color: 'green', width: 3 });
            S.dot(x1, 0, { color: 'orange', r: 3.5 }); S.dot(x2, 1, { color: 'orange', r: 3.5 });
            S.dot(x1, 1, { color: 'purple', r: 3.5 }); S.dot(x2, 0, { color: 'purple', r: 3.5 });
          } else {
            const msg = fail === 'sep' ? 'every g ∈ 𝒜 has g(x₁) = g(x₂): no f with f(x₁) ≠ f(x₂)' : fail === 'van' ? 'all of 𝒜 vanishes at 0: f(0) must be 0' : 'x₁ = x₂';
            S.corner(msg, 'tl', { color: 'red', weight: 600 });
          }
          S.vline(x1, { color: 'accent', width: 1, dash: [3, 4], alpha: 0.6 });
          S.vline(x2, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6 });
          st = { fail, gn, hn, kn, x1, x2, c1, c2, f1: f ? f(x1) : NaN, f2: f ? f(x2) : NaN };
        });
        v.legend([['orange', '$u/u(x_2)$', { dash: true }], ['purple', '$v/v(x_1)$', { dash: true }], ['green', '$f=c_1\\,v/v(x_1)+c_2\\,u/u(x_2)$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.fail === 'sep') return `$\\mathscr A$ does not separate $x_1=${v.fix(s.x1, 2)}$ and $x_2=${v.fix(s.x2, 2)}$, so no member can take different values there — the hypothesis "separates points" is essential.`;
          if (s.fail === 'van') return 'Every member of $\\mathscr A$ vanishes at $0$, so a target with $c\\ne0$ at $x=0$ is out of reach — the hypothesis "vanishes at no point" is essential.';
          if (s.fail) return 'Move the points apart.';
          return `$g=${s.gn}$, $h=${s.hn}$, $k=${s.kn}$: $\\;u=gk-g(x_1)k$, $v=gh-g(x_2)h$. Check: $f(x_1)=${v.fix(s.f1, 4)}=c_1$, $\\;f(x_2)=${v.fix(s.f2, 4)}=c_2$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.32
    {
      num: '7.32',
      kind: 'Theorem',
      name: 'Stone–Weierstrass theorem (real version)',
      statement: String.raw`Let $\mathscr A$ be an algebra of real continuous functions on a compact set $K$. If $\mathscr A$ separates points on $K$ and vanishes at no point of $K$, then the uniform closure $\mathscr B$ of $\mathscr A$ consists of all real continuous functions on $K$.`,
      idea: String.raw`$\mathscr B$ is a uniformly closed algebra (7.29). **Step 1:** if $f\in\mathscr B$ then $|f|\in\mathscr B$, using the polynomials of 7.27 on $[-\|f\|,\|f\|]$, which have no constant term. **Step 2:** hence $\max(f,g)=\tfrac{f+g}2+\tfrac{|f-g|}2$ and $\min(f,g)$ lie in $\mathscr B$. **Step 3:** fix $f$, $x$ and $\eps$. By 7.31 each $y$ has $h_y\in\mathscr B$ with $h_y(x)=f(x)$, $h_y(y)=f(y)$. The open sets $J_y=\{h_y>f-\eps\}$ cover $K$, finitely many do by compactness, and $g_x=\max_j h_{y_j}$ satisfies $g_x(x)=f(x)$, $g_x>f-\eps$. **Step 4:** the open sets $V_x=\{g_x<f+\eps\}$ cover $K$; for finitely many of them $h=\min_i g_{x_i}$ satisfies $|h-f|<\eps$ on $K$. So $f\in\mathscr B$.`,
      caption: String.raw`$K=[-1,1]$ and $\mathscr A$ = polynomials, so the two-point interpolants $h_y$ can be taken to be chords of $f$ through $(x,f(x))$ and $(y,f(y))$. **Step 3:** drag $x$; the chords (orange) that a greedy finite subcover needs, their maximum $g_x$ (blue), and the open cover $\{J_y\}$ as bars below. **Step 4:** the minimum $h$ of finitely many $g_{x_i}$ (green) lies inside the $\eps$-band about $f$, and the bars show the cover $\{V_x\}$. **Hypothesis fails:** with even polynomials, every $h$ has $h(x)=h(-x)$, so $\|f-h\|\ge\|f_{\rm odd}\|$ for every $h$ in the closure.`,
      deps: ['pma-7.27', 'pma-7.29', 'pma-7.31', 'pma-7.30', 'pma-2.32'],
      see: ['fa-5.7', 'rca-4.25'],
      tags: ['Stone–Weierstrass', 'approximation', 'compactness'],
      viz(v) {
        const M = v.M, T = 401;
        const ts = M.linspace(-1, 1, T);
        const F = (t) => 0.4 * Math.sin(5.5 * t + 0.3) + 0.25 * Math.abs(t - 0.3) + 0.15 * t;
        const fv = Float64Array.from(ts, F);
        const mode = v.select('', [{ value: 's3', label: 'Step 3: $g_x=\\max_j h_{y_j}$' }, { value: 's4', label: 'Step 4: $h=\\min_i g_{x_i}$' }, { value: 'even', label: 'fails: even polynomials' }], 's3');
        const eps = v.slider('$\\varepsilon$', 0.06, 0.5, 0.15, { step: 0.01 });
        const S = v.stage({ x: [-1.1, 1.1], y: [-1.5, 1.0], height: 390, full: true, title: '$K=[-1,1]$ and the target $f$ (thick); bars below: the finite open cover' });
        const hx = S.handle(-0.35, F(-0.35), { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, -1, 1); return [xx, F(xx)]; } });
        const idx = (x) => Math.round((x + 1) / 2 * (T - 1));
        function chord(ix, iy) {
          if (iy === ix) return new Float64Array(T).fill(fv[ix]);
          const s = (fv[iy] - fv[ix]) / (ts[iy] - ts[ix]);
          return Float64Array.from(ts, (t) => fv[ix] + s * (t - ts[ix]));
        }
        function step3(ix, e) {
          const g = new Float64Array(T).fill(-Infinity), ys = [], hs = [];
          let iy = ix;
          for (let it = 0; it < 80 && iy >= 0; it++) {
            const h = chord(ix, iy); ys.push(iy); hs.push(h);
            for (let i = 0; i < T; i++) if (h[i] > g[i]) g[i] = h[i];
            iy = -1; for (let i = 0; i < T; i++) if (!(g[i] > fv[i] - e)) { iy = i; break; }
          }
          return { g, ys, hs };
        }
        let c4 = {};
        function step4(e) {
          if (c4.e === e) return c4;
          const h = new Float64Array(T).fill(Infinity), xs = [], gs = [];
          let ix = 0;
          for (let it = 0; it < 80 && ix >= 0; it++) {
            const r = step3(ix, e); xs.push(ix); gs.push(r.g);
            for (let i = 0; i < T; i++) if (r.g[i] < h[i]) h[i] = r.g[i];
            ix = -1; for (let i = 0; i < T; i++) if (!(h[i] < fv[i] + e)) { ix = i; break; }
          }
          c4 = { e, h, xs, gs };
          return c4;
        }
        const ROW0 = -0.98;
        const coverBars = (sets, col) => {
          const DR = Math.min(0.06, 0.45 / Math.max(1, sets.length));
          sets.forEach((pred, j) => {
            const y = ROW0 - j * DR;
            for (const [a, b] of runs(T, pred)) S.line(ts[a], y, ts[b], y, { color: col, width: 4, alpha: 0.75, cap: 'butt' });
          });
        };
        let st = null;
        v.render(() => {
          const e = eps.value, m = mode.value;
          hx.visible = m !== 's4';
          const ix = idx(hx.x);
          hx.y = F(hx.x);
          S.setView(null, m === 'even' ? [-0.8, 0.85] : [-1.5, 1.0]);
          if (m === 's3') {
            v.legend([['ink', '$f$'], ['accent', '$f-\\varepsilon$', { dash: true }], ['orange', 'chords $h_y$ and the cover $J_y=\\{h_y>f-\\varepsilon\\}$'], ['blue', '$g_x=\\max_j h_{y_j}$']]);
            const r = step3(ix, e);
            S.path(ts.map((t, i) => [t, fv[i] - e]), { color: 'accent', width: 1.2, dash: [5, 4] });
            r.hs.forEach((h) => S.path(ts.map((t, i) => (h[i] < ROW0 + 0.1 ? null : [t, h[i]])), { color: 'orange', width: 1.1, alpha: 0.65 }));
            S.path(ts.map((t, i) => [t, r.g[i]]), { color: 'blue', width: 3 });
            S.path(ts.map((t, i) => [t, fv[i]]), { color: 'ink', width: 2 });
            r.ys.forEach((iy) => S.dot(ts[iy], fv[iy], { color: 'orange', r: 3.5 }));
            coverBars(r.hs.map((h) => (i) => h[i] > fv[i] - e), 'orange');
            S.text('open cover {J_y}', -1.08, ROW0 + 0.06, { color: 'orange', size: 11, baseline: 'bottom' });
            S.tex('f-\\varepsilon', 0.99, fv[T - 1] - e, { color: 'accent', align: 'right', baseline: 'top', dy: 6, size: 13 });
            let gap = Infinity; for (let i = 0; i < T; i++) gap = Math.min(gap, r.g[i] - fv[i]);
            st = { m, n: r.ys.length, gap, e };
          } else if (m === 's4') {
            v.legend([['ink', '$f$'], ['accent', '$\\varepsilon$-band about $f$', { area: true }], ['blue', '$g_{x_i}$ and the cover $V_{x_i}=\\{g_{x_i}<f+\\varepsilon\\}$'], ['green', '$h=\\min_i g_{x_i}$']]);
            const r = step4(e);
            S.between((t) => F(t) + e, (t) => F(t) - e, -1, 1, { fill: 'accent', fillAlpha: 0.12, n: 400 });
            r.gs.forEach((g) => S.path(ts.map((t, i) => (g[i] < ROW0 + 0.1 ? null : [t, g[i]])), { color: 'blue', width: 1, alpha: 0.32 }));
            S.path(ts.map((t, i) => [t, fv[i]]), { color: 'ink', width: 2 });
            S.path(ts.map((t, i) => [t, r.h[i]]), { color: 'green', width: 3 });
            r.xs.forEach((i) => S.dot(ts[i], fv[i], { color: 'blue', r: 3.5 }));
            coverBars(r.gs.map((g) => (i) => g[i] < fv[i] + e), 'blue');
            S.text('open cover {V_x}', -1.08, ROW0 + 0.06, { color: 'blue', size: 11, baseline: 'bottom' });
            let err = 0; for (let i = 0; i < T; i++) err = Math.max(err, Math.abs(r.h[i] - fv[i]));
            st = { m, n: r.xs.length, err, e, chords: r.xs.length };
          } else {
            v.legend([['ink', '$f$'], ['muted', '$f(-x)$', { dash: true }], ['green', 'even part of $f$ (best even approximation)'], ['red', 'even part $\\pm\\|f_{\\rm odd}\\|$', { area: true }]]);
            const odd = (t) => (F(t) - F(-t)) / 2, ev = (t) => (F(t) + F(-t)) / 2;
            let on = 0, tstar = 0; for (const t of ts) if (Math.abs(odd(t)) > on) { on = Math.abs(odd(t)); tstar = t; }
            S.between((t) => ev(t) + on, (t) => ev(t) - on, -1, 1, { fill: 'red', fillAlpha: 0.1, n: 400 });
            S.fn((t) => F(-t), { domain: [-1, 1], color: 'muted', width: 1.3, dash: [5, 4] });
            S.fn(F, { domain: [-1, 1], color: 'ink', width: 2 });
            S.fn(ev, { domain: [-1, 1], color: 'green', width: 2.6 });
            const x = hx.x;
            S.line(x, F(x), -x, F(-x), { color: 'red', width: 1, dash: [3, 3] });
            S.dot(-x, F(-x), { color: 'red', r: 4.5, label: '−x', labelPos: 's' });
            S.dot(x, ev(x), { color: 'green', r: 4 }); S.dot(-x, ev(x), { color: 'green', r: 4 });
            S.measure(tstar, F(tstar), tstar, ev(tstar), '‖f_odd‖', { color: 'red', math: false, size: 11.5, offset: 30 });
            st = { m, on, e, x, fx: F(x), fmx: F(-x) };
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.m === 's3') return `$g_x$ is the maximum of ${s.n} chords $h_{y_j}$ (a finite subcover). It touches $f$ at $x$ and $\\min(g_x-f)=${v.fmt(s.gap, 3)}>-\\varepsilon=-${v.fix(s.e, 2)}$ ✓.`;
          if (s.m === 's4') return `$h=\\min_i g_{x_i}$ over ${s.n} points $x_i$: $\\|h-f\\|=${v.fmt(s.err, 3)}<\\varepsilon=${v.fix(s.e, 2)}$ ✓. Each $g_{x_i}$ is a max of chords, hence in $\\mathscr B$ by Steps 1–2.`;
          return `Even polynomials do not separate $x$ from $-x$: here $f(x)=${v.fix(s.fx, 3)}$ but $f(-x)=${v.fix(s.fmx, 3)}$, while every $h$ in the closure has $h(x)=h(-x)$. Hence $\\|f-h\\|\\ge\\|f_{\\rm odd}\\|=${v.fmt(s.on, 3)}$ for all of them, and the best choice is the even part of $f$ (green).`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.33
    {
      num: '7.33',
      kind: 'Theorem',
      name: 'Stone–Weierstrass theorem (complex version)',
      statement: String.raw`Call an algebra $\mathscr A$ of complex functions **self-adjoint** if $\bar f\in\mathscr A$ whenever $f\in\mathscr A$, where $\bar f(x)=\overline{f(x)}$. Let $\mathscr A$ be a self-adjoint algebra of complex continuous functions on a compact set $K$ that separates points on $K$ and vanishes at no point of $K$. Then the uniform closure of $\mathscr A$ consists of all complex continuous functions on $K$; that is, $\mathscr A$ is dense in $\mathscr C(K)$.`,
      idea: String.raw`Let $\mathscr A_\R$ be the set of real-valued members of $\mathscr A$. Self-adjointness gives $\Re f=\tfrac12(f+\bar f)\in\mathscr A_\R$ for every $f\in\mathscr A$. Using 7.31, take $f\in\mathscr A$ with $f(x_1)=1$, $f(x_2)=0$; then $\Re f$ separates $x_1$ and $x_2$. A suitable complex multiple $\lambda g$ of a $g$ with $g(x)\neq0$ has $\Re(\lambda g)(x)>0$, so $\mathscr A_\R$ vanishes nowhere. By 7.32, $\mathscr A_\R$ is dense in the real continuous functions; approximate $\Re f$ and $\Im f$ separately. Without self-adjointness the conclusion fails: on the unit circle the polynomials in $z$ separate points and vanish nowhere, yet $\int_0^{2\pi}p(e^{i\theta})e^{i\theta}\,d\theta=0$ for each of them, which keeps $\bar z$ at uniform distance $\ge1$.`,
      caption: String.raw`$K$ is the unit circle (dashed). Left: the image curve $\theta\mapsto f(e^{i\theta})$ in black, and the approximant $\sigma_N$ built from Fourier modes $|k|\le N$ (Fejér weights) — green when both $z^k$ and $\bar z^{k}$ are allowed (the self-adjoint algebra of trigonometric polynomials), red when only $z^0,\dots,z^N$ are (not self-adjoint). Drag $z$ around $K$ to compare $f(z)$ with the approximation. Right: the uniform error against $N$. The green curve tends to $0$; the red one never drops below the dashed $\beta=\big(\sum_{k<0}|\hat f(k)|^2\big)^{1/2}$, a lower bound for every polynomial in $z$.`,
      deps: ['pma-7.32', 'pma-7.31', 'pma-7.30'],
      see: ['rca-4.25', 'fa-5.7'],
      tags: ['Stone–Weierstrass', 'complex functions', 'approximation'],
      viz(v) {
        const M = v.M, S = 512, NM = 40, GP = 360;
        const TG = {
          conj: { label: '$f(z)=\\bar z$', f: (t) => [Math.cos(t), -Math.sin(t)] },
          mix: { label: '$f=0.6z+0.45\\bar z^{2}+0.25|\\Im z|$', f: (t) => [0.6 * Math.cos(t) + 0.45 * Math.cos(2 * t) + 0.25 * Math.abs(Math.sin(t)), 0.6 * Math.sin(t) - 0.45 * Math.sin(2 * t)] },
        };
        const tg = v.select('target', Object.entries(TG).map(([value, o]) => ({ value, label: o.label })), 'mix');
        const alg = v.select('algebra', [{ value: 'sa', label: '$z,\\bar z$ (self-adjoint)' }, { value: 'z', label: '$z$ only' }], 'sa');
        const nsl = v.slider('$N$', 0, NM, 6, { int: true });
        const A = v.stage({ x: [-1.75, 1.75], y: [-1.45, 1.45], equal: true, height: 340, ticks: false, title: 'values in $\\mathbb C$: $f(K)$ and the approximant' });
        const B = v.stage({ x: [-1, NM + 1], y: [-0.08, 1.6], height: 340, axes: 'box', title: 'uniform error $\\|f-\\sigma_N\\|$ on $K$' });
        const hz = A.handle(Math.cos(0.9), Math.sin(0.9), { color: 'gold', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const th = M.linspace(0, 2 * Math.PI, GP + 1);
        let cache = {};
        function data() {
          if (cache.key === tg.value) return cache;
          const f = TG[tg.value].f;
          const smp = M.range(S).map((j) => f((2 * Math.PI * j) / S));
          const coef = (k) => { let re = 0, im = 0; for (let j = 0; j < S; j++) { const a = (-2 * Math.PI * k * j) / S, c = Math.cos(a), s = Math.sin(a), [x, y] = smp[j]; re += x * c - y * s; im += x * s + y * c; } return [re / S, im / S]; };
          const C = new Map(); for (let k = -S / 2; k < S / 2; k++) C.set(k, coef(k));
          let beta2 = 0; for (let k = -S / 2; k < 0; k++) { const [a, b] = C.get(k); beta2 += a * a + b * b; }
          const vals = th.map(f);
          const approxAt = (N, sa, t) => { let re = 0, im = 0; for (let k = sa ? -N : 0; k <= N; k++) { const w = 1 - Math.abs(k) / (N + 1), [a, b] = C.get(k), c = Math.cos(k * t), s = Math.sin(k * t); re += w * (a * c - b * s); im += w * (a * s + b * c); } return [re, im]; };
          const errs = { sa: [], z: [] };
          for (let N = 0; N <= NM; N++) for (const sa of [true, false]) {
            let e = 0; th.forEach((t, i) => { const [x, y] = approxAt(N, sa, t); e = Math.max(e, Math.hypot(x - vals[i][0], y - vals[i][1])); });
            errs[sa ? 'sa' : 'z'].push(e);
          }
          cache = { key: tg.value, f, vals, beta: Math.sqrt(beta2), approxAt, errs };
          return cache;
        }
        let st = null;
        v.render(() => {
          const D = data(), N = nsl.value, sa = alg.value === 'sa';
          const col = sa ? 'green' : 'red';
          // left: images in C
          A.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4] });
          A.text('K', Math.cos(2.4) * 1.08, Math.sin(2.4) * 1.08, { color: 'muted', math: true, size: 15 });
          A.path(D.vals, { color: 'ink', width: 2.6 });
          const ap = th.map((t) => D.approxAt(N, sa, t));
          A.path(ap, { color: col, width: 2.2 });
          const t0 = Math.atan2(hz.y, hz.x), fz = D.f(t0), pz = D.approxAt(N, sa, t0);
          A.line(fz[0], fz[1], pz[0], pz[1], { color: col, width: 1.6, dash: [3, 3] });
          A.line(hz.x, hz.y, fz[0], fz[1], { color: 'gold', width: 1, dash: [2, 4], alpha: 0.7 });
          A.dot(fz[0], fz[1], { color: 'ink', r: 5, label: 'f(z)', labelPos: 'ne' });
          A.dot(pz[0], pz[1], { color: col, r: 5, label: 'σ_N(z)', labelPos: 'sw' });
          // right: errors
          const ptsSA = D.errs.sa.map((e, k) => [k, e]), ptsZ = D.errs.z.map((e, k) => [k, e]);
          B.hline(D.beta, { color: 'red', width: 1.5, dash: [6, 4] });
          B.text(`β = ${v.fmt(D.beta, 3)}`, NM, D.beta, { align: 'right', dy: -10, color: 'red', size: 11.5 });
          B.path(ptsZ, { color: 'red', width: sa ? 1.4 : 2.6, alpha: sa ? 0.55 : 1 });
          B.path(ptsSA, { color: 'green', width: sa ? 2.6 : 1.4, alpha: sa ? 1 : 0.55 });
          B.vline(N, { color: 'gold', width: 1.2, dash: [3, 3] });
          B.dot(N, D.errs.sa[N], { color: 'green', r: 5 }); B.dot(N, D.errs.z[N], { color: 'red', r: 5 });
          st = { N, sa, eSA: D.errs.sa[N], eZ: D.errs.z[N], beta: D.beta };
        });
        v.legend([['ink', '$f(K)$'], ['green', 'Fejér mean, modes $z^k,\\bar z^k$ (self-adjoint)'], ['red', 'modes $z^0,\\dots,z^N$ only'], ['red', 'lower bound $\\beta$ for all polynomials in $z$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$N=${s.N}$: self-adjoint algebra $\\|f-\\sigma_N\\|=${v.fmt(s.eSA, 3)}\\to0$; polynomials in $z$ alone: $${v.fmt(s.eZ, 3)}$, and **every** polynomial $p$ in $z$ has $\\|f-p\\|\\ge\\|f-p\\|_{L^2}\\ge\\beta=${v.fmt(s.beta, 3)}$, because $p$ has no negative Fourier modes.`;
        });
      },
    },
  ],
};
