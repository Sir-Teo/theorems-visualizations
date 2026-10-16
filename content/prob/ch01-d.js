// Probability: Theory and Examples (Durrett) — Chapter 1, part D: expected value and product measures (§§1.6–1.7)

// ---------- helpers ----------
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/** Status text pinned to a corner of the data area (inside the gutter, unlike s.corner which uses the canvas corner). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
/** Composite Simpson rule. */
function simpson(f, a, b, n = 400) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** Running means of a sample, sampled at about 300 log-spaced indices: [[n, mean_n], …]. */
function runningMeans(xs) {
  const out = []; let s = 0, next = 1;
  for (let i = 0; i < xs.length; i++) { s += xs[i]; if (i + 1 >= next || i === xs.length - 1) { out.push([i + 1, s / (i + 1)]); next = Math.max(next + 1, Math.ceil(next * 1.025)); } }
  return out;
}
/** Intervals {y ∈ [0,1] : inside(y)} from a grid scan, as [[a, b], …]. */
function scanIntervals(inside, n = 800) {
  const out = []; let start = null;
  for (let i = 0; i <= n; i++) { const y = i / n, on = i < n && inside((i + 0.5) / n); if (on && start == null) start = y; if (!on && start != null) { out.push([start, y]); start = null; } }
  return out;
}
const PHI = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

export default {
  collection: 'prob',
  chapter: 1,
  items: [
    // ======================================================================== §1.6 Expected value
    {
      num: '1.6.1a',
      kind: 'Definition',
      name: 'Expected value',
      verify: true,
      statement: String.raw`Let $X$ be a random variable on a probability space $(\Omega,\mathcal F,P)$. If $X\ge0$, its **expected value** is $EX=\int X\,dP$, which always makes sense but may be $+\infty$. In general write $x^+=\max\{x,0\}$ and $x^-=\max\{-x,0\}$. Then $EX$ **exists** and equals $EX^+-EX^-$ whenever the subtraction makes sense, that is, when $EX^+<\infty$ or $EX^-<\infty$. $EX$ is also called the **mean** of $X$, often written $\mu$.`,
      idea: String.raw`Expectation is the integral of Section 1.4 with respect to a probability measure, so it inherits every property proved there. For a picture in terms of the distribution function $F$, slice the region under the graph of $X^+$ horizontally (Exercise 1.7.2): $EX^+=\int_0^\infty P(X>x)\,dx$ and $EX^-=\int_{-\infty}^0P(X<x)\,dx$. These are the areas between $F$ and the line $1$ on the right of $0$, and between $F$ and $0$ on the left. $EX$ fails to exist exactly when both areas are infinite.`,
      caption: String.raw`Left: the distribution function $F$. The green area (between $F$ and $1$, right of $0$) is $EX^+$; the red area (between $F$ and $0$, left of $0$) is $EX^-$. Drag the gold handle to shift the law, slide $\sigma$ to spread it, and watch the areas trade off. Right: running averages of seeded samples settle on $EX$ (dashed). For the Pareto law $EX=+\infty$ (it still exists); for the Cauchy law both areas are infinite, so $EX$ does not exist and the averages never settle.`,
      deps: ['prob-1.4.7', 'prob-1.2.1a'],
      see: ['rca-1.31', 'rca-8.16', 'prob-2.2.13'],
      tags: ['expectation', 'foundations'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          norm: { label: 'normal', F: (z) => M.dist.normal(0, 1).cdf(z), draw: (r) => r.normal(), Ep: null },
          exp: { label: 'exponential', F: (z) => (z < -1 ? 0 : 1 - Math.exp(-(z + 1))), draw: (r) => -Math.log(1 - r()) - 1 },
          two: { label: 'two-point', F: (z) => (z < -1 ? 0 : z < 2 ? 2 / 3 : 1), draw: (r) => (r() < 2 / 3 ? -1 : 2) },
          par: { label: 'Pareto $\\alpha=0.8$', F: (z) => (z < 1 ? 0 : 1 - z ** -0.8), draw: (r) => (1 - r()) ** (-1 / 0.8), heavy: '+' },
          cau: { label: 'Cauchy', F: (z) => 0.5 + Math.atan(z) / Math.PI, draw: (r) => Math.tan(Math.PI * (r() - 0.5)), heavy: '±' },
        };
        const law = v.select('', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const sS = v.slider('$\\sigma$', 0.2, 2.5, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-6, 6], y: [-0.04, 1.06], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$x$', title: 'distribution function $F(x)=P(X\\le x)$' });
        const R = v.stage({ x: [1, 5000], y: [-6, 6], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'running average of $n$ samples' });
        const H = L.handle(0.5, 0.5, { color: 'gold', label: 'shift', constrain: (x) => [clampN(x, -4.5, 4.5), 0.5] });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], m = H.x, s = sS.value, F = (x) => Lw.F((x - m) / s);
          let Ep = Infinity, Em = Infinity;
          if (!Lw.heavy) { const Rr = Math.abs(m) + 40 * s; Ep = simpson((x) => 1 - F(x), 0, Rr, 4000); Em = simpson(F, -Rr, 0, 4000); }
          else if (Lw.heavy === '+') { Em = simpson(F, -(Math.abs(m) + 10 * s), 0, 2000); }
          L.between(() => 1, F, 0, 6, { fill: 'green', fillAlpha: 0.25, n: 600 });
          L.between(F, () => 0, -6, 0, { fill: 'red', fillAlpha: 0.25, n: 600 });
          L.hline(1, { color: 'muted', dash: [4, 4], width: 1 }); L.vline(0, { color: 'muted', width: 1 });
          L.fn(F, { color: 'ink', width: 2.6, n: 1200 });
          if (Lw.heavy) { L.arrow(5.0, 0.985, 5.9, 0.985, { color: 'green', width: 1.6 }); }
          if (Lw.heavy === '±') L.arrow(-5.0, 0.015, -5.9, 0.015, { color: 'red', width: 1.6 });
          L.tex('EX^+', 3, 0.84, { color: 'green', size: 15 }); L.tex('EX^-', -3, 0.16, { color: 'red', size: 15 });
          // running averages
          const key = `${law.value}|${m}|${s}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 7 + 3), xs = Array.from({ length: 5000 }, () => m + s * Lw.draw(r)); cache = { key, path: runningMeans(xs) }; }
          const EX = isFinite(Ep) && isFinite(Em) ? Ep - Em : Lw.heavy === '+' ? Infinity : NaN;
          if (isFinite(EX)) R.hline(EX, { color: 'green', dash: [6, 4], width: 1.8 });
          R.path(cache.path, { color: 'accent', width: 1.8 });
          if (!isFinite(EX)) cornerIn(R, Lw.heavy === '+' ? '$EX=+\\infty$: the averages keep climbing' : '$EX$ does not exist', 'tr', { color: 'red' });
          st = { Ep, Em, EX, heavy: Lw.heavy, last: cache.path[cache.path.length - 1][1] };
          v.legend([['ink', '$F$'], ['green', '$EX^+=\\int_0^\\infty(1-F)$', { area: true }], ['red', '$EX^-=\\int_{-\\infty}^0F$', { area: true }], ['accent', 'running average']]);
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => (isFinite(x) ? v.fix(x, 4) : '\\infty');
          const tail = `; average of 5000 samples: $${v.fix(st.last, 3)}$.`;
          if (!st.heavy) return `$EX^+=${f(st.Ep)}$, $\\ EX^-=${f(st.Em)}$, $\\ EX = ${f(st.EX)}$` + tail;
          if (st.heavy === '+') return `$EX^+=\\infty$ but $EX^-=${f(st.Em)}<\\infty$, so $EX$ exists and equals $+\\infty$` + tail;
          return `$EX^+=EX^-=\\infty$: $EX$ is undefined` + tail;
        });
      },
    },
    {
      num: '1.6.1',
      kind: 'Theorem',
      name: 'Linearity and monotonicity of expectation',
      statement: String.raw`Suppose $X,Y\ge0$, or $E|X|<\infty$ and $E|Y|<\infty$. Then

(a) $E(X+Y)=EX+EY$;
(b) $E(aX+b)=a\,EX+b$ for all real $a,b$;
(c) if $X\ge Y$, then $EX\ge EY$.`,
      idea: String.raw`Expectation is an integral, so (a)–(c) restate Lemma 1.4.5 (nonnegative case) and Theorem 1.4.7 (integrable case), together with $E(b)=b\,P(\Omega)=b$. Nothing about the joint behaviour of $X$ and $Y$ enters. Linearity holds however strongly the two variables depend on each other, even though the **spread** of $aX+bY$ depends on that dependence.`,
      caption: String.raw`$X$ is exponential with mean $1$ and $Y$ is a fair die roll with mean $3.5$, coupled through a Gaussian copula with dependence $\rho$ (left: 1500 seeded pairs, the die values jittered). Right: the histogram of $aX+bY$ with its sample mean (gold) and $a\,EX+b\,EY$ (green). Slide $\rho$ from $-0.95$ to $0.95$: the histogram widens and narrows, but its mean stays on the green line.`,
      deps: ['prob-1.6.1a', 'prob-1.4.7'],
      see: ['algo-3.3'],
      tags: ['expectation'],
      viz(v) {
        const M = v.M;
        const rho = v.slider('dependence $\\rho$', -0.95, 0.95, 0.7, { step: 0.05 });
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.1 }), bS = v.slider('$b$', -2, 2, 1, { step: 0.1 });
        const L = v.stage({ x: [0, 6], y: [0.4, 6.6], height: 300, axes: 'box', gutter: true, xlabel: '$X$', ylabel: '$Y$', title: 'seeded pairs $(X,Y)$' });
        const R = v.stage({ x: [-10, 16], y: [0, 0.4], height: 300, weight: 1.3, axes: 'box', gutter: true, xlabel: '$aX+bY$', title: 'law of $aX+bY$' });
        const N = 1500, r0 = v.rng(5), Z1 = Array.from({ length: N }, () => r0.normal()), Z2 = Array.from({ length: N }, () => r0.normal()), J = Array.from({ length: N }, () => r0.uniform(-0.28, 0.28));
        const Phi = (z) => 0.5 * M.erfc(-z / Math.SQRT2);
        let st = null;
        v.render(() => {
          const p = rho.value, a = aS.value, b = bS.value, q = Math.sqrt(1 - p * p);
          const X = Z1.map((z) => -Math.log(Math.max(1e-300, Phi(-z)))), Y = Z1.map((z, i) => Math.min(6, Math.max(1, Math.ceil(6 * Phi(p * z + q * Z2[i])))));
          L.dots(X.map((x, i) => [x, Y[i] + J[i]]), { color: 'accent', r: 1.7, alpha: 0.5 });
          const W = X.map((x, i) => a * x + b * Y[i]), mean = M.mean(W), sd = M.stdev(W), th = a * 1 + b * 3.5;
          const lo = Math.min(...W), hi = Math.max(...W), span = Math.max(4, hi - lo);
          const x0 = Math.min(th, mean) - 0.65 * span, x1 = Math.max(th, mean) + 0.65 * span;
          const Hh = M.histogram(W, { bins: 48, range: [x0, x1] }), ymax = Math.max(...Hh.density) * 1.25;
          R.setView([x0, x1], [0, ymax]);
          R.hist(Hh, { density: true, color: 'teal', fillAlpha: 0.35 });
          R.vline(th, { color: 'green', width: 2.4, dash: [7, 4] });
          R.vline(mean, { color: 'gold', width: 2 });
          R.line(mean - sd, ymax * 0.9, mean + sd, ymax * 0.9, { color: 'orange', width: 2 });
          R.dot(mean - sd, ymax * 0.9, { r: 3, color: 'orange' }); R.dot(mean + sd, ymax * 0.9, { r: 3, color: 'orange' });
          R.text(`sd ${v.fix(sd, 2)}`, mean, ymax * 0.95, { size: 11, color: 'orange', align: 'center' });
          const emax = M.mean(X.map((x, i) => Math.max(x, Y[i])));
          st = { mean, th, sd, emax, a, b, corr: M.linreg(X, Y).r };
          v.legend([['teal', 'histogram of $aX+bY$', { area: true }], ['gold', 'sample mean'], ['green', '$a\\,EX+b\\,EY$', { dash: true }], ['orange', '$\\pm1$ s.d.']]);
        });
        v.readout(() => st && `sample mean of $aX+bY$: $${v.fix(st.mean, 3)}$, $\\ a\\,EX+b\\,EY = ${v.fix(st.a, 1)}\\cdot1+${v.fix(st.b, 1)}\\cdot3.5 = ${v.fix(st.th, 3)}$ whatever the dependence (sample correlation $${v.fix(st.corr, 2)}$); the s.d. $${v.fix(st.sd, 2)}$ does depend on it. (c): $\\max(X,Y)\\ge Y$ and $E\\max(X,Y)\\approx${v.fix(st.emax, 2)}\\ge EY=3.5$.`);
      },
    },
    {
      num: '1.6.2',
      kind: 'Theorem',
      name: 'Jensen’s inequality for expectations',
      credit: 'Jensen, 1906',
      statement: String.raw`If $\varphi$ is convex and both $E|X|<\infty$ and $E|\varphi(X)|<\infty$, then
$$E\varphi(X)\ge\varphi(EX).$$
Special cases: $|EX|\le E|X|$ and $(EX)^2\le E(X^2)$. If $\varphi$ is strictly convex, equality forces $X=EX$ a.s. (Exercise 1.6.1).`,
      idea: String.raw`This is Theorem 1.5.1 for the probability measure $P$. To remember the direction, take a two-point law: $P(X=x)=\lambda$, $P(X=y)=1-\lambda$. Then $E\varphi(X)=\lambda\varphi(x)+(1-\lambda)\varphi(y)$ is a point on the chord, and convexity puts the chord above $\varphi(\lambda x+(1-\lambda)y)=\varphi(EX)$. In general the points $(X,\varphi(X))$ lie on the graph, so their centre of mass $(EX,E\varphi(X))$ lies in the convex region above it.`,
      caption: String.raw`Choose $\varphi$ and a law, drag the gold handle to set the mean $m$, and slide $\sigma$. Left: 60 seeded draws plotted at $(X_i,\varphi(X_i))$. Their centre of mass (green) sits inside their convex hull, above the graph at the blue point $\varphi(\bar X)$. Right: the exact gap $E\varphi(X)-\varphi(EX)$ as a function of $\sigma$; it reaches $0$ only at $\sigma=0$, where the law is a point mass. Choose $\sin x$, which is not convex, and the gap turns negative near $m=\pi/2$.`,
      deps: ['prob-1.5.1', 'prob-1.6.1a'],
      see: ['behav-1.4', 'info-2.1'],
      tags: ['inequalities', 'expectation'],
      viz(v) {
        const PH = {
          sq: { label: '$x^2$', f: (x) => x * x, y: [-0.6, 9.5] },
          ex: { label: '$e^x$', f: Math.exp, y: [-0.6, 12] },
          ab: { label: '$|x|$', f: Math.abs, y: [-0.4, 3.6] },
          sin: { label: '$\\sin x$ (not convex)', f: Math.sin, y: [-1.6, 1.6] },
        };
        const LAW = {
          norm: { label: 'normal', draw: (r) => r.normal(), E: (g) => simpson((z) => g(z) * PHI(z), -8, 8, 400) },
          unif: { label: 'uniform', draw: (r) => r.uniform(-Math.sqrt(3), Math.sqrt(3)), E: (g) => simpson(g, -Math.sqrt(3), Math.sqrt(3), 200) / (2 * Math.sqrt(3)) },
          two: { label: 'two-point', draw: (r) => (r() < 0.5 ? -1 : 1), E: (g) => 0.5 * (g(-1) + g(1)) },
        };
        const phiSel = v.select('$\\varphi$ =', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const lawSel = v.select('law', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'norm');
        const sS = v.slider('$\\sigma$', 0, 2, 0.9, { step: 0.02 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-3.5, 3.5], y: [-0.6, 9.5], height: 330, weight: 1.4, axes: 'box', gutter: true, xlabel: '$x$', title: 'draws $(X_i,\\varphi(X_i))$ on the graph of $\\varphi$' });
        const R = v.stage({ x: [0, 2], y: [-0.5, 4], height: 330, axes: 'box', gutter: true, xlabel: '$\\sigma$', title: 'gap $E\\varphi(X)-\\varphi(EX)$' });
        const H = L.handle(0.4, -0.6, { color: 'gold', label: 'm', labelPos: 'n', constrain: (x) => [clampN(x, -2.5, 2.5), L.yr[0]] });
        let st = null;
        v.render(() => {
          const P = PH[phiSel.value], Lw = LAW[lawSel.value], m = H.x, s = sS.value;
          L.setView(null, P.y); H.y = P.y[0];
          const r = v.rng(seed * 13 + 1), xs = Array.from({ length: 60 }, () => m + s * Lw.draw(r)), pts = xs.map((x) => [x, P.f(x)]);
          const xbar = v.M.mean(xs), ybar = v.M.mean(pts.map((p) => p[1]));
          if (pts.length > 2 && s > 0) { const hull = v.M.hull(pts); if (hull.length > 2) L.poly(hull, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1, alpha: 0.5 }); }
          L.fn(P.f, { color: 'accent', width: 2.6 });
          L.dots(pts, { color: 'gold', r: 3, alpha: 0.85 });
          const Ephi = Lw.E((z) => P.f(m + s * z)), pm = P.f(m);
          L.line(xbar, P.f(xbar), xbar, ybar, { color: ybar >= P.f(xbar) ? 'green' : 'red', width: 3 });
          L.dot(m, Ephi, { hollow: true, color: 'green', r: 6 });
          L.dot(xbar, ybar, { color: 'green', r: 6 });
          L.dot(xbar, P.f(xbar), { color: 'accent', r: 5.5 });
          // gap curve
          const gap = (sg) => Lw.E((z) => P.f(m + sg * z)) - P.f(m);
          const pts2 = Array.from({ length: 81 }, (_, i) => [i / 40, gap(i / 40)]);
          const g0 = Math.min(0, ...pts2.map((p) => p[1])), g1 = Math.max(0.5, ...pts2.map((p) => p[1]));
          R.setView(null, [g0 - 0.08 * (g1 - g0), g1 * 1.1]);
          R.hline(0, { color: 'muted', width: 1 });
          R.path(pts2, { color: 'green', width: 2.4 });
          R.dot(s, Ephi - pm, { color: 'gold', r: 6 });
          R.dot(s, ybar - P.f(xbar), { color: 'green', r: 3.5, hollow: true });
          st = { Ephi, pm, mc: ybar - P.f(xbar), gap: Ephi - pm, convex: phiSel.value !== 'sin' };
          v.legend([['accent', '$\\varphi$'], ['gold', 'draws and their hull', { dot: true }], ['green', 'centre of mass; ring: $(EX,E\\varphi(X))$', { dot: true }]]);
        });
        v.readout(() => st && `exact: $E\\varphi(X) = ${v.fix(st.Ephi, 4)}$, $\\ \\varphi(EX) = ${v.fix(st.pm, 4)}$, gap $${v.fix(st.gap, 4)}$` + (st.gap >= -1e-9 ? ' $\\ge0$' : ' $<0$') + `; from the 60 draws: $\\overline{\\varphi(X)}-\\varphi(\\bar X) = ${v.fix(st.mc, 4)}$.` + (st.convex ? '' : ' $\\sin$ is not convex, so no inequality is promised.'));
      },
    },
    {
      num: '1.6.3',
      kind: 'Theorem',
      name: 'Hölder’s inequality for expectations',
      credit: 'Rogers, 1888; Hölder, 1889',
      statement: String.raw`If $p,q\in[1,\infty]$ with $\frac1p+\frac1q=1$, then
$$E|XY|\le\|X\|_p\,\|Y\|_q,$$
where $\|X\|_r=(E|X|^r)^{1/r}$ for $r\in[1,\infty)$ and $\|X\|_\infty=\inf\{M:P(|X|>M)=0\}$, the essential supremum.`,
      idea: String.raw`For $1<p<\infty$ this is Theorem 1.5.2 with $\mu=P$. The endpoint $p=1$, $q=\infty$ is simpler: $|XY|\le|X|\,\|Y\|_\infty$ a.s., so $E|XY|\le\|X\|_1\|Y\|_\infty$ by monotonicity (Exercise 1.5.1). The bound uses only the two marginal laws, while $E|XY|$ depends on how $X$ and $Y$ are coupled. Each conjugate pair gives a different bound, and one can pick the best.`,
      caption: String.raw`$X$ is exponential and $Y$ uniform on $(0,2)$, coupled with dependence $\rho$ (left: seeded pairs). Right: the bound $\|X\|_p\|Y\|_q$ as $1/p$ runs from $0$ ($p=\infty$, where $\|X\|_\infty=\infty$) to $1$ ($p=1$, $q=\infty$, $\|Y\|_\infty=2$). The green line is $E|XY|$, estimated from 20,000 samples. Drag the gold point along the curve; $p=2$ is Cauchy–Schwarz. The dots are the norms estimated from the same samples. Push $\rho$ up and $E|XY|$ rises toward the curve without crossing it.`,
      deps: ['prob-1.5.2', 'prob-1.6.1a'],
      see: ['rca-3.8', 'ladr-6.14'],
      tags: ['inequalities', 'expectation'],
      viz(v) {
        const M = v.M;
        const nX = (p) => (p === Infinity ? Infinity : Math.exp(M.lgamma(p + 1) / p)), nY = (q) => (q === Infinity ? 2 : 2 / (q + 1) ** (1 / q));
        const B = (t) => (t <= 0 ? Infinity : t >= 1 ? 2 : nX(1 / t) * nY(1 / (1 - t)));
        const rho = v.slider('dependence $\\rho$', -0.95, 0.99, 0.6, { step: 0.01 });
        const L = v.stage({ x: [0, 6], y: [0, 2], height: 300, axes: 'box', gutter: true, xlabel: '$X$', ylabel: '$Y$', title: 'seeded pairs $(X,Y)$' });
        const R = v.stage({ x: [0, 1], y: [0, 5], height: 300, weight: 1.4, axes: 'box', gutter: true, xlabel: '$1/p$', title: 'the bound $\\|X\\|_p\\|Y\\|_q$ against $E|XY|$' });
        const H = R.handle(0.5, B(0.5), { color: 'gold', constrain: (x) => { const t = clampN(x, 0.06, 1); return [t, Math.min(B(t), 4.95)]; } });
        const N = 20000, r0 = v.rng(17), Z1 = Float64Array.from({ length: N }, () => r0.normal()), Z2 = Float64Array.from({ length: N }, () => r0.normal());
        const Phi = (z) => 0.5 * M.erfc(-z / Math.SQRT2);
        let cache = null, st = null;
        v.render(() => {
          const p = rho.value;
          if (!cache || cache.p !== p) {
            const q = Math.sqrt(1 - p * p), X = new Float64Array(N), Y = new Float64Array(N);
            for (let i = 0; i < N; i++) { X[i] = -Math.log(Math.max(1e-300, Phi(-Z1[i]))); Y[i] = 2 * Phi(p * Z1[i] + q * Z2[i]); }
            let s = 0, s2 = 0; for (let i = 0; i < N; i++) { const w = X[i] * Y[i]; s += w; s2 += w * w; }
            const E = s / N, se = Math.sqrt((s2 / N - E * E) / N);
            const est = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => { const pp = 1 / t, qq = 1 / (1 - t); let a = 0, b = 0; for (let i = 0; i < N; i++) { a += X[i] ** pp; b += Y[i] ** qq; } return [t, (a / N) ** (1 / pp) * (b / N) ** (1 / qq)]; });
            cache = { p, X, Y, E, se, est };
          }
          const pts = []; for (let i = 0; i < 900; i++) pts.push([cache.X[i], cache.Y[i]]);
          L.dots(pts, { color: 'accent', r: 1.8, alpha: 0.55 });
          R.fn((t) => B(t), { domain: [0.02, 1], color: 'purple', width: 2.6 });
          R.hline(cache.E, { color: 'green', width: 2.2, dash: [7, 4] });
          R.dots(cache.est, { color: 'purple', r: 3.5 });
          R.vline(0.5, { color: 'muted', dash: [3, 3], width: 1 });
          R.tex('p=2', 0.5, 4.7, { color: 'muted', size: 12, align: 'left', dx: 4 });
          H.y = Math.min(B(H.x), 4.95);
          const t = H.x, pp = 1 / t, qq = t >= 1 ? Infinity : 1 / (1 - t);
          let tmin = 0.5, bmin = B(0.5); for (let k = 1; k <= 200; k++) { const u = k / 200; if (B(u) < bmin) { bmin = B(u); tmin = u; } }
          R.dot(tmin, bmin, { color: 'purple', r: 4, hollow: true });
          st = { t, pp, qq, b: B(t), E: cache.E, se: cache.se, tmin, bmin };
          v.legend([['purple', '$\\|X\\|_p\\|Y\\|_q$ (dots: estimated)'], ['green', '$E|XY|$ (Monte Carlo)', { dash: true }]]);
        });
        v.readout(() => st && `$p=${v.fix(st.pp, 3)}$, $q=${isFinite(st.qq) ? v.fix(st.qq, 3) : '\\infty'}$: $\\ E|XY| = ${v.fix(st.E, 3)}\\pm${v.fix(st.se, 3)} \\le \\|X\\|_p\\|Y\\|_q = ${v.fix(st.b, 3)}$. The best bound here is $${v.fix(st.bmin, 3)}$ at $p=${v.fix(1 / st.tmin, 2)}$.`);
      },
    },
    {
      num: '1.6.4',
      kind: 'Theorem',
      name: 'Chebyshev’s (Markov’s) inequality',
      credit: 'Bienaymé, 1853; Chebyshev, 1867; Markov, 1884',
      statement: String.raw`Let $\varphi:\R\to\R$ with $\varphi\ge0$, let $A\in\mathcal R$, and put $i_A=\inf\{\varphi(y):y\in A\}$. Then
$$i_A\,P(X\in A)\ \le\ E(\varphi(X);X\in A)\ \le\ E\varphi(X),$$
where $E(Z;B)=\int_BZ\,dP$. With $\varphi(x)=|x|$ or $x^2$ and $A=\{|x|\ge a\}$ this gives $P(|X|\ge a)\le E|X|/a$ (often called Markov's inequality) and $a^2P(|X|\ge a)\le EX^2$ (often called Chebyshev's inequality).`,
      idea: String.raw`Pointwise, $i_A1_{\{X\in A\}}\le\varphi(X)1_{\{X\in A\}}\le\varphi(X)$, by the definition of $i_A$ and $\varphi\ge0$. Taking expectations and using monotonicity (Theorem 1.6.1(c)) gives both inequalities. The bound is attained by a law that puts all its mass on $\{|x|=a\}$ and at $0$ (Exercise 1.6.3). For any fixed law with $EX^2<\infty$, though, $a^2P(|X|\ge a)/EX^2\to0$: the middle term $E(X^2;|X|\ge a)$ shows where the slack goes.`,
      caption: String.raw`Log scale: the true tail $P(|X|\ge a)$ (black) under three bounds, $E|X|/a$, $EX^2/a^2$ and $EX^4/a^4$ (when finite). The dashed purple curve is the middle term $E(X^2;|X|\ge a)/a^2$ of the chain, always between the tail and Chebyshev's bound. Drag the gold point along the tail. For the extremal law, mass $1/4$ at $\pm2$ and the rest at $0$, Chebyshev's bound is attained at $a=2$; for the heavy-tailed $t_3$ the fourth moment is infinite and that bound disappears.`,
      deps: ['prob-1.6.1'],
      see: ['algo-12.17', 'graph-11.1.5', 'ml-33.1a'],
      tags: ['inequalities', 'tails'],
      viz(v) {
        const M = v.M, T3 = M.dist.studentT(3), S3 = Math.sqrt(3);
        const t3tr = (a) => { const c = a * S3, I = (u) => 0.5 * (Math.atan(u / S3) / S3 - u / (3 + u * u)); return (2 / 3) * ((6 * S3) / Math.PI) * (I(1e12) - I(c)); };
        const LAWS = {
          norm: { label: 'normal', T: (a) => M.erfc(a / Math.SQRT2), m1: Math.sqrt(2 / Math.PI), m2: 1, m4: 3, tr: (a) => 2 * a * PHI(a) + M.erfc(a / Math.SQRT2) },
          exp: { label: 'exponential', T: (a) => Math.exp(-a), m1: 1, m2: 2, m4: 24, tr: (a) => Math.exp(-a) * (a * a + 2 * a + 2) },
          unif: { label: 'uniform', T: (a) => Math.max(0, 1 - a / S3), m1: S3 / 2, m2: 1, m4: 9 / 5, tr: (a) => (a < S3 ? (3 * S3 - a ** 3) / (3 * S3) : 0) },
          t3: { label: '$t_3/\\sqrt3$', T: (a) => 2 * (1 - T3.cdf(a * S3)), m1: 2 / Math.PI, m2: 1, m4: Infinity, tr: t3tr },
          ext: { label: 'extremal', T: (a) => (a <= 2 ? 0.25 : 0), m1: 0.5, m2: 1, m4: 4, tr: (a) => (a <= 2 ? 1 : 0) },
        };
        const law = v.select('$X$ ~', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'norm');
        const logx = v.toggle('log $a$', false);
        const S = v.stage({ x: [0.05, 6], y: [1e-4, 3], ylog: true, height: 360, axes: 'box', gutter: true, xlabel: '$a$', title: 'tail $P(|X|\\ge a)$ and its bounds' });
        const H = S.handle(2, 0.05, { color: 'gold', constrain: (x) => { const a = clampN(x, 0.1, 5.9), T = LAWS[law.value].T(a); return [a, T > 1e-4 ? T : 1e-4]; } });
        let st = null;
        v.render(() => {
          const Lw = LAWS[law.value];
          S.setScale({ xlog: logx.value, x: logx.value ? [0.1, 6] : [0.05, 6] });
          const a = H.x, T = Lw.T(a); H.y = T > 1e-4 ? T : 1e-4;
          S.hline(1, { color: 'muted', dash: [3, 3], width: 1 });
          S.fn((x) => Lw.m1 / x, { color: 'orange', width: 2 });
          S.fn((x) => Lw.m2 / (x * x), { color: 'purple', width: 2 });
          if (isFinite(Lw.m4)) S.fn((x) => Lw.m4 / x ** 4, { color: 'teal', width: 2 });
          S.fn((x) => Lw.tr(x) / (x * x), { color: 'purple', width: 1.6, dash: [6, 4], n: 600 });
          S.fn(Lw.T, { color: 'ink', width: 3, n: 800 });
          S.vline(a, { color: 'gold', width: 1, alpha: 0.6 });
          st = { a, T, mk: Lw.m1 / a, ch: Lw.m2 / (a * a), m4: Lw.m4 / a ** 4, tr: Lw.tr(a) / (a * a), law: law.value };
          v.legend([['ink', '$P(|X|\\ge a)$'], ['orange', '$E|X|/a$'], ['purple', '$EX^2/a^2$'], ['purple', '$E(X^2;|X|\\ge a)/a^2$', { dash: true }], ['teal', '$EX^4/a^4$']]);
        });
        v.readout(() => st && `at $a=${v.fix(st.a, 2)}$: $P(|X|\\ge a) = ${v.sci(st.T, 3)}\\ \\le\\ E(X^2;|X|\\ge a)/a^2 = ${v.sci(st.tr, 3)}\\ \\le\\ EX^2/a^2 = ${v.sci(st.ch, 3)}$; $\\ E|X|/a = ${v.sci(st.mk, 3)}$, $\\ EX^4/a^4 = ${isFinite(st.m4) ? v.sci(st.m4, 3) : '\\infty'}$.` + (st.law === 'ext' && Math.abs(st.a - 2) < 0.03 ? ' Equality in Chebyshev at $a=2$.' : ''));
      },
    },
    {
      num: '1.6.5',
      kind: 'Theorem',
      name: 'Fatou’s lemma for expectations',
      credit: 'Fatou, 1906',
      statement: String.raw`If $X_n\ge0$, then $\liminf_{n\to\infty}EX_n\ge E\big(\liminf_{n\to\infty}X_n\big)$.`,
      idea: String.raw`Theorem 1.5.5 with $\mu=P$. In probability the inequality says that expectation can drop in the limit but never jump up. The standard way it is strict: $X_n$ takes a huge value on an event of tiny probability, so the product value × probability stays put while the event itself fades. Every sample path then tends to $0$, yet $EX_n$ does not move.`,
      caption: String.raw`$U$ is uniform on $\Omega=(0,1)$ and $X_n=n\,1_{\{U<1/n\}}$. Left: $X_n$ as a function of $\omega$ (log axis), a spike that grows taller and thinner. Middle: the law of $X_n$, probability $1-1/n$ at $0$ and $1/n$ at $n$; the orange bar is the contribution $n\cdot\frac1n=1$ to $EX_n$, which escapes to infinity. Right: $EX_n=1$ for every $n$, the average over 400 seeded $\omega$ (gold, erratic: it depends on the rare draws with $U<1/n$), and $E\liminf X_n=0$. *Alternate* loses mass without any escape; *increasing* loses none.`,
      deps: ['prob-1.5.5'],
      see: ['rca-1.28'],
      tags: ['convergence theorems', 'expectation'],
      viz(v) {
        const MODES = {
          esc: { label: 'escaping $n1_{\\{U<1/n\\}}$', X: (n, u) => (u < 1 / n ? n : 0), E: () => 1, Eliminf: 0 },
          alt: { label: 'alternate', X: (n, u) => (n % 2 ? (u < 0.5 ? 2 : 0) : u >= 0.5 ? 2 : 0), E: () => 1, Eliminf: 0 },
          up: { label: 'increasing $U^{-1/2}\\wedge n$', X: (n, u) => Math.min(u ** -0.5, n), E: (n) => 2 - 1 / n, Eliminf: 2 },
        };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'esc');
        const nS = v.slider('$n$', 1, 20, 6, { int: true });
        const A = v.stage({ x: [1e-3, 1], y: [-0.5, 21], xlog: true, height: 250, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$X_n(\\omega)$' });
        const B = v.stage({ x: [-1, 22], y: [0, 1.08], height: 250, axes: 'box', gutter: true, xlabel: 'value', title: 'law of $X_n$' });
        const C = v.stage({ x: [0, 21], y: [-0.1, 2.4], height: 250, axes: 'box', gutter: true, xlabel: '$k$', title: '$EX_k$ and $E\\liminf X_n$' });
        const U = Array.from({ length: 400 }, (() => { const r = v.rng(23); return () => r(); })());
        let st = null;
        v.render(() => {
          const Md = MODES[mode.value], n = nS.value, md = mode.value;
          A.fn((w) => Md.X(n, w), { domain: [1e-3, 1], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.2, n: 1500 });
          A.dots(U.map((u) => [Math.max(u, 1.05e-3), -0.2]), { color: 'gold', r: 1.6, alpha: 0.7 });
          // law
          if (md === 'up') {
            B.setView([0, 22], [0, 2.1]);
            B.fn((x) => (x >= 1 && x < n ? 2 * x ** -3 : NaN), { domain: [1, n], color: 'teal', width: 2.2, fill: 'teal', fillAlpha: 0.2 });
            B.line(n, 0, n, 1 / (n * n), { color: 'teal', width: 4 }); B.dot(n, 1 / (n * n), { color: 'teal', r: 4 });
            cornerIn(B, `density $2x^{-3}$ on $[1,n)$, atom $1/n^2$ at $n$`, 'tr', { color: 'teal' });
          } else {
            B.setView([-1, 22], [0, 1.08]);
            const atoms = md === 'esc' ? [[0, 1 - 1 / n], [n, 1 / n]] : [[0, 0.5], [2, 0.5]];
            for (const [x, pr] of atoms) {
              if (x > 0) B.rect(x - 0.35, 0, x + 0.35, x * pr, { fill: 'orange', fillAlpha: 0.35, hatch: 'orange', stroke: false });
              B.line(x, 0, x, pr, { color: 'teal', width: 4 }); B.dot(x, pr, { color: 'teal', r: 4.5 });
            }
            cornerIn(B, 'teal: probability; orange: value × probability', 'tr', { color: 'muted' });
          }
          // expectations
          const ks = Array.from({ length: 20 }, (_, i) => i + 1);
          C.hline(Md.Eliminf, { color: 'green', width: 2, dash: [6, 4] });
          C.path(ks.map((k) => [k, Md.E(k)]), { color: 'accent', width: 2 });
          const mc = ks.map((k) => [k, U.reduce((s, u) => s + Md.X(k, u), 0) / U.length]);
          C.dots(mc, { color: 'gold', r: 3.2 });
          C.dot(n, Md.E(n), { color: 'accent', r: 5.5 });
          st = { n, E: Md.E(n), mc: mc[n - 1][1], Eli: Md.Eliminf, md };
          v.legend([['accent', '$X_n$ and $EX_n$'], ['gold', 'seeded $\\omega$ and their average', { dot: true }], ['teal', 'law of $X_n$'], ['green', '$E\\liminf X_n$', { dash: true }]]);
        });
        v.readout(() => st && `$EX_n = ${v.fix(st.E, 3)}$ (average over 400 draws: $${v.fix(st.mc, 3)}$), $\\ E\\liminf_n X_n = ${v.fix(st.Eli, 3)}$: ` + (st.md === 'up' ? 'equality, as monotone convergence guarantees.' : st.md === 'esc' ? 'for each $\\omega$, $X_n(\\omega)=0$ as soon as $n>1/U(\\omega)$, yet the mean is stuck at $1$.' : 'each $\\omega$ sees $X_n=0$ for every other $n$, so $\\liminf X_n=0$, while $EX_n=1$.'));
      },
    },
    {
      num: '1.6.6',
      kind: 'Theorem',
      name: 'Monotone convergence theorem for expectations',
      credit: 'B. Levi, 1906',
      statement: String.raw`If $0\le X_n\uparrow X$, then $EX_n\uparrow EX$ (possibly $+\infty$). More generally (Exercise 1.6.13) it suffices that $X_n\uparrow X$ and $EX_1^-<\infty$.`,
      idea: String.raw`Theorem 1.5.7 with $\mu=P$. Its most frequent use is truncation: $X\wedge n\uparrow X$ for $X\ge0$, so $EX=\lim E(X\wedge n)$, and $E(X\wedge n)=\int_0^nP(X>x)\,dx$ is a finite area for each $n$. Whether $EX$ is finite is then a question about how fast the tail $P(X>x)$ decays.`,
      caption: String.raw`$X$ is Pareto: $P(X>x)=x^{-\alpha}$ for $x\ge1$. Left: the tail $P(X>x)$ (black) and the empirical tail of 2000 seeded draws (gold); the shaded area up to the cut $x=n$ is $E(X\wedge n)$. Right: $E(X\wedge n)$ against $n$, exact (blue) and from the samples (gold). For $\alpha>1$ it rises to $EX=\alpha/(\alpha-1)$; for $\alpha\le1$ the area under the tail is infinite and the means grow without bound.`,
      deps: ['prob-1.5.7'],
      see: ['rca-1.26'],
      tags: ['convergence theorems', 'expectation'],
      viz(v) {
        const aS = v.slider('tail exponent $\\alpha$', 0.6, 3, 1.5, { step: 0.05 });
        const nS = v.slider('cut $n$', 1, 10000, 12, { log: true });
        const L = v.stage({ x: [0, 40], y: [0, 1.05], height: 300, weight: 1.3, axes: 'box', gutter: true, xlabel: '$x$', title: 'tail $P(X>x)$; shaded area $=E(X\\wedge n)$' });
        const R = v.stage({ x: [1, 10000], y: [0, 4], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: '$E(X\\wedge n)\\uparrow EX$' });
        const r0 = v.rng(41), U = Float64Array.from({ length: 2000 }, () => 1 - r0());
        const EXn = (a, n) => (n <= 1 ? n : Math.abs(a - 1) < 1e-9 ? 1 + Math.log(n) : 1 + (n ** (1 - a) - 1) / (1 - a));
        let st = null;
        v.render(() => {
          const a = aS.value, n = nS.value, tail = (x) => (x < 1 ? 1 : x ** -a);
          const xs = Array.from(U, (u) => u ** (-1 / a)).sort((p, q) => p - q);
          L.fn((x) => (x <= n ? tail(x) : NaN), { domain: [0, Math.min(n, 40)], fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 0.01 });
          L.fn(tail, { color: 'ink', width: 2.4 });
          const emp = []; for (let i = 0; i < xs.length; i += 4) { if (xs[i] > 40) break; emp.push([xs[i], 1 - i / xs.length]); }
          L.path(emp, { color: 'gold', width: 1.6 });
          if (n <= 40) { L.vline(n, { color: 'orange', width: 1.8, dash: [6, 4] }); L.tex('x=n', n, 0.9, { color: 'orange', align: 'left', dx: 5 }); }
          else cornerIn(L, `cut at $n=${v.fmt(n, 3)}$, beyond the panel`, 'tr', { color: 'orange' });
          const lim = a > 1 ? a / (a - 1) : Infinity;
          const ymax = isFinite(lim) ? Math.max(2.2, lim * 1.2) : EXn(a, 10000) * 1.1;
          R.setView(null, [0, ymax]);
          if (isFinite(lim)) { R.hline(lim, { color: 'green', width: 2, dash: [6, 4] }); R.tex(`EX=${v.fix(lim, 3)}`, 1.3, lim, { color: 'green', align: 'left', baseline: 'bottom', dy: -3 }); }
          else cornerIn(R, '$EX=\\infty$', 'tl', { color: 'red' });
          R.fn((m) => EXn(a, m), { color: 'accent', width: 2.4 });
          const mc = [1.5, 3, 10, 30, 100, 300, 1000, 3000, 10000].map((m) => [m, xs.reduce((s, x) => s + Math.min(x, m), 0) / xs.length]);
          R.dots(mc, { color: 'gold', r: 3.5 });
          R.dot(n, EXn(a, n), { color: 'accent', r: 6 });
          st = { a, n, e: EXn(a, n), lim, mc: xs.reduce((s, x) => s + Math.min(x, n), 0) / xs.length };
          v.legend([['ink', '$P(X>x)=x^{-\\alpha}$'], ['gold', 'empirical (2000 draws)'], ['accent', '$E(X\\wedge n)$', { area: true }]]);
        });
        v.readout(() => st && `$E(X\\wedge n) = 1+\\int_1^n x^{-\\alpha}dx = ${v.fix(st.e, 4)}$ (samples: $${v.fix(st.mc, 4)}$), increasing to $EX = ${isFinite(st.lim) ? v.fix(st.lim, 4) : '\\infty'}$` + (isFinite(st.lim) ? '.' : ' since $\\alpha\\le1$.'));
      },
    },
    {
      num: '1.6.7',
      kind: 'Theorem',
      name: 'Dominated convergence theorem for expectations',
      credit: 'Lebesgue, 1908',
      statement: String.raw`If $X_n\to X$ a.s., $|X_n|\le Y$ for all $n$, and $EY<\infty$, then $EX_n\to EX$. The special case where $Y$ is a constant is the **bounded convergence theorem**.`,
      idea: String.raw`Theorem 1.5.8 with $\mu=P$. The dominating variable $Y$ must work for every $n$ at once. The smallest candidate is $\sup_n|X_n|$, so the theorem applies exactly when $E\sup_n|X_n|<\infty$. When even that supremum has infinite mean, $EX_n$ is free to stay away from $EX$.`,
      caption: String.raw`Twenty-four seeded sample paths $n\mapsto X_n(\omega)$. *Dominated:* $X_n=(1+Z/n)^n\to e^Z$ for a standard normal $Z$, and $|X_n|\le e^{|Z|}$ with $Ee^{|Z|}=2e^{1/2}\Phi(1)<\infty$; the green dots at the right are the limits $e^{Z}$, the orange ticks the bounds. Right: $EX_n$, exact (blue) and averaged over 4000 draws (gold), converges to $Ee^Z=\sqrt e$. *Undominated:* $X_n=nU^n\to0$ for uniform $U$, but $EX_n=n/(n+1)\to1$ and $E\sup_nX_n=\infty$.`,
      deps: ['prob-1.5.8'],
      see: ['rca-1.34'],
      tags: ['convergence theorems', 'expectation'],
      viz(v) {
        const M = v.M;
        const Edom = (n) => { let s = 0; for (let k = 0; k <= n; k += 2) { const df = k === 0 ? 0 : M.lgamma(k + 1) - (k / 2) * Math.log(2) - M.lgamma(k / 2 + 1); s += Math.exp(M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1) + df - k * Math.log(n)); } return s; };
        const mode = v.select('', [{ value: 'dom', label: 'dominated $(1+Z/n)^n$' }, { value: 'und', label: 'undominated $nU^n$' }], 'dom');
        const NMAX = 60;
        const L = v.stage({ x: [0, NMAX + 4], y: [-1, 9], height: 300, weight: 1.4, axes: 'box', gutter: true, xlabel: '$n$', title: 'sample paths $X_n(\\omega)$' });
        const R = v.stage({ x: [0, NMAX], y: [0, 2], height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: '$EX_n$ and $EX$' });
        const r0 = v.rng(29), Zs = Float64Array.from({ length: 4000 }, () => r0.normal()), Us = Float64Array.from({ length: 4000 }, () => r0());
        const nS = v.slider('highlight $n$', 1, NMAX, 10, { int: true });
        const COLS = ['accent', 'teal', 'purple', 'pink', 'orange', 'blue'];
        let mcCache = {}, st = null;
        v.render(() => {
          const md = mode.value, n = nS.value;
          const Xf = md === 'dom' ? (k, i) => (1 + Zs[i] / k) ** k : (k, i) => k * Us[i] ** k;
          const lim = md === 'dom' ? (i) => Math.exp(Zs[i]) : () => 0, bound = md === 'dom' ? (i) => Math.exp(Math.abs(Zs[i])) : (i) => { const u = Us[i], k = Math.max(1, Math.round(-1 / Math.log(u))); let b = 0; for (let j = Math.max(1, k - 2); j <= k + 2; j++) b = Math.max(b, j * u ** j); return b; };
          L.setView(null, md === 'dom' ? [-1.5, 9] : [-0.4, 9]);
          for (let i = 0; i < 24; i++) {
            const pts = []; for (let k = 1; k <= NMAX; k++) pts.push([k, Xf(k, i)]);
            L.path(pts, { color: COLS[i % COLS.length], width: 1.3, alpha: 0.75 });
            L.dot(NMAX + 1.5, Math.min(lim(i), 9), { color: 'green', r: 3 });
            const bv = bound(i); if (bv < 9) L.line(NMAX + 2.5, bv, NMAX + 3.8, bv, { color: 'orange', width: 2 });
          }
          L.vline(n, { color: 'gold', width: 1.2, alpha: 0.7 });
          if (!mcCache[md]) { const out = []; for (let k = 1; k <= NMAX; k++) { let s = 0; for (let i = 0; i < 4000; i++) s += Xf(k, i); out.push([k, s / 4000]); } mcCache[md] = out; }
          const ex = (k) => (md === 'dom' ? Edom(k) : k / (k + 1)), EX = md === 'dom' ? Math.exp(0.5) : 0;
          R.setView(null, [-0.08, md === 'dom' ? 2 : 1.25]);
          R.hline(EX, { color: 'green', width: 2, dash: [6, 4] });
          R.path(Array.from({ length: NMAX }, (_, i) => [i + 1, ex(i + 1)]), { color: 'accent', width: 2.4 });
          R.dots(mcCache[md], { color: 'gold', r: 2.6 });
          R.dot(n, ex(n), { color: 'accent', r: 5.5 });
          st = { md, n, E: ex(n), EX, mc: mcCache[md][n - 1][1] };
          v.legend([['accent', 'paths; exact $EX_n$'], ['gold', 'average of 4000 draws', { dot: true }], ['green', 'limits $X(\\omega)$ and $EX$', { dot: true }], ['orange', md === 'dom' ? 'bound $e^{|Z|}$' : '$\\sup_n X_n(\\omega)$']]);
        });
        v.readout(() => st && `$EX_n = ${v.fix(st.E, 4)}$ (draws: $${v.fix(st.mc, 4)}$), $\\ EX = ${v.fix(st.EX, 4)}$. ` + (st.md === 'dom' ? 'Dominated by $e^{|Z|}$ with $Ee^{|Z|}\\approx2.77$: the means converge.' : 'Every path tends to $0$, but $\\sup_n nU^n\\approx 1/(e\\log(1/U))$ has infinite mean, and $EX_n\\to1\\ne0$.'));
      },
    },
    {
      num: '1.6.8',
      kind: 'Theorem',
      name: 'Convergence of Eh(Xₙ) under a growth bound',
      statement: String.raw`Suppose $X_n\to X$ a.s. and $g,h$ are continuous functions with

(i) $g\ge0$ and $g(x)\to\infty$ as $|x|\to\infty$;
(ii) $|h(x)|/g(x)\to0$ as $|x|\to\infty$;
(iii) $Eg(X_n)\le K<\infty$ for all $n$.

Then $Eh(X_n)\to Eh(X)$. The most important case is $g(x)=|x|^p$ with $p>1$ and $h(x)=x$: a uniform bound on $E|X_n|^p$ gives $EX_n\to EX$.`,
      idea: String.raw`Truncate at a level $M$ with $P(|X|=M)=0$: on $\{|X_n|\le M\}$ the variables are bounded, so the bounded convergence theorem gives $Eh(\bar X_n)\to Eh(\bar X)$. The truncation error is at most $\eps_M\,Eg(X_n)\le K\eps_M$, where $\eps_M=\sup_{|x|\ge M}|h(x)|/g(x)\to0$ by (ii). Fatou gives $Eg(X)\le K$, so the same bound covers $X$. No integrable dominating variable is needed; this is the germ of uniform integrability.`,
      caption: String.raw`Durrett's Exercise 1.6.7: on $\Omega=(0,1)$, $X_n=n^\alpha1_{(1/(n+1),1/n)}\to0$; take $h(x)=x$ and $g(x)=|x|^r$. Top (log–log): the disjoint blocks $X_n$, whose envelope is their union. Bottom left: $EX_n$ (blue) and $Eg(X_n)$ (orange) against $n$. Bottom right: drag the point $(\alpha,r)$. In the green region (ii) and (iii) hold, so the theorem applies; dominated convergence needs the much smaller blue strip $\alpha<1$; and $EX_n\to0$ fails exactly in the red region $\alpha\ge2$.`,
      deps: ['prob-1.5.3', 'prob-1.3.7a'],
      see: ['prob-4.6.2', 'prob-4.6.3'],
      tags: ['convergence theorems', 'uniform integrability'],
      viz(v) {
        const T = v.stage({ x: [0.006, 1], y: [0.5, 2e4], xlog: true, ylog: true, height: 220, full: true, axes: 'box', gutter: true, xlabel: '$\\omega$', title: 'blocks $X_n=n^\\alpha$ on $(1/(n+1),1/n)$' });
        const B = v.stage({ x: [1, 1e4], y: [1e-4, 1e4], xlog: true, ylog: true, height: 280, axes: 'box', gutter: true, xlabel: '$n$', title: '$EX_n$ and $Eg(X_n)=E|X_n|^r$' });
        const P = v.stage({ x: [0, 3], y: [0.5, 3], height: 280, axes: 'box', gutter: true, xlabel: '$\\alpha$', ylabel: '$r$', title: 'which hypotheses hold?' });
        const H = P.handle(1.5, 1.2, { color: 'gold', constrain: (x, y) => [clampN(x, 0.05, 2.95), clampN(y, 0.55, 2.95)] });
        let st = null;
        v.render(() => {
          const a = H.x, r = H.y;
          for (let n = 1; n <= 160; n++) T.rect(1 / (n + 1), 0.5, 1 / n, n ** a, { fill: n % 2 ? 'accent' : 'teal', fillAlpha: 0.45, stroke: false });
          const EX = (n) => n ** a / (n * (n + 1)), Eg = (n) => n ** (a * r) / (n * (n + 1));
          B.fn(EX, { color: 'accent', width: 2.4 }); B.fn(Eg, { color: 'orange', width: 2.4 });
          const K = a * r <= 2 ? Eg(1) >= Eg(1e9) ? Eg(1) : Math.max(Eg(1), 1) : Infinity;
          if (isFinite(K)) B.hline(Math.max(Eg(1), a * r === 2 ? 1 : Eg(1)), { color: 'orange', dash: [5, 4], width: 1.2 });
          // hypothesis map
          P.poly([[0, 1], [2, 1], ...Array.from({ length: 40 }, (_, i) => { const al = 2 - (i / 39) * (2 - 2 / 3); return [al, 2 / al]; }), [0, 3]], { fill: 'green', fillAlpha: 0.22, stroke: false });
          P.rect(2, 0.5, 3, 3, { fill: 'red', fillAlpha: 0.14, stroke: false });
          P.rect(0, 0.5, 1, 3, { fill: 'blue', fillAlpha: 0.1, hatch: 'blue', hatchAlpha: 0.35, stroke: false });
          P.fn((x) => 2 / x, { domain: [2 / 3, 3], color: 'green', width: 1.6 });
          P.hline(1, { color: 'green', width: 1.6, dash: [5, 4] });
          P.vline(2, { color: 'red', width: 1.6 }); P.vline(1, { color: 'blue', width: 1.2, dash: [4, 4] });
          P.text('theorem applies', 0.15, 1.35, { size: 11, color: 'green' }); P.text('DCT', 0.15, 2.8, { size: 11, color: 'blue' }); P.text('$EX_n\\not\\to0$', 2.1, 2.8, { size: 11, color: 'red' });
          const applies = r > 1 && a * r <= 2 + 1e-9, dct = a < 1, concl = a < 2;
          st = { a, r, applies, dct, concl, Ksup: a * r <= 2 ? Math.max(...[1, 2, 5, 10, 100, 1e4].map(Eg)) : Infinity };
          v.legend([['accent', '$EX_n$ (blocks: $X_n$)'], ['orange', '$Eg(X_n)$'], ['green', '(ii) and (iii) hold', { area: true }], ['blue', 'dominated', { area: true }], ['red', 'conclusion fails', { area: true }]]);
        });
        v.readout(() => st && `$\\alpha=${v.fix(st.a, 2)}$, $r=${v.fix(st.r, 2)}$: (ii) ${st.r > 1 ? 'holds ($r>1$)' : 'fails ($r\\le1$)'}, (iii) ${st.a * st.r <= 2 + 1e-9 ? `holds ($\\sup_n Eg(X_n)\\approx${v.fix(st.Ksup, 3)}$)` : 'fails ($Eg(X_n)\\to\\infty$)'}; $E\\sup_nX_n=\\sum_n n^{\\alpha}/(n(n+1))$ is ${st.dct ? 'finite, so DCT applies too' : 'infinite, so DCT does not apply'}. Conclusion $EX_n\\to0$: ${st.concl ? 'yes' : 'no'}${st.applies ? ', as the theorem guarantees.' : st.concl ? ', although the theorem does not apply.' : '.'}`);
      },
    },
    {
      num: '1.6.9',
      kind: 'Theorem',
      name: 'Change of variables formula',
      statement: String.raw`Let $X$ be a random element of a measurable space $(S,\mathcal S)$ with distribution $\mu$, that is $\mu(A)=P(X\in A)$. If $f:(S,\mathcal S)\to(\R,\mathcal R)$ is measurable and either $f\ge0$ or $E|f(X)|<\infty$, then
$$Ef(X)=\int_Sf(y)\,\mu(dy).$$
Writing $h$ for $X$ and $P\circ h^{-1}$ for $\mu$: $\int_\Omega f(h(\omega))\,dP=\int_Sf\,d(P\circ h^{-1})$.`,
      idea: String.raw`Climb the four steps used to build the integral. For an indicator $f=1_B$ both sides equal $P(X\in B)=\mu(B)$, by the definition of $\mu$. Linearity extends this to simple $f$. For $f\ge0$ the simple functions $([2^nf]/2^n)\wedge n\uparrow f$, and the monotone convergence theorem (1.6.6) passes the identity to the limit. Finally $f=f^+-f^-$. The integral over the abstract space $\Omega$ thus becomes a computable integral on $\R$.`,
      caption: String.raw`Top left: a random variable $X$ on $\Omega=(0,1)$. Top right: its law $\mu$ on $\R$, drawn sideways on the same vertical scale: a histogram of 4000 seeded draws and the exact density. Drag the gold handles to set an interval $B$; its preimage $\{X\in B\}$ (shaded on the left, a union of intervals) has probability exactly $\mu(B)$. Bottom: for the chosen $f$, the area under $f(X(\omega))$ on $\Omega$ equals the area under $f(x)\,\mu(dx)$ on $\R$. Try the non-monotone $3\sin2\pi\omega$, whose preimages split into two pieces.`,
      deps: ['prob-1.6.1a', 'prob-1.2.1b', 'prob-1.6.6'],
      see: ['pma-10.9'],
      tags: ['expectation'],
      viz(v) {
        const M = v.M, Nd = M.dist.normal(0, 1);
        const XS = {
          norm: { label: '$\\Phi^{-1}(\\omega)$', X: (w) => Nd.quantile(clampN(w, 1e-12, 1 - 1e-12)), pdf: PHI, cdf: (x) => Nd.cdf(x), atoms: null },
          sin: { label: '$3\\sin 2\\pi\\omega$', X: (w) => 3 * Math.sin(2 * Math.PI * w), pdf: (x) => (Math.abs(x) < 3 ? 1 / (Math.PI * Math.sqrt(9 - x * x)) : 0), cdf: (x) => (x <= -3 ? 0 : x >= 3 ? 1 : 0.5 + Math.asin(x / 3) / Math.PI), atoms: null },
          step: { label: 'simple (3 values)', X: (w) => (w < 0.3 ? -1.5 : w < 0.8 ? 0.5 : 2), pdf: null, atoms: [[-1.5, 0.3], [0.5, 0.5], [2, 0.2]] },
        };
        const FS = { ind: { label: '$f=1_B$' }, sq: { label: '$f(x)=x^2$', f: (x) => x * x }, cos: { label: '$f(x)=\\cos 3x$', f: (x) => Math.cos(3 * x) } };
        const xSel = v.select('$X$ =', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const fSel = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'ind');
        const Y = [-3.3, 3.3];
        const A = v.stage({ x: [0, 1], y: Y, height: 250, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$X$ on $\\Omega=(0,1)$, $P$ = length' });
        const Bs = v.stage({ x: [0, 1], y: Y, height: 250, axes: 'box', gutter: true, xlabel: 'density', title: 'law $\\mu$ of $X$ (sideways)' });
        const C1 = v.stage({ x: [0, 1], y: [-1.2, 10], height: 200, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$f(X(\\omega))$: area $=Ef(X)$' });
        const C2 = v.stage({ x: Y, y: [-0.4, 1.2], height: 200, axes: 'box', gutter: true, xlabel: '$x$', title: '$f(x)\\,\\mu(dx)$: area $=\\int f\\,d\\mu$' });
        const lo = Bs.handle(0.92, 0.8, { color: 'gold', constrain: (x, y) => [Bs.xr[1] * 0.92, clampN(y, -3.2, hi.y - 0.05)] });
        const hi = Bs.handle(0.92, 2.4, { color: 'gold', constrain: (x, y) => [Bs.xr[1] * 0.92, clampN(y, lo.y + 0.05, 3.2)] });
        const r0 = v.rng(31), Us = Float64Array.from({ length: 4000 }, () => r0());
        let st = null;
        v.render(() => {
          const Xd = XS[xSel.value], c = lo.y, d = hi.y, inB = (x) => x > c && x <= d;
          const f = fSel.value === 'ind' ? (x) => (inB(x) ? 1 : 0) : FS[fSel.value].f;
          // A: X on Ω with the preimage of B
          A.hband(c, d, { color: 'gold', alpha: 0.16 });
          for (const [a, b] of scanIntervals((w) => inB(Xd.X(w)), 1600)) A.vband(a, b, { color: 'gold', alpha: 0.22 });
          A.fn(Xd.X, { domain: [0.0005, 0.9995], color: 'accent', width: 2.4, n: 1200 });
          // B: sideways law
          const draws = Array.from(Us, (u) => Xd.X(u)), Hh = M.histogram(draws, { bins: 44, range: Y });
          const dmax = Xd.atoms ? 0.62 : Math.min(1.2, Math.max(...Hh.density) * 1.25);
          Bs.setView([0, dmax], null); lo.x = hi.x = dmax * 0.92;
          Bs.hband(c, d, { color: 'gold', alpha: 0.16 });
          if (Xd.atoms) for (const [x, p] of Xd.atoms) { Bs.rect(0, x - 0.06, p, x + 0.06, { fill: 'teal', fillAlpha: 0.7, stroke: false }); Bs.text(v.fix(p, 2), p + 0.02, x, { size: 11, color: 'teal' }); }
          else {
            Hh.edges.slice(0, -1).forEach((e, i) => { if (Hh.density[i] > 0) Bs.rect(0, e, Math.min(Hh.density[i], dmax), Hh.edges[i + 1], { fill: 'teal', fillAlpha: 0.3, stroke: false }); });
            const pts = []; for (let i = 0; i <= 600; i++) { const y = Y[0] + ((Y[1] - Y[0]) * i) / 600, p = Xd.pdf(y); pts.push(p > 0 ? [Math.min(p, dmax), y] : null); }
            Bs.path(pts, { color: 'ink', width: 2 });
          }
          const muB = Xd.atoms ? Xd.atoms.reduce((s, [x, p]) => s + (inB(x) ? p : 0), 0) : Xd.cdf(d) - Xd.cdf(c);
          cornerIn(Bs, `$\\mu(B)=${v.fix(muB, 4)}$`, 'tr', { color: 'gold', plate: true });
          // C1: f∘X on Ω
          const fX = (w) => f(Xd.X(w)), NW = 20000; let IO = 0; for (let i = 0; i < NW; i++) IO += fX((i + 0.5) / NW); IO /= NW;
          const yr = fSel.value === 'sq' ? [-0.6, 10] : [-1.2, 1.3];
          C1.setView(null, yr); C1.hline(0, { color: 'muted', width: 1 });
          C1.fn(fX, { domain: [0.0005, 0.9995], color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.2, n: 1600 });
          // C2: f against μ on ℝ
          let IR;
          C2.hline(0, { color: 'muted', width: 1 });
          if (Xd.atoms) {
            C2.setView(null, [Math.min(-0.15, ...Xd.atoms.map(([x, p]) => f(x) * p)) * 1.2, Math.max(0.3, ...Xd.atoms.map(([x, p]) => f(x) * p)) * 1.2]);
            for (const [x, p] of Xd.atoms) { C2.line(x, 0, x, f(x) * p, { color: 'purple', width: 5 }); C2.dot(x, f(x) * p, { color: 'purple', r: 4 }); }
            IR = Xd.atoms.reduce((s, [x, p]) => s + f(x) * p, 0);
          } else {
            const g = (x) => f(x) * Xd.pdf(x);
            IR = xSel.value === 'sin' ? (() => { let s = 0; const n = 20000; for (let i = 0; i < n; i++) s += f(-3 * Math.cos((Math.PI * (i + 0.5)) / n)); return s / n; })() : fSel.value === 'ind' ? Xd.cdf(d) - Xd.cdf(c) : simpson(g, -9, 9, 3000);
            const gs = []; for (let i = 0; i <= 1600; i++) { const x = Y[0] + ((Y[1] - Y[0]) * i) / 1600; gs.push(g(x)); }
            const top = Math.max(0.2, ...gs.filter(isFinite).map((t) => Math.min(t, 3))), bot = Math.min(0, ...gs.filter(isFinite));
            C2.setView(null, [bot * 1.15 - 0.05 * top, Math.min(top * 1.15, 1.6)]);
            C2.fn(g, { domain: [Y[0] + 0.001, Y[1] - 0.001], color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.2, n: 1600 });
          }
          const mc = draws.reduce((s, x) => s + f(x), 0) / draws.length;
          st = { IO, IR, mc, muB };
          v.legend([['accent', '$X(\\omega)$'], ['gold', '$B$ and $\\{X\\in B\\}$', { area: true }], ['teal', 'histogram of $X$', { area: true }], ['ink', 'density'], ['purple', 'the two integrands', { area: true }]]);
        });
        v.readout(() => st && `$\\int_\\Omega f(X(\\omega))\\,P(d\\omega) = ${v.fix(st.IO, 4)}$, $\\ \\int_\\R f\\,d\\mu = ${v.fix(st.IR, 4)}$, average over 4000 draws: $${v.fix(st.mc, 4)}$.`);
      },
    },
    {
      num: '1.6.9a',
      kind: 'Definition',
      name: 'Moments and variance',
      verify: true,
      statement: String.raw`For a positive integer $k$, $EX^k$ is the **$k$th moment** of $X$; the first moment $EX$ is the mean $\mu$. If $EX^2<\infty$, the **variance** is
$$\operatorname{var}(X)=E(X-\mu)^2=EX^2-\mu^2,$$
so $\operatorname{var}(X)\le EX^2$, and $\operatorname{var}(aX+b)=a^2\operatorname{var}(X)$. By the change of variables formula all of these are integrals against the law of $X$: $EX^k=\int x^k\,\mu(dx)$. If $E|X|^k<\infty$ then $E|X|^j<\infty$ for $0<j<k$ (Exercise 1.6.11).`,
      idea: String.raw`Expanding the square and using linearity: $E(X-\mu)^2=EX^2-2\mu EX+\mu^2=EX^2-\mu^2$. A moment exists only if the tail of the law decays fast enough: $E|X|^s<\infty$ asks that $\int s\,x^{s-1}P(|X|>x)\,dx$ converge (Lemma 2.2.13). Conversely, the full sequence of moments need not determine the law: Heyde's lognormal family is the classical example (Section 3.3.5).`,
      caption: String.raw`*Tail:* Student's $t_\nu$ has $P(|X|>x)\approx Cx^{-\nu}$. Slide $\nu$. Right: $s\mapsto\log_{10}E|X|^s$, finite exactly for $s<\nu$ (red asymptote), with the normal law (dashed) for comparison. The mean exists for $\nu>1$, the variance for $\nu>2$. *Lognormal:* the densities $f(x)\,(1+a\sin(2\pi\log x))$ for $|a|\le1$ all share every integer moment $EX^k=e^{k^2/2}$ with the lognormal $f$. Left: the density of $\log X$; right: the relative difference of $E|X|^s$, $\times10^9$, computed by quadrature. It vanishes at every integer $s$.`,
      deps: ['prob-1.6.9'],
      see: ['prob-2.2.13', 'prob-3.3.25', 'stat-1.3'],
      tags: ['expectation', 'moments'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'tail', label: 'tail: Student $t_\\nu$' }, { value: 'logn', label: 'same moments: lognormal family' }], 'tail');
        const nuS = v.slider('$\\nu$', 1.2, 8, 3.5, { step: 0.05 });
        const aS = v.slider('$a$', -1, 1, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-6, 6], y: [0, 0.45], height: 300, axes: 'box', gutter: true, title: 'density' });
        const R = v.stage({ x: [0, 6], y: [-0.5, 4], height: 300, weight: 1.2, axes: 'box', gutter: true, xlabel: '$s$', title: 'moment curve' });
        const absMomT = (nu, s) => (s >= nu ? Infinity : Math.exp((s / 2) * Math.log(nu) + M.lgamma((s + 1) / 2) + M.lgamma((nu - s) / 2) - 0.5 * Math.log(Math.PI) - M.lgamma(nu / 2)));
        const absMomN = (s) => Math.exp((s / 2) * Math.log(2) + M.lgamma((s + 1) / 2) - 0.5 * Math.log(Math.PI));
        const momA = (s, a) => { let S = 0; const h = 0.01; for (let y = s - 14; y <= s + 14 + 1e-9; y += h) S += Math.exp(s * y) * PHI(y) * (1 + a * Math.sin(2 * Math.PI * y)); return S * h; };
        let cache = null, st = null;
        v.render(() => {
          const md = mode.value; nuS.el.hidden = md !== 'tail'; aS.el.hidden = md !== 'logn';
          if (md === 'tail') {
            const nu = nuS.value, D = M.dist.studentT(nu);
            L.setView([-6, 6], [0, 0.45]); L.setLabels('$x$'); L.setTitle('density of $t_\\nu$ (dashed: normal)');
            R.setView([0, 6], [-0.5, 4]); R.setLabels('$s$'); R.setTitle('$\\log_{10}E|X|^s$');
            L.fn(PHI, { color: 'muted', width: 1.6, dash: [6, 4] });
            L.fn(D.pdf, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.15 });
            if (nu > 2) { const sd = Math.sqrt(nu / (nu - 2)); L.line(-sd, 0.03, sd, 0.03, { color: 'orange', width: 2.4 }); L.text('±1 s.d.', 0, 0.05, { size: 11, color: 'orange', align: 'center' }); }
            R.fn((s) => Math.log10(absMomN(s)), { domain: [0, 6], color: 'muted', width: 1.6, dash: [6, 4] });
            R.fn((s) => Math.log10(absMomT(nu, s)), { domain: [0, Math.min(6, nu - 1e-3)], color: 'accent', width: 2.6 });
            if (nu < 6) { R.vline(nu, { color: 'red', width: 1.8, dash: [6, 4] }); R.tex('s=\\nu', nu, 3.7, { color: 'red', align: 'left', dx: 5 }); }
            for (const s of [1, 2]) if (s < nu) R.dot(s, Math.log10(absMomT(nu, s)), { color: 'gold', r: 5, label: s === 1 ? '$E|X|$' : '$EX^2$', labelPos: 'nw' });
            st = { md, nu, m1: absMomT(nu, 1), v: nu > 2 ? nu / (nu - 2) : Infinity };
            v.legend([['accent', '$t_\\nu$'], ['muted', 'normal', { dash: true }], ['red', 'moments stop at $s=\\nu$', { dash: true }]]);
          } else {
            const a = aS.value;
            L.setView([-3.5, 3.5], [0, 0.85]); L.setLabels('$y=\\log x$'); L.setTitle('density of $\\log X$');
            R.setView([0, 6], [-3.4, 3.4]); R.setLabels('$s$'); R.setTitle('$(E_aX^s/EX^s-1)\\times10^9$');
            L.fn(PHI, { color: 'muted', width: 1.6, dash: [6, 4] });
            L.fn((y) => PHI(y) * (1 + a * Math.sin(2 * Math.PI * y)), { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.15, n: 800 });
            if (!cache || cache.a !== a) cache = { a, pts: Array.from({ length: 121 }, (_, i) => { const s = i / 20; return [s, (momA(s, a) / Math.exp((s * s) / 2) - 1) * 1e9]; }) };
            R.hline(0, { color: 'muted', width: 1 });
            R.fn((s) => a * Math.exp(-2 * Math.PI * Math.PI) * Math.sin(2 * Math.PI * s) * 1e9, { color: 'green', width: 1.6, dash: [6, 4] });
            R.path(cache.pts, { color: 'accent', width: 2.4 });
            for (let k = 0; k <= 6; k++) R.dot(k, cache.pts[k * 20][1], { color: 'gold', r: 5 });
            st = { md, a, moms: [1, 2, 3, 4].map((k) => momA(k, a)), max: Math.max(...cache.pts.map((p) => Math.abs(p[1]))) };
            v.legend([['accent', '$f_a$ and its relative moment error'], ['muted', 'lognormal $f$', { dash: true }], ['green', '$a\\,e^{-2\\pi^2}\\sin(2\\pi s)$', { dash: true }], ['gold', 'integer $s$', { dot: true }]]);
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.md === 'tail') return `$t_{${v.fix(st.nu, 2)}}$: $EX=${st.nu > 1 ? '0' : '\\text{undefined}'}$, $E|X| = ${st.nu > 1 ? v.fix(st.m1, 4) : '\\infty'}$, $\\operatorname{var}(X) = ${isFinite(st.v) ? v.fix(st.v, 4) : '\\infty'}$; $E|X|^s<\\infty$ exactly for $s<\\nu$.`;
          return `$a=${v.fix(st.a, 2)}$: $EX^k$ for $k=1..4$ by quadrature: $${st.moms.map((m) => v.fix(m, m > 100 ? 2 : 4)).join(',\\ ')}$, equal to $e^{k^2/2}$ for every $a$; $\\operatorname{var}(X)=e(e-1)=${v.fix(Math.E * (Math.E - 1), 4)}$ for all of them. Fractional moments differ by at most $|a|e^{-2\\pi^2}\\approx ${v.sci(Math.abs(st.a) * Math.exp(-2 * Math.PI * Math.PI), 2)}$ (relative).`;
        });
      },
    },
    {
      num: '1.6.13',
      kind: 'Definition',
      name: 'Poisson distribution',
      credit: 'Poisson, 1837',
      statement: String.raw`$X$ has the **Poisson distribution** with parameter $\lambda>0$ if
$$P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!},\qquad k=0,1,2,\dots$$
Its factorial moments are $E\big(X(X-1)\cdots(X-k+1)\big)=\lambda^k$; in particular $EX=\lambda$ and $\operatorname{var}(X)=\lambda$.`,
      idea: String.raw`In $\sum_jj(j-1)\cdots(j-k+1)e^{-\lambda}\lambda^j/j!$ the terms with $j<k$ vanish, and cancelling the falling factorial against $j!$ leaves $\lambda^k\sum_{j\ge k}e^{-\lambda}\lambda^{j-k}/(j-k)!=\lambda^k$, because the probabilities sum to $1$. Then $EX=\lambda$, and $\operatorname{var}(X)=E(X(X-1))+EX-(EX)^2=\lambda^2+\lambda-\lambda^2=\lambda$.`,
      caption: String.raw`Slide $\lambda$. Left: the probabilities $e^{-\lambda}\lambda^k/k!$ (bars) against the frequencies of 2000 seeded draws (gold dots), with the mean $\lambda$ (green) and $\pm\sqrt\lambda$ (orange). Right: the factorial moments $E(X)_k$ on a log scale, exact $\lambda^k$ (line) against the sample estimates (gold). Mean and variance coincide for every $\lambda$.`,
      deps: ['prob-1.6.9a'],
      see: ['prob-3.6.1', 'stoch-9.4'],
      tags: ['distributions'],
      viz(v) {
        const M = v.M;
        const lS = v.slider('$\\lambda$', 0.3, 20, 3.5, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-0.7, 12], y: [0, 0.45], height: 300, weight: 1.4, axes: 'box', gutter: true, xlabel: '$k$', title: '$P(X=k)$ and sample frequencies' });
        const R = v.stage({ x: [0.5, 6.5], y: [1e-1, 1e8], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '$k$', title: 'factorial moments $E\\,X(X-1)\\cdots(X-k+1)$' });
        let st = null;
        v.render(() => {
          const lam = lS.value, D = M.dist.poisson(lam), r = v.rng(seed * 101 + 7), xs = D.sample(r, 2000);
          const kmax = Math.ceil(lam + 5 * Math.sqrt(lam) + 4), pmax = D.pmf(Math.floor(lam));
          L.setView([-0.7, kmax + 0.7], [0, pmax * 1.3]);
          const freq = new Array(kmax + 1).fill(0); for (const x of xs) if (x <= kmax) freq[x]++;
          for (let k = 0; k <= kmax; k++) { L.rect(k - 0.35, 0, k + 0.35, D.pmf(k), { fill: 'accent', fillAlpha: 0.45, stroke: false }); }
          L.dots(freq.map((c, k) => [k, c / xs.length]), { color: 'gold', r: 3.5 });
          L.vline(lam, { color: 'green', width: 2, dash: [6, 4] });
          L.line(lam - Math.sqrt(lam), pmax * 1.18, lam + Math.sqrt(lam), pmax * 1.18, { color: 'orange', width: 2.4 });
          L.text('±√λ', lam, pmax * 1.24, { size: 11, color: 'orange', align: 'center' });
          const fm = (k) => xs.reduce((s, x) => { let p = 1; for (let j = 0; j < k; j++) p *= x - j; return s + p; }, 0) / xs.length;
          const ex = [1, 2, 3, 4, 5, 6].map((k) => [k, lam ** k]), est = [1, 2, 3, 4, 5, 6].map((k) => [k, fm(k)]);
          R.setView(null, [Math.min(0.1, lam / 3), Math.max(10, lam ** 6 * 6)]);
          R.path(ex, { color: 'accent', width: 2.4 }); R.dots(ex, { color: 'accent', r: 4 });
          R.dots(est.filter((p) => p[1] > 0), { color: 'gold', r: 4.5 });
          const mean = M.mean(xs), vr = M.variance(xs);
          st = { lam, mean, vr };
          v.legend([['accent', 'exact: $P(X=k)$, $\\lambda^k$'], ['gold', 'from 2000 draws', { dot: true }], ['green', 'mean $\\lambda$', { dash: true }]]);
        });
        v.readout(() => st && `$EX=\\operatorname{var}(X)=\\lambda=${v.fix(st.lam, 2)}$; sample mean $${v.fix(st.mean, 3)}$, sample variance $${v.fix(st.vr, 3)}$.`);
      },
    },
    // ======================================================================== §1.7 Product measures, Fubini's theorem
    {
      num: '1.7.1',
      kind: 'Theorem',
      name: 'Existence and uniqueness of product measure',
      statement: String.raw`Let $(X,\mathcal A,\mu_1)$ and $(Y,\mathcal B,\mu_2)$ be $\sigma$-finite measure spaces, and let $\mathcal F=\mathcal A\times\mathcal B$ be the $\sigma$-field generated by the rectangles $A\times B$ ($A\in\mathcal A$, $B\in\mathcal B$). There is a unique measure $\mu=\mu_1\times\mu_2$ on $\mathcal F$ with
$$\mu(A\times B)=\mu_1(A)\,\mu_2(B)\quad\text{for all }A\in\mathcal A,\ B\in\mathcal B.$$
By induction the same holds for finitely many factors; for $n$ copies of Lebesgue measure on $\R$ it gives Lebesgue measure on the Borel sets of $\R^n$.`,
      idea: String.raw`Rectangles form a semialgebra, so by the extension theorem (1.1.9) it suffices to check countable additivity on rectangles. Suppose $A\times B=\bigsqcup_i(A_i\times B_i)$. For each $x\in A$ the sets $B_i$ with $x\in A_i$ partition $B$, so $1_A(x)\mu_2(B)=\sum_i1_{A_i}(x)\mu_2(B_i)$. Integrating in $x$ and exchanging sum and integral for nonnegative terms (Exercise 1.5.6) gives $\mu_1(A)\mu_2(B)=\sum_i\mu_1(A_i)\mu_2(B_i)$. In probability, $\mu_1\times\mu_2$ is the joint law of a pair of **independent** random variables.`,
      caption: String.raw`$\mu_1$ (horizontal) and $\mu_2$ (vertical) are two laws on $[0,1]$; the shading is the density of $\mu_1\times\mu_2$, or lines carrying mass when $\mu_2$ has atoms. Drag the disc $E$ and change its radius; slide the dyadic level $k$. Green squares lie inside $E$ and orange ones meet its edge; each square has mass $\mu_1(I)\mu_2(J)$. Right: the inner and outer sums against $k$ trap $\mu(E)$ ever more tightly, so the rectangles alone fix the measure of $E$. The gold dots are 400 independent pairs, and the readout compares their hit rate.`,
      deps: ['prob-1.1.9'],
      see: ['rca-8.7', 'prob-2.1.11'],
      tags: ['product measure'],
      viz(v) {
        const M = v.M, B1 = M.dist.beta(2, 4), B2 = M.dist.beta(3, 1.6);
        const ATOMS = [[0.25, 0.5], [0.6, 0.3], [0.85, 0.2]];
        const pair = v.select('', [{ value: 'dd', label: 'two densities' }, { value: 'da', label: 'density × atoms' }], 'dd');
        const rS = v.slider('radius', 0.08, 0.45, 0.28, { step: 0.01 });
        const kS = v.slider('level $k$', 1, 6, 3, { int: true });
        const S = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 380, axes: 'box', gutter: true, xlabel: '$x\\sim\\mu_1$', ylabel: '$y\\sim\\mu_2$', title: 'the product measure on $[0,1]^2$' });
        const R = v.stage({ x: [0.5, 8.5], y: [0, 1], height: 380, axes: 'box', gutter: true, xlabel: '$k$', title: 'inner and outer rectangle sums' });
        const C = S.handle(0.4, 0.62, { color: 'gold', label: 'E', constrain: (x, y) => [clampN(x, 0, 1), clampN(y, 0, 1)] });
        const r0 = v.rng(43), pairsU = Array.from({ length: 4000 }, () => [r0(), r0()]);
        const F1 = (x) => B1.cdf(clampN(x, 0, 1));
        let st = null;
        v.render(() => {
          const at = pair.value === 'da', cx = C.x, cy = C.y, rad = rS.value;
          const F2 = at ? (y) => ATOMS.reduce((s, [a, p]) => s + (a < y ? p : 0), 0) : (y) => B2.cdf(clampN(y, 0, 1));
          const inside = (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < rad * rad;
          if (at) {
            S.heat((x) => B1.pdf(x), { range: [0, 4], cmap: 'theme', color: 'accent', key: 'a1', rect: [0, 0, 1, 1], res: 3, alpha: 0.35 });
            for (const [a, p] of ATOMS) S.line(0, a, 1, a, { color: 'accent', width: 2 + 10 * p, alpha: 0.45 });
          } else S.heat((x, y) => B1.pdf(x) * B2.pdf(y), { range: [0, 5], cmap: 'theme', color: 'accent', key: 'dd', res: 3 });
          // grid squares at level k
          const k = kS.value, n = 2 ** k;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const x0 = i / n, x1 = (i + 1) / n, y0 = j / n, y1 = (j + 1) / n;
            const fx = Math.max(Math.abs(x0 - cx), Math.abs(x1 - cx)), fy = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy));
            const nx = clampN(cx, x0, x1) - cx, ny = clampN(cy, y0, y1) - cy;
            if (fx * fx + fy * fy < rad * rad) S.rect(x0, y0, x1, y1, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 0.6 });
            else if (nx * nx + ny * ny < rad * rad) S.rect(x0, y0, x1, y1, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 0.6 });
          }
          S.circle(cx, cy, rad, { color: 'ink', width: 2 });
          // sums for k = 1..8
          const sums = [];
          for (let kk = 1; kk <= 8; kk++) {
            const m = 2 ** kk; let inn = 0, out = 0;
            const m1 = Array.from({ length: m }, (_, i) => F1((i + 1) / m) - F1(i / m)), m2 = Array.from({ length: m }, (_, j) => F2((j + 1) / m) - F2(j / m));
            for (let i = 0; i < m; i++) { if (m1[i] <= 0) continue; const x0 = i / m, x1 = (i + 1) / m, fx = Math.max(Math.abs(x0 - cx), Math.abs(x1 - cx)), nx = clampN(cx, x0, x1) - cx; for (let j = 0; j < m; j++) { if (m2[j] <= 0) continue; const y0 = j / m, y1 = (j + 1) / m, fy = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy)), ny = clampN(cy, y0, y1) - cy; const w = m1[i] * m2[j]; if (fx * fx + fy * fy < rad * rad) { inn += w; out += w; } else if (nx * nx + ny * ny < rad * rad) out += w; } }
            sums.push([kk, inn, out]);
          }
          // reference value by sections (fine grid in x)
          const NX = 4000; let mu = 0;
          for (let i = 0; i < NX; i++) { const x = (i + 0.5) / NX, dx = x - cx; if (Math.abs(dx) >= rad) continue; const h = Math.sqrt(rad * rad - dx * dx); mu += (F1((i + 1) / NX) - F1(i / NX)) * (F2(cy + h) - F2(cy - h)); }
          // Monte Carlo with independent coordinates
          const draw = (u, w) => [B1.quantile(u), at ? (w < 0.5 ? 0.25 : w < 0.8 ? 0.6 : 0.85) : B2.quantile(w)];
          let hits = 0; const shown = [];
          pairsU.forEach(([u, w], idx) => { const p = draw(u, w); if (inside(p[0], p[1])) hits++; if (idx < 400) shown.push(p); });
          S.dots(shown, { color: 'gold', r: 1.8, alpha: 0.8 });
          R.setView(null, [0, Math.min(1, Math.max(...sums.map((s) => s[2])) * 1.2 + 0.02)]);
          R.hline(mu, { color: 'ink', width: 1.6, dash: [6, 4] });
          R.dots(sums.map((s) => [s[0], s[1]]), { color: 'green', r: 4.5 }); R.dots(sums.map((s) => [s[0], s[2]]), { color: 'orange', r: 4.5 });
          for (const s of sums) R.line(s[0], s[1], s[0], s[2], { color: s[0] === k ? 'gold' : 'faint', width: s[0] === k ? 3 : 1.5 });
          st = { inn: sums[k - 1][1], out: sums[k - 1][2], mu, mc: hits / pairsU.length, k };
          v.legend([['green', 'squares inside $E$', { area: true }], ['orange', 'squares on the edge', { area: true }], ['ink', '$\\mu(E)$', { dash: true }], ['gold', 'independent pairs', { dot: true }]]);
        });
        v.readout(() => st && `level $${st.k}$: $\\sum_{\\text{inside}}\\mu_1(I)\\mu_2(J) = ${v.fix(st.inn, 4)} \\le \\mu(E) = ${v.fix(st.mu, 4)} \\le ${v.fix(st.out, 4)}$; fraction of 4000 independent pairs in $E$: $${v.fix(st.mc, 4)}$.`);
      },
    },
    {
      num: '1.7.2',
      kind: 'Theorem',
      name: 'Fubini’s theorem',
      credit: 'Fubini, 1907; Tonelli, 1909',
      statement: String.raw`Let $\mu=\mu_1\times\mu_2$ be the product of two $\sigma$-finite measures on $X\times Y$. If $f\ge0$ or $\int|f|\,d\mu<\infty$, then
$$\int_X\int_Yf(x,y)\,\mu_2(dy)\,\mu_1(dx)=\int_{X\times Y}f\,d\mu=\int_Y\int_Xf(x,y)\,\mu_1(dx)\,\mu_2(dy).$$
Included is the fact that the sections $y\mapsto f(x,y)$ and the inner integrals $x\mapsto\int f(x,y)\,\mu_2(dy)$ are measurable. Without the hypothesis the two iterated integrals can be finite and different.`,
      idea: String.raw`The usual four steps. For $f=1_E$, the identity is Lemma 1.7.4 (with 1.7.3 for measurability of sections); linearity extends it to simple $f$. The dyadic approximants $([2^nf]/2^n)\wedge n\uparrow f$ and the monotone convergence theorem give it for $f\ge0$ (this case is often called Tonelli's theorem). For integrable $f$, apply it to $f^+$ and $f^-$ separately; their iterated integrals are finite, so they can be subtracted.`,
      caption: String.raw`Counting measure on $\{1,2,\dots\}^2$. The heat map shows $f(m,n)$, with $m$ across and $n$ up. Bars below are the **column sums** $\sum_nf(m,n)$ and bars on the right the **row sums** $\sum_mf(m,n)$, taken over the whole infinite row or column. Drag the gold cell to highlight its row and column. Sum the column sums or the row sums: for the joint law of two waiting times, and for an absolutely summable signed array, the totals agree. Durrett's staircase ($+1$ on the diagonal, $-1$ just right of it) gives $1$ by columns and $0$ by rows, since $\sum|f|=\infty$. The last choice is the continuous version, $e^{-xy}-2e^{-2xy}$ on $(0,1)\times(1,\infty)$.`,
      deps: ['prob-1.7.1', 'prob-1.5.7'],
      see: ['rca-8.8', 'vcalc-4.2', 'rca-1.27a'],
      tags: ['product measure', 'integration'],
      viz(v) {
        const N = 8, p = 0.35;
        const MODES = {
          pmf: { label: 'waiting times (≥ 0)', f: (m, n) => (m < n ? p * p * (1 - p) ** (n - 2) : 0), col: (m) => p * (1 - p) ** (m - 1), row: (n) => (n - 1) * p * p * (1 - p) ** (n - 2), tot: [1, 1], abs: 1 },
          sgn: { label: 'signed, $\\sum|f|<\\infty$', f: (m, n) => ((m + n) % 2 ? -1 : 1) / (2 ** m * n * n), col: (m) => ((m % 2 ? -1 : 1) / 2 ** m) * (-Math.PI * Math.PI / 12), row: (n) => ((n % 2 ? -1 : 1) / (n * n)) * (-1 / 3), tot: [Math.PI ** 2 / 36, Math.PI ** 2 / 36], abs: Math.PI ** 2 / 6 },
          st: { label: 'staircase', f: (m, n) => (m === n ? 1 : m === n + 1 ? -1 : 0), col: (m) => (m === 1 ? 1 : 0), row: () => 0, tot: [1, 0], abs: Infinity },
          cont: { label: '$e^{-xy}-2e^{-2xy}$', cont: true },
        };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'st');
        const S = v.stage({ x: [-0.4, N + 3.8], y: [-3.9, N + 0.4], equal: true, height: 470, axes: false });
        const H = S.handle(3.5, 3.5, { color: 'gold', r: 6, constrain: (x, y) => [Math.floor(clampN(x, 0, N - 0.01)) + 0.5, Math.floor(clampN(y, 0, N - 0.01)) + 0.5] });
        const cf = (x, y) => Math.exp(-x * y) - 2 * Math.exp(-2 * x * y);
        const phiX = (x) => (x < 1e-9 ? 1 : (Math.exp(-x) - Math.exp(-2 * x)) / x), psiY = (y) => (Math.exp(-2 * y) - Math.exp(-y)) / y;
        const Iphi = simpson(phiX, 0, 1, 2000), Ipsi = simpson(psiY, 1, 60, 20000);
        let st = null;
        v.render(() => {
          const Md = MODES[mode.value];
          const colX = N + 1.9, rowY = -2.0, sc = 1.4; // margins: row-sum bars around x = colX, column-sum bars around y = rowY
          S.line(N + 0.5, 0, N + 0.5, N, { color: 'grid', width: 1 }); S.line(0, -0.5, N, -0.5, { color: 'grid', width: 1 });
          S.line(colX, -0.1, colX, N + 0.1, { color: 'muted', width: 1 }); S.line(-0.1, rowY, N + 0.1, rowY, { color: 'muted', width: 1 });
          if (Md.cont) {
            H.visible = false;
            S.heat((x, y) => cf(x / N, 1 + (5 * y) / N), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', rect: [0, 0, N, N], key: 'cont', res: 2 });
            S.path(Array.from({ length: 201 }, (_, i) => { const x = (i / 200) * N; return [x, rowY + sc * 1.6 * phiX(x / N)]; }), { color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.2 });
            S.path([[0, rowY], ...Array.from({ length: 201 }, (_, i) => { const x = (i / 200) * N; return [x, rowY + sc * 1.6 * phiX(x / N)]; }), [N, rowY]], { fill: 'purple', fillAlpha: 0.18, stroke: false, close: true });
            const rp = Array.from({ length: 201 }, (_, i) => { const y = (i / 200) * N; return [colX + sc * 8 * psiY(1 + (5 * y) / N), y]; });
            S.path([[colX, 0], ...rp, [colX, N]], { fill: 'purple', fillAlpha: 0.18, stroke: false, close: true }); S.path(rp, { color: 'purple', width: 2 });
            S.text('x = 0', 0, -0.25, { size: 10.5, color: 'muted', baseline: 'top' }); S.text('1', N, -0.25, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
            S.text('y = 1', -0.15, 0.2, { size: 10.5, color: 'muted', align: 'right' }); S.text('6', -0.15, N - 0.2, { size: 10.5, color: 'muted', align: 'right' });
            S.text('∫ f dy', N / 2, rowY - 1.05, { size: 11.5, color: 'purple', align: 'center' }); S.text('∫ f dx', colX, N + 0.25, { size: 11.5, color: 'purple', align: 'center' });
            st = { cont: true, a: Iphi, b: Ipsi };
          } else {
            H.visible = true;
            const R = Math.max(...Array.from({ length: N * N }, (_, i) => Math.abs(Md.f((i % N) + 1, Math.floor(i / N) + 1)))) || 1;
            S.heat((x, y) => Md.f(Math.floor(x) + 1, Math.floor(y) + 1) / R, { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', rect: [0, 0, N, N], key: mode.value, res: 2 });
            for (let i = 0; i <= N; i++) { S.line(i, 0, i, N, { color: 'grid', width: 1 }); S.line(0, i, N, i, { color: 'grid', width: 1 }); }
            for (let m = 1; m <= N; m++) for (let n = 1; n <= N; n++) { const val = Md.f(m, n); if (val !== 0) S.text(mode.value === 'st' ? (val > 0 ? '+1' : '−1') : v.fix(val, 2).replace(/^(−?)0\./, '$1.'), m - 0.5, n - 0.5, { size: 10, align: 'center', color: 'ink' }); }
            const cm = Math.floor(H.x) + 1, rn = Math.floor(H.y) + 1;
            S.rect(cm - 1, 0, cm, N, { color: 'gold', width: 2 }); S.rect(0, rn - 1, N, rn, { color: 'gold', width: 2 });
            const cs = Array.from({ length: N }, (_, i) => Md.col(i + 1)), rs = Array.from({ length: N }, (_, i) => Md.row(i + 1));
            const scl = 1.5 / Math.max(1e-9, ...cs.map(Math.abs), ...rs.map(Math.abs));
            cs.forEach((c, i) => S.rect(i + 0.2, rowY, i + 0.8, rowY + c * scl, { fill: c >= 0 ? 'red' : 'blue', fillAlpha: i + 1 === cm ? 0.85 : 0.5, stroke: false }));
            rs.forEach((r, i) => S.rect(colX, i + 0.2, colX + r * scl, i + 0.8, { fill: r >= 0 ? 'red' : 'blue', fillAlpha: i + 1 === rn ? 0.85 : 0.5, stroke: false }));
            if (mode.value === 'st') { cs.forEach((c, i) => { if (!c) S.text('0', i + 0.5, rowY + 0.15, { size: 10, align: 'center', color: 'muted' }); }); rs.forEach((r, i) => S.text('0', colX + 0.2, i + 0.5, { size: 10, color: 'muted' })); }
            S.text('column sums Σₙ f(m,n)', N / 2, rowY - 1.65, { size: 11.5, color: 'muted', align: 'center' });
            S.text('row sums', colX, N + 0.25, { size: 11.5, color: 'muted', align: 'center' });
            S.text('m →', N - 0.1, -0.25, { size: 11, color: 'muted', align: 'right', baseline: 'top' }); S.text('n ↑', -0.15, N - 0.3, { size: 11, color: 'muted', align: 'right' });
            st = { cont: false, a: Md.tot[0], b: Md.tot[1], abs: Md.abs, cm, rn, cval: Md.col(cm), rval: Md.row(rn), win: Array.from({ length: N * N }, (_, i) => Math.abs(Md.f((i % N) + 1, Math.floor(i / N) + 1))).reduce((s, t) => s + t, 0) };
          }
          const ok = Math.abs(st.a - st.b) < 1e-9;
          S.text(`Σₘ Σₙ f = ${v.fix(st.a, 4)}`, N + 0.7, -2.9, { size: 12.5, color: 'ink' });
          S.text(`Σₙ Σₘ f = ${v.fix(st.b, 4)}`, N + 0.7, -3.5, { size: 12.5, color: ok ? 'green' : 'red' });
          if (st.cont) { S.text('∫∫ dy dx', N + 0.7, -2.3, { size: 11, color: 'muted' }); }
          v.legend([['red', 'positive', { area: true }], ['blue', 'negative', { area: true }], ['gold', 'chosen row and column']]);
        });
        v.readout(() => {
          if (!st) return '';
          if (st.cont) return `$\\int_0^1\\!\\int_1^\\infty f\\,dy\\,dx = ${v.fix(st.a, 4)} > 0$ but $\\int_1^\\infty\\!\\int_0^1 f\\,dx\\,dy = ${v.fix(st.b, 4)} < 0$ (Example 1.7.6): every vertical section integrates to something positive, every horizontal one to something negative, and $\\iint|f|=\\infty$.`;
          return `column $m=${st.cm}$ sums to $${v.fix(st.cval, 4)}$, row $n=${st.rn}$ to $${v.fix(st.rval, 4)}$. Totals: by columns $${v.fix(st.a, 4)}$, by rows $${v.fix(st.b, 4)}$; $\\sum|f| = ${isFinite(st.abs) ? v.fix(st.abs, 4) : '\\infty'}$ (this $8\\times8$ window alone: $${v.fix(st.win, 3)}$).` + (isFinite(st.abs) ? ' Integrable, so the orders agree.' : ' Not integrable, and the orders disagree.');
        });
      },
    },
    {
      num: '1.7.3',
      kind: 'Lemma',
      name: 'Sections of product-measurable sets are measurable',
      statement: String.raw`If $E\in\mathcal A\times\mathcal B$, then for every $x\in X$ the section $E_x=\{y:(x,y)\in E\}$ belongs to $\mathcal B$.`,
      idea: String.raw`Taking sections commutes with the set operations: $(E^c)_x=(E_x)^c$ and $\left(\bigcup_iE_i\right)_x=\bigcup_i(E_i)_x$. Hence the sets $E$ whose sections are all measurable form a $\sigma$-field. It contains every rectangle, since $(A\times B)_x$ is $B$ or $\emptyset$, so it contains the $\sigma$-field the rectangles generate. Every set built from rectangles by complements and countable unions therefore has sections built from the $B$'s in the same way.`,
      caption: String.raw`Step through a construction of a product-measurable set from rectangles: unions, a complement, a difference and a countable union of shrinking rectangles. Drag the gold line $x$. Right: the sections of the operands and of the result at that $x$. Each new section is obtained from the old ones by the same operation, applied on the $y$-axis, so it is always a finite or countable union of intervals.`,
      deps: ['prob-1.7.1'],
      see: ['rca-8.2', 'prob-1.7.2'],
      tags: ['product measure'],
      viz(v) {
        const R1 = (x, y) => x >= 0.1 && x <= 0.55 && y >= 0.15 && y <= 0.55;
        const R2 = (x, y) => x >= 0.35 && x <= 0.85 && y >= 0.4 && y <= 0.85;
        const R3 = (x, y) => y >= 0.62 && y <= 0.72;
        const Sk = (x, y) => { if (x < 0 || x >= 1) return false; const k = Math.floor(-Math.log2(1 - x)) + 1; return y < 2 ** -k; };
        const E1 = (x, y) => R1(x, y) || R2(x, y), E2 = (x, y) => !E1(x, y), E3 = (x, y) => E2(x, y) && !R3(x, y), E5 = (x, y) => E3(x, y) || Sk(x, y);
        const frames = [
          { E: R1, ops: [['A_1\\times B_1', R1]], line: 1, note: String.raw`A rectangle: its section is $B_1$ when $x\in A_1$, and empty otherwise.` },
          { E: E1, ops: [['R_1', R1], ['R_2', R2]], line: 2, note: String.raw`A union of rectangles: $(R_1\cup R_2)_x=(R_1)_x\cup(R_2)_x$.` },
          { E: E2, ops: [['E_1', E1]], line: 3, note: String.raw`A complement: $(E_1^c)_x=\big((E_1)_x\big)^c$.` },
          { E: E3, ops: [['E_2', E2], ['R_3', R3]], line: 4, note: String.raw`A difference: $(E_2\setminus R_3)_x=(E_2)_x\setminus(R_3)_x$.` },
          { E: Sk, ops: [['S_1', (x, y) => x < 0.5 && y < 0.5], ['S_2', (x, y) => x >= 0.5 && x < 0.75 && y < 0.25]], line: 5, note: String.raw`A countable union of rectangles $S_k=[1-2^{1-k},1-2^{-k})\times[0,2^{-k})$: the section is a countable union of sections.` },
          { E: E5, ops: [['E_3', E3], ['E_4', Sk]], line: 6, note: String.raw`The final set $E_3\cup E_4$; its section is still a union of intervals, hence in $\mathcal B$.` },
        ];
        const S = v.steps({ frames, code: ['$E_0=A_1\\times B_1$', '$E_1=E_0\\cup(A_2\\times B_2)$', '$E_2=E_1^{\\,c}$', '$E_3=E_2\\setminus(X\\times B_3)$', '$E_4=\\bigcup_k S_k$', '$E_5=E_3\\cup E_4$'], codeTitle: 'building $E$', start: 0, still: 3, speed: 0.8 });
        const P = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: 'the set $E$ in $X\\times Y=[0,1]^2$' });
        const Q = v.stage({ x: [0.3, 3.7], y: [0, 1], height: 330, axes: 'box', gutter: true, xticks: [], title: 'sections at the chosen $x$' });
        const X0 = P.handle(0.45, 0.97, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x) => [clampN(x, 0.005, 0.995), 0.97] });
        let st = null;
        v.render(() => {
          const f = S.frame, x0 = X0.x;
          P.heat((x, y) => (f.E(x, y) ? 1 : 0), { range: [0, 1.7], cmap: 'theme', color: 'accent', key: S.i, res: 2 });
          P.vline(x0, { color: 'gold', width: 1.6 });
          const sec = scanIntervals((y) => f.E(x0, y), 1000);
          for (const [a, b] of sec) P.line(x0, a, x0, b, { color: 'purple', width: 5 });
          // right panel: operands' sections then the result
          const cols = [...f.ops.map(([lab, E]) => [lab, scanIntervals((y) => E(x0, y), 1000), 'muted']), ['E_x', sec, 'purple']];
          const xs = cols.length === 2 ? [1.2, 2.8] : [0.9, 2, 3.1];
          cols.forEach(([lab, ints, col], i) => {
            Q.line(xs[i], 0, xs[i], 1, { color: 'grid', width: 1 });
            for (const [a, b] of ints) Q.rect(xs[i] - 0.18, a, xs[i] + 0.18, b, { fill: col === 'purple' ? 'purple' : 'accent', fillAlpha: col === 'purple' ? 0.75 : 0.45, stroke: false });
            Q.tex(i === cols.length - 1 ? '(E)_x' : `(${lab})_x`, xs[i], 0.04, { size: 13, color: col === 'purple' ? 'purple' : 'ink', baseline: 'bottom', plate: true });
          });
          st = { n: sec.length, len: sec.reduce((s, [a, b]) => s + b - a, 0) };
          v.legend([['accent', '$E$ and the operands’ sections', { area: true }], ['purple', 'the section $E_x$', { area: true }]]);
        });
        v.readout(() => st && `At $x=${v.fix(X0.x, 3)}$ the section $E_x$ is a union of ${st.n} interval${st.n === 1 ? '' : 's'} of total length $${v.fix(st.len, 4)}$${st.n ? '' : ' (empty)'}; at the countable-union steps, sections near $x=1$ are tiny intervals $[0,2^{-k})$.`);
      },
    },
    {
      num: '1.7.4',
      kind: 'Lemma',
      name: 'Measures of sections integrate to the product measure',
      statement: String.raw`If $E\in\mathcal A\times\mathcal B$, then $g(x)=\mu_2(E_x)$ is an $\mathcal A$-measurable function of $x$, and
$$\int_Xg\,d\mu_1=\mu(E),\qquad\mu=\mu_1\times\mu_2.$$`,
      idea: String.raw`If the conclusion holds for sets $E_n\uparrow E$, it holds for $E$, by Theorem 1.3.7 and monotone convergence; so by $\sigma$-finiteness we may assume $\mu$ is finite. The class $\mathcal L$ of sets for which it holds is closed under proper differences, since $\mu_2((A\setminus B)_x)=\mu_2(A_x)-\mu_2(B_x)$, and under increasing unions, so it is a $\lambda$-system. It contains the rectangles, a $\pi$-system generating $\mathcal A\times\mathcal B$, and Dynkin's $\pi$–$\lambda$ theorem finishes. A difference is needed here because $\mu(E_1\cup E_2)$ is not $\mu(E_1)+\mu(E_2)$ unless the sets are disjoint. For independent $X,Y$ and $E=\{x+y\le t\}$ the lemma computes the law of the sum: $P(X+Y\le t)=\int P(Y\le t-x)\,\mu_X(dx)$.`,
      caption: String.raw`$\mu_1,\mu_2$ are the laws of independent $X$ and $Y$, and $E=\{(x,y):x+y\le t\}$. Drag $t$ (gold, on the $x$-axis) and the section line $x$ (top). Left: the product law with $E$ shaded and the section $E_x$ in purple. Right: $g(x)=\mu_2(E_x)=P(Y\le t-x)$ (orange), weighted by $\mu_1$. The shaded area, or the sum of the stems when $\mu_1$ is Poisson, equals $\mu(E)=P(X+Y\le t)$. The readout checks it against the exact formula and 20,000 simulated pairs.`,
      deps: ['prob-1.7.3', 'prob-1.3.7', 'prob-1.5.7'],
      see: ['rca-8.6', 'prob-1.7.2', 'prob-2.1.15'],
      tags: ['product measure'],
      viz(v) {
        const M = v.M, Pz = M.dist.poisson(2);
        const PAIRS = {
          ee: { label: 'Exp(1) × Exp(1)', W: 6, f1: (x) => (x < 0 ? 0 : Math.exp(-x)), F2: (y) => (y <= 0 ? 0 : 1 - Math.exp(-y)), f2: (y) => (y < 0 ? 0 : Math.exp(-y)), exact: (t) => (t <= 0 ? 0 : 1 - Math.exp(-t) * (1 + t)), draw: (r) => [-Math.log(1 - r()), -Math.log(1 - r())] },
          pe: { label: 'Poisson(2) × Exp(1)', W: 6, atoms: Array.from({ length: 13 }, (_, k) => [k, Pz.pmf(k)]), F2: (y) => (y <= 0 ? 0 : 1 - Math.exp(-y)), f2: (y) => (y < 0 ? 0 : Math.exp(-y)), exact: (t) => { let s = 0; for (let k = 0; k <= t; k++) s += Pz.pmf(k) * (1 - Math.exp(-(t - k))); return s; }, draw: (r) => [Pz.sample(r), -Math.log(1 - r())] },
          uu: { label: 'U(0,1) × U(0,1)', W: 1.2, f1: (x) => (x >= 0 && x <= 1 ? 1 : 0), F2: (y) => clampN(y, 0, 1), f2: (y) => (y >= 0 && y <= 1 ? 1 : 0), exact: (t) => (t <= 0 ? 0 : t <= 1 ? (t * t) / 2 : t <= 2 ? 1 - ((2 - t) ** 2) / 2 : 1), draw: (r) => [r(), r()] },
        };
        const pair = v.select('', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'ee');
        const L = v.stage({ x: [-0.3, 6], y: [-0.3, 6], equal: true, height: 360, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: '$E=\\{x+y\\le t\\}$ and its section $E_x$' });
        const R = v.stage({ x: [-0.3, 6], y: [0, 1.05], height: 360, axes: 'box', gutter: true, xlabel: '$x$', title: '$g(x)=\\mu_2(E_x)$, integrated against $\\mu_1$' });
        const T = L.handle(2.5, 0, { color: 'gold', label: 't', labelPos: 'n', constrain: (x) => [clampN(x, 0.05, L.xr[1] - 0.05), L.yr[0] + 0.3 * 0] });
        const X0 = L.handle(1, 5.7, { color: 'purple', label: 'x', labelPos: 'e', constrain: (x) => [clampN(x, 0, L.xr[1] - 0.05), L.yr[1] - 0.06 * (L.yr[1] - L.yr[0])] });
        let last = null, cache = null, st = null;
        v.render(() => {
          const Pr = PAIRS[pair.value], W = Pr.W;
          if (last !== pair.value) { last = pair.value; L.setView([-0.05 * W, W], [-0.05 * W, W]); R.setView([-0.05 * W, W], null); T.x = W * 0.42; X0.x = W * 0.18; }
          T.y = 0; X0.y = W * 0.95;
          const t = T.x, x0 = X0.x;
          if (Pr.atoms) L.heat((x, y) => { const k = Math.round(x); return Math.abs(x - k) < 0.07 && k >= 0 ? Pz.pmf(k) * Pr.f2(y) : 0; }, { range: [0, 0.4], cmap: 'theme', color: 'accent', key: 'pe' + W, res: 2 });
          else L.heat((x, y) => Pr.f1(x) * Pr.f2(y), { range: [0, 1.25], cmap: 'theme', color: 'accent', key: pair.value, res: 3 });
          L.poly([[0, 0], [t, 0], [0, t]], { fill: 'orange', fillAlpha: 0.16, hatch: 'orange', hatchAlpha: 0.3, stroke: false });
          L.line(t + 0.2 * W, -0.2 * W, -0.2 * W, t + 0.2 * W, { color: 'orange', width: 1.6, dash: [6, 4] });
          L.vline(x0, { color: 'purple', width: 1, alpha: 0.6 });
          const top = pair.value === 'uu' ? Math.min(1, t - x0) : t - x0;
          if (top > 0) L.line(x0, 0, x0, top, { color: 'purple', width: 5 });
          // right panel: g and the weighting
          const g = (x) => Pr.F2(t - x);
          let I;
          if (Pr.atoms) {
            I = Pr.atoms.reduce((s, [k, pk]) => s + pk * g(k), 0);
            for (const [k, pk] of Pr.atoms) { if (k > W) break; R.line(k, 0, k, pk * g(k), { color: 'orange', width: 6, alpha: 0.75 }); R.line(k, 0, k, pk, { color: 'accent', width: 1.5, alpha: 0.6 }); R.dot(k, g(k), { color: 'orange', r: 3.5, hollow: true }); }
          } else {
            I = simpson((x) => Pr.f1(x) * g(x), 0, pair.value === 'uu' ? 1 : 40, 4000);
            R.fn(Pr.f1, { domain: [0, W], color: 'accent', width: 1.4, dash: [5, 4], n: 800 });
            R.fn((x) => Pr.f1(x) * g(x), { domain: [0, W], color: 'orange', width: 0.01, fill: 'orange', fillAlpha: 0.3, n: 800 });
          }
          R.fn(g, { domain: [-0.05 * W, W], color: 'orange', width: 2.4, n: 800 });
          R.vline(x0, { color: 'purple', width: 1.2, alpha: 0.7 }); R.dot(x0, g(x0), { color: 'purple', r: 5 });
          const key = pair.value + '|' + t;
          if (!cache || cache.key !== key) { const r = v.rng(59); let h = 0; for (let i = 0; i < 20000; i++) { const [a, b] = Pr.draw(r); if (a + b <= t) h++; } cache = { key, mc: h / 20000 }; }
          st = { I, exact: Pr.exact(t), mc: cache.mc, t, gx: g(x0), x0 };
          v.legend([['accent', pair.value === 'pe' ? '$\\mu_1$ (atoms)' : 'density of $\\mu_1$', { dash: true }], ['orange', '$g(x)=\\mu_2(E_x)$ and $g\\,d\\mu_1$', { area: true }], ['purple', 'section $E_x$']]);
        });
        v.readout(() => st && `$t=${v.fix(st.t, 2)}$: $\\int g\\,d\\mu_1 = ${v.fix(st.I, 4)}$, exact $P(X+Y\\le t) = ${v.fix(st.exact, 4)}$, simulated: $${v.fix(st.mc, 4)}$. At $x=${v.fix(st.x0, 2)}$: $\\mu_2(E_x) = ${v.fix(st.gx, 4)}$.`);
      },
    },
  ],
};
