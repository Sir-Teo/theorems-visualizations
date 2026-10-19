// Rudin, Real and Complex Analysis — Chapter 9: Fourier Transforms
// Part 1: formal properties, translation, Riemann–Lebesgue, the kernels H and h_λ (9.1–9.7).
// Later parts: ch09-a2.js (9.8–9.12), ch09-a3.js (9.13–9.16), ch09-a4.js (the Banach algebra L¹).
//
// Normalisation used everywhere (as in Rudin): dm = dx/√(2π), so
//   f̂(t) = ∫ f(x) e^{-ixt} dm(x),  (f*g)(x) = ∫ f(x-y) g(y) dm(y),  ‖f‖_p = (∫|f|^p dm)^{1/p}.

const S = 1 / Math.sqrt(2 * Math.PI); // dm = S dx
const sinc = (u) => (Math.abs(u) < 1e-6 ? 1 - (u * u) / 6 : Math.sin(u) / u);

// Graded midpoint quadrature of F over [a,b], split at `breaks` and into pieces of width ≤ maxw.
// The smootherstep substitution clusters nodes at every piece end, so jumps, kinks and
// |x−c|^{-1/2}-type singularities at break points are integrated accurately.
function quadB(F, a, b, breaks = [], n = 40, maxw = 1.5) {
  const pts = [a, ...breaks.filter((c) => c > a && c < b), b].sort((p, q) => p - q);
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const lo = pts[i], hi = pts[i + 1];
    if (!(hi > lo)) continue;
    const m = Math.max(1, Math.ceil((hi - lo) / maxw));
    for (let j = 0; j < m; j++) {
      const l = lo + ((hi - lo) * j) / m, w = (hi - lo) / m;
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n;
        const x = l + w * u * u * u * (10 - 15 * u + 6 * u * u);
        s += F(x) * w * 30 * u * u * (1 - u) * (1 - u) / n;
      }
    }
  }
  return s;
}

// Stock L¹ functions with closed-form transforms (Rudin's normalisation). ft returns [Re, Im].
const BASIC = {
  exp1: { label: '$e^{-x}\\chi_{(0,\\infty)}$', f: (x) => (x > 0 ? Math.exp(-x) : 0), ft: (t) => [S / (1 + t * t), (-S * t) / (1 + t * t)], L1: S, hat: '\\hat f(t)=\\frac{1}{\\sqrt{2\\pi}}\\,\\frac{1}{1+it}' },
  rect: { label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), ft: (t) => [2 * S * sinc(t), 0], L1: 2 * S, hat: '\\hat f(t)=\\sqrt{\\tfrac{2}{\\pi}}\\,\\frac{\\sin t}{t}' },
  tri: { label: '$(1-|x|)^+$', f: (x) => Math.max(0, 1 - Math.abs(x)), ft: (t) => [S * sinc(t / 2) ** 2, 0], L1: S, hat: '\\hat f(t)=\\frac{1}{\\sqrt{2\\pi}}\\Big(\\frac{\\sin(t/2)}{t/2}\\Big)^2' },
  gauss: { label: '$e^{-x^2/2}$', f: (x) => Math.exp(-x * x / 2), ft: (t) => [Math.exp(-t * t / 2), 0], L1: 1, hat: '\\hat f(t)=e^{-t^2/2}' },
};

// The base function of 9.2: f(x) = x e^{1−x} on (0,∞); f̂(t) = e/(√(2π)(1+it)²).
const f0 = (x) => (x > 0 ? x * Math.exp(1 - x) : 0);
const F0 = (u) => (u > 0 ? Math.E - (1 + u) * Math.exp(1 - u) : 0); // ∫_0^u f0
function f0hat(t) { const a = 1 - t * t, b = 2 * t, d = a * a + b * b; return [(Math.E * S * a) / d, (-Math.E * S * b) / d]; }
function f0hatD(t) { const c = 1 - 3 * t * t, d = 3 * t - t * t * t, q = c * c + d * d; return [(Math.E * S * -2 * d) / q, (Math.E * S * -2 * c) / q]; }
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

export default {
  collection: 'rca',
  chapter: 9,
  title: 'Fourier Transforms',
  summary: String.raw`The Fourier transform $\hat f(t)=\int f(x)e^{-ixt}\,dm(x)$ turns translation into modulation, dilation into inverse dilation and convolution into multiplication, and by the Riemann–Lebesgue lemma it maps $L^1$ into $C_0$. Using the explicit approximate identity $h_\lambda$ (the Poisson kernel of the half-plane), Rudin proves that $f$ is recovered from $\hat f$ whenever both are integrable, extends the transform to a unitary operator of $L^2$ (Plancherel), describes the closed translation-invariant subspaces of $L^2$, and identifies the complex homomorphisms of the convolution algebra $L^1$ with the points of the real line.`,
  items: [
    // ------------------------------------------------------------------ 9.1
    {
      num: '9.1',
      kind: 'Definition',
      name: 'Fourier transform of an L¹ function',
      credit: 'Fourier, 1822',
      statement: String.raw`In this chapter $m$ is Lebesgue measure on $\R$ divided by $\sqrt{2\pi}$: $\int f\,dm=\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}f(x)\,dx$. Accordingly $L^p$ means $L^p(m)$, with $\norm{f}_p=\big(\int|f|^p\,dm\big)^{1/p}$, and the convolution of $f,g\in L^1$ is $(f*g)(x)=\int f(x-y)g(y)\,dm(y)$.

The **Fourier transform** of $f\in L^1$ is the function on $\R$
$$\hat f(t)=\int_{-\infty}^{\infty}f(x)\,e^{-ixt}\,dm(x)\qquad(t\in\R).$$
The factor $1/\sqrt{2\pi}$ is built into $m$ so that the inversion and Plancherel formulas later in the chapter are perfectly symmetric.`,
      idea: String.raw`For each frequency $t$ the integrand is $f$ wound around the unit circle at speed $t$: $\hat f(t)$ measures how much of the oscillation $e^{ixt}$ is present in $f$. The integral converges absolutely because $|f(x)e^{-ixt}|=|f(x)|$, which also gives the trivial bound $|\hat f(t)|\le\norm f_1$. Convolutions of $L^1$ functions are again in $L^1$ by Fubini (8.14), so the definition applies to $f*g$ as well.`,
      caption: String.raw`Pick $f$ and drag the frequency $t$ along the axis of the right panel. Top: the real (blue) and imaginary (orange) parts of $f(x)e^{-ixt}$ — the faster the winding, the more they cancel. Bottom left: the running integral $\int_{-\infty}^{u}f(x)e^{-ixt}\,dm(x)$ traced in $\C$ as $u$ sweeps the line; it ends exactly at $\hat f(t)$ and never leaves the disc of radius $\norm f_1$.`,
      deps: ['rca-8.14', 'rca-1.31'],
      see: ['rca-4.23', 'pma-8.10'],
      tags: ['Fourier transform', 'L1'],
      viz(v) {
        const which = v.select('$f$', Object.entries(BASIC).map(([value, o]) => ({ value, label: o.label })), 'exp1');
        const top = v.stage({ x: [-4.5, 6.5], y: [-1.2, 1.25], height: 210, full: true, xlabel: 'x', title: 'the integrand $f(x)e^{-ixt}$' });
        const cpl = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, height: 300, axes: true, title: 'running integral $\\int_{-\\infty}^{u}f(x)\\,e^{-ixt}\\,dm(x)$' });
        const ft = v.stage({ x: [-8.5, 8.5], y: [-0.55, 1.12], height: 300, xlabel: 't', title: 'the transform $\\hat f(t)$' });
        const th = ft.handle(2.2, 0, { color: 'accent', constrain: (x) => [v.M.clamp(x, -8, 8), 0], label: 't', labelPos: 's' });
        const L = 12, N = 2400, dx = (2 * L) / N;
        let st = null;
        v.animate((time) => {
          const F = BASIC[which.value], t = th.x;
          const frac = Math.min(1, (time % 7) / 1.4);
          // integrand
          top.fn((x) => F.f(x), { color: 'faint', width: 1.2, dash: [4, 4] });
          top.fn((x) => -F.f(x), { color: 'faint', width: 1.2, dash: [4, 4] });
          top.fn((x) => F.f(x) * Math.cos(x * t), { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.12 });
          top.fn((x) => -F.f(x) * Math.sin(x * t), { color: 'orange', width: 1.8 });
          // running integral (midpoint rule, Δx = 0.01; break points are grid nodes)
          const pts = [[0, 0]]; let re = 0, im = 0, uNow = -L;
          const nNow = Math.round(N * frac);
          for (let k = 0; k < N; k++) {
            const x = -L + (k + 0.5) * dx, fx = F.f(x) * S * dx;
            re += fx * Math.cos(x * t); im -= fx * Math.sin(x * t);
            if (k < nNow) { if (k % 4 === 3 || k === nNow - 1) pts.push([re, im]); uNow = x + dx / 2; }
          }
          const full = [re, im];
          let partial = pts[pts.length - 1];
          const R = F.L1 * 1.18;
          cpl.setView([-R, R], [-R, R]);
          cpl.circle(0, 0, F.L1, { color: 'muted', width: 1, dash: [4, 4], fill: 'muted', fillAlpha: 0.05 });
          cpl.path(pts, { color: 'gold', width: 2.4 });
          const ex = F.ft(t);
          cpl.dot(ex[0], ex[1], { color: 'accent', r: 7, hollow: true, width: 2.4, label: 'f̂(t)', labelPos: ex[1] > 0 ? 'ne' : 'se' });
          cpl.dot(partial[0], partial[1], { color: 'gold', r: 4.5 });
          cpl.text('‖f‖₁', F.L1 * 0.72, F.L1 * 0.72, { color: 'muted', size: 11.5, align: 'left', dx: 4 });
          if (frac < 1) top.vline(uNow, { color: 'gold', width: 1.6 });
          top.corner(frac < 1 ? `u = ${v.fix(uNow, 2)}` : 'u = +∞', 'tr', { color: 'gold' });
          // transform panel
          const hmax = Math.max(...v.M.linspace(-8, 8, 161).map((s) => Math.hypot(...F.ft(s))));
          ft.setView(null, [-Math.max(0.55, hmax * 0.55), hmax * 1.15]);
          ft.fn((s) => Math.hypot(...F.ft(s)), { color: 'muted', width: 1.2, dash: [3, 4] });
          ft.fn((s) => F.ft(s)[0], { color: 'blue', width: 2.4 });
          if (which.value === 'exp1') ft.fn((s) => F.ft(s)[1], { color: 'orange', width: 2 });
          ft.vline(t, { color: 'accent', width: 1, dash: [3, 4], alpha: 0.6 });
          ft.dot(t, ex[0], { color: 'blue', r: 4.5 });
          if (which.value === 'exp1') ft.dot(t, ex[1], { color: 'orange', r: 4.5 });
          v.legend([['blue', 'real part'], ['orange', 'imaginary part'], ['gold', 'running integral'], ['muted', '$|\\hat f|$ and the bound $\\|f\\|_1$', { dash: true }]]);
          st = { t, full, ex, L1: F.L1, hat: F.hat };
        }, { period: 7 });
        v.readout(() => {
          if (!st) return '';
          const { t, full, ex, L1, hat } = st;
          const r4 = (x) => (Math.abs(x) < 5e-5 ? 0 : x);
          const c = (z) => `${v.fix(r4(z[0]), 4)} ${r4(z[1]) < 0 ? '-' : '+'} ${v.fix(Math.abs(r4(z[1])), 4)}\\,i`;
          return `$t=${v.fix(t, 2)}$: quadrature $\\int f e^{-ixt}dm = ${c(full)}$; closed form $${hat} = ${c(ex)}$; $\\;|\\hat f(t)| = ${v.fix(Math.hypot(...ex), 4)} \\le \\|f\\|_1 = ${v.fix(L1, 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2',
      kind: 'Proposition',
      name: 'Formal properties of the Fourier transform',
      statement: String.raw`Let $f\in L^1$ and let $\alpha,\lambda$ be real.
(a) If $g(x)=f(x)e^{i\alpha x}$, then $\hat g(t)=\hat f(t-\alpha)$.
(b) If $g(x)=f(x-\alpha)$, then $\hat g(t)=\hat f(t)e^{-i\alpha t}$.
(c) If $g\in L^1$ and $h=f*g$, then $\hat h(t)=\hat f(t)\hat g(t)$: convolution becomes pointwise multiplication.
(d) If $g(x)=\overline{f(-x)}$, then $\hat g(t)=\overline{\hat f(t)}$.
(e) If $\lambda>0$ and $g(x)=f(x/\lambda)$, then $\hat g(t)=\lambda\hat f(\lambda t)$.
(f) If $g(x)=-ixf(x)$ and $g\in L^1$, then $\hat f$ is differentiable and $\hat f'(t)=\hat g(t)$ for every $t$.`,
      idea: String.raw`(a), (b), (d), (e) are changes of variable in the defining integral, using that $m$ is invariant under translation and reflection and scales by $\lambda$ under $x\mapsto x/\lambda$. For (c), write $\hat h(t)$ as a double integral of $f(x-y)g(y)e^{-ixt}$, split $e^{-ixt}=e^{-i(x-y)t}e^{-iyt}$ and apply Fubini (8.14 guarantees absolute integrability). For (f), the difference quotient of $\hat f$ is $\int f(x)e^{-ixt}\frac{e^{-ixs}-1}{s}\,dm(x)$; the factor is bounded by $|x|$, so dominated convergence (1.34) lets $s\to0$ inside the integral.`,
      caption: String.raw`Choose a rule and move its parameter. Left: $f(x)=xe^{1-x}$ on $(0,\infty)$ (dashed) and the new function $g$ (real part blue, imaginary part orange). Right: the curves are the predicted transform from the formula; the gold dots are $\hat g$ computed independently by quadrature of $\int g(x)e^{-ixt}\,dm(x)$. Translation only rotates phases ($|\hat g|=|\hat f|$, dashed), modulation slides the spectrum, and dilating $f$ compresses $\hat f$.`,
      deps: ['rca-9.1', 'rca-8.14', 'rca-8.8', 'rca-1.34'],
      tags: ['Fourier transform', 'convolution'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 9.2 and proof, pp. 179–180'],
      viz(v) {
        const MODES = [
          { value: 'a', label: '(a) modulate' }, { value: 'b', label: '(b) translate' }, { value: 'c', label: '(c) convolve' },
          { value: 'd', label: '(d) reflect' }, { value: 'e', label: '(e) dilate' }, { value: 'f', label: '(f) times $-ix$' },
        ];
        const mode = v.select('', MODES, 'b');
        const al = v.slider('$\\alpha$', -3, 3, 1.5, { step: 0.01 });
        const wa = v.slider('half-width $a$ of $\\chi_{[-a,a]}$', 0.1, 2, 0.8, { step: 0.01 });
        const la = v.slider('$\\lambda$', 0.3, 2.5, 1.8, { step: 0.01 });
        const X = v.stage({ x: [-5, 11], y: [-1.2, 1.3], height: 290, xlabel: 'x', title: 'space: $f$ and $g$' });
        const T = v.stage({ x: [-8, 8], y: [-1.3, 1.3], height: 290, xlabel: 't', title: 'frequency: $\\hat g$' });
        // g as [re, im] and the predicted transform
        const G = {
          a: (x, p) => { const y = f0(x); return [y * Math.cos(p.al * x), y * Math.sin(p.al * x)]; },
          b: (x, p) => [f0(x - p.al), 0],
          c: (x, p) => [S * (F0(x + p.a) - F0(x - p.a)), 0],
          d: (x) => [f0(-x), 0],
          e: (x, p) => [f0(x / p.la), 0],
          f: (x) => [0, -x * f0(x)],
        };
        const H = {
          a: (t, p) => f0hat(t - p.al),
          b: (t, p) => cmul(f0hat(t), [Math.cos(p.al * t), -Math.sin(p.al * t)]),
          c: (t, p) => { const k = 2 * p.a * S * sinc(p.a * t); const z = f0hat(t); return [z[0] * k, z[1] * k]; },
          d: (t) => { const z = f0hat(t); return [z[0], -z[1]]; },
          e: (t, p) => { const z = f0hat(p.la * t); return [p.la * z[0], p.la * z[1]]; },
          f: (t) => f0hatD(t),
        };
        const FORM = {
          a: (p) => `g(x)=e^{i\\alpha x}f(x)\\;\\Rightarrow\\;\\hat g(t)=\\hat f(t-${v.fix(p.al, 2)})`,
          b: (p) => `g(x)=f(x-\\alpha)\\;\\Rightarrow\\;\\hat g(t)=\\hat f(t)\\,e^{-i(${v.fix(p.al, 2)})t},\\ |\\hat g|=|\\hat f|`,
          c: () => `g=f*\\chi_{[-a,a]}\\;\\Rightarrow\\;\\hat g=\\hat f\\cdot\\widehat{\\chi_{[-a,a]}}=\\hat f(t)\\,\\sqrt{\\tfrac2\\pi}\\,\\tfrac{\\sin at}{t}`,
          d: () => `g(x)=\\overline{f(-x)}\\;\\Rightarrow\\;\\hat g=\\overline{\\hat f}`,
          e: (p) => `g(x)=f(x/\\lambda)\\;\\Rightarrow\\;\\hat g(t)=${v.fix(p.la, 2)}\\,\\hat f(${v.fix(p.la, 2)}\\,t)`,
          f: () => `g(x)=-ixf(x)\\;\\Rightarrow\\;\\widehat g=(\\widehat f)'`,
        };
        const XQ0 = -40, XQ1 = 40, DQ = 0.01, NQ = Math.round((XQ1 - XQ0) / DQ);
        const TS = v.M.linspace(-7.8, 7.8, 40);
        let cacheKey = '', quad = [], st = null;
        v.render(() => {
          const m = mode.value, p = { al: al.value, a: wa.value, la: la.value };
          al.el.hidden = !(m === 'a' || m === 'b'); wa.el.hidden = m !== 'c'; la.el.hidden = m !== 'e';
          const key = `${m}|${p.al}|${p.a}|${p.la}`;
          if (key !== cacheKey) {
            cacheKey = key;
            const gr = new Float64Array(NQ), gi = new Float64Array(NQ);
            for (let k = 0; k < NQ; k++) { const z = G[m](XQ0 + (k + 0.5) * DQ, p); gr[k] = z[0]; gi[k] = z[1]; }
            quad = TS.map((t) => {
              // Σ g(x_k) e^{-i x_k t} Δx S via a rotation recurrence
              let cr = Math.cos((XQ0 + 0.5 * DQ) * t), ci = -Math.sin((XQ0 + 0.5 * DQ) * t);
              const wr = Math.cos(DQ * t), wi = -Math.sin(DQ * t);
              let sr = 0, si = 0;
              for (let k = 0; k < NQ; k++) {
                sr += gr[k] * cr - gi[k] * ci; si += gr[k] * ci + gi[k] * cr;
                const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
              }
              return [sr * S * DQ, si * S * DQ];
            });
          }
          // space panel
          const gs = v.M.linspace(-5, 11, 240).map((x) => G[m](x, p));
          const gmax = Math.max(1, ...gs.map((z) => Math.max(z[0], z[1])));
          const gmin = Math.min(0, ...gs.map((z) => Math.min(z[0], z[1])));
          X.setView(null, [Math.min(-0.15, gmin * 1.12) - 0.05, gmax * 1.18]);
          X.fn(f0, { color: 'muted', width: 1.6, dash: [5, 4] });
          X.fn((x) => G[m](x, p)[0], { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.1 });
          if (m === 'a' || m === 'f') X.fn((x) => G[m](x, p)[1], { color: 'orange', width: 2 });
          if (m === 'c') X.fn((x) => (Math.abs(x) <= p.a ? 1 : 0), { color: 'purple', width: 1.6, n: 1600 });
          X.tex('f', 1.15, 1.02, { color: 'muted', align: 'left', baseline: 'bottom', dx: 3 });
          // frequency panel
          const curve = v.M.linspace(-8, 8, 321).map((t) => H[m](t, p));
          const hmax = Math.max(...curve.map((z) => Math.hypot(...z)), ...v.M.linspace(-8, 8, 161).map((t) => Math.hypot(...f0hat(t))));
          T.setView(null, [-hmax * 1.08, hmax * 1.15]);
          T.fn((t) => Math.hypot(...f0hat(t)), { color: 'muted', width: 1.4, dash: [5, 4] });
          T.fn((t) => H[m](t, p)[0], { color: 'blue', width: 2.4 });
          T.fn((t) => H[m](t, p)[1], { color: 'orange', width: 2.2 });
          T.dots(quad.map((z, i) => [TS[i], z[0]]), { color: 'gold', r: 3 });
          T.dots(quad.map((z, i) => [TS[i], z[1]]), { color: 'gold', r: 3 });
          if (m === 'a') T.arrow(0, hmax * 1.04, p.al, hmax * 1.04, { color: 'accent', width: 1.6, head: 8 });
          if (m === 'c') T.fn((t) => 2 * p.a * S * sinc(p.a * t), { color: 'purple', width: 1.6, dash: [5, 4] });
          let err = 0; TS.forEach((t, i) => { const z = H[m](t, p); err = Math.max(err, Math.hypot(z[0] - quad[i][0], z[1] - quad[i][1])); });
          st = { err, form: FORM[m](p) };
          v.legend([['muted', '$f$, $|\\hat f|$', { dash: true }], ['blue', 'real part'], ['orange', 'imaginary part'], ...(m === 'c' ? [['purple', '$\\chi_{[-a,a]}$ and its transform']] : []), ['gold', '$\\hat g$ by quadrature', { dot: true }]]);
        });
        v.readout(() => st && `$${st.form}$ — largest gap between formula and quadrature: $${v.sci(st.err, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5',
      kind: 'Theorem',
      name: 'Translation is uniformly continuous in Lᵖ (p < ∞)',
      statement: String.raw`For a function $f$ on $\R$ and $y\in\R$ let $f_y(x)=f(x-y)$ be the translate of $f$ by $y$. If $1\le p<\infty$ and $f\in L^p$, then $y\mapsto f_y$ is a uniformly continuous map of $\R$ into $L^p$.`,
      idea: String.raw`Given $\eps>0$ choose $g\in C_c(\R)$ with $\norm{f-g}_p<\eps$ (3.14). A continuous function with compact support is uniformly continuous, so $\norm{g_s-g_t}_p<\eps$ once $|s-t|$ is small. Since $m$ is translation invariant, $\norm{f_s-g_s}_p=\norm{f-g}_p$, and the triangle inequality gives $\norm{f_s-f_t}_p<3\eps$. For $p=\infty$ the first step fails ($C_c$ is not dense in $L^\infty$), and so does the theorem.`,
      caption: String.raw`Choose $f$ and $p$, then drag the shift $y$. Top: $f$ (black), $f_y$ (blue) and $|f_y-f|$ (orange). Bottom: $y\mapsto\norm{f_y-f}_p$, computed by quadrature. By translation invariance $\norm{f_s-f_t}_p=\norm{f_{s-t}-f}_p$, so continuity of this curve at $0$ is exactly uniform continuity. Select $p=\infty$ with the step function to see the hypothesis $p<\infty$ fail: the curve jumps to $1$.`,
      deps: ['rca-3.14', 'rca-3.5'],
      tags: ['Lp', 'translation'],
      viz(v) {
        const FUN = {
          step: { label: 'step $\\chi_{[0,1]}$', f: (x) => (x >= 0 && x <= 1 ? 1 : 0), br: [0, 1], inf: true, y: [-0.25, 1.3] },
          spike: { label: 'spike $|x|^{-1/3}$ on $[-1,1]$', f: (x) => (Math.abs(x) <= 1 && x !== 0 ? Math.abs(x) ** (-1 / 3) : 0), br: [-1, 0, 1], inf: false, y: [-0.3, 3.2] },
          tent: { label: 'tent $(1-|x|)^+$', f: (x) => Math.max(0, 1 - Math.abs(x)), br: [-1, 0, 1], inf: true, y: [-0.25, 1.3] },
        };
        const which = v.select('$f$', Object.entries(FUN).map(([value, o]) => ({ value, label: o.label })), 'step');
        const pSel = v.select('$p$', [{ value: '1', label: '$p=1$' }, { value: '2', label: '$p=2$' }, { value: 'inf', label: '$p=\\infty$' }], '2');
        const top = v.stage({ x: [-2.2, 3.2], y: [-0.25, 1.3], height: 230, full: true, axes: 'box', xlabel: 'x' });
        const bot = v.stage({ x: [-1.6, 1.6], y: [-0.05, 1.2], height: 200, full: true, axes: true, xlabel: 'y', title: '$y\\mapsto\\|f_y-f\\|_p$' });
        const yh = bot.handle(0.35, 0, { color: 'accent', constrain: (x) => [v.M.clamp(x, -1.5, 1.5), 0], label: 'y', labelPos: 's' });
        function dist(F, y, p) {
          if (Math.abs(y) < 1e-12) return 0;
          const br = [...F.br, ...F.br.map((b) => b + y)];
          if (p === Infinity) {
            let m = 0; for (let x = -2.6; x <= 3.6; x += 0.0007) m = Math.max(m, Math.abs(F.f(x - y) - F.f(x)));
            return m;
          }
          return (S * quadB((x) => Math.abs(F.f(x - y) - F.f(x)) ** p, -1.1 + Math.min(0, y), 1.1 + Math.max(0, y), br, 48, 0.5)) ** (1 / p);
        }
        let key = '', curve = [], st = null;
        v.render(() => {
          const F = FUN[which.value], p = pSel.value === 'inf' ? Infinity : +pSel.value;
          top.setView(null, F.y);
          top.setTicks(null, which.value === 'spike' ? [1, 2, 3] : [0.5, 1]);
          const y = yh.x;
          const bad = p === Infinity && !F.inf;
          // top panel
          top.between((x) => Math.abs(F.f(x - y) - F.f(x)), () => 0, -2.2, 3.2, { fill: 'orange', fillAlpha: 0.28, n: 900 });
          top.fn(F.f, { color: 'ink', width: 2.2, n: 1400 });
          top.fn((x) => F.f(x - y), { color: 'blue', width: 2.2, n: 1400 });
          top.tex('f', F.br[F.br.length - 1] - 0.15, F.y[1] * 0.82, { color: 'ink' });
          top.tex('f_y', F.br[F.br.length - 1] + y + 0.25, F.y[1] * 0.82, { color: 'blue' });
          if (bad) {
            bot.corner('f ∉ L^∞: the spike is unbounded — the hypothesis f ∈ Lᵖ fails', 'tl', { color: 'red', weight: 600 });
            st = { bad: true }; return;
          }
          const k = `${which.value}|${p}`;
          if (k !== key) {
            key = k;
            const ys = v.M.linspace(-1.5, 1.5, 151);
            curve = ys.map((s) => [s, dist(F, s, p)]);
          }
          const d = dist(F, y, p);
          const jump = p === Infinity && which.value === 'step';
          const ymax = Math.max(...curve.map((q) => q[1]));
          bot.setView(null, [-0.17 * ymax - 0.02, ymax * 1.25 + 0.05]);
          bot.path(jump ? curve.map((q) => (Math.abs(q[0]) < 1e-9 ? null : q)) : curve, { color: jump ? 'red' : 'green', width: 2.4 });
          if (jump) { bot.dot(0, 1, { color: 'red', r: 4.5, hollow: true }); bot.dot(0, 0, { color: 'red', r: 4.5 }); }
          bot.dot(y, d, { color: 'accent', r: 5.5 });
          bot.line(y, 0, y, d, { color: 'accent', width: 1, dash: [3, 3] });
          bot.corner(jump ? 'ess sup |f(x−y) − f(x)| = 1 for every y ≠ 0: discontinuous at y = 0' : 'continuous at y = 0 ⇒ uniformly continuous', 'tl', { color: jump ? 'red' : 'green', weight: 600 });
          v.legend([['ink', '$f$'], ['blue', '$f_y$'], ['orange', '$|f_y-f|$', { area: true }], [jump ? 'red' : 'green', '$\\|f_y-f\\|_p$']]);
          st = { y, d, p };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.bad) return 'With $p=\\infty$ the spike is not even in $L^p$; choose $p=1$ or $2$.';
          const pl = st.p === Infinity ? '\\infty' : st.p;
          return `$y=${v.fix(st.y, 3)}$: $\\;\\|f_y-f\\|_{${pl}} = ${v.fix(st.d, 4)}$` + (which.value === 'step' && st.p !== Infinity ? ` (exactly $(2|y|/\\sqrt{2\\pi})^{1/${st.p}} = ${v.fix((2 * Math.min(Math.abs(st.y), 1) * S) ** (1 / st.p), 4)}$ for $|y|\\le1$)` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6',
      kind: 'Theorem',
      name: 'Riemann–Lebesgue lemma: f̂ ∈ C₀(ℝ)',
      credit: 'Riemann & Lebesgue, 1854',
      statement: String.raw`If $f\in L^1$, then $\hat f\in C_0(\R)$ and $\norm{\hat f}_\infty\le\norm f_1$. That is, $\hat f$ is continuous, bounded by $\norm f_1$, and $\hat f(t)\to0$ as $|t|\to\infty$.`,
      idea: String.raw`The bound is $|e^{-ixt}|=1$; continuity follows from dominated convergence (1.34). For the decay, use $e^{i\pi}=-1$: substituting $x\mapsto x+\pi/t$ gives $\hat f(t)=-\int f(x-\pi/t)e^{-ixt}\,dm(x)$, and averaging with the definition
$$2\hat f(t)=\int\big[f(x)-f(x-\tfrac{\pi}{t})\big]e^{-ixt}\,dm(x),\qquad |\hat f(t)|\le\tfrac12\norm{f-f_{\pi/t}}_1 .$$
The right side tends to $0$ as $|t|\to\infty$ by the continuity of translation in $L^1$ (9.5).`,
      caption: String.raw`Choose $f$ (the last one is unbounded but integrable) and drag $t$. Top: $f$ and its translate by $\pi/t$, with $|f-f_{\pi/t}|$ shaded. Bottom: $|\hat f(t)|$ (blue, exact formula) under the uniform bound $\norm f_1$ (grey) and under Rudin's bound $\frac12\norm{f-f_{\pi/t}}_1$ (green, by quadrature), which is squeezed to $0$ as the shift $\pi/t$ shrinks.`,
      deps: ['rca-9.5', 'rca-9.1', 'rca-1.34', 'rca-3.16'],
      see: ['rca-5.14', 'pma-8.12'],
      tags: ['Riemann–Lebesgue', 'C0'],
      viz(v) {
        const FUN = {
          rect: { label: '$\\chi_{[-1,1]}$', f: BASIC.rect.f, a: (t) => Math.abs(BASIC.rect.ft(t)[0]), L1: 2 * S, br: [-1, 1], ymax: 1.25 },
          tri: { label: '$(1-|x|)^+$', f: BASIC.tri.f, a: (t) => BASIC.tri.ft(t)[0], L1: S, br: [-1, 0, 1], ymax: 1.25 },
          exp2: { label: '$e^{-|x|}$', f: (x) => Math.exp(-Math.abs(x)), a: (t) => (2 * S) / (1 + t * t), L1: 2 * S, br: [0], ymax: 1.25 },
          spike: { label: '$|x|^{-1/2}e^{-|x|}$', f: (x) => (x === 0 ? 0 : Math.exp(-Math.abs(x)) / Math.sqrt(Math.abs(x))), a: (t) => 2 * S * Math.sqrt(Math.PI) * (1 + t * t) ** -0.25 * Math.cos(Math.atan(t) / 2), L1: Math.sqrt(2), br: [0], ymax: 3.4 },
        };
        const which = v.select('$f$', Object.entries(FUN).map(([value, o]) => ({ value, label: o.label })), 'rect');
        const top = v.stage({ x: [-4, 7], y: [-0.15, 1.25], height: 200, full: true, axes: 'box', xlabel: 'x' });
        const bot = v.stage({ x: [-30.5, 30.5], y: [-0.05, 1.6], height: 240, full: true, axes: true, xlabel: 't', title: '$|\\hat f(t)|$ and two bounds' });
        const th = bot.handle(4.6, 0, { color: 'accent', constrain: (x) => [Math.abs(x) < 0.4 ? (x < 0 ? -0.4 : 0.4) : v.M.clamp(x, -30, 30), 0], label: 't', labelPos: 's' });
        const B = (F, t) => 0.5 * S * quadB((x) => Math.abs(F.f(x) - F.f(x - Math.PI / Math.abs(t))), -14, 14 + Math.PI / Math.abs(t), [...F.br, ...F.br.map((b) => b + Math.PI / Math.abs(t))], 36, 1.2);
        let key = '', bc = [], st = null;
        v.render(() => {
          const F = FUN[which.value], t = th.x, s = Math.PI / Math.abs(t);
          if (key !== which.value) {
            key = which.value;
            const ts = v.M.linspace(0.4, 30, 120);
            bc = ts.map((u) => [u, B(F, u)]);
          }
          top.setView(null, [-0.15 * F.ymax, F.ymax]);
          top.setTicks(null, which.value === 'spike' ? [1, 2, 3] : [0.5, 1]);
          top.between((x) => Math.abs(F.f(x) - F.f(x - s)), () => 0, -4, 7, { fill: 'orange', fillAlpha: 0.3, n: 1100 });
          top.fn(F.f, { color: 'ink', width: 2.2, n: 1400 });
          top.fn((x) => F.f(x - s), { color: 'blue', width: 2, n: 1400 });
          top.corner(`shift π/|t| = ${v.fix(s, 3)}`, 'tr', { color: 'blue' });
          // bottom
          bot.setView(null, [-0.15 * F.L1, F.L1 * 1.28]);
          bot.hline(F.L1, { color: 'muted', width: 1.3, dash: [5, 4] });
          bot.text('‖f‖₁', -30, F.L1, { color: 'muted', size: 11.5, align: 'left', baseline: 'bottom', dy: -3 });
          bot.path(bc, { color: 'green', width: 2, dash: [6, 4] });
          bot.path(bc.map(([u, b]) => [-u, b]), { color: 'green', width: 2, dash: [6, 4] });
          bot.fn(F.a, { color: 'blue', width: 2.1, n: 1600, fill: 'blue', fillAlpha: 0.1 });
          const at = F.a(t), bt = B(F, t);
          bot.dot(t, at, { color: 'blue', r: 4.5 });
          bot.dot(t, bt, { color: 'green', r: 4.5 });
          bot.line(t, 0, t, bt, { color: 'accent', width: 1, dash: [3, 3] });
          v.legend([['ink', '$f$'], ['blue', '$f_{\\pi/t}$, $|\\hat f|$'], ['orange', '$|f-f_{\\pi/t}|$', { area: true }], ['green', '$\\frac12\\|f-f_{\\pi/t}\\|_1$', { dash: true }]]);
          st = { t, at, bt, L1: F.L1 };
        });
        v.readout(() => st && `$t=${v.fix(st.t, 2)}$: $\\;|\\hat f(t)| = ${v.fix(st.at, 4)} \\;\\le\\; \\tfrac12\\|f-f_{\\pi/t}\\|_1 = ${v.fix(st.bt, 4)} \\;\\le\\; \\|f\\|_1 = ${v.fix(st.L1, 4)}$`);
      },
    },
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7',
      kind: 'Definition',
      name: 'The kernels H and hλ',
      statement: String.raw`Put $H(t)=e^{-|t|}$ and, for $\lambda>0$,
$$h_\lambda(x)=\int_{-\infty}^{\infty}H(\lambda t)\,e^{itx}\,dm(t)=\sqrt{\frac{2}{\pi}}\;\frac{\lambda}{\lambda^2+x^2}\qquad(x\in\R).$$
Then $0<H\le1$, $H(\lambda t)\to1$ as $\lambda\to0$, $h_\lambda>0$, and $\int_{-\infty}^{\infty}h_\lambda\,dm=1$. These two functions drive the proof of the inversion theorem.`,
      idea: String.raw`The closed form is an elementary integral: $\int_0^\infty e^{-\lambda t}\cos xt\,dt=\lambda/(\lambda^2+x^2)$. With respect to $dm$ the density $h_\lambda$ becomes $\frac1\pi\frac{\lambda}{\lambda^2+x^2}\,dx$, the Cauchy distribution of width $\lambda$ (the Poisson kernel of the upper half-plane), whose total mass is $\frac1\pi[\arctan]_{-\infty}^{\infty}=1$. As $\lambda\to0$ the mass piles up at $0$: $h_\lambda$ is an approximate identity, while $H(\lambda t)\to1$ is the transform side of the same fact.`,
      caption: String.raw`Move $\lambda$ (log scale) and the radius $\delta$. Left: $H(\lambda t)=e^{-\lambda|t|}$ flattening towards $1$. Right: $h_\lambda$ from the closed form (curve) and from numerically integrating its definition (dots); the shaded part is the mass of $h_\lambda\,dm$ in $|x|<\delta$, which tends to $1$ as $\lambda\to0$ for every fixed $\delta$.`,
      deps: ['rca-9.1'],
      tags: ['approximate identity', 'Poisson kernel'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 9.7, p. 182'],
      viz(v) {
        const lam = v.slider('$\\lambda$', 0.05, 4, 0.6, { log: true, decimals: 3 });
        const Ls = v.stage({ x: [-10, 10], y: [-0.14, 1.18], height: 270, xlabel: 't', title: 'frequency: $H(\\lambda t)=e^{-\\lambda|t|}$' });
        const Rs = v.stage({ x: [-5, 5], y: [-0.3, 2.3], height: 270, xlabel: 'x', title: 'space: $h_\\lambda(x)=\\sqrt{2/\\pi}\\,\\lambda/(\\lambda^2+x^2)$' });
        const dh = Rs.handle(0.5, 0, { color: 'orange', constrain: (x) => [v.M.clamp(Math.abs(x), 0.05, 4.8), 0], label: 'δ', labelPos: 's' });
        const h = (l) => (x) => Math.sqrt(2 / Math.PI) * l / (l * l + x * x);
        const XS = v.M.linspace(-4.8, 4.8, 33);
        // h_λ(x) from the definition: (2S/λ) ∫_0^∞ e^{-s} cos(xs/λ) ds, Simpson on [0, 34]
        const hNum = (l, x) => (2 * S / l) * v.M.integrate((s) => Math.exp(-s) * Math.cos((x * s) / l), 0, 34, Math.max(400, Math.ceil(34 * Math.abs(x / l) * 6) * 2));
        let key = '', dots = [], st = null;
        v.render(() => {
          const l = lam.value, d = dh.x;
          if (key !== String(l)) { key = String(l); dots = XS.map((x) => [x, hNum(l, x)]); }
          Ls.fn((t) => Math.exp(-Math.abs(t)), { color: 'faint', width: 1.4, dash: [5, 4] });
          Ls.hline(1, { color: 'green', width: 1.2, dash: [3, 4] });
          Ls.fn((t) => Math.exp(-l * Math.abs(t)), { color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.12 });
          Ls.tex('H(t)', 1.4, Math.exp(-1.4), { color: 'muted', align: 'left', dx: 6, dy: 4 });
          Ls.tex('H(\\lambda t)', -6, Math.exp(-6 * l), { color: 'blue', baseline: 'bottom', dy: -6 });
          // right
          const H0 = h(l)(0);
          Rs.fn(h(l), { domain: [-d, d], color: 'orange', width: 0, fill: 'orange', fillAlpha: 0.3, n: 600 });
          Rs.fn(h(l), { color: 'blue', width: 2.6, n: 900 });
          Rs.dots(dots, { color: 'gold', r: 3.4 });
          Rs.line(-d, 0, -d, Math.min(h(l)(d), 2.3), { color: 'orange', width: 1.2, dash: [3, 3] });
          Rs.line(d, 0, d, Math.min(h(l)(d), 2.3), { color: 'orange', width: 1.2, dash: [3, 3] });
          if (H0 > 2.3) { Rs.arrow(0, 2.0, 0, 2.26, { color: 'blue', head: 7 }); Rs.text(`h_λ(0) = ${v.fix(H0, 2)}`, 0, 2.18, { color: 'blue', align: 'left', dx: 8, size: 12 }); }
          const mass = (2 / Math.PI) * Math.atan(d / l);
          Rs.corner(`mass in |x|<δ: ${v.fix(mass, 4)}`, 'tl', { color: 'orange', weight: 600 });
          v.legend([['blue', '$H(\\lambda t)$, $h_\\lambda$ (closed form)'], ['gold', '$h_\\lambda$ from $\\int H(\\lambda t)e^{itx}dm(t)$', { dot: true }], ['orange', '$\\int_{-\\delta}^{\\delta}h_\\lambda\\,dm$', { area: true }]]);
          let err = 0; dots.forEach(([x, y]) => { err = Math.max(err, Math.abs(y - h(l)(x))); });
          st = { l, d, mass, err, H0 };
        });
        v.readout(() => st && `$\\lambda=${v.fix(st.l, 3)}$: $\\;\\int_{-\\delta}^{\\delta}h_\\lambda\\,dm=\\tfrac{2}{\\pi}\\arctan\\tfrac{\\delta}{\\lambda}=${v.fix(st.mass, 4)}$ of total mass $1$; $\\;H(\\lambda t)\\ge${v.fix(Math.exp(-5 * st.l), 3)}$ for $|t|\\le5$; dots vs closed form: max gap $${v.sci(st.err, 2)}$`);
      },
    },
  ],
};
