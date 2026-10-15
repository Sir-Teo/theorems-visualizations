// Rudin, Functional Analysis — Chapter 6 (part 2): calculus with distributions
//
// Numbering note: recalled, not checked against the book; uncertain items carry `verify: true`.

// ---------------------------------------------------------------- the model bump ψ and its exact derivatives
/** ψ(x) = exp(−1/(1−x²)) on (−1,1): ψ^{(k)} = p_k(x)(1−x²)^{−2k}ψ with an exact polynomial recursion. */
const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 8; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
  return P;
})();
function psiD(k, x) {
  const s = 1 - x * x; if (!(s > 0)) return 0;
  const c = PSI_P[k]; let p = 0; for (let i = c.length - 1; i >= 0; i--) p = p * x + c[i];
  return p * Math.exp(-1 / s - 2 * k * Math.log(s));
}
const E1 = Math.E;
/** k-th derivative of the test function φ(x) = A·e·ψ((x−c)/r) (peak A at c, support [c−r, c+r]). */
const phiD = (k, x, c, r, A = 1) => A * E1 * psiD(k, (x - c) / r) / Math.pow(r, k);
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
const BIN = [[1]];
for (let n = 1; n <= 10; n++) { const r = [1]; for (let k = 1; k < n; k++) r.push(BIN[n - 1][k - 1] + BIN[n - 1][k]); r.push(1); BIN.push(r); }
/** ∫ e ψ over (−1, 1). */
const I0 = simpson((u) => E1 * psiD(0, u), -1, 1, 600);
/** Vertical extent [lo, hi] of a list of values, padded, with a minimum span. */
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** Draw a δ-mass of weight w at x as an arrow (scaled by `unit`). */
function deltaArrow(S, x, w, unit, color, label, side) {
  if (Math.abs(w) < 1e-9) return;
  S.arrow(x, 0, x, w * unit, { color, width: 2.6, head: 9 });
  if (label && side === 'right') S.tex(label, x, w * unit, { color, align: 'left', dx: 7, dy: w > 0 ? 6 : -6, size: 14 });
  else if (label) S.tex(label, x, w * unit, { color, dy: w > 0 ? -12 : 12, size: 14 });
}
/** A dipole w·δ'_x ≈ w(δ_{x−h} − δ_{x+h})/(2h): up-arrow on the left, down-arrow on the right (for w > 0). */
function dipole(S, x, w, unit, color, label) {
  if (Math.abs(w) < 1e-9) return;
  const h = 0.09, L = w * unit;
  S.arrow(x - h, 0, x - h, L, { color, width: 2.2, head: 8 });
  S.arrow(x + h, 0, x + h, -L, { color, width: 2.2, head: 8 });
  if (label) S.tex(label, x - h, L, { color, align: 'right', dx: -8, dy: L > 0 ? 4 : -4, size: 14 });
}

export default {
  collection: 'fa',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ calculus with distributions
    {
      num: '6.11',
      kind: 'Definition',
      name: 'Locally integrable functions and measures as distributions',
      statement: String.raw`A measurable $f$ on $\Omega$ is **locally integrable**, $f\in L^1_{loc}(\Omega)$, if $\int_K|f|\,dm<\infty$ for every compact $K\subset\Omega$. Such an $f$ defines a distribution
$$\Lambda_f\varphi=\int_\Omega\varphi(x)f(x)\,dx\qquad(\varphi\in\mathscr D(\Omega)),$$
of order $0$, since $|\Lambda_f\varphi|\le\big(\int_K|f|\big)\|\varphi\|_0$ for $\varphi\in\mathscr D_K$. If $\Lambda_f=\Lambda_g$ then $f=g$ a.e., so $f$ is identified with $\Lambda_f$ and one writes $f\in\mathscr D'(\Omega)$. Likewise every complex Borel measure $\mu$ on $\Omega$ (or positive Borel measure finite on compact sets) is a distribution of order $0$ via $\Lambda_\mu\varphi=\int\varphi\,d\mu$.`,
      idea: String.raw`The estimate is immediate and is exactly the criterion of 6.8 with $N=0$. For injectivity, test $f-g$ against shrinking bumps centred at $x$: the normalised averages converge to $(f-g)(x)$ at every Lebesgue point, hence almost everywhere (RCA 7.7). So distributions genuinely extend $L^1_{loc}$, and measures sit in between.`,
      caption: String.raw`Pick $f$ (or a measure) and drag the bump $\varphi$ by its centre $c$; shrink its width $r$. Top: the shaded product whose integral is $\Lambda\varphi$. Bottom: the normalised readings $\Lambda(\varphi_c)/\int\varphi_c$ for every centre $c$, over the faint graph of $f$. As $r\to0$ they converge to $f$ — at a jump to the midpoint — so $\Lambda_f$ determines $f$. Near an atom of the measure the readings blow up like $1/r$: a measure is a distribution of order $0$, but not a function.`,
      deps: ['fa-6.7', 'fa-6.8', 'rca-7.7'],
      see: ['rca-6.19'],
      tags: ['distributions', 'locally integrable'],
      verify: true,
      viz(v) {
        const M = v.M;
        const which = v.select('$\\Lambda=$', [
          { value: 'step', label: 'step function' },
          { value: 'sing', label: '$|x|^{-1/2}$' },
          { value: 'meas', label: 'measure with atoms' },
        ], 'step');
        const rS = v.slider('width $r$ of $\\varphi$', 0.04, 1.2, 0.45, { step: 0.005, log: true });
        const top = v.stage({ x: [-3, 3], y: [-1, 3.1], height: 240, full: true, axes: true, title: 'the function (purple), the bump $\\varphi_c$ (blue) and their product' });
        const bot = v.stage({ x: [-3, 3], y: [-1, 3.1], height: 230, full: true, axes: true, title: 'normalised readings $c\\mapsto\\Lambda(\\varphi_c)\\,/\\!\\int\\varphi_c$' });
        const hc = top.handle(0.9, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -2.7, 2.7), 0] });
        const step = (x) => (x < -1.3 ? -0.5 : x < 0.3 ? 1.4 : x < 1.5 ? 0.4 : 2.1) + 0.25 * Math.sin(1.7 * x);
        const g = (x) => 0.5 * Math.exp(-x * x / 2);
        const ATOMS = [[-1.1, 0.7], [1.4, 0.45]];
        const F = { step, sing: (x) => 1 / Math.sqrt(Math.max(Math.abs(x), 1e-12)), meas: g };
        const ph = (x, c, r) => phiD(0, x, c, r);
        // ∫ φ_c |x|^{-1/2}: substitute x = ±t² on each side of 0 (smooth integrands)
        const singInt = (c, r) => {
          const a = c - r, b = c + r; let s = 0;
          if (b > 0) s += simpson((t) => 2 * ph(t * t, c, r), Math.sqrt(Math.max(a, 0)), Math.sqrt(b), 200);
          if (a < 0) s += simpson((t) => 2 * ph(-t * t, c, r), Math.sqrt(Math.max(-b, 0)), Math.sqrt(-a), 200);
          return s;
        };
        const pair = (key, c, r) => {
          if (key === 'sing') return singInt(c, r);
          let s = simpson((x) => F[key](x) * ph(x, c, r), c - r, c + r, 320);
          if (key === 'meas') for (const [a, m] of ATOMS) s += m * ph(a, c, r);
          return s;
        };
        const absInt = (key, c, r) => {   // |μ|([c−r, c+r]) or ∫|f| there
          if (key === 'sing') { const a = c - r, b = c + r; const P = (x) => 2 * Math.sign(x) * Math.sqrt(Math.abs(x)); return P(b) - P(a); }
          let s = simpson((x) => Math.abs(F[key](x)), c - r, c + r, 400);
          if (key === 'meas') for (const [a, m] of ATOMS) if (a >= c - r && a <= c + r) s += m;
          return s;
        };
        const cache = new Map();
        const readings = (key, r) => {
          const k = key + r.toFixed(4);
          if (!cache.has(k)) { if (cache.size > 40) cache.clear(); cache.set(k, M.linspace(-3, 3, 301).map((c) => [c, pair(key, c, r) / (r * I0)])); }
          return cache.get(k);
        };
        let st = {};
        v.legend([['purple', '$f$ or $\\mu$'], ['blue', 'bump $\\varphi_c$ (peak $1$)'], ['teal', 'product $f\\varphi_c$; its area is $\\Lambda\\varphi_c$', { area: true }], ['teal', 'normalised readings']]);
        v.render(() => {
          const key = which.value, r = rS.value, c = hc.x, f = F[key];
          // top
          if (key === 'meas') {
            top.fn(g, { color: 'purple', width: 2.2 });
            for (const [a, m] of ATOMS) { top.arrow(a, 0, a, 2.6 * m, { color: 'purple', width: 2.6, head: 9 }); top.tex(`${m}\\,\\delta_{${a}}`, a, 2.6 * m, { color: 'purple', dy: -12, size: 13 }); }
          } else top.fn((x) => Math.min(f(x), 3.4), { color: 'purple', width: 2.2, n: 900 });
          top.fn((x) => f(x) * ph(x, c, r), { domain: [c - r, c + r], color: 'teal', width: 1, fill: 'teal', fillAlpha: 0.32, n: 500 });
          if (key === 'meas') for (const [a, m] of ATOMS) { const y = ph(a, c, r); if (y > 1e-4) { top.line(a, 0, a, m * y * 2.6, { color: 'teal', width: 4, alpha: 0.7 }); } }
          top.fn((x) => ph(x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.4, n: 400 });
          const val = pair(key, c, r), mass = r * I0, rd = val / mass;
          top.corner(`Λφ = ${v.fmt(val, 4)}`, 'tl', { color: 'teal', weight: 700, size: 13 });
          // bottom
          if (key === 'meas') { bot.fn(g, { color: 'purple', width: 1.6, alpha: 0.45 }); for (const [a] of ATOMS) bot.vline(a, { color: 'purple', width: 1, dash: [4, 4], alpha: 0.6 }); }
          else bot.fn((x) => Math.min(f(x), 3.4), { color: 'purple', width: 1.6, alpha: 0.45, n: 900 });
          const R = readings(key, r);
          bot.path(R.map(([x, y]) => [x, Math.min(y, 3.6)]), { color: 'teal', width: 2.4 });
          bot.vline(c, { color: 'muted', width: 1, dash: [3, 3] });
          bot.dot(c, Math.min(rd, 3.5), { color: 'teal', r: 5.5 });
          const peak = Math.max(...R.map((p) => p[1]));
          if (key === 'meas') bot.corner(`highest reading ${v.fmt(peak, 3)} (grows like 1/r at the atoms)`, 'tr', { color: peak > 3.1 ? 'red' : 'muted', weight: 600 });
          const fc = key === 'meas' ? g(c) : f(c);
          st = { key, val, mass, rd, fc, bound: absInt(key, c, r), r };
        });
        v.readout(() => {
          const s = st, nm = s.key === 'meas' ? '\\mu' : 'f';
          const tail = s.key === 'meas' ? ` (density of the continuous part at $c$: $${v.fix(s.fc, 3)}$)` : ` against $f(c) = ${v.fix(s.fc, 3)}$`;
          return `$\\Lambda_{${nm}}\\varphi_c = ${v.fix(s.val, 4)}$, $\\int\\varphi_c = ${v.fix(s.mass, 4)}$, reading $${v.fix(s.rd, 4)}$${tail}. Order $0$: $|\\Lambda\\varphi_c|\\le\\|\\varphi_c\\|_0\\,|${nm}|([c-r,c+r]) = ${v.fix(s.bound, 4)}$.`;
        });
      },
    },
    {
      num: '6.12',
      kind: 'Definition',
      name: 'Derivatives of distributions',
      statement: String.raw`For $\Lambda\in\mathscr D'(\Omega)$ and a multi-index $\alpha$, the distribution $D^\alpha\Lambda$ is defined by
$$(D^\alpha\Lambda)(\varphi)=(-1)^{|\alpha|}\,\Lambda(D^\alpha\varphi)\qquad(\varphi\in\mathscr D(\Omega)).$$
It is again a distribution, every distribution has derivatives of all orders, and $D^\alpha D^\beta\Lambda=D^{\alpha+\beta}\Lambda=D^\beta D^\alpha\Lambda$. If $f\in C^N(\Omega)$ and $|\alpha|\le N$, then $D^\alpha\Lambda_f=\Lambda_{D^\alpha f}$, so this extends classical differentiation.`,
      idea: String.raw`$D^\alpha$ is a continuous linear map of $\mathscr D(\Omega)$ into itself (6.6a), so $\Lambda\circ D^\alpha$ is continuous. For $f\in C^N$ the identity $\int(D^\alpha f)\varphi=(-1)^{|\alpha|}\int fD^\alpha\varphi$ is integration by parts, one variable at a time, with no boundary terms because $\varphi$ has compact support. Mixed partials commute because they commute on test functions.`,
      caption: String.raw`$f$ is smooth except at $a$ (drag it), where it jumps by $s$ and its slope changes by $\kappa$. Bottom: $Df$ or $D^2f$ as a distribution — the classical derivative (purple curve) plus point terms at $a$: $s\,\delta_a$ for $Df$; $\kappa\,\delta_a$ and the dipole $s\,\delta'_a$ for $D^2f$. Drag the test function $\varphi$ across $a$: the readout checks that $(-1)^k\int f\varphi^{(k)}$ equals classical part plus point terms, and shows how wrong the classical part alone is.`,
      deps: ['fa-6.7', 'fa-6.6a', 'fa-6.11'],
      tags: ['distributions', 'derivatives'],
      verify: true,
      viz(v) {
        const M = v.M;
        const kS = v.select('show', [{ value: 1, label: "$Df$" }, { value: 2, label: "$D^2f$" }], 1);
        const sS = v.slider('jump $s$', -1.2, 1.2, 0.8, { step: 0.01 });
        const kapS = v.slider('slope change $\\kappa$', -1.2, 1.2, 0.6, { step: 0.01 });
        const rS = v.slider('width of $\\varphi$', 0.3, 2, 1.1, { step: 0.01 });
        const top = v.stage({ x: [-4, 4], y: [-1.6, 2.6], height: 220, full: true, axes: true, title: '$f=g+\\big(s+\\kappa(x-a)\\big)H(x-a)$, and the test function $\\varphi$' });
        const bot = v.stage({ x: [-4, 4], y: [-2.2, 2.2], height: 230, full: true, axes: true });
        const ha = top.handle(-0.7, 0, { color: 'purple', label: 'a', labelPos: 's', constrain: (x) => [M.clamp(x, -3.3, 3.3), 0] });
        const hc = top.handle(0.1, 1, { color: 'blue', label: 'φ', constrain: (x) => [M.clamp(x, -3.2, 3.2), 1] });
        const g = (x) => 0.45 * Math.cos(1.3 * x) + 0.15 * x, g1 = (x) => -0.585 * Math.sin(1.3 * x) + 0.15, g2 = (x) => -0.7605 * Math.cos(1.3 * x);
        let st = {};
        v.legend([['purple', 'classical part of $D^kf$'], ['purple', 'point terms at $a$', { area: true }], ['blue', 'test function $\\varphi$']]);
        v.render(() => {
          const k = kS.value, s = sS.value, kap = kapS.value, a = ha.x, c = hc.x, r = rS.value;
          const f = (x) => g(x) + (x > a ? s + kap * (x - a) : 0);
          const cl = k === 1 ? (x) => g1(x) + (x > a ? kap : 0) : g2;
          // top panel
          top.fn(f, { domain: [-4, a], color: 'purple', width: 2.4 });
          top.fn(f, { domain: [a, 4], color: 'purple', width: 2.4 });
          top.line(a, g(a), a, g(a) + s, { color: 'purple', width: 1.2, dash: [3, 3] });
          top.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.08 });
          // bottom panel: D^k f
          bot.setTitle(k === 1 ? '$Df = g\' + \\kappa H(x-a) + s\\,\\delta_a$' : '$D^2f = g\'\' + \\kappa\\,\\delta_a + s\\,\\delta\'_a$');
          bot.fn(cl, { domain: [-4, a], color: 'purple', width: 2.4 });
          bot.fn(cl, { domain: [a, 4], color: 'purple', width: 2.4 });
          bot.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 1.6, alpha: 0.6 });
          if (k === 1) deltaArrow(bot, a, s, 1.5, 'purple', 's\\,\\delta_a');
          else { deltaArrow(bot, a, kap, 1.5, 'purple', '\\kappa\\,\\delta_a', 'right'); dipole(bot, a, s, 1.2, 'purple', "s\\,\\delta'_a"); }
          // the pairing, computed three ways
          const n = 400, lo = c - r, hi = c + r;
          // split at a; the right piece starts just after a so that one-sided values are used at the jump
          const piece = (h) => (a > lo && a < hi ? simpson(h, lo, a, n) + simpson(h, a + 1e-12, hi, n) : simpson(h, lo, hi, 2 * n));
          const lhs = (k === 1 ? -1 : 1) * piece((x) => f(x) * phiD(k, x, c, r));
          const clp = piece((x) => cl(x) * phiD(0, x, c, r));
          const pt = k === 1 ? s * phiD(0, a, c, r) : kap * phiD(0, a, c, r) - s * phiD(1, a, c, r);
          bot.corner(`point terms contribute ${v.fmt(pt, 4)}`, 'tl', { color: Math.abs(pt) > 1e-4 ? 'purple' : 'muted', weight: 600 });
          st = { k, lhs, clp, pt };
        });
        v.readout(() => {
          const s = st, sg = s.k === 1 ? '-' : '';
          const pts = s.k === 1 ? 's\\,\\varphi(a)' : "\\kappa\\varphi(a)-s\\varphi'(a)";
          return `$${sg}\\int f\\,\\varphi^{(${s.k})}\\,dx = ${v.fix(s.lhs, 5)}$ $\\;=\\;$ classical $${v.fix(s.clp, 5)}$ $+$ point terms $${pts} = ${v.fix(s.pt, 5)}$ (sum $${v.fix(s.clp + s.pt, 5)}$). The classical derivative alone misses $${v.fix(s.pt, 4)}$.`;
        });
      },
    },
    {
      num: '6.14',
      kind: 'Definition',
      name: 'Multiplying a distribution by a smooth function',
      statement: String.raw`If $\Lambda\in\mathscr D'(\Omega)$ and $f\in C^\infty(\Omega)$, the product $f\Lambda$ is defined by
$$(f\Lambda)(\varphi)=\Lambda(f\varphi)\qquad(\varphi\in\mathscr D(\Omega)).$$
It is a distribution; for $\Lambda=\Lambda_g$ it is the ordinary product $\Lambda_{fg}$. For example $f\delta=f(0)\delta$, $\;f\delta'=f(0)\delta'-f'(0)\delta$, and $x\cdot\mathrm{p.v.}\frac1x=1$.`,
      idea: String.raw`Multiplication by $f$ maps $\mathscr D_K$ into $\mathscr D_K$, and by Leibniz' rule $\|f\varphi\|_N\le C_N\|\varphi\|_N$ with $C_N$ depending only on the derivatives of $f$ of order $\le N$ on $K$. So $\varphi\mapsto f\varphi$ is continuous on each $\mathscr D_K$, hence on $\mathscr D(\Omega)$ (6.6), and $\Lambda\circ(f\cdot)$ is continuous. Smoothness of $f$ is essential: $\delta$ cannot be multiplied by a function that is discontinuous at $0$.`,
      caption: String.raw`Shape the multiplier $f(x)=f(0)+f'(0)x+bx^2$ with the orange handles (value at $0$, and the tangent's height at $x=1$) and the curvature slider; drag $\varphi$. Bottom: the distribution $f\Lambda$ drawn — for $\Lambda=\delta'$ a dipole of strength $f(0)$ **plus** a point mass $-f'(0)$, which appears from nothing when $f'(0)\ne0$. The readout evaluates $\Lambda(f\varphi)$ directly and from the closed form.`,
      deps: ['fa-6.7', 'fa-6.6', 'fa-6.12'],
      tags: ['distributions', 'multiplication'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.select('$\\Lambda=$', [{ value: 'd', label: '$\\delta$' }, { value: 'dp', label: "$\\delta'$" }, { value: 'pv', label: '$\\mathrm{p.v.}\\tfrac1x$' }, { value: 'H', label: '$H$ (Heaviside)' }], 'dp');
        const bS = v.slider('curvature $b$', -0.6, 0.6, -0.2, { step: 0.01 });
        const top = v.stage({ x: [-3, 3], y: [-1.5, 2.1], height: 230, full: true, axes: true, title: 'the multiplier $f$ and the test function $\\varphi$' });
        const bot = v.stage({ x: [-3, 3], y: [-2.2, 2.2], height: 230, full: true, axes: true, title: 'the distribution $f\\Lambda$' });
        const h0 = top.handle(0, 0.8, { color: 'orange', label: 'f(0)', labelPos: 'nw', constrain: (x, y) => [0, M.clamp(y, -1.3, 1.9)] });
        const h1 = top.handle(1, 1.3, { color: 'orange', label: 'tangent', labelPos: 'e', constrain: (x, y) => [1, M.clamp(y, -1.3, 1.9)] });
        const hc = top.handle(0.4, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1.6, 1.6), 0] });
        const r = 1.25;
        let st = {};
        v.legend([['orange', 'multiplier $f$'], ['blue', '$\\varphi$'], ['purple', '$f\\Lambda$']]);
        v.render(() => {
          const key = L.value, f0 = h0.y, f1 = h1.y - h0.y, b = bS.value, c = hc.x;
          const f = (x) => f0 + f1 * x + b * x * x, fp = (x) => f1 + 2 * b * x;
          const ph = (x) => phiD(0, x, c, r), php = (x) => phiD(1, x, c, r);
          top.fn(f, { color: 'orange', width: 2.4 });
          top.line(-0.6, f0 - 0.6 * f1, 1.4, f0 + 1.4 * f1, { color: 'orange', width: 1.2, dash: [5, 4] });
          top.fn(ph, { domain: [c - r, c + r], color: 'blue', width: 2.2 });
          top.fn((x) => f(x) * ph(x), { domain: [c - r, c + r], color: 'teal', width: 1.4, dash: [4, 3] });
          top.text('fφ', c + 0.35, f(c + 0.35) * ph(c + 0.35), { color: 'teal', dy: -10, math: true });
          // the product, drawn
          let direct, formula, form;
          const fph = (x) => f(x) * ph(x);
          if (key === 'd') {
            deltaArrow(bot, 0, f0, 1.3, 'purple', 'f(0)\\,\\delta');
            direct = fph(0); formula = f0 * ph(0); form = 'f(0)\\varphi(0)';
          } else if (key === 'dp') {
            dipole(bot, 0, f0, 1.1, 'purple', "f(0)\\,\\delta'");
            deltaArrow(bot, 0.8, -f1, 1.1, 'red', "-f'(0)\\,\\delta");
            bot.text('(located at 0)', 0.8, 0, { color: 'red', size: 11, dy: -f1 > 0 ? 12 : -12, align: 'center' });
            direct = -(fp(0) * ph(0) + f(0) * php(0)); formula = -f0 * php(0) - f1 * ph(0); form = "-f(0)\\varphi'(0)-f'(0)\\varphi(0)";
          } else if (key === 'pv') {
            bot.fn((x) => f(x) / x, { domain: [-3, -0.02], color: 'purple', width: 2.2 });
            bot.fn((x) => f(x) / x, { domain: [0.02, 3], color: 'purple', width: 2.2 });
            const R = Math.abs(c) + r;
            const pvInt = (h, hp) => simpson((x) => (x < 1e-9 ? 2 * hp(0) : (h(x) - h(-x)) / x), 0, R, 800);
            direct = pvInt(fph, (x) => fp(x) * ph(x) + f(x) * php(x));
            formula = f0 * pvInt(ph, php) + simpson((x) => (f1 + b * x) * ph(x), c - r, c + r, 400);
            form = 'f(0)\\,\\mathrm{p.v.}\\!\\int\\tfrac{\\varphi}{x}+\\int\\tfrac{f(x)-f(0)}{x}\\varphi';
          } else {
            bot.fn((x) => (x > 0 ? f(x) : 0), { domain: [-3, 0], color: 'purple', width: 2.2 });
            bot.fn((x) => f(x), { domain: [0, 3], color: 'purple', width: 2.2 });
            direct = simpson(fph, Math.max(0, c - r), Math.max(0, c + r), 400);
            formula = direct; form = '\\int_0^\\infty f\\varphi';
          }
          bot.fn(ph, { domain: [c - r, c + r], color: 'blue', width: 1.4, alpha: 0.55 });
          st = { key, direct, formula, form, f0, f1 };
        });
        v.readout(() => {
          const s = st;
          const extra = s.key === 'dp' && Math.abs(s.f1) > 1e-3 ? ` The $\\delta$ term with weight $-f'(0) = ${v.fix(-s.f1, 3)}$ comes from differentiating $f$.` : s.key === 'pv' && Math.abs(s.f0) < 0.03 ? ' With $f(0)\\approx0$ the singular part disappears: $f\\cdot\\mathrm{p.v.}\\frac1x$ is the smooth function $f(x)/x$.' : '';
          return `$(f\\Lambda)(\\varphi)=\\Lambda(f\\varphi) = ${v.fix(s.direct, 5)}$; closed form $${s.form} = ${v.fix(s.formula, 5)}$.${extra}`;
        });
      },
    },
    {
      num: '6.15',
      kind: 'Theorem',
      name: 'Leibniz formula for f·Λ',
      statement: String.raw`If $f\in C^\infty(\Omega)$ and $\Lambda\in\mathscr D'(\Omega)$, then for every multi-index $\alpha$
$$D^\alpha(f\Lambda)=\sum_{\beta\le\alpha}c_{\alpha\beta}\,(D^{\alpha-\beta}f)(D^\beta\Lambda),\qquad c_{\alpha\beta}=\frac{\alpha!}{\beta!\,(\alpha-\beta)!}.$$
In one variable: $(f\Lambda)'=f'\Lambda+f\Lambda'$, and $(f\Lambda)^{(k)}=\sum_j\binom kj f^{(k-j)}\Lambda^{(j)}$.`,
      idea: String.raw`For one derivative $D_i$: $(D_i(f\Lambda))(\varphi)=-\Lambda(f\,D_i\varphi)=-\Lambda(D_i(f\varphi))+\Lambda((D_if)\varphi)=(fD_i\Lambda)(\varphi)+((D_if)\Lambda)(\varphi)$. The general case follows by induction on $|\alpha|$, exactly as for functions.`,
      caption: String.raw`$\Lambda=H$ (Heaviside), so $D^jH=\delta^{(j-1)}$ for $j\ge1$, and $f(x)=e^{0.3x}\cos(\omega x+0.4)$. Drag $\varphi$ across $0$ and choose the order $k$. Bars: the $k+1$ terms $\binom kj(f^{(k-j)}D^jH)(\varphi)$ — the $j=0$ term is an integral over $(0,\infty)$, the others are point evaluations at $0$ — and, on the right, their sum next to the left side $(-1)^k\int_0^\infty f\varphi^{(k)}$, computed independently by quadrature.`,
      deps: ['fa-6.14', 'fa-6.12'],
      tags: ['distributions', 'Leibniz rule'],
      verify: true,
      viz(v) {
        const M = v.M;
        const kS = v.slider('order $k$', 1, 4, 2, { int: true });
        const wS = v.slider('frequency $\\omega$ of $f$', 0, 3, 1.4, { step: 0.01 });
        const top = v.stage({ x: [-3, 3], y: [-1.7, 1.9], height: 220, full: true, axes: true, title: '$fH$ (purple) and the test function $\\varphi$ (blue)' });
        const bot = v.stage({ x: [-0.8, 7.2], y: [-2, 2], height: 240, full: true, axes: 'box', title: 'the terms $\\binom kj\\,(f^{(k-j)}D^jH)(\\varphi)$, their sum, and the left side' });
        const hc = top.handle(0.35, 1, { color: 'blue', label: 'φ', constrain: (x) => [M.clamp(x, -1.8, 1.8), 1] });
        const r = 1.15, a = 0.3;
        let st = {};
        v.render(() => {
          const k = kS.value, w = wS.value, c = hc.x;
          // f^{(m)}(x) = Re((a+iω)^m e^{(a+iω)x + 0.4i})
          const fm = (m, x) => { const z = new v.Cx(a, w).pow(m).mul(new v.Cx(a * x, w * x + 0.4).exp()); return z.re; };
          top.fn((x) => (x > 0 ? fm(0, x) : 0), { domain: [-3, 0], color: 'purple', width: 2.2 });
          top.fn((x) => fm(0, x), { domain: [0, 3], color: 'purple', width: 2.2 });
          top.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.08 });
          top.vline(0, { color: 'muted', width: 1, dash: [3, 3] });
          // left side by quadrature
          const lo = Math.max(0, c - r), hi = Math.max(0, c + r);
          const lhs = (k % 2 ? -1 : 1) * simpson((x) => fm(0, x) * phiD(k, x, c, r), lo, hi, 800);
          // terms
          const terms = [];
          for (let j = 0; j <= k; j++) {
            if (j === 0) { terms.push(simpson((x) => fm(k, x) * phiD(0, x, c, r), lo, hi, 800)); continue; }
            let d = 0;   // (f^{(k-j)} φ)^{(j-1)}(0)
            for (let i = 0; i <= j - 1; i++) d += BIN[j - 1][i] * fm(k - j + i, 0) * phiD(j - 1 - i, 0, c, r);
            terms.push(BIN[k][j] * ((j - 1) % 2 ? -1 : 1) * d);
          }
          const sum = terms.reduce((s, t) => s + t, 0);
          const xs = terms.map((_, j) => j), xSum = k + 1.4, xL = k + 2.4;
          bot.setView([-0.8, k + 3.2], span([...terms, sum, lhs, 0], 1, 0.18));
          bot.setTicks([...xs.map((j) => [j, `j = ${j}`]), [xSum, 'sum'], [xL, 'left side']], null);
          bot.hline(0, { color: 'faint', width: 1 });
          terms.forEach((t, j) => bot.rect(j - 0.3, 0, j + 0.3, t, { fill: j === 0 ? 'purple' : 'orange', fillAlpha: 0.75, stroke: false }));
          // stacked sum
          let acc = 0;
          terms.forEach((t, j) => { bot.rect(xSum - 0.3, acc, xSum + 0.3, acc + t, { fill: j === 0 ? 'purple' : 'orange', fillAlpha: 0.35 + 0.1 * (j % 2), color: 'panel', width: 1 }); acc += t; });
          bot.line(xSum - 0.38, sum, xSum + 0.38, sum, { color: 'ink', width: 2 });
          bot.rect(xL - 0.3, 0, xL + 0.3, lhs, { fill: 'green', fillAlpha: 0.75, stroke: false });
          bot.line(xSum - 0.38, lhs, xL + 0.38, lhs, { color: 'green', width: 1.2, dash: [4, 3] });
          st = { k, terms, sum, lhs };
        });
        v.legend([['purple', '$j=0$: $\\int_0^\\infty f^{(k)}\\varphi$', { area: true }], ['orange', '$j\\ge1$: $\\binom kj\\,\\delta^{(j-1)}(f^{(k-j)}\\varphi)$', { area: true }], ['green', 'left side $(D^k(fH))(\\varphi)$', { area: true }]]);
        v.readout(() => {
          const s = st;
          return `Terms: ${s.terms.map((t) => `$${v.fix(t, 4)}$`).join(', ')}. Sum $= ${v.fix(s.sum, 6)}$; left side $(-1)^{${s.k}}\\int_0^\\infty f\\varphi^{(${s.k})} = ${v.fix(s.lhs, 6)}$.`;
        });
      },
    },
    {
      num: '6.17',
      kind: 'Theorem',
      name: 'Pointwise limits of distributions are distributions',
      statement: String.raw`Suppose $\Lambda_i\in\mathscr D'(\Omega)$ for $i=1,2,3,\dots$ and that
$$\Lambda\varphi=\lim_{i\to\infty}\Lambda_i\varphi$$
exists (as a complex number) for every $\varphi\in\mathscr D(\Omega)$. Then $\Lambda\in\mathscr D'(\Omega)$, and $D^\alpha\Lambda_i\to D^\alpha\Lambda$ in the weak* topology of $\mathscr D'(\Omega)$ for every multi-index $\alpha$.`,
      idea: String.raw`Fix a compact $K$. On the Fréchet space $\mathscr D_K$ the functionals $\Lambda_i$ converge pointwise, so by Banach–Steinhaus (2.6, 2.8) the limit is continuous on $\mathscr D_K$; since $K$ is arbitrary, $\Lambda$ is continuous on $\mathscr D(\Omega)$ by 6.6. The derivatives converge because $(D^\alpha\Lambda_i)(\varphi)=(-1)^{|\alpha|}\Lambda_i(D^\alpha\varphi)$ and $D^\alpha\varphi$ is again a test function.`,
      caption: String.raw`Three sequences of functions seen as distributions: an approximate identity $j\eta(jx)\to\delta$; the wildly growing $j^2\sin jx\to0$; and the Dirichlet kernels $D_j\to\delta$ (for $\varphi$ supported in $(-\pi,\pi)$), which do not converge at any point. Top: $\Lambda_j$ for the chosen $j$ and the test function $\varphi$ (drag it, rescaled to the panel). Bottom: $\Lambda_j\varphi$ (purple) and $(D\Lambda_j)\varphi=-\Lambda_j\varphi'$ (orange) against $j$, with the limits $\Lambda\varphi$ and $(D\Lambda)\varphi$ dashed.`,
      deps: ['fa-6.7', 'fa-6.6', 'fa-2.8', 'fa-6.12'],
      tags: ['distributions', 'convergence', 'Banach–Steinhaus'],
      verify: true,
      viz(v) {
        const M = v.M;
        const fam = v.select('$\\Lambda_j=$', [{ value: 'ai', label: '$j\\,\\eta(jx)$' }, { value: 'osc', label: '$j^2\\sin(jx)$' }, { value: 'dir', label: 'Dirichlet kernel $D_j$' }], 'ai');
        const jS = v.slider('$j$', 1, 60, 6, { int: true });
        const rS = v.slider('width of $\\varphi$', 0.5, 1.6, 1.2, { step: 0.01 });
        const top = v.stage({ x: [-3.2, 3.2], y: [-1, 3], height: 240, full: true, axes: true });
        const bot = v.stage({ x: [0, 61], y: [-1, 1], height: 230, full: true, axes: 'box', xlabel: 'j', title: '$\\Lambda_j\\varphi$ and $(D\\Lambda_j)\\varphi$ against $j$' });
        const hc = top.handle(0.35, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1.4, 1.4), 0] });
        const eta = (x) => E1 * psiD(0, x) / I0;
        const FAM = {
          ai: (j, x) => j * eta(j * x),
          osc: (j, x) => j * j * Math.sin(j * x),
          dir: (j, x) => (Math.abs(x) < 1e-7 ? (2 * j + 1) / (2 * Math.PI) : Math.sin((j + 0.5) * x) / (2 * Math.PI * Math.sin(x / 2))),
        };
        const cache = new Map();
        const seq = (key, c, r) => {
          const k = `${key}|${c.toFixed(4)}|${r.toFixed(4)}`;
          if (!cache.has(k)) {
            if (cache.size > 30) cache.clear();
            const out = [];
            for (let j = 1; j <= 60; j++) {
              const f = (x) => FAM[key](j, x);
              const lo = key === 'ai' ? Math.max(c - r, -1 / j) : c - r, hi = key === 'ai' ? Math.min(c + r, 1 / j) : c + r;
              const n = key === 'ai' ? 400 : 1600;
              out.push([simpson((x) => f(x) * phiD(0, x, c, r), lo, hi, n), -simpson((x) => f(x) * phiD(1, x, c, r), lo, hi, n)]);
            }
            cache.set(k, out);
          }
          return cache.get(k);
        };
        let st = {};
        v.legend([['purple', '$\\Lambda_j$ (top) and $\\Lambda_j\\varphi$ (bottom)', { dot: true }], ['orange', '$(D\\Lambda_j)\\varphi=-\\Lambda_j\\varphi\'$', { dot: true }], ['blue', '$\\varphi$ (rescaled)'], ['green', 'limits', { dash: true }]]);
        v.render(() => {
          const key = fam.value, j = jS.value, r = rS.value, c = hc.x;
          const f = (x) => FAM[key](j, x);
          // top: Λ_j and φ, on a scale adapted to Λ_j
          const xs = M.linspace(-3.2, 3.2, 1200), ys = xs.map(f);
          const [lo0, hi] = span([...ys, 0], 1, 0.1), lo = Math.min(lo0, -0.14 * (hi - lo0));
          top.setView(null, [lo, hi]);
          top.setTitle(key === 'ai' ? `$\\Lambda_{${j}}=${j}\\,\\eta(${j}x)$, peak $${v.fix(j * eta(0), 1)}$` : key === 'osc' ? `$\\Lambda_{${j}}=${j * j}\\sin(${j}x)$` : `$D_{${j}}(x)=\\dfrac{\\sin(${j}.5\\,x)}{2\\pi\\sin(x/2)}$`);
          top.path(xs.map((x, i) => [x, ys[i]]), { color: 'purple', width: key === 'osc' && j > 20 ? 0.8 : 1.8 });
          const sc = 0.6 * Math.max(hi, 0.5);
          top.fn((x) => sc * phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.1 });
          // bottom: the sequences
          const S = seq(key, c, r);
          const lim0 = key === 'osc' ? 0 : phiD(0, 0, c, r), lim1 = key === 'osc' ? 0 : -phiD(1, 0, c, r);
          const all = [...S.flat(), lim0, lim1].map((y) => M.clamp(y, -40, 40));
          bot.setView(null, span(all, 0.6, 0.12));
          bot.hline(lim0, { color: 'green', width: 1.4, dash: [6, 4] });
          bot.hline(lim1, { color: 'green', width: 1.4, dash: [2, 3] });
          bot.dots(S.map((p, i) => [i + 1, p[1]]), { color: 'orange', r: 2.8 });
          bot.dots(S.map((p, i) => [i + 1, p[0]]), { color: 'purple', r: 2.8 });
          bot.vline(j, { color: 'muted', width: 1, dash: [3, 3] });
          bot.dot(j, S[j - 1][0], { color: 'purple', r: 5 });
          bot.dot(j, S[j - 1][1], { color: 'orange', r: 5 });
          st = { key, j, a: S[j - 1][0], b: S[j - 1][1], lim0, lim1, tail: Math.max(...S.slice(40).map((p) => Math.max(Math.abs(p[0] - lim0), Math.abs(p[1] - lim1)))) };
        });
        v.readout(() => {
          const s = st, L = { ai: '\\delta', osc: '0', dir: '\\delta' }[s.key];
          return `$\\Lambda_{${s.j}}\\varphi = ${v.fix(s.a, 4)}$, $(D\\Lambda_{${s.j}})\\varphi = ${v.fix(s.b, 4)}$; limits $\\Lambda\\varphi = ${v.fix(s.lim0, 4)}$, $(D\\Lambda)\\varphi = ${v.fix(s.lim1, 4)}$ with $\\Lambda=${L}$. For $j\\ge41$ both are within $${v.sci(s.tail, 2)}$ of their limits.`;
        });
      },
    },
    {
      num: '6.18',
      kind: 'Theorem',
      name: 'Products converge: f_iΛ_i → fΛ',
      statement: String.raw`If $f_i\to f$ in $C^\infty(\Omega)$ (uniformly on compact sets, together with all derivatives) and $\Lambda_i\to\Lambda$ in $\mathscr D'(\Omega)$, then $f_i\Lambda_i\to f\Lambda$ in $\mathscr D'(\Omega)$.`,
      idea: String.raw`Fix $\varphi\in\mathscr D_K$. The convergent sequence $\{\Lambda_i\}$ is pointwise bounded on the Fréchet space $\mathscr D_K$, hence equicontinuous (2.6): $|\Lambda_i\psi|\le C\|\psi\|_N$ for all $i$ and $\psi\in\mathscr D_K$. Then
$$|\Lambda_i(f_i\varphi)-\Lambda(f\varphi)|\le C\|(f_i-f)\varphi\|_N+|(\Lambda_i-\Lambda)(f\varphi)|,$$
and both terms tend to $0$ — the first because $f_i\to f$ with all derivatives up to order $N$ on $K$.`,
      caption: String.raw`$\Lambda_i=\delta'_{1/i}$, a dipole sliding into $0$, converges to $\delta'$ (order $1$). The multipliers $f_i=f+i^{-p}\sin(i^2x)$ converge to $f$ uniformly for every $p>0$, but $f_i'$ converges only if $p>2$. Bottom: $(f_i\Lambda_i)(\varphi)=-(f_i\varphi)'(1/i)$ against $i$, with the limit $(f\delta')(\varphi)$ dashed. For $p>2$ it converges; for $p\le2$ it does not — convergence of $f_i$ in $C^\infty$ (here $C^1$ is what matters) cannot be dropped.`,
      deps: ['fa-6.17', 'fa-6.14', 'fa-2.6'],
      tags: ['distributions', 'convergence', 'multiplication'],
      verify: true,
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p$ in $f_i=f+i^{-p}\\sin(i^2x)$', 0.5, 3.5, 1.5, { step: 0.05 });
        const iS = v.slider('$i$', 1, 80, 4, { int: true });
        const top = v.stage({ x: [-2.5, 2.5], y: [-1.2, 2.6], height: 230, full: true, axes: true, title: '$f_i$ (orange), $f$ (dashed), $\\varphi$ (blue) and $\\Lambda_i=\\delta\'_{1/i}$ (purple)' });
        const bot = v.stage({ x: [0, 81], y: [-3, 3], height: 230, full: true, axes: 'box', xlabel: 'i', title: '$(f_i\\Lambda_i)(\\varphi)=-(f_i\\varphi)\'(1/i)$ against $i$' });
        const hc = top.handle(0.3, -0.9, { color: 'blue', label: 'φ', labelPos: 'e', constrain: (x) => [M.clamp(x, -1.2, 1.2), -0.9] });
        const r = 1.2;
        const f = (x) => 1 + 0.4 * Math.sin(1.2 * x), fp = (x) => 0.48 * Math.cos(1.2 * x);
        let st = {};
        v.legend([['purple', '$(f_i\\Lambda_i)(\\varphi)$', { dot: true }], ['green', 'limit $(f\\delta\')(\\varphi)=-(f\\varphi)\'(0)$', { dash: true }], ['orange', 'envelope $f\\pm i^{-p}$', { area: true }]]);
        v.render(() => {
          const p = pS.value, I = iS.value, c = hc.x;
          const fi = (i, x) => f(x) + Math.pow(i, -p) * Math.sin(i * i * x), fip = (i, x) => fp(x) + Math.pow(i, 2 - p) * Math.cos(i * i * x);
          const val = (i) => { const x = 1 / i; return -(fip(i, x) * phiD(0, x, c, r) + fi(i, x) * phiD(1, x, c, r)); };
          // top
          const amp = Math.pow(I, -p);
          top.between((x) => f(x) + amp, (x) => f(x) - amp, -2.5, 2.5, { fill: 'orange', fillAlpha: 0.15 });
          if (I * I * 5 / M.TAU < 160) top.fn((x) => fi(I, x), { color: 'orange', width: 1.8, n: 2000 });
          else top.corner(`f_${I} oscillates too fast to draw (${Math.round(I * I * 5 / M.TAU)} periods)`, 'tr', { color: 'orange' });
          top.fn(f, { color: 'orange', width: 1.4, dash: [6, 4] });
          top.fn((x) => phiD(0, x, c, r) - 0.9, { domain: [c - r, c + r], color: 'blue', width: 2.2 });
          dipole(top, 1 / I, 1, 0.5, 'purple', null);
          top.tex(`\\delta'_{1/${I}}`, 1 / I + 0.1, 0.5, { color: 'purple', align: 'left', dx: 6, size: 14 });
          // bottom
          const seq = M.range(80).map((k) => [k + 1, val(k + 1)]);
          const lim = -(fp(0) * phiD(0, 0, c, r) + f(0) * phiD(1, 0, c, r));
          const ys = seq.map((q) => q[1]);
          bot.setView(null, span([...ys.map((y) => M.clamp(y, -60, 60)), lim], 1, 0.1));
          bot.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] });
          bot.path(seq, { color: 'purple', width: 0.8, alpha: 0.4 });
          bot.dots(seq, { color: 'purple', r: 2.8 });
          bot.vline(I, { color: 'muted', width: 1, dash: [3, 3] });
          bot.dot(I, val(I), { color: 'purple', r: 5.5 });
          const tail = Math.max(...seq.slice(60).map((q) => Math.abs(q[1] - lim)));
          bot.setTitle(`$(f_i\\Lambda_i)(\\varphi)=-(f_i\\varphi)'(1/i)$ against $i$ — ` + (p > 2 ? `converges: error $\\le ${v.fix(tail, 3)}$ for $i>60$` : `**no convergence**: error up to $${v.fix(tail, 2)}$ for $i>60$`));
          st = { p, I, cur: val(I), lim, sup0: amp, sup1: Math.pow(I, 2 - p) };
        });
        v.readout(() => {
          const s = st;
          return `At $i=${s.I}$: $\\|f_i-f\\|_\\infty = ${v.fix(s.sup0, 4)}$, $\\|f_i'-f'\\|_\\infty = ${v.fix(s.sup1, 4)}$; $(f_i\\Lambda_i)(\\varphi) = ${v.fix(s.cur, 4)}$ vs. the limit $${v.fix(s.lim, 4)}$. ` + (s.p > 2 ? 'Here $f_i\\to f$ in $C^1$, which is all an order-one distribution sees.' : 'Here $f_i\\to f$ uniformly but not in $C^1$, so the hypothesis of the theorem fails.');
        });
      },
    },
  ],
};
