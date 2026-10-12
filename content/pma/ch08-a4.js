// Rudin, Principles of Mathematical Analysis — Chapter 8 (part 4): the gamma function (8.17–8.22).

/** A number as TeX (scientific notation as m×10^e when very small or large). */
function texNum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a));
  return `${(x / 10 ** e).toFixed(Math.max(0, d - 1))}\\times10^{${e}}`;
}
/** Composite Simpson rule (n even). */
function simpson(f, a, b, n = 1000) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
/** log Γ(x) for x > 0 (Lanczos). */
function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = LG[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
const gamma = (x) => Math.exp(lgamma(x));
/** Γ(x) straight from the defining integral: ∫_0^1 t^{x-1}e^{-t}dt = Σ_k (-1)^k/(k!(x+k)) (termwise), then ∫_1^T by Simpson. */
function gammaInt(x) {
  let a = 0, fk = 1; for (let k = 0; k < 40; k++) { a += ((k % 2 ? -1 : 1) / fk) / (x + k); fk *= k + 1; }
  const b = simpson((t) => Math.exp((x - 1) * Math.log(t) - t), 1, 45 + 3 * x, 6000);
  return a + b;
}
/** B(x,y) = ∫_0^1 t^{x-1}(1-t)^{y-1} dt, split at 1/2; on each half t = u^m (m = 5/x) turns t^{x-1}dt into m·u^4 du, a smooth integrand. */
function betaInt(x, y) {
  const half = (p, q) => { const m = 5 / p; return m * simpson((u) => u ** 4 * Math.pow(1 - Math.pow(u, m), q - 1), 0, Math.pow(0.5, 1 / m), 600); };
  return half(x, y) + half(y, x);
}

export default {
  book: 'pma',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.17
    {
      num: '8.17',
      kind: 'Definition',
      name: 'The gamma function',
      statement: String.raw`For $0<x<\infty$,
$$\Gamma(x)=\int_0^\infty t^{x-1}e^{-t}\,dt .$$
The integral converges for every such $x$: near $t=0$ the integrand is at most $t^{x-1}$, which is integrable because $x>0$, and for large $t$ the factor $e^{-t}$ beats any power of $t$ (8.6(f)).`,
      idea: String.raw`The improper integral is split at $t=1$; each piece is controlled by a comparison, so $\Gamma$ is a well-defined positive function on $(0,\infty)$.`,
      caption: String.raw`Move $x$. Left: the integrand $t^{x-1}e^{-t}$, whose area (computed numerically from the definition) is $\Gamma(x)$; for $x<1$ it is unbounded near $0$ but still has finite area. Right: the resulting function $\Gamma$, which passes through $(n,(n-1)!)$.`,
      deps: ['pma-8.6'],
      tags: ['gamma function'],
      viz(v) {
        const M = v.M;
        const xS = v.slider('$x$', 0.2, 6, 2.5, { step: 0.01 });
        const L = v.stage({ x: [-0.3, 15], y: [0, 1.2], height: 320, axes: 'box', xlabel: 't', title: 'integrand $t^{x-1}e^{-t}$; shaded area $=\\Gamma(x)$' });
        const R = v.stage({ x: [0, 6.3], y: [0, 8], height: 320, axes: 'box', xlabel: 'x', title: '$\\Gamma$ on $(0,6]$' });
        let st = null;
        v.render(() => {
          const x = xS.value, g = (t) => (t > 0 ? Math.exp((x - 1) * Math.log(t) - t) : NaN);
          const peak = x > 1 ? g(x - 1) : 2.4;
          L.setView([-0.3, Math.max(10, x + 9)], [0, Math.min(2.6, peak * 1.25)]);
          L.fn(g, { domain: [1e-4, 40], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.2, n: 900 });
          const I = gammaInt(x);
          const lx = x > 1 ? x - 1 : 1.2;
          L.text(`area = ${v.fmt(I, 5)}`, lx + 0.4, Math.min(peak, 2.4) * 0.55, { color: 'blue', size: 12.5, weight: 600 });
          const top = Math.max(7, gamma(Math.min(x, 6)) * 1.2);
          R.setView(null, [0, top]);
          R.fn(gamma, { domain: [0.04, 6.3], color: 'ink', width: 2.4 });
          for (let n = 1; n <= 6; n++) R.dot(n, M.factorial(n - 1), { color: 'green', r: 4, label: `${M.factorial(n - 1)}`, labelPos: 'nw', labelColor: 'green' });
          R.line(x, 0, x, I, { color: 'blue', width: 2, dash: [3, 3] });
          R.dot(x, I, { color: 'blue', r: 5.5 });
          st = { x, I, lz: gamma(x) };
          v.legend([['blue', '$t^{x-1}e^{-t}$ and its area', { area: true }], ['ink', '$\\Gamma(x)$'], ['green', '$(n,(n-1)!)$', { dot: true }]]);
        });
        v.readout(() => st && `$x=${v.fix(st.x, 2)}$: $\\int_0^\\infty t^{x-1}e^{-t}dt=${v.fix(st.I, 7)}$ (numerical quadrature); independent evaluation of $\\Gamma(x)$: $${v.fix(st.lz, 7)}$.`);
      },
    },
    // ------------------------------------------------------------------ 8.18
    {
      num: '8.18',
      kind: 'Theorem',
      name: 'Functional equation and log-convexity of $\\Gamma$',
      statement: String.raw`(a) $\Gamma(x+1)=x\,\Gamma(x)$ for $0<x<\infty$.
(b) $\Gamma(n+1)=n!$ for $n=1,2,3,\dots$
(c) $\log\Gamma$ is convex on $(0,\infty)$.`,
      idea: String.raw`(a) is an integration by parts in the defining integral. Since $\Gamma(1)=1$, (a) gives (b) by induction. For (c), take $1<p<\infty$, $\frac1p+\frac1q=1$, and apply Hölder's inequality to $t^{(x-1)/p}e^{-t/p}$ and $t^{(y-1)/q}e^{-t/q}$: this gives $\Gamma\bigl(\frac xp+\frac yq\bigr)\le\Gamma(x)^{1/p}\Gamma(y)^{1/q}$, which is convexity of $\log\Gamma$.`,
      caption: String.raw`Left: drag $a$ and $b$ along the graph of $\log\Gamma$ — the orange chord always lies above it (convexity, shaded gap); the green dots are $\log n!$. Right: drag $x$ along $\Gamma$; one step to the right multiplies the height by exactly $x$.`,
      deps: ['pma-8.17', 'pma-6.22'],
      tags: ['gamma function', 'convexity'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [0, 6.4], y: [-0.7, 5], height: 330, xlabel: 'x', title: '$\\log\\Gamma$ and a chord' });
        const R = v.stage({ x: [0, 5.3], y: [0, 7.5], height: 330, xlabel: 'x', title: '$\\Gamma(x+1)=x\\,\\Gamma(x)$' });
        const onL = (x) => { const xx = M.clamp(x, 0.1, 6.2); return [xx, lgamma(xx)]; };
        const ha = L.handle(0.3, lgamma(0.3), { color: 'orange', label: 'a', constrain: onL });
        const hb = L.handle(4.8, lgamma(4.8), { color: 'orange', label: 'b', constrain: onL });
        const hx = R.handle(2.4, gamma(2.4), { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, 0.25, 4.1); return [xx, gamma(xx)]; } });
        let st = null;
        v.render(() => {
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          const chord = (x) => lgamma(a) + ((lgamma(b) - lgamma(a)) * (x - a)) / (b - a || 1);
          L.between(chord, lgamma, a, b, { fill: 'orange', fillAlpha: 0.18 });
          L.fn(lgamma, { domain: [0.06, 6.4], color: 'ink', width: 2.4 });
          L.line(a, lgamma(a), b, lgamma(b), { color: 'orange', width: 2.2 });
          for (let n = 1; n <= 6; n++) L.dot(n, lgamma(n), { color: 'green', r: 4 });
          L.dot(4, lgamma(4), { color: 'green', r: 4, label: 'log 3! at x = 4', labelPos: 'se', labelColor: 'green' });
          const gaps = M.linspace(a, b, 202).slice(1, -1).map((x) => chord(x) - lgamma(x));
          const gap = Math.min(...gaps), gmax = Math.max(...gaps);
          // right: functional equation
          const x = hx.x, g0 = gamma(x), g1 = gamma(x + 1);
          R.fn(gamma, { domain: [0.12, 5.3], color: 'ink', width: 2.4 });
          for (let n = 1; n <= 5; n++) R.dot(n, M.factorial(n - 1), { color: 'green', r: 4, label: `${n - 1}! = ${M.factorial(n - 1)}`, labelPos: n === 1 ? 'n' : 'nw', labelColor: 'green' });
          R.line(x, g0, x + 1, g0, { color: 'muted', width: 1.4, dash: [4, 3] });
          R.arrow(x + 1, g0, x + 1, g1, { color: 'accent', width: 2.2, head: 9 });
          R.text(`× ${v.fix(x, 2)}`, x + 1, (g0 + g1) / 2, { dx: 8, color: 'accent', size: 13, weight: 600 });
          R.dot(x + 1, g1, { color: 'accent', r: 5 });
          const ratio = gammaInt(x + 1) / gammaInt(x);
          st = { a, b, gap, gmax, x, ratio };
          v.legend([['ink', '$\\log\\Gamma$, $\\Gamma$'], ['orange', 'chord from $a$ to $b$'], ['green', 'factorials', { dot: true }]]);
        });
        v.readout(() => st && `Chord minus curve at interior points of $[a,b]$: between $${texNum(st.gap)}$ and $${v.fix(st.gmax, 4)}$, never negative. From the integral: $\\Gamma(x+1)/\\Gamma(x)=${v.fix(st.ratio, 7)}$ at $x=${v.fix(st.x, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 8.19
    {
      num: '8.19',
      kind: 'Theorem',
      name: 'Bohr–Mollerup theorem',
      statement: String.raw`If $f$ is a positive function on $(0,\infty)$ such that
(a) $f(x+1)=x\,f(x)$,
(b) $f(1)=1$,
(c) $\log f$ is convex,
then $f(x)=\Gamma(x)$ for all $x>0$.`,
      idea: String.raw`By (a) it suffices to treat $0<x<1$. Then $f(n+1)=n!$, and convexity of $\log f$ compares slopes of chords over $[n,n+1]$, $[n+1,n+1+x]$, $[n+1,n+2]$: $x\log n\le\log f(n+1+x)-\log n!\le x\log(n+1)$. Writing $f(n+1+x)=x(x+1)\cdots(x+n)f(x)$ squeezes $f(x)$ between $\frac{n!\,n^x}{x(x+1)\cdots(x+n)}$ and the same expression with $(n+1)^x$; the ratio tends to $1$, so $f(x)=\lim_n\frac{n!\,n^x}{x(x+1)\cdots(x+n)}$ is forced. Since $\Gamma$ satisfies (a)–(c) by 8.18, $f=\Gamma$.`,
      caption: String.raw`Left: on $(0,1]$, the two bounds from the proof enclose every admissible $f$ in the orange band; raise $n$ and the band closes onto $\Gamma$ (Gauss's product). Right: break (c) — $f=\Gamma\cdot(1+a\sin^2\pi x)$ still satisfies (a) and (b), but $\log f$ fails to be convex on the red stretches, and indeed $f\ne\Gamma$.`,
      deps: ['pma-8.18'],
      tags: ['gamma function', 'convexity', 'uniqueness'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 40, 3, { int: true });
        const aS = v.slider('perturbation $a$', 0, 0.6, 0.25, { step: 0.01 });
        const L = v.stage({ x: [0.1, 1.04], y: [0.6, 7.5], height: 330, axes: 'box', xlabel: 'x', title: 'the squeeze on $(0,1]$' });
        const R = v.stage({ x: [0.3, 6.2], y: [-0.6, 5.2], height: 330, xlabel: 'x', title: '$\\log f$ for $f=\\Gamma\\cdot(1+a\\sin^2\\pi x)$' });
        const lowLog = (n, x) => { let s = lgamma(n + 1) + x * Math.log(n); for (let k = 0; k <= n; k++) s -= Math.log(x + k); return s; };
        let st = null;
        v.render(() => {
          const n = nS.value, a = aS.value;
          const lo = (x) => Math.exp(lowLog(n, x)), hi = (x) => Math.exp(lowLog(n, x) + x * Math.log(1 + 1 / n));
          L.between(hi, lo, 0.1, 1, { fill: 'orange', fillAlpha: 0.3, n: 300 });
          L.fn(lo, { domain: [0.1, 1], color: 'orange', width: 1.6 });
          L.fn(hi, { domain: [0.1, 1], color: 'orange', width: 1.6 });
          L.fn(gamma, { domain: [0.1, 1.04], color: 'ink', width: 2.4 });
          L.dot(0.5, Math.sqrt(Math.PI), { color: 'green', r: 4.5, label: 'Γ(½) = √π', labelPos: 'ne', labelColor: 'green' });
          L.dot(1, 1, { color: 'green', r: 4.5, label: 'f(1) = 1', labelPos: 'nw', labelColor: 'green' });
          // right: perturbed f and its convexity defect
          const lf = (x) => lgamma(x) + Math.log(1 + a * Math.sin(Math.PI * x) ** 2);
          const h = 1e-3, xs = M.linspace(0.3, 6.2, 600);
          let runs = [], cur = null;
          for (const x of xs) { const d2 = (lf(x + h) - 2 * lf(x) + lf(x - h)) / (h * h); if (d2 < 0) { if (!cur) cur = [x, x]; cur[1] = x; } else if (cur) { runs.push(cur); cur = null; } }
          if (cur) runs.push(cur);
          for (const [p, q] of runs) R.vband(p, q, { color: 'red', alpha: 0.13 });
          R.fn(lgamma, { domain: [0.3, 6.2], color: 'ink', width: 2, dash: [6, 4] });
          R.fn(lf, { domain: [0.3, 6.2], color: 'red', width: 2.4 });
          for (let k = 1; k <= 6; k++) R.dot(k, lgamma(k), { color: 'green', r: 3.8 });
          const fe = Math.abs(Math.exp(lf(3.7)) - 2.7 * Math.exp(lf(2.7)));   // check (a) numerically
          st = { n, a, lo: lo(0.5), hi: hi(0.5), runs, fe, ratio: Math.exp(lf(2.5) - lgamma(2.5)) };
          v.legend([['ink', '$\\Gamma$ (left), $\\log\\Gamma$ (right, dashed)'], ['orange', 'bounds from (a)–(c)', { area: true }], ['red', '$\\log f$; red bands: $(\\log f)\'\'<0$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const b = `$n=${st.n}$: at $x=\\tfrac12$ the bounds give $${v.fix(st.lo, 5)}\\le f(\\tfrac12)\\le${v.fix(st.hi, 5)}$ (and $\\sqrt\\pi=${v.fix(Math.sqrt(Math.PI), 5)}$). `;
          return b + (st.a === 0 ? 'With $a=0$, $f=\\Gamma$ is log-convex.' : `With $a=${v.fix(st.a, 2)}$: $|f(3.7)-2.7f(2.7)|=${texNum(st.fe, 2)}$ and $f(1)=1$, but $\\log f$ is not convex on ${st.runs.length} stretches, and $f(2.5)/\\Gamma(2.5)=${v.fix(st.ratio, 4)}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 8.20
    {
      num: '8.20',
      kind: 'Theorem',
      name: 'The beta integral',
      statement: String.raw`If $x>0$ and $y>0$, then
$$\int_0^1 t^{x-1}(1-t)^{y-1}\,dt=\frac{\Gamma(x)\Gamma(y)}{\Gamma(x+y)} .$$`,
      idea: String.raw`Call the left side $B(x,y)$ and fix $y$. Then $B(1,y)=1/y$, $\log B(\cdot,y)$ is convex (Hölder, as in 8.18), and an integration by parts gives $B(x+1,y)=\frac{x}{x+y}B(x,y)$. Hence $f(x)=\frac{\Gamma(x+y)}{\Gamma(y)}B(x,y)$ satisfies (a)–(c) of the Bohr–Mollerup theorem, so $f=\Gamma$.`,
      caption: String.raw`Set $x$ and $y$. Left: the integrand on $[0,1]$; its area $B(x,y)$ is computed numerically. Right: the proof's function $f(s)=\Gamma(s+y)B(s,y)/\Gamma(y)$, evaluated from numerical beta integrals (dots), falls exactly on $\Gamma$ — as Bohr–Mollerup demands.`,
      deps: ['pma-8.19', 'pma-8.18'],
      tags: ['gamma function', 'beta function'],
      viz(v) {
        const M = v.M;
        const xS = v.slider('$x$', 0.3, 5, 2.2, { step: 0.01 });
        const yS = v.slider('$y$', 0.3, 5, 3.4, { step: 0.01 });
        const L = v.stage({ x: [-0.03, 1.03], y: [0, 1], height: 320, axes: 'box', xlabel: 't', title: '$t^{x-1}(1-t)^{y-1}$ on $[0,1]$' });
        const R = v.stage({ x: [0, 5.2], y: [0, 7], height: 320, axes: 'box', xlabel: 's', title: '$f(s)=\\Gamma(s+y)B(s,y)/\\Gamma(y)$ vs. $\\Gamma(s)$' });
        let st = null, lastY = null, dots = [];
        v.render(() => {
          const x = xS.value, y = yS.value;
          const g = (t) => (t > 0 && t < 1 ? Math.exp((x - 1) * Math.log(t) + (y - 1) * Math.log(1 - t)) : NaN);
          let mx = 0; for (const t of M.linspace(0.03, 0.97, 200)) mx = Math.max(mx, g(t));
          L.setView(null, [0, Math.min(6, mx * 1.25)]);
          L.fn(g, { domain: [1e-4, 1 - 1e-4], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.2, n: 800 });
          const B = betaInt(x, y), G = Math.exp(lgamma(x) + lgamma(y) - lgamma(x + y));
          L.corner(`area B(x, y) = ${v.fmt(B, 6)}`, 'tr', { color: 'blue', weight: 600 });
          if (lastY !== y.toFixed(3)) { lastY = y.toFixed(3); dots = M.linspace(0.25, 5, 20).map((s) => [s, Math.exp(lgamma(s + y) - lgamma(y)) * betaInt(s, y)]); }
          R.fn(gamma, { domain: [0.15, 5.2], color: 'ink', width: 2.4 });
          R.dots(dots, { color: 'gold', r: 4 });
          const fx = Math.exp(lgamma(x + y) - lgamma(y)) * B;
          R.dot(x, fx, { color: 'blue', r: 6, label: 'x', labelPos: 'ne', labelColor: 'blue' });
          st = { x, y, B, G };
          v.legend([['blue', 'integrand, area $B(x,y)$', { area: true }], ['ink', '$\\Gamma$'], ['gold', '$f(s)$ from numerical $B(s,y)$', { dot: true }]]);
        });
        v.readout(() => st && `$B(${v.fix(st.x, 2)},${v.fix(st.y, 2)})=${v.fix(st.B, 8)}$ (quadrature) and $\\frac{\\Gamma(x)\\Gamma(y)}{\\Gamma(x+y)}=${v.fix(st.G, 8)}$; relative difference $${texNum(Math.abs(st.B / st.G - 1), 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 8.21
    {
      num: '8.21',
      kind: 'Corollary',
      name: 'Consequences: $\\Gamma(\\frac12)=\\sqrt\\pi$, the Gaussian integral, duplication',
      statement: String.raw`(a) The substitution $t=\sin^2\theta$ turns 8.20 into $2\int_0^{\pi/2}(\sin\theta)^{2x-1}(\cos\theta)^{2y-1}d\theta=\frac{\Gamma(x)\Gamma(y)}{\Gamma(x+y)}$; with $x=y=\frac12$ this gives $\Gamma(\frac12)=\sqrt\pi$.
(b) The substitution $t=s^2$ gives $\Gamma(x)=2\int_0^\infty s^{2x-1}e^{-s^2}ds$, and hence $\int_{-\infty}^{\infty}e^{-s^2}ds=\sqrt\pi$.
(c) For $x>0$, $\Gamma(x)=\frac{2^{x-1}}{\sqrt\pi}\,\Gamma\bigl(\frac x2\bigr)\Gamma\bigl(\frac{x+1}2\bigr)$.`,
      idea: String.raw`(a) and (b) are changes of variable in 8.20 and in 8.17; with $x=y=\frac12$ the trigonometric integral is $2\cdot\frac\pi2=\pi=\Gamma(\frac12)^2$. For (c), the right side $f(x)$ satisfies $f(1)=1$ (by (a)), $f(x+1)=xf(x)$ and is log-convex as a product of log-convex functions, so the Bohr–Mollerup theorem (8.19) identifies it with $\Gamma$.`,
      caption: String.raw`Left: the Gaussian $e^{-s^2}$ with its area over $[-L,L]$ approaching $\sqrt\pi=\Gamma(\frac12)$. Right: drag $x$; $\Gamma(x)$ (black) and the duplication formula $\frac{2^{x-1}}{\sqrt\pi}\Gamma(\frac x2)\Gamma(\frac{x+1}2)$ (gold dashed), built from the two smaller values marked in purple, coincide.`,
      deps: ['pma-8.20', 'pma-8.19'],
      verify: true,
      tags: ['gamma function', 'Gaussian integral'],
      viz(v) {
        const M = v.M;
        const lS = v.slider('$L$', 0.2, 3.5, 1.2, { step: 0.01 });
        const G = v.stage({ x: [-3.7, 3.7], y: [-0.05, 1.2], height: 300, xlabel: 's', title: '$\\int_{-L}^{L}e^{-s^2}ds\\to\\sqrt\\pi$' });
        const D = v.stage({ x: [0, 5.2], y: [0, 7], height: 300, axes: 'box', xlabel: 'x', title: 'duplication formula' });
        const hx = D.handle(3.3, gamma(3.3), { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, 0.3, 4.6); return [xx, gamma(xx)]; } });
        const dup = (x) => (Math.pow(2, x - 1) / Math.sqrt(Math.PI)) * gamma(x / 2) * gamma((x + 1) / 2);
        let st = null;
        v.render(() => {
          const Lv = lS.value, e = (s) => Math.exp(-s * s);
          G.between(e, () => 0, -Lv, Lv, { fill: 'blue', fillAlpha: 0.22 });
          G.fn(e, { color: 'blue', width: 2.4 });
          G.vline(-Lv, { color: 'orange', dash: [4, 3], width: 1.2 }); G.vline(Lv, { color: 'orange', dash: [4, 3], width: 1.2 });
          const area = simpson(e, -Lv, Lv, 2000);
          G.corner(`area = ${v.fix(area, 6)}   √π = ${v.fix(Math.sqrt(Math.PI), 6)}`, 'tl', { color: 'blue', weight: 600 });
          const x = hx.x; hx.y = gamma(x);
          D.fn(gamma, { domain: [0.15, 5.2], color: 'ink', width: 2.6 });
          D.fn(dup, { domain: [0.15, 5.2], color: 'gold', width: 2, dash: [7, 5] });
          D.dot(x / 2, gamma(x / 2), { color: 'purple', r: 5, label: 'Γ(x/2)', labelPos: 'ne', labelColor: 'purple' });
          D.dot((x + 1) / 2, gamma((x + 1) / 2), { color: 'purple', r: 5, label: 'Γ((x+1)/2)', labelPos: 'se', labelColor: 'purple' });
          D.dot(0.5, Math.sqrt(Math.PI), { color: 'green', r: 4.5, label: '√π', labelPos: 'e', labelColor: 'green' });
          st = { area, Lv, x, g: gamma(x), d: dup(x) };
          v.legend([['blue', '$e^{-s^2}$ and its area on $[-L,L]$', { area: true }], ['ink', '$\\Gamma(x)$'], ['gold', '$\\frac{2^{x-1}}{\\sqrt\\pi}\\Gamma(\\frac x2)\\Gamma(\\frac{x+1}2)$', { dash: true }]]);
        });
        v.readout(() => st && `$\\int_{-${v.fix(st.Lv, 2)}}^{${v.fix(st.Lv, 2)}}e^{-s^2}ds=${v.fix(st.area, 6)}$, $\\sqrt\\pi=\\Gamma(\\tfrac12)=${v.fix(gamma(0.5), 6)}$. At $x=${v.fix(st.x, 3)}$: $\\Gamma(x)=${v.fix(st.g, 6)}$ and the duplication formula gives $${v.fix(st.d, 6)}$.`);
      },
    },
    // ------------------------------------------------------------------ 8.22
    {
      num: '8.22',
      kind: 'Theorem',
      name: "Stirling's formula",
      statement: String.raw`$$\lim_{x\to\infty}\frac{\Gamma(x+1)}{(x/e)^x\sqrt{2\pi x}}=1 .$$
In particular $n!\sim(n/e)^n\sqrt{2\pi n}$.`,
      idea: String.raw`Substitute $t=x(1+u)$ in $\Gamma(x+1)=\int_0^\infty t^xe^{-t}dt$ and then $u=s\sqrt{2/x}$, to get $\Gamma(x+1)=x^xe^{-x}\sqrt{2x}\int_{-\infty}^{\infty}\psi_x(s)\,ds$, where $\psi_x(s)=\bigl[(1+u)e^{-u}\bigr]^x=\exp\bigl(-s^2h(s\sqrt{2/x})\bigr)$ for $s>-\sqrt{x/2}$ (and $0$ otherwise), with $h(u)=2\frac{u-\log(1+u)}{u^2}$ continuous, decreasing, $h(0)=1$. As $x\to\infty$, $\psi_x\to e^{-s^2}$ monotonically on each side, with an integrable majorant, so $\int\psi_x\to\int e^{-s^2}=\sqrt\pi$ (8.21).`,
      caption: String.raw`Move $x$ (log scale). Left: the proof's integrand $\psi_x$ (blue) settling onto $e^{-s^2}$ (dashed); the ratio in Stirling's formula is exactly $\int\psi_x/\sqrt\pi$. Right: the ratio minus $1$ against $x$ on log–log axes — it tends to $0$, hugging the next-order prediction $\frac1{12x}$.`,
      deps: ['pma-8.21', 'pma-8.17'],
      tags: ['gamma function', 'asymptotics'],
      viz(v) {
        const M = v.M;
        const xS = v.slider('$x$', 0.5, 1000, 2, { log: true, fmt: (x) => (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : x.toFixed(0)) });
        const L = v.stage({ x: [-3.2, 5.5], y: [-0.04, 1.12], height: 310, xlabel: 's', title: '$\\psi_x(s)$ and its limit $e^{-s^2}$' });
        const R = v.stage({ x: [-0.4, 3.15], y: [-4.7, 0], height: 310, axes: 'box', title: '(ratio $-\\,1$) $\\to0$, against $x$ (log–log)',
          xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], yticks: [[0, '1'], [-1, '10⁻¹'], [-2, '10⁻²'], [-3, '10⁻³'], [-4, '10⁻⁴']] });
        const h = (u) => (Math.abs(u) < 1e-6 ? 1 - (2 * u) / 3 : (2 * (u - Math.log1p(u))) / (u * u));
        const psi = (x, s) => (s <= -Math.sqrt(x / 2) ? 0 : Math.exp(-s * s * h(s * Math.sqrt(2 / x))));
        const ratio = (x) => Math.exp(lgamma(x + 1) - (x * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI * x)));
        let st = null;
        v.render(() => {
          const x = xS.value;
          const left = -Math.sqrt(x / 2);
          L.fn((s) => Math.exp(-s * s), { color: 'ink', width: 1.8, dash: [6, 4] });
          L.fn((s) => psi(x, s), { domain: [Math.max(left, -3.3), 5.6], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.16, n: 800 });
          if (left > -3.2) { L.vline(left, { color: 'orange', dash: [3, 3], width: 1.2 }); L.text('−√(x/2)', left, 1.05, { align: 'left', dx: 4, color: 'orange', size: 11.5 }); }
          const I = simpson((s) => psi(x, s), left, 40, 8000);
          // right: ratio curve over log10 x in [-0.3, 3]
          const lxs = M.linspace(-0.3, 3, 240);
          R.path(lxs.map((t) => [t, Math.log10(ratio(10 ** t) - 1)]), { color: 'blue', width: 3.2 });
          R.path(lxs.map((t) => [t, Math.log10(1 / (12 * 10 ** t))]), { color: 'orange', width: 1.8, dash: [6, 4] });
          R.dot(Math.log10(x), Math.log10(ratio(x) - 1), { color: 'gold', r: 6 });
          R.text('ratio − 1', 0.15, Math.log10(ratio(1.4) - 1), { color: 'blue', size: 12, weight: 600, dx: 8 });
          R.text('1/(12x)', 2.3, Math.log10(1 / (12 * 200)), { color: 'orange', size: 13, math: true, baseline: 'top', dy: 8 });
          st = { x, I, r: ratio(x), r12: 1 + 1 / (12 * x) };
          v.legend([['blue', '$\\psi_x$; the ratio $-\\,1$'], ['ink', '$e^{-s^2}$', { dash: true }], ['orange', '$\\frac1{12x}$', { dash: true }]]);
        });
        v.readout(() => st && `$x=${v.fmt(st.x, 4)}$: $\\int\\psi_x/\\sqrt\\pi=${v.fix(st.I / Math.sqrt(Math.PI), 7)}$, ratio $\\frac{\\Gamma(x+1)}{(x/e)^x\\sqrt{2\\pi x}}=${v.fix(st.r, 7)}$, $1+\\frac1{12x}=${v.fix(st.r12, 7)}$.`);
      },
    },
  ],
};
