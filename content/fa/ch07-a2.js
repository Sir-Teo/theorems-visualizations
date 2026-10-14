// Rudin, Functional Analysis — Chapter 7 (part 2): Plancherel and tempered distributions
//
// Conventions as in part 1: dm(x) = (2π)^{-1/2} dx, f̂(t) = ∫ f(x) e^{-ixt} dm(x); a function g is identified with the
// distribution φ ↦ ∫ g φ dm. Numbering recalled, not checked against the book; uncertain items carry `verify: true`.

const RT2PI = Math.sqrt(2 * Math.PI);
/** Trapezoid rule on [a, b] with n panels. */
function trap(f, a, b, n) {
  const h = (b - a) / n; let s = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) s += f(a + i * h);
  return s * h;
}
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
/** Sine integral Si(x): power series for |x| < 4, auxiliary rational approximations (A&S 5.2.38–39) beyond. */
function Si(x) {
  const ax = Math.abs(x), sg = Math.sign(x);
  if (ax < 4) { let term = ax, s = ax; for (let k = 1; k < 40; k++) { term *= -ax * ax / ((2 * k) * (2 * k + 1)); const add = term / (2 * k + 1); s += add; if (Math.abs(add) < 1e-17) break; } return sg * s; }
  const x2 = ax * ax;
  const f = (x2 ** 4 + 38.027264 * x2 ** 3 + 265.187033 * x2 ** 2 + 335.67732 * x2 + 38.102495) / (ax * (x2 ** 4 + 40.021433 * x2 ** 3 + 322.624911 * x2 ** 2 + 570.23628 * x2 + 157.105423));
  const g = (x2 ** 4 + 42.242855 * x2 ** 3 + 302.757865 * x2 ** 2 + 352.018498 * x2 + 21.821899) / (x2 * (x2 ** 4 + 48.196927 * x2 ** 3 + 482.485984 * x2 ** 2 + 1114.978885 * x2 + 449.690326));
  return sg * (Math.PI / 2 - f * Math.cos(ax) - g * Math.sin(ax));
}
const hExp = (t) => (t > 0 ? Math.exp(-1 / t) : 0);
const step = (t) => { const a = hExp(t), b = hExp(1 - t); return a / (a + b); };
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const logTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, p10(k)]); return out; };
function deltaArrow(S, x, w, unit, color, label) {
  if (Math.abs(w) < 1e-9) return;
  S.arrow(x, 0, x, w * unit, { color, width: 2.6, head: 9 });
  if (label) S.tex(label, x, w * unit, { color, dy: w > 0 ? -12 : 12, size: 14 });
}
function dipole(S, x, w, unit, color, label) {
  const h = 0.1, L = w * unit;
  S.arrow(x - h, 0, x - h, L, { color, width: 2.2, head: 8 });
  S.arrow(x + h, 0, x + h, -L, { color, width: 2.2, head: 8 });
  if (label) S.tex(label, x - h, L, { color, align: 'right', dx: -6, dy: L > 0 ? 4 : -4, size: 14 });
}

export default {
  book: 'fa',
  chapter: 7,
  items: [
    {
      num: '7.8',
      kind: 'Theorem',
      name: 'Products and convolutions of Schwartz functions',
      statement: String.raw`If $f,g\in\mathscr S_n$, then $fg\in\mathscr S_n$ and $f*g\in\mathscr S_n$, and
$$(f*g)^\wedge=\hat f\,\hat g,\qquad(fg)^\wedge=\hat f*\hat g .$$`,
      idea: String.raw`$fg\in\mathscr S_n$ by Leibniz' rule. The first identity is 7.2(c) (Fubini). For the second, apply the first to $\hat f,\hat g\in\mathscr S_n$ and invert: $(\hat f*\hat g)^\wedge=\hat{\hat f}\,\hat{\hat g}=\check f\check g=(fg)^\vee$, and transforming once more with 7.7 gives $(fg)^\wedge=\hat f*\hat g$. Hence also $f*g=(\hat f\hat g)^\vee\in\mathscr S_n$ since $\mathcal F$ maps $\mathscr S_n$ onto itself.`,
      caption: String.raw`$f(x)=e^{-ax^2/2}e^{ibx}$ and $g(x)=\operatorname{sech}x$, both in $\mathscr S_1$, with known transforms $\hat f(t)=a^{-1/2}e^{-(t-b)^2/2a}$ and $\hat g(t)=\sqrt{\pi/2}\,\operatorname{sech}(\pi t/2)$. Left: $\operatorname{Re}f$, $g$ and the product $\operatorname{Re}(fg)$. Right: the transform of the product computed by quadrature in $x$ (purple line), against the convolution $\hat f*\hat g$ computed by quadrature in $t$ (green dots). Change the width and the modulation: the two computations agree.`,
      deps: ['fa-7.7', 'fa-7.4', 'fa-7.2'],
      tags: ['Fourier transform', 'Schwartz space', 'convolution'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('width parameter $a$', 0.15, 3, 0.6, { step: 0.01 });
        const bS = v.slider('modulation $b$', -3, 3, 1.5, { step: 0.01 });
        const L = v.stage({ x: [-6, 6], y: [-1.2, 1.3], height: 270, axes: true, title: '$x$-space: $\\mathrm{Re}\\,f$, $g$, $\\mathrm{Re}(fg)$' });
        const R = v.stage({ x: [-7, 7], y: [-0.3, 1.6], height: 270, axes: true, title: '$t$-space: $\\hat f$, $\\hat g$, $(fg)^\\wedge$ and $\\hat f*\\hat g$' });
        const g = (x) => 1 / Math.cosh(x), gh = (t) => Math.sqrt(Math.PI / 2) / Math.cosh(Math.PI * t / 2);
        let st = {};
        v.legend([['blue', '$f$, $\\hat f$'], ['orange', '$g$, $\\hat g$'], ['purple', '$fg$, $(fg)^\\wedge$ (quadrature in $x$)'], ['green', '$\\hat f*\\hat g$ (quadrature in $t$)', { dot: true }]]);
        v.render(() => {
          const a = aS.value, b = bS.value;
          const fh = (t) => Math.exp(-((t - b) ** 2) / (2 * a)) / Math.sqrt(a);
          L.fn((x) => Math.exp(-a * x * x / 2) * Math.cos(b * x), { color: 'blue', width: 1.6, alpha: 0.8 });
          L.fn(g, { color: 'orange', width: 1.6, alpha: 0.8 });
          L.fn((x) => Math.exp(-a * x * x / 2) * Math.cos(b * x) * g(x), { color: 'purple', width: 2.6, fill: 'purple', fillAlpha: 0.12 });
          // (fg)^ by quadrature: the product is even times e^{ibx}, so its transform is real
          const X = Math.min(30, Math.sqrt(60 / a) + 2);
          const fgHat = (t) => trap((x) => Math.exp(-a * x * x / 2) * g(x) * Math.cos((b - t) * x), -X, X, 1600) / RT2PI;
          const conv = (t) => trap((s) => fh(t - s) * gh(s), -22, 22, 1600) / RT2PI;
          const ts = M.linspace(-7, 7, 141), A = ts.map(fgHat), Bd = ts.filter((_, i) => i % 5 === 0).map((t) => [t, conv(t)]);
          R.setView(null, span([...A, ...Bd.map((p) => p[1]), fh(b), gh(0), 0], 1, 0.1));
          R.fn(fh, { color: 'blue', width: 1.6, alpha: 0.75 });
          R.fn(gh, { color: 'orange', width: 1.6, alpha: 0.75 });
          R.path(ts.map((t, i) => [t, A[i]]), { color: 'purple', width: 2.6 });
          R.dots(Bd, { color: 'green', r: 3.6 });
          const err = Math.max(...Bd.map(([t, y]) => Math.abs(y - fgHat(t))));
          st = { err, peak: Math.max(...A) };
        });
        v.readout(() => `$\\max_t|(fg)^\\wedge(t)-(\\hat f*\\hat g)(t)| = ${v.sci(st.err + 1e-17, 2)}$ at the dots; peak of $(fg)^\\wedge$: $${v.fix(st.peak, 4)}$.`);
      },
    },
    {
      num: '7.9',
      kind: 'Theorem',
      name: 'The Plancherel theorem',
      statement: String.raw`There is a linear isometry $\Psi$ of $L^2(\R^n)$ onto $L^2(\R^n)$, uniquely determined by
$$\Psi f=\hat f\qquad(f\in\mathscr S_n).$$
It satisfies $\langle\Psi f,\Psi g\rangle=\langle f,g\rangle$, agrees with the Fourier transform on $L^1\cap L^2$, and $\Psi f$ is the $L^2$-limit of the truncated transforms $\int_{|x|\le A}f\,e_{-t}\,dm_n$ as $A\to\infty$.`,
      idea: String.raw`For $f,g\in\mathscr S_n$, the inversion theorem and Fubini give $\int f\bar g\,dm_n=\int\hat f\,\bar{\hat g}\,dm_n$: the transform is an isometry of $\mathscr S_n$ in the $L^2$ norm. Since $\mathscr S_n$ is dense in $L^2$, it extends uniquely to an isometry $\Psi$ of $L^2$ into $L^2$; its range is closed and contains $\mathscr S_n$, hence is all of $L^2$. For $f\in L^1\cap L^2$, approximating by Schwartz functions in both norms shows $\Psi f=\hat f$.`,
      caption: String.raw`Two functions in $L^2$ but not in $L^1$: $\operatorname{sinc}x=\frac{\sin x}{x}$, whose transform is the box $\sqrt{\pi/2}\,1_{[-1,1]}$, and $\frac1{1+ix}$, whose transform is $\sqrt{2\pi}\,e^{t}$ for $t<0$ and $0$ for $t>0$. The integral defining $\hat f$ does not converge absolutely, so truncate it to $|x|\le A$ (left, shaded). Right: the truncated transforms (purple) overshoot at the jumps — Gibbs — and never converge uniformly, but they converge in $L^2$ to $\Psi f$ (green). Bottom: $\|\varphi_A-\Psi f\|_2$ against $A$; the readout checks $\|\Psi f\|_2=\|f\|_2$.`,
      deps: ['fa-7.7', 'fa-7.8', 'fa-7.4'],
      see: ['rca-9.13'],
      tags: ['Fourier transform', 'Plancherel', 'L2'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = {
          sinc: { label: '$\\frac{\\sin x}{x}$', re: (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x), im: () => 0, hat: (t) => (Math.abs(t) < 1 ? Math.sqrt(Math.PI / 2) : Math.abs(t) === 1 ? Math.sqrt(Math.PI / 2) / 2 : 0), trunc: (A, t) => (Si(A * (1 + t)) + Si(A * (1 - t))) / RT2PI },
          one: { label: '$\\frac{1}{1+ix}$', re: (x) => 1 / (1 + x * x), im: (x) => -x / (1 + x * x), hat: (t) => (t < 0 ? RT2PI * Math.exp(t) : 0), trunc: null },
        };
        F.one.trunc = (A, t) => 2 * simpson((x) => (Math.cos(x * t) - x * Math.sin(x * t)) / (1 + x * x), 0, A, Math.max(200, Math.ceil(A * (Math.abs(t) + 1) * 4) * 2)) / RT2PI;
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'sinc');
        const AS = v.slider('truncation $A$', 0, 1.6, 0.9, { step: 0.01, fmt: (x) => `A = ${v.fmt(10 ** x, 3)}` });
        const Lx = v.stage({ x: [-25, 25], y: [-0.7, 1.15], height: 230, axes: true, title: '$f$ and the window $|x|\\le A$' });
        const Rt = v.stage({ x: [-3.5, 3.5], y: [-0.4, 2.9], height: 230, axes: true, title: 'truncated transforms $\\varphi_A$ and $\\Psi f$' });
        const B = v.stage({ x: [0, 1.6], y: [-2, 0.5], height: 170, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [1.6, '40']], xlabel: 'A', title: '$\\|\\varphi_A-\\Psi f\\|_2$ against $A$ (log–log)' });
        const ts = M.linspace(-8, 8, 401), dt = ts[1] - ts[0];
        const AK = M.linspace(0, 1.6, 17).map((l) => 10 ** l);
        // for 1/(1+ix): all truncations at once, by one cumulative trapezoid pass per t
        let TAB = null;
        const tableOne = () => {
          if (TAB) return TAB;
          TAB = AK.map(() => new Float64Array(ts.length));
          ts.forEach((t, j) => {
            const g = (x) => (Math.cos(x * t) - x * Math.sin(x * t)) / (1 + x * x), h = Math.min(0.02, 1 / (8 * (Math.abs(t) + 1)));
            let acc = 0, x = 0, gx = g(0), k = 0;
            while (k < AK.length) { const xn = Math.min(x + h, AK[k]), gn = g(xn); acc += (gx + gn) * (xn - x) / 2; x = xn; gx = gn; if (x >= AK[k] - 1e-12) { TAB[k][j] = 2 * acc / RT2PI; k++; } }
          });
          return TAB;
        };
        const l2 = (vals, hat) => Math.sqrt(vals.reduce((s, y, i) => s + (y - hat(ts[i])) ** 2, 0) * dt / RT2PI);
        const cache = new Map();
        const curveFor = (key, A) => { const k = key + A.toFixed(3); if (!cache.has(k)) { if (cache.size > 60) cache.clear(); cache.set(k, ts.map((t) => F[key].trunc(A, t))); } return cache.get(k); };
        const errCache = new Map();
        const errCurve = (key) => { if (!errCache.has(key)) errCache.set(key, AK.map((A, k) => [Math.log10(A), Math.log10(l2(key === 'one' ? tableOne()[k] : ts.map((t) => F.sinc.trunc(A, t)), F[key].hat))])); return errCache.get(key); };
        let st = {};
        v.legend([['blue', '$\\mathrm{Re}\\,f$'], ['orange', '$\\mathrm{Im}\\,f$'], ['purple', '$\\varphi_A(t)=\\int_{-A}^{A}f\\,e^{-ixt}dm$'], ['green', '$\\Psi f$']]);
        v.render(() => {
          const key = which.value, f = F[key], A = 10 ** AS.value;
          Lx.vband(-A, A, { color: 'purple', alpha: 0.08, edges: true });
          Lx.fn(f.re, { color: 'blue', width: 2, n: 1600 });
          if (key === 'one') Lx.fn(f.im, { color: 'orange', width: 1.6, n: 1600 });
          const C = curveFor(key, A);
          Rt.setView(null, key === 'sinc' ? [-0.4, 1.8] : [-0.6, 2.9]);
          Rt.fn(f.hat, { color: 'green', width: 3, alpha: 0.85, n: 1400 });
          Rt.path(ts.map((t, i) => [t, C[i]]), { color: 'purple', width: 1.8 });
          const E = errCurve(key);
          B.setView(null, span(E.map((p) => p[1]), 1, 0.15));
          B.setTicks([[0, '1'], [1, '10'], [1.6, '40']], logTicks(...span(E.map((p) => p[1]), 1, 0.15)));
          B.path(E, { color: 'purple', width: 2.2 });
          B.dots(E, { color: 'purple', r: 3 });
          const e = l2(C, f.hat);
          B.dot(Math.log10(A), Math.log10(e), { color: 'purple', r: 5.5 });
          const nA = Math.sqrt(C.reduce((s, y) => s + y * y, 0) * dt / RT2PI), nHat = Math.sqrt(simpson((t) => f.hat(t) ** 2, -8, 8, 16000) / RT2PI);
          const over = Math.max(...C) / Math.max(...ts.map(f.hat));
          st = { A, e, nA, nHat, nf: Math.sqrt(Math.sqrt(Math.PI / 2)), over };
        });
        v.readout(() => {
          const s = st;
          return `$A=${v.fix(s.A, 2)}$: $\\|\\varphi_A-\\Psi f\\|_2 = ${v.fix(s.e, 4)}$, overshoot $\\max\\varphi_A/\\max\\Psi f = ${v.fix(s.over, 3)}$ (it does not tend to $1$). Energies: $\\|f\\|_2 = (\\pi/2)^{1/4} = ${v.fix(s.nf, 4)}$, $\\|\\Psi f\\|_2 = ${v.fix(s.nHat, 4)}$ (on $|t|\\le8$).`;
        });
      },
    },
    // ------------------------------------------------------------------ tempered distributions
    {
      num: '7.10',
      kind: 'Theorem',
      name: '𝒟 is dense in 𝒮, continuously embedded',
      statement: String.raw`$\mathscr D(\R^n)$ is dense in $\mathscr S_n$, and the identity map $\mathscr D(\R^n)\to\mathscr S_n$ is continuous. Consequently every continuous linear functional on $\mathscr S_n$ restricts to a distribution, and distinct functionals have distinct restrictions: $\mathscr S_n'$ may be regarded as a subspace of $\mathscr D'(\R^n)$.`,
      idea: String.raw`Continuity: on each $\mathscr D_K$ the $\mathscr S_n$-norms $\sup(1+|x|^2)^N|D^\alpha\varphi|$ are dominated by multiples of the $\mathscr D_K$-norms, since $K$ is bounded. Density: for $f\in\mathscr S_n$ and a cutoff $\psi$ equal to $1$ on the unit ball, $f\psi(\cdot/R)\in\mathscr D$, and $f-f\psi(\cdot/R)$ lives where $|x|\ge R$; there the weight $(1+|x|^2)^N$ is beaten by the rapid decay of every derivative of $f$, and derivatives of $\psi(\cdot/R)$ only bring factors $R^{-k}$.`,
      caption: String.raw`Cut $f$ off smoothly outside $|x|\le R$ (green) and measure the error $f-f\chi_R$ (red) in the $\mathscr S$-norms $\|h\|_N=\max_{k\le N}\sup(1+x^2)^N|h^{(k)}|$. Bottom: these norms against $R$. For Schwartz functions they collapse fast for every $N$ — this is the density of $\mathscr D$ in $\mathscr S$. For $1/(1+x^2)$, which is not in $\mathscr S_1$, only $N=0$ goes to zero: with the weight $(1+x^2)$ the tail never becomes small.`,
      deps: ['fa-7.3', 'fa-7.4', 'fa-6.3'],
      tags: ['Schwartz space', 'density', 'tempered distributions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = {
          gauss: { label: '$(1+x)e^{-x^2/2}$', f: (x) => (1 + x) * Math.exp(-x * x / 2) },
          sech: { label: '$\\operatorname{sech}x$', f: (x) => 1 / Math.cosh(x) },
          rat: { label: '$\\frac{1}{1+x^2}\\notin\\mathscr S$', f: (x) => 1 / (1 + x * x) },
        };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'sech');
        const RS = v.slider('cutoff radius $R$', 1, 10, 3, { step: 0.05 });
        const top = v.stage({ x: [-12, 12], y: [-0.5, 1.6], height: 210, full: true, axes: true, title: '$f$, $f\\chi_R$ ($\\chi_R=1$ on $[-R,R]$, $0$ outside $[-2R,2R]$) and $f-f\\chi_R$' });
        const bot = v.stage({ x: [1, 10], y: [-12, 1], height: 230, full: true, axes: 'box', xlabel: 'R', title: '$\\|f-f\\chi_R\\|_N$ against $R$ (log scale), $N=0,1,2$' });
        const chi = (x, R) => { const u = Math.abs(x) / R; return u <= 1 ? 1 : u >= 2 ? 0 : 1 - step(u - 1); };
        const norms = (f, R) => {
          // grid on [R, 2.5R + 30] (the error vanishes for |x| < R; symmetric enough to scan x ≥ 0 and x ≤ 0)
          const out = [0, 0, 0], h = 0.004;
          for (const sg of [1, -1]) {
            const xs = []; for (let x = R - 0.01; x < 2.5 * R + 40; x += h) xs.push(sg * x);
            const e = xs.map((x) => f(x) * (1 - chi(x, R)));
            for (let i = 1; i < xs.length - 1; i++) {
              const x = xs[i], w = 1 + x * x;
              const d0 = Math.abs(e[i]), d1 = Math.abs((e[i + 1] - e[i - 1]) / (2 * h)), d2 = Math.abs((e[i + 1] - 2 * e[i] + e[i - 1]) / (h * h));
              out[0] = Math.max(out[0], d0);
              out[1] = Math.max(out[1], w * Math.max(d0, d1));
              out[2] = Math.max(out[2], w * w * Math.max(d0, d1, d2));
            }
          }
          return out;
        };
        const cache = new Map();
        const curves = (key) => { if (!cache.has(key)) { const Rs = M.linspace(1, 10, 37), rows = Rs.map((R) => norms(F[key].f, R)); cache.set(key, [0, 1, 2].map((N) => Rs.map((R, i) => [R, Math.log10(Math.max(rows[i][N], 1e-16))]))); } return cache.get(key); };
        const COL = ['blue', 'teal', 'purple'];
        let st = {};
        v.legend([['blue', '$N=0$'], ['teal', '$N=1$'], ['purple', '$N=2$'], ['green', '$f\\chi_R\\in\\mathscr D$'], ['red', '$f-f\\chi_R$']]);
        v.render(() => {
          const key = which.value, f = F[key].f, R = RS.value;
          top.fn(f, { color: 'ink', width: 1.4, alpha: 0.5 });
          top.fn((x) => f(x) * chi(x, R), { color: 'green', width: 2.4 });
          top.fn((x) => f(x) * (1 - chi(x, R)), { color: 'red', width: 2, fill: 'red', fillAlpha: 0.15 });
          top.vline(R, { color: 'muted', dash: [3, 3], width: 1 }); top.vline(-R, { color: 'muted', dash: [3, 3], width: 1 });
          const C = curves(key);
          const all = C.flat().map((p) => p[1]);
          const lo = Math.max(-16, Math.min(...all) - 0.5), hi = Math.max(...all) + 0.5;
          bot.setView(null, [lo, hi]);
          bot.setTicks(null, logTicks(lo, hi, hi - lo > 8 ? 2 : 1));
          C.forEach((pts, N) => bot.path(pts, { color: COL[N], width: 2.2 }));
          bot.vline(R, { color: 'muted', dash: [3, 3], width: 1 });
          const cur = norms(f, R);
          cur.forEach((y, N) => bot.dot(R, Math.log10(Math.max(y, 1e-16)), { color: COL[N], r: 4.5 }));
          st = { key, cur };
        });
        v.readout(() => {
          const s = st;
          return `$\\|f-f\\chi_R\\|_0 = ${v.sci(s.cur[0] + 1e-300, 2)}$, $\\;\\|\\cdot\\|_1 = ${v.sci(s.cur[1] + 1e-300, 2)}$, $\\;\\|\\cdot\\|_2 = ${v.sci(s.cur[2] + 1e-300, 2)}$` + (s.key === 'rat' ? ' — the weighted norms stay of size $1$: $f\\notin\\mathscr S_1$, so it is not a limit of test functions there.' : ' — all tend to $0$.');
        });
      },
    },
    {
      num: '7.11',
      kind: 'Definition',
      name: 'Tempered distributions',
      statement: String.raw`A **tempered distribution** is a continuous linear functional on $\mathscr S_n$; their space is $\mathscr S_n'$. By 7.10 these are exactly the distributions $u\in\mathscr D'(\R^n)$ that extend continuously to $\mathscr S_n$, i.e. that satisfy an estimate $|u(\varphi)|\le C\|\varphi\|_N$ for one $N$ and all $\varphi\in\mathscr D(\R^n)$. Examples: distributions with compact support; functions $f$ with $\int(1+|x|^2)^{-N}|f|\,dm_n<\infty$ for some $N$ (e.g. every $f\in L^p$, $1\le p\le\infty$, and every polynomial); measures of polynomial growth; and all derivatives of these.`,
      idea: String.raw`"Tempered" means: of at most polynomial growth, in a weak sense. $e^x$ is a distribution on $\R$ but not tempered — pairing it with Gaussians centred far out produces exponentially large values, which no polynomial weight can control. Yet $e^x\cos(e^x)$, just as large, *is* tempered: it is the derivative of the bounded function $\sin(e^x)$.`,
      caption: String.raw`Probe a candidate $u$ with the Schwartz functions $\varphi_c(x)=e^{-2(x-c)^2}$ moving off to infinity; the seminorms $\|\varphi_c\|_N$ grow only like $c^{2N}$, so for a tempered $u$, $|u(\varphi_c)|$ grows at most polynomially. Bottom, on log–log axes: $|u(\varphi_c)|$ against $1+c$, with reference slopes $1,2,3,4$. Polynomials and logarithms give straight lines; $e^x$ bends upward past every slope — not tempered — while the wildly oscillating $e^x\cos e^x$ collapses: oscillation cancels growth.`,
      deps: ['fa-7.10', 'fa-6.7'],
      tags: ['tempered distributions', 'Schwartz space'],
      verify: true,
      viz(v) {
        const M = v.M;
        const U = {
          poly: { label: '$x^3$', f: (x) => x ** 3 },
          log: { label: '$\\log|x|$', f: (x) => Math.log(Math.abs(x) + 1e-300) },
          exp: { label: '$e^x$', f: Math.exp },
          osc: { label: '$e^x\\cos e^x$', f: (x) => Math.exp(x) * Math.cos(Math.exp(x)) },
        };
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const cS = v.slider('centre $c$ of the probe', 0, 6, 2.5, { step: 0.01 });
        const top = v.stage({ x: [-1, 7], y: [-3, 3], height: 210, full: true, axes: true, title: '$u$ (purple, scaled to fit) and the probe $\\varphi_c$ (blue)' });
        const bot = v.stage({ x: [0, Math.log10(31)], y: [-6, 14], height: 260, full: true, axes: 'box', xlabel: '1+c', xticks: [[0, '1'], [Math.log10(2), '2'], [Math.log10(5), '5'], [1, '10'], [Math.log10(31), '31']], title: '$|u(\\varphi_c)|$ against $1+c$ (log–log); dashed: slopes $1,\\dots,4$' });
        const pair = (key, c) => {
          if (key === 'exp') return Math.exp(c + 1 / 8) * Math.sqrt(Math.PI / 2);
          if (key === 'poly') return trap((x) => x ** 3 * Math.exp(-2 * (x - c) ** 2), c - 5, c + 5, 400);
          if (key === 'log') return trap((x) => Math.log(Math.abs(x) + 1e-12) * Math.exp(-2 * (x - c) ** 2), c - 5, c + 5, 2000);
          // e^x cos(e^x) dx = cos(s) ds with s = e^x
          const lo = Math.exp(c - 4.5), hi = Math.exp(c + 4.5), n = Math.min(400000, Math.ceil((hi - lo) * 4) + 400);
          return simpson((s) => Math.cos(s) * Math.exp(-2 * (Math.log(s) - c) ** 2), lo, hi, n);
        };
        const cache = new Map();
        const curve = (key) => {
          if (!cache.has(key)) {
            const cs = key === 'osc' ? M.linspace(0, 5, 41) : M.linspace(0, 30, 61);
            cache.set(key, cs.map((c) => [Math.log10(1 + c), Math.log10(Math.abs(pair(key, c)) + 1e-300)]));
          }
          return cache.get(key);
        };
        let st = {};
        v.render(() => {
          const key = which.value, c = cS.value, f = U[key].f;
          const xs = M.linspace(-1, 7, 2000), ys = xs.map(f), m = Math.max(...ys.map(Math.abs)), sc = 2.6 / m;
          top.path(xs.map((x, i) => [x, ys[i] * sc]), { color: 'purple', width: key === 'osc' ? 0.8 : 2 });
          top.corner(`u scaled by ${v.fmt(sc, 2)}`, 'tl', { color: 'purple' });
          top.fn((x) => 2.6 * Math.exp(-2 * (x - c) ** 2), { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.1 });
          const C = curve(key);
          for (let k = 1; k <= 4; k++) bot.line(0, -1, 1.5, -1 + 1.5 * k, { color: 'muted', width: 1, dash: [4, 4] });
          bot.path(C, { color: key === 'exp' ? 'red' : key === 'osc' ? 'teal' : 'green', width: 2.4 });
          bot.dots(C, { color: key === 'exp' ? 'red' : key === 'osc' ? 'teal' : 'green', r: 2.4 });
          bot.setTicks([[0, '1'], [Math.log10(2), '2'], [Math.log10(5), '5'], [1, '10'], [Math.log10(31), '31']], logTicks(-6, 14, 2));
          const val = key === 'osc' && c > 5 ? null : pair(key, c);
          if (val != null) bot.dot(Math.log10(1 + c), Math.log10(Math.abs(val) + 1e-300), { color: 'ink', r: 5 });
          st = { key, c, val };
        });
        v.legend([['green', 'tempered: polynomial growth'], ['red', '$e^x$: not tempered'], ['teal', '$e^x\\cos e^x$: tempered'], ['muted', 'slopes $1$–$4$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          const v0 = s.val == null ? '(not computed beyond $c=5$)' : `$${v.sci(s.val, 3)}$`;
          const tail = { exp: ' Exponential growth: $e^x\\notin\\mathscr S_1\'$.', poly: ' Grows like $c^3$: tempered.', log: ' Grows like $\\log c$: tempered.', osc: ' Tiny: $e^x\\cos e^x=(\\sin e^x)\'$ is the derivative of a bounded function, hence tempered.' }[s.key];
          return `$u(\\varphi_c)$ at $c=${v.fix(s.c, 2)}$: ${v0}.${tail}`;
        });
      },
    },
    {
      num: '7.14',
      kind: 'Definition',
      name: 'Fourier transform of a tempered distribution',
      statement: String.raw`For $u\in\mathscr S_n'$, the **Fourier transform** $\hat u$ is defined by
$$\hat u(\varphi)=u(\hat\varphi)\qquad(\varphi\in\mathscr S_n).$$
Since $\varphi\mapsto\hat\varphi$ is a continuous linear map of $\mathscr S_n$ onto $\mathscr S_n$ (7.7), $\hat u\in\mathscr S_n'$.`,
      idea: String.raw`The definition is forced by the "multiplication formula" $\int\hat f\varphi\,dm_n=\int f\hat\varphi\,dm_n$ for $f\in L^1$ (Fubini): if $u$ is a function, $\hat u$ is its ordinary transform. It cannot be made on all of $\mathscr D'$, because $\hat\varphi$ of a test function is never a test function (unless $\varphi=0$) — this is why $\mathscr S_n$, not $\mathscr D$, is the right space of test functions here.`,
      deps: ['fa-7.11', 'fa-7.7'],
      tags: ['tempered distributions', 'Fourier transform'],
      verify: true,
    },
    {
      num: '7.15',
      kind: 'Theorem',
      name: 'The Fourier transform on tempered distributions',
      statement: String.raw`The Fourier transform is a continuous linear one-to-one map of $\mathscr S_n'$ onto $\mathscr S_n'$ (weak* topology), of period $4$, whose inverse is continuous. For $u\in\mathscr S_n'$, a polynomial $P$ and a multi-index $\alpha$,
$$(P(D)u)^\wedge=P\,\hat u,\qquad(Pu)^\wedge=P(-D)\,\hat u,$$
where $D_\alpha=i^{-|\alpha|}\partial^\alpha$. For example $\hat\delta=1$, $\hat1=\delta$, $\hat x=i\delta'$, $(\operatorname{sgn}x)^\wedge=-i\sqrt{2/\pi}\;\mathrm{p.v.}\frac1t$, $(e^{iax})^\wedge=\delta_a$.`,
      idea: String.raw`Every property is transported from $\mathscr S_n$ by duality: $\hat u=u\circ\mathcal F$, and $\mathcal F$ is a topological automorphism of $\mathscr S_n$ of period $4$ (7.7), so $u\mapsto\hat u$ is one too. The exchange rules follow from 7.4(c) applied to the test function: $(D_\alpha u)^\wedge(\varphi)=(D_\alpha u)(\hat\varphi)=u((-D)_\alpha\hat\varphi)=u((t^\alpha\varphi)^\wedge)=(t^\alpha\hat u)(\varphi)$, with the signs sorted out by $D_\alpha$'s normalisation.`,
      caption: String.raw`A table of transform pairs, each checked from the definition. Choose $u$ (left, in $x$) and a Gaussian test function $\varphi$ in $t$ (right; drag its centre, set its width). The left panel also shows $\hat\varphi$, the function that $u$ actually gets applied to. The readout compares $u(\hat\varphi)$, computed by quadrature, with the claimed $\hat u$ applied to $\varphi$ — a constant, a point mass, $i\delta'$, a principal value or a shifted $\delta$.`,
      deps: ['fa-7.14', 'fa-7.7', 'fa-7.4'],
      tags: ['tempered distributions', 'Fourier transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const U = {
          delta: { label: '$\\delta$', hat: '\\hat u=1' },
          one: { label: '$1$', hat: '\\hat u=\\delta' },
          x: { label: '$x$', hat: "\\hat u=i\\delta'" },
          sgn: { label: '$\\operatorname{sgn}x$', hat: '\\hat u=-i\\sqrt{2/\\pi}\\,\\mathrm{p.v.}\\tfrac1t' },
          exp: { label: '$e^{iax}$, $a=1.5$', hat: '\\hat u=\\delta_{1.5}' },
        };
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'sgn');
        const sS = v.slider('width $\\sigma$ of $\\varphi$', 0.4, 2, 0.8, { step: 0.01 });
        const Lx = v.stage({ x: [-8, 8], y: [-1.6, 1.6], height: 260, axes: true, title: '$x$: $u$ (purple) and $\\hat\\varphi$ (Re blue, Im orange)' });
        const Rt = v.stage({ x: [-4, 4], y: [-1.6, 1.6], height: 260, axes: true, title: '$t$: the claimed $\\hat u$ (purple) and $\\varphi$ (blue)' });
        const hc = Rt.handle(0.7, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -3, 3), 0] });
        const a = 1.5;
        let st = {};
        v.legend([['purple', '$u$ and $\\hat u$'], ['blue', '$\\varphi$, $\\mathrm{Re}\\,\\hat\\varphi$'], ['orange', '$\\mathrm{Im}\\,\\hat\\varphi$']]);
        v.render(() => {
          const key = which.value, sg = sS.value, c = hc.x;
          const ph = (t) => Math.exp(-((t - c) ** 2) / (2 * sg * sg));
          const phHat = (x) => { const g = sg * Math.exp(-sg * sg * x * x / 2); return [g * Math.cos(c * x), -g * Math.sin(c * x)]; };   // σ e^{-σ²x²/2} e^{-icx}
          // left: u and φ̂
          if (key === 'delta') deltaArrow(Lx, 0, 1, 1.2, 'purple', '\\delta');
          else if (key === 'one') Lx.hline(1, { color: 'purple', width: 2.4 });
          else if (key === 'x') Lx.fn((x) => x / 5, { color: 'purple', width: 2.4 });
          else if (key === 'sgn') { Lx.line(-8, -1, 0, -1, { color: 'purple', width: 2.4 }); Lx.line(0, 1, 8, 1, { color: 'purple', width: 2.4 }); }
          else { Lx.fn((x) => Math.cos(a * x), { color: 'purple', width: 2 }); Lx.fn((x) => Math.sin(a * x), { color: 'purple', width: 1.4, dash: [5, 4] }); }
          if (key === 'x') Lx.corner('u = x (drawn ÷5)', 'tl', { color: 'purple' });
          Lx.fn((x) => phHat(x)[0], { color: 'blue', width: 2, n: 900 });
          Lx.fn((x) => phHat(x)[1], { color: 'orange', width: 1.6, n: 900 });
          // u(φ̂) by quadrature
          const X = 10 / sg, n = 4000;
          const integ = (w) => { let re = 0, im = 0; const h = 2 * X / n; for (let i = 0; i <= n; i++) { const x = -X + i * h, wt = (i === 0 || i === n ? 0.5 : 1) * h; const [p, q] = phHat(x), [wr, wi] = w(x); re += wt * (wr * p - wi * q); im += wt * (wr * q + wi * p); } return [re / RT2PI, im / RT2PI]; };
          let lhs, rhs;
          if (key === 'delta') { lhs = phHat(0); rhs = [simpson(ph, c - 10 * sg, c + 10 * sg, 400) / RT2PI, 0]; }
          else if (key === 'one') { lhs = integ(() => [1, 0]); rhs = [ph(0), 0]; }
          else if (key === 'x') { lhs = integ((x) => [x, 0]); rhs = [0, -(c / (sg * sg)) * ph(0)]; }   // iδ'(φ) = −i φ'(0), φ'(0) = (c/σ²) φ(0)
          else if (key === 'sgn') { lhs = integ((x) => [Math.sign(x), 0]); const R = Math.abs(c) + 10 * sg; rhs = [0, -(1 / Math.PI) * simpson((t) => { const s = Math.max(t, 1e-7); return (ph(s) - ph(-s)) / s; }, 0, R, 4000)]; }
          else { lhs = integ((x) => [Math.cos(a * x), Math.sin(a * x)]); rhs = [ph(a), 0]; }
          // right: claimed û and φ
          if (key === 'delta') Rt.hline(1, { color: 'purple', width: 2.4 });
          else if (key === 'one') deltaArrow(Rt, 0, 1, 1.2, 'purple', '\\delta');
          else if (key === 'x') dipole(Rt, 0, 1, 1.1, 'purple', "i\\delta'");
          else if (key === 'sgn') { Rt.fn((t) => -0.35 / t, { domain: [-4, -0.05], color: 'purple', width: 2, dash: [5, 4] }); Rt.fn((t) => -0.35 / t, { domain: [0.05, 4], color: 'purple', width: 2, dash: [5, 4] }); Rt.corner('purely imaginary: −i·√(2/π)/t', 'bl', { color: 'purple' }); }
          else deltaArrow(Rt, a, 1, 1.2, 'purple', '\\delta_{1.5}');
          Rt.fn(ph, { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.1 });
          st = { key, lhs, rhs };
        });
        v.readout(() => {
          const s = st, cl = (x) => (Math.abs(x) < 5e-6 ? 0 : x), z = (p) => `${v.fix(cl(p[0]), 5)} ${cl(p[1]) < 0 ? '-' : '+'} ${v.fix(Math.abs(cl(p[1])), 5)}\\,i`;
          return `$u(\\hat\\varphi) = ${z(s.lhs)}$; $\\;${U[s.key].hat}$ gives $\\hat u(\\varphi) = ${z(s.rhs)}$.`;
        });
      },
    },
  ],
};
