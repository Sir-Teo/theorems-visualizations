// Rudin, Real and Complex Analysis — Chapter 9, part 2: the inversion theorem (9.8–9.12).
// Normalisation: dm = dx/√(2π). h_λ dm is the Cauchy density (1/π) λ/(λ²+y²) dy, so with
// y = λ tan θ every convolution with h_λ becomes an average over θ ∈ (−π/2, π/2):
//   (f*h_λ)(x) = (1/π) ∫ f(x − λ tan θ) dθ.

const S = 1 / Math.sqrt(2 * Math.PI);
const sinc = (u) => (Math.abs(u) < 1e-6 ? 1 - (u * u) / 6 : Math.sin(u) / u);
const hl = (l) => (x) => Math.sqrt(2 / Math.PI) * l / (l * l + x * x);

// (f*h_λ)(x) by the θ-substitution (midpoint rule, n nodes).
function convH(f, x, l, n = 800) {
  let s = 0;
  for (let k = 0; k < n; k++) { const th = -Math.PI / 2 + (Math.PI * (k + 0.5)) / n; s += f(x - l * Math.tan(th)); }
  return s / n;
}
// Same, but the θ-interval is split where x − λ tan θ crosses a break point of f, so jumps cost nothing.
function convHB(f, x, l, breaks, n = 600) {
  const cuts = [-Math.PI / 2, ...breaks.map((b) => Math.atan((x - b) / l)).sort((a, b) => a - b), Math.PI / 2];
  let s = 0;
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1], m = Math.max(4, Math.round((n * (b - a)) / Math.PI));
    for (let k = 0; k < m; k++) { const th = a + ((b - a) * (k + 0.5)) / m; s += ((b - a) / m) * f(x - l * Math.tan(th)); }
  }
  return s / Math.PI;
}
// Graded midpoint quadrature over [a,b] split at breaks (see ch09.js).
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
        s += F(l + w * u * u * u * (10 - 15 * u + 6 * u * u)) * w * 30 * u * u * (1 - u) * (1 - u) / n;
      }
    }
  }
  return s;
}
// Closed forms of f*h_λ for the step χ_[−1,1] and the tent (1−|x|)^+.
const A = (y, l) => Math.atan(y / l) / Math.PI;
const B = (y, l) => (l / (2 * Math.PI)) * Math.log(l * l + y * y);
const stepH = (x, l) => A(x + 1, l) - A(x - 1, l);
const tentH = (x, l) => (1 - x) * (A(x, l) - A(x - 1, l)) + (B(x, l) - B(x - 1, l)) + (1 + x) * (A(x + 1, l) - A(x, l)) - (B(x + 1, l) - B(x, l));

// Functions with closed-form transforms; ft returns [Re, Im].
const FUNS = {
  tri: { label: '$(1-|x|)^+$', f: (x) => Math.max(0, 1 - Math.abs(x)), ft: (t) => [S * sinc(t / 2) ** 2, 0], L1hat: true, br: [-1, 0, 1] },
  exp2: { label: '$e^{-|x|}$', f: (x) => Math.exp(-Math.abs(x)), ft: (t) => [(2 * S) / (1 + t * t), 0], L1hat: true, br: [0] },
  gauss: { label: '$e^{-x^2/2}$', f: (x) => Math.exp(-x * x / 2), ft: (t) => [Math.exp(-t * t / 2), 0], L1hat: true, br: [] },
  rect: { label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), ft: (t) => [2 * S * sinc(t), 0], L1hat: false, br: [-1, 1] },
  exp1: { label: '$e^{-x}\\chi_{(0,\\infty)}$', f: (x) => (x > 0 ? Math.exp(-x) : 0), ft: (t) => [S / (1 + t * t), (-S * t) / (1 + t * t)], L1hat: false, br: [0] },
};
// ∫ H(λt) f̂(t) e^{ixt} dm(t) for real f (f̂(−t) = conj f̂(t)): 2S ∫_0^T e^{−λt} Re[f̂(t)e^{ixt}] dt, Simpson.
function dampedInverse(F, x, l, T = null, dt = 0.03) {
  const TT = T ?? Math.min(400, 22 / l);
  const n = 2 * Math.ceil(TT / dt / 2);
  const g = (t) => { const z = F.ft(t); return Math.exp(-l * t) * (z[0] * Math.cos(x * t) - z[1] * Math.sin(x * t)); };
  return 2 * S * v_integrate(g, 0, TT, n);
}
function v_integrate(f, a, b, n) {
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export default {
  collection: 'rca',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.8
    {
      num: '9.8',
      kind: 'Proposition',
      name: 'Damped inversion equals convolution with hλ',
      statement: String.raw`If $f\in L^1$ and $\lambda>0$, then for every $x\in\R$
$$(f*h_\lambda)(x)=\int_{-\infty}^{\infty}H(\lambda t)\,\hat f(t)\,e^{ixt}\,dm(t).$$`,
      idea: String.raw`Insert the definition of $\hat f$ on the right: the integrand becomes $H(\lambda t)f(y)e^{i(x-y)t}$, which is absolutely integrable on $\R^2$ because $H\in L^1$ and $f\in L^1$. Fubini's theorem (8.8) lets us integrate in $t$ first, and the inner integral is $h_\lambda(x-y)$ by the very definition 9.7. What is left is $\int f(y)h_\lambda(x-y)\,dm(y)=(f*h_\lambda)(x)$.`,
      caption: String.raw`Pick $f$ and move $\lambda$. Bottom: the damping factor $H(\lambda t)$ (orange) times $\hat f$ gives the integrable spectrum (blue). Top: its inverse transform, computed as a frequency integral at the gold dots, lands exactly on the space-side average $f*h_\lambda$ (blue curve), computed independently as $\frac1\pi\int f(x-\lambda\tan\theta)\,d\theta$. Small $\lambda$ lets more high frequencies through, and $f*h_\lambda$ hugs $f$.`,
      deps: ['rca-9.7', 'rca-8.8', 'rca-9.1'],
      tags: ['inversion', 'Fubini'],
      viz(v) {
        const KEYS = ['rect', 'exp1', 'tri'];
        const which = v.select('$f$', KEYS.map((k) => ({ value: k, label: FUNS[k].label })), 'rect');
        const lam = v.slider('$\\lambda$', 0.08, 2, 0.25, { log: true, decimals: 3 });
        const top = v.stage({ x: [-4, 4], y: [-0.2, 1.2], height: 240, full: true, axes: 'box', xlabel: 'x', yticks: [0.5, 1], title: 'space: $f*h_\\lambda$ (curve) and $\\int H(\\lambda t)\\hat f(t)e^{ixt}\\,dm(t)$ (dots)' });
        const bot = v.stage({ x: [-25, 25], y: [-0.3, 1.1], height: 200, full: true, xlabel: 't', title: 'frequency: $\\hat f$ damped by $H(\\lambda t)=e^{-\\lambda|t|}$' });
        const XS = v.M.linspace(-3.8, 3.8, 39);
        let key = '', dots = [], st = null;
        v.render(() => {
          const F = FUNS[which.value], l = lam.value;
          const k = `${which.value}|${l}`;
          if (k !== key) { key = k; dots = XS.map((x) => [x, dampedInverse(F, x, l)]); }
          const lhs = (x) => (which.value === 'rect' ? stepH(x, l) : which.value === 'tri' ? tentH(x, l) : convHB(F.f, x, l, [0], 1200));
          top.fn(F.f, { color: 'ink', width: 1.6, dash: [5, 4], n: 1200 });
          top.fn(lhs, { color: 'blue', width: 2.6, n: 500 });
          top.dots(dots, { color: 'gold', r: 3.6 });
          // bottom
          const fmax = Math.max(...v.M.linspace(-25, 25, 300).map((t) => Math.abs(F.ft(t)[0]) + Math.abs(F.ft(t)[1])));
          bot.setView(null, [-0.45 * fmax, 1.18 * Math.max(fmax, 0.5)]);
          bot.fn((t) => Math.exp(-l * Math.abs(t)) * Math.max(fmax, 0.5), { color: 'orange', width: 1.6, dash: [5, 4] });
          bot.fn((t) => F.ft(t)[0], { color: 'muted', width: 1.3, n: 1600 });
          bot.fn((t) => Math.exp(-l * Math.abs(t)) * F.ft(t)[0], { color: 'blue', width: 2.2, n: 1600, fill: 'blue', fillAlpha: 0.14 });
          if (which.value === 'exp1') bot.fn((t) => Math.exp(-l * Math.abs(t)) * F.ft(t)[1], { color: 'purple', width: 1.8, n: 800 });
          bot.text('H(λt) (scaled)', 25, Math.exp(-l * 25) * Math.max(fmax, 0.5), { color: 'orange', align: 'right', baseline: 'bottom', dy: -4, size: 11.5 });
          let err = 0; dots.forEach(([x, y]) => { err = Math.max(err, Math.abs(y - lhs(x))); });
          st = { err, l };
          v.legend([['ink', '$f$', { dash: true }], ['blue', '$f*h_\\lambda$; $H(\\lambda t)\\,\\Re\\hat f$'], ['gold', 'frequency integral', { dot: true }], ['muted', '$\\Re\\hat f$'], ...(which.value === 'exp1' ? [['purple', '$H(\\lambda t)\\,\\Im\\hat f$']] : [])]);
        });
        v.readout(() => st && `$\\lambda=${v.fix(st.l, 3)}$: largest gap between $(f*h_\\lambda)(x)$ and $\\int H(\\lambda t)\\hat f(t)e^{ixt}\\,dm(t)$ over the dots: $${v.sci(st.err, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 9.9
    {
      num: '9.9',
      kind: 'Theorem',
      name: 'hλ-averages converge at points of continuity',
      statement: String.raw`If $g\in L^\infty$ and $g$ is continuous at the point $x$, then
$$\lim_{\lambda\to0}(g*h_\lambda)(x)=g(x).$$`,
      idea: String.raw`Since $\int h_\lambda\,dm=1$, $(g*h_\lambda)(x)-g(x)=\int[g(x-y)-g(x)]h_\lambda(y)\,dm(y)$. Substitute $y=\lambda s$ and use $h_\lambda(\lambda s)=\lambda^{-1}h_1(s)$: the difference becomes $\int[g(x-\lambda s)-g(x)]h_1(s)\,dm(s)$. The integrand tends to $0$ for each $s$ by continuity at $x$ and is bounded by $2\norm g_\infty h_1(s)\in L^1$, so dominated convergence (1.34) finishes. Boundedness matters: the tails of $h_\lambda$ decay only like $1/y^2$, and for $g(x)=|x|$ the convolution is already infinite.`,
      caption: String.raw`Drag the point $x$ (it snaps onto the jump at $x=1$) and shrink $\lambda$. Top: the bounded function $g$, its average $g*h_\lambda$ (blue) and the weight $h_\lambda(x-\cdot)$ (orange, rescaled). Bottom, on log–log axes: $|(g*h_\lambda)(x)-g(x)|$ against $\lambda$. Where $g$ is continuous the error goes to $0$; at the jump it stalls at half the jump, because $g*h_\lambda(1)$ tends to the average of the two one-sided limits.`,
      deps: ['rca-9.7', 'rca-1.34', 'rca-3.7'],
      tags: ['approximate identity', 'continuity'],
      viz(v) {
        const g = (x) => (x < 1 ? 0.55 + 0.35 * Math.sin(1.7 * x) : -0.45 + 0.25 * Math.cos(2.3 * x));
        const gl = 0.55 + 0.35 * Math.sin(1.7), gr = -0.45 + 0.25 * Math.cos(2.3);
        const lam = v.slider('$\\lambda$', 0.002, 2, 0.12, { log: true, decimals: 4 });
        const top = v.stage({ x: [-3.5, 4.5], y: [-1.05, 1.2], height: 260, full: true, xlabel: 'x' });
        const bot = v.stage({ x: [-3, 0.4], y: [-4, 0.3], height: 210, full: true, axes: 'box', xlabel: 'λ', title: '$|(g*h_\\lambda)(x)-g(x)|$ against $\\lambda$ (log–log)', xticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], yticks: [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']] });
        const xh = top.handle(-0.6, -1.0, { color: 'accent', label: 'x', labelPos: 'n', constrain: (x) => [Math.abs(x - 1) < 0.08 ? 1 : v.M.clamp(x, -3.2, 4.2), -1.0] });
        const LS = v.M.linspace(-3, 0.3, 56);
        let key = '', errs = [], st = null;
        v.render(() => {
          const x = xh.x, l = lam.value, atJump = x === 1;
          const k = String(x);
          if (k !== key) { key = k; errs = LS.map((e) => [e, Math.log10(Math.max(1e-5, Math.abs(convHB(g, x, 10 ** e, [1], 2400) - g(x))))]); }
          // weight
          const wmax = hl(l)(0);
          top.fn((y) => -1 + 0.9 * hl(l)(x - y) / wmax, { color: 'orange', width: 1.2, fill: 'orange', fillAlpha: 0.16, base: -1, n: 900 });
          top.fn(g, { color: 'ink', width: 2.2, n: 1400 });
          top.fn((y) => convHB(g, y, l, [1], 700), { color: 'blue', width: 2.4, n: 360 });
          const c = convHB(g, x, l, [1], 2400);
          top.line(x, -1, x, Math.max(g(x), c), { color: 'accent', width: 1, dash: [3, 3] });
          top.dot(x, g(x), { color: 'ink', r: 5, label: 'g(x)', labelPos: 'ne' });
          top.dot(x, c, { color: 'blue', r: 5.5 });
          if (atJump) { top.dot(1, gl, { color: 'ink', r: 4.5, hollow: true }); top.hline((gl + gr) / 2, { color: 'red', width: 1, dash: [4, 4] }); }
          top.tex('h_\\lambda(x-y)', x + (x > 2.5 ? -0.16 : 0.16), -0.75, { color: 'orange', align: x > 2.5 ? 'right' : 'left', size: 14 });
          // bottom
          bot.path(errs, { color: atJump ? 'red' : 'green', width: 2.4 });
          if (atJump) bot.hline(Math.log10(Math.abs(gr - gl) / 2), { color: 'red', width: 1, dash: [4, 4] });
          bot.dot(Math.log10(l), Math.log10(Math.max(1e-5, Math.abs(c - g(x)))), { color: 'accent', r: 5.5 });
          bot.corner(atJump ? 'x at the jump: error → |jump|/2, not 0' : 'g continuous at x: error → 0', atJump ? 'bl' : 'tr', { color: atJump ? 'red' : 'green', weight: 600 });
          v.legend([['ink', '$g\\in L^\\infty$'], ['blue', '$g*h_\\lambda$'], ['orange', 'weight $h_\\lambda(x-y)$', { area: true }], [atJump ? 'red' : 'green', '$|(g*h_\\lambda)(x)-g(x)|$']]);
          st = { x, l, c, gx: g(x), atJump };
        });
        v.readout(() => st && `$x=${v.fix(st.x, 3)}$, $\\lambda=${v.fix(st.l, 4)}$: $\\;(g*h_\\lambda)(x)=${v.fix(st.c, 4)}$, $\\;g(x)=${v.fix(st.gx, 4)}$` + (st.atJump ? `; the limit is $\\tfrac12\\big(g(1^-)+g(1^+)\\big)=${v.fix((gl + gr) / 2, 4)}$` : ''));
      },
    },
    // ------------------------------------------------------------------ 9.10
    {
      num: '9.10',
      kind: 'Theorem',
      name: 'f * hλ → f in Lᵖ (1 ≤ p < ∞)',
      statement: String.raw`If $1\le p<\infty$ and $f\in L^p$, then
$$\lim_{\lambda\to0}\norm{f*h_\lambda-f}_p=0 .$$`,
      idea: String.raw`Because $h_\lambda\,dm$ is a probability measure, Jensen's inequality (3.3) gives $|(f*h_\lambda)(x)-f(x)|^p\le\int|f(x-y)-f(x)|^p h_\lambda(y)\,dm(y)$. Integrate in $x$ and use Fubini (8.8):
$$\norm{f*h_\lambda-f}_p^p\le\int\norm{f_y-f}_p^p\,h_\lambda(y)\,dm(y)=(\phi*h_\lambda)(0),$$
where $\phi(y)=\norm{f_{-y}-f}_p^p$ is bounded and continuous with $\phi(0)=0$ by 9.5. Theorem 9.9 says this tends to $\phi(0)=0$. For $p=\infty$ convergence need not hold: a jump function gives a counterexample. This is an essential-supremum norm, so changing a representative on a null set cannot by itself cause failure.`,
      caption: String.raw`Choose $f$, $p$ and $\lambda$ (log scale). Top: $f$ and the smoothed $f*h_\lambda$ (closed forms), with $|f*h_\lambda-f|$ shaded. Bottom: $\norm{f*h_\lambda-f}_p$ against $\lambda$ on log–log axes, computed by quadrature. For $p<\infty$ the curve dives to $0$ (for the step roughly like $\lambda^{1/p}$, up to a logarithm when $p=1$); with $p=\infty$ and the step function it stays at $\tfrac12$ — the hypothesis $p<\infty$ is essential.`,
      deps: ['rca-9.5', 'rca-9.9', 'rca-3.3', 'rca-8.8'],
      see: ['pma-8.15'],
      tags: ['approximate identity', 'Lp'],
      viz(v) {
        const FF = {
          step: { label: 'step $\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), conv: stepH, br: [-1, 1] },
          tent: { label: 'tent $(1-|x|)^+$', f: (x) => Math.max(0, 1 - Math.abs(x)), conv: tentH, br: [-1, 0, 1] },
        };
        const which = v.select('$f$', Object.entries(FF).map(([value, o]) => ({ value, label: o.label })), 'step');
        const pSel = v.select('$p$', [{ value: '1', label: '$p=1$' }, { value: '2', label: '$p=2$' }, { value: 'inf', label: '$p=\\infty$' }], '1');
        const lam = v.slider('$\\lambda$', 0.001, 2, 0.08, { log: true, decimals: 4 });
        const top = v.stage({ x: [-3.2, 3.2], y: [-0.12, 1.15], height: 230, full: true, axes: 'box', xlabel: 'x', yticks: [0.5, 1] });
        const bot = v.stage({ x: [-3.1, 0.4], y: [-3.6, 0.3], height: 210, full: true, axes: 'box', xlabel: 'λ', xticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], yticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], title: '$\\|f*h_\\lambda-f\\|_p$ (log–log)' });
        const offs = [0, 1e-4, 1e-3, 0.01, 0.03, 0.1, 0.3, 1, 2, 4, 8, 16, 40];
        function norm(F, l, p) {
          const d = (x) => Math.abs(F.conv(x, l) - F.f(x));
          if (p === Infinity) {
            let m = 0;
            for (const b of F.br) for (const s of [-1, 1]) for (const o of [1e-9, 1e-6, 1e-4, 1e-3, 0.01, 0.05, 0.2, 0.5]) m = Math.max(m, d(b + s * o * Math.max(l, 1e-3)));
            for (let x = -3; x <= 3; x += 0.01) m = Math.max(m, d(x));
            return m;
          }
          const br = [...new Set(F.br.flatMap((b) => offs.flatMap((o) => [b - o * l * 10, b + o * l * 10])).concat([-60, 60]))];
          const X = 60, I = 2; // ∫ f dx = 2 for the step, 1 for the tent — only used for the far tail
          const tail = 2 * S * ((l / Math.PI) * (which.value === 'step' ? I : 1)) ** p * X ** (1 - 2 * p) / (2 * p - 1);
          return (S * quadB((x) => d(x) ** p, -X, X, br, 24, 4) + tail) ** (1 / p);
        }
        const LS = v.M.linspace(-3, 0.3, 45);
        let key = '', curve = [], st = null;
        v.render(() => {
          const F = FF[which.value], p = pSel.value === 'inf' ? Infinity : +pSel.value, l = lam.value;
          const k = `${which.value}|${p}`;
          if (k !== key) { key = k; curve = LS.map((e) => [e, Math.log10(Math.max(1e-4, norm(F, 10 ** e, p)))]); }
          const fail = p === Infinity && which.value === 'step';
          top.between((x) => Math.abs(F.conv(x, l) - F.f(x)), () => 0, -3.2, 3.2, { fill: 'orange', fillAlpha: 0.3, n: 1200 });
          top.fn(F.f, { color: 'ink', width: 2, n: 1400 });
          top.fn((x) => F.conv(x, l), { color: 'blue', width: 2.4, n: 800 });
          const nv = norm(F, l, p);
          bot.path(curve, { color: fail ? 'red' : 'green', width: 2.4 });
          if (fail) bot.hline(Math.log10(0.5), { color: 'red', width: 1, dash: [4, 4] });
          bot.dot(Math.log10(l), Math.log10(Math.max(1e-4, nv)), { color: 'accent', r: 5.5 });
          bot.corner(fail ? 'p = ∞: the error never drops below 1/2' : 'error → 0 as λ → 0', fail ? 'bl' : 'tl', { color: fail ? 'red' : 'green', weight: 600 });
          v.legend([['ink', '$f$'], ['blue', '$f*h_\\lambda$'], ['orange', '$|f*h_\\lambda-f|$', { area: true }], [fail ? 'red' : 'green', '$\\|f*h_\\lambda-f\\|_p$']]);
          st = { l, nv, p };
        });
        v.readout(() => st && `$\\lambda=${v.fix(st.l, 4)}$: $\\;\\|f*h_\\lambda-f\\|_{${st.p === Infinity ? '\\infty' : st.p}}=${v.sci(st.nv, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 9.11
    {
      num: '9.11',
      kind: 'Theorem',
      name: 'The inversion theorem',
      statement: String.raw`Suppose $f\in L^1$ and $\hat f\in L^1$, and put
$$g(x)=\int_{-\infty}^{\infty}\hat f(t)\,e^{ixt}\,dm(t)\qquad(x\in\R).$$
Then $g\in C_0(\R)$ and $f(x)=g(x)$ for almost every $x$.`,
      idea: String.raw`By 9.8, $(f*h_\lambda)(x)=\int H(\lambda t)\hat f(t)e^{ixt}\,dm(t)$. As $\lambda\to0$ the right side tends to $g(x)$ for **every** $x$, by dominated convergence with dominating function $|\hat f|\in L^1$. The left side tends to $f$ in $L^1$ (9.10), so some sequence $\lambda_n\to0$ gives $f*h_{\lambda_n}\to f$ a.e. (3.12). Hence $f=g$ a.e.; and $g\in C_0$ by the Riemann–Lebesgue lemma 9.6 applied to $\hat f$, since $g(x)=\hat{\hat f}(-x)$.`,
      caption: String.raw`Choose $f$, move $\lambda$ and the probe $x$. Bottom: $|\hat f|$ and the damped spectrum $H(\lambda t)|\hat f(t)|$. Top: the damped inverse transform $f*h_\lambda$ (blue) converging to $f$, and the undamped inverse $g$ evaluated by quadrature (green dots). When $\hat f\in L^1$ the dots sit on $f$. For $\chi_{[-1,1]}$ we have $\hat f\notin L^1$ — its $L^1$ mass grows like $\log T$ — and indeed no continuous $g$ can equal a function with jumps a.e.`,
      deps: ['rca-9.8', 'rca-9.10', 'rca-9.6', 'rca-1.34', 'rca-3.12'],
      see: ['fa-7.7', 'pma-8.14'],
      tags: ['inversion', 'Fourier transform'],
      viz(v) {
        const KEYS = ['tri', 'exp2', 'gauss', 'rect'];
        const which = v.select('$f$', KEYS.map((k) => ({ value: k, label: FUNS[k].label })), 'tri');
        const lam = v.slider('$\\lambda$', 0.003, 1.5, 0.15, { log: true, decimals: 4 });
        const top = v.stage({ x: [-3.5, 3.5], y: [-0.32, 1.25], height: 250, full: true, axes: 'box', xlabel: 'x', yticks: [0.5, 1] });
        const bot = v.stage({ x: [-30, 30], y: [-0.08, 0.9], height: 190, full: true, xlabel: 't', title: '$|\\hat f(t)|$ and $H(\\lambda t)|\\hat f(t)|$' });
        const xh = top.handle(0.5, -0.2, { color: 'accent', label: 'x', labelPos: 'e', constrain: (x) => [v.M.clamp(x, -3.3, 3.3), -0.2] });
        const XS = v.M.linspace(-3.3, 3.3, 23);
        const conv = (k, x, l) => (k === 'rect' ? stepH(x, l) : k === 'tri' ? tentH(x, l) : convH(FUNS[k].f, x, l, 700));
        // ∫_{-T}^{T} |f̂| dm and the undamped inverse g(x) = 2S ∫_0^T Re f̂(t) cos(xt) dt (even real f̂)
        const massTo = (F, T) => 2 * S * v_integrate((t) => Math.abs(F.ft(t)[0]), 0, T, 2 * Math.ceil(T / 0.02));
        const gAt = (F, x, T = 300) => 2 * S * v_integrate((t) => F.ft(t)[0] * Math.cos(x * t), 0, T, 2 * Math.ceil(T / 0.04));
        let key = '', key2 = '', gd = [], m30 = 0, m300 = 0, L1err = 0, st = null;
        v.render(() => {
          const k = which.value, F = FUNS[k], l = lam.value, x0 = xh.x;
          if (key !== k) { key = k; gd = F.L1hat ? XS.map((x) => [x, gAt(F, x)]) : []; m30 = massTo(F, 30); m300 = massTo(F, 300); }
          if (key2 !== `${k}|${l}`) {
            key2 = `${k}|${l}`;
            const cv = k === 'rect' || k === 'tri' ? (x) => conv(k, x, l) : (x) => convH(F.f, x, l, 300);
            L1err = S * quadB((x) => Math.abs(cv(x) - F.f(x)), -40, 40, [...F.br, -0.3, 0.3, -2, 2, -5, 5, -12, 12], 30, 2);
          }
          top.fn(F.f, { color: 'ink', width: 2, n: 1400 });
          top.fn((x) => conv(k, x, l), { color: 'blue', width: 2.4, n: 500 });
          if (F.L1hat) top.dots(gd, { color: 'green', r: 3.8 });
          const c0 = conv(k, x0, l);
          top.line(x0, -0.2, x0, Math.max(c0, F.f(x0)), { color: 'accent', width: 1, dash: [3, 3] });
          top.dot(x0, c0, { color: 'blue', r: 5 });
          if (!F.L1hat) top.texPx('\\hat f\\notin L^1:\\ f*h_\\lambda\\to f \\text{ in } L^1 \\text{ only}', top.width - 12, 14, { color: 'red', align: 'right', baseline: 'top', size: 14 });
          // bottom
          const mx = Math.abs(F.ft(0)[0]);
          bot.setView(null, [-0.1 * mx, mx * 1.18]);
          bot.fn((t) => Math.abs(F.ft(t)[0]), { color: 'muted', width: 1.3, n: 1600 });
          bot.fn((t) => Math.exp(-l * Math.abs(t)) * Math.abs(F.ft(t)[0]), { color: 'blue', width: 2, n: 1600, fill: 'blue', fillAlpha: 0.16 });
          const g0 = F.L1hat ? gAt(F, x0) : NaN;
          const d0 = dampedInverse(F, x0, l);
          v.legend([['ink', '$f$'], ['blue', '$f*h_\\lambda=\\int H(\\lambda t)\\hat f(t)e^{ixt}dm$'], ...(F.L1hat ? [['green', '$g(x)=\\int\\hat f(t)e^{ixt}dm(t)$', { dot: true }]] : []), ['muted', '$|\\hat f|$']]);
          st = { k, x0, l, d0, c0, g0, fx: F.f(x0), m30, m300, L1err, ok: F.L1hat };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const mass = `$\\int_{-30}^{30}|\\hat f|\\,dm=${v.fix(s.m30, 3)}$, $\\int_{-300}^{300}|\\hat f|\\,dm=${v.fix(s.m300, 3)}$`;
          const lhs = `at $x=${v.fix(s.x0, 2)}$: frequency integral $\\int H(\\lambda t)\\hat f e^{ixt}dm=${v.fix(s.d0, 4)}$, $\\;f(x)=${v.fix(s.fx, 4)}$`;
          return `${mass}${s.ok ? ' (converges)' : ' (grows like $\\log T$)'}; $\\;\\|f*h_\\lambda-f\\|_1=${v.fix(s.L1err, 4)}$; ${lhs}` + (s.ok ? `, $\\;g(x)=${v.fix(s.g0, 4)}$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 9.12
    {
      num: '9.12',
      kind: 'Theorem',
      name: 'The uniqueness theorem',
      statement: String.raw`If $f\in L^1$ and $\hat f(t)=0$ for every $t\in\R$, then $f(x)=0$ for almost every $x$. Equivalently, two $L^1$ functions with the same Fourier transform agree almost everywhere.`,
      idea: String.raw`If $\hat f\equiv0$ then certainly $\hat f\in L^1$, and the inversion theorem 9.11 gives $f=g$ a.e. with $g(x)=\int 0\cdot e^{ixt}\,dm(t)=0$. Changing $f$ on a set of measure zero changes neither $\int f e^{-ixt}\,dm$ nor the class of $f$ in $L^1$, so "almost everywhere" is the best one can say.`,
      caption: String.raw`Drag the four step heights and the three red spikes (the spikes sit on single points, a null set). Right: $\Re\hat f$ and $\Im\hat f$, exact. Left, blue: $f*h_\lambda$ with $\lambda=0.02$, i.e. $f$ rebuilt from $\hat f$ alone via 9.8 — it reproduces the steps and is blind to the spikes. The transform vanishes identically exactly when all steps are $0$ (press the button), however large the spikes are.`,
      deps: ['rca-9.11'],
      tags: ['uniqueness', 'Fourier transform'],
      viz(v) {
        const IV = [[-3, -1.5], [-1.5, 0], [0, 1.5], [1.5, 3]];
        const SP = [-1.85, 0.3, 2.7];
        const L = v.stage({ x: [-3.6, 3.6], y: [-1.5, 1.5], height: 300, axes: true, xlabel: 'x', title: '$f$: steps plus spikes on a null set' });
        const R = v.stage({ x: [-12, 12], y: [-1.1, 1.1], height: 300, xlabel: 't', title: '$\\hat f$' });
        const snap = (y) => (Math.abs(y) < 0.06 ? 0 : v.M.clamp(y, -1.3, 1.3));
        const init = [0.7, -0.4, 0.9, 0.35];
        const H = IV.map(([a, b], i) => L.handle((a + b) / 2, init[i], { color: 'blue', r: 7, constrain: (x, y) => [(a + b) / 2, snap(y)] }));
        const P = SP.map((x, i) => L.handle(x, [1.2, -1.1, 0.9][i], { color: 'red', r: 5.5, constrain: (_, y) => [x, v.M.clamp(y, -1.4, 1.4)] }));
        v.button('Set all steps to 0', () => H.forEach((h) => { h.y = 0; }));
        v.button('Reset', () => H.forEach((h, i) => { h.y = init[i]; }));
        const lam = 0.02;
        let st = null;
        v.render(() => {
          const c = H.map((h) => h.y);
          const f = (x) => { for (let i = 0; i < 4; i++) if (x >= IV[i][0] && x < IV[i][1]) return c[i]; return 0; };
          // f̂(t) = Σ c_k S ∫_a^b e^{-ixt} dx
          const fh = (t) => {
            let re = 0, im = 0;
            IV.forEach(([a, b], i) => {
              if (Math.abs(t) < 1e-9) { re += c[i] * (b - a); return; }
              re += (c[i] * (Math.sin(b * t) - Math.sin(a * t))) / t; im += (c[i] * (Math.cos(b * t) - Math.cos(a * t))) / t;
            });
            return [S * re, S * im];
          };
          const rec = (x) => IV.reduce((s, [a, b], i) => s + c[i] * (A(x - a, lam) - A(x - b, lam)), 0);
          // left panel
          IV.forEach(([a, b], i) => L.rect(a, 0, b, c[i], { fill: 'blue', fillAlpha: 0.12, stroke: false }));
          L.fn(f, { color: 'ink', width: 2, n: 1400 });
          L.fn(rec, { color: 'blue', width: 2.2, n: 700 });
          P.forEach((p) => L.line(p.x, 0, p.x, p.y, { color: 'red', width: 2.2 }));
          // right panel
          const ts = v.M.linspace(-12, 12, 1201).map(fh);
          const mx = Math.max(...ts.map((z) => Math.hypot(z[0], z[1])));
          R.setView(null, [-Math.max(0.25, mx * 1.15), Math.max(0.25, mx * 1.15)]);
          R.fn((t) => fh(t)[0], { color: 'blue', width: 2.3, n: 900 });
          R.fn((t) => fh(t)[1], { color: 'orange', width: 2, n: 900 });
          const allZero = c.every((y) => y === 0);
          R.texPx(allZero ? '\\hat f\\equiv0\\ \\Rightarrow\\ f=0\\text{ a.e.}' : `\\max|\\hat f|=${v.fix(mx, 3)}>0`, 12, 12, { color: allZero ? 'green' : 'muted', align: 'left', baseline: 'top', size: 14 });
          const L1 = S * IV.reduce((s, [a, b], i) => s + Math.abs(c[i]) * (b - a), 0);
          v.legend([['ink', '$f$'], ['red', 'spikes (measure $0$)'], ['blue', '$f*h_{0.02}$ (rebuilt from $\\hat f$); $\\Re\\hat f$'], ['orange', '$\\Im\\hat f$']]);
          st = { L1, mx, allZero };
        });
        v.readout(() => st && `$\\|f\\|_1=${v.fix(st.L1, 4)}$ (the spikes contribute nothing), $\\;\\sup_{|t|\\le12}|\\hat f(t)|=${v.fix(st.mx, 4)}$` + (st.allZero ? ' — both vanish together: $f=0$ a.e. even though $f$ is not the zero function.' : ''));
      },
    },
  ],
};
